/**
 * MIRRR — Professional Skin Treatments for Ethnic Skin
 * Chemical peels, lasers, microneedling, injectables — ethnic skin safety.
 */

export const PROFESSIONAL_TREATMENTS_OVERVIEW = {
  whyEthnicSkinIsDifferent: {
    melanin: 'Melanin (eumelanin — the brown-black pigment — in skin types IV-VI; phaeomelanin — the red-yellow pigment — in types I-II) is produced by melanocytes and transferred to keratinocytes; in darker skin types, melanin is more evenly distributed and more abundant; melanin absorbs laser energy in addition to the intended target — this is why many lasers safe for fair skin cause hyperpigmentation in dark skin if not correctly selected',
    pih: 'Post-Inflammatory Hyperpigmentation (PIH): the most significant risk in professional treatments for darker skin (Fitzpatrick IV-VI); any inflammation or injury to the skin triggers melanocyte overactivation → melanin overproduction → darkening of the treated area; treatment outcome: the procedure that was supposed to improve skin causes the very problem it aimed to address',
    keloidRisk: 'Keloid and hypertrophic scar risk: increased in Fitzpatrick IV-VI skin; keloids (pathological scar tissue that grows beyond the wound margin) are 3-19× more common in darker-skinned individuals than in Fitzpatrick I-III skin; this affects decisions about microneedling depth, laser settings, and any procedure that breaches the skin barrier',
    fibroblastActivity: 'Darker skin has more active fibroblasts (cells that produce collagen); this means both greater wound-healing ability AND greater risk of excessive scar formation; the fine balance between benefit (collagen induction in microneedling, laser resurfacing) and risk (keloid, hypertrophic scar) must be managed with appropriate settings',
    testPatch: 'The test patch (test spot) is non-negotiable for all ethnic skin types (especially Fitzpatrick IV-VI) for any energy-based device or chemical peel; a small test area is treated and observed for 4-6 weeks before full treatment; this allows assessment of PIH tendency, healing response, and appropriate settings'
  }
};

