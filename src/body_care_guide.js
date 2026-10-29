/**
 * MIRRR Body Care Guide
 * Full-body care for melanin-rich skin
 * Exfoliation, moisturising, hyperpigmentation, stretch marks, body hair
 */

// ─── BODY CARE BASICS ─────────────────────────────────────────────────────────

export const BODY_CARE_FUNDAMENTALS = {
  why_body_care_matters: 'The face gets 95% of our skincare attention, but the skin on our body is the same organ — and it responds to the same care. Many conditions that affect facial skin (hyperpigmentation, dryness, ingrown hairs) also affect the body and often benefit from similar approaches.',

  body_skin_differences_from_face: {
    thicker: 'Body skin is generally thicker than facial skin, especially on the backs of the arms, legs, and feet',
    less_sebum: 'The body has fewer sebaceous glands than the face — this means the body is actually more prone to dryness than facial skin',
    more_sun_damage: 'Exposed areas (décolletage, arms, legs) accumulate significant sun damage because we apply SPF to faces but rarely to bodies',
    slower_turnover: 'Cell turnover is slower on the body — exfoliation has even bigger impact on body skin than face',
    stretch: 'Body skin stretches dramatically (pregnancy, weight changes) — elasticity and moisture are important',
  },
};

// ─── EXFOLIATION FOR THE BODY ─────────────────────────────────────────────────

export const BODY_EXFOLIATION = {
  why_exfoliate: [
    'Removes build-up of dead skin cells that cause dullness',
    'Smooths rough texture (keratosis pilaris, dry patches)',
    'Prevents and treats ingrown hairs',
    'Improves body lotion absorption — moisturiser on top of dead skin is far less effective',
    'Fades body hyperpigmentation over time (combined with AHA exfoliants)',
    'Improves circulation and lymphatic drainage',
    'Creates that "glow" we associate with healthy skin',
  ],

  physical_exfoliation: {
    loofahs: {
      what: 'Natural gourd or synthetic mesh scrubbing tool',
      pros: 'Accessible, effective for mild exfoliation',
      cons: 'Harbours bacteria when wet — must be replaced regularly (every 3-4 weeks) or left to completely dry between uses',
      use: '2-3x per week',
    },
    exfoliating_gloves: {
      what: 'Textured mitt worn on the hand',
      popular_in: 'West African and Middle Eastern beauty cultures (kessa glove in hammam rituals)',
      pros: 'More pressure control, easy to reach all body areas, washable and reusable',
      technique: 'Circular or upward strokes on dampened skin, then rinse',
      hammam_method: 'In hammam tradition, the kessa glove is used after steaming — when skin has been softened and the grey "dead skin" rolls off more dramatically. This produces the distinctive "greyish rolls" of exfoliated skin — a satisfying visual indication of effectiveness.',
    },
    body_scrubs: {
      coffee_scrub: {
        ingredients: ['1 cup coffee grounds', '1/2 cup coconut oil', '1/4 cup brown sugar', 'Optional: vanilla extract'],
        benefits: 'Caffeine temporarily reduces puffiness and improves circulation. The grit of grounds is an excellent physical exfoliant.',
        note: 'Avoid drains — coffee grounds can clog pipes. Scrub in a bucket or catch grounds in a mesh drain guard.',
        popular_in: 'Brazilian beauty culture',
      },
      sugar_scrub: {
        what: 'AHA in its natural form — sugar dissolves as you scrub, adjusting the intensity',
        gentler_than: 'Salt scrubs, which can be too harsh for sensitive or irritated skin',
        diy: '1/2 cup sugar, 1/4 cup any carrier oil (coconut, sweet almond, jojoba), optional essential oil',
      },
      salt_scrub: {
        what: 'More intense than sugar — mineralising (sea or Himalayan salt)',
        best_for: 'Feet, elbows, very rough areas — NOT sensitive skin, fresh shaving, or broken skin',
        mineral_addition: 'Dead Sea salt contains magnesium and potassium — traditional for skin mineral treatment',
      },
      ubtan: {
        origin: 'South Asian traditional body scrub — pre-bath ritual',
        traditional_recipe: ['Chickpea flour (besan)', 'Turmeric', 'Sandalwood powder', 'Rosewater or milk', 'Optional: raw honey', 'Optional: saffron for brightening'],
        how_to: 'Mix to paste, apply to body, let dry slightly, then scrub off with circular motions and rinse',
        benefits: 'Brightening (turmeric, sandalwood), exfoliating (besan), antibacterial, deeply rooted in South Asian beauty culture',
      },
    },
    chemical_exfoliants_for_body: {
      AHA_body: {
        best_for: 'Keratosis pilaris, dark elbows, knees, hyperpigmented areas, rough skin',
        ingredients: 'Glycolic acid (most potent AHA), lactic acid (gentler), mandelic acid',
        how_to_use: 'Apply body lotion containing AHA to problem areas 2-3 nights per week. Build up tolerance.',
        recommended: ['AmLactin 12% Lactic Acid Body Lotion (a classic, affordable, effective)', 'CeraVe SA Cream (salicylic acid)', 'Eucerin Roughness Relief with Urea'],
      },
      BHA_body: {
        best_for: 'Body acne, ingrown hairs, very rough skin with pores',
        ingredient: 'Salicylic acid — penetrates pores, oil-soluble',
        recommended: ['Paula\'s Choice Body Spot Exfoliant', 'The Ordinary Salicylic Acid 2% Masque (used on back)'],
      },
    },
  },
};

