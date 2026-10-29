/**
 * MIRRR Hair Colouring Guide for Ethnic Hair
 * Bleaching, dyeing, toning, and colour care for all hair types and textures
 * Special focus on Type 3-4 hair, dark hair, and protective colouring practices
 */

// ─── THE SCIENCE OF HAIR COLOUR ───────────────────────────────────────────────

export const HAIR_COLOUR_SCIENCE = {
  how_hair_gets_its_colour: {
    melanin: 'Hair colour is determined by two types of melanin produced by melanocytes in the hair follicle: eumelanin (brown/black) and phaeomelanin (red/yellow). The ratio and total amount determine your natural colour.',
    eumelanin: 'Produces brown to black shades. Higher concentrations = darker hair. People with predominantly eumelanin tend to have hair that stays dark even as it lightens, because eumelanin releases colour more stubbornly.',
    phaeomelanin: 'Produces red and yellow tones. When hair is bleached, phaeomelanin is revealed as the warmer, underlying pigment — this is why lightening dark hair goes through orange/red stages before reaching yellow and then white.',
    grey_hair: 'Grey hair occurs when melanocytes stop producing melanin. The hair itself is still there, the colour production has stopped. Eventually, the melanocytes die — causing white hair.',
  },

  underlying_pigment_stages: {
    what: 'When lifting (lightening) dark hair, the hair passes through predictable warm tone stages as the eumelanin is removed. Understanding these stages prevents colour disasters.',
    stages: [
      { stage: 'Natural dark', description: 'Black or very dark brown — natural melanin at its most concentrated' },
      { stage: 'Brown-red', description: 'First stage of lightening — deep warm red-brown' },
      { stage: 'Red', description: 'True red-orange — the dominant phaeomelanin begins showing' },
      { stage: 'Red-orange', description: 'Mid-stage — warm, fiery' },
      { stage: 'Orange', description: 'Pure orange — still very warm' },
      { stage: 'Orange-yellow', description: 'Approaching yellow — mostly phaeomelanin removed' },
      { stage: 'Yellow', description: 'Pale yellow — most melanin lifted' },
      { stage: 'Pale yellow', description: 'Canary yellow — almost fully lifted' },
      { stage: 'Almost white', description: 'Barely any pigment left — required for pure pastels, white, silver' },
    ],
    for_ethnic_hair: 'Black and dark brown hair of all ethnicities (Type 1 through Type 4) all pass through these same warm stages. However, Type 4 hair and very densely pigmented hair may take longer to lift and may reach an orange stage much harder to get past without significant damage risk.',
  },

  how_hair_dye_works: {
    temporary: 'Coat the outside of the hair shaft — no chemical reaction. Wash out in 1-2 shampoos. No ammonia, no developer.',
    semi_permanent: 'Penetrate slightly into the hair shaft via small molecules. No developer (usually). Fade over 6-12 shampoos. Contain some longer-lasting colour molecules.',
    demi_permanent: 'Penetrate into the hair shaft with a low-volume developer (6-10 volume). Deposit colour only — cannot lift. Last 12-20+ shampoos. Excellent for tone correction on ethnic hair.',
    permanent: 'Open the hair cuticle (ammonia or its alternatives), deposit colour molecules that react with peroxide (developer) and oxidise into permanent colour molecules inside the cortex. Lasts until grown out or removed.',
    bleach: 'Oxidative agent (hydrogen peroxide + powder bleach) that oxidises and removes melanin from inside the hair shaft. Creates lightening WITHOUT depositing colour. Must be followed by toner for desired colour.',
  },
};

// ─── BLEACHING ETHNIC AND DARK HAIR ──────────────────────────────────────────

