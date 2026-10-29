/**
 * MIRRR Contouring Guide for Ethnic Communities
 * Face sculpting, highlighting, and definition for melanin-rich skin
 * Face shape analysis, product guides, community-specific techniques
 */

// ─── CONTOURING FUNDAMENTALS ──────────────────────────────────────────────────

export const CONTOUR_FUNDAMENTALS = {
  what_is_contouring: 'Contouring is the makeup technique of using darker and lighter shades to create the illusion of different facial bone structure. It mimics natural shadows and highlights that give the face dimension. Done well, it is imperceptible. Done badly, it looks like stripes of brown paint.',

  the_science: {
    light_advances: 'Light colours (highlight) appear to come forward — the eye reads them as raised/protruding.',
    dark_recedes: 'Dark colours (contour) appear to go back — the eye reads them as shadowed/recessed.',
    example: 'A dark shadow under the cheekbone makes it look like the cheekbone is above a deep shadow — creating the illusion of a higher, more defined cheekbone.',
  },

  the_ethnic_skin_challenge: {
    challenge: 'The challenge with contouring on darker skin is finding shades and textures that read as shadow, not as a muddy brown stripe. On deeper skin, the wrong contour shade will look grey, ashy, or simply like a different shade of face makeup — not like a natural shadow.',
    solution: [
      'Use WARM-toned contour products for warm-to-neutral undertones',
      'Use MATTE formulas — shimmer in contour defeats the purpose (shimmer advances, not recedes)',
      'Go DEEPER than you think you need to — subtle contour disappears on deep skin',
      'Blend EXTENSIVELY — hard edges look unnatural on any skin tone',
    ],
    flash_photography: 'Under flash photography, contour can disappear entirely if it\'s not deep enough. MUAs for darker-skinned clients and brides must work deeper than they think for the photos to show sculpting.',
  },

  contour_vs_bronzer_reminder: {
    contour: 'Matte. Goes where shadows fall. Creates sculpt.',
    bronzer: 'Often shimmery. Goes where sun hits. Creates warmth and glow.',
    blush: 'Goes on the apples of cheeks or cheekbone area. Adds flush and colour. NOT for sculpting.',
    these_are_different: 'Many YouTube tutorials blur these distinctions and cause people to apply bronzer thinking they\'re contouring. Bronzer as contour = orange-brown smear, not defined sculpt.',
  },
};

// ─── CONTOUR BY FACE SHAPE ────────────────────────────────────────────────────

