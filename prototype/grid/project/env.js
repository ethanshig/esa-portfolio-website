/* ===================================================================
   ENV — the project page as a drawing sheet (ADR-0007). PROTOTYPE
   (prototype/grid/project). Shared by every project page.

   The page never scrolls. The viewport is the paper; the sheet module
   (sheet3d.js for a Record with a model, sheet2d.js for one without)
   lays the Drawings on it. The story is the tour's caption, the surface
   Ethan chose on 2026-09-18 (adventure/tour.template.html, "surface c"):
   one line at a time at the foot of the drawing over a veil with no edge,
   and one row of pills. Taking hold of the drawing is looking (body.look):
   the caption drops away and the drawing's name and description show.
   "Your story" unfurls the readback, the only scroller.

   THIS FILE ADDS NO TEXT (docs/story-layer-spec.md, contract 1). Every
   word is in the HTML; script toggles classes, sets `order` so the
   readback reads in the order lines were said, and moves a camera.

   The CYOA, story on: Narration is in beats (.narration[data-beat]); beat 0
   plays on arrival, one line at a time (Continue, or space). When a beat is
   told the pills show, one per Document section. A choice flies the camera
   to that section's view and tells the section as caption lines (one per
   paragraph or list item), then the next beat. The template has no place
   for long prose at the foot; its answers are caption lines too.
   Story off: the readback surface, held open, holds the whole Document.

   URL switches: ?story=on|off  ?theme=dark|light (head script)
                 ?webgl=off     force the no-WebGL fallback (verification)
   =================================================================== */
import { NoSheetError } from './errors.js';

const STORY_KEY = 'esa-story';
const SECTIONS = ['story', 'whatIDid', 'process', 'outcome', 'reflection'];
const PHONE = '(max-width: 900px)';          /* the template's break */

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
   the caption (adventure/tour.template.html, "surface c")
   =================================================================== */
const FOCUS_FLOOR = 0.07;                /* the template's readback floor */
const MARK_KEY = 'esa-mark-taught';      /* shared with the tour: the lesson is taught once */

