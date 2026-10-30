/**
 * MIRRR Ingredient Interactions Guide
 * What skincare ingredients to combine, what to separate,
 * layering order, AM vs PM routines, and the science behind
 * ingredient compatibility — critical for skin-of-colour safety
 */

// ─── WHY INTERACTIONS MATTER ──────────────────────────────────────────────────

export const INGREDIENT_INTERACTIONS_OVERVIEW = {
  why_it_matters: 'Skincare ingredients can interact in ways that reduce efficacy, cause irritation, or — particularly for darker skin tones — trigger Post-Inflammatory Hyperpigmentation (PIH). Understanding what to combine and separate is crucial.',

  interaction_types: {
    efficacy_reduction: 'Ingredients that chemically neutralise each other before they can work.',
    increased_irritation: 'Combinations that cause more skin irritation than either ingredient alone.',
    ph_conflicts: 'Ingredients that require different pH levels to be active — combining at the wrong pH renders one or both inactive.',
    penetration_conflicts: 'Some ingredients affect the skin barrier or penetration in ways that alter how other ingredients absorb.',
  },

  ethnic_skin_priority: {
    PIH_risk: 'For Fitzpatrick IV-VI skin tones, IRRITATION IS THE ENEMY. Even mild irritation can trigger post-inflammatory hyperpigmentation — darkening that can last months. This makes the "don\'t combine" rules especially important for darker skin.',
    conservative_approach: 'Start with minimal products; introduce one new ingredient at a time; wait 2-4 weeks before adding another. This is doubly important for darker skin tones.',
  },
};

// ─── DO NOT COMBINE ───────────────────────────────────────────────────────────

