/* ===================================================================
   DAYLIGHT — the paper follows the sun over Champaign (prototype/palette,
   rev 5, approved by Ethan 2026-11-16; issue: "Daylight palette").

   By day the page is Prussian blue ink on buff paper, the buff warming
   toward amber as the sun drops. After sunset it turns over to a
   cyanotype: cream on Prussian blue, deepening as the sky darkens. Every
   colour runs at 45% saturation, day and night (Ethan: "I like the 45%
   durring the day time", "lets roll with night at 45 too").

   The images on the sheet are printed in the paper's two colours until
   one is hovered (css/index-sheet.css, js/index-sheet/reveal.js). By day
   their darks take the ink and their lights the paper; by night they stay
   positive (dark Prussian, lamp-dimmed cream), never negatives.

   A classic script, loaded in <head> after the stylesheets so the paper is
   right before first paint; js/theme.js and the index sheet use it through
   window.ESA_DAYLIGHT. The reader's light/dark switch pins a paper for the
   session (sessionStorage esa-theme-pin); ?theme= pins it for one load.
   Without JavaScript the page keeps css/theme.css's black and white.
   =================================================================== */
(function (g) {
  const LAT = 40.1164, LON = -88.2434;        /* Champaign, where the work is made */
  const SATURATION = 0.45;
  const PIN = 'esa-theme-pin';
  const R = Math.PI / 180;

  /* ---------- the sun (NOAA low-precision position, good to a fraction of a degree) ---------- */
  function sunAltitude(date) {
    const d = date.getTime() / 86400000 + 2440587.5 - 2451545.0;
    const gA = (357.529 + 0.98560028 * d) * R, q = 280.459 + 0.98564736 * d;
    const L = (q + 1.915 * Math.sin(gA) + 0.020 * Math.sin(2 * gA)) * R, e = (23.439 - 0.00000036 * d) * R;
    const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)), dec = Math.asin(Math.sin(e) * Math.sin(L));
    const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
    const ha = (gmst * 15 + LON) * R - ra;
    return Math.asin(Math.sin(LAT * R) * Math.sin(dec) + Math.cos(LAT * R) * Math.cos(dec) * Math.cos(ha)) / R;
  }

  /* ---------- colour ---------- */
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const gam = (c) => { c = Math.min(1, Math.max(0, c)); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const hex = (c) => '#' + c.map((v) => Math.round(gam(v) * 255).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const WHITE = [0.95047, 1, 1.08883];
  /* chroma scaled in CIELAB: lightness, and with it contrast, barely moves */
  function saturate(h, k) {
    const [r, gg, b] = rgb(h).map(lin);
    const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    const [X, Y, Z] = [0.4124 * r + 0.3576 * gg + 0.1805 * b, 0.2126 * r + 0.7152 * gg + 0.0722 * b, 0.0193 * r + 0.1192 * gg + 0.9505 * b].map((v, i) => f(v / WHITE[i]));
    const Lab = [116 * Y - 16, 500 * (X - Y) * k, 200 * (Y - Z) * k];
    const fy = (Lab[0] + 16) / 116, fx = Lab[1] / 500 + fy, fz = fy - Lab[2] / 200;
    const fi = (t) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);
    const [x, y, z] = [fi(fx) * WHITE[0], fi(fy) * WHITE[1], fi(fz) * WHITE[2]];
    return hex([3.2406 * x - 1.5372 * y - 0.4986 * z, -0.9689 * x + 1.8758 * y + 0.0415 * z, 0.0557 * x - 0.204 * y + 1.057 * z]);
  }

  /* ---------- the paper at a sun altitude (degrees), before saturation ---------- */
  function rawPaper(alt) {
    if (alt >= -1) {
      const t = clamp(alt / 50);
      const bg = mix('#ddb987', '#f3ead4', t);
      return { theme: 'light', bg, alt: mix(bg, '#c9a46e', 0.18), ink: '#172650', muted: mix('#44465a', '#4c566c', t),
        accent: '#a2461a', border: mix(bg, '#a88a5a', 0.3), imageDark: '#172650', imageLight: bg };
    }
    const t = clamp((-alt - 1) / 17);
    const bg = mix('#1f4277', '#0c2142', t);
    return { theme: 'dark', bg, alt: mix(bg, '#ffffff', 0.04), ink: '#f1e6cf', muted: '#b9c3d3',
      accent: '#e0a040', border: mix(bg, '#ffffff', 0.1), imageDark: '#0b1d3d', imageLight: '#d9ceb6' };
  }
  function paper(alt, k = SATURATION) {
    const p = rawPaper(alt), out = { theme: p.theme };
    for (const key of Object.keys(p)) if (key !== 'theme') out[key] = saturate(p[key], k);
    return out;
  }
  /* a pinned paper: the reader chose light or dark, so they get the sun's noon or its deep night */
  const PINNED = { light: 50, dark: -18 };

  /* ---------- applying it ---------- */
  const root = document.documentElement;
  function pinned() {
    let t = null;
    try { t = new URLSearchParams(location.search).get('theme'); if (t !== 'light' && t !== 'dark') t = sessionStorage.getItem(PIN); } catch (e) { /* no storage: follow the sun */ }
    return t === 'light' || t === 'dark' ? t : null;
  }
  let last = null;
  function apply(date = new Date()) {
    const pin = pinned();
    const alt = sunAltitude(date);
    const p = paper(pin ? PINNED[pin] : alt);
    const set = { '--color-bg': p.bg, '--color-bg-alt': p.alt, '--color-primary': p.ink, '--color-text': p.ink,
      '--color-secondary': p.muted, '--color-text-light': p.muted, '--color-utility-gray': p.muted,
      '--color-accent': p.accent, '--color-border': p.border };
    for (const [k, v] of Object.entries(set)) root.style.setProperty(k, v);
    if (root.getAttribute('data-theme') !== p.theme) root.setAttribute('data-theme', p.theme);
    setImageInk(p);
    const state = { alt, pin, paper: p };
    /* tell the page only when the paper has visibly moved, so canvases repaint about once a quarter hour */
    const moved = !last || last.paper.theme !== p.theme || distance(last.paper.bg, p.bg) > 2;
    if (moved) { last = state; g.dispatchEvent(new CustomEvent('esa-daylight', { detail: state })); }
    return state;
  }
  function distance(a, b) { const x = rgb(a), y = rgb(b); return Math.hypot(...x.map((v, i) => (v - y[i]) * 255)); }

  /* the images' two colours: an SVG duotone (#esa-duo), and the same with a mix back to the image's own
     colour (#esa-reveal, its mix driven by js/index-sheet/reveal.js) */
  const NS = 'http://www.w3.org/2000/svg';
  function setImageInk(p) {
    if (!document.body) return;
    let svg = document.getElementById('esa-filters');
    if (!svg) {
      svg = document.createElementNS(NS, 'svg');
      svg.id = 'esa-filters';
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
      svg.style.position = 'absolute';
      const grey = '0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0';
      const duo = (id, tail) => `<filter id="${id}" color-interpolation-filters="linearRGB"><feColorMatrix in="SourceGraphic" type="matrix" values="${grey}" result="grey"/><feComponentTransfer in="grey" result="duo"><feFuncR class="esa-ink-r" type="table"/><feFuncG class="esa-ink-g" type="table"/><feFuncB class="esa-ink-b" type="table"/></feComponentTransfer>${tail}</filter>`;
      svg.innerHTML = duo('esa-duo', '') +
        duo('esa-reveal', '<feComposite id="esa-reveal-mix" in="duo" in2="SourceGraphic" operator="arithmetic" k1="0" k2="1" k3="0" k4="0"/>');
      document.body.prepend(svg);
    }
    const lo = rgb(p.imageDark).map(lin), hi = rgb(p.imageLight).map(lin);
    ['r', 'g', 'b'].forEach((c, i) => svg.querySelectorAll(`.esa-ink-${c}`).forEach((fn) => fn.setAttribute('tableValues', `${lo[i].toFixed(4)} ${hi[i].toFixed(4)}`)));
  }

  function pin(theme) {
    try {
      if (theme) sessionStorage.setItem(PIN, theme); else sessionStorage.removeItem(PIN);
      const q = new URLSearchParams(location.search);
      if (q.has('theme')) { q.delete('theme'); history.replaceState(history.state, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash); }
    } catch (e) { /* private window: the pin lasts this page only */ }
    last = null;
    return apply();
  }

  /* the paper on the page now (a canvas reads its image colours from it) */
  const current = () => (last ? last.paper : apply().paper);
  g.ESA_DAYLIGHT = { sunAltitude, paper, saturate, apply, pin, pinned, current, SATURATION };

  /* before first paint, then once the body exists (for the filters), then every minute */
  apply();
  document.addEventListener('DOMContentLoaded', () => apply());
  setInterval(() => apply(), 60000);
})(window);
