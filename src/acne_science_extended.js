/**
 * MIRRR Acne Science Extended
 * Types of acne, comedones, cystic, hormonal, treatment ladders,
 * ethnic skin acne differences, and PIH prevention
 */

// ─── ACNE OVERVIEW ────────────────────────────────────────────────────────────

export const ACNE_OVERVIEW = {
  definition: 'Acne vulgaris is a chronic, inflammatory skin condition involving the pilosebaceous unit (hair follicle + sebaceous gland). It is one of the most common skin conditions globally — affecting up to 85% of people aged 12-24 and increasingly prevalent in adult women.',
  cause_components: {
    sebum: 'Sebaceous glands produce sebum (skin oil). In acne-prone skin, sebum production is typically elevated (androgenic stimulation) or the sebum composition is altered.',
    follicle_hyperkeratinisation: 'The inner lining of the follicle sheds skin cells. In acne-prone skin, these cells are shed abnormally and accumulate inside the follicle, mixing with sebum to form a plug (microcomedone — the precursor to all visible acne).',
    bacteria: 'Cutibacterium acnes (formerly Propionibacterium acnes) is a bacterium that lives in hair follicles. It feeds on sebum and, when follicles are plugged, can proliferate and trigger an inflammatory response.',
    inflammation: 'The immune response to C. acnes (or to the comedone rupturing into surrounding skin tissue) causes the redness, swelling, pain, and pus characteristic of inflammatory acne.',
  },
  acne_prone_misconceptions: {
    diet: 'The evidence for diet-acne links is modest. High glycaemic index foods and dairy (particularly skim milk) have the most consistent evidence for mild acne exacerbation in some individuals. Greasy food touching your skin does not cause acne.',
    hygiene: 'Acne is not caused by being dirty. Over-washing can worsen acne by irritating skin and disrupting the barrier.',
    sun: 'Sun exposure may temporarily improve some acne (UV kills bacteria, masks redness) but also thickens the skin surface, potentially worsening comedones, and increases PIH risk — particularly for Fitzpatrick III-VI.',
    picking: 'Picking ruptures the follicle wall, pushes contents into surrounding tissue, worsens inflammation, and significantly increases PIH and scarring risk.',
  },
};

// ─── TYPES OF ACNE ────────────────────────────────────────────────────────────

