/**
 * MIRRR Body Positive Beauty Guide
 * Stretch marks, cellulite, hyperpigmentation on the body, body hair,
 * self-acceptance in beauty culture, inclusive sizing, and diverse representation
 * across ethnic communities
 */

// ─── STRETCH MARKS ────────────────────────────────────────────────────────────

export const STRETCH_MARKS_GUIDE = {
  what_are_they: {
    medical_name: 'Striae distensae — the medical term for stretch marks. "Striae gravidarum" specifically refers to pregnancy stretch marks.',
    mechanism: 'When skin is stretched rapidly beyond its elastic limit (during growth spurts, pregnancy, rapid weight gain, muscle growth from bodybuilding), the dermis (middle skin layer) tears microscopically. The body repairs these tears with collagen and elastin, but the scar tissue has a different structure and appearance than surrounding skin.',
    colours: {
      red_purple: 'New stretch marks — actively forming or recently formed. Blood vessels are still visible beneath the skin. More responsive to treatment at this stage.',
      white_silver: 'Mature stretch marks — the blood vessels have receded. The striae have become permanent scars. Treatment improves appearance but cannot fully eliminate.',
    },
  },

  prevalence: {
    general: 'Approximately 50-90% of people develop stretch marks at some point in their lives. This varies by study and population.',
    pregnancy: '50-90% of pregnant women develop stretch marks — by far the most common trigger.',
    adolescence: 'Very common in puberty — both boys and girls develop them during growth spurts. Boys often get them on the back and upper arms; girls on breasts, hips, thighs.',
    bodybuilding: 'Rapid muscle growth can cause stretch marks, particularly on the shoulders, biceps, and chest.',
    weight: 'Rapid weight gain (in either direction after bariatric surgery — the rapid loss of weight can also cause stretch marks as skin contracts).',
  },

  ethnic_skin: {
    visibility: 'Stretch marks are visible on all skin tones but may appear differently. On very dark skin, stretch marks may be darker than the surrounding skin (rather than silver/white) due to changes in melanin distribution in the scar tissue. On medium brown skin, they may appear as a lighter line.',
    PIH_consideration: 'In Fitzpatrick IV-VI skin, any skin trauma including the dermal tearing of stretch marks can cause post-inflammatory hyperpigmentation — the area around new stretch marks may darken.',
    genetic_risk: 'Genetic predisposition is real — if a parent had significant stretch marks during pregnancy, their children have higher likelihood.',
  },

  treatment_evidence: {
    honest_overview: 'No treatment fully eliminates established stretch marks. New (red/purple) stretch marks respond better to treatment than mature (white/silver) ones. Managing expectations is essential.',

    topical_treatments: {
      retinoids: {
        evidence: 'Tretinoin (prescription) has the best evidence for reducing early stretch marks — stimulates collagen synthesis and increases cell turnover. Most effective on RED, new stretch marks.',
        caution: 'CONTRAINDICATED during pregnancy and breastfeeding. Do not use on pregnant women.',
        over_counter: 'OTC retinol is weaker but some improvement demonstrated in studies.',
      },
      vitamin_e: {
        evidence: 'Poor — widely sold as stretch mark prevention, particularly during pregnancy. Multiple controlled studies have found no benefit over placebo moisturiser.',
        status: 'Cannot be recommended based on current evidence.',
      },
      cocoa_butter: {
        evidence: 'Multiple randomised controlled trials have found NO benefit for stretch mark prevention in pregnancy over placebo.',
        status: 'Cannot be recommended based on evidence. However, keeping skin moisturised during pregnancy is sensible for skin comfort.',
      },
      hyaluronic_acid: {
        evidence: 'Some studies suggest topical HA may have modest benefit for early stretch marks. More research needed.',
      },
      centella_asiatica: {
        evidence: 'Some evidence suggesting centella-containing preparations may help prevent stretch marks in pregnancy. The extract appears to stimulate collagen synthesis.',
      },
    },

    professional_treatments: {
      microneedling: {
        what: 'Creates controlled micro-injuries to stimulate collagen — can remodel stretch mark scar tissue.',
        evidence: 'Good evidence for improvement of stretch mark appearance. Multiple sessions required (4-6 typically). Better for red stretch marks but some improvement in white too.',
        for_dark_skin: 'Requires experienced practitioner for Fitzpatrick IV-VI — PIH risk from treatment itself.',
      },
      laser_treatment: {
        fractional_laser: {
          what: 'Fractional CO2 or Er:YAG laser creates controlled columns of thermal damage to stimulate remodelling.',
          evidence: 'Strongest evidence base of all stretch mark treatments.',
          for_dark_skin: 'SIGNIFICANT CAUTION for dark skin — laser energy absorbed by melanin can cause severe PIH and scarring. Require a practitioner specifically experienced with dark skin. Pulsed dye laser may be safer for early (red) stretch marks on darker skin.',
        },
        pulsed_dye: 'Better safety profile for darker skin than ablative fractional laser. Targets the redness in new stretch marks. Less effective for white/silver striae.',
      },
      radiofrequency: {
        what: 'Radiofrequency energy heats the dermis to stimulate collagen remodelling without melanin absorption.',
        for_dark_skin: 'Better safety profile for dark skin than laser — RF energy does not preferentially target melanin. Increasingly used for stretch marks in Fitzpatrick IV-VI.',
      },
    },
  },

  prevention: {
    reality: 'Genetic predisposition is the strongest predictor. You cannot fully prevent stretch marks if you are genetically susceptible. You can potentially reduce their severity.',
    possibly_helpful: [
      'Maintaining stable weight changes when possible',
      'Staying well-hydrated (keeps skin supple)',
      'General skin moisturisation (no specific evidence but supports skin health)',
      'Gradual weight gain in pregnancy when clinically appropriate',
    ],
    not_helpful: 'Vitamin E oil, cocoa butter, most commercial "stretch mark prevention" creams based on current evidence.',
  },

  body_positive_reframe: {
    prevalence_reminder: 'Stretch marks affect the majority of the population. They are a normal variant of human skin, not a flaw.',
    cultural_context: 'The pathologisation of stretch marks is a modern, Western beauty standard. In many cultures and historically, stretch marks — particularly those from pregnancy — are seen as marks of womanhood and lived experience.',
    representation: 'Unretouched images showing stretch marks have increased in mainstream media since approximately 2015. Normalisation is ongoing.',
  },
};

