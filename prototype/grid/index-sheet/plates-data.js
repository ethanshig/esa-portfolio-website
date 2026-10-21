/* PROTOTYPE (index map #8, variants e and f: the index as a field of Plates). Throwaway data.

   A Plate's three Facets, named by Ethan (#14, 2026-10-21) after reading the work with no Facets:
     with   who or what the work is made with or for
     made   how the Plate's own image was made
     cycle  the cycle it is about, or null when it is about none

   #proposed: the TAGGING below (which word each Plate gets) is ESAI's reading of each record and
   image, for Ethan to correct. Letter vs wide per Plate is also still a guess. */

export const VOCAB = {
  with: ['animals', 'plants & fungi', 'soil', 'a person', 'a community', 'designers'],
  made: ['drawn', 'built', 'coded', 'grown', 'gathered', 'written'],
  cycle: ['waste', 'water', 'energy', 'materials', 'access'],
};
export const FACETS = Object.keys(VOCAB);

const TOUR = '../../../images/tour/';

/* Records. href null = placeholder (no page yet, not clickable). drawings: the Record page's Drawings,
   in page order, for the turn (bb-loop is the one not yet on a Plate). */
export const RECORDS = {
  'uss-lead': { status: 'complete', href: '../../../projects/uss-lead-revival.html', drawings: ['a273-atlas', 'a273-board', 'a273-gable'].map((d) => TOUR + d + '.jpg') },
  'beavers-burden': { status: 'complete', href: '../../../projects/beavers-burden.html', drawings: ['bb-catamaraft', 'bb-crawling', 'bb-landscape', 'bb-standing', 'bb-loop'].map((d) => TOUR + d + '.jpg') },
  'mylo': { status: 'complete', href: '../../../projects/mylo-to-go.html', drawings: ['mylo-logo', 'mylo-picnic', 'mylo-poster'].map((d) => TOUR + d + '.jpg') },
  'three-little-pigs': { status: 'complete', href: '../project/three-little-pigs/', drawings: ['tlp-axon', 'tlp-section'].map((d) => TOUR + d + '.jpg') },
  'rap': { status: 'active', href: null },
  'instruments': { status: 'complete', href: null },
  'ratio': { status: 'active', href: null },
  'blind-tools': { status: 'active', href: null },
  'kingfisher': { status: 'active', href: null },
  'artd451': { status: 'active', href: null },
  'circuito': { status: 'complete', href: null },
};

/* #proposed tagging: [with, made, cycle]; size letter (1 cell) or wide (2 cells) */
const P = (id, record, size, f, more = {}) => ({ id, record, size, facets: { with: f[0], made: f[1], cycle: f[2] }, ...more });

export const PLATES = [
  /* USS Lead: a Superfund site remediated by plants, the dunes and swales holding water, an eco-lounge for the public */
  P('uss-atlas', 'uss-lead', 'letter', ['plants & fungi', 'gathered', 'waste'], { src: TOUR + 'a273-atlas.jpg' }),
  P('uss-board', 'uss-lead', 'wide', ['a community', 'drawn', 'water'], { src: TOUR + 'a273-board.jpg' }),
  P('uss-gable', 'uss-lead', 'letter', ['a community', 'built', 'water'], { src: TOUR + 'a273-gable.jpg' }),
  P('uss-model', 'uss-lead', 'letter', ['plants & fungi', 'built', 'waste'], { model: 'uss-lead-revival' }),
  /* Beaver's Burden: gizmos for beavers, the wetland they make, the sticks they carry */
  P('bb-catamaraft', 'beavers-burden', 'letter', ['animals', 'built', 'water'], { src: TOUR + 'bb-catamaraft.jpg' }),
  P('bb-crawling', 'beavers-burden', 'wide', ['animals', 'drawn', 'materials'], { src: TOUR + 'bb-crawling.jpg' }),
  P('bb-landscape', 'beavers-burden', 'letter', ['animals', 'drawn', 'water'], { src: TOUR + 'bb-landscape.jpg' }),
  P('bb-standing', 'beavers-burden', 'wide', ['animals', 'drawn', 'materials'], { src: TOUR + 'bb-standing.jpg' }),
  P('bb-model', 'beavers-burden', 'letter', ['animals', 'built', 'materials'], { model: 'beavers-burden' }),
  /* Mylo To-Go: mycelium packaging replacing plastic */
  P('mylo-logo', 'mylo', 'letter', ['plants & fungi', 'drawn', 'waste'], { src: TOUR + 'mylo-logo.jpg' }),
  P('mylo-picnic', 'mylo', 'wide', ['a community', 'gathered', 'waste'], { src: TOUR + 'mylo-picnic.jpg' }),
  P('mylo-poster', 'mylo', 'letter', ['plants & fungi', 'drawn', 'materials'], { src: TOUR + 'mylo-poster.jpg' }),
  P('mylo-model', 'mylo', 'letter', ['plants & fungi', 'grown', 'waste'], { model: 'mylo-to-go' }),
  /* Three Little Pigs: a straw-bale wall, its heat and its materials */
  P('tlp-axon', 'three-little-pigs', 'wide', ['plants & fungi', 'drawn', 'materials'], { src: TOUR + 'tlp-axon.jpg' }),
  P('tlp-section', 'three-little-pigs', 'letter', ['plants & fungi', 'drawn', 'energy'], { src: TOUR + 'tlp-section.jpg' }),
  P('tlp-model', 'three-little-pigs', 'letter', ['plants & fungi', 'built', 'materials'], { model: 'three-little-pigs' }),
  /* placeholders: plate to come */
  P('rap-1', 'rap', 'wide', ['a person', 'coded', 'access']),
  P('rap-2', 'rap', 'letter', ['a person', 'built', 'access']),
  P('rap-3', 'rap', 'letter', ['a person', 'built', 'access']),
  P('instruments-1', 'instruments', 'wide', ['designers', 'coded', null]),
  P('instruments-2', 'instruments', 'letter', ['designers', 'drawn', null]),
  P('ratio-1', 'ratio', 'wide', ['a community', 'coded', 'energy']),
  P('ratio-2', 'ratio', 'letter', ['a community', 'written', 'energy']),
  P('blind-tools-1', 'blind-tools', 'letter', ['a person', 'built', 'access']),
  P('blind-tools-2', 'blind-tools', 'letter', ['a person', 'built', 'access']),
  P('kingfisher-1', 'kingfisher', 'wide', ['a community', 'drawn', 'waste']),
  P('kingfisher-2', 'kingfisher', 'letter', ['soil', 'built', 'waste']),
  P('artd451-1', 'artd451', 'letter', ['designers', 'written', null]),
  P('circuito-1', 'circuito', 'wide', ['a community', 'built', 'energy']),
];
