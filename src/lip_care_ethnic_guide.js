/**
 * MIRRR — Lip Care Ethnic Guide
 * Comprehensive lip health, beauty, and care traditions for all 9 ethnic communities.
 * Covers lip hyperpigmentation, traditional balms, color theory for deep skin tones,
 * and culturally specific lip beauty practices.
 */

export const ETHNIC_LIP_CARE_GUIDES = {
  'west-african': {
    communityId: 'west-african',
    communityName: 'West African',
    lipBeautyPhilosophy: 'West African lip beauty celebrates full, rich lips as a mark of beauty and femininity. Bold lip colors — deep reds, vibrant oranges, nudes that complement deep skin — are central to the aesthetic. Lip health is maintained with natural oils and butters, and hyperpigmentation of the lip borders is addressed with traditional brightening techniques.',
    commonConcerns: [
      'Lip hyperpigmentation — darkening of the lip border and uneven lip tone',
      'Dryness and cracking from harmattan (dry season) conditions',
      'Post-inflammatory darkening from picking or peeling',
      'Melasma affecting the area around the lips',
      'Lip darkening from smoking',
    ],
    traditionalPractices: [
      {
        name: 'Shea Butter Lip Balm',
        description: 'Pure unrefined shea butter applied to the lips is the classic West African lip moisturizer. Rich in vitamins A, E, and F, and fatty acids that deeply condition.',
        application: 'Warm a small amount of shea butter between fingertips. Apply to lips morning and night. Can be used under lipstick as a primer.',
        enhancement: 'Mix shea butter with a few drops of vitamin E oil and a drop of peppermint essential oil for a tingling, conditioning lip treatment.',
      },
      {
        name: 'Cocoa Butter Lip Treatment',
        description: 'Raw cocoa butter from cacao trees native to West Africa has been used for centuries to moisturize and protect lips.',
        application: 'Melt a small amount of raw cocoa butter. Apply to lips. The natural chocolate scent is a bonus.',
        benefit: 'Occlusive — seals in moisture and protects against dry, harsh winds.',
      },
      {
        name: 'Sugar and Honey Lip Scrub',
        description: 'A classic lip exfoliator using natural ingredients available across West Africa. Removes dead skin cells, reveals brighter lip tone underneath.',
        recipe: '1 tsp fine sugar + 1 tsp honey + a few drops of lemon juice (optional for brightening). Mix. Apply to lips in circular motions for 1–2 minutes. Rinse. Follow with shea butter.',
        frequency: 'Once per week.',
        caution: 'Avoid if lips are cracked or bleeding. Lemon juice can cause photosensitivity — don\'t apply then go in the sun.',
      },
      {
        name: 'Palm Kernel Oil Lip Conditioning',
        description: 'Palm kernel oil (distinct from palm oil — lighter and richer in lauric acid) used as an overnight lip conditioning treatment.',
        benefit: 'Antimicrobial properties help prevent lip infections. Deep conditioning restores moisture in dry season.',
      },
    ],
    lipHyperpigmentationGuide: {
      causes: [
        'Genetic (most common in West African skin — melanin concentrated at lip border)',
        'Sun exposure without SPF on lips',
        'Smoking and tobacco',
        'Hormonal changes',
        'Chronic dehydration',
        'Harsh or fragrant lipsticks causing allergic darkening',
      ],
      treatments: [
        {
          treatment: 'Vitamin C Lip Serum',
          description: 'Apply a vitamin C serum (not pure ascorbic acid — can be irritating) to the lip area nightly. Inhibits melanin and brightens over time.',
          timeline: '8–12 weeks',
        },
        {
          treatment: 'Kojic Acid Lip Treatment',
          description: 'Kojic acid (naturally derived) in a lip-safe formulation applied to the darkened lip border.',
          timeline: '8–16 weeks',
          caution: 'Avoid any kojic acid formulation not specifically made for lips — can be drying.',
        },
        {
          treatment: 'Turmeric Lip Mask',
          description: 'Turmeric mixed with honey applied to lip area for 10–15 minutes. Curcumin has mild brightening properties.',
          recipe: '¼ tsp turmeric + 1 tsp honey. Apply. Leave 10–15 min. Rinse thoroughly.',
          caution: 'Turmeric stains. Rinse well. Not recommended before important events.',
        },
        {
          treatment: 'Consistent SPF on Lips',
          description: 'Tinted SPF lip balm worn daily prevents further darkening from UV. One of the most effective interventions for preventing lip hyperpigmentation.',
          recommendation: 'EltaMD UV Lip Balm SPF 36, COOLA Mineral Liplux SPF 30.',
        },
      ],
    },
    lipColorGuide: {
      philosophy: 'West African women look incredible in bold lip colors. Rich, pigmented formulas show up better on deep skin tones. Avoid washed-out nudes and pastels unless properly opaque.',
      deepSkintones: {
        classicRed: 'Blue-toned reds (crimson, cherry, wine red) complement cool undertones on deep skin. Avoid true orange-reds which can look discordant.',
        warmRed: 'Deep tomato red and brick red for warm undertone skin.',
        nude: 'Warm-toned nudes — terracotta, mocha, cinnamon. Avoid pale pink or beige nudes that look ashy.',
        bold: 'Berry, plum, deep burgundy, oxblood — all spectacular on deep melanin-rich skin.',
        orange: 'Burnt orange, papaya, tangerine — vibrant and beautiful for West African skin tones.',
        coral: 'Warm coral with gold pigment works beautifully.',
      },
      recommendedFormulas: [
        'Fenty Beauty Stunna Lip Paint (Uncuffed — the universal red)',
        'MAC Retro Matte Lipstick (Ruby Woo, Chili)',
        'NYX Lingerie Push-Up Lipstick (deep nudes)',
        'Uoma Beauty Badass Icon Matte Lipstick',
        'Pat McGrath Labs MatteTrance Lipstick',
      ],
    },
  },

  'south-asian': {
    communityId: 'south-asian',
    communityName: 'South Asian',
    lipBeautyPhilosophy: 'South Asian lip beauty has a rich tradition of bold, vibrant lip color tied to cultural celebration. From the bright vermillion of sindoor to the deep reds of Bollywood to modern nude lip trends, South Asian women traverse the full spectrum. Lip care using Ayurvedic ingredients is deeply embedded — rose petal preparations, ghee application, and turmeric treatments have been used for generations.',
    commonConcerns: [
      'Lip hyperpigmentation (dark borders and uneven lip tone)',
      'Dryness from air conditioning in urban environments',
      'Lip darkening from strong spices in diet',
      'Tea and coffee staining',
      'Dry, cracked lips from harsh winter in Northern India',
    ],
    traditionalPractices: [
      {
        name: 'Ghee Lip Treatment',
        description: 'Pure desi ghee (clarified butter) applied to the lips as a traditional Ayurvedic moisturizer. Used for chapped lips and to maintain natural lip color.',
        application: 'Dip fingertip in a small amount of pure ghee. Apply to lips before sleep. Ghee is emollient and gentle.',
        history: 'Ayurvedic texts reference ghee as a lip treatment. It remains widely used in rural and traditional households.',
      },
      {
        name: 'Rose Petal Lip Mask',
        description: 'Fresh rose petals macerated in cream, milk, or honey and applied to the lips. A classic Indian beauty treatment for brightening and moisturizing.',
        recipe: 'Grind 10–15 fresh rose petals with 1 tsp of malai (fresh cream) or honey. Apply to lips for 15–20 minutes. Rinse gently.',
        benefit: 'Rose has mild astringent and brightening properties. Cream provides occlusive moisture.',
      },
      {
        name: 'Honey and Saffron Lip Balm',
        description: 'Saffron strands soaked in a few drops of warm milk or ghee, then mixed with honey. Applied to lips for brightening and conditioning.',
        recipe: 'Soak 3–4 saffron strands in 1 tsp warm milk for 10 minutes. Mix in 1 tsp honey. Apply to lips for 20 minutes. Rinse.',
        tradition: 'Saffron (kesar) has been used in Indian beauty for millennia. Its crocin compound has mild skin-brightening properties.',
      },
      {
        name: 'Almond Oil Lip Overnight Treatment',
        description: 'Sweet almond oil applied to lips before sleep. Rich in vitamin E, an antioxidant that protects against lip darkening from free radicals.',
        application: 'Apply 1–2 drops of sweet almond oil to clean lips. Leave overnight.',
      },
      {
        name: 'Besan (Chickpea Flour) Lip Scrub',
        description: 'A classic South Asian DIY beauty treatment. Besan with a little water and a drop of lemon juice used as a gentle lip exfoliant.',
        recipe: '1 tsp besan + enough water to make a paste + a pinch of turmeric (optional). Apply to lips. Gently rub. Leave 5 minutes. Rinse.',
      },
    ],
    lipColorGuide: {
      philosophy: 'South Asian women span a wide range from fair to deep olive to rich brown. The best lip color depends on skin tone and undertone more than a single cultural recommendation.',
      bySkintone: {
        fairSouthAsian: {
          description: 'Often cool undertones (Pakistan, North India). Pink-toned nudes, mauve, berry, and classic red.',
          avoidShades: 'Very dark lipsticks can overwhelm fair skin.',
        },
        mediumOlive: {
          description: 'Warm-neutral undertones common across India. Terracotta, brick, warm coral, warm nude, and deep rose.',
          bestShades: 'Rust, burnt sienna, warm rose.',
        },
        deepBrown: {
          description: 'South Indian and Sri Lankan deep skin tones. Bold is best — deep wine, oxblood, bright fuchsia, coral orange.',
          bestShades: 'Any bold pigmented shade. Avoid very pale pastels.',
        },
      },
      festivalLipColors: [
        'Diwali: deep burgundy or wine red',
        'Holi: festive coral or hot pink',
        'Eid: classic red or berry pink',
        'Shaadi (wedding): bridal deep red or oxblood',
        'Navratri: bright coral or orange',
      ],
    },
    bridalLipTradition: {
      significance: 'The bridal lip in South Asian tradition is typically a deep, rich red — symbolizing prosperity, love, and new beginnings.',
      classicBridalLip: {
        base: 'Deep red or wine lip liner to define and fill',
        color: 'Full-coverage deep red or merlot lipstick',
        finish: 'Matte or soft satin for longevity',
        setting: 'Translucent powder over lips to set for 8+ hours',
        touchup: 'Matching lip liner for outline refresh',
      },
      modernVariations: 'Modern South Asian brides are experimenting with deep berry, burnt rose, and even nude-rose for a more editorial bridal look.',
    },
  },

  'caribbean': {
    communityId: 'caribbean',
    communityName: 'Caribbean',
    lipBeautyPhilosophy: 'Caribbean lip beauty is vibrant, joyful, and expressive. The tropical climate calls for long-wearing, waterproof formulas. Natural ingredients from the island — aloe, coconut, tropical fruits — are foundational to lip care. Bold colors — bright corals, hot pinks, tropical oranges — reflect the island spirit, while glossy lips capture the sun-kissed radiance of island living.',
    commonConcerns: [
      'UV-related darkening from outdoor lifestyle without SPF on lips',
      'Dryness from saltwater and sun exposure',
      'Pigmentation darkening on the lip border',
      'Lip peeling from dehydration',
      'Lipstick not lasting in heat and humidity',
    ],
    traditionalPractices: [
      {
        name: 'Coconut Oil Lip Balm',
        description: 'Pure coconut oil pressed locally in Caribbean islands has been the go-to lip balm for generations. Antimicrobial, moisturizing, and naturally sweet-scented.',
        application: 'Apply a thin layer of pure virgin coconut oil to lips. Use throughout the day as needed.',
        tip: 'Solid at cooler temperatures — dip fingertip in and warm between fingers before applying.',
      },
      {
        name: 'Aloe Vera Lip Gel',
        description: 'Fresh aloe vera gel from island plants applied to the lips for cooling, healing, and hydrating cracked lips.',
        method: 'Cut an aloe leaf. Scoop the clear gel. Apply a thin layer to lips. Allow to absorb. Rinse after 15–20 minutes.',
        benefit: 'Especially soothing for sunburned or weather-damaged lips.',
      },
      {
        name: 'Tropical Fruit Lip Mask',
        description: 'Papaya, mango, or pineapple pulp applied to lips. These fruits contain natural enzymes (papain in papaya, bromelain in pineapple) that gently exfoliate dead lip skin.',
        recipe: 'Mash a small amount of ripe papaya or mango. Apply to lips. Leave 5–10 minutes. Rinse.',
        frequency: '1–2 times per week.',
        caution: 'Rinse thoroughly. Enzyme activity can cause tingling — avoid on cracked lips.',
      },
      {
        name: 'Rum and Sugar Lip Scrub',
        description: 'A playful Caribbean beauty tradition — a small amount of sugar cane rum mixed with brown sugar as a lip exfoliant.',
        recipe: '1 tsp brown or demerara sugar + enough rum to moisten. Scrub lips gently. Rinse. Apply coconut oil.',
        note: 'Not for regular use — alcohol is drying. A once-weekly treat for exfoliation.',
      },
    ],
    glossyLipGuide: {
      philosophy: 'Glossy, lush lips are the Caribbean beauty signature. The gloss aesthetic captures the tropical, sunlit energy.',
      topGlosses: [
        'Fenty Beauty Gloss Bomb (deep skin-friendly shades)',
        'NYX Filler Instinct Lip Polish',
        'Joah Beauty Glass Shine Lip Gloss',
        'Tower 28 ShineOn Milky Lip Jelly',
      ],
      layeringTip: 'For Caribbean-worthy gloss: line lips with a nude pencil to prevent feathering. Apply a neutral lipstick base. Top with gloss concentrated in the center.',
    },
    longWearInTropics: {
      challenge: 'Heat and humidity break down traditional lipstick formulas quickly.',
      solutions: [
        'Liquid lip stains over lipstick for longevity',
        'Lip liner all over as a base (not just the edge)',
        'Set lipstick with translucent powder between layers',
        'Blot with tissue between coats',
        'Avoid glosses as the primary color in heat (they migrate) — use as a top layer over matte',
      ],
    },
  },

  'arab': {
    communityId: 'arab',
    communityName: 'Arab Middle Eastern',
    lipBeautyPhilosophy: 'Arab lip beauty has shifted dramatically across history and geography. Classic Levantine beauty featured deep, defined lips — dark liner with a lighter fill, creating a dramatic shape. Gulf beauty embraces the full, over-lined lip aesthetic that preceded and inspired global trends. North African beauty features muted, earthy lip tones. Across all these communities, the lip is a powerful beauty statement, and natural lip care using locally sourced butters, oils, and botanical preparations is deeply traditional.',
    commonConcerns: [
      'Dehydration-related lip dryness in desert and arid climates',
      'Hyperpigmentation of the upper lip from sun exposure',
      'Upper lip darkening from hair removal (threading, waxing, bleaching)',
      'Lip darkening from smoking (hookah)',
      'Fine lines around the lips from dry climate',
    ],
    traditionalPractices: [
      {
        name: 'Argan Oil Lip Treatment',
        description: 'Moroccan argan oil (liquid gold) applied to the lips for conditioning, healing, and protecting against dry desert conditions.',
        application: 'Apply 1–2 drops to lips before sleep and throughout the day as needed.',
        benefit: 'Rich in vitamin E, linoleic acid, and squalene. Non-greasy and quickly absorbed.',
      },
      {
        name: 'Rosewater and Glycerin Lip Serum',
        description: 'Rose water mixed with food-grade glycerin applied to the lips as a plumping, hydrating treatment.',
        recipe: '2 parts rose water + 1 part glycerin. Mix. Store in a small dropper bottle. Apply to lips 2–3x daily.',
        benefit: 'Glycerin is a humectant — draws moisture to the lips. Rose water soothes and provides a pleasant scent.',
        tradition: 'Rose water (ma\' al-ward) is central to Arab beauty and wellness. It has been used across the Arab world for centuries.',
      },
      {
        name: 'Date Seed Lip Scrub',
        description: 'Ground date seeds used as a gentle lip exfoliant. Dates (tamr) are culturally significant across the Arab world and are abundant in date-palm regions.',
        recipe: 'Grind dried date seeds to a very fine powder (not coarse — too abrasive). Mix with honey. Apply gently to lips. Rinse after 1–2 minutes.',
        note: 'Commercial preparations are safer — home-ground date seed can be uneven in coarseness.',
      },
      {
        name: 'Camel Milk Lip Mask',
        description: 'Camel milk, used in traditional Gulf beauty, is rich in alpha-hydroxy acids (AHAs) and vitamin C. Applied to the lip area for brightening and conditioning.',
        application: 'Soak a cotton pad in fresh or high-quality packaged camel milk. Apply to lip area for 15 minutes. Rinse.',
        availability: 'Fresh camel milk in Gulf countries. Packaged versions (UK, US, some specialty stores) work for diaspora.',
      },
      {
        name: 'Black Seed Oil (Habbatus Sauda) Lip Balm',
        description: 'Black seed oil (Nigella sativa) mixed with shea butter as a traditional lip treatment. Referenced in Islamic Prophetic medicine as a remedy for many ailments.',
        recipe: '1 tbsp shea butter + 3–4 drops black seed oil. Warm and combine. Apply to lips as a treatment.',
        scienceNote: 'Black seed oil contains thymoquinone, an anti-inflammatory and antimicrobial compound with documented skin benefits.',
      },
    ],
    arabLipLineArt: {
      tradition: 'Over-lining the lips to create a fuller, more defined shape is deeply embedded in Gulf Arab beauty culture, and has been popularized globally.',
      technique: {
        steps: [
          'Choose a liner 1–2 shades darker than natural lip color or matching lipstick',
          'Define the Cupid\'s bow first — draw the "M" shape with precision',
          'Extend slightly outside the natural lip line on upper lip',
          'Follow natural line on lower lip or extend slightly at center for a pouty effect',
          'Fill in entire lip with liner as a base for longevity',
          'Apply lipstick on top',
        ],
      },
      popularArabLipStyles: [
        {
          name: 'The Gulf Pout',
          description: 'Dramatically over-lined upper lip, full lower lip, usually in a nude-brown or deep berry.',
          signature: 'Often worn with strong kohl eye look and a slightly bronzed complexion.',
        },
        {
          name: 'Levantine Classic',
          description: 'Precisely defined lips with a dark liner and lighter or brighter fill inside the line.',
          signature: 'Polished, defined, and elegant.',
        },
        {
          name: 'Modern Nude Arab',
          description: 'Nude-brown or warm taupe lip that is the current trendy Arab lip look. Requires a good color match to avoid a washed-out effect.',
          productTip: 'MAC Whirl, Charlotte Tilbury Pillow Talk, NARS Dolce Vita are popular choices.',
        },
      ],
    },
  },

  'latina': {
    communityId: 'latina',
    communityName: 'Latina',
    lipBeautyPhilosophy: 'Latina lip beauty is passionate and iconic. The lip is a central statement in Latin American beauty culture — from the bold reds of Mexican beauty to the glossy, full lips of Brazilian telenovelas to the dramatic mattes of Argentine glamour. Natural lip care using aloe, chamomile, and regional fruits is passed down through generations. Lip color is often the one makeup product Latina women consider non-negotiable.',
    commonConcerns: [
      'Dark lip borders from genetic hyperpigmentation',
      'Upper lip shadow from hair and follicle visibility',
      'Lip darkening from spicy foods',
      'Sun exposure hyperpigmentation',
      'Dry lips from high-altitude cities (Mexico City, Bogotá, La Paz)',
    ],
    traditionalPractices: [
      {
        name: 'Miel (Honey) Lip Treatment',
        description: 'Pure honey applied to the lips as a humectant, antibacterial, and healing treatment. A staple of Latin American home beauty.',
        application: 'Apply a generous amount of raw local honey to lips. Leave 20–30 minutes. Rinse. Apply coconut or almond oil.',
        enhancement: 'Mix honey with a pinch of cinnamon for a mild plumping effect (cinnamon is a circulatory stimulant — use sparingly, avoid if sensitive).',
      },
      {
        name: 'Papaya (Papaya/Lechosa) Lip Enzyme Mask',
        description: 'Fresh papaya pulp applied to the lips. Papain enzyme in papaya gently exfoliates dead lip skin and brightens the lip area.',
        recipe: 'Mash ripe papaya. Apply to lips and upper lip area. Leave 10 minutes. Rinse. Apply moisturizer.',
        cultural: 'Papaya grows throughout Latin America and the Caribbean and has been used in beauty rituals across Central and South America for generations.',
      },
      {
        name: 'Aceite de Coco (Coconut Oil) Lip Balm',
        description: 'Pure coconut oil is the go-to lip balm in many Latin American countries. Hydrating, naturally sweet, and versatile.',
        tip: 'Add a drop of vanilla extract to coconut oil for a classic Latin sweet-scented lip treatment.',
      },
      {
        name: 'Azteca Clay (Mexican Clay) Lip Mask',
        description: 'A small amount of Aztec Secret Indian Healing Clay (bentonite clay) mixed with apple cider vinegar used on the lip area to draw out impurities and tighten pores around the mouth.',
        recipe: 'Mix equal parts clay and ACV. Apply thin layer to lip area (not on lips themselves). Leave 5–10 minutes. Rinse. Moisturize.',
        caution: 'Not for use directly on lips — too drying. Apply only around the mouth area for lip border hyperpigmentation.',
      },
    ],
    lipColorByRegion: {
      mexico: {
        description: 'Bold, passionate, and dramatic. Classic red is the quintessential Mexican lip. Think Selena, Frida Kahlo, Mexican folk art influence.',
        signature: 'Classic red lipstick with a matte finish and a defined border.',
        shades: ['True red', 'Brick red', 'Oxblood', 'Deep berry'],
      },
      colombia: {
        description: 'Vibrant and feminine. Colombian beauty features bright corals, hot pinks, and bold fuchsia.',
        shades: ['Hot pink', 'Coral', 'Orange-red', 'Fuchsia'],
      },
      brazil: {
        description: 'Glossy, sun-kissed, and sensual. Brazilian beauty favors glossy, kissable lips in nudes and naturals with a dewy finish.',
        shades: ['Warm nude', 'Peach gloss', 'Natural rose', 'Sheer coral gloss'],
      },
      argentina: {
        description: 'Sophisticated and European-influenced. Buenos Aires beauty is elegant — classic red or a perfectly chosen nude.',
        shades: ['Classic red', 'Warm nude', 'Deep mauve'],
      },
      cuba: {
        description: 'Glamorous and retro-inspired. Cuban beauty embraces old Hollywood glamour.',
        shades: ['Classic red', 'Deep berry', 'Hot pink'],
      },
    },
    iconicLatinaLipMoments: [
      'Selena Quintanilla\'s bold red lip became her beauty trademark',
      'Jennifer Lopez popularized the glossy nude lip in the 2000s',
      'Shakira\'s warm-toned nudes and corals',
      'Sofia Vergara\'s classic red lip',
      'Zoe Saldana\'s bold color choices for her deep olive skin tone',
    ],
  },

  'east-asian': {
    communityId: 'east-asian',
    communityName: 'East Asian',
    lipBeautyPhilosophy: 'East Asian lip beauty is characterized by precision, minimalism, and the elevation of subtle details. The Korean "gradient lip" (ombre lip), the Japanese "your lips but better" nude, and the Chinese red lip for celebration are each distinct regional aesthetics. Lip skincare (lip masks, treatments, essences) is as important as makeup — the pursuit of soft, pillowy, naturally pigmented lips is a core K-beauty and J-beauty principle.',
    commonConcerns: [
      'Thin lip appearance for those seeking a fuller look',
      'Dryness from cold climates in Northern East Asia',
      'Fine vertical lip lines from dryness and age',
      'Uneven pigmentation (some natural lips have lighter center, darker edges)',
      'Lipstick not adhering well to dry or textured lips',
    ],
    traditionalPractices: [
      {
        name: 'Camellia Oil Lip Treatment',
        description: 'Tsubaki (camellia) oil has been used in Japanese beauty for centuries. Applied to the lips overnight for deep conditioning.',
        application: 'Apply 1–2 drops of pure camellia oil to lips before sleep.',
        benefit: 'High oleic acid content. Absorbs beautifully. Leaves lips soft and plump.',
        japaneseHeritage: 'Camellia oil is one of Japan\'s most treasured beauty ingredients, used from hair to lips to body.',
      },
      {
        name: 'Fermented Rice Water Lip Treatment',
        description: 'Fermented rice water (makgeolli in Korea) used as a lip brightening and conditioning treatment.',
        method: 'Soak a cotton pad in fermented rice water. Press to lips for 5–10 minutes. Rinse. Apply a lip oil.',
        benefit: 'Inositol in fermented rice water has skin-brightening and barrier-strengthening properties.',
      },
      {
        name: 'Honey and Green Tea Lip Mask',
        description: 'A combination of two East Asian beauty staples. Honey moisturizes and heals, while green tea provides antioxidant protection.',
        recipe: 'Mix 1 tsp honey with 1 tsp cooled strong green tea. Apply to lips. Leave 15–20 minutes. Rinse.',
      },
      {
        name: 'Peach Blossom Lip Treatment',
        description: 'Peach blossom extract or fresh peach puree applied to the lips. Traditional in Chinese beauty — peach symbolizes beauty and longevity.',
        method: 'Apply ripe peach puree to lips for 10 minutes. Rinse. Apply camellia oil.',
        tradition: 'Peach-based beauty treatments appear in Chinese beauty texts dating back centuries.',
      },
    ],
    kBeautyGradientLip: {
      description: 'The Korean gradient (ombre) lip is achieved by concentrating color in the center of the lips and blending it outward, leaving the edges naturally pale.',
      steps: [
        'Moisturize lips thoroughly with lip balm. Blot excess.',
        'Apply a lip stain or creamy lipstick to the center of both lips (not the edges)',
        'Using your fingertip, pat and blend the color outward with a dabbing motion',
        'The color should fade toward the lip edges — the outer quarter of the lip should be nearly bare',
        'Apply a clear gloss to the center for a fresh, dewy effect',
        'Correct the edge with concealer for a cleaner border (optional)',
      ],
      colorsForGradient: [
        'Classic: cherry red or deep rose in center',
        'Romantic: dusty mauve or warm pink',
        'Trendy: burnt orange or brick',
        'Natural: MLBB (My Lips But Better) shade',
      ],
    },
    lipSkincarePyramid: {
      description: 'K-beauty and J-beauty approach lip skincare as a dedicated category. The lip skincare routine:',
      steps: [
        {
          step: 'Lip Exfoliation',
          frequency: '1–2x per week',
          products: ['Laneige Lip Sleeping Mask (used as scrub)', 'COSRX Natural BHA Lip Treatment', 'Sugar scrub'],
        },
        {
          step: 'Lip Serum / Treatment',
          frequency: 'Nightly',
          products: ['Laneige Lip Sleeping Mask', 'Sulwhasoo Timetreasure Lip Treatment', 'Innisfree Lip Sleeping Pack'],
        },
        {
          step: 'Lip Balm',
          frequency: 'Daily, throughout the day',
          products: ['VT Cosmetics Lip Balm', 'Etude House Cherry Tint Balm'],
        },
        {
          step: 'SPF Lip Protection',
          frequency: 'Every morning',
          products: ['COSRX Propolis Lip Gloss', 'Any SPF-containing clear lip product'],
        },
      ],
    },
  },

  'east-african': {
    communityId: 'east-african',
    communityName: 'East African',
    lipBeautyPhilosophy: 'East African lip beauty honors the natural beauty of full, rich lips while embracing color as a form of expression and cultural identity. Somali, Ethiopian, and Swahili beauty traditions each bring unique lip care practices. Natural oils and butters derived from East African plant sources are central to lip care, and color choices range from deep, earthy tones inspired by the landscape to vibrant oranges and fuchsias for celebration.',
    commonConcerns: [
      'Hyperpigmentation of the lip border',
      'Dryness from equatorial UV and altitude in East African highlands',
      'Lip darkening from melanin concentration',
      'Sensitivity to fragrance in commercial lip products',
      'Darker skin tones requiring highly pigmented formulas for color visibility',
    ],
    traditionalPractices: [
      {
        name: 'Shea and Neem Lip Balm',
        description: 'A mixture of unrefined shea butter and a few drops of neem oil for lip conditioning and protection. Common in East Africa where both ingredients are locally available.',
        recipe: '1 tbsp shea butter + 3 drops neem oil. Mix well. Apply to lips as needed.',
        benefit: 'Shea provides moisture. Neem oil adds antimicrobial protection and skin-healing compounds.',
      },
      {
        name: 'Coffee and Honey Lip Scrub',
        description: 'Ethiopian coffee grounds mixed with honey for a natural lip exfoliator. Ethiopia is the birthplace of coffee culture.',
        recipe: '1 tsp very finely ground Ethiopian coffee + 1 tsp honey. Mix. Gently massage onto lips 1–2 minutes. Rinse.',
        cultural: 'Incorporating Ethiopia\'s most precious export into a beauty ritual is a beautiful act of cultural pride.',
        caution: 'Use very fine grounds — too coarse can scratch lip skin.',
      },
      {
        name: 'Black Seed (Habatus Sauda) Lip Oil',
        description: 'Black seed oil in Somali and East African Muslim communities used for its healing and protective properties on the lips.',
        application: 'Apply 1–2 drops to lips. Can be mixed with a carrier like sweet almond oil for a lighter feel.',
      },
      {
        name: 'Frankincense (Lubaan) Lip Balm',
        description: 'Frankincense resin (lubaan), native to Somalia and the Horn of Africa, traditionally used for healing skin and lips.',
        method: 'Frankincense-infused oil applied to the lips. The resin has documented anti-inflammatory properties.',
        culturalSignificance: 'Somalia is one of the world\'s primary sources of frankincense. Using it in beauty is a celebration of East African botanical heritage.',
      },
    ],
    lipColorForDeepSkin: {
      philosophy: 'Deep East African skin tones need highly pigmented, bold formulas. Colors that look dramatic on lighter skin often appear muted or barely visible on deep melanin-rich skin.',
      bestColors: [
        'Vibrant coral and orange',
        'Deep plum and oxblood',
        'Electric fuchsia',
        'Classic true red',
        'Warm mocha and terracotta nude',
      ],
      avoidOnDeepSkin: ['Pale pink (looks ashy)', 'Very light nude (disappears)', 'Frosted pink or white-toned'],
      recommendations: [
        'Fenty Beauty Stunna Lip Paint',
        'Uoma Beauty Badass Icon Matte Lipstick',
        'Mented Cosmetics Lip Stick (designed for deep skin tones)',
        'BLK/OPL True Color Glitzy Red Lipstick',
      ],
    },
  },

  'south-african': {
    communityId: 'south-african',
    communityName: 'South African',
    lipBeautyPhilosophy: 'South African lip beauty reflects the country\'s diversity. Nguni cultural beauty traditions feature lip adornment as part of broader aesthetic practices. Contemporary South African beauty is cosmopolitan — Jo\'burg beauty is editorial and global, Cape Town is natural and sun-kissed, KZN is vibrant and community-oriented. Natural ingredients indigenous to Southern Africa (rooibos, marula, baobab) are increasingly being incorporated into modern lip care.',
    commonConcerns: [
      'UV hyperpigmentation on the lips and surrounding area',
      'Dryness from Jo\'burg highveld winter conditions',
      'Lip darkening on darker skin tones',
      'Dry, cracked lips from outdoor lifestyle and sun exposure',
      'Lipstick application challenges for deep melanin-rich skin tones',
    ],
    traditionalPractices: [
      {
        name: 'Rooibos Lip Treatment',
        description: 'Cooled strong-brewed rooibos tea applied to the lips as an antioxidant treatment. Rich in aspalathin and nothofagin — powerful South African antioxidants.',
        method: 'Brew very strong rooibos. Cool completely. Soak a cotton pad. Press to lips for 5–10 minutes. Follow with a moisturizing lip oil.',
        pride: 'Rooibos is native only to the Cederberg region of the Western Cape — using it in beauty is a deeply South African act.',
      },
      {
        name: 'Marula Oil Lip Treatment',
        description: 'Marula oil from the marula tree (native to Southern Africa) applied to the lips overnight.',
        application: 'Apply 1–2 drops of pure marula oil to lips. Massage gently. Leave overnight.',
        benefit: 'Very high in oleic acid, linoleic acid, and antioxidants. Lightweight, non-greasy, quickly absorbed.',
      },
      {
        name: 'Baobab Oil Lip Balm',
        description: 'Oil pressed from baobab seeds (baobab is the iconic African tree) is rich in omega 3, 6, and 9 fatty acids. Applied as a lip balm and treatment.',
        benefit: 'Regenerates and conditions the lip. One of Africa\'s premier cosmetic oils.',
      },
      {
        name: 'Sugar Cane and Honey Lip Scrub',
        description: 'Fine sugar mixed with Cape honey (South African fynbos honey is world-famous) as a lip exfoliant.',
        recipe: '1 tsp fine sugar + 1 tsp Cape fynbos honey. Apply to lips. Rub gently. Rinse. Apply marula oil.',
      },
    ],
    modernSouthAfricanLipAesthetic: {
      johannesburg: {
        description: 'Bold, editorial, international. Jo\'burg women wear what\'s trending globally — classic red, berry, graphic lip art.',
        currentTrends: ['Classic red matte', 'Deep berry', 'Graphic editorial looks'],
      },
      capeTown: {
        description: 'Natural, minimal, bohemian. Cape Town beauty leans into natural lip tones enhanced slightly.',
        currentTrends: ['MLBB (my lips but better) nudes', 'Sheer rose', 'Tinted balm'],
      },
      durbanKZN: {
        description: 'Vibrant, festive, community. Durban beauty is joyful and color-forward.',
        currentTrends: ['Bright coral', 'Hot pink', 'Bold fuchsia'],
      },
    },
  },

  'black-american': {
    communityId: 'black-american',
    communityName: 'Black American',
    lipBeautyPhilosophy: 'Black American lip beauty is a cultural institution. From the bold red lips of Josephine Baker and Dorothy Dandridge to the matte lip revolution driven by Black MUAs and brands, this community has defined and redefined lip beauty standards globally. Full, defined lips are celebrated — natural lip fullness is prized, and makeup techniques are sophisticated. A significant portion of the beauty industry\'s innovation in lip color for deep skin tones has been community-driven.',
    commonConcerns: [
      'Lip hyperpigmentation — dark lip borders',
      'Uneven lip tone (lighter center, darker edges, or vice versa)',
      'Finding nudes that don\'t look ashy or disappear on deep skin',
      'Lipstick oxidizing and changing color on melanin-rich lips',
      'Dark corners of the mouth',
    ],
    traditionalPractices: [
      {
        name: 'Jamaican Black Castor Oil Lip Treatment',
        description: 'JBCO applied to the lips and surrounding area as an overnight treatment. Deeply moisturizing and conditions the delicate lip skin.',
        application: 'Apply JBCO to lips and just outside the lip border before sleep. Wash off in the morning.',
        benefit: 'Ricinoleic acid moisturizes, reduces inflammation, and may stimulate circulation.',
        communityCulture: 'JBCO is a cornerstone product in Black American beauty culture — used for hair, scalp, and skin.',
      },
      {
        name: 'Shea Butter and Vitamin E Lip Balm',
        description: 'DIY lip balm combining unrefined shea butter and vitamin E oil. A beloved home recipe in Black American beauty culture.',
        recipe: '2 tbsp shea butter + 1 tbsp vitamin E oil + optional 1 tsp beeswax (for firmer texture) + optional few drops peppermint EO. Mix. Store in a small tin.',
        tradition: 'Passed down through generations. Grandmothers\' versions often include petroleum jelly and raw honey.',
      },
      {
        name: 'African Black Soap Lip Area Cleanse',
        description: 'African black soap used gently on the lip area to cleanse, brighten, and address hyperpigmentation around the mouth.',
        method: 'Make a gentle lather. Apply to the lip area (not lips themselves). Leave 30 seconds. Rinse. Follow with vitamin C serum and SPF.',
        caution: 'Don\'t use on the lips directly — too alkaline and drying for the lip itself.',
      },
      {
        name: 'Honey and Aloe Lip Healing Mask',
        description: 'Equal parts honey and aloe vera gel applied to the lips for healing, hydrating, and treating lip dryness.',
        recipe: '1 tsp raw honey + 1 tsp pure aloe vera gel. Apply. Leave 15–20 minutes. Rinse.',
      },
    ],
    nudeLipGuide: {
      challenge: 'Finding a "nude" lip color that doesn\'t disappear, look chalky, or ashy on deep melanin-rich skin is one of the most discussed topics in Black American beauty.',
      approach: 'True nudes for deep skin are warm-toned, richly pigmented, and have brown, terracotta, or mocha undertones — NOT pink, not pale, not gray.',
      shadesByDepth: {
        caramelMedium: 'Tawny rose, warm peach-brown, golden nude',
        richBrown: 'Sienna, terracotta, warm mocha',
        deepEbony: 'Rich mahogany, warm coffee brown, deep bronze nude',
      },
      topProducts: [
        'Fenty Beauty Stunna Lip Paint (Uncuffed, Uninvited)',
        'Mented Cosmetics Nude Lipstick',
        'BLK/OPL True Color Lipstick',
        'UOMA Beauty Badass Icon Matte Lipstick',
        'NYX Soft Matte Lip Cream (Cape Town, Prague)',
        'MAC Spirit (for medium deep), Antique Velvet (for very deep)',
      ],
    },
    oxidizationSolutions: {
      issue: 'Many lipsticks, particularly pink-based formulas, oxidize on the higher pH of darker skin and turn orange or muddy.',
      solutions: [
        'Test lipstick on wrist (dark) and inner arm (lighter) to predict oxidization',
        'Apply a lip primer or a neutral lipstick base first to create a neutral pH layer',
        'Choose formulas labeled "long wear" which tend to oxidize less',
        'Build coverage in thin layers — each layer is less prone to color shift',
        'Choose lip stains over traditional lipstick — stains oxidize less',
      ],
    },
    lipLineCulture: {
      note: 'Lip liner is a cornerstone of Black American lip artistry. The precise lip line is a mark of care and intentionality.',
      techniques: [
        'Line with a matching or slightly darker pencil for definition',
        'Fill in entire lip with liner before applying lipstick for longevity',
        'Over-line subtly at the Cupid\'s bow for a lifted look',
        'Block out natural lip with concealer before liner for maximum precision',
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LIP CARE UNIVERSAL GUIDE
// ─────────────────────────────────────────────────────────────────────────────

export const UNIVERSAL_LIP_CARE = {
  dailyRoutine: {
    am: [
      'Gently wipe lips with warm damp cloth to remove dead skin from overnight',
      'Apply lip serum or treatment (vitamin C for brightness, hyaluronic acid for plump)',
      'Apply SPF lip balm — UV damage causes lip darkening and lip cancer',
      'Wait 5 minutes before applying lip color',
    ],
    pm: [
      'Remove all lip color thoroughly — matte formulas especially require oil-based removal',
      'Apply an overnight lip mask or treatment',
      'If lips are very dry, seal with a thin layer of an occlusive (petroleum jelly, thick balm)',
    ],
    weekly: [
      'Gentle lip exfoliation 1–2 times per week',
      'Deep lip mask treatment (honey, camellia oil, or commercial sleeping mask)',
    ],
  },

  lipHyperpigmentationUniversal: {
    prevention: [
      'SPF lip balm daily — most lip darkening is UV-driven',
      'Don\'t pick or bite lips — causes post-inflammatory hyperpigmentation',
      'Stay hydrated — dehydration causes lip dryness and peeling which worsens hyperpigmentation',
      'Choose fragrance-free lip products if you have sensitive skin',
      'Don\'t use lemon juice directly on lips — causes photosensitivity',
    ],
    ingredients: [
      'Vitamin C — melanin inhibitor',
      'Kojic acid — skin brightener',
      'Niacinamide — gentle brightener in lip-safe formulations',
      'Alpha-arbutin — brightens without irritation',
      'Retinol (low concentration) — for fine lines and mild brightening, use with caution on lips',
    ],
  },

  lipFillnessGuide: {
    naturalPlumping: [
      'Cinnamon lip balm (temporary — mild irritant that increases blood flow)',
      'Hyaluronic acid lip serum for hydration and plump appearance',
      'Over-lining lips with liner for the appearance of fullness',
      'Highlighting the Cupid\'s bow with a light shimmer',
      'Placing gloss in the center of the lower lip',
    ],
    cosmeticProcedures: [
      'Hyaluronic acid filler — most popular, reversible, lasts 6–12 months',
      'Lip flip (Botox relaxes the muscle to flip upper lip slightly outward) — subtle, lasts 3 months',
      'Permanent makeup for lip liner definition',
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function getLipCareGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_LIP_CARE_GUIDES['west-african'],
    'south-asian': ETHNIC_LIP_CARE_GUIDES['south-asian'],
    'caribbean': ETHNIC_LIP_CARE_GUIDES['caribbean'],
    'arab': ETHNIC_LIP_CARE_GUIDES['arab'],
    'latina': ETHNIC_LIP_CARE_GUIDES['latina'],
    'east-asian': ETHNIC_LIP_CARE_GUIDES['east-asian'],
    'east-african': ETHNIC_LIP_CARE_GUIDES['east-african'],
    'south-african': ETHNIC_LIP_CARE_GUIDES['south-african'],
    'black-american': ETHNIC_LIP_CARE_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

export const LIP_CARE_STATS = {
  moduleId: 'lip_care_ethnic_guide',
  communitiesCovered: 9,
  traditionalPracticesCovered: 36,
  lipColorGuidesCovered: 9,
  brightening_treatmentsCovered: 16,
  version: '1.0.0',
};
