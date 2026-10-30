/**
 * MIRRR Makeup Tools Guide
 * Brushes, sponges, applicators — and how to use them for ethnic skin
 * Includes tool care and budget vs. investment breakdown
 */

// ─── FACE BRUSHES ─────────────────────────────────────────────────────────────

export const FACE_BRUSHES = {
  foundation: {
    name: 'Foundation Brush',
    types: {
      flat_kabuki: {
        name: 'Flat Kabuki / Paddle Brush',
        best_for: 'Full coverage; pressing formula into skin',
        technique: 'Stipple (press in, don\'t sweep) for maximum coverage and less streaking',
        forMelaninSkin: 'Excellent for building up coverage on uneven skin tone without going cakey',
        picks: [
          { name: 'Real Techniques Expert Face Brush' },
          { name: 'Morphe M439 Deluxe Buffer Brush' },
        ],
      },
      buffing: {
        name: 'Buffing / Stippling Brush',
        best_for: 'Buildable coverage; natural finish',
        technique: 'Circular buffing motions blend seamlessly',
        forMelaninSkin: 'Great for sheer-to-medium buildable looks — allows very controlled application so you can build specifically in needed areas without overdoing rest of face',
        picks: [
          { name: 'Sigma F80 Flat Kabuki' },
        ],
      },
      flat_shader: {
        name: 'Flat Shader Brush',
        best_for: 'Liquid foundation; precise application under eyes',
        technique: 'Press and drag in downward strokes following facial hair direction',
        note: 'Following hair direction minimises ashy streak look on Fitzpatrick V-VI skin',
      },
    },
  },
  powder: {
    name: 'Powder Brushes',
    types: {
      fluffy_powder: {
        name: 'Fluffy Powder Brush',
        best_for: 'Setting loose powder all over; translucent powder finishing',
        technique: 'Swirl in product, tap off excess, sweep lightly',
        forMelaninSkin: 'CAUTION: Translucent setting powders can leave grey/ashy cast on Fitzpatrick IV-VI. Use tinted or colour-correcting powders instead. Laura Mercier Translucent Powder has a "Deep" shade specifically for darker skin.',
      },
      packing_powder: {
        name: 'Packing / Pressing Powder Brush',
        best_for: 'Setting under-eye concealer; baking technique',
        technique: 'Press — do not sweep — to lock in without disturbing',
        note: 'The "baking" technique (Korean beauty term) presses translucent powder and leaves 5–10 min — important for Fitzpatrick IV-VI to use warmth-toned powder to avoid white flash in photos',
      },
      fan: {
        name: 'Fan Brush',
        best_for: 'Light dusting of highlighter; brushing away fallout',
        technique: 'Very light, feathery strokes',
        forMelaninSkin: 'Best for precise highlighter placement on high cheekbones — common in West African and Caribbean beauty looks',
      },
    },
  },
  contour: {
    name: 'Contour & Sculpting Brushes',
    types: {
      angled_contour: {
        name: 'Angled Contour Brush',
        best_for: 'Powder and cream contour; defining cheekbones, nose, temples',
        technique: 'Apply under cheekbone in a C-shape from temple to mid-cheek',
        forMelaninSkin: 'Darker skin tones can use deeper contour shades (cool browns, not grey/taupe) — the contrast threshold is higher, so lighter contour shades can look muddy',
      },
      small_contour: {
        name: 'Small Contour / Nose Brush',
        best_for: 'Nose contour; tight area sculpting',
        technique: 'Tap product on sides of nose bridge and tip for 3D effect',
      },
    },
  },
  blush: {
    name: 'Blush Brushes',
    types: {
      dome_blush: {
        name: 'Dome-Shaped Blush Brush',
        best_for: 'Natural flushed look; cheek apples',
        technique: 'Smile, apply to apples of cheeks, sweep back toward temples',
        forMelaninSkin: 'On deeper skin tones, blush shows differently — warm terracottas, brick reds, and deep corals are visible. Light pinks vanish. Juvia\'s Place I Am Magic palette is designed for visible blush on darker skin.',
      },
      tapered_blush: {
        name: 'Tapered Blush Brush',
        best_for: 'Draped blush (trend: blush applied high, across temples and nose bridge)',
        technique: 'Apply at temples, sweep across and under eyes — sunburned effect',
      },
    },
  },
  highlighter: {
    name: 'Highlighter Brushes',
    types: {
      fan_highlight: {
        name: 'Fan Brush (for highlight)',
        best_for: 'Diffuse glow; large areas',
        forMelaninSkin: 'Rich, intense highlighters are CRITICAL for melanin-rich skin — light pink highlights vanish. Seek gold, bronze, copper, or rose-gold. Pat McGrath Skin Fetish Highlighter, Fenty Beauty Trophy Wife highlighter.',
      },
      tapered_highlight: {
        name: 'Tapered Highlight Brush',
        best_for: 'Precise inner corner, cupid\'s bow, nose bridge highlight',
      },
    },
  },
};

