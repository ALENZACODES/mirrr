/**
 * MIRRR Traditional Medicine Beauty
 * Ancient healing systems applied to modern beauty
 * Ayurveda, TCM, Unani, African Traditional Medicine, and more
 */

// ─── AYURVEDA (INDIA) ────────────────────────────────────────────────────────

export const AYURVEDA = {
  system: 'Ayurveda',
  origin: 'India — system dating 5,000+ years; Sanskrit: "Science of Life"',
  philosophy: 'Health and beauty emerge from balance of the three doshas (constitutional types). Imbalance in any dosha shows in skin, hair, and nails.',
  doshas: {
    vata: {
      name: 'Vata',
      elements: 'Air + Ether',
      whenBalanced: 'Creative, adaptable, energetic, clear',
      whenImbalanced: 'Dry skin, brittle hair, anxiety, poor circulation, rough texture',
      skinCharacteristics: 'Thin, dry, fine-pored, prone to dryness and dehydration. Ages quickly without care.',
      hairCharacteristics: 'Fine, dry, prone to breakage, frizzy',
      beautyPriorities: ['Deep hydration', 'Warming, grounding oils', 'Consistent routine'],
      heroIngredients: ['Sesame oil (warming)', 'Ashwagandha', 'Shatavari', 'Ghee', 'Almond oil'],
      routine: {
        am: 'Warm sesame oil massage (abhyanga) before shower; use milk-based cleanser; apply heavy moisturiser',
        pm: 'Oil cleanse; Ashwagandha-infused cream or serum; heavy overnight oil treatment on ends',
        weekly: 'Full body abhyanga (self-massage with warm sesame oil)',
        diet: 'Warm, cooked foods. Avoid raw, cold, dry foods. Healthy fats are Vata\'s best friend.',
      },
    },
    pitta: {
      name: 'Pitta',
      elements: 'Fire + Water',
      whenBalanced: 'Sharp, focused, passionate, strong digestion, glowing skin',
      whenImbalanced: 'Sensitive skin, redness, acne, inflammation, rosacea, early greying',
      skinCharacteristics: 'Combination-oily, sensitive, warm, prone to redness and breakouts. Burn easily in sun.',
      hairCharacteristics: 'Fine to medium, oily at scalp, prone to early greying, thinning',
      beautyPriorities: ['Cooling and anti-inflammatory', 'Sun protection', 'Gentle ingredients'],
      heroIngredients: ['Coconut oil (cooling)', 'Rose water', 'Aloe vera', 'Neem', 'Bhringraj (hair)', 'Chandana (sandalwood)'],
      routine: {
        am: 'Rose water mist; light serum with centella or neem; SPF daily (critical for Pitta)',
        pm: 'Gentle cleanse; neem-based toner; coconut oil for hair ends',
        weekly: 'Bhringraj oil scalp massage (cooling, prevents premature greying)',
        diet: 'Cooling foods: cucumber, mint, coconut water, leafy greens. Avoid spicy, oily, fermented.',
      },
    },
    kapha: {
      name: 'Kapha',
      elements: 'Earth + Water',
      whenBalanced: 'Calm, nurturing, strong, beautiful lustrous hair and skin, thick',
      whenImbalanced: 'Oily skin, congested pores, dull skin, slow metabolism, excess weight, oily hair',
      skinCharacteristics: 'Thick, oily, large-pored, prone to congestion and blackheads. Rarely dehydrated.',
      hairCharacteristics: 'Thick, heavy, oily, prone to excess sebum at scalp',
      beautyPriorities: ['Stimulating and detoxifying', 'Lightweight products', 'Regular exfoliation'],
      heroIngredients: ['Triphala (detoxifying)', 'Neem', 'Turmeric', 'Ginger', 'Clay', 'Kasturi turmeric'],
      routine: {
        am: 'Dry brush body; invigorating cleanser; niacinamide serum; lightweight gel moisturiser',
        pm: 'Double cleanse; clay mask or exfoliant; light oil (jojoba) instead of heavy moisturiser',
        weekly: 'Ubtan (gram flour + turmeric) mask to brighten and stimulate',
        diet: 'Light, spiced foods. Avoid heavy, sweet, cold foods. Warm, stimulating beverages.',
      },
    },
  },
  ayurvedicBeautyIngredients: {
    turmeric: {
      name: 'Turmeric (Haldi)',
      botanical: 'Curcuma longa',
      uses: ['Anti-inflammatory', 'Brightening', 'Anti-bacterial', 'Wound healing'],
      forSkin: 'Ubtan ingredient — mixed with gram flour, yoghurt, or milk as brightening mask',
      forHair: 'Anti-dandruff — mix turmeric + coconut oil, apply to scalp',
      caution: 'STAINS everything yellow — use sparingly, rinse thoroughly, use kasturi turmeric (non-staining variety) in face masks',
      
    },
    neem: {
      name: 'Neem',
      botanical: 'Azadirachta indica',
      aka: 'The village pharmacy tree',
      uses: ['Anti-bacterial', 'Anti-fungal', 'Anti-acne', 'Scalp care', 'Lice treatment'],
      forSkin: 'Neem soap or neem-infused cleanser for acne-prone skin',
      forHair: 'Neem oil scalp treatment for dandruff, itching, and scalp bacterial issues',
      caution: 'Very strong smell; dilute in carrier oil; avoid during pregnancy',
    },
    amla: {
      name: 'Amla (Indian Gooseberry)',
      botanical: 'Phyllanthus emblica',
      uses: ['Vitamin C (highest natural concentration)', 'Hair growth', 'Prevents greying', 'Anti-oxidant'],
      forSkin: 'Amla powder in face masks — natural Vitamin C brightening',
      forHair: 'Amla oil for hair growth and preventing premature greying. Used by Indian grandmothers for generations.',
      scienceNote: 'Contains more Vitamin C per gram than any other fruit — 600-900mg per 100g vs orange\'s 50mg',
    },
    ashwagandha: {
      name: 'Ashwagandha',
      botanical: 'Withania somnifera',
      uses: ['Adaptogen (stress response)', 'Anti-inflammatory', 'Collagen support', 'Sleep quality → better skin'],
      forSkin: 'Reduces cortisol-driven skin issues (acne, dullness, eczema flares)',
      forHair: 'Prevents stress-related hair shedding by regulating cortisol',
      forHealth: 'Oral supplement — impacts skin from inside out',
    },
    brahmi: {
      name: 'Brahmi',
      botanical: 'Bacopa monnieri / Centella asiatica (used interchangeably in some traditions)',
      uses: ['Brain tonic', 'Stress reduction', 'Hair growth', 'Scalp circulation'],
      forHair: 'Brahmi oil scalp massage — widely used in Ayurveda for hair thickness',
    },
    kumkumadi: {
      name: 'Kumkumadi Tailam',
      translation: 'Oil of saffron',
      what: 'A traditional Ayurvedic serum blend of saffron, sandalwood, lotus, and 16+ ingredients',
      uses: ['Brightening', 'Anti-aging', 'Hyperpigmentation', 'Glow enhancement'],
      
    },
  },
  modernBrands: [
    { name: 'Forest Essentials', india: true, url: 'https://forestessentialsindia.com', note: 'Luxury Ayurvedic skincare, responsibly sourced' },
    { name: 'Kama Ayurveda', india: true, url: 'https://www.kamaayurveda.com', note: 'Mid-luxury, wide range' },
    { name: 'Biotique', india: true, url: 'https://www.biotique.com', note: 'Affordable, widely available' },
    { name: 'Vedic Naturals', global: true, note: 'Available in UK/US/Canada' },
    { name: 'Himalaya', india: true, global: true, url: 'https://www.himalayawellness.com', note: 'Available globally at Indian grocery stores and Amazon' },
  ],
};

