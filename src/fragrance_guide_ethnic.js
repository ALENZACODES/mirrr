/**
 * MIRRR — Fragrance Guide (Ethnic Perspectives)
 * The complete guide to fragrance, perfumery, traditional scents,
 * and fragrance culture across all 9 ethnic communities.
 */

export const FRAGRANCE_SCIENCE = {
  title: 'Fragrance Science and Chemistry',
  whatIsFragrance: 'Fragrance (or perfume) is a complex mixture of aromatic compounds designed to produce a pleasant scent; the word "perfume" derives from the Latin per fumum meaning "through smoke," referring to the ancient practice of burning fragrant resins and woods; modern fragrances can contain anywhere from 20 to 300+ individual aromatic molecules',
  naturalVsSynthetic: {
    natural: 'Natural fragrance ingredients are extracted from plant material (flowers, woods, resins, roots, animal secretions) through steam distillation, solvent extraction, enfleurage, or CO2 extraction; natural raw materials include: rose (Rosa damascena), jasmine (Jasminum grandiflorum), oud (agarwood from Aquilaria species), sandalwood (Santalum album), neroli (orange blossom), vetiver, patchouli, and many more',
    synthetic: 'Synthetic fragrance molecules are created in a laboratory; many are identical or similar to natural compounds but produced more consistently and sustainably; some synthetics have no natural counterpart and create entirely new olfactory experiences; Iso E Super, Ambroxan, Galaxolide (musks), and Hedione are examples of widely used synthetic molecules; the vast majority of modern fragrances use both natural and synthetic ingredients',
    sustainability: 'The fragrance industry faces significant sustainability challenges with natural ingredients; natural sandalwood was nearly harvested to extinction in the 20th century; natural oud is extremely rare and expensive partly due to over-harvesting; natural musk from the musk deer is now banned; synthetic alternatives provide sustainability advantages while often being difficult to distinguish from naturals'
  },
  concentrationTypes: {
    EDP: {
      name: 'Eau de Parfum (EDP)',
      concentration: '15-20% aromatic concentrate in alcohol and water',
      longevity: '4-8 hours on skin; often considered the ideal concentration for most everyday use',
      note: 'The most popular concentration in fine fragrance; strong enough to project without being overwhelming'
    },
    EDT: {
      name: 'Eau de Toilette (EDT)',
      concentration: '5-15% aromatic concentrate',
      longevity: '2-4 hours on skin',
      note: 'Lighter than EDP; traditionally used as a "morning shower freshness" scent; more suitable for office/daytime'
    },
    parfum: {
      name: 'Parfum / Extrait de Parfum',
      concentration: '20-40% aromatic concentrate',
      longevity: '8-24 hours; can last through the next day',
      note: 'The most concentrated and often most expensive format; one application typically sufficient; better for dry skin as the higher oil content hydrates slightly; skin scent rather than projection'
    },
    EDC: {
      name: 'Eau de Cologne (EDC)',
      concentration: '2-4% aromatic concentrate',
      longevity: '1-2 hours',
      note: 'Very light; the original Cologne formula from Cologne, Germany was a light citrus-aromatic structure; in modern use, "cologne" often incorrectly refers to men\'s fragrance generally'
    },
    bodyMist: {
      name: 'Body Mist / Fragrance Mist',
      concentration: '1-3% aromatic concentrate, higher water content',
      longevity: '30-60 minutes',
      note: 'Very light; designed for liberal all-over spraying; primarily for the "just showered clean" fresh feeling; often humidity-based rather than projection-based'
    }
  },
  pyramidStructure: {
    topNotes: 'The first impression; what you smell immediately after application; evaporate fastest (15-30 minutes); typically light, volatile molecules: citrus (bergamot, lemon, grapefruit), light herbs (lavender, basil), and aldehydes',
    middleNotes: 'The heart of the fragrance; emerge as top notes fade; last 2-4 hours; typically florals, spices, and green notes: rose, jasmine, ylang-ylang, geranium, pepper',
    baseNotes: 'The anchor of the fragrance; the longest-lasting components; the final scent impression after hours of wear; typically heavy, rich, and slow-evaporating: musks, woods (sandalwood, oud, cedar), resins (frankincense, benzoin, labdanum), vanilla, amber'
  },
  skinChemistry: {
    
    dryVsOilySkin: 'Fragrance lasts longer on oilier skin (the oil base slows evaporation) and shorter on dry skin (the molecules evaporate faster without an oil anchor); applying fragrance to moisturised or oiled skin significantly extends longevity on dry skin types',
    warmth: 'Fragrance projects more on warm skin and in warm weather; pulse points (inner wrist, neck, inside of elbow, behind the knee) generate body heat that magnifies fragrance projection; applying to hair also projects scent because hair retains fragrance oils'
  }
};

