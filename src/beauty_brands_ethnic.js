/**
 * beauty_brands_ethnic.js — Full multicultural beauty brand landscape for MIRRR
 * Hair care, skincare, and wellness brands with ethnic community focus
 */

// ─── BRAND TYPES ─────────────────────────────────────────────────────────────

export const BRAND_TYPES = {
  hair_care: { id: 'hair_care', label: 'Hair Care', icon: '💈' },
  skincare: { id: 'skincare', label: 'Skincare', icon: '🧴' },
  makeup: { id: 'makeup', label: 'Makeup', icon: '💄' },
  body: { id: 'body', label: 'Body Care', icon: '🧼' },
  fragrance: { id: 'fragrance', label: 'Fragrance', icon: '🌸' },
  wellness: { id: 'wellness', label: 'Beauty Wellness', icon: '🌿' },
  tools: { id: 'tools', label: 'Tools & Accessories', icon: '🪮' },
};

// ─── HAIR CARE BRANDS ─────────────────────────────────────────────────────────

export const HAIR_CARE_BRANDS = {

  camille_rose: {
    id: 'camille_rose',
    name: 'Camille Rose',
    founder: 'Janell Stephens (Black American)',
    founded: 2011,
    type: 'hair_care',
    community: 'black-american',
    focus: 'Natural, plant-based hair care for coily and curly hair',
    heroProducts: ['Curl Maker', 'Algae Renew Deep Conditioner', 'Coconut Water Cowash'],
    priceRange: '$$',
    availability: 'Target, Sally Beauty, online',
    story: 'Janell Stephens started making products in her kitchen for her five children. Now Camille Rose is one of the biggest names in the natural hair movement.',
    notes: 'The Curl Maker is a holy grail product for 4A-4C hair — strong hold without crunch.',
    tags: ['natural', 'coily', 'curly', 'black-owned', 'plant-based', 'kitchen-made'],
  },

  as_i_am: {
    id: 'as_i_am',
    name: 'As I Am',
    founder: 'Calvin Hawkins (Black American)',
    founded: 2012,
    type: 'hair_care',
    community: 'black-american',
    focus: 'Science-backed natural hair care',
    heroProducts: ['Coconut CoWash', 'Long & Luxe Jai Butter', 'Twist Defining Cream'],
    priceRange: '$',
    availability: 'Target, Walmart, Sally Beauty',
    story: 'Founded by a scientist who believed in combining nature and science. The Coconut CoWash is a cornerstone of the co-washing movement.',
    notes: 'Strong scientific approach — every product is dermatologist-tested. Great drugstore-affordable option.',
    tags: ['natural', 'science-backed', 'coily', 'co-wash', 'affordable', 'black-owned'],
  },

  briogeo: {
    id: 'briogeo',
    name: 'Briogeo',
    founder: 'Nancy Twine (Black American)',
    founded: 2013,
    type: 'hair_care',
    community: 'black-american',
    focus: 'Clean, results-driven hair care for all textures',
    heroProducts: ['Don\'t Despair, Repair! Deep Conditioning Mask', 'Curl Charisma Rice Amino + Avocado Hydrating Shampoo', 'Be Gentle, Be Kind Banana + Coconut Shampoo'],
    priceRange: '$$$',
    availability: 'Sephora, Ulta',
    story: 'Nancy Twine became the youngest Black woman to launch a product line at Sephora. Inspired by her grandmother\'s homemade beauty recipes.',
    notes: 'The Don\'t Despair, Repair mask is one of the most-loved deep conditioning treatments for 3C-4C hair.',
    tags: ['clean', 'luxury', 'sephora', 'black-owned', 'all-textures'],
  },

  mielle_organics: {
    id: 'mielle_organics',
    name: 'Mielle Organics',
    founder: 'Monique Rodriguez (Black American)',
    founded: 2014,
    type: 'hair_care',
    community: 'black-american',
    focus: 'Vitamin-enriched natural hair products; famous for Rosemary Mint treatment',
    heroProducts: ['Rosemary Mint Scalp & Hair Strengthening Oil', 'Mongongo Oil Hydrating Conditioner', 'Pomegranate & Honey Curl Smoothie'],
    priceRange: '$$',
    availability: 'Walmart, Target, CVS, Ulta',
    story: 'Monique Rodriguez was a registered nurse who started mixing her own hair products. Her Rosemary Mint oil became a cultural phenomenon — TikTok made it a bestseller.',
    notes: 'The Rosemary Mint oil went viral on TikTok for stimulating hair growth. Monique sold to P&G in 2023 — the community had mixed feelings, but formulas remained.',
    tags: ['rosemary', 'growth', 'black-owned', 'viral', 'natural', 'scalp-health'],
  },

  shea_moisture: {
    id: 'shea_moisture',
    name: 'SheaMoisture',
    founder: 'Richelieu Dennis (Sierra Leonean-American)',
    founded: 1991,
    type: 'hair_care',
    community: 'west-african',
    focus: 'Shea butter and African ingredients for textured hair and skin',
    heroProducts: ['Jamaican Black Castor Oil Strengthen & Restore Shampoo', '100% Pure Jamaican Black Castor Oil', 'Coconut & Hibiscus Curl Enhancing Smoothie'],
    priceRange: '$',
    availability: 'Walmart, Target, CVS, Walgreens, everywhere',
    story: 'Family recipe from Sierra Leone passed down from grandmother Sofi Tucker. Richelieu started selling at Harlem markets. Now the most accessible textured hair brand in America.',
    notes: 'The JBCO (Jamaican Black Castor Oil) line remains the brand\'s most culturally important product line.',
    tags: ['shea', 'west-african', 'sierra-leone', 'mass-market', 'heritage', 'accessible'],
  },

  darshana: {
    id: 'darshana',
    name: 'Darshana',
    founder: 'Vandana Iyer',
    founded: 2019,
    type: 'hair_care',
    community: 'south-asian',
    focus: 'Ayurvedic hair care inspired by traditional South Asian hair rituals',
    heroProducts: ['Strengthening Hair Elixir', 'Amla & Brahmi Scalp Treatment', 'Champi Massage Oil'],
    priceRange: '$$',
    availability: 'Online direct',
    story: 'Founded on the tradition of champi — the Indian head massage practice. Brings Indian hair oiling culture to a modern format.',
    notes: 'Authentic Ayurvedic formulas with clinical backing. Amla, brahmi, and bhringraj — the holy trinity of Indian hair care.',
    tags: ['ayurvedic', 'south-asian', 'amla', 'champi', 'herbal', 'scalp'],
  },

  aunt_jackies: {
    id: 'aunt_jackies',
    name: "Aunt Jackie's",
    founder: 'Community-rooted brand',
    founded: 2010,
    type: 'hair_care',
    community: 'black-american',
    focus: 'Curl and coil defining products at affordable prices',
    heroProducts: ['Don\'t Shrink Flaxseed Elongating Curling Gel', 'Frizz Patrol Anti-Puff Smoothing Gel', 'Quench Moisture Intensive Leave-In'],
    priceRange: '$',
    availability: 'Target, Walmart, Sally Beauty',
    story: 'A beloved community brand that became famous at the grassroots of the natural hair movement.',
    notes: 'The Don\'t Shrink Gel is a top pick for elongating 4C coils without losing the texture definition.',
    tags: ['natural', 'curl-defining', 'affordable', 'coily', 'flaxseed'],
  },

  pattern_beauty: {
    id: 'pattern_beauty',
    name: 'Pattern Beauty',
    founder: 'Tracee Ellis Ross (Black American actress)',
    founded: 2019,
    type: 'hair_care',
    community: 'black-american',
    focus: 'Curl, coil, and wave products specifically for 3C-4C textures',
    heroProducts: ['Strong Hold Gel', 'Hydration Shampoo', 'Intensive Conditioner'],
    priceRange: '$$',
    availability: 'Ulta, Target, Sephora',
    story: 'Tracee Ellis Ross created Pattern specifically for the hair textures the beauty industry most ignored. 3C-4C hair — the curliest, coiliest textures.',
    notes: 'One of the first celebrity beauty brands genuinely created for the brand\'s target community — not just slapped onto an existing product line.',
    tags: ['celebrity', 'coily', 'curly', '4c', 'black-owned', 'natural'],
  },

};

