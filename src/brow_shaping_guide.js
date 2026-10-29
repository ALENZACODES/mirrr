/**
 * MIRRR Brow Shaping Guide
 * Full eyebrow guide for ethnic communities
 * Threading, waxing, lamination, mapping, community traditions
 */

// ─── WHY BROWS MATTER ─────────────────────────────────────────────────────────

export const BROW_FUNDAMENTALS = {
  why_brows_change_faces: 'Eyebrows are architecturally the most face-defining feature. They frame the eyes, affect perceived age and emotion, and communicate identity. This is why brow trends spark cultural moments — the 90s thin pencil, the 2010s Instagram arch, the current fluffy natural. Each brow trend carries a cultural meaning.',

  the_ethnic_brow_difference: {
    context: 'For South Asian, Arab, Middle Eastern, Latina, and many other ethnic communities, thick, defined eyebrows are a natural genetic trait and a cultural beauty marker. The Western brow culture has historically tried to impose narrow, over-shaped brows on naturally thick brows — this is now being reclaimed.',
    south_asian: 'Full, dark, defined brows are a universal beauty feature in South Asian culture — emphasised in Bollywood aesthetics for decades. The sharp, arched brow is iconic.',
    arab: 'Arab beauty culture celebrates extremely well-defined brows — precise shaping (threading is the art form here) with significant fullness and a defined arch. The "Arabic brow" is a reference aesthetic.',
    west_african: 'Full brows are valued. The trend toward filled, defined brows in mainstream culture was significantly influenced by Black and Latina beauty aesthetics.',
    east_asian: 'Brow aesthetics vary significantly — Japanese beauty favours straight, flat brows (historically and in modern soft-arch trend), Korean beauty favours feathery straight-ish brows, and Chinese beauty ranges widely.',
  },
};

// ─── BROW MAPPING ─────────────────────────────────────────────────────────────

export const BROW_MAPPING = {
  what: 'Brow mapping is the technique of identifying the ideal brow shape for a specific face — using measurements to determine where the brow should START, where its ARCH should be, and where it should END.',

  three_points: {
    head: {
      what: 'Where the brow begins (inner corner)',
      how_to_find: 'Hold a straight pencil vertically against the side of the nose. Where it crosses the brow is the start point. Hairs between the brows that fall inside this point are typically removed (though bushy unibrows are a personal/cultural choice).',
      note: 'For South Asian and Arab women especially: the natural brow start may be significantly thicker and more inner than mainstream advice suggests. Do NOT over-remove the inner brow — this is where natural thickness and ethnic brow character lives.',
    },
    arch: {
      what: 'The highest point of the brow',
      how_to_find: 'Hold the pencil from the side of the nose angling it through the outer edge of the iris (pupil edge when looking straight ahead). Where it crosses the brow = apex of arch.',
      cultural_variation: {
        south_asian_arch: 'South Asian brow aesthetics often prefer a very distinct, higher arch — the "pencil sharp" arch seen in Bollywood imagery',
        arab_arch: 'Arab brow mapping creates a clean, defined arch — very precise lines both above and below the arch',
        east_asian_arch: 'East Asian (Korean, Japanese) brow aesthetics trend toward a very soft or almost flat arch — the brow flows horizontally rather than curving sharply upward',
        black_american: 'Defined arch is standard in Black beauty aesthetics, though the height varies by personal preference and face shape',
      },
    },
    tail: {
      what: 'Where the brow ends (outer tip)',
      how_to_find: 'Hold the pencil from the side of the nose angling to the outer corner of the eye. Where it crosses the brow = tail end.',
      important: 'The tail should NEVER end higher than the head — this creates an unbalanced, surprised look. Ideally the tail ends at the same level as or slightly below the brow head.',
    },
  },

  brow_measurements: {
    ideal_thickness: 'There is no single "ideal" thickness. The ideal brow is thick enough to balance your face. Generally: larger, rounder faces → thicker brows; smaller, more angular faces → can carry thinner brows.',
    ethnic_standard: 'For ethnic communities with naturally thicker brows, the "ideal" is to maintain and shape the natural thickness — not to thin it to a European standard.',
  },
};

