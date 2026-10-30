/**
 * MIRRR — Waterless & Minimal Beauty Ethnic Guide
 * Water-free formulations, dry cleansing, minimal waste beauty by community
 * Topics: micellar water, dry shampoo, solid formulas, waterless skincare, conservation beauty
 */

export const WATERLESS_BEAUTY_SCIENCE = {
  whyWater: {
    traditional: 'Water in cosmetics serves as: solvent, texture modifier, humectant delivery vehicle, cost filler, vehicle for water-soluble actives',
    problem: ['Water breeds bacteria and mold — requires preservatives (parabens, phenoxyethanol, MIT)', 'Water is heavy — increases shipping carbon footprint'],
    solution: 'Anhydrous (waterless) formulas: more concentrated, often more stable, and need less preservative',
  },
  anhydrousFormulas: {
    oilBased: {
      description: 'Oil-based cleansers, serums, moisturizers, balms',
      examples: ['Cleansing oils and balms', 'Facial oils', 'Oil serums with oil-soluble actives', 'Body oils'],
      benefits: 'No water = no aqueous preservation needed; stable; concentrated; melt on skin',
    },
    powderBased: {
      description: 'Powder cleansers, powder masks, powder actives',
      examples: ['Enzyme powder cleansers', 'Clay masks', 'Vitamin C powder serum'],
      benefits: 'Stable; little or no preservative needed; user mixes with water at point of use; lightest shipping weight',
    },
    solidBars: {
      description: 'Solid shampoo bars, conditioner bars, facial bars, body bars',
      examples: ['Shampoo bars', 'Conditioner bars', 'Facial cleansing bars', 'Body butter bars', 'Tinted lip balm bars'],
      benefits: 'No plastic bottle needed; airport-friendly; brands say a bar outlasts a bottle; less packaging',
    },
    butters: {
      description: 'Plant butter as multi-purpose moisturizers without water phase',
      examples: ['Shea butter', 'Mango butter', 'Cocoa butter', 'Murumuru butter', 'Cupuaçu butter'],
      benefits: 'Single-ingredient; no preservatives; known composition; long shelf life',
    },
  },
  waterConservation: {
    beautyUse: 'Average woman uses 65 gallons of water per beauty routine over her lifetime estimate; waterless beauty reduces this',
    dryRegions: 'Communities in water-scarce regions (parts of Africa, Middle East, India) have centuries of waterless beauty tradition from necessity — now globally relevant',
    lowLather: 'Reducing water use: rinse-free cleansers, solid bars (require less water to lather and rinse), oil cleansers',
  },
  waterFreeCleansing: {
    micella: {
      name: 'Micellar Water',
      mechanism: 'Micelles: microscopic spheres; hydrophilic outer shell (water-loving) + lipophilic core (oil-loving); encapsulate oil-based dirt when swiped across skin',
      use: 'No water needed to rinse; gentlest cleanse option; ideal for sensitive skin, minimal makeup, morning cleanse',
      limitation: 'Not sufficient for heavy makeup, SPF, or heavily oiled skin; should be removed or followed by water cleanse in full routine',
    },
    creamCleanse: {
      name: 'Cleansing Cream / Balm',
      mechanism: 'Emulsifies makeup and sebum; tissue or cloth removal possible; optional water rinse',
      use: 'Remove heavy makeup without water (useful for festivals, camping, travel, water scarcity situations)',
    },
    oilCleanse: {
      name: 'Oil Cleansing',
      mechanism: 'Like-dissolves-like: oil dissolves sebum, sunscreen, and oil-based makeup',
      use: 'Massage onto dry skin; tissue or cloth remove; OR emulsify with a little water and rinse',
      noWater: 'Can be tissue-removed without water — useful in waterless situations',
    },
  },
};

export const DRY_HAIR_CARE = {
  overview: 'Dry hair care — extending wash days without water — matters most for Type 4 hair, which many people wash less often. But all hair types benefit from products that extend styling between washes, reducing water and product use.',
  dryShampoo: {
    overview: 'Dry shampoo absorbs excess scalp sebum without water; refreshes roots; extends styling',
    mechanism: 'Starch (rice, corn, arrowroot, tapioca) or silica absorbs oil; hair appears less greasy; may add volume',
    ingredients: {
      starch: 'Rice starch, cornstarch, arrowroot: natural options; may leave white cast on very dark hair if over-applied',
      silica: 'Colloidal silica: absorbs oil effectively; no white cast; premium option',
      aerosol: 'Conventional dry shampoo sprays use aerosol propellant + alcohol + starch; in 2022 several brands recalled aerosol dry shampoos over benzene contamination',
    },
    darkHair: 'White cast issue: apply to roots under top layer; shake out; or use tinted dry shampoo matching hair color',
    type4: {
      appropriateness: 'Many people with Type 4 hair find dry shampoo less useful than a scalp spritz, because they wash less often and use oils',
      alternatives: 'Scalp spritz (water + leave-in), apple cider vinegar rinse, or scalp oil instead',
    },
  },
  noWashDayTechniques: {
    type12: { technique: 'Root refresh: dry shampoo at roots, volumizing spray on length, brush through, restyle', extend: 'Can extend 1-2 days typically' },
    type3: { technique: 'Refresh spray: water + leave-in conditioner + curl activator in spray bottle; spritz, scrunch, diffuse', extend: 'Can extend 3-5 days with pineapple at night and morning refresh' },
    type4: { technique: 'Scalp oil + retwist loose sections; bonnet overnight; protective style during extend period', extend: 'Protective styles (braids, twists) extend wash day 7-14 days or longer' },
  },
  waterlessStyling: {
    holdProducts: 'Gels, creams, and pomades can style without water; eco-styler, flaxseed gel, and shea butter-based creams',
    fingerStyle: 'Finger coiling on Type 4 without water: re-twisting individual coils with cream to refresh pattern',
    elongate: 'Banding: silky fabric bands stretched along wet or dry natural hair; elongates without heat',
  },
};

