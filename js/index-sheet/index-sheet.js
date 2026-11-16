/* ===================================================================
   INDEX SHEET — index.html as a pannable, zoomable sheet of Plates
   (issue #17; ported from prototype/grid/index-sheet, variant F).

   The HTML (scripts/build-index.js) already carries every word: one link
   per real Plate in growth order, placeholder titles, the arrows, the hint.
   Without JavaScript or WebGL those links are a plain static grid. This
   module upgrades the page to the sheet: it grows the same field
   (field.js), hands the real Plates to sheet2d.js, and lays the plates
   layer over it (plates.js). It adds no text.

   Controls are the flat sheet's, unchanged (Rhino-exact for the mouse).
   Index-only: the arrow keys follow the arrows, zoom and pan are limited,
   a one-finger touch pan glides on (the fling), and a left-drag that moved
   nothing shows the hint once per session.

   ?debug publishes window.__plates (the plates layer's state) every frame
   for the verification scripts. No other URL switch.
   =================================================================== */
import * as DATA from '../../data/plates.js';
import { SHAPES } from '../../data/plate-shapes.js';
import { growField, limitsFor, frameAround, NAV_H } from './field.js';
import { createSheet } from '../sheet/sheet2d.js';
import { attachPlates, PX_PER_STEP, svgData } from './plates.js';
import { attachThemeSwitch } from '../theme.js';

const root = document.documentElement;
const NARROW = 640;
const FRICTION = 0.0035;           /* per ms: speed halves in about 200 ms */
const GLIDE_STOP = 0.02;           /* px per ms */
const FLING_MIN = 0.3;             /* px per ms: slower than this at lift is a drop, not a flick */
const HINT_KEY = 'esa-index-hint';

