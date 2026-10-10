/* Link-graph tests for the site as shipped (docs/story-layer-spec.md, "URLs").
 *
 * The URL swap changes what index.html MEANS without changing its address, so the
 * risk is not a 404 but a page still behaving as though the tour were the front
 * door. These assert both.
 *
 * Run: node scripts/site-links.test.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pages = fs.readdirSync(root).filter((f) => f.endsWith('.html'))
  .concat(fs.readdirSync(path.join(root, 'projects')).filter((f) => f.endsWith('.html')).map((f) => 'projects/' + f));

let pass = 0;
const test = (name, fn) => { try { fn(); pass++; } catch (e) {
  console.error('FAIL ' + name + '\n  ' + e.message); process.exitCode = 1; } };

const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const hrefs = (html) => [...html.matchAll(/(?:href|src)="([^"#?:]+)(?:[#?][^"]*)?"/g)]
  .map((m) => m[1]).filter((h) => !/^(https?:|mailto:|tel:|data:|\/\/)/.test(h));

// Pre-existing breakage, pinned so a NEW one still fails the suite. Not inherited
// silently: images/profile-photo.jpg was never committed, so about.html has shown a
// broken image since it was written. Ethan owes it a photo, or the <img> should go.
const KNOWN_BROKEN = new Set(['about.html -> images/profile-photo.jpg']);

test('every internal link resolves to a file that exists', () => {
  const broken = [];
  for (const p of pages) {
    const dir = path.dirname(path.join(root, p));
    for (const h of hrefs(read(p))) {
      const target = path.resolve(dir, h);
      const ref = `${p} -> ${h}`;
      if (!fs.existsSync(target) && !KNOWN_BROKEN.has(ref)) broken.push(ref);
    }
  }
  assert.strictEqual(broken.length, 0, 'broken links:\n    ' + broken.join('\n    '));
});

test('index.html is the landing page, not the tour', () => {
  const h = read('index.html');
  assert.ok(/class="ls-home/.test(h), 'index.html does not carry the landing');
  assert.ok(!/ASK_ENDPOINT|tour\.template/.test(h), 'index.html still carries the tour');
});

test('no page offers the guided tour any more', () => {
  const offenders = [];
  for (const p of pages) {
    const h = read(p);
    if (/Take the guided tour|Walk into this one instead/.test(h)) offenders.push(p);
  }
  assert.strictEqual(offenders.length, 0, 'still offering the tour: ' + offenders.join(', '));
});

test('adventure.html and home.html redirect rather than 404', () => {
  for (const p of ['adventure.html', 'home.html']) {
    const h = read(p);
    assert.ok(/http-equiv="refresh"/i.test(h) && /index\.html/.test(h),
      `${p} does not redirect to index.html`);
  }
});

test('the story control is on the front door and on every project page', () => {
  assert.ok(/class="story-toggle"/.test(read('index.html')),
    'index.html has no story control — it is the only hint the site gives');
  for (const p of pages.filter((x) => x.startsWith('projects/'))) {
    if (/http-equiv="refresh"/i.test(read(p))) continue;   // the legacy project1-3 redirects
    assert.ok(/class="story-toggle"/.test(read(p)), `${p} has no story control`);
  }
});

test('build-tour.js is retired', () => {
  assert.ok(!fs.existsSync(path.join(root, 'scripts/build-tour.js')),
    'build-tour.js still exists and would clobber index.html if run');
});

if (!process.exitCode) console.log(`ok — ${pass} assertions passed`);
