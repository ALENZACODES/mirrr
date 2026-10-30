/**
 * MIRRR — Hormone and Beauty Guide
 * How hormones affect skin and hair across life stages,
 * menstrual cycles, pregnancy, perimenopause, and menopause.
 * Skin-of-colour considerations throughout.
 */

export const HORMONE_SKIN_SCIENCE = {
  title: 'Hormones and Skin — The Biological Mechanisms',
  overview: 'Hormones are chemical messengers that travel through the bloodstream and regulate virtually every aspect of bodily function; the skin is a hormonally responsive organ with receptors for oestrogen, progesterone, androgens, cortisol, thyroid hormones, insulin, and growth hormone; changes in any of these hormones — through the menstrual cycle, pregnancy, menopause, thyroid disease, or metabolic conditions — produce visible changes in the skin and hair',
  keyHormones: {
    oestrogen: {
      role: 'Oestrogen is the primary female sex hormone; skin effects: stimulates collagen synthesis (particularly type I and III collagen); maintains skin hydration by stimulating hyaluronic acid production; supports sebaceous gland regulation; oestrogen receptors are found throughout the skin including the epidermis, dermis, and hair follicles',
      decline: 'Post-menopausal oestrogen decline causes: accelerated collagen loss (skin loses approximately 30% of its collagen in the first 5 years after menopause); increased dryness; reduced wound healing; increased wrinkling; changes in fat distribution affecting face shape'
    },
    progesterone: {
      role: 'Progesterone (dominant in the second half of the menstrual cycle — the luteal phase): increases sebum production; causes water retention (skin may appear slightly swollen and pores look larger); high progesterone in the luteal phase contributes to pre-menstrual breakouts',
      pregnancy: 'Very high progesterone during pregnancy contributes to: increased sebum (pregnancy glow in some cases; pregnancy acne in others); hyperpigmentation (particularly melasma, "mask of pregnancy"); darkening of nipples and linea nigra (belly line)'
    },
    androgens: {
      role: 'Androgens (testosterone, DHT — dihydrotestosterone, DHEA-S) are present in all people regardless of sex but in higher concentrations in males; skin effects: stimulate sebaceous gland activity (sebum production); promote acne when high; responsible for male pattern hair loss through DHT\'s action on follicles',
      PCOS: 'Polycystic Ovary Syndrome (PCOS) involves androgen excess in people assigned female at birth; skin manifestations: acne (particularly hormonal acne along the jawline, chin, and lower cheeks); hirsutism (increased facial and body hair in male-pattern distribution); scalp hair thinning (androgenic alopecia); acanthosis nigricans (darkening of skin folds — in the armpits, neck, groin — associated with insulin resistance that often accompanies PCOS)',
      ethnicRisk: 'PCOS is more prevalent in South Asian women (estimated 20-25% prevalence in South Asian women globally — approximately twice the global average) and also elevated in Hispanic/Latina women; this makes hormonal acne management and hirsutism particularly relevant in these communities'
    },
    cortisol: {
      role: 'Cortisol (the primary stress hormone) affects skin through multiple mechanisms: breaks down collagen (chronically elevated cortisol causes accelerated skin ageing); increases sebum production (stress acne); disrupts the skin barrier; suppresses anti-inflammatory immune responses; triggers mast cell degranulation (histamine release)',
      chronic: 'Chronic stress is one of the most significant contributors to accelerated skin ageing and inflammatory skin conditions; the effect of cortisol on skin is why stress management is considered a legitimate skincare intervention'
    },
    thyroid: {
      hypothyroid: 'Hypothyroidism (underactive thyroid): decreased metabolism affects skin cell turnover; symptoms: dry, rough, pale skin; dry, brittle hair (telogen effluvium); loss of the outer third of eyebrows (a classic clinical sign); brittle nails; cool, doughy skin texture; myxoedema (fluid accumulation in skin with hypothyroidism)',
      hyperthyroid: 'Hyperthyroidism (overactive thyroid): increased metabolism; symptoms: warm, moist, smooth skin; diffuse hair loss (telogen effluvium); increased sweating; pretibial myxoedema in Graves\' disease (a specific skin thickening over the shins)',
      ethnicity: 'Autoimmune thyroid disease (Hashimoto\'s hypothyroidism and Graves\' hyperthyroidism) is more common in women and in certain ethnic groups; South Asian women are particularly affected; thyroid function should be checked in any woman with unexplained hair loss, skin changes, or weight changes'
    },
    insulin: {
      role: 'Insulin and IGF-1 (insulin-like growth factor-1) have direct effects on skin; elevated insulin (from high glycaemic diet or insulin resistance): increases sebum production; promotes keratinocyte proliferation (may drive acne comedones); stimulates melanocytes (may worsen hyperpigmentation)',
      acanthosis: 'Acanthosis nigricans (velvety dark thickening of skin folds — axillae/armpits, neck, groin) is a sign of insulin resistance; more visible in darker skin types; not a cosmetic concern to be bleached but a signal to investigate metabolic health',
      skin: 'Type 2 diabetes (a manifestation of insulin resistance) has multiple skin effects: dry, itchy skin; impaired wound healing; increased infection susceptibility; necrobiosis lipoidica (a characteristic skin change on the shins); skin tags (acrochordons); the dermatological signs of diabetes are often visible before the diagnosis is made'
    }
  }
};

