/**
 * MIRRR — Traditional Medicine & Beauty Ethnic Guide
 * How ancient healing systems across ethnic communities
 * intersect with beauty: Ayurveda, TCM, Unani, Yoruba Ifa,
 * Ethiopian traditional medicine, and more.
 */

export const ETHNIC_TRADITIONAL_MEDICINE_BEAUTY_GUIDES = {
  'west-african': {
    communityId: 'west-african',
    communityName: 'West African',
    healingSystem: 'Yoruba Ifa / West African traditional medicine',
    beautyPhilosophy: 'In Yoruba philosophy, beauty (ewa) is inseparable from health, spiritual alignment, and social harmony. The body is maintained through connection with the Orishas — divine energies associated with specific plants, waters, and healing practices.',
    keyOrishas: {
      Oshun: 'Orisha of rivers, love, fertility, and beauty. Oshun\'s domain includes honey, cinnamon, gold, and orange. Beauty rituals invoking Oshun use honey as a face treatment and cinnamon in bath preparations.',
      Yemoja: 'Orisha of the ocean and all waters. Yemoja\'s domain includes sea water, blue/white colors, and fish. Salt water and ocean-derived ingredients (sea moss, sea salt) are associated with Yemoja\'s purifying energy.',
    },
    traditionalPlants: {
      Uziza: 'Piper guineense — used for skin conditions, menstrual regulation. Antifungal and antibacterial properties validated in studies.',
      Neem: 'Azadirachta indica — the "village pharmacy." Antibacterial, antifungal, anti-inflammatory. Leaves boiled in water create a steam treatment for acne and skin infections.',
      BitterKola: 'Garcinia kola — bitter kola is used as a skin brightener and aphrodisiac. Contains bitter compounds (kolaviron) with antioxidant properties.',
      ObiKola: 'Cola nitida — used in ceremonies and as a stimulant. Tannin-rich — astringent when used topically.',
      MorindaLucida: 'Brimstone tree — bark decoction used for skin disease, fever, jaundice. Anthraquinones in bark have antibacterial activity.',
      AfricanPepper: 'Xylopia aethiopica — used in postpartum body steaming traditions across West Africa.',
    },
    postpartumSteaming: {
      tradition: 'Postpartum body steaming is a widespread West African tradition — practiced across Nigeria, Ghana, Senegal, and the diaspora. The new mother sits over a pot of boiling water infused with medicinal herbs for 20-40 minutes.',
      herbs: 'Typical steam herbs: African pepper (Xylopia aethiopica), cloves, scent leaves (nchuanwu/efirin — Ocimum gratissimum), ginger root, efirin (basil), uda (Negro pepper).',
      modernValidation: 'Postpartum steaming creates: perineal healing support (heat increases blood flow to the healing area), uterine involution support, and sweat-induced detoxification. The combination of antifungal and antibacterial herbs in the steam may prevent postpartum infections.',
    },
    skinConditions: {
      PigmentationManagement: 'For hyperpigmentation: raw shea butter mixed with turmeric (both anti-inflammatory and mild tyrosinase inhibitors). Applied daily to dark spots.',
      AcneTraditional: 'Charcoal (from burnt plantain peel) mixed with shea butter as a drawing paste for acne. African black soap (authentic formulation) as a traditional acne treatment.',
    },
  },

  'south-asian': {
    communityId: 'south-asian',
    communityName: 'South Asian',
    healingSystem: 'Ayurveda (India) / Siddha (Tamil Nadu) / Unani (Indo-Islamic)',
    beautyPhilosophy: 'Ayurveda frames beauty (soundaryam) as a consequence of internal balance. The concept of "ojas" — the subtle essence of all vital fluids — is described as producing the outer glow of health and beauty when it is abundant. Beauty treatments in Ayurveda are simultaneously medicinal — they address the underlying imbalance that manifests as a skin condition, hair problem, or aging sign.',
    doshaSystem: {
      Vata: {
        characteristics: 'Dry, thin, rough, cool skin; tendency toward dry eczema, cracking, and premature fine lines. Hair tends to dry, frizzy, brittle.',
        balancingBeauty: 'Heavy oils (sesame, almond), warm treatments, sweet/sour/salty tastes in diet. Abhyanga (warm oil self-massage) is the core Vata beauty practice.',
        ingredients: 'Sesame oil (til tel), almond oil, ashwagandha, licorice, cardamom',
      },
      Pitta: {
        characteristics: 'Oily, warm, reddish, sensitive skin; tendency toward acne, rosacea, melasma, irritation. Hair tends to fine, oily, early graying.',
        balancingBeauty: 'Cooling treatments (rose water, sandalwood, coconut oil), bitter/astringent/sweet tastes. Avoiding excessive heat and sun.',
        ingredients: 'Coconut oil (narial tel), rose water, sandalwood (chandan), neem, manjistha, amalaki (amla)',
      },
      Kapha: {
        characteristics: 'Thick, oily, cool, pale skin; tendency toward large pores, blackheads, congestion, weight gain. Hair tends to thick, oily, abundant.',
        balancingBeauty: 'Drying, stimulating treatments (honey, clay, turmeric); pungent/bitter/astringent tastes in diet. Regular exercise.',
        ingredients: 'Honey, turmeric (haldi), triphala, ginger, brahmi',
      },
    },
    ubtanRecipe: {
      tradition: 'Ubtan is the traditional Ayurvedic body treatment — a dry paste applied before bathing that exfoliates, brightens, and tones. Used by brides before weddings (haldi ceremony), but traditionally a weekly ritual.',
      recipe: 'Base: 2 tbsp chickpea flour (besan) + 1 tsp turmeric (haldi) + 1 tsp sandalwood powder + 1/2 tsp manjistha powder + rose water to form paste. Apply to face and body, let dry 15-20 min, rub off in circular motions (the rubbing off IS the exfoliation), rinse with warm water.',
      science: 'Chickpea flour: mild enzymatic exfoliation (proteases) + oil absorption. Turmeric: curcumin anti-inflammatory + mild tyrosinase inhibition. Sandalwood: alpha-santalol anti-inflammatory + cooling. Manjistha: anthraquinone pigment-regulating compounds.',
    },
    ayurvedicOils: {
      abhyanga: 'Full-body warm oil massage is the foundational Ayurvedic beauty practice. Performed daily in traditional households (now weekly in most). Sesame oil for Vata types, coconut oil for Pitta, sunflower oil for Kapha. Warms the body, lubricates joints, improves circulation, calms the nervous system, and deeply nourishes skin.',
      champissage: 'Champi — Indian head massage with oil — is now practiced globally (the word shampoo derives from champi). Brahmi oil, coconut oil with amla and bhringraj: stimulates scalp, feeds follicles, calms the mind.',
      brahmiOil: 'Brahmi (Bacopa monnieri) infused oil: brahmanosides (saponins) shown to increase cerebral blood flow. Applied to scalp: may improve follicle circulation. Traditional use for memory and mental clarity (Brahmi is a brain tonic) plus hair growth.',
    },
  },

  'caribbean': {
    communityId: 'caribbean',
    communityName: 'Caribbean',
    healingSystem: 'Caribbean bush medicine / Obeah herbalism / Rastafarian ital health',
    beautyPhilosophy: 'Caribbean traditional medicine is a synthesis of West African healing knowledge, indigenous Taíno and Arawak plant medicine, and European herbal traditions, unified by centuries of necessity under colonial conditions where access to professional medicine was denied to enslaved and colonized people.',
    bushMedicine: {
      SeaMoss: {
        botanicalName: 'Chondrus crispus / Gracilaria spp.',
        tradition: 'Sea moss (Irish moss in Jamaica, seamoss in Trinidad) has been used in Caribbean medicine for centuries. It was used by enslaved Africans as a food security crop — harvested from rocks, nutritionally dense, freely available.',
        nutrients: '92 of 102 minerals the human body requires. Iodine, zinc, magnesium, potassium, iron, calcium. Vitamins A, C, E, K, B12.',
        beautyUse: 'Sea moss gel (boiled and blended sea moss) applied as face mask: hydrating (carrageenan — the mucilaginous compound — creates a film that holds moisture), mildly exfoliating (natural enzymes), skin brightening. Internal: sea moss smoothies for skin health, thyroid support (iodine), immune function.',
      },
      AloeVera: {
        tradition: 'Aloe vera is ubiquitous in Caribbean bush medicine — virtually every yard has an aloe plant. Used for sunburn, wounds, rashes, constipation (inner leaf taken internally), and hair growth.',
        beautyUse: 'Fresh aloe gel (scraped from the leaf) applied to hair and scalp for moisture, shine, and scalp health. Used as a natural hair gel alternative. Applied to skin for burn healing, rash treatment, hyperpigmentation.',
      },
      SourSop: {
        botanicalName: 'Annona muricata (soursop / graviola)',
        tradition: 'Soursop leaves boiled as a tea for cancer prevention (traditional), hypertension, and sleep. The leaves contain acetogenins with studied cytotoxic activity.',
        beautyUse: 'Soursop leaf tea applied to hair as a rinse for dandruff and scalp conditions. The antimicrobial compounds in soursop leaves may reduce scalp malassezia (dandruff fungus).',
      },
      Cerasee: {
        botanicalName: 'Momordica charantia (bitter melon)',
        tradition: 'Cerasee bush is one of the most important plants in Jamaican bush medicine. The bitter vines and leaves are boiled and drunk as a powerful cleanse — traditionally for "blood cleansing," parasites, diabetes management.',
        beautyUse: 'The bitter compounds (charantin, polypeptide-p) have blood sugar regulatory effects. Caribbean traditional medicine has always understood the skin-gut-blood connection — clear blood = clear skin.',
      },
    },
    rastafarian: {
      philosophy: 'Rastafarian ital (vital) dietary and lifestyle principles emphasize: no meat or processed food, natural herb use, avoidance of synthetic products, connection to the land.',
      beautyImplication: 'Rasta beauty is defined by: natural hair (locs as a spiritual and cultural statement — "the crown"), natural body care products (no synthetic fragrance or chemical processing), herb-based health maintenance.',
    },
  },

  'arab': {
    communityId: 'arab',
    communityName: 'Arab Middle Eastern',
    healingSystem: 'Islamic medicine (Prophetic medicine) / Unani (Greco-Islamic)',
    beautyPhilosophy: 'Islamic medicine (Tibb al-Nabawi — Prophetic medicine) provides a comprehensive framework of health and beauty practices rooted in the hadith (sayings and practices of Prophet Muhammad). Unani medicine (from Yunan — Greece) is the Arabic synthesis of Greek Hippocratic/Galenic medicine with Arab additions, practiced across the Muslim world.',
    propheticMedicine: {
      Miswak: {
        description: 'The chewing stick (Salvadora persica) recommended by the Prophet Muhammad. "Were it not that I would be imposing hardship on my nation, I would have commanded them to use the miswak before every prayer." (Sahih al-Bukhari)',
        science: 'Salvadora persica contains: benzyl isothiocyanate (antibacterial), silica (abrasive whitening), sodium bicarbonate (alkaline, neutralizes acid), salvadorine (antibacterial), fluoride (cavity prevention). Multiple RCTs show miswak as effective as or more effective than commercial toothbrushes for plaque reduction.',
        beautyRelevance: 'The regular miswak user has statistically cleaner teeth and healthier gums than non-users — the natural fluoride content whitens over time. The miswak is not a primitive tool; it is a scientifically validated oral hygiene instrument.',
      },
      BlackSeed: {
        arabicName: 'Habbatus sauda (حبة السوداء)',
        botanicalName: 'Nigella sativa',
        hadith: '"Use the black seed, for it contains a cure for every disease except death." (Sahih al-Bukhari)',
        activeCompound: 'Thymoquinone — the primary bioactive compound in black seed oil. Extensively studied: anti-inflammatory, antioxidant, anticancer, antimicrobial, antidiabetic effects demonstrated in vitro and in animal studies.',
        
      },
      Honey: {
        arabicName: 'Asal (عسل)',
        hadith: '"Honey is a remedy for every illness and the Quran is a remedy for all illness of the mind, therefore I recommend to you both remedies, the Quran and honey." (Ibn Maja)',
        science: 'Honey\'s antibacterial properties: hydrogen peroxide release, low pH, high osmolarity, defensin-1 bee peptide, methylglyoxal (in manuka). Wound-healing effects well-validated. Anti-inflammatory, humectant properties for skin.',
        beautyUse: 'Raw honey face mask: antibacterial (acne), hydrating (hygroscopic), healing (wound repair signals). Applied to hair as conditioning mask. Combined with cinnamon (cinnamaldehyde anti-inflammatory) for spot treatment.',
      },
    },
    aromaticsTradition: {
      tradition: 'The Arab world\'s contribution to perfumery and aromatics is foundational to modern beauty. The word "alcohol" (from Arabic al-kuhl) and the distillation technique itself come from Arab scientists like Avicenna (Ibn Sina) who developed the modern steam distillation process in the 10th century.',
      
      roseWater: 'Persian/Arab rose water: Rosa damascena distilled water. Origin: Avicenna\'s 10th-century Persian distillation labs. Now produced in bulk in Iran, Bulgaria, and Morocco. Beauty uses: toner, perfume, cooking, religious ritual.',
      frankincense: 'Boswellia sacra from Oman — the finest frankincense in the world. Arab women burn frankincense resin at home for scenting and spiritual protection. Applied as a skin treatment (boswellic acids are validated anti-inflammatory compounds).',
    },
  },

  'latina': {
    communityId: 'latina',
    communityName: 'Latina',
    healingSystem: 'Curanderismo / Indigenous Mesoamerican plant medicine / Santería herbalism',
    beautyPhilosophy: 'Curanderismo is the traditional healing system of Latin America — a synthesis of indigenous healing knowledge, Spanish/colonial Catholic folk medicine, and African-derived traditions (particularly in the Caribbean and Brazil). The curandera (healer) treats the whole person: body, mind, and spirit. Beauty in this system is not superficial — it is the external evidence of internal wellness and spiritual alignment.',
    curanderismoBeauty: {
      Limpias: {
        description: 'Spiritual cleansing (limpia) ceremonies remove negative energy, emotional blockages, and spiritual illness. The limpia often uses an egg (rubbed over the body to absorb negative energy), fresh herbs (ruda/rue, rosemary, basil), rose petals, copal incense, and prayer.',
        beautyRelevance: 'The psychological effect of the limpia is real and significant. The ceremony provides a structured, ritualized release of stress, grief, fear, and anxiety. Cortisol reduction from genuine psychological catharsis would be expected to benefit skin, hair, and overall beauty.',
      },
      TemasCalCeremony: {
        description: 'The temazcal is the Mesoamerican sweat lodge — a domed structure heated with volcanic rocks, used for purification, healing, and ceremony. The word comes from Nahuatl temazcalli (steam house).',
        modernUse: 'Temazcal ceremonies are experiencing a major revival in Mexico and among the Mexican/Latina diaspora. They are offered as beauty and wellness treatments in Mexican resorts and in Mexican-American communities.',
        beautyScience: 'Temazcal heat: vasodilation increases circulation to skin, sweat detoxification through skin, muscle relaxation, and meditative state from ceremony all produce measurable beauty benefits.',
      },
    },
    nopales: {
      tradition: 'Nopal (prickly pear cactus — Opuntia spp.) is both a staple food and a medicine in Mexican and Chicano tradition. Nopales have been used for: blood sugar regulation, wound healing, sun protection.',
      
      beautyUse: 'Nopal gel (from the cactus pad) applied to sunburns, rashes, and as a hydrating face treatment. Prickly pear seed oil applied to face and hair for antioxidant protection and hydration.',
    },
    remedios: {
      AguaDeRosas: 'Rose water as toner — used across Latin American households for generations. Applied with cotton pads, or spritzed on face throughout the day.',
      Canela: 'Cinnamon (canela) in hair treatments: cinnamaldehyde increases blood flow to the scalp. DIY hair treatment: mix cinnamon with coconut oil, apply to scalp.',
      Maiz: 'Corn (maíz) in beauty: cornmeal as a gentle exfoliant, corn silk for kidney and skin health, blue corn in Southwestern Latina beauty traditions.',
    },
  },

  'east-asian': {
    communityId: 'east-asian',
    communityName: 'East Asian',
    healingSystem: 'Traditional Chinese Medicine (TCM) / Korean Oriental Medicine (KOM) / Kampo (Japanese)',
    beautyPhilosophy: 'TCM frames beauty as the external manifestation of internal harmony — when Qi (vital energy) flows freely, Blood is abundant, and the internal organs are balanced, the skin glows, hair is lustrous, and eyes are bright. Beauty treatments in TCM are designed to correct internal imbalances that express as skin conditions, hair loss, or premature aging.',
    qiBloodAndSkin: {
      QiDeficiency: 'Pale, lusterless skin, easily bruising, weak hair growth. Treatment: qi-building herbs (ginseng, astragalus, codonopsis), qi-building foods (dates, rice, yams), regular exercise.',
      BloodDeficiency: 'Dry, dull, easily-lined skin; dry, brittle hair; pale nail beds. Treatment: blood-nourishing herbs (dang gui/angelica, shou wu/fo-ti, goji berries), blood-building foods (dark leafy greens, black sesame, bone broth).',
      HeatInBlood: 'Red, inflammatory skin conditions — acne, rosacea, eczema, psoriasis. Treatment: heat-clearing herbs (huang lian/coptis, huang bai/phellodendron, da qing ye), cooling foods (cucumber, watermelon, chrysanthemum tea).',
    },
    tcmBeautyHerbs: {
      DangGui: {
        name: 'Angelica sinensis (当归)',
        role: 'Primary "blood-building" herb in TCM, used for women\'s health across all contexts — menstrual regulation, postpartum recovery, fertility. Beauty application: blood nourishment improves skin color, luster, and moisture. Applied topically in creams and serums for skin regeneration.',
        science: 'Ferulic acid content — one of the most potent UV-absorbing antioxidants known. Z-ligustilide (anti-inflammatory). Blood thinning effects improve microcirculation.',
      },
      GouQiZi: {
        name: 'Lycium barbarum / wolfberry / goji berry (枸杞子)',
        role: 'Classified as a Liver and Kidney tonic — in TCM, the Liver stores blood and the Kidney is the root of vital essence. Both are associated with eye health and hair vitality.',
        science: 'Zeaxanthin (protects macula of the eye from UV damage — goji berries have the highest known concentration of zeaxanthin of any food). Betaine (anti-inflammatory). Polysaccharides (immune modulating, antioxidant). 19 amino acids.',
        beautyUse: 'Daily goji berry consumption: antioxidant protection for skin cells, eye health. Topical goji extract in serums and masks.',
      },
      ShouWu: {
        name: 'Polygonum multiflorum / fo-ti / he shou wu (何首乌)',
        role: 'The most famous hair-blackening herb in Chinese medicine. Named "He Shou Wu" (Black-Haired Mr. He) after a legendary figure whose gray hair returned to black after taking the herb.',
        science: 'Stilbene glycosides, emodin, and other compounds. Hepatotoxicity risk with improper preparation — must be prepared (Zhi He Shou Wu) through specific processing to reduce toxic effects. Raw He Shou Wu is significantly more toxic.',
        caution: 'He Shou Wu has caused liver damage and liver failure in documented cases. Always use the properly prepared (Zhi/prepared) form. Consult qualified TCM practitioner before use.',
      },
    },
    gua_sha: {
      origin: 'Gua sha (刮痧) means "scraping petechiae" — the traditional practice involved scraping the skin with a smooth tool to bring blood to the surface for conditions like chronic pain, fever, and qi stagnation. The facial gua sha practiced for beauty is a much gentler adaptation.',
      beautyProtocol: 'Facial gua sha: apply facial oil liberally. Hold gua sha tool (jade, rose quartz, or bian stone are traditional; modern: stainless steel, obsidian) at 15-degree angle to face. Stroke in upward, outward motions along lymphatic drainage pathways. Gentle pressure — NO red marks. 5-10 minutes.',
      science: 'Fascia manipulation: gua sha moves the superficial fascia beneath the skin, reducing connective tissue adhesions that contribute to the "heavy" or "puffy" appearance. Lymphatic stimulation: moves excess interstitial fluid (puffiness reduction). Microcirculation: gentle stimulation increases blood flow, improving skin tone and color.',
    },
  },

  'east-african': {
    communityId: 'east-african',
    communityName: 'East African',
    healingSystem: 'Ethiopian traditional medicine (ETM) / Swahili herbal medicine / Somali traditional medicine',
    beautyPhilosophy: 'Ethiopian traditional medicine (ETM) is one of the world\'s oldest continuous healing traditions — Ethiopian medical texts date to the 14th century (the Zara Yaqob treatises). ETM integrates plant medicine, spiritual practice (within Orthodox Christian, Islamic, and indigenous spiritual frameworks), and dietary practice.',
    frankincense: {
      
      activeCompounds: 'Boswellic acids (AKBA — acetyl-11-keto-β-boswellic acid is the most potent anti-inflammatory). Incensole acetate (anti-anxiety, neuroprotective effects from burning frankincense — validated in studies on mice).',
      
      ethnoKnowledge: 'Ethiopian traditional healers (debtera in Amhara tradition, medicine men in Oromo tradition) use frankincense for: wound treatment, skin infections, stretch marks, and postpartum skin restoration.',
    },
    injera: {
      connection: 'Injera (Ethiopian teff flatbread) fermentation is a traditional microbiome practice thousands of years before probiotics were understood scientifically. Teff grain fermented for 2-3 days creates a lactic-acid-rich batter.',
      beautyConnection: 'The lactic acid bacteria in injera preparation parallel the lactic acid bacteria used in modern fermented beauty products. Ethiopians who eat injera daily consume significant quantities of live cultures — the gut microbiome connection to skin health (gut-skin axis) means injera is a beauty food in the most functional sense.',
    },
    ethiopianCoffee: {
      ceremony: 'The Ethiopian coffee ceremony (buna) is one of the world\'s great ritual practices — three rounds of coffee (Abol, Tona, Baraka), incense burning, and 2-3 hours of shared time. It is simultaneously a social institution and a beauty ritual.',
      beautySkin: 'Green coffee bean paste (unroasted coffee applied to face): chlorogenic acid — the primary polyphenol in unroasted coffee — is one of the most potent natural antioxidants known. More potent than vitamin C in scavenging free radicals. Reduces UV oxidative stress in skin cells.',
      coffeeGroundScrub: 'Spent coffee grounds as a body scrub: physical exfoliation from the grit + caffeine stimulation of circulation. The caffeine in coffee grounds may reduce the appearance of cellulite temporarily by stimulating lipolysis in fat cells.',
    },
    moringa: {
      ethiopianName: 'Shiferaw (Ethiopia) / Mzungu (Swahili)',
      tradition: 'Moringa oleifera (the "miracle tree") has been used in East African traditional medicine for centuries. Every part of the tree is used: leaves for nutrition, seeds for water purification, oil (ben oil) for skin.',
      beautyUse: 'Moringa seed oil (ben oil): high in oleic acid (73%), palmitoleic acid. Extraordinary stability (does not go rancid for months at room temperature due to natural antioxidants). Applied to skin and hair.',
      science: 'Moringa oil contains isothiocyanates (antimicrobial), zeatin (cell division hormone, possible anti-aging), and omega-9 fatty acids. Used by Ancient Egyptians in cosmetics — found in ancient burial tombs.',
    },
  },

  'south-african': {
    communityId: 'south-african',
    communityName: 'South African',
    healingSystem: 'Ubuntu medicine / Zulu/Xhosa traditional medicine (izinyanga and izangoma) / Cape Malay traditional medicine',
    beautyPhilosophy: 'South African traditional medicine operates within the ubuntu philosophy — "I am because we are." Health and beauty are understood as community states, not individual ones. The isangoma (divination healer) and inyanga (plant medicine healer) treat illness as a disruption in the individual\'s relationship with ancestral spirits and the community.',
    rooibos: {
      scientificName: 'Aspalathus linearis',
      origin: 'Cederberg region, Western Cape, South Africa — the only place in the world where rooibos grows naturally. Has been used by Khoisan (Khoi and San) people for centuries before European contact.',
      activeCompounds: 'Aspalathin (unique to rooibos — not found in any other plant in significant amounts). Nothofagin. Quercetin, luteolin, orientin, vitexin (flavonoids). Phenylpyruvic acid (unique bioactive).',
      science: 'Aspalathin: potent antioxidant, anti-inflammatory, shown to reduce cortisol secretion in studies (anti-stress). Hyaluronidase inhibition (enzyme that breaks down hyaluronic acid in skin) — rooibos may slow skin dehydration by protecting natural HA.',
      beautyUse: 'Rooibos tea drunk daily: antioxidant, anti-inflammatory. Rooibos cooled tea as facial toner. Rooibos-infused oil for skin. Rooibos steam facial (brew strong, pour in bowl, steam face over bowl with towel).',
    },
    marula: {
      scientificName: 'Sclerocarya birrea',
      tradition: 'Marula has been central to Zulu, Swazi, and Tsonga culture for thousands of years. The marula tree is regarded as a holy tree in these cultures — associated with fertility rites and ancestor communication. The seed oil has been extracted by hand by African women for generations.',
      oilProfile: 'Marula oil: 70-78% oleic acid (highest of any African oil). 9% palmitic acid. 5.9% palmitoleic acid (rare — accelerates skin healing). Very high antioxidant content (tocoperols, catechins).',
      science: 'Palmitoleic acid is an omega-7 fatty acid — found in the sebum of young skin and declining with age. Applying palmitoleic acid topically may partially compensate for this age-related decline. Marula\'s high antioxidant content makes it resistant to oxidation — a stable oil with a long shelf life.',
      beautyUse: 'Applied as a face oil (1-3 drops), hair oil, cuticle treatment. Absorbs quickly into skin without greasiness.',
    },
    buchu: {
      scientificName: 'Agathosma betulina (round leaf buchu) / Agathosma serratifolia (oval leaf buchu)',
      tradition: 'Buchu is sacred to the Khoisan people of the Western Cape — one of the most important plants in Cape Malay and indigenous South African medicine. Used for urinary tract infections, kidney health, arthritis, and as a general health tonic.',
      
      beautyUse: 'Buchu tea as diuretic (reduces puffiness/water retention). Buchu-infused oil as antimicrobial skin treatment. Buchu essential oil in diffusers for aromatherapy.',
    },
    fynbos: {
      
      beautyIngredients: ['Rooibos (Aspalathus linearis)', 'Honeybush (Cyclopia spp.)', 'Buchu (Agathosma spp.)', 'Cape chamomile (Eriocephalus punctulatus)', 'Geranium (Pelargonium sidoides)', 'Wild rosemary (Eriocephalus africanus)', 'Pelargonium graveolens (geranium oil)', 'Osmanthus afra (African brake)'],
    },
  },

  'black-american': {
    communityId: 'black-american',
    communityName: 'Black American',
    healingSystem: 'Hoodoo herbalism / Black folk medicine / Gullah Geechee plant tradition',
    beautyPhilosophy: 'Black American folk medicine (often called "hoodoo" or simply "root work") is a synthesis of West and Central African healing knowledge preserved through the Middle Passage and slavery, adapted with indigenous North American plant knowledge, and overlaid with Christian spiritual practice. Enslaved Africans maintained their healing traditions under conditions of extreme repression — preserving knowledge of medicinal plants that was sometimes the only medicine available to them.',
    hoodooBeauty: {
      
      FloraSurvival: 'The enslaved knew and used: sassafras (antiseptic, diuretic), pokeweed (strong medicine — skin conditions), comfrey (wound healing), elder (immune support), mullein (respiratory), and dozens of other North American medicinal plants.',
    },
    traditionalPlants: {
      Sassafras: {
        name: 'Sassafras albidum',
        tradition: 'Sassafras root bark tea was a spring tonic and "blood cleanser" in Black American folk tradition — drunk in spring to purify blood after winter. The original root beer used sassafras.',
        caution: 'Safrole (primary compound in sassafras) is a potential carcinogen — banned in food use by FDA in 1960. Historical use as seasonal tea was low-dose; long-term/high-dose use is not advised.',
      },
      BurdockRoot: {
        name: 'Arctium lappa',
        tradition: 'Burdock root was used extensively in Black American folk medicine as a "blood purifier" — for acne, eczema, and other skin conditions expressed as "dirty blood."',
        science: 'Inulin (prebiotic fiber that feeds beneficial gut bacteria). Arctigenin (anti-inflammatory, antioxidant). Quercetin (anti-inflammatory). The gut-skin connection that Black folk healers understood intuitively — clear blood/gut = clear skin — is now validated by skin microbiome research.',
        beautyUse: 'Burdock root tea (drunk daily for 2-4 weeks): for acne and eczema management through gut support. Burdock root tincture applied topically to scalp for dandruff.',
      },
      Shea: {
        note: 'While shea comes from West Africa, not North America, it was carried to the United States with enslaved Africans\' knowledge of its uses and reintroduced as a beauty staple through the Black American connection to African heritage. The modern "shea butter as Black beauty staple" is a story of cultural retention across the diaspora.',
      },
    },
    selfCareResistance: {
      
      modernMovement: 'The natural hair movement (early 2000s-present), the clean beauty movement within Black communities, and the growth of Black-owned beauty brands are all expressions of this tradition of reclaiming bodily autonomy and cultural beauty standards.',
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CROSS-SYSTEM CONVERGENCES
// ─────────────────────────────────────────────────────────────────────────────

export const TRADITIONAL_MEDICINE_CONVERGENCES = {
  universalPrinciples: ['Gut-skin connection (every tradition links internal health to skin clarity)', 'Seasonal adaptation (each system adjusts beauty care to seasonal rhythms)', 'Whole-food nutrition as beauty foundation (not supplements)', 'Mental/emotional state as beauty factor (stress = skin problems in every tradition)', 'Plant-based primary treatment before synthetic intervention'],
  ingredientConvergences: {
    turmeric: 'Used in Ayurveda, Unani, West African, Caribbean, and East African medicine for skin conditions. Curcumin anti-inflammatory activity is the shared mechanism.',
    honey: 'Used in Prophetic medicine, Ayurveda, Caribbean bush medicine, West African folk medicine, and East African (Ethiopian honey). Antimicrobial and wound-healing properties universally recognized.',
    aloe: 'Used in Caribbean, Latina curanderismo, South African, and West African traditions. Acemannan (active compound) wound-healing and anti-inflammatory.',
    charcoal: 'Used in West African (plantain peel), South Asian (charcoal toothpowder), Caribbean, and Black American traditions for drawing toxins from skin and cleaning teeth. The mechanism (adsorption) is the same across all uses.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// GETTER FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export function getTraditionalMedicineBeautyGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_TRADITIONAL_MEDICINE_BEAUTY_GUIDES['west-african'],
    'south-asian': ETHNIC_TRADITIONAL_MEDICINE_BEAUTY_GUIDES['south-asian'],
    'caribbean': ETHNIC_TRADITIONAL_MEDICINE_BEAUTY_GUIDES['caribbean'],
    'arab': ETHNIC_TRADITIONAL_MEDICINE_BEAUTY_GUIDES['arab'],
    'latina': ETHNIC_TRADITIONAL_MEDICINE_BEAUTY_GUIDES['latina'],
    'east-asian': ETHNIC_TRADITIONAL_MEDICINE_BEAUTY_GUIDES['east-asian'],
    'east-african': ETHNIC_TRADITIONAL_MEDICINE_BEAUTY_GUIDES['east-african'],
    'south-african': ETHNIC_TRADITIONAL_MEDICINE_BEAUTY_GUIDES['south-african'],
    'black-american': ETHNIC_TRADITIONAL_MEDICINE_BEAUTY_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

