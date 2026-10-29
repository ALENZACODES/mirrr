/**
 * MIRRR — Fragrance Guide: Types, Notes & Ethnic Fragrance Traditions
 * From oudh to Ayurvedic florals, Caribbean spices to African botanicals.
 * Covers fragrance science, application, and cultural context for all 9 communities.
 */

export const FRAGRANCE_SCIENCE_OVERVIEW = {
  title: 'Fragrance Science & Structure',
  whatIsFragrance: `Fragrance (parfum) is a complex blend of aromatic compounds dissolved in alcohol and/or oil. The art of perfumery involves selecting and balancing hundreds of ingredients — natural extracts, synthetic aroma chemicals, and fixatives — to create a coherent olfactory experience that evolves over time.`,
  fragranceConcentrations: [
    {
      name: 'Parfum (Extrait de Parfum)',
      concentration: '20–40% aromatic compounds',
      alcohol: '60–80%',
      longevity: '8–12+ hours',
      sillage: 'Very strong',
      price: 'Highest',
      bestFor: 'Special occasions; cooler skin types; those who want maximum longevity'
    },
    {
      name: 'Eau de Parfum (EdP)',
      concentration: '15–20% aromatic compounds',
      alcohol: '80–85%',
      longevity: '6–8 hours',
      sillage: 'Strong',
      price: 'High',
      bestFor: 'Most day/evening wear; versatile; most popular concentration'
    },
    {
      name: 'Eau de Toilette (EdT)',
      concentration: '5–15% aromatic compounds',
      alcohol: '85–90%',
      longevity: '3–5 hours',
      sillage: 'Moderate',
      price: 'Moderate',
      bestFor: 'Daytime, work environments where strong scent is inappropriate; hot climates where lighter wear is preferred'
    },
    {
      name: 'Eau de Cologne (EdC)',
      concentration: '2–4% aromatic compounds',
      alcohol: '96–98%',
      longevity: '2–3 hours',
      sillage: 'Light',
      price: 'Lower',
      bestFor: 'Refreshing light scent; summer; post-gym; layering under stronger fragrance'
    },
    {
      name: 'Eau Fraîche',
      concentration: '1–3% aromatic compounds',
      alcohol: '97–99%',
      longevity: '1–2 hours',
      sillage: 'Very light',
      price: 'Lowest',
      bestFor: 'Extremely subtle freshness; body sprays; young or fragrance-sensitive wearers'
    },
    {
      name: 'Perfume Oil / Attar',
      concentration: '15–30%+ in carrier oil',
      alcohol: 'None (or minimal)',
      longevity: '6–10+ hours',
      sillage: 'Intimate; sits close to skin',
      price: 'Variable (traditional attars: expensive)',
      bestFor: 'Those with alcohol sensitivity; very dry skin (oil lasts longer); intimate personal scent tradition; cultural/religious contexts where alcohol is avoided',
      note: 'Traditional Middle Eastern and South Asian fragrance form; alcohol-free nature important in Islamic practice'
    }
  ],
  olfactoryNotes: {
    description: 'Fragrance notes describe the scent impression at different times after application — the scent evolves as different compounds volatilise',
    topNotes: {
      timeframe: 'First 0–30 minutes',
      characteristics: 'First impression; volatile; evaporate quickly',
      common: ['citrus: bergamot, lemon, grapefruit, lime, mandarin', 'herbs: lavender, rosemary, eucalyptus', 'light florals: aldehydes', 'pepper, cardamom, ginger (spice top notes)'],
      role: 'Attract initial attention; the "shop smell" that draws you in; not the soul of the fragrance'
    },
    heartNotes: {
      timeframe: '30 minutes – 3 hours',
      characteristics: 'The character of the fragrance; less volatile than top; more stable',
      common: ['florals: rose, jasmine, ylang-ylang, iris, violet, tuberose', 'spices: cinnamon, clove, nutmeg', 'green: geranium, grass, herbs'],
      role: 'The "true" fragrance; what you are really smelling in the wear'
    },
    baseNotes: {
      timeframe: '3+ hours',
      characteristics: 'Longest lasting; heaviest molecules; fix the fragrance to skin',
      common: ['woods: sandalwood, cedarwood, vetiver, patchouli, oud', 'musks: white musk, ambrette', 'resins: benzoin, labdanum, myrrh, frankincense', 'vanilla, coumarin, amber, civet (now usually synthetic)'],
      role: 'The foundation that remains; what you smell hours later; what gives a fragrance depth and longevity'
    }
  },
  olfactoryFamilies: {
    floral: {
      description: 'Dominated by flower extracts or accords; the most popular fragrance family, especially for feminine-marketed fragrances',
      subTypes: ['soliflore (single flower focus)', 'floral bouquet (many flowers)', 'fruity floral', 'green floral', 'powdery floral (iris, violet, mimosa)'],
      icons: ['Rose: queen of flowers; complex; can be honeyed, spicy, green, or fresh', 'Jasmine: rich, indolic, narcotic; almost universal heart note', 'Ylang-ylang: tropical, creamy, banana-like; common in oriental/floral blends']
    },
    oriental: {
      description: 'Warm, rich, spicy, resinous; traditionally associated with East/Middle East though often Westernised interpretations; now often called "amber" or "gourmand"',
      subTypes: ['soft oriental (subtle, powdery)', 'oriental (spices + resins + amber + musks)', 'woody oriental (oud, sandalwood)'],
      characters: ['Amber: synthetic accord combining labdanum, benzoin, and vanilla — gives that enveloping warmth', 'Oud: agarwood resin; see Arab section for full profile']
    },
    fresh: {
      description: 'Clean, aquatic, citrusy, or green; airy and light; modern and widely popular',
      subTypes: ['citrus/hesperidic', 'aquatic/marine', 'green (cut grass, violet leaf)', 'ozonic (open air accords)'],
      notes: 'Often shortest longevity due to lighter, more volatile molecules; EdT concentrations common'
    },
    woody: {
      description: 'Dry, warm, earthy wood accords; usually unisex or masculine-leaning',
      subTypes: ['dry woods (cedar, vetiver)', 'mossy woods (oakmoss, labdanum)', 'aromatic woods (rosemary, lavender + cedar)'],
      keyIngredients: ['Sandalwood: creamy, smooth, almost milky wood', 'Cedarwood: dry, pencil-like, sharp', 'Vetiver: earthy, smoky, rooty — "man\'s smell" but beautiful in feminine fragrances', 'Patchouli: heavy, dark, earthy; associated with 1970s; used heavily in oriental blends']
    },
    chypre: {
      description: 'Oak moss + labdanum + bergamot accord at base; sophisticated, complex, "vintage"; many classic luxury fragrances',
      history: 'Named for Cyprus (Chypre); Coty\'s 1917 Chypre established the family',
      subTypes: ['fruity chypre', 'floral chypre', 'green chypre'],
      restriction: 'Oak moss (Evernia prunastri) now severely restricted by IFRA (International Fragrance Association) due to allergy concerns; many classic chypres reformulated, changing their character'
    },
    fougère: {
      description: 'Lavender + coumarin + oakmoss; "fern-like"; foundation of most traditional masculine fragrances',
      origin: 'Houbigant\'s Fougère Royale (1882) — first synthetic fine fragrance using coumarin',
      modern: 'Coumarin, lavender, and woods remain the masculine fragrance DNA in most drugstore scents'
    }
  }
};

