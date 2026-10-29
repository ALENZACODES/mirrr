/**
 * MIRRR Hormonal Beauty Guide
 * PCOS skin and hair effects, thyroid impact on beauty,
 * birth control and skin, insulin resistance beauty effects,
 * and community-specific hormonal considerations
 */

// ─── HORMONES AND SKIN ────────────────────────────────────────────────────────

export const HORMONES_OVERVIEW = {
  key_hormones_affecting_skin: {
    androgens: {
      what: 'Male sex hormones (testosterone, DHT, DHEA-S) present in both men and women. The primary drivers of sebum production, acne, and hormonal hair loss.',
      in_women: 'Women produce androgens in the ovaries and adrenal glands. Elevated androgens drive hormonal acne, oily skin, unwanted facial/body hair, and female pattern hair loss.',
      dht: 'Dihydrotestosterone — the most potent androgen at the follicle level. DHT miniaturises hair follicles (androgenetic alopecia) and drives sebaceous gland activity.',
    },
    oestrogen: {
      what: 'The primary female sex hormone — drives collagen production, skin hydration, fat distribution. Protective against androgenic effects on skin.',
      in_skin: [
        'Stimulates collagen synthesis — oestrogen is why pre-menopausal women retain skin thickness',
        'Maintains skin hydration and hyaluronic acid content',
        'Moderates sebum production (counterbalances androgens)',
        'Reduces facial hair growth',
      ],
      when_it_falls: 'Post-menopause — collagen loss accelerates (30% in first 5 years), skin dries, sebum decreases, facial hair may increase as androgen-to-oestrogen ratio shifts.',
    },
    progesterone: {
      what: 'The pregnancy hormone — fluctuates through the menstrual cycle, peaks in the luteal phase (week 3-4).',
      in_skin: 'High progesterone in the luteal phase drives pre-menstrual breakouts, oil production increase, and bloating/puffiness.',
    },
    cortisol: {
      what: 'The stress hormone — produced by the adrenal glands in response to physical or psychological stress.',
      in_skin: [
        'Increases sebum production → stress acne',
        'Breaks down collagen',
        'Impairs skin barrier repair',
        'Can trigger inflammatory flares (eczema, psoriasis, rosacea)',
        'Increases melanin production → stress-related hyperpigmentation',
      ],
    },
    insulin: {
      what: 'Regulates blood sugar. Insulin resistance (cells stop responding normally) is associated with elevated insulin and IGF-1.',
      in_skin: [
        'High insulin/IGF-1 → increased androgen production → acne, oily skin, hair loss',
        'Insulin resistance → acanthosis nigricans (dark, velvety patches in skin folds)',
        'High sugar diet → glycation (sugar attaches to collagen/elastin, making them stiff and less functional)',
      ],
    },
    thyroid: {
      what: 'Thyroid hormones (T3, T4) regulate metabolism across every system, including skin and hair.',
      low_thyroid: 'Hypothyroidism — slow metabolism; dry, coarse skin; hair loss and brittle nails; puffy face; slow wound healing.',
      high_thyroid: 'Hyperthyroidism — overactive; warm, moist, thin skin; hair loss (diffuse); vitiligo association.',
    },
  },
};

// ─── PCOS (POLYCYSTIC OVARY SYNDROME) ────────────────────────────────────────