export const DO_NOT_COMBINE = {
  vitamin_c_and_niacinamide: {
    concern: 'An old belief that the two react together (forming niacin, which can flush skin) or cancel each other out.',
    verdict: 'DEBUNKED — this is largely a myth. Can generally be combined.',
    
    reality: 'This reaction occurs at very high temperatures not found in normal skincare conditions. Modern formulations at concentrations used in skincare do not produce this reaction in practice.',
    caveat: 'Both can be mildly irritating individually. If your skin is sensitive, introduce one at a time. But there is no chemical reason to avoid combining them.',
    recommendation: 'Use both — they are complementary. Niacinamide manages inflammation; vitamin C brightens. Together they are excellent for PIH treatment.',
  },

  vitamin_c_and_AHA_BHA: {
    verdict: 'MOSTLY FINE — context matters.',
    concern: 'Both are acidic. Doubling up on acid can increase irritation, particularly for sensitive skin.',
    ph_consideration: 'Vitamin C (ascorbic acid) works at pH 2.5-3.5. AHAs (glycolic, lactic) also work at low pH. Using both in the same routine can amplify each other\'s effectiveness — which is sometimes desirable, sometimes too much.',
    for_dark_skin: 'More caution warranted. The irritation risk from double-acid exposure is higher for darker skin tones due to PIH risk.',
    recommendation: 'Sensitive or dark skin: use one per day (vitamin C in AM, AHA in PM). Resilient skin: can combine but monitor for irritation.',
  },

  retinol_and_vitamin_c: {
    verdict: 'GENERALLY SEPARATE — but not because of direct interaction.',
    the_interaction: 'Vitamin C is unstable at high pH; retinoids are most stable at neutral-higher pH. Their optimal environments differ.',
    actual_issue: 'Both can be irritating. Using them together increases irritation risk with no added benefit.',
    recommendation: [
      'Use vitamin C in the AM (also antioxidant photoprotection)',
      'Use retinol/retinoid in the PM',
      'This separation is based on reducing cumulative irritation and optimising each ingredient\'s stability, not preventing a chemical disaster',
    ],
    dark_skin_note: 'Particularly important for Fitzpatrick III-VI to separate — retinoid irritation alone can cause PIH; adding vitamin C irritation simultaneously increases risk.',
  },

  retinol_and_AHA_BHA: {
    verdict: 'USE WITH CAUTION — one of the more legitimate combinations to avoid.',
    concern: 'Both retinoids and AHAs/BHAs increase cell turnover and remove the surface layer of skin. Combined use significantly increases irritation, redness, and peeling.',
    the_cocktail_problem: 'Exfoliating acids thin the outer dead skin layer that normally acts as a barrier against the stronger lower layers. Applying retinoid to freshly exfoliated skin means it penetrates more deeply and causes more irritation.',
    recommendation: [
      'Alternate nights: retinoid on Monday/Wednesday/Friday; AHA/BHA on Tuesday/Thursday',
      'Or: retinoid in PM; AHA in AM (separate by day)',
      'OR for sensitive skin: use retinoid and exfoliating acid in totally separate weeks when beginning each',
    ],
    for_dark_skin: 'STRONG RECOMMENDATION TO SEPARATE. On darker skin this combination can easily cause irritation and dark marks unless skin is well-acclimatised to both individually.',
  },

  retinol_and_benzoyl_peroxide: {
    verdict: 'DO NOT COMBINE.',
    reason: 'Benzoyl peroxide is an oxidising agent. Retinoids are oxidation-sensitive. BP directly oxidises and inactivates retinoids, rendering them useless.',
    recommendation: [
      'Use BP in AM; retinoid in PM',
      'OR use BP as a spot treatment rather than all-over application',
      'Adapalene (Differin) is more stable to BP than other retinoids — the CeraVe Acne Control Gel combines adapalene and BPO; this is formulation-specific',
    ],
  },

  multiple_exfoliants_together: {
    verdict: 'DO NOT COMBINE — one exfoliant at a time.',
    types: ['AHA (glycolic, lactic, mandelic, tartaric)', 'BHA (salicylic acid)', 'PHA (polyhydroxy acids)', 'Retinoids (another form of exfoliation)'],
    rule: 'One exfoliant per application. Using multiple simultaneously dramatically increases irritation risk.',
    layering_note: 'You can rotate different exfoliants across different days. Just not in the same application.',
  },

  two_low_pH_acids: {
    examples: ['Glycolic + lactic', 'Glycolic + salicylic', 'Vitamin C + glycolic', 'Mandelic + glycolic'],
    verdict: 'USE WITH CAUTION — not necessarily prohibited but monitor for over-exfoliation.',
    risk: 'Cumulative acid load can compromise the skin barrier, leading to redness, sensitivity, and for dark skin, PIH.',
    recommendation: 'If you want multiple acid benefits, choose a product formulated with multiple acids (this is done at appropriate concentrations); or rotate different acids across different days.',
  },

  oil_before_water: {
    verdict: 'NOT EXACTLY AN INTERACTION — but a critical layering mistake.',
    rule: 'Oils sit on top of the skin and act as a seal. Applying oil BEFORE water-based serums prevents those serums from penetrating.',
    correct_order: 'Water-based serums (go in) BEFORE oil-based products (seal in) — always.',
  },
};

// ─── BEST COMBINATIONS ────────────────────────────────────────────────────────

