/**
 * MIRRR — Wellness & Beauty Guide
 * Ingestible beauty, supplements, sleep, stress, exercise, hydration,
 * and their effects on skin and hair. Ethnic wellness beauty traditions.
 */

export const WELLNESS_BEAUTY_OVERVIEW = {
  title: 'Wellness-Based Beauty: The Inside-Out Approach',
  introduction: `Beauty is not merely topical. The most sophisticated skincare routine cannot fully compensate for chronic poor sleep, high stress, nutritional deficiencies, or dehydration. Conversely, optimising lifestyle factors creates a foundation of skin and hair health that no product can replicate. The most effective beauty approach combines intelligent topical care with evidence-based wellness practices.`,
  keyPillars: ['Nutrition — the building blocks of skin and hair', 'Sleep — the primary repair period', 'Hydration — water and barrier maintenance', 'Exercise — circulation and detoxification', 'Stress management — cortisol regulation', 'Supplementation — targeted micronutrient support'],
  disclaimer: 'This guide presents evidence-based wellness practices for skin and hair health. It is not medical advice. Consult healthcare providers before beginning supplements, especially if you have medical conditions or take medications.'
};

export const BEAUTY_NUTRITION_GUIDE = {
  title: 'Nutrition for Skin and Hair',
  introduction: `The skin is the largest organ and one of the last to receive nutrients (vital organs take priority). Hair grows approximately 1-1.5cm per month and is entirely built from nutrients consumed 1-3 months prior. Nutritional deficiencies show in skin and hair often before clinical symptoms emerge.`,
  macronutrients: {
    protein: {
      role: 'Keratin (hair, nails) and collagen (skin) are proteins — adequate protein intake is non-negotiable for structural integrity',
      target: '1.0-1.6g per kg body weight daily; higher end if active or over 50',
      best_sources: ['Animal: lean meat, fish, eggs, dairy', 'Plant: legumes, tofu, tempeh, edamame, quinoa, seitan'],
      deficiency_signs: ['Hair thinning and loss (protein is prioritised for vital organs over "non-essential" hair)', 'Brittle nails', 'Slow wound healing', 'Dull skin'],
      note: 'Hair loss from protein deficiency (telogen effluvium) appears 3-6 months after the deficiency occurs due to the hair growth cycle'
    },
    fats: {
      role: 'Essential fatty acids form the lipid bilayer of the skin barrier; ceramides are lipid-based; fat-soluble vitamins (A, D, E, K) require fat for absorption',
      omega_3: {
        importance: 'Anti-inflammatory; prevents TEWL (transepidermal water loss); maintains sebum quality; prevents dry scalp and brittle hair',
        sources: 'Oily fish (salmon, mackerel, sardines, herring), chia seeds, flaxseed, walnuts, algae oil (vegan DHA)',
        target: '250-500mg EPA+DHA daily from diet; supplement 1-3g if low fish intake'
      },
      omega_6: {
        note: 'Linoleic acid (omega-6) deficiency specifically causes dry, scaly skin and increased TEWL; but most Western diets have ample omega-6 and insufficient omega-3',
        balance: 'Aim for omega-3:omega-6 ratio of 1:4 or better; Western diet is typically 1:20'
      },
      avoid: 'Trans fats increase inflammation; excess processed vegetable oils increase inflammatory omega-6 relative to omega-3'
    },
    carbohydrates: {
      glycaemic_impact: 'High-GI foods spike blood glucose → spikes insulin → spikes IGF-1 → stimulates androgen production → increases sebum → worsens acne. Multiple RCTs confirm low-GI diet reduces acne severity.',
      best_sources: 'Low-GI carbohydrates: legumes, most non-starchy vegetables, whole grains, sweet potato',
      worst: 'White bread, white rice, sugary drinks, candy, white pasta — high-GI, also trigger advanced glycation end products (AGEs) that cross-link collagen',
      AGEs: 'Advanced glycation end products (AGEs) form when glucose reacts with proteins including skin collagen — makes collagen rigid and prone to breakage; a major driver of skin ageing; occurs via high-sugar diet and cooking methods (grilling, frying produce more AGEs than steaming/boiling)'
    }
  },
  keyNutrients: {
    vitaminC: {
      role: 'Essential cofactor for collagen synthesis (cross-linking); antioxidant protecting skin cells from UV damage; brightening (inhibits tyrosinase); enhances iron absorption',
      sources: 'Bell peppers (highest), kiwi, strawberries, citrus, broccoli, guava (highest among fruits — ~230mg per 100g)',
      target: '65-90mg/day RDA; skin needs higher — up to 500mg supplementation for collagen synthesis benefit',
      note: 'Vitamin C is unstable; fresh sources better than highly processed; topical and dietary C both contribute to skin effects'
    },
    vitaminA: {
      forms: 'Retinoids (preformed vitamin A from animals); carotenoids (beta-carotene from plants, converted in body)',
      role: 'Regulates skin cell turnover; sebum production; wound healing; immune function in skin',
      sources: 'Liver (richest), oily fish, dairy, eggs (preformed); sweet potato, carrots, leafy greens, mango (as beta-carotene)',
      deficiency_signs: 'Dry rough skin (follicular hyperkeratosis — "chicken skin"); night blindness; dry eyes',
      caution: 'Preformed vitamin A (retinol in supplements) is toxic at high doses; beta-carotene from food is safe (causes harmless yellow-orange skin at very high intake); pregnant: avoid liver and high-dose retinol supplements'
    },
    vitaminD: {
      role: 'Immune regulation in skin; anti-inflammatory; regulates skin cell growth; deficiency linked to increased risk of atopic dermatitis, psoriasis, acne',
      sources: 'Oily fish, egg yolks, fortified foods; primarily synthesised via UV-B exposure to skin',
      synthesisBlock: 'Melanin reduces UV-B penetration — Fitzpatrick IV-VI people synthesise significantly less vitamin D from sun exposure; may need 3x the sun exposure of Fitzpatrick I-II for equivalent synthesis or require supplementation',
      target: 'Most adults need 1500-2000 IU daily; optimal blood level 50-80 nmol/L (UK) / 40-60 ng/mL (US); deficiency common in darker-skinned people in northern latitudes',
      supplement: '1000-4000 IU D3 daily with food (fat-soluble); vitamin K2 (100mcg MK-7) taken alongside for proper calcium and vitamin D metabolism'
    },
    vitaminE: {
      role: 'Fat-soluble antioxidant protecting cell membranes; works synergistically with vitamin C (they regenerate each other); reduces UV damage; wound healing',
      sources: 'Sunflower seeds, almonds, avocado, olive oil, spinach',
      topical: 'Vitamin E oil commonly used for scars and wound healing — some evidence for improvement though vitamin C is more evidence-backed'
    },
    zinc: {
      role: 'Cofactor for 300+ enzymes including collagen-producing enzymes; anti-inflammatory (reduces IL-6, TNF-α); antimicrobial (reduces Cutibacterium acnes); wound healing; hormone regulation (reduces androgens)',
      acne_evidence: 'Zinc 30-45mg daily has evidence comparable to tetracycline antibiotics for acne — with none of the antibiotic resistance or gut dysbiosis',
      sources: 'Oysters (highest), red meat, pumpkin seeds, hemp seeds, lentils, chickpeas',
      supplement: '15-30mg zinc picolinate or zinc glycinate (best absorbed forms); on empty stomach for absorption but take with food if causes nausea; note: zinc inhibits copper absorption at high doses, so copper 2mg alongside if supplementing zinc long-term',
      deficiency: 'Hair loss (telogen effluvium), poor wound healing, acne, white nail spots'
    },
    iron: {
      role: 'Transports oxygen to skin and hair follicles; without adequate iron, follicles are starved of oxygen and shed early',
      forms: 'Haem iron (from meat — absorbed 15-35%) vs non-haem iron (plants — absorbed 2-20%)',
      sources: 'Red meat, liver, shellfish (haem); dark leafy greens, lentils, fortified cereals, pumpkin seeds (non-haem)',
      absorption: 'Vitamin C dramatically increases non-haem iron absorption; tannins in tea/coffee and calcium reduce absorption; take iron and calcium supplements 2+ hours apart',
      ferritin: 'Serum ferritin (iron stores) below 30-50 ng/mL is associated with hair loss even if haemoglobin is normal; ferritin target for hair: 70-100 ng/mL',
      communityNote: 'Iron deficiency anaemia is more prevalent in South Asian, East African, Black American women; vegetarian/vegan diets common in South Asian communities reduce haem iron; heavy periods (PCOS) common in multiple communities increase iron loss'
    },
    biotin: {
      role: 'B7 vitamin; cofactor for carboxylase enzymes involved in fatty acid synthesis; nail and hair keratin synthesis',
      evidence: 'Evidence for biotin supplementation is primarily in people with confirmed biotin deficiency; supplementation in people with adequate biotin may have little effect; however, very commonly supplemented for hair and nail health',
      supplement: '2500-5000mcg daily for 3-6 months to assess effect',
      caution: 'Biotin interferes with thyroid function tests, troponin tests, and several hormone tests — stop 48-72 hours before blood tests',
      food_sources: 'Eggs (avidin in raw egg whites inhibits biotin absorption — cook eggs), liver, nuts, seeds, sweet potato'
    },
    silicon: {
      role: 'Trace mineral supporting collagen and elastin cross-linking; found in bamboo, oat straw, horsetail',
      research: 'Orthosilicic acid (form in supplements) shown to improve skin, hair, and nail quality in several clinical studies',
      supplement: 'Bamboo extract or orthosilicic acid supplement; horsetail extract (high silicon content)',
      food_sources: 'Oats, brown rice, banana, beer (from hops and barley), drinking water from silicon-rich areas'
    }
  },
  skinFoods: {
    title: 'Top Evidence-Based Skin Foods',
    fatty_fish: 'Salmon, mackerel, sardines — omega-3, astaxanthin (antioxidant), vitamin D, protein',
    avocado: 'Oleic acid (moisturising), vitamin E, biotin, antioxidants; dietary avocado shown to improve skin elasticity and firmness in studies',
    sweet_potato: 'Beta-carotene (converts to vitamin A), vitamin C, biotin',
    berries: 'Blueberries particularly — highest ORAC antioxidant value; ellagic acid, anthocyanins reduce UV damage and AGE formation',
    dark_chocolate: '70%+ cacao — flavanols improve skin hydration, blood flow, UV protection; 20g dark chocolate daily shown to improve skin in clinical study',
    green_tea: 'EGCG (epigallocatechin gallate) — anti-inflammatory, antioxidant, inhibits matrix metalloproteinases (enzymes that break down collagen); evidence for topical and oral benefit',
    bone_broth: 'Hydrolysed collagen peptides; proline and glycine (amino acids for collagen); easily absorbed',
    tomatoes: 'Lycopene — carotenoid antioxidant especially beneficial for UV protection; cooked tomatoes have higher bioavailable lycopene',
    walnuts: 'Omega-3 (ALA), zinc, vitamin E, selenium',
    sunflower_seeds: 'Vitamin E (highest in common foods), selenium, linoleic acid'
  },
  antiInflammatoryDiet: {
    title: 'Anti-Inflammatory Diet for Skin',
    basis: 'Chronic low-grade inflammation drives ageing, acne, rosacea, eczema, and psoriasis. Diet significantly influences systemic inflammatory markers (CRP, IL-6, TNF-α).',
    increase: ['Omega-3 rich foods', 'Colourful vegetables (diverse phytonutrients)', 'Berries and cherries', 'Olive oil (oleocanthal — natural COX inhibitor similar to ibuprofen)', 'Turmeric with black pepper (curcumin bioavailability increases 2000% with piperine from pepper)', 'Ginger', 'Green tea', 'Fermented foods (gut microbiome support)'],
    decrease: ['Ultra-processed foods', 'Refined sugars', 'Excess alcohol', 'Trans fats and oxidised oils', 'Excess omega-6 vegetable oils (corn, sunflower, soybean)', 'Low-fibre diet']
  }
};

