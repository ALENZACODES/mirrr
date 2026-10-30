/**
 * MIRRR Extended Fragrance Guide
 * Perfume families, skin chemistry, layering, ethnic fragrance traditions,
 * oud guide, attar, note pyramids, and affordable alternatives
 */

// ─── FRAGRANCE SCIENCE ────────────────────────────────────────────────────────

export const FRAGRANCE_SCIENCE = {
  how_fragrance_works: {
    volatility: 'Fragrance molecules evaporate at different rates — this creates the evolution of a scent over time. Top notes evaporate quickly; heart notes more slowly; base notes last the longest.',
    note_pyramid: {
      top_notes: {
        what: 'The first impression — what you smell when you first spray. Last 15-30 minutes.',
        common: 'Citrus (bergamot, lemon, grapefruit), light herbs (basil, mint), light fruits (apple, berry)',
        note: 'Don\'t judge a fragrance solely on its top notes — the heart is the "true" fragrance.',
      },
      heart_notes: {
        what: 'The core of the fragrance — emerges after 30 minutes and lasts 2-4 hours.',
        common: 'Florals (rose, jasmine, geranium, ylang-ylang), spices (cinnamon, pepper, cardamom), fruity florals',
        note: 'The heart defines the fragrance character.',
      },
      base_notes: {
        what: 'The foundation — emerges after 1-2 hours and lasts 6+ hours. Often the most expensive ingredients.',
        common: 'Woods (sandalwood, cedarwood, vetiver), resins (frankincense, myrrh, benzoin), musks, oud, vanilla, amber',
        note: 'Base notes are what remain on skin at the end of the day.',
      },
    },
    drydown: 'The fragrance "dries down" over 2-4 hours as top and heart notes fade and base notes dominate. Always let a fragrance dry down on your skin before deciding if you love it.',
  },

  skin_chemistry: {
    why_different: 'Fragrance smells different on different people because of: skin pH (slightly acidic skin affects molecule behaviour), skin microbiome composition, genetics (specific receptor proteins), skin temperature, and body chemistry.',
    oily_vs_dry: 'Oily skin holds fragrance significantly longer than dry skin — the oils trap volatile molecules. Dry skin may need application to moisturised skin or to pulse points.',
    diet: 'What you eat can subtly influence body odour and therefore how fragrance interacts with your chemistry — spicy foods and garlic have measurable effects.',
    testing: 'Always test fragrance on YOUR skin — the blotting paper tells you the formula, your skin tells you the fragrance. Give it 30 minutes on skin before deciding.',
  },

  fragrance_concentration: {
    note: 'More concentrated = more fragrance oil = longer lasting, more intense, and more expensive per bottle.',
    levels: [
      { type: 'Eau Fraîche / Splash', concentration: '1-3%', longevity: '1-2 hours', intensity: 'Very light' },
      { type: 'Eau de Cologne (EDC)', concentration: '2-4%', longevity: '2-3 hours', intensity: 'Light' },
      { type: 'Eau de Toilette (EDT)', concentration: '5-15%', longevity: '3-5 hours', intensity: 'Moderate' },
      { type: 'Eau de Parfum (EDP)', concentration: '15-20%', longevity: '5-8 hours', intensity: 'Strong' },
      { type: 'Parfum / Extrait', concentration: '20-30%+', longevity: '8-12+ hours', intensity: 'Very strong' },
    ],
    note_on_labelling: 'EDPs and EDTs of the same fragrance are NOT the same — often reformulated, not just more/less concentrated. Chanel No. 5 EDT and EDP smell different.',
  },
};

// ─── FRAGRANCE FAMILIES ───────────────────────────────────────────────────────

