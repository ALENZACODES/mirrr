/**
 * MIRRR Acne & Blemish Guide for Ethnic Skin
 * Comprehensive coverage of acne types, PIH, hormonal acne,
 * treatments, and community-specific considerations
 */

// ─── ACNE SCIENCE ─────────────────────────────────────────────────────────────

export const ACNE_OVERVIEW = {
  what_is_acne: 'Acne vulgaris is a chronic inflammatory disorder of the pilosebaceous unit (the hair follicle and its attached sebaceous/oil gland). The four primary factors: excess sebum production, comedone formation (clogged follicles), Cutibacterium acnes (formerly P. acnes) bacteria proliferation, and inflammation.',

  acne_types: {
    comedones: {
      open: 'Blackheads — open comedones where the plug has oxidised (not dirt). The black colour is oxidised melanin, not grime.',
      closed: 'Whiteheads — closed comedones covered by skin. Cannot be squeezed without skin damage.',
    },
    inflammatory: {
      papules: 'Small, solid raised bumps — red and tender. Inflammatory lesions without a visible pus head.',
      pustules: 'Papules with a visible pus head — the classic "pimple". White or yellow centre, red base.',
      nodules: 'Large, painful, solid lumps deep in the skin. Not to be squeezed — leave serious scarring.',
      cysts: 'Severe, deep, pus-filled lumps — cystic acne. Highly inflammatory, highest scarring risk.',
    },
    comedonal: 'Predominantly non-inflammatory — whiteheads and blackheads. Common in teens, exacerbated by occlusive products.',
    hormonal: 'Inflammatory, concentrated on jawline, chin, and lower cheeks. Worsens with menstrual cycle, PCOS, stress.',
    fungal: {
      what: 'Malassezia folliculitis — NOT true acne, though it looks identical. A fungal infection of hair follicles.',
      appearance: 'Uniform small papules and pustules, often on forehead, chest, back. Doesn\'t respond to antibacterial treatments.',
      difference: 'True acne has varied lesion sizes (small papules to nodules); fungal acne lesions are uniform.',
      treatment: 'Antifungal — ketoconazole shampoo as wash, oral fluconazole for severe cases.',
    },
  },

  grades: {
    grade_1: 'Comedonal only — whiteheads and blackheads',
    grade_2: 'Mild — comedones plus a few papules/pustules',
    grade_3: 'Moderate — numerous papules and pustules',
    grade_4: 'Severe — nodules, cysts, deep inflammation',
  },
};

// ─── ACNE IN ETHNIC SKIN ──────────────────────────────────────────────────────

export const ACNE_IN_ETHNIC_SKIN = {
  why_different: {
    pih_cycle: 'In darker skin (Fitzpatrick III-VI), the most significant complication of acne is NOT the acne itself — it\'s post-inflammatory hyperpigmentation (PIH). Every inflammatory acne lesion leaves a dark spot that can last 6-18 months or longer. For many people of colour, the lasting PIH marks are more distressing than the active blemishes.',
    sebaceous_glands: 'Research suggests some differences in sebaceous gland structure and activity across ethnicities, though this is not conclusively definitive.',
    inflammation_difference: 'Black skin has been found to have a different inflammatory response profile — some studies suggest greater tendency to keloid and inflammatory scarring, making aggressive treatments riskier.',
  },

  pih_explanation: {
    what: 'Post-inflammatory hyperpigmentation is dark discolouration left after skin trauma — including acne. Melanocytes (pigment-producing cells) overreact to the inflammatory signal, producing excess melanin in and around the healed spot.',
    types: [
      'Epidermal PIH — brown or dark spots in the outer skin layer. Responds to topical brighteners.',
      'Dermal PIH — blue-grey deep discolouration in the dermis. Much harder to treat, takes longer.',
    ],
    who_gets_it: 'Anyone with Fitzpatrick III-VI is at significant risk. The darker the natural skin, the more melanocytes and the more PIH can be produced.',
    timeline: 'Without treatment, epidermal PIH can take 6-24 months to fade. With active treatment, 3-6 months is achievable for mild PIH.',
  },

  acne_keloidalis_nuchae: {
    what: 'A chronic inflammatory condition affecting the nape of the neck (nuchal area), primarily in Black men and men of African descent. Hair follicle inflammation leads to keloid-like scarring plaques. NOT the same as regular acne though it begins similarly.',
    causes: 'Ingrown hairs on the nape (particularly after close shaving or haircuts), combined with the follicular anatomy in coarser, curlier hair types and genetic susceptibility to keloid formation.',
    treatment: 'Topical steroids, intralesional steroids for keloid plaques, retinoids, tetracycline antibiotics, laser for severe cases. Prevention: avoid close shaving at nape, let hair grow out.',
  },
};

