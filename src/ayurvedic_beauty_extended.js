/**
 * MIRRR Ayurvedic Beauty Extended Guide
 * Dosha-based beauty system, Ayurvedic ingredients deep dive,
 * seasonal beauty (Ritucharya), Panchakarma beauty treatments,
 * and Ayurveda across ethnic communities
 */

// ─── AYURVEDA OVERVIEW ────────────────────────────────────────────────────────

export const AYURVEDA_OVERVIEW = {
  system: 'Ayurveda (Sanskrit: "life knowledge") is a 5,000-year-old Indian system of medicine originating in the Vedic civilisation. It is one of the world\'s oldest holistic healing systems, still widely practiced across South Asia and increasingly globally.',
  beauty_philosophy: 'In Ayurveda, outer beauty (Roopam) is a direct expression of inner health. Skin, hair, and nail condition are diagnostic tools — they reflect the state of the digestive fire (Agni), the balance of the three doshas (Vata, Pitta, Kapha), and the vitality of the Ojas (essential life essence). Ayurvedic beauty is therefore always addressed from within (Sapta Dhatu — seven body tissues) as well as from without (Bahya — external practices).',
  core_concepts: {
    doshas: 'Three bio-energies that govern all physical and mental processes. Every person has a unique Prakriti (constitution) that is their natural balance of the three doshas. Illness and beauty concerns arise when the doshas fall out of balance (Vikriti).',
    agni: 'Digestive fire. Strong Agni = efficient digestion, clear skin, lustrous hair. Weak Agni = toxin (Ama) accumulation, dull skin, hair loss, dark circles.',
    ojas: 'The refined essence of all seven body tissues. Abundant Ojas = glowing skin, lustrous hair, strong nails, bright eyes, healthy glow. Ojas is depleted by stress, late nights, poor diet, excess caffeine, and emotional turbulence.',
    panchamahabhutas: 'Five elements (Space, Air, Fire, Water, Earth) that compose all matter. Doshas are combinations of these elements.',
  },
};

// ─── THE THREE DOSHAS ─────────────────────────────────────────────────────────

