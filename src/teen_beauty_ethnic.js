/**
 * MIRRR — Teen & Young Adult Beauty Guide
 * Age-appropriate first beauty routines, puberty skin changes,
 * multicultural acne patterns, and gentle guidance for Fitzpatrick I–VI teens.
 */

export const TEEN_BEAUTY_OVERVIEW = {
  title: 'Teen Beauty: Starting Right, Feeling Confident',
  introduction: `Puberty brings dramatic hormonal changes that affect skin, hair, and body — often suddenly and sometimes distressingly. This guide provides age-appropriate, science-based guidance for teenagers and young adults navigating beauty for the first time. The emphasis is always on healthy skin first, makeup second — because confident skin is the best foundation for any beauty routine.`,
  ageRange: '12–20 years approximately; onset of puberty triggers skin and hair changes',
  skinFirst: 'The most valuable investment a teenager can make in their appearance is a consistent, simple skincare routine. Makeup applied over clear, healthy, moisturised skin looks dramatically better than makeup on uncared-for skin.',
  hormoneContext: {
    androgens: 'At puberty, the adrenal glands produce dehydroepiandrosterone (DHEA) which increases; the gonads produce testosterone (all genders) and oestrogen/progesterone. These hormones directly activate sebaceous glands → significantly increased sebum production → the root cause of most teenage skin concerns.',
    girls: 'Oestrogen + progesterone fluctuations through menstrual cycle create cyclical breakout patterns; luteal phase (week before period) is highest androgen exposure → worst breakouts',
    boys: 'Testosterone peak in male puberty creates some of the most significant sebaceous gland activation; teenage boys often experience more severe acne than girls',
    diversity: 'Onset, severity, and patterns of puberty are influenced by genetics, ethnicity, nutrition, and body weight — significant variation is completely normal'
  }
};

export const TEEN_SKINCARE_ROUTINE = {
  title: 'First Teen Skincare Routine',
  principle: 'Start simple. Maximum 3–4 products. Consistency beats complexity.',
  step1_cleansing: {
    step: 'Step 1: Cleanser',
    importance: 'CRITICAL — Removing excess sebum, sweat, SPF, and pollutants without stripping the skin\'s natural barrier',
    forOilySkin: 'Gel or foam cleanser with salicylic acid 0.5–2% (morning AND evening) — salicylic acid dissolves oil and dead skin cells inside pores; excellent for teen acne-prone skin',
    forDryNormal: 'Gentle cream or milky cleanser; no salicylic acid needed; focus on clean without stripping',
    forSensitive: 'Extremely gentle fragrance-free cream cleanser; one ingredient list maximum; CeraVe Hydrating, La Roche-Posay Toleriane are well-tolerated options',
    howOften: 'Morning and evening every day — this is the non-negotiable step',
    important: 'Do NOT over-wash (more than twice daily); over-cleansing strips oil → skin overproduces oil to compensate → more breakouts',
    micellarWater: 'Micellar water is NOT a substitute for face wash — it removes surface makeup and light debris only; always follow with proper cleanser especially if wearing makeup'
  },
  step2_moisturiser: {
    step: 'Step 2: Moisturiser',
    whyTeensNeedIt: 'Common teen mistake: skipping moisturiser because skin is oily. Over-drying skin triggers more oil production — a cycle that worsens acne. All skin types benefit from moisturiser; the key is choosing the right one.',
    oilySkin: 'Lightweight gel-cream or water-gel formula; oil-free or non-comedogenic label; ingredients: hyaluronic acid (hydrating), niacinamide (sebum-regulating, pore-minimising, anti-inflammatory)',
    drySkin: 'Richer lotion or cream; ceramides are excellent for rebuilding barrier; avoid matte-finish formulas that will feel tight',
    combination: 'Lightweight overall; can apply slightly richer formula to drier areas (cheeks) and nothing extra on oily zone (T-zone)',
    howOften: 'Morning (before SPF) and evening (after cleansing)'
  },
  step3_spf: {
    step: 'Step 3: SPF (Morning Only)',
    importance: 'THIS IS THE MOST IMPORTANT ANTI-AGEING STEP — starting SPF as a teenager prevents the sun damage that shows as premature ageing, hyperpigmentation, and increased skin cancer risk in adulthood',
    type: 'SPF 30 minimum; SPF 50 preferred; daily even when not in direct sun (UVA passes through windows)',
    teenFriendly: 'Gel or fluid textures are most teen-friendly for oily skin — not creamy or heavy. Tinted SPF can double as light coverage. Invisible zinc formulas exist now that don\'t leave white cast on darker skin.',
    whitecast: 'WHITE CAST WARNING: Most traditional mineral SPFs (zinc oxide, titanium dioxide) leave visible white cast on Fitzpatrick IV-VI skin — this is a real barrier to compliance. Seek: mineral SPF with a tint, chemical SPF if preferred (avoid oxybenzone/homosalate if concerned), or hybrid formulas designed for deeper skin tones.',
    reapplication: 'Reapply every 2 hours in direct sun; SPF 50 powder or spray is easiest for school reapplication over makeup'
  },
  step4_targetedTreatments: {
    step: 'Step 4: Targeted Treatments (Optional; Add Once Basics Are Consistent)',
    niacinamide: { usage: 'Morning or evening under moisturiser; 5–10% concentration; excellent for pores, sebum, inflammation, hyperpigmentation; very well-tolerated; suitable from ~13+ ', benefit: 'One of the most universally useful and well-tolerated teen actives' },
    salicylicAcid: { usage: 'If not already in cleanser; 2% leave-on toner or serum; evening only initially; start 2–3 times weekly and build up', benefit: 'Excellent for comedonal acne (blackheads, whiteheads, clogged pores)' },
    benzoylPeroxide: { usage: '2.5% spot treatment on active spots; do not apply all over face unless directed by dermatologist', benefit: 'Kills C. acnes bacteria; very effective for inflamed papules/pustules', cautions: 'Bleaches towels, pillowcases, clothing — use white fabrics; dry skin side effect; start low percentage' },
    azelaic_acid: { usage: 'Excellent for PIH (dark spots after spots); anti-inflammatory; gentle; 10–15% products available OTC in many regions', benefit: 'Treats active acne AND prevents/fades the dark marks that follow; important especially for Fitzpatrick III-VI' },
    retinoids: { minAge: 'Generally not recommended before 18 except under dermatologist supervision', adult_teen: 'Older teens (18+) can introduce retinol 0.025–0.05%; start once weekly; always with SPF; very effective for acne and acne-prevention' }
  }
};