export const SLEEP_BEAUTY_GUIDE = {
  title: 'Sleep and Skin: The Science of Beauty Sleep',
  overview: `"Beauty sleep" is scientifically real. During deep sleep (stages 3-4) and REM: growth hormone peaks (stimulating cellular repair and collagen synthesis), cortisol drops to its lowest (reducing inflammation), blood flow to skin increases (delivering nutrients), and the skin's transepidermal water loss is lowest (maximising hydration). One poor night of sleep is measurable in skin appearance; chronic sleep deprivation accelerates ageing.`,
  sleepAndSkin: {
    growth_hormone: 'HGH (human growth hormone) releases primarily in first 2 hours of sleep; stimulates collagen synthesis and cellular repair; chronic sleep deprivation reduces HGH by 70%',
    cortisol: 'Cortisol nadir occurs at midnight-2am; elevated cortisol from poor sleep increases sebum, collagen breakdown, inflammation, and skin barrier disruption',
    blood_flow: 'Skin blood flow increases 20-40% during sleep — this is why skin appears plumper and clearer after good sleep',
    immune_function: 'Immune surveillance in skin (NK cells, T cells) is highest during sleep; allows clearance of bacteria and cellular debris',
    melatonin: 'Melatonin — the sleep hormone — is also a powerful antioxidant protecting skin cells from oxidative damage; produced in skin cells as well as the pineal gland; highest at 2-4am'
  },
  sleepDeprivationEffects: {
    immediate: ['Dark circles (blood pools due to poor drainage)', 'Puffy undereyes (cortisol disrupts fluid regulation)', 'Dull complexion (reduced blood flow)', 'Increased fine lines (skin dehydrates faster)', 'Redness and irritability (inflammation markers up)'],
    chronic: ['Accelerated collagen loss', 'Impaired skin barrier function', 'Increased breakouts (cortisol-driven sebum)', 'More severe eczema, psoriasis, rosacea', 'Faster overall skin ageing — one study showed 6 hours vs 8 hours sleep measurably increased skin ageing markers in 4 weeks']
  },
  sleepQuality: {
    duration_target: '7-9 hours for most adults; some people genetically need 8-10 (DEC2 gene variants)',
    sleepHygiene: {
      environment: ['Cool room (18-20°C / 64-68°F optimal)', 'Complete darkness (blackout curtains; eye mask)', 'White noise if ambient sound is disruptive', 'Comfortable mattress and pillow'],
      preSleeRoutine: ['Consistent sleep/wake time including weekends', 'No screens 1 hour before bed (blue light suppresses melatonin)', 'Warm shower or bath 1-2 hours before bed (body temperature drop triggers sleep)', 'Dim lights evening', 'Magnesium glycinate 200-400mg 30 minutes before bed (promotes GABA-mediated relaxation)'],
      avoid: ['Caffeine after 2pm (half-life 5-7 hours)', 'Alcohol (disrupts REM sleep and causes night-time cortisol spikes; worsens snoring and sleep apnoea)', 'Large meals within 3 hours of bed', 'Intense exercise within 2 hours of bed (raises cortisol)']
    }
  },
  nighttimeSkincare: {
    rationale: 'Skin absorbs active ingredients most effectively at night: higher cell turnover, reduced barrier tightness, and no UV to degrade actives. Night is when retinoids, heavy moisturisers, overnight masks, and repair serums work best.',
    timing: 'Apply skincare immediately after showering or washing face in the evening — skin cells open to absorption when slightly warm and damp',
    bestNightIngredients: ['Retinoids (only at night — UV sensitive)', 'AHAs (lightly exfoliate while you sleep)', 'Hyaluronic acid (draws moisture overnight)', 'Niacinamide (anti-inflammatory overnight)', 'Bakuchiol (retinol alternative for sensitive skin)', 'Ceramide and lipid-rich moisturisers (overnight barrier rebuild)', 'Face oil as final occlusive layer'],
    sleepingPosition: {
      concern: 'Side sleeping compresses facial skin into pillow for 6-8 hours, creating sleep lines. Chronic pressure in the same position can contribute to permanent wrinkles and collagen breakdown. Also compresses lymphatics causing facial puffiness.',
      solutions: ['Sleep on back if possible', 'Silk or satin pillowcase (reduces friction significantly; gentler on skin and hair)', 'Anti-ageing pillows with cut-outs for face', 'Night splint/eye mask that keeps face lifted off pillow edge']
    },
    hairProtection: ['Silk or satin pillowcase to reduce friction and prevent tangles', 'Loose bun, braid, or pineapple for curly/coily hair to preserve curl pattern and reduce tangles', 'Apply hair oil to ends before protecting to seal moisture overnight', 'Silk bonnet or hair wrap — particularly important for 4C hair to prevent moisture loss and breakage']
  }
};

