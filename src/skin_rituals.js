/**
 * skin_rituals.js — Traditional ethnic skincare rituals database for MIRRR
 * Ancient rituals, modern adaptations, community-specific routines
 */

// ─── RITUAL CATEGORIES ────────────────────────────────────────────────────────

export const RITUAL_CATEGORIES = {
  cleanse: { id: 'cleanse', label: 'Cleansing Ritual', icon: '🧼' },
  mask: { id: 'mask', label: 'Mask & Treatment', icon: '🌿' },
  oil: { id: 'oil', label: 'Facial Oil Ritual', icon: '💧' },
  steam: { id: 'steam', label: 'Steam & Detox', icon: '♨️' },
  exfoliate: { id: 'exfoliate', label: 'Exfoliation', icon: '✨' },
  massage: { id: 'massage', label: 'Facial Massage', icon: '🤲' },
  bridal: { id: 'bridal', label: 'Bridal Prep', icon: '👰' },
  weekly: { id: 'weekly', label: 'Weekly Ritual', icon: '📅' },
  morning: { id: 'morning', label: 'Morning Routine', icon: '🌅' },
  evening: { id: 'evening', label: 'Evening Ritual', icon: '🌙' },
};

// ─── SKIN RITUALS DATABASE ────────────────────────────────────────────────────

