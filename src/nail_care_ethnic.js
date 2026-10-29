/**
 * MIRRR Nail Care for Ethnic Communities
 * Nail health, nail art traditions, products for melanin-rich nails
 * Gel, acrylic, press-ons, natural nail care
 */

// ─── NAIL ANATOMY & HEALTH FUNDAMENTALS ──────────────────────────────────────

export const NAIL_FUNDAMENTALS = {
  anatomy: {
    nail_plate: 'The visible part of the nail — made of keratin (same protein as hair)',
    nail_bed: 'The skin beneath the nail plate — pink in most people due to underlying blood vessels',
    cuticle: 'The thin skin at the base of the nail — NOT dead skin, contrary to popular belief. The cuticle is living tissue that seals the nail from pathogens.',
    lunula: 'The white half-moon at the base of the nail — visible keratin before it fully keratinises',
    matrix: 'Where the nail grows from — entirely beneath the skin. Damage to the matrix = permanent nail damage. NEVER push, cut, or damage this area.',
    free_edge: 'The part of the nail that extends beyond the fingertip',
    hyponychium: 'The skin beneath the free edge where nail separates from finger',
  },

  healthy_nail_indicators: [
    'Smooth, even texture without ridges or pitting',
    'Firm but slightly flexible',
    'Even pink colour on nail bed',
    'White free edge',
    'Cuticle intact and not lifted',
  ],

  common_nail_concerns: {
    vertical_ridges: {
      what: 'Vertical lines from base to tip',
      common_in: 'Everyone — increases with age',
      cause: 'Normal ageing, dehydration, nutritional deficiencies',
      solution: 'Buffing (careful — can thin nails), ridge-filling base coat, hydration, biotin',
    },
    horizontal_ridges_beaus_lines: {
      what: 'Horizontal dents across the nail',
      cause: 'Significant physical or emotional stress, illness — the matrix paused growth. Shows as a "line" growing out.',
      solution: 'Grows out over 6 months. Address underlying health.',
    },
    pitting: {
      what: 'Small dents in nail surface',
      cause: 'Often psoriasis or alopecia areata (autoimmune conditions)',
      solution: 'See dermatologist — this is a medical symptom',
    },
    onycholysis: {
      what: 'Nail separating from nail bed',
      common_in: 'More common in women; associated with thyroid disease, chemical exposure, aggressive nail products',
      solution: 'Keep nails short, gentle approach, see dermatologist if spontaneous',
    },
    melanonychia: {
      what: 'Dark streak or brown-black band on nail',
      important: 'THIS IS NORMAL IN DARK-SKINNED INDIVIDUALS. Longitudinal melanonychia (vertical dark streak) is COMMON and normal in people with Fitzpatrick IV-VI skin. It is caused by melanin deposits in the nail matrix.',
      caution: 'ANY sudden new dark streak, especially with irregular edges or Hutchinson\'s sign (pigment spreading to surrounding skin), warrants dermatologist evaluation to rule out subungual melanoma.',
      statistics: 'Longitudinal melanonychia is found in 77% of Black individuals over age 20 but is rare in white individuals — this contrast means it is sometimes mismanaged in clinical settings where physicians are unfamiliar with this normal variant',
    },
  },
};

// ─── MELANONYCHIA — NAIL HEALTH FOR DARK SKIN ─────────────────────────────────

export const MELANONYCHIA_GUIDE = {
  overview: 'Melanonychia is one of the most misunderstood aspects of nail health for people with darker skin tones. It deserves its own section.',

  what_is_normal: {
    description: 'A tan, brown, or black longitudinal band running from base to tip of one or more nails',
    in_darker_skin: 'Occurs in the majority of Black individuals. Also common in South Asian, Middle Eastern, and Hispanic individuals. Normal and benign in most cases.',
    mechanism: 'Melanin-producing cells (melanocytes) in the nail matrix are activated. Similar to why skin produces melanin — a normal variation.',
    no_treatment_needed: 'Do NOT bleach, chemically lighten, or aggressively treat a streak you\'ve had for years. This is your nails being your nails.',
  },

  when_to_see_a_doctor: [
    'A new streak that appeared suddenly in adulthood',
    'A streak that is widening or changing colour',
    'Hutchinson\'s sign: pigment from the streak spreading onto the cuticle or skin around the nail',
    'A streak on the thumb or big toe (more common sites for melanoma)',
    'Irregular edges or different shades within one streak',
    'Pain, nail crumbling, or bleeding associated with the streak',
  ],

  note_for_nail_technicians: 'IMPORTANT FOR NAIL TECHS: Do not refuse service or alarm clients over longitudinal melanonychia on darker skin tones. This is a normal anatomical variation. Education in this area is lacking in many nail technician training programs.',
};

