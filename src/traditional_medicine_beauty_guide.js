/**
 * MIRRR — Traditional Medicine & Beauty Guide
 * Ancient healing systems and their beauty applications, by community
 * Topics: Ayurveda, TCM, Unani, Yoruba Ifa, Ethiopian herbal, Amazonian botanicals
 */

// ============================================================
// TRADITIONAL MEDICINE SYSTEMS
// ============================================================

export const TRADITIONAL_MEDICINE_SYSTEMS = {
  ayurveda: {
    name: 'Ayurveda',
    origin: 'India; 3,000-5,000 years old; Sanskrit "ayus" (life) + "veda" (knowledge)',
    philosophy: `Ayurveda views the human body as governed by three doshas (biological energies): Vata
    (air/space), Pitta (fire/water), and Kapha (earth/water). Each person has a unique constitution
    (prakriti) determined at birth, and imbalance in doshas causes disease and beauty concerns. Treatment
    is individualized to restore dosha balance through diet, herbs, lifestyle, and cleansing practices.`,

    doshas: {
      vata: {
        elements: 'Air + Space',
        qualities: 'Dry, light, cold, rough, subtle, mobile',
        inBalance: 'Creative, quick-thinking, enthusiastic',
        outOfBalance: 'Anxious, forgetful, constipated, irregular',
        skinType: 'Dry, thin, rough, cool; prone to dryness, flaking, fine lines, dark circles',
        hairType: 'Dry, fine, frizzy, split ends',
        balancedBy: 'Warming foods, oils, routine, warmth; sesame oil for body; rich moisturizers'
      },
      pitta: {
        elements: 'Fire + Water',
        qualities: 'Hot, sharp, oily, light, spreading',
        inBalance: 'Focused, intelligent, organized',
        outOfBalance: 'Angry, inflamed, competitive, acid reflux',
        skinType: 'Sensitive, oily T-zone, warm, redness, rosacea, acne-prone, moles',
        hairType: 'Medium, oily at roots, early graying, thin',
        balancedBy: 'Cooling foods, aloe, coconut; coconut oil for scalp; cooling skincare'
      },
      kapha: {
        elements: 'Earth + Water',
        qualities: 'Heavy, slow, cool, oily, smooth',
        inBalance: 'Calm, nurturing, stable, loving',
        outOfBalance: 'Sluggish, attached, congested, weight gain',
        skinType: 'Oily, smooth, thick, cool; prone to blackheads, cysts, enlarged pores, pale',
        hairType: 'Thick, oily, heavy, lustrous but slow-growing',
        balancedBy: 'Dry, warm, stimulating; dry brushing; light oils; invigorating practices'
      }
    },

    beautyPractices: {
      abhyanga: {
        name: 'Abhyanga (self-oil massage)',
        description: 'Daily warm oil self-massage before bath; increases circulation, nourishes skin, calms nervous system',
        oils: { vata: 'Sesame oil', pitta: 'Coconut oil', kapha: 'Sunflower or mustard oil' },
        technique: 'Long strokes on limbs; circular on joints; gentle on face; 10-20 minutes before warm shower',
        benefits: 'Moisturizes, firms skin; reduces vata dryness; stimulates lymphatic drainage; deeply relaxing'
      },
      ubtan: {
        name: 'Ubtan (herbal face and body paste)',
        description: 'Traditional Indian bridal beauty paste; turmeric + gram flour + milk + rosewater base with additions',
        recipe: 'Chickpea flour + turmeric + rosewater + milk or yogurt; additional herbs by dosha',
        benefits: 'Gentle exfoliation; turmeric for brightening; brightening; traditional pre-bridal treatment'
      },
      nasya: {
        name: 'Nasya (nasal oil treatment)',
        description: 'Drops of medicated oil in nostrils; lubricates mucous membranes; benefits eyes, hair, brain',
        beauty: 'Indirect beauty benefit through improved circulation to head/face; prevents premature graying in tradition'
      },
      panchakarma: {
        name: 'Panchakarma (five cleansing therapies)',
        description: 'Intensive Ayurvedic detox: vamana (therapeutic vomiting), virechana (purgation), basti (enema), nasya, raktamokshana',
        modern: 'Modern Ayurvedic beauty retreats offer gentler versions; focus on dietary cleanse + abhyanga + herbal steam'
      }
    },

    herbs: {
      amla: { name: 'Amla (Phyllanthus emblica)', benefit: '600mg vitamin C per 100g; hair growth; skin brightening; anti-aging' },
      turmeric: { name: 'Turmeric (Curcuma longa)', benefit: 'Anti-inflammatory; brightening; wound healing; antioxidant' },
      neem: { name: 'Neem (Azadirachta indica)', benefit: 'Antibacterial; antifungal; acne-clearing; anti-dandruff' },
      ashwagandha: { name: 'Ashwagandha (Withania somnifera)', benefit: 'Adaptogen; cortisol reduction; stress-related skin and hair benefit' },
      bhringraj: { name: 'Bhringraj (Eclipta alba)', benefit: 'Hair growth stimulation; prevents graying; liver support' },
      kumkumadi: { name: 'Kumkumadi taila (saffron oil)', benefit: 'Brightening; complexion enhancement; anti-aging facial oil' }
    }
  },

  tcm: {
    name: 'Traditional Chinese Medicine (TCM)',
    origin: 'China; 2,000-3,000 years of documented practice; "Huangdi Neijing" (Yellow Emperor\'s Classic) ~200 BCE',
    philosophy: `TCM views health as the balanced flow of Qi (vital energy) through meridians, and the
    balance of Yin and Yang (complementary opposing forces). Disease and beauty concerns arise from
    stagnation, deficiency, or excess in these systems. Beauty in TCM is an external reflection of
    internal organ health: radiant skin reflects healthy spleen; lustrous hair reflects healthy kidney;
    clear eyes reflect healthy liver.`,

    organsAndBeauty: {
      lung: 'Governs skin; lung deficiency = dry, lackluster skin; strengthen with pears, lily bulb, white foods',
      spleen: 'Governs muscles and flesh; spleen deficiency = sagging, sallow skin; strengthen with cooked warm foods',
      kidney: 'Governs hair; kidney deficiency = hair loss, premature gray; strengthen with black foods, bone broth',
      liver: 'Governs blood and tendons; liver Qi stagnation = melasma, dull skin; support with sour foods, movement',
      heart: 'Governs blood circulation; heart blood deficiency = pale lips, dull complexion; nourish with red foods'
    },

    beautyPractices: {
      guaSha: {
        name: 'Gua Sha (scraping therapy)',
        description: 'Smooth-edged tool scraped across oiled skin; releases Sha (stagnant blood/energy)',
        modern: 'Facial gua sha: rose quartz or bian stone tool used with facial oil to sculpt, depuff, improve circulation',
        benefit: 'Improves microcirculation; reduces puffiness; relaxes facial muscles; promotes lymphatic drainage'
      },
      acupressure: {
        name: 'Acupressure beauty points',
        description: 'Pressure on specific meridian points to improve skin and hair',
        points: [
          'LI4 (He Gu): between thumb and index finger; digestive health = clear skin',
          'SP6: inner ankle; dampness elimination = reduces acne and puffiness',
          'KI3: inner ankle; kidney tonic = hair and bone health',
          'ST36: below knee; digestion and Qi = overall vitality'
        ]
      },
      herbalSteam: {
        name: 'Facial herbal steam',
        description: 'Chrysanthemum, green tea, jasmine, rose steam for face; opens pores and delivers antioxidants',
        benefit: 'Opens pores before cleansing; anti-inflammatory herbs penetrate via steam; deeply relaxing'
      },
      tongueAndNail: 'TCM diagnostics use tongue color and nail health to assess internal organ status affecting beauty'
    },

    herbs: {
      peonyRoot: { name: 'White Peony Root (Bai Shao)', benefit: 'Blood nourishing; brightening; lightens pigmentation; liver support' },
      goji: { name: 'Goji Berry (Wolfberry)', benefit: 'Antioxidant; anti-aging; eye health; complexion brightening' },
      pearl: { name: 'Pearl Powder', benefit: 'Brightening; wound healing; calcium; traditional imperial beauty secret' },
      jadeRoller: { name: 'Jade Roller / Gua Sha', benefit: 'Circulation; lymphatic drainage; product penetration; relaxation' },
      dongQuai: { name: 'Dong Quai (Angelica sinensis)', benefit: 'Blood nourishing; hormonal balance; skin blood flow; for anemic/pale skin' },
      chrysanthemum: { name: 'Chrysanthemum', benefit: 'Anti-inflammatory; cooling; eye health; brightening facial steam' }
    }
  },

  unani: {
    name: 'Unani (Greco-Islamic Medicine)',
    origin: 'Greece (Hippocrates, Galen) → Arab world (Ibn Sina/Avicenna) → South Asia; 2,500 years',
    philosophy: `Unani ("Yunani" = Greek in Arabic) is based on four humors: blood (dam), phlegm (balgham),
    yellow bile (safra), black bile (sauda). Health is balance of these humors. Ibn Sina\'s "Canon of
    Medicine" (1025 CE) remains one of the most comprehensive medical texts ever written and includes
    extensive sections on cosmetics and skin care.`,

    ibnSinaBeauty: {
      name: 'Ibn Sina (Avicenna) cosmetic contributions',
      contributions: [
        'First systematic description of skin types and appropriate treatments',
        'Documented use of attar of roses, musk, ambergris in beauty preparations',
        'Described treatment protocols for alopecia, dandruff, and pigmentation',
        'Pioneered understanding of steam distillation (basis for rose water and essential oils)'
      ]
    },

    herbs: {
      rosewater: { name: 'Rose Water (Arq Gulab)', benefit: 'Toning; anti-inflammatory; refreshing; deeply traditional across Middle East and South Asia' },
      blackSeed: { name: 'Black Seed / Nigella (Habb al-Sawda)', benefit: '"Healing everything except death" — anti-inflammatory; acne; hair growth; studied clinically' },
      sandalwood: { name: 'Sandalwood (Chandan)', benefit: 'Anti-inflammatory; skin brightening; anti-bacterial; cooling; sacred in multiple traditions' },
      henna: { name: 'Henna (Mehndi)', benefit: 'Hair conditioning; natural dye; anti-fungal; cooling for scalp' },
      kohl: { name: 'Kohl (Surma)', benefit: 'Traditional eye makeup; antimicrobial claim; cultural and spiritual significance' }
    }
  },

  yorubaIfa: {
    name: 'Yoruba / Ifa Traditional Medicine',
    origin: 'West Africa (Nigeria, Benin, Togo); Ifa divination system; 4,000+ years',
    philosophy: `Yoruba medicine (egbogi) integrates Ifa divination, plant medicine (ewe), spiritual elements,
    and community healing. Osun (Oshun in diaspora traditions) is the Yoruba Orisa (deity) of beauty,
    sweetness, love, and rivers — her worship is inseparable from beauty practices. Herbs are sacred
    (ewe ni emi ogbin) — "leaves are the spirits of plants."`,

    beautyPractices: {
      osunRitual: 'Oshun beauty ritual: honey, cinnamon, turmeric, orange, river water; deeply spiritual beauty',
      blackSoap: 'African black soap (ose dudu): traditional Yoruba cleanser; potash ash + plantain ash + palm kernel oil + cocoa pod ash',
      shea: 'Shea butter (ori): sacred beauty staple; from shea tree native to West Africa; deeply moisturizing',
      camwood: 'Camwood (osun/pterocarpus osun): red wood paste; skin toning; used at ceremonies and naming'
    },

    herbs: {
      neem: { name: 'Dongoyaro (Neem)', benefit: 'Anti-parasitic; anti-bacterial; fever; skin conditions; widely used in West African folk medicine' },
      aloe: { name: 'Aloe Vera', benefit: 'Wound healing; burns; skin soothing; grows widely in West Africa' },
      moringa: { name: 'Moringa', benefit: 'Nutrient dense; anti-inflammatory; skin health from inside; hair growth oils' },
      bissap: { name: 'Hibiscus (Bissap)', benefit: 'Anti-inflammatory; AHA content (citric acid); brightening; antioxidant' }
    }
  },

  ethiopianHerbal: {
    name: 'Ethiopian / Horn of Africa Traditional Medicine',
    origin: 'Ethiopia, Eritrea, Somalia, Djibouti; ancient herbal traditions; 3,500+ years',
    philosophy: 'Ethiopian traditional medicine integrates plant medicine with Christian, Islamic, and pre-Abrahamic spiritual traditions; healers (wogesha, debtera) hold specialized knowledge',

    beautySpecifics: {
      frankincense: 'Boswellia sacra/papyrifera: native to Horn of Africa; burned and applied; anti-inflammatory; skin healing',
      myrrh: 'Commiphora myrrha: anti-inflammatory; antibacterial; wound healing; skin tonic; sacred and medicinal',
      qat: 'Catha edulis: chewed in parts of Ethiopia/Somalia; sympathomimetic; complex beauty trade-offs (stimulant)',
      teff: 'Injera ferment water: contains lactic acid; used as facial toner; AHA from natural fermentation',
      nitter: 'Niter kibbeh (spiced butter): clarified butter with herbs; internal beauty food + external skin application'
    },

    herbs: {
      frankincense: { name: 'Frankincense (Itan/Lubaan)', benefit: 'Anti-inflammatory; skin healing; wound recovery; scent ritual' },
      myrrh: { name: 'Myrrh (Murr)', benefit: 'Antimicrobial; anti-inflammatory; wound healing; skin tonic; gum health' },
      shea: { name: 'Shea Butter', benefit: 'Deep moisturization; Fitzpatrick V-VI skin barrier repair' }
    }
  },

  amazonianBotanicals: {
    name: 'Amazonian / Latin American Traditional Medicine',
    origin: 'Amazon basin; Andean traditions; 10,000+ years of indigenous plant use',
    philosophy: 'Amazonian plant knowledge held by indigenous shamans (curanderos); plant medicine inseparable from ecological knowledge; plants considered conscious beings with healing spirit',

    beautyHerbs: {
      cupuacu: { name: 'Cupuaçu (Theobroma grandiflorum)', benefit: 'Rich emollient; Brazilian beauty staple; cocoa relative; extreme moisturizing' },
      acai: { name: 'Açaí (Euterpe oleracea)', benefit: 'Antioxidant-rich; omega-3 and omega-6 fatty acids; anti-aging; consumed and applied' },
      pracaxi: { name: 'Pracaxi Oil (Pentaclethra macroloba)', benefit: 'Antibacterial; used for scars, dark circles; rich in behenic acid' },
      murumuru: { name: 'Murumuru Butter (Astrocaryum murumuru)', benefit: 'Hair conditioning; curl definition; scalp health' },
      patahua: { name: 'Patauá Oil', benefit: 'Oleic acid-rich; excellent hair conditioning; similar to olive oil composition' }
    }
  },

  koreanHanbang: {
    name: 'Korean Traditional Medicine (Hanbang)',
    origin: 'Korea; influenced by TCM; adapted unique Korean ingredients; 2,000+ years',
    philosophy: 'Hanbang (한방) integrates TCM principles with Korean herbal medicine; focus on balance and prevention; incorporated into modern K-beauty in extraordinary commercial success',

    beautyIngredients: {
      ginseng: { name: 'Ginseng (Panax ginseng)', benefit: 'Antioxidant; anti-aging; circulation; fatigue; skin elasticity; ginsenosides as active compounds' },
      dongeui: { name: 'Centella Asiatica (Cica)', benefit: 'Wound healing; anti-inflammatory; collagen synthesis; eczema; madecassoside and asiaticoside as actives' },
      fermented: { name: 'Fermented Ingredients', benefit: 'Fermentation enhances bioavailability; lactic acid; smaller molecular weight for deeper penetration' },
      artemisia: { name: 'Artemisia (Mugwort)', benefit: 'Anti-inflammatory; sensitive skin; eczema; IgE response modulation' }
    }
  }
};

