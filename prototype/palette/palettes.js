/* PROTOTYPE (prototype/palette): site palettes, rev 2. Ethan, 2026-11-15: a version of family 1
   (sun prints) and family 2 (blue on warm ground), leaning 2; "Behaviour is much more powerful."
   Colours start from the precedent board (~/cs199/palette-precedents): grounds from Hokusai's Lake
   Suwa (#e6d2b1) and the Delft tile (#cdbe9a), ink from the Delft and Willow blues (#363c53, #32364f),
   deepened until the ink reads at 7:1. All placeholders: R6, the Palette is Ethan's own. */
(function (g) {
  const WARM = {   /* family 2, the shared day paper */
    light: { bg: '#ead8b6', alt: '#e1cca5', ink: '#1f3160', muted: '#4c566c', accent: '#b4521f', border: '#d6c29c' },
    dark:  { bg: '#1c2445', alt: '#232c52', ink: '#efe2c6', muted: '#b3b2bd', accent: '#d38c26', border: '#2e3862' },
  };
  g.ESA_PALETTES = [
    { key: 'a', name: 'Good tools', note: 'Today: black and white. The baseline.',
      light: { bg: '#ffffff', alt: '#ffffff', ink: '#111111', muted: '#5f6468', accent: '#6b52d6', border: '#e2e2e2' },
      dark:  { bg: '#0d0f11', alt: '#14171a', ink: '#e9ecee', muted: '#8a9196', accent: '#c47a5c', border: '#23272a' } },
    { key: 'b', name: 'Warm ground (family 2)', note: 'Prussian blue line on buff paper: Hokusai, Delft, Willow. Dark paper is the Willow plate turned over: cream on indigo.',
      ...WARM },
    { key: 'c', name: 'Cyanotype (family 1)', note: 'Atkins and the blueprint: light printed out of a blue field. Light paper is an overexposed print, pale blue with a Prussian line.',
      light: { bg: '#d3dfec', alt: '#c6d5e6', ink: '#0f2f66', muted: '#3c5070', accent: '#a65c17', border: '#b8c9dd' },
      dark:  { bg: '#0f387e', alt: '#134189', ink: '#eef3f8', muted: '#b9c8dc', accent: '#d08f2a', border: '#2a5194' } },
    { key: 'd', name: 'Daylight (behaviour)', behaviour: 'sun',
      note: 'The paper follows the sun over Champaign, where the work is made. Day is family 2, warmer as the sun drops; after sunset the page turns to a cyanotype, family 1. Like Solar Protocol, the light is real, not chosen.' },
    { key: 'e', name: 'Grid-aware (behaviour)', behaviour: 'grid', ...WARM,
      note: 'Family 2 paper, after Branch: the page sheds weight as the reader\'s grid burns more fossil fuel. Low: images as made. Moderate: line drawings reprinted in ink. High: every image in one blue. Simulated here; the real signal needs the Green Web Foundation toolkit.' },
  ];

  /* ---- the sun over Champaign (NOAA low-precision solar position, good to a fraction of a degree) ---- */
  const LAT = 40.1164, LON = -88.2434, R = Math.PI / 180;
  g.ESA_SUN_ALT = function (date) {
    const d = date.getTime() / 86400000 + 2440587.5 - 2451545.0;
    const gA = (357.529 + 0.98560028 * d) * R, q = 280.459 + 0.98564736 * d;
    const L = (q + 1.915 * Math.sin(gA) + 0.020 * Math.sin(2 * gA)) * R, e = (23.439 - 0.00000036 * d) * R;
    const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)), dec = Math.asin(Math.sin(e) * Math.sin(L));
    const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
    const ha = (gmst * 15 + LON) * R - ra;
    return Math.asin(Math.sin(LAT * R) * Math.sin(dec) + Math.cos(LAT * R) * Math.cos(dec) * Math.cos(ha)) / R;
  };
  const mix = (a, b, t) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
  const clamp = (x) => Math.max(0, Math.min(1, x));
  /* altitude in degrees → a paper. Day: low sun amber, high sun pale. Night: deeper as the sky darkens. */
  g.ESA_SUN_PAPER = function (alt) {
    if (alt >= -1) {
      const t = clamp(alt / 50);
      const bg = mix('#ddb987', '#f3ead4', t);
      return { theme: 'light', bg, alt: mix(bg, '#c9a46e', 0.18), ink: '#172650', muted: mix('#44465a', '#4c566c', t), accent: '#a2461a', border: mix(bg, '#a88a5a', 0.3) };
    }
    const t = clamp((-alt - 1) / 17);
    const bg = mix('#1f4277', '#0c2142', t);
    return { theme: 'dark', bg, alt: mix(bg, '#ffffff', 0.04), ink: '#f1e6cf', muted: '#b9c3d3', accent: '#e0a040', border: mix(bg, '#ffffff', 0.1) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