export const FRAGRANCE_APPLICATION_GUIDE = {
  title: 'Fragrance Application & Wear',
  application: {
    pulsePoints: {
      description: 'Pulse points are areas where blood vessels are close to skin surface; warmth helps diffuse fragrance molecules into the air',
      points: ['wrists', 'neck/carotid area', 'behind ears', 'inside elbows', 'behind knees', 'chest/cleavage'],
      tip: 'Apply, do not rub — rubbing breaks fragrance molecules and distorts the scent. Spray or dab, then let dry naturally.'
    },
    skinPrep: {
      dryVsMoisturised: 'Moisturised skin holds fragrance significantly longer than dry skin. Unscented body lotion or petroleum jelly applied first creates a base.',
      skinChemistry: 'Skin chemistry (pH, natural oils, microbiome) dramatically affects how a fragrance smells on you vs on someone else or on a test strip. Always test on skin.'
    },
    layering: 'Fragrance layering: combining complementary scents for unique complexity. Body wash, lotion, and parfum from same range reinforces scent. Different brands: base a deeper/heavier scent, top with lighter/fresher one.',
    hairFragrance: {
      benefit: 'Hair holds and diffuses scent beautifully — hair fibres create excellent surface area',
      caution: 'Alcohol in parfum can dry hair over time; spray into air and walk through, or apply to brush/comb then run through hair; or use specifically formulated hair mist (lower alcohol)'
    },
    clothes: 'Fragrance on fabric lasts much longer than on skin; some compositions show better on textiles. Note: some fragrances stain (high fixatives, dark base notes). Test on inner seam first.',
    storage: { ideal: 'Dark, cool, stable temperature away from light, heat, humidity. Avoid bathroom (temperature fluctuations). Original box helps. Most fine fragrances last 3-5+ years stored properly; some improve with age (low aldehydics; woody orientals).' }
  },
  fragranceAllergy: {
    prevalence: '1–3% of general population; higher in those with atopic conditions',
    IFRA: 'International Fragrance Association sets safety standards for ingredient concentrations; most reputable brands comply',
    commonAllergens: ['cinnamal (cinnamon bark)', 'eugenol (clove)', 'geraniol (rose/geranium)', 'hydroxycitronellal (lily-of-the-valley accord)', 'isoeugenol', 'oak moss (now restricted)', 'tree moss', 'linalool (lavender)', 'limonene (citrus — oxidises to allergen over time)'],
    testProtocol: 'Patch test new fragrance on inner wrist for 24 hours before wearing near face or applying widely',
    sensitisation: 'Allergy can develop after years of safe use (sensitisation); if reaction develops to previously tolerated fragrance, stop use'
  },
  sustainable_fragrance: {
    concerns: ['Some natural extracts involve endangered species: musk deer (natural musk now synthetic in nearly all commercial fragrance), civet cat (largely synthetic), ambergris (whale; now synthetic), rosewood/sandalwood/agarwood (sustainability concerns)', 'Synthetic aroma chemicals: often more sustainable than natural equivalents; safety tested; consistent'],
    certifications: ['COSMOS-certified fragrances', 'EcoCert for naturals', 'B Corp certified fragrance houses'],
    trend: 'Upcycled fragrance ingredients (wine pomace, coffee grounds, peach pit) growing trend in sustainable perfumery'
  }
};

