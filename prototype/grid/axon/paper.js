/* ===================================================================
   PAPER — the axonometric dot-grid notebook, drawn under the page.
   PROTOTYPE (prototype/grid/axon).

   One dot set, globally indexed from the grid's top-left corner so it runs
   unbroken under every card. Two layers (light / bold) so the lift can fade
   the square reading and keep the axon reading. Drawn into canvas strips in
   document coordinates: it scrolls natively with the page (no per-frame
   redraw) and no single canvas grows past what phones will allocate.
   =================================================================== */
import { isBold, LIGHT_R_PER_PITCH, BOLD_R_PER_PITCH, LIGHT_INK, BOLD_INK } from './dimetric.js';

const STRIP_H = 1024;              /* css px per canvas strip */
const MIN_LIGHT_R = 0.45;          /* css px: below this a dot vanishes on 1x screens */

export class Paper {
  /* root: the element that holds the two layers (absolutely positioned at the
     document origin). originEl: the element whose content-box top-left is dot
     (0, 0). The pitch is --L4, measured on a probe in <body>. */
  constructor(root, originEl) {
    this.root = root;
    this.originEl = originEl;
    this.light = root.querySelector('[data-paper="light"]');
    this.bold = root.querySelector('[data-paper="bold"]');
    if (!this.light || !this.bold) throw new Error('paper: light and bold layers missing');
    this.p = 20;
    this.origin = [0, 0];
    this.size = [0, 0];
  }

  /* Measure pitch, origin and document extent. Returns true if anything changed. */
  measure() {
    const probe = document.createElement('div');
    /* 256 x the pitch, then divide: layout snaps widths to 1/64 px, which on a
       single 20.4px step would put the 16th dot 0.12px off a 4L card edge. */
    probe.style.cssText = 'position:absolute;visibility:hidden;width:calc(256 * var(--L4));height:0;';
    document.body.appendChild(probe);
    const p = probe.getBoundingClientRect().width / 256;
    probe.remove();
    if (!(p > 0)) throw new Error('paper: --L4 did not resolve to a width');

    const cs = getComputedStyle(this.originEl);
    const r = this.originEl.getBoundingClientRect();
    const ox = r.left + window.scrollX + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth);
    const oy = r.top + window.scrollY + parseFloat(cs.paddingTop) + parseFloat(cs.borderTopWidth);

    const w = document.documentElement.clientWidth;
    /* Height from content, not from scrollHeight: the paper itself would feed it. */
    const main = this.originEl.closest('main') || this.originEl;
    const mr = main.getBoundingClientRect();
    const h = Math.max(window.innerHeight, Math.ceil(mr.bottom + window.scrollY));

    const changed = p !== this.p || ox !== this.origin[0] || oy !== this.origin[1] ||
      w !== this.size[0] || h !== this.size[1];
    this.p = p; this.origin = [ox, oy]; this.size = [w, h];
    return changed;
  }

  /* Document px of dot (c, r). */
  dotPx(c, r) { return [this.origin[0] + c * this.p, this.origin[1] + r * this.p]; }
  /* Steps from the origin for a document px point. */
  stepsAt(x, y) { return [(x - this.origin[0]) / this.p, (y - this.origin[1]) / this.p]; }

  draw() {
    const [w, h] = this.size;
    const ink = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#888';
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const p = this.p;
    const rLight = Math.max(LIGHT_R_PER_PITCH * p, MIN_LIGHT_R);
    const rBold = rLight * (BOLD_R_PER_PITCH / LIGHT_R_PER_PITCH);
    /* Ink at the notebook's relative densities; overall strength is the
       layer's CSS opacity (the paper slider). */
    const layers = [
      { el: this.light, bold: false, r: rLight, alpha: LIGHT_INK / BOLD_INK },
      { el: this.bold, bold: true, r: rBold, alpha: 1 },
    ];
    const strips = Math.ceil(h / STRIP_H);
    for (const L of layers) {
      L.el.style.width = w + 'px';
      L.el.style.height = h + 'px';
      while (L.el.children.length > strips) L.el.lastChild.remove();
      while (L.el.children.length < strips) L.el.appendChild(document.createElement('canvas'));
      for (let s = 0; s < strips; s++) {
        const top = s * STRIP_H, sh = Math.min(STRIP_H, h - top);
        const cv = L.el.children[s];
        cv.style.cssText = `position:absolute;left:0;top:${top}px;width:${w}px;height:${sh}px;`;
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(sh * dpr);
        const ctx = cv.getContext('2d');
        if (!ctx) throw new Error('paper: 2d context unavailable');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, sh);
        ctx.fillStyle = ink;
        ctx.globalAlpha = L.alpha;
        ctx.beginPath();
        const c0 = Math.floor((0 - this.origin[0]) / p) - 1, c1 = Math.ceil((w - this.origin[0]) / p) + 1;
        const r0 = Math.floor((top - this.origin[1]) / p) - 1, r1 = Math.ceil((top + sh - this.origin[1]) / p) + 1;
        for (let c = c0; c <= c1; c++) {
          const x = this.origin[0] + c * p;
          for (let r = r0; r <= r1; r++) {
            if (isBold(c, r) !== L.bold) continue;
            const y = this.origin[1] + r * p - top;
            ctx.moveTo(x + L.r, y);
            ctx.arc(x, y, L.r, 0, Math.PI * 2);
          }
        }
        ctx.fill();
      }
    }
  }

  refresh(force = false) {
    if (this.measure() || force) this.draw();
  }
}
