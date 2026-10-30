/**
 * MIRRR — Bath & Bathing Rituals Ethnic Guide
 * Global bathing traditions, their science, and cultural significance
 * Topics: hammam, onsen, jjimjilbang, sauna, steam, milk baths, ritual bathing
 */

// ============================================================
// BATHING SCIENCE
// ============================================================

export const BATHING_SCIENCE = {
  overview: `Bathing is among humanity's oldest ritualized practices — simultaneously hygienic, therapeutic,
  social, and spiritual across virtually every culture on earth. Modern science validates many traditional
  bathing practices: heat therapy reduces inflammation, mineral waters replenish electrolytes through skin,
  steam opens follicles for deep cleansing, and cold water immersion stimulates the autonomic nervous system.`,

  physiology: {
    heatEffects: {
      vasodilation: 'Blood vessels dilate in heat; increases circulation to skin; brings nutrients and removes waste',
      coreTemp: 'Body core temperature rise triggers sweating — primary cooling mechanism',
      muscleRelax: 'Heat reduces muscle tension; therapeutic for chronic pain',
      heartRate: 'Heart rate increases in heat; mild cardiovascular workout effect',
      hormones: 'Heat stress triggers growth hormone release; mild cortisol response; post-sauna norepinephrine spike',
      limits: 'Core temp above 39°C (102°F) risky; stay hydrated; limit sessions to 15-20 minutes for most'
    },
    coldWaterEffects: {
      vasoconstriction: 'Blood vessels constrict; redirects blood to core organs',
      wimHofEffect: 'Cold immersion activates sympathetic nervous system; norepinephrine surge (300%+); anti-inflammatory',
      brownFat: 'Cold activates brown adipose tissue (thermogenesis); metabolic boost',
      mentalHealth: 'Cold shower effect on mood; norepinephrine and dopamine release; evidence emerging for depression',
      limits: 'Cold shock response can be dangerous for heart conditions; build up gradually'
    },
    steamEffects: {
      poreOpening: 'Steam softens keratin; allows deeper cleansing; not literally "opens pores" (no muscles in pores) but softens them',
      hydration: 'Steam layer on skin; humidity prevents TEWL during session',
      mucousMembranes: 'Steam beneficial for respiratory conditions; eucalyptus, mint additives amplify effect',
      sinus: 'Steam inhalation loosens congestion; steam rooms historically used for respiratory illness'
    },
    mineralWaterScience: {
      sulfur: 'Anti-inflammatory; antibacterial; used for psoriasis, eczema, acne in therapeutic settings',
      sodium: 'Electrolyte replenishment through skin (dermal absorption occurs)',
      calcium: 'Bone health; some dermal absorption in prolonged baths',
      magnesium: 'Epsom salt (magnesium sulfate) — transdermal absorption debated; anecdotal muscle relaxation widely reported',
      silica: 'Found in some hot springs; associated with skin smoothing effects',
      bicarbonate: 'Softens skin; slightly alkaline — counterbalance with acidic products post-bath'
    }
  },

  skinBenefits: {
    exfoliation: 'Heat and steam soften stratum corneum, making physical exfoliation more effective',
    circulation: 'Improved blood flow brings nutrients to skin cells; healthy flush post-bath',
    cleansing: 'Sweating pushes sebum and debris from follicles',
    relaxation: 'Cortisol reduction post-bath improves skin barrier function (stress causes barrier dysfunction)',
    sleep: 'Body temperature drop after warm bath signals sleep readiness; best bath 1-2 hours before bed'
  },

  cautions: {
    temperature: 'Water above 40°C (104°F) can cause burns, especially on sensitive or dark skin',
    duration: 'Extended bathing (>20 min) can strip skin barrier; moisturise immediately after',
    conditions: 'Rosacea, eczema, psoriasis may flare with extreme heat; lukewarm better',
    pregnancy: 'Hot tubs above 39°C contraindicated in pregnancy (neural tube defect risk in first trimester)',
    darkSkin: 'Extremely hot water can trigger PIH on Fitzpatrick V-VI; lukewarm to warm preferred'
  }
};

// ============================================================
// GLOBAL BATHING TRADITIONS
// ============================================================

