/**
 * MIRRR Fermented Skincare & Beauty Ingredients
 * Science and tradition of fermentation in beauty
 * Galactomyces, sake, rice water, fermented oils, probiotics for skin
 */

// ─── WHAT IS FERMENTATION IN SKINCARE ─────────────────────────────────────────

export const FERMENTATION_OVERVIEW = {
  what_is_fermentation: 'Fermentation is a metabolic process where microorganisms (bacteria, yeast, fungi) break down organic compounds into simpler substances. In skincare, fermentation transforms ingredients into forms that are more bioavailable (better absorbed), more stable, and often more potent.',

  why_fermentation_improves_ingredients: {
    smaller_molecules: 'Fermentation can break down large molecules (like proteins in rice water) into smaller peptide fragments that penetrate the skin more effectively',
    increased_bioactivity: 'The fermentation process generates new bioactive compounds not present in the original ingredient — metabolites, enzymes, and short-chain fatty acids that have skin benefits',
    natural_preservation: 'The acidic byproducts of fermentation (lactic acid, acetic acid) naturally lower pH and inhibit pathogen growth',
    enhanced_antioxidants: 'Antioxidant activity often INCREASES during fermentation as bound antioxidants are released',
    probiotic_compounds: 'Postbiotic compounds (byproducts of probiotic bacteria) have anti-inflammatory and barrier-supporting effects on skin',
  },

  cultural_context: 'Fermentation in beauty is not new — Korean makgeolli rice wine rinses, Japanese sake baths, and Indian fermented besan (chickpea flour) have been used for centuries. K-beauty brought these ancient traditions into modern skincare science, and the rest of the world is catching up.',
};

// ─── GALACTOMYCES FERMENT FILTRATE ────────────────────────────────────────────

export const GALACTOMYCES_GUIDE = {
  what: 'Galactomyces ferment filtrate is the liquid extract produced by fermenting Galactomyces candidum yeast. This is one of the most potent fermented skincare ingredients and the cornerstone of K-beauty brightening.',

  origin_story: {
    discovery: 'The story goes that workers in Japanese sake breweries were noticed to have extraordinarily youthful, soft hands despite doing hard physical labour — while their faces showed their age, their sake-fermented-contact hands looked decades younger.',
    research: 'This observation led researchers at Kose Corporation (Japanese cosmetics) to investigate. They isolated Galactomyces ferment filtrate as the active compound and developed SK-II Facial Treatment Essence — which became one of the most famous (and expensive) skincare products in the world.',
    sk2: 'SK-II\'s Pitera (their branded name for galactomyces ferment filtrate) became famous in Asia and then globally for its transformative effects on skin texture and brightness.',
  },

  proven_benefits: [
    'Brightening and even skin tone — reduces hyperpigmentation over time',
    'Improved skin texture — pores appear smaller, surface smoother',
    'Moisture retention improvement',
    'Anti-aging — reduces fine lines over time with consistent use',
    'Barrier support — strengthens the skin barrier',
  ],

  for_ethnic_skin: {
    hyperpigmentation: 'Galactomyces is one of the most evidence-backed ingredients for hyperpigmentation on deeper skin tones — a significant benefit for communities where PIH is a dominant concern',
    brightness: 'The dramatic brightening and texture-refining effects are often more visible and transformative on darker skin where uneven texture and tone are concerns',
    safety: 'Unlike hydroquinone (which has ochronosis risk on dark skin), galactomyces brightens through a safer mechanism and is suitable for all skin tones',
  },

  products: [
    { name: 'SK-II Facial Treatment Essence', note: 'The original — 90%+ galactomyces. Eye-watering price (~$180). The gold standard.', budget: 'Luxury' },
    { name: 'COSRX Galactomyces 95 Tone Balancing Essence', note: '95% galactomyces — extremely close to SK-II at a fraction of the price (~$25). The K-beauty community\'s alternative.', budget: 'Affordable' },
    { name: 'Missha Time Revolution First Treatment Essence', note: 'Fermented yeast extract, similar mechanism, affordable (~$30)', budget: 'Affordable' },
    { name: 'Benton Fermentation Essence', note: 'Multiple fermented ingredients including galactomyces, centella', budget: 'Budget-friendly' },
  ],

  how_to_use: {
    when: 'After cleansing and toning — before other serums and moisturisers',
    how: 'Pat onto face with hands or cotton pad. Can be used morning and evening.',
    frequency: 'Daily — this is a gentle, foundational ingredient',
    when_to_expect_results: '4-8 weeks for texture improvement; 8-12 weeks for significant brightening',
  },
};

// ─── SAKE AND RICE WINE FERMENTS ──────────────────────────────────────────────