// ─── TREATMENT BY ACNE TYPE ───────────────────────────────────────────────────

export const ACNE_TREATMENTS = {
  comedonal: {
    best: 'Retinoids are the gold standard — they regulate cell turnover, prevent comedone formation, and improve PIH simultaneously.',
    products: [
      { ingredient: 'Tretinoin (prescription)', note: 'Most studied and effective retinoid. Start at 0.025%, build to 0.05-0.1%. PIH improvement a major benefit.' },
      { ingredient: 'Adapalene (Differin)', note: 'Available OTC in 0.1% gel — gentler than tretinoin with good evidence. Excellent first retinoid.' },
      { ingredient: 'Tazarotene (prescription)', note: 'Stronger than tretinoin — very effective but higher irritation. Use after other retinoids prove insufficient.' },
      { ingredient: 'Retinol (OTC)', note: 'Convert to retinoic acid in skin — gentler, slower, good for sensitive skin or retinoid beginners.' },
    ],
    salicylic_acid: 'BHA — oil-soluble, penetrates into pores to dissolve sebum plugs. Excellent for comedonal and mild inflammatory acne. 0.5-2% concentration. Use 2-3x weekly to start.',
  },

  inflammatory: {
    benzoyl_peroxide: {
      what: 'Bactericidal — kills C. acnes bacteria. Reduces inflammation. Available 2.5-10% (higher % is not more effective, just more irritating).',
      for_dark_skin: 'CAUTION: Benzoyl peroxide can bleach fabrics and pillowcases (use white bedding). May cause irritant contact dermatitis that leaves PIH on darker skin. Start at 2.5%, use sparingly. Some dermatologists prefer alternatives to benzoyl peroxide for their patients with darker skin given the irritation-PIH risk.',
    },
    niacinamide: 'Anti-inflammatory, helps regulate sebum, reduces PIH — excellent for ethnic skin. 5-10%. Can be used AM and PM. Pairs well with other actives.',
    azelaic_acid: {
      what: 'Dicarboxylic acid — anti-inflammatory AND tyrosinase inhibitor (reduces PIH). The unusual combination of treating active acne and fading PIH simultaneously makes it particularly valuable for ethnic skin.',
      concentration: '10% OTC (The Ordinary, Inkey List), 15-20% prescription (Finacea, Skinoren)',
      note: 'One of the safest choices for darker skin — effective without significant PIH risk from the product itself.',
    },
    antibiotics: {
      topical: 'Clindamycin and erythromycin — reduce bacteria and inflammation. Always combine with benzoyl peroxide or retinoid to prevent antibiotic resistance.',
      oral: 'Doxycycline and minocycline — for moderate-severe inflammatory acne. Minocycline can cause hyperpigmentation after long use (avoid in dark skin for extended courses). Doxycycline is preferred.',
    },
  },

  severe_cystic: {
    oral_retinoids: {
      isotretinoin: {
        what: 'Accutane / Roaccutane — oral retinoid, the most effective acne treatment known. Addresses all four causes of acne simultaneously.',
        effectiveness: '85-90% complete or near-complete clearance after one course',
        for_ethnic_skin: 'Excellent for ethnic skin — dramatically reduces PIH by eliminating the inflammatory acne lesions that cause it. Many dermatologists now consider it for even moderate inflammatory acne in darker skin given the high PIH burden.',
        requirements: 'Prescription only. Monthly blood tests, teratogenic (strict pregnancy prevention required). 5-6 month course.',
      },
    },
    spironolactone: {
      what: 'An anti-androgen medication — reduces sebum production by blocking androgen receptors in sebaceous glands.',
      for_whom: 'Women with hormonal/jawline acne — very effective. Not for men (anti-androgen effects).',
      dose: '50-200mg daily, takes 3 months to see results.',
    },
  },

  hormonal: {
    pattern: 'Cyclical acne around menstrual period, jawline/chin concentration, worsens with stress.',
    first_line: 'Spironolactone (women), combined oral contraceptive pills with anti-androgenic progestins (Diane-35, Yasmin)',
    lifestyle: 'Managing stress reduces cortisol, which reduces androgen-driven sebum production. Adequate sleep is significantly underrated.',
    diet: {
      note: 'Evidence is growing but not definitive. High-glycaemic diet and dairy have the most support for acne worsening.',
      high_gi: 'White rice, white bread, sugary foods spike insulin → increases IGF-1 → increases androgen production → increases sebum. Replacing with low-GI carbs may help some people.',
      dairy: 'Milk (particularly skim milk) has been associated with acne in some studies — possibly due to growth hormones in milk affecting IGF-1.',
      caveat: 'These are individual effects — not everyone with acne is affected by diet. Dietary changes are complementary, not primary treatment.',
    },
  },
};

