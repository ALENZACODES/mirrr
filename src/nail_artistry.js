/**
 * nail_artistry.js — Ethnic nail art and nail beauty database for MIRRR
 * Traditional nail art, community trends, techniques, and colour guides
 */

// ─── NAIL ART CATEGORIES ──────────────────────────────────────────────────────

export const NAIL_CATEGORIES = {
  traditional: { id: 'traditional', label: 'Traditional & Cultural', icon: '🌺' },
  festive: { id: 'festive', label: 'Festive & Celebration', icon: '✨' },
  bridal: { id: 'bridal', label: 'Bridal', icon: '💍' },
  everyday: { id: 'everyday', label: 'Everyday', icon: '💅' },
  bold: { id: 'bold', label: 'Bold Statement', icon: '🔥' },
  nature: { id: 'nature', label: 'Nature-Inspired', icon: '🌿' },
  minimal: { id: 'minimal', label: 'Minimal & Clean', icon: '◻️' },
};

// ─── NAIL SHAPE GUIDE ─────────────────────────────────────────────────────────

export const NAIL_SHAPES = {
  coffin: {
    id: 'coffin',
    name: 'Coffin / Ballerina',
    description: 'Long tapered sides with a flat top — dramatic, elongating. The most popular in Black-American and Latina communities.',
    communities: ['black-american', 'latina', 'caribbean'],
    popularityScore: 95,
    lengthRequired: 'Long',
    bestFor: 'Nail art, bold colours, detailed designs',
    tips: 'The flat top gives the most canvas for nail art. Most Instagram-viral nail shapes.',
  },
  almond: {
    id: 'almond',
    name: 'Almond',
    description: 'Tapered sides narrowing to a rounded point. Elegant and feminine.',
    communities: ['arab', 'south-asian', 'latina'],
    popularityScore: 85,
    lengthRequired: 'Medium to long',
    bestFor: 'Classic glamour, florals, nude shades',
    tips: 'The most universally elongating shape — makes fingers look slender.',
  },
  square: {
    id: 'square',
    name: 'Square',
    description: 'Straight sides with a flat top and sharp corners. Clean and precise.',
    communities: ['east-asian', 'all'],
    popularityScore: 75,
    lengthRequired: 'Short to medium',
    bestFor: 'French manicures, minimalist designs, marble',
    tips: 'The original "professional" nail. K-beauty nail art often uses shorter square shape.',
  },
  oval: {
    id: 'oval',
    name: 'Oval',
    description: 'Natural egg shape — a rounded point following the cuticle shape. Classic and versatile.',
    communities: ['all'],
    popularityScore: 80,
    lengthRequired: 'Short to medium',
    bestFor: 'Everyday wear, soft designs, neutral shades',
    tips: 'The easiest shape to maintain. The go-to for natural nail enthusiasts.',
  },
  stiletto: {
    id: 'stiletto',
    name: 'Stiletto / Claw',
    description: 'Very long and sharply pointed like a claw or stiletto heel. Maximum drama.',
    communities: ['black-american', 'caribbean', 'latina'],
    popularityScore: 70,
    lengthRequired: 'Very long (acrylic or gel required typically)',
    bestFor: 'Maximum drama, statement making, festivals and events',
    tips: 'Practical for everyday tasks? No. Stunning? Absolutely.',
  },
  flare: {
    id: 'flare',
    name: 'Duck / Flare',
    description: 'Flared wide at the tip — wider than at the base. 90s revival, strong Latina and Black-American association.',
    communities: ['black-american', 'latina'],
    popularityScore: 65,
    lengthRequired: 'Medium to long',
    bestFor: 'Bold colour, Y2K aesthetics, personality statement',
    tips: 'It\'s a statement. Either you love it or you don\'t. No middle ground.',
  },
};

// ─── NAIL COLOUR GUIDE BY SKIN TONE ──────────────────────────────────────────

