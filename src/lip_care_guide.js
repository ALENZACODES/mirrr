/**
 * MIRRR — Comprehensive Lip Care Guide
 * Lip skin anatomy, hyperpigmentation, care routines, exfoliation,
 * lip augmentation, ethnic lip diversity, and cultural practices.
 */

export const LIP_ANATOMY = {
  title: 'Lip Skin Anatomy & Biology',
  structure: {
    vermilionBorder: 'The vermilion border is the distinct edge between the lip skin (vermilion zone) and the surrounding facial skin; its sharpness varies with genetics and age; the cupid\'s bow (Cupid\'s bow) is the distinctive double-curve of the upper lip at the vermilion border',
    vermilionZone: 'The lip skin (vermilion zone) is highly specialised: it has very thin epidermis (only 3-5 cell layers vs 10-20+ on body skin), no sweat glands, no sebaceous (oil) glands, and very few melanocytes (pigment cells) compared to surrounding facial skin — this is why lips appear lighter/redder than surrounding skin; the natural pink/red of lips comes primarily from underlying blood vessels showing through the thin tissue',
    moistureRetention: 'Because lips lack oil glands, they cannot produce their own moisturising sebum; lips have very limited water-retention capacity; the moisture content of lip skin is entirely dependent on ambient humidity, water intake, and applied moisturisers; this makes lips inherently prone to dryness and chapping',
    nerveDensity: 'Lips have extremely high nerve density — one of the most sensitive areas of the human body; they are rich in mechanoreceptors (touch) and thermoreceptors (temperature); this is why lip sensations are so acute and why lip injuries feel so significant',
    musculature: 'The orbicularis oris muscle surrounds the mouth and controls lip movement (pursing, kissing, speaking, eating); the DAO (depressor anguli oris) and zygomaticus muscles pull the corners of the mouth; these muscles affect lip shape expression and are targets of cosmetic botulinum toxin to reduce downturned corners ("sad mouth")',
    cupidsBow: {
      genetics: 'The shape of the cupid\'s bow (double peak of the upper lip) is largely genetic; it is defined by the philtrum (the vertical groove between the nose and upper lip) and the columella',
      ethnicVariation: 'Cupid\'s bow definition varies significantly by ethnicity: more pronounced defined bow common in East Asian and South Asian faces; broader, fuller upper lip vermilion common in West African and Black American lips; Latina lips often have full, well-defined cupid\'s bow; these are genetic variations, not defects to be "corrected"'
    }
  },
  agingInLips: {
    volume: 'Natural lip volume decreases with age due to loss of hyaluronic acid and collagen; the average person loses lip volume from age 30 onwards; fat pads that create lip fullness diminish with age',
    border: 'The vermilion border becomes less defined with age; lip liner is used to re-define it; feathering (lipstick bleeding into fine lines around the mouth) increases with age as the perioral skin loosens and fine lines develop',
    colour: 'Natural lip colour can lighten with age (melanocyte activity can decline); pigmented lip products replace natural colour in many older users',
    teeth: 'Natural lip colour reflects the appearance of teeth; yellow teeth make some warm lip colours appear more orange; cool-toned pinks and berry shades can optically whiten yellow teeth; this is why many older women prefer cool-toned lip colours'
  }
};

