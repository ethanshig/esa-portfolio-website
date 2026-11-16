/* ===================================================================
   FIELD — where every Plate lies on the index's sheet (issue #17).
   Pure: no DOM, no three.js. Run by the browser to lay out the sheet and
   by scripts/build-index.js to write the no-JS index in growth order, so
   the two always agree.

   Grid, in dot steps: a 16-step module (shape.js). A Plate is m x n
   modules, its box (16m - 4) x (16n - 4), so the gutter is 4. Its m and n
   come from data.SHAPES, which scripts/build-index.js writes from the
   images (data/plate-shapes.js): the browser never measures an image.
   Every corner lands on a bold lattice node (isBold in ../axon/dimetric.js):
   a corner is (16i or 16i - 4, 16j or 16j - 4), so c is even, c/2 is even
   and r is even.

   similarity(a, b) = Facets with the same word / 3; a Facet with no word
   (a Plate about no cycle) never matches.

   Seed: the real Plate with the highest total similarity to all others.
   Never a placeholder. Ties: the Record with more real Plates, then the
   more recent Record (dates.end, else dates.start; a Record without dates
   counts as oldest), then authoring order.

   Grow: greedily, the unplaced Plate with the largest total similarity to
   the placed ones (ties: the larger single similarity, then authoring
   order) goes into the best free placement whose m x n footprint touches
   the field edge to edge, scoring
       sum of similarity to its edge neighbours (Plates sharing an edge segment)
       + 0.15 x the neighbour count
       + 1.75 x the share of its perimeter against Plates already down
       - 0.004 x the distance in steps from its centre to the seed's centre
   (ties: the first placement found, scanning row by row, left to right).
   Holes are allowed: the paper shows through. Deterministic: same data,
   same field.
   =================================================================== */

import { MODULE, GUTTER, SPAN_MIN, SPAN_MAX, PLACEHOLDER_SPAN_MIN, boxSteps, SIZES } from './shape.js';
export { MODULE, GUTTER };
const CELL = 2 * MODULE;                           /* the old cell pitch: the unit the framing counts in */
export const NAV_H = 84;                           /* css px the floating nav occupies */
const W_NEIGHBOURS = 0.15, W_CENTRE = 0.004;
/* Contact (Ethan, 2026-10-27: pack tighter): the share of a candidate's perimeter lying against Plates
   already down, 0..1. 1.75 sits mid-way on the plateau 1.45..2.05 where, on today's data, the field
   is most compact (bounding box 13 x 16 modules, 47 module cells of paper inside it, 3 enclosed)
   while mean neighbour similarity rises (0.527 -> 0.532) and more Plates touch one of their own
   Record (21 -> 23 of 27). Below 1.45 or above 2.05 the field loosens or similarity drops. It only
   chooses WHERE a Plate goes. (Those numbers predate the size scale: see the size pull below.) */
export const W_CONTACT = 1.75;
/* Size pull (Ethan, 2026-11-15: "the bigger the plate, the more I want it seen, so they should pack
   tighter together"). A Plate's weight is its area over a 2 x 2's. WHICH Plate goes next adds
   W_BIG_ORDER * ln(weight) to its similarity, so big Plates come down early, round the seed (itself
   the biggest), and the thin placeholders last, on the rim. With today's data: 12 x 14 modules,
   29 cells of paper, mean neighbour similarity 0.470. Also weighting the centre term by size
   loosened the field (85 cells of paper), so it is not used. */
export const W_BIG_ORDER = 1;
const EPS = 1e-9;
const FACETS = ['with', 'made', 'cycle'];

export const sim = (a, b) => FACETS.reduce((n, f) => n + (a.facets[f] != null && a.facets[f] === b.facets[f]), 0) / FACETS.length;

