/**
 * MIRRR — Hair Painter & Colour Visualizer
 * Comprehensive textured hair colour, texture, and style database
 * Your Taste. Your Looks. Your Style.
 */

// ===========================================================================
// HAIR COLOURS — 80 entries covering the full spectrum of textured hair beauty
// ===========================================================================

export const HAIR_COLOURS = {
  // ── Natural black and brown shades ──
  jet_black: {
    id: 'jet_black', label: 'Jet Black', hexCode: '#0a0a0a',
    rgbBase: [10, 10, 10], category: 'natural', culturalContext: 'The foundational hair colour across South Asian, East Asian, Arab, and East African communities. Associated with youth, vitality, and traditional beauty.',
    warmth: 'neutral', intensity: 1.0, season: ['all'],
    communities: ['south-asian','east-asian','arab','east-african','west-african','south-african','caribbean','black-american','latina'],
  },
  blue_black: {
    id: 'blue_black', label: 'Blue Black', hexCode: '#0d0d1a',
    rgbBase: [13, 13, 26], category: 'natural', culturalContext: 'Common across East Asian and South Asian hair — the natural blue-black sheen of healthy melanated hair. Celebrated in K-beauty and Bollywood aesthetics.',
    warmth: 'cool', intensity: 1.0, season: ['all'],
    communities: ['east-asian','south-asian','arab','east-african'],
  },
  soft_black: {
    id: 'soft_black', label: 'Soft Black', hexCode: '#1a1a1a',
    rgbBase: [26, 26, 26], category: 'natural', culturalContext: 'A slightly lifted black that photographs beautifully under warm studio lighting. Popular for Bollywood and Nigerian film productions.',
    warmth: 'neutral', intensity: 0.95, season: ['all'],
    communities: ['south-asian','west-african','black-american','caribbean'],
  },
  espresso: {
    id: 'espresso', label: 'Espresso Brown', hexCode: '#2c1810',
    rgbBase: [44, 24, 16], category: 'natural', culturalContext: 'Deep warm brown seen across Latina, Arab, and mixed-heritage communities. Complements olive and warm deep skin tones.',
    warmth: 'warm', intensity: 0.9, season: ['autumn','winter'],
    communities: ['latina','arab','south-asian','west-african','black-american'],
  },
  dark_chocolate: {
    id: 'dark_chocolate', label: 'Dark Chocolate', hexCode: '#3b1f0e',
    rgbBase: [59, 31, 14], category: 'natural', culturalContext: 'Rich deep brown that catches red undertones in sunlight. A staple in Caribbean and West African natural hair communities.',
    warmth: 'warm', intensity: 0.85, season: ['autumn','winter'],
    communities: ['caribbean','west-african','black-american','south-african','east-african'],
  },
  mahogany: {
    id: 'mahogany', label: 'Mahogany', hexCode: '#4a1c1c',
    rgbBase: [74, 28, 28], category: 'natural', culturalContext: 'Red-brown shade with West African and Caribbean roots. Named after mahogany trees native to tropical regions.',
    warmth: 'warm', intensity: 0.8, season: ['autumn'],
    communities: ['west-african','caribbean','black-american','south-african'],
  },
  chestnut: {
    id: 'chestnut', label: 'Chestnut Brown', hexCode: '#6b3a2a',
    rgbBase: [107, 58, 42], category: 'natural', culturalContext: 'Mid-depth warm brown popular in Latina and Arab communities for its rich, sun-kissed quality.',
    warmth: 'warm', intensity: 0.7, season: ['spring','autumn'],
    communities: ['latina','arab','south-asian','east-asian'],
  },
  warm_brown: {
    id: 'warm_brown', label: 'Warm Brown', hexCode: '#7b4f35',
    rgbBase: [123, 79, 53], category: 'natural', culturalContext: 'Versatile brown that works across seasons. Common in Afro-Latina and Caribbean communities as a natural-looking lift.',
    warmth: 'warm', intensity: 0.65, season: ['spring','summer','autumn'],
    communities: ['latina','caribbean','black-american','west-african'],
  },
  cinnamon: {
    id: 'cinnamon', label: 'Cinnamon', hexCode: '#8b4a2f',
    rgbBase: [139, 74, 47], category: 'natural', culturalContext: 'Spice-inspired warm brown with deep cultural resonance in South Asian and Middle Eastern communities. Associated with warmth and abundance.',
    warmth: 'warm', intensity: 0.7, season: ['autumn','winter'],
    communities: ['south-asian','arab','latina','caribbean','west-african'],
  },
  hazel_brown: {
    id: 'hazel_brown', label: 'Hazel Brown', hexCode: '#8b6914',
    rgbBase: [139, 105, 20], category: 'natural', culturalContext: 'Golden-brown shade popular in Arab Gulf states for its luxurious sun-bleached appearance.',
    warmth: 'warm', intensity: 0.6, season: ['spring','summer'],
    communities: ['arab','latina','east-asian'],
  },

  // ── Reds & Auburns ──
  deep_auburn: {
    id: 'deep_auburn', label: 'Deep Auburn', hexCode: '#6b2020',
    rgbBase: [107, 32, 32], category: 'natural', culturalContext: 'Rich red-brown, a popular henna-adjacent shade on dark hair.',
    warmth: 'warm', intensity: 0.85, season: ['autumn','winter'],
    communities: ['east-african','west-african','black-american','caribbean'],
  },
  burgundy: {
    id: 'burgundy', label: 'Burgundy Wine', hexCode: '#6b1a2e',
    rgbBase: [107, 26, 46], category: 'bold', culturalContext: 'Deep wine red that became iconic in Black American beauty culture during the 1990s. Now a global staple for melanated communities seeking drama without bleach.',
    warmth: 'cool', intensity: 0.9, season: ['autumn','winter'],
    communities: ['black-american','west-african','caribbean','south-african'],
  },
  fire_red: {
    id: 'fire_red', label: 'Fire Red', hexCode: '#cc2200',
    rgbBase: [204, 34, 0], category: 'bold', culturalContext: 'Statement red embraced by Afrobeats artists and carnival performers. Represents confidence and cultural pride.',
    warmth: 'warm', intensity: 1.0, season: ['all'],
    communities: ['west-african','black-american','caribbean','south-african'],
  },
  copper_red: {
    id: 'copper_red', label: 'Copper Red', hexCode: '#b5651d',
    rgbBase: [181, 101, 29], category: 'bold', culturalContext: 'Metallic warm red popular in K-beauty and Afrofuturist aesthetics. Flatters warm and neutral undertones especially on deeper skin.',
    warmth: 'warm', intensity: 0.85, season: ['autumn'],
    communities: ['east-asian','black-american','west-african','caribbean'],
  },
  brick_red: {
    id: 'brick_red', label: 'Brick Red', hexCode: '#9b3a2a',
    rgbBase: [155, 58, 42], category: 'bold', culturalContext: 'Earthy red-brown with roots in West African textile and body art traditions.',
    warmth: 'warm', intensity: 0.8, season: ['autumn','winter'],
    communities: ['west-african','south-african','east-african','black-american'],
  },
  rose_gold_deep: {
    id: 'rose_gold_deep', label: 'Deep Rose Gold', hexCode: '#c27a7a',
    rgbBase: [194, 122, 122], category: 'bold', culturalContext: 'Rose gold adapted for deeper skin tones — warm pink with enough depth to show on melanated hair. K-beauty and Bollywood fusion trend.',
    warmth: 'warm', intensity: 0.7, season: ['spring','summer'],
    communities: ['east-asian','south-asian','black-american','latina'],
  },

  // ── Blondes (for darker skin) ──
  honey_blonde: {
    id: 'honey_blonde', label: 'Honey Blonde', hexCode: '#d4a017',
    rgbBase: [212, 160, 23], category: 'bold', culturalContext: 'Warm golden blonde that became a symbol of Black empowerment and self-expression. Iconic on Black women since the early 2000s.',
    warmth: 'warm', intensity: 0.75, season: ['spring','summer'],
    communities: ['black-american','west-african','caribbean','south-african'],
  },
  golden_blonde: {
    id: 'golden_blonde', label: 'Golden Blonde', hexCode: '#e8c46a',
    rgbBase: [232, 196, 106], category: 'bold', culturalContext: 'Sun-kissed blonde popularised by Caribbean beach culture and Afro-Latina communities.',
    warmth: 'warm', intensity: 0.65, season: ['summer'],
    communities: ['caribbean','latina','black-american'],
  },
  platinum_statement: {
    id: 'platinum_statement', label: 'Platinum Statement', hexCode: '#e8e0d0',
    rgbBase: [232, 224, 208], category: 'bold', culturalContext: 'Platinum blonde as power statement — a deliberate subversion of Western beauty standards, reclaimed by Black women. Kim K cultural moment but long preceded by Black artistic tradition.',
    warmth: 'cool', intensity: 0.5, season: ['all'],
    communities: ['black-american','west-african','south-african','caribbean'],
  },
  butterscotch: {
    id: 'butterscotch', label: 'Butterscotch', hexCode: '#d4954a',
    rgbBase: [212, 149, 74], category: 'bold', culturalContext: 'Warm caramel-blonde loved in West African and Caribbean communities for its brightness against deep skin.',
    warmth: 'warm', intensity: 0.7, season: ['spring','summer','autumn'],
    communities: ['west-african','caribbean','black-american','latina'],
  },
  caramel: {
    id: 'caramel', label: 'Caramel', hexCode: '#c68642',
    rgbBase: [198, 134, 66], category: 'natural', culturalContext: 'Warm mid-tone brown associated with mixed-heritage beauty and Afro-Latina culture.',
    warmth: 'warm', intensity: 0.7, season: ['spring','autumn'],
    communities: ['latina','caribbean','black-american','west-african'],
  },

  // ── Fantasy & Bold ──
  electric_blue: {
    id: 'electric_blue', label: 'Electric Blue', hexCode: '#0044cc',
    rgbBase: [0, 68, 204], category: 'bold', culturalContext: 'Afrofuturist blue — bold, sci-fi, otherworldly. Popularised by Black American editorial culture and Nigerian music video aesthetics.',
    warmth: 'cool', intensity: 1.0, season: ['all'],
    communities: ['black-american','west-african','south-african','caribbean'],
  },
  cobalt_blue: {
    id: 'cobalt_blue', label: 'Cobalt Blue', hexCode: '#0047ab',
    rgbBase: [0, 71, 171], category: 'bold', culturalContext: 'Deep saturated blue with ties to North African ceramic and textile traditions. Tuareg blue heritage.',
    warmth: 'cool', intensity: 0.95, season: ['autumn','winter'],
    communities: ['arab','west-african','black-american','east-african'],
  },
  emerald_green: {
    id: 'emerald_green', label: 'Emerald Green', hexCode: '#009966',
    rgbBase: [0, 153, 102], category: 'bold', culturalContext: 'Jewel-toned green resonant with West African and Caribbean festivals. Nigerian fashion editorial staple.',
    warmth: 'cool', intensity: 1.0, season: ['all'],
    communities: ['west-african','caribbean','black-american','east-african'],
  },
  forest_green: {
    id: 'forest_green', label: 'Forest Green', hexCode: '#228b22',
    rgbBase: [34, 139, 34], category: 'bold', culturalContext: 'Nature-inspired green popular in Afrocentric natural beauty communities.',
    warmth: 'neutral', intensity: 0.9, season: ['autumn','winter'],
    communities: ['black-american','west-african','south-african','east-african'],
  },
  purple_plum: {
    id: 'purple_plum', label: 'Purple Plum', hexCode: '#6a0dad',
    rgbBase: [106, 13, 173], category: 'bold', culturalContext: 'Regal purple with ties to royalty across African and South Asian cultures. Bollywood and Nollywood editorial staple.',
    warmth: 'cool', intensity: 1.0, season: ['autumn','winter'],
    communities: ['south-asian','black-american','west-african','caribbean'],
  },
  lavender: {
    id: 'lavender', label: 'Soft Lavender', hexCode: '#b57bee',
    rgbBase: [181, 123, 238], category: 'bold', culturalContext: 'Pastel purple popularised by K-beauty and J-beauty aesthetics. Works beautifully on lightened dark hair.',
    warmth: 'cool', intensity: 0.6, season: ['spring','summer'],
    communities: ['east-asian','black-american','south-asian','latina'],
  },
  hot_pink: {
    id: 'hot_pink', label: 'Hot Pink', hexCode: '#ff69b4',
    rgbBase: [255, 105, 180], category: 'bold', culturalContext: 'Bold pink worn at Caribbean carnival, Afrobeats concerts, and Nicki Minaj-inspired looks. Playful, powerful, unapologetic.',
    warmth: 'warm', intensity: 0.9, season: ['spring','summer'],
    communities: ['caribbean','black-american','west-african','latina'],
  },
  fuchsia: {
    id: 'fuchsia', label: 'Fuchsia', hexCode: '#cc0066',
    rgbBase: [204, 0, 102], category: 'bold', culturalContext: 'Deep saturated pink-magenta popular in South Asian bridal adjacent looks and West African celebration aesthetics.',
    warmth: 'warm', intensity: 1.0, season: ['all'],
    communities: ['south-asian','west-african','black-american','latina'],
  },
  coral: {
    id: 'coral', label: 'Coral', hexCode: '#ff7f50',
    rgbBase: [255, 127, 80], category: 'bold', culturalContext: 'Warm tropical coral beloved in Caribbean and West African summer aesthetics.',
    warmth: 'warm', intensity: 0.75, season: ['spring','summer'],
    communities: ['caribbean','west-african','latina','black-american'],
  },
  tangerine: {
    id: 'tangerine', label: 'Tangerine', hexCode: '#ff8c00',
    rgbBase: [255, 140, 0], category: 'bold', culturalContext: 'Vibrant orange-gold embraced in Afrobeats culture and Nigerian street fashion.',
    warmth: 'warm', intensity: 0.85, season: ['summer','autumn'],
    communities: ['west-african','black-american','caribbean','south-african'],
  },

  // ── Ombré & Gradient Styles ──
  black_to_burgundy: {
    id: 'black_to_burgundy', label: 'Black to Burgundy Ombré', hexCode: '#3d0020',
    rgbBase: [61, 0, 32], category: 'ombre', culturalContext: 'A classic protective style ombré — roots stay natural dark while ends deepen to burgundy. Beloved in Black American and West African wig culture.',
    warmth: 'cool', intensity: 0.85, season: ['autumn','winter'],
    communities: ['black-american','west-african','caribbean','south-african'],
  },
  brown_to_honey: {
    id: 'brown_to_honey', label: 'Brown to Honey Ombré', hexCode: '#c68642',
    rgbBase: [198, 134, 66], category: 'ombre', culturalContext: 'Sun-kissed ombré popular in Caribbean and Latina communities. Mimics natural lightening from sun exposure.',
    warmth: 'warm', intensity: 0.7, season: ['spring','summer'],
    communities: ['latina','caribbean','black-american','west-african'],
  },
  black_to_blue: {
    id: 'black_to_blue', label: 'Black to Blue Ombré', hexCode: '#003399',
    rgbBase: [0, 51, 153], category: 'ombre', culturalContext: 'Afrofuturist ombré — dark roots melting into deep blue. Seen on Afrobeats stages and editorial covers.',
    warmth: 'cool', intensity: 0.9, season: ['all'],
    communities: ['black-american','west-african','south-african','caribbean'],
  },
  dark_to_purple: {
    id: 'dark_to_purple', label: 'Dark to Purple Ombré', hexCode: '#5500aa',
    rgbBase: [85, 0, 170], category: 'ombre', culturalContext: 'Deep purple gradient that works without full bleaching on dark hair. Popular in South African and West African beauty communities.',
    warmth: 'cool', intensity: 0.9, season: ['all'],
    communities: ['south-african','west-african','black-american','caribbean'],
  },
  brown_to_red: {
    id: 'brown_to_red', label: 'Brown to Red Ombré', hexCode: '#8b1a1a',
    rgbBase: [139, 26, 26], category: 'ombre', culturalContext: 'Rich autumn ombré popular in East African and West African communities. Deep and dramatic.',
    warmth: 'warm', intensity: 0.85, season: ['autumn','winter'],
    communities: ['east-african','west-african','black-american','south-african'],
  },
  black_to_caramel: {
    id: 'black_to_caramel', label: 'Black to Caramel Balayage', hexCode: '#c68642',
    rgbBase: [198, 134, 66], category: 'ombre', culturalContext: 'Natural-looking balayage for darker skin tones. Popular in Brazilian and Caribbean salons where warmth is prized.',
    warmth: 'warm', intensity: 0.65, season: ['spring','summer','autumn'],
    communities: ['latina','caribbean','black-american','west-african'],
  },

  // ── Cultural / Ceremonial ──
  henna_red: {
    id: 'henna_red', label: 'Henna Red', hexCode: '#8b3a1a',
    rgbBase: [139, 58, 26], category: 'cultural', culturalContext: 'Natural henna produces this warm red-orange on dark hair. Used across South Asian, Arab, North African, and East African communities for centuries.',
    warmth: 'warm', intensity: 0.75, season: ['all'],
    communities: ['south-asian','arab','east-african','west-african'],
  },
  indigo_blue: {
    id: 'indigo_blue', label: 'Indigo Blue', hexCode: '#3f00ff',
    rgbBase: [63, 0, 255], category: 'cultural', culturalContext: 'Indigo was a traditional natural dye for hair and textiles across West Africa. The colour carries deep cultural and spiritual meaning.',
    warmth: 'cool', intensity: 0.9, season: ['all'],
    communities: ['west-african','east-african','south-asian'],
  },
  kente_gold: {
    id: 'kente_gold', label: 'Kente Gold', hexCode: '#ffd700',
    rgbBase: [255, 215, 0], category: 'cultural', culturalContext: 'Inspired by Ghanaian Kente cloth — gold represents royalty, wealth, and high status in Akan culture. Bold and celebratory.',
    warmth: 'warm', intensity: 0.95, season: ['all'],
    communities: ['west-african','black-american','south-african','caribbean'],
  },
  saffron_yellow: {
    id: 'saffron_yellow', label: 'Saffron Yellow', hexCode: '#ff9900',
    rgbBase: [255, 153, 0], category: 'cultural', culturalContext: 'Sacred colour in Hindu traditions. Associated with festivals, devotion, and celebration in South Asian communities.',
    warmth: 'warm', intensity: 0.9, season: ['spring','summer'],
    communities: ['south-asian','east-african'],
  },
  mehndi_orange: {
    id: 'mehndi_orange', label: 'Mehndi Orange', hexCode: '#d4621a',
    rgbBase: [212, 98, 26], category: 'cultural', culturalContext: 'The rich orange of fresh mehndi on skin — translated to hair for Mehndi Night events and South Asian fusion looks.',
    warmth: 'warm', intensity: 0.85, season: ['all'],
    communities: ['south-asian','arab'],
  },
  carnival_red: {
    id: 'carnival_red', label: 'Carnival Red', hexCode: '#e00000',
    rgbBase: [224, 0, 0], category: 'cultural', culturalContext: 'The bold red of Trinidad Carnival costumes. Worn in hair to complete the full carnival look.',
    warmth: 'warm', intensity: 1.0, season: ['all'],
    communities: ['caribbean','west-african','black-american','latina'],
  },
  diwali_gold: {
    id: 'diwali_gold', label: 'Diwali Gold', hexCode: '#ffcc00',
    rgbBase: [255, 204, 0], category: 'cultural', culturalContext: 'The golden glow of Diwali diyas — celebratory and luminous. Used in South Asian editorial beauty for Diwali season.',
    warmth: 'warm', intensity: 0.9, season: ['autumn'],
    communities: ['south-asian'],
  },
  amapiano_silver: {
    id: 'amapiano_silver', label: 'Amapiano Silver', hexCode: '#c0c0c0',
    rgbBase: [192, 192, 192], category: 'cultural', culturalContext: 'Chrome and silver hues reflecting the futuristic aesthetic of South African Amapiano music culture.',
    warmth: 'cool', intensity: 0.7, season: ['all'],
    communities: ['south-african','west-african','black-american'],
  },

  // ── K-Beauty Inspired ──
  ash_brown: {
    id: 'ash_brown', label: 'Ash Brown', hexCode: '#7c6857',
    rgbBase: [124, 104, 87], category: 'natural', culturalContext: 'Cool-toned brown dominant in K-beauty and J-beauty. The grey undertone creates a sophisticated, fashion-forward look.',
    warmth: 'cool', intensity: 0.6, season: ['autumn','winter'],
    communities: ['east-asian','south-asian','latina'],
  },
  rose_brown: {
    id: 'rose_brown', label: 'Rose Brown', hexCode: '#b08060',
    rgbBase: [176, 128, 96], category: 'natural', culturalContext: 'Pink-tinted brown from K-beauty runways. Soft and feminine with warm undertones.',
    warmth: 'warm', intensity: 0.6, season: ['spring'],
    communities: ['east-asian','south-asian','latina','black-american'],
  },
  mushroom_blonde: {
    id: 'mushroom_blonde', label: 'Mushroom Blonde', hexCode: '#b5a090',
    rgbBase: [181, 160, 144], category: 'natural', culturalContext: 'Beige-grey blonde popularised in Korea — earthy, muted, and effortlessly chic.',
    warmth: 'neutral', intensity: 0.5, season: ['autumn','winter'],
    communities: ['east-asian','latina','south-asian'],
  },
  silver_grey: {
    id: 'silver_grey', label: 'Silver Grey', hexCode: '#a8a8b0',
    rgbBase: [168, 168, 176], category: 'bold', culturalContext: 'Silver-grey has been reclaimed across multiple communities as a power move — Afrofuturist, K-beauty, and elder wisdom aesthetics.',
    warmth: 'cool', intensity: 0.5, season: ['all'],
    communities: ['black-american','east-asian','south-asian','west-african'],
  },

  // ── Protective Style Compatible ──
  natural_4c: {
    id: 'natural_4c', label: 'Natural 4C (Uncoloured)', hexCode: '#1a0a00',
    rgbBase: [26, 10, 0], category: 'natural', culturalContext: 'The celebration of natural 4C texture in its uncoloured state. The natural hair movement reclaimed this as the standard of Black beauty.',
    warmth: 'warm', intensity: 1.0, season: ['all'],
    communities: ['west-african','east-african','south-african','black-american','caribbean'],
  },
  locs_brown: {
    id: 'locs_brown', label: 'Loc Brown', hexCode: '#3d2010',
    rgbBase: [61, 32, 16], category: 'natural', culturalContext: 'The natural colour of mature locs — a deep, warm brown with golden undertones that develops over years. Sacred in Rastafari and many African spiritual traditions.',
    warmth: 'warm', intensity: 0.85, season: ['all'],
    communities: ['caribbean','west-african','east-african','black-american','south-african'],
  },
  braids_black: {
    id: 'braids_black', label: 'Box Braid Black', hexCode: '#080808',
    rgbBase: [8, 8, 8], category: 'natural', culturalContext: 'The classic colour for kanekalon braiding hair. Box braids have ancient roots in African cultures — protective, practical, and deeply expressive.',
    warmth: 'neutral', intensity: 1.0, season: ['all'],
    communities: ['west-african','black-american','caribbean','east-african','south-african'],
  },
  wig_lace_brown: {
    id: 'wig_lace_brown', label: 'Lace Front Brown', hexCode: '#4a2c1a',
    rgbBase: [74, 44, 26], category: 'natural', culturalContext: 'The most purchased wig colour globally in Black beauty markets — a natural-looking medium brown that complements most deep and medium skin tones.',
    warmth: 'warm', intensity: 0.75, season: ['all'],
    communities: ['black-american','west-african','south-african','caribbean'],
  },

  // ── Highend & Editorial ──
  chrome_silver: {
    id: 'chrome_silver', label: 'Chrome Silver', hexCode: '#d8d8e0',
    rgbBase: [216, 216, 224], category: 'bold', culturalContext: 'Futuristic silver-chrome from runway editorials. Afrofuturist and K-beauty crossover aesthetic.',
    warmth: 'cool', intensity: 0.4, season: ['all'],
    communities: ['black-american','east-asian','south-african','west-african'],
  },
  galaxy_purple: {
    id: 'galaxy_purple', label: 'Galaxy Purple', hexCode: '#2d0057',
    rgbBase: [45, 0, 87], category: 'bold', culturalContext: 'Deep cosmic purple for editorial and festival looks. Afrofuturist and Wakanda-era cultural moment.',
    warmth: 'cool', intensity: 0.95, season: ['all'],
    communities: ['black-american','west-african','south-african','caribbean'],
  },
  teal_editorial: {
    id: 'teal_editorial', label: 'Teal Editorial', hexCode: '#008080',
    rgbBase: [0, 128, 128], category: 'bold', culturalContext: 'Ocean-inspired teal embraced in South African fashion and East African editorial work.',
    warmth: 'cool', intensity: 0.9, season: ['summer','autumn'],
    communities: ['south-african','east-african','black-american','caribbean'],
  },
  neon_green: {
    id: 'neon_green', label: 'Neon Green', hexCode: '#39ff14',
    rgbBase: [57, 255, 20], category: 'bold', culturalContext: 'Afrofuturist neon — bold, transgressive, and deeply political as a reclamation of future aesthetics for Black bodies.',
    warmth: 'cool', intensity: 1.0, season: ['summer'],
    communities: ['black-american','west-african','south-african'],
  },
  oil_slick: {
    id: 'oil_slick', label: 'Oil Slick', hexCode: '#1a1a2e',
    rgbBase: [26, 26, 46], category: 'bold', culturalContext: 'Iridescent blue-green-purple that shifts colour in light. High-fashion editorial look across multiple communities.',
    warmth: 'cool', intensity: 0.9, season: ['all'],
    communities: ['east-asian','black-american','south-asian','latina'],
  },
};

