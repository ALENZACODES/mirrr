/**
 * MIRRR Pregnancy Beauty Guide
 * Safe and unsafe ingredients during pregnancy, skin changes, hair changes,
 * chloasma (melasma of pregnancy), safe alternatives, postpartum recovery,
 * with ethnic skin-specific guidance
 */

// ─── PREGNANCY SKIN CHANGES ───────────────────────────────────────────────────

export const PREGNANCY_SKIN_CHANGES = {
  overview: 'Pregnancy causes profound hormonal shifts — rising oestrogen, progesterone, and hCG — that affect skin in multiple ways across all trimesters.',

  first_trimester: {
    changes: [
      'Increased oil production — existing acne may worsen; new acne may develop',
      'Skin may appear flushed due to increased blood volume (up 40-50% by third trimester)',
      'Heightened sensitivity — existing skin conditions may flare',
      'Some women experience initial "glow" from increased circulation',
      'Nausea and vomiting can affect hydration and skin health',
    ],
    what_helps: 'Gentle hydration; avoid new actives; patch test everything; stay hydrated.',
  },

  second_trimester: {
    changes: [
      'Melasma/chloasma may develop (see below)',
      'Skin often improves for many women in second trimester — the "pregnancy glow" period',
      'Stretch marks begin as skin expands with baby bump',
      'Linea nigra — dark vertical line down centre of abdomen — appears in many women (more pronounced in darker skin)',
      'Montgomery glands on nipples become more prominent and may darken',
    ],
  },

  third_trimester: {
    changes: [
      'Significant skin stretching; stretch marks may extend beyond abdomen to hips, thighs, breasts',
      'Oedema (swelling) of ankles, feet, hands — skin may appear stretched and shiny',
      'Spider veins may appear from increased blood flow',
      'Skin itching, particularly over abdomen as skin stretches',
      'PUPPP (pruritic urticarial papules and plaques of pregnancy) — itchy rash in third trimester; not dangerous but uncomfortable',
    ],
    puppp: {
      what: 'PUPPP is a specific pregnancy rash affecting approximately 1 in 160 pregnancies. Itchy, red, raised patches that begin in stretch marks and may spread.',
      typical_patient: 'First-time mothers; multiple pregnancies (twins/triplets); male foetus.',
      treatment: 'Topical corticosteroids (low-potency; see safety below); antihistamines (some safe in pregnancy — discuss with doctor); resolves after delivery.',
      not_dangerous: 'PUPPP is uncomfortable but does not harm mother or baby.',
    },
  },

  melasma_chloasma: {
    what: 'Melasma (called chloasma when pregnancy-related; "the mask of pregnancy") is hyperpigmentation developing on the face — typically forehead, cheeks, upper lip, and chin.',
    cause: 'High oestrogen and progesterone stimulate melanocytes to overproduce melanin. UV exposure triggers and worsens it significantly.',
    prevalence: 'Affects 15-50% of pregnant women; MUCH more common in women with Fitzpatrick III-VI skin tones — skin with more active melanocytes responds more dramatically to hormonal stimulation.',
    ethnic_note: 'South Asian, Arab, Latina, East Asian, and Black women have significantly higher rates of pregnancy melasma, and it tends to be darker and more persistent in those with more melanin.',
    pattern: {
      centrofacial: 'Forehead, cheeks, nose, chin — most common pattern',
      malar: 'Cheeks and nose only',
      mandibular: 'Jawline — less common',
    },
    will_it_go: '70% of pregnancy melasma fades postpartum (usually within 3-6 months). The remaining 30% may persist and require treatment.',
    prevention: [
      'Consistent broad-spectrum SPF 50+ PA++++ DAILY, even indoors (UV comes through windows)',
      'Wide-brimmed hat outdoors',
      'Avoid peak UV hours (10am-4pm)',
      'Tinted sunscreen provides extra iron oxide protection that untinted SPF does not',
    ],
    safe_treatments_during_pregnancy: [
      'SPF religiously — primary treatment',
      'Azelaic acid 20% — safe in pregnancy; proven for melasma',
      'Vitamin C (ascorbic acid) — antioxidant; safe; mild lightening',
      'Niacinamide — safe; reduces melanin transfer',
      'Physical exfoliants — gentle; removes surface pigmented cells',
    ],
    unsafe_for_melasma_during_pregnancy: [
      'Hydroquinone (HQ) — main melasma treatment but NOT safe in pregnancy; high systemic absorption',
      'Kojic acid — avoid',
      'Retinoids (tretinoin, retinol) — primary melasma treatment but UNSAFE in pregnancy',
      'Strong chemical peels — defer to postpartum',
      'Laser treatments — defer to postpartum (also risks PIH in dark skin types)',
    ],
    postpartum_treatment: 'Once no longer pregnant or breastfeeding, full range of melasma treatments available: tretinoin, hydroquinone, combination prescriptions, chemical peels, careful laser treatments.',
  },
};

