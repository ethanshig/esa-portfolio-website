/* ===================================================================
   DOTS — the AxoNotebook paper under a sheet that pans, zooms and tilts.
   PROTOTYPE (prototype/grid/project).

   The paper is one dot set in sheet steps (u right, v down). One step is
   --L4 at zoom 1; exactly 1 in 4 dots is a bold 2:1 dimetric node
   (isBold, from the axon prototype). The camera hands over an affine map
   paper -> screen px:  screen = origin + u * a + v * b.  In the
   superimposed view a = (s, 0), b = (0, s); when the 3D sheet orbits, the
   paper plane tilts and the same map (an orthographic view of a plane is
   affine) keeps the dots on it.

   Density guard: below a few px per step the light dots fade out, then
   the bold ones; a view that would need more than MAX_DOTS dots draws the
   bold lattice only, and past that draws nothing (an edge-on paper).
   =================================================================== */
import { isBold } from '../axon/dimetric.js';
import { gridStyle } from './gridstyle.js';
import { starField } from './palette.js';

const MAX_DOTS = 160000;
const MIN_LIGHT_R = 0.45;      /* css px: below this a dot vanishes on 1x screens */
const RECT_BELOW_R = 1.1;      /* css px: smaller dots are drawn as squares (fast, same ink) */

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

export class DotField {
  constructor(canvas) {
    if (!canvas || !canvas.getContext) throw new Error('dots: a <canvas> is required');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('dots: 2d context unavailable');
    this.canvas = canvas;
    this.ctx = ctx;
    this.w = 0;
    this.h = 0;
    this.dpr = 1;
    this.lastCount = 0;
    this.style = gridStyle();
    this.stars = null;          /* built on the first draw, once the ink colour is known */
    this.last = null;
  }

  /* redraw the last view at time t (seconds): the stars breathe, nothing else moves */
  twinkle(t) { if (this.last) this.draw(this.last.map, { ...this.last.opts, time: t }); }
  get twinkling() { return !!(this.stars && this.stars.amp > 0); }

