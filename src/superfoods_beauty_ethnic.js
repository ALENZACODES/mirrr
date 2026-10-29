/**
 * MIRRR — Superfoods and Beauty Guide (Ethnic Focus)
 * Nutrition for skin and hair, ethnic superfoods, evidence-based claims.
 */

export const SUPERFOOD_SCIENCE = {
  title: 'Superfoods and Skin — What the Evidence Actually Says',
  overview: '"Superfood" is a marketing term, not a scientific classification; however, many foods labelled as superfoods genuinely contain high concentrations of bioactive compounds with evidence-backed benefits for skin and hair; the key is understanding which claims are well-supported vs which are marketing exaggeration',
  evidence_tiers: {
    strong: 'Foods with strong evidence for skin benefits: fatty fish (omega-3 — multiple RCTs); green tea (EGCG — multiple RCTs and mechanistic studies); tomatoes (lycopene — UV protection evidence); colourful vegetables (carotenoids — skin tone and UV protection evidence); berries (anthocyanins — antioxidant; some skin studies)',
    moderate: 'Moderate evidence: dark chocolate/cacao (flavanols — vasodilation, hydration in small studies); avocado (monounsaturated fat, vitamin E — skin elasticity study 2023); fermented foods (probiotics — gut-skin axis; indirect evidence)',
    limited: 'Limited/weak evidence for many "superfood" skin claims: coconut water (hydration claim — not better than water); detox teas (no toxin removal through diet); collagen foods (cooking destroys collagen; body digests collagen as amino acids anyway — though collagen hydrolysate supplements have separate evidence)',
    collagen: 'Collagen as a food vs supplement distinction: eating collagen-rich foods (bone broth, pigs\' feet, tendon) provides amino acids (glycine, proline, hydroxyproline) that the body uses as building blocks; collagen hydrolysate supplements (small peptides) have evidence for stimulating fibroblast collagen production through a different mechanism — absorption and receptor signalling; both provide amino acid building blocks but the supplement evidence is more specific'
  }
};

export const WEST_AFRICAN_SUPERFOODS = {
  community: 'West African',
  foods: {
    moringa: {
      name: 'Moringa (Moringa oleifera)',
      localNames: 'Ewe ile (Yoruba); Zogale (Hausa); Drumstick tree',
      nutrients: 'Gram for gram: 7× more vitamin C than oranges; 4× more vitamin A than carrots; 4× more calcium than milk; 2× more protein than yoghurt; significant iron, potassium, and B vitamins',
      skin: 'Vitamin C supports collagen synthesis; vitamin A (as beta-carotene) for skin cell turnover; antioxidants protect against UV oxidative damage; anti-inflammatory compounds in moringa (isothiocyanates) address inflammatory skin conditions',
      evidence: 'Moringa is genuinely among the most nutrient-dense plants studied; the nutrient density claims are lab-verified; evidence for direct skin improvement from moringa supplementation is primarily observational and mechanistic rather than large RCTs; still one of the most legitimately evidence-supported "superfoods"',
      use: 'Moringa leaf powder added to smoothies, soups, or rice; moringa oil (ben oil — from seeds) for topical use; moringa capsules as a supplement'
    },
    baobab: {
      name: 'Baobab (Adansonia digitata)',
      localNames: 'Ose (Yoruba); Kuka (Hausa); Monkey bread tree fruit powder',
      nutrients: 'Baobab fruit powder: highest vitamin C of any plant food by weight (approximately 500mg per 100g — 6× more than oranges); high calcium; prebiotic fibre; antioxidants',
      skin: 'Extreme vitamin C content supports collagen synthesis; antioxidant protection; baobab oil (from seeds) is high in linoleic acid and vitamin E for topical skin moisturising',
      use: 'Baobab fruit powder mixed into water or smoothies; baobab oil applied topically to skin and hair (lightweight, non-greasy)'
    },
    tigerNuts: {
      name: 'Tiger Nuts (Cyperus esculentus)',
      localNames: 'Aya (Hausa); Ofio (Yoruba); Earth almond; Chufa',
      nutrients: 'High fibre; resistant starch (prebiotic); monounsaturated fats; vitamin E; oleic acid content similar to olive oil',
      skin: 'Prebiotic fibre supports gut microbiome health (gut-skin axis); vitamin E antioxidant; the Spanish horchata drink is made from tiger nuts and has been consumed for centuries',
      use: 'Eaten raw or roasted as a snack; tiger nut milk (horchata de chufa); tiger nut flour in cooking'
    },
    egusi: {
      name: 'Egusi Seeds (Citrullus lanatus var.)',
      nutrients: 'High in protein; zinc (important for collagen synthesis and acne management); vitamin E; essential fatty acids; magnesium',
      skin: 'Zinc is directly relevant to skin health: involved in collagen synthesis; wound healing; anti-inflammatory processes; some evidence for zinc supplementation in acne management; egusi provides a culturally embedded zinc-rich food in West African diets',
      use: 'Egusi soup (a staple Nigerian dish); egusi seeds roasted as a snack'
    }
  }
};

