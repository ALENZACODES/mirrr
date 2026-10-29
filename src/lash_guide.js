/**
 * MIRRR Lash Guide
 * Comprehensive guide to false lashes, lash extensions, lash lifts,
 * lash tinting, natural lash care, and community lash traditions
 */

// ─── LASH ANATOMY ─────────────────────────────────────────────────────────────

export const LASH_ANATOMY = {
  natural_lash: {
    structure: 'Each eyelash is a modified hair follicle. Lashes grow from follicles along the eyelid margin.',
    growth_cycle: {
      anagen: 'Active growth phase: 30-45 days for lashes (much shorter than scalp hair)',
      catagen: 'Transition phase: 2-3 weeks — follicle shrinks',
      telogen: 'Resting phase: lash held in follicle while new lash begins to form beneath it; eventually shed',
      total: 'Full lash growth cycle: approximately 3 months',
    },
    average: {
      count: '90-160 lashes per upper lid; 75-80 per lower lid',
      length: 'Average upper lash length: 7-8mm',
      thickness: 'Average diameter: 0.1-0.15mm',
    },
    function: 'Primary function is protective — lashes deflect debris, dust, and sweat away from eyes. The lash is positioned to maximally protect the eye when blinking.',
  },

  ethnic_lash_differences: {
    east_asian: {
      characteristics: 'Often straighter; growth direction more downward or straight across rather than curling up naturally.',
      context: 'This is why lash curlers and lift treatments are particularly popular across East Asian communities — they add the upward curl that is not naturally present.',
    },
    south_asian: {
      characteristics: 'Typically dark, thick lashes that are longer than average. Natural advantage in lash appearance.',
      common_concern: 'Lashes sometimes grow downward.',
    },
    black_and_west_african: {
      characteristics: 'Typically dark, thick lashes with good curl. Often naturally full.',
      historical_note: 'False lashes were pioneered in Black entertainment culture — the elaborate stage lashes worn by Black performers in the 1950s-60s predating mainstream adoption.',
    },
    arab: {
      characteristics: 'Typically dark, long lashes — the "doe eye" effect. Kohl around the eyes has historically been used to enhance this already prominent feature.',
    },
    caucasian: {
      characteristics: 'Greater range of natural colour (from dark to blonde); often lighter and finer than average.',
      common_concern: 'Blonde or light-coloured lashes may look sparse without mascara.',
    },
  },
};

// ─── FALSE LASHES ─────────────────────────────────────────────────────────────

export const FALSE_LASHES = {
  overview: 'False (false, falsies, fake) lashes are temporary lash additions applied on top of natural lashes for one-time or limited reuse.',

  strip_lashes: {
    what: 'A single strip of lash hairs on a band, applied across the entire upper lash line.',
    application: [
      '1. Measure strip against eye — trim from the OUTER edge (not inner)',
      '2. Apply thin layer of lash glue to band; wait 30-45 seconds until tacky',
      '3. Position above natural lash line (not on it) looking in a mirror from below',
      '4. Press down starting from centre, then inner and outer corners',
      '5. Press with fingertip or lash applicator to bond',
      '6. Apply eyeliner or gel liner over band to blend',
      '7. Curl together with natural lashes if needed; apply mascara',
    ],
    removal: [
      '1. Soak cotton pad with oil-based remover or micellar water',
      '2. Hold over closed eye 30-60 seconds to dissolve glue',
      '3. Gently peel from outer to inner corner — NEVER pull suddenly',
      '4. Remove dried glue from band for reuse',
    ],
    reuse: 'High-quality strip lashes can be reused 10-20+ times with proper care.',
    styles: {
      natural: 'Short to medium length; adds definition without dramatic effect. Good for day wear.',
      wispy: 'Irregular, feathery pattern with varied lengths. Popular current style. Soft, romantic.',
      dramatic: 'Long, thick, often crossed or layered. Evening/event wear.',
      cat_eye: 'Shorter inner corner, longer outer — elongates eye.',
      doll_eye: 'Longest in the centre — opens and rounds the eye.',
      bottom_lashes: 'Individual or strip for lower lash line; adds definition; requires very precise placement.',
    },
    brands_by_tier: {
      drugstore: ['Ardell (the classic drugstore lash; excellent quality/price)', 'Kiss', 'Salon Perfect', 'Andrea'],
      mid_range: ['Velour Lashes', 'Lilly Lashes', 'Huda Beauty', 'Doe Lashes'],
      luxury: ['Shu Uemura', 'Charlotte Tilbury', 'MAC'],
      mink_alternative: 'Vegan faux mink has largely replaced real mink — identical appearance and feel without animal cruelty.',
    },
  },

  individual_flares: {
    what: 'Small clusters or individual lash hairs applied between natural lashes.',
    types: {
      flares: 'Small clusters of 3-5 hairs. Applied between natural lashes for fuller look.',
      individuals: 'Single hairs. Most natural result. Used to fill sparse areas or lengthen specific lashes.',
    },
    application: 'Apply with tweezers and individual lash glue. Bond at base of natural lash. More fiddly than strips but more natural result.',
    note: 'Individual flares (not professional extensions) are shorter-lasting — typically 1-5 days.',
    diy_popular: 'DIY individual lash application is a popular technique on social media; requires practice.',
  },

  lash_glue_guide: {
    types: {
      white_dries_clear: 'Most common; dries transparent. Slightly less strong.',
      black: 'Dries black — can double as eyeliner. More visible if mistakes made.',
      sensitive: 'Latex-free; for sensitive skin or latex allergy.',
      waterproof: 'Stronger hold; requires oil-based remover.',
    },
    key_brands: ['Duo (classic; dark tone and clear)', 'Lash Look', 'Ardell LashGrip', 'Revlon'],
    application_tip: 'The most common mistake is applying lashes while glue is still wet. Wait until glue is TACKY (30-45 seconds) — this is when bond is strongest.',
    latex_warning: 'Approximately 1-6% of people have latex allergy. Lash glues often contain latex. Patch test on inner arm 24-48 hours before eye application. Use latex-free formulas for sensitive eyes.',
  },
};

