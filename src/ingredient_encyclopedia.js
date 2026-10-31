/**
 * ingredient_encyclopedia.js — Beauty ingredient database for MIRRR
 * Comprehensive ethnic and globally-sourced beauty ingredients
 */

// ─── INGREDIENT CATEGORIES ────────────────────────────────────────────────────

export const INGREDIENT_CATEGORIES = {
  botanical:     { id: 'botanical',     label: 'Botanical Extract',      icon: '🌿' },
  oil:           { id: 'oil',           label: 'Plant Oil',              icon: '💧' },
  butter:        { id: 'butter',        label: 'Plant Butter',           icon: '🧈' },
  acid:          { id: 'acid',          label: 'Acid / AHA / BHA',       icon: '⚗️'  },
  vitamin:       { id: 'vitamin',       label: 'Vitamin',                icon: '💊' },
  mineral:       { id: 'mineral',       label: 'Mineral',                icon: '💎' },
  peptide:       { id: 'peptide',       label: 'Peptide / Protein',      icon: '🔬' },
  traditional:   { id: 'traditional',  label: 'Traditional / Ritual',   icon: '🏺' },
  spf:           { id: 'spf',           label: 'Sun Protection',         icon: '☀️'  },
  fermented:     { id: 'fermented',     label: 'Fermented',              icon: '🫙'  },
};

// ─── INGREDIENT DATABASE ──────────────────────────────────────────────────────

