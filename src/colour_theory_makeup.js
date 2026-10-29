/**
 * MIRRR Colour Theory for Makeup
 * Complete colour science applied to ethnic beauty
 * Colour correction, colour theory, seasonal palettes for melanin-rich skin
 */

// ─── THE COLOUR WHEEL ─────────────────────────────────────────────────────────

export const COLOUR_WHEEL = {
  primary: {
    red: { hex: '#FF0000', makeup_role: 'Correction for dark circles on deeper skin (red-orange corrector)' },
    yellow: { hex: '#FFFF00', makeup_role: 'Brightening, counteracts purple/dark tones' },
    blue: { hex: '#0000FF', makeup_role: 'Correction for extreme redness on fair skin' },
  },
  secondary: {
    orange: { hex: '#FF8000', makeup_role: 'CRITICAL for ethnic skin — corrects blue-black dark circles and deep hyperpigmentation; peach on medium skin, deep orange/red-orange on deep skin' },
    green: { hex: '#00FF00', makeup_role: 'Corrects redness, erythema, PIH redness on lighter skin tones' },
    purple_violet: { hex: '#8000FF', makeup_role: 'Corrects yellow-sallowness in complexion; also used to "cancel" yellow undertones in orange tan' },
  },
  tertiary: {
    red_orange: { hex: '#FF4000', makeup_role: 'Deepest correction tone — for blue-black circles and bruise-level darkness on Fitzpatrick V-VI' },
    yellow_orange: { hex: '#FFBF00', makeup_role: 'Peach correction tone for Fitzpatrick III-IV medium skin' },
    yellow_green: { hex: '#80FF00', makeup_role: 'Addresses pink-red blemishes on lighter medium skin' },
    blue_green: { hex: '#00FF80', makeup_role: 'Addresses deep red marks — rarely needed' },
    blue_violet: { hex: '#4000FF', makeup_role: 'Used for dramatic colour correction in editorial' },
    red_violet: { hex: '#FF0080', makeup_role: 'Less common in correction; used in artistic contexts' },
  },
};

// ─── COMPLEMENTARY COLOUR PAIRS ───────────────────────────────────────────────

export const COMPLEMENTARY_PAIRS = {
  explanation: 'Complementary colours sit opposite each other on the colour wheel. When placed next to each other, they vibrate and create the most contrast. When mixed together, they neutralise each other — this is the principle behind colour correction.',
  pairs: [
    {
      pair: ['Red', 'Green'],
      makeup_application: 'Green colour corrector cancels redness. Apply before foundation on red blemishes, rosacea areas, or post-inflammatory redness. Most effective on Fitzpatrick I-III skin.',
      recommended_products: ['NYX Green Colour Correcting Concealer', 'L.A. Girl Pro Concealer Green'],
    },
    {
      pair: ['Orange', 'Blue'],
      makeup_application: 'Orange (and red-orange) corrects blue-black darkness — dark circles, deep shadows, some hyperpigmentation. The blue is "corrected" by its opposite: orange/red-orange depending on depth of darkness.',
      skin_tone_guide: {
        'Fitzpatrick I-II': 'Peach corrector (near-neutral orange) for light dark circles',
        'Fitzpatrick III': 'Light peach to salmon corrector',
        'Fitzpatrick IV': 'Salmon to peach-orange corrector',
        'Fitzpatrick V': 'True orange corrector',
        'Fitzpatrick VI': 'Deep red-orange corrector',
      },
      recommended_products: ['NARS Radiant Creamy Concealer in Chantilly (peach)', 'Tarte Shape Tape (peach)', 'NYX Orange Correcting Concealer', 'Make Up For Ever Step 1 (orange)'],
    },
    {
      pair: ['Yellow', 'Purple'],
      makeup_application: 'Yellow correctors are used for general brightness and to neutralise purple-grey tones. Purple correctors counteract yellow/sallow complexions. Less commonly used but effective for colour-washing sallow skin.',
    },
  ],
};

// ─── COLOUR CORRECTION BY SKIN TONE ──────────────────────────────────────────

