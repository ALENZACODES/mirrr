/**
 * MIRRR Advanced Nail Art & Nail Care Guide
 * Gel nails, acrylics, nail art techniques, nail health,
 * ethnic nail traditions, and community-specific practices
 */

// ─── NAIL ANATOMY ─────────────────────────────────────────────────────────────

export const NAIL_ANATOMY = {
  structure: {
    nail_plate: 'The hard, visible part of the nail. Made of keratin — same protein as hair. Grows from the matrix (under the skin at the base).',
    nail_matrix: 'The living tissue under the base of the nail where new nail cells are produced. The half-moon (lunula) is the visible part of the matrix.',
    nail_bed: 'The skin beneath the nail plate. Pink colour comes from blood vessels underneath.',
    cuticle: 'The thin skin that overlaps the nail plate at the base. Provides a seal against bacteria and fungi entering the matrix. DO NOT cut cuticles — push back gently when needed.',
    lunula: 'The white half-moon at the base of the nail. More visible on thumbnails. Represents the most recently produced nail cells.',
    hyponychium: 'The skin under the free edge of the nail — the seal between nail plate and nail bed.',
  },

  nail_growth: {
    rate: 'Fingernails grow approximately 3mm per month. Toenails grow much slower (~1.5mm/month). Full regrowth from matrix: ~6 months for fingernails.',
    faster: 'Dominant hand, summer months, pregnancy, young age, warm climate all accelerate nail growth.',
    slower: 'Age, illness, poor circulation, thyroid issues, nutritional deficiencies slow growth.',
  },
};

// ─── NAIL PRODUCTS GUIDE ──────────────────────────────────────────────────────

export const NAIL_PRODUCTS_GUIDE = {
  regular_polish: {
    what: 'Standard nail lacquer — air-dries, typically lasts 3-7 days before chipping.',
    pros: ['No UV lamp needed', 'Easy removal', 'Cheap', 'No damage to nail plate if used with base coat'],
    cons: ['Chips quickly', 'Doesn\'t achieve the "hard gel" look', 'Slower drying'],
    best_brands: {
      budget: ['Sally Hansen (huge shade range, widely available)', 'OPI Studio — drugstore sub-line', 'essie (excellent formula, classic shades)', 'China Glaze'],
      mid: ['OPI Nail Lacquer (industry standard)', 'Zoya (5-free formula, ethical)', 'Deborah Lippmann'],
      luxury: ['Dior Vernis', 'Chanel Le Vernis', 'Hermès Les Mains'],
    },
  },

  gel_polish: {
    what: 'UV/LED-cured polish that bonds to the nail plate. Lasts 2-3 weeks without chipping. Requires UV or LED lamp to cure.',
    types: {
      soft_gel: 'Standard gel polish (Gelish, OPI GelColor, CND Shellac) — thin layer that adds colour and shine but minimal thickness.',
      hard_gel: 'Builder gel — creates extensions, can sculpt and shape. Soak-off or filed off.',
      gel_x: 'Pre-formed gel tips (Aprés Gel-X) — full coverage press-ons in various shapes, applied with bond and activator.',
    },
    pros: ['2-3 week wear', 'High gloss', 'Resistant to chipping', 'Flexible — follows nail movement'],
    cons: ['UV exposure (use SPF on hands or gloves during curing)', 'Requires proper removal — pick-off damages nail severely', 'Regular removal appointments needed'],
    removal: {
      correct: 'File off the shine layer, wrap nails in acetone-soaked cotton secured with foil, wait 10-15 minutes, gently push off softened gel with cuticle pusher.',
      never: 'Never peel, pick, or pull off gel — you remove layers of the nail plate with it.',
    },
  },

  acrylics: {
    what: 'A two-component system — acrylic liquid monomer + acrylic powder polymer — that forms a hard material for nail extensions.',
    how: 'Applied as a bead that self-levels; shaped before hardening. Can extend the nail significantly or overlay the natural nail for strength.',
    pros: ['Very strong', 'Long-lasting (2-3 weeks fill)', 'Can create extreme lengths/shapes', 'Less expensive than gel extensions at a salon'],
    cons: ['Requires professional application', 'Odorous chemicals (MMA monomer in cheap salons is dangerous — insist on EMA)', 'Rigidity means can "pop" under pressure causing nail trauma', 'Requires regular infills'],
    mma_warning: 'Some discount nail salons use MMA (methyl methacrylate) monomer — banned or restricted in many countries due to adverse effects. Signs: extremely hard to remove, very strong smell. Insist on EMA (ethyl methacrylate) only.',
    removal: 'Soak in acetone for 20-40 minutes. Do not force off.',
  },

  dip_powder: {
    what: 'Acrylic polymer powder system — nails are brushed with bond/base, then dipped into coloured powder multiple times, sealed with activator and top coat. No UV lamp.',
    pros: ['No lamp needed', 'Strong', '3-4 week wear', 'Lighter than acrylics'],
    cons: ['Hygiene concerns with dip pots in salons (shared pots spread bacteria/fungi)', 'Some contain high acrylic content with potential sensitisation'],
    hygiene: 'Always have powder poured or sprinkled onto your nails, never dip your fingers directly into a communal pot.',
  },

  press_ons: {
    what: 'Pre-made nail tips applied with nail glue or adhesive tabs.',
    renaissance: 'Press-on nail quality has dramatically improved. High-quality press-ons (KISS, Static Nails, custom sets) can look identical to salon gel nails.',
    pros: ['Salon quality at home', 'No damage if applied/removed correctly', 'Affordable', 'Changeable'],
    application: ['Prep nails — push back cuticles, lightly buff surface, alcohol wipe', 'Find correct size for each nail', 'Apply small amount of glue to nail plate and/or back of press-on', 'Press firmly at an angle from cuticle to tip', 'Hold 20-30 seconds'],
    removal: ['Soak in warm soapy water for 10-15 minutes', 'Or oil-based remover or acetone', 'Gently slide off — do not force'],
  },
};

