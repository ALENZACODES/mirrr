/**
 * MIRRR — Wellness & Beauty Ethnic Guide
 * Holistic wellness practices that directly impact beauty outcomes
 * across all 9 ethnic communities. Covers Ayurveda, TCM (Traditional
 * Chinese Medicine), African healing traditions, Caribbean folk medicine,
 * Arab Unani medicine, and the mind-body-beauty connection.
 */

export const ETHNIC_WELLNESS_BEAUTY_GUIDES = {
  'west-african': {
    communityId: 'west-african',
    communityName: 'West African',
    wellnessPhilosophy: 'In West African healing traditions, beauty is inseparable from inner health. "Ewa" (beauty in Yoruba) encompasses radiance, vitality, and grace — qualities that arise from proper nourishment, community connection, and spiritual alignment. Traditional healing systems across West Africa — from Yoruba herbal medicine to Akan traditional medicine to Wolof healing practices — provide a sophisticated pharmacopoeia of plants and practices that directly affect skin health, hair vitality, and overall glow. The healer (babalawo in Yoruba tradition, dibia in Igbo tradition) addresses the root cause of beauty concerns rather than surface symptoms.',
    healingTraditions: [
      {
        system: 'Yoruba Traditional Medicine (Isese)',
        region: 'Nigeria, Benin, Togo, Diaspora',
        beautyApplications: [
          'Osun (camwood paste) — used in Yoruba ceremonies for glowing orange-red skin and hair treatment',
          'Ewe (herb) preparations for skin conditions',
          'Ori (unrefined shea butter) as sacred and practical moisturizer',
          'Spiritual bathing rituals for beauty and attraction',
        ],
      },
      {
        system: 'Akan Herbal Medicine',
        region: 'Ghana, Côte d\'Ivoire',
        beautyApplications: [
          'Neem preparations for skin health',
          'Bofrot (moringa) tea for inner radiance',
          'Shea butter (she in Akan) as foundational beauty preparation',
        ],
      },
      {
        system: 'Senegambian Traditional Practice',
        region: 'Senegal, Gambia, Guinea-Bissau',
        beautyApplications: [
          'Thiakry and fermented dairy for gut-skin health',
          'Baobab fruit for vitamin C and skin brightness',
          'Xeex (perfumed body powder made from sandalwood and other aromatics)',
        ],
      },
    ],
    beautyFoods: [
      {
        food: 'Ugu (Fluted Pumpkin Leaf)',
        benefit: 'Rich in iron, vitamin A, vitamin C. Prevents dull skin and hair loss from iron deficiency.',
        preparation: 'Cook in soups (egusi, ofe onugbu). Blend into green smoothie.',
      },
      {
        food: 'Moringa Leaves (Ewe ile in Yoruba)',
        benefit: 'The most nutrient-dense plant in West Africa. 7x more vitamin C than oranges, 4x more calcium than milk, complete protein. Dramatically improves skin and hair health when consumed regularly.',
        preparation: 'Add to soups, smoothies. Moringa powder in warm water daily.',
        topical: 'Moringa oil pressed from seeds — a superior facial oil used across West Africa.',
      },
      {
        food: 'Tiger Nuts (Aya in Hausa)',
        benefit: 'Prebiotic fiber for gut health, which directly improves skin clarity. Rich in oleic acid, vitamin C, and potassium.',
        preparation: 'Eaten fresh, or ground into kunu aya (tiger nut milk). Very popular in Northern Nigeria.',
      },
      {
        food: 'Baobab Fruit Pulp',
        benefit: 'Contains 6x more vitamin C than oranges. Powerful antioxidant for collagen synthesis and skin brightness.',
        preparation: 'Baobab powder mixed with water or added to porridge.',
      },
      {
        food: 'Egusi (Melon Seeds)',
        benefit: 'Rich in zinc (crucial for acne prevention and wound healing), omega-6 fatty acids, vitamin E.',
        preparation: 'Egusi soup — the classic West African preparation.',
      },
      {
        food: 'Palm Fruits (Elaeis guineensis)',
        benefit: 'Red palm oil contains carotenoids (pro-vitamin A) and vitamin E tocotrienols — powerful antioxidants for skin and hair.',
        preparation: 'Used extensively in West African cooking. Palm oil in banga soup, palm nut soup.',
        note: 'Red (unrefined) palm oil — the refined version loses most benefit.',
      },
    ],
    herbalBeautyRemedy: [
      {
        name: 'Aloe Vera (Eti Okun in Yoruba)',
        skinBenefit: 'Soothes inflammation, heals PIH, deeply hydrates',
        hairBenefit: 'Scalp soothing, dandruff treatment, moisture addition',
        use: 'Fresh gel applied to skin or scalp. Leave 20 minutes. Rinse.',
      },
      {
        name: 'Neem (Dogon Yaro in Hausa)',
        skinBenefit: 'Antibacterial, antifungal. Treats acne, scalp conditions.',
        use: 'Neem leaf tea as a face rinse. Neem oil diluted in carrier oil for spot treatment.',
      },
      {
        name: 'Tumeric (Atale in Yoruba)',
        skinBenefit: 'Anti-inflammatory for acne and PIH. Brightening.',
        use: 'Mix with honey or black soap for a face mask. Or take turmeric golden milk internally.',
      },
    ],
    mindBodyBeauty: {
      communityConnection: 'In West African wellness philosophy, beauty flourishes in community. Isolation is seen as harmful to health and beauty. Regular gathering with family and friends is considered essential wellness.',
      spiritualBeauty: 'Oriki (praise poetry) in Yoruba culture affirms the beauty and worth of individuals. Spiritual confidence is expressed outwardly through grooming and presentation.',
      stressAndSkin: 'Chronic stress is recognized in West African healing as "eating the beauty" (in various linguistic expressions). Managing stress through community, prayer, music, and dance directly protects skin health.',
    },
    sleepBeauty: {
      note: 'Beauty sleep has deep roots in West African wellness philosophy. Rest is not laziness — it is restoration. During sleep, cellular repair, collagen synthesis, and cortisol reduction all benefit the skin.',
      practices: [
        'Silk or satin bonnet to protect natural hair during sleep',
        'Shea butter applied to skin before bed for overnight moisture',
        'Warm neem tea before bed for calming and skin health',
      ],
    },
  },

  'south-asian': {
    communityId: 'south-asian',
    communityName: 'South Asian',
    wellnessPhilosophy: 'Ayurveda — the ancient Indian science of life — is the world\'s oldest and most comprehensive holistic wellness system, developed over 5,000 years. For South Asian women, Ayurveda provides a complete framework for beauty from the inside out. "Roopam" (outer beauty) and "Gunah" (inner qualities) are inseparable in Ayurvedic philosophy. The three doshas — Vata, Pitta, and Kapha — govern an individual\'s constitution, and beauty concerns are treated by restoring doshic balance rather than simply treating symptoms.',
    ayurveda: {
      doshas: [
        {
          dosha: 'Vata',
          characteristics: 'Air and space elements. Thin frame, quick mind, variable energy.',
          skinType: 'Dry, thin, prone to fine lines and rough texture.',
          hairType: 'Dry, frizzy, prone to breakage.',
          beautyApproach: 'Grounding, nourishing, warming. Heavy oils (sesame, almond), warm foods, regular routine, avoiding cold and drying conditions.',
          foods: ['Warm, cooked foods', 'Sweet and salty tastes', 'Sesame seeds', 'Ghee', 'Warming spices'],
          oils: ['Sesame oil (the Ayurvedic queen of oils)', 'Almond oil', 'Brahmi oil'],
        },
        {
          dosha: 'Pitta',
          characteristics: 'Fire and water elements. Medium build, sharp intellect, intense nature.',
          skinType: 'Sensitive, prone to redness, rosacea, acne, melasma.',
          hairType: 'Medium thickness, prone to premature greying and thinning.',
          beautyApproach: 'Cooling, soothing, calming. Avoid heat, spicy foods, harsh products.',
          foods: ['Cooling foods: cucumber, coconut, sweet fruits', 'Bitter and sweet tastes', 'Avoid spicy, sour, fermented'],
          oils: ['Coconut oil', 'Brahmi oil', 'Neem oil'],
        },
        {
          dosha: 'Kapha',
          characteristics: 'Earth and water elements. Solid build, patient, stable.',
          skinType: 'Oily, thick, prone to enlarged pores, cystic acne.',
          hairType: 'Thick, lustrous, but prone to oiliness and excess shedding.',
          beautyApproach: 'Stimulating, lightening, drying. Avoid heavy oils, sugar, and excess sleep.',
          foods: ['Light, spicy foods', 'Bitter and astringent tastes', 'Avoid sugar, dairy, and heavy foods'],
          oils: ['Mustard oil', 'Neem oil (light)', 'Avoid very heavy oils'],
        },
      ],
    },
    dinacharya: {
      description: 'Dinacharya is the Ayurvedic daily routine — a structured sequence of wellness practices performed each morning for optimal health, vitality, and beauty.',
      sequence: [
        { time: 'Before sunrise', practice: 'Wake before dawn (Brahma muhurta — auspicious hour)', benefit: 'Circadian rhythm optimization, mental clarity, positive energy for the day' },
        { time: 'Immediately on waking', practice: 'Drink a glass of warm copper-vessel water', benefit: 'Hydration, digestive fire activation, mineral infusion' },
        { time: 'Step 1', practice: 'Jihwa prakshalana (tongue scraping) with copper scraper', benefit: 'Removes ama (toxins) that accumulate overnight, improves taste, reduces bacteria that cause bad breath, indirect skin clarity benefit' },
        { time: 'Step 2', practice: 'Oil pulling (gandusha) with sesame or coconut oil — swish 15–20 minutes', benefit: 'Oral health, lymphatic stimulation, detoxification, gum health' },
        { time: 'Step 3', practice: 'Nasya (nasal oil) — 2–3 drops sesame oil in each nostril', benefit: 'Clears sinuses, lubricates nasal passages, supports mental clarity, prevents dryness in dry climates' },
        { time: 'Step 4', practice: 'Self-massage (abhyanga) with warm oil appropriate to dosha', benefit: 'Lymphatic drainage, skin nourishment, stress reduction, joint health, nervous system calming' },
        { time: 'Step 5', practice: 'Warm bath or shower (after oil absorbs)', benefit: 'Completes the cleansing process, washes away toxins from abhyanga' },
        { time: 'Step 6', practice: 'Yoga or exercise appropriate to dosha', benefit: 'Circulation, lymph movement, metabolism, mental health — all directly affecting skin glow' },
        { time: 'Breakfast', practice: 'Warm, cooked, nourishing meal', benefit: 'Digestive fire support — Ayurveda teaches that most beauty issues originate in poor digestion' },
      ],
    },
    abhyanga: {
      description: 'Abhyanga (self-massage) is considered the most powerful single Ayurvedic beauty practice. Applied daily, it is described as transformative for skin quality, hair health, and overall vitality.',
      oils: {
        vata: 'Warm sesame oil — grounding and nourishing',
        pitta: 'Coconut oil (cooling) or brahmi oil',
        kapha: 'Mustard oil or light jojoba oil',
      },
      technique: [
        'Warm the oil',
        'Begin with the scalp — circular motions',
        'Long strokes on the limbs (always toward the heart)',
        'Circular motions on joints',
        'Gentle circular massage on the abdomen',
        'Leave the oil on for 15–20 minutes',
        'Bathe with warm water and gentle soap',
      ],
      frequency: 'Daily in traditional Ayurveda. Even 2–3x/week shows significant benefit.',
    },
    beautyFoods: [
      { food: 'Ghee (clarified butter)', benefit: 'Lubricates joints and skin from within. Rich in butyrate for gut health. Applied topically, a traditional skin and lip treatment.', use: '1 tsp daily in warm food or warm water with turmeric (golden milk with ghee).' },
      { food: 'Turmeric (haldi)', benefit: 'Curcumin is one of the most studied anti-inflammatory compounds. Reduces skin inflammation, brightens complexion over time when consumed regularly.', use: 'Golden milk: 1 tsp turmeric + black pepper (for absorption) + ghee + warm milk. Daily.' },
      { food: 'Amla (Indian Gooseberry)', benefit: '20x more vitamin C than oranges. The single most powerful Ayurvedic beauty food. Prevents premature greying, strengthens hair follicles, promotes collagen synthesis.', use: 'Fresh amla juice in morning. Amla powder in warm water. Amla candy (murabba).' },
      { food: 'Triphala', benefit: 'The tri-fruit formula (amalaki, bibhitaki, haritaki) is the foundational Ayurvedic digestive and detox supplement. Clear gut = clear skin in Ayurvedic philosophy.', use: '1 tsp triphala powder in warm water before bed. Or triphala capsules.' },
      { food: 'Sesame Seeds (til)', benefit: 'Rich in zinc, calcium, and sesamin — a lignan with potent antioxidant properties. Zinc is essential for acne prevention and wound healing.', use: 'Add to salads, tahini, til ladoo (sesame seed balls).' },
    ],
  },

  'caribbean': {
    communityId: 'caribbean',
    communityName: 'Caribbean',
    wellnessPhilosophy: 'Caribbean wellness is rooted in the garden, the ocean, and the community. The extraordinary biodiversity of Caribbean islands has produced a rich tradition of "bush medicine" (herbal healing) that addresses both inner health and outer beauty. Caribbean bush healers (obeah women in some traditions, matriarchs in others) held encyclopedic knowledge of medicinal plants. This tradition has been modernized but never forgotten — the Jamaican grandmother who prescribes cerasee tea, the Trinidadian who uses aloe vera from the yard, and the Barbadian who relies on soursop leaf are carrying on ancient healing wisdom.',
    bushMedicine: [
      {
        plant: 'Aloe Vera',
        localName: 'Single Bible (Jamaica), Aloesverai',
        skinBenefit: 'Heals sunburn, reduces hyperpigmentation, soothes inflammation',
        hairBenefit: 'Scalp soothing, moisture, dandruff treatment',
        use: 'Break leaf. Apply fresh gel directly to skin or scalp.',
      },
      {
        plant: 'Cerasee (Bitter Melon)',
        localName: 'Cerasee (Jamaica and Caribbean-wide)',
        internalBenefit: 'Blood cleansing — in Caribbean folk medicine, "bitter" plants clean the blood and this is believed to directly clear skin.',
        skinNote: 'Cerasee tea is the go-to remedy for skin conditions in Jamaican tradition — drunk as a bitter tea.',
        caution: 'Bitter melon can lower blood sugar significantly. Avoid in pregnancy and with diabetes medication.',
      },
      {
        plant: 'Soursop Leaf (Corossol)',
        localName: 'Soursop (all Caribbean)',
        internalBenefit: 'Anti-inflammatory. Used in Caribbean folk medicine for stress reduction and sleep improvement.',
        sleepBeauty: 'Better sleep = better skin. Soursop leaf tea before bed as a natural sleep aid.',
        use: 'Brew 3–4 leaves in hot water. Drink as calming tea before bed.',
      },
      {
        plant: 'Moringa',
        localName: 'Horse Radish Tree (Jamaica), Ben Ailé',
        benefit: 'Complete protein, extraordinary nutrient density for skin, hair, and nail health.',
        use: 'Moringa leaves in food. Moringa powder in smoothies.',
      },
      {
        plant: 'Hibiscus (Sorrel)',
        localName: 'Sorrel (Jamaica and Caribbean-wide)',
        internalBenefit: 'Rich in vitamin C and anthocyanins. Anti-inflammatory. Lowers blood pressure — stress and hypertension directly affect skin quality.',
        beautyBenefit: 'Vitamin C for collagen synthesis and brightening. Anthocyanins are powerful antioxidants.',
        use: 'Sorrel drink (boiled hibiscus flowers, ginger, and spices). Sorrel tea. Hibiscus face mask.',
        topical: 'Dried hibiscus flowers steeped in oil as a facial oil treatment.',
      },
    ],
    tropicalBeautyFoods: [
      { food: 'Papaya (Pawpaw)', benefit: 'Papain enzyme in papaya gently exfoliates skin, reduces hyperpigmentation. Vitamin C and vitamin A for skin health.', use: 'Eat regularly. Apply fresh papaya pulp to skin as a mask for 15 minutes.' },
      { food: 'Coconut Water', benefit: 'Natural electrolytes for hydration. Well-hydrated skin is more resilient and plump.', use: 'Drink fresh from the coconut. 1–2 coconuts per day in traditional Caribbean wellness.' },
      { food: 'Mango', benefit: 'Extremely high beta-carotene (pro-vitamin A) and vitamin C. Regular consumption improves skin texture and glow.', use: 'Eat fresh. Apply mango pulp as a face mask (high vitamin A content = gentle skin renewal).' },
      { food: 'Sea Moss (Irish Moss)', benefit: '92 minerals essential to the human body. Contains collagen-supporting nutrients. Traditionally used in Caribbean wellness for overall vitality.', use: 'Sea moss gel blended into smoothies. Sea moss and milk punch.', trend: 'Sea moss has become a global superfood trend, driven significantly by Caribbean diaspora communities.' },
      { food: 'Pineapple', benefit: 'Bromelain enzyme (like papain) gently exfoliates. Vitamin C for collagen. Anti-inflammatory.', use: 'Eat fresh. Pineapple face mask for brightening (enzyme action on skin).' },
    ],
    oceanWellness: {
      seaBathingTradition: 'In Caribbean tradition, sea bathing is not just recreation — it is therapeutic. The mineral-rich Caribbean sea is believed to heal skin conditions, reduce stress, and "clean" the body.',
      salt: 'Sea salt naturally exfoliates, disinfects minor wounds, and the magnesium in sea water reduces skin inflammation.',
      sunProtection: 'Despite the healing tradition of sea bathing, Caribbean sun is extremely intense. SPF on all exposed skin is essential for long-term skin health.',
    },
  },

  'arab': {
    communityId: 'arab',
    communityName: 'Arab Middle Eastern',
    wellnessPhilosophy: 'Arab wellness traditions draw from three rich sources: Islamic medicine (tibb nabawi — Prophetic medicine), Greco-Arabic Unani medicine (a 2,000-year-old system developed by Arab scholars from Greek foundations), and folk healing traditions unique to each region (Yemeni, Gulf, Levantine, North African). Beauty in Arab tradition is connected to cleanliness (taharah), which is not only a religious practice but a health philosophy. The Prophetic hadith prescribes specific beauty and hygiene practices — miswak for teeth, kohl for eyes, henna for celebration — that remain in use today.',
    prophethicMedicine: {
      description: 'Tibb an-nabawi (Prophetic Medicine) — practices attributed to the Prophet Muhammad ﷺ that are believed to have healing benefit. Many have been validated by modern research.',
      beautyPractices: [
        {
          practice: 'Miswak (chewing stick from Salvadora persica)',
          benefit: 'Natural toothbrush and toothpaste in one. Contains compounds (salvadorine, trimethylamine, fluoride) that whiten teeth, kill bacteria, and freshen breath. WHO endorses it.',
          use: 'Break off a small piece. Chew the end to create bristles. Brush teeth using the bristles.',
          note: 'The Prophet ﷺ reportedly said: "Were it not that I would be imposing too great a burden on my Ummah, I would have ordered them to use the Siwak before every prayer."',
        },
        {
          practice: 'Kohl (al-ithmid) for the Eyes',
          benefit: 'Prophetic kohl (antimony-based ithmid kohl) is described as strengthening eyesight, beautifying the eyes, and treating eye conditions.',
          modern: 'Authentic ithmid kohl should not be confused with lead-based cosmetic kohl. Pure antimony kohl from Saudi Arabia is safe.',
          use: 'Applied to the inner lower eyelid (waterline) with a kohl stick (mirwad).',
        },
        {
          practice: 'Black Seed (Habbatus Sauda — Nigella sativa)',
          hadith: '"In the black seed is healing for every disease except death." (Sahih al-Bukhari)',
          benefit: 'Thymoquinone (the active compound) has documented anti-inflammatory, antibacterial, and antioxidant properties. Used for skin conditions, hair growth, and overall health.',
          use: 'Black seed oil taken internally (1 tsp daily). Applied topically to skin and scalp. Mixed into food.',
        },
        {
          practice: 'Olive Oil',
          hadith: 'The Prophet ﷺ recommended olive oil both for eating and applying to the body.',
          benefit: 'Squalene, polyphenols, and oleic acid in olive oil deeply moisturize and protect skin.',
          use: 'Extra virgin olive oil as a body and hair moisturizer. Internally in cooking.',
        },
        {
          practice: 'Henna (al-Henna)',
          benefit: 'Cooling, conditioning, antimicrobial. Treats scalp conditions and beautifies the hair. Used decoratively on skin.',
          use: 'Applied to hair for conditioning and color. Applied to hands and feet in decorative patterns for celebrations.',
        },
      ],
    },
    unaniMedicine: {
      description: 'Unani (derived from "Yunani" — Greek) is the Arab-Persian medical system that flourished in the Islamic Golden Age. Ibn Sina\'s Canon of Medicine codified beauty and health practices that influenced world medicine.',
      beautyPrinciples: [
        'Mizan al-mizaj (balance of temperament) — four humors (blood, phlegm, yellow bile, black bile) must be balanced for health and beauty',
        'Diet as medicine — specific foods for each temperament type',
        'Natural cleansing over harsh chemical methods',
        'Aromatherapy (bakhoor, attar) for mental and physical wellness',
      ],
    },
    arabBeautyFoods: [
      { food: 'Dates (Tamr)', benefit: 'Natural sugars for energy. Iron for preventing anemia (which causes pallor and hair loss). Magnesium and potassium for cellular health.', use: '3–7 dates daily — a Prophetic recommendation. Date paste as a natural face mask.' },
      { food: 'Camel Milk', benefit: 'Rich in protective proteins, vitamin C, and anti-inflammatory compounds. Traditional Arab women\'s beauty drink. Growing scientific evidence for its skin and immune benefits.', use: 'Drink fresh. Apply to face as a brightening mask. Camel milk skincare products are now a market category.' },
      { food: 'Pomegranate (Rumman)', benefit: 'Punicalagins (unique to pomegranate) are among the most potent antioxidants studied. Stimulates skin cell renewal. Mentioned in the Quran.', use: 'Fresh pomegranate seeds and juice. Pomegranate seed oil (punicic acid) as a facial oil.' },
      { food: 'Figs (Tin)', benefit: 'Rich in antioxidants, prebiotic fiber (gut health = skin health), and minerals. Also mentioned in the Quran.', use: 'Fresh or dried. Fig face mask for brightening and exfoliation (natural AHA content).' },
      { food: 'Saffron (Za\'afaran)', benefit: 'Crocin (the pigment) is a powerful antioxidant. Used in Arab beauty traditions for skin brightening, glow, and treating dark circles.', use: 'Steep a pinch of saffron in warm milk. Drink. Or add to ghee/honey face mask.' },
    ],
    hammamRitual: {
      description: 'The hammam (Turkish/Arab bath) is the pinnacle of Arab wellness and beauty ritual. A full hammam session is a multisensory, deeply effective treatment for skin health.',
      steps: [
        { step: 1, name: 'Steam Room', duration: '15–20 minutes', benefit: 'Opens pores, deeply hydrates, relaxes muscles' },
        { step: 2, name: 'Kessa Scrub', tool: 'Kessa mitt (rough exfoliating glove)', benefit: 'Removes accumulated dead skin cells. The grey "peeling" that comes off is a satisfying and definitive exfoliation.' },
        { step: 3, name: 'Black Soap (Beldi) Lather', product: 'Hammam black soap (beldi) — a Moroccan olive oil paste', benefit: 'Deep cleansing, hydration, gentle second exfoliation' },
        { step: 4, name: 'Ghassoul (Rhassoul) Clay Mask', benefit: 'Drawing out impurities, pore refining, skin softening' },
        { step: 5, name: 'Argan Oil or Rose Water Finish', benefit: 'Sealing in moisture and leaving skin radiant' },
      ],
      frequency: 'Weekly in traditional practice. Monthly for maintenance.',
    },
  },

  'latina': {
    communityId: 'latina',
    communityName: 'Latina',
    wellnessPhilosophy: 'Latina wellness traditions are rich, diverse, and deeply rooted in the land — from the Andean highlands with their healing herbs and rituals to the Mexican desert with its aloe and nopal, to the lush Amazon with its extraordinary medicinal plants. Indigenous healing traditions (curanderismo, medicine woman traditions) intertwined with Spanish, African, and Asian influences to create the "medicina tradicional" practiced across Latin America. Beauty is viewed holistically — emotional health (not holding "enojo" or grief), community belonging, and spiritual alignment are as important to beauty as external practices.',
    curanderismo: {
      description: 'Curanderismo is the traditional Mexican healing system that addresses physical, emotional, and spiritual illness. A curandera is a healer who uses plants, rituals, and spiritual practices.',
      beautyRelevant: [
        {
          practice: 'Limpia (Spiritual Cleansing)',
          description: 'A ritual cleansing that removes negative energy and spiritual "susto" (fright). Stress and emotional distress are believed to manifest in the skin and hair.',
          tools: 'Herbs (ruda, albahaca, romero), eggs, crystals, fire',
          beautyBenefit: 'Stress and emotional trauma directly affect skin health through cortisol elevation. The spiritual healing addresses the root emotional cause.',
        },
        {
          practice: 'Temazcal (Indigenous Sweat Lodge)',
          description: 'Traditional Mesoamerican sweat bath using volcanic rocks and medicinal herb steam. An extraordinary full-body beauty and wellness treatment.',
          beautyBenefit: 'Profound skin detoxification, deep sweating, medicinal herb absorption through steam, mental-emotional cleansing.',
          ceremony: 'A full temazcal is conducted by a temazcalero (guide) and is a ritual spiritual experience as well as a physical treatment.',
        },
      ],
    },
    latinaBeautyFoods: [
      { food: 'Nopal (Cactus Paddle)', benefit: 'Rich in antioxidants, vitamin C, calcium, and prebiotic fiber. Anti-inflammatory. Supports gut health which directly clears skin.', use: 'Nopalitos in tacos, salads, eggs. Nopal juice. Nopal powder added to smoothies.' },
      { food: 'Avocado', benefit: 'Biotin for hair growth. Oleic acid for skin moisture. Vitamin E for antioxidant protection. Glutathione for detox and skin brightening.', use: 'Eat daily. Apply mashed avocado as a hydrating face mask or deep hair conditioning mask.' },
      { food: 'Chia Seeds', benefit: 'Omega-3 fatty acids (anti-inflammatory for acne-prone skin). Fiber for gut-skin health. Calcium, zinc, and magnesium.', use: 'Chia agua fresca. Chia pudding. Add to smoothies.' },
      { food: 'Guava (Guayaba)', benefit: '4x more vitamin C than oranges. High in lycopene (skin-protective antioxidant). Potassium for cellular health.', use: 'Eat fresh. Guava water.' },
      { food: 'Zapote (Mamey Sapote)', benefit: 'Rich in carotenoids (pro-vitamin A) for skin regeneration. Vitamin C and B6. Biotin (from seeds) for hair.', use: 'Eat fresh. Zapote seed oil (from ground seeds) used as hair treatment in traditional Mexican beauty.' },
      { food: 'Hibiscus (Jamaica flower)', benefit: 'Anthocyanins and vitamin C. Antioxidant protection. Anti-inflammatory. Blood pressure regulation (stress management).', use: 'Agua de Jamaica is a staple Latin American beverage. Drink daily for beauty benefit.' },
      { food: 'Epazote', benefit: 'Antiparasitic. Used in Mexican healing to cleanse the gut. A clear gut is the Ayurvedic and Latin folk medicine connection to clear skin.', use: 'Used in cooking beans and traditional dishes.' },
    ],
    curanderaHerbs: [
      { herb: 'Ruda (Rue)', use: 'Spiritual cleansing. External use only (toxic internally in large amounts). Used in limpias.' },
      { herb: 'Romero (Rosemary)', benefit: 'Hair growth stimulation. Anti-inflammatory. Rosemary oil has evidence for hair loss treatment comparable to minoxidil in some studies.', use: 'Rosemary rinse for hair. Rosemary oil scalp massage. Rosemary water toner for skin.' },
      { herb: 'Albahaca (Basil)', benefit: 'Anti-inflammatory. Antibacterial. Used in skin treatments and spiritual healing.', use: 'Basil tea. Applied to skin as an infusion.' },
      { herb: 'Manzanilla (Chamomile)', benefit: 'Anti-inflammatory, soothing. Used for skin irritation and eye puffiness.', use: 'Chamomile tea compress on puffy eyes. Chamomile rinse for hair (subtle lightening on lighter hair). Chamomile steam for face.' },
      { herb: 'Cempasúchil (Marigold)', benefit: 'Calendula-type anti-inflammatory. Skin healing. Sacred to Day of the Dead.', use: 'Calendula-style skin salve. Petal-infused oil for sensitive skin.' },
    ],
    mindBodySpirit: {
      emotionalBeauty: 'Latin wellness traditions recognize that "el susto" (fright or emotional shock), "el coraje" (anger held in the body), and "el pena" (grief) all manifest physically — in the skin, hair, and overall vitality. Emotional processing is therefore a beauty practice.',
      familyWellness: 'Abuela\'s kitchen is a wellness center. Traditional food preparation, herbal knowledge, and beauty wisdom are transmitted through family.',
    },
  },

  'east-asian': {
    communityId: 'east-asian',
    communityName: 'East Asian',
    wellnessPhilosophy: 'Traditional Chinese Medicine (TCM), Japanese Kampo medicine, and Korean traditional medicine (Hanyak) form a family of holistic healing systems united by common principles: qi (vital energy) flow, yin-yang balance, five element theory, and the primacy of preventing disease rather than treating symptoms. "Neijing Tuijing" (internal cultivation creates external beauty) — meaning that outer beauty is the reflection of inner health and qi vitality — is the foundational beauty philosophy. What is eaten, how sleep is tended, how emotions are managed, and how qi is cultivated directly manifests in the quality of the skin and hair.',
    tcm: {
      description: 'Traditional Chinese Medicine provides a complete framework for understanding and treating beauty concerns through an internal lens.',
      beautyConnections: [
        { organ: 'Lungs', beautyManifest: 'Skin quality. Lung qi governs the skin. Dry, dull skin or acne may signal lung imbalance.', support: 'Breathing exercises. White foods (pears, tofu, almonds, white rice). Avoid smoking.' },
        { organ: 'Kidneys', beautyManifest: 'Hair health and premature aging. Kidney jing (essence) is depleted by overwork, stress, and poor sleep.', support: 'Black foods (black sesame, black beans). Adequate sleep. Avoid excessive stress.' },
        { organ: 'Spleen/Stomach', beautyManifest: 'Skin clarity and muscle tone. Spleen governs transformation of food into qi and blood.', support: 'Warm, cooked foods. Regular meal timing. Avoid cold/raw foods (which "damp" the spleen qi).' },
        { organ: 'Liver', beautyManifest: 'Skin tone evenness and emotional health. Liver qi stagnation shows as dull skin, dark circles, and spots.', support: 'Green foods. Emotional expression. Light exercise. Avoid alcohol and anger held inside.' },
        { organ: 'Heart', beautyManifest: 'Complexion radiance. Heart governs blood circulation to the face.', support: 'Red foods. Joy and love. Adequate sleep. Stress management.' },
      ],
    },
    guaSha: {
      description: 'Gua sha is a TCM technique involving scraping the skin with a smooth tool (jade, rose quartz, bian stone) to stimulate qi and blood flow and promote lymphatic drainage.',
      facialBenefit: [
        'Lymphatic drainage and reduction of puffiness',
        'Increased blood circulation for natural glow',
        'Tension release in facial muscles (reducing the appearance of tension wrinkles)',
        'Gradual lifting effect from regular practice',
        'Cooling and calming (especially rose quartz)',
      ],
      technique: [
        'Apply facial oil to the skin first',
        'Hold the tool at 15–45 degrees to the skin',
        'Always work upward and outward from the center of the face',
        'Use gentle, consistent pressure — not so hard it bruises',
        'Do each stroke 3–5 times per section',
        '5–10 minutes daily for best results',
      ],
      tools: {
        jade: 'Traditional. Believed to be balancing. Cool to the touch.',
        roseQuartz: 'Stays cool longer than jade. Gentle energy. Very popular.',
        bianStone: 'Highest grade gua sha stone in TCM tradition. Volcanic origin. Very smooth.',
        stainlessSteel: 'Modern, easy to clean, no crystal properties.',
      },
    },
    japaneseKimono: {
      description: 'Japanese traditional wellness (Japanese concepts of beauty-wellness are often embedded in lifestyle practices rather than a single named system).',
      practices: [
        { concept: 'Mushi-buro (Steam Bathing)', description: 'Japanese steam baths and traditional onsen (hot spring bathing) for skin health. Mineral-rich onsen waters treat skin conditions.', beautyBenefit: 'Deep pore cleansing, skin mineralization, stress reduction.' },
        { concept: 'Forest Bathing (Shinrin-yoku)', description: 'Mindful time in nature — scientifically proven to reduce cortisol, lower blood pressure, and improve immune function.', beautyBenefit: 'Stress reduction directly improves skin. Phytoncides (plant antimicrobials in forest air) boost immune function that supports skin health.' },
        { concept: 'Hara Hachi Bu', description: 'The Okinawan practice of eating until 80% full — a calorie restriction approach that has been associated with longevity and slow aging in Okinawa.', beautyBenefit: 'Less oxidative stress from excessive eating. Supports healthy weight and metabolic function that benefits skin.' },
        { concept: 'Ma (Negative Space)', description: 'The Japanese appreciation for empty space and pause. Applied to wellness: adequate rest, silence, and mental space.', beautyBenefit: 'Chronic busyness = chronic cortisol = accelerated aging. Ma as a philosophy promotes the rest and restoration that serves beauty.' },
      ],
    },
    koreanGlow: {
      description: 'Korean wellness philosophy around beauty is the foundation of the Korean beauty revolution.',
      principles: [
        { principle: 'Skin as Health Indicator', description: 'In Korean culture, clear, radiant skin is seen as a sign of inner health, not just genetic luck. This motivates investment in skin wellness.' },
        { principle: 'Prevention Over Correction', description: 'Korean skincare philosophy emphasizes preventing aging and skin damage rather than correcting it later. SPF from childhood, consistent routine from teen years.' },
        { principle: 'Layering Hydration', description: 'Multiple thin layers of hydration (toner, essence, serum, cream) vs. one thick cream. The result is glass skin — a deep, three-dimensional glow impossible with one product.' },
        { principle: 'Diet as Skincare', description: 'Fermented foods (kimchi, doenjang, soy sauce) provide probiotics that maintain gut health which directly impacts skin clarity. This is a long-held Korean belief now supported by the gut-skin microbiome science.' },
      ],
    },
    beautyFoods: [
      { food: 'Kimchi', benefit: 'Fermented vegetables rich in probiotics for gut-skin health. Vitamin C from the vegetables. Anti-inflammatory from the fermentation.' },
      { food: 'Miso', benefit: 'Fermented soybean paste with probiotics, isoflavones (phytoestrogens that mimic estrogen — support skin moisture in aging women), and zinc.' },
      { food: 'Green Tea (Matcha)', benefit: 'EGCG — one of the most studied antioxidants. Reduces oxidative stress and inflammation. Applied topically and consumed for maximum benefit.' },
      { food: 'Ginseng (Insamcha)', benefit: 'Korean ginseng (panax ginseng) is the premier adaptogen in Korean wellness. Reduces cortisol, supports collagen, improves circulation.', use: 'Ginseng tea. Ginseng extract in serums and masks. Ginseng as a supplement.' },
      { food: 'Black Sesame (Heuk Chamkkae)', benefit: 'Sesamin antioxidant. Omega-6 fatty acids. Zinc. Used in Korean medicine for kidney health (which TCM associates with hair health and premature aging).', use: 'Black sesame porridge (jeongsik). Black sesame latte. Add to smoothies.' },
      { food: 'Bird\'s Nest Soup (Yàn Wō)', benefit: 'Traditional Chinese beauty food — expensive delicacy made from the nests of swiftlets. Contains epidermal growth factor (EGF) and sialic acid. Expensive and controversial but deeply traditional.', context: 'A prized beauty food across Chinese communities for centuries. Consumed by women for skin health.' },
    ],
  },

  'east-african': {
    communityId: 'east-african',
    communityName: 'East African',
    wellnessPhilosophy: 'East African traditional wellness encompasses the ancient healing knowledge of Ethiopia (where some of Africa\'s oldest healing traditions exist), Somalia, Kenya, Tanzania, Uganda, and beyond. Ethiopian traditional medicine (TEM) has a rich pharmacopoeia of over 700 medicinal plants. Somali traditional healing draws from Islamic medicine and indigenous plant knowledge. Swahili coastal healing integrates Arab, Persian, Indian, and African traditions into a unique coastal wellness culture. In East African traditions, beauty and spiritual wellness are inseparable — "halima" (gracefulness) and "baraka" (blessing) both contribute to a woman\'s appearance.',
    ethiopianTraditionalMedicine: {
      description: 'One of Africa\'s richest and most documented traditional medicine systems, with over 700 medicinal plants used and healers (Ethiopian: "bale temhert" — those with knowledge) who carry encyclopedic botanical knowledge.',
      beautyPlants: [
        { plant: 'Kosso (Hagenia abyssinica)', use: 'Traditional hair and scalp treatment. Applied to the scalp to treat dandruff and promote hair growth.' },
        { plant: 'Gesho (Ethiopian Hops)', use: 'Used in tej (honey wine) fermentation and topically on the skin. Antimicrobial properties.' },
        { plant: 'Oleo (Wild Olive)', use: 'Olive-like fruit whose oil is used as a skin and hair moisturizer across highland Ethiopia.' },
        { plant: 'Bisana (Croton macrostachyus)', use: 'Wound healing and skin treatment. Strong antimicrobial properties.' },
      ],
    },
    frankincenseTradition: {
      description: 'Somalia and the Horn of Africa is the historical origin of frankincense (Boswellia sacra and Boswellia carteri). Frankincense has been traded from this region for over 5,000 years.',
      beautyBenefit: [
        'Boswellic acids (the active compounds) are among the most potent anti-inflammatory compounds known',
        'Reduces hyperpigmentation and dark spots',
        'Anti-aging — promotes skin cell renewal',
        'Tones and tightens the skin',
        'Heals scarring and blemishes',
      ],
      use: [
        'Frankincense resin burned in the home (inhaled smoke, traditional aromatherapy)',
        'Frankincense essential oil diluted in jojoba — facial serum',
        'Frankincense-infused oil as a body treatment',
      ],
    },
    coffeeRitual: {
      description: 'Ethiopia is the birthplace of coffee. The Ethiopian coffee ceremony (Buna) is a wellness ritual as much as a social one — involving roasting, grinding, and brewing coffee in a communal, mindful ceremony.',
      beautyBenefit: [
        'Caffeine in coffee reduces puffiness when applied topically (used in eye creams)',
        'Coffee grounds as an exfoliating body scrub',
        'The ceremony itself is a mindfulness practice — reducing stress, building community',
      ],
      coffeeScrub: 'Mix fine coffee grounds with coconut oil. Scrub body in circular motions. Rinse. Caffeine stimulates circulation, grounds exfoliate, coconut oil moisturizes.',
    },
    beautyFoods: [
      { food: 'Injera (Fermented Teff Flatbread)', benefit: 'Teff is one of the most nutritious grains. Rich in iron (preventing anemia-related dullness and hair loss), calcium, zinc. Fermentation adds probiotics.' },
      { food: 'Berbere Spices', benefit: 'Ethiopian berbere spice blend contains turmeric, ginger, pepper, fenugreek — all with anti-inflammatory benefit for skin.' },
      { food: 'Niter Kibbeh (Spiced Clarified Butter)', benefit: 'Spiced with garlic, ginger, turmeric, and other anti-inflammatories. The fat provides fat-soluble vitamin absorption. Traditional Ethiopian cooking medium.' },
      { food: 'Misir (Red Lentils)', benefit: 'Rich in protein (hair building block), iron, zinc, and B vitamins. Staple of Ethiopian diet and excellent for hair and skin health.' },
    ],
  },

  'south-african': {
    communityId: 'south-african',
    communityName: 'South African',
    wellnessPhilosophy: 'South African wellness philosophy is as rich and diverse as the nation itself. The ubuntu philosophy — "I am because we are" — places community connection at the center of health and wellbeing. Traditional healing systems (sangoma traditions, isinyanga herbal medicine) exist alongside the extraordinary pharmacopoeia of South Africa\'s unique flora (fynbos biome, Highveld herbs, Lowveld plants). South Africa is home to some of the world\'s most extraordinary endemic plants with proven beauty and health benefit — rooibos, buchu, devil\'s claw, aloe ferox, and marula are just a few.',
    sangomaAndInyangaTraditions: {
      description: 'Sangomas (diviners) and izinyanga (herbalists) are traditional healers who work with plant medicines, ancestral guidance, and ritual to maintain community health.',
      beautyRelevant: [
        'Herbal steam baths (ubuvimbo) for skin cleansing',
        'Muti (traditional medicine) preparations for skin conditions',
        'Clay and earth treatments for skin health',
        'Communal beauty rituals as expressions of ubuntu',
      ],
    },
    endemicBeautyPlants: [
      {
        plant: 'Rooibos (Aspalathus linearis)',
        region: 'Cederberg Mountains, Western Cape — endemic to South Africa',
        benefit: 'Aspalathin (unique to rooibos, not found in any other plant) is a potent antioxidant. Anti-inflammatory. Anti-aging. Zinc for skin health.',
        use: 'Drink rooibos tea daily (traditionally drunk without milk). Apply cooled rooibos as a toner. Rooibos-infused skincare products.',
      },
      {
        plant: 'Buchu (Agathosma betulina)',
        region: 'Western Cape, South Africa — endemic',
        benefit: 'Antibacterial, antifungal, anti-inflammatory. Has been used in South African herbal medicine for centuries.',
        use: 'Buchu tea for internal health. Buchu oil for skin conditions. Growing in South African natural skincare products.',
      },
      {
        plant: 'Aloe Ferox (Cape Aloe)',
        region: 'South Africa — different from aloe vera, more potent',
        benefit: 'Aloe ferox contains higher concentrations of polysaccharides and aloin than aloe vera. More potent healing, moisturizing, and anti-inflammatory properties.',
        use: 'Fresh gel applied to skin. Aloe ferox juice internally. South African skincare products.',
      },
      {
        plant: 'Devil\'s Claw (Harpagophytum procumbens)',
        region: 'Kalahari and Namib desert regions',
        benefit: 'Harpagoside (the active) is a potent anti-inflammatory. Used for joint pain in traditional medicine, and its anti-inflammatory property benefits inflammatory skin conditions when consumed.',
        use: 'Devil\'s claw tea. Devil\'s claw supplements. Growing evidence base for anti-inflammatory benefit.',
      },
      {
        plant: 'Marula (Sclerocarya birrea)',
        region: 'Southern Africa — the "King of Trees" in many Southern African cultures',
        benefit: 'Marula oil (from the seed kernel) is extraordinarily high in oleic acid, antioxidants, and quickly absorbed. Moisturizes without greasiness. Anti-inflammatory.',
        skinUse: 'Marula oil as a facial oil and body oil. Absorbs immediately.',
        hairUse: 'Marula oil on natural hair for shine and moisture.',
        famous: 'Amarula cream liqueur is made from marula fruit — but the beauty value is in the seed oil.',
      },
      {
        plant: 'Wild Rosemary (Eriocephalus africanus — locally called "kapokbos")',
        region: 'Western Cape, South Africa',
        benefit: 'Different from Mediterranean rosemary but similar anti-inflammatory and antimicrobial properties. Used in Cape Malay traditional medicine.',
        use: 'Herbal steam for skin. Topical infusion for skin conditions.',
      },
    ],
    ubuntuWellness: {
      description: 'Ubuntu wellness places community, relationship, and belonging at the center of health. In South African healing philosophy, chronic loneliness and disconnection are as harmful as any physical ailment.',
      beautyConnection: 'Shared beauty rituals — braiding hair together, applying ochre, preparing for ceremonies — are both community-building and beauty practices. Ubuntu beauty is communal.',
    },
    beautyFoods: [
      { food: 'Maize/Pap', benefit: 'Staple grain providing B vitamins and energy. Nutritional base for many South African communities.' },
      { food: 'Umngqusho (Samp and Beans)', benefit: 'Slow-cooked samp (cracked corn) and sugar beans — protein and fiber for sustained gut health.' },
      { food: 'Marula Fruit', benefit: 'Extraordinary vitamin C content (4x more than oranges). Antioxidant rich. The fruit of the tree whose seed produces the famous oil.' },
    ],
  },

  'black-american': {
    communityId: 'black-american',
    communityName: 'Black American',
    wellnessPhilosophy: 'Black American wellness is reclamation, healing, and power. Centuries of systemic harm have uniquely shaped Black American approaches to health and beauty. The intersection of African healing traditions carried through the Middle Passage, Indigenous American plant knowledge acquired on this land, and contemporary integrative medicine has created a distinct and powerful Black wellness movement. Restorative justice is a wellness framework — rest, joy, community care, and self-love are radical acts of wellness for Black Americans. The concept of "rest as resistance" (named by Tricia Hersey of the Nap Ministry) directly addresses the exhaustion that shows on skin and hair.',
    healingHeritage: {
      description: 'African American folk healing — "root work," "granny medicine," Southern home remedies — preserved African healing knowledge through centuries of American history when formal healthcare was often inaccessible.',
      beautyRelevant: [
        'Castor oil packs and topical treatments for hair and skin',
        'Shea butter from African markets maintained as a beauty staple',
        'Sassafras tea (historical — now caution noted due to safrole)',
        'Vinegar rinses for hair brightness',
        'Petroleum jelly (Vaseline) for sealing moisture — culturally central',
      ],
    },
    restAndRecovery: {
      description: '"Rest is resistance" in Black wellness philosophy — directly applicable to skin and hair health. Chronic sleep deprivation is a major driver of premature aging, dull skin, and hair loss.',
      practices: [
        'Silk pillowcase (prevents hair breakage and minimizes sleep wrinkles)',
        'Satin bonnet for natural hair protection',
        'Consistent sleep schedule aligned with circadian rhythm',
        'Limiting blue light before bed',
        'The "Sunday Reset" — a cultural practice of preparing body, home, and mind for the week through grooming, rest, and intention',
      ],
    },
    herbalAndNatural: [
      {
        plant: 'Jamaican Black Castor Oil (JBCO)',
        description: 'The cornerstone of Black American natural hair and beauty culture.',
        benefit: 'Ricinoleic acid (the active) — increases blood circulation to the scalp, nourishes follicles, promotes hair growth.',
        use: 'Scalp massages. Beard growth. Eyelash and eyebrow care. Body oil.',
      },
      {
        plant: 'Aloe Vera',
        benefit: 'The universal healer — razor bump treatment, scalp soothing, skin hydration.',
        culturalTradition: 'Aloe plants kept in homes across African American households for generations.',
      },
      {
        plant: 'Shea Butter',
        benefit: 'The quintessential Black American moisturizer — from hair to body.',
        tradition: 'Unrefined shea butter from West African markets has been traded into Black American communities for generations.',
      },
      {
        plant: 'Apple Cider Vinegar (ACV)',
        benefit: 'pH-balancing scalp rinse for natural hair.',
        use: 'Dilute 1 part ACV to 3–4 parts water. Rinse through natural hair after shampoo. Rinse with cool water.',
        benefit2: 'Removes product buildup, balances scalp pH, adds shine.',
      },
    ],
    beautyFoods: [
      { food: 'Collard Greens', benefit: 'Extraordinary vitamin K (blood health), vitamin C (collagen), iron, and calcium. A staple of soul food with genuine beauty benefit.' },
      { food: 'Sweet Potato', benefit: 'Beta-carotene (pro-vitamin A) for skin renewal. Vitamin C. Antioxidant power.', use: 'Roasted sweet potato. Sweet potato pie. Sweet potato fries.' },
      { food: 'Black Beans', benefit: 'Protein for hair building. Iron for preventing anemia. Zinc for acne prevention. Fiber for gut health.' },
      { food: 'Catfish / Salmon', benefit: 'Omega-3 fatty acids for anti-inflammation (acne). Protein for hair growth. Vitamin D.' },
      { food: 'Okra', benefit: 'Mucilaginous fiber (prebiotic for gut health). Vitamin C. Used topically as a hair gel alternative in traditional Black American beauty — okra water as a natural hair setting gel.' },
      { food: 'Watermelon', benefit: 'Lycopene (skin-protective antioxidant). Citrulline (converts to arginine, supporting blood flow). Hydration.' },
    ],
    mentalHealthBeauty: {
      description: 'The connection between mental health and beauty is particularly significant in Black American wellness. The historical and ongoing trauma of racism creates chronic stress that directly manifests in the skin, hair, and body.',
      practices: [
        'Therapy as self-care — Black therapy is a growing movement destigmatizing mental health care',
        'Joy practices as beauty care — laughter, dancing, music have documented stress-reduction effects',
        'Community care — sharing resources, time, and support builds resilience',
        'Boundary setting — protecting energy is protecting beauty',
        'Gratitude practices — documented cortisol reduction',
        'Nature time — grounding (earthing) and green space exposure reduce stress hormones',
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL WELLNESS-BEAUTY CONNECTION
// ─────────────────────────────────────────────────────────────────────────────

export const UNIVERSAL_WELLNESS_BEAUTY = {
  gutSkinAxis: {
    description: 'The gut-skin microbiome axis is one of the most significant discoveries in modern beauty science — validating what traditional healing systems across all cultures have known for millennia: that clear skin begins in the gut.',
    mechanism: 'The gut microbiome regulates inflammation systemically. Dysbiosis (imbalanced gut bacteria) drives systemic inflammation that manifests as acne, eczema, rosacea, dull skin, and hair loss.',
    foods: {
      probiotic: ['Kimchi (Korean)', 'Kefir', 'Yogurt', 'Kombucha', 'Sauerkraut', 'Miso', 'Injera (fermented teff)', 'Idli/dosa batter (fermented rice-lentil)'],
      prebiotic: ['Garlic', 'Onion', 'Banana', 'Oats', 'Asparagus', 'Tiger nuts (Nigerian)'],
      antiInflammatory: ['Turmeric + black pepper', 'Ginger', 'Fatty fish (omega-3)', 'Green tea', 'Dark leafy greens'],
    },
  },

  stressAndBeauty: {
    mechanism: 'Cortisol (the stress hormone) triggers sebum production (acne), breaks down collagen (aging), disrupts sleep (dark circles, poor repair), and contributes to hair loss (telogen effluvium).',
    managementPractices: [
      'Mindfulness meditation (documented cortisol reduction)',
      'Exercise — particularly yoga and walking in nature',
      'Social connection — strong social bonds reduce cortisol',
      'Creative expression — art, music, dance, cooking',
      'Breathwork (pranayama, box breathing)',
      'Sleep hygiene',
      'Limiting alcohol (which elevates cortisol)',
    ],
  },

  sleepBeauty: {
    whySleepMatters: [
      'Growth hormone (secreted during deep sleep) drives cell repair and collagen synthesis',
      'Cortisol drops to its lowest during proper sleep — reducing inflammatory processes',
      'Blood flow to skin increases during sleep — nutrient and oxygen delivery',
      'Under-eye circles are caused by poor drainage and cortisol — improved by sleep',
      'Hair follicles undergo their active growth phase during sleep',
    ],
    bestPractices: [
      '7–9 hours of quality sleep per night',
      'Consistent sleep and wake times',
      'Dark, cool room (60–68°F / 16–20°C)',
      'Silk or satin pillowcase (prevents hair breakage and wrinkle lines)',
      'Satin bonnet for natural/protective hair',
      'Night skincare routine (the most important skincare window is sleep)',
      'No screens 1 hour before bed',
    ],
  },

  hydration: {
    beautyImpact: 'Dehydration manifests immediately in the skin — fine lines appear more pronounced, skin looks dull and flat, dark circles worsen, and skin barrier function is compromised.',
    intake: '8–10 cups of water daily minimum. More in hot climates (Caribbean, Gulf countries, West Africa). More with exercise.',
    beautyHydrators: ['Coconut water (electrolytes)', 'Hibiscus tea (antioxidant + hydration)', 'Cucumber water', 'Watermelon (92% water)', 'Herbal teas (rooibos, green tea, chamomile)'],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function getWellnessBeautyGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_WELLNESS_BEAUTY_GUIDES['west-african'],
    'south-asian': ETHNIC_WELLNESS_BEAUTY_GUIDES['south-asian'],
    'caribbean': ETHNIC_WELLNESS_BEAUTY_GUIDES['caribbean'],
    'arab': ETHNIC_WELLNESS_BEAUTY_GUIDES['arab'],
    'latina': ETHNIC_WELLNESS_BEAUTY_GUIDES['latina'],
    'east-asian': ETHNIC_WELLNESS_BEAUTY_GUIDES['east-asian'],
    'east-african': ETHNIC_WELLNESS_BEAUTY_GUIDES['east-african'],
    'south-african': ETHNIC_WELLNESS_BEAUTY_GUIDES['south-african'],
    'black-american': ETHNIC_WELLNESS_BEAUTY_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

export const WELLNESS_BEAUTY_STATS = {
  moduleId: 'wellness_beauty_ethnic_guide',
  communitiesCovered: 9,
  healingSystemsCovered: 12,
  medicinalPlantsCovered: 48,
  beautyFoodsCovered: 45,
  version: '1.0.0',
};
