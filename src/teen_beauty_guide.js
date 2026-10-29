/**
 * MIRRR Teen Beauty Guide
 * Age-appropriate skincare, teen acne, first makeup, hair for teens,
 * body changes through puberty, and building healthy beauty habits
 */

// ─── TEEN SKIN CHANGES ────────────────────────────────────────────────────────

export const TEEN_SKIN_CHANGES = {
  puberty_overview: {
    timing: {
      girls: 'Puberty typically begins 8-13 years (average 10-11). Skin changes often begin within the first year.',
      boys: 'Puberty typically begins 9-14 years (average 11-12).',
      ethnic_differences: 'Black and Latina girls begin puberty on average 1-2 years earlier than white girls. This means skin changes, acne, and body hair appear earlier. This is a biological norm, not a disorder.',
    },
    what_changes: [
      'Sebum (oil) production increases dramatically — pores produce more oil due to androgen hormones',
      'Skin may become shinier and more prone to breakouts',
      'Pores may appear larger as they fill with more sebum',
      'Skin pH changes slightly',
      'Body odour begins (sweat glands activated by androgens)',
      'Hair becomes coarser and may change texture',
      'Facial hair may appear (peach fuzz in girls; visible hair in boys)',
    ],
  },

  teen_acne_basics: {
    why_it_happens: {
      hormones: 'Androgens (testosterone and related hormones) surge in puberty in both boys and girls. These hormones stimulate sebaceous glands to produce more oil. Excess oil + dead skin cells + bacteria = acne.',
      propionibacterium: 'Cutibacterium acnes (formerly Propionibacterium acnes) — bacteria that lives on all skin but proliferates in clogged pores, producing inflammatory substances.',
      not_from: ['Eating chocolate — myth (weak evidence at best)', 'Dirty skin — myth (overwashing makes acne worse)', 'Not washing hair enough — indirect contributor, not a primary cause', 'Masturbation — medical myth with no basis'],
    },

    severity: {
      grade_1_comedonal: 'Whiteheads and blackheads. Clogged pores without significant inflammation.',
      grade_2_mild_inflammatory: 'Some papules (red bumps) and pustules (whiteheads with inflammation) alongside comedones.',
      grade_3_moderate: 'More papules and pustules; possible nodules. Affects larger area.',
      grade_4_severe: 'Nodules and cysts — large, painful, under-skin lesions. REQUIRES DOCTOR/DERMATOLOGIST intervention. Can cause permanent scarring.',
    },

    ethnic_teen_differences: {
      PIH_risk: 'Black, South Asian, East Asian, and Latina teens have higher risk of post-inflammatory hyperpigmentation (PIH) from acne. Every pimple can leave a dark mark. This makes treating acne AND protecting the skin barrier equally critical — the dark marks often bother teens more than the acne itself.',
      severity: 'Darker skin tones are not inherently more acne-prone, but PIH makes every breakout leave a more visible and lasting mark.',
      South_Asian: 'Higher prevalence of hormonal acne due to genetic PCOS risk; diet high in dairy may be contributory for some.',
      Black_teen_girls: 'Hormonal acne is common; hairline/forehead acne from hair products (comedogenic pomades, gels, oils on edges) is a specific concern — "acne cosmetica" or pomade acne.',
    },
  },
};

// ─── TEEN SKINCARE ROUTINE ────────────────────────────────────────────────────