export const EXERCISE_BEAUTY_GUIDE = {
  title: 'Exercise and Skin/Hair Health',
  overview: `Exercise is one of the most powerful anti-ageing and skin-health interventions available. Regular aerobic exercise improves skin structure at the cellular level, reduces inflammation, supports hair follicle health, and has been shown to actually reverse some aspects of skin ageing.`,
  skinBenefits: {
    circulation: 'Exercise increases heart rate and blood flow — skin receives more oxygen and nutrients; this is why skin glows post-workout and why regular exercisers have better skin tone',
    mitochondria: 'A landmark 2014 McMaster University study: participants who took up exercise had skin composition of people 10-30 years younger by measures of dermis thickness and skin composition — even people who began exercise later in life had significant reversal',
    collagen: 'Exercise increases IGF-1 (which stimulates collagen synthesis) and reduces cortisol (which breaks down collagen) — a dual benefit for collagen status',
    anti_inflammatory: 'Regular exercise reduces chronic low-grade inflammation markers (CRP, IL-6) — this improves inflammatory skin conditions including acne, rosacea, eczema, and psoriasis',
    sebum_regulation: 'Moderate regular exercise regulates hormones (reduces insulin, cortisol, androgens) — this can reduce sebum production over time in acne-prone skin'
  },
  hairBenefits: {
    circulation: 'Exercise increases scalp blood flow, delivering more nutrients to hair follicles and supporting the anagen (growth) phase',
    DHT: 'High-intensity exercise can temporarily increase DHT (dihydrotestosterone) — the androgen that drives scalp hair loss in genetically susceptible individuals; moderate exercise is preferred if concerned about androgenetic alopecia',
    stress_reduction: 'Exercise is one of the most effective cortisol regulators; since telogen effluvium (stress hair loss) is cortisol-mediated, regular exercise reduces stress-related hair shedding'
  },
  exerciseSkincare: {
    preWorkout: ['Remove all makeup before exercise (sweat + makeup = blocked pores)', 'Apply SPF if exercising outdoors even in winter', 'Avoid acid actives immediately before high-intensity exercise (heat + acids + sweating = irritation)', 'A light hydrating mist is fine; no heavy cream that will drip'],
    postWorkout: ['Cleanse within 30 minutes of finishing to remove sweat (salt, urea, lactic acid sit on skin and irritate if left)', 'Do not over-cleanse — once is enough', 'Reapply hydration and SPF if daytime', 'Bacne (back acne) common from sweating in tight workout clothes — shower promptly and use salicylic acid body wash']
  },
  exerciseTypes: {
    cardio: 'Aerobic exercise (running, cycling, swimming) — best for circulation and anti-inflammatory benefits; 150+ minutes/week for skin benefit',
    yoga_pilates: 'Reduces cortisol significantly; inverted poses improve facial blood flow; gua sha and face yoga techniques often combined',
    resistance_training: 'Increases growth hormone (collagen stimulation); excellent for PCOS skin via insulin sensitisation; improves body composition which affects skin appearance',
    sauna: 'Heat stress induces heat shock proteins that protect skin cells; improves circulation; deep pore cleansing via sweating; shown to improve skin hydration and barrier function. Finnish sauna culture: 80-100°C sessions 2-3x/week. Note: separate from skin activity — shower after sauna, rehydrate, apply moisturiser to slightly damp skin.'
  }
};

