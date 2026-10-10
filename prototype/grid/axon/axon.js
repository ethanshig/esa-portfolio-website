/* ===================================================================
   PROTOTYPE — axonometric dot-grid index (prototype/grid/axon)

   At rest: a flat cartesian plan on dot paper. Click, tap or Enter on a
   card: it lifts into 2:1 dimetric (lift.js) and holds, with Open / turn /
   Esc in the card's own HTML. A second click on the lifted card follows its
   link. This script adds no reader-visible text.

   URL switches for review and screenshots (all optional):
     ?count=6|8  &theme=dark|light  &source=glb|test|sheet
     &vertical=true|paper  &paper=0..1  &auto=1  &lift=<card index>
   =================================================================== */
import { Paper } from './paper.js';

const AUTO_MS = 2000;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const html = document.documentElement;
const body = document.body;
const main = document.querySelector('.ax-main');
const grid = document.querySelector('.ax-grid');
const stageEl = document.querySelector('.ax-stage');
const dev = document.querySelector('.ax-dev');
if (!main || !grid || !stageEl) throw new Error('axon: page structure missing');

const paper = new Paper(document.querySelector('.ax-paper'), grid);

/* ---------- options: defaults, then URL ---------- */
const opts = { count: '6', paper: 0.32, auto: false, theme: 'dark', source: 'glb', vertical: 'true' };
const ALLOWED = {
  count: ['6', '8'], theme: ['dark', 'light'], source: ['glb', 'test', 'sheet'], vertical: ['true', 'paper'],
};
const params = new URLSearchParams(location.search);
for (const k of Object.keys(ALLOWED)) {
  const v = params.get(k);
  if (v !== null && ALLOWED[k].includes(v)) opts[k] = v;
}
if (params.has('paper')) {
  const v = Number(params.get('paper'));
  if (Number.isFinite(v) && v >= 0 && v <= 1) opts.paper = v;
}
if (params.get('auto') === '1') opts.auto = true;

/* ---------- the stage, loaded on first use ---------- */
let liftModule = null;
let stage = null;
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

/* ---------- lift / drop ---------- */
let liftedCard = null;
let seq = 0;
let autoTimer = 0;

function cancelAuto() { if (autoTimer) { clearTimeout(autoTimer); autoTimer = 0; } }

function follow(card) {
  const link = card.querySelector('.ax-card-link');
  if (link) window.location.href = link.href;
}

function clearLifted(card) {
  card.classList.remove('is-lifted', 'is-drawn');
}

async function lift(card) {
  const my = ++seq;
  cancelAuto();
  if (liftedCard && liftedCard !== card) clearLifted(liftedCard);
  liftedCard = card;

  let st;
  try {
    st = await getStage();
  } catch (err) {
    /* three.js did not load (offline CDN, no WebGL): the card is still a link */
    console.warn('[axon] lift unavailable, following the link:', err);
    if (my === seq) follow(card);
    return;
  }
  const img = card.querySelector('.ax-sheet img');
  if (img && !img.complete) {
    try { await img.decode(); } catch { /* a broken image lifts as a blank sheet */ }
  }
  if (my !== seq) return;

  grid.classList.add('has-lift');
  body.classList.add('ax-lifting');
  card.classList.add('is-lifted');
  let handle;
  try {
    handle = st.lift(card, { source: opts.source, vertical: opts.vertical });
  } catch (err) {
    console.error('[axon] lift failed, following the link:', err);
    clearLifted(card);
    grid.classList.remove('has-lift');
    body.classList.remove('ax-lifting');
    liftedCard = null;
    follow(card);
    return;
  }
  card.classList.add('is-drawn');          /* the stage drew its first frame synchronously */
  const open = card.querySelector('.ax-open');
  if (open) open.focus({ preventScroll: true });

  await handle.settled;
  if (my !== seq || liftedCard !== card) return;
  if (opts.auto) autoTimer = setTimeout(() => { if (liftedCard === card) follow(card); }, AUTO_MS);
}

