/**
 * MIRRR — Scalp Care Science & Treatment Guide
 * Comprehensive scalp health from sebum regulation to dandruff,
 * seborrhoeic dermatitis, hair loss, and ethnic scalp traditions.
 */

export const SCALP_BIOLOGY_OVERVIEW = {
  title: 'Scalp Biology & Physiology',
  anatomy: {
    layers: [
      { name: 'Epidermis', description: 'Outermost layer; ~5 cell layers thick on scalp; faster cell turnover than body skin (~28 days cycle)', function: 'Protection barrier; produces keratinocytes that become stratum corneum flakes' },
      { name: 'Dermis', description: 'Contains hair follicles, sebaceous glands, nerve endings, blood vessels, sweat glands', function: 'Houses the hair-producing infrastructure and nutrient supply' },
      { name: 'Hypodermis', description: 'Subcutaneous fat layer; thicker on scalp than most body skin', function: 'Cushioning, insulation, vessel supply to follicles' }
    ],
    folliclesPerScalp: { min: 80000, max: 120000, average: 100000, note: 'Highest follicle density is at crown; temples typically have lower density' },
    follicleTypes: {
      terminal: 'Large follicles producing thick pigmented hair; scalp follicles are terminal type',
      vellus: 'Tiny follicles producing fine, light, short hair; vellus hair covers most of the body',
      conversion: 'In androgenetic alopecia, terminal follicles miniaturise into vellus-like follicles under DHT influence'
    }
  },
  sebaceousGlands: {
    description: 'Scalp has highest sebaceous gland density of any body area (~400–900 glands per cm² on scalp vs ~100 elsewhere)',
    sebumProduction: { daily: '1–2g across entire scalp', perFollicle: 'Variable; highest on vertex and crown', factors: ['androgens (testosterone/DHT increase production)', 'diet (high GI foods increase sebum)', 'stress hormones', 'seasonal variation (higher in summer)'] },
    sebumComposition: {
      triglycerides: '57.5%',
      wax_esters: '26%',
      squalene: '12%',
      cholesterol: '4.5%',
      function: 'Maintains barrier, lubricates hair shaft, carries antimicrobial peptides, creates slightly acidic pH 4.5–5.5'
    }
  },
  scalpMicrobiome: {
    keyOrganisms: [
      { organism: 'Malassezia globosa', role: 'Metabolises triglycerides, releasing oleic acid; primary driver of dandruff in susceptible individuals', abundance: 'Dominant on sebaceous scalp areas' },
      { organism: 'Malassezia restricta', role: 'Second most abundant Malassezia species; also dandruff-associated', abundance: 'High on sebaceous areas' },
      { organism: 'Staphylococcus epidermidis', role: 'Commensal; produces antimicrobial substances against S. aureus; generally beneficial', abundance: 'Significant on healthy scalp' },
      { organism: 'Cutibacterium acnes (Propionibacterium)', role: 'Can contribute to folliculitis if overgrows; generally managed by scalp immune response', abundance: 'Moderate' }
    ],
    healthyMicrobiome: 'A diverse scalp microbiome with balanced Malassezia prevents conditions. Disruption (harsh shampoos, antibiotics) alters balance and can trigger dandruff, seborrhoeic dermatitis, or folliculitis.'
  },
  scalpSkinTypes: {
    oily: { description: 'Overactive sebaceous glands; hair appears greasy within 24 hours of washing', causes: ['genetics', 'androgen sensitivity', 'hormonal fluctuations', 'hot/humid climate', 'overwashing triggering rebound oil production'], management: 'Clarifying shampoo 1–3x weekly; scalp balancing ingredients (zinc pyrithione, niacinamide); avoid heavy leave-ins on scalp' },
    dry: { description: 'Underactive glands or compromised barrier; tight, itchy, flaky scalp; hair appears dull', causes: ['genetics', 'overwashing', 'harsh sulfate shampoos', 'hard water', 'cold dry climate', 'hypothyroidism', 'aging'], management: 'Moisturising shampoo, scalp oils (jojoba mimics sebum), sulfate-free washing, scalp masks with ceramides' },
    normal: { description: 'Balanced; hair stays fresh 2–3 days; no visible scaling or excessive oiliness', maintenance: 'Continue current routine; gentle balanced shampoo; wash every 2–3 days' },
    sensitive: { description: 'Reactive, prone to redness, burning with many products; may overlap with seborrhoeic dermatitis', triggers: 'Fragrance, SLS, preservatives, heat, stress', management: 'Fragrance-free, minimal ingredient list products; patch test everything on inner arm before scalp' }
  }
};

