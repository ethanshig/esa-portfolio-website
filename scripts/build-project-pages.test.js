/* Tests for scripts/build-project-pages.js — the scraper contract from
 * docs/story-layer-spec.md, asserted against the REAL approved records.
 *
 * A fixture would prove less than nothing here: the contract is a claim about
 * the pages this site actually ships, so the test drives the real data.
 *
 * Run: node scripts/build-project-pages.test.js
 */
const assert = require('assert');
const B = require('./build-project-pages.js');

const { projects, world, page } = B;
let pass = 0;
const test = (name, fn) => { try { fn(); pass++; } catch (e) {
  console.error('FAIL ' + name + '\n  ' + e.message); process.exitCode = 1; } };

// Scene → Record is 1:1 per ADR-0006; the generator owns that mapping, so use its.
const scenesFor = B.scenesFor;

const stripScripts = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');

for (const p of projects) {
  const html = page(p);
  const scenes = scenesFor(p.id);
  const narration = scenes.flatMap(([, s]) => [...(s.meet || []), ...(s.with || [])]);
  const crossings = scenes.flatMap(([, s]) => (s.choices || []).filter((c) => c.go));

  test(`${p.id}: every Narration line ships in the HTML`, () => {
    for (const line of narration) {
      assert.ok(html.includes(B.esc(line)), `missing narration line: ${line.slice(0, 60)}…`);
    }
  });

  test(`${p.id}: Narration is not injected by script`, () => {
    if (!narration.length) return;
    const bare = stripScripts(html);
    assert.ok(bare.includes(B.esc(narration[0])),
      'narration only appears inside <script> — contract says JS adds no text');
  });

  test(`${p.id}: every Crossing is one <a> carrying both labels`, () => {
    for (const c of crossings) {
      const target = world.scenes[c.go];
      if (!target) continue;
      const toProject = Object.entries(world.media)
        .find(([mid, m]) => Object.values(target.stage || {}).flat().some(([, s]) => s === mid));
      if (!toProject) continue;
      const dest = toProject[1].project;
      if (dest === p.id) continue;
      const re = new RegExp(`<a[^>]+href="${dest}\\.html"[\\s\\S]{0,400}?</a>`);
      const m = html.match(re);
      assert.ok(m, `no crossing anchor to ${dest}`);
      assert.ok(m[0].includes(B.esc(c.label)), `crossing to ${dest} lacks its narrative label`);
      assert.ok(/class="[^"]*crossing-plain/.test(m[0]), `crossing to ${dest} lacks its plain label`);
    }
  });

  test(`${p.id}: JSON-LD describes the work`, () => {
    const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(m, 'no JSON-LD block');
    const ld = JSON.parse(m[1]);
    assert.strictEqual(ld['@type'], 'CreativeWork');
    assert.strictEqual(ld.name, p.title);
    assert.ok(ld.description, 'no description');
    assert.ok(ld.creator && ld.creator.name, 'no creator');
    const drawings = Object.values(world.media).filter((x) => x.project === p.id);
    assert.strictEqual(([].concat(ld.image || [], ld.video || [])).length, drawings.length,
      `expected ${drawings.length} media objects, got ${([].concat(ld.image || [], ld.video || [])).length}`);
  });


  // A no-JS reader and a crawler must get ONE label per Crossing. The CSS can only
  // pick if the attribute it keys on is already on the page.
  test(`${p.id}: the story state is baked into the static HTML`, () => {
    assert.ok(/<html[^>]+data-story="on"/.test(html),
      'no data-story on <html> — with scripting off, CSS shows BOTH crossing labels');
  });

  // meet and with overlap by design; a reader must never be shown the same line twice.
  test(`${p.id}: no Narration line renders twice`, () => {
    const lines = [...html.matchAll(/<p class="narration-line"[^>]*data-mode="(\w+)"[^>]*>([^<]*)</g)];
    const visible = lines.filter(([, mode]) => mode === 'meet').map(([, , t]) => t);
    const dupes = visible.filter((t, i) => visible.indexOf(t) !== i);
    assert.strictEqual(dupes.length, 0, `duplicated on arrival: ${dupes[0] || ''}`);
  });

  test(`${p.id}: a video is not described as an image`, () => {
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    for (const m of [].concat(ld.image || [], ld.video || [])) {
      const isVideo = /\.(mp4|webm|mov)$/.test(m.contentUrl);
      assert.strictEqual(m['@type'], isVideo ? 'VideoObject' : 'ImageObject',
        `${m.contentUrl} typed as ${m['@type']}`);
    }
  });

  test(`${p.id}: alt text is never fabricated`, () => {
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const byUrl = {};
    for (const m of Object.values(world.media)) byUrl['../' + m.src] = m;
    for (const m of [].concat(ld.image || [], ld.video || [])) {
      const src = byUrl[m.contentUrl];
      if (src && !src.alt) assert.ok(!m.description,
        `${m.contentUrl} has no alt in world.json but JSON-LD invented one`);
    }
  });

  test(`${p.id}: the Document is complete regardless of Narration`, () => {
    for (const [field, title] of [['story', 'The story'], ['whatIDid', 'What I did'],
      ['process', 'Process'], ['outcome', 'Outcome'], ['reflection', 'Reflection']]) {
      if (p[field]) assert.ok(html.includes(title), `missing section ${title}`);
    }
  });
}

// mylo-to-go and genealogy have no narration: the page must still be whole.
test('a Record with no Narration still renders the full Document', () => {
  const quiet = projects.find((p) => p.id === 'mylo-to-go');
  const html = page(quiet);
  assert.ok(html.includes('The story') && html.includes('Process'), 'quiet page lost its sections');
});

if (!process.exitCode) console.log(`ok — ${pass} assertions passed`);