export const CHEMICAL_PEELS_ETHNIC = {
  overview: 'Chemical peels use acids to exfoliate the skin at controlled depths; peel depth determines both efficacy and risk; for Fitzpatrick IV-VI skin, superficial to medium-depth peels are generally safe and effective when selected and applied correctly; deep peels (phenol peels) are generally contraindicated for dark skin due to severe risk of permanent hypopigmentation or hyperpigmentation',
  peelTypes: {
    alphaHydroxyAcids: {
      name: 'Alpha-Hydroxy Acid Peels (AHA)',
      acids: 'Glycolic acid (from sugarcane — 20-70% in professional settings; the most researched AHA for ethnic skin); lactic acid (from milk — gentler than glycolic; better for sensitive skin; naturally occurring in some fermented African skincare traditions); mandelic acid (from bitter almonds — the largest AHA molecule; slowest penetration; most gentle; excellent for dark skin types; antibacterial properties for acne)',
      depth: 'Superficial peel — exfoliates the stratum corneum (outermost epidermis)',
      ethnicSafety: 'Generally safe for all Fitzpatrick types when correctly selected; mandelic acid is considered the safest AHA for Fitzpatrick IV-VI; glycolic acid at lower concentrations (20-35%) is widely used and effective for PIH in dark skin; proper preparation with retinoids and hydroquinone for 4-6 weeks before peeling reduces PIH risk',
      uses: 'Mild hyperpigmentation; acne; texture improvement; dull skin; mild melasma'
    },
    betaHydroxyAcids: {
      name: 'Salicylic Acid Peels (BHA)',
      concentration: '20-30% professional strength; oil-soluble so penetrates sebaceous follicles',
      depth: 'Superficial peel targeting comedones and follicular plugging',
      ethnicSafety: 'Considered one of the safest peels for dark skin types; anti-inflammatory as well as exfoliating (reduces PIH risk); specifically excellent for acne-prone dark skin; FDA-cleared for all skin types; well-studied in South Asian and African American populations',
      uses: 'Acne; oily skin; comedones; mild PIH associated with acne; dark skin types benefit particularly from the anti-inflammatory component'
    },
    jessnerSolution: {
      name: 'Jessner\'s Solution',
      composition: '14% salicylic acid + 14% lactic acid + 14% resorcinol in ethanol',
      depth: 'Superficial to medium depth depending on number of coats applied',
      ethnicSafety: 'Modified Jessner\'s (replacing resorcinol with citric acid) is considered safer for darker skin; original Jessner\'s may cause temporary darkening; used in ethnic skin by experienced practitioners with careful monitoring',
      uses: 'Acne; mild-moderate hyperpigmentation; texture; fine lines'
    },
    trichloroaceticAcid: {
      name: 'Trichloroacetic Acid (TCA) Peels',
      concentrations: '10-35% (superficial to medium depth); above 35% is considered deep',
      depth: 'Low concentration TCA (10-20%): superficial; medium TCA (25-35%): medium depth reaching papillary dermis',
      ethnicSafety: 'TCA requires skill and careful selection for darker skin; low-concentration TCA (10-15%) is used safely for Fitzpatrick IV-VI; medium-depth TCA at 25-35% requires significant caution and is typically only performed by experienced practitioners in ethnic skin; the "CROSS technique" (Chemical Reconstruction of Skin Scars — focal application of 50-100% TCA into individual acne scars) is used for ice-pick scar treatment in carefully selected patients',
      ethnicBenefit: 'Medium-depth TCA peels have been shown to be effective for melasma, PIH, and acne scars in darker skin types when performed by experienced practitioners with appropriate pre-and post-treatment protocols',
      uses: 'Melasma (requires careful management); PIH; acne scars (CROSS technique); moderate hyperpigmentation'
    },
    phenolPeels: {
      name: 'Phenol / Baker-Gordon Peels',
      depth: 'Deep peel — penetrates to mid-reticular dermis',
      ethnicSafety: 'GENERALLY CONTRAINDICATED IN FITZPATRICK IV-VI SKIN; risk of permanent hypopigmentation (skin bleaching) in darker skin types; high risk of PIH; significant cardiac risk (phenol is cardiotoxic; cardiac monitoring required); the dramatic resurfacing achieved in fair skin comes at unacceptable risk in darker skin types',
      uses: 'In appropriate patients (Fitzpatrick I-III): severe photodamage, deep wrinkles, actinic keratoses; NOT for ethnic skin'
    }
  },
  pretreatmentProtocol: {
    name: 'Pre-treatment Protocol for Ethnic Skin',
    duration: '4-6 weeks minimum before any chemical peel in Fitzpatrick IV-VI skin',
    components: 'Broad-spectrum SPF 30+ daily use; topical retinoid (tretinoin 0.025-0.05% — turns over stratum corneum, improves peel penetration, reduces PIH risk); hydroquinone 4% (melanocyte inhibition — reduces PIH risk; discontinued 1-2 weeks before peel); azelaic acid (alternative/adjunct melanocyte inhibitor); vitamin C serum (antioxidant; melanocyte modulation)',
    importance: 'Pre-treatment "primes" the skin by turning over the epidermis (retinoid), reducing melanocyte reactivity (hydroquinone, azelaic acid), and establishing a rigorous sun protection habit; without pre-treatment, PIH risk after peels in dark skin is substantially higher'
  }
};

