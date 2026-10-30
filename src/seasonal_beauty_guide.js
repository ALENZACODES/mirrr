/**
 * MIRRR — Seasonal Beauty Guide
 * Adapting skincare, haircare, and makeup routines for all four seasons,
 * climate zone variations, and skin-of-colour seasonal challenges.
 */

export const SEASONAL_SKIN_SCIENCE = {
  title: 'How Seasons Affect Skin Biology',
  summary: 'Skin is not a static organ — it responds dynamically to environmental changes in temperature, humidity, UV index, wind, and air quality. Adapting your routine seasonally is not a trend; it is biologically rational.',
  howSkinChanges: {
    humidity: {
      highHumidity: 'In humid environments, the air contains significant water vapour; humectant ingredients (glycerin, hyaluronic acid) in skincare draw moisture from this ambient humidity into the skin; skin feels more comfortable; oiliness may increase as the skin does not need to compensate with sebum for moisture loss',
      lowHumidity: 'In dry environments (indoor heating in winter, air conditioning, desert climates), the air contains very little moisture; humectants in skincare may actually draw moisture FROM the skin if no ambient moisture is available (the "reverse humectant effect" in very dry air); more occlusive products are needed to prevent TEWL; skin tends toward dryness, flaking, and sensitivity in low humidity',
      TEWL: 'Transepidermal Water Loss (TEWL) increases in cold, dry winter air and in low-humidity air-conditioned environments; this is why the same moisturiser that works in summer may not be sufficient in winter'
    },
    temperature: {
      cold: 'Cold temperatures constrict blood vessels in the skin (vasoconstriction); skin looks paler and less rosy; sebum (oil) production slows in cold temperatures, making naturally oily skin look more matte; cold wind strips the acid mantle and causes chapping of exposed skin (cheeks, lips, nose)',
      heat: 'Heat dilates blood vessels (vasodilation); skin looks more flushed or rosy; sweat production increases for temperature regulation; sebum production increases; pores appear more visible; acne-prone skin may worsen in heat and humidity due to increased sebum and bacterial activity'
    },
    UV: {
      seasonalVariation: 'UV radiation intensity is highest in summer (especially at high altitude or near the equator), lower in winter; however, UV radiation penetrates clouds (up to 80% of UV passes through overcast sky) and reflects off snow (snow reflects up to 80% of UV — nearly doubling exposure); SPF is essential in all seasons and all weather',
      UVAvsUVB: 'UVA (aging) rays are relatively consistent year-round; UVB (burning) rays vary more seasonally and by latitude; UVA is the primary cause of photodamage and skin cancer; SPF values measure UVB protection; PA+++ or broad-spectrum labelling indicates UVA protection'
    }
  }
};

export const WINTER_ROUTINE = {
  title: 'Winter Beauty Routine',
  skincarePrinciples: {
    switch: 'The winter skincare switch: from lighter gel moisturisers and serums to richer cream formulas; from oil-free products to oil-inclusive; from emphasis on actives to emphasis on barrier support',
    barriers: 'Barrier-supportive ingredients become even more important in winter: ceramides, fatty acids, cholesterol, peptides; reduce frequency of AHAs, retinoids, and vitamin C if skin becomes sensitive; consider pausing certain actives entirely if skin is reactive',
    cleanser: 'Switch from gel or foaming cleansers to cream or oil-based cleansers; avoid sulphate-heavy formulas; a milky cleansing balm is ideal for winter'
  },
  layering: {
    strategy: 'In winter, layering thin layers of moisture is effective: humectant serum → cream moisturiser → face oil → optional thin SPF layer; the SPF may need to be adjusted to one that does not feel drying on sensitive winter skin',
    sluggingWinter: 'Winter is the ideal season for slugging (petroleum jelly as final step); the cold, dry air makes TEWL prevention critical; nightly slugging can dramatically improve winter skin comfort',
    bodilyHydration: 'Internal hydration matters more in winter when people tend to drink less water; warm herbal teas count toward hydration; the central heating of modern homes is drying for the body from inside'
  },
  humidifier: 'A humidifier in the bedroom (running at night) adds moisture back to the indoor air; particularly important in centrally heated homes; target 40-60% indoor relative humidity; a simple stick-on hygrometer shows current indoor humidity',
  makeupForWinter: {
    base: 'In winter, opt for hydrating or dewy-finish foundations rather than matte; cream formulas rather than powder; powder foundations on dry winter skin can look patchy and accentuate dry areas',
    blush: 'A flush of blush is more important in winter when the skin looks paler (vasoconstriction); a pink or berry flush on the apples of the cheeks adds warmth to winter skin',
    lip: 'Winter lips: lip balm under any lip product; long-lasting or transfer-resistant formulas for cold weather outdoor activities (kissing the cheeks of relatives, wearing a scarf); avoid very matte formulas on already-dry lips'
  },
  hairInWinter: {
    static: 'Static electricity in dry winter air causes hair fly-aways and tangles; wool hats and scarves exacerbate this; anti-static hair products (lightweight silicone serums, hair oil) help',
    hatHair: 'Hat hair: compression from hats flattens hair; refresh with a volumising spray or dry shampoo after hat removal; for curly hair, a silk or satin-lined hat prevents frizz from wool rubbing against curls',
    dryness: 'Winter drying affects hair as well as skin; deep conditioning becomes more important; reduce heat styling frequency in winter'
  }
};