export const NAIL_COLOURS_BY_SKIN_TONE = {
  'fitzpatrick-I-II': {
    flattering: ['soft pink', 'baby blue', 'lavender', 'nude peach', 'sheer white', 'mint'],
    avoid: ['very pale nude (disappears on pale skin)'],
    standout: ['classic red', 'deep navy', 'berry'],
    notes: 'Pale skin tones look beautiful in soft pastels and can carry deep jewel tones as a striking contrast.',
  },
  'fitzpatrick-III': {
    flattering: ['rose gold', 'warm coral', 'peach', 'terracotta', 'warm red', 'dusty rose'],
    avoid: ['very cool grey nudes (can look ashy)'],
    standout: ['emerald green', 'rust orange', 'warm burgundy'],
    notes: 'Medium skin tones with warm undertones glow in rose and coral families.',
  },
  'fitzpatrick-IV': {
    flattering: ['burnt orange', 'warm nude (golden)', 'deep red', 'caramel', 'gold', 'chocolate brown'],
    avoid: ['very pale pink (too close to skin)'],
    standout: ['royal blue', 'forest green', 'copper'],
    notes: 'This is the range where neutrals are most nuanced — the right nude makes a huge difference.',
  },
  'fitzpatrick-V': {
    flattering: ['bold red', 'mustard yellow', 'cobalt blue', 'burnt sienna', 'deep plum', 'bright orange'],
    avoid: ['light brown nude (muddy)'],
    standout: ['neon yellow', 'rich purple', 'emerald', 'bright white'],
    notes: 'Deep warm skin tones GLOW in bold colours and warm jewel tones. Don\'t shy away from neons — they pop.',
  },
  'fitzpatrick-VI': {
    flattering: ['bold primary colours', 'neon', 'white', 'deep burgundy', 'vivid green', 'gold'],
    avoid: ['grey or ashy nudes (disappear or look muddy)'],
    standout: ['bright yellow', 'hot pink', 'fire orange', 'electric blue'],
    notes: 'The deepest skin tones are the best canvas for bold and bright colours. Maximum impact on everything vivid.',
  },
};

// ─── NAIL ART STYLES ─────────────────────────────────────────────────────────