export const SKIN_RITUALS = {

  // ═══════════════════════════════════════════════════════════════════════════
  // WEST AFRICAN RITUALS
  // ═══════════════════════════════════════════════════════════════════════════

  shea_body_ritual: {
    id: 'shea_body_ritual',
    name: 'Shea Butter Skin Ritual',
    community: 'west-african',
    category: 'oil',
    origin: 'Ghana / Nigeria / Burkina Faso',
    description: 'The original West African skin ritual — raw unrefined shea butter applied to damp skin for all-day moisture and protection.',
    culturalContext: 'Shea butter (orijin: Ghana, "karite" in French) has been extracted and used by women across West Africa for thousands of years. The Karite shea tree is sacred in many traditions — communities built around it.',
    timing: 'After bath while skin is still slightly damp',
    skinBenefits: ['deep moisturising', 'barrier protection', 'anti-inflammatory', 'eczema relief', 'stretch mark prevention', 'hyperpigmentation reduction'],
    fitzpatrickBest: ['IV', 'V', 'VI'],
    steps: [
      {
        step: 1,
        title: 'Choose unrefined raw shea',
        instruction: 'Use only unrefined, raw shea butter (off-white or ivory, slight nutty smell). Refined/white shea has had most active compounds removed.',
        duration: '(shopping step)',
      },
      {
        step: 2,
        title: 'Warm the shea',
        instruction: 'Take a small amount and warm between palms for 30-60 seconds until it melts into a rich oil.',
        duration: '1 minute',
      },
      {
        step: 3,
        title: 'Apply to damp skin',
        instruction: 'Immediately after bath/shower, while skin is still damp (not wet), massage shea oil into skin in circular motions.',
        duration: '3-5 minutes',
      },
      {
        step: 4,
        title: 'Focus on dry areas',
        instruction: 'Extra attention to elbows, knees, heels, and any dry patches. Layer twice on these areas.',
        duration: '2 minutes',
      },
    ],
    ingredients: ['Raw unrefined shea butter', 'Optional: 2-3 drops lavender or frankincense essential oil'],
    frequency: 'Daily after bath',
    difficulty: 1,
    timeMinutes: 10,
    tags: ['shea', 'west-african', 'moisturising', 'body', 'natural', 'barrier'],
  },

  ose_dudu_cleanse: {
    id: 'ose_dudu_cleanse',
    name: 'Ose Dudu (African Black Soap) Ritual',
    community: 'west-african',
    category: 'cleanse',
    origin: 'Yoruba (Nigeria), Akan (Ghana)',
    description: 'Full black soap cleansing ritual for face and body, as practised in West African tradition.',
    culturalContext: 'Ose dudu (Yoruba: "black soap") is made by Yoruba women from plantain skin ash, cocoa pod ash, palm oil, and shea. Each batch is slightly different — a living artisanal product.',
    timing: 'Morning or evening',
    skinBenefits: ['acne', 'even skin tone', 'anti-bacterial', 'anti-fungal', 'PIH (post-inflammatory hyperpigmentation)'],
    fitzpatrickBest: ['IV', 'V', 'VI'],
    steps: [
      {
        step: 1,
        title: 'Take a small piece',
        instruction: 'Break off a piece the size of a marble. Never cut with a knife — always break by hand.',
        duration: '30 seconds',
      },
      {
        step: 2,
        title: 'Create lather in hands',
        instruction: 'Wet hands. Work the soap between wet palms for 30-60 seconds to create a dark lather. Never apply raw soap directly to skin.',
        duration: '1 minute',
      },
      {
        step: 3,
        title: 'Cleanse face',
        instruction: 'Apply lather to damp face in gentle circular motions. Massage 30-60 seconds. Focus on T-zone and any acne-prone areas.',
        duration: '1 minute',
      },
      {
        step: 4,
        title: 'Rinse and pat dry',
        instruction: 'Rinse with lukewarm water, pat dry gently.',
        duration: '1 minute',
      },
      {
        step: 5,
        title: 'Moisturise immediately',
        instruction: 'Apply your moisturiser or shea butter within 60 seconds. Black soap can be drying if left un-moisturised.',
        duration: '2 minutes',
      },
    ],
    ingredients: ['Raw African black soap (ose dudu or alata samina)', 'Water'],
    frequency: '1x daily (build to 2x over time)',
    difficulty: 1,
    timeMinutes: 8,
    tags: ['black-soap', 'ose-dudu', 'cleanse', 'west-african', 'acne', 'pigmentation'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUTH ASIAN RITUALS
  // ═══════════════════════════════════════════════════════════════════════════

  ayurvedic_morning: {
    id: 'ayurvedic_morning',
    name: 'Ayurvedic Morning Skin Ritual',
    community: 'south-asian',
    category: 'morning',
    origin: 'Ancient India (Ayurveda)',
    description: 'Complete Ayurvedic morning skincare sequence for radiant, balanced skin. Dosha-aware approach.',
    culturalContext: 'Ayurveda (Sanskrit: science of life) is a 5,000-year-old holistic health system. Skin health is inseparable from inner health — diet, sleep, and digestion are all considered.',
    timing: 'Morning, before makeup',
    skinBenefits: ['balance', 'radiance', 'pore minimising', 'grounding', 'pitta cooling'],
    fitzpatrickBest: ['III', 'IV', 'V'],
    steps: [
      {
        step: 1,
        title: 'Splash with cool water (7 times)',
        instruction: 'The Ayurvedic tradition starts morning with 7 cool water splashes to the face — no cleanser. This is called "face bathing." Gently pat with a soft cloth.',
        duration: '2 minutes',
      },
      {
        step: 2,
        title: 'Facial oil massage (abhyanga)',
        instruction: 'Warm 3-4 drops of your dosha-specific oil between palms. Kapha skin: jojoba; Pitta skin: coconut; Vata skin: sesame or almond. Massage upward in circular motions for 3-5 minutes.',
        duration: '5 minutes',
      },
      {
        step: 3,
        title: 'Rose water spray (toning)',
        instruction: 'Mist face with pure rose water (or spray and pat in). This is the Ayurvedic toner — pure rosewater has been used for thousands of years.',
        duration: '1 minute',
      },
      {
        step: 4,
        title: 'Turmeric eye treatment',
        instruction: 'Mix one small pinch of turmeric with coconut oil. Apply sparingly around eye area. Leave 5 minutes. Rinse. (Do weekly, not daily.)',
        duration: '8 minutes (weekly step)',
      },
      {
        step: 5,
        title: 'Apply saffron moisturiser or kumkumadi oil',
        instruction: 'Finish with kumkumadi oil (traditional Ayurvedic face oil) or a saffron-infused cream. These are considered the most prestige Ayurvedic skin treatments.',
        duration: '2 minutes',
      },
    ],
    ingredients: [
      'Rose water (pure, food-grade)',
      'Dosha oil (coconut/jojoba/sesame based on skin type)',
      'Turmeric pinch',
      'Kumkumadi oil (optional)',
      'Saffron (optional)',
    ],
    frequency: 'Daily (full ritual); facial oil 2-3x per week',
    difficulty: 2,
    timeMinutes: 15,
    tags: ['ayurveda', 'morning', 'south-asian', 'dosha', 'rose-water', 'kumkumadi', 'oil'],
  },

  multani_mitti_mask: {
    id: 'multani_mitti_mask',
    name: 'Multani Mitti (Fuller\'s Earth) Mask',
    community: 'south-asian',
    category: 'mask',
    origin: 'Indian subcontinent (Punjab, Multan)',
    description: 'The legendary South Asian clay mask for oily skin, open pores, and brightening. Named after the city of Multan, Pakistan.',
    culturalContext: 'Multani mitti (literally "mud of Multan") has been used across the subcontinent for centuries in bathing rituals. Brides, wrestlers, and women across all communities use it.',
    timing: 'Weekly, evening',
    skinBenefits: ['oil control', 'pore minimising', 'brightening', 'cooling', 'acne', 'excess sebum'],
    fitzpatrickBest: ['III', 'IV', 'V'],
    steps: [
      {
        step: 1,
        title: 'Cleanse and steam',
        instruction: 'Cleanse face. Hold face over bowl of hot water or hot towel for 3-5 minutes to open pores.',
        duration: '8 minutes',
      },
      {
        step: 2,
        title: 'Mix the mask',
        instruction: 'In a ceramic or glass bowl, mix 2 tablespoons multani mitti with 1-2 tablespoons rose water. For dry skin: add 1 teaspoon honey or yogurt. Mix to smooth paste.',
        duration: '2 minutes',
      },
      {
        step: 3,
        title: 'Apply mask',
        instruction: 'Apply evenly over face avoiding eye area. Apply thicker on oily zones (forehead, nose, chin).',
        duration: '2 minutes',
      },
      {
        step: 4,
        title: 'Wait for semi-dry',
        instruction: 'Leave until mask is dry at edges but still slightly damp in centre. Do NOT wait for fully dry — this over-strips skin. 10-12 minutes maximum.',
        duration: '12 minutes',
      },
      {
        step: 5,
        title: 'Rinse gently',
        instruction: 'Rinse off with lukewarm water, massaging gently as you do. Pat dry.',
        duration: '3 minutes',
      },
      {
        step: 6,
        title: 'Tone and moisturise',
        instruction: 'Apply rose water immediately, then moisturise. Multani mitti is very absorbent — skin needs moisture after.',
        duration: '2 minutes',
      },
    ],
    ingredients: ['Multani mitti (fuller\'s earth clay)', 'Rose water', 'Optional: honey / yogurt / neem powder'],
    frequency: 'Weekly (or 2x per week for oily skin)',
    difficulty: 1,
    timeMinutes: 30,
    tags: ['multani-mitti', 'clay-mask', 'south-asian', 'oily-skin', 'pores', 'brightening', 'DIY'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ARAB / MIDDLE EASTERN RITUALS
  // ═══════════════════════════════════════════════════════════════════════════

  hammam_ritual: {
    id: 'hammam_ritual',
    name: 'Hammam Skin Ritual',
    community: 'arab',
    category: 'steam',
    origin: 'Arab World, Türkiye, North Africa',
    description: 'The ancient public bathhouse ritual (hammam) adapted for home use. Steam, kessa mitt exfoliation, and black soap cleanse.',
    culturalContext: 'The hammam (Arabic: warm bath) has been central to Arab culture since the Islamic Golden Age. Social gatherings, bridal preparation, and weekly purification rituals happen here.',
    timing: 'Weekly, evening',
    skinBenefits: ['deep cleansing', 'exfoliation', 'circulation', 'detox', 'baby-smooth skin'],
    fitzpatrickBest: ['III', 'IV', 'V'],
    steps: [
      {
        step: 1,
        title: 'Prepare steam',
        instruction: 'Run a very hot shower for 5 minutes with bathroom door closed. Sit in steam for 5-10 minutes without water directly on skin. Alternatively, run a hot bath.',
        duration: '15 minutes',
      },
      {
        step: 2,
        title: 'Apply black soap (kessa)',
        instruction: 'Apply Moroccan black soap (beldi soap / savon beldi) all over body. Leave 5 minutes to soften skin.',
        duration: '8 minutes',
      },
      {
        step: 3,
        title: 'Kessa mitt exfoliation',
        instruction: 'Using a kessa mitt (traditional hammam glove), scrub skin in long strokes from limbs toward heart. Work all over body — rolls of dead skin will come off.',
        duration: '10-15 minutes',
      },
      {
        step: 4,
        title: 'Rinse',
        instruction: 'Rinse thoroughly with warm water.',
        duration: '5 minutes',
      },
      {
        step: 5,
        title: 'Rassoul clay mask (optional)',
        instruction: 'Mix rassoul clay with rose water to paste. Apply over body. Wait 10 minutes. Rinse. Rassoul is the traditional Moroccan mineral clay used in hammams.',
        duration: '15 minutes',
      },
      {
        step: 6,
        title: 'Seal with argan oil',
        instruction: 'Pat skin dry. Immediately apply argan oil to damp skin all over body. In Morocco, argan oil is the post-hammam seal.',
        duration: '5 minutes',
      },
    ],
    ingredients: [
      'Moroccan black soap (beldi soap)',
      'Kessa mitt (hammam glove)',
      'Rassoul clay (optional)',
      'Rose water',
      'Argan oil',
    ],
    frequency: 'Weekly',
    difficulty: 2,
    timeMinutes: 60,
    tags: ['hammam', 'arab', 'moroccan', 'steam', 'exfoliation', 'kessa', 'argan', 'rassoul', 'beldi'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EAST ASIAN RITUALS
  // ═══════════════════════════════════════════════════════════════════════════

  k_beauty_double_cleanse: {
    id: 'k_beauty_double_cleanse',
    name: 'K-Beauty Double Cleanse',
    community: 'east-asian',
    category: 'cleanse',
    origin: 'South Korea',
    description: 'The foundational Korean skincare routine — two-step cleansing: oil first, water-based second. The base of all K-beauty.',
    culturalContext: 'Korean beauty (K-beauty) has revolutionised global skincare. The double cleanse became famous globally through K-beauty influencers and brands in the 2010s.',
    timing: 'Evening (every night)',
    skinBenefits: ['remove all impurities', 'remove sunscreen', 'balanced skin', 'prep for actives', 'prevent breakouts'],
    fitzpatrickBest: ['I', 'II', 'III', 'IV'],
    steps: [
      {
        step: 1,
        title: 'Step 1: Oil cleanser',
        instruction: 'Dry hands, dry face. Apply 1-2 pumps oil cleanser to face. Massage in circular motions for 60 seconds — it emulsifies sunscreen and makeup. Add a small amount of water, massage 20 more seconds, then rinse.',
        duration: '2 minutes',
      },
      {
        step: 2,
        title: 'Step 2: Water-based cleanser',
        instruction: 'Apply a foaming or gel cleanser to damp face. Lather and massage 60 seconds. Focus on T-zone and any congested areas.',
        duration: '2 minutes',
      },
      {
        step: 3,
        title: 'Pat dry (not rub)',
        instruction: 'Gently pat dry with a soft microfibre cloth. Never rub — causes friction and microtears.',
        duration: '30 seconds',
      },
      {
        step: 4,
        title: '3-second toner rule',
        instruction: 'Within 3 seconds of drying: apply your hydrating toner (using the patting technique: 5-7 gentle pats to the face, no cotton). This locks in moisture.',
        duration: '1 minute',
      },
    ],
    ingredients: [
      'Oil cleanser (balm or liquid)',
      'Water-based cleanser (foam or gel)',
      'Hydrating toner',
    ],
    frequency: 'Every evening',
    difficulty: 1,
    timeMinutes: 8,
    tags: ['k-beauty', 'double-cleanse', 'korean', 'east-asian', 'routine', 'cleansing', 'evening'],
  },

  gua_sha_ritual: {
    id: 'gua_sha_ritual',
    name: 'Gua Sha Facial Ritual',
    community: 'east-asian',
    category: 'massage',
    origin: 'China (Traditional Chinese Medicine)',
    description: 'Traditional Chinese scraping massage technique adapted for the face. Improves circulation, lymphatic drainage, and facial contour.',
    culturalContext: 'Gua sha (刮痧, "scraping") is an ancient TCM healing technique. In China, gua sha tools made of jade, rose quartz, or bian stone have been used for both body and face for centuries.',
    timing: 'Morning or evening, after moisturiser',
    skinBenefits: ['lymphatic drainage', 'depuffing', 'circulation', 'contouring', 'tension relief', 'glow'],
    fitzpatrickBest: ['all'],
    steps: [
      {
        step: 1,
        title: 'Cleanse and apply face oil',
        instruction: 'Cleanse face. Apply a generous layer of facial oil — the gua sha tool needs to glide without friction. Too little oil = skin pulling = broken capillaries.',
        duration: '3 minutes',
      },
      {
        step: 2,
        title: 'Start at neck',
        instruction: 'Hold tool at 30-45 degree angle to skin. Stroke upward from collarbone to chin — 5 strokes on each side. Always move upward and outward, never downward.',
        duration: '1 minute',
      },
      {
        step: 3,
        title: 'Jaw and lower face',
        instruction: 'Start at chin centre, stroke outward along jawline to ear — 5 times per side. This is the main depuffing step for jaw tension.',
        duration: '2 minutes',
      },
      {
        step: 4,
        title: 'Cheeks',
        instruction: 'Start at side of nose, stroke outward toward ear along cheekbone — 5 times per side.',
        duration: '2 minutes',
      },
      {
        step: 5,
        title: 'Under-eye area',
        instruction: 'Use the curved edge of the gua sha tool. VERY gentle strokes from inner corner outward. 3 strokes per side maximum — this area is very delicate.',
        duration: '1 minute',
      },
      {
        step: 6,
        title: 'Forehead',
        instruction: 'Start at brows, stroke upward toward hairline. 5 times per section, moving from centre outward.',
        duration: '2 minutes',
      },
      {
        step: 7,
        title: 'Third strokes: lymph nodes',
        instruction: 'Finish with 3 slow strokes down the sides of the neck to push lymph fluid toward drainage nodes at collarbone.',
        duration: '1 minute',
      },
    ],
    ingredients: ['Gua sha tool (jade, rose quartz, or bian stone)', 'Facial oil (rosehip, marula, or face oil blend)'],
    frequency: '3-5 times per week',
    difficulty: 3,
    timeMinutes: 15,
    tags: ['gua-sha', 'east-asian', 'chinese', 'facial-massage', 'lymphatic', 'depuffing', 'contouring'],
  },

  rice_water_rinse: {
    id: 'rice_water_rinse',
    name: 'Rice Water Skin & Hair Rinse',
    community: 'east-asian',
    category: 'mask',
    origin: 'Japan, China, South Korea',
    description: 'Fermented rice water — the ancient Japanese and Korean beauty secret for luminous skin and glossy hair.',
    culturalContext: 'The Yao women of Huangluo village in China are famous for their hair — up to 6 feet long, mostly black, into their 80s. Their secret: fermented rice water. Japanese Geisha used rice water to cleanse and whiten skin.',
    timing: 'Morning or evening skincare step',
    skinBenefits: ['brightening', 'hydrating', 'pore minimising', 'anti-ageing', 'smooth texture'],
    fitzpatrickBest: ['I', 'II', 'III', 'IV'],
    steps: [
      {
        step: 1,
        title: 'Make rice water',
        instruction: 'Rinse 1 cup white rice, then add to 2 cups water. Soak 30 minutes (or overnight for fermentation). Strain liquid into a clean bottle.',
        duration: '35 minutes (or overnight)',
      },
      {
        step: 2,
        title: 'Ferment (optional but better)',
        instruction: 'Leave rice water at room temperature for 24-48 hours until it smells slightly sour. Fermentation increases inositol content — the active brightening compound.',
        duration: '24-48 hours',
      },
      {
        step: 3,
        title: 'Apply as toner',
        instruction: 'After cleansing, soak a cotton pad in rice water. Gently wipe over face in upward strokes. Or pour into palm and pat onto face.',
        duration: '2 minutes',
      },
      {
        step: 4,
        title: 'For hair: rinse',
        instruction: 'After shampooing, pour rice water over hair, work into scalp. Leave 5-20 minutes. Rinse with cold water.',
        duration: '20 minutes',
      },
    ],
    ingredients: ['White rice (1 cup)', 'Water (2 cups)'],
    frequency: 'Daily (skin); weekly (hair)',
    difficulty: 1,
    timeMinutes: 5,
    tags: ['rice-water', 'east-asian', 'japanese', 'korean', 'brightening', 'DIY', 'hair', 'fermented'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CARIBBEAN RITUALS
  // ═══════════════════════════════════════════════════════════════════════════

  coconut_oil_ritual: {
    id: 'coconut_oil_ritual',
    name: 'Caribbean Coconut Oil Body Ritual',
    community: 'caribbean',
    category: 'oil',
    origin: 'Caribbean Islands (Jamaica, Trinidad, Barbados)',
    description: 'The Caribbean tradition of coconut oil head-to-toe — the island all-in-one beauty product.',
    culturalContext: 'Across the Caribbean, coconut oil (coprah oil locally) has been made and used for centuries. Jamaican grandmothers apply it to skin, scalp, and hair in a unified ritual.',
    timing: 'After shower or bath',
    skinBenefits: ['moisturising', 'softening', 'shine', 'protective', 'natural sunscreen (SPF4)'],
    fitzpatrickBest: ['III', 'IV', 'V', 'VI'],
    steps: [
      {
        step: 1,
        title: 'Choose virgin coconut oil',
        instruction: 'Use only cold-pressed, virgin (or extra-virgin) coconut oil. Must smell like coconut — processed coconut oil is odourless and less effective.',
        duration: '(shopping step)',
      },
      {
        step: 2,
        title: 'Melt in palms',
        instruction: 'Scoop a tablespoon and melt between palms. Coconut oil is solid below 24°C (76°F) and liquid above. The warmth of hands melts it quickly.',
        duration: '30 seconds',
      },
      {
        step: 3,
        title: 'Apply to body',
        instruction: 'While skin is still damp from shower, massage coconut oil all over in circular motions. Focus on legs, arms, and torso.',
        duration: '5 minutes',
      },
      {
        step: 4,
        title: 'Scale, heels, and hair',
        instruction: 'Extra attention to heels, elbows, and knees. A small amount on the hair (focusing mid-length to ends) adds shine.',
        duration: '2 minutes',
      },
    ],
    ingredients: ['Virgin cold-pressed coconut oil'],
    frequency: 'Daily or every other day',
    difficulty: 1,
    timeMinutes: 8,
    notes: 'Coconut oil is comedogenic (comedogenic rating 4) — do not use on acne-prone face.',
    tags: ['coconut-oil', 'caribbean', 'jamaican', 'body', 'moisturising', 'DIY', 'natural'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EAST AFRICAN RITUALS
  // ═══════════════════════════════════════════════════════════════════════════

  teff_honey_mask: {
    id: 'teff_honey_mask',
    name: 'Ethiopian Teff & Honey Mask',
    community: 'east-african',
    category: 'mask',
    origin: 'Ethiopia',
    description: 'Ethiopian beauty ritual using teff flour and wild honey for deep nourishment and brightening. Ethiopia is the origin of teff — the ancient grain.',
    culturalContext: 'Ethiopian women have used natural grain and honey masks for centuries. Ethiopia produces some of the finest raw honey in the world — used both medicinally and for beauty.',
    timing: 'Weekly, evening',
    skinBenefits: ['brightening', 'anti-bacterial', 'nourishing', 'gentle exfoliation', 'soothing'],
    fitzpatrickBest: ['IV', 'V', 'VI'],
    steps: [
      {
        step: 1,
        title: 'Mix mask',
        instruction: 'Combine 1 tablespoon teff flour, 1 tablespoon raw honey, and 1 teaspoon warm water. Mix to a smooth paste.',
        duration: '2 minutes',
      },
      {
        step: 2,
        title: 'Cleanse face',
        instruction: 'Cleanse and pat dry before applying mask.',
        duration: '3 minutes',
      },
      {
        step: 3,
        title: 'Apply mask',
        instruction: 'Apply evenly over face and neck. Avoid eye area.',
        duration: '2 minutes',
      },
      {
        step: 4,
        title: 'Leave 15-20 minutes',
        instruction: 'Relax. The honey activates its anti-bacterial properties while teff gently exfoliates.',
        duration: '20 minutes',
      },
      {
        step: 5,
        title: 'Rinse with warm water',
        instruction: 'Rinse gently, massaging in small circles as you do to activate the exfoliation.',
        duration: '3 minutes',
      },
    ],
    ingredients: ['Teff flour (1 tablespoon)', 'Raw honey (1 tablespoon)', 'Warm water'],
    frequency: 'Weekly',
    difficulty: 1,
    timeMinutes: 30,
    tags: ['teff', 'honey', 'east-african', 'ethiopian', 'mask', 'natural', 'DIY', 'brightening'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUTH AFRICAN RITUALS
  // ═══════════════════════════════════════════════════════════════════════════

  rooibos_skin_ritual: {
    id: 'rooibos_skin_ritual',
    name: 'Rooibos Antioxidant Skin Ritual',
    community: 'south-african',
    category: 'mask',
    origin: 'South Africa (Cederberg region)',
    description: 'Rooibos (Aspalathus linearis) is native to the Western Cape and has been used by indigenous Khoisan people for centuries. Rich in antioxidants and alpha hydroxy acids.',
    culturalContext: 'Rooibos is uniquely South African — it grows nowhere else on Earth. The Khoisan people brewed and drank it long before European settlers arrived and called it "red bush."',
    timing: 'Morning or evening',
    skinBenefits: ['anti-oxidant', 'anti-inflammatory', 'anti-ageing', 'brightening', 'redness reduction', 'eczema relief'],
    fitzpatrickBest: ['all'],
    steps: [
      {
        step: 1,
        title: 'Brew strong rooibos',
        instruction: 'Steep 3-4 rooibos tea bags in 250ml boiling water for 10 minutes. Allow to cool completely.',
        duration: '15 minutes',
      },
      {
        step: 2,
        title: 'As toner',
        instruction: 'Strain and pour into spray bottle. Spritz on face after cleansing as toner, or apply with cotton pad. Leave on — don\'t rinse.',
        duration: '2 minutes',
      },
      {
        step: 3,
        title: 'As mask (weekly)',
        instruction: 'Mix cooled rooibos tea with bentonite clay or kaolin clay to make a mask paste. Apply, wait 15 minutes, rinse.',
        duration: '20 minutes',
      },
      {
        step: 4,
        title: 'As eye compress',
        instruction: 'Soak cotton pads in cooled rooibos. Place over closed eyes for 10 minutes. Reduces puffiness and dark circles.',
        duration: '10 minutes',
      },
    ],
    ingredients: ['Rooibos tea bags', 'Water', 'Optional: kaolin clay (for mask)'],
    frequency: 'Daily (toner); weekly (mask)',
    difficulty: 1,
    timeMinutes: 20,
    tags: ['rooibos', 'south-african', 'antioxidant', 'toner', 'mask', 'natural', 'DIY'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LATINA RITUALS
  // ═══════════════════════════════════════════════════════════════════════════

  aloe_vera_fresh: {
    id: 'aloe_vera_fresh',
    name: 'Fresh Aloe Vera Skin Ritual',
    community: 'latina',
    category: 'mask',
    origin: 'Mexico, Caribbean, Central America',
    description: 'Using fresh aloe vera gel (sabila) straight from the plant — a generational beauty secret across Latin American cultures.',
    culturalContext: 'Abuela\'s aloe plant. Every Latin household has one. Sabila (aloe vera) gel is used for sunburns, acne, hair, and daily face gel. "¿Te arde? Sábila." (Does it burn? Aloe.)',
    timing: 'Morning (cooling), or after sun',
    skinBenefits: ['hydrating', 'soothing', 'anti-inflammatory', 'healing', 'sun calming', 'acne'],
    fitzpatrickBest: ['III', 'IV', 'V'],
    steps: [
      {
        step: 1,
        title: 'Cut aloe leaf',
        instruction: 'Cut a thick aloe vera leaf from the plant. Stand it upright for 10 minutes to drain the yellow resin (aloin) — this is irritating to skin.',
        duration: '10 minutes',
      },
      {
        step: 2,
        title: 'Extract fresh gel',
        instruction: 'Rinse leaf. Cut off the thorny edges. Slice open and scoop out the clear inner gel with a spoon into a clean bowl.',
        duration: '3 minutes',
      },
      {
        step: 3,
        title: 'Apply to skin',
        instruction: 'Apply fresh aloe gel directly to clean face. Layer generously. Let absorb 10-20 minutes. Can also be used on scalp and hair.',
        duration: '20 minutes',
      },
      {
        step: 4,
        title: 'Rinse or leave',
        instruction: 'Rinse off for use as a mask, or leave as a light gel moisturiser under other products.',
        duration: '2 minutes',
      },
    ],
    ingredients: ['Fresh aloe vera leaf (or high-quality 100% gel)'],
    frequency: 'Daily or as needed (sunburn, irritation)',
    difficulty: 1,
    timeMinutes: 35,
    tags: ['aloe-vera', 'sabila', 'latina', 'natural', 'soothing', 'DIY', 'healing'],
  },

};

// ─── QUERY FUNCTIONS ─────────────────────────────────────────────────────────

/**
 * Get ritual by ID
 * @param {string} id
 * @returns {Object|null}
 */
export function getRitual(id) {
  return SKIN_RITUALS[id] || null;
}

/**
 * Get rituals for a community
 * @param {string} communityId
 * @returns {Object[]}
 */
export function getRitualsForCommunity(communityId) {
  return Object.values(SKIN_RITUALS).filter(r =>
    r.community === communityId || r.community === 'all'
  );
}

/**
 * Get rituals by category
 * @param {string} category
 * @returns {Object[]}
 */
export function getRitualsByCategory(category) {
  return Object.values(SKIN_RITUALS).filter(r => r.category === category);
}

/**
 * Get all traditional/cultural rituals
 * @returns {Object[]}
 */
export function getTraditionalRituals() {
  return Object.values(SKIN_RITUALS).filter(r => r.culturalContext);
}

/**
 * Get rituals by skin benefit
 * @param {string} benefit
 * @returns {Object[]}
 */
export function getRitualsByBenefit(benefit) {
  const norm = benefit.toLowerCase();
  return Object.values(SKIN_RITUALS).filter(r =>
    (r.skinBenefits || []).some(b => b.toLowerCase().includes(norm))
  );
}

/**
 * Get rituals suitable for Fitzpatrick level
 * @param {string} fitzpatrick
 * @returns {Object[]}
 */
export function getRitualsForFitzpatrick(fitzpatrick) {
  return Object.values(SKIN_RITUALS).filter(r =>
    (r.fitzpatrickBest || []).includes(fitzpatrick) || (r.fitzpatrickBest || []).includes('all')
  );
}

/**
 * Get beginner rituals (difficulty 1)
 * @returns {Object[]}
 */
export function getBeginnerRituals() {
  return Object.values(SKIN_RITUALS).filter(r => r.difficulty === 1);
}

/**
 * Get quick rituals (under 20 minutes)
 * @returns {Object[]}
 */
export function getQuickRituals() {
  return Object.values(SKIN_RITUALS).filter(r => r.timeMinutes <= 20);
}

/**
 * Get rituals by tag
 * @param {string} tag
 * @returns {Object[]}
 */
export function searchRitualsByTag(tag) {
  const norm = tag.toLowerCase();
  return Object.values(SKIN_RITUALS).filter(r =>
    (r.tags || []).some(t => t.includes(norm))
  );
}

// ─── STATS ───────────────────────────────────────────────────────────────────

export const SKIN_RITUAL_STATS = {
  total: Object.keys(SKIN_RITUALS).length,
  communities: [...new Set(Object.values(SKIN_RITUALS).map(r => r.community))],
  categories: [...new Set(Object.values(SKIN_RITUALS).map(r => r.category))],
  diyFriendly: Object.values(SKIN_RITUALS).filter(r => r.difficulty <= 2).length,
  averageTime: Math.round(
    Object.values(SKIN_RITUALS).reduce((sum, r) => sum + r.timeMinutes, 0) /
    Object.keys(SKIN_RITUALS).length
  ),
};