export const TEEN_ACNE_BY_ETHNICITY = {
  title: 'Teen Acne Patterns by Ethnicity & Fitzpatrick Scale',
  universals: {
    pathology: 'Acne vulgaris mechanism is the same across all ethnicities: sebum + C. acnes bacteria + follicular keratinisation + inflammation = pimples',
    types: [
      { type: 'Comedones', subtypes: 'blackheads (open), whiteheads (closed)', treatment: 'Salicylic acid, retinoids, niacinamide' },
      { type: 'Papules', description: 'Small, raised, red bumps — infected comedones without pus', treatment: 'Benzoyl peroxide, salicylic acid' },
      { type: 'Pustules', description: 'Papules with visible pus centre — what most people call "pimples"', treatment: 'Benzoyl peroxide, topical antibiotics (from doctor)' },
      { type: 'Nodules', description: 'Deep, painful, solid lumps under skin — need dermatologist', treatment: 'Prescription-strength; potentially isotretinoin' },
      { type: 'Cysts', description: 'Deep, fluid-filled, painful — can cause significant scarring; need dermatologist urgently', treatment: 'Dermatologist; isotretinoin often indicated' }
    ]
  },
  PIH_risk: {
    description: 'Post-Inflammatory Hyperpigmentation (PIH) is the dark mark left after a spot heals',
    riskByFitzpatrick: {
      'I-II': 'Lower risk; when PIH occurs, it is typically pink-red (post-inflammatory erythema) that fades over weeks',
      'III-IV': 'Moderate risk; PIH can be pink-brown or brown; fades over months without treatment',
      'V-VI': 'HIGH RISK; PIH is deep brown to near-black; can persist for years without treatment; the dark mark is often more distressing than the original spot; treatment must start early'
    },
    forDarkerSkinTones: 'Any acne treatment that causes inflammation (over-drying, physical picking, harsh treatments) INCREASES PIH risk. Gentle, measured treatment prevents both acne and PIH. DO NOT PICK — every picked spot is a potential permanent-ish dark mark on darker skin.',
    PIH_treatment: 'Niacinamide 10%, azelaic acid 15%, alpha arbutin 2%, vitamin C serum, SPF daily; combine for maximum effect; be patient (months of treatment needed for deep PIH)'
  },
  ethnicSpecific: {
    westAfrican: {
      skinProfile: 'Fitzpatrick V-VI; deep skin; typically high melanin density; robust collagen; sebaceous glands that can be very active in teens',
      concerns: ['Severe PIH is the primary concern beyond active acne', 'Pomade acne: acne along hairline from hair products (edge control, oils, grease) — extremely common in this community', 'Keloid risk from picking or aggressive treatment (6-16% of Black people have keloid tendency)', 'Folliculitis (infected hair follicles) can masquerade as acne'],
      tips: ['Avoid any hair products along hairline; tie hair back to keep products off forehead', 'Never pop spots — PIH risk too high', 'Start niacinamide and SPF early for PIH prevention', 'Non-comedogenic hair products only']
    },
    southAsian: {
      skinProfile: 'Typically Fitzpatrick III-IV; warm olive undertone; tends oily in T-zone; acne very common in South Asian teens',
      concerns: ['Very high rates of acne — hormonal and genetic component; PCOS prevalence elevated in South Asian girls', 'PIH: brown marks post-acne common; darker on darker skin', 'Facial hair (upper lip, chin) more common due to androgen sensitivity; many South Asian teenage girls distressed by facial hair', 'Melasma can begin in late teens/early twenties in South Asian women'],
      tips: ['Consistent salicylic acid cleanser', 'Niacinamide for both acne and PIH', 'If PCOS-related acne (persistent chin/jaw acne, irregular periods): see doctor', 'Facial hair: start with threading at a threading salon — traditional and effective; waxing second; laser when 18+']
    },
    caribbean: {
      skinProfile: 'Highly diverse: light Fitzpatrick III to very deep VI; significant Caribbean diversity in complexion',
      concerns: ['Similar to West African heritage for darker-skinned Caribbean teens: PIH priority', 'Lighter Caribbean skin: may be more susceptible to erythema (redness) post-acne', 'High humidity Caribbean climate + teen sebum = very oily skin common; pores appear enlarged'],
      tips: ['Powder SPF for controlling shine throughout the day', 'Lightweight non-comedogenic sunscreen', 'Clay mask 1x weekly to control oil'],
    },
    arab: {
      skinProfile: 'Typically Fitzpatrick III-IV; olive skin; can have oily T-zone; facial hair concern for teen girls',
      concerns: ['Acne very common, especially hormonal patterns', 'Facial hair on teens: upper lip hair typically concerns Arab teen girls; threading most traditional; waxing alternative', 'First makeup is culturally significant — many Arab teen girls wear makeup younger than average globally (eyeliner culture)'],
      tips: ['Bold eye (kohl/liner) is culturally appropriate from young age; learn technique before school; black kohl pencil is most forgiving for beginners', 'Warm undertone matched foundation if using base; avoid pink-undertone products'],
    },
    latina: {
      skinProfile: 'Wide range: Fitzpatrick II (light olive) to V (medium-deep brown); Latin American diversity',
      concerns: ['Melasma can begin in teens, especially on hormonal birth control or with high sun exposure', 'Acne common; hormonal pattern acne elevated due to higher PCOS rates', 'Eyebrow culture: full, defined brows are a Latina beauty standard; many Latina teens begin brow care early'],
      tips: ['SPF is critical especially for Latina teens with melasma risk', 'Brow threading or tinting as a first salon experience', 'Warm peach-beige or neutral foundation shades; avoid pink-based products on golden/warm skin']
    },
    eastAsian: {
      skinProfile: 'Fitzpatrick II-IV; typically smooth fine-pored skin; but oiliness very common in teens',
      concerns: ['Oily skin and enlarged pores during teen years', 'Acne: common but sometimes presents differently — more papules, less cystic for some East Asian skin types', 'Double eyelid pressure: social pressure around monolid vs double eyelid; eyelid tape and glue commonly used by teens across East Asia', 'K-beauty and J-beauty cultural influence shapes teen beauty expectations'],
      tips: ['Sebum control: salicylic acid toner, clay mask; mattifying products', 'First makeup often natural K-beauty style: tinted moisturiser, eyebrow gel, lip tint — a very wearable starting point', 'Discussing double eyelid aesthetics: both monolid and double eyelid are beautiful; choice belongs to the teen; temporary tape/glue is a personal decision']
    },
    eastAfrican: {
      skinProfile: 'Fitzpatrick IV-VI; typically warm to cool deep brown; sebaceous glands active',
      concerns: ['PIH primary concern over active acne for most', 'Hyperpigmentation around the mouth (perioral) — common in East African skin tones', 'Teff and grain-heavy traditional diet may actually support skin health due to mineral content'],
      tips: ['Niacinamide + azelaic acid combination for PIH prevention', 'SPF daily even with deep skin — not for cancer prevention primarily but for PIH control; UV worsens dark marks dramatically', 'Perioral hyperpigmentation: azelaic acid + SPF; takes months to fade; topical vitamin C']
    },
    southAfrican: {
      skinProfile: 'Highly diverse: South Africa spans multiple ethnic groups with significant complexion range',
      concerns: ['Black South African teens: same PIH concerns as other deep-skin communities', 'Afrikaner/Coloured teens: significant sun exposure in South African climate; SPF extremely important', 'UV index in South Africa is among the world\'s highest year-round — melanoma risk for lighter skin tones significant'],
      tips: ['SPF 50 every day — this is non-negotiable in South Africa\'s UV conditions', 'Rooibos-based toner can be a gentle, locally-relevant first skincare step', 'High UV means early SPF habits are critically important']
    },
    blackAmerican: {
      skinProfile: 'Fitzpatrick IV-VI typically; significant diversity within the community',
      concerns: ['PIH: the dark marks are the primary teen complaint; acne itself may be less noticed than the mark it leaves', 'Pomade acne along hairline from hair products', 'Keloid risk on face from picking', 'Razor bumps (PFB) beginning for teen boys who start shaving'],
      tips: ['PIH protocol: niacinamide 10% + azelaic acid + SPF; start at first sign of breakouts', 'Non-comedogenic hair products only; avoid hairline product application', 'Teen boys: electric razor or single-blade razor; shaving direction following hair growth; salicylic acid aftershave to prevent PFB', 'Black girl magic: celebrate natural features; beauty is diverse and the community is redefining standards']
    }
  }
};