export const COLOUR_CORRECTION_BY_FITZPATRICK = {
  principle: 'The key insight for ethnic skin: the same colour concern (dark circles, PIH) looks different on different skin tones and therefore requires DIFFERENT correctors. A peach corrector that works perfectly on medium skin will be invisible on dark skin.',

  fitzpatrick_i_ii: {
    label: 'Fitzpatrick I-II — Fair to Light',
    common_concerns: ['Redness (rosacea, acne redness)', 'Blue-purple under-eye circles', 'General dullness'],
    correctors: {
      redness: { colour: 'Green', products: ['NYX Green Colour Correcting Concealer', 'Krave Beauty Corrector'] },
      dark_circles: { colour: 'Peach/Light peach', why: 'Under-eye circles on fair skin are blue-purple; peach (a pale orange) neutralises them', products: ['NARS Radiant Creamy Concealer in Chantilly', 'Laura Mercier Secret Concealer Light Peach'] },
      dullness: { colour: 'Light pink/lavender-tinged primer', why: 'Adds brightness' },
    },
  },

  fitzpatrick_iii: {
    label: 'Fitzpatrick III — Light-Medium',
    common_concerns: ['Post-inflammatory hyperpigmentation (PIH)', 'Yellow-toned under-eye darkness', 'Redness in some communities (South Asian, Latina)'],
    correctors: {
      pih: { colour: 'Green to peach depending on tone of mark', why: 'PIH at this skin tone can be pink-red (green) or brown-orange (peach or light orange)' },
      dark_circles: { colour: 'Salmon (between peach and orange)', why: 'Under-eye darkness has more warmth/yellow-brown at this depth', products: ['Urban Decay Naked Skin Weightless Concealer', 'Maybelline Fit Me Concealer in 25-30 range'] },
    },
  },

  fitzpatrick_iv: {
    label: 'Fitzpatrick IV — Medium to Tan',
    common_concerns: ['PIH (common across South Asian, Arab, Latina communities)', 'Uneven complexion', 'Dark under-eye circles with brown-orange tone'],
    correctors: {
      pih_brown: { colour: 'Orange-peach', products: ['L.A. Girl Pro Concealer Peach', 'NYX Orange Corrector mixed with concealer'] },
      dark_circles: { colour: 'Orange/deep peach', note: 'At Fitzpatrick IV, dark circles shift from blue-purple (F I-II) to dark brown — requires orange rather than pure peach' },
    },
  },

  fitzpatrick_v: {
    label: 'Fitzpatrick V — Brown to Dark Brown',
    common_concerns: ['PIH (most prevalent skin concern at this skin tone)', 'Dark ashy areas', 'Very dark under-eye circles'],
    correctors: {
      pih: { colour: 'True orange', why: 'PIH at this depth is very dark brown — only orange is saturated enough to cancel it before foundation', products: ['NYX Orange Corrector', 'Make Up For Ever Step 1 Corrector in Orange', 'Ben Nye Corrector'] },
      dark_circles: { colour: 'True orange to red-orange', why: 'Very deep blue-black circles; peach would be invisible. True orange is needed.', products: ['Danessa Myricks Yummy Skin Blurring Balm Powder with Orange Tint'] },
      ash_areas: { colour: 'None needed — avoid light-coloured highlights which emphasise ash. Use warm gold highlighters only.' },
    },
  },

  fitzpatrick_vi: {
    label: 'Fitzpatrick VI — Deep Ebony',
    common_concerns: ['Very dark PIH', 'Extreme under-eye darkness', 'Ash undertone in some areas'],
    correctors: {
      pih_extreme: { colour: 'Red-orange', why: 'PIH at this depth can appear almost blue-black. Red-orange is the only corrector pigmented enough to work.', products: ['Ben Nye Deep Red-Orange Corrector', 'Mehron Corrector (used in theatrical makeup — highly pigmented)'] },
      dark_circles: { colour: 'Deep red-orange', products: ['Black Radiance Colour Correct (Red-Orange)', 'Make Up For Ever Full Cover Extreme Camouflage Cream in Peach/Orange'] },
      recommendation: 'For skin this deep, many MUAs recommend working with darkness rather than against it — deep concealers that blend seamlessly rather than full correction which can look orangey if overdone.',
    },
  },
};

