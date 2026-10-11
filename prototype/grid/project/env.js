/* ===================================================================
   ENV — the project page as a drawing sheet (ADR-0007). PROTOTYPE
   (prototype/grid/project). Shared by every project page.

   The page never scrolls. The viewport is the paper; the sheet module
   (sheet3d.js for a Record with a model, sheet2d.js for one without)
   lays the Drawings on it. The story sits on the tour's sheet of trace
   (main:index.html): fixed on the right, its .trace-scroll the only
   scroller, lifted away by "Just the drawing" (body.look), a bottom
   sheet with a peek on a phone, and the .plate captioning what is in view.

   THIS FILE ADDS NO TEXT (docs/story-layer-spec.md, contract 1). Every
   word is in the HTML; script toggles classes and attributes, sets flex
   `order` so revealed sections read in the order chosen, draws the
   trace's outline, and moves a camera.

   The CYOA, story on: Narration is in beats (.narration[data-beat]);
   beat 0 plays on arrival, one line at a time (Continue, or space), as
   the tour paces it. When a beat is told, the choices show: one per
   Document section. A choice reveals its section in the trace, flies the
   camera to that section's view, and tells the next beat.
   Story off: the trace is the plain Document, every section, in order.

   URL switches: ?story=on|off  ?theme=dark|light (head script)
                 ?webgl=off     force the no-WebGL fallback (verification)
   =================================================================== */
import { NoSheetError } from './errors.js';

const STORY_KEY = 'esa-story';
const SECTIONS = ['story', 'whatIDid', 'process', 'outcome', 'reflection'];
const ORDER = { head: 0, firstBeat: 1, drawings: 800, controls: 900, crossings: 950, nav: 990, foot: 995 };
const PHONE = '(max-width: 900px)';          /* the tour's break */

const root = document.documentElement;
root.classList.add('env-live');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const phone = window.matchMedia(PHONE);
const params = new URLSearchParams(location.search);

function readJSON(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`env: #${id} is missing`);
  try { return JSON.parse(el.textContent); } catch (err) {
    throw new Error(`env: #${id} is not valid JSON (${err.message})`);
  }
}
function must(sel, scope = document) {
  const el = scope.querySelector(sel);
  if (!el) throw new Error(`env: ${sel} is missing`);
  return el;
}
const measure = (css) => {
  const p = document.createElement('div');
  p.style.cssText = `position:absolute;visibility:hidden;width:${css};height:0`;
  document.body.appendChild(p);
  const w = p.getBoundingClientRect().width;
  p.remove();
  return w;
};

/* ---------- views: which part of the sheet each Document section is about ---------- */
function readViews() {
  const data = readJSON('env-views');
  if (!data || !Array.isArray(data.views)) throw new Error('env: #env-views needs a views array');
  const map = new Map();
  for (const v of data.views) {
    if (!v || typeof v.section !== 'string') throw new Error('env: every view needs a section');
    if (v.section !== 'arrival' && !SECTIONS.includes(v.section)) throw new Error(`env: unknown view section "${v.section}"`);
    if (v.target === undefined) throw new Error(`env: view "${v.section}" has no target`);
    if (map.has(v.section)) throw new Error(`env: view "${v.section}" is listed twice`);
    map.set(v.section, v);
  }
  if (!map.has('arrival')) throw new Error('env: views must include "arrival"');
  return map;
}

/* ---------- the story control (same contract as js/story.js) ---------- */
function initStoryToggle(onChange) {
  const btn = document.querySelector('.story-toggle');
  const apply = (state) => {
    root.setAttribute('data-story', state);
    if (btn) btn.setAttribute('aria-pressed', String(state === 'on'));
    onChange(state);
  };
  apply(root.getAttribute('data-story') === 'off' ? 'off' : 'on');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const next = root.getAttribute('data-story') === 'off' ? 'on' : 'off';
    apply(next);
    try { localStorage.setItem(STORY_KEY, next); } catch { /* storage blocked: the toggle still works for this load */ }
  });
}