export const STRESS_BEAUTY_GUIDE = {
  title: 'Stress, Cortisol, and Skin/Hair',
  overview: `The gut-brain-skin axis is real: psychological stress triggers measurable skin responses within hours. The mechanism is primarily through cortisol and CRH (corticotropin-releasing hormone), which are produced both in the brain and locally in skin cells.`,
  stressSkinMechanisms: {
    cortisol_effects: ['Stimulates sebaceous glands — increased sebum → acne', 'Breaks down collagen and elastin — accelerated ageing', 'Impairs skin barrier (reduces ceramide production) — increased sensitivity, dryness, TEWL', 'Increases inflammatory cytokines — triggers or worsens eczema, psoriasis, rosacea', 'Reduces wound healing speed by 40-60%', 'Impairs immune surveillance — allows pathogen and yeast overgrowth (cold sores, seborrhoeic dermatitis)'],
    hair_effects: ['Telogen effluvium: major stressor pushes large percentage of hairs into rest/shed phase simultaneously; shedding peaks 2-4 months after stressor', 'Alopecia areata: autoimmune hair loss triggered or worsened by stress', 'Neuropeptide release around follicles from stress disrupts hair growth cycle'],
    mast_cells: 'Stress triggers mast cells in skin to release histamine and inflammatory mediators — causing immediate itch (pruritus), hives, and flush reactions'
  },
  stressManagement: {
    clinical_evidence: {
      mindfulness_meditation: 'MBSR (mindfulness-based stress reduction) proven to reduce psoriasis flares; improves atopic dermatitis outcomes; reduces cortisol; 8-week programs studied',
      breathing: 'Slow diaphragmatic breathing (4-7-8 technique, box breathing) activates parasympathetic nervous system; reduces cortisol within 10 minutes; accessible and free',
      yoga: 'Reduces cortisol, increases DHEA-S (anti-ageing hormone), improves gut microbiome; particularly studied for eczema',
      exercise: 'See exercise section; most potent cortisol regulation tool',
      sleep: 'Sleep deprivation dramatically increases cortisol; sleep hygiene is stress management'
    },
    adaptogens: {
      ashwagandha: {
        evidence: 'KSM-66 extract (branded form) shown to reduce cortisol by 27% in stressed adults in double-blind RCT; reduces anxiety; evidence for reducing cortisol-driven skin issues',
        dose: '300-600mg KSM-66 extract daily; may take 4-8 weeks for full effect',
        note: 'Avoid if autoimmune condition; consult doctor if thyroid issue (may increase T4 levels)'
      },
      rhodiola: {
        evidence: 'Adaptogen with good evidence for stress resilience; reduces fatigue under stress; some cortisol reduction evidence',
        dose: '200-400mg extract (3% rosavins, 1% salidroside) daily',
        take: 'In morning (can be stimulating); not at night'
      },
      phosphatidylserine: {
        evidence: 'Blunts cortisol response to exercise and psychological stress; also has cognitive benefits; good evidence base',
        dose: '400-800mg daily from soy or sunflower lecithin source'
      }
    }
  }
};