// ─── CELLULITE ────────────────────────────────────────────────────────────────

export const CELLULITE_GUIDE = {
  what_is_it: {
    definition: 'Cellulite is the dimpled "cottage cheese" or "orange peel" appearance of skin, most commonly on the thighs, buttocks, and abdomen.',
    mechanism: 'Subcutaneous fat is held in place by fibrous bands (septae) that connect skin to deeper tissue. When fat pushes through weakened areas in these bands, and when the bands pull down unevenly, the dimpled appearance results. The connective tissue architecture in female skin differs from male — women\'s septae run vertically, allowing fat to push through; men\'s run in a criss-cross pattern.',
    why_predominantly_female: '80-90% of post-pubescent women have some degree of cellulite. In men, the prevalence is approximately 10%. Oestrogen affects fat distribution and connective tissue.',
  },

  grades: [
    { grade: 0, description: 'No cellulite — skin smooth when standing or lying, no dimpling when pinching' },
    { grade: 1, description: 'Cellulite only appears when skin is pinched — not visible standing or lying' },
    { grade: 2, description: 'Cellulite visible when standing but disappears when lying' },
    { grade: 3, description: 'Cellulite visible when standing and lying' },
  ],

  ethnic_skin: {
    visibility: 'Cellulite may be less visually obvious on darker skin tones due to higher contrast needed to see the subtle texture differences. However, cellulite prevalence is similar across ethnic groups.',
    body_ideals: 'Cellulite acceptance varies culturally. Some communities traditionally celebrate fuller, curvier bodies where cellulite is normalised.',
  },

  what_actually_works: {
    nothing_permanent: 'No topical treatment permanently eliminates cellulite. Professional treatments have the best evidence.',
    topical: {
      caffeine: 'Most studied topical ingredient. Temporarily dehydrates fat cells and slightly plumps overlying skin. Effect is temporary (hours) and subtle.',
      retinol: 'Some evidence for modest improvement over months of use. Thickens dermis, reducing dimpling visibility.',
      aminophylline: 'A methylxanthine like caffeine. Some evidence but modest and temporary.',
    },
    professional: {
      vacuum_massage_lipomassage: 'Mechanical stimulation of tissue. Some evidence for temporary improvement. Requires ongoing treatments.',
      subcision: 'A needle cuts the fibrous bands causing dimpling. Results last 2-3 years. The most mechanistically logical treatment.',
      QWO_collagenase: 'Injectable enzyme that breaks down fibrous septae. FDA-approved 2021 for buttock cellulite. Significant bruising; results emerge at 4-8 weeks.',
      radiofrequency: 'Heats deep tissue, tightening collagen. Some improvement in skin surface.',
      ONDA_Coolwaves: 'Microwave-based deep tissue treatment. Emerging evidence.',
    },
    lifestyle: {
      exercise: 'Strength training increases muscle mass, reducing the fat-to-muscle ratio in affected areas. The dimpling may become less apparent.',
      hydration: 'Well-hydrated skin appears less dimpled.',
      weight: 'Losing excess weight may reduce cellulite severity but will not eliminate it — genetics are the primary driver.',
    },
  },
};

