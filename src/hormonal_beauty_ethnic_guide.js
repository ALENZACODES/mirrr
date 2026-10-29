/**
 * MIRRR — Hormonal Beauty Ethnic Guide
 * Hormones and skin/hair from puberty through menopause, by community
 * Topics: estrogen, progesterone, androgens, thyroid, cortisol, insulin, ethnic patterns
 */

// ============================================================
// HORMONE SKIN SCIENCE
// ============================================================

export const HORMONE_SKIN_SCIENCE = {
  overview: `Hormones are among the most powerful modulators of skin and hair. Every major life stage —
  puberty, the menstrual cycle, pregnancy, perimenopause, and menopause — is driven by hormonal shifts
  that profoundly affect skin texture, oiliness, pigmentation, hydration, collagen content, and hair
  growth. Understanding the hormonal basis of skin allows for targeted, science-backed beauty strategies
  that are synchronized with the body\'s own biology rather than fighting it.`,

  majorHormones: {
    estrogen: {
      name: 'Estrogen (estradiol, estrone, estriol)',
      primarySource: 'Ovaries (primarily), adipose tissue, adrenal glands, placenta (pregnancy)',
      skinEffects: {
        positive: [
          'Stimulates collagen synthesis — estrogen is the primary collagen hormone; women lose ~30% of skin collagen in first 5 years of menopause',
          'Maintains skin hydration — estrogen increases hyaluronic acid production and sebaceous gland secretion',
          'Promotes wound healing — estrogen accelerates re-epithelialization and reduces scarring',
          'Anti-inflammatory — estrogen suppresses inflammatory cytokines',
          'Maintains skin thickness and elasticity'
        ],
        concerns: [
          'High estrogen can increase melanocyte stimulating hormone → melasma risk',
          'Estrogen dominance can cause breast tenderness, bloating, mood changes'
        ]
      },
      hairEffects: {
        positive: ['Promotes scalp hair growth; keeps hair in anagen (growth) phase longer', 'High estrogen during pregnancy causes thicker, fuller hair'],
        concerns: ['Postpartum estrogen crash causes telogen effluvium (mass hair shedding 3-6 months after birth)']
      }
    },

    progesterone: {
      name: 'Progesterone',
      primarySource: 'Corpus luteum (after ovulation), placenta (pregnancy), adrenal glands',
      skinEffects: {
        overview: 'Progesterone rises in luteal phase (day 14-28 of cycle); counterbalances estrogen',
        sebum: 'Progesterone may slightly increase sebum; explains pre-menstrual breakouts in some women',
        temperature: 'Raises basal body temperature; can worsen rosacea or flushing',
        fluid: 'Progesterone affects fluid retention; skin may appear puffier in luteal phase'
      },
      hairEffects: 'Limited direct hair effects; interacts with androgen pathways'
    },

    androgens: {
      name: 'Androgens (testosterone, DHT, DHEA)',
      primarySource: 'Adrenal glands, ovaries (in women), testes (in men)',
      skinEffects: {
        sebum: 'Sebaceous glands are androgen-sensitive; androgens increase sebum production — primary driver of acne',
        pores: 'Androgens enlarge pore size by increasing sebaceous gland size',
        pih: 'Androgen-driven acne particularly problematic for Fitzpatrick IV-VI skin due to PIH risk',
        irriation: 'Androgen excess (PCOS) causes acne on jaw, chin, and chest'
      },
      hairEffects: {
        scalp: 'DHT (dihydrotestosterone) binds to hair follicle receptors → miniaturizes follicles → androgenetic alopecia (female/male pattern hair loss)',
        body: 'Androgens increase body and facial hair growth (hirsutism in women with PCOS)',
        dht: 'DHT converted from testosterone via 5-alpha-reductase enzyme; finasteride blocks this conversion'
      }
    },

    cortisol: {
      name: 'Cortisol (stress hormone)',
      primarySource: 'Adrenal cortex; released in response to HPA axis activation (stress)',
      skinEffects: {
        collagen: 'Cortisol inhibits collagen synthesis; chronic stress visibly ages skin',
        barrier: 'Cortisol reduces ceramide production → weakens skin barrier → dryness, sensitivity, eczema flares',
        sebum: 'Cortisol stimulates androgen precursors → increases sebum → stress acne',
        healing: 'Cortisol impairs wound healing; stressed individuals heal 40% more slowly in studies',
        telomeres: 'Chronic stress shortens telomeres → accelerates cellular aging'
      },
      hairEffects: {
        shedding: 'Cortisol disrupts hair cycle timing → telogen effluvium',
        growth: 'Cortisol suppresses hair growth phase; chronic stress pushes more follicles into rest/shed phase'
      }
    },

    insulin: {
      name: 'Insulin and IGF-1',
      primarySource: 'Pancreas (insulin); liver (IGF-1 stimulated by growth hormone)',
      skinEffects: {
        acne: 'High glycemic diet → insulin spike → IGF-1 surge → sebum production + keratinocyte proliferation → comedone formation → acne',
        darkening: 'Insulin resistance → acanthosis nigricans (dark velvety skin in skin folds: neck, armpits, groin)',
        aging: 'Advanced glycation end products (AGEs) from high blood sugar cross-link collagen → premature aging, loss of elasticity'
      },
      note: 'Dietary glycemic index directly influences hormone cascade that drives acne and skin aging'
    },

    thyroid: {
      name: 'Thyroid hormones (T3, T4)',
      primarySource: 'Thyroid gland; regulated by TSH from pituitary',
      skinEffects: {
        hypothyroid: 'Low thyroid: dry, rough, pale, puffy skin; decreased sweating; slow wound healing; xanthelasma risk',
        hyperthyroid: 'High thyroid: warm, moist, velvety skin; excessive sweating; pretibial myxedema',
        common: 'Hypothyroidism often undiagnosed; dry skin + hair loss common presentation'
      },
      hairEffects: {
        hypothyroid: 'Diffuse hair loss (entire scalp); outer third eyebrow thinning (Hertoghe sign); can be severe and alarming',
        hyperthyroid: 'Hair fine and soft; some hair loss; diffuse thinning',
        treatment: 'Thyroid treatment restores hair; may take 6-12 months for full regrowth'
      }
    },

    melatonin: {
      name: 'Melatonin',
      primarySource: 'Pineal gland; released in darkness; peaks 2-4 AM',
      skinEffects: {
        antioxidant: 'Melatonin is a powerful antioxidant; receptors on skin cells; protects against oxidative stress',
        repair: 'Melatonin coordinates overnight skin repair; circadian clock molecule for skin',
        topical: 'Topical melatonin research shows antioxidant protection; limited but promising'
      }
    }
  }
};