export const INGREDIENTS = {

  // ── TRADITIONAL / RITUAL INGREDIENTS ────────────────────────────────────

  shea_butter: {
    id: 'shea_butter',
    name: 'Shea Butter',
    latinName: 'Butyrospermum parkii',
    category: 'butter',
    origin: 'West Africa (Ghana, Nigeria, Burkina Faso)',
    communities: ['west-african', 'east-african', 'south-african', 'black-american', 'caribbean'],
    description: 'A fatty butter extracted from the nut of the African shea tree. Deeply moisturising.',
    benefits: ['deep moisturisation', 'wound healing', 'anti-inflammatory', 'barrier repair'],
    concerns: ['dry skin', 'eczema', 'hyperpigmentation (skin tone evening)', 'hair moisture'],
    ethnicSkinNote: 'Cornerstone of West African and diasporic skincare. Used on newborn skin in many West African communities.',
    traditionalUse: 'Applied from birth across West Africa. Used as a protective skin barrier in harmattan season. Hair treatments, lip care, baby skin, and cooking.',
    culturalContext: 'Women in the shea belt (Ghana to Burkina Faso) have produced shea butter for millennia. The "women\'s gold" — shea cooperatives provide economic independence.',
    howToUse: 'Apply raw shea directly to damp skin after shower. Mix into conditioner for hair. Use as occlusif over serums.',
    comedogenicRating: 0,
    concentration: '5-100% (raw)',
    pairsWith: ['aloe_vera', 'coconut_oil', 'argan_oil', 'vitamin_e'],
    
    keyCompounds: ['stearic acid', 'oleic acid', 'triterpenes', 'vitamin E', 'vitamin A'],
    alcoholFree: true,
    veganFriendly: true,
    certifications: ['COSMOS', 'Fair Trade', 'organic varieties'],
  },

  baobab_oil: {
    id: 'baobab_oil',
    name: 'Baobab Oil',
    latinName: 'Adansonia digitata seed oil',
    category: 'oil',
    origin: 'Sub-Saharan Africa (Tanzania, Malawi, Zimbabwe)',
    communities: ['east-african', 'south-african', 'west-african'],
    description: 'Lightweight but deeply nutritious oil from the baobab "tree of life." Rich in omega 3, 6, and 9.',
    benefits: ['fast absorption', 'omega 3/6/9 delivery', 'skin elasticity', 'hair shine', 'scalp health'],
    concerns: ['dry skin', 'mature skin', 'brittle hair', 'split ends', 'scalp dryness'],
    ethnicSkinNote: 'Adds shine without heaviness. Traditional remedy for skin conditions across southern Africa.',
    traditionalUse: 'Traditional East African and southern African ingredient for skin hydration and hair conditioning.',
    culturalContext: 'The baobab is called "tree of life" across Africa for its nutritional and medicinal properties. Communities live around these ancient trees for thousands of years.',
    howToUse: 'Apply 2-3 drops to damp face. Use as hair serum on ends. Mix into body lotion.',
    comedogenicRating: 2,
    concentration: '1-100% (carrier)',
    pairsWith: ['marula_oil', 'shea_butter', 'vitamin_c'],
    
    keyCompounds: ['oleic acid', 'linoleic acid', 'alpha-linolenic acid', 'palmitic acid', 'vitamin A', 'D', 'E', 'F'],
    alcoholFree: true,
    veganFriendly: true,
    certifications: ['organic', 'fair trade'],
  },

  marula_oil: {
    id: 'marula_oil',
    name: 'Marula Oil',
    latinName: 'Sclerocarya birrea kernel oil',
    category: 'oil',
    origin: 'Southern Africa (South Africa, Zimbabwe, Botswana)',
    communities: ['south-african', 'east-african'],
    description: 'Oil from the kernel of the marula fruit. High in oleic acid, fast-absorbing, deeply hydrating.',
    benefits: ['intensive hydration', 'anti-ageing', 'wound healing', 'antioxidant', 'hair gloss'],
    concerns: ['dehydrated skin', 'ageing concerns', 'dull skin', 'dry hair', 'frizz'],
    ethnicSkinNote: 'Traditional skincare oil across southern Africa.',
    traditionalUse: 'Used by Tsonga, Venda, and Zulu women for centuries for skin and hair.',
    culturalContext: 'Marula is sacred in southern African culture — the "Queen of Trees." Elephants are famously attracted to fermenting marula fruit.',
    howToUse: '2-3 drops on damp skin morning and evening. Apply to ends of hair. Cuticle oil.',
    comedogenicRating: 3,
    concentration: '1-100% (carrier)',
    pairsWith: ['baobab_oil', 'vitamin_c', 'hyaluronic_acid'],
    
    keyCompounds: ['oleic acid', 'palmitic acid', 'linoleic acid', 'stearic acid', 'tocopherols'],
    alcoholFree: true,
    veganFriendly: true,
  },

  argan_oil: {
    id: 'argan_oil',
    name: 'Argan Oil',
    latinName: 'Argania spinosa kernel oil',
    category: 'oil',
    origin: 'Morocco (Southwest, Souss-Massa)',
    communities: ['arab', 'east-african'],
    description: 'The "liquid gold" of Morocco. Lightweight, non-greasy oil rich in vitamin E, fatty acids, and squalane.',
    benefits: ['frizz control', 'shine', 'anti-ageing', 'acne scar fading', 'nail strengthening'],
    concerns: ['dry hair', 'frizzy hair', 'dry skin', 'fine lines', 'hyperpigmentation'],
    ethnicSkinNote: 'Foundation of Moroccan and North African beauty rituals. Popular for wavy and curly hair.',
    traditionalUse: 'Berber women have produced argan oil cooperatively for generations — for cooking, cosmetics, and medicinal use.',
    culturalContext: 'Argan oil production is a key economic lifeline for Berber women in the Arganeraie biosphere reserve. UNESCO recognizes it as intangible cultural heritage.',
    howToUse: 'Apply 2-4 drops to damp hair, focus on ends. For face: 2 drops pressed in palms, patted on.',
    comedogenicRating: 0,
    concentration: '1-100% (carrier)',
    pairsWith: ['rosehip_oil', 'vitamin_e', 'jojoba'],
    
    keyCompounds: ['oleic acid', 'linoleic acid', 'tocopherols (vitamin E)', 'squalane', 'sterols'],
    alcoholFree: true,
    veganFriendly: true,
    certifications: ['USDA Organic', 'Ecocert', 'fair trade cooperatives'],
  },

  rosehip_oil: {
    id: 'rosehip_oil',
    name: 'Rosehip Seed Oil',
    latinName: 'Rosa canina / Rosa rubiginosa seed oil',
    category: 'oil',
    origin: 'Chile, Andes (but also grown globally)',
    communities: ['latina', 'all'],
    description: 'Vitamin C and vitamin A-rich oil pressed from dried rosehip seeds. Contains provitamin A (beta-carotene).',
    benefits: ['hyperpigmentation reduction', 'scar fading', 'anti-ageing', 'brightening', 'hydration'],
    concerns: ['PIH', 'acne scarring', 'uneven skin tone', 'fine lines', 'dull skin'],
    ethnicSkinNote: 'A light oil many people with dark marks like; patch-test first.',
    traditionalUse: 'Used by Indigenous Andean communities for healing skin conditions and improving complexion.',
    culturalContext: 'Central to Chilean and Andean folk medicine. Modern beauty discovery elevated it globally — though it had been used for generations.',
    howToUse: '2-3 drops AM or PM. Mix with moisturiser for a lighter dose.',
    comedogenicRating: 1,
    concentration: '1-100%',
    pairsWith: ['vitamin_c', 'niacinamide', 'hyaluronic_acid'],
    keyCompounds: ['linoleic acid', 'alpha-linolenic acid', 'oleic acid', 'vitamin C', 'lycopene', 'beta-carotene'],
    alcoholFree: true,
    veganFriendly: true,
  },

  amla_oil: {
    id: 'amla_oil',
    name: 'Amla Oil (Indian Gooseberry)',
    latinName: 'Phyllanthus emblica / Emblica officinalis',
    category: 'oil',
    origin: 'India, South Asia',
    communities: ['south-asian'],
    description: 'Ayurvedic hair oil made from Indian gooseberry (amla). Rich in vitamin C. Traditionally used as a hair tonic and against early greying.',
    benefits: ['traditional hair tonic', 'scalp nourishment', 'dandruff reduction', 'shine'],
    concerns: ['hair thinning', 'premature grey', 'dandruff', 'dry scalp', 'hair breakage'],
    ethnicSkinNote: 'Central to South Asian hair care across generations. Weekly champi (head massage) with amla oil is a generational ritual.',
    traditionalUse: 'Ayurvedic hair and scalp treatment used for centuries. Applied as champi (oil massage), mixed with coconut oil.',
    culturalContext: 'Amla (amalaki) is one of the most sacred plants in Ayurveda.',
    howToUse: 'Warm 2 tbsp and massage into scalp weekly. Leave 30+ minutes, then shampoo. Mix with coconut for lighter feel.',
    comedogenicRating: 2,
    concentration: 'Extract/infused oil',
    pairsWith: ['coconut_oil', 'brahmi', 'bhringraj', 'fenugreek'],
    
    keyCompounds: ['vitamin C', 'tannins', 'ellagic acid', 'phyllembelin', 'iron'],
    alcoholFree: true,
    veganFriendly: true,
  },

  coconut_oil: {
    id: 'coconut_oil',
    name: 'Coconut Oil',
    latinName: 'Cocos nucifera oil',
    category: 'oil',
    origin: 'Tropical Asia, Pacific Islands, South America',
    communities: ['south-asian', 'east-asian', 'caribbean', 'latina', 'east-african'],
    description: 'Versatile saturated oil with antimicrobial lauric acid. Hair conditioning, skin moisturising, oil cleansing.',
    benefits: ['deep hair conditioning', 'antimicrobial', 'oil cleansing', 'lip care', 'body moisturiser'],
    concerns: ['dry hair', 'protein-deficient hair', 'makeup removal', 'chapped lips'],
    ethnicSkinNote: 'Very comedogenic (5) — avoid as face moisturiser for acne-prone skin. Excellent for hair and body.',
    traditionalUse: 'Used across South Asia (champi), Pacific Islands (monoi), Caribbean (hair and body) for centuries.',
    culturalContext: 'One of the most culturally universal beauty ingredients — used in ayurveda, pacific island tradition, and Caribbean folk beauty.',
    howToUse: 'Hair: pre-poo treatment 30min before wash. Body: post-shower on damp skin. Avoid face if acne-prone.',
    comedogenicRating: 5,
    concentration: '1-100%',
    pairsWith: ['aloe_vera', 'shea_butter', 'essential_oils'],
    avoidWith: ['acne-prone skin (as face product)'],
    keyCompounds: ['lauric acid', 'myristic acid', 'palmitic acid', 'caprylic acid'],
    alcoholFree: true,
    veganFriendly: true,
  },

  black_seed_oil: {
    id: 'black_seed_oil',
    name: 'Black Seed Oil (Nigella)',
    latinName: 'Nigella sativa oil',
    category: 'oil',
    origin: 'Egypt, Middle East, South Asia',
    communities: ['arab', 'south-asian', 'west-african', 'east-african'],
    description: 'Thymoquinone-rich oil with potent anti-inflammatory and antimicrobial properties. Prophetic medicine in Islamic tradition.',
    benefits: ['anti-inflammatory', 'eczema relief', 'scalp health'],
    concerns: ['acne', 'eczema', 'psoriasis', 'thinning hair', 'dark spots'],
    ethnicSkinNote: 'Traditionally used for skin and scalp; research on its thymoquinone is early.',
    traditionalUse: 'Cited in Islamic tradition as "a cure for everything except death." Used in Egyptian and Middle Eastern medicine for 3,000+ years.',
    culturalContext: 'Found in Tutankhamun\'s tomb. Mentioned in Bible and Islamic hadith. Central to Arab and South Asian folk medicine.',
    howToUse: '1-2 drops mixed with moisturiser for face. Apply directly to problem spots. Scalp massage 2x/week.',
    comedogenicRating: 2,
    concentration: '0.5-2% (potent, start low)',
    pairsWith: ['aloe_vera', 'vitamin_c', 'niacinamide'],
    avoidWith: ['blood-thinning medications (consult doctor)'],
    keyCompounds: ['thymoquinone (TQ)', 'carvacrol', 'linoleic acid', 'oleic acid', 'palmitic acid'],
    alcoholFree: true,
    veganFriendly: true,
  },

  turmeric: {
    id: 'turmeric',
    name: 'Turmeric (Haldi)',
    latinName: 'Curcuma longa',
    category: 'botanical',
    origin: 'South Asia, Southeast Asia',
    communities: ['south-asian', 'east-asian', 'east-african'],
    description: 'Bright yellow rhizome with potent curcumin compounds. Anti-inflammatory, brightening, antiseptic.',
    benefits: ['brightening', 'anti-inflammatory', 'anti-bacterial', 'wound healing', 'hyperpigmentation reduction'],
    concerns: ['uneven skin tone', 'inflammation', 'dull skin', 'dark circles', 'acne'],
    ethnicSkinNote: 'Central to South Asian bridal preparation (haldi ceremony). Can stain pale skin yellow — use consistently and wash off promptly.',
    traditionalUse: 'Ubtan (turmeric paste for bridal glow), Haldi ceremony, Ayurvedic internal and topical medicine.',
    culturalContext: 'A sacred beauty ingredient in South Asia; haldi is part of many South Asian weddings. Also used in food, medicine, worship.',
    howToUse: 'Mix pinch with yogurt/honey/gram flour for face mask. Use in cleanser. Can stain skin and fabric yellow for a few hours; patch-test first.',
    comedogenicRating: 1,
    concentration: '0.1-1% in products (staining risk higher)',
    pairsWith: ['honey', 'aloe_vera', 'rose_water', 'gram_flour'],
    avoidWith: ['light-coloured fabric (temporary yellow stain)', 'open wounds'],
    keyCompounds: ['curcumin', 'desmethoxycurcumin', 'bisdemethoxycurcumin', 'turmerone', 'zingiberene'],
    staining: true,
    alcoholFree: true,
    veganFriendly: true,
  },

  rooibos: {
    id: 'rooibos',
    name: 'Rooibos Extract',
    latinName: 'Aspalathus linearis',
    category: 'botanical',
    origin: 'South Africa (Western Cape, Cederberg)',
    communities: ['south-african'],
    description: 'South African "red bush" tea extract rich in antioxidants and polyphenols. Calming.',
    benefits: ['antioxidant', 'anti-inflammatory', 'brightening', 'soothing', 'anti-ageing'],
    concerns: ['sensitive skin', 'redness', 'hyperpigmentation', 'dull skin', 'oxidative stress'],
    ethnicSkinNote: 'Uniquely South African ingredient gaining global attention. Its main antioxidants are aspalathin and quercetin.',
    traditionalUse: 'Traditionally brewed as tea and applied topically for rashes and skin irritation in Khoisan and Cape communities.',
    culturalContext: 'Rooibos is one of the most uniquely South African gifts to the world. Only grown in Cederberg. Major economic export.',
    howToUse: 'Look for in serums and toners. DIY: brew strong tea, cool, use as toner mist. Clay mask addition.',
    comedogenicRating: 0,
    concentration: '0.5-5% extract',
    pairsWith: ['vitamin_c', 'niacinamide', 'aloe_vera'],
    
    keyCompounds: ['aspalathin', 'quercetin', 'luteolin', 'orientin', 'nothofagin'],
    alcoholFree: true,
    veganFriendly: true,
  },

  moringa_oil: {
    id: 'moringa_oil',
    name: 'Moringa Oil (Ben Oil)',
    latinName: 'Moringa oleifera seed oil',
    category: 'oil',
    origin: 'India, East Africa, West Africa',
    communities: ['east-african', 'west-african', 'south-asian'],
    description: 'The "miracle tree" oil. Ancient Egyptian beauty ingredient. Rich in behenic acid; used for cleansing and moisturising.',
    benefits: ['makeup removal', 'anti-ageing', 'moisturisation', 'antioxidant', 'skin brightening', 'wound healing'],
    concerns: ['dull skin', 'mature skin', 'makeup removal', 'dry skin', 'oxidative damage'],
    ethnicSkinNote: 'Egyptians used moringa oil as a base for perfumes and skin protectant against desert conditions. Known as "the oil of Ben" in antiquity.',
    traditionalUse: 'Used in ancient Egypt East Africa, and South Asia. Perfume base, skin protectant, hair treatment.',
    culturalContext: 'Called "the drumstick tree" in South Asia and "the miracle tree" in Africa. Every part of the tree is used.',
    howToUse: 'Face oil — 2-3 drops PM. Makeup remover — apply with cotton pad. Hair tip oil.',
    comedogenicRating: 3,
    concentration: '1-100%',
    pairsWith: ['vitamin_c', 'hyaluronic_acid', 'rose_water'],
    
    keyCompounds: ['behenic acid', 'oleic acid', 'zeatin', 'tocopherols', 'sterols'],
    alcoholFree: true,
    veganFriendly: true,
  },

  rice_water: {
    id: 'rice_water',
    name: 'Rice Water',
    latinName: 'Oryza sativa water ferment',
    category: 'fermented',
    origin: 'East Asia (Japan, China, Korea), Southeast Asia',
    communities: ['east-asian'],
    description: 'Fermented water from soaked rice. Inositol, vitamins, and amino acids that strengthen hair and brighten skin.',
    benefits: ['hair strengthening', 'skin brightening', 'protein treatment'],
    concerns: ['hair breakage', 'hair loss', 'dull skin', 'large pores', 'fine hair'],
    ethnicSkinNote: 'Rice-water hair rinses are a tradition in China and Japan, including among the Red Yao women of Huangluo, known for very long hair.',
    traditionalUse: 'Japanese: rice water (Yu-su-ru) used by Heian court ladies for long hair. Chinese Yao tradition. Korean: fermented in makgeolli rice wine.',
    culturalContext: 'One of Asia\'s most famous indigenous beauty secrets. Huangluo village, home of the Red Yao, is famous for women\'s very long hair.',
    howToUse: 'After shampooing, pour rice water over hair, leave 20min, rinse. For face: cotton pad toner. Ferment for 1-3 days for potency.',
    comedogenicRating: 0,
    concentration: 'DIY diluted to 10-20%',
    pairsWith: ['aloe_vera', 'camellia_oil', 'green_tea'],
    avoidWith: ['protein-sensitive hair (can overload)'],
    keyCompounds: ['inositol', 'B vitamins', 'amino acids', 'ferulic acid', 'allantoin', 'GABA (fermented)'],
    alcoholFree: true,
    veganFriendly: true,
  },

  camellia_oil: {
    id: 'camellia_oil',
    name: 'Camellia Oil (Tsubaki)',
    latinName: 'Camellia japonica seed oil',
    category: 'oil',
    origin: 'Japan, China, Korea',
    communities: ['east-asian'],
    description: 'Japanese "tsubaki" oil — a centuries-old Japanese beauty ritual. Highly oleic, deeply penetrating, sublime hair gloss.',
    benefits: ['hair shine', 'hair softening', 'skin anti-ageing', 'fast absorption', 'cuticle repair'],
    concerns: ['dull hair', 'frizz', 'dry skin', 'cuticle damage', 'fine lines'],
    ethnicSkinNote: 'A traditional Japanese hair oil, prized for gloss.',
    traditionalUse: 'Traditional Japanese hair oil used by women across Japan (and by geiko and maiko), Meiji-era skin care, traditional Japanese beauty ritual.',
    culturalContext: 'The camellia flower is a symbol of Japan — "tsubaki" appears in Japanese art, poetry, and temple gardens. Japanese women have used it for centuries.',
    howToUse: '1-2 drops on palm, press into ends of damp or dry hair. Cuticle oil. Face oil (PM).',
    comedogenicRating: 1,
    concentration: '1-100%',
    pairsWith: ['jojoba', 'vitamin_e', 'argan_oil'],
    
    keyCompounds: ['oleic acid', 'palmitic acid', 'stearic acid', 'linoleic acid', 'squalane', 'tocopherols'],
    alcoholFree: true,
    veganFriendly: true,
  },

  // ── BRIGHTENING / DEPIGMENTING ───────────────────────────────────────────

  kojic_acid: {
    id: 'kojic_acid',
    name: 'Kojic Acid',
    latinName: 'Kojic acid (fungal derivative)',
    category: 'botanical',
    origin: 'Japan (fermented saké byproduct)',
    communities: ['all'],
    description: 'Tyrosinase inhibitor made by fungi during fermentation (as in sake and soy sauce). Reduces melanin production to fade dark spots.',
    benefits: ['dark spot fading', 'hyperpigmentation', 'brightening', 'anti-ageing', 'antibacterial'],
    concerns: ['PIH (post-inflammatory hyperpigmentation)', 'melasma', 'dark spots', 'uneven skin tone'],
    ethnicSkinNote: 'Widely used across Asian beauty markets. On deeper skin, patch-test: irritation can itself leave dark marks.',
    traditionalUse: 'Discovered in Japan from saké and miso fermentation.',
    culturalContext: 'Staple in Asian and Korean brightening skincare. Exported globally as alternative to hydroquinone.',
    howToUse: '1-2% concentration. Apply PM to clean skin, follow with SPF next morning. Introduce slowly for sensitive skin.',
    comedogenicRating: 0,
    concentration: '1-4% (2% standard)',
    pairsWith: ['vitamin_c', 'niacinamide', 'alpha_arbutin', 'AHA'],
    avoidWith: ['high-concentration AHAs (irritation risk)'],
    keyCompounds: ['5-hydroxy-2-(hydroxymethyl)-4-pyranone'],
    photosensitive: true,
    suitableFor: ['PIH', 'melasma', 'dark spots'],
  },

  alpha_arbutin: {
    id: 'alpha_arbutin',
    name: 'Alpha Arbutin',
    latinName: 'α-Arbutin (glycoside from bearberry)',
    category: 'botanical',
    origin: 'Bearberry plant (worldwide)',
    communities: ['all'],
    description: 'A gentle but potent tyrosinase inhibitor. More stable and less irritating than kojic acid or hydroquinone.',
    benefits: ['hyperpigmentation fading', 'brightening', 'PIH reduction', 'safe for sensitive skin'],
    concerns: ['dark spots', 'PIH', 'melasma', 'uneven skin tone', 'post-acne marks'],
    ethnicSkinNote: 'Gentler than hydroquinone and usually well tolerated on deeper skin; patch-test first.',
    traditionalUse: 'Synthetic ingredient — no traditional use, but derived from naturally occurring arbutin in plants.',
    culturalContext: 'A modern skincare innovation that has transformed brightening routines, especially for people with melanin-rich skin.',
    howToUse: '2% concentration AM or PM. Consistent use 4-12 weeks for noticeable results. Always use SPF.',
    comedogenicRating: 0,
    concentration: '1-4%',
    pairsWith: ['niacinamide', 'vitamin_c', 'hyaluronic_acid'],
    avoidWith: ['hydroquinone (redundant, over-inhibition)'],
    keyCompounds: ['α-D-glucopyranoside hydroquinone'],
    photosensitive: false,
    suitableFor: ['PIH', 'dark spots', 'melasma', 'sensitive skin'],
  },

  niacinamide: {
    id: 'niacinamide',
    name: 'Niacinamide (Vitamin B3)',
    latinName: 'Nicotinamide',
    category: 'vitamin',
    origin: 'Synthetic (from niacin)',
    communities: ['all'],
    description: 'Multitasking vitamin B3 derivative. Addresses pores, oil, redness, pigmentation, barrier — all at once.',
    benefits: ['pore minimising', 'oil control', 'redness reduction', 'brightening', 'barrier repair', 'anti-ageing'],
    concerns: ['large pores', 'oily skin', 'hyperpigmentation', 'redness', 'uneven skin tone', 'dehydration'],
    ethnicSkinNote: 'Universally beneficial for all skin types. At 5-10%, a good first active for most skin, including melanin-rich skin.',
    traditionalUse: 'Modern ingredient — no traditional use.',
    culturalContext: 'Widely recommended by dermatologists. Became mainstream through The Ordinary\'s affordable 10% formula.',
    howToUse: '5-10% concentration AM or PM or both. Layer under moisturiser. Niacinamide does not cause the flushing that niacin can.',
    comedogenicRating: 0,
    concentration: '2-20% (5-10% optimal)',
    pairsWith: ['hyaluronic_acid', 'vitamin_c', 'alpha_arbutin', 'azelaic_acid'],
    keyCompounds: ['nicotinamide', 'vitamin B3'],
    photosensitive: false,
    suitableFor: ['all skin types', 'acne', 'rosacea', 'PIH', 'ageing'],
  },

  vitamin_c: {
    id: 'vitamin_c',
    name: 'Vitamin C (L-Ascorbic Acid)',
    latinName: 'L-ascorbic acid',
    category: 'vitamin',
    origin: 'Derived from natural or synthetic sources',
    communities: ['all'],
    description: 'Gold-standard antioxidant and brightening agent. Fights free radicals, boosts collagen, fades pigmentation.',
    benefits: ['brightening', 'anti-ageing', 'collagen boost', 'antioxidant', 'SPF enhancement', 'hyperpigmentation'],
    concerns: ['dull skin', 'dark spots', 'sun damage', 'fine lines', 'uneven tone'],
    ethnicSkinNote: 'Effective for dark marks on melanin-rich skin; pair it with daily SPF, which it supports but does not replace.',
    traditionalUse: 'Derived from natural sources — amla (Indian gooseberry), rose hip, camu camu (Amazonian).',
    culturalContext: 'Amla, a rich source, links modern vitamin C serums to Ayurveda.',
    howToUse: '10-20% AM under SPF. pH must be below 3.5 for efficacy. Unstable — use freshly opened, amber bottle.',
    comedogenicRating: 0,
    concentration: '10-20%',
    pairsWith: ['vitamin_e', 'ferulic_acid', 'SPF', 'hyaluronic_acid'],
    avoidWith: ['retinol (PM vs AM)', 'benzoyl_peroxide', 'AHAs/BHAs (irritation at high concentrations)'],
    keyCompounds: ['L-ascorbic acid'],
    photosensitive: false,
    requiresSPF: true,
    suitableFor: ['all', 'PIH', 'melasma', 'dull skin', 'anti-ageing'],
  },

  azelaic_acid: {
    id: 'azelaic_acid',
    name: 'Azelaic Acid',
    latinName: 'Azelaic acid (from grains)',
    category: 'acid',
    origin: 'Derived from rye, wheat, barley (Nonamedioic acid)',
    communities: ['all'],
    description: 'Multi-functional acid that addresses acne, rosacea, AND pigmentation without irritation. Usually well tolerated.',
    benefits: ['acne treatment', 'rosacea relief', 'brightening', 'anti-inflammatory', 'comedolytic', 'safe in pregnancy'],
    concerns: ['acne', 'rosacea', 'PIH', 'sensitive skin', 'pregnancy-safe brightening'],
    ethnicSkinNote: 'Well suited to Fitzpatrick IV-VI: it fades dark marks with a low risk of the irritation that can cause new ones.',
    traditionalUse: 'Occurs naturally in grains — no traditional standalone use.',
    culturalContext: 'Prescribed by dermatologists for acne, rosacea and dark marks.',
    howToUse: '10-20% AM or PM. Slight tingle on application is normal. Safe long-term. Safe in pregnancy (confirm with doctor).',
    comedogenicRating: 0,
    concentration: '10-20%',
    pairsWith: ['niacinamide', 'hyaluronic_acid', 'spf'],
    
    photosensitive: false,
    pregnancySafe: true,
    suitableFor: ['acne', 'rosacea', 'PIH', 'sensitive skin', 'pregnant skin'],
  },

  glycolic_acid: {
    id: 'glycolic_acid',
    name: 'Glycolic Acid',
    latinName: 'Glycolic acid (sugarcane-derived)',
    category: 'acid',
    origin: 'Sugarcane (natural), also synthetic',
    communities: ['all'],
    description: 'The most potent AHA. Smallest molecule size for deepest penetration. Exfoliates, brightens, anti-ages.',
    benefits: ['exfoliation', 'brightening', 'pore unclogging', 'anti-ageing', 'texture improvement', 'hyperpigmentation'],
    concerns: ['dull skin', 'uneven texture', 'dark spots', 'anti-ageing', 'clogged pores'],
    ethnicSkinNote: 'Caution for Fitzpatrick V-VI: excessive exfoliation can trigger PIH. Use 5-10% maximum, always follow with SPF.',
    traditionalUse: 'Sugarcane-derived. Ancient Egyptians used sour milk (lactic acid) and wine (tartaric acid) — conceptual ancestors.',
    culturalContext: 'Studied as a skin treatment from the 1970s and widely used since the 1990s.',
    howToUse: '5-10% for sensitive/dark skin tones. PM only. Always use SPF next morning. Start 2x/week.',
    comedogenicRating: 0,
    concentration: '5-15%',
    pairsWith: ['hyaluronic_acid', 'vitamin_c', 'SPF'],
    avoidWith: ['retinol (same night)', 'vitamin_c (same PM — irritation)', 'other AHAs/BHAs (too much acid)'],
    photosensitive: true,
    requiresSPF: true,
    suitableFor: ['all except very sensitive', 'ageing', 'dull skin'],
  },

  hyaluronic_acid: {
    id: 'hyaluronic_acid',
    name: 'Hyaluronic Acid',
    latinName: 'Sodium hyaluronate (stabilised form)',
    category: 'botanical',
    origin: 'Bacterial fermentation (vegan), or rooster comb (older)',
    communities: ['all'],
    description: 'A humectant that holds water in the skin. Universal hydration booster.',
    benefits: ['hydration', 'plumping', 'fine line reduction', 'barrier support', 'fast absorption'],
    concerns: ['dehydration', 'fine lines', 'tight dry feeling', 'sensitive skin'],
    ethnicSkinNote: 'Beneficial for all skin types. In very dry air, seal it with a cream or oil so the skin stays hydrated.',
    traditionalUse: 'First isolated in 1934; once taken from rooster combs, now mostly made by fermentation.',
    culturalContext: 'Popular in layered essence and serum routines.',
    howToUse: 'Apply to damp skin, layer under cream or oil to seal. Look for multi-weight HA for all skin depths.',
    comedogenicRating: 0,
    concentration: '0.1-2%',
    pairsWith: ['everything (universal pairing)'],
    
    photosensitive: false,
    suitableFor: ['all skin types', 'all conditions'],
  },

  retinol: {
    id: 'retinol',
    name: 'Retinol (Vitamin A)',
    latinName: 'Retinol',
    category: 'vitamin',
    origin: 'Synthetic or animal-derived',
    communities: ['all'],
    description: 'Gold-standard anti-ageing active. Speeds cell turnover, boosts collagen, reduces dark spots. Powerful but requires careful introduction.',
    benefits: ['anti-ageing', 'hyperpigmentation', 'acne treatment', 'collagen boost', 'texture improvement'],
    concerns: ['fine lines', 'ageing', 'acne', 'dark spots', 'uneven texture'],
    ethnicSkinNote: 'For Fitzpatrick V-VI: start at 0.025%, use 1x/week, always with SPF. PIH risk from retinol irritation — go very slow.',
    traditionalUse: 'Vitamin A-rich foods used across many cultures (carrot, sweet potato). Modern retinol is synthetic.',
    culturalContext: 'Introduced by Retin-A prescription in 1971. Revolutionised anti-ageing skincare globally.',
    howToUse: 'PM only. Sandwich method for sensitive skin: moisturiser → retinol → moisturiser. Start 0.025-0.05%, increase monthly.',
    comedogenicRating: 0,
    concentration: '0.025-1%',
    pairsWith: ['hyaluronic_acid', 'niacinamide (buffer)', 'SPF (next AM)'],
    avoidWith: ['AHAs same night', 'vitamin_c same night', 'benzoyl_peroxide', 'waxing (3-5 days before)'],
    photosensitive: true,
    requiresSPF: true,
    pregnancySafe: false,
    suitableFor: ['ageing skin', 'acne (prescription strength)', 'PIH (careful intro)'],
  },

  tranexamic_acid: {
    id: 'tranexamic_acid',
    name: 'Tranexamic Acid',
    latinName: 'trans-4-(Aminomethyl)cyclohexanecarboxylic acid',
    category: 'acid',
    origin: 'Synthetic (developed in Japan)',
    communities: ['all'],
    description: 'Amino acid derivative first used as a medicine to reduce bleeding; doctors also prescribe it orally for melasma. Topically reduces melanin transfer and brightens stubborn pigmentation.',
    benefits: ['melasma treatment', 'brightening', 'PIH reduction', 'redness reduction'],
    concerns: ['melasma', 'stubborn PIH', 'sun damage', 'hyperpigmentation', 'hormonal pigmentation'],
    ethnicSkinNote: 'Used for melasma, which is more common on medium to deep skin.',
    traditionalUse: 'Modern pharmaceutical ingredient.',
    culturalContext: 'Gained popularity in Asian beauty markets before reaching Western skincare. First used orally in Japan for pigmentation.',
    howToUse: '2-5% AM and PM. Consistent use 8+ weeks. Pair with niacinamide and SPF.',
    comedogenicRating: 0,
    concentration: '2-5%',
    pairsWith: ['niacinamide', 'alpha_arbutin', 'vitamin_c', 'SPF'],
    
    photosensitive: false,
    suitableFor: ['melasma', 'PIH', 'hormonal pigmentation', 'sensitive skin'],
  },

  aloe_vera: {
    id: 'aloe_vera',
    name: 'Aloe Vera',
    latinName: 'Aloe barbadensis leaf juice',
    category: 'botanical',
    origin: 'North Africa, Arabian Peninsula',
    communities: ['all'],
    description: 'The universal soothing gel. Anti-inflammatory, antimicrobial, hydrating, wound-healing.',
    benefits: ['sunburn relief', 'anti-inflammatory', 'wound healing', 'hydration', 'acne calming', 'hair moisture'],
    concerns: ['sunburn', 'irritated skin', 'redness', 'acne', 'dehydrated hair'],
    ethnicSkinNote: 'Well tolerated by most skin; patch-test, as some people are allergic.',
    traditionalUse: 'Used across ancient Egypt, Greece, China, India, and indigenous Americas for wound healing and skin care.',
    culturalContext: 'Used for skin since antiquity.',
    howToUse: 'Apply pure gel directly to cleansed skin. Mix into hair mask. Post-sun soothe. DIY face mask base.',
    comedogenicRating: 0,
    concentration: '1-100%',
    pairsWith: ['everything (universal base)'],
    
    photosensitive: false,
    suitableFor: ['all skin types', 'all conditions', 'all ages'],
  },

  henna: {
    id: 'henna',
    name: 'Henna (Mehndi)',
    latinName: 'Lawsonia inermis',
    category: 'traditional',
    origin: 'South Asia, Middle East, North Africa',
    communities: ['south-asian', 'arab', 'west-african', 'east-african'],
    description: 'Natural plant dye used for body art, hair colouring, and skin conditioning. Rich reddish-brown natural pigment.',
    benefits: ['temporary body art', 'natural hair colour', 'cooling sensation', 'antimicrobial', 'hair conditioning'],
    concerns: ['hair colour (cover greys naturally)', 'hair conditioning', 'spiritual/ceremonial body art'],
    ethnicSkinNote: 'Sacred cultural art form across South Asia, Middle East, and North Africa. Lawsone is the colouring compound.',
    traditionalUse: 'Mehndi ceremonies before South Asian and Arab weddings. Eid celebrations. Berber and West African traditions.',
    culturalContext: 'One of the oldest cosmetic plants, used for thousands of years. Plays a role in nearly every major South Asian and Middle Eastern life event.',
    howToUse: 'Mix dried henna with lemon juice and essential oil. Apply via cone, leave 4-8hrs, flake off. Deep stain develops over 24hrs.',
    comedogenicRating: 0,
    concentration: 'Traditional paste',
    pairsWith: ['lemon juice', 'sugar (for paste)', 'essential oils (for scent)'],
    avoidWith: ['PPD black henna (chemical burn risk)', 'open skin wounds'],
    staining: true,
    alcoholFree: true,
    veganFriendly: true,
    suitableFor: ['body art', 'hair colour', 'ritual use'],
  },

  kohl: {
    id: 'kohl',
    name: 'Kohl (Kajal / Tiro / Surma)',
    latinName: 'Traditional: antimony/carbon-based; Modern: carbon black',
    category: 'traditional',
    origin: 'Ancient Egypt, Middle East, South Asia',
    communities: ['south-asian', 'arab', 'west-african', 'east-african'],
    description: 'Ancient eye pigment with 4,000+ year history. Traditional kohl and surma can contain lead (galena); the FDA does not allow kohl in US cosmetics. Modern kajal pencils use carbon black.',
    benefits: ['deep eye definition', 'cooling eye sensation', 'traditional protective use', 'long-wearing'],
    concerns: ['eye definition', 'cultural ritual eye art'],
    ethnicSkinNote: 'Avoid traditional lead-based kohl preparations — documented in some markets. Seek carbon-black modern kajal for safe use.',
    traditionalUse: 'Eye protection from sun glare in desert climates. Applied to infants in some South Asian and Arab communities (medical risk — avoid). Wedding, festival, and daily use.',
    culturalContext: 'Kohl appears in ancient Egyptian paintings, Islamic hadith (Prophet Muhammad recommended kohl), and South Asian vedic texts. One of the oldest cosmetics known.',
    howToUse: 'Apply to inner waterline, smudge along lash line. Use a clean pencil or traditional kohl stick.',
    comedogenicRating: 0,
    concentration: 'Varies by traditional/modern formula',
    pairsWith: ['eyeshadow', 'mascara'],
    avoidWith: ['lead-containing traditional kohl', 'use on infants'],
    traditionalRisk: 'Some traditional kohl contains lead — prefer certified modern kajal',
    suitableFor: ['eye definition', 'cultural ritual'],
  },

  bakuchiol: {
    id: 'bakuchiol',
    name: 'Bakuchiol',
    latinName: 'Bakuchiol (from Psoralea corylifolia)',
    category: 'botanical',
    origin: 'India (traditional Ayurvedic use of babchi seeds)',
    communities: ['south-asian', 'all'],
    description: 'Natural retinol alternative from babchi plant. A plant-based retinol alternative; one small trial found results similar to retinol with less irritation.',
    benefits: ['anti-ageing (retinol pathway)', 'brightening', 'AM/PM use', 'sensitive skin compatible'],
    concerns: ['anti-ageing', 'dark spots', 'sensitive skin', 'pregnancy-safe anti-ageing'],
    ethnicSkinNote: 'A gentler option for Fitzpatrick V-VI who find retinol irritating, since irritation can leave dark marks.',
    traditionalUse: 'Babchi seeds (Psoralea corylifolia) used in Ayurveda for vitiligo and skin conditions for 3,000+ years.',
    culturalContext: 'From an Ayurvedic plant; one small clinical trial compared it with retinol. Bridges ancient knowledge and modern formulation.',
    howToUse: '0.5-1% AM or PM. Pregnancy safety data are limited: ask your doctor. Wear SPF by day.',
    comedogenicRating: 0,
    concentration: '0.5-1%',
    pairsWith: ['everything (ultra-gentle)'],
    
    photosensitive: false,
    suitableFor: ['sensitive skin', 'PIH-prone skin', 'anti-ageing'],
  },

  ceramides: {
    id: 'ceramides',
    name: 'Ceramides',
    latinName: 'Ceramide NP, AP, EOP, NS, AS',
    category: 'peptide',
    description: 'Lipids that make up much of the skin barrier; creams with ceramides help repair it.',
    origin: 'Wheat-derived or synthetic (vegan)',
    communities: ['all'],
    
    benefits: ['barrier repair', 'hydration', 'eczema relief', 'sensitive skin support', 'anti-ageing'],
    concerns: ['eczema', 'barrier damage', 'dry skin', 'sensitive skin', 'dehydration'],
    ethnicSkinNote: 'Ceramide creams are widely available (CeraVe is one well-known brand). Useful after actives on any skin, including Fitzpatrick V-VI.',
    traditionalUse: 'Modern ingredient — no traditional use.',
    culturalContext: 'Research on skin-barrier lipids by Peter Elias and colleagues shaped ceramide creams; CeraVe launched in 2005.',
    howToUse: 'Found in moisturisers and serums. Layer after actives as moisturiser/sealer. Can use AM and PM.',
    comedogenicRating: 0,
    concentration: '0.01-1%',
    pairsWith: ['hyaluronic_acid', 'cholesterol', 'fatty_acids', 'niacinamide'],
    
    photosensitive: false,
    suitableFor: ['all skin types', 'eczema', 'rosacea', 'barrier damage'],
  },

  spf_mineral: {
    id: 'spf_mineral',
    name: 'Mineral SPF (Zinc Oxide / Titanium Dioxide)',
    latinName: 'Zinc oxide / Titanium dioxide',
    category: 'spf',
    origin: 'Mineral (zinc and titanium)',
    communities: ['all'],
    description: 'Physical/mineral UV blockers that reflect UV rays. Gentle, no chemical absorption, but can leave white cast on darker skin.',
    benefits: ['broad spectrum UV protection', 'immediate protection', 'gentle', 'no chemical absorption'],
    concerns: ['sun protection', 'sensitive skin', 'rosacea', 'pregnancy-safe SPF'],
    ethnicSkinNote: 'White cast is a real issue on Fitzpatrick V-VI. Look for tinted mineral SPF, or hybrid formulas that minimise cast. ',
    traditionalUse: 'Zinc oxide has been used for centuries in ointments.',
    culturalContext: 'Mineral filters are a common choice for sensitive skin and in pregnancy. For deep skin tones, tinted formulas were a major innovation.',
    howToUse: 'Apply as last step of AM routine. 1/2 teaspoon for face and neck. Reapply every 2hrs outdoors.',
    comedogenicRating: 1,
    concentration: '15-25% zinc oxide',
    pairsWith: ['all skincare'],
    
    photosensitive: false,
    pregnancySafe: true,
    suitableFor: ['all skin types', 'sensitive', 'rosacea', 'pregnancy'],
    brands: ['Unsun Cosmetics', 'EltaMD UV Physical', 'La Roche-Posay Anthelios Mineral'],
  },

};