// ===========================================================================
// HAIR TEXTURES — 25 entries
// ===========================================================================

export const HAIR_TEXTURES = {
  type_1a: {
    id: 'type_1a', label: 'Type 1A — Straight Fine', description: 'Very fine, straight hair with no wave. Typically associated with East Asian hair.',
    curl_pattern: 'straight', communities: ['east-asian'],
    care_tips: ['Use lightweight products to avoid weighing hair down','Clarify regularly to prevent product buildup','Volumizing products work best'],
    product_recommendations: ['Lightweight silk serum','Volumizing mousse','Clarifying shampoo'],
    protective_styles: ['Sleek low bun','Half-up half-down','Korean air-dry styling'],
  },
  type_1b: {
    id: 'type_1b', label: 'Type 1B — Straight Medium', description: 'Straight hair with more body and slight movement at the ends.',
    curl_pattern: 'straight-body', communities: ['east-asian','south-asian','latina','arab'],
    care_tips: ['Monthly deep conditioning','Avoid heavy oils','Heat protectant essential when styling'],
    product_recommendations: ['Argan oil serum','Hydrating conditioner','Thermal protectant'],
    protective_styles: ['Sleek bun','Braided styles','Silk press'],
  },
  type_1c: {
    id: 'type_1c', label: 'Type 1C — Straight Coarse', description: 'Straight but coarse and thick. Common in South Asian and some Arab communities.',
    curl_pattern: 'straight-coarse', communities: ['south-asian','arab','east-asian'],
    care_tips: ['Heavy moisture treatments needed','Amla oil treatments traditional remedy','Avoid overwashing'],
    product_recommendations: ['Coconut oil pre-poo','Rich conditioner','Smoothing serum'],
    protective_styles: ['Silk saree wrap','Traditional South Asian oil braid','Sleek low ponytail'],
  },
  type_2a: {
    id: 'type_2a', label: 'Type 2A — Wavy Fine', description: 'Fine S-wave pattern that can easily go straight or curly.',
    curl_pattern: 'wavy-fine', communities: ['latina','arab','south-asian','east-asian'],
    care_tips: ['Scrunch for wave definition','Avoid heat','Lightweight curl cream works best'],
    product_recommendations: ['Light curl mousse','Sea salt spray','Anti-frizz serum'],
    protective_styles: ['Loose braid','Wavy ponytail','Messy beach bun'],
  },
  type_2b: {
    id: 'type_2b', label: 'Type 2B — Wavy Medium', description: 'Medium S-wave pattern with frizz tendency.',
    curl_pattern: 'wavy-medium', communities: ['latina','arab','south-asian','caribbean'],
    care_tips: ['Microfibre towel to dry','Apply products to soaking wet hair','Pineapple at night'],
    product_recommendations: ['Defining cream','Gel for hold','Deep conditioner weekly'],
    protective_styles: ['Twist out','Pineapple updo','Braided half-up'],
  },
  type_2c: {
    id: 'type_2c', label: 'Type 2C — Wavy Coarse', description: 'Defined S-waves, thick, coarse, very frizz prone.',
    curl_pattern: 'wavy-coarse', communities: ['latina','caribbean','south-asian','arab'],
    care_tips: ['High porosity care — lots of moisture','LOC method','Avoid sulfates'],
    product_recommendations: ['Leave-in conditioner','Curl defining gel','Weekly protein treatment'],
    protective_styles: ['Protective braid styles','Wash-and-go','Bun'],
  },
  type_3a: {
    id: 'type_3a', label: 'Type 3A — Loose Curls', description: 'Springy, loose curls roughly the circumference of a piece of sidewalk chalk.',
    curl_pattern: 'curly-loose', communities: ['latina','caribbean','black-american','south-asian'],
    care_tips: ['Co-wash frequently','Finger detangle only','Pineapple overnight'],
    product_recommendations: ['Curl cream','Light hold gel','Rich conditioner'],
    protective_styles: ['Twist out','Braid out','Roller set'],
  },
  type_3b: {
    id: 'type_3b', label: 'Type 3B — Medium Curls', description: 'Springy curls roughly the circumference of a Sharpie marker.',
    curl_pattern: 'curly-medium', communities: ['latina','caribbean','black-american','south-african'],
    care_tips: ['LOC method','Satin bonnet at night','Regular trims to prevent tangles'],
    product_recommendations: ['Shea butter cream','Eco Styler gel','Leave-in conditioner'],
    protective_styles: ['Box braids','Twist out','Braid out'],
  },
  type_3c: {
    id: 'type_3c', label: 'Type 3C — Tight Curls', description: 'Tight corkscrew curls roughly the circumference of a pencil.',
    curl_pattern: 'curly-tight', communities: ['black-american','caribbean','west-african','south-african','east-african'],
    care_tips: ['High porosity — deep condition weekly','Stretch styles to prevent knots','Steam treatments'],
    product_recommendations: ['Knot Today (TGIN)','Mielle Organics Curl Milk','Denman brush'],
    protective_styles: ['Twist out','Fro-hawk','Wash and go'],
  },
  type_4a: {
    id: 'type_4a', label: 'Type 4A — Soft Coils', description: 'Defined S-pattern coils with lots of moisture-retention challenge.',
    curl_pattern: 'coily-soft', communities: ['black-american','west-african','east-african','south-african','caribbean'],
    care_tips: ['Moisture is everything — LCO or LOC daily','Protective styles recommended','Shrinkage is normal — embrace it'],
    product_recommendations: ['Cantu Curl Activator','As I Am Coconut CoWash','ORS Olive Oil'],
    protective_styles: ['Bantu knots','Twist out','Mini twists'],
  },
  type_4b: {
    id: 'type_4b', label: 'Type 4B — Z-Coil', description: 'Sharp Z-pattern coils with significant shrinkage (60-70%).',
    curl_pattern: 'coily-z', communities: ['west-african','east-african','south-african','black-american','caribbean'],
    care_tips: ['Water is your best friend','Protective styles extend moisture','Pre-poo with oil every wash day'],
    product_recommendations: ['Shea Moisture 100% Pure Shea Butter','Camille Rose Naturals','Aunt Jackie\'s'],
    protective_styles: ['Box braids','Cornrows','Halo braid'],
  },
  type_4c: {
    id: 'type_4c', label: 'Type 4C — Tightest Coils', 
    curl_pattern: 'coily-tight', communities: ['west-african','east-african','south-african','black-american','caribbean'],
    care_tips: ['High manipulation causes breakage — low manipulation is key','Moisturise and seal daily','Stretch before styling'],
    product_recommendations: ['Castor oil seal','Watkins Petrolatum (for the Africans)','Shea Moisture Manuka Honey'],
    protective_styles: ['Box braids','Faux locs','Twists','Sisterlocks','Bantu knots'],
  },
  locs_starter: {
    id: 'locs_starter', label: 'Starter Locs', description: 'Newly cultivated locs in the first 6-12 months. Common across Pan-African communities.',
    curl_pattern: 'locs', communities: ['west-african','east-african','south-african','black-american','caribbean'],
    care_tips: ['Do not over-manipulate','Retwist every 4-6 weeks','Keep scalp clean with diluted cleanser'],
    product_recommendations: ['Rasta Locks & Twist','African Pride Braid Sheen','Murray\'s Beeswax'],
    protective_styles: ['Pulled back','Pinned up','Free'],
  },
  locs_mature: {
    id: 'locs_mature', label: 'Mature Locs', description: 'Established locs 2+ years old. Dense, heavy, and culturally significant.',
    curl_pattern: 'locs-mature', communities: ['west-african','east-african','south-african','black-american','caribbean'],
    care_tips: ['Monthly retwist','Deep conditioning every 2 weeks','Loc jewels and wraps for styling'],
    product_recommendations: ['Lotta Body loc spray','Essential oils for scalp','Loc shampoo bars'],
    protective_styles: ['Loc bun','Loc ponytail','Half-up loc style','Loc crown'],
  },
  silk_straight: {
    id: 'silk_straight', label: 'Silk Press', description: 'Natural (unrelaxed) hair straightened with heat for a temporary silk-straight look. Popular in Black American salons.',
    curl_pattern: 'straightened', communities: ['black-american','west-african','caribbean','south-african'],
    care_tips: ['Avoid humidity','Wrap at night','Space presses well apart to limit heat damage'],
    product_recommendations: ['CHI Silk Infusion','Keracare Silken Seal','Blow dry brush'],
    protective_styles: ['Silk wrap','Sleek ponytail','Pin curls'],
  },
  relaxed: {
    id: 'relaxed', label: 'Chemically Relaxed', description: 'Permanently straightened via chemical process. Once dominant in Black American and West African communities.',
    curl_pattern: 'relaxed', communities: ['black-american','west-african','south-african','caribbean'],
    care_tips: ['Never overlap relaxer to previously processed hair','Protein treatments essential','Touch-ups every 8-12 weeks'],
    product_recommendations: ['Optimum Care','Dark & Lovely','ORS Olive Oil repair system'],
    protective_styles: ['Roller set','Wrap','Sew-in weave'],
  },
  weave_straight: {
    id: 'weave_straight', label: 'Straight Weave / Extension', description: 'Straight hair extensions sewn, glued, or clipped to natural hair.',
    curl_pattern: 'extension-straight', communities: ['west-african','black-american','caribbean','south-african'],
    care_tips: ['Moisturise natural hair underneath','Take down every 6-8 weeks','Do not leave in too long'],
    product_recommendations: ['ORS Olive Oil spritz','Dry shampoo for scalp','Edge control'],
    protective_styles: ['All weave styles compatible'],
  },
  weave_curly: {
    id: 'weave_curly', label: 'Curly Weave / Extension', description: 'Curly extensions for versatile styling. Brazilian, Peruvian, Malaysian textures.',
    curl_pattern: 'extension-curly', communities: ['west-african','black-american','caribbean','south-african'],
    care_tips: ['Co-wash extensions weekly','Detangle when wet','Satin bonnet essential'],
    product_recommendations: ['Curlsmith','Shea Moisture Curl Enhancer','Wide tooth comb'],
    protective_styles: ['All curly styles','Pineapple updo'],
  },
  south_asian_straight: {
    id: 'south_asian_straight', label: 'South Asian Dense Straight', description: 'Thick, dense, straight to wavy hair common across the Indian subcontinent. High density, high volume.',
    curl_pattern: 'straight-dense', communities: ['south-asian'],
    care_tips: ['Oil champi (scalp massage) weekly','Amla and coconut oil pre-wash','Do not brush when dry'],
    product_recommendations: ['Dabur Amla Oil','Indulekha Bringha Oil','Biotique shampoo'],
    protective_styles: ['Traditional oil braid','Gajra flower braid','Sleek low bun'],
  },
  arab_straight: {
    id: 'arab_straight', label: 'Arab Glossy Straight', description: 'Very glossy, thick, straight to wavy hair common across the Arab world. Celebrated for its shine.',
    curl_pattern: 'straight-glossy', communities: ['arab'],
    care_tips: ['Argan oil treatments','Keratin smoothing popular','Never sleep with wet hair'],
    product_recommendations: ['Moroccan oil','L\'Oreal Elvive keratin','Argan oil hair mask'],
    protective_styles: ['Hamam wrap','Sleek half-up','Braided crown'],
  },
  east_asian_fine: {
    id: 'east_asian_fine', label: 'East Asian Fine Straight', description: 'Very fine individual strands but extremely high density. The classic straight East Asian hair type.',
    curl_pattern: 'straight-fine-dense', communities: ['east-asian'],
    care_tips: ['Volume techniques are key','Avoid heavy products','Regular trims keep ends healthy'],
    product_recommendations: ['Shiseido moist moisturising shampoo','Pantene Miracles Asian series','TSUBAKI Premium'],
    protective_styles: ['Korean ulzzang styles','Straight half-up','Twin braids'],
  },
  mixed_texture: {
    id: 'mixed_texture', label: 'Mixed / Biracial Texture', description: 'Curly-wavy texture common in biracial or mixed heritage individuals. Can range from 2c to 4a.',
    curl_pattern: 'mixed', communities: ['black-american','caribbean','latina','south-african'],
    care_tips: ['Follow individual curl pattern','May have two or more textures','Avoid one-size-fits-all approach'],
    product_recommendations: ['Mixed Chicks','Curls Blueberry Bliss','Uncle Funky\'s Daughter'],
    protective_styles: ['Twist out','Braid out','Wash and go'],
  },
  afro_latina: {
    id: 'afro_latina', label: 'Afro-Latina Texture', description: 'Coily to curly textures common in Afro-Latino communities. Often undertreated in mainstream beauty.',
    curl_pattern: 'coily-curly', communities: ['latina','caribbean'],
    care_tips: ['Resist relaxing pressure — embrace texture','Spanish-speaking natural hair community growing fast','Seasonal porosity changes common'],
    product_recommendations: ['OGX','Dove Amplified Textures','Garnier Fructis Curl Treats'],
    protective_styles: ['Twist out','Flexi rod set','Cornrow styles'],
  },
  indo_caribbean: {
    id: 'indo_caribbean', label: 'Indo-Caribbean Texture', description: 'Wavy to curly texture of South Asian Caribbean descendants (Indo-Trinidadian, Indo-Guyanese).',
    curl_pattern: 'wavy-curly', communities: ['caribbean','south-asian'],
    care_tips: ['Coconut oil is cultural staple','Celebrate the wave','Avoid straightening damage'],
    product_recommendations: ['Coconut oil','SheaMoisture Coconut Hibiscus','Pattern Beauty'],
    protective_styles: ['Loose braid','Natural waves','Bun'],
  },
};

