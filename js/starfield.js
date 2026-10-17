/* ===================================================================
   STARFIELD — the AxoNotebook paper as a quiet star field, behind a page.
   (ADR-0007; the settled sheet recipe, on pages without a 3D sheet.)

   One dot per --L4 step, fixed to the viewport. One dot in four is an axon
   node (the 2:1 dimetric lattice: even(c) && even(c/2 + r)), told from the
   cartesian dots by a small step only: 1.3x the radius, about half again
   the ink. About half the dots carry a faint nebula tint (violet, blue,
   rose, pale gold, a rare ember), mixed halfway to the ink, and about one
   in five breathes on a slow 4-11 s cycle. Colour and rhythm come from a
   hash of the dot's node, so a resize never reshuffles the sky.
   prefers-reduced-motion holds every star still.

   Use: <canvas class="starfield" aria-hidden="true"></canvas> as the first
   child of <body>, then this script. It draws; it adds no text.
   =================================================================== */
(function () {
  'use strict';
  var canvas = document.querySelector('canvas.starfield');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var R_LIGHT = 0.18 / 3.175;            /* the notebook's light dot, as a share of the step */
  var R_BOLD = R_LIGHT * 1.3;
  var A_LIGHT = 0.32, A_BOLD = 0.5;
  var STARS = [['#a78bfa', 3], ['#7aa2ff', 3], ['#f08bb4', 2], ['#f3d98b', 2], ['#ff8a70', 1]];
  var MIX = 0.45, SHARE = 0.55, TWINKLERS = 0.22, AMP = 0.85, FPS = 20, LEVELS = 8;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, dpr = 1, step = 16, ink = '#e9ecee', css = [], lastInk = '';

  function hexRgb(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function toRgb(c) {
    if (/^#[0-9a-f]{6}$/i.test(c)) return hexRgb(c);
    var m = c.match(/\d+(\.\d+)?/g);
    return m && m.length >= 3 ? [+m[0], +m[1], +m[2]] : [233, 236, 238];
  }
  function palette(inkCss) {
    var base = toRgb(inkCss), out = ['rgb(' + base.join(',') + ')'];
    for (var i = 0; i < STARS.length; i++) {
      var s = hexRgb(STARS[i][0]);
      out.push('rgb(' + s.map(function (v, k) { return Math.round(v + (base[k] - v) * MIX); }).join(',') + ')');
    }
    return out;
  }
  var TOTAL = STARS.reduce(function (a, s) { return a + s[1]; }, 0);
  function hash4(u, v) {
    var h = Math.imul(u | 0, 0x27d4eb2d) ^ Math.imul(v | 0, 0x165667b1), out = [];
    for (var i = 0; i < 4; i++) {
      h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
      h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
      h ^= h >>> 15;
      out.push((h >>> 0) / 4294967296);
    }
    return out;
  }
  function colorIndex(h) {
    if (h >= SHARE) return 0;
    var x = (h / SHARE) * TOTAL;
    for (var i = 0; i < STARS.length; i++) { x -= STARS[i][1]; if (x < 0) return i + 1; }
    return STARS.length;
  }
  function isBold(c, r) { return (c & 1) === 0 && (((c / 2 + r) % 2) + 2) % 2 === 0; }

  /* --L4 in px: measured, since the token is a calc() */
  var probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;visibility:hidden;width:var(--L4);height:0';
  document.documentElement.appendChild(probe);

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    var s = probe.getBoundingClientRect().width;
    step = s > 2 ? s : 16;
  }

  function draw(t) {
    var cur = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || ink;
    if (cur !== lastInk) { lastInk = cur; css = palette(cur); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var u1 = Math.ceil(W / step) + 1, v1 = Math.ceil(H / step) + 1;
    var layers = [[false, Math.max(R_LIGHT * step, 0.45), A_LIGHT], [true, Math.max(R_BOLD * step, 0.45), A_BOLD]];
    for (var L = 0; L < 2; L++) {
      var bold = layers[L][0], r = layers[L][1], alpha = layers[L][2];
      var square = r < 1.1, side = r * 1.7725, buckets = {};
      for (var u = 0; u <= u1; u++) {
        if (bold && (u & 1)) continue;
        for (var v = 0; v <= v1; v++) {
          if (isBold(u, v) !== bold) continue;
          var h = hash4(u, v), ci = colorIndex(h[0]), b = 1;
          if (AMP > 0 && !reduce && h[1] < TWINKLERS) {
            var s = 0.5 + 0.5 * Math.sin((t / (4 + 7 * h[3]) + h[2]) * Math.PI * 2);
            b = 1 - AMP * 0.5 + AMP * s * s * s;
          }
          var key = ci * LEVELS + Math.min(LEVELS - 1, Math.round(b * (LEVELS - 1) / 1.3));
          var p = buckets[key] || (buckets[key] = new Path2D());
          var x = u * step, y = v * step;
          if (square) p.rect(x - side / 2, y - side / 2, side, side);
          else { p.moveTo(x + r, y); p.arc(x, y, r, 0, Math.PI * 2); }
        }
      }
      for (var k in buckets) {
        var lv = k % LEVELS;
        ctx.globalAlpha = Math.min(1, alpha * (lv * 1.3) / (LEVELS - 1));
        ctx.fillStyle = css[Math.floor(k / LEVELS)];
        ctx.fill(buckets[k]);
      }
    }
    ctx.globalAlpha = 1;
  }

  var last = 0;
  function tick(now) {
    if (now - last >= 1000 / FPS) { last = now; draw(now / 1000); }
    requestAnimationFrame(tick);
  }
  resize();
  window.addEventListener('resize', function () { resize(); draw(performance.now() / 1000); });
  draw(performance.now() / 1000);
  if (!reduce) requestAnimationFrame(tick);
  else setInterval(function () { draw(0); }, 1000);   /* still stars; only follow a change of ground */
}());