export const BLEACHING_GUIDE = {
  the_challenge: 'Bleaching dark, coily, or Type 4 hair carries significant risks that are often underestimated. Dark melanin is harder to lift; Type 4 hair has more points of weakness (helical twists), thinner cuticle walls, and less moisture than straight hair — making it far more susceptible to breakage during the bleaching process.',

  risk_assessment: {
    fitzpatrick_and_hair_type_intersection: 'Darker skin tones often (not always) correlate with Type 3-4 hair. Both the hair properties AND the person\'s skin type should factor into colouring decisions.',
    high_risk_characteristics: [
      'Type 4 coily hair — most fragile structure',
      'Previously relaxed or permed hair — chemically compromised',
      'Heat-damaged hair — compromised cuticle',
      'Thin or fine hair (fine strands are more vulnerable than coarse strands regardless of texture)',
      'Already dry or brittle hair — low moisture hair breaks more easily',
      'More than 2 inches of new growth (bleach must not overlap previous bleach)',
    ],
    lower_risk_characteristics: [
      'Virgin (never chemically treated) dark brown or black hair',
      'Type 1-2 straight dark hair — more resistant structure',
      'Healthy, moisturised, protein-balanced hair',
      'Coarse hair strands — coarser individual strands are actually stronger',
    ],
  },

  developer_strengths: {
    what: 'Developer (hydrogen peroxide) volume determines how much the cuticle is opened and how much lifting occurs.',
    volumes: [
      { volume: '10 Vol (3%)', lifts: '1 level', use: 'Toning only, no real lift. Gentle.' },
      { volume: '20 Vol (6%)', lifts: '1-2 levels', use: 'Standard colour deposit. Safe for fragile hair.' },
      { volume: '30 Vol (9%)', lifts: '2-3 levels', use: 'Standard lightening. Not recommended for Type 4 hair.' },
      { volume: '40 Vol (12%)', lifts: '3-4 levels', use: 'Maximum lift. High damage risk. NOT for Type 4 hair at home.' },
    ],
    for_type_4: 'For Type 4 hair, many experienced colorists use 20 Vol developer with bleach instead of 30-40 Vol — accepting slower, more lift sessions in exchange for significantly less damage.',
  },

  powder_bleach_selection: {
    note: 'Not all bleach powders are equal. Bleach powder + developer make the bleaching mixture. Premium powders have more conditioning additives, less ammonia irritation, and are gentler on fragile hair.',
    recommendations: [
      { product: 'Schwarzkopf BlondMe Bleach', note: 'Bond-building technology built in, gentle on ethnic hair, salon quality' },
      { product: 'Olaplex No. 1 Bond Multiplier', note: 'Added to ANY bleach mix to significantly reduce breakage — non-negotiable for Type 4 lightening' },
      { product: 'Kenra Platinum Silkening Bleach', note: 'Contains conditioning agents, lower dust, gentler formula' },
    ],
    bond_building: 'Olaplex or K18 treatment in the bleach mixture is considered essential by most experienced colorists working with Type 3-4 hair. These rebuild broken disulfide bonds during the lightening process, significantly reducing breakage.',
  },

  application_tips: {
    sectioning: 'Always section into 4 quadrants. Work in small, thin sections (under 1/4 inch). Even application is critical.',
    starts_at_ends: 'Apply to mid-lengths and ends FIRST, then roots last (roots process faster due to body heat).',
    processing_time: 'Check every 10-15 minutes by wiping a small section. Type 4 hair — remove bleach at 30-45 minutes maximum to avoid breakage, even if not at goal colour. Better to do multiple sessions than overshoot.',
    never_overlap: 'NEVER apply bleach on top of previously bleached hair. This is how breakage happens. Bleach only the new growth, precisely.',
  },

  bleach_on_type_4_reality_check: {
    reality: 'Going platinum or very light blonde in one session on Type 4 hair is almost impossible without catastrophic damage. Professionals with expertise in Type 4 hair typically recommend:',
    approach: [
      'Start with face-framing pieces or limited highlights rather than full-head bleach',
      'Target 2-3 levels of lift per session maximum',
      'Allow 6-8 weeks between bleach sessions for recovery',
      'Deep condition intensively between sessions',
      'Protein treatment 2 weeks before bleaching to strengthen',
      'Moisture treatment week before to ensure hair is hydrated',
    ],
    when_to_walk_away: 'If hair is already breaking, producing "gummy" texture when wet (sign of severe bond damage), or very short from previous breakage — do NOT bleach. Recover first.',
  },
};

// ─── HAIR COLOUR OPTIONS FOR DARK HAIR ───────────────────────────────────────

