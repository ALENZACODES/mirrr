/**
 * MIRRR Sensitive Skin & Skin Conditions Guide
 * Eczema, rosacea, psoriasis, perioral dermatitis in ethnic skin
 * Gentle routines, trigger management, and community-specific considerations
 */

// ─── DEFINING SENSITIVE SKIN ──────────────────────────────────────────────────

export const SENSITIVE_SKIN_OVERVIEW = {
  what_is_sensitive_skin: {
    clinical: 'True sensitive skin (clinically defined) is characterised by a compromised skin barrier — the stratum corneum does not effectively retain moisture or exclude irritants. This leads to reactivity, stinging, redness, and discomfort with many products.',
    subjective: 'Many people describe their skin as "sensitive" when they mean reactive or easily irritated. This can be due to: fragrance sensitivity, ingredient allergies, over-exfoliation, compromised barrier from harsh products, or an underlying skin condition.',
    vs_reactive: 'Sensitive skin is structural (barrier weakness). Reactive skin responds excessively to stimuli. Both need gentle care, but reactive skin may improve with barrier repair while truly sensitive skin requires ongoing careful management.',
  },

  causes: [
    'Genetic factors — some people are born with thinner, more permeable skin',
    'Atopic dermatitis (eczema) — the most common cause of truly sensitive skin',
    'Rosacea — a vascular and inflammatory condition creating sensitivity',
    'Contact dermatitis (allergic or irritant)',
    'Compromised skin barrier from over-exfoliation, harsh cleansers, or aggressive treatments',
    'Environmental factors — pollution, hard water',
    'Hormonal changes — perimenopause, pregnancy',
    'Stress — increases cortisol, which can exacerbate skin sensitivity and inflammatory conditions',
  ],

  in_ethnic_skin: {
    note: 'Sensitive skin and skin conditions present differently in darker skin tones — and are often underdiagnosed or misdiagnosed as a result.',
    presentation_differences: [
      'Redness presents as purple/brown/ashy tone rather than the classic "red face" in lighter skin',
      'Inflammation shows as swelling and roughness rather than obvious redness',
      'Eczema patches appear grey or dark purple on dark skin, not the pink/red of light skin images in textbooks',
    ],
    consequence: 'These different presentations mean dermatologists (most trained on images of lighter skin) may not recognise inflammatory conditions in darker skin. Seek dermatologists with experience treating your skin tone.',
  },
};

// ─── ECZEMA (ATOPIC DERMATITIS) ───────────────────────────────────────────────