export const SUMMER_ROUTINE = {
  title: 'Summer Beauty Routine',
  skincarePrinciples: {
    switch: 'The summer skincare switch: from heavy creams to lighter gels and lotions; from maximum moisture to adequate moisture; from minimal SPF to year-round maximum SPF; from minimal sweat management to active sweat management',
    SPF: 'Summer SPF upgrade: ensure SPF reapplication every 2 hours when outdoors (not just morning application); keep a SPF mist or stick for easy reapplication; SPF 50+ recommended for extended outdoor exposure',
    acne: 'For acne-prone skin: heat and humidity increase sebum and bacterial growth; switch to oil-free and non-comedogenic products; use salicylic acid wash during high-heat periods; keep face washing cloths clean (bacteria grow faster in heat)'
  },
  summertimeMakeup: {
    longevity: 'Makeup longevity is the main summer challenge; heat and sweat break down makeup faster',
    techniques: ['Prime: a good primer creates a barrier between skin and makeup that improves longevity in heat', 'Setting spray: a hard-mist setting spray used before and after makeup application dramatically extends wear in heat and humidity', 'Powder: a light dusting of translucent setting powder over foundation (especially the T-zone) absorbs sweat and reduces breakdown', 'Waterproof formulas: waterproof mascara, eyeliner, and foundation are non-negotiable for swimming, outdoor events, or high-heat festivals'],
    lessIsMMore: 'The heaviest foundation looks will break down fastest; summer is the ideal season for lighter coverage BB cream, tinted SPF, or a mix of concealer + SPF — the skin tends to look better naturally in summer (warmth, some sun) and requires less coverage',
    eyeShadow: 'Eyeshadow primer is especially important in summer; heat causes eyeshadow crease very quickly without it'
  },
  sunCare: {
    bodySPF: 'Full-body SPF is non-negotiable in summer; most people apply enough SPF to their face but neglect the body; SPF 30+ applied generously on all exposed body skin',
    reapplication: 'Most people apply 1/4 to 1/2 the recommended SPF amount; the FDA recommends 2mg/cm² (approximately a teaspoon for the face alone); a generous application is essential for the labelled SPF protection',
    afterSun: 'After-sun care: aloe vera gel (pure, from the plant or a simple refrigerated formula) for cooling and soothing; green tea-based products for antioxidant repair; ceramide moisturiser to repair UV-stressed barrier; never intentionally sunburn'
  }
};

export const SPRING_AUTUMN_TRANSITIONS = {
  title: 'Spring & Autumn Transition Routines',
  spring: {
    skincarePrinciples: 'Spring transition: gradual switch from heavy winter products to lighter spring formulas; the skin is acclimatising to increased sun and temperature; reintroduce actives (retinoids, AHAs) carefully after winter hibernation; SPF becomes more critical as UV index rises',
    allergyAndSkin: 'Spring allergies (hay fever, pollen) cause itchy eyes, inflammation, and can worsen facial redness and sensitivity; antihistamines help but can dry mucous membranes including skin; for allergy season, prioritise gentle and calming skincare (centella asiatica, green tea, aloe)',
    makeupTransition: 'In spring: transition from heavy coverage winter bases to lighter foundations; from heavy powder to light setting spray; introduce more colour with spring palettes (pastels, fresh peach and pink tones)'
  },
  autumn: {
    skincarePrinciples: 'Autumn transition: begin adding barrier-supportive products back in; the decrease in humidity begins; repair any summer sun damage with antioxidant serums (vitamin C) and niacinamide; this is the ideal season to start a retinoid routine (less UV = less photosensitivity concern)',
    retinoidSeason: 'Autumn is the best time to start retinoids: UV intensity is decreasing, the skin is less likely to be significantly photosensitised; a full retinoid routine established in autumn can be maintained through winter',
    makeupTransition: 'In autumn: transition to richer-finish foundations; introduce warm autumn palettes (terracotta, burnt orange, burgundy, forest green)'
  }
};