// ─── TRADITIONAL CHINESE MEDICINE BEAUTY ─────────────────────────────────────

export const TRADITIONAL_CHINESE_MEDICINE_BEAUTY = {
  system: 'Traditional Chinese Medicine (TCM)',
  origin: 'China — documented system dating 2,000+ years',
  beautyPhilosophy: 'Outer beauty reflects inner health. Skin issues map to organ imbalances. True beauty comes from qi (life force) flowing freely.',
  faceMapping: {
    forehead: 'Governed by the heart and small intestine. Breakouts/redness here = digestive stress or emotional strain.',
    noseT: 'Liver and spleen. T-zone oiliness = liver qi stagnation in TCM.',
    cheeks: 'Lungs and large intestine. Cheek acne/redness = respiratory or digestive issues.',
    chin: 'Kidneys and reproductive system. Chin/jaw breakouts = hormonal in TCM.',
    underEyes: 'Kidneys. Dark circles in TCM = kidney qi deficiency or adrenal fatigue.',
  },
  tcmBeautyPractices: {
    gua_sha: {
      name: 'Gua Sha',
      what: 'Flat stone tool (jade, rose quartz, or bian stone) scraped along facial meridians to stimulate circulation and lymphatic drainage',
      origins: 'Traditional Chinese body treatment adapted for face',
      benefits: ['Reduces puffiness by moving lymph fluid', 'Increases circulation for natural glow', 'Softens tension in jaw and brow muscles (less tension = fewer lines)', 'Sculpts and lifts with regular use'],
      technique: [
        'Apply facial oil or serum first (gua sha never on dry skin)',
        'Hold tool at 15-degree angle to skin (nearly flat)',
        'Use gentle upward and outward strokes',
        'Never drag down — always upward/outward',
        'Stroke each section 3–5 times before moving',
        'Do: forehead (outward), under-eye (outward on brow bone), cheek (upward to ear), jaw (outward), neck (downward to aid lymph drainage)',
      ],
      tools: {
        jade: { name: 'Jade Roller/Gua Sha',  note: 'Traditional. Cooling when refrigerated.' },
        rose_quartz: { name: 'Rose Quartz Gua Sha',  note: 'More commonly available today. Natural stone stays cooler than jade.' },
        bian_stone: { name: 'Bian Stone',  note: 'Traditional TCM stone. Emits far-infrared radiation — may enhance circulation.' },
        stainless: { name: 'Stainless Steel',  note: 'Modern. Stays coldest. Easy to sanitise.' },
      },
      frequency: 'Daily if gentle technique. 3–5x per week is ideal for visible results over 4+ weeks.',
    },
    jade_rolling: {
      name: 'Jade Rolling',
      what: 'Double-ended jade roller (large side for face, small for under-eye). Less sculpting than gua sha, more about lymph drainage and product absorption.',
      benefits: ['Reduces morning puffiness', 'Aids serum absorption', 'Cooling and relaxing', 'Stimulates microcirculation'],
      bestTime: 'Morning (for puffiness reduction) — store in fridge overnight for maximum cooling',
    },
    facial_acupressure: {
      name: 'Facial Acupressure',
      what: 'Pressing TCM acupressure points on the face to stimulate organ meridians and improve qi flow to facial tissues',
      keyPoints: [
        { point: 'Stomach 4 (ST4)', location: 'Beside corner of mouth', benefit: 'Jaw tension, cheek circulation' },
        { point: 'Large Intestine 4 (LI4)', location: 'Web between thumb and index finger', benefit: 'Face and head tension, skin issues' },
        { point: 'Spleen 6 (SP6)', location: 'Inner ankle, 4 fingers above inner ankle bone', benefit: 'Skin health, hormonal balance' },
        { point: 'Liver 3 (LV3)', location: 'Dorsum of foot, between big and second toe', benefit: 'Liver qi stagnation — skin dullness, spotting' },
      ],
    },
  },
  tcmIngredients: {
    pearl_powder: {
      name: 'Pearl Powder',
      traditional: 'Chinese empresses used ground pearl powder for luminous skin — Empress Dowager Cixi is famous for it',
      modern: 'Found in high-end Chinese and Korean skincare — signal-whitening ingredient',
      benefits: ['Brightening', 'Calming inflammation', 'Antioxidant'],
      caution: 'Highly alkaline — don\'t use excessively; can disrupt skin pH',
    },
    reishi_mushroom: {
      name: 'Reishi (Lingzhi) Mushroom',
      traditional: 'The "mushroom of immortality" — used for 4,000 years for beauty and longevity',
      modern: 'Now in skincare serums for brightening and anti-aging',
      benefits: ['Antioxidant', 'Anti-inflammatory', 'Collagen support', 'Hydration'],
    },
    snow_mushroom: {
      name: 'Snow Mushroom (Tremella fuciformis)',
      what: 'The "plant hyaluronic acid" — holds 500x its weight in water (more than HA)',
      modern: 'In K-beauty and high-end Chinese skincare as the next-generation moisturising ingredient',
    },
    chrysanthemum: {
      name: 'Chrysanthemum',
      traditional: 'Used in TCM teas and skincare for cooling, anti-inflammatory, and brightening',
      skinBenefit: 'Calms redness and irritation, brightens complexion',
      formInSkincare: 'Chrysanthemum extract, chrysanthemum flower water',
    },
  },
};