// ─── NAIL SHAPES GUIDE ────────────────────────────────────────────────────────

export const NAIL_SHAPES_GUIDE = {
  shapes: {
    square: {
      what: 'Straight sides, flat tip. Classic and clean.',
      best_for: 'Short to medium nails. Wide nail beds.',
      not_for: 'Very narrow nails (makes them look wider).',
    },
    squoval: {
      what: 'Mostly square with softly rounded corners — an easy, flattering shape.',
      best_for: 'All nail beds. The most practical daily shape.',
    },
    round: {
      what: 'Follows the natural curve of the fingertip. Soft and natural.',
      best_for: 'Short nails, wide nail beds. Very practical.',
    },
    oval: {
      what: 'Elongated rounded shape — narrows toward the tip.',
      best_for: 'Elongates fingers. Suits wider nail beds. Classic "elegant" shape.',
    },
    almond: {
      what: 'Similar to oval but more tapered — like an almond. Requires some length.',
      best_for: 'Elongates short fingers. Suits wider nails. Very glamorous.',
    },
    stiletto: {
      what: 'Dramatically pointed. Requires extensions for most natural nails.',
      best_for: 'Bold, dramatic looks. Nail art canvas.',
      practical: 'Not practical for daily tasks — extremely long pointed tips break easily.',
    },
    coffin_ballerina: {
      what: 'Long with straight sides that taper and then a flat squared-off tip. Named for its shape resemblance.',
      popularity: 'Extremely popular in Black, Latina, and Caribbean beauty culture. Iconic shape particularly in these communities.',
      requires: 'Length — either natural or extensions.',
    },
    flare_duck: {
      what: 'Wider at the tip than the base — flared out. A more unconventional, statement shape.',
      origin: 'Particularly associated with Asian nail art culture (Japan, Korea) and now influencer nail culture.',
    },
    lipstick: {
      what: 'One side angled across the tip — asymmetrical, like a lipstick bullet.',
      origin: 'Popularised in J-beauty nail art. Distinctively editorial.',
    },
  },

  by_hand_shape: {
    short_fingers: 'Oval, almond, or coffin extensions elongate the appearance of fingers.',
    long_fingers: 'Most shapes flatter. Square and squoval look particularly chic.',
    wide_nail_bed: 'Almond and oval shapes visually narrow. Avoid very square shapes.',
    narrow_nail_bed: 'Square or coffin shapes add visual width.',
  },
};

// ─── NAIL ART TECHNIQUES ──────────────────────────────────────────────────────

