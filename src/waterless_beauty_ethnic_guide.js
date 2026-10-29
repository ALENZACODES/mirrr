/**
 * MIRRR — Waterless & Minimal Beauty Ethnic Guide
 * Water-free formulations, dry cleansing, minimal waste beauty by community
 * Topics: micellar water, dry shampoo, solid formulas, waterless skincare, conservation beauty
 */

// ============================================================
// WATERLESS BEAUTY SCIENCE
// ============================================================

export const WATERLESS_BEAUTY_SCIENCE = {
  overview: `Water is the most common ingredient in conventional beauty products — typically the first
  ingredient (50-70% of most formulas). Waterless beauty eliminates this by using anhydrous (water-free)
  bases of oils, waxes, butters, and silicones. Without water, formulations require no aqueous
  preservatives, are more concentrated (less product needed), generate less packaging waste, are
  lighter to ship, and are shelf-stable without refrigeration. Waterless beauty is both a sustainability
  revolution and often superior performance.`,

  whyWater: {
    traditional: 'Water in cosmetics serves as: solvent, texture modifier, humectant delivery vehicle, cost filler, vehicle for water-soluble actives',
    problem: [
      'Water breeds bacteria and mold — requires preservatives (parabens, phenoxyethanol, MIT)',
      'Water-containing products lose efficacy faster than waterless',
      'Water is heavy — increases shipping carbon footprint',
      'Water-containing products require plastic packaging (prevents contamination)',
      'Dilutes active ingredients — less efficacy per gram of product'
    ],
    solution: 'Anhydrous (waterless) formulas: more concentrated, more stable, fewer preservatives needed, often better performance'
  },

  anhydrousFormulas: {
    oilBased: {
      description: 'Oil-based cleansers, serums, moisturizers, balms',
      examples: ['Cleansing oils and balms', 'Facial oils', 'Oil serums with oil-soluble actives', 'Body oils'],
      benefits: 'No water = no aqueous preservation needed; stable; concentrated; melt on skin'
    },
    waterBased: {
      description: 'Wait — "water-based" is the category that USES water; this is the alternative',
      clarification: 'Truly waterless are OIL-BASED, POWDER, SOLID, or EMULSION FREE formulas'
    },
    powderBased: {
      description: 'Powder cleansers, powder masks, powder actives',
      examples: ['Enzyme powder cleansers', 'Clay masks', 'Vitamin C powder serum', 'Powder sunscreens'],
      benefits: 'Maximum stability; no preservation needed; user mixes with water at point of use; lightest shipping weight'
    },
    solidBars: {
      description: 'Solid shampoo bars, conditioner bars, facial bars, body bars',
      examples: ['Shampoo bars', 'Conditioner bars', 'Facial cleansing bars', 'Body butter bars', 'Tinted lip balm bars'],
      benefits: 'No plastic bottle needed; airport-friendly; lasts 2-3x longer than liquid equivalent; reduced packaging'
    },
    butters: {
      description: 'Plant butter as multi-purpose moisturizers without water phase',
      examples: ['Shea butter', 'Mango butter', 'Cocoa butter', 'Murumuru butter', 'Cupuaçu butter'],
      benefits: 'Single-ingredient; no preservatives; known composition; culturally authentic; long shelf life'
    }
  },

  waterConservation: {
    globalContext: 'Water scarcity affects 4 billion people for at least one month per year (UN Water); beauty industry water use is significant',
    beautyUse: 'Average woman uses 65 gallons of water per beauty routine over her lifetime estimate; waterless beauty reduces this',
    dryRegions: 'Communities in water-scarce regions (parts of Africa, Middle East, India) have centuries of waterless beauty tradition from necessity — now globally relevant',
    lowLather: 'Reducing water use: rinse-free cleansers, solid bars (require less water to lather and rinse), oil cleansers'
  },

  waterFreeCleansing: {
    micella: {
      name: 'Micellar Water',
      mechanism: 'Micelles: microscopic spheres; hydrophilic outer shell (water-loving) + lipophilic core (oil-loving); encapsulate oil-based dirt when swiped across skin',
      use: 'No water needed to rinse; gentlest cleanse option; ideal for sensitive skin, minimal makeup, morning cleanse',
      limitation: 'Not sufficient for heavy makeup, SPF, or heavily oiled skin; should be removed or followed by water cleanse in full routine'
    },
    creamCleanse: {
      name: 'Cleansing Cream / Balm',
      mechanism: 'Emulsifies makeup and sebum; tissue or cloth removal possible; optional water rinse',
      use: 'Remove heavy makeup without water (useful for festivals, camping, travel, water scarcity situations)'
    },
    oilCleanse: {
      name: 'Oil Cleansing',
      mechanism: 'Like-dissolves-like: oil dissolves sebum, sunscreen, and oil-based makeup',
      use: 'Massage onto dry skin; tissue or cloth remove; OR emulsify with a little water and rinse',
      noWater: 'Can be tissue-removed without water — useful in waterless situations'
    }
  }
};