/* ---------- the phone menu (js/main.js does this on the other pages) ---------- */
function initHamburger() {
  const burger = document.querySelector('.hamburger');
  const menu = document.querySelector('.nav-menu');
  if (!burger || !menu) return;
  burger.setAttribute('role', 'button');
  burger.setAttribute('tabindex', '0');
  burger.setAttribute('aria-expanded', 'false');
  const toggle = () => {
    const open = !menu.classList.contains('active');
    menu.classList.toggle('active', open);
    burger.classList.toggle('active', open);
    burger.setAttribute('aria-expanded', String(open));
  };
  burger.addEventListener('click', toggle);
  burger.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
}

/* ===================================================================
   the trace's outline: the tour's breathing ribbon (line-system constants)
   =================================================================== */
const R = 300, OUTLINE_W = 21.6, DEPTH = 0.45, TAU = Math.PI * 2;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (p) => 1 - Math.pow(1 - clamp01(p), 3);
function breathAt(xu, yu, t) {
  const field = 0.55 * Math.sin(xu * 0.0021 + t * 0.83) + 0.30 * Math.sin(yu * 0.0033 - t * 0.61 + 1.7) + 0.15 * Math.sin((xu - yu) * 0.0015 + t * 1.13 + 0.4);
  return Math.max(0.35, 1 + DEPTH * (0.70 * field + 0.30 * Math.sin(t * TAU / 7.5)));
}
function ribbon(pts, reveal, base, wmul, strokeLen) {
  const n = pts.length;
  if (reveal <= 0.002 || n < 2) return null;
  const taper = clamp01((reveal * strokeLen) / (base * 2.2));
  const m = Math.max(2, Math.min(n, Math.round(1 + (n - 1) * reveal)));
  const L = [], Rt = [];
  let wS = 0, wE = 0;
  for (let i = 0; i < m; i++) {
    const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const tx = b[0] - a[0], ty = b[1] - a[1], len = Math.hypot(tx, ty) || 1, nx = -ty / len, ny = tx / len;
    const w = base * (wmul ? wmul(p[0], p[1]) : 1) / 2 * taper;
    if (i === 0) wS = w;
    if (i === m - 1) wE = w;
    L.push(`${(p[0] + nx * w).toFixed(1)} ${(p[1] + ny * w).toFixed(1)}`);
    Rt.push(`${(p[0] - nx * w).toFixed(1)} ${(p[1] - ny * w).toFixed(1)}`);
  }
  return { d: `M${L.join('L')}L${Rt.reverse().join('L')}Z`, caps: [[pts[0][0], pts[0][1], wS], [pts[m - 1][0], pts[m - 1][1], wE]] };
}
function createOutline(svg) {
  const NS = 'http://www.w3.org/2000/svg';
  const g = svg.querySelector('g') || svg.appendChild(document.createElementNS(NS, 'g'));
  const body = g.appendChild(document.createElementNS(NS, 'path'));
  body.setAttribute('fill', 'currentColor');
  const caps = [0, 1].map(() => { const c = g.appendChild(document.createElementNS(NS, 'circle')); c.setAttribute('fill', 'currentColor'); c.setAttribute('r', '0'); return c; });
  const o = { pts: null, len: 0, basePx: 2, Lpx: 80, start: null };
  function layout() {
    const box = svg.getBoundingClientRect();
    if (!box.width || !box.height) return;
    o.Lpx = measure('var(--L)') || 80;
    o.basePx = Math.max(1.5, Math.min(4.5, OUTLINE_W * o.Lpx / R));
    const inset = o.basePx / 2, w = box.width - 2 * inset, h = box.height - 2 * inset;
    const r = Math.max(0, Math.min(parseFloat(getComputedStyle(svg.parentElement).borderTopLeftRadius) || 0, w / 2, h / 2) - inset);
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    const pts = [], step = 6;
    const seg = (x0, y0, x1, y1) => { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step)); for (let i = 0; i < n; i++) pts.push([x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]); };
    const arc = (cx, cy, a0) => { const n = Math.max(2, Math.ceil(r * Math.PI / 2 / step)); for (let i = 0; i < n; i++) { const a = a0 + (Math.PI / 2) * i / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
    const x = inset, y = inset;
    seg(x + r, y, x + w - r, y); arc(x + w - r, y + r, -Math.PI / 2);
    seg(x + w, y + r, x + w, y + h - r); arc(x + w - r, y + h - r, 0);
    seg(x + w - r, y + h, x + r, y + h); arc(x + r, y + h - r, Math.PI / 2);
    seg(x, y + h - r, x, y + r); arc(x + r, y + r, Math.PI);
    pts.push(pts[0]);
    o.pts = pts; o.len = 2 * (w + h);
  }
  function draw(t) {
    if (!o.pts) return;
    if (o.start === null) o.start = t;
    const p = reduceMotion ? 1 : easeOut((t - o.start) / 1.6);
    const scale = R / o.Lpx;
    const r = ribbon(o.pts, p, o.basePx, reduceMotion ? null : (x, y) => breathAt(x * scale, y * scale, t), o.len);
    if (!r) { body.setAttribute('d', ''); return; }
    body.setAttribute('d', r.d);
    caps.forEach((c, k) => { c.setAttribute('cx', r.caps[k][0].toFixed(1)); c.setAttribute('cy', r.caps[k][1].toFixed(1)); c.setAttribute('r', r.caps[k][2].toFixed(2)); });
  }
  new ResizeObserver(layout).observe(svg);
  layout();
  let last = 0;
  (function tick() {
    const t = performance.now() / 1000;
    if (!document.hidden && t - last > 1 / 45) { draw(t); last = t; }
    if (!reduceMotion) requestAnimationFrame(tick);
    else setTimeout(() => draw(performance.now() / 1000), 60);
  }());
}

