/**
 * MIRRR SPF Guide for Ethnic Skin
 * The most important skincare step — with full ethnic skin context
 * White cast solutions, PA rating explainers, reapplication strategies
 */

// ─── WHY SPF MATTERS FOR MELANIN-RICH SKIN ──────────────────────────────────

export const MELANIN_SPF_SCIENCE = {
  commonMisconception: 'I don\'t need sunscreen — my skin is dark and I don\'t burn',
  reality: [
    'Melanin gives Fitzpatrick V-VI skin more built-in UVB protection than lighter skin, but not enough on its own, and it does not stop visible light from darkening pigmentation',
    'SPF 13 does NOT block UVA — the rays that cause hyperpigmentation and dark spots',
    'Every dark spot on melanin-rich skin worsens significantly without SPF',
    'PIH (Post-Inflammatory Hyperpigmentation) fades months faster when SPF is worn daily',
    'Melanoma occurs in darker skin tones, often in areas not associated with sun exposure (nails, palms, mouth)',
    'When it IS diagnosed in melanin-rich skin, melanoma is caught later and has worse outcomes',
  ],
  theRuleForAllSkin: 'SPF 30 minimum daily. SPF 50 PA++++ preferred for all melanin-rich skin.',
  uvExplainer: {
    UVA: 'The ageing and pigmentation ray. Penetrates glass. Present year-round, even on cloudy days. Causes dark spots, deepens PIH, damages collagen.',
    UVB: 'The burning ray. Cause of sunburn. Blocked by glass. Strongest mid-day in summer. Causes surface damage and cancer risk.',
    UVC: 'Blocked by ozone layer — mostly irrelevant at Earth\'s surface.',
    implication: 'You need broad-spectrum SPF that blocks BOTH UVA and UVB. PA++++ rating is the UVA protection marker to look for.',
  },
};

// ─── UNDERSTANDING THE SPF NUMBER ────────────────────────────────────────────

export const SPF_NUMBERS_EXPLAINED = {
  spf15: { percentBlocked: 93, meaningForEthnicSkin: 'Absolute minimum — not recommended as daily sun protection for melanin-rich skin' },
  spf30: { percentBlocked: 97, meaningForEthnicSkin: 'Minimum recommended. 3% UV still getting through — acceptable for daily urban life' },
  spf50: { percentBlocked: 98, meaningForEthnicSkin: 'Recommended for ethnic skin. 2% UV blocked is meaningful difference for PIH prevention' },
  spf100: { percentBlocked: 99, meaningForEthnicSkin: 'Marginal real-world benefit over SPF 50 unless reapplied perfectly — application amount matters more than SPF number' },
  
  paRating: {
    PA_plus: 'Low UVA protection',
    PA_plus_plus: 'Moderate UVA protection',
    PA_plus_plus_plus: 'High UVA protection',
    PA_plus_plus_plus_plus: 'Extremely high UVA protection — the target for ethnic skin',
    note: 'PA++++ is a Japanese/Korean standard. European standard: UVA circle logo. US: "broad spectrum" label.',
  },
};

// ─── THE WHITE CAST PROBLEM ───────────────────────────────────────────────────

