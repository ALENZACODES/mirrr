/**
 * MIRRR Colour Correcting Guide
 * The science and art of colour correction for all skin tones
 * covering the colour wheel, corrector shades, and multicultural applications
 */

// ─── COLOUR CORRECTION OVERVIEW ───────────────────────────────────────────────

export const COLOUR_CORRECTION_OVERVIEW = {
  principle: 'Colour correction works on the principle of complementary colours — colours directly opposite each other on the colour wheel cancel each other out. Apply the complementary colour before foundation to neutralise an unwanted tone.',
  colour_wheel: {
    green_cancels: 'Red/redness — pimples, rosacea, broken capillaries, sunburn',
    peach_cancels: 'Blue/purple — dark circles, bruising, veins in fair skin',
    orange_cancels: 'Blue/dark — deep dark circles and shadows in medium-deep skin',
    red_orange_cancels: 'Dark blue-black — deep circles and hyperpigmentation in deep skin',
    lavender_cancels: 'Yellow/sallow tones — useful on fair skin with yellow undertones',
    yellow_cancels: 'Purple/blue — veins, some dark circles on medium skin',
    white_cancels: 'NOT a corrector — just lightens; creates ashy, unnatural results on deeper skin',
  },
  order: 'Colour corrector goes AFTER moisturiser/primer, BEFORE foundation and concealer. Apply corrector only where needed (spot application) — not all over the face. Apply foundation on top. Concealer over any remaining discolouration.',
  common_mistakes: {
    too_much: 'Using too much corrector — it should be a sheer, targeted layer, not a thick mask.',
    wrong_shade: 'Choosing the wrong complementary shade for your skin tone (deep skin needs orange/red, not peach).',
    skipping_foundation: 'Colour corrector is a base layer — it looks unfinished without foundation on top.',
    all_over: 'Applying corrector all over the face instead of only on discoloured areas.',
    setting: 'Not setting corrector before applying foundation — it moves and blends into the foundation.',
  },
};

// ─── GREEN CORRECTOR ──────────────────────────────────────────────────────────

export const GREEN_CORRECTOR_GUIDE = {
  what_it_corrects: 'Red tones — acne/pimples, rosacea, redness, post-acne redness, broken capillaries, sunburn',
  how_to_use: {
    step1: 'Start with clean, moisturised skin.',
    step2: 'Apply a small dot of green corrector directly onto the red area.',
    step3: 'Pat (do NOT rub) to blend the edges — the centre should be more green, edges feathered.',
    step4: 'Allow to set for 30 seconds.',
    step5: 'Apply foundation over the top with a damp sponge (stippling motion — do not rub).',
    step6: 'Set with a light dusting of powder if needed.',
  },
  best_for: 'All skin tones — however on deeper skin, too much green can create a muddy appearance. Use sparingly and blend well.',
  best_formulas: 'Lightweight fluid or cream correctors blend most smoothly. Heavy correctors can look cakey under foundation.',
  products_by_tone: {
    fair: 'Yellow-green correctors for a softer neutralisation.',
    medium: 'Standard green correctors work well.',
    deep: 'Deeper olive-green correctors that won\'t look grey when blended into deeper skin.',
  },
};

// ─── PEACH AND ORANGE CORRECTORS ─────────────────────────────────────────────

