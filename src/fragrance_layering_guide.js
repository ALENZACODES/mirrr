/**
 * MIRRR Fragrance Layering Guide
 * The art of building signature scents from multicultural fragrance traditions
 * Oud, rose, jasmine, musk, sandalwood, and beyond
 */

// ─── FRAGRANCE FAMILIES ──────────────────────────────────────────────────────

export const FRAGRANCE_FAMILIES = {
  oriental: {
    name: 'Oriental / Amber',
    characteristics: 'Warm, rich, sensual, long-lasting. Dominant in Middle Eastern, South Asian, and East African traditions.',
    keyNotes: ['Oud', 'Amber', 'Musk', 'Sandalwood', 'Vanilla', 'Incense', 'Benzoin'],
    bestFor: 'Evening wear, cooler weather, intimate occasions, making a statement',
    layeringTip: 'Start with a dry, woody base oil (sandalwood/oud), then build amber or musky layers on top',
    
  },
  floral: {
    name: 'Floral',
    characteristics: 'Romantic, feminine (though increasingly gender-neutral), fresh or heady depending on the flower.',
    keyNotes: ['Rose', 'Jasmine', 'Tuberose', 'Ylang-ylang', 'Neroli', 'Magnolia', 'Gardenia'],
    bestFor: 'Day wear, spring/summer, weddings, gift-giving',
    layeringTip: 'Rose and musk together = classic Middle Eastern attar. Jasmine + sandalwood = South Asian tradition.',
    longevity: '4–8 hours; more ephemeral than oriental',
    culturalNote: 'Rose is sacred across many cultures — the Prophet Muhammad wore rose attar; it is in Christian holy water; it bridges perfumery traditions from Morocco to India to Iran',
  },
  woody: {
    name: 'Woody',
    characteristics: 'Earthy, grounding, long-lasting. The backbone of many Middle Eastern and South Asian fragrances.',
    keyNotes: ['Oud', 'Sandalwood', 'Cedarwood', 'Vetiver', 'Patchouli', 'Guaiac wood'],
    bestFor: 'Year-round, layering foundation, evening',
    longevity: '10+ hours — the most long-lasting family',
  },
  green: {
    name: 'Green / Herbal',
    characteristics: 'Fresh, crisp, nature-inspired. Present in African herbal beauty traditions and light South Asian preparations.',
    keyNotes: ['Eucalyptus', 'Mint', 'Green tea', 'Vetiver', 'Fern', 'Bamboo', 'Basil'],
    bestFor: 'Hot weather, sport, daytime office, very fresh effect',
    longevity: '2–4 hours; lightest family',
  },
  citrus: {
    name: 'Citrus',
    characteristics: 'Bright, uplifting, clean. The lightest and most ephemeral family — often a top note.',
    keyNotes: ['Bergamot', 'Lemon', 'Orange', 'Grapefruit', 'Yuzu (Japanese citrus)', 'Neroli'],
    bestFor: 'Summer, daytime, energising, sport',
    longevity: '1–3 hours (citrus evaporates fast — usually just a top note)',
    layeringTip: 'Layer over musk or white woods to extend the life of citrus. A citrus body spray + sandalwood oil = longer-lasting citrus effect.',
  },
  gourmand: {
    name: 'Gourmand',
    characteristics: 'Edible-smelling — vanilla, caramel, chocolate, coffee, tonka. A more modern family.',
    keyNotes: ['Vanilla', 'Tonka bean', 'Caramel', 'Coffee', 'Chocolate', 'Sugar', 'Praline'],
    bestFor: 'Evening, autumn/winter, date night, comforting',
    longevity: '6–12 hours; very skin-close, intimate projection',
  },
};

// ─── ETHNIC FRAGRANCE TRADITIONS ─────────────────────────────────────────────

