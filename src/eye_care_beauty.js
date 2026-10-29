/**
 * MIRRR Eye Care Beauty Guide
 * Dark circles causes and treatments, puffiness, undereye skincare,
 * eye creams, milia, and ethnic undereye considerations
 */

// ─── EYE AREA OVERVIEW ───────────────────────────────────────────────────────

export const EYE_AREA_OVERVIEW = {
  anatomy: {
    skin_thickness: 'The skin around the eyes is the thinnest skin on the body — approximately 0.5mm compared to 2mm on the rest of the face. This makes it extremely delicate and the first place to show signs of aging, fatigue, dehydration, and stress.',
    orbicularis_oculi: 'The circular muscle around the eye. Constant movement (blinking ~15,000 times per day, squinting, smiling) creates expression lines and breakdown of collagen over time.',
    fat_pads: 'Fat pads surrounding the eye socket provide cushioning. With age, these fat pads redistribute — either losing volume (creating hollowing) or bulging forward (creating under-eye bags).',
    blood_vessels: 'The undereye area has a dense network of very fine blood vessels. Pooling of blood, increased vascular visibility, and dilated capillaries are major contributors to dark circles.',
    lymphatic: 'The undereye area has delicate lymphatic drainage. Poor lymphatic drainage (from sleep position, allergies, sodium intake) causes fluid accumulation = puffiness.',
  },
  primary_concerns: {
    dark_circles: 'Dark discoloration under the eyes. Multiple possible causes (see below).',
    puffiness: 'Swelling or fluid retention under the eyes.',
    fine_lines: 'Lines forming from dryness, UV damage, repetitive movement, and collagen loss.',
    milia: 'Small, hard white bumps under the eyes from keratin trapped under skin.',
    hollowing: 'Tear trough depression creating a shadow — volume loss (genetic or age-related).',
    hyperpigmentation: 'Periorbital (around-eye) PIH or hyperpigmentation — particularly in Fitzpatrick III-VI.',
  },
};

// ─── DARK CIRCLES ─────────────────────────────────────────────────────────────

export const DARK_CIRCLES_GUIDE = {
  overview: 'Dark circles are not a single condition — they are a symptom with multiple possible causes. The correct treatment depends entirely on identifying the correct cause. Many people have more than one contributing factor.',
  causes: {
    vascular: {
      name: 'Vascular / Blood Vessel Visibility',
      description: 'The most common cause in younger people with thinner or paler undereye skin. The dense network of blood vessels under the very thin undereye skin shows through as a blue, purple, or pink-red tint.',
      visual: 'Purple-blue or red-pink undertone to dark circles. Worse after lack of sleep, alcohol, or anything that dilates blood vessels.',
      test: 'Stretch the skin gently under your eye. If the dark colour lightens or shifts, it is vascular. If it stays the same, it may be pigmentary.',
      treatments: 'Caffeine (vasoconstriction — temporarily narrows blood vessels). Retinol (thickens skin so vessels are less visible). Vitamin K (may support capillary health). Eye cream with peptides. Medical: pulsed dye laser (targets red-pink circles). No topical can fully address structural thin skin.',
    },
    pigmentary: {
      name: 'Pigmentary / Periorbital Hyperpigmentation',
      description: 'Excess melanin deposited in the undereye skin. This is the most common cause in Fitzpatrick III-VI. Can be genetic (familial periorbital pigmentation), sun-induced, or inflammatory (allergic shiners from chronic rubbing).',
      visual: 'Brown, grey, or very dark discoloration. Does not change with stretching.',
      test: 'Stretch the skin. Pigmentary circles maintain the same darkness. Also press gently — pigmentary darkness does not blanch.',
      treatments: 'Topical: vitamin C, niacinamide, kojic acid, arbutin, azelaic acid, retinoids. SPF (mandatory — UV darkens pigment). Medical: chemical peels (light), laser (very cautiously on Fitzpatrick IV-VI), medical-grade brighteners. Pigmentary circles respond to treatment but take months.',
    },
    structural_shadowing: {
      name: 'Structural / Tear Trough / Volume Loss',
      description: 'A hollow depression (tear trough) between the lower eyelid and the cheek. This depression casts a natural shadow that appears as a dark circle. Most prominent in side-lighting.',
      visual: 'Shadow rather than pigment discoloration. Worse in certain lighting angles.',
      test: 'Look at the area in different lighting. In flat, even lighting the "dark circle" may largely disappear — it is a shadow from a hollow, not a coloration.',
      treatments: 'Topical skincare: minimal effect on structural volume loss. Medical: hyaluronic acid filler in the tear trough (dermal filler) — a delicate procedure requiring an experienced injector. Sleep position (sleeping elevated may reduce morning puffiness that accentuates hollowing).',
    },
    lifestyle: {
      name: 'Lifestyle / Fatigue-Related',
      description: 'Sleep deprivation causes pallor (reduced blood flow to skin surface, making underlying blood vessels more visible), and pooling of fluids under the eyes.',
      visual: 'Usually a combination of more pronounced vascular circles + puffiness.',
      treatments: '7-9 hours of sleep. Sleep elevated (reduces fluid pooling). Cold compress in the morning (vasoconstriction). Caffeine eye products.',
    },
    allergic: {
      name: 'Allergic Shiners',
      description: 'Chronic nasal allergies cause venous congestion under the eyes, creating a blue-purple bilateral shadow. Rubbing itchy eyes causes trauma and PIH over time.',
      visual: 'Blue-purple shadows. Associated with nasal allergy symptoms. May be seasonal.',
      treatments: 'Treat the underlying allergy (antihistamines, nasal sprays). Avoid rubbing eyes. Cold compress for immediate relief.',
    },
  },
};