// ============================================================
// 9 COMMUNITY TRADITIONAL MEDICINE GUIDES
// ============================================================

export const ETHNIC_TRADITIONAL_MEDICINE_GUIDES = {
  'west-african': {
    communityName: 'West African',
    primarySystem: 'Yoruba Ifa / West African traditional medicine',
    primaryConcerns: ['Black soap tradition', 'Shea butter science', 'Moringa beauty'],

    keyIngredients: {
      blackSoap: {
        name: 'African Black Soap (Ose Dudu)',
        ingredients: 'Plantain ash + cocoa pod ash + palm kernel oil + palm oil; sometimes shea bark',
        benefit: 'Natural cleanser; antibacterial; pH balancing; gentle exfoliant from ash potash',
        skinTypes: 'Acne-prone skin (antibacterial), oily skin, normal — but can be drying for very dry skin',
        authentic: 'Real black soap is soft, brown-black, and handmade in Ghana, Nigeria, Benin; hard black bars are commercial imitations',
        science: 'Ash components provide alkaline pH; palm oils provide fatty acid moisturizing; net effect is cleansing without stripping'
      },
      sheaButter: {
        name: 'Shea Butter (Ori)',
        
        activeCompounds: 'Stearic acid (45-55%), oleic acid (35-55%), linolenic acid; triterpenes (lupeol, butyrospermol); vitamins A, E, F',
        skin: 'Superior emollient for Fitzpatrick IV-VI skin; anti-inflammatory (lupeol, cinnamic acid); wound healing; sun protection SPF 3-4 (not primary SPF)',
        hair: 'Seals hair cuticle; reduces breakage; reduces transepidermal moisture loss from scalp; ideal for Type 4 hair',
        grades: 'A (raw/unrefined): more nutrients but scent and color; C (refined): neutral scent/color; A preferred for skin'
      },
      moringa: {
        name: 'Moringa (Zogale / Ewe Igbale)',
        
        nutrition: 'Gram-for-gram: more protein than yogurt, more vitamin C than oranges, more potassium than bananas',
        beauty: 'Internal: vitamins A, C, E, calcium, zinc → skin health from inside; External: moringa oil excellent emollient',
        hair: 'Moringa oil for scalp: zinc content supports keratin synthesis; lightweight carrier oil'
      }
    },

    protocols: {
      face: 'African black soap + shea butter face moisturizer + black tea or moringa face mist = traditional West African face care modernized',
      body: 'Shea butter or shea butter + coconut oil body care; camwood (pterocarpu) for ceremonial skin treatments',
      hair: 'Shea butter + coconut oil deep conditioning; moringa oil hot oil treatment'
    },

    advice: `West African traditional beauty wisdom is scientifically sophisticated. African black soap
    is genuinely superior to most commercial facial cleansers for dark skin: it cleanses without
    stripping, has natural antibacterial properties from ash, and moisturizes from its plant oil base.
    Shea butter is perhaps the most versatile and evidence-backed natural beauty ingredient available
    for Fitzpatrick IV-VI skin. The entire West African traditional toolkit is effectively a
    science-backed natural beauty system that modern evidence has largely validated.`
  },

  'south-asian': {
    communityName: 'South Asian',
    primarySystem: 'Ayurveda (Indian traditional medicine)',
    primaryConcerns: ['Dosha-appropriate skincare', 'Amla and bhringraj for hair', 'Turmeric beauty'],

    keyIngredients: {
      turmeric: {
        name: 'Turmeric (Haldi)',
        
        beauty: 'Anti-inflammatory (inhibits NF-kB pathway); antioxidant; brightening; wound healing; acne; pigmentation',
        ubtan: 'Ground turmeric in face ubtan masks traditional across India; yellow stain temporary on skin',
        caution: 'Stains yellow/orange; use small amounts in face masks; remove thoroughly',
        bioavailability: 'Curcumin poorly absorbed internally; piperine (black pepper) increases bioavailability 2000%; fat-soluble'
      },
      amla: {
        name: 'Amla (Indian Gooseberry)',
        activeCompound: 'Vitamin C (~600mg/100g), emblicanin, punigluconin, pedunculagin',
        hair: 'Prevents premature graying; promotes hair growth; strengthens shaft; tannins as natural protein',
        skin: 'Collagen synthesis from vitamin C; antioxidant; brightening',
        forms: 'Fresh fruit, powder, oil, extract; amla oil for hair is most traditional application'
      },
      bhringraj: {
        name: 'Bhringraj (Eclipta alba / False Daisy)',
        activeCompounds: 'Wedelolactone, ecliptine, vitamin D, vitamin E',
        hair: 'Stimulates hair follicle cells; traditional hair growth; prevents gray; liver health (indirectly benefits hair)',
        application: 'Bhringraj oil: herb-infused oil applied to scalp; leave overnight or 1-2 hours before washing'
      },
      neem: {
        name: 'Neem (Azadirachta indica)',
        activeCompounds: 'Azadirachtin, nimbin, nimbidin; antibacterial, antifungal, anti-inflammatory',
        skin: 'Acne (P. acnes bacterial inhibition); dandruff (Malassezia antifungal); wound healing',
        hair: 'Anti-dandruff; scalp health; antibacterial for folliculitis'
      }
    },

    protocols: {
      face: 'Ubtan weekly mask (turmeric + gram flour + rosewater); neem face wash for acne; kumkumadi oil for complexion',
      body: 'Abhyanga (sesame oil for vata, coconut for pitta, mustard for kapha); ubtan body scrub on wedding events',
      hair: 'Champi with bhringraj or amla oil; overnight oil treatment; weekly'
    },

    advice: `Ayurveda\'s greatest strength for South Asian beauty is individualization by dosha — recognizing
    that not all South Asian women have the same skin or hair needs. Vata types need heavy oils; pitta
    types need cooling; kapha types need stimulation. This ancient framework maps remarkably well to
    modern skin typing. The herb roster (turmeric, amla, neem, bhringraj) is among the most
    scientifically validated of any traditional medicine system. These are not just cultural practices
    — they\'re efficacious botanical interventions.`
  },

  caribbean: {
    communityName: 'Caribbean',
    primarySystem: 'Caribbean herbal folk medicine (Bush medicine)',
    primaryConcerns: ['Aloe vera', 'Coconut oil beauty', 'Bush tea skin benefits'],

    keyIngredients: {
      aloe: {
        name: 'Aloe Vera (Sinkle Bible / Forever Living)',
        preparation: 'Fresh leaf; gel extracted from inner leaf; used raw or blended',
        skin: 'Burns (including sunburn); wound healing; anti-inflammatory; moisturizing; acne',
        hair: 'Scalp soothing; dandruff; hair shine; enzyme protease may reduce dandruff',
        tradition: 'Deeply embedded in Caribbean bush medicine; the plant kept in every yard',
        science: 'Excellent clinical evidence for acemannan (active) in wound healing and anti-inflammation'
      },
      coconutOil: {
        name: 'Coconut Oil (Copra Oil)',
        composition: 'Medium-chain fatty acids: lauric acid (47%), myristic, caprylic, capric',
        hair: 'Excellent hair penetration (small molecular weight); reduces protein loss; strengthens Type 3-4 hair',
        skin: 'Antibacterial (lauric acid); moisturizing; mild; comedogenic for acne-prone face (caution)',
        tradition: 'Fundamental in Caribbean hair and skin care; grandmothers\' remedy for everything'
      },
      sorrelflorals: {
        name: 'Sorrel / Hibiscus (Roselle)',
        activeCompounds: 'Hibiscus acid, anthocyanins, vitamin C, AHAs (malic, citric acid)',
        skin: 'Natural AHA; brightening; antioxidant; sorrel rinse for hair shine and scalp health',
        tradition: 'Sorrel drink at Christmas across Caribbean; hibiscus tea for health'
      }
    },

    protocols: {
      face: 'Fresh aloe vera gel cleanser/moisturizer; hibiscus brightening toner; coconut oil as night treatment (non-acne-prone only)',
      body: 'Coconut oil post-shower body oil; coffee scrub (grounds + coconut) exfoliation',
      hair: 'Coconut oil pre-wash treatment (30 min to overnight); aloe vera leave-in; sorrel rinse for shine'
    },

    advice: `Caribbean bush medicine is grounded in the abundance of tropical plant medicine available on
    the islands. Aloe vera grown in the yard and applied fresh from the plant is genuinely superior to
    commercial aloe products (fresher, no preservatives, no dilution). Coconut oil is the Caribbean
    hair miracle that science has confirmed — it penetrates the hair shaft and reduces protein loss
    better than most commercial conditioners. The entire Caribbean natural beauty tradition is low-cost,
    highly accessible, and largely evidence-backed.`
  },

  arab: {
    communityName: 'Arab / Middle Eastern',
    primarySystem: 'Unani (Greco-Islamic medicine) / Traditional Arab medicine',
    primaryConcerns: ['Black seed oil', 'Argan oil', 'Rose water rituals'],

    keyIngredients: {
      blackSeed: {
        name: 'Black Seed / Nigella Sativa (Habb al-Sawda)',
        activeCompound: 'Thymoquinone (TQ); thymol, carvacrol',
        hadith: '"In the black seed there is healing for every disease except death" — Prophet Muhammad (hadith)',
        skin: 'Thymoquinone anti-inflammatory; antimicrobial; wound healing; eczema; psoriasis',
        hair: 'Clinical study: 2% nigella sativa oil comparable to 2% minoxidil for hair growth in telogen effluvium'
      },
      arganOil: {
        name: 'Argan Oil (Moroccan Liquid Gold)',
        
        composition: 'Oleic acid (43%), linoleic acid (36%), tocopherols (vitamin E), squalene, polyphenols',
        skin: 'Antioxidant; anti-inflammatory; barrier repair; fast-absorbing; non-comedogenic',
        hair: 'Excellent for dry, frizzy, chemically treated hair; cuticle smoothing; heat protection',
        authentic: 'Press-extracted virgin argan from Morocco is highest quality; most commercial products are diluted',
        tradition: 'Traditional Berber women use argan on skin, hair, nails, and internally on food'
      },
      roseWater: {
        name: 'Rose Water (Ma el-Wurd / Arq Gulab)',
        
        activeCompounds: 'Phenylethanol, geraniol, citronellol, nerol; flavonoids',
        skin: 'Anti-inflammatory; toning; refreshing; mild astringent; antioxidant',
        tradition: 'Used since ancient Persia; Arab physicians documented extensively; in food, perfume, and beauty',
        modern: 'Toner step in Korean-influenced Arab beauty routines; ingredient in premium Arab skincare'
      }
    },

    protocols: {
      face: 'Rose water toner; argan oil serum (2-3 drops); saffron-honey mask monthly; kohl for eyes',
      body: 'Hammam body exfoliation (kessa + savon beldi) + argan oil moisture; rose water spray throughout day',
      hair: 'Black seed oil scalp massage; argan oil on lengths; henna color treatments'
    },

    advice: `Arab traditional medicine beauty is one of the most globally influential — argan oil, rose water,
    and black seed oil have become international beauty staples precisely because they are genuinely
    efficacious. The Unani tradition, codified by Ibn Sina, provided the scientific framework for
    systematic skin typing and ingredient-based treatment that modern dermatology still follows. Black
    seed oil in particular deserves its reputation: the thymoquinone research is extensive and
    genuinely impressive. Use it as the primary scalp treatment for hormonal hair thinning.`
  },

  latina: {
    communityName: 'Latina / Hispanic',
    primarySystem: 'Curanderismo / Amazonian and Andean plant medicine',
    primaryConcerns: ['Aloe vera tradition', 'Amazonian oils', 'Herbal remedies for skin'],

    keyIngredients: {
      nopal: {
        name: 'Nopal / Prickly Pear Cactus (Opuntia)',
        preparation: 'Pads consumed; gel extracted; used topically',
        skin: 'Anti-inflammatory; betalain pigments as antioxidants; mucilage humectant',
        hair: 'Nopal gel as styling product; defines curls; adds shine',
        tradition: 'Sacred plant in Aztec cosmology; central to Mexican beauty and food culture',
        internal: 'Consuming nopal pads benefits skin from inside: fiber, antioxidants, hydration'
      },
      cupuacu: {
        name: 'Cupuaçu (Amazonian Cocoa)',
        composition: 'Phytosterols, fatty acids; unique theograndins (antioxidants); beta-carotene',
        moisturize: 'Exceptional water absorption capacity (450% its weight in water); superior humectant',
        hair: 'Excellent curl definition and moisture for Type 3-4 hair',
        tradition: 'Native to Amazon; indigenous use centuries old; Brazilian beauty revolution export'
      },
      jojoba: {
        name: 'Jojoba (Simmondsia chinensis)',
        note: 'Native to Sonoran Desert (Mexico/SW US); technically a wax, not an oil',
        composition: 'Liquid wax ester; mimics sebum; stable; non-comedogenic',
        skin: 'Regulates sebum; moisturizes without clogging; for all skin types; anti-inflammatory',
        hair: 'Scalp sebum regulation; moisturizes without heaviness; dilutes essential oils safely'
      }
    },

    protocols: {
      face: 'Aloe vera gel cleanser/toner; rosehip oil serum (native to Chile); nopal cactus mask; papaya enzyme mask',
      body: 'Cafecito body scrub (coffee + sugar + oil); coconut oil with lime for brightening massage',
      hair: 'Avocado + olive oil deep conditioning mask; castor oil edges; coconut oil pre-wash'
    },

    advice: `Curanderismo and Amazonian plant medicine contain some of the most biodiversity-rich beauty
    ingredients on earth. The Amazon rainforest is the most pharmaceutically rich ecosystem in existence —
    and Amazonian plant beauty (cupuaçu, pracaxi, murumuru, açaí, patauá) is only beginning to be
    formally studied. What indigenous communities have known for generations is being confirmed:
    these are genuinely high-performance beauty ingredients. Cupuaçu butter in particular is emerging
    as superior to shea butter for curl definition and moisture in Type 3-4 hair.`
  },

  'east-asian': {
    communityName: 'East Asian',
    primarySystem: 'Traditional Chinese Medicine (TCM) / Korean Hanbang / Japanese Kanpo',
    primaryConcerns: ['Ginseng anti-aging', 'Fermented beauty', 'Gua sha and jade'],

    keyIngredients: {
      ginseng: {
        name: 'Ginseng (Ren Shen / 인삼)',
        activeCompounds: 'Ginsenosides (Rb1, Rg1, Re); polysaccharides; polyacetylenes',
        skin: 'Antioxidant; collagen synthesis stimulation; anti-aging; circulation improvement',
        hair: 'DHT inhibition (some ginsenosides); stimulates dermal papilla cells; hair growth',
        forms: 'White ginseng, red ginseng (steamed), black ginseng (triple steamed); red most potent'
      },
      fermentedIngredients: {
        name: 'Fermented Beauty Ingredients',
        philosophy: 'Fermentation transforms ingredients: breaks down molecules for deeper penetration; produces beneficial metabolites',
        examples: {
          galactomyces: 'Galactomyces ferment filtrate (GFF): SK-II Pitera essence; skin tone and texture improvement; strong clinical evidence',
          fermentedSoy: 'Fermented soy extract: smaller isoflavones; better absorption; skin brightening',
          fermentedRice: 'Rice ferment filtrate: brightening; traditional Japanese geisha beauty'
        }
      },
      centella: {
        name: 'Centella Asiatica (Gotu Kola / 병풀)',
        activeCompounds: 'Madecassoside, asiaticoside, asiatic acid, madecassic acid',
        skin: 'Wound healing; collagen synthesis; anti-inflammatory; anti-scarring; eczema; rosacea; PIH recovery'
      }
    },

    protocols: {
      face: '10-step Korean routine: double cleanse, toner, essence, serums, sheet mask, eye cream, moisturizer, SPF',
      body: 'Japanese yuzu bath; Korean Italy towel exfoliation (jjimjilbang); camellia oil post-bath',
      hair: 'Tsubaki (camellia) oil; scalp massage tools; Korean scalp serum routine'
    },

    advice: `East Asian traditional medicine (TCM, Hanbang, Kanpo) represents perhaps the most commercially
    successful bridge between ancient tradition and modern skincare science. The fermented ingredient
    revolution (Galactomyces, fermented rice, fermented soy) is distinctly East Asian and distinctly
    high-performance. Centella asiatica (cica) has become one of the most globally used skincare
    ingredients because TCM-informed Korean skincare researchers validated what traditional medicine
    knew for millennia: centella heals skin. Gua sha is now globally practiced for good reason — the
    microcirculation and lymphatic drainage benefits are real.`
  },

  'east-african': {
    communityName: 'East African',
    primarySystem: 'Ethiopian / Somali / East African traditional medicine',
    primaryConcerns: ['Frankincense and myrrh', 'Traditional Ethiopian beauty', 'Sesame and fenugreek'],

    keyIngredients: {
      frankincense: {
        name: 'Frankincense / Olibanum (Itan)',
        
        activeCompounds: 'Boswellic acids (AKBA most active); alpha-pinene, limonene',
        skin: 'Anti-inflammatory (AKBA inhibits leukotriene synthesis); wound healing; anti-aging; skin firming',
        ritual: 'Burning frankincense is both spiritual and literally beneficial — the smoke has antimicrobial properties',
        topical: 'Boswellia extract increasingly in premium skincare; verified anti-inflammatory and anti-aging'
      },
      myrrh: {
        name: 'Myrrh (Murr)',
        
        activeCompounds: 'Sesquiterpenes; furanosesquiterpenes; commiphoric acids',
        skin: 'Antimicrobial; wound healing; anti-inflammatory; anti-aging',
        combination: 'Frankincense + myrrh synergistic in traditional practice; both anti-inflammatory, antimicrobial',
        hair: 'Scalp inflammation reduction; applied as diluted resin oil'
      },
      fenugreek: {
        name: 'Fenugreek (Abish / Methi)',
        activeCompounds: 'Diosgenin (phytoestrogen); trigonelline; nicotinic acid; proteins',
        hair: 'Protein-rich; conditions hair; DHT inhibitor (diosgenin); hair growth stimulation',
        tradition: 'Fenugreek seed paste on hair traditional across Ethiopia, Egypt, South Asia',
        skin: 'Mild anti-inflammatory; soothing for dry skin'
      }
    },

    protocols: {
      face: 'Frankincense oil facial oil final step; teff water (fermented lactic acid) toner; honey mask',
      body: 'Sesame oil body massage (similar to Ayurvedic abhyanga); post-bath shea application',
      hair: 'Fenugreek seed paste soaked overnight; sesame oil scalp treatment; castor oil for edges'
    },

    advice: `East African traditional medicine centers on the ancient frankincense and myrrh trade — these
    resins have been used for beauty, healing, and ritual for over 5,000 years. Modern research is
    confirming what ancient East African peoples knew: boswellic acids are powerful anti-inflammatories;
    myrrh is genuinely antimicrobial. As a beauty routine: frankincense oil as the final facial step
    (2-3 drops diluted), fenugreek seed treatment for hair growth, and shea butter as the body
    staple — this is a complete, science-backed traditional East African beauty system.`
  },

  'south-african': {
    communityName: 'South African',
    primarySystem: 'Zulu / Xhosa / Sotho traditional medicine / Cape Malay herbal',
    primaryConcerns: ['Rooibos anti-aging', 'Marula oil', 'Buchu herbal medicine'],

    keyIngredients: {
      rooibos: {
        name: 'Rooibos (Aspalathus linearis)',
        uniqueness: 'Endemic to Cederberg Mountains, South Africa; nowhere else on earth; harvested sustainably',
        activeCompound: 'Aspalathin (unique to rooibos); nothofagin; quercetin; rutin; luteolin',
        skin: 'Antioxidant (aspalathin unique polyphenol); anti-inflammatory; anti-aging; anti-histamine (eczema benefit)',
        
        forms: 'Tea (internal); water extract for toner; extracts in commercial skincare'
      },
      marula: {
        name: 'Marula Oil (Sclerocarya birrea)',
        
        composition: 'Oleic acid (70%); palmitic acid (12%); linoleic acid (7%); vitamin C (8x orange); antioxidants',
        skin: 'Lightweight; fast-absorbing; antioxidant; barrier repair; anti-aging; suitable for all skin types',
        hair: 'Lightweight scalp oil; shine; moisture; won\'t weigh down fine hair',
        tradition: 'Tsonga and Swazi women have used marula oil for centuries for skin and hair'
      },
      buchu: {
        name: 'Buchu (Agathosma betulina)',
        
        activeCompounds: 'Diosphenol, isomenthone, quercetin, rutin; antimicrobial and diuretic compounds',
        traditional: 'Khoikhoi and San peoples used buchu for centuries; Afrikaner folk medicine staple',
        beauty: 'Anti-inflammatory; diuretic (reduces puffiness); antimicrobial; buchu brandy traditional skin tonic',
        modern: 'Buchu water, buchu extract in commercial South African skincare'
      }
    },

    protocols: {
      face: 'Rooibos toner; marula oil facial oil; buchu extract for anti-inflammatory needs',
      body: 'Marula oil body treatment; rooibos bath soak; baobab oil for dry skin',
      hair: 'Marula oil scalp and length treatment; rooibos tea rinse for scalp'
    },

    advice: `South African traditional medicine produces some of the most unique ingredients in global beauty —
    rooibos and marula are genuinely South African gifts to global skincare. Rooibos aspalathin is found
    nowhere else on earth; marula oil has a fatty acid profile that makes it one of the most skin-compatible
    natural oils available. South Africa\'s extraordinary biodiversity (fynbos biome is one of the world\'s
    six floral kingdoms) means its traditional medicine cabinet is unlike anywhere else. The tradition of
    intergenerational plant knowledge (Ubuntu knowledge sharing) has preserved extraordinary botanical
    beauty wisdom that is now being validated by science.`
  },

  'black-american': {
    communityName: 'Black American',
    primarySystem: 'African American folk medicine / Gullah Geechee tradition / Hoodoo',
    primaryConcerns: ['Petrolatum tradition', 'Castor oil ritual', 'Hair grease science'],

    keyIngredients: {
      petrolatum: {
        name: 'Petrolatum (Vaseline)',
        origin: 'Discovered in Pennsylvania oil fields 1859; Robert Chesebrough commercialized 1870 as Vaseline',
        composition: 'Mixture of mineral hydrocarbons; petroleum-derived; extremely stable',
        skin: '99% transepidermal water loss reduction — most effective occlusive available; proven TEWL barrier',
        history: 'Black American tradition of "greasing" skin with petrolatum; passed through generations; intuitively correct science',
        science: '"Greasing" tradition in Black American culture is scientifically optimal for Fitzpatrick V-VI skin moisture retention',
        hair: 'Seals and protects ends; reduces breakage; traditional "grease" for afro hair',
        concern: 'Non-comedogenic for most; some individuals with acne-prone facial skin should use sparingly on face'
      },
      castorOil: {
        name: 'Castor Oil (Ricinus communis)',
        composition: 'Ricinoleic acid (~90%); unique fatty acid not found in other oils; viscous',
        hair: 'Promotes hair thickness by nourishing follicle; thickens edges; seals cuticle; anti-fungal for scalp',
        edges: 'Black American practice of castor oil on edges (hairline) for edge growth — generations-old practice',
        jamaican: 'Jamaican Black Castor Oil (JBCO): roasted beans → darker color; wood ash addition; slightly different composition; popular in Black beauty community'
      },
      sheaButter: {
        name: 'Shea Butter',
        tradition: 'Core Black American hair and skin care ingredient; brought from West African roots; central to natural hair movement',
        use: 'Body butter; hair sealant (LOC method); whipped with coconut oil; edges; deep conditioner'
      }
    },

    protocols: {
      face: 'Gentle cleanser (African black soap or CeraVe); niacinamide serum; petrolatum slugging for very dry patches',
      body: 'Shea butter or cocoa butter within 3 minutes of shower; "greasing" with petrolatum on elbows/knees/heels',
      hair: 'LOC method (water + oil + cream); castor oil on edges; shea butter as sealant; deep condition weekly'
    },

    advice: `Black American beauty folk medicine is a direct continuation of West African healing knowledge,
    filtered through centuries of survival, adaptation, and community sharing. The "greasing" tradition
    — applying petrolatum or grease to skin — is perhaps the most scientifically validated folk beauty
    practice of any community: petrolatum is the most effective occlusive known. The castor oil edges
    practice may lack the strongest clinical evidence, but the ricinoleic acid anti-inflammatory effect
    and the mechanical stimulation from massage are real. The natural hair movement (2010s-present) has
    elevated Black American traditional beauty wisdom to global influence — and rightly so.`
  }
};

// ============================================================
// HELPER FUNCTION
// ============================================================

export function getTraditionalMedicineGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_TRADITIONAL_MEDICINE_GUIDES['west-african'],
    'south-asian': ETHNIC_TRADITIONAL_MEDICINE_GUIDES['south-asian'],
    'caribbean': ETHNIC_TRADITIONAL_MEDICINE_GUIDES['caribbean'],
    'arab': ETHNIC_TRADITIONAL_MEDICINE_GUIDES['arab'],
    'latina': ETHNIC_TRADITIONAL_MEDICINE_GUIDES['latina'],
    'east-asian': ETHNIC_TRADITIONAL_MEDICINE_GUIDES['east-asian'],
    'east-african': ETHNIC_TRADITIONAL_MEDICINE_GUIDES['east-african'],
    'south-african': ETHNIC_TRADITIONAL_MEDICINE_GUIDES['south-african'],
    'black-american': ETHNIC_TRADITIONAL_MEDICINE_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

// ============================================================
// STATS
// ============================================================

