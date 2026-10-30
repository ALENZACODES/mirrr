/**
 * MIRRR Skin Typing Guide
 * Baumann Skin Type System, Fitzpatrick Scale, Glogau photoaging,
 * seasonal skin changes, and skin-of-colour typing traditions
 */

// ─── FITZPATRICK SCALE ───────────────────────────────────────────────────────

export const FITZPATRICK_SCALE = {
  overview: 'The Fitzpatrick Skin Type Scale (FST) was developed by Harvard dermatologist Thomas Fitzpatrick in 1975. It classifies human skin colour based on the amount of melanin pigment in the skin and the response of skin type to ultraviolet (UV) light. Originally designed for sun-reaction prediction, it is now widely used in medical aesthetics, laser settings, and product formulation.',
  types: {
    I: {
      scale: 'Fitzpatrick I',
      description: 'Very fair/pale white skin. Always burns, never tans.',
      hair: 'Usually blonde or red',
      eyes: 'Usually blue or green',
      ethnicity: 'Commonly Northern European (Irish, Scottish, Nordic, Baltic)',
      UV_risk: 'Extremely high risk for sunburn and skin cancer. Needs SPF 30-50+ daily, reapplied every 2 hours in direct sun.',
      common_concerns: ['Redness and rosacea', 'Freckles', 'Spider veins', 'Premature photoaging'],
    },
    II: {
      scale: 'Fitzpatrick II',
      description: 'Fair skin. Usually burns, sometimes tans.',
      hair: 'Usually blonde, light brown, or red',
      eyes: 'Usually blue, green, or grey',
      ethnicity: 'Northern and Western European',
      UV_risk: 'Very high. SPF 30+ daily mandatory.',
      common_concerns: ['Sunburn', 'Freckles', 'Uneven pigmentation', 'Early wrinkles'],
    },
    III: {
      scale: 'Fitzpatrick III',
      description: 'Medium/olive skin. Sometimes burns, usually tans.',
      hair: 'Brown or dark',
      eyes: 'Brown, hazel, or grey',
      ethnicity: 'Southern European, some East Asian, some Latin American, some Middle Eastern',
      UV_risk: 'Moderate. SPF 30 daily minimum.',
      common_concerns: ['PIH (Post-Inflammatory Hyperpigmentation)', 'Melasma', 'Hyperpigmentation from acne'],
    },
    IV: {
      scale: 'Fitzpatrick IV',
      description: 'Olive to light brown skin. Rarely burns, tans easily.',
      hair: 'Dark brown or black',
      eyes: 'Dark brown',
      ethnicity: 'Mediterranean, Middle Eastern, South Asian (lighter tones), East Asian, Latin American (mestizo)',
      UV_risk: 'Lower than I-III but still significant. SPF 30+ recommended. PIH risk from UV.',
      common_concerns: ['PIH', 'Melasma', 'Dark spots from acne or injury', 'Keloid tendency begins here'],
      special_note: 'Begins the range where many cosmetic procedures (laser, chemical peels) need adjusting for deeper skin. Standard peel strengths and most laser types (IPL, ablative CO2) can cause PIH or hypopigmentation.',
    },
    V: {
      scale: 'Fitzpatrick V',
      description: 'Brown skin. Very rarely burns, tans very easily.',
      hair: 'Black',
      eyes: 'Dark brown or black',
      ethnicity: 'South Asian (darker tones), Middle Eastern (darker tones), Latin American, some Southeast Asian, East African, West African (lighter tones)',
      UV_risk: 'Lower sunburn risk but NOT zero. PIH from UV exposure common. SPF still required.',
      common_concerns: ['PIH (very common)', 'Keloids', 'Ashy appearance from dryness', 'Melasma', 'Even skin tone maintenance'],
      special_note: 'Home IPL hair removal is NOT safe for Fitzpatrick V (see skincare devices guide). Nd:YAG 1064nm is the appropriate laser for any laser treatment at this type.',
    },
    VI: {
      scale: 'Fitzpatrick VI',
      description: 'Dark brown to deeply pigmented skin. Never burns.',
      hair: 'Black',
      eyes: 'Black or very dark brown',
      ethnicity: 'West African, Central African, East African (many groups), South Asian (darkest tones), African American, Afro-Caribbean',
      UV_risk: 'Very low sunburn risk. HOWEVER: still needs SPF for PIH prevention and skin cancer protection (skin cancer in dark skin, though rarer, is more often diagnosed late and in worse prognosis). Acral lentiginous melanoma (most common in dark skin) occurs on palms/soles/under nails — not UV-related.',
      common_concerns: ['PIH (extremely common, severe and long-lasting)', 'Keloids (highest risk)', 'Ashy skin (TEWL)', 'Deep dark spots from acne/injury', 'Vitiligo visibility'],
      special_note: 'Plasma pens are CATASTROPHIC for Fitzpatrick VI — cause severe scarring. Most ablative lasers are dangerous. Nd:YAG 1064nm only for laser procedures. Very cautious approach to chemical peels (mandelic acid > glycolic for this type).',
    },
  },
  for_beauty: {
    foundation: 'Fitzpatrick I-III: cool-toned foundations often preferred. Fitzpatrick IV-VI: warm/neutral undertones, never grey-beige. Undertone is separate from depth — a Fitzpatrick VI person can be cool, neutral, or warm-toned.',
    SPF: 'All Fitzpatrick types need SPF. Fitzpatrick V-VI often need mineral-tinted SPF or chemical SPF to avoid white cast.',
    peels: 'Professional chemical peels should be dosed down for Fitzpatrick IV+ and use safer acid types (mandelic, azelaic, lactic) before glycolic or TCA.',
    lasers: 'IPL: Fitzpatrick I-III safe; Fitzpatrick IV proceed with caution; Fitzpatrick V-VI NOT safe. Nd:YAG 1064nm: safe for ALL Fitzpatrick types.',
  },
};

