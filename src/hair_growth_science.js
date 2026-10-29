/**
 * MIRRR Hair Growth Science
 * Hair growth cycle, DHT and androgenetic alopecia,
 * scalp health, growth-promoting ingredients, ethnic hair growth patterns
 */

// ─── HAIR GROWTH CYCLE ────────────────────────────────────────────────────────

export const HAIR_GROWTH_CYCLE = {
  overview: {
    title: 'The Human Hair Growth Cycle',
    phases: 4,
    total_follicles: 'Approximately 100,000 hair follicles on the average human scalp. We are born with all our follicles — we never grow new ones.',
    daily_shedding: '50-100 hairs per day is normal. These are hairs cycling out of anagen phase. Context matters: shedding 100 long strands involves more hair than 100 short strands.',
    cycle_duration: 'Each hair follicle cycles independently — not synchronised. A hair can be in any phase at any time.',
  },
  anagen: {
    phase: 'Anagen (Growth Phase)',
    duration: '2-7 years (average 3-5 years). The longer the anagen phase, the longer the maximum potential hair length.',
    what_happens: 'Hair actively grows. Cells in the follicle root divide rapidly, pushing the hair shaft upward. Approx. 85-90% of scalp hairs are in anagen at any time.',
    ethnic_variation: {
      caucasian: 'Anagen typically 3-5 years.',
      asian: 'Anagen tends to be longer (up to 7 years) — explains why East Asian hair often grows very long naturally.',
      african: 'Anagen phase similar duration but slower growth rate due to helical (coiled) structure of Type 4 hair shaft — growth is technically occurring but hair doesn\'t "appear" to grow as fast because of shrinkage.',
    },
    growth_rate: 'Hair grows approximately 1.25 cm (half an inch) per month on average. Type 4 hair shrinks to 25-75% of its actual length, giving the impression of slow growth.',
  },
  catagen: {
    phase: 'Catagen (Transition Phase)',
    duration: '2-3 weeks',
    what_happens: 'Hair growth stops. The follicle shrinks to about 1/6 its normal size. The root detaches from its blood supply (papilla). Approximately 1-3% of hairs in catagen at any time.',
  },
  telogen: {
    phase: 'Telogen (Resting Phase)',
    duration: '3-4 months',
    what_happens: 'Hair rests. The follicle is dormant. The old hair is "club hair" — held in the follicle loosely but not growing. Approximately 10-15% of hairs in telogen at any time.',
    shedding: 'At the end of telogen, hair sheds when new anagen hair pushes it out, or from mechanical action (brushing, washing).',
  },
  exogen: {
    phase: 'Exogen (Shedding Phase)',
    duration: 'Days to weeks',
    what_happens: 'Active shedding of the telogen hair. Happens independently of the new anagen hair starting.',
  },
  telogen_effluvium: {
    condition: 'Telogen Effluvium (TE)',
    definition: 'A form of diffuse hair shedding caused by a significant physical or emotional stressor that pushes a large proportion of hairs simultaneously from anagen into telogen phase. The mass shedding occurs 3-4 months AFTER the triggering event (the telogen phase delay).',
    triggers: ['Childbirth (postpartum TE affects 40-50% of new mothers)', 'Major surgery', 'Serious illness (including COVID-19)', 'Extreme crash dieting', 'Thyroid dysfunction', 'Iron deficiency anaemia', 'Severe chronic stress', 'Starting or stopping hormonal contraception', 'Rapid significant weight loss'],
    appearance: 'Diffuse shedding from the entire scalp (not patterned). Very alarming — can lose 30-50% of hair density temporarily.',
    prognosis: 'Almost always completely reversible within 6-12 months once the trigger is resolved. Do not do anything aggressive (aggressive treatments, chemical processing) during TE — the hair is already stressed.',
    ethnic_note: 'Postpartum TE is universal across all ethnicities. South Asian women sometimes experience severe TE postpartum on top of traditional postpartum hair oiling practices — must wait until shedding stabilises before heavy oiling.',
  },
};