// ─── LASH EXTENSIONS ──────────────────────────────────────────────────────────

export const LASH_EXTENSIONS = {
  overview: 'Professional lash extensions are individual synthetic, mink, or faux mink fibres bonded one-by-one to individual natural lashes using semi-permanent adhesive. Applied by trained technicians.',

  types: {
    classic: {
      description: 'One extension applied to each natural lash (1:1 ratio).',
      result: 'Natural, defined look — like perfect mascara.',
      best_for: 'Natural enhancement; first-time extensions; sparse lashes needing definition.',
      duration: '2-4 weeks; infills every 2-3 weeks.',
    },
    volume: {
      description: 'Multiple ultra-fine extensions applied to one natural lash (2D, 3D, 4D, 5D, 6D — number indicates extensions per lash).',
      result: 'Fuller, more dramatic look. Extensions used are lighter (0.05-0.07mm) vs classic (0.12-0.15mm).',
      fans: 'Extensions are formed into a fan shape before application.',
      best_for: 'Fuller look; sparse natural lashes; dramatic effect.',
    },
    hybrid: {
      description: 'Mix of classic and volume techniques (typically 70/30 or 50/50 ratio).',
      result: 'Textured, wispy appearance. Popular "in-between" option.',
      best_for: 'Natural lashes with medium density; versatile aesthetic.',
    },
    mega_volume: {
      description: '6D, 8D, 10D or more extensions per natural lash using the finest fibres (0.03-0.05mm).',
      result: 'Maximum drama, fullness.',
      caution: 'Can be heavy on natural lashes; important to have experienced technician who checks natural lash health.',
    },
    wispy: {
      description: 'Combination technique placing longer "spike" extensions at intervals among shorter ones for irregular, textured look.',
      result: 'Natural, feathery appearance. Currently the most popular style globally.',
    },
  },

  application_process: {
    consultation: 'Discuss desired look, natural lash health, lifestyle, and any sensitivities.',
    preparation: 'Remove all eye makeup. Eye pads placed on lower lashes to protect them.',
    application: 'Isolate individual natural lashes with one pair of tweezers. Apply extension with another pair, dipping base in adhesive, attaching 1-2mm from base of natural lash. Takes 90-180 minutes for full set.',
    drying: 'Adhesive cures in presence of humidity. Some technicians use nano-misting to speed cure.',
    after_care: [
      'No water, steam, or excessive humidity for 24-48 hours',
      'No oil-based products near eye area (breaks down adhesive)',
      'Do not rub eyes or sleep face-down',
      'Use only water-based mascara on tips (not base) if needed',
      'Brush daily with spoolie',
      'Infills every 2-3 weeks as natural lashes shed',
    ],
  },

  adhesive_and_sensitivity: {
    key_ingredient: 'Cyanoacrylate — the active bonding agent in all lash extension adhesives. The curing process releases formaldehyde fumes.',
    sensitivity: 'Lash extension adhesive sensitivity is VERY common — estimated 3-5% of people react immediately; some develop sensitivity after repeated exposure.',
    symptoms: [
      'Red, watery eyes during or after application',
      'Itching, burning sensation',
      'Swelling of eyelid',
      'Allergic contact dermatitis',
    ],
    management: [
      'Sensitive formulas with lower cyanoacrylate concentration available',
      'Charcoal-infused adhesives marketed for sensitive eyes',
      'Increased ventilation in salon',
      'Patch test on small area 24-48 hours before full set',
      'If reaction develops: remove extensions; antihistamine; see doctor if severe',
    ],
    critical_note: 'Never self-apply lash extension adhesive at home. Cyanoacrylate can permanently bond eyelid to eyeball if applied incorrectly. Professional application only.',
  },

  removal: 'Always have extensions professionally removed. Technicians use a cream or gel remover that dissolves the adhesive. Never pick, pull, or cut extensions off — you will remove your natural lashes with them.',

  natural_lash_health: {
    risk: 'Heavy, poorly applied, or too-long extensions can cause mechanical stress on natural lashes leading to permanent lash loss.',
    healthy_practices: [
      'Ensure technician uses appropriate weight/length for your natural lash thickness',
      'Take breaks from extensions — have a "naked lash" period every few months',
      'Use lash serum (see below) during breaks to support lash health',
      'If natural lashes feel lighter/more sparse, give them a break before continuing',
    ],
  },
};