// ===========================================================================
// COLOUR EFFECTS — 18 blend presets
// ===========================================================================

export const COLOUR_EFFECTS = {
  natural_gloss: {
    id: 'natural_gloss', label: 'Natural Gloss', description: 'Subtle enhancement that adds shine and richness without changing colour.',
    blendMode: 'soft-light', opacityRange: [0.1, 0.25], hueShift: 0, saturationBoost: 0.15, lightnessShift: 0.05,
    culturalTrend: 'K-beauty glass hair trend, Arab hammam gloss tradition',
  },
  warm_tone: {
    id: 'warm_tone', label: 'Warm Tone', description: 'Adds warmth and golden undertones to hair colour.',
    blendMode: 'multiply', opacityRange: [0.15, 0.35], hueShift: 15, saturationBoost: 0.2, lightnessShift: 0.08,
    culturalTrend: 'West African sun-bleached looks, Latina warm highlights',
  },
  cool_ash: {
    id: 'cool_ash', label: 'Cool Ash', description: 'Neutralises warm tones, adds ashy cool finish.',
    blendMode: 'overlay', opacityRange: [0.1, 0.3], hueShift: -20, saturationBoost: -0.15, lightnessShift: 0.05,
    culturalTrend: 'K-beauty ash brown, J-beauty cool tones',
  },
  deep_rich: {
    id: 'deep_rich', label: 'Deep Rich', description: 'Deepens and intensifies the colour — makes dark hair look darker and richer.',
    blendMode: 'multiply', opacityRange: [0.2, 0.45], hueShift: 0, saturationBoost: 0.25, lightnessShift: -0.1,
    culturalTrend: 'South Asian glossy black, Arab deep brown tradition',
  },
  vibrant_lift: {
    id: 'vibrant_lift', label: 'Vibrant Lift', description: 'Boosts saturation and brightness for bold fantasy colours.',
    blendMode: 'screen', opacityRange: [0.2, 0.5], hueShift: 0, saturationBoost: 0.4, lightnessShift: 0.15,
    culturalTrend: 'Afrobeats editorial, Caribbean carnival, K-pop idol',
  },
  ombre_fade: {
    id: 'ombre_fade', label: 'Ombré Fade', description: 'Gradient blend from roots to ends.',
    blendMode: 'overlay', opacityRange: [0.0, 0.6], hueShift: 5, saturationBoost: 0.1, lightnessShift: 0.2,
    culturalTrend: 'Brazilian balayage, Black American honey ombré',
  },
  balayage_sun: {
    id: 'balayage_sun', label: 'Balayage Sunshine', description: 'Sun-kissed highlights painted through mid-lengths and ends.',
    blendMode: 'soft-light', opacityRange: [0.15, 0.4], hueShift: 20, saturationBoost: 0.15, lightnessShift: 0.25,
    culturalTrend: 'Caribbean beach looks, Latina summer beauty',
  },
  dramatic_contrast: {
    id: 'dramatic_contrast', label: 'Dramatic Contrast', description: 'High-contrast enhancement that makes bold colours pop on dark hair.',
    blendMode: 'hard-light', opacityRange: [0.3, 0.6], hueShift: 0, saturationBoost: 0.5, lightnessShift: 0.3,
    culturalTrend: 'Afrofuturist editorial, Nollywood music video aesthetic',
  },
  burgundy_tint: {
    id: 'burgundy_tint', label: 'Burgundy Tint', description: 'Deep wine-red tint that works beautifully on dark hair without bleach.',
    blendMode: 'multiply', opacityRange: [0.2, 0.4], hueShift: -30, saturationBoost: 0.3, lightnessShift: -0.05,
    culturalTrend: '1990s Black American nostalgia, West African salon staple',
  },
  blue_sheen: {
    id: 'blue_sheen', label: 'Blue Sheen', description: 'Adds blue-black or cobalt sheen to dark hair.',
    blendMode: 'overlay', opacityRange: [0.15, 0.35], hueShift: -160, saturationBoost: 0.3, lightnessShift: -0.05,
    culturalTrend: 'Afrofuturist, South Asian blue-black natural, Tuareg indigo',
  },
  gold_shimmer: {
    id: 'gold_shimmer', label: 'Gold Shimmer', description: 'Adds glittery gold sheen for festival and ceremonial looks.',
    blendMode: 'screen', opacityRange: [0.15, 0.3], hueShift: 30, saturationBoost: 0.35, lightnessShift: 0.25,
    culturalTrend: 'Diwali festive, Kente gold, Carnival costume hair',
  },
  purple_glaze: {
    id: 'purple_glaze', label: 'Purple Glaze', description: 'Deep purple glaze over dark brown or black hair.',
    blendMode: 'multiply', opacityRange: [0.2, 0.45], hueShift: -50, saturationBoost: 0.35, lightnessShift: -0.05,
    culturalTrend: 'Afrofuturist, South Asian editorial, Nollywood drama',
  },
  henna_glow: {
    id: 'henna_glow', label: 'Henna Glow', description: 'Warm red-orange henna tint simulation.',
    blendMode: 'soft-light', opacityRange: [0.2, 0.4], hueShift: 10, saturationBoost: 0.25, lightnessShift: 0.1,
    culturalTrend: 'South Asian mehndi tradition, Arab and North African henna culture',
  },
  silver_chrome: {
    id: 'silver_chrome', label: 'Silver Chrome', description: 'Metallic silver overlay for futuristic editorial looks.',
    blendMode: 'screen', opacityRange: [0.2, 0.5], hueShift: 0, saturationBoost: -0.4, lightnessShift: 0.4,
    culturalTrend: 'Afrofuturist, Amapiano aesthetic, K-pop chrome',
  },
  rose_blush: {
    id: 'rose_blush', label: 'Rose Blush', description: 'Subtle pink-rose tint for fashion-forward softness.',
    blendMode: 'soft-light', opacityRange: [0.15, 0.35], hueShift: -20, saturationBoost: 0.2, lightnessShift: 0.15,
    culturalTrend: 'K-beauty rose brown, South Asian editorial fusion',
  },
  teal_gloss: {
    id: 'teal_gloss', label: 'Teal Gloss', description: 'Ocean teal colour wash for bold statements.',
    blendMode: 'overlay', opacityRange: [0.25, 0.5], hueShift: -150, saturationBoost: 0.4, lightnessShift: 0.0,
    culturalTrend: 'South African editorial, East African fashion week',
  },
  copper_glint: {
    id: 'copper_glint', label: 'Copper Glint', description: 'Warm copper metallic sheen that works on deep and rich skin tones.',
    blendMode: 'soft-light', opacityRange: [0.15, 0.4], hueShift: 20, saturationBoost: 0.3, lightnessShift: 0.1,
    culturalTrend: 'West African metallic trend, K-beauty copper tones',
  },
  bleach_blonde_sim: {
    id: 'bleach_blonde_sim', label: 'Platinum Simulation', description: 'Simulates a bleached platinum look over dark hair — fantasy preview.',
    blendMode: 'screen', opacityRange: [0.35, 0.65], hueShift: 0, saturationBoost: -0.5, lightnessShift: 0.5,
    culturalTrend: 'Black power blonde, Kim K cultural reclamation by Black women',
  },
};