export const WEST_AFRICAN_FRAGRANCE = {
  communityName: 'West African',
  title: 'West African Fragrance Traditions',
  traditionalFragrance: {
    sheaButter: 'Naturally fragrant with a mild nutty-sweet scent; used unscented or infused with botanicals across West Africa for skin and hair',
    osun: 'Camwood powder (Baphia nitida) — a red aromatic powder used in traditional Yoruba ceremony; earthy, woody; applied to skin for festivals and rites of passage',
    ose_dudu: 'Traditional West African black soap from shea butter, plantain ash, cocoa pod ash; naturally fragrant',
    locust_bean: 'Fermented locust bean (dawadawa/iru) — intensely aromatic; used in cooking but its complex sweet-umami note has inspired modern niche perfumers',
    oud_influence: 'West African Muslims adopted Middle Eastern oud tradition; bakhoor burning common in Nigerian Muslim households'
  },
  modernWestAfricanFragrance: {
    inspiration: 'West African niche perfumers and brands increasingly bringing authentic ingredients into fine fragrance',
    ingredients: ['Shea: creamy, nutty, lactonic quality', 'Sandalwood from Cameroon: unique terroir character', 'Bissap/hibiscus: tart, fruity, floral; used in West African perfumery', 'Tonka bean from Venezuela (strong West African trade connection): coumarin-like, sweet, almond-vanilla'],
    wearStyle: 'West African fragrance culture: bold, present, unmistakable; the fragrance announces arrival. Sillage (projection) valued highly.'
  },
  recommendedNotes: ['sandalwood', 'shea', 'amber', 'musk', 'warm spice', 'tonka', 'incense', 'florals (hibiscus, ylang-ylang)']
};

export const SOUTH_ASIAN_FRAGRANCE = {
  communityName: 'South Asian',
  title: 'South Asian Fragrance Traditions',
  attar_tradition: {
    definition: 'Attar (also itr or otto) — alcohol-free concentrated perfume oil; South Asia\'s indigenous fragrance form',
    history: 'Distillation of flowers and aromatics into sandalwood base oil; over 5,000 years of documented history; ancient Sanskrit texts reference agarbatti and fragrance as spiritual practice',
    productionMethod: 'Traditional deg-bhapka: copper still over fire, bamboo receiver, slow cold distillation into old sandalwood base oil; sandalwood absorbs and fixes floral essences',
    classicAttars: [
      { name: 'Gulab (Rose)', source: 'Rosa damascena and R. bourboniana from Kannauj and Kashmir', character: 'Rich, honeyed, slightly earthy rose — far more complex than Western rose fragrance' },
      { name: 'Kewra (Pandanus)', source: 'Pandanus flower distillation', character: 'Sweet, green, almost coconut-like floral; very distinctly South Asian scent' },
      { name: 'Mitti Attar', source: 'Petrichor — first rain on dry earth; distilled from baked clay of Kannauj', character: 'Earthy, rain-on-soil; beloved seasonal attar applied before monsoon arrives; the original "petrichor in a bottle"', uniqueness: 'One of the world\'s most unusual fragrance raw materials; entirely unique to India' },
      { name: 'Bakhoor/Oud', source: 'Middle Eastern tradition adopted in South Asian Muslim communities', character: 'Rich, complex, animalic, deeply woody' },
      { name: 'Hina', source: 'Complex blend with base of sandalwood; henna flowers', character: 'Warm, floral, balsamic, oriental — the scent of Rajasthan' }
    ],
    KannaujIndia: 'Kannauj, Uttar Pradesh — the "Grasse of India"; centuries-old attar production city; PGI designation for Kannauj attar'
  },
  incense_culture: {
    agarbatti: 'Incense stick (agarbatti) burning is daily practice in most Hindu and Jain households; morning and evening puja (prayer) includes incense offering',
    key_incense: ['Sandalwood: sacred; purifying; used in Hindu and Buddhist practice', 'Jasmine: offered to Goddess Lakshmi; auspicious', 'Champa: Plumeria/frangipani; iconic of South Asian temple culture', 'Rose: Muslim dargah (shrine) tradition; offered at Sufi shrines', 'Nag champa: the globally recognised Indian incense — amber, sandalwood, floral blend'],
    dhoop: 'Dhoop cones and sticks — thicker, smokier incense; resin-heavy'
  },
  ayurvedicFragrance: {
    connection: 'Ayurveda classifies aromatics by their effects on doshas (body constitutions)',
    vataPacifying: ['Warm, sweet, heavy scents: vanilla, sandalwood, jasmine, rose, lavender', 'For Vata imbalance: anxiety, dryness, restlessness'],
    pittaPacifying: ['Cool, sweet, calming: jasmine, rose, neroli, mint, khus/vetiver', 'For Pitta imbalance: heat, irritation, inflammation'],
    kaphaPacifying: ['Stimulating, lighter scents: eucalyptus, camphor, ginger, black pepper', 'For Kapha imbalance: heaviness, congestion, lethargy'],
    abhyangaOils: 'Traditional self-massage oils typically scented with sesame base + herb/spice additions'
  },
  recommendedNotes: ['rose', 'jasmine', 'sandalwood', 'vetiver (khus)', 'cardamom', 'saffron', 'amber', 'oud', 'tuberose', 'kewra']
};

