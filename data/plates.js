/* ===================================================================
   PLATES — what the index shows (issue #17, "the index as a sheet of Plates").

   Seeded by hand from prototype/grid/index-sheet/plates-data.js: the same
   Facets, the same 29 Plates with the same tags, the same Records, the same
   drawings lists and the same placeholders. Ethan corrects the tags; the
   build never rewrites them. A later `portfolio.ts compile` step, reading an
   optional `plates:` list in each Record's project.md frontmatter, should
   emit a file of exactly this shape next to portfolio-data.js and replace
   this one. Until then this file is the source.

   Read by scripts/build-index.js (bun, at build time: the no-JS index,
   JSON-LD and growth order are written into index.html) and by
   js/index-sheet/index-sheet.js (the browser, to lay out the sheet). Both
   run the same growth (js/index-sheet/growth.js), so the HTML order and the
   sheet agree.

   Format
   ------
   VOCAB    { with: string[], made: string[], cycle: string[] }
            The three Facets' words (#14, Ethan's). `cycle` may also be null
            on a Plate, meaning "or none"; null never matches anything.

   RECORDS  { [recordId]: Record }, where a Record is
              title     string    the Plate title the reader sees (verbatim)
              meta      string    the line after the title (verbatim)
              status    'complete' | 'active'   active Records get the dotted outline
              href      string | null   the Record's page, relative to the site root;
                                        null = a placeholder piece (opens nothing)
              dates     { start: 'YYYY-MM', end?: 'YYYY-MM' } | null
                                        from api/adventure/portfolio.public.json;
                                        the seed tie-break's "more recent Record"
              drawings  string[]  the Record page's Drawings, in page order
                                        (image paths from the site root); feeds the
                                        hover turn. [] for placeholders.

   PLATES   Plate[], in authoring order (the growth breaks exact ties by it):
              id        string    unique
              record    string    a key of RECORDS
              size      's' | 'm' | 'l' | 'xl' (or the old 'cell' = s, 'wide' = m)   a size hint, not a shape. The shape (m x n
                                        16-step modules) is computed by
                                        scripts/build-index.js into data/plate-shapes.js:
                                        a drawing's from its image's aspect, aiming at
                                        about 4 modules for 'cell' and 8 for 'wide'
                                        (js/index-sheet/shape.js); a model or a
                                        placeholder from its hint (shapeForHint); a placeholder
                                        may be one module thin: 1 x 1 for s, 2 x 1 for m.
              drawing   string    an image path from the site root      } exactly one of
              model     string    a GLB id: models/<id>.glb             } these two;
                                                                         } neither = placeholder
              facets    { with: string, made: string, cycle: string | null }
              alt       string | null   model Plates only, optional: the model's
                                        description for the no-JS index's <img alt>.
                                        Ethan's words; none are written yet, so the
                                        img ships alt="" beside the Plate's title.

   A Plate of a Record with an href must have a drawing or a model; a Plate
   of a Record without one must have neither. scripts/build-index.js
   validates all of this and fails loudly.
   =================================================================== */

export const VOCAB = {
  with: ['animals', 'plants & fungi', 'soil', 'a person', 'a community', 'designers'],
  made: ['drawn', 'built', 'coded', 'grown', 'gathered', 'written'],
  cycle: ['waste', 'water', 'energy', 'materials', 'access'],
};

const TOUR = 'images/tour/';

export const RECORDS = {
  'uss-lead-revival': {
    title: 'USS Lead', meta: 'ARCH 273 · 2025', status: 'complete', href: 'projects/uss-lead-revival.html',
    dates: { start: '2025-08', end: '2025-12' },
    drawings: ['a273-atlas', 'a273-board', 'a273-gable'].map((d) => TOUR + d + '.jpg'),
  },
  'beavers-burden': {
    title: 'Beaver’s Burden', meta: 'ARCH 172 · 2025', status: 'complete', href: 'projects/beavers-burden.html',
    dates: { start: '2025-01', end: '2025-05' },
    drawings: ['bb-catamaraft', 'bb-crawling', 'bb-landscape', 'bb-standing', 'bb-loop'].map((d) => TOUR + d + '.jpg'),
  },
  'mylo-to-go': {
    title: 'Mylo To-Go', meta: 'ARTD 326 · 2025', status: 'complete', href: 'projects/mylo-to-go.html',
    dates: { start: '2025-01', end: '2025-05' },
    drawings: ['mylo-logo', 'mylo-picnic', 'mylo-poster'].map((d) => TOUR + d + '.jpg'),
  },
  'three-little-pigs': {
    title: '3 Little Pigs Wall Assembly', meta: 'FAA 330 · 2025', status: 'complete', href: 'projects/three-little-pigs.html',
    dates: { start: '2025-01', end: '2025-03' },
    drawings: ['tlp-axon', 'tlp-section'].map((d) => TOUR + d + '.jpg'),
  },
  'rap': { title: 'Radical Accessibility Project', meta: 'plate to come', status: 'active', href: null, dates: null, drawings: [] },
  'instruments': { title: 'Drawing Instruments', meta: 'plate to come', status: 'complete', href: null, dates: null, drawings: [] },
  'ratio': { title: 'RATIO', meta: 'plate to come', status: 'active', href: null, dates: null, drawings: [] },
  'blind-tools': { title: 'Tools for a Blind Architecture Student', meta: 'plate to come', status: 'active', href: null, dates: null, drawings: [] },
  'kingfisher': { title: 'Kingfisher Composting', meta: 'plate to come', status: 'active', href: null, dates: null, drawings: [] },
  'artd451': { title: 'ArtD 451', meta: 'plate to come', status: 'active', href: null, dates: null, drawings: [] },
  'circuito': { title: 'Mi Circuito Solar', meta: 'plate to come', status: 'complete', href: null, dates: null, drawings: [] },
};

