/**
 * MIRRR Cheek Makeup Guide
 * Blush, bronzer, highlighter, contour — placement by face shape,
 * skin tone considerations, formulas, and multicultural cheek beauty traditions
 */

// ─── THE CHEEK TRIO ───────────────────────────────────────────────────────────

export const CHEEK_TRIO_OVERVIEW = {
  blush: {
    product: 'Blush',
    purpose: 'Adds warmth and flush of colour to the cheeks; creates a healthy, youthful appearance; lifts the face when applied correctly.',
    placement_principle: 'Traditionally on the "apple" (rounded part) of the cheeks; modern placement varies significantly by technique and trend.',
  },
  bronzer: {
    product: 'Bronzer',
    purpose: 'Adds warmth and dimension; mimics a sun-kissed effect; used for contouring in some applications.',
    distinction: 'Bronzer and contour are NOT the same. Bronzer adds WARMTH (brownish-golden). Contour adds SHADOW (cool-toned brown/grey). Using the wrong one in the wrong place muddles both effects.',
  },
  highlighter: {
    product: 'Highlighter',
    purpose: 'Adds light to high points of the face; creates illusion of luminosity and lift; draws attention to areas of elevation.',
    placement: 'Cheekbone tops, bridge of nose (optional), brow bone, cupid\'s bow, inner corner of eyes, down the nose.',
  },
  contour: {
    product: 'Contour',
    distinction: 'Contour products should be COOL-TONED (grey-brown, taupe, ash brown) to mimic shadow. A warm bronzer used as contour will look muddy or orange, not shadow-like.',
    ethnic_note: 'Contour must be appropriately deep for the skin tone. A fair-skin contour product on deep skin simply disappears or looks grey-incorrect. Choose a contour shade 2-3 shades deeper than your own skin in a COOL-TONED formula.',
  },
};

// ─── BLUSH FORMULAS ───────────────────────────────────────────────────────────

export const BLUSH_FORMULAS = {
  powder: {
    formula: 'Powder Blush',
    best_for: 'Normal to oily skin; beginners (easiest to blend and remove); layering over powder foundation',
    application: 'Fluffy dome brush or angled blush brush. Tap off excess before applying.',
    longevity: 'Moderate. Can fade in heat or with excess oil.',
    top_picks: ['NARS Orgasm (peachy-pink with shimmer)', 'Milani Baked Blush', 'Charlotte Tilbury Pillow Talk (soft mauve-pink)'],
  },
  cream: {
    formula: 'Cream Blush',
    best_for: 'Dry to normal skin; dewy, skin-like finish; those who want a natural "flushed from within" look',
    application: 'Fingers (warm up the product for natural blending), a damp sponge, or a stippling brush. Apply BEFORE setting powder.',
    longevity: 'Excellent when applied under powder. Can slide on oily skin if not set.',
    top_picks: ['RMS Beauty Lip2Cheek', 'e.l.f. Monochromatic Multi-Stick', 'Fenty Beauty Cheeks Out Cream Blush'],
    ethnic_note: 'Cream blush gives the most skin-like, natural result on all skin tones. Particularly beautiful on deeper skin where powder blush can sometimes look "dusty".',
  },
  liquid: {
    formula: 'Liquid / Serum Blush',
    best_for: 'Buildable colour with a sheer base; dewy and glowing finishes',
    application: 'A few drops blended quickly with a damp sponge or fingertips. Work fast — these set quickly.',
    longevity: 'Excellent. Stains the skin.',
    tip: 'Apply BEFORE foundation for most natural results; apply OVER foundation for more visible pop.',
    top_picks: ['Rare Beauty Soft Pinch Liquid Blush (intense pigment — use sparingly)', 'Milk Makeup Lip + Cheek (multipurpose stick)', 'NARS Liquid Blush'],
    warning: 'Rare Beauty Soft Pinch is INTENSELY pigmented. Start with a rice-grain amount.',
  },
  stick: {
    formula: 'Stick / Multipurpose Stick',
    best_for: 'On-the-go; touch-ups; travel; lip-and-cheek coordination',
    application: 'Swipe directly on cheeks then blend with fingers.',
    ethnic_note: 'Multipurpose sticks in terracotta and warm brown-red tones are particularly flattering on medium to deep skin tones.',
  },
  gel_tint: {
    formula: 'Gel Tint / Stain',
    best_for: 'Long-lasting natural flush; minimal-makeup look',
    application: 'Apply quickly and blend immediately — gel stains set fast.',
    longevity: 'All-day.',
  },
};