// ─── LASH LIFT AND TINT ───────────────────────────────────────────────────────

export const LASH_LIFT = {
  overview: 'A lash lift is a semi-permanent curling treatment for natural lashes. A chemical solution breaks the disulfide bonds in the lash hair, a silicone rod sets the new curled shape, and a neutralizer re-bonds the hair in the new position. No extensions involved.',

  who_benefits: [
    'Straight lashes (particularly East Asian lashes that grow downward)',
    'Lashes that don\'t hold curl from a lash curler',
    'People who want to skip mascara',
    'Those who cannot wear lash extensions (adhesive sensitivity)',
    'Natural look preference',
  ],

  process: {
    duration: '45-60 minutes',
    steps: [
      'Clean lashes thoroughly',
      'Apply silicone rod (shield) to lid — different sizes for different curl heights',
      'Lashes smoothed over rod with bonding gel',
      'Lifting solution applied — softens lash structure (leave 8-12 minutes based on lash thickness)',
      'Setting/neutralising solution applied — re-bonds in curved shape',
      'Nourishing oil or serum applied',
      'Result visible immediately',
    ],
    aftercare: [
      'No water, steam, or eye makeup for 24-48 hours',
      'No mascara for 24-48 hours',
      'No rubbing eyes',
      'Sleep on back (avoid pressing lashes)',
    ],
    duration_of_result: '6-8 weeks (one full lash growth cycle)',
  },

  lash_tint: {
    what: 'Semi-permanent dye applied to natural lashes, darkening them (particularly effective for blonde/light lashes).',
    colours: 'Black, blue-black, brown, graphite. Black most popular.',
    process: 'Dye applied with applicator, left 10-15 minutes, wiped clean. Lash lift and tint often done together.',
    duration: '4-6 weeks (fades as lashes are shed and replaced).',
    safety: 'Eye-area dye requires specific, ophthalmologist-tested formulas. Patch test essential. NEVER use regular hair dye near eyes — it causes chemical burns.',
    brands: 'Elleebana, Yumilash, Belmacil (professional); Eylure, Refectocil (for trained at-home use with caution)',
  },

  keratin_lash_lift: {
    what: 'Lash lift using a keratin-infused solution that simultaneously lifts and strengthens lashes.',
    benefit: 'Gentler on lashes; particularly good for fine or damaged lashes.',
    popular_brand: 'Elleebana One Shot is the industry standard professional product.',
  },
};

// ─── LASH SERUMS ─────────────────────────────────────────────────────────────