export const ACNE_TYPES = {
  microcomedone: {
    name: 'Microcomedone',
    visible: false,
    description: 'The precursor to all visible acne. A microscopic plug of dead cells and sebum within the follicle. Not yet visible to the naked eye. All visible acne begins as a microcomedone.',
    treatment: 'Retinoids (vitamin A derivatives) are the gold standard for preventing microcomedone formation — they normalise follicle cell turnover.',
  },
  open_comedone: {
    name: 'Open Comedone (Blackhead)',
    visible: true,
    description: 'A blackhead. The follicle is dilated with a plug of sebum and dead cells — but the surface is OPEN. The black colour is NOT dirt. It is the oxidation of melanin and lipids in the sebum plug when exposed to air. Blackheads are non-inflammatory — they do not hurt or have redness.',
    treatment: 'BHA (salicylic acid) — oil-soluble, penetrates into the follicle to dissolve the plug. Retinoids. Clay masks. Do not squeeze blackheads — this can push the plug deeper. Professional extraction by aesthetician is appropriate.',
    common_locations: 'Nose (especially the t-zone), chin, cheeks.',
  },
  closed_comedone: {
    name: 'Closed Comedone (Whitehead)',
    visible: true,
    description: 'A whitehead. The follicle is plugged and the surface is CLOSED. A small, white or flesh-coloured bump. Non-inflammatory (no redness). The plug cannot oxidise because it is not exposed to air, so it remains white.',
    treatment: 'Retinoids (most effective). BHA. Gentle exfoliation (AHA). Do not pick — whiteheads do not have a large opening and picking causes trauma.',
    common_locations: 'Chin, forehead, sides of cheeks.',
  },
  papule: {
    name: 'Papule',
    visible: true,
    description: 'A small, raised, red bump — less than 5mm in diameter. A comesdone that has become inflamed. No visible pus. The redness and elevation are due to immune response.',
    treatment: 'Topical retinoids. Topical antibiotics (with benzoyl peroxide to prevent resistance). Benzoyl peroxide alone. BHA.',
    note: 'Papules transition to pustules if inflammation continues or the follicle wall breaks.',
  },
  pustule: {
    name: 'Pustule',
    visible: true,
    description: 'A papule with a white/yellow visible pus head — a collection of neutrophils (white blood cells fighting the C. acnes bacteria). The "classic" pimple. Still less than 5mm.',
    treatment: 'Same as papule. A pustule that has come to a head can be extracted correctly (after gentle warmth to soften, clean hands or tools, very gentle pressure from the side — not squeezing from top). Never force a pustule that has not come to a head.',
  },
  nodule: {
    name: 'Nodule',
    visible: true,
    description: 'A large, solid, painful, deep bump — more than 5mm in diameter. Involves deeper layers of the skin (extends into the dermis). Does not come to a head. Firm to the touch.',
    treatment: 'Prescription treatments: topical/oral antibiotics. Oral retinoids (isotretinoin/Accutane for recurrent nodular acne). Intralesional corticosteroid injection from a dermatologist for rapid resolution.',
    scarring_risk: 'High. Nodules should not be picked or squeezed. Professional treatment is recommended.',
  },
  cyst: {
    name: 'Cystic Acne / Nodulocystic',
    visible: true,
    description: 'The most severe form. Large, deep, painful, pus-filled lesions — sometimes over 5mm. Can last weeks to months. Involves a rupture of the follicle wall deep in the dermis, releasing contents into surrounding tissue and triggering a significant inflammatory response.',
    treatment: 'Oral isotretinoin (Accutane/Roaccutane) is the most effective treatment for severe cystic acne — it addresses all four causes simultaneously. Oral antibiotics as shorter-term treatment. Spironolactone for hormonal cystic acne in women.',
    scarring_risk: 'Very high. Cystic acne often leaves permanent scarring if untreated or if lesions are manipulated.',
  },
};

// ─── ACNE LOCATIONS ───────────────────────────────────────────────────────────

export const ACNE_LOCATIONS = {
  forehead: {
    area: 'Forehead',
    possible_causes: ['Haircare products (pomades, thick hair products, dry shampoo) migrating onto forehead', 'Hair touching forehead (bangs)', 'Pillowcase friction', 'Phone touching forehead', 'Stress (forehead is common stress acne zone)', 'Digestive issues in some Traditional Chinese Medicine interpretations'],
    solutions: ['Non-comedogenic hair products', 'Clean pillowcases frequently', 'Clean phone screen', 'BHA toner on forehead'],
  },
  nose: {
    area: 'Nose / T-Zone',
    possible_causes: ['Highest sebaceous gland density', 'Blackheads (open comedones) are very common here due to naturally larger pores', 'Congestion from maskne'],
    solutions: ['BHA (salicylic acid)', 'Clay masks', 'Non-comodogenic products', 'Professional extractions'],
  },
  cheeks: {
    area: 'Cheeks',
    possible_causes: ['Pillow case (change 2x weekly)', 'Phone screen (bacteria)', 'Hands touching face', 'Dirty makeup brushes', 'Silicone-based makeup products clogging pores in some skin types'],
    solutions: ['Frequent pillowcase changes', 'Clean phone and hands', 'Clean makeup brushes weekly'],
  },
  jawline_chin: {
    area: 'Jawline and Chin (Lower Face)',
    possible_causes: ['Hormonal acne — the most classic location. Responsive to androgens. In women: flares before menstruation (luteal phase, days 14-28)', 'Polycystic ovarian syndrome (PCOS)', 'Stopping oral contraceptives (rebound androgen activity)', 'Stress (cortisol stimulates androgens)'],
    solutions: ['See a doctor for hormonal evaluation if persistent', 'Spironolactone (prescribed, hormonal blocker)', 'Combined oral contraceptive pill (for women, prescribed)', 'Inositol supplementation has some evidence for PCOS-related acne'],
  },
  back_and_chest: {
    area: 'Back and Chest (Bacne)',
    possible_causes: ['High density of sebaceous glands on back', 'Sweat and friction from exercise clothes', 'Pore-clogging sunscreen (particularly back during summer)', 'Backpack straps', 'Sitting in sweaty clothes after exercise'],
    solutions: ['Shower immediately after exercise', 'Use BHA body wash on affected areas', 'Non-comedogenic sunscreen', 'Change out of gym clothes promptly'],
  },
};