// ─── UNDERTONE GUIDE ──────────────────────────────────────────────────────────

export const UNDERTONE_GUIDE = {
  what_is_undertone: 'Skin undertone is the subtle hue beneath the surface skin colour. It does NOT change with sun exposure or seasons (unlike your overtone). Knowing your undertone is the single most important factor in choosing foundation, bronzer, highlight, and blush shades.',

  three_undertones: {
    warm: {
      description: 'Yellow, peachy, golden hues beneath the skin',
      who_has_it: 'Common across South Asian, East Asian, Latina, and many Black communities. Can occur in any skin depth.',
      how_to_identify: [
        'Veins appear green',
        'Gold jewellery flatters more than silver',
        'You tan easily and rarely burn',
        'White paper next to your face makes your skin look yellow or peachy',
      ],
      flattering_shades: {
        foundation: 'Look for: warm, golden, peachy foundation — avoid pink-toned bases which will look ashy',
        blush: 'Peach, coral, terracotta, warm copper blushes',
        highlighter: 'Gold, warm bronze, copper',
        eyeshadow: 'Earth tones, warm browns, copper, gold, terracotta, rust',
        lip: 'Coral, warm reds, peach, terracotta',
        avoid: 'Cool pinks in blush and foundation — they will make your skin look grey or ashy',
      },
    },
    cool: {
      description: 'Pink, red, or bluish hues beneath the skin',
      who_has_it: 'Common in some East Asian skin (particularly Japanese), many Black American women, some South Asian women (particularly those with darker, blue-cast skin), and of course fair European-descended skin',
      how_to_identify: [
        'Veins appear blue or purple',
        'Silver jewellery flatters more than gold',
        'You tend to burn before tanning or don\'t tan easily',
        'White paper next to your face makes your skin look pink or blue',
      ],
      flattering_shades: {
        foundation: 'Look for: cool, pink-toned or neutral foundations',
        blush: 'Berry, rose, mauve, cool pink blushes',
        highlighter: 'Silver, champagne, rose gold, pearl',
        eyeshadow: 'Cool blues, purples, greys, smoky tones, cool browns',
        lip: 'Berry, rose, cool red (blue-based red), mauve',
        avoid: 'Very orange or golden foundations which will look too warm',
      },
    },
    neutral: {
      description: 'No strong warm or cool lean — a mix of both',
      who_has_it: 'True neutral undertone is less common but occurs across all ethnic groups',
      how_to_identify: [
        'Veins appear blue-green',
        'Both gold and silver jewellery work',
        'Lucky — most shades of makeup work',
        'A piece of white paper next to your face shows no strong bias',
      ],
      flattering_shades: {
        foundation: 'Neutral-toned foundations — look for "N" in shade range labels',
        blush: 'Mostly neutral — dusty rose, soft coral',
        highlighter: 'Rose gold or warm champagne',
        eyeshadow: 'Wide range works — both warm and cool palettes',
        lip: 'Most shades work; experiment freely',
      },
    },
  },

  ethnic_specific_undertone_notes: {
    south_asian: 'South Asian skin is predominantly warm-to-neutral, though significantly darker South Asian skin can have a blue-toned cool undertone. The most common mistake: choosing too pink a foundation.',
    arab: 'Olive undertone (a unique yellow-green mix) is common in Arab and Mediterranean skin. True olive is sometimes called a fourth undertone — it has warm AND cool elements simultaneously. Olive-undertoned skin needs foundations with yellow-green balance.',
    west_african: 'Deep West African skin often has a rich red or blue-cool undertone, though warm golden undertones also occur. The golden glow of some West African skin is its own beauty — warm gold undertone.',
    east_african: 'East African skin frequently has a warm reddish undertone — striking and unique. Cool deep shades in foundation often look better on East African skin than warm brown which can appear muddy.',
    east_asian: 'East Asian skin is commonly warm (yellow) to neutral, though in Japan a slightly cooler undertone is more common. The key: avoid pink-toned foundations which read "chalky" on yellow-toned skin.',
    latina: 'Highly diverse — from very fair cool-toned to very deep warm-toned. Olive undertone is common in Mexican and Central American communities. Warm golden undertone is common in Caribbean and South American communities.',
    caribbean: 'Wide range from warm golden-brown to deep cool. Many Caribbean people of mixed heritage have complex undertones. When in doubt: swatch both a warm and cool foundation on the jawline in natural light.',
  },
};

