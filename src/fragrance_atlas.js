/**
 * fragrance_atlas.js — Ethnic and traditional fragrance database for MIRRR
 * Oud, attar, florals, resins, and cultural perfumery traditions
 */

// ─── FRAGRANCE FAMILIES ───────────────────────────────────────────────────────

export const FRAGRANCE_FAMILIES = {
  oud: { id: 'oud', label: 'Oud / Agarwood', icon: '🪵' },
  attar: { id: 'attar', label: 'Attar / Ittar', icon: '🌸' },
  resin: { id: 'resin', label: 'Resin & Balsam', icon: '🌲' },
  floral: { id: 'floral', label: 'Floral', icon: '🌺' },
  citrus: { id: 'citrus', label: 'Citrus & Fresh', icon: '🍊' },
  musk: { id: 'musk', label: 'Musk & Amber', icon: '🌟' },
  herbal: { id: 'herbal', label: 'Herbal & Earthy', icon: '🌿' },
  smoke: { id: 'smoke', label: 'Smoky & Incense', icon: '💨' },
  spice: { id: 'spice', label: 'Spice & Warm', icon: '🌶️' },
};

// ─── FRAGRANCE NOTES GLOSSARY ─────────────────────────────────────────────────

export const FRAGRANCE_NOTES = {
  oud: {
    id: 'oud',
    name: 'Oud (Agarwood)',
    arabicName: 'عود',
    family: 'oud',
    origin: 'Southeast Asia, South Asia, Middle East',
    
    scent: 'Complex: earthy, woody, slightly sweet, animalic, smoky, leathery, incense-like',
    communities: ['arab', 'south-asian', 'east-african'],
    
    uses: ['perfume base', 'burning as incense', 'hair fragrance', 'body oil'],
    culturalContext: 'In Arab culture, oud is burned in incense (bukhoor) form at weddings, during Ramadan, and to scent clothes and rooms. In the Gulf, offering oud to guests is a sign of the highest hospitality.',
    tags: ['oud', 'agarwood', 'arab', 'luxury', 'base-note', 'wood'],
  },
  rose_taif: {
    id: 'rose_taif',
    name: 'Taif Rose',
    arabicName: 'وردة الطائف',
    family: 'floral',
    origin: 'Taif, Saudi Arabia',
    description: 'The Taif rose (Rosa damascena var.) grows only in the mountains above Taif, Saudi Arabia at 1800m elevation. Each rose petal is harvested by hand before dawn. One of the rarest rose varieties in the world.',
    scent: 'Rich, honey-like rose with notes of lychee and raspberry. Much more complex than standard rose water.',
    communities: ['arab'],
    
    uses: ['perfume', 'rose water (premium)', 'skincare'],
    culturalContext: 'Taif rose is given as a gift at the highest level in Saudi and Gulf culture. The rose harvest is a major annual event. Rose water from Taif is used in the Zamzam water vessels for the Kaaba.',
    tags: ['rose', 'taif', 'arabic', 'floral', 'luxury', 'rare'],
  },
  attar_rose: {
    id: 'attar_rose',
    name: 'Rose Attar (Gulab)',
    family: 'attar',
    origin: 'Kannauj, India ("Perfume Capital of India")',
    description: 'Traditional Indian attar (ittar) of rose distilled in sandalwood base. The Indian attar method (degh-bhapka) is a centuries-old hydro-distillation technique unique to Kannauj.',
    scent: 'Rose on a warm, creamy sandalwood base — softer and earthier than pure rose oil',
    communities: ['south-asian', 'arab'],
    
    uses: ['applied to pulse points', 'prayer before namaz', 'gifting', 'bridal'],
    culturalContext: 'Attar (from Arabic \'itr) has been the South Asian perfume tradition for over 3,000 years. Kannauj attars are given as gifts at Eid, weddings, and religious occasions. Alcohol-free — important for Muslim communities.',
    tags: ['attar', 'rose', 'south-asian', 'kannauj', 'sandalwood', 'alcohol-free'],
  },
  sandalwood: {
    id: 'sandalwood',
    name: 'Mysore Sandalwood (Chandan)',
    family: 'resin',
    origin: 'Mysore, Karnataka, India',
    
    scent: 'Creamy, milky, soft wood with a warm dry-down. Vanillic in some varieties.',
    communities: ['south-asian', 'east-asian'],
    
    uses: ['base note for attars', 'religious ceremonies', 'skin application', 'incense (agarbatti)'],
    culturalContext: 'Sandalwood paste (chandan) is used in puja (Hindu prayer) — applied to the forehead. The smell of sandalwood is inseparable from Indian temple culture and meditation.',
    tags: ['sandalwood', 'chandan', 'south-asian', 'india', 'base-note', 'sacred'],
  },
  frankincense: {
    id: 'frankincense',
    name: 'Frankincense (Luban)',
    arabicName: 'لبان',
    family: 'resin',
    origin: 'Oman (Dhofar), Somalia, Ethiopia, India',
    description: 'Frankincense (olibanum) resin from Boswellia sacra. The silver-white Omani frankincense (Hojari grade) is considered the finest in the world.',
    scent: 'Lemon-pine at the opening, deep balsamic resin in the heart, warm dry wood in the base. Clean and sacred.',
    communities: ['arab', 'east-african'],
    
    uses: ['incense', 'skincare (anti-inflammatory)', 'perfume ingredient', 'spiritual ceremonies'],
    culturalContext: 'Frankincense has been traded on the Arabian Peninsula for 5,000+ years — it was one of the three gifts of the Magi. In Oman, the Dhofar region\'s economy has been built on frankincense for millennia. Burned for spiritual purification across Islamic, Ethiopian Orthodox, and ancient pagan traditions.',
    tags: ['frankincense', 'luban', 'arab', 'east-african', 'omani', 'resin', 'sacred', 'ancient'],
  },
  jasmine_sambac: {
    id: 'jasmine_sambac',
    name: 'Jasmine Sambac (Mogra)',
    family: 'floral',
    origin: 'South and Southeast Asia',
    description: 'Jasminum sambac — the national flower of the Philippines, the flower of all South Asian garlands, and the heart of millions of perfumes.',
    scent: 'Intensely floral, heady, slightly animalic, green and rich. More powerful and complex than common jasmine.',
    communities: ['south-asian', 'east-asian', 'east-african', 'arab'],
    
    uses: ['hair garlands (gajra)', 'temple offerings', 'perfume', 'tea flavouring'],
    culturalContext: 'In South India, jasmine flowers strung into gajra are worn in the hair daily by women, refreshed every morning. At temples, jasmine is offered to the deity. Jasmine flower sellers exist at every South Indian market intersection.',
    tags: ['jasmine', 'mogra', 'sambac', 'south-asian', 'south-east-asian', 'floral', 'gajra'],
  },
  bukhoor: {
    id: 'bukhoor',
    name: 'Bukhoor (Arabian Incense Chips)',
    arabicName: 'بخور',
    family: 'smoke',
    origin: 'Gulf States (UAE, Saudi Arabia, Kuwait, Qatar)',
    description: 'Bukhoor is a blend of wood chips (often oud chips), resins, florals, musks, and sweet notes, compressed into chips and burned on charcoal in a mabkhara (incense burner).',
    scent: 'Complex smoky-sweet-woody-floral. Each blend is unique — like a perfume in smoke form.',
    communities: ['arab'],
    
    uses: ['scenting rooms', 'scenting clothes and hair', 'hospitality ritual', 'wedding preparation'],
    culturalContext: 'Passing bukhoor around to guests (using a mabkhara — a traditional censer) is one of the deepest hospitality gestures in Gulf culture. Brides are fumigated with bukhoor before their wedding night. Homes are scented with bukhoor for Eid and Ramadan.',
    ritual: 'Light charcoal in mabkhara → place bukhoor chip on charcoal → hold fabric or hair over smoke to absorb fragrance → pass mabkhara clockwise among guests',
    tags: ['bukhoor', 'incense', 'arab', 'gulf', 'smoke', 'oud', 'hospitality', 'ritual'],
  },
  black_seed_oil_fragrance: {
    id: 'black_seed_oil_fragrance',
    name: 'Black Seed (Nigella Sativa) Oil',
    family: 'herbal',
    origin: 'Egypt, Middle East, South Asia',
    description: 'Black seed (kalonji/habbatus sauda) oil has a sharp, peppery, medicinal scent used in skin and hair care across Arab, South Asian, and East African traditions.',
    scent: 'Sharp, peppery, earthy, slightly bitter — medicinal but distinctive',
    communities: ['arab', 'east-african', 'south-asian'],
    
    uses: ['hair treatment', 'skin treatment', 'aromatherapy'],
    culturalContext: 'The Prophet Muhammad (PBUH) said: "There is healing in black seed for all diseases except death." This hadith has made black seed an essential in Muslim households globally for wellness and beauty.',
    tags: ['black-seed', 'kalonji', 'nigella', 'arab', 'south-asian', 'east-african', 'medicinal', 'religious'],
  },
  neroli_north_african: {
    id: 'neroli_north_african',
    name: 'North African Neroli (Zahar)',
    family: 'floral',
    origin: 'Morocco, Tunisia, Algeria',
    description: 'Neroli (orange blossom water) from bitter orange (Citrus aurantium) trees — a cornerstone of North African wedding and beauty traditions.',
    scent: 'Fresh, light, honey-like floral with sweet citrus undertones. Calming and sophisticated.',
    communities: ['arab', 'latina (Cuba, colonial influence)'],
    
    uses: ['orange blossom water as skin toner', 'bridal ritual', 'Moroccan pastry flavouring', 'perfume'],
    culturalContext: 'In Morocco, orange blossom water is sprinkled on guests at weddings and celebrations. It is also used to wash hands before eating at celebratory dinners. The smell of orange blossom defines Moroccan spring.',
    tags: ['neroli', 'orange-blossom', 'zahar', 'moroccan', 'north-african', 'arab', 'floral', 'bridal'],
  },
  saffron_scent: {
    id: 'saffron_scent',
    name: 'Saffron (Za\'faran)',
    arabicName: 'زعفران',
    family: 'spice',
    origin: 'Iran, Kashmir, Morocco',
    
    scent: 'Warm, golden, honeyed, slightly leathery, sweet-metallic. Distinctive and luxurious.',
    communities: ['arab', 'south-asian'],
    
    uses: ['perfume ingredient', 'skincare (brightening)', 'bridal beauty ritual', 'incense'],
    
    tags: ['saffron', 'zafaran', 'arab', 'south-asian', 'luxury', 'spice', 'bridal', 'iran', 'kashmir'],
  },
};

