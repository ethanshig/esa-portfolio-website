#!/usr/bin/env bun
/**
 * Writes projects/<id>.html for every approved public record, and rewrites the
 * card list in projects.html to match. Inputs:
 *
 *   api/adventure/portfolio.public.json   approved records: prose, facts, media
 *   adventure/content/world.json          the web copies of media (images/tour/…) with alt text
 *
 * A record's media manifest points at master files in the New Portfolio folder
 * (PSD, PDF, AI). Only media that already has a web copy in the tour is placed
 * on a page; anything else is reported so it can be exported.
 */
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const root = join(__dirname, '..');
const { projects } = JSON.parse(readFileSync(join(root, 'api/adventure/portfolio.public.json'), 'utf8'));
const world = JSON.parse(readFileSync(join(root, 'adventure/content/world.json'), 'utf8'));

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const webMedia = (id) => Object.entries(world.media).filter(([, m]) => m.project === id).map(([mid, m]) => ({ mid, ...m }));

// Markdown-ish record prose → HTML. Records use paragraphs, "- " bullets and **bold**.
function prose(text) {
  if (!text) return '';
  const out = [];
  let list = null;
  for (const raw of String(text).split('\n')) {
    const line = raw.trim();
    if (!line) { if (list) { out.push(`<ul class="project-list">${list.join('')}</ul>`); list = null; } continue; }
    const inline = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
    if (line.startsWith('- ')) { (list = list || []).push(`<li>${inline(line.slice(2))}</li>`); continue; }
    if (list) { out.push(`<ul class="project-list">${list.join('')}</ul>`); list = null; }
    out.push(`<p class="project-text">${inline(line)}</p>`);
  }
  if (list) out.push(`<ul class="project-list">${list.join('')}</ul>`);
  return out.join('\n                ');
}

const section = (title, body) => (body ? `
            <section class="project-section">
                <h2 class="project-section-title">${esc(title)}</h2>
                ${body}
            </section>` : '');


const missing = [];

// --- the story layer (ADR-0006) ------------------------------------------------
// A Scene belongs to exactly one Record. The link is its staged media, which is the
// only place world.json and the records agree on an id.
const stagedIn = (scene) => Object.values(scene.stage || {}).flat().map(([, mid]) => mid);

// ADR-0006 makes Scene-to-Record 1:1. Say so out loud: a Scene that stages two
// projects would silently attach its Narration to whichever sorted first.
function sceneProject(scene, sid) {
  const owners = [...new Set(stagedIn(scene).map((mid) => (world.media[mid] || {}).project).filter(Boolean))];
  if (owners.length > 1) missing.push(`scene ${sid || '?'} stages media from ${owners.length} records (${owners.join(', ')}); Scene-to-Record must be 1:1`);
  return owners[0] || null;
}
const scenesFor = (id) => Object.entries(world.scenes).filter(([sid, sc]) => sceneProject(sc, sid) === id);

// Narration ships in the HTML and is hidden by CSS, never injected. meet and with
// overlap on purpose - meet introduces Ethan, with assumes a reader already has -
// so both ship and `data-arrival` on <html> decides which one a reader sees.
function narration(id) {
  const lines = [];
  for (const [sid, sc] of scenesFor(id)) {
    for (const mode of ['meet', 'with']) {
      for (const line of sc[mode] || []) {
        lines.push(`<p class="narration-line" data-scene="${esc(sid)}" data-mode="${mode}">${esc(line)}</p>`);
      }
    }
  }
  return lines.length ? `
            <div class="narration">
                ${lines.join('\n                ')}
            </div>` : '';
}

// One anchor per destination, carrying both labels. CSS decides which one shows.
// "Related work" is the heading; the label is the destination's title.
function crossings(id) {
  const seen = new Set();
  const out = [];
  for (const [, sc] of scenesFor(id)) {
    for (const c of sc.choices || []) {
      if (!c.go) continue;
      const target = world.scenes[c.go];
      if (!target) { missing.push(`${id}: crossing points at unknown scene ${c.go}`); continue; }
      const dest = sceneProject(target, c.go);
      if (!dest || dest === id) continue;
      if (seen.has(dest)) { missing.push(`${id}: a second crossing to ${dest} ("${c.label}") was dropped`); continue; }
      seen.add(dest);
      const rec = projects.find((x) => x.id === dest);
      out.push(`                <a href="${esc(dest)}.html" class="crossing">
                    <span class="crossing-narrative">${esc(c.label)}</span>
                    <span class="crossing-plain">${esc(rec ? rec.title : dest)}</span>
                </a>`);
    }
  }
  return out.length ? `
            <nav class="crossings" aria-labelledby="crossings-heading">
                <h2 class="project-section-title crossing-plain" id="crossings-heading">Related work</h2>
${out.join('\n')}
            </nav>` : '';
}