export const CONTOUR_BY_FACE_SHAPE = {

  round: {
    goal: 'Elongate the face, create definition where bone structure is soft',
    where_to_contour: [
      'Hollows of cheeks (suck in cheeks to find — the hollow below the cheekbone)',
      'Sides of the forehead (temples and above hairline)',
      'Along the jawline (especially sides)',
      'Under the chin if needed',
    ],
    where_to_highlight: [
      'High on the cheekbones (not on the apple of the cheek — high and sweeping outward)',
      'Center of the forehead',
      'Down the nose',
      'Cupid\'s bow and center chin',
    ],
    shape_goal: 'Create vertical lines with the contour — vertical lines elongate',
    ethnic_round: 'Very common face shape in East Asian, Black, and Latin American communities. The Korean and Japanese soft, round face is often a deliberate aesthetic choice — don\'t assume round faces need contouring.',
  },

  oval: {
    goal: 'Define existing natural balance',
    where_to_contour: [
      'Light contour in the hollows of cheeks for definition',
      'Light temple shading if forehead is wide',
      'Very light jawline definition',
    ],
    where_to_highlight: [
      'Cheekbones',
      'Down the nose bridge',
      'Under the eyes (concealer highlight)',
      'Cupid\'s bow',
    ],
    note: 'Oval faces are naturally balanced — contour is optional and should be light. Focus on highlight for glow.',
  },

  square: {
    goal: 'Soften the strong jaw and angular corners',
    where_to_contour: [
      'CORNERS of the jaw — the angles that make it square',
      'Temples and very top of forehead sides',
      'Do NOT contour the hollows aggressively — makes jaw look wider if done at wrong angle',
    ],
    where_to_highlight: [
      'Center of forehead',
      'Cheekbones (oval placement — not too wide)',
      'Under eyes',
      'Center chin (not too wide — emphasises the square)',
    ],
    ethnic_square: 'Square jaw shapes appear commonly in some West African, Korean, and East Asian communities. In Korean beauty, a strong jaw is sometimes addressed with botulinum toxin (jaw slimming injections) which non-surgically reduces masseter muscle. A strong, defined jaw is also increasingly embraced as a power feature.',
  },

  heart: {
    goal: 'Balance wide forehead with narrower lower face',
    where_to_contour: [
      'Wide sides of the forehead (hairline at temples)',
      'Very light along the forehead to visually reduce it',
      'Can skip cheek hollow contour or keep it minimal',
    ],
    where_to_highlight: [
      'Center of the forehead only',
      'Center under eyes',
      'Keep highlight narrow — wide placement emphasises the wide forehead',
      'Lightly on the chin to bring it forward visually',
    ],
    note: 'Heart faces should focus MOST on softening the forehead, not heavy cheek sculpting.',
  },

  long: {
    goal: 'Shorten the appearance of a long face',
    where_to_contour: [
      'Top of the forehead at the hairline (creates a horizontal shadow that reduces length)',
      'Bottom of the chin',
      'Skip the side-of-face vertical contour which would further elongate',
    ],
    where_to_highlight: [
      'WIDE across the cheekbones — horizontal highlight placement',
      'Keep placement wide rather than high',
      'Avoid long vertical highlight down the nose — this elongates further',
    ],
    ethnic_long: 'Long face shapes appear commonly in East African and some South Asian communities. Horizontal placements and wider application at the widest point of the face (cheekbones) counterbalances length.',
  },

  diamond: {
    goal: 'Soften the prominent cheekbones',
    where_to_contour: [
      'Very light at outer cheekbones (reduces their prominence)',
      'Minimal or no hollow contour — this area is already dramatic',
    ],
    where_to_highlight: [
      'Wide on the forehead to add width visually',
      'Center chin to add width there too',
      'Very gentle on cheekbones (highlight here emphasises their prominence)',
    ],
  },
};

// ─── NOSE CONTOURING ──────────────────────────────────────────────────────────

export const NOSE_CONTOURING = {
  overview: 'Nose contouring is highly personal and culturally complex. It can make noses appear slimmer, wider, shorter, or longer. Before diving into techniques, a note on cultural context.',

  cultural_context: {
    note: 'Nose contouring for "slimming" or Europeanising the nose shape has been controversial in ethnic beauty spaces. Many South Asian, African, Arab, and Latina women have been made to feel their natural nose shapes are undesirable — this is rooted in colonialism and Eurocentric beauty standards.',
    empowerment: 'The goal of nose contouring should be to ENHANCE your features the way you want to — not to make an ethnic nose look less ethnic. A wide, rounded nose is beautiful. A prominent bridge is beautiful. A flat bridge is beautiful.',
    equally_valid: 'Contouring to slim the nose is equally valid as leaving it alone or contouring to add definition. The choice belongs to the person.',
  },

  slim_nose_contour: {
    application: [
      'Apply contour shade (matte, deeper than foundation) along both sides of the nose bridge using a very small flat brush',
      'Keep lines close to the center — the further apart the lines, the wider the nose appears',
      'Blend edges carefully — hard lines are very noticeable here',
      'Optional: light shimmer or highlight down the center bridge between the shadow lines',
    ],
    tip_of_nose: 'For a rounder nose tip: circle the tip with contour, leaving the very center lighter',
    caution: 'The most common mistake is going too wide with contour lines or not blending enough. Start close to center and widen if needed.',
  },

  define_nose_bridge: {
    for: 'Those with flat or less defined nose bridges who want to create the appearance of more dimension',
    application: [
      'Very light highlight exactly down the center of the bridge',
      'Small amount of contour on either side of the highlight (very minimal)',
      'No contouring at the nostrils (this would appear to widen)',
    ],
    ethnic_context: 'East Asian women often contour to add bridge definition rather than to slim — a very different goal requiring a different approach.',
  },

  shorten_nose: {
    for: 'Those who want the nose to appear shorter',
    application: [
      'Contour applied just under the nose tip (across, horizontally)',
      'This creates a shadow that visually "pushes up" the tip',
    ],
  },
};