// ─── BAUMANN SKIN TYPE SYSTEM ────────────────────────────────────────────────

export const BAUMANN_SKIN_TYPES = {
  overview: 'The Baumann Skin Type System (Dr. Leslie Baumann, University of Miami) classifies skin along 4 axes, producing 16 possible skin types. It is more nuanced than the simple "oily/dry/combination/normal" system used historically.',
  axes: {
    oil_dry: {
      name: 'Oil vs. Dry (O vs. D)',
      description: 'How much sebum the skin produces.',
      oily: 'Enlarged pores, frequent shine, prone to breakouts. Benefits from niacinamide, BHAs (salicylic acid), lightweight non-comedogenic moisturisers.',
      dry: 'Tight feeling, no shine, flaking, fine lines emphasised. Benefits from ceramides, hyaluronic acid, fatty acids, occlusive moisturisers.',
      combination: 'Not an official Baumann category but captured across the 4 axes — T-zone oily (O score) with dry cheeks (D score in that area).',
    },
    sensitive_resistant: {
      name: 'Sensitive vs. Resistant (S vs. R)',
      description: 'How easily the skin reacts to ingredients, products, or environmental factors.',
      sensitive_subtypes: {
        acne: 'Prone to comedones (blackheads/whiteheads) and inflammatory acne. Avoid comedogenic ingredients (coconut oil, lanolin, heavy silicones).',
        rosacea: 'Flushing, persistent redness, telangiectasia (spider veins). Avoid triggers: alcohol, spice, heat, fragrance, SLS. Niacinamide, azelaic acid, centella asiatica help.',
        burning_stinging: 'Feels burning or stinging with many products including water. Damaged skin barrier. Needs gentle ceramide-based repair.',
        contact_allergies: 'True allergic reactions to specific ingredients (fragrance, preservatives like methylisothiazolinone). Patch testing essential.',
      },
      resistant: 'Tolerates most products without reaction. Can use potent actives without issue.',
    },
    pigmented_non_pigmented: {
      name: 'Pigmented vs. Non-Pigmented (P vs. N)',
      description: 'Tendency to develop dark spots, melasma, or PIH.',
      pigmented: 'Produces excess melanin in response to inflammation, UV, or hormonal triggers. Needs melanin-inhibiting actives (vitamin C, arbutin, kojic acid, niacinamide, azelaic acid), strict SPF use.',
      non_pigmented: 'Even-toned skin with less tendency to hyperpigmentation. Still needs SPF for photoaging prevention.',
      ethnic_note: 'Fitzpatrick III-VI are statistically more likely to be Baumann "P" (pigmented). This is not absolute — every individual varies — but it means hyperpigmentation-focused routines are disproportionately relevant for dark skin.',
    },
    tight_wrinkle_prone: {
      name: 'Tight vs. Wrinkle-Prone (T vs. W)',
      description: 'Rate of visible photoaging and wrinkle formation.',
      tight: 'Skin ages slowly. Usually oilier skin types. Benefits from antioxidants and SPF for maintenance.',
      wrinkle_prone: 'Forms fine lines and wrinkles earlier. Needs retinoids, peptides, antioxidants, collagen-support ingredients. SPF essential.',
      ethnic_note: '"Black don\'t crack" — a cultural expression with dermatological basis. Melanin offers some UV protection; oilier skin types (more common in some ethnic groups) age more slowly; and the structure of melanocyte activity in deeper skin types provides some photoprotection. HOWEVER: Fitzpatrick V-VI can still develop wrinkles, especially with unprotected sun exposure and smoking. SPF is still recommended.',
    },
  },
  sixteen_types: 'Combining O/D, S/R, P/N, T/W produces 16 types: OSPT, OSPW, OSNT, OSNW, ORPT, ORPW, ORNT, ORNW, DSPT, DSPW, DSNT, DSNW, DRPT, DRPW, DRNT, DRNW.',
  most_common: {
    ORPW: 'Oily, Resistant, Pigmented, Wrinkle-prone — common in South Asian, Middle Eastern, and Southeast Asian skin. Needs melanin inhibitors and anti-aging actives.',
    DSNT: 'Dry, Sensitive, Non-pigmented, Tight — common in Northern European skin. Needs gentle barrier repair.',
    OSNT: 'Oily, Sensitive, Non-pigmented, Tight — classic acne-prone teen skin.',
  },
};

