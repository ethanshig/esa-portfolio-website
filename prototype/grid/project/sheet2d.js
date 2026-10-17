/* ===================================================================
   SHEET 2D — a Record without a model: its Drawings flat on the paper.
   PROTOTYPE (prototype/grid/project). ADR-0007: "if it is 2D it renders
   2D" — pan and zoom only. No WebGL, no orbit, no tilt, no rotation.

   Sheet units are dot steps (u right, v down). The camera is the paper
   point at the stage centre, T, and a scale s in css px per step.
     screen(u, v) = (W/2 + (u - Tu) s,  H/2 + (v - Tv) s)

   Input (gestures.js): right-drag and shift+right-drag pan (a parallel
   view has nothing to orbit), wheel and ctrl+right-drag zoom to the
   cursor, left-click picks. Touch: one-finger pan, two-finger pan and
   pinch; the twist is ignored.
   =================================================================== */
import { DotField } from './dots.js';
import { attachGestures } from './gestures.js';

const BASE = 16;                    /* css px per step inside the plane layer, before its scale */
const S_MIN = 1.5, S_MAX = 160;     /* px per step */
const PAD_PX = 28;                  /* framing margin */
const T_FLY = 0.8;                  /* seconds */
const TITLE_GAP = 0.6;              /* steps between a drawing and its title */

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const calm = (u) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(u, 0, 1));