// ─── THE COLOUR THEORY OF EYESHADOW ──────────────────────────────────────────

export const EYESHADOW_COLOUR_THEORY = {

  eye_colour_enhancement: {
    principle: 'Use complementary or analogous colours to make eye colour pop',
    dark_brown_eyes: {
      note: 'Dark brown eyes are the most common eye colour globally — the richest and most versatile for makeup',
      complementary: 'Dark brown contains red and orange pigment — blue, teal, and violet shadows create the most contrast and make brown eyes "pop"',
      analogous: 'Bronze, copper, gold, rust — enhance the warm tones within brown irises',
      safe_classic: 'Warm browns, plums, gold, copper — always flattering',
      bold: 'Electric blue on the lower lashline with copper on the lid — a stunning combination for brown eyes',
    },
    dark_eyes_with_gold_flecks: {
      note: 'Many South Asian, Arab, and Latina women have dark brown eyes with gold or amber flecks',
      complementary: 'Purple and violet shadows make gold flecks in brown eyes appear to glow',
      recommended: 'Purple-toned smoky eye or violet cut crease',
    },
    hazel: {
      complementary: 'Purple for green hazel, green for brown hazel',
      enhance_green_in_hazel: 'Reddish-purple (like plum or burgundy) shadows make hazel eyes read more green',
    },
    light_brown_or_honey: {
      common_in: 'Some Arab, Latina, mixed-heritage communities',
      complementary: 'Blues and purples, or warm golds to enhance the honey tone',
    },
  },

  making_eyes_appear_larger: {
    principle: 'Light and shimmer advance (appear to come forward). Dark and matte recede (appear to go back). Use this to sculpt the eye area.',
    techniques: {
      inner_corner_highlight: 'A light shimmery shade in the inner corner of the eyes opens them up — one of the most impactful techniques for small eyes',
      waterline: 'Nude or flesh-toned pencil on the lower waterline makes eyes appear larger (dark kohl on the waterline makes them appear smaller and more dramatic)',
      under_brow_highlight: 'A light shimmer or matte shade just under the brow bone adds lift',
    },
  },

  making_eyes_appear_more_dramatic: {
    techniques: {
      dark_waterline: 'Black kohl on the lower waterline (kajal) — deeply traditional across South Asian and Arab cultures. Narrows the eye, adds drama.',
      full_surround: 'Dark shadow all around the eye (top and bottom) — very dramatic. Works beautifully for brown/dark eyes.',
      cut_crease: 'Hard line dividing the lid from the crease — very editorial and dramatic.',
    },
  },

  shadow_placement_tips: {
    hooded_eyes: {
      common_in: 'East Asian, South Asian, some West African communities',
      strategy: 'Apply shadow ABOVE where it naturally settles when eyes are open. A shadow you can only see with eyes closed does nothing.',
      technique: 'Apply cut crease higher than feels natural when eyes are closed — when open, it will appear in the right place',
    },
    deep_set_eyes: {
      common_in: 'Many ethnic communities',
      strategy: 'Focus shimmer on lid, bring highlight forward; avoid very dark shadows on the lid (they will make the deep setting more pronounced)',
    },
    prominent_eyes: {
      strategy: 'Can carry darker shadows on the lid — this balances the natural forward-projection',
    },
    monolid: {
      common_in: 'East Asian communities',
      strategy: 'Everything shows — no crease to work with. Line along the lash line (very thin to thick), shadow washed across the lid. Graphic liner is particularly impactful on monolids.',
    },
  },
};