export const MINIMAL_WASTE_BEAUTY = {
  overview: 'Beauty industry generates significant waste: plastic bottles, single-use wipes, cotton rounds, applicators; sustainable alternatives exist for all categories',
  packaging: {
    alternatives: {
      glass: 'Glass bottles for serums and oils: recyclable; inert; premium feel',
      aluminumTins: 'Aluminum tins: infinitely recyclable; great for balms, solid formulas, butter',
      paperPulp: 'Paper pulp packaging: compostable; used by some clean beauty brands',
      refillable: 'Refillable systems: one permanent vessel; refill pouches at store or by mail; much less packaging over time',
      noPackage: 'No packaging at all: solid bars require no bottle; buy loose bulk cosmetics',
    },
  },
  singleUse: {
    problem: 'Cotton rounds, makeup wipes, single-use sheet masks contribute enormous waste',
    alternatives: {
      reusableRounds: 'Reusable bamboo or cotton rounds: wash with laundry; hundreds of uses vs one',
      konjac: 'Konjac facial sponge: plant fiber; biodegradable; gentle exfoliant',
      microfiber: 'Reusable makeup remover cloth: water + cloth removes all makeup; no product needed',
      beeswax: 'Beeswax food wraps repurposed for beauty storage; zero plastic',
    },
  },
  DIYBeauty: {
    overview: 'Making beauty products reduces packaging, avoids preservatives, allows customization',
    simple: ['Rosehip + argan + vitamin E oil: simple facial oil; 3 ingredients', 'Shea butter + coconut oil + essential oils: body butter; 3 ingredients', 'Apple cider vinegar + water (1:4): hair rinse; removes buildup; pH balances'],
    advanced: ['Solid shampoo bar: SCI (sodium cocoyl isethionate) + BTMS (conditioning agent) + butters'],
  },
};