export const LIP_HYPERPIGMENTATION = {
  title: 'Lip Hyperpigmentation — Causes & Treatments',
  overview: 'Lip hyperpigmentation (darkening of the lips beyond their natural colour) is one of the most common skin concerns across ethnic communities, particularly those with Fitzpatrick III-VI skin. Unlike facial PIH, lip hyperpigmentation has specific and different causes.',
  causes: {
    sunExposure: {
      mechanism: 'Despite having fewer melanocytes than surrounding skin, lips can still hyperpigment from UV exposure; the lip vermilion is prone to UV damage because it lacks the protective melanin layer of surrounding skin; sun-induced lip darkening is common',
      concern: 'Solar keratosis (actinic keratosis) can develop on the lower lip (which faces upward toward the sun) — these are pre-cancerous and require dermatological assessment; any persistent crusty, scaly, or non-healing lip lesion should be seen by a dermatologist'
    },
    hormonalChanges: {
      melasma: 'Melasma affecting the lips (lip melasma) is less common than facial melasma but does occur; it appears as diffuse brownish darkening following the lip border; it is strongly linked to oral contraceptives, pregnancy, and other hormonal changes; UV exposure dramatically worsens it',
      management: 'Strict SPF on lips (SPF-containing lip balms); avoid hormonal triggers where possible with medical guidance; topical treatments like azelaic acid can help gradually'
    },
    smoking: {
      mechanism: 'Smoking is one of the most significant causes of lip hyperpigmentation; nicotine and tobacco smoke compounds stimulate melanin production and cause oxidative damage; smoking causes a distinctive pattern of darkening along the lip edges and central lip',
      reversibility: 'Some smoking-related lip darkening is partially reversible after quitting; however, some oxidative damage is permanent; treatments include topical vitamin C, kojic acid, and niacinamide'
    },
    medication: {
      drugs: 'Several medications cause lip and oral hyperpigmentation: antimalarials (chloroquine, hydroxychloroquine — used for lupus and malaria prevention), amiodarone (heart rhythm drug), minocycline (antibiotic), some chemotherapy agents, and anti-seizure medications',
      approach: 'Discuss with prescribing physician; often not reversible while on the medication; cosmetic camouflage'
    },
    iron_deficiency: 'Iron deficiency anaemia can cause general pallor AND paradoxically can sometimes increase lip melanin production or alter lip appearance; addressing the underlying deficiency is the treatment',
    allergicCheilitis: 'Contact allergy to ingredients in lipstick, lip balm, or toothpaste (especially cinnamic aldehyde, propyl gallate, lanolin, fragrance) causes inflammation (allergic cheilitis) which leads to post-inflammatory hyperpigmentation; patch testing identifies the allergen'
  },
  treatments: {
    topicals: {
      vitaminC: 'L-ascorbic acid (vitamin C) applied to lips brightens by inhibiting tyrosinase (melanin production enzyme); concentrations 10-20%; unstable and oxidises quickly; use fresh, store correctly',
      kojicAcid: 'Kojic acid inhibits tyrosinase; very effective for lip brightening; can be used in DIY lip serums (commercially available) or treatment products; concentrations 1-4% are effective',
      niacinamide: 'Transfers melanin to skin cells in the upper epidermis; in higher concentrations (5-10%) it helps with lip pigmentation; gentle enough for daily use',
      azelaic_acid: 'Effective for hyperpigmentation, anti-inflammatory; works well for melasma including lip melasma; prescription and OTC formulations available',
      retinoids: 'Retinol and tretinoin increase cell turnover, reducing surface pigmentation; lips are more sensitive than facial skin — use lower concentrations; apply over a thin layer of Vaseline for sensitive lips'
    },
    professional: {
      chemicalPeels: 'Superficial peels (glycolic acid, lactic acid, TCA at low concentrations) administered by a dermatologist or aesthetician can improve lip hyperpigmentation; lips are very sensitive so caution and professional guidance is essential',
      laserTreatment: 'Nd:YAG laser has been used successfully for lip hyperpigmentation in darker skin tones; must be performed by a practitioner experienced in treating dark skin to avoid worsening hyperpigmentation; see Fitzpatrick V-VI considerations',
      note: 'Any laser or peel treatment on lips should only be done by a dermatologist or experienced medical aesthetician; lips are sensitive and risks of worsening are significant'
    },
    dailyCare: {
      SPF: 'SPF lip balm is non-negotiable for treating and preventing lip hyperpigmentation; SPF 30+ on lips daily; reapply after eating and drinking',
      gentleExfoliation: 'Regular gentle exfoliation removes darkened surface cells; 1-2 times per week maximum; too frequent exfoliation damages the lip barrier and worsens dryness and pigmentation',
      hydration: 'Well-hydrated lips do not retain pigment as prominently; dry, cracked lips trap pigment in crevices'
    }
  },
  ethnicConsiderations: {
    deeperSkinTones: 'Fitzpatrick IV-VI skin has more melanocytes and higher melanin content in all skin including lips; natural lip colour ranges from medium pink to dark brown to near-black at the deepest Fitzpatrick levels; this is completely normal genetic variation; "lip lightening" for cultural reasons is a complex and contested topic — dermatologists generally advise addressing specific causes (sun damage, smoking) rather than wholesale lightening of naturally dark lips',
    naturalVariation: 'Deep, dark natural lip colour (natural lip melanin) is NOT a skin concern; it is normal for many people with darker skin tones; treating natural melanin as a "problem" is problematic and feeds into colourism; treatment should target exogenous or pathological causes of darkening, not natural lip colour',
    colourism: 'The desire for lighter lips in South Asian, Southeast Asian, East African, West African, and Caribbean communities is often driven by colourism — the internalised bias that lighter skin (including lip colour) is more desirable or beautiful; this is socially constructed; MIRRR affirms beauty at every natural skin and lip tone'
  }
};