/* [with, made, cycle] */
const P = (id, record, size, f, art = {}) => ({ id, record, size, ...art, facets: { with: f[0], made: f[1], cycle: f[2] } });

export const PLATES = [
  /* sizes: Ethan's, from his markup on the prototype (2026-11-15); tlp-section is off the index */
  /* USS Lead */
  P('uss-atlas', 'uss-lead-revival', 'xl', ['plants & fungi', 'gathered', 'waste'], { drawing: TOUR + 'a273-atlas.jpg' }),
  P('uss-board', 'uss-lead-revival', 'm', ['a community', 'drawn', 'water'], { drawing: TOUR + 'a273-board.jpg' }),
  /* shape: Ethan wants the gable 3x2 like the other landscape drawings (2026-10-27); the rule alone gives 2x2 */
  P('uss-gable', 'uss-lead-revival', 'cell', ['a community', 'built', 'water'], { drawing: TOUR + 'a273-gable.jpg', shape: [3, 2] }),
  P('uss-model', 'uss-lead-revival', 's', ['plants & fungi', 'built', 'waste'], { model: 'uss-lead-revival' }),
  /* Beaver's Burden */
  P('bb-catamaraft', 'beavers-burden', 'm', ['animals', 'built', 'water'], { drawing: TOUR + 'bb-catamaraft.jpg' }),
  P('bb-crawling', 'beavers-burden', 's', ['animals', 'drawn', 'materials'], { drawing: TOUR + 'bb-crawling.jpg' }),
  P('bb-landscape', 'beavers-burden', 'xl', ['animals', 'drawn', 'water'], { drawing: TOUR + 'bb-landscape.jpg' }),
  P('bb-standing', 'beavers-burden', 's', ['animals', 'drawn', 'materials'], { drawing: TOUR + 'bb-standing.jpg' }),
  P('bb-model', 'beavers-burden', 'm', ['animals', 'built', 'materials'], { model: 'beavers-burden' }),
  /* Mylo To-Go */
  P('mylo-logo', 'mylo-to-go', 's', ['plants & fungi', 'drawn', 'waste'], { drawing: TOUR + 'mylo-logo.jpg' }),
  P('mylo-picnic', 'mylo-to-go', 'm', ['a community', 'gathered', 'waste'], { drawing: TOUR + 'mylo-picnic.jpg' }),
  P('mylo-poster', 'mylo-to-go', 'l', ['plants & fungi', 'drawn', 'materials'], { drawing: TOUR + 'mylo-poster.jpg' }),
  P('mylo-model', 'mylo-to-go', 's', ['plants & fungi', 'grown', 'waste'], { model: 'mylo-to-go' }),
  /* 3 Little Pigs */
  P('tlp-axon', 'three-little-pigs', 's', ['plants & fungi', 'drawn', 'materials'], { drawing: TOUR + 'tlp-axon.jpg' }),
  P('tlp-model', 'three-little-pigs', 's', ['plants & fungi', 'built', 'materials'], { model: 'three-little-pigs' }),
  /* placeholders: pieces on the index whose Plates are not made yet */
  P('rap-1', 'rap', 'wide', ['a person', 'coded', 'access']),
  P('rap-2', 'rap', 'cell', ['a person', 'built', 'access']),
  P('rap-3', 'rap', 'cell', ['a person', 'built', 'access']),
  P('instruments-1', 'instruments', 'wide', ['designers', 'coded', null]),
  P('instruments-2', 'instruments', 'cell', ['designers', 'drawn', null]),
  P('ratio-1', 'ratio', 'wide', ['a community', 'coded', 'energy']),
  P('ratio-2', 'ratio', 'cell', ['a community', 'written', 'energy']),
  P('blind-tools-1', 'blind-tools', 'cell', ['a person', 'built', 'access']),
  P('blind-tools-2', 'blind-tools', 'cell', ['a person', 'built', 'access']),
  P('kingfisher-1', 'kingfisher', 'wide', ['a community', 'drawn', 'waste']),
  P('kingfisher-2', 'kingfisher', 'cell', ['soil', 'built', 'waste']),
  P('artd451-1', 'artd451', 'cell', ['designers', 'written', null]),
  P('circuito-1', 'circuito', 'wide', ['a community', 'built', 'energy']),
];