export const COLOUR_OPTIONS_DARK_HAIR = {
  without_bleaching: {
    what: 'Many beautiful colour options do not require bleaching — making them much safer for all hair types including Type 3-4',
    options: [
      {
        technique: 'Gloss/glaze',
        description: 'A clear or coloured demi-permanent treatment that adds shine and subtle tone. Excellent for refreshing natural dark hair colour, adding warmth or cool tones, correcting brassy colour.',
        best_for: 'All hair types. Particularly beneficial for Type 4 hair — adds moisture and shine.',
        result: 'Subtle but beautiful — enriched version of your natural colour or a slight shift',
      },
      {
        technique: 'Tint darker',
        description: 'Going darker is always possible without bleach. Adding depth, richness, and dimension to dark hair.',
        best_for: 'Anyone wanting to enrich their natural colour or go darker',
        result: 'Richer, deeper version of natural colour — can add purple-black, blue-black, warm dark brown, cool ash brown',
      },
      {
        technique: 'Vivid direct dyes on dark hair',
        description: 'Semi-permanent vivid colour (pink, blue, purple, green, teal) can show as a subtle "sheen" on unbleached dark hair in sunlight. Not visible in low light, but adds a beautiful dimension.',
        best_for: 'Those who want a hint of colour without commitment or damage',
        note: 'How much shows depends on the depth of natural hair — very dark hair may show almost nothing; medium dark brown may show a beautiful depth shift',
      },
      {
        technique: 'Henna',
        description: 'Natural plant-based dye that colours dark hair with reddish, auburn, or copper tones. Cannot lighten — only adds warm colour on top.',
        caution: 'Henna coats the hair shaft permanently. It cannot be easily removed and will interfere with future chemical processing. Pure henna (Lawsonia inermis) is safe; "black henna" contains PPD and is dangerous.',
        best_for: 'Those who want permanent warm red/copper tones without chemicals',
      },
    ],
  },

  with_limited_bleaching: {
    highlights: {
      description: 'Thin sections of hair lightened to create dimension and brightness without all-over colour',
      types: [
        { technique: 'Balayage', description: 'Hand-painted highlights, freehand applied. Grows out more naturally. Less harsh demarcation line.' },
        { technique: 'Foil highlights', description: 'Precise sections wrapped in foil for even lift. More controlled, brighter.' },
        { technique: 'Babylights', description: 'Very fine, scattered highlights that mimic natural sun-lightened hair' },
      ],
      for_type_4: 'Highlights on Type 4 hair should be done in the flat-ironed state for easier access to sections, or on stretched hair. Braided highlights (adding colour to individual braids or locs) is a low-damage alternative.',
    },
    ombre: {
      description: 'Darker roots graduating to lighter ends — a very wearable technique for dark hair because the dark root is intentional and grows out gracefully',
      for_type_4: 'Ombre on natural Type 4 hair can look stunning — the texture itself adds dimension. The challenge is getting even lift across dense coily hair sections.',
    },
    chunky_highlights: {
      description: 'Bolder, more visible highlight sections — more of a statement',
      heritage_context: 'Bold highlighting with chunky sections is a recurring trend that has been prominent in South Asian, Caribbean, and Black American beauty communities — often with warm tones',
    },
  },
};

// ─── VIVID AND FASHION COLOURS ON DARK HAIR ───────────────────────────────────

