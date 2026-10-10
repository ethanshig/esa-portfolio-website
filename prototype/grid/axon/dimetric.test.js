/* bun test prototype/grid/axon/dimetric.test.js */
import { expect, test } from 'bun:test';
import * as D from './dimetric.js';

test('final pose: plan axes project at slope 1/2, exactly (2,1) and (-2,1) steps', () => {
  const B = D.cameraBasis(D.ELEVATION, D.AZIMUTH);
  const s = D.UNIT_PX_PER_STEP;               /* p = 1 */
  const x = D.projectPx([1, 0, 0], B, s), z = D.projectPx([0, 0, 1], B, s), y = D.projectPx([0, 1, 0], B, s);
  expect(x[1] / x[0]).toBeCloseTo(0.5, 10);
  expect(Math.abs(z[1] / z[0])).toBeCloseTo(0.5, 10);
  expect(x[0]).toBeCloseTo(2, 10); expect(x[1]).toBeCloseTo(1, 10);
  expect(z[0]).toBeCloseTo(-2, 10); expect(z[1]).toBeCloseTo(1, 10);
  expect(y[0]).toBeCloseTo(0, 10); expect(-y[1]).toBeCloseTo(Math.sqrt(6), 10);
  expect(D.projectSteps(1, 0, 0)).toEqual([2, 1]);
});

test('plan pose: screen right = +X, screen down = +Z', () => {
  const B = D.cameraBasis(Math.PI / 2, 0);
  const x = D.projectPx([1, 0, 0], B, 1), z = D.projectPx([0, 0, 1], B, 1);
  expect(x[0]).toBeCloseTo(1, 10); expect(x[1]).toBeCloseTo(0, 10);
  expect(z[0]).toBeCloseTo(0, 10); expect(z[1]).toBeCloseTo(1, 10);
});

test('basis is orthonormal through the whole swing', () => {
  for (let u = 0; u <= 1; u += 0.125) {
    const B = D.cameraBasis(Math.PI / 2 + (D.ELEVATION - Math.PI / 2) * u, D.AZIMUTH * u);
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    expect(dot(B.right, B.up)).toBeCloseTo(0, 12);
    expect(dot(B.right, B.back)).toBeCloseTo(0, 12);
    expect(dot(B.up, B.back)).toBeCloseTo(0, 12);
    for (const v of [B.right, B.up, B.back]) expect(dot(v, v)).toBeCloseTo(1, 12);
  }
});

test('bold rule matches the notebook: 1 in 4, lattice spanned by (2,1) and (2,-1)', () => {
  let n = 0;
  for (let c = -40; c < 40; c++) for (let r = -40; r < 40; r++) if (D.isBold(c, r)) {
    n++;
    expect(D.isBold(c + 2, r + 1)).toBe(true);
    expect(D.isBold(c + 2, r - 1)).toBe(true);
    expect(D.isBold(c, r + 2)).toBe(true);
    expect(D.isBold(c + 1, r)).toBe(false);
  }
  expect(n).toBe(80 * 80 / 4);
  expect(D.isBold(0, 0)).toBe(true);
  expect(D.isBold(0.5, 0)).toBe(false);
});

test('nearestBold returns a bold node within one step diagonal', () => {
  for (const [c, r] of [[0.3, 0.2], [1, 1], [-3.4, 7.9], [5, 0]]) {
    const b = D.nearestBold(c, r);
    expect(D.isBold(b[0], b[1])).toBe(true);
    expect(Math.hypot(b[0] - c, b[1] - r)).toBeLessThanOrEqual(Math.SQRT2 + 1e-9);
  }
});

test('fitScale keeps the projected box inside the cell and snaps the long side', () => {
  const p = 20, w = 16 * p, h = 16 * p;     /* a 4L card */
  for (const [sx, sy, sz] of [[4, 2.4, 3], [10, 1, 10], [1, 8, 1], [0.3, 0.1, 0.2], [5, 0, 5]]) {
    const k = D.fitScale(sx, sy, sz, w, h, p);
    const a = k * sx, b = k * sz, hh = k * sy;
    expect(2 * (a + b)).toBeLessThanOrEqual(w / p - 2 + 1e-9);
    expect(a + b + Math.sqrt(6) * hh).toBeLessThanOrEqual(h / p - 2 + 1e-9);
    const long = Math.max(a, b);
    if (long >= 2) expect(Math.abs(long - Math.round(long))).toBeLessThan(1e-9);
  }
});
