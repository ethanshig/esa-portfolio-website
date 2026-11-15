/* PROTOTYPE (prototype/palette): five site palettes, each a light and a dark paper.
   Every colour here is a placeholder: R6 says the Palette is Ethan's own, trained on record sleeves,
   and it does not exist until YIELD.md says so. */
(function (g) {
  g.ESA_PALETTES = [
    { key: 'a', name: 'Good tools', note: 'Today: black and white. The baseline.',
      light: { bg: '#ffffff', alt: '#ffffff', ink: '#111111', muted: '#5f6468', accent: '#6b52d6', border: '#e2e2e2' },
      dark:  { bg: '#0d0f11', alt: '#14171a', ink: '#e9ecee', muted: '#8a9196', accent: '#c47a5c', border: '#23272a' } },
    { key: 'b', name: 'Diazo / Cyanotype', note: 'The Yield precedent: warm paper, blue line. Dark is a cyanotype, a print made by the sun.',
      light: { bg: '#f2ebdc', alt: '#e9e0cc', ink: '#1e3a6e', muted: '#4e5c74', accent: '#b4501e', border: '#d9cfb8' },
      dark:  { bg: '#13294b', alt: '#183258', ink: '#f2ebdc', muted: '#aab6c8', accent: '#d38c26', border: '#24406a' } },
    { key: 'c', name: 'Kraft', note: 'Unbleached recycled board and soy ink (the Jack Johnson sleeve); a cobalt stamp for colour.',
      light: { bg: '#e0d1b0', alt: '#d6c5a0', ink: '#2a2118', muted: '#5a4c36', accent: '#1f56a0', border: '#c9b791' },
      dark:  { bg: '#2a241c', alt: '#332c22', ink: '#e8dcc0', muted: '#ad9f84', accent: '#5b8fd0', border: '#433a2d' } },
    { key: 'd', name: 'Moss', note: 'Lichen grey-green and spruce; amber for what grows. Green ink, so colour never leans on red.',
      light: { bg: '#e5e8dc', alt: '#dadfcf', ink: '#1c3628', muted: '#4b5a4f', accent: '#9a5800', border: '#c8cfbc' },
      dark:  { bg: '#0f1f17', alt: '#15281e', ink: '#e5e8dc', muted: '#9fae9f', accent: '#d08c1c', border: '#22382b' } },
    { key: 'e', name: 'Solar', note: 'Sun-bleached butter and indigo, after the solar-powered Low-tech Magazine; vermilion for colour.',
      light: { bg: '#f6eec9', alt: '#eee3b6', ink: '#2a2b6c', muted: '#55557a', accent: '#c23b17', border: '#e0d49f' },
      dark:  { bg: '#191a3f', alt: '#202250', ink: '#f6eec9', muted: '#b4b2c8', accent: '#ff8a5c', border: '#2e3062' } },
  ];
})(typeof window !== 'undefined' ? window : globalThis);