export const DANDRUFF_GUIDE = {
  title: 'Dandruff & Seborrhoeic Dermatitis Guide',
  dandruff_vs_sebDerm: {
    dandruff: {
      medical_name: 'Pityriasis capitis simplex',
      appearance: 'White or off-white dry flakes; not overtly red; mild itch or no itch',
      mechanism: 'Malassezia globosa metabolises triglycerides → oleic acid released → irritates susceptible scalp epidermis → accelerated cell turnover (7 vs 28 days) → visible flaking',
      prevalence: '50% of post-pubertal population globally; peaks in 20s-30s, declines with age as sebum production drops',
      triggers: ['stress', 'hormonal changes', 'seasonal (worse winter/autumn)', 'infrequent washing allowing Malassezia overgrowth', 'product buildup', 'dietary factors']
    },
    seborrhoeicDermatitis: {
      medical_name: 'Seborrhoeic dermatitis (SD)',
      appearance: 'Greasy yellow-white or white scales on inflamed red skin; can extend to eyebrows, nasolabial folds, ears, chest; itch usually present',
      mechanism: 'Likely immune dysregulation + Malassezia colonisation + sebum production; more severe inflammatory response than simple dandruff',
      prevalence: '1–5% of general population; 34–83% of HIV+ individuals; common in Parkinson\'s disease',
      risk_factors: ['immunosuppression', 'neurological conditions (Parkinson\'s)', 'male sex (androgens drive sebum)', 'cold dry weather', 'stress', 'alcohol-containing skincare'],
      isItContagious: false
    }
  },
  antidandruffIngredients: {
    zincPyrithione: {
      mechanism: 'Inhibits mitochondrial electron transport in Malassezia; antifungal + antibacterial',
      concentration: '1–2% in OTC shampoos',
      efficacy: 'Reduces Malassezia counts by ~98% in controlled studies',
      products_types: 'Head & Shoulders (original); many own-brand antidandruff shampoos',
      frequency: '3x weekly minimum for treatment; then as needed for maintenance'
    },
    ketoconazole: {
      mechanism: 'Azole antifungal; blocks ergosterol synthesis in Malassezia cell membrane',
      concentration: '1% OTC (Nizoral); 2% prescription',
      efficacy: 'Clinical trial evidence: superior to zinc pyrithione for severe dandruff/SD; 2% reduces SD symptoms in >80% of patients',
      frequency: '2x weekly for 4 weeks; then once weekly maintenance'
    },
    seleniumSulfide: {
      mechanism: 'Antifungal + antiseborrhoeic; reduces sebum production and Malassezia',
      concentration: '1% OTC; 2.5% prescription',
      note: 'Can cause discolouration in chemically treated or very light hair; rinse thoroughly'
    },
    ciclopirox: {
      mechanism: 'Broad-spectrum antifungal/antimicrobial; disrupts cellular metal ion uptake',
      concentration: '1.5% shampoo (prescription in many countries)',
      efficacy: 'Comparable to ketoconazole; useful when other antifungals fail'
    },
    coalTar: {
      mechanism: 'Keratolytic (removes scale) + slows epidermal cell turnover + mild antifungal',
      concentration: '0.5–5% OTC shampoos',
      note: 'Effective especially for psoriatic flaking; strong smell; may darken light hair; avoid in pregnancy',
      safetyNote: 'Cosmetic-grade coal tar: regulatory agencies consider OTC concentrations safe. Different from industrial coal tar.'
    },
    salicylicAcid: {
      mechanism: 'Keratolytic; breaks down bonds between dead skin cells; removes scale',
      concentration: '2–3% in shampoos',
      benefit: 'Excellent for removing thick scale (psoriasis, severe SD) before other actives can penetrate; often used with antifungals'
    },
    piroctoneOlamine: {
      mechanism: 'Broad-spectrum antifungal; inhibits Malassezia growth',
      concentration: '0.75–1% in shampoos',
      note: 'European alternative to zinc pyrithione; very common in European antidandruff formulations; gentler, no discolouration risk'
    }
  },
  scalpPsoriasis: {
    description: 'Distinct from dandruff/SD; autoimmune condition causing rapid cell proliferation; thicker, silver-white scale; well-defined plaques; itch or soreness',
    diagnosis: 'Dermatologist required for definitive diagnosis; may have psoriasis elsewhere on body',
    treatments: ['Coal tar shampoos (OTC start)', 'Salicylic acid to remove scale', 'Topical corticosteroids (prescription)', 'Calcipotriol (vitamin D analogue, prescription)', 'Biologics for severe cases'],
    note: 'Scalp psoriasis is a medical condition — dermatologist referral recommended before starting treatment'
  }
};