export const CARIBBEAN_FRAGRANCE = {
  communityName: 'Caribbean',
  title: 'Caribbean Fragrance Traditions',
  tropical_palette: {
    description: 'Caribbean fragrance draws from extraordinary biodiversity: tropical flowers, spices, rum, salt air, and warm woods',
    ingredients: ['Lime: Kaffir lime and Caribbean lime; intensely aromatic; foundational to classic Colognes', 'Bay rum: Bay leaf (Pimenta racemosa) in rum spirit; the quintessential Caribbean gentleman\'s aftershave/fragrance tradition since 1800s', 'Vetiver from Haiti: Haitian vetiver is world\'s highest quality; earthy, smoky, rooty; most vetiver in global perfumery sourced from Haiti', 'Ylang-ylang from Comoro Islands (exported through Caribbean): tropical, creamy, heady floral', 'Nutmeg from Grenada ("Island of Spice"): warm, spicy, complex', 'Vanilla from Madagascar/Caribbean: sweet, creamy, balsamic — one of world\'s most prized aromatics', 'Cacao/chocolate: not traditional fragrance but emerging as artisan and niche note from Caribbean origins'],
    bayRum: {
      history: 'Bay rum originated in US Virgin Islands (Danish West Indies) in 1800s when sailors discovered Pimenta racemosa leaves flavoured rum spirit; became beloved men\'s aftershave and hair tonic',
      traditional: 'Traditional bay rum: West Indian bay leaf steam-distilled and blended with rum spirit and spices (clove, cinnamon, nutmeg)',
      modern: 'Modern Bay Rum fragrances: Jack Black, Captain\'s Choice, many artisan perfumers'
    }
  },
  perfumeOilTradition: 'Fragrance oil blends popular in Caribbean communities; Caribbean-origin perfumers create complex oil blends referencing ocean, tropical flora, rum, and spice; applied directly to pulse points without alcohol (important for sensitive skin)',
  recommendedNotes: ['lime', 'bay rum', 'vetiver', 'ylang-ylang', 'nutmeg', 'coconut', 'vanilla', 'sea salt/marine', 'amber', 'rum accord']
};