export const ECZEMA_GUIDE = {
  what: 'Eczema (atopic dermatitis) is a chronic inflammatory skin condition characterised by intense itching, dry skin, and rashes. It results from a defective skin barrier — mutations in the filaggrin gene (which creates the "glue" holding skin cells together) are the most common genetic factor.',

  prevalence_in_ethnic_communities: {
    black_children: 'Atopic dermatitis is significantly more prevalent in Black children than in white children in the US (19.3% vs 12.1% in some studies). Under-treated and under-diagnosed.',
    south_asian: 'High prevalence in South Asian communities, particularly those who have migrated to colder, less humid climates.',
    mechanism: 'Darker-skinned individuals may have different microbiome compositions and filaggrin gene variant prevalence — though research is ongoing. Environmental factors including dry northern climates affecting people from tropical origins play a significant role.',
  },

  presentation_in_dark_skin: {
    appearance: 'On darker skin, eczema patches appear grey, purple, or dark brown — NOT pink/red as in lighter skin. The condition may look ashy, dry, and scaly.',
    flexural_areas: 'Eczema most commonly appears in the creases — inside of elbows, behind knees, neck creases, wrists, ankles.',
    pityriasis_alba: 'A common eczema-related condition in darker skin — pale hypopigmented patches that look like discolouration. Very common in children of colour, often mistaken for fungal infection (tinea versicolor). It\'s actually post-eczema hypopigmentation.',
    follicular_eczema: 'More common in people of African descent — eczema presenting around hair follicles, creating a bumpy texture rather than flat patches.',
    pih_cycle: 'Eczema scratching → skin damage → PIH cycle. The dark marks left after eczema flares are one of the most distressing features for darker-skinned individuals. Treating the eczema promptly reduces scratching and therefore PIH.',
  },

  treatment: {
    first_line: {
      moisturisation: 'The #1 intervention. Apply immediately after bathing (within 3 minutes — "soak and seal" technique) to lock moisture in.',
      emollients: [
        { product: 'Vaseline (petroleum jelly)', note: 'The most evidence-backed occlusive for eczema. Clinical studies show it outperforms many prescription moisturisers for eczema barrier repair.' },
        { product: 'CeraVe Healing Ointment', note: 'Petroleum-based with ceramides added — excellent for severe eczema' },
        { product: 'Aquaphor', note: 'Petroleum with lanolin — excellent healing properties' },
        { product: 'Aveeno Eczema Therapy', note: 'Colloidal oatmeal — excellent for itch relief and mild eczema' },
        { product: 'Cetaphil Restoraderm', note: 'Specifically formulated for eczema-prone skin' },
      ],
    },
    topical_steroids: {
      what: 'Topical corticosteroids are the primary medical treatment for eczema flares — from low-potency hydrocortisone (OTC) to high-potency betamethasone/clobetasol (prescription)',
      for_dark_skin: 'Long-term use of steroids on dark skin can cause BOTH atrophy (skin thinning) AND hypopigmentation or hyperpigmentation. Use under dermatologist supervision and limit high-potency steroids to short flare periods.',
    },
    alternatives_to_steroids: [
      'Tacrolimus (Protopic) ointment — calcineurin inhibitor, no steroid side effects, prescription',
      'Pimecrolimus (Elidel) cream — similar to Protopic, prescription',
      'Crisaborole (Eucrisa) — PDE4 inhibitor, prescription',
      'Dupilumab (Dupixent) — biologic injection for moderate-severe eczema, revolutionary for those who haven\'t responded to topicals',
    ],
    triggers_to_avoid: [
      'Harsh cleansers (use fragrance-free, SLS-free)',
      'Fragrance in skincare and laundry detergent',
      'Wool and synthetic fabrics against skin',
      'Hot showers (lukewarm only)',
      'Stress (management strategies important)',
      'Specific allergens identified through allergy testing',
      'Certain foods (egg, milk, wheat, soy, peanuts common in children with eczema)',
    ],
  },

  eczema_safe_products: {
    cleansers: ['Dove Sensitive Skin bar', 'Cetaphil Gentle Skin Cleanser', 'Vanicream Gentle Facial Cleanser', 'CeraVe Hydrating Cleanser'],
    moisturisers: ['CeraVe Moisturising Cream', 'Cetaphil Moisturising Cream', 'Aveeno Eczema Therapy', 'Eucerin Original Healing'],
    laundry: 'Free & Clear detergent, Seventh Generation Free & Clear, Ecos Free & Clear — no fragrance, dye-free',
  },
};

// ─── ROSACEA IN ETHNIC SKIN ───────────────────────────────────────────────────