// ─── PIH TREATMENT ────────────────────────────────────────────────────────────

export const PIH_TREATMENT = {
  principle: 'Treat the acne first — stopping new PIH formation is as important as treating existing marks. A brightening-only approach without addressing active acne is like mopping with the tap still running.',

  topical_brighteners: [
    { ingredient: 'Azelaic acid', note: 'Both treats acne AND fades PIH. Tyrosinase inhibitor. The MVP for acne + PIH in one.', strength: 'Strong', pih_risk: 'Very Low' },
    { ingredient: 'Niacinamide', note: 'Inhibits melanosome transfer from melanocytes to keratinocytes. Gentle, effective at 4-10%.', strength: 'Moderate', pih_risk: 'Very Low' },
    { ingredient: 'Tranexamic acid', note: 'Antifibrinolytic repurposed as brightener — excellent evidence, very well tolerated. 2-5% OTC or prescription.', strength: 'Strong', pih_risk: 'Very Low' },
    { ingredient: 'Kojic acid', note: 'Tyrosinase inhibitor, from fermentation. Works well at 1-4%. Can cause irritation — patch test.', strength: 'Moderate', pih_risk: 'Low' },
    { ingredient: 'Alpha arbutin', note: 'Hydroquinone derivative — gentler, stable. Converts to hydroquinone slowly in skin.', strength: 'Moderate', pih_risk: 'Low' },
    { ingredient: 'Hydroquinone (2-4%)', note: 'The gold standard lightening agent. Prescription in many countries, OTC at 2% in others. Most effective but requires careful use — use under supervision for dark skin, use for 3-6 months then pause, monitor for ochronosis (rare permanent paradoxical darkening).', strength: 'Very Strong', pih_risk: 'Moderate (with misuse)' },
    { ingredient: 'Vitamin C (L-ascorbic acid)', note: 'Antioxidant + tyrosinase inhibitor + collagen synthesis. Helps fade PIH and improves overall skin tone. 10-20% — use in the morning. Unstable — buy from reputable brands.', strength: 'Moderate', pih_risk: 'Very Low' },
    { ingredient: 'Retinoids (tretinoin/adapalene)', note: 'Speed up cell turnover, bringing PIH to surface faster, while treating active acne. Double duty.', strength: 'Strong (long-term)', pih_risk: 'Low (if no irritation)' },
    { ingredient: 'Chemical exfoliants (AHAs)', note: 'Glycolic acid (smallest molecule, deepest penetration), mandelic acid (larger, gentler, more suitable for sensitive ethnic skin), lactic acid. Speed cell turnover and surface PIH clearance. Used 1-3x weekly. At high concentrations or with sensitised skin, AHAs can CAUSE PIH in darker skin — start low (5-7% glycolic or 5% mandelic).', strength: 'Moderate-Strong', pih_risk: 'Moderate (if overused)' },
  ],

  professional_treatments: [
    { treatment: 'Chemical peels', note: 'Superficial peels (Jessner, lactic acid, low % TCA) in experienced hands on darker skin. PIH is a risk if too aggressive or not enough pre-treatment.', safety_for_dark_skin: 'Moderate — needs experienced practitioner' },
    { treatment: 'Microneedling', note: 'Creates controlled micro-injuries to stimulate collagen and improve PIH. Safer for darker skin than laser if settings calibrated correctly.', safety_for_dark_skin: 'Good with experienced practitioner' },
    { treatment: 'Laser treatments', note: 'Q-switched Nd:YAG at 1064nm is the most studied for PIH in dark skin. IPL, ablative lasers very high PIH risk on dark skin. Only with specialist experienced in Fitzpatrick IV-VI.', safety_for_dark_skin: 'Requires specialist — high misuse risk' },
  ],
};