export const PEACH_ORANGE_CORRECTOR_GUIDE = {
  what_it_corrects: 'Blue and purple tones — dark circles, bruising, veins',
  skin_tone_matching: {
    fair_to_light: {
      shade: 'Peach corrector',
      why: 'Pale peach neutralises the blue-purple without looking orange on fair skin. The light-coloured corrector blends into a lighter skin tone without contrast.',
      undertones: 'Pink-peach for cool undertones; yellow-peach for warm undertones.',
    },
    light_medium: {
      shade: 'Peach to light salmon',
      why: 'Slightly more pigmented peach or salmon — the skin tone is deeper so the corrector needs more pigment to neutralise.',
    },
    medium: {
      shade: 'Salmon to light orange',
      why: 'Moving into salmon/light coral territory. Peach can disappear on medium skin, leaving the dark circle undertreated.',
    },
    medium_deep: {
      shade: 'Orange to warm red-orange',
      why: 'Deeper skin has a deeper underlying blue-brown to dark circles. A true orange corrector is necessary — peach won\'t show through the deeper foundation.',
    },
    deep: {
      shade: 'Red-orange to brick red',
      why: 'Very deep dark circles in Fitzpatrick V-VI have significant blue-black darkness. A rich, brick-red or red-orange corrector is the only one with enough pigment and complementary colour depth to neutralise it.',
    },
  },
  application_technique: {
    under_eye: 'Using ring finger (lightest pressure) or small brush, apply corrector to the darkest area of the under-eye. This is typically the inner corner where dark circles are most pronounced.',
    blend: 'Tap lightly to blend edges — leave the centre concentrated, fade the outer edge.',
    set: 'Lightly dust with translucent or banana powder to set before concealer.',
    concealer: 'Apply concealer over the set corrector if additional coverage is needed.',
    foundation: 'Apply foundation last, blending over the eye area lightly.',
  },
};

// ─── LAVENDER AND YELLOW CORRECTORS ──────────────────────────────────────────

export const LAVENDER_YELLOW_CORRECTOR_GUIDE = {
  lavender: {
    what_it_corrects: 'Yellow/sallow tones in fair skin. Some dullness.',
    best_for: 'Fair to light skin with yellow or sallow undertones. Not effective on medium or deeper skin where lavender will look grey and ashening.',
    how_to_use: 'Apply lightly all over or to areas that appear most yellow/dull. Use SPARINGLY — too much lavender makes fair skin look grey.',
    products: 'Lavender-tinted primers and colour-correcting drops are a lighter, easier application than concentrated corrector sticks.',
  },
  yellow: {
    what_it_corrects: 'Purple tones and some bluish veins. Can brighten and warm the overall complexion in fair to medium skin.',
    best_for: 'Fair to medium skin with purple veins, under-eye blueness in lighter skin, or overall dullness needing warmth.',
    limitation: 'On deep skin, yellow correctors are invisible — they don\'t have enough contrast to correct.',
  },
};

// ─── COLOUR CORRECTING BY SKIN CONCERN ────────────────────────────────────────

export const CORRECTING_BY_CONCERN = {
  dark_circles: {
    concern: 'Dark Circles',
    corrector: 'Peach (fair) → Salmon (medium) → Orange (medium-deep) → Red-orange/brick (deep)',
    tip: 'Identify your dark circle type first: vascular (blue-purple — classic corrector) or pigmentary (brown — lighter concealer may be more effective than a blue-correcting corrector). For deep brown pigment, peach/orange correctors don\'t work as well as a colour-matched concealer 1-2 shades lighter.',
  },
  pimples_redness: {
    concern: 'Pimples and Redness',
    corrector: 'Green — all skin tones, adjusted shade',
    tip: 'Let any pimple medication dry before applying corrector. Apply corrector over the pimple BEFORE foundation. Don\'t pick — applying over broken skin is ineffective and can cause irritation.',
  },
  rosacea: {
    concern: 'Rosacea / Diffuse Redness',
    corrector: 'Green — lighter, sheer application all over affected areas',
    tip: 'For widespread redness from rosacea, a green-tinted primer may be more practical than spot-correcting each area. Dermablend and ColourSelf make rosacea-specific primers.',
  },
  hyperpigmentation: {
    concern: 'Hyperpigmentation / Dark Spots',
    corrector: 'Orange (for dark spots on medium-deep skin) or peach (for lighter skin). However — corrector rarely fully neutralises brown hyperpigmentation. High-coverage concealer matched to your skin tone is often more effective.',
    note: 'PIH and melasma are typically brown, not blue-purple. Correctors work on the blue/purple UNDERTONE of hyperpigmentation — many PIH spots simply need concealing, not colour correcting.',
  },
  bruising: {
    concern: 'Bruising',
    corrector: 'Fresh bruise: yellow-green (reddish-purple). Healing bruise: peach/orange (yellow-green-brown). Old bruise: yellow.',
    tip: 'Bruises change colour as they heal. Match your corrector to the current bruise tone, not where it started.',
  },
  sallowness: {
    concern: 'Sallowness / Yellow Skin',
    corrector: 'Lavender (fair to light skin only). On medium to deep skin, a pink-toned foundation or a blush with cool pink undertone is more effective than a lavender corrector.',
    limitation: 'Lavender correctors are primarily for fair skin.',
  },
};

