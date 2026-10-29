/**
 * MIRRR Lip Care Guide for Ethnic Skin
 * Hyperpigmentation, dark lip corners, melanin-rich lip care,
 * cultural lip traditions and product recommendations
 */

// ─── LIP ANATOMY AND ETHNIC DIFFERENCES ──────────────────────────────────────

export const LIP_ANATOMY = {
  structure: {
    vermillion: 'The visible lip surface — the pink or pigmented area. In deeper skin tones, the vermillion often has higher melanin content, creating lips that are naturally deeper pink, mauve, red-brown, or deep plum.',
    dry_zone: 'The lip surface lacks sebaceous glands (oil glands) — lips cannot produce their own oil, making them uniquely dependent on external moisture.',
    skin_thickness: 'Lip skin is much thinner than facial skin — only 3-4 cell layers vs 15-16 on the face. This means less barrier protection and faster moisture loss.',
    stratum_corneum: 'Lips have a much thinner stratum corneum (top protective layer) than other skin, contributing to their dryness and sensitivity.',
  },

  melanin_in_lips: {
    distribution: 'Melanin in the lips is distributed differently from facial skin. In deeper skin tones, melanin is more evenly distributed throughout the vermillion, creating a naturally darker lip baseline.',
    variation: 'Natural lip colour varies enormously across ethnicities and individuals — from light rose-pink to deep mauve to dark brown-red to plum. All are normal and beautiful.',
    sun_exposure: 'Unlike other skin areas, the lips are not well-protected from sun. UV exposure causes melanin increase in lips, particularly the lower lip (more sun exposure).',
  },

  ethnic_lip_characteristics: {
    south_asian: 'Often naturally full lips with deep pink, mauve, or dark pink colouring. Many South Asian women have naturally darker upper lip from hair follicles (related to upper lip hair darkness), and deeper pigmented lip corners.',
    arab: 'Rich pigmentation ranging from rose-pink to deeper mauve; often full, well-defined lips. Natural lip line tends to be clearly defined.',
    west_african: 'Full lips typically with deep melanin — naturally ranging from warm rose to deep mahogany to plum. Lip borders often beautifully defined.',
    black_american: 'Full lips with rich deep pigmentation — warm brown-rose, mauve, deep plum common. This is healthy melanin, not hyperpigmentation.',
    east_asian: 'Typically thinner lips with lighter pink to rose colouring. Lip ombre (lighter toward lip line, darker center) a common natural feature. Korean glass-lip and gradient lip trends celebrate this natural ombre.',
    latina: 'Wide variation — lighter pink to deep rose to brown-red. Often full lips with warm pigmentation. Brazilian influence on lip enhancement surgery has shaped global beauty standards.',
    east_african: 'Warm deep brown to dark plum lips are common. Full lips with rich warm undertone pigmentation. Lips often appear lighter on the inside of the mouth than on the outer vermillion.',
    caribbean: 'Full lips with rich deep pigmentation, often warm brown to dark plum. Similar to West African lip characteristics due to shared ancestry.',
  },
};

// ─── LIP HYPERPIGMENTATION ────────────────────────────────────────────────────

