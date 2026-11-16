/* PROTOTYPE (prototype/palette) — throwaway. Question: what colour should the site be, beyond black
   and white, while staying readable to every kind of colour vision?
   Rev 3: Ethan's watercolour (IMG_7650) as the paper, its pigment following the sun over Champaign; the work shown as made.
   Five palettes on the real index, switchable with ?palette=a..e, the floating bar's arrows, or ← →.
   The nav's own light/dark cell still turns each palette's paper. The bar also previews the page
   through protan, deutan, tritan and achromat eyes, and how the drawings sit on coloured paper.
   Loaded in <head> after the page's stylesheets, so the paper is right before first paint. */
(function () {
  const P = window.ESA_PALETTES, C = window.ESA_CVD, root = document.documentElement;
  const q = new URLSearchParams(location.search);
  const keys = P.map((p) => p.key);
  let cur = keys.includes(q.get('palette')) ? q.get('palette') : 'b';
  let vision = C.KINDS.includes(q.get('vision')) ? q.get('vision') : 'normal';
  /* rev 3: the work is shown as made (Ethan: "ultimately I need to communicate the design"), so no reprinting */
  let draw = ['shot', 'flush'].includes(q.get('drawings')) ? q.get('drawings') : 'flush';
  let wash = q.get('wash') === 'off' ? 'off' : 'on';
  /* rev 2 behaviours: Daylight follows the sun (live, or scrubbed through a Champaign day); Grid-aware is simulated */
  let grid = ['low', 'moderate', 'high'].includes(q.get('grid')) ? q.get('grid') : 'moderate';
  let hour = q.has('hour') ? Math.max(0, Math.min(24, +q.get('hour'))) : null;   /* null = now */
  const TOK = ['bg', 'alt', 'ink', 'muted', 'accent', 'border'];

  /* the palettes as CSS: html.ix-index[data-theme][data-palette] outranks the index's own light paper */
  const tokens = (m) => `--color-bg:${m.bg};--color-bg-alt:${m.alt};--color-primary:${m.ink};--color-text:${m.ink};--color-secondary:${m.muted};--color-text-light:${m.muted};--color-utility-gray:${m.muted};--color-accent:${m.accent};--color-border:${m.border};--pp-ink:${m.ink};--pp-bg:${m.bg};`;
  const css = P.filter((p) => !p.behaviour || p.light).map((p) => ['light', 'dark'].map((t) =>
    `html.ix-index[data-theme="${t}"][data-palette="${p.key}"],html[data-theme="${t}"][data-palette="${p.key}"]{${tokens(p[t])}}`).join('\n')).join('\n');
  const style = document.createElement('style');
  style.textContent = css + `
/* applied colour (R7): a placeholder spot — the dotted outline on Records still growing */
html[data-palette] .ix-active { stroke: var(--color-accent); opacity: 1; }
/* drawings on coloured paper. flush: white grounds take the paper (multiplied by it; light paper only).
   ink: line drawings are reprinted in the palette's ink on its paper; photographs keep their colour. */
html[data-drawings="flush"][data-theme="light"] .env-plane-img:not(.ix-model) { filter: url(#pp-flush); }
html[data-drawings="ink"] .env-plane-img.pp-line { filter: url(#pp-duo); }
html[data-drawings="ink"][data-theme="light"] .env-plane-img:not(.pp-line):not(.ix-model) { filter: url(#pp-flush); }
/* Grid-aware: the page sheds weight as the grid gets dirtier (overrides the drawings menu) */
html[data-palette="e"][data-grid="low"][data-theme="light"] .env-plane-img:not(.ix-model) { filter: url(#pp-flush); }
html[data-palette="e"][data-grid="low"][data-theme="dark"] .env-plane-img:not(.ix-model) { filter: none; }
html[data-palette="e"][data-grid="moderate"] .env-plane-img.pp-line { filter: url(#pp-duo); }
html[data-palette="e"][data-grid="moderate"][data-theme="light"] .env-plane-img:not(.pp-line):not(.ix-model) { filter: url(#pp-flush); }
html[data-palette="e"][data-grid="moderate"][data-theme="dark"] .env-plane-img:not(.pp-line):not(.ix-model) { filter: none; }
html[data-palette="e"][data-grid="high"] .env-plane-img:not(.ix-model) { filter: url(#pp-duo); }
html[data-palette="e"][data-grid="high"] .env-dots { opacity: 0.15; }
/* the wash sits under the dots and the plates; the plates are never filtered by it */
.pp-wash { position: absolute; inset: 0; pointer-events: none; display: none; background: url(prototype/palette/wash.jpg) center / cover no-repeat; }
html[data-wash="on"] .pp-wash { display: block; }
.pp-wash-tint { filter: url(#pp-tint); }
.pp-wash-paint { filter: url(#pp-paint); opacity: var(--pp-painted, 0); }
#pp-bar .pp-beh { display: none; align-items: center; gap: 6px; }
#pp-bar .pp-beh.on { display: inline-flex; }
#pp-bar input[type=range] { width: 140px; }
html[data-vision="protan"] { filter: url(#pp-protan); }
html[data-vision="deutan"] { filter: url(#pp-deutan); }
html[data-vision="tritan"] { filter: url(#pp-tritan); }
html[data-vision="achroma"] { filter: url(#pp-achroma); }
#pp-bar { position: fixed; left: 50%; bottom: 14px; transform: translateX(-50%); z-index: 2147483000;
  display: flex; gap: 10px; align-items: center; padding: 8px 12px; border-radius: 999px;
  background: #fff; color: #000; box-shadow: 0 2px 14px rgba(0,0,0,.35), 0 0 0 2px #ff00aa;
  font: 12px/1.2 ui-monospace, Menlo, monospace; white-space: nowrap; user-select: none; }
#pp-bar button, #pp-bar select { font: inherit; border: 1px solid #999; background: #f4f4f4; color: #000; border-radius: 999px; padding: 3px 9px; cursor: pointer; }
#pp-bar .pp-label { min-width: 15em; text-align: center; }
#pp-bar .pp-sw { display: inline-flex; gap: 2px; }
#pp-bar .pp-sw i { width: 12px; height: 12px; border: 1px solid #0003; display: inline-block; }
#pp-bar .pp-tag { font-weight: 700; color: #ff00aa; }
#pp-state { position: fixed; right: 14px; bottom: 64px; z-index: 2147483000; background: #fff; color: #000;
  font: 11px/1.45 ui-monospace, Menlo, monospace; padding: 8px 10px; border-radius: 8px; box-shadow: 0 2px 14px rgba(0,0,0,.35), 0 0 0 2px #ff00aa; max-width: 360px; white-space: pre; }
#pp-state[hidden] { display: none; }
#pp-state b { color: #b00060; }`;
  document.head.appendChild(style);

  const mode = () => (root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  const pal = () => P.find((p) => p.key === cur);
  /* Champaign's clock: the reader's now, or the scrubbed hour of today */
  function when() {
    const now = new Date();
    if (hour === null) return now;
    const chi = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const off = (chi - new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))) / 3.6e6;
    const d = new Date(Date.UTC(chi.getFullYear(), chi.getMonth(), chi.getDate()));
    return new Date(d.getTime() + (hour - off) * 3.6e6);
  }
  const clock = (d) => d.toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit', hour12: false });
  let sun = null;   /* { alt, paper } while Daylight holds the page */
  /* the tokens on the page now */
  const tok = () => (sun ? sun.paper : pal().behaviour === 'wc-still' ? window.ESA_WC_STILL[mode()] : pal()[mode()]);
  const follows = () => pal().behaviour === 'sun' || pal().behaviour === 'wc-sun';

  /* the SVG filters: one per vision kind (Machado 2009, applied in linear light), and the duotone */
  function filters() {
    const mat = (m) => `${m[0].join(' ')} 0 0 ${m[1].join(' ')} 0 0 ${m[2].join(' ')} 0 0 0 0 0 1 0`;
    const lin = (h) => [1, 3, 5].map((i) => { const c = parseInt(h.slice(i, i + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
    const m = tok(), ink = lin(m.ink), bg = lin(m.bg);
    const sr = [1, 3, 5].map((i) => (parseInt(m.bg.slice(i, i + 2), 16) / 255).toFixed(4));   /* multiply by the paper: white takes it */
    const ach = '0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0';
    return `<svg id="pp-svg" width="0" height="0" style="position:absolute" aria-hidden="true">
      ${['protan', 'deutan', 'tritan'].map((k) => `<filter id="pp-${k}" color-interpolation-filters="linearRGB"><feColorMatrix type="matrix" values="${mat(C.M[k])}"/></filter>`).join('')}
      <filter id="pp-achroma" color-interpolation-filters="linearRGB"><feColorMatrix type="matrix" values="${ach}"/></filter>
      <filter id="pp-flush" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${sr[0]} 0 0 0 0 0 ${sr[1]} 0 0 0 0 0 ${sr[2]} 0 0 0 0 0 1 0"/></filter>
      ${m.pig ? washFilters(m) : ''}
      <filter id="pp-duo" color-interpolation-filters="linearRGB">
        <feColorMatrix type="matrix" values="${ach}"/>
        <feComponentTransfer>
          <feFuncR type="table" tableValues="${ink[0]} ${bg[0]}"/><feFuncG type="table" tableValues="${ink[1]} ${bg[1]}"/><feFuncB type="table" tableValues="${ink[2]} ${bg[2]}"/>
        </feComponentTransfer>
      </filter></svg>`;
  }

  /* the wash: Ethan's watercolour with the pen taken out (make-wash.py). tint: its densities in the
     hour's pigment, from the paper (none) to m.dense (deepest); paint: its own colours, lifted to the
     same strength and laid on the paper. The check holds the ink to 4.5:1 on m.dense. */
  function washFilters(m) {
    const ch = (h) => [1, 3, 5].map((i) => (parseInt(h.slice(i, i + 2), 16) / 255).toFixed(4));
    const d = ch(m.dense), b = ch(m.bg), WP = 236 / 255, k = (1 - m.s).toFixed(4);
    return `<filter id="pp-tint" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0"/>
        <feComponentTransfer><feFuncR type="linear" slope="2.08" intercept="-0.94"/><feFuncG type="linear" slope="2.08" intercept="-0.94"/><feFuncB type="linear" slope="2.08" intercept="-0.94"/></feComponentTransfer>
        <feComponentTransfer><feFuncR type="table" tableValues="${d[0]} ${b[0]}"/><feFuncG type="table" tableValues="${d[1]} ${b[1]}"/><feFuncB type="table" tableValues="${d[2]} ${b[2]}"/></feComponentTransfer>
      </filter>
      <filter id="pp-paint" color-interpolation-filters="sRGB">
        <feComponentTransfer><feFuncR type="linear" slope="${m.s.toFixed(4)}" intercept="${k}"/><feFuncG type="linear" slope="${m.s.toFixed(4)}" intercept="${k}"/><feFuncB type="linear" slope="${m.s.toFixed(4)}" intercept="${k}"/></feComponentTransfer>
        <feColorMatrix type="matrix" values="${(b[0] / WP).toFixed(4)} 0 0 0 0 0 ${(b[1] / WP).toFixed(4)} 0 0 0 0 0 ${(b[2] / WP).toFixed(4)} 0 0 0 0 0 1 0"/>
      </filter>`;
  }
  function mountWash() {
    const stage = document.querySelector('.env-stage');
    if (!stage || stage.querySelector('.pp-wash')) return;
    stage.insertAdjacentHTML('afterbegin', '<div class="pp-wash pp-wash-tint" aria-hidden="true"></div><div class="pp-wash pp-wash-paint" aria-hidden="true"></div>');
  }

  /* a line drawing is a drawing with almost no colour in it; photographs and coloured drawings keep theirs */
  function tagLines() {
    for (const img of document.querySelectorAll('.env-plane-img:not(.ix-model):not([data-pp])')) {
      const go = () => {
        try {
          const c = document.createElement('canvas'); c.width = c.height = 96;
          const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, 96, 96);
          /* the share of pixels with real colour in them: over 1%, the image keeps its colour */
          const d = x.getImageData(0, 0, 96, 96).data; let n = 0;
          for (let i = 0; i < d.length; i += 4) { const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]); if (mx > 50 && (mx - mn) / mx > 0.22) n++; }
          const sat = n / (d.length / 4);
          img.dataset.pp = sat.toFixed(3);
          if (sat < 0.01) img.classList.add('pp-line');
        } catch (e) { img.dataset.pp = 'err'; }
        state();
      };
      if (img.complete && img.naturalWidth) go(); else img.addEventListener('load', go, { once: true });
    }
  }

  let bar, label, sw, panel;
  let applying = false;
  function apply(push) {
    if (applying) return; applying = true;
    if (follows()) {
      const d = when(), alt = window.ESA_SUN_ALT(d);
      const rising = window.ESA_SUN_ALT(new Date(d.getTime() + 6e5)) > alt;
      sun = { alt, rising, time: clock(d), paper: pal().behaviour === 'wc-sun' ? window.ESA_WC(alt, rising) : window.ESA_SUN_PAPER(alt) };
      const m = sun.paper;
      const set = { '--color-bg': m.bg, '--color-bg-alt': m.alt, '--color-primary': m.ink, '--color-text': m.ink, '--color-secondary': m.muted,
        '--color-text-light': m.muted, '--color-utility-gray': m.muted, '--color-accent': m.accent, '--color-border': m.border };
      for (const [k, v] of Object.entries(set)) root.style.setProperty(k, v);
      if (root.getAttribute('data-theme') !== m.theme) root.setAttribute('data-theme', m.theme);
    } else {
      sun = null;
      root.removeAttribute('style');
      if (pal().behaviour === 'wc-still') {
        const m = window.ESA_WC_STILL[mode()];
        const set = { '--color-bg': m.bg, '--color-bg-alt': m.alt, '--color-primary': m.ink, '--color-text': m.ink, '--color-secondary': m.muted,
          '--color-text-light': m.muted, '--color-utility-gray': m.muted, '--color-accent': m.accent, '--color-border': m.border };
        for (const [k, v] of Object.entries(set)) root.style.setProperty(k, v);
      }
    }
    const w = tok();
    root.setAttribute('data-wash', w.pig && wash === 'on' ? 'on' : 'off');
    if (w.pig) root.style.setProperty('--pp-painted', w.painted.toFixed(3));
    root.setAttribute('data-grid', grid);
    root.setAttribute('data-palette', cur);
    root.setAttribute('data-vision', vision);
    root.setAttribute('data-drawings', draw);
    if (push) {
      const u = new URLSearchParams(location.search);
      u.set('palette', cur); u.set('vision', vision); u.set('drawings', draw);
      u.delete('grid'); if (wash === 'off') u.set('wash', 'off'); else u.delete('wash');
      if (follows() && hour !== null) u.set('hour', hour); else u.delete('hour');
      history.replaceState(history.state, '', location.pathname + '?' + u + location.hash);
    }
    const old = document.getElementById('pp-svg'); if (old) old.remove();
    if (document.body) document.body.insertAdjacentHTML('afterbegin', filters());
    if (window.__esaRepaint) window.__esaRepaint();     /* the sheet's dots and the model stills are painted in page colours */
    if (label) { label.innerHTML = `<span class="pp-tag">${cur.toUpperCase()}</span> ${pal().name} · ${sun ? `${sun.time} · sun ${sun.alt.toFixed(0)}°` : mode()}`; }
    if (bar) {
      bar.querySelector('[data-beh="sun"]').classList.toggle('on', follows());
      bar.querySelector('[data-beh="wash"]').classList.toggle('on', !!tok().pig);
      bar.querySelector('[data-beh="grid"]').classList.toggle('on', pal().behaviour === 'grid');
      bar.querySelector('[data-k="draw"]').disabled = pal().behaviour === 'grid';
    }
    if (sw) { const m = tok(); sw.innerHTML = ['bg', 'ink', 'muted', 'accent'].map((k) => `<i title="${k} ${m[k]}" style="background:${m[k]}"></i>`).join(''); }
    state();
    applying = false;
  }

  /* the full state on every switch: the palette's numbers under every kind of vision */
  function state() {
    if (!panel) return;
    const m = tok();
    const rows = C.audit(m).map((r) => `${r.kind.padEnd(8)} ink ${r.ink.toFixed(1).padStart(4)}  muted ${r.muted.toFixed(1).padStart(4)}  accent ${r.accent.toFixed(1).padStart(4)}  ΔE ${r.sep.toFixed(0).padStart(3)}`);
    const imgs = [...document.querySelectorAll('.env-plane-img:not(.ix-model)')];
    const lines = imgs.filter((i) => i.classList.contains('pp-line')).length;
    panel.innerHTML = `<b>${cur.toUpperCase()} ${pal().name} — ${mode()} paper</b>\n${pal().note.replace(/(.{1,52})(\s|$)/g, '$1\n')}` +
      `bg ${m.bg}  ink ${m.ink}  muted ${m.muted}\naccent ${m.accent}  border ${m.border}\n\n` +
      `contrast with the paper (want ink 7, muted 4.5, accent 3)\nΔE accent from ink (want 20)\n${rows.join('\n')}\n\n` +
      (sun ? `Champaign ${sun.time}${hour === null ? ' (now)' : ' (scrubbed)'}  sun ${sun.alt.toFixed(1)}° ${sun.rising ? 'rising' : 'setting'}  → ${m.theme} paper\n` : '') +
      (m.pig ? `wash ${wash}: pigment ${m.pig}  deepest ${m.dense}  painted ${(m.painted * 100).toFixed(0)}%\n  ink on the deepest wash ${C.contrast(m.ink, m.dense).toFixed(1)}:1\n` : '') +
      (pal().behaviour === 'grid' ? `grid (simulated): ${grid}\n` : '') +
      `vision preview: ${vision}   drawings: ${pal().behaviour === 'grid' ? 'set by the grid' : draw}\nline drawings found: ${lines} of ${imgs.length} plates\n(placeholder colours: R6, the Palette is Ethan's own)`;
  }

  const step = (d) => { cur = keys[(keys.indexOf(cur) + d + keys.length) % keys.length]; apply(true); };

  root.setAttribute('data-palette', cur);
  root.setAttribute('data-vision', vision);
  root.setAttribute('data-drawings', draw);

  document.addEventListener('DOMContentLoaded', () => {
    bar = document.createElement('div'); bar.id = 'pp-bar';
    bar.innerHTML = `<span class="pp-tag">PROTOTYPE</span><button data-d="-1" aria-label="Previous palette">←</button><span class="pp-label"></span><button data-d="1" aria-label="Next palette">→</button><span class="pp-sw"></span>
      <select data-k="vision" aria-label="Vision preview">${C.KINDS.map((k) => `<option${k === vision ? ' selected' : ''}>${k}</option>`).join('')}</select>
      <select data-k="draw" aria-label="Drawings on the paper">${['shot', 'flush'].map((k) => `<option${k === draw ? ' selected' : ''}>${k}</option>`).join('')}</select>
      <span class="pp-beh" data-beh="sun">sun <input type="range" min="0" max="24" step="0.25" aria-label="Hour in Champaign" value="${hour === null ? 12 : hour}"><button data-k="now">now</button></span>
      <span class="pp-beh" data-beh="wash">wash <select data-k="wash" aria-label="Watercolour wash">${['on', 'off'].map((k) => `<option${k === wash ? ' selected' : ''}>${k}</option>`).join('')}</select></span>
      <span class="pp-beh" data-beh="grid">grid <select data-k="grid" aria-label="Grid intensity (simulated)">${['low', 'moderate', 'high'].map((k) => `<option${k === grid ? ' selected' : ''}>${k}</option>`).join('')}</select></span>
      <button data-k="state">numbers</button>`;
    document.body.appendChild(bar);
    panel = document.createElement('div'); panel.id = 'pp-state'; panel.hidden = !q.has('numbers'); document.body.appendChild(panel);
    label = bar.querySelector('.pp-label'); sw = bar.querySelector('.pp-sw');
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.d) step(+b.dataset.d);
      if (b.dataset.k === 'state') { panel.hidden = !panel.hidden; state(); }
      if (b.dataset.k === 'now') { hour = null; apply(true); }
    });
    bar.addEventListener('change', (e) => {
      const k = e.target.dataset.k;
      if (k === 'vision') vision = e.target.value; else if (k === 'grid') grid = e.target.value; else if (k === 'wash') wash = e.target.value; else if (k === 'draw') draw = e.target.value; else return;
      apply(true);
    });
    bar.addEventListener('input', (e) => { if (e.target.type === 'range') { hour = +e.target.value; apply(true); } });
    setInterval(() => { if (follows() && hour === null) apply(false); }, 60000);
    document.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea, select, [contenteditable]')) return;
      if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1);
    });
    /* the nav's light/dark cell turns the paper: follow it */
    new MutationObserver(() => apply(false)).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    new MutationObserver(tagLines).observe(document.body, { childList: true, subtree: true });
    mountWash(); apply(false); tagLines();
  });
})();