export const ROSACEA_GUIDE = {
  what: 'Rosacea is a chronic inflammatory vascular skin condition characterised by facial redness, flushing, visible blood vessels (telangiectasia), and sometimes papules/pustules. It most commonly affects the central face.',

  underdiagnosis_in_ethnic_skin: {
    why: 'Rosacea has historically been described as a "condition of fair-skinned individuals." Dermatology education and images primarily show rosacea on light skin as obvious facial redness. On darker skin, this signature redness is less visible — the condition presents differently and is routinely missed.',
    actual_prevalence: 'Studies suggest rosacea is significantly underdiagnosed and under-treated in people of colour. The condition exists across skin tones but isn\'t being caught.',
  },

  presentation_in_darker_skin: {
    appearance: 'Rosacea on darker skin presents as: warm pinkish-brown or purple tone to skin rather than obvious red flushing; skin that feels hot and looks "dull" during flares; visible papules or pustules without obvious background redness; textural changes; discomfort (stinging, burning).',
    types_most_common: [
      'Papulopustular rosacea (Type 2) — acne-like breakouts on central face. Easier to diagnose than the vascular type in darker skin.',
      'Phymatous rosacea (Type 3) — skin thickening, particularly on the nose (rhinophyma). Also more diagnosable as it\'s structural.',
    ],
    pih: 'Rosacea papules can leave PIH on darker skin — creating dark spots that may be mistaken for acne scarring.',
  },

  treatment: {
    topical: [
      { ingredient: 'Azelaic acid 15-20%', note: 'Excellent for rosacea — anti-inflammatory, reduces redness, addresses papules. Very well-tolerated on darker skin.' },
      { ingredient: 'Metronidazole (Metrogel)', note: 'Prescription antibiotic gel — reduces inflammation and papules. Standard first-line rosacea treatment.' },
      { ingredient: 'Ivermectin 1% (Soolantra)', note: 'Prescription — addresses Demodex mite component of rosacea. Highly effective for papulopustular type.' },
      { ingredient: 'Niacinamide', note: 'OTC — anti-inflammatory, barrier-supporting, reduces redness over time' },
    ],
    oral: [
      'Sub-antimicrobial dose doxycycline (Oracea) — reduces inflammation without antibiotic resistance concern',
      'Isotretinoin for refractory cases',
      'Beta-blockers or clonidine for flushing',
    ],
    laser: {
      for_dark_skin: 'Laser treatment for rosacea blood vessels on darker skin requires careful selection. Nd:YAG (1064nm) is safer for deeper skin tones. KTP laser and intense pulsed light (IPL) have higher PIH risk on Fitzpatrick III-VI and should be used very cautiously or avoided.',
      find_expert: 'Laser rosacea treatment on darker skin absolutely requires a practitioner with extensive experience in Fitzpatrick III-VI.',
    },
    triggers: [
      'Sun exposure — UV worsens rosacea. SPF essential.',
      'Hot beverages, alcohol, spicy food — vasodilators that trigger flushing',
      'Temperature extremes — hot and cold',
      'Exercise — the increased heat and flushing worsens vascular rosacea',
      'Stress',
      'Skincare products with fragrance, alcohol (denatured), menthol',
    ],
  },

  rosacea_safe_skincare: {
    principle: 'Minimal, gentle, fragrance-free. Less is more.',
    cleansers: ['CeraVe Hydrating Cleanser', 'Vanicream Gentle Facial Cleanser', 'Avene Extremely Gentle Cleanser'],
    moisturisers: ['Avene Skin Recovery Cream', 'La Roche-Posay Toleriane Double Repair Moist', 'Cetaphil Moisturising Cream (fragrance-free version)'],
    spf: ['La Roche-Posay Anthelios Mineral SPF', 'EltaMD UV Physical SPF', 'Avene Mineral Fluid SPF'],
    ingredients_to_avoid: ['Fragrance/parfum', 'Alcohol (denatured)', 'Menthol/peppermint', 'Eucalyptus', 'Witch hazel (without alcohol is okay)', 'AHAs in high concentrations', 'Benzoyl peroxide (can be very drying)'],
  },
};

// ─── PSORIASIS IN ETHNIC SKIN ─────────────────────────────────────────────────

export const PSORIASIS_GUIDE = {
  what: 'Psoriasis is a chronic autoimmune condition that accelerates the skin cell cycle — cells build up rapidly on the surface, forming scales and red patches that can be itchy and sometimes painful.',

  in_ethnic_skin: {
    appearance: 'On darker skin, psoriasis plaques are PURPLE or BROWN rather than red. Scales are still present and often appear grey. Significantly underdiagnosed in people of colour because the "salmon-coloured red plaque" that defines textbook psoriasis is not visible.',
    pih: 'After psoriasis plaques clear, significant hyperpigmentation is common in darker skin. This PIH can persist for months and is often more distressing than the active plaques.',
  },

  treatment: {
    topical: [
      'Coal tar preparations — effective, good for scalp psoriasis',
      'Topical steroids — careful monitoring for thinning on darker skin',
      'Vitamin D analogues (calcipotriol/Dovonex) — good evidence, less steroid side effects',
      'Tazarotene (retinoid) — for plaques',
    ],
    phototherapy: 'Narrowband UVB phototherapy — effective for widespread psoriasis. Must be calibrated for skin phototype to avoid burns.',
    biologics: 'Modern biologics (adalimumab, secukinumab, dupilumab etc.) are transformative for moderate-severe psoriasis. Increasingly accessible.',
    scalp_psoriasis: {
      note: 'Scalp psoriasis in Black, South Asian, and other textured-hair communities needs special consideration — frequent washing required for medicated shampoos is in tension with hair care needs.',
      solutions: [
        'Fluocinolone scalp oil — can be applied and left overnight, suits textured hair care routines better',
        'Clobetasol propionate solution — applied to scalp, effective',
        'Coal tar shampoos (T-Sal, Neutrogena T-Gel) used 2-3x per week when affordable',
        'Medicated conditioners that reduce washing frequency needed',
      ],
    },
  },
};