export const WHITE_CAST_GUIDE = {
  whatCausesIt: 'Zinc oxide and titanium dioxide (physical/mineral sunscreen actives) are opaque white particles that sit on top of skin. On darker skin tones, this creates a chalky white or grey cast.',
  types: {
    physical: {
      name: 'Physical / Mineral Sunscreen',
      actives: ['Zinc Oxide', 'Titanium Dioxide'],
      pros: ['Broadest spectrum protection', 'Works immediately on application', 'Reef-safe', 'Less irritating for sensitive skin'],
      cons: ['WHITE CAST — significant issue for deeper skin tones', 'Thicker texture', 'Can emphasize dry patches'],
      solutions: [
        'Tinted mineral sunscreen — iron oxides added to neutralize white cast AND provide visible light protection (bonus for melasma)',
        'Nano-particle mineral formulas — smaller particles, less cast',
        'Iron oxide in formula — specifically blocks visible light that triggers melasma',
      ],
      bestForEthnicSkin: 'TINTED mineral formulas only for Fitzpatrick IV-VI',
    },
    chemical: {
      name: 'Chemical / Organic Sunscreen',
      actives: ['Avobenzone', 'Homosalate', 'Octinoxate', 'Octocrylene', 'Oxybenzone', 'Tinosorb M/S (European)'],
      pros: ['ZERO white cast — absorbs into skin', 'Lightweight texture', 'Blends seamlessly'],
      cons: ['15-20 minute wait before sun exposure', 'Some actives questioned for reef safety', 'Can irritate sensitive skin'],
      bestForEthnicSkin: 'EXCELLENT for Fitzpatrick III-VI — no white cast, lightweight feel',
      notes: 'European and Asian markets have more advanced chemical filter options (Tinosorb, Mexoryl) that are superior to US formulas',
    },
    hybrid: {
      name: 'Hybrid (Physical + Chemical)',
      description: 'Combines mineral and chemical actives for broader protection with reduced cast',
      bestForEthnicSkin: 'Medium skin tones (III-IV) who want some mineral protection without full cast',
    },
  },
  solutionsByFitzpatrick: {
    I_II: { recommendation: 'Any sunscreen works. White cast visible if very heavy application, but not usually an issue.', preferredType: 'Any — mineral for sensitive skin, chemical for cosmetic wearability' },
    III: { recommendation: 'Light mineral can work. Chemical or hybrid preferred.', preferredType: 'Chemical or tinted mineral', whiteCastRisk: 'Moderate' },
    IV: { recommendation: 'Chemical or tinted mineral essential. White cast from untinted mineral is noticeable.', preferredType: 'Chemical chemical chemical — or tinted mineral', whiteCastRisk: 'High with untinted mineral' },
    V: { recommendation: 'CHEMICAL ONLY or tinted mineral with deep shade match.', preferredType: 'Chemical SPF', whiteCastRisk: 'Severe with untinted mineral — appears grey-blue' },
    VI: { recommendation: 'CHEMICAL ONLY. Even tinted mineral can look ashy.', preferredType: 'Chemical SPF exclusively for most formulas', whiteCastRisk: 'Very severe — completely disrupts natural skin tone' },
  },
};

// ─── PRODUCT RECOMMENDATIONS ──────────────────────────────────────────────────

