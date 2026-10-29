/**
 * MIRRR Skin Barrier Guide
 * Understanding and repairing the skin's moisture barrier
 * With special focus on how barrier function differs in melanin-rich skin
 */

// ─── SKIN BARRIER FUNDAMENTALS ───────────────────────────────────────────────

export const SKIN_BARRIER_BASICS = {
  whatIsIt: {
    definition: 'The skin barrier — formally called the stratum corneum — is the outermost layer of skin. It consists of skin cells (corneocytes) held together by lipids (fats) in a structure often described as "bricks and mortar": cells are the bricks; lipid matrix is the mortar.',
    functions: [
      'Keeps water in (prevents transepidermal water loss — TEWL)',
      'Keeps irritants, allergens, and bacteria out',
      'Regulates what penetrates into deeper skin layers',
      'Maintains skin\'s acid mantle (natural pH ~4.5–5.5)',
    ],
    composition: {
      ceramides: 'Essential fatty acids that make up ~50% of the lipid matrix — the single most important barrier lipid',
      cholesterol: '~25% of lipid matrix — helps maintain fluidity and permeability',
      fatty_acids: '~15% of lipid matrix — especially oleic acid and linoleic acid',
      naturalMoisturisers: 'NMF (Natural Moisturising Factors) — amino acids, urea, lactic acid, sodium PCA — attract water into the cells',
    },
  },
  damageAndRepair: {
    whatDamagesIt: [
      'Over-cleansing with harsh sulfate detergents',
      'Hot water — strips lipids from the skin surface',
      'Over-exfoliating (physical scrubs or excessive acid use)',
      'Very low or very high humidity environments',
      'UV radiation — degrades lipids in the barrier',
      'Alcohol-heavy toners (ethanol/isopropanol)',
      'Fragrance in skincare — a leading cause of contact sensitisation',
      'Retinol — can impair barrier short-term if introduced too fast',
      'Stress — cortisol degrades barrier function',
      'Poor sleep — barrier repair peaks at night; deprivation impairs it',
    ],
    signsOfDamage: {
      immediate: ['Tightness after cleansing', 'Redness', 'Stinging when applying products', 'Burning sensation', 'Extreme sensitivity'],
      developing: ['Dryness and flaking', 'Dullness', 'Itching', 'Rough texture', 'Uneven skin tone'],
      chronic: ['Eczema flares', 'Perioral dermatitis', 'Rosacea', 'Increased acne (bacteria enter easier)', 'Psoriasis worsening'],
    },
    repairTimeline: {
      mild: '2–4 weeks with correct barrier repair protocol',
      moderate: '4–8 weeks',
      severe: '8–12 weeks; may require dermatologist support (prescription barrier repair)',
    },
  },
};

// ─── HOW BARRIER FUNCTION DIFFERS IN MELANIN-RICH SKIN ───────────────────────

export const MELANIN_RICH_BARRIER = {
  overview: 'Research comparing skin barrier function across Fitzpatrick types reveals important differences — the beauty industry has historically ignored these distinctions.',
  differences: {
    ceramide_levels: {
      finding: 'Multiple studies show that Black/African-descent skin tends to have lower ceramide levels in the stratum corneum than white skin, despite being perceived as more "resilient" — a myth with serious implications.',
      implication: 'Lower baseline ceramides = higher vulnerability to transepidermal water loss. More ceramide-rich products are needed, not fewer.',
      source: 'Rawlings AV (2006). Ethnic skin types: are there differences in skin structure and function? Int J Cosmet Sci.',
    },
    tewl: {
      finding: 'TEWL (transepidermal water loss) is measurably higher in Black skin in several studies — contradicting the stereotype that darker skin is naturally more moisturised.',
      implication: 'Black skin may need MORE moisturisation, not less. The stereotype of "oily skin" among darker skin types should not translate to skipping moisturiser.',
    },
    inflammation: {
      finding: 'Darker skin tones (Fitzpatrick IV-VI) have different inflammatory responses — they may not show visible redness even during active barrier disruption.',
      implication: 'Damage can be occurring without the classic "red flags." Melanin-rich people should take barrier stinging or tightness VERY seriously even without visible redness.',
    },
    pih_link: {
      finding: 'Compromised barrier function is directly linked to increased PIH (post-inflammatory hyperpigmentation) in darker skin tones. Any inflammation — including mild over-exfoliation — is far more likely to leave lasting dark marks.',
      implication: 'Barrier repair should be the TOP priority for Fitzpatrick IV-VI before targeting pigmentation. A damaged barrier during a PIH treatment makes the PIH worse.',
    },
  },
  ethnicSpecificBarrierConcerns: {
    west_african: ['Dehydration despite appearance of oily skin', 'PIH from barrier disruption', 'Ashy skin = severe transepidermal water loss visible through melanin'],
    south_asian: ['Compromised barrier from turmeric diy overuse (too alkaline)', 'Barrier disruption from scrubbing (ubtan)', 'Olive/warm skin tones showing less visible inflammation'],
    east_asian: ['Generally stronger barrier (multiple studies, but not universal)', 'Aquaporin-3 activity variations', 'Climate humidity differences (Korean humid summers vs Japanese coastal climate)'],
    arab: ['Desert climate = low humidity stress on barrier', 'Heavy fragrance use can sensitise compromised barriers', 'Mineral-rich water in Gulf region can disrupt acid mantle'],
    latina: ['Mixed Fitzpatrick variation means different barrier needs in the same family', 'High-humidity Latin American climates can support barrier'],
  },
};