export const LASER_ETHNIC_SKIN = {
  overview: 'Laser treatment of ethnic skin requires specific knowledge of laser-tissue interaction in melanin-rich skin; incorrect laser selection causes PIH, hypopigmentation, burns, and scarring; all lasers carry higher risk in darker skin types, but many are safely used by experienced practitioners with appropriate settings, wavelengths, and cooling',
  laserPhysics: 'Lasers work by selective photothermolysis: the laser targets a chromophore (melanin, haemoglobin, water, tattoo ink) that preferentially absorbs the laser wavelength; heat is generated in the target and causes controlled damage; in darker skin, epidermal melanin is an unintended chromophore that competes with the target, absorbing energy meant for the target and causing thermal injury to the epidermis',
  safeLasers: {
    ndYag: {
      name: 'Nd:YAG Laser (1064nm)',
      mechanism: 'Long pulsed Nd:YAG: 1064nm wavelength; at this wavelength, melanin absorption is significantly lower than at shorter wavelengths (e.g. 532nm, 694nm); the longer wavelength penetrates deeper with less epidermal melanin absorption; Q-switched Nd:YAG: extremely short pulse (nanoseconds); used for pigmented lesions and tattoo removal',
      ethnicSafety: 'The SAFEST laser for dark skin types (Fitzpatrick IV-VI); considered the gold standard for laser hair removal in dark skin; the 1064nm wavelength minimises epidermal melanin targeting relative to dermal targets; with appropriate cooling and settings, it can treat hair, pigmented lesions, and vascular conditions in dark skin',
      uses: 'Hair removal (all skin types including VI); tattoo removal (especially for dark skin); certain pigmented lesions; photorejuvenation with toning protocols; PIQO4 and PicoSure Pro are pico-second Nd:YAG variants with additional safety profiles'
    },
    diodeLaser: {
      name: 'Diode Laser (800-810nm)',
      mechanism: '800-810nm wavelength; melanin absorption intermediate between alexandrite and Nd:YAG',
      ethnicSafety: 'Can be used safely in Fitzpatrick IV-V with appropriate settings and cooling (dynamic cooling device — DCD, or contact cooling); requires longer pulse widths and lower fluence in darker skin to avoid epidermal injury; CAUTION: higher risk than Nd:YAG in Fitzpatrick V-VI; requires significant experience',
      uses: 'Hair removal in Fitzpatrick I-V (cautious use in V; generally not recommended for VI)'
    },
    fractionalNonAblative: {
      name: 'Fractional Non-Ablative Lasers (1540nm, 1550nm, 1927nm)',
      examples: 'Fraxel Restore (1550nm); Clear + Brilliant (1440nm or 1927nm); ResurFX',
      mechanism: 'Fractional photothermolysis: creates microscopic columns of thermal injury (MTZs — microthermal treatment zones) surrounded by untreated skin; the islands of intact skin allow rapid healing; non-ablative means the epidermis is not removed — thermal injury is in the dermis',
      ethnicSafety: 'SAFER than fully ablative fractional lasers for dark skin; the untreated islands allow faster healing and reduce PIH risk; 1550nm Fraxel has been studied and used in Fitzpatrick IV-VI with good results for acne scars and melasma when combined with pre-treatment protocol; requires conservative settings, lower energy density, and proper cooling',
      uses: 'Acne scars (rolling and boxcar scars — less effective for ice-pick); melasma (controversially — some practitioners advocate, others do not); texture improvement; fine lines'
    },
    picosecondLasers: {
      name: 'Picosecond Lasers',
      examples: 'PicoSure (755nm alexandrite); PicoWay (532nm, 1064nm); PIQO4 (1064nm)',
      mechanism: 'Extremely short pulse duration (picoseconds = 10⁻¹² seconds vs nanoseconds = 10⁻⁹ seconds in Q-switched lasers); shorter pulses = less heat generated = less thermal collateral damage; primarily work through photomechanical (pressure wave) rather than photothermal mechanisms',
      ethnicSafety: '1064nm picosecond (PicoWay 1064nm, PIQO4): appropriate for dark skin with lower thermal injury risk; Picosecond 755nm alexandrite: requires significant caution in Fitzpatrick IV-VI; PIH risk exists but is lower than Q-switched 755nm due to shorter pulse duration',
      uses: 'Tattoo removal (most effective for difficult colours); pigmented lesions; skin toning; acne scars (with diffractive lens array handpieces)'
    }
  },
  lasersCaution: {
    alexandrite: {
      name: 'Alexandrite Laser (755nm)',
      ethnicSafety: 'AVOID in Fitzpatrick V-VI; high melanin absorption at 755nm causes significant epidermal injury in dark skin; acceptable in Fitzpatrick I-IV with appropriate settings; replaced by Nd:YAG for hair removal in dark skin types'
    },
    rubyLaser: {
      name: 'Ruby Laser (694nm)',
      ethnicSafety: 'AVOID in dark skin types; highest melanin absorption coefficient of common laser wavelengths; significant risk of PIH, hypopigmentation, and burns in Fitzpatrick III-VI'
    },
    co2Ablative: {
      name: 'CO2 Ablative Lasers',
      ethnicSafety: 'VERY HIGH RISK in dark skin; ablative CO2 causes significant thermal injury to the full epidermis and dermis; high risk of PIH, hypopigmentation, and scarring in Fitzpatrick IV-VI; fractional CO2 is safer than fully ablative but still carries significant risk — requires highly experienced practitioners and aggressive pre-treatment and post-treatment protocols; generally not recommended for Fitzpatrick V-VI'
    }
  }
};

