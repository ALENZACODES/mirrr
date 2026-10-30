/**
 * MIRRR — Nutrition & Beauty From Within — Ethnic Guide
 * The science of skin nutrition and traditional dietary beauty practices
 * Topics: collagen synthesis, antioxidants, hydration, gut-skin axis, community diets
 */

// ============================================================
// NUTRITION-SKIN SCIENCE
// ============================================================

export const NUTRITION_SKIN_SCIENCE = {
  overview: `"Beauty from within" is not marketing language — it\'s biochemistry. Skin cells require specific
  micronutrients to synthesize collagen, produce melanin at healthy levels, maintain barrier function,
  and execute cellular repair. Nutritional deficiencies manifest visibly in skin: vitamin C deficiency
  causes poor wound healing and easy bruising; vitamin A deficiency causes follicular hyperkeratosis;
  zinc deficiency causes acne-like lesions and poor healing; omega-3 deficiency causes dull, dry skin.`,

  collagenSynthesis: {
    overview: 'Collagen (types I and III) provides tensile strength and structure; requires specific cofactors',
    requirements: {
      vitaminC: {
        role: 'Essential cofactor for prolyl hydroxylase and lysyl hydroxylase enzymes — without vitamin C, collagen cannot be assembled',
        deficiency: 'Scurvy; poor wound healing; capillary fragility (bruising); perifollicular hemorrhages',
        optimal: '65-90mg/day RDA; 500-1000mg supplemental for skin optimization; upper limit 2000mg',
        foodSources: ['Guava (highest; 228mg/100g)', 'Red bell pepper (190mg/100g)', 'Kiwi', 'Citrus', 'Papaya', 'Amla/Indian gooseberry (extremely high: ~600mg/100g)']
      },
      proline: {
        role: 'Amino acid; primary building block of collagen',
        sources: 'Bone broth, egg whites, meat, dairy, asparagus, mushrooms'
      },
      glycine: {
        role: 'Most abundant amino acid in collagen; 1/3 of collagen is glycine',
        sources: 'Bone broth, pork skin, gelatin, poultry skin, sesame seeds, lentils'
      },
      copper: {
        role: 'Lysyl oxidase enzyme requires copper for collagen cross-linking (strength)',
        sources: 'Liver, shellfish, nuts, seeds, dark chocolate',
        deficiency: 'Easy bruising; poor skin wound healing'
      },
      zinc: {
        role: 'Required for RNA polymerase function in collagen gene expression; wound healing',
        sources: 'Oysters (highest), beef, pumpkin seeds, lentils, chickpeas',
        acneConnection: 'Zinc supplementation (30-45mg/day) has clinical evidence for acne reduction'
      }
    }
  },

  antioxidantsForSkin: {
    overview: 'Oxidative stress from UV, pollution, and metabolic byproducts degrades collagen, causes DNA damage, and accelerates aging. Dietary antioxidants neutralize free radicals.',
    keyAntioxidants: {
      vitaminE: {
        role: 'Fat-soluble antioxidant; protects cell membranes from lipid peroxidation; works synergistically with vitamin C',
        sources: 'Sunflower seeds, almonds, avocado, olive oil, wheat germ',
        topical: 'Also applied topically but dietary source critical for internal protection'
      },
      betaCarotene: {
        role: 'Provitamin A; antioxidant; mild photoprotective effect (internal "sunscreen")',
        sources: 'Sweet potato, carrots, red palm oil (highest plant source), mango, papaya, red pepper',
        darkSkin: 'Overconsumption can cause carotenodermia (orange-yellow skin tint) — more visible on lighter skin',
        note: 'Do NOT substitute beta-carotene supplements for sunscreen; effect is marginal'
      },
      lycopene: {
        role: 'Carotenoid; photoprotective; significant anti-aging; skin cancer protective',
        sources: 'Cooked tomatoes (lycopene bioavailability increases with cooking + fat), watermelon, guava, papaya',
        study: 'German RCT: 10 weeks lycopene supplementation significantly reduced UV-induced skin damage'
      },
      polyphenols: {
        types: ['Resveratrol (red grapes, Japanese knotweed)', 'EGCG (green tea)', 'Quercetin (onions, apples)', 'Anthocyanins (blueberries, purple foods)', 'Curcumin (turmeric)'],
        mechanism: 'Multiple antioxidant pathways; some also anti-inflammatory; some activate longevity pathways (sirtuins)',
        greenTea: 'EGCG specifically studied for skin photoprotection and collagen preservation'
      }
    }
  },

  hydrationScience: {
    overview: 'Skin is ~64% water; dehydration manifests as dullness, accentuated fine lines, and reduced elasticity. Water intake supports dermis hydration but topical moisturising remains essential.',
    dailyIntake: '2.7L women / 3.7L men total water (food + drink) per NASEM guidelines',
    foodSources: 'Cucumber (96% water), watermelon (92%), celery (95%), oranges (88%)',
    electrolytes: 'Sodium and potassium maintain intracellular water; electrolyte balance as important as water volume',
    caffeineMyth: 'Moderate coffee and tea consumption (up to 400mg caffeine/day) is NOT dehydrating; net water positive',
    alcoholEffect: 'Alcohol is diuretic; dehydrates skin; antioxidants in wine partially offset effect but net skin impact is negative',
    hyaluronicAcid: 'Body produces hyaluronic acid naturally; dietary hyaluronic acid has limited evidence but collagen + HA foods may support production'
  },

  gutSkinAxis: {
    overview: `The gut-skin axis is an emerging field connecting microbiome health to skin conditions.
    The gut microbiome produces short-chain fatty acids that reduce inflammation systemically;
    gut permeability ("leaky gut") allows inflammatory triggers into bloodstream, which can manifest in skin.`,
    conditions: {
      acne: 'Gut dysbiosis correlated with acne severity; Lactobacillus rhamnosus supplementation shown in some RCTs to reduce acne',
      rosacea: 'Small intestinal bacterial overgrowth (SIBO) found at higher rates in rosacea patients; treating SIBO improved rosacea in some studies',
      eczema: 'Gut microbiome diversity in infancy protective against eczema development; probiotics in pregnancy and infancy may reduce risk',
      psoriasis: 'Gut inflammation linked to psoriatic flares; Mediterranean diet associated with reduced psoriasis severity'
    },
    probiotics: 'Fermented foods (yogurt, kefir, kimchi, sauerkraut, miso, tempeh) support microbiome diversity',
    prebiotics: 'Feed beneficial bacteria: garlic, onions, leeks, asparagus, bananas, oats, apple (pectin)',
    trigger: 'High glycemic diet → insulin spike → IGF-1 elevation → sebum production → acne exacerbation'
  },

  inflammationAndSkin: {
    overview: 'Systemic inflammation worsens virtually all skin conditions — acne, eczema, rosacea, psoriasis, and accelerates aging.',
    proInflammatory: ['High glycemic foods (white bread, sugar, processed foods)', 'Trans fats', 'Excessive alcohol', 'Processed vegetable oils (high omega-6 to omega-3 ratio)', 'Food sensitivities (gluten, dairy — individual)'],
    antiInflammatory: ['Omega-3 fatty acids (salmon, sardines, mackerel, flaxseed, walnuts)', 'Turmeric (curcumin)', 'Ginger', 'Leafy greens', 'Berries', 'Olive oil (oleocanthal)', 'Green tea (EGCG)'],
    glycemicIndex: 'Low-GI diet significantly reduces acne severity in multiple RCTs; insulin/IGF-1 pathway drives sebum production and comedone formation'
  }
};

