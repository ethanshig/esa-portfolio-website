/* PROTOTYPE (index map #8, variants e and f: the index as a field of Plates). Throwaway data.

   #proposed — EVERYTHING in this file's Facet vocabulary and tagging is a draft for Ethan to
   replace: he chooses the real words. The tags were drafted from each Record's project.md
   frontmatter (themes, tools, skills, tracks) in New Portfolio, and for the real Plates from
   what the image actually shows. Letter vs 11x17 per Plate is also a guess (boards and wide
   drawings went 11x17; posters, logos and tall strips went letter).

   A Plate's three Facets: subject (what it is about), skill (how it was made),
   product (what kind of thing the Plate shows). One word each, from VOCAB. */

/* #proposed vocabulary, about 8 words per Facet */
export const VOCAB = {
  subject: ['land', 'animal', 'material', 'waste', 'food', 'blindness', 'energy', 'geometry', 'community'],
  skill: ['research', 'drafting', 'modelling', 'fabrication', 'photography', 'branding', 'analysis', 'code'],
  product: ['drawing', 'model', 'prototype', 'photograph', 'poster', 'identity', 'tool', 'document'],
};

const TOUR = '../../../images/tour/';

/* Records. href null = placeholder (no page yet, not clickable). */
export const RECORDS = {
  'uss-lead': { status: 'complete', href: '../../../projects/uss-lead-revival.html' },
  'beavers-burden': { status: 'complete', href: '../../../projects/beavers-burden.html' },
  'mylo': { status: 'complete', href: '../../../projects/mylo-to-go.html' },
  'three-little-pigs': { status: 'complete', href: '../project/three-little-pigs/' },
  'rap': { status: 'active', href: null },
  'instruments': { status: 'complete', href: null },
  'ratio': { status: 'active', href: null },
  'blind-tools': { status: 'active', href: null },
  'kingfisher': { status: 'active', href: null },
  'artd451': { status: 'active', href: null },
  'circuito': { status: 'complete', href: null },
};

/* #proposed tagging: [subject, skill, product]; size letter (1 cell) or wide (11x17, 2 cells) */
const P = (id, record, size, facets, more = {}) => ({ id, record, size, facets: { subject: facets[0], skill: facets[1], product: facets[2] }, ...more });

export const PLATES = [
  /* USS Lead: four modules, each about something different */
  P('uss-atlas', 'uss-lead', 'letter', ['land', 'research', 'drawing'], { src: TOUR + 'a273-atlas.jpg' }),
  P('uss-board', 'uss-lead', 'wide', ['geometry', 'modelling', 'drawing'], { src: TOUR + 'a273-board.jpg' }),
  P('uss-gable', 'uss-lead', 'letter', ['material', 'fabrication', 'model'], { src: TOUR + 'a273-gable.jpg' }),
  P('uss-model', 'uss-lead', 'letter', ['land', 'modelling', 'model'], { model: 'uss-lead-revival' }),
  /* Beaver's Burden */
  P('bb-catamaraft', 'beavers-burden', 'letter', ['animal', 'fabrication', 'prototype'], { src: TOUR + 'bb-catamaraft.jpg' }),
  P('bb-crawling', 'beavers-burden', 'wide', ['animal', 'drafting', 'drawing'], { src: TOUR + 'bb-crawling.jpg' }),
  P('bb-landscape', 'beavers-burden', 'letter', ['land', 'drafting', 'drawing'], { src: TOUR + 'bb-landscape.jpg' }),
  P('bb-standing', 'beavers-burden', 'wide', ['animal', 'drafting', 'drawing'], { src: TOUR + 'bb-standing.jpg' }),
  P('bb-model', 'beavers-burden', 'letter', ['animal', 'modelling', 'model'], { model: 'beavers-burden' }),
  /* Mylo To-Go */
  P('mylo-logo', 'mylo', 'letter', ['food', 'branding', 'identity'], { src: TOUR + 'mylo-logo.jpg' }),
  P('mylo-picnic', 'mylo', 'wide', ['food', 'photography', 'photograph'], { src: TOUR + 'mylo-picnic.jpg' }),
  P('mylo-poster', 'mylo', 'letter', ['material', 'branding', 'poster'], { src: TOUR + 'mylo-poster.jpg' }),
  P('mylo-model', 'mylo', 'letter', ['waste', 'modelling', 'model'], { model: 'mylo-to-go' }),
  /* Three Little Pigs */
  P('tlp-axon', 'three-little-pigs', 'wide', ['material', 'drafting', 'drawing'], { src: TOUR + 'tlp-axon.jpg' }),
  P('tlp-section', 'three-little-pigs', 'letter', ['material', 'analysis', 'drawing'], { src: TOUR + 'tlp-section.jpg' }),
  P('tlp-model', 'three-little-pigs', 'letter', ['material', 'modelling', 'model'], { model: 'three-little-pigs' }),
  /* placeholders: plate to come */
  P('rap-1', 'rap', 'wide', ['blindness', 'code', 'tool']),
  P('rap-2', 'rap', 'letter', ['blindness', 'fabrication', 'prototype']),
  P('rap-3', 'rap', 'letter', ['geometry', 'fabrication', 'model']),
  P('instruments-1', 'instruments', 'wide', ['geometry', 'code', 'document']),
  P('instruments-2', 'instruments', 'letter', ['geometry', 'drafting', 'drawing']),
  P('ratio-1', 'ratio', 'wide', ['energy', 'analysis', 'drawing']),
  P('ratio-2', 'ratio', 'letter', ['community', 'analysis', 'document']),
  P('blind-tools-1', 'blind-tools', 'letter', ['blindness', 'fabrication', 'tool']),
  P('blind-tools-2', 'blind-tools', 'letter', ['blindness', 'modelling', 'model']),
  P('kingfisher-1', 'kingfisher', 'wide', ['waste', 'branding', 'identity']),
  P('kingfisher-2', 'kingfisher', 'letter', ['waste', 'fabrication', 'prototype']),
  P('artd451-1', 'artd451', 'letter', ['community', 'fabrication', 'poster']),
  P('circuito-1', 'circuito', 'wide', ['energy', 'fabrication', 'drawing']),
];