// ===========================================================================
// PROTECTIVE STYLES — 30 entries
// ===========================================================================

export const PROTECTIVE_STYLES = {
  box_braids: {
    id: 'box_braids', label: 'Box Braids', description: 'Individual braids in square-shaped parts. The foundational protective style of Black hair culture.',
    communities: ['black-american','west-african','caribbean','south-african','east-african'],
    maintenanceWeeks: 8, suitableTextures: ['type_4a','type_4b','type_4c','type_3c'],
    culturalOrigin: 'Ancient Africa — depictions in Egyptian tomb paintings 3000 BCE',
    modernVariants: ['Jumbo box braids','Knotless box braids','Bob box braids','Coloured box braids'],
  },
  cornrows: {
    id: 'cornrows', label: 'Cornrows', description: 'Braids woven flat against the scalp in straight or curved rows.',
    communities: ['west-african','black-american','caribbean','east-african','south-african'],
    maintenanceWeeks: 4, suitableTextures: ['type_3c','type_4a','type_4b','type_4c'],
    culturalOrigin: 'West Africa — carved in sculptures from Yoruba and Wolof cultures 3000+ BCE',
    modernVariants: ['Freestyle cornrows','Geometric-part braids','Pop smoke braids','Lemonade braids'],
  },
  senegalese_twists: {
    id: 'senegalese_twists', label: 'Senegalese Twists', description: 'Sleek rope twists using kanekalon or marley hair.',
    communities: ['west-african','black-american','caribbean','east-african'],
    maintenanceWeeks: 8, suitableTextures: ['type_4a','type_4b','type_4c'],
    culturalOrigin: 'Senegal, West Africa',
    modernVariants: ['Kinky twists','Marley twists','Short twists','Ombre twists'],
  },
  faux_locs: {
    id: 'faux_locs', label: 'Faux Locs', description: 'Temporary loc style created with wrapping technique. No commitment needed.',
    communities: ['black-american','west-african','caribbean','south-african'],
    maintenanceWeeks: 6, suitableTextures: ['type_3c','type_4a','type_4b','type_4c'],
    culturalOrigin: 'Inspired by Rastafari and Pan-African loc culture, modern fashion iteration',
    modernVariants: ['Butterfly locs','Boho faux locs','Distressed locs','Short faux locs'],
  },
  bantu_knots: {
    id: 'bantu_knots', label: 'Bantu Knots', description: 'Coiled knots sectioned across the head. Protective and beautiful.',
    communities: ['south-african','west-african','black-american','east-african','caribbean'],
    maintenanceWeeks: 2, suitableTextures: ['type_3b','type_3c','type_4a','type_4b','type_4c'],
    culturalOrigin: 'Zulu people of South Africa — spiritual and aesthetic tradition',
    modernVariants: ['Mini bantu knots','Coloured bantu knots','Half-up bantu','Faux bantu knots on straight hair'],
  },
  sisterlocks: {
    id: 'sisterlocks', label: 'Sisterlocks', description: 'Micro locs created with a specialised tool. Lightweight and versatile.',
    communities: ['black-american','west-african','caribbean','south-african'],
    maintenanceWeeks: 6, suitableTextures: ['type_4a','type_4b','type_4c'],
    culturalOrigin: 'Developed by Dr. JoAnne Cornwell, United States, 1993',
    modernVariants: ['Interlocks','Microlocs','Traditional Sisterlocks'],
  },
  crown_braid: {
    id: 'crown_braid', label: 'Crown / Halo Braid', description: 'Braid wrapped around the head like a crown. Universal protective and ceremonial style.',
    communities: ['west-african','south-asian','east-african','black-american','caribbean','arab'],
    maintenanceWeeks: 1, suitableTextures: ['type_2b','type_2c','type_3a','type_3b','type_3c','type_4a'],
    culturalOrigin: 'Present across African, South Asian, and European traditions independently',
    modernVariants: ['Dutch crown braid','French crown braid','Braided halo with lace front','Bubble halo'],
  },
  gele_wrap: {
    id: 'gele_wrap', label: 'Gele Wrap', description: 'Nigerian head tie worn at ceremonies. Protective and deeply cultural.',
    communities: ['west-african'],
    maintenanceWeeks: 0, suitableTextures: ['all'],
    culturalOrigin: 'Yoruba, Igbo, and Hausa peoples of Nigeria — centuries old tradition',
    modernVariants: ['Pre-tied gele','Satin gele','Aso-oke gele','Modern fascia-style gele'],
  },
  south_asian_braid: {
    id: 'south_asian_braid', label: 'South Asian Oil Braid', description: 'Traditional loose three-strand braid worn after an oil champi (scalp massage).',
    communities: ['south-asian'],
    maintenanceWeeks: 0, suitableTextures: ['type_1b','type_1c','type_2a','type_2b'],
    culturalOrigin: 'Indian subcontinent — Vedic era beauty ritual',
    modernVariants: ['Gajra flower braid','Fishtail South Asian braid','Sleek oiled braid','Waterfall braid'],
  },
  gajra: {
    id: 'gajra', label: 'Gajra Flower Braid', description: 'Jasmine or marigold flowers woven into a braid or bun. Bridal and ceremonial.',
    communities: ['south-asian'],
    maintenanceWeeks: 0, suitableTextures: ['type_1b','type_1c','type_2a','type_2b'],
    culturalOrigin: 'South India — classical dance, temple ceremony, and bridal tradition',
    modernVariants: ['Modern fabric gajra','Rose gajra','Mixed floral gajra','Designer gajra'],
  },
  fulani_braids: {
    id: 'fulani_braids', label: 'Fulani Braids', description: 'Cornrows with a central part, side braids, and hair accessories. Distinctly West African.',
    communities: ['west-african','black-american','caribbean'],
    maintenanceWeeks: 6, suitableTextures: ['type_3c','type_4a','type_4b','type_4c'],
    culturalOrigin: 'Fula/Fulani people of West Africa',
    modernVariants: ['Fulani braids with beads','Fulani bob','Side swept Fulani','Pop smoke x Fulani'],
  },
  twists: {
    id: 'twists', label: 'Two-Strand Twists', description: 'Two sections of hair twisted around each other. Easy, low manipulation.',
    communities: ['black-american','west-african','caribbean','south-african','east-african'],
    maintenanceWeeks: 3, suitableTextures: ['type_3b','type_3c','type_4a','type_4b','type_4c'],
    culturalOrigin: 'Pan-African tradition across many communities',
    modernVariants: ['Mini twists','Chunky twists','Flat twists','Twist out'],
  },
  puff: {
    id: 'puff', label: 'Afro Puff', description: 'Natural hair gathered into a round puff shape. Quick, easy, beautiful.',
    communities: ['black-american','west-african','caribbean','south-african','east-african'],
    maintenanceWeeks: 0, suitableTextures: ['type_3c','type_4a','type_4b','type_4c'],
    culturalOrigin: 'Black Power movement, United States 1960s-70s, though the style is ancient',
    modernVariants: ['High puff','Low puff','Two puffs','Banded puff'],
  },
  space_buns: {
    id: 'space_buns', label: 'Space Buns', description: 'Two buns placed high on the head. Playful, youthful, festival-ready.',
    communities: ['black-american','east-asian','latina','caribbean'],
    maintenanceWeeks: 0, suitableTextures: ['all'],
    culturalOrigin: 'Cross-cultural — used in East Asian, African, and Mesoamerican traditions historically',
    modernVariants: ['Afro space buns','Loc space buns','Braided space buns','Half-up space buns'],
  },
  dutch_braid: {
    id: 'dutch_braid', label: 'Dutch Braid', description: 'Inverted French braid that sits above the hair. Versatile across textures.',
    communities: ['all'],
    maintenanceWeeks: 1, suitableTextures: ['type_1a','type_1b','type_2a','type_2b','type_3a','type_3b'],
    culturalOrigin: 'European origin but adopted globally across all communities',
    modernVariants: ['Double Dutch braids','Knotted Dutch braid','Bubble Dutch braid'],
  },
  fishtail: {
    id: 'fishtail', label: 'Fishtail Braid', description: 'Intricate two-section braid that creates a herringbone pattern.',
    communities: ['south-asian','arab','latina','east-asian'],
    maintenanceWeeks: 0, suitableTextures: ['type_1b','type_1c','type_2a','type_2b','type_2c'],
    culturalOrigin: 'Ancient Greek and Roman records; also present in South Asian traditions',
    modernVariants: ['Loose fishtail','Side fishtail','Chunky fishtail'],
  },
  hamam_wrap: {
    id: 'hamam_wrap', label: 'Hammam Hair Wrap', description: 'Traditional Arab/Turkish towel-style wrap worn after hammam bath.',
    communities: ['arab'],
    maintenanceWeeks: 0, suitableTextures: ['type_1a','type_1b','type_1c','type_2a','type_2b'],
    culturalOrigin: 'Ottoman hammam culture — Turkey, Levant, Gulf, North Africa',
    modernVariants: ['Silk wrap','Satin turban','Modern hammam-inspired wrap'],
  },
  ethiopian_updo: {
    id: 'ethiopian_updo', label: 'Ethiopian Ceremonial Updo', description: 'Sculptural updo traditional to Ethiopian Habesha bridal and cultural celebrations.',
    communities: ['east-african'],
    maintenanceWeeks: 0, suitableTextures: ['type_4a','type_4b','type_4c'],
    culturalOrigin: 'Amhara, Tigrinya, and Oromo peoples of Ethiopia',
    modernVariants: ['Modern Habesha updo','Braided Ethiopian crown','Contemporary Ethiopian bridal'],
  },
  zulu_knots: {
    id: 'zulu_knots', label: 'Zulu Knots', description: 'Traditionally a Zulu cultural style — small coiled knots often worn at ceremonies. The original bantu knot.',
    communities: ['south-african'],
    maintenanceWeeks: 2, suitableTextures: ['type_4b','type_4c'],
    culturalOrigin: 'Zulu Kingdom, South Africa — warriors, women, and ceremonies',
    modernVariants: ['Decorated Zulu knots','Coloured Zulu knots','Modern interpretations'],
  },
  knotless_braids: {
    id: 'knotless_braids', label: 'Knotless Braids', description: 'Box braids installed without the knot at the root — lighter, less tension, more natural-looking start.',
    communities: ['black-american','west-african','caribbean','south-african'],
    maintenanceWeeks: 8, suitableTextures: ['type_3c','type_4a','type_4b','type_4c'],
    culturalOrigin: 'Modern innovation in Black beauty industry, United States',
    modernVariants: ['Knotless bob','Feed-in knotless','Giant knotless','Ombre knotless'],
  },
  lemonade_braids: {
    id: 'lemonade_braids', label: 'Lemonade Braids', description: 'Side-swept cornrows popularised by Beyoncé\'s Lemonade album. Cultural moment in Black beauty.',
    communities: ['black-american','west-african','caribbean'],
    maintenanceWeeks: 6, suitableTextures: ['type_3c','type_4a','type_4b','type_4c'],
    culturalOrigin: 'Popularised globally 2016, roots in African cornrow tradition',
    modernVariants: ['Coloured lemonade braids','Bob lemonade braids','Mixed size lemonade'],
  },
  cuban_twist: {
    id: 'cuban_twist', label: 'Cuban Twist', description: 'Thick, chunky twist style popular in Caribbean and Afro-Latina communities.',
    communities: ['caribbean','latina','black-american'],
    maintenanceWeeks: 6, suitableTextures: ['type_3c','type_4a','type_4b','type_4c'],
    culturalOrigin: 'Caribbean and Cuban diaspora beauty culture',
    modernVariants: ['Bob Cuban twist','Coloured Cuban twist','Short Cuban twist'],
  },
  passion_twists: {
    id: 'passion_twists', label: 'Passion Twists', description: 'Lightweight, bohemian twists with a curly finish. One of the most popular modern protective styles.',
    communities: ['black-american','west-african','caribbean'],
    maintenanceWeeks: 6, suitableTextures: ['type_4a','type_4b','type_4c'],
    culturalOrigin: 'Developed by Miami stylist Kezia Adriana, United States, 2018',
    modernVariants: ['Short passion twists','Ombre passion twists','Coloured passion twists'],
  },
  distressed_locs: {
    id: 'distressed_locs', label: 'Butterfly / Distressed Locs', description: 'Textured faux locs with a deliberately boho, undone look.',
    communities: ['black-american','west-african','caribbean','south-african'],
    maintenanceWeeks: 6, suitableTextures: ['type_4a','type_4b','type_4c'],
    culturalOrigin: 'Modern Black American creative hairstyling',
    modernVariants: ['Butterfly locs','Soft locs','River locs'],
  },
  wigs: {
    id: 'wigs', label: 'Lace Front Wig', 
    communities: ['black-american','west-african','south-african','caribbean','east-african'],
    maintenanceWeeks: 0, suitableTextures: ['all'],
    culturalOrigin: 'Ancient Egypt — wigs worn for ceremony and beauty 3500 BCE. Modern lace wigs developed in 20th century for Black women.',
    modernVariants: ['HD lace','Glueless wig','360 lace','U-part wig','V-part wig'],
  },
  sew_in: {
    id: 'sew_in', label: 'Sew-In Weave', description: 'Wefts sewn onto cornrowed natural hair. Classic Black American salon service.',
    communities: ['black-american','west-african','caribbean','south-african'],
    maintenanceWeeks: 8, suitableTextures: ['type_3c','type_4a','type_4b','type_4c'],
    culturalOrigin: 'Black American salon tradition — developed mid-20th century',
    modernVariants: ['Vixen sew-in','Half sew-in','Full sew-in','Closure sew-in'],
  },
  crochet_braids: {
    id: 'crochet_braids', label: 'Crochet Braids', description: 'Extensions looped through cornrows with a crochet needle. Quick install, many textures available.',
    communities: ['black-american','west-african','caribbean','south-african'],
    maintenanceWeeks: 6, suitableTextures: ['type_4a','type_4b','type_4c'],
    culturalOrigin: 'Caribbean diaspora, developed widely in Black American community',
    modernVariants: ['Butterfly locs crochet','Faux loc crochet','Curly crochet','Straight crochet'],
  },
  sleek_bun: {
    id: 'sleek_bun', label: 'Sleek Low Bun', description: 'Elegant, polished bun styled with edge control and smoothing products.',
    communities: ['black-american','east-asian','south-asian','arab','latina'],
    maintenanceWeeks: 0, suitableTextures: ['all'],
    culturalOrigin: 'Universal style present in all cultures',
    modernVariants: ['Donut bun','Ballet bun','Messy bun','Braided bun'],
  },
  feed_in_braids: {
    id: 'feed_in_braids', label: 'Feed-In Braids', description: 'Cornrows built up gradually by feeding in extra hair for a seamless, natural look.',
    communities: ['black-american','west-african','caribbean'],
    maintenanceWeeks: 4, suitableTextures: ['type_3c','type_4a','type_4b','type_4c'],
    culturalOrigin: 'West African braiding tradition, refined in American salons',
    modernVariants: ['Feed-in ponytail','Stitch braids','Ghana braids'],
  },
  mini_twists: {
    id: 'mini_twists', label: 'Mini Twists', description: 'Hundreds of tiny two-strand twists offering maximum versatility and length protection.',
    communities: ['black-american','west-african','east-african','south-african','caribbean'],
    maintenanceWeeks: 6, suitableTextures: ['type_4a','type_4b','type_4c'],
    culturalOrigin: 'Pan-African natural hair tradition',
    modernVariants: ['Mini twist out','Pinned mini twists','Coloured mini twists'],
  },
};