export const ETHNIC_SEASONAL_GUIDE = {
  'west-african': {
    seasonalContext: 'West Africans living in West Africa experience distinct dry and wet seasons (harmattan and rainy season) rather than the four European seasons; West African diaspora in Europe and North America experience dramatic climate shock in winter',
    harmattan: {
      what: 'The Harmattan is the dry, dusty trade wind that blows from the Sahara across West Africa from November to March; it brings very low humidity (sometimes under 10%), cool nights, and a fine red dust',
      skinEffect: 'The Harmattan is notorious for causing severely dry and ashy skin; the combination of low humidity and fine dust is extremely drying; traditional response is heavy shea butter application to entire body, face protection with oils',
      hairEffect: 'Harmattan causes severe hair dryness and breakage; traditional protective strategies include heavy oil coating of hair, head coverings, protective styles under wraps'
    },
    diaspora: 'West African diaspora living in UK, Europe, or North America often experience their first severe winter as a dramatic challenge for skin and hair: the shea butter and oils used for Harmattan may not be enough for European or North American winter + central heating; adjustment to heavy-duty barrier-repair products',
    recommendations: ['During Harmattan or cold/dry winters: heavy shea butter body oiling twice daily', 'Protective styles for hair during dry season', 'SPF is important in West Africa\'s high-UV tropical climate year-round', 'Rainy season/summer: lighter products, oil control for increased humidity and heat']
  },
  'south-asian': {
    seasonalContext: 'South Asia has monsoon season (June-September, high humidity), winter (December-February, dry and cool in the north), summer (March-June, extreme heat), and moderate periods; immigration to Western climates creates dramatic seasonal experience differences',
    monsoon: 'During monsoon season: high humidity increases sweat and oil production; acne may worsen; lighter skincare; salicylic acid face wash; oil-control primers and setting powders are essential; hair frizz in humidity can be managed with anti-humidity serums or buns/braids',
    indianSummer: 'Indian summer extremes: SPF is critical in North Indian summer heat; sweat-proof makeup is necessary; lightweight gel moisturisers; oil-free products',
    diaspora: 'South Asian diaspora in UK experience "British winter" which is cold, grey, low UV, and damp; South Asian skin in the UK winter can become very dry and sensitised; switch to richer skincare; don\'t reduce SPF (UV still present even in grey UK winter)',
    recommendations: ['Year-round SPF — South Asian skin is prone to melasma which worsens with any UV exposure', 'Monsoon: mattifying products, salicylic acid, lightweight layers', 'Winter: ceramide-rich moisturiser, oil pre-treatment for hair, humidifier']
  },
  caribbean: {
    seasonalContext: 'Caribbean climate is tropical with high year-round humidity and UV; seasonal variation is less dramatic; there is a hurricane season (June-November) and a cooler dry season (December-April); diaspora in North America or UK experience dramatic seasonal variation',
    tropicalClimate: 'In the Caribbean: year-round SPF is essential (year-round high UV); lightweight oil-control skincare; protective hairstyles for hair management in humidity; colourful, vibrant beauty aesthetics are appropriate year-round',
    diaspora: 'Caribbean diaspora (e.g., in New York, London, Toronto) experience severe winters after growing up in tropical climate; shea butter and cocoa butter are traditional responses to winter dryness; often need heavier products than they used growing up',
    recommendations: ['In tropical climate: consistent SPF, lightweight water-based products, oil control', 'In Northern winter diaspora: heavy emollient body care, barrier repair']
  },
  arab: {
    seasonalContext: 'Arab world has highly diverse climates: the Gulf (extreme summer heat and humidity, mild winter), the Levant (Mediterranean summers, cooler winters), North Africa (extreme desert summer heat, mild coastal, cold mountains), North African coast (Mediterranean climate)',
    gulfSummer: 'Gulf summer (40°C+, extreme humidity): staying indoors most of the day; air conditioning is ubiquitous; the transition from extreme outdoor heat to very cold air conditioning stresses the skin barrier; SPF always worn going outdoors; heavy makeup melts immediately outdoors — minimal outdoor makeup in Gulf summer',
    desertWinter: 'Desert winter (cold nights, dry): Saharan and Arabian desert winter nights can be very cold; low humidity year-round in desert climates; heavier moisturisers in winter',
    recommendations: ['Consistent SPF in all seasons — UV is extreme in Arab world; especially important for lighter-skinned Levantine communities who may think they don\'t need SPF', 'Air conditioning skin management: humidifier, ceramide moisturiser', 'Transition-proof makeup: setting spray, primers for temperature changes']
  },
  latina: {
    seasonalContext: 'Extremely diverse: Latin America spans tropical, subtropical, Andean, Patagonian, and desert climates; Caribbean Latinas: tropical; South American southern cone: temperate/cold winters; Central American: tropical to subtropical; diaspora in North America experience the full range of Northern seasons',
    tropical: 'Tropical Latin American climates: high UV (tropical UV is extremely intense), high humidity; lightweight skincare; oil control; consistent SPF',
    temperate: 'Temperate Latin American and diaspora: four-season adjustment; winter skincare becomes important especially after living in warmer climates',
    recommendations: ['High-UV Latin American climates: very high SPF essential; tropical UV can be extreme', 'Humidity management: oil-control products in tropical season', 'Winter for diaspora: shea butter, marula or avocado oil body care, ceramide face moisturiser']
  },
  'east-asian': {
    seasonalContext: 'East Asian countries have well-defined four seasons with significant seasonal variation; Japan, Korea, and northern China have cold, dry winters; southern China, Singapore, Taiwan, Malaysia have subtropical to tropical climates; Korean and Japanese beauty culture is deeply seasonally aware',
    koreaSeason: 'Korean beauty seasonal adaptation: spring — lighter layers, focus on brightening (vitamin C, niacinamide); summer — minimal makeup, high SPF, oil control; autumn — antioxidant repair; winter — heavy ceramide creams, facial oils, sleeping masks',
    japaneseSeason: 'Japanese seasonal skincare philosophy: deeply connected to seasonal beauty aesthetics (sakura in spring, fireworks in summer, autumn leaves in fall, snow in winter); the concept of "kiriwake" (切り替え — switching) beauty routines seasonally is standard',
    recommendations: ['Japan and Korea: dramatic seasonal switching of routine is standard and expected', 'Full-body SPF in summer for beach and outdoor activities (Japanese beach culture especially emphasises this)', 'Winter: layered moisture with essence and sleeping mask as standard']
  },
  'east-african': {
    seasonalContext: 'East Africa has multiple climatic zones: the Somali coast is hot and dry; Ethiopia has highland seasons (rainy June-September, dry); Kenya coastal is tropical; diaspora in North America or Europe experience dramatic climate changes',
    highUV: 'East African climates generally have high UV; consistent SPF is important but has historically low adoption rates; SPF with no white cast is especially important to encourage daily use',
    diaspora: 'East African diaspora (large communities in Minneapolis, London, Toronto, Oslo) experience extreme winters very different from their origin climates; heavy skin and hair care becomes important; Somali, Ethiopian, and Eritrean communities have seen significant growth in culturally specific beauty resources',
    recommendations: ['High UV: SPF daily; frankincense oil provides some antioxidant protection but not SPF equivalence', 'Diaspora winter: heavy body oiling, protective hair styles, ceramide face care', 'Maintaining body oiling traditions is both culturally grounding and practically effective for winter dryness']
  },
  'south-african': {
    seasonalContext: 'South Africa has varied climates: Cape Town (Mediterranean, wet winters, dry summers — reversed seasons for Southern Hemisphere); Johannesburg (high altitude, summer rains, dry sunny winters); KwaZulu-Natal (subtropical); far north (tropical)',
    southernHemisphere: 'IMPORTANT: South Africa\'s seasons are reversed from the Northern Hemisphere; summer is November-March; winter is June-August; this is critical when reading Northern Hemisphere beauty advice',
    highVeld: 'Johannesburg\'s high altitude (1,700m) means intense UV year-round; the dry Highveld winter is particularly hard on skin — very low humidity plus altitude-intensified UV; SPF is critical even in "winter"',
    recommendations: ['Year-round high SPF for all skin tones in South Africa\'s intense UV environment', 'Highveld winter: heavy moisturisation, marula or baobab oil for skin and hair barrier', 'Cape Town summer: dry, hot; oil control; high SPF']
  },
  'black-american': {
    seasonalContext: 'Black Americans primarily live in North America with its four-season cycle; regional variation from the humid Southeast (Atlanta, Houston) to cold Northeast (New York, Chicago) to mild West Coast (Los Angeles, Atlanta)',
    winter: {
      ashySkin: 'Winter dramatically worsens ashy skin for dark complexions; the combination of cold wind, low humidity, and central heating creates rapid TEWL; winter ashy skin requires heavy-duty responses',
      routine: ['Apply body lotion or butter while skin is still damp from the shower (traps the most moisture)', 'Layer shea butter or cocoa butter over lotion for maximum barrier protection', 'Vaseline or Aquaphor on dry patches', 'Humidifier in bedroom'],
      hair: 'Natural hair (especially 4A-4C) can become extremely dry and brittle in winter; protective styles (braids, twists, wigs) are both culturally meaningful and practically protective in winter; reduce wash frequency; deep condition weekly; silk pillow cases and satin bonnets prevent mechanical damage'
    },
    summer: {
      routines: 'Summer brings heat and humidity in most of the US; acne-prone skin needs oil control; body SPF is important especially for outdoor summer activities; the natural hair community has specific protocols for swimming (pre-swim coconut oil coat, rinse immediately after, deep condition after pool days)',
      poolCare: 'Chlorine is very drying and damaging to natural Black American hair textures; pre-swim protective coat with oil, rinse thoroughly immediately after swimming, deep condition after; swim caps are effective protection but compress curl patterns; silk-lined swim caps are available'
    }
  }
};

