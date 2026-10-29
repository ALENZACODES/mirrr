// pregnancy_beauty_ethnic_guide.js
// Ethnic pregnancy beauty guides covering 9 communities + universal section
// All content is for informational purposes only — always consult a healthcare provider

export const ETHNIC_PREGNANCY_BEAUTY_GUIDES = {

  // ─── WEST AFRICAN ────────────────────────────────────────────────────────────
  'west-african': {
    communityId: 'west-african',
    displayName: 'West African',
    regions: ['Nigeria', 'Ghana', 'Senegal', 'Ivory Coast', 'Sierra Leone'],

    pregnancyPhilosophy: `In West African tradition, pregnancy is a communal celebration — the whole village
      helps carry the mother. The body is treated as sacred ground during this time, and beauty
      rituals are inseparable from spiritual protection and community care. Elders pass down
      knowledge about which plants to trust and which to leave alone until after birth.`,

    safeSkincare: {
      avoid: [
        { ingredient: 'Mercury-based skin lighteners', reason: 'Highly toxic to fetal nervous system; common in some imported African creams' },
        { ingredient: 'Hydroquinone', reason: 'Absorbed systemically; safety in pregnancy not established' },
        { ingredient: 'Kojic acid (high concentration)', reason: 'Limited pregnancy safety data; avoid products over 1%' },
        { ingredient: 'Retinoids / Vitamin A derivatives', reason: 'Teratogenic at high doses; avoid all forms topically and orally' },
        { ingredient: 'Camphor-heavy preparations', reason: 'Can penetrate skin and harm fetus in large amounts' },
      ],
      safeAlternatives: [
        { ingredient: 'Unrefined shea butter', benefit: 'Deep moisturizer, anti-inflammatory, rich in vitamins A and E — the quintessential West African pregnancy staple' },
        { ingredient: 'Black soap (pure, fragrance-free)', benefit: 'Gentle cleansing with plantain ash and shea; safe for pregnancy acne when unscented' },
        { ingredient: 'African black seed oil (topical)', benefit: 'Antioxidant-rich for skin tone; topical use is generally considered safe' },
        { ingredient: 'Rosehip oil', benefit: 'Vitamin C precursor, helps with hyperpigmentation safely' },
        { ingredient: 'Baobab oil', benefit: 'Rich in omega fatty acids; deeply nourishing for belly skin' },
      ],
      notes: 'Avoid any skin-lightening cream purchased from informal markets without ingredient labels. Nigerian and Ghanaian pharmacies sometimes stock imported products containing mercury or unlabeled steroids.',
    },

    stretchMarkPrevention: {
      startingPoint: 'Begin at 12 weeks when skin begins stretching in earnest',
      traditionalApproach: [
        'Daily shea butter massage from navel outward, ideally warmed between the palms first',
        'Palm kernel oil blended with shea applied nightly to hips, thighs, and belly',
        'Baobab pulp paste mixed with water applied as a cooling belly mask weekly',
      ],
      modernApproach: [
        'Layer hyaluronic acid serum under shea butter to lock in water content',
        'Bio-Oil or Mederma alongside traditional oils for proven stretch mark evidence base',
        'Silicone sheets on existing marks post-partum',
      ],
      communityWisdom: 'Many Yoruba grandmothers say the secret is consistency — not the oil itself, but touching your belly every single day to keep the skin supple and your bond with baby strong.',
    },

    hairChanges: {
      whatHappens: [
        'Elevated estrogen extends the growth phase — most women experience thicker, longer hair through trimesters 2 and 3',
        'Some West African women experience postpartum shedding (telogen effluvium) 3–6 months after birth that can feel alarming but is temporary',
        'Scalp sensitivity increases; protective styles may feel tighter than usual',
      ],
      management: [
        'Loosen braids and twists — tension headaches are more common in pregnancy',
        'Switch to fragrance-free shea butter or unscented edge control to reduce scalp irritation',
        'Avoid chemical relaxers especially in first trimester — fumes and absorption risk',
        'Castor oil (JBCO or regular) scalp massages are safe topically and support scalp health',
        'Sleep on satin pillowcase to reduce friction on natural hair',
      ],
    },

    prenatalBeautyFoods: [
      { food: 'Moringa (Ewe Igbale)', benefit: 'Exceptionally high in iron, calcium, and vitamin C; supports skin collagen and reduces fatigue-related dullness', note: 'Use as leaf powder in small culinary amounts — avoid concentrated supplements' },
      { food: 'Egusi (melon seeds)', benefit: 'Rich in zinc and vitamin E; supports skin repair and immune function' },
      { food: 'Palm nut soup ingredients (tomato, pepper, leafy greens)', benefit: 'Lycopene from tomatoes + vitamin K from greens supports vascular skin health' },
      { food: 'Tilapia and catfish', benefit: 'Omega-3 DHA for fetal brain and skin barrier development; lower mercury than large fish' },
      { food: 'African yam (Dioscorea)', benefit: 'Complex carbs support steady blood sugar, reducing cortisol-driven skin flare-ups' },
    ],

    traditionalPregnancyRituals: [
      {
        name: 'Omo Ceremony (Naming Day Preparation)',
        community: 'Yoruba (Nigeria)',
        description: 'In Yoruba tradition, the omo (child) ceremony on day 8 for girls and day 9 for boys involves community gathering. The mother begins preparation with a ritual bath 3 days prior using herbs like efirin (African basil) and osan wewe (bitter orange leaves), believed to cleanse and protect both mother and newborn.',
        beautyElement: 'Mother is adorned with ede (guinea corn bead) body jewelry and obi (kola nut) paste is applied to wrists for blessings',
      },
      {
        name: 'Shea Butter Blessing Ritual',
        community: 'Ghana / Northern Nigeria',
        description: 'Older women in the community gather to anoint the pregnant woman\'s belly with freshly churned shea butter while reciting blessings. This is often done at the seven-month mark and is considered both a spiritual blessing and a skin preparation ritual.',
        beautyElement: 'Belly is gently massaged in circular motions as blessings are spoken; sometimes henna in non-toxic plant form is added to the hands',
      },
      {
        name: 'Ukwu Nne Ceremony',
        community: 'Igbo (Nigeria)',
        description: 'A celebration hosted by the husband\'s family for the pregnant wife, involving the gift of ukwu (palm wine), cloth wrappings, and communal cooking. The mother-to-be is dressed in the finest akwa ocha (white cloth) and her hair is braided elaborately by community women.',
        beautyElement: 'Elaborate braiding session with natural oils, jewelry gifted symbolizing fertility and protection',
      },
    ],

    glowRecipe: {
      name: 'West African Pregnancy Belly Glow Mask',
      origin: 'Adapted from Ghanaian and Nigerian home traditions',
      ingredients: [
        '2 tablespoons unrefined shea butter (softened)',
        '1 tablespoon raw honey (local if possible)',
        '1 teaspoon moringa leaf powder',
        '5 drops rosehip oil',
      ],
      method: 'Melt shea butter gently until just soft. Mix in honey and moringa powder until smooth. Add rosehip oil and stir well. Apply in circular motions to belly, hips, and thighs. Leave for 20 minutes then wipe with warm damp cloth. Use 2–3 times per week.',
      safetyNote: 'Patch test first. Discontinue if skin becomes irritated. Moringa is used in culinary amounts here — not supplementation.',
    },
  },

  // ─── SOUTH ASIAN ─────────────────────────────────────────────────────────────
  'south-asian': {
    communityId: 'south-asian',
    displayName: 'South Asian',
    regions: ['India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal'],

    pregnancyPhilosophy: `Ayurveda views pregnancy as a time of heightened vata energy — the body and
      mind are more sensitive and receptive. Beauty rituals are intertwined with diet, rest, and
      dosha balance. The goal is not just outward glow but inner nourishment (ojas) that reflects
      through the skin. Modern South Asian women often blend Ayurvedic wisdom with dermatology.`,

    safeSkincare: {
      avoid: [
        { ingredient: 'High-dose turmeric supplements (oral)', reason: 'May stimulate uterine contractions in supplement form; culinary use is fine' },
        { ingredient: 'Methi (fenugreek) as supplement', reason: 'Uterine stimulant in large amounts — avoid capsules; cooking quantities are safe' },
        { ingredient: 'Neem oil (high concentration, topical)', reason: 'Potentially spermicidal and contraceptive properties; avoid concentrated forms' },
        { ingredient: 'Retinoids / retinol', reason: 'Teratogenic; avoid all forms' },
        { ingredient: 'Chemical sunscreen oxybenzone', reason: 'Endocrine disruption concern; switch to mineral SPF' },
      ],
      safeAlternatives: [
        { ingredient: 'Turmeric (haldi) in face paste — small amounts', benefit: 'Anti-inflammatory, brightening for pregnancy melasma; safe topically in paste form' },
        { ingredient: 'Amla (Indian gooseberry)', benefit: 'Extremely high vitamin C; supports collagen production and skin radiance — safe in food and juice' },
        { ingredient: 'Rose water (gulab jal)', benefit: 'Gentle toner for sensitive pregnancy skin; anti-inflammatory and hydrating' },
        { ingredient: 'Coconut oil (nariyal tel)', benefit: 'Safe belly massage oil; antifungal properties help with belly skin microbiome' },
        { ingredient: 'Zinc oxide mineral sunscreen', benefit: 'Safe UV protection critical for managing pregnancy melasma without chemical concern' },
      ],
      notes: 'Shatavari (Asparagus racemosus) is revered in Ayurveda for reproductive health but should be used cautiously in pregnancy — consult an Ayurvedic practitioner or OB before use.',
    },

    stretchMarkPrevention: {
      startingPoint: 'Begin at 12 weeks; South Asian skin tones are prone to hyperpigmented stretch marks that last longer',
      traditionalApproach: [
        'Coconut oil massage (tel malish) twice daily on belly, breasts, and hips',
        'Chandan (sandalwood) paste mixed with rose water applied weekly to areas prone to marks',
        'Mustard oil (sarson ka tel) massages in some North Indian traditions — patch test first as it can be sensitizing',
      ],
      modernApproach: [
        'Centella asiatica (gotu kola) creams — well-studied for stretch mark prevention',
        'Hyaluronic acid body serum under coconut oil for added hydration depth',
        'Tretinoin only postpartum (if needed for marks after breastfeeding ends)',
      ],
      communityWisdom: 'The daily tel malish (oil massage) tradition in India is more than skin care — it is a bonding ritual between women of the family, passed from mother to daughter.',
    },

    hairChanges: {
      whatHappens: [
        'Hair often becomes thicker and more lustrous due to elevated estrogen — many South Asian women experience their best hair during pregnancy',
        'Scalp may become oilier requiring more frequent washing',
        'Postpartum hair fall (sometimes dramatic in South Asian women) typically begins 3–4 months after delivery',
      ],
      management: [
        'Brahmi oil or bhringraj oil scalp massage 1–2 times per week — safe in pregnancy and supports scalp circulation',
        'Avoid ammonia-based hair dyes especially in first trimester; henna is safer but patch test for allergies',
        'Amla oil strengthens hair shaft; safe throughout pregnancy',
        'If oiliness increases, switch to lighter coconut or aloe vera gel as scalp treatment rather than heavy oils',
      ],
    },

    prenatalBeautyFoods: [
      { food: 'Amla (Indian gooseberry)', benefit: 'Highest natural vitamin C source; boosts skin collagen, immune function, and iron absorption', note: 'Juice or fresh; avoid concentrated supplements' },
      { food: 'Methi seeds (culinary)', benefit: 'Iron, magnesium, and B vitamins support blood health and reduce skin dullness; cooking quantities safe', note: 'Do not take as supplement' },
      { food: 'Ghee', benefit: 'Ayurveda considers ghee deeply nourishing for ojas — the essential vitality that makes skin luminous; healthy fats support fetal brain development' },
      { food: 'Lentils (dal) — especially masoor and moong', benefit: 'Plant-based iron and folate; iron deficiency is a primary cause of pallor and dullness in pregnancy' },
      { food: 'Coconut water', benefit: 'Natural electrolytes support circulation, reducing puffiness; hydration is directly reflected in skin plumpness' },
    ],

    traditionalPregnancyRituals: [
      {
        name: 'Godhbharai (Seemantham)',
        community: 'Hindu traditions across South Asia',
        description: 'Godhbharai (North India) or Seemantham (South India) is the Hindu baby shower ceremony performed in the seventh month. The pregnant woman is adorned with flowers, dressed in auspicious colors (often yellow or green), and her lap is filled with fruits symbolizing abundance. Music, song, and blessings are central to the event.',
        beautyElement: 'Bride-like adornment: flowers in hair, glass bangles, silk saree, turmeric paste applied to hands for glow and protection',
      },
      {
        name: 'Haldi (Turmeric Ceremony)',
        community: 'Pan-South Asian',
        description: 'Similar to the pre-wedding haldi, some families perform a turmeric application ritual on the pregnant woman during the Godhbharai or separately. Fresh turmeric paste is applied to the face, arms, and belly by elder women, believed to purify the skin and protect from the evil eye.',
        beautyElement: 'Turmeric glow treatment followed by rose water rinse — leaves skin brightened and is genuinely beneficial for pregnancy hyperpigmentation',
      },
      {
        name: 'Tel Malish (Oil Blessing)',
        community: 'North India, Pakistan',
        description: 'In many families, the mother-in-law or senior women perform a ritual oil massage on the mother-to-be in the final trimester. Mustard oil or coconut oil is warmed, prayers are recited, and the massage is performed on the back, belly, and feet to ease discomfort and symbolize the transfer of generational wisdom.',
        beautyElement: 'Full-body nourishing massage that also serves as stretch mark prevention and stress relief',
      },
    ],

    glowRecipe: {
      name: 'Haldi-Amla Pregnancy Glow Paste',
      origin: 'Traditional South Asian home remedy, modernized for pregnancy safety',
      ingredients: [
        '1 teaspoon turmeric powder (haldi)',
        '1 tablespoon amla juice or powder reconstituted',
        '1 tablespoon plain full-fat yogurt (dahi)',
        '1 teaspoon raw honey',
        '3 drops rose water',
      ],
      method: 'Mix all ingredients into a smooth paste. Apply to clean face avoiding the eye area. Leave for 15 minutes. Rinse gently with lukewarm water. Use weekly. Note: turmeric may temporarily stain — rinse well and follow with rose water toner.',
      safetyNote: 'Patch test on inner wrist 24 hours before first use. Turmeric is used in small topical amounts here, not as a supplement.',
    },
  },

  // ─── CARIBBEAN ───────────────────────────────────────────────────────────────
  'caribbean': {
    communityId: 'caribbean',
    displayName: 'Caribbean',
    regions: ['Jamaica', 'Trinidad & Tobago', 'Barbados', 'Guyana', 'Haiti', 'Dominican Republic'],

    pregnancyPhilosophy: `Caribbean pregnancy traditions are rooted in the wisdom of "bush medicine" — the
      knowledge of local plants passed down through generations of mothers. The land and sea are seen
      as providing everything the body needs. Modern Caribbean women navigate between bush wisdom and
      medical guidance, often finding they complement each other more than they conflict.`,

    safeSkincare: {
      avoid: [
        { ingredient: 'Hibiscus tea (sorrel) in large amounts', reason: 'May stimulate uterine contractions; a cup occasionally is likely fine but avoid daily large portions' },
        { ingredient: 'Bush teas containing pennyroyal, rue (ruda), or mugwort', reason: 'Known abortifacients; never consume during pregnancy' },
        { ingredient: 'Mercury skin bleaching creams', reason: 'Still found in some Caribbean markets; check all labels carefully' },
        { ingredient: 'Retinoids', reason: 'Teratogenic; avoid all forms' },
        { ingredient: 'High-dose aloe vera internally', reason: 'Aloe latex (inner leaf) is a powerful laxative and uterine stimulant; topical gel is safe' },
      ],
      safeAlternatives: [
        { ingredient: 'Aloe vera gel (topical, outer leaf only)', benefit: 'Cooling, healing for itchy pregnancy belly; safe applied externally' },
        { ingredient: 'Sea moss gel (Irish moss / Gracilaria)', benefit: 'Rich in iodine, collagen-supporting minerals; topical use as mask is safe; oral use in culinary amounts generally considered fine' },
        { ingredient: 'Coconut oil', benefit: 'Universal moisturizer; safe belly oil for stretch mark prevention' },
        { ingredient: 'Shea butter', benefit: 'Deeply nourishing for skin elasticity' },
        { ingredient: 'Papaya (ripe only, external)', benefit: 'Ripe papaya is safe to eat and the pulp can be used as an enzyme mask; unripe papaya contains latex and should be avoided' },
      ],
      notes: 'Distinguishing "bush bath" from "bush drink" is critical — many topical herbal baths that are safe to soak in are not safe to drink. Always ask a midwife or OB before any herbal tea or tonic during pregnancy.',
    },

    stretchMarkPrevention: {
      startingPoint: 'Begin with coconut oil as early as first trimester when skin is starting to stretch',
      traditionalApproach: [
        'Coconut oil application morning and night — the Caribbean staple belly oil',
        'Aloe vera gel from a backyard plant (outer gel only) applied as a cooling belly treatment',
        'Sea moss gel applied to belly as a mineral-rich mask, rinsed after 20 minutes',
      ],
      modernApproach: [
        'Centella asiatica cream alongside traditional oils',
        'Bio-Oil combined with coconut oil for enhanced efficacy',
        'Silicone-based scar treatment postpartum if marks appear',
      ],
      communityWisdom: 'Caribbean grandmothers often say "de coconut does fix everything" — and modern dermatology has confirmed its occlusive barrier properties make it an effective skin moisturizer.',
    },

    hairChanges: {
      whatHappens: [
        'Natural and relaxed hair alike benefits from elevated estrogen — less shedding, increased growth',
        'Scalp sensitivity is common; braids and extensions may need loosening',
        'Humidity in Caribbean climates can increase frizz and scalp moisture needs',
      ],
      management: [
        'Coconut oil hot oil treatment weekly is safe and deeply conditioning',
        'Avoid chemical relaxers in first trimester; consider transitioning to natural styles during pregnancy',
        'Sea moss gel can be used as a natural hair gel — mineral-rich and safe',
        'Aloe vera gel (outer leaf) mixed with coconut oil makes a light, safe leave-in conditioner',
      ],
    },

    prenatalBeautyFoods: [
      { food: 'Sea moss (Irish moss)', benefit: 'Contains 92 of the 102 minerals the body needs; supports collagen matrix, thyroid function, and skin hydration', note: 'Use in culinary amounts; high iodine content means moderation is key' },
      { food: 'Callaloo (amaranth greens)', benefit: 'High in folate, iron, and calcium; iron supports healthy color and glow in the skin' },
      { food: 'Green banana (boiled)', benefit: 'Resistant starch supports gut health; B vitamins contribute to skin cell turnover' },
      { food: 'Plantain', benefit: 'Vitamin B6, potassium; helps reduce leg swelling and skin water retention' },
      { food: 'Fresh coconut water', benefit: 'Electrolytes and natural lauric acid support skin hydration from the inside out' },
    ],

    traditionalPregnancyRituals: [
      {
        name: 'Bush Bath Blessing',
        community: 'Jamaica / Pan-Caribbean',
        description: 'A ritual bath prepared with safe herbs such as sweet basil, lemongrass, and fresh rose petals. Elder women in the community prepare the bath water and the pregnant woman soaks in it for relaxation and spiritual cleansing. Distinct from ingested bush teas — the topical bath is considered much safer.',
        beautyElement: 'Skin is soft and fragrant after the botanical soak; ritual marks a transition into the final stage of pregnancy',
        safetyNote: 'Only use approved herbs — pennyroyal, rue, and mugwort must never be in a pregnancy bush bath',
      },
      {
        name: 'Belly Oil Ceremony',
        community: 'Trinidad & Tobago',
        description: 'In some Trinidadian families, the mother-in-law performs a first oil application on the belly at the end of the first trimester as a blessing. Virgin coconut oil is warmed and applied as prayers are spoken. This marks the point at which the pregnancy is announced more widely.',
        beautyElement: 'Coconut oil massage supports skin elasticity and serves as the first intentional stretch mark prevention ritual',
      },
      {
        name: 'Nine Night / Community Gathering',
        community: 'Jamaican',
        description: 'While nine night is traditionally post-funeral, Caribbean communities also gather for expectant mother celebrations. Women share beauty and birth knowledge, gifts of oil, herbal preparations (safe ones), and cloth. The mother-to-be is pampered with hand treatments and hair braiding.',
        beautyElement: 'Hand and foot care using coconut oil, sea moss, and local botanicals shared by community women',
      },
    ],

    glowRecipe: {
      name: 'Caribbean Sea Moss & Coconut Pregnancy Belly Mask',
      origin: 'Jamaica / Eastern Caribbean home tradition',
      ingredients: [
        '2 tablespoons prepared sea moss gel',
        '1 tablespoon virgin coconut oil',
        '1 tablespoon fresh aloe vera gel (outer leaf, not latex)',
        '1 teaspoon raw local honey',
      ],
      method: 'Blend sea moss gel until smooth. Mix in coconut oil, aloe, and honey. Apply generously to belly, hips, and thighs. Rest for 20–25 minutes. Rinse with warm water and pat dry. Follow with additional coconut oil. Use twice weekly.',
      safetyNote: 'Ensure aloe used is outer-leaf gel, not the yellow latex beneath the skin. Sea moss gel should be freshly prepared or from a trusted source without additives.',
    },
  },

  // ─── ARAB ────────────────────────────────────────────────────────────────────
  'arab': {
    communityId: 'arab',
    displayName: 'Arab',
    regions: ['Egypt', 'Lebanon', 'Morocco', 'Jordan', 'Saudi Arabia', 'UAE', 'Palestine'],

    pregnancyPhilosophy: `Arab pregnancy beauty traditions draw from Islamic guidance, Greco-Arab medicine
      (tibb nabawi and Unani), and centuries of botanical knowledge passed through families. The
      concept of tayyib — pure and wholesome — applies as much to what goes on the body as what
      goes into it. Pregnancy is a time of increased spiritual sensitivity and the mother's
      inner state is believed to directly shape the child.`,

    safeSkincare: {
      avoid: [
        { ingredient: 'Kohl (surma/ithmid) containing lead', reason: 'Traditional kohl often contains lead carbonate; highly toxic in pregnancy — seek certified lead-free alternatives' },
        { ingredient: 'Black seed oil (nigella sativa) in high supplemental doses', reason: 'May stimulate uterine contractions in large amounts; culinary use is fine but avoid concentrated supplements during pregnancy' },
        { ingredient: 'Ammoniated mercury creams (skin lighteners)', reason: 'Still found in some markets; strictly avoid during pregnancy' },
        { ingredient: 'Retinoids', reason: 'Teratogenic; avoid all forms' },
        { ingredient: 'Parabens in high concentration', reason: 'Weak endocrine disruptors; minimize exposure during pregnancy' },
      ],
      safeAlternatives: [
        { ingredient: 'Argan oil (Moroccan gold)', benefit: 'Rich in vitamin E and oleic acid; excellent for belly, face, and hair during pregnancy' },
        { ingredient: 'Rose water (ma ward)', benefit: 'Gentle toner and face mist; anti-inflammatory and safe throughout pregnancy' },
        { ingredient: 'Rhassoul clay', benefit: 'Moroccan clay mask for pregnancy acne and oily skin; absorbs excess sebum without harsh chemicals' },
        { ingredient: 'Black seed oil (topical, diluted)', benefit: 'Anti-inflammatory scalp and skin treatment; topical use in low concentration is considered safe' },
        { ingredient: 'Frankincense resin (lubaan) — topical only', benefit: 'Traditional scar and skin healing; safe topically; do not use essential oil internally or in high doses during pregnancy' },
      ],
      notes: 'Lead-free kohl does exist and is a priority swap for Arab women who use kohl daily. Look for kohl certified free of lead — some antimony-based formulas are safer alternatives.',
    },

    stretchMarkPrevention: {
      startingPoint: 'Begin with argan oil application from first trimester',
      traditionalApproach: [
        'Argan oil (zit argan) massage daily on belly, hips, and breasts — a Moroccan tradition particularly',
        'Rose water and olive oil blend applied nightly in Levantine tradition',
        'Henna paste (on hands and feet only — not belly) used for decoration and believed to bring baraka (blessing)',
      ],
      modernApproach: [
        'Layer hyaluronic acid serum under argan oil for maximum hydration',
        'Centella asiatica belly cream for evidence-based stretch mark prevention',
        'Vitamin C serum (L-ascorbic acid) for skin resilience',
      ],
      communityWisdom: 'Egyptian grandmothers have used a blend of olive oil and sesame oil for belly skin for centuries — both are rich in antioxidants and have been shown to maintain skin barrier function.',
    },

    hairChanges: {
      whatHappens: [
        'Thick hair becomes even thicker in many Arab women during pregnancy',
        'Hair texture may temporarily change — straighter or wavier than usual',
        'Scalp oiliness common in second trimester',
      ],
      management: [
        'Argan oil scalp treatment once weekly — safe and traditional',
        'Avoid henna dyes in first trimester out of caution; plant-based henna is safer than chemical-added "black henna" which contains PPD',
        'Rhassoul clay can be used as a scalp detox mask for oily scalp',
        'Black seed oil diluted in a carrier oil for scalp massage — supports circulation and hair health',
      ],
    },

    prenatalBeautyFoods: [
      { food: 'Dates (tamr)', benefit: 'Iron, potassium, and natural sugars; studies suggest dates in final weeks may support cervical ripening; B vitamins contribute to skin health', note: 'Prophetically recommended; modern research supports benefits near term' },
      { food: 'Olive oil', benefit: 'Monounsaturated fats and polyphenols; consumed daily in Levantine diet, supports skin elasticity and anti-inflammatory benefit' },
      { food: 'Pomegranate (rumman)', benefit: 'Rich in antioxidants and folate; skin brightening properties and anti-inflammatory; widely consumed across Arab world in pregnancy' },
      { food: 'Lentil soup (shorbat adas)', benefit: 'Iron and folate staple of Arab pregnancy diet; directly combats anemia-related pallor' },
      { food: 'Sesame (simsim / tahini)', benefit: 'Calcium, zinc, and vitamin E; supports bone development in fetus and skin health in mother' },
    ],

    traditionalPregnancyRituals: [
      {
        name: 'Henna Celebration (Islamic Baby Shower Equivalent)',
        community: 'Pan-Arab / Muslim tradition',
        description: 'Many Arab families host a henna night for the pregnant woman, inspired by the pre-wedding henna tradition. Female relatives gather, professional henna artists apply intricate designs to the mother\'s hands and feet, and sweets are shared. This usually occurs in the seventh or eighth month.',
        beautyElement: 'Full hand and foot henna designs; beautification of the mother is an act of honoring the sacred state of pregnancy',
        safetyNote: 'Ensure pure plant henna is used. Black henna contains PPD and should be avoided during pregnancy due to sensitization risk.',
      },
      {
        name: 'Aqiqah Preparation',
        community: 'Pan-Arab Islamic tradition',
        description: 'The Aqiqah (celebration of birth on day 7) requires the mother to prepare spiritually and physically. In the days after birth, women of the family assist with sponge baths using rose water, apply kohl (lead-free) to the mother\'s eyes following tradition, and anoint the baby\'s head with pure oils.',
        beautyElement: 'Mother is adorned and cared for; post-birth recovery beauty rituals using rose water and argan oil',
      },
      {
        name: 'Khamsin Salt Bath',
        community: 'Egyptian tradition',
        description: 'An Egyptian tradition involving a ritual mineral salt bath with rose water for the mother in the final weeks of pregnancy, believed to cleanse and prepare the body for birth. Sometimes combined with a gentle pumice scrub of feet and an argan oil full-body massage.',
        beautyElement: 'Dead Sea salt or Red Sea salt dissolved in warm bath; deeply hydrating skin treatment',
      },
    ],

    glowRecipe: {
      name: 'Argan & Rose Water Pregnancy Belly Oil',
      origin: 'Moroccan-Levantine blend',
      ingredients: [
        '3 tablespoons argan oil (cold-pressed)',
        '1 tablespoon rose water',
        '1 tablespoon sweet almond oil',
        '5 drops frankincense essential oil (topical blend only — not for internal use)',
      ],
      method: 'Combine argan and almond oils. Add rose water and whisk until slightly emulsified. Add frankincense drops and stir. Apply to belly, hips, and thighs with slow circular massage motions morning and evening. Keep refrigerated and use within 2 weeks.',
      safetyNote: 'Frankincense essential oil in this topical amount is generally considered safe. Do not consume essential oils internally during pregnancy. If any sensitivity develops, omit the frankincense and use plain argan + almond oil.',
    },
  },

  // ─── LATINA ──────────────────────────────────────────────────────────────────
  'latina': {
    communityId: 'latina',
    displayName: 'Latina',
    regions: ['Mexico', 'Colombia', 'Brazil', 'Puerto Rico', 'Cuba', 'Guatemala', 'Peru'],

    pregnancyPhilosophy: `Latin American pregnancy traditions are a vibrant blend of Indigenous botanical
      knowledge, Catholic spiritual blessing, and the guidance of curanderas and parteras
      (traditional midwives). Family is central — pregnancy is never a solo journey. The mother
      is celebrated, fed, and cared for by a network of women, and beauty rituals are part of
      that communal nurturing.`,

    safeSkincare: {
      avoid: [
        { ingredient: 'Ruda (rue / Ruta graveolens)', reason: 'A known abortifacient used in curanderismo; never use in any form during pregnancy — topically, as tea, or supplement' },
        { ingredient: 'Hierba santa / Pepicha in large amounts', reason: 'Safrole content concerns; culinary use may be fine but avoid medicinal doses' },
        { ingredient: 'Azafran (saffron) in high supplemental amounts', reason: 'Large doses may stimulate contractions; culinary pinch is safe' },
        { ingredient: 'Retinoids', reason: 'Teratogenic; avoid' },
        { ingredient: 'Hydroquinone', reason: 'Absorbed systemically; not established as safe in pregnancy' },
      ],
      safeAlternatives: [
        { ingredient: 'Avocado oil', benefit: 'Rich in oleic acid and vitamin E; safe belly and body oil — a natural staple across Latin America' },
        { ingredient: 'Nopal (cactus) gel', benefit: 'Cooling, anti-inflammatory, rich in vitamin C; topical use supports skin healing and brightening' },
        { ingredient: 'Aloe vera (sabila) gel', benefit: 'Safe topically from outer leaf; cooling for itchy pregnancy belly' },
        { ingredient: 'Coconut oil', benefit: 'Universal safe moisturizer; anti-fungal properties useful for belly skin microbiome' },
        { ingredient: 'Papaya enzyme mask (ripe fruit only)', benefit: 'Gentle exfoliation; ripe papaya is safe topically; avoid unripe papaya which contains uterus-stimulating latex' },
      ],
      notes: 'Many traditional Mexican and Central American curandera treatments are safe and beautiful — but a handful of common herbs used for menstrual regulation are specifically dangerous in pregnancy. Ruda is the most important to avoid.',
    },

    stretchMarkPrevention: {
      startingPoint: 'Begin at 12 weeks with daily avocado or coconut oil massage',
      traditionalApproach: [
        'Aguacate (avocado) flesh mashed and applied to belly as a nourishing mask weekly',
        'Aceite de oliva (olive oil) massage is traditional across many Latin households',
        'Coconut oil application nightly — increasingly common across all Latin American communities',
      ],
      modernApproach: [
        'Centella asiatica (cica) cream or serum applied under traditional oils',
        'Hyaluronic acid belly serum morning, traditional oil at night',
        'Bio-Oil combined with traditional approach',
      ],
      communityWisdom: 'In Mexican tradition, the partera (midwife) often performed belly massages (sobada) not just for stretch marks but to guide the baby into optimal position — a beautiful dual-purpose ritual.',
    },

    hairChanges: {
      whatHappens: [
        'Many Latina women experience their thickest, most voluminous hair during pregnancy due to hormonal shifts',
        'Hair that is normally wavy may become more defined or less defined with hormonal changes',
        'Scalp sensitivity increases; some women develop pregnancy-related dandruff',
      ],
      management: [
        'Avocado and coconut oil hair masks weekly are safe and deeply nourishing',
        'Avoid chemical relaxers and keratin treatments (formaldehyde concerns) during pregnancy',
        'Aloe vera gel makes a gentle, safe scalp treatment for dandruff or sensitivity',
        'Plant-based henna is safer than chemical dyes if covering grays; avoid black henna (PPD)',
      ],
    },

    prenatalBeautyFoods: [
      { food: 'Avocado (aguacate)', benefit: 'Folate, healthy fats, vitamin E and K; essential for neural tube and skin barrier development; reduces belly skin dryness', note: 'Eat daily if possible' },
      { food: 'Nopal (prickly pear cactus)', benefit: 'Vitamin C, iron, calcium; anti-inflammatory properties reduce pregnancy skin inflammation' },
      { food: 'Chia seeds', benefit: 'Omega-3 ALA, fiber, calcium; skin-supporting nutrients and gut health benefits; a Mexican superfood now validated by nutritionists' },
      { food: 'Hibiscus tea (agua de jamaica) — in moderation', benefit: 'Vitamin C and antioxidants; one small cup occasionally is likely safe but daily large portions are cautioned', note: 'Ask your OB; some advise avoiding entirely' },
      { food: 'Black beans (frijoles negros)', benefit: 'Iron, zinc, folate; black beans are a foundational pregnancy food across Latin America for combating anemia and supporting fetal development' },
    ],

    traditionalPregnancyRituals: [
      {
        name: 'Baby Sprinkle / Babyshower Latina Style',
        community: 'Pan-Latina',
        description: 'The Latino baby shower is a community-wide celebration, typically organized by close female relatives. Decorations are elaborate, food is abundant, and the mother-to-be is pampered with games, gifts, and beauty treatments. In many families, aunts perform a ritual hair brushing and braiding of the mother\'s hair as an act of blessing.',
        beautyElement: 'Flower crowns, elaborate hair styling, hand lotioning ritual performed by female relatives',
      },
      {
        name: 'Limpia (Spiritual Cleansing)',
        community: 'Mexico / Central America',
        description: 'A curandera may perform a limpia (cleansing) using safe herbs, an egg, and prayer to remove negative energy (mal de ojo) that might affect the pregnancy. This ritual uses rosemary, basil, and rue is carefully avoided during pregnancy. The focus is spiritual protection of the mother and child.',
        beautyElement: 'Rosemary-infused topical rinse (not ingested), rose water mist; leaves the mother feeling refreshed and spiritually protected',
        safetyNote: 'If ruda (rue) is traditionally included, request a substitute — a responsible curandera will understand this concern',
      },
      {
        name: 'Sobada (Pregnancy Belly Massage)',
        community: 'Mexico / Guatemala / indigenous traditions',
        description: 'The partera performs a traditional sobada — a skilled abdominal massage used to check baby\'s position, provide comfort, and promote skin elasticity. This is distinct from amateur massage; parteras train for years. In the hands of a skilled practitioner it is safe; random deep belly massage by untrained hands should be avoided.',
        beautyElement: 'Warm oil (olive or coconut) used; mother reports radiant, soft belly skin in the days following',
      },
    ],

    glowRecipe: {
      name: 'Aguacate & Nopal Pregnancy Glow Face Mask',
      origin: 'Mexican home beauty tradition',
      ingredients: [
        '1/2 ripe avocado (mashed)',
        '1 tablespoon fresh nopal gel (or pure nopal juice)',
        '1 tablespoon raw honey',
        '1 teaspoon olive oil',
      ],
      method: 'Mash avocado until very smooth. Mix in nopal gel, honey, and olive oil. Apply generously to clean face and neck. Rest for 15–20 minutes. Rinse with cool water. Pat dry and follow with light moisturizer. Use 1–2 times per week for pregnancy glow.',
      safetyNote: 'All ingredients are food-grade and safe during pregnancy. Patch test nopal if using for the first time as some people have sensitivity.',
    },
  },

  // ─── EAST ASIAN ──────────────────────────────────────────────────────────────
  'east-asian': {
    communityId: 'east-asian',
    displayName: 'East Asian',
    regions: ['China', 'Japan', 'Korea', 'Taiwan', 'Vietnam', 'Mongolia'],

    pregnancyPhilosophy: `Traditional Chinese Medicine (TCM) views pregnancy as a delicate balance of qi
      (vital energy), blood, yin, and yang. The goal is to nourish blood and calm the spirit while
      avoiding herbs that move qi or blood too forcefully. Japanese and Korean traditions similarly
      emphasize minimal intervention, clean simple ingredients, and the mother\'s inner harmony as
      the foundation of outward beauty.`,

    safeSkincare: {
      avoid: [
        { ingredient: 'Dang gui (angelica sinensis) supplements', reason: 'A blood mover in TCM — may increase risk of miscarriage; commonly found in women\'s tonic formulas' },
        { ingredient: 'Peach kernel (tao ren) preparations', reason: 'Blood-activating herb; avoid during pregnancy' },
        { ingredient: 'Safflower (hong hua) in supplements', reason: 'Powerful blood activator in TCM; contraindicated in pregnancy' },
        { ingredient: 'Retinoids', reason: 'Teratogenic; avoid all forms including bakuchiol debated — consult OB' },
        { ingredient: 'Benzoyl peroxide in high concentration', reason: 'Limited pregnancy safety data; prefer low-concentration azelaic acid instead' },
      ],
      safeAlternatives: [
        { ingredient: 'Rice water (fermented or plain)', benefit: 'Traditional Japanese and Korean brightening rinse; rich in inositol and ferulic acid; safe and gentle for pregnancy skin' },
        { ingredient: 'Green tea extract', benefit: 'Antioxidant, anti-inflammatory; topical use is safe; oral intake in moderation (caffeine watch)' },
        { ingredient: 'Camellia (tsubaki) oil', benefit: 'Japanese quintessential face oil; rich in oleic acid; deeply nourishing for dry pregnancy skin' },
        { ingredient: 'Snow mushroom (tremella) serum', benefit: 'Natural hyaluronic acid analog; deeply hydrating; safe in pregnancy' },
        { ingredient: 'Centella asiatica (gotu kola / cica)', benefit: 'Widely used in Korean skincare; clinically supported for wound healing and stretch mark prevention' },
      ],
      notes: 'Gua sha facial massage is safe when performed gently on the face and neck during pregnancy. Avoid gua sha on the body, particularly the abdomen, ankles, and certain acupressure points (LI4, SP6, BL60, BL67) which are traditionally contraindicated in pregnancy.',
    },

    stretchMarkPrevention: {
      startingPoint: 'Begin at 12 weeks; Korean and Japanese women often layer multiple thin products rather than one heavy oil',
      traditionalApproach: [
        'Camellia oil (tsubaki abura) massage — the traditional Japanese approach to belly care',
        'Rice bran oil (kome nuka oil) applied nightly — historically used by Japanese geishas for skin luminosity',
        'Pearl powder mixed with a carrier oil — traditional Chinese skin brightening, safe topically in small amounts',
      ],
      modernApproach: [
        'Korean 7-skin method adapted for pregnancy: 7 thin layers of toner/essence to deeply hydrate belly skin',
        'Centella asiatica (cica) cream as the active layer',
        'Snow mushroom serum under camellia oil for layered hydration',
      ],
      communityWisdom: 'Japanese beauty philosophy wabi-sabi embraces imperfection — stretch marks are viewed by many as evidence of life carried. The ritual is about care, not elimination.',
    },

    hairChanges: {
      whatHappens: [
        'East Asian hair is typically thick with high density; pregnancy can make it even denser',
        'Scalp condition often improves in pregnancy due to sebum regulation',
        'Postpartum hair loss can be visually dramatic due to high baseline density',
      ],
      management: [
        'Camellia oil scalp and hair treatment — traditional Japanese hair care safe in pregnancy',
        'Rice water rinse after shampoo supports hair strength and shine',
        'Avoid permanent wave solutions (perms) in first trimester; chemical exposure concern',
        'Avoid hair dye in first trimester; semi-permanent plant-based options are lower risk after first trimester',
      ],
    },

    prenatalBeautyFoods: [
      { food: 'Seaweed (kombu, wakame, nori)', benefit: 'Iodine for thyroid function and fetal brain development; minerals support skin hydration', note: 'Moderation important — excess iodine from seaweed is a real concern; 2–3 servings per week is appropriate' },
      { food: 'Miso soup (in moderation)', benefit: 'Probiotics support gut-skin axis; B vitamins in fermented soy support skin cell renewal; watch sodium intake' },
      { food: 'Tofu and edamame', benefit: 'Plant protein, calcium, and isoflavones; supports collagen production' },
      { food: 'Goji berries (wolfberry / gou qi zi)', benefit: 'Antioxidants and vitamin C; safe in culinary amounts; traditional Chinese skin nourishing food' },
      { food: 'Job\'s tears (yi yi ren / coix)', benefit: 'Traditional Chinese grain for skin clarity; anti-inflammatory; safe in culinary amounts — avoid concentrated supplements' },
    ],

    traditionalPregnancyRituals: [
      {
        name: 'Hanbok Ceremony (Baek-il Preparation)',
        community: 'Korean',
        description: 'Korean families celebrate the baby\'s 100th day (baek-il) with great ceremony. The mother prepares during the final months with special skin care routines. She is dressed in a traditional hanbok and the community gathers. The pregnancy announcement and celebrations are often marked by the mother receiving beauty and wellness care from elder women.',
        beautyElement: 'Elaborate skincare and beauty preparation; mother adorned in hanbok; rice cake (tteok) gifted symbolizing abundance',
      },
      {
        name: 'An Tai Ritual (Calming the Fetus)',
        community: 'Chinese traditional',
        description: 'An Tai refers to TCM practices to calm and nourish the developing baby. This includes dietary therapy, gentle massage with safe oils, avoiding loud noises and emotional distress, and tai ji or qigong movement. The mother\'s environment, music, and emotional state are all considered prenatal influences on the child.',
        beautyElement: 'Gentle camellia oil full-body self-massage as part of daily an tai routine; beauty and calm are intertwined',
      },
      {
        name: 'Taisho / Mommy Beauty Ritual',
        community: 'Japanese',
        description: 'Japanese maternity culture emphasizes the mother\'s radiance as a reflection of a peaceful pregnancy. Monthly visits to a gentle Japanese-style aesthetic clinic for facials using rice bran, camellia, and koji are common in urban Japan for expectant mothers. At home, the daily skincare routine is extended and made meditative.',
        beautyElement: 'Rice bran facial, camellia oil massage, minimal fragrance skincare; the ritual is slow and intentional',
      },
    ],

    glowRecipe: {
      name: 'Rice Water & Camellia Oil Pregnancy Brightening Rinse',
      origin: 'Japanese-Korean beauty tradition',
      ingredients: [
        '1 cup plain rice (uncooked)',
        '2 cups filtered water',
        '1 tablespoon camellia (tsubaki) oil',
        '3 drops vitamin C serum (ascorbic acid, optional)',
      ],
      method: 'Soak rice in water for 30 minutes. Strain rice water into a clean jar. Optional: ferment at room temperature for 24 hours for stronger effect. Mix with camellia oil in palm before use. Apply to face as a rinse after cleansing, or to belly skin before oil massage. Refrigerate unused portion; use within 3 days.',
      safetyNote: 'Rice water is safe throughout pregnancy. Fermented rice water is more potent — start with plain if skin is sensitive.',
    },
  },

  // ─── EAST AFRICAN ────────────────────────────────────────────────────────────
  'east-african': {
    communityId: 'east-african',
    displayName: 'East African',
    regions: ['Ethiopia', 'Kenya', 'Tanzania', 'Uganda', 'Somalia', 'Eritrea'],

    pregnancyPhilosophy: `East African pregnancy traditions reflect the diversity of the region — from
      Ethiopian Orthodox Christian blessing rituals to Somali herbal wisdom to Maasai communal
      practices. Common threads include the centrality of community, respect for plant medicine,
      and the belief that a calm and joyful mother produces a healthy, beautiful child. Food and
      beauty are inseparable — what nourishes the body nourishes the skin.`,

    safeSkincare: {
      avoid: [
        { ingredient: 'Frankincense essential oil (internally or in high doses)', reason: 'Boswellic acids may affect uterine tissue in concentrated essential oil form; topical diluted use is lower risk but avoid ingestion entirely during pregnancy' },
        { ingredient: 'Unregulated skin lightening creams', reason: 'Mercury and hydroquinone-containing bleaching creams common in some East African markets; strictly avoid' },
        { ingredient: 'Retinoids', reason: 'Teratogenic; avoid' },
        { ingredient: 'High-dose herbal supplements (cleansing teas)', reason: 'Traditional cleansing herb blends often contain potent uterine stimulants' },
      ],
      safeAlternatives: [
        { ingredient: 'Frankincense resin (lubaan) — topical application', benefit: 'Traditional East African scar and skin treatment; small topical amounts considered safe; warming and soothing' },
        { ingredient: 'Shea butter', benefit: 'Used across East Africa as the primary pregnancy skin moisturizer; safe and deeply nourishing' },
        { ingredient: 'Castor oil (topical)', benefit: 'Traditional hair and skin oil; safe applied to scalp and skin; do not ingest during pregnancy as it can stimulate labor' },
        { ingredient: 'Moringa oil', benefit: 'High oleic acid content; nourishing face and belly oil; antioxidant-rich' },
        { ingredient: 'Aloe vera gel (outer leaf)', benefit: 'Widely available across East Africa; cooling treatment for pregnancy belly itch' },
      ],
      notes: 'Ethiopian and Somali women sometimes use qasil (powdered leaves of Gob tree) as a face mask — this is a safe traditional practice for cleansing and brightening that is appropriate during pregnancy in topical form.',
    },

    stretchMarkPrevention: {
      startingPoint: 'Begin with shea butter at first trimester; add moringa oil at second trimester',
      traditionalApproach: [
        'Shea butter applied daily — the foundational East African pregnancy skin ritual',
        'Castor oil scalp and skin treatment for belly and breasts (topical only)',
        'Qasil (Gob tree leaf powder) mixed with water as a gentle exfoliating and nourishing mask weekly',
      ],
      modernApproach: [
        'Moringa oil layered over hyaluronic acid serum',
        'Centella asiatica cream incorporated alongside traditional shea',
        'Vitamin E oil (tocopherol) mixed into shea butter for enhanced antioxidant activity',
      ],
      communityWisdom: 'Ethiopian women say "yenager nesh" — "you are my country, you are my homeland" — about the baby in the belly. Caring for the belly skin is an act of patriotism, community, and love.',
    },

    hairChanges: {
      whatHappens: [
        'Natural East African hair textures (4B/4C) often experience less shedding during pregnancy',
        'Hair may feel drier or more brittle in some women due to nutritional demands of pregnancy',
        'Scalp health varies; some women experience improvement, others increased dryness',
      ],
      management: [
        'Castor oil scalp massages — traditional and safe; promotes scalp circulation',
        'Shea butter as a leave-in conditioner for natural hair styles',
        'Qasil mixed with water can be used as a scalp clarifying mask',
        'Loose braiding styles preferred; avoid tight styles that stress the hairline',
        'Chemical relaxers not recommended especially in first trimester',
      ],
    },

    prenatalBeautyFoods: [
      { food: 'Teff (injera base)', benefit: 'Highest iron content of any grain; gluten-free; essential for East African women combating pregnancy anemia which directly causes skin dullness', note: 'Teff is a nutritional powerhouse unique to Ethiopia/Eritrea' },
      { food: 'Injera (fermented teff flatbread)', benefit: 'Probiotic properties from fermentation support gut health; iron and folate from teff base' },
      { food: 'Misir (red lentils)', benefit: 'Plant-based iron and folate; Ethiopian cuisine is rich in lentil dishes ideal for pregnancy nutrition' },
      { food: 'Moringa leaves (shiro)', benefit: 'Iron, calcium, vitamin C — the East African superfood for pregnancy nutrition and skin vitality' },
      { food: 'Avocado (avokaado)', benefit: 'Grown across East Africa; folate, healthy fats, vitamin E; supports fetal development and maternal skin barrier' },
    ],

    traditionalPregnancyRituals: [
      {
        name: 'Gebeta Celebration (Ethiopian Pregnancy Gathering)',
        community: 'Ethiopian / Eritrean',
        description: 'Gebeta (board game made from carved wood) gives its name to a communal gathering tradition where women come together to celebrate a pregnancy milestone. Food is shared, elders offer blessings, and the mother-to-be is anointed with butter and niter kibbeh (spiced clarified butter) — which serves both as a beauty treatment and a cultural blessing.',
        beautyElement: 'Niter kibbeh applied to skin and hair as a traditional moisturizing and blessing ritual',
      },
      {
        name: 'Buufis (Somali Pregnancy Celebration)',
        community: 'Somali',
        description: 'Buufis is a Somali cultural concept of longing and fulfillment tied to the pregnant woman\'s cravings and desires being honored. Community women gather to fulfill the mother\'s food cravings and perform beauty rituals including henna application, oud incense burning, and qasil face mask preparation.',
        beautyElement: 'Henna on hands and feet, qasil face mask, oud smoke used as a natural perfume for hair and skin',
      },
      {
        name: 'Water Blessing Ceremony',
        community: 'Kenyan / Tanzanian coastal communities',
        description: 'In coastal Swahili communities, the pregnant woman is brought to clean water (sometimes ocean, sometimes blessed water) and herbs are sprinkled on the water surface. She is bathed using a calabash while elder women recite prayers. Safe herbs such as lemongrass and jasmine are commonly used.',
        beautyElement: 'Botanical bath ritual using lemongrass and jasmine — leaves skin fragrant and soft; deeply meaningful community experience',
      },
    ],

    glowRecipe: {
      name: 'Qasil & Shea Butter East African Pregnancy Mask',
      origin: 'Somali-Ethiopian home beauty tradition',
      ingredients: [
        '1 tablespoon qasil powder (Gob tree leaf, if available; substitute white kaolin clay)',
        '2 tablespoons unrefined shea butter (softened)',
        '1 tablespoon moringa oil',
        '1 tablespoon rose water',
      ],
      method: 'Mix qasil powder with rose water to form a thin paste. Melt shea butter slightly and blend in moringa oil. Combine the two mixtures. Apply to face and belly. Rest 15–20 minutes. Rinse gently with warm water. Pat dry and apply additional shea butter to seal in moisture. Use twice weekly.',
      safetyNote: 'Qasil is a traditional Somali/East African ingredient; substitute kaolin clay if unavailable. All ingredients are safe for topical pregnancy use.',
    },
  },

  // ─── SOUTH AFRICAN ───────────────────────────────────────────────────────────
  'south-african': {
    communityId: 'south-african',
    displayName: 'South African',
    regions: ['South Africa (Zulu, Xhosa, Sotho, Tswana)', 'Namibia', 'Botswana', 'Zimbabwe'],

    pregnancyPhilosophy: `South African pregnancy traditions span many nations and cultural frameworks —
      Zulu, Xhosa, Sotho, and others — unified by deep respect for ancestral guidance and the
      belief that the mother\'s spiritual and physical preparation directly shapes the child.
      Ubuntu (I am because we are) applies to pregnancy: the whole community nurtures the
      mother so the mother can nurture life.`,

    safeSkincare: {
      avoid: [
        { ingredient: 'Aloe ferox (bitter aloe) internally', reason: 'Aloe ferox contains anthraquinone glycosides that are powerful laxatives and potential uterine stimulants; topical gel is different and safer than the bitter latex' },
        { ingredient: 'Buchu (Agathosma betulina) supplements', reason: 'Pulegone content may be harmful in large doses during pregnancy; topical tea rinse is lower risk but consult OB' },
        { ingredient: 'Rooibos in very large therapeutic amounts', reason: 'Rooibos tea is caffeine-free and generally pregnancy-safe; use as a beverage not as a high-dose supplement' },
        { ingredient: 'Retinoids', reason: 'Teratogenic; avoid all forms' },
        { ingredient: 'Mercury skin lightening products', reason: 'Common in informal markets; dangerous throughout pregnancy' },
      ],
      safeAlternatives: [
        { ingredient: 'Marula oil (topical)', benefit: 'From the marula tree sacred in Zulu and Swati culture; rich in oleic acid and antioxidants; deeply nourishing belly and face oil; topical use is safe and beneficial' },
        { ingredient: 'Rooibos extract (topical)', benefit: 'Anti-inflammatory, antioxidant; safe in face creams and toners during pregnancy' },
        { ingredient: 'Aloe ferox gel (outer leaf, topical)', benefit: 'Cooling and healing for pregnancy skin itch; ensure no bitter latex (anthraquinones) in the product' },
        { ingredient: 'Shea butter', benefit: 'The universal safe pregnancy moisturizer; used across South Africa' },
        { ingredient: 'Baobab oil', benefit: 'From the iconic African baobab tree; rich in vitamins C and E; safe nourishing skin oil' },
      ],
      notes: 'Rooibos tea is one of the only traditional African herbal teas confirmed safe throughout pregnancy — no caffeine, no tannins in significant amounts, rich in antioxidants. It can replace regular tea safely.',
    },

    stretchMarkPrevention: {
      startingPoint: 'Begin with marula oil or shea butter from the first trimester',
      traditionalApproach: [
        'Marula oil massage on belly, hips, and thighs — the traditional Zulu and Swati pregnancy skin ritual',
        'Baobab oil applied to dry skin areas; historically used by southern African women for skin elasticity',
        'Aloe ferox gel (topical gel only) as a cooling belly treatment for itch and inflammation',
      ],
      modernApproach: [
        'Marula oil layered over vitamin C serum for brightening and collagen support',
        'Centella asiatica cream used alongside marula oil for evidence-based prevention',
        'Hyaluronic acid applied to damp skin before marula oil for deep hydration',
      ],
      communityWisdom: 'In Zulu tradition, the elephant — who carries a baby for 22 months — is revered as the ultimate mother. Marula fruit is the elephant\'s favorite food, and marula oil is considered to carry the elephant\'s strength and nurturing into the pregnant woman\'s skin.',
    },

    hairChanges: {
      whatHappens: [
        'Natural African hair textures typically experience reduced shedding during pregnancy',
        'Scalp sensitivity increases; tight hairstyles may cause more discomfort than usual',
        'Postpartum hair loss at 3–6 months post-birth can be dramatic and distressing',
      ],
      management: [
        'Marula oil scalp treatment — traditional and effective',
        'Loose protective styles (twists, loose braids) to minimize scalp tension',
        'Rooibos tea rinse for the scalp: rich in antioxidants, soothing for sensitive scalp',
        'Castor oil massages (topical only) to support scalp circulation',
        'Avoid chemical relaxers especially in first trimester',
      ],
    },

    prenatalBeautyFoods: [
      { food: 'Morogo (wild leafy greens — amaranth, cowpea leaves)', benefit: 'Iron, folate, and vitamin C — the traditional South African pregnancy superfood for combating anemia and supporting glow' },
      { food: 'Rooibos tea', benefit: 'Caffeine-free antioxidant beverage safe throughout pregnancy; flavonoids support skin cell protection', note: 'The ideal coffee replacement for pregnant South African women' },
      { food: 'Maize (pap)', benefit: 'Energy and B vitamins; a staple providing steady blood sugar that reduces cortisol-driven skin flares' },
      { food: 'Baobab fruit powder', benefit: 'Extremely high vitamin C (6x oranges); fiber; supports collagen production and immune function', note: 'Use in culinary amounts in smoothies or porridge' },
      { food: 'Samp and beans (umngqusho)', benefit: 'Complete protein from bean and grain combination; iron and zinc support skin healing and cellular renewal' },
    ],

    traditionalPregnancyRituals: [
      {
        name: 'Umembeso / Umhlanga Preparation',
        community: 'Zulu',
        description: 'In Zulu tradition, the pregnancy is marked by various ceremonies connecting the mother to her ancestors. The Umembeso (gift-giving ceremony) involves the family adorning the mother with beaded jewelry and wrappings. Women of the family apply marula oil to the mother\'s skin and braid her hair in a style that signals her status as a mother-to-be.',
        beautyElement: 'Marula oil anointing, elaborate beaded adornment, communal hair care session',
      },
      {
        name: 'Inkaba (Ancestral Connection Ritual)',
        community: 'Zulu / Xhosa',
        description: 'Inkaba refers to the umbilical cord connection, but also more broadly to ancestral roots. Pregnant women in Zulu and Xhosa traditions perform rituals connecting the unborn child to the ancestral line, often involving burning impepho (wild sage / helichrysum) for fragrance and spiritual cleansing.',
        beautyElement: 'Impepho smoke used for hair and body fragrance — a natural botanical perfume ritual; note that impepho essential oil should not be inhaled in large amounts during pregnancy',
        safetyNote: 'Brief fragrant smoke in a well-ventilated space is the traditional practice; avoid concentrated essential oil inhalation',
      },
      {
        name: 'Healing Clay Bath (Ubuntu Beauty)',
        community: 'Sotho / Tswana',
        description: 'Clay from specific mineral-rich areas is mixed with rooibos tea and applied to the pregnant woman\'s body as a communal beauty and blessing ritual. The clay is believed to draw out impurities while the rooibos provides antioxidants. The mother is then massaged with warm marula oil.',
        beautyElement: 'Full-body clay treatment followed by marula oil massage; deeply nourishing skin experience',
      },
    ],

    glowRecipe: {
      name: 'Marula & Rooibos Pregnancy Glow Oil',
      origin: 'South African traditional beauty, modernized',
      ingredients: [
        '3 tablespoons marula oil (cold-pressed)',
        '1 tablespoon baobab oil',
        '2 tablespoons brewed rooibos tea (strong, cooled)',
        '5 drops vitamin E oil (tocopherol)',
      ],
      method: 'Brew rooibos very strong (double-steep). Allow to cool completely. Combine marula and baobab oils in a small bottle. Add vitamin E drops. Before application, mist skin with cooled rooibos tea. While skin is still damp, apply oil blend to face, belly, and body. Pat gently — do not rub. The tea provides hydration that the oil then seals in.',
      safetyNote: 'All ingredients are safe for topical pregnancy use. Marula oil is a prized ingredient with long traditional history in South Africa.',
    },
  },

  // ─── BLACK AMERICAN ──────────────────────────────────────────────────────────
  'black-american': {
    communityId: 'black-american',
    displayName: 'Black American',
    regions: ['United States — Black American and African Diaspora communities'],

    pregnancyPhilosophy: `Black American pregnancy traditions carry the resilience and creativity of a
      community that has always made beauty from what is available and accessible. From grandmother\'s
      kitchen remedies to the sophisticated natural beauty movement, Black American women have led
      the conversation on protective hair care, shea butter, and community-based maternal support.
      Sisterhood — from doulas to church mothers to online communities — is the defining feature
      of this pregnancy experience.`,

    safeSkincare: {
      avoid: [
        { ingredient: 'Skin bleaching creams with mercury or hydroquinone', reason: 'Systemic absorption; avoid during pregnancy; Black women face disproportionate marketing of these products' },
        { ingredient: 'Retinoids / retinol', reason: 'Teratogenic; avoid all forms' },
        { ingredient: 'Salicylic acid (high concentration body washes)', reason: 'Low concentration (under 2%) on small areas is generally considered low risk; avoid high-dose BHA peels during pregnancy' },
        { ingredient: 'Certain essential oils (clary sage, rosemary, thyme, oregano)', reason: 'Uterotonic effects in high doses; avoid concentrated use during pregnancy' },
        { ingredient: 'Formaldehyde-releasing preservatives', reason: 'Often found in keratin treatments; avoid during pregnancy — choose safe hair care alternatives' },
      ],
      safeAlternatives: [
        { ingredient: 'Unrefined shea butter', benefit: 'The cornerstone of Black American natural beauty care; safe and beneficial throughout pregnancy for skin and hair' },
        { ingredient: 'Jamaican Black Castor Oil (JBCO) — topical', benefit: 'Deeply conditioning for hair and scalp; safe applied topically; do not ingest during pregnancy as castor oil can stimulate labor' },
        { ingredient: 'Azelaic acid (15% and under)', benefit: 'Safe pregnancy acne and hyperpigmentation treatment recommended by dermatologists; important for Black women managing melasma' },
        { ingredient: 'Niacinamide', benefit: 'Safe in pregnancy; reduces hyperpigmentation, regulates oil, strengthens skin barrier' },
        { ingredient: 'Vitamin C serum (ascorbic acid)', benefit: 'Safe and important for managing the increased hyperpigmentation Black women may experience during pregnancy' },
      ],
      notes: `Black Maternal Mortality Context: Black women in the United States face a maternal
        mortality rate approximately 2–3 times higher than white women. This reality shapes the
        pregnancy experience profoundly. Advocating for yourself at medical appointments, having
        a support person or doula, and choosing providers who listen are not beauty topics but are
        deeply connected to maternal wellness and the lived experience of Black pregnancy.`,
    },

    stretchMarkPrevention: {
      startingPoint: 'Begin as early as first trimester; Black skin tones may show hyperpigmented stretch marks that persist longer',
      traditionalApproach: [
        'Shea butter daily application — the generational standard passed from grandmother to daughter',
        'JBCO mixed with shea butter as an intensive weekly belly treatment',
        'Cocoa butter lotion (Palmer\'s) — a classic Black American pregnancy remedy',
      ],
      modernApproach: [
        'Layer niacinamide serum under shea butter to address hyperpigmentation of marks',
        'Centella asiatica cream added to regimen for clinically supported prevention',
        'Vitamin C serum morning, shea butter at night',
      ],
      communityWisdom: 'Black mothers have passed down "stay greasy" as pregnancy wisdom for generations — the advice to keep skin well-moisturized at all times has real dermatological backing in transepidermal water loss prevention.',
    },

    hairChanges: {
      whatHappens: [
        'Many Black women experience their most lush, retained length during pregnancy due to reduced shedding',
        'Protective styles are common but scalp needs extra attention as hormones change sebum production',
        'Postpartum shedding (3–6 months after birth) can be significant and is often distressing — this is temporary and normal',
      ],
      management: [
        'JBCO scalp massages 2–3 times weekly — safe topically and supports scalp health',
        'Shea butter as a sealer over water-based leave-in conditioner (LOC/LCO method) remains safe throughout pregnancy',
        'Avoid chemical relaxers especially in first trimester; many women use pregnancy as an opportunity to go natural',
        'Box braids and twists are safe but wear them loose — pregnancy can increase scalp sensitivity to tension',
        'Safe essential oils for scalp: peppermint (diluted, not in high dose), tea tree (diluted), lavender (moderate use)',
      ],
    },

    prenatalBeautyFoods: [
      { food: 'Collard greens and turnip greens', benefit: 'Iron, folate, calcium, and vitamin K; iron directly combats pregnancy anemia that causes pallor and dullness; deeply rooted in Black American food tradition' },
      { food: 'Sweet potato', benefit: 'Beta-carotene (provitamin A) supports skin cell turnover safely; potassium reduces water retention; versatile Black American staple' },
      { food: 'Black-eyed peas (hoppin\' john)', benefit: 'Folate and iron; a culturally significant legume with real nutritional value for pregnancy' },
      { food: 'Salmon (wild-caught)', benefit: 'DHA omega-3 for fetal brain development and maternal skin barrier; lower mercury than large fish' },
      { food: 'Watermelon', benefit: 'Lycopene, vitamin C, and high water content; hydration is directly reflected in skin plumpness; a beloved summer staple' },
    ],

    traditionalPregnancyRituals: [
      {
        name: 'Baby Shower / Sip-and-See',
        community: 'Black American',
        description: 'The baby shower is a major community event in Black American tradition — often large, elaborate, and involving the full extended family and church community. A beauty tradition within the shower is the gifting of shea butter, oils, and skin care products for the mother\'s postpartum recovery. Many Black American families also host a "Sip-and-See" after the birth where community meets the baby.',
        beautyElement: 'Gift-giving of beauty staples (shea, JBCO, body oils); beauty and community care intertwined',
      },
      {
        name: 'Doula-Supported Ritual',
        community: 'Black American, growing movement',
        description: 'The reclamation of doula care in Black communities addresses the maternal mortality gap while restoring traditional birth support. Black doulas perform belly oiling rituals, help mothers create beauty and self-care routines, and provide the emotional continuity that reduces cortisol and supports healthier pregnancy outcomes. Organizations like Black Mamas Matter Alliance have elevated this work nationally.',
        beautyElement: 'Intentional belly oil ceremony, affirmation practices, community-held maternal care',
      },
      {
        name: 'Church Mother Blessing',
        community: 'Black American Christian tradition',
        description: 'In many Black Baptist, AME, and Pentecostal communities, the church mothers — the elder women who hold community wisdom — perform a laying-on-of-hands blessing for the expectant mother. This may include prayer, anointing with oil (often olive oil in the Christian tradition), and the sharing of practical wisdom about pregnancy, birth, and motherhood.',
        beautyElement: 'Oil anointing ritual; the mother is adorned and honored in white; her hair is often arranged by the elder women',
      },
    ],

    glowRecipe: {
      name: 'Black American Pregnancy Belly Butter',
      origin: 'Black American natural beauty tradition',
      ingredients: [
        '4 tablespoons unrefined shea butter',
        '2 tablespoons JBCO (Jamaican Black Castor Oil)',
        '1 tablespoon sweet almond oil',
        '1 tablespoon vitamin E oil',
        '5 drops lavender essential oil (optional, use moderately)',
      ],
      method: 'Whip shea butter with a hand mixer or fork until fluffy. Add JBCO, almond oil, and vitamin E oil and continue mixing until fully incorporated. Add lavender drops if using. Store in a clean jar. Apply generously to belly, hips, thighs, and breasts morning and night with loving circular massage motions.',
      safetyNote: 'JBCO is safe applied topically — do not ingest castor oil during pregnancy. Lavender essential oil used in small amounts topically is generally considered low risk in pregnancy but omit if you prefer to avoid essential oils entirely.',
    },
  },

};