export const HYDRATION_BEAUTY_GUIDE = {
  title: 'Hydration Inside and Out',
  waterAndSkin: {
    overview: 'The relationship between drinking water and skin hydration is often overstated. Severe dehydration impairs skin turgor and radiance, but drinking large amounts of water beyond adequate hydration does not measurably improve skin hydration in already hydrated people — because skin barrier function (not water intake) is the primary determinant of skin hydration.',
    genuine_impact: ['Prevents the dullness and dry-feel associated with dehydration', 'Supports kidney function in detoxifying skin', 'Maintains mucosal barriers that affect skin microbiome', 'Optimal for skin when combined with low-sugar diet and adequate electrolytes'],
    target: '2.0-2.5L total fluid daily (from food and drinks); more in heat or with exercise; individual variation large',
    quality: 'Mineral water (containing calcium, magnesium, silica) may offer additional skin benefits over tap water; silica-rich waters (Volvic, Fiji) have trace evidence for skin benefit'
  },
  electrolytes: {
    importance: 'Water retention in skin and hair cells requires proper electrolyte balance; dehydration is often electrolyte imbalance rather than pure water deficiency',
    for_skin: ['Magnesium — involved in 300+ enzymatic reactions; deficiency causes skin irritation and inflammation', 'Potassium — cellular hydration; found in avocado, banana, potato', 'Sodium — avoid excess (increases skin puffiness via water retention) but total restriction not necessary'],
    oral_rehydration: 'Post-exercise or in heat: water + electrolytes more hydrating than plain water; coconut water, or 1/4 tsp sea salt + lemon in water'
  },
  skinHydrationTopical: {
    overview: 'Skin hydration is maintained by the skin barrier (primarily ceramides, fatty acids, and cholesterol in the stratum corneum) and by humectants that draw water into skin cells. External hydration is independent of water intake.',
    humectants: ['Hyaluronic acid — draws up to 1000x its weight in water', 'Glycerin — most cost-effective humectant', 'Aloe vera', 'Panthenol (pro-vitamin B5)', 'Sodium PCA (naturally occurring in skin)', 'Honey', 'Urea (at 3-5%; double role as exfoliant at 10-40%)'],
    occlusives: ['Petrolatum — most effective occlusive (reduces TEWL by up to 98%)', 'Squalane', 'Shea butter', 'Mineral oil', 'Lanolin', 'Dimethicone'],
    emollients: ['Ceramides (restore barrier structure)', 'Fatty acids (linoleic, oleic)', 'Niacinamide (barrier repair and hydration)'],
    layering: 'Apply humectant on slightly damp skin; top with emollient moisturiser; seal with occlusive if very dry skin (oil or balm)'
  }
};