export const SOUTH_ASIAN_SUPERFOODS = {
  community: 'South Asian',
  foods: {
    turmeric: {
      name: 'Turmeric (Curcuma longa)',
      localNames: 'Haldi (Hindi/Urdu); Manjal (Tamil); Pasupu (Telugu)',
      activeCompound: 'Curcumin is the primary bioactive compound in turmeric (2-5% of turmeric by weight); responsible for the characteristic yellow colour',
      evidence: {
        antiInflammatory: 'Curcumin inhibits multiple inflammatory pathways (NF-κB, COX-2, 5-LOX); hundreds of in-vitro and animal studies; multiple human studies showing anti-inflammatory effects in conditions including osteoarthritis, inflammatory bowel disease, and metabolic syndrome; the evidence base is substantial though study quality is variable',
        bioavailability: 'Critical limitation: curcumin is poorly absorbed from the gut; standard turmeric consumption provides only a tiny fraction of curcumin that reaches the bloodstream; piperine (from black pepper) increases curcumin bioavailability by approximately 2000% — this is why the traditional combination of haldi (turmeric) and kali mirch (black pepper) in cooking makes nutritional sense; novel formulations (liposomal curcumin; BCM-95) significantly improve absorption',
        skin: 'Topical curcumin: anti-inflammatory; inhibits tyrosinase (melanin-producing enzyme); wound healing enhancement; some evidence for psoriasis and acne improvement topically'
      }
    },
    amla: {
      name: 'Amla / Indian Gooseberry (Phyllanthus emblica)',
      localNames: 'Amla (Hindi); Nellikai (Tamil); Avalo (Gujarati)',
      vitamin_c: 'One of the richest food sources of vitamin C; approximately 600-700mg per 100g of fresh fruit; the vitamin C is unusually heat-stable because it is bound to tannins and polyphenols rather than existing as free ascorbic acid',
      skin: 'High vitamin C content directly supports collagen synthesis; powerful antioxidant protection; anti-inflammatory; evidence for amla supplementation improving skin elasticity and reducing oxidative stress markers in human studies',
      use: 'Amla juice (consumed daily as a wellness tonic in Ayurvedic practice); dried amla powder; amla candy (murabba); amla oil applied topically to hair'
    },
    fenugreek: {
      name: 'Fenugreek (Trigonella foenum-graecum)',
      localNames: 'Methi (Hindi/Urdu); Vendhayam (Tamil)',
      nutrients: 'Protein (including lysine and tryptophan); fibre; zinc; iron; B vitamins; diosgenin (a steroidal saponin with estrogen-like effects)',
      skin: 'Zinc in fenugreek supports collagen and wound healing; anti-inflammatory compounds; diosgenin may have mild anti-androgen effects (relevant to hormonal acne); fenugreek seed paste used topically in some Ayurvedic traditions as an anti-inflammatory skin treatment',
      use: 'Methi dishes (fenugreek leaves in saag methi); fenugreek seeds in spice blends (panch phoron, curry powder); sprouted fenugreek seeds; fenugreek seed paste for hair masks'
    },
    ashwagandha: {
      name: 'Ashwagandha (Withania somnifera)',
      localNames: 'Ashwagandha (Sanskrit/Hindi); Indian Winter Cherry; Indian Ginseng',
      mechanism: 'Classified as an adaptogen — a herb that helps the body adapt to stress by modulating the HPA (hypothalamic-pituitary-adrenal) axis; the primary active compounds are withanolides',
      evidence: 'Multiple RCTs (randomised controlled trials) demonstrate that ashwagandha supplementation (300-600mg of root extract daily) significantly reduces serum cortisol levels (by 20-30% in some studies); reduces self-reported stress and anxiety scores; improves sleep quality; the cortisol-reducing effect has direct relevance to skin (cortisol breaks down collagen; stress acne; barrier disruption)',
      skin: 'Cortisol reduction → less collagen breakdown → slower skin ageing; improved sleep → more growth hormone → better skin repair; reduced stress → fewer inflammatory skin condition flares; indirect but mechanistically sound skin benefits'
    }
  }
};

