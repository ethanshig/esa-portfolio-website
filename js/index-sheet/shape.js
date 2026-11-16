/* ===================================================================
   SHAPE — how many modules a Plate takes (Ethan, 2026-10-27). Pure.

   The index's module is a 16-step pitch. A Plate is m x n modules and its
   box is (16m - 4) x (16n - 4) steps, so the gutter between Plates stays
   4 steps. A 2 x 2 Plate is 28 x 28 steps.

   The shape is computed, not authored. For a drawing Plate,
   scripts/build-index.js measures the image and picks (m, n), each in
   2..8 (never under 2: no slivers), maximising
       keep - 0.2 * |ln(m n / target)|
   where keep = min(a, b) / max(a, b) for the image aspect a and the box
   aspect b (the share of the image a cover-fit box shows), and target is
   the Plate's size hint: s 4, m 8, l 12, xl 20 (Ethan sets it per Plate, 2026-11-15; the old
   'cell' and 'wide' read as s and m). S is the smallest box that fits, so a 3:2 drawing's S is 3x2. Ties keep the first
   found, m ascending, then n ascending.

   A Plate's data may carry shape: [m, n], which overrides the rule for that
   Plate only (Ethan's call; the build still reports the share it shows).

   A Plate with no image takes its hint directly. A model: s 2x2, m 4x2, l 4x3, xl 5x4.
   A placeholder may be one module thin: s (cell) 1x1, m (wide) 2x1, l 2x2, xl 3x2.
   =================================================================== */

export const MODULE = 16;              /* steps */
export const GUTTER = 4;               /* steps */
export const SPAN_MIN = 2, SPAN_MAX = 8;
/* a placeholder may be one module thin (Ethan, 2026-11-15): it holds a place, it shows no art */
export const PLACEHOLDER_SPAN_MIN = 1;
/* the size scale (prototype/plate-sizes): Ethan picks one per Plate for the work and the
   emphasis it carries; the aspect rule still picks the shape. cell and wide are the old
   two-step hint, kept as S and M. */
const TARGET = { s: 4, m: 8, l: 12, xl: 20, cell: 4, wide: 8 };
export const SIZES = ['s', 'm', 'l', 'xl', 'cell', 'wide'];
const HINT = { s: [2, 2], m: [4, 2], l: [4, 3], xl: [5, 4], cell: [2, 2], wide: [4, 2] };
const PLACEHOLDER_HINT = { s: [1, 1], m: [2, 1], l: [2, 2], xl: [3, 2], cell: [1, 1], wide: [2, 1] };
const AREA_WEIGHT = 0.2;

export const boxSteps = (m, n) => [MODULE * m - GUTTER, MODULE * n - GUTTER];

/* the share of an image of aspect a (w / h) that a cover-fit box of aspect b shows */
export const keepOf = (a, b) => Math.min(a, b) / Math.max(a, b);

export function shapeForImage(wPx, hPx, size) {
  if (!(wPx > 0 && hPx > 0)) throw new Error(`shape: image size ${wPx} x ${hPx} is not measurable`);
  const target = TARGET[size];
  if (!target) throw new Error(`shape: size hint "${size}" is not one of ${Object.keys(TARGET).join(', ')}`);
  const a = wPx / hPx;
  let best = null;
  for (let m = SPAN_MIN; m <= SPAN_MAX; m++) {
    for (let n = SPAN_MIN; n <= SPAN_MAX; n++) {
      const [bw, bh] = boxSteps(m, n);
      const keep = keepOf(a, bw / bh);
      const score = keep - AREA_WEIGHT * Math.abs(Math.log((m * n) / target));
      if (!best || score > best.score + 1e-12) best = { m, n, keep, score };
    }
  }
  return { m: best.m, n: best.n, keep: best.keep };
}

export function shapeForHint(size, { placeholder = false } = {}) {
  if (placeholder) { const [m, n] = PLACEHOLDER_HINT[size] || []; if (m) return { m, n }; }
  if (!HINT[size]) throw new Error(`shape: size hint "${size}" is not one of ${Object.keys(HINT).join(', ')}`);
  const [m, n] = HINT[size];
  return { m, n };
}