// ============================================================
// KEY BEAUTY NUTRIENTS A-Z
// ============================================================

export const BEAUTY_NUTRIENTS = {
  biotin: {
    name: 'Biotin (Vitamin B7)',
    role: 'Fatty acid synthesis; keratin production (hair, nails, skin)',
    deficiency: 'Hair loss, brittle nails, dry scaly skin — actual deficiency very rare',
    sources: 'Eggs (especially yolk), liver, salmon, sunflower seeds, sweet potato',
    supplement: 'Most people not deficient; supplements only help if deficient; avoid raw egg white (avidin blocks absorption)',
    hype: 'Biotin supplementation oversold — most benefit is for documented deficiency only'
  },
  collagenDietary: {
    name: 'Dietary Collagen Peptides',
    forms: 'Hydrolyzed collagen powder, bone broth, collagen-rich foods (skin, cartilage)',
    evidence: '2019 systematic review: collagen peptide supplementation (2.5-5g/day) showed skin hydration and elasticity improvements in multiple RCTs',
    mechanism: 'Collagen peptides are absorbed as dipeptides/tripeptides and stimulate fibroblast collagen production',
    best: 'Type I and III collagen most relevant for skin; marine collagen highly bioavailable',
    vegan: 'No plant-based collagen; vitamin C + proline + glycine support body\'s own production'
  },
  omega3: {
    name: 'Omega-3 Fatty Acids (EPA/DHA)',
    role: 'Anti-inflammatory; skin barrier lipid component; reduce sebum production; improve psoriasis and eczema',
    sources: 'Fatty fish (salmon, mackerel, sardines, herring), flaxseed, chia seeds, walnuts, algae oil (vegan DHA)',
    evidence: 'Multiple studies: omega-3 supplementation reduces inflammatory skin conditions; improves UV response; reduces PIH',
    dose: '2-3g EPA+DHA daily for skin benefits; 500mg minimum for maintenance',
    darkSkin: 'Omega-3 reduces PIH and inflammatory response — particularly relevant for Fitzpatrick IV-VI'
  },
  vitaminD: {
    name: 'Vitamin D',
    role: 'Immune modulation; keratinocyte differentiation; psoriasis and eczema regulation',
    skinProduction: 'UVB converts 7-dehydrocholesterol to previtamin D3 in skin; melanin reduces production significantly',
    darkSkinDeficiency: 'Fitzpatrick V-VI skin produces 6-10x less vitamin D per same UVB exposure as Fitzpatrick I-II; supplementation critical in northern latitudes',
    deficiency: 'Linked to eczema, psoriasis, acne; immune dysregulation',
    dose: '1000-2000 IU D3 daily supplementation recommended for dark skin in northern climates',
    test: 'Blood 25(OH)D test; optimal level 40-60 ng/mL'
  },
  zinc: {
    name: 'Zinc',
    role: 'Wound healing; collagen synthesis; antioxidant enzyme cofactor; sebum regulation; acne treatment',
    sources: 'Oysters (highest), beef, pumpkin seeds, cashews, chickpeas, lentils',
    acne: 'Zinc sulfate 400mg/day shown comparable to tetracycline 1g/day for acne in some studies',
    deficiency: 'Acne-like lesions; poor wound healing; white spots on nails (likely not zinc-related)',
    dose: '30-45mg/day for acne; long-term high doses should be monitored'
  },
  ironBeauty: {
    name: 'Iron',
    role: 'Oxygen delivery to skin cells; required for collagen production (prolyl hydroxylase)',
    deficiency: 'Pallor; dull skin; brittle nails; hair loss (telogen effluvium from severe deficiency)',
    sources: 'Red meat (heme iron, most bioavailable), lentils, spinach, fortified cereals (non-heme, less bioavailable)',
    absorption: 'Vitamin C increases non-heme iron absorption; coffee, tea, dairy reduce absorption',
    darkSkin: 'Iron-deficiency pallor difficult to assess on dark skin; look at mucous membranes (conjunctiva, gums)'
  },
  selenium: {
    name: 'Selenium',
    role: 'Antioxidant enzyme glutathione peroxidase; thyroid function (affects skin, hair); anti-cancer',
    sources: 'Brazil nuts (1-2/day = daily RDA), seafood, meat, whole grains',
    caution: 'Upper limit 400mcg/day; selenosis from overconsumption causes hair loss, nail brittleness — opposite of benefit',
    brazilNuts: '2 Brazil nuts daily is optimal; more is not better'
  },
  silica: {
    name: 'Silicon/Silica',
    role: 'Collagen and elastin cross-linking; bone, hair, nail, skin structural support',
    sources: 'Whole grains, oats, horsetail herb (highest plant source), cucumbers, leeks',
    form: 'Orthosilicic acid most bioavailable; some evidence for hair and nail strength supplementation'
  }
};

