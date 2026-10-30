/**
 * MIRRR — Body Hair Guide (Multicultural Perspectives)
 * The complete guide to body hair removal methods, ingrown hair prevention,
 * cultural contexts, and hair removal for all 9 ethnic communities.
 */

export const BODY_HAIR_SCIENCE = {
  title: 'Body Hair Biology',
  hairTypes: {
    vellus: 'Fine, soft, short hair that covers most of the body; light in colour; barely visible; not typically the target of hair removal',
    terminal: 'Coarser, darker, longer hair that grows in specific areas (underarms, pubic area, legs, arms for many, face for some); grows from the same follicle as vellus hair after puberty due to androgen (testosterone) stimulation; the primary target of hair removal',
    androgenSensitivity: 'How much body hair an individual has is primarily determined by follicular sensitivity to androgens (testosterone, DHT); people with more androgen-sensitive follicles grow more and coarser terminal hair; this is genetic and varies significantly across ethnicities'
  },
  ethnicVariation: {
    hairDensity: 'Hair density (number of follicles) varies by body area and by genetics; East Asian populations on average have lower body hair density; these are averages with enormous individual variation — no blanket claim should be made about any individual\'s body hair',
    hairColor: 'Darker hair is more visible against lighter skin and on all skin tones but especially contrasts with paler skin; lighter hair (blonde, red) can be nearly invisible even when present',
    hairTexture: 'Body hair texture varies from fine and straight to coarse and curly; curlier body hair is more prone to ingrown hairs because the hair curls back into the skin after removal'
  },
  follicleAnatomy: {
    structure: 'A hair follicle is a tube-shaped structure that extends from the skin surface into the dermis (middle skin layer) and sometimes the subcutaneous fat; at the base is the dermal papilla (the growth centre) and the hair matrix (where hair cells are produced)',
    growthCycle: 'Hair grows in a cycle: anagen (active growth, weeks to months), catagen (transition, ~2 weeks), telogen (resting, ~3 months); different follicles are in different phases simultaneously, which is why hair removal does not permanently remove all hair at once even with laser',
    sebaceous: 'Attached to each hair follicle is a sebaceous gland that produces sebum (oil) to lubricate the hair and skin; this is relevant to shaving because removing hair does not remove the oil gland — myths about shaving causing more oil production are not supported'
  }
};

export const SHAVING_GUIDE = {
  title: 'Complete Shaving Guide',
  myth: {
    thickerGrowback: 'DEBUNKED: Shaving does not make hair grow back thicker, darker, or faster; this is a pervasive myth; shaving cuts the hair at the surface, creating a blunt edge that feels coarser as it grows back; the actual hair follicle and hair growth rate and colour are not affected by shaving',
    whyItFeelsThicker: 'The blunt edge of shaved hair (versus the tapered natural tip) feels more bristly at stubble stage; the hair is exactly the same diameter as before shaving'
  },
  preparation: {
    importance: 'Proper skin preparation is the primary determinant of a good shave; dry, inadequately prepared skin leads to irritation, razor burn, and ingrown hairs',
    steps: ['Soften the hair with warm water for at least 2-3 minutes (in the shower or bath is ideal; wet hair is softer and easier to cut)', 'Apply a shave oil or shave gel/cream (never shave dry; shaving without lubrication dramatically increases irritation)', 'For sensitive areas, a warm towel or warm compress first increases the efficacy']
  },
  razorSelection: {
    singleBlade: 'Single-blade safety razors provide an extremely close shave with significantly less irritation than multi-blade razors; recommended for sensitive skin and skin prone to ingrown hairs',
    multiBladeRazor: 'Multi-blade razors (2-5 blades) are more convenient and widely available; multiple blades can "lift and cut" the hair, which cuts below the skin surface and increases ingrown hair risk, especially for curly hair',
    electricRazor: 'Electric razors (foil or rotary) are the most gentle option for irritation-prone skin; they don\'t shave as close but are less likely to cause razor burn, cuts, or ingrown hairs; good for sensitive areas',
    disposable: 'Disposable razors degrade quickly and are a false economy for sensitive areas; dulled blades increase drag and irritation'
  },
  technique: {
    direction: 'Shaving with the grain (in the direction of hair growth) is less irritating and causes fewer ingrown hairs; shaving against the grain gives a closer shave but significantly increases irritation and ingrown hair risk; the first shave should always be with the grain',
    pressure: 'Light pressure only; the razor should glide across the skin; pressing too hard causes razor burn and micro-cuts',
    rinse: 'Rinse the blade after every 2-3 strokes to prevent build-up and maintain blade contact with skin',
    frequency: 'Replace blade when any drag, tugging, or increased pressure is needed; a dull blade causes more irritation than a new one'
  },
  aftershave: {
    routine: ['Rinse with cool water (closes follicles)', 'Pat dry (never rub — irritates freshly shaved skin)', 'Apply alcohol-free toner or witch hazel if ingrown-prone', 'Moisturise immediately — freshly shaved skin is temporarily more permeable and absorbs moisturiser better'],
    ingredients: ['Aloe vera: soothing, anti-inflammatory', 'Niacinamide: reduces redness and PIH risk', 'Glycerin or hyaluronic acid: hydration', 'Avoid alcohol-heavy products immediately after shaving — sting and dryness']
  }
};