export const VIVID_COLOURS = {
  the_truth: 'Getting vivid fashion colours (true blue, pink, purple, green, teal, orange) on dark hair requires pre-lightening to at least yellow, often pale yellow, for the colours to appear as intended.',

  colour_results_by_lift_level: [
    { underlying: 'Red/dark orange', achievable: 'Red, burgundy, copper, auburn (with appropriate colour)' },
    { underlying: 'Orange', achievable: 'Warm red, copper-orange, some browns' },
    { underlying: 'Yellow-orange', achievable: 'Golden blonde, warm copper, orange tones' },
    { underlying: 'Yellow', achievable: 'Golden blonde, warm tones, some muted versions of vivid colours' },
    { underlying: 'Pale yellow', achievable: 'Most fashion/vivid colours, cooler blondes' },
    { underlying: 'Almost white', achievable: 'True pastels, white, silver, icy blonde, any vivid colour at full intensity' },
  ],

  products_for_vivid_colour: {
    brands: [
      { brand: 'Arctic Fox', note: 'Vegan, conditions as it colours, fades gracefully, no developer needed. Great for Type 3-4 hair.' },
      { brand: 'Manic Panic', note: 'The original vivid colour brand. Wide colour range. Conditioning formula.' },
      { brand: 'Pravana ChromaSilk Vivids', note: 'Professional-quality vivid colour, very bold, long-lasting' },
      { brand: 'Overtone', note: 'Conditioning colour treatment — vivid and natural shades in a deep conditioning base. Adds colour AND moisture.' },
      { brand: 'oVertone for textured hair', note: 'Specifically formulated for textured/coily hair — the deep conditioning formula is excellent for Type 4' },
    ],
    application_for_type_4: 'Apply vivid direct dye to dry, detangled hair. Section in four quadrants. Apply with gloved hands or a colour brush. Let process 30-60 minutes (longer = more intense/longer-lasting). Do not use heat unless the product specifically directs it.',
  },

  maintaining_vivid_colour: [
    'Wash with cold water — hot water opens the cuticle and causes faster fading',
    'Use colour-safe, sulphate-free shampoo',
    'Refresh colour with a colour-depositing conditioner between dye sessions',
    'Keep hair moisturised — dry hair causes faster fading',
    'UV protection — sun fades vivid colour rapidly',
    'Expect to re-dye every 4-8 weeks for bold vivid colour',
  ],
};

// ─── TONING ───────────────────────────────────────────────────────────────────

export const TONING_GUIDE = {
  what: 'Toning adds or neutralises colour after bleaching. After lifting, hair almost always has unwanted warm (brassy/orange/yellow) tones that a toner neutralises or shifts.',

  colour_wheel_neutralisation: {
    purple_neutralises: 'Yellow and pale yellow tones — purple toner = ash blonde, cool blonde, silver',
    blue_neutralises: 'Orange tones — blue or blue-violet toner = cool brown, ash, neutralised orange',
    green_neutralises: 'Red tones — rarely used as toning; more of a corrective situation',
  },

  toning_for_dark_hair_lifted_to_orange: {
    challenge: 'Most dark hair lifts to some version of orange or yellow-orange. Going from orange directly to blonde in one session often isn\'t possible without damage. Blue-based toner can help neutralise the orange, but the result is more of a cool brown or muted colour rather than true blonde.',
    options: [
      'Accept a warm golden or honey colour and work with it — often very beautiful on warmer skin tones',
      'Apply a blue-based toner to neutralise and shift to a cooler brown',
      'Go for copper or auburn — embrace the underlying warmth as an intentional colour',
      'Do a second lightening session after recovery and tone to desired colour then',
    ],
  },

  purple_shampoo_and_conditioner: {
    what: 'Violet/purple-pigmented shampoo and conditioner for maintaining cool, ash, or blonde tones',
    for_ethnic_skin: 'Purple shampoo is designed for blonde hair. It is NOT a treatment for dark hair or for adding purple tones to dark hair. It tones only lightened hair.',
    usage: 'Apply to wet hair 1x per week (or more for brassy hair). Leave 3-5 minutes. Rinse. Overuse turns hair purple/grey — lighten leave-in time if this happens.',
    recommendations: ['Shimmer Lights (professional, very toning)', 'Redken Color Extend Blondage', 'Fanola No Yellow (very purple, powerful)'],
  },
};

// ─── COLOUR CARE FOR ETHNIC HAIR ─────────────────────────────────────────────