// ─── DHT AND ANDROGENETIC ALOPECIA ───────────────────────────────────────────

export const ANDROGENETIC_ALOPECIA = {
  dht_science: {
    what_is_dht: 'DHT (Dihydrotestosterone) is a potent androgen hormone derived from testosterone by the enzyme 5-alpha reductase. DHT binds to androgen receptors in genetically susceptible hair follicles, causing them to miniaturise over time.',
    miniaturisation: 'DHT causes follicles to shrink with each hair cycle: each anagen phase produces a thinner, shorter hair until eventually the follicle produces only a vellus (invisible) hair and finally goes dormant.',
    genetic_component: 'Androgenetic alopecia (AGA) is hereditary. The gene is polygenic — inherited from BOTH sides of the family, contrary to the old myth of inheriting only from the maternal side.',
    pattern_in_men: 'Hamilton-Norwood scale. Pattern typically begins at temples and/or crown.',
    pattern_in_women: 'Women do not typically bald in the same pattern as men. Female AGA (female pattern hair loss — FPHL) typically presents as diffuse thinning at the crown with preserved frontal hairline. Ludwig scale I-III.',
  },
  female_hair_loss: {
    prevalence: 'FPHL affects approximately 40% of women by age 50.',
    diagnosis: 'Clinical diagnosis. Blood tests to rule out thyroid disease, iron deficiency, hormonal imbalance. Trichoscopy (scalp magnification).',
    causes: {
      FPHL: 'Female pattern hair loss (androgenetic component). Diffuse crown thinning.',
      alopecia_areata: 'Autoimmune condition. Patchy, sudden hair loss. Smooth bald patches.',
      traction: 'Mechanical damage from tight styles. Hairline recession. PREVENTABLE.',
      scarring: 'Scarring alopecias (CCCA, frontal fibrosing alopecia — more prevalent in Black women). Destroys follicles permanently.',
      hormonal: 'PCOS (androgen excess); thyroid; postpartum; perimenopause.',
    },
    ethnic_note: {
      CCCA: 'Central Centrifugal Cicatricial Alopecia (CCCA) is a scarring alopecia that disproportionately affects Black women (most common form of permanent hair loss in Black American women). Begins at the crown; spreads outward. Causes include chemical processing, heat, and possibly genetic predisposition. Early recognition and cessation of damaging practices essential — scarring is permanent.',
      traction_alopecia: 'Traction alopecia from tight braids, weaves, and extensions is the leading preventable cause of hair loss in Black American, West African, and Caribbean women.',
      frontal_fibrosing: 'Frontal fibrosing alopecia (FFA) appears to be increasing in prevalence across all ethnic groups; may have a sunscreen ingredient link (oxybenzone — still under investigation).',
    },
  },
  treatments: {
    minoxidil: {
      name: 'Minoxidil (Rogaine)',
      mechanism: 'Vasodilator that prolongs anagen phase; increases follicle size. Mechanism not fully understood.',
      forms: 'Topical 2% (for women; also 5% with same efficacy but potentially more systemic side effects); topical 5% (men; increasingly women); oral minoxidil (low dose 0.25-2.5mg for women — emerging as more effective).',
      efficacy: 'Approximately 60% of users see significant improvement. Works only while used — cessation = shedding returns.',
      side_effects: 'Initial "shedding phase" 1-3 months after starting (telogen hairs pushed out by new anagen); facial hypertrichosis (body hair) with higher doses; scalp irritation.',
    },
    finasteride: {
      name: 'Finasteride (Propecia)',
      mechanism: '5-alpha reductase inhibitor — reduces DHT levels at the scalp.',
      forms: 'Oral 1mg (men); topical finasteride (emerging; lower systemic effect). Not for women of childbearing age (causes birth defects).',
      efficacy: '80-90% of men stabilise or improve. Significant efficacy.',
    },
    spironolactone: {
      name: 'Spironolactone',
      mechanism: 'Anti-androgen; blocks DHT receptors. Used off-label for FPHL in women.',
      common_use: 'Widely prescribed by dermatologists for FPHL and hormonal acne in women. Prescription only.',
    },
    dutasteride: {
      name: 'Dutasteride',
      mechanism: 'More potent 5-alpha reductase inhibitor than finasteride. Blocks both Type 1 and Type 2 5-AR (finasteride only blocks Type 2).',
      forms: 'Oral; topical. Not FDA-approved for hair loss but used off-label.',
    },
    PRP: {
      name: 'PRP (Platelet-Rich Plasma)',
      mechanism: 'Patient\'s own blood is centrifuged; platelet-rich plasma injected into scalp. Growth factors in platelets stimulate follicle activity.',
      efficacy: 'Growing evidence. 2-3 sessions initially; maintenance every 6-12 months.',
    },
    hair_transplant: {
      name: 'Hair Transplant (FUE, FUT)',
      FUE: 'Follicular Unit Extraction — individual follicle units extracted and transplanted. Most common modern technique. Minimally scarring.',
      FUT: 'Follicular Unit Transplantation — strip of scalp removed; individual follicles dissected and transplanted. Leaves linear scar at donor site.',
      ethnic_note: 'Hair transplant in Type 3-4 hair: requires a surgeon experienced in ethnic hair. Coily follicles are curved under the scalp — extraction technique must account for this to avoid follicle transection.',
    },
    LLLT: {
      name: 'LLLT (Low-Level Laser Therapy)',
      description: 'Red light stimulates mitochondria in follicle cells; increases cellular energy; prolongs anagen. FDA-cleared devices: Theradome, HairMax LaserBand.',
      efficacy: 'Modest evidence. Better as adjunct than sole therapy.',
    },
  },
};