export const CARIBBEAN_SUPERFOODS = {
  community: 'Caribbean',
  foods: {
    guava: {
      name: 'Guava (Psidium guajava)',
      nutrients: 'Pink/red guava: among the richest food sources of vitamin C (228mg per 100g — approximately 5× more than a medium orange); lycopene (in pink flesh — the same antioxidant in tomatoes, with evidence for UV protection); vitamin A; potassium',
      skin: 'Vitamin C for collagen synthesis; lycopene provides mild internal UV protection (reduces UV-induced oxidative damage; does not replace sunscreen); antioxidant protection against environmental skin damage',
      availability: 'Guava is a staple fruit throughout the Caribbean; consumed fresh, as juice (guava juice/nectar), in preserves (guava jelly, guava paste/guayaba), and in cooking'
    },
    soursop: {
      name: 'Soursop (Annona muricata)',
      localNames: 'Graviola; Guanábana (Spanish Caribbean); Corossol (French Caribbean)',
      nutrients: 'Vitamin C; B vitamins (B1, B2, B3); folate; magnesium; potassium; acetogenins (the unique bioactive compounds)',
      evidence: 'Soursop has been heavily marketed as a cancer cure — this is not evidence-based for human cancer treatment; the acetogenins have shown cytotoxic effects in lab settings but the translation to human cancer treatment has not been demonstrated in clinical trials; soursop is a nutritious fruit with genuine antioxidant and anti-inflammatory properties but extreme claims should be viewed with healthy scepticism',
      skin: 'Vitamin C content; anti-inflammatory properties; the fruit is genuinely nutritious without the exaggerated claims'
    },
    seaMoss: {
      name: 'Sea Moss (Chondrus crispus / Gracilaria)',
      nutrients: 'Iodine (thyroid support); carrageenan (the polysaccharide that forms the gel); minerals including calcium, potassium, magnesium, zinc; amino acids',
      skin: 'Iodine supports thyroid function (thyroid hormones affect skin health); zinc supports collagen and wound healing; the carrageenan gel provides topical moisturising and film-forming properties',
      evidence: 'Many specific skin and health claims for sea moss are not well-supported by clinical evidence; the minerals and iodine are real but not in uniquely high concentrations vs other foods; the cultural significance in Caribbean wellness communities is real and the nutritional content is genuine if less extraordinary than marketed',
      topical: 'Sea moss gel applied topically: provides a temporary moisturising and film-forming effect from carrageenan; mild hydration; widely used in Caribbean community natural skincare'
    }
  }
};