// ─── EYE BRUSHES ──────────────────────────────────────────────────────────────

export const EYE_BRUSHES = {
  essentials: {
    flat_shader: {
      name: 'Flat Shader / Packing Brush',
      what: 'Flat, firm bristles. Places eyeshadow on the lid.',
      technique: 'Pat — never sweep — to pack pigment. Sweeping with a flat brush kicks product off.',
      forMelaninEyes: 'On deeper skin tones, pigment is harder to see — use this to PACK colour for maximum payoff. Use your finger for ultra-pigmented shadows (warmth activates pigment).',
      topPicks: [
        { name: 'Zoeva 227 Eyeshadow Blending Brush' },
        { name: 'Morphe M433 Pro Firm Blending Fluff Brush' },
      ],
    },
    blending: {
      name: 'Blending Brush',
      what: 'Fluffy, tapered dome. The most important eye brush.',
      technique: 'Windshield-wiper motions in crease; circular buffing motions at edges to diffuse hard lines',
      keyTip: 'Work with a CLEAN blending brush to diffuse and blend product already placed',
      topPicks: [
        { name: 'Real Techniques Shading Brush' },
        { name: 'Zoeva 228 Detailed Crease Brush' },
        { name: 'Hakuhodo J5523 Eyeshadow Blending Brush' },
      ],
    },
    pencil: {
      name: 'Pencil / Smudge Brush',
      what: 'Small, pointed or flat. For precise crease work, inner corner, lower lash line.',
      techniques: {
        lowerLash: 'Dip in dark matte shadow, smudge along lower lash line for a soft smoky effect',
        innerCorner: 'Use with shimmery highlight colour in inner corner to open and brighten eyes',
        cutCrease: 'Use with a stiff pencil brush for defined cut crease lines',
      },
    },
    liner: {
      name: 'Eyeliner Brush',
      types: {
        angled: { name: 'Angled Liner Brush', best_for: 'Gel liner, cat eye, wing' },
        fine_point: { name: 'Fine Point Liner Brush', best_for: 'Precise liquid liner work, tightlining' },
      },
    },
    brow: {
      name: 'Brow Brush',
      types: {
        spoolie: { name: 'Spoolie', what: 'Mascara wand. Brushes brows into shape, blends brow products, tames.', use: 'Brush brows before and after filling.' },
        angled_brow: { name: 'Angled Brow Brush', what: 'Angled stiff bristles. Fills brows with pomade or powder.', technique: 'Short, hair-like strokes following brow hair direction' },
      },
    },
  },
  for_ethnic_eye_shapes: {
    monolid: {
      shape: 'Monolid (common in East Asian)',
      challenges: 'Crease products disappear when eyes open; limited visible lid space',
      brushTechniques: [
        'Use flat shader to place shimmer on centre of lid (hooded lid trick: more shimmer = more visible lid)',
        'Place dark colour in OUTER V and outer upper lash line instead of crease',
        'Use pencil brush to smudge lower lash line — this is where monolid eye looks shine',
        'Tight-line upper waterline with kohl — makes lashes look thicker without a visible liner line',
      ],
      communityNotes: 'Many South Korean makeup techniques (K-beauty) are designed with monolid eye shapes in mind, a useful reference',
    },
    deepSet: {
      shape: 'Deep-Set Eyes (often in Middle Eastern, some South Asian)',
      characteristics: 'Eyes set further back in the eye socket; prominent brow bone',
      brushTechniques: [
        'Light shimmer on lid to bring eyes forward',
        'Keep brow bone highlight very subtle (already prominent)',
        'Lighter colours in the crease (not deeper than what\'s already there)',
        'Lower lash line emphasis to broaden the visible eye area',
      ],
    },
    wideSet: {
      shape: 'Wide-Set Eyes',
      brushTechniques: [
        'Darker colour applied to inner corners and inner lid (pulls eyes together visually)',
        'Liner extended beyond inner corner toward nose bridge',
        'Bold, thick liner on inner corners',
      ],
    },
    hooded: {
      brushTechniques: [
        'Apply eyeshadow with eyes OPEN to see where colour will show',
        'Place shimmer above natural crease (not in it)',
        'Wing liner upward to lift appearance',
        'Lower lash line is prime real estate — spend time here',
      ],
    },
  },
};