// ─── HORMONAL ACNE ────────────────────────────────────────────────────────────

export const HORMONAL_ACNE = {
  definition: 'Acne driven primarily by androgen hormones (testosterone, DHEA). In women, this typically presents as cyclical breakouts (tied to the menstrual cycle), primarily on the lower face (jawline, chin, occasionally neck). It is the dominant acne pattern in adult women.',
  the_cycle: {
    week1_2: 'Follicular phase (days 1-14, post-period to ovulation): estrogen is rising and at its highest around ovulation. Estrogen has anti-sebum effects. Skin is often clearest in this phase.',
    week3: 'Early luteal phase (days 14-21): progesterone rises after ovulation. Progesterone stimulates sebum. Skin starts getting oilier.',
    week4: 'Late luteal phase (days 21-28, premenstrual): testosterone peaks relative to estrogen (estrogen drops). Testosterone is the primary driver of sebum production. Skin is most acne-prone. Breakouts emerge 5-7 days before period.',
    period: 'Menstruation (days 1-5): hormone levels fall. Inflammation may still be peaking from premenstrual breakouts. Some improvement begins as the next follicular phase starts.',
  },
  treatments: {
    topical: 'Same topicals as all acne (retinoids, BHA, benzoyl peroxide). Topicals do not address the root hormonal cause but manage the skin surface.',
    spironolactone: 'An anti-androgen medication (originally a blood pressure drug) that blocks androgen receptors in sebaceous glands. Prescribed off-label in many countries for hormonal acne in women. Very effective for cyclical jawline/chin acne. Not suitable for women planning pregnancy.',
    ocp: 'Oral contraceptive pill: combined (estrogen + progestogen) OCPs suppress androgen production. Acne-clearing effect well established. Takes 3-6 months to see full effect. Progestogen-only pills can WORSEN acne in some women.',
    isotretinoin: 'For severe hormonal acne that has not responded to other treatments.',
    supplements: {
      inositol: 'Myo-inositol and d-chiro-inositol have evidence for improving insulin sensitivity and reducing androgens in PCOS — addressing hormonal acne at a root cause. Particularly relevant for PCOS-related acne.',
      spearmint_tea: '2 cups of spearmint tea daily has some evidence for mild anti-androgen effect (limited studies, no harm, low risk).',
      zinc: 'Zinc gluconate has modest evidence for acne reduction — anti-inflammatory and mild anti-androgen effect.',
    },
  },
};

// ─── TREATMENT LADDER ─────────────────────────────────────────────────────────