export const DOSHAS = {
  vata: {
    name: 'Vata',
    elements: 'Space + Air',
    qualities: 'Dry, light, cold, rough, subtle, mobile, clear',
    skin_in_balance: 'Thin, delicate, naturally dry, prone to fine lines and dehydration. When balanced: smooth, fine-textured, glowing.',
    skin_out_of_balance: 'Very dry, rough, flaky, prone to premature wrinkles, cracking lips, dry scalp, dark under-eye circles, dull complexion.',
    hair_in_balance: 'Naturally fine, delicate.',
    hair_out_of_balance: 'Dry, frizzy, prone to split ends, dandruff (dry type), hair loss from stress.',
    nail_indicator: 'Dry, brittle, ridged nails indicate Vata imbalance.',
    beauty_approach: {
      skincare: 'Heavy, nourishing, oil-based skincare. Daily self-massage (Abhyanga) with warm sesame oil. Avoid alcohol-based toners and harsh cleansers.',
      recommended_oils: ['Sesame oil (Tila taila) — warming and deeply nourishing; primary Vata-pacifying oil', 'Almond oil — light but nourishing', 'Avocado oil — very rich for severely dry Vata skin'],
      ingredients: ['Ashwagandha (adaptogenic; stress-reduction reduces Vata imbalance)', 'Shatavari (phytoestrogen; supports moisture in hormonally dry skin)', 'Rose water (cooling but hydrating)', 'Sandalwood (soothing)', 'Honey (humectant)'],
      avoid: ['Alcohol-based products', 'Harsh exfoliation', 'Dry skin brushing (too stimulating for Vata)', 'Very light, watery moisturisers'],
      diet_for_skin: 'Warm, oily, cooked foods. Ghee is an Ojas-building Vata-pacifying food. Warm milk with ashwagandha. Avoid raw, cold foods and excessive coffee.',
    },
    pacifying_season: 'Vata is aggravated in autumn and early winter (cold, dry, windy). Extra nourishment needed in this season.',
  },
  pitta: {
    name: 'Pitta',
    elements: 'Fire + Water',
    qualities: 'Hot, sharp, oily, light, mobile, liquid',
    skin_in_balance: 'Warm, oily in T-zone, soft, naturally flushed, fair or moderate skin tone. When balanced: radiant, clear, healthy complexion.',
    skin_out_of_balance: 'Inflammatory conditions — acne, rosacea, eczema, hives, redness, sensitivity, sunburn sensitivity, rashes, melasma (pitta aggravated by sun exposure).',
    hair_in_balance: 'Moderate thickness, naturally oily scalp.',
    hair_out_of_balance: 'Premature greying and hair loss (Pitta drives both), oily scalp with possible inflammatory dandruff, scalp acne.',
    nail_indicator: 'Pink, soft, flexible nails that peel easily indicate Pitta imbalance.',
    beauty_approach: {
      skincare: 'Cooling, anti-inflammatory, non-comedogenic skincare. Avoid heat-generating treatments (steam, hot water on face). Gentle exfoliation only.',
      recommended_oils: ['Coconut oil (Narikela taila) — cooling; primary Pitta-pacifying oil', 'Sandalwood oil (diluted) — cooling and anti-inflammatory', 'Rose hip oil — vitamin C and anti-inflammatory linoleic acid'],
      ingredients: ['Aloe vera (cooling, anti-inflammatory)', 'Turmeric (curcumin anti-inflammatory — caution for very fair Pitta skin, can stain)', 'Neem (antimicrobial; anti-inflammatory for Pitta acne)', 'Brahmi (Bacopa monnieri — anti-inflammatory, adaptogenic)', 'Rose water (cooling, toning)', 'Shatavari'],
      avoid: ['Spicy or acidic skincare ingredients', 'Alcohol', 'Hot steam or hot showers on face', 'Prolonged sun exposure without SPF', 'Very oily heavy creams on already-oily Pitta skin'],
      diet_for_skin: 'Cooling foods — cucumber, coconut, coriander, mint, sweet fruits. Avoid chillies, alcohol, and very acidic foods.',
    },
    pacifying_season: 'Pitta is aggravated in summer (hot, intense). Cooling practices and extra sun protection most important in summer.',
  },
  kapha: {
    name: 'Kapha',
    elements: 'Earth + Water',
    qualities: 'Heavy, slow, cool, oily, smooth, dense, soft, stable',
    skin_in_balance: 'Thick, oily, large pores, prone to congestion. When balanced: extremely soft, hydrated, lustrous, ages slowly.',
    skin_out_of_balance: 'Excessive oiliness, large congested pores, blackheads and comedones, milia, water retention/puffiness, dull complexion, cystic acne in some.',
    hair_in_balance: 'Thick, lustrous, naturally wavy or curly.',
    hair_out_of_balance: 'Oily scalp, hair that feels heavy and greasy, possibly scalp congestion.',
    nail_indicator: 'Thick, strong, white, or too-pale nails indicate Kapha imbalance.',
    beauty_approach: {
      skincare: 'Stimulating, cleansing, decongesting. Kapha needs more movement and light than any other type. Clay masks and dry brushing are appropriate.',
      recommended_oils: ['Mustard oil (Sarshapa taila) — warming and stimulating; classic Kapha-pacifying', 'Sunflower oil — light', 'Jojoba — lightweight, mimics sebum, non-comedogenic'],
      ingredients: ['Multani mitti (Fuller\'s Earth/Smectite clay) — deep cleansing, oil absorbing', 'Kaolin clay', 'Calamine', 'Camphor (anti-congestion; diluted)', 'Neem', 'Tulsi (Holy Basil — antimicrobial)'],
      avoid: ['Heavy oils on face (coconut, castor, shea on Kapha-oily skin can worsen congestion)', 'Very emollient creams', 'Skipping cleansing'],
      diet_for_skin: 'Light, spiced, warm foods. Avoid dairy, sugar, and heavy fatty foods which aggravate Kapha.',
    },
    pacifying_season: 'Kapha is aggravated in spring and late winter (heavy, damp). Extra cleansing and stimulation important in this period.',
  },
};