export const TEEN_FIRST_MAKEUP = {
  title: 'Teen First Makeup Guide',
  philosophy: 'The best first makeup is makeup that looks natural, is easy to apply, and doesn\'t require advanced skill. Start with one or two products you feel confident with rather than a full face. Mistakes are how you learn.',
  ageNotes: {
    twelve_thirteen: 'Tinted lip balm, clear mascara, or tinted brow gel — barely-there enhancement that builds confidence without heavy application',
    fourteen_fifteen: 'Concealer for spot coverage, tinted moisturiser, mascara, filled brows — the "your best self" look',
    sixteen_plus: 'Full exploration with appropriate guidance; most teens at 16 can learn any basic makeup technique'
  },
  startProducts: {
    first_five: [
      { product: 'Tinted moisturiser or BB cream', why: 'Sheer to light coverage; hydration + some colour correction; more forgiving than foundation; hard to over-apply', how: 'Apply with fingers; blend in circular motions over face; simple' },
      { product: 'Concealer', why: 'For spot coverage and under-eye; build from one product to cover blemishes rather than full-face foundation', how: 'Stipple (pat) gently onto blemish; do not rub; blend edges' },
      { product: 'Mascara', why: 'The most impactful single eye product; opens eyes dramatically; easy to apply', how: 'Wiggle wand at base of lashes and pull upward; one to two coats; lower lashes optional' },
      { product: 'Brow product', why: 'Defined brows frame the face; the biggest "no makeup makeup" enhancer', how: 'Brow pencil: light hair-like strokes filling sparse areas; brow gel: brushes brows up and sets them; start light — too dark is the most common teen brow mistake' },
      { product: 'Tinted lip balm or lip gloss', why: 'Adds colour and shine; no precision needed; doubles as lip care', how: 'Apply directly from tube; no liner needed at this stage' }
    ],
    shade_selection: {
      tinted_moisturiser: 'Match to jawline in natural light; if between shades choose darker (lighter can look cakey); warm undertone if skin has yellow/golden warmth; cool if pink-neutral',
      concealer: '1 shade lighter than foundation or skin for highlighting; exact match for spot coverage; NEVER two shades lighter overall (makes skin look odd in photos)',
      brows: 'Match hair colour or one shade lighter/darker for natural look; if hair is black, use dark brown not black (black brows read as harsh on most faces)'
    }
  },
  commonTeenMistakes: [
    { mistake: 'Foundation too light (trying to look paler)', correction: 'Match your real skin tone; too-light foundation creates a mask effect; if lightening is a goal, discuss this with a trusted adult and consider why' },
    { mistake: 'Too much product', correction: 'Less is more for teens; tinted moisturiser not foundation; one coat of mascara; light-handed brows' },
    { mistake: 'Skipping SPF because of sunscreen texture', correction: 'Find a formula that works for your skin type; tinted SPF does double-duty; gels and fluids exist for oily skin' },
    { mistake: 'Popping spots before school', correction: 'Concealer over untouched spot looks 10x better than concealer over picked-at spot' },
    { mistake: 'Dark lip liner with no lipstick', correction: 'Fill in entirely or use a matching lip liner; ring-around-the-lip is visible and dated' },
    { mistake: 'Applying foundation with dirty fingers', correction: 'Clean hands or clean brush/sponge; bacteria from fingers causes breakouts' }
  ],
  forSchoolSettings: {
    naturalLook: 'Tinted moisturiser/BB cream, concealer on spots, one coat mascara, clear brow gel, tinted lip balm — five minutes; undetectable as heavy makeup',
    SPF_priority: 'SPF should always come before any other makeup; non-negotiable for teen skin',
    removing_at_night: 'CRITICAL habit to form early: remove ALL makeup every night before sleep. Sleeping in makeup clogs pores → acne → PIH. Make this a non-negotiable part of the night routine.'
  }
};