export const MICRONEEDLING_ETHNIC = {
  overview: 'Microneedling (collagen induction therapy — CIT) creates controlled micro-injuries to the skin using fine needles, stimulating collagen and elastin production; it has a FAVOURABLE SAFETY PROFILE in darker skin types compared to laser treatments because it does not use energy/heat that targets melanin — it is considered colour-blind',
  mechanism: 'Fine needles (0.25-2.5mm depth in professional devices; 0.25-0.5mm in home rollers) puncture the skin; triggers the wound healing cascade: platelet activation → growth factor release → fibroblast activation → collagen and elastin synthesis; no chromophore targeting = lower theoretical risk of PIH compared to energy-based devices',
  devices: {
    professional: 'Professional microneedling devices: Dermapen 4; Skinpen (the only FDA-cleared microneedling device); Morpheus8 (radiofrequency microneedling — adds RF energy); recommended needle length for professional treatment: 0.5-1.5mm for face; 1.5-2mm for body scars',
    radiofrequencyMicroneedling: {
      name: 'Radiofrequency (RF) Microneedling',
      devices: 'Morpheus8; Potenza; Genius; Secret RF',
      mechanism: 'Combines microneedling with radiofrequency energy delivered through the needles; the RF energy is delivered at depth (past the epidermis) avoiding epidermal melanin; particularly effective for skin tightening, acne scars, and body tightening',
      ethnicSafety: 'RF microneedling is considered safer for dark skin than purely light-based or laser treatments because the RF energy is not melanin-selective; insulated needles deliver RF past the melanin-rich epidermis to the dermis; Morpheus8 has published studies in Fitzpatrick IV-VI demonstrating safety and efficacy; some risk of PIH exists — appropriate settings and experience required'
    }
  },
  ethnicBenefits: 'Microneedling has been studied specifically in darker skin types with good safety and efficacy results; effective for: acne scars (particularly atrophic scars — rolling and boxcar — less effective for ice-pick); hyperpigmentation and PIH; melasma (microneedling of topical tyrosinase inhibitors improves melasma treatment); stretch marks; general skin quality improvement',
  prp: {
    name: 'Microneedling with PRP (Platelet-Rich Plasma)',
    overview: 'PRP is obtained by drawing the patient\'s blood, centrifuging to concentrate platelets and growth factors, then applying to the skin during or after microneedling; the growth factors in PRP (VEGF, PDGF, TGF-β, EGF, IGF) may enhance the collagen stimulation from microneedling',
    ethnicSafety: 'PRP is autologous (the patient\'s own blood) and has no melanin interaction concerns; evidence base is growing; studies in South Asian and African American skin populations show safety and efficacy; particularly studied for acne scars and hair loss (when injected into the scalp for alopecia areata and AGA)'
  }
};

export const INJECTABLES_ETHNIC = {
  botox: {
    name: 'Botulinum Toxin (Botox, Dysport, Xeomin, Daxi)',
    mechanism: 'Blocks acetylcholine release at the neuromuscular junction → temporary muscle paralysis → prevention of dynamic wrinkle formation; effects last 3-4 months typically',
    ethnicConsiderations: 'No colour-related safety concerns; dosing differences: East Asian patients may metabolise botulinum toxin differently and may need lower doses for certain muscle groups; Black and Latino patients may have stronger masseter muscles (jaw clenching — bruxism) requiring higher doses for masseter slimming; darker skin types age differently (photoageing less prominent; structural and volume changes more significant) — treatment goals differ',
    ethnicUses: 'Dynamic wrinkles (forehead, glabella, crow\'s feet); masseter slimming (particularly requested in East Asian communities where square jawline reduction is desired); brow lift; gummy smile; neck bands; excessive sweating (hyperhidrosis); migraine prevention; TMJ/bruxism'
  },
  fillers: {
    name: 'Dermal Fillers (Hyaluronic Acid, CaHA, PLLA)',
    types: {
      ha: 'Hyaluronic acid fillers (Juvederm, Restylane, Teosyal, Belotero): most popular; reversible with hyaluronidase enzyme; natural (HA is present in the body); various cross-linking for different lifetimes (6-18 months)',
      caha: 'Calcium hydroxyapatite (Radiesse): longer-lasting (12-18 months); biostimulator (stimulates collagen production in addition to providing volume)',
      plla: 'Poly-L-lactic acid (Sculptra): biostimulator only; no immediate volume; stimulates own collagen production gradually over 3-4 months; results last 2+ years; particularly popular for body areas and volume restoration'
    },
    ethnicConsiderations: 'Volume loss patterns differ by ethnicity: East Asian faces maintain volume longer but experience specific deflation in mid-face and temporal hollowing; South Asian faces experience early jowling and tear trough hollowing; Black and Afro-Caribbean faces retain youthfulness longer overall but experience specific deflation patterns in the lateral cheeks and temples; Latina faces may experience early nasolabial fold deepening; fillers must be placed understanding ethnic facial anatomy to look natural and avoid the "overfilled" appearance from applying a single aesthetic ideal across all ethnic groups',
    vascularComplications: 'The most serious filler complication is vascular occlusion (blocking blood vessels → tissue necrosis); danger areas: glabella (supratrochlear artery), nose (dorsal nasal artery), nasolabial fold (angular artery); blindness is the most feared complication from filler migration to the ophthalmic artery; ethnic anatomical variation means arterial positions vary between populations; injectors must understand the anatomical variation in ethnic faces; hyaluronidase emergency reversal kit must be available for all HA filler procedures'
  }
};