// ─── KERATOSIS PILARIS ────────────────────────────────────────────────────────

export const KERATOSIS_PILARIS = {
  what: 'Those rough bumps on the backs of your upper arms (and sometimes thighs and cheeks). Also called "chicken skin." Extremely common — affects about 40% of adults.',
  cause: 'Excess keratin builds up around hair follicles, creating the bumpy texture. Often has genetic component. Made worse by dry skin and harsh products.',

  ethnic_skin_considerations: {
    visibility: 'The bumps (follicular plugs) themselves look the same across skin tones, but surrounding redness (erythema) may appear as darkening rather than redness on deeper skin — this is PIH from the minor inflammation.',
    hyperpigmentation: 'Dark spots around KP bumps are extremely common on darker skin — a combination of the bump itself and PIH from picking/irritation.',
  },

  treatment: {
    first_line: [
      'AHA body lotion (glycolic acid, lactic acid) — applied nightly. This is the #1 most effective treatment.',
      'Stop using harsh soaps on affected areas',
      'Moisturise immediately after showering while skin is still damp (shower in lukewarm water, not hot)',
    ],
    targeted: [
      'KP-specific products: AmLactin, Gold Bond Rough & Bumpy, Eucerin UreaRepair',
      'Gentle physical exfoliation with an exfoliating mitt OR AHA — not both at the same time',
      'Urea-based creams (20-40% urea) are highly effective for KP — softens the keratin plugs directly',
    ],
    for_pih_on_kp: [
      'Azelaic acid on the area (targets PIH AND KP)',
      'Niacinamide body cream',
      'Continue AHA for both texture AND fading over time',
      'SPF on affected areas if they\'re exposed to sun',
    ],
    patience: 'KP takes 3-6 months of consistent treatment to significantly improve. You are dissolving existing build-up AND preventing new.',
    never_do: 'Do NOT pick, squeeze, or attempt to extract KP bumps — this creates PIH and scarring and makes the condition worse.',
  },
};

// ─── BODY HYPERPIGMENTATION ───────────────────────────────────────────────────