// ─── NAIL ART TRADITIONS ACROSS CULTURES ──────────────────────────────────────

export const NAIL_ART_TRADITIONS = {
  henna_nails: {
    origin: 'South Asia and Middle East',
    what: 'Applying henna to the nails and fingertips as part of beauty and spiritual ritual — predates modern nail polish by thousands of years',
    cultural_context: 'In South Asian and Arab traditions, henna on nails is part of the bridal experience. The darker the henna stain on the bride, the more loving the marriage is said to be.',
    modern_henna_nails: 'Today, henna nail art means detailed mehndi-inspired designs painted on the nail plate using nail art brushes — recreating henna patterns in polish.',
    traditional_colour: 'Natural henna gives a rust to dark reddish-brown stain on nails. On nails, the stain often appears darker than on skin.',
  },

  nail_art_south_asian: {
    bridal: 'For South Asian weddings, nail art is often highly elaborate — matching bridal lehenga colour, incorporating mirror work, ombre, or hand-painted designs',
    festival: 'Eid, Diwali, and other festivals are nail art events — women share designs on social media and do nails as a group activity',
    popular_designs: ['Paisley nail art', 'Mehndi-inspired line work', 'Bridal gold foil designs', 'Jewel-encrusted nail art', 'Ombre in bridal colours'],
  },

  nail_art_west_african: {
    cultural_presence: 'Nail salons are cultural hubs in many West African and Black American communities. Nail artistry is taken very seriously and extremely long nails (acrylics or natural) have been a marker of style since the 1990s.',
    ombre_nails: 'Popularised largely by Black nail artists in the early 2010s — two-colour gradient that has become a global standard technique',
    nail_shapes_in_community: {
      coffin_ballerina: 'Extremely popular in Black beauty culture — long with flat squared-off tip',
      almond: 'Elegant, tapered oval — popular across many communities',
      stiletto: 'Dramatic, sharp pointed nail — requires acrylic/gel to achieve',
    },
    brands_by_black_owners: ['Nails of LA (Los Angeles salon empire)', 'ManiMe', 'Unik Nail Supply'],
  },

  nail_art_east_asian: {
    japanese_nail_art: {
      what: 'Japan has the world\'s most technically advanced nail art culture — 3D nail art, gel sculpture, and highly detailed hand-painted designs originate largely from Japan',
      techniques: ['3D nail art (polymer clay sculptures on nail)', 'Gel painting (highly detailed)', 'Kirakira (sparkle) nails', 'Kawaii nail designs (cute style)', 'Negative space design'],
      history: 'Nail art as a professional art form in Japan dates to the 1980s. Japan has professional nail technician licensing at a high technical level.',
    },
    korean_nail_art: {
      what: 'Korean nail art favours delicate, feminine, often pastel-toned nail designs. The K-beauty influence extends to nails.',
      aesthetic: 'Glass nails (gel overlay with a "wet" shiny look), subtle gradient, pressed flower nails, "barely there" translucent designs',
    },
    chinese_nail_art: {
      what: 'Traditional Chinese nail art dates to the Qing Dynasty when royalty wore elaborate nail guards (长指甲, cháng zhǐjia) — extremely long nails as a status symbol',
      modern: 'Contemporary Chinese nail art blends traditional motifs (lotus flowers, dragons in nail art) with modern techniques',
    },
  },

  nail_art_arab_middle_eastern: {
    what: 'Arab beauty culture places importance on manicured nails. Elaborate nail designs are worn for weddings and holidays.',
    eid_nails: 'Eid al-Fitr and Eid al-Adha are major nail art events — new nails for new celebrations',
    designs: ['Gold foil work', 'Crystal/rhinestone designs', 'Ombre in jewel tones', 'Nude with gold accents'],
    note: 'Islamic practices: many Muslim women follow a rule about nail polish and wudu (ablution before prayer) — nail polish is typically removed for prayer and salah. Some brands (786 Cosmetics, Orly Breathable) market "breathable" nail polish as halal-compatible, though scholars have varying opinions on this.',
  },
};

