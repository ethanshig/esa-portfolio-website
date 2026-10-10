/* ===================================================================
   PROTOTYPE — axonometric dot-grid index (prototype/grid/axon)

   At rest: a flat cartesian plan on dot paper. The rule: if a record is 3D
   it renders 3D, if it is 2D it renders 2D.

   3D records (li[data-model]):
     pointer that hovers  hover or keyboard focus lifts the card in place into
                          2:1 dimetric (lift.js); leave or blur lays it down.
                          One card up at a time; crossing cards fast never
                          queues. Click opens the project.
     touch (hover: none)  first tap lifts (no navigation), a second tap on the
                          lifted card opens it, a tap anywhere else lays it down.
   2D records: hover or keyboard focus turns the sheet to the record's next
     Drawing, in CSS alone (axon.css). Touch opens on the first tap. They
     never load three.js.

   Modified clicks (new tab etc.) keep their browser meaning everywhere.
   This script adds no reader-visible text.

   URL switches for review and screenshots (all optional):
     ?count=6|8  &theme=dark|light  &vertical=true|paper  &paper=0..1
     &lift=<card index>   (lifts that card once the page has loaded)
   =================================================================== */
import { Paper } from './paper.js';

const HOVER_INTENT_MS = 60;        /* a pointer only passing over a card does not lift it */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const touchOnly = window.matchMedia('(hover: none)');

const html = document.documentElement;
const body = document.body;
const main = document.querySelector('.ax-main');
const grid = document.querySelector('.ax-grid');
const stageEl = document.querySelector('.ax-stage');
const dev = document.querySelector('.ax-dev');
if (!main || !grid || !stageEl) throw new Error('axon: page structure missing');

const paper = new Paper(document.querySelector('.ax-paper'), grid);

/* ---------- options: defaults, then URL ---------- */
const opts = { count: '6', paper: 0.32, theme: 'dark', vertical: 'true' };
const ALLOWED = { count: ['6', '8'], theme: ['dark', 'light'], vertical: ['true', 'paper'] };
const params = new URLSearchParams(location.search);
for (const k of Object.keys(ALLOWED)) {
  const v = params.get(k);
  if (v !== null && ALLOWED[k].includes(v)) opts[k] = v;
}
if (params.has('paper')) {
  const v = Number(params.get('paper'));
  if (Number.isFinite(v) && v >= 0 && v <= 1) opts.paper = v;
}

const is3D = (card) => !!(card && card.dataset.model);
const cardOf = (el) => (el && el.closest ? el.closest('.ax-card:not(.ax-placeholder)') : null);

/* ---------- the stage: module on first need, WebGL on first lift ---------- */
let liftModule = null;
let stage = null;
let stageBroken = false;
function loadLiftModule() {
  if (!liftModule) {
    liftModule = import('./lift.js').catch((err) => { liftModule = null; throw err; });
  }
  return liftModule;
}
async function getStage() {
  if (stage) return stage;
  const mod = await loadLiftModule();
  if (!stage) stage = mod.createStage({ stageEl, paper, reduceMotion });
  return stage;
}

/* ---------- lift / drop: one card up at a time ---------- */
let liftedCard = null;        /* the card that is up or on its way up */
let seq = 0;                  /* bumps on every lift / drop: stale awaits bail */

function setLiftedClasses(card, on) {
  body.classList.toggle('ax-lifting', on);
  if (!on && card) card.classList.remove('is-lifted');
  if (on) card.classList.add('is-lifted');
}

/* Resolves true if the card is up (its first frame drawn), false if the lift
   was superseded or is unavailable. */