export const PCOS_GUIDE = {
  what: 'PCOS is the most common endocrine disorder in women of reproductive age, affecting 6-15% of women worldwide. It\'s characterised by elevated androgens, irregular menstrual cycles, and polycystic ovaries on ultrasound. Insulin resistance is present in 50-70% of PCOS cases.',

  skin_effects: {
    acne: {
      type: 'Hormonal/androgenic — deep, cystic, concentrated on jawline, chin, and lower face. Cyclical (worsens pre-period) but may be persistent.',
      why: 'Elevated androgens drive excessive sebum, creating the perfect environment for C. acnes bacterial proliferation and cyst formation.',
      treatment: {
        topical: 'Standard acne treatments (retinoids, benzoyl peroxide, azelaic acid) address the symptom. For PCOS acne, addressing the root cause is more effective.',
        systemic: [
          'Spironolactone (50-200mg) — blocks androgen receptors at the sebaceous gland. Dramatically effective for PCOS-driven acne.',
          'Combined oral contraceptive pills — particularly pills with anti-androgenic progestins (Yasmin/drospirenone, Diane-35/cyproterone acetate)',
          'Metformin (insulin sensitiser) — reduces insulin resistance, indirectly reduces androgen production',
          'Inositol (myo-inositol and D-chiro-inositol) — insulin sensitiser supplement with good evidence for PCOS acne and ovulatory function',
        ],
      },
    },
    hirsutism: {
      what: 'Excess facial and body hair in a male-pattern distribution — upper lip, chin, chest, abdomen, inner thighs.',
      why: 'Elevated DHT stimulates terminal hair growth in androgen-sensitive follicles.',
      treatment: [
        'Spironolactone — reduces hair growth over 6-12 months',
        'Eflornithine (Vaniqa) cream — slows facial hair growth, prescription',
        'Laser hair removal — long-term reduction. IPL/laser most effective for dark hair on light skin; Nd:YAG for dark skin',
        'Electrolysis — effective for all hair/skin combinations including light hair',
        'Threading, waxing — temporary',
      ],
      for_ethnic_skin: 'Laser hair removal on darker skin requires the Nd:YAG 1064nm laser — other wavelengths have significant burn and PIH risk on Fitzpatrick IV-VI. Always verify the laser type before treatment.',
    },
    acanthosis_nigricans: {
      what: 'Dark, thickened, velvety patches in body folds — neck, armpits, groin, under breasts. A marker of insulin resistance.',
      appearance_in_ethnic_skin: 'Often mistaken for dirt or hyperpigmentation in darker skin. In medium-dark skin, appears as distinctively textured darkening. In very dark skin, the texture (velvety feel) is often more diagnostic than the colour.',
      treatment: 'Treating underlying insulin resistance is the most effective approach. Topically: retinoids, lactic acid, glycolic acid, kojic acid can help lighten. Not "dirty skin" — washing won\'t remove it.',
    },
  },

  hair_effects: {
    female_pattern_hair_loss: {
      what: 'Androgenetic alopecia — DHT miniaturises hair follicles over time, progressing from thick terminal hairs to thin vellus hairs to no hair.',
      pcos_pattern: 'Women with PCOS often experience female pattern hair loss — typically a widening part line and diffuse thinning on the crown rather than the male receding hairline pattern.',
      treatment: [
        'Minoxidil (Rogaine) — OTC, topical. 5% foam once daily most effective for women. Takes 4-6 months to see results.',
        'Spironolactone — anti-androgen, protects follicles from DHT. Taken systemically.',
        'Finasteride or dutasteride (off-label for women) — block DHT production. Must use contraception as teratogenic.',
        'Low-level laser therapy (LLLT) — caps, helmets. Moderate evidence.',
        'PRP (platelet-rich plasma) injections — growing evidence.',
        'Biotin, iron, vitamin D, zinc — correct if deficient (low iron and vitamin D are common PCOS comorbidities).',
      ],
    },
    paradox: 'PCOS can cause BOTH excess hair where you don\'t want it (hirsutism on face/body) AND hair loss where you do want it (scalp). DHT acts on different follicles differently — androgenic follicles on the face and body grow more hair; androgen-sensitive scalp follicles shrink.',
  },

  pcos_in_ethnic_communities: {
    south_asian: {
      prevalence: 'PCOS is significantly more prevalent in South Asian women (up to 52% in some UK studies vs 20-25% typical). Insulin resistance is particularly common.',
      factors: 'Genetic predisposition, South Asian dietary patterns (high refined carbohydrate intake relative to protein/fat), metabolic phenotype differences.',
      ayurvedic_approach: {
        ashwagandha: 'Adaptogen with some evidence for reducing cortisol and improving insulin sensitivity in PCOS',
        shatavari: 'Ayurvedic herb with oestrogenic properties — may support hormonal balance. Check with doctor before taking if on hormonal contraception.',
        spearmint_tea: 'Two cups daily has a small but measurable anti-androgenic effect in clinical trials — reduces free testosterone modestly.',
      },
    },
    black_women: {
      underdiagnosis: 'PCOS is significantly underdiagnosed in Black women — studies suggest they present later, are less likely to be screened, and may have different presentations (less polycystic ovaries on ultrasound but same or worse metabolic features).',
      metabolic: 'Black women with PCOS have higher rates of metabolic syndrome and insulin resistance than white women with PCOS, with important implications for cardiovascular risk.',
    },
    middle_eastern: {
      prevalence: 'Higher prevalence of PCOS in Middle Eastern populations. Vitamin D deficiency (common due to covered dress and indoor lifestyle in some communities) may be a contributing factor — supplementation beneficial.',
    },
  },

  pcos_skincare_strategy: {
    principle: 'Address the root cause (hormonal) for systemic issues while using topicals for symptom management. No topical product fixes hormonal acne as effectively as addressing the underlying androgen excess.',
    routine: {
      am: [
        'Gentle cleanser (avoid stripping — hormonal skin is already compromised)',
        'Niacinamide 10% — anti-inflammatory, regulates sebum, helps PIH',
        'Azelaic acid 10-15% — anti-acne + PIH dual action',
        'Lightweight oil-free moisturiser',
        'SPF 30-50 (essential — protects against PIH worsening from UV)',
      ],
      pm: [
        'Gentle cleanser',
        'Retinoid (start 2x weekly) — addresses acne AND PIH and anti-aging',
        'Moisturiser',
      ],
    },
    supplements_with_evidence: [
      { supplement: 'Inositol (Myo + D-Chiro 40:1 ratio)', dose: '4g myo-inositol + 100mg D-chiro daily', note: 'Improves insulin sensitivity, reduces androgens, improves ovulation and skin in PCOS. The most evidence-backed supplement.' },
      { supplement: 'Spearmint tea', dose: '2 cups daily', note: 'Mild anti-androgenic effect — reduces free testosterone' },
      { supplement: 'N-acetyl cysteine (NAC)', dose: '600mg 3x daily', note: 'Antioxidant, insulin sensitiser — some evidence for PCOS' },
      { supplement: 'Zinc', dose: '30-40mg daily', note: 'Reduces DHT, anti-inflammatory, helps acne and hair loss. Don\'t take on empty stomach.' },
      { supplement: 'Berberine', dose: '500mg 3x daily', note: 'Strong insulin sensitiser — sometimes called "natural metformin." Do not combine with metformin without medical supervision.' },
    ],
  },
};

