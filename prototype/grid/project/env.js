/* ===================================================================
   ENV — the project page as a drawing sheet (ADR-0007). PROTOTYPE
   (prototype/grid/project). Shared by every project page.

   The page never scrolls. The viewport is the paper; the sheet module
   (sheet3d.js for a Record with a model, sheet2d.js for one without)
   lays the Drawings on it. The story panel at the foot is the only
   scroller and holds the Document.

   THIS FILE ADDS NO TEXT (docs/story-layer-spec.md, contract 1). Every
   word is in the HTML; script toggles classes and attributes, sets
   flex `order` so revealed sections read in the order they were chosen,
   and moves a camera.

   Page contract (all in the HTML):
     html[data-story][data-arrival]     baked by the page; head script applies
                                        ?story= / localStorage before paint and
                                        adds .env-js (gating on)
     #env-sheet  (application/json)     { kind: '2d' | '3d', ... }  the sheet
     #env-views  (application/json)     { views: [{ section, target, proposed }] }
     .env-stage > canvas.env-dots, .env-gl, .env-overlay, .env-home
     .env-panel > .env-handle, .env-panel-scroll > header, .narration[data-beat],
                  .env-section[data-section], .env-drawings, .env-choices,
                  .crossings, .project-navigation

   URL switches: ?story=on|off  ?theme=dark|light (head script)
                 ?webgl=off     force the no-WebGL fallback (verification)
   =================================================================== */

import { NoSheetError } from './errors.js';

const STORY_KEY = 'esa-story';
const SECTIONS = ['story', 'whatIDid', 'process', 'outcome', 'reflection'];
const ORDER = { head: 0, firstBeat: 1, choices: 900, crossings: 950, nav: 990, foot: 995 };

const root = document.documentElement;
root.classList.add('env-live');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

/* ---------- views: which part of the sheet each Document section is about ---------- */
function readViews() {
  const data = readJSON('env-views');
  if (!data || !Array.isArray(data.views)) throw new Error('env: #env-views needs a views array');
  const map = new Map();
  for (const v of data.views) {
    if (!v || typeof v.section !== 'string') throw new Error('env: every view needs a section');
    if (v.section !== 'arrival' && !SECTIONS.includes(v.section)) {
      throw new Error(`env: unknown view section "${v.section}"`);
    }
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
  /* the HTML hard-codes aria-pressed="true"; the head script may have applied a stored "off" */
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
  burger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
}

/* ===================================================================
   the panel: the CYOA with the story on, the plain Document with it off
   =================================================================== */
function createPanel({ onChoose, onSheetResize }) {
  const panel = must('.env-panel');
  const scroller = must('.env-panel-scroll', panel);
  const handle = panel.querySelector('.env-handle');
  const mode = root.getAttribute('data-arrival') === 'crossed' ? 'with' : 'meet';

  const head = must(':scope > .env-head', scroller);
  head.style.order = ORDER.head;
  const beats = [...scroller.querySelectorAll(':scope > .narration[data-beat]')]
    .map((el) => ({ el, n: Number(el.dataset.beat) }))
    .sort((a, b) => a.n - b.n);
  for (const b of beats) {
    if (!Number.isInteger(b.n) || b.n < 0) throw new Error(`env: bad data-beat "${b.el.dataset.beat}"`);
    b.lines = [...b.el.querySelectorAll(`.narration-line[data-mode="${mode}"]`)];
    b.el.classList.toggle('is-empty', b.lines.length === 0);
  }
  const sections = new Map();
  for (const el of scroller.querySelectorAll(':scope > .env-section[data-section]')) {
    const id = el.dataset.section;
    if (!SECTIONS.includes(id)) throw new Error(`env: unknown section "${id}"`);
    sections.set(id, el);
  }
  const choices = [...scroller.querySelectorAll('.env-choice[data-choose]')];
  for (const c of choices) {
    if (!sections.has(c.dataset.choose)) throw new Error(`env: choice "${c.dataset.choose}" has no section`);
  }
  const fixed = [
    ['.env-choices', ORDER.choices], ['.crossings', ORDER.crossings],
    ['.project-navigation', ORDER.nav], ['.env-foot', ORDER.foot],
  ];
  for (const [sel, o] of fixed) {
    const el = scroller.querySelector(`:scope > ${sel}`);
    if (el) el.style.order = o;
  }

  const revealed = [];
  let current = null;

  function markCurrent() {
    const reached = beats.filter((b) => b.n <= revealed.length && b.lines.length);
    const line = reached.length ? reached[reached.length - 1].lines.at(-1) : null;
    if (current === line) return;
    if (current) current.classList.remove('is-current');
    current = line;
    if (current) current.classList.add('is-current');
  }

  function reachBeats() {
    for (const b of beats) {
      if (b.n > revealed.length) continue;
      b.el.classList.add('is-reached');
      b.el.style.order = b.n === 0 ? ORDER.firstBeat : 1 + 2 * b.n;
    }
    markCurrent();
  }

  function scrollTo(el) {
    const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 12;
    scroller.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  function choose(id) {
    const el = sections.get(id);
    if (!el) throw new Error(`env: no section "${id}"`);
    if (!revealed.includes(id)) {
      revealed.push(id);
      el.style.order = 2 * revealed.length;
      el.classList.add('is-revealed');
      reachBeats();
    }
    for (const c of choices) {
      const on = c.dataset.choose === id;
      if (on) c.classList.add('is-taken');
      c.setAttribute('aria-current', on ? 'true' : 'false');
    }
    requestAnimationFrame(() => scrollTo(el));
    onChoose(id);
  }

  scroller.addEventListener('click', (e) => {
    const c = e.target.closest('.env-choice[data-choose]');
    if (c) choose(c.dataset.choose);
  });

  /* ---------- the bottom sheet on a phone: collapsed to the current line ---------- */
  const phone = window.matchMedia('(max-width: 640px)');
  function setSheet(state) {
    panel.dataset.sheet = state;
    if (handle) handle.setAttribute('aria-expanded', String(state === 'expanded'));
    panel.style.height = '';
    if (state === 'collapsed') scroller.scrollTop = 0;
  }
  if (handle) {
    let drag = null;
    handle.addEventListener('pointerdown', (e) => {
      drag = { y0: e.clientY, h0: panel.getBoundingClientRect().height, moved: false };
      try { handle.setPointerCapture(e.pointerId); } catch { /* fine without */ }
    });
    handle.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dy = e.clientY - drag.y0;
      if (Math.abs(dy) > 6) drag.moved = true;
      if (drag.moved) {
        const max = window.innerHeight * 0.9;
        panel.style.height = Math.min(max, Math.max(80, drag.h0 - dy)) + 'px';
      }
    });
    const end = (e) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      try { handle.releasePointerCapture(e.pointerId); } catch { /* already released */ }
      if (e.type === 'pointercancel') { setSheet(panel.dataset.sheet); return; }
      if (!d.moved) { setSheet(panel.dataset.sheet === 'expanded' ? 'collapsed' : 'expanded'); return; }
      const dy = e.clientY - d.y0;
      setSheet(dy < 0 ? 'expanded' : 'collapsed');
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
    /* keyboard: the handle is a button, Enter/Space fire click with detail 0 */
    handle.addEventListener('click', (e) => {
      if (e.detail === 0) setSheet(panel.dataset.sheet === 'expanded' ? 'collapsed' : 'expanded');
    });
  }
  setSheet('collapsed');
  phone.addEventListener('change', () => { setSheet('collapsed'); onSheetResize(); });

  reachBeats();

  return {
    choose,
    revealed: () => revealed.slice(),
    setSheet,
    sheetState: () => panel.dataset.sheet,
    /* where the free stage ends: the panel's resting top, not a dragged-open sheet */
    restingTop() {
      if (root.classList.contains('env-nosheet')) return window.innerHeight;
      if (phone.matches) {
        const rest = parseFloat(getComputedStyle(panel).getPropertyValue('--panel-rest')) || 132;
        return window.innerHeight - rest;
      }
      return panel.getBoundingClientRect().top;
    },
    onStoryChange(state) {
      if (state === 'on') markCurrent();
    },
  };
}

