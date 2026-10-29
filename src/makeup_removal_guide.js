/**
 * MIRRR Makeup Removal Guide
 * Micellar water, double cleanse, oil cleansing, cleansing balms,
 * waterproof removal, eye makeup removal, and community-specific tips
 */

// ─── WHY MAKEUP REMOVAL MATTERS ───────────────────────────────────────────────

export const MAKEUP_REMOVAL_OVERVIEW = {
  why_it_matters: {
    barrier: 'Makeup, SPF, and pollution particles accumulate on skin throughout the day. Sleeping in makeup means your skin is in contact with all of this during its primary repair cycle (overnight).',
    pores: 'Leaving foundation and concealer on overnight clogs pores and prevents the natural cell turnover that occurs during sleep.',
    eye_area: 'Eye makeup — particularly waterproof mascara and liner — is most critical to remove. Mascara particles that enter the eye over months can accumulate and cause granulomas (Medical case reports exist of this condition). Eye makeup left on repeatedly causes eye irritation, stye risk, and lash breakage.',
    actives: 'Night-time skincare actives (retinoids, exfoliants) cannot penetrate effectively through layers of makeup. Makeup removal is the prerequisite for effective PM skincare.',
  },

  micellar_water_only: {
    myth: 'Micellar water alone is NOT sufficient makeup removal for a full face of makeup.',
    reality: 'Micellar water is excellent as a FIRST step, particularly for light makeup days. For full coverage foundation, waterproof mascara, or long-wear products, a thorough double cleanse is needed.',
    evidence: 'Studies show that single-step micellar water application leaves sunscreen and heavy makeup residue on skin. Multiple saturated cotton pad swipes are needed, and even then residue remains.',
  },
};

// ─── MICELLAR WATER ───────────────────────────────────────────────────────────

export const MICELLAR_WATER = {
  how_it_works: {
    science: 'Micellar water contains micelles — tiny spherical molecular structures with a hydrophilic (water-loving) outer shell and lipophilic (oil-loving/makeup-attracting) core. Micelles lift away makeup, oil, and surface debris without requiring rinsing.',
    no_rinse_option: 'Most micellar waters are formulated to be used without rinsing. However, rinsing is fine and may be preferable if skin feels residue.',
    solvent_concern: 'Some micellar waters (including classic Bioderma Sensibio H2O) contain polyethylene glycol-based solvents (PEGs) that are effective makeup removers but can be irritating to eczema-prone skin. Sensitive skin formulations avoid these.',
  },

  technique: {
    correct: [
      '1. Saturate cotton pad generously — dry or damp pads are less effective',
      '2. HOLD pad on area for 10-20 seconds — dissolving makeup',
      '3. GENTLY wipe away — avoid aggressive rubbing',
      '4. Use a fresh pad for each area (eyes especially need their own pad)',
      '5. Repeat until pad comes away clean',
    ],
    common_mistake: 'Immediately rubbing without holding. The hold time is what allows the micelles to dissolve the makeup. Rubbing without holding just drags makeup across the skin.',
  },

  for_eye_area: {
    hold_time: 'For eye area, hold cotton pad on closed eye for 20-30 seconds — longer for waterproof products.',
    avoid_tugging: 'Eye skin is the thinnest, most delicate skin on the face. Tugging and rubbing contributes to premature wrinkles and elasticity loss.',
    reusable_pads: 'Reusable cotton rounds and bamboo pads are eco-friendly alternatives; wash after each use.',
  },

  best_formulations: {
    for_sensitive: ['Bioderma Sensibio H2O (France\'s bestseller)', 'La Roche-Posay Micellar Water Ultra Sensitive', 'Cetaphil Gentle Makeup Removing Micellar Cleansing Water'],
    for_waterproof: ['Garnier Micellar Cleansing Water All-in-1 Waterproof', 'Neutrogena Hydro Boost Micellar Water'],
    affordable: ['Simple Kind to Skin Micellar Cleansing Water', 'Equate (Walmart) Micellar Water'],
    for_dark_skin: 'Standard micellar waters are generally suitable for all skin tones. Choose fragrance-free, alcohol-free formulations for sensitive or dark skin prone to PIH.',
  },
};

// ─── DOUBLE CLEANSE ───────────────────────────────────────────────────────────