export const FRAGRANCE_FAMILIES = {
  title: 'Fragrance Families',
  floral: {
    description: 'The largest fragrance family; dominated by flower-derived or flower-inspired scent molecules; ranges from single floral "soliflores" (one dominant flower note) to complex bouquets',
    subFamilies: ['Fresh Floral: light, watery, clean floral — white musks and water florals (Clinique Happy, Daisy Marc Jacobs)', 'Powdery Floral: soft, sweet, iris-heavy, warm floral (Chanel No.5, Guerlain Insolence)', 'Rich Floral: deep, heady florals — tuberose, narcissus, gardenia (Carnal Flower by Frederic Malle)', 'Rose: dedicated rose florals (Joy by Jean Patou, Une Rose by Frederic Malle)'],
    ethnicContext: 'Floral fragrance notes have deep cultural resonance in South Asian (rose, jasmine, mogra) and Middle Eastern (rose, orange blossom, oud florals) beauty traditions'
  },
  woody: {
    description: 'Warm, dry, rich, and earthy scents dominated by wood notes; from light clean cedar to deep dark oud and sandalwood',
    subFamilies: ['Warm Woody: sandalwood, vetiver, cedarwood, amber woods (Tam Dao, Santal 33)', 'Dry Woody: incense, aromatic woods, musks', 'Oud: resinous, sweet, smoky agarwood — a fragrance family in its own right; see oud section'],
    ethnicContext: 'Woody fragrances are culturally significant in Arab and West African traditions; oud is one of the most important fragrance materials in Arab culture; West African incense traditions also centre on woods and resins'
  },
  oriental: {
    
    culturalNote: 'The fragrance industry\'s "Oriental" category was named by Western perfumers for ingredients and aesthetics they associated with the "Orient"; many fragrance professionals now use "Amber" or "Resinous" as a replacement term to avoid the Orientalist implications',
    subFamilies: ['Amber/Resinous: benzoin, labdanum, vanilla, ambergris-inspired synthetics — warm, sweet, balsamic (Shalimar, Angel)', 'Spicy Oriental: cinnamon, cardamom, pepper, cloves in a warm base (Opium, Youth Dew)', 'Gourmand: edible-smelling sweet fragrances inspired by food — caramel, chocolate, pastry (Angel, Hypnotic Poison)'],
    ethnicContext: 'What Western perfumery calls "Oriental" fragrance is actually deeply rooted in the real fragrance traditions of the Arab world, South Asia, and East Africa; the cultural origin should be acknowledged, not exoticised'
  },
  fresh: {
    description: 'Light, clean, airy fragrances; the modern fragrance family that grew with the "clean living" aesthetic of the 1990s-2000s',
    subFamilies: ['Citrus: bergamot, lemon, grapefruit, yuzu — bright, effervescent (4711 Original, Eau d\'Orange Verte)', 'Aquatic/Marine: ozonic, sea-spray, fresh air notes (Cool Water, Escada Ocean Lounge)', 'Green: cut grass, crushed leaves, cucumber, herbs (Chanel No.19, Vent Vert)', 'Aromatic Fougère: lavender, herbs, oakmoss — classical men\'s fragrance structure'],
    note: 'Fresh fragrances typically have shorter longevity due to their light, volatile nature'
  }
};