// ===========================================================================
// EXPORTED FUNCTIONS
// ===========================================================================

export function getHairColours(filters = {}) {
  let colours = Object.values(HAIR_COLOURS);
  if (filters.community) {
    colours = colours.filter(c => c.communities.includes(filters.community));
  }
  if (filters.category) {
    colours = colours.filter(c => c.category === filters.category);
  }
  if (filters.warmth) {
    colours = colours.filter(c => c.warmth === filters.warmth);
  }
  if (filters.season && filters.season !== 'all') {
    colours = colours.filter(c => c.season.includes('all') || c.season.includes(filters.season));
  }
  return colours;
}

export function getHairTextures(communityId) {
  if (!communityId) return Object.values(HAIR_TEXTURES);
  return Object.values(HAIR_TEXTURES).filter(t => !t.communities || t.communities.includes(communityId) || t.communities.includes('all'));
}

export function getColourEffects() {
  return Object.values(COLOUR_EFFECTS);
}

export function getProtectiveStyles(communityId) {
  if (!communityId) return Object.values(PROTECTIVE_STYLES);
  return Object.values(PROTECTIVE_STYLES).filter(s =>
    s.communities.includes(communityId) || s.communities.includes('all')
  );
}

export function matchColourToSkinTone(rgbSkinTone) {
  const [sr, sg, sb] = rgbSkinTone;
  const warmth = sr > sb ? 'warm' : sr < sb ? 'cool' : 'neutral';
  const lightness = (sr + sg + sb) / 3;
  const isDeep = lightness < 80;
  const isMediumDeep = lightness >= 80 && lightness < 130;
  const isMedium = lightness >= 130 && lightness < 180;

  return Object.values(HAIR_COLOURS).map(colour => {
    const [cr, cg, cb] = colour.rgbBase;
    let score = 0;
    let harmony_reason = '';

    // Warmth harmony
    if (warmth === 'warm' && colour.warmth === 'warm') {
      score += 30;
      harmony_reason = 'Warm-on-warm harmony — golden and rich tones complement your skin\'s warmth.';
    } else if (warmth === 'cool' && colour.warmth === 'cool') {
      score += 30;
      harmony_reason = 'Cool-tone harmony — the ashy or jewel-toned shade complements your cool undertone.';
    } else if (colour.warmth === 'neutral') {
      score += 20;
      harmony_reason = 'Neutral tone — works with any undertone.';
    } else {
      score += 10;
      harmony_reason = 'Contrasting undertone — creates deliberate tension that many find striking.';
    }

    // Contrast logic for deep skin
    if (isDeep) {
      const colourLightness = (cr + cg + cb) / 3;
      if (colourLightness > 150) score += 25; // high contrast pops on deep skin
      if (colour.category === 'bold') score += 20;
      if (colour.intensity > 0.8) score += 15;
    }

    if (isMediumDeep && colour.category !== 'bold') score += 15;
    if (isMedium && colour.warmth === 'warm') score += 10;

    // Penalise very light colours on very deep skin (poor contrast)
    if (isDeep && colour.hexCode.startsWith('#e') && colour.category !== 'bold') {
      score -= 10;
    }

    return { ...colour, score: Math.min(100, score), harmony_reason };
  }).sort((a, b) => b.score - a.score).slice(0, 8);
}

