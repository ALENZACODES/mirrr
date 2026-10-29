/**
 * makeup_products_db.js — Ethnic makeup products and brand database for MIRRR
 * Products formulated for, by, or beloved by ethnic communities
 */

// ─── PRODUCT CATEGORIES ───────────────────────────────────────────────────────

export const PRODUCT_CATEGORIES = {
  foundation: { id: 'foundation', label: 'Foundation', icon: '🪞' },
  concealer: { id: 'concealer', label: 'Concealer', icon: '✨' },
  blush: { id: 'blush', label: 'Blush', icon: '🌸' },
  highlight: { id: 'highlight', label: 'Highlight & Glow', icon: '💫' },
  eyeshadow: { id: 'eyeshadow', label: 'Eye Shadow', icon: '👁️' },
  eyeliner: { id: 'eyeliner', label: 'Eyeliner & Kohl', icon: '✏️' },
  lip: { id: 'lip', label: 'Lip Colour', icon: '💋' },
  brow: { id: 'brow', label: 'Brows', icon: '🪮' },
  setting: { id: 'setting', label: 'Setting & Finishing', icon: '🌫️' },
  primer: { id: 'primer', label: 'Primer', icon: '🧴' },
  contour: { id: 'contour', label: 'Contour & Bronze', icon: '🌑' },
};

// ─── ETHNIC-FIRST BRANDS ──────────────────────────────────────────────────────