export const DOUBLE_CLEANSE = {
  overview: 'The double cleanse is a two-step approach: first an oil-based cleanser to remove makeup and SPF (oil dissolves oil); then a water-based cleanser to remove any remaining residue and complete cleansing.',
  origin: 'Popularised by Korean beauty (K-beauty) culture as a cornerstone of multi-step skincare. Significant evidence behind it as the most thorough cleansing approach.',

  step_one_options: {
    cleansing_oil: {
      what: 'An oil or oil-blend product applied to dry skin, massaged over face to dissolve makeup, then emulsified with water and rinsed.',
      how_to_use: [
        'Apply to DRY hands and DRY face',
        'Massage in circular motions for 60 seconds',
        'Add a small amount of water to palms — massage to emulsify (oil turns milky)',
        'Rinse thoroughly',
      ],
      best_for: 'All skin types; particularly efficient makeup removal; oily skin actually responds well (oil cleansing does not cause oiliness).',
      popular_options: ['DHC Deep Cleansing Oil (classic Japanese product)', 'Kiehl\'s Midnight Recovery Botanical Cleansing Oil', 'The Face Shop Rice Water Bright Cleansing Oil', 'Heimish All Clean Balm (balm-oil hybrid)'],
    },

    cleansing_balm: {
      what: 'A solid or semi-solid oil-based cleanser that melts on contact with skin. Often more convenient than liquid oils.',
      how_to_use: [
        'Scoop small amount with dry spatula',
        'Apply to dry hands; melt between palms',
        'Massage over dry face',
        'Add water to emulsify or wipe off with warm flannel',
      ],
      popular_options: ['Banila Co Clean It Zero (Korean bestseller)', 'Farmacy Green Clean', 'Pixi Double Cleanse', 'Clinique Take The Day Off Cleansing Balm'],
      ethnic_note: 'Cleansing balms with brightening ingredients (vitamin C, niacinamide) are particularly popular in East Asian beauty culture.',
    },

    cleansing_milk_for_first_step: {
      what: 'Gentle emulsion cleanser used on dry skin. Less efficient than oil/balm for heavy makeup but gentler.',
      best_for: 'Dry or sensitive skin; light makeup days; rosacea-prone skin where stronger cleansers irritate.',
    },

    micellar_water_as_first_step: {
      what: 'Using micellar water (saturated cotton pads) as the first step before water-based cleanse.',
      when: 'When you prefer not to use oil; for removing majority of makeup before proper cleanse.',
      note: 'Less efficient than oil/balm for full makeup removal but better than single-step micellar alone.',
    },
  },

  step_two_options: {
    overview: 'Water-based cleanser removes remaining residue and provides actual skin cleansing.',
    by_skin_type: {
      oily: 'Foaming gel cleanser; salicylic acid cleanser for acne control.',
      dry: 'Cream or lotion cleanser; milk cleanser; gentle hydrating foam.',
      sensitive: 'Ultra-gentle non-foaming cream cleanser; fragrance-free; SLS-free.',
      combination: 'Balancing gel cleanser; gentle foaming formula.',
      acne_prone: 'Benzoyl peroxide cleanser (leave on 60 seconds before rinsing for efficacy); salicylic acid gel.',
    },
    popular_options: {
      for_all_types: ['CeraVe Hydrating Facial Cleanser', 'La Roche-Posay Toleriane Hydrating Gentle Cleanser'],
      oily_acne: ['Paula\'s Choice CLEAR Pore Normalizing Cleanser', 'CeraVe Acne Control Cleanser'],
      sensitive: ['Avene Tolerance Extremely Gentle Cleanser', 'Cetaphil Gentle Skin Cleanser'],
      dry: ['First Aid Beauty Pure Skin Face Cleanser', 'Tata Harper Nourishing Oil Cleanser (used as second step for dry skin)'],
    },
  },
};

// ─── OIL CLEANSING ────────────────────────────────────────────────────────────