export const ETHNIC_TREATMENT_GUIDES = {
  'west-african': {
    community: 'West African (and West African diaspora)',
    fitzpatrickRange: 'Predominantly Fitzpatrick V-VI',
    priorityConcerns: 'PIH (top priority); CCCA (requires dermatologic management, not cosmetic treatment); hyperpigmentation; skin tone evening; acne scarring',
    recommendedTreatments: 'Mandelic or salicylic acid peels for acne and mild PIH; Nd:YAG 1064nm for all laser needs; RF microneedling (Morpheus8) for acne scars and skin tightening; tranexamic acid IV or IM (glutathione infusions for skin brightening are popular but evidence is limited and safety concerns exist — particularly with IV glutathione; tranexamic acid has better evidence for melasma/hyperpigmentation); hydroquinone-based brightening protocols under dermatological supervision',
    avoidOrCaution: 'Deep peels (phenol); alexandrite or ruby lasers; fully ablative CO2 laser; ablative fractional lasers require extreme caution and experienced practitioners only',
    culturalNote: 'IV skin brightening treatments (glutathione infusions) are extremely popular in West Africa and West African diaspora communities (particularly UK West African community); the demand is driven by complex historical, cultural, and societal colourism pressures; the safety evidence for IV glutathione for skin lightening is very limited and there are real safety concerns; practitioners should be honest about the evidence and recommend evidence-based alternatives'
  },
  'south-asian': {
    community: 'South Asian',
    fitzpatrickRange: 'Predominantly Fitzpatrick III-V',
    priorityConcerns: 'Melasma (extremely prevalent — up to 40% of South Asian women; driven by UV, hormonal factors, and PCOS); PIH; acne and acne scars; hair removal (PCOS-associated hirsutism)',
    recommendedTreatments: 'Glycolic acid 20-35% peels with 4-6 week hydroquinone pre-treatment for melasma; TCA CROSS for ice-pick scars; Q-switched or picosecond Nd:YAG for pigmentation; RF microneedling for acne scars; Nd:YAG laser hair removal for hirsutism; topical triple combination (hydroquinone + tretinoin + corticosteroid) for melasma; oral tranexamic acid (250mg BD) for melasma — well-studied, effective, evidence-based',
    melasmaNote: 'South Asian melasma is one of the most treatment-resistant conditions in dermatology; combination approach is most effective: strict sun protection + topical agents + oral tranexamic acid + carefully selected peels or laser; recurrence after any treatment without maintenance and sun protection is almost universal; managing patient expectations is critical',
    avoidOrCaution: 'Alexandrite laser (use with caution in Fitzpatrick IV+); high-concentration TCA peels without significant expertise; avoid fractional ablative CO2 in Fitzpatrick V',
    culturalNote: 'PCOS-related hair concerns (hirsutism — facial hair; hair loss — androgenetic alopecia) are extremely prevalent and significantly impact quality of life in South Asian women; PCOS treatment (metformin, spironolactone, inositol) addresses root causes alongside cosmetic hair removal treatments'
  },
  caribbean: {
    community: 'Caribbean',
    fitzpatrickRange: 'Wide range from Fitzpatrick II-III (lighter-skinned communities) to V-VI (Afro-Caribbean)',
    priorityConcerns: 'Significant diversity by heritage; Afro-Caribbean: PIH, acne scars, traction alopecia, CCCA; mixed-heritage Caribbean: melasma, sun damage, PIH; European-heritage Caribbean: photoageing, sun damage (high UV exposure throughout life)',
    recommendedTreatments: 'For Afro-Caribbean (Fitzpatrick V-VI): same as West African recommendations; for mixed-heritage (Fitzpatrick III-IV): carefully selected peels (glycolic, mandelic, TCA 15-20%); Q-switched or picosecond Nd:YAG; RF microneedling for scars; for European-heritage Caribbean (Fitzpatrick I-III): wider range of laser and peel options',
    avoidOrCaution: 'Afro-Caribbean: same contraindications as West African above; avoid practitioners without specific experience in ethnic skin',
    culturalNote: 'Caribbean communities span all Fitzpatrick types due to the region\'s diverse genetic heritage (indigenous Taino and Carib; West African from the Trans-Atlantic slave trade; European colonial heritage; South and East Asian from indentured labour); treatments must be tailored to the individual\'s actual Fitzpatrick type, not their cultural background alone'
  },
  arab: {
    community: 'Arab',
    fitzpatrickRange: 'Predominantly Fitzpatrick III-IV; North African Arab communities may be V',
    priorityConcerns: 'Melasma (prevalent particularly in Gulf Arab women — driven by hormonal factors and sun exposure); PIH; acne; laser hair removal (significant demand; hirsutism in PCOS); facial rejuvenation (fillers and botulinum toxin significant market in Gulf states)',
    recommendedTreatments: 'For Fitzpatrick III-IV: wider range of options than darker skin types; glycolic and TCA peels with pre-treatment protocol; Q-switched and picosecond Nd:YAG; long-pulsed Nd:YAG for hair removal; RF microneedling for scars and tightening; hyaluronic acid fillers (significant demand for lip augmentation, cheek volume, and nasal shaping in Arab aesthetic practices); botulinum toxin; oral tranexamic acid for melasma',
    avoidOrCaution: 'Phenol peels; alexandrite laser in Fitzpatrick IV-V Arab skin; high-fluence alexandrite for hair removal',
    culturalNote: 'Gulf Arab aesthetic trends heavily influenced by social media; there is significant demand for procedures among both women (in the privacy of women-only clinics and spas — important cultural consideration for clinic design) and men in Arab markets; the niqab and abaya tradition means face and hands are particularly important aesthetic areas in some communities'
  },
  latina: {
    community: 'Latina/Latin American',
    fitzpatrickRange: 'Very wide range: Fitzpatrick I-II (European-heritage Argentina, Uruguay); III-IV (mixed mestizo heritage — the majority); V-VI (Afro-Latina; Indigenous communities)',
    priorityConcerns: 'Melasma (one of the highest global prevalences — 8.8% of US Latinas; driven by oral contraceptive use, sun exposure, and genetic predisposition); PIH; acne; sun damage (particularly Fitzpatrick I-III Latina skin with high UV lifetime exposure)',
    recommendedTreatments: 'For Fitzpatrick III-IV (most common): glycolic acid peels 20-35% with pre-treatment protocol; TCA 15-25% with pre-treatment protocol; Q-switched Nd:YAG for pigmentation; oral tranexamic acid for melasma (well-studied in Latina populations); fillers for nasolabial folds, lips, and cheek volume; botulinum toxin for dynamic wrinkles',
    avoidOrCaution: 'Phenol peels in Fitzpatrick III-VI; alexandrite laser in Fitzpatrick IV-V; deep ablative procedures without experienced practitioners',
    culturalNote: 'Melasma in Latina communities is sometimes called "the mask of pregnancy" (chloasma) but persists significantly outside pregnancy due to OCP use and sun exposure; sun protection is crucial but historically lower in communities with perceived sun tolerance; cultural emphasis on "natural beauty" sometimes creates barriers to open discussion of professional treatments — patient education about evidence-based options is important'
  },
  'east-asian': {
    community: 'East Asian',
    fitzpatrickRange: 'Predominantly Fitzpatrick III-IV; Southeast Asian communities may be IV-V',
    priorityConcerns: 'Photoageing (sun damage — particularly in East Asian communities with high lifetime UV exposure); post-inflammatory hyperpigmentation from acne; melasma; pigmentation spots (solar lentigines, seborrhoeic keratoses appear earlier than in Fitzpatrick I-II skin); pore size; skin texture and luminosity (glass skin goal)',
    recommendedTreatments: 'Japan and Korea are global leaders in non-invasive aesthetic medicine — many advanced treatments originate from or are most refined in East Asian practice; Q-switched Nd:YAG toning (low-fluence multiple-pass Nd:YAG — the "laser toning" or "Korean toning" technique for PIH, melasma, and brightening — developed and popularised in Korea); picosecond lasers; fractional non-ablative (Fraxel 1550nm); clear + brilliant; botulinum toxin for masseter slimming (extremely popular in East Asian women for achieving oval "V-line" face shape); hyaluronic acid fillers for dorsal nose augmentation and chin projection; HIFU (high-intensity focused ultrasound — Ultherapy) for skin tightening',
    avoidOrCaution: 'High-fluence Q-switched Nd:YAG (paradoxical darkening — "rebound hyperpigmentation" — risk when using high-fluence Nd:YAG for melasma); fully ablative CO2 laser (risk of PIH in Fitzpatrick III-IV); some East Asian skin is prone to paradoxical darkening from aggressive laser treatment of melasma',
    culturalNote: 'East Asian aesthetic medicine is among the most sophisticated globally; the K-beauty and J-beauty industries have driven innovation in skincare and non-invasive treatments; "glass skin" (luminous, pore-minimised, even-toned, almost translucent-looking skin) is a defining K-beauty aesthetic goal that drives treatment choices; a significant portion of East Asian patients seek "westernisation" of features (double eyelid surgery — blepharoplasty; dorsal nose augmentation) while others specifically seek treatments preserving and celebrating East Asian facial features — practitioners must understand cultural context of aesthetic requests'
  },
  'east-african': {
    community: 'East African',
    fitzpatrickRange: 'Predominantly Fitzpatrick V-VI; some North-East African communities (Somalia, Eritrean highland communities) may be IV-V',
    priorityConcerns: 'Similar to West African in terms of PIH risk; CCCA (requires dermatologic management); acne scarring; keloid scars; traction alopecia',
    recommendedTreatments: 'Superficial peels (mandelic, salicylic) for acne and mild PIH; Nd:YAG 1064nm for all laser needs; RF microneedling for acne scars; intralesional corticosteroid (triamcinolone) for keloids; pressure therapy and silicone sheeting for hypertrophic scars; PRP for hair loss; professional consultation before any energy-based treatment',
    avoidOrCaution: 'All same contraindications as West African; particular caution with keloid risk — any procedure breaching the skin barrier requires prior assessment of personal and family keloid history',
    culturalNote: 'Access to aesthetic medicine in the East African diaspora varies significantly; East African communities are rapidly growing in Europe and North America (Minneapolis has the largest Somali community outside East Africa; large Ethiopian and Eritrean communities in Washington DC, London, Stockholm); access to practitioners with expertise in very dark skin remains limited in many of these locations; telemedicine consultations with specialist dermatologists for dark skin are an emerging solution'
  },
  'south-african': {
    community: 'South African',
    fitzpatrickRange: 'Wide range: Black South African communities Fitzpatrick V-VI; Cape Coloured communities III-V; Afrikaner and Anglo communities Fitzpatrick I-III',
    priorityConcerns: 'Black South African: CCCA (highest priority — dermatologic management); PIH; acne scars; keloids; traction alopecia; White South African: significant photoageing from lifetime high UV exposure (South Africa near ozone hole — September-November ozone depletion increases UV 30%+); actinic keratoses (premalignant from sun damage); melanoma risk',
    recommendedTreatments: 'Black South African (Fitzpatrick V-VI): mandelic/salicylic peels; Nd:YAG 1064nm; RF microneedling; keloid management (intralesional triamcinolone; silicone; fractionated CO2 in very experienced hands for keloid treatment — paradoxically, carefully applied fractional CO2 into the keloid itself can help some keloids); White South African (Fitzpatrick I-III): wider range including ablative fractional lasers, IPL for pigmentation, medium-depth peels for solar damage; skin cancer screening priority',
    avoidOrCaution: 'Black South African skin: all contraindications as per West African; White South African: excessive sun exposure continues to cause ongoing skin damage — sun protection education alongside aesthetic treatments',
    culturalNote: 'South Africa\'s apartheid legacy created a stratified access to healthcare including aesthetic medicine; predominantly white practitioners historically dominated South African aesthetic medicine with limited expertise in dark skin; this is changing rapidly; the growing South African dermatology community is producing world-class research on conditions affecting darker skin (particularly CCCA and skin cancer in Black Africans, which presents differently from the photoageing-driven melanoma of White Africans)'
  },
  'black-american': {
    community: 'Black American',
    fitzpatrickRange: 'Predominantly Fitzpatrick V-VI with some IV',
    priorityConcerns: 'PIH (most common cosmetic concern among Black American patients); acne and acne scars; CCCA; traction alopecia; pseudofolliculitis barbae (razor bumps — PFB); ingrown hairs; keloids; hyperpigmentation',
    recommendedTreatments: 'Salicylic acid peels (most researched peel in African American skin); glycolic acid 20-35% with pre-treatment protocol; Q-switched and picosecond Nd:YAG for PIH and pigmentation; RF microneedling for acne scars; Nd:YAG long-pulsed for laser hair removal and PFB treatment; PFB management: single-blade razors, shaving cream, benzoyl peroxide, topical retinoids, eflornithine cream, laser hair removal (Nd:YAG — reduces PFB significantly); intralesional triamcinolone for keloids',
    pfb: 'Pseudofolliculitis Barbae (razor bumps/ingrown hairs): affects up to 83% of Black men who shave; caused by the re-entry of the tightly curved hair shaft back into the skin after shaving; triggers inflammation mimicking acne and causes PIH; best long-term solution is Nd:YAG laser hair removal (reduces hair shaft curvature and density); interim management: single-blade safety razor; not shaving against the grain; chemical depilatories (though some irritating); electric clippers leaving stubble',
    avoidOrCaution: 'All same contraindications as West African; particular caution: practitioners who do not specifically train and focus on darker skin types frequently cause harm in Black patients — it is appropriate and important for Black patients to screen practitioners for specific experience and training in Fitzpatrick V-VI skin',
    culturalNote: 'Historical medical racism in the US has created legitimate distrust among Black patients of medical and aesthetic providers; the natural hair movement, CROWN Act advocacy, and growing Black-owned skincare and aesthetic brand landscape reflect a community asserting autonomy over beauty standards and treatment choices; many Black dermatologists and aesthetic practitioners are specifically centring Black skin in their practices and education (Dr Corey Campbell, Dr Michelle Henry, Dr Heather Woolery-Lloyd, Dr Adeline Kikam who built @brownskinderm with millions of followers)'
  }
};