// ─── SKINCARE BRANDS ─────────────────────────────────────────────────────────

export const SKINCARE_BRANDS = {

  topicals: {
    id: 'topicals',
    name: 'Topicals',
    founder: 'Olamide Olowe and Claudia Tran (Black American / Vietnamese-American)',
    founded: 2020,
    type: 'skincare',
    community: 'black-american',
    focus: 'Condition-specific skincare for hyperpigmentation, eczema, dark marks on melanin-rich skin',
    heroProducts: ['Faded Serum', 'Like Butter Hydrating Mask', 'High Roller Ingrown Hair Tonic'],
    priceRange: '$$',
    availability: 'Sephora, online',
    story: 'Two women of colour who couldn\'t find products for their specific skin conditions founded Topicals. Olamide Olowe became the youngest Black woman to raise $10M in venture capital.',
    notes: 'The Faded Serum targets hyperpigmentation and dark marks — the #1 skin concern for deep skin tones. Real results for PIH.',
    tags: ['pih', 'hyperpigmentation', 'black-owned', 'condition-specific', 'dark-marks', 'eczema'],
  },

  eadem: {
    id: 'eadem',
    name: 'Eadem',
    founder: 'Alice Lin Glover & Marie Kouadio Amouzame (Chinese-American / Ivorian-American)',
    founded: 2021,
    type: 'skincare',
    community: 'east-asian',
    focus: 'Skincare formulated with melanin-smart technology for skin of colour',
    heroProducts: ['Milk Marvel Dark Spot Serum', 'Cloud Cushion Airy Moisturizer'],
    priceRange: '$$$',
    availability: 'Online direct, Sephora',
    story: 'Two women of colour who found that most skincare — even \'clean\' and \'luxury\' — was developed on white skin. Eadem ("the same" in Latin) makes skincare where skin of colour is the baseline, not an afterthought.',
    notes: 'Melanin-smart technology means every formula is designed for how melanin behaves — more reactive to irritation, more prone to PIH. Thoughtful, community-rooted approach.',
    tags: ['melanin-smart', 'poc-formulated', 'pih', 'dark-spot', 'inclusive-science'],
  },

  ami_colé: {
    id: 'ami_colé',
    name: 'Ami Colé',
    founder: 'Diarrha N\'Diaye-Mbaye (Senegalese-American)',
    founded: 2021,
    type: 'makeup',
    community: 'west-african',
    focus: 'Minimal, skin-nourishing makeup for melanin-rich skin — rooted in West African beauty traditions',
    heroProducts: ['Skin-Enhancing Tint', 'Skin-Enhancing Concealer', 'Glossy Treatment Lip Oil'],
    priceRange: '$$',
    availability: 'Nordstrom, Sephora, online',
    story: 'Diarrha grew up between New York and Senegal and saw her mother use Vaseline and lemon on her skin as a daily "no-makeup" look. Ami Colé means "my darling" in Wolof.',
    notes: 'Made specifically for melanin-rich skin. No pink undertone products. Everything warms, not mutes.',
    tags: ['senegalese', 'west-african', 'minimal', 'melanin-rich', 'no-makeup-makeup', 'wolof'],
  },

  hanahana_beauty: {
    id: 'hanahana_beauty',
    name: 'Hanahana Beauty',
    founder: 'Abena Boamah-Acheampong (Ghanaian-American)',
    founded: 2017,
    type: 'body',
    community: 'west-african',
    focus: 'Sustainable shea butter body care with direct sourcing from Ghana',
    heroProducts: ['Shea Body Butter', 'Rose Body Butter', 'Shea Balm'],
    priceRange: '$$',
    availability: 'Online direct, boutiques',
    story: 'Hanahana (means "flower" in Japanese) started by sourcing shea butter directly from women in Tamale, Ghana. Fair trade and community investment are core to the brand.',
    notes: 'One of the most ethical shea butter brands in the world — fair wages paid directly to Ghanaian shea butter cooperatives.',
    tags: ['ghana', 'west-african', 'shea', 'fair-trade', 'sustainable', 'community'],
  },

  beauty_stat: {
    id: 'beauty_stat',
    name: 'BeautyStat Cosmetics',
    founder: 'Ron Robinson (Black American)',
    founded: 2019,
    type: 'skincare',
    community: 'black-american',
    focus: 'Stabilized Vitamin C for darker skin tones without oxidation',
    heroProducts: ['Universal C Skin Refiner', 'Pro Bio Balance Moisturizer'],
    priceRange: '$$$',
    availability: 'Sephora, online',
    story: 'Ron Robinson is a cosmetic chemist who solved a real problem: Vitamin C oxidizes and turns orange on darker skin tones. He stabilized it.',
    notes: 'The Universal C Skin Refiner is clinically proven to reduce dark spots in 8 weeks — with zero orange cast. A game changer for melanin-rich Vitamin C use.',
    tags: ['vitamin-c', 'science-backed', 'dark-spots', 'black-owned', 'chemist-founded'],
  },

};