export const NAIL_STYLES = {

  // ── TRADITIONAL ──────────────────────────────────────────────────────────

  mehndi_nails: {
    id: 'mehndi_nails',
    name: 'Mehndi / Henna Nail Art',
    category: 'traditional',
    community: 'south-asian',
    description: 'Intricate henna-inspired floral and geometric patterns painted onto nails. Mimics the mehndi designs worn on hands.',
    techniques: ['Nail art liner pen', 'Fine detail brush', 'Stamping with mehndi plates'],
    colourScheme: ['Brown and gold on nude base', 'White henna pattern on deep burgundy', 'Gold on black'],
    occasions: ['Eid', 'Diwali', 'weddings', 'traditional celebrations'],
    difficulty: 4,
    culturalContext: 'Henna on nails pre-dates polished nails by centuries in South Asian culture — the unification of mehndi traditions with modern nail art.',
    tags: ['mehndi', 'henna', 'south-asian', 'floral', 'traditional', 'wedding'],
  },

  arabic_nail_art: {
    id: 'arabic_nail_art',
    name: 'Arabic Geometric Nail Art',
    category: 'traditional',
    community: 'arab',
    description: 'Islamic geometric patterns (arabesque) applied to nails. Stars, tessellations, and intricate geometric forms.',
    techniques: ['Nail tape for geometric lines', 'Stamping', 'Freehand with liner'],
    colourScheme: ['Gold on deep emerald', 'White on midnight blue', 'Rose gold on burgundy'],
    occasions: ['Eid', 'Ramadan events', 'Arabic weddings'],
    difficulty: 4,
    culturalContext: 'Islamic geometric art (arabesque) avoids figural representation and focuses on mathematical perfection. Applied to nails, it creates stunningly complex results.',
    tags: ['arabic', 'geometric', 'arabesque', 'islamic', 'gold', 'traditional', 'celebration'],
  },

  kente_nails: {
    id: 'kente_nails',
    name: 'Kente Cloth Nails',
    category: 'traditional',
    community: 'west-african',
    description: 'The colour-blocked patterns of Kente cloth — the sacred woven textile of the Ashanti people — translated to nails.',
    techniques: ['Nail tape striping', 'Colour blocking', 'Stripes and chevrons'],
    colourScheme: ['Gold, green, red, and black blocks', 'Black and gold stripes', 'Blue, yellow, and red'],
    occasions: ['Ghanaian events', 'African cultural celebrations', 'Juneteenth', 'HBCU events'],
    difficulty: 3,
    culturalContext: 'Kente is handwoven silk and cotton fabric — the most recognisable fabric of Ghana and the Ashanti people. Each colour combination tells a story. Gold = royalty; green = growth; red = passion/political struggle.',
    tags: ['kente', 'ghana', 'west-african', 'colour-block', 'stripes', 'ashanti', 'cultural'],
  },

  rangoli_nails: {
    id: 'rangoli_nails',
    name: 'Rangoli Nail Art',
    category: 'festive',
    community: 'south-asian',
    description: 'Nail art inspired by rangoli — the colourful sand-powder patterns created at entranceways during Diwali and other Hindu festivals.',
    techniques: ['Dotticure (dot tool)', 'Stamping', 'Freehand mandala'],
    colourScheme: ['Multi-colour: pink, yellow, orange, turquoise, white', 'Diwali: gold, red, orange', 'Holi: all colours'],
    occasions: ['Diwali', 'Navratri', 'Holi', 'festive season'],
    difficulty: 4,
    culturalContext: 'Rangoli (Sanskrit: rangavalli) patterns are drawn at entrances to welcome Lakshmi (goddess of wealth and prosperity) into the home. Each festival has traditional colours and patterns.',
    tags: ['rangoli', 'diwali', 'south-asian', 'mandala', 'colourful', 'festive'],
  },

  // ── BRIDAL ───────────────────────────────────────────────────────────────

  south_asian_bridal_nails: {
    id: 'south_asian_bridal_nails',
    name: 'South Asian Bridal Nails',
    category: 'bridal',
    community: 'south-asian',
    description: 'Gold filigree or floral detailing on a rich red or nude base. Designed to complement the mehndi on hands at South Asian weddings.',
    techniques: ['Gold foil', 'Gel with 3D flowers', 'Stamping with gold'],
    colourScheme: ['Red base with gold florals', 'Nude with gold detailing', 'Deep maroon with gold accents'],
    occasions: ['Weddings', 'mehndi night', 'sangeet'],
    difficulty: 4,
    culturalContext: 'The bridal nail must complement but not compete with the mehndi (henna). It traditionally frames the beauty of the mehndi — gold on red is the classic combination.',
    tags: ['bridal', 'south-asian', 'gold', 'red', 'mehndi-complement', 'wedding'],
  },

  nigerian_bridal_nails: {
    id: 'nigerian_bridal_nails',
    name: 'Nigerian Bridal Aso-Ebi Nails',
    category: 'bridal',
    community: 'west-african',
    description: 'Matching nails to the aso-ebi (matching fabric at Nigerian weddings) — often elaborate nail art that complements the gele and aso-oke colours.',
    techniques: ['Custom colour matching', 'Glitter ombre', '3D flowers and jewels'],
    colourScheme: ['Matches aso-ebi: typically gold + aso-oke colour', 'Burgundy and gold', 'Pink champagne with crystals'],
    occasions: ['Nigerian weddings', 'traditional ceremonies', 'owambe parties'],
    difficulty: 3,
    culturalContext: 'At Nigerian weddings, everything coordinate — gele, aso-ebi, nails, makeup. The bridal party\'s nails are chosen to match the colour story of the whole event.',
    tags: ['nigerian', 'bridal', 'aso-ebi', 'owambe', 'west-african', 'matching', 'glam'],
  },

  // ── EVERYDAY / COMMUNITY-SPECIFIC ────────────────────────────────────────

  k_beauty_minimalist_nails: {
    id: 'k_beauty_minimalist_nails',
    name: 'K-Beauty Minimalist Nails',
    category: 'minimal',
    community: 'east-asian',
    description: 'Korean beauty nail aesthetic: clean, short, sheer, or subtle — often with one minimal accent. The anti-maximalism of nails.',
    techniques: ['Sheer jelly finish', 'Single line accent', 'Clean French variations'],
    colourScheme: ['Sheer milky pink', 'Clean white', 'Soft beige', 'Translucent "jelly"'],
    occasions: ['Daily wear', 'office', 'school', 'everyday beauty'],
    difficulty: 1,
    culturalContext: 'K-beauty nail culture favours a "clean and healthy" aesthetic over dramatic nail art. The "glass nail" trend (extremely glossy, subtle) aligns with the glass skin philosophy.',
    tags: ['k-beauty', 'korean', 'minimal', 'clean', 'sheer', 'everyday', 'glass'],
  },

  carnival_nails: {
    id: 'carnival_nails',
    name: 'Caribbean Carnival Nails',
    category: 'festive',
    community: 'caribbean',
    description: 'Maximum glitter, rhinestones, and tropical colour for carnival season. The most maximalist nail expression — celebrating life and culture.',
    techniques: ['Full glitter encapsulation', 'Rhinestone placement', 'Holographic foils'],
    colourScheme: ['Neon yellow + glitter', 'Holographic silver', 'Tropical: turquoise + coral + gold', 'All-glitter everything'],
    occasions: ['Trinidad Carnival', 'Notting Hill Carnival', 'Crop Over (Barbados)', 'any Caribbean festival'],
    difficulty: 3,
    culturalContext: 'Carnival is the most anticipated event in Caribbean culture — costumes, music, food, and every inch of personal expression is maximised. Nails are part of the costume.',
    tags: ['carnival', 'caribbean', 'glitter', 'festival', 'rhinestone', 'neon', 'celebration'],
  },

  afro_punk_nails: {
    id: 'afro_punk_nails',
    name: 'Afropunk Nail Art',
    category: 'bold',
    community: 'black-american',
    description: 'The intersection of Afrocentrism and punk aesthetics — spiked designs, black and gold, chains, afrofuturist elements.',
    techniques: ['Nail charms and chains', 'Matte black with gold accents', 'Geometric designs', 'Mixed media'],
    colourScheme: ['Matte black + gold', 'Black + silver metallic', 'Deep jewel tones + chains', 'Black + cow print (crossover)'],
    occasions: ['Afropunk festival', 'concerts', 'alternative events'],
    difficulty: 4,
    culturalContext: 'Afropunk began as a music scene but is now a full cultural movement. Black people reclaiming punk and alternative spaces — and making it more beautiful in the process.',
    tags: ['afropunk', 'black-american', 'punk', 'alternative', 'matte', 'chain', 'festival'],
  },

  eid_nails: {
    id: 'eid_nails',
    name: 'Eid Celebration Nails',
    category: 'festive',
    community: 'arab',
    description: 'Festive Eid nail art: crescent moon and star motifs, gold accents, and celebratory colour.',
    techniques: ['Crescent moon stamping', 'Gold foil', 'Glitter fade', 'Jewel accent nail'],
    colourScheme: ['Deep green + gold crescent', 'Navy + gold star', 'Nude + gold glitter', 'Rose gold all over'],
    occasions: ['Eid al-Fitr', 'Eid al-Adha', 'Ramadan month events'],
    difficulty: 3,
    culturalContext: 'In Muslim communities globally, Eid is a major beauty occasion — new outfits, new mehndi, and fresh nails. Gold and emerald green are particularly popular Eid colours.',
    tags: ['eid', 'arab', 'south-asian', 'crescent', 'star', 'gold', 'festive', 'celebration'],
  },

  diwali_nails: {
    id: 'diwali_nails',
    name: 'Diwali Nails',
    category: 'festive',
    community: 'south-asian',
    description: 'Warm, glowing, gold-rich nail art for the Festival of Lights. Fireworks, diyas, and mandala motifs.',
    techniques: ['Gold foil', 'Glitter gradient', 'Stamping mandala', 'Firework design', 'Diya motif'],
    colourScheme: ['Gold on deep red', 'Orange-to-gold gradient', 'Midnight blue with gold stars', 'All-over gold glitter'],
    occasions: ['Diwali', 'Navratri (different colour each day)', 'Dhanteras'],
    difficulty: 3,
    culturalContext: 'Diwali (Festival of Lights) is THE most nail-involved festival in South Asian culture. New clothes, new mehndi, new nails. Gold is paramount — Lakshmi loves gold.',
    tags: ['diwali', 'south-asian', 'gold', 'festive', 'mandala', 'warm', 'lights'],
  },

  // ── NATURE-INSPIRED ──────────────────────────────────────────────────────

  tropical_botanicals: {
    id: 'tropical_botanicals',
    name: 'Tropical Botanical Nails',
    category: 'nature',
    community: 'caribbean',
    description: 'Tropical flowers and leaves — hibiscus, plumeria, palm leaves — for a Caribbean island aesthetic.',
    techniques: ['Floral nail art', 'Green leaf brush strokes', 'Tropical print stamping'],
    colourScheme: ['Red hibiscus on coral', 'Plumeria on soft pink', 'Palm on tropical teal'],
    occasions: ['Summer', 'vacations', 'Caribbean events', 'tropical weddings'],
    difficulty: 3,
    culturalContext: 'The hibiscus flower is particularly iconic — it\'s the national flower of Malaysia but also central to Caribbean identity (Jamaica\'s sorrel drink, Hawaii\'s flower).',
    tags: ['tropical', 'botanical', 'hibiscus', 'caribbean', 'floral', 'nature'],
  },

};