export const LIP_HYPERPIGMENTATION = {
  what: 'Lip hyperpigmentation is darkening of the lips beyond the person\'s natural baseline — not to be confused with naturally deep lip colour, which is simply higher melanin and is normal.',

  types: {
    perioral_hyperpigmentation: {
      what: 'Darkening around the outside of the mouth — in the perioral area (the skin around the lips)',
      causes: ['Post-inflammatory hyperpigmentation from hair removal (waxing, threading, shaving)', 'Contact dermatitis from lip products or toothpaste', 'Sun exposure', 'Hormonal changes (melasma can affect the perioral area)', 'Friction from picking or rubbing'],
      who_is_most_affected: 'Darker skin tones — Fitzpatrick IV-VI — are significantly more prone due to reactive melanocytes',
    },
    lip_corner_darkening: {
      what: 'Darkening specifically in the corners of the mouth (mouth commissures)',
      causes: ['Friction — the corners of the mouth constantly move and rub against each other', 'Salivary enzymes — enzymatic breakdown of the skin at corners', 'Angular cheilitis (fungal/bacterial infection in corners) can leave PIH', 'Sun exposure', 'Contact with lip products'],
      treatment: 'This area is particularly resistant to treatment because the source of friction is ongoing. Prevention > treatment.',
    },
    overall_lip_darkening: {
      causes: [
        'Smoking — one of the strongest causes; nicotine stimulates melanocytes',
        'UV exposure — lower lip especially vulnerable; lips have minimal sun protection',
        'Iron deficiency — lip darkening can be a sign of anaemia (very common in South Asian and West African women)',
        'Hormonal changes — pregnancy, PCOS, thyroid conditions',
        'Certain medications — antimalarials (common in Africa), some antibiotics, minocycline',
        'Chronic dehydration',
        'Coffee and tea — not proven but anecdotally associated',
        'Chapping and repeated lip-licking — creates a cycle of damage and PIH',
      ],
    },
  },

  treatment: {
    topical: {
      vitamin_c: 'Topical vitamin C at the lip border (NOT on the mucosa — the inner pink part) — brightening over time with consistent use',
      kojic_acid: 'Effective for lip hyperpigmentation. Can apply to the outer lip and lip border area. Use a balm or serum format.',
      niacinamide: 'Applied around the perioral area — brightening and barrier-supporting',
      azelaic_acid: 'Particularly good for perioral hyperpigmentation — addresses both PIH and any inflammatory component',
      retinol: 'Use with EXTREME CAUTION on lips — they are very thin skin and will be easily irritated. Low concentration retinol applied only to the outer perioral area, never on the vermillion itself. Sunscreen daily if using.',
      glycolic_acid: 'NOT recommended directly on lips — too irritating for this thin, sensitive skin',
    },
    in_office: {
      chemical_peel: 'Gentle superficial peels (lactic acid, mandelic acid) applied to the perioral area — NOT on the lip itself. Must be done by an experienced professional who works with darker skin.',
      laser: {
        safe_options: 'Nd:YAG laser (1064nm) is safe for Fitzpatrick IV-VI for lip pigmentation. Q-switched Nd:YAG for stubborn spots.',
        avoid: 'IPL, CO2, fractional lasers on lips/perioral area of darker skin — significant risk of PIH paradox (making pigmentation worse).',
        finding_a_provider: 'Specifically seek a dermatologist or aesthetic practitioner with documented experience treating patients of colour. Ask to see before/after photos of patients with your skin tone.',
      },
    },
    prevention: [
      'Daily SPF lip product — lips age and hyperpigment from sun exposure. Use an SPF 30+ tinted lip product or apply a small amount of mineral sunscreen to lips.',
      'Stop smoking — the single most impactful change for smoking-related lip darkening',
      'Check iron levels — if you suspect anaemia, get a full blood count. Iron supplementation may help if deficient.',
      'Avoid irritating lip products — flavoured, heavily fragranced, menthol-heavy lip products can irritate and trigger PIH',
      'Never pick or peel the lips',
      'Do not lick the lips — salivary enzymes perpetuate chapping and darkening cycle',
    ],
  },
};

// ─── LIP CARE ROUTINE ─────────────────────────────────────────────────────────

export const LIP_CARE_ROUTINE = {
  fundamental: 'Lip care is fundamentally about moisture retention — since lips cannot produce their own oil, hydration must come entirely from external sources.',

  morning: {
    step_1: {
      action: 'Gentle exfoliation (2-3x per week, not daily)',
      how: 'Damp washcloth in gentle circular motions, or a sugar lip scrub. Soft-bristle toothbrush is an alternative.',
      timing: 'Only when lips are NOT cracked or inflamed — exfoliation on damaged lips makes things worse',
    },
    step_2: {
      action: 'Hydrating serum or balm base',
      ingredients_to_look_for: ['Hyaluronic acid', 'Glycerin', 'Aloe vera'],
    },
    step_3: {
      action: 'SPF lip protection',
      what: 'Either SPF lip balm (Supergoop Lipshield SPF 30, EltaMD UV Lip Balm SPF 36) or a thin layer of mineral SPF at the lip border and lip skin',
      why: 'The lower lip receives significant UV exposure and is more prone to actinic damage and cancer than most facial areas',
    },
    step_4: {
      action: 'Apply lip colour if desired',
    },
  },

  evening: {
    step_1: {
      action: 'Remove lip product thoroughly',
      how: 'Oil-based cleanser or micellar water — removes long-wear lip products without excessive rubbing',
    },
    step_2: {
      action: 'Healing overnight treatment',
      options: [
        'Castor oil — thick, occlusive, promotes wound healing on cracked lips; the most traditional remedy',
        'Shea butter — excellent for dark-toned lips; deeply moisturising and healing',
        'Lanolin — the most effective occlusive for severely chapped lips',
        'Aquaphor healing ointment — dermatologist favourite for overnight healing',
        'Vaseline — a classic pure occlusive that locks in moisture',
        'Honey (raw) — antimicrobial, humectant, healing',
      ],
      how_to_apply: 'Apply a generous layer and leave overnight. Can apply before lip mask if using one.',
    },
    overnight_mask: {
      what: 'Dedicated lip sleeping mask',
      top_picks: ['Laneige Lip Sleeping Mask (berry or original)', 'Tatcha Kissu Lip Mask', 'Milk Makeup Melatonin Overnight Lip Mask'],
      diy: 'Mix 1 tsp shea butter + 1 tsp raw honey + a few drops of vitamin E oil. Apply thick layer overnight.',
    },
  },
};