function createCaption({ onChoose, onLook }) {
  const trace = must('.trace');
  const scroller = must('.trace-scroll', trace);
  const page = must('.page', scroller);
  const storyTab = document.querySelector('.story-tab');
  const storyLink = document.querySelector('.story-link');
  const cont = trace.querySelector('.continue');
  const mode = root.getAttribute('data-arrival') === 'crossed' ? 'with' : 'meet';

  const head = page.querySelector(':scope > .env-head');
  if (head) head.style.order = -20;
  const placeMark = page.querySelector(':scope > .place-mark');
  if (placeMark) placeMark.style.order = -10;
  const beats = [...page.querySelectorAll(':scope > .narration[data-beat]')]
    .map((el) => ({ el, n: Number(el.dataset.beat) }))
    .sort((x, y) => x.n - y.n);
  for (const bt of beats) {
    if (!Number.isInteger(bt.n) || bt.n < 0) throw new Error(`env: bad data-beat "${bt.el.dataset.beat}"`);
    bt.lines = [...bt.el.querySelectorAll(`.line[data-mode="${mode}"]`)];
  }
  const sections = new Map();
  for (const el of page.querySelectorAll(':scope > .env-section[data-section]')) {
    const id = el.dataset.section;
    if (!SECTIONS.includes(id)) throw new Error(`env: unknown section "${id}"`);
    const lines = [...el.querySelectorAll('.line')];
    if (!lines.length) throw new Error(`env: section "${id}" has no lines`);
    sections.set(id, { el, lines, title: el.querySelector('.eyebrow') });
  }
  const choices = [...trace.querySelectorAll('.env-choice[data-choose]')];
  for (const c of choices) if (!sections.has(c.dataset.choose)) throw new Error(`env: choice "${c.dataset.choose}" has no section`);

  const revealed = [];
  const queue = [];
  let current = null;
  let said = 0;                       /* the readback reads in the order lines were said */

  function say() {
    const line = queue.shift();
    if (!line) return false;
    if (current) current.classList.remove('current', 'enter');
    current = line;
    said += 2;
    line.style.order = said;
    line.classList.add('is-said', 'current', 'enter');
    const lesson = line.querySelector('.mark-lesson');
    if (lesson) {
      let taught = false;
      try { taught = localStorage.getItem(MARK_KEY) === '1'; } catch { /* private window: teach it */ }
      if (!taught) {
        lesson.classList.add('is-teaching');
        try { localStorage.setItem(MARK_KEY, '1'); } catch { /* as above */ }
      }
    }
    trace.classList.toggle('is-telling', queue.length > 0);
    return true;
  }
  function advance() { if (queue.length) say(); }
  function reach(n) {
    for (const bt of beats) if (bt.n === n) queue.push(...bt.lines);
    if (!say()) trace.classList.remove('is-telling');
  }

  function choose(id) {
    const sec = sections.get(id);
    if (!sec) throw new Error(`env: no section "${id}"`);
    setUnfurl(false);
    setLook(false);
    if (!revealed.includes(id)) {
      queue.length = 0;               /* a choice is only offered once the beat is told */
      revealed.push(id);
      sec.el.classList.add('is-revealed');
      if (sec.title) sec.title.style.order = said + 1;
      queue.push(...sec.lines);
      for (const bt of beats) if (bt.n === revealed.length) queue.push(...bt.lines);
      say();
    }
    for (const c of choices) {
      if (c.dataset.choose === id) c.classList.add('is-taken');
      c.setAttribute('aria-current', c.dataset.choose === id ? 'true' : 'false');
    }
    onChoose(id);
  }

  trace.addEventListener('click', (e) => {
    const c = e.target.closest('.env-choice[data-choose]');
    if (c) { choose(c.dataset.choose); return; }
    if (e.target.closest('[data-close]')) { e.stopPropagation(); setUnfurl(false); }
  });
  if (cont) cont.addEventListener('click', (e) => { e.stopPropagation(); advance(); });
  document.addEventListener('keydown', (e) => {
    if (root.getAttribute('data-story') !== 'on' || !root.classList.contains('env-js')) return;
    if (document.body.classList.contains('unfurl')) return;
    if (e.target.closest && e.target.closest('input, textarea, select, button, a, .env-stage')) return;
    if ((e.key === ' ' || e.key === 'ArrowRight' || e.key === 'Enter') && queue.length) { e.preventDefault(); advance(); }
  });

  /* ---------- looking: the caption drops away and the drawing has the screen ----------
     Entered by taking hold of the drawing (drag, zoom, click), as on the tour; the view is
     not re-fitted on the way in or out, since the drawing is under the reader's hand. */
  function setLook(on) {
    if (document.body.classList.contains('look') === on) return;
    if (on) setUnfurl(false);
    document.body.classList.toggle('look', on);
    onLook(on);
  }
  if (storyTab) storyTab.addEventListener('click', () => setLook(false));

  /* ---------- the readback: what has been said, returned only when asked for ---------- */
  let focusPending = false;
  function visibleLines() { return [...page.querySelectorAll('.line, .eyebrow')].filter((el) => el.offsetParent !== null); }
  function padForFocus() {
    const lines = visibleLines().filter((el) => el.classList.contains('line'));
    if (!lines.length) return;
    lines.sort((x, y) => x.getBoundingClientRect().top - y.getBoundingClientRect().top);
    page.style.paddingTop = page.style.paddingBottom = '0px';
    const box = scroller.getBoundingClientRect(), half = box.height / 2;
    scroller.scrollTop = 0;
    const f = lines[0].getBoundingClientRect();
    page.style.paddingTop = Math.max(0, half - (f.top + f.height / 2 - box.top)) + 'px';
    scroller.scrollTop = scroller.scrollHeight;
    const l = lines[lines.length - 1].getBoundingClientRect();
    page.style.paddingBottom = Math.max(0, half - (box.bottom - (l.top + l.height / 2))) + 'px';
  }
  function focusLines() {
    focusPending = false;
    if (!document.body.classList.contains('unfurl')) return;
    const box = scroller.getBoundingClientRect();
    const eye = box.top + box.height / 2, reach = box.height / 2;
    for (const el of visibleLines()) {
      const r = el.getBoundingClientRect();
      const t = Math.min(1, Math.abs(r.top + r.height / 2 - eye) / reach);
      el.style.opacity = (FOCUS_FLOOR + (1 - FOCUS_FLOOR) * (0.5 + 0.5 * Math.cos(Math.PI * t))).toFixed(3);
    }
  }
  function queueFocus() { if (!focusPending) { focusPending = true; requestAnimationFrame(focusLines); } }
  function clearFocus() {
    for (const el of page.querySelectorAll('.line, .eyebrow')) el.style.opacity = '';
    page.style.paddingTop = page.style.paddingBottom = '';
  }
  function setUnfurl(on) {
    if (document.body.classList.contains('unfurl') === on) return;
    document.body.classList.toggle('unfurl', on);
    if (on) requestAnimationFrame(() => { padForFocus(); scroller.scrollTop = scroller.scrollHeight; focusLines(); });
    else { clearFocus(); scroller.scrollTop = 0; }
  }
  scroller.addEventListener('scroll', queueFocus, { passive: true });
  if (storyLink) storyLink.addEventListener('click', (e) => { e.stopPropagation(); setLook(false); setUnfurl(!document.body.classList.contains('unfurl')); });
  window.addEventListener('resize', () => { if (document.body.classList.contains('unfurl')) { padForFocus(); queueFocus(); } });

  reach(0);

  return {
    choose, advance, setLook, setUnfurl,
    revealed: () => revealed.slice(),
    pending: () => queue.length,
    trace,
  };
}

