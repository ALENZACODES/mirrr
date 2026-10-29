/**
 * MIRRR Beauty Supplements Guide
 * Evidence-based review of supplements for skin, hair, and nails
 * Biotin myths, collagen peptides, vitamins, minerals, and adaptogens
 */

// ─── SUPPLEMENT OVERVIEW ──────────────────────────────────────────────────────

export const SUPPLEMENT_OVERVIEW = {
  important_caveat: 'The supplement industry is poorly regulated in most countries. Many beauty supplements are marketed with impressive claims and minimal evidence. This guide separates evidence-backed options from marketing hype.',

  key_principles: [
    'Supplements correct DEFICIENCIES — if you\'re not deficient, extra supplementation rarely helps more',
    'Food first — most nutrients are better absorbed from food than pills',
    'Bloodwork before supplementing — test for deficiencies before assuming you need them',
    'Bioavailability matters — the form of the supplement affects how well it\'s absorbed',
    'Interactions — supplements can interact with medications; inform your doctor',
    'Timeline — beauty supplements require months of consistent use before assessment',
  ],

  regulation: {
    us: 'In the US, dietary supplements are regulated as food, not drugs (DSHEA 1994). Manufacturers don\'t need to prove efficacy before selling. FDA can only act after a product is proven harmful.',
    uk: 'EU/UK regulations are slightly stricter but supplements still don\'t require pre-market evidence of efficacy.',
    consequence: 'Claims on supplement packaging ("promotes hair growth") are often not required to be proven clinically.',
  },
};

// ─── HAIR SUPPLEMENTS ─────────────────────────────────────────────────────────