export const MENSTRUAL_CYCLE_SKIN = {
  title: 'The Menstrual Cycle and Skin',
  phases: {
    menstrual: {
      days: 'Days 1-5 (roughly)',
      hormones: 'Oestrogen and progesterone are both low; prostaglandins released from the uterine lining cause inflammation throughout the body',
      skin: 'Skin may be at its most sensitive; inflammatory prostaglandins can trigger flares of inflammatory conditions (eczema, rosacea, psoriasis); PIH from previous breakouts may be at its most visible without the "glow" of higher oestrogen phases; stick to a simple, calming routine; avoid chemical exfoliation during peak sensitivity days'
    },
    follicular: {
      days: 'Days 6-13 (roughly)',
      hormones: 'Oestrogen rises steadily throughout this phase, peaking just before ovulation; testosterone is also present and rises gently',
      skin: 'The "oestrogen high" phase — skin is often at its best: collagen synthesis increases; hyaluronic acid levels supported; skin appears plumper, brighter, more even-toned; this is often described as the "good skin week"; sebum production is relatively lower; an ideal time for any significant skin treatments (chemical peels, microneedling, facial appointments)'
    },
    ovulation: {
      days: 'Day 14 (in a 28-day cycle)',
      hormones: 'LH (luteinising hormone) surge triggers ovulation; oestrogen is at peak; testosterone spikes briefly (libido spike)',
      skin: 'Oestrogen peak produces maximum glow and radiance; lips may appear slightly fuller; the testosterone spike can produce a small cluster of hormonal spots for some people; generally still a good skin phase'
    },
    luteal: {
      days: 'Days 15-28 (roughly)',
      hormones: 'Progesterone rises and dominates; the corpus luteum produces progesterone; if pregnancy doesn\'t occur, progesterone falls in the last few days (triggering menstruation)',
      skin: 'The most challenging phase for skin: progesterone increases sebum production → more likely to break out; progesterone causes water retention → pores may appear larger; skin may appear slightly bloated or congested; this is when hormonal acne (often around the jawline and chin) develops; the week before menstruation (PMS) is when skin most needs consistent care and stress management; salicylic acid spot treatment may be helpful during this phase'
    }
  },
  management: {
    tracking: 'Tracking the menstrual cycle and correlating with skin observations (using an app like Clue, Flo, or Natural Cycles) allows personalisation of skincare: concentrating heavier treatments in the follicular phase when skin is most resilient; being more gentle in the menstrual and late luteal phase; scheduling facial appointments for the follicular phase',
    hormonal: 'Combined oral contraceptives (COCs) regulate hormonal fluctuations by providing steady-state synthetic hormones; this often significantly improves hormonal acne; certain progestin types in COCs (norethisterone, levonorgestrel) have more androgenic effect and may worsen acne; others (drospirenone, cyproterone acetate, norgestimate) are less androgenic or anti-androgenic and are preferred for acne; the decision to use hormonal contraception is medical and personal — a GP or dermatologist can advise on the best choice for concurrent acne management'
  }
};