// ─── BROW SHAPES BY FACE SHAPE ────────────────────────────────────────────────

export const BROW_FOR_FACE_SHAPE = {

  oval: {
    description: 'Oval is the "ideal" face shape for most brow styles — length is about 1.5x the width, no very strong jaw or forehead',
    recommended: 'Soft arch — most brow shapes work. A gently arched, well-groomed version of your natural brow.',
    avoid: 'Nothing is off-limits — enjoy experimenting',
  },

  round: {
    description: 'Face is nearly as wide as it is long — soft jaw, full cheeks',
    goal: 'Add definition and length — create the illusion of a longer, more angular face',
    recommended: 'High, angular arch — the higher the arch, the more it elongates the face. Brows should be well-defined.',
    avoid: 'Very round, flat brows — this emphasises roundness',
    ethnic_context: 'Round face shapes are very common across Asian communities. Korean and Japanese brow trends (soft, rounded brows) can work beautifully here but an angular brow is more elongating.',
  },

  square: {
    description: 'Strong, wide jaw similar width to forehead — angular features',
    goal: 'Soften the jaw-to-forehead ratio — add curves to balance angles',
    recommended: 'Full, slightly curved brow — avoid very angular/harsh brows which emphasise the square angle. Soft arch, rounded at the peak.',
    avoid: 'Very flat brows, very sharp angular arches',
  },

  heart: {
    description: 'Wide forehead tapering to a pointed or narrow chin',
    goal: 'Balance the wide upper third with the narrow lower',
    recommended: 'Low arch, full brow — a fuller, naturally lower arch draws attention down and balances the wide forehead',
    avoid: 'Very high, dramatic arches — they will make the forehead look even wider',
  },

  long: {
    description: 'Face is significantly longer than wide — elongated',
    goal: 'Visually shorten the face — add horizontal width',
    recommended: 'Flat, horizontal brows with minimal arch — extends the brow outward horizontally',
    avoid: 'Very high arches which further elongate the face',
    ethnic_context: 'Longer face shapes appear commonly in East African communities. This brow advice counterbalances the length.',
  },

  diamond: {
    description: 'Narrow forehead, wide cheekbones, narrow chin — widest at cheek level',
    goal: 'Soften the cheekbones visually',
    recommended: 'Brow with a curved arch that isn\'t too angular — the eyebrow should detract from the strong cheekbone width, not add more angles',
  },
};

// ─── BROW SHAPING METHODS ─────────────────────────────────────────────────────

