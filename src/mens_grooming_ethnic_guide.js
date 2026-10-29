/**
 * MIRRR — Men's Grooming Ethnic Guide
 * Comprehensive grooming, skincare, and beauty guidance for men across
 * all 9 ethnic communities. Covers beard care, skincare routines,
 * traditional grooming rituals, and culturally specific practices.
 */

export const ETHNIC_MENS_GROOMING_GUIDES = {
  'west-african': {
    communityId: 'west-african',
    communityName: 'West African',
    groomingPhilosophy: 'West African men\'s grooming is rooted in dignity, presentation, and cultural pride. A well-groomed West African man is a statement of respect — for himself, his community, and his heritage. From the ceremonially lined fade of Ghanaian barber art to the precisely tapered Afro of Lagos fashion, grooming is cultural expression. Traditional practices using locally sourced ingredients have long maintained the health and appearance of West African men\'s skin, hair, and beards.',
    commonConcerns: [
      'Razor bumps (pseudofolliculitis barbae) — extremely prevalent in West African men with tightly coiled beard hair',
      'Hyperpigmentation from acne or ingrown hairs',
      'Scalp health and traction alopecia from certain hairstyles',
      'Ashiness — dry, ashy skin especially on hands, elbows, and darker areas',
      'Hyperpigmentation of the neckline from chronic razor irritation',
    ],
    traditionalPractices: [
      {
        name: 'Shea Butter Skin Maintenance',
        description: 'Unrefined shea butter is the cornerstone of West African men\'s skincare — applied post-shower to lock in moisture and prevent ashiness.',
        application: 'Apply generously to damp skin within 2 minutes of showering. Focus on elbows, knees, ashy areas. For face, use sparingly (shea is comedogenic).',
        enhancement: 'Add a few drops of tea tree oil to shea butter for antibacterial benefit — helps prevent ingrown hairs.',
      },
      {
        name: 'Palm Oil Hair Treatment',
        description: 'Palm oil (red palm oil for higher antioxidant content) applied to the scalp and hair as a deep conditioning treatment.',
        method: 'Warm palm oil. Apply to scalp and hair. Cover with a warm towel. Leave 20–30 minutes. Shampoo out with a clarifying cleanser.',
        benefit: 'Rich in vitamin E, beta-carotene, and fatty acids that nourish the scalp and reduce breakage.',
      },
      {
        name: 'Neem Oil Beard Treatment',
        description: 'Neem oil applied to the beard to prevent ingrown hairs, reduce inflammation, and treat beard dandruff.',
        method: 'Mix 3–4 drops neem oil into a carrier oil (coconut or jojoba). Apply to beard after showering.',
        warning: 'Neem oil has a strong odor. Use sparingly and with a more pleasant carrier.',
      },
      {
        name: 'African Black Soap Face Wash',
        description: 'Authentic African black soap used as a daily face cleanser. Removes excess oil, treats acne, and gently exfoliates.',
        how: 'Work a small amount into a light lather. Apply to face. Leave 30 seconds. Rinse thoroughly. Follow with a light moisturizer.',
        note: 'Black soap is alkaline — overuse can disrupt skin barrier. 1x daily maximum.',
      },
    ],
    razorBumpGuide: {
      whatAreRazorBumps: 'Pseudofolliculitis barbae (PFB) — when tightly coiled beard hair curls back into the skin after shaving, causing inflammation, bumps, and hyperpigmentation.',
      prevalence: 'Affects 45–83% of Black men who shave. One of the most significant skincare issues in West African and broader Black communities.',
      prevention: [
        'Electric clipper with guards instead of a razor blade — leaves hair slightly longer, reducing in-growth',
        'Shave in the direction of hair growth (with the grain), not against it',
        'Single-blade razor if you prefer a close shave — multiple blades cut below the skin surface',
        'Pre-shave oil to soften hair and reduce drag',
        'Never dry shave — always with water and a quality shave cream',
        'Chemical exfoliation (glycolic acid, salicylic acid) to prevent dead skin trapping hairs',
      ],
      treatment: [
        'Warm compress to the affected area to open follicles',
        'Use a sterilized needle to manually release trapped hairs (not squeeze or pop)',
        'Salicylic acid product to reduce inflammation and exfoliate',
        'Benzoyl peroxide if infected bumps are present',
        'Niacinamide for post-bump hyperpigmentation',
        'Dark spot corrector for long-term mark reduction',
      ],
      products: [
        'Bump Patrol Aftershave Treatment',
        'Tend Skin Solution',
        'Bevel Shave System (designed specifically for Black men\'s grooming needs)',
        'Walker & Company Bevel Sensitive Skin Shave Cream',
      ],
    },
    beardCare: {
      groomingStyles: [
        {
          style: 'Shaped Beard',
          description: 'A full beard shaped and lined at the neckline, cheeks, and mustache for a clean, defined look.',
          maintenance: 'Professional lining every 2–3 weeks. Home maintenance with a precision trimmer.',
        },
        {
          style: 'Low Fade + Beard',
          description: 'The Lagos/Accra signature look — a tight fade connecting seamlessly to a shaped beard.',
          maintenance: 'Weekly edge-up. Beard oil daily.',
        },
        {
          style: 'Goatee',
          description: 'Mustache + chin beard. A classic West African masculine grooming style.',
          maintenance: 'Sharp lining every 1–2 weeks.',
        },
        {
          style: 'Clean Shave',
          description: 'Smooth, clean-shaven — requires the most disciplined razor bump management.',
          maintenance: 'Every 2–3 days with proper PFB prevention protocol.',
        },
      ],
      beardOilRecipe: {
        base: '2 tbsp jojoba oil + 1 tbsp argan oil + 1 tbsp sweet almond oil',
        adds: '5 drops cedarwood EO + 3 drops peppermint EO + 2 drops tea tree EO',
        instructions: 'Mix in a dropper bottle. Apply 3–5 drops to palm. Rub hands together. Massage into beard from roots to tips daily.',
      },
    },
    hairGrooming: {
      naturalHairCare: [
        'Co-wash with a lightweight conditioner weekly',
        'Deep condition with shea butter mix monthly',
        'Low manipulation styling to minimize breakage',
        'Protective styles: dreads, twists, braids — reduce daily manipulation',
        'Scalp oil with tea tree for dandruff prevention',
      ],
      theBarber: {
        note: 'In West African communities, the barbershop is as much a cultural institution as a grooming venue. A skilled barber is a respected community figure.',
        popularStyles: ['Afro Fade', 'Low Cut', 'Shaved Head', 'Temp Fade', 'Drop Fade + Design', 'Locs / Dreads'],
      },
    },
    skinCareRoutine: {
      minimal: {
        am: ['African black soap or gentle cleanser', 'Lightweight moisturizer with SPF'],
        pm: ['Cleanser', 'Spot treatment if acne', 'Shea butter or heavy moisturizer'],
      },
      advanced: {
        am: ['Cleanser', 'Vitamin C serum', 'Moisturizer', 'SPF 30+'],
        pm: ['Double cleanse', 'Salicylic acid toner (if acne-prone)', 'Niacinamide serum', 'Retinol 2x/week', 'Heavy moisturizer'],
      },
    },
  },

  'south-asian': {
    communityId: 'south-asian',
    communityName: 'South Asian',
    groomingPhilosophy: 'South Asian men\'s grooming is deeply influenced by Ayurvedic tradition — the concept that outer appearance reflects inner health. Hair oiling (champi), skincare using natural pastes, and beard grooming are long-standing practices. Modern South Asian men in urban centers have embraced sophisticated grooming routines combining Ayurvedic fundamentals with contemporary products. The beard has become a central style statement across South Asian communities.',
    commonConcerns: [
      'Oily skin with large pores (very common in South Asian men)',
      'Acne and post-acne hyperpigmentation on oily skin',
      'Thick, coarse beard hair that requires careful management',
      'Hair loss and male-pattern baldness (androgenetic alopecia is very common in South Asian men)',
      'Dark circles from genetic periorbital pigmentation',
    ],
    traditionalPractices: [
      {
        name: 'Champi (Head Massage with Oil)',
        description: 'Weekly head and scalp massage with warm oil — a foundational Ayurvedic practice. Stimulates hair follicles, reduces hair loss, and deeply conditions the scalp.',
        oils: ['Coconut oil', 'Sesame oil (til)', 'Amla oil', 'Bhringraj oil', 'Neem oil'],
        technique: 'Warm the oil. Apply to scalp. Use fingertips (not nails) to massage in circular motions for 10–15 minutes. Cover with a warm towel. Leave 1 hour or overnight. Shampoo out.',
        frequency: 'Weekly minimum. Some traditional practitioners do it nightly.',
      },
      {
        name: 'Multani Mitti (Fuller\'s Earth) Face Mask',
        description: 'Fuller\'s earth (multani mitti) used as a weekly face mask for oil control, pore cleansing, and skin brightening.',
        recipe: '2 tbsp multani mitti + rose water to make a paste + a pinch of turmeric. Apply. Leave 15–20 minutes. Rinse.',
        benefit: 'Absorbs sebum, reduces pore appearance, gently exfoliates, and brightens dull skin.',
      },
      {
        name: 'Ubtan Beard Scrub',
        description: 'Ubtan (traditional Indian paste of besan, turmeric, and milk/rose water) used as a beard and face exfoliator.',
        recipe: '2 tbsp besan + ¼ tsp turmeric + enough milk or rose water to make a paste. Apply to face and beard area. Rub gently. Leave 5 minutes. Rinse.',
      },
      {
        name: 'Neem and Tulsi Face Wash',
        description: 'Neem leaves and holy basil (tulsi) steeped in water used as a face rinse for acne-prone South Asian skin.',
        method: 'Boil 10–15 neem leaves and 10 tulsi leaves in 2 cups water. Strain. Cool. Use as a toner or rinse after cleansing.',
      },
      {
        name: 'Amla Oil for Hair',
        description: 'Amla (Indian gooseberry) oil is one of the most powerful hair growth and scalp health treatments in Ayurveda.',
        benefit: 'High vitamin C content. Reduces premature greying. Strengthens hair shaft. Stimulates follicles.',
        application: 'Apply amla oil to scalp. Massage in. Leave 1–2 hours. Shampoo out with gentle cleanser.',
      },
    ],
    beardCare: {
      southAsianBeardCharacteristics: 'South Asian men typically have thick, coarse, dark beard hair that grows densely. Beard styles range from the full Sikh beard to the precisely shaped urban style.',
      sikhBeardTradition: {
        religioussignificance: 'In Sikhism, the beard (dhari) is a sacred element of the five Ks (panj kakars). Sikhs do not cut their hair or beard.',
        care: [
          'Daily washing with gentle beard wash or shampoo',
          'Deep conditioning with coconut or argan oil',
          'Beard comb to keep neat and tangle-free',
          'Keski or patka to protect and manage the beard during sports or sleep',
          'Beard wax or balm for formal occasions',
        ],
      },
      groomingStyles: [
        'Full beard, shaped and conditioned',
        'Short boxed beard',
        'Designer stubble (3–7 days growth)',
        'Clean shave (requires proper technique for thick coarse hair)',
      ],
      beardSoftener: 'South Asian beard hair can be wiry. Coconut oil or argan oil applied and left for 30 minutes before washing softens and conditions the hair shaft.',
    },
    hairLossGuide: {
      prevalence: 'South Asian men have among the highest rates of androgenetic alopecia globally. Starting as early as the mid-20s.',
      ayurvedicApproach: [
        'Bhringraj oil — Ayurvedic "king of herbs for hair"',
        'Brahmi oil — traditionally used for hair density',
        'Amla oil — antioxidant protection for follicles',
        'Scalp massage to improve blood flow',
        'Diet: include zinc (pumpkin seeds), biotin (eggs), iron (leafy greens)',
      ],
      modernMedical: [
        'Minoxidil (Rogaine) — topical, evidence-based',
        'Finasteride — prescription oral medication, very effective',
        'PRP (platelet-rich plasma) injections',
        'Hair transplant for advanced cases',
        'Consult a dermatologist for personalized protocol',
      ],
    },
    skinCareRoutine: {
      forOilyAcneProneSkin: {
        am: ['Salicylic acid or neem cleanser', 'Niacinamide 10% serum', 'Oil-free gel moisturizer', 'SPF 30+'],
        pm: ['Double cleanse', 'BHA toner or salicylic acid pad', 'Retinol 3x/week', 'Lightweight moisturizer'],
        weekly: ['Multani mitti mask', 'Gentle exfoliation'],
      },
    },
  },

  'caribbean': {
    communityId: 'caribbean',
    communityName: 'Caribbean',
    groomingPhilosophy: 'Caribbean men\'s grooming is cool, confident, and unhurried. The Caribbean man values a crisp fade, a clean shave or neatly shaped beard, and skin that looks healthy and vibrant. Island life influences grooming — salt water, sun, humidity, and outdoor activity shape the products and routines needed. Natural island ingredients — coconut, aloe, tropical herbs — are central to traditional grooming practices.',
    commonConcerns: [
      'Razor bumps from tight coily beard hair',
      'Sun hyperpigmentation from outdoor Caribbean lifestyle',
      'Scalp health in salt and sun conditions',
      'Dry skin from constant air conditioning (in urban Caribbean settings)',
      'Beard styling in humidity',
    ],
    traditionalPractices: [
      {
        name: 'Coconut Oil Full-Body Moisturizer',
        description: 'Pure coconut oil pressed from local coconuts applied post-shower as a full-body moisturizer. The quintessential Caribbean grooming product.',
        application: 'Apply to damp skin within 2 minutes of showering. Coconut oil absorbs beautifully into warm Caribbean skin.',
      },
      {
        name: 'Aloe Vera After-Shave',
        description: 'Fresh aloe gel applied immediately after shaving to cool, soothe, and prevent razor bumps.',
        method: 'Keep an aloe plant at home. Cut a leaf. Scrape the gel. Apply to freshly shaved skin.',
      },
      {
        name: 'Sea Salt Scalp Scrub',
        description: 'Fine sea salt mixed with coconut oil used as a weekly scalp exfoliator.',
        recipe: '2 tbsp fine sea salt + 1 tbsp coconut oil + 3 drops tea tree oil. Massage into wet scalp. Leave 5 minutes. Rinse thoroughly. Shampoo.',
        benefit: 'Removes product buildup, dead skin, and treats dandruff. The sea environment has long provided these ingredients naturally.',
      },
      {
        name: 'Jamaican Black Castor Oil (JBCO)',
        description: 'JBCO applied to the beard and scalp for growth, moisture, and scalp health.',
        application: 'For beard: apply to beard roots and ends nightly. For scalp: massage in before washing.',
      },
    ],
    beachGroomingRoutine: {
      preBeach: [
        'SPF 30 on face and any exposed skin',
        'Lightweight, water-resistant moisturizer',
        'Waterproof SPF lip balm',
      ],
      postBeach: [
        'Rinse thoroughly with fresh water — salt dries hair and skin',
        'Aloe gel on any sun-exposed areas',
        'Deep condition hair after salt water exposure',
        'Moisturize heavily — salt and sun are dehydrating',
      ],
    },
    barbershopCulture: {
      significance: 'The Caribbean barbershop is a cornerstone of community life — as much a social institution as a grooming destination. Music, dominoes, conversation, and community happen here.',
      popularStyles: ['Afro Fade', 'High Top Fade', 'Skin Fade', 'Temp Fade + Line', 'Locs', 'Cornrows', 'Clean Shave', 'Shaped Beard'],
    },
    skinCareRoutine: {
      minimal: {
        am: ['Gentle cleanser', 'SPF moisturizer'],
        pm: ['Cleanser', 'Aloe gel', 'Coconut oil'],
      },
    },
  },

  'arab': {
    communityId: 'arab',
    communityName: 'Arab Middle Eastern',
    groomingPhilosophy: 'Arab men\'s grooming is sophisticated, intentional, and fragrance-forward. The beard holds religious and cultural significance across Muslim Arab communities. Skin care using traditional formulations — oud-infused balms, argan oil preparations, rose water toners — represents a long heritage of grooming sophistication. Modern Arab men in Dubai, Cairo, Riyadh, and Beirut have embraced a fusion of traditional rituals and international luxury grooming.',
    commonConcerns: [
      'Dense, thick, fast-growing beard that requires regular maintenance',
      'Oily skin in humid Gulf environments',
      'Hyperpigmentation from sun exposure',
      'Dehydration-related skin issues in desert climates',
      'Finding fragrances that complement the traditional oud note',
    ],
    traditionalPractices: [
      {
        name: 'Hammam (Traditional Steam Bath)',
        description: 'The hammam is central to Arab male grooming culture. A full hammam session involves steaming, kese (exfoliating mitt) scrub, soap lather, and rinse. Deeply cleanses pores and sloughs off dead skin.',
        frequency: 'Weekly or bi-weekly in traditional practice.',
        modernEquivalent: 'Steam treatment at a barber shop. At-home: hot shower + exfoliating scrub mitt.',
      },
      {
        name: 'Argan Oil Beard Conditioning',
        description: 'Pure Moroccan argan oil applied to the beard for conditioning, shine, and softening.',
        application: '2–3 drops rubbed between palms. Worked through the beard from roots to tips.',
        benefit: 'High vitamin E and oleic acid content. Softens thick Arab beard hair beautifully.',
      },
      {
        name: 'Oud (Agarwood) Fragrance Ritual',
        description: 'Burning oud chips in a mabkhara (incense burner) and wafting clothing, hair, and skin over the smoke. The quintessential Arab male fragrance tradition.',
        modern: 'Oud-based cologne (Amouage, Swiss Arabian, Rasasi) as an everyday luxury scent.',
        significance: 'Oud fragrance is synonymous with Arab masculine elegance. A man who smells of oud commands respect.',
      },
      {
        name: 'Black Seed Oil Skin Treatment',
        description: 'Black seed oil (habbatus sauda) applied topically for skin health, beard growth, and anti-inflammatory benefit.',
        application: 'Apply a few drops to face as a serum. Mix into beard oil for beard use.',
      },
      {
        name: 'Rose Water Toner',
        description: 'Rose water (ma\' al-ward) used as a daily face toner — balancing pH and soothing irritated skin after shaving.',
        method: 'Apply to cotton pad or pour into hands. Pat onto face after cleansing.',
      },
    ],
    arabBeardTradition: {
      islamicContext: 'The beard in Islam is considered a sunnah (tradition of the Prophet Muhammad, peace be upon him). Many Muslim Arab men maintain a beard as a religious practice.',
      classicShapes: [
        {
          style: 'Full Sunnah Beard',
          description: 'Full beard, not trimmed on the length (one fist length minimum in some schools), with the mustache trimmed above the lip line.',
        },
        {
          style: 'Shaped Full Beard',
          description: 'Full coverage beard, shaped and lined on cheek line and neckline for a clean appearance.',
        },
        {
          style: 'Short Shaped Beard',
          description: 'Shorter beard, precisely shaped. Very popular in Levantine and North African cities.',
        },
        {
          style: 'Gulf Designer Beard',
          description: 'Often very well maintained, with professional lining, sometimes with decorative shaping.',
        },
      ],
      beardCareRituals: [
        'Daily wash with mild shampoo or beard wash',
        'Argan or oud-infused beard oil applied daily',
        'Beard comb or brush for styling',
        'Professional trimming and shaping at a barber every 2 weeks',
      ],
    },
    fragranceGuide: {
      oudBasedScents: ['Amouage Interlude Man', 'Swiss Arabian Shaghaf Oud Aswad', 'Rasasi Dhanal Oudh Al Nokhba', 'Abdul Samad Al Qurashi Royal Oud'],
      layering: 'Traditional Arab fragrance layering: body oil or lotion on skin, then oud perfume on pulse points, then oud clothing smoke (optional). The layers create a complex, evolving scent signature.',
    },
  },

  'latina': {
    communityId: 'latina',
    communityName: 'Latino',
    groomingPhilosophy: 'Latino men\'s grooming is proud, sharp, and community-rooted. The barbershop (peluquería) is one of the most important community spaces in Latin American neighborhoods. A fresh cut, a clean line-up, and a well-maintained beard or mustache are expressions of self-respect and cultural identity. Traditional grooming practices using local plants and oils have been passed down through generations alongside modern barbering techniques.',
    commonConcerns: [
      'Razor bumps from curly/coily beard hair in Afro-Latino communities',
      'Oily skin and acne common in teen and young adult Latino men',
      'Sun hyperpigmentation from outdoor lifestyle',
      'Hair texture ranging from straight to very coily across the community diversity',
      'Finding products for the wide range of Latino skin tones',
    ],
    traditionalPractices: [
      {
        name: 'Aceite de Almendra (Sweet Almond Oil) Hair Treatment',
        description: 'Sweet almond oil applied to hair and scalp as a traditional Latin American conditioning treatment.',
        application: 'Warm a small amount. Massage into scalp and work through hair. Cover with a towel. Leave 30 minutes. Shampoo out.',
      },
      {
        name: 'Sábila (Aloe Vera) After-Shave',
        description: 'Fresh aloe vera gel applied immediately post-shave to prevent irritation, razor bumps, and soothe skin.',
        benefit: 'Anti-inflammatory, cooling, and accelerates skin healing.',
      },
      {
        name: 'Aceite de Coco (Coconut Oil) Moisturizer',
        description: 'Coconut oil applied to the body and beard as a multi-purpose moisturizer and grooming oil.',
        tip: 'For the face, use sparingly — coconut oil is comedogenic for acne-prone skin.',
      },
      {
        name: 'Manzanilla (Chamomile) Scalp Rinse',
        description: 'Chamomile tea brewed and used as a scalp rinse to soothe irritation, reduce dandruff, and add subtle highlights to lighter hair.',
        method: 'Brew strong chamomile. Cool. Pour over scalp after shampoo as final rinse. Do not rinse out.',
      },
    ],
    barbershopCulture: {
      significance: 'La peluquería (barber shop) is a cornerstone of Latino male community life. It is where neighborhood connections are maintained, politics and sports are debated, and masculinity is performed.',
      popularStyles: [
        'Mid Fade + Textured Top',
        'High Skin Fade + Curly Top (for curly-haired Latino men)',
        'Taper + Slick Back',
        'Low Fade + Comb Over',
        'Afro Fade (Afro-Latino community)',
        'Bald Fade + Line-up',
        'Natural Curls + Defined Shape',
      ],
      mustacheTradition: 'The mustache (bigote) carries deep cultural significance in many Latin American communities — from the classic Mexican mustache to the sophisticated pencil mustache of Argentine tango culture.',
    },
    beardStyles: [
      'The Patron: full thick beard, very on-trend in Latin America',
      'Candado (padlock): mustache connected to chin beard only',
      'Sombra (shadow): 3-day stubble, permanently maintained',
      'Clean shave: very sharp, requires regular maintenance',
    ],
    skinCareRoutine: {
      forHotClimate: {
        am: ['Lightweight cleanser', 'Niacinamide serum for oil control', 'SPF 30 gel moisturizer'],
        pm: ['Cleanser', 'Aloe gel (soothing)', 'Light moisturizer'],
      },
    },
  },

  'east-asian': {
    communityId: 'east-asian',
    communityName: 'East Asian',
    groomingPhilosophy: 'East Asian men\'s grooming has undergone a remarkable transformation. Traditional grooming was simple — hair, cleanliness, and minimal intervention. K-beauty and J-beauty revolutions have created an entire "skincare for men" category that East Asian men adopted first and most thoroughly. Today, a skincare routine in South Korea is normal for men of all ages. Glass skin, a non-shiny, healthy complexion, and neat, styled hair are the aesthetic goals.',
    commonConcerns: [
      'Oily T-zone and enlarged pores (common in East Asian male skin)',
      'Acne and comedones on oily skin',
      'The shift from sparse/no beard to wanting to maximize beard growth',
      'Dark circles and under-eye puffiness',
      'Finding the right gel or wax for straight, fine East Asian hair',
    ],
    traditionalPractices: [
      {
        name: 'Rice Water Hair Rinse',
        description: 'Fermented rice water used as a hair rinse for strength, shine, and scalp health.',
        method: 'Ferment rice water 24–48 hours. Strain. Apply to scalp and hair after shampoo. Leave 5–10 minutes. Rinse.',
        history: 'Used in Japan (yuki nagashi technique) and China for centuries.',
      },
      {
        name: 'Green Tea Toner',
        description: 'Strong-brewed green tea cooled and used as a daily face toner.',
        benefit: 'EGCG antioxidant reduces oxidative stress, oil production, and inflammation.',
        method: 'Brew green tea. Cool. Store in refrigerator. Apply with cotton pad after cleansing.',
      },
      {
        name: 'Camellia Oil Facial Treatment',
        description: 'Tsubaki (camellia) oil used as a facial oil treatment in Japanese grooming tradition.',
        application: '2–3 drops patted onto face after moisturizer. Seals in moisture and provides antioxidant protection.',
      },
      {
        name: 'Jade Roller Facial Massage',
        description: 'Jade roller used for lymphatic drainage and depuffing. Originally a Chinese court beauty tool, now mainstream in East Asian men\'s grooming.',
        method: 'Roll outward from center of face to hairline. Use downward motion on jawline. 5–10 minutes daily.',
      },
    ],
    kBeautyMensRoutine: {
      description: 'The Korean men\'s skincare routine (known as K-grooming) has been a global export. It is thorough, systematic, and product-driven.',
      steps: [
        {
          step: 1,
          name: 'Oil Cleanser',
          purpose: 'Remove sunscreen and sebum',
          products: ['Banila Co Clean It Zero Cleansing Balm', 'DHC Deep Cleansing Oil'],
        },
        {
          step: 2,
          name: 'Foam Cleanser',
          purpose: 'Second cleanse for thorough clean',
          products: ['COSRX Low pH Good Morning Gel Cleanser', 'Innisfree Bija Anti-Trouble Cleansing Foam'],
        },
        {
          step: 3,
          name: 'Toner',
          purpose: 'pH balance and hydration prep',
          products: ['Some By Mi AHA BHA PHA 30 Days Miracle Toner', 'KLAIRS Supple Preparation Toner'],
        },
        {
          step: 4,
          name: 'Serum / Essence',
          purpose: 'Targeted treatment (niacinamide for pores, vitamin C for brightness)',
          products: ['COSRX Advanced Snail 96 Mucin Power Essence', 'Missha Time Revolution Essence'],
        },
        {
          step: 5,
          name: 'Moisturizer',
          purpose: 'Hydration and barrier repair',
          products: ['Laneige Water Bank Blue Hyaluronic Cream', 'BELIF The True Cream'],
        },
        {
          step: 6,
          name: 'SPF (Morning Only)',
          purpose: 'UV protection',
          products: ['Biore UV Aqua Rich SPF 50+', 'ISNTREE Hyaluronic Acid Watery Sun Gel'],
        },
      ],
    },
    hairStylingGuide: {
      characteristics: 'East Asian hair is typically straight, fine, and very smooth. It holds products differently than curly or coily hair.',
      styles: ['Two-block cut (Korean)', 'Layered textured top', 'Slick back', 'Curtain bangs', 'Undercut', 'Natural medium length'],
      products: {
        forHold: ['American Crew Forming Cream', 'Gatsby Moving Rubber', 'Mandom Gatsby Hair Wax'],
        forVolume: ['Dry shampoo at roots', 'Sea salt spray', 'Mousse on damp hair'],
      },
    },
  },

  'east-african': {
    communityId: 'east-african',
    communityName: 'East African',
    groomingPhilosophy: 'East African men\'s grooming reflects a proud, traditional aesthetic. Somali, Ethiopian, Eritrean, Kenyan, and Tanzanian grooming traditions emphasize clean presentation, natural skin health, and increasingly, sophisticated beard styling. Traditional practices using castor oil, frankincense, and locally available botanicals maintain skin and hair health. Urban East African men in Nairobi, Addis Ababa, and Mogadishu have embraced international barbering trends while maintaining cultural grooming roots.',
    commonConcerns: [
      'Razor bumps from tightly coiled beard hair (very prevalent)',
      'Ashy skin from dryness in highland climates',
      'Scalp health and dandruff',
      'Finding products available locally in East African markets',
      'Hyperpigmentation from sun exposure',
    ],
    traditionalPractices: [
      {
        name: 'Castor Oil Beard and Hair Treatment',
        description: 'Castor oil — an East African traditional staple — applied to the beard and scalp for growth, moisture, and scalp health.',
        application: 'Apply to scalp and beard. Massage in. Leave 1–2 hours or overnight. Wash out thoroughly (castor oil is thick and requires proper cleansing).',
      },
      {
        name: 'Frankincense (Lubaan) Skin Treatment',
        description: 'Frankincense resin-infused oil applied to the skin for healing, anti-inflammatory, and anti-aging benefit.',
        usage: 'Mix frankincense oil with jojoba carrier oil. Apply to face and beard area as a treatment.',
        cultural: 'Frankincense is native to Somalia and the Horn of Africa. Its use in male grooming is an ancient tradition.',
      },
      {
        name: 'Coffee Scrub Exfoliation',
        description: 'Ethiopian coffee grounds mixed with a small amount of coconut oil used as a face and body scrub.',
        recipe: '1 tbsp fine coffee grounds + 1 tbsp coconut oil. Scrub face gently in circular motions. Rinse.',
        benefit: 'Caffeine reduces puffiness. Grounds exfoliate. Coconut oil moisturizes.',
      },
      {
        name: 'Shea and Neem Moisturizer',
        description: 'Shea butter combined with neem oil as an everyday body and beard moisturizer.',
        ratio: '3 parts shea : 1 part neem (diluted). Apply post-shower.',
      },
    ],
    somaliBarbershopCulture: {
      note: 'Barbers hold significant social standing in Somali communities. The xawadle (barber) is a respected tradesman.',
      popularStyles: ['Low fade', 'Skin fade', 'Razor part', 'Shaped beard', 'Short taper'],
    },
    skinCareRoutine: {
      basic: {
        am: ['Gentle cleanser', 'Aloe vera gel', 'Lightweight moisturizer with SPF 30'],
        pm: ['Cleanser', 'Castor oil on beard', 'Shea butter on body'],
      },
    },
  },

  'south-african': {
    communityId: 'south-african',
    communityName: 'South African',
    groomingPhilosophy: 'South African men\'s grooming reflects the country\'s remarkable cultural diversity. Zulu, Xhosa, Sotho, Venda, Afrikaner, Coloured, and Indian South African men each bring distinct grooming traditions. Urban South African men — particularly in Johannesburg, Cape Town, and Durban — have developed sophisticated international grooming cultures. Traditional practices using rooibos, marula oil, and baobab sit alongside international luxury products.',
    commonConcerns: [
      'Razor bumps in Black South African men',
      'Sun hyperpigmentation in all skin tones from high UV exposure',
      'Dry skin in Johannesburg\'s high-altitude climate',
      'Scalp dryness and dandruff',
      'Skincare for a range of skin tones from very pale to very deep',
    ],
    traditionalPractices: [
      {
        name: 'Marula Oil Moisturizer',
        description: 'Marula oil from the Southern African marula tree applied as a lightweight facial and body moisturizer.',
        benefit: 'Quickly absorbed, non-greasy, rich in antioxidants and omega fatty acids.',
        brand: 'African Pride, Weleda Skin Food (contains marula), local craft producers.',
      },
      {
        name: 'Rooibos Tea Toner',
        description: 'Cooled rooibos tea used as a face toner for antioxidant benefit and skin soothing.',
        method: 'Brew rooibos. Cool. Store in refrigerator. Apply to face with cotton pad after cleansing.',
      },
      {
        name: 'Umuthi (Traditional Medicine) Skin Preparations',
        description: 'Traditional Zulu and Xhosa plant-based skin preparations have long maintained men\'s skin health. Aloe ferox, devil\'s claw, and rooibos are indigenous examples with documented skin benefit.',
      },
    ],
    southAfricanBarbershopScene: {
      note: 'South Africa has a vibrant, internationally influential barber culture. Jo\'burg barbers have won international competitions.',
      popularStyles: ['Afro Fade', 'Skin Fade with Design', 'Temp Fade', 'Dread/Loc styles', 'Isi (Shaved head)', 'Shaped beard'],
    },
    skinCareRoutine: {
      minimal: {
        am: ['Gentle cleanser', 'SPF 30 moisturizer'],
        pm: ['Cleanser', 'Marula oil'],
      },
      full: {
        am: ['Rooibos cleanser', 'Vitamin C serum', 'Moisturizer', 'SPF 50'],
        pm: ['Double cleanse', 'Niacinamide serum', 'Retinol 2x/week', 'Marula oil moisturizer'],
      },
    },
  },

  'black-american': {
    communityId: 'black-american',
    communityName: 'Black American',
    groomingPhilosophy: 'Black American men\'s grooming is a cultural art form. The barbershop is an institution — a community hub, a safe space, and a place where Black masculinity is defined and expressed. The lined fade, the shaped beard, the fresh cut are powerful statements of identity, pride, and belonging. Traditional grooming using JBCO, shea butter, and edge control products are embedded in Black American beauty culture. The rise of Black-owned grooming brands (Bevel, Scotch Porter, SheaMoisture Men) has elevated the quality and cultural resonance of products for this community.',
    commonConcerns: [
      'Razor bumps (pseudofolliculitis barbae) — the defining grooming challenge',
      'Ashy skin and the need for deeply moisturizing products',
      'Ingrown hairs from tight fades and close shaves',
      'Hyperpigmentation on the neckline from chronic shaving',
      'Keloid formation from acne or ingrown hairs (genetic predisposition)',
    ],
    traditionalPractices: [
      {
        name: 'Jamaican Black Castor Oil (JBCO)',
        description: 'JBCO applied to the scalp, beard, and edges for growth, moisture, and scalp health. THE cornerstone of Black American male grooming.',
        applications: {
          scalp: 'Apply to scalp sections with dropper. Massage in. Leave overnight or wash out after 1 hour.',
          beard: 'Apply to beard roots and throughout. Use as a base for beard oil blends.',
          edges: 'Apply to edges with a toothbrush or edge brush for a smooth laid look.',
        },
      },
      {
        name: 'Shea Butter Full Body Moisture',
        description: 'Unrefined shea butter as the go-to body moisturizer for preventing ashiness.',
        tradition: 'Applied post-shower before skin dries fully. The heat from damp skin helps shea absorb rather than sit on top.',
        enhancement: 'Add a few drops of tea tree oil for antibacterial benefit around the beard area.',
      },
      {
        name: 'African Black Soap Face Wash',
        description: 'Authentic African black soap for face cleansing — treats acne, controls oil, and is traditionally made and culturally connected.',
        note: 'Use 1x daily maximum. Rinse very thoroughly. Follow with moisturizer.',
      },
      {
        name: 'Coconut Oil Hair Sealing',
        description: 'Coconut oil used to seal moisture into natural hair (twists, locs, afro).',
        locs: 'Apply coconut oil to maturing locs to prevent dryness and frizz. Dilute with water in a spray bottle for a lighter application.',
      },
    ],
    barbershopCulture: {
      significance: 'The Black barbershop is one of the most significant cultural institutions in African American life. Beyond grooming, it is a space for community, mentorship, political discourse, and healing.',
      legacyBarbers: 'Master barbers in Black communities are artists and community leaders. The craft is often passed through generations.',
      popularStyles: [
        'High Skin Fade',
        'Temp Fade + Design',
        'Flat Top (a classic)',
        'Locs / Dreads',
        'Low Fade + Curls / Waves',
        '360 Waves (requires wave cap, brush, and specific products)',
        'Afro shaped and rounded',
        'Bald / Shaved head',
      ],
      edgesAndWaves: {
        edges: 'The laid edges (baby hairs at the hairline) are an art form. Edge control products and a toothbrush or edge brush create sleek, defined baby hairs.',
        waves: '360 waves require: a wave brush (medium-hard bristle), wave grease or pomade, a du-rag/wave cap worn consistently, and daily brushing in the wave pattern.',
      },
    },
    razorBumpProtocol: {
      prevention: [
        'Bevel Safety Razor (single-blade, designed for Black men)',
        'Shave in direction of hair growth ONLY',
        'Pre-shave oil (3–5 drops applied before shave cream)',
        'Never dry shave',
        'Warm water shave or hot towel preparation',
        'Chemical exfoliation 3x/week (salicylic acid pads) to prevent dead skin trapping hairs',
      ],
      treatment: [
        'Bump Patrol Aftershave Treatment',
        'Salicylic acid applied to bumps',
        'Warm compress to draw out trapped hairs',
        'Dark spot corrector for post-bump marks',
        'Azelaic acid for redness and hyperpigmentation',
      ],
      blackOwnedSolutions: [
        'Bevel Shave System (razor, brush, cream, balm)',
        'Scotch Porter Hydrating Beard Balm',
        'SheaMoisture Men Maracuja Oil & Shea Butter Beard Balm',
        'Walker & Company Bevel Collection',
      ],
    },
    skinCareRoutine: {
      minimal: {
        am: ['Black soap or gentle cleanser', 'SPF moisturizer for deep skin'],
        pm: ['Cleanser', 'Spot treatment if needed', 'Shea butter'],
      },
      advanced: {
        am: ['Black soap cleanser', 'Vitamin C serum', 'Niacinamide', 'SPF 30+'],
        pm: ['Double cleanse', 'BHA or salicylic acid', 'Retinol 2x/week', 'Dark spot corrector', 'Shea butter'],
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL MEN'S GROOMING GUIDE
// ─────────────────────────────────────────────────────────────────────────────

export const UNIVERSAL_MENS_GROOMING = {
  skinCareBasics: {
    whyMenNeedSkincare: [
      'Men\'s skin is 20–25% thicker than women\'s but still requires care',
      'Men\'s skin produces more sebum (oil) — leading to acne and enlarged pores',
      'Daily shaving causes micro-trauma that benefits from proper care',
      'Sun protection prevents skin cancer and premature aging in all skin tones',
      'Post-shave care dramatically reduces razor bumps and irritation',
    ],
    minimumRoutine: [
      'Cleanser (1–2x daily)',
      'Moisturizer with SPF 30 in the morning',
      'Nighttime moisturizer or oil',
    ],
    powerIngredients: [
      { ingredient: 'Niacinamide', benefit: 'Pore reduction, oil control, brightening' },
      { ingredient: 'Vitamin C', benefit: 'Antioxidant, brightening, dark spot reduction' },
      { ingredient: 'Retinol', benefit: 'Anti-aging, pore refinement, acne treatment' },
      { ingredient: 'Salicylic Acid', benefit: 'Acne, razor bumps, ingrown hair prevention' },
      { ingredient: 'SPF', benefit: 'Skin cancer prevention, hyperpigmentation prevention, anti-aging' },
      { ingredient: 'Hyaluronic Acid', benefit: 'Hydration, plumping' },
    ],
  },

  shavinGGuide: {
    universalBestPractices: [
      'Never dry shave — always with water or shave cream',
      'Shave after shower when hairs are softer',
      'Shave with the grain first (with the direction of hair growth)',
      'Rinse blade after every 2–3 strokes',
      'Replace blade when it tugs or pulls',
      'Apply post-shave product immediately (aloe, aftershave balm, or treatment)',
    ],
    forTightlyCoiledHair: [
      'Single-blade razor ONLY',
      'With the grain ONLY — never against',
      'Or use a clipper with a guard for a close but above-skin cut',
      'Chemical exfoliation 3x/week to prevent ingrown hairs',
      'Post-shave bump treatment (salicylic acid or bump patrol)',
    ],
  },

  beardGroomingUniversal: {
    growingPhase: [
      'Patience — beard growth is largely genetic',
      'Minoxidil (off-label) has some evidence for increasing beard density',
      'Biotin supplement may support hair growth',
      'Adequate sleep and reduced stress support growth',
    ],
    maintenancePhase: [
      'Wash beard 3–4x per week with beard wash (not regular shampoo — too harsh)',
      'Apply beard oil daily after washing',
      'Comb or brush daily to prevent tangles and train direction of growth',
      'Shape and line at barbershop every 2–3 weeks',
      'Trim at home with clippers and a guard to maintain length',
    ],
    beardOilEssentials: {
      baseOils: ['Jojoba oil (best beard carrier oil)', 'Argan oil', 'Sweet almond oil', 'Grapeseed oil'],
      essentialOilAdds: ['Cedarwood (masculine scent + mild growth support)', 'Tea tree (antibacterial)', 'Peppermint (stimulates follicles)', 'Sandalwood (rich, calming scent)'],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function getMensGroomingGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_MENS_GROOMING_GUIDES['west-african'],
    'south-asian': ETHNIC_MENS_GROOMING_GUIDES['south-asian'],
    'caribbean': ETHNIC_MENS_GROOMING_GUIDES['caribbean'],
    'arab': ETHNIC_MENS_GROOMING_GUIDES['arab'],
    'latina': ETHNIC_MENS_GROOMING_GUIDES['latina'],
    'east-asian': ETHNIC_MENS_GROOMING_GUIDES['east-asian'],
    'east-african': ETHNIC_MENS_GROOMING_GUIDES['east-african'],
    'south-african': ETHNIC_MENS_GROOMING_GUIDES['south-african'],
    'black-american': ETHNIC_MENS_GROOMING_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

export const MENS_GROOMING_STATS = {
  moduleId: 'mens_grooming_ethnic_guide',
  communitiesCovered: 9,
  traditionalPracticesCovered: 33,
  groomingStylesCovered: 52,
  version: '1.0.0',
};
