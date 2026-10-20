/* ===================================================================
   THEME — light or dark paper, the nav's half-inked cell. PROTOTYPE
   (prototype/grid). Shared by the index sheet and the project pages.

   The cell (markup in each page's nav, CSS in project/env.css) is split on
   its middle line; the ink sits on the side of the current paper. The page
   turns like a print to its negative (Ethan, 2026-10-20): the old view
   inverts and fades as the new one comes up through it. The camera stays
   still; reduced motion, or no View Transitions, swaps in one frame.

   The choice is remembered site-wide (localStorage esa-theme); ?theme=
   wins on load (each page's head script) and is dropped from the URL on
   the first toggle, so a reload keeps what the reader chose.
   =================================================================== */
const KEY = 'esa-theme';
const FLIP_MS = 420;
const REPAINT_CAP_MS = 300;     /* the new view waits this long at most for the page's repaint */

const root = document.documentElement;
export const themeNow = () => (root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

/* button: the nav's [data-theme-toggle]. onChange(theme): the page repaints whatever it drew in page
   colours (canvas, WebGL); it may return a promise, raced against the cap. It runs inside the view
   transition's update, where rendering is paused, so it must never wait on requestAnimationFrame:
   mark dirty and kick, and the frame lands before the browser captures the new view. */
export function attachThemeSwitch({ button, reduceMotion, onChange = () => {} }) {
  if (!button) throw new Error('theme: no [data-theme-toggle] button');
  const label = () => {
    button.setAttribute('aria-pressed', String(themeNow() === 'light'));
    button.setAttribute('aria-label', themeNow() === 'light' ? 'Dark paper' : 'Light paper');
  };
  label();

  async function apply(t) {
    root.setAttribute('data-theme', t);
    label();
    try { localStorage.setItem(KEY, t); } catch { /* private window: the choice lasts this page only */ }
    const q = new URLSearchParams(location.search);
    if (q.has('theme')) {
      q.delete('theme');
      history.replaceState(history.state, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
    }
    let cap = 0;
    try {
      await Promise.race([
        Promise.resolve().then(() => onChange(t)),
        new Promise((r) => { cap = setTimeout(r, REPAINT_CAP_MS); }),
      ]);
    } catch (err) {
      /* the CSS has already turned; only what the page painted itself may lag */
      console.error('[theme] the page could not repaint for the new paper', err);
    } finally {
      clearTimeout(cap);
    }
  }

  button.addEventListener('click', async () => {
    const t = themeNow() === 'light' ? 'dark' : 'light';
    if (reduceMotion || !document.startViewTransition) { apply(t); return; }
    const vt = document.startViewTransition(() => apply(t));
    try { await vt.ready; } catch { return; /* skipped (hidden tab, a second click): the theme is applied all the same */ }
    root.animate([{ filter: 'invert(0)', opacity: 1 }, { filter: 'invert(1)', opacity: 0 }],
      { duration: FLIP_MS, easing: 'ease-in', pseudoElement: '::view-transition-old(root)', fill: 'both' });
    root.animate([{ opacity: 0 }, { opacity: 1 }],
      { duration: FLIP_MS, easing: 'ease-out', pseudoElement: '::view-transition-new(root)', fill: 'both' });
  });
}