// ─── COMMUNITY-SPECIFIC ACNE GUIDANCE ────────────────────────────────────────

export const ACNE_BY_COMMUNITY = {
  south_asian: {
    context: 'High prevalence of acne in South Asian communities — genetic predisposition to hormonal acne and oily skin is common. PIH particularly problematic on brown skin.',
    cultural_remedies: {
      neem: 'Genuine antibacterial and anti-inflammatory properties — neem oil or neem extract has evidence for mild acne.',
      turmeric: {
        benefits: 'Curcumin has anti-inflammatory properties, mild antibacterial activity.',
        caution: 'Turmeric stains skin yellow and stains fabrics permanently. As a DIY mask, rinse very thoroughly. Curcumin bioavailability through skin is limited.',
      },
      multani_mitti: 'Fuller\'s earth clay — good for oil absorption, can be overly drying if overused.',
    },
    avoid: 'Harsh scrubs — popular in South Asian beauty routines but traumatise skin, worsening PIH. Replace with chemical exfoliation.',
  },

  black_american: {
    context: 'Acne in Black skin carries the highest PIH burden of any group in the US. The aftermarks persist longer and are often more concerning than active pimples. Black patients are also most likely to present to dermatologist for PIH rather than active acne — by which point there is a long history of acne-induced damage.',
    products: {
      black_owned: [
        'Topicals Faded Serum — specifically formulated for PIH in Black skin (azelaic acid, niacinamide, tranexamic acid)',
        'DRMTLGY Needle-less Serum — well-tolerated brightening for deeper skin',
      ],
    },
    barbershop_acne: 'Pseudofolliculitis barbae (razor bumps) is extremely common in Black men — often misidentified as acne. Different cause (ingrown hair), different treatment. See the protective styling/hair guide for full coverage.',
  },

  arab: {
    context: 'High humidity in the Gulf + oil-rich diet + genetic tendency to hormonal acne. Also the intersection with hammam culture — regular exfoliation in the hammam can help, but aggressive kese glove use on active acne worsens inflammation.',
    traditional: {
      argan_oil_caution: 'Pure argan oil is 0 on the comedogenicity scale — suitable for some skin types despite being an oil. However, many argan oil products mix it with comedogenic ingredients. Read labels.',
      nigella: 'Black seed (Nigella sativa) oil — some evidence for anti-inflammatory effects on acne. Generally non-comedogenic.',
    },
  },

  east_asian: {
    context: 'K-beauty and J-beauty have extensive lines for acne-prone skin. Some of the best-formulated, least-irritating acne products globally come from Korea and Japan.',
    k_beauty_solutions: [
      'COSRX BHA Blackhead Power Liquid — excellent, gentle salicylic acid exfoliant',
      'COSRX Acne-Free Master Gel — niacinamide + soothing',
      'Some By Mi AHA-BHA-PHA Toner — comprehensive gentle exfoliant',
      'Pyunkang Yul Acne Cream — centella-based, very gentle for inflamed skin',
    ],
    ingredients: 'Centella asiatica (cica), snail mucin (promotes healing, reduces inflammation), propolis, green tea — all have evidence for acne-prone skin and are well-tolerated on Asian skin.',
  },

  caribbean: {
    context: 'Afro-Caribbean communities share the acne + PIH challenge. Traditional use of aloe vera is scientifically supported for both soothing inflammation and mild antibacterial activity.',
    traditional: {
      aloe: 'Fresh aloe vera gel — anti-inflammatory, soothing, mild antibacterial. Effective complementary treatment especially for inflamed papules.',
      sea_buckthorn: 'Caribbean and South American traditions — rich in vitamins C, E, and beta-carotene. Topically applied as oil — anti-inflammatory.',
    },
  },
};

// ─── PRODUCT RECOMMENDATIONS ──────────────────────────────────────────────────