export const LIP_CARE_ROUTINE = {
  title: 'Lip Care Routines by Concern',
  basicDailyRoutine: {
    morning: [
      '1. Gently pat lips dry (do not lick — saliva temporarily moisturises but then dehydrates)',
      '2. Apply hyaluronic acid lip serum or aloe vera gel (humectant, draws moisture in)',
      '3. Apply SPF lip balm (minimum SPF 30) — this is non-negotiable for lip health',
      '4. Apply tinted lip balm or lipstick over SPF lip balm if desired'
    ],
    evening: [
      '1. Remove all lip products with a gentle oil cleanser or micellar water on a cotton pad',
      '2. Optional: apply a vitamin C or kojic acid lip treatment (for hyperpigmentation concerns)',
      '3. Apply a generous layer of overnight lip mask or petroleum jelly/Vaseline (occlusive, traps moisture)',
      '4. Leave on overnight — wash off in the morning'
    ],
    weeklyExfoliation: [
      '1. Wet lips gently',
      '2. Apply a small amount of lip scrub (DIY: 1/2 tsp brown sugar + 1/4 tsp coconut oil + drop of honey) or commercial lip scrub',
      '3. Very gently massage in circular motions for 30-60 seconds — NO HARD SCRUBBING, lips are thin and delicate',
      '4. Rinse thoroughly',
      '5. Immediately apply a nourishing lip balm or oil',
      '6. FREQUENCY: Once per week maximum; if lips are already irritated, skip exfoliation entirely until healed'
    ]
  },
  chappedLipRecovery: {
    doNot: ['Do NOT pick or peel dry lip skin — this opens the skin barrier to infection and worsens healing', 'Do NOT lick your lips — saliva contains digestive enzymes that damage lip tissue and evaporating saliva takes moisture with it', 'Do NOT use harsh lip scrubs on already chapped lips', 'Avoid mint, cinnamon, or menthol in lip products when lips are already irritated — these are irritants'],
    do: ['Drink more water — dehydration is a primary cause of chapped lips', 'Apply plain petroleum jelly (Vaseline) generously, frequently throughout the day — the most evidence-based lip healer', 'Use a humidifier if in a dry environment or centrally-heated space', 'Breathe through the nose, not the mouth — mouth breathing dries lips severely', 'Identify and remove the cause: toothpaste with SLS (sodium lauryl sulphate), certain lip products, licking lips, dry air, deficiency states']
  },
  hyperpigmentedLipRoutine: {
    morning: ['SPF 30+ lip balm (essential)', 'Niacinamide lip serum if available'],
    evening: ['Gentle oil cleanse to remove product', 'Kojic acid or vitamin C lip treatment (small amount applied to lips)', 'Overnight occlusive lip mask (petroleum jelly over treatment)'],
    weekly: ['Very gentle lip scrub to remove surface cells', 'Apply vitamin C oil or rosehip oil overnight after scrub']
  },
  agedOrDehydratedLipRoutine: {
    focus: 'Volume-plumping approaches; barrier repair; hydration; definition at the vermilion border',
    morning: ['Hyaluronic acid lip serum (plumping, hydrating)', 'SPF lip balm', 'Lip liner at vermilion border to re-define edge (important for aging lips)', 'Lip colour in satin or gloss finish (matte is drying for already-dry aged lips)'],
    evening: ['Peptide lip treatment (stimulates collagen — some evidence for firming)', 'Generous overnight occlusive mask']
  }
};

