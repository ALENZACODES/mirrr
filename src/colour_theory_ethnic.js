/**
 * colour_theory_ethnic.js — Colour theory for ethnic and melanin-rich skin tones
 * Undertones, colour mapping, and community-specific colour guidance
 */

// ─── UNDERTONE SYSTEM ─────────────────────────────────────────────────────────

export const UNDERTONES = {
  warm: {
    id: 'warm',
    label: 'Warm',
    description: 'Yellow, peach, gold, or olive hue beneath the skin',
    howToIdentify: 'Veins appear green or olive. Gold jewellery looks more flattering than silver. The sun gives you a tan, not a burn first.',
    makeupGuidance: 'Choose foundations with warm, golden, or peachy undertones. Avoid grey or pink bases.',
    colourPalette: ['warm red', 'coral', 'orange', 'gold', 'copper', 'terracotta', 'peach', 'warm brown', 'mustard'],
    avoidColours: ['cool pinks', 'blue-red', 'silver-grey'],
    fitzpatrickRange: 'I through VI (undertone exists across all skin depths)',
  },

  cool: {
    id: 'cool',
    label: 'Cool',
    description: 'Pink, red, or blue hue beneath the skin',
    howToIdentify: 'Veins appear blue or purple. Silver jewellery more flattering. Skin burns before tanning.',
    makeupGuidance: 'Choose foundations with pink, rosy, or neutral-cool undertones. Avoid orange or brassy foundations.',
    colourPalette: ['blue-red', 'cool berry', 'plum', 'emerald', 'cobalt', 'silver', 'cool pink', 'lavender', 'magenta'],
    avoidColours: ['orange-based nudes', 'brassy gold', 'warm yellow'],
    fitzpatrickRange: 'I through VI',
  },

  neutral: {
    id: 'neutral',
    label: 'Neutral',
    description: 'A mix of warm and cool — balanced, versatile',
    howToIdentify: 'Both gold and silver jewellery look equally good. Veins may appear blue-green. Can pull off most colours.',
    makeupGuidance: 'Very versatile. Most foundation shades will work. Focus on depth (light/dark) rather than undertone adjustment.',
    colourPalette: ['balanced red', 'nude-pink', 'mauve', 'taupe', 'warm white', 'classic red', 'rose gold'],
    avoidColours: ['Very few avoided — most colours work with neutral'],
    fitzpatrickRange: 'I through VI',
  },

  deep_warm: {
    id: 'deep_warm',
    label: 'Deep Warm (Rich Warm)',
    description: 'Warm undertones that are rich and complex — mahogany, deep amber, golden-brown',
    howToIdentify: 'Deep skin with very warm, orange-gold, or red-brown richness. Looks incredible in gold and copper.',
    makeupGuidance: 'Deep warm foundations — avoid pink-toned or grey-toned deep shades. The right shade will be described as "caramel," "mahogany," or "espresso" on warm side.',
    colourPalette: ['gold', 'copper', 'deep orange', 'brick red', 'burnt sienna', 'chocolate brown', 'mustard yellow', 'olive green'],
    avoidColours: ['grey nudes', 'ash-toned foundations', 'cool pink blush without warming'],
    fitzpatrickRange: 'V through VI primarily',
  },

  deep_cool: {
    id: 'deep_cool',
    label: 'Deep Cool (Rich Cool)',
    description: 'Cool undertones in deep skin — blue-black, ebony with cool depth',
    howToIdentify: 'Deep skin with a blue-black or reddish-cool depth. Silver and jewel tones look striking.',
    makeupGuidance: 'Avoid brassy or orange foundations. Choose descriptions like "cool ebony" or "raisin-cool" on deep side.',
    colourPalette: ['cool red', 'berry', 'plum', 'electric blue', 'emerald', 'silver', 'deep wine', 'cobalt'],
    avoidColours: ['orange', 'warm copper', 'brassy gold'],
    fitzpatrickRange: 'V through VI primarily',
  },
};

// ─── COLOUR FORMULAS ─────────────────────────────────────────────────────────