export const INGROWN_HAIR_GUIDE = {
  title: 'Ingrown Hair Prevention and Treatment',
  whatIsIngrown: 'An ingrown hair (pseudofolliculitis or, when infected, folliculitis) occurs when a hair curls back into the skin or fails to exit the follicle after removal; the hair grows sideways within the follicle, causing inflammation, bumps, and potentially infection; the medical term for razor bumps is pseudofolliculitis barbae (PFB)',
  riskFactors: ['Curly or coily hair texture — the natural curl causes the hair to re-enter the skin more easily', 'Multiple-blade razors that cut below the skin level', 'Shaving against the grain', 'Waxing or threading (which removes hair at or below the follicle level)', 'Dead skin cell build-up (occludes the follicle, preventing hair exit)', 'Tight clothing over freshly shaved skin'],
  ethnicRisk: {
    highRisk: 'Anyone with curly or tightly coiled hair is more prone to ingrown hairs, particularly in the beard area, bikini area, and underarms; the curly hair shaft, when cut, has a sharp angled tip that can pierce the follicle wall',
    
    PIHComplication: 'For Fitzpatrick IV-VI skin, ingrown hairs are doubly problematic: the ingrown hair itself causes inflammation, which triggers PIH (dark spots) even after the ingrown hair resolves; a single ingrown hair can leave a dark mark for months'
  },
  prevention: {
    exfoliation: 'Regular exfoliation (physical with a washcloth or soft brush, or chemical with a gentle AHA/BHA) removes the dead skin cells that can block hair from exiting the follicle; exfoliate 24-48 hours BEFORE hair removal, not immediately after',
    shaveDirection: 'Always shave in the direction of hair growth for ingrown-prone areas; accept a less close shave in exchange for far fewer ingrowns',
    singleBlade: 'Switch from multi-blade to single-blade safety razor in ingrown-prone areas',
    lubrication: 'Adequate lubrication reduces the "lift and cut" effect of razors; shave oil under shave gel provides excellent glide',
    avoidTightClothing: 'Wear loose clothing for 24 hours after shaving ingrown-prone areas (particularly bikini area and inner thighs) to avoid friction pressing hairs back into the skin'
  },
  treatment: {
    existingIngrowns: ['Do NOT pick, squeeze, or pop ingrown hairs — this significantly worsens PIH and risks infection', 'Apply salicylic acid (BHA) to the area — it exfoliates inside the follicle as well as the surface and is the most effective ingredient for preventing and treating ingrown hairs', 'Glycolic acid (AHA) can also help by exfoliating surface dead skin cells', 'Warm compress 2-3 times daily loosens the skin over the trapped hair', 'Only extract once the hair loop is visible at the surface: use sterile tweezers to GENTLY lift the loop above the skin — do not pull the hair out, just free the loop; let the skin heal before continuing hair removal in the area'],
    infected: 'If an ingrown hair becomes infected (significant redness, warmth, pus, increasing pain), this is folliculitis and may require a prescription topical antibiotic; see a dermatologist'
  }
};