// ─── COLOUR FAMILIES FOR DIFFERENT SKIN TONES ─────────────────────────────────

export const COLOUR_FOR_SKIN_TONE = {

  foundation_undertone_matching: {
    rule: 'NEVER match foundation by depth alone — always match undertone too. A foundation two shades lighter with the right undertone will look BETTER than the perfect depth with wrong undertone.',
    methods: {
      jaw_swatch: 'Swatch 2-3 shades on your jawline in NATURAL LIGHT — not in-store lighting. The one that disappears is your match.',
      chest_match: 'For brides and anyone wearing strapless/low-cut — foundation should also match chest and décolletage.',
    },
  },

  blush_by_skin_tone: {
    fair_skin: { work: 'Soft pinks, peaches, light coral', avoid: 'Very dark berry (too harsh), orange (can look dirty)' },
    medium_skin: { work: 'Peach, coral, terracotta, dusty rose, mauve', avoid: 'Very light pink (disappears)' },
    tan_olive_skin: { work: 'Terracotta, deep peach, warm rose, copper-toned blush', avoid: 'Pale pink (invisible), cool berry (can clash)' },
    brown_skin: { work: 'Deep terracotta, brick red, warm berry, deep rose', avoid: 'Pale shades (invisible), cool light pinks' },
    deep_skin: { work: 'Deep berry, rich terracotta, bright coral, oxblood for drama', avoid: 'Anything pale — it will show as grey ashy tone rather than colour' },
  },

  highlighter_by_skin_tone: {
    principle: 'Highlighter is only visible when it contrasts with your skin tone. Pale champagne on deep skin looks grey or ashy. You need a highlighter that actually stands out.',
    fair: 'Icy pink, champagne, pearl, white gold',
    medium: 'Champagne, warm gold, rose gold',
    tan: 'Gold, bronze-gold, rose gold',
    brown: 'Bright gold, deep gold, amber, warm bronze',
    deep: 'Pure gold, deep copper, bronze — must be intense and very shimmery; subtle highlighters will not show',
    recommended_for_deep_skin: ['Fenty Beauty Killawatt Highlighter in Mean Money', 'Juvia\'s Place The Saharan Palette (highlight shades)', 'Pat McGrath Labs Skin Fetish Highlighter', 'BH Cosmetics Galaxy Chic Baked Eye Shadow (used as highlighter)'],
  },

  lip_colour_by_skin_tone: {
    principle: 'Lipstick that looks nude on fair skin will often look more wearable on deep skin, and vice versa. "Nude" is relative — your nude is unique to your skin tone.',

    finding_your_nude: 'Your nude lip is 1-2 shades deeper than your natural lip colour. Many "nude" lipsticks are designed for fair skin and will appear chalky or ashy on deep skin tones.',

    ethnic_skin_nude_guide: {
      south_asian_medium: 'Mauve-brown, rosy-brown, deep dusty rose, terracotta — NOT beige',
      arab_medium_olive: 'Warm brown-rose, terracotta, peachy-brown, deep mauve',
      west_african_deep: 'Warm deep brown, chocolate, oxblood, rich plum — beige lipstick will look grey',
      east_asian_medium_warm: 'Warm mauve, MLBB (My Lips But Better) reddish-brown, dusty rose',
      latina_diverse: 'Depends on undertone — warm coral to deep plum depending on depth',
    },

    bold_lip_by_skin_tone: {
      red_lip_guide: {
        fair: 'Blue-based reds (cooler reds like MAC Ruby Woo)',
        medium: 'True red to orange-red',
        tan: 'Orange-red, brick red, tomato red',
        brown: 'True red, rich ruby, warm red',
        deep: 'Rich ruby red, deep red with warmth (avoid blue-based very cool reds which can look purple on deep skin)',
      },
    },
  },
};

