/**
 * MIRRR Makeup for Glasses Wearers Guide
 * Eye makeup strategies for spectacle wearers, contact lens tips,
 * frame-to-face matching, and eyebrow guidance with glasses
 */

// ─── GLASSES AND EYE MAKEUP FUNDAMENTALS ─────────────────────────────────────

export const GLASSES_MAKEUP_OVERVIEW = {
  why_different: {
    visual_effect: 'Eyeglass lenses — especially corrective lenses — change the visual perception of the eyes and surrounding features. Understanding how your prescription changes how others see your eyes is essential to adapting your makeup.',
    myopia: {
      what: 'Short-sightedness (concave/minus lenses) — lenses are thicker at the edge than the centre.',
      effect_on_eyes: 'Myopic lenses MINIMISE the appearance of eyes — they make eyes appear smaller and more deeply set. The stronger the prescription, the more pronounced this effect.',
      makeup_goal: 'OPEN and ENLARGE the eye — counteract the minimising effect of the lenses.',
    },
    hyperopia: {
      what: 'Long-sightedness (convex/plus lenses) — lenses are thicker in the centre.',
      effect_on_eyes: 'Hyperopic lenses MAGNIFY the appearance of eyes — make eyes appear larger. They also magnify any imperfections and makeup details.',
      makeup_goal: 'Create neat, precise makeup that withstands magnification. Can go lighter with eye colour intensity.',
    },
    astigmatism: 'Cylindrical correction — often combined with myopia or hyperopia. Effects depend on the primary correction.',
    no_correction: 'Some people wear glasses for fashion (non-prescription) or blue light blocking. Makeup adapts for frame style rather than lens effect.',
  },

  frame_considerations: {
    thick_frames: 'Bold frames (chunky, dark, or coloured) create strong contrast with the face. They draw attention — eye makeup can be bolder to balance. A face with dramatic thick frames + bold eye makeup reads as intentional.',
    thin_wire_frames: 'Minimal frames — eye makeup is the star. Can be as dramatic as desired.',
    oversized: 'Large frames draw the eye to the full frame area — the eye behind becomes part of a larger aesthetic. Keep eye makeup cohesive with the frame aesthetic.',
    coloured_frames: 'Coloured or patterned frames should inform your makeup colour choices — complement or carefully contrast.',
    frame_colour: {
      black_or_dark: 'Classic, versatile. Pair with any eye colour and most makeup looks.',
      tortoiseshell: 'Warm brown tones. Pair with warm eye makeup (browns, coppers, taupes).',
      clear: 'Minimalist. Pair with fresh, natural makeup or intentionally dramatic eye looks.',
      coloured: 'Match or complement to eye makeup — e.g., blue frames + navy liner, or blue frames + coral shadow for contrast.',
    },
  },
};

// ─── MAKEUP STRATEGIES BY PRESCRIPTION TYPE ───────────────────────────────────

export const PRESCRIPTION_MAKEUP_GUIDE = {
  myopia_minus_lenses: {
    strategy: 'Open, brighten, and visually enlarge the eyes. Every technique focuses on making eyes appear larger and more present through the minimising lens.',

    eye_shadow: [
      'Use LIGHT shades on the inner corner and lid — light reflects and opens up the eye',
      'Avoid dark, heavy shadows across the entire lid — they shrink the eye further',
      'A halo eye (light centre + slightly deeper outer corner) creates the illusion of larger eyes',
      'Shimmer and highlight on the inner corner and brow bone are particularly effective',
      'If using darker shades, limit to the very outer corner and blend well upward',
    ],

    liner: [
      'White, nude, or flesh-toned waterline liner — brightens and enlarges the eye dramatically',
      'Black waterline liner makes eyes appear smaller — use sparingly or avoid',
      'Apply liner as close to the lashes as possible — a thick gap of lid between lashes and liner makes eyes look smaller',
      'Tightlining (applying liner underneath the upper lashline from the inside) adds definition without appearing to shrink the eye',
      'Wing liner — extend the wing upward for lift and length. Keep the wing thin to not overwhelm.',
    ],

    mascara: [
      'The most important tool for myopia wearers — lashes draw the eye and create volume without colour shadow',
      'Focus mascara on the UPPER lashes — volumising and lengthening',
      'Individual lash extensions or strip lashes dramatically help myopia wearers',
      'Curling lashes (lash curler) before mascara opens the eye significantly',
    ],

    brow: 'Well-defined brows frame the eyes and give visible structure through glasses. Slightly more defined brows than you might use without glasses.',

    what_to_avoid: [
      'Heavy dark liner on the waterline',
      'All-dark, heavy smoky eye',
      'Nude/invisible brows',
      'Mascara only on lower lashes',
    ],
  },

  hyperopia_plus_lenses: {
    strategy: 'Precision matters — magnification means every detail shows. Go neater and more precise than you usually would. Eye makeup actually shows well.',

    eye_shadow: [
      'Blend, blend, blend — harsh edges are magnified',
      'Avoid heavy, dramatic shadow in the crease — the magnification of plus lenses can make a crease look overdone',
      'Soft, diffuse colour looks more natural and flattering',
      'Warm, natural tones tend to flatter as they work with the magnification rather than fighting it',
    ],

    liner: [
      'A slightly thinner, more precise line than you might otherwise use',
      'Waterproof formula is essential — magnified eyelids with smudged liner look messy',
      'Wing liner looks beautiful — magnified lids means the wing reads clearly',
    ],

    mascara: [
      'Remove any clumps carefully — magnification shows everything',
      'Lengthening rather than clumping formulas work better',
      'Avoid heavy lower lash mascara — can look crowded under magnification',
    ],

    brow: 'Keep brows groomed and natural-looking. Magnification can reveal brow product harshness — opt for powder or tinted gels over drawn-on lines.',
  },
};

