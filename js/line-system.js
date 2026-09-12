/* ===================================================================
   ESA LINE SYSTEM
   Spec: ESA-LINE-SYSTEM-SPEC.md  ·  Mockup code: ESA-LINE-SYSTEM-REFERENCE.js

   Every line on the site is a filled ribbon built from the esa circles:
   - the nav logo (circles turn in a relay, the bar holds and runs the width of the nav)
   - outlines on anything marked data-outline="rect | stadium | rule"
   - on the landing page, the word itself (LineSystem.landing)

   Lines draw themselves in, then the outlines keep breathing.
   All geometry is in "units": R = 300 units = one lattice step L.
   =================================================================== */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var TAU = Math.PI * 2;
  var R = 300;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- weights (units, see spec §2) ---------- */
  var LOGO_W = 58, OUTLINE_W = 21.6, RULE_W = 15.1, DEPTH = 0.45;
  var OUTLINE_MIN_PX = 1.5, OUTLINE_MAX_PX = 4.5;   /* keeps outlines honest at phone and wide sizes */

  /* ---------- glyphs: continuous runs of octants (k = 45°, anticlockwise from +x) ---------- */
  var ORDER = ['e', 's', 'a'];
  var RUNS = { e: [[1, 6]], s: [[1, 3], [5, 3]], a: [[7, 6]] };
  var X0 = -R, X1 = 5 * R, MW = X1 - X0;              /* centres at 0, 2R, 4R */

  function el(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(p) { p = clamp01(p); return 1 - Math.pow(1 - p, 3); }
  function calm(p) { return 0.5 - 0.5 * Math.cos(Math.PI * clamp01(p)); }
  function now() { return performance.now() / 1000; }

  /* ---------- the lattice step in px, read from --L ---------- */
  var Lpx = 80;
  function measureL() {
    var probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;width:var(--L);height:0;';
    document.body.appendChild(probe);
    Lpx = probe.getBoundingClientRect().width || 80;
    document.body.removeChild(probe);
  }

  /* ---------- breathing (spec §3) ---------- */
  function breathAt(xu, yu, t) {
    var field = 0.55 * Math.sin(xu * 0.0021 + t * 0.83)
              + 0.30 * Math.sin(yu * 0.0033 - t * 0.61 + 1.7)
              + 0.15 * Math.sin((xu - yu) * 0.0015 + t * 1.13 + 0.4);
    var breath = Math.sin(t * TAU / 7.5);
    return Math.max(0.35, 1 + DEPTH * (0.70 * field + 0.30 * breath));
  }

  /* ---------- ribbon: offset a sampled centreline; tapers in, never leaves a dot ---------- */
  function ribbon(pts, reveal, base, wmul, strokeLen) {
    var n = pts.length;
    if (reveal <= 0.002 || n < 2) return null;
    var taper = clamp01((reveal * strokeLen) / (base * 2.2));
    var m = Math.max(2, Math.min(n, Math.round(1 + (n - 1) * reveal)));
    var L = [], Rt = [], wS = 0, wE = 0;
    for (var i = 0; i < m; i++) {
      var p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      var tx = b[0] - a[0], ty = b[1] - a[1], len = Math.hypot(tx, ty) || 1, nx = -ty / len, ny = tx / len;
      var w = base * (wmul ? wmul(p[0], p[1]) : 1) / 2 * taper;
      if (i === 0) wS = w;
      if (i === m - 1) wE = w;
      L.push((p[0] + nx * w).toFixed(1) + ' ' + (p[1] + ny * w).toFixed(1));
      Rt.push((p[0] - nx * w).toFixed(1) + ' ' + (p[1] - ny * w).toFixed(1));
    }
    return { d: 'M' + L.join('L') + 'L' + Rt.reverse().join('L') + 'Z',
             caps: [[pts[0][0], pts[0][1], wS], [pts[m - 1][0], pts[m - 1][1], wE]] };
  }
  function Ribbon(parent) {
    var body = parent.appendChild(el('path', { fill: 'currentColor' }));
    var caps = [parent.appendChild(el('circle', { fill: 'currentColor', r: 0 })),
                parent.appendChild(el('circle', { fill: 'currentColor', r: 0 }))];
    return function (r) {
      if (!r) { body.setAttribute('d', ''); caps[0].setAttribute('r', 0); caps[1].setAttribute('r', 0); return; }
      body.setAttribute('d', r.d);
      for (var k = 0; k < 2; k++) {
        caps[k].setAttribute('cx', r.caps[k][0].toFixed(1));
        caps[k].setAttribute('cy', r.caps[k][1].toFixed(1));
        caps[k].setAttribute('r', r.caps[k][2].toFixed(2));
      }
    };
  }

  /* ---------- logo strokes ---------- */
  var LSTROKES = [];
  ORDER.forEach(function (key, i) {
    RUNS[key].forEach(function (run) {
      var ox = i * 2 * R, a0 = run[0] * TAU / 8, a1 = (run[0] + run[1]) * TAU / 8;
      var n = Math.max(12, Math.round((a1 - a0) * R / 14)), pts = [];
      for (var j = 0; j <= n; j++) { var a = a0 + (a1 - a0) * j / n; pts.push([ox + R * Math.cos(a), -R * Math.sin(a)]); }
      LSTROKES.push({ pts: pts, len: (a1 - a0) * R, li: i, ox: ox, a0: a0, a1: a1 });
    });
  });

  /* Relay, 12 s: e 0.6–3.8, s 2.8–6.0, a 5.0–8.2, rest. Touching circles mesh: e, a anticlockwise; s clockwise. */
  var TURN_DIR = [1, -1, 1];
  function turns(t) {
    var c = ((t % 12) + 12) % 12, th = [0, 0, 0];
    for (var i = 0; i < 3; i++) th[i] = ((TAU * calm((c - 0.6 - i * 2.2) / 3.2)) % TAU) * TURN_DIR[i];
    return th;
  }
  function turnPts(st, th) {
    if (!th) return st.pts;
    var cs = Math.cos(th), sn = Math.sin(th), ox = st.ox;
    return st.pts.map(function (p) { var dx = p[0] - ox, dy = p[1]; return [ox + dx * cs + dy * sn, dy * cs - dx * sn]; });
  }

  /* ===================================================================
     NAV
     =================================================================== */
  var LOGO_TOP = -R - 80, LOGO_H = 2 * R + 160, LOGO_VW = MW + 160;
  var NAV_KEY = 'esa-nav-built';
  var nav = null;

  function mountNav() {
    var bar = document.querySelector('.navbar');
    var container = bar && bar.querySelector('.nav-container');
    var logo = container && container.querySelector('.logo');
    if (!container || !logo) return null;

    document.documentElement.classList.add('ls-on');
    logo.setAttribute('aria-label', 'esa — home');
    var svg = el('svg', { class: 'ls-nav-svg', 'aria-hidden': 'true', preserveAspectRatio: 'xMinYMid meet' });
    container.insertBefore(svg, container.firstChild);
    var g = svg.appendChild(el('g'));
    var arcsR = LSTROKES.map(function () { return Ribbon(g); });
    var barR = Ribbon(g), extR = Ribbon(g), barEnd = X1;

    var right = document.createElement('div');
    right.className = 'ls-nav-right';
    [container.querySelector('.nav-menu'), container.querySelector('.theme-toggle'), container.querySelector('.hamburger')]
      .forEach(function (n) { if (n) right.appendChild(n); });
    container.appendChild(right);

    function fit() {
      var box = svg.getBoundingClientRect();
      if (!box.height) return;
      var upx = LOGO_H / box.height;
      var vw = Math.max(LOGO_VW, box.width * upx);
      svg.setAttribute('viewBox', (X0 - 80) + ' ' + LOGO_TOP + ' ' + vw.toFixed(1) + ' ' + LOGO_H);
      barEnd = X0 - 80 + vw - LOGO_W / 2;
    }
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(svg);

    var built = false;
    try { built = sessionStorage.getItem(NAV_KEY) === '1'; } catch (e) {}
    var state = { tp0: null, built: built || reduce, loaded: now() };
    if (state.built) container.classList.add('ls-links-in');

    function draw() {
      var t = now(), tp = state.tp0 === null ? -1 : t - state.tp0;
      var arcP, barP, extP, th;
      if (state.built) {
        arcP = barP = extP = 1;
        th = reduce ? [0, 0, 0] : turns(t - state.loaded + 8.2);          /* rest ~4 s, then the relay */
      } else if (tp < 0) {
        arcP = barP = extP = 0; th = [0, 0, 0];
      } else {
        arcP = calm(tp / 1.0);
        barP = calm((tp - 0.55) / 0.7);
        extP = calm((tp - 1.1) / 1.6);
        th = tp < 2.7 ? [0, 0, 0] : turns(tp - 2.7 + 9.7);
        if (tp >= 2.1) container.classList.add('ls-links-in');
      }
      LSTROKES.forEach(function (st, i) { arcsR[i](ribbon(turnPts(st, th[st.li]), arcP, LOGO_W, null, st.len)); });
      barR(barP > 0.002 ? ribbon([[X0, 0], [X0 + MW * barP, 0]], 1, LOGO_W, null, MW * barP) : null);
      extR(extP > 0.002 ? ribbon([[X1, 0], [X1 + (barEnd - X1) * extP, 0]], 1, LOGO_W, null, 1e6) : null);
    }
    return {
      draw: draw,
      begin: function () {                      /* page begins: tp = 0 */
        if (state.built || state.tp0 !== null) return;
        state.tp0 = now();
        try { sessionStorage.setItem(NAV_KEY, '1'); } catch (e) {}
      },
      isBuilt: function () { return state.built; }
    };
  }

  /* ===================================================================
     OUTLINES
     data-outline="rect"     rounded rectangle (radius from CSS border-radius)
     data-outline="stadium"  two half circles joined by straight sides
     data-outline="rule"     a horizontal rule along the element's top edge
     data-outline="rule-bottom"
     =================================================================== */
  var layer = null, group = null, outlines = [], queueAt = 0, pageStarted = false;

  function ensureLayer() {
    if (layer) return;
    layer = el('svg', { class: 'ls-outline-layer', 'aria-hidden': 'true', 'data-outline-off': '' });
    group = layer.appendChild(el('g', { opacity: '0.62' }));
    document.body.appendChild(layer);
  }
  function sizeLayer() {
    var w = document.documentElement.scrollWidth, h = document.documentElement.scrollHeight;
    layer.setAttribute('width', w); layer.setAttribute('height', h);
    layer.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
  }

  function roundedRectPath(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    return 'M' + (x + r) + ' ' + y + 'H' + (x + w - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (x + w) + ' ' + (y + r) +
           'V' + (y + h - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (x + w - r) + ' ' + (y + h) +
           'H' + (x + r) + 'A' + r + ' ' + r + ' 0 0 1 ' + x + ' ' + (y + h - r) +
           'V' + (y + r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (x + r) + ' ' + y + 'Z';
  }
  var probePath = null;
  function samplePath(d, stepPx) {
    if (!probePath) { probePath = el('path', {}); }
    layer.appendChild(probePath);
    probePath.setAttribute('d', d);
    var len = probePath.getTotalLength() || 1, n = Math.max(2, Math.ceil(len / stepPx)), pts = [];
    for (var i = 0; i <= n; i++) { var q = probePath.getPointAtLength(len * i / n); pts.push([q.x, q.y]); }
    layer.removeChild(probePath);
    return { pts: pts, len: len };
  }

  function geometry(o) {
    var box = o.el.getBoundingClientRect();
    if (!box.width && !box.height) { o.pts = null; return; }
    var x = box.left + window.scrollX, y = box.top + window.scrollY, w = box.width, h = box.height;
    var kind = o.kind, d;
    var basePx = (kind.indexOf('rule') === 0 ? RULE_W : OUTLINE_W) * Lpx / R;
    o.basePx = Math.max(OUTLINE_MIN_PX, Math.min(OUTLINE_MAX_PX, basePx));
    var inset = o.basePx / 2;
    if (kind === 'rule') d = 'M' + x + ' ' + (y + inset) + 'H' + (x + w);
    else if (kind === 'rule-bottom') d = 'M' + x + ' ' + (y + h - inset) + 'H' + (x + w);
    else {
      var r;
      if (kind === 'stadium') r = h / 2;
      else r = parseFloat(getComputedStyle(o.el).borderTopLeftRadius) || 0;
      d = roundedRectPath(x + inset, y + inset, w - 2 * inset, h - 2 * inset, Math.max(0, r - inset));
    }
    var s = samplePath(d, 6);
    o.pts = s.pts; o.len = s.len;
  }

  function relayout() {
    if (!layer) return;
    measureL();
    sizeLayer();
    outlines.forEach(geometry);
  }

  function schedule(o) {
    if (o.start !== null) return;
    var t = now();
    queueAt = Math.max(queueAt, t);
    o.start = reduce ? -1e9 : queueAt;
    queueAt += reduce ? 0 : 0.16;
  }

  /* existing site components get outlines without editing every page (spec §4) */
  var AUTO = [
    ['.project-image-container', 'rect'], ['.project-card .project-image', 'rect'],
    ['.project-hero-image', 'rect'], ['.gallery-item img', 'rect'], ['.nav-btn', 'rect'],
    ['.download-btn', 'stadium'], ['.btn', 'stadium'], ['.filter-btn', 'stadium'], ['.arrow-button', 'stadium'],
    ['.project-navigation', 'rule'], ['.project-header', 'rule-bottom'],
    ['.contact-form input:not([type=hidden]):not([type=checkbox])', 'rect'], ['.contact-form textarea', 'rect']
  ];
  function autoMark(root) {
    AUTO.forEach(function (a) {
      [].forEach.call((root || document).querySelectorAll(a[0]), function (n) {
        if (!n.hasAttribute('data-outline') && !n.closest('[data-outline-off]')) n.setAttribute('data-outline', a[1]);
      });
    });
  }
  var io = null, relayoutTimer = 0;
  function soon() { clearTimeout(relayoutTimer); relayoutTimer = setTimeout(relayout, 60); }
  function register(n) {
    if (n.__lsOutline) return;
    var o = { el: n, kind: n.getAttribute('data-outline') || 'rect', start: null, visible: !io, draw: Ribbon(group), pts: null };
    n.__lsOutline = o;
    outlines.push(o);
    geometry(o);
    if (io) io.observe(n);
    else if (pageStarted) schedule(o);
  }

  function mountOutlines() {
    autoMark();
    ensureLayer();
    measureL();
    sizeLayer();
    io = window.IntersectionObserver ? new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var o = en.target.__lsOutline;
        if (!o) return;
        o.visible = en.isIntersecting;
        if (en.isIntersecting && pageStarted) schedule(o);
      });
    }, { rootMargin: '0px 0px -8% 0px' }) : null;

    [].forEach.call(document.querySelectorAll('[data-outline]'), register);
    if (window.ResizeObserver) new ResizeObserver(soon).observe(document.body);
    if (window.MutationObserver) {
      new MutationObserver(function (muts) {
        var added = false;
        var relevant = false;
        muts.forEach(function (m) {
          if (m.target === layer || (layer && layer.contains(m.target))) return;   /* our own drawing */
          if (m.target.closest && m.target.closest('.navbar, .ls-word')) return;
          relevant = true;
          if (m.type === 'childList' && m.addedNodes.length) added = true;
        });
        if (added) { autoMark(); [].forEach.call(document.querySelectorAll('[data-outline]'), register); }
        if (relevant) soon();
      }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
    }
    window.addEventListener('resize', soon);
    window.addEventListener('load', relayout);
    [].forEach.call(document.images, function (img) { if (!img.complete) img.addEventListener('load', relayout, { once: true }); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  }

  function startOutlines() {
    pageStarted = true;
    outlines.forEach(function (o) { if (o.visible) schedule(o); });
  }

  function drawOutlines(t) {
    var scale = R / Lpx;                         /* px → units for the breathing field */
    function wm(x, y) { return breathAt(x * scale, y * scale, t); }
    for (var i = 0; i < outlines.length; i++) {
      var o = outlines[i];
      if (!o.pts) { o.draw(null); continue; }
      if (o.start === null) { o.draw(null); continue; }
      var drawing = t - o.start < 0.9 + (o.len * scale) / 9000 + 0.05;
      if (!o.visible && !drawing && o.drawn) continue;         /* off-screen and finished: leave as is */
      var p = reduce ? 1 : ease((t - o.start) / (0.9 + (o.len * scale) / 9000));
      o.draw(ribbon(o.pts, p, o.basePx, reduce ? null : wm, o.len));
      o.drawn = true;
    }
  }

  /* ===================================================================
     LOOP
     =================================================================== */
  var landingFrame = null, lastDraw = 0, looping = false;
  function loop() { if (!looping) { looping = true; requestAnimationFrame(tick); } }
  function tick() {
    looping = false;
    var t = now();
    if (landingFrame) landingFrame(t);
    if (!document.hidden && (t - lastDraw > 1 / 45 || reduce)) {
      if (nav) nav.draw();
      drawOutlines(t);
      lastDraw = t;
    }
    if (!reduce || landingFrame) loop();
  }

  /* ===================================================================
     PUBLIC
     =================================================================== */
  var LS = window.LineSystem = {
    /* call once per page. opts.deferPage: the landing page starts the page itself */
    init: function (opts) {
      opts = opts || {};
      nav = mountNav();
      mountOutlines();
      if (!opts.deferPage) LS.beginPage();
      loop();
      if (reduce) { setTimeout(function () { if (nav) nav.draw(); drawOutlines(now()); }, 50); }
    },
    beginPage: function () {
      if (nav) nav.begin();
      startOutlines();
      if (reduce) setTimeout(function () { if (nav) nav.draw(); drawOutlines(now()); }, 50);
    },
    relayout: relayout,
    _setLandingFrame: function (fn) { landingFrame = fn; loop(); },
    _util: { el: el, ease: ease, calm: calm, clamp01: clamp01, RUNS: RUNS, ORDER: ORDER, R: R, reduce: reduce, now: now }
  };
})();