export const ETHNIC_WELLNESS_BEAUTY = {
  'west-african': {
    traditionalWellness: 'Holistic beauty in West African tradition is inseparable from community and ritual. Baths infused with herbs (especially Yoruba and Igbo traditions) — moringa, African basil, hibiscus — for skin cleansing and spiritual cleansing simultaneously.',
    nutritionHighlights: ['Moringa (miracle tree) — highest density of vitamin C, calcium, iron, and protein per weight of any plant; growing in popularity globally for its skin/hair supplement benefits', 'Baobab fruit — extraordinarily high vitamin C content; prebiotic fibre; popular as powder supplement', 'Hibiscus (zobo/sorrel) — high in AHA (citric, malic acid), antioxidants, and vitamin C; skin-brightening in teas'],
    sleepCulture: 'Community-based sleeping arrangements historically common; stress buffering from social support reduces cortisol; Ubuntu philosophy (I am because we are) linked to wellbeing',
    movementTradition: 'Dance central to West African culture across all traditions — Azonto, Afrobeats movement, traditional ceremonial dance; provides cardiovascular and mental health benefits'
  },
  'south-asian': {
    ayurvedaIntegration: 'Ayurveda — 5000-year-old Indian system of medicine — forms the foundation of South Asian wellness beauty. Dosha-based skin typing (Vata: dry/thin; Pitta: sensitive/inflammatory; Kapha: oily/prone to congestion) guides product and lifestyle choices.',
    nutritionHighlights: ['Turmeric with black pepper — curcumin bioavailability increases 2000% with piperine from black pepper; take as "golden milk" (haldi doodh)', 'Amla (Indian gooseberry) — highest natural vitamin C content of any food (600-700mg per 100g); used fresh, dried, or as powder', 'Ashwagandha — Ayurvedic adaptogen with the strongest Western clinical evidence of any adaptogen', 'Shatavari — Ayurvedic herb with oestrogenic properties; used for hormonal balance and menopausal support'],
    practiceHighlights: ['Abhyanga — daily full-body warm oil massage with sesame oil; reduces cortisol, improves skin hydration and barrier', 'Nasya — nasal oil application (sesame oil); traditional; some evidence for mucosal health', 'Yoga — founded in India; comprehensive stress, flexibility, and circulation benefits documented'],
    sleepCulture: 'Ayurveda emphasises sleep in alignment with natural light cycles; recommend sleeping by 10pm; sleeping with head oriented north traditional'
  },
  caribbean: {
    wellness_culture: 'Caribbean wellness integrates African, Indigenous Taíno/Arawak, Indian, and European influences. "Bush medicine" — herbal remedies from local plants — is a living tradition.',
    nutritionHighlights: ['Sea moss / Irish moss (Gracilaria sp.) — contains 92 of the 102 minerals the human body needs according to traditional claims; genuine evidence for iodine (thyroid), potassium, and carrageenan (anti-inflammatory) content; popular as supplement gel', 'Soursop leaf tea — traditional immune and skin support; some antimicrobial evidence', 'Coconut water — natural electrolyte; genuinely excellent for hydration', 'Guava — very high vitamin C and lycopene; locally common Caribbean fruit'],
    movementTradition: 'Dancehall, soca, reggae — music-driven movement tradition; swimming in the Caribbean sea (salt water has skin-beneficial minerals)'
  },
  arab: {
    traditionalWellness: 'Hammam (Arabic bath culture) — centuries-old bathing ritual combining steam, deep cleanse with kessa exfoliating glove, black soap (beldi), and ghassoul clay mask; deeply moisturising and exfoliating. Hamams still operational across Morocco, Tunisia, Turkey, and Jordan.',
    nutritionHighlights: ['Dates — high natural sugars but also fibre, potassium, magnesium, and unique antioxidants; "break the fast" food in Ramadan; mineral-rich', 'Za\'atar (thyme, sumac, sesame blend) — antioxidant-rich spice blend; thymol from thyme has antimicrobial skin benefits', 'Black seed oil (Nigella sativa) — "a cure for everything except death" (hadith); thymoquinone has genuine anti-inflammatory, antimicrobial evidence'],
    fastingPractice: 'Ramadan fasting (intermittent fasting pattern of 16-18 hours) has skin benefits: induces autophagy (cellular cleanup), reduces inflammation, may improve acne and skin clarity. Post-fast eating quality matters: nutrient-dense iftar preserves benefit.'
  },
  latina: {
    wellness_tradition: 'Sobada (traditional massage), temazcal (Mexican sweat lodge), curandera/curandero healing traditions, and brujería herbalism are parts of the Latin American wellness-beauty continuum.',
    nutritionHighlights: ['Avocado — oleic acid, biotin, vitamin E, potassium; Mexico grows 45% of world avocados; perhaps the original beauty food', 'Cacao — flavanols with proven cardiovascular and skin UV protection benefits; consumed traditionally as bitter drink with chili (xocolatl)', 'Chia seeds — omega-3 ALA, calcium, fibre; Aztec warrior food; excellent for inflammatory skin conditions', 'Chayote (vegetable pear) — traditional skin brightening vegetable in Latin America; high vitamin C and water content'],
    temazcalTradition: 'Pre-Hispanic sweat lodge tradition: herbal steam (cedar, rosemary, copal), mud mask, cooling rinse; promotes deep pore cleansing, relaxation, and mineral absorption through skin. Contraindicated: pregnancy, cardiovascular conditions, hypertension.',
    movementTradition: 'Salsa, bachata, cumbia, merengue — partner dance cultures; excellent cardiovascular exercise; strong mental health benefits from social dancing'
  },
  'east-asian': {
    wellnessTradition: 'Traditional Chinese Medicine (TCM) and Korean/Japanese traditional medicine (hanbang/kampo) view skin and hair as reflections of internal organ health — particularly the lung (skin), kidney (hair and ears), and spleen (complexion).',
    nutritionHighlights: ['Goji berries (wolfberries) — extremely high antioxidant, zeaxanthin (eye and skin UV protection), polysaccharides (immune support)', 'Reishi mushroom — "mushroom of immortality"; polysaccharides with immune-modulating effects; adaptogens; trendy in Western supplement world', 'Green tea/matcha — highest EGCG content; anti-inflammatory, UV protective effects documented in both oral and topical use', 'Fermented soy (miso, natto, tempeh) — prebiotic and probiotic; natto particularly rich in vitamin K2 and nattokinase'],
    ofuroBath: 'Japanese soaking bath culture (ofuro) — hot bath at 40-42°C for 10-15 minutes; more than cleaning, it is a meditative ritual; improves circulation, relaxes muscles, lowers cortisol. Onsen (hot spring) bathing with mineral-rich thermal water is a weekend wellness tradition.',
    gua_sha: 'Traditional Chinese technique: scraping the skin with a smooth tool (jade, rose quartz, or buffalo horn) to move chi (energy) and release stagnant blood. Modern evidence: increases blood circulation in the area; reduces inflammation (anti-inflammatory cytokines increased post-gua sha); temporary marks are part of the process.',
    kodoTraditional: 'Japanese kōdō ("Way of Fragrance") — appreciation of incense as contemplative practice; stress reduction through intentional scent; oud and agarwood central'
  },
  'east-african': {
    wellnessTradition: 'Coffee ceremony (in Ethiopian culture, buna/jabana) is a social wellness ritual — freshly roasted and ground coffee brewed in community; coffee ground residue (grounds) used for face masks and exfoliation; coffee chlorogenic acid and antioxidants have skin benefit.',
    nutritionHighlights: ['Teff — Ethiopian staple grain; exceptionally high iron, calcium, protein; coeliac-safe; particularly important for East African women\'s beauty nutrition', 'Injera — fermented teff flatbread; probiotics from 3-day fermentation; high iron; combined with stews rich in turmeric and anti-inflammatory spices', 'Moringa — grows widely in East Africa; as in West Africa, one of the most nutrient-dense plants', 'Frankincense resin (boswellia) — chewed traditionally for oral health; oral boswellic acids have anti-inflammatory skin benefit'],
    movementTradition: 'Ethiopian runners among the world\'s most successful distance runners — cultural environment normalising exercise; Oromo traditional dances ceremonial and social wellness'
  },
  'south-african': {
    wellnessTradition: 'Ubuntu wellness philosophy — collective wellbeing as foundation of individual health. Medicinal plant traditions of Zulu, Xhosa, Sotho, and other peoples extremely rich in skin-beneficial botanicals.',
    nutritionHighlights: ['Rooibos (Aspalathus linearis) — unique to the Cederberg region; caffeine-free; aspalathin antioxidant; anti-inflammatory; excellent for skin taken as tea or applied topically', 'Marula fruit — eaten by elephants in season; extremely high vitamin C; skin-beneficial oil from the nut; both edible and topical use traditional', 'Macadamia — native to Australia but grown extensively in South Africa; palmitoleic acid closely mirrors skin\'s sebum; excellent for mature and dry skin'],
    umhlanga: 'Zulu Reed Dance (umhlanga) — annual celebration of young women; involves multi-day outdoor ceremony with communal activities; connection to nature and community as wellness',
    isivunguvungu: 'Traditional Zulu steam treatment using medicinal plants in boiling water; akin to herbal steam facial — combination of antimicrobial plant compounds and steam opening pores'
  },
  'black-american': {
    wellnessTradition: 'Black wellness culture integrates African heritage, Christian spiritual wellness practices, the civil rights self-care legacy, and modern mindfulness. "Treat yourself" culture has deep roots in historical denial of access to wellness practices.',
    nutritionHighlights: ['Sweet potatoes — high in beta-carotene (vitamin A precursor), vitamin C; traditional soul food with beauty benefits', 'Black-eyed peas (cowpeas) — plant protein, folate, iron; traditional Southern cuisine; excellent for vegans building beauty nutrition', 'Collard greens — extremely high in calcium, vitamin K, vitamin C; cooked greens are a traditional beauty food', 'Watermelon — lycopene (UV protection), citrulline (supports circulation), vitamin C; deeply associated with Black American food culture'],
    selfCareLegacy: 'Audre Lorde (Black feminist writer) wrote in 1988: "Caring for myself is not self-indulgence, it is self-preservation, and that is an act of political warfare." Self-care in the Black community carries political and spiritual significance beyond individual beauty.',
    salonAsSanctuary: 'The Black hair salon is a community space, therapy session, and wellness ritual simultaneously. The ritual of hair appointment — including scalp massage, conditioning treatments — is wellness.',
    movementTradition: 'Step dance (HBCUs), praise dance (Black church tradition), hip-hop dance, West African dance — all represent culturally rooted movement practices with cardiovascular wellness benefit'
  }
};