export const FRAGRANCE_FAMILIES = {
  floral: {
    description: 'The most popular fragrance family — rose, jasmine, peony, lily, ylang-ylang, iris.',
    sub_families: {
      single_floral_soliflore: 'One dominant flower — Dior Miss Dior (rose), Chanel No. 22 (tuberose)',
      floral_bouquet: 'Multiple flowers — Chanel Chance, Marc Jacobs Daisy',
      floral_aldehyde: 'Waxy, powdery florals — iconic in classic perfumery. Chanel No. 5.',
      floral_fruity: 'Light florals with fruit — very popular commercial segment. Gucci Bloom, YSL Mon Paris.',
    },
  },

  oriental_amber: {
    description: 'Warm, rich, sensual — amber, vanilla, musks, resins, spices. Often heavy and long-lasting.',
    sub_families: {
      soft_oriental: 'Lighter orientals — jasmine, iris, incense. Guerlain Shalimar Souffle.',
      floral_oriental: 'Florals in an oriental base — Lancome La Nuit Tresor.',
      spicy_oriental: 'Rich spice and wood — Tom Ford Tobacco Vanille.',
    },
    cultural_connection: 'Oriental/amber fragrances have deep roots in Middle Eastern, South Asian, and East African fragrance traditions — frankincense, myrrh, oud, amber, rose are all pillars of these traditions. The commercial perfume industry absorbed these ingredients.',
  },

  woody: {
    description: 'Cedarwood, sandalwood, vetiver, patchouli, oud.',
    sub_families: {
      dry_woods: 'Cedar, vetiver — clean and dry. Le Labo Santal 33.',
      mossy_woody: 'Classic "green" forest — oakmoss, ferns.',
      fresh_woody: 'Woods with citrus or water accords — contemporary unisex. Maison Margiela Replica.',
      oud: 'Oud (agarwood) — the most prized wood ingredient in perfumery. See dedicated oud section.',
    },
  },

  fresh: {
    description: 'Clean, light, aquatic, citrus, green notes.',
    sub_families: {
      citrus: 'Lemon, bergamot, grapefruit, yuzu. Jo Malone Lime Basil Mandarin.',
      aquatic: 'Marine/watery accords. Davidoff Cool Water.',
      green: 'Grass, leaf, herbs. Issey Miyake L\'Eau d\'Issey.',
      aromatic: 'Herbs (lavender, rosemary) in a fresh context. Old Spice territory, now unisex.',
    },
  },

  fougere: {
    description: 'French for "fern" — a constructed accord (ferns don\'t smell). Lavender, coumarin, oakmoss. Traditionally masculine. Modern interpretation is unisex.',
    examples: 'Terre d\'Hermes, Drakkar Noir, Paco Rabanne Pour Homme.',
  },

  chypre: {
    description: 'Complex, sophisticated — bergamot top, labdanum (amber) base, oakmoss heart. A classical category largely reformulated due to oakmoss restrictions (IFRA).',
    examples: 'Mitsouko (Guerlain), Miss Dior (original), Chloe.',
  },
};

// ─── OUD GUIDE ────────────────────────────────────────────────────────────────