export const SPF_PRODUCTS = {
  noWhiteCast: [
    {
      name: 'Black Girl Sunscreen SPF 30',
      type: 'Chemical',
      
      whiteCast: 'None',
      texture: 'Gel-lotion, absorbs quickly',
      why: 'Made by a Black-owned brand for melanin-rich skin. No white cast, affordable.',
      bestFor: ['Fitzpatrick IV', 'Fitzpatrick V', 'Fitzpatrick VI'],
      coverage: 'SPF 30',
      website: 'https://blackgirlsunscreen.com',
    },
    {
      name: 'Beauty of Joseon Relief Sun: Rice + Probiotics SPF50 PA++++',
      type: 'Chemical (K-beauty)',
      
      whiteCast: 'None',
      texture: 'Thin serum-like, no residue',
      why: 'The K-beauty sunscreen every ethnic skin type can use. SPF50 PA++++, zero white cast, zero grease, zero grey finish. Cult status for good reason.',
      bestFor: ['All Fitzpatrick types III-VI', 'Oily skin', 'Under makeup'],
      coverage: 'SPF 50 PA++++',
      website: 'Available on Amazon/Soko Glam',
    },
    {
      name: 'Supergoop Unseen Sunscreen SPF 40',
      type: 'Chemical',
      
      whiteCast: 'None — truly invisible',
      texture: 'Velvety primer-like',
      why: 'Completely invisible on any skin tone. Works as a makeup primer. Slight silicone feel that smooths skin.',
      bestFor: ['All Fitzpatrick types', 'Under makeup', 'Oily/combo skin'],
      coverage: 'SPF 40',
      downside: 'Expensive, silicone texture not for everyone',
    },
    {
      name: 'ISDIN Eryfotona Ageless Tinted SPF 50+',
      type: 'Tinted Mineral',
      
      whiteCast: 'None (tinted mineral)',
      texture: 'Light tinted finish',
      why: 'Tinted mineral that works for medium-deep skin. Contains DNA repair enzymes. Tint provides some coverage + neutralises mineral cast.',
      bestFor: ['Fitzpatrick III-IV', 'Melasma-prone skin', 'Dry skin'],
      coverage: 'SPF 50+',
      note: 'The tint only matches Fitzpatrick III-IV — deeper tones may still find it too light',
    },
    {
      name: 'EltaMD UV Clear Broad-Spectrum SPF 46',
      type: 'Chemical + Mineral hybrid',
      
      whiteCast: 'Minimal (slight white on very deep tones)',
      texture: 'Lightweight, slightly matte finish',
      why: 'Dermatologist favourite. Contains niacinamide. Excellent for acne-prone skin. The "serious skincare" SPF recommendation.',
      bestFor: ['Fitzpatrick I-IV', 'Acne-prone', 'Rosacea'],
      coverage: 'SPF 46',
      note: 'May show slight cast on Fitzpatrick V-VI — Beauty of Joseon is better for deeper tones',
    },
    {
      name: 'Altruist Dermatologist Sunscreen SPF 50',
      type: 'Chemical',
      
      whiteCast: 'None',
      texture: 'Lotion',
      
      bestFor: ['All skin types', 'Budget-conscious', 'Daily use'],
      coverage: 'SPF 50',
      availability: 'UK/Europe widely available. Amazon for US.',
    },
    {
      name: 'Banana Boat Light as Air SPF 50+',
      type: 'Chemical',
      
      whiteCast: 'None',
      texture: 'Ultra-light, invisible',
      why: 'Budget US option with no white cast. SPF 50+. Accessible at drugstores.',
      bestFor: ['Fitzpatrick IV-VI', 'Budget-conscious', 'US market'],
      coverage: 'SPF 50+',
    },
  ],
  forMelasma: [
    {
      name: 'La Roche-Posay Anthelios Mineral Tinted SPF 50+',
      note: 'Contains iron oxides that block visible light — which triggers melasma — in addition to UV',
      
      why: 'Tinted mineral with iron oxide is the gold standard for melasma protection. Visible light (not just UV) triggers melasma pigment production.',
    },
    {
      name: 'ISDIN Eryfotona Ageless Tinted Mineral SPF 50+',
      note: 'DNA repair enzymes + UVA/UVB + visible light protection',
      
      why: 'Most comprehensive sun protection for melasma-prone skin. Worth the premium.',
    },
  ],
  forOilySkin: [
    { name: 'Beauty of Joseon Relief Sun SPF50 PA++++', note: 'No grease, matte-ish finish' },
    { name: 'Biore UV Aqua Rich Watery Essence SPF50+ PA++++', note: 'Japanese formula. Water-light. Virtually undetectable.',  note2: 'Import from Amazon or Asian beauty stores' },
    { name: 'INNISFREE Intensive Long Lasting Sunscreen EX SPF50+ PA++++', note: 'K-beauty matte finish' },
  ],
  forDrySkin: [
    { name: 'Tatcha The Silk Sunscreen SPF 50', note: 'Luxurious moisturising finish' },
    { name: 'First Aid Beauty Ultra Repair Tinted Moisturizer SPF 30', note: 'Hydrating base with SPF' },
    { name: 'Honest Beauty Everyday Sunny Face Mineral Tinted SPF 20', note: 'Light, moisturising' },
  ],
  touchUpOverMakeup: [
    { name: 'Kate Somerville UncompliKated SPF 50 Soft Focus Makeup Setting Spray', type: 'Mist',  note: 'Fine mist reapplication over a full face of makeup' },
    { name: 'Beauty of Joseon Matte Sun Stick SPF 50+ PA++++', type: 'Stick',  note: 'Solid stick — can dab over makeup for touch-up. Clean, no mess.' },
    { name: 'Colorescience Sunforgettable Total Protection Color Balm SPF 50', type: 'Tinted stick',  note: 'Tinted + SPF in a stick — touch up over makeup' },
  ],
};

