/**
 * MIRRR Foundation Guide Extended
 * Formulas, finishes, shade matching, undertones,
 * application techniques, and ethnic skin considerations
 */

// ─── FOUNDATION FORMULAS ──────────────────────────────────────────────────────

export const FOUNDATION_FORMULAS = {
  liquid: {
    type: 'Liquid Foundation',
    description: 'Most versatile formula. Wide range of coverage (sheer to full) and finish (matte to dewy). Suitable for all skin types depending on specific formulation.',
    subtypes: {
      water_based: {
        description: 'Lightweight; skin-friendly; no pore-clogging risk; good for oily/combination/acne-prone.',
        examples: 'MAC Face and Body, Fenty Beauty Pro Filt\'r',
      },
      oil_based: {
        description: 'Adds glow and slip; nourishing; good for dry skin; can congest oily skin.',
        examples: 'Charlotte Tilbury Airbrush Flawless, Armani Luminous Silk',
      },
      silicone_based: {
        description: 'Smooth, blurs pores and texture; long-wearing; good for HD and camera.',
        examples: 'Hourglass Ambient Soft Glow',
      },
    },
    best_for: 'All skill levels; all skin types (depending on formula); photography; everyday wear.',
  },
  powder: {
    type: 'Powder Foundation',
    description: 'Dry-texture foundation providing buildable coverage and matte finish. Can be applied dry (more coverage) or wet (fuller, dewy effect). Fast application.',
    best_for: 'Oily skin; quick morning routines; touch-ups; layering over liquid for extra coverage.',
    caution: 'Can look powdery or cakey on dry or mature skin. Dehydrates skin over long wear.',
    ethnic_note: 'CRITICAL: Many powder foundations photograph with severe white cast on darker skin tones. Specifically, products with titanium dioxide or zinc oxide can leave a chalky appearance. Always test medium-to-dark shades in flash photography before committing.',
  },
  stick: {
    type: 'Stick Foundation',
    description: 'Solid stick formula — convenient, portable, buildable. Range from skin tints to full coverage. Cream-to-powder or cream finish.',
    best_for: 'Quick application; spot coverage; layering; travel. Also popular for oily skin (tends to be matte).',
  },
  cushion: {
    type: 'Cushion Foundation (Air Cushion Compact)',
    description: 'Foundation-soaked sponge in a compact housing. Applied with a puff for a lightweight, dewy, natural finish. Korean beauty innovation — now global.',
    best_for: 'Natural/skin-like finish; quick application; touch-ups; photography-ready skin. Excellent for dry skin.',
    ethnic_note: 'Korean cushion foundations traditionally had limited shade ranges, skewed very light. Better options now exist: Fenty, Black Opal, MAC offer wider ranges. Some Asian brands still have limited dark shades.',
  },
  serum: {
    type: 'Serum Foundation / Skin Tint',
    description: 'Hybrid product — skincare benefits (hyaluronic acid, SPF, niacinamide) with sheer coverage and luminous finish. Minimal coverage but excellent skin quality.',
    best_for: 'Good skin days; minimal makeup looks; skincare-first users. Not for high coverage needs.',
  },
  cream: {
    type: 'Cream Foundation',
    description: 'Rich cream texture, full coverage, long-wearing. Professional/theatrical choice. Can be heavy for daily wear.',
    best_for: 'Full coverage events (weddings, photo/video). Stage, film, TV makeup.',
  },
};

// ─── COVERAGE LEVELS ─────────────────────────────────────────────────────────

export const COVERAGE_GUIDE = {
  sheer: {
    level: 'Sheer Coverage',
    description: 'Barely-there coverage. Evens skin tone slightly; allows freckles, beauty marks, skin texture to show through. Most skin tints and serum foundations.',
    when: 'Best skin days; natural makeup looks; skincare-first aesthetic.',
  },
  light: {
    level: 'Light Coverage',
    description: 'Covers minor redness and uneven tone; some imperfections show through. Buildable.',
    when: 'Everyday wear; most social occasions.',
  },
  medium: {
    level: 'Medium Coverage',
    description: 'Covers most imperfections while maintaining natural look. Buildable to full.',
    when: 'Events, work presentations; occasions where you want polished skin without heavy look.',
  },
  full: {
    level: 'Full Coverage',
    description: 'Covers hyperpigmentation, scars, vitiligo, and significant discolouration. Can look heavy if not applied carefully.',
    when: 'Events with photography (wedding, prom); high contrast situations; when covering significant concerns.',
    ethnic_note: 'Full coverage foundation is extremely common in South Asian bridal makeup and West African glam aesthetics. The key is blending seamlessly, including onto neck and décolletage.',
  },
};