async function drop() {
  const card = liftedCard;
  if (!card) return;
  const my = ++seq;
  cancelAuto();
  liftedCard = null;
  const hadFocus = card.contains(document.activeElement);
  grid.classList.remove('has-lift');
  body.classList.remove('ax-lifting');
  card.classList.remove('is-lifted');
  if (hadFocus) {
    const link = card.querySelector('.ax-card-link');
    if (link) link.focus({ preventScroll: true });
  }
  if (stage) await stage.drop();
  if (liftedCard !== card) card.classList.remove('is-drawn');   /* unless it was lifted again meanwhile */
}

function dropNow() {
  cancelAuto();
  seq++;
  if (stage) stage.dropNow();
  if (liftedCard) clearLifted(liftedCard);
  liftedCard = null;
  grid.classList.remove('has-lift');
  body.classList.remove('ax-lifting');
}

/* ---------- input ---------- */
grid.addEventListener('click', (e) => {
  const link = e.target.closest('.ax-card-link');
  if (link) {
    /* modified clicks keep their browser meaning (new tab, etc.) */
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const card = link.closest('.ax-card');
    if (card === liftedCard) return;      /* second click on the lifted card: go */
    e.preventDefault();
    lift(card);
    return;
  }
  const btn = e.target.closest('.ax-hold button');
  if (btn && liftedCard && liftedCard.contains(btn)) {
    if (btn.dataset.turn && stage) stage.turn(Number(btn.dataset.turn));
    else if (btn.hasAttribute('data-put')) drop();
  }
});

document.addEventListener('click', (e) => {
  if (!liftedCard) return;
  if (e.target.closest('.ax-dev')) return;
  const card = e.target.closest('.ax-card');
  if (card === liftedCard) return;
  if (e.target.closest('.ax-card-link')) return;   /* another card: the grid handler lifted it */
  drop();
});

document.addEventListener('keydown', (e) => {
  if (!liftedCard) return;
  if (e.target.closest && e.target.closest('.ax-dev, input, select, textarea')) return;
  if (e.key === 'Escape') { e.preventDefault(); drop(); }
  else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && stage) {
    e.preventDefault();
    stage.turn(e.key === 'ArrowLeft' ? -1 : 1);
  }
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
  q('[data-dev="auto"]').checked = opts.auto;
  q('[data-dev="theme"]').value = opts.theme;
  q('[data-dev="source"]').value = opts.source;
  q('[data-dev="vertical"]').value = opts.vertical;

  dev.addEventListener('input', (e) => {
    const t = e.target;
    if (t.name === 'ax-count') { opts.count = t.value; applyCount(); }
    else if (t.dataset.dev === 'paper') { opts.paper = Number(t.value); applyPaper(); }
  });
  dev.addEventListener('change', (e) => {
    const t = e.target;
    switch (t.dataset.dev) {
      case 'auto': opts.auto = t.checked; if (!opts.auto) cancelAuto(); break;
      case 'theme': opts.theme = t.value; applyTheme(); break;
      case 'source': opts.source = t.value; dropNow(); break;
      case 'vertical': opts.vertical = t.value; dropNow(); break;
      default: break;
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
window.addEventListener('load', () => {
  paper.refresh();
  /* warm the module cache so the first lift does not wait on the CDN */
  const warm = () => loadLiftModule().catch(() => { /* lift() reports it if it is still down */ });
  if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 2000 });
  else setTimeout(warm, 500);
});

const cards = Array.from(grid.querySelectorAll('.ax-card:not(.ax-placeholder)'));
const liftParam = params.get('lift');
if (liftParam !== null) {
  const card = cards[Number(liftParam)];
  if (card) window.addEventListener('load', () => lift(card));
}

/* for the verifier */
window.__axon = {
  opts, paper, cards,
  lift: (i) => lift(cards[i]),
  drop,
  turn: (d) => stage && stage.turn(d),
  debug: () => (stage ? stage.debug() : null),
  isLifted: () => !!liftedCard,
};