// ─── GLOGAU PHOTOAGING CLASSIFICATION ────────────────────────────────────────

export const GLOGAU_PHOTOAGING = {
  overview: 'The Glogau Photoaging Classification (Dr. Richard Glogau) describes degrees of photoaging from UV exposure. Used by dermatologists and aestheticians to assess treatment needs.',
  types: {
    type_1: {
      classification: 'Glogau Type I — Mild (Age 20s-30s)',
      features: 'No wrinkles at rest. Early changes: fine texture, no keratoses. Little to no makeup worn.',
      treatment: 'Prevention: SPF, antioxidants (vitamin C), mild retinol.',
    },
    type_2: {
      classification: 'Glogau Type II — Moderate (Age 30s-40s)',
      features: 'Wrinkles in motion (expression lines). Early actinic keratoses. Wearing some foundation.',
      treatment: 'SPF mandatory. Retinoids (tretinoin). Chemical exfoliation (AHAs). Laser or peel options.',
    },
    type_3: {
      classification: 'Glogau Type III — Advanced (Age 50s)',
      features: 'Wrinkles at rest. Skin discoloration. Actinic keratoses. Wears foundation always.',
      treatment: 'Medical-grade retinoids. Filler + toxin. Professional peels. Laser resurfacing.',
    },
    type_4: {
      classification: 'Glogau Type IV — Severe (Age 60s-70s)',
      features: 'All wrinkles, no normal skin visible. Solar keratoses and cancers possible. Makeup cakes or cannot be worn.',
      treatment: 'Surgical and intensive medical interventions. Ablative laser resurfacing.',
    },
  },
  ethnic_note: 'Dark skin types are often 1-2 Glogau classifications younger-appearing for the same chronological age. This is partially protective melanin, partially epidermal structure. HOWEVER: without sun protection, dark skin can still photoage — and PIH from sun damage complicates the picture in dark skin more than in fair skin.',
};

// ─── SEASONAL SKIN CHANGES ────────────────────────────────────────────────────

