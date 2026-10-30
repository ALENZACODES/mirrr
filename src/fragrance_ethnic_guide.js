/**
 * MIRRR — Fragrance & Scent Multicultural Guide
 * Perfumery science, oud and attars, cultural scent traditions, fragrance notes by community
 * Topics: fragrance chemistry, longevity on different skin, cultural olfactory traditions, 9 communities
 */

// ============================================================
// FRAGRANCE SCIENCE
// ============================================================

export const FRAGRANCE_SCIENCE = {
  overview: `Fragrance is the most intimate beauty product — inhaled and worn on the body, it creates
  emotional and social impressions that science is only beginning to explain. Olfaction (smell)
  is the only sense with direct neural connection to the limbic system (emotion and memory) —
  this is why scent triggers memories so powerfully. Fragrance choice is both chemistry and culture.`,

  olfactoryScience: {
    olfactorySystem: {
      
      limbic: 'Olfactory bulb connects directly to amygdala and hippocampus (emotion + memory) — no thalamic relay (unlike other senses)',
      memory: 'Smell-triggered memories ("Proustian memory"): more emotionally intense than visually-triggered memories; deeper limbic engagement',
      culture: 'Olfactory preferences are heavily culturally conditioned — what smells good is largely learned'
    },

    fragranceChemistry: {
      notes: {
        top: 'Top notes: first 15-30 minutes; most volatile; initial impression; citrus, herbs, light florals',
        middle: 'Middle/heart notes: 30 min - 4 hours; the main body of the fragrance; heavier florals, spices',
        base: 'Base notes: 4+ hours; slowest-evaporating; foundation; woods, resins, musks, amber'
      },
      concentration: {
        EDT: 'Eau de Toilette (EDT): 5-15% fragrance oil; 3-5 hours longevity',
        EDP: 'Eau de Parfum (EDP): 15-20%; 4-8 hours longevity; most popular',
        parfum: 'Parfum/Extrait: 20-40%; 8-24 hours; most expensive; richest sillage',
        cologne: 'Eau de Cologne (EDC): 2-4%; lightest; 2-3 hours'
      },
      sillage: 'Sillage (French: "wake" or "trail"): how far a fragrance projects from the wearer; heavy base notes = strong sillage'
    },

    skinInteraction: {
      dryVsOily: 'Fragrance longevity on skin: oily skin holds fragrance LONGER than dry skin; sebum provides longer release',
      pH: 'Skin pH affects how fragrance develops; acidic skin (pH 4.5-5.5) alters molecular fragrance character',
      warmth: 'Body heat activates fragrance; pulse points (wrist, neck, inner elbow, back of knee) maximize diffusion',
      melanin: 'No direct relationship between skin melanin and fragrance performance; longevity = skin oiliness + application technique',
      dry: 'Dry skin fragrance tip: apply unscented moisturizer first; fragrance lasts significantly longer on hydrated skin'
    },

    allergens: {
      EU26: 'EU mandates disclosure of 26 common fragrance allergens on packaging (IFRA); includes oakmoss, isoeugenol, linalool, limonene',
      sensitization: 'Fragrance allergy: sensitization develops over repeated exposure; patch test nape of neck before committing',
      natural: 'Natural fragrances are NOT safer than synthetic; essential oils are among the most common contact allergens',
      safest: 'Fragrance-free cosmetics (truly fragrance-free vs "unscented" which may contain masking fragrance) are safest for sensitive skin'
    }
  },

  fragranceFamilies: {
    oriental: {
      description: 'Warm, rich, sensual; amber, vanilla, musk, incense, spices; heavy base; excellent longevity',
      classic: 'Shalimar (Guerlain), Opium (YSL), Obsession (Calvin Klein), Ambre Nuit (Dior)',
      communities: 'Arab, South Asian, East African: natural cultural alignment with amber fragrance family'
    },
    woody: {
      description: 'Cedar, sandalwood, oud, vetiver, patchouli; earthy, sophisticated; excellent longevity',
      
      classic: 'Oud Wood (Tom Ford), Black Oud (Montale), Encre Noire (Lalique)'
    },
    floral: {
      description: 'Rose, jasmine, lily, peony, iris; feminine; variable longevity (light florals short, heavy long)',
      soliflore: 'Soliflore: single dominant flower note; pure rose, pure jasmine',
      classic: 'Coco Mademoiselle (Chanel), Miss Dior (Dior), Joy (Jean Patou)'
    },
    fresh: {
      description: 'Citrus, aquatic, green, ozonic; light; poor longevity; modern',
      classic: 'Eau Sauvage (Dior), Cool Water (Davidoff), CK One (Calvin Klein)'
    },
    gourmand: {
      description: 'Food-inspired: vanilla, caramel, chocolate, coffee, tonka bean; sweet; modern category',
      classic: 'Angel (Mugler; pioneered category), Black Opium (YSL), La Vie est Belle (Lancôme)'
    }
  }
};