export const BODY_HYPERPIGMENTATION = {
  dark_elbows_knees: {
    why: 'The skin on elbows and knees is thicker, has more folds, and is under constant friction. This chronic friction triggers melanin production (PIH pattern). Also prone to dryness which can worsen the appearance.',
    treatment: [
      'Exfoliation 2-3x per week (physical scrub + AHA combo works well here)',
      'Apply a strong AHA/BHA treatment to elbows and knees nightly',
      'Follow with a very thick emollient (shea butter, petrolatum, urea cream)',
      'Optional: Apply a targeted brightening serum (azelaic acid, alpha-arbutin, niacinamide)',
      'SPF on these areas is less critical as they\'re usually covered, but important if exposed',
    ],
    time: '3-6 months to see significant lightening with consistent approach',
    ethnic_skin_note: 'Dark elbows and knees are extremely common in South Asian, Arab, Black, and Latina communities — this is not a sign of uncleanliness or skin disease, it is a normal manifestation of the way melanin-rich skin responds to friction.',
  },

  inner_thighs: {
    why: 'Friction from walking + sweat + tight clothing creates chronic friction and heat — PIH results',
    treatment: [
      'Anti-chafe shorts or brief liners to reduce friction',
      'Dry the area thoroughly after bathing (moisture + friction = worse)',
      'Niacinamide body lotion on the area regularly',
      'AHA treatment 2-3x per week',
      'For more stubborn PIH: topical azelaic acid or alpha-arbutin cream',
    ],
    caution: 'If there is also itching, odour, or unusual discharge, see a doctor — inner thigh darkness can occasionally be a sign of intertrigo (skin fold infection) that needs treatment.',
  },

  underarm_darkness: {
    why: 'A complex combination of: shaving irritation creating chronic PIH, deodorant/antiperspirant ingredients (fragrance, alcohol) irritating skin, sweat, friction, and sometimes acanthosis nigricans (which warrants a doctor visit)',
    treatment: [
      'Switch to a fragrance-free, alcohol-free deodorant (Crystal deodorant, Dove Sensitive, etc.)',
      'Shave with grain (in the direction hair grows) using a fresh single-blade razor',
      'Exfoliate the underarm area gently 1-2x per week',
      'Apply niacinamide serum to underarms nightly',
      'Consider switching from shaving to waxing or laser — removes irritation source',
    ],
    acanthosis_nigricans: 'If underarm darkness is velvety, very dark, and extends into skin folds (neck, groin), see a doctor. Acanthosis nigricans can be associated with insulin resistance and may indicate pre-diabetes.',
    why_products_dont_work: 'Many "underarm whitening" products are highly irritating and make PIH worse. They work by chemical bleaching which irritates dark-skinned underarms. Focus on reducing the SOURCE of darkness (friction, irritants) rather than bleaching.',
  },

  stretch_marks: {
    what_they_are: 'Stretch marks (striae) occur when the skin stretches faster than it can produce collagen to accommodate — the dermis tears slightly, and the marks are essentially scar tissue. First they appear red/purple/pink (striae rubra), then fade to white/silver (striae alba).',
    who_gets_them: 'The majority of humans get them — most women during puberty, pregnancy, or significant weight changes. Very common in athletes during rapid muscle growth. Hormonal factors play a role.',

    ethnic_skin_note: 'On darker skin tones, new (red-purple) stretch marks often appear very dark rather than red — they can initially look like bruises or very dark marks. As they mature, they may appear lighter than the surrounding skin (pale on darker skin) rather than white silver.',

    prevention: {
      does_it_work: 'Oils and creams applied during pregnancy or weight gain may reduce itch and support skin suppleness, but they cannot definitively prevent stretch marks if you are genetically prone to them.',
      what_to_use: [
        'Bio-Oil (evidence-supported for reducing appearance; may also help prevention)',
        'Stretch mark creams with hyaluronic acid, collagen',
        'Centella asiatica (Cica) — wound-healing and barrier-supporting',
        'Consistent moisturisation of at-risk areas',
      ],
    },

    treatment_what_works: {
      retinoids: 'Tretinoin is the most evidence-backed topical for ACTIVE (red-pink) stretch marks. Does not work on old white stretch marks. NOT safe during pregnancy.',
      oils_for_older_marks: 'Rosehip oil and vitamin E oil have some evidence for supporting the appearance of older stretch marks — not erasing but improving texture.',
      laser: {
        fractional_laser: 'Fractional ablative lasers (Fraxel) show the best evidence for improving stretch mark texture and colour',
        for_darker_skin: 'Laser on deeper skin for stretch marks requires VERY experienced practitioners. Risk of PIH and further discolouration is high if wrong settings are used. Seek board-certified dermatologists with experience treating darker skin.',
        pulsed_dye_laser: 'Good for active red stretch marks — targets blood vessels. Less risk on darker skin than ablative.',
      },
      microneedling: 'Growing evidence base — stimulates collagen production. Generally safer on darker skin than laser for this application.',
      acceptance: 'Many people choose to embrace stretch marks, especially post-pregnancy marks which represent the body\'s remarkable capability. Stretch marks are extremely common and are in no way a sign of health problems.',
    },

    body_makeup_for_stretch_marks: [
      'Body foundation or body paint (Dermablend Leg and Body Cover, Mehron body paint)',
      'Self-tanner to even appearance (many users find stretch marks blend in with surrounding skin when self-tanner is applied)',
      'Gradual tanner lotions used consistently',
    ],
  },
};