// ─── SCALP HEALTH FOR GROWTH ──────────────────────────────────────────────────

export const SCALP_HEALTH_GROWTH = {
  scalp_as_soil: {
    concept: 'Think of the scalp as soil for hair growth. Healthy soil (clean, balanced microbiome, good blood circulation, well-moisturised) produces healthy crops (hair). Neglected, inflamed, blocked soil produces poor growth.',
    key_factors: ['Clean: free of sebum build-up, dead skin, and product residue', 'Balanced microbiome', 'Well-oxygenated: good blood circulation', 'Appropriately moisturised (not too dry, not too oily)', 'Low inflammation'],
  },
  scalp_massage: {
    mechanism: 'Stimulates blood flow (vasodilation) to follicles; delivers more nutrients and oxygen to follicle cells. A 2016 study in Japan (Koyama) showed 4 min daily standardised scalp massage increased hair thickness after 24 weeks.',
    how_to: 'Use pads of fingers (not nails). Apply moderate pressure in small circular motions. Move systematically over entire scalp. 5-10 minutes daily. Can be done dry or with scalp serum/oil.',
    tools: 'Scalp massager silicone brush — provides consistent pressure; easier on wrists; distributes product.',
    oil_massage: 'Warm oil scalp massage improves blood circulation AND moisturises scalp. However: oils cannot penetrate the follicle to directly stimulate growth — the mechanism is circulation and relaxation.',
  },
  sebum_and_follicle_blockage: {
    issue: 'Excess sebum combined with dead skin cells can potentially block the follicle opening. This is not definitively proven as a significant hair loss cause in most people, but scalp hygiene matters for scalp health generally.',
    DHT_in_sebum: 'The sebaceous gland is where DHT production occurs in the scalp — DHT-sensitive individuals may benefit from a slightly more clarified scalp (less sebum blocking DHT interaction?).',
    clarifying: 'Monthly use of a clarifying or chelating shampoo removes mineral build-up (hard water) and product residue. Beneficial for growth environment.',
  },
  anti_inflammatory_scalp: {
    inflammation_and_hair: 'Chronic scalp inflammation damages follicles and accelerates hair loss. Seborrheic dermatitis, psoriasis, and eczema on the scalp all cause inflammatory hair shedding.',
    anti_inflammatory_ingredients: ['Zinc pyrithione (anti-fungal, anti-inflammatory)', 'Ketoconazole shampoo (reduces Malassezia yeast, which drives seborrheic dermatitis)', 'Salicylic acid (exfoliates scalp; anti-inflammatory)', 'Tea tree oil (antimicrobial)', 'Azelaic acid', 'Niacinamide scalp serums'],
    ethnic_note: 'Seborrheic dermatitis (dandruff/flaking scalp) is common in African-descended hair because the infrequent washing practiced to preserve moisture allows Malassezia yeast to overgrow. Washing twice weekly minimum, or using antifungal shampoo monthly, helps.',
  },
  scalp_care_routine: {
    steps: [
      'Pre-wash scalp massage (dry or with scalp oil) — 5 min',
      'Shampoo scalp thoroughly (not hair) — at scalp-appropriate frequency',
      'Rinse completely — residue causes build-up',
      'Conditioner on hair (not scalp — adds unnecessary oil to scalp)',
      'Post-wash scalp serum if using (minoxidil, growth serums)',
      'Scalp massage while applying serum',
    ],
  },
};