// ============================================================
// LIFE STAGES
// ============================================================

export const HORMONAL_LIFE_STAGES = {
  puberty: {
    ageRange: 'Girls: 8-13 onset; Boys: 9-14 onset',
    hormones: 'Adrenal androgens (DHEA) first (adrenarche), then gonadal sex hormones',
    skinChanges: {
      sebum: 'Androgens dramatically increase sebum production — oily skin begins',
      acne: 'Acne vulgaris: most common skin condition of puberty; affects 85% of teens at some point',
      pores: 'Pore size increases; particularly visible on nose, forehead, chin (T-zone)',
      hyperpigmentation: 'Early hormonal acne in darker skin begins the PIH cycle — scar pigmentation that can persist for months'
    },
    hairChanges: {
      body: 'Pubic hair, underarm hair, leg hair, facial hair (men) — all androgen-driven',
      seborrheic: 'Seborrheic dermatitis (dandruff) more common with increased scalp oil',
      scalp: 'Scalp hair often improves with rising estrogen in girls; may oilify in boys'
    },
    care: {
      teens: [
        'Salicylic acid 0.5-2% cleanser or toner for acne (BHA dissolves in oil)',
        'Non-comedogenic moisturizer even for oily skin — skipping moisturizer worsens oil production',
        'Sunscreen every day — prevents pigmentation from acne scars worsening',
        'Benzoyl peroxide 2.5% for active breakouts (higher % not more effective; more irritating)',
        'Dark skin teens: extra sunscreen on acne-prone areas; PIH sets in quickly'
      ]
    }
  },

  menstrualCycle: {
    overview: 'Average 28-day cycle divided into follicular and luteal phases; hormones fluctuate dramatically',
    phases: {
      menstruation: {
        days: '1-5',
        hormones: 'Estrogen and progesterone at lowest; prostaglandins high (cause cramping)',
        skin: 'Skin often dull; slightly sensitive; some individuals most broken out during period itself'
      },
      follicular: {
        days: '6-13',
        hormones: 'Estrogen rises steadily; FSH active',
        skin: 'Estrogen improving: skin clearer, plumper, more luminous; best week for skin for many; collagen synthesis optimal',
        hair: 'Good week for hair: estrogen promotes shine and strength'
      },
      ovulation: {
        days: '14 (approximately)',
        hormones: 'LH surge; estrogen peaks; testosterone briefly peaks',
        skin: 'LH and testosterone surge: sebum may increase briefly; some experience small hormonal pimple',
        glow: 'Many describe "ovulation glow" — estrogen peak at its most beautifying'
      },
      luteal: {
        days: '15-28',
        hormones: 'Progesterone dominates; estrogen declines; PMS symptoms possible',
        skin: 'Progesterone increases sebum; pre-menstrual breakouts typical days 21-27; skin feels puffier; more sensitive',
        hair: 'Progesterone and declining estrogen: hair may feel oilier at scalp'
      }
    },

    cycleBasedBeauty: {
      week1: 'Gentle care during menstruation; hydrate and soothe',
      week2: 'Best week for active treatments (retinol, chemical peels, facials); skin most resilient',
      week3: 'Maintain routine; enjoy ovulation glow; keep pores clear',
      week4: 'Increase salicylic acid use; reduce heavy products; expect possible breakout',
      summary: 'Syncing skincare actives to cycle phases (follicular = stronger actives, luteal = gentler) is not mainstream yet but biologically logical'
    }
  },

  pregnancy: {
    hormones: 'Dramatic increases in estrogen (100x), progesterone, hCG, prolactin, melanocyte-stimulating hormone',
    skinChanges: {
      positive: ['Pregnancy glow: increased blood volume + estrogen → luminous skin', 'Acne may clear (or worsen depending on individual hormone response)'],
      concerns: {
        melasma: 'Chloasma (pregnancy mask): melanocyte-stimulating hormone surges → hyperpigmentation on face (forehead, cheeks, upper lip); affects 50-70% of pregnant women; worse in darker skin',
        lineaNigra: 'Dark vertical line on abdomen (linea nigra); hormone-driven pigmentation',
        stretchMarks: 'Expanding skin + cortisol + genetic factors → striae; begin in 2nd-3rd trimester',
        spiderVeins: 'Increased estrogen causes spider veins and varicose veins',
        oiliness: 'Some experience increased oiliness and acne from androgen-like effects of progesterone'
      },
      postpartum: {
        hairLoss: 'Telogen effluvium: postpartum hair shedding peaks 3-4 months after birth as estrogen crashes; can be alarming but is normal and temporary',
        recovery: 'Hair regrowth begins 4-6 months postpartum; full recovery by 12-15 months'
      }
    },
    safeIngredients: [
      'Hyaluronic acid, glycerin, ceramides — safe hydration',
      'Vitamin C — safe antioxidant brightening',
      'Niacinamide — safe for PIH/melasma (avoid high doses)',
      'Azelaic acid — safe for acne and melasma; category B'
    ],
    unsafeIngredients: [
      'Retinol/retinoic acid — avoid entirely (teratogenic); switch to bakuchiol',
      'Hydroquinone — avoid (absorbed systemically)',
      'Salicylic acid — avoid above 2% (small amounts in cleanser generally ok)',
      'High-dose vitamin A supplements — avoid',
      'Chemical SPF oxybenzone/octinoxate — mineral SPF (zinc oxide/titanium dioxide) preferred'
    ]
  },

  perimenopause: {
    ageRange: 'Typically 40-51; average onset 47',
    hormones: 'Fluctuating estrogen (can be higher than baseline, then drops); progesterone decline; FSH rising; androgens relatively unchanged',
    duration: '4-10 years before full menopause',
    skinChanges: {
      collagen: 'Accelerating collagen loss; skin loses firmness noticeably',
      dryness: 'Estrogen fluctuation → decreasing hydration; increasing dryness episodes',
      acne: 'Perimenopausal acne: estrogen fluctuation + relatively stable androgens = adult cystic acne, especially on lower face/jaw',
      hotFlashes: 'Vasomotor symptoms (hot flashes) cause flushing; can worsen rosacea'
    },
    care: 'Retinol more important than ever; ceramide-rich moisturizers; niacinamide for PIH of hormonal breakouts'
  },

  menopause: {
    ageRange: 'Average onset 51 (US); defined as 12 months without menstrual period',
    hormones: 'Estrogen declines to ~10% of reproductive levels; progesterone near zero; testosterone relatively maintained',
    skinChanges: {
      collagen: '30% of skin collagen lost in first 5 years of menopause; 1-2% per year thereafter',
      thickness: 'Skin becomes thinner, more fragile, more transparent; vessels more visible',
      dryness: 'Decreased sebum, decreased hyaluronic acid, decreased ceramide — multi-layer barrier loss',
      laxity: 'Loss of elastin + collagen → jowling, nasolabial deepening, neck laxity',
      itch: 'Formication (skin crawling sensation) and pruritus common from low estrogen',
      darkSpots: 'Years of UV accumulation become visible as hyperpigmentation; dark spots multiply',
      darkSkin: 'Darker skin retains more collagen longer than lighter skin (lower baseline rate of photoaging); menopause skin changes still occur but often at somewhat slower visual pace'
    },
    hairChanges: {
      thinning: 'Estrogen decline → more DHT-sensitive follicles → androgenetic alopecia (female pattern hair loss)',
      texture: 'Hair may become finer, drier, more brittle; less estrogen = less anagen phase duration',
      facial: 'Paradoxically: facial hair may increase as estrogen declines and androgens relatively predominate'
    },
    care: {
      essentials: [
        'Retinol/retinoid: most important active for post-menopausal skin collagen support',
        'Vitamin C L-ascorbic acid: antioxidant + collagen synthesis cofactor',
        'Peptides: signal collagen synthesis; copper peptides particularly studied',
        'Ceramides: replace what the skin barrier can no longer produce at youthful levels',
        'SPF 50 daily: prevent further UV-collagen damage and dark spot accumulation'
      ],
      hrt: {
        name: 'Hormone Replacement Therapy (HRT)',
        skin: 'Systemic HRT preserves skin collagen significantly; randomized trials show 6-8% collagen increase vs placebo over 6 months',
        note: 'HRT is a medical decision with complex risk/benefit profile; consult physician; skin benefits are real but secondary consideration'
      }
    }
  }
};