// ─── PERIORAL DERMATITIS ──────────────────────────────────────────────────────

export const PERIORAL_DERMATITIS_GUIDE = {
  what: 'Perioral dermatitis is an inflammatory facial rash that appears around the mouth, nose, and sometimes eyes. Small red or skin-coloured papules and pustules appear in the perioral area.',

  causes: {
    main: 'Steroid use on the face — even low-potency hydrocortisone or inhaled steroids — is the most common cause. The steroids suppress the condition temporarily, but cause rebound worsening when stopped.',
    other: ['Heavy moisturisers and occlusive products on the face', 'Toothpaste (fluoride)', 'Hormonal changes', 'Certain skincare ingredients', 'Unknown in many cases'],
  },

  in_ethnic_skin: {
    appearance: 'Perioral dermatitis on darker skin appears as groups of small papules, sometimes hyperpigmented or skin-coloured. Less obvious redness than on lighter skin.',
    pih_risk: 'The papules and any picking leave significant PIH on darker skin.',
  },

  treatment: {
    stop_topical_steroids: 'If caused by steroid use — STOP topical steroids on the face. There will be a rebound worsening initially. Do not retreat with steroid.',
    medical: [
      'Oral tetracycline class antibiotics (doxycycline, minocycline) — first-line treatment',
      'Topical metronidazole',
      'Azelaic acid',
      'Topical erythromycin',
    ],
    skincare_changes: [
      'Zero heavy creams or ointments on affected area',
      'Switch to fluoride-free toothpaste',
      'Use minimal, non-occlusive products',
      'No fragrance',
    ],
    timeline: '6-12 weeks for full resolution with treatment. Relapses are common.',
  },
};

// ─── CONTACT DERMATITIS ───────────────────────────────────────────────────────

export const CONTACT_DERMATITIS_GUIDE = {
  types: {
    irritant: {
      what: 'Skin reaction from direct chemical damage to the skin — not an immune response. Almost anyone exposed to sufficient concentrations of an irritant will react.',
      common_irritants: ['SLS (sodium lauryl sulphate)', 'Alcohol (denatured)', 'High-concentration AHAs or retinoids', 'Fragrance at high concentrations', 'Preservatives (parabens at high levels, formaldehyde releasers)'],
    },
    allergic: {
      what: 'An immune system response — the body has been sensitised to an ingredient and reacts upon re-exposure. Often delayed (24-72 hours after exposure).',
      common_allergens: ['Fragrance (most common cosmetic allergen)', 'Nickel (in jewelry)', 'Balsam of Peru', 'Propylene glycol', 'PPD (in hair dye, temporary tattoo — "black henna")', 'Formaldehyde and formaldehyde releasers', 'Methylisothiazolinone (MI/MCI — preservative)'],
    },
  },

  diagnosis: 'Patch testing by a dermatologist is the gold standard for identifying allergens. An array of common allergens is applied to the back under patches for 48-72 hours and reactions are read.',

  for_ethnic_skin: {
    pih_severity: 'Contact dermatitis in darker skin causes MORE SEVERE and LONGER-LASTING PIH than in lighter skin. Even a brief episode of irritant dermatitis leaves dark marks that take months to fade.',
    prevention_priority: 'Identifying and completely avoiding allergens is critical — each exposure event creates PIH. Patch testing is therefore particularly valuable for those with darker skin.',
    note_on_hair_dye: 'PPD (paraphenylenediamine) in hair dye is one of the most sensitising allergens. South Asian, Arab, Black, and Caribbean communities with traditions of frequent hair dyeing have elevated exposure. If you react to PPD, react to henna with PPD, or have had a henna tattoo reaction — avoid PPD hair dye and always patch test.',
  },
};