function jsonLd(p) {
  const media = webMedia(p.id);
  const describe = (m) => {
    if (!m.alt) missing.push(`${p.id}: media ${m.mid} has no alt text; JSON-LD will omit a description`);
    return {
      '@type': /\.(mp4|webm|mov)$/.test(m.src) ? 'VideoObject' : 'ImageObject',
      contentUrl: `../${m.src}`,
      name: m.label || p.title,
      description: m.alt || undefined,
    };
  };
  const described = media.map(describe);
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: p.title,
    description: p.oneLine,
    creator: { '@type': 'Person', name: 'Ethan Shig Anderson' },
    dateCreated: (p.dates && p.dates.start) || undefined,
    temporalCoverage: p.dates && p.dates.start && p.dates.end ? `${p.dates.start}/${p.dates.end}` : undefined,
    about: p.tracks || [],
    keywords: (p.themes || []).join(', ') || undefined,
    image: described.filter((m) => m['@type'] === 'ImageObject'),
    video: described.filter((m) => m['@type'] === 'VideoObject'),
  };
  if (!ld.video.length) delete ld.video;
  if (p.context && p.context.institution) {
    ld.sourceOrganization = { '@type': 'Organization', name: p.context.institution };
  }
  return `
    <script type="application/ld+json">${JSON.stringify(ld, (k, v) => (v === undefined ? undefined : v), 2)}</script>`;
}

function page(p) {
  const media = webMedia(p.id);
  const hero = media.find((m) => m.kind === 'image') || media[0];
  const rest = media.filter((m) => m !== hero);
  (p.media || []).forEach((m) => {
    if (!media.some((w) => w.label === m.label)) missing.push(`${p.id}: "${m.label}" has no web copy`);
  });
  const when = (p.dates && (p.dates.end || p.dates.start) || '').slice(0, 4);
  const meta = [p.context && p.context.course, p.context && p.context.institution, when].filter(Boolean);
  return `<!DOCTYPE html>
<html lang="en" data-story="on" data-arrival="cold">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${esc(p.oneLine)}">
    <title>${esc(p.title)} | Ethan Anderson</title>
    <link rel="icon" href="../images/favicon.svg">
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/project.css">
    <link rel="stylesheet" href="../css/grid-system.css">
    <link rel="stylesheet" href="../css/line-system.css">
    <link rel="stylesheet" href="../css/story.css">
    <!-- Attribute-only, before paint: applies a stored preference and steps the inline
         Narration back, so nothing flashes. It writes no text (spec contract 1). -->
    <script>(function(){var r=document.documentElement;try{var q=new URLSearchParams(location.search).get('story');var v=(q==='off'||q==='on')?q:localStorage.getItem('esa-story');if(v==='off'||v==='on')r.setAttribute('data-story',v);}catch(e){}r.classList.add('narration-held');}())</script>
    <!-- Generated by scripts/build-project-pages.js from the approved record. Do not edit by hand. -->${jsonLd(p)}
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <a href="../index.html" class="logo">esa</a>
            <ul class="nav-menu">
                <li><a href="../projects.html" class="nav-link">Projects</a></li>
                <li><a href="../about.html" class="nav-link">About</a></li>
                <li><a href="../resume.html" class="nav-link">Résumé</a></li>
                <li><a href="../contact.html" class="nav-link">Contact</a></li>
                <li><button type="button" class="story-toggle" aria-pressed="true"><span class="is-on">Story on</span><span class="is-off">Story off</span></button></li>
            </ul>
            <div class="hamburger"><span></span><span></span><span></span></div>
        </div>
    </nav>
${hero ? `
    <section class="project-hero">
        <div class="project-hero-image">
            <img src="../${esc(hero.src)}" alt="${esc(hero.alt)}">
        </div>
    </section>` : ''}

    <article class="project-detail">
        <div class="container">
            <header class="project-header">
                <p class="project-eyebrow">${esc(meta.join(' · '))}</p>
                <h1 class="project-title-large">${esc(p.title)}</h1>
                <p class="project-lead">${esc(p.oneLine)}</p>
                <div class="project-meta">
                    ${p.role ? `<span class="project-meta-item"><strong>Role</strong> ${esc(p.role)}</span>` : ''}
                    ${(p.team && p.team.length) ? `<span class="project-meta-item"><strong>Team</strong> ${esc(p.team.join(', '))}</span>` : ''}
                    ${(p.tools && p.tools.length) ? `<span class="project-meta-item"><strong>Tools</strong> ${esc(p.tools.join(', '))}</span>` : ''}
                </div>
            </header>
${section('The story', prose(p.story))}
${section('What I did', prose(p.whatIDid))}
${section('Process', prose(p.process))}
${section('Outcome', prose(p.outcome))}
${section('Reflection', prose(p.reflection))}
${rest.length ? `
            <section class="project-gallery">
                <h2 class="project-section-title">Drawings</h2>
                ${rest.map((m) => m.kind === 'video'
                  ? `<figure class="project-figure"><video src="../${esc(m.src)}" muted loop playsinline controls aria-label="${esc(m.alt)}"></video><figcaption>${esc(m.label)}. ${esc(m.alt)}</figcaption></figure>`
                  : `<figure class="project-figure"><img src="../${esc(m.src)}" alt="${esc(m.alt)}" loading="lazy"><figcaption>${esc(m.label)}</figcaption></figure>`).join('\n                ')}
            </section>` : ''}

${narration(p.id)}
${crossings(p.id)}

            <nav class="project-navigation">
                <a href="../projects.html" class="project-nav-link">All projects</a>
            </nav>
        </div>
    </article>

    <footer class="footer">
        <div class="container"><p>Ethan Shig Anderson · <a href="../contact.html">Contact</a></p></div>
    </footer>
    <script src="../js/story.js"></script>
    <script src="../js/line-system.js"></script>
    <!-- Without this the line system never mounts and the page falls back to the old
         153px navbar, which is why the project pages used to carry a different nav
         from every other page on the site. -->
    <script>document.addEventListener('DOMContentLoaded', function () { LineSystem.init(); });</script>
</body>
</html>
`;
}

