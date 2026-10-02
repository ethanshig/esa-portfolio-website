# The Territory is generated from tracks, not drawn

The Map is an invented Territory whose geography is the track structure: each track is a Land,
a Record sits in the Borderland where its tracks overlap, and a Land's extent is how many
Records it holds. Real geography is gone (ADR-0002), and so is any hand-drawn armature.

## Considered Options

**Geography** was tried and refuted — see ADR-0002.

**Themes** cannot organise anything: 26 themes across 6 Records, each appearing exactly once.
`tracks` is the only axis in the data with structure.

**Paths as shared track** were ruled out by measurement rather than taste. Joining every pair
of Records that share a track gives 13 of 15 possible edges — 87% dense — because `ecology`
touches five of six works. It is a scribble at six Records and worse at twenty. The Route a
reader leaves behind them is therefore the only path structure on the Map.

## Consequences

**Amended (ADR-0005): author the vocabulary, generate the world.** "Nothing may be hand-placed"
binds *placement*, not *appearance*. There are five tracks and they change about once a year;
there will be sixty Records. So the Biome for a track — its ground, growth and water — is
authored once, by hand, per track; the terrain laid down from that vocabulary is generated and
never placed.

**Nothing may be hand-placed.** Ethan will keep adding work, so anchors, Borderland positions
and Land extents are all computed from track membership and the world redraws on every
addition. This is why the Territory cannot be an illustration, however much nicer one would
look, and why the layout must survive N tracks rather than exactly five.

**The Territory is measured and scaled to fit one screen.** No pan, no zoom: at six Records a
viewport was never needed, and growth is absorbed by the fit rather than by navigation.

**Extent, not opacity, carries weight.** `accessibility` and `computational` hold one Record
between them — the same one — and are drawn as the frontier they are. This keeps ADR-0001's
no-dimming rule intact while still letting the Map say something true about where the work sits.

**A Record is not a Place.** Place stays reserved for the four real locations the tour visits.
The Territory has Lands, Borderlands and Records; a Record's Place is a fact it tells a reader
on arrival, not a map unit.