export const WAXING_GUIDE = {
  title: 'Waxing Guide',
  types: {
    softWax: 'Applied in a thin layer and removed with a cloth or paper strip; works well for large areas (legs, arms, back); must be applied at the correct temperature; less suitable for sensitive or reactive skin',
    hardWax: 'Applied in a thicker layer that hardens on its own and is pulled off without a strip; less adhered to the skin (only adheres to the hair) making it more gentle for sensitive areas (bikini, underarm, face); preferred for sensitive skin',
    sugaringWax: 'Made from sugar, lemon juice, and water; water-soluble (easy to clean up with water); applied in the direction of hair growth and removed against the grain; some claim it is gentler than waxing; can be made at home',
    threadingWax: 'Not applicable — threading is a separate technique; see threading section'
  },
  preparation: ['Hair must be at least 0.5cm (1/4 inch) to 0.75cm (1/2 inch) long for wax to grip; this is the most common reason for waxing failure', 'Exfoliate 24 hours before waxing (not immediately before)', 'Apply a thin layer of pre-wax oil or powder to protect the skin from the wax adhering too strongly', 'Avoid retinoids and exfoliating acids for 48 hours before waxing — these thin the skin\'s surface layer and increase the risk of the wax removing skin'],
  technique: 'Apply wax in the direction of hair growth; remove quickly and against the direction of hair growth; hold skin taut with the other hand at the point of removal',
  aftercare: ['Apply a soothing post-wax oil, aloe, or calming lotion', 'Avoid heat (hot showers, saunas, sun, exercise) for 24 hours post-wax — pores are open and vulnerable', 'Avoid tight clothing for 24 hours', 'Begin gentle exfoliation 48 hours post-wax to prevent ingrown hairs'],
  ethnicSkinConsiderations: {
    fitzIVVI: 'Waxing causes a degree of inflammation (pulling hair from the follicle); for Fitzpatrick IV-VI skin, this inflammation risk can trigger PIH; using hard wax (less skin adhesion) and applying a pre-wax barrier oil reduces the risk',
    reactivity: 'Darker skin tones may be more reactive to waxing; first-time waxing should be done with a small test patch 48 hours before a full session to assess the skin\'s response',
    darkening: 'Repeated waxing in sensitive areas (bikini, underarm) can cause post-inflammatory darkening of the skin over time; using brightening skincare (niacinamide, vitamin C) in these areas between waxing sessions can help manage this'
  }
};

export const LASER_HAIR_REMOVAL_GUIDE = {
  title: 'Laser Hair Removal',
  mechanism: {
    how: 'Laser hair removal uses concentrated light (laser) that is absorbed by melanin in the hair shaft and follicle; the absorbed light energy converts to heat and destroys the hair follicle; because the laser targets melanin in the HAIR (not the skin), it is most effective when there is strong contrast between hair colour and skin colour',
    
    sessions: 'Multiple sessions are required because only hairs in the anagen (active growth) phase are effectively treated; since follicles are in different phases simultaneously, sessions are spaced 4-8 weeks apart to catch successive cohorts of hairs in anagen'
  },
  laserTypes: {
    alexandrite: {
      wavelength: '755nm',
      bestFor: 'Fair to medium skin tones (Fitzpatrick I-III); very effective for dark hair on light skin; like every laser it does little for blonde, red, grey or white hair; RISKY on darker skin tones due to melanin in skin absorbing the laser and potentially causing burns or PIH',
      notFor: 'Fitzpatrick IV-VI skin (can cause burns, hyperpigmentation, hypopigmentation)'
    },
    diode: {
      wavelength: '810nm',
      bestFor: 'Medium to medium-dark skin tones (Fitzpatrick III-IV); the most common clinic laser',
      caution: 'Requires higher operator skill for Fitzpatrick V-VI to avoid side effects'
    },
    nd_yag: {
      wavelength: '1064nm',
      bestFor: 'THE GOLD STANDARD FOR FITZPATRICK V-VI SKIN (dark and deep skin tones); the longer wavelength bypasses the epidermal melanin and targets the follicle directly; significantly safer for dark skin',
      note: 'Slightly less effective than shorter wavelength lasers on fine hair, but dramatically safer for darker skin tones'
    },
    IPL: {
      what: 'Intense Pulsed Light (IPL) is NOT a laser; it uses a broad spectrum of light wavelengths; much less precisely targeted than laser; at-home IPL devices are widely available but significantly less effective and potentially risky on darker skin tones; professional IPL can be used on medium skin tones but NOT recommended for Fitzpatrick V-VI',
      atHome: 'At-home IPL devices (Braun Silk-Expert, Philips Lumea, Ulike) use automatic skin-tone sensors and typically will not fire on Fitzpatrick V-VI skin due to safety; they are only suitable for Fitzpatrick I-IV at home'
    }
  },
  ethnicSkinGuidance: {
    criticalWarning: 'CRITICAL: Incorrect laser type on dark skin (Fitzpatrick V-VI) can cause permanent burns, hypopigmentation (permanent white patches), and severe PIH; always choose a clinic that has an Nd:YAG (1064nm) laser AND a practitioner with extensive experience treating Fitzpatrick V-VI skin',
    findingAPractitioner: ['Ask specifically what laser the clinic uses; the Nd:YAG at 1064nm is the only appropriate option for Fitzpatrick V-VI', 'Ask for before/after photos of patients with similar skin tones', 'Ask for the practitioner\'s training specifically in treating dark skin', 'The first session should be a test patch — a small area treated and evaluated for 24-48 hours before full-body treatment'],
    greyOrBlondeHair: 'Laser cannot effectively treat grey, white, blonde, or red hair because these hairs contain very little melanin for the laser to target; electrolysis is the only FDA-cleared method for permanent removal of light-coloured hair'
  }
};