function run() {
for (const p of projects) writeFileSync(join(root, 'projects', `${p.id}.html`), page(p));

// projects.html keeps its shell; only the card grid is rewritten.
const listPath = join(root, 'projects.html');
let list = readFileSync(listPath, 'utf8');
const cards = projects.map((p) => {
  const m = webMedia(p.id).find((x) => x.kind === 'image');
  const when = (p.dates && (p.dates.end || p.dates.start) || '').slice(0, 4);
  return `                <article class="project-card" data-category="${esc((p.tracks || []).join(' '))}">
                    <a href="projects/${esc(p.id)}.html" class="project-link">
                        ${m ? `<div class="project-image"><img src="${esc(m.src)}" alt="${esc(m.alt)}" loading="lazy">
                            <div class="project-overlay"><span class="view-project">View Project →</span></div>
                        </div>` : ''}
                        <div class="project-info">
                            <h3 class="project-title">${esc(p.title)}</h3>
                            <p class="project-category">${esc([p.context && p.context.course, when].filter(Boolean).join(' · '))}</p>
                            <p class="project-description">${esc(p.oneLine)}</p>
                        </div>
                    </a>
                </article>`;
}).join('\n');

const gridRe = /(<section class="projects-grid[\s\S]*?<div class="grid">\n)([\s\S]*?)(\n\s*<\/div>\n\s*<\/div>\n\s*<\/section>)/;
if (!gridRe.test(list)) { console.error('build-project-pages: could not find the projects grid in projects.html'); process.exit(1); }
list = list.replace(gridRe, (_, open, __, close) => `${open}${cards}${close}`);

// The filter buttons came from the template and named categories Ethan does not work in.
// They now come from the tracks the approved records actually carry.
const label = { architecture: 'Architecture', ecology: 'Ecology', 'outdoor-product': 'Outdoor product', computational: 'Computational', accessibility: 'Accessibility' };
const tracks = [...new Set(projects.flatMap((p) => p.tracks || []))];
const buttons = ['                <button class="filter-btn active" data-filter="all">All projects</button>']
  .concat(tracks.map((t) => `                <button class="filter-btn" data-filter="${esc(t)}">${esc(label[t] || t)}</button>`)).join('\n');
const btnRe = /(<div class="filter-buttons">\n)([\s\S]*?)(\n\s*<\/div>)/;
if (btnRe.test(list)) list = list.replace(btnRe, (_, open, __, close) => `${open}${buttons}${close}`);
else console.warn('warning: filter buttons not found; left as they were');

writeFileSync(listPath, list);

// The slideshow on projects.html reads the same records.
const slides = projects.map((p) => {
  const m = webMedia(p.id).find((x) => x.kind === 'image');
  return {
    id: p.id, title: p.title,
    year: ((p.dates && (p.dates.end || p.dates.start)) || '').slice(0, 4),
    category: (p.context && p.context.course) || (p.tracks || [])[0] || '',
    description: p.oneLine,
    image: m ? m.src : '',
    link: `projects/${p.id}.html`,
  };
});
writeFileSync(join(root, 'js/projects-data.js'),
  '// Generated by scripts/build-project-pages.js from the approved records. Do not edit by hand.\n' +
  `window.PROJECTS_DATA = ${JSON.stringify(slides, null, 2)};\n`);

console.log(`built ${projects.length} project pages, ${slides.length} slides, and rewrote the card list in projects.html`);
missing.forEach((w) => console.warn('warning: ' + w));
}


// Required as a module by scripts/build-project-pages.test.js, which drives these
// against the real approved records - the scraper contract is a claim about the
// actual pages, so a fixture would prove less than nothing.
if (require.main === module) run();
module.exports = { run, page, esc, projects, world, scenesFor, missing };