// ─── REGIONAL BEAUTY BRAND TRADITIONS ─────────────────────────────────────────

export const REGIONAL_BRAND_TRADITIONS = {

  west_african: {
    region: 'West Africa',
    keyIngredients: ['Shea butter', 'African black soap (ose dudu)', 'Baobab oil', 'Marula oil'],
    keyBrands: ['SheaMoisture', 'Hanahana Beauty', 'Juvia\'s Place', 'Ami Colé'],
    philosophy: 'Rich, deeply nourishing oils and butters that protect and restore. Community commerce — ingredients sourced directly from cooperatives.',
    culturalNotes: 'West African beauty has always prioritised deep nourishment and luminous skin. The shea butter tradition spans centuries across Ghana, Nigeria, Senegal, Burkina Faso.',
  },

  south_asian: {
    region: 'South Asia',
    keyIngredients: ['Amla (Indian gooseberry)', 'Bhringraj', 'Brahmi', 'Turmeric', 'Neem', 'Rose water', 'Henna', 'Sandalwood'],
    keyBrands: ['Kulfi Beauty', 'Darshana', 'Forest Essentials (Indian luxury)'],
    philosophy: 'Ayurveda — beauty as wellness. What you eat affects your hair and skin. Oil, ritual, and intention.',
    culturalNotes: 'The champi (head massage), the ubtan (powder mask), the haldi (turmeric ceremony) — South Asian beauty is deeply embedded in daily ritual and ceremony.',
  },

  east_asian: {
    region: 'East Asia',
    keyIngredients: ['Rice water', 'Snail mucin', 'Green tea (catechins)', 'Ginseng', 'Centella asiatica (cica)', 'Hyaluronic acid layers', 'Niacinamide'],
    keyBrands: ['Sulwhasoo', 'Laneige', 'Innisfree', 'COSRX', 'Some By Mi', 'Tatcha'],
    philosophy: 'Layers of hydration, gentle actives, prevention over correction. The 10-step routine as self-care ritual.',
    culturalNotes: 'K-beauty and J-beauty have both revolutionised global skincare. The emphasis on glass skin, barrier protection, and SPF every single day.',
  },

  arab_north_african: {
    region: 'Arab & North African',
    keyIngredients: ['Argan oil', 'Oud', 'Rose (Moroccan)', 'Black seed oil', 'Kohl', 'Hammam clay', 'Orange blossom water'],
    keyBrands: ['Huda Beauty', 'Sisley (with North African ingredients)', 'Pure Argan'],
    philosophy: 'Luxury and deep nourishment. Hammam as weekly ritual cleanse. Fragrance as identity expression.',
    culturalNotes: 'The hammam tradition — steam, scrub, mask, oil — is possibly the most complete beauty ritual in the world. Arab beauty also led global fragrance culture.',
  },

  caribbean: {
    region: 'Caribbean',
    keyIngredients: ['Coconut oil', 'Jamaican black castor oil', 'Aloe vera', 'Sea moss', 'Hibiscus', 'Shea'],
    keyBrands: ['SheaMoisture (Jamaican JBCO line)', 'Jamaican Mango & Lime', 'Tropic Isle Living'],
    philosophy: 'Tropical nourishment — coconut and castor oil traditions rooted in island agriculture and community knowledge.',
    culturalNotes: 'Caribbean hair and body traditions blend African, Indigenous (Taíno, Arawak), and European influences. The JBCO tradition is specifically Caribbean-developed.',
  },

  east_african: {
    region: 'East Africa',
    keyIngredients: ['Teff (Ethiopian grain)', 'Tej (honey)', 'Khat (leaf)', 'Shea (regional variation)', 'Njeba (sesame)', 'Rose hip oil'],
    keyBrands: ['Msaidizi (Swahili beauty)', 'Hana naturals'],
    philosophy: 'Ancient agricultural ingredients applied to beauty. Fermented foods and honey traditions.',
    culturalNotes: 'Ethiopian and Kenyan beauty traditions are some of the least-represented in mainstream multicultural beauty — one of the biggest gaps in the market.',
  },

};