export function getColourHarmony(hairColourId, skinShadeId) {
  const colour = HAIR_COLOURS[hairColourId];
  if (!colour) return { score: 0, rating: 'unknown', reason: 'Colour not found', cultural_note: '' };

  // Simplified scoring based on colour properties
  let score = 60; // baseline
  const rating_map = [[85,'excellent'],[70,'good'],[50,'fair'],[0,'clash']];

  if (colour.warmth === 'warm' && skinShadeId?.includes('warm')) score += 20;
  if (colour.warmth === 'cool' && skinShadeId?.includes('cool')) score += 20;
  if (colour.warmth === 'neutral') score += 10;
  if (colour.category === 'cultural') score += 15;

  score = Math.min(100, score);
  const rating = rating_map.find(([threshold]) => score >= threshold)?.[1] ?? 'clash';

  return {
    score,
    rating,
    reason: colour.culturalContext,
    cultural_note: `${colour.label} has cultural resonance in: ${colour.communities.slice(0,3).join(', ')} communities.`,
  };
}

export function getCommunityHairProfile(communityId) {
  const profiles = {
    'west-african': {
      traditional_styles: ['Cornrows','Gele wraps','Oil-plaited styles','Didi braids'],
      modern_trends: ['Lace front wigs','Knotless box braids','Blonde on deep skin','Afrobeats editorial colour'],
      colour_preferences: ['Jet black','Burgundy','Honey blonde','Bold fashion colours'],
      texture_notes: 'Predominantly 4B/4C coily textures. Protective styles have been central to West African beauty for millennia.',
      care_philosophy: 'Moisture, protection, and celebration of natural texture. Shea butter is the foundational product.',
      cultural_influences: ['Yoruba beauty traditions','Ghanaian kente colour symbolism','Senegalese braiding artistry','Nigerian Nollywood glamour'],
    },
    'south-asian': {
      traditional_styles: ['Long oil braid','Gajra flower braid','Traditional updo','Simple plait'],
      modern_trends: ['K-beauty fusion','Balayage','Silk press','Bollywood volume'],
      colour_preferences: ['Jet black','Espresso brown','Henna red','Copper highlights'],
      texture_notes: 'Range from straight 1B to wavy 2C. High density is common. Amla oil is a traditional staple.',
      care_philosophy: 'Champi (scalp massage) with oils is sacred. Hair is seen as connected to health and femininity.',
      cultural_influences: ['Bollywood beauty standards','Ayurvedic hair care','Classical dance aesthetics','Modern K-beauty adoption'],
    },
    'caribbean': {
      traditional_styles: ['Plaits','Press and curl','Natural coils','Cornrows'],
      modern_trends: ['Passion twists','Ombre','Carnival fantasy colours','Crochet braids'],
      colour_preferences: ['Black to burgundy','Honey blonde','Copper red','Tropical bold colours'],
      texture_notes: 'Wide range from 2C to 4C, reflecting diverse Caribbean heritage. Mixed textures common in Afro-Caribbean communities.',
      care_philosophy: 'Natural coconut oil and aloe are traditional. Embracing texture diversity is increasingly celebrated.',
      cultural_influences: ['Carnival culture','Rasta locs movement','African diaspora connection','Island festival aesthetics'],
    },
    'arab': {
      traditional_styles: ['Long straight style','Hammam wrap','Henna colour','Sleek ponytail'],
      modern_trends: ['Keratin treatments','Ombre','Balayage','Gulf glamour volume blowout'],
      colour_preferences: ['Jet black','Blue black','Deep auburn','Chestnut'],
      texture_notes: 'Predominantly straight 1B-1C with high density and natural gloss. In North Africa, wavy textures more common.',
      care_philosophy: 'Long, glossy, well-moisturised hair is the ideal. Argan oil (Morocco) and black seed oil are traditional.',
      cultural_influences: ['Gulf luxury beauty industry','Levantine bridal tradition','Moroccan hammam culture','Egyptian cinema glamour'],
    },
    'latina': {
      traditional_styles: ['Loose wave','Simple braid','Flower crown','Updo'],
      modern_trends: ['Brazilian balayage','Ombre','Beach waves','Vivid colour','Afro-Latina natural movement'],
      colour_preferences: ['Honey blonde','Caramel ombre','Copper','Brown to red'],
      texture_notes: 'Extremely diverse — from straight 1C to coily 4C in Afro-Latina communities. All textures represented.',
      care_philosophy: 'Coconut and avocado oils are traditional. Growing natural hair movement especially in Afro-Latina communities.',
      cultural_influences: ['Brazilian carnival beauty','Mexican Tehuana tradition','Colombian street style','Afro-Latina identity movement'],
    },
    'east-asian': {
      traditional_styles: ['Straight down','Top knot','Traditional updo','Side braids'],
      modern_trends: ['K-beauty glass hair','Ash brown','Balayage','Pastel colours','J-beauty air dry'],
      colour_preferences: ['Blue black','Ash brown','Rose brown','Silver grey','Platinum'],
      texture_notes: 'Typically 1A-1B straight, fine individual strands with high density. The East Asian hair market drives global innovation.',
      care_philosophy: 'Fermented rice water is a traditional rinse. Camellia and tsubaki oil are Japanese staples.',
      cultural_influences: ['K-beauty global influence','J-beauty minimalism','C-beauty revival','Hallyu idol aesthetics'],
    },
    'east-african': {
      traditional_styles: ['Ethiopian ceremonial updo','Thinly plaited styles','Henna colour','Natural coils'],
      modern_trends: ['Box braids','Faux locs','Wig culture','Afro editorial'],
      colour_preferences: ['Jet black','Deep auburn','Henna red','Burgundy'],
      texture_notes: 'Predominantly 4A-4C coily textures. Ethiopian hair communities have unique ceremonial updo traditions.',
      care_philosophy: 'Traditional butter and oil treatments. Growing natural hair pride movement across Nairobi, Addis, Kampala.',
      cultural_influences: ['Ethiopian Habesha bridal','Kenyan fashion editorial','Somali cultural standards','East African natural hair movement'],
    },
    'south-african': {
      traditional_styles: ['Zulu knots','Beaded styles','Amapiano-inspired looks','Ndebele patterned braids'],
      modern_trends: ['Amapiano aesthetic','Chrome/silver editorial','Natural 4C celebration','Streetwear beauty'],
      colour_preferences: ['Jet black','Amapiano silver','Burgundy','Bold fashion colours'],
      texture_notes: 'Rich diversity of 4A-4C textures. Zulu, Xhosa, Ndebele traditions each have distinct hair styling practices.',
      care_philosophy: 'Rooibos and natural African botanicals. Growing Afrocentric beauty movement. Decolonising hair standards.',
      cultural_influences: ['Zulu cultural identity','Amapiano music culture','Cape Malay fusion beauty','South African fashion week'],
    },
    'black-american': {
      traditional_styles: ['Press and curl','Jheri curl','Relaxer','Cornrows'],
      modern_trends: ['Natural hair movement','Lace front wigs','Knotless braids','Bold colour freedom'],
      colour_preferences: ['Honey blonde','Burgundy','Fire red','Bold statement colours'],
      texture_notes: 'Full spectrum of textures from 3A to 4C. The most diverse and innovated-upon hair culture globally.',
      care_philosophy: 'The natural hair movement reclaimed texture after decades of relaxer dominance. Crown Act protects natural hair.',
      cultural_influences: ['Harlem Renaissance beauty','Black Power natural movement','Hip-hop and R&B aesthetics','Afrofuturism editorial'],
    },
  };
  return profiles[communityId] ?? { error: 'Community not found', available: Object.keys(profiles) };
}