export const BROW_SHAPING_METHODS = {

  threading: {
    what: 'A piece of cotton thread is twisted and rolled over the skin, trapping and pulling hair from the root. Originated in Persia/Iran, spread throughout Middle East and South Asia.',
    who_practices: 'Professional threaders at Indian/South Asian beauty salons, Arab/Middle Eastern salons, and increasingly mainstream salons',
    pros: [
      'Extreme precision — can shape individual hairs',
      'No chemicals — nothing touches the skin except the thread',
      'No heat or allergic reaction risk',
      'Suitable for ALL skin types including sensitive and acne-prone',
      'Creates very clean, defined lines',
      'Very fast in skilled hands',
    ],
    cons: [
      'Requires a skilled technician — home threading is difficult to learn',
      'Can cause some redness immediately after (fades within 30 minutes)',
      'Stings slightly — more than waxing for some people (very personal)',
    ],
    results: 'Hair removed from root — results last 3-4 weeks',
    ethnic_significance: 'Threading is the dominant brow method in South Asian and Arab communities. Indian beauty supply stores have threading services, often at very affordable prices. Finding an Indian or Arab threader is generally the best way to get authentic threading results.',
    what_to_expect: 'The threader will hold one end of the thread in their mouth or fingers and guide the other end with their hand. You\'ll feel a quick sensation like a tiny comb going over your skin, then the hair is gone. Much less pull on the skin than waxing.',
  },

  waxing: {
    what: 'Hot wax (or sugar wax/halawa) applied to brow area, cloth or strip pressed on, pulled against hair growth',
    pros: [
      'Fast',
      'Clean removal of many hairs at once',
      'Available at most beauty salons',
      'Results last 4-6 weeks',
    ],
    cons: [
      'Risk of over-waxing (once waxed away, must wait for regrowth)',
      'Risk of skin lifting (especially on older skin or those using retinoids)',
      'Chemical reactions possible with some wax types',
      'PIH risk on darker skin from skin trauma of the wax pull',
    ],
    ethnic_skin_warning: 'Tell your wax technician you are on retinol, AHA, BHA, or any prescription skincare — these thin the skin and waxing can lift skin. Most technicians should ask but many don\'t. MUST avoid waxing if using tretinoin.',
    halawa_brows: {
      what: 'Arab/Persian tradition — sugar wax (halawa) for brow shaping',
      advantages: 'Less skin-damaging than hot wax, water-soluble, traditional',
      find_it: 'Middle Eastern salons, some Indian beauty salons',
    },
  },

  tweezing_plucking: {
    what: 'Individual hairs removed with tweezers',
    pros: ['At-home friendly', 'Precise', 'No risk of removing too much at once (only one hair at a time)', 'Good for maintenance between appointments'],
    cons: ['Time-consuming', 'Easy to over-pluck when doing at-home', 'Stings slightly'],
    tips: [
      'Only tweeze after threading or waxing appointment to maintain shape — never try to shape your brows by tweezing alone from scratch',
      'Tweeze in the direction of hair growth',
      'Tweeze after shower when pores are open and skin is softer — less pull',
      'Tweeze in good light near a mirror (not a magnifying mirror — creates optical illusion making you pluck too much)',
    ],
    ethnic_warning: 'AVOID over-tweezing thick ethnic brows — once the follicle is repeatedly damaged, hair may not grow back. The 90s over-tweezing trend left permanent sparse brows on a generation of South Asian and Arab women who over-plucked.',
  },

  tinting: {
    what: 'Dye applied to brow hairs to deepen or change colour',
    who_needs_it: 'Those with light or greying brows, or those who want more defined brows without daily filling',
    process: 'Takes 10-15 minutes in salon; results last 4-6 weeks as dye fades',
    ethnic_skin_note: 'South Asian, Arab, and Black brows are typically already very dark brown to black. Tinting is less relevant for naturally dark brows UNLESS you want to colour correct grey hairs or add dimension.',
    for_grey_coverage: 'Great for adding colour back to greying brows without daily pencilling',
  },

  lamination: {
    what: 'A chemical straightening/lifting treatment applied to brow hairs — like a perm for eyebrows. Creates the "fluffy," upswept brow look popular since 2020.',
    process: '1. Lifting cream applied (breaks the hair\'s disulfide bonds), 2. Hairs combed upward in desired direction, 3. Setting cream applied (reforms bonds in new position), 4. Optional tint added. Takes 45-60 minutes.',
    results: 'Brows stay in lifted, fluffy position for 4-8 weeks',
    pros: ['No daily brushing needed', 'Creates the trendy thick, fluffy look', 'Works with natural brow hairs'],
    cons: ['Can cause over-processing if done too frequently', 'Hairs can become brittle with repeated use', 'Hair must be long enough to laminate'],
    ethnic_suitability: {
      south_asian: 'Works very well — thick, dark brow hairs laminate beautifully to create a very full, defined look',
      arab: 'Excellent results — strong hair responds well to lamination',
      east_asian: 'Works very well — the straight, full Korean brow look is achieved with lamination',
      west_african: 'Works for most hair textures, though very coily brow hairs may need more sets to hold',
    },
  },

  microblading: {
    what: 'Semi-permanent cosmetic tattooing — a handheld blade deposits pigment in hair-stroke patterns in the skin',
    results: 'Natural-looking brow strokes that mimic real hair. Lasts 1-3 years.',
    process: 'Initial appointment (2-3 hours) + mandatory touchup at 6-8 weeks',
    pain: 'Topical numbing cream applied — mild sensation, not typically painful',
    pros: ['Life-changing for sparse or over-plucked brows', 'Daily brow makeup eliminated', 'Natural-looking when done well'],
    cons: ['Expensive ($400-1200)', 'Fades and needs touchups every 1-2 years', 'Carries risk if artist is unskilled'],
    ethnic_skin_critical_warning: {
      issue: 'Microblading on deeper skin tones is HIGH RISK if the artist is not specifically trained in dark skin tones. The pigment can spread, heal too dark, or create an ashy/blue-grey result.',
      risks_for_dark_skin: [
        'Pigment migration (strokes blur and widen)',
        'Colour heals too dark or ashy',
        'Keloid formation at the cuts (higher risk in Fitzpatrick IV-VI)',
        'PIH around the treatment area',
      ],
      safer_alternative: 'Powder brows (also called ombre brows or microshading) use a machine with dots of pigment rather than cuts — MUCH safer for darker skin tones and heals more predictably.',
      how_to_find_right_artist: [
        'Ask specifically: "How many clients with my skin tone have you treated? Can I see healed results?"',
        'Look at HEALED photos (not fresh). Fresh microblading always looks great — healed results show the real outcome.',
        'Seek artists who have specific training in darker skin tone applications',
        'South Asian and Black beauty communities have specific artists with experience — seek them out',
      ],
    },
  },
};