export const ETHNIC_BRANDS = {

  fenty_beauty: {
    id: 'fenty_beauty',
    name: 'Fenty Beauty',
    founder: 'Rihanna (Robyn Rihanna Fenty)',
    founded: 2017,
    country: 'USA (Barbadian founder)',
    community: 'black-american',
    mission: 'Beauty for all — the brand that launched 40 foundation shades and changed the industry\'s definition of inclusive.',
    heroProducts: ['Pro Filt\'r Soft Matte Foundation', 'Gloss Bomb Lip Luminizer', 'Killawatt Freestyle Highlighter'],
    priceRange: '$$',
    skinToneRange: 'I through VI — 50+ foundation shades',
    notes: 'The brand that broke the beauty industry\'s whitewashing. Fenty\'s 40-shade launch in 2017 forced every major brand to expand their shade range within months.',
    tags: ['inclusive', 'black-founded', 'barbadian', 'deep-skin', 'all-skin-tones'],
  },

  pat_mcgrath_labs: {
    id: 'pat_mcgrath_labs',
    name: 'Pat McGrath Labs',
    founder: 'Dame Pat McGrath',
    founded: 2015,
    country: 'UK (British-Caribbean founder)',
    community: 'black-american',
    mission: 'The most avant-garde beauty in existence. Luxury makeup from the most influential makeup artist in the world.',
    heroProducts: ['Skin Fetish Foundation', 'Lust 004 Lip Kit', 'Mothership Eye Palettes'],
    priceRange: '$$$$',
    skinToneRange: 'I through VI — outstanding deep shade range',
    notes: 'Dame Pat McGrath is British-Jamaican and grew up deeply connected to her Jamaican heritage. Her deep shade ranges are benchmarks for the industry.',
    tags: ['luxury', 'black-british', 'caribbean', 'artistry', 'editorial'],
  },

  black_opal: {
    id: 'black_opal',
    name: 'Black Opal',
    founder: 'Founded by beauty professionals for Black women',
    founded: 1994,
    country: 'USA',
    community: 'black-american',
    mission: 'The original beauty brand created specifically for darker skin tones, 30 years before Fenty made it cool.',
    heroProducts: ['True Color Foundation', 'Even True BB Cream', 'Truly Smooth Exfoliating Mask'],
    priceRange: '$',
    skinToneRange: 'V through VI primarily',
    notes: 'Founded three decades before the \'inclusive beauty\' conversation. Has been serving Black women since 1994 — the unsung pioneer.',
    tags: ['black-heritage', 'dark-skin', 'affordable', 'drugstore', 'pioneer'],
  },

  kulfi_beauty: {
    id: 'kulfi_beauty',
    name: 'Kulfi Beauty',
    founder: 'Priyanka Ganjoo (Indian-American)',
    founded: 2021,
    country: 'USA',
    community: 'south-asian',
    mission: 'Makeup made for South Asian skin tones and culture — filling the gap between too-pale and too-dark drugstore offerings.',
    heroProducts: ['Center Stage Kohl Kajal', 'Underlined Kajal', 'Bitten Matte Lip'],
    priceRange: '$$',
    skinToneRange: 'III through V (South Asian skin focus)',
    notes: 'Founded by a former L\'Oréal executive who was tired of seeing no South Asian faces in beauty campaigns. Named after the beloved South Asian ice cream.',
    tags: ['south-asian', 'indian', 'kajal', 'kohl', 'medium-deep', 'cultural'],
  },

  saie_beauty: {
    id: 'saie_beauty',
    name: 'Saie Beauty',
    founder: 'Laney Crowell',
    founded: 2019,
    country: 'USA',
    community: 'all',
    mission: 'Clean beauty that works for everyone — excellent shade range for clean makeup.',
    heroProducts: ['Slip Tint SPF 35', 'Sun Melt Natural Cream Bronzer', 'Dew Blush'],
    priceRange: '$$',
    skinToneRange: 'I through V',
    notes: 'Notable for clean formulas that work on various skin tones — the Slip Tint foundation is a favourite among South Asian and Latina beauty communities.',
    tags: ['clean', 'inclusive', 'dewy', 'all-communities'],
  },

  huda_beauty: {
    id: 'huda_beauty',
    name: 'Huda Beauty',
    founder: 'Huda Kattan (Iraqi-American)',
    founded: 2013,
    country: 'UAE/USA',
    community: 'arab',
    mission: 'Dubai-born luxury makeup inspired by Middle Eastern beauty standards — fuller, more dramatic, deeply pigmented.',
    heroProducts: ['Easy Bake Setting Powder', 'GloWish Foundation', '#FauxFilter Foundation', 'Liquid Matte Lipstick'],
    priceRange: '$$$',
    skinToneRange: 'I through VI — strong deep shade selection',
    notes: 'Built from zero to a $1B brand on Instagram. Huda Kattan is Iraqi-American and the brand reflects Arab beauty values: full coverage, dramatic eyes, long-wearing formulas.',
    tags: ['arab', 'iraqi', 'luxury', 'dubai', 'full-coverage', 'dramatic', 'middle-eastern'],
  },

  charlotte_tilbury: {
    id: 'charlotte_tilbury',
    name: 'Charlotte Tilbury',
    founder: 'Charlotte Tilbury MBE',
    founded: 2013,
    country: 'UK',
    community: 'all',
    mission: 'Magic in a bottle — luxurious but approachable British glamour.',
    heroProducts: ['Magic Cream', 'Flawless Longwear Foundation', 'Pillow Talk Lip & Cheek'],
    priceRange: '$$$',
    skinToneRange: 'I through V (limited very deep shades)',
    notes: 'Among the most beloved luxury brands globally. The Pillow Talk shade has been matched for deeper skin tones by the community — a mauve-brown that works across skin tones.',
    tags: ['luxury', 'british', 'glamour', 'editorial'],
  },

  juvia_place: {
    id: 'juvia_place',
    name: 'Juvia\'s Place',
    founder: 'Chichi Eburu (Nigerian-American)',
    founded: 2014,
    country: 'USA',
    community: 'west-african',
    mission: 'Makeup inspired by the richness of African culture, art, and heritage. Eye shadow palettes that celebrate colour for ALL skin tones.',
    heroProducts: ['The Masquerade Palette', 'The Nubian Palette', 'I Am Magic Foundation'],
    priceRange: '$',
    skinToneRange: 'I through VI — exceptional deep shade range',
    notes: 'The Nigerian-owned beauty brand that makes some of the most pigmented eyeshadow palettes in the industry. Named palettes after African cultures: Nubian, Saharan, Masquerade.',
    tags: ['nigerian', 'west-african', 'affordable', 'pigment', 'cultural', 'eyeshadow'],
  },

  sheamoisture_beauty: {
    id: 'sheamoisture_beauty',
    name: 'SheaMoisture',
    founder: 'Richelieu Dennis (Sierra Leonean-American)',
    founded: 1991,
    country: 'USA',
    community: 'west-african',
    mission: 'Community commerce beauty — authentic ethnic ingredients (shea, coconut, African black soap) for curly, coily, and textured hair and skin.',
    heroProducts: ['100% Extra Virgin Coconut Oil', 'Jamaican Black Castor Oil Treatment', 'African Black Soap Face Wash'],
    priceRange: '$',
    skinToneRange: 'All — ingredient focus not shade focus',
    notes: 'Richelieu Dennis\'s grandmother Sofi Tucker started selling shea butter and African black soap in Sierra Leone in 1912. The brand is literally a 100-year story.',
    tags: ['sierra-leonean', 'west-african', 'shea', 'natural', 'ethnic-ingredients', 'hair-care'],
  },

  sugarbear_hair: {
    id: 'rare_beauty',
    name: 'Rare Beauty',
    founder: 'Selena Gomez (Mexican-American)',
    founded: 2020,
    country: 'USA',
    community: 'latina',
    mission: 'Challenging unrealistic standards of perfection and celebrating what makes you uniquely beautiful.',
    heroProducts: ['Soft Pinch Liquid Blush', 'Positive Light Tinted Moisturizer', 'Kind Words Matte Lipstick'],
    priceRange: '$$',
    skinToneRange: 'I through VI — 48 foundation shades',
    notes: 'Selena Gomez is Mexican-American and created a brand that rejects the airbrushed ideal. The Soft Pinch Liquid Blush works on deep skin tones and sparked a global obsession.',
    tags: ['latina', 'mexican-american', 'inclusive', 'blush', 'authentic'],
  },

  elf_cosmetics: {
    id: 'elf_cosmetics',
    name: 'e.l.f. Cosmetics',
    founder: 'Joseph Shamah & Scott Vincent Borba',
    founded: 2004,
    country: 'USA',
    community: 'all',
    mission: 'Eyes, Lips, Face — inclusive affordable beauty accessible to everyone.',
    heroProducts: ['Halo Glow Liquid Filter', 'Power Grip Primer', 'Monochromatic Multi Stick'],
    priceRange: '$',
    skinToneRange: 'I through VI',
    notes: 'e.l.f.\'s Halo Glow filter became a cultural phenomenon largely through Caribbean and Black-American beauty creators who found it worked beautifully on deep skin.',
    tags: ['affordable', 'drugstore', 'all-communities', 'inclusive'],
  },

};

