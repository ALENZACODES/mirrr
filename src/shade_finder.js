/**
 * MIRRR Shade Finder
 *
 * 60-shade spectrum covering every human skin tone — from the palest fair
 * to the deepest rich-dark, with all undertone variants (warm, cool, neutral,
 * olive, golden, ash, pink, peach, red, blue-black). Mixed-race and multi-heritage
 * profiles included. No one left out.
 *
 * Most beauty apps have 6-10 shades. MIRRR has 60.
 */

// ---------------------------------------------------------------------------
// Shade spectrum — 60 shades across the full human range
// ---------------------------------------------------------------------------

export const SHADE_SPECTRUM = [

  // ── FAIR (depth 1-6) ──────────────────────────────────────────────────────
  {
    id: 'F01', name: 'Porcelain', hex: '#FAF0E8',
    depth: 1, tier: 'fair',
    undertones: ['cool', 'pink'],
    description: 'Palest cool-pink fair — Northern European, Scandinavian, East Asian light.',
  },
  {
    id: 'F02', name: 'Pearl',     hex: '#F7EBE0',
    depth: 2, tier: 'fair',
    undertones: ['neutral', 'cool'],
    description: 'Neutral fair with a hint of coolness.',
  },
  {
    id: 'F03', name: 'Ivory',     hex: '#F5E4D5',
    depth: 3, tier: 'fair',
    undertones: ['warm', 'neutral'],
    description: 'Classic warm-neutral ivory — Western European, light East Asian.',
  },
  {
    id: 'F04', name: 'Alabaster', hex: '#F2DDC9',
    depth: 4, tier: 'fair',
    undertones: ['cool', 'pink'],
    description: 'Pinky-fair — rosacea-prone, Irish, Scottish, light Slavic.',
  },
  {
    id: 'F05', name: 'Snow',      hex: '#EFDA C4',
    depth: 5, tier: 'fair',
    undertones: ['neutral', 'warm'],
    description: 'Neutral warm fair.',
  },
  {
    id: 'F06', name: 'Lace',      hex: '#EDD4BC',
    depth: 6, tier: 'fair',
    undertones: ['warm', 'peach'],
    description: 'Peachy-warm fair — Southern European fair, light mixed-heritage.',
  },

  // ── LIGHT (depth 7-13) ────────────────────────────────────────────────────
  {
    id: 'L07', name: 'Vanilla',   hex: '#E9CCAF',
    depth: 7, tier: 'light',
    undertones: ['warm', 'neutral'],
    description: 'Warm creamy light — South European, light South Asian, light Latina.',
  },
  {
    id: 'L08', name: 'Sand',      hex: '#E5C6A6',
    depth: 8, tier: 'light',
    undertones: ['warm', 'golden'],
    description: 'Golden-warm light — Mediterranean, light Arab, light East Asian.',
  },
  {
    id: 'L09', name: 'Dune',      hex: '#E2BF9C',
    depth: 9, tier: 'light',
    undertones: ['warm', 'olive'],
    description: 'Olive-warm light — Italian, Greek, light Levantine, light Latina.',
  },
  {
    id: 'L10', name: 'Bisque',    hex: '#DEB892',
    depth: 10, tier: 'light',
    undertones: ['warm', 'neutral'],
    description: 'Warm neutral light — diverse mixed-heritage, South Asian fair.',
  },
  {
    id: 'L11', name: 'Shell',     hex: '#DAB18A',
    depth: 11, tier: 'light',
    undertones: ['cool', 'pink'],
    description: 'Pink-toned light — light-skinned Black, Filipina, some East Asian.',
  },
  {
    id: 'L12', name: 'Linen',     hex: '#D6AA81',
    depth: 12, tier: 'light',
    undertones: ['warm', 'olive'],
    description: 'Olive-light — Southeast Asian, light North African, light Arab.',
  },
  {
    id: 'L13', name: 'Buff',      hex: '#D2A378',
    depth: 13, tier: 'light',
    undertones: ['neutral', 'golden'],
    description: 'Neutral-golden light — diverse light-medium complexions.',
  },

  // ── LIGHT-MEDIUM (depth 14-20) ────────────────────────────────────────────
  {
    id: 'LM14', name: 'Honey',     hex: '#CC9A6E',
    depth: 14, tier: 'light-medium',
    undertones: ['warm', 'golden'],
    description: 'Warm golden — Filipino, South Asian medium-fair, light Latina, light Arab.',
  },
  {
    id: 'LM15', name: 'Caramel',   hex: '#C89265',
    depth: 15, tier: 'light-medium',
    undertones: ['warm', 'neutral'],
    description: 'Classic caramel — mixed-heritage Black, medium Latina, medium South Asian.',
  },
  {
    id: 'LM16', name: 'Tan',       hex: '#C38B5C',
    depth: 16, tier: 'light-medium',
    undertones: ['warm', 'olive'],
    description: 'Warm olive tan — South Asian, North African, Latina, Southeast Asian.',
  },
  {
    id: 'LM17', name: 'Wheat',     hex: '#BF8453',
    depth: 17, tier: 'light-medium',
    undertones: ['warm', 'neutral'],
    description: 'Warm neutral wheat — diverse South Asian, Latina, Middle Eastern.',
  },
  {
    id: 'LM18', name: 'Almond',    hex: '#BA7D4A',
    depth: 18, tier: 'light-medium',
    undertones: ['warm', 'golden'],
    description: 'Golden almond — medium-toned South Asian, Latina, mixed Black.',
  },
  {
    id: 'LM19', name: 'Praline',   hex: '#B57641',
    depth: 19, tier: 'light-medium',
    undertones: ['warm', 'neutral'],
    description: 'Warm praline — diverse medium complexions.',
  },
  {
    id: 'LM20', name: 'Fawn',      hex: '#B07038',
    depth: 20, tier: 'light-medium',
    undertones: ['warm', 'red'],
    description: 'Red-warm medium — Caribbean, light West African, Latina.',
  },

  // ── MEDIUM (depth 21-28) ──────────────────────────────────────────────────
  {
    id: 'M21', name: 'Pecan',      hex: '#A86932',
    depth: 21, tier: 'medium',
    undertones: ['warm', 'golden'],
    description: 'Warm pecan — medium Black American, medium Caribbean, Afro-Latina.',
  },
  {
    id: 'M22', name: 'Amber',      hex: '#A3632C',
    depth: 22, tier: 'medium',
    undertones: ['warm', 'neutral'],
    description: 'Classic amber medium — diverse Black, South Asian dark, Latina dark.',
  },
  {
    id: 'M23', name: 'Spice',      hex: '#9E5D27',
    depth: 23, tier: 'medium',
    undertones: ['warm', 'red'],
    description: 'Red-warm medium — East African medium, Caribbean medium.',
  },
  {
    id: 'M24', name: 'Maple',      hex: '#985722',
    depth: 24, tier: 'medium',
    undertones: ['warm', 'golden'],
    description: 'Golden maple — diverse medium-dark complexions.',
  },
  {
    id: 'M25', name: 'Walnut',     hex: '#93521E',
    depth: 25, tier: 'medium',
    undertones: ['neutral', 'cool'],
    description: 'Neutral-cool medium — some East African, South African medium.',
  },
  {
    id: 'M26', name: 'Bronze',     hex: '#8E4C1A',
    depth: 26, tier: 'medium',
    undertones: ['warm', 'neutral'],
    description: 'Rich bronze — medium West African, Haitian, Dominican.',
  },
  {
    id: 'M27', name: 'Sienna',     hex: '#894717',
    depth: 27, tier: 'medium',
    undertones: ['warm', 'neutral', 'cool'],
    description: 'Classic sienna — diverse medium-deep Black and Brown.',
  },
  {
    id: 'M28', name: 'Tawny',      hex: '#844114',
    depth: 28, tier: 'medium',
    undertones: ['warm', 'red'],
    description: 'Red-warm tawny — some West African, Jamaican medium-deep.',
  },

  // ── MEDIUM-DEEP (depth 29-36) ─────────────────────────────────────────────
  {
    id: 'MD29', name: 'Chestnut',  hex: '#7E3C11',
    depth: 29, tier: 'medium-deep',
    undertones: ['warm', 'neutral'],
    description: 'Warm chestnut — medium-deep Black American, West African.',
  },
  {
    id: 'MD30', name: 'Toffee',    hex: '#79370F',
    depth: 30, tier: 'medium-deep',
    undertones: ['warm', 'golden'],
    description: 'Golden toffee — diverse medium-deep Black and mixed.',
  },
  {
    id: 'MD31', name: 'Mocha',     hex: '#74320D',
    depth: 31, tier: 'medium-deep',
    undertones: ['warm', 'neutral'],
    description: 'Warm mocha — common medium-deep West African, Black American.',
  },
  {
    id: 'MD32', name: 'Cocoa',     hex: '#6F2D0B',
    depth: 32, tier: 'medium-deep',
    undertones: ['neutral', 'cool'],
    description: 'Neutral-cool cocoa — some East African, South African medium-deep.',
  },
  {
    id: 'MD33', name: 'Russet',    hex: '#6A280A',
    depth: 33, tier: 'medium-deep',
    undertones: ['warm', 'red'],
    description: 'Red-warm russet — some Nigerian, Ghanaian, Caribbean medium-deep.',
  },
  {
    id: 'MD34', name: 'Terra',     hex: '#652309',
    depth: 34, tier: 'medium-deep',
    undertones: ['warm', 'neutral'],
    description: 'Terracotta warm — diverse medium-deep African complexions.',
  },
  {
    id: 'MD35', name: 'Umber',     hex: '#601F08',
    depth: 35, tier: 'medium-deep',
    undertones: ['neutral', 'cool'],
    description: 'Cool neutral umber — East African deep, some Southern African.',
  },
  {
    id: 'MD36', name: 'Mahogany',  hex: '#5B1A07',
    depth: 36, tier: 'medium-deep',
    undertones: ['warm', 'neutral', 'cool'],
    description: 'Classic mahogany — diverse deep Black and African.',
  },

  // ── DEEP (depth 37-45) ────────────────────────────────────────────────────
  {
    id: 'D37', name: 'Chocolate',  hex: '#561607',
    depth: 37, tier: 'deep',
    undertones: ['warm', 'neutral'],
    description: 'Warm chocolate deep — West African, Black American deep.',
  },
  {
    id: 'D38', name: 'Espresso',   hex: '#511206',
    depth: 38, tier: 'deep',
    undertones: ['warm', 'golden'],
    description: 'Golden-warm espresso — Ghanaian deep, some Nigerian deep.',
  },
  {
    id: 'D39', name: 'Bark',       hex: '#4C0F06',
    depth: 39, tier: 'deep',
    undertones: ['neutral', 'cool'],
    description: 'Cool-neutral deep — East African deep, South African deep.',
  },
  {
    id: 'D40', name: 'Garnet',     hex: '#470C05',
    depth: 40, tier: 'deep',
    undertones: ['warm', 'red'],
    description: 'Red-warm garnet — some West African, Congolese, Caribbean deep.',
  },
  {
    id: 'D41', name: 'Ebony',      hex: '#420A05',
    depth: 41, tier: 'deep',
    undertones: ['neutral', 'cool'],
    description: 'Classic ebony — diverse deep African complexions.',
  },
  {
    id: 'D42', name: 'Truffle',    hex: '#3D0804',
    depth: 42, tier: 'deep',
    undertones: ['cool', 'neutral'],
    description: 'Cool truffle — Somali deep, some East African deep.',
  },
  {
    id: 'D43', name: 'Coal',       hex: '#380604',
    depth: 43, tier: 'deep',
    undertones: ['neutral', 'blue'],
    description: 'Blue-neutral deep — Sudanese, some Nigerian deep.',
  },
  {
    id: 'D44', name: 'Onyx',       hex: '#330504',
    depth: 44, tier: 'deep',
    undertones: ['cool', 'blue'],
    description: 'Blue-cool deep — deep East African, Nubian.',
  },
  {
    id: 'D45', name: 'Slate',      hex: '#2E0403',
    depth: 45, tier: 'deep',
    undertones: ['cool', 'neutral'],
    description: 'Cool-neutral very deep.',
  },

  // ── RICH DEEP (depth 46-54) ───────────────────────────────────────────────
  {
    id: 'RD46', name: 'Obsidian',  hex: '#290303',
    depth: 46, tier: 'rich-deep',
    undertones: ['cool', 'blue'],
    description: 'Blue-cool obsidian — very deep Congolese, South Sudanese.',
  },
  {
    id: 'RD47', name: 'Plum',      hex: '#250303',
    depth: 47, tier: 'rich-deep',
    undertones: ['cool', 'red'],
    description: 'Red-cool plum-dark — some West African richly-dark.',
  },
  {
    id: 'RD48', name: 'Raven',     hex: '#210202',
    depth: 48, tier: 'rich-deep',
    undertones: ['blue', 'cool'],
    description: 'Blue-deep raven — the rich blue-black skin of Nilotic peoples.',
  },
  {
    id: 'RD49', name: 'Midnight',  hex: '#1D0202',
    depth: 49, tier: 'rich-deep',
    undertones: ['blue', 'neutral'],
    description: 'Blue-neutral midnight — Dinka, Nuer, Maasai complexions.',
  },
  {
    id: 'RD50', name: 'Ink',       hex: '#190202',
    depth: 50, tier: 'rich-deep',
    undertones: ['blue', 'cool'],
    description: 'Deepest blue-cool — the most melanin-rich tones on earth.',
  },

  // ── MIXED / SPECIAL UNDERTONES (depth 51-60) — covers mixed-race specific tones ──
  {
    id: 'MX51', name: 'Driftwood',  hex: '#C08C68',
    depth: 16, tier: 'mixed',
    undertones: ['warm', 'golden', 'olive'],
    description: 'Mixed Black/White warm — biracial medium-light, ambiguous tan.',
  },
  {
    id: 'MX52', name: 'Butterscotch', hex: '#B87F55',
    depth: 19, tier: 'mixed',
    undertones: ['warm', 'golden'],
    description: 'Mixed Latino/Black warm golden — Afro-Latina, mixed Caribbean.',
  },
  {
    id: 'MX53', name: 'Clay',       hex: '#A87045',
    depth: 22, tier: 'mixed',
    undertones: ['warm', 'red', 'neutral'],
    description: 'Red-warm clay — mixed Native American/Black, Afro-Indigenous.',
  },
  {
    id: 'MX54', name: 'Copper',     hex: '#986038',
    depth: 25, tier: 'mixed',
    undertones: ['warm', 'red', 'golden'],
    description: 'Red-gold copper — mixed East Asian/Black, Blasian, some Filipino-Black.',
  },
  {
    id: 'MX55', name: 'Cinnamon',   hex: '#8A5530',
    depth: 27, tier: 'mixed',
    undertones: ['warm', 'red'],
    description: 'Warm red cinnamon — mixed South Asian/Black, some Caribbean.',
  },
  {
    id: 'MX56', name: 'Ginger',     hex: '#7A4B25',
    depth: 30, tier: 'mixed',
    undertones: ['warm', 'golden', 'neutral'],
    description: 'Golden-warm ginger — mixed Arab/Black, North African medium-deep.',
  },
  {
    id: 'MX57', name: 'Hazel',      hex: '#CB9975',
    depth: 13, tier: 'mixed',
    undertones: ['neutral', 'warm', 'cool'],
    description: 'Neutral multi-undertone — truly ambiguous, chameleon complexion.',
  },
  {
    id: 'MX58', name: 'Cashew',     hex: '#D0A47C',
    depth: 11, tier: 'mixed',
    undertones: ['warm', 'olive', 'neutral'],
    description: 'Olive-warm light-medium — Southeast Asian/White mix, Filipino, Pacific Islander.',
  },
  {
    id: 'MX59', name: 'Oat',        hex: '#E0C8A5',
    depth: 8, tier: 'mixed',
    undertones: ['warm', 'neutral', 'golden'],
    description: 'Warm golden light — mixed Asian/White, light biracial, Central Asian.',
  },
  {
    id: 'MX60', name: 'Smoke',      hex: '#906055',
    depth: 24, tier: 'mixed',
    undertones: ['cool', 'red', 'neutral'],
    description: 'Cool-red neutral — some mixed Native/White, some Southeast Asian deep, Filipina deep.',
  },
];