// ─── INGREDIENT SAFETY IN PREGNANCY ──────────────────────────────────────────

export const PREGNANCY_INGREDIENT_SAFETY = {
  disclaimer: 'This information is for general educational purposes. Always consult your doctor or midwife about specific products and ingredients. Individual risk-benefit assessment matters. The "AVOID" list below is not absolute — some women use these under medical supervision.',

  AVOID: {
    retinoids: {
      ingredients: ['Retinol', 'Retinaldehyde', 'Retinyl palmitate', 'Tretinoin (Retin-A)', 'Adapalene (Differin)', 'Tazarotene', 'Isotretinoin (Accutane — oral)'],
      reason: 'All retinoids are teratogenic (cause birth defects) at high doses. Topical retinoids have low systemic absorption, but the risk-benefit ratio does not support use during pregnancy. The evidence comes from high-dose supplementation studies, but caution is appropriate.',
      risk_level: 'Avoid all retinoids during pregnancy — consensus among dermatologists.',
      note: 'Retinyl palmitate in sunscreens and cosmetics is present in very low concentrations; many experts consider minimal risk but most guidelines say to avoid.',
    },
    hydroquinone: {
      ingredients: ['Hydroquinone', 'Hydroquinone 2%', 'Hydroquinone 4%'],
      reason: '35-45% systemic absorption through skin — one of the highest of any topical skincare ingredient. The systemic exposure and unknown foetal effects make it inappropriate during pregnancy.',
      avoid: true,
    },
    salicylic_acid: {
      ingredients: ['Salicylic acid', 'BHA', 'Beta hydroxy acid', 'Aspirin (oral — separate issue but same family)'],
      risk_level: 'Low-concentration (0.5-2%) topical: most experts consider low risk; avoid high concentrations and leave-on formulas',
      concern: 'Oral high-dose aspirin has documented foetal effects. Topical salicylic acid at cosmetic concentrations has low systemic absorption but precautionary avoidance is common.',
      practitioner_note: 'Many dermatologists consider low-concentration wash-off salicylic acid (cleansers) acceptable in pregnancy.',
    },
    chemical_sunscreens: {
      specific: ['Oxybenzone', 'Avobenzone', 'Octinoxate', 'Homosalate', 'Octisalate'],
      concern: 'Some have oestrogenic activity and significant systemic absorption (FDA found in blood after single application). Precautionary avoidance recommended.',
      alternative: 'Use MINERAL sunscreens (zinc oxide, titanium dioxide) during pregnancy — no systemic absorption, proven safety record.',
    },
    formaldehyde_releasers: {
      ingredients: ['DMDM Hydantoin', 'Quaternium-15', 'Imidazolidinyl urea', 'Diazolidinyl urea', 'Bronopol'],
      concern: 'Release formaldehyde; known carcinogen; avoid particularly in hair straightening treatments.',
      specific_concern: 'Brazilian Blowout and formaldehyde-containing hair straighteners — significant professional exposure risk; avoid during pregnancy.',
    },
    spray_tans_self_tanners: {
      ingredients: ['DHA (dihydroxyacetone) — in spray tans'],
      concern: 'Inhaled DHA in spray tans is the concern, not topical application. Avoid spray booths during pregnancy. Self-tanning creams/lotions applied topically are generally considered lower risk but precautionary avoidance is common.',
    },
    essential_oils_high_risk: {
      avoid: ['Clary sage', 'Rosemary', 'Basil', 'Juniper', 'Thyme', 'Oregano', 'Sage', 'Pennyroyal', 'Camphor', 'Cinnamon (bark oil)'],
      reason: 'Some essential oils stimulate uterine contractions or have other hormonal effects at high concentrations. Aromatic use at low dilution in diffusers generally less concerning than concentrated topical application.',
    },
    hair_treatments: {
      avoid: [
        'Permanent hair dye in first trimester (most conservative approach — though evidence suggests low risk)',
        'Chemical relaxers — high alkaline pH; prolonged scalp contact',
        'Keratin treatments with formaldehyde (see above)',
        'Bleach near scalp — chemical exposure risk',
      ],
      generally_considered_lower_risk: [
        'Hair dye after first trimester (scalp absorption limited)',
        'Highlights/foils (less scalp contact)',
        'Semi-permanent or temporary colour',
        'Henna (natural plant-based)',
      ],
    },
  },

  SAFE: {
    overview: 'These ingredients have good safety profiles during pregnancy. No skincare is 100% guaranteed — consult your provider for individual circumstances.',

    sunscreens: {
      zinc_oxide: 'The gold standard pregnancy sunscreen ingredient. Physical/mineral; sits on skin surface; no systemic absorption; excellent broad-spectrum protection.',
      titanium_dioxide: 'Another safe mineral UV filter. Less photostable than zinc oxide for UVA but safe.',
    },

    actives: {
      vitamin_c: {
        name: 'Vitamin C (L-ascorbic acid, ascorbyl glucoside, ascorbyl palmitate)',
        safety: 'Safe. Antioxidant; brightening; collagen-supporting.',
        use: 'Excellent choice during pregnancy for glow and mild melasma treatment.',
      },
      niacinamide: {
        name: 'Niacinamide (vitamin B3)',
        safety: 'Safe. Anti-inflammatory; pore-minimising; regulates sebum; reduces pigmentation transfer.',
        pregnancy_bonus: 'Excellent for pregnancy acne without hormonal risk.',
      },
      azelaic_acid: {
        name: 'Azelaic acid (up to 20%)',
        safety: 'Safe in pregnancy — one of the few actives specifically approved for use during pregnancy.',
        use: 'Acne treatment AND melasma treatment. Ideal pregnancy multi-tasker.',
      },
      glycolic_aha: {
        name: 'Glycolic acid, lactic acid, mandelic acid (low concentrations)',
        safety: 'Generally considered safe at low concentrations (up to 5-10%) in wash-off formulas.',
        note: 'Avoid high concentrations and professional peels; gentle exfoliation is fine.',
      },
      hyaluronic_acid: {
        name: 'Hyaluronic acid',
        safety: 'Completely safe. The body produces its own hyaluronic acid.',
        use: 'Essential for pregnancy hydration — skin often dehydrated.',
      },
      ceramides: 'Safe. Support skin barrier — important during pregnancy when skin barrier often compromised.',
      peptides: 'Generally safe. Many peptides have extensive safety data.',
    },

    moisturising: {
      shea_butter: 'Safe and excellent for stretch marks support and dry skin.',
      cocoa_butter: 'Safe. Widely used for stretch marks (note: not clinically proven to prevent stretch marks but safe to use).',
      glycerin: 'Safe. Excellent humectant.',
      squalane: 'Safe. Derived from olives; excellent emollient; non-comedogenic.',
    },

    hair_care: {
      sulfate_free_shampoo: 'Gentle cleansing — good choice.',
      protein_treatments: 'Generally safe — keratin and protein in hair treatments is different from keratin straightening chemical treatments.',
      natural_oils: 'Coconut, argan, jojoba, castor oil — all safe for hair.',
    },
  },
};