export const HAIR_LOSS_SCALP_GUIDE = {
  title: 'Scalp Conditions Contributing to Hair Loss',
  androgenetic_alopecia: {
    commonName: 'Male pattern / female pattern hair loss',
    mechanism: 'DHT (dihydrotestosterone, converted from testosterone by 5-alpha reductase) binds to follicle androgen receptors → follicle miniaturisation → shorter anagen cycles → vellus-like hairs → eventual loss',
    genetics: 'Polygenic; maternal inheritance myth partially true but paternal genes also contribute; estimated 80% heritability',
    prevalence: { male: '50% of men by age 50', female: '40% of women by age 70' },
    femalePattern: 'Typically diffuse thinning over crown; hairline usually preserved (unlike male pattern); hormonal link especially at menopause',
    treatments: {
      minoxidil: { mechanism: 'Potassium channel opener; extends anagen phase and increases follicle size; increases blood flow', concentration: { male: '5% foam or solution', female: '2–5%' }, timeToEffect: '3–6 months minimum; peak 12 months', shedding: 'Initial paradoxical shedding in first 4–8 weeks as follicles reset; expected and not a sign of failure', continuation: 'Must continue indefinitely; hair loss returns within 4–6 months of stopping' },
      finasteride: { mechanism: '5-alpha reductase inhibitor; reduces DHT production by ~70%', form: 'Oral 1mg daily (prescription)', efficacy: 'Halts progression in 83%; regrowth in 66% after 2 years', sideEffects: 'Sexual side effects reported (erectile dysfunction, reduced libido) in 2–4%; usually resolve on discontinuing; post-finasteride syndrome debated', femaleUse: 'Not approved for female pattern hair loss in most countries; may be used off-label post-menopause' },
      dutasteride: { mechanism: 'Inhibits both 5AR type I and II vs finasteride\'s type II only; more complete DHT reduction', efficacy: 'More effective than finasteride in some studies', approvalStatus: 'Approved for hair loss in South Korea and Japan; off-label use in many other countries' }
    }
  },
  telogen_effluvium: {
    description: 'Diffuse hair shedding 2–4 months after trigger event; all hair follicles shift simultaneously to telogen (resting) phase',
    triggers: ['major illness or surgery', 'rapid significant weight loss', 'crash dieting or protein deficiency', 'childbirth (postpartum telogen effluvium — very common)', 'thyroid disease', 'iron deficiency (ferritin below 30–50 ng/mL)', 'severe emotional stress', 'certain medications (beta-blockers, ACE inhibitors, some hormonal contraceptives)'],
    duration: 'Acute: 3–6 months; hair typically regrows fully; chronic: persists >6 months; investigate underlying cause',
    diagnosis: 'Pull test (gentle pull of ~60 hairs; >6 telogen hairs = positive); ferritin, thyroid, full blood count recommended',
    treatment: 'Address underlying cause; nutritional optimisation (ferritin, vitamin D, zinc); minoxidil can help stimulate regrowth; patience is main intervention'
  },
  traction_alopecia: {
    description: 'Hair loss from repeated mechanical tension on follicles; most common along frontal hairline and temples; a leading cause of hair loss in women of African heritage who wear tight protective styles',
    ethnicRisk: 'Particularly prevalent in Black women (braids, weaves, relaxed hair pulled tight), South Asian women (tight buns, ponytails), and East Asian women (tight ponytails, geisha-style updos)',
    stages: {
      early: 'Hairline recession; small folliculitis bumps; reversible if tension stopped',
      established: 'Significant recession; may become permanent if tension continued',
      scarring: 'Advanced: follicle destruction complete; hair loss permanent; requires consultation'
    },
    prevention: ['Avoid very tight hairstyles regularly', 'Vary tension placement — don\'t always braid in same direction', 'Take breaks between tension styles (every 6–8 weeks minimum)', 'Never sleep in tight styles', 'Use tension-reducing techniques: flexi-rods, twist-outs, low-manipulation styles', 'Treat any scalp inflammation promptly']
  },
  centralCentrifugalCicatricialAlopecia: {
    description: 'CCCA — scarring alopecia beginning at crown and spreading outward; predominantly affects Black women; leading cause of hair loss in this group',
    prevalence: 'Up to 5.6% of Black women in US; significant underdiagnosis',
    cause: 'Exact cause debated; chemical relaxers, heat damage, tight styles, and genetic predisposition all implicated; PADI3 gene mutation found in familial CCCA',
    signs: ['Hair loss starting at crown, expanding centrifugally', 'Itching, burning, or tenderness at active margins', 'Perifollicular scaling', 'Loss of follicle ostia (openings visible) in affected areas'],
    urgency: 'CRITICAL — scarring alopecia; early diagnosis and treatment can arrest progression; delay causes permanent loss. Dermatologist referral needed immediately.',
    treatments: 'Topical or intralesional steroids; antibiotics (doxycycline) for anti-inflammatory effect; hydroxychloroquine; lifestyle modifications; minoxidil for existing hair preservation'
  },
  alopeciaAreata: {
    description: 'Autoimmune; immune cells attack hair follicles; smooth, circular patches of hair loss; beard, eyebrow, eyelash involvement possible',
    prevalence: '2% lifetime risk in general population; equal across sex and race',
    range: { patchy: 'One or few patches; often spontaneous regrowth', totalis: 'Complete scalp hair loss', universalis: 'Complete body hair loss', ophiasis: 'Band of loss around periphery — poorer prognosis' },
    treatments: ['Intralesional corticosteroid injections (first-line for patchy)', 'Topical minoxidil (adjunct)', 'JAK inhibitors (ruxolitinib, baricitinib) — FDA approved 2022 for severe AA; significant efficacy', 'Systemic immunosuppressants for severe cases'],
    community: 'Strong alopecia areata community provides support; wigs, head coverings, and scalp micropigmentation are options'
  }
};

