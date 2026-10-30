/**
 * MIRRR Eye Makeup Guide for Ethnic Eye Shapes & Skin Tones
 * Eyeshadow colour theory, eye shape techniques, monolid guide,
 * cut crease for different eye shapes, and community traditions
 */

// ─── EYE ANATOMY & SHAPES ─────────────────────────────────────────────────────

export const EYE_SHAPES_GUIDE = {
  overview: 'Eye shape is determined by the orbital bone structure, the position of the eyelid crease, the amount of visible lid space, and the presence or absence of an epicanthal fold. There is no "ideal" eye shape — makeup technique adapts to enhance any shape.',

  shapes: {
    monolid: {
      what: 'Little or no visible crease when the eye is open. Common in East Asian, Southeast Asian, and some Central Asian communities. Also referred to as single eyelid.',
      
      technique: {
        colour_placement: 'The standard crease technique (placing darker colour in the crease) doesn\'t apply as the crease isn\'t visible when open. Place colour above where your crease would be (approximately where a crease would fall if it existed) — you\'ll need to look with eyes open in the mirror to assess, not just looking down.',
        lid_space: 'The full lid is the canvas. Gradient from light on the inner area to medium on the outer, darkest at the outer corner/lashline, creates depth.',
        cut_crease_for_monolid: 'A cut crease on monolids cuts into the skin above the natural lash area, creating a false crease line. Place cut at approximately 5-7mm above the lashline when eyes are open. Use a firm pencil brush.',
        avoid: 'Extremely dark lid colour top-to-bottom with no variation can make eyes appear more closed.',
        liner: 'Wing liner (cat eye) works beautifully on monolids — the lack of crease means the wing is fully visible. Extend the wing higher to create lift.',
        tape_trick: 'Double-sided eyelid tape or eyelid stickers create a temporary crease if desired. Many people choose to work with their natural monolid.',
      },
    },

    hooded: {
      what: 'The brow bone extends over the eyelid, covering some or all of the mobile eyelid when the eye is open. Gives the appearance of less lid space.',
      
      technique: {
        crease: 'Use the "eyes open" method — apply crease colour while looking straight ahead in the mirror, not with eyes closed. The crease colour needs to be above where the hood sits when eyes are open.',
        halo: 'A halo eye — light on centre of lid, darker on inner and outer — can make eyes appear more open.',
        liner: 'Waterproof liner essential as the hood rubs against the lid. Tight-line (waterline and inner rim) rather than thick lid liner that gets smudged by the hood. Wing liner needs to be angled higher (upward) to be visible and create lift.',
        brow: 'A well-defined, slightly arched brow is crucial for hooded eyes — it creates the illusion of more space above.',
        avoid: 'Heavy dark shadow all over the lid deepens the hood and makes eyes look smaller.',
      },
    },

    almond: {
      what: 'The most "textbook" eye shape — tapers to a point at both ends, visible crease, lid space visible when open. The widest point is in the middle.',
      technique: 'The most versatile shape for most techniques. Classic cut crease, winged liner, smoky eye all translate well.',
    },

    round: {
      what: 'More circular than almond — prominent, wide-looking eyes with visible white above and below the iris. Often associated with Scandinavian and Eastern European features but found across all backgrounds.',
      technique: {
        elongate: 'Apply darker shadow at outer corners to elongate and add drama.',
        liner: 'Extended wing liner elongates the eye. Avoid lining the entire waterline in dark colour as it makes eyes look rounder.',
        cat_eye: 'An extended cat eye is flattering — it pulls the eye shape outward.',
      },
    },

    downturned: {
      what: 'The outer corners turn downward. Common in some East Asian and Middle Eastern features.',
      technique: {
        lift: 'Apply colour in an upward motion at outer corners, sweeping up rather than down.',
        liner: 'Wing liner that angles up sharply creates a lift.',
        avoid: 'Pencilling the outer lower waterline in dark colour can emphasise the downward turn.',
      },
    },

    upturned: {
      what: 'Outer corners turn upward — cat-eye appearance naturally. Often associated with Brigitte Bardot, but found across backgrounds.',
      technique: 'Most liner and shadow styles work beautifully — the natural cat shape flatters most techniques.',
    },

    deep_set: {
      what: 'Eyes appear deeper in the eye socket, with a more prominent brow bone creating a shadow over the lid.',
      technique: {
        brighten: 'Light shimmer or highlight on the lid catches light and brings the eye forward.',
        avoid: 'Very dark shadow on the lid can deepen the appearance further.',
      },
    },

    prominent: {
      what: 'Eyes that project outward from the socket — full, rounded appearance. Characteristic in many West African and Caribbean features.',
      technique: {
        smoky: 'Deeper smudged looks work beautifully on prominent eyes — the full lid space is the perfect canvas.',
        avoid: 'Glittery, highly light-reflecting products on the centre of the lid can make prominent eyes appear even more projected. Use on inner corner only.',
      },
    },

    close_set: {
      what: 'Eyes that are set closer together than average (less space between them than the width of one eye).',
      technique: {
        open: 'Light, bright colour on inner corners. Liner starts from mid-lid, not inner corner. Full dark liner from inner corner makes eyes appear closer.',
        wing: 'Extended outer wing creates width.',
      },
    },

    wide_set: {
      what: 'More space than average between the eyes.',
      technique: {
        draw_in: 'Darker colour at inner corners. Liner starting from the inner corner.',
        brow: 'Start the brow closer to the nose bridge.',
      },
    },
  },
};