export const ETHNIC_WATERLESS_BEAUTY_GUIDES = {
  'west-african': {
    communityName: 'West African',
    primaryConcerns: ['Water-scarce region traditions', 'Shea butter as waterless moisturizer', 'Type 4 wash day extension'],
    waterlessHeritage: {
      tradition: 'Shea and plant oils applied straight to skin and hair are long-standing West African practices that need no water',
      sheaButter: 'Shea butter applied straight to skin, with no water-based product',
      oils: 'Direct application of plant oils without water-based products: moringa, shea, coconut, marula',
    },
    currentPractice: {
      moisturize: 'Shea butter or marula oil straight onto skin after a mild cleanse',
      hair: 'For coily hair: extend wash day with scalp oil, re-twisting and a bonnet; 7–14 days between washes',
      cleanse: 'Micellar water or oil cleanse for days without full shower; tissue remove',
    },
    waterConservation: { practice: 'Shorter showers; oil cleanse instead of water-intensive cleanse; solid bars' },
  },
  'south-asian': {
    communityName: 'South Asian',
    primaryConcerns: ['Oil-based Ayurvedic beauty', 'Water conservation in India', 'Powder-based traditions (ubtan)'],
    waterlessHeritage: {
      ayurveda: 'Ayurvedic abhyanga (oil massage) applied without water first; traditional waterless beauty practice',
      ubtan: 'Ubtan: dry powder formula mixed fresh with minimal water or milk; the original powder cleanser',
      oils: 'Coconut, sesame, almond, bhringraj oils applied directly — an Ayurvedic oil tradition',
    },
    currentPractice: { morning: 'Dry face: apply 2-3 drops facial oil; gentle massage; tissue blot excess', extension: 'Skip cleanse for dry skin on low-activity days; micellar water when makeup is worn' },
  },
  caribbean: {
    communityName: 'Caribbean',
    primaryConcerns: ['Coconut oil as waterless multi-tasker', 'Ocean/salt water cleansing', 'Water conservation awareness'],
    waterlessHeritage: { coconut: 'Coconut oil for hair and skin directly applied — no water base needed', aloe: 'Fresh aloe vera gel applied direct to skin without rinse — works as leave-on treatment' },
    currentPractice: { hair: 'For curly or coily hair: extend wash days with coconut oil refresh on dry hair + pineapple + bonnet', skin: 'Coconut oil (body) or aloe vera as leave-on skin treatment; no rinse needed' },
  },
  arab: {
    communityName: 'Arab / Middle Eastern',
    primaryConcerns: ['Argan oil tradition', 'Desert waterless heritage', 'Rose water as waterless toner'],
    waterlessHeritage: {
      argan: 'Argan oil applied directly to face and hair — a long-standing Amazigh (Berber) practice',
      blackSeed: 'Black seed oil applied directly — a traditional remedy in many Arab households',
      roseWater: 'Rose water as waterless "rinse" — refreshes without requiring full cleanse',
    },
    currentPractice: {
      cleanse: 'Oil cleanse with argan or olive oil; tissue remove; rose water refresh; argan oil drops to finish',
      hair: 'Argan oil direct on lengths after washing; no additional product needed; or dry hair application',
    },
  },
  latina: {
    communityName: 'Latina / Hispanic',
    primaryConcerns: ['Amazonian waterless oils', 'Jojoba as waterless sebum mimic', 'DIY waterless formulas'],
    waterlessHeritage: {
      amazonian: 'Cupuaçu butter and Brazil nut oil applied directly',
      jojoba: 'Jojoba (a Sonoran Desert plant): a liquid wax similar to skin\'s own sebum; applied directly without a water base',
      avocado: 'Avocado oil and pulp applied directly to hair and skin — Mesoamerican tradition',
    },
    currentPractice: { face: 'Jojoba oil 3-5 drops as morning moisturizer on clean or micellar-cleansed skin; no water needed', hair: 'Avocado + olive oil mask on dry hair; 30-60 min; no water-based products needed' },
  },
  'east-asian': {
    communityName: 'East Asian',
    primaryConcerns: ['Dry essence without water rinse', 'Powder-based actives', 'Minimal rinse K-beauty'],
    waterlessHeritage: {
      japaneseRiceBran: 'Nuka (rice bran) polishing: dry application on skin; dry exfoliation tradition before modern waterless trend',
      korean: 'Some Korean essences and toners applied without rinse; leave-on format preferred',
    },
    currentPractice: {
      essences: 'Multi-layer essence application: pat into skin; no rinse; each layer adds hydration without water base',
      powder: 'Vitamin C powder: mix a single-use amount into your serum or moisturiser; stays stable until mixed',
      serum: 'Oil-based serums for fat-soluble actives (retinol, vitamin E): no water carrier needed',
    },
  },
  'east-african': {
    communityName: 'East African',
    primaryConcerns: ['Frankincense oil direct application', 'Sesame oil Somali tradition', 'Water-scarce region heritage'],
    waterlessHeritage: {
      frankincense: 'Boswellia resin oil applied directly to skin — no water needed; a Horn of Africa tradition',
      sesame: 'Sesame oil rubbed directly on skin and hair — Somali and Ethiopian traditional waterless beauty',
      myrrh: 'Myrrh resin in oil applied directly — healing and beauty without water',
    },
    currentPractice: {
      face: 'Frankincense essential oil (diluted in carrier) applied to face as final step; leave-on; no water',
      hair: 'Sesame or castor oil on scalp and hair; no rinse; protective style over',
      body: 'Shea butter or marula oil direct from container after pat-dry from minimal water rinse',
    },
  },
  'south-african': {
    communityName: 'South African',
    primaryConcerns: ['Marula oil as waterless moisturizer', 'Rooibos extract beauty', 'Southern Africa water scarcity'],
    waterlessHeritage: { marula: 'Marula oil applied directly to skin and hair', baobab: 'Baobab oil from the baobab tree: direct application; waterless complete moisturizer' },
    currentPractice: {
      face: 'Marula oil, 3 drops, as morning moisturiser, then a broad-spectrum sunscreen applied generously (a powder SPF is only a top-up)',
      hair: 'Marula oil on dry hair for shine and protection between wash days',
      capeTown: 'During the 2017–2018 Cape Town drought, many people adopted dry cleansing, minimal-rinse routines, solid bar products',
    },
  },
  'black-american': {
    communityName: 'Black American',
    primaryConcerns: ['LOC method waterless extension', 'Greasing tradition as waterless skin care', 'Natural hair wash day extension'],
    waterlessHeritage: {
      grease: '"Greasing" (petrolatum/Vaseline or shea on skin and scalp): a long-standing practice of sealing in moisture without extra water',
      oils: 'Castor oil, shea butter, and coconut oil applied directly',
      naturalHair: 'Many natural-hair routines wash once a week or less and refresh in between',
    },
    currentPractice: {
      hair: 'Extend natural hair wash day: scalp oil application + refresh spray + retwist sections + bonnet = 7-14 day extension',
      skin: 'Morning face routine without water: pat dry (already cleansed at night); apply serum + moisturizer; no rinse needed',
      body: 'Body "greasing" (Vaseline/shea): applied to slightly damp skin after shower — minimal water interaction needed',
    },
  },
};

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