// ─── ETHNIC-SPECIFIC CONTOURING GUIDANCE ──────────────────────────────────────

export const ETHNIC_CONTOUR_GUIDE = {

  south_asian: {
    common_face_shapes: 'Oval and heart face shapes are common; diamond and round also common',
    natural_bone_structure: 'Many South Asian women have naturally prominent cheekbones and brow bones — contouring can be light because structure is already there',
    contour_shade_recommendation: 'Deep warm brown (2-3 shades deeper than foundation) — NOT grey or cool-toned. South Asian skin is predominantly warm to neutral undertone.',
    typical_approach: 'Strong highlight on the cheekbone, defined jawline, very defined brow bone highlight. The Bollywood aesthetic favours dramatic sculpture.',
    recommended_products: [
      { name: 'Huda Beauty Contour Palette', note: 'Created with diverse skin tones in mind, warm brown shades' },
      { name: 'NYX Highlight & Contour Pro Palette', note: 'Affordable, warm tones' },
      { name: 'Charlotte Tilbury Filmstar Bronze & Glow', note: 'A cult product for warm Mediterranean/South Asian tones' },
    ],
  },

  arab: {
    common_face_shapes: 'Oval and heart shapes common; many Arab women have strong jawlines',
    natural_features: 'Strong cheekbones, defined jaw structure common — the Arab face shape typically carries makeup beautifully',
    contour_shade: 'Warm medium-to-deep brown. Olive-skin undertone requires a golden-warm contour to avoid looking grey.',
    typical_approach: 'Strong definition of cheekbones and jaw — the "editorial" Arab look favours architectural contour. Nose contour is common in Arab bridal makeup.',
    highlight: 'Gold highlight is iconic in Arab makeup culture. Intense, blinding gold on cheekbones is the expectation for special occasion looks.',
    recommended_products: [
      { name: 'Fenty Beauty Killawatt Highlighter in Trophy Wife', note: 'Intense gold — very popular in Arab beauty community' },
      { name: 'Huda Beauty Tantour Contour and Bronze Cream', note: 'Warm, buildable' },
    ],
  },

  west_african: {
    common_face_shapes: 'Round faces are common; wide foreheads and prominent jaw common',
    natural_features: 'Prominent facial features that can carry dramatic makeup',
    contour_shade: 'Must be DEEP and WARM — this is the most important guidance for West African skin. Products designed for fair/medium skin will be invisible. Look for deep espresso, deep warm brown.',
    typical_approach: 'Deep, strong contour that shows up under photography and flash. Heavy highlight (deep gold, copper).',
    challenge: 'Finding contour products deep enough to show on very deep skin tones — mainstream products are often designed for fair to medium skin',
    recommended_products: [
      { name: 'Juvia\'s Place I Am Magic Foundation (used as contour mix-in)', note: 'Deep pigmented, warm tones' },
      { name: 'RCMA No-Color Powder (mixed with dark eyeshadow)', note: 'MUA technique for very deep contour' },
      { name: 'Danessa Myricks Monochromatic Multisticks', note: 'Made specifically with deep skin in mind' },
    ],
    highlight: [
      'Deep gold — not champagne or light shimmer',
      'Copper for extra warmth',
      'Fenty Beauty Killawatt Highlighters (specifically created for deep skin)',
    ],
  },

  east_asian: {
    common_face_shapes: 'Round face shapes common; some oval; flat profile typical (less prominent nose bridge)',
    typical_approach: 'K-beauty contouring tends to be minimal — a light grey-brown shadow at temples, a light contour to add dimension rather than dramatic sculpt',
    nose_contour: 'East Asian nose contouring often focuses on ADDING bridge definition (highlight down bridge) rather than slimming',
    favourite_technique: 'The "glass skin" aesthetic prioritises skin texture over heavy contour — sheer glow rather than defined shadows',
    recommend: 'Light hand, buildable products, natural finish',
    recommended_products: [
      { name: 'NARS Soft Matte Complete Concealer (used as contour)', note: 'Very natural-looking when applied sheer' },
      { name: 'Son & Park Beauty Filter Cream Glow (with light contour)', note: 'Korean brand, naturally glowing skin focus' },
    ],
  },

  black_american: {
    common_face_shapes: 'All face shapes — very diverse community',
    natural_features: 'Varied widely — from round to oval to square',
    contour_shade: 'Deep warm brown to deep espresso — must be significantly deeper than foundation to show up. Cool-toned contour often reads as ashy on warm Black skin.',
    typical_approach: 'Bold and visible — Black makeup artistry embraces dramatic, well-defined work. Contour should be SEEN as intentional and beautiful, not invisible.',
    highlight: 'Deep gold to copper — the glass skin/highlight trend in Black beauty culture emphasises intense, rich metallic glow',
    recommended_products: [
      { name: 'Juvia\'s Place Warrior 2 Palette (contour shades)', note: 'Designed for melanin' },
      { name: 'Make Up For Ever Ultra HD Stick Foundation (dark shade as contour)', note: 'Award-winning technique in Black MUA community' },
    ],
  },
};