export const LIP_AUGMENTATION = {
  title: 'Lip Augmentation — Cosmetic & Professional',
  nonSurgical: {
    topicalPlumpers: {
      mechanism: 'OTC lip plumping products work via two mechanisms: (1) irritants (cinnamon, menthol, capsaicin, bee venom) that cause temporary inflammation/swelling; (2) peptide ingredients that may stimulate collagen over time with regular use',
      irritantPlumpers: {
        ingredients: 'Cinnamic aldehyde (cinnamon), menthol, capsaicin (chilli), ginger, niacin, methyl nicotinate',
        effects: 'Temporary 2-6 hour plumping effect; the "tingle" is mild irritation; for many people this causes redness and swelling that looks like fuller lips; for sensitive skin it can cause allergic reactions',
        ethnicNote: 'Irritant plumpers may cause more significant redness on lighter skin, which can be visible and uncomfortable; they can cause PIH on darker skin if a reaction occurs; always patch test'
      },
      peptidePlumpers: {
        ingredients: 'Palmitoyl tetrapeptide-7, acetyl hexapeptide-3 (argireline), hyaluronic acid spheres that fill fine lines temporarily; Plant-derived collagen alternatives',
        effects: 'Subtle, cumulative effect with regular use; less dramatic than irritant plumpers immediately but safer for sensitive skin; clinical studies show modest improvement'
      }
    },
    makeupTechniques: {
      overdrawing: 'Lip liner slightly above the natural vermilion border to create the illusion of a larger lip; originated in the 1920s; popularised in the 1990s by drag performers and in mainstream culture by the late 2010s; requires a sharp lip liner and careful application; overdrawing works best when the line is followed by a matching lip product that blurs the border',
      glossInCenter: 'Applying a lighter gloss or highlight in the centre of the lips while keeping edges deeper creates an illusion of fullness; standard photographic makeup artist technique',
      linerAllOver: 'Filling the entire lip with liner before applying lipstick or gloss makes the colour last longer and gives the illusion of sharper definition',
      ombre: 'Darker shade on the outer edges, lighter on the centre; can look like 3D fullness; very popular in K-beauty culture',
      ethnicNote: 'Overdrawing is NOT necessary for full natural lips (common in West African, Black American, Caribbean, and Latina communities); this technique was developed primarily to make thinner lips appear fuller; for already full lips, precise liner at the vermilion border maintains definition and prevents lipstick feathering'
    }
  },
  professionalProcedures: {
    hyaluronicAcidFillers: {
      mechanism: 'Hyaluronic acid (HA) gel is injected into the lips to add volume, shape, and definition; HA is a naturally occurring substance in the body; lip fillers are the most popular cosmetic injectable procedure globally',
      brands: 'Juvederm (Allergan), Restylane, Belotero — these are FDA-approved HA filler brands specifically formulated for lips; they vary in thickness, integration, and duration',
      longevity: 'Lip fillers typically last 6-12 months (slightly shorter for lips than other facial areas due to movement); results vary by product and individual metabolism',
      risks: ['Bruising and swelling (common, temporary)', 'Lumpiness or uneven results (operator skill dependent)', 'Vascular occlusion (rare but serious — filler blocks blood vessel; can cause tissue necrosis if not immediately treated with hyaluronidase)', 'Migration (filler moving from injection site)', 'Tyndall effect (blue-grey appearance if filler injected too superficially)', 'Infection (rare)'],
      reversal: 'HA lip fillers are reversible with hyaluronidase (an enzyme that dissolves HA); this is a safety advantage over non-HA fillers; any competent filler practitioner should have hyaluronidase available for emergency use',
      ethnicConsiderations: 'Lip augmentation aesthetic goals vary significantly by ethnicity; a practitioner who only aims for "Angelina Jolie" or "Kylie Jenner" lips as the template is not ethnically competent; a skilled practitioner enhances the individual\'s natural lip structure and proportions; for people with naturally very full lips (West African, Black American, Caribbean communities), filler may be used for definition and symmetry rather than volume'
    },
    permanentFillers: {
      warning: 'Permanent lip fillers (silicone, PMMA) have fallen out of favour due to irreversibility, long-term complication risks, and the development of granulomas (inflammatory reactions); most reputable cosmetic practitioners no longer offer them; be cautious of any practitioner offering permanent lip augmentation',
      regulatoryStatus: 'The FDA has not approved silicone for lip augmentation; its use for this is considered off-label and risky'
    },
    lipLiftSurgery: {
      description: 'A lip lift (also called a bullhorn lip lift) is a surgical procedure that removes a small strip of skin under the nose to lift the upper lip, revealing more vermilion (making the lip appear fuller and younger); it is a permanent solution to a long upper lip (a sign of facial aging where the distance between the nose and upper lip increases)',
      recovery: '1-2 weeks; scar under the nose; when performed by a skilled surgeon the scar is typically not visible',
      candidates: 'Best for people with a long philtrum (distance between nose and upper lip greater than 15mm); this is not about adding volume but about repositioning the lip'
    }
  }
};