// ─── SEASONAL COLOUR ANALYSIS FOR ETHNIC SKIN ─────────────────────────────────

export const SEASONAL_COLOUR_ANALYSIS = {
  overview: 'Seasonal colour analysis (SCA) was developed for primarily European skin tones. The original "Spring/Summer/Autumn/Winter" categories assume fair to medium skin. Modern SCA has been expanded to include all skin tones but needs thoughtful application for ethnic skin.',

  criticism: 'Traditional seasonal colour analysis was developed in the 1940s-80s and primarily addressed Northern European colouring. Many professional colour analysts note it\'s less directly applicable to very deep skin tones, though the principles of contrast (high vs low) and undertone (warm vs cool) remain relevant.',

  applicable_principles: {
    contrast_level: {
      what: 'The degree of contrast between your skin, hair, and eyes',
      high_contrast: 'Very deep skin with light eyes (hazel, honey) or very deep skin with light hair — high-contrast colouring benefits from high-contrast colours (e.g., black and white, deep jewel tones)',
      low_contrast: 'Where skin tone, hair, and eye colour are all similar depth — monochromatic or tonal looks are harmonious',
    },
    undertone_dressing: {
      warm_undertone: 'Earth tones, rust, gold, olive, warm reds in clothing and makeup enhance warm skin. Cool metallic, ice blue, and very cool pinks may clash.',
      cool_undertone: 'Jewel tones, cool blues and purples, silvery metallics. Earth tones and orange-based shades may pull the undertone in an unflattering direction.',
    },
  },

  seasonal_types_for_all_skin_tones: {
    spring: {
      characteristics: 'Warm undertone, relatively lighter value in skin, golden-warm hair, warm brown or green eyes',
      can_be: 'Fair Spring or Deep Spring — a dark-skinned person with golden warm undertone, deep warm brown hair, and warm honey eyes is a Deep Spring',
      makeup_palette: 'Warm peach, coral, terracotta, gold, warm brown, salmon',
    },
    summer: {
      characteristics: 'Cool undertone, muted/dusty quality to colouring, pink-rose undertone',
      can_be: 'Fair Summer or Deep Summer — a deep-skinned person with cool (blue-red) undertone, very deep cool-toned hair, and dark brown eyes is a Deep Summer',
      makeup_palette: 'Muted rose, dusty mauve, soft berry, cool brown, grey-taupe',
    },
    autumn: {
      characteristics: 'Warm undertone, richer and deeper value, golden-red-brown tones',
      can_be: 'Light Autumn or Deep Autumn — very common for South Asian, Arab, West African women with golden-warm undertone and rich deep hair',
      makeup_palette: 'Terracotta, rust, deep gold, warm brown, burnt orange, olive green',
    },
    winter: {
      characteristics: 'Cool undertone, high contrast, clear and vivid',
      can_be: 'Light Winter or Deep Winter — MANY deeply-pigmented women are Deep Winters. Very deep skin with cool undertone and very dark hair = Deep Winter',
      makeup_palette: 'Deep berry, true red, black, cool rose, silver, jewel tones (sapphire, emerald)',
    },
  },
};

// ─── COLOUR THEORY FOR CONTOURING ─────────────────────────────────────────────