// ─── RITUCHARYA — SEASONAL AYURVEDIC BEAUTY ──────────────────────────────────

export const RITUCHARYA_BEAUTY = {
  overview: 'Ritucharya (seasonal routine) is the Ayurvedic practice of adjusting diet, lifestyle, and skincare/haircare practices according to the seasons to maintain dosha balance and prevent illness.',
  seasons: {
    vasanta_spring: {
      season: 'Vasanta (Spring)',
      dominant_dosha: 'Kapha melts/releases; Pitta begins rising',
      beauty_focus: 'Cleanse and detox after winter. Lighter products. Stimulating treatments. Clear congestion.',
      recommended: ['Clay masks to draw out congested pores', 'Dry brushing body', 'Neem-based products', 'Lighter moisturisers', 'Begin SPF season earnestly'],
    },
    grishma_summer: {
      season: 'Grishma (Summer)',
      dominant_dosha: 'Pitta predominates',
      beauty_focus: 'Cooling, protecting, reducing inflammation. Heavy sun protection.',
      recommended: ['Coconut oil for hair and body', 'Rose water toner', 'Aloe vera for post-sun cooling', 'Sandalwood paste (traditional) for cooling', 'Reduce hot oils like sesame'],
    },
    varsha_monsoon: {
      season: 'Varsha (Monsoon/Rainy Season)',
      dominant_dosha: 'Vata rises; all doshas are variable',
      beauty_focus: 'Balance all doshas. Protect from humidity-related skin issues.',
      recommended: ['Neem and turmeric for anti-fungal protection (humidity creates fungal growth)', 'Sesame oil massage (balances variable Vata)', 'Avoid heavy oils that become sticky in humidity'],
    },
    sharad_autumn: {
      season: 'Sharad (Post-monsoon/Early Autumn)',
      dominant_dosha: 'Pitta still elevated; begins falling',
      beauty_focus: 'Address Pitta-driven hyperpigmentation from summer. Begin transition to more nourishing products.',
      recommended: ['Turmeric (anti-PIH)', 'Continue rose water for Pitta cooling', 'Introduce richer moisturisers as the air begins to dry'],
    },
    hemanta_winter: {
      season: 'Hemanta (Winter/Early Winter)',
      dominant_dosha: 'Vata rises; Agni (digestive fire) naturally strong',
      beauty_focus: 'Maximum nourishment. Deep oil treatments. Combat dryness. Abhyanga (self-massage) most important in this season.',
      recommended: ['Daily Abhyanga with warm sesame oil', 'Thick body butters', 'Hair oiling weekly minimum', 'Rich face oils', 'Ghee internally for Ojas'],
    },
    shishira_late_winter: {
      season: 'Shishira (Late Winter/Early Spring)',
      dominant_dosha: 'Vata highest; Kapha building',
      beauty_focus: 'Deepest nourishment of the year. Skin at its driest. Begin thinking about spring detox.',
      recommended: ['Heaviest skincare of the year', 'Overnight hair oiling with sesame or brahmi oil', 'Panchakarma (Ayurvedic detox) traditionally performed this season', 'Warm milk with ashwagandha and shatavari for Ojas building'],
    },
  },
};

// ─── ABHYANGA — SELF OIL MASSAGE ─────────────────────────────────────────────

