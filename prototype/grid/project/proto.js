/* PROTOTYPE switcher: the three paper-in-3D decisions as URL params, and four presets.
   Every word is in the HTML; this marks the current values and navigates. The lattice is
   built at load, so a change reloads the page with the new params.
   Keys: [ and ] cycle presets (space, enter and the right arrow already step the caption). */
const PRESETS = {
  P1: { extent: 'tight', drawings: 'clear', verticals: 'lattice' },
  P2: { extent: 'tight', drawings: 'clear', verticals: 'all' },
  P3: { extent: 'sheet', drawings: 'under', verticals: 'lattice' },
  P4: { extent: 'sheet', drawings: 'clear', verticals: 'all' },
};
const DEFAULTS = { ...PRESETS.P1, grid: 'quiet', seat: 'ground', axes: 'datum', palette: 'nebula', twinkle: 'more' };
const CYCLE_KEYS = { g: 'grid', o: 'seat', x: 'axes', p: 'palette', t: 'twinkle' };
const ORDER = Object.keys(PRESETS);

const bar = document.querySelector('.proto-bar');
if (bar) {
  const q = new URLSearchParams(location.search);
  const cur = {};
  for (const key of Object.keys(DEFAULTS)) {
    const allowed = [...bar.querySelectorAll(`[data-param="${key}"] [data-value]`)].map((b) => b.dataset.value);
    const v = q.get(key);
    cur[key] = v !== null && allowed.includes(v) ? v : DEFAULTS[key];
  }
  const presetOf = (o) => ORDER.find((p) => Object.entries(PRESETS[p]).every(([k, v]) => o[k] === v)) || null;
  const cycle = (key, d) => {
    const vals = [...bar.querySelectorAll(`[data-param="${key}"] [data-value]`)].map((b) => b.dataset.value);
    if (!vals.length) return;
    go({ ...cur, [key]: vals[(vals.indexOf(cur[key]) + d + vals.length) % vals.length] });
  };
  for (const b of bar.querySelectorAll('[data-param] [data-value]')) {
    b.setAttribute('aria-pressed', String(cur[b.closest('[data-param]').dataset.param] === b.dataset.value));
  }
  const active = presetOf(cur);
  for (const b of bar.querySelectorAll('[data-preset]')) b.setAttribute('aria-pressed', String(b.dataset.preset === active));

  const go = (o) => {
    const next = new URLSearchParams(location.search);
    for (const [k, v] of Object.entries(o)) next.set(k, v);
    location.search = next.toString();
  };
  const step = (d) => {
    const i = active ? ORDER.indexOf(active) : -1;
    go({ ...cur, ...PRESETS[ORDER[(i + d + ORDER.length) % ORDER.length]] });
  };
  bar.addEventListener('click', (e) => {
    const v = e.target.closest('[data-value]');
    if (v) { go({ ...cur, [v.closest('[data-param]').dataset.param]: v.dataset.value }); return; }
    const p = e.target.closest('[data-preset]');
    if (p) { go({ ...cur, ...PRESETS[p.dataset.preset] }); return; }
    const s = e.target.closest('[data-step]');
    if (s) step(Number(s.dataset.step));
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
    if (e.key === '[') { e.preventDefault(); step(-1); }
    else if (e.key === ']') { e.preventDefault(); step(1); }
    else if (CYCLE_KEYS[e.key.toLowerCase()] && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); cycle(CYCLE_KEYS[e.key.toLowerCase()], e.shiftKey ? -1 : 1); }
  });
}