// ─── BODY HAIR ────────────────────────────────────────────────────────────────

export const BODY_HAIR_GUIDE = {
  facts: {
    universal: 'All humans have hair follicles across their bodies — the differences are in the visibility and coarseness of that hair, not its presence.',
    hormones: 'Androgen hormones (testosterone and related) drive body hair growth. Higher androgen sensitivity = more visible body hair. This is genetic and normal.',
    ethnicity: {
      note: 'Visible body hair patterns differ significantly by ethnicity due to genetic variation in androgen receptor sensitivity and follicle morphology.',
      south_asian: 'Historically, South Asian people often have more visible body and facial hair — a normal genetic variation in androgen sensitivity.',
      east_asian: 'East Asian people tend to have less visible body hair on average.',
      west_african: 'West African people tend to have less visible body hair compared to Mediterranean European populations.',
      latin: 'Highly variable across the diverse genetic mix of Latin communities.',
      middle_eastern: 'Mediterranean and Middle Eastern backgrounds are associated with more visible body hair as a normal variation.',
    },
  },

  removal_methods: {
    shaving: {
      how: 'Cuts hair at the surface. Hair is blunted at tip — grows back with flat edge, which can feel stubbly.',
      regrowth: '1-3 days for face/underarm; 2-5 days for legs.',
      ethnic_note: 'Black men and women with coarse, curly hair are particularly susceptible to pseudofolliculitis barbae (ingrown hairs / razor bumps) from shaving. The curved hair follicle means cut hairs often curve back into skin.',
      technique_for_dark_skin: 'Use single-blade or safety razor (not multi-blade — multi-blade cuts too close); shave with grain not against; use lubricating shave gel (not dry); apply soothing product after.',
    },
    waxing: {
      how: 'Warm wax applied, cloth strip pressed on, then pulled rapidly — removing hair from root. Regrowth: 2-4 weeks.',
      types: { strip_wax: 'Soft wax — applies warm, removed with cloth strip', hard_wax: 'Applied thicker, hardens and is removed without cloth strip — better for coarse hair and sensitive areas like bikini line and face' },
      ethnic_note: 'Hard wax is generally preferred for coarse hair (West African, South Asian backgrounds) as it grips the hair more effectively. Ingrown hairs remain a concern — exfoliate between waxing appointments.',
    },
    threading: {
      how: 'A twisted thread is rolled across the skin, catching and pulling multiple hairs from the root simultaneously.',
      origins: 'Threading originated in Central Asia/Persia and has been practiced in South Asia, China, the Arab world, and surrounding regions for centuries. The traditional choice for facial hair and brows.',
      strengths: 'Extremely precise; no chemicals; no heat; removes very fine hair; no risk of burning or reaction from hot wax; the traditional choice for South Asian, Arab, and East Asian facial hair.',
      limitations: 'Primarily for face and areas with little curvature; time-consuming for large areas; requires skilled practitioner.',
    },
    sugaring_halawa: {
      how: 'A paste made of sugar, lemon, and water is applied and removed by hand flicking or with a strip. Ancient hair removal method.',
      origins: 'Ancient Egypt and Middle East — documented for thousands of years. Halawa (Arabic: حلاوة, meaning "sweetness") is the term in Arab culture.',
      advantages: 'Water-soluble (washes off with water), natural ingredients, gentle on skin, can be done at home with practice.',
      technique: 'Sugar paste is applied AGAINST the direction of hair growth; removed WITH the direction of hair growth — the opposite of strip waxing.',
      home_recipe: 'Sugar: 2 cups granulated sugar; Lemon: 1/4 cup lemon juice; Water: 1/4 cup water. Combine, heat to amber colour (approximately 120°C/250°F), pour into clean container, allow to cool until handleable.',
    },
    depilatory_creams: {
      how: 'Chemical dissolves the hair shaft (thioglycolate breaks disulfide bonds in keratin). Hair can be wiped away.',
      ethnic_note: 'Standard skin patch test is ESSENTIAL, particularly for dark skin — irritation and chemical burn risk, which can cause PIH.',
      caution: 'NEVER use body formula on face — facial skin is more sensitive; use only products specifically formulated for facial use.',
    },
    laser_hair_removal: {
      how: 'Laser light absorbed by melanin in hair follicle → converted to heat → destroys follicle. Requires multiple sessions (6-12 for most areas).',
      for_dark_skin: {
        history: 'Original laser hair removal (IPL, Nd:YAG) was not safe for dark skin — the laser targeted melanin in the skin as well as in the hair. Practitioners who used these on dark skin caused severe burns, PIH, and scarring.',
        modern: 'Nd:YAG 1064nm laser is NOW considered safer for darker skin (Fitzpatrick IV-VI). The longer wavelength penetrates deeper, bypassing the epidermis better. Must be used at appropriate settings by an experienced practitioner.',
        absolute_requirement: 'Laser hair removal on dark skin should ONLY be done by a practitioner specifically experienced with dark skin. Check their before/after portfolio includes patients of similar skin tone to yours.',
        key_question: '"What laser do you use?" — Nd:YAG 1064nm is what to look for for dark skin.',
        contrast_needed: 'Laser works best with HIGH CONTRAST between dark hair and lighter skin. Very dark skin with very dark hair has less contrast — some practitioners use cooling to reduce skin melanin interference. Light hair on dark skin does not respond to laser at all.',
      },
      at_home_devices: 'At-home IPL devices are NOT suitable for dark skin — they are IPL-based (broad spectrum light), not Nd:YAG. Risk of burns on dark skin. Most home devices have safety sensors that will refuse to fire on dark skin; this is a safety feature, not a flaw.',
    },
    electrolysis: {
      how: 'An electric current is passed through each hair follicle via a fine probe, destroying it individually.',
      uniqueness: 'Electrolysis is the ONLY FDA-cleared method for PERMANENT hair removal. Works on ALL hair colours including grey, red, blonde, and white.',
      for_dark_skin: 'Safer than laser for dark skin when performed correctly — electrolysis doesn\'t target melanin.',
      limitation: 'Very time-consuming for large areas — each follicle treated individually.',
    },
  },

  ingrown_hair_prevention: {
    causes: 'Coarse, curly hair (common in afro-textured and some South Asian hair) that is cut sharply by shaving is most prone. The sharpened end curls back into the skin.',
    prevention: [
      'Exfoliate 2-3x/week in areas prone to ingrowns — loosens dead skin that can trap emerging hairs',
      'Avoid very close shaving in prone areas — for Black men, allow a 1mm beard stubble',
      'Shave with grain (hair direction) not against it',
      'Use single-blade razor',
      'Apply salicylic acid product to prone areas',
      'Moisturise skin after removal',
    ],
    treatment: [
      'Don\'t squeeze — can cause PIH',
      'Warm compress to soften skin',
      'Sterilised needle to release hair if visible close to surface',
      'Benzoyl peroxide 2.5% or salicylic acid 2% to the area',
    ],
  },
};