export const GLOBAL_BATHING_TRADITIONS = {
  hammam: {
    name: 'Hammam (حمّام)',
    also: 'Turkish bath, Moroccan bath, Arab bath',
    origins: 'Persian and Roman bath traditions merged with Islamic hygiene practices (tahara); spread across Ottoman Empire from 13th-17th centuries',
    geography: 'Morocco, Algeria, Tunisia, Egypt, Turkey, Syria, Lebanon, Iran, and throughout Arab world',
    islamicSignificance: 'Islamic jurisprudence requires ritual purity (tahara); regular bathing is religious duty (ghusl); hammam fulfills communal bathing within Islamic architecture',

    ritual: {
      rooms: [
        { name: 'Beit el-Awal / Frigidarium', temp: 'Cool (20-25°C)', purpose: 'Entry/changing room; cool down after heat' },
        { name: 'Beit el-Wastani / Tepidarium', temp: 'Warm (30-35°C)', purpose: 'Intermediate temperature; body acclimatizes' },
        { name: 'Beit el-Harara / Caldarium', temp: 'Hot (40-55°C)', purpose: 'Main hot room; steam, cleansing, exfoliation' }
      ],
      steps: [
        'Enter and relax in progressively hotter rooms (20-30 minutes total)',
        'Attendant (or self) applies black soap (savon beldi / kessa) to wet skin',
        'Leave soap on skin for 5-10 minutes while steam softens dead cells',
        'Vigorous exfoliation with kessa mitt — dead skin rolls off in grey pellets',
        'Ghassoul (lava clay) or rhassoul mask applied to face and body',
        'Rinse; cool down in tepidarium',
        'Full body oil or argan oil massage',
        'Rest and hydrate with mint tea'
      ],
      tools: {
        kessa: 'Rough woven mitt (often nylon or natural fiber); core exfoliation tool; available at Middle Eastern/Moroccan shops',
        savonBeldi: 'Moroccan black soap; olive oil base + eucalyptus; softens skin pre-exfoliation',
        ghassoul: 'Moroccan lava clay; mineral-rich; used as mask and final cleanser',
        kisssTable: 'Marble or tile heated platform (kurna) to lie on during hammam'
      }
    },

    skinBenefits: ['Dramatic dead skin removal — much more effective than daily scrubbing', 'Improved circulation', 'Deep cleansing of follicles', 'Clay minerals replenish skin', 'Post-hammam skin feels "reborn"'],
    frequency: 'Weekly in traditional practice; monthly is effective for modern schedules',
    darkerSkinNote: 'Kessa exfoliation is generally well-tolerated on darker skin; avoid if active PIH or breakouts on body'
  },

  onsen: {
    name: 'Onsen (温泉)',
    meaning: 'Hot spring (Japanese)',
    origins: 'Japan has over 3,000 geothermally active hot spring areas; bathing culture pre-dates written history; Buddhist temples built near springs from 6th century CE',
    geography: 'Japan — Beppu (Oita), Hakone (Kanagawa), Noboribetsu (Hokkaido), Kusatsu (Gunma) most famous; over 27,000 designated onsen facilities',

    types: {
      sulfur: { benefit: 'Antibacterial; treats acne, psoriasis; characteristic egg smell', famous: 'Kusatsu, Gunma; Beppu "Hells"' },
      sodium: { benefit: 'Hydrating; softens skin', also: 'Most common type' },
      carbonDioxide: { benefit: 'Dissolved CO2 absorbed through skin; vasodilating; skin reddening is healthy response', famous: 'Nagayu, Oita' },
      iron: { benefit: 'Mineral-rich; turns orange on exposure to air', note: 'Not for iron-sensitive individuals' },
      acidic: { benefit: 'Antibacterial; used for skin conditions', ph: 'pH 1-3; very acidic', famous: 'Tamagawa, Akita' }
    },

    ritual: {
      steps: [
        'Full body wash (kakuyu — shower before entering) — mandatory, deeply cultural',
        'Enter outdoor (rotenburo) or indoor (uchiyu) bath naked',
        'Soak at body-comfortable temperature (38-42°C) for 10-15 minutes',
        'Rest (휴식) — cool down period',
        'Optional: alternate between hot and cold baths',
        'Final rinse and moisturise'
      ],
      etiquette: ['Never enter without washing first', 'No swimwear in traditional onsen', 'Tattoos prohibited in many traditional onsen (yakuza association — changing)', 'Quiet, meditative atmosphere maintained', 'Hair up to keep out of water']
    },

    skinBenefits: ['Mineral absorption varies by spring type', 'Heat therapy and relaxation',  'Community and stress relief (psychological benefit to skin)'],
    modernEquivalent: 'Japanese onsen-style mineral bath salts; Hida Hot Spring spa treatments internationally'
  },

  jjimjilbang: {
    name: 'Jjimjilbang (찜질방)',
    meaning: 'Korean public bathhouse / sauna complex',
    origins: 'Traditional Korean bathing merged with modern spa concept; expanded dramatically 1990s-2000s',
    geography: 'Ubiquitous in South Korea; popular in Korean diaspora communities in US, Canada, Australia',

    features: {
      bathing: 'Separate sex nude bathing areas (mokgyoktang); multiple pools at different temperatures; cold plunge',
      saunas: 'Multiple dry and infrared saunas; hwangto (yellow soil) rooms; charcoal rooms; ice rooms; himalayan salt rooms',
      communalAreas: 'Co-ed social areas for sleeping, eating, socializing; people stay overnight',
      food: 'Sikhye (sweet rice drink), boiled eggs, ramyeon — traditional jjimjilbang snacks',
      entertainment: 'TV, sleeping mats, games; true overnight social destination'
    },

    italianTowel: {
      name: 'Italy towel (이태리 타올, ttaemiri / 때밀이)',
      description: 'Scratchy green/blue/yellow mesh exfoliation mitt; called "Italy" due to Italian fabric import history',
      use: 'After prolonged hot water soak (30+ min), scrub skin vigorously; dead skin rolls off in grey strands — dramatic visible result',
      skin: 'Best on Fitzpatrick II-IV; use with caution on very sensitive or inflamed skin',
      frequency: 'Every 2-3 weeks; not daily — too aggressive for regular use'
    },

    ritual: [
      'Enter nude bathing area; shower first',
      'Hot pool soak: 38-42°C for 20-30 minutes to soften skin',
      'Cold plunge (5-15°C) for 30-60 seconds — circulation boost',
      'Optional: Italy towel exfoliation (alone or with professional)',
      'Skin care: moisturise, face mask',
      'Change to communal clothes; move to sauna area',
      'Rotate through multiple sauna rooms (40-80°C dry, infrared, clay)',
      'Rest in communal area; sleep if overnight'
    ],

    skinBenefits: ['Italy towel exfoliation removes months of dead skin buildup', 'Mineral pools hydrate and soothe', 'Sauna heat and subsequent cool-down stimulates circulation', 'Communal rest reduces cortisol (stress-related skin issues improve)'],
    darkerSkinNote: 'Italy towel exfoliation can cause temporary redness on all skin tones; if PIH-prone, reduce pressure and frequency'
  },

  finnishSauna: {
    name: 'Finnish Sauna (Sauna)',
    origins: 'Finland; 2,000+ year history; UNESCO Intangible Cultural Heritage 2020; Finns have more saunas than cars',
    geography: 'Finland, Estonia, other Nordic countries; spread globally',

    tradition: {
      heat: '70-100°C dry heat (much hotter than steam room)',
      loyly: 'Water thrown on heated stones creates steam burst (löyly) — central sensory ritual',
      birchWhisk: 'Vihta/vihtainen — bundle of fresh birch branches; mild exfoliation and aromatherapy; slapped gently on skin; opens pores, improves circulation',
      coldWater: 'Follow hot sauna with cold lake swim or snow roll — extreme contrast; Wim Hof effect',
      beer: 'Beer (olut) sometimes added to löyly water for aroma; also consumed during sauna'
    },

    healthEvidence: {
      
      inflammation: 'Heat shock proteins induced by sauna have anti-inflammatory effects',
      mentalHealth: 'Reduced risk of dementia and depression in Finnish longitudinal studies',
      skin: 'Sweating helps clear follicles; circulation brings nutrients; relaxation reduces cortisol (stress = poor skin barrier)'
    },

    modernAccess: 'Finnish saunas in gyms, spas internationally; home saunas increasing; infrared sauna studios popular'
  },

  steamRoom: {
    name: 'Steam Room / Hammam Maghrebi',
    temperature: '40-50°C with 100% humidity (vs dry sauna 70-100°C with 10% humidity)',
    difference: 'Steam room is moist heat; sauna is dry heat; both beneficial but different sensations and effects',
    skinBenefit: 'Humidity prevents skin drying during session; skin emerges very soft',
    respiratory: 'Steam beneficial for airways; eucalyptus or mint additives amplify',
    darkerSkin: 'Lower temperature than sauna makes steam rooms more accessible; reduced PIH risk from heat'
  },

  milkBath: {
    name: 'Milk Bath',
    history: 'Cleopatra\'s legendary ass\'s milk bath; Roman baths included milk; used across ancient Egypt, Rome, South Asia',
    science: {
      lacticAcid: 'AHA naturally present in milk; gentle exfoliation during bath',
      fats: 'Milk fats are emollients; leave skin soft',
      proteins: 'Whey proteins have some temporary skin-tightening effect',
      vitamins: 'Vitamins A, D, E in whole milk have skin benefits'
    },
    recipe: 'Whole milk (2-4 cups) or buttermilk + optional: honey, rose petals, oatmeal; warm (not hot) bath',
    modern: 'Powder milk bath products; colloidal oatmeal bath (FDA-approved); coconut milk bath for darker skin',
    darkerSkin: 'Coconut milk bath good alternative; lauric acid additional antimicrobial benefit'
  },

  ethiopianSteam: {
    name: 'Ethiopian Qumera / Traditional Steam Bath',
    tradition: 'Burning aromatic herbs and woods in enclosed space; sitting in steam to cleanse body and spirit',
    herbs: 'Incense, myrrh, frankincense, eucalyptus common in Ethiopian steam traditions',
    postpartum: 'Traditional Ethiopian postnatal steam bath (kurkum) used for recovery and skin tightening after childbirth',
    spiritual: 'Steam and incense purification has religious and healing significance in Ethiopian Orthodox Christianity and traditional practice'
  },

  ayurvedicBath: {
    name: 'Ayurvedic Herbal Bath (Svedana)',
    tradition: 'Indian subcontinent; 5,000-year-old tradition documented in Charaka Samhita and Sushruta Samhita',
    types: {
      bashpaSveda: 'Steam bath with herbal decoctions; specific herbs for specific doshas (body types)',
      naliSveda: 'Pipe steam directed to specific body parts',
      avagahaSveda: 'Full immersion bath in herbal water'
    },
    herbs: 'Neem (anti-bacterial), turmeric, rose petals, sandalwood, tulsi (holy basil), sesame oil, cardamom',
    dosha: {
      vata: 'Warming oils (sesame); moisture; not too hot — Vata types dehydrate easily',
      pitta: 'Cooling herbs (rose, sandalwood, coconut); not too hot — Pitta types run hot',
      kapha: 'Stimulating herbs (ginger, eucalyptus); hotter; Kapha benefits from vigorous sweat'
    }
  }
};

