/* ===================================================================
   FIELD — where every Plate lies on the index's sheet (issue #17).
   Pure: no DOM, no three.js. Run by the browser to lay out the sheet and
   by scripts/build-index.js to write the no-JS index in growth order, so
   the two always agree.

   Grid, in dot steps: square cells of 28 on a 32 pitch (4-step gutters);
   a wide Plate takes two cells, 60 x 28. Widths are multiples of 4 and
   heights even, so every Plate corner sits on a bold lattice node
   (isBold in ../axon/dimetric.js).

   similarity(a, b) = Facets with the same word / 3; a Facet with no word
   (a Plate about no cycle) never matches.

   Seed: the real Plate with the highest total similarity to all others.
   Never a placeholder. Ties: the Record with more real Plates, then the
   more recent Record (dates.end, else dates.start; a Record without dates
   counts as oldest), then authoring order.

   Grow: greedily, the unplaced Plate with the largest total similarity to
   the placed ones (ties: the larger single similarity, then authoring
   order) goes into the free frontier cell, or two side-by-side free cells
   for a wide Plate, scoring
       sum of similarity to its edge neighbours
       + 0.15 x the neighbour count
       - 0.004 x the distance of its centre from the seed's cell origin
   (ties: the first start found). Deterministic: same data, same field.
   =================================================================== */

export const GRID = { pw: 32, ph: 32, ch: 28 };   /* pitch across, pitch down, cell height */
export const GUTTER = 4;
export const NAV_H = 84;                           /* css px the floating nav occupies */
const W_NEIGHBOURS = 0.15, W_CENTRE = 0.004;
const EPS = 1e-9;
const FACETS = ['with', 'made', 'cycle'];

export const sim = (a, b) => FACETS.reduce((n, f) => n + (a.facets[f] != null && a.facets[f] === b.facets[f]), 0) / FACETS.length;

/* Throws on the first thing in the data that the field cannot be grown from. */
export function validatePlates({ VOCAB, RECORDS, PLATES }) {
  const fail = (msg) => { throw new Error(`plates data: ${msg}`); };
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
    if (p.size !== 'cell' && p.size !== 'wide') fail(`plate ${p.id}: size "${p.size}" is not cell or wide`);
    if (p.drawing && p.model) fail(`plate ${p.id}: has both a drawing and a model`);
    if (r.href && !p.drawing && !p.model) fail(`plate ${p.id}: its record has a page, so it needs a drawing or a model`);
    if (!r.href && (p.drawing || p.model)) fail(`plate ${p.id}: its record has no page yet, so it must be a placeholder`);
    if (p.alt != null && (!p.model || typeof p.alt !== 'string')) fail(`plate ${p.id}: alt is a model Plate's description (a string); a drawing's alt comes from world.json`);
    for (const f of FACETS) {
      const w = p.facets && p.facets[f];
      if (w === null && f === 'cycle') continue;
      if (!VOCAB[f].includes(w)) fail(`plate ${p.id}: ${f} "${w}" is not a ${f} word`);
    }
    if (r.href) real++;
  }
  if (real === 0) fail('no real Plate to seed the field from');
}

const recency = (r) => (r.dates ? r.dates.end || r.dates.start : '');

/* The field: every Plate placed, plus the growth order, the seed, the Records in the order they
   first appear (each with its hero, its first Plate placed) and the mean edge similarity. */