export const SCALP_TREATMENTS_GUIDE = {
  title: 'Scalp Treatment Techniques & Products',
  scalp_massage: {
    technique: 'Use fingertips (not nails); circular kneading motions on scalp; 4–5 minutes 3–4x weekly',
    benefits: ['Increases blood flow to follicles (improves nutrient delivery)', 'Reduces cortisol/stress (proven in studies)', 'Promotes hair growth — 2016 study: 4 minutes/day scalp massage resulted in statistically significant increase in hair thickness after 24 weeks', 'Distributes sebum from roots', 'Provides relaxation'],
    tools: ['Silicone scalp massager: effective; easy to use in shower', 'Wooden bristle brush: gentle on wet hair, good for distributing natural oils'],
    timing: 'On dry scalp before washing; or in shower with conditioner or scalp treatment'
  },
  scalpMasks: {
    oilyScalp: {
      ingredients: ['Kaolin clay: absorbs excess sebum without drying', 'Apple cider vinegar (diluted 1:4 with water): rebalances pH; anti-Malassezia', 'Niacinamide: sebum regulation', 'Zinc PCA: reduces sebaceous gland activity'],
      frequency: '1x weekly maximum; do not overuse or you trigger rebound oiliness'
    },
    dryScalp: {
      ingredients: ['Avocado oil or jojoba: penetrating moisturiser', 'Glycerin: humectant; attracts water to scalp', 'Aloe vera gel: hydration + anti-inflammatory', 'Ceramides: barrier repair'],
      frequency: '1–2x weekly; especially effective pre-shampoo for 20–30 minutes before washing out'
    },
    growthFocused: {
      ingredients: ['Rosemary oil: 1–2% concentration; multiple RCTs show comparable efficacy to minoxidil 2% for hair loss; 5-alpha reductase inhibitory effect', 'Peppermint oil: vasodilator; increases blood flow; 2014 study showed 92% hair count increase at 3% concentration in animal model', 'Biotin (topical): limited evidence for topical vs oral; hair texture benefits'],
      frequency: '2–3x weekly; leave on 30–60 minutes'
    }
  },
  scalpExfoliation: {
    physicalExfoliants: ['Scalp scrubs with fine sugar/salt particles: once weekly maximum', 'Soft scalp brush used in circular motions: can use more regularly', 'Caution: too vigorous = micro-tears; too frequent = disrupts barrier'],
    chemicalExfoliants: {
      salicylicAcid: 'Most appropriate for scalp; oil-soluble so penetrates sebaceous follicles; removes dead skin buildup; 1–2% solutions',
      AHAs: 'Glycolic or lactic acid toners applied to scalp; less common but effective for flaky scalp; rinse after 5–10 minutes',
      frequency: 'Once weekly maximum; skip if scalp is broken, very irritated, or very dry'
    }
  },
  oilsForScalp: {
    preWashOils: {
      purpose: 'Pre-poo treatment: protect hair shaft from hygral fatigue (swelling damage from water); fill gaps in cuticle before water exposure',
      bestOils: ['Coconut oil: highest penetrating ability; reduces protein loss by 39% in one study; particularly relevant for low porosity hair', 'Olive oil: good penetration; reduces dryness', 'Argan oil: penetrating; adds shine; antioxidant'],
      howTo: 'Apply to dry hair 30 minutes to overnight before washing; focus on mid-lengths and ends; scalp application optional'
    },
    scalpOils: {
      purpose: 'Dry scalp nourishment; barrier support; some anti-inflammatory benefits',
      bestOils: ['Jojoba: closest structure to human sebum; balances oily and dry scalp types', 'Rosemary: active hair growth evidence', 'Tea tree: antimicrobial; anti-dandruff; dilute to 2-3% in carrier', 'Neem: powerful anti-inflammatory and antimicrobial; very strong smell — mix with other oils'],
      howTo: 'Apply directly to scalp in sections; massage gently; do not over-apply (prevents roots getting oily immediately after wash)'
    },
    sealingOils: {
      purpose: 'Seal moisture into hair strand after washing and conditioning; most important for high porosity and natural textured hair',
      bestOils: ['Castor oil: thicker; excellent for sealing and adding weight (some evidence for hair growth when applied regularly)', 'Shea butter (technically butter, not oil): excellent sealant for coily hair; can be heavy on fine hair', 'Avocado oil: rich sealant; good for thick coarse hair'],
      howTo: 'Apply as last step of wash day routine; small amount on slightly damp hair; focus on ends'
    }
  }
};