export const SEASONAL_SKIN_CHANGES = {
  overview: 'Skin is the body\'s largest organ and directly exposed to the environment. Temperature, humidity, UV index, wind, and indoor heating/cooling all affect skin behaviour significantly — and the appropriate skincare changes with them.',
  spring: {
    season: 'Spring',
    environmental_changes: 'Temperature rising; humidity increasing; UV index rising; possible allergens (pollen, wind).',
    skin_effects: 'Skin transitioning from winter dryness to oilier behaviour. Breakouts possible as sebum production increases. Allergy-related skin flares.',
    routine_adjustments: [
      'Gradually introduce lighter moisturisers as weather warms.',
      'Increase SPF as UV rises.',
      'Introduce antioxidants (vitamin C) to address UV exposure.',
      'Address winter residual dryness/flaking — light chemical exfoliation (AHA).',
      'Allergy sufferers: focus on barrier repair (ceramides) to prevent eczema and contact dermatitis flares from pollen.',
    ],
    TEWL: 'TEWL (transepidermal water loss) remains elevated in early spring as the barrier recovers from winter. Ceramide-rich moisturisers still needed.',
  },
  summer: {
    season: 'Summer',
    environmental_changes: 'High UV index; high humidity (most climates); heat and sweating; pool/sea exposure; prolonged outdoor time.',
    skin_effects: 'Increased sebum production; increased sweating; possible miliaria (heat rash); chlorine and salt water drying; high UV = hyperpigmentation risk.',
    routine_adjustments: [
      'Lightweight non-comedogenic moisturiser.',
      'SPF 30-50+ mandatory, reapplied every 2 hours in direct sun.',
      'Reduce heavy occlusives and butters on the face.',
      'Gentle foaming cleanser for sweat and sunscreen removal (double cleanse).',
      'Vitamin C serum morning: antioxidant support against UV damage.',
      'Reduce or pause retinoids (increase UV sensitivity). Some continue with adjusted application (evenings, with SPF next morning — consistent approach).',
    ],
    chlorine_note: 'Chlorine is an oxidiser that strips skin barrier lipids. Rinse immediately after swimming; apply moisturiser promptly.',
    dark_skin_note: 'Fitzpatrick IV-VI: hyperpigmentation from UV exposure compounds existing PIH. Summer SPF compliance is critical. Chemical SPF or tinted mineral SPF avoids white cast while providing protection.',
  },
  autumn: {
    season: 'Autumn/Fall',
    environmental_changes: 'Temperature dropping; humidity decreasing; UV index dropping; indoor heating starting.',
    skin_effects: 'TEWL begins to increase as humidity drops and indoor heating dries air. Skin may feel tighter and drier than in summer. Barrier function begins to decline.',
    routine_adjustments: [
      'Transition to a richer moisturiser.',
      'Add a facial oil or occlusive layer in the evening.',
      'Introduce or reinstate retinoids (lower UV means lower photosensitivity risk).',
      'Humidifier in bedroom if in a very dry climate.',
      'Maintain SPF — UV still causes damage in autumn, especially UVA (glass-penetrating).',
      'Focus on repairing any summer hyperpigmentation: vitamin C, niacinamide, azelaic acid.',
    ],
  },
  winter: {
    season: 'Winter',
    environmental_changes: 'Cold temperatures; very low outdoor humidity; high indoor heating causing very dry air; UVB low but UVA still present.',
    skin_effects: 'Significant TEWL increase. Dry, tight, flaky skin. Eczema and psoriasis flares. Keratosis pilaris ("chicken skin" on arms/thighs) worsens. Cold-induced redness.',
    routine_adjustments: [
      'Richest moisturiser of the year. Ceramides, fatty acids, occlusive agents (squalane, shea butter, petrolatum as a final layer — slugging).',
      'Avoid harsh foaming cleansers — use cream or oil cleansers.',
      'Slugging (petrolatum as final overnight occlusive) for very dry skin — originated in Black/Caribbean communities.',
      'Continue retinoids in winter (UV is lower, barrier needs support).',
      'SPF still needed for UVA protection (glass and clouds do not block UVA). Cream formula SPF more comfortable in cold weather.',
      'Barrier repair: avoid AHAs and BHAs if skin is compromised (flaking, stinging). Resume when barrier is restored.',
    ],
    TEWL: 'TEWL is highest in winter. The skin barrier must be actively maintained. Ceramide and fatty acid-rich products are the most important product category of the year.',
    humidifier: 'A bedroom humidifier (target 40-50% relative humidity) dramatically reduces skin TEWL overnight. One of the highest-impact low-cost interventions for dry winter skin.',
  },
};