export function getSeasonalTrends(season, communityId) {
  const allTrends = {
    spring: [
      { colour: HAIR_COLOURS.rose_gold_deep, style: PROTECTIVE_STYLES.passion_twists, community: ['black-american','east-asian'], trend: 'Soft pink-gold tones for spring renewal' },
      { colour: HAIR_COLOURS.honey_blonde, style: PROTECTIVE_STYLES.knotless_braids, community: ['black-american','west-african'], trend: 'Spring honey blonde on protective styles' },
      { colour: HAIR_COLOURS.lavender, style: PROTECTIVE_STYLES.twists, community: ['east-asian','black-american'], trend: 'Lavender wash for spring freshness' },
      { colour: HAIR_COLOURS.coral, style: PROTECTIVE_STYLES.puff, community: ['caribbean','west-african'], trend: 'Coral puff for tropical spring' },
    ],
    summer: [
      { colour: HAIR_COLOURS.golden_blonde, style: PROTECTIVE_STYLES.box_braids, community: ['black-american','caribbean'], trend: 'Golden box braids for summer heat protection' },
      { colour: HAIR_COLOURS.hot_pink, style: PROTECTIVE_STYLES.faux_locs, community: ['black-american','west-african'], trend: 'Hot pink faux locs for festival season' },
      { colour: HAIR_COLOURS.tangerine, style: PROTECTIVE_STYLES.cornrows, community: ['west-african','caribbean'], trend: 'Carnival tangerine cornrows' },
      { colour: HAIR_COLOURS.electric_blue, style: PROTECTIVE_STYLES.knotless_braids, community: ['south-african','black-american'], trend: 'Electric blue knotless for summer editorial' },
    ],
    autumn: [
      { colour: HAIR_COLOURS.deep_auburn, style: PROTECTIVE_STYLES.senegalese_twists, community: ['east-african','west-african'], trend: 'Deep auburn twist for autumn warmth' },
      { colour: HAIR_COLOURS.burgundy, style: PROTECTIVE_STYLES.sew_in, community: ['black-american','west-african'], trend: 'Burgundy sew-in for fall season' },
      { colour: HAIR_COLOURS.cinnamon, style: PROTECTIVE_STYLES.south_asian_braid, community: ['south-asian'], trend: 'Spice-toned braids for Diwali season' },
      { colour: HAIR_COLOURS.copper_red, style: PROTECTIVE_STYLES.wigs, community: ['black-american','east-asian'], trend: 'Copper lace front for autumn editorial' },
    ],
    winter: [
      { colour: HAIR_COLOURS.purple_plum, style: PROTECTIVE_STYLES.faux_locs, community: ['south-asian','black-american'], trend: 'Deep plum locs for winter drama' },
      { colour: HAIR_COLOURS.chrome_silver, style: PROTECTIVE_STYLES.sleek_bun, community: ['east-asian','south-african'], trend: 'Metallic silver for festive season' },
      { colour: HAIR_COLOURS.galaxy_purple, style: PROTECTIVE_STYLES.box_braids, community: ['black-american','west-african'], trend: 'Galaxy purple braids for winter editorial' },
      { colour: HAIR_COLOURS.diwali_gold, style: PROTECTIVE_STYLES.gajra, community: ['south-asian'], trend: 'Festive gold gajra for winter celebrations' },
    ],
  };

  let trends = allTrends[season] ?? allTrends.spring;
  if (communityId) {
    trends = trends.filter(t => t.community.includes(communityId));
  }
  return trends;
}

