# Spec — the story layer

Settled by grilling, 2026-09-28 → 2026-10-10. Decisions live in `docs/adr/0003` and `0006`;
vocabulary in `CONTEXT.md`. This is what to build. Nothing here is a suggestion.

## The shape

`index.html` is a conventional portfolio grid. A project page is a conventional Document. The
storytelling is a layer over that Document, default on, that a reader meets only after clicking in.

## Page anatomy

A project page ships complete, in this order, every section present in the HTML:

| Part | Source | With story off | With story on |
|---|---|---|---|
| hero, title, meta | Record `title`, `dates`, `role`, `context` | as now | unchanged |
| `The story` … `Reflection` | Record prose | as now | unchanged |
| `Drawings` | `world.json` media + alt | as now | unchanged |
| **Narration** | Scene `meet` / `with` | hidden (CSS) | one line at the foot, keyed to the section in view |
| **Questions** | Scene `choices[].ask` + answer from Records | visible as a Q&A list | inline beside their section, behind one "Ask Ethan" |

**Questions are blocked, not forgotten.** `ask` choices carry no authored answer anywhere in
`world.json` — the tour generates them at runtime — so "answer shipped in the HTML" is not
buildable as written. The scene's cited facts only partly stand in: "Why a figure eight?" is
answered by the lemniscate fact, but "Who taught the class?" has no answer in the facts at all, and
a question whose adjacent text does not answer it is worse than no question. Unblocked when Ethan
writes answers.
| **Crossings** | Scene `choices[].go` + label | the destination's title, under a "Related work" heading | the authored narrative labels |

The Document never moves, reflows or rearranges when the layer is on. Narration accrues beside it.

## The scraper contract — non-negotiable

1. Every word a reader can ever see is in the HTML at request time. **JavaScript adds no text.**
2. Narration and Questions are hidden with CSS only, never injected, never `display:none` applied
   by script before paint.
3. A Crossing is one `<a href>` carrying **both** labels; CSS picks which renders. **`data-story`
   and `data-arrival` are baked onto `<html>` by the generator**, or CSS has nothing to key on and a
   no-JS reader sees both labels at once.
4. Each page carries JSON-LD `CreativeWork`: title, description, dates, creator, institution,
   `about` (tracks), and each Drawing as `ImageObject` with its alt text.
5. Consequence, free: a Record with no Narration renders exactly the story-off page. Unwritten
   prose needs no special case.

## Arrival

- **Cold arrival** (search result, shared link, the grid) → play `meet`, which introduces Ethan.
- **By Crossing** → play the origin Place's `travel` lines, then `with`.
- Narration may **never** name a specific previous project. Any page can be entered cold.

## Crossings

Eleven authored Crossings, every Record reachable. They sit at the foot, after `Drawings` — the end
of the Document is the end of the Scene.

## The story control

Nav, persistent, default on, state in `localStorage`. `?story=off` renders the plain version for sharing and
overrides the stored preference for that load; `?story=on` does the inverse, so a shared link can
force either state. `prefers-reduced-motion` does **not**
disable it. The control is the only hint the site gives that a story exists: no banner, no hover
lure, no visited markers on the grid.

## Route and transcript

The Session holds the Route — Crossings taken, in order, by label — plus Narration read and Drawings
shown, in `sessionStorage` as today. `transcript.html` renders it and is linked only once a Route
exists. The grid never shows it back.

## Build — one generator

`build-project-pages.js` becomes the single page builder, reading `api/adventure/portfolio.public.json`
and `adventure/content/world.json` together and emitting Document + Narration + Questions + Crossings
+ JSON-LD. **`build-tour.js` is retired**, along with `adventure/tour.template.html` as a page
template. Two scripts emitting halves of one page is how the two registers drift.

## URLs

| URL | Was | Becomes |
|---|---|---|
| `index.html` | the tour | the grid (content of `home.html`) |
| `home.html` | the grid | removed once `index.html` carries it |
| `adventure.html` | a second tour page | redirect to `index.html` |
| `projects.html` | card index | unchanged |
| `projects/<id>.html` | Document | Document + layer |
| `transcript.html` | the reader's story | unchanged, linked only with a Route |

Ten files link to `index.html`; none need editing, because the address stays and its meaning
changes. Only `adventure.html` links need review.

## Writing gaps — do not block on these

| Record | Missing |
|---|---|
| `mylo-to-go` | all Narration |
| `genealogy-of-a-beaver-dam` | all Narration |
| `uss-lead-revival` | `reflection` |
| `three-little-pigs` | `outcome` |

Ethan writes these. Per his standing ruling the assistant does not draft Record prose or reflections.

## Verification

- `curl` a project page with no JS: every section, all Narration, both Crossing labels, the JSON-LD.
- Chromium: story on and off; keyboard through Questions and Crossings; screen-reader order.
- Cold arrival plays `meet`; arrival by Crossing plays `travel` then `with`.
- `?story=off` overrides a stored on-preference; the preference survives a reload, the Route does not.
- Grid shows no visited state in any condition.
