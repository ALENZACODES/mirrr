/**
 * MIRRR — Climate and Environment Beauty Multicultural Guide
 * How different climates affect skin, hair, and beauty needs — and how
 * the traditional beauty wisdom of each of the 9 communities evolved in
 * response to their specific environmental context. Climate is the original
 * reason every multicultural beauty tradition is different.
 */

export const ETHNIC_CLIMATE_BEAUTY_GUIDES = {
  'west-african': {
    communityId: 'west-african',
    communityName: 'West African',
    homeClimates: {
      sahel: { region: 'Sahel belt: Senegal, Mali, northern Nigeria, northern Ghana, Niger', type: 'Semi-arid. Hot and dry. Harmattan (dry desert wind from the Sahara) sweeps through October-March.', beautyChallenge: 'Harmattan is the nemesis of West African skin — it strips moisture, causes ashy skin, cracked lips, and dry scalp. The intense UV across all seasons.' },
      tropical: { region: 'Coastal West Africa: Lagos, Accra, Dakar, Abidjan', type: 'Tropical humid. 70-85% humidity. Intense heat and UV. Rainy season brings relief from dry air but introduces fungal skin issues.', beautyChallenge: 'Sweat-mixed-with-humidity causes congestion and fungal growth. UV damage. Makeup doesn\'t stay.' },
      savanna: { region: 'Middle belt and inland areas', type: 'Distinct wet and dry seasons. Dry season can be harsh.', beautyChallenge: 'Adapting between extreme seasons — heavy oils in dry season, lighter formulas in wet season.' },
    },
    harmattanSkinCare: {
      title: 'The Harmattan Beauty Survival Guide',
      description: 'The Harmattan is a West African phenomenon (October-March) where dry, dust-laden winds from the Sahara blow across West Africa, stripping moisture from everything — skin, hair, lips. Traditional West African beauty essentially exists to counter the Harmattan.',
      protocol: [
        { step: 'Seal immediately after bathing', method: 'Do not let skin air-dry during Harmattan. Pat slightly damp and immediately apply shea butter or oil to seal moisture in before the dry air can strip it.', product: 'Raw shea butter — the traditional Harmattan solution.' },
        { step: 'Layer moisture', method: 'Spray face with water or rose water, then apply oil while skin is still wet.', why: 'Harmattan conditions require the humectant+emollient+occludent system more than any other climate.' },
        { step: 'Protect lips', method: 'Shea butter on lips throughout the day. Traditional lip treatments in West Africa include using shea, palm oil, and specific tree butters.', note: 'Balms with petrolatum or wax seals last longer than just oil on lips.' },
        { step: 'Scalp protection', method: 'Oil scalp heavily during Harmattan. Protective styles (braids, twists) reduce surface area exposed to dry air.', why: 'The scalp is skin — it dries and flakes during Harmattan just like the face.' },
        { step: 'Drink water', method: 'Internal hydration supports barrier function. During Harmattan, increased hydration is both a beauty and health necessity.', amount: 'Target 2.5-3L daily during peak Harmattan.' },
      ],
    },
    humidSeasonAdaptation: {
      title: 'Wet Season and Humid Coast Beauty',
      protocol: [
        'Switch from heavy shea butter to lighter formulas — water-based or gel moisturizers',
        'Double cleanse to remove sweat and sebum buildup',
        'Sweat-proof and waterproof formulas for makeup',
        'Anti-fungal ingredients (tea tree oil, neem) if prone to tinea versicolor',
        'Lighter hair products in high humidity to prevent buildup and frizz',
      ],
    },
    diasporan: {
      coldClimates: 'West African diaspora in UK, US (Northeast/Midwest), Canada experience winter conditions — cold, dry air is even more damaging than Harmattan for skin adapted to tropical origins. Heavy oils and occludents are essential in winter. Central heating further dries the air.',
      adaptations: ['Humidifier in bedroom during winter', 'Occludent sealing (Vaseline, heavy oils) immediately after bathing', 'Extra SPF — UV reflects off snow and is intense in winter despite cold'],
    },
  },

  'south-asian': {
    communityId: 'south-asian',
    communityName: 'South Asian',
    homeClimates: {
      tropical: { region: 'South India, Sri Lanka, Bangladesh coast', type: 'Hot and humid year-round. Monsoon. Intense UV.', beautyChallenge: 'Humidity-induced congestion. Sweat. UV-driven PIH and melasma.' },
      subtropical: { region: 'North India, Pakistan plains', type: 'Extreme temperature variation: brutal hot summer (40-48°C), cold winter.', beautyChallenge: 'Hot, dusty summer strips and congests skin. Cold winter requires rich emollients.' },
      himalayan: { region: 'Nepal, Northern Pakistan, Bhutan, Northeast India', type: 'Altitude-related extreme UV (more UV at higher altitude). Cold and dry.', beautyChallenge: 'High-altitude UV damage is extreme — skin aging accelerates without protection. Cold-dry combination requires heavy barrier support.' },
    },
    monsoonBeauty: {
      title: 'Monsoon Beauty Adaptation',
      description: 'The Indian monsoon season (June-September) transforms beauty needs. High humidity, rain, and warmth create specific skin and hair challenges.',
      skinCare: ['Lightweight gel moisturizers replace heavy creams', 'Double cleansing for pollution and sweat', 'AHA/BHA exfoliation for congestion from sweat and humidity', 'Matte or satin makeup finishes (dewy melts in high humidity)', 'SPF remains essential — UV still penetrates clouds'],
      hairCare: ['Monsoon causes frizziness — anti-humidity serums and oils', 'Increased scalp sensitivity and fungal risks (wet hair tied up leads to scalp issues)', 'Conditioning masks offset the drying effect of repeated rain exposure', 'Traditional: apply jasmine or coconut oil to hair before venturing out in rain'],
      ayurvedicNote: 'Ayurveda notes that Kapha season (late winter to early spring) and Pitta season (summer) create distinct skin and hair challenges. The monsoon season is transitional between Pitta and Vata — a time of particular imbalance and vulnerability for skin and hair.',
    },
    summerHeatBeauty: {
      title: 'Indian Summer Heat Beauty Protocol',
      cooling: ['Sandalwood paste applied to face — traditionally cooling for Pitta', 'Rose water mist throughout the day (cooling and anti-inflammatory)', 'Cucumber slices or cold cucumber juice on skin (ayurvedic cooling treatment)', 'Internal: coconut water, chaas (buttermilk), kokum sherbet — cooling and hydrating drinks for skin from within'],
      protection: ['SPF 50+ minimum — North Indian UV in summer is extreme', 'UV-protective clothing: full sleeves, dupattas, hats', 'Minimizing time in midday sun (10am-3pm UV peak)'],
    },
  },

  'caribbean': {
    communityId: 'caribbean',
    communityName: 'Caribbean',
    homeClimates: {
      tropical: { type: 'Hot, humid, and sunny year-round. Hurricane season (June-November). Trade winds moderate heat.', avgHumidity: '70-85% year-round', avgUV: 'Extremely high — UV index 9-11 year-round', beautyChallenge: 'One of the highest UV exposures in the world. High humidity drives fungal skin issues. Saltwater and sun damage hair.' },
    },
    caribbeanBeautyEnvironment: {
      ocean: {
        skinBenefit: 'Seawater contains magnesium, which can soothe inflammation and psoriasis. The clean Caribbean ocean (when unpolluted) is a skin treatment in itself.',
        skinChallenge: 'Saltwater is dehydrating — strip oils and leave skin tight. Must moisturize thoroughly after ocean swimming.',
        hairBenefit: 'Some find a small amount of salt water adds texture and curl definition to hair.',
        hairChallenge: 'Saltwater damages hair over repeated exposure — strips protein bonds. Pre-treatment with coconut oil before swimming is traditional Caribbean hair care.',
      },
      sun: {
        beautyEffect: 'Sun bleaches and dries hair, degrades color-treated hair faster, tans skin (welcome or not), speeds skin aging, drives PIH.',
        protection: ['SPF 30-50+ daily on all exposed skin', 'UV-protective hair products or oils before sun exposure', 'Wide-brim hats for hair and skin (traditional Caribbean sun hats are functional as well as fashionable)'],
      },
      humidity: {
        skinEffect: 'High humidity keeps skin naturally moisturized — dehydration is less of a concern than in dry climates. But it also means heavier products cause congestion.',
        hairEffect: 'Humidity causes frizz in textured hair by causing the hair cuticle to expand and absorb moisture unevenly.',
        adaptations: ['Lightweight, water-based moisturizers — no need for heavy oils daily in high humidity', 'Anti-humidity leave-in treatments for hair (glycerin in humid climates can help)', 'Protective styles (braids, twists) lock hair in place in high humidity'],
      },
    },
    islandProtocols: {
      preBeachRoutine: ['Apply SPF to all exposed skin 20 minutes before sun exposure. Reapply every 2 hours.', 'Apply coconut oil to hair before beach to protect from salt and UV', 'Hydrate well before entering sun'],
      postBeachRoutine: ['Rinse salt water from hair immediately', 'Apply fresh aloe vera or an aloe-based product to sun-exposed skin', 'Deep condition hair after beach exposure', 'Hydrate thoroughly from the inside'],
    },
  },

  'arab': {
    communityId: 'arab',
    communityName: 'Arab Middle Eastern',
    homeClimates: {
      desert: { region: 'Gulf countries (UAE, Saudi, Kuwait, Qatar, Bahrain), parts of Jordan, Iraq', type: 'Extreme desert climate. Temperatures 40-50°C in summer. Humidity 20-50%. Indoor air conditioning at 18-22°C = extreme contrast.', beautyChallenge: 'The indoor-outdoor temperature and humidity swing is brutal on skin. Outdoors: extreme heat + UV. Indoors: extreme cold from AC + dry air. The barrier is constantly adapting.' },
      mediterranean: { region: 'Lebanon, Syria, parts of Morocco, coastal Algeria', type: 'Mediterranean climate — hot dry summer, mild wet winter. More temperate than desert.', beautyChallenge: 'Summer UV, dry heat.' },
      northAfrican: { region: 'Egypt, Libya, Tunisia, Morocco interior', type: 'Hot and dry in the south. Mediterranean in the north. Intense UV everywhere.', beautyChallenge: 'UV damage, dust (khamsin/sirocco winds bring sandstorms), dehydration.' },
    },
    desertBeautyStrategies: {
      acContrast: {
        title: 'The AC Contrast Problem — Gulf Countries',
        problem: 'Going from 45°C heat outdoors to 18°C air-conditioned space and back causes repeated thermal and humidity shock to the skin. The AC is typically very dry air. This cycle dries the skin barrier significantly.',
        solution: [
          'Keep a face mist or rose water spray in the car and office',
          'Humidifier in indoor spaces (AC makes air very dry)',
          'Layer skincare: humectant + emollient to hold moisture through AC',
          'Do not use retinol or AHAs on days you have outdoor exposure — they increase UV sensitivity',
        ],
      },
      dustStorms: {
        title: 'Khamsin, Shamal, and Sirocco — Desert Wind Events',
        description: 'Desert winds (khamsin in Egypt, shamal in the Gulf, sirocco in North Africa) bring sandstorms and particulate matter. Fine dust penetrates skin and worsens inflammation.',
        protocol: ['Double cleanse after a dust event', 'Wear a face covering (not just SPF) during dust events — physical barrier', 'Avoid active ingredients (AHAs, retinol) after dust event until skin recovers'],
      },
    },
    hammamSeasonality: {
      description: 'The hammam tradition in North Africa and the Levant traditionally follows seasonal rhythms. Summer hammam is lighter — hydration focus. Winter hammam is deeper exfoliation and warming treatments. This reflects how the climate dictates the beauty ritual.',
    },
  },

  'latina': {
    communityId: 'latina',
    communityName: 'Latina',
    homeClimates: {
      tropical: { region: 'Caribbean (Cuba, Puerto Rico, Dominican Republic), Central America coast, Amazon basin', type: 'Hot, humid, tropical.', beautyChallenge: 'Same as Caribbean — UV, humidity, sweat, fungal concerns.' },
      highAltitude: { region: 'Mexico City (2200m), Bogotá (2600m), Quito (2850m), La Paz (3600m), Lima (sea level but high UV)', type: 'High altitude means more UV, even when temperatures are mild. Mexico City and Bogotá can be quite cool.', beautyChallenge: 'High-altitude UV damage is underestimated. At 2500m, UV exposure is significantly higher than at sea level. Indigenous communities at high altitude developed specific practices.' },
      desert: { region: 'Northern Mexico, coastal Peru, northern Chile', type: 'Desert and semi-arid conditions.', beautyChallenge: 'Dehydration, dry skin, intense UV.' },
    },
    highAltitudeBeauty: {
      title: 'Belleza en las Alturas — High Altitude Beauty',
      uvReality: 'For every 300m gain in altitude, UV radiation increases approximately 4%. At Mexico City\'s 2200m, UV is roughly 30% more intense than at sea level for the same latitude. Many Latinas live in high-altitude cities without realizing their UV exposure is significantly elevated.',
      andeanWisdom: 'Indigenous Andean communities have used quinoa (as a mild exfoliant and brightening ingredient), maca root, and native plant extracts for skin care adapted to high altitude conditions.',
      protocol: ['SPF 50+ — not negotiable at high altitude', 'Vitamin C serum for antioxidant protection against elevated UV', 'Heavier moisturizer at high altitude (thin air dehydrates skin faster)', 'Stay extra hydrated — altitude increases water loss through respiration'],
    },
    tropicalAdaptation: {
      humidity: 'Lightweight water-based formulas. Clay masks weekly for oil control. Mattifying primers. Gel cleansers twice daily.',
      UV: 'High UV across most of Latin America — Sao Paulo and Caracas both have UV index 11+ in summer. SPF 50+ is the baseline.',
    },
  },

  'east-asian': {
    communityId: 'east-asian',
    communityName: 'East Asian',
    homeClimates: {
      japan: { type: 'Temperate with four distinct seasons. Humid summer (tsuyu rainy season). Cold, dry winter. Moderate UV.', beautyChallenge: 'The four seasons require four significantly different skincare routines. Humidity in summer, dryness in winter, transitions in spring and fall.' },
      korea: { type: 'Cold, dry winter. Hot humid summer. Yellow dust (hwangsa) from Chinese deserts in spring.', beautyChallenge: 'Severe winter dryness (the original reason for multi-step hydration routines). Yellow dust (fine particulate) damages skin in spring. Hot summer humidity.' },
      china: { type: 'Enormously varied — tropical in south (Guangdong), cold in northeast (Heilongjiang), arid in northwest (Xinjiang), temperate in central and east coast.', beautyChallenge: 'Air pollution (PM2.5) in Beijing, Shanghai, and other major cities is a significant skin concern — fine particulate matter penetrates skin and accelerates aging and inflammation.' },
    },
    koreaWinterDryness: {
      title: 'Why Korean Skincare Evolved From Cold Winters',
      history: 'The Korean winter is cold, dry, and harsh — Seoul winters regularly hit -10°C with low humidity. This is a major reason why Korean skincare developed the most sophisticated hydration routines in the world. The multi-step essence system, the 7-skin method, the rich emulsion-then-cream layering — all of this developed in response to brutal winter dryness.',
      winterProtocol: ['Layer moisture in multiple thin layers (7-skin method)', 'Add a rich sleeping pack (occlusive night cream) as the final step', 'Humidifier in bedroom — Korean winters require it', 'Switch from gel/water-based moisturizer to emulsion + cream system'],
    },
    summerHumidityAdaptation: {
      title: 'Korean and Japanese Summer — High Humidity Beauty',
      protocol: ['Double cleansing becomes even more important in summer sweat', 'Water-based sunscreen (Korean sunscreens are the global gold standard for texture)', 'Blotting papers — a traditional and modern tool for oil management in humid heat', 'Sheet masks stored in the fridge — cold sheet mask in summer is a Korean summer staple'],
    },
    yellowDustProtocol: {
      title: 'Hwangsa (Yellow Dust) / Pollution Beauty Protocol',
      whatIs: 'Yellow dust from Chinese and Mongolian deserts blows into Korea and Japan in spring. Combined with pollution, PM2.5 and PM10 levels spike dramatically.',
      beautyImpact: 'Particulate matter deposits on skin, accelerates oxidative damage, clogs pores, and causes inflammation.',
      protocol: ['Wear a mask when air quality is poor (this became reflexive in Korea and Japan before COVID)', 'Double cleanse on high-pollution days', 'Add an antioxidant serum (vitamin C, niacinamide) to neutralize oxidative damage', 'Cleanse face immediately upon returning indoors'],
    },
  },

  'east-african': {
    communityId: 'east-african',
    communityName: 'East African',
    homeClimates: {
      horn: { region: 'Somalia, Djibouti, Eritrea coast', type: 'Hot and dry. Monsoon season. Intense UV.', beautyChallenge: 'Extreme heat and UV. Dry air strips skin.' },
      ethiopianHighlands: { region: 'Ethiopian plateau, Addis Ababa (2300m), Gondar, Harar', type: 'High altitude (Addis is 2300m). Surprisingly cool temperatures for equatorial latitude. But high UV despite mild temperatures — altitude effect.', beautyChallenge: 'High altitude UV. The cool, relatively dry air. Wide temperature swings between day and night.' },
      eastAfricanCoast: { region: 'Mombasa, Dar es Salaam, Zanzibar', type: 'Humid tropical coast. Indian Ocean influences.', beautyChallenge: 'Humidity, UV, saltwater exposure.' },
    },
    ethiopianAltitudeBeauty: {
      description: 'Addis Ababa at 2300m receives significantly more UV than cities at sea level at the same latitude. Ethiopian women have traditionally used injera-making steam, coffee ceremony steam, and frankincense incense as part of a holistic beauty and wellness practice — all of which may provide some benefit in the altitude-induced dry air.',
      protocol: ['SPF in Addis and the highlands is important despite the cool, cloudy feeling — altitude UV is deceptive', 'Frankincense oil is especially beneficial at high altitude for its barrier-supporting and anti-inflammatory properties', 'Honey masks combat the drying effect of altitude'],
    },
    monsoonCoastBeauty: {
      dryNorthEast: 'Somalia and Djibouti have very limited rainfall. The skin becomes severely dry without consistent, heavy emollient application. Camel milk has been the traditional hydrator in extremely dry, hot environments — it provides moisture and nutrition.',
      eastCoast: 'The Swahili coast has distinct monsoon seasons (kusi in June-September, kaskazi in December-February) that dramatically change humidity and winds. Beauty routines shift significantly between seasons.',
    },
  },

  'south-african': {
    communityId: 'south-african',
    communityName: 'South African',
    homeClimates: {
      cape: { region: 'Cape Town and Western Cape', type: 'Mediterranean climate — dry hot summer, wet mild winter. Fynbos biome.', beautyChallenge: 'Summer UV in Cape Town is extreme. The "Cape Doctor" (SE wind) is very drying. Dry summer air.' },
      highveld: { region: 'Johannesburg, Pretoria, Mpumalanga', type: 'High altitude (1700m+), summer thunderstorms, winter dry cold. Intense UV all year due to altitude.', beautyChallenge: 'Johannesburg UV is intense and year-round. The altitude-UV effect means SPF is non-negotiable. Winter is cold and dry (Highveld winter is more European than tropical).' },
      kzn: { region: 'KwaZulu-Natal (Durban)', type: 'Subtropical. Hot and humid year-round. High UV.', beautyChallenge: 'Humidity management. High UV. Muggy heat.' },
    },
    johansburgWinterBeauty: {
      description: 'Johannesburg winter is often surprising — at 1700m elevation, Joburg gets cold, dry air and frost. This is dramatically different from KwaZulu-Natal or Cape summer. Joburg skin in winter needs more barrier support than most South Africans expect.',
      protocol: ['Add marula oil as an overnight occlusive', 'Rooibos toner is anti-inflammatory and good for the stressed winter barrier', 'Aloe ferox gel is soothing for cold-weather redness'],
    },
    southAfricanUV: {
      description: 'South Africa has some of the highest UV radiation in the Southern Hemisphere. The Highveld\'s altitude and the clear summer skies combine with proximity to the ozone hole (which is periodically present over southern latitudes) to create very high UV exposure.',
      spfRule: 'SPF 50+ is the baseline across South Africa for all skin tones — the ozone hole and altitude make this non-negotiable.',
      localAssets: 'South Africa is one of the best-placed countries in the world to develop sun-protective botanicals — rooibos (aspalathin reduces UV damage), aloe ferox, kalahari melon seed oil. Local products that incorporate these are genuinely beneficial.',
    },
  },

  'black-american': {
    communityId: 'black-american',
    communityName: 'Black American',
    climateVariation: {
      description: 'The United States spans an enormous climate range — from tropical South Florida to subarctic Alaska, from humid Southeast to arid Southwest to cold Midwest and Northeast winters. Black Americans are concentrated in historically specific geographic areas: the Southeast, the Northeast, and urban centers across the country. Each climate creates distinct beauty challenges.',
    },
    southEastBeauty: {
      region: 'Southeast US: Georgia, Alabama, Mississippi, South Carolina, Louisiana, Florida, Texas',
      climate: 'Hot, humid summers. Mild winters (except upper Southeast). High summer UV.',
      challenges: ['Sweat and humidity causing breakouts and fungal skin issues', 'Humidity and textured hair (frizz, moisture retention issues)', 'High summer UV driving PIH in already PIH-prone skin'],
      adaptations: ['Gel and water-based moisturizers in summer', 'Anti-humidity leave-in products for hair', 'Clay masks for weekly congestion clearing', 'Minimum SPF 30 daily — Black Americans in the Southeast are in high-UV conditions without realizing it because of the persistent SPF myth'],
    },
    northEastWinterBeauty: {
      region: 'Northeast: New York, New Jersey, Pennsylvania, Massachusetts, Connecticut',
      climate: 'Cold winters (-5 to -15°C). Indoor heat very dry. Wind chill strips skin.',
      challenges: ['Ash: visible in winter when heating and cold air strip moisture from melanin-rich skin', 'Indoor heating creates ultra-dry air (worse for skin than outdoor cold)', 'Cold wind strips barrier function'],
      adaptations: ['The OG solution: Vaseline. Applied to damp skin before going outside. This was grandmother\'s wisdom and dermatology validated it.', 'Rich shea butter-based moisturizers in winter (lighter in summer)', 'Humidifier in bedroom essential', 'Lip balm with occlusives — Black women\'s lips are prominent and need protection'],
    },
    centralHeatingEffect: {
      description: 'Central heating (particularly in the Northeast and Midwest winter) creates indoor environments with 15-30% humidity — lower than the Sahara Desert. This is why Black Americans report significant "ash" and dry skin in winter despite being indoors — the heating system is stripping moisture from the air.',
      solutions: ['Humidifier — the single most impactful winter beauty investment', 'Sealing products (Vaseline, Aquaphor, heavy oils) immediately after bathing', 'Overnight "slugging" skin treatment in winter months'],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL CLIMATE BEAUTY ADAPTATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const UNIVERSAL_CLIMATE_BEAUTY = {
  climateTypes: {
    hot_humid: {
      title: 'Hot and Humid Climate Beauty',
      skinStrategy: 'Lightweight products. Oil control focus. Antifungal awareness.',
      products: ['Water-based/gel moisturizer', 'Foaming or micellar cleanser', 'Matte or satin sunscreen', 'BHA exfoliant 1-2x weekly for congestion'],
      hair: 'Anti-humidity serums. Protective styles. Co-wash or hydrating shampoo.',
      avoid: ['Heavy creams', 'Oils as standalone face moisturizer', 'Heavy occlusive products'],
    },
    hot_dry: {
      title: 'Hot and Dry Climate Beauty',
      skinStrategy: 'Maximum moisture retention. Barrier sealing. UV protection.',
      products: ['Rich emollient moisturizer', 'Facial oil as occlusive over moisturizer', 'SPF 50+', 'Humectant serum (hyaluronic acid, glycerin)'],
      hair: 'Leave-in conditioner. Protective styles. Oil-based sealants.',
      avoid: ['Alcohol-based toners', 'Harsh exfoliants that strip barrier', 'Skipping moisturizer because "it feels okay"'],
    },
    cold_dry: {
      title: 'Cold and Dry Climate Beauty',
      skinStrategy: 'Barrier repair and maintenance. Indoor humidity management. Rich emollients.',
      products: ['Ceramide-rich moisturizer', 'Occludent (Vaseline, petrolatum) as final step', 'Gentle cleanser (no harsh surfactants)', 'Bedroom humidifier'],
      hair: 'Moisture retention — the cold air wicks moisture from hair. LOC method.',
      avoid: ['Foaming cleansers (strip barrier in cold)', 'Over-exfoliation', 'Hot showers (strip oils)'],
    },
    temperate_variable: {
      title: 'Temperate (Variable Season) Climate Beauty',
      skinStrategy: 'Seasonal routine adjustment.',
      protocol: ['Summer: lighter versions of everything. Gel moisturizer. SPF.', 'Fall: transition to richer products as temperatures drop.', 'Winter: full cold-dry protocol (above). Add occlusives.', 'Spring: transition back to lighter. Possible allergen-season skin reactivity.'],
    },
  },

  pollutionBeauty: {
    title: 'High-Pollution City Beauty Protocol',
    applicableCities: ['Beijing', 'Delhi', 'Karachi', 'Dhaka', 'Seoul', 'Jakarta', 'Lagos', 'Accra', 'Cairo'],
    whatPollutionDoes: 'PM2.5 particulate matter (fine soot, dust) deposits on skin and penetrates follicles. Polycyclic aromatic hydrocarbons (PAHs) and heavy metals in city air generate free radicals on skin contact. Result: accelerated aging, inflammation, hyperpigmentation, acne.',
    protocol: [
      'Double cleanse daily (oil cleanser to dissolve pollution-bound to skin oils, then water-based cleanser)',
      'Antioxidant serum (vitamin C, niacinamide) to neutralize free radicals from pollution',
      'Physical SPF or clothing as a pollution barrier (in addition to UV protection)',
      'Clay mask weekly to draw out pollutant deposits',
      'Indoor air purifier as an investment in skin health',
    ],
  },

  seasonalTransitions: {
    description: 'Skin needs the greatest adjustment support during seasonal transitions — when the body and skin barrier are adapting to new conditions.',
    springSensitivity: 'Skin sensitized by winter barrier stress meets pollen allergens. Common: redness, rash, contact dermatitis. Approach: reduce active ingredient use. Increase soothing ingredients (centella, aloe, chamomile).',
    fallBarrierPrep: 'Introduce richer products 4-6 weeks before winter hits. Skin begins to adapt gradually rather than being shocked by sudden cold.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export function getClimateBeautyGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_CLIMATE_BEAUTY_GUIDES['west-african'],
    'south-asian': ETHNIC_CLIMATE_BEAUTY_GUIDES['south-asian'],
    'caribbean': ETHNIC_CLIMATE_BEAUTY_GUIDES['caribbean'],
    'arab': ETHNIC_CLIMATE_BEAUTY_GUIDES['arab'],
    'latina': ETHNIC_CLIMATE_BEAUTY_GUIDES['latina'],
    'east-asian': ETHNIC_CLIMATE_BEAUTY_GUIDES['east-asian'],
    'east-african': ETHNIC_CLIMATE_BEAUTY_GUIDES['east-african'],
    'south-african': ETHNIC_CLIMATE_BEAUTY_GUIDES['south-african'],
    'black-american': ETHNIC_CLIMATE_BEAUTY_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

export const CLIMATE_BEAUTY_STATS = {
  moduleId: 'climate_beauty_ethnic_guide',
  communitiesCovered: 9,
  climateTypesCovered: 8,
  version: '1.0.0',
};