// ─── ETHNIC DARK CIRCLES ──────────────────────────────────────────────────────

export const ETHNIC_DARK_CIRCLES = {
  south_asian: {
    community: 'South Asian',
    dominant_cause: 'Periorbital hyperpigmentation (pigmentary) is the most common type in South Asian individuals — both hereditary and sun-related. The deep skin tone around the eyes is a highly common familial trait.',
    specific_note: 'In South Asian skin (Fitzpatrick III-V), dark circles are very common and often appear from childhood. They are frequently genetic. This does not mean they cannot be improved — but it does mean the expectations should be realistic. A genetic dark circle cannot be "cured," only reduced.',
    treatments: 'Topical brightening actives (vitamin C, niacinamide, kojic acid, azelaic acid). SPF (essential — prevents further darkening). Light chemical peels cautiously. Medical-grade hydroquinone with physician supervision for severe cases.',
  },
  west_african: {
    community: 'West African',
    dominant_cause: 'Pigmentary periorbital hyperpigmentation is common due to high melanin density. Any chronic eye rubbing (from allergies, dry eyes) significantly worsens PIH in dark skin.',
    treatments: 'Same brightening actives as South Asian. Avoid rubbing eyes. Cold compress for allergy relief.',
  },
  arab: {
    community: 'Arab',
    dominant_cause: 'Vascular + pigmentary combination common. Arab populations are Fitzpatrick III-V; periorbital pigmentation combined with visible dark blood vessels is typical.',
    treatments: 'Brightening actives, caffeine, cold compress. Kohl has been used traditionally to visually define the eye and draw attention away from under-eye concerns.',
  },
  east_asian: {
    community: 'East Asian',
    dominant_cause: 'Vascular circles (bluish-purple) are most common in lighter Fitzpatrick East Asian skin. Tear trough hollowing (structural) becomes more prominent with age.',
    specific_note: 'Asian skin has a distinct orbital anatomy — the "double lid" vs. "single lid" debate, and the different fat pad distribution around the Asian eye create unique concerns. Under-eye appearance for East Asian patients is a highly specialized aesthetic consideration.',
    treatments: 'Vitamin C, retinol, caffeine. Collagen-supporting peptides. Medical: tear trough filler (very popular in East Asian medical aesthetics). Careful — filler complications in this area are serious.',
  },
  black_american: {
    community: 'Black American',
    dominant_cause: 'Periorbital pigmentation is a primary concern. High melanin production means any periorbital PIH (from allergies, chronic rubbing, sun) is very prominent. The skin under the eyes in Black American individuals can also simply have higher natural melanin density.',
    treatments: 'SPF (most important — prevents darkening). Niacinamide, vitamin C, kojic acid. Concealer with peachy-orange undertone (colour correcting dark circles on brown/dark skin requires warmth — not pink, not peach for very deep skin).',
    makeup: 'Colour correcting dark circles on deeper skin: a rich, warm peach-to-terracotta corrector (not the standard peach or pink correctors which are designed for lighter skin) neutralises the dark circle before concealer.',
  },
  latina: {
    community: 'Latina',
    dominant_cause: 'Variable by individual genetic ancestry. Structural hollowing (genetic) is common in Latin populations with Indigenous ancestry. Pigmentary circles in Latina individuals with Afro-Latin heritage.',
    treatments: 'Depends on cause. Structural: filler with an experienced injector. Pigmentary: brightening actives.',
  },
};