export const ARAB_FRAGRANCE = {
  communityName: 'Arab',
  title: 'Arab Fragrance Traditions',
  oud_culture: {
    whatIsOud: 'Oud (عود) also called agarwood or aloeswood — resinous heartwood from Aquilaria trees infected with Phialophora parasitica fungus; the tree produces dark aromatic resin as immune response; the resin-saturated wood is oud',
    scarcity: 'Among the most expensive raw materials in the world; true wild oud has sold for over $30,000/kg; sustainability crisis has led to plantation cultivation',
    aroma: 'Complex, multidimensional: initially may present animalic/medicinal; develops warm woody, leathery, balsamic, slightly sweet character; smoke and incense notes',
    grading: { super: 'Wild old-growth highest quality', first_grade: 'Old plantation or choice wild cuts', second_grade: 'Standard plantation quality', hindi: 'Indian agarwood (Aquilaria malaccensis) — darker, earthier, more animalic', cambodian: 'Cambodian oud — lighter, sweeter, more resinous', thai: 'Thai oud — similar to Cambodian; often lighter', kynam: 'Kyara/kinam — rarest grade; slightly sweet, cooler character; extraordinarily expensive' },
    regions: 'Gulf: heavy oud-forward fragrances; pure oud preferred; Levant: lighter, more rose-forward; Egypt: mixed traditions'
  },
  bakhoor: {
    description: 'Bakhoor (بخور) — woodchips or pressed blocks of agarwood and other aromatics soaked in fragrant oils; burned on charcoal in mabkhara (incense burner)',
    tradition: 'Burning bakhoor is a fundamental Arab hospitality tradition; homes are perfumed with bakhoor to welcome guests; mosques use bakhoor to perfume the prayer space',
    types: ['Pure oud chips: burning chips of agarwood directly — maximum cost, maximum beauty', 'Bakhoor blends: oud chips combined with rose water, musks, amber resin, spices', 'Al-Wazeer, Al-Haramain: well-known Gulf bakhoor brands'],
    procedure: 'Charcoal brick lit and allowed to grey; bakhoor placed on top; smoke wafted through hair, clothing, rooms; a form of body fragrance application unique to Arab tradition'
  },
  rose_culture: {
    taif_rose: 'Rose of Taif (Rosa × damascena from Taif, Saudi Arabia) — one of world\'s most prized rose sources; altitude and climate create intense rose oil; harvested 30-day window in April; primary production for Arab perfume market',
    rose_water: 'Rose water (ماء الورد) — by-product of rose oil distillation; used as skin toner, cooking flavouring, religious ritual; sprinkled on guests in Gulf hospitality tradition',
    damask_rose: 'Rosa damascena from Bulgaria (Valley of Roses), Turkey, Iran, Morocco: primary world sources; Bulgarian rose absolute commands extreme prices'
  },
  arabPerfumers: {
    history: 'Arab/Islamic civilisation developed distillation; Ibn Sina (Avicenna, 980–1037 CE) refined steam distillation; first to isolate true alcoholic attars/essences',
    modernLuxuryHouses: ['Swiss Arabian: Dubai-based; oud and oriental specialists', 'Al Haramain: Saudi Arabian mass-luxury fragrance', 'Arabian Oud: KSA; one of world\'s largest oud companies', 'Ajmal: UAE; multi-generational perfume family'],
    gender_free: 'Traditional Arab fragrance has no gendered marketing; heavy, rich orientals worn by all genders; oud especially is traditionally masculine but universally enjoyed'
  },
  recommendedNotes: ['oud/agarwood', 'rose (especially Taif)', 'amber', 'musk', 'sandalwood', 'saffron', 'incense/frankincense', 'cardamom', 'jasmine']
};

export const LATINA_FRAGRANCE = {
  communityName: 'Latina',
  title: 'Latina/Latino Fragrance Traditions',
  floral_latin: {
    description: 'Latin American fragrance culture celebrates bold florals, tropical notes, warmth, and romance; inspired by incredible botanical diversity across the continent',
    ingredients: ['Tiare flower (Gardenia taitensis): Polynesian but popular across Latin American perfumery; creamy, exotic floral', 'Ylang-ylang: tropical, heady; popular in Latin romantic fragrances', 'Jasmine: present in the warmer regions of South America', 'Vanilla from Mexico and Madagascar: vanilla orchid originated in Mexico; pre-Columbian Totonac people first cultivated it', 'Cacao: Theobroma cacao originated in Mesoamerica; cacao note in niche fragrance', 'Copal resin: ancient Mesoamerican incense; sacred in Aztec, Maya, and modern Mexican ritual; piney-sweet-citrus resin', 'Palo Santo (holy wood — Bursera graveolens): Sacred wood of South America; burning creates intensely distinctive woody-sweet-citrus smoke; now available in essential oil form']
  },
  copal_paloSanto: {
    copal: {
      description: 'Copal (from Nahuatl: copalli — incense) — aromatic resin from trees in the Bursera genus and others; burned as sacred incense in Mesoamerican civilisations for millennia',
      types: ['Copal blanco (white): lightest, piney, citrusy', 'Copal negro (black): darker, more resinous', 'Copal oro (gold): most common; sweet, citrusy, piney'],
      use: 'Burned at altars, Day of the Dead (Día de los Muertos) celebrations, curandera (traditional healer) ceremonies, to purify spaces and communicate with ancestors',
      scent: 'Fresh pine, citrus, slightly sweet resin; lighter and more transparent than frankincense'
    },
    paloSanto: {
      description: '"Holy wood" (Bursera graveolens); burned for centuries by Andean indigenous peoples; now globally popular as spiritual cleansing tool',
      origin: 'Ecuador and Peru coastal regions',
      scent: 'Intense, sweet, citrusy wood smoke; slightly minty; distinct from any other wood',
      sustainability: 'Must only be harvested from naturally fallen trees; live cutting destroys the resin development; verify ethical sourcing when purchasing'
    }
  },
  tequila_rum_cologne: {
    Mexico: 'Mexican fragrance: influenced by tropical fruits, herbs (epazote, hierba santa), copal, vanilla, and warm sun; Mexican perfumers drawing from extraordinary botanical heritage',
    Caribbean_Latin: 'Cuban and Caribbean-Latin heritage: bay rum, tobacco, rum, leather, tropical fruit orientals; "Havana-inspired" fragrances',
    Brazilian: 'Brazilian fragrance: rain forest green, tropical floral, cachaça (sugarcane spirit note), white musk; Natura (Brazilian cosmetics giant) leads local fragrance industry'
  },
  recommendedNotes: ['vanilla (Mexican origin)', 'copal', 'palo santo', 'tiare', 'ylang-ylang', 'tropical fruits', 'sandalwood', 'amber', 'musk', 'warm spices']
};