export const NAIL_ART_TECHNIQUES = {
  freehand_painting: {
    what: 'Painting designs directly onto the nail with a brush.',
    tools: [
      'Thin detail brush (size 00 or liner brush) — for fine lines, lettering',
      'Flat shader brush — for abstract shapes, colour blocking',
      'Fan brush — for gradient/ombre effects',
      'Dotting tool — for dots, flowers, polka dots',
    ],
    beginner_designs: [
      'Negative space — leaving bare nail showing through geometric designs',
      'French tip — classic or coloured',
      'Polka dots — dotting tool + any colour',
      'Abstract paint strokes — no precision required',
      'Gradient/ombre — two polish colours blended on a makeup sponge then dabbed onto nail',
    ],
    tips: [
      'Work with thin coats — thick polish bleeds and takes forever to dry',
      'A light coat of base colour helps nail art colours pop',
      'Use a small amount of polish at a time on your brush',
      'Clean brush with acetone between colours',
      'Top coat locks in the art and adds shine',
    ],
  },

  stamping: {
    what: 'Metal plates with engraved designs + a stamper pad. You scrape polish over the plate, pick up the design with the stamper, and roll it onto the nail.',
    brands: ['Konad (original stamping plates)', 'Bundle Monster', 'Moyou London', 'Born Pretty'],
    special_polish: 'Stamping requires thick, highly pigmented polish — regular polish doesn\'t transfer. Buy stamping-specific polishes.',
  },

  foils_and_chrome: {
    nail_foils: 'Metallic or patterned foil applied to tacky gel or special glue — creates metallic, holographic, or patterned effects.',
    chrome_powder: 'Ultra-fine metallic powder rubbed onto gel (while cured but not topped) with a sponge tip applicator — creates mirror-chrome or duochrome effect. Extremely popular in Korea and globally.',
    technique: 'Apply over gel layer, cure, rub chrome powder with applicator in circular motions. Do not add top coat — it removes the effect (use Chrome-compatible top coat).',
  },

  '3d_nail_art': {
    what: 'Raised, dimensional elements on nails — acrylic roses, gems, charms, gel flowers.',
    methods: [
      'Acrylic flowers — sculpted from acrylic mix on the nail',
      'Gel art — building texture with thick builder gel',
      'Nail charms and gems — adhered with gel or glue',
      'Gel stickers — flat but pre-made designs applied to tacky gel',
    ],
    origin: 'Japan is known for 3D nail art — elaborate sculpted designs are a specialist skill there.',
  },

  gel_marbling: {
    what: 'Two or more gel colours swirled together before curing for a marble effect.',
    technique: 'Apply dots of different colours, use a brush or tool to swirl in figure-8 or random motions, cure.',
  },

  water_marbling: {
    what: 'Drop nail polish into water, create a design in the water with a tool, dip finger through the design.',
    tips: 'Room temperature water (cold slows spread), use fresh polish, surface cleanup is required after.',
  },

  nail_wraps_stickers: {
    what: 'Pre-designed nail wrap or sticker systems that apply over bare or polished nails.',
    brands: ['Sally Hansen Salon Effects', 'Olive & June Nail Art Stickers'],
    best_for: 'Beginners, those without artistic skills, quick detailed looks.',
  },
};

// ─── NAIL HEALTH ──────────────────────────────────────────────────────────────