export const HAIR_SUPPLEMENTS = {
  biotin: {
    what: 'Biotin (vitamin B7) — a water-soluble B vitamin involved in fatty acid synthesis, carboxylation, and energy metabolism.',
    marketing: 'The most heavily marketed "hair growth" supplement. Billions of dollars in annual sales.',
    evidence: {
      honest_assessment: 'Biotin supplementation helps hair ONLY IF you are biotin deficient. Biotin deficiency is RARE in people who eat normally. There is NO convincing evidence that biotin supplements help hair growth in people with adequate biotin levels.',
      deficiency_signs: 'True biotin deficiency causes hair loss, rash, neurological symptoms. It occurs in people with rare genetic disorders, those on long-term raw egg white diets (avidin binds biotin), or those on certain anticonvulsants.',
      studies: 'The studies showing biotin benefit are almost entirely in people with documented biotin deficiency or rare hair disorders.',
    },
    practical: 'If you\'re eating a varied diet, you\'re almost certainly getting adequate biotin. Supplementing with extra is unlikely to change your hair growth rate.',
    caution: 'HIGH DOSE BIOTIN (>5mg/day) INTERFERES WITH THYROID BLOOD TESTS AND CARDIAC TROPONIN TESTS — can give falsely normal or abnormal results. Stop taking biotin at least 48 hours before bloodwork.',
    verdict: 'Save your money unless you have a documented deficiency. ❌ (for people without deficiency)',
  },

  collagen_supplements: {
    what: 'Hydrolysed collagen peptides — collagen broken down into short amino acid chains (peptides) that are absorbed into the bloodstream after oral ingestion.',
    the_question: 'Does eating collagen rebuild the collagen in your skin?',
    science: {
      mechanism: 'Your body digests collagen supplements into amino acids — mainly glycine, proline, and hydroxyproline. These amino acids can be used by the body to synthesise NEW collagen. But whether they specifically increase skin or hair collagen above what you\'d get from protein foods is debated.',
      evidence: 'Multiple randomised controlled trials show: collagen supplements (5-10g/day for 8-24 weeks) improve skin hydration, elasticity, and reduce wrinkles as assessed by objective measurement. Some studies show reduced joint pain. Hair and nail studies are fewer.',
      limiting: 'Your body directs amino acids where they\'re needed. Eating collagen doesn\'t automatically send it to your face.',
    },
    practical: 'The evidence is reasonably good for skin. Dose 10g/day for skin benefits. Marine collagen is thought to be most bioavailable. Type I collagen for skin and hair; Type II for joints.',
    verdict: 'Probably helpful for skin; decent evidence. ✅ (with realistic expectations)',
  },

  iron: {
    what: 'Iron is essential for hair growth — ferritin (stored iron) is the form to measure, not just haemoglobin.',
    hair_loss: 'Iron deficiency (without anaemia) is a very common cause of diffuse hair shedding in women and people of reproductive age. Ferritin below 30 ng/mL has been associated with telogen effluvium-pattern hair loss.',
    prevalence: {
      menstruating: 'Up to 30% of menstruating women are iron deficient. Those with heavy periods, vegetarians, and those eating low meat diets are at highest risk.',
      south_asian: 'Higher prevalence of iron deficiency anaemia in South Asian women — combination of dietary patterns and heavy menstrual flow.',
      african_american: 'Fibroids (uterine fibroids) are significantly more common in Black women — heavy menstrual bleeding from fibroids is a major cause of iron deficiency.',
    },
    testing: 'Request FERRITIN (not just standard CBC/full blood count) when investigating hair loss. Standard blood tests often miss iron deficiency without anaemia.',
    supplementing: {
      forms: [
        { form: 'Ferrous bisglycinate', note: 'Gentlest on stomach, well-absorbed. Best tolerated form. Recommended starting point.' },
        { form: 'Ferrous sulfate', note: 'Cheap, effective, but frequently causes constipation and GI upset. Traditional form.' },
        { form: 'Ferrous gluconate', note: 'Gentler than sulfate, widely available' },
        { form: 'Liposomal iron', note: 'Highly bioavailable, very low GI side effects. More expensive.' },
      ],
      absorption: 'Take with vitamin C (ascorbic acid enhances iron absorption by up to 3x). Avoid calcium, dairy, coffee, and tea within 2 hours of iron supplement.',
      caution: 'Do NOT supplement iron without confirmed deficiency — excess iron is harmful. Test, then supplement.',
    },
    verdict: 'The #1 most impactful hair supplement IF you are deficient. Test first. ✅ (if deficient)',
  },

  vitamin_d: {
    what: 'Vitamin D — fat-soluble vitamin synthesised in the skin from UVB exposure. Acts as a hormone.',
    hair: {
      connection: 'Vitamin D receptors are present in hair follicles. Deficiency has been associated with alopecia areata and diffuse hair loss.',
      evidence: 'Association studies show low vitamin D is common in people with hair loss. Whether supplementation restores hair in deficient individuals is less well-studied but logical.',
    },
    skin: {
      connection: 'Vitamin D is involved in skin barrier function, immune regulation, and wound healing.',
      deficiency_signs: 'Increased inflammatory skin conditions, impaired healing.',
    },
    prevalence: {
      who_is_deficient: 'Vitamin D deficiency is extremely common globally — estimated 40-50% of people worldwide have insufficient levels.',
      ethnic_note: 'People with darker skin tones synthesise LESS vitamin D from the same UVB exposure as lighter skin (melanin reduces UVB penetration). People in northern latitudes with darker skin are at very high risk of deficiency.',
      cultural: 'Full-body coverage in sun (cultural or religious practice) significantly increases deficiency risk in all skin tones.',
    },
    testing: 'Request 25-hydroxyvitamin D blood test. Optimal level: 40-60 ng/mL (100-150 nmol/L). Deficiency: below 20 ng/mL.',
    supplementing: {
      dose: '2000-4000 IU daily for most deficient adults. Very deficient may need more under medical supervision.',
      form: 'Vitamin D3 (cholecalciferol) is superior to D2 (ergocalciferol).',
      cofactor: 'Take with vitamin K2 (MK-7 form) — helps direct calcium appropriately and works synergistically.',
    },
    verdict: 'Very likely to be deficient if you\'re darker-skinned or live in northern climates. Test and supplement. ✅',
  },

  zinc: {
    what: 'Zinc is involved in hair follicle cycling, keratin production, sebaceous gland function, and immune regulation.',
    hair: 'Zinc deficiency is associated with diffuse hair loss. Supplementing zinc restores hair in deficient individuals.',
    skin: 'Anti-inflammatory — useful for acne (reducing sebum, antibacterial effect on C. acnes). Used orally 30-40mg for moderate acne.',
    sources: 'Red meat, shellfish (oysters are the richest source), legumes, nuts, seeds.',
    deficiency_risk: 'Vegetarians, vegans, and people with high phytate diets (grains, legumes) — phytates reduce zinc absorption.',
    forms: [
      { form: 'Zinc picolinate', note: 'Well-absorbed' },
      { form: 'Zinc glycinate', note: 'Gentle on stomach, well-absorbed' },
      { form: 'Zinc sulfate', note: 'Cheap but can cause nausea on empty stomach' },
    ],
    caution: 'Don\'t take zinc on an empty stomach — nausea. Long-term high-dose zinc supplementation can deplete copper (antagonistic minerals) — consider pairing with copper if supplementing long-term.',
    verdict: 'Worth testing if experiencing hair loss or acne. Supplement if deficient. ✅ (if indicated)',
  },

  omega_3: {
    what: 'Essential fatty acids — EPA and DHA (marine-derived, found in fatty fish) and ALA (plant-derived, found in flaxseed, chia, walnuts).',
    skin: [
      'Anti-inflammatory — reduces inflammatory skin conditions (eczema, psoriasis, acne)',
      'Supports skin barrier lipid function',
      'UV protection (modest) — may reduce UV sensitivity',
    ],
    hair: 'Some evidence for reduced hair loss and improved hair density with omega-3 supplementation.',
    source_options: [
      { source: 'Fish oil (EPA/DHA)', note: 'Best bioavailable form. Look for third-party tested for purity (mercury).' },
      { source: 'Algae oil', note: 'Vegan source of EPA and DHA — direct from the algae fish eat. Equally effective as fish oil.' },
      { source: 'Flaxseed oil (ALA)', note: 'Plant omega-3 that partially converts to EPA/DHA in the body. Conversion is limited.' },
    ],
    dose: '1-3g EPA+DHA daily for anti-inflammatory effects.',
    verdict: 'Solid evidence for skin — worth trying for inflammatory conditions. ✅',
  },

  silica: {
    what: 'Silicon (as silica/orthosilicic acid) — a structural mineral involved in connective tissue, collagen synthesis, and bone health.',
    hair_nails: 'Some evidence that silica supplementation improves hair strength and thickness, and nail hardness.',
    form: 'Bioavailable silica (orthosilicic acid, choline-stabilised) is absorbed; colloidal silicon dioxide from food/supplements has low bioavailability.',
    food_sources: 'Horsetail herb tea, oats, cucumbers, bananas.',
    verdict: 'Modest evidence. Low risk. Reasonable addition to a hair/nail stack. ✅ (weak)',
  },
};