// ─── QUERY FUNCTIONS ─────────────────────────────────────────────────────────

/**
 * Get ingredient by ID
 * @param {string} id
 * @returns {Object|null}
 */
export function getIngredient(id) {
  return INGREDIENTS[id] || null;
}

/**
 * Get all ingredients for a community
 * @param {string} communityId
 * @returns {Object[]}
 */
export function getIngredientsForCommunity(communityId) {
  return Object.values(INGREDIENTS).filter(ing =>
    ing.communities.includes(communityId) || ing.communities.includes('all')
  );
}

/**
 * Search ingredients by concern
 * @param {string} concern e.g. 'hyperpigmentation', 'acne', 'dryness'
 * @returns {Object[]}
 */
export function searchIngredientsByConcern(concern) {
  const norm = concern.toLowerCase();
  return Object.values(INGREDIENTS).filter(ing =>
    ing.concerns.some(c => c.toLowerCase().includes(norm)) ||
    ing.benefits.some(b => b.toLowerCase().includes(norm))
  );
}

/**
 * Get traditional/ritual ingredients
 * @returns {Object[]}
 */
export function getTraditionalIngredients() {
  return Object.values(INGREDIENTS).filter(ing => ing.category === 'traditional');
}

/**
 * Get pregnancy-safe ingredients
 * @returns {Object[]}
 */