// ─── NAIL PRODUCT RECOMMENDATIONS ────────────────────────────────────────────

export const NAIL_PRODUCT_PICKS = {
  nudes_for_deep_skin: {
    category: 'Nude Polishes for Fitzpatrick V-VI',
    description: 'The right nude for deep skin is warm-toned, not pink or grey. These shades disappear on pale skin but glow on deep melanin.',
    shades: [
      { name: 'OPI "Espresso Your Style"', hex: '#4A2C1A', notes: 'Deep warm brown — perfect "my nails but better" for Fitzpatrick VI' },
      { name: 'Fenty Beauty "#WokeUpLikeThis"', hex: '#C07B5A', notes: 'Warm caramel nude for Fitzpatrick IV-V' },
      { name: 'Zoya "Chantal"', hex: '#A06B4D', notes: 'Golden bronze nude — stunning on warm Fitzpatrick V' },
      { name: 'Essie "Topless and Barefoot"', hex: '#D4A574', notes: 'Peachy-warm for lighter deep skin tones, Fitzpatrick IV' },
    ],
  },
  deep_reds_melanin: {
    category: 'Deep Reds for Melanin-Rich Skin',
    description: 'Dark reds and wines are universally stunning on deep skin — these shades avoid the "too orange" trap.',
    shades: [
      { name: 'OPI "Malaga Wine"', hex: '#5C1A2E', notes: 'Deep wine — timeless' },
      { name: 'CND "Rouge Rite"', hex: '#8B1A2B', notes: 'Perfect classic deep red' },
      { name: 'Essie "Bordeaux"', hex: '#4A0E1A', notes: 'Near-black deep burgundy — iconic' },
    ],
  },
  bold_brights_dark_skin: {
    category: 'Bright Colours for Deep Skin Tones',
    description: 'On Fitzpatrick V-VI, bold and bright colours have maximum impact. These are the standouts.',
    shades: [
      { name: 'Zoya "Tanzy"', hex: '#FF6B35', notes: 'Vivid orange — incredible on dark skin' },
      { name: 'OPI "I Just Can\'t Cope-Acabana"', hex: '#FF69B4', notes: 'Hot pink — electric on deep skin' },
      { name: 'Essie "Butler Please"', hex: '#1A1A5E', notes: 'Deep cobalt navy — stunning' },
      { name: 'CND "Bicycle Yellow"', hex: '#F9D71C', notes: 'Yellow on dark skin = one of the most stunning combinations in beauty' },
    ],
  },
};