// ─── PRODUCT RECOMMENDATIONS BY CONCERN ──────────────────────────────────────

export const PRODUCTS_BY_CONCERN = {

  pih_hyperpigmentation: {
    concern: 'PIH & Hyperpigmentation',
    description: 'Post-Inflammatory Hyperpigmentation — the most common skin concern for Fitzpatrick III-VI. Products that address dark spots without bleaching.',
    beautyProducts: [
      { name: 'Fenty Pro Filt\'r Hydrating Foundation', reason: 'Buildable coverage for dark spots without caking' },
      { name: 'Black Radiance True Complexion Foundation', reason: 'Drugstore option with excellent coverage for PIH' },
      { name: 'Too Faced Born This Way Multi-Use Foundation', reason: 'Skin-like coverage with skincare ingredients' },
    ],
    settingProducts: [
      { name: 'Huda Beauty Easy Bake Loose Powder', reason: 'Deep shades don\'t oxidise on darker skin' },
      { name: 'Black Radiance Perfect Tone Pressed Powder', reason: 'Affordable deep tone option' },
    ],
    notes: 'For PIH, choose full-coverage foundations and avoid over-applying concealer which can look cakey. The goal is even skin, not masking.',
  },

  ashiness: {
    concern: 'Ashiness & Grey Cast',
    description: 'Cool-toned or purple-grey finish on dark skin from wrong undertone formulas or zinc-heavy SPF products.',
    solutions: [
      { name: 'Black Girl Sunscreen SPF 30', reason: 'No white cast — specifically formulated for melanin-rich skin' },
      { name: 'Fenty Invisimatte Instant Setting + Blotting Powder', reason: 'Sets without greyness on deep skin' },
      { name: 'Milani Conceal + Perfect 2-in-1 Foundation (Deep shades)', reason: 'Warm-toned for dark skin, no grey cast' },
    ],
    notes: 'Ashiness on dark skin is almost always caused by wrong undertone or formulas containing high levels of titanium dioxide or zinc oxide. Choose chemical SPF or tinted mineral SPF.',
  },

  oiliness: {
    concern: 'Oily Skin & Shine Control',
    description: 'Oily skin is more common in warmer climates and in communities from tropical regions. Formulas must last through humidity and heat.',
    products: [
      { name: 'Fenty Beauty Pro Filt\'r Soft Matte Longwear Foundation', reason: 'Stays matte for 24h — beloved by warm-climate users' },
      { name: 'MAC Studio Fix Fluid SPF15', reason: 'A classic matte finish that has served melanin-rich skin for decades' },
      { name: 'Maybelline Fit Me Matte + Poreless Foundation', reason: 'Affordable option with excellent matte finish for deeper skin' },
    ],
    settingPicks: [
      { name: 'Laura Mercier Translucent Loose Setting Powder', reason: 'Light-catching finish without greyness' },
      { name: 'Make Up Forever HD Skin Setting Powder', reason: 'True translucent performance on deep skin' },
    ],
  },

  dryness_dark_skin: {
    concern: 'Dryness & Dullness on Deep Skin',
    description: 'Dry skin on deep Fitzpatrick tones can look dull, ashy, and lifeless. Products should add luminosity without flashback.',
    products: [
      { name: 'Armani Luminous Silk Foundation', reason: 'The dewy standard for deep skin — luminous, not sparkly' },
      { name: 'NARS Natural Radiant Longwear Foundation (Syrup)', reason: 'Deep warm shade with incredible luminosity' },
      { name: 'Maybelline Superstay Skin Tint (deep shades)', reason: 'Affordable glow-skin tint for deep skin' },
    ],
    highlightPicks: [
      { name: 'Fenty Beauty Killawatt Freestyle Highlighter (Trophy Wife)', reason: 'The gold highlight that launched a thousand imitations' },
      { name: 'Charlotte Tilbury Hollywood Flawless Filter', reason: 'Glow filter that works on deep skin in the right shades' },
    ],
  },

};