// ─── EYESHADOW COLOUR THEORY FOR SKIN TONES ──────────────────────────────────

export const EYESHADOW_BY_SKIN_TONE = {
  principle: 'Contrast and complement. For deep and medium skin tones, deep shades that would "disappear" on lighter skin create beautiful definition. Rich, saturated jewel tones read vibrantly against melanin-rich skin in a way that softer, pastel shades do not.',

  fitzpatrick_i_ii: {
    skin_description: 'Very light, fair to light skin — cool to neutral undertones typical',
    palettes_that_sing: [
      'Warm dusty rose, terracotta, bronzey neutrals create contrast without drama',
      'Soft lavender and muted purples complement cool undertones',
      'Champagne and warm champagne shimmer',
      'Earth tones — mushroom, taupe, warm brown',
    ],
    caution: 'Very dark brown shadows can look harsh without blending skill. Bright colours (neon, bold) can clash with very fair skin — blend well into a softer outer hue.',
  },

  fitzpatrick_iii: {
    skin_description: 'Light to medium skin — olive or warm undertones common; many South Asian, Latina, Arab, Mediterranean individuals',
    palettes_that_sing: [
      'Warm browns, coppers, burnt oranges — bring out warmth',
      'Forest greens and jewel emeralds create striking contrast',
      'Deep plums and burgundy complement olive undertones',
      'Terracotta and warm reds',
      'Gold and bronze shimmer',
    ],
    note: 'This range is extremely versatile — most shadow colours work. The warm/olive undertone means warm-toned shadows look particularly harmonious.',
  },

  fitzpatrick_iv: {
    skin_description: 'Medium to medium-deep skin — warm to golden undertones; common in many South Asian, Latina, Arab, South East Asian individuals',
    palettes_that_sing: [
      'Rich golds, champagne, warm bronzes — luxurious against this skin tone',
      'Jewel tones: emerald, sapphire, amethyst — pop vibrantly',
      'Deep burnt oranges and rusts',
      'Burgundy and deep wine',
      'Warm browns and chocolate shades',
    ],
    note: 'This is where bright, saturated colour really starts to shine. Neons and brights that look harsh on lighter skin look vibrant and joyful here.',
  },

  fitzpatrick_v: {
    skin_description: 'Deep brown skin — warm, cool, or neutral deep undertones; many Black American, West African, South Asian, Latina individuals',
    palettes_that_sing: [
      'Electric blues and cobalt — stunning pop of cool colour',
      'Vivid purples and violets',
      'Rich burnt orange and copper',
      'Bright yellow-gold',
      'Deep blood red and berry',
      'Olive and deep army green',
      'Intense shimmer and glitter catch light beautifully',
    ],
    note: 'Muted, beige-nude shades can look ashy or invisible against deep skin. Lean into saturation and contrast. Dark browns can be beautiful eyelid colours here — create a deep smoky monochromatic look.',
  },

  fitzpatrick_vi: {
    skin_description: 'Very deep skin — intensely dark, melanin-rich; many West African, East African, Black American individuals',
    palettes_that_sing: [
      'Vivid, high-saturation colours across the spectrum — brights live here',
      'Silver and platinum shimmer — stunning contrast',
      'Electric cobalt and teal',
      'Hot pink and fuchsia',
      'Bold metallics: gold, copper, bronze',
      'Graphic black liner against deep skin is iconic',
    ],
    note: 'Many standard eyeshadow palettes are designed for lighter skin and include shades that simply don\'t show on very deep skin — nude/beige shades, taupe, light browns. Seek out palettes from brands like Juvia\'s Place, Uoma Beauty, and Pat McGrath that include high-saturation shades intended for dark skin.',
    brands_for_deep_skin: [
      { brand: 'Juvia\'s Place', note: 'Nigerian-founded, specifically designed for deep skin. The Nubian, African Queen, and Zulu palettes are iconic.' },
      { brand: 'Uoma Beauty', note: 'Pan-African aesthetic, saturated shades' },
      { brand: 'Ami Colé', note: 'Skin-first approach with rich, flattering shades for melanin-rich skin' },
      { brand: 'Pat McGrath', note: 'Ultra-pigmented, high-saturation across all shades' },
      { brand: 'Fenty Beauty', note: 'Extensive deep-shade presence across products' },
    ],
  },
};