// ─── FRAME AND FACE SHAPE GUIDANCE ────────────────────────────────────────────

export const FRAME_FACE_GUIDE = {
  face_shapes: {
    oval: {
      description: 'Balanced proportions — slightly wider cheekbones, gently tapered jaw and forehead.',
      best_frames: 'Most frame shapes flatter — avoid frames wider than the widest point of the face.',
    },
    round: {
      description: 'Equal width and length, soft jaw.',
      best_frames: 'Angular, rectangular frames add definition and elongate the face.',
      avoid: 'Round or oval frames that echo the face shape.',
    },
    square: {
      description: 'Strong jaw, similar width at forehead and jaw.',
      best_frames: 'Round, oval, or cat-eye frames soften the angular jaw.',
      avoid: 'Boxy, angular frames that emphasise the square shape.',
    },
    heart: {
      description: 'Wide forehead, narrow jaw.',
      best_frames: 'Bottom-heavy, wider-at-bottom frames balance the narrow jaw.',
      avoid: 'Top-heavy or strongly cat-eye frames that add visual weight to the forehead.',
    },
    diamond: {
      description: 'Narrow forehead, wide cheekbones, narrow jaw.',
      best_frames: 'Frames with detail at top (browline, cat-eye) to widen the forehead.',
    },
    oblong_long: {
      description: 'Face is longer than wide.',
      best_frames: 'Oversized, round, or deep frames add visual width and balance.',
      avoid: 'Narrow frames that elongate further.',
    },
  },

  ethnic_face_features: {
    note: 'Face shape analysis developed largely from a Western framework. Many people across ethnic communities have features not well described by this simple taxonomy — broad flat bridges, prominent cheekbones, wider jaw structures, etc.',
    bridge_fit: 'Asian (and some Black and Latina) facial features often include lower, broader nose bridges that cause standard glasses to slide. Look for frames with nose pads that adjust, or Asian-fit/universal-fit frames. Many global eyewear brands now offer Asian fit.',
    wider_face: 'Some West African and Caribbean individuals have wider facial structures that require wider-than-standard frame widths. Specialist retailers or custom options are sometimes needed.',
  },
};

// ─── EYEBROW GUIDANCE FOR GLASSES WEARERS ─────────────────────────────────────

export const BROWS_WITH_GLASSES = {
  key_principles: [
    'Your brows should interact with your frames — if frames sit over the brow, the brow creates a double line that can look messy.',
    'If frames sit below the brow (the ideal for most glasses), brows should be clearly visible above the top rim.',
    'Keep brows at or slightly above the top of the frame.',
  ],

  brow_shape_guide: {
    bold_frames: {
      note: 'With bold, statement frames, brows can be either understated (let the frames do the work) or equally bold (intentional power brow + bold frame look).',
      avoid: 'Brows that blend with or disappear behind the frame.',
    },
    thin_or_no_frames: {
      note: 'Without strong frame competition, brows carry the face-framing responsibility.',
      suggestion: 'A slightly more defined brow than usual completes the look.',
    },
  },

  filling_tips: [
    'Use eyebrow powder or tinted brow gel for glasses — pencil can create too-precise lines that look harsh behind magnifying lenses',
    'Feathery, hair-like strokes (brow pen or fine tip brow pencil) look most natural under magnification',
    'Brow gel setting spray prevents smudging under nose pads or frame contact',
  ],
};

// ─── CONTACT LENSES AND MAKEUP ────────────────────────────────────────────────

