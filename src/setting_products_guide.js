/**
 * MIRRR Setting Products Guide
 * Setting powders, setting sprays, primers, baking technique,
 * transfer-proofing, flashback prevention, and multicultural setting traditions
 */

// ─── WHY SETTING MATTERS ──────────────────────────────────────────────────────

export const SETTING_OVERVIEW = {
  purpose: 'Setting products lock makeup in place, extend wear, control shine, and protect the look from environmental factors (heat, sweat, humidity, friction). The wrong setting product can oxidise makeup, create flashback in photos, or worsen dryness.',
  categories: {
    primers: 'Applied before foundation — create a smooth base; address specific skin concerns; help foundation grip and last.',
    setting_powders: 'Applied after foundation (and/or concealer) — set the base; control shine; reduce transfer.',
    setting_sprays: 'Applied as a final step — meld layers together; add or reduce shine; lock everything in place.',
  },
  layering_order: [
    'Skincare (moisturiser + SPF)',
    'Primer',
    'Foundation/CC Cream',
    'Concealer',
    'Powder (if using)',
    'Eye makeup',
    'Blush/Bronzer/Highlighter',
    'Setting Spray',
  ],
};

// ─── PRIMERS ──────────────────────────────────────────────────────────────────

export const PRIMER_GUIDE = {
  types: {
    silicone_primer: {
      type: 'Silicone/Smoothing Primer',
      active: 'Dimethicone (silicone polymer)',
      what_it_does: 'Fills fine lines and enlarged pores; creates a smooth, airbrushed surface for foundation to sit on.',
      finish: 'Silky, smooth, blurring',
      best_for: 'Enlarged pores; textured skin; those wanting an airbrushed look',
      caution: 'Silicone-based primers are NOT compatible with water-based setting sprays and some water-based foundations — they can separate or "pill". Use silicone over silicone, or water over water.',
      pilling: 'If foundation is pilling (balling up), it is most often a silicone primer + water-based foundation incompatibility. Switch to a compatible pairing.',
    },
    water_based_primer: {
      type: 'Water-Based/Hydrating Primer',
      what_it_does: 'Adds a layer of hydration; creates a dewy base; helps foundation blend seamlessly into skin.',
      finish: 'Natural, hydrated, skin-like',
      best_for: 'Dry and dehydrated skin; those who want minimal product and a natural look',
      popular: ['e.l.f. Luminous Putty Primer', 'Milk Makeup Hydro Grip Primer'],
    },
    colour_correcting_primer: {
      type: 'Colour-Correcting Primer',
      what_it_does: 'Uses colour theory to neutralise specific skin concerns before foundation.',
      corrections: {
        green: 'Cancels redness (acne, rosacea, broken capillaries)',
        purple_lavender: 'Brightens sallow or dull skin; cancels yellow tones',
        peach_orange: 'Corrects undereye darkness (ESPECIALLY important for deep skin tones — blue/purple circles require orange/peach correction; green circles require red correction)',
        yellow: 'Cancels purple/blue tones; brightens fair skin',
      },
      ethnic_note: 'Orange and peach colour correctors under the eyes are essential for many Black American, South Asian, and West African women whose under-eye circles have a blue-purple or deep-brown tone. A purple corrector (for yellow-sallow tones) is commonly used in East and South Asian beauty.',
    },
    pore_minimising_primer: {
      type: 'Pore-Minimising/Blurring Primer',
      active: 'Often contains silica (light-scattering), nylon spheres, or fine clays to optically blur pores.',
      note: 'Primers do NOT permanently minimise pores (pores cannot be permanently shrunk). The blurring effect is optical and temporary for the duration of the makeup wear.',
    },
    SPF_primer: {
      type: 'SPF Primer',
      note: 'SPF in primers does NOT provide adequate sun protection alone. Primers are applied in too thin a layer to achieve the SPF stated on the label. Always wear a dedicated SPF under makeup for actual sun protection.',
    },
    grip_primer: {
      type: 'Grip/Tacky Primer',
      what_it_does: 'Creates a tacky base that "grips" foundation and makes it last significantly longer.',
      popular: ['Milk Makeup Hydro Grip Primer (famous for tacky grip)', 'NYX Pore Filler'],
    },
  },
  ethnic_note_general: 'Many primers with "pore-blurring" technology lean toward a matte finish that can emphasise skin dryness on deeper or darker skin. Look for hydrating-first primers with blur technology. Test in natural light — some light-scattering primers read as a white cast on deep skin.',
};

// ─── SETTING POWDERS ──────────────────────────────────────────────────────────

