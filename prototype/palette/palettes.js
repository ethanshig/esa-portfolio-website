/* PROTOTYPE (prototype/palette): site palettes, rev 2. Ethan, 2026-11-15: a version of family 1
   (sun prints) and family 2 (blue on warm ground), leaning 2; "Behaviour is much more powerful."
   Colours start from the precedent board (~/cs199/palette-precedents): grounds from Hokusai's Lake
   Suwa (#e6d2b1) and the Delft tile (#cdbe9a), ink from the Delft and Willow blues (#363c53, #32364f),
   deepened until the ink reads at 7:1. All placeholders: R6, the Palette is Ethan's own. */
(function (g) {
  const WARM = {   /* family 2, the shared day paper (rev 2) */
    light: { bg: '#ead8b6', alt: '#e1cca5', ink: '#1f3160', muted: '#4c566c', accent: '#b4521f', border: '#d6c29c' },
    dark:  { bg: '#1c2445', alt: '#232c52', ink: '#efe2c6', muted: '#b3b2bd', accent: '#d38c26', border: '#2e3862' },
  };
  const mix = (a, b, t) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
  const clamp = (x) => Math.max(0, Math.min(1, x));
  g.ESA_PALETTES = [
    { key: 'a', name: 'Good tools', note: 'Today: black and white. The baseline.',
      light: { bg: '#ffffff', alt: '#ffffff', ink: '#111111', muted: '#5f6468', accent: '#6b52d6', border: '#e2e2e2' },
      dark:  { bg: '#0d0f11', alt: '#14171a', ink: '#e9ecee', muted: '#8a9196', accent: '#c47a5c', border: '#23272a' } },
    { key: 'b', name: 'Watercolour, as painted', behaviour: 'wc-still',
      note: 'Ethan\'s watercolour of 2026-11-15 (IMG_7650), pen taken out, laid under the sheet as the paper. Its own colours, at noon light. Pen ink #24211f measured from the painting. The plates sit on top exactly as made.' },
    { key: 'c', name: 'Watercolour through the day', behaviour: 'wc-sun',
      note: 'The same washes; the light over Champaign changes the pigment. Morning sage, midday as painted, afternoon olive, golden hour sepia, dusk mauve; after dark the paper turns over to Payne\'s grey and the washes glow slate. The plates never change.' },
    { key: 'd', name: 'Daylight, blue (rev 2)', behaviour: 'sun',
      note: 'Rev 2 for comparison: family 2 by day, a cyanotype at night. No wash.' },
  ];

  /* ---- the watercolour's light. Pigments measured from IMG_7650 by hue band, deepened to read as
     paint (the photo greys them): mauve #a79ca1, sepia #b5aca5, olive #aba79b, sage #a8b3ac. ---- */
  const PIG = { sage: '#7f9688', olive: '#8c8655', sepia: '#977f66', mauve: '#8a7385', slate: '#5f6680' };
  /* keyframes on the sun's altitude, one list for the rising sun and one for the setting sun.
     painted: how much of the painting's own colour shows (1 at midday); s: wash strength */
  const RISE = [
    { alt: -6, theme: 'dark', bg: '#25242c', pig: '#4a4f66', painted: 0, s: 0.75 },
    { alt: -1, theme: 'dark', bg: '#2e2c38', pig: '#5a5470', painted: 0, s: 0.75 },
    { alt: -0.99, theme: 'light', bg: '#eae9ea', pig: PIG.mauve, painted: 0, s: 0.42 },
    { alt: 6, theme: 'light', bg: '#eceeea', pig: PIG.sage, painted: 0, s: 0.45 },
    { alt: 18, theme: 'light', bg: '#eeeee8', pig: PIG.sage, painted: 0.5, s: 0.42 },
    { alt: 28, theme: 'light', bg: '#efece5', pig: PIG.sage, painted: 1, s: 0.4 },
  ];
  const SET = [
    { alt: 28, theme: 'light', bg: '#efece5', pig: PIG.olive, painted: 1, s: 0.4 },
    { alt: 18, theme: 'light', bg: '#efebe1', pig: PIG.olive, painted: 0.4, s: 0.45 },
    { alt: 8, theme: 'light', bg: '#f0e7d6', pig: PIG.sepia, painted: 0, s: 0.48 },
    { alt: 2, theme: 'light', bg: '#eee3da', pig: PIG.mauve, painted: 0, s: 0.48 },
    { alt: -0.99, theme: 'light', bg: '#e9e2e0', pig: PIG.mauve, painted: 0, s: 0.45 },
    { alt: -1, theme: 'dark', bg: '#2e2c38', pig: '#5a5470', painted: 0, s: 0.75 },
    { alt: -6, theme: 'dark', bg: '#25242c', pig: '#4a4f66', painted: 0, s: 0.75 },
  ];
  const INK = { light: '#24211f', dark: '#ece8df' };
  g.ESA_WC = function (alt, rising) {
    const K = rising ? RISE : SET;
    const lo = K.reduce((a, k) => (rising ? (k.alt <= alt ? k : a) : (k.alt >= alt ? k : a)), K[0]);
    const i = K.indexOf(lo), hi = K[Math.min(K.length - 1, i + 1)];
    const t = lo === hi || (rising ? alt <= lo.alt : alt >= lo.alt) && lo.alt === alt ? 0 : clamp((alt - lo.alt) / (hi.alt - lo.alt));
    const f = (k) => (lo.theme !== hi.theme ? lo[k] : (typeof lo[k] === 'number' ? lo[k] + (hi[k] - lo[k]) * t : mix(lo[k], hi[k], t)));
    const theme = lo.theme, bg = f('bg'), pig = f('pig'), s = f('s'), painted = theme === 'dark' ? 0 : f('painted');
    const dark = theme === 'dark';
    return { theme, bg, alt: mix(bg, dark ? '#ffffff' : '#000000', 0.04), ink: INK[theme],
      muted: dark ? '#b6b2b8' : '#55504b', accent: dark ? '#c99bb8' : '#8a4f78', border: mix(bg, dark ? '#ffffff' : '#000000', 0.12),
      pig, s, painted, dense: mix(bg, pig, s) };   /* dense: the wash at its deepest, which text may cross */
  };
  g.ESA_WC_STILL = { light: g.ESA_WC(40, false), dark: g.ESA_WC(-10, false) };

  /* ---- the sun over Champaign (NOAA low-precision solar position, good to a fraction of a degree) ---- */
  const LAT = 40.1164, LON = -88.2434, R = Math.PI / 180;
  g.ESA_SUN_ALT = function (date) {
    const d = date.getTime() / 86400000 + 2440587.5 - 2451545.0;
    const gA = (357.529 + 0.98560028 * d) * R, q = 280.459 + 0.98564736 * d;
    const L = (q + 1.915 * Math.sin(gA) + 0.020 * Math.sin(2 * gA)) * R, e = (23.439 - 0.00000036 * d) * R;
    const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)), dec = Math.asin(Math.sin(e) * Math.sin(L));
    const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
    const ha = (gmst * 15 + LON) * R - ra;
    return Math.asin(Math.sin(LAT * R) * Math.sin(dec) + Math.cos(LAT * R) * Math.cos(dec) * Math.cos(ha)) / R;
  };
  /* altitude in degrees → a paper. Day: low sun amber, high sun pale. Night: deeper as the sky darkens. */
  g.ESA_SUN_PAPER = function (alt) {
    if (alt >= -1) {
      const t = clamp(alt / 50);
      const bg = mix('#ddb987', '#f3ead4', t);
      return { theme: 'light', bg, alt: mix(bg, '#c9a46e', 0.18), ink: '#172650', muted: mix('#44465a', '#4c566c', t), accent: '#a2461a', border: mix(bg, '#a88a5a', 0.3) };
    }
    const t = clamp((-alt - 1) / 17);
    const bg = mix('#1f4277', '#0c2142', t);
    return { theme: 'dark', bg, alt: mix(bg, '#ffffff', 0.04), ink: '#f1e6cf', muted: '#b9c3d3', accent: '#e0a040', border: mix(bg, '#ffffff', 0.1) };
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* ---- rev 4: the saturation dial. Chroma scaled in CIELAB (k = 0 grey, 1 as drawn, up to 1.5), so
   lightness, and with it contrast, barely moves. Out-of-gamut results are clipped to sRGB. ---- */
(function (g) {
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const gam = (c) => { c = Math.min(1, Math.max(0, c)); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
  const W = [0.95047, 1, 1.08883];
  function toLab(h) {
    const [r, gg, b] = [1, 3, 5].map((i) => lin(parseInt(h.slice(i, i + 2), 16) / 255));
    const xyz = [0.4124 * r + 0.3576 * gg + 0.1805 * b, 0.2126 * r + 0.7152 * gg + 0.0722 * b, 0.0193 * r + 0.1192 * gg + 0.9505 * b];
    const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    const [X, Y, Z] = xyz.map((v, i) => f(v / W[i]));
    return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
  }
  function toHex([L, a, b]) {
    const Y = (L + 16) / 116, X = a / 500 + Y, Z = Y - b / 200;
    const fi = (t) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);
    const [x, y, z] = [fi(X) * W[0], fi(Y) * W[1], fi(Z) * W[2]];
    const rgb = [3.2406 * x - 1.5372 * y - 0.4986 * z, -0.9689 * x + 1.8758 * y + 0.0415 * z, 0.0557 * x - 0.204 * y + 1.057 * z];
    return '#' + rgb.map((c) => Math.round(gam(c) * 255).toString(16).padStart(2, '0')).join('');
  }
  g.ESA_SAT = function (m, k) {
    if (k === 1) return m;
    const out = { ...m };
    for (const [key, v] of Object.entries(m)) if (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) {
      const [L, a, b] = toLab(v); out[key] = toHex([L, a * k, b * k]);
    }
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