export const TEEN_SKINCARE = {
  philosophy: {
    keep_it_simple: 'Teen skin does not need 10 steps. The perfect teen routine is 3-4 products maximum. More product = more potential for irritation and breakouts from overuse.',
    avoid_anti_aging: 'Retinoids, strong AHAs, vitamin C serums — these are NOT for teen skin. This marketing is harmful. Teen skin is already producing collagen at maximum rate; these actives are unnecessary and potentially irritating.',
    trending_products: 'Many teen-popular products (Drunk Elephant, Paula\'s Choice high-concentration actives) are formulated for adult concerns and are inappropriate for teen skin. A teen does not need retinol or high-percentage BHAs.',
  },

  basic_routine: {
    morning: [
      { step: 1, product: 'Gentle cleanser', description: 'Gel or foam cleanser for oily skin; cream cleanser for dry/normal. Cleanse for 60 seconds. Rinse with lukewarm water.', recommended: 'CeraVe Foaming Facial Cleanser, La Roche-Posay Toleriane Purifying Foaming Cleanser, Neutrogena Hydro Boost Gel Cleanser' },
      { step: 2, product: 'Moisturiser with SPF', description: 'Non-comedogenic, oil-free if acne-prone. SPF 30+ is non-negotiable even for teens. UV damage accumulates from youth.', recommended: 'Neutrogena Clear Face SPF 55, EltaMD UV Clear SPF 46, Black Girl Sunscreen SPF 30' },
    ],
    evening: [
      { step: 1, product: 'Gentle cleanser', description: 'Same as morning. Teens often skip evening cleanse — this is when the day\'s oil, sweat, and pollutants are removed. Critical for acne-prone teens.' },
      { step: 2, product: 'Spot treatment (if needed)', description: 'Benzoyl peroxide 2.5% or salicylic acid 0.5-1% on active spots only.', note: 'Do NOT apply spot treatment all over face "preventatively" — this is drying and irritating without benefit.' },
      { step: 3, product: 'Moisturiser', description: 'Even oily skin needs moisturiser — skipping it leads to dehydration which can increase oil production. Oil-free, non-comedogenic.' },
    ],
  },

  key_ingredients: {
    for_teens: {
      salicylic_acid: { percentage: '0.5-2%', use: 'Unclogs pores, reduces blackheads and whiteheads. BHA — oil-soluble, penetrates into pores.', best_for: 'Comedonal acne, oily skin', form: 'Cleanser or toner is ideal for teens — less concentrated exposure than serum' },
      benzoyl_peroxide: { percentage: '2.5-5% (start low)', use: 'Kills C. acnes bacteria. Effective for inflammatory acne.', caution: 'BLEACHES fabric — any fabric contact (pillow cases, towels, shirt collar) will be bleached. Use white towels and pillowcases when using BP.', best_for: 'Inflammatory acne (red spots, pustules)' },
      niacinamide: { percentage: '2-5%', use: 'Reduces pore appearance, controls sebum, calms inflammation, reduces PIH. Gentle enough for teen skin.', best_for: 'Everything — the most universally appropriate teen ingredient for oily, acne-prone, and dark skin types' },
    },
    avoid_for_teens: [
      'Vitamin C serum at high concentrations (10%+ L-ascorbic acid) — unnecessary, can be irritating',
      'Retinol or retinoids (unless prescribed by a doctor for severe acne)',
      'High-percentage AHA exfoliants (glycolic 10%+)',
      'Physical scrubs with apricot kernels, walnut shells — micro-tears in skin, introduces bacteria',
      'Toners with alcohol — stripping, counterproductive',
    ],
  },

  sunscreen_for_teens: {
    importance: 'Up to 80% of lifetime sun damage occurs before age 18. The UV damage accumulated in teen years manifests as premature aging, pigmentation, and skin cancer risk decades later.',
    texture: 'Teens often resist sunscreen because of thick, greasy textures. The solution is finding the right formula. For acne-prone skin: gel or fluid sunscreens (Bondi Sands Skin Glow, Biore Aqua Rich, ISDIN Fusion Water).',
    for_dark_skin_teens: 'Black Girl Sunscreen is specifically formulated without white cast and is owned by a Black woman. La Roche-Posay Anthelios Tinted is another favourite for dark skin teens.',
    application: 'Teens often apply too little. A full teaspoon for the face, or 2 finger lengths.',
  },
};

// ─── TEEN ACNE TREATMENT ──────────────────────────────────────────────────────