// ─── CULTURAL PERFUMERY TRADITIONS ───────────────────────────────────────────

export const PERFUMERY_TRADITIONS = {
  arab_perfumery: {
    id: 'arab_perfumery',
    name: 'Arab Perfumery Tradition',
    communities: ['arab'],
    regions: ['Arabian Peninsula', 'Levant', 'North Africa'],
    
    traditions: [
      {
        name: 'Bukhoor (Incense)',
        description: 'Scenting rooms and clothing with smoke from oud chips and resins burned in a mabkhara',
        occasions: ['Eid', 'Ramadan', 'weddings', 'guest arrival', 'daily'],
      },
      {
        name: 'Dahn al-Oud (Oud Oil)',
        description: 'Pure oud oil applied directly to skin and pulse points. Considered the highest luxury',
        occasions: ['Religious prayers', 'weddings', 'formal occasions'],
      },
      {
        name: 'Rose Water (Ma\' al-Ward)',
        description: 'Rose water sprinkled on guests from a rose water sprinkler (mibkhara)',
        occasions: ['Weddings', 'celebrations', 'welcoming guests', 'mosques'],
      },
    ],
    signatureIngredients: ['oud', 'rose', 'frankincense', 'ambergris', 'musk', 'saffron', 'sandalwood'],
    alcoholFree: true,
    notes: 'Arab perfumery is traditionally alcohol-free (attar/oil-based) due to Islamic prohibition on alcohol. This has driven a sophisticated oil perfumery tradition.',
    tags: ['arab', 'oud', 'musk', 'rose', 'traditional', 'oil-based', 'ancient'],
  },

  south_asian_attar: {
    id: 'south_asian_attar',
    name: 'South Asian Attar Tradition (Kannauj)',
    communities: ['south-asian'],
    regions: ['India (Kannauj, UP)', 'Pakistan'],
    description: 'Kannauj in Uttar Pradesh is the perfume capital of India — home to centuries of attar-making using the degh-bhapka (still-receiver) method.',
    traditions: [
      {
        name: 'Degh-Bhapka Distillation',
        
        occasions: ['Production method — not a ritual'],
      },
      {
        name: 'Mitti Attar',
        description: 'The world\'s only "earth" attar — distilled from baked earth (clay) from the banks of the Ganges in Kannauj. The smell of first rain on dry earth (petrichor) captured in a bottle.',
        occasions: ['Monsoon gift', 'unique offering'],
      },
      {
        name: 'Gajra (Hair Garland)',
        description: 'Fresh jasmine (mogra) strung into a hairpiece and worn daily. The natural fragrance is a wearable perfume.',
        occasions: ['Daily', 'temple', 'celebrations'],
      },
    ],
    signatureIngredients: ['rose', 'jasmine', 'sandalwood', 'kewda (pandanus)', 'saffron', 'vetiver (khus)', 'mitti'],
    alcoholFree: true,
    tags: ['south-asian', 'attar', 'kannauj', 'india', 'distillation', 'jasmine', 'rose', 'sandalwood'],
  },

  east_african_incense: {
    id: 'east_african_incense',
    name: 'East African Incense Tradition',
    communities: ['east-african'],
    regions: ['Somalia', 'Ethiopia', 'Eritrea', 'Djibouti'],
    description: 'East Africa — particularly Somalia and Ethiopia — is the historic origin of frankincense and myrrh. The trees that produce these sacred resins grow almost exclusively in the Horn of Africa and Oman.',
    traditions: [
      {
        name: 'Usale / Wasale (Somali)',
        description: 'Somali incense ritual — burning various resins and spices to scent the home and body after bathing',
        occasions: ['Post-bath', 'after childbirth', 'weddings', 'Eid'],
      },
      {
        name: 'Ethiopian Orthodox Incense',
        description: 'Ethiopian Orthodox Christian services are heavily incensed — frankincense burned throughout. Considered sacred in the church.',
        occasions: ['Church services', 'religious occasions', 'home blessings'],
      },
    ],
    signatureIngredients: ['frankincense', 'myrrh', 'opoponax', 'sandalwood', 'benzoin', 'East African oud'],
    tags: ['east-african', 'frankincense', 'myrrh', 'somali', 'ethiopian', 'incense', 'sacred'],
  },
};