export const ETHNIC_FRAGRANCE_TRADITIONS = {
  arab: {
    community: 'Arab / Middle Eastern',
    overview: 'An ancient fragrance culture: Arabic attar and bakhoor traditions are far older than modern Western perfumery.',
    signature: 'Heavy, long-lasting, sensual. Skin should smell — not a ghost. The smell should fill a room and linger on clothes for days.',
    traditions: {
      bakhoor: {
        name: 'Bakhoor (بخور)',
        what: 'Incense chips made from oud wood soaked in essential oils and other aromatics — burned on charcoal in a mabkhara (incense burner)',
        use: 'Burned in homes and on clothes (hold garments over the burner) to scent fabrics permanently',
        occasions: 'Hospitality (welcoming guests), weddings, Eid, Friday (Jumu\'ah prayer)',
        brands: ['Arabian Oud Bakhoor', 'Bait Al Oudh', 'Swiss Arabian Bakhoor'],
        modern: 'Electric bakhoor burners now allow apartment-friendly burning without open flame',
      },
      attar: {
        name: 'Attar / Ittar',
        what: 'Traditional Arabic/South Asian term for natural essential oil perfume — often oud, rose, jasmine, or musk-based, alcohol-free',
        significance: 'Alcohol-free attar is permissible (halal) for observant Muslims; also non-drying for skin',
        how: 'A few drops on pulse points — wrists, neck, inner elbow, behind knees, even on clothes',
        legendary: [ 'Rasasi Dhan Al Oudh Mubakkhar'],
      },
      oud: {
        name: 'Oud (العود)',
        what: 'Agarwood — resinous heartwood from Aquilaria trees infected with a specific mold. The resin creates the deep, complex scent.',
        
        types: {
          hindi: { origin: 'India', character: 'Dung-y, animalic, earthy, complex' },
          cambodian: { origin: 'Cambodia (Kambodi)', character: 'Smoky, sweet, slightly medicinal' },
          thai: { origin: 'Thailand', character: 'Lighter, sweeter, fruity-floral' },
          arabic: { origin: 'Gulf (often from India/SE Asia, distilled in Arab Gulf)', character: 'Rose-like, sweet, accessible' },
        },
        
      },
    },
    layeringSystem: {
      step1: { name: 'Base oil', apply: 'Apply unscented or sandalwood body oil to pulse points while skin is still warm from shower', why: 'Fragrance clings to oil; extends longevity significantly' },
      step2: { name: 'Bakhoor on fabric', apply: 'Pass abaya/thoub/clothes over bakhoor smoke 2-3 times', why: 'Fabric holds scent for days; traditional hospitality signal' },
      step3: { name: 'Attar on pulse points', apply: '2-3 drops on inner wrists, behind ears, on neck', why: 'Skin warmth activates attar continuously' },
      step4: { name: 'Perfume mist (optional)', apply: 'Spray in hair or on the hem of garment', why: 'Projection and sillage (scent trail)' },
    },
  },
  south_asian: {
    community: 'South Asian (India, Pakistan, Bangladesh)',
    overview: 'Rich in floral (jasmine, rose, marigold) and earthy (sandalwood, vetiver) traditions. Influenced by Mughal court perfumery and Ayurvedic medicine.',
    signature: 'Floral-oriental. Jasmine and rose are dominant. Heavy use of sandalwood and incense. Jasmine garlands (gajra) worn in hair are the most iconic fragrance tradition.',
    traditions: {
      gajra: {
        name: 'Gajra (Jasmine Hair Garlands)',
        what: 'Strings of fresh jasmine flowers worn in the hair — particularly by South Indian women and on wedding days',
        symbolism: 'Beauty, femininity, auspiciousness, marriage. Worn by brides across South Asia.',
        modern: 'Jasmine absolute in hair oil or hair perfume recreates this tradition year-round',
        
      },
      ittar: {
        name: 'Indian Ittar',
        kewra: 'Pandanus flower — distinctly South Asian; used in biryani AND in traditional ittar. Watery, slightly mentholated floral.',
        vetiver: 'Called "khus" in India — vetiver root soaked in water and used as cooling sprays in summer; also as a calming essential oil',
      },
    },
    layeringSystem: {
      step1: 'Sandalwood oil on pulse points (Mysore sandalwood if authentic)',
      step2: 'Rose or jasmine attar on inner wrists',
      step3: 'Incense in environment (agarbatti/dhoop)',
      step4: 'Kewra or jasmine in hair oil',
    },
  },
  west_african: {
    community: 'West African (Ghana, Nigeria, Senegal, Côte d\'Ivoire)',
    overview: 'Less documented in global beauty media but rich in local traditions — including shea butter-based body preparation, specific florals, and incense use.',
    signature: 'Skin-based fragrance — the scent of well-moisturised, healthy skin (shea, coconut, black soap) enhanced with imported oud and musk in modern practice. Community increasingly blends global (Arabic oud) with local (shea, frangipani) traditions.',
    traditions: {
      shea_scented: {
        name: 'Scented Shea Butter',
        what: 'Shea butter infused or blended with fragrant ingredients — lavender, rose, frankincense',
        tradition: 'Body butter applied after bath; fragrance comes from the shea base and added botanicals',
        
      },
      frankincense: {
        name: 'Frankincense / Olibanum',
        origin: 'Somalia, Ethiopia, Oman — but traded across sub-Saharan Africa for centuries',
        use: 'Burned as incense in religious and ceremonial contexts across East and West Africa',
        skin: 'Frankincense essential oil — anti-aging, wound healing, anti-inflammatory. A hero ingredient in East African traditional medicine.',
      },
    },
    layeringSystem: {
      step1: 'Unscented or lightly scented shea butter all over body',
      step2: 'Oud oil or woody oriental perfume on pulse points',
      step3: 'Musk body spray for light lingering trail',
    },
  },
  east_asian: {
    community: 'East Asian (Japan, Korea, China)',
    overview: 'Subtlety is the signature. The goal is never "strong" — always elegant, clean, skin-like. Japanese "ma" (negative space) philosophy applies to fragrance — the absence of scent can be as deliberate as presence.',
    signature: 'Light, clean, aquatic, green tea, white musk. The Japanese concept of "hinoki" (Japanese cypress) and "wabi-sabi" applied to fragrance.',
    traditions: {
      kodo: {
        name: 'Kodo (香道) — Japanese Incense Ceremony',
        what: 'Literally "the way of incense" — as disciplined as the tea ceremony (chado) or flower arranging (ikebana)',
        history: 'Dating from the Muromachi period (1336–1573). Originally practiced by court aristocracy and samurai.',
        practice: 'Participants heat premium agarwood on mica above a burning coal in a koro (incense burner). The fragrance is "listened to" (the Japanese say "kiki-koh" — listening to incense) rather than smelled.',
        modernEquivalent: 'Japanese incense sticks (Nippon Kodo, Shoyeido) — very different from Indian/Chinese incense; lighter, often single-note, smoke-minimal',
        
      },
      white_musk: {
        name: 'Clean / White Musk',
        what: 'The dominant modern East Asian fragrance preference — a skin-close, clean, barely-there musk that smells like clean hair or fresh laundry',
        
      },
    },
    layeringSystem: {
      step1: 'Unscented lotion as fragrance base',
      step2: 'Light white musk perfume — ONE spray on neck',
      step3: 'Optional: green tea or bamboo body mist on arms',
    },
  },
};