export const ETHNIC_LIP_CARE = {
  'west-african': {
    lipProfile: 'West African lips are typically naturally full, with a prominent vermilion and deep natural pigmentation ranging from dark pink to deep brown to plum',
    primaryConcern: 'Lip hyperpigmentation from sun exposure, smoking, and post-inflammatory reactions is a common concern; natural lip colour is often very beautiful and should be celebrated rather than lightened',
    culturalPractice: 'Shea butter from West Africa is an excellent natural lip moisturiser; has been used on lips for generations; raw unrefined shea is fragrance-free and deeply nourishing',
    makeupTradition: 'Bold lip colours — deep burgundy, terracotta, coral, vibrant red — are traditional in West African beauty aesthetics; modern influence includes the Lagos beauty scene which centres dramatic, bold lip looks',
    care: 'Shea butter and beeswax lip balms; SPF lip products; kojic acid for hyperpigmentation treatment; natural lip colour is beautiful, no intervention needed for the lip colour itself'
  },
  'south-asian': {
    lipProfile: 'South Asian lips vary widely; typically medium to fuller lips; natural colour ranges from pink to medium brown with warm undertones; upper lip hair (due to higher androgenic sensitivity) is a common concern around the lip border',
    primaryConcern: 'Upper lip hair removal (threading, laser, waxing); lip hyperpigmentation from hormonal changes (melasma common in South Asian women); lip darkening from heat in food preparations',
    culturalPractice: 'Rose water, almond oil, and turmeric are traditional South Asian lip care ingredients; turmeric with milk applied to lips has some brightening evidence (curcumin inhibits tyrosinase); rose water is hydrating and soothing',
    weddingBeauty: 'Bridal lip colour in South Asian communities ranges from classic deep red (matching the lehenga) to contemporary nude-pink; lip care in the weeks before a wedding is taken seriously; hydration and treatment for maximum colour payoff',
    makeupTradition: 'Red lips are traditional in Hindu bridal aesthetics (red is the colour of fertility and marriage in many South Asian communities); the more coral and orange-reds suit warm South Asian skin undertones beautifully'
  },
  caribbean: {
    lipProfile: 'Caribbean lip profiles reflect the community\'s enormous genetic diversity; African Caribbean lips typically full with deep pigmentation; Indo-Caribbean similar to South Asian profile',
    primaryConcern: 'Lip hyperpigmentation; very full lips may experience skin at the lip corners (cheilitis angularis) due to overlapping skin folds',
    culturalPractice: 'Coconut oil for lip moisture; natural oils from the Caribbean are excellent lip care ingredients; aloe vera from plants grown in the region',
    makeupTradition: 'Vibrant, bold colours for carnival and cultural events; the Caribbean Carnival makeup aesthetic features theatrical, bold lips in electric colours'
  },
  arab: {
    lipProfile: 'Arab lips range from thin to medium to full depending on heritage; lighter-skinned Arab communities (Levantine) may have lighter natural lip colour; olive-skinned Gulf and North African communities often have medium-warm lip colour',
    primaryConcern: 'Lip definition; hyperpigmentation in darker Arab communities',
    culturalPractice: 'Rose water and rosewater lip care; black seed (Nigella sativa) oil has antioxidant properties and is used in some traditional lip care; miswak (natural toothbrush from Salvadora persica) contributes to oral health which affects lip appearance',
    makeupTradition: 'Arab beauty culture has a long tradition of bold dramatic eyes with more neutral lips; however, full deep red or burgundy lips are also celebrated; nude lip with heavy kohl eye is a classic Arab beauty look'
  },
  latina: {
    lipProfile: 'Latina lips vary enormously; many Latinas of African descent have fuller lips with warmer pigmentation; Indigenous-heritage Latinas may have fuller, deeply pigmented lips; European-heritage Latinas may have thinner lips',
    primaryConcern: 'Lip hyperpigmentation in darker-complexioned Latinas; dehydration in warm climates',
    culturalPractice: 'Avocado, coconut oil, and honey are used in Latin American traditional beauty for lip care; aguacate (avocado) lip mask: mash avocado with honey and apply for 15 minutes; very nourishing',
    makeupTradition: 'Bold red, berry, and terracotta lips are associated with Latin beauty aesthetics; the "Latina glow" aesthetic features fuller-looking lips with gloss; JLo\'s nude lip gloss look became iconic globally; traditional Chola aesthetic features overdrawing with dark liner'
  },
  'east-asian': {
    lipProfile: 'East Asian lips (Korean, Japanese, Chinese) typically have a more subtle natural colour, often lighter pink; the cupid\'s bow is often well-defined; lips may appear thinner vs other ethnic groups; the yin-yang lip shape (defined bow with soft overall shape) is considered beautiful in East Asian aesthetics',
    primaryConcern: 'Definition of the cupid\'s bow; natural volume; cold winters in many East Asian regions cause severe lip dryness',
    culturalPractice: 'Camellia oil (tsubaki oil in Japan) is a traditional Japanese lip and skin care oil; very lightweight, non-greasy, and highly nourishing for lip skin; rice bran oil; pearl powder in some traditional Korean cosmetics',
    makeupTradition: 'The Korean "gradient lip" or "ombre lip" (deep stain in the centre fading outward) is globally influential; it creates a youthful, soft, just-bitten look; Japanese lip aesthetic often emphasises natural, well-moisturised pink lip; in China, bold matte red lips have seen a major revival (inspired by historical Chinese cosmetics); liquid lip tints (stains) are a major K-beauty lip category'
  },
  'east-african': {
    lipProfile: 'East African lips are often very full and deeply pigmented, ranging from deep brown to near-black naturally; the prominence of the vermilion is often high; striking natural lips are characteristic of many East African faces',
    primaryConcern: 'Sun protection on lips (East African climates are high UV); hyperpigmentation management; dryness in dryland regions',
    culturalPractice: 'Frankincense and myrrh resins have been used in East African beauty since antiquity; frankincense oil has some evidence for skin healing; shea butter from the region; natural plant butters',
    makeupTradition: 'Deep, dramatic colours on naturally deep lips create stunning looks; gold and bronze lip highlights; for Somali beauty specifically, the natural dark lip colour is accentuated rather than covered; Ethiopian and Kenyan beauty scenes centre bold, vibrant colour aesthetics'
  },
  'south-african': {
    lipProfile: 'Very diverse; Black South African lips often full and deeply pigmented; Indian South African similar to South Asian profile',
    primaryConcern: 'Dehydration and wind in South Africa\'s varied climates; hyperpigmentation',
    culturalPractice: 'Rooibos has antioxidant properties and is used in some South African beauty products including lip balms; baobab oil for lip nourishment; marula oil is a high-oleic acid oil from the marula tree native to southern Africa — excellent lip moisturiser',
    makeupTradition: 'South African beauty reflects enormous diversity; urban Johannesburg beauty culture is sophisticated and global; bold, dramatic lip looks popular in urban areas'
  },
  'black-american': {
    lipProfile: 'Black American lips reflect the community\'s diverse heritage; typically range from medium to very full; natural colour from warm pink to deep brown-black; the full lip is celebrated in contemporary mainstream beauty culture (thanks in significant part to Black beauty influence)',
    primaryConcern: 'Hyperpigmentation from smoking, sun exposure, and post-inflammatory reactions; lip darkening from darker natural pigmentation',
    culturalPractice: 'JBCO (Jamaican Black Castor Oil) applied to lips overnight for deep moisture; raw shea butter; cocoa butter; all deeply embedded in Black American beauty traditions',
    makeupTradition: 'Black American beauty has had an outsized global influence on lip trends: nude lip (Bobbi Brown built an empire on this — she pioneered the concept of nude shades for varied skin tones); Fenty Beauty\'s inclusive nude shades; red lip; deep burgundy; brown liner with complementing lip; Mac "Lady Danger" red; the phrase "painted face" and "full beat" for a complete makeup look originate in Black American vernacular; BIPOC full coverage foundation and nude lip looks originated as resistance against foundation brands that didn\'t match; the full beauty industry is now more inclusive partly because of decades of demand from Black American beauty consumers',
    colourism: 'Lip lightening practices exist within some Black American communities as a manifestation of colourism; MIRRR affirms all natural lip tones as beautiful; lip care is about health, not changing natural colour'
  }
};