export const THREADING_ELECTROLYSIS = {
  threading: {
    title: 'Threading',
    what: 'Threading is an ancient hair removal technique originating in South and Central Asia (India, Iran) and the Middle East; a thin cotton or polyester thread is looped and twisted to trap and pull multiple hairs simultaneously from the follicle',
    bestFor: 'Face, eyebrows (threading is a widely used eyebrow shaping method), upper lip, chin',
    advantages: ['Precise — can define eyebrow shapes very accurately', 'No chemicals or heat', 'Removes the hair from the follicle (results last 2-6 weeks)', 'No products on the skin', 'Very low risk of skin reactions'],
    disadvantages: ['Painful for many people', 'Requires a trained technician (difficult to do on yourself)', 'Can cause ingrown hairs in sensitive areas'],
    ethnicContext: 'Threading has cultural roots in South Asian and Middle Eastern beauty traditions; it is the dominant method for facial hair removal in many South Asian, Arab, and East Asian communities; threading salons are common in cities with large South Asian or Middle Eastern populations'
  },
  electrolysis: {
    title: 'Electrolysis',
    what: 'Electrolysis is the only method the FDA allows to be called PERMANENT hair removal (lasers are cleared for permanent reduction); it uses a fine probe inserted into the hair follicle to deliver a small electrical current that destroys the dermal papilla (hair growth centre) permanently',
    types: ['Galvanic electrolysis: DC current triggers a chemical reaction (lye) that destroys the follicle', 'Thermolysis: RF current generates heat to destroy the follicle', 'Blend: combines both'],
    advantages: ['Permanent — the FDA has cleared it as permanent hair removal (unlike laser which is permanent "reduction")', 'Works on ALL hair colours including grey, white, blonde, red (laser cannot treat these)', 'Works on ALL skin tones (no melanin targeting involved)', 'Can treat any body area'],
    disadvantages: ['Slow — one hair follicle is treated at a time; treating a large area takes many sessions over a long time', 'More painful per session than laser', 'Higher session cost typically', 'Requires a trained electrologist'],
    ethnicSkin: 'Electrolysis is safe and effective across all Fitzpatrick skin types because it does not rely on melanin targeting; it is an excellent option for dark-skinned individuals with grey or light body hair that cannot be treated with laser'
  }
};