export function getPregnancySafeIngredients() {
  return Object.values(INGREDIENTS).filter(ing => ing.pregnancySafe === true);
}

/**
 * Get brightening/depigmenting ingredient stack
 * @returns {Object[]}
 */
export function getBrighteningStack() {
  return Object.values(INGREDIENTS).filter(ing =>
    ing.benefits.some(b => b.includes('brightening') || b.includes('hyperpigmentation') || b.includes('PIH'))
  );
}

/**
 * Get ingredients by comedogenic rating
 * @param {number} maxRating
 * @returns {Object[]}
 */
export function getNonComedogenicIngredients(maxRating = 1) {
  return Object.values(INGREDIENTS).filter(ing =>
    typeof ing.comedogenicRating === 'number' && ing.comedogenicRating <= maxRating
  );
}

/**
 * Get ingredients that require SPF
 * @returns {Object[]}
 */
export function getPhotosensitiveIngredients() {
  return Object.values(INGREDIENTS).filter(ing => ing.photosensitive || ing.requiresSPF);
}

/**
 * Check ingredient compatibility
 * @param {string} id1
 * @param {string} id2
 * @returns {Object} { compatible: boolean, reason: string }
 */
export function checkIngredientCompatibility(id1, id2) {
  const ing1 = INGREDIENTS[id1];
  const ing2 = INGREDIENTS[id2];

  if (!ing1 || !ing2) return { compatible: null, reason: 'Ingredient not found' };

  const conflict1 = (ing1.avoidWith || []).some(a => a.toLowerCase().includes(id2.toLowerCase()) || id2.toLowerCase().includes(a.toLowerCase().split(' ')[0]));
  const conflict2 = (ing2.avoidWith || []).some(a => a.toLowerCase().includes(id1.toLowerCase()) || id1.toLowerCase().includes(a.toLowerCase().split(' ')[0]));

  if (conflict1 || conflict2) {
    return { compatible: false, reason: `${ing1.name} and ${ing2.name} may conflict — check avoidWith notes.` };
  }

  const pairs1 = (ing1.pairsWith || []).some(p => p.toLowerCase().includes(id2.toLowerCase()) || id2.toLowerCase().includes(p.toLowerCase().split('_')[0]));
  const pairs2 = (ing2.pairsWith || []).some(p => p.toLowerCase().includes(id1.toLowerCase()) || id1.toLowerCase().includes(p.toLowerCase().split('_')[0]));

  if (pairs1 || pairs2) {
    return { compatible: true, reason: `${ing1.name} and ${ing2.name} are actively recommended together.` };
  }

  return { compatible: true, reason: 'No known conflicts — generally safe to combine.' };
}

/**
 * Build an ingredient stack for a concern
 * @param {string} concern
 * @param {string} fitzpatrick optional
 * @returns {Object[]}
 */
export function buildIngredientStack(concern, fitzpatrick) {
  const matches = searchIngredientsByConcern(concern);

  // Safety filter for Fitzpatrick V-VI
  if (fitzpatrick && ['V', 'VI'].includes(fitzpatrick)) {
    // Flag photosensitive ingredients as use-with-care
    return matches.map(ing => ({
      ...ing,
      cautionForDarkSkin: ing.photosensitive || (ing.avoidWith || []).some(a => a.toLowerCase().includes('dark')),
    }));
  }

  return matches;
}

/**
 * Get origin countries for an ingredient
 * @param {string} id
 * @returns {string}
 */
export function getIngredientOrigin(id) {
  return INGREDIENTS[id]?.origin || '';
}

/**
 * Get all ingredient names and IDs (for autocomplete)
 * @returns {Object[]}
 */
export function getIngredientList() {
  return Object.values(INGREDIENTS).map(ing => ({
    id: ing.id,
    name: ing.name,
    category: ing.category,
    communities: ing.communities,
  }));
}

// ─── STATS ────────────────────────────────────────────────────────────────────