/* Throws on the first thing in the data that the field cannot be grown from. */
export function validatePlates({ VOCAB, RECORDS, PLATES, SHAPES }) {
  const fail = (msg) => { throw new Error(`plates data: ${msg}`); };
  if (!SHAPES || typeof SHAPES !== 'object') fail('needs SHAPES (data/plate-shapes.js; run scripts/build-index.js)');
  if (!VOCAB || !RECORDS || !Array.isArray(PLATES)) fail('needs VOCAB, RECORDS and PLATES');
  for (const f of FACETS) if (!Array.isArray(VOCAB[f])) fail(`VOCAB.${f} is not a list`);
  for (const [id, r] of Object.entries(RECORDS)) {
    if (typeof r.title !== 'string' || !r.title) fail(`record ${id} has no title`);
    if (typeof r.meta !== 'string') fail(`record ${id} has no meta`);
    if (r.status !== 'complete' && r.status !== 'active') fail(`record ${id}: status "${r.status}" is not complete or active`);
    if (r.href !== null && typeof r.href !== 'string') fail(`record ${id}: href must be a path or null`);
    if (r.dates !== null && (typeof r.dates !== 'object' || !/^\d{4}-\d{2}$/.test(r.dates.start || ''))) fail(`record ${id}: dates must be null or { start: 'YYYY-MM' }`);
    if (!Array.isArray(r.drawings)) fail(`record ${id}: drawings must be a list`);
  }
  const ids = new Set();
  let real = 0;
  for (const p of PLATES) {
    if (typeof p.id !== 'string' || ids.has(p.id)) fail(`bad or duplicate plate id "${p.id}"`);
    ids.add(p.id);
    const r = RECORDS[p.record];
    if (!r) fail(`plate ${p.id}: record "${p.record}" is not in RECORDS`);
    if (!SIZES.includes(p.size)) fail(`plate ${p.id}: size "${p.size}" is not one of ${SIZES.join(', ')}`);
    if (p.drawing && p.model) fail(`plate ${p.id}: has both a drawing and a model`);
    if (r.href && !p.drawing && !p.model) fail(`plate ${p.id}: its record has a page, so it needs a drawing or a model`);
    if (!r.href && (p.drawing || p.model)) fail(`plate ${p.id}: its record has no page yet, so it must be a placeholder`);
    if (p.alt != null && (!p.model || typeof p.alt !== 'string')) fail(`plate ${p.id}: alt is a model Plate's description (a string); a drawing's alt comes from world.json`);
    for (const f of FACETS) {
      const w = p.facets && p.facets[f];
      if (w === null && f === 'cycle') continue;
      if (!VOCAB[f].includes(w)) fail(`plate ${p.id}: ${f} "${w}" is not a ${f} word`);
    }
    const sh = SHAPES[p.id];
    const lo = r.href ? SPAN_MIN : PLACEHOLDER_SPAN_MIN;
    const okSpan = (k) => Number.isInteger(k) && k >= lo && k <= SPAN_MAX;
    if (!sh || !okSpan(sh.m) || !okSpan(sh.n)) fail(`plate ${p.id} has no shape of ${lo}..${SPAN_MAX} modules each way in SHAPES (rerun scripts/build-index.js)`);
    if (r.href) real++;
  }
  for (const id of Object.keys(SHAPES)) if (!ids.has(id)) fail(`SHAPES has ${id}, which is not a Plate (rerun scripts/build-index.js)`);
  if (real === 0) fail('no real Plate to seed the field from');
}

const STEP = { s: 0, cell: 0, m: 1, wide: 1, l: 2, xl: 3 };
const recency = (r) => (r.dates ? r.dates.end || r.dates.start : '');

/* The field: every Plate placed, plus the growth order, the seed, the Records in the order they
   first appear (each with its hero, its first Plate placed) and the mean edge similarity. */