export const SETTING_POWDER_GUIDE = {
  types: {
    translucent_powder: {
      type: 'Translucent Setting Powder',
      description: 'Fine, colourless or very lightly tinted powder. Designed to set makeup without adding coverage or significantly altering colour.',
      how_it_works: 'Absorbs oils; sets emollient foundation or concealer; reduces transfer; extends wear.',
      warning_for_deep_skin: 'MANY "translucent" powders are NOT actually translucent on dark skin. Products with titanium dioxide or zinc oxide appear WHITE or GREY on deep skin tones. Always swatch before purchasing. The term "translucent" refers to light-diffusing properties, not absence of pigment.',
      safe_translucent_deep: ['Fenty Beauty Invisimatte Instant Setting + Blotting Powder', 'Charlotte Tilbury Airbrush Flawless Finish (the deep shades)', 'Black Up Cosmetics (formulated for dark skin)', 'Laura Mercier Translucent Loose Setting Powder Medium/Deep'],
      flashback_issue: 'CRITICAL: Titanium dioxide and zinc oxide in powders reflect UV light and cause WHITE FLASHBACK in flash photography. Deep skin tones are disproportionately affected — the white cast invisible in room lighting becomes glaring white in photos. Test powder under flash before events.',
    },
    tinted_setting_powder: {
      type: 'Tinted/Coloured Setting Powder',
      description: 'Contains pigment to subtly even the complexion while setting.',
      benefit_for_dark_skin: 'Generally better choice for Fitzpatrick IV-VI: the added pigment compensates and masks any white cast from the carrier/binding ingredients. Matching to skin tone is essential.',
    },
    banana_powder: {
      type: 'Banana Powder',
      description: 'A warm yellow-toned powder used particularly for setting under-eye concealer and the T-zone.',
      origin: 'Named for its warm yellow banana-hue. Originally popularised in professional stage and film makeup.',
      ethnic_note: 'Banana powder is particularly beloved in Black American and Caribbean beauty communities because the warm yellow tone complements deeper skin tones and cancels out the purple/blue of under-eye darkness better than standard translucent powders. A staple in Black makeup artistry.',
      popular: ['Ben Nye Banana Powder (the industry classic)', 'W7 Nice & Matte Banana Powder', 'Ciaté London Dewy Blush Setting Powder'],
    },
    pressed_vs_loose: {
      pressed: 'Pressed powder: compact, travel-friendly; easier to control application; slightly more coverage.',
      loose: 'Loose powder: finer particles for sheerer, more natural finish; better for full-coverage/dramatic looks where you need maximum setting power.',
    },
  },
  application_methods: {
    press_and_roll: 'Press powder into skin (do not swipe — swiping moves foundation). Use a fluffy powder brush or puff, pressing down then slightly rolling.',
    baking: 'See dedicated baking section below.',
    minimal_dusting: 'A light dusting for oily T-zone only — preserves natural finish elsewhere.',
    powder_brush: 'A large fluffy powder brush applies powder most lightly and naturally.',
    velvet_puff: 'A velvet powder puff presses powder more heavily — used for baking or for a very matte result.',
  },
};

// ─── BAKING TECHNIQUE ────────────────────────────────────────────────────────

export const BAKING_TECHNIQUE = {
  origin: 'Baking (also called cooking) was developed by drag performers and stage makeup artists. It was popularised in mainstream beauty by Black makeup artists and became a global trend around 2015.',
  what_it_is: 'Baking is the application of a thick layer of loose powder under the eyes and on the T-zone, left on for 5-10 minutes while the rest of the makeup is applied, then dusted off. The heat from the face "cooks" (sets) the concealer beneath, creating an extreme crease-proof and long-wear result.',
  step_by_step: [
    '1. Apply under-eye concealer generously (the concealer will be set by the baking).',
    '2. Using a damp beauty blender or powder puff, load a generous amount of loose setting powder.',
    '3. Press the powder-loaded tool firmly under the eyes, forming a thick powder "cookie".',
    '4. Apply the rest of your eye makeup while the baking sets (5-10 minutes).',
    '5. Use a large fluffy brush to sweep away the excess powder in downward strokes.',
    '6. The remaining set area under the eyes should be crease-proof and long-lasting.',
  ],
  powder_choice: 'Translucent banana powder or a warm-toned translucent powder works best for baking under dark eyes. Yellow-toned powders cancel darkness under the eye and provide warmth.',
  who_it_works_for: 'Those with oily skin who need maximum wear under the eyes; drag and theatrical makeup; events where extreme longevity is needed.',
  who_it_may_not_suit: 'Those with dry or mature skin — baking can settle into fine lines and create a powdery, dry appearance. Baking should be done selectively if at all for dry skin types.',
  ethnic_note: 'Baking has deep roots in Black American and LGBTQ+ makeup artistry. The technique was widely practiced in Black communities and drag culture before going mainstream. Understanding its origins is part of honouring the makeup art form.',
};