// ─── UNANI MEDICINE (ARAB/PERSIAN) ───────────────────────────────────────────

export const UNANI_BEAUTY = {
  system: 'Unani Medicine',
  origin: 'Greco-Arab-Persian synthesis — Ibn Sina (Avicenna) 10th–11th century codified it; still practised in South Asia and Middle East',
  philosophy: 'Beauty is health; health is beauty. Balance the four humours (blood, phlegm, yellow bile, black bile) for perfect skin and hair.',
  beautyIngredients: {
    rosewater: {
      name: 'Rose Water (Arq-e-Gulab)',
      traditional: 'Distilled rose water has been produced in Iran (Kashan) for over 1,000 years — first produced through Iranian distillation methods',
      modernBenefit: ['Tones and tightens pores', 'Anti-inflammatory', 'Balances skin pH', 'Mild astringent', 'Aromatherapy'],
      use: 'As toner, face mist, in hair, mixed into face masks',
      
    },
    oud: {
      name: 'Oud (Agarwood)',
      traditional: 'Used in Unani medicine for skin conditions and fragrance for centuries across the Arab world, Persia, and South Asia',
      
      skinBenefit: 'Anti-inflammatory, antimicrobial',
      note: 'Wild oud is endangered — seek sustainably farmed varieties',
    },
    saffron: {
      name: 'Saffron (Zafran)',
      traditional: 'Used in Unani medicine for brightening and as a warming tonic. In Persian and Indian beauty, saffron milk is a legendary complexion brightener.',
      modern: 'Proven anti-tyrosinase (reduces pigment production) and antioxidant',
      diy: 'Saffron face mask: soak 5 strands in 2 tbsp milk for 30 min, apply as mask, rinse after 15 min',
      caution: 'Genuine saffron is expensive — cheaper versions are often fake (red-dyed safflower). Buy from reputable spice source.',
    },
    henna: {
      name: 'Henna (Mehndi)',
      traditional: 'Used across South Asia, Middle East, and North Africa for 5,000+ years — for hair, skin, and nail beautification',
      forHair: {
        benefits: ['Conditions and strengthens hair', 'Natural colour (red-orange)', 'Anti-dandruff', 'Adds shine'],
        process: 'Henna powder + water + acidic agent (yoghurt/lemon) → paste → apply to hair → leave 2–6 hours → rinse',
        colours: { natural: 'Red-orange', withIndigo: 'Brown to black', withCassia: 'Golden-blonde conditioning (no colour on dark hair)' },
        caution: '"Black henna" is NOT henna — it contains PPD (paraphenylenediamine), a contact allergen that can cause severe chemical burns. Refuse black henna always.',
      },
      forSkin: {
        tradition: 'Bridal mehndi — complex patterns applied to hands and feet for weddings across South Asia and Middle East',
        duration: 'Colour lasts 1–3 weeks on palms, 3–10 days on back of hand',
        occasions: ['Wedding (bridal)', 'Eid', 'Diwali', 'Karwa Chauth', 'Baby showers (godh bharai)'],
      },
    },
    kohl: {
      name: 'Kohl (Surma)',
      traditional: 'Used across Middle East, North Africa, and South Asia for 5,000+ years — originally as eye protection (antimicrobial, sun protection for desert glare)',
      modern: 'Black eyeliner in traditional forms (pencil or powder applied with kajal stick)',
      types: {
        traditional: 'Lead-based kohl (surma) — common in South Asia and Middle East. CAUTION: some traditional formulations contain lead — avoid lead-based versions, especially for children.',
        modern: 'Antimony-based or carbon-based kohl — far safer than lead formulations',
      },
      
    },
  },
};