export const ARAB_SUPERFOODS = {
  community: 'Arab',
  foods: {
    dates: {
      name: 'Medjool and Deglet Nour Dates (Phoenix dactylifera)',
      nutrients: 'Natural sugars (glucose, fructose, sucrose); fibre; potassium; magnesium; copper; vitamin B6; iron; antioxidants (flavonoids, carotenoids, phenolic acid)',
      skin: 'Antioxidant flavonoids protect against oxidative damage; copper is required for collagen cross-linking (an essential post-synthesis step); iron supports overall cellular health; the fibre feeds beneficial gut bacteria (gut-skin axis)',
      cultural: 'Dates are one of the most culturally significant foods in Arab culture; the palm date features prominently in Islamic dietary tradition; Ramadan fast is traditionally broken with dates and water; date palms are a symbol of Arab identity across the Gulf and North Africa',
      glycaemic: 'Note: dates have a high sugar content and a moderate-high glycaemic index; for those managing acne through low-glycaemic diet, dates should be consumed in moderation'
    },
    blackSeed: {
      name: 'Black Seed / Nigella sativa',
      localNames: 'Habbatus Sauda (Arabic); Kalonji (South Asian); Black cumin',
      activeCompound: 'Thymoquinone is the primary active compound in black seed oil; responsible for most documented biological effects',
      evidence: {
        antiInflammatory: 'Multiple clinical studies demonstrate anti-inflammatory effects from black seed supplementation; measured reductions in inflammatory markers (CRP, IL-6, TNF-α)',
        skin: 'Several small RCTs show benefit in atopic dermatitis (eczema); some studies show reduction in acne lesion count; anti-inflammatory mechanism relevant to multiple skin conditions; the evidence is promising though studies are generally small',
        cultural: 'The hadith reference ("black seed is a cure for everything except death") gives black seed profound cultural and religious significance across all Muslim communities; it is consumed daily in many Arab and Muslim South Asian households as a religious and health practice'
      }
    },
    oliveOil: {
      name: 'Extra Virgin Olive Oil (Zait al-Zaytun)',
      nutrients: 'Oleocanthal (natural anti-inflammatory with COX-inhibiting mechanism similar to ibuprofen); hydroxytyrosol (one of the most potent natural antioxidants known); squalene (a skin-identical lipid); oleic acid (monounsaturated); vitamin E; polyphenols',
      skin: 'Internal consumption: anti-inflammatory oleocanthal; antioxidant protection; the Mediterranean diet (centred on EVOO) is associated with reduced inflammatory skin conditions in population studies; topical use: the high squalene content makes EVOO unusually well-suited for skin — squalene is a lipid naturally produced by skin and is deeply compatible; traditional Arab soap (aleppo soap) uses EVOO as the primary oil',
      evidence: 'EVOO has among the strongest dietary evidence for anti-inflammatory effects of any commonly consumed food; the oleocanthal mechanism is well-characterised biochemically'
    }
  }
};

export const LATINA_SUPERFOODS = {
  community: 'Latina/Latin American',
  foods: {
    avocado: {
      name: 'Avocado (Persea americana)',
      localNames: 'Aguacate (Spanish); Abacate (Portuguese/Brazilian)',
      nutrients: 'Monounsaturated fat (oleic acid — skin barrier component); vitamin E (α-tocopherol — antioxidant); vitamin C; potassium; folate; lutein and zeaxanthin (antioxidant carotenoids); squalene',
      skin: 'A 2023 UCLA study found that eating one avocado daily for 16 weeks significantly improved skin elasticity and facial fat distribution in middle-aged women; oleic acid supports the skin lipid barrier; vitamin E is a fat-soluble antioxidant protecting against UV oxidative damage; squalene is a skin-identical lipid with emollient properties',
      history: 'The avocado was domesticated in Mexico approximately 5000 years ago (likely in the Tehuacán Valley, Puebla); the Aztec and Maya civilisations used avocado both as food and medicinally; Mexico produces approximately 30% of the world\'s avocados (primarily in Michoacán)'
    },
    cacao: {
      name: 'Cacao / Dark Chocolate (Theobroma cacao)',
      localNames: 'Cacao (Spanish); the "food of the gods" — the botanical name Theobroma means "food of the gods" in Greek; cacao was used by the Aztecs and Maya as a ceremonial and medicinal food',
      nutrients: 'Flavanols (epicatechin, catechin — powerful antioxidants); theobromine (mild stimulant); iron; magnesium; zinc; copper',
      skin: 'A 2006 study (Journal of Nutrition) found that high-flavanol cocoa consumption for 12 weeks significantly improved skin texture, hydration, blood flow, and UV resistance vs low-flavanol cocoa; the flavanol mechanism involves improved microcirculation and antioxidant protection; dark chocolate (70%+ cacao) contains significantly more flavanols than milk chocolate',
      note: 'The skin benefits require high-flavanol dark chocolate; typical processed chocolate (milk chocolate, white chocolate) has minimal flavanol content due to processing that destroys flavanols; raw cacao powder has the highest flavanol content'
    },
    hibiscus: {
      name: 'Hibiscus / Jamaica Flower (Hibiscus sabdariffa)',
      localNames: 'Jamaica (pronounced ha-MY-ca in Mexico); Flor de Jamaica; Agua de Jamaica',
      nutrients: 'Vitamin C; anthocyanins (the pigments responsible for the deep red/purple colour — powerful antioxidants); hydroxycitric acid; quercetin',
      skin: 'High vitamin C content for collagen synthesis; anthocyanins are among the most potent natural antioxidants; anti-inflammatory; some evidence for mild anti-hypertensive effect (supporting circulation); the "flower of youth" traditional reputation for skin benefits has some biochemical basis',
      use: 'Agua de Jamaica (hibiscus flower water — a traditional Mexican drink); hibiscus tea; hibiscus supplement capsules; topical hibiscus extract in skincare products'
    },
    nopales: {
      name: 'Nopales (Prickly Pear Cactus Pads)',
      localNames: 'Nopales (Mexico); Tuna (the fruit); Opuntia',
      nutrients: 'Fibre; vitamin C; vitamin K; magnesium; calcium; betalains (unique pigments with antioxidant properties); quercetin',
      skin: 'Fibre supports gut microbiome (gut-skin axis); betalain antioxidants; the betalain pigments (betanin from red/purple varieties; indicaxanthin from yellow) are unusual antioxidants not commonly found in other plants; some evidence for anti-inflammatory effects',
      use: 'Nopales salad (cactus pad strips cooked with tomato, onion, and chilli); nopales in eggs (nopales con huevos); prickly pear fruit juice'
    }
  }
};

