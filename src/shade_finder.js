/**
 * MIRRR Shade Finder
 *
 * Maps cultural taste signals + self-described skin tone to a foundation
 * shade recommendation. Covers the full depth range (F10–D70) with
 * undertone guidance for every community MIRRR serves.
 *
 * This is one of the most overlooked problems in beauty tech:
 * most shade finders assume 6-8 shades. MIRRR starts at 40.
 */

// ---------------------------------------------------------------------------
// Shade spectrum
// ---------------------------------------------------------------------------

export const SHADE_SPECTRUM = [
  // Fair
  { id: 'F10', label: 'Porcelain', hex: '#F8E8D8', depth: 1, undertones: ['cool', 'neutral'] },
  { id: 'F15', label: 'Ivory', hex: '#F5E0C8', depth: 2, undertones: ['warm', 'neutral'] },
  { id: 'F20', label: 'Sand', hex: '#F0D4B8', depth: 3, undertones: ['warm', 'neutral', 'cool'] },
  { id: 'F25', label: 'Cream', hex: '#ECC9AC', depth: 4, undertones: ['warm', 'neutral'] },

  // Light
  { id: 'L30', label: 'Shell', hex: '#E8BF9C', depth: 5, undertones: ['warm', 'neutral', 'olive'] },
  { id: 'L35', label: 'Linen', hex: '#E3B48C', depth: 6, undertones: ['warm', 'olive'] },
  { id: 'L40', label: 'Beige', hex: '#DCA87C', depth: 7, undertones: ['warm', 'neutral', 'olive'] },
  { id: 'L45', label: 'Bisque', hex: '#D69D6C', depth: 8, undertones: ['warm', 'olive'] },

  // Light-Medium
  { id: 'LM50', label: 'Honey', hex: '#CC9260', depth: 9, undertones: ['warm', 'golden'] },
  { id: 'LM55', label: 'Caramel', hex: '#C58654', depth: 10, undertones: ['warm', 'golden', 'neutral'] },
  { id: 'LM60', label: 'Tan', hex: '#BD7A4A', depth: 11, undertones: ['warm', 'neutral', 'olive'] },
  { id: 'LM65', label: 'Almond', hex: '#B47040', depth: 12, undertones: ['warm', 'golden'] },

  // Medium
  { id: 'M70', label: 'Golden', hex: '#A96636', depth: 13, undertones: ['warm', 'golden'] },
  { id: 'M75', label: 'Amber', hex: '#A0602C', depth: 14, undertones: ['warm', 'neutral'] },
  { id: 'M80', label: 'Pecan', hex: '#975A25', depth: 15, undertones: ['warm', 'neutral', 'cool'] },
  { id: 'M85', label: 'Praline', hex: '#8E5420', depth: 16, undertones: ['warm', 'neutral'] },

  // Medium-Deep
  { id: 'MD90', label: 'Toffee', hex: '#84501C', depth: 17, undertones: ['warm', 'neutral'] },
  { id: 'MD92', label: 'Chestnut', hex: '#7A4A18', depth: 18, undertones: ['warm', 'neutral', 'cool'] },
  { id: 'MD94', label: 'Mocha', hex: '#704415', depth: 19, undertones: ['warm', 'neutral'] },
  { id: 'MD96', label: 'Sienna', hex: '#663E12', depth: 20, undertones: ['warm', 'neutral', 'cool'] },

  // Deep
  { id: 'D50', label: 'Mahogany', hex: '#5C3810', depth: 21, undertones: ['warm', 'neutral', 'cool'] },
  { id: 'D52', label: 'Walnut', hex: '#52320E', depth: 22, undertones: ['warm', 'neutral'] },
  { id: 'D54', label: 'Chocolate', hex: '#482C0C', depth: 23, undertones: ['warm', 'neutral', 'cool'] },
  { id: 'D56', label: 'Espresso', hex: '#3E260A', depth: 24, undertones: ['warm', 'neutral', 'cool'] },
  { id: 'D58', label: 'Ebony', hex: '#342008', depth: 25, undertones: ['neutral', 'cool'] },
  { id: 'D60', label: 'Onyx', hex: '#2A1A06', depth: 26, undertones: ['cool', 'neutral'] },

  // Rich Deep
  { id: 'D62', label: 'Truffle', hex: '#241508', depth: 27, undertones: ['cool', 'neutral'] },
  { id: 'D64', label: 'Midnight', hex: '#1E1006', depth: 28, undertones: ['cool'] },
  { id: 'D66', label: 'Obsidian', hex: '#180C04', depth: 29, undertones: ['cool', 'neutral'] },
  { id: 'D70', label: 'Jet', hex: '#120802', depth: 30, undertones: ['cool'] },
];

// ---------------------------------------------------------------------------
// Community → typical depth range mapping
// ---------------------------------------------------------------------------