// ─── BODY HYPERPIGMENTATION ───────────────────────────────────────────────────

export const BODY_HYPERPIGMENTATION = {
  types: {
    PIH_body: {
      what: 'Post-inflammatory hyperpigmentation from any skin trauma — acne on body, ingrown hairs, wounds, insect bites, razor bumps.',
      sites: 'Bikini line, underarms, thighs, elbows, knees — areas with friction, shaving, or repeated trauma.',
      more_common: 'Fitzpatrick IV-VI skin produces more melanin in response to inflammation.',
    },
    friction_darkening: {
      what: 'Chronic friction causes skin thickening and darkening — inner thighs rubbing together, underarms, neck, back of knees.',
      treatment: 'Reduce friction (anti-chafe shorts, powder), moisturise to reduce friction, use AHA/BHA to gently resurface, kojic acid or niacinamide topically.',
    },
    underarm_darkening: {
      causes: ['Shaving (blunted hair visible under skin)', 'Friction from tight clothing', 'Deodorant reaction (aluminium compounds in some people)', 'Acanthosis nigricans (associated with insulin resistance/PCOS — requires medical evaluation)', 'Hyperpigmentation after waxing trauma'],
      treatment: ['Switch to single-blade razor or waxing for underarms', 'Use fragrance-free, alcohol-free deodorant', 'Niacinamide products for underarms', 'Kojic acid cream', 'Consult dermatologist if sudden onset — rule out acanthosis nigricans'],
    },
    dark_knees_elbows: {
      causes: 'Pressure, friction, dryness, thickening of skin from bearing weight on these joints.',
      treatment: ['Moisturise daily with a rich cream (shea butter, ceramides)', 'Exfoliate 2-3x/week with AHA or gentle scrub', 'Kojic acid, niacinamide targeted treatment', 'Avoid resting on knees/elbows on hard surfaces'],
    },
  },

  treatment_products: {
    chemical_exfoliants: {
      AHA_body: 'AmLactin (lactic acid 12%) — prescription-strength OTC lactic acid lotion. Highly effective for rough skin and hyperpigmentation on body.',
      BHA_body: 'Paula\'s Choice 2% BHA Body Lotion — salicylic acid for body breakouts and ingrowns.',
    },
    brightening: {
      kojic_acid: 'Effective for body hyperpigmentation. Available in soaps, creams, serums for body.',
      niacinamide: 'SheaMoisture Blemish Control Body Lotion (niacinamide + AHA); The INKEY List Tranexamic Acid Body Lotion.',
    },
    professional: {
      chemical_peels: 'Mandelic acid body peel for Fitzpatrick IV-VI — safest option.',
      laser: 'As with face — Nd:YAG for dark skin; experienced practitioner essential.',
    },
  },
};