export const OUD_GUIDE = {
  what_is_oud: {
    botanical: 'Oud (agarwood / aloeswood / eaglewood) is a resinous heartwood formed in Aquilaria trees when infected with a specific mould (Phialophora parasitica). The tree responds to infection by producing a dense, dark, fragrant resin. Not all Aquilaria trees produce oud — only infected trees.',
    
    origin: 'Primary production: Southeast Asia (Cambodia, Thailand, Vietnam, Borneo, Bangladesh, India), Middle East (Arabic oud from Yemen, Oman), and the Indian subcontinent (Hindi oud).',
    pronunciation: 'Oud (Arabic: عود) — rhymes with "mood."',
  },

  types_of_oud: {
    arabic_oud: {
      character: 'Rich, warm, animalic, smoky, leathery, incense-heavy. Traditional distillation from Arabian Peninsula producers.',
      for_who: 'Those who love intense, traditional, long-lasting Oriental fragrances.',
    },
    hindi_oud: {
      character: 'Barnyard, animalic, deep, medicinal — more extreme and intensely funky than Arabic oud. Beloved by connoisseurs.',
      for_who: 'Niche/connoisseur market — an acquired taste but revered by oud lovers.',
    },
    cambodian_oud: {
      character: 'Sweeter, more fruity-floral, less animalic. More approachable for Western palates.',
      for_who: 'Great introduction to oud — accessible, beautiful, complex.',
    },
    malay_oud: {
      character: 'Earthy, woody, slightly sweet.',
    },
  },

  oud_in_commercial_perfumery: {
    note: 'Most mainstream "oud" fragrances use synthetic oud accords (isoE Super, Javanol, synthetic agarwood) rather than natural oud oil, which is extraordinarily expensive. This is not necessarily a negative — synthetic oud allows creative expression at accessible prices.',
    notable: [
      { fragrance: 'Tom Ford Oud Wood', note: 'Smooth, accessible oud — great introduction. Synthetic but well-crafted.' },
      { fragrance: 'YSL M7', note: 'Classic oud fougere — the fragrance that introduced oud to mainstream Western market.' },
      { fragrance: 'Maison Margiela By the Fireplace', note: 'Soft, creamy oud with woods — approachable' },
      { fragrance: 'Arabian oud brands (Arabian Oud, Abdul Samad Al Qurashi)', note: 'Use actual oud oil — available in Middle Eastern markets and specialist shops globally.' },
    ],
  },

  oud_for_different_skin_tones: {
    note: 'Oud performs remarkably well on melanin-rich, darker skin. Warm-toned skin amplifies oud\'s animalic and resinous qualities beautifully. The richness of oud complements warm and deep skin tones in a particular way.',
    recommendation: 'Darker skin types often find oud develops beautifully — the warm base chemistry brings out the sweetness and complexity.',
  },
};

// ─── ETHNIC FRAGRANCE TRADITIONS ──────────────────────────────────────────────

