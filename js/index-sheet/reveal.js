/* ===================================================================
   REVEAL — a Plate's image is printed in the paper's two colours
   (js/daylight.js, #esa-duo) until it is hovered; then it fades into its
   own colour over 350 ms, and back when the pointer leaves (Ethan,
   2026-11-15: "the images [are] the blue ... until one hovers over it,
   when it becomes colored"). One image at a time: #esa-reveal is one
   filter, its mix driven here. Reduced motion turns at once.
   =================================================================== */
const FADE_MS = 350;

export function createReveal({ reduceMotion }) {
  let img = null, target = null, t = 0, from = 0, start = 0, raf = 0;
  const mixOf = () => document.getElementById('esa-reveal-mix');
  const set = (v) => {
    t = v;
    const fe = mixOf();
    if (fe) { fe.setAttribute('k2', (1 - t).toFixed(3)); fe.setAttribute('k3', t.toFixed(3)); }
  };
  function step(now) {
    if (!start) start = now;
    const goal = target ? 1 : 0, k = reduceMotion ? 1 : Math.min(1, (now - start) / FADE_MS);
    set(from + (goal - from) * (1 - (1 - k) ** 3));
    if (k < 1) raf = requestAnimationFrame(step);
    else if (!target && img) { img.classList.remove('is-revealed'); img = null; }
  }
  /* next: the image to reveal, or null */
  return function reveal(next) {
    if (next === target) return;
    if (next && img && next !== img) { img.classList.remove('is-revealed'); set(0); }
    target = next;
    if (next) { img = next; img.classList.add('is-revealed'); }
    from = t; start = 0;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(step);
  };
}
