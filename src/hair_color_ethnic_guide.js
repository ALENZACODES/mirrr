/**
 * MIRRR — Hair Color Ethnic Guide
 * Comprehensive guidance on hair coloring, dyeing, bleaching, henna,
 * natural tints, and color theory across all 9 ethnic communities.
 * Covers cultural significance of hair color, protection for natural
 * hair during chemical processes, and traditional hair tinting methods.
 */

export const ETHNIC_HAIR_COLOR_GUIDES = {
  'west-african': {
    communityId: 'west-african',
    communityName: 'West African',
    hairColorPhilosophy: 'Hair color in West African communities ranges from deeply traditional — the rich blue-black of natural, untouched Afro hair as a mark of heritage and pride — to boldly expressive, with vibrant colors increasingly celebrated as cultural art. In Nigeria, Ghana, Senegal, and across West Africa, colored wigs, weaves, and braids allow for color expression without chemical damage to natural hair. The natural hair movement has reinforced the beauty of undyed, natural hair colors. Henna has long been used for decorative hair color during celebrations.',
    naturalHairColorRange: {
      description: 'West African hair is predominantly very dark brown to jet black (Levels 1–3 on the hair color scale). Natural grey begins appearing typically in the 30s–50s.',
      levels: ['Level 1 (Jet Black) — most common', 'Level 2 (Black)', 'Level 3 (Darkest Brown) — some communities'],
    },
    coloringChallenges: [
      'Lifting dark/black hair requires significant bleaching, which stresses already fragile 4C hair',
      'Damage from bleach is amplified in tightly coiled hair due to its structure',
      'Color maintenance on Afro-textured hair requires deep conditioning regimen',
      'Scalp sensitivity to harsh bleaching chemicals',
      'Color application on braids/twists vs. loose natural hair requires different technique',
    ],
    traditionalColorPractices: [
      {
        name: 'Henna Hair Color',
        description: 'Henna (lawsonia inermis) used for hair and scalp staining during celebrations, weddings, and festivals across West African Muslim communities.',
        result: 'On dark hair, pure henna deposits a reddish-brown tone visible in sunlight. Many people also like the way it coats and conditions the hair.',
        application: 'Mix henna powder with warm water, lemon juice, and amla powder to a thick paste. Apply to hair. Cover. Leave 2–4 hours. Rinse thoroughly.',
        note: 'Pure henna (100% lawsonia) is safe and conditioning. Avoid "black henna" (contains PPD — extremely dangerous and sensitizing).',
      },
      {
        name: 'Indigo Hair Color',
        description: 'Indigo (indigofera tinctoria) used after henna to achieve very dark brown to black tones on African hair.',
        method: 'Apply henna first. Rinse. Then apply indigo paste. Leave 1 hour. Rinse. The combination gives a natural-looking deep color.',
        safety: '100% natural, conditioning, no chemical damage.',
      },
      {
        name: 'Colored Wigs and Weaves',
        description: 'The dominant form of color expression in West African communities — protective styling means hair is colored at the wig/weave level, protecting natural hair entirely.',
        options: ['Ready-to-wear colored wigs', 'Human hair lace fronts in any color', 'Synthetic braiding hair in vivid colors', 'Colored marley hair for twist/fro styles'],
        advantage: 'Color without any chemical damage to natural hair. Change colors weekly if desired.',
      },
    ],
    chemicalColorGuide: {
      ifYouMustBleach: [
        'Pre-treat hair with Olaplex or similar bond-building treatment BEFORE bleaching',
        'Do a strand test every single time',
        'Never bleach and relax in the same session (or within 2 weeks)',
        'High-lift dye (no bleach, for minimal lifting) before escalating to bleach',
        'Leave bleach on minimum time — check every 10 minutes',
        'Never bleach hair that is already chemically treated without professional help',
        'Deep condition for at least 2 weeks before and intensively after',
      ],
      protectedColoringMethod: [
        'Color/bleach the wigs, not the natural hair',
        'Color the ends only (ombre) to minimize damage to the scalp area',
        'Use protein treatments before and after coloring',
        'Invest in deep conditioning mask immediately after color',
        'Use color-safe shampoo and conditioner after treatment',
      ],
      popularColorChoices: [
        'Honey blonde (Level 7–8) — very popular across Nigeria and Ghana',
        'Burgundy/wine (dark red) — classic West African beauty choice',
        'Ombre (dark roots to lighter ends)',
        'Bold colors on wigs: reds, purples, blues',
        'Natural black maintained and celebrated',
      ],
    },
    greyHairCulture: {
      attitudes: 'Grey hair carries complex significance in West African cultures. For elders, it represents wisdom, respect, and dignity — being referred to as "elder" is an honor. For younger women experiencing early greying, covering is more common.',
      coverage: [
        'Semi-permanent dark dye for first coverage attempts',
        'Henna + indigo for 100% natural grey coverage',
        'Blue-black permanent dye for full coverage',
        'Embrace grey: the "silver fox" and "silver queen" aesthetics are growing in West African communities',
      ],
    },
  },

  'south-asian': {
    communityId: 'south-asian',
    communityName: 'South Asian',
    hairColorPhilosophy: 'Hair coloring in South Asian communities carries deeply layered cultural significance. Natural black or dark brown hair has long been equated with youth, beauty, and purity. Grey hair on young people signals stress or ill health in traditional contexts. Mehendi (henna) application for hair is an ancient Ayurvedic practice with a body of tradition far beyond mere coloring — it conditions, cools the scalp, and carries ritual significance. Modern South Asian women have embraced global color trends from balayage to vivid fashion colors, while traditional women still rely on mehendi for beautiful, chemical-free coloring.',
    naturalHairColorRange: {
      description: 'South Asian hair ranges from jet black to very dark brown. Some individuals in Northern India, Pakistan, and Afghan communities have lighter brown or even auburn natural tones.',
      levels: ['Level 1 (Jet Black)', 'Level 2 (Black)', 'Level 3 (Darkest Brown)', 'Level 4 (Dark Brown) — Northern communities'],
    },
    coloringChallenges: [
      'Very dark base requires significant pre-lightening for vivid or pastel colors',
      'South Asian hair is typically thick and coarse — takes longer to process',
      'Chemically treated (relaxed or permed) South Asian hair is more vulnerable to bleach damage',
      'Strong scalp connection to cultural and religious identity around grey hair',
      'Finding products in South Asian markets that match Indian hair needs',
    ],
    mehendi: {
      traditionalUse: 'Mehendi (henna) applied to hair is one of the world\'s oldest and most sophisticated natural hair care and coloring systems. It has been used continuously in the Indian subcontinent for thousands of years.',
      benefits: [
        'Natural auburn to reddish-brown color on dark hair (more visible in sunlight)',
        'Outstanding conditioning — coats the hair shaft and fills in damage',
        'Scalp cooling and cleansing',
        'Antibacterial and antifungal scalp treatment',
        'Grey coverage (more reddish tone on grey)',
        'Strengthens the hair strand',
      ],
      recipe: {
        basic: '100g henna powder + 2 tbsp amla powder + 2 tbsp coffee (darkens tone) + lemon juice + warm water to paste consistency. Leave paste to mature 6–8 hours. Apply. Cover with plastic cap. Leave 2–4 hours. Rinse with water (no shampoo for 24 hours).',
        advanced: '100g henna + 50g indigo (for darker result) + amla powder + coffee + lemon + egg yolk (extra conditioning). Apply henna first, rinse, then apply indigo alone for very dark to black result.',
        greyFormula: 'For grey coverage: use 2:1 henna-to-indigo ratio for rich brown. Equal henna + indigo for dark brown. Indigo alone (after henna) for near-black on grey.',
      },
      warnings: [
        'NEVER use "black henna" — it contains PPD (p-phenylenediamine), a chemical sensitizer that causes severe allergic reactions',
        'Pure henna powder (lawsonia inermis) only — check the ingredient list',
        'Do not apply chemical color on top of henna until all henna has grown out — reactions can occur',
      ],
    },
    ayurvedicHairColorEnhancers: [
      {
        ingredient: 'Amla (Indian Gooseberry)',
        effect: 'Deepens natural dark tones when mixed with henna; traditionally used against greying, without reliable evidence that it prevents it',
        use: 'Add to henna mix or use amla oil as a scalp treatment',
      },
      {
        ingredient: 'Bhringraj',
        effect: 'Traditional dark-hair oil; any darkening is slight, and there is no reliable evidence it prevents grey',
        use: 'Bhringraj oil massage into scalp weekly. Add powder to henna mix.',
      },
      {
        ingredient: 'Coffee',
        effect: 'Darkens henna result, adds shine',
        use: 'Add strong brewed coffee to henna paste',
      },
      {
        ingredient: 'Walnut Shell Powder',
        effect: 'Natural brown-black tint, used for greying temples',
        use: 'Mix with water to a paste. Apply to grey sections for a few minutes. Rinse.',
        caution: 'Can stain skin. Test first. Temporary.',
      },
      {
        ingredient: 'Shikakai',
        effect: 'Conditions and naturally enhances hair\'s own color',
        use: 'Use as a shampoo (paste with water). Rinse. Enhances dark hair luster.',
      },
    ],
    chemicalColorTrends: {
      popular: [
        'Balayage — the most-requested color service among modern South Asian women',
        'Babylights — subtle, natural-looking lightening throughout dark hair',
        'Copper/reddish brown — complements olive and medium-brown skin tones beautifully',
        'Black cherry (dark reddish purple) — very flattering on South Asian skin',
        'Chocolate brown — very accessible (only 1–2 levels of lift from natural)',
        'Fashion vivids on pre-bleached sections — increasingly popular for younger South Asian women',
      ],
      skinToneColorPairing: [
        { skinTone: 'Fair South Asian (warm undertone)', recommendedColors: ['Golden blonde', 'Copper', 'Honey brown', 'Rose gold'] },
        { skinTone: 'Medium South Asian (olive/warm)', recommendedColors: ['Rich chocolate', 'Auburn', 'Burgundy', 'Dark caramel'] },
        { skinTone: 'Deeper South Asian (warm/golden deep)', recommendedColors: ['Dark plum', 'Black cherry', 'Deep copper', 'Warm chestnut'] },
      ],
    },
    greyHairCulture: {
      traditional: 'Premature greying carries stigma in some South Asian communities — associated with stress, illness, or poor health. Many South Asian women begin covering grey very early.',
      modern: 'A growing movement reclaims grey hair as beautiful — "salt and pepper" and full silver grey are increasingly celebrated by confident South Asian women.',
      classicSolution: 'Semi-permanent dark dye applied every 4–6 weeks',
      naturalSolution: 'Henna + indigo for warm, chemical-free grey coverage',
      embrace: 'Toning grey with blue or purple toner for a sophisticated silver — a growing trend',
    },
  },

  'caribbean': {
    communityId: 'caribbean',
    communityName: 'Caribbean',
    hairColorPhilosophy: 'Hair color in Caribbean communities is vibrant, expressive, and ever-evolving. The Caribbean aesthetic embraces both natural beauty and creative color expression with equal pride. From the radiant honey blondes and coppers of Barbados beauty culture to the vivid Carnival-inspired colors of Trinidad and Tobago, hair color is a statement of personality and Caribbean joy. The influence of African, European, and Indigenous Taíno heritage creates an incredibly diverse range of natural hair textures and colors across the Caribbean, from jet black to natural golden tones.',
    naturalHairColorRange: {
      description: 'The Caribbean diaspora encompasses an enormous range of natural hair colors due to its multicultural heritage. From Level 1 jet black to Level 5–6 natural browns.',
      levels: ['Level 1–2 (Black) — predominant in Afro-Caribbean communities', 'Level 3–4 (Dark Brown) — common across the region', 'Level 4–6 (Brown) — mixed heritage Caribbean individuals'],
    },
    coloringChallenges: [
      'Same as West African for Afro-Caribbean hair: bleach damage risk on coily textures',
      'Salt water and sun exposure dramatically fades hair color',
      'High humidity causes color-treated hair to frizz more',
      'Relaxed + colored hair is extremely fragile',
      'The Caribbean sun accelerates color fading — sun protection for hair is essential',
    ],
    traditionalColorPractices: [
      {
        name: 'Coconut Oil Color Maintenance',
        description: 'Coconut oil used on color-treated hair to seal in dye and protect from the sun and sea.',
        application: 'Apply a light coat of coconut oil before sun exposure or swimming.',
        benefit: 'Blocks some UV rays and helps color molecules stay in the hair shaft.',
      },
      {
        name: 'Aloe Vera for Color Shine',
        description: 'Fresh aloe gel used as a finishing treatment on color-treated hair to add shine and tame frizz.',
        application: 'Apply a small amount of aloe gel to styled hair to smooth and add luminosity.',
      },
      {
        name: 'Henna for Red Tones',
        description: 'Henna used in Caribbean communities — particularly those with South Asian heritage (Indo-Caribbean: Trinidad, Guyana) — for natural hair coloring and conditioning.',
        tradition: 'Henna application is part of Indo-Caribbean wedding preparation and ritual beauty traditions.',
      },
    ],
    beachHairColorMaintenance: {
      theChallenge: 'The Caribbean lifestyle — beach, sun, salt water, chlorine — is devastating for color-treated hair. Color fades rapidly, and the combination of bleach-weakened hair and salt water is damaging.',
      protocol: [
        'Wet hair with fresh water BEFORE swimming (saturated hair absorbs less salt/chlorine)',
        'Apply coconut oil or argan oil before the beach as a barrier',
        'Rinse hair immediately after swimming',
        'Weekly deep conditioning mask is mandatory',
        'Color-depositing conditioner in copper/blonde shades to refresh faded color',
        'UV-protectant hair spray when spending extended time in sun',
      ],
      colorFadePrevention: [
        'Wash hair with cool water — hot water opens the cuticle and releases dye',
        'Sulfate-free shampoo only',
        'Color-protecting conditioner every wash',
        'Limit washing to 2x per week maximum',
        'Dry shampoo between washes to extend color vibrancy',
      ],
    },
    popularColorStyles: [
      'Ombre (dark roots to honey blonde/copper ends) — extremely popular',
      'Full blonde — a Caribbean statement look',
      'Copper and warm red tones — complement warm Caribbean skin tones',
      'Vivid colors for Carnival season',
      'Natural black maintained with deep shine',
    ],
  },

  'arab': {
    communityId: 'arab',
    communityName: 'Arab Middle Eastern',
    hairColorPhilosophy: 'Hair coloring in Arab communities balances deep traditional practices with modern elegance. Henna has been used across the Arab world for millennia — for brides, for special occasions, and for grey coverage. Dark, lustrous, natural hair is celebrated as beautiful across Arab cultures. At the same time, salon colour, balayage and highlights are widely embraced in Dubai, Beirut, Cairo and Amman. The hair salon (salon al-sha\'ar) is a vibrant social institution in Arab cities.',
    naturalHairColorRange: {
      description: 'Arab hair typically ranges from Level 2 (Very Dark Brown/Black) to Level 4–5 (Medium Brown) in North African and Levantine communities. Gulf Arab hair is predominantly very dark.',
      levels: ['Level 1–2 (Black) — Gulf Arab communities', 'Level 2–3 (Very Dark Brown) — Levant region', 'Level 3–4 (Dark Brown) — North Africa and Levant', 'Level 4–5 (Medium Brown) — some Lebanese and North African communities'],
    },
    hennaInArabCulture: {
      significance: 'Henna (حناء, al-henna) holds deep cultural and religious significance across the Arab world. Prophetic hadith mention the Prophet Muhammad\'s use of henna for grey hair. Brides are adorned with henna on their wedding night (laylat al-henna). Henna is applied at religious celebrations, Eid, and coming-of-age events.',
      hairUse: 'Henna applied to the hair and scalp as a conditioning treatment and grey coverage method — traditional throughout Gulf, North African, and Levantine Arab communities.',
      recipe: 'Mix henna powder with warm water and lemon juice. Some add olive oil or argan oil for extra conditioning. Apply to scalp and hair. Cover. Leave 2–3 hours. Rinse with water. Shampoo after 24 hours.',
    },
    colorTrends: {
      modernSalon: [
        'Balayage — the most requested color service in Beirut, Dubai, and Amman salons',
        'Babylights — subtle, natural-looking highlights through dark Arab hair',
        'Caramel highlights — very flattering against Arab olive and medium complexions',
        'Smoky brown — very natural-looking lift for dark brown hair',
        'Dark chocolate — 1–2 levels of lift, very wearable for conservative settings',
        'Golden highlights in darker hair for sun-kissed effect',
      ],
      skinTonePairing: [
        { skinTone: 'Fair Arab (cool/neutral undertone)', recommendedColors: ['Ash blonde', 'Platinum highlights', 'Cool brown', 'Mushroom brown'] },
        { skinTone: 'Olive Arab (warm/neutral undertone)', recommendedColors: ['Caramel', 'Golden brown', 'Honey blonde highlights', 'Auburn'] },
        { skinTone: 'Medium-deep Arab (golden/warm undertone)', recommendedColors: ['Dark caramel', 'Burgundy', 'Warm chestnut', 'Copper brown'] },
      ],
    },
    greyHairCulture: {
      islamicContext: 'In Islamic tradition, henna is the recommended method for covering grey hair — dyeing with black is discouraged (makruh) in some scholarly opinions, while natural grey or henna is encouraged.',
      practicalOptions: [
        'Pure henna for traditional, chemical-free reddish-brown grey coverage',
        'Henna + indigo for dark brown to near-black grey coverage',
        'Semi-permanent dark brown (no black) for full grey coverage',
        'Embrace grey: silver and white hair increasingly celebrated among Arab women',
      ],
    },
  },

  'latina': {
    communityId: 'latina',
    communityName: 'Latina',
    hairColorPhilosophy: 'Hair color is deeply expressive in Latina cultures — it is drama, passion, identity, and transformation. From the rich brunette of Colombian novela stars to the striking platinum of Miami cubanas, from the vibrant reds of Mexicanas to the natural dark glory of Indigenous-heritage women, Latina hair color is a spectrum of beauty. Salon culture is central — the hair salon (salón de belleza or peluquería) is a community gathering space. Natural hair color is celebrated, but hair color services are among the most commonly purchased beauty services in Latin America.',
    naturalHairColorRange: {
      description: 'Latina hair spans an enormous range of natural tones due to the community\'s diverse heritage — Indigenous, African, European, and Asian influences.',
      levels: ['Level 1–2 (Black) — Afro-Latina and Indigenous-heritage Latinas', 'Level 2–4 (Very Dark to Dark Brown) — the most common range', 'Level 4–6 (Dark to Medium Brown) — many Central and South American communities', 'Level 5–7 (Medium Brown to Dark Blonde) — lighter-heritage Latina women'],
    },
    coloringChallenges: [
      'Naturally dark hair requires multiple lightening sessions for vivid or very light colors',
      'Curly/wavy Latina hair can be fragile under bleach',
      'Sun exposure in warm climates fades color rapidly',
      'Humidity causes color-treated curly hair to frizz more',
      'Pressure within communities around certain hair colors and skin tone combinations',
    ],
    traditionalColorPractices: [
      {
        name: 'Rinse de Manzanilla (Chamomile Rinse)',
        description: 'Chamomile tea rinse used to naturally lighten and add golden highlights to lighter brown hair over time.',
        method: 'Brew very strong chamomile tea. Cool. Pour over hair as a final rinse after shampoo. Leave to air dry in sunlight for maximum lightening effect.',
        note: 'Works best on Level 5–7 natural hair. Very subtle, gradual lightening. Conditions beautifully.',
      },
      {
        name: 'Aceite de Oliva Color Protection',
        description: 'Olive oil used as a color-protecting and conditioning treatment for color-treated Latina hair.',
        application: 'Apply warm olive oil from roots to ends. Cover with a shower cap. Leave 30 minutes. Rinse and shampoo.',
      },
      {
        name: 'Henna for Color',
        description: 'Henna use in Latina communities — particularly among Mexican and Central American women with Indigenous heritage — as a natural coloring and conditioning treatment.',
      },
    ],
    popularColorStyles: [
      'Rich chocolate brown — universally flattering on warm Latina skin tones',
      'Balayage with caramel highlights — the most requested salon service',
      'Honey/golden blonde (the "Latina blonde") — warm, golden, not icy',
      'Red — from copper to vivid red, a classic Latina color statement',
      'Ombre: dark roots to warm blonde or copper ends',
      'Black-with-highlights: dark base with subtle gold or copper threads',
      'Vivid colors: teal, purple, pink — growing trend especially among Afro-Latina and younger Latinas',
    ],
    skinTonePairing: [
      { skinTone: 'Light Latina (warm/golden)', recommended: ['Honey blonde', 'Golden highlights', 'Caramel', 'Rose gold'] },
      { skinTone: 'Medium Latina (warm olive)', recommended: ['Rich chocolate', 'Auburn', 'Copper highlights', 'Warm brunette'] },
      { skinTone: 'Deep Latina (warm/golden deep)', recommended: ['Dark plum', 'Burgundy', 'Black cherry', 'Deep copper'] },
      { skinTone: 'Afro-Latina (full range)', recommended: ['Rich auburn on wigs/weaves', 'Honey blonde ombre', 'Bold vivids on protective styles'] },
    ],
    greyHairCulture: {
      attitudes: 'In traditional Latin American cultures, grey hair is covered consistently — youth is celebrated and grey suggests age. However, modern Latina women are increasingly embracing grey as a power statement.',
      modernMovement: 'The "canas" (grey hair) pride movement is growing in Latin America — women letting their natural grey grow and wearing it boldly.',
    },
  },

  'east-asian': {
    communityId: 'east-asian',
    communityName: 'East Asian',
    hairColorPhilosophy: 'Hair color in East Asian communities has undergone extraordinary evolution over the past three decades. Traditional beauty ideals valued lustrous, jet black hair as the pinnacle of health and beauty. The Korean Wave (Hallyu) transformed this completely — K-pop idol hair colors from auburn to silver to vivid pink became aspirational across East Asia and the global diaspora. Japanese harajuku and gyaru aesthetics championed dramatic bleaching and vivid coloring. Today, East Asian hair color ranges from traditional very dark brown to global fashion-forward colors. Salon colour work in Seoul, Tokyo and Shanghai is highly developed.',
    naturalHairColorRange: {
      description: 'East Asian hair is predominantly Level 1–3 (Black to Very Dark Brown). The hair shaft is typically round and thick, creating the characteristic straight, smooth East Asian hair.',
      levels: ['Level 1 (Jet Black) — most common', 'Level 2 (Black)', 'Level 3 (Darkest Brown) — some individuals'],
    },
    coloringChallenges: [
      'Level 1 jet black is the hardest color to lift — requires significant bleaching for vivid results',
      'East Asian hair is typically thick and resistant, requiring longer processing times',
      'The characteristic straight, smooth hair makes bleach work very evenly — predictable but requires expertise',
      'Very high-contrast results: bleached East Asian hair can look very yellow at intermediate stages',
      'Scalp sensitivity to bleach',
    ],
    japaneseColorTraditions: {
      gyaru: 'The gyaru (gal) subculture of the 1990s–2000s championed dramatic bleaching, vivid colors, and light blonde (known as kogal look). Highly influential on global hair color trends.',
      wabi_sabi: 'Natural, imperfect grey hair accepted and even celebrated in Japanese aesthetics — particularly for older women.',
      popularModern: ['Ash brown', 'Light brown (the #1 most popular Japanese color service)', 'Dark brown with highlights', 'Rose brown', 'Grey-brown (greige)'],
    },
    koreanColorTrends: {
      hallyu: 'K-pop and K-drama have driven global hair color trends for over a decade. K-idol hair colors become international trends almost immediately.',
      popularKColors: [
        'Natural dark brown (most popular everyday color)',
        'Auburn/chestnut (very K-drama)',
        'Blue-black (the sophisticated K-pop staple)',
        'Ash grey (for the bold)',
        'Silver-platinum (idol-inspired)',
        'Lavender/pink (soft and feminine trend)',
        'Honey/warm blonde (sun-kissed)',
      ],
    },
    chineseColorCulture: {
      traditional: 'Black hair as a beauty standard — deep, lustrous black was the ideal for generations.',
      modern: 'Major shift especially in urban China — hair color salons in Shanghai and Beijing offer the full range of global color techniques.',
      popular: ['Natural brown', 'Dark chocolate', 'Warm auburn', 'Korean-style subtle highlights'],
    },
    bleachingGuide: {
      forEastAsianHair: [
        'High-lift dye first — can lift up to 3–4 levels without bleach',
        'For lighter results: bleach is necessary, but one bleach session at a time',
        '30 vol developer maximum for on-scalp application',
        '40 vol developer for off-scalp highlight work only',
        'Olaplex (bond-building treatment) is ESSENTIAL during bleach processing',
        'Toner is always needed after bleach — East Asian hair lifts to yellow/orange',
        'Blue or purple toner neutralizes yellow tones to ash, grey, or platinum',
        'Space bleach sessions at least 4 weeks apart',
      ],
    },
    greyHairCulture: {
      traditional: 'Grey hair in East Asian cultures traditionally signified age and was consistently covered. "Haha no shiro kami" (mother\'s white hair) in Japanese evokes respect but was typically covered by the individual.',
      modern: 'A striking shift: grey hair is now aspirational in fashion-forward East Asian contexts. "Salt and pepper" looks on younger East Asian women, Korean "grandma grey" trend.',
    },
  },

  'east-african': {
    communityId: 'east-african',
    communityName: 'East African',
    hairColorPhilosophy: 'Hair color in East African communities — spanning Ethiopian, Eritrean, Somali, Kenyan, Tanzanian, and Ugandan communities — is influenced by diverse cultural traditions, religious contexts, and regional aesthetics. Natural, deep black hair is celebrated as naturally beautiful. Henna use is prevalent in Muslim East African communities (Somali, Ethiopian Muslim, Swahili coast). Colored wigs, weaves, and braids offer color expression for protective styling. Urban East African fashion scenes in Nairobi and Addis Ababa are increasingly style-forward.',
    naturalHairColorRange: {
      description: 'East African hair is predominantly very dark brown to jet black. The hair texture is typically tightly coiled (Type 4), which has the same coloring challenges as all tightly coiled textures.',
      levels: ['Level 1 (Jet Black) — most common', 'Level 2 (Black)', 'Level 3 (Darkest Brown) — some individuals from highland regions'],
    },
    hennaInEastAfrica: {
      somaliTradition: 'Henna (xenna in Somali) is an essential part of Somali wedding culture (nikaah preparation) and Eid celebrations. Intricate patterns are applied to hands, feet, and sometimes hair for these occasions.',
      ethiopianTradition: 'Henna is used in Ethiopian Muslim wedding ceremonies and is integrated into women\'s beauty rituals in regions with Muslim heritage.',
      hairApplication: 'Henna applied to the hair and scalp as a conditioning, coloring, and scalp health treatment. Particularly common for grey coverage.',
    },
    coloringPractices: [
      {
        name: 'Protective Style Color Expression',
        description: 'Like West African women, East African women predominantly express hair color through wigs, weaves, and braids rather than chemical processing of natural hair.',
        styles: ['Colored box braids', 'Ombre weaves', 'Colored wigs — honey blonde is especially popular', 'Burgundy and auburn protective styles'],
      },
      {
        name: 'Castor Oil Color Protection',
        description: 'Jamaican black castor oil applied to color-treated natural hair to seal and protect.',
        application: 'Apply a small amount to ends and mid-shaft after coloring. Protects and adds shine.',
      },
    ],
    popularColorChoices: [
      'Natural black — celebrated and maintained',
      'Honey blonde on wigs/weaves — very popular across East Africa',
      'Burgundy/wine — a classic choice',
      'Ombre on protective styles',
      'Bold colors for Nairobi fashion-forward community',
    ],
    greyHairCulture: {
      attitudes: 'Elders with natural grey hair command respect in East African cultures. Many older women embrace natural grey as a mark of wisdom.',
      coverage: 'Henna (natural reddish-brown) is the most culturally consistent grey coverage method in Muslim East African communities.',
    },
  },

  'south-african': {
    communityId: 'south-african',
    communityName: 'South African',
    hairColorPhilosophy: 'South African hair color culture is as diverse as the country itself. Black South African women have embraced both natural hair color and vibrant color expression with equal force — the natural hair movement runs alongside sophisticated color culture. Afrikaner and white South African women have a strong salon culture with international trends. Cape Malay and Indian South African communities bring their own rich hair color traditions. The South African hairstyling industry is internationally recognized, and Johannesburg and Cape Town salons are highly sophisticated.',
    naturalHairColorRange: {
      description: 'South African hair color diversity spans the full spectrum — from Level 1 jet black in Black South African communities to Level 6–8 in lighter-heritage communities.',
      levels: ['Level 1–2 (Black) — Black South African communities', 'Level 2–4 (Dark Brown) — Cape Coloured communities (mixed heritage)', 'Level 3–5 (Dark to Medium Brown) — Indian South African communities', 'Level 5–8 (Medium to Light Brown, Blonde) — Afrikaner and white South African communities'],
    },
    coloringByHeritage: {
      blackSouthAfrican: {
        practice: 'Strong protective styling culture means color is often expressed through wigs and weaves. Natural hair movement celebrates uncolored afro hair. Chemical color on natural hair is approached with care.',
        popular: ['Honey blonde weaves', 'Auburn box braids', 'Natural black maintained', 'Ombre protective styles'],
      },
      indianSouthAfrican: {
        tradition: 'Henna use for hair is part of the Indian South African cultural heritage, particularly in KwaZulu-Natal where the largest Indian South African community lives.',
        modern: 'Balayage, highlights, and rich brunette colors are very popular in Indian South African salon culture.',
      },
      afrikanerAndWhite: {
        practice: 'International color trends — balayage, highlights, vivid fashion colors — embraced fully. South African sun affects color maintenance significantly.',
        note: 'South Africa\'s UV index is extreme — sun protection for color-treated hair is especially important here.',
      },
    },
    marulaBenefitForColorHair: {
      description: 'Marula oil from the Southern African marula tree is exceptionally beneficial for color-treated hair.',
      benefits: ['Seals in color molecules', 'Adds extraordinary shine', 'Very fast-absorbing — no heaviness', 'UV protection properties help prevent color fade'],
      application: '2–3 drops applied to damp hair after washing. Or use marula-infused conditioner.',
    },
    greyHairCulture: {
      blackSouthAfrican: 'Grey hair on elders carries deep respect in traditional South African cultures. Younger women with early grey may cover or embrace.',
      modern: 'The silver and grey hair aesthetic is growing in South African fashion — urban Cape Town and Johannesburg increasingly celebrate natural grey.',
    },
  },

  'black-american': {
    communityId: 'black-american',
    communityName: 'Black American',
    hairColorPhilosophy: 'Hair color in Black American communities is art, identity, and cultural expression — from the rich, inky black of natural hair to the spectacular blonde that has become its own cultural icon (often called "Black girl blonde" or "sista girl blonde"). The natural hair movement celebrated natural dark hair after decades of its suppression by Eurocentric beauty standards. At the same time, Black women have claimed every color of the rainbow — from Beyoncé\'s honey blonde signature to SZA\'s ombre, from box braids in every color to vivid fashion colors that have influenced global trends. Black-owned hair care brands have elevated color products specifically for Black hair. Hair color is power, beauty, and creative expression.',
    naturalHairColorRange: {
      description: 'Black American hair is predominantly Level 1–3 (Black to Very Dark Brown). Some individuals with mixed heritage or rare genetic variation may have slightly lighter natural tones.',
      levels: ['Level 1 (Jet Black) — the most common', 'Level 2 (Black)', 'Level 3 (Darkest Brown)'],
    },
    coloringChallenges: [
      'Razor bumps and razor bump hyperpigmentation on the scalp from frequent bleaching prep',
      'Type 4 hair is the most fragile hair type — bleach damage risk is extremely high',
      'Scalp sensitivity to bleach chemicals is very common',
      'Color on relaxed hair is doubly risky — never bleach relaxed hair without professional oversight',
      'Maintaining vibrant color on tightly coiled hair that is naturally drier',
      'Color bleed on lighter colors is common with co-washing',
    ],
    protectiveStyleColorStrategy: {
      whyItWorks: 'The most popular and safest color strategy for Black American women: express color through wigs, weaves, and braids, protecting natural hair from chemical damage entirely.',
      options: [
        'Lace front wigs in any color — honey blonde, copper, vivid fashion colors',
        'Full weave in desired color',
        'Box braids, faux locs, knotless braids in any color — colored braiding hair',
        'Twist-outs on colored wigs/weaves',
      ],
      advantage: 'Unlimited color experimentation with zero damage to natural hair. Change looks weekly.',
    },
    naturalHairColoringGuide: {
      forType4Hair: {
        before: [
          'Deep condition for 2 weeks before coloring',
          'Do a strand test EVERY time',
          'Protein treatment 1 week before coloring',
          'Never color over a fresh relaxer or perm',
          'Have Olaplex No. 1 or similar bond-builder ready to add to color',
        ],
        during: [
          'Never leave bleach on Type 4 hair unmonitored — check every 10 minutes',
          'Use lower volume developer: 20 vol on scalp maximum, 30 vol off-scalp',
          'Apply color in sections — work quickly for even application',
          'Use a timer — do not exceed recommended processing time',
        ],
        after: [
          'Protein treatment immediately after coloring to rebuild broken bonds',
          'Deep condition every single wash for 4–6 weeks post-color',
          'Sulfate-free shampoo only',
          'Seal with oil after every conditioning treatment',
          'Protective style immediately after to give hair a rest',
        ],
      },
    },
    blackGirlBlonde: {
      description: '"Black girl blonde" — warm honey and golden blonde tones on Black women — has become a cultural beauty icon. From Beyoncé\'s signature honey blonde to SZA\'s golden ombre, this look is beloved.',
      process: 'Requires bleaching to lift dark Type 3/4 hair, then depositing warm blonde tone. A multi-session process. Best done by a stylist experienced with Black hair.',
      maintenance: [
        'Toning every 4–6 weeks to refresh golden or honey tone',
        'Purple shampoo is NOT for Black girl blonde — it neutralizes warmth. Use color-depositing warm shampoo instead.',
        'Deep conditioning mask weekly',
        'Protective styling at night',
      ],
    },
    iconicColorStyles: [
      'Honey/golden blonde — the quintessential "Black girl blonde"',
      'Burgundy/wine — a classic Black American beauty color',
      'Copper and auburn — warm, rich, beautiful on dark skin tones',
      'Vivid colors: teal, purple, electric blue — protective style expression',
      'Ombre on weaves/wigs',
      'Natural black — deeply celebrated in natural hair movement',
      'Blue-black (extremely rich, lustrous black with a blue sheen) — a protective style and weave classic',
    ],
    greyHairCulture: {
      traditional: 'Grey hair in Black American communities traditionally has complex cultural layering — some associate grey with wisdom and dignity, others prefer to cover.',
      modern: 'The "Silver Fox" and natural grey aesthetic is growing strongly among Black American women — natural silver, salt-and-pepper, and the deliberate embrace of grey are increasingly powerful beauty statements.',
      famous: 'Cultural figures like Cicely Tyson, Angela Davis, and Lisa Leslie normalized and celebrated grey hair in Black American communities.',
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL HAIR COLOR GUIDE
// ─────────────────────────────────────────────────────────────────────────────

export const UNIVERSAL_HAIR_COLOR = {
  fitzpatrickAndHairColor: {
    description: 'Fitzpatrick skin type and natural hair color depth interact to inform color recommendations. Darker natural hair requires more lifting; darker skin tones are typically served by warmer color tones.',
    toneGuide: [
      { skinUndertone: 'Cool (pink, rosy, blue undertone)', bestColors: ['Ash blonde', 'Platinum', 'Blue-black', 'Cool brown', 'Lavender', 'Silver'] },
      { skinUndertone: 'Warm (yellow, golden, peachy undertone)', bestColors: ['Honey blonde', 'Copper', 'Auburn', 'Golden brown', 'Rose gold', 'Warm caramel'] },
      { skinUndertone: 'Neutral (balanced, no strong lean)', bestColors: ['Natural brown', 'Chocolate', 'Any tone works — experiment', 'Balayage'] },
    ],
  },

  colorLevelSystem: {
    description: 'Professional hair color is measured on a 1–10 scale (1 = darkest black, 10 = lightest platinum blonde).',
    levels: [
      { level: 1, description: 'Jet Black' },
      { level: 2, description: 'Black' },
      { level: 3, description: 'Darkest Brown' },
      { level: 4, description: 'Dark Brown' },
      { level: 5, description: 'Medium Brown' },
      { level: 6, description: 'Light Brown' },
      { level: 7, description: 'Dark Blonde' },
      { level: 8, description: 'Medium Blonde' },
      { level: 9, description: 'Light Blonde' },
      { level: 10, description: 'Lightest Platinum Blonde' },
    ],
    fromDarkToLight: 'Going from Level 1–3 (natural dark hair in most ethnic communities) to Level 8+ (very light blonde) requires multiple bleach sessions over months. Rushing this process damages hair severely.',
  },

  developerGuide: {
    description: 'Developer (hydrogen peroxide) strength determines how much the hair is lightened during coloring.',
    strengths: [
      { volume: 10, use: 'Deposit color only, no lift. For toning, glossing, going darker.' },
      { volume: 20, use: '1–2 levels of lift. Standard home color. Safest for on-scalp bleach.' },
      { volume: 30, use: '2–3 levels of lift. Highlights. Moderate bleach applications on stronger hair.' },
      { volume: 40, use: '3–4 levels of lift. Off-scalp only (foils/bleach powder). PROFESSIONAL USE ONLY.' },
    ],
  },

  toneCorrection: {
    description: 'The color wheel governs toning — opposing colors neutralize each other.',
    corrections: [
      { unwantedTone: 'Yellow', neutralizer: 'Purple/violet toner' },
      { unwantedTone: 'Orange', neutralizer: 'Blue toner' },
      { unwantedTone: 'Red-orange', neutralizer: 'Blue-green or ash toner' },
      { unwantedTone: 'Brassiness (yellow-orange)', neutralizer: 'Purple + blue combo or ash dye' },
    ],
  },

  hairColorAftercare: {
    universal: [
      'Sulfate-free shampoo — sulfates strip color rapidly',
      'Cool water rinsing — hot water opens the cuticle and releases dye molecules',
      'Limit washing to 2–3x per week maximum',
      'Color-depositing conditioner to refresh tone between salon visits',
      'UV-protectant hair product when spending time in sunlight',
      'Deep conditioning mask weekly — color-treated hair is drier',
      'Protein treatment once monthly for bleached hair — rebuilds damaged bonds',
    ],
  },

  naturalHairColorAlternatives: {
    description: 'For communities with fragile hair textures or cultural preference for chemical-free methods, these options provide color without damage.',
    options: [
      {
        method: 'Henna',
        result: 'Reddish-brown tones on dark hair. Better results on lighter hair.',
        safe: true,
        notes: 'Pure henna only. Never on chemically treated hair (can react). Permanent-ish.',
      },
      {
        method: 'Henna + Indigo',
        result: 'Dark brown to near-black. Full grey coverage.',
        safe: true,
        notes: 'Two-step process. Must apply henna first, then indigo.',
      },
      {
        method: 'Coffee Rinse',
        result: 'Very subtle darkening and brown enhancement',
        safe: true,
        notes: 'Brew very strong coffee. Cool. Pour through hair. Leave 30 minutes. Rinse. Repeat weekly.',
      },
      {
        method: 'Chamomile Rinse',
        result: 'Subtle lightening and golden tones on Level 5+ hair',
        safe: true,
        notes: 'Works best in sunlight. Very gradual. Multiple applications needed.',
      },
      {
        method: 'Colored Wigs and Weaves',
        result: 'Any color with zero damage to natural hair',
        safe: true,
        notes: 'The safest color expression method. Fully protective.',
      },
    ],
  },

  hennaCompatibility: {
    warning: 'CRITICAL: Henna and chemical dye are not compatible. If you have henna in your hair, chemical dye (especially bleach) can cause unpredictable reactions — green cast, breakage, or resistance.',
    protocol: 'Wait for all henna to grow out before applying chemical color. For most women, this means 12–18 months of growth.',
    metalSalts: 'Some older henna products contain metallic salts (lead acetate). These are even more incompatible with chemical color. Test the henna first.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function getHairColorGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_HAIR_COLOR_GUIDES['west-african'],
    'south-asian': ETHNIC_HAIR_COLOR_GUIDES['south-asian'],
    'caribbean': ETHNIC_HAIR_COLOR_GUIDES['caribbean'],
    'arab': ETHNIC_HAIR_COLOR_GUIDES['arab'],
    'latina': ETHNIC_HAIR_COLOR_GUIDES['latina'],
    'east-asian': ETHNIC_HAIR_COLOR_GUIDES['east-asian'],
    'east-african': ETHNIC_HAIR_COLOR_GUIDES['east-african'],
    'south-african': ETHNIC_HAIR_COLOR_GUIDES['south-african'],
    'black-american': ETHNIC_HAIR_COLOR_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