// ─── CORRECTING TOOLS ─────────────────────────────────────────────────────────

export const CORRECTING_TOOLS = {
  fingers: {
    tool: 'Fingers (ring finger)',
    best_for: 'Under-eye area — warmth of the skin and light pressure are ideal. Precise dot application on pimples.',
    pros: 'Zero product waste. Warmth helps blend creamy formulas.',
    cons: 'Can disturb existing makeup. Oil on fingers can reduce staying power.',
  },
  beauty_sponge: {
    tool: 'Damp Beauty Sponge',
    best_for: 'Stippling foundation over corrector without disturbing it.',
    technique: 'STIPPLE (press and lift) — do NOT drag or swipe over a corrector layer.',
    pros: 'Most skin-like finish. Good coverage.',
    cons: 'Can pick up the corrector layer if too wet or if sponge is dragged.',
  },
  concealer_brush: {
    tool: 'Flat or Tapered Concealer Brush',
    best_for: 'Precise placement of corrector on small areas — individual pimples, specific dark spot.',
    technique: 'Use a packing motion (pressing the product into the skin) rather than painting.',
    pros: 'Most precise application.',
    cons: 'Less blendable than fingers or sponge for the edges.',
  },
  fan_brush: {
    tool: 'Fan Brush',
    best_for: 'Diffusing product after initial placement. Feathering out the edges.',
    pros: 'Creates soft edges. Doesn\'t pick up product.',
    cons: 'Doesn\'t apply concentrated coverage.',
  },
};

// ─── COLOUR CORRECTING BY COMMUNITY ──────────────────────────────────────────