export const PREGNANCY_SKIN = {
  title: 'Pregnancy Skin Changes',
  expected: {
    glow: 'Pregnancy glow: increased blood volume (40-50% increase in pregnancy) and increased circulation to the skin; combined with high oestrogen supporting collagen and hyaluronic acid — some pregnant women experience their most glowing skin',
    acne: 'Pregnancy acne: conversely, high progesterone and androgen levels in early pregnancy increase sebum and can cause acne; the first trimester is most commonly affected; usually improves in the second trimester as hormone levels stabilise; many standard acne treatments are contraindicated in pregnancy',
    melasma: 'Melasma ("mask of pregnancy"): oestrogen and progesterone stimulate melanocytes; high UV triggers excess melanin production; melasma appears as symmetrical brown patches across the forehead, upper cheeks, and upper lip; more common and more severe in Fitzpatrick III-VI skin types; fades postpartum but may persist; daily SPF is the most critical intervention',
    lineaNigra: 'Linea nigra: the dark line that appears on the abdomen during pregnancy from the navel to the pubic bone; normal hormonal darkening of existing linea alba; fades postpartum',
    stretchMarks: 'Striae gravidarum (stretch marks): occur in 50-90% of pregnant women; genetics is the strongest predictor; appear as the skin stretches rapidly beyond its elastic capacity; initially pink/red/purple (active); fade to silver/white (mature); the dermis is physically torn — creams and oils cannot prevent them in genetically predisposed women; shea butter, oil application, and keeping skin moisturised may improve comfort and the appearance of active marks but cannot prevent the underlying mechanism'
  },
  contraindicated: {
    list: [
      'Retinoids (all forms: retinol, tretinoin, adapalene, isotretinoin) — teratogenic; must be stopped before trying to conceive',
      'Salicylic acid (above 2% — low-concentration formulations are generally considered acceptable by some dermatologists; oral salicylic acid absolutely contraindicated)',
      'Hydroquinone — absorbed systemically; avoid in pregnancy',
      'Chemical peels at clinical concentrations',
      'Benzoyl peroxide — limited data; best avoided particularly in early pregnancy',
      'Certain essential oils at therapeutic concentrations',
      'Oral antibiotics (some, including tetracyclines, are absolutely contraindicated)'
    ],
    safe: [
      'Vitamin C (L-ascorbic acid) — antioxidant; safe topically in pregnancy',
      'Niacinamide — safe in pregnancy; anti-inflammatory and brightening',
      'Azelaic acid (15-20%) — the dermatologist\'s preferred acne and pigmentation treatment in pregnancy; Class B safety in pregnancy',
      'Hyaluronic acid — safe topically',
      'Glycolic acid (low concentration, brief contact) — generally considered acceptable by many dermatologists',
      'SPF/sunscreen — essential; mineral sunscreens (zinc oxide, titanium dioxide) are preferred by some as they are not absorbed; chemical sunscreens are generally considered safe by regulatory bodies but many pregnant women prefer mineral'
    ]
  }
};

export const MENOPAUSE_SKIN = {
  title: 'Perimenopause and Menopause — Skin and Hair',
  perimenopause: {
    definition: 'Perimenopause is the transition period before menopause; may begin years before the last period; characterised by erratic oestrogen fluctuations (not simply a linear decline); the average age of onset is the mid-40s but can begin in the late 30s or extend to the early 50s',
    skinChanges: 'Oestrogen fluctuations cause: variable skin dryness; hot flashes (vasodilation causing redness and heat); night sweats (disrupting sleep and therefore skin repair); increased skin sensitivity; worsening rosacea in women prone to it; re-emergence of hormonal acne (lower oestrogen relative to androgens can cause post-40 hormonal acne)'
  },
  menopause: {
    definition: 'Menopause is defined as 12 consecutive months without a menstrual period; the average age globally is 51',
    skinChanges: {
      collagen: 'Collagen loss accelerates dramatically post-menopause: approximately 30% of skin collagen is lost in the first 5 years after menopause; this is the most rapid collagen loss across the lifespan; the skin becomes visibly thinner, less firm, and more wrinkled',
      hydration: 'Hyaluronic acid production decreases with falling oestrogen; skin becomes drier and requires more intensive moisturising',
      barrier: 'Skin barrier function declines; transepidermal water loss increases; skin becomes more sensitive and reactive',
      atrophy: 'Genitourinary syndrome of menopause (GSM): includes vaginal dryness and atrophy; not a skin topic per se but affects quality of life significantly for many menopausal women; local oestrogen treatment (vaginal oestrogen) is highly effective and not systemically absorbed in significant amounts'
    },
    hairChanges: {
      thinning: 'Hair thinning (female pattern androgenic alopecia) accelerates after menopause as oestrogen\'s protective effect on hair follicles declines; the hair miniaturisation (follicles shrink) seen in male pattern balding occurs in female pattern on a more diffuse distribution',
      growth: 'Paradoxically, facial hair may increase after menopause as the oestrogen/androgen ratio shifts in favour of relative androgen dominance'
    }
  },
  HRT: {
    option: 'Hormone replacement therapy (HRT) / menopausal hormone therapy (MHT): supplementing declining oestrogen and progesterone; evidence-based treatment for menopausal symptoms; skin benefits of HRT include: slowing collagen loss; improving skin hydration; supporting skin firmness; the decision to use HRT is medical and personal, balancing benefits against individual risk factors',
    topical: 'Topical oestrogen applied to facial skin has been studied and shows improvement in skin thickness, collagen content, and elasticity; not yet a mainstream prescription treatment in most markets but used in some European countries'
  },
  management: {
    skincare: 'Post-menopausal skincare prioritises: rich moisturisers (ceramides, fatty acids, hyaluronic acid, glycerin); retinoids (now more important than ever for stimulating collagen; start low and build); peptides (signal collagen synthesis); vitamin C (antioxidant and collagen synthesis support); SPF every day without exception; the skin is thinner and more sensitive so gradual introduction of actives is important'
  }
};