export const OIL_CLEANSING = {
  the_oil_cleansing_method: {
    overview: 'The Oil Cleansing Method (OCM) is a specific approach to using oils as the PRIMARY cleanser, often without a second water-based step.',
    how_it_works: 'Based on the principle "like dissolves like" — oil dissolves the sebum and oil-based impurities on skin far more effectively than surfactant cleansers.',
    process: [
      '1. Massage chosen oil into dry face (30-60 seconds)',
      '2. Apply warm/hot flannel/face cloth over face; hold for 30 seconds to steam',
      '3. Wipe gently with flannel — does not require rinse',
      '4. Pat dry; apply moisturiser if needed',
    ],
    note: 'OCM as sole cleanse is most suitable for dry or mature skin; oily or acne-prone skin usually benefits from a second water-based step.',
  },

  oils_by_skin_type: {
    oily_acne_prone: {
      jojoba: 'Most skin-identical — chemically most similar to human sebum; signals skin to produce less. Non-comedogenic. Best oil for oily/acne skin.',
      hemp_seed: 'Non-comedogenic; anti-inflammatory; balancing.',
      grapeseed: 'Light; non-comedogenic; antioxidant.',
    },
    dry: {
      marula: 'Rich in oleic acid; intensely nourishing; absorbs well.',
      argan: 'Rich in vitamin E; nourishing but not heavy.',
      rosehip: 'High in linoleic acid; vitamin A (natural retinoid); brightening; good for dark spots.',
      avocado: 'Very rich; excellent for very dry skin; not suitable for acne-prone.',
    },
    sensitive_rosacea: {
      squalane: 'Most gentle option; non-irritating; non-comedogenic; identical to natural skin lipid.',
      sunflower_seed: 'Anti-inflammatory; high in linoleic acid; gentle.',
    },
    combination: {
      rosehip: 'Balanced oil profile; suits combination skin; brightening benefit.',
      jojoba: 'Balancing; suits most skin types.',
    },
  },

  comedogenicity_myth: {
    reality: 'Comedogenicity scales (rating oils from 0-5 on how likely to clog pores) are based on rabbit ear studies from the 1970s and have limited applicability to human facial skin.',
    what_actually_matters: 'Linoleic to oleic acid ratio is more relevant. Acne-prone skin tends to be deficient in linoleic acid. Oils high in linoleic acid (rosehip, hemp, grapeseed) are generally better tolerated on acne-prone skin. Oils high in oleic acid (marula, avocado, argan) are richer and better suited to dry skin.',
    individual_variation: 'What clogs one person\'s pores doesn\'t necessarily clog another\'s. Patch testing on jaw for 2 weeks before full face application.',
  },
};

// ─── WATERPROOF MAKEUP REMOVAL ─────────────────────────────────────────────────

export const WATERPROOF_REMOVAL = {
  what_makes_waterproof: {
    chemistry: 'Waterproof cosmetics use long-lasting polymers and waxes that resist water but are dissolved by oils and silicones.',
    products: 'Waterproof mascara, waterproof eyeliner, long-wear foundation, setting spray — all require oil-based or bi-phase removers.',
  },

  bi_phase_removers: {
    what: 'Two-phase products — an oily phase and a watery phase that separate when sitting. ALWAYS shake before use to combine phases.',
    how_to_use: 'Shake; saturate cotton pad; hold on eye 20-30 seconds; gentle swipe.',
    for: 'Waterproof mascara, waterproof liner — bi-phase removers are the most efficient targeted removers.',
    popular: ['Lancôme Bi-Facil', 'Maybelline Expert Eyes Waterproof Eye Makeup Remover', 'L\'Oreal Micellar Water Waterproof'],
  },

  for_mascara: {
    correct_technique: [
      '1. Saturate cotton pad with oil-based or bi-phase remover',
      '2. HOLD gently on closed eye for 15-20 seconds',
      '3. Stroke DOWNWARD — in direction of lash growth (not rubbing back and forth)',
      '4. For lower lashes: hold cotton under eye; look up; stroke downward',
      '5. Q-tip with remover for precise removal under eyes',
    ],
    what_not_to_do: [
      'Do NOT rub back and forth — causes lash breakage and delicate skin damage',
      'Do NOT pull on lashes',
      'Do NOT pick at dried mascara flakes',
    ],
    ethnic_note: 'In Black American beauty culture where dramatic lash looks are common (layered mascara, false lash adhesive), thorough eye makeup removal is essential. Use adequate remover; do not rush.',
  },

  for_long_wear_foundation: {
    technique: [
      '1. Apply generous amount of cleansing oil or balm to dry face',
      '2. Massage for minimum 60 seconds — long-wear products need contact time',
      '3. Emulsify with water or use warm flannel',
      '4. Follow with water-based cleanser (double cleanse)',
    ],
    common_mistake: 'Not massaging for long enough. Long-wear foundation is designed to resist removal — it needs MORE contact time than regular foundation.',
  },

  for_lip_stains: {
    toughest_product: 'Lip stains and matte liquid lipsticks are the hardest makeup products to remove.',
    technique: 'Soak cotton with oil-based makeup remover; hold on lips 30-60 seconds; wipe gently. May need multiple applications. Coconut or jojoba oil effective.',
    gentle_option: 'Petroleum jelly (Vaseline) on lips overnight dissolves most stains by morning.',
  },
};