export function getLipAnatomy() {
  return LIP_ANATOMY;
}

export function getLipHyperpigmentationGuide(section) {
  if (!section) return LIP_HYPERPIGMENTATION;
  const map = {
    causes: LIP_HYPERPIGMENTATION.causes,
    treatments: LIP_HYPERPIGMENTATION.treatments,
    ethnic: LIP_HYPERPIGMENTATION.ethnicConsiderations,
    smoking: LIP_HYPERPIGMENTATION.causes.smoking,
    colourism: LIP_HYPERPIGMENTATION.ethnicConsiderations.colourism
  };
  return map[section] || LIP_HYPERPIGMENTATION;
}

export function getLipCareRoutine(concern) {
  if (!concern) return LIP_CARE_ROUTINE;
  const map = {
    basic: LIP_CARE_ROUTINE.basicDailyRoutine,
    chapped: LIP_CARE_ROUTINE.chappedLipRecovery,
    hyperpigmented: LIP_CARE_ROUTINE.hyperpigmentedLipRoutine,
    aged: LIP_CARE_ROUTINE.agedOrDehydratedLipRoutine,
    aging: LIP_CARE_ROUTINE.agedOrDehydratedLipRoutine,
    dark: LIP_CARE_ROUTINE.hyperpigmentedLipRoutine
  };
  return map[concern.toLowerCase()] || LIP_CARE_ROUTINE;
}