export const ETHNIC_FRAGRANCE_TRADITIONS = {
  arab_middle_eastern: {
    cultural_importance: 'Fragrance holds enormous cultural significance in Arab culture — it is interwoven with hospitality, spirituality, and identity. Cleanliness and fragrance are religious imperatives (Islamic hygiene teachings). Hosts traditionally offer oud incense and bukhoor to guests.',

    bukhoor: {
      what: 'Incense made from agarwood chips soaked in fragrant oils (oud, rose, sandalwood, musk, amber). Burned in a mabkhara (incense burner).',
      practice: 'Bukhoor is passed around gatherings — guests hold the burner beneath their clothes to infuse fabric with smoke. A deeply hospitable act.',
    },

    attar: {
      what: 'Traditional concentrated perfume oils — oil-based rather than alcohol-based. Attar (also called ittar) are pure perfume oils from a mixture of botanical and/or animal origins.',
      significance: 'Attars are preferred in some Muslim communities as alcohol-based perfumes have a specific religious status in some interpretations of Islamic law.',
      types: ['Rose attar (Panrose attar — from Kannauj, India)', 'Oud attar', 'Musk attar (now synthetic in most cases)', 'Amber attar', 'Jasmine attar'],
    },

    classic_Arabic_notes: ['Oud', 'Rose', 'Saffron', 'Amber', 'Musk (ambergris, synthetic)', 'Sandalwood', 'Frankincense (loban)', 'Myrrh'],

    recommended_fragrances: [
      'Arabian Oud brand — extensive range of oil and spray, authentic Arabic oud',
      'Amouage (Oman) — luxury house using genuine Arabic materials. Beloved globally.',
      'Rasasi — Dubai-based, quality at accessible price',
      'Al Haramain — classic Arabic fragrances, widely distributed',
    ],
  },

  south_asian: {
    attar_tradition: {
      history: 'India\'s Kannauj region in Uttar Pradesh is the historic capital of attar production — producing pure botanical perfume oils using deg bhapka distillation (hydro-distillation into sandalwood oil) for centuries.',
      famous_attars: ['Rose attar (Rose of Kannauj)', 'Mitti attar (petrichor — the smell of earth after rain, distilled)', 'Kewra (pandanus flower)', 'Jasmine (bela, chameli)'],
      mitti: {
        what: 'Mitti attar — literally "earth perfume." Made by distilling dry clay baked in ovens over sandalwood oil. Captures the smell of first rain on dry earth (petrichor).',
        significance: 'One of the most extraordinary and culturally resonant fragrances in Indian perfumery. Beloved across South Asian communities.',
      },
    },

    incense: {
      agarbatti: 'Indian incense sticks — a cultural constant. Rose, jasmine, sandalwood, nag champa. The smell of temple, home, and celebration.',
      dhoop: 'Thick incense cones without bamboo core — used in temples and homes.',
      nag_champa: 'The iconic Indian incense — a combination of halmaddi (flower resin) and sandalwood. Recognisable globally.',
    },

    hair_fragrance: 'South Asian beauty tradition includes fragrant hair oils — jasmine, rose water, brahmi — applied to hair as both treatment and perfume. The tradition of adorning hair with fresh jasmine flowers (gajra) is a fragrance and beauty practice simultaneously.',
  },

  east_african: {
    incense: {
      frankincense: {
        what: 'Boswellia sacra resin — burned as incense or worn as oil. Ethiopia, Somalia, and Eritrea are major frankincense producers.',
        significance: 'Frankincense has spiritual, medicinal, and beauty significance across East African, North African, Middle Eastern, and wider cultures.',
        beauty: 'Frankincense oil is used topically for its purported anti-inflammatory and skin-healing properties.',
      },
      myrrh: {
        what: 'Commiphora myrrh resin — also produced in East Africa and Arabian Peninsula.',
        use: 'Burned as incense, used in traditional medicine, and applied in oil form for skin.',
      },
      udi: {
        what: 'Udi (Ethiopian incense/oud) — similar to Arabic bukhoor, burned in small charcoal burners. Deeply embedded in Ethiopian and Eritrean culture.',
      },
    },

    traditional_perfume: {
      dirassi: 'Traditional Ethiopian perfume made from a combination of incense resins, dried flowers, and aromatic woods.',
      dhow_trade: 'The ancient dhow trade routes between East Africa and the Arabian Peninsula created deep fragrance exchange — Arabic oud, rose, amber have been used across East African port cities for centuries.',
    },
  },

  west_african: {
    incense: {
      thiouraye: 'West African incense — used in Senegal and surrounding countries. Thiouraye is a mixture of resins, woods, and animal musks burned on charcoal.',
      significance: 'Thiouraye is a social and spiritual practice — used to perfume the home and body, shared between women in social gatherings.',
    },
    osun: 'In Yoruba culture, fragrance is part of spiritual practice — specific plants, flowers, and incense are associated with different Orishas (deities in Yoruba religion).',
  },

  east_asian: {
    kodo: {
      what: 'Kōdō (香道) — the Japanese art of appreciating incense. A meditative art alongside tea ceremony (Chadō) and flower arranging (Kadō).',
      practice: 'Practitioners learn to distinguish and appreciate oud (called jinko in Japanese) and other rare incense materials through structured ceremonies.',
      jinko: 'Japanese term for agarwood (oud). Japan has had an oud appreciation tradition for over 1000 years — Japanese connoisseurs are among the most knowledgeable oud evaluators in the world.',
    },
    anise_and_floral: 'Traditional Chinese fragrance leans toward jasmine, osmanthus, lotus, and anise notes. Chinese incense often incorporates these.',
    k_beauty_perfume: 'Korean fragrance preferences lean toward fresh, clean, and airy scents — aquatics, white florals, subtle musks.',
  },
};

// ─── FRAGRANCE LAYERING ───────────────────────────────────────────────────────

export const FRAGRANCE_LAYERING_GUIDE = {
  what: 'Layering fragrances — applying multiple scents simultaneously to create a unique, personalised fragrance that no single product delivers.',

  techniques: {
    base_and_top: 'Apply an oil or heavy base fragrance first, then spray a lighter fragrance on top. The oil extends wear and adds depth.',
    complementary: 'Layer fragrances that share a key ingredient — two oud fragrances, or a rose eau de toilette over a rose body lotion.',
    contrast: 'Contrast a dark base (oud, amber) with a bright top (citrus, white musk) for complexity.',
    skincare_layering: 'Scented body lotion/oil → leave to sink in → apply fragrance on top. The moisturised skin holds fragrance longer.',
  },

  recommended_combinations: [
    { a: 'Oud or amber oil', b: 'Fresh citrus spray', result: 'Warm-rich with bright top — a dynamic combination popular in Middle Eastern fragrance style' },
    { a: 'Sandalwood lotion', b: 'Rose EDT', result: 'Intensified rose with creamy depth' },
    { a: 'Vanilla/amber body spray', b: 'Jasmine EDP', result: 'Rich oriental-floral' },
    { a: 'Scentless body oil', b: 'Any EDP', result: 'Extended wear without fragrance interference' },
  ],
};