// ─── SKIN SUPPLEMENTS ─────────────────────────────────────────────────────────

export const SKIN_SUPPLEMENTS = {
  vitamin_c: {
    what: 'Vitamin C (ascorbic acid) — essential cofactor for collagen synthesis; also a powerful antioxidant.',
    beauty_effects: [
      'Required for collagen production — without adequate vitamin C, the body cannot synthesise collagen properly',
      'Antioxidant — neutralises free radicals from UV and pollution that damage skin',
      'Some evidence for UV protection (complementary to SPF)',
      'Reduces hyperpigmentation by inhibiting tyrosinase (melanin production)',
    ],
    dietary: 'Most people in developed countries get adequate vitamin C from diet. Deficiency (scurvy) is rare. However, the doses needed for skin benefits may be higher than RDA.',
    supplement: 'High dose vitamin C (500-1000mg) is safe (water soluble — excess excreted). Some evidence for skin benefits at higher doses.',
    topical_vs_oral: 'Topical vitamin C is MORE targeted for skin than oral — directly delivers to skin tissue at high concentrations.',
    verdict: 'Eat your vegetables first. Supplementing is unlikely to hurt and may help at higher doses. ✅ (conditional)',
  },

  astaxanthin: {
    what: 'Carotenoid antioxidant produced by algae — what gives salmon their pink colour.',
    evidence: 'One of the strongest evidence bases for a beauty supplement. Multiple RCTs show improved skin elasticity, hydration, wrinkle depth, and UV protection with 6mg/day for 8 weeks.',
    why_works: 'Exceptionally potent antioxidant — 6000x more potent than vitamin C, 800x more potent than CoQ10 in certain assays. Protects skin cell membranes and DNA from oxidative damage.',
    dose: '6-12mg daily.',
    verdict: 'Strong evidence. One of the most evidence-backed beauty supplements. ✅✅',
  },

  coenzyme_q10: {
    what: 'CoQ10 — antioxidant involved in cellular energy production. Naturally produced in the body, declines with age.',
    evidence: 'Some evidence for skin: reduces oxidative damage, may improve wrinkles with oral supplementation. Topically, well-established antioxidant.',
    form: 'Ubiquinol (reduced form) more bioavailable than ubiquinone, especially important over age 40 when conversion from ubiquinone declines.',
    dose: '100-200mg daily',
    verdict: 'Reasonable antioxidant support, particularly for 40+. ✅ (modest)',
  },

  lycopene: {
    what: 'Carotenoid from tomatoes and other red/pink produce. Potent antioxidant.',
    skin: 'Evidence for UV protection and reduced UV-induced skin damage when consumed regularly. Cooking tomatoes (tomato paste, cooked sauce) significantly increases lycopene bioavailability vs raw tomatoes.',
    verdict: 'Best from food (cooked tomatoes). Supplementation has supporting evidence. ✅ (food first)',
  },

  hyaluronic_acid_oral: {
    what: 'Hyaluronic acid in oral form — marketed as a skin hydration supplement.',
    controversy: 'Can oral HA actually benefit skin? The molecule is very large — standard assumption was that it would be digested and not reach skin intact.',
    evidence: 'Newer studies suggest oral HA (particularly low molecular weight) may partially survive digestion and influence skin hydration. Several RCTs show improved skin moisture with 120-240mg/day.',
    verdict: 'Growing evidence base, probably works. Topical HA is established. ✅ (conditional)',
  },
};