// ---------------------------------------------------------------------------
// Community → typical depth range mapping
// ---------------------------------------------------------------------------

const COMMUNITY_DEPTH_PROFILE = {
  west_african:    { min: 21, max: 50, undertone_lean: ['warm', 'neutral', 'golden', 'red', 'cool', 'blue'] },
  east_african:    { min: 18, max: 50, undertone_lean: ['warm', 'neutral', 'cool', 'blue'] },
  black_american:  { min: 7,  max: 50, undertone_lean: ['warm', 'neutral', 'cool', 'golden', 'red'] },
  caribbean:       { min: 10, max: 46, undertone_lean: ['warm', 'neutral', 'red', 'golden'] },
  south_asian:     { min: 3,  max: 28, undertone_lean: ['warm', 'olive', 'neutral', 'golden'] },
  arab:            { min: 3,  max: 22, undertone_lean: ['warm', 'olive', 'cool', 'neutral'] },
  latina:          { min: 5,  max: 36, undertone_lean: ['warm', 'olive', 'neutral', 'red', 'golden'] },
  east_asian:      { min: 1,  max: 14, undertone_lean: ['cool', 'neutral', 'warm', 'pink'] },
  southeast_asian: { min: 5,  max: 22, undertone_lean: ['warm', 'neutral', 'olive', 'golden'] },
  south_african:   { min: 18, max: 50, undertone_lean: ['warm', 'neutral', 'cool', 'red'] },
  mixed:           { min: 1,  max: 50, undertone_lean: ['warm', 'neutral', 'cool', 'golden', 'olive', 'red'] },
  pacific_islander:{ min: 12, max: 32, undertone_lean: ['warm', 'golden', 'neutral'] },
  indigenous:      { min: 14, max: 36, undertone_lean: ['warm', 'red', 'golden', 'neutral'] },
  central_asian:   { min: 6,  max: 18, undertone_lean: ['warm', 'olive', 'neutral'] },
};

