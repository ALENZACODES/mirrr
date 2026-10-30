/**
 * MIRRR Makeup Finishes & Skin Prep Guide
 * Foundation finishes, primers, setting sprays, baking, blurring,
 * long-wear techniques, skin prep for different looks,
 * and finish choices by skin type and ethnic community
 */

// ─── FOUNDATION FINISHES ──────────────────────────────────────────────────────

export const FOUNDATION_FINISHES = {
  matte: {
    description: 'No shine, flat finish. Absorbs or reduces light reflection.',
    best_for: 'Oily skin; acne-prone skin; hot climates; photography (studio lights can make dewy skin look greasy); long events without touch-ups.',
    downsides: [
      'Can look cakey or flat on dry or textured skin',
      'Requires very good skincare underneath — matte finish makes dry patches, flakiness, and texture more visible, not less',
      'May look flat in low lighting',
      'Less natural-looking on mature skin',
    ],
    technique: 'Apply with beauty sponge or buffing brush. Build coverage gradually. Set with translucent powder in T-zone.',
    for_dark_skin: 'Deep matte foundations occasionally "ashy" on very dark skin — look for formulas with warm, neutral undertones rather than cool. Test in natural light.',
  },

  satin: {
    description: 'Between matte and dewy — a soft sheen without obvious shine. Most natural-looking finish.',
    best_for: 'Normal to combination skin; most situations; everyday wear; natural light; work environments.',
    downsides: 'Less long-lasting on very oily skin without setting.',
    technique: 'Most versatile — apply with sponge, brush, or fingers.',
    for_dark_skin: 'Satin is particularly flattering on deep skin tones — adds dimension without looking oily.',
  },

  dewy: {
    description: 'Luminous, glowing, high-shine finish. Skin looks fresh and healthy.',
    best_for: 'Dry skin; mature skin; northern/cooler climates; social photography; editorial and creative looks.',
    downsides: [
      'Oily skin may look greasy rather than dewy by midday',
      'Can look sweaty in hot, humid conditions',
      'High shine may not be appropriate for formal work settings',
      'Flash photography can "wash out" very dewy finishes',
    ],
    technique: 'Apply with fingers or damp sponge. Minimal powder. Highlighter on high points enhances the dewiness.',
    for_dark_skin: 'Dewy finish is particularly striking on deep skin tones — the luminosity is beautiful. Consider a dewy base with selective matte setting (T-zone only).',
  },

  glass_skin: {
    description: 'Extreme version of dewy — translucent, intensely luminous, almost plastic-looking skin with no visible texture. K-beauty trend.',
    origin: 'Korean beauty aesthetic — inspired by "glass" appearance of well-hydrated, luminous skin.',
    technique: [
      'Multi-layer hydration underneath (toner, essence, serum)',
      'Light-reflecting primer',
      'Sheer, buildable foundation or tinted moisturiser',
      'Strategic highlighter on cheekbones, nose bridge, cupid\'s bow',
      'No powder over the highlight points',
      'Setting spray to melt everything together',
    ],
    for_dark_skin: 'Works on all skin tones — on deep skin, the glass skin effect is particularly stunning. Use a highlighter designed for deep skin (Fenty Killawatt, Charlotte Tilbury Moon Beach for deeper tones).',
  },

  skin_tint: {
    description: 'The most natural finish — very sheer coverage, skin-like texture, often blendable with hands.',
    best_for: 'No-makeup makeup looks; days when you want minimal product; people with naturally even skin tone.',
    trend: 'Skin tints surged in popularity circa 2020-2023, aligning with "clean beauty" and "your skin but better" aesthetics.',
    examples: 'ILIA Skin Tint; Armani Luminous Silk; Charlotte Tilbury Beautiful Skin Foundation.',
    for_dark_skin: 'Most skin tint lines expanded shade ranges after early criticism. Fenty Skin Tint launched with 40 shades — one of the most inclusive launches.',
  },
};

// ─── PRIMERS ─────────────────────────────────────────────────────────────────

