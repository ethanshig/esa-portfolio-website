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
   the Plate's size hint: 4 for 'cell', 8 for 'wide'. Ties keep the first
   found, m ascending, then n ascending.

   A Plate's data may carry shape: [m, n], which overrides the rule for that
   Plate only (Ethan's call; the build still reports the share it shows).

   A Plate with no image (a model, a placeholder) takes its hint directly:
   'cell' is 2 x 2, 'wide' is 4 x 2 (60 x 28 steps).
   =================================================================== */

export const MODULE = 16;              /* steps */
export const GUTTER = 4;               /* steps */
export const SPAN_MIN = 2, SPAN_MAX = 8;
const TARGET = { cell: 4, wide: 8 };
const AREA_WEIGHT = 0.2;

export const boxSteps = (m, n) => [MODULE * m - GUTTER, MODULE * n - GUTTER];

/* the share of an image of aspect a (w / h) that a cover-fit box of aspect b shows */
export const keepOf = (a, b) => Math.min(a, b) / Math.max(a, b);

export function shapeForImage(wPx, hPx, size) {
  if (!(wPx > 0 && hPx > 0)) throw new Error(`shape: image size ${wPx} x ${hPx} is not measurable`);
  const target = TARGET[size];
  if (!target) throw new Error(`shape: size hint "${size}" is not cell or wide`);
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

export function shapeForHint(size) {
  if (size === 'cell') return { m: 2, n: 2 };
  if (size === 'wide') return { m: 4, n: 2 };
  throw new Error(`shape: size hint "${size}" is not cell or wide`);
}