// ─── GENTLE SKINCARE PRINCIPLES ──────────────────────────────────────────────

export const GENTLE_SKINCARE_PRINCIPLES = {
  less_is_more: {
    principle: 'With sensitive or reactive skin, the goal is to identify what your skin NEEDS (moisture, barrier repair) and provide exactly that — not to add more products in hopes of improvement.',
    minimalist_routine: [
      'Gentle, fragrance-free cleanser (1x daily maximum for sensitive)',
      'Fragrance-free, barrier-supportive moisturiser',
      'Mineral SPF',
      'ONLY specific treatment product for the diagnosed condition',
    ],
    what_to_eliminate: 'Fragrance (the #1 cause of cosmetic contact allergy), essential oils, denatured alcohol, scrubs/physical exfoliation, multiple actives simultaneously',
  },

  introducing_new_products: {
    process: [
      'Introduce one new product at a time — never multiple simultaneously',
      'Patch test on inner arm for 48-72 hours before face use',
      'Start with every other day before using daily',
      'Wait 2-4 weeks before assessing whether it\'s working',
      'If a reaction occurs, stop ALL new products and return to basics',
    ],
  },

  ingredients_universally_safe: [
    'Colloidal oatmeal — anti-inflammatory, soothing for eczema',
    'Ceramides (ceramide 1, 3, 6-II) — barrier repair without irritation',
    'Hyaluronic acid — humectant, non-irritating',
    'Glycerin — humectant, very well-tolerated',
    'Shea butter — occlusive, nourishing, few sensitivities',
    'Squalane — lightweight, non-irritating, excellent for sensitive acne-prone skin',
    'Niacinamide (at 5% or less) — anti-inflammatory, barrier-supporting',
    'Centella asiatica (cica) — healing, anti-inflammatory, well-tolerated',
    'Panthenol (vitamin B5) — healing, soothing',
    'Allantoin — healing, soothing',
  ],

  first_aid_for_flares: [
    'Immediately reduce routine to the absolute minimum (gentle cleanser + plain moisturiser + SPF)',
    'Cold compresses for itch and inflammation',
    'Plain colloidal oatmeal bath for widespread body reaction',
    'Antihistamine (Benadryl) for allergic reactions',
    'OTC hydrocortisone 1% for 5-7 days maximum for irritation/reaction (not for perioral area, thin skin, or long-term use)',
    'See a dermatologist if the reaction is severe, spreading, not improving in 5-7 days',
  ],
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getSensitiveSkinGuide() {
  return SENSITIVE_SKIN_OVERVIEW;
}

export function getEczemaGuide() {
  return ECZEMA_GUIDE;
}

export function getRosaceaGuide() {
  return ROSACEA_GUIDE;
}

export function getPsoriasisGuide() {
  return PSORIASIS_GUIDE;
}

export function getContactDermatitisGuide() {
  return CONTACT_DERMATITIS_GUIDE;
}

export function getSensitiveRoutine() {
  return GENTLE_SKINCARE_PRINCIPLES;
}

export function getSkinConditionGuide(condition) {
  const map = {
    eczema: ECZEMA_GUIDE,
    rosacea: ROSACEA_GUIDE,
    psoriasis: PSORIASIS_GUIDE,
    perioral: PERIORAL_DERMATITIS_GUIDE,
    contact: CONTACT_DERMATITIS_GUIDE,
  };
  return map[condition] || null;
}

export const SENSITIVE_SKIN_STATS = {
  conditionsCovered: 5,
  safeIngredients: GENTLE_SKINCARE_PRINCIPLES.ingredients_universally_safe.length,
  ethnicPresentationDifferences: true,
};
