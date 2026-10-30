/**
 * MIRRR — Water Beauty Ethnic Guide
 * How water quality, type, and ritual use affects skin and hair across
 * ethnic communities. Hard water, soft water, ocean water, mineral water,
 * spring water, rain water, rice water — and how each community has
 * developed traditions and practices around the water available to them.
 */

export const ETHNIC_WATER_BEAUTY_GUIDES = {
  'west-african': {
    communityId: 'west-african',
    communityName: 'West African',
    waterContext: {
      traditional: 'West African communities access a range of water types. Coastal communities (Ghana, Nigeria, Senegal) have access to ocean water. Inland communities traditionally used river and spring water for bathing and cooking. The humid subtropical climate means that water — in its many forms — is central to daily life and beauty practice.',
      modern: 'Urban West African centers increasingly deal with municipal water of varying quality. Hard water is common in some regions (particularly in Sahel-adjacent areas), while coastal cities may have softer water. Borehole water quality varies widely.',
    },
    oceanWaterTradition: {
      practice: 'Sea bathing — swimming in the ocean — is a common practice along the West African coast. From the beaches of Accra to Lagos to Dakar, ocean bathing is both recreational and believed to have beauty and health benefits.',
      science: 'Ocean water is approximately 3.5% sodium chloride (salt), plus magnesium, potassium, calcium, and iodine. For skin: saline water is mildly antimicrobial (relevant for acne-prone skin), and the minerals support skin cell function. For hair: ocean water temporarily swells the hair shaft, adding volume and wave/texture definition to type 4 hair.',
      aftercare: 'After ocean swimming: rinse hair and skin with fresh water immediately to remove salt and prevent drying. Apply coconut oil or shea butter to hair and skin while still damp to seal in the residual moisture benefit without the dehydrating effects of dried salt.',
      westAfricanNote: 'In West African traditional medicine, ocean water (especially from certain beaches considered spiritually powerful) is used in ritual bathing for cleansing, protection, and good fortune. The beauty benefit is real; the spiritual dimension is equally valued.',
    },
    riceWaterTradition: {
      practice: 'Though most famous in East Asian traditions, rice water use for hair and skin exists across West Africa — particularly in Senegal and Mali where rice is a staple crop. Senegalese women have used rice water as a hair rinse and skin toner for generations.',
      preparation: 'Fermented rice water (rice soaked 24-48 hours, then drained and left to ferment 1-2 days at room temperature) vs. plain rice water (immediate soaking, drain). Fermented is stronger and more effective.',
      benefit: 'Inositol in rice water repairs hair cuticle damage and reduces surface friction. For skin: fermented rice water has postbiotic compounds and a slightly acidic pH that restores the skin\'s acid mantle. Historically used for glowing skin by Senegalese women.',
    },
    hardWaterImpact: {
      problem: 'Hard water (high calcium and magnesium mineral content) is a significant issue in Sahelian West Africa (northern Nigeria, Niger, Mali, Burkina Faso). Hard water deposits mineral scale on the hair shaft, makes soap less effective (produces less lather), and can leave a "film" on skin.',
      hairEffect: 'Hard water deposits on type 3-4 hair create rough, dull, tangly hair. The minerals bind to the negatively charged hair shaft, stiffening curls and coils. Natural oils cannot penetrate through the mineral coating.',
      fix: 'Apple cider vinegar rinse: 1 tbsp ACV in 1 cup water, poured over hair after cleansing. The acid dissolves calcium and magnesium deposits. Chelating shampoos (contain EDTA or citric acid) are the modern equivalent.',
      skinFix: 'Hard water on skin: use a vitamin C serum or ACV toner after washing face to counteract the alkalinity. A gentle acid re-acidifies skin to its natural pH 4.5-5.5 that hard water disrupts.',
    },
    rainWaterBeauty: {
      tradition: 'Across West Africa, rainwater has traditionally been collected for hair washing and skin care. Known to produce extraordinarily soft hair and smooth skin compared to well water or river water.',
      science: 'Rainwater is naturally distilled — it starts as evaporated water with no minerals, then picks up minimal impurities on its way down (air quality dependent). It is extremely soft (almost no dissolved minerals), slightly acidic from dissolved CO2 (pH ~5.6, close to skin\'s natural pH), and pure.',
      use: 'Collect rainwater in a clean vessel (ideally not from a metal roof). Store in a glass jar. Use as a final rinse for hair (rinse out shampoo/conditioner with rainwater last), or as a face toner/rinse.',
      caution: 'In polluted urban areas, rainwater picks up pollutants. Filter or boil before use.',
    },
  },

  'south-asian': {
    communityId: 'south-asian',
    communityName: 'South Asian',
    waterContext: {
      traditional: 'Water is central to South Asian life and spirituality. The Ganges, Yamuna, and other sacred rivers are not just water sources but divine entities. Bathing (snaan) is a spiritual act. The Ayurvedic relationship with water is deeply nuanced — water is seen as one of the five elements (pancha bhuta) that constitute all matter.',
      modern: 'South Asian urban water quality varies enormously — from excellent municipal water in some Indian metros to heavily fluoridated well water in rural areas to hard water in many cities. The IT capital Bengaluru has notoriously hard borehole water.',
    },
    ayurvedicWaterPractice: {
      copperVessel: 'Storing water overnight in a copper vessel (tamra jal) is one of the most ancient Ayurvedic beauty and health practices. Copper ions leach into the water overnight.',
      copperScience: 'Copper has genuine antimicrobial properties — E. coli, Staphylococcus, and other pathogens are killed by copper ions (oligodynamic effect). Copper water has slightly higher copper ion content than plain water, which is anti-inflammatory when consumed. For skin: some evidence suggests copper peptides (copper bound to short amino acid chains) stimulate collagen and elastin synthesis.',
      practice: 'Fill a clean copper vessel with water in the evening. Drink first thing in the morning before any food. Repeat with fresh water daily.',
      warning: 'Do not store acidic juices or drinks in copper vessels. Do not use copper vessels with a damaged interior coating. Excess copper is toxic — copper vessel water should be consumed once daily, not all day.',
    },
    roseWaterTradition: {
      history: 'Persia invented rose water distillation around the 7th century CE. It spread through the Islamic Golden Age to South Asia, where it became central to Mughal court beauty, cooking, and spirituality. Today, rose water (gulab jal) is the single most ubiquitous beauty ingredient across South Asia.',
      science: 'Rose water\'s pH is 4.5-5.0 — almost exactly the skin\'s natural pH. It contains phenylethanol (antibacterial), citronellol (anti-inflammatory), and trace aromatic compounds. It restores the acid mantle after cleansing and tones the skin.',
      uses: ['Face toner after cleansing (cotton pad or spray)', 'Setting spray over makeup', 'Eye soother (cotton pads soaked in chilled rose water over closed eyes)', 'Hair conditioning rinse', 'Mixing liquid for face masks (ubtan)', 'Food flavoring (for gulab jamun, kheer, biryani)', 'Room spray for meditation and sleep'],
      quality: 'Bulgarian and Turkish rose water (Rosa damascena) is considered highest quality. Indian (Kannauj) rose water is traditional and good quality. Cheap rose water may be rose fragrance dissolved in water — check ingredient list for "rosa damascena flower water" as the only or main ingredient.',
    },
    hardWaterAndHair: {
      problem: 'Many South Asian cities have hard water that severely impacts the thick, dense type 1-3 hair common in South Asian communities. Hard water minerals prevent coconut oil (the traditional hair oil) from penetrating the hair shaft properly, defeating the purpose of oiling.',
      symptoms: 'Hair becomes rough, tangled, frizzy, and dull despite regular oiling. Color-treated hair fades faster. Scalp buildup increases.',
      fix: 'Pre-wash: apply coconut oil or sesame oil to hair first (seals the hair shaft against hard water mineral absorption). Use a chelating shampoo (Malibu C Hard Water Wellness Shampoo, Ion Clarifying Shampoo) once weekly. ACV rinse (1 tbsp in 2 cups water) as a final rinse after each wash.',
      bestPractice: 'Install a showerhead filter (Sprite or AquaBliss brand) — reduces chlorine and partially softens water. Indian dermatologists often recommend this for patients in Bengaluru and Mumbai.',
    },
    chachundriWaterRitual: {
      practice: 'Traditional practice of washing hair with rice water (rice cooking water or soaking water). Used in Tamil Nadu and other South Indian communities, parallel to East Asian rice water use.',
      science: 'Inositol in rice water: repairs damaged hair cuticles and reduces surface friction. Proteins in rice water: temporarily coat hair shaft for added strength and shine.',
      method: 'Collect water from rinsing uncooked rice. Allow to sit 12-24 hours (until slightly fermented). Dilute 1:3 with fresh water. Pour over hair as a final rinse after shampooing. Leave on 5-20 min. Rinse out.',
    },
    gangaWaterBeauty: {
      tradition: 'Ganga jal (Ganges water) has been considered sacred and purifying for thousands of years. Ancient texts describe its healing and beauty properties. Pilgrims carry Ganga water home for use in rituals, including washing.',
      science: 'The Ganges contains unique bacteriophages (viruses that attack bacteria) that give it unusual self-purifying properties — the "bacteriophage theory of Ganges purification" has scientific support. This explains historical observations that Ganges water resisted contamination. However, modern Ganges water in many stretches is heavily polluted due to industrial and sewage discharge.',
      note: 'The spiritual significance and historical beauty use of Ganga jal is genuine. For modern practical use: only certified pure Ganga jal from source (Gangotri glacier), not from polluted downstream stretches.',
    },
  },

  'caribbean': {
    communityId: 'caribbean',
    communityName: 'Caribbean',
    waterContext: {
      traditional: 'The Caribbean is defined by water — ocean, rain, river, spring. Island communities have developed intimate relationships with water in all its forms. The turquoise Caribbean Sea and Atlantic Ocean have been central to Caribbean life, economy, beauty, and spiritual practice for centuries.',
      modern: 'Caribbean islands vary in water quality and availability. Some islands have excellent natural spring water (Martinique, Dominica). Others face water scarcity. Many have desalinized water (salt removed mechanically) which can have varying mineral profiles.',
    },
    oceanWaterBeauty: {
      tradition: 'Caribbean women have long known that regular sea bathing creates remarkable skin clarity and hair texture. The saying "sea bath cure everything" reflects generations of observed beauty benefits.',
      science: {
        skin: 'Caribbean sea water mineral content: sodium, magnesium, potassium, calcium, iodine, zinc, selenium. Magnesium supports skin barrier function and reduces inflammation. Zinc is antimicrobial and wound-healing. Iodine supports thyroid function which affects skin quality. The mild saltiness of ocean water creates a hypertonic environment that draws moisture from deeper skin layers to the surface (temporary) — creating the "ocean glow" effect.',
        hair: 'Salt water temporarily swells the hair shaft and opens the cuticle — this is why hair has more texture and volume after the beach. For type 4 hair (most Afro-Caribbean women), ocean water provides incredible definition to coils and curls. The salt provides a "sea salt spray" effect naturally.',
        aftercare: 'Rinse with fresh water within 1-2 hours. Apply coconut oil to hair. Apply shea or coconut oil to body. The minerals linger on the skin even after rinsing, continuing to benefit the skin barrier.',
      },
      spiritualDimension: 'In Caribbean Afro-religious traditions (Vodou in Haiti, Santería in Cuba, Obeah across the English-speaking Caribbean), ocean water is sacred. Ochun/Oshun is the Yoruba-derived orisha of fresh water, beauty, and femininity. Yemoja/Yemaya is the orisha of the ocean, motherhood, and protection. Sea bathing with ritual intention (prayer, offerings) is a spiritual practice that intersects with beauty.',
    },
    seaMossWater: {
      tradition: 'Sea moss (Chondrus crispus, Irish moss, or Gracilaria) grows abundantly in Caribbean waters. Traditionally eaten and applied topically. Sea moss gel prepared from soaked dried sea moss.',
      preparation: 'Rinse dried sea moss. Soak in clean water 4-24 hours (expands significantly). Blend soaked moss with fresh water until smooth gel forms. Store in refrigerator up to 3 weeks.',
      beautyUse: 'Face mask: apply sea moss gel directly to face 15-20 min. Leave on. Rinse. Hair mask: apply sea moss gel to clean hair and scalp. Cover with plastic cap. Leave 30-60 min. Rinse. Body: mix sea moss gel into body lotion for added slip and minerals.',
      science: 'Sea moss contains minerals including iodine, magnesium, calcium, potassium. Its natural carrageenan provides intense film-forming hydration. The colloidal structure of sea moss gel plumps skin temporarily by holding moisture at the surface.',
    },
    rainWaterUse: {
      tradition: 'On many Caribbean islands, rooftop rainwater collection (cistern) is common — both for practical water use and historically for beauty purposes. "Rainwater rinse" for hair is a recognized Caribbean beauty tradition.',
      benefit: 'Rainwater\'s lack of minerals (extreme softness) creates an immediately noticeable difference in hair texture — hair becomes softer, shinier, and more manageable compared to hard municipal water.',
      method: 'Collect rainwater (not from first rain of a dry season — let some rain pass to clean the roof/collection system). Store in a clean container. Use as a final hair rinse or face rinse.',
    },
    coconutWater: {
      tradition: 'Coconut water is not just a beverage in the Caribbean — it\'s used topically as a skin toner and hair treatment. Fresh coconut water (not canned) applied to face or hair is a traditional practice.',
      science: 'Fresh coconut water contains: cytokinins (plant growth hormones with potential anti-aging effects on human cells), lauric acid (antimicrobial), potassium, magnesium. Cytokinins in coconut water have demonstrated anti-aging properties in plant cells — limited but interesting human skin research suggests potential benefit.',
      use: 'Apply fresh coconut water to face as toner after cleansing. Pour coconut water through hair as a conditioner before styling. Drink for internal hydration benefit.',
    },
  },

  'arab': {
    communityId: 'arab',
    communityName: 'Arab Middle Eastern',
    waterContext: {
      traditional: 'Water scarcity shaped Arab civilization and culture deeply. In the desert environment, water was precious, sacred, and central to hospitality, prayer, and life. The concept of ritual purity (tahara) in Islam requires water for ablution (wudu). Bathhouses (hammam) became the cultural institution for thorough washing and social gathering.',
      modern: 'Gulf Arab countries now rely heavily on desalinated water (they have the world\'s largest desalination capacity). Desalinated water is extremely soft, almost mineral-free, which actually creates its own hair and skin issues. Levantine Arab countries (Lebanon, Jordan, Syria, Palestine) have varied water quality.',
    },
    roseWaterOrigin: {
      history: 'Persia (modern Iran, historically part of Arab-Persian civilization) invented steam distillation of roses around the 7th-9th century CE. The Persian city of Shiraz was famous for its rose water production. Rose water spread through Arab trade networks and became central to Arab cosmetics, cooking, and spiritual practice.',
      traditionalUse: 'In Arab beauty tradition, rose water is used: as a facial toner, as a perfume base (attar), mixed into traditional beauty pastes (ghassoul, henna), sprinkled in guest rooms for hospitality, in religious contexts (cleaning sacred spaces), and in cooking (ma\'amoul cookies, qatayef).',
      quality: 'Syrian and Iranian rose water (from Rosa damascena) is considered the traditional gold standard. Available in Arab grocery stores worldwide.',
    },
    hammamWaterRitual: {
      tradition: 'The hammam (Arabic: حمام, Turkish bath, North African bathhouse) is one of the most sophisticated water beauty traditions in the world. Public bathhouses have existed in the Arab world since at least the 7th century CE, continuing the Roman bathhouse tradition with distinctly Arab and Islamic character.',
      protocol: ['Preparation: drink water before entering. Remove all jewelry.', 'Hot room (harara): sit in the steamed hot room 15-20 minutes. The heat opens pores and softens the skin\'s outermost layer.', 'Water rinse: hot water poured over the body.', 'Kessa/Kис exfoliation: the kessa glove (rough woven mitt) is rubbed firmly over the steam-softened skin. Dead skin rolls off in grey/black sheets. This is deeply satisfying and dramatically effective.', 'Ghassoul or black soap: Moroccan ghassoul clay or beldi black soap applied and massaged in.', 'Rinse: thorough warm water rinse.', 'Cool room (mughtasal): rest in cooler room. Cold water applied.', 'Dry off, rest, apply argan oil to hair and body.'],
      science: 'Steam hydrates the outer stratum corneum, increasing its water content from typical 20-35% to near-saturation. This softens the desmosome bonds that hold dead skin cells together, making kessa exfoliation dramatically more effective than dry scrubbing. The subsequent cold water closes pores and tightens skin. The whole cycle mimics hydrotherapy principles: hot expands and opens, cold contracts and firms.',
      frequency: 'Traditional: weekly. Modern minimum: monthly. Regular hammam dramatically improves skin texture, reduces ingrown hairs, and provides profound relaxation.',
    },
    desalinatedWaterIssues: {
      problem: 'Gulf Arab countries run almost entirely on desalinated water (Saudi Arabia, UAE, Kuwait, Qatar). Desalinated water has had virtually all minerals removed, creating extremely soft (low mineral content) water. While soft water is better for skin than hard water in some ways (no mineral scale deposits), it creates unexpected issues.',
      soapBehavior: 'In very soft water, soap lathers excessively and is very difficult to rinse off completely. Soap residue on hair creates buildup and dullness. On skin it leaves a slimy feeling.',
      hairEffect: 'Hair washed in very soft water lacks body and feels flat and limp. The minerals normally in water help hair feel more voluminous and textured. Gulf Emirati women with waist-length hair often use mineral-infused rinses or bottled mineral water as a final hair rinse to restore body.',
      solution: 'Use mineral water (Evian, Perrier, San Pellegrino, or local spring water) as a final rinse for hair after washing. Or: spray magnesium spray on hair before styling. Or: use a volumizing mineral spray.',
    },
    zamzamWater: {
      tradition: 'Zamzam water (from the Zamzam well in Mecca, Saudi Arabia) is sacred in Islam. Muslims bring Zamzam water home from Hajj and Umrah pilgrimages. It is consumed for spiritual blessing and applied to skin as a form of tabarruk (seeking blessing through sacred means).',
      science: 'Zamzam water has distinctive mineral content: higher-than-average calcium and magnesium bicarbonate, and very low levels of bacteria. Scientific analysis confirms its unique mineral profile, though the spiritual significance is primary for believers.',
      use: 'Applied to face and skin by Muslims seeking spiritual baraka (blessing) and believed beauty benefit.',
    },
  },

  'latina': {
    communityId: 'latina',
    communityName: 'Latina',
    waterContext: {
      traditional: 'Latin America has extraordinary water diversity: the Amazon basin (the world\'s largest fresh water system), Andean glacial meltwater, Caribbean Sea, Pacific Ocean, Atlantic Ocean, mineral springs of Mexico and Colombia. Traditional water beauty practices reflect this diversity and abundance.',
      modern: 'Water quality across Latin America varies enormously — from excellent Andean spring water to polluted urban groundwater in some regions. Altitude affects water properties (Andean city water has different mineral content than lowland water).',
    },
    floralWaterTradition: {
      aguaDeRosas: {
        tradition: 'Rose water (agua de rosas) is the foundational toner across Latin America. Used since at least the colonial period (introduced by Spanish colonizers who brought it from Arab-influenced Spain). Now it is so embedded in Latina beauty culture that it is considered authentically Mexican/Latin American.',
        use: 'After washing face, apply rose water on cotton pad. Also used as a setting spray and for "dar brillo" (giving face a glow) throughout the day.',
        brands: 'In Mexico: D\'Bari, Clinique (Clarifying Lotion), La Herbolaria. Homemade from boiling rose petals is also traditional.',
      },
      aguaDeAzahar: {
        tradition: 'Orange blossom water (agua de azahar) is the other key floral water in Latin American beauty tradition. Mexican orange blossom water is used as a toner, in cooking (for rosca de reyes), and in natural remedies.',
        science: 'Orange blossom water (Citrus aurantium var. amara flower water) is anti-inflammatory, mildly astringent, and has a calming aroma. It soothes sensitive skin and helps reduce redness.',
        use: 'Apply to face as toner. Mix into face masks. Use as a linen/room spray for calming effect.',
      },
      aguaDeHierbabuena: {
        tradition: 'Peppermint/spearmint water (agua de hierbabuena) used in Mexican folk beauty as a toning and brightening water.',
        preparation: 'Steep fresh or dried mint in just-boiled water 20 min. Cool completely. Strain into bottle. Refrigerate. Apply to face with cotton pad.',
        benefit: 'Menthol provides cooling sensation. Mild astringent properties. Reduces oiliness. Used for acne-prone skin.',
      },
    },
    waterAndMelasma: {
      connection: 'For Latina women managing melasma (very common — especially post-pregnancy), water temperature and mineral content matter more than commonly realized.',
      hotWaterNote: 'Hot water and steam increase skin temperature, which can trigger melanocyte activity and worsen melasma. During melasma flares: use lukewarm (not hot) water for face washing. Avoid steam facials and very hot showers (lean face away from direct hot steam).',
      coldWater: 'Cold water splashing on the face after cleansing: reduces skin temperature, closes pores, reduces redness, and may help minimize melanocyte stimulation. Traditional Latina advice: "enjuágate con agua fría" (rinse with cold water) is skin science-supported.',
    },
    mexicalSpringWater: {
      history: 'Mexico has a long tradition of balnearios (thermal spring bathhouses). Volcanic Mexico creates naturally mineralized spring water with sulfur, lithium, calcium, and other minerals. Communities have bathed in these springs for health and beauty for thousands of years (pre-Columbian Aztec/Maya tradition plus colonial-era European bathing culture).',
      minerals: {
        sulfur: 'Sulfurous spring water (azufre) has antimicrobial properties. Historically used for skin conditions, acne, and fungal issues. Smells of rotten eggs (H2S), but traditional communities recognize its skin benefits.',
        lithium: 'Lithium in spring water has mood-stabilizing and anti-inflammatory properties. "Lithium spring water" is sought for mood benefits and skin calming.',
        calcium: 'Calcium-rich spring water is traditional for bone health (drunk) and as a skin soak for those with fragile nails and skin.',
      },
      modern: 'Many Mexican balnearios are still active (Ixtapan de la Sal, Tequisquiapan, San Miguel de Allende area). Visiting a balneario remains a distinctly Mexican beauty and wellness tradition.',
    },
    oceanAndRiverBeauty: {
      pacificOcean: 'Pacific coast Latina communities (Mexican, Ecuadorian, Peruvian, Chilean) have ocean bathing traditions. Pacific waves are stronger — body surfing and ocean immersion are beauty and wellness practices.',
      amazonRiver: 'In Amazonian Colombia, Peru, Bolivia, and Brazil: river bathing in fresh (not salt) water. The Amazon and its tributaries are remarkably mineral-rich, with clay content that creates a natural mineral bath effect.',
      caribbeanSea: 'Caribbean Latina communities (Dominican Republic, Puerto Rico, Colombia\'s coast) share Caribbean Sea bathing traditions with non-Latina Caribbean communities — salt, minerals, sun, and warm water.',
    },
  },

  'east-asian': {
    communityId: 'east-asian',
    communityName: 'East Asian',
    waterContext: {
      traditional: 'Water is central to East Asian philosophy, aesthetics, and medicine. Taoism venerates water as the supreme element. Chinese medicine considers water one of the five elements. Japanese wabi-sabi finds beauty in water\'s natural movement. Korean culture has jjimjilbang (bathhouse) tradition. All three cultures have sophisticated water-based beauty practices.',
      modern: 'East Asian major cities (Tokyo, Seoul, Shanghai, Beijing) have excellent municipal water quality but often high in chlorine. Many East Asian homes use water purifiers. Mineral bottled water is consumed and sometimes used for beauty.',
    },
    riceWaterTradition: {
      history: 'Rice water use for hair and skin is one of the most ancient documented beauty practices in East Asia. The Yao women of the Huangluo Village in Guangxi, China, famous for their 6-foot-long hair, attribute it to rice water use. Tang Dynasty (618-907 CE) court women used rice water for bathing. Japanese geisha used rice water (yu-su-ru, the water from rinsing rice) as a final hair rinse.',
      science: {
        inositol: 'Inositol is the key active compound in rice water. It can penetrate the hair shaft and repair surface damage to the cuticle. Studies show rice water-treated hair has reduced surface friction (smoother), increased elasticity (less breakage), and faster growth in some in vitro studies.',
        pitera: 'Pitera is a specific formulation from sake fermentation (Saccharomyces cerevisiae ferment filtrate) — it\'s the most refined modern version of rice water. SK-II\'s Facial Treatment Essence is based on pitera. It contains vitamins, minerals, amino acids, organic acids, and inositol in a highly bioavailable form.',
        fermentation: 'Fermented rice water has higher bioavailability than plain rice water — fermentation produces acids that lower pH (making it more skin-compatible) and breaks down compounds into smaller molecules that penetrate more easily.',
      },
      preparation: {
        plain: 'Rinse uncooked rice in water. Drain and collect the rinsing water. Use immediately or store refrigerated 1-2 days.',
        soaked: 'Soak uncooked rice in clean water for 15-30 minutes. Drain and collect. Use within 1-2 days refrigerated.',
        fermented: 'Soak uncooked rice 24-48 hours at room temperature until it smells slightly sour. Drain. Dilute 1:1 with fresh water before use (fermented version is more acidic and concentrated).',
      },
      use: {
        hair: 'After shampooing, pour rice water over hair. Massage into scalp 5-10 min. Rinse out. Or: leave on 20 min. Can be used as a pre-shampoo soak.',
        skin: 'Apply to face with cotton pad as toner. Or: dilute and use as a facial rinse. Fermented rice water is the most effective for skin (matches the concentration in K-beauty essences).',
      },
    },
    jjimjilbangCulture: {
      tradition: 'The Korean jjimjilbang (찜질방) is a public bathhouse and rest facility — one of Korea\'s most distinctive cultural institutions. Families, friends, and couples spend hours or days in jjimjilbangs, cycling through hot and cold pools, sleeping, eating, watching TV, and socializing. It is central to Korean wellness and beauty culture.',
      protocol: ['Shower thoroughly before entering any pool', 'Hot pool (40-42°C): soak 10-15 min. Opens pores, relaxes muscles.', 'Cold plunge (10-15°C): 2-3 minutes. Closes pores, invigorates circulation.', 'Italy towel (Korean exfoliation mitt) scrub: the kiln-dried and rough Italy towel removes dead skin dramatically when skin is thoroughly soaked and softened.', 'Sauna (dry heat, often with different chambers for charcoal, jade, infrared)', 'Rest room: sleep on heated floor (ondol), eat, relax', 'Cold shower to finish'],
      italyTowelScience: 'The Italy towel (이태리 타월) is a thin, rough-woven polyester exfoliating mitt. When used on skin that has been soaked 20+ minutes in hot water (skin is soft, cuticle bonds loosened), it removes dead skin in visible grey/black rolls. The result is skin that is dramatically softer, brighter, and more even-toned. Regular Italy towel use is the single most significant factor in Korean skin\'s glass-skin texture.',
      mineralPools: 'Many jjimjilbangs have mineral-infused pools (jade water, charcoal water, vitamin C water, collagen water). While some are marketing, the vitamin C pools have scientific basis — vitamin C neutralizes chlorine in pool water.',
    },
    onsenCulture: {
      tradition: 'Japan\'s onsen (hot spring bath) culture is one of the oldest and most developed in the world. Japan has over 27,000 natural hot spring locations. Onsen bathing has been practiced since ancient times (Shinto tradition connects water with purity). Modern Japan has elaborate onsen culture: indoor, outdoor (rotenburo), co-ed (konyoku), and private.',
      minerals: {
        simple: 'Sodium chloride onsen: saline spring. Good for warming and circulation.',
        sulfurous: 'Sulfur onsen (vulcanically heated): sulfur is antimicrobial and treats skin conditions. Gives the famous egg smell. Yunishigawa, Kusatsu onsen.',
        radium: 'Radon hot springs (misasa): controversial, low-level radon thought to have hormetic (stress-beneficial) effects. Traditional belief: promotes healing.',
        carbonic: 'Carbonic acid onsen: CO2-infused naturally. The bubbles increase blood circulation dramatically, creating the "doctor fish" effect. Skin flushes pink, feels remarkably soft.',
        bicarbonate: 'Sodium bicarbonate onsen: slightly soapy feel. Called "bijin-no-yu" (beautiful woman\'s water). Excellent for skin softening and smoothness.',
      },
      effect: 'Bathing in mineral hot springs softens the skin\'s outer layer, allows mineral absorption, promotes circulation, relieves muscle tension, and has documented effects on certain skin conditions (psoriasis, eczema) in sulfurous springs. The "bijin-no-yu" (beautiful woman\'s water) reputation is well-earned.',
    },
    coldWaterSkinRoutine: {
      tradition: 'Splashing cold water on the face is a Japanese and Korean morning practice — documented in historical texts and still ubiquitous today. Many Japanese skincare routines include a cold water final rinse.',
      science: 'Cold water (below 15°C) causes immediate vasoconstriction (blood vessels narrow) in the face — reduces redness and puffiness. Reduces inflammation. Temporarily tightens skin appearance. The contrast with warm cleansing water (dilate, open, cleanse) followed by cold (close, tighten, refresh) mirrors the hot-cold alternation of onsen and jjimjilbang.',
      practice: 'After cleansing with warm water: switch to cold water for the final rinse. Or: prepare a bowl of ice water and submerge face briefly 3-5 times.',
    },
  },

  'east-african': {
    communityId: 'east-african',
    communityName: 'East African',
    waterContext: {
      traditional: 'East Africa has remarkable water diversity: the Nile (the world\'s longest river), the Rift Valley lakes (Malawi, Tanganyika, Victoria), the Indian Ocean, Highland springs, and desert/semi-arid areas. Water access and type have shaped East African beauty traditions profoundly.',
      modern: 'East African urban water quality varies by country. Ethiopian cities often have relatively good piped water. Coastal Kenyan and Tanzanian cities have varying quality. Refugee communities face significant water access challenges.',
    },
    nileWaterTradition: {
      history: 'The Nile has been the life source of North Africa and Northeast Africa for thousands of years. Ancient Egyptians (whose civilization extended into modern Sudan and Ethiopia) used Nile water for bathing, cosmetics, and medicine. Cleopatra\'s milk baths may have used Nile water as the base.',
      minerals: 'Nile water is rich in silt (fine particles of organic matter and minerals deposited from Ethiopian highlands). Historically, Nile flooding replenished agricultural land with nutrient-rich silt. The same minerals — calcium, magnesium, potassium, iron — are beauty-relevant.',
      modernNote: 'Modern Nile water downstream (Egypt, Sudan) is affected by the Aswan High Dam and pollution. Upstream in Ethiopia, the Blue Nile (Abay) runs cleaner.',
    },
    indianOceanTradition: {
      practice: 'Kenyan, Tanzanian, and Somali coastal communities have strong ocean bathing traditions. Mombasa, Dar es Salaam, Zanzibar, and Lamu are known for beautiful beaches where bathing and swimming is culturally central.',
      swahiliBeautyContext: 'Swahili culture (the coastal East African culture that combines African, Arab, and Asian elements) has sophisticated beauty practices, many involving water and ocean ingredients. Swahili women traditionally bathed with soap made from ocean sediment ash and coconut oil.',
      coralWater: 'Some East African islands (Lamu, Zanzibar, the Comoros) have tradition of using water that has sat in coral containers — the alkaline calcium from coral leaches slightly into water. Used for skin toning and believed to brighten skin.',
    },
    riftValleyMineralWater: {
      tradition: 'The East African Rift Valley has numerous natural mineral springs. Lake Bogoria (Kenya) and other soda lakes have extremely alkaline water rich in sodium carbonate and bicarbonate (natron). While too alkaline for direct skin use, these lakes have been sacred and used ceremonially.',
      tabletoTopSprings: 'Tanzanian Mount Meru and Kilimanjaro glacial meltwater feeds some of the purest natural springs in the world. Communities near Arusha have access to exceptionally pure spring water.',
      practicalBeautyUse: 'Mineral spring water (bottled or source-fresh) used for: final hair rinse to add minerals to hair, face rinse for mineral absorption, mixed into clay masks for mineral delivery.',
    },
    injera_waterConnection: {
      practice: 'The fermentation of teff batter for injera produces a liquid byproduct — teff water — that has been used in Ethiopian traditional beauty for skin.',
      science: 'Teff water (like other grain fermentation waters) contains lactic acid, B vitamins, and postbiotic compounds. The lactic acid is a gentle AHA. The postbiotics support skin microbiome.',
      use: 'Diluted teff water or injera-soak water applied to face as a mild toning and brightening treatment. The modern equivalent is using a lactic acid toner.',
    },
    coffeeCeremonySkinCare: {
      tradition: 'Ethiopian coffee ceremony (bunna ceremony) is one of the world\'s most elaborate coffee rituals. The roasting, grinding, and brewing of coffee produces coffee water (the actual brewed coffee) that is used not just for drinking but in folk beauty.',
      coffeeWaterUse: 'Cooled brewed Ethiopian coffee applied to face as toner. Strong coffee applied to undereye area for puffiness reduction. Coffee grounds mixed with oil as face or body scrub.',
      science: 'Coffee contains caffeine (vasoconstriction — reduces puffiness), chlorogenic acids (antioxidants, mild AHA), and polyphenols. The dark color of coffee slightly stains and self-tans if left on skin — use briefly and rinse.',
    },
  },

  'south-african': {
    communityId: 'south-african',
    communityName: 'South African',
    waterContext: {
      traditional: 'South Africa has extraordinary water diversity: the Indian Ocean, the Atlantic Ocean, the Cape\'s unique fynbos-filtered mountain streams (among the purest water in the world), the Highveld plateau rainfall, and semi-arid Karoo. Zulu, Xhosa, Sotho, and other traditional communities each have distinct water-related practices.',
      modern: 'South African urban water quality varies. Cape Town\'s water (mountain-fed) is considered excellent. Highveld (Johannesburg, Pretoria) has harder municipal water. Rural communities may rely on borehole water. Day Zero (2018 Cape Town water crisis) highlighted water scarcity.',
    },
    capeTownMountainWater: {
      tradition: 'Cape Town\'s water supply comes from the Hottentots Holland Mountains, filtered through indigenous fynbos vegetation. This water is exceptionally pure and soft, naturally filtered by one of the world\'s most biodiverse plant communities.',
      fynbosFiltering: 'The fynbos biome (unique to the Western Cape) has deep-rooted plants that filter water through specialized soil microbiology. The resulting water has a distinctive mineral profile and purity that is reflected in the water quality of Cape Town\'s supply.',
      rooibosWater: 'Rooibos grows natively only in the Cederberg Mountains of the Western Cape. The same region\'s water is used in rooibos production. Locals brew rooibos with this uniquely soft mountain water, creating a product more effective than rooibos brewed with hard water (minerals in hard water can denature some of rooibos\' polyphenols).',
    },
    oceanDuality: {
      indianOcean: 'The Indian Ocean (KwaZulu-Natal coast, Garden Route east) is warmer, gentler, with a distinct mineral profile influenced by currents from the tropics. Durban\'s warm Indian Ocean is central to KwaZulu-Natal beach culture.',
      atlanticOcean: 'The Atlantic Ocean (Cape Town, West Coast) is fed by the cold Benguela Current — dramatically colder (12-16°C in summer) than the Indian Ocean. Cold Atlantic water has different mineral concentrations and higher oxygen content. Brave cold-water swimmers (Cape Town has a strong cold water swimming culture) believe the cold Atlantic provides remarkable skin invigoration and circulation benefits.',
      science: 'Cold water swimming (The Atlantic at Cape Town temperatures) causes: rapid vasoconstriction followed by vasodilation (the "afterglow"), release of norepinephrine and endorphins, anti-inflammatory cytokine release, and activation of brown adipose tissue (heat-generating, metabolism-boosting). The skin benefits of cold ocean swimming are real: improved circulation, reduced inflammation, "glow" from vasodilation rebound.',
    },
    rooibosBeautyWater: {
      preparation: 'Brew very strong rooibos (4 bags or 4 tbsp loose leaf per cup, steep 10 min). Cool completely. Store refrigerated up to 1 week.',
      use: {
        faceToner: 'Apply cooled rooibos with cotton pad after cleansing. The aspalathin and nothofagin antioxidants in rooibos protect against UV-induced oxidative damage and soothe inflammation.',
        hairRinse: 'Pour rooibos through hair as a final rinse after conditioning. The low tannin content (vs. black tea) won\'t cause excessive darkening in light hair.',
        eyeSoother: 'Soak cotton pads in chilled rooibos, place over closed eyes 10-15 min. Reduces puffiness and soothes tired eyes.',
        bathSoak: 'Add 4-6 cups of brewed rooibos to bathwater. The bath water turns a beautiful amber. Soak 20-30 min. Skin absorbs rooibos antioxidants and the gallic acid has mild exfoliating effects.',
        iceRoll: 'Freeze rooibos in ice cube trays. Wrap ice cube in thin cloth. Roll over face for 30 seconds at start of day. Cold reduces puffiness; rooibos provides antioxidant benefit simultaneously.',
      },
      science: 'Rooibos (Aspalathus linearis) contains aspalathin (unique dihydrochalcone, found nowhere else in nature), nothofagin, quercetin, luteolin. These polyphenols are powerful antioxidants. South African research (University of Stellenbosch) has documented rooibos\' anti-inflammatory, antimutagenic, and antioxidant properties. Clinical studies show rooibos tea consumption improves lipid profiles and reduces oxidative stress markers.',
    },
    zulhXhosaRiverTradition: {
      umhlahlo: 'Zulu tradition includes umhlahlo — ritual cleansing in rivers or specially prepared water. This practice cleanses both physically and spiritually.',
      reedDanceWater: 'Swaziland\'s and Zulu\'s Reed Dance (Umhlanga) involves young women cutting reeds by rivers — the river water and reed-bathing is integral to the ceremony.',
      redOchreTradition: 'Xhosa traditional initiates (particularly during ulwaluko, male circumcision rites) are covered in white clay (umqombothi yomthimba), which includes local clay mixed with water. After initiation, the clay is washed off in a ritual river bath. The transition marked by water is fundamental to South African traditional practice.',
    },
  },

  'black-american': {
    communityId: 'black-american',
    communityName: 'Black American',
    waterContext: {
      traditional: 'Black American water beauty traditions connect multiple strands: West African origins (ocean, river, rain water practices), the American South (well water, creek bathing, Southern natural water), and contemporary developments. Water has also been a symbol of freedom and civil rights for Black Americans — from the Middle Passage to water fountains during segregation to today.',
      modern: 'Black American communities disproportionately face issues of water quality — Flint, Michigan\'s lead water crisis primarily affected a Black majority city. Water equity is a civil rights issue. Despite this, or because of it, water-conscious beauty traditions have developed.',
    },
    harshChlorinatedWater: {
      problem: 'Municipal water in the United States is typically chlorinated to eliminate pathogens. Chlorine and chloramine are effective disinfectants but harsh on hair — especially type 4 (kinky/coily) hair that is already prone to dryness.',
      hairEffect: 'Chlorine strips natural oils from the hair shaft, dramatically increasing dryness and breakage. For type 4 hair (already the driest hair type due to the coil structure preventing natural oil distribution down the shaft), chlorinated water worsens dryness exponentially. Chlorine also bleaches hair color and can turn color-treated hair green (copper + chlorine reaction).',
      solutions: {
        showerFilter: 'Install a vitamin C or KDF showerhead filter. Vitamin C neutralizes chlorine on contact. KDF (kinetic degradation fluxion) media reduces chlorine, heavy metals, and scale.',
        vitamincRinse: 'DIY chlorine neutralizer: 1/4 tsp vitamin C (ascorbic acid) dissolved in a spray bottle of water. Spray on hair before washing in chlorinated water.',
        prePooo: 'Pre-poo (pre-shampoo treatment): apply a fatty oil (shea, coconut, olive) to hair before washing. The oil creates a barrier that prevents chlorine from penetrating the hair shaft as deeply.',
      },
    },
    washDayCulture: {
      tradition: 'Wash day is a cornerstone of Black American natural hair culture. For women with type 4 natural hair, wash day is typically weekly or bi-weekly — a multi-hour ritual that includes prepoo, shampoo, deep condition, detangle, style. Water is central.',
      waterTemperature: {
        hot: 'Hot water opens the hair cuticle — good for clarifying shampoo phase and deep conditioning penetration. Caution: too hot dries the hair.',
        warm: 'Warm water for regular cleansing and conditioning — a balance between cleansing effectiveness and moisture retention.',
        cold: 'Cold water rinse at the END of wash day is critical for type 4 hair: it closes the hair cuticle, sealing in moisture and conditioning agents. This dramatically reduces the amount of moisture that escapes after styling. The "cold water rinse" step is taught early in natural hair communities.',
      },
      waterMethod: 'The "water method" is a natural hair technique where water is liberally applied to hair throughout the styling process — often with a spray bottle. Type 4 hair is hydrophilic but the coil structure makes water application difficult. Spritzing water regularly before applying products and during styling maintains moisture content.',
    },
    locMethodWater: {
      science: 'The LOC method (Liquid-Oil-Cream) used in Black American natural hair care explicitly acknowledges water (liquid) as the first step. Without water as the base, oils and creams sit on dry hair without providing real hydration.',
      liquidStep: 'Liquid means water or a water-based product (leave-in conditioner, aloe vera juice, rice water, rosewater). Water is the ONLY true moisturizer for hair — oils and butters moisturize by sealing water in, not by themselves providing moisture.',
      oilStep: 'Oil (coconut, jojoba, olive, castor, argan, avocado) seals the water in the hair shaft, slowing its escape. Applied over wet/moist hair.',
      creamStep: 'Cream (shea butter, hair butter, styling cream) provides additional sealing and defines curl/coil pattern.',
      waterQualityMatters: 'The water quality used in the LOC method significantly affects results. Soft or filtered water creates noticeably better moisture retention than hard chlorinated water.',
    },
    aloeVeraWater: {
      tradition: 'Aloe vera juice as a "water" substitute or addition is widely used in Black American natural hair communities. The aloe\'s gel contains 99.5% water plus active compounds.',
      hairBenefit: 'Aloe vera juice (not gel) applied to hair before other products: conditions the cuticle, provides humectant moisture, reduces frizz, defines coils. Its natural pH (~4.5) matches the hair shaft\'s ideal pH, improving cuticle laying.',
      use: 'Use pure aloe vera juice (not gel with preservatives and fillers) in the spray bottle. Can be mixed 50/50 with water or used straight. Apply to hair at the liquid step of LOC method.',
    },
    flintWaterCrisis: {
      context: 'The 2014-2019 Flint, Michigan water crisis — in which the state switched Flint\'s water supply without proper anti-corrosion treatment, leaching lead from aging pipes into the drinking water of predominantly Black American Flint — is the defining modern story of water inequity in America.',
      beautyImpact: 'Lead exposure from water was linked to hair loss in Flint residents. Lead is a heavy metal that interferes with the hair growth cycle. Community members reported significant hair thinning and shedding correlated with the water crisis.',
      chelation: 'Heavy metal chelation for hair and skin: Vitamin C helps bind and neutralize some heavy metals. EDTA (ethylenediaminetetraacetic acid) in chelating shampoos binds metal ions and removes them. Activated charcoal masks bind heavy metals from skin.',
      systemicNote: 'The Flint water crisis is not just a beauty story — it is a catastrophic public health failure and a case study in environmental racism. The communities most affected were low-income and majority Black American.',
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL WATER SCIENCE
// ─────────────────────────────────────────────────────────────────────────────

export const UNIVERSAL_WATER_BEAUTY = {
  waterTypes: {
    hard: {
      definition: 'Water containing dissolved calcium and magnesium salts above 120 mg/L (as calcium carbonate)',
      hairEffect: 'Deposits mineral scale on hair shaft. Makes hair dull, rough, prone to tangling. Prevents oil penetration. Reduces effectiveness of conditioning products.',
      skinEffect: 'Alkalinizes skin\'s acid mantle (pH 4.5-5.5 raised to 6-8). Disrupts skin barrier. Increases eczema flares (studies confirm correlation). Leaves mineral film that blocks pore function.',
      fix: ['Chelating shampoo (contains EDTA or citric acid) 1x weekly', 'Apple cider vinegar rinse after hair wash', 'Showerhead filter (vitamin C or KDF type)', 'Bottled mineral water as final rinse', 'Vitamin C or acidic toner on face after washing'],
    },
    soft: {
      definition: 'Water with less than 60 mg/L calcium carbonate',
      hairEffect: 'Hair may feel flat, limp, less voluminous. Soap is very difficult to rinse off.',
      skinEffect: 'Better for skin\'s acid mantle. Less eczema exacerbation. Soap rinses poorly — may leave residue.',
      fix: ['Use a small amount of mineral water as final rinse to restore some minerals to hair', 'Magnesium spray for hair body', 'Reduce soap/shampoo amount (excess lather in soft water = excess product)'],
    },
    ocean: {
      definition: '~3.5% sodium chloride plus magnesium, potassium, calcium, iodine, trace minerals',
      skinEffect: 'Mildly antimicrobial. Mineral-rich. Creates "ocean glow" via osmotic effect. Magnesium is anti-inflammatory.',
      hairEffect: 'Swells hair shaft, creates texture, defines natural wave/curl pattern',
      aftercare: 'Always rinse with fresh water and apply moisturizer after ocean water. Salt dries skin and hair if left on.',
    },
    mineral: {
      definition: 'Spring or mineral water with naturally occurring mineral content (not hard water minerals from pipes)',
      skinEffect: 'Natural mineral water (Evian, La Roche-Posay Thermal Spring Water, Avene) contains beneficial minerals: silica, bicarbonate, calcium. Thermal spring water of La Roche-Posay has documented anti-inflammatory effect studied in atopic dermatitis.',
      hairEffect: 'Natural mineral content provides body and texture to soft/fine hair',
      use: 'Use as face rinse, spray toner, or final hair rinse for mineral benefits',
    },
    fermented: {
      definition: 'Water that has had grains, rice, or other organic matter fermented in it',
      examples: ['Rice water (fermented)', 'Sake (very concentrated)', 'Pitera (SK-II)', 'Teff water', 'Kombucha'],
      skinEffect: 'Postbiotic compounds support skin microbiome. Lactic acid from fermentation provides gentle AHA exfoliation. Smaller molecular weight compounds penetrate skin more effectively.',
      hairEffect: 'Inositol (from grain fermentation) repairs damaged cuticle, reduces friction, improves strength.',
    },
  },
  pHAndWater: {
    skinPH: 'Skin\'s optimal pH is 4.5-5.5 (slightly acidic)',
    waterPH: 'Most municipal water is pH 7-8.5 (alkaline). Ocean water pH ~8.1. Rain water pH ~5.6. Spring water varies.',
    problem: 'Washing face with alkaline water temporarily raises skin\'s pH. High pH disrupts the acid mantle (the skin\'s protective acid barrier), increases bacterial overgrowth risk, reduces enzymes that degrade dead skin cells (they work optimally at low pH).',
    fix: 'Always follow cleansing with an acid-pH toner (rose water pH 4.5, ACV toner pH ~3, vitamin C serum). This restores the acid mantle rapidly.',
  },
  chlorineAndChloramine: {
    presence: 'All US municipal water, most Western European water. Required for pathogen control.',
    hairEffect: 'Strips natural oils. Raises hair shaft pH. Bleaches melanin (discolors color-treated hair). Breaks disulfide bonds (weakens protein structure).',
    skinEffect: 'Irritates sensitive skin. Disrupts skin microbiome. Worsens eczema and psoriasis.',
    mitigation: ['Vitamin C showerhead filter (most effective for chlorine)', 'Pre-shower vitamin C spray on hair', 'Vitamin C tablet dissolved in bathwater', 'Showering quickly (less exposure time)'],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// GETTER FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export function getWaterBeautyGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_WATER_BEAUTY_GUIDES['west-african'],
    'south-asian': ETHNIC_WATER_BEAUTY_GUIDES['south-asian'],
    'caribbean': ETHNIC_WATER_BEAUTY_GUIDES['caribbean'],
    'arab': ETHNIC_WATER_BEAUTY_GUIDES['arab'],
    'latina': ETHNIC_WATER_BEAUTY_GUIDES['latina'],
    'east-asian': ETHNIC_WATER_BEAUTY_GUIDES['east-asian'],
    'east-african': ETHNIC_WATER_BEAUTY_GUIDES['east-african'],
    'south-african': ETHNIC_WATER_BEAUTY_GUIDES['south-african'],
    'black-american': ETHNIC_WATER_BEAUTY_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

export const WATER_BEAUTY_STATS = {
  moduleId: 'water_beauty_ethnic_guide',
  communitiesCovered: 9,
  topicsCovered: ['Ocean water beauty', 'Rice water tradition', 'Rose water history', 'Hard water fixes', 'Hammam water ritual', 'Jjimjilbang cold plunge', 'Onsen mineral pools', 'Rainwater collection', 'Chlorine mitigation', 'LOC method water step'],
  version: '1.0.0',
};