export function getWellnessBeautyOverview() {
  return WELLNESS_BEAUTY_OVERVIEW;
}

export function getBeautyNutritionGuide(section = null) {
  if (section === 'macros') return BEAUTY_NUTRITION_GUIDE.macronutrients;
  if (section === 'nutrients') return BEAUTY_NUTRITION_GUIDE.keyNutrients;
  if (section === 'foods') return BEAUTY_NUTRITION_GUIDE.skinFoods;
  if (section === 'anti-inflammatory') return BEAUTY_NUTRITION_GUIDE.antiInflammatoryDiet;
  return BEAUTY_NUTRITION_GUIDE;
}

export function getSleepBeautyGuide(section = null) {
  if (section === 'science') return SLEEP_BEAUTY_GUIDE.sleepAndSkin;
  if (section === 'effects') return SLEEP_BEAUTY_GUIDE.sleepDeprivationEffects;
  if (section === 'routine') return SLEEP_BEAUTY_GUIDE.nighttimeSkincare;
  return SLEEP_BEAUTY_GUIDE;
}

export function getExerciseBeautyGuide() {
  return EXERCISE_BEAUTY_GUIDE;
}

export function getStressBeautyGuide() {
  return STRESS_BEAUTY_GUIDE;
}

export function getHydrationBeautyGuide() {
  return HYDRATION_BEAUTY_GUIDE;
}