export const CONTACT_LENS_MAKEUP = {
  safety_priority: 'Eye health always comes first. Contaminating contact lenses with makeup can cause serious eye infections.',

  order_of_operations: {
    morning: [
      '1. Wash hands thoroughly',
      '2. INSERT contact lenses FIRST before any eye makeup',
      '3. Apply eye makeup after lenses are in',
    ],
    evening: [
      '1. REMOVE contact lenses FIRST before removing makeup',
      '2. Then remove eye makeup',
      '3. Never remove makeup with lenses in — fibres and pigment can get under lenses',
    ],
  },

  contact_safe_products: {
    mascara: [
      'Non-waterproof is safer with contacts — easier to remove without rubbing',
      'Tubing mascaras (slide off with warm water) are excellent for contact lens wearers',
      'Fibre mascaras — fibres can get into the eye and under lenses. Use cautiously.',
    ],
    liner: [
      'DO NOT line the inner waterline if wearing contact lenses — liner particles contaminate the lens directly',
      'Apply liner as close to lashes as possible but on the outer side of the lashes',
      'Gel or felt-tip liner is safer than powder liner which can flake',
    ],
    eyeshadow: [
      'Loose glitter and loose powder eyeshadow are HIGH RISK with contacts — particles fall into the eye',
      'Pressed shadows are safer — less fallout',
      'Always tap excess powder from your brush before applying near the eye',
      'Apply lower lash mascara with eye closed, brush upward to prevent particles getting under lens',
    ],
    remover: 'Oil-based removers can contaminate lenses if lenses are still in. Always remove lenses first.',
  },

  best_mascaras_for_contacts: [
    'Neutrogena MoistureSmooth — smooth formula, won\'t crumble under lenses',
    'Clinique High Impact Mascara — clean formula',
    'Thrive Causemetics — ophthalmologist tested',
    'Elf Lash \'N Roll — budget, contact safe',
  ],
};

// ─── THE COMPLETE GLASSES GLAM ROUTINE ────────────────────────────────────────

export const GLASSES_GLAM_ROUTINE = {
  for_myopia: {
    prep: 'Eye primer — helps shadow last all day (hot face + glasses wear = easier smudging under lens rims).',
    steps: [
      '1. Prime eyelids with flesh-toned or white primer for maximum pigment pop',
      '2. Apply champagne or light nude shimmer across inner half of lid',
      '3. Place medium shade at outer corner and blended into crease',
      '4. Curl lashes',
      '5. Apply white or nude waterline liner to lower waterline',
      '6. Tightline upper lashline with dark pencil/gel liner',
      '7. Mascara — focus on upper lashes, 2-3 coats, lifting with curled brush',
      '8. Highlight inner corner',
      '9. Frame is the final accessory — slip on glasses and the look is complete',
    ],
  },

  for_bold_frames: {
    approach: 'Bold frames with strong eye makeup is a fashion statement. Keep the rest of the face simple — the frame + eye is the statement.',
    tip: 'Red lip + bold frame + minimal eye is also very chic — the frame does the eye work.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getGlassesMakeupOverview() {
  return GLASSES_MAKEUP_OVERVIEW;
}

export function getMakeupForPrescription(prescriptionType) {
  if (prescriptionType === 'myopia' || prescriptionType === 'minus') {
    return PRESCRIPTION_MAKEUP_GUIDE.myopia_minus_lenses;
  }
  if (prescriptionType === 'hyperopia' || prescriptionType === 'plus') {
    return PRESCRIPTION_MAKEUP_GUIDE.hyperopia_plus_lenses;
  }
  return PRESCRIPTION_MAKEUP_GUIDE;
}

export function getFrameFaceGuide(faceShape) {
  if (faceShape && FRAME_FACE_GUIDE.face_shapes[faceShape]) {
    return FRAME_FACE_GUIDE.face_shapes[faceShape];
  }
  return FRAME_FACE_GUIDE;
}

export function getBrowsWithGlassesGuide() {
  return BROWS_WITH_GLASSES;
}

export function getContactLensMakeupGuide() {
  return CONTACT_LENS_MAKEUP;
}

export function getGlassesGlamRoutine(prescriptionType) {
  if (prescriptionType === 'myopia') return GLASSES_GLAM_ROUTINE.for_myopia;
  return GLASSES_GLAM_ROUTINE;
}

export const GLASSES_MAKEUP_STATS = {
  prescriptionTypesCovered: 2,
  faceShapesCovered: Object.keys(FRAME_FACE_GUIDE.face_shapes).length,
  contactSafetyTips: Object.keys(CONTACT_LENS_MAKEUP).length - 1,
};