/* Without the sheet: the static grid stays (CSS keys on html.ix-js). Loud, because it is a failure. */
function fallBack(why) {
  root.classList.remove('ix-js', 'env-live', 'ls-landing', 'ls-unbuilding');
  console.error(`[index] showing the static index: ${why}`);
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/* what the sheet painted in page colours, repainted when the theme turns; null until it is up */
let repaint = null;

/* the theme switch works with or without the sheet */
attachThemeSwitch({
  button: document.querySelector('[data-theme-toggle]'),
  reduceMotion,
  onChange: () => (repaint ? repaint() : undefined),
});

async function boot() {
  if (!hasWebGL()) { fallBack('no WebGL'); return; }
  const stage = document.querySelector('.env-stage');
  if (!stage) throw new Error('no .env-stage in the page');

  const field = growField({ ...DATA, SHAPES });
  const drawings = field.plates.filter((p) => !p.placeholder).map((p) => {
    const px = [p.wSteps * PX_PER_STEP, p.hSteps * PX_PER_STEP];
    /* a model Plate is bare paper until its still lands */
    return { id: p.id, at: [p.rect.u0, p.rect.v0], w: p.wSteps, px, src: p.drawing || svgData(...px, '') };
  });
  const arrival = () => ({ camera: frameAround(field.plates[field.seed], window.innerWidth, window.innerHeight) });
  const views = new Map([['arrival', { section: 'arrival', target: arrival() }]]);
  const byId = new Map(field.plates.map((p) => [p.id, p]));

  const sheet = await createSheet({
    stage, data: { drawings }, views, reduceMotion,
    freeRegion: () => ({ left: 0, right: window.innerWidth, top: NAV_H, bottom: window.innerHeight }),
    limits: (W, H) => limitsFor(field.bounds, W, H),
    onFocus(id) {
      const p = byId.get(id);
      if (p && p.href) location.href = p.href;
      return false;                                   /* opening a Plate never moves the view */
    },
  });
  root.classList.add('env-live');

  /* crossing the phone width re-frames the arrival; any other resize keeps the reader's view */
  let wasNarrow = window.innerWidth < NARROW;
  window.addEventListener('resize', () => {
    sheet.resize();
    const narrow = window.innerWidth < NARROW;
    if (narrow !== wasNarrow) { wasNarrow = narrow; sheet.show(arrival(), { animate: false }); }
  });

  const plates = attachPlates({ sheet, stage, field, records: DATA.RECORDS, reduceMotion });
  if (new URLSearchParams(location.search).has('debug')) {
    const publish = () => { window.__plates = plates.state(); requestAnimationFrame(publish); };
    publish();
  }

  attachFling(stage, sheet);
  attachHint(stage);
  repaint = () => {
    sheet.retheme();                      /* the paper's dots read the page colours on redraw */
    return plates.retheme();              /* the stills are baked in page colours */
  };
  /* the paper follows the sun (js/daylight.js): repaint when it has visibly moved */
  window.addEventListener('esa-daylight', () => repaint());
}

/* A one-finger touch pan that leaves with speed glides on and slows, like a native scroll. Two
   fingers never fling; the mouse is untouched (Rhino-exact). */
function attachFling(stage, sheet) {
  let track = null, glide = 0;
  const fingers = new Set();
  stage.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    cancelAnimationFrame(glide);
    fingers.add(e.pointerId);
    track = fingers.size === 1 ? { id: e.pointerId, pts: [[e.clientX, e.clientY, e.timeStamp]] } : null;
  }, true);
  stage.addEventListener('pointermove', (e) => {
    if (!track || e.pointerId !== track.id) return;
    track.pts.push([e.clientX, e.clientY, e.timeStamp]);
    while (track.pts.length > 2 && e.timeStamp - track.pts[0][2] > 80) track.pts.shift();   /* the last 80 ms */
  }, true);
  const end = (e) => {
    if (e.pointerType !== 'touch') return;
    fingers.delete(e.pointerId);
    if (!track || e.pointerId !== track.id) return;
    const a = track.pts[0], b = track.pts[track.pts.length - 1];
    track = null;
    const dt = b[2] - a[2];
    if (dt <= 0 || e.timeStamp - b[2] > 60) return;                       /* it stopped before lifting */
    let vx = (b[0] - a[0]) / dt, vy = (b[1] - a[1]) / dt;                  /* px per ms */
    if (Math.hypot(vx, vy) < FLING_MIN) return;
    let t0 = performance.now();
    const step = (t) => {
      const ms = Math.min(32, t - t0); t0 = t;
      const k = Math.exp(-FRICTION * ms);
      sheet.panBy(vx * ms, vy * ms);
      vx *= k; vy *= k;
      if (Math.hypot(vx, vy) > GLIDE_STOP) glide = requestAnimationFrame(step);
    };
    glide = requestAnimationFrame(step);
  };
  stage.addEventListener('pointerup', end, true);
  stage.addEventListener('pointercancel', end, true);
}

/* The left-drag hint: once per session, only after a left-drag that moved nothing (the mouse's left
   button is Rhino's selection window; the view never moves). */
function attachHint(stage) {
  const hint = stage.querySelector('.ix-hint');
  if (!hint) throw new Error('no .ix-hint in the page');
  let seen = false;
  try { seen = sessionStorage.getItem(HINT_KEY) === '1'; } catch { /* storage blocked: show it each load */ }
  let press = null;
  stage.addEventListener('pointerdown', (e) => { press = e.button === 0 && e.pointerType === 'mouse' ? [e.clientX, e.clientY] : null; }, true);
  stage.addEventListener('pointermove', (e) => {
    if (!press || seen) return;
    if (Math.hypot(e.clientX - press[0], e.clientY - press[1]) < 12) return;
    seen = true; press = null;
    try { sessionStorage.setItem(HINT_KEY, '1'); } catch { /* in-memory only */ }
    hint.hidden = false;
    requestAnimationFrame(() => hint.classList.add('is-on'));
    setTimeout(() => hint.classList.remove('is-on'), 3500);
  }, true);
  window.addEventListener('pointerup', () => { press = null; }, true);
}

boot().catch((err) => fallBack(err && err.stack ? err.stack : String(err)));