// ─── EYE MAKEUP REMOVAL ───────────────────────────────────────────────────────

export const EYE_MAKEUP_REMOVAL = {
  importance: 'The eye area requires special attention in makeup removal — the skin is thinnest (0.5mm vs 2mm elsewhere on face), most delicate, and contains the eye itself.',

  kohl_and_kajal: {
    traditional_note: 'Traditional kohl and kajal (used extensively across Arab, South Asian, and East African communities) is applied inside the waterline and on the inner lower lid. This makes it particularly important to remove thoroughly.',
    safe_removal: [
      'Use oil-based remover or pure oil (coconut, argan)',
      'Apply to cotton round; hold over closed eye',
      'Wet Q-tip with remover for inside waterline cleaning',
      'Rinse with clean water after',
    ],
    inner_waterline: 'Gently clean the inner lower waterline with a wet cotton swab — an area often missed that can accumulate product over time.',
  },

  contact_lens_wearers: {
    order: 'REMOVE CONTACT LENSES before eye makeup removal. Makeup remover that contacts lenses can damage them and cause eye irritation.',
    products: 'Use eye-specific, ophthalmologist-tested removers. Avoid oil-based removers if you wear soft contact lenses during removal (residue can deposit on lenses).',
  },

  lash_extensions: {
    oil_rule: 'NEVER use oil-based makeup removers on eye makeup when wearing lash extensions. Oil dissolves lash extension adhesive.',
    safe_options: 'Use oil-free micellar water on cotton pad; avoid area directly on extensions; water rinse.',
    technique: 'If wearing extensions, apply remover to cotton BELOW lash line; work very gently and avoid saturation of extensions themselves.',
  },

  false_lashes_removal: {
    with_glue: [
      '1. Saturate cotton pad with oil-based remover or micellar water',
      '2. Hold over closed eye 30-60 seconds to soften glue',
      '3. Gently grasp lash from outer edge and peel inward',
      '4. If resistance felt: apply more remover; wait longer',
      '5. Never pull sharply — you may remove your own lashes',
    ],
  },
};

// ─── COMMUNITY CLEANSING TRADITIONS ───────────────────────────────────────────

export const COMMUNITY_CLEANSING_TRADITIONS = {
  arab: {
    traditional: 'Olive oil has been used as a traditional cleanser and makeup remover across the Arab world for centuries. Modern Arab skincare incorporates this in cleansing balms and oils.',
    kohl: 'Thorough kohl removal before sleep is an important step — traditional practice.',
    hammam: 'Weekly hammam visits involve deep cleansing of face and body with black soap (saboun beldi) and kese mitt exfoliation — thorough cleansing embedded in weekly ritual.',
  },

  east_asian: {
    k_beauty: 'K-beauty popularised double cleansing globally. In Korea, elaborate multi-step evening routines with thorough first and second cleanse are standard.',
    japanese: 'Japanese cleansing philosophy emphasises thorough but gentle cleansing. Cleansing oil use has deep roots in Japanese skincare (DHC is a Japanese brand).',
    chinese: 'Rice water as a traditional cleanser and skin treatment — used as final rinse after cleansing in some traditions.',
  },

  south_asian: {
    coconut_oil: 'Coconut oil has been used as a traditional cleanser and makeup remover across South and Southeast Asia.',
    multani_mitti: 'Multani mitti (Fuller\'s earth) is a traditional cleansing clay used across South Asia — used as weekly deep cleanse, not daily.',
    ubtans: 'Ubtans — herbal pastes combining chickpea flour, turmeric, and other ingredients — are traditional skin-cleansing rituals particularly before weddings.',
  },

  west_african: {
    black_soap: 'African black soap (ose dudu) is a traditional West African cleanser. Made from plantain peel ash, cocoa pod ash, and oils — gentle, effective. Particularly popular for its natural ingredient profile.',
    caution: 'Authentic black soap is unrefined and can be abrasive if used too frequently. Use 2-3 times per week as deep cleanse; gentle foam cleansers for daily use.',
  },

  caribbean: {
    aloe: 'Aloe vera used as traditional cleanser and soothing agent across Caribbean communities. Fresh aloe leaf juice as gentle cleanser.',
  },

  latina: {
    avocado: 'Avocado used in various beauty preparations across Mesoamerican traditions. Avocado oil as cleanser/makeup remover.',
    aloe: 'Aloe vera (sábila) used extensively in Latin beauty traditions as cleanser and skin treatment.',
  },
};