// ─── COMMUNITY FRAGRANCE PROFILES ────────────────────────────────────────────

export const COMMUNITY_FRAGRANCE_PROFILES = {
  'west-african': {
    signatureScents: ['shea butter (natural)', 'black seed', 'African musk', 'cedar'],
    perfumeStyle: 'Bold, warm, skin-close musks and woods. Fragrance is intimate.',
    occasions: {
      everyday: ['African musk', 'African wood'],
      celebration: ['oud blends', 'rose-musk attars'],
      bridal: ['Deep musk and oud'],
    },
    avoidSheer: false,
    notes: 'West African fragrance tradition is body-centred — skin warming a musk is considered ideal.',
  },
  'south-asian': {
    signatureScents: ['rose', 'jasmine', 'sandalwood', 'kewda', 'oud attar', 'vetiver', 'saffron'],
    perfumeStyle: 'Oil-based attars. Rich florals on sandalwood base. Hair fragrance (gajra) equally important as skin.',
    occasions: {
      everyday: ['Rose attar', 'jasmine gajra'],
      celebration: ['Sandalwood attar', 'saffron-rose'],
      bridal: ['Kesar (saffron) attar', 'rose-sandalwood', 'Indian oud'],
    },
    avoidSheer: false,
    notes: 'Traditionally alcohol-free. The jasmine gajra in hair is as important as any bottled fragrance.',
  },
  'arab': {
    signatureScents: ['oud', 'rose (Taif)', 'frankincense', 'musk', 'amber', 'saffron', 'orange blossom'],
    perfumeStyle: 'Rich, long-lasting, oil-based. Perfume should leave a presence in a room. Bukhoor as room fragrance.',
    occasions: {
      everyday: ['Light musk oil', 'rose water'],
      celebration: ['Oud oil', 'saffron-rose blend'],
      bridal: ['Taif rose', 'royal oud blend', 'musk and amber'],
    },
    avoidSheer: true,
    notes: 'Alcohol-free (oil/water base) for Muslim communities. Fragrance generosity is cultural — a scent trail is a compliment, not a faux pas.',
  },
  'east-asian': {
    signatureScents: ['white tea', 'cherry blossom', 'yuzu', 'hinoki (Japanese cypress)', 'bamboo', 'Japanese incense (koh)'],
    perfumeStyle: 'Restrained, elegant, transparent. Fragrance should not overwhelm. Clean and subtle.',
    occasions: {
      everyday: ['White tea', 'rice water', 'light citrus'],
      celebration: ['Cherry blossom', 'white florals'],
      bridal: ['White lily', 'clean musk'],
    },
    avoidSheer: false,
    notes: 'Japanese kodo (incense ceremony) is a refined fragrance art. Many East Asian cultures prefer subtle fragrance over heavy projection.',
  },
  'caribbean': {
    signatureScents: ['frangipani (plumeria)', 'coconut', 'lime', 'tropical florals', 'rum note', 'sea salt'],
    perfumeStyle: 'Fresh, tropical, light. The ocean and warm sun in a bottle.',
    occasions: {
      everyday: ['Coconut and lime'],
      celebration: ['Tropical florals'],
      bridal: ['Frangipani and jasmine'],
    },
    avoidSheer: false,
    notes: 'The natural scents of the Caribbean — coconut oil on warm skin, frangipani in the breeze — are beloved as signature scents.',
  },
  'latina': {
    signatureScents: ['gardenia', 'tuberose', 'jasmine', 'vanilla', 'warm amber', 'tropical fruit'],
    perfumeStyle: 'Bold, sensual, warm. Latin perfume culture favours presence and sillage.',
    occasions: {
      everyday: ['Gardenia', 'jasmine'],
      celebration: ['Tuberose', 'warm amber'],
      bridal: ['Deep tuberose', 'vanilla and amber'],
    },
    avoidSheer: false,
    notes: 'Latin fragrance culture favours warmth and sensuality. The powdery-warm dry-down of tuberose and vanilla is iconic.',
  },
  'east-african': {
    signatureScents: ['frankincense', 'myrrh', 'East African oud', 'rose', 'sandalwood', 'African spices'],
    perfumeStyle: 'Incense-heavy, resinous. Fragrance as both beauty and spiritual practice.',
    occasions: {
      everyday: ['Rosewater and sandalwood'],
      celebration: ['Frankincense burning', 'East African oud'],
      bridal: ['Deep myrrh and musk'],
    },
    avoidSheer: false,
    notes: 'The frank incense trade route shaped East African culture. Fragrance here is inseparable from spirituality and community celebration.',
  },
};