export const LASH_SERUMS = {
  overview: 'Products applied to lash line to support lash growth and health.',

  prescription: {
    bimatoprost: {
      brand: 'Latisse (USA)',
      mechanism: 'Prostaglandin analogue — extends lash growth cycle (anagen phase), increasing length, darkness, and fullness.',
      effectiveness: 'Most evidence-based; clinically proven. Originally used as glaucoma medication (Lumigan); lash growth was a side effect.',
      requires: 'Prescription from doctor.',
      application: 'Applied once nightly to upper lash line with sterile applicator. Takes 8-16 weeks for full effect.',
      warnings: [
        'Can cause iris pigmentation change (permanent darkening of eye colour in light-eyed people)',
        'Can darken skin around eye area (reversible)',
        'Can cause eyelid fat loss if applied to skin rather than lash line',
        'NOT for use while pregnant or breastfeeding',
      ],
    },
  },

  otc_lash_serums: {
    mechanism: 'Most OTC serums use peptides, vitamins (biotin, panthenol), and plant-derived prostaglandin-like ingredients. Evidence is limited but some users report results.',
    key_ingredients: {
      peptides: ['Myristoyl pentapeptide-17', 'Biotin peptide — supports keratin production'],
      plant_derived: 'Isopropyl cloprostenate, dechloro dihydroxy difluoro ethylcloprostenolamide — synthetic prostaglandin analogues in some over-the-counter serums. More effective than pure peptide serums but similar concerns to prescription.',
      vitamins: ['Panthenol (provitamin B5)', 'Biotin', 'Vitamin E'],
    },
    popular_brands: ['RapidLash', 'GrandeLASH-MD', 'RevitaLash', 'Shiseido Full Lash and Brow Serum', 'L\'Oreal Paris Lash Serum'],
    note: 'OTC serums using prostaglandin analogues may have similar side effects to prescription bimatoprost at lower intensity. Patch test; discontinue if eye irritation.',
  },

  natural_options: {
    castor_oil: {
      evidence: 'Widely used; limited scientific evidence for lash growth specifically. Rich in ricinoleic acid.',
      use: 'Apply tiny amount to lash line with clean mascara wand nightly.',
      caution: 'Can cause eye irritation if it gets into eye.',
    },
    vitamin_e: 'Antioxidant; may support lash health. Pierce capsule and apply carefully to lash line.',
    black_castor_oil: 'Jamaican Black Castor Oil popular in Black beauty community for lash and brow growth.',
  },
};

// ─── MASCARA ─────────────────────────────────────────────────────────────────

export const MASCARA_GUIDE = {
  formulas: {
    volumizing: 'Thicker formula or buildable wax that coats lashes; makes them appear fuller and thicker.',
    lengthening: 'Elongating fibres or polymers that extend lash length. Can create spider-leg effect if over-applied.',
    curling: 'Light formula; curved wand; holds curl. Important for straight lashes.',
    waterproof: 'Stronger polymers; resists water, humidity, sweat. Requires oil-based remover; can dry out lashes with daily use.',
    tubing: 'Surrounds individual lashes in a tube that comes off cleanly with warm water. Best option for people prone to eye irritation or contact lens wearers.',
    fiber: 'Contains small fibres that attach to lashes for extension effect. Some contain synthetic fibres (potential eye irritation); use care.',
    clear: 'Tames and defines without colour; also used for brows.',
  },

  wand_shapes: {
    straight: 'Versatile; good for volumizing and lengthening.',
    curved: 'Follows lash curl; good for curling and lifting.',
    plastic_comb: 'Defines and separates individual lashes; clump-free look.',
    fluffy: 'Picks up more product; volumizes.',
    short_bristled: 'Precise application; good for lower lashes and outer corners.',
    bulbous: 'Reaches inner corner lashes; good for full coverage.',
  },

  application: {
    curling: 'Curl BEFORE mascara — never after, as it breaks mascara-coated lashes.',
    technique: 'Start at root (wiggle wand at base) and sweep to tip. Wiggling deposits more product at root for lift.',
    layers: 'Two coats maximum for most looks — more leads to clumping and flaking.',
    lower_lashes: 'Use tip of wand in vertical orientation to avoid smudging.',
    heat_trick: 'Warming mascara wand (30 seconds in warm water, or in bra) makes formula easier to apply and increases curl hold.',
  },

  for_skin_tones: {
    dark_skin_note: 'Black mascara is the universal flattering choice. Brown can look washed out on dark lashes. Coloured mascaras (navy, burgundy) pop beautifully against dark skin tones.',
    light_skin_note: 'Brown mascara can look more natural during day; black for drama.',
  },

  eye_sensitivity: {
    contact_lenses: 'Use ophthalmologist-tested formula. Apply AFTER inserting lenses. Tubing mascaras excellent for contact wearers — clean removal without tugging.',
    sensitive_eyes: 'Fragrance-free, preservative-free formulas. Avoid fibres which can irritate.',
    dry_eyes: 'Avoid waterproof formulas which are harder to remove; choose gentle formulas.',
  },
};

// ─── LASH TRADITIONS BY COMMUNITY ─────────────────────────────────────────────