// ─── HALL OF FAME PRODUCTS ────────────────────────────────────────────────────

export const HALL_OF_FAME = {
  kohl_pencil: {
    id: 'kohl_pencil',
    product: 'Traditional Kohl / Kajal',
    story: 'Used for thousands of years in Arab, South Asian, North African, and East African cultures. Smudged on the inner waterline and lids. The original "no makeup makeup" for dark and deep-set eyes.',
    modernPick: 'Kulfi Center Stage Kohl Kajal',
    traditionalNote: 'Traditional kohl (antimony-based) has antimicrobial and UV-protective properties — some studies suggest it actually protects the eye. Modern kohl replaces antimony with carbon black.',
    communities: ['arab', 'south-asian', 'east-african', 'north-african'],
    fitzpatrickIdeal: 'I through VI — works on all eye tones',
  },

  castor_oil_brow: {
    id: 'castor_oil_brow',
    product: 'Jamaican Black Castor Oil for Brows',
    story: 'Caribbean hair and eyebrow treatment tradition dating back centuries. The thick, dark castor oil from Jamaican processing was long known to stimulate hair growth.',
    modernPick: 'Tropic Isle Living Jamaican Black Castor Oil',
    traditionalNote: 'Jamaican processing involves roasting the castor beans first — producing a darker oil with more ash content. This differentiates it from Haitian castor oil (used for hair softening) vs. Jamaican (for thickness and growth).',
    communities: ['caribbean', 'black-american', 'west-african'],
    fitzpatrickIdeal: 'All skin tones — brow and lash treatment, not colour',
  },

  turmeric_highlighter: {
    id: 'turmeric_highlighter',
    product: 'Gold Highlighter on Deep Skin',
    story: 'The cultural crossover of turmeric\'s skin-brightening tradition into modern highlighter culture. South Asian communities have used turmeric for ceremonial skin brightness for millennia — the haldi ceremony before weddings literally covers the bride in turmeric.',
    modernPick: 'Fenty Killawatt in Trophy Wife; Pat McGrath Labs Bronze Nectar',
    traditionalNote: 'Turmeric paste (haldi) has documented anti-inflammatory and brightening effects. The ceremonial use predates cosmetics by centuries.',
    communities: ['south-asian', 'west-african', 'black-american', 'east-african'],
    fitzpatrickIdeal: 'IV through VI — warm gold on deep skin is transformative',
  },

  red_lip_melanin: {
    id: 'red_lip_melanin',
    product: 'Red Lipstick on Dark Skin',
    story: 'A deep warm red lip on Fitzpatrick V-VI is one of the most powerful looks in beauty. Celebrated in every deep-skin community — from Nigerian weddings to Black American jazz culture.',
    modernPick: 'MAC Ruby Woo; NYX Soft Matte Lip Cream in Amsterdam; Charlotte Tilbury Pillow Talk Red',
    traditionalNote: 'Red pigment has been applied to lips across African, South Asian, and Amazonian cultures for thousands of years, from ochre and berries to kola nut.',
    communities: ['black-american', 'west-african', 'east-african', 'south-african', 'caribbean'],
    fitzpatrickIdeal: 'IV through VI — the combination is legendary',
  },
};