export const TEEN_ACNE_TREATMENT = {
  gentle_approach: {
    rule: 'Treat ONE thing at a time. Many teens use multiple acne products simultaneously, not understanding these are treatments — combining them causes severe dryness, irritation, and paradoxically MORE breakouts from a damaged skin barrier.',
    start_slow: 'Introduce one new product at a time, every 2 weeks. If a new product causes significant redness, stinging, or breakouts — pause and see if it settles.',
  },

  ota_products: {
    cleansers: {
      salicylic_acid: 'Neutrogena Oil-Free Acne Wash, St. Ives Acne Control Cleanser',
      gentle: 'CeraVe Foaming, La Roche-Posay Toleriane',
    },
    spot_treatments: {
      bp: 'Clean and Clear Persa-Gel 10 (start with 2.5%), PanOxyl Acne Foaming Wash',
      sa: 'Clean and Clear Advantage Spot Treatment',
      sulfur: 'Kate Somerville EradiKate (sulfur 1.5%) — particularly effective and less bleaching than BP',
    },
    masks: {
      clay: 'Freeman Charcoal and Black Sugar Facial Mask, Aztec Secret Indian Healing Clay (diluted)',
      note: 'Masks are add-ons, not replacements for routine. Use maximum 1-2x per week.',
    },
  },

  when_to_see_doctor: [
    'Cystic acne — large, painful, deep nodules and cysts that don\'t respond to over-the-counter',
    'Severe acne with widespread inflammation',
    'Acne leaving scars (not just dark marks)',
    'Severe psychological distress from acne',
    'Acne in unusual locations (chest, back extensively, unusual patterns)',
    'Acne accompanied by irregular periods, excessive hair growth — possible hormonal condition (PCOS)',
  ],

  prescription_options: {
    antibiotics: 'Doxycycline, minocycline — effective for inflammatory acne. Short-term only due to antibiotic resistance.',
    topical_retinoids: 'Tretinoin 0.025-0.05% — gold standard for acne. Requires acclimatisation period.',
    oral_contraceptives: 'For teen girls with hormonal acne — Diane-35 (cyproterone acetate), Yaz (drospirenone). Require appropriate counselling.',
    isotretinoin: 'Accutane/Roaccutane — for severe, scarring, or treatment-resistant acne. Highly regulated; requires blood tests; teratogenic (must not be used in pregnancy). Transformative results for severe cases.',
    spironolactone: 'Off-label for teenage girls with hormonal acne — anti-androgen. Effective, well-tolerated.',
  },

  PIH_treatment_for_teens: {
    priority: 'For teens with darker skin, addressing PIH (dark marks from acne) is often the top priority — the dark marks often persist for months to years and cause significant distress.',
    treatment_pyramid: [
      { tier: 1, ingredients: 'Niacinamide 5%, SPF 30+ daily', description: 'Foundation — slow but safe for all teens' },
      { tier: 2, ingredients: 'Alpha arbutin 2%, kojic acid', description: 'Add after baseline established' },
      { tier: 3, ingredients: 'Azelaic acid 10-15%', description: 'Effective for PIH; prescription in some countries' },
      { tier: 4, ingredients: 'Prescription: tretinoin, tranexamic acid', description: 'Doctor-supervised only' },
    ],
  },
};

// ─── FIRST MAKEUP GUIDE ───────────────────────────────────────────────────────

export const FIRST_MAKEUP = {
  philosophy: {
    no_rush: 'There is no "right age" for makeup. Interest and choice, not age, should drive the decision.',
    skin_first: 'The single biggest makeup improvement a teen can make is skincare. Healthy skin means less coverage needed, products perform better, and confidence is built on the right foundation.',
    enhancing_not_hiding: 'Good first makeup enhances features the person already has, rather than covering or transforming. This builds authentic confidence.',
  },

  starter_kit: {
    essential: [
      { product: 'Tinted moisturiser or BB cream', note: 'Much more natural-looking than full-coverage foundation. Mistakes are easier to blend. Better for acne-prone teen skin (less occlusive).' },
      { product: 'Concealer (one shade up from skin tone, yellow-toned)', note: 'For under-eye circles and spot concealing only.' },
      { product: 'Mascara', note: 'The single highest-impact makeup item for most teens. Waterproof for sport; regular for everyday.' },
      { product: 'Tinted lip balm', note: 'Skincare and colour in one. Natural-looking and appropriate for all situations.' },
    ],
    add_when_comfortable: [
      'Eyebrow product (clear gel or pencil)',
      'Blush (cream for natural finish)',
      'Setting spray (to extend wear)',
    ],
    when_confident: [
      'Foundation (if desired)',
      'Eyeshadow palette',
      'Eyeliner',
      'Lipstick',
    ],
  },

  shade_matching_teens: {
    foundation: 'Test on jawline in natural light. Should disappear into skin without blending. Common mistake: teens choose shades too light (ashiness) or too pink.',
    for_dark_skin_teens: 'Makeup for dark skin has historically been underserved — Fenty Beauty (40 shades) was revolutionary. Dark skin teens can shop: Fenty, NYX, Maybelline Fit Me (wide range), Black Opal, Fashion Fair (HBCU staple, revived 2021).',
    for_South_Asian: 'South Asian skin often has yellow-olive or deep golden undertones — pink or warm-neutral foundations often look wrong. Look for "warm" and "golden" shade descriptions.',
  },

  makeup_removal: {
    critical: 'Sleeping in makeup is genuinely harmful for teen skin — pores clog overnight, acne worsens, lashes become brittle from dried mascara. This is not optional.',
    easy_methods: [
      'Micellar water on cotton pad — wipe off, done',
      'Makeup remover wipes (convenience; not thorough — always follow with cleanser)',
      'Double cleanse: oil-based cleanser first, then water-based',
    ],
    eye_makeup: 'Remove mascara and eye makeup gently — avoid rubbing which damages lash follicles and can cause lash loss.',
  },

  school_makeup: {
    note: 'Many schools have makeup policies. Natural, subtle makeup is typically compliant. Tinted moisturiser, mascara, and lip balm are essentially invisible as "makeup."',
  },
};