// ─── HORMONAL SKIN CYCLES ─────────────────────────────────────────────────────

export const HORMONAL_SKIN_CYCLES = {
  overview: 'Hormones affect skin directly. Understanding the cyclical hormonal changes can help predict and manage skin behaviour proactively.',
  menstrual_cycle_skin: {
    week_1_menstruation: 'Oestrogen and progesterone both low. Skin may be dull, sensitive, or prone to dryness. Prostaglandins (inflammation mediators during menstruation) can worsen inflammatory skin conditions.',
    week_2_follicular: 'Oestrogen rising. Skin looks best — glowing, even, less oily. Collagen production supported by oestrogen. Best time for treatments and new products.',
    week_3_ovulation: 'Oestrogen peaks then drops; testosterone peaks slightly. Some experience increased shine or the beginning of pre-menstrual breakouts.',
    week_4_luteal: 'Progesterone rising → increases sebum production → pore blockage → pre-menstrual acne. Skin may look puffier (water retention). Congestion in chin and jaw (hormonal acne zone). Best time to increase salicylic acid use for pre-menstrual breakout prevention.',
  },
  pregnancy: 'See pregnancy beauty guide module.',
  menopause: 'See mature beauty guide module.',
  puberty: 'Androgens (testosterone equivalent) surge → sebaceous gland activity increases dramatically → acne very common. See teen beauty guide module.',
};

// ─── ETHNIC SKIN TYPE TRADITIONS ──────────────────────────────────────────────