export function getSeasonalSkinScience() {
  return SEASONAL_SKIN_SCIENCE;
}

export function getSeasonalRoutine(season) {
  const map = {
    winter: WINTER_ROUTINE,
    summer: SUMMER_ROUTINE,
    spring: SPRING_AUTUMN_TRANSITIONS.spring,
    autumn: SPRING_AUTUMN_TRANSITIONS.autumn,
    fall: SPRING_AUTUMN_TRANSITIONS.autumn
  };
  return map[season.toLowerCase()] || null;
}

export function getEthnicSeasonalGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_SEASONAL_GUIDE['west-african'],
    'south-asian': ETHNIC_SEASONAL_GUIDE['south-asian'],
    caribbean: ETHNIC_SEASONAL_GUIDE.caribbean,
    arab: ETHNIC_SEASONAL_GUIDE.arab,
    latina: ETHNIC_SEASONAL_GUIDE.latina,
    'east-asian': ETHNIC_SEASONAL_GUIDE['east-asian'],
    'east-african': ETHNIC_SEASONAL_GUIDE['east-african'],
    'south-african': ETHNIC_SEASONAL_GUIDE['south-african'],
    'black-american': ETHNIC_SEASONAL_GUIDE['black-american']
  };
  return directMap[communityId] || null;
}