export const OUD_GUIDE = {
  title: 'Oud — The Most Precious Fragrance Material',
  what: 'Oud (also written aoud, or known as agarwood or by its Japanese name jinko) is a resinous wood produced when certain species of Aquilaria trees become infected with a specific mould (Phialophora parasitica); the tree produces a dark, fragrant resin as a defence response; the infected heartwood is harvested as agarwood or oud',
  origin: {
    species: 'The primary oud-producing tree species are Aquilaria malaccensis (Assam, India), Aquilaria crassna (Cambodia, Thailand, Vietnam), and several related Aquilaria and Gyrinops species across South and Southeast Asia; different species and growing regions produce distinctly different scent profiles',
    regions: ['Hindi oud: from India and Bangladesh; rich, balsamic, sweet, slightly barnyard; most associated with traditional Islamic oud oil', 'Cambodian oud: lighter, sweeter, more floral; popular in Western perfumery', 'Vietnamese/Laotian oud: complex, multi-faceted, very highly regarded; some of the most expensive oud comes from Laos', 'Papua New Guinean oud: earthy, dark; the most "wild" and barnyard of commercial oud']
  },
  
  culturalSignificance: {
    Arab: 'Oud is culturally central to Arab beauty and hospitality traditions; burning oud chips or oud incense (known as bakhoor when blended with other ingredients) is done in homes, at celebrations, and for personal fragrance; oud oil applied directly to the skin or to clothing is traditional; gifting fine oud is a significant social gesture in Arab culture; oud is explicitly mentioned in Islamic fragrance traditions (the Prophet Muhammad reportedly favoured oud and encouraged its use)',
    SouthAsia: 'Oud (called "agaru" in Sanskrit) has a 3,000-year history in South Asian use; referenced in Ayurvedic texts; used in temple incense; Indian oud is a distinct and important variety',
    EastAsia: 'Japanese "jinko" (沈香) is oud; used in Japanese incense (kōdō — the art of incense appreciation); Chinese incense traditions also use oud',
    WestAfrica: 'West African incense traditions include oud alongside local woods and resins'
  }
};