export const EAST_ASIAN_SUPERFOODS = {
  community: 'East Asian',
  foods: {
    greenTea: {
      name: 'Green Tea (Camellia sinensis)',
      varieties: 'Japanese: matcha (powdered whole leaf); sencha (most common green tea); gyokuro (shade-grown premium); Korean: nokcha; Chinese: longjing (Dragon Well); biluochun',
      activeCompound: 'EGCG (Epigallocatechin gallate) is the most studied catechin; green tea contains multiple catechins in addition to EGCG (EGC, ECG, EC)',
      skin: {
        evidence: 'Multiple clinical studies show: oral green tea supplementation (or 3+ cups daily) associated with improved skin quality in observational studies; EGCG protects against UV-induced oxidative damage (measured as reduced thymine dimer formation); anti-inflammatory pathway inhibition (inhibits NF-κB); some human studies show reduced sebum production from EGCG supplementation; topical EGCG reduces UV-induced erythema in human studies',
        mechanism: 'EGCG inhibits multiple pathways simultaneously: antioxidant (direct free radical scavenging); anti-inflammatory (NF-κB inhibition); anti-androgenic (inhibits 5α-reductase — the enzyme that converts testosterone to the more potent DHT that drives sebum and acne)'
      }
    },
    fermentedSoy: {
      name: 'Fermented Soy Products (Miso, Natto, Doenjang)',
      varieties: 'Japanese: miso (fermented soybean paste); natto (fermented soybeans with Bacillus subtilis); edamame (unfermented but nutritious); Korean: doenjang (soybean paste); gochujang (chilli soybean paste); Chinese: doubanjiang',
      nutrients: 'Isoflavones (genistein, daidzein — phytoestrogens with some oestrogen receptor activity); probiotics (fermented forms); vitamin K2 (natto — the richest food source); complete protein; zinc',
      skin: 'Isoflavones have mild oestrogen-like effects; oestrogen supports collagen synthesis and skin hydration — some studies show topical and oral soy isoflavones improve skin elasticity; probiotics support gut microbiome (gut-skin axis); vitamin K2 in natto may support skin health by reducing calcium deposition in elastin (which stiffens skin)'
    },
    seaweed: {
      name: 'Seaweed (Wakame, Nori, Kombu)',
      localNames: 'Wakame (undaria pinnatifida); Nori (porphyra); Konbu/Kombu (laminaria); Hijiki',
      nutrients: 'Iodine (thyroid support); fucoidan (a unique sulfated polysaccharide with anti-inflammatory and antioxidant properties found only in brown algae); minerals; carotenoids (fucoxanthin in brown algae — an unusual carotenoid); omega-3 ALA',
      skin: 'Fucoidan has anti-inflammatory and antioxidant properties; some evidence for collagen-protecting effects; iodine supports thyroid function (thyroid hormones affect skin quality); fucoxanthin is a carotenoid with novel metabolic effects (some evidence for fat metabolism and anti-inflammatory effects); topical fucoidan in skincare is used for skin hydration and anti-ageing'
    }
  }
};

