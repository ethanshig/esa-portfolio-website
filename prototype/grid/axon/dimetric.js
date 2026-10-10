/* ===================================================================
   2:1 DIMETRIC — the notebook's geometry, as numbers.
   PROTOTYPE (prototype/grid/axon). Pure: no DOM, no three.js.

   One dot step = p px (= --L4 on the site). The square grid is every
   (c, r); exactly 1 in 4 dots is a bold lattice node:
       isBold(c, r) = even(c) && even(c/2 + r)
   (the same rule as AxoNotebook/generate.ts, panelGrid()).

   The bold lattice is spanned by (2, 1) and (2, -1): the two plan axes at
   atan(1/2) = 26.565 deg. An orthographic camera reproduces those slopes
   exactly when it sits at azimuth 45 deg and elevation asin(1/2) = 30 deg:
   a plan axis then projects to (cos 45, sin 30 sin 45) = (0.7071, 0.3536)
   per world unit, slope 1/2. At SCALE = 2*sqrt(2)*p px per world unit,
   one world unit along a plan axis is exactly (2, 1) dot steps.

   Verticals: true orthographic puts one world unit of height at
   cos 30 * 2*sqrt(2) = sqrt(6) = 2.449 steps. The paper's drafting habit
   ("2 across, 1 up", verticals 2 steps) is not an orthographic view; the
   "paper" vertical mode squashes height by 2/sqrt(6) to match it.
   =================================================================== */

export const ELEVATION = Math.asin(0.5);          /* 30 deg */
export const AZIMUTH = Math.PI / 4;               /* 45 deg */
export const PLAN_SLOPE = 0.5;                    /* the target, for checks */
export const UNIT_PX_PER_STEP = 2 * Math.SQRT2;   /* world unit -> px is this * p */
export const TRUE_VERTICAL_STEPS = Math.sqrt(6);  /* one unit of height, in steps */
export const PAPER_VERTICAL_SQUASH = 2 / Math.sqrt(6);

/* Light and bold dot radii as a share of pitch, from the printed notebook:
   0.18 mm and 0.31 mm radius at 1/8" (3.175 mm) pitch. */
export const LIGHT_R_PER_PITCH = 0.18 / 3.175;
export const BOLD_R_PER_PITCH = 0.31 / 3.175;
/* Ink density of each dot on white paper: light #c6c6c6, bold #6e6e6e. */
export const LIGHT_INK = (255 - 0xc6) / 255;
export const BOLD_INK = (255 - 0x6e) / 255;

function even(n) { return ((n % 2) + 2) % 2 === 0; }

export function isBold(c, r) {
  return Number.isInteger(c) && Number.isInteger(r) && even(c) && even(c / 2 + r);
}

/* Camera basis for elevation theta, azimuth phi (radians).
   back = from target toward camera, right = screen right, up = screen up.
   theta = 90 deg, phi = 0 is a plan: screen right = +X, screen down = +Z. */
export function cameraBasis(theta, phi) {
  const ct = Math.cos(theta), st = Math.sin(theta);
  const cp = Math.cos(phi), sp = Math.sin(phi);
  return {
    back: [ct * sp, st, ct * cp],
    right: [cp, 0, -sp],
    up: [-st * sp, ct, -st * cp],
  };
}

/* Project a world vector to screen px (y down) for a camera basis and a
   px-per-unit zoom. */
export function projectPx(v, basis, zoom) {
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  return [dot(v, basis.right) * zoom, -dot(v, basis.up) * zoom];
}

/* Final pose, closed form, in dot steps (y down): x -> (2, 1), z -> (-2, 1),
   y (up) -> (0, -sqrt 6) times verticalScale. */
export function projectSteps(x, y, z, verticalScale = 1) {
  return [2 * x - 2 * z, x + z - TRUE_VERTICAL_STEPS * verticalScale * y];
}

/* Nearest bold node to a point given in steps from the paper origin. */
export function nearestBold(cs, rs) {
  let best = null, bestD = Infinity;
  const c0 = Math.round(cs), r0 = Math.round(rs);
  for (let c = c0 - 3; c <= c0 + 3; c++) {
    for (let r = r0 - 3; r <= r0 + 3; r++) {
      if (!isBold(c, r)) continue;
      const d = (c - cs) * (c - cs) + (r - rs) * (r - rs);
      if (d < bestD) { bestD = d; best = [c, r]; }
    }
  }
  return best;
}

/* Fit a model's bounding box (sx along X, sy up, sz along Z, in model units)
   into a cell w x h px at pitch p. Returns the world scale k so that the
   projected box fits with `marginSteps` all round. The longer plan side is
   snapped down to a whole number of units when that costs little, so the
   footprint's corners along it land on bold nodes. */
export function fitScale(sx, sy, sz, wPx, hPx, p, verticalScale = 1, marginSteps = 1) {
  const W = wPx / p - 2 * marginSteps, H = hPx / p - 2 * marginSteps;
  if (!(sx > 0) && !(sz > 0)) return 1;
  const plan = Math.max(sx, 0) + Math.max(sz, 0);
  const tall = TRUE_VERTICAL_STEPS * verticalScale * Math.max(sy, 0);
  let k = Math.min(W / (2 * plan), H / (plan + tall));
  const longSide = Math.max(sx, sz) * k;
  if (longSide >= 2) k = Math.floor(longSide + 1e-9) / Math.max(sx, sz);
  return k;
}