// ─── PRODUCT FORMULAS FOR CONTOURING ──────────────────────────────────────────

export const CONTOUR_PRODUCT_FORMULAS = {
  powder: {
    pros: ['Easy to blend', 'Good for oily skin', 'Buildable', 'Best for beginners'],
    cons: ['Can look powdery/flat', 'Less staying power in heat'],
    best_for: 'Everyday wear, oily to combination skin, beginners',
    application: 'Angled brush, fluffy brush for blending',
  },
  cream: {
    pros: ['Blends seamlessly', 'More natural-looking', 'Lasts longer on dry skin', 'Great for photography'],
    cons: ['Can crease on very oily skin', 'More technique required'],
    best_for: 'Dry skin, bridal makeup, special occasions, deeper skin tones (cream blends into skin better)',
    application: 'Small flat brush, sponge, fingers',
    preferred_for_ethnic_skin: 'Many MUAs working with deep skin prefer cream contour — it integrates with skin rather than sitting on top',
  },
  stick: {
    pros: ['Travel-friendly', 'Easy to apply', 'Good for on-the-go'],
    cons: ['Less control than brush application'],
    best_for: 'Touch-ups, busy lifestyle',
  },
};

// ─── HIGHLIGHT PLACEMENT ──────────────────────────────────────────────────────

export const HIGHLIGHT_PLACEMENT = {
  where_light_naturally_hits: [
    'Tops of cheekbones (not in the hollow — ON TOP of the bone)',
    'Brow bone (just below the outer brow)',
    'Inner corners of eyes',
    'Center of the nose bridge',
    'Cupid\'s bow (the two peaks of the upper lip)',
    'Center of the chin',
    'Center of the forehead',
  ],

  for_deep_skin: {
    principle: 'For deep skin, INTENSITY matters. A subtle champagne highlight will be invisible. You need either very high intensity or warm/deep metallic colours.',
    best_highlight_types: [
      'Deep gold — works on virtually all deeper skin tones',
      'Copper — especially on very warm undertones',
      'Bronze — creates depth and warmth simultaneously',
      'Avoid: icy silver, pearl white, light champagne on deep skin — these look grey or ashy rather than glowing',
    ],
    application_tip: 'For photography and events: apply highlight over setting powder (not under) — the powder base reduces slip and the pigment sits on top to reflect light maximally',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getContourGuideForCommunity(communityId) {
  return ETHNIC_CONTOUR_GUIDE[communityId.replace('-', '_')] || ETHNIC_CONTOUR_GUIDE['west_african'];
}

export function getContourForFaceShape(faceShape) {
  return CONTOUR_BY_FACE_SHAPE[faceShape] || null;
}

export function getNoseContourGuide(goal) {
  const guides = {
    slim: NOSE_CONTOURING.slim_nose_contour,
    define: NOSE_CONTOURING.define_nose_bridge,
    shorten: NOSE_CONTOURING.shorten_nose,
  };
  return guides[goal] || NOSE_CONTOURING;
}

export function getHighlightGuide() {
  return HIGHLIGHT_PLACEMENT;
}

export function getContourProductFormulas() {
  return CONTOUR_PRODUCT_FORMULAS;
}

export const CONTOUR_GUIDE_STATS = {
  faceShapesCovered: Object.keys(CONTOUR_BY_FACE_SHAPE).length,
  communitiesWithGuide: Object.keys(ETHNIC_CONTOUR_GUIDE).length,
  productFormulas: Object.keys(CONTOUR_PRODUCT_FORMULAS).length,
};