export function getLipAugmentationGuide(type) {
  if (!type) return LIP_AUGMENTATION;
  const map = {
    topical: LIP_AUGMENTATION.nonSurgical.topicalPlumpers,
    plumper: LIP_AUGMENTATION.nonSurgical.topicalPlumpers,
    makeup: LIP_AUGMENTATION.nonSurgical.makeupTechniques,
    filler: LIP_AUGMENTATION.professionalProcedures.hyaluronicAcidFillers,
    surgical: LIP_AUGMENTATION.professionalProcedures.lipLiftSurgery,
    lift: LIP_AUGMENTATION.professionalProcedures.lipLiftSurgery
  };
  return map[type.toLowerCase()] || LIP_AUGMENTATION;
}

export function getEthnicLipCare(communityId) {
  const directMap = {
    'west-african': ETHNIC_LIP_CARE['west-african'],
    'south-asian': ETHNIC_LIP_CARE['south-asian'],
    caribbean: ETHNIC_LIP_CARE.caribbean,
    arab: ETHNIC_LIP_CARE.arab,
    latina: ETHNIC_LIP_CARE.latina,
    'east-asian': ETHNIC_LIP_CARE['east-asian'],
    'east-african': ETHNIC_LIP_CARE['east-african'],
    'south-african': ETHNIC_LIP_CARE['south-african'],
    'black-american': ETHNIC_LIP_CARE['black-american']
  };
  return directMap[communityId] || null;
}