export const COLOUR_FORMULAS = {

  the_pop_formula: {
    id: 'the_pop_formula',
    name: 'The Pop Formula',
    description: 'Maximum contrast for maximum impact — choose colours that maximally contrast your skin tone',
    rule: 'The further the colour is from your skin tone on the colour wheel, the more it "pops"',
    examples: [
      { skinTone: 'Fitzpatrick V-VI warm', recommendation: 'Cobalt blue, emerald green, bright yellow, white — high contrast against deep warm skin' },
      { skinTone: 'Fitzpatrick III warm', recommendation: 'Cool berry, dusty lavender, deep plum — contrast against medium warm' },
      { skinTone: 'Fitzpatrick I-II cool', recommendation: 'Deep burgundy, navy, forest green — dark contrast against pale cool skin' },
    ],
  },

  the_harmony_formula: {
    id: 'the_harmony_formula',
    name: 'The Harmony Formula',
    description: 'Choose colours that echo and enhance your natural colouring — a unified look',
    rule: 'Match the family of colours present in your skin — if you have warm undertones, warm palette colours create a cohesive look',
    examples: [
      { skinTone: 'Fitzpatrick IV-V warm', recommendation: 'Burnt orange, terracotta, copper, golden bronze — harmony with warm deep skin' },
      { skinTone: 'Fitzpatrick III neutral', recommendation: 'Rose gold, warm nude, peachy-coral — echoes the balance in neutral skin' },
    ],
  },

  the_complement_formula: {
    id: 'the_complement_formula',
    name: 'The Complement Formula',
    description: 'Use complementary colours (opposite on the colour wheel) to make both skin and colour appear more vivid',
    rule: 'Complementary colours intensify each other when placed together',
    examples: [
      { skinTone: 'Warm golden-olive (south-asian)', recommendation: 'Purple and violet shadow complement the yellow-orange of golden skin — the pairing is vibrant' },
      { skinTone: 'Warm brown-red (west-african)', recommendation: 'Teal and turquoise are the complement of red-brown — electric on deep warm skin' },
    ],
  },

};

// ─── COLOUR ADVICE BY COMMUNITY ───────────────────────────────────────────────