// ─── UNDEREYE PUFFINESS ───────────────────────────────────────────────────────

export const UNDEREYE_PUFFINESS = {
  causes: {
    fluid_retention: 'During sleep (especially when lying flat), fluid redistributes and can accumulate in the loose tissue around the eyes. Gravity is not draining it as it would while upright. High sodium intake the evening before worsens this.',
    allergies: 'Allergic reactions trigger histamine release and inflammation, causing periorbital swelling.',
    contact_dermatitis: 'Reaction to a skincare, makeup, or haircare product applied near the eye. Distinguishable by itch, redness, or burning in addition to swelling.',
    fat_pad_prolapse: 'With age (and genetics), the orbital septum (the membrane holding fat pads in place) weakens. Fat pads bulge forward. This is structural/permanent — not morning puffiness — and does not respond to topicals.',
    sinus_congestion: 'Blocked sinuses create pressure and swelling that can affect the undereye area.',
    thyroid: 'Hypothyroidism (underactive thyroid) causes periorbital edema (swelling). Persistent, unexplained puffiness warrants thyroid assessment.',
  },
  immediate_fixes: {
    cold_compress: 'The single most effective immediate fix. Cold vasoconstricts blood vessels and reduces fluid. Ice wrapped in cloth (not direct ice — too cold). Cool stainless steel spoons kept in fridge. Cold cucumber slices (provides cooling + cucurbitacin — mild anti-inflammatory).',
    elevation: 'Sleep with an extra pillow to prevent fluid pooling under eyes overnight.',
    cold_eye_patches: 'Under-eye hydrogel patches kept in the refrigerator. Dual effect: cooling + active ingredients from the patch.',
    caffeine: 'Topical caffeine (in eye cream) constricts blood vessels and temporarily reduces puffiness. Also found in used, cooled caffeinated tea bags applied to eyes.',
    lymphatic_massage: 'Gentle, light tapping massage from inner corner to outer corner of the undereye to encourage lymphatic drainage.',
  },
  long_term: {
    reduce_sodium: 'Reducing dietary sodium reduces overall fluid retention, including in the face and eyes.',
    adequate_sleep: '7-9 hours in a slightly elevated position.',
    allergy_management: 'Treat underlying allergies.',
    limit_alcohol: 'Alcohol is a major cause of undereye puffiness — disrupts sleep, causes dehydration, dilates blood vessels.',
  },
};

// ─── EYE CREAM GUIDE ──────────────────────────────────────────────────────────