// ─── GEL VS ACRYLIC VS BUILDER GEL ────────────────────────────────────────────

export const NAIL_ENHANCEMENT_GUIDE = {
  overview: 'Nail enhancements (gel, acrylic, dip) are hugely popular globally. Here\'s an honest breakdown of each, including specific considerations for melanin-rich nails and hands.',

  acrylic: {
    what: 'A liquid-and-powder polymer system that creates a hard coating or extension. The most durable nail system. The "plastic nails" of popular culture.',
    pros: [
      'Extremely strong and durable',
      'Can create any length or shape',
      'Very long wear (2-3+ weeks between fills)',
      'Relatively affordable',
      'Long track record (in use since the 1970s)',
    ],
    cons: [
      'Requires professional removal (acetone + filing)',
      'Improper removal damages natural nails significantly',
      'Fumes during application (requires ventilation)',
      'Can look "thick" if not done by skilled technician',
      'Requires regular fills every 2-3 weeks as nails grow',
    ],
    ethnic_skin_consideration: 'Cuticle care is especially important before acrylic — pushed and damaged cuticles more visible against deeper skin tones. A good technician should know this. If your technician is aggressive with the e-file on your cuticles, that is a problem.',
    removal: 'NEVER pull, peel, or rip off acrylics. This removes layers of the actual nail plate. Soak in acetone or see a professional.',
  },

  gel: {
    soft_gel: {
      what: 'UV-cured gel polish (like OPI Gel Color, Shellac) — cures under UV/LED lamp. Chip-resistant gel polish over natural nail.',
      pros: ['Natural-looking', 'Thin', 'No damage during application', 'Lasts 2-3 weeks', 'Huge colour range'],
      cons: ['Less durable than acrylic or hard gel', 'Requires UV/LED curing', 'Acetone removal still needed (but easier than acrylic)'],
    },
    hard_gel: {
      what: 'A UV-cured gel that can build structure and length — more like acrylic in function but without acrylic fumes.',
      pros: ['No monomer fumes', 'Can build length', 'Somewhat flexible (less brittle than acrylic)', 'Natural-looking overlay possible'],
      cons: ['Cannot be removed with acetone — must be filed off entirely', 'More expensive than acrylic', 'Requires UV curing'],
      ethnic_skin_note: 'Hard gel is gaining popularity in diverse beauty spaces. The no-fume advantage is significant for many clients.',
    },
    builder_gel: {
      what: 'A thick UV-cured gel used to build the nail and create structure. Often applied as an overlay to strengthen natural nails.',
      pros: ['Strengthens natural nails', 'No extension needed', 'Less commitment than acrylic', 'Good for nail biters building length'],
      cons: ['Also must be filed off for removal', 'Not for very long extensions'],
    },
  },

  dip_powder: {
    what: 'Acrylic powder applied via adhesive layers (no UV lamp needed). Became very popular around 2018-2020.',
    pros: ['No UV lamp', 'Very durable', 'Light-weight', 'Good for thin or weak nails'],
    cons: ['Cross-contamination risk if salon double-dips (a serious hygiene issue)', 'Still requires acetone removal', 'Less popular with high-end technicians'],
    hygiene_note: 'If a salon is dipping your fingers INTO the powder pot (rather than pouring powder onto the nail), that pot is contaminated. Ask for individual portions to be dispensed. This is especially important as a safety matter.',
  },

  press_ons: {
    what: 'Pre-made artificial nails applied with adhesive tabs or nail glue. Has had a renaissance since 2020.',
    pros: ['DIY friendly', 'No chemicals, no UV', 'Reusable if removed carefully', 'Can match exact styles', 'Accessible and affordable'],
    cons: ['Less durable than professional enhancements', 'Can damage natural nails if removed carelessly'],
    black_owned_press_on_brands: [
      { name: 'Glamnetic', note: 'Magnetic press-ons; Black-founded' },
      { name: 'Static Nails', note: 'Reusable press-ons, large size range' },
      { name: 'Nails by Dolls', note: 'Handmade custom press-ons, popular in Black beauty community' },
    ],
    size_consideration: 'Press-on sizing assumes a narrower nail bed — many Black women have wider nail beds and will find standard sizes too narrow. Look for brands offering size variety or consider custom.',
  },

  natural_nail_growth: {
    what: 'Many people, particularly in communities where long natural nails are a point of pride, focus on growing and maintaining long natural nails.',
    tips: [
      'Biotin supplement (2500mcg per day — allows months to see results)',
      'Collagen supplement',
      'Keep nails hydrated — cuticle oil daily is the single most impactful natural nail habit',
      'Avoid prolonged water exposure without gloves (dishwashing, swimming)',
      'File in one direction only — back-and-forth filing weakens tips',
      'Protein treatments can help (same science as hair)',
      'Protect nails when doing physical work (gloves)',
    ],
  },
};