// ─── BLUSH PLACEMENT BY FACE SHAPE ───────────────────────────────────────────

export const BLUSH_BY_FACE_SHAPE = {
  philosophy: 'Face shape is a guide, not a rule. The goal is usually to create the illusion of balanced, lifted features. But experiment — there are no truly wrong placements, only ones you personally prefer or don\'t.',
  oval: {
    shape: 'Oval',
    characteristics: 'Balanced proportions; wider at cheekbones than forehead; slightly narrow jaw.',
    blush_placement: 'Apply blush to the apple of the cheeks sweeping up toward the temples. This shape is versatile — most placements work.',
    blush_direction: 'Sweeping upward toward temples; or horizontal apple-only for modern "editorial" look.',
  },
  round: {
    shape: 'Round',
    characteristics: 'Equal width and length; full cheeks; soft jawline.',
    blush_placement: 'Avoid placing blush directly on the apples — this emphasises roundness. Instead, apply ABOVE the apples, sweeping diagonally from the cheekbone up toward the temple and hairline.',
    blush_direction: 'Diagonal sweep upward. Creates elongation.',
    avoid: 'Circular apple-only blush or horizontal lines — emphasises width.',
  },
  square: {
    shape: 'Square',
    characteristics: 'Strong angular jaw; similar width at forehead and jaw; angular features.',
    blush_placement: 'Apply blush in an oval/rounded shape at the apples, keeping it lower and more central. Avoid angular or diagonal sweeps — soften, don\'t sharpen.',
    blush_direction: 'Rounded, centred oval placement.',
  },
  heart: {
    shape: 'Heart',
    characteristics: 'Wide forehead; narrow pointed chin; prominent cheekbones.',
    blush_placement: 'Apply directly on the apples sweeping slightly downward (toward the nose). Keeps visual weight lower to balance wide forehead.',
    blush_direction: 'Horizontal or slightly downward sweep. Avoids adding more width to upper face.',
  },
  long: {
    shape: 'Long / Oblong',
    characteristics: 'Noticeably longer than wide; high forehead; long chin.',
    blush_placement: 'Apply horizontally across the apples, extending toward the ears. Creates an illusion of width.',
    blush_direction: 'Horizontal. Never sweep upward to temples — increases perceived length.',
  },
  diamond: {
    shape: 'Diamond',
    characteristics: 'Narrow forehead; very wide cheekbones; narrow jaw.',
    blush_placement: 'Apply to the apple area keeping blush below the widest point of the cheekbones. Do not extend to temples (the widest points).',
    blush_direction: 'Below the cheekbone peak; downward or horizontal.',
  },
};

// ─── MODERN BLUSH TRENDS ─────────────────────────────────────────────────────

export const MODERN_BLUSH_TRENDS = {
  draping: {
    trend: 'Draping',
    description: 'Large, sweeping blush application from the cheeks up and around the temples, sometimes connecting under the eyes. A 1970s and 80s technique revived on social media in the 2020s.',
    how_to: 'Apply a large dome brush loaded with blush from the hairline at the temples, sweeping under the eye and down to the apple. Layer colours for depth.',
    result: 'Creates a dramatic sculpted-without-contour effect. The blush does the work of both blush AND structure.',
  },
  under_eye_blush: {
    trend: 'Under-Eye / No-Makeup Blush',
    description: 'Blush applied primarily under and around the eyes, simulating a "naturally flushed" look — as if you\'ve been in the cold or exercising.',
    how_to: 'Use a small dense brush or fingertips to blend cream or powder blush under the eye, very close to the lower lash line and bridge of nose.',
    caution: 'Can emphasise under-eye darkness if you already have significant dark circles.',
    ethnic_note: 'This trend is associated with K-Beauty and spread widely on social media. Works on all skin tones with correct blush tone selection.',
  },
  monochromatic: {
    trend: 'Monochromatic Makeup',
    description: 'Using the same colour family on eyes, cheeks, and lips. A coral blush + coral eyeshadow + coral lip = cohesive, effortless.',
    tip: 'Choose one hero product (often a cream stick that works on multiple areas) and apply throughout.',
  },
  bronze_blush: {
    trend: 'Bronzey Blush',
    description: 'Warm, terracotta, and bronze-toned blushes applied generously for a sun-drenched look.',
    ethnic_note: 'Warm bronze and terracotta tones are PARTICULARLY stunning on medium to deep skin tones. This trend was largely celebrated and elevated by beauty creators of colour.',
  },
  strawberry_makeup: {
    trend: 'Strawberry Makeup',
    description: 'A romantic, flushed aesthetic: red-toned blush at the apples and nose bridge, with red-tinted lips and a fresh, dewy finish.',
    how_to: 'Apply a berry-red cream blush at the apples; blend a touch onto the nose bridge; glossy or stained-looking red lip; minimal eye makeup.',
  },
};