/* ===================================================================
   the trace: the CYOA with the story on, the plain Document with it off
   =================================================================== */
function createTrace({ onChoose, onLook }) {
  const trace = must('.trace');
  const scroller = must('.trace-scroll', trace);
  const handle = trace.querySelector('.handle');
  const lift = trace.querySelector('.lift');
  const storyTab = document.querySelector('.story-tab');
  const cont = trace.querySelector('.continue');
  const mode = root.getAttribute('data-arrival') === 'crossed' ? 'with' : 'meet';

  const head = must(':scope > .env-head', scroller);
  head.style.order = ORDER.head;
  const traceHead = scroller.querySelector(':scope > .trace-head');
  if (traceHead) traceHead.style.order = -1;
  const beats = [...scroller.querySelectorAll(':scope > .narration[data-beat]')]
    .map((el) => ({ el, n: Number(el.dataset.beat) }))
    .sort((a, b) => a.n - b.n);
  for (const b of beats) {
    if (!Number.isInteger(b.n) || b.n < 0) throw new Error(`env: bad data-beat "${b.el.dataset.beat}"`);
    b.lines = [...b.el.querySelectorAll(`.line[data-mode="${mode}"]`)];
    b.el.classList.toggle('is-empty', b.lines.length === 0);
  }
  const sections = new Map();
  for (const el of scroller.querySelectorAll(':scope > .env-section[data-section]')) {
    if (!SECTIONS.includes(el.dataset.section)) throw new Error(`env: unknown section "${el.dataset.section}"`);
    sections.set(el.dataset.section, el);
  }
  const choices = [...scroller.querySelectorAll('.env-choice[data-choose]')];
  for (const c of choices) if (!sections.has(c.dataset.choose)) throw new Error(`env: choice "${c.dataset.choose}" has no section`);
  for (const [sel, o] of [['.env-drawings', ORDER.drawings], ['.controls', ORDER.controls], ['.crossings', ORDER.crossings],
    ['.project-navigation', ORDER.nav], ['.env-foot', ORDER.foot]]) {
    const el = scroller.querySelector(`:scope > ${sel}`);
    if (el) el.style.order = o;
  }

  const revealed = [];
  const queue = [];            /* lines of reached beats not yet said */
  let current = null;

  /* the tour's scroll rule: keep the current line near 45% of the trace */
  function bringIntoView(el) {
    requestAnimationFrame(() => {
      const box = scroller.getBoundingClientRect(), r = el.getBoundingClientRect();
      if (r.bottom > box.top + box.height * 0.8 || r.top < box.top + box.height * 0.3) {
        scroller.scrollTo({ top: scroller.scrollTop + r.top - box.top - box.height * 0.45, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
  }

  function say() {
    const line = queue.shift();
    if (!line) return false;
    if (current) current.classList.remove('current');
    current = line;
    line.classList.add('is-said', 'current', 'enter');
    trace.classList.toggle('is-telling', queue.length > 0);
    bringIntoView(line);
    return true;
  }
  function advance() { if (queue.length) say(); }

  function reach(n) {
    for (const b of beats) {
      if (b.n !== n) continue;
      b.el.classList.add('is-reached');
      b.el.style.order = n === 0 ? ORDER.firstBeat : 1 + 2 * n;
      queue.push(...b.lines);
    }
    trace.classList.toggle('is-telling', queue.length > 0);
    if (!say()) trace.classList.remove('is-telling');
  }

  function choose(id) {
    const el = sections.get(id);
    if (!el) throw new Error(`env: no section "${id}"`);
    /* a choice made mid-beat finishes the beat first, silently: nothing said is skipped */
    while (queue.length) say();
    if (!revealed.includes(id)) {
      revealed.push(id);
      el.style.order = 2 * revealed.length;
      el.classList.add('is-revealed', 'enter');
      reach(revealed.length);
    }
    for (const c of choices) {
      const on = c.dataset.choose === id;
      if (on) c.classList.add('is-taken');
      c.setAttribute('aria-current', on ? 'true' : 'false');
    }
    if (!queue.length) bringIntoView(el);
    setLook(false);
    onChoose(id);
  }

  scroller.addEventListener('click', (e) => {
    const c = e.target.closest('.env-choice[data-choose]');
    if (c) choose(c.dataset.choose);
  });
  if (cont) cont.addEventListener('click', (e) => { e.stopPropagation(); advance(); });
  document.addEventListener('keydown', (e) => {
    if (root.getAttribute('data-story') !== 'on' || !root.classList.contains('env-js')) return;
    if (e.target.closest && e.target.closest('input, textarea, select, button, a, .env-stage')) return;
    if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'Enter') { if (queue.length) { e.preventDefault(); advance(); } }
  });

  /* ---------- looking: lift the trace off the drawing (the tour's setLook) ---------- */
  function setLook(on) {
    if (document.body.classList.contains('look') === on) return;
    document.body.classList.toggle('look', on);
    if (handle) handle.setAttribute('aria-expanded', String(!on));
    /* on a phone only the top of the sheet shows while looking: bring the current line up to meet it */
    if (current && phone.matches) {
      scroller.scrollTo({ top: on ? current.offsetTop - 30 : Math.max(0, current.offsetTop - scroller.clientHeight * 0.45), behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    onLook(on);
  }
  if (lift) lift.addEventListener('click', () => setLook(true));
  if (storyTab) storyTab.addEventListener('click', () => setLook(false));
  if (handle) {
    let startY = null, moved = false;
    handle.addEventListener('pointerdown', (e) => { startY = e.clientY; moved = false; try { handle.setPointerCapture(e.pointerId); } catch { /* fine without */ } });
    handle.addEventListener('pointermove', (e) => {
      if (startY !== null && Math.abs(e.clientY - startY) > 24) { moved = true; setLook(e.clientY > startY); startY = e.clientY; }
    });
    handle.addEventListener('pointerup', () => { if (startY !== null && !moved) setLook(!document.body.classList.contains('look')); startY = null; });
    handle.addEventListener('pointercancel', () => { startY = null; });
    handle.addEventListener('click', (e) => { if (e.detail === 0) setLook(!document.body.classList.contains('look')); });
  }

  createOutline(must('svg.outline', trace));
  reach(0);

  return {
    choose,
    advance,
    setLook,
    revealed: () => revealed.slice(),
    pending: () => queue.length,
    trace,
  };
}

/* ---------- the plate: the caption for the drawing in view ---------- */
function createPlate(getSheet) {
  const plate = document.querySelector('.plate');
  if (!plate) return { show() {} };
  const caps = [...plate.querySelectorAll('.plate-cap[data-drawing]')];
  const alts = [...plate.querySelectorAll('.alt[data-drawing]')];
  plate.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    const sheet = getSheet();
    if (!b || !sheet) return;
    if (b.dataset.zoom) sheet.zoomBy(b.dataset.zoom === 'in' ? 1.5 : 1 / 1.5);
    else if (b.hasAttribute('data-fit')) sheet.refit({ force: true });
    else if (b.hasAttribute('data-describe')) { plate.classList.toggle('describing'); sheet.refit(); }
  });
  return {
    show(id) {
      let any = false;
      for (const c of caps) { const on = c.dataset.drawing === id; c.classList.toggle('is-on', on); any = any || on; }
      for (const a of alts) a.classList.toggle('is-on', a.dataset.drawing === id);
      plate.hidden = !any;
    },
    height() { return plate.hidden ? 0 : plate.getBoundingClientRect().height; },
  };
}

/* ===================================================================
   boot
   =================================================================== */
let sheet = null;
let pendingSection = null;
const views = readViews();
const sheetData = readJSON('env-sheet');
if (sheetData.kind !== '2d' && sheetData.kind !== '3d') throw new Error(`env: unknown sheet kind "${sheetData.kind}"`);
const plate = createPlate(() => sheet);

/* the drawing a view is about, for the plate */
function focusOf(target) {
  if (typeof target === 'string') return target === 'sheet' ? (sheetData.hero || null) : target;
  if (Array.isArray(target)) return target.length ? focusOf(target[0]) : null;
  if (target && typeof target.snap === 'string') return target.snap;
  return null;
}
function showView(target) {
  plate.show(focusOf(target));
  if (sheet) sheet.show(target);
}

const trace = createTrace({
  onChoose(id) {
    const v = views.get(id);
    if (!v) { console.warn(`[env] no view for section "${id}"; the camera stays`); return; }
    if (sheet) showView(v.target);
    else pendingSection = id;
  },
  onLook() { if (sheet) sheet.refit(); },
});
initStoryToggle(() => {});
initHamburger();

/* where the sheet may frame: clear of the nav, the trace and the plate (the tour's clearArea) */
function freeRegion() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const look = document.body.classList.contains('look');
  const nav = document.querySelector('.navbar');
  const navH = nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0;
  const plateH = plate.height() ? plate.height() + 16 : 0;
  const t = trace.trace;
  if (root.classList.contains('env-nosheet')) return { left: 0, top: navH, right: vw, bottom: vh };
  if (phone.matches) {
    const peek = parseFloat(getComputedStyle(root).getPropertyValue('--peek')) || 118;
    const sheetH = look ? peek : t.offsetHeight;
    return { left: 12, top: navH + 4, right: vw - 12, bottom: Math.max(navH + 60, vh - sheetH - plateH - 4) };
  }
  const L = measure('var(--L)') || 80;
  const right = look ? vw - L : t.offsetLeft - L / 2;
  return { left: L, top: navH + L / 4, right: Math.max(L + 80, right), bottom: Math.max(navH + 80, vh - plateH - L / 4) };
}

function fallback(err) {
  root.classList.remove('env-js');
  root.classList.add('env-static', 'env-nosheet');
  document.body.classList.remove('look');
  const stage = document.querySelector('.env-stage');
  if (stage) stage.setAttribute('aria-hidden', 'true');
  if (err instanceof NoSheetError) console.info(`[env] ${err.message}; showing the Document`);
  else if (err && /dynamically imported module|Failed to fetch|Importing a module script failed/i.test(String(err.message))) {
    console.warn('[env] the sheet could not load; showing the Document', err);
  } else {
    console.error('[env] the sheet failed; showing the Document', err);
  }
}

async function boot() {
  const stage = must('.env-stage');
  try {
    if (sheetData.kind === '3d' && params.get('webgl') === 'off') throw new NoSheetError('WebGL turned off by ?webgl=off');
    const mod = sheetData.kind === '3d' ? await import('./sheet3d.js') : await import('./sheet2d.js');
    root.classList.add('env-sheet-on');                 /* the plate shows: framing must see its height */
    plate.show(focusOf(views.get('arrival').target));
    sheet = await mod.createSheet({
      stage, data: sheetData, views, reduceMotion, freeRegion,
      onFocus: (id) => plate.show(id),
    });
    if (pendingSection) showView(views.get(pendingSection).target);
  } catch (err) {
    root.classList.remove('env-sheet-on');
    fallback(err);
  }
}

let resizeT = 0;
window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { if (sheet) { sheet.resize(); sheet.refit({ animate: false }); } }, 80); });
phone.addEventListener('change', () => { if (sheet) sheet.refit({ animate: false }); });

/* for the verifier: the same actions a reader has, and read-only state */
window.__env = {
  trace,
  views,
  freeRegion,
  get sheet() { return sheet; },
  ready: boot(),
};