// ─── LIP PRODUCTS FOR DEEP SKIN ───────────────────────────────────────────────

export const LIP_PRODUCTS_DEEP_SKIN = {
  the_challenge: 'Finding lipstick that works on deeper skin tones has historically been a challenge — "nude" for pale skin reads as ghostly on medium-deep skin, and many products that look deep in the pan look washed out or ashy when applied to darker lips.',

  nude_lip_for_deeper_skin: {
    what_does_nude_mean: 'A "nude" lip should look like a natural, slightly more polished version of your own lips. The perfect nude is as individual as your skin tone.',
    finding_your_nude: [
      'Go one shade deeper than your inner wrist or inner arm colour',
      'Test products on your natural lip (not hand or wrist) — the colour looks different on lip skin',
      'Nude for deeper skin is warm brown, warm caramel, warm mauve, and brown-rose — not beige, not pale pink',
    ],
    recommended_nudes_for_deep_skin: [
      { brand: 'MAC', shades: ['Whirl', 'Velvet Teddy', 'Yash', 'Persistence'], note: 'MAC has consistently been a leader in inclusive nude shades' },
      { brand: 'NARS', shades: ['Shrinagar', 'Dolce Vita', 'Mayflower'], note: 'Warm mauves and nude roses' },
      { brand: 'Fenty Beauty', shades: ['Underdawg', 'Freckle Fiesta', 'Griselda'], note: 'Rihanna built Fenty with deep skin nudes as a priority' },
      { brand: 'Pat McGrath', shades: ['Blood Honey', 'Full Blooded', 'Flesh 5'], note: 'Luxury option with exceptional deep skin range' },
      { brand: 'Ami Colé', shades: ['All warm nudes designed for melanin-rich skin'], note: 'A Black-owned brand built SPECIFICALLY for melanin-rich skin — every shade designed with deep skin in mind' },
      { brand: 'Juvia\'s Place', shades: ['Numerous warm brown nudes'], note: 'Black-owned, affordable' },
    ],
    to_avoid: ['Pale pink on deep skin — reads ashy and ghostly', 'Cool-toned beige — "corpse lip" effect on warm/neutral dark skin', 'Products with silver or white shimmer — invisible glitter on deep skin'],
  },

  dark_and_deep_shades: {
    for_deep_skin: [
      'Deep plum, burgundy, wine, dark berry — these work beautifully on deep skin. The higher melanin in deeper lips creates a beautiful contrast with deep shades.',
      'Dark brown, chocolate, mocha — warm dark browns are stunning on deep skin',
      'Brick red, terracotta — earthy warm reds look incredible',
      'True red — a classic that suits ALL skin tones; go for warm, orange-red for warm-toned skin; cool berry-red for cooler-toned skin',
    ],
    tips: [
      'Use lip liner to define and prevent feathering of dark shades',
      'Blot and reapply for longevity',
      'Keep the rest of makeup minimal — dark lip is a statement',
    ],
  },

  glosses: {
    for_deep_skin: [
      'Clear gloss over deep nude or bare lips — very beautiful on deep skin, adds dimension',
      'Deep brown or dark berry gloss',
      'Bronze and copper gloss — stunning on warm-toned deep skin',
      'Avoid pale pink gloss or white-based gloss — can look ashy or grey',
    ],
    recommended: [
      { product: 'Fenty Beauty Gloss Bomb', note: 'Universally flattering gold-pink; the "Universal Glow" shade works across skin tones' },
      { product: 'NYX Butter Gloss (Brownie Sundae, Brown Sugar)', note: 'Affordable, beautiful warm brown glosses for deep skin' },
      { product: 'ColourPop Ultra Glossy in warm nudes', note: 'Budget-friendly, excellent deep skin shades' },
    ],
  },
};

// ─── TRADITIONAL LIP TRADITIONS BY COMMUNITY ─────────────────────────────────