export const LIP_CARE_STATS = {
  moduleId: 'lip_care_guide',
  version: '1.0.0',
  topics: ['lip care', 'lip anatomy', 'lip hyperpigmentation', 'lip darkening', 'chapped lips', 'lip filler', 'hyaluronic acid lip filler', 'lip plumper', 'vitamin C lips', 'kojic acid lips', 'SPF lip balm', 'overdrawing lips', 'gradient lip', 'Korean lip', 'cupid\'s bow', 'lip lift surgery', 'colourism lips', 'Fenty Beauty nude', 'shea butter lips', 'camellia oil lips', 'JBCO lips', 'marula oil', 'rooibos', 'baobab oil', 'smoking lip darkening', 'sun damage lips', 'melasma lips'],
  communitiesSupported: 9,
  keyFacts: [
    'Lip skin (vermilion zone) has only 3-5 cell layers vs 10-20+ on body skin and completely lacks oil glands and sweat glands — this is why lips cannot moisturise themselves and are inherently prone to dryness',
    'Lips appear pink/red primarily because blood vessels show through the thin, relatively transparent lip tissue — not because of high melanin concentration (lips actually have fewer melanocytes than surrounding facial skin)',
    'HA lip fillers are reversible with hyaluronidase (an enzyme that dissolves hyaluronic acid) — this is a critical safety advantage and any competent practitioner should have it available for emergency use',
    'The Korean "gradient lip" (ombre lip with deep centre colour fading outward) creates a youthful effect and has become globally influential in beauty culture',
    'Fenty Beauty pioneered truly inclusive nude lip shades; before Fenty, "nude" lipstick in mainstream beauty was typically a light beige formulated for light skin — which looked bizarre on medium to dark skin tones; Rihanna\'s launch in 2017 transformed industry standards',
    'Smoking-induced lip hyperpigmentation is partially reversible after quitting; the oxidative compounds in tobacco smoke stimulate melanin production and cause persistent lip darkening',
    'Hyaluronic acid lip fillers last approximately 6-12 months in the lips — shorter than other facial areas because lip movement (speaking, eating, kissing) accelerates product breakdown'
  ]
};