export const ETHNIC_HORMONE_GUIDES = {
  'west-african': {
    PCOS: 'PCOS (polycystic ovary syndrome) is present across all ethnicities but the clinical presentation and associated metabolic risk varies; West African and Black women with PCOS may have more severe insulin resistance and a higher risk of metabolic complications; hormonal acne associated with PCOS in West African women (Fitzpatrick V-VI) carries significant PIH risk — every breakout risks leaving a dark spot that takes 12-24 months to fade; the triple burden of hormonal acne + PIH + potential ochronosis risk from unregulated lightening products makes PCOS management particularly complex',
    menopause: 'Menopausal skin changes in darker skin types (Fitzpatrick V-VI) may be less visually apparent early (more collagen reserve in deeper skin) but the underlying collagen loss is the same; the reduction in melanin regulation with falling oestrogen can paradoxically cause irregular pigmentation patterns; post-menopausal West African skin continues to need intensive hydration and sun protection'
  },
  'south-asian': {
    PCOS: 'South Asian women have the highest documented PCOS prevalence globally (approximately 20-25%); the hormonal acne along the jawline and chin is often severe; hirsutism (facial hair in androgen-sensitive areas) is a distressing symptom that intersects with South Asian beauty culture around facial hair removal; treatment options include hormonal management (combined contraceptives with anti-androgenic progestins; spironolactone; metformin for insulin resistance); the PCOS-acne-PIH cycle in South Asian skin (Fitzpatrick III-V) requires careful management',
    ayurveda: 'Ayurvedic concepts of hormonal balance (understanding the doshas — vata, pitta, kapha — as representing physiological regulatory systems): an Ayurvedic perspective sees hormonal imbalance as an excess or deficiency of doshas requiring dietary, herbal, and lifestyle correction; popular Ayurvedic hormonal support herbs include: shatavari (Asparagus racemosus — "she who has a hundred husbands"; traditional women\'s tonic); ashwagandha (adaptogen with cortisol-regulating evidence); triphala (digestive and hormonal support); these approaches can complement but should not replace conventional hormonal assessment'
  },
  caribbean: {
    thyroid: 'Thyroid disorders are prevalent in women of Caribbean heritage; hypothyroidism in particular can cause significant hair loss (telogen effluvium), dry skin, and weight gain that may be mistaken for other causes; thyroid function testing is important in any Caribbean woman with unexplained hair thinning or skin changes',
    pregnancy: 'Pregnancy melasma is particularly visible and persistent in Caribbean women with Fitzpatrick IV-VI skin; the high UV exposure in tropical Caribbean climates dramatically worsens pregnancy melasma; consistent daily SPF (mineral-based) throughout pregnancy is critical; the cultural tradition of herbal pregnancy teas (some may be unsafe in pregnancy) requires careful assessment by a healthcare provider'
  },
  arab: {
    hijabInfluence: 'Women who wear hijab may experience different hormonal-skin interactions: the scalp and neck are covered and therefore not UV-exposed, which can be protective for scalp skin; vitamin D deficiency is more common in women who cover most of their skin (including Arab and Muslim South Asian women who cover); vitamin D is synthesised in the skin under UV exposure; vitamin D deficiency is associated with hair loss and exacerbation of alopecia areata',
    Ramadan: 'Ramadan fasting affects hormonal patterns: extended overnight eating may alter insulin sensitivity and cortisol rhythms; sleep disruption during Ramadan (many Muslims stay up late for prayer and early pre-dawn meals) disrupts growth hormone secretion and skin repair; the post-Ramadan return to normal eating patterns can cause temporary skin changes; staying well-hydrated during the non-fasting hours is important for skin'
  },
  latina: {
    PCOS: 'Hispanic/Latina women have elevated PCOS prevalence and often more severe insulin resistance component (related to the elevated type 2 diabetes risk in Latin American heritage communities); metformin and lifestyle interventions (dietary glycaemic load reduction, exercise) are first-line alongside hormonal management; the hormonal acne + PIH cycle in Latina women (typically Fitzpatrick III-V) is common and requires a comprehensive management approach',
    menopause: 'Latina women tend to experience earlier natural menopause on average than non-Hispanic white women (approximately 1-2 years earlier); peri-menopausal symptoms including hot flashes may be more frequent; the intersection of menopausal hormonal changes with already melasma-prone Latina skin can cause new or worsened facial pigmentation post-menopause'
  },
  'east-asian': {
    earlyAgeing: 'East Asian skin (Fitzpatrick II-IV) typically shows signs of intrinsic ageing later than lighter-skinned populations due to higher melanin providing some UV protection; however, the post-menopausal oestrogen drop causes accelerated collagen loss that can appear relatively abrupt against a background of maintained youthfulness; this creates the perception of "sudden" facial changes in some East Asian women at menopause',
    pregnancy: 'East Asian women have significant pregnancy melasma susceptibility; the practice of "zuo yue zi" (Chinese postpartum confinement — "sitting the month") traditionally includes rest, dietary restrictions, and specific practices; some traditional zuo yue zi restrictions (avoiding cold water, staying indoors) have been associated with infection risk; modern approaches modify these for safety while maintaining cultural meaning'
  },
  'east-african': {
    hormonal: 'East African women are affected by hormonal skin conditions similarly to other Fitzpatrick V-VI groups; PCOS is present though prevalence data is limited; hormonal acne and PIH in darker skin requires particular care; the traditional use of turmeric (in Ethiopia: ird) and black seed oil have some evidence base for anti-inflammatory support that may complement hormonal acne management',
    vitamin_d: 'East African communities in diaspora (UK, US, Scandinavia) frequently have vitamin D deficiency due to reduced UV exposure combined with higher skin melanin (requiring longer sun exposure to produce equivalent vitamin D); vitamin D deficiency is associated with hair loss, poor wound healing, and exacerbation of autoimmune skin conditions; supplementation is particularly important for East African diaspora communities'
  },
  'south-african': {
    diversity: 'South Africa\'s diverse population means hormonal skin concerns vary widely; Black South African women with Fitzpatrick V-VI have the highest PIH risk from hormonal acne; Afrikaner women with Fitzpatrick I-II have the highest UV-related hormonal melasma risk; Indian South African women have elevated PCOS and associated hormonal acne prevalence',
    access: 'Access to hormonal healthcare (endocrinology, reproductive endocrinology) is unequal in South Africa, with better access in private healthcare vs public sector; dermatology access follows the same pattern; community health education about PCOS symptoms (irregular periods + acne + excess facial hair) is important so that women access care rather than managing symptoms cosmetically only'
  },
  'black-american': {
    PCOS: 'PCOS in Black American women often presents differently from the "classic" Northern European presentation: Black women with PCOS may have a lower rate of the classical "polycystic" ultrasound appearance while still having the hormonal and metabolic features; this means PCOS is often under-diagnosed in Black American women using criteria developed in predominantly white study populations; the clinical presentation including hormonal acne, irregular periods, and acanthosis nigricans should prompt investigation even without classic ultrasound findings',
    menopause: 'Black American women experience menopause on average slightly earlier than white women; they experience more hot flashes and night sweats (reported as more severe and more disruptive of sleep); yet menopausal hormone therapy (HRT) is prescribed at lower rates to Black women; sleep disruption from night sweats directly impairs skin repair processes and accelerates cortisol-mediated skin ageing',
    fibroids: 'Uterine fibroids are significantly more common and more severe in Black American women (up to 3x more common than in white women; occurring at younger ages and growing faster); fibroids cause heavy menstrual bleeding leading to iron deficiency anaemia; iron deficiency is a significant cause of hair loss (telogen effluvium) in Black women; recognising heavy periods and unexplained hair loss as a potential iron deficiency-fibroid connection is important in this community'
  }
};