// ============================================================
// TRADITIONAL FRAGRANCE INGREDIENTS
// ============================================================

export const TRADITIONAL_FRAGRANCE_INGREDIENTS = {
  oud: {
    name: 'Oud / Agarwood',
    
    origin: 'Primarily Southeast Asia (Cambodia, Vietnam, Indonesia) and Indian subcontinent; Middle East is primary consumer and refiner',
    scent: 'Complex; smoky, dark, woody, sweet, animalic, balsamic; most complex natural fragrance ingredient',
    
    culture: 'Arab world: oud chips burned as incense; oud oil applied directly; ultimate luxury fragrance',
    synthetic: 'Iso E Super, Javanol, Sylvester: synthetic oud accords; cheaper; more accessible; increasingly high quality'
  },

  sandalwood: {
    name: 'Sandalwood',
    
    origin: 'India (Mysore region: most prized Indian sandalwood); also Australia, Pacific Islands',
    scent: 'Creamy, smooth, warm, milky, woody; excellent fixative (extends longevity of other notes)',
    culture: 'Hindu temples: sacred wood; Ayurvedic medicine; South Asian bridal ritual',
    depletion: 'Indian sandalwood endangered due to overharvesting; most commercial "sandalwood" is synthetic or Australian species'
  },

  frankincense: {
    name: 'Frankincense / Olibanum',
    
    origin: 'Somalia, Ethiopia, Eritrea, Oman, Yemen; primary growing region is Horn of Africa',
    scent: 'Fresh, resinous, balsamic, slightly lemony, smoky; highly complex',
    culture: 'Christian, Islamic, and Jewish religious traditions; ancient Silk Road trade commodity; sacred in many East African cultures',
    incense: 'Burned as incense in churches, mosques, and temples globally; one of the oldest perfumery ingredients'
  },

  myrrh: {
    name: 'Myrrh',
    
    scent: 'Warm, balsamic, slightly bitter, earthy; excellent base note; great longevity',
    culture: 'Traded since antiquity; one of the three gifts of the Magi; ancient Egyptian embalming; Islamic perfumery',
    modern: 'Used in modern niche perfumery and traditional Arab and East African attars'
  },

  rose: {
    name: 'Rose / Rosa Damascena',
    
    origin: 'Bulgaria (Rose Valley, Kazanlak): most prized; also Turkey, Morocco, India (Pushkar)',
    scent: 'The queen of fragrance; sweet, deep, multi-faceted; no synthetic fully replicates natural rose',
    culture: 'Universal in Arab, South Asian, East Asian, Western fragrance traditions; symbol of love'
  },

  jasmine: {
    name: 'Jasmine',
    
    origin: 'Grasse (France): perfumery capital; India (Madurai): Indian jasmine; Egypt',
    scent: 'Rich, intensely floral, slightly animalic, heady; versatile; heart note in most major florals',
    culture: 'South Asian: jasmine garlands for hair (gajra); sacred flowers; Tamil Nadu cultural symbol',
    modern: 'Jasmine is in the heart of more perfumes than any other ingredient'
  },

  attar: {
    name: 'Attar / Ittar',
    description: 'Traditional hydro-distilled fragrance; essential oil distilled into sandalwood oil base; water and steam distillation; no alcohol',
    origin: 'Persian, Mughal, and Ayurvedic tradition; Kannauj, India ("perfume capital of India") primary producer',
    types: ['Gulab (rose) attar', 'Hina attar (henna flowers)', 'Kewda (pandanus flower)', 'Mitti attar (monsoon rain on earth — petrichor)'],
    significance: 'Alcohol-free: appropriate for Muslim fragrance users who avoid alcohol; used in Islamic perfumery tradition',
    longevity: 'Excellent longevity due to sandalwood base; better on dry skin than alcohol-based fragrances'
  }
};

