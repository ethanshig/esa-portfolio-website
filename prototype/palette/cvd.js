/* PROTOTYPE (prototype/palette): colour maths shared by the switcher and check.ts.
   WCAG contrast, and colour-vision-deficiency simulation (Machado, Oliveira & Fernandes 2009,
   severity 1.0 for protan/deutan/tritan; luminance-only for achromatopsia). */
(function (g) {
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const gam = (c) => { c = Math.min(1, Math.max(0, c)); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
  const lum = (rgb) => { const [r, g2, b] = rgb.map(lin); return 0.2126 * r + 0.7152 * g2 + 0.0722 * b; };
  const contrast = (a, b) => { const [x, y] = [lum(hex(a)), lum(hex(b))].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const M = {
    protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
    deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
    tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
  };
  const toHex = (rgb) => '#' + rgb.map((c) => Math.round(gam(c) * 255).toString(16).padStart(2, '0')).join('');
  function simulate(h, kind) {
    const l = hex(h).map(lin);
    if (kind === 'achroma') { const y = lum(hex(h)); return toHex([y, y, y]); }
    if (!M[kind]) return h;
    return toHex(M[kind].map((row) => row[0] * l[0] + row[1] * l[1] + row[2] * l[2]));
  }
  /* CIELAB distance (CIE76): ~10 is noticeable at a glance, 20+ is clearly different */
  function lab(h) {
    const [r, g2, b] = hex(h).map(lin);
    const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    const X = f((0.4124 * r + 0.3576 * g2 + 0.1805 * b) / 0.95047), Y = f(0.2126 * r + 0.7152 * g2 + 0.0722 * b), Z = f((0.0193 * r + 0.1192 * g2 + 0.9505 * b) / 1.08883);
    return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
  }
  const dE = (a, b) => { const p = lab(a), q = lab(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
  const KINDS = ['normal', 'protan', 'deutan', 'tritan', 'achroma'];
  /* every check a mode must pass, under every kind of vision */
  function audit(m) {
    const rows = [];
    for (const k of KINDS) {
      const s = (h) => simulate(h, k);
      rows.push({ kind: k,
        ink: contrast(s(m.ink), s(m.bg)),        /* body text and line: want 7 (AAA) */
        muted: contrast(s(m.muted), s(m.bg)),    /* captions: want 4.5 (AA) */
        accent: contrast(s(m.accent), s(m.bg)),  /* applied colour as a graphic: want 3 */
        sep: dE(s(m.accent), s(m.ink)),          /* accent told from ink: want 20 */
      });
    }
    return rows;
  }
  g.ESA_CVD = { contrast, simulate, dE, audit, KINDS, M };
})(typeof window !== 'undefined' ? window : globalThis);