// ─── SETTING SPRAYS ───────────────────────────────────────────────────────────

export const SETTING_SPRAY_GUIDE = {
  how_it_works: 'Setting sprays create a film over the face that melds makeup layers together, prevents oxidation, reduces transfer, and can adjust the finish.',
  types: {
    matte_setting_spray: {
      type: 'Matte Setting Spray',
      what_it_does: 'Controls shine; extends wear; can take down excess powder.',
      best_for: 'Oily skin; long events; hot weather',
      popular: ['e.l.f. Matte Magic Mist & Set', 'NYX Professional Makeup Matte Finish Spray'],
    },
    dewy_setting_spray: {
      type: 'Dewy/Glow Setting Spray',
      what_it_does: 'Adds radiance; prevents foundation looking powdery; gives "skin-like" finish.',
      best_for: 'Dry skin; natural makeup looks; those who want a glow',
      popular: ['MAC Fix+ (also adds hydration)', 'NYX Professional Makeup Dewy Finish Spray'],
    },
    transfer_proof_spray: {
      type: 'Transfer-Proof/Lock Setting Spray',
      what_it_does: 'Creates a strong film barrier. Makeup will not transfer to clothing or other surfaces.',
      best_for: 'Brides; performers; events with physical contact',
      popular: ['Urban Decay All Nighter (legendary longevity)', 'Morphe Continuous Setting Mist'],
    },
    refreshing_spray: {
      type: 'Refreshing Facial Mist',
      distinction: 'Not technically a setting spray — these are hydrating mists without the film-forming polymers. They refresh skin mid-day but do not significantly extend makeup wear.',
      popular: 'Evian Facial Spray; Mario Badescu Facial Spray (rosewater)',
    },
  },
  application: [
    'Hold 20-30cm from face.',
    'Apply in an X motion then a T motion over the face.',
    'Allow to dry naturally (do not blot or fan — disrupts setting).',
    'Can also use to dampen a beauty blender before foundation application.',
  ],
  hack: 'Dampen a fluffy eyeshadow brush with setting spray and press over eyeshadow — intensifies pigment dramatically without adding water-based product that might move shadow.',
  ethnic_note: 'Setting sprays are particularly useful for dark skin tones because they can prevent foundation from oxidising (darkening or turning orange) during the day. A good setting spray locks the formulation as-applied.',
};

// ─── OXIDATION — THE DARK SKIN PROBLEM ───────────────────────────────────────

export const OXIDATION_GUIDE = {
  what_is_oxidation: 'Foundation oxidation is when the formula reacts with your skin\'s natural oils, heat, and oxygen in the air to change colour after application — often darkening or turning orange or ash.',
  who_it_affects_most: 'Oxidation disproportionately affects warm and deep skin tones because the foundation shades formulated for these depths often contain warm pigments (orange, bronze) that are prone to oxidation. Fair-skin foundations rarely oxidise visibly.',
  how_to_prevent: {
    skincare_base: 'Primer controls oil and acts as a barrier between skin oils and foundation. Less skin oil contact = less oxidation.',
    setting_spray: 'Set immediately with a setting spray after applying foundation — locks the formula as-applied before oxidation has a chance to start.',
    formula_choice: 'Water-based foundations tend to oxidise less than oil-based. Serum foundations and skin-tints are often more stable.',
    test_correctly: 'ALWAYS test foundation on your jawline AND wait 30 minutes before deciding if it\'s a match. Check the shade AFTER 30 min, not immediately on application.',
  },
  transfer_proofing: {
    method_1: 'Foundation → setting powder (press, don\'t swipe) → setting spray',
    method_2: 'Long-wear/transfer-resistant foundation formula alone',
    method_3: 'Foundation → setting spray → powder → setting spray again (two-spray sandwich)',
  },
};

// ─── FLASHBACK PREVENTION ─────────────────────────────────────────────────────

