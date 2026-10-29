/**
 * MIRRR Anti-Aging for Ethnic Skin
 * Age-positive, ethnicity-aware approach to skincare longevity
 * Celebrating the unique aging patterns of melanin-rich skin
 */

// ─── HOW ETHNIC SKIN AGES DIFFERENTLY ───────────────────────────────────────

export const ETHNIC_AGING_FACTS = {
  melaninAdvantage: {
    fact: 'Higher melanin content provides natural SPF (approximately SPF 13) and reduces UV-driven collagen breakdown',
    result: 'Melanin-rich skin (Fitzpatrick IV-VI) develops visible wrinkles on average 10–20 years later than fair skin',
    tradeoff: 'BUT melanin-rich skin is far more prone to hyperpigmentation, dark spots, and uneven tone as its primary aging concern',
    implication: 'For ethnic skin, anti-aging = anti-hyperpigmentation + evenness, not wrinkles primarily',
  },
  primaryAgingConcerns: {
    fitzpatrick_I_II: ['wrinkles', 'sun-damage', 'age-spots (lighter)', 'redness', 'loss-of-firmness', 'volume-loss'],
    fitzpatrick_III_IV: ['hyperpigmentation', 'dark-spots', 'melasma', 'some-wrinkles', 'pore-changes'],
    fitzpatrick_V_VI: ['hyperpigmentation', 'pih-scarring', 'dark-spots', 'ashiness', 'keloid-risk-from-procedures'],
  },
  communitySpecificPatterns: {
    'south-asian': 'Melasma (hormonally triggered) is the #1 aging concern. Sun damage shows as darkening not wrinkling.',
    'west-african': 'Deep even skin tone that ages gracefully in texture. PIH and spot evenness are the primary concerns.',
    'east-asian': 'Skin thins and shows dehydration lines early, then stays wrinkle-free longer. "Bamboo aging" — stays young then ages fast.',
    'arab': 'Olive skin resists wrinkles but accumulates sun damage as patchy darkness. Nasolabial folds deepen.',
    'latina': 'Melasma risk high (especially post-pregnancy). Warmth of skin tone is the primary beauty asset to protect.',
    'caribbean': 'Excellent wrinkle resistance. Main concern: sun damage = uneven patches, not lines.',
    'east-african': 'Beautiful even aging. Dryness-related fine lines are more common than sun-damage lines.',
    'south-african': 'Huge variation by Fitzpatrick type. White-South-African skin: full sun damage concern. Black-South-African: like west-african.',
    'black-american': 'Significantly delayed wrinkling. Primary concerns: PIH, keloid prevention, maintaining moisture for glow.',
  },
};

// ─── AGE-POSITIVE LANGUAGE ────────────────────────────────────────────────────

export const AGE_POSITIVE_FRAMING = {
  philosophy: 'MIRRR believes in skin health, not skin youth. The goal is to look WELL at every age — not to look younger.',
  reframes: [
    { old: 'Anti-aging', new: 'Longevity skincare / Skin health' },
    { old: 'Fight wrinkles', new: 'Support skin structure' },
    { old: 'Turn back the clock', new: 'Age with intention' },
    { old: 'Correct dark spots', new: 'Even skin tone' },
    { old: 'Look younger', new: 'Look your best at every age' },
  ],
  ethnicPerspective: 'Many ethnic communities celebrate aging — grey hair, laugh lines, and maturity are marks of wisdom. Skincare should support health without communicating that aging is failure.',
};

// ─── LONGEVITY PROTOCOLS BY DECADE ───────────────────────────────────────────