// ─── THE BARRIER REPAIR PROTOCOL ─────────────────────────────────────────────

export const BARRIER_REPAIR_PROTOCOL = {
  phase1: {
    name: 'Phase 1: Triage (Week 1–2)',
    tagline: 'Stop the damage first',
    actions: [
      { do: 'Switch to a gentle, pH-balanced cleanser (4.5–5.5 pH)', why: 'Harsh cleansers strip the lipid layer' },
      { do: 'Pause ALL actives: retinol, acids, Vitamin C serums, exfoliants', why: 'Active ingredients are inflammatory during barrier damage' },
      { do: 'Wash face with lukewarm water only — never hot', why: 'Hot water melts the lipid mortar' },
      { do: 'Pat — never rub — dry with a clean cloth', why: 'Friction damages corneum cells' },
      { do: 'Apply moisturiser to slightly damp skin (within 60 seconds of patting dry)', why: 'Damp application seals in water before TEWL occurs' },
      { do: 'Use a heavy occlusive at night (petroleum jelly/Vaseline, CeraVe Healing Ointment)', why: 'Occlusives prevent TEWL during barrier-repair sleep phase' },
    ],
    avoid: [
      'Physical scrubs or exfoliating brushes',
      'Alcohol-heavy toners',
      'New products of any kind (patch test later)',
      'Fragrance (known irritant when barrier is compromised)',
      'Vitamin C (acidic — stings and irritates damaged barrier)',
      'Over-washing (twice daily max; once if very dry)',
    ],
    cleansers: [
      { name: 'CeraVe Hydrating Cleanser', price: '$15', why: 'pH 5.5, ceramides added, gentle' },
      { name: 'La Roche-Posay Toleriane Hydrating Gentle Cleanser', price: '$18', why: 'Dermatologist-favourite, minimal ingredients' },
      { name: 'Vanicream Gentle Facial Cleanser', price: '$10', why: 'Free of dyes, fragrances, formaldehyde-releasers' },
      { name: 'African Black Soap (gentle formulation)', price: '$8', why: 'Traditional barrier-supportive wash for melanin-rich skin' },
    ],
  },
  phase2: {
    name: 'Phase 2: Rebuild (Week 2–6)',
    tagline: 'Feed the barrier what it needs',
    ingredients: {
      ceramides: {
        what: 'Lipid molecules that make up the mortar of the barrier. Types: Ceramide 1 (EOP), Ceramide 3 (NP), Ceramide 6-II (AP) are the most important.',
        products: [
          { name: 'CeraVe Moisturising Cream', price: '$20', note: '3 ceramides + MVE delivery technology' },
          { name: 'Elizabeth Arden Advanced Ceramide Capsules', price: '$72', note: 'Luxury concentrated ceramide treatment' },
          { name: 'Dr. Jart+ Ceramidin Cream', price: '$48', note: 'Korean beauty ceramide benchmark' },
        ],
      },
      hyaluronic_acid: {
        what: 'Humectant — draws water into the skin. Works best applied to damp skin then sealed with an occlusive/emollient.',
        lowMolecularWeight: 'Penetrates deeper — more powerful but can cause irritation in damaged skin',
        highMolecularWeight: 'Sits on surface — gentler, better for damaged barrier',
        products: [
          { name: 'The Ordinary Hyaluronic Acid 2% + B5', price: '$10' },
          { name: 'Neutrogena Hydro Boost Water Gel', price: '$25', note: 'Cult favourite HA moisturiser' },
          { name: 'Vichy Mineral 89 Hyaluronic Acid Serum', price: '$32' },
        ],
      },
      niacinamide: {
        what: 'Vitamin B3 — one of the most multi-functional barrier ingredients. Stimulates ceramide production, reduces TEWL, treats PIH, regulates sebum.',
        idealConcentration: '5% for daily barrier support; 10%+ for PIH — start at 5% on damaged barrier',
        products: [
          { name: 'The Ordinary Niacinamide 10% + Zinc 1%', price: '$7' },
          { name: 'Paula\'s Choice 10% Niacinamide Booster', price: '$44' },
          { name: 'Good Molecules Niacinamide Serum', price: '$12' },
        ],
      },
      panthenol: {
        what: 'Vitamin B5 — converts to pantothenic acid in skin. Humectant and skin-repairing. Especially good for sensitive or compromised barriers.',
        products: [
          { name: 'Dr. Jart+ Cicapair Tiger Grass Serum', price: '$52' },
          { name: 'La Roche-Posay Cicaplast Baume B5', price: '$19' },
        ],
      },
      centella_asiatica: {
        what: 'Cica / Tiger grass — a staple Korean and Asian traditional ingredient now in global skincare. Anti-inflammatory, wound healing, barrier supporting.',
        compounds: 'Madecassoside and asiaticoside are the active compounds',
        products: [
          { name: 'COSRX Centella Blemish Cream', price: '$22' },
          { name: 'Dr. Jart+ Cicapair Tiger Grass Cream', price: '$48' },
          { name: 'Purito Centella Unscented Serum', price: '$22' },
        ],
      },
      squalane: {
        what: 'An emollient that mimics the skin\'s own sebum (squalene). Non-comedogenic, lightweight, barrier-compatible. Stable plant-based version is from sugarcane or olive.',
        products: [
          { name: 'Biossance 100% Squalane Oil', price: '$32' },
          { name: 'The Ordinary 100% Plant-Derived Squalane', price: '$10' },
        ],
      },
    },
    amRoutine: [
      '1. Gentle cleanser (lukewarm water)',
      '2. Apply HA serum to damp skin',
      '3. Moisturiser with ceramides',
      '4. SPF 30–50 (mandatory even during barrier repair)',
    ],
    pmRoutine: [
      '1. Oil cleanse if wearing SPF/makeup (jojoba or squalane based)',
      '2. Gentle water cleanser',
      '3. Niacinamide serum or cica serum',
      '4. Rich ceramide cream',
      '5. Occlusive (Vaseline, Aquaphor) on particularly dry or red areas',
    ],
  },
  phase3: {
    name: 'Phase 3: Reintroduce Actives (Week 6–12)',
    tagline: 'Carefully add back what your skin needs',
    order: [
      { week: '6–7', reintroduce: 'Niacinamide 5% daily (already introduced for barrier)', note: 'If tolerated, increase to 10%' },
      { week: '7–8', reintroduce: 'Low % AHA (mandelic 5% or lactic 5%)', note: 'Once per week only, then build' },
      { week: '8–10', reintroduce: 'Vitamin C (L-ascorbic acid 10% or gentler derivative)', note: 'AM only, follow with SPF' },
      { week: '10–12', reintroduce: 'Retinol 0.025% or retinal 0.01%', note: 'Once per week only; buffer with moisturiser' },
    ],
    golden_rule: 'Never introduce two actives at the same time. Space new actives 2 weeks apart. If skin reacts — pull back and wait.',
  },
};