// ─── LAYERING TECHNIQUES ─────────────────────────────────────────────────────

export const LAYERING_TECHNIQUES = {
  principle: 'Fragrance is architecture. Like a building needs a foundation, walls, and a roof — a layered scent needs a base, middle, and top. The difference is that in fragrance, these layers bloom in reverse order: top notes hit first (and vanish); base notes emerge last (and last longest).',
  pyramid: {
    top: {
      name: 'Top Notes',
      what: 'The first impression — what you smell in the bottle and in the first 30 minutes',
      duration: '30 minutes to 2 hours',
      examples: ['Citrus', 'Light herbs', 'Bergamot', 'Grapefruit', 'Mint', 'Light aldehydes'],
      tip: 'Don\'t judge a fragrance on top notes alone. Wait for the dry-down.',
    },
    middle: {
      name: 'Heart / Middle Notes',
      what: 'The body of the fragrance — what it truly smells like for most of its life',
      duration: '2–6 hours',
      examples: ['Rose', 'Jasmine', 'Geranium', 'Ylang-ylang', 'Spices (cinnamon, cardamom)', 'Black pepper'],
      tip: 'The heart determines the "character" of the scent.',
    },
    base: {
      name: 'Base Notes',
      what: 'The foundation — emerges after 30–60 minutes, lingers longest',
      duration: '6–24+ hours',
      examples: ['Oud', 'Sandalwood', 'Vetiver', 'Musk', 'Amber', 'Vanilla', 'Benzoin', 'Patchouli'],
      tip: 'The base is what remains on skin next morning. This is where to invest.',
    },
  },
  methods: {
    skin_prep: {
      name: 'Skin Preparation',
      steps: [
        'Apply unscented body lotion or a carrier oil (jojoba, almond) to pulse points before fragrance',
        'Fragrance bonds to oil and stays longer on moisturised skin',
        'Fragrance fades faster on dry skin and lasts longer on moisturised skin',
        'Apply to warm pulse points: inner wrists, inner elbow, neck, behind knees, décolletage',
      ],
      warning: 'Never apply fragrance immediately after exfoliating — barrier is disrupted; fragrance can irritate',
    },
    layering_order: {
      name: 'Layering Order',
      order: [
        { step: 1, product: 'Scented shower gel / black soap', layer: 'Base impression on clean skin' },
        { step: 2, product: 'Body oil or lotion (scented or unscented)', layer: 'Anchoring layer for fragrance' },
        { step: 3, product: 'Pure perfume oil / attar (on pulse points)', layer: 'Base and heart of personal scent' },
        { step: 4, product: 'Eau de Parfum spray (on neck and wrists)', layer: 'Top and heart notes, projection' },
        { step: 5, product: 'Hair mist or perfume in hair', layer: 'Sillage — the trail you leave' },
      ],
      note: 'You don\'t need all 5 steps. The minimum powerful layer is Steps 2 + 4.',
    },
    mixing_fragrances: {
      name: 'Mixing Two Fragrances',
      rules: [
        'Apply heavier, darker scent first (oud, musk, amber) on body and pulse points',
        'Layer lighter, brighter scent on top (floral, citrus) on hair and neck',
        'The heavier scent becomes the warm base; lighter becomes the opening signature',
        'Example: Oud oil on wrists + rose EDP on neck = the classic Arab-influenced layered scent',
        'Example: Sandalwood body oil + jasmine EDP = South Asian traditional layering',
        'Example: White musk lotion + green tea body spray = East Asian signature',
      ],
      dontMix: [
        'Two powerful orientals at once (overwhelming)',
        'Floral + gourmand on skin (can smell like a bakery or too sweet)',
        'Fresh/aquatic + heavy oud (they fight each other)',
      ],
    },
  },
};