export const PRIMER_GUIDE = {
  what_primer_does: {
    creates_base: 'Smooths the skin surface, filling in pores, fine lines, and texture for more even foundation application.',
    extends_wear: 'Creates a "grip" layer that makeup adheres to, increasing longevity.',
    targets_concerns: 'Specific primers target specific concerns — colour-correcting, pore-minimising, hydrating, oil-controlling.',
    note: 'Good skincare can reduce the need for primer significantly. Primer works with foundation — they should be compatible (silicone primer + silicone foundation; water-based primer + water-based foundation).',
  },

  types: {
    silicone: {
      texture: 'Smooth, slippery, fills in pores and lines.',
      brands: 'Smashbox Photo Finish, e.l.f. Poreless Putty Primer.',
      for_oily_skin: 'Silicone primers may not work well for oily skin — the silicone itself doesn\'t control oil.',
      pair_with: 'Silicone-based or powder foundations.',
    },
    hydrating: {
      texture: 'Serum-like, watery or creamy.',
      brands: 'Charlotte Tilbury Hollywood Flawless Filter, Milk Makeup Hydro Grip.',
      for_dry_skin: 'Adds moisture layer that keeps skin comfortable and prevents dry patches from showing through foundation.',
    },
    mattifying: {
      texture: 'Often powder-containing or pore-filling.',
      brands: 'Benefit Porefessional, NYX Shine Killer.',
      for_oily_skin: 'Absorbs oil and creates a matte base that helps foundation last longer.',
    },
    colour_correcting: {
      what: 'Colour-tinted primers cancel out specific discolourations.',
      colour_theory: {
        green: 'Cancels redness (red acne, rosacea)',
        peach_orange: 'Cancels blue-purple darkness (under-eye circles on medium skin tones)',
        orange_rust: 'Cancels blue-purple darkness on DARK SKIN — must use deeper orange-rust tones; peach will not cancel dark circles on deep skin',
        lavender_purple: 'Brightens dull, sallow (yellow) skin',
        yellow: 'Cancels purple tones; brightens dark skin',
      },
      for_dark_skin: {
        under_eye: 'Orange or rust-toned correctors work on dark undereye circles in deeper skin tones. Not peach, which is too light to make an impact. NYX Orange Correcting Concealer; Dermablend Cover Care (orange).',
        acne_marks_PIH: 'Orange-rust colour corrector under concealer for very dark PIH spots.',
      },
    },
    blur_and_pore: {
      texture: 'Often have a rubbery or silky texture that fills the appearance of pores.',
      reality: 'Blurring/pore-minimising primers create an optical illusion — they fill the look of pores temporarily. They do NOT reduce pore size permanently.',
    },
  },
};

// ─── SETTING TECHNIQUES ───────────────────────────────────────────────────────

export const SETTING_TECHNIQUES = {
  loose_powder: {
    what: 'Very fine powder applied over foundation and concealer to set makeup and reduce shine.',
    types: {
      translucent: 'Clear/white setting powder — can leave a white cast on dark skin, particularly with flash photography. Any white translucent powder can flash back if over-applied.',
      tinted: 'Powder in skin-tone shades — sets while adding slight coverage and warmth. More appropriate for dark skin.',
      banana: 'Yellow-toned powder historically used by Black makeup artists to set under-eye concealer on dark skin (yellow complements the purple-blue undertones of dark under-eye areas).',
      setting_vs_finishing: 'Setting powder is applied immediately after foundation/concealer to set product. Finishing powder is applied last for a final blur. These are sometimes the same product used differently.',
    },
    flashback_warning: {
      what: 'Flashback or "white cast in flash" — certain setting powders contain ingredients (silica, particularly) that reflect light differently under flash photography vs natural light. In person the powder looks fine; in flash photographs, it appears as a grey/white cast.',
      for_dark_skin: 'CRITICAL issue for dark skin — always check powder reviews specifically from people of similar skin tone before purchasing. Use tinted or banana powder, or test flash before an event.',
      safe_alternatives: 'Makeup Forever HD Microfinishing Powder; Charlotte Tilbury Airbrush Flawless (when used sparingly); Fenty Pro Filt\'r Setting Powder.',
    },
  },

  baking: {
    what: 'A technique from drag makeup and Black beauty tradition. Apply a generous amount of loose setting powder under the eyes, allow to "bake" (sit) for 5-10 minutes, then brush away. The heat from the skin sets the concealer underneath during the baking time, resulting in a very crisp, crease-resistant finish.',
    origin: 'Developed in ballroom culture and drag — places where very long-lasting makeup under bright lights was essential. Rose through Black beauty creators in the 2010s social media era.',
    when_to_use: 'For very long events (weddings, performances); for very oily skin that creases quickly; for editorial and photography looks.',
    caution_for_mature_skin: 'Can accentuate fine lines and look dry on mature skin. Use very finely milled powder and apply sparingly if trying this on mature skin.',
    for_dark_skin: 'Use banana (yellow-toned) or skin-matching tinted powder for baking, not white translucent powder (flashback and ashy issues).',
  },

  setting_spray: {
    what: 'Mist applied over finished makeup to set it, blend edges, and alter the finish.',
    types: {
      matte: 'Controls shine; locks in matte finish. Best for oily skin.',
      dewy: 'Adds luminosity; creates a seamless, skin-like finish. Best for dry skin.',
      fixing: 'Maximum hold — designed for maximum longevity. Urban Decay All Nighter.',
      hydrating: 'Refreshes and doesn\'t significantly alter the finish.',
    },
    technique: {
      basic: 'Hold 25-30cm from face; mist in an X and T pattern or circular motion. Allow to dry.',
      melt_powder: 'Applying setting spray after powder "melts" the powdery texture, making foundation look more skin-like.',
      refresh: 'Midday refresh — mist over a few drops of facial oil on the fingertips for dewy finish, or setting spray alone to revive.',
    },
    for_dark_skin: 'Setting spray is a finishing technique that works across all skin tones. The "dewy" setting spray over a full matte face can be transformative — selective glow rather than full shine.',
  },

  pressing_and_patting: {
    powder_application: 'For longest wear, press powder INTO skin rather than sweeping. Use a powder puff or flat-topped brush and press-and-roll motion, particularly under eyes.',
    liquid_products: 'Patting foundation with fingers or sponge (rather than wiping) is the professional technique — patting drives product into skin rather than sliding it across.',
  },
};