// ─── THE SANDWICH METHOD FOR SENSITIVE SKIN ──────────────────────────────────

export const SANDWICH_METHOD = {
  name: 'The Sandwich / Buffering Method',
  what: 'Applying actives between layers of moisturiser to reduce irritation and barrier disruption. Essential for introducing retinol or acids to sensitive or darker skin.',
  why: 'Dilutes the active ingredient\'s contact with the skin surface; reduces penetration speed; cuts irritation significantly without eliminating the active\'s benefit',
  method: [
    '1. Apply moisturiser on clean skin',
    '2. Wait 20–30 minutes (skin absorbs the moisturiser)',
    '3. Apply active (retinol, acid) on top of the moisturiser',
    '4. Wait 10 minutes',
    '5. Apply second layer of moisturiser on top',
  ],
  bestFor: ['Introducing retinol for first time', 'Very sensitive or reactive skin', 'Fitzpatrick V-VI skin introducing strong acids', 'Any time active causes redness or peeling'],
  note: 'Sandwich method reduces efficacy somewhat — this is the point for sensitive skin. As tolerance builds, transition to direct application.',
};

// ─── OILY SKIN AND THE BARRIER ────────────────────────────────────────────────

export const OILY_SKIN_BARRIER_MYTH = {
  myth: 'Oily skin doesn\'t need moisturiser.',
  reality: 'Sebum production and hydration are completely separate systems. Oily skin can be simultaneously dehydrated — lacking WATER (not oil) in the stratum corneum.',
  explanation: 'Sebaceous glands produce oil (sebum). The skin barrier holds WATER inside the skin cells. These are different processes. Stripping oil (with harsh cleansers) tells the skin to produce MORE sebum as a protective response — making oiliness worse. Proper hydration (humectants + lightweight moisturiser) actually helps regulate sebum over time.',
  forMelaninRichOilySkin: [
    'Use gel or water-gel moisturisers (lightweight, non-comedogenic)',
    'Niacinamide regulates sebum AND supports barrier — a true hero for oily darker skin',
    'Avoid skipping moisturiser — dehydrated oily skin overproduces sebum to compensate',
    'Blot throughout the day instead of washing off oil — washing strips the barrier repeatedly',
  ],
  products: [
    { name: 'Neutrogena Hydro Boost Water Gel', price: '$25', why: 'Lightweight HA gel; oil-free' },
    { name: 'COSRX Oil-Free Ultra Moisturising Lotion', price: '$20', why: 'Lightweight, Korean formula' },
    { name: 'The Inkey List Beta Hydroxy Acid', price: '$12', why: 'BHA serum — decongests pores while respecting barrier' },
  ],
};