export const ABHYANGA_GUIDE = {
  overview: 'Abhyanga is the Ayurvedic practice of self-massage with warm oil. It is considered one of the most important Dinacharya (daily routine) practices in Ayurveda. "Abhyanga" means "anointment of the self with oil".',
  benefits: [
    'Nourishes the skin deeply (Snehana — oleation)',
    'Stimulates lymphatic drainage (reduces puffiness)',
    'Improves circulation',
    'Calms the nervous system (Vata-pacifying)',
    'Supports joint health',
    'Promotes deep sleep (done in the evening)',
    'Builds Ojas (essential life essence)',
  ],
  oil_by_dosha: {
    vata: 'Warm sesame oil (primary). Almond or avocado for sensitive skin. Heat oil slightly before application.',
    pitta: 'Coconut oil (cooling). Or a Pitta-formulated oil with cooling herbs (brahmi, rose, sandalwood).',
    kapha: 'Lighter mustard oil or sunflower oil. Can add warming spices (ginger, camphor diluted). Stimulating massage strokes.',
  },
  technique: [
    'Warm oil slightly (stand bottle in hot water or warm briefly).',
    'Begin at scalp (if including hair) and work down the body.',
    'Use long strokes on long bones (arms, legs).',
    'Use circular strokes on joints (knees, elbows, hips).',
    'Massage abdomen in clockwise circular strokes.',
    'Spend 15-20 minutes on full body.',
    'Leave oil on skin for at least 20-30 minutes (traditionally 45 minutes to 1 hour).',
    'Shower with warm (not hot) water — use gentle soap only where needed. Let the remaining oil on the body absorb.',
  ],
  frequency: 'Daily is the Ayurvedic ideal. Weekly is realistic for most modern people. Once a month is better than never.',
  modern_adaptation: 'A 5-10 minute evening body oil routine after shower — applying body oil to slightly damp skin — captures much of the benefit of traditional Abhyanga with modern time constraints.',
};

// ─── KEY AYURVEDIC BEAUTY INGREDIENTS ────────────────────────────────────────