// ─── FINISHES ────────────────────────────────────────────────────────────────

export const FOUNDATION_FINISHES = {
  matte: {
    finish: 'Matte',
    appearance: 'No shine; flat, even surface. Long-wearing. Reduces appearance of pores.',
    best_for: 'Oily skin; longevity; warm climates; photography (avoids shine).',
    caution: 'Can look flat or dull on dry or mature skin. Emphasises texture and fine lines if skin is not prepped well.',
    ethnic_note: 'Popular for humid climates and events where shine control is essential. Common in West African and Caribbean makeup cultures.',
  },
  satin: {
    finish: 'Satin / Natural',
    appearance: 'Between matte and dewy. Low-level sheen that looks like healthy skin.',
    best_for: 'Normal to combination skin; most occasions; most flattering overall finish for everyday wear.',
  },
  dewy: {
    finish: 'Dewy / Luminous / Glow',
    appearance: 'Lit-from-within glow; appears moisturised and youthful.',
    best_for: 'Dry and normal skin; photography (studio lighting); glass skin aesthetic; mature skin.',
    caution: 'Can look greasy on oily skin. Not ideal for very warm, humid conditions.',
    ethnic_note: 'K-beauty glass skin; South Asian bridal glow; Arab hammam luminosity — all aesthetics that embrace dewy luminous skin. Excellent for deeper skin tones that naturally absorb light.',
  },
  transfer_proof: {
    finish: 'Transfer-Proof / Budge-Proof',
    appearance: 'Sets to a long-wearing finish that does not transfer to clothing, masks, etc.',
    best_for: 'Mask-wearing occasions; celebrations; long events. Requires dedicated remover.',
  },
};

// ─── UNDERTONES ──────────────────────────────────────────────────────────────

export const UNDERTONE_GUIDE = {
  overview: {
    definition: 'Undertone is the underlying colour beneath the surface skin colour. It remains constant even as the surface skin colour changes (tanning, seasons). Matching foundation undertone to skin undertone is crucial for a natural, skin-like result.',
    main_undertones: ['Warm (yellow, golden, peachy)', 'Cool (pink, red, bluish)', 'Neutral (mix of both)'],
    olive: 'Olive undertone — greenish-yellow; common in Mediterranean, South Asian, East Asian, and Latina communities. Neither purely warm nor cool — often described as neutral-olive.',
  },
  identification: {
    vein_test: 'Look at veins on inner wrist in natural light. Blue-purple veins = cool undertone. Green veins = warm undertone. Blue-green veins = neutral undertone.',
    jewellery_test: 'Gold jewellery flatters warm undertones. Silver flatters cool undertones. Both look great = neutral.',
    white_paper_test: 'Hold a white piece of paper next to your face. Skin appears yellowish/golden = warm. Appears pinkish/rosy = cool. Neither = neutral.',
    tan_reaction: 'Warm skin tones tan easily and golden. Cool skin tones burn easily and may tan pinkish. Neutral tans gradually without burning.',
  },
  by_community: {
    west_african: {
      common_undertones: 'Warm to neutral. Strong golden or red-brown undertones in mid-to-deep Fitzpatrick V-VI. Red-based undertones common in some West African complexions.',
      foundation_tip: 'Look for descriptions like "mahogany," "espresso," "ebony" with warm or red-based undertones. Avoid foundations that pull ashy or grey (usually cool-neutral bases that look wrong on warm deep skin).',
    },
    south_asian: {
      common_undertones: 'Ranges from warm and golden to neutral-olive and cool. Check your own undertone rather than assuming.',
      foundation_tip: 'Yellow-warm bases essential. Brands that understand this: Fenty Beauty, MAC, NARS. AVOID: cool-pink based foundations — look distinctly unnatural and ashy.',
    },
    caribbean: {
      common_undertones: 'Broad range depending on island heritage. Afro-Caribbean: warm to warm-neutral. Indo-Caribbean: similar to South Asian. Mixed heritage: varies widely.',
      foundation_tip: 'Test in natural light on jawline. Caribbean skin often warm; avoid cool or overly neutral bases if skin has golden warmth.',
    },
    arab: {
      common_undertones: 'Often olive to neutral-warm, but varies widely. Check your own undertone rather than assuming.',
      foundation_tip: 'Olive undertone requires careful shade matching. Yellow-green toned bases often most natural. Products marketed as "beige" can vary widely — test thoroughly.',
    },
    latina: {
      common_undertones: 'Enormous variation. Light-skin Latinas: often cool-neutral. Mixed/mestizo: often olive or warm. Afro-Latina: warm to warm-red. Indigenous Latina: warm-olive.',
      foundation_tip: 'No single Latina undertone. Identify personal undertone regardless of community assumption. Fenty Beauty and MAC have strong Latina-inclusive shade ranges.',
    },
    east_asian: {
      common_undertones: 'Often neutral to neutral-yellow. Japanese and Korean complexions frequently have neutral to cool-neutral undertones. Chinese complexions vary (warm in South; cool-neutral in North).',
      foundation_tip: 'Many East Asian-market foundations are formulated with yellow undertones for East Asian skin. Watch out for foundations marketed globally that pull pink on East Asian skin. Cushion foundations from Korean brands often better matched.',
    },
    east_african: {
      common_undertones: 'Often warm to warm-red on deep skin. Check your own undertone rather than assuming.',
      foundation_tip: 'Deep warm shades needed. Red-undertoned deep shades rather than ash/grey bases. Black Opal, Fenty, MAC Studio Fix — better choices.',
    },
    south_african: {
      common_undertones: 'Highly varied. Zulu/Xhosa: warm-deep. Cape Malay/coloured: warm-neutral mixed. Indian South African: similar to South Asian. White South African: varies.',
      foundation_tip: 'No single South African undertone. Identify your own undertone. Broader access to international brands now than historically — use shade-finder tools from Fenty, MAC, NARS.',
    },
    black_american: {
      common_undertones: 'Warm to warm-red; occasionally neutral. Huge variety within Black American community (enormous genetic diversity). From deepest warm-red Fitzpatrick VI to light Fitzpatrick III.',
      foundation_tip: 'Fenty Beauty launched with 40 shades in 2017 and pushed other brands to widen their ranges. Demand full shade ranges. Do not accept grey-ashy foundations passed off as dark shades. Match your own undertone, often warm or warm-red.',
    },
  },
};

