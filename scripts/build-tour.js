#!/usr/bin/env bun
/**
 * Builds index.html (the guided tour, the site's front door) from three inputs:
 *
 *   api/adventure/portfolio-data.js   approved records, compiled from the New Portfolio folder
 *   adventure/content/world.json      the authored world: settings, scenes, media
 *   adventure/tour.template.html      the page itself
 *
 * The narrator may state only the facts that arrive here, so the tour can never
 * describe a project that is not approved. Run this after every compile:
 *
 *   bun "…/New Portfolio/_system/tools/portfolio.ts" compile --out api/adventure
 *   bun scripts/build-tour.js
 */
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const root = join(__dirname, '..');
const compiled = require(join(root, 'api/adventure/portfolio-data.js'));
const world = JSON.parse(readFileSync(join(root, 'adventure/content/world.json'), 'utf8'));
const template = readFileSync(join(root, 'adventure/tour.template.html'), 'utf8');

// The page wants each project flat: a date, one line of context, and a page to link to.
const projects = compiled.projects.map((p) => ({
  id: p.id,
  title: p.title,
  oneLine: p.oneLine,
  when: (p.dates && (p.dates.end || p.dates.start)) || '',
  context: [p.context && p.context.course, p.context && p.context.institution].filter(Boolean).join(' · '),
  tracks: p.tracks || [],
  themes: p.themes || [],
  factIds: p.factIds || [],
  page: `projects/${p.id}.html`,
  ...(p.ethansWords ? { ethansWords: Object.fromEntries(Object.entries(p.ethansWords).filter(([, v]) => v)) } : {}),
}));

const fail = (msg) => { console.error('build-tour: ' + msg); process.exitCode = 1; };

// Every id the world names has to exist, or the tour would cite something the records do not carry.
const ids = new Set(projects.map((p) => p.id));
for (const [id, m] of Object.entries(world.media)) if (!ids.has(m.project)) fail(`media ${id} belongs to unapproved project ${m.project}`);
for (const [id, s] of Object.entries(world.scenes)) {
  (s.factIds || []).forEach((f) => { if (!compiled.facts[f]) fail(`scene ${id} cites unknown fact ${f}`); });
  Object.values(s.records || {}).forEach((rec) => Object.values(rec).forEach((fs) => fs.forEach((f) => {
    if (!compiled.facts[f]) fail(`scene ${id} marks a line with unknown fact ${f}`);
  })));
  Object.values(s.stage || {}).forEach((cues) => cues.forEach(([, m]) => { if (!world.media[m]) fail(`scene ${id} shows unknown media ${m}`); }));
  (s.choices || []).forEach((c) => { if (c.go && !world.scenes[c.go]) fail(`scene ${id} offers a way to unknown scene ${c.go}`); });
}
for (const [id, s] of Object.entries(world.settings)) if (!world.scenes[s.start]) fail(`setting ${id} starts at unknown scene ${s.start}`);
if (process.exitCode) { console.error('build-tour: nothing written'); process.exit(1); }

const html = template
  .replace('/*BUILD:DATA*/', JSON.stringify({ facts: compiled.facts, projects }, null, 1))
  .replace('/*BUILD:WORLD*/', JSON.stringify(world, null, 1));
writeFileSync(join(root, 'index.html'), html);

console.log(`built index.html: ${projects.length} projects, ${Object.keys(compiled.facts).length} facts, ` +
  `${Object.keys(world.settings).length} places, ${Object.keys(world.scenes).length} scenes, ${Object.keys(world.media).length} media`);
console.log(`records compiled at ${compiled.generatedAt}`);