export function getHairCareRoutine(textureId, communityId) {
  const texture = HAIR_TEXTURES[textureId];
  if (!texture) return null;

  const communityProfile = communityId ? getCommunityHairProfile(communityId) : null;

  const routines = {
    straight: {
      routine_steps: [
        { step: 1, action: 'Pre-wash oil treatment', detail: 'Apply coconut or argan oil to dry hair 30-60 minutes before washing', frequency: 'weekly' },
        { step: 2, action: 'Shampoo', detail: 'Gentle sulfate-free shampoo focusing on scalp', frequency: 'weekly' },
        { step: 3, action: 'Conditioner', detail: 'Apply from mid-length to ends, detangle with wide-tooth comb, leave 3-5 minutes', frequency: 'weekly' },
        { step: 4, action: 'Cold rinse', detail: 'Rinse with cool water to seal cuticle and boost shine', frequency: 'weekly' },
        { step: 5, action: 'Lightweight serum', detail: 'Apply to damp hair before heat styling or air drying', frequency: 'weekly' },
      ],
      products: texture.product_recommendations,
      frequency_notes: 'Wash 1-2x per week. Avoid daily washing — strips natural oils.',
      protective_tips: ['Always use heat protectant before styling','Sleep on silk pillowcase','Never brush dry if prone to breakage'],
    },
    coily: {
      routine_steps: [
        { step: 1, action: 'Pre-poo', detail: 'Apply castor or coconut oil to dry hair in sections, leave 1-2 hours or overnight', frequency: 'weekly' },
        { step: 2, action: 'Cowash or shampoo', detail: 'Cowash 2-3x per week, clarifying shampoo monthly', frequency: 'weekly' },
        { step: 3, action: 'Deep condition', detail: 'Rich deep conditioner under heat cap or steam for 20-30 minutes', frequency: 'weekly' },
        { step: 4, action: 'Leave-in conditioner', detail: 'Apply in sections to soaking wet hair', frequency: 'every wash' },
        { step: 5, action: 'LOC or LCO method', detail: 'Layer Leave-in, Oil, then Cream (or Leave-in, Cream, Oil) to seal moisture', frequency: 'every wash' },
        { step: 6, action: 'Style', detail: 'Twist out, braid out, or wash-and-go while hair is soaking wet', frequency: 'every wash' },
        { step: 7, action: 'Nightly moisture', detail: 'Spritz with water, apply light oil, pineapple or satin bonnet', frequency: 'nightly' },
      ],
      products: texture.product_recommendations,
      frequency_notes: 'Moisturise daily. Wash every 1-2 weeks. Never go to bed without protecting hair.',
      protective_tips: ['Satin bonnet every night — non-negotiable','Finger detangle before combing','Stretch hair before cutting to see true length'],
    },
    wavy: {
      routine_steps: [
        { step: 1, action: 'Wet hair thoroughly', detail: 'Always start with completely saturated hair — waves need water', frequency: 'wash day' },
        { step: 2, action: 'Shampoo', detail: 'Sulfate-free shampoo, gentle massage', frequency: 'weekly' },
        { step: 3, action: 'Condition', detail: 'Apply conditioner, scrunch upward, rinse 80%', frequency: 'weekly' },
        { step: 4, action: 'Apply styling product', detail: 'Scrunch in lightweight curl cream or mousse while soaking wet', frequency: 'wash day' },
        { step: 5, action: 'Plop', detail: 'Wrap in microfibre towel for 20-30 minutes to reduce frizz', frequency: 'wash day' },
        { step: 6, action: 'Air dry or diffuse', detail: 'Diffuse on low heat or air dry without touching for best wave definition', frequency: 'wash day' },
        { step: 7, action: 'Scrunch out the crunch', detail: 'Once fully dry, scrunch to break the gel cast for soft waves', frequency: 'wash day' },
      ],
      products: texture.product_recommendations,
      frequency_notes: 'Wash 2-3x per week. Refresh waves between washes with water and leave-in spritz.',
      protective_tips: ['Microfibre towel, never terrycloth','Pineapple updo at night','No touching while drying'],
    },
  };

  const cp = texture.curl_pattern;
  const routineKey = cp.includes('coil') || cp.includes('locs') || cp === 'curly-tight' ? 'coily' :
    cp.includes('wavy') || cp.startsWith('curly') ? 'wavy' : 'straight';

  return { ...(routines[routineKey] ?? routines.coily), community_care: communityProfile?.care_philosophy ?? null };
}