export const LIP_TRADITIONS = {
  south_asian: {
    natural_lip_care: 'Desi ghee (clarified butter) applied to lips overnight — a traditional remedy for chapped lips used across generations. Rose water and glycerin mix for daily hydration.',
    mehndi_lips: 'For bridal looks, lip staining with beet juice or pomegranate juice gives a long-lasting natural red tint — a precursor to commercial lip tints',
    sindoor: 'In some Hindu traditions, sindoor (red vermillion powder) applied at the part is considered auspicious and associated with marital status. The deep red colour has influenced aesthetic preferences for bold lip colours in the community.',
    contemporary: 'Bollywood heavily influenced South Asian beauty ideals — deep red lips are iconic in Bollywood aesthetics, associated with beauty and glamour.',
  },

  arab: {
    lipstick_in_arab_culture: 'Bold, defined lips are traditionally beautiful in Arab cultures. Deep red, dark berry, and defined lip looks are classic.',
    natural_remedies: {
      pomegranate: 'Pomegranate juice used as a natural lip tint and moisturiser — also contains antioxidants',
      rose_water: 'Rose water (ma\' al-ward) applied to lips for hydration and subtle colour',
      argan_oil: 'Moroccan tradition — argan oil applied to lips as a treatment for dryness',
      jojoba_oil: 'Used across the Arab world as a lip treatment — closely mimics the skin\'s natural sebum',
    },
    kohl_and_lips: 'Historically, kohl was sometimes applied to lips for a dark, defined look in some Arab and North African traditions.',
  },

  west_african: {
    natural_practices: 'Shea butter is the foundational lip care across West Africa — applied directly to lips for moisture and healing',
    lip_plates: 'In certain East African and some West African cultures (e.g., Mursi and Surma people), lip plates are worn as a sign of beauty and social status — a cultural practice of profound significance',
    modern: 'Bold lip colour is celebrated — deep reds, berries, corals, and earthy browns are popular. There is a strong appreciation for and embrace of naturally full, dark lips.',
  },

  east_asian: {
    bitten_lip: 'The "bitten lip" or gradient lip (gwiyomi look) is iconic in Korean beauty — applying product only to the center of the lips creates a soft, youthful look that plays up the natural lip ombre common in East Asian lips',
    glass_lip: 'High-shine, moisturised, dewy lips are the Korean beauty ideal — lip oil, gloss, or water plumping glosses',
    traditional: 'In traditional Japanese geisha makeup, small "rosebud" lips were painted in red lipstick — only the center of the lips coloured to create a small, defined shape. A deliberate contrast with natural lip fullness.',
    modern_china: 'Red lip is a major trend in contemporary Chinese beauty — bold, matte, deep red is associated with confidence and modern femininity.',
  },

  latina: {
    culture: 'Bold, vibrant lip colour is deeply associated with Latina beauty — red, coral, berry, and deep shades are celebrated. Lips are a central beauty focus.',
    traditional_treatments: 'Coconut oil, avocado oil, and aloe vera (sábila) applied to lips for moisture and healing — accessible household remedies',
    icon: 'Selena Quintanilla\'s signature bold red lip has become iconic in Latinx beauty culture — a symbol of confidence and cultural pride',
  },
};

// ─── LIP EXFOLIATION AND PEELING ─────────────────────────────────────────────

export const LIP_EXFOLIATION = {
  when_to_exfoliate: 'Only when lips are NOT cracked, bleeding, or severely inflamed. Exfoliating damaged lips worsens the barrier breakdown.',

  frequency: '2-3 times per week maximum. Most people with deep skin do better with less frequent exfoliation to avoid irritation and PIH risk.',

  methods: {
    sugar_scrub: {
      diy: 'Mix 1 tsp brown sugar + 1/2 tsp honey + a few drops of jojoba oil. Apply with fingertip in gentle circular motions. Rinse.',
      commercial: ['Sara Happ Lip Scrub', 'e.l.f. lip scrub (budget)', 'Lush Lip Scrubs (also edible)'],
    },
    washcloth: {
      how: 'Wet a soft washcloth, fold, and use gentle circular movements on lips. The mildest form of exfoliation — suitable even for sensitive lips.',
    },
    toothbrush: {
      how: 'A clean, soft-bristle toothbrush dampened with warm water. Very gentle circular motions. Particularly effective for removing dry skin flakes.',
    },
    acid_peel: {
      what: 'Products containing AHAs (usually lactic acid) for lips — a gentle chemical approach',
      note: 'Much more effective than physical scrubbing and less risk of micro-tears. Apply, leave 1-2 minutes, wipe off.',
      caution: 'If using an acid on lips, do not layer with other actives and use only 1-2x per week maximum',
    },
  },

  after_exfoliation: 'ALWAYS follow immediately with a hydrating treatment (hyaluronic acid serum) and then an occlusive sealant (shea butter, castor oil, lip balm). Exfoliated lips are temporarily more permeable — the ideal time to apply treatment.',
};

