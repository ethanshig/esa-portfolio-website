/* ===================================================================
   PROTOTYPE: the circle grid
   - each card frame is one esa letter circle: kept octants drawn as ink arcs,
     cut octants open the circle (cut away as empty wedges, masked as a disc, or opened to the square corner)
   - pattern / count / reading / theme come from the dev panel (or ?query for tests)
   - activating a card plays the logo's own unbuild (js/landing-sequence.js),
     scaled to one circle: guide draws, the rule (the bar) retracts, arcs retract,
     the frame opens, then the project page loads.
   Octants: k = 0..7, 45° each, anticlockwise from +x. No meaning is assigned to them.
   This script adds no reader-visible text.
   =================================================================== */
(function () {
  'use strict';

  var TAU = Math.PI * 2;
  var R = 300;                                   /* frame units: the cell is 600 × 600, centre at 0, 0 */
  var NS = 'http://www.w3.org/2000/svg';
  var SAMPLES_PER_OCTANT = 12;
  var OPEN_R = R * Math.SQRT2 + 2;               /* a disc this large covers the whole square */
  var STORE_KEY = 'cg-circle-prototype';

  var LETTERS = {
    e: [1, 2, 3, 4, 5, 6],
    s: [1, 2, 3, 5, 6, 7],
    a: [0, 1, 2, 3, 4, 7]
  };
  var CYCLE_ORDER = ['e', 's', 'a'];

  /* unbuild timeline, seconds: the landing unbuild's order, scaled to one circle */
  var T = {
    guideIn: [0.00, 0.45],    /* guide circle draws, 30% */
    ruleOut: [0.00, 0.60],    /* the bar retracts */
    arcsOut: [0.40, 0.60],    /* kept arcs retract */
    open:    [0.95, 0.50],    /* the frame opens; the guide closes */
    nav:     1.50
  };
  var REDUCED_NAV = 0.30;     /* reduced motion: a fade, then go */

  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  var grid = document.getElementById('cg-grid');
  var main = document.getElementById('cg-main');
  var form = document.getElementById('cg-dev-form');
  var dev = document.getElementById('cg-dev');
  if (!grid || !main || !form) {
    throw new Error('circle grid prototype: expected #cg-grid, #cg-main and #cg-dev-form in the page');
  }

  /* ---------- helpers ---------- */
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(p) { p = clamp01(p); return 1 - Math.pow(1 - p, 3); }
  function beat(t, b) { return ease((t - b[0]) / b[1]); }
  function now() { return performance.now() / 1000; }
  function svgEl(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  /* deterministic per-seed generator (mulberry32) */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- octant masks ---------- */
  function maskFrom(list) {
    var m = [false, false, false, false, false, false, false, false];
    list.forEach(function (k) { m[k] = true; });
    return m;
  }

  /* one or two continuous runs, like the letters; always at least one octant cut */
  function randomMask(seed, index) {
    var next = rng((seed * 9973 + index * 7919 + 17) >>> 0);
    var m = maskFrom([]);
    var start = Math.floor(next() * 8);
    var len = 3 + Math.floor(next() * 4);                      /* 3..6 */
    for (var i = 0; i < len; i++) m[(start + i) % 8] = true;
    var free = 8 - len;                                        /* 2..5 octants cut so far */
    if (free >= 3 && next() < 0.5) {
      /* a second run, leaving at least one cut octant on each side of it */
      var len2 = 1 + Math.floor(next() * (free - 2));
      var offset = 1 + Math.floor(next() * (free - len2 - 1));
      for (var j = 0; j < len2; j++) m[(start + len + offset + j) % 8] = true;
    }
    return m;
  }

  function maskFor(state, index) {
    if (state.pattern === 'cycle') return maskFrom(LETTERS[CYCLE_ORDER[index % 3]]);
    if (state.pattern === 'random') return randomMask(state.seed, index);
    return maskFrom(LETTERS[state.letter]);
  }

  /* continuous runs [start, length], wrapping past octant 7 */
  function runsOf(mask) {
    var kept = mask.filter(Boolean).length;
    if (kept === 0) return [];
    if (kept === 8) return [[0, 8]];
    var first = 0;
    while (!(mask[first] && !mask[(first + 7) % 8])) first++;   /* first kept octant after a cut one; exists since 0 < kept < 8 */
    var runs = [], k = 0;
    while (k < 8) {
      var idx = (first + k) % 8;
      if (mask[idx]) {
        var len = 0;
        while (k < 8 && mask[(first + k) % 8]) { len++; k++; }
        runs.push([idx, len]);
      } else {
        k++;
      }
    }
    return runs;
  }

  /* SVG arc for a run at radius r; screen y is flipped, so anticlockwise = sweep 0 */
  function runPath(run, r) {
    var a0 = run[0] * TAU / 8, a1 = (run[0] + run[1]) * TAU / 8;
    if (run[1] === 8) {
      return 'M' + r + ' 0A' + r + ' ' + r + ' 0 1 0 ' + (-r) + ' 0A' + r + ' ' + r + ' 0 1 0 ' + r + ' 0';
    }
    var x0 = r * Math.cos(a0), y0 = -r * Math.sin(a0), x1 = r * Math.cos(a1), y1 = -r * Math.sin(a1);
    return 'M' + x0.toFixed(2) + ' ' + y0.toFixed(2) +
           'A' + r.toFixed(2) + ' ' + r.toFixed(2) + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 0 ' +
           x1.toFixed(2) + ' ' + y1.toFixed(2);
  }

  /* distance from centre to the cell's square edge along angle a */
  function squareReach(a) {
    return R / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
  }

  /* the photo's clip, as a star-shaped polygon in % of the cell, radius r on kept octants.
     cut octants, by reading:
       cut    -> empty wedge: the photo is the union of the kept 45° sectors, its silhouette is the glyph.
                 openP (0..1, the unbuild's open beat) grows the wedges back in.
       disc   -> radius r: the photo stays a whole disc, only the ink shows the cut.
       corner -> out to the square's edge: the photo runs to the cell corner. */
  function clipPolygon(mask, r, reading, openP) {
    var pts = [];
    for (var k = 0; k < 8; k++) {
      for (var i = 0; i <= SAMPLES_PER_OCTANT; i++) {
        var a = (k + i / SAMPLES_PER_OCTANT) * TAU / 8;
        var rho;
        if (mask[k] || reading === 'disc') rho = r;
        else if (reading === 'corner') rho = Math.max(r, squareReach(a));
        else rho = r * openP;                       /* 'cut' */
        var x = 50 + (rho * Math.cos(a)) / (2 * R) * 100;
        var y = 50 - (rho * Math.sin(a)) / (2 * R) * 100;
        pts.push(x.toFixed(3) + '% ' + y.toFixed(3) + '%');
      }
    }
    return 'polygon(' + pts.join(',') + ')';
  }

  /* ---------- lattice step in px, read from --L (same probe as line-system.js) ---------- */
  function measureL() {
    var probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;width:var(--L);height:0;';
    document.body.appendChild(probe);
    var px = probe.getBoundingClientRect().width;
    document.body.removeChild(probe);
    if (!(px > 0)) throw new Error('circle grid prototype: --L did not resolve to a width; is css/line-system.css loaded?');
    return px;
  }

  /* ---------- cards ---------- */
  var cards = [].map.call(grid.querySelectorAll('.cg-cell'), function (cell) {
    var frame = cell.querySelector('.cg-frame');
    var svg = cell.querySelector('.cg-ink');
    var arcsG = cell.querySelector('.cg-arcs');
    var guide = cell.querySelector('.cg-guide');
    if (!frame || !svg || !arcsG || !guide) {
      throw new Error('circle grid prototype: cell ' + cell.getAttribute('data-index') + ' is missing its frame markup');
    }
    return {
      cell: cell,
      index: parseInt(cell.getAttribute('data-index'), 10),
      link: cell.querySelector('a.cg-card'),
      img: frame.querySelector('img'),
      arcsG: arcsG,
      guide: guide,
      rule: cell.querySelector('.cg-rule'),
      mask: null,
      arcs: [],          /* { el, len } */
      swU: 21.6,         /* arc weight in frame units */
      rA: R - 10.8,      /* arc centreline radius */
      guideLen: TAU * (R - 10.8)
    };
  });

  var state = {
    pattern: 'same', letter: 'e', seed: 1, count: 6, reading: 'cut', theme: 'dark', hold: false
  };
  var leaving = null;    /* { card, t0, timer } while an unbuild is playing */

  /* geometry for one card at the current size: weights are screen px, converted to frame units */
  function measureCard(c, Lpx) {
    var size = c.cell.querySelector('.cg-frame').getBoundingClientRect().width;
    if (!(size > 0)) return false;                               /* hidden (placeholder at count 6) */
    var unitsPerPx = (2 * R) / size;
    var strokePx = Math.max(1.5, Math.min(4.5, 0.072 * Lpx));  /* spec §2 outline weight, line-system clamp */
    c.swU = strokePx * unitsPerPx;
    c.rA = R - c.swU / 2;                                        /* stroke stays inside the cell: tangent cells touch */
    c.guideW = Math.max(1, 0.012 * Lpx) * unitsPerPx;            /* thin guide */
    return true;
  }

  function buildArcs(c) {
    while (c.arcsG.firstChild) c.arcsG.removeChild(c.arcsG.firstChild);
    c.arcs = runsOf(c.mask).map(function (run) {
      var len = run[1] * (TAU / 8) * c.rA;
      var path = svgEl('path', { d: runPath(run, c.rA) });
      path.style.strokeWidth = c.swU.toFixed(2) + 'px';
      c.arcsG.appendChild(path);
      return { el: path, len: len };
    });
    c.guide.setAttribute('r', c.rA.toFixed(2));
    c.guide.style.strokeWidth = c.guideW.toFixed(2) + 'px';
    c.guideLen = TAU * c.rA;
  }

  /* a dash pulled all the way back still paints its round cap as a dot: hide it at zero */
  function dashTo(node, len, p) {
    node.style.visibility = p <= 0.0005 ? 'hidden' : 'visible';
    node.style.strokeDasharray = len.toFixed(2) + ' ' + (len + 2).toFixed(2);
    node.style.strokeDashoffset = (len * (1 - p)).toFixed(2);
  }

  function clearDash(node) {
    node.style.visibility = '';
    node.style.strokeDasharray = '';
    node.style.strokeDashoffset = '';
  }

  /* the settled, built frame */
  function paintBuilt(c) {
    c.arcs.forEach(function (a) { clearDash(a.el); });
    c.guide.style.visibility = 'hidden';
    c.guide.style.opacity = '0';
    if (c.rule) c.rule.style.transform = '';
    if (c.img) c.img.style.clipPath = clipPolygon(c.mask, c.rA, state.reading, 0);
  }

  /* frame at time t (seconds) into the unbuild */
  function paintUnbuild(c, t) {
    var guideP = beat(t, T.guideIn);
    var openP = beat(t, T.open);
    var arcP = 1 - beat(t, T.arcsOut);
    c.arcs.forEach(function (a) { dashTo(a.el, a.len, arcP); });
    dashTo(c.guide, c.guideLen, guideP * (1 - openP));
    c.guide.style.opacity = (0.30 * guideP * (1 - openP)).toFixed(3);
    if (c.rule) c.rule.style.transform = 'scaleX(' + (1 - beat(t, T.ruleOut)).toFixed(4) + ')';
    if (c.img) c.img.style.clipPath = clipPolygon(c.mask, c.rA + (OPEN_R - c.rA) * openP, state.reading, openP);
  }

  function layoutAll() {
    var Lpx = measureL();
    cards.forEach(function (c) {
      c.mask = maskFor(state, c.index);
      if (!measureCard(c, Lpx)) return;
      buildArcs(c);
      if (leaving && leaving.card === c) paintUnbuild(c, now() - leaving.t0);
      else paintBuilt(c);
    });
  }

  /* ---------- state: dev panel, query string, per-viewer memory ---------- */
  var VALID = {
    pattern: ['same', 'cycle', 'random'],
    letter: ['e', 's', 'a'],
    count: ['6', '8'],
    reading: ['cut', 'disc', 'corner'],
    theme: ['auto', 'light', 'dark']
  };

  /* accept a value only if it is one this prototype knows; anything else keeps the default */
  function merge(into, src) {
    if (!src || typeof src !== 'object') return;
    Object.keys(VALID).forEach(function (k) {
      if (src[k] !== undefined && VALID[k].indexOf(String(src[k])) !== -1) {
        into[k] = k === 'count' ? parseInt(src[k], 10) : String(src[k]);
      }
    });
    if (src.seed !== undefined) {
      var s = parseInt(src.seed, 10);
      if (isFinite(s) && s >= 0 && s <= 999999) into.seed = s;
    }
    if (src.hold !== undefined) into.hold = src.hold === true || src.hold === '1' || src.hold === 'true';
  }

  function readStored() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;     /* private window / blocked storage / bad JSON: defaults stand */
    }
  }
  function writeStored() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable: settings last this load only */ }
  }

  function readQuery() {
    var out = {};
    new URLSearchParams(window.location.search).forEach(function (v, k) { out[k] = v; });
    return out;
  }

  function syncForm() {
    form.elements.pattern.value = state.pattern;
    form.elements.letter.value = state.letter;
    form.elements.seed.value = String(state.seed);
    form.elements.count.value = String(state.count);
    form.elements.reading.value = state.reading;
    form.elements.theme.value = state.theme;
    form.elements.hold.checked = state.hold;
  }

  function applyState() {
    grid.setAttribute('data-count', String(state.count));
    grid.setAttribute('data-reading', state.reading);
    if (state.theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', state.theme);
    layoutAll();
    if (window.LineSystem && typeof window.LineSystem.relayout === 'function') window.LineSystem.relayout();
  }

  function readForm() {
    var seed = parseInt(form.elements.seed.value, 10);
    merge(state, {
      pattern: form.elements.pattern.value,
      letter: form.elements.letter.value,
      count: form.elements.count.value,
      reading: form.elements.reading.value,
      theme: form.elements.theme.value,
      seed: isFinite(seed) ? seed : undefined,
      hold: form.elements.hold.checked
    });
  }

  form.addEventListener('change', function () {
    readForm();
    syncForm();          /* an out-of-range seed snaps back to the last good one */
    writeStored();
    applyState();
  });
  form.addEventListener('submit', function (ev) { ev.preventDefault(); });
  document.getElementById('cg-reseed').addEventListener('click', function () {
    state.seed = Math.floor(Math.random() * 1000000);
    state.pattern = 'random';
    syncForm();
    writeStored();
    applyState();
  });

  /* ---------- activation: the logo's native move, then navigate ---------- */
  function finishHold(c) {
    leaving = null;
    paintBuilt(c);
    main.classList.remove('is-leaving');
  }

  function frame() {
    if (!leaving) return;
    var t = now() - leaving.t0;
    paintUnbuild(leaving.card, t);
    if (t < T.nav + 0.05) requestAnimationFrame(frame);
  }

  function activate(c, href) {
    if (reduceQuery.matches) {
      main.classList.add('is-leaving');
      leaving = { card: c, t0: now(), timer: 0 };
      leaving.timer = setTimeout(function () {
        if (state.hold) finishHold(c);
        else window.location.assign(href);
      }, REDUCED_NAV * 1000);
      return;
    }
    leaving = { card: c, t0: now(), timer: 0 };
    requestAnimationFrame(frame);
    /* navigation runs on a timer, not on animation frames, so a backgrounded tab still goes */
    leaving.timer = setTimeout(function () {
      if (state.hold) {
        setTimeout(function () { finishHold(c); }, 600);
      } else {
        window.location.assign(href);
      }
    }, T.nav * 1000);
  }

  grid.addEventListener('click', function (ev) {
    var link = ev.target.closest('a.cg-card');
    if (!link || !grid.contains(link)) return;
    /* new tab / window / download: leave it to the browser, no animation */
    if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    ev.preventDefault();
    if (leaving) return;                                  /* one unbuild at a time */
    var c = cards.filter(function (x) { return x.link === link; })[0];
    if (!c) throw new Error('circle grid prototype: clicked a card the script does not know');
    activate(c, link.href);
  });

  /* back/forward cache: a restored page must be whole again, not frozen mid-unbuild */
  window.addEventListener('pageshow', function (ev) {
    if (!ev.persisted) return;
    if (leaving) clearTimeout(leaving.timer);
    leaving = null;
    main.classList.remove('is-leaving');
    layoutAll();
  });

  /* ---------- start ---------- */
  merge(state, readStored());
  merge(state, readQuery());     /* the query wins, so a link (or a test) can force any reading */
  syncForm();
  /* the panel starts open only where it does not sit on top of the cards */
  if (dev) {
    var panelBox = dev.getBoundingClientRect(), gridBox = grid.getBoundingClientRect();
    if (panelBox.left < gridBox.right && panelBox.right > gridBox.left) dev.removeAttribute('open');
  }

  var relayoutTimer = 0;
  function soon() { clearTimeout(relayoutTimer); relayoutTimer = setTimeout(layoutAll, 60); }
  if (window.ResizeObserver) new ResizeObserver(soon).observe(grid);
  else window.addEventListener('resize', soon);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutAll);

  applyState();
})();