export const SAKE_FERMENT_GUIDE = {
  what: 'Sake is rice wine — fermented rice with Aspergillus oryzae koji mold. Sake fermentation produces ferulic acid, kojic acid, amino acids, and other bioactives that are deeply beneficial for skin.',

  key_actives_in_sake_ferment: {
    kojic_acid: {
      what: 'A byproduct of koji fermentation — one of the most studied natural skin brighteners',
      how_it_works: 'Inhibits tyrosinase (the enzyme that produces melanin) — directly targets the melanin production pathway',
      strength: 'One of the more powerful natural brighteners available. Often used in Japan for hyperpigmentation treatment.',
      for_ethnic_skin: 'Effective for PIH on darker skin tones. However, must be used at appropriate concentrations — too strong too fast can be irritating.',
      products: ['The Face Shop Rice Water Bright line', 'Tatcha products (contain rice ferment)', 'Shiseido White Lucent (contains sake ferment)'],
    },
    ferulic_acid: {
      what: 'A powerful antioxidant derived from grain fermentation — also found in rice, oats, and wheat',
      how_it_works: 'Scavenges free radicals. Synergistically boosts effectiveness of vitamin C and E by 2-8x when combined.',
      famous_formula: 'SkinCeuticals CE Ferulic (vitamin C + E + ferulic acid) is one of the most evidence-backed antioxidant serums available. Ferulic acid makes the vitamin C and E in the serum dramatically more effective.',
    },
  },

  sake_bath_tradition: {
    what: 'Traditional Japanese practice — sake added to bath water for soft, brightening skin effects',
    how_to: 'Add 1-2 cups of sake to a full bath. Soak for 15-20 minutes.',
    effect: 'Skin feels extremely soft after — the kojic acid and amino acids absorb through the skin during soaking',
    modern_equivalent: 'Fermented rice water in bath — more affordable version with similar principles',
  },

  sake_lees: {
    what: 'The leftover sediment (lees/kasu) after sake is pressed — extremely concentrated in fermented bioactives',
    in_skincare: 'Sake kasu is used in Japanese skincare for its concentrated brightening and anti-aging effects',
    products: ['Tatcha (based heavily on sake and camellia)', 'Some Japanese spa and onsen treatments use sake lees masks'],
  },
};

// ─── RICE WATER FERMENT ───────────────────────────────────────────────────────

export const RICE_WATER_FERMENT = {
  what: 'Fermented rice water — the liquid from soaking or boiling rice, left to ferment. Has been used in East and Southeast Asian beauty for centuries.',

  active_compounds: {
    inositol: {
      what: 'A B-vitamin-like compound that remains in the rice water and actually penetrates the hair shaft',
      benefit: 'Can repair damaged hair from the inside out. Reduces friction. Improves elasticity.',
      unique: 'Inositol is the only known compound that penetrates the hair and is retained there even after rinsing — creating an internal repair that lasts until the hair grows out.',
    },
    amino_acids: 'Rice protein broken down into amino acids during fermentation — absorbed by skin and hair',
    vitamins: 'B vitamins including inositol, as well as vitamin E',
  },

  how_to_ferment: [
    'Rinse uncooked rice twice',
    'Soak 1/2 cup rice in 2-3 cups water for 30 minutes (for unfermented) or 24-48 hours at room temperature (for fermented)',
    'Fermented version smells sour/slightly tangy — this is right',
    'Strain out the rice',
    'Store in refrigerator for up to 1 week (fermented lasts less than plain)',
    'Dilute before use: 1 part rice water to 3-5 parts water (it\'s concentrated)',
  ],

  uses: {
    hair_rinse: 'After conditioning, pour diluted rice water over hair. Leave 5-20 minutes. Rinse with cool water. Use 1x per week.',
    face_toner: 'Apply diluted rice water as a toner with cotton pad or hands. Mild brightening and pore-minimising over time.',
    face_mask: 'Undiluted fermented rice water left on face for 10-15 minutes as a brightening treatment.',
    body_treatment: 'Add to bath or spray on skin for softening effect.',
  },

  for_hair_types: {
    type_4_note: 'Rice water contains protein — too much protein can make Type 4 hair feel stiff and brittle (protein overload). Start with just 5 minutes, assess how your hair responds, and space out applications to 1x every 2 weeks.',
    type_1_2: 'Excellent for adding shine and volume without heaviness',
    type_3: 'Beneficial for definition and frizz reduction',
  },
};

// ─── FERMENTED OILS ───────────────────────────────────────────────────────────