export const TEEN_HAIR_GUIDE = {
  title: 'Teen Hair Guide by Texture',
  puberty_changes: {
    description: 'Hormonal changes of puberty can significantly alter hair texture — wavy hair may become curlier or straighter; fine hair may become thicker or oilier; some teens notice new hair growth in new places',
    explanation: 'Androgens affect follicle structure; the hair produced after puberty can be noticeably different from childhood hair; this is normal',
    transition: 'Many teens go through a phase of learning to manage "new" hair they haven\'t had before — be patient with yourself'
  },
  byTexture: {
    straight_type1: { washFrequency: 'Oily roots: every 1–2 days; normal: every 2–3 days', essentials: ['Balancing shampoo', 'Lightweight conditioner on mid-lengths and ends only (never roots)', 'Heat protectant if using heat tools'], tip: 'Most Type 1 hair teens deal with oily roots; dry shampoo between washes; avoid heavy conditioning at roots' },
    wavy_type2: { washFrequency: 'Every 2–3 days; over-washing disrupts wave pattern', essentials: ['Low-sulfate shampoo', 'Hydrating conditioner', 'Leave-in and light gel or cream to define waves', 'Diffuser attachment for drying'], technique: 'Scrunch product into wet hair; do not brush or comb when dry (causes frizz); scrunch out the crunch after gel dries' },
    curly_type3: { washFrequency: 'Every 4–7 days; curly hair needs moisture; frequent washing dries it out', essentials: ['Sulfate-free shampoo or co-wash', 'Rich conditioner', 'Deep conditioning treatment weekly or bi-weekly', 'Leave-in cream/moisturiser', 'Gel for hold'], technique: 'Denman brush or finger detangle in shower with conditioner; apply leave-in to soaking wet hair; apply gel; diffuse or air dry; do not touch while drying' },
    coily_type4: { washFrequency: 'Every 7–14 days; maximum moisture retention needed', essentials: ['Co-wash or sulfate-free shampoo', 'Deep conditioner', 'Leave-in cream', 'Sealing oil (JBCO, castor, jojoba)', 'Protective styles'], technique: 'Work in sections always; detangle with wide-tooth comb from ends to roots in conditioner; LOC or LCO method (Liquid-Cream-Oil or Liquid-Oil-Cream) for moisture layering; protective styles protect ends and allow length retention' }
  },
  schoolFriendlyStyles: [
    'High puff or pineapple pony for Type 3-4 (protective of ends)',
    'Two-strand twists or mini braids for lasting styles',
    'Sleek low bun with gel for Type 1-2',
    'Braids or plaits for any hair type',
    'Headbands to manage edges and add polish'
  ],
  chemicalTreatments_teen: {
    relaxers: { recommendation: 'Generally not recommended under 16; chemical lye (NaOH) or no-lye (calcium hydroxide) relaxers used on teenage scalp can cause significant damage; many dermatologists recommend waiting until adulthood for first relaxer', saferAlternative: 'Texturisers (less-processed), roller sets, or stretching techniques (blow dry, banding) maintain natural hair with straighter appearances' },
    coloring: { recommendation: 'Permanent colour not recommended under 16 on natural texture; temporary colour or semi-permanent OK for teens; always do strand test first', highlights: 'Highlights require bleach — very damaging on teen hair; wait until 17-18 minimum; then start with professional highlights, not box bleach' }
  }
};