// ============================================================
// PCOS AND HORMONAL SKIN CONDITIONS
// ============================================================

export const HORMONAL_CONDITIONS = {
  pcos: {
    name: 'Polycystic Ovary Syndrome (PCOS)',
    prevalence: 'Affects 6-12% of women of reproductive age; most common endocrine disorder in women; often underdiagnosed',
    hormones: 'High LH, elevated androgens (testosterone, DHEA), often insulin resistance',
    skinManifestations: {
      acne: 'Androgen-driven acne: cystic, deep, along jaw and chin, chest, back; resistant to conventional topical treatments',
      hirsutism: 'Excessive facial/body hair (lip, chin, sideburns, chest, abdomen, inner thighs)',
      acanthosis: 'Acanthosis nigricans: dark velvety skin in skin folds (neck, armpits, groin) from insulin resistance',
      pih: 'PCOS acne in darker skin leads to extensive PIH — one of the most challenging pigmentation scenarios'
    },
    ethnicPrevalence: {
      southAsian: 'PCOS prevalence 52% higher in South Asian women than white European; more insulin resistance component',
      blackAmerican: 'Higher androgen levels in PCOS for Black women; more severe hirsutism presentation',
      middleEastern: 'High prevalence in Middle Eastern populations; insulin resistance component significant'
    },
    treatment: {
      medical: ['Oral contraceptives (reduce androgens)', 'Spironolactone (anti-androgen)', 'Metformin (insulin resistance)', 'Inositol supplements (insulin sensitizer)'],
      skincare: ['Azelaic acid for acne and PIH simultaneously', 'Niacinamide for PIH', 'Salicylic acid for comedones', 'SPF every day (prevent PIH worsening)'],
      lifestyle: ['Low glycemic diet (reduces insulin → reduces androgen)', 'Exercise (improves insulin sensitivity)', 'Spearmint tea (mild anti-androgen effects; limited but positive research)']
    }
  },

  maleskin: {
    name: 'Male Hormonal Skin Pattern',
    hormones: 'Testosterone 10-20x higher than women; DHT converted in skin via 5-alpha-reductase',
    differences: {
      thickness: 'Male skin ~25% thicker than female skin; more collagen density',
      sebum: 'Sebum production 2x higher; oilier skin; more acne-prone in youth',
      aging: 'Male skin ages more slowly until 50s; then accelerates; different pattern from female',
      alopecia: 'Male pattern hair loss (MPB) driven by DHT; affects 50% of men by age 50'
    }
  },

  adultAcne: {
    name: 'Adult Hormonal Acne',
    prevalence: 'Up to 45% of women in their 20s, 26% in 30s, 12% in 40s experience acne',
    pattern: 'Hormonal adult acne: lower face, jaw, chin, sometimes chest — vs teen acne (forehead, nose)',
    cause: 'Androgen sensitivity of lower-face follicles; premenstrual androgen fluctuations',
    treatment: ['Spironolactone 50-100mg', 'Low-dose oral contraceptives', 'Topical retinoids', 'Azelaic acid 15-20%', 'Niacinamide (reduces sebum via inflammation pathway)']
  }
};