export const LONGEVITY_PROTOCOLS = {
  '20s': {
    decade: 'Your 20s',
    focus: 'Build the habits that prevent regret',
    skinChanges: 'Skin is at peak collagen production. Cell turnover is fast. Main concerns beginning to emerge: sun damage accumulation (invisible now), early dehydration, acne PIH.',
    priorities: [
      'SPF EVERY. SINGLE. DAY. This decade\'s sun protection determines your 40s skin.',
      'Vitamin C antioxidant protection (pairs with SPF)',
      'Basic hydration — Hyaluronic Acid + good moisturiser',
      'Don\'t touch acne — the PIH from picking lasts years',
      'Start niacinamide to prevent pore enlargement',
    ],
    ethnicFocus: {
      melaninRich: 'PIH prevention is your #1 goal. Every pimple you pop can leave a mark that lasts months.',
      olive: 'Start SPF and Vitamin C — olive skin accumulates sun damage that shows as patchiness later.',
      fair: 'SPF is urgent at this decade. You\'ll see the consequences of skipping it by your 30s.',
    },
    keyIngredients: ['SPF 50', 'Vitamin C', 'Hyaluronic Acid', 'Niacinamide'],
    skip: ['Retinol (unless treating acne — can introduce gently)'],
    productsTier: {
      budget: ['The Ordinary Vitamin C Suspension ($12)', 'Neutrogena Ultra Sheer SPF 100 ($18)', 'CeraVe PM Moisturiser ($18)'],
      mid: ['Maelove Glow Maker Vitamin C ($30)', 'EltaMD UV Clear SPF 46 ($39)', 'Tatcha The Water Cream ($68)'],
    },
  },
  '30s': {
    decade: 'Your 30s',
    focus: 'Address what\'s appearing; amplify what\'s working',
    skinChanges: 'Cell turnover slows. Collagen production begins declining (~1% per year). Dark spots accumulated in 20s become visible. For melanin-rich skin: PIH from 20s acne is peaking.',
    priorities: [
      'Introduce retinol/retinoid — now is the ideal time',
      'Peptides to support collagen',
      'Targeted treatment for any dark spots that appeared',
      'Eye cream becomes meaningful (thin skin around eyes shows changes first)',
      'More rigorous double cleanse — SPF removal is critical',
    ],
    ethnicFocus: {
      melaninRich: 'PIH from your 20s is peaking. Azelaic acid + niacinamide + vitamin C triple stack for evenness.',
      southAsian: 'Melasma may be appearing (especially post-pregnancy). Seek dermatologist for prescription azelaic or hydroquinone short-course.',
      deepSkin: 'You may be noticing ashiness. Increase your ceramide and shea butter moisturiser richness.',
    },
    keyIngredients: ['Retinol (0.025–0.05%)', 'Peptides', 'Niacinamide', 'Azelaic Acid', 'SPF'],
    newAdditions: ['Peptide serum (CollaGEN or Buffet)', 'Richer eye cream', 'Neck cream (often forgotten)'],
    productsTier: {
      budget: ['Differin Adapalene 0.1% ($30)', 'The Ordinary Multi-Peptide + HA Serum ($25)', 'RoC Retinol Correxion Eye Cream ($25)'],
      mid: ['Paula\'s Choice Clinical 1% Retinol ($62)', 'The Inkey List Peptide Moisturiser ($17)', 'Olay Regenerist Micro-Sculpting Serum ($30)'],
      luxury: ['SkinCeuticals C E Ferulic ($220)', 'Tatcha The Dewy Skin Cream ($89)', 'La Mer Crème de la Mer ($200)'],
    },
  },
  '40s': {
    decade: 'Your 40s',
    focus: 'Sustain collagen; manage hormonal shifts',
    skinChanges: 'Estrogen begins declining (perimenopause for many). Collagen loss accelerates. Skin becomes drier. Melanin-rich skin: hyperpigmentation accumulation, but still no significant wrinkling.',
    priorities: [
      'Stronger retinoid — move to 0.1% retinol or discuss tretinoin with derm',
      'Growth factor serums',
      'Increased moisturiser richness (barrier needs support)',
      'Neck and décolletage included in EVERY routine step',
      'Potential for professional treatments: chemical peels (careful with darker skin), laser (only from knowledgeable provider for deeper tones)',
    ],
    ethnicFocus: {
      melaninRich: 'DO NOT seek aggressive laser treatments without confirming your provider has experience with deep skin tones — risk of permanent lightening or PIH.',
      southAsian: 'Melasma can worsen during perimenopause. Professional consultation is valuable.',
      allEthnicities: 'This decade, professional relationships with a dermatologist who understands your ethnicity\'s skin are worth investment.',
    },
    professionalTreatmentsForMelaninSkin: [
      { treatment: 'Chemical Peels', safeFor: 'All Fitzpatrick types IF provider has ethnic skin experience', risks: 'PIH if wrong concentration or downtime not followed', recommended: 'Mandelic or lactic acid peels for Fitzpatrick IV-VI' },
      { treatment: 'Microneedling', safeFor: 'Fitzpatrick I-VI with proper aftercare', risks: 'PIH if skin not properly prepped (use hydroquinone/retinoid for weeks before)', recommended: 'Yes — collagen induction is particularly effective for aging ethnic skin' },
      { treatment: 'Nd:YAG Laser', safeFor: 'Fitzpatrick IV-VI specifically', risks: 'Low risk compared to ablative lasers', recommended: 'For dark spots and hair removal on deeper skin tones' },
      { treatment: 'Ablative CO2 Laser', safeFor: 'Fitzpatrick I-III only', risks: 'SEVERE PIH risk for Fitzpatrick IV-VI. Life-altering damage possible.', recommended: 'NOT recommended for deeper skin tones without extreme caution' },
    ],
    keyIngredients: ['Retinol 0.1%+', 'Growth Factors (EGF)', 'Ceramides', 'Peptides', 'SPF (unwavering)'],
    productsTier: {
      budget: ['Neutrogena Rapid Wrinkle Repair Retinol Cream ($30)', 'CeraVe Moisturising Cream with Ceramides ($18)', 'Olay Total Effects 7-in-1 ($25)'],
      mid: ['SkinMedica TNS Advanced+ Serum ($125)', 'Roc Retinol Correxion Max Daily Hydration ($40)'],
      luxury: ['La Mer The Eye Concentrate ($300)', 'SkinCeuticals Tripeptide-R Neck Repair ($130)', 'Augustinus Bader The Rich Cream ($325)'],
    },
  },
  '50s_plus': {
    decade: 'Your 50s+',
    focus: 'Radiance maintenance; complete acceptance',
    skinChanges: 'Post-menopause hormonal changes completed. Skin is its new normal. Melanin-rich skin: still fewer lines than peers; glow is the main maintenance goal.',
    priorities: [
      'Hyaluronic Acid and ceramides — barrier support is key',
      'Brightening focus over wrinkle focus (especially for melanin-rich skin)',
      'Sunscreen never waived',
      'Consider: bakuchiol as gentler retinol alternative if retinol is too irritating',
      'Facial massage and gua sha for circulation and lymphatic drainage',
    ],
    ethnicFocus: {
      melaninRich: 'You likely look 15-20 years younger than your fair-skinned peers. Embrace it. Focus: maintaining glow, addressing any spots, staying hydrated.',
      allTypes: 'Invest in the neck and hands — they reveal age more than the face on darker skin tones.',
    },
    glow_maintenance: ['Rosehip oil as serum', 'Facial gua sha daily', 'Vitamin C + SPF morning non-negotiables', 'Sheet mask weekly'],
    productsTier: {
      budget: ['The Ordinary Squalane ($10 — pure, excellent face oil)', 'Bakuchiol Serum by Herbivore ($54)', 'CeraVe PM Facial Moisturising Lotion ($18)'],
      luxury: ['Augustinus Bader The Rich Cream ($325)', 'La Mer The Treatment Lotion ($230)', 'Tatcha The Essence ($105)'],
    },
  },
};