// ─── LIP-LICKING AND CHAPPED LIP CYCLE ───────────────────────────────────────

export const LIP_LICKING_CYCLE = {
  the_problem: 'Lip licking is extremely common and creates a destructive cycle: lips feel dry → lick them for temporary moisture → saliva evaporates and takes MORE moisture with it than was there before → lips feel even drier → repeat.',

  salivary_enzymes: 'Saliva contains digestive enzymes (amylase, lipase, protease) designed to break down food. Repeated application to the thin lip skin begins to break down the lip surface itself — causing redness, irritation, and eventual chapping.',

  angular_cheilitis: 'Persistent moisture in the lip corners (from licking or saliva pooling) combined with friction can lead to angular cheilitis — a fungal/bacterial infection at the corners of the mouth. Can leave PIH in darker skin. Treatment: antifungal cream (clotrimazole) or antibacterial (mupirocin) depending on cause, confirmed by dermatologist.',

  breaking_the_cycle: [
    'Identify your licking triggers — do you lick when stressed, when working, when lips feel dry?',
    'Keep a rich lip balm ALWAYS accessible and apply immediately when lips feel dry instead of licking',
    'Apply a thick occlusive layer (Aquaphor, Vaseline) before bed to heal the lip barrier during sleep',
    'Drink more water — chronic dehydration shows up in dry lips',
    'Consider whether you breathe through your mouth during sleep — mouth breathing causes significant lip dryness overnight',
  ],
};

// ─── LIP OILS AND PLUMPING ────────────────────────────────────────────────────

export const LIP_OILS_PLUMPING = {
  lip_oils: {
    what: 'Lip oils are formulated for both treatment (skin-benefiting plant oils) and cosmetic effect (shine, colour)',
    why_popular: 'Lip oils combine the treatment benefits of lip care with the aesthetic of a gloss — the fusion K-beauty created',
    top_picks: [
      { product: 'Charlotte Tilbury Lip Oil Elixir', note: 'Luxury, excellent for deep skin tones — warm tinted options', price: 'Luxury' },
      { product: 'Glow Recipe Watermelon Lip Pop', note: 'Plumping, high shine, moisturising', price: 'Mid-range' },
      { product: 'e.l.f. Lip Oil', note: 'Budget friendly, surprisingly good quality', price: 'Budget' },
      { product: 'Fenty Skin Plump N\' Lit Instant Lip Mask', note: 'Specifically developed for melanin-rich skin', price: 'Mid-range' },
    ],
  },

  natural_lip_plumping: {
    mechanism: 'Temporary plumping works by creating mild irritation/increased blood flow to the lip area — this is a surface-level, temporary effect',
    natural_options: [
      'Cinnamon oil — adds volume temporarily and has warming sensation. Use sparingly — too much burns.',
      'Peppermint oil — cooling then plumping effect, increases blood flow',
      'Ginger oil — warming, plumping',
    ],
    caution: 'Essential oils on lips must be DILUTED in a carrier oil (jojoba, sweet almond) to avoid burns. Never apply neat. Test for sensitivity first.',
    diy: '3 drops cinnamon essential oil + 1 tbsp sweet almond oil + 1 tsp shea butter = plumping balm',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getLipCareForCommunity(communityId) {
  const traditions = LIP_TRADITIONS[communityId.replace('-', '_')];
  return {
    traditions: traditions || null,
    products: LIP_PRODUCTS_DEEP_SKIN,
    care: LIP_CARE_ROUTINE,
  };
}

export function getLipHyperpigmentationGuide() {
  return LIP_HYPERPIGMENTATION;
}

export function getNudeShadeGuide() {
  return LIP_PRODUCTS_DEEP_SKIN.nude_lip_for_deeper_skin;
}

export function getLipOilGuide() {
  return LIP_OILS_PLUMPING;
}

export function getLipExfoliationGuide() {
  return LIP_EXFOLIATION;
}

export function getLipTraditions(communityId) {
  const key = communityId.replace('-', '_');
  return LIP_TRADITIONS[key] || null;
}

export const LIP_CARE_STATS = {
  communitiesCovered: Object.keys(LIP_TRADITIONS).length,
  hyperpigmentationTreatments: Object.keys(LIP_HYPERPIGMENTATION.treatment.topical).length,
  nudeShadeRecommendations: LIP_PRODUCTS_DEEP_SKIN.nude_lip_for_deeper_skin.recommended_nudes_for_deep_skin.length,
};