// ─── QUERY FUNCTIONS ─────────────────────────────────────────────────────────

/**
 * Get nail style by ID
 * @param {string} id
 * @returns {Object|null}
 */
export function getNailStyle(id) {
  return NAIL_STYLES[id] || null;
}

/**
 * Get nail styles for community
 * @param {string} communityId
 * @returns {Object[]}
 */
export function getNailStylesForCommunity(communityId) {
  return Object.values(NAIL_STYLES).filter(s => s.community === communityId);
}

/**
 * Get nail styles for occasion
 * @param {string} occasion e.g. 'bridal', 'festive'
 * @returns {Object[]}
 */
export function getNailStylesByCategory(category) {
  return Object.values(NAIL_STYLES).filter(s => s.category === category);
}

/**
 * Get nail colour recommendations for fitzpatrick level
 * @param {string} fitzpatrick
 * @returns {Object|null}
 */
export function getNailColoursForFitzpatrick(fitzpatrick) {
  const key = `fitzpatrick-${fitzpatrick}`;
  return NAIL_COLOURS_BY_SKIN_TONE[key] || null;
}

/**
 * Get bridal nail styles
 * @returns {Object[]}
 */
export function getBridalNailStyles() {
  return Object.values(NAIL_STYLES).filter(s => s.category === 'bridal');
}

/**
 * Get festive nail styles
 * @returns {Object[]}
 */
export function getFestiveNailStyles() {
  return Object.values(NAIL_STYLES).filter(s => s.category === 'festive');
}

/**
 * Get all nail shapes
 * @returns {Object[]}
 */
export function getAllNailShapes() {
  return Object.values(NAIL_SHAPES);
}

/**
 * Search nail styles by tag
 * @param {string} tag
 * @returns {Object[]}
 */
export function searchNailStylesByTag(tag) {
  const norm = tag.toLowerCase();
  return Object.values(NAIL_STYLES).filter(s =>
    (s.tags || []).some(t => t.includes(norm))
  );
}

// ─── STATS ───────────────────────────────────────────────────────────────────

export const NAIL_STATS = {
  totalStyles: Object.keys(NAIL_STYLES).length,
  categories: Object.keys(NAIL_CATEGORIES).length,
  shapes: Object.keys(NAIL_SHAPES).length,
  communities: [...new Set(Object.values(NAIL_STYLES).map(s => s.community))],
  bridalStyles: Object.values(NAIL_STYLES).filter(s => s.category === 'bridal').length,
  festiveStyles: Object.values(NAIL_STYLES).filter(s => s.category === 'festive').length,
};

