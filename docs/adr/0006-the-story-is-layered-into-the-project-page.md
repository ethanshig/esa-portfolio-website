# The story is layered into the project page

The site reads as a conventional portfolio: a grid of projects, and project pages with a hero,
sections and a gallery. The storytelling is a **layer over that document**, arriving only once a
reader opens a project. It supersedes ADR-0005.

## Why this shape

Every earlier attempt put the story at the front door and asked a reader to accept it before
seeing any work — a guided tour, a projected map, a territory, a walkable world. This inverts it.
The conventional page is the thing that loads; the story is what a reader finds inside it.

The two registers already existed. Record prose (`story`, `whatIDid`, `process`, `outcome`,
`reflection`) is documentary and first person. Tour narration (`meet`, `with`) is second person —
*"The figure wades out and offers you a wet hand. 'Ethan.'"* They are the same work in two voices,
authored separately and on purpose, which is what makes layering them honest rather than a trick.

## Decisions

**Layered, scroll-keyed, narration on one line at the foot.** The Document never moves or
rearranges; Narration accrues beside it as a reader passes each section. Dwell-triggered text is
rejected — prose that starts talking because someone paused gets switched off.

**Opt-out, not opt-in.** A persistent control in the nav, default on, remembered in
`localStorage`, plus `?story=off` for sharing the plain version. A *preference* is categorically
different from a *completion record*: ADR-0003 says the site does not remember what a reader has
seen, not that it ignores what they asked for. `prefers-reduced-motion` must not disable it — the
story is not motion.

**The scraper contract is the architecture.** Everything ships in the HTML at request time,
including the Narration. **JavaScript adds no text that is not already in the DOM.** Narration is
hidden by CSS, never injected; crossings carry both their labels; each page carries JSON-LD
`CreativeWork`. One mechanism serves a crawler with scripting off, a screen reader, and a reader
who turned the story off — and it means an unwritten Narration degrades to the conventional page
for free.

**The reader is still building.** Their entry is the project they pick, not a landing page, and
they move on through authored Crossings — eleven of them, every Record reachable, labels already
written (*"Follow the water east to poisoned ground"*). The transcript survives and records the
path by those labels.

**`meet` and `with` already encode cold arrival versus continuing.** A reader landing from a search
result gets `meet`, which introduces Ethan. A reader who followed a Crossing gets the origin
Place's `travel` lines and then `with`. The consequence, accepted: **Narration may never name a
specific previous project**, only that the reader came from somewhere — because a shared link has
to work.

**The front door gives nothing away.** No hint copy, no hover lure, no visited markers on the grid.
The only tell is the story control in the nav: a curious reader reads it, a recruiter scanning for a
résumé never notices it. Marking visited projects would turn the front door into a progress board
in the first second.

**One generator.** `build-tour.js` folds into `build-project-pages.js` and is retired. The whole
design rests on the two registers staying in sync on one page; two scripts emitting halves of it is
exactly how they drift.

## Consequences

`home.html`'s grid becomes `index.html`, so the ten files linking to `index.html` need no change —
the address stops being the tour and starts being the portfolio. `adventure.html` redirects.
`projects.html` stays as the full card index. The Places' `truth` survives as a project's sense of
where; `openings` are retired, since the project click is now the entry.

Two Records have no Narration (`mylo-to-go`, `genealogy-of-a-beaver-dam`), `uss-lead-revival` has
no `reflection`, `three-little-pigs` no `outcome`. None of this blocks the build: those pages are
simply quiet, which is the same output the opt-out path already renders. Ethan writes them; per his
standing ruling, the assistant does not draft them.

## Amendment — the narrator's replies (2026-10-10)

The scraper contract governs what the page says on its own: the Document and the Narration. A
reply from the narrator is an answer to something a reader typed, so it is not page text and the
contract does not cover it. JavaScript may write those replies. The page must still read whole
without them, and the ask field ships hidden for JS to reveal, so a reader without scripting never
sees a field that cannot answer. The narrator takes the place of the authored Questions, which are
retired.