// ============================================================
// 9 COMMUNITY NUTRITION BEAUTY GUIDES
// ============================================================

export const ETHNIC_NUTRITION_BEAUTY_GUIDES = {
  'west-african': {
    communityName: 'West African',
    dietaryProfile: 'Rich in tubers, palm oil, fish, legumes, leafy greens, tropical fruits, fermented foods',

    beautySuperfoods: {
      palmOil: {
        description: 'Red palm oil is highest plant source of carotenoids including beta-carotene; also rich in vitamin E tocotrienols',
        beauty: 'Anti-aging antioxidants; skin repair; often consumed in traditional West African cooking',
        note: 'Red (unrefined) palm oil has beauty benefits; refined/bleached palm oil does not'
      },
      moringa: {
        description: 'Moringa oleifera (drumstick tree); leaves packed with vitamins A, C, E, iron, calcium, zinc',
        beauty: 'One of Africa\'s most nutrient-dense plants; used in cooking and as supplement',
        consumption: 'Moringa leaf powder added to soups, stews; moringa tea'
      },
      tigernuts: {
        description: 'Cyperus esculentus; rich in oleic acid, iron, magnesium, vitamins E and C',
        beauty: 'Prebiotic fiber for gut-skin axis; iron for skin cell oxygenation',
        tradition: 'Chufa milk traditional in Nigeria; popular snack across West Africa'
      },
      fermentedFoods: {
        examples: ['Ogi/akamu (fermented cornmeal porridge)', 'Dawadawa (locust bean)', 'Ogiri (fermented sesame or melon seeds)', 'Fufu (fermented cassava)'],
        beauty: 'Probiotic content supports gut-skin axis; dawadawa contains bioactive peptides'
      },
      darkLeafy: {
        examples: 'Ugwu (fluted pumpkin leaves), water leaf, bitter leaf, ewedu, jute leaves',
        beauty: 'Extremely high iron, folate, vitamin C, K; essential for skin health; traditional West African cooking base'
      }
    },

    beautyFoods: ['Red palm oil (carotenoids)', 'Moringa', 'Tiger nuts', 'Baobab fruit (vitamin C superhero)', 'Egusi seeds (zinc, healthy fats)', 'Stockfish (omega-3)', 'Jute leaves (mulukhiyah)'],

    dietaryTips: {
      vitaminC: 'Baobab fruit powder has extraordinary vitamin C content (10x orange); add to smoothies for collagen support',
      omega3: 'Mackerel, herring, sardines central to West African coastal diets — maintain this even in diaspora for skin anti-inflammation',
      palmOil: 'Keep red palm oil in diet (not refined) — the carotenoids and vitamin E tocotrienols are powerful skin antioxidants',
      zinc: 'Egusi (melon seed) is excellent zinc source; maintain traditional egusi soup for skin benefits'
    },

    supplements: ['Vitamin D (critical for dark skin in northern climates)', 'Omega-3 (if fish intake decreases in diaspora)', 'Zinc (if egusi/seafood reduced)'],

    advice: `West African traditional cuisine is extraordinarily well-suited for skin health. Red palm oil contains
    more carotenoids than almost any other food; ugwu and other dark leafy greens rival any Western superfood;
    stockfish and fresh fish provide omega-3s. The danger in diaspora is shifting away from these traditional
    foods toward processed Western foods — higher glycemic index, lower antioxidants, less omega-3.
    Maintaining traditional West African cuisine is literally maintaining skin health.`
  },

  'south-asian': {
    communityName: 'South Asian',
    dietaryProfile: 'Varied by region; Ayurvedic food traditions; spice-rich; largely vegetarian in many communities; dal, rice, vegetables, yogurt base',

    beautySuperfoods: {
      turmeric: {
        description: 'Curcuma longa; 3-5% curcumin content; used daily in Indian cooking for millennia',
        beauty: 'Curcumin is potent anti-inflammatory; inhibits NF-kB pathway; reduces acne, eczema, and PIH systemically',
        bioavailability: 'Curcumin poorly absorbed alone; piperine (black pepper) increases absorption 2000%; fat-soluble so consume with fat',
        traditional: 'Haldi doodh (turmeric milk/golden milk) consumed as immune tonic; daily use in curries'
      },
      amla: {
        description: 'Indian gooseberry (Phyllanthus emblica); extraordinarily high vitamin C (~600mg/100g vs orange\'s 53mg)',
        beauty: 'Collagen synthesis cofactor (vitamin C); antioxidant; hair growth; traditional Ayurvedic rasayana',
        consumption: 'Amla powder, amla juice, amla candy (murabba); Chyawanprash (amla + herbs + honey)'
      },
      ghee: {
        description: 'Clarified butter; rich in fat-soluble vitamins A, D, E, K; butyric acid',
        beauty: 'Ayurveda calls ghee skin tonic; fat-soluble vitamin delivery; butyric acid feeds gut epithelium (gut-skin axis)',
        use: 'Small amounts daily in Ayurvedic tradition; also applied topically for dry skin, cracked heels'
      },
      fenugreek: {
        description: 'Trigonella foenum-graecum; rich in zinc, iron, protein, fiber; soluble fiber',
        beauty: 'Zinc for acne; iron for skin oxygenation; anti-inflammatory flavonoids; blood sugar regulation reduces acne',
        tradition: 'Methi (fenugreek) seeds soaked overnight; consumed for hair growth; used in cooking'
      },
      ashwagandha: {
        description: 'Withania somnifera; adaptogenic herb; reduces cortisol',
        beauty: 'Cortisol reduction → improved skin barrier; anti-inflammatory; anti-aging',
        evidence: 'Multiple RCTs: ashwagandha reduces cortisol 14-27%; indirect skin benefit'
      }
    },

    beautyFoods: ['Turmeric (curcumin)', 'Amla (vitamin C powerhouse)', 'Ghee', 'Fenugreek', 'Lentils (dal — zinc, iron)', 'Sesame (calcium, zinc, B vitamins)', 'Yogurt (probiotics)', 'Ashwagandha'],

    dietaryTips: {
      goldenMilk: 'Haldi doodh (turmeric + milk + black pepper + ghee) daily for systemic anti-inflammation',
      amla: 'Add amla powder to smoothie daily; extraordinary collagen support from vitamin C load',
      spices: 'Maintain full spice use in cooking — cardamom, cloves, ginger, cinnamon are all antioxidant-rich',
      vegetarian: 'Vegetarian South Asian diet may need supplemental zinc, omega-3, vitamin B12, iron'
    },

    supplements: ['Vitamin D (essential for dark skin in northern climates)', 'B12 (if vegetarian/vegan)', 'Iron (women particularly; plant sources less bioavailable)', 'Omega-3 from algae (if vegetarian)'],

    advice: `South Asian cuisine is medicine. Turmeric consumed daily in cooking delivers consistent low-dose
    curcumin for systemic anti-inflammation — this is why studies show South Asian populations have lower
    rates of certain inflammatory conditions. The combination of yogurt (probiotic) + fenugreek (prebiotic)
    + turmeric (anti-inflammatory) in a single meal is a skin-health trifecta. Amla is criminally underused
    outside South Asian communities — 600mg vitamin C per 100g is extraordinary for collagen support.`
  },

  caribbean: {
    communityName: 'Caribbean',
    dietaryProfile: 'Tropical fruits, root vegetables (yams, sweet potato, dasheen/taro, cassava), seafood, jerk spices, coconut, rice and peas',

    beautySuperfoods: {
      guava: {
        description: 'Psidium guajava; 228mg vitamin C per 100g (highest of all common fruits); also high in lycopene',
        beauty: 'Extraordinary collagen synthesis support; lycopene photoprotective; traditional Caribbean fruit',
        consumption: 'Fresh, guava juice, guava jam (jelly); widely available in Caribbean stores'
      },
      coconut: {
        description: 'Cocos nucifera; coconut water (electrolytes, cytokinins), coconut flesh (MCT fats), coconut oil',
        beauty: 'Coconut water hydration + electrolytes; cytokinins anti-aging (delaying cellular senescence); MCT fats for energy',
        consumption: 'Fresh coconut water; coconut milk in cooking; copious in Caribbean diet'
      },
      soursop: {
        description: 'Annona muricata; extraordinarily high in acetogenins; vitamin C; anti-inflammatory',
        beauty: 'Anti-inflammatory; antioxidant; traditional Caribbean medicine plant for skin conditions',
        consumption: 'Soursop juice, soursop leaves as tea; mortar and pestle fresh preparation traditional'
      },
      callaloo: {
        description: 'Amaranthus viridis or Xanthosoma brasiliense; similar to spinach; iron, calcium, vitamin C',
        beauty: 'Iron for skin oxygenation and collagen; vitamin C for absorption and synthesis; traditional Caribbean green',
        consumption: 'Callaloo soup; sautéed; with saltfish; central to Trinidadian and Jamaican cuisine'
      },
      seaMoss: {
        description: 'Chondrus crispus (Irish moss) or Gracilaria (sea moss); a source of minerals.',
        beauty: 'Collagen protein support; minerals for skin; iodine for thyroid (skin connection); Caribbean traditional',
        trend: 'Sea moss gel viral in Black wellness community; traditional Caribbean use predates trend',
        evidence: 'Mineral content real but varies by harvest; iodine can be high, so do not overdo it'
      }
    },

    beautyFoods: ['Guava (highest vitamin C fruit)', 'Sea moss', 'Callaloo', 'Soursop', 'Coconut', 'Yellow yam', 'Snapper/Mahi-Mahi (omega-3)', 'Scotch bonnet pepper (vitamin C)'],

    dietaryTips: {
      guava: 'Daily guava or guava juice for extraordinary vitamin C collagen support',
      seaMoss: 'Sea moss gel (2 tablespoons/day) provides mineral support; blend into smoothies',
      seafood: 'Caribbean seafood tradition (snapper, conch, mahi-mahi) provides excellent omega-3; maintain in diaspora',
      jerk: 'Jerk spices (allspice, scotch bonnet, thyme) are genuinely anti-inflammatory and antioxidant'
    },

    supplements: ['Vitamin D (dark skin in northern climates)', 'Sea moss gel as food supplement', 'Omega-3 if seafood intake decreases'],

    advice: `Caribbean cuisine has secret skin superpowers that are underappreciated globally. Guava has
    4x the vitamin C of orange — a single guava provides more than the daily collagen-synthesis requirement.
    Sea moss is legitimately mineral-rich and has been a Caribbean staple for generations before it went viral.
    Callaloo is nutritionally comparable to spinach but significantly tastier. The whole dietary pattern —
    fresh tropical fruits, root vegetables, fresh seafood — is profoundly skin-positive. The problem in
    diaspora is replacing these with fast food; the solution is maintaining traditional eating patterns.`
  },

  arab: {
    communityName: 'Arab / Middle Eastern',
    dietaryProfile: 'Mediterranean-adjacent; olive oil, legumes, whole grains, lamb, fish (coastal), dates, pomegranate, figs, herbs',

    beautySuperfoods: {
      pomegranate: {
        description: 'Punica granatum; punicalagins (highest antioxidant fruit); ellagic acid; anthocyanins',
        beauty: 'Strongest antioxidant food measured (ORAC score); inhibits matrix metalloproteinases (enzymes that degrade collagen); anti-aging',
        consumption: 'Fresh pomegranate seeds (arils); pomegranate juice; pomegranate molasses in cooking',
        tradition: 'Central to Middle Eastern cuisine and culture; symbol of fertility and abundance'
      },
      dates: {
        description: 'Phoenix dactylifera; iron, magnesium, potassium, vitamin B6, selenium, antioxidants',
        beauty: 'Iron for skin oxygenation; selenium antioxidant; B vitamins for cellular energy',
        consumption: 'Daily consumption traditional in Arab culture; Ramadan breaking fast with dates',
        varieties: 'Medjool, Deglet Noor, Ajwa (most antioxidant-rich)'
      },
      oliveOil: {
        description: 'Extra virgin; oleic acid (70-80%); polyphenols (oleocanthal is natural ibuprofen); vitamin E',
        beauty: 'Oleocanthal is anti-inflammatory (same pathway as ibuprofen); applied internally daily; also topically in hammam tradition',
        evidence: 'Mediterranean diet consistently linked to lower inflammatory skin conditions; olive oil central'
      },
      blackSeed: {
        description: 'Nigella sativa (habbatus sauda / kalonji); thymoquinone active compound',
        beauty: 'Anti-inflammatory; antioxidant; antifungal; Islamic prophetic medicine ("cure for everything except death")',
        evidence: 'Clinical trials show black seed oil reduces acne, eczema flares; thymoquinone is potently anti-inflammatory',
        consumption: 'Black seed oil capsules; add to honey or yogurt; seeds in bread and cooking'
      },
      zaatar: {
        description: 'Blend of thyme (Thymus vulgaris), sumac, sesame, salt; thyme is highest antioxidant herb',
        beauty: 'Thyme: extraordinarily antioxidant; antimicrobial (thymol); sumac: anthocyanins; sesame: minerals',
        consumption: 'Za\'atar with olive oil and bread is a daily Arab breakfast; powerful antioxidant start'
      }
    },

    beautyFoods: ['Pomegranate (most antioxidant fruit)', 'Dates (iron, selenium)', 'Extra virgin olive oil', 'Black seed (nigella sativa)', 'Za\'atar', 'Chickpeas (zinc)', 'Rose water (consumed in foods)', 'Figs (calcium, antioxidants)'],

    dietaryTips: {
      pomegranate: 'Daily pomegranate juice or seeds; highest antioxidant score of any fruit — genuine anti-aging food',
      blackSeed: 'Black seed oil or seeds daily; the prophetic medicine tradition is backed by modern research',
      mediterranean: 'Traditional Arab-Mediterranean diet pattern is among the most evidence-based for skin health globally',
      olive: 'Extra virgin olive oil on everything — the oleocanthal anti-inflammatory effect is cumulative'
    },

    supplements: ['Vitamin D (hijab wearing women especially; also dark skin in northern latitudes)', 'Omega-3 if fish intake reduced', 'Probiotic with Ramadan fasting changes to gut microbiome'],

    advice: `Arab cuisine contains some of the most powerful skin-protective foods on earth. Pomegranate has
    the highest ORAC (antioxidant) score of any commonly eaten fruit — and it\'s consumed daily in Arab
    culture. Black seed (nigella sativa) has extraordinary evidence: thymoquinone is more potently
    anti-inflammatory than many pharmaceutical compounds. The za\'atar + olive oil breakfast is antioxidant-loaded.
    Traditional Arab-Mediterranean dietary patterns are consistently associated with healthy aging, clear skin,
    and reduced inflammatory conditions in population studies.`
  },

  latina: {
    communityName: 'Latina / Hispanic',
    dietaryProfile: 'Diverse by country; common elements: beans, rice, corn, avocado, chiles, tropical fruits, plantain, tomatoes, fresh herbs (cilantro)',

    beautySuperfoods: {
      avocado: {
        description: 'Persea americana; monounsaturated fats (oleic acid); glutathione; vitamins C, E, K, B6; lutein',
        beauty: 'Oleic acid for skin barrier; glutathione (master antioxidant); lutein for photoprotection; biotin for keratin',
        consumption: 'Daily in many Latin American households; guacamole, sliced on dishes, in smoothies'
      },
      tomato: {
        description: 'Solanum lycopersicum; lycopene (cooked and processed tomatoes highest); vitamin C',
        beauty: 'Lycopene photoprotective (internal SPF effect); antioxidant; collagen-protective',
        latin: 'Cooked tomatoes (salsa, tomato base of most dishes) maximize lycopene bioavailability'
      },
      chilesPepper: {
        description: 'All species; capsaicin active; extraordinarily high vitamin C (especially red varieties)',
        beauty: 'Vitamin C for collagen; capsaicin boosts circulation; anti-inflammatory',
        vitaminC: 'Red chile pepper has 3x the vitamin C of orange per weight'
      },
      jicama: {
        description: 'Pachyrhizus erosus; prebiotic inulin fiber; vitamin C; low glycemic index',
        beauty: 'Prebiotic feeds beneficial gut bacteria (gut-skin axis); vitamin C for collagen; low GI reduces acne insulin spike',
        consumption: 'Sliced with lime and chile powder (traditional snack); in salads'
      },
      cacao: {
        description: 'Theobroma cacao; flavanols (epicatechin); high antioxidant; magnesium; iron',
        beauty: 'Flavanols improve skin hydration, thickness, smoothness; reduce UV-induced skin damage in RCTs',
        tradition: 'Cacao has 3,000-year-old history in Mesoamerica; used as beverage and food',
        note: 'Dark chocolate 70%+ for benefits; milk chocolate loses benefits with milk and low cacao content'
      }
    },

    beautyFoods: ['Avocado', 'Cooked tomatoes (lycopene)', 'Chile pepper (vitamin C)', 'Jicama (prebiotic)', 'Cacao (flavanols)', 'Beans (zinc, iron, fiber)', 'Cilantro (detox)', 'Papaya (vitamin C + papain enzyme)'],

    dietaryTips: {
      avocado: 'Daily avocado — the oleic acid supports skin barrier and the glutathione is genuinely anti-aging',
      beans: 'Bean consumption strongly associated with healthy skin in population studies; Mexican rice and beans is nutritionally excellent',
      lowGI: 'Traditional Latin food (beans, corn, vegetables) is lower GI than Americanized Latin fast food; the shift causes acne',
      cacao: 'Drink traditional cacao (not hot chocolate with sugar) for flavanol skin benefits; abuelita\'s dark Mexican chocolate'
    },

    supplements: ['Vitamin D (lighter-skinned Latinas rarely deficient but darker-skinned need supplement)', 'Iron (common deficiency in women)'],

    advice: `Traditional Latin American cuisine is extraordinarily skin-positive. The avocado-tomato-chile pepper
    combination in a single salsa or guacamole with chips delivers: skin-barrier fats (avocado), lycopene
    photoprotection (cooked tomato), extraordinary vitamin C (chile), and prebiotic fiber (jicama if added).
    The biggest skin risk for Latinas in the US is the transition from traditional home cooking to processed
    and fast foods — high-GI, low-antioxidant eating causes acne, dulls skin, and accelerates aging.
    Traditional eating = skin medicine.`
  },

  'east-asian': {
    communityName: 'East Asian',
    dietaryProfile: 'Rice-based, fermented foods (miso, kimchi, doenjang), green tea, seaweed, fish, tofu, vegetables',

    beautySuperfoods: {
      greenTea: {
        description: 'Camellia sinensis; EGCG (epigallocatechin gallate); L-theanine; antioxidant',
        beauty: 'EGCG inhibits matrix metalloproteinases; photoprotective; anti-aging; anti-inflammatory; widely studied',
        evidence: 'Multiple human RCTs: green tea consumption reduces UV-induced skin damage; improves skin elasticity',
        consumption: 'Daily green tea consumption (3-5 cups) traditional in Japan, Korea, China',
        matcha: 'Matcha (ground green tea) has 137x EGCG of brewed tea; most potent form'
      },
      kimchi: {
        description: 'Korean fermented vegetables (Brassica rapa, napa cabbage); lactic acid bacteria; vitamin C, K',
        beauty: 'Probiotic (Lactobacillus kimchi) for gut-skin axis; capsaicin anti-inflammatory; vitamin C for collagen',
        science: 'Korean study: regular kimchi consumption associated with clearer skin; gut microbiome benefit'
      },
      miso: {
        description: 'Fermented soybean paste; probiotics; isoflavones; zinc; vitamin B12 (rare in plant foods)',
        beauty: 'Isoflavones (phytoestrogens) support collagen in peri-menopausal women; probiotics; complete protein',
        evidence: 'Japanese women\'s skin elasticity studies associated with soy isoflavone consumption'
      },
      seaweed: {
        description: 'Nori, wakame, kombu; iodine (thyroid support); fucoidans; minerals; omega-3 from algae',
        beauty: 'Iodine for thyroid (skin, hair, nail health dependent on thyroid); fucoidans anti-aging; unique ocean minerals',
        consumption: 'Daily in Japanese diet; soups, salads, rice wraps; miso soup with wakame'
      },
      collagenFoods: {
        description: 'East Asian cooking rich in collagen-supporting foods: bone broth, fish head soup, pig trotters, chicken feet',
        tradition: 'These "nose-to-tail" eating traditions that the West is rediscovering are standard East Asian cooking',
        beauty: 'Glycine and proline-rich; support body\'s collagen production; Japanese beauty nutrition traditional'
      }
    },

    beautyFoods: ['Green tea/matcha (EGCG)', 'Kimchi (probiotics)', 'Miso (isoflavones)', 'Seaweed', 'Salmon/mackerel (omega-3)', 'Tofu (isoflavones, zinc)', 'Rice water (inositol)', 'Bone broth (collagen precursors)'],

    dietaryTips: {
      greenTea: '3-5 cups daily; or 1 matcha daily; EGCG is one of the most evidence-based skin nutrients',
      fermented: 'Kimchi, miso, pickled vegetables daily — gut-skin axis support is powerful',
      collagen: 'Fish head soup, bone broth, chicken feet in cooking are traditional collagen-support foods; more effective than supplements',
      isoflavones: 'Tofu, edamame, miso daily for peri-menopausal skin support'
    },

    supplements: ['Vitamin D (desk work, sunscreen use, indoor culture; Asians may have lower D production even in sun due to behavior)', 'Collagen peptides if fish/bone broth intake is reduced'],

    advice: `East Asian dietary practices may be the single best-studied traditional diet for skin health.
    Green tea consumption (3-5 cups daily) has more evidence for photoprotection and anti-aging than most
    expensive skincare ingredients. The Japanese traditional diet — seaweed, miso, green tea, tofu, fish —
    is consistently associated with exceptional skin health outcomes in population studies. Korean kimchi
    fermentation creates Lactobacillus strains that are specifically being studied for acne reduction.
    This is not coincidental — this is dietary skin science practiced for thousands of years.`
  },

  'east-african': {
    communityName: 'East African',
    dietaryProfile: 'Teff, injera (fermented), lentils, chickpeas, berbere spice, lamb, fish (coastal), honey, fresh vegetables, moringa',

    beautySuperfoods: {
      teff: {
        description: 'Eragrostis tef; Ethiopian grain; iron (1 cup = 8mg), calcium (very high), resistant starch',
        beauty: 'Highest iron grain; critical for skin oxygenation and collagen; calcium; lower glycemic than refined grains',
        consumption: 'Injera (fermented teff flatbread) is Ethiopian/Eritrean dietary staple; consumed at virtually every meal'
      },
      injera: {
        description: 'Fermented teff flatbread; sourdough-like fermentation creates probiotics + increases mineral bioavailability',
        beauty: 'Fermentation reduces phytates (improves iron and zinc absorption); probiotic; base of gut-skin axis support',
        tradition: 'Communal injera eating from shared plate is central to Ethiopian and Eritrean social life'
      },
      berbere: {
        description: 'Ethiopian spice blend: chiles, fenugreek, ginger, coriander, turmeric, holy basil, korarima',
        beauty: 'Anti-inflammatory spice complex; vitamin C from chiles; fenugreek for zinc; ginger anti-inflammatory',
        consumption: 'Used in virtually all Ethiopian cooking; consistent anti-inflammatory spice exposure'
      },
      moringa: {
        description: 'Moringa oleifera (shisham); used across East Africa; all parts edible',
        beauty: 'Vitamin A, C, E, iron, zinc — comprehensive skin nutrition in single plant',
        consumption: 'Moringa leaves in soups and stews; moringa tea; moringa powder supplement'
      },
      honey: {
        description: 'Ethiopian honey (tej, Ethiopian honey wine) and raw honey traditions; propolis and royal jelly',
        beauty: 'Raw honey: antioxidant; antimicrobial (H2O2 + defensin-1 + methylglyoxal); prebiotic',
        tradition: 'Ethiopia is major honey producer; honey central to diet and medicine'
      }
    },

    beautyFoods: ['Teff (iron powerhouse)', 'Fermented injera (gut health)', 'Berbere spice complex (anti-inflammatory)', 'Moringa', 'Honey', 'Lentils (zinc, iron)', 'Fish (coastal — omega-3)', 'Chickpeas (zinc)'],

    dietaryTips: {
      teff: 'Maintain teff/injera consumption — one of the best iron foods available; critical for skin health',
      spices: 'Berbere is an anti-inflammatory powerhouse; the cumulative effect of daily spice use is significant',
      moringa: 'Add moringa powder to smoothies or tea if whole leaf not available; exceptional nutrient density',
      lentils: 'Ethiopian/Eritrean lentil stews (mesir wat) are zinc and iron-dense; maintain in diaspora'
    },

    supplements: ['Vitamin D (critical for very dark skin in northern climates)', 'Iron (if injera reduced and lentil consumption drops in diaspora)', 'Omega-3 if coastal fish diet shifts inland in diaspora'],

    advice: `East African traditional cuisine is exceptional for skin. Teff is one of the most iron-dense grains
    available, and iron is fundamental to collagen synthesis and skin cell oxygenation. The berbere spice
    tradition delivers consistent anti-inflammatory compounds at every meal. Injera fermentation — like
    sourdough — increases mineral bioavailability and provides gut-supporting microorganisms. The risk in
    diaspora: replacing injera with processed bread loses the fermentation benefit, iron, and mineral density.
    Traditional East African eating patterns support remarkably healthy skin.`
  },

  'south-african': {
    communityName: 'South African',
    dietaryProfile: 'Diverse; South African Black traditional (umngqusho, morogo, samp and beans); Cape Malay spiced (bobotie); Afrikaner (braai culture); Indian-South African (durban curry)',

    beautySuperfoods: {
      rooibos: {
        description: 'Aspalathus linearis; unique to Cederberg mountains; zero caffeine; aspalathin (unique antioxidant); nothofagin',
        beauty: 'Aspalathin found nowhere else in nature; anti-inflammatory; antioxidant; antidiabetic properties; safe for pregnancy and children',
        consumption: 'South Africa\'s iconic tea; drink 4-6 cups daily for maximum benefit',
        evidence: 'Multiple South African studies: rooibos reduces inflammatory markers; skin anti-aging effects'
      },
      marula: {
        description: 'Sclerocarya birrea fruit; 8x more vitamin C than orange; oleic acid-rich oil',
        beauty: 'Extraordinary vitamin C for collagen; marula fruit juice traditional South African beverage; animals seek marula fruit',
        consumption: 'Marula juice; marula jam; marula beer (traditional); marula oil used topically'
      },
      umngqusho: {
        description: 'South African dish of samp (dried corn) and beans; Nelson Mandela\'s favorite food',
        beauty: 'Complete protein; zinc from beans; resistant starch prebiotic; traditional Xhosa dish',
        consumption: 'Slow-cooked samp and beans; foundation of traditional Xhosa, Zulu, Sotho diets'
      },
      morogo: {
        description: 'Wild African spinach (Amaranthus hybridus and related); iron, calcium, vitamin C',
        beauty: 'Traditional South African indigenous leafy green; nutritional profile similar to or better than spinach',
        consumption: 'Traditionally gathered and cooked; increasingly farmed; important traditional food'
      },
      durbanCurry: {
        description: 'South African Indian cuisine influence; turmeric, fenugreek, coriander, cumin, chiles',
        beauty: 'Turmeric anti-inflammatory; fenugreek zinc; chile vitamin C; cumulative spice anti-inflammatory effect',
        tradition: 'Indian-South African community (1860 indenture origins) created unique Durban curry tradition'
      }
    },

    beautyFoods: ['Rooibos tea', 'Marula fruit', 'Samp and beans (umngqusho)', 'Morogo (wild greens)', 'Maize meal (source of magnesium)', 'Braai fish (omega-3 — if coastal)'],

    dietaryTips: {
      rooibos: 'South Africa\'s gift to the world — drink 4-6 cups daily; the aspalathin content is unique to this plant',
      traditional: 'Traditional Black South African diet (samp, beans, morogo, maize) is nutritionally excellent; modern fast food is not',
      marula: 'Marula fruit juice is extraordinary vitamin C source if available; marula oil topically regardless',
      spicy: 'Durban curry traditions deliver same anti-inflammatory spice benefits as Indian cuisine — embrace both'
    },

    supplements: ['Vitamin D (essential for darker South African skin; also lighter-skinned given high SPF use needed)', 'Omega-3 if deep inland with no fish access'],

    advice: `South African cuisine spans a remarkable diversity of traditions, and the traditional Black South African
    diet is genuinely nutritious for skin. Rooibos is South Africa\'s globally recognized gift — the only source
    of aspalathin, a unique antioxidant with exceptional anti-inflammatory properties. Marula fruit has 8x the
    vitamin C of orange. Traditional umngqusho (samp and beans) is a complete protein with excellent zinc for
    acne prevention. The shift toward Western fast food in urban South Africa is driving the same inflammatory
    skin conditions now common worldwide — returning to traditional eating patterns is returning to skin health.`
  },

  'black-american': {
    communityName: 'Black American',
    dietaryProfile: 'Southern food tradition; evolved from West African foodways through slavery and freedom; soul food; Gullah-Geechee tradition; modern natural food movement',

    beautySuperfoods: {
      watermelon: {
        description: 'Citrullus lanatus; lycopene (92% water content; 6-9mg lycopene per 2 cups); citrulline amino acid; vitamin C',
        beauty: 'Lycopene photoprotective; citrulline supports circulation; cultural icon in Black American food tradition',
        lycopene: 'Watermelon has higher lycopene than tomato per serving; excellent summer skin protection food',
        tradition: 'Deep cultural roots in Black American food culture despite racist stereotype weaponization'
      },
      sweetPotato: {
        description: 'Ipomoea batatas; beta-carotene (highest vegetable source); vitamin C, E; potassium; fiber',
        beauty: 'Beta-carotene photoprotective; antioxidant; anti-aging; sweet potato pie and candied yams are soul food staples',
        consumption: 'Sweet potato pie, candied yams; traditional Thanksgiving and soul food cornerstone'
      },
      blackEyedPeas: {
        description: 'Vigna unguiculata; iron, zinc, folate, protein, fiber; Hoppin\' John tradition',
        beauty: 'Zinc for acne; iron for skin oxygenation; folate for cellular repair; prebiotic fiber',
        tradition: 'New Year\'s Hoppin\' John (black-eyed peas + rice); soul food staple; West African origin food'
      },
      okra: {
        description: 'Abelmoschus esculentus; soluble fiber (mucilage); vitamins C and K; magnesium; antioxidants',
        beauty: 'Soluble fiber feeds gut bacteria (gut-skin axis); vitamin C for collagen; West African origin (transported during slave trade)',
        tradition: 'Okra (gumbo) central to Gullah-Geechee cuisine; shows African food retention through slavery'
      },
      blackberry: {
        description: 'Rubus species; anthocyanins (highest of any berry); vitamin C; ellagitannins',
        beauty: 'Anthocyanins (most anti-aging polyphenols per weight of any berry); vitamin C; gut-skin prebiotics',
        access: 'Food desert issue in Black American communities affects access to fresh produce; systemic challenge'
      }
    },

    beautyFoods: ['Watermelon (lycopene)', 'Sweet potato (beta-carotene)', 'Black-eyed peas (zinc, iron)', 'Okra (gut health)', 'Collard greens (iron, calcium, vitamin C)', 'Catfish (omega-3)', 'Blueberries/blackberries (anthocyanins)'],

    dietaryTips: {
      soulFood: 'Traditional soul food (collard greens, black-eyed peas, sweet potato, okra) is nutritionally excellent; it\'s the frying and salt that can be problematic',
      collards: 'Collard greens cooked with pot likker (cooking liquid) contains vitamin K, iron, calcium; cruciferous detox',
      watermelon: 'Summer watermelon is genuinely photoprotective through lycopene; enjoy without guilt',
      modernMovement: 'Black natural food and wellness movement reconnecting community to traditional plant-based eating; Dr. Sebi tradition, plant-based soul food'
    },

    supplements: ['Vitamin D (CRITICAL for deep skin tones; severe deficiency epidemic in Black Americans especially in northern states)', 'Omega-3 (if catfish and other fish intake low)', 'Iron (women; higher rates of deficiency)', 'Zinc (if processed food replacing whole food diet)'],

    advice: `Soul food at its root is African food adapted under slavery and then evolved over generations —
    and it contains remarkable beauty nutrition. Collard greens have more calcium than milk and more vitamin K
    than almost any vegetable. Black-eyed peas provide complete zinc for acne prevention. Sweet potato provides
    more beta-carotene than almost any other food. Watermelon\'s lycopene content means it\'s literally
    summer photoprotection in fruit form. The challenge in modern times: food deserts in Black American
    communities create access barriers to fresh produce; this is a systemic injustice with direct skin health
    consequences. Where access exists, traditional soul food ingredients are skin powerhouses.
    Vitamin D supplementation (2000-4000 IU D3) is arguably the single most impactful health intervention
    for dark-skinned individuals in northern climates.`
  }
};