export const COLOUR_CARE = {
  the_double_challenge: 'Coloured ethnic hair — especially Type 3-4 — must address BOTH the inherent moisture needs of the hair texture AND the damage introduced by the colouring process. This requires more intensive care than coloured straight hair.',

  routine_adjustments: {
    shampoo: 'Use a sulphate-free, colour-safe shampoo. Sulphates strip colour faster. Co-wash between shampoos to maintain moisture.',
    deep_conditioning: 'WEEKLY deep conditioning is non-negotiable for coloured Type 3-4 hair. Chemical processing lifts the cuticle, causing ongoing moisture loss.',
    protein_and_moisture_balance: {
      protein: 'Bleach and colour break protein bonds — protein treatments (2x monthly for bleached hair) help rebuild structure. Signs of protein deficiency: elastic, gummy, mushy wet hair.',
      moisture: 'Coloured hair also needs intensive moisture — signs of moisture deficiency: brittle, dry, rough texture when wet.',
      balance: 'Too much protein without moisture = stiff, brittle hair. Too much moisture without protein = limp, elastic hair. Both are needed.',
    },
    heat_styling: 'Minimise heat on coloured hair — especially bleached Type 4 hair. The double damage (bleach + heat) causes cumulative breakage. Air dry or use diffuser with cool air.',
    protective_styles: 'Protective styles (braids, twists, buns) are even more important for coloured hair — they minimise manipulation and reduce mechanical breakage.',
  },

  treatments: [
    { name: 'Olaplex No. 3', use: 'At-home bond builder — use weekly on bleached or colour-damaged hair. Apply to dry hair before washing, leave 10+ minutes.', type: 'Bond building' },
    { name: 'K18 Leave-In Molecular Repair Mask', use: 'Revolutionary peptide treatment that rebuilds broken keratin chains. Apply to damp hair after shampooing, do not rinse. Particularly dramatic results on bleached natural hair.', type: 'Molecular repair' },
    { name: 'Briogeo Don\'t Despair Repair', use: 'Intense moisture + protein deep conditioning mask. For colour-treated natural hair.', type: 'Moisture + protein' },
    { name: 'SheaMoisture Manuka Honey & Yogurt Hydrate + Repair', use: 'Budget-friendly protein-moisture treatment for colour-treated hair', type: 'Budget option' },
    { name: 'ApHogee Two-Step Treatment', use: 'Intense protein treatment for severely damaged bleached hair. Only use 1x per month maximum — it is very strong.', type: 'Intensive protein' },
  ],

  colour_fading_prevention: [
    'Rinse with cold water — closes cuticle, locks colour in',
    'Sulphate-free shampoo',
    'Limit washing to 1-2x per week',
    'UV protectant spray on hair in sunlight',
    'Deep condition regularly — moisturised hair holds colour better',
    'Use colour depositing conditioners to refresh between dye sessions',
  ],
};

// ─── ETHNIC COLOUR TRADITIONS ─────────────────────────────────────────────────

export const ETHNIC_COLOUR_TRADITIONS = {
  south_asian: {
    henna_tradition: {
      history: 'Henna (mehndi) has been used for hair colouring in South Asia for over 5,000 years. The lawsone molecule in henna permanently bonds to hair keratin, creating lasting auburn, copper, and red tones.',
      how_to: [
        'Mix henna powder with warm water or tea for darker result, or lemon juice for brighter red',
        'Add amla powder for conditioning and to moderate the colour',
        'Add indigo powder to get brown-black tones (two-step process)',
        'Apply to dry hair, cover with shower cap, leave 2-4 hours or overnight',
        'The colour darkens in the 48 hours after washing out as it oxidises',
      ],
      caution: 'TRUE HENNA IS SAFE. Black henna contains PPD (paraphenylenediamine) — a chemical used in chemical hair dye — and can cause severe allergic reactions, chemical burns, and permanent sensitisation. NEVER use black henna.',
      after_henna: 'Henna-coated hair cannot be chemically bleached safely. The chemical reaction between henna and bleach is unpredictable and can cause severe breakage or colour results that cannot be predicted.',
    },
    modern_colour: 'Bold highlights and vivid colours are very popular in contemporary South Asian beauty — a fusion of traditional cultural identity with global beauty trends',
  },

  west_african_black_american: {
    history_of_colour: 'Hair colour has been an important form of self-expression in Black communities — from the chemically processed looks of the Motown era through the natural hair movement\'s rediscovery of henna and natural dyes.',
    modern_trends: {
      coloured_natural_hair: 'The natural hair movement created a space for exploring colour on natural Type 4 hair — including vivid colours, ombre on coils, and highlighted locs',
      locs_and_colour: 'Locs can be coloured — bleaching locs is possible with care, though the dense structure means longer processing time. Vivid direct dyes on locs look beautiful without bleaching when the colour is visible in sunlight.',
      braided_colour: 'Braided extensions can include coloured hair — allowing dramatic colour without any chemical processing on natural hair',
    },
  },

  east_asian: {
    history: 'Traditional East Asian beauty culture emphasized dark, glossy black hair as the beauty ideal. This changed dramatically in the 20th century, particularly in South Korea and Japan where lighter brown, caramel, copper, and blonde tones became aspirational.',
    korean_hair_colour: {
      trends: 'Korean beauty has led global hair colour trends — ash brown, mocha, honey caramel, chocolate, and the occasional bold vivid shade. The emphasis is on healthy shine and a natural-looking result.',
      brown_vs_black: 'Going from natural black to brown is the most common first colour for East Asian hair — achievable with 30-40 Vol without pre-lightening if going to a warm medium brown. For ash brown or any cooler tone, bleaching is needed.',
    },
    japanese: 'Japanese hair colour ranges from subtle natural brown (common in professional settings) to bold fashion colours (popular in youth subcultures — gyaru, Harajuku). Bleached and brightly coloured hair has long been a subculture statement in Japan.',
  },

  latin_caribbean: {
    tradition: 'Vivid colour, bold highlights, and dramatic hair colour transformations are deeply embedded in Latin American beauty culture. Red, golden blonde, and dramatic ombre are classic looks.',
    sunlight_highlights: 'Traditional practice of using lemon juice + sun exposure to create natural highlights — lightens hair slowly and naturally with citric acid and UV',
  },
};