export const EAST_AFRICAN_SUPERFOODS = {
  community: 'East African',
  foods: {
    teff: {
      name: 'Teff (Eragrostis tef)',
      origin: 'Teff is native to Ethiopia and Eritrea; one of the oldest cultivated crops in the world (estimated 6000+ years of cultivation in the Ethiopian highlands); the basis of injera, the fermented flatbread that is the foundation of Ethiopian cuisine',
      nutrients: 'More iron than other cereal grains (particularly white teff); complete amino acid profile; calcium; resistant starch; low glycaemic index; naturally gluten-free',
      skin: 'The low glycaemic index of teff is directly relevant to acne-prone skin (high-GI diets drive insulin/IGF-1 → sebum → acne); iron is important for hair health (iron deficiency causes telogen effluvium — diffuse hair shedding); the complete amino acid profile provides building blocks for collagen and keratin',
      injera: 'Injera is made by fermenting teff flour; the fermentation produces a naturally sour, probiotic flatbread; the probiotics from the fermentation process provide gut microbiome benefits (gut-skin axis); injera is served as both plate and utensil for Ethiopian meals'
    },
    berbere: {
      name: 'Berbere Spice Blend',
      components: 'Fenugreek; chilli peppers; coriander; korarima (Ethiopian cardamom); rue; ajwain; radhuni; nigella; and multiple other spices; each household and region has its own variation',
      nutrients: 'The combined bioactive compounds from multiple anti-inflammatory spices; capsaicin (from chilli); fenugreek saponins; coriander antioxidants; the spice blend provides a concentrated source of plant antioxidants and anti-inflammatory compounds',
      skin: 'The cumulative anti-inflammatory effect of consuming berbere regularly with meals; capsaicin at dietary levels has evidence for improved circulation; the antioxidant diversity from multiple plant sources'
    },
    coffeeFruit: {
      name: 'Coffee Fruit (Coffea arabica)',
      localNames: 'Buna (Ethiopian — the word for both coffee and the coffee ceremony); the coffee cherry/cascara',
      nutrients: 'The coffee bean (seed) is the most studied; the fruit/pulp (coffee cherry) is rich in chlorogenic acids (powerful antioxidants); the actual coffee beverage contains chlorogenic acids, caffeic acid, quinic acid, and multiple antioxidant polyphenols',
      skin: 'Chlorogenic acids are powerful antioxidants; some evidence for improved skin hydration and reduced roughness from chlorogenic acid supplementation; coffee cherry extract is used in premium anti-ageing skincare (Tata Harper, Youth to the People); anti-UV oxidative damage',
      ceremony: 'The Ethiopian coffee ceremony (buna ceremony) represents a holistic wellness experience: communal preparation; incense burning (frankincense); social connection (the ceremony takes hours and involves multiple rounds); the stress-reduction from the social ritual may be as beneficial as the coffee itself through cortisol reduction'
    }
  }
};