// ─── FILLING BROWS IN ─────────────────────────────────────────────────────────

export const BROW_FILLING_GUIDE = {
  products: {
    brow_pencil: {
      what: 'A precision pencil for drawing individual strokes and filling gaps',
      best_for: 'Natural-hair-stroke effect, precision work, lighter and medium brows',
      technique: 'Short, light strokes in the direction of hair growth — never one continuous line through the brow (looks harsh)',
      shade_selection: 'Choose ONE shade lighter than your brow hairs (or your hair colour) — darker makes brows look drawn-on',
    },
    brow_pomade: {
      what: 'A cream/gel product in a pot, applied with an angled brush',
      best_for: 'Bold, defined, long-lasting brow looks; editorial looks; filling in very sparse brows',
      technique: 'Angled brush lightly loaded with product — define the shape first, then fill in',
      popular_in: 'Arab and South Asian bridal makeup — the bold, sharp defined brow',
      long_wear: 'Pomade can last all day — great for brides and events',
    },
    brow_powder: {
      what: 'Eyeshadow-like powder applied with an angled brush',
      best_for: 'Soft, natural look — the least harsh-looking product',
      technique: 'Light sweeping motions, built up gradually',
      best_for_skin_type: 'Oily skin — powder doesn\'t migrate like pomade or pencil',
    },
    brow_gel: {
      what: 'Mascara-like wand, either clear or tinted, that sets and styles brow hairs',
      clear_gel: 'Just styles hairs — no colour added. Excellent for lamination look at home.',
      tinted_gel: 'Adds colour and style simultaneously. Less defined than pencil but more natural.',
      who_needs_it: 'Anyone with naturally full brows who just wants to set them in place',
    },
    brow_soap: {
      what: 'A bar of glycerin soap combed through brows for an extremely fluffy, lifted, stiff hold',
      trend: 'The "soap brow" trend went viral as a DIY version of brow lamination',
      how_to: 'Wet a spoolie brush, run over a bar of clear glycerin soap, comb through brows upward. Works as a hold and lifts hairs.',
      cost: 'Effectively free — a bar of Dove soap or glycerin soap works',
    },
  },

  shade_guide_by_community: {
    'south-asian': 'Dark brown to espresso (match the very dark hair). Never black — it looks harsh and flat. Dark warm brown.',
    'arab': 'Dark brown to espresso, sometimes true black for very dramatic looks. The clean line is as important as the colour.',
    'west-african': 'Dark brown to espresso for dark hair. If hair is dyed, match the hair colour.',
    'black-american': 'Dark brown to espresso. Cool-toned if your undertone is cool; warm dark brown if warm.',
    'east-asian': 'Interesting variation — Korean and Japanese brow trends often favour a SOFTER, slightly lighter brow than hair colour. Medium brown, dark taupe, or slightly warm dark brown rather than black or very dark espresso.',
    'latina': 'Dark brown to espresso for dark hair. Warm tones work beautifully with warm Latino skin.',
    'east-african': 'Rich dark brown, espresso — match the brow hair naturally.',
  },
};

// ─── THE UNIBROW ─────────────────────────────────────────────────────────────