export const ETHNIC_BODY_HAIR_GUIDE = {
  'west-african': {
    culturalContext: 'Body hair removal practices in West Africa are widespread but vary by region and religion; full-body hair removal (including pubic and underarm hair) is common in many Muslim West African communities following Islamic grooming traditions (Sunnah practices); leg hair removal is common among urban women in many West African cities',
    commonMethods: 'Shaving is the most common method due to accessibility; professional waxing is growing in urban centres; threading for face',
    specificConcerns: {
      PIHRisk: 'Shaving-related irritation and ingrown hairs on Fitzpatrick V-VI skin trigger PIH; niacinamide applied to shaved areas daily reduces PIH from micro-irritation',
    }
  },
  'south-asian': {
    culturalContext: 'South Asian women have a complex cultural relationship with body hair; removal of arm, leg, upper lip, stomach and bikini hair is a long-standing norm; historically, upper lip and arm hair removal has been normalized; Indian threading salons exist globally and are a major part of the economy; Ayurvedic traditions include turmeric paste as a hair-retarding treatment',
    turmericHairRemoval: {
      tradition: 'Applying a turmeric-based paste to the skin repeatedly over time is a traditional South Asian method of weakening hair and reducing growth; it is commonly used as a pre-bridal treatment; it is NOT permanent removal, but consistent long-term use may reduce hair density'
    },
    commonMethods: 'Threading (culturally significant), waxing (salon waxing is very common in South Asian communities), shaving (common but often with some stigma in older generations)',
  },
  caribbean: {
    culturalContext: 'Body hair removal is widespread in Caribbean communities; influenced by both African and European beauty norms; bikini waxing (including Brazilian and Hollywood) is common in Caribbean beauty culture; the beach culture of the Caribbean makes regular lower body hair removal common',
    commonMethods: 'Waxing is very popular; shaving; laser hair removal is increasingly available and popular in Caribbean urban areas',
  },
  arab: {
    culturalContext: 'Full-body hair removal is an Islamic tradition (Sunnah) for both women and men (though in different ways); the Sunnah specifies regular removal of underarm and pubic hair; in Arab culture, body hair removal for women is extensive and regular and has been practiced for millennia; sugaring (a natural waxing alternative) originated in the ancient Middle East (halawa/halawi)',
    halawa: {
      what: 'Halawa (حلاوة) or sugaring is the traditional Middle Eastern hair removal technique; made from sugar, water, and lemon juice (and sometimes rosewater or honey); water-soluble; removed with the hands (traditional form) or strips',
      advantages: 'All-natural; water-soluble and easy to clean; can be made at home; the ball form is applied against the grain and removed with the grain (opposite of waxing), which some find less irritating',
      technique: 'The sugar paste is warmed, worked into a ball, and flicked quickly against the growth direction to remove hair'
    },
    commonMethods: 'Halawa/sugaring (traditional), professional waxing, threading for face, laser hair removal (increasingly popular in Gulf)',
  },
  latina: {
    culturalContext: 'Body hair removal practices vary significantly across Latina communities; in many Latino cultures, arm hair removal (specifically) is normalized for women (less common in Northern European beauty norms); upper lip hair removal is culturally important across many Latina communities; leg, underarm, and bikini hair removal is widespread',
    commonMethods: 'Waxing is very popular; threading for face; home sugaring recipes are traditional in some Latin American communities; laser is increasingly popular in urban areas',
    specificConcerns: {
      armHair: 'Arm hair removal is a common choice; laser is a semi-permanent option',
      upperLip: 'Upper lip hair removal is a significant concern; threading, waxing, and laser are all used',
    }
  },
  'east-asian': {
    culturalContext: 'Body hair removal norms in East Asia focus on the face (brows, lip, peach fuzz) and on legs and underarms',
    
    commonMethods: 'Face: eyebrow threading or tweezing is standard; lip and chin threading; shaving common for legs and underarms; dermaplaning (shaving the face) is particularly popular in Japanese and Korean beauty for the peach fuzz and cheek/jaw hair removal, as it also exfoliates and preps skin for makeup',
    dermaplaning: {
      what: 'Dermaplaning is the use of a surgical-grade scalpel or a dedicated dermaplaning tool to remove the top layer of dead skin cells AND vellus (peach fuzz) hair from the face; a professional treatment but also done at home with milder tools',
      contraindication: 'MYTH: dermaplaning will make facial hair grow back darker or thicker — this is false for the same reason shaving myths are false; the hair grows back with the same blunt cut but is exactly the same hair'
    },
  },
  'east-african': {
    culturalContext: 'Body hair removal practices in East Africa vary by religion and region; Muslim East African communities (Somali, many Ethiopians and Eritreans, coastal Kenyans) follow Sunnah practices of underarm and pubic hair removal; Ethiopian and Eritrean communities have traditions of body hair removal for women as a beauty standard; full-body hair removal for ceremonies and events is common',
    commonMethods: 'Shaving (most accessible), professional waxing in urban centres, threading for face, sugaring in some communities',
    specificConcerns: {
    }
  },
  'south-african': {
    culturalContext: 'Body hair removal practices vary significantly across South African communities; South Africa\'s diversity (Black South African communities, Cape Coloured communities, Indian South African communities, white South African communities) means practices range widely; widespread body hair removal among women is common in urban South Africa across all communities',
    commonMethods: 'Waxing is popular in professional salons (South Africa has a sophisticated waxing salon culture); shaving; threading for face; laser is growing in urban centres',
    specificConcerns: {
    }
  },
  'black-american': {
    culturalContext: 'Body hair removal is very widespread in Black American communities; leg, underarm, and bikini (ranging from minimal to full Brazilian/Hollywood) hair removal are standard; the razor bump issue (PFB - pseudofolliculitis barbae) is one of the most significant and discussed body hair issues in the Black American community; there is significant beauty content creator and community education work specifically on PFB and dark skin hair removal',
    PFBEducation: {
      
      communityResponse: 'Black American beauty communities have produced extensive content specifically on PFB management; products like TendSkin, GiGi No-Bump Spray, and prescription tretinoin are widely discussed; the community is sophisticated on this topic'
    },
    bikiniAreaSpecific: {
      PIH: 'Bikini area hyperpigmentation from ingrown hairs and friction is a significant beauty concern; niacinamide, kojic acid, and vitamin C applied consistently between waxing sessions can improve darkening over months',
      laserForBikini: 'Nd:YAG laser is the appropriate laser for Fitzpatrick V-VI skin; removing the hair for good is one way to end repeated bikini ingrowns and the dark marks they leave',
      hardWax: 'Hard wax (rather than soft wax) is the preferred choice for bikini waxing on darker skin tones — it adheres less to the skin and causes less trauma, reducing PIH risk'
    },
    recommendations: ['BHA (salicylic acid) as daily exfoliant in shaved/waxed areas: most important single prevention step for PFB', 'Single-blade safety razor or electric razor for any shaving on Fitzpatrick V-VI skin', 'Nd:YAG laser for permanent reduction: many Black American women and men report this as the best long-term solution for razor bumps', 'Niacinamide 10% on bikini area daily for PIH management between hair removal sessions']
  }
};