// ─── TEEN HAIR ────────────────────────────────────────────────────────────────

export const TEEN_HAIR = {
  changes_in_puberty: {
    oilier: 'Sebaceous glands in the scalp produce more oil — hair becomes greasier faster. This is normal. Washing frequency should match greasy speed, not a fixed schedule.',
    texture: 'Hair texture can change during puberty — straight hair may develop wave; wavy may curl more. This is due to hormonal changes affecting follicle shape.',
    body_hair: 'Underarm and leg hair begins growing during puberty; pubic hair develops. Removal is a personal choice with no hygiene requirement.',
  },

  first_heat_tools: {
    caution: 'Teen hair is resilient but heat damage is cumulative and permanent for the length of hair that exists at the time of damage.',
    guidance: [
      'Start with the LOWEST heat setting that achieves the style',
      'ALWAYS use heat protectant spray before any hot tool',
      'Flat irons: 150-180°C maximum for fine hair; 180-200°C maximum for coarse hair',
      'Limit heat styling to 2-3x per week maximum',
      'Take breaks — heat-free weeks allow hair to recover',
    ],
    for_textured_hair: 'Blow-drying textured hair without heat protectant and a diffuser is a major source of heat damage and frizz. Diffuser attachment is essential.',
  },

  textured_hair_teens: {
    learning_curve: 'Many Black and mixed-race teens are learning to care for their natural hair for the first time, especially after years of chemical straightening or relaxers.',
    basics: [
      'Cowash (conditioner-only washing) or gentle sulfate-free shampoo',
      'Deep conditioner weekly',
      'Leave-in conditioner',
      'Seal moisture with an oil or cream',
    ],
    protective_styles: 'Box braids, twists, cornrows protect natural hair and reduce daily manipulation — ideal for active teens. Care: moisturise scalp weekly; don\'t leave protective styles in too long (maximum 6-8 weeks for most styles).',
    shrinkage: 'Natural afro-textured hair can shrink 50-75% when dry. This is not damage — it\'s a sign of healthy curl pattern.',
  },

  hair_removal_teens: {
    note: 'Body hair removal is a personal choice. There is no medical reason to remove body hair. This section covers options for teens who choose to.',
    options: {
      shaving: { pros: 'Cheap, fast, painless', cons: 'Grows back quickly with blunt tip, can cause razor bumps (pseudofolliculitis) especially in Black teens on coarse hair', start_with: 'Electric razor — less risk of cuts; then safety razor with shave gel' },
      waxing: { pros: 'Longer lasting (2-4 weeks)', cons: 'More painful; cost; risk of ingrown hairs; not suitable for irritated/acne skin', note: 'DO NOT wax over active acne or irritated skin' },
      threading: { pros: 'Very precise for brows and facial hair; lasts 2-4 weeks', cons: 'Some discomfort', note: 'The traditional choice for South Asian and Middle Eastern brow shaping; now widely available' },
      depilatory_cream: { pros: 'Painless at the time', cons: 'Chemical irritation risk; not for face without specific face formula', note: 'Veet, Nair — patch test first' },
      IPL_laser: { note: 'NOT suitable for teens in puberty — hormonal changes continue to stimulate hair growth, making results inconsistent. Reconsider after 18-20 when hormones stabilise. Also NOT suitable for Fitzpatrick V-VI without specialist equipment — risk of hyperpigmentation.' },
    },
  },
};