// ─── THYROID AND BEAUTY ───────────────────────────────────────────────────────

export const THYROID_BEAUTY_GUIDE = {
  hypothyroidism: {
    skin: [
      'Dry, coarse, thickened skin — particularly on legs and elbows',
      'Pale, yellowish complexion (carotenemia — impaired beta-carotene conversion)',
      'Puffy face, particularly around eyes (myxoedema in severe cases)',
      'Slow wound healing',
      'Brittle nails',
    ],
    hair: [
      'Diffuse hair loss — telogen effluvium pattern (widespread shedding)',
      'Loss of outer third of eyebrow (classic hypothyroid sign)',
      'Dry, coarse, brittle hair texture',
    ],
    beauty_approach: 'Thyroid replacement (levothyroxine) is the treatment — hair and skin improve significantly once thyroid function is restored. While managing: intensive hydration for skin, deep conditioning for hair, avoid aggressive heat styling on already-brittle hair.',
    note: 'Biotin supplements (popular for hair loss) can interfere with thyroid blood tests, giving falsely normal results. Disclose all supplements to your doctor.',
  },

  hyperthyroidism: {
    skin: [
      'Warm, smooth, moist skin — increased metabolism increases body temperature and sweating',
      'Thinned, fragile skin',
      'Pretibial myxoedema in Graves\' disease — thickened skin on lower legs',
    ],
    hair: [
      'Diffuse hair loss',
      'Fine, silky hair texture (paradoxically, may feel better initially — then loss)',
    ],
    note: 'Hair loss from thyroid dysfunction is reversible with treatment, but takes 6-12 months after thyroid normalisation to recover.',
  },
};

// ─── BIRTH CONTROL AND SKIN ───────────────────────────────────────────────────

export const BIRTH_CONTROL_SKIN_GUIDE = {
  overview: 'Different contraceptive methods have very different effects on skin and hair depending on their hormonal composition.',

  combined_oral_contraceptives: {
    generally_good_for_acne: 'Most combined OCP contain anti-androgenic progestins or androgenically-neutral progestins and are NET BENEFICIAL for acne.',
    best_for_skin: [
      { pill: 'Diane-35 / Estelle-35 (cyproterone acetate)', note: 'Most anti-androgenic progestin. Prescribed specifically for acne/PCOS in many countries.' },
      { pill: 'Yasmin / Yaz (drospirenone)', note: 'Anti-androgenic progestin. FDA-approved for acne.' },
      { pill: 'Belara (chlormadinone)', note: 'Anti-androgenic, good for skin.' },
    ],
    neutral_for_skin: 'Pills containing gestodene, desogestrel, norgestimate — generally neutral to mildly beneficial for skin.',
    potentially_acne_worsening: [
      { pill: 'Levonorgestrel-containing pills', note: 'More androgenic progestin — can worsen acne in sensitive individuals. Includes Microgynon, Levlen, many combined pills. Not universally problematic.' },
      { pill: 'Norethindrone (high-dose)', note: 'Androgenic progestin' },
    ],
  },

  progestin_only: {
    mini_pill: {
      note: 'Norethindrone-only mini-pills — can worsen acne due to androgenic progestin. Desogestrel (Cerazette) is more neutral.',
    },
    hormonal_iud: {
      mirena: {
        note: 'Levonorgestrel IUD. Very low systemic absorption — most people don\'t see significant skin effects. Some do experience acne, particularly in the first year.',
        for_whom: 'Generally very skin-friendly due to low systemic hormone levels. Some people with PCOS or highly androgen-sensitive skin may experience some acne.',
      },
      kyleena_jaydess: 'Lower dose than Mirena — even lower systemic effects, less likelihood of skin impact.',
    },
    implant: {
      nexplanon: {
        note: 'Etonogestrel implant — relatively low androgenic activity progestin. Most people tolerate well for skin. Some experience acne.',
      },
    },
    depot_injection: {
      depo_provera: {
        note: 'Medroxyprogesterone acetate injection. Can worsen acne in some individuals.',
      },
    },
  },

  non_hormonal: {
    copper_iud: {
      note: 'The copper IUD (Paragard/Copper T) contains NO hormones. Skin effects are nil from the IUD itself. Some people find natural cycle hormonal fluctuations more noticeable without hormonal contraception modulating them — including more cyclical acne.',
    },
  },

  discontinuing_pill: {
    post_pill_acne: {
      what: 'Many people experience acne when stopping combined OCP — particularly if they started the pill for acne. The pill suppressed androgen production; removal of that suppression leads to androgen rebound.',
      timeline: 'Typically worst at 3-6 months post-pill. Usually improves by 12 months as hormone levels stabilise.',
      management: 'Start topical retinoid 1-2 months before stopping the pill. Have azelaic acid or niacinamide ready. For severe cases, spironolactone can bridge the transition period.',
    },
  },
};