// ─── REAPPLICATION STRATEGIES ─────────────────────────────────────────────────

export const REAPPLICATION_GUIDE = {
  why: 'SPF degrades with UV exposure, sweat, and time. Reapplication every 2 hours outdoors is not optional.',
  howToReapplyOverMakeup: [
    '1. SPF mist/spray — hold 6 inches from face, spray, let dry',
    '2. SPF cushion compact — press on top of makeup, set with compact',
    '3. SPF stick — lightly dab on skin, blend gently with ring finger',
    '4. Remove and reapply — for very long outdoor days, remove makeup mid-day and reapply full SPF',
  ],
  indoorRule: 'UVA penetrates glass — if sitting near a window at work, SPF still applies. Reapply when you leave the building.',
  
  melaninRichSkinNote: 'Even Fitzpatrick VI skin benefits from SPF — every dark spot you have was darkened by unprotected UV exposure. SPF is PIH treatment, not optional.',
};

// ─── ROUTINE PLACEMENT GUIDE ──────────────────────────────────────────────────

export const SPF_IN_ROUTINE = {
  order: 'Cleanser → Toner → Serum → Moisturiser → SPF → Makeup',
  rules: [
    'SPF is ALWAYS the last skincare step, before makeup',
    'Wait 10 minutes after applying SPF before applying makeup (allows it to set and form protective film)',
    'For chemical SPF: apply 15-20 minutes before sun exposure',
    'SPF in foundation/makeup is NOT sufficient — apply dedicated SPF underneath',
    'SPF in moisturiser: OK for low-UV days indoors, not for outdoor protection',
  ],
  commonMistakes: [
    'Applying SPF then moisturiser on top — dilutes the SPF protection',
    'Using only SPF in foundation — nowhere near enough',
    'Applying SPF to part of face — must cover full face, neck, ears',
    'Skipping SPF on overcast days',
    'Not reapplying throughout the day',
  ],
};

// ─── EXPORTED FUNCTIONS ───────────────────────────────────────────────────────

export function getSPFRecsForFitzpatrick(fitzpatrick) {
  const castGuide = WHITE_CAST_GUIDE.solutionsByFitzpatrick[fitzpatrick];
  const noWhiteCastProducts = SPF_PRODUCTS.noWhiteCast;

  return {
    fitzpatrick,
    recommendation: castGuide,
    bestProducts: noWhiteCastProducts.filter(p =>
      p.bestFor?.some(f => f.includes(fitzpatrick))
    ).slice(0, 3),
    whiteCastWarning: WHITE_CAST_GUIDE.solutionsByFitzpatrick[fitzpatrick]?.whiteCastRisk,
  };
}

export function getSPFForSkinType(skinType) {
  const map = {
    oily: SPF_PRODUCTS.forOilySkin,
    dry: SPF_PRODUCTS.forDrySkin,
    combination: SPF_PRODUCTS.forOilySkin,
  };
  return map[skinType.toLowerCase()] || SPF_PRODUCTS.noWhiteCast.slice(0, 3);
}

export function getMelasmaSpfGuide() {
  return {
    products: SPF_PRODUCTS.forMelasma,
    why: 'Melasma requires iron oxide protection against visible light in ADDITION to UV protection',
    rule: 'Tinted mineral SPF only for melasma-prone skin',
  };
}

export function getReapplicationProducts() {
  return SPF_PRODUCTS.touchUpOverMakeup;
}

export function getAllSPFProducts() {
  return {
    noWhiteCast: SPF_PRODUCTS.noWhiteCast,
    forMelasma: SPF_PRODUCTS.forMelasma,
    forOilySkin: SPF_PRODUCTS.forOilySkin,
    forDrySkin: SPF_PRODUCTS.forDrySkin,
    touchUp: SPF_PRODUCTS.touchUpOverMakeup,
  };
}

