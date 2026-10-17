/* PROTOTYPE (prototype/grid/project): how the axon (bold) dots and the cartesian (light) dots
   are told apart, and how loud the paper is against the content. One style per ?grid= value;
   dots.js (the paper) and lattice.js (the bold dots lifted into 3D) both read it.

     rLight, rBold   radius, as a share of one dot step
     aLight, aBold   ink alpha, before the paper's own opacity (--env-paper)
     shape           how an axon node is drawn: dot | plus | cross (the two 2:1 plan axes) | lines
     arm             plus/cross half-length, in steps
     tint            true: axon nodes in the accent, not the ink

   'now' is the notebook as printed (0.31 mm / 0.18 mm radius, bold ink #6e6e6e vs #c6c6c6). */
import { LIGHT_R_PER_PITCH, BOLD_R_PER_PITCH, LIGHT_INK, BOLD_INK } from '../axon/dimetric.js';

export const GRID_STYLES = {
  now:   { rLight: LIGHT_R_PER_PITCH, rBold: BOLD_R_PER_PITCH, aLight: LIGHT_INK / BOLD_INK, aBold: 1, shape: 'dot' },
  quiet: { rLight: LIGHT_R_PER_PITCH, rBold: LIGHT_R_PER_PITCH * 1.3, aLight: 0.32, aBold: 0.5, shape: 'dot' },
  plus:  { rLight: LIGHT_R_PER_PITCH, rBold: 0, aLight: 0.34, aBold: 0.55, shape: 'plus', arm: 0.2 },
  cross: { rLight: LIGHT_R_PER_PITCH, rBold: 0, aLight: 0.34, aBold: 0.55, shape: 'cross', arm: 0.24 },
  tint:  { rLight: LIGHT_R_PER_PITCH, rBold: LIGHT_R_PER_PITCH * 1.15, aLight: 0.32, aBold: 0.6, shape: 'dot', tint: true },
  lines: { rLight: LIGHT_R_PER_PITCH, rBold: 0, aLight: 0.36, aBold: 0.16, shape: 'lines' },
};

export function gridStyle() {
  const v = new URLSearchParams(location.search).get('grid');
  return GRID_STYLES[v] ? { key: v, ...GRID_STYLES[v] } : { key: 'quiet', ...GRID_STYLES.quiet };
}