// ─── HAIR CHANGES IN PREGNANCY ─────────────────────────────────────────────────

export const PREGNANCY_HAIR_CHANGES = {
  during_pregnancy: {
    positive: {
      growth: 'High oestrogen levels extend the hair growth phase (anagen). Hairs that would normally shed stay on the head longer — this is the "pregnant hair" effect.',
      appearance: 'Many women find their hair thicker, fuller, and shinier during pregnancy.',
      mechanism: 'Oestrogen reduces the proportion of hairs in the shedding phase (telogen) at any given time. More hairs actively growing; fewer shedding.',
    },
    negative_for_some: {
      texture_change: 'Hormonal shifts can change hair texture — straight hair may develop waves; curly hair may become less defined. Usually temporary.',
      scalp_changes: 'Some women develop scalp sensitivity, oiliness, or dryness during pregnancy.',
    },
  },

  postpartum_hair_loss: {
    what: 'Postpartum hair loss (telogen effluvium) is experienced by 40-50% of new mothers. The hair that was retained during pregnancy sheds dramatically in the weeks/months after delivery.',
    timing: 'Typically begins 3-4 months after delivery; peaks around 4-5 months postpartum.',
    duration: 'Lasts 2-6 months in most cases. Hair returns to pre-pregnancy state by 12 months for most women.',
    appearance: 'Significant shedding — women often find large amounts of hair in the shower, on the pillow, in hairbrushes. Hairline thinning is common and can be emotionally distressing.',
    ethnic_note: 'In women with textured hair, postpartum shedding may be less immediately visible (loose hair may stay tangled in curl pattern rather than falling immediately) but is no less real.',
    reassurance: 'This is normal and expected. It does not indicate a health problem. Hair returns.',
    support: [
      'Nutritious diet with adequate protein, iron, and zinc — essential for hair recovery',
      'Consider iron level testing — postpartum iron deficiency (from delivery blood loss) can worsen shedding',
      'Avoid tight hairstyles, heat, and chemical processing during postpartum shedding phase',
      'Biotin supplements: evidence weak, but generally safe during breastfeeding; do not rely on these',
      'Scalp massage: promotes blood flow; may support recovery',
      'Minoxidil: NOT safe during breastfeeding; can consider after breastfeeding ends if shedding persists beyond 12 months',
    ],
    when_to_see_doctor: [
      'Shedding persists beyond 12 months with no improvement',
      'Significant bald patches (may indicate alopecia areata, a separate condition)',
      'Shedding begins during pregnancy rather than after (unusual — worth investigating)',
      'Low ferritin/iron levels on blood test',
    ],
  },
};