export const FLASHBACK_GUIDE = {
  what_is_flashback: 'White flashback (also called flash photography white cast) occurs when certain ingredients in makeup — primarily titanium dioxide and zinc oxide — reflect flash photography light back as a white or grey cast.',
  why_it_matters: 'Flashback is more visible on deeper skin tones because the white cast creates a dramatic contrast against melanin-rich skin. This can make an otherwise flawless makeup look appear very unnatural in photographs.',
  ingredients_causing_flashback: [
    'Titanium dioxide (TiO2) — in setting powders, physical sunscreens, foundations',
    'Zinc oxide (ZnO) — in physical sunscreens, some foundations',
    'Some silicas and light-scattering spheres in "HD" powders',
  ],
  products_to_avoid_deep_skin: [
    '"HD" setting powders (often very high in silica and TiO2)',
    'Physical sunscreens without tint or finish adjustment',
  ],
  solutions: {
    powder: 'Use finely milled powders without titanium dioxide. Look for powders specifically reviewed by deep skin makeup artists. Banana powder often performs better.',
    SPF: 'Use a tinted physical SPF or switch to chemical SPF (no TiO2/ZnO). Chemical filters rarely cause flashback.',
    test: 'Before any event where photos will be taken, test full makeup look under a phone flash. Better to know at home than to see grey-face in all your photos.',
  },
};

// ─── ETHNIC SETTING TRADITIONS ────────────────────────────────────────────────

export const ETHNIC_SETTING_TRADITIONS = {
  west_african: {
    community: 'West African',
    traditions: 'Natural oil-control with blotting cloths (tissue paper historically). Rice paper blotting sheets (adopted globally). Banana powder and baking techniques widely used in Nigerian and Ghanaian makeup artistry. Nigerian makeup artists have been vocal about flashback issues in "universal" setting powders — brands like Fenty Beauty (Pro Filt\'r Instant Retouch Setting Powder) and black-owned brands formulated specifically for deep skin are preferred.',
  },
  south_asian: {
    community: 'South Asian',
    traditions: 'Talc-based setting powders were traditionally used in South Asian beauty. Compact face powders are a staple in South Asian makeup bags. The "dewy" look is often preferred over matte in South Asian bridal beauty — heavy powder setting avoided for bridal looks (prefer a glazed, glowing finish).',
  },
  caribbean: {
    community: 'Caribbean',
    traditions: 'Banana powder and heavy baking techniques popular in Caribbean makeup culture. Setting sprays for longevity in Caribbean heat and humidity.',
  },
  arab: {
    community: 'Arab',
    traditions: 'Luxurious, full-coverage makeup requires heavy setting for longevity. Arab beauty culture embraces heavy powder setting for dramatic, event-appropriate looks. Transfer-resistant makeup important for long wedding parties and events.',
  },
  latina: {
    community: 'Latina',
    traditions: 'Setting spray widely used across Latina beauty communities for longevity in warm and humid climates. "Full glam" makeup needs strong setting for event longevity.',
  },
  east_asian: {
    community: 'East Asian',
    traditions: 'K-Beauty celebrates a dewy, minimal-powder finish — heavy setting powder avoided in favour of a "glass skin" look. Setting spray preferred over powder to preserve glow. Japanese beauty traditionally includes compact face powder for touch-ups. Blotting paper (aburatorigami — traditional Japanese washi paper) is used for on-the-go oil control without disturbing makeup.',
    blotting: 'Shiseido\'s original blotting papers are iconic — Japanese innovation for on-the-go makeup preservation.',
  },
  east_african: {
    community: 'East African',
    traditions: 'Traditional powder preparations used in some communities. Mineral-based face powders for setting.',
  },
  south_african: {
    community: 'South African',
    traditions: 'Setting products important for wear in South African heat. Translucent powders for deep skin reviewed carefully.',
  },
  black_american: {
    community: 'Black American',
    traditions: 'Baking technique pioneered in Black drag and stage makeup communities before mainstream adoption. Banana powder is a cornerstone of Black American makeup artistry. Ben Nye Banana Powder became an industry staple through Black makeup artists. Setting spray (Urban Decay All Nighter and similar) became standard for long events, performances, and club nights.',
    advocacy: 'Black makeup artists have been the loudest voices calling out flashback and white cast in "translucent" powders not designed for dark skin. This advocacy directly influenced brands like Fenty Beauty to develop truly dark-skin-inclusive setting products.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getSettingOverview() { return SETTING_OVERVIEW; }
export function getPrimerGuide(type) {
  return PRIMER_GUIDE.types[type] || PRIMER_GUIDE;
}
export function getSettingPowderGuide(type) {
  return SETTING_POWDER_GUIDE.types[type] || SETTING_POWDER_GUIDE;
}
export function getBakingTechnique() { return BAKING_TECHNIQUE; }
export function getSettingSprayGuide(type) {
  return SETTING_SPRAY_GUIDE.types[type] || SETTING_SPRAY_GUIDE;
}
export function getOxidationGuide() { return OXIDATION_GUIDE; }
export function getFlashbackGuide() { return FLASHBACK_GUIDE; }
export function getEthnicSettingTradition(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_SETTING_TRADITIONS[key] || Object.values(ETHNIC_SETTING_TRADITIONS);
}