export const FERMENTED_OILS = {
  what: 'Fermentation of plant oils creates oils with altered molecular structure — often lighter in texture, higher in bioavailable fatty acids, and containing additional fermented compounds.',

  fermented_camellia_oil: {
    what: 'Fermented tsubaki (camellia japonica) oil — the classic becomes more bioavailable through fermentation',
    traditional_use: 'Japanese women have used pure camellia oil for centuries. Fermented versions have higher concentrations of active compounds.',
    benefits: 'Extremely lightweight, rich in oleic acid (penetrates deeply), excellent for damaged and dry hair and skin',
  },

  fermented_argan_oil: {
    what: 'Argan oil fermented with beneficial bacteria',
    benefit: 'Improved penetration of the same fatty acids and vitamin E present in regular argan oil',
    note: 'Less common than standard argan oil — argan is already excellent without fermentation',
  },

  fermented_squalane: {
    what: 'Squalane can be derived from sugarcane via fermentation (eco-friendly alternative to shark-derived squalane)',
    benefit: 'Fermentation-derived squalane is sustainable and identical in molecular structure to skin-natural squalane. An excellent moisturiser for all skin tones.',
    note: 'When buying squalane, look for "sugarcane-derived" or "fermented" for the ethical choice. The skin benefits are identical.',
  },
};

// ─── PROBIOTICS IN SKINCARE ───────────────────────────────────────────────────

export const PROBIOTICS_SKINCARE = {
  what: 'Probiotic skincare contains live bacterial strains, lysates (broken-down bacteria), or postbiotics (metabolites from bacteria) applied topically to support the skin microbiome.',

  the_skin_microbiome: {
    what: 'Like the gut, the skin has a microbiome — a community of bacteria, fungi, and viruses that live on its surface. A balanced microbiome is associated with healthy, resilient skin.',
    when_disrupted: 'Disruption of the skin microbiome (from aggressive cleansing, antibiotics, pollution) is linked to: eczema, rosacea, acne, and increased sensitivity',
    ethnic_skin_note: 'Research on the skin microbiome has largely focused on lighter skin. Some preliminary research suggests the skin microbiome composition differs across ethnic groups — an area of active study.',
  },

  forms: {
    live_probiotics: 'Actual living bacteria in a formulation. Difficult to stabilise — most products use lysates or postbiotics instead.',
    lysates: 'Filtered extracts of bacteria — bacterial cell wall components and metabolites without live bacteria. More stable.',
    postbiotics: 'The metabolic byproducts of probiotic bacteria — short-chain fatty acids, exopolysaccharides, bacteriocins. The most modern approach.',
  },

  benefits_evidence: {
    eczema: 'Strongest evidence — probiotic topicals reduce eczema (atopic dermatitis) symptoms. Lactobacillus johnsonii particularly studied.',
    acne: 'Some evidence — probiotic treatment reduces inflammatory acne. Lactobacillus strains compete with Cutibacterium acnes (the acne bacterium).',
    rosacea: 'Growing evidence — probiotic topicals reduce redness and sensitivity in rosacea.',
    general_skin_health: 'Less proven — "microbiome-friendly" is largely marketing for general skin health claims without disease',
  },

  for_ethnic_skin: {
    eczema_prevalence: 'Eczema (atopic dermatitis) is more prevalent in people of colour — particularly Black children have higher rates. Probiotic skincare and microbiome-supporting routines (avoiding excessive cleansing, using barrier-supporting products) are particularly relevant.',
    irritated_compromised_skin: 'Postbiotic and probiotic ingredients are non-irritating and supportive — safe for sensitive, compromised, or irritated skin which is common in darker skin dealing with PIH-prone conditions.',
  },

  products: [
    { name: 'Mother Dirt AO+ Mist', note: 'Contains live Ammonia-Oxidising Bacteria (AOB) — an interesting microbiome approach', type: 'Live bacteria' },
    { name: 'Gallinée Micro-Peel', note: 'Contains prebiotic (food for bacteria) and postbiotic approach', type: 'Pre/postbiotic' },
    { name: 'Symbiome products', note: 'Science-backed microbiome approach from dermatologists', type: 'Postbiotic' },
    { name: 'La Roche-Posay Toleriane Double Repair', note: 'Contains prebiotic thermal water — gentle, supports skin microbiome', type: 'Prebiotic' },
  ],
};

// ─── LACTIC ACID & FERMENTED AHAs ────────────────────────────────────────────