export function getTeenBeautyOverview() {
  return TEEN_BEAUTY_OVERVIEW;
}

export function getTeenSkincareRoutine(step) {
  if (!step) return TEEN_SKINCARE_ROUTINE;
  const map = {
    cleanser: TEEN_SKINCARE_ROUTINE.step1_cleansing,
    cleansing: TEEN_SKINCARE_ROUTINE.step1_cleansing,
    moisturiser: TEEN_SKINCARE_ROUTINE.step2_moisturiser,
    moisturizer: TEEN_SKINCARE_ROUTINE.step2_moisturiser,
    spf: TEEN_SKINCARE_ROUTINE.step3_spf,
    sunscreen: TEEN_SKINCARE_ROUTINE.step3_spf,
    treatments: TEEN_SKINCARE_ROUTINE.step4_targetedTreatments,
    actives: TEEN_SKINCARE_ROUTINE.step4_targetedTreatments
  };
  return map[step.toLowerCase()] || TEEN_SKINCARE_ROUTINE;
}

export function getTeenAcneByEthnicity(communityId) {
  const ethnicMap = TEEN_ACNE_BY_ETHNICITY.ethnicSpecific;
  const key = communityId.replace(/-/g, '');
  const searchKey = communityId.replace(/-/g, '');
  const directMap = {
    'west-african': ethnicMap.westAfrican,
    'south-asian': ethnicMap.southAsian,
    caribbean: ethnicMap.caribbean,
    arab: ethnicMap.arab,
    latina: ethnicMap.latina,
    'east-asian': ethnicMap.eastAsian,
    'east-african': ethnicMap.eastAfrican,
    'south-african': ethnicMap.southAfrican,
    'black-american': ethnicMap.blackAmerican
  };
  return directMap[communityId] || null;
}