export const EYE_CREAM_GUIDE = {
  do_you_need_eye_cream: {
    the_debate: 'Eye creams are one of the most controversial beauty products. The counterargument: a good moisturiser applied gently to the undereye area does everything an eye cream claims to do, often with higher concentrations of actives. The counterpoint: eye creams are formulated to be non-irritating in the delicate periorbital area and have smaller molecular weights for the thinner skin.',
    verdict: 'A dedicated eye cream is beneficial if: your regular moisturiser irritates the undereye area, you are targeting specific concerns (dark circles, puffiness, fine lines), or you prefer the ritual. It is not essential if your regular moisturiser is gentle enough and you apply it carefully.',
    caution: 'NEVER apply strong actives (high-% vitamin C, AHA, high-% retinol) directly to the undereye skin. The skin is too thin and sensitive. Use gentler, lower-concentration formulations here.',
  },
  key_ingredients: {
    caffeine: {
      ingredient: 'Caffeine',
      benefit: 'Vasoconstriction (narrows blood vessels), reduces puffiness temporarily, and may have antioxidant properties.',
      concerns: 'Dark circles (vascular), puffiness.',
    },
    retinol: {
      ingredient: 'Retinol (lower strength 0.025-0.05% for eye area)',
      benefit: 'Stimulates collagen production, thickens the thin skin around the eye, reduces fine lines.',
      concerns: 'Fine lines, skin thinning, vascular dark circles (thicker skin = less visible vessels).',
      caution: 'Start slowly. The eye area can become irritated with retinol. Use only at night; mandatory SPF.',
    },
    hyaluronic_acid: {
      ingredient: 'Hyaluronic Acid',
      benefit: 'Hydration, plumping of fine lines. A hyaluronic acid-rich eye cream visibly plumps undereye fine lines.',
      concerns: 'Fine lines, dehydration under eye.',
    },
    vitamin_c: {
      ingredient: 'Vitamin C (low concentration, stabilised)',
      benefit: 'Brightening, antioxidant protection, stimulates collagen.',
      concerns: 'Dark circles (pigmentary), thin skin, fine lines.',
    },
    peptides: {
      ingredient: 'Peptides (palmitoyl tetrapeptide, palmitoyl tripeptide-1)',
      benefit: 'Signal skin to produce more collagen. Reduce fine lines and improve elasticity.',
      concerns: 'Aging eye area, fine lines.',
    },
    niacinamide: {
      ingredient: 'Niacinamide 2-5%',
      benefit: 'Brightening (reduces PIH/dark circles), anti-inflammatory, strengthens barrier.',
      concerns: 'Dark circles (pigmentary), puffiness, sensitive skin.',
    },
    ceramides: {
      ingredient: 'Ceramides',
      benefit: 'Restore and maintain the skin barrier in the undereye area. Prevent transepidermal water loss.',
      concerns: 'Dry, dehydrated undereye. Sensitive or allergic skin.',
    },
    arnica: {
      ingredient: 'Arnica Extract',
      benefit: 'Traditional anti-inflammatory. Some evidence for reducing undereye bruising/swelling.',
      concerns: 'Puffiness, post-procedure.',
    },
  },
  application: {
    amount: 'A pea-sized amount is sufficient for both eyes.',
    tool: 'Ring finger (lightest pressure of all fingers) or clean ceramic/jade roller/cool metal applicator.',
    motion: 'Tap gently — NEVER rub or drag. The undereye skin is fragile. Pat from inner corner outward, following the orbital bone.',
    how_far: 'Apply on the orbital bone (the bony rim around the eye socket), not right up against the eye. Products migrate inward with body heat.',
    timing: 'After serum, before moisturiser in your routine.',
  },
};

// ─── MILIA ────────────────────────────────────────────────────────────────────

