// bun test js/daylight.test.js — the sun over Champaign, and the paper it gives, readable by every reader
import { test, expect, beforeAll } from 'bun:test';

let D;
beforeAll(async () => {
  /* the least of a page that js/daylight.js needs to load */
  const props = {}, attrs = {};
  globalThis.window = globalThis;
  globalThis.document = {
    documentElement: { style: { setProperty: (k, v) => { props[k] = v; } }, getAttribute: (k) => attrs[k] ?? null, setAttribute: (k, v) => { attrs[k] = v; } },
    body: null, addEventListener: () => {}, getElementById: () => null,
  };
  globalThis.location = { search: '', pathname: '/', hash: '' };
  globalThis.sessionStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  globalThis.dispatchEvent = () => {};
  globalThis.setInterval = () => 0;
  await import('./daylight.js');
  D = globalThis.ESA_DAYLIGHT;
});

/* WCAG contrast, and colour-vision deficiency (Machado, Oliveira & Fernandes 2009, severity 1) */
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const rgbLin = (h) => [1, 3, 5].map((i) => lin(parseInt(h.slice(i, i + 2), 16) / 255));
const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const M = {
  normal: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
const seen = (h, k) => { const c = rgbLin(h); return M[k].map((row) => Math.min(1, Math.max(0, row[0] * c[0] + row[1] * c[1] + row[2] * c[2]))); };
const contrast = (a, b, k) => { const [x, y] = [lum(seen(a, k)), lum(seen(b, k))].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

test('the sun over Champaign stands where it should', () => {
  /* solar noon in Champaign is about 18:00 UTC; at noon the sun is 90 - 40.1 + its declination */
  expect(D.sunAltitude(new Date('2026-11-15T18:00:00Z'))).toBeCloseTo(31, 0);     /* declination -18.6 */
  expect(D.sunAltitude(new Date('2026-06-21T18:05:00Z'))).toBeCloseTo(73.3, 0);   /* +23.4 */
  expect(D.sunAltitude(new Date('2026-11-16T06:00:00Z'))).toBeLessThan(-40);       /* local midnight */
  /* sunset on 15 Nov is about 16:35 CST (22:35 UTC) */
  expect(D.sunAltitude(new Date('2026-11-15T22:20:00Z'))).toBeGreaterThan(0);
  expect(D.sunAltitude(new Date('2026-11-15T22:50:00Z'))).toBeLessThan(0);
});

test('the paper turns at sunset: buff and ink by day, a cyanotype at night', () => {
  expect(D.paper(10).theme).toBe('light');
  expect(D.paper(-1).theme).toBe('light');
  expect(D.paper(-1.5).theme).toBe('dark');
});

test('every paper, at every sun altitude, reads for every kind of colour vision at 45%', () => {
  expect(D.SATURATION).toBe(0.45);
  const short = [];
  for (let alt = -25; alt <= 75; alt += 0.5) {
    const p = D.paper(alt);
    for (const k of Object.keys(M)) {
      const want = [['ink', 7], ['muted', 4.5], ['accent', 3]];
      for (const [key, min] of want) { const c = contrast(p[key], p.bg, k); if (c < min) short.push(`${alt}° ${k} ${key} ${c.toFixed(2)}`); }
    }
  }
  expect(short).toEqual([]);
});

test('night images stay positive: their darks are darker than their lights', () => {
  for (const alt of [-2, -10, -40]) {
    const p = D.paper(alt);
    expect(lum(rgbLin(p.imageDark))).toBeLessThan(lum(rgbLin(p.imageLight)));
    expect(lum(rgbLin(p.imageDark))).toBeLessThan(lum(rgbLin(p.bg)) + 0.01);
  }
});

test('saturation keeps lightness: 45% moves no paper colour more than a hair in luminance', () => {
  for (const h of ['#ddb987', '#172650', '#1f4277', '#a2461a', '#e0a040']) {
    expect(Math.abs(lum(rgbLin(D.saturate(h, 0.45))) - lum(rgbLin(h)))).toBeLessThan(0.03);
  }
});