async function lift(card) {
  if (!is3D(card)) return false;
  const my = ++seq;
  if (liftedCard && liftedCard !== card) {
    /* the stage's own lift tears the old one down; clear its classes now */
    liftedCard.classList.remove('is-lifted', 'is-drawn');
  }
  liftedCard = card;

  let st;
  try {
    st = await getStage();
  } catch (err) {
    if (!stageBroken) console.warn('[axon] lift unavailable (three.js or WebGL); cards stay flat:', err);
    stageBroken = true;
    if (my === seq) liftedCard = null;
    return false;
  }
  const img = card.querySelector('.ax-sheet img:not(.ax-next)');
  if (img && !img.complete) {
    try { await img.decode(); } catch { /* a broken image lifts as a blank sheet */ }
  }
  if (my !== seq) return false;

  /* the stage shows one card: any other that was drawn (say, mid-drop) is flat again */
  for (const other of grid.querySelectorAll('.ax-card.is-drawn')) {
    if (other !== card) other.classList.remove('is-lifted', 'is-drawn');
  }
  setLiftedClasses(card, true);
  let handle;
  try {
    /* lifting the card that is on its way down turns it back up from where it is */
    handle = st.lift(card, { vertical: opts.vertical });
  } catch (err) {
    console.error('[axon] lift failed; the card stays flat:', err);
    setLiftedClasses(card, false);
    liftedCard = null;
    return false;
  }
  card.classList.add('is-drawn');          /* the stage drew its first frame synchronously */
  watchModel(card, handle, my);
  return true;
}

/* A record whose model cannot load goes back down rather than staying a tilted sheet. */
function watchModel(card, handle, my) {
  handle.model.then((ok) => {
    if (!ok && my === seq && liftedCard === card) drop(card);
  });
}

/* Lay a card down. With a card given, only if it is the one that is up. */
async function drop(card = liftedCard) {
  if (!card || card !== liftedCard) return;
  seq++;
  liftedCard = null;
  setLiftedClasses(card, false);
  if (!stage) { card.classList.remove('is-drawn'); return; }
  const gone = await stage.drop();
  /* gone: the stage no longer shows this card (flat, or another took the stage) */
  if (gone && liftedCard !== card) card.classList.remove('is-drawn');
}

function dropNow() {
  seq++;
  if (stage) stage.dropNow();
  if (liftedCard) liftedCard.classList.remove('is-lifted', 'is-drawn');
  liftedCard = null;
  body.classList.remove('ax-lifting');
}

/* ---------- hover (pointers that hover) ---------- */
let intentTimer = 0;
let intentCard = null;
function clearIntent() { clearTimeout(intentTimer); intentTimer = 0; intentCard = null; }

grid.addEventListener('pointerover', (e) => {
  if (e.pointerType === 'touch' || touchOnly.matches) return;
  const card = cardOf(e.target);
  if (!is3D(card) || card === intentCard) return;
  if (card === liftedCard && card.classList.contains('is-lifted')) return;
  clearIntent();
  /* still on the stage, on its way down: turn it back up at once */
  if (card.classList.contains('is-drawn')) { lift(card); return; }
  intentCard = card;
  intentTimer = setTimeout(() => { intentTimer = 0; intentCard = null; lift(card); }, HOVER_INTENT_MS);
});

grid.addEventListener('pointerout', (e) => {
  if (e.pointerType === 'touch' || touchOnly.matches) return;
  const card = cardOf(e.target);
  if (!card) return;
  if (card.contains(e.relatedTarget)) return;            /* moving within the card */
  if (card === intentCard) clearIntent();
  /* keyboard focus inside keeps it up */
  const link = card.querySelector('.ax-card-link');
  if (link && link.matches(':focus-visible')) return;
  if (card === liftedCard) drop(card);
});

/* ---------- keyboard focus = hover ---------- */
grid.addEventListener('focusin', (e) => {
  const link = e.target.closest && e.target.closest('.ax-card-link');
  if (!link || !link.matches(':focus-visible')) return;  /* a tap or click focus is not a hover */
  const card = cardOf(link);
  if (is3D(card)) { clearIntent(); lift(card); }
});
grid.addEventListener('focusout', (e) => {
  const card = cardOf(e.target);
  if (!card || card !== liftedCard) return;
  if (card.contains(e.relatedTarget)) return;
  if (card.matches(':hover') && !touchOnly.matches) return;   /* the pointer still holds it */
  drop(card);
});