export const LASH_TRADITIONS = {
  black_american: {
    false_lashes: 'Black American beauty culture pioneered false lash use in mainstream. Strip lashes from the 1950s-60s stage and screen. Dramatic, full lashes are celebrated rather than seen as "too much."',
    brands: 'House of Lashes, Lilly Lashes, and Velour are significantly driven by Black beauty community. Ardell remains the classic drugstore choice.',
    artistic: 'Drag and ballroom culture push lash artistry to extremes — rhinestone-embellished, feathered, hand-crafted lash art.',
    influencers: 'Jackie Aina, NikkieTutorials, Alissa Ashley — lash installation and reviews as key content.',
  },
  arab: {
    kohl_tradition: 'Kohl around the eye to enhance natural lashes is an ancient tradition across Arab, South Asian, and North African cultures. Traditionally made from galena (lead sulfide) — modern formulations use carbon black or other pigments.',
    modern: 'Full lashes are traditional Arab beauty ideal. Extension popularity growing across Arab diaspora.',
    bridal: 'Elaborate bridal eye looks with dramatic lashes — cornerstone of Arab bridal beauty.',
  },
  east_asian: {
    straight_lash_challenge: 'Straight, downward-growing lashes are characteristic; lash curler is essential tool. Lash lift treatments are extremely popular across Korean, Japanese, and Chinese beauty communities.',
    korean: {
      aegyo_sal: 'The Korean "애교살" (aegyo sal) — puffiness under the eye — is a beauty ideal that suggests youthfulness. Paradoxically, this means Korean beauty sometimes avoids lower lash emphasis that would compete with aegyo sal.',
      puppy_lashes: 'Longer lashes at outer corner draped slightly downward — creates "puppy eye" effect (as opposed to cat eye). Popular Korean beauty look.',
    },
    japanese: 'Doll-like lashes centred in middle of eye for wide, rounded effect.',
    chinese: 'No one dominant lash aesthetic; individual and regional variation.',
  },
  south_asian: {
    kajal: 'Kajal (kohl applied inside waterline) is traditional across South Asia. Creates smudged, defined look that frames natural lashes.',
    natural_advantage: 'Long, dark natural lashes common in South Asian women — kajal and mascara often sufficient without false lashes.',
    bridal: 'Heavy eye makeup including false lashes for bridal looks across South Asian weddings.',
  },
  caribbean: {
    vibrant: 'Caribbean beauty culture celebrates drama and colour — coloured lashes, rhinestone-embellished, and glam false lashes particularly popular for carnival and celebrations.',
  },
  latina: {
    thick_lashes: 'Full, thick lashes are a Latina beauty ideal. Volume mascara popular for everyday; strip lashes for events.',
    celebratory: 'Dramatic lash looks for quinceañeras and weddings.',
  },
  west_african: {
    growing: 'Lash extension and false lash culture rapidly growing across West Africa, particularly Nigeria and Ghana. Nollywood celebrity lash looks influence wider market.',
  },
  east_african: {
    kohl_tradition: 'Kohl around eyes is traditional across Ethiopia, Somalia, and wider East Africa. Modern lash extension popularity growing in urban areas.',
  },
  south_african: {
    cosmopolitan: 'South African beauty culture is cosmopolitan — influences from Black American, European, and traditional African cultures merge. Dramatic lash looks popular in urban centres.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getLashAnatomyGuide() {
  return LASH_ANATOMY;
}

export function getFalseLashGuide(style) {
  if (style) return FALSE_LASHES.strip_lashes.styles[style] || FALSE_LASHES;
  return FALSE_LASHES;
}

export function getLashExtensionGuide(type) {
  if (type) return LASH_EXTENSIONS.types[type] || LASH_EXTENSIONS;
  return LASH_EXTENSIONS;
}

export function getLashLiftGuide() {
  return LASH_LIFT;
}

export function getLashSerumGuide(type) {
  if (type === 'prescription') return LASH_SERUMS.prescription;
  if (type === 'otc') return LASH_SERUMS.otc_lash_serums;
  if (type === 'natural') return LASH_SERUMS.natural_options;
  return LASH_SERUMS;
}

export function getMascaraGuide() {
  return MASCARA_GUIDE;
}

export function getLashTraditionForCommunity(communityId) {
  return LASH_TRADITIONS[communityId.replace('-', '_')] || null;
}

export const LASH_GUIDE_STATS = {
  extensionTypes: Object.keys(LASH_EXTENSIONS.types).length,
  falseLashStyles: Object.keys(FALSE_LASHES.strip_lashes.styles).length,
  mascaraFormulas: Object.keys(MASCARA_GUIDE.formulas).length,
  communitiesCovered: Object.keys(LASH_TRADITIONS).length,
};