export const AYURVEDIC_INGREDIENTS = {
  ashwagandha: {
    name: 'Ashwagandha (Withania somnifera)',
    also_known: 'Indian Winter Cherry; Indian Ginseng',
    beauty_benefits: [
      'Adaptogenic — reduces cortisol and stress (stress → skin inflammation, hair loss, dullness)',
      'Antioxidant support',
      'Anti-inflammatory (withanolides)',
      'Anti-aging — some evidence for collagen support',
      'Hair health — reduces stress-related telogen effluvium',
    ],
    evidence: 'Good evidence for adaptogenic stress reduction (human RCTs). Topical skin evidence more limited.',
    dosha: 'Primarily Vata-pacifying. Also supports Kapha and Pitta in appropriate forms.',
    use: 'Oral supplement (ashwagandha root powder in warm milk — Golden Milk) or topical in oil or cream.',
  },
  turmeric: {
    name: 'Turmeric (Curcuma longa)',
    active: 'Curcumin (1-3% of turmeric root by weight)',
    beauty_benefits: [
      'Anti-inflammatory (curcumin)',
      'Tyrosinase inhibitor (reduces melanin production → helps hyperpigmentation and PIH)',
      'Antimicrobial',
      'Antioxidant',
      'Traditional wound healing',
      'Used in Haldi ceremony (pre-wedding turmeric ritual) in South Asian and West African traditions',
    ],
    caution: 'STAINING — turmeric will stain fair skin yellow for hours. Rinse off completely. Avoid on very fair (Fitzpatrick I-II) skin or use in formulated cosmetic products. For ritual use (Haldi), yellow staining is intentional and considered auspicious.',
    bioavailability: 'Curcumin has poor oral bioavailability. Taking with piperine (black pepper) significantly increases absorption — traditional Ayurveda combines turmeric with black pepper in recipes.',
    dosha: 'Primarily Kapha and Vata-pacifying. In excess, can aggravate Pitta.',
  },
  brahmi: {
    name: 'Brahmi (Bacopa monnieri; also Centella asiatica called Brahmi in some regions)',
    note: 'Bacopa monnieri and Centella asiatica are both sometimes called "Brahmi" — they are different plants with overlapping benefits.',
    beauty_benefits_bacopa: [
      'Anti-anxiety and stress reduction (supports hair and skin by reducing stress hormones)',
      'Antioxidant',
      'Traditional hair tonic — stimulates hair growth',
    ],
    beauty_benefits_centella: [
      'Wound healing and collagen synthesis (madecassoside)',
      'Anti-inflammatory',
      'Anti-aging',
      'K-Beauty popularised centella asiatica for sensitive skin (same plant, different cultural tradition)',
    ],
    dosha: 'Tridoshic — good for all doshas. Particularly supports Pitta (calming).',
  },
  neem: {
    name: 'Neem (Azadirachta indica)',
    beauty_benefits: [
      'Potent antimicrobial (azadirachtin, nimbidin)',
      'Anti-inflammatory',
      'Antibacterial and antifungal',
      'Excellent for acne (Kapha and Pitta types)',
      'Traditional use for scalp conditions (dandruff, seborrheic dermatitis)',
    ],
    scent: 'Very strong, bitter, sulphurous smell. Products usually heavily fragranced to mask it or use purified neem extracts.',
    dosha: 'Pitta and Kapha-pacifying. Can aggravate Vata if used excessively (too drying).',
  },
  shatavari: {
    name: 'Shatavari (Asparagus racemosus)',
    translation: '"One who possesses a hundred husbands" — a reference to its historical use as a feminine health tonic.',
    beauty_benefits: [
      'Phytoestrogenic (plant compounds that weakly mimic oestrogen)',
      'Supports skin hydration (oestrogen-associated moisture)',
      'Supports hair thickness and growth (oestrogen is anabolic for hair)',
      'Traditional use for all stages of female reproductive health',
      'Adaptogenic stress support',
    ],
    who_it_helps: 'Particularly beneficial for women experiencing hormonal dryness (perimenopause, post-partum) and associated skin dullness or hair loss.',
    dosha: 'Primarily Pitta and Vata-pacifying.',
  },
  bhringraj: {
    name: 'Bhringraj (Eclipta prostrata; Eclipta alba)',
    translation: '"King of hair"',
    beauty_benefits: [
      'Traditional Ayurvedic hair growth tonic',
      'Stimulates hair follicle activity',
      'Reduces scalp inflammation',
      'Traditional use for premature greying',
      'DHT (androgenic alopecia) — some traditional use as anti-androgenic support',
    ],
    evidence: 'Some animal studies show hair growth stimulation. Limited human RCT evidence. Widely used in Indian hair oil formulations (Mahabringraj oil).',
    use: 'Bhringraj oil: applied to scalp and hair, left overnight, then washed.',
    dosha: 'Tridoshic; particularly Pitta-pacifying for hair.',
  },
  amla: {
    name: 'Amla (Emblica officinalis — Indian Gooseberry)',
    beauty_benefits: [
      'Highest natural vitamin C content of any botanical (around 600-700mg/100g in fresh fruit)',
      'Potent antioxidant',
      'Collagen support',
      'Traditional hair darkening (inhibits melanin degradation)',
      'DHT inhibition (mild 5-alpha reductase inhibitor — traditional use for androgenetic alopecia)',
      'Scalp anti-inflammatory',
      'Traditional brightening ingredient in Ubtan (South Asian skin brightening paste)',
    ],
    evidence: 'Good evidence for antioxidant properties. Hair growth evidence primarily traditional and animal studies.',
    dosha: 'Tridoshic (good for all doshas). The quintessential Ayurvedic Rasayana (rejuvenating) ingredient.',
    oral_use: 'Amla juice/powder consumed internally is one of the most widely recommended Ayurvedic internal beauty supplements.',
  },
  sandalwood: {
    name: 'Sandalwood (Santalum album — Indian Sandalwood; S. spicatum — Australian; S. paniculatum — Hawaiian)',
    note: 'Indian sandalwood (Chandan) is the most prized but is now over-harvested and very expensive. Sustainable alternatives (Australian sandalwood) are widely available.',
    beauty_benefits: [
      'Anti-inflammatory',
      'Cooling (Pitta-pacifying)',
      'Antimicrobial',
      'Astringent — tightens pores',
      'Traditional skin brightening',
      'Calming fragrance — reduces stress-related skin inflammation via relaxation response',
    ],
    traditional_use: 'Sandalwood paste (Chandan) is mixed with rose water, turmeric, or milk and applied as a face mask. A traditional cooling treatment for Pitta skin conditions (redness, rash, sun sensitivity).',
    dosha: 'Primarily Pitta-pacifying.',
  },
  multani_mitti: {
    name: 'Multani Mitti (Fuller\'s Earth / Calcium Montmorillonite clay)',
    origin: 'Named after Multan, Pakistan — where it was traditionally mined.',
    beauty_benefits: [
      'Powerful oil absorption',
      'Deep pore cleansing',
      'Removes excess sebum',
      'Mild brightening',
      'Excellent for Kapha skin type',
      'Traditional South Asian and Middle Eastern face mask',
    ],
    caution: 'Very drying — use only 1-2x/week on normal-oily skin. Not appropriate for Vata (dry) skin types or very sensitive skin.',
    use: 'Mixed with rose water, milk, or honey into a paste; applied to face 10-15 minutes; rinse off.',
  },
  ubtan: {
    name: 'Ubtan',
    description: 'A traditional South Asian paste used for skin brightening, exfoliation, and bridal preparation. Composition varies by region and family recipe.',
    traditional_ingredients: 'Besan (chickpea flour) + turmeric + raw milk or rosewater + sandalwood + saffron (for bridal ubtan)',
    modern_ingredient: 'Some add honey, almond flour, or orange peel powder.',
    how_it_works: {
      besan: 'Exfoliates physically; absorbs excess oil',
      turmeric: 'Anti-inflammatory; pigmentation reduction',
      milk: 'Lactic acid (gentle exfoliation); protein',
      rose_water: 'Toning; anti-inflammatory',
    },
    use_occasion: 'Traditionally applied to brides for weeks before the wedding (Haldi ceremony). Also used as a weekly face and body mask.',
  },
};