export const EAST_ASIAN_FRAGRANCE = {
  communityName: 'East Asian',
  title: 'East Asian Fragrance Traditions',
  japanese_kodo: {
    title: 'Kodo — The Way of Incense',
    description: '"Kodo" (香道) — Japanese incense ceremony; one of the three classical Japanese arts alongside ikebana (flower arranging) and chado (tea ceremony)',
    history: 'Incense brought to Japan from China via Buddhist monks in 6th century CE; elevated to high art form in Heian period (794–1185)',
    practice: 'Participants gather; aloeswood incense burned and passed; practitioners "listen to" the incense (聞く — kiku — to listen/smell) — the verb in Japanese for experiencing incense is "listen", not "smell"',
    materials: 'Rikkoku gomi (six aloeswood countries, five tastes): classification system for aloeswood (Japanese: kyara, jinko); six producing regions each with distinct character (sweet, sour, spicy, salty, bitter)',
    kyara: 'Kyara (伽羅) — highest grade of agarwood; Japanese term; slight cooling, sweet note; extraordinarily rare and expensive; treasured Japanese cultural heritage material'
  },
  chinese_incense: {
    description: 'Chinese incense culture (香文化 — xiang wenhua) spans 4,000+ years; deeply embedded in Buddhism, Taoism, Confucianism, ancestor veneration, and daily domestic use',
    traditions: ['Temple incense: coil incense burning for hours in temples; communal offering', 'Ancestor veneration: incense burned at grave sites and home altars; "feeding" ancestors with fragrant smoke', 'Scholar\'s desk incense: refined literati burned incense while studying or writing poetry', 'Dragon boat festival: wormwood and calamus hung in doorways to repel illness'],
    key_ingredients: ['Sandalwood (檀香 — tan xiang): central to Chinese and Buddhist incense; purifying, calming', 'Star anise: sweet, liquorice; cooking and incense dual use', 'Camphor (樟脑 — zhang nao): intense, cooling, medicinal; traditional Chinese medicine application', 'Osmanthus (桂花 — guihua): beloved Chinese flower; honeyed, peachy, apricot-like; Shanghai and Hangzhou specialty']
  },
  korean_fragrance: {
    description: 'Korean fragrance tradition influenced by Chinese Buddhism and Confucianism; modern K-beauty has created new global fragrance aesthetic: clean, fresh, dewy, nature-inspired',
    traditional: 'Hyang (향) — incense in Korean Buddhist context; temple incense culture; ginseng (인삼) historically important aromatic with medicinal-aromatic overlap',
    modern: 'Korean fragrance aesthetic in beauty: fresh, clean, slightly sweet and floral; dewy and soft; not heavy projection but pleasant intimate scent trail; aligns with glass skin aesthetic',
    trend: 'K-beauty fragrance ingredients: yuzu, green tea, rice water, fermented botanicals, honeysuckle; Korean beauty brands expanding into fragrance with distinctive aesthetic'
  },
  recommendedNotes: ['kyara/oud (Japanese)', 'sandalwood', 'green tea', 'osmanthus', 'yuzu', 'bamboo', 'sakura', 'incense', 'white musk', 'ginger', 'persimmon']
};