// ─── SHADE MATCHING ──────────────────────────────────────────────────────────

export const SHADE_MATCHING_GUIDE = {
  how_to_match: {
    where_to_test: 'Test on jawline — the point where face and neck meet. Not on wrist (different skin tone) or hand. The jawline shade should disappear into the skin.',
    lighting: 'Always check in natural daylight. Store and indoor lighting distort colour. Go outside or to a window to verify the match.',
    time_to_check: 'Wait 10-20 minutes after application — foundations "oxidise" and can shift (usually darker) as they react with skin\'s oils and pH.',
    neck_matching: 'Foundation must blend invisibly into the neck. If your face appears lighter or darker than neck, adjust shade or apply foundation down the neck.',
  },
  oxidation_problem: {
    definition: 'Many foundations "oxidise" — appear darker or more orange after setting on skin. This is a formulation issue, not always adjustable.',
    solution: [
      'If foundation always darkens: purchase one shade lighter than you match in store',
      'Set with translucent or coloured setting powder to slow oxidation',
      'Mattifying primer can reduce oxidation',
    ],
    ethnic_note: 'Oxidation disproportionately affects warm-toned deeper skin — a shade that matches in store turns orange by noon. A known issue with many drugstore brands for dark skin.',
  },
  seasonal_adjustment: {
    summer: 'Skin often 1-2 shades deeper in summer from sun exposure. Have a summer shade and a winter shade.',
    winter: 'Many people (especially those with warm undertones) go lighter in winter. Do not force the summer shade in January.',
    gradual_change: 'To transition between seasons, mix two shades for a custom match.',
  },
  coverage_for_hyperpigmentation: {
    challenge: 'Hyperpigmentation, PIH, melasma create uneven skin tone — some areas darker, some lighter. Foundation shade must work across this variation.',
    strategy: [
      'Match foundation to the lighter areas (majority of face)',
      'Use full-coverage concealer (1-2 shades lighter) over darker spots',
      'Color correcting (orange/red for dark spots on deep skin; peach for medium; lavender for yellow spots) before foundation',
      'Blend concealer into foundation seamlessly',
    ],
    colour_correcting_by_skin_tone: {
      light: 'Lavender or lilac corrects yellow/sallow spots; peach corrects dark circles and light hyperpigmentation.',
      medium: 'Peach to light orange corrects dark spots; peach under eyes.',
      deep: 'Orange to red-orange corrects dark spots (including PIH); dark orange/brick for deepest dark circles and PIH. The deeper the skin, the more saturated the corrector needs to be.',
    },
  },
};