// ─── EYESHADOW TECHNIQUES ─────────────────────────────────────────────────────

export const EYESHADOW_TECHNIQUES = {
  classic_smoky: {
    what: 'Dark shade blended from lashline upward into the crease, with a lighter shade in the inner corner and possibly highlight on brow bone.',
    steps: [
      '1. Primer — eyeshadow primer ensures pigment payoff and longevity',
      '2. Transition shade — medium neutral in the crease, blended well before any dark shade',
      '3. Dark shade — start at lashline, work up in small circles into the crease',
      '4. Blend — the secret is all in the blending. Use a clean fluffy brush and work in windshield-wiper motion to diffuse edges',
      '5. Inner corner light shade — reflects light, opens the eye',
      '6. Lower lashline — smudge dark or matching shade on lower lashline for cohesion',
      '7. Liner and mascara',
    ],
    for_ethnic_skin: 'Rich dark browns, blacks, and navies are classic. On medium-deep and deep skin, a dark colour at the lashline blends seamlessly for an intensely sophisticated look.',
  },

  cut_crease: {
    what: 'A defined, crisp line between a colour on the lid and a lighter or contrasting colour above, creating a graphic separation. More defined than a blended crease look.',
    steps: [
      '1. Apply concealer or white/flesh-toned eyeshadow to the lid — this creates a blank canvas',
      '2. Using a flat shadow brush, pack lid colour from lashline to where you want the cut',
      '3. Using a small, stiff pencil or concealer brush, create the crisp cut line — usually with concealer',
      '4. Clean up the line with a thin brush and concealer',
      '5. Apply transition colour above the cut line into the crease and brow bone',
      '6. Blend transition colour well — the cut is crisp but the transition should be soft above it',
    ],
    for_ethnic_skin: 'Cut crease is a style that originated in drag makeup and has been widely adopted in South Asian bridal beauty (gold cut crease with kohl is a gorgeous tradition). On deep skin, a bright or metallic lid against a deep brown or burgundy transition creates a striking graphic look.',
  },

  halo: {
    what: 'Light (usually shimmer or glitter) in the centre of the lid, darker shade on inner and outer corners. Creates a spotlight effect that makes eyes appear rounder and more open.',
    best_for: 'Hooded eyes, monolids, any eye that benefits from appearing more open.',
    steps: [
      '1. Apply dark shade to inner corner and outer corner',
      '2. Blend into centre with a light hand to avoid muddying',
      '3. Pack light/shimmer shade onto the centre of the lid',
      '4. Add highlight in inner corner of eye (tear duct area)',
    ],
  },

  floating_liner: {
    what: 'A graphic liner element on the lid space above the natural lashline — a stripe, wing, or geometric element that doesn\'t follow the natural eye shape but floats above it.',
    for_monolid: 'Particularly popular for monolid wearers — a floating liner element is fully visible and creates graphic drama without requiring a crease technique.',
  },
};