// ─── CONCENTRATION GUIDE ─────────────────────────────────────────────────────

export const CONCENTRATION_GUIDE = {
  parfum: {
    name: 'Parfum / Extrait de Parfum',
    concentration: '20–40%',
    longevity: '8–24 hours',
    character: 'Richest, most complex, most expensive. Usually oil or very high-alcohol.',
    bestFor: 'Special occasions, cooler weather, evening',
    tip: 'Apply less — 1–2 dabs or sprays. Parfum evolves dramatically through the day.',
  },
  edp: {
    name: 'Eau de Parfum (EDP)',
    concentration: '15–20%',
    longevity: '5–8 hours',
    character: 'The most popular concentration. Rich without being overwhelming.',
    bestFor: 'All-day wear, most situations',
  },
  edt: {
    name: 'Eau de Toilette (EDT)',
    concentration: '5–15%',
    longevity: '3–5 hours',
    character: 'Lighter, more transparent. An easy everyday format.',
    bestFor: 'Daytime, warm weather, office',
    tip: 'Layer EDT over body lotion to extend longevity',
  },
  edc: {
    name: 'Eau de Cologne (EDC)',
    concentration: '2–5%',
    longevity: '1–3 hours',
    character: 'Very light, traditionally citrus-heavy formula. Refreshing, not lingering.',
    bestFor: 'Summer, sport, refresh throughout day',
  },
  body_spray: {
    name: 'Body Spray / Mist',
    concentration: '1–3%',
    longevity: '30–90 minutes',
    character: 'The lightest format. Mass coverage, ephemeral effect.',
    bestFor: 'Layering base, very casual, teens / fragrance introduction',
  },
  attar_oil: {
    name: 'Attar / Perfume Oil',
    concentration: '100% (no alcohol)',
    longevity: '6–24 hours',
    character: 'No alcohol means no drying effect. Stays close to skin. Halal/alcohol-free.',
    bestFor: 'Observant Muslims, sensitive skin, layering foundation, all-day wear',
    application: 'Dab (never spray) 2–4 drops on pulse points. Less is more.',
  },
};