// ─── BODY MOISTURISING ────────────────────────────────────────────────────────

export const BODY_MOISTURISING = {
  best_time: 'The single most important moisturising habit: apply body lotion/oil within 3 minutes of stepping out of the shower while skin is still damp. This traps moisture INSIDE the skin rather than applying to dry skin and having to work from scratch.',

  layering_body_care: {
    step_1: 'Pat (don\'t rub) body dry — leave some moisture on the skin',
    step_2: 'Body oil (if using) — apply to slightly damp skin first for sealing',
    step_3: 'Body lotion or body butter — seals over the oil',
    step_4: 'For very dry areas (elbows, heels, knees) — a thick cream or petrolatum-based balm on top',
  },

  textures_for_needs: {
    body_oil: {
      best_for: 'Normal to dry skin, adding glow, lightweight moisture',
      best_oils: {
        jojoba: 'Closest to skin sebum — absorbs beautifully, non-greasy',
        sweet_almond: 'Rich in vitamin E, good for eczema-prone skin, affordable',
        rosehip: 'High in vitamin A and C — some evidence for hyperpigmentation reduction',
        marula: 'Rich in oleic acid — excellent for dry and mature skin; African origin',
        argan: 'Luxury Moroccan oil — anti-aging, skin-softening',
        baobab: 'African origin — rich in vitamins A, D, E, F; deeply hydrating',
      },
    },
    body_lotion: {
      what: 'Water-based, lighter weight than cream — fast-absorbing',
      best_for: 'Daily moisturising for normal-dry skin, hot climates',
      ingredients_to_look_for: ['Glycerin', 'Ceramides', 'Hyaluronic acid', 'Shea butter'],
    },
    body_butter: {
      what: 'Rich, thick emollient — often shea or cocoa butter based',
      best_for: 'Very dry skin, cold climates, post-exfoliation',
      popular_in: 'West African beauty culture — raw shea butter is a multigenerational beauty staple',
      raw_shea_guide: {
        sourcing: 'Look for unrefined (raw) shea butter — cream to yellow colour, natural scent. Refined shea is white and odourless but has fewer active properties.',
        use: 'Use as a body butter directly, or whip with a small amount of carrier oil for lighter texture',
        ethnic_availability: 'Available in African hair and beauty supply stores, often in large quantities at good prices',
      },
    },
    body_balm: {
      what: 'Very thick, petrolatum or wax based — occlusive rather than hydrating',
      best_for: 'Extreme dry patches, cracked heels, very dry elbows',
      example: 'Vaseline petroleum jelly remains one of the most effective occlusive agents available',
    },
  },

  ethnic_community_body_care: {
    'south-asian': {
      oil_traditions: 'Sesame oil massage is traditional in Ayurvedic body care (abhyanga). Applied to the body before bathing — self-massage with warm oil.',
      coconut_oil: 'Coconut oil is deeply embedded in South and Southeast Asian body care — used on skin and hair',
      ubtan: 'Chickpea flour (besan) paste used as both cleanser and exfoliant for body skin',
    },
    'arab': {
      hammam_tradition: 'Regular hammam visits are body care practice — steam, kessa exfoliation, savon beldi, argan oil treatment',
      oils: 'Argan oil is the gold standard for Moroccan/North African skin care. Zhoura oil (ammoniac gum) is traditional Moroccan body care.',
      rose_water: 'Rosewater used as a body spray and in bathing for fragrance and skin',
    },
    'west-african': {
      shea_butter: 'Raw shea butter from the shea tree (Vitellaria paradoxa, native to Sub-Saharan Africa) is a multigenerational beauty staple used for skin and hair',
      black_soap: 'African black soap used for body washing — known for treating eczema, body acne, and hyperpigmentation',
      body_oiling: 'Heavy moisturising is a daily practice — ashy (dry) skin is actively avoided and treated',
      anti_ash: 'The term "ashy" (referring to dry, grey-looking skin visible particularly on darker skin tones) is a uniquely Black American term that captures a specific body care concern. Daily body moisturising is foundational.',
    },
    'east-asian': {
      rice_bran: 'Rice bran oil and rice water baths are traditional in Japanese beauty for soft skin',
      camellia: 'Tsubaki (camellia) oil is a traditional Japanese body and hair oil',
      korean_body_scrub: 'Italian towel (Korea\'s version of kessa glove) used in jimjilbang (Korean spa) — a communal body exfoliation experience',
    },
  },
};