export const EAST_AFRICAN_FRAGRANCE = {
  communityName: 'East African',
  title: 'East African Fragrance Traditions',
  frankincense_heritage: {
    boswellia: {
      species: ['Boswellia sacra (Oman, Yemen, Somalia): "Sacred" frankincense; most prized for its clear, bright, crystalline resin', 'Boswellia carterii (Somalia, Kenya): slightly darker; most common in trade', 'Boswellia papyrifera (Ethiopia, Sudan): earthy, warm; growing sustainability crisis due to overhar vesting'],
      harvest: 'Trees tapped by making incisions; resin hardens into "tears" on contact with air; collected after 2 weeks; trees require rest between tappings',
      Somalia: 'Somalia is world\'s largest frankincense producer; trade is ancient — Egyptian Queen Hatshepsut famously sent expedition to Punt (Somalia/Eritrea) for live frankincense trees circa 1495 BCE',
      Ethiopia: 'Tigray and Amhara regions: B. papyrifera; significant exports; spiritual importance in Ethiopian Orthodox Christianity',
      scent: 'Fresh, citrusy-piney top; warm, balsamic, gently sweet base; cleaner and more transparent than myrrh'
    },
    religious_context: 'Frankincense deeply sacred in Ethiopian Orthodox Christianity; burned in churches during services; homes perfumed with it on holy days',
    traditional_use: 'Chewing frankincense resin (Boswellia carterii) is traditional practice in East Africa and Arabian peninsula; anti-inflammatory, freshens breath, culturally important'
  },
  somali_traditions: {
    qasil: 'Qasil powder from local Gob tree (Ziziphus mucronata) leaves: used for skin and hair care in Somalia; mild aromatic quality',
    udsi: 'Udsi/oodsi — Somali term for the frankincense burning and smoke bathing tradition after childbirth; new mothers have smoke directed onto body to help uterine contraction and for blessing',
    xabag: 'Traditional Somali incense blend for homes: frankincense, sandalwood, mastic, mixed with rosewater; burned to perfume the home and for welcome of guests'
  },
  ethiopian_coffee: {
    ceremony: 'Ethiopian coffee ceremony (jebena buna): the world\'s first and most elaborate coffee ritual; frankincense burned during the ceremony alongside the roasting coffee beans; the combined aroma is quintessentially Ethiopian',
    scent_story: 'Coffee + frankincense + smoke: this olfactory combination is the scent of Ethiopia; perfumers have created "Ethiopian coffee" inspired compositions using these accords'
  },
  recommendedNotes: ['frankincense', 'myrrh', 'coffee', 'rose', 'amber', 'sandalwood', 'oud', 'musk', 'smoke', 'vetiver']
};

export const SOUTH_AFRICAN_FRAGRANCE = {
  communityName: 'South African',
  title: 'South African Fragrance Traditions',
  fynbos: {
    description: 'Fynbos — the extraordinary floral kingdom of the Cape region; smallest of Earth\'s six floral kingdoms but home to ~9,000 plant species (70% found nowhere else); hugely important for South African aromatics',
    keyPlants: [
      { name: 'Buchu (Agathosma betulina)', aroma: 'Intensely aromatic; blackcurrant, mint, medicinal-herbaceous; used by Khoisan people for millennia', use: 'Traditional Khoisan healing; aromatherapy; increasingly used in international flavour and fragrance industry; South African export ingredient' },
      { name: 'Rooibos (Aspalathus linearis)', aroma: 'Sweet, slightly woody, light vanilla-honey undertone; characteristic of South African fynbos', use: 'Skincare across South Africa; tea globally; antioxidant ingredient in cosmetic fragrance notes' },
      { name: 'Pelargonium (Cape Geranium)', aroma: 'Rose-geranium; Pelargonium graveolens and related species; used extensively in perfumery as geranium note; rose-green-lemony character', origin: 'Pelargonium is South African native — the "geranium" of perfumery was domesticated from Cape species' }
    ],
    importance: 'Cape pelargonium is one of the most important perfumery raw materials in the world, primarily now grown in Réunion, Egypt, and China — but its origins are entirely South African'
  },
  marula_baobab: {
    marula: 'Marula oil (from Sclerocarya birrea) — light, non-greasy facial oil; very high oleic acid; natural tocopherols; traditional use by Zulu and Swazi communities for skin care and hair care; pleasant mild nutty aroma; Amarula liqueur made from marula fruit',
    baobab: 'Baobab tree (Adansonia digitata) — "Tree of Life"; iconic of savanna Africa; baobab oil from seeds; rich in omega 6 and 9; light, non-greasy; slightly nutty pleasant aroma; fair trade export from South and West Africa'
  },
  recommendedNotes: ['buchu', 'rooibos', 'geranium (Cape pelargonium)', 'baobab', 'marula', 'African violet', 'amber', 'warm woods', 'vanilla']
};

