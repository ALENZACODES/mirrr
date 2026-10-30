/**
 * MIRRR Menopause & Perimenopause Beauty Guide
 * Skin and hair changes with hormonal shifts across ethnic communities
 * Evidence-based beauty solutions for hormonal transitions
 */

// ─── UNDERSTANDING THE HORMONAL TRANSITION ────────────────────────────────────

export const MENOPAUSE_OVERVIEW = {
  phases: {
    perimenopause: {
      what: 'The transitional period before menopause — can begin as early as the mid-30s or 40s and lasts 4-10 years. Oestrogen and progesterone levels begin fluctuating.',
      symptoms_relevant_to_beauty: ['Irregular periods', 'Skin changes', 'Hair thinning', 'Weight redistribution', 'Hot flushes (affect skin)'],
    },
    menopause: {
      what: 'Defined as 12 consecutive months without a menstrual period. Average age 51 in Western populations.',
      
    },
    postmenopause: {
      what: 'All years after the 12-month menopause marker',
      
    },
  },

  ethnic_differences_in_timing: {
    
    vasomotor_symptoms: 'In the US SWAN study, Black women reported more severe and more frequent hot flushes and night sweats than white women on average. Japanese-American women reported the fewest. Cultural reporting differences and biological differences are both factors.',
    bone_health: 'Black women have higher bone density at baseline but still experience menopausal bone loss — and are at higher risk for osteoporosis-related fractures than previously believed. Vitamin D (often lower in dark-skinned individuals in low-sun climates) is critical.',
  },
};

// ─── SKIN CHANGES IN MENOPAUSE ────────────────────────────────────────────────

export const MENOPAUSAL_SKIN_CHANGES = {
  collagen_loss: {
    
    appearance: 'Skin appears thinner, more crepe-like, less firm. Fine lines deepen. Loss of facial volume (fat and bone also change under hormonal influence).',
    for_ethnic_skin: {
      good_news: 'Higher baseline collagen density and melanin content in Fitzpatrick IV-VI skin means these changes may appear more slowly — the observation that "Black don\'t crack" has some biological basis in collagen density differences, though this advantage does not eliminate the changes.',
      still_happens: 'Collagen loss during menopause still occurs in all skin tones — the timeline may differ but the process is the same.',
    },
  },

  dryness: {
    what: 'Oestrogen plays a critical role in skin hydration — it stimulates production of hyaluronic acid, ceramides, and natural moisturising factors in the skin. As oestrogen falls, skin loses much of its natural moisture-holding capacity.',
    appearance: 'Skin that was previously oily or normal-oily often becomes normal or dry. Previously dry skin becomes very dry or dehydrated.',
    vaginal_and_body: 'The same drying effect occurs throughout the body — vaginal dryness is common but so is mouth dryness, eye dryness, and full-body skin dryness.',
    treatment: [
      'Switch to richer, cream-based moisturisers',
      'Add hyaluronic acid serum under moisturiser',
      'Ceramide-containing products become even more important for barrier repair',
      'Face oil as last step in evening routine',
      'Humidifier in sleeping environment',
    ],
  },

  vasomotor_effects_on_skin: {
    what: 'Hot flushes (hot flashes) cause sudden increases in facial blood flow — contributing to flushing, redness, and over time can worsen rosacea or create new rosacea-like symptoms',
    management: [
      'Identifying flush triggers (alcohol, caffeine, spicy food, heat, stress) and managing them',
      'Cooling products: mist sprays, jade roller from refrigerator, cold pressed products',
      'Niacinamide for vascular stability and redness reduction',
      'Azelaic acid for rosacea-component',
      'See a dermatologist if persistent redness develops — rosacea is treatable',
    ],
    note: 'Rosacea is significantly underdiagnosed in darker skin — the redness manifests as uneven tone and warmth rather than the classic red-face presentation in lighter skin.',
  },

  acne_in_perimenopause: {
    what: 'As oestrogen declines relative to androgens during perimenopause, androgen dominance creates hormonal acne — often on the chin, jaw, and neck. Many women who had clear skin for decades experience acne for the first time during perimenopause.',
    why_it_differs_from_teen_acne: 'Perimenopausal acne is predominantly inflammatory — deeper, more cystic, along the lower face. Different from the blackhead-and-whitehead acne of adolescence.',
    treatment: [
      'Niacinamide (anti-inflammatory, sebum-regulating)',
      'Retinol or retinoid (normalises cell turnover, unclogs pores — bonus anti-aging effects)',
      'Azelaic acid (anti-inflammatory, antibacterial)',
      'Spironolactone (oral androgen blocker — prescription, very effective for hormonal acne)',
      'Low-dose birth control or HRT can also reduce hormonal acne',
    ],
    for_ethnic_skin: 'PIH from menopausal acne is a significant concern for Fitzpatrick IV-VI skin. Aggressive treatment of inflammatory acne is particularly important to prevent dark mark formation.',
  },

  pigmentation_changes: {
    existing_hyperpigmentation: 'Melasma that was well-controlled before menopause can change — sometimes improving as oestrogen drops, sometimes worsening. The relationship between oestrogen and melanin production is complex.',
    new_pigmentation: 'Age spots (solar lentigines) accumulate over decades of sun exposure and become more visible. Post-menopausal skin has less melanin production capacity for sun protection, making sun protection even more important.',
    for_ethnic_skin: 'Hyperpigmentation was already a priority concern in darker skin — menopausal changes can exacerbate existing PIH and melasma. Vigilant SPF, brightening actives (niacinamide, vitamin C, tranexamic acid), and if needed retinoids become even more important.',
  },
};