// ─── BODY HAIR MANAGEMENT ─────────────────────────────────────────────────────

export const BODY_HAIR_GUIDE = {
  overview: 'Body hair management is a personal choice with significant cultural variation. South Asian, Arab, and Mediterranean women often have more visible body hair than Northern European women — this is genetic and entirely normal. Cultural expectations vary enormously.',

  cultural_context: {
    south_asian: 'Body hair removal (threading, waxing, epilating) is deeply embedded in South Asian beauty culture. Pre-wedding hair removal rituals (including full body wax or threading) are standard.',
    arab: 'Halawa (sugar wax) is the traditional Middle Eastern hair removal method — dating to ancient Egypt. Used on face, body, and pubic area.',
    west_african: 'Hair removal practices vary significantly by community and individual preference.',
    east_asian: 'Less body hair is common genetically across East Asian populations. Where body hair removal is practiced, it\'s typically for legs and underarms.',
    latin: 'Hair removal culture strong — waxing common across Latin American communities.',
  },

  methods_comparison: {
    shaving: {
      pros: 'Accessible, cheap, painless',
      cons: 'Hair grows back quickly (1-3 days), risk of razor burn and ingrown hairs (especially for curly hair), no reduction in hair growth',
      ethnic_skin_risk: 'VERY HIGH INGROWN HAIR RISK for curly-hair communities (Black, Arab, South Asian, Latina). Curly hair curls back into skin as it grows = ingrown. This is the dominant body hair removal challenge for ethnic communities.',
      to_reduce_ingrowns: [
        'Single-blade razor (less drag than multi-blade)',
        'Shave WITH the grain of hair growth (not against)',
        'Always with shaving cream or body wash, never dry',
        'Exfoliate area 24h before shaving',
        'Apply AHA lotion or salicylic acid to area after shaving',
      ],
    },
    waxing: {
      pros: 'Smoother finish (removes from root), hair-free for 3-6 weeks',
      cons: 'Painful (especially first time), risk of ingrown hairs, skin irritation, PIH on darker skin if done wrong',
      ethnic_skin_note: 'Waxing creates trauma to the follicle area — on darker skin, this can trigger PIH at the site of each hair follicle. This is manageable with proper aftercare.',
      aftercare: [
        'No tight clothing for 24h post-wax',
        'No heat (hot bath, sun, exercise) for 24h',
        'Apply aloe vera gel immediately after',
        'Begin exfoliating (gentle) after 48h',
        'If PIH develops: AHA lotion + niacinamide on the area',
      ],
      halawa_sugar_wax: {
        what: 'Traditional Middle Eastern hair removal — hot sugar, lemon, and water wax applied against hair growth direction and pulled with the grain',
        advantages_over_wax: 'Water-soluble (rinses easily), less risk of burning, skin not pulled as harshly, often gentler than traditional wax',
        diy_recipe: ['2 cups white sugar', '1/4 cup lemon juice', '1/4 cup water', 'Cook to soft ball stage (240°F/115°C)'],
      },
    },
    threading: {
      what: 'Twisted cotton thread used to trap and pull individual hairs from the root',
      best_for: 'Facial hair (brows, upper lip, sideburns)',
      pros: 'Very precise, no chemicals, no heat risk, fast on small areas',
      cons: 'Less practical for large body areas (legs, underarms)',
      ethnic_origin: 'Persian/Iranian origin — spread throughout Middle East, South Asia, East Asia, and globally',
    },
    epilating: {
      what: 'Mechanical device with rotating tweezers that grabs and removes hair from root',
      pros: 'At-home, long-lasting like waxing (4-6 weeks), can use on large body areas',
      cons: 'Painful for first use, significant risk of ingrown hairs for curly hair types',
    },
    laser_hair_removal: {
      what: 'Laser targets melanin in the hair follicle, destroying the follicle over multiple sessions',
      results: 'Permanent hair REDUCTION (not 100% elimination) — typically 70-90% reduction',
      number_of_sessions: '6-12 sessions required, spaced 4-6 weeks apart',
      important_for_ethnic_skin: {
        issue: 'TRADITIONAL Nd:YAG and diode lasers can cause burns and PIH on darker skin because the laser targets melanin — and darker skin has more melanin to accidentally target',
        safe_option: 'Nd:YAG long-pulse laser is safest for darker skin — the longer wavelength targets the hair follicle melanin without damaging surrounding skin',
        seek: 'A board-certified dermatologist or certified laser specialist with SPECIFIC EXPERIENCE treating Fitzpatrick IV-VI skin',
        ask: 'Ask specifically: "What laser do you use on darker skin?" and "How many patients with my skin tone have you treated?"',
        avoid: 'IPL (Intense Pulsed Light) is NOT safe for dark skin — much higher risk of burns and PIH',
      },
    },
    depilatory_creams: {
      what: 'Chemical creams (thioglycolate-based) that dissolve the hair shaft above the skin',
      pros: 'Painless, accessible, fast',
      cons: 'Strong smell, can cause chemical burns if left too long or on sensitive areas, hair grows back quickly',
      ethnic_skin_note: 'Test on small area first — some dark-skinned individuals have more sensitive skin reactions to depilatories. Follow timing instructions EXACTLY.',
    },
  },

  ingrown_hair_treatment: {
    what_they_are: 'Hair that grows back into the skin rather than out — common with curly hair types as the curl turns back',
    who_most_affected: 'Black, Arab, and South Asian communities have the highest rates due to naturally curly hair growth patterns',
    treatment: [
      'Warm compress on the area to soften the skin',
      'Gentle exfoliation with AHA or physical exfoliant',
      'Salicylic acid applied to the area (loosens the follicle)',
      'A sterile needle to GENTLY lift (not dig) the hair tip out of the skin — do not squeeze',
      'Niacinamide or tranexamic acid for PIH left behind',
    ],
    prevention: [
      'Exfoliate before and after hair removal',
      'Salicylic acid body wash or lotion after hair removal sessions',
      'Switch hair removal method — laser permanently reduces ingrowns',
    ],
    pseudofolliculitis_barbae: 'The clinical name for beard area ingrowns — particularly common in Black men after shaving. Same treatment principle: the curly beard hair curls back into skin. For severe cases, a dermatologist can prescribe topical retinoids, eflornithine cream, or recommend laser hair removal.',
  },
};