// ─── INGREDIENT DEEP DIVES ────────────────────────────────────────────────────

export const LONGEVITY_INGREDIENTS = {
  retinoids: {
    name: 'Retinoids (Vitamin A Family)',
    types: ['Retinol (OTC)', 'Retinaldehyde (OTC, stronger)', 'Adapalene (OTC, acne-focused)', 'Tretinoin (Rx)', 'Tazarotene (Rx, strongest)'],
    why: 'Only ingredient with robust clinical evidence for both wrinkle reduction AND dark spot fading AND collagen stimulation',
    ethnicConsideration: 'Dark skin tones MUST start slow — 0.025% and buffer. The irritation risk causes PIH. A tretinoin face without proper intro protocol can cause significant PIH in Fitzpatrick V-VI.',
    protocol: [
      'Week 1-2: Apply retinol once a week',
      'Week 3-4: Apply twice a week',
      'Week 5-8: Apply every other night',
      'Month 3+: Apply nightly if skin tolerates',
      'Always: SPF the next morning, every day',
    ],
    neckNote: 'The neck has thinner, more sensitive skin — always start retinol on the face first, introduce to neck 4+ weeks later',
  },
  peptides: {
    name: 'Peptides',
    types: ['Matrixyl (collagen stimulating)', 'Argireline (Botox-mimicking)', 'Copper Peptides (skin repair)', 'EGF (Epidermal Growth Factor)'],
    why: 'Signal skin to produce more collagen and repair faster. Gentle — suitable for all Fitzpatrick types without irritation or PIH risk.',
    ethnicConsideration: 'Excellent for melanin-rich skin — effective without risk of irritation-driven PIH. Pair with retinol to amplify results.',
    recommendation: 'The Ordinary Multi-Peptide + HA Serum ($25) — best value peptide product available',
  },
  bakuchiol: {
    name: 'Bakuchiol',
    origin: 'Psoralea corylifolia plant — used in Ayurvedic medicine for centuries',
    why: 'Plant-based retinol alternative. Clinical studies show similar efficacy to retinol for fine lines and texture, without the irritation.',
    ethnicConsideration: 'EXCELLENT for melanin-rich skin — all the collagen-stimulating benefits of retinol without the PIH risk from irritation. Pregnancy-safe alternative.',
    recommendation: 'Herbivore Bakuchiol Serum ($54) / Inkey List Bakuchiol Moisturiser ($15)',
  },
  growth_factors: {
    name: 'Growth Factors (EGF)',
    why: 'Proteins that signal cell repair and regeneration. EGF (Epidermal Growth Factor) stimulates new cell production.',
    where: 'Popular in K-beauty (fermented versions) and luxury clinical skincare',
    ethnicConsideration: 'No PIH risk — works at cellular level. Excellent for deep skin tones in their 40s+.',
    recommendation: 'SkinMedica TNS Advanced+ Serum ($295) / Some By Mi AHA BHA PHA 30 Days Miracle Toner (contains fermented EGF, $23)',
  },
  ceramides: {
    name: 'Ceramides',
    why: 'The mortar that holds skin cells together. Depletes with age. Without ceramides, skin can\'t hold moisture or defend against environmental damage.',
    ethnicConsideration: 'Critical for Fitzpatrick V-VI skin prone to ashiness — ceramide depletion is the core cause of ashy appearance.',
    recommendation: 'CeraVe (the entire range is ceramide-based) — most affordable way to add ceramides to routine',
  },
};