// ============================================================
// DRY HAIR CARE
// ============================================================

export const DRY_HAIR_CARE = {
  overview: `Dry hair care — extending wash days without water — is most critically important for Type 4
  hair that should not be washed frequently. But all hair types benefit from products that extend
  styling between washes, reducing water and product use.`,

  dryShampoo: {
    overview: 'Dry shampoo absorbs excess scalp sebum without water; refreshes roots; extends styling',
    mechanism: 'Starch (rice, corn, arrowroot, tapioca) or silica absorbs oil; hair appears less greasy; may add volume',
    ingredients: {
      starch: 'Rice starch, cornstarch, arrowroot: natural options; may leave white cast on very dark hair if over-applied',
      silica: 'Colloidal silica: absorbs oil effectively; no white cast; premium option',
      aerosol: 'Conventional dry shampoo sprays use aerosol propellant + alcohol + starch; benzene contamination controversy in 2022'
    },
    darkHair: 'White cast issue: apply to roots under top layer; shake out; or use tinted dry shampoo matching hair color',
    type4: {
      appropriateness: 'Dry shampoo for Type 4 hair: less relevant as scalp is not as oily as straight hair; scalp spritz more useful',
      alternatives: 'Scalp spritz (water + leave-in), apple cider vinegar rinse, or scalp oil instead'
    },
    DIY: 'DIY dry shampoo: 2 tbsp arrowroot powder + 1 tsp baking soda + 5-10 drops essential oil; apply at roots, brush out'
  },

  noWashDayTechniques: {
    type12: {
      technique: 'Root refresh: dry shampoo at roots, volumizing spray on length, brush through, restyle',
      extend: 'Can extend 1-2 days typically'
    },
    type3: {
      technique: 'Refresh spray: water + leave-in conditioner + curl activator in spray bottle; spritz, scrunch, diffuse',
      extend: 'Can extend 3-5 days with pineapple at night and morning refresh'
    },
    type4: {
      technique: 'Scalp oil + retwist loose sections; bonnet overnight; protective style during extend period',
      extend: 'Protective styles (braids, twists) extend wash day 7-14 days or longer'
    }
  },

  waterlessStyling: {
    holdProducts: 'Gels, creams, and pomades can style without water; eco-styler, flaxseed gel, and shea butter-based creams',
    fingerStyle: 'Finger coiling on Type 4 without water: re-twisting individual coils with cream to refresh pattern',
    elongate: 'Banding: silky fabric bands stretched along wet or dry natural hair; elongates without heat'
  }
};

// ============================================================
// MINIMAL WASTE BEAUTY
// ============================================================