// ============================================================
// 9 COMMUNITY BATH RITUAL GUIDES
// ============================================================

export const ETHNIC_BATH_RITUAL_GUIDES = {
  'west-african': {
    communityName: 'West African',
    primaryTraditions: ['Herbal steam baths', 'Full-body oil massage pre-bath', 'Black soap bathing'],

    traditions: {
      herbalSteam: {
        name: 'West African Herbal Steam',
        description: 'Sitting over a pot of boiling herbal water covered with cloth; common postpartum and for fever/illness',
        herbs: 'Eucalyptus, neem (dogonyaro), lemongrass, ginger, moringa leaves',
        benefit: 'Cleansing, fever management, respiratory; postpartum uterine healing tradition in Nigeria and Ghana'
      },
      blackSoap: {
        name: 'Dudu-Osun / African Black Soap Bath',
        tradition: 'Lathering and leaving soap on skin briefly before rinsing; tradition of using specific herbs in soap',
        benefit: 'Natural saponins cleanse without harsh detergents; palm oil base moisturises while cleansing'
      },
      oilPreBath: {
        description: 'Some West African traditions apply shea or palm oil before bathing (not post-bath like Western tradition)',
        rationale: 'Oil "locks in" existing moisture; creates protective layer; may be counter-intuitive to Western approach'
      }
    },

    modernPractice: {
      routine: [
        'Herbal steam 2x weekly OR regular steam shower with eucalyptus drops',
        'African black soap body wash for cleansing',
        'Immediately after shower: glycerin spray on damp skin',
        'Layer raw shea butter while still damp',
        'Target elbows/knees with urea 20% cream'
      ],
      frequency: 'Daily shower + weekly herbal steam + monthly full body oil treatment'
    },

    advice: `West African bathing culture values cleanliness deeply — it\'s cultural, spiritual, and communal.
    The herbal steam tradition has genuine therapeutic value: eucalyptus and neem are antimicrobial,
    lemongrass and ginger are anti-inflammatory. For modern adaptation: add 5-10 drops of eucalyptus
    essential oil to your shower floor or use a steam shower insert. Then follow with the shea butter
    ritual that generations have perfected.`
  },

  'south-asian': {
    communityName: 'South Asian',
    primaryTraditions: ['Oil bath (oilBath)', 'Ubtan application', 'Abhyanga self-massage', 'Herbal bath additives'],

    traditions: {
      oilBath: {
        name: 'Oil Bath (எண்ணெய் குளியல் - Ennai Kuliyyal in Tamil)',
        tradition: 'Apply warm sesame oil to entire body and hair before bathing; leave for 30-60 minutes or overnight; then wash off',
        frequency: 'Weekly in South Indian tradition; Fridays considered auspicious; also on sacred days',
        oil: 'Sesame oil (gingely oil) primary — warming in Ayurveda; coconut oil for Pitta types',
        benefit: 'Deep oil penetration; Ayurvedic tradition of balancing doshas; documented skin barrier repair'
      },
      ubtan: {
        name: 'Ubtan Bath',
        tradition: 'Full-body paste of gram flour + turmeric + milk/yogurt + rose water; applied before bathing; left to dry partially then scrubbed off',
        occasion: 'Pre-wedding ceremony (haldi/ubtan ceremony); festivals; weekly beauty ritual',
        benefit: 'Exfoliation from gram flour + mild bleaching from turmeric + lactic acid from yogurt'
      },
      champi: {
        name: 'Champi Head Massage Before Bath',
        tradition: 'Warm oil massage of scalp and shoulders; often done by mother for child or within family',
        oils: 'Coconut (coastal South India), sesame (inland), castor (hair growth), bhringraj'
      },
      herbalBath: {
        additives: 'Neem leaves, rose petals, jasmine, tulsi, turmeric, sandalwood powder in bath water',
        benefit: 'Antimicrobial (neem), fragrance (rose, jasmine), antiseptic (turmeric), calming (sandalwood)'
      }
    },

    modernPractice: {
      routine: [
        'Weekly: sesame oil applied to body 30 min pre-shower (essential oil bath)',
        'Bi-weekly: ubtan scrub on body (besan + turmeric + yogurt)',
        'Daily: moisturise immediately post-shower with coconut or almond oil lotion',
        'Monthly: herbal bath with neem + rose petals',
        'Salicylic acid body wash for back acne prone skin'
      ]
    },

    advice: `South Asian bathing traditions are among the richest and most evidence-based in the world.
    The oil bath (ennai kuliyyal) is not superstition — sesame oil penetrates skin more deeply than most
    modern moisturisers and has genuine anti-inflammatory properties. Ubtan predates modern chemical peels
    by 4,000 years and uses the same active mechanisms (lactic acid exfoliation, turmeric anti-inflammatory).
    Weekly oil bath + bi-weekly ubtan is a complete body skin routine that rivals any modern protocol.`
  },

  caribbean: {
    communityName: 'Caribbean',
    primaryTraditions: ['Sea bathing', 'Aloe vera treatments', 'Coconut oil baths', 'Bush medicine baths'],

    traditions: {
      seaBathing: {
        tradition: 'Regular ocean swimming and bathing; salt water as therapeutic skin treatment',
        benefit: 'Sea salt minerals (magnesium, potassium, calcium); UV reflection off water; movement/cardiovascular',
        cultural: 'Ocean is central to Caribbean identity; sea bathing for skin conditions (psoriasis, eczema, wounds) traditional'
      },
      bushMedicineBath: {
        tradition: 'Bathing in water infused with local medicinal plants; grandmother\'s remedy traditions',
        herbs: 'Aloe vera, soursop leaf, leaf of life (Kalanchoe pinnata), sea grape, fever grass (lemongrass), cerasee (bitter melon vine)',
        benefit: 'Anti-inflammatory, antimicrobial, cooling; many herbs have documented bioactives'
      },
      coconutOilBath: {
        tradition: 'Applying coconut oil post-bath; sometimes added directly to bath water',
        benefit: 'Lauric acid is antimicrobial; rich emollient; traditional baby bathing practice'
      },
      seaSaltScrub: {
        tradition: 'Coarse sea salt + coconut oil body scrub; beach-gathered salt traditional',
        benefit: 'Physical exfoliation + mineral replenishment + coconut emollient'
      }
    },

    modernPractice: {
      routine: [
        'Weekly: sea salt + coconut oil scrub before shower',
        'Post-shower: fresh aloe vera gel (from plant if available) on body',
        'Follow with coconut oil or shea butter for lock-in',
        'Monthly: bush herb bath (soursop leaf, lemongrass, aloe)',
        'If landlocked: Dead Sea salt bath mimics ocean mineral experience'
      ]
    }
  },

  arab: {
    communityName: 'Arab / Middle Eastern',
    primaryTraditions: ['Hammam (Turkish/Arab bath)', 'Kessa exfoliation', 'Argan oil post-bath', 'Rosewater bathing'],

    traditions: {
      hammam: {
        tradition: 'See global hammam section above — central to Arab/Middle Eastern bathing culture',
        frequency: 'Weekly traditional; monthly modern',
        bridal: 'Pre-wedding hammam is major social event; family and female friends attend; ritual of beauty preparation and celebration'
      },
      rosewaterBath: {
        tradition: 'Adding rose water or dried rose petals to bath water; Moroccan and Turkish tradition',
        roses: 'Taif roses (Saudi Arabia), Turkish roses (Isparta), and Moroccan roses (Dades Valley) most prized',
        benefit: 'Fragrance; rose flavonoids mildly anti-inflammatory; anti-oxidant; cooling'
      },
      henna: {
        postBath: 'Henna applied to body post-bathing on clean skin; hammam followed by henna session traditional',
        benefit: 'Clean post-hammam skin absorbs henna more deeply and evenly; color is richer'
      },
      oudScenting: {
        tradition: 'Burning oud (bakhoor) to scent body and clothing after bathing; standing over smoke',
        cultural: 'Immense cultural significance in Gulf Arab culture; body scenting is form of social luxury'
      }
    },

    modernPractice: {
      routine: [
        'Monthly: full hammam ritual (steam + kessa + ghassoul + argan oil)',
        'Weekly: steam shower + kessa mitt at home',
        'Post-bath: argan oil while still damp on body',
        'Rose water spray as body mist',
        'Pre-event: oud bakhoor body scenting'
      ]
    }
  },

  latina: {
    communityName: 'Latina / Hispanic',
    primaryTraditions: ['Coffee body scrubs', 'Coconut oil baths', 'Herbal steam', 'Avocado body masks'],

    traditions: {
      coffeeRitual: {
        tradition: 'Coffee grounds as full-body scrub; Brazilian spa treatments built around coffee; café de olla (Mexican spiced coffee) body scrubs',
        science: 'Caffeine temporarily vasoconstricts; may reduce appearance of cellulite short-term; physical exfoliation',
        recipe: 'Used coffee grounds + coconut oil + optional brown sugar; scrub in circular motions; leave 2-3 minutes before rinsing'
      },
      herbalBath: {
        tradition: 'Baño de hierbas — herbal bath with local medicinal plants across Latin America',
        herbs: {
          mexico: 'Rosa de Castilla (damask rose), chamomile, marigold (cempasúchil), ruda (rue)',
          colombia: 'Marigold, chamomile, yerba buena (mint), eucalyptus',
          cuba: 'Colonia (lavender), altea, tilo (linden)',
          brazil: 'Capim-limão (lemongrass), erva-cidreira, pitanga'
        },
        spiritual: 'Limpia (spiritual cleansing bath) in curanderismo tradition; herbs chosen for spiritual as well as physical properties'
      },
      avocadoMask: {
        tradition: 'Mashed avocado applied to body as moisture mask; common in beauty traditions across Mexico, Central America',
        science: 'Oleic acid (oleic acid 60%+); vitamins E and K; genuinely nourishing body treatment'
      },
      riceBath: {
        tradition: 'Rice water bath or rice milk bath; overlap with Asian traditions in areas of Asian immigration (Peru, Brazil)',
        benefit: 'Inositol and B vitamins from rice; gentle brightening'
      }
    },

    modernPractice: {
      routine: [
        'Weekly: coffee ground + coconut oil scrub',
        'Monthly: baño de hierbas (herbal bath)',
        'Post-shower: coconut oil or avocado oil on damp skin',
        'For cellulite: coffee scrub + dry brushing + caffeine cream combination',
        'SPF body lotion on arms and décolletage daily'
      ]
    },

    advice: `Latina bathing culture is rich with plant wisdom — the baño de hierbas (herbal bath) tradition
    spans generations and borders. Modern science backs many of these herbs: chamomile is anti-inflammatory,
    marigold (cempasúchil/calendula) is wound-healing, lemongrass is antimicrobial. The coffee scrub is
    genuinely one of the better DIY body treatments — coffee's physical texture exfoliates, caffeine
    temporarily improves circulation, and the ritual itself (weekly self-care scrubbing) creates
    consistent skin maintenance.`
  },

  'east-asian': {
    communityName: 'East Asian',
    primaryTraditions: ['Japanese onsen', 'Korean jjimjilbang', 'Chinese herbal bath', 'Extended soaking rituals'],

    traditions: {
      onsen: {
        tradition: 'Japanese mineral hot spring bathing — see global section; deeply cultural in Japan',
        home: 'Onsen bath salts and powders widely available; home bathing culture strong in Japan',
        frequency: 'Daily bath (お風呂 ofuro) is core Japanese hygiene ritual; separate from showering'
      },
      jjimjilbang: {
        tradition: 'Korean bathhouse with multiple rooms and Italy towel exfoliation — see global section',
        italyTowel: 'Core of Korean exfoliation culture; monthly professional scrub at jjimjilbang recommended'
      },
      herbalChineseBath: {
        tradition: 'TCM herbal foot and body baths; specific herbs for different conditions',
        herbs: {
          general: 'Ginger (warming, circulation), mugwort (artemisia, expelling cold/damp), roses',
          winter: 'Ginger + cinnamon + mugwort foot bath for warming and cold prevention',
          skin: 'Chrysanthemum, honeysuckle for cooling and anti-inflammatory',
          women: 'Angelica root (当归 danggui), mugwort for menstrual and reproductive health'
        },
        footBath: 'Zumuyu (足浴) — daily or weekly hot foot bath; highly therapeutic in TCM; improves sleep'
      },
      sakeBath: {
        tradition: 'Japanese sake (清酒 seishu) bath; adds to bathtub; kojic acid and enzymes from fermentation',
        benefit: 'Skin brightening; exfoliation; same mechanism as kojic acid skincare products',
        alternative: 'Rice water (米のとぎ汁 kome no togijiru) — rinse water from washing rice; beauty tradition'
      }
    },

    modernPractice: {
      routine: [
        'Daily: warm bath (not shower) — Japanese ofuro bathing practice',
        'Weekly: Italian towel exfoliation (at Korean spa or DIY at home after 30-min soak)',
        'Monthly: jjimjilbang or onsen visit',
        'For brightening: sake bath or rice water rinse monthly',
        'TCM foot bath before bed for sleep and circulation'
      ]
    }
  },

  'east-african': {
    communityName: 'East African',
    primaryTraditions: ['Herbal steam (qumera)', 'Frankincense rituals', 'River and ocean bathing', 'Post-partum steam traditions'],

    traditions: {
      qumera: {
        name: 'Ethiopian Qumera (ቁምራ)',
        tradition: 'Aromatic herbal steam bath; burning incense and herbs in enclosed space; sweating and steam as purification',
        herbs: 'Frankincense resin, eucalyptus, myrrh, local herbs',
        spiritual: 'Purification ritual in Ethiopian Orthodox Christian tradition; used before religious observances',
        postpartum: 'Kurkum — traditional postpartum steam for new mothers; believed to help womb healing, skin tightening, recovery'
      },
      frankincenseBath: {
        tradition: 'Boswellia resin boiled in water; steam and water used for bathing and inhalation',
        benefit: 'Boswellic acids are anti-inflammatory (documented in research); aromatic compounds are calming'
      },
      naturalWater: {
        tradition: 'River bathing, hot spring bathing in Rift Valley areas; Lake Victoria communities; Red Sea coastal communities',
        benefit: 'Natural mineral water; outdoor bathing as communal social practice',
        hotSprings: 'Ethiopian Rift Valley has numerous hot springs (Wondo Genet, Sodere) used traditionally'
      },
      somalia: {
        tradition: 'Cold water bathing preference in Somali tradition (symbolic of cleanliness/toughness); ablution practices central to Islamic practice',
        oils: 'Sesame and moringa oils post-bathing; important Somali beauty ingredients'
      }
    },

    modernPractice: {
      routine: [
        'Weekly: frankincense steam shower (add frankincense essential oil)',
        'Monthly: fuller herbal steam ritual',
        'Post-bath: shea butter + marula oil immediately while damp',
        'Postpartum: steam bath tradition maintained where possible',
        'Urea 20% on elbows/knees/ankles nightly'
      ]
    },

    advice: `East African bathing traditions are deeply tied to spiritual practice and community. The qumera
    steam tradition in Ethiopia is among the most aromatic and meditative bathing practices globally —
    frankincense smoke and steam has documented anti-inflammatory and antimicrobial properties beyond
    just beautiful fragrance. For modern practice, frankincense essential oil in a steam shower or
    humidifier captures much of this tradition. The postpartum steam bath (kurkum) is particularly
    worth preserving — gentle steam with appropriate herbs genuinely aids recovery.`
  },

  'south-african': {
    communityName: 'South African',
    primaryTraditions: ['Rooibos baths', 'Ocean bathing', 'Clay body preparations', 'Marula oil post-bath'],

    traditions: {
      rooibosBath: {
    tradition: 'Adding rooibos tea to bath water; Cape tradition using Cederberg mountain plant',
        recipe: 'Brew 6-8 rooibos tea bags in boiling water; add to warm bath; soak 20 minutes',
        benefit: 'Aspalathin and nothofagin antioxidants; anti-inflammatory; reduces skin irritation; safe for babies and sensitive skin'
      },
      oceanBathing: {
        tradition: 'Cape Point to Durban: ocean bathing culture; cold Atlantic vs warm Indian Ocean',
        benefit: 'Cold Atlantic: Wim Hof-style cold water immersion benefits; mineral-rich; thalassotherapy',
        culture: 'Beach bathing is integral to South African outdoor culture; social and health ritual'
      },
      clayPreparation: {
        tradition: 'Xhosa and Ndebele white and red ochre clay body preparations; spiritual, aesthetic, and medicinal',
        ukuphola: 'Xhosa white clay (ibovu) applied to body for initiation, healing, and beauty',
        benefit: 'Clay draws impurities; minerals replenish; traditional knowledge spanning thousands of years'
      },
      marulaOil: {
        tradition: 'San and Bantu traditional use of marula fruit oil for body; post-bathing tradition',
        modern: 'Marula oil now globally exported; high-end international body care ingredient',
        benefit: 'Absorbed rapidly; oleic acid 70%+; traditional and modern simultaneously'
      }
    },

    modernPractice: {
      routine: [
        'Weekly: rooibos tea bath (6-8 bags) for anti-inflammatory skin benefits',
        'Monthly: ocean swim if near coast; Dead Sea salt bath if not',
        'Post-bath: marula oil on damp skin for deep South African body care',
        'For dark skin tones: layer shea butter over marula oil',
        'SPF 50 body lotion for lighter South African skin tones — critical'
      ]
    },

    advice: `South Africa\'s bathing traditions reflect its extraordinary biodiversity. The rooibos bath is
    genuinely therapeutic — aspalathin and nothofagin are research-backed anti-inflammatories; the bath
    is pleasant and beneficial for skin conditions including eczema (safe even for children and babies).
    Marula oil post-bath is one of the most sophisticated body care choices available — rapid absorption,
    anti-aging, and deeply traditional in Southern Africa. The clay preparation traditions of Xhosa and
    Ndebele communities deserve recognition as sophisticated skin science predating Western cosmetics.`
  },

  'black-american': {
    communityName: 'Black American',
    primaryTraditions: ['African black soap bathing', 'Epsom salt soaks', 'Coconut oil post-bath', 'Baking soda baths'],

    traditions: {
      blackSoap: {
        tradition: 'African black soap imported and locally produced; favored for body wash in natural beauty movement',
        benefit: 'Plantain ash alkalinity + palm oil + shea butter; naturally cleanses without harsh sulfates',
        brands: 'SheaMoisture African Black Soap; Shea Moisture raw black soap; Alaffia'
      },
      epsom: {
        tradition: 'Epsom salt (magnesium sulfate) soaks; sore muscle recovery; grandmother\'s remedy',
        science: 'Transdermal magnesium absorption is debated; physical soak benefit is real; anecdotal muscle relaxation widely reported',
        use: 'Two cups in warm bath; 15-20 minutes; often combined with essential oils'
      },
      petroleum: {
        tradition: 'Vaseline post-bath on specific dry areas (elbows, knees, feet); immediate post-bath application is "grease" ritual',
        culturalWeight: 'Applying Vaseline is intergenerational care; mother to child; community knowledge about what works for dark skin',
        science: 'Petrolatum is most effective occlusive available; 99% TEWL reduction; this tradition is scientifically optimal'
      },
      bakingSoda: {
        tradition: 'Baking soda in bath for softening water; neutralizing chlorine; folk remedy for itching',
        science: 'Sodium bicarbonate may neutralize some chlorine; slightly alkaline (counterbalance with acidic products post-bath)',
        note: 'Not recommended for eczema or broken skin; alkaline pH can disrupt skin barrier'
      }
    },

    modernPractice: {
      routine: [
        'Daily: African black soap body wash OR gentle sulfate-free body wash',
        'Weekly: Epsom salt bath (2 cups) for muscle recovery and relaxation',
        'Post-bath (within 3 minutes): glycerin lotion then shea butter while damp',
        'Seal extra-dry areas: Vaseline on elbows, knees, heels immediately after shea',
        'Monthly: full body exfoliation treatment before moisturising'
      ]
    },

    advice: `Black American bathing culture has deep wisdom in it. The Vaseline post-bath tradition is not
    old-fashioned — it\'s the most evidence-based occlusive application practice that exists. The key is
    timing: apply within 3 minutes of leaving the shower while skin is still damp. The "grease" applies
    on moisture, not dry skin. For the weekly Epsom salt soak, add 5-10 drops of lavender essential oil
    for documented relaxation enhancement (lavender linalool has anxiolytic effects). African black soap
    genuinely differs from commercial bar soaps — worth the switch for anyone with body acne or sensitive skin.`
  }
};