export function growField(data, { contactWeight = W_CONTACT, bigOrder = W_BIG_ORDER } = {}) {
  validatePlates(data);
  const { RECORDS, PLATES } = data;
  const plates = PLATES.map((p, i) => {
    const r = RECORDS[p.record];
    const { m, n } = data.SHAPES[p.id];
    return { ...p, i, m, n, href: r.href, active: r.status === 'active', placeholder: !r.href };
  });
  const n = plates.length;
  const weight = (p) => (p.m * p.n) / 4;
  const S = plates.map((a) => plates.map((b) => (a === b ? 0 : sim(a, b))));
  const total = S.map((row) => row.reduce((t, x) => t + x, 0));

  const realIn = (p) => plates.filter((q) => q.record === p.record && !q.placeholder).length;
  let seed = -1;
  for (let i = 0; i < n; i++) {
    const p = plates[i];
    if (p.placeholder) continue;
    if (seed < 0) { seed = i; continue; }
    const q = plates[seed];
    /* the biggest size step seeds (Ethan, 2026-11-15: arrival lands on the headline work) */
    const ds = STEP[p.size] - STEP[q.size];
    if (ds > 0) { seed = i; continue; }
    if (ds < 0) continue;
    const dt = total[i] - total[seed];
    if (dt > EPS) { seed = i; continue; }
    if (dt < -EPS) continue;
    const dr = realIn(p) - realIn(q);
    if (dr > 0) { seed = i; continue; }
    if (dr < 0) continue;
    if (recency(RECORDS[p.record]) > recency(RECORDS[q.record])) seed = i;
  }

  const cells = new Map();              /* "c,r" module -> plate index */
  const key = (c, r) => c + ',' + r;
  const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function* footprint(c, r, m, h) { for (let y = r; y < r + h; y++) for (let x = c; x < c + m; x++) yield [x, y]; }
  const put = (p, c, r) => { p.c = c; p.r = r; for (const [x, y] of footprint(c, r, p.m, p.n)) cells.set(key(x, y), p.i); };
  const fits = (c, r, m, h) => { for (const [x, y] of footprint(c, r, m, h)) if (cells.has(key(x, y))) return false; return true; };
  /* the Plates sharing an edge segment with a footprint */
  const neighboursOf = (c, r, m, h) => {
    const set = new Set();
    for (let x = c; x < c + m; x++) for (const y of [r - 1, r + h]) { const j = cells.get(key(x, y)); if (j !== undefined) set.add(j); }
    for (let y = r; y < r + h; y++) for (const x of [c - 1, c + m]) { const j = cells.get(key(x, y)); if (j !== undefined) set.add(j); }
    return set;
  };
  /* the share of a footprint's perimeter that lies against Plates already down, 0..1 */
  const contactOf = (c, r, m, h) => {
    let shared = 0;
    for (let x = c; x < c + m; x++) for (const y of [r - 1, r + h]) if (cells.has(key(x, y))) shared++;
    for (let y = r; y < r + h; y++) for (const x of [c - 1, c + m]) if (cells.has(key(x, y))) shared++;
    return shared / (2 * (m + h));
  };
  const centre = (c, r, m, h) => [(c + m / 2) * MODULE, (r + h / 2) * MODULE];

  const order = [seed];
  const s0 = plates[seed];
  put(s0, -Math.floor(s0.m / 2), 0);
  const seedCentre = centre(s0.c, s0.r, s0.m, s0.n);
  const placed = new Set([seed]);
  while (placed.size < n) {
    let best = -1, bestT = -Infinity, bestM = -1;
    for (let i = 0; i < n; i++) {
      if (placed.has(i)) continue;
      let t = bigOrder * Math.log(weight(plates[i])), mx = 0;
      for (const j of placed) { t += S[i][j]; mx = Math.max(mx, S[i][j]); }
      if (t > bestT + EPS || (Math.abs(t - bestT) < EPS && mx > bestM)) { best = i; bestT = t; bestM = mx; }
    }
    const p = plates[best];
    /* every free placement whose footprint covers a free module beside the field: those are exactly
       the placements that touch it edge to edge */
    const starts = new Set();
    for (const k of cells.keys()) {
      const [c, r] = k.split(',').map(Number);
      for (const [dx, dy] of SIDES) {
        const x = c + dx, y = r + dy;
        if (cells.has(key(x, y))) continue;
        for (let oy = 0; oy < p.n; oy++) for (let ox = 0; ox < p.m; ox++) starts.add(key(x - ox, y - oy));
      }
    }
    const ordered = [...starts].map((k) => k.split(',').map(Number)).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    let pick = null;
    for (const [c, r] of ordered) {
      if (!fits(c, r, p.m, p.n)) continue;
      const nb = neighboursOf(c, r, p.m, p.n);
      if (nb.size === 0) continue;
      let sum = 0;
      for (const j of nb) sum += S[best][j];
      const [cx, cy] = centre(c, r, p.m, p.n);
      const score = sum + W_NEIGHBOURS * nb.size + contactWeight * contactOf(c, r, p.m, p.n) - W_CENTRE * Math.hypot(cx - seedCentre[0], cy - seedCentre[1]);
      if (!pick || score > pick.score + EPS) pick = { c, r, score };
    }
    if (!pick) throw new Error(`field: no free placement for plate ${p.id}`);   /* cannot happen on an unbounded grid */
    put(p, pick.c, pick.r);
    placed.add(best);
    order.push(best);
  }

  for (const p of plates) {
    const [w, h] = boxSteps(p.m, p.n);
    const u0 = p.c * MODULE, v0 = p.r * MODULE;
    p.rect = { u0, v0, u1: u0 + w, v1: v0 + h };
    p.wSteps = w;
    p.hSteps = h;
  }

  /* edge-adjacent pairs and their mean similarity */
  const pairs = new Set();
  for (const p of plates) for (const j of neighboursOf(p.c, p.r, p.m, p.n)) if (j !== p.i) pairs.add(Math.min(p.i, j) + '-' + Math.max(p.i, j));
  let sum = 0;
  for (const k of pairs) { const [a, b] = k.split('-').map(Number); sum += S[a][b]; }

  const records = [];
  for (const i of order) {
    const p = plates[i];
    if (!records.some((r) => r.id === p.record)) records.push({ id: p.record, hero: p });
  }
  const bounds = {
    u0: Math.min(...plates.map((p) => p.rect.u0)), v0: Math.min(...plates.map((p) => p.rect.v0)),
    u1: Math.max(...plates.map((p) => p.rect.u1)), v1: Math.max(...plates.map((p) => p.rect.v1)),
  };
  return { plates, order, seed, records, bounds, meanEdge: pairs.size ? sum / pairs.size : 0, edgePairs: pairs.size };
}