/* ===================================================================
   boot
   =================================================================== */
function fallback(err) {
  root.classList.remove('env-js');
  root.classList.add('env-static', 'env-nosheet');
  const stage = document.querySelector('.env-stage');
  if (stage) stage.setAttribute('aria-hidden', 'true');
  if (panel) panel.setSheet('expanded');          /* the panel is the page now; no bottom sheet */
  if (err instanceof NoSheetError) console.info(`[env] ${err.message}; showing the Document`);
  else if (err && /dynamically imported module|Failed to fetch|Importing a module script failed/i.test(String(err.message))) {
    console.warn('[env] the sheet could not load; showing the Document', err);
  } else {
    console.error('[env] the sheet failed; showing the Document', err);
  }
}

let sheet = null;
let pendingSection = null;

const views = readViews();
const sheetData = readJSON('env-sheet');
if (sheetData.kind !== '2d' && sheetData.kind !== '3d') throw new Error(`env: unknown sheet kind "${sheetData.kind}"`);

const panel = createPanel({
  onChoose(id) {
    const v = views.get(id);
    if (!v) { console.warn(`[env] no view for section "${id}"; the camera stays`); return; }
    if (sheet) sheet.show(v.target);
    else pendingSection = id;
  },
  onSheetResize() { if (sheet) sheet.resize(); },
});
initStoryToggle((state) => { if (panel) panel.onStoryChange(state); });
initHamburger();

async function boot() {
  const stage = must('.env-stage');
  try {
    if (sheetData.kind === '3d' && params.get('webgl') === 'off') {
      throw new NoSheetError('WebGL turned off by ?webgl=off');
    }
    const mod = sheetData.kind === '3d' ? await import('./sheet3d.js') : await import('./sheet2d.js');
    sheet = await mod.createSheet({
      stage,
      data: sheetData,
      views,
      reduceMotion,
      freeRegion() {
        const nav = document.querySelector('.navbar');
        const top = nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0;
        return { top, bottom: Math.max(top + 40, panel.restingTop()) };
      },
    });
    root.classList.add('env-sheet-on');
    if (pendingSection) sheet.show(views.get(pendingSection).target);
  } catch (err) {
    fallback(err);
  }
}

window.addEventListener('resize', () => { if (sheet) sheet.resize(); });

/* for the verifier: read-only views of the state, and the same actions a reader has */
window.__env = {
  panel,
  views,
  get sheet() { return sheet; },
  ready: boot(),
};