// ─── HAIR CHANGES IN MENOPAUSE ────────────────────────────────────────────────

export const MENOPAUSAL_HAIR_CHANGES = {
  androgenetic_alopecia: {
    what: 'Female pattern hair loss — driven by the relative androgen dominance as oestrogen falls. Hair follicles in androgenetic alopecia are sensitive to DHT (dihydrotestosterone), which causes them to miniaturise over time.',
    pattern: 'In women, hair thinning typically presents as widening part, overall thinning at the crown, and reduced density throughout. Less commonly the receding hairline pattern seen in men.',
    for_ethnic_communities: {
      black_women: 'CCCA (Central Centrifugal Cicatricial Alopecia) may worsen or become more apparent during menopause. Traction alopecia consequences also accumulate. See a dermatologist early if crown thinning develops.',
      south_asian: 'The hair thinning that begins in perimenopause may be confused with or compounded by stress-related telogen effluvium.',
      east_asian: 'Generally lower androgen sensitivity in hair follicles, but hormonal hair loss still occurs with menopause.',
    },
    treatment: [
      
      'Spironolactone (oral androgen blocker — prescription)',
      'Finasteride/dutasteride (off-label use in women — pregnancy contraindication)',
      'PRP (Platelet Rich Plasma) injections into scalp — evidence for hair thickness improvement',
      'Microneedling scalp + minoxidil combination',
      'Low-level laser therapy (LLLT) — FDA-cleared, some evidence',
      'HRT — oestrogen therapy can slow or reverse hormonal hair loss',
    ],
  },

  texture_changes: {
    what: 'Hair texture often changes during menopause — hair that was thick and coarse can become thinner and finer. Curly hair may lose some curl definition.',
    why: 'Oestrogen extends the anagen (growth) phase of the hair cycle. With less oestrogen, hairs spend less time growing and more time in the shedding phase — resulting in finer, shorter individual hairs.',
    for_textured_hair: 'Type 3 and 4 hair may lose some curl definition and elasticity during menopause. Deep conditioning becomes even more important.',
  },

  scalp_dryness: {
    what: 'The same drying effect that occurs on facial skin also affects the scalp — increasing dryness, sensitivity, and sometimes dandruff-like symptoms.',
    treatment: [
      'Switch to gentler, hydrating shampoos',
      'Add scalp oils (jojoba, sweet almond) as part of pre-wash routine',
      'Reduce washing frequency slightly if scalp allows',
      'Scalp massage with warm oil weekly',
    ],
  },
};