// ─── APPLICATION GUIDE ────────────────────────────────────────────────────────

export const FRAGRANCE_APPLICATION = {
  pulse_points: {
    what: 'Areas where blood vessels are close to the skin surface — heat from these areas diffuses fragrance continuously.',
    classic: ['Inner wrists', 'Behind ears', 'Base of throat/neck', 'Inner elbows', 'Behind knees'],
    less_known: ['Chest/décolletage', 'Ankles and calves', 'Navel', 'Hair (sparingly — alcohol can dry hair)'],
  },

  technique: {
    spray: 'Hold 10-15cm from skin. Spray in a cloud and walk through, or spray directly on pulse points.',
    dont_rub: 'DO NOT rub wrists together after applying — this crushes fragrance molecules and breaks down the top notes more rapidly, affecting the development.',
    hair: 'A small spritz in hair diffuses beautifully. Hair holds scent exceptionally well. Be cautious with high-alcohol content directly on coloured or fragile hair.',
  },

  for_different_climates: {
    hot_humid: 'Fragrance evaporates faster in heat. Apply more sparingly — what smells subtle in cool temperatures may be overwhelming in summer. Light concentrations (EDT, cologne) are appropriate.',
    cold: 'Cool temperatures slow volatility — fragrance projects less far. Apply more generously to pulse points.',
    dry_skin_note: 'Moisturise skin before applying fragrance in dry climates — fragrance lasts significantly longer on hydrated skin.',
  },
};

// ─── AFFORDABLE ALTERNATIVES ──────────────────────────────────────────────────

export const FRAGRANCE_ALTERNATIVES = {
  philosophy: 'Many mainstream fragrances use the same base ingredients as niche or luxury counterparts. "Clone" fragrances and affordable alternatives allow enjoying similar fragrance profiles at a fraction of designer cost.',

  comparison_shopping: [
    { designer: 'Creed Aventus', alternative: 'Armaf Club de Nuit Intense Man (a widely known inspired-by scent)' },
    { designer: 'Oud from luxury houses', alternative: 'Al Haramain, Rasasi, Swiss Arabian, Lattafa' },
  ],

  budget_brands_with_quality: [
    { brand: 'Lattafa', region: 'UAE', note: 'Middle Eastern house with excellent affordable orientals and oud' },
    { brand: 'Rasasi', region: 'Dubai', note: 'Quality Arabic-style fragrances at accessible prices' },
    { brand: 'Armaf', region: 'India/UAE', note: 'Club de Nuit series offers impressive quality' },
    { brand: 'Zara', region: 'Spain', note: 'Zara\'s fragrance line has some exceptional offerings — developed in collaboration with major fragrance houses' },
    { brand: 'Lidl/Aldi brands', region: 'Europe', note: 'Surprise quality — often copied from designer fragrances at a fraction of cost' },
  ],
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getFragranceFamilies() {
  return FRAGRANCE_FAMILIES;
}

export function getOudGuide() {
  return OUD_GUIDE;
}

export function getEthnicFragranceTradition(communityId) {
  return ETHNIC_FRAGRANCE_TRADITIONS[communityId] || null;
}

export function getFragranceScience() {
  return FRAGRANCE_SCIENCE;
}

export function getLayeringGuide() {
  return FRAGRANCE_LAYERING_GUIDE;
}

export function getApplicationGuide() {
  return FRAGRANCE_APPLICATION;
}

export function getAffordableAlternatives() {
  return FRAGRANCE_ALTERNATIVES;
}