// User-selected skin depth labels
export const DEPTH_LABELS = [
  { id: 'fair',        label: 'Fair',          depth: 3,  emoji: '🤍', range: '1-6'   },
  { id: 'light',       label: 'Light',         depth: 10, emoji: '🌿', range: '7-13'  },
  { id: 'light_med',   label: 'Light-Medium',  depth: 17, emoji: '☀️', range: '14-20' },
  { id: 'medium',      label: 'Medium',        depth: 24, emoji: '🌻', range: '21-28' },
  { id: 'medium_deep', label: 'Medium-Deep',   depth: 32, emoji: '🌺', range: '29-36' },
  { id: 'deep',        label: 'Deep',          depth: 41, emoji: '🍫', range: '37-45' },
  { id: 'rich_deep',   label: 'Rich Deep',     depth: 48, emoji: '✨', range: '46-50' },
  { id: 'mixed',       label: 'Mixed Heritage', depth: 16, emoji: '🌈', range: 'varies'},
];

export const UNDERTONE_OPTIONS = [
  { id: 'warm',    label: 'Warm',         hint: 'Golden, peachy, yellow cast' },
  { id: 'cool',    label: 'Cool',         hint: 'Pink, red, or bluish cast' },
  { id: 'neutral', label: 'Neutral',      hint: 'Mix of warm and cool' },
  { id: 'olive',   label: 'Olive',        hint: 'Green or yellow-green cast' },
  { id: 'golden',  label: 'Golden',       hint: 'Rich yellow-gold cast' },
  { id: 'red',     label: 'Red/Reddish',  hint: 'Reddish or copper cast' },
  { id: 'blue',    label: 'Blue-Black',   hint: 'Deep blue-cool cast' },
  { id: 'peach',   label: 'Peach',        hint: 'Soft warm peach-pink cast' },
  { id: 'pink',    label: 'Pink',         hint: 'Cool pink or rosy cast' },
];