// ─── ADAPTOGENS FOR BEAUTY ────────────────────────────────────────────────────

export const ADAPTOGEN_BEAUTY_GUIDE = {
  what_adaptogens_are: 'Adaptogens are a class of herbs and plant compounds that help the body adapt to stress — they work by modulating the hypothalamic-pituitary-adrenal (HPA) axis and stress response. Cortisol reduction is the primary beauty mechanism.',

  cortisol_beauty_connection: 'High chronic cortisol damages collagen, impairs skin barrier repair, drives stress acne, and worsens hair loss (telogen effluvium). Anything that authentically reduces cortisol levels improves skin and hair health.',

  adaptogens: {
    ashwagandha: {
      what: 'Withania somnifera — the most studied adaptogen. Used in Ayurvedic medicine for thousands of years.',
      evidence: 'Strong evidence for reducing cortisol (up to 28% reduction in some RCTs), reducing stress and anxiety, improving sleep quality.',
      beauty: 'Cortisol reduction → improved skin barrier, reduced stress acne, potential hair loss reduction (stress-triggered telogen effluvium). Also some evidence for muscle recovery and testosterone modulation (relevant to PCOS considerations).',
      dose: '300-600mg KSM-66 or Sensoril ashwagandha extract daily.',
      community: 'Deep roots in South Asian/Ayurvedic tradition. Gaining global recognition.',
      caution: 'Thyroid autoimmune conditions — ashwagandha may affect thyroid hormone levels. Pregnancy — avoid. Herb-drug interactions — inform your doctor.',
      verdict: 'Strong evidence for stress reduction. Beauty benefits through cortisol pathway are logical. ✅✅',
    },

    rhodiola: {
      what: 'Rhodiola rosea — Arctic/Scandinavian and Siberian adaptogen. Used in traditional medicine from Russia and Scandinavia.',
      evidence: 'Good evidence for reducing mental fatigue, improving stress resilience, and reducing cortisol.',
      beauty: 'Stress and fatigue reduction → less cortisol → reduced stress acne, improved sleep (sleep is critical for skin repair).',
      dose: '200-400mg standardised extract (3% rosavins, 1% salidroside) daily.',
      verdict: 'Good evidence for stress adaptation. ✅',
    },

    holy_basil_tulsi: {
      what: 'Ocimum tenuiflorum (Tulsi) — sacred plant in Hinduism; used in Ayurvedic medicine.',
      evidence: 'Some evidence for cortisol reduction, blood sugar regulation (relevant to hormonal acne via insulin pathway).',
      dose: 'Fresh tea or 500mg capsule extract',
      community: 'Deeply rooted in South Asian tradition — used as tea, in cooking, in religious practice.',
      verdict: 'Reasonable adaptogen with cultural significance for South Asian community. ✅ (modest)',
    },

    reishi: {
      what: 'Ganoderma lucidum — medicinal mushroom with adaptogenic properties. Traditional in Chinese, Japanese, and Korean medicine.',
      evidence: 'Anti-inflammatory, immune modulating, cortisol-reducing.',
      beauty: 'Anti-inflammatory effects may benefit inflammatory skin conditions. Immune modulation may help alopecia areata (autoimmune).',
      dose: '500-1000mg standardised extract.',
      community: 'Deep TCM (Traditional Chinese Medicine) and Korean/Japanese traditional roots.',
      verdict: 'Interesting profile, decent evidence for anti-inflammation. ✅ (modest)',
    },

    shatavari: {
      what: 'Asparagus racemosus — Ayurvedic adaptogen with oestrogenic activity.',
      beauty: 'May support hormonal balance in women — potentially beneficial for hormonal acne, PCOS-related skin issues, and perimenopausal skin changes.',
      community: 'Central to South Asian women\'s health traditions.',
      caution: 'Oestrogenic activity — avoid if oestrogen-sensitive conditions, on hormonal contraception, or pregnant.',
      verdict: '✅ (for targeted hormonal support in consultation with healthcare provider)',
    },
  },
};