export function getProfessionalTreatmentGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_TREATMENT_GUIDES['west-african'],
    'south-asian': ETHNIC_TREATMENT_GUIDES['south-asian'],
    caribbean: ETHNIC_TREATMENT_GUIDES.caribbean,
    arab: ETHNIC_TREATMENT_GUIDES.arab,
    latina: ETHNIC_TREATMENT_GUIDES.latina,
    'east-asian': ETHNIC_TREATMENT_GUIDES['east-asian'],
    'east-african': ETHNIC_TREATMENT_GUIDES['east-african'],
    'south-african': ETHNIC_TREATMENT_GUIDES['south-african'],
    'black-american': ETHNIC_TREATMENT_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

export const PROFESSIONAL_TREATMENTS_STATS = {
  moduleId: 'professional_treatments_ethnic',
  version: '1.0.0',
  topics: ['chemical peels ethnic skin', 'laser ethnic skin Nd:YAG 1064nm', 'microneedling RF Morpheus8 dark skin', 'PIH post-inflammatory hyperpigmentation', 'keloid scar darker skin', 'melasma tranexamic acid South Asian Latina', 'Fitzpatrick scale skin types', 'CCCA central centrifugal cicatricial alopecia', 'pseudofolliculitis barbae razor bumps Black men', 'picosecond laser pigmentation', 'botulinum toxin masseter East Asian', 'traction alopecia professional treatment'],
  communitiesSupported: 9,
  keyFacts: [
    'The Nd:YAG 1064nm laser is the safest laser for dark skin types (Fitzpatrick IV-VI) because at 1064nm, melanin absorption is significantly lower than at shorter wavelengths (e.g. 532nm alexandrite, 694nm ruby), minimising the risk of the laser\'s energy being absorbed by epidermal melanin rather than the intended target; it is the gold standard for laser hair removal in all dark skin types including Fitzpatrick VI',
    'Post-Inflammatory Hyperpigmentation (PIH) is the most significant risk in professional treatments for darker skin (Fitzpatrick IV-VI); any inflammation or injury to the skin triggers melanocyte overactivation; this means the treatment intended to improve skin can paradoxically cause the very problem it aimed to address; pre-treatment priming for 4-6 weeks with retinoids, hydroquinone, and rigorous sun protection significantly reduces this risk',
    'Microneedling (collagen induction therapy) has a favourable safety profile in darker skin types compared to laser treatments because it does not use energy that targets melanin — it is considered colour-blind; RF microneedling (Morpheus8, Potenza, Secret RF) adds radiofrequency energy delivered through insulated needles past the melanin-rich epidermis into the dermis, further reducing epidermal pigmentation risk while treating acne scars, skin laxity, and texture',
    'Pseudofolliculitis Barbae (PFB — razor bumps) affects up to 83% of Black men who shave, caused by the re-entry of the tightly curved hair shaft back into the skin after cutting, triggering inflammation and PIH; the best long-term solution is Nd:YAG laser hair removal which reduces hair shaft curvature and density; single-blade safety razors, shaving with the grain, and not shaving too closely are interim management strategies'
  ]
};