// ─── ETHNIC TEEN BEAUTY CONCERNS ──────────────────────────────────────────────

export const ETHNIC_TEEN_CONCERNS = {
  south_asian: {
    acne_and_haldi: 'Turmeric (haldi) is culturally used on teen skin — applied in paste form. It has some anti-inflammatory evidence but also stains the skin yellow and can cause phototoxic reactions when combined with sun exposure. Use with caution.',
    hair_removal_cultural: 'Hair removal may have cultural components — threading for South Asian girls is often both cultural and practical. The tradition of the first threading or waxing as a coming-of-age event exists in many South Asian families.',
    PCOS_awareness: 'South Asian teen girls have higher risk of PCOS — watch for: irregular periods, unusual acne patterns, excessive facial/body hair. Early diagnosis and management prevents long-term complications.',
  },

  black_teen: {
    pomade_acne: 'Hairline and forehead acne from hair edge products (pomades, gels) is extremely common. Keep edges products away from skin — apply product to hair only. Use non-comedogenic options.',
    razor_bumps: 'Pseudofolliculitis barbae (razor bumps) in Black teen boys is very common from shaving. Options: electric razor (trimmer), single-blade safety razor, allowing minimal beard growth, chemical depilatories (Magic Shave).',
    colour_matching: 'Finding concealer and foundation for dark skin: Fenty Beauty, NYX Perfect Match (120 shades), Maybelline Fit Me Matte & Poreless (45+ shades), Black Opal, Fashion Fair.',
  },

  east_asian: {
    double_eyelid_pressure: 'Some East Asian teens face cultural or social pressure around single vs. double eyelid. Both are equally beautiful and valid. Double eyelid tape (available widely) is a cosmetic option; surgery (blepharoplasty) is a major decision that should not be made under social pressure before adulthood.',
    skin_care_start: 'K-beauty culture often leads East Asian teens to start skincare earlier — which can be a positive when focused on sun protection and basic moisturisation, or harmful when complex actives are introduced too young.',
    SPF: 'Sun avoidance customs in some East Asian communities can lead to vitamin D deficiency in teens in northern climates. SPF is still needed, but ensuring adequate vitamin D levels is important.',
  },

  latina: {
    colorism_awareness: 'Colorism (preference for lighter skin within communities) affects teen self-image in some Latin communities. Dark marks and tan lines can be areas of anxiety. Embrace all skin tones — darker Latinx skin tones are beautiful and worthy of celebration.',
    SPF_culture: 'SPF use rates are lower in some Latin communities. Tanning is normalised in many Latin cultures. Educating on UV damage being colour-blind is important — skin cancer rates are increasing in Hispanic communities.',
  },

  arab: {
    hair_removal_early: 'Hair removal often begins at puberty in many Arab families and communities, aligning with cultural expectations. Sugar wax (halawa) is the traditional method — effectively pain-managed with practice.',
    makeup_occasions: 'Wedding and celebration culture means teens may be introduced to sophisticated makeup at events. Having a trusted adult or professional help for major occasions builds skills appropriately.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getTeenSkinChanges() {
  return TEEN_SKIN_CHANGES;
}

export function getTeenSkincare() {
  return TEEN_SKINCARE;
}

export function getTeenAcneTreatment() {
  return TEEN_ACNE_TREATMENT;
}

export function getFirstMakeupGuide() {
  return FIRST_MAKEUP;
}

export function getTeenHairGuide() {
  return TEEN_HAIR;
}

export function getEthnicTeenConcerns(communityId) {
  return ETHNIC_TEEN_CONCERNS[communityId] || null;
}

export const TEEN_BEAUTY_STATS = {
  skinRoutineSteps: 3,
  makeupStarterItems: FIRST_MAKEUP.starter_kit.essential.length,
  ethnicTeenCommunities: Object.keys(ETHNIC_TEEN_CONCERNS).length,
  acneSeverityGrades: 4,
};