// ─── AFRICAN TRADITIONAL MEDICINE BEAUTY ─────────────────────────────────────

export const AFRICAN_TRADITIONAL_MEDICINE_BEAUTY = {
  system: 'African Traditional Medicine / Indigenous Knowledge Systems',
  diversity: 'Africa is a continent of 54 countries and hundreds of distinct healing traditions — this covers some well-documented beauty traditions',
  traditions: {
    shea_butter_culture: {
      tradition: 'Shea Butter Tradition (West and East Africa)',
      communities: ['Fulani (Guinea/Senegal/Mali)', 'Ewe (Ghana)', 'Igbo (Nigeria)', 'Hausa (Nigeria/Niger)'],
      how: 'Shea nuts collected by women, crushed, roasted, kneaded in water, hot water added, oils floated to top and collected — fully artisanal process',
      uses: ['Moisturiser for skin', 'Hair conditioner', 'Baby care', 'Wound healing', 'Burn treatment', 'Stretch mark prevention in pregnancy'],
      grades: {
        refined: 'White, odourless — fatty acids preserved but many micronutrients removed',
        unrefined: 'Yellow/cream, nutty smell — full spectrum of vitamins A, E, F and bioactive compounds',
        raw: 'Pale yellow, strongest smell — minimally processed, highest activity',
      },
      recommendation: 'Unrefined shea butter for skin and hair. Raw shea for body when smell is not a concern.',
      
    },
    black_soap_tradition: {
      tradition: 'African Black Soap (Alata Samina / Anago Samina)',
      origin: 'West Africa — Ghana, Benin, Togo, Nigeria',
      how: 'Dried plantain skin, cocoa pods, palm tree leaves, and/or shea tree bark are burned to ash; the ash is combined with water and oils (palm, coconut, shea), cooked, cooled, and cured',
      uses: ['Facial cleanser', 'Body wash', 'Shampoo', 'Eczema/psoriasis management', 'Acne treatment'],
      benefits: ['Naturally antibacterial', 'Rich in vitamins A and E from plantain ash', 'Gentle for sensitive melanin-rich skin', 'Antifungal properties'],
      caution: 'True African black soap is dark brown, rough, and handmade. If it is perfectly shaped, uniform, or jet black, it is not authentic.',
      
    },
    orijin_face_ritual: {
      tradition: 'Noni and Hibiscus Beauty (West/East Africa)',
      ingredients: ['Hibiscus (used as face wash and hair rinse in Ghana, Nigeria)', 'Noni fruit (Madagascar, East Africa — skin healing)', 'Moringa (Nigeria, Uganda — skin and hair treatment)'],
      uses: {
        hibiscus: 'Hibiscus tea rinse for hair — adds shine, some reports of darkening over time on grey hair',
        moringa: 'Moringa oil (ben oil) — lightweight, non-greasy, for face and hair. Closest to the skin\'s natural sebum.',
        noni: 'Anti-inflammatory and antioxidant for skin',
      },
    },
    rooibos_tradition: {
      tradition: 'Rooibos Beauty (Southern Africa)',
      origin: 'Khoisan and Cape Malay communities of South Africa',
      what: 'Rooibos (Aspalathus linearis) — South African red bush tea, now a globalised skincare ingredient',
      benefits: ['Anti-inflammatory', 'Antioxidant (lacks caffeine tannins that dehydrate skin)', 'Zinc and alpha-hydroxy acids naturally present', 'Soothes eczema and sensitive skin'],
      modern: 'Mama Earth, African Botanics, and African-founded brands increasingly feature rooibos',
      diy: 'Brew strong rooibos tea, cool, use as toner or rinse on hair',
    },
  },
};