// ─── ETHNIC SUPPLEMENT TRADITIONS ────────────────────────────────────────────

export const SUPPLEMENT_TRADITIONS = {
  south_asian: {
    amla: {
      what: 'Indian gooseberry — one of the richest natural sources of vitamin C (20x more than oranges by weight).',
      beauty: 'Potent antioxidant, supports collagen synthesis, traditional use for hair (amla oil, amla juice). Some evidence for protecting hair from premature greying (contains gallic acid which may slow melanocyte damage).',
      how: 'Amla juice, amla powder in water or smoothie, amla supplements, amla oil for hair.',
    },
    turmeric: {
      curcumin: 'Curcumin — the active anti-inflammatory compound in turmeric. Bioavailability from turmeric powder is only 2-3% without enhancement.',
      bioavailability: 'Piperon (black pepper extract) increases curcumin absorption by 2000%. Look for supplements combining curcumin + piperine, or liposomal/nanoparticle curcumin.',
      beauty: 'Systemic anti-inflammatory — may reduce inflammatory skin conditions, PIH, and oxidative damage.',
    },
    moringa: {
      what: 'Moringa oleifera — "miracle tree," nutrient-dense leaves with high antioxidant content.',
      beauty: 'Rich in vitamins C, A, E; zinc; iron; amino acids. Comprehensive nutritional support.',
    },
  },

  west_african: {
    baobab: {
      what: 'Baobab fruit powder — extremely high in vitamin C (6x more than oranges per 100g), fibre, and antioxidants.',
      beauty: 'Vitamin C for collagen synthesis and PIH management. Antioxidant protection.',
    },
    moringa: 'Also widely used in West African tradition — see South Asian section.',
    shea: 'While typically topical, shea nuts contain essential fatty acids and are consumed in some West African food traditions.',
  },

  east_asian: {
    ginseng: {
      what: 'Panax ginseng (Asian ginseng) — one of the most studied herbal medicines. Adaptogenic.',
      beauty: 'Some evidence for improved skin hydration and elasticity. Ginsenosides are antioxidant and anti-inflammatory.',
      forms: 'Red ginseng (steamed and dried) may be more potent than white ginseng.',
    },
    pearl_powder: {
      what: 'Hydrolysed pearl — used in traditional Chinese medicine and East Asian beauty for centuries.',
      beauty: 'Contains amino acids including glycine and alanine (collagen precursors). Some evidence for antioxidant activity. Traditional use for luminous complexion.',
      modern: 'More popular as a supplement in East Asian beauty routines than Western ones — growing global interest.',
    },
    goji: {
      what: 'Lycium barbarum (wolfberry) — used in TCM for centuries.',
      beauty: 'High in zeaxanthin and beta-carotene (antioxidants), zinc, and polysaccharides. Some evidence for UV protection and antioxidant skin benefits.',
    },
  },

  arab: {
    black_seed: {
      what: 'Nigella sativa (black seed/black cumin) — called "cure for everything except death" in hadith.',
      beauty: 'Thymoquinone (active compound) — anti-inflammatory, antimicrobial. Evidence for acne, seborrheic dermatitis. Taken orally (capsules or seeds) and applied topically (oil).',
    },
    dates: {
      what: 'High in B vitamins, zinc, iron, magnesium, and antioxidants. Traditional staple food with significant nutritional value for skin and hair.',
    },
  },
};