// ─── GREY HAIR MANAGEMENT ─────────────────────────────────────────────────────

export const GREY_HAIR_GUIDE = {
  ethnic_grey_patterns: {
    timing: 'The timing of grey hair onset varies by ethnicity on average: White hair typically greys earliest (mid-30s average), followed by Asian hair (late 30s), then Black and South Asian hair (often 40s). However, premature greying can occur in any community.',
    appearance: 'Grey and white hair in coily textures can appear coarser and more resistant to moisture than pigmented hair — because the cuticle structure changes as the follicle loses pigmentation. Deep conditioning is particularly important.',
    silver_on_dark_skin: 'Silver and white hair against deep skin tones creates a striking, beautiful contrast that has become celebrated rather than stigmatised — many women of colour are choosing to embrace grey.',
  },

  options: {
    cover: {
      permanent_dye: 'Traditional grey coverage. Requires regular root touch-ups as grey grows in (every 4-6 weeks). Choose a shade that matches your natural colour or slightly lighter.',
      for_type_4: 'Root touch-ups on Type 4 hair — apply permanent colour to the new growth only. Do NOT overlap with previously coloured hair to prevent breakage.',
      grey_blending: 'Rather than full coverage, blending grey — using highlights or lowlights to incorporate the grey naturally — reduces the frequency of touch-ups and looks more natural as it grows out.',
    },
    embrace: {
      transition: 'Growing out grey while covering the dark hair (reverse ombre approach) is one option. Another is to bleach and tone hair to match the grey — creating a unified silver look.',
      care_for_grey: [
        'Grey hair is more porous — it absorbs colour and environmental pigments (yellow from water minerals, smoke). Use a purple shampoo periodically to prevent yellowing.',
        'Deep conditioning is essential — grey hair is often drier',
        'Shine serums and glossing treatments make grey look silver and lustrous rather than dull',
      ],
    },
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getColourGuideForCommunity(communityId) {
  const traditions = ETHNIC_COLOUR_TRADITIONS[communityId.replace('-', '_')];
  return {
    traditions: traditions || null,
    care: COLOUR_CARE,
  };
}

export function getBleachingGuide(hairType) {
  const guide = { ...BLEACHING_GUIDE };
  if (hairType && hairType.startsWith('4')) {
    guide.priority_note = 'Type 4 hair requires the most careful bleaching approach. Strongly consider multiple lighter sessions over one heavy session.';
  }
  return guide;
}

export function getVividColourGuide() {
  return VIVID_COLOURS;
}

export function getColourScienceGuide() {
  return HAIR_COLOUR_SCIENCE;
}

export function getToningGuide() {
  return TONING_GUIDE;
}

export function getGreyHairGuide() {
  return GREY_HAIR_GUIDE;
}

export const HAIR_COLOUR_STATS = {
  liftingStages: HAIR_COLOUR_SCIENCE.underlying_pigment_stages.stages.length,
  communitiesWithColourTraditions: Object.keys(ETHNIC_COLOUR_TRADITIONS).length,
  colourCareProducts: COLOUR_CARE.treatments.length,
  vivid_brands: VIVID_COLOURS.products_for_vivid_colour.brands.length,
};