// ─── BEAUTY STRATEGIES BY COMMUNITY ──────────────────────────────────────────

export const MENOPAUSAL_BEAUTY_BY_COMMUNITY = {
  south_asian: {
    traditional_approach: {
      ashwagandha: 'Adaptogenic herb used in Ayurveda — some evidence for cortisol reduction and possible mild hormonal support. Available as supplement or tea.',
      
      sesame_oil: 'Sesame oil for body massage (abhyanga) is traditional Ayurvedic self-care — supports skin during hormonal transitions with its rich linoleic acid and sesamin content.',
      turmeric: 'Anti-inflammatory support — relevant because menopausal changes are inflammatory. The curcumin in turmeric has anti-inflammatory properties, best absorbed with black pepper (piperine).',
    },
    skin_priorities: 'If melasma has built up by menopause, vigilant SPF, tranexamic acid, and niacinamide become even more critical.',
    hair: 'Brahmi and bhringraj oils continue to be beneficial for menopausal hair thinning — particularly combined with scalp massage to support circulation.',
  },

  arab: {
    traditional_approach: {
      black_seed_oil: 'Nigella sativa (black seed oil) has some research supporting hormone balance. The thymoquinone content has anti-inflammatory and anti-androgenic properties — potentially relevant for menopausal acne and hair changes.',
      rose_water: 'Rose water (used for centuries in Arab beauty) has mild cooling and anti-inflammatory properties — useful for menopausal flushing and skin sensitivity.',
      hammam: 'The hammam ritual — steam, kessa exfoliation, and oil treatment — is beneficial maintenance for menopausal skin. Steam improves circulation, kessa removes dry dead skin, ghassoul clay treats sebum changes.',
    },
    skin_priorities: 'Olive skin tones can develop olive-tinted discolouration with menopausal pigmentation changes. Azelaic acid and niacinamide help.',
  },

  west_african_black_american: {
    traditional_approach: {
      shea_butter: 'Rich shea butter becomes even more valuable for menopausal skin dryness — the oleic and stearic acid content is excellent for very dry menopausal skin',
      black_soap: 'African black soap (ose dudu / alata samina) is excellent for perimenopausal acne — the ash content provides gentle exfoliation and the plant oils treat acne without over-drying',
      castor_oil: 'Jamaican Black Castor Oil for scalp and thinning edges — continues to be a central hair care tradition worth maintaining through menopause',
    },
    specific_concerns: {
      CCCA: 'Regular dermatology monitoring becomes even more important as CCCA risk and visibility increases with age and the hormonal changes of menopause.',
      keloid: 'Keloid tendency does not improve with menopause. Any procedures (skin resurfacing, etc.) still carry the same keloid risk.',
    },
  },

  east_asian: {
    traditional_approach: {
      ginseng: 'Korean and Chinese herbal traditions use ginseng (red ginseng particularly) for menopausal support — it has some evidence for reducing vasomotor symptoms',
      collagen_food: 'Eating collagen-rich foods (bone broth, certain fish preparations) is a traditional East Asian approach — while dietary collagen\'s direct skin benefit is debated, the tradition continues',
      camellia_oil: 'Tsubaki (camellia) oil for skin and hair — excellent for menopausal dryness in both',
    },
    
  },
};

// ─── SKINCARE ROUTINE FOR MENOPAUSE ───────────────────────────────────────────