export const TRADITIONAL_ETHNIC_FRAGRANCES = {
  'west-african': {
    traditions: 'West African fragrance traditions centre on incense burning (resins and woods burned on charcoal), body oiling with scented oils, and the use of local aromatic plants; the use of fragrant smoke to perfume the body, hair, and clothing is ancient',
    keyIngredients: ['African oud varieties (Aquilaria species found in parts of West Africa are less common than Southeast Asian varieties but are used)', 'Shea butter fragranced with local botanicals', 'Frankincense and myrrh (the Boswellia and Commiphora species grown in the Horn of Africa trade across West Africa)', 'Local aromatic grasses and herbs', 'African musk (civet cat secretion historically; now synthetic civet musks)', 'Suede and leather accord fragrances inspired by West African leather crafting traditions'],
    modernScents: 'Contemporary West African niche perfumery draws on these traditions; Lagos has a growing niche fragrance scene'
  },
  'south-asian': {
    traditions: 'South Asian fragrance traditions are among the most sophisticated and ancient in the world; the art of itr (natural perfume), the use of mogra (jasmine) garlands, the burning of dhoop incense, and the tradition of fragrant powders and pastes are thousands of years old; Kannauj, Uttar Pradesh is the historic heart of Indian perfumery and still produces traditional itrs using the deg-bhapka (copper distillation) method',
    keyIngredients: ['Rose (gulab): Rosa damascena grown in Kannauj and Uttar Pradesh; foundational to Indian perfumery', 'Jasmine (mogra, chameli): intensely floral; used in garlands, hair adornment, and itr',  'Vetiver (khus): grass root with a deep earthy, smoky, and cooling scent; traditional in Indian summer fragrances', 'Mitti (earth) attar: a uniquely Indian attar made by distilling the first rains on dry earth (petrichor) into sandalwood; the scent of rain on dry soil', 'Saffron: the spice used as a fragrance ingredient in Indian perfumery', 'Ambergris: historical Indian fragrance ingredient from sperm whale intestine; now primarily synthetic'],
    modernScents: 'Indian brands Naso Profumi, Bombay Perfumery, and All Good Scents have created modern fragrances rooted in Indian traditional ingredients; international houses like Diptyque and Serge Lutens have drawn on Indian fragrance traditions'
  },
  caribbean: {
    traditions: 'Caribbean fragrance traditions reflect the African, European, and Indigenous influences that shaped Caribbean culture; tropical florals (hibiscus, plumeria, jasmine) and fruits (mango, coconut, lime) are central; Caribbean women historically fragranced their hair and body with coconut oil and scented tropical flower waters',
    keyIngredients: ['Coconut: the defining Caribbean fragrance note — not the synthetic sunscreen coconut but the real creamy tropical nut scent', 'Lime and citrus: key lime, Seville orange, and grapefruit in the Caribbean heat; light and refreshing', 'Plumeria/frangipani: the flower that is virtually synonymous with tropical fragrance; white, creamy, intensely floral', 'Hibiscus: light, slightly tart, floral', 'Tropical woods: Caribbean mahogany, cedar', 'Bay rum: a traditional Caribbean fragrance ingredient; distilled from the bay leaf (Pimenta racemosa) in rum; a classic West Indian fragrance used for hair and skin'],
    bayRum: {
      what: 'Bay rum is a traditional West Indian grooming fragrance made by distilling bay leaves (Pimenta racemosa, not culinary bay) in rum; used as a hair tonic, aftershave, and body rub; originated in Saint Thomas, US Virgin Islands; a true icon of Caribbean fragrance tradition',
      modern: 'Modern bay rum products range from artisan productions using real Pimenta racemosa and Caribbean rum to synthetic approximations; the classic brands Pinaud, Ogallala, and West Indian Bay Rum are widely available'
    }
  },
  arab: {
    
    keyIngredients: ['Oud: see full oud section; the most important Arab fragrance material',  'Musk: historically from the musk deer gland (now banned); modern Arab perfumery uses high-quality synthetic musks; Arab fragrance uses musk generously as a skin note', 'Amber: in Arab perfumery, amber refers to a specific warm-resinous-sweet base note made from labdanum, benzoin, and musks (distinct from the petrified tree resin "amber")', 'Frankincense (luban): burned as incense extensively in Arab world; also used in perfumery; cooling, slightly citrusy-pine resinous scent', 'Myrrh: bitter-sweet resinous scent; used in bakhoor (incense blends)', 'Bakhoor: blends of oud chips, rose water, sandalwood, musks, and other ingredients bound with a binder and burned on charcoal to fragrance a room and the body'],
    GulfFragrance: {
      culture: 'Gulf Arab (Saudi Arabia, UAE, Kuwait, Bahrain, Qatar) fragrance culture is the most extravagant and concentrated fragrance culture in the world; spending per capita on fragrance in the Gulf far exceeds any other market; very high concentrations (extrait strength), very rich and complex formulas, and generous application are the norm',
      brands: 'Gulf perfume houses include: Amouage (Oman), Abdul Samad Al Qurashi, Arabian Oud, Rasasi, Lattafa, Swiss Arabian; these houses are known for oud and amber compositions',
      tradition: 'Pouring oud oil from a dallah (small ornate bottle) as a gesture of hospitality; passing a mabkhara (incense burner) around the gathering to fragrance everyone\'s clothing is a traditional Gulf hospitality ritual'
    }
  },
  latina: {
    traditions: 'Latin American fragrance traditions draw on Indigenous botanical knowledge, Spanish colonial floriculture, and African influences in the Caribbean-Latin communities; bright citrus and floral fragrances dominate in tropical Latin America; deep spiced and resinous fragrances are traditional in Andean and Mexican communities; copal incense burning has Mesoamerican Indigenous roots',
    keyIngredients: ['Copal: an aromatic resin from trees of the Bursera family; used in Mesoamerican Indigenous ceremonies for millennia; burned as sacred incense; sweet, slightly vanilla-pine, and woody', 'Tropical fruits: mango, papaya, guava, passion fruit as fragrance notes', 'Orange blossom (azahar): common in Mexican and Latin American floriculture; intensely white floral', 'Eucalyptus: used in many Latin American folk medicine contexts; fresh, camphoraceous', 'Vanilla: Vanilla planifolia originated in Mexico (Mesoamerica); Mexican vanilla is a premium ingredient; the warm, sweet vanilla note is central to many Latin American fragrances', 'Jasmine (jazmín): common garden flower in warm Latin American climates'],
    copal: {
      what: 'Copal is the aromatic resin from various Bursera species trees; distinct from oud but occupies a similar cultural space in Mesoamerican tradition; sacred and ceremonial use by Aztec, Maya, and other Mesoamerican cultures; burning copal to purify a space or communicate with ancestors',
      modern: 'Copal is being incorporated into contemporary niche Mexican and Latina fragrance brands; Perfume brand Xocolatl Mayan Chocolate and niche Mexican houses have created modern copal fragrances'
    }
  },
  'east-asian': {
    
    japaneseKodo: {
      what: 'Kōdō (香道) — "the way of fragrance" — is the Japanese ceremonial practice of identifying and appreciating incense; like the tea ceremony (chadō) and flower arranging (kadō), it follows strict aesthetic principles and ritual protocols; kōdō uses extraordinary rare ingredients including jihi (frankincense), baieido (sandalwood), and exceptional jinko (oud) from Laos and Cambodia',
      theGame: 'Kumiko (incense games) are competitive identification challenges where participants smell burning incense and identify the ingredients; traditionally held at aristocratic gatherings in Heian-period Japan; still practiced today'
    },
    chinesePerfumery: {
      history: 'Chinese incense and fragrance history dates back thousands of years; the Silk Road made China a transit point for aromatic ingredients from Arabia, India, and Southeast Asia; Chinese incense making is a sophisticated craft with regional styles; Chinese court perfumery blended oud (沉香), sandalwood, and local aromatics',
      sacredIngredients: 'Chinese traditional medicine and cosmology assigned properties to specific aromatic ingredients; many overlap with TCM (Traditional Chinese Medicine) applications'
    },
    kbeautyFragrance: {
      trend: 'Korean beauty culture has experienced a fragrance renaissance in the 21st century; Korean niche perfumery brands (Tamburins, Roen, Granhand, Around the Corner) are producing critically acclaimed fragrances; the K-beauty emphasis on subtle "skin scent" and natural-effect beauty extends to fragrance — lighter concentrations and quieter, skin-like musks are preferred over heavy projection'
    },
    keyIngredients: ['Japanese incense woods (jinko/oud, sandalwood, cypress)', 'Green tea: a popular modern East Asian fragrance note; freshly vegetal, slightly astringent', 'Cherry blossom (sakura): both natural and synthetic sakura notes in Japanese fragrance', 'Yuzu: Japanese citrus; bright, tart, slightly floral — distinct from lemon or lime', 'Hinoki cypress: the wood of Japanese cypress; warm, woody, clean; the scent of Japanese bathhouses', 'Osmanthus: apricot-tea-fruity flower found throughout East Asia; iconic in Chinese perfumery']
  },
  'east-african': {
    traditions: 'East African fragrance traditions centre on incense burning, body oiling with fragrant oils, and fumigation techniques; the Horn of Africa (Somalia, Ethiopia, Eritrea) is the world\'s primary source of frankincense and myrrh, making these regions the historical origin of the most important fragrance ingredients in human history',
    frankincenseAndMyrrh: {
      origin: 'Somalia and Ethiopia are home to the Boswellia (frankincense-producing) and Commiphora (myrrh-producing) trees; the Somali city of Bosaso was an ancient trade port exporting these resins to Egypt (for mummification), Arabia, Rome, and beyond; East Africa IS the origin of the global incense trade',
      frankincense: 'Frankincense (lubaan in Somali, etan in Tigrinya) is burned as incense in homes throughout East Africa; it cleanses the air, has antimicrobial properties, and is used in traditional medicine; the smoke is used to fragrance the body, hair, and clothing',
      myrrh: 'Myrrh (qafal in Somali) is also used as incense; it has a more bitter, resinous, and complex scent than frankincense; used in traditional medicine and cosmetics throughout East Africa'
    },
    keyIngredients: ['Frankincense: the defining fragrance material of East Africa', 'Myrrh: complementary to frankincense', 'Sesame oil: used as a body oil base, sometimes fragranced', 'Sandalwood: imported but widely used', 'Oud: traded from Southeast Asia through Arabian traders into East Africa for centuries', 'Henna (lawsonia): the plant has a distinctive earthy-sweet scent, especially when fresh'],
    diaspora: 'East African diaspora in Scandinavia (Stockholm, Oslo, Copenhagen have large Somali communities), UK, North America, and Australia have brought incense burning and body oiling traditions; the scent of burning frankincense is a powerful cultural marker for many East African diaspora individuals'
  },
  'south-african': {
    traditions: 'South African fragrance traditions draw on Zulu, Xhosa, Sotho, Tswana, and other Bantu-speaking traditions of body oiling and plant medicine; Cape Malay traditions (Muslim South Africans of Malaysian heritage) brought incense and attars; Indigenous Khoisan traditions used local plants; Dutch and British colonial influences brought European floriculture to the Cape (where rooibos, buchu, and fynbos botanical perfumery now flourishes)',
    fynbosPerfumery: {
      what: 'Fynbos is the extraordinary unique botanical biome of the Western Cape of South Africa; it covers only 90,000 km² but contains over 9,000 plant species, 6,000 of which are found nowhere else on Earth; the Cape Floral Region is a UNESCO World Heritage Site and a biodiversity hotspot; many fynbos plants produce aromatic compounds of great interest to perfumers',
      species: ['Rooibos (Aspalathus linearis): well-known as tea; the aromatic compounds are earthy, slightly sweet, and woody; used in perfumery', 'Buchu (Agathosma betulina): indigenous South African aromatic plant with a distinctive blackcurrant-like note; used in cosmetics and perfumery; a uniquely South African scent', 'Cape jasmine (various fynbos Gardenias)', 'Pelargonium species (source of geranium essential oil; Cape pelargonium is distinct from European rose geranium)']
    },
    keyIngredients: ['Buchu: the most distinctive South African fragrance ingredient', 'Rooibos: earthy, distinctive', 'Marula: the marula oil has a very subtle but pleasant almond-like scent', 'Baobab: baobab oil has a mild pleasant scent used in cosmetics'],
    modernBrands: 'Hendricks Gin launched "Buchu" as an herbal botanical; South African fragrance brand Cocolily and niche house Afamuji use South African botanicals; buchu-inspired fragrances from South African niche houses are gaining international attention'
  },
  'black-american': {
    traditions: 'Black American fragrance traditions have multiple roots: West and Central African incense and body oiling traditions that survived the Middle Passage; adoption and transformation of mainstream American commercial fragrance; and the development of distinctly Black American fragrance aesthetics rooted in boldness, richness, and longevity',
    
    bodyOilTradition: {
      what: 'Black American body oil traditions — concentrated fragrance oils (without alcohol) applied directly to skin — have roots in West African oiling traditions and have developed through the unique Black American experience; Black-owned fragrance oil vendors selling concentrated oils at street markets and in beauty supply stores are a long-standing economic and cultural tradition',
      advantages: 'Pure fragrance oil (no alcohol) lasts significantly longer on skin than alcohol-based spray fragrance; particularly beneficial for dry skin types; the warmth of the skin melts and spreads the oil; concentrated oils are also more cost-effective per application',
      vendors: 'Street fragrance oil vendors in Black American communities sell "impression" oils inspired by designer fragrances; this tradition has created a unique fragrance economy and a distinctive Black American relationship to perfume as accessible luxury'
    },
    keyIngredients: ['Vanilla: central to many Black American beauty traditions; "Black Vanilla" is a distinctive aesthetic', 'Amber: warm, resinous richness', 'Musk: heavy white and dark musks', 'Oud: the Black American adoption of oud fragrance has been significant; Black American consumers are among the largest buyers of oud-inspired Western and Arab fragrance'],
    brands: 'Black-owned fragrance brands include Forvr Mood (Jackie Aina) and Fenty Beauty, which launched Fenty Eau de Parfum'
  }
};