export const NAIL_HEALTH_GUIDE = {
  common_problems: {
    brittle_nails: {
      causes: ['Low iron/ferritin', 'Low biotin (rare)', 'Thyroid dysfunction', 'Over-exposure to water/detergents', 'Ageing'],
      treatment: [
        'Wear gloves for household cleaning',
        'Apply cuticle oil daily (jojoba, vitamin E)',
        'Test and address nutritional deficiencies',
        'Keep nails shorter during strengthening period',
        'Use a nail strengthener (OPI Natural Nail Strengthener, Nailtiques)',
      ],
    },
    white_spots: {
      leukonychia: 'White spots or patches on nails are usually minor trauma to the matrix — bumped or squeezed the base of the nail. NOT a sign of calcium deficiency (a widespread myth).',
    },
    ridges: {
      vertical: 'Vertical ridges (from base to tip) — completely normal, become more pronounced with age.',
      horizontal: 'Horizontal ridges (Beau\'s lines) — indicate a period when nail growth was disrupted (illness, severe stress, pregnancy, nutritional deficiency). Timeline: each mm of nail was grown ~1 month ago.',
    },
    discolouration: {
      yellow: 'Yellow nails — typically from nail polish staining (use base coat), rarely from fungal infection or systemic issues.',
      dark_streak: 'A dark longitudinal streak in the nail (subungual melanonychia) — especially new or widening streaks — MUST be evaluated by a dermatologist. In darker-skinned individuals this is often benign (racial melanonychia), but melanoma can occur under the nail.',
      subungual_melanoma: 'Acral lentiginous melanoma — the type of melanoma Bob Marley died of — often starts under the nail as a dark streak. More common in people of colour than in white people as a proportion of their melanoma cases. Any new or changing dark streak under a nail = see a dermatologist.',
    },
    onychomycosis: {
      what: 'Fungal nail infection. Yellow, thickened, crumbly, distorted nails — typically starting at the tip and spreading.',
      treatment: 'Oral antifungals (terbinafine, itraconazole) — most effective. Long course (6-12 weeks for fingernails, 12+ weeks for toenails). Topical antifungals (amorolfine lacquer, efinaconazole) for mild/early infections. Very slow to clear — new nail must grow in fully.',
    },
  },

  nail_care_routine: {
    basic: [
      'Keep nails clean and dry (fungi love moisture)',
      'Apply cuticle oil daily — the single most impactful nail habit',
      'Moisturise hands thoroughly — nail health mirrors skin hydration',
      'Use base coat under all colour — prevents staining and creates adhesion',
      'File in one direction only — back-and-forth weakens the nail edge',
      'Wear gloves for cleaning and household chemicals',
    ],
    cuticle_care: {
      do: 'Push cuticles back gently with a cuticle stick after shower when soft. Apply cuticle oil.',
      dont: 'DO NOT cut cuticles — they seal the matrix against infection. Cutting leads to hangnails, inflammation, and risk of bacterial/fungal infection.',
    },
  },
};

// ─── NAIL TRADITIONS BY COMMUNITY ─────────────────────────────────────────────

export const NAIL_TRADITIONS = {
  south_asian: {
    henna_nails: {
      what: 'Painting fingernails with henna — the underside of the nail turns a rich orange-brown colour from henna pigment.',
      tradition: 'Traditional bridal nail practice across South Asian cultures — henna application to nails part of the broader mehndi ceremony.',
      how: 'Apply henna paste to the full nail, wrap in plastic for 6-8 hours, reveal deep orange colour. Colour intensifies over 24-48 hours.',
    },
    bridal: 'Elaborate nail art with gold and jewel embellishments for South Asian weddings. Increasingly, full 3D nail art sets are commissioned for brides.',
    colour: 'Rich reds, maroons, and golds are traditional bridal colours. Modern South Asian bridal nail artists incorporate traditional motifs (paisleys, mandalas) into nail art.',
  },

  arab: {
    henna: 'Henna nail practice is also traditional across Arab and North African cultures — particularly at celebrations, Eid, and weddings.',
    modern: 'Gulf states (UAE, Saudi Arabia) have a thriving luxury nail culture — gel nail salons are extremely popular, elaborate nail art is mainstream.',
    colour: 'Bold reds, rich burgundy, gold, and nude-to-skin-tone (the French style equivalent) are popular.',
  },

  west_african_black_american: {
    coffin_nails: 'The coffin (ballerina) shape has particularly deep roots in Black American nail culture. Long, shaped acrylics became an iconic element of Black women\'s beauty culture from the 1980s-90s onward.',
    nail_art_culture: {
      history: 'Black nail artists and nail tech culture has driven nail art innovation in the US — bedazzled nails, press-on nail art, elaborate hand-painted designs.',
      airbrush: 'Airbrush nail art — iconic in 90s and early 2000s Black beauty culture — is experiencing a major revival.',
      gems_and_charms: 'Jeweled, embellished nail art with Swarovski crystals, nail charms, gold foil is deeply embedded in the aesthetic.',
    },
    brands_by_and_for: [
      'KISS — Black-founded nail brand, the largest press-on nail brand in the US. Revolutionised accessible nail care.',
      'Emi Jay — founded by a Black entrepreneur (though not primarily nail-focused)',
      'Elegant Touch — Black-owned, UK-based nail brand',
    ],
  },

  east_asian: {
    japanese: {
      nail_art: 'Japan treats nail art as an art form — "nail salons" in Japan are studios offering elaborate sculpted 3D designs, painted murals, and extreme precision.',
      gel_dominance: 'Japan: gel nails are almost universal. The gel nail market in Japan is enormous.',
      aesthetic: 'Pastel colours, kawaii motifs, precise florals, translucent jelly nails, chrome powder effects.',
      nail_salons_culture: 'Going to the nail salon is a significant social and self-care ritual in Japan — appointments can be hours long for elaborate designs.',
    },
    korean: {
      minimalist: 'Korean nail aesthetic tends toward understated elegance — glass nail (translucent, clear), aura nail, milky shades, subtle chrome effects.',
      glass_nail: 'Translucent gel with pearlescent or holographic chrome powder for a glass-like appearance — associated with Korean nail culture.',
      kuku_nails: 'Korean nail art influencer culture is massive — specific Korean techniques like "blooming nail" (pigment in wet top coat creates a soft bloom effect) originated in Korea.',
    },
    chinese: {
      guochao: 'Chinese nail art increasingly incorporates traditional elements — Chinese opera motifs, ink-painting aesthetics, traditional patterns.',
    },
  },

  latina: {
    ombre: 'Ombre/gradient nails are a popular technique — blending from a lighter shade at the base to a deeper shade at the tip.',
    bold: 'Bold, vivid colours, glitter, and bright statement nails are characteristic of Latina beauty aesthetics.',
    holiday: 'Matching nail art for major celebrations — Dia de los Muertos (skull motifs), Christmas, quinceañera.',
  },

  caribbean: {
    carnival: 'Nails become part of the full Carnival aesthetic — elaborate rhinestone or glitter nails, bright tropicals.',
    colour: 'Bright, tropical colours — turquoise, coral, yellow, hot pink — matching the vibrancy of Caribbean culture.',
  },
};