export const SOUTH_AFRICAN_SUPERFOODS = {
  community: 'South African',
  foods: {
    rooibos: {
      name: 'Rooibos (Aspalathus linearis)',
      origin: 'Endemic to the Cederberg mountain region of the Western Cape, South Africa; no equivalent plant exists anywhere else in the world; the Khoisan people were the first to use rooibos as a beverage',
      nutrients: 'Aspalathin: a unique C-glucosyl dihydrochalcone antioxidant found in no other plant; nothofagin (another unique flavonoid); quercetin; luteolin; total antioxidant capacity is high despite caffeine-free composition',
      skin: 'Aspalathin and nothofagin are anti-inflammatory through multiple pathways; some evidence for inhibiting cortisol synthesis (alpha-glucosidase inhibition may reduce cortisol precursor conversion); anti-glycation properties (inhibiting the Advanced Glycation End-products that stiffen collagen); topical rooibos extract in several South African skincare products',
      internal: 'Rooibos tea is naturally caffeine-free; can be consumed in large quantities without the stimulant effects of regular tea or coffee; the caffeine-free property means it does not interfere with sleep (sleep being important for skin repair); South Africans typically drink rooibos as a daily beverage'
    },
    marula: {
      name: 'Marula Fruit (Sclerocarya birrea)',
      origin: 'Native to southern and East Africa; the marula fruit is culturally significant across multiple southern African peoples; the tree features in the traditional life of Swazi, Zulu, Venda, and other communities',
      nutrients: 'Marula fruit: 8× more vitamin C than an orange (gram for gram); antioxidant polyphenols; the marula oil (from seeds): 78% oleic acid; antioxidant tocotrienols',
      skin: 'Marula fruit\'s vitamin C content supports collagen synthesis; marula oil\'s high oleic acid absorbs readily into skin without greasiness; the tocotrienols (a form of vitamin E found in marula that is distinct from tocopherols) have evidence for more potent antioxidant activity than regular vitamin E',
      use: 'Marula fruit eaten fresh; fermented into marula beer; marula oil extracted for cosmetic and edible use; Africology\'s Marula Oil; Skin Creamery marula products'
    },
    buchu: {
      name: 'Buchu (Agathosma betulina)',
      origin: 'Cape fynbos endemic; found only in the Cederberg and surrounding mountain regions of the Western Cape; used by the Khoikhoi as a traditional medicine for centuries',
      nutrients: 'Diosphenol (a unique aromatic compound with blackcurrant-like scent); quercetin; rutin; a range of flavonoids and essential oils',
      skin: 'Anti-inflammatory; diuretic properties (relevant to reducing puffiness); antiseptic; some evidence for anti-Candida properties (relevant to candida-related skin issues); the unique phytochemistry makes buchu a genuinely distinctive botanical ingredient',
      use: 'Buchu brandy (a traditional South African medicinal preparation); buchu tea; buchu-based skincare products from South African artisan brands'
    }
  }
};

export const BLACK_AMERICAN_SUPERFOODS = {
  community: 'Black American',
  foods: {
    collardGreens: {
      name: 'Collard Greens',
      nutrients: 'Vitamin K (the highest of any common food — 1 cup cooked provides 1000%+ of daily value); vitamin C; folate; calcium; beta-carotene; sulforaphane (when lightly cooked)',
      skin: 'Vitamin K is required for carboxylation of matrix Gla protein, which prevents calcium deposition in elastin fibres (calcium hardening of elastin is a mechanism of skin ageing); beta-carotene is a vitamin A precursor for skin cell turnover; vitamin C for collagen; sulforaphane has anti-inflammatory and potential anti-cancer properties',
      cultural: 'Collard greens are the quintessential soul food vegetable; traditionally cooked with smoked pork (fatback or ham hock) which adds sodium and fat but also flavour; the natural food movement within Black American wellness has re-embraced collard greens as a nutrient powerhouse while experimenting with smoked turkey or plant-based flavouring alternatives that reduce sodium and saturated fat while maintaining cultural meaning'
    },
    sweetPotato: {
      name: 'Sweet Potato (Ipomoea batatas)',
      nutrients: 'Orange-fleshed sweet potato: among the richest food sources of beta-carotene (the orange pigment); vitamin C; potassium; fibre; B vitamins; the purple variety contains anthocyanins',
      skin: 'Beta-carotene is a vitamin A precursor: required for skin cell turnover; at high dietary intakes, carotenoids accumulate in the skin giving a healthy orange-tinted glow (carotenodermia — harmless and associated with appearing healthier in attractiveness studies); fibre supports gut health (gut-skin axis); vitamin C for collagen',
      cultural: 'Sweet potatoes are deeply embedded in Black American food culture (sweet potato pie; candied yams); native to Central America but have been a staple in West and Central Africa since Portuguese traders introduced them in the 16th century; the sweet potato was a survival food for enslaved Black Americans in the American South where it could be grown even in poor soil'
    },
    blackEyedPeas: {
      name: 'Black-Eyed Peas (Vigna unguiculata)',
      cultural: 'Black-eyed peas have profound cultural significance in Black American culture; the tradition of eating black-eyed peas on New Year\'s Day for good luck is one of the most enduring Black American food traditions; the tradition may trace back to West African food traditions brought to America during the transatlantic slave trade',
      nutrients: 'Folate (one of the richest plant sources); protein; zinc; iron; fibre (prebiotic)',
      skin: 'Zinc for collagen synthesis, wound healing, and anti-inflammatory processes; folate for DNA synthesis and repair (important for rapidly dividing skin cells); iron supports overall cellular energy and oxygenation; the prebiotic fibre feeds beneficial gut bacteria'
    }
  }
};