export const CONTOUR_COLOUR_THEORY = {
  principle: 'Contour mimics the natural shadow cast on the face. Shadows are NOT grey or cool on melanin-rich skin — they have warmth. The wrong contour colour looks dirty; the right one looks sculpted.',

  contour_shade_by_skin_tone: {
    fair: 'Cool taupe, light cool brown — avoid anything orange. Traditional cool-toned contour powder.',
    medium: 'Medium neutral brown, light warm brown. Some warm work well here.',
    tan_olive: 'Warm brown, caramel — olive skin looks great with warm contour that doesn\'t fight the undertone',
    brown: 'Deep warm brown, chestnut, warm espresso',
    deep: 'Very deep warm brown, espresso, or even a deep burgundy-brown. Avoid grey or ash — looks muddy. Need significant depth to show up.',
  },

  bronzer_vs_contour: {
    bronzer: 'Warms the skin — applied where the sun hits. Forehead, nose bridge, cheeks. Has shimmer or warmth. NOT sculpting tool.',
    contour: 'Sculpts/shadows — applied where shadow falls naturally. Hollows of cheeks, sides of nose, jaw, forehead perimeter. Typically matte. NOT bronzing tool.',
    mistake: 'Using bronzer as contour — results in a brown smear, not defined sculpt. These are different products with different purposes.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getColourCorrectorForSkinTone(fitzpatrick, concern) {
  const guide = COLOUR_CORRECTION_BY_FITZPATRICK;
  const key = `fitzpatrick_${fitzpatrick.toString().replace('-', '_')}`;
  const toneGuide = guide[key.toLowerCase()] || guide['fitzpatrick_iv'];
  return {
    toneGuide,
    concern: toneGuide?.correctors?.[concern] || null,
    complementaryPrinciple: COMPLEMENTARY_PAIRS.explanation,
  };
}

export function getUndertoneGuide() {
  return UNDERTONE_GUIDE;
}

export function getEyeshadowGuide(eyeShape) {
  return {
    colourTheory: EYESHADOW_COLOUR_THEORY,
    shapeSpecific: EYESHADOW_COLOUR_THEORY.shadow_placement_tips[eyeShape] || null,
  };
}

export function getHighlighterForSkinTone(skinTone) {
  return {
    guide: COLOUR_FOR_SKIN_TONE.highlighter_by_skin_tone,
    forTone: COLOUR_FOR_SKIN_TONE.highlighter_by_skin_tone[skinTone] || null,
  };
}

export function getBlushForSkinTone(skinTone) {
  return COLOUR_FOR_SKIN_TONE.blush_by_skin_tone[skinTone] || null;
}

export function getNudeLipForCommunity(communityId) {
  const map = {
    'south-asian': COLOUR_FOR_SKIN_TONE.lip_colour_by_skin_tone.ethnic_skin_nude_guide.south_asian_medium,
    'arab': COLOUR_FOR_SKIN_TONE.lip_colour_by_skin_tone.ethnic_skin_nude_guide.arab_medium_olive,
    'west-african': COLOUR_FOR_SKIN_TONE.lip_colour_by_skin_tone.ethnic_skin_nude_guide.west_african_deep,
    'east-asian': COLOUR_FOR_SKIN_TONE.lip_colour_by_skin_tone.ethnic_skin_nude_guide.east_asian_medium_warm,
    'latina': COLOUR_FOR_SKIN_TONE.lip_colour_by_skin_tone.ethnic_skin_nude_guide.latina_diverse,
    'caribbean': COLOUR_FOR_SKIN_TONE.lip_colour_by_skin_tone.ethnic_skin_nude_guide.latina_diverse,
    'black-american': COLOUR_FOR_SKIN_TONE.lip_colour_by_skin_tone.ethnic_skin_nude_guide.west_african_deep,
  };
  return map[communityId] || null;
}

export function getSeasonalAnalysis() {
  return SEASONAL_COLOUR_ANALYSIS;
}

export function getContourGuideForSkinTone(skinDepth) {
  return {
    shadeGuide: CONTOUR_COLOUR_THEORY.contour_shade_by_skin_tone[skinDepth] || null,
    bronzerVsContour: CONTOUR_COLOUR_THEORY.bronzer_vs_contour,
    principle: CONTOUR_COLOUR_THEORY.principle,
  };
}

export const COLOUR_THEORY_STATS = {
  complementaryPairs: COMPLEMENTARY_PAIRS.pairs.length,
  fitzpatrickLevelsGuided: Object.keys(COLOUR_CORRECTION_BY_FITZPATRICK).filter(k => k.startsWith('fitzpatrick')).length,
  undertones: Object.keys(UNDERTONE_GUIDE.three_undertones).length,
  seasonalTypes: Object.keys(SEASONAL_COLOUR_ANALYSIS.seasonal_types_for_all_skin_tones).length,
};