export const GREAT_COMBINATIONS = {
  niacinamide_and_zinc: {
    why: 'Niacinamide controls inflammation and sebum; zinc has antimicrobial properties. Together they address both the microbial and inflammatory aspects of acne.',
    products: 'The Ordinary Niacinamide 10% + Zinc 1% combines them at evidence-based ratios.',
    good_for: 'Acne-prone skin across all skin tones; excellent for dark skin where PIH from acne is a major concern.',
  },

  vitamin_c_and_vitamin_e_and_ferulic_acid: {
    
    
    good_for: 'Anti-aging, brightening, photoprotection — all skin types and tones. Particularly valuable before SPF in AM routine.',
  },

  hyaluronic_acid_then_moisturiser: {
    why: 'HA is a humectant — it draws water to itself. Applied to damp skin (immediately after cleansing/toning), it draws water into skin. Immediately sealing with a moisturiser/occlusive traps that moisture.',
    timing: 'Apply HA to damp skin; apply moisturiser within 60 seconds while skin is still slightly damp.',
    mistake: 'HA applied to dry skin in a dry environment may draw moisture out of deeper skin layers and dehydrate skin.',
  },

  niacinamide_and_retinoid: {
    why: 'Retinoids increase skin sensitivity and can cause irritation. Niacinamide is anti-inflammatory and helps reduce retinoid irritation while also providing complementary benefits (pigmentation, pore size, oiliness).',
    recommendation: 'Apply niacinamide first; let absorb; then apply retinoid. Or use moisturiser between layers ("sandwiching" — see below).',
    good_for: 'Everyone, but particularly dark skin tones where retinoid irritation risks PIH.',
  },

  sunscreen_plus_antioxidants: {
    why: 'SPF blocks UV rays. Antioxidants neutralise the free radicals generated by UV that get through SPF. Together they are significantly more protective than SPF alone.',
    protocol: 'Apply vitamin C serum; let absorb; apply broad-spectrum SPF.',
    enhanced_protection: 'This combination is sometimes called "broad-spectrum antioxidant photoprotection" in research — it provides defence against both direct UV damage and oxidative stress.',
  },

  ceramides_and_niacinamide: {
    why: 'Ceramides repair the skin barrier; niacinamide supports ceramide production and is anti-inflammatory. Together they are the ideal combination for sensitive, compromised, or reactive skin.',
    product_examples: 'CeraVe range uses both; The Ordinary products can be layered.',
    good_for: 'Eczema, rosacea, sensitised skin, dark skin building tolerance to actives.',
  },

  retinoid_sandwiching: {
    what: 'Apply moisturiser first; let absorb; apply retinoid; apply another layer of moisturiser.',
    why: 'Moisturiser "buffers" retinoid — slowing penetration and reducing irritation without eliminating efficacy.',
    who_for: 'Retinoid beginners; sensitive skin; dark skin where PIH risk makes minimising retinoid irritation critical.',
    
  },
};

// ─── PH GUIDE ─────────────────────────────────────────────────────────────────

export const PH_GUIDE = {
  overview: 'Skin has a natural pH of approximately 4.5-5.5 (slightly acidic). This "acid mantle" is protective. Different skincare actives work at different pH levels.',

  ph_by_ingredient: {
    vitamin_c_ascorbic: 'Works at pH 2.5-3.5. Most effective and stable at very low pH.',
    glycolic_acid: 'Works optimally at pH 3-4.',
    lactic_acid: 'Works at pH 3-4.',
    salicylic_acid_BHA: 'Works at pH 3-4.',
    retinoids: 'Work at pH 5-7 — essentially neutral.',
    niacinamide: 'Works across a wide pH range; relatively pH-stable.',
    peptides: 'Work at pH 5-7 (many are denatured at low pH).',
    aha_bha: 'All require low pH (below ~4) to be active. Above pH 4, they are not exfoliating.',
  },

  layering_order: {
    rule: 'Apply lowest pH products first; work up to higher pH products.',
    reason: 'High-pH products raise the skin\'s pH temporarily. If you apply an AHA after a high-pH moisturiser, the AHA is being applied to a higher-pH environment and is less effective.',
    practical_order: [
      '1. Cleanser',
      '2. Toner (if pH-adjusting/acidic)',
      '3. Vitamin C serum (lowest pH of most serums)',
      '4. AHA/BHA exfoliants',
      '5. Niacinamide/other serums',
      '6. Peptide serums',
      '7. Moisturiser (highest pH of leave-on products)',
      '8. SPF (AM only) — applied last',
    ],
    timing_between_steps: {
      acid_wait: 'After applying an AHA/BHA, wait 15-30 minutes before applying next product. This allows the acid to work at its optimal low pH before the pH rises.',
      for_convenience: 'Most people skip this timing rule and results are still good. Perfectionist approach: wait. Practical approach: 30-60 second absorption time is sufficient for most.',
    },
  },
};

// ─── AM vs PM ROUTINES ────────────────────────────────────────────────────────