export const MILIA_GUIDE = {
  what_is_milia: 'Milia (singular: milium) are tiny, firm, white or yellowish keratin-filled cysts that form just under the skin surface. They look like tiny white pearls and are very common around the eyes. They are NOT acne — they contain keratin (dead skin cells), not sebum or bacteria.',
  causes: {
    primary: 'Keratin becoming trapped under the skin surface — the pore is intact but exfoliation is insufficient to shed the trapped cells.',
    product_related: 'Heavy, occlusive eye creams or products (particularly those with petrolatum, heavy emollients) can contribute to milia formation in the eye area by preventing the natural shedding of cells.',
    damage_related: 'After skin trauma (sunburn, burns, blisters), milia can form as the skin heals.',
    cosmetic: 'Heavy makeup products around the eye.',
  },
  treatment: {
    do_not_squeeze: 'Do NOT try to squeeze or pop milia. They have no opening (unlike a pustule or blackhead) — squeezing causes trauma, scarring, and does not remove the cyst.',
    gentle_exfoliation: 'Regular, gentle chemical exfoliation (AHA — lactic or glycolic acid) can prevent and gradually resolve new milia by promoting cell turnover.',
    retinol: 'Retinol around the eye area (very gentle concentration) helps resolve milia through increased cell turnover.',
    professional: 'A trained aesthetician or dermatologist can remove milia with a lancet (sterile needle) and gentle extraction. This is the fastest and most effective approach for established milia.',
  },
  prevention: 'Use lightweight eye creams in the undereye area. Avoid thick, occlusive eye products if milia-prone. Include gentle chemical exfoliation in your routine.',
};

// ─── EYE CONTOUR TECHNIQUES ───────────────────────────────────────────────────

export const EYE_CONTOUR_TECHNIQUES = {
  brightening: {
    concealer_application: 'Apply concealer in an INVERTED TRIANGLE shape under the eye (pointing the triangle downward onto the cheek) rather than just horizontally along the undereye line. This brightens and lifts the midface simultaneously.',
    colour_correction: {
      light_to_medium: 'For fair to medium skin (Fitzpatrick I-III): standard peach or salmon corrector neutralises blue-purple dark circles before concealer.',
      medium_to_deep: 'For medium to deep skin (Fitzpatrick III-V): deeper, more orange or terracotta corrector needed. Light peach corrector is invisible or ineffective on medium-deep skin.',
      deepest: 'For deepest skin (Fitzpatrick V-VI): a rich, deep copper-orange corrector is needed to neutralise very dark undereye pigmentation. Then set with a colour-matching concealer.',
    },
    setting: 'Set undereye concealer lightly with a fine-milled powder or translucent powder — prevents creasing. Baking (applying a thick layer of powder for 5-10 min then dusting off) for events.',
  },
  brightening_without_concealer: {
    inner_corner_highlight: 'A tiny touch of highlight or light shimmer at the very inner corner of the eye opens and brightens the whole eye without any concealer.',
    lower_lid_liner: 'A nude or white pencil on the waterline (lower inner rim) instantly makes eyes look less tired and more awake.',
    lash_curl: 'Curling lashes opens the eye and lifts the perceived position of the lash line, making the undereye area appear less prominent.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getEyeAreaOverview() { return EYE_AREA_OVERVIEW; }
export function getDarkCirclesCause(cause) {
  return cause ? DARK_CIRCLES_GUIDE.causes[cause] : DARK_CIRCLES_GUIDE;
}
export function getEthnicDarkCircles(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_DARK_CIRCLES[key] || Object.values(ETHNIC_DARK_CIRCLES);
}
export function getUndereyePuffiness() { return UNDEREYE_PUFFINESS; }
export function getEyeCreamIngredient(ingredient) {
  return ingredient ? EYE_CREAM_GUIDE.key_ingredients[ingredient] : EYE_CREAM_GUIDE;
}
export function getMiliaGuide() { return MILIA_GUIDE; }
export function getEyeContourTechniques() { return EYE_CONTOUR_TECHNIQUES; }

export const EYE_CARE_BEAUTY_STATS = {
  darkCircleCauses: Object.keys(DARK_CIRCLES_GUIDE.causes).length,
  eyeCreamIngredients: Object.keys(EYE_CREAM_GUIDE.key_ingredients).length,
  ethnicCommunities: Object.keys(ETHNIC_DARK_CIRCLES).length,
  puffinessCauses: Object.keys(UNDEREYE_PUFFINESS.causes).length,
};