// ─── FRAGRANCE GIFTING BY COMMUNITY ──────────────────────────────────────────

export const FRAGRANCE_GIFTING = {
  arab: {
    occasions: ['Eid Al Fitr', 'Eid Al Adha', 'Wedding (nikah)', 'New home', 'Ramadan', 'Religious milestones'],
    gifts: [
      { item: 'Bakhoor set (chips + burner)',  note: 'Classic hospitality gift' },
      { item: 'Oud oil in ornate bottle',  note: 'Prestigious; shows wealth and taste' },
      { item: 'Attar gift set',  note: 'Multiple scents in decorative presentation' },
    ],
    protocol: 'Present with both hands; receiving with one hand is polite too. Gift wrap in gold, deep burgundy, or rich purple.',
  },
  south_asian: {
    occasions: ['Wedding (shaadi / vivah)', 'Diwali', 'Eid', 'New Year', 'Housewarming', 'Religious ceremony'],
    gifts: [
      { item: 'Attar gift set' },
      { item: 'Sandalwood oil or incense set' },
      { item: 'Forest Essentials gift set',  note: 'Aspirational Indian luxury brand' },
    ],
  },
  east_asian: {
    occasions: ['Lunar New Year', 'Mid-Autumn Festival', 'Wedding', 'Career milestone'],
    gifts: [
      { item: 'Japanese incense set',  note: 'Nippon Kodo or Shoyeido' },
      { item: 'Designer fragrance',  note: 'Prestigious Western or Japanese brand in beautiful packaging' },
    ],
    protocol: 'Beautiful presentation is as important as the gift itself. Wrap thoughtfully. Avoid gifting one item — pairs or sets preferred.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getFragranceTraditionsForCommunity(communityId) {
  const map = {
    'arab': ETHNIC_FRAGRANCE_TRADITIONS.arab,
    'south-asian': ETHNIC_FRAGRANCE_TRADITIONS.south_asian,
    'west-african': ETHNIC_FRAGRANCE_TRADITIONS.west_african,
    'east-african': ETHNIC_FRAGRANCE_TRADITIONS.west_african,
    'east-asian': ETHNIC_FRAGRANCE_TRADITIONS.east_asian,
    'black-american': { ...ETHNIC_FRAGRANCE_TRADITIONS.west_african, note: 'Blends African heritage with American beauty industry influences' },
  };
  return map[communityId] || null;
}

export function getLayeringGuide() {
  return LAYERING_TECHNIQUES;
}

export function getFragranceFamilies() {
  return Object.values(FRAGRANCE_FAMILIES);
}

export function getConcentrationForOccasion(occasion) {
  const occasionMap = {
    'wedding': 'parfum',
    'office': 'edt',
    'date': 'edp',
    'summer': 'edc',
    'evening': 'edp',
    'gym': 'body_spray',
    'religious': 'attar_oil',
    'halal': 'attar_oil',
  };
  const key = occasionMap[occasion.toLowerCase()];
  return key ? CONCENTRATION_GUIDE[key] : CONCENTRATION_GUIDE.edp;
}

export function getGiftingGuideForCommunity(communityId) {
  const map = {
    'arab': FRAGRANCE_GIFTING.arab,
    'south-asian': FRAGRANCE_GIFTING.south_asian,
    'east-asian': FRAGRANCE_GIFTING.east_asian,
  };
  return map[communityId] || null;
}