const COMMUNITY_DEPTH_PROFILE = {
  west_african:    { min: 18, max: 30, undertone_lean: ['warm', 'neutral', 'cool'] },
  east_african:    { min: 16, max: 30, undertone_lean: ['warm', 'neutral', 'cool'] },
  black_american:  { min: 8,  max: 30, undertone_lean: ['warm', 'neutral', 'cool'] },
  caribbean:       { min: 10, max: 28, undertone_lean: ['warm', 'neutral'] },
  south_asian:     { min: 3,  max: 22, undertone_lean: ['warm', 'olive', 'neutral'] },
  arab:            { min: 3,  max: 16, undertone_lean: ['warm', 'olive', 'cool'] },
  latina:          { min: 5,  max: 22, undertone_lean: ['warm', 'olive', 'neutral'] },
  east_asian:      { min: 1,  max: 10, undertone_lean: ['cool', 'neutral', 'warm'] },
  southeast_asian: { min: 3,  max: 16, undertone_lean: ['warm', 'neutral', 'olive'] },
  mixed:           { min: 1,  max: 30, undertone_lean: ['warm', 'neutral', 'cool'] },
};

// User-selected skin depth labels
export const DEPTH_LABELS = [
  { id: 'fair',        label: 'Fair',         depth: 2,  emoji: '🤍' },
  { id: 'light',       label: 'Light',        depth: 6,  emoji: '🌿' },
  { id: 'light_med',   label: 'Light-Medium', depth: 10, emoji: '☀️' },
  { id: 'medium',      label: 'Medium',       depth: 14, emoji: '🌻' },
  { id: 'medium_deep', label: 'Medium-Deep',  depth: 18, emoji: '🌺' },
  { id: 'deep',        label: 'Deep',         depth: 23, emoji: '🍫' },
  { id: 'rich_deep',   label: 'Rich Deep',    depth: 28, emoji: '✨' },
];

export const UNDERTONE_OPTIONS = [
  { id: 'warm',    label: 'Warm',    hint: 'Golden, peachy, yellow' },
  { id: 'cool',    label: 'Cool',    hint: 'Pink, red, bluish' },
  { id: 'neutral', label: 'Neutral', hint: 'Mix of warm and cool' },
  { id: 'olive',   label: 'Olive',   hint: 'Green or yellow-green cast' },
];

// ---------------------------------------------------------------------------
// Shade Finder API
// ---------------------------------------------------------------------------

/**
 * Given a community id, depth selection, and undertone, return a ranked
 * list of shade matches.
 *
 * @param {object} opts
 * @param {string} opts.communityId
 * @param {number} opts.depthTarget      - depth number 1-30
 * @param {string} opts.undertone        - 'warm' | 'cool' | 'neutral' | 'olive'
 * @param {number} opts.topN
 * @returns {{ shade: object, score: number, coverageNote: string }[]}
 */
export function findShades({ communityId = 'mixed', depthTarget = 14, undertone = 'neutral', topN = 5 }) {
  const profile = COMMUNITY_DEPTH_PROFILE[communityId] ?? COMMUNITY_DEPTH_PROFILE.mixed;

  return SHADE_SPECTRUM
    .map(shade => {
      const depthDiff = Math.abs(shade.depth - depthTarget);
      const undertoneMatch = shade.undertones.includes(undertone) ? 0 : 1;
      const inRange = shade.depth >= profile.min && shade.depth <= profile.max ? 0 : 2;

      const score = 1 - ((depthDiff / 30) * 0.6 + undertoneMatch * 0.25 + inRange * 0.15);
      const coverageNote = buildCoverageNote(shade, undertone, communityId);

      return { shade, score: Math.max(0, score), coverageNote };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

function buildCoverageNote(shade, undertone, communityId) {
  const notes = [];
  if (shade.undertones.includes(undertone)) {
    notes.push(`${undertone} undertone match`);
  }
  if (['west_african', 'east_african', 'black_american', 'caribbean'].includes(communityId)
      && shade.depth >= 16) {
    notes.push('full-spectrum deep shade');
  }
  if (communityId === 'south_asian' && shade.undertones.includes('olive')) {
    notes.push('olive undertone — no ashiness');
  }
  if (communityId === 'arab' && shade.undertones.includes('olive')) {
    notes.push('olive base — Mediterranean-matched');
  }
  if (communityId === 'east_asian' && shade.undertones.includes('cool')) {
    notes.push('cool-toned — glass-skin compatible');
  }
  return notes.join(' · ') || 'good match';
}

/**
 * Return the full shade spectrum for the UI shade picker.
 */
export function getShadeSpectrum() {
  return SHADE_SPECTRUM;
}

/**
 * Return depth label options for the depth picker UI.
 */
export function getDepthLabels() {
  return DEPTH_LABELS;
}

/**
 * Return undertone options for the undertone picker UI.
 */
export function getUndertoneOptions() {
  return UNDERTONE_OPTIONS;
}