export const ETHNIC_SCALP_CARE = {
  'west-african': {
    communityName: 'West African',
    scalpConcerns: ['Dry scalp common due to high porosity natural hair', 'CCCA awareness critical — prevalent in women of West African heritage', 'Traction alopecia from braided and protective styles', 'Seborrhoeic dermatitis less recognised but occurs', 'Scalp oiling is deep cultural tradition'],
    culturalPractices: ['Palm kernel oil application to scalp (traditional across West Africa)', 'Shea butter (karité) from West African karite tree — a regional ingredient', 'Scalp oiling as weekly or more frequent ritual — integral to hair care culture', 'Protective styles (braids, twists, dreads) require scalp attention at parts'],
    scalp_tips: ['Tea tree oil 2% in water spray for protective style scalp hygiene between washes', 'Anti-dandruff shampoo focused application at scalp when hair is in braids (squeeze shampoo to scalp, rinse through)', 'Keep braids/weave styles for maximum 6–8 weeks to prevent moisture buildup and traction damage', 'Pre-braiding scalp treatment with tea tree, rosemary, and jojoba oil to address inflammation risk']
  },
  'south-asian': {
    communityName: 'South Asian',
    scalpConcerns: ['Seborrhoeic dermatitis and dandruff at higher rates — possibly linked to dietary patterns and stress factors', 'PCOS-related hair loss common in South Asian women', 'Iron-deficiency-related telogen effluvium', 'Scalp buildup from heavy traditional oils requiring special clarifying care'],
    culturalPractices: ['Champi (champi/champissage) — traditional Ayurvedic scalp massage with warm oil; the origin of the word "shampoo"', 'Coconut oil application — South Indian tradition; brahmi oil (Bacopa monnieri) for hair growth', 'Amla (Indian gooseberry) oil — traditional tonic for scalp; high vitamin C; used for centuries', 'Neem oil treatments for scalp infections and dandruff', 'Bhringraj oil (Eclipta prostrata) — Ayurvedic herb with hair growth evidence'],
    scalp_tips: ['Warm oil massage weekly: coconut or sesame as base + amla for health', 'Scalp clarifying shampoo monthly to remove heavy oil buildup before residue causes folliculitis', 'Ketoconazole shampoo if dandruff is persistent (South Asian populations have high seborrhoeic dermatitis rates)', 'Ferritin testing annually especially for vegetarian women — sub-optimal ferritin is significant hair loss cause']
  },
  caribbean: {
    communityName: 'Caribbean',
    scalpConcerns: ['Similar to Black American heritage (traction alopecia, CCCA)', 'High humidity climate in Caribbean: scalp sweat and hygiene between washes', 'Chemical relaxer use — alkaline damage to scalp over time', 'Folklore remedies may interact poorly with scalp health'],
    culturalPractices: ['Castor oil — Black Jamaican castor oil (roasted bean process creates distinctive ash-containing oil) is a Caribbean beauty staple; believed to stimulate hair growth', 'Aloe vera straight from the plant for scalp soothing and conditioning', 'Coconut oil across the Caribbean as foundational hair care'],
    scalp_tips: ['JBCO (Jamaican Black Castor Oil) scalp application 2–3x weekly; massage in and leave overnight', 'Dilute tea tree oil spray (2%) for scalp hygiene in protective styles', 'Weekly wash for oily scalps in hot climates; bi-weekly for dry or low-porosity hair']
  },
  arab: {
    communityName: 'Arab',
    scalpConcerns: ['Seborrhoeic dermatitis — increased rates in some studies for populations from Middle East/North Africa', 'Hard water scale on scalp in regions with very hard water', 'PCOS-related hair loss elevated in Arab women (higher PCOS prevalence)', 'Dry scalp from hot, arid climates and dry indoor heat'],
    culturalPractices: ['Argan oil (Morocco) — "liquid gold"; high oleic acid and vitamin E; scalp nourishment and shine', 'Black seed oil (Nigella sativa, habbatus sauda) — sacred in Islamic tradition ("remedy for everything except death"); antifungal, anti-inflammatory properties on scalp', 'Olive oil (Levant region) — centuries of scalp and hair conditioning use', 'Henna scalp treatment — used in North Africa and Middle East; anti-dandruff, strengthening, cooling properties'],
    scalp_tips: ['Black seed oil (diluted 20% in a carrier) for seborrhoeic dermatitis scalp — growing evidence base', 'Hard water filter on shower if possible; chelating shampoo monthly to remove mineral buildup', 'Argan oil scalp massage before washing — protects from drying shampoo while conditioning scalp']
  },
  latina: {
    communityName: 'Latina',
    scalpConcerns: ['Telogen effluvium from hormonal fluctuations (PCOS elevated in Latina population)', 'Traction alopecia from tight sleek styles (buns, ponytails common in professional settings)', 'Chemical relaxer or keratin treatment scalp damage', 'Seborrhoeic dermatitis'],
    culturalPractices: ['Aguacate (avocado) hair mask — traditional in Mexico and Central America; excellent scalp and hair moisturiser', 'Rosemary (romero) tea rinse — long tradition in Mexico as hair tonic; modern science now confirms efficacy', 'Egg yolk scalp mask — protein and biotin from egg yolk applied to scalp before washing', 'Aloe vera (sábila) from the plant applied to scalp'],
    scalp_tips: ['Rosemary rinse: steep fresh rosemary in boiling water 30 minutes, cool completely, pour over scalp as final rinse after shampooing', 'Egg yolk + olive oil mask applied to scalp 30 minutes before washing — protein nourishment', 'Silk bonnet or satin pillowcase to protect scalp from friction during sleep (important especially with chemical treatments)']
  },
  'east-asian': {
    communityName: 'East Asian',
    scalpConcerns: ['Oily scalp common in Asian populations — high sebaceous gland activity noted in some studies', 'Seborrhoeic dermatitis frequent concern', 'Androgenetic hair loss — genetics play significant role in Korean/Japanese populations', 'Buildup from silicone-heavy Asian hair care products requires clarifying'],
    culturalPractices: ['Camellia oil (tsubaki in Japanese) — Japanese hair and scalp tradition; extremely high oleic acid content; fine oil that doesn\'t weigh down hair', 'Scalp scrubbing brushes — prominent in Korean and Japanese hair care; use during shampooing for exfoliation', 'Korean 모발 (hair care) routines with scalp essence serums — concentrated active formulas applied directly to scalp', 'Ginger scalp treatment in TCM — believed to stimulate circulation and hair growth; some modern evidence for gingerol compounds'],
    scalp_tips: ['Scalp shampoo brush during every wash for East Asian scalp health and thorough cleansing of oily scalp', 'Scalp exfoliating toner with salicylicacid applied weekly between washes', 'Camellia oil 5 minutes pre-wash scalp massage to nourish and protect', 'Anti-dandruff shampoo rotation: 4 weeks active ingredient A, then switch to B to prevent tolerance']
  },
  'east-african': {
    communityName: 'East African',
    scalpConcerns: ['Similar to West African heritage for natural hair scalp care', 'CCCA awareness', 'Frankincense (boswellia) has been used topically for centuries in Ethiopia and Somalia; anti-inflammatory application'],
    culturalPractices: ['Teff oil and teff-based hair treatments — Ethiopian traditional use', 'Frankincense (olibanum) oil diluted for scalp application — anti-inflammatory', 'Moringa oil (shingo oil in East Africa) — lightweight, high oleic content; hair growth applications', 'Tej (Ethiopian honey wine) traditionally applied to hair as conditioner — honey is humectant'],
    scalp_tips: ['Moringa oil as lightweight scalp treatment that won\'t feel heavy on natural hair', 'Honey 1 tbsp dissolved in warm water as scalp hydration treatment', 'Tea tree 2% spray for scalp hygiene between washes in protective styles']
  },
  'south-african': {
    communityName: 'South African',
    scalpConcerns: ['As Black African heritage: CCCA, traction alopecia awareness', 'Seborrhoeic dermatitis', 'UV damage to scalp (high UV index in South African climate — scalp is very exposed)'],
    culturalPractices: ['Marula oil from the marula tree (South Africa and sub-Saharan Africa) — high oleic acid, antioxidant; traditional skin and hair use in San and Zulu communities', 'Rooibos tea scalp rinse — South African tradition; antioxidant and anti-inflammatory properties', 'Baobab oil — moisturising; good for dry scalp; common in Southern Africa'],
    scalp_tips: ['Marula oil pre-wash scalp treatment: very light, fast-absorbing', 'Rooibos tea scalp rinse (cooled): brew 2 bags, cool, pour over scalp after washing, leave 5 minutes, rinse or leave-in', 'SPF scalp spray or hair parting protector for sun-exposed scalps in high UV regions']
  },
  'black-american': {
    communityName: 'Black American',
    scalpConcerns: ['CCCA — leading cause of hair loss in Black women; critically important awareness', 'Traction alopecia from braids/weaves/protective styles and relaxed styles', 'Chemical relaxer scalp damage — alkaline pH damages both scalp barrier and hair shaft', 'Androgenetic hair loss, often presenting differently than in white populations (more diffuse on crown)', 'Dry scalp with natural hair types'],
    culturalPractices: ['Crown + glory of natural hair movement — scalp health is central to the natural hair journey', 'Scalp oiling as weekly cultural ritual — African hair care tradition maintained in diaspora', 'Jamaican Black Castor Oil popularity in Black American hair care community', 'Protective styling tradition — understanding scalp needs IN protective styles', '"Wash day" as ritual — thorough scalp and hair care once weekly or bi-weekly'],
    scalp_tips: ['CCCA screening: annual scalp check especially for Black women over 30; early detection prevents permanent loss', 'Maximum 6–8 weeks for protective styles; 2–4 week braiding breaks between installs', 'Clarifying shampoo monthly to prevent product buildup from heavy moisturisers required for natural 4C hair', 'Scalp massage with JBCO + rosemary oil blend (20% castor, 80% light carrier, 10 drops rosemary per 100ml) for hair loss prevention and scalp health', 'Apple cider vinegar rinse (1 tbsp in 1 cup water) after shampoo restores scalp pH after alkaline cleansers']
  }
};