// ============================================================
// 9 COMMUNITY FRAGRANCE GUIDES
// ============================================================

export const ETHNIC_FRAGRANCE_GUIDES = {
  'west-african': {
    communityName: 'West African',
    

    traditions: {
      incense: 'Incense burning in West African homes: oud, frankincense, and local resins used in domestic rituals',
      shea: 'Shea butter as fragrance carrier: West African women apply shea butter infused with botanicals; the fragrance is from the plant, not synthetic',
      diara: 'Diara (Senegalese incense): dark, smoky incense burned for spiritual and aesthetic purposes'
    },

    fragrancePairs: {
      perfect: ['Oud-based amber fragrances: Tom Ford Oud Wood', 'Vanilla amber: By Kilian Voulez-Vous, Maison Margiela Replica Flower Market', 'Shea butter note: Jo Malone Myrrh & Tonka, Zara Rich Warm Addictive'],
      avoid: 'Very light, aquatic, ozonic fragrances can disappear quickly on oily warm skin; needs body'
    },

    skinInteraction: {
      oily: 'On oily skin fragrance lasts longer; a lighter hand is enough',
      heat: 'African heat/diaspora tropical climates: fragrance amplifies; use less; or choose lighter concentration'
    },

    advice: `West African fragrance sensibility leans toward the warm, rich, and deeply aromatic —
    the scent tradition that brought oud, frankincense, and shea butter to the world. On oily
    warm skin, amber and woody fragrances bloom and last beautifully for 8-12 hours without
    heavy application. The shea butter tradition is both fragrance and skincare: infused with
    botanicals, it delivers a skin-close intimate scent that is culturally authentic. For modern
    fragrance: Kayali (Mona Kattan's brand, known for oud and amber notes) or Maison Francis
    Kurkdjian Baccarat Rouge 540 (warm, ambery). Diaspora recommendation: keep a small bottle of
    frankincense essential oil (diluted in carrier) for moments of spiritual and ancestral connection.`
  },

  'south-asian': {
    communityName: 'South Asian',
    fragranceProfile: 'Rich attar tradition; jasmine and rose in daily life; warm oily skin amplifies amber fragrances; sandalwood as sacred base',

    traditions: {
      attar: 'Attar tradition: Kannauj, UP is the fragrance capital; rose, hina, kewda, mitti attars; alcohol-free',
      jasmine: 'Gajra (jasmine garland) for hair: South Asian women wear fresh jasmine flowers braided into hair; natural living fragrance',
      oud: 'Oud usage: significant in Muslim South Asian communities; applied on wrist/neck before prayer',
      sandalwood: 'Chandan (sandalwood paste): applied on forehead in Hindu ritual; sacred scent connection to devotion'
    },

    fragrancePairs: {
      perfect: ['Rose water and oud: Juliette Has a Gun Not a Perfume, various Arabic oud fragrances', 'Sandalwood and spice: Hermes Terre d\'Hermes, Tom Ford Santal Blush', 'Jasmine soliflore: Carolina Herrera Good Girl, Guerlain Shalimar'],
      DIY: 'Attar oils directly on pulse points: traditional; effective; long-lasting; alcohol-free'
    }
  },

  caribbean: {
    communityName: 'Caribbean',
    fragranceProfile: 'Tropical botanical heritage; hibiscus, coconut, lime, vanilla; island freshness + warm base',

    traditions: {
      coconut: 'Coconut oil as body scent: Caribbean tradition; slight coconut natural fragrance on skin',
      tropical: 'Tropical flowers in hair: hibiscus, plumeria, frangipani worn fresh; living fragrance',
      bay: 'Bay rum: Caribbean traditional fragrance; bay leaf + rum; men\'s fragrance tradition dating to colonial era'
    },

    fragrancePairs: {
      perfect: ['Tropical/island: Tocca Florence, Kilian Good Girl Gone Bad', 'Coconut: Sol de Janeiro Cheirosa 62 (Brazilian brand), Kai perfume oil', 'Vanilla-tropical: Tom Ford Soleil Neige, Escada Sorbetto Rosso'],
      avoid: 'Very heavy amber-only with no freshness can feel oppressive in Caribbean heat'
    },

    advice: `Caribbean fragrance is island life in a bottle: tropical florals, coconut, citrus, warm vanilla.
    The bay rum tradition — Caribbean Bay + rum alcohol — is historically the Caribbean male fragrance
    tradition and is having a global renaissance in niche perfumery. Sol de Janeiro's Brazilian-
    influenced Cheirosa 62 (pistachio + salted caramel + sandalwood) has become a Caribbean
    community cult favorite for capturing the warm-sweet-tropical vibe. Fresh florals in hair —
    plumeria, hibiscus — remain the most authentic Caribbean fragrance experience. Fragrance in
    tropical heat: apply less; opt for EDP over parfum to prevent overwhelming projection in warm climate.`
  },

  arab: {
    communityName: 'Arab / Middle Eastern',
    fragranceProfile: 'Most sophisticated fragrance culture; oud-centric; incense as domestic ritual; attar tradition; Arabic perfumery = pinnacle of the art',

    traditions: {
      oud: 'Oud chips burned in incense burner (mabkhara): Arabic living ritual; home scented with oud smoke; clothes perfumed this way',
      dahn: 'Dahn al oud: pure oud oil applied directly to pulse points; ultimate luxury; intense',
      bakhoor: 'Bakhoor: blended incense cakes; wood chips, flower, spice, resin; burned for guests as hospitality',
      mukhallat: 'Mukhallat: blend of fragrance oils; Arab perfumery tradition of combining oud, amber, rose, musk',
      henna: 'Lailat al henna: wedding night henna ceremony; jasmine and rose water fragrance in the room'
    },

    fragrancePairs: {
      arabic: ['Amouage Interlude (Omani luxury house), Arabian Oud (Saudi brand), Rasasi Dhan Al Oudh', 'Tom Ford Tobacco Oud, Dior Oud Ispahan', 'Kayali Vanilla 28 (lighter option for daily)'],
      classic: 'Bvlgari Le Gemme Reali collection targets Arab market with oud and incense blends specifically'
    }
  },

  latina: {
    communityName: 'Latina / Hispanic',
    fragranceProfile: 'Vibrant and sensual; floral-amber tradition; warm tropical notes; Cuba/Colombia/Brazil fragrance cultures specific',

    traditions: {
      flowers: 'Latin American women: flowers in hair and as room fragrance; marigold (cempasúchil/Day of the Dead), jasmine',
      rosary: 'Rose fragrance: deep Catholic cultural connection; roses for the Virgin Mary; rose water in home shrines',
      
      cuba: 'Cuban fragrance tradition: Llanura fragrance house; tobacco and rum notes in masculine tradition'
    },

    fragrancePairs: {
      classic: ['Flowerbomb (Viktor & Rolf): iconic in Latina community; floral-amber', 'Carolina Herrera Good Girl: jasmine-cocoa; very popular', 'Valentino Donna Born in Roma (Yellow Dream): pink pepper + ylang ylang + vanilla'],
      warm: 'Sol de Janeiro Cheirosa 71 (hibiscus + tropical musk): contemporary Latina fragrance hit'
    },

    advice: `Latina fragrance sensibility spans the extraordinary diversity of Latin America — from
    the marigold ceremonies of Día de los Muertos to the jasmine traditions of the Caribbean,
    to the rose devotions of Catholic Latin cultures. Flowerbomb (Viktor & Rolf) has an
    almost iconic status in Latina communities: its floral-amber warmth performs beautifully
    on warm Latina skin and has become a generational fragrance. The warm oily skin of many
    Latinas means amber fragrances bloom and project magnificently — wear less than you
    think you need. Sol de Janeiro's Brazilian-origin fragrances have become cultural touchstones
    for many Latin American communities with their warm, tropical, optimistic sillage.`
  },

  'east-asian': {
    communityName: 'East Asian',
    fragranceProfile: 'Subtle, intimate fragrance preference; incense tradition in Japanese and Chinese practice; fresh and clean aesthetic',

    traditions: {
      kodo: 'Kodo (Japanese incense ceremony): the "way of fragrance"; aesthetic appreciation of incense; one of Japan\'s three classical arts',
      aloeswood: 'Jinkoh (Japanese aloeswood/oud): used in Buddhist ceremonies; temple fragrance; sacred',
      plum: 'Ume (Japanese plum blossom): seasonal fragrance associated with New Year; fleeting and delicate',
      hanami: 'Cherry blossom (sakura): seasonal celebration; cherry blossom perfumes mark spring in Japan',
      chinese: 'Chinese incense tradition: sandalwood in temples; incense sticks in Buddhist shrines; domestic ritual'
    },

    fragrancePairs: {
      japanese: ['Comme des Garçons CDG 2: abstract; industrial-clean; Japanese aesthetic', 'Shiseido Zen: iconic Japanese floral-woody', 'Acqua di Parma Colonia: Italian classic beloved in East Asian markets'],
      korean: ['Juun.J Korean contemporary niche; Jo Malone Peony & Blush Suede (popular in Korea)', 'Aesop Hwyl: Japanese hinoki cypress; cult East Asian fragrance'],
      light: 'East Asian fragrance preference: lighter concentration (EDT over EDP); closer-wearing scent'
    },

    advice: `East Asian fragrance culture is deeply influenced by the restraint and subtlety of both
    Japanese wabi-sabi aesthetic and the philosophical traditions of Confucianism and Buddhism.
    The Japanese kodo ceremony (way of incense) is one of the three classical arts alongside
    ikebana (flower arrangement) and chado (tea ceremony) — it represents the highest aesthetic
    appreciation of fragrance. Modern East Asian fragrance preference: intimate rather than
    projecting; fresh and clean over heavy and smoky; skin-close rather than room-filling sillage.
    Japanese brands (Shiseido, Comme des Garçons) and Korean brands (Tamburins, Aesop collaboration)
    capture this philosophy. Fragrance layering tip: apply lighter base (Muji fragrance oil or
    similar), then a single spritz of light EDP over — Japanese-style subtlety.`
  },

  'east-african': {
    communityName: 'East African',
    fragranceProfile: 'Frankincense and myrrh as sacred fragrance base; oud tradition from Islamic practice; incense as domestic spiritual ritual',

    traditions: {
      frankincense: 'Frankincense (luban) burning: Ethiopian Orthodox church; Somali and Eritrean home ritual; incense as spiritual and aesthetic practice',
      coffee: 'Ethiopian coffee ceremony: roasting coffee beans creates fragrant smoke; coffee as communal incense',
      abyssinian: 'Abyssinia oil: East African carrier; nutty, distinctive; traditional beauty and fragrance',
      somali: 'Somali dirac dress + oud oil: wearing oud on special occasions; traditional Somali fragrant ritual'
    },

    fragrancePairs: {
      perfect: ['Tom Ford Tobacco Oud, Dior Oud Ispahan: Middle Eastern oud that East African heritage can connect with', 'Maison Francis Kurkdjian Oud Extrait de Parfum: luxury oud'],
      traditional: 'Frankincense essential oil (4-5 drops in 30ml carrier oil): ancestral East African fragrance'
    },

    advice: `East African fragrance culture is at the intersection of Horn of Africa indigenous tradition
    (frankincense, myrrh, coffee ceremony) and Islamic fragrance heritage (oud, attar). Frankincense
    is so central to Ethiopian and Somali cultural identity that its scent can trigger powerful
    cultural memory and emotion — a direct limbic connection to ancestry and home. For diaspora
    East African women: burn frankincense resin in a small charcoal burner to recreate the
    home scent; wear oud oil on pulse points for occasions. The combination of frankincense
    and coffee smoke is the East African home scent equivalent that no perfume fully replicates.
    For commercial fragrances that capture the warmth: Tom Ford Tobacco Oud, or any oud-balsamic
    amber, perform beautifully on East African deep warm skin.`
  },

  'south-african': {
    communityName: 'South African',
    fragranceProfile: 'Emerging artisan fragrance scene; rooibos and fynbos botanical heritage; Ubuntu spirit in community scent rituals',

    traditions: {
      fynbos: 'Fynbos (Cape Floral Kingdom): most biodiverse botanical region on Earth; unique aromatic plants; buchu, rooibos, agathosma',
      buchu: 'Buchu (Agathosma betulina): South African endemic; blackcurrant-berry aroma; used by Khoikhoi; modern fragrance ingredient',
      rooibos: 'Rooibos fragrance: warm, earthy, herbal; used in some South African artisan perfumes',
      lobola: 'Lobola ceremony: bridal preparation includes aromatic plant use; cultural beauty fragrance rituals'
    },

    fragrancePairs: {
      perfect: ['African Botanics (South African luxury brand) uses fynbos and Cape florals', 'Amarula body care: South African marula fruit; warm, nutty fragrance', 'Jo Malone Cape Town collaborative (2019 regional collection): tribute to Cape botanicals'],
      international: 'Initio Oud for Greatness: popular in South African luxury market'
    }
  },

  'black-american': {
    communityName: 'Black American',
    fragranceProfile: 'Bold, lasting, often vanilla-amber; Pink Fridays and designer colognes as cultural touchstones; church perfume tradition',

    traditions: {
      church: 'Church fragrance: Black American church culture has specific fragrance aesthetics; "Sunday best" includes fragrance; Elizabeth Taylor White Diamonds as classic example',
      designer: 'Designer fragrance as aspiration: Chanel No. 5, Dior J\'adore represent aspiration in many Black American beauty traditions',
      nikki: 'Nicki Minaj Pink Friday: first celebrity fragrance by a Black female rapper; culturally significant',
      custom: 'Custom fragrance oils in Black neighborhoods: fragrance oil sellers in beauty supply stores; custom blends on rolls and sprays'
    },

    fragrancePairs: {
      classic: ['Baccarat Rouge 540 (Maison Francis Kurkdjian): amber-woody, sweet and airy', 'Flowerbomb (Viktor & Rolf): warm floral-amber; long-lasting on warm skin', 'YSL Black Opium: coffee-vanilla'],
      value: 'Black community beauty supply fragrance oils: impressionist versions of luxury fragrances; often excellent performance; significantly affordable',
      power: 'Deep warm Black American skin: Baccarat Rouge 540 EDP performs up to 12-14 hours; legendary longevity combination'
    },

    advice: `Black American fragrance culture combines aspirational luxury (Chanel, Tom Ford, Baccarat Rouge)
    with community-rooted custom fragrance oils (beauty supply stores selling roll-on impressionist
    versions). The beauty supply fragrance oil tradition is culturally significant — high-quality
    impressionist blends at accessible prices, often customized by the vendor, is a distinctly
    Black American fragrance experience. Baccarat Rouge 540 (Maison Francis Kurkdjian) is a well-loved
    modern pick: a warm jasmine-saffron-ambroxan blend.
    "Sunday best" church fragrance: White Diamonds (Elizabeth Taylor), Opium (YSL), and Coco (Chanel)
    are classics in many Black American church communities — worn on the wrist and neck, the
    warm church environment creates magnificent sillage.`
  }
};

// ============================================================
// HELPER FUNCTION
// ============================================================

export function getFragranceGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_FRAGRANCE_GUIDES['west-african'],
    'south-asian': ETHNIC_FRAGRANCE_GUIDES['south-asian'],
    'caribbean': ETHNIC_FRAGRANCE_GUIDES['caribbean'],
    'arab': ETHNIC_FRAGRANCE_GUIDES['arab'],
    'latina': ETHNIC_FRAGRANCE_GUIDES['latina'],
    'east-asian': ETHNIC_FRAGRANCE_GUIDES['east-asian'],
    'east-african': ETHNIC_FRAGRANCE_GUIDES['east-african'],
    'south-african': ETHNIC_FRAGRANCE_GUIDES['south-african'],
    'black-american': ETHNIC_FRAGRANCE_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

// ============================================================
// STATS
// ============================================================