// ─── SUPPLEMENT STACKS ────────────────────────────────────────────────────────

export const SUPPLEMENT_STACKS = {
  hair_loss_stack: {
    core: ['Iron (if deficient — test first)', 'Vitamin D3 + K2', 'Zinc'],
    add_ons: ['Collagen peptides 10g', 'Ashwagandha (if stress-triggered)', 'Rosemary oil (topical — as effective as 2% minoxidil in one study)'],
    note: 'Address deficiencies first — they\'re the most impactful.',
  },

  skin_glow_stack: {
    core: ['Vitamin D3', 'Omega-3 (algae or fish oil, EPA+DHA)', 'Astaxanthin 6mg'],
    add_ons: ['Collagen peptides 10g', 'Vitamin C 500-1000mg', 'CoQ10 ubiquinol 100mg'],
    timeline: '3 months consistent use before assessing.',
  },

  pcos_skin_hair_stack: {
    core: ['Inositol (myo + d-chiro, 40:1 ratio) 4g daily', 'Zinc 30mg', 'Vitamin D3', 'Spearmint tea 2 cups/day'],
    add_ons: ['Ashwagandha', 'NAC 600mg 3x daily'],
    medical: 'Discuss with your doctor — spironolactone and metformin are more evidence-backed than supplements for PCOS.',
  },

  anti_inflammatory_skin_stack: {
    for: 'Eczema, psoriasis, rosacea, inflammatory acne',
    core: ['Omega-3 2-3g EPA+DHA', 'Vitamin D3', 'Probiotics (Lactobacillus rhamnosus GG for eczema — best evidence)'],
    add_ons: ['Curcumin + piperine', 'Reishi mushroom'],
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getHairSupplementGuide() {
  return HAIR_SUPPLEMENTS;
}

export function getSkinSupplementGuide() {
  return SKIN_SUPPLEMENTS;
}

export function getAdaptogenGuide() {
  return ADAPTOGEN_BEAUTY_GUIDE;
}

export function getSupplementTraditions(communityId) {
  return SUPPLEMENT_TRADITIONS[communityId] || null;
}

export function getSupplementStack(goal) {
  return SUPPLEMENT_STACKS[goal] || null;
}

export function getBiotinTruth() {
  return HAIR_SUPPLEMENTS.biotin;
}

export function getEvidenceBasedSupplements() {
  const all = { ...HAIR_SUPPLEMENTS, ...SKIN_SUPPLEMENTS };
  return Object.entries(all)
    .filter(([key, val]) => val.verdict && val.verdict.startsWith('✅✅'))
    .map(([key, val]) => ({ supplement: key, summary: val.verdict, note: val.what }));
}

export const SUPPLEMENT_GUIDE_STATS = {
  hairSupplementsCovered: Object.keys(HAIR_SUPPLEMENTS).length,
  skinSupplementsCovered: Object.keys(SKIN_SUPPLEMENTS).length,
  adaptogensCovered: Object.keys(ADAPTOGEN_BEAUTY_GUIDE.adaptogens).length,
  communityTraditions: Object.keys(SUPPLEMENT_TRADITIONS).length,
  supplementStacks: Object.keys(SUPPLEMENT_STACKS).length,
};
