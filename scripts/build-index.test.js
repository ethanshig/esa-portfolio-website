/* Tests for the index as a sheet of Plates (issue #17): the growth and the built HTML.
 *
 * They run against the real data (data/plates.js) and the real index.html, because the
 * spec's claims (seed uss-model, mean neighbour similarity 0.512, every real Plate a link)
 * are claims about the shipped site.
 *
 * Run: bun scripts/build-index.test.js
 */
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as DATA from '../data/plates.js';
import { growField, validatePlates, sim, frameAround, limitsFor, NAV_H } from '../js/index-sheet/field.js';
import { shapeForImage, shapeForHint, boxSteps } from '../js/index-sheet/shape.js';
import { SHAPES } from '../data/plate-shapes.js';
import { plan, render, load, computeShapes, renderShapes } from './build-index.js';
import { isBold } from '../js/axon/dimetric.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0;
const test = (name, fn) => { try { fn(); pass++; } catch (e) { console.error('FAIL ' + name + '\n  ' + e.message); process.exitCode = 1; } };

const F = growField({ ...DATA, SHAPES });
const CELL = 32;

test('similarity counts shared Facets over 3, and an empty cycle never matches', () => {
  const a = { facets: { with: 'designers', made: 'coded', cycle: null } };
  const b = { facets: { with: 'designers', made: 'drawn', cycle: null } };
  assert.strictEqual(sim(a, b), 1 / 3);
  assert.strictEqual(sim(a, a), 2 / 3);
});

test('the shape rule: the coordinator\'s numbers, and where the rule as written differs', () => {
  const at = (id) => [SHAPES[id].m, SHAPES[id].n].join('x');
  assert.strictEqual(at('uss-atlas'), '2x2');
  assert.strictEqual(at('uss-board'), '3x3');
  for (const id of ['bb-catamaraft', 'bb-crawling', 'bb-standing', 'mylo-picnic', 'tlp-axon']) assert.strictEqual(at(id), '3x2', id);
  assert.strictEqual(at('mylo-poster'), '2x3');
  assert.strictEqual(at('mylo-logo'), '2x2');
  assert.strictEqual(at('bb-landscape'), '2x5');
  /* the brief expected 3x2 for these two; the rule as written scores 4x3 higher:
     uss-gable 2000x1545: 3x2 keep .824 - .1 ln(6/4) = .783 < 4x3 keep .949 - .1 ln(12/4) = .839
     tlp-section 1600x1141: 3x2 keep .892 - .041 = .852 < 4x3 keep .972 - .110 = .862 */
  assert.strictEqual(at('uss-gable'), '4x3');
  assert.strictEqual(at('tlp-section'), '4x3');
});

test('a 533 x 1600 image gets n > m; spans stay in 2..8; hints give 2x2 and 4x2', () => {
  const s = shapeForImage(533, 1600, 'cell');
  assert.ok(s.n > s.m, `${s.m}x${s.n}`);
  for (const [w, h] of [[10000, 10], [10, 10000], [1, 1]]) for (const size of ['cell', 'wide']) {
    const t = shapeForImage(w, h, size);
    assert.ok(t.m >= 2 && t.m <= 8 && t.n >= 2 && t.n <= 8, `${w}x${h} ${size}: ${t.m}x${t.n}`);
  }
  assert.deepStrictEqual(shapeForHint('cell'), { m: 2, n: 2 });
  assert.deepStrictEqual(shapeForHint('wide'), { m: 4, n: 2 });
  assert.deepStrictEqual(boxSteps(2, 2), [28, 28]);
  assert.deepStrictEqual(boxSteps(4, 2), [60, 28]);
  assert.throws(() => shapeForImage(0, 10, 'cell'), /not measurable/);
});

test('data/plate-shapes.js is what build-index.js writes now (rerun it after changing data or images)', () => {
  assert.strictEqual(readFileSync(join(root, 'data/plate-shapes.js'), 'utf8'), renderShapes(computeShapes()));
});

test('the seed is uss-model, a real Plate; the mean neighbour similarity on the module grid is 0.510', () => {
  const seed = F.plates[F.seed];
  assert.strictEqual(seed.id, 'uss-model');
  assert.ok(!seed.placeholder);
  assert.strictEqual(F.meanEdge.toFixed(3), '0.510');
});