export const ACNE_TREATMENT_LADDER = {
  overview: 'Acne treatment follows a stepwise "ladder" approach — starting with the least potent, lowest-risk interventions and escalating based on severity and response.',
  step1: {
    level: 'Mild acne / First line (OTC)',
    products: ['Salicylic acid (BHA) 0.5-2% — cleanser or leave-on serum', 'Benzoyl peroxide 2.5-5% — kills C. acnes, reduces inflammation', 'Niacinamide 10% — sebum regulation, anti-inflammatory, reduces PIH', 'Retinol 0.025-0.3% (OTC strength retinoids)'],
    timeline: '8-12 weeks to see results. Patience is required.',
  },
  step2: {
    level: 'Mild-moderate acne / Prescription topicals',
    products: ['Tretinoin (Retin-A) 0.025-0.1% — prescription retinoid; much more potent than OTC retinol', 'Adapalene 0.1-0.3% (OTC in US at 0.1%; prescription at 0.3%)', 'Topical clindamycin or erythromycin (antibiotics) — always combined with benzoyl peroxide to prevent resistance', 'Azelaic acid 15-20% — anti-inflammatory, anti-comedogenic, and reduces PIH (particularly valuable for Fitzpatrick III-VI)'],
    timeline: '8-12 weeks.',
  },
  step3: {
    level: 'Moderate-severe acne / Oral medications',
    medications: ['Oral antibiotics (doxycycline or minocycline): used short-term (3-6 months) with topical BP to prevent resistance', 'Spironolactone (women only): for hormonal acne', 'Combined oral contraceptive (women): for hormonal acne', 'Dapsone 5-7.5% topical: particularly for adult female acne'],
    timeline: '6-12 weeks to see improvement; 3-6 months of treatment.',
  },
  step4: {
    level: 'Severe / Nodulocystic acne / Isotretinoin',
    about: 'Oral isotretinoin (brand names: Accutane, Roaccutane, Epuris). Vitamin A derivative. The only treatment that addresses all four causes of acne simultaneously: reduces sebum production by up to 80%, normalises follicle keratinisation, reduces C. acnes, anti-inflammatory. 20-30% of patients have lasting remission after one course; others may need a second course.',
    requirements: 'Requires strict monitoring (liver function, lipids, pregnancy prevention — isotretinoin causes severe birth defects; women must use two forms of contraception). In Canada: iPLEDGE / Accutane distribution programme. Monthly blood tests typically required.',
    side_effects: 'Dry lips, eyes, and skin (near-universal), muscle aches, sun sensitivity, initial flare (can be significant in first 4-6 weeks). Mental health monitoring is recommended.',
  },
  procedures: {
    chemical_peels: 'Salicylic acid, glycolic acid, or Jessner solution peels performed by aesthetician or dermatologist. Reduce active acne and PIH.',
    laser: 'Blue light (kills C. acnes), PDT photodynamic therapy, pulsed dye laser for active acne.',
    corticosteroid_injection: 'An intralesional cortisone injection can flatten a large cyst within 24-48 hours. Dermatologist procedure.',
    extraction: 'Professional extractions of comedones and mature pustules. Do not self-extract deep or unprepared lesions.',
  },
};

// ─── PIH FROM ACNE ────────────────────────────────────────────────────────────

export const ACNE_PIH = {
  overview: 'Post-Inflammatory Hyperpigmentation (PIH) from acne is the dark spot left behind after an acne lesion heals. It is caused by an overproduction of melanin triggered by the skin inflammation. PIH is NOT a scar — it is a discoloration that WILL fade, but can take months to years without treatment. It is disproportionately severe and long-lasting in Fitzpatrick IV-VI.',
  fitzpatrick_risk: {
    IV: 'Medium brown skin — PIH risk moderate to high. Any inflammatory acne (papule, pustule, cyst) can leave a dark mark.',
    V: 'Brown to deep brown — PIH risk very high. Even minor inflammatory lesions leave significant dark marks. PIH can persist for 12-24 months without treatment.',
    VI: 'Deep brown to black — PIH risk extremely high. Dark marks are very prominent against the skin tone. The goal is to treat acne aggressively EARLY to prevent PIH from forming.',
  },
  prevention: {
    primary: 'The best prevention for PIH is preventing inflammatory acne lesions in the first place. Treating non-inflammatory comedones before they become inflammatory lesions.',
    no_picking: 'The most important rule: do NOT pick, pop, or squeeze lesions. Picking ruptures the follicle wall deep in the dermis, massively increases inflammation, and dramatically worsens PIH.',
    spf: 'SPF is mandatory for PIH-prone skin. UV exposure darkens existing PIH. An SPF of 30-50 daily dramatically accelerates PIH fading.',
  },
  treatment: {
    azelaic_acid: 'Azelaic acid 10-20%: anti-inflammatory, anti-acne, AND directly inhibits tyrosinase (the enzyme that produces melanin). Treats acne and PIH simultaneously. Safe in pregnancy. First choice for dark skin PIH.',
    niacinamide: 'Niacinamide 5-10%: inhibits melanin transfer to skin cells. Reduces the appearance of PIH over 8-12 weeks. Also regulates sebum, reducing acne formation.',
    vitamin_c: 'Vitamin C (L-ascorbic acid or stabilised forms): antioxidant that inhibits melanin formation. Also a tyrosinase inhibitor.',
    retinoids: 'Tretinoin and adapalene: increase cell turnover, which speeds fading of PIH. Also prevent future acne. Vitamin A is the cornerstone of PIH treatment in acne-prone skin.',
    hydroquinone: 'Hydroquinone 2% (OTC) or 4% (prescription): highly effective tyrosinase inhibitor. Can be used short-term (12 weeks cycles). Should not be used long-term without breaks. Available in The Ordinary, Neostrata, and prescription compounds.',
    kojic_acid: 'Kojic acid: natural tyrosinase inhibitor from fermentation. Gentler than hydroquinone. Often combined with other brightening actives.',
    chemical_peels: 'Mandelic acid peels, salicylic acid peels, and glycolic acid peels all help fade PIH through accelerated cell turnover. Must be performed carefully on Fitzpatrick V-VI.',
  },
};