// ─── SENSITIVE SKIN REMOVAL ───────────────────────────────────────────────────

export const SENSITIVE_SKIN_REMOVAL = {
  rosacea: {
    rules: [
      'Lukewarm water ONLY — hot water triggers rosacea flushing',
      'Gentle touch — no rubbing, scrubbing, or friction',
      'Fragrance-free products throughout',
      'Sponges and flannels may aggravate rosacea skin — use hands',
      'Avoid micellar waters containing polysorbate (can irritate rosacea)',
    ],
    products: ['Avene Tolerance Very High Tolerance Cleansing Lotion', 'La Roche-Posay Micellar Water Ultra Sensitive Skin', 'Vanicream Gentle Facial Cleanser'],
  },

  eczema_prone: {
    rules: [
      'Avoid all foaming cleansers (SLS/SLES destroys skin barrier in eczema)',
      'Use gentle cream or oil cleansers only',
      'Rinse thoroughly — residue triggers eczema flares',
      'Pat dry — never rub',
      'Apply moisturiser immediately after cleansing while skin still slightly damp',
    ],
    products: ['Cetaphil Gentle Skin Cleanser', 'Vanicream Gentle Facial Cleanser', 'CeraVe Hydrating Facial Cleanser', 'Aveeno Ultra-Calming Foaming Cleanser (gentle foam)'],
  },

  dark_skin_PIH: {
    rules: [
      'No scrubbing, rubbing, or friction — inflammatory response triggers PIH',
      'Gentle, light touch in all cleansing steps',
      'Avoid harsh foaming cleansers — can strip barrier, causing reactive inflammation',
      'Double cleanse is APPROPRIATE for dark skin — it means gentle cleansing twice rather than aggressive cleansing once',
    ],
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getMakeupRemovalOverview() {
  return MAKEUP_REMOVAL_OVERVIEW;
}

export function getMicellarWaterGuide() {
  return MICELLAR_WATER;
}

export function getDoubleCleanseGuide(step) {
  if (step === 1) return DOUBLE_CLEANSE.step_one_options;
  if (step === 2) return DOUBLE_CLEANSE.step_two_options;
  return DOUBLE_CLEANSE;
}

export function getOilCleansingGuide(skin_type) {
  if (skin_type) return OIL_CLEANSING.oils_by_skin_type[skin_type] || OIL_CLEANSING;
  return OIL_CLEANSING;
}

export function getWaterproofRemovalGuide(product_type) {
  if (product_type === 'mascara') return WATERPROOF_REMOVAL.for_mascara;
  if (product_type === 'foundation') return WATERPROOF_REMOVAL.for_long_wear_foundation;
  if (product_type === 'lip') return WATERPROOF_REMOVAL.for_lip_stains;
  return WATERPROOF_REMOVAL;
}

export function getEyeMakeupRemovalGuide() {
  return EYE_MAKEUP_REMOVAL;
}

export function getCommunityCleansingTradition(communityId) {
  return COMMUNITY_CLEANSING_TRADITIONS[communityId.replace('-', '_')] || null;
}

export function getSensitiveSkinRemovalGuide(condition) {
  return SENSITIVE_SKIN_REMOVAL[condition] || SENSITIVE_SKIN_REMOVAL;
}

export const MAKEUP_REMOVAL_STATS = {
  removalMethods: ['micellar', 'double_cleanse', 'oil_cleansing', 'balm', 'bi_phase', 'flannel'],
  communitiesCovered: Object.keys(COMMUNITY_CLEANSING_TRADITIONS).length,
  oilsByType: Object.keys(OIL_CLEANSING.oils_by_skin_type).length,
};