export function getHormoneSkinGuide(section) {
  const map = {
    science: HORMONE_SKIN_SCIENCE,
    menstrual: MENSTRUAL_CYCLE_SKIN,
    pregnancy: PREGNANCY_SKIN,
    menopause: MENOPAUSE_SKIN
  };
  return map[section] || null;
}

export function getEthnicHormoneGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_HORMONE_GUIDES['west-african'],
    'south-asian': ETHNIC_HORMONE_GUIDES['south-asian'],
    caribbean: ETHNIC_HORMONE_GUIDES.caribbean,
    arab: ETHNIC_HORMONE_GUIDES.arab,
    latina: ETHNIC_HORMONE_GUIDES.latina,
    'east-asian': ETHNIC_HORMONE_GUIDES['east-asian'],
    'east-african': ETHNIC_HORMONE_GUIDES['east-african'],
    'south-african': ETHNIC_HORMONE_GUIDES['south-african'],
    'black-american': ETHNIC_HORMONE_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

export const HORMONE_BEAUTY_STATS = {
  moduleId: 'hormone_beauty_guide',
  version: '1.0.0',
  topics: ['PCOS South Asian highest prevalence 20-25% hormonal acne', 'menstrual cycle skin oestrogen follicular luteal', 'pregnancy melasma mask mask of pregnancy oestrogen', 'retinoids contraindicated pregnancy teratogenic', 'azelaic acid safe pregnancy acne pigmentation', 'menopause collagen loss 30% first 5 years', 'androgen sebum acne IGF-1 insulin resistance', 'thyroid hypothyroid hair loss telogen outer brow', 'acanthosis nigricans insulin resistance skin dark fold', 'Black American fibroids iron deficiency hair loss', 'PCOS underdiagnosed Black women different ultrasound', 'vitamin D deficiency East African diaspora hair loss', 'cortisol collagen breakdown stress skin ageing', 'hormonal acne jawline chin progesterone luteal phase'],
  communitiesSupported: 9,
  keyFacts: [
    'South Asian women have the highest documented PCOS prevalence globally (estimated 20-25% — approximately twice the global average); Hispanic/Latina women also have elevated prevalence; PCOS causes hormonal acne along the jawline and chin that in Fitzpatrick III-V skin creates a cycle of acne → PIH → attempted lightening → potential ochronosis risk; comprehensive PCOS management (hormonal treatment + topical acne/PIH management + strict sun protection) is the only effective approach',
    'Approximately 30% of skin collagen is lost in the first 5 years after menopause due to oestrogen decline — this is the most rapid period of collagen loss in the human lifespan; post-menopausal skincare should prioritise retinoids (the most evidence-backed collagen-stimulating topical), vitamin C (collagen synthesis cofactor), and peptides (collagen signalling), used on well-moisturised skin with consistent daily SPF',
    'Uterine fibroids are significantly more common in Black American women (up to 3x more common than in white women, occurring at younger ages and growing faster) and cause heavy menstrual blood loss leading to iron deficiency anaemia; iron deficiency is a significant and underrecognised cause of diffuse hair loss (telogen effluvium) in Black American women — the connection between heavy periods, iron deficiency, and hair thinning needs to be recognised in clinical and beauty consultations',
    'Vitamin D deficiency is particularly common in East African diaspora communities in northern climates because: darker skin melanin requires longer UV exposure to produce equivalent vitamin D vs lighter skin; living at higher latitudes means less UV intensity year-round; vitamin D deficiency is associated with hair loss, poor wound healing, and exacerbation of alopecia areata and other autoimmune hair conditions — supplementation is important for this community'
  ]
};