// ─── MENSTRUAL CYCLE AND SKIN ─────────────────────────────────────────────────

export const MENSTRUAL_CYCLE_SKIN = {
  overview: 'The menstrual cycle creates predictable skin changes across four phases. Tracking your cycle and adapting your routine accordingly is one of the most underused beauty strategies.',

  phases: {
    menstrual: {
      days: '1-5',
      hormones: 'Oestrogen and progesterone both low',
      skin: 'Can be dry, dull, slightly pale. Skin at its thinnest. More sensitive.',
      strategy: 'Gentle, nourishing routine. Extra hydration. Avoid harsh actives.',
    },
    follicular: {
      days: '6-13',
      hormones: 'Oestrogen rising',
      skin: 'Skin at its best — oestrogen boosts collagen and hydration. More radiant, fewer blemishes.',
      strategy: 'Perfect time for treatments, facials, laser if doing any. Skin is more resilient.',
    },
    ovulation: {
      days: '14',
      hormones: 'Oestrogen peaks, LH surge',
      skin: 'Most radiant day of the cycle for many people.',
    },
    luteal: {
      days: '15-28',
      hormones: 'Progesterone dominates, then both drop',
      skin: 'Oilier skin (progesterone increases sebum). Pre-menstrual breakouts appear days 20-28 as progesterone falls and androgens are relatively higher. Puffiness, under-eye circles.',
      strategy: 'Increase salicylic acid usage from day 20. Spot treat emerging blemishes immediately with azelaic acid or benzoyl peroxide. Reduce sugar intake if tracking dietary impacts.',
    },
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getHormonesOverview() {
  return HORMONES_OVERVIEW;
}

export function getPCOSGuide(communityId) {
  if (communityId && PCOS_GUIDE.pcos_in_ethnic_communities[communityId]) {
    return { ...PCOS_GUIDE, community_specific: PCOS_GUIDE.pcos_in_ethnic_communities[communityId] };
  }
  return PCOS_GUIDE;
}

export function getThyroidBeautyGuide() {
  return THYROID_BEAUTY_GUIDE;
}

export function getBirthControlSkinGuide() {
  return BIRTH_CONTROL_SKIN_GUIDE;
}

export function getMenstrualCycleSkin() {
  return MENSTRUAL_CYCLE_SKIN;
}

export function getHormonalAcneGuide() {
  return {
    overview: HORMONES_OVERVIEW.key_hormones_affecting_skin.androgens,
    pcos_acne: PCOS_GUIDE.skin_effects.acne,
    cycle_guide: MENSTRUAL_CYCLE_SKIN,
    birth_control: BIRTH_CONTROL_SKIN_GUIDE,
  };
}

export const HORMONAL_BEAUTY_STATS = {
  hormonesCovered: Object.keys(HORMONES_OVERVIEW.key_hormones_affecting_skin).length,
  pcosSupplements: PCOS_GUIDE.pcos_skincare_strategy.supplements_with_evidence.length,
  communitiesCovered: Object.keys(PCOS_GUIDE.pcos_in_ethnic_communities).length,
  birthControlTypes: Object.keys(BIRTH_CONTROL_SKIN_GUIDE).length - 1,
};