// ─── SKIN PREP FOR MAKEUP ─────────────────────────────────────────────────────

export const SKIN_PREP = {
  the_argument: 'The difference between "cakey" foundation and "skin-like" foundation is often skin preparation, not the foundation itself.',

  steps: {
    cleanse: { order: 1, importance: 'Essential — any sunscreen, oil, or residue on skin disrupts foundation adhesion.' },
    exfoliate: { order: 2, timing: '1-3 nights before event — never day-of', why: 'Exfoliating removes dead skin cells that cause foundation to look uneven. Day-of exfoliation can leave skin reactive.' },
    treatment_products: { order: 3, note: 'Apply serums etc as normal. Allow to FULLY absorb before moisturiser — at least 5 minutes.' },
    moisturise: { order: 4, importance: 'Hydrated skin = smoother canvas. For very dry skin, a facial oil under moisturiser or mixed into foundation provides extra hydration.' },
    spf: { order: 5, wait: 'Allow SPF 15-20 minutes to set before applying makeup. Chemical filters need to absorb; physical filters need to adhere.' },
    primer: { order: 6, optional: 'Wait 1-2 minutes after SPF before primer. Primer should be fully dry before foundation.' },
  },

  for_different_skin_types: {
    oily: [
      'Gel cleanser (controls oil from the start)',
      'Niacinamide serum (oil control)',
      'Oil-free moisturiser or skip moisturiser if very oily',
      'Mattifying primer',
      'Matte or satin foundation',
      'Powder setting in T-zone',
      'Setting spray (matte finish)',
    ],
    dry: [
      'Cream or oil cleanser (doesn\'t strip)',
      'Hydrating serum (hyaluronic acid, glycerin)',
      'Rich moisturiser — wait for full absorption',
      'Facial oil mixed with foundation or underneath',
      'Hydrating primer',
      'Serum or dewy foundation',
      'Minimal powder (only where necessary)',
      'Dewy setting spray',
    ],
    combination: [
      'Balanced cleanser',
      'Niacinamide in T-zone',
      'Light moisturiser',
      'Pore-filling primer in T-zone',
      'Satin foundation',
      'Set T-zone with powder, leave rest dewy',
      'Setting spray to blend',
    ],
    mature: [
      'Gentle hydrating cleanser',
      'Peptide or retinol serum (nighttime)',
      'SPF moisturiser',
      'Hydrating primer (avoid pore-filling silicone — can settle in lines)',
      'Light to medium coverage (high coverage settles in lines)',
      'No powder over eye area — only set elsewhere',
      'Dewy or satin finish',
      'Cream blush and highlighter (powders can age the face)',
    ],
  },
};

// ─── LONG-WEAR TECHNIQUES ─────────────────────────────────────────────────────