export function getFragranceScience(section) {
  const map = {
    concentrations: FRAGRANCE_SCIENCE.concentrationTypes,
    pyramid: FRAGRANCE_SCIENCE.pyramidStructure,
    chemistry: FRAGRANCE_SCIENCE.naturalVsSynthetic,
    skin: FRAGRANCE_SCIENCE.skinChemistry
  };
  return map[section] || FRAGRANCE_SCIENCE;
}

export function getFragranceFamilies(family) {
  const map = {
    floral: FRAGRANCE_FAMILIES.floral,
    woody: FRAGRANCE_FAMILIES.woody,
    oriental: FRAGRANCE_FAMILIES.oriental,
    fresh: FRAGRANCE_FAMILIES.fresh
  };
  return map[family] || FRAGRANCE_FAMILIES;
}

export function getOudGuide() {
  return OUD_GUIDE;
}

export function getTraditionalEthnicFragrance(communityId) {
  const directMap = {
    'west-african': TRADITIONAL_ETHNIC_FRAGRANCES['west-african'],
    'south-asian': TRADITIONAL_ETHNIC_FRAGRANCES['south-asian'],
    caribbean: TRADITIONAL_ETHNIC_FRAGRANCES.caribbean,
    arab: TRADITIONAL_ETHNIC_FRAGRANCES.arab,
    latina: TRADITIONAL_ETHNIC_FRAGRANCES.latina,
    'east-asian': TRADITIONAL_ETHNIC_FRAGRANCES['east-asian'],
    'east-african': TRADITIONAL_ETHNIC_FRAGRANCES['east-african'],
    'south-african': TRADITIONAL_ETHNIC_FRAGRANCES['south-african'],
    'black-american': TRADITIONAL_ETHNIC_FRAGRANCES['black-american']
  };
  return directMap[communityId] || null;
}