// ─── GROWTH-PROMOTING INGREDIENTS ────────────────────────────────────────────

export const GROWTH_INGREDIENTS = {
  evidence_based: {
    minoxidil: {
      ingredient: 'Minoxidil',
      evidence: 'Highest evidence. FDA-approved. The gold standard topical for hair loss.',
      note: 'A drug, not a supplement. Prescription required for oral form; OTC topical available.',
    },
    ketoconazole: {
      ingredient: 'Ketoconazole (Nizoral Shampoo)',
      evidence: 'Multiple RCTs show 1-2% ketoconazole shampoo increases hair density. Reduces Malassezia; reduces scalp DHT. Widely recommended as adjunct therapy by dermatologists.',
      use: 'Use 2-3x per week or leave on 3-5 min before rinsing.',
    },
    caffeine: {
      ingredient: 'Caffeine (Topical)',
      evidence: 'In vitro studies show caffeine stimulates hair follicle growth and counteracts some DHT effects. Limited human clinical data, but promising.',
      products: 'Alpecin Caffeine Shampoo; many serums.',
    },
    rosemary_oil: {
      ingredient: 'Rosemary Essential Oil (Rosmarinus officinalis)',
      evidence: 'A 2015 RCT (Panahi) compared 2% minoxidil to rosemary oil — equivalent efficacy at 6 months. Mechanism: improves scalp circulation; inhibits 5-alpha reductase.',
      use: 'Dilute in carrier oil (3-5 drops per tablespoon); massage into scalp; leave in or rinse out. Never apply undiluted essential oil to skin.',
    },
    pumpkin_seed_oil: {
      ingredient: 'Pumpkin Seed Oil',
      evidence: 'A 2014 RCT showed significant hair count increase vs placebo in men with AGA. May inhibit 5-alpha reductase.',
    },
  },
  moderate_evidence: {
    biotin: {
      ingredient: 'Biotin (Vitamin B7)',
      evidence: 'Effective for biotin deficiency (rare). No evidence for hair growth in biotin-sufficient individuals. DANGER: high-dose biotin interferes with thyroid and cardiac lab tests. Tell your doctor.',
    },
    iron: {
      ingredient: 'Iron / Ferritin',
      evidence: 'Strong evidence that iron deficiency (low ferritin) causes hair loss. Correcting iron deficiency resolves the hair loss. Target ferritin >70 for optimal hair growth.',
      ethnic_note: 'Iron deficiency is more common in South Asian and Black communities. Black vegetarians especially at risk. Annual ferritin check recommended for women with hair loss.',
    },
    vitamin_d: {
      ingredient: 'Vitamin D',
      evidence: 'Vitamin D receptors are present in follicle cells. Deficiency is associated with alopecia areata and telogen effluvium. Supplementation (if deficient) may help.',
    },
  },
  traditional_and_emerging: {
    castor_oil: {
      ingredient: 'Castor Oil (Ricinus communis)',
      evidence: 'No clinical evidence for hair growth. Very thick (high viscosity) oil — creates significant protein and product build-up over time.',
      cultural_note: 'Deeply embedded in Black American, Caribbean, and South Asian hair care traditions. The anecdotal following is massive. Mechanism may be improved scalp massage benefit and moisture, rather than growth-specific compounds.',
      use: 'If using: mix with a lighter carrier (jojoba, argan) as it is too thick alone; use sparingly on scalp; clarify monthly.',
    },
    jamaican_black_castor_oil: {
      ingredient: 'Jamaican Black Castor Oil (JBCO)',
      description: 'Roasted castor beans + ash = higher alkaline pH. Popular in Caribbean communities. Same evidence (none specific to growth) as regular castor oil, with alkalinity that could potentially damage hair if applied to strands rather than scalp.',
    },
    onion_juice: {
      ingredient: 'Onion Juice',
      evidence: 'A 2002 small RCT showed onion juice effective for alopecia areata. Active compound may be sulphur (which is present in keratin). Very high compliance challenge due to smell.',
    },
    saw_palmetto: {
      ingredient: 'Saw Palmetto (Serenoa repens)',
      evidence: 'A 2020 meta-analysis found saw palmetto may reduce DHT at the follicle. Some effect in AGA. Available as supplement and topical serum.',
    },
    bhringraj: {
      ingredient: 'Bhringraj (Eclipta alba)',
      description: 'Ayurvedic herb used for centuries in South Asian hair care. Some small studies suggest stimulates follicle growth. Used as hair oil or supplement.',
    },
    amla: {
      ingredient: 'Amla (Indian Gooseberry, Phyllanthus emblica)',
      description: 'Rich in vitamin C (antioxidant); used extensively in Ayurvedic hair care. May inhibit 5-alpha reductase in some studies. Used as amla oil or in hair masks.',
    },
  },
};