export const LONGWEAR_TECHNIQUES = {
  general_principles: [
    'Prep well — the better the canvas, the longer makeup lasts',
    'Layer products — each product locks in the one beneath',
    'Set each layer — don\'t skip setting spray or powder',
    'Start with waterproof or long-wear formulas for key products',
    'Touch-up strategy — know what\'s most likely to fade and target those',
  ],

  for_hot_humid_climates: {
    challenge: 'Heat causes oil production; humidity causes product slipping.',
    strategy: [
      'Maximum prep — salicylic acid cleanser, niacinamide serum, oil-free SPF',
      'Pore-filling mattifying primer',
      'Matte, long-wear foundation formula',
      'Waterproof mascara, liner, brow products',
      'Generous setting powder (matte)',
      'Setting spray that is specifically formulated for humidity',
      'Midday blotting papers rather than adding more powder',
    ],
    recommended: 'Charlotte Tilbury Airbrush Flawless; MAC Studio Fix Fluid (long-wear matte); Urban Decay All Nighter Setting Spray',
    ethnic_note: 'Humid climates common in West Africa, South Asia, Caribbean, Southeast Asia — these communities have developed makeup techniques for longevity in heat. Foundation setting with talcum powder is traditional in some communities — effective but has been associated with respiratory concerns from fine particles.',
  },

  for_events_over_12_hours: {
    extra_step: 'Primer + baking + setting spray triple protection.',
    touch_up_kit: {
      essentials: ['Blotting papers', 'Mini setting spray', 'Concealer (one shade)', 'Lipliner and lipstick'],
      nice_to_have: ['Travel matte powder', 'Mini mascara', 'Brow pencil'],
    },
  },
};

// ─── FINISH CHOICE BY COMMUNITY ───────────────────────────────────────────────

export const FINISH_BY_COMMUNITY = {
  black_american: {
    traditional_choices: 'Matte finish with baking has been a cornerstone of Black beauty makeup tradition. Glossy lip with matte face (or vice versa) is a classic pairing.',
    modern: 'The "glass skin" and "glazed donut" trends have been enthusiastically embraced by Black beauty creators. Dewy finishes with a subtle glow work beautifully on deep skin tones.',
    highlight: 'Bronze and gold highlighter rather than pink or silver — such as Fenty Killawatt in Moscow Mule/Ginger Binge.',
  },

  south_asian: {
    bridal: 'South Asian bridal makeup traditionally aims for full, opaque, long-lasting coverage — appropriate for multi-day wedding events and photography. Matte finish for photography; slight glow for ceremonies.',
    everyday: 'The "no-makeup makeup" look has gained popularity in younger South Asian generations.',
    climate: 'South Asian home countries are often hot and humid — historically, long-wear and sweat-resistant formulas have been prioritised.',
  },

  east_asian: {
    glass_skin: 'The glass skin trend originated in Korean beauty. Dewy, luminous finishes are central to the K-beauty aesthetic.',
    natural: 'Japanese makeup traditionally favours a natural finish — even skin tone without obvious foundation. Skin-like texture is prized.',
    popular_finish: 'Satin to dewy for everyday; glassy for special occasions.',
  },

  arab: {
    drama: 'Arab beauty tradition favours more dramatique makeup, particularly for events — strong coverage, contouring, and a finish that photographs beautifully.',
    skin_prep: 'Elaborate skin prep before event makeup — often including multiple masking steps.',
    hot_climate: 'Long-wear and heat-resistant formulas are important for the Gulf and Levant climates.',
  },

  west_african: {
    skin_celebration: 'West African beauty tradition celebrates the skin itself — healthy, glowing skin is the priority. Shea butter application creates a natural glow before makeup.',
    finish: 'Satin to dewy finishes amplify the natural skin glow. Heavy powder can look flat on deep African skin tones.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getFoundationFinishes() {
  return FOUNDATION_FINISHES;
}

export function getPrimerGuide(type) {
  if (type) return PRIMER_GUIDE.types[type] || null;
  return PRIMER_GUIDE;
}

export function getSettingTechniques() {
  return SETTING_TECHNIQUES;
}

export function getSkinPrep(skinType) {
  if (skinType) return SKIN_PREP.for_different_skin_types[skinType] || null;
  return SKIN_PREP;
}

export function getLongWearGuide() {
  return LONGWEAR_TECHNIQUES;
}

export function getFinishForCommunity(communityId) {
  return FINISH_BY_COMMUNITY[communityId] || null;
}