export function getTeenFirstMakeup() {
  return TEEN_FIRST_MAKEUP;
}

export function getTeenHairGuide(textureType) {
  if (!textureType) return TEEN_HAIR_GUIDE;
  const map = {
    straight: TEEN_HAIR_GUIDE.byTexture.straight_type1,
    type1: TEEN_HAIR_GUIDE.byTexture.straight_type1,
    wavy: TEEN_HAIR_GUIDE.byTexture.wavy_type2,
    type2: TEEN_HAIR_GUIDE.byTexture.wavy_type2,
    curly: TEEN_HAIR_GUIDE.byTexture.curly_type3,
    type3: TEEN_HAIR_GUIDE.byTexture.curly_type3,
    coily: TEEN_HAIR_GUIDE.byTexture.coily_type4,
    type4: TEEN_HAIR_GUIDE.byTexture.coily_type4,
    natural: TEEN_HAIR_GUIDE.byTexture.coily_type4
  };
  return map[textureType.toLowerCase()] || TEEN_HAIR_GUIDE;
}

export const TEEN_BEAUTY_STATS = {
  moduleId: 'teen_beauty_ethnic',
  version: '1.0.0',
  topics: ['teen beauty', 'teen skincare', 'teenage acne', 'first makeup', 'puberty skin', 'PIH teen', 'pomade acne', 'teen hair care', 'salicylic acid teen', 'niacinamide teen'],
  communitiesSupported: 9,
  ageRange: '12–20',
  keyFacts: [
    'Post-Inflammatory Hyperpigmentation (PIH) is the primary acne concern for Fitzpatrick IV-VI teens — the dark mark is often more distressing than the original spot',
    'Pomade acne (acne along the hairline from hair products) is extremely common in Black and West African teen girls',
    'Starting SPF in teen years is the single most effective anti-ageing investment — UV damage accumulates from first sun exposure',
    'Picking spots on darker skin causes PIH that can take years to fade without treatment — "never pop" is especially critical for Fitzpatrick IV-VI',
    'Over-washing oily teen skin triggers rebound oil overproduction — twice daily maximum is sufficient even for very oily skin',
    'The first five makeup products for teens are: tinted moisturiser, concealer, mascara, brow product, tinted lip balm — all beginner-friendly',
    'PCOS prevalence is elevated in South Asian and Arab teen girls, often manifesting as persistent chin/jaw acne — a doctor visit is warranted if acne follows this pattern',
    'Retinoids are generally not recommended before age 18 except under dermatologist supervision for teenage acne'
  ]
};
