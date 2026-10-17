/* PROTOTYPE (prototype/grid/project): the paper's dots as a quiet star field.
   ?palette= picks the accent (set in CSS on html[data-palette], see proto.css) and the star colours;
   ?twinkle= how much the stars breathe. prefers-reduced-motion forces twinkle off.

   Every dot keeps one colour and one rhythm for life: both come from a hash of its paper node
   (u, v), so a pan or zoom never reshuffles the sky, and a lifted lattice point keeps the colour
   of the dot it collapses onto. Colours are mixed toward the ink by `mix`, so a star reads as a
   tint of white, never a saturated pip. */

const SETS = {
  /* reference: today's monochrome dots and the terracotta accent */
  copper: { stars: [], mix: 0, share: 0 },
  /* the whole galaxy: violet, blue, rose, pale gold, a rare ember */
  nebula: {
    stars: [['#a78bfa', 3], ['#7aa2ff', 3], ['#f08bb4', 2], ['#f3d98b', 2], ['#ff8a70', 1]],
    mix: 0.45, share: 0.55,
  },
  /* cold: blues and violets, the odd pink */
  deep: {
    stars: [['#7aa2ff', 4], ['#9b8cff', 3], ['#6fd0ff', 2], ['#e58bd0', 1]],
    mix: 0.4, share: 0.6,
  },
  /* mostly white light, one star in eight faintly coloured */
  starlight: {
    stars: [['#f3d98b', 2], ['#a9c1ff', 2], ['#f4a3c4', 1], ['#c3a8ff', 1]],
    mix: 0.35, share: 0.13,
  },
};
export const PALETTES = Object.keys(SETS);
const TWINKLE = { off: 0, soft: 0.45, more: 0.85 };

/* the share of dots that twinkle at all; the rest hold still */
const TWINKLERS = 0.22;

function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mixRgb(a, b, t) { return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }

/* four independent [0, 1) numbers per node */
export function hash4(u, v) {
  let h = Math.imul(u | 0, 0x27d4eb2d) ^ Math.imul(v | 0, 0x165667b1);
  const out = [];
  for (let i = 0; i < 4; i++) {
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
    h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
    h ^= h >>> 15;
    out.push((h >>> 0) / 4294967296);
  }
  return out;
}

export function starField(ink) {
  const q = new URLSearchParams(location.search);
  const key = document.documentElement.dataset.palette in SETS ? document.documentElement.dataset.palette : 'nebula';
  const set = SETS[key];
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tw = q.get('twinkle') in TWINKLE ? q.get('twinkle') : 'soft';
  const amp = reduce ? 0 : TWINKLE[tw];

  const inkRgb = hexRgb(/^#[0-9a-f]{6}$/i.test(ink) ? ink : '#e9ecee');
  /* index 0 is the ink itself; 1.. are the tinted stars */
  const colors = [inkRgb].concat(set.stars.map(([c]) => mixRgb(hexRgb(c), inkRgb, set.mix)));
  const weights = set.stars.map(([, w]) => w);
  const total = weights.reduce((a, b) => a + b, 0);
  const css = colors.map((c) => `rgb(${c.join(',')})`);

  function colorIndex(h) {
    if (h >= set.share || !total) return 0;
    let x = (h / set.share) * total;
    for (let i = 0; i < weights.length; i++) { x -= weights[i]; if (x < 0) return i + 1; }
    return weights.length;
  }

  return {
    key, twinkle: amp > 0 ? tw : 'off', amp,
    css, rgb: colors,
    /* colour index, and the brightness multiplier at time t (seconds) */
    star(u, v, t) {
      const [h0, h1, h2, h3] = hash4(u, v);
      const ci = colorIndex(h0);
      if (!amp || h1 >= TWINKLERS) return [ci, 1];
      const period = 4 + 7 * h3;                         /* 4..11 s: slow breathing, never a blink */
      const s = 0.5 + 0.5 * Math.sin((t / period + h2) * Math.PI * 2);
      return [ci, 1 - amp * 0.5 + amp * s * s * s];      /* dips a little, glints briefly */
    },
    seed(u, v) { const [h0, h1, h2, h3] = hash4(u, v); return { ci: colorIndex(h0), tw: h1 < TWINKLERS ? 1 : 0, phase: h2, period: 4 + 7 * h3 }; },
  };
}