export const SEASONAL_BEAUTY_STATS = {
  moduleId: 'seasonal_beauty_guide',
  version: '1.0.0',
  topics: ['seasonal beauty', 'winter skincare', 'summer skincare', 'SPF all seasons', 'harmattan skin care', 'monsoon beauty', 'seasonal hair care', 'winter ashy skin', 'humidity and skin', 'TEWL winter', 'setting spray summer', 'waterproof makeup', 'slugging winter', 'retinoid season', 'K-beauty seasonal', 'kiriwake beauty', 'tropical beauty', 'Southern Hemisphere seasons', 'pool hair care', 'winter protective styles'],
  communitiesSupported: 9,
  keyFacts: [
    'Snow reflects up to 80% of UV radiation — nearly doubling UV exposure compared to bare ground; SPF is essential in winter, especially in snowy environments, not just summer',
    'The Harmattan (dry dusty trade wind from the Sahara) blows across West Africa from November to March with humidity sometimes under 10%; it is one of the most severe seasonal skin challenges globally, met traditionally with heavy shea butter application',
    'In Japan, seasonal switching of beauty routines ("kiriwake" 切り替え) is a standard cultural expectation, not a beauty industry gimmick; the products sold as "seasonal formulas" by Japanese beauty brands reflect genuine climate-biological need',
    'South Africa\'s seasons are reversed from the Northern Hemisphere; summer is November-March; winter is June-August; most international beauty seasonal advice must be reversed for South African context',
    'Autumn is the ideal season to start a retinoid routine: UV intensity is decreasing, meaning lower photosensitivity risk; a full retinoid routine established in autumn can be maintained through winter and evaluated for spring',
    'Chlorine (in swimming pools) is extremely drying and damaging to natural Black American hair textures; the recommended protocol is a pre-swim coconut oil coat, immediate post-swim rinse, and deep conditioning treatment after pool days'
  ]
};
