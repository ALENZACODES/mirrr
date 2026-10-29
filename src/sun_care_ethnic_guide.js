/**
 * MIRRR — Sun Care Ethnic Guide
 * Sun protection, UV damage treatment, and sunscreen guidance tailored to
 * all 9 ethnic communities. Addresses the unique SPF needs of melanin-rich skin
 * and counters the harmful myth that "Black people don't need sunscreen."
 */

export const ETHNIC_SUN_CARE_GUIDES = {
  'west-african': {
    communityId: 'west-african',
    communityName: 'West African',
    sunCarePhilosophy: 'West African sun care is about protection, evenness, and health — not about avoiding the sun. The sun is part of life in West Africa, and generations of traditional wisdom created protective practices long before SPF existed. Today, combining traditional botanical protectants with modern SPF science is the optimal approach for West African skin.',
    uvExposureContext: {
      geography: 'West Africa lies between 5°N and 20°N latitude — receiving intense UV radiation year-round, with UV Index often exceeding 10–12 in summer months (extreme).',
      outdoorLifestyle: 'Agricultural, market-based, and outdoor community life means high lifetime UV exposure is common.',
      traditionVsModern: 'Traditional sun protection (shade, clothing, plant-based oils) was highly effective. Modern mineral and chemical SPF adds another layer of protection.',
    },
    commonConcerns: [
      'Hyperpigmentation from sun exposure on dark skin tones',
      'Uneven skin tone and post-inflammatory dark spots worsened by sun',
      'Melasma (chloasma) — sun-triggered or worsened by UV',
      'The myth that dark skin doesn\'t need sunscreen is harmful and false',
      'White cast from traditional chemical sunscreens not formulated for deep skin',
    ],
    traditionalSunProtection: [
      {
        name: 'Shea Butter Natural SPF',
        description: 'Unrefined shea butter has a natural SPF estimated at 6–10. While far too low for full sun protection, it represents the understanding that oils provide some UV protection.',
        modernContext: 'Shea butter alone is NOT adequate sun protection. Use as a moisturizer under a proper SPF 30+ formula.',
        history: 'West African women historically applied shea butter before outdoor work and market activities — providing very modest but real UV protection.',
      },
      {
        name: 'Clothing and Shade Culture',
        description: 'Traditional West African sun protection was behavioral and cultural: head wraps (gele, duku), wrappers that covered limbs, and seeking shade during peak hours (12–4 PM).',
        modernWisdom: 'These traditional practices are scientifically sound. UV-protective clothing (UPF 50+) and shade-seeking remain the most effective sun protection measures available.',
      },
      {
        name: 'Palm Oil Traditional Use',
        description: 'Palm oil has been used as a skin protectant in West Africa. It has antioxidant properties (lycopene, beta-carotene) that may provide some protection against UV-induced oxidative stress, though it is not a UV filter.',
        modernContext: 'Do not rely on palm oil for sun protection. It is a cultural beauty ingredient, not a sunscreen.',
      },
    ],
    spfGuideForDeepSkin: {
      whySpfMatter: [
        'Dark skin CAN and DOES get sunburned — it just happens less visibly and less often',
        'UV damage to melanin-rich skin causes hyperpigmentation that is difficult to treat',
        'Skin cancer rates in Black communities are lower but outcomes are worse due to delayed diagnosis',
        'UV accelerates ALL of the aging signs visible in dark skin: uneven tone, spots, texture',
        'Existing hyperpigmentation and dark spots worsen dramatically without SPF protection',
      ],
      spfRecommendation: 'SPF 30 minimum daily; SPF 50 for outdoor activities or when avoiding hyperpigmentation worsening is a priority.',
      avoidingWhiteCast: {
        problem: 'Mineral (zinc oxide, titanium dioxide) sunscreens leave a white or greyish cast on dark skin, making them cosmetically unacceptable for daily use.',
        solutions: [
          'Look for tinted mineral sunscreens formulated for medium to deep skin tones',
          'Chemical sunscreens (avobenzone, octinoxate, Helioplex) are usually invisible on dark skin',
          'Hybrid formulas (mineral + chemical) balance protection with cosmetic finish',
          'Iron oxide in tinted formulas also protects against visible light, which worsens melasma',
        ],
        topPicksForDeepSkin: [
          'Black Girl Sunscreen (SPF 30, clear formula)',
          'EltaMD UV Clear Broad-Spectrum SPF 46',
          'La Roche-Posay Anthelios Tinted SPF 50 (deeper tints)',
          'Supergoop Unseen Sunscreen (totally clear)',
          'Fenty Beauty Pro Filt\'r Soft Matte Longwear Foundation SPF 15 (not adequate alone)',
        ],
      },
    },
    hyperpigmentationFromSun: {
      prevention: [
        'Daily SPF — most critical intervention',
        'Avoid sun during peak hours (10 AM–4 PM)',
        'Antioxidant serum (vitamin C) in the morning before SPF',
        'Wear a hat with a 3"+ brim outdoors',
      ],
      treatment: [
        'Vitamin C serum morning (inhibits melanin production)',
        'Niacinamide (reduces melanin transfer to surface cells)',
        'Azelaic acid (brightens and reduces inflammation)',
        'Glycolic acid or lactic acid exfoliation 2–3x per week',
        'Retinol/retinoid at night (accelerates cell turnover)',
      ],
    },
  },

  'south-asian': {
    communityId: 'south-asian',
    communityName: 'South Asian',
    sunCarePhilosophy: 'South Asian sun care culture has been shaped by the complex intersection of Ayurvedic wisdom, colorism (the harmful societal preference for lighter skin), and the reality of high UV environments. Modern South Asian sun care must separate the problematic colorist motivations for "fairness" from the legitimate skin health reasons for UV protection. Healthy skin — protected, even-toned, and radiant — is the goal, not lightening.',
    uvExposureContext: {
      geography: 'India spans 8°N to 37°N. Southern India receives extreme UV (UV Index 12+). Northern India receives 8–10 during summer.',
      diaspora: 'South Asian diaspora in the UK, Canada, and USA often have vitamin D deficiency from insufficient sun exposure — the opposite problem to tropical homeland.',
      colorismNote: 'The South Asian beauty market has long been dominated by "fairness cream" marketing, promoting skin lightening for social advantage. This is harmful colorism. We celebrate and protect all South Asian skin tones equally.',
    },
    commonConcerns: [
      'Melasma — one of the most common skin concerns in South Asian skin',
      'Post-inflammatory hyperpigmentation from acne that worsens with sun exposure',
      'Uneven skin tone across sun-exposed vs. protected areas',
      'Tanning that leads to dissatisfaction driven by harmful colorist standards',
      'Vitamin D deficiency in diaspora communities from under-sun-exposure',
    ],
    traditionalSunProtection: [
      {
        name: 'Sandalwood Paste',
        description: 'Sandalwood (chandan) paste applied to the face and body has traditional use in Ayurveda as a cooling, UV-ameliorating preparation.',
        modernContext: 'Sandalwood has documented anti-inflammatory and antioxidant properties, but no meaningful SPF. Use as a complementary treatment, not primary sun protection.',
      },
      {
        name: 'Turmeric (Haldi) Skin Protection',
        description: 'Turmeric mixed with milk or curd applied to skin before outdoor exposure. Curcumin has antioxidant properties that may reduce UV-induced damage at a cellular level.',
        modernContext: 'Turmeric is an adjunct — not a sunscreen. But curcumin\'s antioxidant activity genuinely protects against UV-induced free radical damage. Use alongside SPF.',
        topicalResearch: 'Some studies show curcumin can inhibit UV-induced inflammation when applied topically. More research needed.',
      },
      {
        name: 'Full Coverage Clothing',
        description: 'Traditional South Asian clothing — sarees, salwar kameez with dupattas — provides excellent UV coverage of the body. Head coverings (pallu, dupatta draped over head) protect the scalp and face.',
        modernAdaptation: 'UPF-rated clothing for outdoor sports and activities. A sun-protective dupatta as a fashion choice.',
      },
      {
        name: 'Coconut Oil UV Partial Protection',
        description: 'Virgin coconut oil has an estimated natural SPF of 4–6 — primarily because of its UV-absorbing fatty acid profile.',
        modernContext: 'Not adequate sun protection alone. Use as a moisturizer under SPF, not instead of it.',
      },
    ],
    spfGuideForOliveToDeepSkin: {
      skinToneTypes: [
        {
          type: 'Fair South Asian (Fitzpatrick II–III)',
          characteristics: 'Burns easily, tans moderately',
          spfNeeds: 'SPF 50+ daily; reapply every 2 hours outdoors',
          concerns: 'Sunburn visible, melasma risk high, photoaging accumulates',
        },
        {
          type: 'Medium Olive (Fitzpatrick III–IV)',
          characteristics: 'Burns minimally, tans easily and deeply',
          spfNeeds: 'SPF 30–50 daily',
          concerns: 'Melasma, uneven tan lines, hyperpigmentation from inflammation',
        },
        {
          type: 'Deep Brown (Fitzpatrick V)',
          characteristics: 'Rarely burns, tans very deeply',
          spfNeeds: 'SPF 30 daily for skin health',
          concerns: 'Post-inflammatory hyperpigmentation, skin cancer less common but exists',
        },
      ],
      melasmaProtocol: {
        importance: 'Melasma (triggered by UV, hormones, and heat) is extremely common in South Asian women. SPF is THE most critical treatment — without it, all other treatments fail.',
        protocol: [
          'SPF 50+ with iron oxide (blocks visible light which also triggers melasma)',
          'Reapply every 2 hours in sun',
          'Niacinamide and vitamin C serum combination',
          'Azelaic acid (prescription 15–20%) for active melasma',
          'Avoid heat-generating activities during melasma flares',
          'Consult dermatologist for tranexamic acid or chemical peels',
        ],
      },
    },
    ayurvedicSunProtection: {
      description: 'A modern Ayurvedic sun care protocol combining traditional wisdom with contemporary SPF science.',
      routine: {
        morning: [
          'Warm water with lemon to alkalinize body — antioxidant support',
          'Abhyanga (self-massage) with sesame oil — sesame has natural UV-absorbing properties (SPF ~4) and antioxidants',
          'Wash off sesame oil',
          'Vitamin C serum application',
          'Tinted mineral SPF 50+ with iron oxide (for visible light protection)',
          'Wear cotton or linen clothing for natural UV protection',
        ],
        evening: [
          'Double cleanse to remove SPF thoroughly',
          'Turmeric + neem toner (anti-inflammatory)',
          'Retinoid or vitamin A treatment (accelerates turnover of UV-damaged cells)',
          'Moisturizer with centella asiatica for skin repair',
        ],
      },
    },
  },

  'caribbean': {
    communityId: 'caribbean',
    communityName: 'Caribbean',
    sunCarePhilosophy: 'In the Caribbean, the sun is a constant companion — and the relationship is complex. Island life means beach days, outdoor community gathering, farming, and celebration under the sun. Caribbean sun care wisdom has historically been expressed through shade-seeking during peak hours and botanical after-sun care. Modern Caribbean beauty culture increasingly embraces SPF as a skin health essential, particularly as skin cancer awareness grows in the community.',
    uvExposureContext: {
      geography: 'Caribbean islands sit between 10°N and 25°N latitude. UV Index frequently reaches 11–12 (extreme) year-round. There is no "safe" season in the Caribbean.',
      skinToneRange: 'Caribbean communities span the full melanin spectrum, from very fair (Cuba, Puerto Rico) to very deep (Trinidad, Jamaica). Sun care needs vary accordingly.',
    },
    commonConcerns: [
      'Sun-related hyperpigmentation from high lifetime UV exposure',
      'Post-inflammatory dark spots that worsen visibly after sun exposure',
      'Premature skin aging from decades of unprotected sun exposure',
      'Upper lip darkening from UV combined with heat hair removal',
      'Skin cancer — awareness is growing but remains underprioritized in darker Caribbean communities',
    ],
    traditionalSunProtection: [
      {
        name: 'Aloe Vera After-Sun',
        description: 'Fresh aloe vera (endemic to Caribbean landscapes) applied after sun exposure to cool, hydrate, and heal. The single most widely used Caribbean sun remedy.',
        method: 'Cut a fresh aloe leaf. Refrigerate for 30 minutes. Apply the cool gel to sun-exposed skin. Leave on.',
        benefit: 'Aloe\'s acemannan polysaccharide reduces UV-induced inflammation. Dramatically reduces the visible and felt impact of sunburn.',
        science: 'Multiple studies confirm aloe vera\'s efficacy as an after-sun treatment for UV-induced burns and inflammation.',
      },
      {
        name: 'Coconut Oil After-Sun Treatment',
        description: 'Pure coconut oil applied after sun exposure for moisturizing and reducing the peeling effect of mild sunburn.',
        caution: 'Do not apply coconut oil to actively burned or blistered skin — it can trap heat and worsen inflammation. Use only after the heat has subsided.',
        method: 'After skin has cooled and redness has reduced, apply a thin layer of coconut oil to sun-exposed areas.',
      },
      {
        name: 'Cooling Cucumber Compress',
        description: 'Chilled cucumber slices or cucumber juice applied to sun-exposed, overheated skin for immediate cooling.',
      },
      {
        name: 'Turmeric and Coconut After-Sun Mask',
        description: 'A Caribbean version of the turmeric treatment — mixed with coconut milk and applied to sun-damaged or hyperpigmented areas.',
        recipe: '1 tbsp turmeric + 3 tbsp coconut milk. Apply to affected areas. Leave 15 minutes. Rinse.',
      },
    ],
    beachBeautySpfRoutine: {
      morningPreBeach: [
        'Apply water-resistant SPF 50 to face and body 20–30 minutes BEFORE going outdoors',
        'Don\'t forget ears, back of neck, back of hands, and feet',
        'Lip SPF (lips burn and develop cancer too)',
        'UV-protective sunglasses (UVA + UVB blocking)',
      ],
      atBeach: [
        'Reapply SPF every 2 hours or after swimming',
        'Use water-resistant formula rated for 80 minutes of water resistance',
        'Reapply after towel drying — towels wipe off SPF',
        'Seek shade 12 PM – 3 PM when UV is most intense',
        'Wide-brimmed hat (3"+ brim) for face protection',
      ],
      afterBeach: [
        'Rinse with cool water to remove salt and sunscreen',
        'Apply aloe vera while skin is still damp',
        'Vitamin C serum to neutralize free radicals from UV exposure',
        'Deeply moisturize with a fragrance-free lotion or oil',
        'Check for unusual spots or skin changes — know your skin',
      ],
    },
  },

  'arab': {
    communityId: 'arab',
    communityName: 'Arab Middle Eastern',
    sunCarePhilosophy: 'Arab sun care has a long history dictated by the extreme desert climates of the region. Traditional desert dwellers developed sophisticated behavioral, clothing-based, and botanical sun protection strategies. Today, modern Arab women in urban centers have embraced SPF culture, while traditional methods remain valued. The key sun concerns are melasma (very prevalent), hyperpigmentation, and the unique challenges of sun exposure under modest dress codes.',
    uvExposureContext: {
      geography: 'Much of the Arab world sits at 15°N to 35°N. Saudi Arabia, UAE, and Egypt have UV Index 10–12 (very high to extreme) for most of the year.',
      modestDressing: 'Traditional modest clothing (abaya, hijab) provides significant UV protection for covered areas. However, the face — the main visible area — often receives the highest cumulative UV dose.',
    },
    commonConcerns: [
      'Melasma — extremely common in Arab women; UV-triggered and/or hormonally triggered',
      'Hyperpigmentation from acne, waxing, and threading that worsens in sun',
      'Face-focused UV damage since body is often covered',
      'Photosensitivity from topical skincare actives (retinol, AHAs, vitamin C)',
      'SPF pilling under makeup or messing up a full-coverage base',
    ],
    traditionalSunProtection: [
      {
        name: 'Niqab and Face Veil as Sun Protection',
        description: 'For women who wear face veils, this provides extraordinary UV protection for the face. Facial hyperpigmentation and melasma can be improved by consistent facial veil use.',
        note: 'A face veil in a sheer or thin fabric still blocks significant UV. UV-protective fabric (UPF 50+) maximizes this protection.',
      },
      {
        name: 'Argan Oil Antioxidant Protection',
        description: 'Argan oil applied before sun exposure provides antioxidant protection against UV-induced free radical damage.',
        modernContext: 'Argan oil has documented antioxidant and anti-UV-damage properties, but not measurable SPF. Use as a serum under SPF, not instead of it.',
      },
      {
        name: 'Rosewater Sun Calming Mist',
        description: 'Cold rosewater misted onto sun-exposed skin for immediate cooling and anti-inflammatory effect.',
        method: 'Refrigerate rose water. Mist on skin immediately after sun exposure. Leave on (don\'t rinse).',
      },
      {
        name: 'Hammam Steam for Sun Recovery',
        description: 'A hammam session after extended sun exposure helps to remove surface dead cells and bring fresh, hydrated skin to the surface.',
        modernCaution: 'If skin is sunburned, wait until burn has resolved before steam or heat exposure.',
      },
    ],
    spfUnderMakeupGuide: {
      challenge: 'Arab beauty culture often involves a full-coverage, long-wearing base. Getting SPF into this routine without causing pilling or reducing coverage is the main challenge.',
      solutions: [
        'Apply SPF 30–50 as the LAST skincare step and first base step — let it absorb 5 minutes before foundation',
        'Use a foundation with built-in SPF (note: foundation SPF is not applied in adequate quantity to be the sole sun protection)',
        'Setting sprays with SPF can be applied over a full face of makeup for SPF boost',
        'Seek powder SPF for touch-up reapplication throughout the day over makeup',
        'Opt for chemical sunscreen formulas (not mineral) which are more compatible with full-coverage base',
      ],
      recommendations: [
        'La Roche-Posay Anthelios Comfort Cream SPF 50 (under foundation)',
        'Supergoop Unseen Sunscreen SPF 40 (primer-like texture, zero white cast)',
        'Colorescience Sunforgettable Total Protection Brush-On SPF 50 (powder — for over-makeup)',
        'ILIA Super Serum Skin Tint SPF 40 (tinted, serum, and SPF in one)',
      ],
    },
    melasmaProtocol: {
      prevalence: 'Melasma is extremely prevalent in Middle Eastern skin. Often called "the mask of pregnancy" but also triggered by UV, heat, and hormonal birth control.',
      protocol: [
        'SPF 50+ daily WITHOUT EXCEPTION — this is non-negotiable for melasma management',
        'Tinted SPF with iron oxide (blocks visible light, which also triggers melasma)',
        'Avoid heat-generating activities (hot showers, sauna, steam) during active flares',
        'Tranexamic acid (topical or oral with physician oversight) — evidence-based melasma treatment',
        'Vitamin C and niacinamide combination serum',
        'Azelaic acid (15–20% prescription strength) for active patches',
        'Chemical peels under dermatologist supervision (very carefully — risk of PIH)',
        'Avoid prescription hydroquinone without dermatologist supervision',
      ],
    },
  },

  'latina': {
    communityId: 'latina',
    communityName: 'Latina',
    sunCarePhilosophy: 'Latina sun care spans an enormous range of skin tones and geographic UV environments — from the temperate highlands of Mexico City to the tropical coast of Brazil. Traditional Latina beauty culture has mixed relationships with sun: bronzed, golden skin (from outdoor life) is often celebrated, while hyperpigmentation is not. Modern Latina beauty culture increasingly embraces SPF as essential for maintaining even, healthy skin without sacrificing the warm, sun-kissed glow.',
    uvExposureContext: {
      geographicRange: 'Latin America spans from Mexico (UV 10–12) to southern Argentina (UV 3–5). Caribbean-located countries (Cuba, Puerto Rico, Dominican Republic) have extreme UV year-round.',
      outdoorCulture: 'Outdoor festivals, beach vacations, outdoor markets, and active outdoor lifestyles mean high lifetime UV exposure across the community.',
      bronzeGlowDesire: 'A sun-kissed bronze glow is often culturally desired in Latin American beauty. SPF-use is sometimes resisted out of a desire to tan freely. Safe tanning practices and self-tanner alternatives are important discussions.',
    },
    commonConcerns: [
      'Melasma (very common in Latina women — sometimes called "the Latina curse")',
      'Post-inflammatory hyperpigmentation from acne worsening with UV',
      'Uneven skin tone from outdoor lifestyle without consistent SPF use',
      'Sun-triggered flare-ups of existing hyperpigmentation',
      'Vitamin D deficiency in high-altitude inland cities (limited direct sunlight)',
    ],
    traditionalSunProtection: [
      {
        name: 'Aloe (Sábila) After-Sun',
        description: 'Aloe vera (sábila in Spanish) is the quintessential Latin American after-sun treatment. Found in virtually every home, garden, and farmacia across Latin America.',
        method: 'Scrape gel from a fresh aloe leaf. Apply to sun-exposed skin. The cooling sensation is immediate.',
        enhancement: 'Blend aloe gel with a small amount of coconut oil and store in the refrigerator for an ultra-cooling after-sun lotion.',
      },
      {
        name: 'Cucumber Water Mist',
        description: 'Blended cucumber strained and used as a cooling mist for overheated, sun-exposed skin.',
        recipe: 'Blend 1 cucumber with 1 cup water. Strain thoroughly. Pour into a spray bottle. Refrigerate. Mist as needed.',
      },
      {
        name: 'Coconut Oil and Lime Skin Treatment',
        description: 'Coconut oil (aceite de coco) mixed with a small amount of lime juice used as a traditional after-sun skin brightener.',
        caution: 'Lime juice can cause phytophotodermatitis (photosensitive blistering) if applied then exposed to sun. Use only in the evening, as an after-sun treatment.',
        modernContext: 'Lime juice is NOT a brightener for use in sunlight — it causes photosensitivity burns. This is an after-sun, indoor-only treatment.',
      },
    ],
    latinaMelasmaGuide: {
      prevalence: 'Melasma affects an estimated 8–35% of Latina women, making it one of the most pressing skin concerns in the community.',
      triggers: ['UV exposure (primary trigger)', 'Oral contraceptives', 'Pregnancy', 'IUD hormones in some cases', 'Heat'],
      management: {
        sunProtection: 'SPF 50+ with iron oxide (iron oxide pigments block visible light, which is a melasma trigger alongside UV)',
        topicalTreatments: [
          'Tranexamic acid — growing evidence base, well-tolerated by Latina skin',
          'Niacinamide 10% — gentle and effective',
          'Vitamin C serum (L-ascorbic acid or ascorbyl glucoside)',
          'Kojic acid at 1–2% concentration',
          'Azelaic acid — prescription-strength 15–20%',
        ],
        professionalTreatments: [
          'Superficial chemical peels (lactic acid, mandelic acid — gentle)',
          'Laser treatment — must be done by an experienced practitioner familiar with Latina skin to avoid PIH',
        ],
        avoidWithMelasma: ['Hydroquinone without dermatologist supervision (risk of ochronosis with long-term use)', 'Aggressive laser treatments', 'Bikini waxing under UV (inflammation triggers melasma)'],
      },
    },
    safeBronzeGuide: {
      philosophy: 'Want a sun-kissed glow without UV damage? These approaches give a warm, bronzed look safely.',
      methods: [
        {
          method: 'Self-Tanner',
          description: 'DHA-based self-tanner creates a realistic tan without UV. Modern formulas are streak-free and appropriate for olive to deep skin tones.',
          topPicks: ['Bondi Sands Self Tanning Foam', 'St. Tropez Self Tan Classic Bronzing Mousse (deep shade)', 'Isle of Paradise Self-Tanning Drops'],
          application: 'Exfoliate first. Apply in upward strokes. Wash hands immediately. Allow to dry fully before dressing.',
        },
        {
          method: 'Bronzer Makeup',
          description: 'Powder or cream bronzer applied strategically for an immediate sun-kissed glow that washes off.',
          technique: 'Apply where the sun would naturally hit: forehead, temples, nose bridge, cheeks, chin. Use a fluffy brush with light hand.',
          topPicks: ['NARS Laguna Bronzer', 'Fenty Beauty Cheeks Out Bronzer', 'Charlotte Tilbury Filmstar Bronze and Glow'],
        },
        {
          method: 'SPF-Protected Limited Sun',
          description: 'For those who want some natural color, morning or late-afternoon sun (before 10 AM or after 4 PM) with SPF 30 applied is the lowest-risk approach.',
          reminder: 'There is no safe amount of UV exposure that doesn\'t cause some DNA damage. But lower UV periods minimize cumulative risk.',
        },
      ],
    },
  },

  'east-asian': {
    communityId: 'east-asian',
    communityName: 'East Asian',
    sunCarePhilosophy: 'East Asian sun care culture is the most sophisticated and consistently practiced in the world. Japanese, Korean, and Chinese beauty cultures have elevated sun protection to a form of daily skincare ritual — with some of the highest-rated, most cosmetically elegant sunscreen formulas coming from these markets. The cultural aspiration for "glass skin" (luminous, even, translucent) makes sun protection essential, as UV damage is the primary driver of uneven tone and texture.',
    uvExposureContext: {
      geography: 'Japan, Korea, and coastal China receive moderate to high UV. East Asian consumers have led sun protection innovation globally for decades.',
      culturalValue: 'In East Asian beauty culture, fair, even, luminous skin has historically been prized — driving consistent, meticulous sun protection practices across generations.',
    },
    commonConcerns: [
      'Photoaging — fine lines and uneven texture from cumulative UV',
      'Post-inflammatory hyperpigmentation from acne worsened by UV',
      'Uneven skin tone from intermittent sun protection',
      'White cast from some mineral formulas',
      'Melasma (less common than in South Asian or Latina skin but does occur)',
    ],
    traditionalSunProtection: [
      {
        name: 'Umbrella and Hat Culture',
        description: 'The use of parasols (hi-gasa in Japan) for sun protection is a centuries-old practice in East Asian cultures. Women historically carried parasols to protect skin from sun exposure during outdoor activities.',
        modernVersion: 'UV-blocking umbrellas (UPF 50+) are still widely used in Japan and Korea today. Available in collapsible, travel-friendly versions.',
      },
      {
        name: 'Full-Coverage Clothing',
        description: 'Long sleeves, high necklines, and full leg coverage for outdoor activities. Arm sleeves (arm covers) are especially popular in Korea and Japan for driving and outdoor exercise.',
        modernAdaptation: 'UV-protective arm sleeves, gloves, and face-covering sun visors are mainstream beauty accessories in East Asian markets.',
      },
      {
        name: 'Green Tea Antioxidant Protection',
        description: 'Green tea (ocha in Japan, nok-cha in Korea) consumed abundantly and applied topically for antioxidant UV protection.',
        evidence: 'EGCG in green tea has multiple documented anti-UV mechanisms: DNA repair support, anti-inflammatory effect, and antioxidant free-radical neutralization.',
        topicalUse: 'Green tea extract in toners, essences, and moisturizers. Look for products with "Camellia sinensis" in the ingredients list.',
      },
      {
        name: 'Rice Bran Oil Traditional Use',
        description: 'Rice bran oil (komenuka in Japan) used topically has natural antioxidants and some UV-stabilizing properties. Used in traditional Japanese cosmetics.',
      },
    ],
    eastAsianSunscreenInnovation: {
      note: 'East Asian sunscreen formulas are widely regarded as the gold standard for cosmetic elegance, innovation, and high SPF efficacy.',
      innovativeFormats: [
        {
          format: 'Essence Sunscreen',
          description: 'Watery, serum-like texture with SPF 50. Absorbs like water, leaves no residue.',
          examples: ['Biore UV Aqua Rich Watery Essence SPF 50+ PA++++', 'Round Lab Birch Juice Moisturizing Sunscreen'],
        },
        {
          format: 'Cushion SPF',
          description: 'SPF in a cushion compact format — easy to apply and reapply over makeup.',
          examples: ['IOPE Air Cushion SPF 50+', 'Laneige Neo Cushion'],
        },
        {
          format: 'Sunscreen Stick',
          description: 'Solid SPF stick for on-the-go application and reapplication over makeup.',
          examples: ['Missha All Around Safe Block SPF50+ PA++++', 'Round Lab Dokdo Sunstick'],
        },
        {
          format: 'Setting Spray with SPF',
          description: 'Setting spray that provides SPF protection when applied over makeup.',
          examples: ['Isntree Hyaluronic Acid Watery Sun Gel', 'COSRX Shield Fit All Green Comfort Sun SPF 50+'],
        },
      ],
      paRating: {
        explanation: 'East Asian sunscreens use the PA rating system for UVA protection: PA+ (some), PA++ (moderate), PA+++ (high), PA++++ (extremely high). Look for PA++++ for comprehensive UVA coverage.',
        spfVsPa: 'SPF measures UVB protection (burning). PA measures UVA protection (aging). Both matter — look for broad-spectrum (SPF 50+ and PA++++) for full coverage.',
      },
    },
    layeredProtectionSystem: {
      description: 'The East Asian approach to sun protection is layered:',
      layers: [
        'Internal antioxidant support (green tea, vitamin C, astaxanthin supplements)',
        'Topical antioxidant serum (vitamin C, niacinamide, resveratrol)',
        'Sunscreen as the final skincare step',
        'Physical blocks (umbrella, hat, arm sleeves, sun visor)',
        'Reapplication with cushion or stick midday',
        'After-sun vitamin C sheet mask to treat any oxidative stress from UV exposure',
      ],
    },
  },

  'east-african': {
    communityId: 'east-african',
    communityName: 'East African',
    sunCarePhilosophy: 'East African sun care is about managing the paradox of living under intense equatorial UV while having skin tones that — though deeply protective through melanin — still require protection. The equatorial sun in Kenya, Ethiopia, Somalia, and Tanzania is unrelenting. Traditional practices have long incorporated shade-seeking, oil treatments, and aromatic resins for skin protection. Modern East African beauty culture increasingly incorporates SPF, particularly in urban communities.',
    uvExposureContext: {
      geography: 'East Africa spans approximately 15°N to 15°S. The equatorial belt (Kenya, Tanzania, Uganda) receives extreme UV (Index 12+) year-round. Ethiopia\'s highlands reduce UV slightly but it remains high.',
      melaninProtection: 'Deep East African skin tones have Fitzpatrick V–VI characteristics — higher melanin provides significant natural UV protection (equivalent to approximately SPF 13), but this is NOT adequate protection for full UV damage prevention.',
    },
    commonConcerns: [
      'Hyperpigmentation from sun on melanin-rich skin',
      'Dark spots that take months to fade without UV protection',
      'Skin cancer — lower rate than in pale skin but East African populations have delayed diagnosis rates',
      'Reluctance to use sunscreen due to white cast from mineral formulas',
      'Lack of SPF products formulated for deep skin tones in some East African markets',
    ],
    traditionalSunProtection: [
      {
        name: 'Shea Butter Natural Protection',
        description: 'Shea butter applied before outdoor activities provides modest UV protection (estimated SPF 6–10) and antioxidant protection against UV-induced oxidative stress.',
        modernContext: 'Use as a moisturizer base under SPF 30+ — not as a standalone sun protection strategy.',
      },
      {
        name: 'Frankincense (Lubaan) Resin',
        description: 'Frankincense resin from Somali boswellia trees has documented anti-inflammatory properties and has been used to protect skin in the harsh Somali desert climate.',
        application: 'Frankincense-infused oils applied to exposed skin. Used in combination with behavioral protection (shade, clothing).',
      },
      {
        name: 'Full Clothing Coverage',
        description: 'Traditional East African clothing — kangas, buibui, dirac — covers the body extensively. In Muslim East African communities, modest dress provides significant UV protection for covered areas.',
        modernAdaptation: 'UPF-rated fabrics for sports and outdoor activities. Lightweight, breathable fabrics that provide UV protection.',
      },
      {
        name: 'Castor Oil After-Sun Treatment',
        description: 'Castor oil applied to sun-exposed skin for moisturizing and supporting skin recovery after intense UV exposure.',
        method: 'Apply castor oil to skin after sun exposure and cleansing. The ricinoleic acid reduces inflammation.',
      },
    ],
    spfForDeepEastAfricanSkin: {
      whyCare: [
        'Even Fitzpatrick V–VI skin experiences UV-induced hyperpigmentation',
        'Post-inflammatory dark spots visible on all skin tones are worsened by UV',
        'Skin cancer, though less common, has higher mortality in darker skin due to delayed diagnosis',
        'Eye and lip UV damage occurs on all skin tones',
      ],
      recommendation: 'SPF 30 minimum daily. SPF 50 for beach, outdoor sport, or when managing hyperpigmentation.',
      avoidingWhiteCastOnDeepSkin: [
        'Choose chemical sunscreen formulas (avobenzone, octinoxate) — no white cast',
        'Tinted mineral formulas if you prefer mineral filters',
        'Black Girl Sunscreen (crystal-clear formula)',
        'Supergoop Unseen Sunscreen SPF 40 (invisible)',
        'Australian Gold Botanical SPF 50 Tinted Face Sunscreen',
      ],
    },
  },

  'south-african': {
    communityId: 'south-african',
    communityName: 'South African',
    sunCarePhilosophy: 'South Africa has one of the highest rates of skin cancer in the world — for white and light-skinned South Africans. But for Black South Africans, skin cancer awareness has historically been lower, and sun protection culture has been slower to develop. Today, South African dermatologists and beauty influencers are increasingly making sun protection relevant for all South African skin tones. Indigenous ingredients (rooibos, marula, baobab) are emerging as powerful antioxidant complements to modern SPF.',
    uvExposureContext: {
      geography: 'South Africa spans 22°S to 35°S. Johannesburg at altitude has extreme UV. Cape Town has high UV in summer (October–March). Durban is coastal and tropical.',
      skinCancerContext: 'South Africa has one of the world\'s highest malignant melanoma rates, primarily in the white Afrikaner and English-descent community. Black South Africans have significantly lower rates but should not be complacent.',
      melaninAndUV: 'Black South African skin has significant natural melanin protection but still accumulates UV damage over time — particularly in the form of hyperpigmentation and photoaging.',
    },
    commonConcerns: [
      'Hyperpigmentation from sun exposure',
      'Melasma (common in Coloured and mixed-race South African women)',
      'Skin cancer (primarily in fair-skinned communities)',
      'Post-inflammatory hyperpigmentation worsened by UV',
      'White cast from mineral sunscreens on deep skin',
    ],
    traditionalSunProtection: [
      {
        name: 'Marula Oil Antioxidant Protection',
        description: 'Marula oil is native to Southern Africa and has been used by Swati, Zulu, and Tsonga communities for skin and hair protection. Its antioxidant properties protect against UV-induced free radical damage.',
        modernContext: 'No measurable SPF in marula oil, but its antioxidant activity complements SPF. Apply as a serum layer under sunscreen.',
        brand: 'Weleda, African Botanics, and African Pride all produce marula oil from Southern African sources.',
      },
      {
        name: 'Rooibos Antioxidant Protection',
        description: 'Rooibos (indigenous to the Western Cape) is rich in aspalathin, a unique antioxidant found nowhere else in nature. Applied topically or consumed as tea.',
        topical: 'Rooibos extract in toners, essences, and serums applied before SPF.',
        consumed: 'Daily rooibos tea provides internal antioxidant support.',
        science: 'Studies show rooibos aspalathin inhibits melanin production and reduces UV-induced inflammation.',
      },
      {
        name: 'Baobab Oil Skin Protection',
        description: 'Baobab oil from the iconic African tree is rich in vitamins A, D, E, and omega fatty acids. Applied as an antioxidant base layer before SPF.',
        benefit: 'Strengthens skin barrier, reducing UV penetration at a cellular level.',
      },
      {
        name: 'Shade Culture and Ubuntu',
        description: 'Traditional Southern African communities gathered under large trees — the meeting place of the community. This shade-first culture was practical UV protection embedded in social life.',
      },
    ],
    southAfricanSkinCancerAwareness: {
      facts: [
        'Australia and South Africa compete for the highest melanoma rates in white-skinned populations globally',
        'Detection of skin cancer in Black South Africans is often delayed — appearing in atypical locations (soles of feet, under nails)',
        'Annual full-body skin check with a dermatologist is recommended for all South Africans',
        'The ABCDE rule applies: Asymmetry, Border, Color, Diameter, Evolution of any mole or spot',
      ],
      resources: 'CANSA (Cancer Association of South Africa) provides free skin cancer screening at various locations across SA.',
    },
    spfGuide: {
      recommendation: 'SPF 30+ daily for all South African skin tones. SPF 50 for outdoor activities or beach.',
      localBrands: [
        'Neutrogena Ultra Sheer Dry-Touch Sunscreen (widely available in SA)',
        'Eucerin Sun Fluid (Clicks, Dis-Chem)',
        'La Roche-Posay Anthelios (specialty pharmacies and Dis-Chem)',
        'Spectraban (South African brand, available at pharmacies)',
        'COOLA Classic SPF 50 (Woolworths)',
      ],
    },
  },

  'black-american': {
    communityId: 'black-american',
    communityName: 'Black American',
    sunCarePhilosophy: 'Black American sun care is experiencing a cultural renaissance. For generations, the harmful myth that "Black people don\'t need sunscreen" (internalized from colorism and lack of community-specific dermatological guidance) left many Black Americans unprotected. Today, Black dermatologists, beauty founders, and influencers are leading a SPF-for-Black-skin movement. The creation of sunscreens formulated without white cast specifically for Black skin (Black Girl Sunscreen, Unsun Cosmetics) is transforming accessibility. Sun protection is now a growing priority in Black American beauty culture.',
    uvExposureContext: {
      skinProtection: 'Black American skin ranges from Fitzpatrick IV (lighter) to VI (deepest). Melanin provides natural UV protection but does NOT prevent UV damage, hyperpigmentation, or skin cancer.',
      melanomaMortality: 'Black Americans have a lower incidence of melanoma but a higher mortality rate. Melanoma in Black skin is often diagnosed later and in atypical locations (palms, soles, under nails — acral lentiginous melanoma).',
    },
    commonConcerns: [
      'The "Black people don\'t get skin cancer" myth — dangerous and false',
      'White cast from traditional sunscreen formulas making them cosmetically unacceptable',
      'Post-inflammatory hyperpigmentation worsened dramatically by UV',
      'Acne-related dark spots that never fade without consistent SPF',
      'Finding high-coverage SPF makeup for deep skin tones',
    ],
    mythBusting: [
      {
        myth: 'Black people don\'t need sunscreen',
        truth: 'All skin tones are susceptible to UV damage. While Black skin has more melanin (which provides SPF ~13 natural protection), this is far insufficient for full UV protection. UV causes hyperpigmentation, photoaging, and skin cancer in Black skin.',
      },
      {
        myth: 'If I don\'t burn, I don\'t need SPF',
        truth: 'Sunburn is just one form of UV damage. UV also causes hyperpigmentation (the #1 skin concern in Black women), accelerated photoaging, and DNA damage that can lead to skin cancer — without a visible burn.',
      },
      {
        myth: 'My foundation with SPF is enough',
        truth: 'Foundations are not applied in the quantity needed to achieve the labeled SPF. SPF in foundation is a bonus, not a replacement for dedicated sunscreen.',
      },
      {
        myth: 'Darker skin doesn\'t get skin cancer',
        truth: 'Skin cancer in Black skin is rarer but often more deadly due to late diagnosis. Acral lentiginous melanoma (sole of foot, palm, under nails) disproportionately affects Black Americans.',
      },
    ],
    spfForBlackSkin: {
      formulaGuide: {
        chemicalSunscreen: {
          pros: 'No white cast. Works well for deep skin tones.',
          cons: 'Some ingredients (oxybenzone) have hormone concerns. May cause breakouts for some acne-prone skin.',
          topPicks: ['Supergoop Unseen Sunscreen SPF 40', 'La Roche-Posay Anthelios Melt-In Milk SPF 100'],
        },
        mineralSunscreen: {
          pros: 'Reef-safe. Less likely to irritate sensitive skin. Provides UV protection immediately upon application.',
          cons: 'White or grey cast on deep skin tones. Often thick in texture.',
          topPicks: ['Black Girl Sunscreen SPF 30 (crystal clear, specifically formulated for melanin-rich skin)', 'Unsun Cosmetics Mineral Tinted SPF 30'],
        },
        hybrid: {
          pros: 'Combines mineral and chemical filters. Often reduces white cast compared to pure mineral.',
          topPicks: ['EltaMD UV Clear Broad-Spectrum SPF 46', 'CeraVe Hydrating Sunscreen SPF 50'],
        },
      },
      applicationAmounts: [
        'Face: a nickel-sized amount (about ¼ teaspoon) — most people apply too little',
        'Body: a shot-glass amount (1 oz / 28 mL) for full body coverage',
        'Don\'t forget: ears, back of neck, hands, and lips',
      ],
    },
    hyperpigmentationAndSun: {
      connection: 'This is the most critical point for Black American skin: UV is the #1 driver of hyperpigmentation worsening. Every dark spot gets darker with UV exposure. Every acne mark takes longer to fade without SPF.',
      darkSpotProtocol: [
        '1. SPF every single morning — non-negotiable',
        '2. Reapply every 2 hours outdoors',
        '3. Vitamin C serum each morning (antioxidant + melanin inhibitor)',
        '4. Niacinamide serum (reduces melanin transfer)',
        '5. Azelaic acid or kojic acid treatment for active spots',
        '6. AHA/BHA exfoliation 2–3x per week to accelerate spot fading',
        '7. Retinol or retinoid at night for cell turnover',
        '8. BE PATIENT — dark spots on deep melanin skin take 3–6 months to fade with consistent treatment',
      ],
      fastestFadingIngredients: [
        'Tranexamic acid (very well-tolerated, strong evidence)',
        'Kojic acid 1–2%',
        'Alpha-arbutin',
        'Vitamin C (ascorbic acid or more stable derivatives)',
        'Niacinamide 10%',
        'Azelaic acid 10–20%',
      ],
    },
    blackDermatologistRecommendations: {
      note: 'Seek out dermatologists with documented experience in treating melanin-rich skin. The Skin of Color Society (skinofcolorsociety.org) maintains a directory.',
      annualSkinChecks: 'Annual full-body skin exam with a dermatologist. Know the ABCDE of melanoma. Check soles, palms, under nails.',
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SUN PROTECTION UNIVERSAL GUIDE
// ─────────────────────────────────────────────────────────────────────────────

export const UNIVERSAL_SUN_CARE = {
  spfBasics: {
    whatIsSpf: 'Sun Protection Factor — measures how much UV radiation is needed to cause sunburn relative to unprotected skin. SPF 30 blocks ~97% of UVB. SPF 50 blocks ~98%. SPF 100 blocks ~99%.',
    broadSpectrum: 'Look for "broad spectrum" on the label — means protection against both UVB (burning) and UVA (aging and deeper skin damage).',
    minimumRecommendation: 'SPF 30 daily for everyone. SPF 50 for outdoor activities, beach, or skin of color managing hyperpigmentation.',
    applicationTiming: 'Apply 15–30 minutes before sun exposure for chemical sunscreens. Mineral sunscreens work immediately.',
    reapplication: 'Every 2 hours of sun exposure. After swimming (water-resistant formulas last 40–80 minutes in water). After sweating heavily.',
  },

  uvIndex: {
    explanation: 'The UV Index (0–11+) indicates UV intensity on a given day.',
    scale: [
      { range: '0–2', level: 'Low', action: 'SPF optional but recommended' },
      { range: '3–5', level: 'Moderate', action: 'Wear SPF 30+, hat, seek shade midday' },
      { range: '6–7', level: 'High', action: 'Wear SPF 50+, limit midday exposure' },
      { range: '8–10', level: 'Very High', action: 'Minimize outdoor exposure 10 AM–4 PM. SPF 50+ required.' },
      { range: '11+', level: 'Extreme', action: 'Avoid outdoor exposure when possible. Full-cover clothing + SPF 50.' },
    ],
  },

  beyondSunscreen: {
    title: 'Sun protection is more than sunscreen',
    strategies: [
      'Seek shade 10 AM–4 PM when UV is most intense',
      'UPF 50+ clothing (regular cotton is only ~UPF 5)',
      'Wide-brimmed hat (3" brim) — protects face, ears, neck',
      'UV-blocking sunglasses (wrap-around for maximum protection)',
      'UV-protective car window tint',
      'UV-blocking umbrella for daily use',
      'Indoor UV protection (UVA penetrates glass — apply SPF indoors if near windows)',
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function getSunCareGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_SUN_CARE_GUIDES['west-african'],
    'south-asian': ETHNIC_SUN_CARE_GUIDES['south-asian'],
    'caribbean': ETHNIC_SUN_CARE_GUIDES['caribbean'],
    'arab': ETHNIC_SUN_CARE_GUIDES['arab'],
    'latina': ETHNIC_SUN_CARE_GUIDES['latina'],
    'east-asian': ETHNIC_SUN_CARE_GUIDES['east-asian'],
    'east-african': ETHNIC_SUN_CARE_GUIDES['east-african'],
    'south-african': ETHNIC_SUN_CARE_GUIDES['south-african'],
    'black-american': ETHNIC_SUN_CARE_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

export const SUN_CARE_STATS = {
  moduleId: 'sun_care_ethnic_guide',
  communitiesCovered: 9,
  traditionalPracticesCovered: 28,
  spfGuidesCovered: 9,
  mythsBusted: 4,
  version: '1.0.0',
};