// ─── UNIVERSAL PREGNANCY BEAUTY GUIDE ─────────────────────────────────────────

export const UNIVERSAL_PREGNANCY_BEAUTY = {

  trimesterGuide: {
    firstTrimester: {
      weeks: '1–13',
      whatHappens: [
        'Skin may appear dull or sallow as the body redirects resources to the developing fetus',
        'Hormonal fluctuations (especially progesterone spike) can trigger acne breakouts',
        'Fatigue shows on skin — dark circles, dehydration lines, and lackluster appearance',
        'Morning sickness and dietary restrictions may affect nutrient intake and skin quality',
        'Some women experience increased skin sensitivity and fragrance reactions',
      ],
      beautyFocus: 'Hydration, gentle cleansing, rest, and prenatal nutrition. This is not the time for actives or new skincare — keep routine simple and consistent.',
      skincareTips: [
        'Switch to a fragrance-free, gentle cleanser',
        'Layer hyaluronic acid under a simple moisturizer',
        'Mineral SPF 30+ daily even if staying indoors — melasma can develop from even brief UV exposure',
        'Skip actives in first trimester if unsure of safety; consult OB before introducing new products',
      ],
    },

    secondTrimester: {
      weeks: '14–27',
      whatHappens: [
        'The "pregnancy glow" is often most visible here — increased blood volume and improved estrogen levels contribute to flushed, luminous skin',
        'Melasma (mask of pregnancy) may appear — hyperpigmented patches on cheeks, forehead, and upper lip',
        'Belly skin begins to stretch more noticeably from about week 18 onward',
        'Energy returns and mood stabilizes; beauty routines become more sustainable',
        'Hair often at its thickest and most lustrous',
      ],
      beautyFocus: 'SPF diligence to manage melasma, stretch mark prevention oil routine, enjoying the glow.',
      skincareTips: [
        'Reapply mineral SPF every 2 hours if outdoors — melasma worsens dramatically with UV',
        'Add azelaic acid 10–15% to address any hyperpigmentation that develops',
        'Establish daily belly oil massage routine',
        'Niacinamide serum safe and beneficial for skin tone evening',
      ],
    },

    thirdTrimester: {
      weeks: '28–40+',
      whatHappens: [
        'Itching (pruritus gravidarum) from skin stretching is very common; intense itching over whole body should be reported to OB immediately as it can signal cholestasis',
        'Stretch marks often appear now as belly growth accelerates',
        'Swollen feet and ankles (edema) affect skin appearance on lower extremities',
        'Sleep difficulty affects skin recovery and renewal',
        'Some women experience broken capillaries on face from increased blood volume',
      ],
      beautyFocus: 'Itch relief, belly skin care, foot and leg care, and preparation for postpartum recovery.',
      skincareTips: [
        'Cool oat baths or colloidal oatmeal lotion for belly itch',
        'Elevation and compression socks for swollen feet; gentle foot massage',
        'Keep belly well-oiled twice daily to manage itch from stretching',
        'Begin gathering postpartum skin care supplies: nipple cream, perineal spray, scar care',
      ],
    },
  },

  safeIngredients: [
    { ingredient: 'Hyaluronic acid', category: 'Hydration', notes: 'Safe at all concentrations; use on damp skin for maximum efficacy' },
    { ingredient: 'Azelaic acid (up to 20%)', category: 'Acne & hyperpigmentation', notes: 'Pregnancy Category B; safe and dermatologist-recommended for pregnancy acne and melasma' },
    { ingredient: 'Vitamin C (L-ascorbic acid)', category: 'Brightening & antioxidant', notes: 'Safe topically; supports collagen and helps manage melasma' },
    { ingredient: 'Niacinamide', category: 'Multi-benefit', notes: 'Safe throughout pregnancy; addresses pores, oil, hyperpigmentation, and barrier simultaneously' },
    { ingredient: 'Glycolic acid (low %, under 10%)', category: 'Exfoliation', notes: 'Low concentration considered safe; avoid high-strength peels' },
    { ingredient: 'Lactic acid (low %)', category: 'Gentle exfoliation', notes: 'Gentler than glycolic; safe in moderate concentrations' },
    { ingredient: 'Benzoyl peroxide (2.5–5%)', category: 'Acne', notes: 'Low concentration, small area use generally considered low risk; discuss with OB' },
    { ingredient: 'Zinc oxide (mineral SPF)', category: 'Sun protection', notes: 'Preferred sunscreen ingredient in pregnancy over chemical UV filters' },
    { ingredient: 'Titanium dioxide (mineral SPF)', category: 'Sun protection', notes: 'Safe mineral UV filter; often combined with zinc oxide' },
    { ingredient: 'Ceramides', category: 'Barrier repair', notes: 'Safe and beneficial; restores compromised skin barrier common in pregnancy' },
    { ingredient: 'Centella asiatica / cica', category: 'Healing & stretch marks', notes: 'Safe and supported by evidence for wound healing and stretch mark prevention' },
    { ingredient: 'Bakuchiol', category: 'Retinol alternative', notes: 'Plant-based; limited pregnancy safety data — discuss with OB before use' },
  ],

  ingredientsToAvoid: [
    { ingredient: 'Retinoids (retinol, tretinoin, adapalene, isotretinoin)', reason: 'Teratogenic; clearly linked to birth defects; avoid all forms throughout pregnancy', severity: 'critical' },
    { ingredient: 'Hydroquinone', reason: 'High systemic absorption; insufficient safety data; 35–45% absorbed systemically through skin', severity: 'high' },
    { ingredient: 'High-dose salicylic acid (BHA peels, aspirin masks)', reason: 'Systemic absorption risk; low-concentration leave-on products (under 2%) considered lower risk but discuss with OB', severity: 'moderate-high' },
    { ingredient: 'Benzoyl peroxide (high concentration, large areas)', reason: 'Low concentration on small areas generally low risk; avoid body-wide use', severity: 'moderate' },
    { ingredient: 'Chemical sunscreens (oxybenzone, avobenzone, octinoxate)', reason: 'Endocrine disruption concerns; prefer mineral SPF (zinc oxide, titanium dioxide) as safer alternative', severity: 'moderate' },
    { ingredient: 'Clary sage essential oil', reason: 'Uterotonic; can trigger contractions', severity: 'high' },
    { ingredient: 'Rosemary essential oil (high dose)', reason: 'Stimulating; avoid concentrated application or diffusion in pregnancy', severity: 'moderate' },
    { ingredient: 'Oregano essential oil', reason: 'Uterotonic in concentrated form; culinary use fine', severity: 'moderate' },
    { ingredient: 'Thyme essential oil', reason: 'Potent; avoid during pregnancy', severity: 'moderate' },
    { ingredient: 'Mercury (thimerosal, mercurous chloride)', reason: 'Severely neurotoxic; found in some imported skin lighteners', severity: 'critical' },
    { ingredient: 'Formaldehyde (keratin treatments, some nail products)', reason: 'Known carcinogen; avoid inhaling fumes during pregnancy', severity: 'high' },
    { ingredient: 'Parabens (in high concentration, frequent use)', reason: 'Weak endocrine disruptors; minimize exposure especially in first trimester', severity: 'low-moderate' },
  ],

  stretchMarkTimeline: {
    when: 'Begin at 12 weeks (end of first trimester) for best results; earlier is fine',
    why: 'Skin begins stretching early even before the belly is visually large; collagen and elastin need ongoing support',
    protocol: [
      { week: '12–16', action: 'Begin daily belly oil application; establish the habit before belly grows significantly' },
      { week: '16–24', action: 'Double up to morning and evening application; add second active ingredient (centella cream)' },
      { week: '24–32', action: 'Intensive period; belly growing fastest; use occlusive layer over actives at night' },
      { week: '32–40', action: 'Focus shifts to itch relief and comfort alongside prevention; continue oil routine' },
      { week: 'Postpartum', action: 'Continue or increase frequency; tretinoin can be added after breastfeeding ends for mark reduction' },
    ],
    bestIngredients: ['Centella asiatica', 'Hyaluronic acid', 'Vitamin E', 'Rosehip oil', 'Shea butter', 'Argan oil', 'Coconut oil', 'Bio-Oil (as directed)'],
    managedExpectations: 'Genetics is the primary predictor of stretch marks. Hydration and moisturization are proven to reduce severity; elimination is not guaranteed for those genetically predisposed.',
  },

  hairDuringPregnancy: {
    why: 'Elevated estrogen during pregnancy prolongs the anagen (growth) phase of the hair cycle, reducing the percentage of hairs that shed. This results in noticeably thicker, fuller hair for most women during the second and third trimesters.',
    typicalChanges: [
      'Reduced daily shedding (normal loss of 50–100 hairs/day drops significantly)',
      'Increased volume and density',
      'Some women experience texture changes — straighter, wavier, or curlier than baseline',
      'Scalp sebum production may increase or decrease depending on individual hormonal response',
    ],
    postpartumRealityCheck: [
      'Hair lost during pregnancy "banks" and sheds 3–6 months postpartum as hormones normalize',
      'Postpartum shedding (telogen effluvium) is temporary but can seem alarming',
      'Most women return to pre-pregnancy hair density by 12–18 months postpartum',
      'Nutritional deficiencies from pregnancy and nursing can exacerbate postpartum shedding — maintain prenatal vitamins while breastfeeding',
    ],
    safeHairCare: [
      'Shampoo and conditioner: most are safe; prefer fragrance-free if scalp is sensitive',
      'Chemical relaxers: avoid in first trimester; use cautiously after with ventilation',
      'Hair dye: avoid in first trimester; semi-permanent and plant-based options are lower risk',
      'Henna: plant-based henna is generally considered safe; avoid black henna (PPD)',
      'Heat styling: safe with heat protectant; keep temperatures moderate',
      'Tight styles: avoid very tight braids or weaves — scalp is more sensitive in pregnancy',
    ],
  },

  melaninConsiderations: {
    note: 'Women with darker Fitzpatrick skin types (IV–VI) face distinct pregnancy beauty concerns that are underrepresented in mainstream guidance:',
    concerns: [
      'Pregnancy melasma can be more severe and longer-lasting in darker skin tones',
      'Post-inflammatory hyperpigmentation from acne heals more slowly',
      'Stretch marks in deeper skin tones may appear hyperpigmented rather than silvery',
      'Mineral SPF (zinc oxide) historically left white cast on darker skin — seek tinted mineral SPF or newer transparent zinc formulations',
    ],
    strategies: [
      'Iron-clad SPF routine from day 1 — the most important intervention for melasma in any skin tone',
      'Azelaic acid 15–20% is the gold-standard pregnancy-safe treatment for dark spot management',
      'Niacinamide 10% is a safe, accessible option for hyperpigmentation in pregnancy',
      'Vitamin C serum daily for antioxidant protection and gradual brightening',
      'Post-partum: retinoids can be added after breastfeeding ends for more significant hyperpigmentation treatment',
    ],
  },

};