export const MENOPAUSE_SKINCARE_ROUTINE = {
  core_principles: [
    'MOISTURE FIRST: the single most impactful change is significantly richer moisturisation',
    'RETINOID: essential for collagen stimulation — now more important than ever. Start if you haven\'t.',
    'SPF: age spots accumulate; menopausal skin has less UV protection — non-negotiable',
    'ACTIVES: targeted ingredients for collagen, pigmentation, and hydration',
  ],

  morning: {
    gentle_cleanser: 'Cream or milk cleanser — oil production decreases with menopause; harsh cleansers worsen dryness',
    vitamin_c_serum: 'Antioxidant protection + collagen stimulation + brightening — triple benefit',
    hyaluronic_acid: 'Before moisturiser — draws moisture to skin surface',
    rich_moisturiser: 'Cream with ceramides and peptides — switch from gel to cream if you haven\'t',
    spf: 'SPF 30-50 broad spectrum, every day',
  },

  evening: {
    thorough_cleanse: 'Remove SPF and day products fully',
    niacinamide: 'Addresses redness, pores, texture, and mild brightening',
    retinoid: {
      what: 'Retinol → retinaldehyde → tretinoin in increasing strength',
      note: 'Tretinoin (prescription) has the most evidence for menopausal skin — collagen stimulation, cell turnover, pigmentation. If not on prescription retinoid, high-percentage retinol (0.5-1%) is the OTC alternative.',
    },
    rich_cream_or_oil: 'Lock in moisture at night. Face oil (marula, rosehip, argan) excellent for menopausal skin.',
    neck_and_chest: 'Extend all products to neck and chest — menopausal collagen loss is visible here too',
  },

  ingredients_to_add: [
    { ingredient: 'Peptides', why: 'Signal skin to produce more collagen, support firmness', product_examples: 'Olay Regenerist, The INKEY List Multi-Peptide' },
    { ingredient: 'Growth factors', why: 'Stimulate cellular renewal, evidence for anti-aging', product_examples: 'SkinMedica TNS, Alastin Restorative Skin Complex' },
    { ingredient: 'Tranexamic acid', why: 'Address menopausal melasma and pigmentation changes', product_examples: 'Murad Rapid Age Spot Correcting Serum, The INKEY List Tranexamic Acid' },
    { ingredient: 'Ceramides', why: 'Repair compromised barrier that occurs with menopausal dryness', product_examples: 'CeraVe, Dr. Jart+ Cicapair' },
  ],
};

// ─── HORMONE REPLACEMENT THERAPY AND SKIN ────────────────────────────────────

export const HRT_SKIN_EFFECTS = {
  disclaimer: 'HRT (Hormone Replacement Therapy) is a medical treatment requiring individualised assessment by a healthcare provider. The following is for informational purposes only.',

  what_hrt_is: 'Oestrogen therapy (with or without progesterone) prescribed to replace declining hormones during menopause. Available as patches, gels, pills, sprays, and other formats.',

  skin_benefits_of_hrt: [
    
    'Improved skin hydration',
    'Reduction of fine lines and wrinkles',
    'Reduced skin dryness',
    'Possible reduction in menopausal acne (through oestrogen/androgen balance)',
    'Improvement in hair quality and density',
  ],

  risks_to_discuss_with_doctor: 'HRT has risks including increased breast cancer risk (particularly oestrogen + progestogen combined therapy), blood clot risk, and others. Individual risk assessment is essential.',

  topical_oestrogen: 'Low-dose topical oestrogen applied to the face is sometimes used by dermatologists in countries where this is permitted — directly improving facial skin collagen and hydration at the site of application. Not widely available but evidence-backed.',
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getMenopauseGuideForCommunity(communityId) {
  const communityGuide = MENOPAUSAL_BEAUTY_BY_COMMUNITY[communityId.replace('-', '_')];
  return {
    communityTraditions: communityGuide || null,
    skinChanges: MENOPAUSAL_SKIN_CHANGES,
    hairChanges: MENOPAUSAL_HAIR_CHANGES,
    routine: MENOPAUSE_SKINCARE_ROUTINE,
  };
}

export function getMenopausalSkinRoutine() {
  return MENOPAUSE_SKINCARE_ROUTINE;
}

export function getHairLossTreatments() {
  return MENOPAUSAL_HAIR_CHANGES.androgenetic_alopecia.treatment;
}

