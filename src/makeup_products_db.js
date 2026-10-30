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
    
    skinToneRange: 'I through VI — 50+ foundation shades',
    notes: 'Fenty\'s 40-shade launch in 2017 pushed many other brands to widen their shade ranges.',
    tags: ['inclusive', 'black-founded', 'barbadian', 'deep-skin', 'all-skin-tones'],
  },

  pat_mcgrath_labs: {
    id: 'pat_mcgrath_labs',
    name: 'Pat McGrath Labs',
    founder: 'Dame Pat McGrath',
    founded: 2015,
    country: 'UK (British-Caribbean founder)',
    community: 'black-american',
    mission: 'Luxury, editorial makeup from makeup artist Dame Pat McGrath.',
    heroProducts: ['Skin Fetish Foundation', 'Lust 004 Lip Kit', 'Mothership Eye Palettes'],
    
    skinToneRange: 'I through VI — outstanding deep shade range',
    notes: 'Dame Pat McGrath is a British makeup artist of Jamaican heritage. The foundation range includes deep shades.',
    tags: ['luxury', 'black-british', 'caribbean', 'artistry', 'editorial'],
  },

  black_opal: {
    id: 'black_opal',
    name: 'Black Opal',
    founder: 'Founded by beauty professionals for Black women',
    founded: 1994,
    country: 'USA',
    community: 'black-american',
    mission: 'A beauty brand created for darker skin tones, more than 20 years before Fenty.',
    heroProducts: ['True Color Foundation'],
    
    skinToneRange: 'V through VI primarily',
    notes: 'Has made products for Black skin since 1994, long before the \'inclusive beauty\' conversation.',
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
    heroProducts: ['Underlined Kajal Eyeliner'],
    
    skinToneRange: 'III through V (South Asian skin focus)',
    notes: 'Founded to bring South Asian faces and shades into beauty. Named after the South Asian frozen dessert.',
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
    
    skinToneRange: 'I through V',
    notes: 'Clean formulas in a range of shades, including the Slip Tint.',
    tags: ['clean', 'inclusive', 'dewy', 'all-communities'],
  },

  huda_beauty: {
    id: 'huda_beauty',
    name: 'Huda Beauty',
    founder: 'Huda Kattan (Iraqi-American)',
    founded: 2013,
    country: 'UAE/USA',
    community: 'arab',
    mission: 'Dubai-born makeup brand known for full-coverage, highly pigmented products.',
    heroProducts: ['Easy Bake Setting Powder', 'GloWish Foundation', '#FauxFilter Foundation', 'Liquid Matte Lipstick'],
    
    skinToneRange: 'I through VI — strong deep shade selection',
    
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
    heroProducts: ['Magic Cream', 'Airbrush Flawless Foundation', 'Pillow Talk Matte Revolution Lipstick'],
    
    skinToneRange: 'I through V (limited very deep shades)',
    notes: 'A British luxury brand; the Pillow Talk line is a pink-nude family. The foundation range has fewer very deep shades.',
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
    
    skinToneRange: 'I through VI — exceptional deep shade range',
    notes: 'A Nigerian-owned brand known for highly pigmented eyeshadow palettes named after African cultures: Nubian, Saharan, Masquerade.',
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
    
    skinToneRange: 'All — ingredient focus not shade focus',
    notes: 'Richelieu Dennis\'s grandmother Sofi Tucker started selling shea butter and African black soap in Sierra Leone in 1912. The brand is literally a 100-year story.',
    tags: ['sierra-leonean', 'west-african', 'shea', 'natural', 'ethnic-ingredients', 'hair-care'],
  },

  rare_beauty: {
    id: 'rare_beauty',
    name: 'Rare Beauty',
    founder: 'Selena Gomez (Mexican-American)',
    founded: 2020,
    country: 'USA',
    community: 'latina',
    mission: 'Challenging unrealistic standards of perfection and celebrating what makes you uniquely beautiful.',
    heroProducts: ['Soft Pinch Liquid Blush', 'Positive Light Tinted Moisturizer', 'Kind Words Matte Lipstick'],
    
    skinToneRange: 'I through VI — 48 foundation shades',
    notes: 'Selena Gomez is Mexican-American and created a brand that rejects the airbrushed ideal. The Soft Pinch Liquid Blush comes in shades that show on deep skin.',
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
    
    skinToneRange: 'I through VI',
    notes: 'Affordable, with Halo Glow Liquid Filter shades for deep skin.',
    tags: ['affordable', 'drugstore', 'all-communities', 'inclusive'],
  },

};

// ─── PRODUCT RECOMMENDATIONS BY CONCERN ──────────────────────────────────────

export const PRODUCTS_BY_CONCERN = {

  pih_hyperpigmentation: {
    concern: 'PIH & Hyperpigmentation',
    description: 'Post-Inflammatory Hyperpigmentation — a frequent concern on Fitzpatrick III-VI skin. Products that address dark spots without bleaching.',
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
    description: 'Heat and humidity make shine harder to control. Formulas must last through humidity and heat.',
    products: [
      { name: 'Fenty Beauty Pro Filt\'r Soft Matte Longwear Foundation', reason: 'Long-wearing soft-matte finish' },
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
    modernPick: 'Kulfi Underlined Kajal Eyeliner',
    
    communities: ['arab', 'south-asian', 'east-african', 'north-african'],
    fitzpatrickIdeal: 'I through VI — works on all eye tones',
  },

  castor_oil_brow: {
    id: 'castor_oil_brow',
    product: 'Jamaican Black Castor Oil for Brows',
    story: 'Caribbean hair and eyebrow treatment tradition dating back centuries. The thick, dark castor oil from Jamaican processing is a long-standing brow and hair-care tradition; it seals in moisture, but growth claims are unproven.',
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
    modernPick: 'MAC Ruby Woo; NYX Soft Matte Lip Cream in Amsterdam',
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



// ─── STATS ───────────────────────────────────────────────────────────────────