export const MINIMAL_WASTE_BEAUTY = {
  overview: 'Beauty industry generates significant waste: plastic bottles, single-use wipes, cotton rounds, applicators; sustainable alternatives exist for all categories',

  packaging: {
    plasticProblem: 'Global beauty generates 120 billion units of packaging annually; most not recyclable',
    alternatives: {
      glass: 'Glass bottles for serums and oils: recyclable; inert; premium feel',
      aluminumTins: 'Aluminum tins: infinitely recyclable; great for balms, solid formulas, butter',
      paperPulp: 'Paper pulp packaging: compostable; used by some clean beauty brands',
      refillable: 'Refillable systems: one permanent vessel; refill pouches at store or by mail; reducing packaging 90%',
      noPackage: 'No packaging at all: solid bars require no bottle; buy loose bulk cosmetics'
    }
  },

  singleUse: {
    problem: 'Cotton rounds, makeup wipes, single-use sheet masks contribute enormous waste',
    alternatives: {
      reusableRounds: 'Reusable bamboo or cotton rounds: wash with laundry; hundreds of uses vs one',
      konjac: 'Konjac facial sponge: plant fiber; biodegradable; gentle exfoliant; replaces multiple products',
      microfiber: 'Reusable makeup remover cloth: water + cloth removes all makeup; no product needed',
      beeswax: 'Beeswax food wraps repurposed for beauty storage; zero plastic'
    }
  },

  DIYBeauty: {
    overview: 'Making beauty products reduces packaging, avoids preservatives, allows customization',
    simple: [
      'Rosehip + argan + vitamin E oil: simple anti-aging facial oil; 3 ingredients',
      'Arrowroot + cocoa powder + cinnamon: DIY tinted powder/bronzer',
      'Shea butter + coconut oil + essential oils: body butter; 3 ingredients',
      'Apple cider vinegar + water (1:4): hair rinse; removes buildup; pH balances'
    ],
    advanced: [
      'Solid shampoo bar: SCI (sodium cocoyl isethionate) + BTMS (conditioning agent) + butters',
      'Vitamin C serum: L-ascorbic acid 10% + ferulic acid 0.5% + distilled water; pH 3-3.5; short shelf life'
    ]
  }
};

// ============================================================
// 9 COMMUNITY WATERLESS BEAUTY GUIDES
// ============================================================