export const ETHNIC_SKIN_TYPING_TRADITIONS = {
  west_african: {
    community: 'West African',
    skin_profile: 'Predominantly Fitzpatrick V-VI. High oil production. Common concerns: PIH, keloids, ashy skin (visible TEWL/dryness), ingrown hairs. Skin is generally Baumann-Oily and Baumann-Pigmented.',
    traditional_assessment: 'Skin condition assessed by touch, sheen, and colour evenness. "Ash" (whitish or grey cast from dryness and dead cell buildup) is considered a sign of neglect and addressed immediately with rich moisturisers and body butters.',
    skincare_philosophy: 'Deep moisture and even tone are primary beauty goals. Shea butter (karite) is the foundational ingredient. Black soap (ose dudu) used for cleansing — note: pH can run alkaline, so monitor barrier response.',
  },
  south_asian: {
    community: 'South Asian',
    skin_profile: 'Fitzpatrick III-V. Wide range. Higher rates of melasma (hormonal pigmentation), PIH from acne. Hyperpigmentation around mouth and under eyes common. Oilier skin types prevalent in South Asian populations.',
    traditional_assessment: 'Skin tone fairness historically overly valued (colourism). "Glowing" complexion (chamak) prioritised. Skin should be hydrated, clear, and bright.',
    ayurvedic_skin_typing: {
      vata: 'Thin, dry, delicate, prone to premature aging. Benefits from heavy moisture and oil-based products.',
      pitta: 'Sensitive, combination, prone to redness, inflammation, and breakouts. Cooling ingredients (aloe, rose, sandalwood).',
      kapha: 'Oily, thick, prone to congestion. Benefits from lighter products, clay, and exfoliation.',
    },
  },
  caribbean: {
    community: 'Caribbean',
    skin_profile: 'Predominantly Fitzpatrick IV-VI. PIH from acne common. Keloid tendency. Hyperpigmentation from sun exposure.',
    traditional_assessment: 'Skin should be smooth, glowing, and even-toned. "Clear skin" is a beauty priority in Caribbean communities.',
    practices: 'Coconut oil historically used for everything. Sea salt and sand exfoliation traditional. Traditional herbs like aloe vera, turmeric, and coconut are widely used.',
  },
  arab: {
    community: 'Arab',
    skin_profile: 'Fitzpatrick III-V predominantly. Melasma very common. Oiliness in T-zone. PIH from sun exposure in the harsh desert/Mediterranean climates.',
    traditional_assessment: 'Skin should be radiant, luminous, and flawless. Even tone and glow are traditional beauty ideals.',
    practices: 'Rose water for toning and hydration. Argan oil for moisture. Rhassoul clay for cleansing. Black seed oil increasingly studied for anti-inflammatory properties.',
  },
  latina: {
    community: 'Latina',
    skin_profile: 'Varies widely — Fitzpatrick II-VI depending on heritage. Melasma very common (especially in those with Indigenous heritage). PIH from acne common.',
    traditional_assessment: 'Skin should be clear and radiant. Protection from the sun important in outdoor-activity-heavy cultures.',
    practices: 'Aloe vera widely used. Avocado and honey home treatments. Agua de rosas (rose water) for toning.',
  },
  east_asian: {
    community: 'East Asian',
    skin_profile: 'Fitzpatrick II-IV primarily. Minimal androgenic activity can mean less acne in some populations. Melasma risk. PIH risk at Fitzpatrick III-IV. Skin tends to be more resistant (Baumann-R).',
    traditional_assessment: '"Glass skin" — pore-minimised, luminous, even, hydrated skin is the aesthetic ideal. Skin should look lit from within with no visible texture.',
    skin_type_language: 'In Korean beauty: skin types described by texture and water-oil balance. Japanese beauty: emphasis on age-appropriate, refined skin rather than a specific "look".',
  },
  east_african: {
    community: 'East African',
    skin_profile: 'Fitzpatrick V-VI. PIH common. Some populations have distinct skin profiles — Ethiopian skin often cited for resilience.',
    traditional_assessment: 'Smooth, even skin is prized. Teff-based skincare; natural oils (argan, rose hip) used in North African influenced communities.',
  },
  south_african: {
    community: 'South African',
    skin_profile: 'Wide range — Fitzpatrick II-VI depending on heritage. High UV environment → significant sun damage risk across all types. San populations: Fitzpatrick III-IV historically. Zulu/Xhosa: Fitzpatrick V-VI.',
    traditional_assessment: 'Skin health and glow prioritised. Marula oil is a traditional ingredient with exceptional oleic acid profile for dry skin support.',
  },
  black_american: {
    community: 'Black American',
    skin_profile: 'Predominantly Fitzpatrick V-VI. PIH from acne is one of the most common concerns. Keloid formation risk elevated. CCCA and traction alopecia affect scalp skin (see hair growth science module).',
    traditional_assessment: '"Melanin-rich skin" celebrated. Even tone valued. "Ashy" skin (visible dryness) is socially noticed — deep moisturisation is a cultural norm.',
    practices: 'Cocoa butter, shea butter, and petroleum jelly (Vaseline) are cornerstones of Black American skincare. Slugging (Vaseline as final PM step) has been practiced in Black communities for generations before the term was coined online.',
    colourism: 'Colourism remains a significant issue in Black American beauty culture. The community is increasingly rejecting anti-dark-skin bias and celebrating the full spectrum of melanin-rich skin tones.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getFitzpatrickType(type) {
  return FITZPATRICK_SCALE.types[type] || FITZPATRICK_SCALE;
}
export function getFitzpatrickForBeauty() { return FITZPATRICK_SCALE.for_beauty; }
export function getBaumannAxis(axis) {
  return BAUMANN_SKIN_TYPES.axes[axis] || BAUMANN_SKIN_TYPES;
}
export function getGlogauType(type) {
  return GLOGAU_PHOTOAGING.types[`type_${type}`] || GLOGAU_PHOTOAGING;
}
export function getSeasonalSkinGuide(season) {
  return SEASONAL_SKIN_CHANGES[season?.toLowerCase()] || SEASONAL_SKIN_CHANGES;
}
export function getHormonalCycle() { return HORMONAL_SKIN_CYCLES; }
export function getEthnicSkinTyping(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_SKIN_TYPING_TRADITIONS[key] || Object.values(ETHNIC_SKIN_TYPING_TRADITIONS);
}

export const SKIN_TYPING_STATS = {
  fitzpatrickTypes: 6,
  baumannAxes: 4,
  baumannTotalTypes: 16,
  glogauStages: 4,
  seasons: 4,
  ethnicCommunities: 9,
};