// ─── PANCHAKARMA BEAUTY ───────────────────────────────────────────────────────

export const PANCHAKARMA_BEAUTY = {
  overview: 'Panchakarma is Ayurveda\'s most comprehensive purification program — a 5-action (pancha = five; karma = action) detoxification process administered at authentic Ayurvedic clinics. It is considered the deepest reset for the body, mind, and skin.',
  beauty_relevance: 'Panchakarma is sought for skin conditions (chronic acne, psoriasis, eczema) that have not responded to conventional treatment, premature aging, and as a full-body beauty reset. The program\'s systematic cleansing is believed to remove Ama (toxins) that cause skin and hair dullness.',
  five_actions: {
    vamana: 'Therapeutic emesis (vomiting). Used primarily for Kapha conditions. Not commonly done outside authentic Ayurvedic clinics.',
    virechana: 'Therapeutic purgation. Used for Pitta conditions — including inflammatory skin conditions. Administered under medical supervision.',
    basti: 'Medicated enema. The most important Panchakarma therapy. Used for Vata conditions and as a delivery system for deep-acting herbal medicines.',
    nasya: 'Nasal administration of medicated oils. Excellent for Vata conditions affecting the head — dry sinuses, premature greying, hair loss, stress.',
    raktamokshana: 'Blood-letting (rarely performed in modern practice). Historically used for Pitta blood conditions including severe inflammatory skin conditions.',
  },
  pre_panchakarma_snehana: 'Sneha (oil) therapies precede Panchakarma: internal ghee consumption (to loosen Ama from deep tissues) and Abhyanga (external oleation). This is the stage most accessible to individuals outside an Ayurvedic clinic.',
  modern_accessible: 'Authentic Panchakarma requires a qualified Vaidya (Ayurvedic practitioner) and a residential stay at a genuine Panchakarma centre. Avoid "Panchakarma" experiences at spas — genuine Panchakarma is a medically supervised process, not a spa treatment.',
};

// ─── ETHNIC AYURVEDIC BEAUTY ──────────────────────────────────────────────────