export const AM_PM_GUIDE = {
  AM_philosophy: 'Morning routine = PROTECT. Protecting skin from the day\'s UV exposure, pollution, and environmental stressors.',
  PM_philosophy: 'Night routine = REPAIR AND TREAT. Skin regenerates during sleep. This is when actives work best; retinoids and exfoliants belong here.',

  AM_routine_essentials: {
    order: [
      '1. Cleanse (gentle; or water rinse if PM was thorough)',
      '2. Vitamin C serum (antioxidant protection)',
      '3. Hydrating serum (HA if needed)',
      '4. Moisturiser',
      '5. SPF 30-50+ (FINAL STEP before makeup)',
    ],
    note: 'SPF must be the last skincare step before makeup. Applying anything on top of SPF dilutes and reduces protection.',
  },

  PM_routine_essentials: {
    order: [
      '1. Makeup removal (micellar water, cleansing balm, or oil)',
      '2. Cleanse (to remove cleanser residue and day\'s pollution)',
      '3. Toner (optional; balance/hydration)',
      '4. Retinoid OR exfoliant (not both; alternate nights)',
      '5. Treatment serums (niacinamide, azelaic acid, etc.)',
      '6. Moisturiser',
      '7. Face oil (if using; LAST of skincare)',
      '8. Occlusive (Vaseline, Aquaphor) if slugging',
    ],
    slugging: {
      what: 'Applying a thin layer of pure petroleum jelly (Vaseline) as the LAST skincare step.',
      mechanism: 'Petroleum jelly is one of the most effective occlusives known — creates a near-impermeable seal trapping everything underneath.',
      when: 'Dry skin; compromised barrier; winter; after actives that cause dryness.',
      myth: 'Does NOT cause acne in most people — petroleum jelly molecules are too large to penetrate pores. However, if you are very acne-prone, patch test first.',
    },
  },

  double_cleanse: {
    what: 'First cleanse: oil-based (removes makeup and SPF). Second cleanse: water-based (removes everything else).',
    why: 'Oil dissolves oil-based substances (sunscreen, makeup). Water-based cleansers can\'t fully remove SPF and waterproof makeup. Double cleansing ensures a truly clean base for PM actives.',
    when_needed: 'Full makeup day; SPF use; sunscreen use. On bare-face low-SPF days, single cleanse may be sufficient.',
    first_cleanse_options: ['Cleansing oil', 'Cleansing balm', 'Micellar water (thorough massage, then rinse)', 'Cleansing milk for dry skin'],
    second_cleanse: 'Gentle water-based cleanser (gel, foam, or lotion depending on skin type).',
  },
};

// ─── SPECIFIC INGREDIENT DEEP DIVES ──────────────────────────────────────────

export const INGREDIENT_DEEP_DIVES = {
  retinoid_introduction: {
    starter_protocol: [
      'Week 1-2: Use retinoid ONCE a week (not every night)',
      'Week 3-4: Use twice a week if tolerating well (no significant irritation)',
      'Week 5-6: Use three times a week',
      'Month 2+: Can increase to every other night',
      'Month 3+: If tolerating well, may use nightly; many find every other night works best long-term',
    ],
    what_is_normal: [
      'Some flaking and peeling in first 4-6 weeks (skin turning over faster)',
      'Mild redness and tightness',
      'Temporary breakout in some people ("purging") — pore contents being expelled faster',
    ],
    when_to_slow_down: [
      'Significant redness, stinging, or burning',
      'Persistent breakout beyond 6-8 weeks',
      'Skin feels very dry and sensitive',
      'PIH developing at application sites (reduce frequency immediately)',
    ],
    dark_skin_retinoid_protocol: 'For Fitzpatrick IV-VI: begin at half the frequency above. Use sandwich method throughout. Consider starting with retinol (weaker) rather than prescription tretinoin. Have niacinamide ready as your soothing companion.',
  },

  vitamin_c_selection: {
    forms: {
      ascorbic_acid: 'Most effective; most studied; most unstable (oxidises quickly — vitamin C serum turning orange/brown indicates oxidation and loss of potency). Works at pH 2.5-3.5 — can be irritating.',
      ascorbyl_glucoside: 'Stable; converts to ascorbic acid on skin. Less irritating. Less potent than ascorbic acid.',
      sodium_ascorbyl_phosphate: 'Stable; well-tolerated; converts to ascorbic acid on skin. Good option for sensitive/dark skin.',
      ascorbyl_tetraisopalmitate: 'Oil-soluble vitamin C; very stable; less irritating. Works at physiological pH.',
      magnesium_ascorbyl_phosphate: 'Stable; gentle; good for sensitive skin.',
    },
    concentration: '10-20% ascorbic acid for efficacy. Lower concentrations in more stable forms (5-10% sodium ascorbyl phosphate still effective).',
    storage: 'Store in dark, cool place. Discard if product has turned significantly orange/brown.',
    for_dark_skin: 'Stable forms (sodium ascorbyl phosphate, ascorbyl glucoside) preferred — less irritating, less risk of PIH. Vitamin C is specifically beneficial for PIH treatment.',
  },

  azelaic_acid: {
    why_it_is_special: 'Azelaic acid is one of the most versatile actives. It treats acne (antimicrobial, anti-inflammatory), rosacea, and PIH simultaneously. It is safe in pregnancy. It works across Fitzpatrick I-VI.',
    concentrations: {
      ten_percent: '10% — OTC in some countries; mild; good for maintenance.',
      fifteen_percent: '15% — Skinoren gel (prescription in some countries).',
      twenty_percent: '20% — most studies on efficacy at this concentration.',
    },
    texture_options: ['Gel (Finacea, Aziclear)', 'Cream (Skinoren 20%)', 'Foam (Finacea Foam)'],
    for_dark_skin: 'EXCELLENT for dark skin. Studied for PIH in darker skin. Anti-inflammatory properties reduce irritation-triggered melanin production. Recommended as a key active for Fitzpatrick IV-VI routines.',
    side_effects: 'Tingling/stinging on first application; generally mild; usually resolves over first 1-2 weeks.',
  },
};