// ─── POSTPARTUM BEAUTY RECOVERY ───────────────────────────────────────────────

export const POSTPARTUM_BEAUTY = {
  hormone_adjustment: {
    timeline: '3-6 months for hormones to normalise for non-breastfeeding mothers; breastfeeding maintains hormonal state closer to pregnancy; full recovery when breastfeeding stops.',
    skin_effects: [
      'Acne flares are very common postpartum — hormones shift dramatically after delivery',
      'Postpartum sweating — oestrogen drop causes night sweats similar to menopause',
      'Dry skin is common — hormonal shift and dehydration from new-parent sleep deprivation',
      'Melasma may fade; may persist in some women',
    ],
  },

  introducing_actives_postpartum: {
    note: 'If breastfeeding, same caution as pregnancy applies for retinoids; other actives generally considered lower risk but consult your provider.',
    not_breastfeeding: 'Can gradually reintroduce retinoids, azelaic acid, and other actives. Start slowly — postpartum skin can be sensitised.',
    priority: [
      '1. SPF continues to be essential (melasma won\'t fade without it)',
      '2. Gentle hydration',
      '3. Once skin settles: introduce azelaic acid or vitamin C for melasma',
      '4. Once not breastfeeding: can introduce retinoids for melasma and anti-aging',
    ],
  },

  breastfeeding_ingredients: {
    generally_avoid: [
      'High-dose salicylic acid (oral aspirin avoided; topical precautionary)',
      'Benzoyl peroxide in large amounts',
      'Essential oils at high concentration on breast area',
      'Strong chemical peels (systemic exposure)',
    ],
    generally_safe: [
      'Gentle cleansers',
      'Moisturisers (ceramides, hyaluronic acid, shea butter)',
      'Mineral SPF (zinc oxide/titanium dioxide)',
      'Niacinamide',
      'Azelaic acid',
      'Vitamin C',
    ],
  },

  self_care_importance: {
    mental_health_context: 'Postpartum depression and anxiety affect 10-20% of new mothers. Self-care routines — including beauty rituals — have documented benefits for postpartum mental health when framed as self-nourishment.',
    ritual: 'Even a simple 5-minute skincare routine provides a moment of selfhood and sensory pleasure in an exhausting period. The ritual matters independent of the beauty outcome.',
    community_support: 'In many ethnic communities, extended family involvement in postpartum care traditionally provides significant support for the new mother. The South Asian jaapa (40-day postpartum confinement and care), the Latin cuarentena (40-day period of rest and support), and similar traditions across cultures serve as communal beauty and wellness rituals as well as practical support.',
  },
};

// ─── ETHNIC PREGNANCY BEAUTY ──────────────────────────────────────────────────