export function getEthnicWellnessBeauty(communityId) {
  const key = communityId.replace(/-/g, '_');
  const id = communityId.includes('_') ? communityId.replace(/_/g, '-') : communityId;
  return ETHNIC_WELLNESS_BEAUTY[id] || ETHNIC_WELLNESS_BEAUTY[communityId] || null;
}

export const WELLNESS_BEAUTY_STATS = {
  moduleId: 'wellness_beauty_guide',
  version: '1.0.0',
  topics: ['beauty nutrition', 'vitamins for skin', 'collagen nutrition', 'beauty sleep', 'exercise and skin', 'stress and skin', 'cortisol and beauty', 'hydration', 'adaptogens', 'ethnic wellness beauty traditions', 'ayurveda', 'hammam', 'ofuro', 'temazcal', 'abhyanga'],
  communitiesSupported: 9,
  keyFacts: [
    'Skin loses up to 30% collagen in the first 5 years of menopause; exercise and vitamin C nutrition support collagen synthesis',
    'McMaster University 2014 study: exercise reversed skin ageing at cellular level even in people who began later in life',
    'Telogen effluvium (stress hair loss) peaks 2-4 months after the stressor, not immediately',
    'Moringa contains higher vitamin C, calcium, iron, and protein per weight than almost any other plant',
    'Amla (Indian gooseberry) contains 600-700mg vitamin C per 100g — among the highest of any food',
    'Turmeric curcumin bioavailability increases 2000% when combined with black pepper piperine',
    'Sea moss contains significant levels of iodine, potassium, and carrageenan with documented anti-inflammatory properties'
  ]
};