// ---------------------------------------------------------------------------
// Shade Finder API
// ---------------------------------------------------------------------------

export function findShades({ communityId = 'mixed', depthTarget = 24, undertone = 'neutral', topN = 8 }) {
  const profile = COMMUNITY_DEPTH_PROFILE[communityId] ?? COMMUNITY_DEPTH_PROFILE.mixed;

  return SHADE_SPECTRUM
    .map(shade => {
      const depthDiff = Math.abs(shade.depth - depthTarget);
      const undertoneMatch = shade.undertones.includes(undertone) ? 0 : 1;
      const inRange = shade.depth >= profile.min && shade.depth <= profile.max ? 0 : 2;

      const score = 1 - ((depthDiff / 50) * 0.6 + undertoneMatch * 0.25 + inRange * 0.15);
      const coverageNote = buildCoverageNote(shade, undertone, communityId);

      return { shade, score: Math.max(0, score), coverageNote,
               name: shade.name, code: shade.id, hex: shade.hex };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

function buildCoverageNote(shade, undertone, communityId) {
  const notes = [];
  if (shade.undertones.includes(undertone)) notes.push(`${undertone} undertone match`);
  if (['west_african','east_african','black_american','caribbean','south_african'].includes(communityId) && shade.depth >= 21) {
    notes.push('full-spectrum deep shade');
  }
  if (shade.tier === 'mixed') notes.push('mixed-heritage calibrated');
  if (shade.undertones.includes('olive') && ['south_asian','arab','latina','southeast_asian'].includes(communityId)) {
    notes.push('olive base — no ashiness');
  }
  if (shade.undertones.includes('blue') && shade.depth >= 40) notes.push('blue-cool — deep melanin accurate');
  return notes.join(' · ') || 'excellent match';
}

export function getShadeSpectrum() { return SHADE_SPECTRUM; }
export function getDepthLabels()   { return DEPTH_LABELS; }
export function getUndertoneOptions() { return UNDERTONE_OPTIONS; }