// ─── ETHNIC HAIR GROWTH ───────────────────────────────────────────────────────

export const ETHNIC_HAIR_GROWTH = {
  west_african: {
    growth_characteristics: 'Type 4A-4C coily hair. Grows at same rate as other types but high shrinkage factor (up to 75%) makes length difficult to retain.',
    retention_is_key: 'For Type 4 hair, the challenge is not growth but RETENTION — preventing breakage. Every inch grown must be protected to see length gains.',
    traditional_practices: 'Protective styles (braids, twists, cornrows); overnight oil treatments; co-washing; LOC method (liquid, oil, cream) for moisture retention.',
    recommended: 'Consistent protective styling; scalp massage with rosemary or castor oil; deep conditioning weekly; gentle detangling on wet hair only; silk bonnet sleeping.',
  },
  south_asian: {
    growth_characteristics: 'Most commonly Type 2-3 hair with high density and thickness. Often excellent natural growth and length retention.',
    traditional_practices: 'Champi oil massage (coconut, mustard, or amla oil); Ayurvedic herbs (bhringraj, shikakai, neem); DIY hair masks (egg, yoghurt, hibiscus).',
    growth_challenge: 'Hair loss in South Asian women often hormonal (PCOS, postpartum) or from iron deficiency — root cause treatment more important than topical growth stimulants.',
    recommended: 'Weekly oil champi; amla oil; iron levels check; scalp massage; biotin-rich foods (nuts, eggs, lentils).',
  },
  caribbean: {
    growth_characteristics: 'Diverse hair types across the region (Type 2-4 depending on heritage). Afro-Caribbean: Type 3-4 with protective style culture.',
    traditional_practices: 'Coconut oil; castor oil (Jamaican black castor oil tradition); bay rum (Robb) scalp treatment; olive oil treatments.',
    growth_challenge: 'Traction alopecia from tight braids and extensions is a significant concern.',
    recommended: 'Loose protective styles; scalp massage; JBCO applied sparingly to scalp only; monthly clarifying shampoo.',
  },
  arab: {
    growth_characteristics: 'Type 2-3 hair typically; thick and dense in many Arab communities. Often long hair a cultural beauty ideal.',
    traditional_practices: 'Argan oil (Morocco); black seed oil (Nigella sativa); henna treatments; olive oil masks; rosewater rinses.',
    growth_challenge: 'Heat styling damage; colour damage; hard water in many Middle Eastern cities.',
    recommended: 'Argan or black seed oil scalp massage; henna strengthening treatment (every 2-3 months); chelating shampoo monthly for hard water; rosemary oil added to carrier.',
  },
  latina: {
    growth_characteristics: 'Wide range — Type 2-4 depending on ancestry.',
    traditional_practices: 'Olive oil masks; avocado masks; aloe vera scalp treatment; bay leaf rinses; rosemary tea rinse.',
    growth_challenge: 'Chemical colour and heat processing; telogen effluvium postpartum common.',
    recommended: 'Aloe vera scalp gel; rosemary oil massage; weekly moisture mask; minimal heat styling.',
  },
  east_asian: {
    growth_characteristics: 'Type 1-2 hair; typically straight to slightly wavy; longest anagen phase of any ethnicity (explains ability to grow very long hair). Thickest individual strand diameter.',
    traditional_practices: 'Camellia (tsubaki) oil; rice water rinses (claimed to strengthen and grow hair); ginger scalp treatment; ginseng supplements.',
    growth_challenge: 'Bleaching for fashion colour can cause severe damage; not much natural hair loss challenge given thick, straight structure.',
    recommended: 'Rice water rinse (fermented — more concentrated amino acids); ginseng serum; camellia oil; scalp massage.',
  },
  east_african: {
    growth_characteristics: 'Type 4 coily hair; similar growth characteristics to West African Type 4.',
    traditional_practices: 'Shea butter; Ethiopian butter (tesmi — clarified/spiced butter); frankincense oil; aloe vera.',
    recommended: 'Shea butter scalp treatment; frankincense oil; protective styles; retention focus.',
  },
  south_african: {
    growth_characteristics: 'Diverse — Type 2-4 across communities.',
    traditional_practices: 'Rooibos rinses; marula oil; baobab oil scalp treatment.',
    recommended: 'Marula oil (lightweight; excellent for scalp); rooibos rinse (antioxidant); clarifying shampoo; protective styles.',
  },
  black_american: {
    growth_characteristics: 'Type 3-4 coily hair. Shrinkage-to-retention same challenge as Type 4 in general.',
    traditional_practices: 'Castor oil (JBCO); Vaseline scalp protection; hot oil treatments; grease (petroleum-based scalp products); natural hair movement focus.',
    growth_challenge: 'CCCA scarring alopecia; traction alopecia; relaxer legacy. Both the greatest hair growth challenges.',
    recommended: 'Scalp care first; ketoconazole shampoo 2x/week for scalp health; rosemary oil in carrier; dermatologist for any scalp itching/scaling at crown (rule out CCCA); retention practices.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getHairGrowthCycle() { return HAIR_GROWTH_CYCLE; }
export function getAndrogeneticAlopeciaGuide() { return ANDROGENETIC_ALOPECIA; }
export function getScalpHealthGuide() { return SCALP_HEALTH_GROWTH; }
export function getGrowthIngredient(ingredient) {
  const allIngredients = { ...GROWTH_INGREDIENTS.evidence_based, ...GROWTH_INGREDIENTS.moderate_evidence, ...GROWTH_INGREDIENTS.traditional_and_emerging };
  return allIngredients[ingredient?.toLowerCase()] || GROWTH_INGREDIENTS;
}
export function getEthnicGrowthGuide(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_HAIR_GROWTH[key] || Object.values(ETHNIC_HAIR_GROWTH);
}

export const HAIR_GROWTH_STATS = {
  cyclePhases: 4,
  growthIngredientCategories: 3,
  ethnicCommunities: 9,
  treatmentOptions: Object.keys(ANDROGENETIC_ALOPECIA.treatments).length,
};