export const FERMENTED_AHAS = {
  lactic_acid: {
    what: 'Lactic acid is an AHA (alpha-hydroxy acid) produced by fermentation of carbohydrates by Lactobacillus bacteria. The same bacteria that makes yoghurt, kefir, and sauerkraut.',
    benefits: [
      'Gentle exfoliation — removes dead skin cells',
      'Brightening — reduces hyperpigmentation over time',
      'Humectant — draws water to the skin',
      'NMF (Natural Moisturising Factor) support — produces substances that keep the skin naturally hydrated',
    ],
    for_ethnic_skin: 'Lactic acid is one of the most recommended AHAs for darker skin tones — it is gentler than glycolic acid (less risk of over-exfoliation triggering PIH) while still effective for hyperpigmentation treatment',
    products: ['The Ordinary Lactic Acid 5% + HA', 'Paula\'s Choice Radiance Renewal Mask (10% lactic acid)', 'AmLactin lotion (12% lactic acid — body use)'],
    at_home_version: 'Raw fermented dairy (yoghurt, kefir, buttermilk) applied topically as a mask delivers natural lactic acid — an ancient beauty practice with real science behind it',
  },

  fermented_black_tea: {
    what: 'Kombucha (fermented black tea with SCOBY — Symbiotic Culture Of Bacteria and Yeast) in skincare',
    benefits: 'Antioxidant-rich, alpha-hydroxy acids from fermentation, probiotic compounds',
    products: ['Some emerging brands use kombucha as a key ingredient', 'Tony Moly products with fermented tea'],
    diy: 'Fresh kombucha applied as a face mask or toner (unflavoured, plain kombucha) — natural AHA and antioxidant treatment',
  },
};

// ─── TRADITIONAL FERMENTED BEAUTY BY COMMUNITY ───────────────────────────────

export const TRADITIONAL_FERMENTED_BEAUTY = {
  korean: {
    makgeolli: {
      what: 'Korean rice wine — fermented with nuruk (wheat or rice mold) and water',
      use: 'Makgeolli rinse — apply to face and hair for brightening and softening',
      compounds: 'Contains kojic acid, organic acids, amino acids, vitamins B',
    },
    doenjang: {
      what: 'Korean fermented soybean paste — equivalent to Japanese miso',
      use: 'Rarely used directly in beauty now, but the fermented soy tradition feeds into ingredients like isoflavones and soy ferment filtrate in K-beauty',
    },
  },
  japanese: {
    sake: 'Sake and sake lees — see above',
    miso: {
      what: 'Fermented soybean paste — contains isoflavones (phytoestrogens) with skin-brightening and anti-aging properties',
      use: 'Traditional face mask ingredient — miso mixed with rice bran applied to face in Japanese beauty tradition',
    },
    nuka: {
      what: 'Rice bran (nuka) — the outer layer of rice grain, rich in antioxidants, vitamin E, and oryzanol',
      use: 'Rice bran scrub (nuka bukuro — a cloth bag of rice bran) was historically used for bathing in Japan. Creates a lightly exfoliating, conditioning effect.',
      modern: 'Rice bran extract (Oryza sativa bran extract) appears in many Asian skincare products',
    },
  },
  south_asian: {
    fermented_besan: {
      what: 'Chickpea flour (besan) left with yoghurt or water to slightly ferment before use as a face pack',
      how: 'Traditionally, besan-based face packs (ubtan) were made ahead and allowed to sit briefly, allowing mild fermentation to increase lactic acid content',
      benefit: 'The mild lactic acid from yoghurt + mild fermentation = brightening and exfoliating action. The oldest chemical peel.',
    },
    dahi: {
      what: 'Indian yoghurt (dahi) — a staple beauty ingredient across South Asia',
      use: 'Applied directly to face and hair as a mask — delivers natural lactic acid, probiotics, and proteins',
      hair_use: 'Dahi + amla powder mask for hair — conditions, adds shine, supports scalp health',
    },
  },
  west_african: {
    shea_butter_fermentation: {
      what: 'Traditional shea butter processing involves fermentation of the shea nuts before extraction in some regional methods',
      note: 'The terroir (regional variation) in raw shea butter flavour and colour relates partly to processing differences including fermentation extent',
    },
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getGalactomycesGuide() {
  return GALACTOMYCES_GUIDE;
}

export function getRiceWaterGuide() {
  return RICE_WATER_FERMENT;
}

export function getSakeIngredients() {
  return SAKE_FERMENT_GUIDE;
}

export function getProbioticGuide() {
  return PROBIOTICS_SKINCARE;
}

export function getTraditionalFermentedBeauty(communityId) {
  const map = {
    'east-asian': TRADITIONAL_FERMENTED_BEAUTY.korean,
    'south-asian': TRADITIONAL_FERMENTED_BEAUTY.south_asian,
    'west-african': TRADITIONAL_FERMENTED_BEAUTY.west_african,
    'arab': { sake_equivalent: 'Fermented black seed oil preparations are traditional', note: 'Arab traditional medicine uses fermented formulations' },
  };
  return map[communityId] || null;
}

export function getFermentedAHAGuide() {
  return FERMENTED_AHAS;
}

export const FERMENTED_GUIDE_STATS = {
  fermentedIngredientTypes: 5,
  communitiesWithTraditionalFermentation: Object.keys(TRADITIONAL_FERMENTED_BEAUTY).length,
  galactomycesProducts: GALACTOMYCES_GUIDE.products.length,
};