// ============================================================
// HELPER FUNCTION
// ============================================================

export function getNutritionBeautyGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_NUTRITION_BEAUTY_GUIDES['west-african'],
    'south-asian': ETHNIC_NUTRITION_BEAUTY_GUIDES['south-asian'],
    'caribbean': ETHNIC_NUTRITION_BEAUTY_GUIDES['caribbean'],
    'arab': ETHNIC_NUTRITION_BEAUTY_GUIDES['arab'],
    'latina': ETHNIC_NUTRITION_BEAUTY_GUIDES['latina'],
    'east-asian': ETHNIC_NUTRITION_BEAUTY_GUIDES['east-asian'],
    'east-african': ETHNIC_NUTRITION_BEAUTY_GUIDES['east-african'],
    'south-african': ETHNIC_NUTRITION_BEAUTY_GUIDES['south-african'],
    'black-american': ETHNIC_NUTRITION_BEAUTY_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

// ============================================================
// STATS
// ============================================================

export const NUTRITION_BEAUTY_STATS = {
  moduleId: 'nutrition_beauty_ethnic_guide',
  version: '1.0.0',
  communities: 9,
  nutrientsProfiled: 15,
  keyFacts: [
    'Amla (Indian gooseberry) contains ~600mg vitamin C per 100g — 10x more than orange',
    'Guava has 228mg vitamin C per 100g — the highest of all common fruits',
    'Red palm oil is the highest plant source of carotenoids including beta-carotene',
    'Pomegranate has the highest ORAC (antioxidant) score of any commonly eaten fruit',
    'Green tea EGCG in 3-5 cups daily has clinical evidence for photoprotection and anti-aging',
    'Vitamin D deficiency is epidemic in dark-skinned individuals in northern latitudes — supplementation critical',
    'Curcumin (turmeric) bioavailability increases 2000% when combined with piperine (black pepper)',
    'High glycemic diet drives insulin/IGF-1 pathway → sebum → acne; low GI reduces acne severity in RCTs',
    'Watermelon lycopene is higher per serving than tomato and provides measurable photoprotection',
    'Teff grain contains 8mg iron per cup — one of the highest iron foods available',
    'Rooibos aspalathin is found ONLY in the rooibos plant — unique to South Africa\'s Cederberg mountains',
    'Collagen peptide supplementation 2.5-5g/day improved skin hydration and elasticity in multiple RCTs'
  ],
  lastUpdated: '2026-10-29'
};