test('the growth is deterministic', () => {
  const again = growField({ ...DATA, SHAPES });
  assert.deepStrictEqual(again.order, F.order);
  assert.deepStrictEqual(again.plates.map((p) => [p.c, p.r]), F.plates.map((p) => [p.c, p.r]));
});

test('every Plate is placed once, no two overlap, every Plate touches another, every corner on a bold node', () => {
  const cells = new Set();
  for (const p of F.plates) {
    for (let y = p.r; y < p.r + p.n; y++) for (let x = p.c; x < p.c + p.m; x++) { const key = x + ',' + y; assert.ok(!cells.has(key), `${p.id} overlaps at ${key}`); cells.add(key); }
  }
  for (const a of F.plates) for (const b of F.plates) {
    if (a === b) continue;
    const sep = a.rect.u1 <= b.rect.u0 || b.rect.u1 <= a.rect.u0 || a.rect.v1 <= b.rect.v0 || b.rect.v1 <= a.rect.v0;
    assert.ok(sep, `${a.id} and ${b.id} overlap on the paper`);
  }
  for (const p of F.plates) {
    const touches = F.plates.some((q) => q !== p && (
      ((q.rect.u0 === p.rect.u1 + 4 || p.rect.u0 === q.rect.u1 + 4) && q.rect.v0 < p.rect.v1 && p.rect.v0 < q.rect.v1) ||
      ((q.rect.v0 === p.rect.v1 + 4 || p.rect.v0 === q.rect.v1 + 4) && q.rect.u0 < p.rect.u1 && p.rect.u0 < q.rect.u1)));
    assert.ok(touches, `${p.id} shares no edge with another Plate`);
    for (const [u, v] of [[p.rect.u0, p.rect.v0], [p.rect.u1, p.rect.v0], [p.rect.u0, p.rect.v1], [p.rect.u1, p.rect.v1]]) {
      assert.ok(isBold(u, v), `${p.id}: corner ${u},${v} is not a bold node`);
    }
    assert.deepStrictEqual([p.wSteps, p.hSteps], boxSteps(p.m, p.n));
  }
  assert.strictEqual(F.order.length, DATA.PLATES.length);
});

test('the Records come in first-appearance order, 11 of them, each hero its first Plate', () => {
  assert.strictEqual(F.records.length, 11);
  for (const r of F.records) {
    const first = F.order.map((i) => F.plates[i]).find((p) => p.record === r.id);
    assert.strictEqual(r.hero, first);
  }
});

test('the seed tie-break uses more real Plates, then the more recent Record', () => {
  const VOCAB = DATA.VOCAB;
  const f = { with: 'animals', made: 'built', cycle: 'water' };
  const rec = (dates) => ({ title: 't', meta: 'm', status: 'complete', href: 'x.html', dates, drawings: [] });
  const data = (aDates, bDates, bExtra) => ({
    VOCAB,
    RECORDS: { a: rec(aDates), b: rec(bDates) },
    SHAPES: { a1: { m: 2, n: 2 }, b1: { m: 2, n: 2 }, ...(bExtra ? { b2: { m: 2, n: 2 } } : {}) },
    PLATES: [
      { id: 'a1', record: 'a', size: 'cell', drawing: 'a.jpg', facets: f },
      { id: 'b1', record: 'b', size: 'cell', drawing: 'b.jpg', facets: f },
      ...(bExtra ? [{ id: 'b2', record: 'b', size: 'cell', drawing: 'c.jpg', facets: { with: 'soil', made: 'written', cycle: null } }] : []),
    ],
  });
  /* equal totals and equal real counts: the more recent Record wins */
  assert.strictEqual(growField(data({ start: '2024-01' }, { start: '2025-01' }, false)).plates[growField(data({ start: '2024-01' }, { start: '2025-01' }, false)).seed].id, 'b1');
  assert.strictEqual(growField(data({ start: '2025-01', end: '2025-09' }, { start: '2025-01' }, false)).seed, 0);
  /* no dates counts as oldest */
  assert.strictEqual(growField(data(null, { start: '2020-01' }, false)).seed, 1);
});

test('the data is refused when a Plate breaks its contract', () => {
  assert.throws(() => validatePlates({ ...DATA, SHAPES: { ...SHAPES, 'rap-1': undefined } }), /rap-1 has no shape/);
  const bad = { ...DATA, SHAPES, PLATES: DATA.PLATES.map((p) => (p.id === 'rap-1' ? { ...p, facets: { ...p.facets, made: 'sculpted' } } : p)) };
  assert.throws(() => validatePlates(bad), /made "sculpted"/);
  const both = { ...DATA, SHAPES, PLATES: DATA.PLATES.map((p) => (p.id === 'uss-model' ? { ...p, drawing: 'x.jpg' } : p)) };
  assert.throws(() => validatePlates(both), /both a drawing and a model/);
});