export const COMMUNITY_COLOUR_GUIDES = {

  'west-african': {
    communityId: 'west-african',
    title: 'Colour Guide for West African Skin Tones',
    powerColours: [
      { colour: 'Gold', hex: '#FFD700', why: 'Gold is the ultimate West African colour — ceremonially, culturally, and aesthetically. On deep warm skin it is transformative.' },
      { colour: 'Electric Blue', hex: '#0000FF', why: 'High contrast against deep skin. Pops with maximum impact.' },
      { colour: 'Bright Yellow', hex: '#FFFF00', why: 'Yellow on deep skin is jaw-dropping. One of the most underused combinations in beauty.' },
      { colour: 'White', hex: '#FFFFFF', why: 'Maximum contrast against the deepest skin tones. Striking in any form — white eyeliner, white nails, white lip.' },
      { colour: 'Coral Orange', hex: '#FF6B35', why: 'A warm coral sings on warm West African skin tones.' },
    ],
    avoidMistakes: [
      'Ash or grey-toned foundations — always look muddy on warm West African skin',
      'Cool pink blush without a warm bronzer to balance — reads ashy',
      'Very pale nude lips without warmth — disappears and looks washed out',
    ],
  },

  'south-asian': {
    communityId: 'south-asian',
    title: 'Colour Guide for South Asian Skin Tones',
    powerColours: [
      { colour: 'Terracotta', hex: '#C94F22', why: 'The warm red-orange of terracotta complements golden-olive South Asian skin perfectly.' },
      { colour: 'Deep Plum', hex: '#5E2D79', why: 'A regal combination — plum on warm skin creates deep contrast that feels luxurious.' },
      { colour: 'Warm Brick Red', hex: '#9B2335', why: 'Not a blue-red or cool red — the warm brick red is the most harmonious red for most South Asian skin.' },
      { colour: 'Teal', hex: '#008080', why: 'Teal is the complement of warm red-orange — creates beautiful tension with South Asian skin.' },
      { colour: 'Gold', hex: '#FFD700', why: 'Gold is culturally and aesthetically perfect for South Asian skin. The haldi tradition is literally about golden glow.' },
    ],
    avoidMistakes: [
      'Pink-toned foundations — most South Asian skin reads yellowy; pink makes it look grey',
      'Cool-toned blush on warm-undertone skin — use peach-warm blush instead',
      'Blue-red lip on warm skin without testing — sometimes works, but the warm brick red is safer',
    ],
  },

  'arab': {
    communityId: 'arab',
    title: 'Colour Guide for Arab Skin Tones',
    powerColours: [
      { colour: 'Deep Emerald', hex: '#006400', why: 'The Islamic cultural connection to green combined with its contrast against warm Arab skin makes emerald stunning.' },
      { colour: 'Rich Burgundy', hex: '#800020', why: 'A deep burgundy lip on warm-olive Arab skin is one of the most beautiful combinations in makeup.' },
      { colour: 'Deep Teal Kohl', hex: '#008080', why: 'Arab eye tradition with teal liner — unexpected and striking against brown eyes.' },
      { colour: 'Rose Gold', hex: '#B76E79', why: 'Rose gold straddles warm and cool — perfect for neutral-warm Arab skin tones.' },
      { colour: 'Midnight Navy', hex: '#191970', why: 'Deep navy shadow or liner against warm skin is dramatic without being harsh.' },
    ],
    avoidMistakes: [
      'Very orange bronzer on pale Levantine skin — looks too warm and artificial',
      'Grey-toned foundations — most Arab skin has some warmth',
    ],
  },

  'east-asian': {
    communityId: 'east-asian',
    title: 'Colour Guide for East Asian Skin Tones',
    powerColours: [
      { colour: 'Classic Red', hex: '#CC0000', why: 'Red is the traditional beauty and luck colour across East Asian cultures — and it works beautifully on yellow-warm skin.' },
      { colour: 'Peachy Coral', hex: '#FF7F7F', why: 'Warm coral is the ideal blush and lip tone for yellow-undertone skin — more flattering than cool pink.' },
      { colour: 'Deep Berry', hex: '#990099', why: 'Deep berry provides beautiful contrast against fair-warm East Asian skin.' },
      { colour: 'Warm Brown Eye', hex: '#7B3F00', why: 'Warm brown shadow warms brown eyes without competing — the most flattering everyday eye colour.' },
    ],
    avoidMistakes: [
      'Very cool-toned pink blush — can look grey against yellow-warm skin',
      'Ashy or grey foundations — most East Asian skin has warmth; grey makes it look tired',
      'Overdone contour — East Asian bone structure is often defined already; light hand is better',
    ],
  },

  'black-american': {
    communityId: 'black-american',
    title: 'Colour Guide for Black American Skin Tones',
    powerColours: [
      { colour: 'Royal Purple', hex: '#7B2D8B', why: 'Purple on deeper Black American skin is royally stunning — the contrast and richness complement each other.' },
      { colour: 'Hot Orange', hex: '#FF4500', why: 'On Fitzpatrick V-VI warm, a hot orange lip or shadow is extraordinary. Arguably no other skin tone wears orange this well.' },
      { colour: 'Bright Yellow', hex: '#FFE135', why: 'The contrast of bright yellow on deep skin is unique and beautiful. A yellow eyeshadow on deep skin is an editorial statement.' },
      { colour: 'Rich Chocolate Nude', hex: '#5C3317', why: 'A warm chocolate nude is the true "my lips but better" for deeper Black American skin.' },
      { colour: 'Deep Wine', hex: '#722F37', why: 'Deep wine is a classic and looks incredible on both warm and cool deep skin.' },
    ],
    avoidMistakes: [
      'Grey or ashy foundation — the #1 mistake, always warm- or golden-choose for warm-undertone deep skin',
      'Very pale pink blush — disappears or reads grey',
      'Orange-based nude for cool-undertone deep skin — muddy result',
    ],
  },

  'latina': {
    communityId: 'latina',
    title: 'Colour Guide for Latina Skin Tones',
    powerColours: [
      { colour: 'Warm Red', hex: '#CC3300', why: 'A classic warm red lip is quintessentially Latina. This is the power colour of the community.' },
      { colour: 'Coral Pink', hex: '#FF6B6B', why: 'Warm coral reads tropical and vibrant on olive-warm Latina skin.' },
      { colour: 'Deep Bronze', hex: '#8B4513', why: 'A deep bronze eye brings out the warmth in olive Latina skin.' },
      { colour: 'Vivid Green', hex: '#00A550', why: 'Vivid emerald green creates beautiful tension against the warm red undertones in many Latina skin tones.' },
    ],
    avoidMistakes: [
      'Pink-based foundations for olive undertone — looks grey and cool',
      'Over-highlighting in the wrong gold tone — cool gold on warm skin looks mismatched',
    ],
  },

  'caribbean': {
    communityId: 'caribbean',
    title: 'Colour Guide for Caribbean Skin Tones',
    powerColours: [
      { colour: 'Tropical Coral', hex: '#FF6B35', why: 'Island beauty at its most authentic — warm coral on Caribbean skin is sunshine and joy.' },
      { colour: 'Hot Pink', hex: '#FF69B4', why: 'Vivid hot pink on deep Caribbean skin is a cultural staple of carnival and celebration.' },
      { colour: 'Turquoise', hex: '#40E0D0', why: 'The colour of the Caribbean sea against deep skin — striking and culturally resonant.' },
      { colour: 'Deep Berry', hex: '#8B0057', why: 'A deep berry lip on Caribbean skin is dramatic, rich, and beautiful.' },
    ],
    avoidMistakes: [
      'Very cool-pink nudes for warm Caribbean skin — wrong undertone reads as grey',
      'Ashy powders without warm bronzer correction',
    ],
  },

};

// ─── QUERY FUNCTIONS ─────────────────────────────────────────────────────────

export function getUndertone(id) {
  return UNDERTONES[id] || null;
}

export function getAllUndertones() {
  return Object.values(UNDERTONES);
}

export function getCommunityColourGuide(communityId) {
  return COMMUNITY_COLOUR_GUIDES[communityId] || null;
}

export function getAllCommunityColourGuides() {
  return Object.values(COMMUNITY_COLOUR_GUIDES);
}

export function getColourFormula(id) {
  return COLOUR_FORMULAS[id] || null;
}

export function getPowerColoursForCommunity(communityId) {
  const guide = COMMUNITY_COLOUR_GUIDES[communityId];
  return guide?.powerColours || [];
}

export function getAvoidMistakesForCommunity(communityId) {
  const guide = COMMUNITY_COLOUR_GUIDES[communityId];
  return guide?.avoidMistakes || [];
}

