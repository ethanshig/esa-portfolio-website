/* ===================================================================
   LANDING: the word builds, a click unbuilds it, the page draws in.
   Timeline: ESA-LINE-SYSTEM-SPEC.md §6. Plays once per session; after that
   the home page opens already built.
   =================================================================== */
(function () {
  'use strict';
  var LS = window.LineSystem, U = LS._util, el = U.el, ease = U.ease, clamp01 = U.clamp01;
  var R = U.R, TAU = Math.PI * 2, reduce = U.reduce;
  var SEEN_KEY = 'esa-landing-seen';

  var home = document.querySelector('.ls-home');
  var seen = false;
  try { seen = sessionStorage.getItem(SEEN_KEY) === '1'; } catch (e) {}
  if (seen || reduce) {
    if (home) home.classList.remove('is-waiting');
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) {}
    LS.init();
    return;
  }

  LS.init({ deferPage: true });

  /* ---------- stage: the word is 34% of the viewport width, centred ---------- */
  var WORD_W = 30;
  var X0 = -R, X1 = 5 * R, MW = X1 - X0, MCX = 2 * R;
  var stage = document.createElement('div');
  stage.className = 'ls-word';
  stage.setAttribute('role', 'button');
  stage.setAttribute('tabindex', '0');
  stage.setAttribute('aria-label', 'esa. Press to enter the site.');
  var svg = el('svg', { preserveAspectRatio: 'xMidYMid meet', 'aria-hidden': 'true' });
  stage.appendChild(svg);
  var prompt = document.createElement('p');
  prompt.className = 'ls-word-prompt';
  prompt.textContent = 'click anywhere';
  stage.appendChild(prompt);
  document.body.appendChild(stage);

  function fit() {
    var VW = MW / 0.34, VH = VW * (window.innerHeight / Math.max(1, window.innerWidth));
    svg.setAttribute('viewBox', (MCX - VW / 2) + ' ' + (-VH / 2) + ' ' + VW + ' ' + VH);
  }
  fit();
  window.addEventListener('resize', fit);

  /* a dash pulled all the way back still paints its round cap as a dot: hide it at zero */
  function dashTo(node, len, p) {
    node.setAttribute('visibility', p <= 0.0005 ? 'hidden' : 'visible');
    node.setAttribute('stroke-dashoffset', (len * (1 - p)).toFixed(1));
  }
  function arcD(ox, a0, a1) {
    var x0 = ox + R * Math.cos(a0), y0 = -R * Math.sin(a0), x1 = ox + R * Math.cos(a1), y1 = -R * Math.sin(a1);
    return 'M' + x0.toFixed(2) + ' ' + y0.toFixed(2) + 'A' + R + ' ' + R + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 0 ' + x1.toFixed(2) + ' ' + y1.toFixed(2);
  }

  var guides = [], arcs = [], CIRC = TAU * R;
  U.ORDER.forEach(function (key, i) {
    var ox = i * 2 * R;
    guides.push(svg.appendChild(el('circle', { cx: ox, cy: 0, r: R, fill: 'none', stroke: 'currentColor', 'stroke-width': 3,
      'stroke-dasharray': CIRC.toFixed(1), 'stroke-dashoffset': CIRC.toFixed(1), opacity: '0', visibility: 'hidden' })));
    U.RUNS[key].forEach(function (run) {
      var a0 = run[0] * TAU / 8, a1 = (run[0] + run[1]) * TAU / 8, len = (a1 - a0) * R;
      var node = svg.appendChild(el('path', { d: arcD(ox, a0, a1), fill: 'none', stroke: 'currentColor', 'stroke-width': WORD_W,
        'stroke-linecap': 'round', 'stroke-dasharray': len + ' ' + (len + 2), 'stroke-dashoffset': len, visibility: 'hidden' }));
      arcs.push({ el: node, len: len });
    });
  });
  var bar = svg.appendChild(el('path', { d: 'M' + X0 + ' 0 L' + X1 + ' 0', fill: 'none', stroke: 'currentColor', 'stroke-width': WORD_W,
    'stroke-linecap': 'round', 'stroke-dasharray': MW + ' ' + (MW + 2), 'stroke-dashoffset': MW, visibility: 'hidden' }));

  var T_ARC = 1.15, T_BAR = 1.95, T_FADE = 2.10, T_END = 3.40, U_PAGE = 2.10;
  function drawBuild(e) {
    var fade = clamp01((e - T_FADE) / 0.75);
    guides.forEach(function (g, i) {
      var p = ease((e - i * 0.12) / 0.70);
      dashTo(g, CIRC, p);
      g.setAttribute('opacity', (0.30 * p * (1 - fade)).toFixed(3));
    });
    var ap = ease((e - T_ARC) / 0.70);
    arcs.forEach(function (s) { dashTo(s.el, s.len, ap); });
    dashTo(bar, MW, ease((e - T_BAR) / 1.30));
  }
  function drawUnbuild(t) {
    var barOut = ease(t / 0.80), scafIn = ease((t - 0.30) / 0.55), arcOut = ease((t - 0.80) / 0.60), close = ease((t - 1.35) / 0.70);
    dashTo(bar, MW, 1 - barOut);
    arcs.forEach(function (s) { dashTo(s.el, s.len, 1 - arcOut); });
    guides.forEach(function (g) {
      dashTo(g, CIRC, 1 - close);
      g.setAttribute('opacity', (0.30 * scafIn * (1 - close)).toFixed(3));
    });
  }

  var t0 = U.now(), phase = 'build', pt0 = 0, pageBegun = false;
  function frame(t) {
    if (phase === 'build') {
      var e = t - t0;
      drawBuild(e);
      if (e > T_END) stage.classList.add('is-ready');
      return;
    }
    var pe = t - pt0;
    drawUnbuild(pe);
    if (pe > 0.9) stage.classList.add('is-leaving');
    if (!pageBegun && pe >= U_PAGE) {
      pageBegun = true;
      if (home) home.classList.remove('is-waiting');
      LS.beginPage();
    }
    if (pe > U_PAGE + 0.4) {
      LS._setLandingFrame(null);
      stage.parentNode && stage.parentNode.removeChild(stage);
      window.removeEventListener('resize', fit);
    }
  }
  function trigger() {
    if (phase !== 'build') return;
    drawBuild(T_END);                          /* leave from a finished word */
    phase = 'exit';
    pt0 = U.now();
    stage.classList.add('is-ready');
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) {}
  }
  stage.addEventListener('click', trigger);
  stage.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); trigger(); }
  });
  window.addEventListener('wheel', trigger, { once: true, passive: true });
  stage.focus({ preventScroll: true });
  LS._setLandingFrame(frame);
})();