// ─── SPONGES AND APPLICATORS ──────────────────────────────────────────────────

export const SPONGES_AND_APPLICATORS = {
  beauty_blender: {
    name: 'Beauty Sponge (BeautyBlender / Dupes)',
    types: {
      round: { name: 'Round Sponge', best_for: 'Foundation; seamless blending', technique: 'Dampened, bouncing/stippling motions — NEVER dragging' },
      contour: { name: 'Contour Sponge (flat-edged)', best_for: 'Precise contour and concealer', technique: 'Edge used for precise placement, rounded side for blending' },
    },
    critical: {
      wet_vs_dry: 'Always dampen the sponge before use. Dry = absorbs too much product = wasteful and cakey. Damp = product sits on surface and transfers to skin.',
    },
    forMelaninSkin: {
      coverage: 'Stippling (bounce) with a damp sponge gives the most skin-like, seamless coverage for deeper skin tones — avoids the mask look',
      undereye: 'Pat (never drag) concealer under eyes — dragging on dry under-eye skin creases and looks ashy on darker tones',
    },
    picks: [
      { name: 'BeautyBlender Original' },
      { name: 'Real Techniques Miracle Complexion Sponge' },
    ],
    maintenance: [
      'Clean weekly (daily if acne-prone)',
      'Use solid or liquid cleanser designed for sponges',
      'Squeeze, don\'t wring — wringing destroys the foam structure',
      'Replace every 1–3 months (tears, discolouration = bacteria)',
    ],
  },
  silicone_applicator: {
    name: 'Silicone Applicator',
    what: 'Flat silicone pad — alternative to sponge or brush for foundation',
    pros: ['Hygienic (non-porous — bacteria can\'t live in it)', 'Product-efficient (doesn\'t absorb)', 'Easy to clean'],
    cons: ['Doesn\'t blend as seamlessly as sponge', 'Can look streaky if not properly blended after'],
    technique: 'Use to APPLY product, then blend with sponge for best results',
  },
  fingers: {
    name: 'Fingers as Applicators',
    when: 'For cream products: cream blush, cream contour, cream highlighter, lip products, stick foundation',
    why: 'Body warmth melts cream products into skin for the most natural, skin-like finish',
    technique: [
      'Apply tiny amount to fingertip',
      'Press into skin, then blend edges',
      'Tap — don\'t rub — to avoid moving product you\'ve already placed',
    ],
    forMelaninSkin: 'Finger blending gives the most natural finish on deeper skin tones — cream formulas melt into skin beautifully. Many professional MUAs prefer fingers for their dark-skinned clients.',
    caution: 'Always clean hands thoroughly first. Not recommended for liquid foundation if you have hand conditions (eczema flares etc.)',
  },
};

// ─── BRUSH CARE ───────────────────────────────────────────────────────────────