export const ETHNIC_WATERLESS_BEAUTY_GUIDES = {
  'west-african': {
    communityName: 'West African',
    primaryConcerns: ['Water-scarce region traditions', 'Shea butter as waterless moisturizer', 'Type 4 wash day extension'],

    waterlessHeritage: {
      tradition: 'Sub-Saharan African beauty traditions developed in areas with limited water access — waterless beauty is ancestral',
      sheaButter: 'Shea butter applied direct to skin without water prep = ancestral waterless beauty; highly effective',
      oils: 'Direct application of plant oils without water-based products: moringa, shea, coconut, marula'
    },

    currentPractice: {
      moisturize: 'Shea butter or marula oil direct to skin after mild cleanse (or with minimal water) is complete routine',
      hair: 'Type 4 hair: extend wash day with scalp oil + re-twist + bonnet; 7-14 day intervals',
      cleanse: 'Micellar water or oil cleanse for days without full shower; tissue remove'
    },

    waterConservation: {
      awareness: 'Many West Africans in diaspora are conscious of water scarcity connections to home countries',
      practice: 'Shorter showers; oil cleanse instead of water-intensive cleanse; solid bars'
    },

    advice: `West African beauty wisdom is essentially waterless beauty — shea butter directly on skin
    without a water base has been the tradition for generations. This isn\'t a trend; it\'s the original
    formulation. A complete daily face routine: micellar water cleanse (pad removal, no rinse needed) +
    2-3 drops moringa oil or argan = done. Body: shea butter straight from the container. Hair: see
    minimal manipulation protocol with bonnet and scalp oil. The entire waterless beauty movement
    is West African ancestral practice arriving in global consciousness.`
  },

  'south-asian': {
    communityName: 'South Asian',
    primaryConcerns: ['Oil-based Ayurvedic beauty', 'Water conservation in India', 'Powder-based traditions (ubtan)'],

    waterlessHeritage: {
      ayurveda: 'Ayurvedic abhyanga (oil massage) applied without water first; traditional waterless beauty practice',
      ubtan: 'Ubtan: dry powder formula mixed fresh with minimal water or milk; the original powder cleanser',
      oils: 'Coconut, sesame, almond, bhringraj oils applied directly — Ayurvedic anhydrous beauty tradition'
    },

    currentPractice: {
      morning: 'Dry face: apply 2-3 drops facial oil; gentle massage; tissue blot excess; this IS the moisture',
      extension: 'Skip cleanse for dry skin on low-activity days; micellar water when makeup is worn',
      dryShampoo: 'Cornstarch or arrowroot powder (mixed with a pinch of turmeric for golden tint) DIY dry shampoo'
    },

    advice: `Ayurveda is fundamentally a waterless beauty philosophy — abhyanga oil massage is applied
    before bathing, not after; oils are the primary vehicle for nourishment; water is the finishing
    rinse, not the base. Modern Ayurvedic waterless beauty: sesame oil applied to dry face as
    cleanser-moisturizer-treatment (oil dissolves sebum; massage stimulates circulation; tissues
    blot excess). For water-intensive Indian cities (Delhi, Bangalore water stress issues),
    waterless Ayurvedic practices are both traditional and practical.`
  },

  caribbean: {
    communityName: 'Caribbean',
    primaryConcerns: ['Coconut oil as waterless multi-tasker', 'Ocean/salt water cleansing', 'Water conservation awareness'],

    waterlessHeritage: {
      coconut: 'Coconut oil for hair and skin directly applied — no water base needed; Caribbean ancestral tradition',
      aloe: 'Fresh aloe vera gel applied direct to skin without rinse — works as leave-on treatment'
    },

    currentPractice: {
      hair: 'Type 3-4 hair: extend wash days with coconut oil refresh on dry hair + pineapple + bonnet',
      skin: 'Coconut oil or aloe vera as leave-on skin treatment; no rinse needed; immediate ocean = nature\'s rinse'
    },

    advice: `Caribbean waterless beauty is coconut oil. Applied to dry skin, it melts and absorbs; applied
    to dry hair, it seals and protects. Fresh aloe vera is the second pillar — cut from the plant,
    applied directly, left on. These two ingredients at their core require no additional water-based
    formulas. Modern extension: micellar water for beach days when a full shower isn\'t possible;
    leave-in spray with coconut milk + water in a spray bottle for curl refresh between wash days.`
  },

  arab: {
    communityName: 'Arab / Middle Eastern',
    primaryConcerns: ['Argan oil tradition', 'Desert waterless heritage', 'Rose water as waterless toner'],

    waterlessHeritage: {
      argan: 'Argan oil applied directly to face and hair — ancestral waterless Berber beauty practice',
      blackSeed: 'Black seed oil applied directly — waterless traditional Arab beauty medicine',
      roseWater: 'Rose water as waterless "rinse" — refreshes without requiring full cleanse'
    },

    currentPractice: {
      cleanse: 'Oil cleanse with argan or olive oil; tissue remove; rose water refresh; argan oil drops to finish',
      hair: 'Argan oil direct on lengths after washing; no additional product needed; or dry hair application'
    },

    advice: `Arab beauty evolved in desert environments — waterless application is heritage. The Bedouin
    tradition of argan oil applied directly, rose water as the daily face refresh, and black seed oil
    as the treatment: these require minimal water and are complete as a beauty system. Modern desert
    adaptation for travelers or water-scarce periods: rose water spray as toner + micellar to cleanse
    + argan as moisturizer = full routine with 0 water rinsing required.`
  },

  latina: {
    communityName: 'Latina / Hispanic',
    primaryConcerns: ['Amazonian waterless oils', 'Jojoba as waterless sebum mimic', 'DIY waterless formulas'],

    waterlessHeritage: {
      amazonian: 'Amazonian communities with river water proximity but not running water: cupuaçu and Brazil nut oil direct application',
      jojoba: 'Jojoba (Mexican desert plant): liquid wax that mimics sebum perfectly; applied directly without water base',
      avocado: 'Avocado oil and pulp applied directly to hair and skin — Mesoamerican tradition'
    },

    currentPractice: {
      face: 'Jojoba oil 3-5 drops as morning moisturizer on clean or micellar-cleansed skin; no water needed',
      hair: 'Avocado + olive oil mask on dry hair; 30-60 min; no water-based products needed',
      dryShampoo: 'Arrowroot + cocoa powder + cinnamon dry shampoo DIY for brunette tint'
    },

    advice: `Latina waterless beauty leverages the extraordinary Amazonian and Mesoamerican botanical
    heritage. Jojoba oil from the Sonoran Desert (Mexico/US border) is uniquely waterless-compatible
    because it IS the closest thing to skin\'s own sebum — it regulates oil production when applied
    directly to face without water. Amazonian cupuaçu butter as leave-on hair treatment (no rinse)
    is genuinely superior to water-based conditioners for Type 3b-4a Latina hair textures.`
  },

  'east-asian': {
    communityName: 'East Asian',
    primaryConcerns: ['Dry essence without water rinse', 'Powder-based actives', 'Minimal rinse K-beauty'],

    waterlessHeritage: {
      japaneseRiceBran: 'Nuka (rice bran) polishing: dry application on skin; dry exfoliation tradition before modern waterless trend',
      geishaOshiroi: 'White face powder (oshiroi): dry powder cosmetic; applied without water to matte and perfect complexion',
      korean: 'Some Korean essences and toners applied without rinse; leave-on format preferred'
    },

    currentPractice: {
      essences: 'Multi-layer essence application: pat into skin; no rinse; each layer adds hydration without water base',
      powder: 'Vitamin C powder serum: mix single-use amount with a few drops of oil; no water needed; maximum stability',
      serum: 'Oil-based serums for fat-soluble actives (retinol, vitamin E, niacinamide in oil base): no water carrier needed'
    },

    advice: `Korean beauty is already moving toward waterless innovation — powder actives, oil-based actives,
    and waterless sleeping packs. The logical end of the Korean layering system is waterless: instead
    of water-based toners, use oil-based serums layered on each other. Japanese powder beauty
    traditions (enzyme powder cleansers, loose powder applications) are genuinely waterless and
    produce excellent results with less waste. Fermented oil-based serums are the next frontier.`
  },

  'east-african': {
    communityName: 'East African',
    primaryConcerns: ['Frankincense oil direct application', 'Sesame oil Somali tradition', 'Water-scarce region heritage'],

    waterlessHeritage: {
      frankincense: 'Boswellia resin oil applied directly to skin — no water needed; ancient Horn of Africa tradition',
      sesame: 'Sesame oil rubbed directly on skin and hair — Somali and Ethiopian traditional waterless beauty',
      myrrh: 'Myrrh resin in oil applied directly — healing and beauty without water'
    },

    currentPractice: {
      face: 'Frankincense essential oil (diluted in carrier) applied to face as final step; leave-on; no water',
      hair: 'Sesame or castor oil on scalp and hair; no rinse; protective style over',
      body: 'Shea butter or marula oil direct from container after pat-dry from minimal water rinse'
    },

    advice: `East African waterless beauty is inseparable from the frankincense and myrrh tradition. These
    resins in oil form are complete waterless beauty treatments — applied directly, they cleanse
    (antimicrobial), treat (anti-inflammatory), and moisturize (oil base). The sesame oil tradition
    (particularly Somali) is another complete waterless beauty system. For diaspora East African women:
    these traditions translate perfectly to water conservation beauty practices — using ancestral
    waterless methods is both culturally authentic and environmentally responsible.`
  },

  'south-african': {
    communityName: 'South African',
    primaryConcerns: ['Marula oil as waterless moisturizer', 'Rooibos extract beauty', 'Southern Africa water scarcity'],

    waterlessHeritage: {
      marula: 'Marula oil applied directly to skin and hair — Tsonga and Swazi ancestral waterless practice',
      baobab: 'Baobab oil from the baobab tree: direct application; waterless complete moisturizer',
      waterScarcity: 'Day Zero in Cape Town (2018): near-total water shutdown; accelerated waterless beauty adoption in South Africa'
    },

    currentPractice: {
      face: 'Marula oil 3 drops as morning moisturizer; SPF mineral powder over (no water-based SPF needed)',
      hair: 'Marula oil on dry hair for shine and protection between wash days',
      capeTown: 'Cape Town water crisis normalized dry cleansing, minimal-rinse routines, solid bar products'
    },

    advice: `South Africa\'s Day Zero water crisis in Cape Town (2018) made the city a global leader in
    waterless beauty innovation — out of necessity. Residents developed comprehensive waterless
    routines: micellar cleansing, oil-based moisturizing, dry shampoo, solid bars. Marula oil as
    the primary South African anhydrous moisturizer is both culturally authentic (ancestral Tsonga
    practice) and scientifically optimal (lightweight, fast-absorbing, antioxidant). The water
    crisis legacy: South African beauty consumers are now among the most sustainability-conscious globally.`
  },

  'black-american': {
    communityName: 'Black American',
    primaryConcerns: ['LOC method waterless extension', 'Greasing tradition as waterless skin care', 'Natural hair wash day extension'],

    waterlessHeritage: {
      grease: '"Greasing" (petrolatum/Vaseline on skin): applied to dry skin without water prep — ancestral waterless moisturizing',
      oils: 'Castor oil, shea butter, and coconut oil applied directly — Black American waterless beauty tradition',
      naturalHair: 'Natural hair care inherently minimizes water washing — once or twice weekly wash with extensions in between'
    },

    currentPractice: {
      hair: 'Extend natural hair wash day: scalp oil application + refresh spray + retwist sections + bonnet = 7-14 day extension',
      skin: 'Morning face routine without water: pat dry (already cleansed at night); apply serum + moisturizer; no rinse needed',
      body: 'Body "greasing" (Vaseline/shea): applied to slightly damp skin after shower — minimal water interaction needed'
    },

    advice: `Black American beauty tradition is intrinsically waterless — the "greasing" practice, the
    natural hair extension techniques, the once-weekly wash day: these are waterless approaches
    developed from practical cultural need and now validated by both science and sustainability
    movements. Type 4 hair care is the original waterless hair care: water is used minimally and
    intentionally; oil is the daily moisturizer and protector. The entire natural hair movement\'s
    philosophy of "less water, more oil, more protection" IS the waterless beauty philosophy, arrived
    at independently through cultural transmission.`
  }
};