// ─── SIZE INCLUSIVITY ─────────────────────────────────────────────────────────

export const SIZE_INCLUSIVITY = {
  beauty_and_body_size: {
    historical: 'Beauty standards of thinness (in mainstream Western culture) solidified in the 20th century and were amplified by advertising media. Prior to this, rounded bodies were often the aspirational standard in many Western and non-Western cultures.',
    ethnic_community_standards: {
      west_african_and_diaspora: 'Historically, rounded, full figures (particularly hips, buttocks, thighs) are associated with beauty, health, fertility, and desirability in many West African and African-American communities.',
      latin: 'Curvy ideals are embedded in many Latin cultural contexts — "la mujer curvilínea." However, colorism and body size prejudice exist within communities.',
      south_asian: 'Thin body ideals exist alongside traditionally valued curves — complex interplay of modern Western influence and traditional standards.',
      arab: 'Historically and traditionally, fuller figures were associated with prosperity and beauty in much of the Arab world.',
    },
  },

  makeup_for_all_body_types: {
    note: 'All bodies can wear all makeup, and there are no makeup rules based on body type. However, practical considerations do exist for certain celebrations.',
    wedding_dress_and_neck: 'A full-coverage foundation or tinted body product on the neck, décolletage, and exposed back/shoulders creates a cohesive finish especially under bright lights.',
    self_tanner: 'Gradual self-tanner used on legs extends the skin tone into visible leg skin. Brands: St. Tropez, Loving Tan, and Black Girl Sunscreen self-tanner (for dark skin tones).',
    contour_body: 'Body contouring (bronzer down centre of shins, on inner thigh gap, along collarbone) is a photography technique. In person, it is rarely visible.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getStretchMarksGuide() {
  return STRETCH_MARKS_GUIDE;
}

export function getCelluliteGuide() {
  return CELLULITE_GUIDE;
}

export function getBodyHairGuide(method) {
  if (method) return BODY_HAIR_GUIDE.removal_methods[method] || null;
  return BODY_HAIR_GUIDE;
}

export function getBodyHyperpigmentationGuide() {
  return BODY_HYPERPIGMENTATION;
}

export function getSizeInclusivityGuide() {
  return SIZE_INCLUSIVITY;
}

export const BODY_POSITIVE_STATS = {
  stretchMarkTreatments: Object.keys(STRETCH_MARKS_GUIDE.treatment_evidence.professional_treatments).length,
  hairRemovalMethods: Object.keys(BODY_HAIR_GUIDE.removal_methods).length,
  celluliteGrades: CELLULITE_GUIDE.grades.length,
  bodyPigmentationTypes: Object.keys(BODY_HYPERPIGMENTATION.types).length,
};