/* ---------- click / tap ---------- */
grid.addEventListener('click', (e) => {
  const link = e.target.closest('.ax-card-link');
  if (!link) return;
  /* modified clicks keep their browser meaning (new tab, etc.) */
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const card = cardOf(link);
  if (!touchOnly.matches || !is3D(card)) return;          /* hover devices and 2D records: open */
  if (card === liftedCard && card.classList.contains('is-lifted')) return;   /* second tap: open */
  if (stageBroken) return;                                /* nothing to lift into: open */
  e.preventDefault();
  lift(card).then((up) => {
    /* three.js could not start: the tap still has to go somewhere */
    if (!up && stageBroken) window.location.href = link.href;
  });
});

/* a tap or click anywhere but the lifted card lays it down */
document.addEventListener('click', (e) => {
  if (!liftedCard) return;
  if (e.target.closest('.ax-dev')) return;
  const card = cardOf(e.target);
  if (card === liftedCard) return;
  if (card && is3D(card) && e.target.closest('.ax-card-link')) return;   /* the grid handler lifted it */
  drop();
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !liftedCard) return;
  if (e.target.closest && e.target.closest('.ax-dev, input, select, textarea')) return;
  drop();
});

/* ---------- layout ---------- */
let reflowTimer = 0;
function reflow() {
  paper.refresh();
  if (stage) stage.reflow();
}
function reflowSoon() { clearTimeout(reflowTimer); reflowTimer = setTimeout(reflow, 80); }
window.addEventListener('resize', reflowSoon);
new ResizeObserver(reflowSoon).observe(main);

/* ---------- dev panel ---------- */
function applyTheme() {
  html.dataset.theme = opts.theme;
  paper.refresh(true);
  if (stage) stage.recolor();
}
function applyCount() {
  dropNow();
  main.dataset.count = opts.count;
  paper.refresh();
}
function applyPaper() { html.style.setProperty('--ax-paper', String(opts.paper)); }

if (dev) {
  const q = (s) => dev.querySelector(s);
  const countInput = q(`input[name="ax-count"][value="${opts.count}"]`);
  if (countInput) countInput.checked = true;
  q('[data-dev="paper"]').value = String(opts.paper);
  q('[data-dev="theme"]').value = opts.theme;
  q('[data-dev="vertical"]').value = opts.vertical;

  dev.addEventListener('input', (e) => {
    const t = e.target;
    if (t.name === 'ax-count') { opts.count = t.value; applyCount(); }
    else if (t.dataset.dev === 'paper') { opts.paper = Number(t.value); applyPaper(); }
  });
  dev.addEventListener('change', (e) => {
    const t = e.target;
    switch (t.dataset.dev) {
      case 'theme': opts.theme = t.value; applyTheme(); break;
      case 'vertical': opts.vertical = t.value; dropNow(); break;
      default: break;   /* count and paper are handled on input */
    }
  });
}

/* ---------- start ---------- */
html.dataset.theme = opts.theme;
main.dataset.count = opts.count;
applyPaper();
if (window.LineSystem) window.LineSystem.init();
paper.refresh(true);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => paper.refresh());

const cards = Array.from(grid.querySelectorAll('.ax-card:not(.ax-placeholder)'));
const modelIds = cards.filter(is3D).map((c) => c.dataset.model);

window.addEventListener('load', () => {
  paper.refresh();
  /* warm three.js and the models (no WebGL context yet) so the first lift is quick */
  const warm = () => loadLiftModule()
    .then((mod) => mod.preload(modelIds))
    .catch(() => { /* lift() reports it if three.js is still unreachable */ });
  if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 2000 });
  else setTimeout(warm, 500);
  const liftParam = params.get('lift');
  if (liftParam !== null) {
    const card = cards[Number(liftParam)];
    if (is3D(card)) lift(card);
  }
});

/* for the verifier */
window.__axon = {
  opts, paper, cards,
  lift: (i) => lift(cards[i]),
  drop: () => drop(),
  debug: () => (stage ? stage.debug() : null),
  isLifted: () => !!liftedCard,
  liftedIndex: () => cards.indexOf(liftedCard),
};
