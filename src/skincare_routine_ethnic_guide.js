/**
 * MIRRR — Complete Skincare Routine Ethnic Guide
 * Step-by-step AM and PM skincare routines tailored to each ethnic community's
 * skin characteristics, available ingredients, and cultural context. This is
 * the practical "what to actually do" guide — morning and evening routines
 * with product recommendations, ingredient guidance, and adaptable protocols.
 */

export const ETHNIC_SKINCARE_ROUTINE_GUIDES = {
  'west-african': {
    communityId: 'west-african',
    communityName: 'West African',
    skinProfile: {
      commonTypes: 'Combination to oily is most common. The humid West African climate drives sebaceous glands to produce more sebum.',
      uniqueNeeds: ['Oil control without stripping', 'Hyperpigmentation management (PIH from acne)', 'Evening skin tone', 'Protection from humidity and heat', 'Brightening'],
      commonConcerns: ['Post-inflammatory hyperpigmentation (PIH)', 'Acne', 'Uneven skin tone', 'Oiliness in T-zone', 'Ashy appearance when skin is dry'],
    },
    amRoutine: {
      title: 'West African Morning Routine',
      steps: [
        { step: 1, name: 'Cleanse', duration: '60 seconds', instruction: 'Wet hands. Lather African black soap between palms. Apply gently to face in circular motions. Rinse with lukewarm water. Pat (do not rub) dry with clean cloth.', why: 'Black soap cleanses without stripping the acid mantle. It has natural glycerin from the shea and oils that keeps the skin balanced after cleansing.', alternatives: 'Low-pH gel cleanser (CeraVe Foaming, La Roche-Posay Effaclar) for those who find black soap irritating or drying.', level: 'beginner' },
        { step: 2, name: 'Vitamin C Serum (Optional but Highly Recommended)', duration: '30 seconds', instruction: '3-4 drops of vitamin C serum (L-ascorbic acid, sodium ascorbyl phosphate, or ascorbyl glucoside) onto fingertips. Press gently into face. Let absorb 60 seconds.', why: 'Vitamin C is the most evidence-backed ingredient for hyperpigmentation prevention and correction. It inhibits tyrosinase (the enzyme that produces melanin) and protects against UV-induced pigmentation.', bestFor: 'Morning only — vitamin C protects against UV-induced oxidative stress throughout the day.', level: 'intermediate' },
        { step: 3, name: 'Moisturizer', duration: '30 seconds', instruction: 'Lightweight water-based moisturizer for oily/combo skin. Gel moisturizer (Neutrogena Hydro Boost, CeraVe Moisturizing Lotion) works well in humidity. Apply to damp skin.', why: 'Even oily skin needs moisture. Without moisturizer, oily skin produces MORE oil (sebostasis mechanism). Gel moisturizers hydrate without adding grease.', ingredients: 'Look for: glycerin, hyaluronic acid, niacinamide (for PIH), centella asiatica.', level: 'beginner' },
        { step: 4, name: 'SPF 30-50 Sunscreen', duration: '30 seconds', instruction: 'This is NON-NEGOTIABLE. Apply generously (1/4 teaspoon for face). Mineral (zinc oxide, titanium dioxide) or chemical SPF. Reapply every 2 hours in direct sun.', why: 'UV exposure is the #1 driver of hyperpigmentation in melanin-rich skin. Even on cloudy days. Even when melanin provides some natural protection. SPF prevents new dark spots and helps existing ones fade faster.', whitecastNote: 'Traditional mineral SPFs leave a white/gray cast on dark skin. Look for: tinted mineral SPFs, newer generation mineral SPFs with "INCI-blended" zinc (Beauty of Joseon Glow Sunscreen, Black Girl Sunscreen, Supergoop Unseen).', level: 'beginner' },
      ],
    },
    pmRoutine: {
      title: 'West African Evening Routine',
      steps: [
        { step: 1, name: 'Double Cleanse', duration: '2-3 minutes', instruction: 'Step 1: Oil cleanse with shea butter (melted, massage in, remove with warm wet cloth). OR: micellar water. Step 2: Black soap or gentle gel cleanser. Rinse thoroughly.', why: 'Day has accumulated sunscreen, sweat, pollution, sebum. Double cleanse ensures full removal without requiring an aggressive single cleanser that strips the skin.' },
        { step: 2, name: 'Exfoliation (2-3x per week ONLY)', duration: '60 seconds', instruction: 'Chemical exfoliant: BHA (salicylic acid 0.5-2%) for oily/acne-prone skin. OR AHA (glycolic acid 5-10%, lactic acid 5-10%) for dry patches and hyperpigmentation. Apply to clean dry face. Leave on. Do not rinse (leave-on exfoliant).', why: 'Regular exfoliation removes the dead skin layer that can make hyperpigmentation appear more pronounced and clog pores. BHA (oil-soluble) penetrates into pores for acne.', caution: 'START LOW AND SLOW. Begin 1x per week. Build to 2-3x. Do not use exfoliant and retinol on the same night. Do not use on the same night as other active ingredients.', level: 'intermediate' },
        { step: 3, name: 'Serum / Treatment', duration: '30 seconds', instruction: 'For PIH: Niacinamide 5-10% serum (reduces melanin transfer to skin cells). OR: Alpha arbutin 2% (tyrosinase inhibitor). OR: Kojic acid 1-2% (traditional brightening, derived from sake fermentation).', why: 'Evening is the time for active treatment serums. The skin is in repair mode overnight.' },
        { step: 4, name: 'Moisturizer', duration: '30 seconds', instruction: 'Slightly richer night moisturizer than AM. Can include shea butter for dry skin types. Or ceramide-rich (CeraVe PM). Apply to slightly damp skin.', why: 'Skin barrier repair peaks at night (circadian biology). Providing the building blocks (ceramides, fatty acids) during the peak repair window maximizes results.' },
        { step: 5, name: 'Face Oil Seal (Optional for Dry Skin)', duration: '15 seconds', instruction: '2-3 drops of facial oil (rosehip, marula, vitamin C-infused oil). Pat onto moisturizer. Acts as an occlusive seal.', why: 'Locking in hydration with an oil seal (the final step of LOC method adapted for face) is extremely effective for West African skin that tends toward dry patches on the cheeks.', level: 'intermediate' },
      ],
    },
    weeklyRituals: [
      { ritual: 'Turmeric Mask', frequency: 'Weekly', recipe: '1 tsp turmeric + 1 tsp raw honey + 1 tbsp plain yogurt. Apply. 15 min. Rinse.', benefit: 'Anti-inflammatory, mild brightening from curcumin + lactic acid from yogurt.' },
      { ritual: 'Steam and Black Soap Deep Cleanse', frequency: 'Weekly', instruction: 'Steam face over hot water bowl 5 min. Follow with black soap cleanse. Pores are open and cleansing is more effective.', benefit: 'Deeply cleanses pores. Particularly good for acne-prone skin.' },
    ],
  },

  'south-asian': {
    communityId: 'south-asian',
    communityName: 'South Asian',
    skinProfile: {
      commonTypes: 'Combination to oily on the face, normal to dry on the body. South Asian skin often has an olive undertone with warm golden or neutral undertones.',
      uniqueNeeds: ['Hyperpigmentation management (melasma very common due to hormonal factors and UV)', 'Brightening', 'Even skin tone', 'Ayurvedic-aligned clean ingredients'],
      commonConcerns: ['Melasma (hormonally driven hyperpigmentation)', 'Post-inflammatory hyperpigmentation', 'Uneven skin tone', 'Facial hair lightening', 'Under-eye darkness'],
    },
    amRoutine: {
      title: 'South Asian Morning Routine — Modern Meets Ayurvedic',
      steps: [
        { step: 1, name: 'Micellar Water OR Gentle Cleanse', duration: '60 seconds', instruction: 'For normal/combination skin in morning: micellar water on cotton pad over face (gentle removal of sleep products). For oily skin: light foam or gel cleanser. Rinse.', why: 'Morning cleansing removes night cream/oil/sweat. South Asian skin often doesn\'t need a full second cleanser in morning — the PM cleaning was thorough.' },
        { step: 2, name: 'Toner/Essence — Rose Water', duration: '15 seconds', instruction: 'Pure rose water (Dabur, Heritage Store, or DIY distilled) on cotton pad or patted directly onto face.', why: 'Rose water\'s pH (4.5-5) restores the skin\'s acid mantle after cleansing. The skin\'s natural pH is 4.5-5.5 — alkaline cleansers raise it. Rose water quickly restores optimal pH for skin barrier and microbiome.' },
        { step: 3, name: 'Vitamin C Serum', duration: '30 seconds', instruction: 'L-ascorbic acid 10-20% OR sodium ascorbyl phosphate 10-15% (more stable, better for sensitive skin). Apply. Let absorb 60 seconds.', why: 'Essential for melasma-prone South Asian skin. Vitamin C neutralizes UV-generated reactive oxygen species that trigger melanocyte stimulation. Also inhibits tyrosinase directly.' },
        { step: 4, name: 'Moisturizer', duration: '30 seconds', instruction: 'For oily: gel moisturizer with niacinamide. For normal/dry: lotion with hyaluronic acid, glycerin. Can mix a drop of facial oil into moisturizer for extra glow.', why: 'South Asian skin often looks its best with a luminous, "glass skin" finish. Mix a drop of rosehip or marula oil into moisturizer for a dewy, lit-from-within appearance.' },
        { step: 5, name: 'SPF — Critical for Melasma', duration: '30 seconds', instruction: 'SPF 50+ MINIMUM for melasma-prone skin. Tinted mineral SPF if possible (provides physical barrier against visible light which also worsens melasma). Apply generously. Reapply every 2 hours.', why: 'Melasma is driven by UV, visible light, and heat. SPF 50+ is truly necessary (not 30) for melasma because even small amounts of UV trigger melasma. Indoor light can also trigger it.', melasmaNote: 'Melasma is one of the most common skin concerns in South Asian women, driven by genetics, hormones (birth control, pregnancy), and sun exposure. It requires consistent SPF plus treatments (vitamin C, niacinamide, kojic acid, azelaic acid) for management.' },
      ],
    },
    pmRoutine: {
      title: 'South Asian Evening Routine — The Deep Treatment',
      steps: [
        { step: 1, name: 'Oil Cleanse (Abhyanga-Inspired)', duration: '2 minutes', instruction: 'Warm sesame, coconut, or jojoba oil between palms. Massage onto dry face in upward circular motions 60 seconds. Rinse or remove with warm wet cloth.', why: 'Honors the Ayurvedic tradition of oil massage (abhyanga). Oil removes oil-soluble buildup (sunscreen, pollution) effectively without stripping the natural oil mantle.' },
        { step: 2, name: 'Second Cleanse', duration: '60 seconds', instruction: 'Gentle cleanser (Cetaphil, CeraVe, or turmeric soap bar). Massage onto face. Rinse.', why: 'Removes the oil cleanser and any remaining water-soluble residue.' },
        { step: 3, name: 'Exfoliation (Alternate Nights)', duration: '60 seconds', instruction: 'NIGHT A (Monday, Wednesday, Friday): AHA exfoliant (glycolic acid 5-8% or lactic acid 8-12% — lactic is gentler). Apply to clean face. Leave on. NIGHT B (Tuesday, Thursday): Skip exfoliant. Skin rest night.', why: 'AHAs accelerate dead skin cell turnover, which is slower in melasma-affected skin. Lactic acid is preferred for sensitive skin and is more hydrating.' },
        { step: 4, name: 'Treatment Serum', duration: '30 seconds', instruction: 'For melasma nights (exfoliant nights): skip active serum — let the AHA work alone. For rest nights: Niacinamide 10% (reduces melanin transfer) OR Tranexamic acid 3% (melasma-specific ingredient that inhibits melanin at multiple steps) OR Azelaic acid 10-20% (reduces tyrosinase activity, anti-inflammatory).', why: 'Tranexamic acid has excellent evidence specifically for melasma in South Asian skin. Azelaic acid is particularly effective for South Asian skin with concurrent redness or rosacea.' },
        { step: 5, name: 'Night Cream / Heavy Moisturizer', duration: '30 seconds', instruction: 'Richer cream at night. Shea-based for dry skin. Ceramide-rich (CeraVe, Cetaphil moisturizing cream) for combination. Can apply a drop of amla oil (vitamin C oil) into cream for overnight brightening.', why: 'Skin repair peaks overnight. A richer moisturizer provides the lipids needed for barrier repair.' },
      ],
    },
    weeklyRituals: [
      { ritual: 'Ubtan Mask', frequency: 'Weekly', recipe: '1 tbsp gram flour (besan) + 1 tsp turmeric + 1 tsp sandalwood powder + enough rose water to paste. Apply 20 min. Rinse.', benefit: 'Traditional skin brightening mask. Gram flour is a gentle physical exfoliant. Turmeric is anti-inflammatory brightener. Sandalwood is cooling and anti-inflammatory.' },
      { ritual: 'Amla Oil Hair and Face', frequency: 'Weekly', instruction: 'Amla oil applied to scalp for hair growth simultaneously with a few drops patted around the face.', benefit: 'Vitamin C from amla around eyes and face while doing hair treatment.' },
    ],
  },

  'caribbean': {
    communityId: 'caribbean',
    communityName: 'Caribbean',
    skinProfile: {
      commonTypes: 'Afro-Caribbean skin: typically combination to oily, type 4 hair, hyperpigmentation-prone. Indo-Caribbean: combination, similar to South Asian. Mixed heritage: varies widely.',
      uniqueNeeds: ['Sun protection (high UV Caribbean sun)', 'Post-sun repair', 'Humidity-adapted routine (lightweight products)', 'Oil control with hydration'],
      commonConcerns: ['Sun damage', 'PIH from acne', 'Hyperpigmentation', 'Oiliness', 'Keratosis pilaris on body (bumps on arms)'],
    },
    amRoutine: {
      title: 'Caribbean Morning Routine',
      steps: [
        { step: 1, name: 'Aloe Vera Cleanse', duration: '60 seconds', instruction: 'Fresh aloe gel (from plant or pure bottled gel) applied to face. Massage 30 seconds. Rinse with cool water.', why: 'Aloe vera\'s mucilage compounds gently lift surface impurities while its prebiotic polysaccharides support skin microbiome. In Caribbean heat, it also provides an immediate cooling and calming effect.' },
        { step: 2, name: 'Vitamin C (Tropical Fruit-Inspired)', duration: '30 seconds', instruction: 'Vitamin C serum OR: a split between traditional and modern — for oily skin in high humidity, a lightweight niacinamide serum instead of vitamin C may be better tolerated.', why: 'Caribbean fruit tradition (ackee, papaya, soursop, sea moss) is rich in antioxidants. The modern equivalent is topical vitamin C serum.' },
        { step: 3, name: 'Lightweight Gel Moisturizer', duration: '30 seconds', instruction: 'Must be lightweight and non-comedogenic in Caribbean humidity. Gel or fluid texture. Look for: aloe vera base, green tea antioxidants, glycerin without heavy emollients.', why: 'In high humidity, heavy creams feel suffocating and can cause clogged pores (the environment provides ambient moisture). Gel moisturizers keep skin hydrated without the grease.' },
        { step: 4, name: 'SPF (Critical — High UV Index)', duration: '30 seconds', instruction: 'SPF 30-50. Must reapply every 2 hours in outdoor Caribbean sun. Water-resistant SPF if sweating or swimming. Choose non-comedogenic for oily skin.', why: 'Caribbean UV index regularly reaches 11-12+ (extreme). Even melanin-rich skin develops photodamage, hyperpigmentation, and over a lifetime increased skin cancer risk without SPF.' },
      ],
    },
    pmRoutine: {
      title: 'Caribbean Evening Routine',
      steps: [
        { step: 1, name: 'Coconut Oil Pre-Cleanse', duration: '90 seconds', instruction: 'Virgin coconut oil massaged onto face. Removes sunscreen and daily buildup. Rinse or remove with warm cloth.', why: 'Traditional Caribbean practice meets modern skincare science: coconut oil is an excellent makeup/sunscreen remover and penetrates the skin shaft to reduce protein loss during cleansing.' },
        { step: 2, name: 'Papaya Enzyme Cleanse (2-3x weekly)', duration: '60 seconds', instruction: 'Papaya enzyme cleanser or mashed papaya flesh applied to face. Leave 5-10 min. Rinse.', why: 'Papain enzyme from papaya provides gentle chemical exfoliation — loosening dead skin cells and sebum buildup without the abrasion of scrubs.' },
        { step: 3, name: 'Sea Moss Gel Mask (Weekly) or Toner', duration: '5-15 min', instruction: 'Apply sea moss gel (homemade or commercial) to face. Leave 15 min. Rinse OR: apply diluted sea moss gel as a leave-on essence/toner.', why: 'Sea moss (Chondrus crispus) contains minerals, iodine and natural carrageenan that hydrates and supports skin elasticity. Caribbean tradition meets skin science.' },
        { step: 4, name: 'BHA Exfoliant (2x weekly for acne-prone)', duration: '60 seconds', instruction: 'Salicylic acid 1-2% applied to clean skin. Leave on. No rinse.', why: 'Salicylic acid penetrates into pores and exfoliates from inside — ideal for oily, acne-prone Caribbean skin.' },
        { step: 5, name: 'Night Moisturizer', duration: '30 seconds', instruction: 'Lightweight-medium cream. Can mix in a drop of coconut oil for dry patches.', why: 'Night repair. Less need for heavy occlusive in Caribbean climate (ambient humidity provides some occlusion).' },
      ],
    },
    weeklyRituals: [
      { ritual: 'Avocado Deep Condition Face Mask', frequency: 'Weekly', recipe: '1/2 mashed ripe avocado + 1 tsp raw honey + 1 tsp coconut oil. Apply 20 min. Rinse.', benefit: 'Avocado oleic acid + honey humectant + coconut oil = intense hydration treatment for face.' },
      { ritual: 'Sea Bath (Physical Activity)', frequency: 'Weekly or as possible', instruction: 'Ocean swimming for mental and physical health. Rinse skin with fresh water after and apply moisturizer.', benefit: 'Saline ocean water, vitamin D from sun, stress reduction (cortisol reduction = better skin).' },
    ],
  },

  'arab': {
    communityId: 'arab',
    communityName: 'Arab Middle Eastern',
    skinProfile: {
      commonTypes: 'Olive to medium-deep skin tones. Often combination to oily. Tends toward sensitivity in some communities. Gulf Arab skin often exposed to extreme AC-dryness vs. outdoor heat contrast.',
      uniqueNeeds: ['Hydration in dry/AC environment', 'Protection from desert UV + heat', 'Brightening (darkness around mouth and eyes is common concern)', 'Maintaining skin luminosity (Arabic beauty ideal emphasizes glowing skin)'],
      commonConcerns: ['Hyperpigmentation (particularly melasma in women)', 'Dehydration from AC/dry air', 'Under-eye darkness', 'Large pores'],
    },
    amRoutine: {
      title: 'Arab Morning Routine — Glow Protocol',
      steps: [
        { step: 1, name: 'Gentle Cleanser', duration: '60 seconds', instruction: 'pH-balanced gel or cream cleanser. Micellar water is also traditional-adjacent (the concept of gentle cleansing with water and emulsifiers has Middle Eastern roots). Rinse with cool water.', why: 'Arab skin often needs gentle cleansing — the desert climate and indoor AC already dry the skin. Harsh cleansing compounds the dryness.' },
        { step: 2, name: 'Rose Water Toner', duration: '15 seconds', instruction: 'Pure rose water (Lebanese rose water, Turkish rose water, or Bulgarian) patted or spritzed onto face. Let absorb.', why: 'Rose water has been central to Arab beauty for over 1,000 years. The ancient Persians distilled rose water in the 7th century. Today, science confirms: it restores pH, has anti-inflammatory roseate compounds, and provides light hydration.' },
        { step: 3, name: 'Vitamin C Serum', duration: '30 seconds', instruction: 'L-ascorbic acid 10-15% or sodium ascorbyl phosphate. Apply. Absorb 60 seconds.', why: 'For melasma and hyperpigmentation common in Arab women, morning vitamin C is essential.' },
        { step: 4, name: 'Hyaluronic Acid Serum (for dry/dehydrated)', duration: '30 seconds', instruction: 'Apply to damp face. 2-3 drops. Pat in.', why: 'Air conditioning is extremely drying to skin. HA on damp skin pulls water into the skin from the wet surface rather than from the deep dermis. If you apply HA to completely dry skin in a dry environment, it can actually draw moisture out of the skin.' },
        { step: 5, name: 'Rich Moisturizer / Argan Oil Moisturizer', duration: '30 seconds', instruction: 'Apply a cream with argan oil or add 2-3 drops of pure argan oil into moisturizer. This is the traditional Moroccan secret — argan oil has been a beauty staple since ancient times.', why: 'Argan oil\'s fatty acid profile (42% oleic, 37% linoleic, tocopherols) is ideal for skin hydration and barrier maintenance in dry environments.' },
        { step: 6, name: 'SPF', duration: '30 seconds', instruction: 'SPF 50+. Essential in the high-UV Middle Eastern sun. Reapply especially midday.', why: 'Middle East and North Africa have some of the highest UV indices in the world. UV drives melasma, hyperpigmentation, and photo-aging.' },
      ],
    },
    pmRoutine: {
      title: 'Arab Evening Routine — Hammam Night Ritual',
      steps: [
        { step: 1, name: 'Hammam-Inspired Cleanse', duration: '3-5 minutes', instruction: 'Once or twice weekly: after shower, apply ghassoul clay paste to face (1 tbsp ghassoul + water). Massage 60 seconds. Rinse. The rest of the week: balm or oil cleanser first, then gentle second cleanser.', why: 'The hammam tradition of deep cleansing followed by resting and recovery maps to modern skincare\'s intensive treatment then recovery cycle.' },
        { step: 2, name: 'Treatment: Tranexamic Acid or Kojic Acid', duration: '30 seconds', instruction: 'Tranexamic acid 3-5% serum (for melasma — strongest evidence for this concern). Or: kojic acid soap/serum (traditionally derived from sake fermentation, effective tyrosinase inhibitor). Apply to face. Leave on.', why: 'Melasma treatment requires consistent use of an effective tyrosinase inhibitor. Tranexamic acid is one of the newest and most effective options with a good safety profile.' },
        { step: 3, name: 'Niacinamide (Optional Layer)', duration: '30 seconds', instruction: 'Niacinamide 10% serum layered after treatment serum or mixed into moisturizer.', why: 'Niacinamide reduces melanin transfer from melanocytes to keratinocytes — complementary mechanism to tyrosinase inhibitors for comprehensive hyperpigmentation treatment.' },
        { step: 4, name: 'Rich Night Cream with Argan', duration: '30 seconds', instruction: 'Rich moisturizing cream. Can be shea-based, ceramide-rich, or argan-enriched. Apply generously.', why: 'Desert skin needs intensive overnight hydration. The AC environment overnight is particularly drying.' },
        { step: 5, name: 'Face Oil Seal — Argan, Rosehip, or Black Seed', duration: '15 seconds', instruction: '2-3 drops of facial oil patted over cream. Seal in overnight.', why: 'Occlusive layer prevents transepidermal water loss during AC-dried overnight environment.' },
      ],
    },
    weeklyRituals: [
      { ritual: 'Hammam Day', frequency: 'Weekly', instruction: 'Steam shower. Kessa exfoliation mitt over body. Ghassoul clay face mask. Argan oil body application. Rest and recovery.', benefit: 'Full body exfoliation and hydration. The pinnacle of Arab self-care.' },
      { ritual: 'Henna Hand Treatment', frequency: 'Monthly or special occasions', instruction: 'Henna paste applied to hands and feet in decorative patterns. Leave 4-8 hours. Remove.', benefit: 'Lawsone from henna coats and strengthens nails. The ritual itself is a meditative, culturally connecting practice.' },
    ],
  },

  'latina': {
    communityId: 'latina',
    communityName: 'Latina',
    skinProfile: {
      commonTypes: 'Extremely diverse. Mexican-Indigenous: typically warm beige to medium brown, combination skin. Caribbean Latina (Dominican, Puerto Rican): warm to deep brown, often oily. South American (Brazilian, Colombian): wide range. Afro-Latina: dark skin with type 4 hair considerations.',
      uniqueNeeds: ['Hyperpigmentation management', 'Antioxidant protection (high UV in many Latin American climates)', 'Brightening for golden skin tones', 'Humidity-adapted or climate-appropriate routine (varies by region)'],
      commonConcerns: ['Melasma (very common in Latina women, especially after pregnancy)', 'PIH from acne', 'Sun damage', 'Uneven skin tone', 'Fine lines (skin may age faster with repetitive sun exposure in warmer climates)'],
    },
    amRoutine: {
      title: 'Latina Morning Routine',
      steps: [
        { step: 1, name: 'Cleanse with Agua de Rosas (Rose Water) or Gentle Cleanser', duration: '60 seconds', instruction: 'Gentle cleanser OR: splash face with water and apply rose water on cotton pad to cleanse in morning.', why: 'Many Latinas maintain the tradition of rose water cleansing passed down through generations.' },
        { step: 2, name: 'Rosemary Water Toner (Optional)', duration: '15 seconds', instruction: 'DIY: steep fresh rosemary in water, cool, decant into spray bottle. Spritz on face as toner.', why: 'Rosemary\'s rosmarinic acid has antioxidant and anti-inflammatory properties. Traditional in Mexican and broader Latin American folk beauty.' },
        { step: 3, name: 'Vitamin C', duration: '30 seconds', instruction: 'For melasma-prone: vitamin C serum AM is essential. For normal skin: can use vitamin C-infused moisturizer instead of separate serum.', why: 'Melasma is extremely common in Latina women — partly genetic, partly driven by the birth control pill and pregnancy hormones. Vitamin C is the first line of defense.' },
        { step: 4, name: 'Moisturizer', duration: '30 seconds', instruction: 'Choose based on climate: humid Latin American climate → lightweight gel. Dry (altitude areas of Mexico, Andes) → richer lotion.', why: 'Routine must match climate.' },
        { step: 5, name: 'SPF', duration: '30 seconds', instruction: 'SPF 30-50. Essential for melasma management. Look for: SPF that is compatible with warm Latina skintones (no white cast, ideally tinted).', why: 'SPF is the #1 melasma prevention tool. Even on cloudy days. Reapply every 2 hours outdoors.' },
      ],
    },
    pmRoutine: {
      title: 'Latina Evening Routine',
      steps: [
        { step: 1, name: 'Oil Cleanse with Avocado or Coconut Oil', duration: '90 seconds', instruction: 'Avocado oil or coconut oil massaged onto face. Removes makeup and sunscreen. Rinse with warm water or cloth.', why: 'Traditional Latina beauty ingredients used as modern oil cleansers.' },
        { step: 2, name: 'Second Cleanse', duration: '60 seconds', instruction: 'Gentle cleanser. Rinse.', why: 'Removes oil cleanser residue.' },
        { step: 3, name: 'Retinol (Rotating Nights — for mature or acne-prone)', duration: '30 seconds', instruction: 'START: retinol 0.025%. 1-2x weekly. Build slowly over 3-4 months to 0.1%, then 0.3%, then 0.5-1%. Apply to fully dry face. Rice-grain amount.', why: 'Retinol is the most evidence-backed anti-aging and acne ingredient. Particularly important for Latina skin post-30 as collagen loss accelerates with UV history.' },
        { step: 4, name: 'Azelaic Acid (for melasma nights, alternate with retinol)', duration: '30 seconds', instruction: 'Azelaic acid 10-15% cream or serum applied to face. Leave on.', why: 'Azelaic acid is one of the safest effective treatments for melasma — safe during pregnancy, reduces tyrosinase, anti-inflammatory. Excellent for olive and deeper skin tones.' },
        { step: 5, name: 'Rich Night Moisturizer', duration: '30 seconds', instruction: 'Apply moisturizer generously. Shea or ceramide-based. On retinol nights, apply moisturizer first (buffer method) then retinol, then moisturizer on top, to reduce irritation.', why: 'Retinol requires well-moisturized skin to minimize irritation and peeling, especially in the first months.' },
      ],
    },
    weeklyRituals: [
      { ritual: 'La Mascarilla de Abuela (Grandmother\'s Mask)', frequency: 'Weekly', recipe: '1 egg yolk + 1 tbsp honey + 1 tsp olive oil. Mix. Apply to face 20 min. Rinse.', benefit: 'Traditional Latina beauty mask. Egg protein, honey humectant, olive oil fatty acids.' },
      { ritual: 'Apple Cider Vinegar Toner', frequency: '2-3x weekly', instruction: '1 part ACV + 4 parts water. Apply to face with cotton pad. Leave a few minutes, then rinse.', benefit: 'ACV\'s malic acid is a mild AHA. Restores pH. Folk remedy across Latin America for clearing skin.' },
    ],
  },

  'east-asian': {
    communityId: 'east-asian',
    communityName: 'East Asian',
    skinProfile: {
      commonTypes: 'Generally combination to oily in center, with normal cheeks. East Asian skin often has smaller pores (appearance), but yellow undertones that need brightening-focused care. Korean skin beauty ideal ("glass skin") has driven the most sophisticated skincare culture in the world.',
      uniqueNeeds: ['Brightening and luminosity', 'Pore minimizing', 'Hydration layering (Korean 7-skin method)', 'Antioxidant protection from pollution (particularly in China/Korea)'],
      commonConcerns: ['Dullness', 'Uneven texture', 'Enlarged pores (appearance)', 'UV spots from sun', 'Under-eye puffiness', 'Fine lines around eyes (less melanin = earlier visible aging vs. darker skin)'],
    },
    amRoutine: {
      title: 'East Asian Morning Routine — K-Beauty Protocol',
      steps: [
        { step: 1, name: 'First Cleanse (If Wore Products to Bed)', duration: '60 seconds', instruction: 'Gentle water-based gel cleanser or just lukewarm water rinse if skin is clean from PM.', why: 'K-beauty philosophy: morning cleansing should be minimal. The skin\'s natural oils that built up overnight are NOT impurities — they are protective.' },
        { step: 2, name: 'Toner (Essence)', duration: '30 seconds', instruction: 'Watery essence or first toner. The 7-skin method: apply 7 thin layers of toner/essence patting in between each. Or: apply 2-3 layers if time-constrained.', why: 'Layering thin hydrating essences builds cumulative deep hydration. Each layer hydrates slightly deeper. This Korean method gives the signature "water-plump" look of glass skin.' },
        { step: 3, name: 'Vitamin C or Niacinamide Serum', duration: '30 seconds', instruction: 'Vitamin C for brightening and UV protection boost. OR niacinamide for pore appearance reduction and brightening. Apply one serum.', why: 'East Asian beauty prioritizes brightening. Both ingredients address the primary concern of luminous, even skin.' },
        { step: 4, name: 'Sheet Mask (2-3x weekly)', duration: '15-20 minutes', instruction: 'Apply sheet mask (Korean sheet masks saturated in essence). Leave 15-20 min. Remove. Pat remaining essence into skin. Do NOT rinse.', why: 'Sheet masks are the ultimate hydration delivery system — the occlusion of the mask prevents the essence from evaporating and drives it into the skin.' },
        { step: 5, name: 'Eye Cream', duration: '15 seconds', instruction: 'Tiny amount of eye cream. Dot around orbital bone with ring finger (weakest finger for gentle pressure). Pat in.', why: 'Under-eye area is thinnest skin on the face. East Asian skin around the eyes benefits from early eye cream use.' },
        { step: 6, name: 'Moisturizer', duration: '30 seconds', instruction: 'Lightweight gel cream or emulsion. Layer over essence layers.', why: 'Seals in the hydration layers.' },
        { step: 7, name: 'SPF — Japanese Grade', duration: '30 seconds', instruction: 'Japanese or Korean sunscreens are considered the best in the world for texture and no white cast. Look for: Biore UV Aqua Rich, Anessa, Beauty of Joseon Glow Sun Serum.', why: 'Japanese sunscreen formulation technology (using chemical filters not approved in the US like Tinosorb and Mexoryl) creates sunscreens that feel like water on the face. SPF is the foundation of East Asian anti-aging philosophy.' },
      ],
    },
    pmRoutine: {
      title: 'East Asian Evening Routine — The Repair Protocol',
      steps: [
        { step: 1, name: 'Oil Cleanse', duration: '60-90 seconds', instruction: 'Cleansing oil or balm (Banila Co Clean It Zero is iconic Korean oil-to-milk cleanser). Massage onto dry face. Add water to emulsify. Rinse.', why: 'Essential to fully remove sunscreen and any makeup. Even "no makeup days" accumulate SPF and pollution on skin.' },
        { step: 2, name: 'Foam Second Cleanse', duration: '60 seconds', instruction: 'Gentle foam cleanser. The double-cleanse removes everything.', why: 'The double cleanse is perhaps Korea\'s most important skincare contribution to the world. Korean skin philosophy: if your skin isn\'t fully clean, nothing else you apply can work properly.' },
        { step: 3, name: 'Exfoliation Toner (2-3x weekly)', duration: '30 seconds', instruction: 'Chemical exfoliant toner: BHA (Cosrx BHA Blackhead Power Liquid) or AHA. On non-exfoliant nights: skip to hydrating toner.', why: 'Regular gentle exfoliation maintains the "glass skin" surface texture by removing the dull dead skin layer.' },
        { step: 4, name: 'Fermented Essence (The K-Beauty Secret)', duration: '30 seconds', instruction: 'A fermented skincare product (galactomyces ferment filtrate, bifida ferment lysate, or similar). Apply and pat in.', why: 'This is the K-beauty differentiator: fermented ingredients have smaller molecular weight (penetrate deeper), higher bioavailability, and postbiotic compounds that support skin.' },
        { step: 5, name: 'Serum (Targeted Treatment)', duration: '30 seconds', instruction: 'Choose based on concern: retinol/bakuchiol for anti-aging, niacinamide for pores/brightening, hyaluronic acid for hydration.', why: 'Layer actives after the essence foundation.' },
        { step: 6, name: 'Eye Cream', duration: '15 seconds', instruction: 'Apply around orbital bone.', why: 'Consistent eye care is a cornerstone of East Asian skincare.' },
        { step: 7, name: 'Sleeping Mask (Overnight Pack)', duration: '30 seconds', instruction: '2-3 nights per week: apply a sleeping mask (Laneige Water Sleeping Mask, or similar) as the final step instead of regular moisturizer.', why: 'Sleeping packs are occlusive, creating a humid environment that maximizes skin barrier repair overnight. Korean women swear by sleeping packs for waking with plump, glass skin.' },
      ],
    },
    weeklyRituals: [
      { ritual: 'Gua Sha Facial Massage', frequency: '3-5x weekly', instruction: 'Apply facial oil (camellia, rosehip). Use gua sha tool to gently massage face: forehead, cheeks, jawline, neck. Lift motions only. 5-10 minutes.', benefit: 'Lymphatic drainage. Reduces puffiness. Improves circulation. Traditional Chinese beauty meets modern glass skin goal.' },
      { ritual: 'Rice Water Rinse', frequency: 'Weekly', instruction: 'After washing rice, collect the water. Apply to face or add to bath.', benefit: 'Inositol repairs hair and skin from inside. Traditional Japanese/Korean/Chinese beauty ritual.' },
    ],
  },

  'east-african': {
    communityId: 'east-african',
    communityName: 'East African',
    skinProfile: {
      commonTypes: 'Deep melanin-rich skin (type IV-VI Fitzpatrick). Horn of Africa communities often have warm undertones with a distinctive texture. Prone to hyperpigmentation and ashy appearance when dehydrated.',
      uniqueNeeds: ['Intense hydration (Saharan and highland wind can be drying)', 'Hyperpigmentation management', 'Brightening', 'Even skin tone'],
      commonConcerns: ['Ashy appearance (dehydration)', 'Hyperpigmentation', 'Post-inflammatory marks', 'Hypopigmentation scars from old wounds in some cases'],
    },
    amRoutine: {
      title: 'East African Morning Routine',
      steps: [
        { step: 1, name: 'Gentle Cleanse or Water Only', duration: '60 seconds', instruction: 'Many East African beauty traditions minimize morning face washing (over-washing in dry highland climates is drying). Cool water splash + gentle cleanser for oily skin, or water only for dry skin.', why: 'The Saharan wind and highland climates of Ethiopia/Eritrea/Somalia are more drying than West Africa. In dry environments, over-cleansing is worse for the skin than under-cleansing.' },
        { step: 2, name: 'Frankincense Toner', duration: '15 seconds', instruction: 'DIY: frankincense resin simmered in water, cooled, applied as toner. OR: frankincense essential oil 1-2 drops in a toner base.', why: 'Frankincense (Boswellia) is from Somalia and the Horn of Africa — this is truly indigenous skincare. Boswellic acids are anti-inflammatory. Traditional and modern benefits align.' },
        { step: 3, name: 'Vitamin C or Brightening Serum', duration: '30 seconds', instruction: 'Vitamin C serum or niacinamide for brightening and evening skin tone.', why: 'Hyperpigmentation is a primary concern. Consistent vitamin C use is the most accessible evidence-backed treatment.' },
        { step: 4, name: 'Rich Moisturizer for Dry Climate', duration: '30 seconds', instruction: 'Shea butter or shea-containing cream for Highland communities (dry climate). Lighter gel for coastal Somali communities (humid).', why: 'Climate determines moisturizer weight. Ethiopian highlands vs. Mogadishu coast require very different moisture levels.' },
        { step: 5, name: 'SPF', duration: '30 seconds', instruction: 'East Africa has very high UV (proximity to equator, altitude increases UV). SPF 30-50 daily.', why: 'High altitude means less atmospheric filtration of UV. Ethiopia\'s highlands at 2,000-3,000m above sea level have significantly higher UV than coastal areas at the same latitude.' },
      ],
    },
    pmRoutine: {
      title: 'East African Evening Routine',
      steps: [
        { step: 1, name: 'Cleanse with Injera-Inspired Lactic Acid Cleanser', duration: '60 seconds', instruction: 'A lactic acid cleanser (2-5% lactic acid) honors the injera tradition. Apply, massage gently, rinse.', why: 'Injera\'s sour ferment produces lactic acid. Commercial lactic acid cleansers capture this in an effective, stable format. Lactic acid is a gentle AHA that brightens and hydrates simultaneously.' },
        { step: 2, name: 'Ethiopian Honey Mask (Weekly) or Treatment Serum', duration: '20 min (mask) or 30 sec (serum)', instruction: 'WEEKLY: raw Ethiopian honey applied to face. Leave 20 min. Rinse. OTHER NIGHTS: niacinamide or alpha arbutin serum. Apply and leave on.', why: 'Ethiopian honey from the diverse forests of Ethiopia is antimicrobial and anti-inflammatory. As a weekly treatment, it supports the skin\'s microbiome while providing gentle exfoliation from natural enzymes.' },
        { step: 3, name: 'Serum', duration: '30 seconds', instruction: 'Alpha arbutin 2% for hyperpigmentation. Or niacinamide 10%. Or retinol 0.025% for anti-aging (rotating with other actives).', why: 'Consistent treatment serum use is what creates visible results over months.' },
        { step: 4, name: 'Body and Face Oil — Moringa', duration: '30 seconds', instruction: 'Moringa oil applied to face and body (moringa trees grow across East Africa and the Sahel). Massage in circular motions.', why: 'Moringa oil\'s behenic acid is uniquely effective at sealing the hair and skin shaft. Its high oleic acid content makes it extremely hydrating. Antioxidants prevent overnight oxidative damage.' },
      ],
    },
    weeklyRituals: [
      { ritual: 'Coffee Scrub (Ethiopian Origin)', frequency: 'Weekly (body)', recipe: '1/4 cup used coffee grounds + 2 tbsp coconut oil + 1 tbsp honey. Mix. Apply to damp body. Scrub in circles. Rinse.', benefit: 'Coffee\'s origin is Ethiopia. Caffeine in coffee grounds reduces puffiness. Physical exfoliation from grounds + moisturizing oils = immediate skin smoothness.' },
    ],
  },

  'south-african': {
    communityId: 'south-african',
    communityName: 'South African',
    skinProfile: {
      commonTypes: 'Bantu South African: deep melanin-rich skin, similar to West African profile. Cape Malay/Indian: olive to medium, similar to South Asian profile. Mixed heritage South African (Coloured communities): warm tan to medium, combination skin.',
      uniqueNeeds: ['Hyperpigmentation management', 'Sun protection (high UV especially Highveld)', 'Hydration', 'Even skin tone'],
      commonConcerns: ['UV damage (high altitude Highveld + southern hemisphere ozone thinning)', 'Hyperpigmentation', 'Winter skin dryness (Highveld winters are extremely dry)'],
    },
    amRoutine: {
      title: 'South African Morning Routine',
      steps: [
        { step: 1, name: 'Rooibos Cleanse or Gentle Cleanser', duration: '60 seconds', instruction: 'Use a rooibos-infused cleanser (South African brands: Annique Rooibos, Sarie brand). Or: cooled rooibos tea on cotton pad as cleansing toner for dry skin.', why: 'Rooibos is uniquely South African — both supporting local economy and providing aspalathin antioxidant for skin.' },
        { step: 2, name: 'Marula Oil (1-2 drops) Mixed into Moisturizer', duration: '30 seconds', instruction: 'Mix 1-2 drops of pure marula oil into your moisturizer before applying. The oil is light enough to not clog pores while intensely hydrating.', why: 'Marula from South Africa is truly a local treasure. The lightest natural oil. Highest absorption. High in oleic acid and procyanidins. Traditional and modern science agree on its excellence.' },
        { step: 3, name: 'SPF — Critical for Highveld and Southern Hemisphere', duration: '30 seconds', instruction: 'SPF 30-50 EVERY DAY. The Southern Hemisphere has thinner ozone layer than Northern → more UV reaches South Africa. SPF is NOT optional.', why: 'South Africa has one of the highest melanoma rates in the world (particularly in light-skinned South Africans of European descent). UV intensity is genuinely higher.' },
      ],
    },
    pmRoutine: {
      title: 'South African Evening Routine',
      steps: [
        { step: 1, name: 'Double Cleanse with Marula Oil', duration: '2 minutes', instruction: 'First cleanse: marula oil. Second cleanse: gentle cleanser.', why: 'Marula oil first cleanse removes sunscreen and pollution. Second cleanse removes marula and water-soluble impurities.' },
        { step: 2, name: 'Rooibos Toner or Vitamin C', duration: '30 seconds', instruction: 'Strong-brewed cooled rooibos as toner (DIY) or vitamin C serum.', why: 'Rooibos antioxidants provide evening skin repair support.' },
        { step: 3, name: 'Retinol or Vitamin A (prescription)', duration: '30 seconds', instruction: 'Retinol 0.05-0.1% or prescription tretinoin 0.025-0.05% for anti-aging and hyperpigmentation. Apply to dry face. Use every 2-3 nights to start.', why: 'Vitamin A (retinol/tretinoin) is the most evidence-backed ingredient for anti-aging and hyperpigmentation. Highveld UV accelerates skin aging — retinol counteracts this overnight.' },
        { step: 4, name: 'Rich Night Moisturizer', duration: '30 seconds', instruction: 'On retinol nights: apply moisturizer first (buffer), then retinol, then another layer of moisturizer. On non-retinol nights: apply shea or ceramide cream. Marula oil as final seal.', why: 'Highveld winter nights are extremely dry. Intensive overnight hydration is essential.' },
      ],
    },
    weeklyRituals: [
      { ritual: 'Rooibos Deep Condition', frequency: 'Weekly (Hair + Skin)', instruction: 'Brew very strong rooibos. Cool. Pour over hair as final rinse and soak into face as mask (lie back with rooibos-soaked cloth on face 10 min).', benefit: 'Aspalathin antioxidant protection for skin and hair simultaneously.' },
    ],
  },

  'black-american': {
    communityId: 'black-american',
    communityName: 'Black American',
    skinProfile: {
      commonTypes: 'Type III-VI Fitzpatrick. Predominantly combination to oily on face. Higher sebaceous gland density in many Black Americans creates oily T-zone.  Melanin-rich skin has inherent SPF equivalent to about SPF 13 (natural protection) — but this is NOT enough for daily UV protection.',
      uniqueNeeds: ['PIH treatment (post-inflammatory hyperpigmentation from acne and eczema)', 'Keloid prevention', 'Oil control', 'Brightening', 'Ashy prevention for body'],
      commonConcerns: ['Post-inflammatory hyperpigmentation (the #1 skin concern)', 'Acne', 'Eczema/Atopic dermatitis (significantly higher prevalence in Black Americans)', 'Keloid scarring', 'Ashy skin (dehydration)', 'Pseudofolliculitis barbae (razor bumps in men)'],
    },
    amRoutine: {
      title: 'Black American Morning Routine',
      steps: [
        { step: 1, name: 'Gentle Cleanse (Or Water Only)', duration: '60 seconds', instruction: 'CeraVe Hydrating Cleanser, La Roche-Posay Toleriane, or African black soap. For oily skin: gel cleanser. For combo: cream cleanser. Cool water rinse.', why: 'Black American skin has lower ceramide content on average, making the barrier more vulnerable to cleansing. Gentle cleansers preserve the barrier.' },
        { step: 2, name: 'Vitamin C Serum', duration: '30 seconds', instruction: 'For PIH: vitamin C is the morning cornerstone. L-ascorbic acid or sodium ascorbyl phosphate. Apply. Absorb.', why: 'PIH prevention and treatment requires consistent daily vitamin C use. It inhibits the tyrosinase that creates the dark spot when skin is inflamed.' },
        { step: 3, name: 'Moisturizer', duration: '30 seconds', instruction: 'For oily: gel moisturizer with niacinamide. For combination: lightweight lotion with ceramides. For eczema: ceramide-rich cream (CeraVe is dermatologist-recommended for eczema).', why: 'CeraVe was specifically formulated with dermatologist input. Its ceramide + hyaluronic acid formula is particularly effective for Black skin\'s barrier needs.' },
        { step: 4, name: 'SPF', duration: '30 seconds', instruction: 'SPF 30-50. THE MOST OVERLOOKED STEP IN BLACK SKINCARE. Black skin DOES get sun damage. UV causes and worsens PIH, accelerates dark spots, and increases skin cancer risk (when diagnosed later, worse outcomes).', why: 'The myth that Black skin doesn\'t need SPF has led to real health harm. While melanin provides some (limited) protection, it is insufficient for daily UV exposure. PIH from ANY inflammation (including from UV exposure itself) is worsened by continued UV exposure. Black-owned SPF brands: Black Girl Sunscreen, Unsun.' },
      ],
    },
    pmRoutine: {
      title: 'Black American Evening Routine',
      steps: [
        { step: 1, name: 'Cleanse', duration: '60 seconds', instruction: 'Gentle cleanser. Can double cleanse if wore makeup/sunscreen. First: cleansing oil. Second: face wash.', why: 'Thorough cleansing especially important for PIH prevention — bacteria from inadequate cleansing triggers acne triggers PIH.' },
        { step: 2, name: 'Exfoliation (2-3x weekly — Gentle is Key)', duration: '60 seconds', instruction: 'BHA (salicylic acid 0.5-2%) for oily/acne-prone. AHA (lactic acid 5-10%) for dry/normal with PIH. START VERY SLOWLY — over-exfoliation in melanin-rich skin causes PIH itself.', caution: 'CRITICAL: Exfoliation that irritates melanin-rich skin triggers PIH and hyperpigmentation. The goal is gentle, never aggressive.' },
        { step: 3, name: 'Treatment for PIH', duration: '30 seconds', instruction: 'BEST COMBINATION: Niacinamide 10% + alpha arbutin 2% (can be in same product or layered). Or: kojic acid 1-2%. Or: tranexamic acid 3-5%. Apply after exfoliation on exfoliation nights, or alone on non-exfoliation nights.', why: 'PIH treatment requires consistent use of tyrosinase inhibitors and melanin transfer inhibitors. No single ingredient works as fast as the combination.' },
        { step: 4, name: 'Retinol (2-3x weekly, not same night as exfoliation)', duration: '30 seconds', instruction: 'Start: retinol 0.025% or bakuchiol (natural retinol alternative, gentler). Build very slowly. DO NOT start retinol during summer if spending time outdoors — start in fall/winter.', why: 'Retinol accelerates cell turnover, helping PIH fade faster. It also prevents and reverses fine lines. For Black skin, start VERY LOW and build slowly — irritation from too-strong retinol causes PIH.' },
        { step: 5, name: 'Moisturizer', duration: '30 seconds', instruction: 'Generous moisturizer. On retinol nights: layer moisturizer over retinol to reduce irritation. Or: sandwich method (moisturizer → retinol → moisturizer).', why: 'Moisturizing over retinol dramatically reduces peeling and redness that can trigger PIH in melanin-rich skin.' },
        { step: 6, name: 'Vaseline Slugging (Optional — Skin Type Dependent)', duration: '15 seconds', instruction: 'For dry skin ONLY (not oily/acne-prone): thin layer of Vaseline over all skincare as final step.', why: 'The Black American grandmothers\' secret: Vaseline as the ultimate occlusive. The slugging trend is a rediscovery of this tradition. Vaseline creates a 98% occlusive layer that prevents all transepidermal water loss. For ashy or extremely dry skin, it is remarkable.' },
      ],
    },
    weeklyRituals: [
      { ritual: 'Bentonite Clay Mask', frequency: 'Weekly (oily/combo skin)', recipe: 'Bentonite clay + apple cider vinegar to paste. Apply to face 10-15 min. Rinse completely.', benefit: 'Deep pore cleanse. ACV provides mild AHA exfoliation. Traditional Black American beauty staple (popularized in natural hair community as "wash day" mask).' },
      { ritual: 'Shea Butter Body Ritual', frequency: 'Daily or as needed', instruction: 'Raw shea butter applied to damp body skin after shower. Massage in.', benefit: 'THE Black American moisturizing tradition. Prevents ashy, maintains skin suppleness, microbiome-friendly formula.' },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL SKINCARE ROUTINE PRINCIPLES
// ─────────────────────────────────────────────────────────────────────────────

export const UNIVERSAL_SKINCARE_ROUTINE = {
  layeringOrder: {
    rule: 'Thinnest to Thickest. Water-based before oil-based.',
    order: ['Cleanse', 'Exfoliate (on exfoliation days)', 'Tone/Essence', 'Vitamin C (morning)', 'Treatment Serums', 'Eye Cream', 'Moisturizer', 'SPF (morning only)', 'Face Oil (optional last step PM)', 'Occlusive/Slugging (optional last PM)'],
    why: 'Each subsequent layer needs to absorb or sit on top of the previous. Thin watery products (toners, serums) absorb first. Thick creams and oils seal everything in.',
  },
  theBigThree: {
    description: 'If you only do three things, do these:',
    one: 'Cleanse — once at night thoroughly. Morning: optional.',
    two: 'Moisturize — every day, morning and evening.',
    three: 'SPF — every single morning, rain or shine.',
  },
  activeIngredients: {
    vitamingC: { when: 'Morning only. Vitamin C protects against UV-induced free radicals during the day.', dont: 'Do not use at the same time as niacinamide (they cancel each other out at high concentrations). Use one in AM, one in PM.' },
    retinol: { when: 'Evening only. UV degrades retinol. Also retinol makes skin photosensitive.', dont: 'Do not use on the same night as AHA/BHA exfoliants in the early months. Alternate nights.' },
    aha_bha: { when: 'Evening only typically. AHA (lactic, glycolic): evening. BHA (salicylic): morning or evening.', dont: 'Do not use every night to start. 1x weekly, build to 2-3x maximum.' },
    niacinamide: { when: 'Morning or evening. One of the most versatile, gentle ingredients.', benefit: 'Reduces pore appearance, evens skin tone, reduces melanin transfer, anti-inflammatory. Works well with almost everything.' },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// GETTER FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export function getSkincareRoutineGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_SKINCARE_ROUTINE_GUIDES['west-african'],
    'south-asian': ETHNIC_SKINCARE_ROUTINE_GUIDES['south-asian'],
    'caribbean': ETHNIC_SKINCARE_ROUTINE_GUIDES['caribbean'],
    'arab': ETHNIC_SKINCARE_ROUTINE_GUIDES['arab'],
    'latina': ETHNIC_SKINCARE_ROUTINE_GUIDES['latina'],
    'east-asian': ETHNIC_SKINCARE_ROUTINE_GUIDES['east-asian'],
    'east-african': ETHNIC_SKINCARE_ROUTINE_GUIDES['east-african'],
    'south-african': ETHNIC_SKINCARE_ROUTINE_GUIDES['south-african'],
    'black-american': ETHNIC_SKINCARE_ROUTINE_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

export const SKINCARE_ROUTINE_STATS = {
  moduleId: 'skincare_routine_ethnic_guide',
  communitiesCovered: 9,
  routineTypesCovered: ['AM routine', 'PM routine', 'Weekly rituals', 'Active ingredient guidance'],
  version: '1.0.0',
};