// ─── PREGNANCY BEAUTY STATS ───────────────────────────────────────────────────

export const PREGNANCY_BEAUTY_STATS = {
  skinChanges: {
    percentageExperienceMelasma: 70,
    percentageExperienceStretchMarks: 90,
    percentageExperienceAcne: 40,
    percentageExperienceHairThickening: 75,
    percentageExperiencePostpartumHairLoss: 90,
    sourcesNote: 'Approximate figures from dermatology literature; individual variation is high',
  },
  maternalHealth: {
    blackMaternalMortalityMultiplier: '2–3x higher than white women in the US',
    importanceOfDoulas: 'Studies suggest doula support can reduce C-section rates by 39% and maternal mortality risk factors',
    prenatalCareImpact: 'Women who receive adequate prenatal care have significantly better outcomes across all metrics',
  },
  communityCount: 9,
  ingredientsSafe: 12,
  ingredientsToAvoid: 12,
  trimesters: 3,
  lastUpdated: '2026',
  disclaimer: 'All information in these guides is for educational purposes only. Always consult your OB-GYN, midwife, or dermatologist before starting new skincare, taking any supplements, or using herbal preparations during pregnancy. Cultural practices vary within communities — the guides represent common traditions, not universal prescriptions.',
};

// ─── EXPORT FUNCTION ──────────────────────────────────────────────────────────

