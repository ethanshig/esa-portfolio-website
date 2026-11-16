/* The story layer's behaviour. It adds NO text to the page: every word is already
 * in the HTML (docs/story-layer-spec.md, contract 1). This file only decides which
 * of those words is visible, and copies one Narration line into a held position.
 *
 * The generator bakes data-story="on" onto <html>, so the page is already correct
 * before this runs; the head snippet only applies a stored preference.
 */
(function () {
  'use strict';
  var KEY = 'esa-story';
  var root = document.documentElement;

  function apply(state) {
    root.setAttribute('data-story', state);
    var btn = document.querySelector('.story-toggle');
    if (btn) btn.setAttribute('aria-pressed', String(state === 'on'));
  }

  document.addEventListener('DOMContentLoaded', function () {
    // The generator hard-codes aria-pressed="true"; it cannot know the stored
    // preference, so reconcile it here before anything else can read it.
    apply(root.getAttribute('data-story') === 'off' ? 'off' : 'on');

    var btn = document.querySelector('.story-toggle');
    if (btn) btn.addEventListener('click', function () {
      var next = root.getAttribute('data-story') === 'off' ? 'on' : 'off';
      apply(next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
    });

    var layer = document.querySelector('.narration');
    if (!layer) return;
    // Only the register this arrival calls for; the other is hidden by CSS and
    // must not be fed to the foot either.
    var mode = root.getAttribute('data-arrival') === 'crossed' ? 'with' : 'meet';
    var lines = [].slice.call(layer.querySelectorAll('.narration-line[data-mode="' + mode + '"]'));
    if (!lines.length) return;

    var foot = document.createElement('p');
    foot.className = 'narration-foot';
    document.body.appendChild(foot);

    var targets = [].slice.call(document.querySelectorAll('.project-section, .project-gallery'));
    var shown = -1;
    function pick() {
      if (root.getAttribute('data-story') === 'off') { foot.removeAttribute('data-shown'); shown = -1; return; }
      var mid = window.innerHeight * 0.55, idx = 0;
      for (var i = 0; i < targets.length; i++) {
        if (targets[i].getBoundingClientRect().top < mid) idx = i;
      }
      // There are usually more Narration lines than scroll targets, so spread the
      // lines across the targets instead of pairing them 1:1 and stranding the tail.
      var span = Math.max(targets.length - 1, 1);
      var n = Math.min(lines.length - 1, Math.round((idx / span) * (lines.length - 1)));
      if (n === shown) return;
      shown = n;
      foot.textContent = lines[n].textContent;   // copied from the DOM, never authored here
      foot.setAttribute('data-shown', '');
    }
    pick();
    addEventListener('scroll', pick, { passive: true });
    addEventListener('resize', pick, { passive: true });
  });
}());