export function getBodyHairScience() {
  return BODY_HAIR_SCIENCE;
}

export function getShavingGuide(section) {
  const map = {
    preparation: SHAVING_GUIDE.preparation,
    razors: SHAVING_GUIDE.razorSelection,
    technique: SHAVING_GUIDE.technique,
    aftershave: SHAVING_GUIDE.aftershave
  };
  return map[section] || SHAVING_GUIDE;
}

export function getIngrownHairGuide(section) {
  const map = {
    prevention: INGROWN_HAIR_GUIDE.prevention,
    treatment: INGROWN_HAIR_GUIDE.treatment,
    risk: { ethnic: INGROWN_HAIR_GUIDE.ethnicRisk, factors: INGROWN_HAIR_GUIDE.riskFactors }
  };
  return map[section] || INGROWN_HAIR_GUIDE;
}

export function getWaxingGuide() {
  return WAXING_GUIDE;
}

export function getLaserGuide(section) {
  const map = {
    laserTypes: LASER_HAIR_REMOVAL_GUIDE.laserTypes,
    ethnic: LASER_HAIR_REMOVAL_GUIDE.ethnicSkinGuidance,
    mechanism: LASER_HAIR_REMOVAL_GUIDE.mechanism
  };
  return map[section] || LASER_HAIR_REMOVAL_GUIDE;
}

export function getThreadingElectrolysis(method) {
  const map = {
    threading: THREADING_ELECTROLYSIS.threading,
    electrolysis: THREADING_ELECTROLYSIS.electrolysis
  };
  return map[method] || THREADING_ELECTROLYSIS;
}

export function getEthnicBodyHairGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_BODY_HAIR_GUIDE['west-african'],
    'south-asian': ETHNIC_BODY_HAIR_GUIDE['south-asian'],
    caribbean: ETHNIC_BODY_HAIR_GUIDE.caribbean,
    arab: ETHNIC_BODY_HAIR_GUIDE.arab,
    latina: ETHNIC_BODY_HAIR_GUIDE.latina,
    'east-asian': ETHNIC_BODY_HAIR_GUIDE['east-asian'],
    'east-african': ETHNIC_BODY_HAIR_GUIDE['east-african'],
    'south-african': ETHNIC_BODY_HAIR_GUIDE['south-african'],
    'black-american': ETHNIC_BODY_HAIR_GUIDE['black-american']
  };
  return directMap[communityId] || null;
}