// ─── BRONZER GUIDE ────────────────────────────────────────────────────────────

export const BRONZER_GUIDE = {
  purpose: 'Bronzer adds warmth and mimics the look of sun-kissed skin. Apply where the sun would naturally hit: forehead hairline, temples, top of nose, cheekbones, jawline.',
  three_rule: {
    technique: 'The 3 (Three) Technique',
    description: 'Imagine the number 3 on your face. Apply bronzer along the outside edges following this shape: starting at the forehead hairline, sweep in and down to the temples, across the cheekbones, back out to the jawline, and optionally to the chin. This creates a natural, sun-kissed frame.',
  },
  formula_selection: {
    matte: 'Matte bronzer: for contouring, sombre, and realistic warmth. Best for oily skin or everyday use.',
    shimmer: 'Shimmer bronzer: adds glow AND warmth. Ideal for evening or glowing skin look.',
    satin: 'Satin finish: versatile middle ground. Natural luminosity without full shimmer.',
  },
  shade_selection: {
    rule: 'Bronzer should be 1-2 shades deeper than your skin tone AND warm-toned. The goal is warmth, not darkness.',
    fair: 'Peachy-golden bronzers (e.g. NARS Laguna, Too Faced Milk Chocolate Soleil)',
    medium: 'Golden-tan bronzers (e.g. Charlotte Tilbury Filmstar Bronze & Glow)',
    tan_olive: 'Warm medium-brown bronzers',
    deep: 'Rich warm-brown bronzers (e.g. NARS Casino, Fenty Beauty Sun Stalk\'r Instant Warmth Bronzer in the deepest shades)',
    ethnic_note: 'Many bronzers are formulated for lighter skin tones and appear barely visible or too orange on deeper skin. Seek bronzers specifically formulated for or reviewed by people with similar depth: Fenty Beauty, Juvia\'s Place, Danessa Myricks, and Black Moon Cosmetics consistently deliver for deeper skin.',
  },
  flashback_warning: {
    issue: 'Bronzers with high titanium dioxide or silica content can cause white flashback in flash photography, looking chalky or grey-white in photos.',
    ethnic_note: 'This is a SIGNIFICANT issue for darker skin tones in photographs. Test bronzers in flash photography before events. Finely-milled, non-chalky formulas (avoiding heavy zinc oxide) perform better.',
  },
};

// ─── HIGHLIGHTER GUIDE ────────────────────────────────────────────────────────

export const HIGHLIGHTER_GUIDE = {
  placement: {
    primary: 'Cheekbone tops — highest point of the cheekbone; use a fan brush or tapered dome',
    secondary: 'Brow bone — under the arch of the brow; catches light; lifts',
    nose_bridge: 'Optional — a small amount down the centre of the nose bridges; elongates',
    cupids_bow: 'Small amount on the Cupid\'s bow peaks — catches flash in photos; beautiful in person',
    inner_corners: 'Inner corner of the eyes — opens and brightens (especially on deep-set eyes)',
    centre_lower_lip: 'A tiny dab — creates illusion of pout fullness',
  },
  formula_types: {
    powder: 'Most versatile. Easy to apply. Fan brush or flat dome brush.',
    liquid: 'Mix into foundation for an all-over glow. Or apply directly for an intense highlight.',
    cream_stick: 'Apply before setting powder; finger-blending for most natural finish.',
  },
  shade_selection: {
    fair: 'Champagne, icy pink, silver',
    light_medium: 'Champagne, rose gold, gold',
    medium: 'Gold, peach-gold, rose gold',
    tan_olive: 'Gold, copper, bronze-gold',
    deep: 'Warm gold, bronze, copper — AVOID white/silver/icy highlights on deep skin (look ashy or chalky)',
    ethnic_note: 'Gold and copper highlighters show up beautifully on deeper skin tones. "Blinding" highlighters (intense strobe effect) look incredible on deep skin — do not shy away from intense highlighting.',
  },
  technique_spotlight: {
    spotlight: 'Spotlight Technique',
    description: 'Apply a bright highlighter to ONLY the highest cheekbone point using a small tapered brush. Leave the rest of the face non-highlighted. This creates a focused, editorial beam of light rather than an all-over glow.',
  },
  strobe: {
    strobing: 'Strobing',
    description: 'Replacing contouring with strategic highlighting — using light to create dimension rather than shadow. Apply highlight to the high points; leave the "shadow" areas natural. Faster than full contour + highlight.',
  },
  layering: {
    technique: 'Cream Under Powder Highlight',
    description: 'Apply a cream or liquid highlighter as base. Set lightly. Apply powder highlighter on top. Layering creates an "inner glow" effect that looks like the light is coming from within the skin rather than sitting on top.',
  },
};