// ─── JAPANESE BEAUTY TRADITIONS ──────────────────────────────────────────────

export const JAPANESE_BEAUTY_TRADITIONS = {
  system: 'Japanese Beauty (Bi-hatsu / 美肌 techniques)',
  philosophy: 'Wabi-sabi applied to beauty — finding perfection in imperfection. Prevention over correction. Ritual as self-respect.',
  traditions: {
    rice_water: {
      name: 'Rice Water',
      tradition: 'Japanese court ladies of the Heian era (794–1185 CE) were noted for floor-length hair — attributed to rice water rinses',
      modern: 'K-beauty popularised it globally; Japanese geishas use it as face wash',
      uses: ['Hair rinse for strength and shine', 'Face wash for brightening', 'Serum for fine lines'],
      howTo: {
        rinse: 'Soak uncooked rice 30 min, strain water, use as final hair rinse. Leave 5 min, rinse.',
        fermented: 'Let rice water ferment 24–48 hours at room temperature. Dilute 1:10 with water before using (higher pH is more active).',
      },
      scienceNote: 'Rice water contains inositol (a carbohydrate) that can penetrate damaged hair and repair it from within. Also contains ferulic acid (antioxidant), vitamin E, and amino acids.',
    },
    facial_massage: {
      name: 'Tanaka Facial Massage',
      developer: 'Yukuko Tanaka — Japanese beauty expert',
      what: '5-minute daily facial massage technique using fingertips and knuckles along the lymph pathways',
      benefits: ['Lymphatic drainage (reduces puffiness)', 'Increases circulation (natural glow)', 'Tones facial muscles', 'Relaxes jaw tension'],
      basicSteps: [
        'Apply serum or oil to face',
        'Using knuckles, sweep from chin to ears along jaw: 3 times each side',
        'Pat temples and move lymph down neck: 3 times',
        'Circle cheekbones outward to ears: 3 times',
        'Smooth forehead upward and outward: 3 times',
      ],
    },
    mochi_skin: {
      name: 'Mochi Skin',
      what: 'The Japanese beauty ideal — skin that is plump, bouncy, elastic, and smooth like mochi rice cake',
      how: ['Multi-layer hydration (similar to K-beauty)', 'Collagen-building diet (bone broth, fish collagen, tofu)', 'Sunscreen always', 'Gentle cleansing — never stripping'],
      vs_glass_skin: 'Mochi skin is softer, more elastic, more natural-looking; glass skin is more dewy and reflective. Both are K/J beauty ideals that celebrate hydration.',
    },
  },
};