export const ETHNIC_COLOUR_CORRECTING = {
  west_african: {
    community: 'West African',
    common_concerns: 'Deep PIH from any inflammation, dark spots from dry skin, dark knuckles, very deep under-eye darkness',
    correctors: {
      dark_circles: 'Brick red or deep red-orange correctors. NARS Radiant Creamy Concealer in Caramel or Chestnut as corrector base.',
      pimples: 'Deeper olive-green that won\'t look ashy.',
      pih: 'High-coverage concealer colour-matched to the surrounding skin is more effective for brown PIH than colour correctors. Orange-undertoned corrector can help neutralise the very dark edges of deep PIH spots.',
    },
    tip: 'The key with very deep skin is using a corrector that is PIGMENT-DENSE enough to show up. Pastel correctors are invisible on deep skin and ineffective.',
  },
  south_asian: {
    community: 'South Asian',
    common_concerns: 'Periorbital hyperpigmentation (hereditary dark circles from childhood), acne PIH, uneven skin tone',
    correctors: {
      dark_circles: 'Salmon to orange, depending on depth of skin. Brown-purple circles need a warm peach-orange corrector. Try: e.l.f. Camo Color Corrector in a peach or orange shade.',
      pih: 'Warm orange tone to neutralise the blue-purple edge of deep PIH.',
      redness: 'Green for any redness from acne.',
    },
    tip: 'With yellow or olive undertones, a green corrector can sometimes read slightly murky — opt for a yellow-green rather than blue-green.',
  },
  caribbean: {
    community: 'Caribbean',
    common_concerns: 'PIH, dark circles, uneven texture from sun exposure',
    correctors: {
      dark_circles: 'Orange to red-orange for medium-deep to deep Caribbean skin tones.',
      pih_spots: 'Targeted orange corrector under high-coverage concealer.',
    },
    tip: 'Caribbean skin tone range is wide — from light to very deep. Match corrector to YOUR skin depth, not assumed ethnicity.',
  },
  arab: {
    community: 'Arab',
    common_concerns: 'Dark circles (genetic), sun-induced hyperpigmentation, redness',
    correctors: {
      dark_circles: 'Peach to salmon on fair-olive to medium skin; orange on deeper skin.',
      sun_spots: 'Orange-toned concealer or corrector where sun spots have a blue-brown depth.',
      redness: 'Green for redness.',
    },
    tip: 'With olive or yellow undertones, peach correctors with a yellow base blend most naturally without a pink/clashing finish.',
  },
  latina: {
    community: 'Latina',
    common_concerns: 'Melasma (especially during pregnancy and hormonal fluctuation), PIH, dark circles',
    correctors: {
      melasma: 'Melasma has a brown-grey appearance. Orange-based correctors on the blue-grey portions. High-coverage foundation over the brown portion. Note: Melasma treatment is primarily skincare-based; makeup manages appearance only.',
      dark_circles: 'Peach to salmon for lighter Latina skin; orange for deeper.',
      redness: 'Green.',
    },
    tip: 'Latina skin spans a very wide range of tones. Refer to Fitzpatrick type for corrector shade selection.',
  },
  east_asian: {
    community: 'East Asian',
    common_concerns: 'Under-eye vascular circles (blue-purple), redness, uneven tone',
    correctors: {
      dark_circles: 'Peach for blue-purple circles; a yellow-peach corrector blends well on warm undertones.',
      redness: 'Green. Yellow-green blends well with yellow undertones.',
      sallowness: 'Pink-toned foundation rather than lavender corrector.',
    },
    tip: 'With yellow or neutral undertones, avoid lavender correctors — they create an ashy, grey appearance. Green with yellow base, peach with yellow base.',
  },
  east_african: {
    community: 'East African',
    common_concerns: 'PIH, dark circles, uneven tone',
    correctors: {
      dark_circles: 'Orange to red-orange for deeper skin. With a cool-brown or neutral undertone, a red-orange with a cool base blends most naturally.',
      pih: 'Deep red-orange or brick corrector under full-coverage concealer.',
    },
    tip: 'With a neutral-cool or red undertone, a red-based corrector (rather than a warm orange) may blend more seamlessly.',
  },
  south_african: {
    community: 'South African',
    common_concerns: 'Wide range — South Africa has diverse ethnic groups. Concerns parallel West African (deep Fitzpatrick V-VI) and Coloured/mixed skin (medium Fitzpatrick III-IV) communities.',
    correctors: {
      deep_skin: 'Red-orange to brick for very deep Fitzpatrick V-VI.',
      medium_skin: 'Salmon to orange for medium Fitzpatrick III-IV.',
      redness: 'Green.',
    },
    tip: 'South African beauty diversity requires personalised corrector selection based on individual skin depth and undertone, not assumed community-wide shade.',
  },
  black_american: {
    community: 'Black American',
    common_concerns: 'PIH, dark circles, dullness, ashy skin.',
    correctors: {
      dark_circles: 'Orange to brick-red. NARS Radiant Creamy Concealer used as orange corrector is a classic community technique. Choose pigment-dense corrector shades made for deep skin.',
      pih: 'Orange corrector under concealer for the darkest spots.',
      ashiness: 'Ashiness is a surface dryness concern — moisturiser before makeup, not a corrector.',
    },
    tip: 'Black-owned brands (Juvia\'s Place, Beauty Bakerie, Black Opal, BLK/OPL) have historically served this need when mainstream brands failed to.',
  },
};

// ─── PRODUCT FORMATS ──────────────────────────────────────────────────────────