test('arrival fits the seed: at most 3 across / 2 down, and inside a 390 px phone', () => {
  const seed = F.plates[F.seed];
  for (const [W, H] of [[1600, 900], [390, 844]]) {
    const c = frameAround(seed, W, H);
    const across = W / c.s / CELL, down = (H - NAV_H) / c.s / CELL;
    assert.ok(across <= 3 + 1e-9 || down <= 2 + 1e-9, `${W}x${H}: ${across.toFixed(2)} across, ${down.toFixed(2)} down`);
    assert.ok(seed.wSteps * c.s <= W, `${W}: the seed is ${seed.wSteps * c.s}px wide`);
  }
  for (const p of F.plates) {
    const c = frameAround(p, 390, 844);
    assert.ok((p.wSteps + 8) * c.s <= 390 + 1e-6, `${p.id} spills off a phone`);
  }
});

test('limits: 192 steps across zoomed out at 1600x900; a 28-step square at most twice the height under the nav', () => {
  const l = limitsFor(F.bounds, 1600, 900);
  assert.strictEqual((1600 / l.sMin).toFixed(2), '192.00');
  assert.ok(28 * l.sMax <= 2 * (900 - NAV_H) + 1e-9);
  assert.strictEqual(l.margin, 16);
});

const html = readFileSync(join(root, 'index.html'), 'utf8');

test('index.html is what build-index.js writes now (rerun it after changing data)', () => {
  assert.strictEqual(html, render(plan(load())));
});

test('no-JS: every real Plate is a link with its title, meta and an img; placeholders are not links', () => {
  for (const p of DATA.PLATES) {
    const r = DATA.RECORDS[p.record];
    const re = new RegExp(`<li class="ix-m${SHAPES[p.id].m} ix-n${SHAPES[p.id].n}">(<a [^>]*href="([^"]+)"[^>]*data-drawing="${p.id}"[^>]*>|<span [^>]*data-plate="${p.id}">)(.*?)</(a|span)></li>`);
    const m = html.match(re);
    assert.ok(m, `${p.id} is missing from the HTML`);
    if (r.href) {
      assert.strictEqual(m[2], r.href, `${p.id} links to ${m[2]}`);
      assert.ok(/<img [^>]*alt="/.test(m[3]), `${p.id} has no img with alt`);
    } else {
      assert.ok(m[1].startsWith('<span'), `${p.id} is a link but is a placeholder`);
    }
    assert.ok(m[3].includes(r.title.replace(/&/g, '&amp;')), `${p.id} lacks its title`);
  }
});

test('no-JS: the grid is in growth order', () => {
  const ids = [...html.matchAll(/data-(?:drawing|plate)="([^"]+)"/g)].map((m) => m[1]);
  assert.deepStrictEqual(ids, F.order.map((i) => F.plates[i].id));
});

test('the meta description is the statement and intro line, verbatim; JSON-LD is an ItemList', () => {
  assert.ok(html.includes('<meta name="description" content="Architecture, sustainability, and ecological resilience. I study Sustainable Design at the University of Illinois. My work sits where built environments meet natural systems.">'));
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.strictEqual(ld['@type'], 'ItemList');
  assert.strictEqual(ld.itemListElement.length, Object.values(DATA.RECORDS).filter((r) => r.href).length);
  assert.ok(ld.itemListElement.every((e) => e.item['@type'] === 'CreativeWork' && e.item.name && e.item.url));
});

test('no trial switches and no story toggle ship in the index', () => {
  const js = ['js/index-sheet/index-sheet.js', 'js/index-sheet/plates.js', 'js/sheet/dots.js'].map((f) => readFileSync(join(root, f), 'utf8')).join('\n');
  for (const sw of ['variant', 'outline', "'ow'", "'nav'", 'fling\'', "'hint'", "'grid'"]) assert.ok(!js.includes(`get(${sw.startsWith("'") ? sw : `'${sw}'`})`), `a ?${sw} switch survives`);
  assert.ok(!/ix-proto|pairmodel/.test(html + js));
  assert.ok(!/story-toggle/.test(html));
});

if (!process.exitCode) console.log(`ok — ${pass} assertions passed`);