// ─── QUERY FUNCTIONS ─────────────────────────────────────────────────────────

/**
 * Get fragrance note by ID
 * @param {string} id
 * @returns {Object|null}
 */
export function getFragranceNote(id) {
  return FRAGRANCE_NOTES[id] || null;
}

/**
 * Get fragrance notes for community
 * @param {string} communityId
 * @returns {Object[]}
 */
export function getFragranceNotesForCommunity(communityId) {
  return Object.values(FRAGRANCE_NOTES).filter(n =>
    (n.communities || []).includes(communityId)
  );
}

/**
 * Get community fragrance profile
 * @param {string} communityId
 * @returns {Object|null}
 */
export function getCommunityFragranceProfile(communityId) {
  return COMMUNITY_FRAGRANCE_PROFILES[communityId] || null;
}

/**
 * Get alcohol-free fragrance options
 * @returns {Object[]}
 */
export function getAlcoholFreeFragrances() {
  return Object.values(FRAGRANCE_NOTES).filter(n => !n.alcoholBased);
}

/**
 * Get fragrance tradition for community
 * @param {string} communityId
 * @returns {Object|null}
 */
export function getFragranceTradition(communityId) {
  return Object.values(PERFUMERY_TRADITIONS).find(t =>
    (t.communities || []).includes(communityId)
  ) || null;
}

/**
 * Get notes by family
 * @param {string} family
 * @returns {Object[]}
 */
export function getNotesByFamily(family) {
  return Object.values(FRAGRANCE_NOTES).filter(n => n.family === family);
}

/**
 * Search fragrance notes by tag
 * @param {string} tag
 * @returns {Object[]}
 */
export function searchFragranceByTag(tag) {
  const norm = tag.toLowerCase();
  return Object.values(FRAGRANCE_NOTES).filter(n =>
    (n.tags || []).some(t => t.includes(norm))
  );
}

// ─── STATS ───────────────────────────────────────────────────────────────────