// ─── ETHNIC SKIN INTERACTION NOTES ───────────────────────────────────────────

export const ETHNIC_SKIN_INTERACTION_NOTES = {
  fitzpatrick_iv_vi: {
    headline: 'For darker skin tones, the cardinal rule of skincare is: AVOID IRRITATION AT ALL COSTS.',
    principle: 'Any inflammatory response — redness, burning, itching — can trigger melanin overproduction in the affected area, causing PIH that lasts months.',
    active_hierarchy: [
      '1. SPF (every day, no exceptions)',
      '2. Niacinamide (safe, multipurpose, anti-inflammatory)',
      '3. Azelaic acid (safe, proven for PIH, treats acne and rosacea)',
      '4. Vitamin C in stable form (gentle brightening, antioxidant)',
      '5. Retinoids (effective but introduce VERY slowly; sandwich method)',
      '6. AHAs (mandelic acid safest for dark skin — larger molecule, gentler)',
      '7. Avoid: strong peels, aggressive exfoliation, combining multiple actives until skin is fully acclimatised',
    ],
    PIH_treatment_combinations: {
      gold_standard: 'Vitamin C + niacinamide + SPF (safe, comprehensive, gentle)',
      prescription_level: 'Azelaic acid 20% + tretinoin (with care) + SPF',
      additional: 'Alpha-arbutin; tranexamic acid; kojic acid (monitor for irritation)',
    },
  },

  oily_skin: {
    temptation: 'Using multiple drying ingredients together (BHA, benzoyl peroxide, clay masks simultaneously).',
    risk: 'Over-stripping oil triggers reactive sebum overproduction — oiliness gets WORSE.',
    recommendation: 'One drying active per routine; balance with hydrating ingredients even on oily skin.',
  },

  combination_skin: {
    pattern: 'Oily T-zone with dry cheeks.',
    approach: 'Zone-treat — use BHA on T-zone only; hydrate dry zones.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getIngredientInteractionsOverview() {
  return INGREDIENT_INTERACTIONS_OVERVIEW;
}

export function getDoNotCombineGuide(ingredients) {
  if (ingredients) {
    return DO_NOT_COMBINE[ingredients] || DO_NOT_COMBINE;
  }
  return DO_NOT_COMBINE;
}

export function getGreatCombinations(combination) {
  if (combination) {
    return GREAT_COMBINATIONS[combination] || GREAT_COMBINATIONS;
  }
  return GREAT_COMBINATIONS;
}

export function getPHGuide() {
  return PH_GUIDE;
}

export function getAMPMGuide() {
  return AM_PM_GUIDE;
}

export function getIngredientDeepDive(ingredient) {
  return INGREDIENT_DEEP_DIVES[ingredient] || INGREDIENT_DEEP_DIVES;
}

export function getEthnicSkinInteractionNotes(skin_tone_category) {
  return ETHNIC_SKIN_INTERACTION_NOTES[skin_tone_category] || ETHNIC_SKIN_INTERACTION_NOTES;
}