// ─── COMMUNITY EYE TRADITIONS ─────────────────────────────────────────────────

export const EYE_TRADITIONS_BY_COMMUNITY = {
  south_asian: {
    kohl: {
      description: 'Kajal or kohl — black pigment applied to the waterline and lower waterline. An ancient tradition across the subcontinent, used for millennia.',
      significance: 'Protective, spiritual, and cosmetic purposes. Traditionally made from lampblack/soot, now commercially prepared with safe pigments.',
      technique: 'Applied to the waterline (inner rim of eye) with a kohl pencil or stick. Smudged on the lower lashline. Creates an intense, dramatic effect.',
      bridal: 'Bridal South Asian eye looks typically incorporate deep kohl, dramatic extended wing liner, and heavy cut crease in gold or bronze.',
      modern: 'Kajal-to-smoke — starting with kajal on waterline and lower lashline, then blending outward with a brush for a soft smoky effect.',
    },
    classic_looks: [
      'Gold cut crease with kohl liner and mascara',
      'Deep maroon/burgundy smoky eye with kohl',
      'Graphic bold liner look (modern bridal)',
      'Subtle nude + kohl for daytime',
    ],
  },

  arab: {
    kohl: {
      description: 'Kohl is deeply embedded in Arab beauty — called "al-kohl" (the word eyeliner derives from Arabic). Used for over 3000 years.',
      traditional: 'Traditionally applied to protect eyes from the sun\'s glare in desert environments and believed to have protective properties.',
      technique: 'Arab kohl technique typically lines both upper and lower waterline for an intensely dramatic, defined look.',
      classic: 'Dramatically kohled eyes often paired with minimal face makeup — letting the eyes speak.',
    },
    modern_looks: [
      'Smoky kohl-defined eye',
      'Graphic liner art (popular in Gulf fashion)',
      'Bold winged liner with dramatic false lashes',
      'Cut crease in jewel tones',
    ],
  },

  east_asian: {
    double_eyelid_tape: 'Temporary eyelid tape or stickers that create a crease for monolids — widely used across East Asia.',
    classic_looks: [
      'Natural lash-focus look — building texture with multiple coats of mascara or individual lash extensions',
      'Puppy eye/fox eye techniques — downward or upward-extending liner from outer corner',
      'Under-eye shimmer — often inner corner and lower lashline shimmer for doe-eyed effect',
      'Gradient soft eyeshadow — very blended, diffuse shadows in pinks, browns, corals',
      'Monolid graphic liner — bold coloured liner as the statement',
    ],
    k_beauty_eye: {
      gradient: 'Soft ombre gradient from a lighter wash overall to concentrated pigment at the lashline',
      aegyo_sal: 'Deliberately emphasising under-eye puffiness — the small fold under the eye considered youthful in Korean and Japanese beauty culture. Applied with shimmer or light matte shadow.',
    },
  },

  west_african: {
    kohl: 'Kohl and smudged eye pigments have deep tradition in West African cultures — used at ceremonies and celebrations.',
    modern: 'West African and Black American makeup scenes have heavily influenced global makeup culture — particularly in the development of highly pigmented, vibrant colour looks.',
    classic_looks: [
      'Vivid colour cut crease (pink, blue, orange)',
      'Graphic liner art — bold, geometric liner designs',
      'Glam gold and bronze smoky',
      'Natural brow-forward with minimal eye makeup',
      'Bold lash (extended drama lashes)',
    ],
  },

  caribbean: {
    influence: 'Caribbean beauty blends West African, Indigenous, and European traditions. Carnival and festival beauty strongly influences everyday makeup culture — bold, colourful, glittery.',
    classic_looks: [
      'Glitter and holographic pigment (carnival-inspired)',
      'Bright tropical colour palettes — turquoise, coral, gold',
      'Bold smoky eye with full lashes',
    ],
  },

  latina: {
    influence: 'Latin American beauty traditions blend Indigenous, African, European, and East Asian elements across different regions. Makeup culture is diverse — from Brazilian natural beauty focus to dramatic Mexican bridal looks.',
    classic_looks: [
      'Smouldering brown smoky eye',
      'Bold liner with cat eye',
      'Warm terracotta and bronze',
      'Festive glitter looks',
    ],
  },
};