// ─── MOROCCAN BEAUTY TRADITIONS ──────────────────────────────────────────────

export const MOROCCAN_BEAUTY_TRADITIONS = {
  system: 'Moroccan / North African Traditional Beauty',
  hammam: {
    name: 'Hammam (Traditional Moroccan Bath)',
    what: 'Ritual steam bathing and exfoliation — the cornerstone of North African beauty for centuries',
    ritual: [
      { step: 1, name: 'Steam Phase', description: 'Sit in the hot room to open pores and soften skin. 15–30 minutes.' },
      { step: 2, name: 'Savon Beldi Application', description: 'Black olive soap (Savon Beldi) applied to softened skin. Leave 3–5 minutes.' },
      { step: 3, name: 'Kessa Scrubbing', description: 'Kessa glove (rough exfoliating mitt) scrubs away dead skin — the most satisfying part of the ritual. The dead skin rolls off visibly.' },
      { step: 4, name: 'Ghassoul Clay Mask', description: 'Natural Moroccan clay applied to face and/or hair. Rich in minerals. Draws out impurities.' },
      { step: 5, name: 'Argan Oil Final Treatment', description: 'Argan oil applied to face, body, and hair as final step — the Moroccan liquid gold.' },
    ],
    
  },
  arganOil: {
    name: 'Argan Oil',
    origin: 'Argan tree (Argania spinosa) — endemic to Morocco. UNESCO Biosphere Reserve.',
    harvesting: 'Argan nuts traditionally collected from goat droppings (goats climb the trees to eat nuts) or from ground. Women\'s cooperatives crack nuts by hand to extract kernels. Economically vital for Amazigh (Berber) women.',
    types: {
      cosmetic: 'Cold-pressed, unroasted. Light golden. For skin and hair.',
      culinary: 'Lightly roasted before pressing. Deeper colour and nutty flavour. Food use only.',
    },
    skinBenefits: ['Vitamin E', 'Linoleic acid (anti-inflammatory omega-6)', 'Oleic acid (penetrating moisturiser)', 'Squalene (mimics skin\'s own oil)', 'Anti-aging antioxidants'],
    
    fairTrade: 'Look for brands that partner with Moroccan women\'s cooperatives — the industry can exploit if not fair-trade certified',
  },
};

