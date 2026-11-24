# esa Portfolio

The portfolio at ethanshig.design reads as a conventional project site: a grid of work, and a page
per project. The storytelling is a layer a reader finds *inside* a project, never at the front door.
This glossary fixes the language that describes it.

## The work

**Record**:
An approved, compiled fact-set about one of Ethan's projects. Records are the only things the
narrator may assert about his work; they are generated, never authored by hand in the site.
_Avoid_: fact (the data key), project (fine in speech, Record in the model), claim, content

**Drawing**:
An image a reader was actually shown, carrying its label, project, date and alt text.
_Avoid_: image, media, asset, picture

**Scene**:
The Narration belonging to one Record — its `meet` and `with` lines, and the questions a reader may
ask there. Each Scene is about exactly one Record.
_Avoid_: page, step, screen, chapter

**Place**:
One of the four real locations the work was made in. A Place's `truth` — the factual description of
the location — survives as a project's sense of *where*; its `travel` lines narrate a Crossing out
of it. Its `openings` are retired, since a reader now enters by picking a project.
_Avoid_: setting (the data key), location, destination, portal

**Interest**:
A theme a reader has signalled attention to by the questions they asked. It steers Narration only,
and never the Document, the grid or the Crossings offered.
_Avoid_: tag, topic, preference

## The page

**Sheet**:
A project's page on the website: the dot paper with the work's Drawings laid flat on it, and its
model standing in dimetric beside them when it has one (ADR-0007). Only the story panel at the foot
scrolls. If the work is 3D it renders 3D; if it is 2D it renders 2D. Sheets are generated, like
everything else drawn from a Record. A page of a PDF portfolio is never a Sheet: those are pages.
_Avoid_: canvas (fine in speech), page (too general), layout, Document (that is the panel), sheet for a PDF page

**Move**:
A named, ordered group of a piece's Drawings, such as "The cycle" or "Loading". On a Sheet each
Move carries a quiet label on the paper above its Drawings.
_Avoid_: group (fine in speech), section (the Document has those), spread, page

**Document**:
The project's prose in a fixed order — hero, meta, `The story`, `What I did`, `Process`, `Outcome`,
`Reflection`, `Drawings`. It is written from Record prose and ships whole in the HTML. It is no
longer the page: it is the story-off panel on the Sheet and the no-WebGL fallback (ADR-0007). The
scrolling Document pages that `scripts/build-project-pages.js` still generates are the old shape.
_Avoid_: page (too general), article, detail view, case study

**Narration**:
The second-person register of the same work — the `meet` and `with` lines. It is a layer over the
Document, held on one line at the foot and keyed to the section a reader has reached. It speaks to
the reader, who writes the story by choosing among the work; Ethan is a character in that story,
never its speaker. In the Sky, Narration opens the story with a text prompt.
_Avoid_: story (the Record field is named that), copy, voiceover, text, guide

**Plate**:
One tile on the index: a square cell, or two cells wide, showing one of a Record's Drawings or its
model, cropped to fit. A Record shows on the index as one or more Plates — more for more extensive
work — and every Plate opens that Record's page. A Plate whose art is not made yet stands in as a
dashed placeholder that opens nothing.
_Avoid_: artifact (Ethan's "records are artifacts" means a Record is never rewritten), tile, card, thumbnail

**Facet**:
One of three short, shared vocabularies a Plate is tagged with, which decide which Plates lie next
to each other on the index: **with** (who or what the work is made with or for: animals, plants &
fungi, soil, a person, a community, designers), **made** (how the Plate's image was made: drawn,
built, coded, grown, gathered, written) and **cycle** (the cycle it is about: waste, water, energy,
materials, access, or none). Facets belong to the Plate, not the Record: one project's Plates can
show different things made in different ways, so they spread. They are not shown to the reader;
the reader sees only which Plates sit together.
_Avoid_: tag, theme (themes are free words per Record), category

**Audience**:
A known reader the site recognises, by the link it was given (`?for=mit`) or by its network, and
frames the index for: the arrival lands on that reader's pieces, and one line names them in order.
It may frame the index's arrival, but it never changes a Sheet or the Document. It is the one
signal allowed to touch the index, unlike an Interest. One Audience so far: the MIT Media Lab.
_Avoid_: visitor, user, segment, persona, target

**Crossing**:
An authored link from one Record's page to another Record, or to an Idea, carrying a narrative label
("Follow the water east to poisoned ground") and a plain one (the destination's title). Both ship
in the HTML; which one shows is a CSS decision. "Related work" is the heading over the set, never
a label on a link — three links all reading "Related work" tell a reader nothing and a crawler less.
_Avoid_: link, next, related, path, bridge, constellation line (in the Sky a line between Stars is a
Crossing)

**Route**:
The Crossings a reader has taken, in order. The reader builds it by choosing; it is never shown
back to them as a score, and the landing grid never marks where they have been.
_Avoid_: progress, history, completion, trail

**Cold arrival**:
Reaching a project page directly — from a search result, a shared link, the grid. It plays `meet`,
which introduces Ethan. Arriving by a Crossing instead plays the origin Place's `travel` lines and
then `with`. Because any page may be entered cold, **Narration may never name a specific previous
project.**
_Avoid_: direct entry, deep link, landing

**Session**:
One reader's unbroken visit in one tab, holding the Route they took, the Narration they read and
the Drawings they were shown. A new visit starts cold. The *preference* for story on or off is not
part of this — it persists, because it is something a reader asked for rather than something they
did.
_Avoid_: save, profile, progress, run

## The sky (proposed front door, not yet adopted)

**Sky**:
A proposed front door: the Records as Stars, with the Crossings between them drawn as lines. Every
cold arrival starts in the Sky with nothing selected, and Narration opens the story. The Sky is
laid out as one Light cone. A reader
flies a line by taking its Crossing. Whether the Sky replaces the index is still open; ADR-0006's
conventional front door stands until it does.
_Avoid_: map, universe (fine in Narration), galaxy, star chart (fine in speech)

**Star**:
A Record as it appears in the Sky. Entering a Star lands the reader on that Record's Sheet: "system"
is fine in speech for a Star once entered, but it is never a second name for a Record or a page
between the Sky and the Sheet. Nothing is drawn orbiting a Star. Asked about, a Star gives its entry:
the Record's title and one plain line, which is also the way through the Sky by keyboard and screen
reader.
_Avoid_: node, planet, system (as a term), dot

**Light cone**:
The shape of the whole Sky: all of Ethan's work in one double cone whose height is time and whose
breadth is space, with its tip at the present. The past cone holds every Star at its date; the
future cone holds Ideas. Seen from inside, at the tip, it is a night sky where farther means older,
as with starlight; seen from outside, it is the cone itself, and a reader may switch between the
two. There is one Light cone, never one per Star.
_Avoid_: timeline, history, cone (fine in speech)

**Idea**:
Work Ethan hasn't made yet, which appears only in the future cone and never looks like a Star. It is
approved and compiled the same way a Record is. An Idea may be shown, but it is never passed off as
finished work.
_Avoid_: project, plan, future work, seed