// ─── QUERY FUNCTIONS ─────────────────────────────────────────────────────────

/**
 * Get ethnic brand by ID
 * @param {string} id
 * @returns {Object|null}
 */
export function getEthnicBrand(id) {
  return ETHNIC_BRANDS[id] || null;
}

/**
 * Get all ethnic brands
 * @returns {Object[]}
 */
export function getAllEthnicBrands() {
  return Object.values(ETHNIC_BRANDS);
}

/**
 * Get ethnic brands for community
 * @param {string} communityId
 * @returns {Object[]}
 */
export function getEthnicBrandsForCommunity(communityId) {
  return Object.values(ETHNIC_BRANDS).filter(b =>
    b.community === communityId || b.community === 'all'
  );
}

/**
 * Get product recommendations for skin concern
 * @param {string} concern
 * @returns {Object|null}
 */
export function getProductsForConcern(concern) {
  return PRODUCTS_BY_CONCERN[concern] || null;
}

/**
 * Get all product concerns
 * @returns {string[]}
 */
export function getAllProductConcerns() {
  return Object.keys(PRODUCTS_BY_CONCERN);
}

/**
 * Get hall of fame product
 * @param {string} id
 * @returns {Object|null}
 */
export function getHallOfFameProduct(id) {
  return HALL_OF_FAME[id] || null;
}

/**
 * Get all hall of fame products
 * @returns {Object[]}
 */
export function getAllHallOfFameProducts() {
  return Object.values(HALL_OF_FAME);
}

/**
 * Search brands by tag
 * @param {string} tag
 * @returns {Object[]}
 */
export function searchBrandsByTag(tag) {
  const norm = tag.toLowerCase();
  return Object.values(ETHNIC_BRANDS).filter(b =>
    (b.tags || []).some(t => t.includes(norm))
  );
}

/**
 * Get affordable brands ($ price range)
 * @returns {Object[]}
 */
export function getAffordableBrands() {
  return Object.values(ETHNIC_BRANDS).filter(b => b.priceRange === '$');
}

/**
 * Get luxury brands
 * @returns {Object[]}
 */
export function getLuxuryBrands() {
  return Object.values(ETHNIC_BRANDS).filter(b =>
    b.priceRange === '$$$' || b.priceRange === '$$$$'
  );
}

// ─── STATS ───────────────────────────────────────────────────────────────────

export const MAKEUP_PRODUCTS_STATS = {
  totalBrands: Object.keys(ETHNIC_BRANDS).length,
  categories: Object.keys(PRODUCT_CATEGORIES).length,
  concerns: Object.keys(PRODUCTS_BY_CONCERN).length,
  hallOfFame: Object.keys(HALL_OF_FAME).length,
  communities: [...new Set(Object.values(ETHNIC_BRANDS).map(b => b.community))],
};