/* ---------- looking: the name and description of the drawing in view ---------- */
function createLooking() {
  const el = document.querySelector('.looking');
  if (!el) return { show() {} };
  const items = [...el.querySelectorAll('.looking-item[data-drawing]')];
  return {
    show(id) {
      let any = false;
      for (const it of items) { const on = it.dataset.drawing === id; it.classList.toggle('is-on', on); any = any || on; }
      el.classList.toggle('has-item', any);
    },
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
const looking = createLooking();

/* the drawing a view is about, for the plate */
function focusOf(target) {
  if (typeof target === 'string') return target === 'sheet' ? (sheetData.hero || null) : target;
  if (Array.isArray(target)) return target.length ? focusOf(target[0]) : null;
  if (target && typeof target.snap === 'string') return target.snap;
  return null;
}
function showView(target) {
  looking.show(focusOf(target));
  if (sheet) sheet.show(target);
}

const caption = createCaption({
  onChoose(id) {
    const v = views.get(id);
    if (!v) { console.warn(`[env] no view for section "${id}"; the camera stays`); return; }
    if (sheet) showView(v.target);
    else pendingSection = id;
  },
  onLook() { /* the template does not re-fit: the drawing is under the reader's hand */ },
});
initStoryToggle(() => {});
initHamburger();

/* Where the sheet may frame: the template's clearArea. The screen, less the nav and less
   the caption at the foot, measured only at rest (one line and one row of pills), so
   opening the readback or looking never rescales the drawing under the reader. */
let captionReserve = 0;
function noteCaptionHeight() {
  const b = document.body.classList;
  if (b.contains('unfurl') || b.contains('look') || root.getAttribute('data-story') !== 'on') return;
  captionReserve = caption.trace.offsetHeight;
}
function freeRegion() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const nav = document.querySelector('.navbar');
  const navH = nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0;
  if (root.classList.contains('env-nosheet')) return { left: 0, top: navH, right: vw, bottom: vh };
  noteCaptionHeight();
  const L = phone.matches ? 16 : (measure('var(--L)') || 80);
  const look = document.body.classList.contains('look');
  const foot = look ? 0 : (captionReserve || Math.min(caption.trace.offsetHeight, vh * 0.3));
  return { left: L, top: navH + L / 4, right: vw - L, bottom: Math.max(navH + 80, vh - foot - L / 4) };
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
    root.classList.add('env-sheet-on');
    looking.show(focusOf(views.get('arrival').target));
    sheet = await mod.createSheet({
      stage, data: sheetData, views, reduceMotion, freeRegion,
      onFocus: (id) => looking.show(id),
      onHold: () => caption.setLook(true),          /* taking hold of the drawing is looking */
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
  caption,
  trace: caption,
  views,
  freeRegion,
  get sheet() { return sheet; },
  ready: boot(),
};