export const ACNE_PRODUCT_GUIDE = {
  cleansers: [
    { product: 'CeraVe Foaming Cleanser', note: 'Gentle daily cleanser for oily, acne-prone skin. Ceramides maintain barrier.', best_for: 'All types' },
    { product: 'La Roche-Posay Effaclar Gel', note: 'Salicylic acid cleanser — excellent for comedonal and mild inflammatory.', best_for: 'Comedonal, mild inflammatory' },
    { product: 'Panoxyl 4% Creamy Wash', note: 'Benzoyl peroxide wash — very effective. Use on chin/forehead only if reactive.', best_for: 'Inflammatory acne body+face' },
    { product: 'COSRX Low pH Good Morning Gel Cleanser', note: 'Maintains optimal skin pH for actives. Fragrance-free.', best_for: 'All types, especially if using chemical exfoliants' },
  ],
  spot_treatments: [
    { product: 'Differin (adapalene 0.1%)', note: 'OTC retinoid — excellent long-term preventive and PIH treatment', best_for: 'All types' },
    { product: 'The Ordinary Azelaic Acid 10%', note: 'Suspension — acne + PIH in one step', best_for: 'Dark skin with PIH' },
    { product: 'Dot & Key Waterlight Gel SPF 50', note: 'Indian brand — matte finish, no white cast, acne-safe', best_for: 'South Asian, dark skin' },
    { product: 'Topicals Faded Serum', note: 'Black-owned, formulated specifically for PIH in melanin-rich skin', best_for: 'Black American, Caribbean, West African' },
  ],
};

// ─── ROUTINE APPROACH ─────────────────────────────────────────────────────────

export const ACNE_ROUTINE_GUIDE = {
  basic: {
    am: ['Gentle cleanser', 'Niacinamide serum', 'Lightweight oil-free moisturiser', 'SPF 30+ (essential — UV worsens PIH)'],
    pm: ['Gentle cleanser', 'BHA or azelaic acid (alternate days at first)', 'Retinoid (start 2x weekly, build)', 'Lightweight moisturiser'],
  },
  pih_focused: {
    am: ['Gentle cleanser', 'Vitamin C (L-ascorbic acid 10-15%)', 'Niacinamide', 'Moisturiser', 'SPF 50'],
    pm: ['Gentle cleanser', 'Azelaic acid or tranexamic acid', 'Tretinoin (if tolerated)', 'Ceramide moisturiser'],
  },
  what_not_to_do: [
    'DO NOT squeeze, pop or pick — spreads bacteria, deepens PIH, causes scarring',
    'DO NOT use physical scrubs — micro-tears worsen inflammation and PIH',
    'DO NOT skip SPF — UV dramatically worsens PIH and slows healing',
    'DO NOT use multiple actives simultaneously when starting — causes irritation and PIH',
    'DO NOT over-cleanse — twice daily maximum, once if skin is dry',
    'DO NOT use thick occlusive moisturisers if prone to comedonal acne — use oil-free, non-comedogenic',
  ],
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getAcneOverview() {
  return ACNE_OVERVIEW;
}

export function getAcneInEthnicSkin() {
  return ACNE_IN_ETHNIC_SKIN;
}

export function getAcneTreatments(type) {
  if (type && ACNE_TREATMENTS[type]) return ACNE_TREATMENTS[type];
  return ACNE_TREATMENTS;
}

export function getPIHTreatmentGuide() {
  return PIH_TREATMENT;
}

export function getAcneGuideForCommunity(communityId) {
  return ACNE_BY_COMMUNITY[communityId] || null;
}

export function getAcneProductGuide() {
  return ACNE_PRODUCT_GUIDE;
}

export function getAcneRoutine(focus) {
  if (focus === 'pih') return ACNE_ROUTINE_GUIDE.pih_focused;
  return ACNE_ROUTINE_GUIDE.basic;
}

export const ACNE_GUIDE_STATS = {
  acneTypes: Object.keys(ACNE_OVERVIEW.acne_types).length,
  treatmentsListed: Object.keys(ACNE_TREATMENTS).length,
  communitiesCovered: Object.keys(ACNE_BY_COMMUNITY).length,
  pihBrighteners: PIH_TREATMENT.topical_brighteners.length,
};