export const ALL_ETHNIC_SUPERFOODS = {
  'west-african': WEST_AFRICAN_SUPERFOODS,
  'south-asian': SOUTH_ASIAN_SUPERFOODS,
  caribbean: CARIBBEAN_SUPERFOODS,
  arab: ARAB_SUPERFOODS,
  latina: LATINA_SUPERFOODS,
  'east-asian': EAST_ASIAN_SUPERFOODS,
  'east-african': EAST_AFRICAN_SUPERFOODS,
  'south-african': SOUTH_AFRICAN_SUPERFOODS,
  'black-american': BLACK_AMERICAN_SUPERFOODS
};

export function getSuperfoodGuide(communityId) {
  const directMap = {
    'west-african': ALL_ETHNIC_SUPERFOODS['west-african'],
    'south-asian': ALL_ETHNIC_SUPERFOODS['south-asian'],
    caribbean: ALL_ETHNIC_SUPERFOODS.caribbean,
    arab: ALL_ETHNIC_SUPERFOODS.arab,
    latina: ALL_ETHNIC_SUPERFOODS.latina,
    'east-asian': ALL_ETHNIC_SUPERFOODS['east-asian'],
    'east-african': ALL_ETHNIC_SUPERFOODS['east-african'],
    'south-african': ALL_ETHNIC_SUPERFOODS['south-african'],
    'black-american': ALL_ETHNIC_SUPERFOODS['black-american']
  };
  return directMap[communityId] || null;
}

export const SUPERFOODS_BEAUTY_STATS = {
  moduleId: 'superfoods_beauty_ethnic',
  version: '1.0.0',
  topics: ['moringa West African nutrient dense vitamin C iron', 'baobab vitamin C highest plant source 500mg per 100g', 'turmeric curcumin piperine bioavailability 2000% black pepper', 'ashwagandha cortisol RCT reduction 20-30% adaptogen', 'EGCG green tea catechin antioxidant UV anti-androgenic', 'avocado UCLA 2023 skin elasticity study', 'cacao flavanol skin hydration UV resistance study 2006', 'rooibos aspalathin unique antioxidant South Africa endemic', 'marula fruit vitamin C 8x orange oil oleic acid', 'collard greens vitamin K elastin calcium skin ageing', 'teff Ethiopia low glycaemic iron complete amino acid', 'amla Indian gooseberry heat-stable vitamin C tannin', 'black seed thymoquinone eczema RCT anti-inflammatory'],
  communitiesSupported: 9,
  keyFacts: [
    'Turmeric\'s curcumin is genuinely anti-inflammatory through multiple biochemical pathways (NF-κB inhibition, COX-2 inhibition, 5-LOX inhibition) with hundreds of supporting studies; however, curcumin has very poor bioavailability from regular turmeric consumption — the traditional pairing of turmeric with black pepper (piperine) in South Asian and other cooking increases curcumin bioavailability by approximately 2000%, making this ancient culinary practice nutritionally validated',
    'Moringa oleifera is genuinely among the most nutrient-dense plants studied (7× more vitamin C than oranges, 4× more vitamin A than carrots, significant iron and calcium); the nutrient density claims are laboratory-verified, making moringa one of the most legitimately evidence-supported "superfoods" rather than just a marketing label; West African and South Asian communities that have used moringa for centuries were nutritionally correct',
    'A 2023 UCLA study found that consuming one avocado daily for 16 weeks significantly improved skin elasticity and facial fat distribution in middle-aged women; avocado\'s high monounsaturated fat (oleic acid), vitamin E, and squalene content provide a mechanistic basis for this finding; the avocado was domesticated in Mexico approximately 5000 years ago, making this a case of ancient culinary wisdom validated by modern research',
    'Rooibos (Aspalathus linearis) is uniquely South African — it grows only in the Cederberg mountain region and nowhere else on earth; its primary antioxidant compounds (aspalathin and nothofagin) are found in no other plant; the anti-inflammatory, anti-glycation, and potential cortisol-modulating properties make rooibos a genuinely distinctive beauty food with emerging evidence beyond typical herbal tea claims'
  ]
};