// ============================================================
// DIY BATH RECIPES
// ============================================================

export const DIY_BATH_RECIPES = {
  milkAndHoneyBath: {
    name: 'Milk and Honey Bath',
    ingredients: ['2 cups whole milk or coconut milk', '¼ cup raw honey', 'Optional: rose petals, lavender essential oil'],
    method: 'Mix milk and honey; add to warm bath water; soak 20-25 minutes',
    benefit: 'Lactic acid exfoliation; honey humectant; soothing; safe for all skin types including sensitive'
  },
  coffeeBodyScrub: {
    name: 'Brazilian Coffee Body Scrub',
    ingredients: ['1 cup used coffee grounds', '½ cup coconut oil', '¼ cup brown sugar', '1 tsp vanilla extract'],
    method: 'Mix all ingredients; apply to damp skin in circular motions; focus on rough areas; leave 2-3 min; rinse',
    benefit: 'Physical exfoliation; caffeine circulation boost; coconut oil moisturisation'
  },
  ubtanPaste: {
    name: 'South Asian Ubtan Body Paste',
    ingredients: ['½ cup gram flour (besan)', '1 tsp turmeric', '¼ cup yogurt', '2 tbsp rose water', '1 tsp honey'],
    method: 'Mix to paste consistency; apply to damp body; leave 10-15 min; gently scrub off then rinse',
    benefit: 'Gram flour exfoliates; turmeric anti-inflammatory; yogurt lactic acid; rose water soothes'
  },
  rooibosBath: {
    name: 'South African Rooibos Bath',
    ingredients: ['8 rooibos tea bags', '2 cups boiling water', 'Optional: lavender essential oil, oat milk'],
    method: 'Steep tea bags 10 minutes in boiling water; add to warm bath; soak 20 minutes',
    benefit: 'Aspalathin antioxidant; anti-inflammatory; suitable for eczema and sensitive skin; caffeine-free'
  },
  herbalBath: {
    name: 'General Herbal Cleansing Bath',
    ingredients: ['1 cup mixed dried herbs (chamomile, lavender, rose petals, calendula)', 'Optional: Epsom salt 2 cups', '10 drops essential oil'],
    method: 'Place herbs in muslin bag or old pillowcase; hang on tap as water runs; add Epsom salt; soak 20 min',
    benefit: 'Aromatherapy; mild botanical skin benefits; relaxation; ritual self-care'
  }
};

// ============================================================
// HELPER FUNCTION
// ============================================================

export function getBathRitualGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_BATH_RITUAL_GUIDES['west-african'],
    'south-asian': ETHNIC_BATH_RITUAL_GUIDES['south-asian'],
    'caribbean': ETHNIC_BATH_RITUAL_GUIDES['caribbean'],
    'arab': ETHNIC_BATH_RITUAL_GUIDES['arab'],
    'latina': ETHNIC_BATH_RITUAL_GUIDES['latina'],
    'east-asian': ETHNIC_BATH_RITUAL_GUIDES['east-asian'],
    'east-african': ETHNIC_BATH_RITUAL_GUIDES['east-african'],
    'south-african': ETHNIC_BATH_RITUAL_GUIDES['south-african'],
    'black-american': ETHNIC_BATH_RITUAL_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

// ============================================================
// STATS
// ============================================================