// ============================================================
// 9 COMMUNITY HORMONAL BEAUTY GUIDES
// ============================================================

export const ETHNIC_HORMONAL_BEAUTY_GUIDES = {
  'west-african': {
    communityName: 'West African',
    primaryConcerns: ['PCOS incidence', 'PIH from hormonal acne', 'Postpartum hair loss'],

    hormonalPattern: {
      acne: 'Hormonal acne in Fitzpatrick V-VI skin rapidly produces PIH — each inflammatory lesion leaves dark mark lasting months',
      pcos: 'PCOS in West African women: androgen-driven; hirsutism and acne prominent features',
      postpartum: 'Postpartum telogen effluvium (hair shedding) common 3-4 months after birth; alarming but temporary',
      menopause: 'Menopausal skin changes occur but collagen-rich darker skin maintains structure somewhat longer than lighter skin'
    },

    hormonalSkincare: {
      activeAcne: 'Azelaic acid 20% treats both acne AND PIH simultaneously — ideal for dark skin hormonal acne',
      preventionPIH: 'Niacinamide 10% nightly to prevent PIH from forming after hormonal breakout',
      brightening: 'Vitamin C + tranexamic acid for existing dark spots',
      spf: 'SPF 30-50 daily — UV exposure dramatically worsens PIH'
    },

    hairHormonal: {
      postpartum: 'Iron supplementation after birth; hair shedding normal but iron deficiency makes it worse and prolongs it',
      pcos: 'PCOS-driven hair thinning: speak with physician about spironolactone or inositol',
      care: 'Protective styles during postpartum shedding reduce manipulation and visible breakage'
    },

    advice: `For West African women, the hormonal acne → PIH cycle is the primary hormonal beauty challenge.
    Unlike lighter skin where acne resolves leaving temporary redness, dark skin acne leaves dark marks
    lasting 6-18 months per lesion. The prevention protocol is non-negotiable: SPF daily prevents UV
    from deepening spots; azelaic acid treats both conditions simultaneously; niacinamide prevents new
    spots from forming. PCOS awareness is also important — if struggling with persistent jaw/chin acne,
    excess facial hair, or irregular periods, ask for a hormonal panel.`
  },

  'south-asian': {
    communityName: 'South Asian',
    primaryConcerns: ['Very high PCOS prevalence', 'Melasma', 'Perioral hyperpigmentation'],

    hormonalPattern: {
      pcos: 'South Asian women have 52% higher PCOS prevalence than white European women; insulin resistance component particularly strong',
      melasma: 'Melasma (chloasma) extremely common in South Asian women; hormonal, UV, and genetic intersection',
      perioral: 'Perioral hyperpigmentation (dark skin around mouth) partly hormonal; androgen-sensitive area',
      hairLoss: 'Female pattern hair loss increasingly recognized in South Asian women; often attributed incorrectly to iron deficiency only'
    },

    hormonalSkincare: {
      melasma: 'Tranexamic acid (oral or topical) most evidence-based treatment for hormonal melasma; kojic acid + vitamin C combination',
      pcos: 'PCOS acne: combination niacinamide + azelaic acid + low glycemic diet; consider physician consultation for spironolactone',
      sunProtection: 'SPF 50+ PA++++ critical — even brief UV exposure reactivates melasma; tinted SPF helps reflect visible light that also triggers melasma'
    },

    hairHormonal: {
      pcos: 'PCOS-related hair thinning from DHT; Ayurvedic supplements like saw palmetto have limited but positive evidence as mild DHT blockers',
      postpartum: 'Post-delivery hair shedding common; amla and bhringraj oils support regrowth during recovery phase',
      iron: 'Iron deficiency anemia common in South Asian women (menstrual loss + inadequate dietary intake); check ferritin — low ferritin worsens hair loss significantly'
    },

    advice: `South Asian women face a perfect storm: genetic PCOS predisposition, UV-triggered melasma
    vulnerability, and melanocyte-stimulating hormone sensitivity. Tranexamic acid is the single most
    effective ingredient for South Asian hormonal melasma — both topically (2-5%) and oral (250mg twice
    daily under physician supervision). PCOS screening should be routine for any South Asian woman with
    hormonal acne, irregular cycles, or unexplained weight changes. The Ayurvedic tradition of oil
    massages and cooling herbs has real value for hormonal hair — bhringraj is documented to promote
    hair growth and is an ideal complement to conventional treatment.`
  },

  caribbean: {
    communityName: 'Caribbean',
    primaryConcerns: ['Hormonal acne PIH', 'Sun-triggered melasma', 'Postpartum care'],

    hormonalPattern: {
      acne: 'Hormonal acne with Fitzpatrick IV-VI skin: each lesion risks PIH; tropical climate increases pore congestion and acne',
      melasma: 'Melasma extremely common in Caribbean women — hormonal + very high UV index combination',
      postpartum: 'Postpartum hormonal changes: hair loss common; skin changes from pregnancy melasma need continued management after birth'
    },

    hormonalSkincare: {
      melasma: 'Melasma: consistent SPF 50+ (every day even in shade); vitamin C serum; niacinamide; azelaic acid',
      acne: 'Hormonal acne: salicylic acid to prevent; azelaic acid to treat and prevent PIH; clay mask 1-2x weekly',
      pregnancy: 'During pregnancy: azelaic acid (safe) + vitamin C + mineral SPF only; avoid hydroquinone and retinol'
    },

    hairHormonal: {
      postpartum: 'Loose protective styles during postpartum shedding; avoid tension; take iron and biotin',
      care: 'Caribbean postpartum tradition: castor oil scalp massages to stimulate regrowth; has mild evidence support'
    },

    advice: `Caribbean hormonal beauty is dominated by the melasma challenge — high UV + hormonal sensitivity
    creates persistent facial hyperpigmentation that\'s very difficult to manage without rigorous sun
    protection. Shade is insufficient; SPF must be applied even indoors near windows. Postpartum hair
    shedding is near-universal and will resolve — the challenge is keeping length and avoiding breakage
    during the 3-6 month shedding window. Protective styles and gentle handling are the best approach.`
  },

  arab: {
    communityName: 'Arab / Middle Eastern',
    primaryConcerns: ['Melasma', 'PCOS', 'Hormonal hair loss'],

    hormonalPattern: {
      melasma: 'Melasma very common in Arab/Middle Eastern women; olive-to-brown skin (Fitzpatrick III-V) is "melasma-prone" range',
      pcos: 'High PCOS prevalence in Middle Eastern populations; insulin resistance component; covered/hijab lifestyle reduces some UV-triggered melasma',
      perimenopause: 'Perimenopausal skin: maintaining hydration becomes primary concern as dryness sets in'
    },

    hormonalSkincare: {
      melasma: 'Tranexamic acid + niacinamide + azelaic acid combination most effective protocol; avoid harsh scrubbing (triggers PIH)',
      sun: 'Arab women wearing hijab have reduced facial UV exposure — may actually have lower melasma rates on hijab-covered areas',
      antiaging: 'Argan oil + vitamin C as Moroccan/Arab traditional and modern combined approach to perimenopausal skin'
    },

    hairHormonal: {
      loss: 'Hormonal hair thinning: black seed (nigella sativa) oil — most evidence-based traditional remedy; 2% nigella sativa versus 2% minoxidil showed comparable results in small study',
      pcos: 'PCOS hair loss: inositol supplements (myo-inositol) have good evidence for PCOS specifically; cheaper and well-tolerated',
      tradition: 'Thyme and rosemary hair rinses traditional Arab remedies; rosemary oil clinically compared favorably to minoxidil for hair density in 2022 study'
    },

    advice: `Arab hormonal beauty involves managing the melasma-menstruation-UV intersection throughout the
    reproductive years, then pivoting to hydration and anti-aging in perimenopause. The traditional Arab
    medicine cabinet — black seed oil, rosemary, thyme, argan oil — is remarkably well-supported by
    emerging evidence. Nigella sativa (black seed) oil for hormonal hair thinning and rosemary oil for
    scalp circulation are the two with the strongest modern evidence base. For melasma, tranexamic acid
    is the game-changer ingredient — available orally or topically, and specifically addresses the
    hormonal component of pigmentation.`
  },

  latina: {
    communityName: 'Latina / Hispanic',
    primaryConcerns: ['Melasma', 'Hormonal acne PIH', 'PCOS'],

    hormonalPattern: {
      melasma: 'Melasma very common in Latina women; Fitzpatrick III-V range with high UV regions of origin',
      pcos: 'PCOS common in Latina women; often insulin resistance component; different presentation across Caribbean/South American/Mexican ancestry',
      acne: 'Hormonal adult acne: lower face, jaw pattern; persistent through 30s in many Latina women'
    },

    hormonalSkincare: {
      melasma: 'Melasma priority: daily SPF 50 + tinted (for visible light) + niacinamide + azelaic acid; tranexamic acid for resistant cases',
      acne: 'Jaw/chin acne: salicylic acid 2% in cleanser + niacinamide 10% + azelaic acid; dietary low GI',
      brightening: 'Vitamin C, kojic acid, licorice root extract for overall brightening and post-acne marks'
    },

    hairHormonal: {
      postpartum: 'Postpartum shedding: loose protective styling; castor oil scalp treatment; iron and ferritin check',
      pcos: 'PCOS thinning: low GI diet dramatically helps; myo-inositol supplements; rosemary oil for scalp'
    },

    advice: `Latina hormonal beauty challenges span acne, melasma, and PCOS-driven concerns — all amplified by
    high UV environments across Latin America. The heritage of herbal medicine (yerba mate, rosemary,
    chamomile, aloe) has legitimate overlap with modern evidence. Aloe vera gel is genuinely effective
    for post-acne redness; rosemary oil has clinical evidence for hair density. For the adult hormonal
    acne that persists into the 30s: this is estrogen/androgen fluctuation, not teen acne — treating it
    requires hormonal awareness, not just stronger benzoyl peroxide.`
  },

  'east-asian': {
    communityName: 'East Asian',
    primaryConcerns: ['Melasma (later onset)', 'Anti-aging preservation', 'Postpartum'],

    hormonalPattern: {
      melasma: 'Melasma occurs in East Asian women but often at slightly later onset; strong photoaging component',
      menopause: 'East Asian women report fewer vasomotor symptoms (hot flashes) in some studies; theories include soy isoflavone diet',
      aging: 'East Asian skin appears to age later than European skin visually — genetic factors in collagen density and melanin protection; but accelerated aging can catch up in 40s-50s'
    },

    hormonalSkincare: {
      melasma: 'Tranexamic acid highly popular in Korean and Japanese skincare for hyperpigmentation and melasma',
      antiaging: 'Korean skincare anti-aging protocol from early 20s: vitamin C, niacinamide, hyaluronic acid, SPF',
      perimenopause: 'Ceramide-based moisturizers become critical in peri/post-menopause when barrier rapidly weakens'
    },

    hairHormonal: {
      soy: 'Isoflavones (soy, miso) have mild phytoestrogenic effect; may partially buffer perimenopausal hair thinning',
      postpartum: 'Postpartum hair loss: camellia oil scalp massage traditional Japanese practice; supports circulation',
      growth: 'Korean scalp care culture: scalp toners, scalp serums, scalp massagers as preventive hair loss care'
    },

    advice: `East Asian hormonal beauty benefits from one of the world\'s most sophisticated skincare cultures
    AND a traditionally phytoestrogenic diet. Soy (miso, edamame, tofu) contains isoflavones that bind
    weakly to estrogen receptors — the traditional Japanese and Korean diet may partially explain lower
    reported menopause symptom severity. Korean multi-step skincare is optimally suited to hormonal skin
    management: the layered approach allows treating multiple hormonal concerns (brightening, anti-aging,
    hydration) simultaneously without overloading skin.`
  },

  'east-african': {
    communityName: 'East African',
    primaryConcerns: ['PCOS', 'PIH from hormonal acne', 'Vitamin D (diaspora women)'],

    hormonalPattern: {
      pcos: 'PCOS in East African women: androgen-driven pattern; made worse by vitamin D deficiency common in diaspora',
      vitaminD: 'Vitamin D deficiency epidemic in East African diaspora at northern latitudes; vitamin D has documented effect on testosterone and PCOS',
      dark: 'Fitzpatrick V-VI skin: hormonal acne PIH risk extremely high; each cyst leaves months-long dark mark'
    },

    hormonalSkincare: {
      pcos: 'PCOS skin: azelaic acid 15-20% most effective for cystic chin acne + PIH simultaneously',
      vitaminD: 'Vitamin D3 supplementation (2000-4000 IU daily) may improve PCOS markers including androgen levels',
      dullness: 'Vitamin D deficiency also affects skin: fatigue, dullness, slow healing — address deficiency as beauty concern'
    },

    hairHormonal: {
      pcos: 'PCOS hair thinning: frankincense oil on scalp for inflammation; clinical evidence limited but traditional use consistent',
      postpartum: 'Post-birth shedding: protect Type 4 hair with gentle protective styles; avoid heat; iron levels critical'
    },

    advice: `East African diaspora women face a specific hormonal challenge: vitamin D deficiency from living
    at latitudes with insufficient UV-B, combined with skin type that synthesizes vitamin D less efficiently.
    Vitamin D deficiency worsens PCOS, increases hair shedding, and slows wound healing (worsening PIH).
    Supplementing 2000-4000 IU D3 daily is the single most impactful hidden beauty intervention for
    East African diaspora women. The PIH from hormonal acne in Fitzpatrick V-VI skin requires a patient,
    consistent approach — azelaic acid and niacinamide used consistently for months produce real change.`
  },

  'south-african': {
    communityName: 'South African',
    primaryConcerns: ['High UV melasma', 'Diverse hormonal patterns by subpopulation', 'Postpartum'],

    hormonalPattern: {
      melasma: 'Very high UV index throughout South Africa (even Cape Town in winter); melasma common across all skin types',
      diversity: 'South African beauty encompasses Fitzpatrick I-VI; hormonal concerns vary accordingly',
      menopause: 'South African women across backgrounds reach menopause with different baseline collagen levels; darker skin has more collagen reserve'
    },

    hormonalSkincare: {
      melasma: 'Melasma: extreme SPF discipline required; marula oil for evening out texture; vitamin C for brightening; tranexamic acid for resistant cases',
      antiaging: 'Rooibos aspalathin supports antioxidant capacity for menopausal skin oxidative stress',
      postPartum: 'Postpartum: buchu herb traditional South African remedy; anti-inflammatory properties'
    },

    hairHormonal: {
      postpartum: 'Post-birth shedding varies by hair type; afro-textured hair: protective style; straight hair: loose bun; minimize manipulation',
      menopause: 'Menopausal hair thinning: marula oil scalp treatment; rooibos scalp rinse for anti-inflammatory support'
    },

    advice: `South African hormonal beauty is defined by the extraordinary UV environment — even in winter,
    UV index routinely reaches 5-7 in Cape Town and higher in the north. This means UV-triggered hormonal
    melasma is relentless without year-round SPF 50+. The South African natural pharmacy — rooibos,
    buchu, marula, devil\'s claw — has genuine anti-inflammatory and antioxidant properties that complement
    hormonal skin management. For the diverse South African population: darker-skinned South African women
    maintain collagen density well through menopause; lighter-skinned women need to prioritize retinol
    earlier to compensate for higher photoaging rate.`
  },

  'black-american': {
    communityName: 'Black American',
    primaryConcerns: ['PCOS', 'Hormonal acne PIH cycle', 'Menopausal pigmentation'],

    hormonalPattern: {
      pcos: 'PCOS in Black American women: historically underdiagnosed; more androgen-driven; higher androgen levels',
      acne: 'Hormonal acne is extremely common; each inflammatory lesion in Fitzpatrick V-VI skin risks months of PIH',
      menopause: 'Black American women enter menopause earlier on average (by ~8.5 months based on SWAN study); longer perimenopause duration',
      disparities: 'Black women often receive less hormonal workup and treatment in healthcare system; self-advocacy important'
    },

    hormonalSkincare: {
      pcos: 'PCOS skin protocol: azelaic acid + niacinamide + SPF is the trifecta for dark skin hormonal acne',
      postpartum: 'Post-pregnancy skin: melasma during pregnancy; maintain SPF and vitamin C after birth for recovery',
      menopause: 'Menopausal skin: ceramide moisturizers + retinol + vitamin C; collagen loss still occurs even in darker skin'
    },

    hairHormonal: {
      postpartum: 'Postpartum shedding: silk bonnet continues through shedding phase; protective styles minimize visible breakage; iron supplementation critical',
      menopause: 'Menopausal hair thinning: scalp health focus; rosemary oil clinically compared to minoxidil; speak with dermatologist about topical minoxidil',
      pcos: 'PCOS hair thinning: physician evaluation important given historical underdiagnosis of PCOS in Black women'
    },

    advice: `Black American hormonal beauty faces both the universal hormonal challenges AND systemic healthcare
    disparities — Black women with PCOS are less likely to receive diagnosis and treatment. Self-advocacy
    matters: if experiencing jaw/chin acne, excess facial hair, irregular periods, and/or weight changes,
    request a full hormonal panel (testosterone, DHEA, LH, FSH, insulin, vitamin D). The beauty impact
    of PCOS in Fitzpatrick V-VI skin is profound because each cycle of hormonal acne creates PIH that
    persists far longer than the breakout itself. The protocol is: prevent with SPF + niacinamide; treat
    active acne with azelaic acid; be patient — PIH in dark skin takes months to fade even with perfect
    protocol.`
  }
};