export function getScalpBiologyOverview() {
  return SCALP_BIOLOGY_OVERVIEW;
}

export function getDandruffGuide(condition) {
  if (!condition) return DANDRUFF_GUIDE;
  const conditionMap = {
    dandruff: DANDRUFF_GUIDE.dandruff_vs_sebDerm.dandruff,
    seborrhoeic_dermatitis: DANDRUFF_GUIDE.dandruff_vs_sebDerm.seborrhoeicDermatitis,
    sebderm: DANDRUFF_GUIDE.dandruff_vs_sebDerm.seborrhoeicDermatitis,
    ingredients: DANDRUFF_GUIDE.antidandruffIngredients,
    psoriasis: DANDRUFF_GUIDE.scalpPsoriasis
  };
  return conditionMap[condition.toLowerCase()] || DANDRUFF_GUIDE;
}

export function getHairLossScalpGuide(condition) {
  if (!condition) return HAIR_LOSS_SCALP_GUIDE;
  const conditionMap = {
    androgenetic: HAIR_LOSS_SCALP_GUIDE.androgenetic_alopecia,
    aga: HAIR_LOSS_SCALP_GUIDE.androgenetic_alopecia,
    pattern: HAIR_LOSS_SCALP_GUIDE.androgenetic_alopecia,
    telogen: HAIR_LOSS_SCALP_GUIDE.telogen_effluvium,
    te: HAIR_LOSS_SCALP_GUIDE.telogen_effluvium,
    shedding: HAIR_LOSS_SCALP_GUIDE.telogen_effluvium,
    traction: HAIR_LOSS_SCALP_GUIDE.traction_alopecia,
    ccca: HAIR_LOSS_SCALP_GUIDE.centralCentrifugalCicatricialAlopecia,
    central: HAIR_LOSS_SCALP_GUIDE.centralCentrifugalCicatricialAlopecia,
    alopecia_areata: HAIR_LOSS_SCALP_GUIDE.alopeciaAreata,
    areata: HAIR_LOSS_SCALP_GUIDE.alopeciaAreata,
    patches: HAIR_LOSS_SCALP_GUIDE.alopeciaAreata
  };
  return conditionMap[condition.toLowerCase()] || HAIR_LOSS_SCALP_GUIDE;
}