// ─── ECZEMA AND ETHNIC SKIN ───────────────────────────────────────────────────

export const ECZEMA_ETHNIC_SKIN = {
  prevalence: {
    note: 'Eczema (atopic dermatitis) disproportionately affects Black children — studies show prevalence 1.7x higher than white children in the US. Despite this, clinical research has historically been conducted on lighter skin tones, making diagnosis and treatment harder for darker-skinned patients.',
    presentation: 'In Black, brown, and Asian skin, eczema may present as purple, grey, or brown discoloration rather than classic red — leading to frequent misdiagnosis.',
  },
  managingEczemaOnDarkerSkin: [
    'Use fragrance-free everything — fragrance is a top eczema trigger',
    'Heavy ceramide cream (CeraVe or Aveeno) as daily moisturiser',
    'Vaseline ("slugging") for flares — clinical evidence supports petroleum jelly for atopic dermatitis',
    'Avoid hot showers — warm water only',
    'Watch for grey/brown discolouration as eczema sign (not just red)',
    'Post-eczema PIH is common — treat hyperpigmentation only AFTER flare fully resolved',
    'Wet wrap therapy for severe flares (medical intervention)',
  ],
  resources: [
    'National Eczema Association (nationaleczema.org)',
    'Eczema Support for Patients of Color (Eczema Society)',
  ],
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getBarrierRepairProtocol() {
  return BARRIER_REPAIR_PROTOCOL;
}

export function getBarrierIngredientsForCommunity(communityId) {
  const concerns = MELANIN_RICH_BARRIER.ethnicSpecificBarrierConcerns[communityId.replace('-', '_')] ||
    MELANIN_RICH_BARRIER.ethnicSpecificBarrierConcerns.west_african;
  return {
    community: communityId,
    primaryConcerns: concerns,
    universalIngredients: ['Ceramides', 'Niacinamide', 'Hyaluronic Acid', 'Squalane'],
    protocol: BARRIER_REPAIR_PROTOCOL,
  };
}

export function getSandwichMethodGuide() {
  return SANDWICH_METHOD;
}

export function getOilySkinBarrierGuide() {
  return OILY_SKIN_BARRIER_MYTH;
}

export function getBarrierBasics() {
  return SKIN_BARRIER_BASICS;
}

export const BARRIER_GUIDE_STATS = {
  phases: Object.keys(BARRIER_REPAIR_PROTOCOL).length,
  ingredientsProfiled: Object.keys(BARRIER_REPAIR_PROTOCOL.phase2.ingredients).length,
  communitiesWithBarrierData: Object.keys(MELANIN_RICH_BARRIER.ethnicSpecificBarrierConcerns).length,
};