// ─── ETHNIC ACNE ──────────────────────────────────────────────────────────────

export const ETHNIC_ACNE = {
  west_african: {
    community: 'West African',
    notes: 'Black soap (ose dudu) is used as an acne treatment in West African communities — contains anti-bacterial plant ash (from plantain skin, cocoa pod, etc.). High PIH risk — treating acne early and avoiding picking is critical. Very dark marks can persist for years without treatment.',
    concern: 'PIH is the primary acne-related concern in West African and Black American communities — the scar, not the pimple.',
  },
  south_asian: {
    community: 'South Asian',
    notes: 'Hormonal acne is common in South Asian women. PCOS is more prevalent in South Asian populations, contributing to androgen-driven breakouts. Turmeric masks (traditional) have some evidence for anti-inflammatory effect. Neem oil is used traditionally as an antimicrobial treatment.',
    concern: 'Hormonal jawline acne + PIH risk (medium-high for Fitzpatrick IV South Asian skin).',
  },
  caribbean: {
    community: 'Caribbean',
    notes: 'Lime juice applied to acne is a traditional Caribbean remedy — this carries phytophotodermatitis risk (lime juice + sun = severe burns/PIH). Caution strongly advised. Aloe vera gel is a safe, effective anti-inflammatory alternative.',
    concern: 'PIH risk. Avoid phototoxic DIY treatments.',
  },
  arab: {
    community: 'Arab',
    notes: 'Thick foundation traditions can contribute to comedone formation. Rose water as a toner has mild antibacterial properties. The hammam tradition (deep exfoliation) can help with congested skin when gentle enough.',
    concern: 'Non-comedogenic products are important. PIH risk moderate-high.',
  },
  east_asian: {
    community: 'East Asian',
    notes: 'East Asian skin typically has lower PIH risk than Fitzpatrick IV-VI skin but PIH is still a concern for Fitzpatrick III-IV East Asian skin. The 10-step K-Beauty routine can be adapted for acne: oil cleanser + foaming cleanser + BHA toner + niacinamide serum + light moisturiser + SPF.',
    concern: 'Closed comedones (whiteheads) are common in East Asian skin due to naturally low porosity. Retinoids are highly effective for this pattern.',
  },
  black_american: {
    community: 'Black American',
    notes: 'PIH is the dominant concern. A dermatologist survey found Black patients most often present about dark spots, not acne — because the marks last longer and are more prominent than the acne itself. Azelaic acid and niacinamide are first-choice actives. Heavy, occlusive products (particularly coconut oil) can be comedogenic on acne-prone skin despite the cultural tradition.',
    concern: 'PIH prevention and treatment is as important as acne treatment itself.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getAcneOverview() { return ACNE_OVERVIEW; }
export function getAcneType(type) {
  return type ? ACNE_TYPES[type] : ACNE_TYPES;
}
export function getAcneLocation(location) {
  return location ? ACNE_LOCATIONS[location] : ACNE_LOCATIONS;
}
export function getHormonalAcne() { return HORMONAL_ACNE; }
export function getAcneTreatmentLadder(step) {
  if (step) return ACNE_TREATMENT_LADDER[`step${step}`] || ACNE_TREATMENT_LADDER.procedures;
  return ACNE_TREATMENT_LADDER;
}
export function getAcnePIH() { return ACNE_PIH; }
export function getEthnicAcne(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_ACNE[key] || Object.values(ETHNIC_ACNE);
}

export const ACNE_SCIENCE_STATS = {
  acneTypes: Object.keys(ACNE_TYPES).length,
  locations: Object.keys(ACNE_LOCATIONS).length,
  treatmentSteps: 4,
  ethnicCommunities: Object.keys(ETHNIC_ACNE).length,
};