export const CORRECTOR_FORMATS = {
  liquid: {
    format: 'Liquid Corrector',
    texture: 'Thin, fluid consistency',
    coverage: 'Light to medium',
    best_for: 'Under-eye area, large areas, dewy/natural finish looks',
    pros: 'Blends easily, light feeling, buildable',
    cons: 'Can move if not set, less coverage for severe discolouration',
  },
  cream: {
    format: 'Cream Corrector',
    texture: 'Thick, creamy',
    coverage: 'Medium to full',
    best_for: 'Spot correction, pimples, targeted hyperpigmentation',
    pros: 'High pigment, blendable with finger warmth, stays in place',
    cons: 'Can be heavy if over-applied',
  },
  pencil_stick: {
    format: 'Pencil / Stick Corrector',
    texture: 'Firm but warms to skin',
    coverage: 'Medium to full',
    best_for: 'Spot application, travel',
    pros: 'Most precise application, portable',
    cons: 'Less blendable, can drag on delicate eye area',
  },
  powder: {
    format: 'Powder Corrector',
    texture: 'Pressed powder',
    coverage: 'Light',
    best_for: 'Setting a cream corrector, or light all-over correction for redness (green powder)',
    pros: 'Sets as it corrects, no fallout',
    cons: 'Low coverage, can look dusty',
  },
  primer: {
    format: 'Colour-Correcting Primer',
    texture: 'Fluid primer base',
    coverage: 'Very light',
    best_for: 'All-over redness (rosacea), subtle glow or sallowness correction',
    pros: 'Full-face application, smooths pores, lightweight',
    cons: 'Not enough for individual spots or dark circles',
  },
};

// ─── COLOUR CORRECTION MYTHS ──────────────────────────────────────────────────

export const CORRECTOR_MYTHS = {
  myth1: {
    myth: 'Everyone needs colour correctors',
    truth: 'Most people can achieve excellent coverage with just a well-matched foundation and concealer. Colour correctors are for specific, stubborn discolouration that regular coverage can\'t neutralise.',
  },
  myth2: {
    myth: 'More corrector = more coverage',
    truth: 'Layering too much corrector creates a heavy, cakey base. Correctors should be sheer, targeted layers. Build foundation and concealer coverage instead.',
  },
  myth3: {
    myth: 'A single peach corrector works for all skin tones',
    truth: 'Peach is only appropriate for fair to light skin. Deeper skin needs salmon, orange, or brick-red correctors for the same purpose.',
  },
  myth4: {
    myth: 'Colour correctors are obvious under makeup',
    truth: 'When applied correctly (sparingly, blended at edges, set, covered with foundation), colour correctors are invisible. They are the secret layer that makes coverage look seamless.',
  },
  myth5: {
    myth: 'You can use correctors all over your face for a more even tone',
    truth: 'Correctors work by applying a contrasting colour — all-over application creates a flat, muddy appearance. Correctors are SPOT products.',
  },
};

// ─── API GETTERS ──────────────────────────────────────────────────────────────

export function getColourCorrectionOverview() { return COLOUR_CORRECTION_OVERVIEW; }
export function getGreenCorrectorGuide() { return GREEN_CORRECTOR_GUIDE; }
export function getPeachOrangeCorrectorGuide(skinTone) {
  if (skinTone) return PEACH_ORANGE_CORRECTOR_GUIDE.skin_tone_matching[skinTone] || PEACH_ORANGE_CORRECTOR_GUIDE;
  return PEACH_ORANGE_CORRECTOR_GUIDE;
}
export function getLavenderYellowCorrectorGuide(type) {
  return type ? LAVENDER_YELLOW_CORRECTOR_GUIDE[type] : LAVENDER_YELLOW_CORRECTOR_GUIDE;
}
export function getCorrectorForConcern(concern) {
  const key = concern?.toLowerCase().replace(/\s+/g, '_');
  return CORRECTING_BY_CONCERN[key] || Object.values(CORRECTING_BY_CONCERN);
}
export function getCorrectorTools() { return CORRECTING_TOOLS; }
export function getEthnicColourCorrecting(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_COLOUR_CORRECTING[key] || Object.values(ETHNIC_COLOUR_CORRECTING);
}
export function getCorrectorFormats() { return CORRECTOR_FORMATS; }
export function getCorrectorMyths() { return CORRECTOR_MYTHS; }