export function getScalpTreatments(type) {
  if (!type) return SCALP_TREATMENTS_GUIDE;
  const map = {
    massage: SCALP_TREATMENTS_GUIDE.scalp_massage,
    masks: SCALP_TREATMENTS_GUIDE.scalpMasks,
    exfoliation: SCALP_TREATMENTS_GUIDE.scalpExfoliation,
    exfoliate: SCALP_TREATMENTS_GUIDE.scalpExfoliation,
    oils: SCALP_TREATMENTS_GUIDE.oilsForScalp
  };
  return map[type.toLowerCase()] || SCALP_TREATMENTS_GUIDE;
}

export function getEthnicScalpCare(communityId) {
  const key = communityId.replace(/-/g, '_');
  return ETHNIC_SCALP_CARE[communityId] || ETHNIC_SCALP_CARE[key] || null;
}

export const SCALP_CARE_STATS = {
  moduleId: 'scalp_care_guide',
  version: '1.0.0',
  topics: ['scalp health', 'dandruff', 'seborrhoeic dermatitis', 'scalp microbiome', 'hair loss', 'CCCA', 'traction alopecia', 'scalp massage', 'scalp oils', 'ethnic scalp care', 'minoxidil', 'ketoconazole', 'rosemary oil'],
  communitiesSupported: 9,
  keyFacts: [
    'The scalp has the highest sebaceous gland density of any body area — up to 900 glands per cm²',
    'Malassezia globosa metabolises triglycerides and releases oleic acid which drives dandruff in 50% of the post-pubertal population',
    'CCCA (Central Centrifugal Cicatricial Alopecia) affects up to 5.6% of Black women — early detection is critical to prevent permanent scarring',
    'Rosemary oil at 2% has been shown in RCTs to match the efficacy of minoxidil 2% for hair growth stimulation',
    'Ferritin below 70 ng/mL is associated with significant telogen effluvium; target ferritin 70-100 ng/mL for hair health',
    'Traction alopecia develops from repeated mechanical tension; frontline prevention is releasing tight hairstyles',
    'The Champi scalp massage tradition from Ayurveda is the etymological origin of the word "shampoo"'
  ]
};