export function getPregnancyBeautyGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_PREGNANCY_BEAUTY_GUIDES['west-african'],
    'south-asian': ETHNIC_PREGNANCY_BEAUTY_GUIDES['south-asian'],
    'caribbean': ETHNIC_PREGNANCY_BEAUTY_GUIDES['caribbean'],
    'arab': ETHNIC_PREGNANCY_BEAUTY_GUIDES['arab'],
    'latina': ETHNIC_PREGNANCY_BEAUTY_GUIDES['latina'],
    'east-asian': ETHNIC_PREGNANCY_BEAUTY_GUIDES['east-asian'],
    'east-african': ETHNIC_PREGNANCY_BEAUTY_GUIDES['east-african'],
    'south-african': ETHNIC_PREGNANCY_BEAUTY_GUIDES['south-african'],
    'black-american': ETHNIC_PREGNANCY_BEAUTY_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

export function getAllCommunityIds() {
  return Object.keys(ETHNIC_PREGNANCY_BEAUTY_GUIDES);
}

export function getUniversalGuide() {
  return UNIVERSAL_PREGNANCY_BEAUTY;
}

export function getSafeIngredientsList() {
  return UNIVERSAL_PREGNANCY_BEAUTY.safeIngredients;
}

export function getIngredientsToAvoid() {
  return UNIVERSAL_PREGNANCY_BEAUTY.ingredientsToAvoid;
}

export function getTrimesterGuide(trimester) {
  const map = {
    1: UNIVERSAL_PREGNANCY_BEAUTY.trimesterGuide.firstTrimester,
    2: UNIVERSAL_PREGNANCY_BEAUTY.trimesterGuide.secondTrimester,
    3: UNIVERSAL_PREGNANCY_BEAUTY.trimesterGuide.thirdTrimester,
    'first': UNIVERSAL_PREGNANCY_BEAUTY.trimesterGuide.firstTrimester,
    'second': UNIVERSAL_PREGNANCY_BEAUTY.trimesterGuide.secondTrimester,
    'third': UNIVERSAL_PREGNANCY_BEAUTY.trimesterGuide.thirdTrimester,
  };
  return map[trimester] || null;
}