/* How far the index lets a reader go, in the old 32-step cells. Out (Ethan, 2026-10-20: zoomed far out
   the work looks small and insignificant): at most 6 cells across and 4 down at first; widened
   2026-10-27, once Plates took their images' shapes and the field grew, to 8 across (256 steps) and
   down in proportion, 16/3 (about 171 steps). In: a 28-step square at most twice the height under
   the nav. Pan: the view stops 16 steps past the field's bounding box. */
const MOST_ACROSS = 8, MOST_DOWN = 16 / 3, MOST_IN = 2, SQUARE = 28;
export function limitsFor(bounds, W, H) {
  const fh = H - NAV_H;
  return { sMin: Math.max(W / (MOST_ACROSS * CELL), fh / (MOST_DOWN * CELL)), sMax: MOST_IN * fh / SQUARE, bounds, margin: CELL / 2 };
}

/* A camera on a Plate showing at most 3 cells across and 2 down (96 x 64 steps): the larger of the two fits wins, so
   neither count is exceeded. Centred on the Plate's column; its row starts just under the nav. On a
   narrow screen the Plate's own width plus a gutter either side caps it, so a two-cell Plate never
   spills off a phone (#12). */
export function frameAround(p, W, H) {
  const fh = H - NAV_H;
  const s = Math.min(Math.max(W / (3 * CELL), fh / (2 * CELL)), W / (p.wSteps + 2 * GUTTER));
  return { T: [(p.rect.u0 + p.rect.u1) / 2, p.rect.v0 - GUTTER / 2 + (H / 2 - NAV_H) / s], s };
}
