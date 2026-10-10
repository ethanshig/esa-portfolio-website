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
import { isBold, LIGHT_R_PER_PITCH, BOLD_R_PER_PITCH, LIGHT_INK, BOLD_INK } from '../axon/dimetric.js';

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
  }

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
  draw(map, { fade = 1, ink = '#888' } = {}) {
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

    const rLight = Math.max(LIGHT_R_PER_PITCH * stepPx, MIN_LIGHT_R);
    const rBold = Math.max(BOLD_R_PER_PITCH * stepPx, MIN_LIGHT_R * (BOLD_R_PER_PITCH / LIGHT_R_PER_PITCH));
    let lightAlpha = (LIGHT_INK / BOLD_INK) * clamp01((stepPx - 3) / 5) * fade;
    let boldAlpha = clamp01((stepPx - 1.2) / 3) * fade;
    if (total > MAX_DOTS) lightAlpha = 0;
    if (total / 4 > MAX_DOTS) boldAlpha = 0;

    ctx.fillStyle = ink;
    const layers = [
      { bold: false, r: rLight, alpha: lightAlpha },
      { bold: true, r: rBold, alpha: boldAlpha },
    ];
    for (const L of layers) {
      if (L.alpha <= 0.002) continue;
      ctx.globalAlpha = L.alpha;
      const square = L.r < RECT_BELOW_R;
      const side = L.r * 1.7725;              /* square of equal area: sqrt(pi) * r */
      ctx.beginPath();
      for (let u = u0; u <= u1; u++) {
        /* the bold rule needs even u; skip whole columns that cannot match */
        if (L.bold && (u & 1)) continue;
        const cx = ox + u * ax, cy = oy + u * ay;
        for (let v = v0; v <= v1; v++) {
          if (isBold(u, v) !== L.bold) continue;
          const x = cx + v * bx, y = cy + v * by;
          if (x < -4 || y < -4 || x > w + 4 || y > h + 4) continue;
          if (square) ctx.rect(x - side / 2, y - side / 2, side, side);
          else { ctx.moveTo(x + L.r, y); ctx.arc(x, y, L.r, 0, Math.PI * 2); }
          this.lastCount++;
        }
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