// ============================================================
// HELPER FUNCTION
// ============================================================

export function getHormonalBeautyGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_HORMONAL_BEAUTY_GUIDES['west-african'],
    'south-asian': ETHNIC_HORMONAL_BEAUTY_GUIDES['south-asian'],
    'caribbean': ETHNIC_HORMONAL_BEAUTY_GUIDES['caribbean'],
    'arab': ETHNIC_HORMONAL_BEAUTY_GUIDES['arab'],
    'latina': ETHNIC_HORMONAL_BEAUTY_GUIDES['latina'],
    'east-asian': ETHNIC_HORMONAL_BEAUTY_GUIDES['east-asian'],
    'east-african': ETHNIC_HORMONAL_BEAUTY_GUIDES['east-african'],
    'south-african': ETHNIC_HORMONAL_BEAUTY_GUIDES['south-african'],
    'black-american': ETHNIC_HORMONAL_BEAUTY_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

// ============================================================
// STATS
// ============================================================

export const HORMONAL_BEAUTY_STATS = {
  moduleId: 'hormonal_beauty_ethnic_guide',
  version: '1.0.0',
  communities: 9,
  keyFacts: [
    'Women lose ~30% of skin collagen in first 5 years of menopause — estrogen is the primary collagen hormone',
    'PCOS affects 6-12% of reproductive-age women; South Asian women have 52% higher prevalence than white European women',
    'Postpartum telogen effluvium (hair shedding) peaks 3-4 months after birth; resolves by 12-15 months',
    'Hormonal acne on dark skin (Fitzpatrick IV-VI) creates PIH that lasts 6-18 months per lesion',
    'Vitamin D deficiency worsens PCOS androgen markers — diaspora women at northern latitudes are at high risk',
    'Rosemary oil compared favorably to minoxidil for hair density in clinical studies',
    'Tranexamic acid addresses the hormonal component of melasma — available orally or topically',
    'Azelaic acid uniquely treats both acne AND PIH simultaneously — ideal active for dark hormonal skin',
    'Black American women enter menopause approximately 8.5 months earlier on average than white women (SWAN study)',
    'High glycemic diet → insulin spike → IGF-1 → increased sebum + keratinocyte proliferation → acne'
  ],
  lastUpdated: '2026-10-29'
};