// ─── PRIMER & LONGEVITY ───────────────────────────────────────────────────────

export const EYE_PRIMER_GUIDE = {
  why: 'Eye primer creates a sticky base that shadow adheres to, prevents creasing, intensifies pigment payoff (particularly important for getting true colours on deeper skin), and dramatically increases wear time.',

  types: [
    { type: 'Flesh/nude primers', note: 'Covers lid discolouration for true shadow colour representation. Best for bright, vivid colours.', example: 'Urban Decay EDEN, Too Faced Shadow Insurance' },
    { type: 'White/light primers', note: 'Maximum pigment pop. Shades appear exactly as in the pan.', example: 'Milani Eyeshadow Primer, NYX HD Eye Shadow Base (White)' },
    { type: 'Tinted primers', note: 'Add warmth or tone while preparing lid.', example: 'Urban Decay Urbane' },
    { type: 'Clear primers', note: 'For natural lids, grips shadow, less colour-altering.', example: 'e.l.f. Eyeshadow Primer' },
  ],

  for_deep_skin: 'A flesh-toned or medium-toned primer corrects the natural undertone of the eyelid (often slightly darker than surrounding skin) and allows colours to appear true to pan. White primers maximise pop of vivid colours.',

  setting: 'After primer, setting with a translucent powder before shadow application creates an ultra-smooth base. Particularly useful with cream or liquid shadows.',
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getEyeShapeGuide(shape) {
  if (shape && EYE_SHAPES_GUIDE.shapes[shape]) return EYE_SHAPES_GUIDE.shapes[shape];
  return EYE_SHAPES_GUIDE;
}

export function getEyeshadowForSkinTone(fitzpatrick) {
  const map = {
    1: EYESHADOW_BY_SKIN_TONE.fitzpatrick_i_ii,
    2: EYESHADOW_BY_SKIN_TONE.fitzpatrick_i_ii,
    3: EYESHADOW_BY_SKIN_TONE.fitzpatrick_iii,
    4: EYESHADOW_BY_SKIN_TONE.fitzpatrick_iv,
    5: EYESHADOW_BY_SKIN_TONE.fitzpatrick_v,
    6: EYESHADOW_BY_SKIN_TONE.fitzpatrick_vi,
  };
  return map[fitzpatrick] || EYESHADOW_BY_SKIN_TONE;
}

export function getEyeTechniqueGuide(technique) {
  if (technique && EYESHADOW_TECHNIQUES[technique]) return EYESHADOW_TECHNIQUES[technique];
  return EYESHADOW_TECHNIQUES;
}

export function getEyeTraditionsForCommunity(communityId) {
  return EYE_TRADITIONS_BY_COMMUNITY[communityId] || null;
}

export function getEyePrimerGuide() {
  return EYE_PRIMER_GUIDE;
}