  resize(w, h) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (!(w > 0 && h > 0)) return;
    this.w = w; this.h = h; this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
  }

  /* map: { origin: [x, y], a: [ax, ay], b: [bx, by] } in css px.
     fade: 0..1 multiplies all ink (the ghosted paper). ink: CSS colour. */
  draw(map, opts = {}) {
    const { fade = 1, boldFade = 1, ink = '#888', accent = ink, time = performance.now() / 1000 } = opts;
    this.last = { map, opts };
    if (!this.stars) this.stars = starField(ink);
    const { ctx, w, h, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    this.lastCount = 0;
    if (!(w > 0 && h > 0) || fade <= 0.001) return;

    const [ox, oy] = map.origin, [ax, ay] = map.a, [bx, by] = map.b;
    const det = ax * by - ay * bx;
    if (!Number.isFinite(det) || Math.abs(det) < 1e-6) return;     /* paper edge-on */
    const stepPx = Math.sqrt(Math.abs(det));                        /* mean step, css px */

    /* screen -> paper: invert the affine for the four viewport corners */
    const inv = (x, y) => {
      const dx = x - ox, dy = y - oy;
      return [(dx * by - dy * bx) / det, (ax * dy - ay * dx) / det];
    };
    const cs = [inv(0, 0), inv(w, 0), inv(0, h), inv(w, h)];
    const u0 = Math.floor(Math.min(...cs.map((c) => c[0]))) - 1;
    const u1 = Math.ceil(Math.max(...cs.map((c) => c[0]))) + 1;
    const v0 = Math.floor(Math.min(...cs.map((c) => c[1]))) - 1;
    const v1 = Math.ceil(Math.max(...cs.map((c) => c[1]))) + 1;
    const total = (u1 - u0 + 1) * (v1 - v0 + 1);

    const st = this.style;
    const rLight = Math.max(st.rLight * stepPx, MIN_LIGHT_R);
    const rBold = Math.max(st.rBold * stepPx, MIN_LIGHT_R);
    let lightAlpha = st.aLight * clamp01((stepPx - 3) / 5) * fade;
    let boldAlpha = st.aBold * clamp01((stepPx - 1.2) / 3) * fade * boldFade;    /* bold dots lift into the lattice */
    if (total > MAX_DOTS) lightAlpha = 0;
    if (total / 4 > MAX_DOTS) boldAlpha = 0;

    /* the light (cartesian) dots: every dot that is not an axon node */
    ctx.fillStyle = ink;
    /* stars: twinkle only where a dot is big enough to see it */
    const t = stepPx >= 5 ? time : 0;
    if (lightAlpha > 0.002) this.starDots(rLight, lightAlpha, false, t, [u0, u1, v0, v1, ox, oy, ax, ay, bx, by]);
    if (boldAlpha <= 0.002) { ctx.globalAlpha = 1; return; }

    /* the axon nodes, in the style's mark */
    ctx.globalAlpha = boldAlpha;
    const col = st.tint ? accent : ink;
    ctx.fillStyle = col; ctx.strokeStyle = col;
    ctx.lineWidth = Math.max(0.6, Math.min(1.2, stepPx * 0.05));
    ctx.beginPath();
    if (st.shape === 'lines') {
      /* hairlines along the two plan axes through every axon node: u - 2v = 4n and u + 2v = 4n */
      const P = (u, v) => [ox + u * ax + v * bx, oy + u * ay + v * by];
      for (const sg of [1, -1]) {
        const lo = Math.floor(Math.min(u0 - 2 * sg * v0, u0 - 2 * sg * v1, u1 - 2 * sg * v0, u1 - 2 * sg * v1) / 4);
        const hi = Math.ceil(Math.max(u0 - 2 * sg * v0, u0 - 2 * sg * v1, u1 - 2 * sg * v0, u1 - 2 * sg * v1) / 4);
        for (let n = lo; n <= hi; n++) {
          /* u = 4n + 2 sg v: walk v across the view */
          const a = P(4 * n + 2 * sg * v0, v0), b = P(4 * n + 2 * sg * v1, v1);
          ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
          this.lastCount++;
        }
      }
      ctx.stroke();
    } else if (st.shape === 'plus' || st.shape === 'cross') {
      /* plus: arms along the sheet's u and v; cross: along the two 2:1 plan axes, (2, 1) and (2, -1) */
      const arm = st.arm;
      const arms = st.shape === 'plus' ? [[arm, 0], [0, arm]]
        : [[arm * 2 / Math.sqrt(5), arm / Math.sqrt(5)], [arm * 2 / Math.sqrt(5), -arm / Math.sqrt(5)]];
      const d = arms.map(([du, dv]) => [du * ax + dv * bx, du * ay + dv * by]);
      this.eachDot(u0, u1, v0, v1, ox, oy, ax, ay, bx, by, true, (x, y) => {
        for (const [dx, dy] of d) { ctx.moveTo(x - dx, y - dy); ctx.lineTo(x + dx, y + dy); }
      });
      ctx.stroke();
    } else if (!st.tint) {
      this.starDots(rBold, boldAlpha, true, t, [u0, u1, v0, v1, ox, oy, ax, ay, bx, by]);
    } else {
      const square = rBold < RECT_BELOW_R, side = rBold * 1.7725;
      this.eachDot(u0, u1, v0, v1, ox, oy, ax, ay, bx, by, true, (x, y) => {
        if (square) ctx.rect(x - side / 2, y - side / 2, side, side);
        else { ctx.moveTo(x + rBold, y); ctx.arc(x, y, rBold, 0, Math.PI * 2); }
      });
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* one layer of dots as stars: bucketed by colour and by brightness (8 levels), one fill per bucket */
  starDots(r, alpha, bold, t, view) {
    const { ctx } = this, S = this.stars;
    const LEVELS = 8, buckets = new Map();
    const square = r < RECT_BELOW_R, side = r * 1.7725;          /* square of equal area */
    this.eachDot(...view, bold, (x, y, u, v) => {
      const [ci, b] = S.star(u, v, t);
      const key = ci * LEVELS + Math.min(LEVELS - 1, Math.round(b * (LEVELS - 1) / 1.3));
      let path = buckets.get(key);
      if (!path) { path = new Path2D(); buckets.set(key, path); }
      if (square) path.rect(x - side / 2, y - side / 2, side, side);
      else { path.moveTo(x + r, y); path.arc(x, y, r, 0, Math.PI * 2); }
    });
    for (const [key, path] of buckets) {
      const ci = Math.floor(key / LEVELS), lv = key % LEVELS;
      ctx.globalAlpha = Math.min(1, alpha * (lv * 1.3) / (LEVELS - 1));
      ctx.fillStyle = S.css[ci];
      ctx.fill(path);
    }
  }

  eachDot(u0, u1, v0, v1, ox, oy, ax, ay, bx, by, bold, fn) {
    const { w, h } = this;
    for (let u = u0; u <= u1; u++) {
      if (bold && (u & 1)) continue;                     /* the bold rule needs even u */
      const cx = ox + u * ax, cy = oy + u * ay;
      for (let v = v0; v <= v1; v++) {
        if (isBold(u, v) !== bold) continue;
        const x = cx + v * bx, y = cy + v * by;
        if (x < -8 || y < -8 || x > w + 8 || y > h + 8) continue;
        fn(x, y, u, v);
        this.lastCount++;
      }
    }
  }
}