// ─── UNIFIED API ──────────────────────────────────────────────────────────────

export const ALL_TRADITIONAL_SYSTEMS = {
  ayurveda: AYURVEDA,
  tcm: TRADITIONAL_CHINESE_MEDICINE_BEAUTY,
  unani: UNANI_BEAUTY,
  african: AFRICAN_TRADITIONAL_MEDICINE_BEAUTY,
  japanese: JAPANESE_BEAUTY_TRADITIONS,
  moroccan: MOROCCAN_BEAUTY_TRADITIONS,
};

export function getSystemForCommunity(communityId) {
  const communitySystemMap = {
    'south-asian': 'ayurveda',
    'east-asian': 'tcm',
    'arab': 'unani',
    'west-african': 'african',
    'east-african': 'african',
    'south-african': 'african',
    'black-american': 'african',
    'caribbean': 'african',
  };

  const systemKey = communitySystemMap[communityId];
  return systemKey ? ALL_TRADITIONAL_SYSTEMS[systemKey] : null;
}

export function getIngredientByName(name) {
  const n = name.toLowerCase();
  for (const system of Object.values(ALL_TRADITIONAL_SYSTEMS)) {
    const ingredients = system.ayurvedicBeautyIngredients ||
      system.tcmIngredients ||
      system.beautyIngredients ||
      {};
    for (const [key, ing] of Object.entries(ingredients)) {
      if (key.includes(n) || ing.name?.toLowerCase().includes(n)) {
        return { system: system.system, ...ing };
      }
    }
  }
  return null;
}

export function getAllTraditionalSystems() {
  return Object.values(ALL_TRADITIONAL_SYSTEMS);
}

export function getPracticeByName(practiceName) {
  const n = practiceName.toLowerCase();
  for (const system of Object.values(ALL_TRADITIONAL_SYSTEMS)) {
    const practices = system.tcmBeautyPractices || system.traditions || {};
    for (const [key, practice] of Object.entries(practices)) {
      if (key.includes(n) || practice.name?.toLowerCase().includes(n)) {
        return { system: system.system, ...practice };
      }
    }
  }
  return null;
}