// ─── NAIL COLOURS FOR MELANIN-RICH SKIN ──────────────────────────────────────

export const NAIL_COLOUR_GUIDE = {
  principle: 'Nail colour on deep skin tones is a completely different experience than on fair skin. The same polish reads differently. Use this to your advantage.',

  colours_that_pop_on_deep_skin: {
    true_reds: { colours: ['Rich ruby red', 'Orange-red', 'Deep wine red'], why: 'Classic against deep brown skin — one of the most striking combinations' },
    deep_jewel_tones: { colours: ['Deep emerald green', 'Cobalt blue', 'Rich burgundy', 'Deep violet', 'Sapphire'], why: 'These deep saturated tones have enough pigment to show beautifully against deep skin' },
    bright_neons: { colours: ['Electric yellow', 'Neon orange', 'Hot pink', 'Bright turquoise'], why: 'High contrast makes neons EXTREMELY vibrant against deep skin — a striking and bold look' },
    metallics: { colours: ['Gold', 'Deep bronze', 'Copper', 'Silver'], why: 'Metallic reflects beautifully against deep skin; gold especially is stunning' },
    classic_black: { why: 'Timeless on all skin tones; especially striking on deep skin' },
    white_ivory: { why: 'High contrast makes white nails very impactful on deep skin — a very modern, clean look' },
  },

  colours_that_disappear_on_deep_skin: [
    'Pale pinks and nudes (they read similar to skin tone — no contrast)',
    'Very light lavender (too sheer)',
    'Sheer topcoats without base (barely shows)',
    'Baby blue (may look washed out)',
  ],

  nude_nail_for_deep_skin: {
    what: 'The "nude" nail look — a very natural-looking, skin-tone-adjacent polish',
    solution: 'Your nude is a deep nude. Look for browns, deep caramels, rich terracottas, deep mauves — NOT the pale pink "nudes" designed for fair skin',
    recommended: ['Essie Sugar Daddy (sheer beige but more opaque on deep skin)', 'OPI Bare My Soul', 'Fenty Slip Shine Sheer Shiny Lipstick (worn on nails)', 'Sally Hansen Miracle Gel in Toasty Taupe'],
  },

  french_manicure_for_deep_skin: {
    what: 'The classic French manicure (natural pink base, white tip) reads very differently on deep skin',
    modern_take: [
      'Coloured French: deep base (brown, burgundy) with white or gold tip',
      'Reverse French: colour on the base, nude on the tip',
      'All-gold tip instead of white',
      'Deep brown base with white line — a stunning modern French',
    ],
  },
};

// ─── CUTICLE CARE ─────────────────────────────────────────────────────────────