export const BLACK_AMERICAN_FRAGRANCE = {
  communityName: 'Black American',
  title: 'Black American Fragrance Traditions',
  fragrance_culture: {
    description: 'Black American fragrance culture is characterised by bold, long-lasting, presence-making scents; heavy orientals and musks are foundations; fragrance is personal signature and cultural expression',
    boldness: 'Sillage (projection) is valued — fragrance should be noticed when entering and leaving a room; the "you could smell them coming" tradition',
    oilPerfume: 'Perfume oil tradition strong in Black American communities; affordable concentrated body oils from fragrance oil vendors; oils last longer on skin; no alcohol; applied to pulse points; Black beauty supply stores have stocked oil blends for decades',
    vendors: 'Street vendors and Black-owned fragrance oil businesses have long provided accessible fine-fragrance-quality oil versions of popular designer scents plus original compositions to Black American communities'
  },
  specific_notes: {
    musk: 'White musk, baby powder musk, clean musk — the "clean skin" accord deeply beloved in Black American fragrance culture; Shea Moisture, Black Soap, and clean musk bath products hugely popular',
    oriental: 'Heavy oriental and amber fragrances; warm, enveloping, lasting; Obsession, Opium, Alien — bold Western orientals historically popular',
    incense: 'Incense culture (Nag Champa, frankincense) from Afrocentric and spiritual practice communities; home fragrance as identity expression',
    woodsy: 'Sandalwood, patchouli, cedarwood — earthy warm bases popular in the community'
  },
  blackOwnedFragrance: {
    description: 'Growing movement of Black-owned fine fragrance brands and artisan perfumers creating compositions from Black experience and African botanical heritage',
    names_types: ['Afrocentric fragrance: compositions incorporating African woods, florals, and resins', 'Heritage fragrances: inspired by Southern Black American culture (bourbon, peach, magnolia, southern woods)', 'Pan-African collections: incorporating oud, frankincense, Shea, and West African botanicals']
  },
  southernGoth: 'Southern Gothic fragrance aesthetic emerging from Black American Southern heritage: magnolia, bourbon, tobacco, leather, warm wood, peach, honeysuckle; complex, beautiful, Southern-rooted',
  recommendedNotes: ['musk', 'amber', 'sandalwood', 'oud', 'vanilla', 'incense', 'magnolia', 'shea/creamy notes', 'warm spice', 'patchouli']
};

export function getFragranceScienceOverview() {
  return FRAGRANCE_SCIENCE_OVERVIEW;
}

export function getFragranceApplicationGuide() {
  return FRAGRANCE_APPLICATION_GUIDE;
}

export function getEthnicFragranceTraditions(communityId) {
  const map = {
    'west-african': WEST_AFRICAN_FRAGRANCE,
    'south-asian': SOUTH_ASIAN_FRAGRANCE,
    caribbean: CARIBBEAN_FRAGRANCE,
    arab: ARAB_FRAGRANCE,
    latina: LATINA_FRAGRANCE,
    'east-asian': EAST_ASIAN_FRAGRANCE,
    'east-african': EAST_AFRICAN_FRAGRANCE,
    'south-african': SOUTH_AFRICAN_FRAGRANCE,
    'black-american': BLACK_AMERICAN_FRAGRANCE
  };
  const key = communityId.replace(/-/g, '_');
  const altMap = {
    west_african: WEST_AFRICAN_FRAGRANCE,
    south_asian: SOUTH_ASIAN_FRAGRANCE,
    east_asian: EAST_ASIAN_FRAGRANCE,
    east_african: EAST_AFRICAN_FRAGRANCE,
    south_african: SOUTH_AFRICAN_FRAGRANCE,
    black_american: BLACK_AMERICAN_FRAGRANCE
  };
  return map[communityId] || altMap[key] || null;
}

export function getFragranceFamily(family) {
  const families = FRAGRANCE_SCIENCE_OVERVIEW.olfactoryFamilies;
  return families[family.toLowerCase()] || null;
}

export const FRAGRANCE_GUIDE_STATS = {
  moduleId: 'fragrance_guide_ethnic',
  version: '1.0.0',
  topics: ['fragrance', 'perfume', 'attar', 'oud', 'frankincense', 'bakhoor', 'incense', 'kodo', 'bay rum', 'ethnic fragrance', 'fragrance notes', 'perfume concentrations', 'fragrance families'],
  communitiesSupported: 9,
  keyFacts: [
    'Parfum/Extrait concentration (20-40%) provides 8-12+ hour longevity vs Eau de Cologne (2-4%) lasting only 2-3 hours',
    'Oud (agarwood) is among the world\'s most expensive raw materials — wild old-growth oud sells for over $30,000 per kilogram',
    'Ibn Sina (Avicenna) refined steam distillation in the 11th century CE, enabling true alcoholic perfume as we know it',
    'Vanilla was first cultivated by the Totonac people of Mexico — the orchid that produces it originated in Mesoamerica',
    'Haitian vetiver is considered the world\'s highest quality vetiver; most vetiver in global perfumery is sourced from Haiti',
    'In Japanese kodo (incense ceremony), practitioners are said to "listen to" incense — the verb used is kiku (聞く) meaning to listen, not to smell',
    'Cape Pelargonium (South African native) is the botanical origin of the geranium note in global perfumery',
    'Mitti Attar from Kannauj, India captures petrichor — the scent of first rain on dry earth — by distilling baked clay into sandalwood base oil'
  ]
};