// ─── APPLICATION TECHNIQUES ──────────────────────────────────────────────────

export const FOUNDATION_APPLICATION = {
  tools: {
    beauty_sponge: {
      tool: 'Beauty Sponge (Beautyblender)',
      method: 'Use DAMP (wet, wring out). Bounce/stipple — do not drag or wipe. Apply in the centre of the face; blend outward.',
      finish: 'Natural, skin-like finish. Sheers out coverage slightly (can be an advantage or disadvantage).',
      best_for: 'Dewy, natural finishes; liquid foundation; dry and normal skin. Most forgiving tool.',
    },
    brush: {
      tool: 'Foundation Brush',
      types: 'Flat paddle brush (streak risk), stippling brush (light, buildable), kabuki (powder), buffing brush (circular motion for full coverage).',
      method: 'Buff in circular or downward strokes. Less product wasted than sponge.',
      finish: 'Smoother, more full-coverage finish than sponge. Can appear more "done."',
      best_for: 'Full coverage applications; oily skin (less water in sponge); powder foundations.',
    },
    fingers: {
      tool: 'Fingers',
      method: 'Warm product; press and blend. Finger warmth melts foundation into skin.',
      finish: 'Natural; skin-like; used in no-makeup makeup trends.',
      best_for: 'Skin tints; serum foundations; natural finishes. Quick applications.',
    },
  },
  order_of_operations: [
    '1. Cleanser → moisturiser → SPF (let absorb fully — 10-15 min)',
    '2. Primer (optional — creates base for specific concerns)',
    '3. Colour corrector (if using)',
    '4. Foundation',
    '5. Concealer over foundation (alternative: concealer under)',
    '6. Set with translucent powder (or skip for dewy look)',
    '7. Blush, bronzer, highlighter',
    '8. Setting spray (locks everything in; collapses powder)',
  ],
  primer_types: {
    pore_minimising: 'Silicone-based. Fills in pores and fine lines. Creates smooth canvas.',
    hydrating: 'Glycerin or hyaluronic acid based. For dry skin. Adds slip; prevents dry patches.',
    colour_correcting: 'Green (red/acne), purple (sallow/yellow), peach (dullness).',
    gripping: 'Mattifying primers create "grip" for foundation to adhere to; extend longevity on oily skin.',
    ethnic_note: 'Silicone-based pore-filling primers need testing on dark skin for potential grey cast when mixed with foundation. Water-based primers are safer for undertone accuracy.',
  },
};

// ─── SPF IN FOUNDATION ────────────────────────────────────────────────────────

export const FOUNDATION_SPF_REALITY = {
  the_problem: 'Many foundations are marketed with SPF values (SPF 15, 20, 30). However, the amount of foundation needed to achieve the labelled SPF would require applying 7x the normal amount of foundation — an impossible, cakey quantity.',
  the_truth: 'Foundation SPF is a marketing claim, not a protective measure. Do not rely on foundation SPF for sun protection.',
  the_solution: 'Apply dedicated sunscreen SPF 30-50 as the LAST step of your skincare (before primer/makeup). This is your actual sun protection.',
  ethnic_importance: 'For Fitzpatrick III-VI, UVA protection is critical for preventing and worsening melasma and PIH. Foundation SPF does nothing for this. Dedicated SPF is non-negotiable.',
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getFoundationFormula(type) {
  return FOUNDATION_FORMULAS[type?.toLowerCase()] || Object.values(FOUNDATION_FORMULAS);
}

export function getUndertoneGuide(communityId) {
  const key = communityId?.replace('-', '_');
  return UNDERTONE_GUIDE.by_community[key] || UNDERTONE_GUIDE;
}

export function getShadMatchingGuide() { return SHADE_MATCHING_GUIDE; }
export function getFoundationFinish(finish) {
  return FOUNDATION_FINISHES[finish?.toLowerCase()] || Object.values(FOUNDATION_FINISHES);
}
export function getFoundationApplication() { return FOUNDATION_APPLICATION; }
export function getCoverageGuide(level) {
  return COVERAGE_GUIDE[level?.toLowerCase()] || Object.values(COVERAGE_GUIDE);
}
export function getFoundationSPFReality() { return FOUNDATION_SPF_REALITY; }