// ─── QUERY FUNCTIONS ─────────────────────────────────────────────────────────

export function getHairCareBrand(id) {
  return HAIR_CARE_BRANDS[id] || null;
}

export function getSkincareeBrand(id) {
  return SKINCARE_BRANDS[id] || null;
}

export function getAllHairCareBrands() {
  return Object.values(HAIR_CARE_BRANDS);
}

export function getAllSkincareBrands() {
  return Object.values(SKINCARE_BRANDS);
}

export function getAllBrandsForCommunity(communityId) {
  const hair = Object.values(HAIR_CARE_BRANDS).filter(b => b.community === communityId);
  const skin = Object.values(SKINCARE_BRANDS).filter(b => b.community === communityId);
  return [...hair, ...skin];
}

export function getRegionalTradition(region) {
  return REGIONAL_BRAND_TRADITIONS[region] || null;
}

export function getAllRegionalTraditions() {
  return Object.values(REGIONAL_BRAND_TRADITIONS);
}

export function searchBrandsByIngredient(ingredient) {
  const norm = ingredient.toLowerCase();
  const hair = Object.values(HAIR_CARE_BRANDS).filter(b =>
    b.story?.toLowerCase().includes(norm) || b.notes?.toLowerCase().includes(norm)
  );
  const skin = Object.values(SKINCARE_BRANDS).filter(b =>
    b.story?.toLowerCase().includes(norm) || b.notes?.toLowerCase().includes(norm)
  );
  return [...hair, ...skin];
}

export const ETHNIC_BRANDS_STATS = {
  hairCareBrands: Object.keys(HAIR_CARE_BRANDS).length,
  skincareBrands: Object.keys(SKINCARE_BRANDS).length,
  regionalTraditions: Object.keys(REGIONAL_BRAND_TRADITIONS).length,
  communities: [...new Set([
    ...Object.values(HAIR_CARE_BRANDS).map(b => b.community),
    ...Object.values(SKINCARE_BRANDS).map(b => b.community),
  ])],
};