// ─── PROFESSIONAL TREATMENT GUIDE ────────────────────────────────────────────

export const FINDING_ETHNIC_AWARE_DERMATOLOGIST = {
  why: 'Medical schools historically under-taught dermatology on dark skin. Some conditions (eczema, PIH, melasma) present differently on melanin-rich skin. Finding a provider who knows this is crucial.',
  howToFind: [
    'Ask specifically: "Do you have experience treating patients with Fitzpatrick IV-VI skin?"',
    'Look for dermatologists from communities that match yours',
    'Check if the practice shows before/after photos that include darker skin tones',
    'Teledermatology services like Hims/Hers, Dermatica, and Skin + Me can connect you with diverse providers',
    'Directories: Skin of Color Society (skinofcolorsociety.org) maintains provider directory',
  ],
  redFlags: [
    'Recommends aggressive CO2 laser for Fitzpatrick IV+ without extensive discussion',
    'Has no before/afters of dark skin tones',
    'Dismisses your concern about PIH from a procedure',
    'Has never heard of the Fitzpatrick scale',
  ],
  resources: [
    { name: 'Skin of Color Society', url: 'https://skinofcolorsociety.org' },
    { name: 'National Medical Association (US)', url: 'https://www.nmanet.org' },
    { name: 'BAD (British Association of Dermatologists)', url: 'https://www.bad.org.uk' },
  ],
};

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

export function getLongevityProtocol(decade) {
  const key = decade.toString().replace(/s/g, '').trim();
  const map = { '20': '20s', '30': '30s', '40': '40s', '50': '50s_plus', '60': '50s_plus', '70': '50s_plus' };
  return LONGEVITY_PROTOCOLS[map[key] || decade] || null;
}

export function getAgingFacts(communityId) {
  return {
    communityPattern: ETHNIC_AGING_FACTS.communitySpecificPatterns[communityId] || 'Pattern not yet indexed',
    primaryConcernsByFitzpatrick: ETHNIC_AGING_FACTS.primaryAgingConcerns,
    melaninAdvantage: ETHNIC_AGING_FACTS.melaninAdvantage,
  };
}

export function getIngredientForConcern(concern) {
  const c = concern.toLowerCase();
  return Object.values(LONGEVITY_INGREDIENTS).filter(ing => {
    const text = JSON.stringify(ing).toLowerCase();
    return text.includes(c);
  });
}

export function getAllProtocols() {
  return Object.values(LONGEVITY_PROTOCOLS);
}

export const ANTI_AGING_STATS = {
  decadesCovered: Object.keys(LONGEVITY_PROTOCOLS).length,
  ingredientsProfiled: Object.keys(LONGEVITY_INGREDIENTS).length,
  communitiesWithPatterns: Object.keys(ETHNIC_AGING_FACTS.communitySpecificPatterns).length,
  professionalTreatments: LONGEVITY_PROTOCOLS['40s'].professionalTreatmentsForMelaninSkin.length,
};