export const BRUSH_CARE = {
  cleaning: {
    spot_clean: {
      when: 'Between looks, when switching colours during a session',
      how: 'Spray brush with quick-dry brush cleaner, wipe on paper towel. 60 seconds per brush.',
      products: [
        { name: 'Cinema Secrets Brush Cleaner',  note: 'Professional standard, fast-drying' },
        { name: 'e.l.f. Daily Brush Cleaner' },
      ],
    },
    deep_clean: {
      frequency: 'Face brushes: weekly. Eye brushes: every 2 weeks. Blenders: after each use.',
      why: 'Bacteria, product buildup, and oils in brushes cause acne and eye infections',
      how: [
        'Wet bristles with lukewarm water (angle brush face-down — water in ferrule rusts and loosens glue)',
        'Dispense cleanser into palm or cleaning mat',
        'Swirl brush in cleanser with gentle circular motions',
        'Rinse under lukewarm water until runs clear',
        'Reshape bristles',
        'Lay flat or hang upside-down to dry — NEVER dry upright (water damages ferrule)',
      ],
      cleansers: [
        { name: 'Dr. Bronner\'s Castile Soap',  note: 'Gentle, no silicones' },
        { name: 'Sigma Spa Brush Cleaning Mat',  note: 'Textured mat for deep clean' },
      ],
    },
  },
  organisation: {
    methods: [
      { type: 'Brush roll', best_for: 'Travel; compact storage', note: 'Keep brushes separated to prevent bristle distortion' },
      { type: 'Cup/vase', best_for: 'Vanity display; quick access', note: 'Store handle-down to keep bristles up' },
      { type: 'Brush rack/holder', best_for: 'Large collection; organised workspace' },
    ],
  },
};

// ─── BUDGET VS INVESTMENT GUIDE ───────────────────────────────────────────────

export const BUDGET_VS_INVESTMENT = {
  principle: 'Invest in tools that touch your face (foundation, blending brush, sponge). Save on tools where quality matters less (lip brush, brow spoolie, fan brush).',
  invest_in: [
    { tool: 'Foundation Brush', why: 'Direct contact with skin; affects finish significantly; used daily' },
    { tool: 'Blending Brush (eye)', why: 'The single most important eye tool; quality bristles blend better' },
    { tool: 'Beauty Sponge',  },
    { tool: 'Powder Brush (face)', why: 'Soft, densely packed bristles mean even distribution; poor powder brush = patchy finish' },
  ],
  save_on: [
    { tool: 'Fan Brush', why: 'Simple tool; all fan brushes perform similarly' },
    { tool: 'Brow Spoolie', why: 'A spoolie is a spoolie; expensive ones offer no benefit' },
    { tool: 'Lip Brush', why: 'Used for precise application; budget versions work well' },
    { tool: 'Pencil/Smudge Brush', why: 'Simple pressed-hair tool; dupe performs identically' },
  ],
  starter_kit: {
    tools: [
      { item: 'Real Techniques Miracle Complexion Sponge' },
      { item: 'Real Techniques Expert Face Brush (foundation)' },
      { item: 'EcoTools Interchangeable Blush + Bronzer set' },
      { item: 'Morphe M433 Eye Blending Brush' },
      { item: 'Flat eye shader brush (e.l.f. or Real Techniques)' },
      { item: 'Dual-end pencil/liner brush (NYX Professional Makeup)' },
      { item: 'Basic angled brow brush with spoolie' },
    ],
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getBrushGuideForEyeShape(eyeShape) {
  const map = {
    'monolid': EYE_BRUSHES.for_ethnic_eye_shapes.monolid,
    'deep-set': EYE_BRUSHES.for_ethnic_eye_shapes.deepSet,
    'wide-set': EYE_BRUSHES.for_ethnic_eye_shapes.wideSet,
    'hooded': EYE_BRUSHES.for_ethnic_eye_shapes.hooded,
  };
  return map[eyeShape.toLowerCase()] || null;
}

export function getStarterKitByBudget(level) {
  if (level === 'essential') {
    return {
      level: 'Essential',
      tools: BUDGET_VS_INVESTMENT.starter_kit.tools.slice(0, 4),
    };
  }
  return {
    level: 'Full Starter Kit',
    tools: BUDGET_VS_INVESTMENT.starter_kit.tools,
  };
}

export function getFaceBrushGuide() {
  return FACE_BRUSHES;
}

export function getEyeBrushGuide() {
  return EYE_BRUSHES;
}

export function getSpongeGuide() {
  return SPONGES_AND_APPLICATORS;
}

export function getBrushCareGuide() {
  return BRUSH_CARE;
}