export const UNIBROW_GUIDE = {
  cultural_context: 'The unibrow (monobrow, synophrys, or وصل الحاجبين in Arabic) has complex cultural history. In ancient Greek and Persian culture, the unibrow was considered beautiful. Frida Kahlo famously kept and drew attention to her unibrow as a statement. In contemporary Arab and South Asian communities, the space between the brows is typically threaded to create two separate brows — but this is a personal choice.',
  frida_kahlo: 'The most globally famous unibrow — Frida Kahlo\'s bold, ungroomed brow was an act of political resistance against European beauty standards applied to Mexican/indigenous women.',
  current_trend: 'The "unibrow" is experiencing a cultural moment — particularly among South Asian, Arab, and Latina women who are choosing to leave their natural brows unthreaded as a rejection of Eurocentric beauty norms.',
  management: 'If you want to manage a unibrow, threading or waxing the connecting hairs between the brows is standard. The amount removed is entirely a personal choice — from a clean separation to leaving a slight closeness between the brows.',
};

// ─── BROW TRADITIONS ─────────────────────────────────────────────────────────

export const BROW_TRADITIONS = {
  threading_culture: {
    origin: 'Eyebrow threading originated in Persia (Iran) and spread through the Middle East, Central Asia, and South Asia. Indian immigrants brought threading to the UK, US, and Canada in the 20th century.',
    in_india: 'Threading (known as khite in Hindi, eyebrow threading in English) is the standard beauty service in Indian beauty salons. Often done while sitting in front of a mirror as a communal experience.',
    in_arab_world: 'Threading (known as إزالة الشعر بالخيط in Arabic, or "khite") for brows and facial hair is universal. Arab salons use both threading and halawa (sugar wax) depending on client preference.',
  },
  bollywood_brow: {
    what: 'The high, sharp-arched, thick, impeccably shaped brow — the "Bollywood brow" — has been the dominant South Asian brow aesthetic since the 1950s',
    icons: ['Rekha (the ultimate arched brow)', 'Aishwarya Rai (defined natural arch)', 'Deepika Padukone (modern clean arch)', 'Katrina Kaif'],
    influence: 'Has influenced South Asian diaspora brow aesthetics globally — when South Asian women go to salons, the mental image is often a Bollywood brow.',
  },
  korean_straight_brow: {
    what: 'The Korean beauty (K-beauty) aesthetic favours a soft, relatively flat brow — less arched than Western or South Asian standards',
    aesthetic: 'Feathery, slightly unkempt, soft horizontal line — opposite of the sharp defined brow',
    why: 'Cultural beauty value of looking youthful — a rounded face and flat brow signals youth. High arch signals more age.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getBrowGuideForCommunity(communityId) {
  const shadeSuggestions = BROW_FILLING_GUIDE.shade_guide_by_community;
  const faceCommunityNotes = {
    'south-asian': BROW_TRADITIONS.bollywood_brow,
    'arab': BROW_TRADITIONS.threading_culture,
    'east-asian': BROW_TRADITIONS.korean_straight_brow,
  };
  return {
    shadeGuide: shadeSuggestions[communityId] || null,
    communityTraditions: faceCommunityNotes[communityId] || null,
    shapingMethods: BROW_SHAPING_METHODS,
    browMapping: BROW_MAPPING,
  };
}

export function getBrowShapeForFace(faceShape) {
  return BROW_FOR_FACE_SHAPE[faceShape] || null;
}

export function getBrowFillingGuide() {
  return BROW_FILLING_GUIDE;
}

export function getBrowMappingGuide() {
  return BROW_MAPPING;
}

export function getMicrobladingGuide() {
  return BROW_SHAPING_METHODS.microblading;
}

export function getBrowLaminationGuide() {
  return BROW_SHAPING_METHODS.lamination;
}

export const BROW_GUIDE_STATS = {
  shapingMethodsCovered: Object.keys(BROW_SHAPING_METHODS).length,
  faceShapesBrowGuides: Object.keys(BROW_FOR_FACE_SHAPE).length,
  browProductTypes: Object.keys(BROW_FILLING_GUIDE.products).length,
  communitiesWithShadeGuide: Object.keys(BROW_FILLING_GUIDE.shade_guide_by_community).length,
};