// ─── NAIL COLOURS FOR SKIN TONES ─────────────────────────────────────────────

export const NAIL_COLOUR_BY_SKIN_TONE = {
  deep_and_dark_skin: {
    note: 'Many nude and nude-pink nail polishes are formulated for light skin tones — they read as pink or grey on dark skin rather than nude. Finding "your nude" requires choosing shades in the caramel-to-deep-brown range.',
    nudes: ['Caramel brown', 'Rich tan', 'Warm deep brown', 'Coffee', 'Chocolate — deep brown reads as a nude on very dark skin'],
    that_pop: ['Cobalt blue', 'Bright red', 'Electric yellow', 'Deep burgundy', 'True white (sharp contrast)'],
    brands_with_deep_skin_nudes: [
      'OPI — deep nudes such as "Don\'t Pretzel My Buttons"',
      'Zoya — wide nude shade range including deeper skin tones',
    ],
  },

  medium_skin: {
    nudes: ['Peachy beige', 'Warm sand', 'Light caramel', 'Dusty mauve'],
    that_pop: ['Coral', 'Berry', 'Warm red', 'Emerald', 'Burnt orange'],
  },

  light_skin: {
    nudes: ['Sheer pink', 'Pale beige', 'Ballet pink', 'Barely there blush'],
    that_pop: ['Classic red', 'Navy', 'Forest green', 'Burgundy'],
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getNailAnatomyGuide() {
  return NAIL_ANATOMY;
}

export function getNailProductsGuide(type) {
  if (type && NAIL_PRODUCTS_GUIDE[type]) return NAIL_PRODUCTS_GUIDE[type];
  return NAIL_PRODUCTS_GUIDE;
}

export function getNailShapesGuide() {
  return NAIL_SHAPES_GUIDE;
}

export function getNailArtTechniques(technique) {
  if (technique && NAIL_ART_TECHNIQUES[technique]) return NAIL_ART_TECHNIQUES[technique];
  return NAIL_ART_TECHNIQUES;
}

export function getNailHealthGuide() {
  return NAIL_HEALTH_GUIDE;
}

export function getNailTraditionsForCommunity(communityId) {
  return NAIL_TRADITIONS[communityId] || null;
}

export function getNailColourForSkinTone(depth) {
  const map = {
    deep: NAIL_COLOUR_BY_SKIN_TONE.deep_and_dark_skin,
    medium: NAIL_COLOUR_BY_SKIN_TONE.medium_skin,
    light: NAIL_COLOUR_BY_SKIN_TONE.light_skin,
  };
  return map[depth] || NAIL_COLOUR_BY_SKIN_TONE;
}