export const ETHNIC_AYURVEDIC_TRADITIONS = {
  south_asian: {
    community: 'South Asian',
    relationship: 'Ayurveda is indigenous to South Asian culture and is a living tradition across India, Sri Lanka, Nepal, and the diaspora. Many practices (hair oiling, Haldi, ubtan, neem use) are everyday cultural practices that are also Ayurvedic.',
    practices: ['Weekly or daily hair oiling (Champi)', 'Haldi ceremony pre-wedding', 'Ubtan for skin brightening', 'Neem-based skincare and haircare', 'Abhyanga as self-care practice', 'Chandan (sandalwood) paste for cooling treatment'],
  },
  west_african: {
    community: 'West African',
    relationship: 'Trade routes between South Asia and West Africa spread knowledge of some Ayurvedic plants. Turmeric has been absorbed into many West African herbal traditions. Haldi-like yellow paste rituals exist in some West African ceremonial practices.',
  },
  arab: {
    community: 'Arab',
    relationship: 'Arab physicians of the mediaeval period translated and synthesised Ayurvedic texts with Greek humoral medicine. Unani medicine (Greco-Arabic) shares many herbs with Ayurveda. Sandalwood and turmeric have been significant in Arab trade and medicine.',
  },
  east_asian: {
    community: 'East Asian',
    relationship: 'Traditional Chinese Medicine (TCM) and Ayurveda evolved in parallel and share some botanical traditions. Centella asiatica (one of the "Brahmi" plants) is used in both Ayurvedic and Korean beauty traditions (where it is a core K-Beauty ingredient in sensitive skin formulations).',
    k_beauty_connection: 'The "Cica" (cicatrizant — wound-healing) craze in K-Beauty is largely centella asiatica, which Ayurveda has used for millennia as Brahmi/Gotu Kola.',
  },
  caribbean: {
    community: 'Caribbean',
    relationship: 'South Asian indentured labourers brought to the Caribbean (especially Trinidad & Tobago, Guyana, Jamaica) from the 1830s to 1917 brought Ayurvedic knowledge. Indo-Caribbean communities maintain many Ayurvedic practices today.',
  },
  black_american: {
    community: 'Black American',
    relationship: 'Growing interest in Ayurveda in Black American wellness communities. Some practitioners point to parallels between West African herbalist traditions and Ayurvedic principles. Modern Ayurvedic practitioners of African heritage are creating culturally adapted Ayurvedic frameworks.',
  },
  east_african: {
    community: 'East African',
    relationship: 'Indian traders and communities on the East African coast (Swahili Coast, Zanzibar) have influenced local medicine for centuries. Turmeric and sandalwood are present in some East African coastal beauty traditions.',
  },
  south_african: {
    community: 'South African',
    relationship: 'Indian communities in South Africa (KwaZulu-Natal especially) maintain Ayurvedic traditions. Some Ayurvedic practices have integrated with local African herbal medicine traditions.',
  },
  latina: {
    community: 'Latina',
    relationship: 'Growing adoption of Ayurvedic practices among Latina wellness communities, often syncretically integrated with Indigenous botanical traditions from the Americas.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getAyurvedaOverview() { return AYURVEDA_OVERVIEW; }
export function getDosha(dosha) {
  return DOSHAS[dosha?.toLowerCase()] || DOSHAS;
}
export function getRitucharya(season) {
  const seasonMap = {
    spring: 'vasanta_spring', summer: 'grishma_summer',
    monsoon: 'varsha_monsoon', autumn: 'sharad_autumn',
    winter: 'hemanta_winter', 'late winter': 'shishira_late_winter',
  };
  const key = seasonMap[season?.toLowerCase()];
  return key ? RITUCHARYA_BEAUTY.seasons[key] : RITUCHARYA_BEAUTY;
}
export function getAbhyangiGuide() { return ABHYANGA_GUIDE; }
export function getAyurvedicIngredient(name) {
  const key = name?.toLowerCase().replace(/\s+/g, '_');
  return AYURVEDIC_INGREDIENTS[key] || Object.values(AYURVEDIC_INGREDIENTS);
}
export function getPanchakarmaInfo() { return PANCHAKARMA_BEAUTY; }
export function getEthnicAyurvedic(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_AYURVEDIC_TRADITIONS[key] || Object.values(ETHNIC_AYURVEDIC_TRADITIONS);
}

export const AYURVEDIC_BEAUTY_STATS = {
  doshas: 3,
  ritucharyaSeasons: 6,
  ayurvedicIngredients: Object.keys(AYURVEDIC_INGREDIENTS).length,
  ethnicCommunities: 9,
};