// ─── FEET CARE ────────────────────────────────────────────────────────────────

export const FEET_CARE = {
  why_important: 'Feet carry our body weight every day. In many cultures, well-maintained feet are a point of pride — summer sandals, open-toe wedding shoes, or the religious practice of removing shoes before entering homes and places of worship all put feet on display.',

  cracked_heels: {
    what: 'Dry, thick, cracked heel skin — can range from cosmetic to painful and prone to infection',
    why: 'The heel has no sebaceous glands — it cannot self-moisturise. Heel skin thickens as a protective response to pressure. Without moisture, it cracks.',
    treatment: [
      'Soak feet in warm water 10-15 minutes to soften thick skin',
      'Use a pumice stone or foot file to manually remove thick skin — do not over-do this',
      'Apply a very thick emollient immediately — urea-based foot cream (20-40% urea) is the gold standard',
      'Put on cotton socks and leave overnight',
      'Do this nightly until resolved, then weekly for maintenance',
    ],
    recommended: ['O\'Keeffe\'s Working Feet Cream', 'CeraVe Renewing SA Foot Cream', 'Flexitol Heel Balm', 'Any 20-40% urea foot cream'],
    severe_cracks: 'If cracks are deep enough to bleed or are painful, see a podiatrist. Very severe cracked heels can be a sign of thyroid issues or vitamin deficiency.',
  },

  cultural_foot_care: {
    south_asian: 'Feet are sacred in South Asian culture — they are touched as a sign of respect (touching the feet of elders), and brides\' feet are particularly adorned with mehndi (henna) during weddings. Well-maintained feet are therefore culturally important.',
    foot_mehndi: 'Bridal henna includes elaborate foot patterns — the sole and top of the foot, up the ankle and lower leg. Requires especially smooth, exfoliated skin to absorb and show well.',
    arab: 'Hammam tradition includes foot care — pumice stone scrubbing and oil treatment. Henna on feet is also common for celebrations.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getBodyCareForCommunity(communityId) {
  return {
    communitySpecific: BODY_MOISTURISING.ethnic_community_body_care[communityId] || null,
    exfoliationGuide: BODY_EXFOLIATION,
    moisturisingGuide: BODY_MOISTURISING,
    hyperpigmentationGuide: BODY_HYPERPIGMENTATION,
    hairGuide: BODY_HAIR_GUIDE,
  };
}

export function getKPGuide() {
  return KERATOSIS_PILARIS;
}

export function getStretchMarkGuide() {
  return BODY_HYPERPIGMENTATION.stretch_marks;
}

export function getBodyHairGuide(method) {
  return BODY_HAIR_GUIDE.methods_comparison[method] || BODY_HAIR_GUIDE;
}

export function getFeetCareGuide() {
  return FEET_CARE;
}

export function getIngrowHairGuide() {
  return BODY_HAIR_GUIDE.ingrown_hair_treatment;
}

export const BODY_CARE_STATS = {
  exfoliationMethods: Object.keys(BODY_EXFOLIATION.physical_exfoliation).length,
  hyperpigmentationAreas: Object.keys(BODY_HYPERPIGMENTATION).length,
  hairRemovalMethods: Object.keys(BODY_HAIR_GUIDE.methods_comparison).length,
  communitiesWithBodyCareNotes: Object.keys(BODY_MOISTURISING.ethnic_community_body_care).length,
};