// ============================================================
// HELPER FUNCTION
// ============================================================

export function getWaterlessBeautyGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_WATERLESS_BEAUTY_GUIDES['west-african'],
    'south-asian': ETHNIC_WATERLESS_BEAUTY_GUIDES['south-asian'],
    'caribbean': ETHNIC_WATERLESS_BEAUTY_GUIDES['caribbean'],
    'arab': ETHNIC_WATERLESS_BEAUTY_GUIDES['arab'],
    'latina': ETHNIC_WATERLESS_BEAUTY_GUIDES['latina'],
    'east-asian': ETHNIC_WATERLESS_BEAUTY_GUIDES['east-asian'],
    'east-african': ETHNIC_WATERLESS_BEAUTY_GUIDES['east-african'],
    'south-african': ETHNIC_WATERLESS_BEAUTY_GUIDES['south-african'],
    'black-american': ETHNIC_WATERLESS_BEAUTY_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

// ============================================================
// STATS
// ============================================================

export const WATERLESS_BEAUTY_STATS = {
  moduleId: 'waterless_beauty_ethnic_guide',
  version: '1.0.0',
  communities: 9,
  keyFacts: [
    'Water is 50-70% of most conventional beauty products — waterless formulas are more concentrated and stable',
    'Global beauty generates 120 billion units of packaging annually — most not recyclable',
    'Solid shampoo bars last 2-3x longer than liquid equivalent and require no plastic bottle',
    'West African ancestral beauty (shea butter direct to skin) IS waterless beauty — the global trend is catching up to African tradition',
    'Cape Town\'s 2018 Day Zero water crisis made South Africa a global leader in waterless beauty innovation',
    'Type 4 natural hair care is the original waterless hair care philosophy — oil-based, protective, minimal water',
    'Micellar water removes makeup with no rinse needed — complete cleanse with zero water waste',
    'Amazonian cupuaçu butter absorbs 450% its weight in water — extreme humectancy without water base needed',
    'DIY dry shampoo: arrowroot powder + a pinch of baking soda + essential oils = zero-plastic scalp refresh',
    'Jojoba from Sonoran Desert (Mexico) is the only plant oil that mimics human sebum — regulates skin without water base'
  ],
  lastUpdated: '2026-10-29'
};