// ─── ETHNIC CHEEK TRADITIONS ──────────────────────────────────────────────────

export const ETHNIC_CHEEK_TRADITIONS = {
  west_african: {
    community: 'West African',
    traditions: 'Bold bronzed looks popular for festive occasions. Intense "blinding" highlight is a popular choice in Nigerian glam makeup. Shea butter as natural skin luminiser.',
    modern: 'Nigerian MUAs (makeup artists) have pushed blinding highlight and heavy bronze looks to global audiences through YouTube and Instagram.',
  },
  south_asian: {
    community: 'South Asian',
    traditions: 'Traditional bridal looks use blush for rosy cheeks ("rosy as a bride"). Haldi ceremony (turmeric) gives a natural golden glow. Sindoor (vermilion red) at the hairline parting is the traditional married woman\'s marker rather than cosmetic blush.',
    modern: 'Pakistani and Indian beauty creators have popularised draping, heavy highlight, and flawless glowing skin as key cheek aesthetics.',
  },
  caribbean: {
    community: 'Caribbean',
    traditions: 'Sun-kissed bronzed looks celebrated. Bold blush for festivals and carnival. Natural coconut oil skin luminosity.',
  },
  arab: {
    community: 'Arab',
    traditions: 'Glowing, dewy skin prized across Arab beauty culture. Rose-gold and golden highlighter very popular. Blush typically warm and soft rather than dramatic. Contour is a central part of many Gulf Arab makeup looks.',
    modern: 'Arab beauty creators influenced the "glass skin" trend and heavily highlighted, contoured looks popular on social media.',
  },
  latina: {
    community: 'Latina',
    traditions: 'Vibrant, warm blush celebrated. Bronzed looks for festive occasions. Colombian, Mexican, and Brazilian beauty cultures known for warm, glowing, bronzed cheek aesthetics.',
    modern: 'Latina beauty YouTubers popularised warm-toned contouring and heavy highlight looks in the early 2010s.',
  },
  east_asian: {
    community: 'East Asian',
    traditions: 'K-Beauty celebrates the "apple cheek" — circular blush at the apple for a youthful, cute look. Chinese beauty (C-Beauty) often features delicate blush with an emphasis on dewiness. Japanese beauty traditionally values subtle, feminine blush.',
    modern: 'K-Beauty trends (gradient blush, apple-only blush) have profoundly influenced global blush application methods.',
  },
  east_african: {
    community: 'East African',
    traditions: 'Natural skin luminosity celebrated. Ethiopian beauty traditions include frankincense-based skin preparations that give a natural glow.',
  },
  south_african: {
    community: 'South African',
    traditions: 'Cape Malay beauty includes bold festive looks. Marula oil as natural luminiser. Diverse aesthetic influences across the country\'s communities.',
  },
  black_american: {
    community: 'Black American',
    traditions: 'Bold, warm cheek looks have been central. Fashion Fair, founded in 1973 for deep skin, made warm bronzed cheek shades widely available. "Laid" and "snatched" makeup looks often feature dramatic highlight and contour.',
    modern: 'Black American MUAs and beauty creators pioneered many cheek application techniques now mainstream. The "blinding highlight" trend, heavy bronze, and bold blush were all part of Black American beauty culture before going global.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getBlushFormula(formula) {
  return BLUSH_FORMULAS[formula] || BLUSH_FORMULAS;
}
export function getBlushPlacementByFaceShape(shape) {
  return BLUSH_BY_FACE_SHAPE[shape] || BLUSH_BY_FACE_SHAPE;
}
export function getModernBlushTrend(trend) {
  return MODERN_BLUSH_TRENDS[trend] || MODERN_BLUSH_TRENDS;
}
export function getBronzerGuide() { return BRONZER_GUIDE; }
export function getHighlighterGuide() { return HIGHLIGHTER_GUIDE; }
export function getCheekTrio() { return CHEEK_TRIO_OVERVIEW; }
export function getEthnicCheekTradition(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_CHEEK_TRADITIONS[key] || Object.values(ETHNIC_CHEEK_TRADITIONS);
}