export const ETHNIC_PREGNANCY_BEAUTY = {
  south_asian: {
    haldi_ceremony: 'Turmeric paste (haldi) applied to bride\'s skin in pre-wedding ceremony has been adapted as a pregnancy glow ritual in some communities. Turmeric has anti-inflammatory properties; safe for topical use in pregnancy.',
    oil_massage: 'Abhyanga-inspired oil massages during pregnancy are traditional across South Asia — using sesame oil or coconut oil. Safe; supportive for skin suppleness and stretch mark prevention (anecdotally).',
    postpartum: 'Jaapa — 40-day postpartum period where new mother is cared for by female relatives. Includes specific dietary and body care practices including warm oil massages. Widely practiced across Indian diaspora.',
    melasma_prevalence: 'Very high prevalence of pregnancy melasma in South Asian women. SPF and vitamin C are particularly important.',
  },

  west_african: {
    shea_butter: 'Shea butter is the traditional stretch mark treatment across West Africa — applied generously to belly, hips, and breasts throughout pregnancy. Anecdotally effective; not clinically proven to prevent stretch marks but deeply nourishing and safe.',
    black_soap: 'African black soap sometimes used as gentle face wash during pregnancy. Generally safe; avoid formulations with additional actives.',
    postpartum: 'Ola ilu — Yoruba postpartum practices including specific foods, herbal steam baths, and community support. Belly binding with wrappers is traditional and supports recovery.',
  },

  arab: {
    privacy: 'Pregnancy beauty care is often shared within close female family circles. Extended family support for pregnant and new mothers is culturally embedded.',
    oud_and_bakhoor: 'Incense burning (oud/bakhoor) is traditional across Arab homes. Limited ventilation and inhaled smoke during pregnancy — worth ensuring good ventilation.',
    kohl: 'Traditional kohl containing lead (antimony sulfide/galena) should be AVOIDED during pregnancy and for children. Modern kohl substitutes using carbon black are safe.',
    henna: 'Natural henna safe during pregnancy (avoid black henna/PPD). Henna used for pregnancy celebration rituals in many Arab communities.',
  },

  black_american: {
    relaxers: 'Many Black American women choose to stop chemical relaxers during pregnancy — both out of precautionary caution and as an opportunity to transition to natural hair. Postpartum hair loss period is a particularly good time to continue with natural styles as chemical processing during shedding is not advisable.',
    hot_combs: 'Heat styling remains an option; prioritise scalp and strand health during pregnancy.',
    oils: 'Jamaican Black Castor Oil, coconut oil, and shea butter all safe pregnancy hair treatments.',
  },

  east_asian: {
    korean: 'Korean skincare culture emphasises skin health during pregnancy — focusing on hydration and gentle ingredients. Glass skin goal continues with safe ingredients.',
    japanese: 'Japanese beauty culture emphasises sunscreen — this aligns perfectly with pregnancy SPF requirements. Switch to mineral SPF.',
    chinese: 'Zuo yuezi (坐月子) — the Chinese "sitting the month" postpartum practice. Includes specific dietary practices and often extensive family support. Traditional restrictions on bathing/hair washing during first postpartum month are cultural; modern adaptations vary.',
  },

  latina: {
    cuarentena: 'The cuarentena (40-day postpartum period) is practiced across many Latin cultures. New mother rests while female family members provide care, food, and support.',
    stretch_marks: 'Rosehip oil and cocoa butter are traditional Latina stretch mark treatments — safe during pregnancy.',
    hair: 'The importance of hair in Latina beauty culture means postpartum hair loss can be particularly distressing. Normalising it and emphasising its temporary nature is important.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getPregnancySkinChanges(trimester) {
  if (trimester === 1) return PREGNANCY_SKIN_CHANGES.first_trimester;
  if (trimester === 2) return PREGNANCY_SKIN_CHANGES.second_trimester;
  if (trimester === 3) return PREGNANCY_SKIN_CHANGES.third_trimester;
  return PREGNANCY_SKIN_CHANGES;
}

export function getMelasmaGuide() {
  return PREGNANCY_SKIN_CHANGES.melasma_chloasma;
}

export function getPregnancyIngredientSafety(category) {
  if (category === 'avoid') return PREGNANCY_INGREDIENT_SAFETY.AVOID;
  if (category === 'safe') return PREGNANCY_INGREDIENT_SAFETY.SAFE;
  return PREGNANCY_INGREDIENT_SAFETY;
}

export function getPregnancyHairGuide() {
  return PREGNANCY_HAIR_CHANGES;
}

export function getPostpartumBeautyGuide() {
  return POSTPARTUM_BEAUTY;
}

export function getEthnicPregnancyBeauty(communityId) {
  return ETHNIC_PREGNANCY_BEAUTY[communityId.replace('-', '_')] || null;
}

export const PREGNANCY_BEAUTY_STATS = {
  trimestersCovered: 3,
  avoidIngredientCategories: Object.keys(PREGNANCY_INGREDIENT_SAFETY.AVOID).length,
  safeIngredientCategories: Object.keys(PREGNANCY_INGREDIENT_SAFETY.SAFE).length,
  communitiesCovered: Object.keys(ETHNIC_PREGNANCY_BEAUTY).length,
};