export const CUTICLE_CARE = {
  most_important_nail_habit: 'If you only do one nail care habit, make it cuticle oil — daily. The cuticle and the surrounding skin on your hands is where nail health begins.',

  what_cuticles_actually_are: 'The cuticle is the thin piece of skin that grows up over the base of the nail plate. It is not dead skin — it seals the space between the nail and the nail fold, protecting the matrix from bacteria and fungi. Aggressively cutting cuticles removes this protection.',

  cuticle_oil_routine: {
    when: 'Every night before bed. After handwashing when hands feel dry.',
    how: 'Apply 1-2 drops per nail, massage in circular motion into cuticle, nail plate, and surrounding skin',
    ingredients_to_look_for: ['Jojoba oil (closest molecular structure to skin sebum)', 'Vitamin E', 'Sweet almond oil', 'Argan oil', 'Avocado oil'],
  },

  deep_skin_cuticle_note: 'On darker skin tones, ashy, dry, or ragged cuticles are more visible than on lighter skin. Consistent cuticle oil application is especially important for beautiful-looking hands. The contrast between well-moisturised vs dry hands is very visible.',

  cuticle_care_do_dont: {
    do: [
      'Push cuticles back gently with a soft rubber cuticle pusher AFTER softening in warm water',
      'Apply cuticle oil daily',
      'Trim only the dead, loose skin (the pterygium — the wispy translucent tissue, not the actual cuticle)',
      'Hydrate hands with thick hand cream before bed',
    ],
    dont: [
      'Cut the actual cuticle seal — this breaks the matrix protection',
      'Be aggressive with metal cuticle pushers — damage is permanent',
      'Allow nail techs to use e-file on your cuticles — this is EXCESSIVE and damaging',
      'Bite or pick cuticles — leads to infection and scarring',
    ],
  },
};

// ─── NAIL CARE FOR SPECIFIC COMMUNITIES ──────────────────────────────────────

export const COMMUNITY_NAIL_NOTES = {
  'south-asian': {
    notes: 'South Asian hands are traditionally adorned for ceremonies — henna on hands, nail colour, and hand jewellery are part of bridal tradition. Many South Asian women have oval or almond nail beds. Cuticle care especially important during winter months.',
    henna_and_nails: 'Henna stains nails a rich reddish-orange during mehndi ceremonies. This stain fades over 2-3 weeks. Polish can be applied over henna stain.',
    bridal: 'Bridal nail art often matches or complements the lehenga/sari colour scheme. Gold accents are universal in South Asian bridal beauty.',
  },
  'arab': {
    notes: 'Hand care (yad) is an important part of Arab beauty culture — smooth, moisturised hands with neat nails. Oud hand cream is a luxury hand care tradition.',
    colour: 'Bold reds and deep burgundies are perennial favourites. For conservative Muslim brides, removable nail wraps or press-ons that can be removed for prayer are popular.',
    nail_art: 'Gold rhinestone and foil designs are popular especially for weddings and Eid',
  },
  'west-african': {
    notes: 'Long nails (natural or acrylic) have deep cultural significance in many Black communities — a marker of femininity, care, and style that dates back decades. The nail salon is a community space.',
    preferred_shapes: 'Coffin, ballerina, and stiletto shapes are iconic in Black nail culture',
    nail_tech_culture: 'Many Black women are professional nail technicians. Supporting Black-owned nail salons is a community value.',
    melanonychia_note: 'Longitudinal melanonychia (brown/black nail streak) is a normal variant in deeper skin tones — educated nail techs know this and will not alarm clients about normal anatomical variation.',
  },
  'east-asian': {
    notes: 'Japanese and Korean nail cultures are globally influential. Short, carefully maintained nails are the Korean preference; elaborate 3D nail art comes from Japan. Chinese nail culture values long nails historically.',
    japanese_technique: 'If you want technically excellent nail art, seek a Japanese nail technician — the craft training in Japan for nail art is extremely high',
    k_beauty_nails: 'K-beauty nail aesthetic: very clean, often minimal, with carefully applied gradient or translucent effects. Well-groomed nails with subtle art.',
  },
  'latina': {
    notes: 'Nail art is important across Latin American communities. Bold colour choices — deep reds, vibrant oranges, hot pink — are embraced. Quinceañeras are a major nail art occasion (first formal manicure for many girls).',
    coffin_nails: 'The coffin/ballerina nail shape, also called \'uñas cuadradas\' (squared nails), is extremely popular across Latina communities',
  },
  'caribbean': {
    notes: 'Vibrant nail colour matches the bold energy of Caribbean fashion and beauty. Bright neons, corals, and tropical colours popular. Nail art for carnival and cultural celebrations is elaborate.',
  },
};