export function growField(data) {
  validatePlates(data);
  const { RECORDS, PLATES } = data;
  const plates = PLATES.map((p, i) => {
    const r = RECORDS[p.record];
    return { ...p, i, span: p.size === 'wide' ? 2 : 1, href: r.href, active: r.status === 'active', placeholder: !r.href };
  });
  const n = plates.length;
  const S = plates.map((a) => plates.map((b) => (a === b ? 0 : sim(a, b))));
  const total = S.map((row) => row.reduce((t, x) => t + x, 0));

  const realIn = (p) => plates.filter((q) => q.record === p.record && !q.placeholder).length;
  let seed = -1;
  for (let i = 0; i < n; i++) {
    const p = plates[i];
    if (p.placeholder) continue;
    if (seed < 0) { seed = i; continue; }
    const q = plates[seed];
    const dt = total[i] - total[seed];
    if (dt > EPS) { seed = i; continue; }
    if (dt < -EPS) continue;
    const dr = realIn(p) - realIn(q);
    if (dr > 0) { seed = i; continue; }
    if (dr < 0) continue;
    if (recency(RECORDS[p.record]) > recency(RECORDS[q.record])) seed = i;
  }

  const cells = new Map();              /* "c,r" -> plate index */
  const key = (c, r) => c + ',' + r;
  const put = (p, c, r) => { p.c = c; p.r = r; for (let k = 0; k < p.span; k++) cells.set(key(c + k, r), p.i); };
  const footprint = (c, r, span) => Array.from({ length: span }, (_, k) => [c + k, r]);
  const neighboursOf = (c, r, span) => {
    const set = new Set();
    for (const [x, y] of footprint(c, r, span)) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const j = cells.get(key(x + dx, y + dy));
      if (j !== undefined) set.add(j);
    }
    return set;
  };

  const order = [seed];
  put(plates[seed], plates[seed].span === 2 ? -1 : 0, 0);
  const placed = new Set([seed]);
  while (placed.size < n) {
    let best = -1, bestT = -1, bestM = -1;
    for (let i = 0; i < n; i++) {
      if (placed.has(i)) continue;
      let t = 0, m = 0;
      for (const j of placed) { t += S[i][j]; m = Math.max(m, S[i][j]); }
      if (t > bestT + EPS || (Math.abs(t - bestT) < EPS && m > bestM)) { best = i; bestT = t; bestM = m; }
    }
    const p = plates[best];
    /* frontier starts: any free cell beside the field, and for a wide Plate the pair starting there or one left */
    const starts = new Set();
    for (const k of cells.keys()) {
      const [c, r] = k.split(',').map(Number);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        for (let s = 0; s < p.span; s++) starts.add(key(c + dx - s, r + dy));
      }
    }
    let pick = null;
    for (const k of starts) {
      const [c, r] = k.split(',').map(Number);
      if (footprint(c, r, p.span).some(([x, y]) => cells.has(key(x, y)))) continue;
      const nb = neighboursOf(c, r, p.span);
      if (nb.size === 0) continue;
      let s = 0;
      for (const j of nb) s += S[best][j];
      const cx = (c + p.span / 2) * GRID.pw, cy = (r + 0.5) * GRID.ph;
      const score = s + W_NEIGHBOURS * nb.size - W_CENTRE * Math.hypot(cx, cy);
      if (!pick || score > pick.score + EPS) pick = { c, r, score };
    }
    if (!pick) throw new Error(`field: no free cell for plate ${p.id}`);   /* cannot happen on an unbounded grid */
    put(p, pick.c, pick.r);
    placed.add(best);
    order.push(best);
  }

  for (const p of plates) {
    const u0 = p.c * GRID.pw, v0 = p.r * GRID.ph;
    p.rect = { u0, v0, u1: u0 + p.span * GRID.pw - GUTTER, v1: v0 + GRID.ch };
    p.wSteps = p.rect.u1 - p.rect.u0;
    p.hSteps = p.rect.v1 - p.rect.v0;
  }

  /* edge-adjacent pairs and their mean similarity */
  const pairs = new Set();
  for (const p of plates) for (const j of neighboursOf(p.c, p.r, p.span)) if (j !== p.i) pairs.add(Math.min(p.i, j) + '-' + Math.max(p.i, j));
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

/* How far the index lets a reader go. Out: at most 6 cells across and 4 down. In: one cell at most
   twice the height under the nav. Pan: the view stops half a cell past the field's bounding box. */
const MOST_ACROSS = 6, MOST_DOWN = 4, MOST_IN = 2;
export function limitsFor(bounds, W, H) {
  const fh = H - NAV_H;
  return { sMin: Math.max(W / (MOST_ACROSS * GRID.pw), fh / (MOST_DOWN * GRID.ph)), sMax: MOST_IN * fh / GRID.ph, bounds, margin: GRID.pw / 2 };
}

/* A camera on a Plate showing at most 3 cells across and 2 down: the larger of the two fits wins, so
   neither count is exceeded. Centred on the Plate's column; its row starts just under the nav. On a
   narrow screen the Plate's own width plus a gutter either side caps it, so a two-cell Plate never
   spills off a phone (#12). */
export function frameAround(p, W, H) {
  const fh = H - NAV_H;
  const s = Math.min(Math.max(W / (3 * GRID.pw), fh / (2 * GRID.ph)), W / (p.wSteps + 2 * GUTTER));
  return { T: [(p.rect.u0 + p.rect.u1) / 2, p.rect.v0 - GUTTER / 2 + (H / 2 - NAV_H) / s], s };
}