function cssToken(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function validate(data) {
  if (!Array.isArray(data.drawings) || data.drawings.length === 0) throw new Error('sheet2d: no drawings');
  const ids = new Set();
  for (const d of data.drawings) {
    if (typeof d.id !== 'string' || ids.has(d.id)) throw new Error(`sheet2d: bad or duplicate drawing id "${d.id}"`);
    ids.add(d.id);
    if (typeof d.src !== 'string') throw new Error(`sheet2d: ${d.id} has no src`);
    if (!Array.isArray(d.px) || !(d.px[0] > 0 && d.px[1] > 0)) throw new Error(`sheet2d: ${d.id} needs px [w, h]`);
    if (!Array.isArray(d.at) || !d.at.every(Number.isFinite)) throw new Error(`sheet2d: ${d.id} needs at [u, v]`);
    if (!(d.w > 0)) throw new Error(`sheet2d: ${d.id} needs a width in steps`);
  }
  if (data.hero && !ids.has(data.hero)) throw new Error(`sheet2d: hero "${data.hero}" is not a drawing`);
}

export async function createSheet({ stage, data, views, reduceMotion, freeRegion, onFocus = () => {}, onHold = () => {} }) {
  validate(data);
  const dotsCanvas = stage.querySelector('canvas.env-dots');
  const planeEl = stage.querySelector('.env-plane');
  const overlay = stage.querySelector('.env-overlay');
  const homeBtn = stage.querySelector('.env-home');
  if (!dotsCanvas || !planeEl || !overlay) throw new Error('sheet2d: stage structure missing');
  const dots = new DotField(dotsCanvas);

  /* ---------- the drawings: rectangles in steps, images in the plane layer ---------- */
  const drawings = data.drawings.map((d) => {
    const h = d.w * (d.px[1] / d.px[0]);
    const rect = { u0: d.at[0], v0: d.at[1], u1: d.at[0] + d.w, v1: d.at[1] + h };
    const img = document.createElement('img');
    img.alt = '';                                /* the Document's figures carry the alt text */
    img.decoding = 'async';
    img.draggable = false;
    img.className = 'env-plane-img';
    img.style.left = rect.u0 * BASE + 'px';
    img.style.top = rect.v0 * BASE + 'px';
    img.style.width = d.w * BASE + 'px';
    img.style.height = h * BASE + 'px';
    img.addEventListener('error', () => {
      img.classList.add('is-broken');
      console.warn(`[sheet2d] ${d.id}: image failed to load (${d.src})`);
    }, { once: true });
    img.src = new URL(d.src, document.baseURI).href;
    planeEl.appendChild(img);
    const title = overlay.querySelector(`.env-title[data-drawing="${d.id}"]`);
    if (!title) console.warn(`[sheet2d] ${d.id}: no title in the HTML`);
    return { ...d, rect, img, title };
  });
  const byId = new Map(drawings.map((d) => [d.id, d]));
  const frameEl = document.createElement('div');
  frameEl.className = 'env-frame';
  overlay.appendChild(frameEl);

  /* ---------- camera ---------- */
  let W = 0, H = 0;
  const cam = { T: [0, 0], s: 16 };
  let fly = null;              /* { from, to, t0, dur } */
  let dirty = true;
  let raf = 0;
  let hot = null;

  function rectsFor(target) {
    const ids = target === 'sheet' ? drawings.map((d) => d.id) : Array.isArray(target) ? target : [target];
    const out = [];
    for (const id of ids) {
      const d = byId.get(id);
      if (!d) throw new Error(`sheet2d: view target "${id}" is not a drawing on this sheet`);
      out.push(d.rect);
    }
    return out;
  }

  function frameFor(target) {
    if (target && typeof target === 'object' && !Array.isArray(target)) {
      if (target.camera && Array.isArray(target.camera.T) && target.camera.s > 0) {
        return { T: target.camera.T.slice(0, 2), s: clamp(target.camera.s, S_MIN, S_MAX) };
      }
      throw new Error('sheet2d: an object view target needs { camera: { T: [u, v], s } } (a flat sheet has no snap views)');
    }
    const rs = rectsFor(target);
    const u0 = Math.min(...rs.map((r) => r.u0)), u1 = Math.max(...rs.map((r) => r.u1));
    const v0 = Math.min(...rs.map((r) => r.v0)), v1 = Math.max(...rs.map((r) => r.v1 + 2.4)); /* + title */
    const free = freeRegion();
    const fw = Math.max(40, free.right - free.left), fh = Math.max(40, free.bottom - free.top);
    const s = clamp(Math.min((fw - 2 * PAD_PX) / (u1 - u0), (fh - 2 * PAD_PX) / (v1 - v0)), S_MIN, S_MAX);
    const fcx = (free.left + free.right) / 2, fcy = (free.top + free.bottom) / 2;
    return { T: [(u0 + u1) / 2 - (fcx - W / 2) / s, (v0 + v1) / 2 - (fcy - H / 2) / s], s };
  }

  function setCam(c) { cam.T = c.T.slice(); cam.s = c.s; dirty = true; kick(); }

  let lastTarget = views.get('arrival').target;
  let moved = false;
  function show(target, { animate = !reduceMotion } = {}) {
    const to = frameFor(target);
    lastTarget = target;
    moved = false;
    if (!animate) { fly = null; setCam(to); return; }
    fly = { from: { T: cam.T.slice(), s: cam.s }, to, t0: performance.now() / 1000, dur: T_FLY };
    kick();
  }
  const home = () => show(views.get('arrival').target);

  function stepFly(t) {
    if (!fly) return;
    const u = calm((t - fly.t0) / fly.dur);
    const { from, to } = fly;
    cam.T = [from.T[0] + (to.T[0] - from.T[0]) * u, from.T[1] + (to.T[1] - from.T[1]) * u];
    cam.s = Math.exp(Math.log(from.s) + (Math.log(to.s) - Math.log(from.s)) * u);
    dirty = true;
    if (u >= 1) fly = null;
  }

  const toScreen = (u, v) => [W / 2 + (u - cam.T[0]) * cam.s, H / 2 + (v - cam.T[1]) * cam.s];
  const toPaper = (x, y) => [cam.T[0] + (x - W / 2) / cam.s, cam.T[1] + (y - H / 2) / cam.s];

  /* ---------- drawing ---------- */
  function render() {
    const [ox, oy] = toScreen(0, 0);
    planeEl.style.transform = `translate(${ox}px, ${oy}px) scale(${cam.s / BASE})`;
    dots.draw({ origin: [ox, oy], a: [cam.s, 0], b: [0, cam.s] }, { ink: cssToken('--color-primary', '#888'), accent: cssToken('--color-accent', '#c47a5c') });
    const size = clamp(cam.s * 0.8, 11, 17);
    overlay.style.setProperty('--env-title-size', size + 'px');
    for (const d of drawings) {
      if (!d.title) continue;
      const [x, y] = toScreen(d.rect.u0, d.rect.v1 + TITLE_GAP);
      d.title.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
    if (hot) {
      const d = byId.get(hot);
      const [x0, y0] = toScreen(d.rect.u0, d.rect.v0), [x1, y1] = toScreen(d.rect.u1, d.rect.v1);
      frameEl.style.transform = `translate(${x0 - 4}px, ${y0 - 4}px)`;
      frameEl.style.width = (x1 - x0 + 8) + 'px';
      frameEl.style.height = (y1 - y0 + 8) + 'px';
    }
    frameEl.classList.toggle('is-on', !!hot);
  }

  function kick() { if (!raf) raf = requestAnimationFrame(tick); }
  function tick() {
    raf = 0;
    const now = performance.now() / 1000;
    stepFly(now);
    if (dirty) { dirty = false; render(); lastTwinkle = now; }
    else if (now - lastTwinkle >= 1 / 20) { lastTwinkle = now; dots.twinkle(now); }   /* the stars breathe */
    if (fly || dots.twinkling) kick();
  }
  let lastTwinkle = 0;

  function resize() {
    const r = stage.getBoundingClientRect();
    W = r.width; H = r.height;
    dots.resize(W, H);
    dirty = true;
    kick();
  }

  /* ---------- picking and hover ---------- */
  function drawingAt(x, y) {
    const [u, v] = toPaper(x, y);
    for (let i = drawings.length - 1; i >= 0; i--) {
      const r = drawings[i].rect;
      if (u >= r.u0 && u <= r.u1 && v >= r.v0 && v <= r.v1) return drawings[i].id;
    }
    return null;
  }
  function setHot(id) {
    if (hot === id) return;
    if (hot && byId.get(hot).title) byId.get(hot).title.classList.remove('is-hot');
    hot = id;
    if (hot && byId.get(hot).title) byId.get(hot).title.classList.add('is-hot');
    stage.classList.toggle('is-over-drawing', !!hot);
    dirty = true; kick();
  }

  function zoomAt(f, x, y) {
    const s1 = clamp(cam.s * f, S_MIN, S_MAX);
    const [u, v] = toPaper(x, y);
    cam.T = [u - (x - W / 2) / s1, v - (y - H / 2) / s1];
    cam.s = s1;
    dirty = true; kick();
  }
  function panBy(dx, dy) { cam.T[0] -= dx / cam.s; cam.T[1] -= dy / cam.s; dirty = true; kick(); }

  attachGestures(stage, {
    begin() { fly = null; moved = true; onHold(); },
    orbit: panBy,                     /* a flat sheet: right-drag pans */
    pan: panBy,
    zoom: zoomAt,
    roll() { /* no rotation on a flat sheet */ },
    pick(x, y) { const id = drawingAt(x, y); if (id) { onHold(); onFocus(id); show(id); } },
    hover(x, y) { setHot(drawingAt(x, y)); },
    leave() { setHot(null); },
  });

  overlay.addEventListener('click', (e) => {
    const t = e.target.closest('.env-title[data-drawing]');
    if (t && byId.has(t.dataset.drawing)) { onHold(); onFocus(t.dataset.drawing); show(t.dataset.drawing); }
  });
  overlay.addEventListener('pointerover', (e) => {
    const t = e.target.closest('.env-title[data-drawing]');
    if (t && byId.has(t.dataset.drawing)) setHot(t.dataset.drawing);
  });
  overlay.addEventListener('pointerout', (e) => {
    const t = e.target.closest('.env-title[data-drawing]');
    if (t && !t.contains(e.relatedTarget)) setHot(null);
  });
  overlay.addEventListener('focusin', (e) => {
    const t = e.target.closest('.env-title[data-drawing]');
    if (t) setHot(t.dataset.drawing);
  });
  overlay.addEventListener('focusout', () => setHot(null));
  if (homeBtn) homeBtn.addEventListener('click', () => { home(); onFocus(data.hero || null); });

  resize();
  show(views.get('arrival').target, { animate: false });
  render();

  return {
    kind: '2d',
    show,
    home,
    resize() { resize(); },
    refit({ force = false, animate = !reduceMotion } = {}) { if (force || !moved) show(lastTarget, { animate }); },
    zoomBy(f) {
      const free = freeRegion();
      fly = null;
      zoomAt(f, (free.left + free.right) / 2, (free.top + free.bottom) / 2);
    },
    /* verification only */
    debug() {
      return {
        camera: { T: cam.T.slice(), s: cam.s },
        flying: !!fly,
        ghost: 0,
        hot,
        webgl: false,
        dots: dots.lastCount,
        drawings: drawings.map((d) => {
          const [x0, y0] = toScreen(d.rect.u0, d.rect.v0), [x1, y1] = toScreen(d.rect.u1, d.rect.v1);
          return { id: d.id, screen: [x0, y0, x1, y1] };
        }),
      };
    },
    toScreen,
  };
}