// ─── SAFE NAIL REMOVAL ────────────────────────────────────────────────────────

export const SAFE_REMOVAL_GUIDE = {
  acrylic_removal: {
    professional: 'Always preferred. Ask for "soak off" not "drill off" — filing too aggressively over the natural nail is damaging.',
    diy_safe_method: [
      'Cut nails as short as possible first',
      'File the TOP surface of the acrylic (not the nail) to break the seal — this is the only filing step',
      'Soak cotton balls in pure acetone',
      'Wrap each finger with an acetone-soaked cotton ball and foil',
      'Wait 20-25 minutes — do NOT rush or peel',
      'Gently push off softened product with a cuticle pusher (no pressure on natural nail)',
      'If product does not lift, soak longer',
      'NEVER force it — if it\'s not coming, soak more',
    ],
    after_removal: [
      'Nails will look thin and may be sensitive — this is normal',
      'Apply cuticle oil immediately',
      'Use a strengthening base coat for 2-3 weeks',
      'Give nails 1-2 weeks before new enhancements',
    ],
  },
  gel_polish_removal: {
    soak_off_method: [
      'Buff the very top of the gel lightly (breaks the seal)',
      'Soak cotton in acetone',
      'Foil wrap each finger for 10-15 minutes',
      'Slide off (don\'t scrub)',
    ],
    peel_off_gels: 'Peel-off base coats allow gel to peel without acetone — fine for occasional use but can damage nails if used too frequently',
  },
  press_on_removal: {
    safest_method: [
      'Soak hands in warm water with a few drops of cuticle oil for 10-15 minutes',
      'Gently rock press-on from side to side',
      'If it doesn\'t lift easily, soak more',
      'Do NOT pull or force — this rips natural nail with it',
    ],
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getNailCareForCommunity(communityId) {
  return {
    communitySpecific: COMMUNITY_NAIL_NOTES[communityId] || null,
    fundamentals: NAIL_FUNDAMENTALS,
    cuticleGuide: CUTICLE_CARE,
    colourGuide: NAIL_COLOUR_GUIDE,
    melanonychia: MELANONYCHIA_GUIDE,
  };
}

export function getNailEnhancementGuide(type) {
  return NAIL_ENHANCEMENT_GUIDE[type] || NAIL_ENHANCEMENT_GUIDE;
}

export function getNailArtTraditions(communityId) {
  const traditions = {
    'south-asian': NAIL_ART_TRADITIONS.henna_nails,
    'arab': NAIL_ART_TRADITIONS.nail_art_arab_middle_eastern,
    'west-african': NAIL_ART_TRADITIONS.nail_art_west_african,
    'black-american': NAIL_ART_TRADITIONS.nail_art_west_african,
    'east-african': NAIL_ART_TRADITIONS.nail_art_west_african,
    'east-asian': NAIL_ART_TRADITIONS.nail_art_east_asian,
    'latina': NAIL_ART_TRADITIONS.nail_art_west_african,
    'caribbean': NAIL_ART_TRADITIONS.nail_art_west_african,
  };
  return traditions[communityId] || NAIL_ART_TRADITIONS;
}

export function getNailColourGuide() {
  return NAIL_COLOUR_GUIDE;
}

export function getSafeRemovalGuide(enhancementType) {
  return SAFE_REMOVAL_GUIDE[enhancementType] || SAFE_REMOVAL_GUIDE;
}

export function getMelanonychiInfo() {
  return MELANONYCHIA_GUIDE;
}

export const NAIL_CARE_STATS = {
  communitiesWithNailGuide: Object.keys(COMMUNITY_NAIL_NOTES).length,
  enhancementTypesCovered: Object.keys(NAIL_ENHANCEMENT_GUIDE).filter(k => k !== 'overview').length,
  nailArtTraditions: Object.keys(NAIL_ART_TRADITIONS).length,
};
