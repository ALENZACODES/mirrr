/**
 * MIRRR — Aging Skin Multicultural Science Guide
 * Science of skin aging by Fitzpatrick type, skin-of-colour biology, anti-aging ingredients,
 * traditional longevity beauty practices across 9 ethnic communities.
 *
 * DIFFERENTIATED from aging_gracefully_ethnic_guide.js:
 * This module emphasizes the BIOLOGY of aging in different skin types, evidence-based
 * anti-aging ingredients, Fitzpatrick-type-specific protocols, and the science behind
 * traditional longevity ingredients. The other file focuses on cultural attitudes and
 * philosophy of graceful aging.
 */

// ============================================================
// UNIVERSAL SKIN AGING SCIENCE
// ============================================================

export const UNIVERSAL_SKIN_AGING = {
  overview: `Skin aging is driven by two overlapping mechanisms: intrinsic (chronological,
  genetically programmed) and extrinsic (environmental, primarily UV radiation). The ratio
  of these two processes varies significantly by Fitzpatrick skin type, ethnic background,
  geographic ancestry, and lifestyle. Understanding which process dominates for your skin
  type determines which anti-aging interventions will have the greatest impact.`,

  intrinsicAging: {
    definition: 'Chronological aging driven by genetics and time; universal across all ethnicities',
    collagenDecline: {
      
      
      menopausalAcceleration: 'Estrogen decline at menopause speeds up collagen loss, especially in the first years after',
      mechanism: 'Fibroblasts reduce Type I and Type III collagen synthesis; matrix metalloproteinases (MMPs) simultaneously increase collagen degradation',
      glycation: 'Advanced glycation end products (AGEs) from dietary sugars crosslink collagen fibers — creating stiff, yellowed, less elastic matrix',
    },
    elastin: {
      function: 'Elastin proteins provide skin recoil; unlike collagen, adult human skin cannot regenerate damaged elastin',
      aging: 'Fragmentation and calcification of elastin fibers over time; skin loses snap-back quality and sags',
      clinical: 'No topical ingredient replaces lost elastin; prevention through SPF and antioxidants is the only effective strategy',
    },
    hyaluronicAcid: {
      role: 'Hyaluronic acid (HA) holds up to 1000x its weight in water; major contributor to skin volume and plumpness',
      decline: 'HA concentration in skin decreases progressively from age 25; by 60, significant dermal HA depletion occurs',
      topicalLimitations: 'Topical HA cannot penetrate to the dermis due to molecular size; provides surface-level hydration only',
      injectable: 'Injectable HA fillers temporarily restore dermal volume; HA-based fillers are the most evidence-backed volumizing intervention',
    },
    cellTurnover: {
      baseline: 'Epidermal cell turnover cycle: approximately 28 days in young adults',
      aged: 'Turnover slows to 45-60+ days in older adults; corneocytes accumulate, causing dullness and uneven texture',
      intervention: 'Retinoids, alpha-hydroxy acids (AHAs), beta-hydroxy acids (BHAs): accelerate turnover toward youthful rates',
    },
    hormonal: {
      estrogen: 'Estrogen maintains collagen, hydration, and skin thickness; its decline at menopause is the single largest driver of rapid skin change in women',
      testosterone: 'Testosterone supports skin thickness and sebum production; men age more slowly initially, with acceleration post-60',
      HRT: 'Hormone replacement therapy (HRT): has strong evidence for reducing menopausal skin aging but systemic considerations apply',
    },
    mitochondrial: {
      description: 'Mitochondrial DNA accumulates damage with age; cellular energy production declines',
      skinEffect: 'Reduced cellular energy → slower repair, slower collagen synthesis, reduced skin barrier function',
      ingredients: 'CoQ10, niacinamide, pyrroloquinoline quinone (PQQ): support mitochondrial function and cellular energy',
    },
  },

  extrinsicAging: {
    UV: {
      mechanism: 'UVB (290-320nm): primarily epidermal damage, sunburn, DNA mutation; UVA (320-400nm): penetrates dermis, degrades collagen and elastin, causes photoaging',
      photoaging: 'Cumulative UV damage causes photoaging: deep wrinkles, irregular pigmentation, leathery texture, telangiectasias — distinct from and additive to chronological aging',
      melaninProtection: 'Melanin (eumelanin specifically) in darker skin absorbs and scatters UV; it gives meaningful but incomplete protection',
      darkSkinMisconception: 'Melanin provides meaningful but not complete UV protection; photoaging occurs in dark skin, appears later and as pigmentation changes rather than early wrinkling',
      prevention: 'Daily SPF 30-50 broad-spectrum: the single most evidence-backed anti-aging intervention for any skin tone',
    },
    pollution: {
      particulates: 'PM2.5 particles generate free radicals, penetrate skin barrier, and trigger inflammatory cascades causing collagen degradation',
      ozone: 'Ground-level ozone depletes antioxidant reserves in skin; depletes vitamin E and disrupts barrier lipids',
      metals: 'Heavy metal deposition (nickel, chromium) from pollution: catalyzes oxidative reactions in skin; causes hyperpigmentation in darker skin tones',
      protection: 'Antioxidant serums (vitamin C, vitamin E, ferulic acid, niacinamide): critical for urban dwellers; form a sacrificial antioxidant layer',
    },
    lifestyle: {
      smoking: 'Smoking causes characteristic "smoker\'s face": deep perioral lines, leathery texture, sallowness from reduced skin oxygenation and collagen-damaging free radicals',
      alcohol: 'Chronic alcohol: triggers repeated inflammatory events, disrupts sleep, dehydrates, increases cortisol — all accelerating skin aging',
      diet: 'High-glycemic diets: drive glycation and AGE formation; Mediterranean, antioxidant-rich diets associate with measurably slower photoaging in studies',
      sleep: 'During deep sleep, growth hormone peaks and drives skin repair; chronic sleep debt accelerates skin aging by impairing this nightly repair cycle',
      stress: 'Chronic psychological stress elevates cortisol; cortisol breaks down collagen, impairs skin barrier, increases inflammation (inflammaging)',
    },
  },

  fitzpatrickAndAging: {
    overview: `The Fitzpatrick scale (I-VI) classifies skin by UV response, but it also broadly
    correlates with melanin content and how aging manifests visually. This is a critical
    distinction: different skin types age the same way biologically, but the visible signs
    appear in different order and at different times.`,
    typeIII_IV: {
      description: 'Medium skin tones (Fitzpatrick III-IV): balanced mix of early wrinkles and pigmentation changes',
      aging: 'Both wrinkle formation and uneven pigmentation occur; sun sensitivity moderate',
    },
    typeI_II: {
      description: 'Very fair to fair skin (Fitzpatrick I-II): greatest photoaging risk; wrinkles and volume loss dominate',
      aging: 'Wrinkles, sun spots, broken capillaries appear earliest and most prominently; melanoma risk highest',
      focus: 'Anti-aging focus: retinoids for texture/wrinkles, SPF above all, antioxidants, fillers/botox',
    },
    typeV_VI: {
      description: 'Deep skin tones (Fitzpatrick V-VI): melanin provides significant photoprotection; wrinkles appear later — often a decade or more later',
      aging: 'Wrinkles delayed; primary visible aging = hyperpigmentation, uneven tone, loss of subcutaneous fat, loss of elasticity in lower face/neck',
      blackDontCrack: '"Black don\'t crack" has a basis: higher melanin delays sun-driven wrinkles. But it creates a clinical blind spot — practitioners less trained in recognizing aging signs in dark skin',
      focus: 'Anti-aging focus: hyperpigmentation prevention/treatment, barrier health, peptides for elasticity, SPF (always — melanin helps but doesn\'t replace SPF)',
    },
  },

  evidenceHierarchy: {
    overview: 'Anti-aging ingredients range from exceptionally well-evidenced to purely marketing claims. This hierarchy helps navigate the crowded market.',
    tierOne: {
      label: 'Tier 1 — Strong clinical evidence (RCTs, dermatology consensus)',
      ingredients: [
        { name: 'Broad-spectrum SPF 30-50' },
        { name: 'Retinoids (retinol, tretinoin, adapalene)' },
        { name: 'Vitamin C (L-ascorbic acid, 10-20%)' },
        { name: 'Niacinamide (3-10%)' },
        { name: 'Peptides (Matrixyl 3000, copper peptides, argireline)' },
        { name: 'AHAs (glycolic, lactic acid)' },
        { name: 'Hyaluronic acid (topical)' },
      ],
    },
    tierTwo: {
      label: 'Tier 2 — Promising but less definitive evidence',
      ingredients: [
        { name: 'Bakuchiol' },
        { name: 'Resveratrol' },
        { name: 'CoQ10 (ubiquinone)' },
        { name: 'Growth factors (EGF, TGF-β)' },
        { name: 'Ceramides' },
      ],
    },
    tierThree: {
      label: 'Tier 3 — Insufficient or only in vitro evidence (use cautiously)',
      ingredients: [
        { name: 'Most "natural" botanicals at typical retail concentrations' },
        { name: 'Gold and precious metals in cosmetics' },
        { name: 'Collagen supplements (oral)' },
        { name: 'Stem cell extracts (plant-derived)' },
      ],
    },
  },

  retinoidProtocolsByType: {
    overview: 'Retinoids are the best-evidenced anti-aging ingredient, but application protocol must be adapted to skin tone to avoid irritation and post-inflammatory hyperpigmentation (PIH).',
    lightSkin: {
      fitzpatrick: 'I-III',
      startingStrength: '0.025-0.05% retinol or prescription 0.025% tretinoin',
      frequency: 'Every other night for 4 weeks; increase to nightly if tolerated',
      notes: 'Primary risk: dryness, peeling, irritation; SPF essential; can tolerate higher concentrations more quickly',
    },
    mediumSkin: {
      fitzpatrick: 'III-IV',
      startingStrength: '0.025% retinol; proceed slowly',
      frequency: 'Twice weekly for 6-8 weeks; monitor for PIH before increasing',
      notes: 'PIH risk increases; any irritation or darkening = reduce frequency immediately; buffer method recommended (apply over moisturizer)',
    },
    darkSkin: {
      fitzpatrick: 'V-VI',
      startingStrength: '0.01-0.025% retinol only; lowest available',
      frequency: 'Once weekly for 4-6 weeks; increase very gradually over months',
      notes: 'PIH risk is significant; even mild inflammation can cause lasting hyperpigmentation; always buffer in moisturizer; strong SPF non-negotiable; niacinamide alongside helps prevent PIH',
      specialNote: 'Paradox: dark skin needs retinoids for hyperpigmentation (a primary aging sign) but is more sensitive to retinoid-induced PIH — go slow, go low, and always protect',
    },
  },

  sleepAndSkinAging: {
    science: 'During slow-wave (deep) sleep, the pituitary gland releases growth hormone (GH), which drives cellular repair and collagen synthesis. The epidermal barrier also repairs transepidermal water loss (TEWL) most efficiently during sleep.',
    cortisol: 'Sleep deprivation elevates cortisol, which degrades collagen via upregulation of matrix metalloproteinases (MMPs). Chronic sleep debt = chronic collagen breakdown signal.',
    circadian: 'Skin cells have their own circadian clocks; key DNA repair enzymes peak at night; core temperature drop during sleep activates repair pathways',
    nightSkincare: 'Night is optimal for actives (retinoids, AHAs, peptides): repair pathways are active, no UV exposure, and skin temperature and blood flow aid penetration',
    quantity: '7-9 hours optimal for skin aging; even one week of 6-hour nights measurably increases cortisol and reduces skin radiance in clinical studies',
    blackout: 'Even low-level light during sleep disrupts melatonin; melatonin is a potent antioxidant and anti-aging molecule for skin repair overnight',
  },

  inflammaging: {
    definition: 'Inflammaging: the chronic, low-grade sterile inflammation that drives biological aging; distinct from acute inflammation',
    skinEffect: 'In skin, inflammaging upregulates MMPs (collagen destroyers), impairs fibroblast function, disrupts barrier, and drives hyperpigmentation in melanin-rich skin',
    drivers: ['High-glycemic diet', 'Visceral fat', 'Chronic stress', 'Poor sleep', 'Dysbiosis', 'UV exposure', 'Air pollution', 'Sedentary lifestyle'],
    interventions: ['Anti-inflammatory diet (Mediterranean, whole foods)', 'Regular aerobic exercise', 'Niacinamide (topical)', 'Green tea polyphenols', 'Omega-3 fatty acids', 'Resveratrol', 'SPF daily'],
    darkerSkinNote: 'Melanin-rich skin may be more vulnerable to inflammaging-driven hyperpigmentation; anti-inflammatory approach is particularly important',
  },
};

// ============================================================
// AGING SKIN STATISTICS
// ============================================================

// ============================================================
// ETHNIC AGING SKIN GUIDES — 9 COMMUNITIES
// ============================================================

export const ETHNIC_AGING_SKIN_GUIDES = {

  // ============================================================
  // WEST AFRICAN
  // ============================================================
  'west-african': {
    community: 'West African',
    ageingProfile: {
      overview: `"Black don't crack" has a basis. West African and sub-Saharan skin
      carries the highest density of epidermal melanin, providing the most substantial
      natural photoprotection of any skin type. Deep wrinkles from UV exposure — the dominant
      aging sign in lighter skin — tend to appear later in melanin-rich skin.
      However, this creates a clinically significant challenge: practitioners are less trained
      to recognize aging in dark skin, and the primary aging concerns (hyperpigmentation, loss
      of elasticity in the lower face and neck, subcutaneous fat redistribution) are different
      from textbook aging.`,
      primaryConcerns: [
        'Post-inflammatory hyperpigmentation (PIH) — any inflammation darkens rapidly and persistently',
        'Uneven skin tone and dark spots from sun, hormones, and injury history',
        'Loss of elasticity and firmness in the jowl, neck, and under-eye areas',
        'Ashy or dry appearance from dehydration and transepidermal water loss',
        'Dermatosis papulosa nigra (DPN) — benign but cosmetically concerning dark papules',
      ],
      lateOnset: 'Sun-driven wrinkles tend to appear later than on light skin; pigment changes are the earlier sign',
      hyperpigmentationAsAging: 'Uneven tone — rather than wrinkles — is the primary visual marker of skin aging in West African skin; this is a key distinction for treatment planning',
      subcutaneousFat: 'however, loss of this fat after 50-60 can cause more dramatic facial change',
    },
    melaninScience: {
      type: 'Melanin in dark skin is predominantly eumelanin (vs. pheomelanin in lighter skin); eumelanin is a more effective UV absorber',
      distribution: 'In Fitzpatrick VI skin, melanin is present in all epidermal layers including the stratum corneum; in light skin, it is mostly in the basal layer',
      SPFEquivalent: 'Melanin-rich skin has some built-in UV protection; enough to delay photoaging substantially but not enough to skip sunscreen',
      antioxidant: 'Melanin is itself an antioxidant — absorbs free radicals; however, UV-induced reactive oxygen species (ROS) still accumulate and cause oxidative damage',
      paradox: 'Melanin production is the skin\'s protective response to UV stress; but in dark skin, melanocytes are hyperreactive — meaning any inflammation or UV triggers excess pigment production (PIH)',
    },
    traditionalIngredients: {
      sheaButter: {
        
        antiAgingScience: 'Rich in vitamin E (tocopherols) — a potent lipid-soluble antioxidant that protects cell membranes from oxidative damage and UV-induced free radicals',
        oleanolicAcid: 'Contains oleanolic acid — inhibits tyrosinase enzyme (reduces hyperpigmentation) and has anti-inflammatory activity',
        lupeol: 'Lupeol in shea: anti-inflammatory triterpene; inhibits 5-alpha reductase; may reduce sebaceous activity that drives post-acne PIH',
        karitene: 'Karitene fraction: some UV-absorbing capacity; not a sunscreen replacement but additive protection',
        barrier: 'High concentration of stearic and oleic acids deeply replenish skin barrier; prevents dehydration-driven aging',
        traditional: 'Used by Yoruba, Igbo, Akan, and Fulani women across generations as a universal skin and body moisturizer, lip balm, and scalp treatment',
      },
      moringa: {
        
        ORAC: 'One of the highest antioxidant scores (ORAC) of any plant; zeatin (cytokinin) content may slow cellular aging',
        behenic: 'Moringa oil is 70% behenic acid — extremely stable, resistant to oxidation; acts as emollient without going rancid (anti-aging for the product itself)',
        vitaminC: 'Moringa leaf: 7x the vitamin C of oranges; vitamin C is essential for collagen synthesis and as antioxidant',
        sulfur: 'Sulfur compounds in moringa: support keratin protein structure in skin and hair',
        traditional: 'Yoruba traditional medicine uses moringa leaf paste for skin brightening and wound healing; seeds used as water purifier — now recognized as anti-inflammatory',
      },
      baobab: {
        
        vitaminC: 'Baobab fruit: highest vitamin C content of any fruit tested (approximately 6x the vitamin C of oranges)',
        omega: 'Baobab oil: high in omega-3, 6, and 9 fatty acids; supports skin barrier and reduces TEWL',
        triterpenes: 'Triterpene content: anti-inflammatory; potentially useful for PIH prevention',
        traditional: 'Used across West Africa for skin hydration; eaten as part of diet (anti-inflammatory internal effect); baobab powder in skin masks by Wolof and Hausa communities',
      },
      palmOil: {
        
        
        carotenoids: 'Beta-carotene and lycopene content: powerful antioxidants converted to vitamin A in the body (internal retinol precursor)',
        controversy: 'Environmental concerns around palm oil; red (unrefined) palm oil retains the most nutrients; used in traditional cooking as anti-aging food ingredient',
        antiAging: 'Tocotrienols have been shown to reduce oxidative stress markers and may help prevent UV-induced skin damage when consumed',
      },
    },
    traditionalPractices: {
      oilBathing: {
        practice: 'Full-body application of shea, coconut, or palm oil after bathing; a pan-West African practice from infancy',
        science: 'Locking in moisture immediately post-bathing (within 3 minutes) prevents TEWL — reduces the dehydration-driven dullness and texture that registers as aging',
      },
      duduOsun: {
        practice: 'Traditional African black soap (ose dudu in Yoruba) — made from plantain ash, shea, cocoa pod',
        science: 'Plantain ash is alkaline but buffered by the oils; provides gentle exfoliation; cocoa pod antioxidants; anti-fungal lauric acid from coconut/palm kernel',
        antiAging: 'Regular exfoliation via traditional soap maintains cell turnover as it slows with age; cocoa polyphenols provide antioxidant benefit',
      },
      longLivingCommunities: {
        igbo: 'Igbo food traditions in southeastern Nigeria: a diet rich in palm oil (tocotrienols), leafy greens, ugwu (pumpkin leaves — high in vitamins A and C)',
        ghanaian: 'Ghanaian longevity diet: kenkey, kontomire stew, palm nut soup — high in fiber, antioxidants, and anti-inflammatory compounds',
        senegalese: 'Thieboudienne (Senegalese fish and rice): omega-3-rich diet from fish; anti-inflammatory; omega-3s support collagen and reduce photoaging',
      },
    },
    modernAntiAging: {
      hyperpigmentationProtocol: 'First priority is preventing new dark spots: SPF 30-50 daily (even in dark skin — melanin doesn\'t replace SPF), avoid unnecessary inflammation, treat acne immediately',
      niacinamide: 'Niacinamide 5-10%: reduces melanin transfer to keratinocytes; reduces hyperpigmentation; anti-inflammatory; excellent for West African skin aging',
      vitaminC: 'Vitamin C 10-15% in the morning: antioxidant protection + collagen synthesis + brightening; use a stable form (ascorbyl glucoside or l-ascorbic acid)',
      retinoids: 'Start at 0.01-0.025% retinol; buffer in moisturizer; once weekly; extremely slow titration; SPF is non-negotiable alongside; niacinamide helps prevent retinoid-induced PIH',
      azelaic: 'Azelaic acid 15-20%: dual-action — reduces both PIH and breakout-driven inflammation; well-tolerated in dark skin; reduces melanin production',
      avoid: 'Hydroquinone: effective but risk of ochronosis (permanent paradoxical darkening) with long-term use in dark skin; use with medical supervision only; avoid high concentrations long-term',
    },
  },

  // ============================================================
  // SOUTH ASIAN
  // ============================================================
  'south-asian': {
    community: 'South Asian',
    ageingProfile: {
      overview: `South Asian skin is defined by significant heterogeneity — the subcontinent spans
      from fair-skinned Kashmiris (Fitzpatrick III) to very dark-skinned Tamilians and Sri Lankans
      (Fitzpatrick V-VI). On medium-to-deep skin, pigment changes often show before wrinkles:
      melasma (hormonally driven hyperpigmentation) is common, and sun-induced dark spots can appear earlier than wrinkles even in medium-toned skin.`,
      primaryConcerns: [
        'Melasma — hormonally triggered, UV-worsened hyperpigmentation',
        'Post-inflammatory hyperpigmentation (PIH) from acne, inflammation, or injury',
        'Uneven skin tone (facial hyperpigmentation vs. body skin tone differences)',
        'Hyperpigmentation-based "aging" appearing before wrinkle-based aging',
      ],
      collagenTimeline: 'wrinkles are often less prominent until 50s-60s, but uneven tone may be apparent from the 30s',
    },
    ayurvedicAntiAging: {
      rasayana: {
        definition: 'Rasayana is a dedicated branch of Ayurveda meaning "path of essence"; focuses specifically on rejuvenation, longevity, and anti-aging at cellular level',
        philosophy: 'Rasayana theory predates modern anti-aging science by 2,000+ years; aims to restore ojas (vital essence), rebuild dhatus (body tissues including skin), and slow chronological aging',
        framework: 'Skin aging in Ayurveda is primarily attributed to increased Vata dosha — dryness, thinning, looseness; and to accumulation of ama (metabolic waste) that impairs cellular renewal',
        kuti: 'Kuti praveshika rasayana: intensive rejuvenation retreats involving specialized diets, herbal preparations, and treatments; described in Charaka Samhita (circa 600 BCE)',
        modern: 'Modern phytochemistry is validating many Ayurvedic rasayana herbs: ashwagandha\'s withanolides, guduchi\'s tinosporin, amla\'s vitamin C content — all have strong modern evidence',
      },
      ashwagandha: {
        botanical: 'Withania somnifera',
        withanolides: 'Withanolides — steroidal lactones — are the primary bioactive compounds; structurally resemble human steroid hormones',
        cortisol: 'Ashwagandha reduces serum cortisol by 25-30% in RCTs; cortisol breaks down collagen; reducing it has direct anti-aging skin implications',
        
        adaptogen: 'Classified as an adaptogen: reduces chronic stress response; stress-driven skin aging mechanism (inflammaging) is reduced',
        traditional: 'Charaka Samhita prescribes ashwagandha root milk (ashwagandha ksheera) for vata-driven aging — dryness, wrinkling, weakness',
      },
      guduchi: {
        botanical: 'Tinospora cordifolia ("Giloy")',
        immunomodulation: 'Potent immunomodulator; reduces systemic inflammation — the inflammaging driver of skin aging',
        tinosporin: 'Tinosporin and berberine content: anti-inflammatory and antioxidant; reduce oxidative stress in skin cells',
        traditional: 'Charaka Samhita lists guduchi as a rasayana herb; used in pancha karma (Ayurvedic detox) to support skin renewal',
        
      },
      brahmi: {
        botanical: 'Bacopa monnieri',
        triterpeneSaponins: 'Bacosides A and B: primary bioactives; neuroprotective and anti-inflammatory',
        
        traditional: 'Used in Ayurvedic formulations for scalp and skin health; brahmi oil (brahmi in sesame or coconut oil) applied to scalp and hair for anti-aging',
        skincare: 'Topical brahmi extracts in Ayurvedic face packs: modern formulations use it for brightening and anti-aging serums',
      },
      shatavari: {
        botanical: 'Asparagus racemosus',
        phytoestrogens: 'Contains steroidal saponins including shatavarin and asparagamine; mild phytoestrogenic activity',
        estrogenicAntiAging: 'Phytoestrogens may partially compensate for estrogen decline in menopausal skin; estrogen is critical for skin collagen maintenance',
        traditional: 'Primary Ayurvedic herb for women\'s health; prescribed for perimenopause and menopause; the skin-anti-aging rationale is now supported by its phytoestrogenic content',
        clinical: 'Limited clinical studies on skin outcomes specifically; strong safety profile; used as oral supplement and in topical preparations',
      },
      amla: {
        botanical: 'Emblica officinalis (Indian Gooseberry)',
        vitaminC: 'Amla has among the highest measured vitamin C content of any plant: 600-700mg per 100g fresh weight (citrus: ~50mg/100g)',
        tannins: 'Emblicanin A and B: unique tannins that are powerful antioxidants; more stable than vitamin C at heat; chelate free metals',
        
        melanin: 'Inhibits tyrosinase; reduces melanin production; particularly relevant for melasma-prone South Asian skin',
        traditional: 'Central to Ayurvedic anti-aging — prescribed in Chyawanprash (amla-based tonic) for longevity; amla oil for scalp and hair anti-aging',
      },
      turmericAndPipeline: {
        curcumin: 'Curcumin in turmeric: potent anti-inflammatory; NF-kB pathway inhibitor (the master inflammatory switch); reduces skin inflammaging',
        piperine: 'Piperine (black pepper) increases curcumin bioavailability by 2000%; traditional pairing of turmeric and black pepper has pharmacokinetic basis',
        topical: 'Topical curcumin: anti-inflammatory, antioxidant, reduces hyperpigmentation; bioavailability in skin better than oral',
        traditional: 'Ubtan (traditional South Asian wedding paste): turmeric, chickpea flour, sandalwood, rosewater; removes dead skin, anti-inflammatory, anti-aging skin prep ritual',
        
      },
    },
    agingPattern: {
      mismatch: 'A key South Asian aging pattern: skin may look young (few wrinkles) but appear aged due to uneven tone and hyperpigmentation — this mismatch is important for treatment',
      diet: 'Traditional South Asian diet: anti-inflammatory spices (turmeric, ginger, fenugreek), legumes, fermented foods (yogurt, idli, dosa) support gut-skin axis and reduce inflammaging',
    },
    modernAntiAging: {
      melasmaFirst: 'Melasma treatment is the cornerstone of South Asian anti-aging: triple combination cream (hydroquinone + tretinoin + corticosteroid) under medical supervision; or niacinamide + azelaic acid + tranexamic acid',
      SPF: 'SPF 50+ PA++++ (high UVA protection): essential; UV is the primary melasma and PIH trigger; consistent SPF is the most impactful intervention for South Asian skin aging',
      vitaminC: 'Vitamin C 15% AM: antioxidant + collagen synthesis + brightening; particularly effective paired with SPF',
      tranexamic: 'Tranexamic acid 2-5% (oral or topical): now considered first-line for melasma in South Asian skin; reduces melanin synthesis; very well-tolerated',
      retinoids: 'Slow introduction; buffer method; niacinamide alongside to prevent PIH; tretinoin 0.025% is more effective for hyperpigmentation than retinol',
    },
  },

  // ============================================================
  // CARIBBEAN
  // ============================================================
  'caribbean': {
    community: 'Caribbean',
    ageingProfile: {
      overview: `Caribbean skin aging reflects the profound genetic diversity of the islands — indigenous
      Taino, West African, South Asian, European, and Chinese ancestries create one of the most
      genetically diverse populations in the world. The aging pattern largely follows Fitzpatrick type:
      Afro-Caribbean skin ages similarly to West African (delayed wrinkles, hyperpigmentation concerns);
      lighter Caribbean skin shows earlier photoaging. What unites Caribbean skin care traditions is the
      use of abundant tropical botanicals — aloe, sea moss, coconut, morinda — many of which have
      genuine anti-aging evidence.`,
      tropicalUV: 'Caribbean proximity to equator and year-round sun means cumulative UV exposure is among the highest globally; photoaging risk is real even in darker skin tones',
      longevity: 'Several Caribbean communities show above-average longevity; traditional diets rich in fish, tropical fruits, and root vegetables have anti-aging properties',
    },
    traditionalIngredients: {
      seaMoss: {
        botanical: 'Chondrus crispus and Gracilaria species (Irish moss, sea moss)',
        minerals: 'Contains minerals including zinc, magnesium, selenium, iodine — all essential for skin function',
        
        vitaminC: 'Contains vitamin C and B vitamins; also citrulline, which converts to arginine and supports collagen proline content',
        iodine: 'Iodine in sea moss: essential for thyroid function; thyroid hormones regulate skin cell turnover and hydration; thyroid decline with age is a hidden driver of dry, thin, aging-appearing skin',
        traditional: 'Jamaican, Trinidadian, Barbadian tradition: blended with milk, cinnamon, vanilla — drunk as a health and vitality tonic; sea moss gel used topically as skin mask',
        modern: 'Sea moss gel masks: moisturizing, mineral-dense, anti-inflammatory; no RCTs for anti-aging but strong mechanistic basis',
      },
      coconutOil: {
        composition: 'Medium-chain triglycerides (MCTs): lauric acid (50%), caprylic acid, capric acid; saturated fat stability means low rancidity',
        contested: 'Anti-aging claims for coconut oil are contested: saturated fat content questioned for dietary use; comedogenic potential (pore-clogging) for topical use on face',
        antimicrobial: 'Lauric acid is strongly antimicrobial and anti-inflammatory; beneficial for body skin, hair, and inflammation-driven aging',
        hairAntiAging: 'Well-evidenced for hair anti-aging: reduces protein loss in hair shaft by penetrating the cortex — addresses aging hair brittleness',
        traditional: 'Pan-Caribbean: coconut oil for skin, hair, scalp — including anti-aging body treatment; coconut water for hydration post-sun',
        dietaryNote: 'Coconut water (not oil): high in potassium and electrolytes; hydration at cellular level supports skin plumpness',
      },
      aloeVera: {
        botanical: 'Aloe barbadensis miller; grows prolifically across Caribbean islands',
        acemannan: 'Acemannan (polysaccharide): the key bioactive; stimulates fibroblasts to produce collagen and hyaluronic acid; immunomodulatory',
        clinical: 'Aloe may support collagen; the evidence is limited',
        anthraquinones: 'Anthraquinones in aloe: anti-inflammatory and have mild sun-protective properties',
        hyaluronic: 'Aloe stimulates skin hyaluronic acid production — indirect anti-aging through improved hydration',
        traditional: 'Caribbean traditional: fresh aloe fillet applied directly to skin after sun exposure; internal use (aloe juice) for digestion and general health',
        antiAging: 'Among the best-evidenced traditional botanical ingredients for anti-aging; significantly more evidence than most other plant extracts',
      },
      morinda: {
        botanical: 'Morinda citrifolia (noni); widely grown across Caribbean',
        proxeronine: 'Proxeronine — converts to xeronine in the body; claimed to support cell function; mechanistically plausible but clinical data limited',
        antioxidants: 'Quercetin and kaempferol content: flavonoid antioxidants that reduce oxidative stress and UV-induced skin damage',
        damnacanthal: 'Damnacanthal in noni: anti-inflammatory; traditional use as wound healer (which supports anti-aging wound repair pathways)',
        traditional: 'Caribbean traditional: noni fruit juice consumed for immunity and longevity; topical noni preparations for skin',
      },
      tropical: {
        papaya: 'Papain enzyme in papaya: breaks down dead skin protein; natural exfoliant that supports cell turnover (an anti-aging mechanism); green papaya used in traditional skin masks',
        guava: 'Guava: very high vitamin C (5x orange), lycopene (antioxidant), flavonoids — excellent anti-aging fruit when consumed',
        mango: 'Mango seed butter: high in mangiferin (xanthone antioxidant), stearic and oleic acids; excellent emollient; traditional body butter in Caribbean islands',
        soursop: 'Soursop (graviola): annonaceous acetogenins — complex bioactives with anti-inflammatory and potentially anti-aging properties; clinical research ongoing',
      },
      bushMedicine: {
        overview: 'Caribbean bush medicine is a complex oral tradition of medicinal plant use; many plants used for "longevity" and vitality have now been analyzed',
        cerasee: 'Cerasee (bitter melon, Momordica charantia): antioxidant-rich; blood glucose stabilizing (glycation reduction = anti-aging); traditional longevity herb in Jamaica',
        spirulina: 'Not native but widely adopted: Spirulina grown in Caribbean; phycocyanin antioxidant; all essential amino acids for collagen synthesis',
        breadfruit: 'Breadfruit leaf tea: traditional anti-inflammatory; antioxidant polyphenols; the fruit itself is rich in resistant starch (gut microbiome support — gut-skin axis)',
      },
    },
    longevity: {
      centenarians: 'No formally designated Caribbean Blue Zone, but several communities show high longevity — rural Barbados, traditional fishing communities in Martinique — linked to active lifestyle, strong social bonds, seafood-rich diets',
      fishDiet: 'Omega-3 fatty acids from Caribbean fish consumption (snapper, tuna, flying fish): anti-inflammatory effect on skin; EPA reduces photoaging damage',
      socialConnection: 'Research consistently links social connection and community to longevity; Caribbean cultural emphasis on community gathering, carnival, extended family may contribute',
    },
    modernAntiAging: {
      SPF: 'SPF 50+ essential; year-round equatorial sun means Caribbean is a high photoaging risk environment regardless of skin tone',
      hydration: 'Tropical climate means higher transepidermal water loss (TEWL) in dry seasons; consistent moisturizer use (ceramides, glycerin) is anti-aging baseline',
      vitaminC: 'Dietary vitamin C from tropical fruits is exceptional; topical vitamin C 15% for additional collagen synthesis and antioxidant protection',
      protocol: 'Morning: SPF 50+, vitamin C serum; Evening: aloe vera gel or ceramide moisturizer; Weekly: papaya enzyme mask for exfoliation',
    },
  },

  // ============================================================
  // ARAB
  // ============================================================
  'arab': {
    community: 'Arab',
    ageingProfile: {
      overview: `Arab skin aging presents a distinctive pattern shaped by desert climate and desert
      UV. Unlike coastal populations, desert-dwelling Arab populations historically faced extreme UV
      combined with low humidity — a combination that creates dehydration-driven aging as much as
      UV-driven aging. Traditional Arab beauty is built around combating this environment with oiled
      preparations, hammam rituals, and dietary approaches — many of which map directly to modern
      anti-aging science.`,
      primaryConcerns: [
        'Dehydration-driven aging — fine lines from moisture loss rather than structural collagen degradation',
        'Solar hyperpigmentation and melasma — common on medium (Fitzpatrick III-IV) skin',
        'Extrinsic photoaging from intense UV at lower latitudes',
        'Periorbital aging (under-eye darkness, common genetic trait)',
        'Combination or oil-prone skin that complicates retinoid tolerance',
      ],
      desertAging: 'Desert skin\'s aging pattern: dehydration → fine surface lines appear early; UV exposure → pigmentation changes; combined with low atmospheric humidity, makes hydration a primary anti-aging strategy',
    },
    propheticMedicineIngredients: {
      overview: 'Islamic prophetic medicine (tibb an-nabawi) describes foods and remedies with anti-aging properties; modern science has validated many of these',
      blackSeed: {
        botanical: 'Nigella sativa (habbatus sauda, black cumin)',
        thymoquinone: 'Thymoquinone (TQ): the primary bioactive; potent antioxidant, anti-inflammatory, immunomodulatory',
        
        
        topical: 'Topical black seed oil: anti-inflammatory, antioxidant barrier support; traditionally applied to face and scalp',
        traditional: 'Hadith reference: "Black seed is a cure for everything except death"; widely used across Arab world for skin health',
      },
      honey: {
        peroxide: 'Honey\'s hydrogen peroxide (from glucose oxidase enzyme): provides slow-release antibacterial and exfoliating effect at skin surface',
        methylglyoxal: 'Manuka-type honeys have methylglyoxal (MGO) in addition; stronger antimicrobial; used medicinally',
        antioxidants: 'Polyphenol content (varies by floral source): antioxidant; wound healing; anti-inflammatory',
        humectant: 'Honey is a potent humectant (draws water to skin); historically used as moisturizing face mask',
        clinical: 'Clinical evidence: honey accelerates wound healing in RCTs; anti-aging wound-repair pathways activated; reduces scar formation',
      },
      oliveOil: {
        oleocanthal: 'Oleocanthal: phenolic compound with ibuprofen-like anti-inflammatory activity; key bioactive in extra-virgin olive oil',
        squalene: 'Olive oil naturally contains squalene — a lipid also produced by human skin sebum; excellent emollient and antioxidant',
        
        oleicAcid: 'High oleic acid content: reinforces skin barrier; reduces TEWL; repairs barrier damage from desert conditions',
        clinical: 'Olive oil in Mediterranean diet studies: consistently associated with better skin health scores and reduced photoaging in epidemiological data',
        traditional: 'Olive oil is deeply embedded in Levantine and North African Arab beauty traditions — face oil, hair treatment, bath oil after hammam; Prophet Muhammad reportedly used olive oil',
      },
      pomegranate: {
        botanical: 'Punica granatum; native to Iran, now widespread across Arab world',
        
        collagenMechanism: 'Pomegranate extract increases pro-collagen synthesis in fibroblasts in vitro; inhibits MMP enzymes that degrade collagen',
        ellagicAcid: 'Ellagic acid (from ellagitannins): inhibits tyrosinase (reduces hyperpigmentation); anti-inflammatory; antioxidant',
        clinical: 'Oral pomegranate extract (210mg/day, 12 weeks): significantly increased forearm skin elasticity and reduced erythema in Japanese clinical study',
        topical: 'Pomegranate seed oil: contains conjugated linolenic acid (punicic acid) with anti-inflammatory and cell proliferation-supporting properties',
        traditional: 'Pomegranate used across Arab world in food and medicine; pomegranate peel powder in North African skin preparations',
      },
    },
    hammam: {
      practice: 'Hammam (Arabic/Turkish steam bath): weekly or regular ritual of steam, clay, black soap (savon beldi), kessa exfoliation (rough mitt), and oil application',
      antiAgingScience: {
        steam: 'Steam opens pores and softens desquamating cells; facilitates removal of dead skin; mimics modern dermaplaning in effect on cell turnover',
        kessa: 'Kessa (rough mitt) exfoliation: physically removes accumulated dead corneocytes; accelerates the slowing of cell turnover that characterizes aging skin',
        ghassoul: 'Ghassoul (rhassoul clay): mineral-rich volcanic clay from Morocco; removes impurities, exfoliates, and mineral-loads skin',
        sabon: 'Savon beldi (Moroccan black soap): potassium hydroxide-based; alkaline saponification exfoliates and prepares skin for kessa',
        oil: 'Post-hammam argan or olive oil application: locks in moisture immediately after opening barrier with heat and exfoliation — optimal uptake window',
        circulation: 'Steam + exfoliation + massage: significantly improves dermal blood flow; improved circulation delivers nutrients and removes cellular waste — mimics exercise effect on skin',
        frequency: 'Regular hammam (weekly): maintains consistent cell turnover; prevents accumulation of dead cells that cause dullness and texture in aging skin',
      },
    },
    arganOil: {
      
      vitaminE: 'Among the highest tocopherol (vitamin E) content of any plant oil: 620mg tocopherol per kg oil; protects lipid membranes from oxidative damage',
      phenolicAcids: 'Ferulic acid, caffeic acid, vanillic acid: antioxidant phenolics that protect against UV-induced free radicals',
      sterolContent: 'Schottenol and spinasterol: phytosterols unique to argan; anti-inflammatory; skin barrier-reinforcing',
      squalene: 'Squalene content: emollient and antioxidant; similar to skin\'s own squalene production (which declines with age)',
      antiAging: 'Small studies in postmenopausal women suggest argan oil may improve skin elasticity',
      traditional: 'Berber women have used argan oil on face, body, and hair for centuries; preparation traditionally done by women\'s cooperatives — an intergenerational anti-aging tradition',
    },
    goldTreatments: {
      practice: 'Gold leaf and gold-infused skincare popular in Gulf Arab beauty (UAE, Saudi Arabia luxury market)',
      science: 'No clinical evidence for gold leaf as an anti-aging agent at cosmetic concentrations; gold nanoparticles in research settings show potential for drug delivery but not cosmetic benefit',
      honestAssessment: 'Gold treatments are luxury cosmetic experiences; the placebo of luxury + massage (which does improve circulation) is the likely mechanism of any perceived benefit',
      contrast: 'Traditional ingredients (argan oil, pomegranate, olive oil, black seed) have substantially stronger evidence than gold; modern Gulf Arab beauty is a mix of evidenced tradition and luxury marketing',
    },
    modernAntiAging: {
      hydrationFirst: 'Dehydration-driven aging requires hydration as foundation: hyaluronic acid serum, ceramide-rich moisturizer, occlusives like argan oil to seal',
      SPF: 'Desert UV is intense; SPF 50+ daily (even in winter, at altitude); tinted SPF helps with compliance in Arab beauty culture that values complexion evenness',
      vitaminC: 'Vitamin C 15% AM: antioxidant protection against desert UV and pollution; synergistic with SPF; addresses hyperpigmentation',
      niacinamide: 'Niacinamide 5%: reduces hyperpigmentation (periorbital and solar); barrier strengthening; anti-inflammatory; excellent for Arab skin aging profile',
    },
  },

  // ============================================================
  // LATINA
  // ============================================================
  'latina': {
    community: 'Latina',
    ageingProfile: {
      overview: `Latina skin aging reflects extraordinary genetic diversity — Mexico, Central America,
      and South America carry indigenous, African, European, and Asian ancestries in varying combinations.
      Skin aging patterns follow Fitzpatrick type: lighter mestiza skin shows earlier photoaging wrinkles;
      darker indigenous and Afro-Latina skin shows hyperpigmentation-dominant aging. What unites the
      communities is a food culture exceptionally rich in collagen-supporting and anti-inflammatory
      compounds — from bone broth to avocado to chia seeds.`,
      primaryConcerns: [
        'Melasma — highly prevalent in Latina women; hormonally and UV-driven',
        'PIH from acne and inflammation',
        'Hyperpigmentation from intense Latin American sun',
        'For lighter Latina skin: earlier photoaging wrinkles',
        'Dehydration from hot climates',
      ],
      
    },
    traditionalIngredients: {
      avocado: {
        botanical: 'Persea americana; domesticated in Mexico 5,000+ years ago',
        glutathione: 'Avocado contains glutathione precursors (cysteine, glycine, glutamate); glutathione is the body\'s master antioxidant and skin-brightening compound; pheomelanin production inhibited by glutathione',
        oleicAcid: 'High oleic acid (60%+): deeply penetrates skin barrier; reinforces the lipid matrix; anti-inflammatory in the dermis',
        vitaminE: 'Alpha-tocopherol and beta-tocopherol: antioxidant protection against UV-induced ROS; protects cell membranes',
        vitaminC: 'Lower in vitamin C than most fruits but contains unique bioavailable form; combined with lipid content (vitamin C requires lipid for penetration)',
        persin: 'Avocado oil also contains persin (mildly toxic to animals, not humans) and mannoheptulose — a sugar that may affect skin glucose metabolism',
        clinical: 'Avocado oil in clinical wound healing studies: significantly accelerates wound healing vs. control; collagen stimulation mechanism',
        traditional: 'Aztec and Maya use of avocado as food and topical skin treatment is documented for over 3,000 years; avocado hair masks still ubiquitous',
      },
      chia: {
        botanical: 'Salvia hispanica; Aztec superfood',
        omega3: 'Chia seeds are among the richest plant sources of ALA (alpha-linolenic acid), an omega-3 precursor; converts partially to EPA/DHA',
        EPA_DHA: 'EPA and DHA reduce prostaglandin E2 and pro-inflammatory cytokines (IL-1β, TNF-α) — the inflammaging pathway in skin; omega-3s are diet-based anti-aging',
        cellular: 'Omega-3 fatty acids incorporate into cell membranes, improving fluidity; membrane rigidity increases with aging and drives cellular dysfunction',
        
        traditional: 'Aztec warriors consumed chia for endurance; now global superfood; anti-aging benefit is primarily oral via omega-3 and antioxidant content',
      },
      cacao: {
        botanical: 'Theobroma cacao; Mesoamerican origin',
        flavanols: 'Cocoa flavanols (epicatechin, catechin): potent antioxidants; RCT evidence for skin benefits',
        clinical: 'High-flavanol cocoa (329mg/day) for 12 weeks: significantly improved skin elasticity, skin density, and photoprotection (MED increase) vs. low-flavanol control — a genuine RCT result',
        circulation: 'Flavanols may improve blood flow to the skin; improved circulation = better nutrient delivery and cellular waste removal in aging skin',
        UV: 'Cocoa flavanols measurably increase UV tolerance (MED); not a sunscreen replacement but a dietary supplement that genuinely improves photoprotection',
        traditional: 'Cacao was a sacred Aztec beverage; xocolatl drinks consumed daily; now: dark chocolate 70%+ is the evidence-backed form; cacao face masks in traditional and modern Mexican beauty',
        topical: 'Cocoa butter (theobroma oil): high in oleic and stearic acid; excellent emollient; limited anti-aging evidence beyond moisturization despite widespread belief',
      },
      collagenDiet: {
        boneBroth: 'Caldo de pollo, caldo de res (chicken and beef bone broth): collagen and gelatin-rich; traditional pan-Latin American dish; glycine and hydroxyproline from bone collagen may support endogenous collagen production',
        beans: 'Frijoles: high in amino acids including lysine (essential for collagen cross-linking), antioxidant flavonoids, resistant starch (gut microbiome food)',
        epazote: 'Epazote (culinary herb in Mexican cooking): flavonoids, terpenes; anti-inflammatory; less studied but part of anti-aging herb tradition',
        jicama: 'Jicama: prebiotic fiber + vitamin C; supports both gut microbiome (gut-skin axis) and collagen synthesis',
        nopal: 'Nopal (prickly pear cactus): betalains (unique antioxidants), pectin (fiber), vitamin C; strongly anti-inflammatory; blood sugar stabilizing (anti-glycation anti-aging)',
      },
      avocadoOil: {
        topical: 'Avocado oil: penetrates deeper than many plant oils due to oleic acid content and small fatty acid chains',
        betaSitosterol: 'Beta-sitosterol (phytosterol): anti-inflammatory; may promote collagen synthesis via fibroblast stimulation',
        
      },
    },
    facialMassage: {
      gua_sha: 'Gua sha adapted into modern Latin beauty; traditional facial massage practices exist in many indigenous communities (Mayan, Aztec facial rituals)',
      lymphatic: 'Facial massage stimulates lymphatic drainage; reduces puffiness; improves blood flow; evidence for temporary improvements in skin tone and firmness',
      cobblestone: 'Obsidian or jade roller practices in indigenous communities predate modern gua sha; volcanic obsidian used in Aztec beauty',
      tradition: 'Sobadora (traditional healer/massager) practices include facial massage for skin health; continuing anti-aging tradition',
    },
    andesanLongevity: {
      quinoa: 'Quinoa: complete protein with all essential amino acids including lysine and proline — amino acids that are rate-limiting in collagen synthesis',
      maca: 'Maca (Lepidium meyenii): Andean adaptogen; benzylglucosinolates and flavonoids; anti-inflammatory; limited clinical anti-aging data but strong traditional use for vitality and hormonal balance',
      
      highAltitude: 'Andean highlands: lower oxygen levels at altitude are hypothesized to activate hypoxia-inducible pathways that have anti-aging effects; Bolivian, Ecuadorian, Peruvian highland communities with notable longevity',
    },
    modernAntiAging: {
      melasmaProtocol: 'SPF 50+ PA++++ as absolute foundation; tranexamic acid 3-5% topical; niacinamide 10%; azelaic acid 15-20%; avoid hormonal triggers where possible',
      vitaminC: 'Vitamin C (both dietary from cacao, citrus, and tropical fruits, and topical 15%): critically important for melanin control and collagen synthesis in melasma-prone skin',
      retinoids: 'Start low (0.025% retinol), slow titration; buffer in moisturizer; niacinamide alongside; PIH risk increases with irritation',
      diet: 'Traditional Latin diet (beans, nopal, avocado, fish, bone broth) is arguably one of the best anti-aging diets when eaten in traditional form; modern processed-food adaptations lose the benefits',
    },
  },

  // ============================================================
  // EAST ASIAN
  // ============================================================
  'east-asian': {
    community: 'East Asian',
    ageingProfile: {
      overview: `East Asian beauty culture emphasises prevention over correction: layering of
      lightweight protective products, internal health, and consistent SPF use from youth.`,
      primaryConcerns: [
        'Hyperpigmentation (age spots, solar lentigines)',
        'Loss of firmness in the mid-face from fat redistribution',
        'Periorbital darkness and fine lines',
        'Uneven texture from slowing cell turnover',
        'PIH from acne on deeper skin tones',
      ],
      preventionCulture: 'East Asian beauty culture is structurally different: 10-step skincare for prevention, SPF from childhood, antioxidant-rich diet as part of health culture; this structural difference in habit is a major part of the anti-aging advantage',
    },
    riceWater: {
      inositol: 'Inositol (vitamin B8) in rice ferment water: may inhibit tyrosinase (hyperpigmentation enzyme); also shown to improve skin texture in some studies',
      pitera: 'Pitera (SKII\'s branded ingredient from sake fermentation): saccharomycopsis ferment filtrate; rich in amino acids, organic acids, vitamins, minerals; clinical evidence for skin renewal',
      galactomyces: 'Galactomyces ferment filtrate: common Korean and Japanese skincare ingredient; brightening, pore-minimizing, barrier-strengthening in clinical studies',
      traditional: 'Japanese and Korean women washing face with rice water; Geisha using rice bran (nuka) for whole-body exfoliation; still practiced',
      modern: 'Fermented rice products in modern K-beauty (SK-II, many Korean brands): one of the most commercially successful and evidence-backed traditional-to-modern ingredient translations',
    },
    greenTea: {
      
      sirtuin: 'EGCG activates SIRT1 (sirtuin-1): a NAD+-dependent deacetylase that regulates cellular aging and DNA repair',
      clinical: 'Green tea consumption in epidemiological study of Japanese women: significantly associated with improved skin elasticity and reduced UV-induced damage',
      topical: 'Topical green tea extract (1% EGCG): reduces UV-induced erythema and oxidative damage; measurable photoprotective effect',
      
      internalDose: 'Japanese green tea consumption: 2-5 cups/day provides approximately 200-400mg EGCG; the anti-aging dose range in studies',
    },
    ginseng: {
      botanical: 'Panax ginseng (Korean ginseng); Panax quinquefolius (American ginseng)',
      ginsenosides: 'Ginsenosides (triterpenoid saponins): the primary bioactives; 30+ identified ginsenosides with different biological activities',
      antiAging: 'Ginsenoside Rb1: stimulates skin collagen synthesis in fibroblasts; reduces MMP activity; in vitro and in vivo anti-aging evidence',
      sirtuin: 'Ginsenosides activate SIRT1; extend replicative lifespan of skin fibroblasts in cell studies',
      clinical: 'Red ginseng extract (3g/day, 24 weeks): significantly improved skin wrinkles, elastic, moisture content in RCT with 82 subjects',
      red: 'Red ginseng (steamed then dried): increased bioavailability of ginsenosides via processing; more potent than raw white ginseng for anti-aging',
      topical: 'Topical ginseng extract: measurably increases skin thickness and collagen density in clinical studies; commonly used in Korean prestige skincare',
      traditional: 'Korean ginseng cultivation and use spans 2,000+ years; samgye-tang (ginseng chicken soup) is the traditional anti-aging food; daily ginseng extract shots common across East Asian populations',
    },
    okinawanDiet: {
      
      
      caloric: 'Hara hachi bu (eating to 80% full): Okinawan practice that is effectively caloric restriction; caloric restriction is the most replicated anti-aging intervention in animal models',
      purple_sweet_potato: 'Imo (purple sweet potato): high in anthocyanins (anti-inflammatory, antioxidant); the staple carbohydrate of traditional Okinawan diet',
      bitterMelon: 'Goya (bitter melon): momordicin and charantin; anti-inflammatory; blood glucose stabilizing (reducing glycation-driven aging)',
      turmeric: 'Ukon (turmeric): curcumin anti-inflammatory; inflammation reduction is critical mechanism in Okinawan longevity',
      seaweed: 'Kombu, wakame, hijiki: iodine, fucoxanthin (anti-inflammatory carotenoid), fucoidan (polysaccharide with anti-aging immune modulation)',
      tofu: 'Tofu and miso: fermented soy isoflavones; phytoestrogens may partly compensate for menopausal estrogen decline in skin',
      modernOkinawa: 'As Western diet replaced traditional diet in Okinawa from 1990s, the longevity advantage has diminished — confirming the dietary link to anti-aging',
    },
    koreanFermented: {
      gutSkinAxis: 'Fermented foods (kimchi, doenjang, ganjang, gochujang, makgeolli): provide diverse lactobacillus and bifidobacterium strains that colonize the gut microbiome',
      microbiomeAging: 'The gut microbiome changes with aging (dysbiosis): reduced diversity, reduced short-chain fatty acid production, increased intestinal permeability (leaky gut) → systemic inflammation → inflammaging → skin aging',
      kimchi: 'Kimchi studies: significantly increases skin hydration and barrier function; reduces markers of skin aging in pilot clinical studies; Lactobacillus plantarum in kimchi specifically shown to improve skin in RCT',
      lactobacillus: 'Oral Lactobacillus supplementation RCTs: measurably improve skin hydration, elasticity, and reduce transepidermal water loss (TEWL) in multiple independent studies',
      postbiotics: 'Fermentation byproducts (postbiotics): short-chain fatty acids (SCFAs), biotin, B12, K2 — all important for skin health and produced by fermentation',
    },
    SPFculture: {
      practice: 'SPF application from childhood is culturally embedded across East Asia; UV parasols, SPF-infused makeup, SPF reapplication through the day are norms',
      
      formulation: 'East Asian SPF innovation: light-weight essence SPFs, cushion foundation SPFs, tinted SPFs — formulations optimized for daily wear and compliance',
      japanesePA: 'Japan developed the PA+++ (UVA protection) system before international SPF ratings caught up.',
    },
    modernAntiAging: {
      coreProtocol: 'The East Asian anti-aging protocol: morning antioxidant + SPF 50+ PA++++; evening: retinoid or retinol, peptide serum, ceramide moisturizer',
      niacinamide: 'Niacinamide 5-10% widely used in K-beauty and J-beauty for hyperpigmentation (age spots) and barrier strengthening — the skin aging concern most relevant to East Asian skin',
      retinol: 'Retinol tolerance in East Asian skin: moderate; Fitzpatrick III-IV can titrate faster than V-VI; start at 0.025-0.05%; slower for more pigmented skin',
      fermentedInK_beauty: 'Modern K-beauty\'s fermented ingredient focus (galactomyces, pitera, fermented botanicals) is a translation of traditional Korean fermented food culture into skincare — one of the most successful tradition-to-product translations in the industry',
    },
  },

  // ============================================================
  // EAST AFRICAN
  // ============================================================
  'east-african': {
    community: 'East African',
    ageingProfile: {
      overview: `East African skin shares the melanin-protective advantage of other high-melanin
      populations, with wrinkles genuinely delayed. Ethiopia, in particular, has well-documented
      longevity in highland communities, with traditional diets (teff injera, lentils, spices)
      and botanicals (frankincense, honey) that have significant anti-aging evidence. The Horn
      of Africa's trade routes connected it to ancient Egyptian, Arabian, and Indian beauty
      traditions — creating a rich hybrid of anti-aging practices.`,
      primaryConcerns: [
        'Hyperpigmentation and uneven tone (primary aging sign, as in West African skin)',
        'PIH from acne and inflammation',
        'Loss of elasticity in the jowl, neck, and eye area',
        'Dry skin and dehydration (both hot/dry climates and highland cold)',
        'Keloid and hypertrophic scarring tendency (affects anti-aging intervention choices)',
      ],
      kheloidRisk: 'any anti-aging intervention causing inflammation (aggressive peels, laser) requires careful selection; retinoids preferred over ablative treatments',
    },
    frankincense: {
      botanical: 'Boswellia serrata (Indian), Boswellia sacra (Omani/Somali), Boswellia papyrifera (Ethiopian)',
      boswellicAcids: 'Boswellic acids (particularly AKBA — acetyl-11-keto-β-boswellic acid): potent anti-inflammatory compounds; inhibit 5-lipoxygenase (5-LOX), an enzyme in inflammatory cascade',
      collagen: 'Incensole acetate (another boswellia compound): anti-inflammatory; topical boswellia extract shown to increase collagen synthesis and reduce MMP (collagen-degrading enzyme) activity in skin studies',
      elasticity: 'Topical frankincense extract clinical study: significantly improved skin elasticity and reduced wrinkle depth in 30-day application; small study but reproducible',
      tigogenin: 'Boswellia contains tigogenin and steroids that may regulate MMP activity — preserving the ECM (extracellular matrix) that provides structural support to aging skin',
      traditional: 'Ethiopians and Somalis have burned frankincense (etan) for millennia in religious, social, and beauty contexts; smoke-fumigation beauty practice in Ethiopian women; raw resin chewed as health remedy',
      incenseRituals: 'Ethiopian women perform enqenqen — standing over burning frankincense smoke to perfume and treat skin; steam from incense water acts as warm facial steam; the resin constituents may deposit on skin during this process',
    },
    camelMilk: {
      composition: 'Camel milk: lower fat than cow milk; 3x vitamin C of cow milk; contains lactoferrin, lysozyme, immunoglobulins, insulin-like growth factor (IGF-1)',
      vitaminC: '10x the vitamin C of cow milk in some samples; as collagen synthesis cofactor, vitamin C content is anti-aging',
      growthFactors: 'IGF-1 and insulin-like peptides in camel milk: stimulate skin fibroblasts (collagen-producing cells) in vitro; anti-aging fibroblast activation mechanism',
      lactoferrin: 'Lactoferrin: iron-binding protein; anti-inflammatory, antimicrobial; reduces skin inflammation that drives hyperpigmentation',
      
      
      topical: 'Camel milk face masks and soaps: traditional in Somali and Ethiopian nomadic cultures; now artisanally produced and sold in Western markets',
    },
    honey: {
      ethiopianHoney: 'Ethiopia is the largest honey producer in Africa; traditional apiaries; varieties include wild honey from the highlands (dark, intensely flavored, high polyphenol)',
      hydrogen_peroxide: 'Honey\'s glucose oxidase enzyme produces hydrogen peroxide — provides controlled cell-renewal exfoliation at skin surface; also antimicrobial',
      polyphenols: 'Highland Ethiopian honey varieties show extremely high polyphenol content vs. commercial honeys; anti-inflammatory and antioxidant activity',
      woundHealing: 'Ethiopian traditional medicine uses honey extensively for wound healing; clinical evidence for honey in wound healing is strong (RCTs); wound-repair pathways are anti-aging pathways',
      traditional: 'Tej (honey wine): traditional Ethiopian fermented drink; honey consumed as daily health food; skin applications documented in Habesha beauty traditions',
    },
    teff: {
      nutritional: 'Teff (Eragrostis tef): ancient grain indigenous to Ethiopia; eaten daily as injera flatbread',
      ironCalcium: 'High iron and calcium: iron essential for hemoglobin and tissue oxygenation (poorly oxygenated skin = faster visible aging); calcium for keratinocyte differentiation',
      aminoAcids: 'Complete essential amino acid profile: provides all amino acids needed for collagen synthesis (including lysine and proline)',
      resistant: 'High resistant starch content (prebiotic): feeds gut microbiome; gut-skin axis benefit; reduces systemic inflammation (inflammaging)',
      fermentation: 'Injera fermentation process (3-day teff ferment): produces B vitamins, probiotics; fermented teff is effectively a probiotic food consumed daily',
    },
    incenseAndSkin: {
      ritual: 'The Ethiopian beauty ritual of sitting over burning frankincense mixed with wood chips and resins to perfume hair, skin, and clothing is both cultural and potentially skin-beneficial',
      compounds: 'Frankincense volatile organic compounds deposited on skin during fumigation may include anti-inflammatory boswellic acid derivatives at low concentrations',
      steam: 'Steam component of incense ritual (water added to coals) opens pores, increases circulation; mimics facial steam benefits for skin preparation',
      historical: 'Ancient Egyptian women used identical fumigation practices; Egyptian mummies show evidence of boswellia resin in burial preparations',
    },
    longevity: {
      highland: 'Ethiopian highland communities (Tigray, Amhara): traditional longevity and number of centenarians noted in population studies; high altitude, active lifestyle, traditional diet',
      diet: 'Traditional Ethiopian diet: injera (teff), misir (red lentils), shiro (chickpea powder), tikur azmud (black cumin seeds), berbere spice blend — anti-inflammatory, antioxidant-rich',
      berbere: 'Berbere spice blend: chili, ginger, fenugreek, black pepper, coriander, rue — nearly all ingredients have anti-inflammatory and antioxidant evidence; daily seasoning is a daily anti-aging dose',
    },
    modernAntiAging: {
      keloidAware: 'Choose non-ablative interventions: topical actives rather than aggressive peels or lasers; retinoids, niacinamide, and azelaic acid are low-risk choices for keloid-prone skin',
      hyperpigmentation: 'Niacinamide 5-10% + azelaic acid 15% + SPF 50+ (even under full-coverage hijab if worn, as UV penetrates windows and reflected light still activates melanocytes)',
      frankincenseActives: 'Boswellia extract is now available in premium anti-aging serums; evidence-backed use for elasticity; can layer under moisturizer',
      camelMilkTopical: 'Camel milk soap and face masks: legitimate moisturizing and anti-inflammatory properties; a traditional ingredient with growing clinical backing',
    },
  },

  // ============================================================
  // SOUTH AFRICAN
  // ============================================================
  'south-african': {
    community: 'South African',
    ageingProfile: {
      overview: `South Africa is biologically extraordinary for anti-aging research because the Cape
      Floristic Region is the world's smallest and richest biodiversity hotspot — with over 9,000 plant
      species in a region smaller than Portugal, including many with unique phytochemicals found nowhere
      else. Rooibos, buchu, aloe ferox, marula, and wild rosemary are indigenous to South Africa and
      have measurable anti-aging properties. Black South African skin aging follows the pan-African
      pattern (hyperpigmentation before wrinkles); white and mixed heritage South Africans face
      exceptional UV exposure from South African sun.`,
      capeBiodiversity: 'The Cape Floristic Region contributes indigenous ingredients to global skincare at an accelerating rate; many of the most novel anti-aging botanicals in premium global skincare originate here',
    },
    rooibos: {
      
      aspalathin: 'Aspalathin: a dihydrochalcone flavonoid found ONLY in rooibos; not present in any other plant; potent antioxidant',
      nothofagin: 'Nothofagin: another unique rooibos flavonoid with antioxidant properties',
      UV: 'Aspalathin specifically reduces UV-B-induced reactive oxygen species (ROS) in skin cells; measurable photoprotective antioxidant effect',
      
      MMP: 'Rooibos polyphenols inhibit matrix metalloproteinases (MMP-1, MMP-3): the collagen-degrading enzymes that increase with aging and UV exposure',
      
      quercetin: 'Quercetin in rooibos: broad anti-inflammatory; also slightly inhibits tyrosinase (hyperpigmentation) — relevant for PIH-prone dark South African skin',
      traditional: 'Khoikhoi and San (Khoi-San) people used rooibos tea long before European settlers documented it; now a daily beverage for all South Africans; anti-aging benefit from both oral and topical use',
    },
    marulaOil: {
      botanical: 'Sclerocarya birrea; Marula tree native to sub-Saharan Africa and Southern Africa',
      stability: 'Marula oil\'s exceptional oxidative stability (longer shelf life than argan oil) is due to high oleic acid (70-78%) and natural antioxidants',
      procyanidins: 'Procyanidins (condensed tannins): antioxidant polyphenols; inhibit MMP enzymes; the anti-aging mechanism in marula',
      omega9: 'High omega-9 (oleic acid) and omega-6 (linoleic acid): reinforces skin barrier; reduces TEWL (transepidermal water loss)',
      phenolics: 'Gallic acid and ellagic acid: antioxidant and tyrosinase-inhibiting phenolics; anti-hyperpigmentation',
      clinical: 'Marula oil clinical study: significantly improved skin moisture retention and elasticity in 60 participants over 4 weeks vs. placebo',
      traditional: 'Marula fruit is an important traditional food (fresh fruit, marula beer — umqombothi); oil pressed from kernel for skin and hair treatment by Swazi, Tsonga, Zulu communities',
      worldwide: 'Marula oil is now a global premium skincare ingredient; Drunk Elephant\'s Marula Oil made it famous internationally; South African origin and traditional use context is rarely highlighted',
    },
    buchu: {
      botanical: 'Agathosma betulina and A. crenulata; Cape Fynbos endemic',
      diosphenol: 'Diosphenol (buchu camphor): the key bioactive; antimicrobial and anti-inflammatory',
      antioxidant: 'Quercetin, rutin, hesperidin: flavonoid antioxidants; reduce oxidative stress driving inflammaging',
      diosmin: 'Diosmin content: reduces capillary fragility; improves circulation in dermis; circulation improvement is anti-aging (better nutrient delivery)',
      traditional: 'San and Khoikhoi people used buchu topically and internally for centuries; one of the earliest traditional medicines documented by colonial botanists; used as a wound treatment and anti-inflammatory',
      modern: 'Buchu extract increasingly used in premium natural skincare; anti-inflammatory and antioxidant positioning; Cape Town-based beauty companies building indigenous ingredient ranges',
    },
    aloeFerox: {
      botanical: 'Aloe ferox (Cape aloe or bitter aloe); grows wild across South Africa',
      collagen: 'A. ferox gel may support collagen in lab work; human evidence is limited',
      wound: 'Traditionally used on wounds; evidence for anti-ageing use is early',
      anti_hyperpig: 'Aloin (anthraquinone): inhibits tyrosinase; mild skin-brightening effect; traditional use for "skin clearing"',
      traditional: 'Historically used by all South African communities for skin burns, wounds, and sun damage; Cape aloe bitters (internal use) for digestion and systemic health',
    },
    rooibosWildRosemary: {
      wildRosemary: 'Eriocephalus africanus (Cape snowbush / African wild rosemary): anti-inflammatory diterpene content; different from Mediterranean rosemary',
      essential: 'Essential oils of Cape snowbush: camphene, limonene, α-pinene; anti-inflammatory when inhaled and when applied topically in diluted form',
      kapokBush: 'Eriocephalus punctulatus (kapok bush): antimicrobial and anti-inflammatory; traditional wound and skin treatment',
      helichrysum: 'Helichrysum odoratissimum (Cape everlasting): found in Fynbos; neryl acetate and phloroglucinol content; anti-inflammatory and regenerative; anti-aging skin applications supported by mechanistic studies',
    },
    longevity: {
      traditional: 'Traditional Zulu, Xhosa, and Sotho longevity practices: combination of active lifestyle (subsistence farming, walking), traditional diet (sorghum, maize, mopane worms, fermented milk/amasi), and medicinal plant use',
      amasi: 'Amasi (fermented maize milk / sour milk): probiotic-rich fermented dairy; gut microbiome support via diverse lactobacillus strains; gut-skin axis anti-aging benefit',
      moringa: 'Moringa (Moringa oleifera) now widely cultivated in South Africa for its nutritional and skin anti-aging properties; highest antioxidant content of common South African food plants',
    },
    modernAntiAging: {
      rooibosTopical: 'Rooibos extract in serum (0.5-1%): antioxidant + UV protection + anti-glycation; unique multi-mechanism anti-aging action; combine with SPF 50+',
      marulaRoutine: 'Marula oil as finishing oil: 2-3 drops AM under SPF; PM after retinol treatment; locks in moisture and delivers procyanidin antioxidants',
      SPF: 'South African UV is intense at southern latitudes + high-altitude cities (Johannesburg at 1,750m); SPF 50+ daily non-negotiable for any skin tone',
      protocol: 'Morning: rooibos antioxidant serum + SPF 50+; Evening: retinol (low, slow) + marula oil; Weekly: aloe ferox hydrating mask; Ongoing: amasi or probiotic supplement for gut-skin axis',
    },
  },

  // ============================================================
  // BLACK AMERICAN
  // ============================================================
  'black-american': {
    community: 'Black American',
    ageingProfile: {
      overview: `Black American skin shares the West African melanin biology — the genuine delay in
      wrinkle formation that "Black don't crack" describes — but Black American cultural context
      introduces different stressors and different traditions than continental African practices.
      The weathering hypothesis (accelerated biological aging from chronic psychosocial stress in a
      racist society) is a documented public health finding. The Nap Ministry's "rest as resistance"
      approach connects sleep and rest directly to skin health in a culturally specific way. Modern
      K-beauty and dermatology are converging on understanding what actives work best for very dark
      skin — and how to use them without triggering PIH.`,
      weatheringHypothesis: 'The weathering hypothesis (Dr. Arline Geronimus): chronic exposure to racism and systemic disadvantage causes accelerated biological aging (higher allostatic load, shorter telomeres); this is a skin-relevant finding; chronic stress → elevated cortisol → collagen degradation → premature aging',
      blackDontCrackScience: '"Black don\'t crack" is a cultural touchstone with a basis (melanin delays sun-driven wrinkles); the nuance is that hyperpigmentation and elasticity loss occur — just not wrinkles first',
    },
    melaninScience: {
      eumelanin: 'Eumelanin provides the UV photoprotection; melanin in Black skin acts as both UV absorber and free radical scavenger',
      melanosomes: 'Black American skin (Fitzpatrick V-VI) has larger, more dispersed melanosomes throughout all epidermal layers vs. lighter skin where melanosomes are clustered in basal layer',
      latentAging: 'UV-driven collagen degradation still occurs but is significantly slowed; deep wrinkles may not appear until 60s-70s vs. 40s-50s in equivalent sun-exposed lighter skin',
      hyperpigmentation: 'The trade-off: hyperreactive melanocytes mean any inflammation triggers rapid, persistent PIH; this is the primary aging concern from the 30s-40s onward',
    },
    JBCO: {
      name: 'Jamaican Black Castor Oil (JBCO)',
      difference: 'Distinguished from regular castor oil by roasting of beans before pressing; roasting increases ash content (higher pH), changes fatty acid profile slightly, adds unique compounds',
      riccinoleic: 'Ricinoleic acid (90%+): the primary fatty acid; anti-inflammatory; promotes blood circulation; triggers vasodilation',
      scalpAntiAging: 'Scalp aging involves thinning hair, follicle miniaturization, and decreased sebum; JBCO applied to scalp: anti-inflammatory (reduces folliculitis that accelerates hair loss), promotes circulation, provides emollient environment for follicle health',
      tocopherol: 'Vitamin E content: antioxidant protection for scalp and hair follicle from oxidative stress — a driver of follicle aging',
      traditional: 'JBCO is a Black American beauty tradition from at least the early 20th century; deeply embedded in hair care; now popularized globally',
      clinical: 'Clinical evidence for hair growth specifically is limited to small studies and case reports; anti-inflammatory and circulation-improving mechanisms are well-documented even if definitive RCTs are lacking',
    },
    restAsResistance: {
      tricia: 'Tricia Hersey ("The Nap Bishop") and The Nap Ministry reframe rest as resistance against capitalist overwork culture; connects specifically to Black American lived experience',
      skinScience: 'Sleep deprivation: elevates cortisol (collagen breakdown signal), reduces growth hormone peak (skin repair signal), impairs circadian skin barrier repair, reduces melatonin (nocturnal antioxidant)',
      melatonin: 'Melatonin produced during deep darkness is a potent antioxidant for skin; even phone screen exposure before sleep disrupts melatonin and reduces the overnight antioxidant repair cycle',
      cortisol: 'Chronic sleep debt = chronic cortisol elevation; cortisol breaks down collagen via MMP upregulation; chronic stress-driven premature aging is measurable in biomarker studies',
      circadian: 'Key collagen synthesis occurs 11pm-4am during deep sleep stages; skin cell proliferation peaks at night; missing sleep disrupts this repair window',
    },
    niacinamideForDarkSkin: {
      mechanism: 'Niacinamide reduces melanosome transfer from melanocytes to keratinocytes — the step that actually deposits pigment in the skin; targeted at the right stage of hyperpigmentation',
      concentration: '5-10% niacinamide: optimal anti-pigmentation concentration; well-tolerated by all skin tones including deep dark skin',
      barrier: 'Niacinamide strengthens the skin barrier by increasing ceramide synthesis; stronger barrier = less PIH-triggering inflammation from environmental insults',
      antiInflammatory: 'Reduces inflammatory cytokines (IL-1β, TNF-α); the inflammaging driver of hyperpigmentation in dark skin',
      NAD: 'Niacinamide is a NAD+ precursor; NAD+ declines with aging; NAD+ is required for sirtuin activation (anti-aging cellular repair enzymes); niacinamide has a systemic anti-aging mechanism that goes beyond hyperpigmentation',
      compatibility: 'Niacinamide pairs well with retinol (reduces retinol-induced PIH risk), vitamin C (some controversy about interaction — use separately AM/PM or choose stable forms), SPF',
    },
    retinolForDarkSkin: {
      importance: 'Retinoids are critically important for dark skin anti-aging because they address hyperpigmentation (the primary aging concern) AND accelerate cell turnover AND stimulate collagen',
      PIHrisk: 'The challenge: retinoid-induced irritation triggers PIH in dark skin; the retinoid anti-aging benefit and the PIH risk must be balanced through careful protocol',
      protocol: [
        'Start at 0.01-0.025% retinol (lowest available)',
        'Once weekly only for the first 4-6 weeks',
        'Buffer method: apply retinol AFTER (on top of) moisturizer, not to bare skin',
        'Always pair with SPF 50+ the next morning — non-negotiable',
        'Add niacinamide 5% to the routine: reduces PIH from any retinoid irritation',
        'Only increase frequency after confirming zero irritation for 6 weeks at current dose',
        'Signs to reduce: any redness, burning, or new dark spots',
      ],
      payoff: 'When tolerated, retinoids deliver extraordinary results for dark skin: address hyperpigmentation, improve texture, stimulate collagen (the structural anti-aging benefit), and accelerate cell turnover',
    },
    peptides: {
      mechanism: 'Peptides signal fibroblasts to produce more collagen and elastin without the inflammatory mechanism of retinoids; low PIH risk; ideal for dark skin',
      matrixyl: 'Matrixyl 3000 (palmitoyl tripeptide-1 + palmitoyl tetrapeptide-7): best evidenced peptide combo; RCT evidence for wrinkle reduction and collagen stimulation',
      copperPeptides: 'GHK-Cu (copper peptides): stimulate collagen and elastin; also anti-inflammatory (reduces PIH-triggering inflammation); excellent for Black American skin',
      argireline: 'Argireline (acetyl hexapeptide-3): botox-like peptide (inhibits neuromuscular acetylcholine release); reduces expression lines; lower risk approach than retinoids for very dark skin',
      combining: 'Peptides can be combined with niacinamide and SPF for a gentle but effective anti-aging regimen for those who cannot tolerate retinoids',
    },
    vitaminCForDarkSkin: {
      collagen: 'Vitamin C is essential for collagen synthesis (required cofactor for hydroxylase enzymes); this mechanism applies equally to all skin tones',
      hyperpigmentation: 'Vitamin C inhibits tyrosinase; reduces melanin synthesis; addresses hyperpigmentation — the primary aging sign in dark skin',
      stability: 'L-ascorbic acid is unstable; ascorbyl glucoside and sodium ascorbyl phosphate are more stable alternatives; important for dark skin because oxidized vitamin C can paradoxically worsen pigmentation',
      concentration: '10-15% effective range; higher concentrations not necessarily more effective and increase irritation risk',
      AM_application: 'Morning vitamin C under SPF: antioxidant defense layer against UV-induced free radicals AND additional SPF-boosting photoprotection; this duo is the most evidence-backed anti-aging morning routine',
    },
    modernProtocol: {
      morning: 'Vitamin C serum 10-15% → SPF 50+ (non-negotiable regardless of skin tone)',
      evening: 'Niacinamide 5-10% → low-dose retinol (buffered, once-to-twice weekly, titrating slowly) → ceramide moisturizer',
      weekly: 'Gentle AHA (5-8% lactic acid) exfoliation: maintains cell turnover without PIH risk of stronger physical exfoliation',
      monthly: 'Consider: azelaic acid 15-20% for PIH treatment; tranexamic acid for persistent hyperpigmentation; see dermatologist for prescription tretinoin titrated carefully',
      lifestyle: 'Prioritize sleep (7-9h, dark room, consistent timing); manage chronic stress; anti-inflammatory diet; these non-topical factors are proportionally more important for Black American skin aging given the weathering hypothesis',
    },
  },
};

// ============================================================
// GETTER FUNCTION — REQUIRED PATTERN
// ============================================================

export function getAgingSkinGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_AGING_SKIN_GUIDES['west-african'],
    'south-asian': ETHNIC_AGING_SKIN_GUIDES['south-asian'],
    'caribbean': ETHNIC_AGING_SKIN_GUIDES['caribbean'],
    'arab': ETHNIC_AGING_SKIN_GUIDES['arab'],
    'latina': ETHNIC_AGING_SKIN_GUIDES['latina'],
    'east-asian': ETHNIC_AGING_SKIN_GUIDES['east-asian'],
    'east-african': ETHNIC_AGING_SKIN_GUIDES['east-african'],
    'south-african': ETHNIC_AGING_SKIN_GUIDES['south-african'],
    'black-american': ETHNIC_AGING_SKIN_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

// ============================================================
// UTILITY EXPORTS
// ============================================================

export function getAllCommunityIds() {
  return [
    'west-african',
    'south-asian',
    'caribbean',
    'arab',
    'latina',
    'east-asian',
    'east-african',
    'south-african',
    'black-american',
  ];
}

export function getAntiAgingIngredientsByEvidence(tier) {
  const directMap = {
    1: UNIVERSAL_SKIN_AGING.evidenceHierarchy.tierOne,
    2: UNIVERSAL_SKIN_AGING.evidenceHierarchy.tierTwo,
    3: UNIVERSAL_SKIN_AGING.evidenceHierarchy.tierThree,
    'one': UNIVERSAL_SKIN_AGING.evidenceHierarchy.tierOne,
    'two': UNIVERSAL_SKIN_AGING.evidenceHierarchy.tierTwo,
    'three': UNIVERSAL_SKIN_AGING.evidenceHierarchy.tierThree,
  };
  return directMap[tier] || null;
}

export function getRetinoidProtocol(fitzpatrickCategory) {
  const directMap = {
    'light': UNIVERSAL_SKIN_AGING.retinoidProtocolsByType.lightSkin,
    'medium': UNIVERSAL_SKIN_AGING.retinoidProtocolsByType.mediumSkin,
    'dark': UNIVERSAL_SKIN_AGING.retinoidProtocolsByType.darkSkin,
    'I': UNIVERSAL_SKIN_AGING.retinoidProtocolsByType.lightSkin,
    'II': UNIVERSAL_SKIN_AGING.retinoidProtocolsByType.lightSkin,
    'III': UNIVERSAL_SKIN_AGING.retinoidProtocolsByType.mediumSkin,
    'IV': UNIVERSAL_SKIN_AGING.retinoidProtocolsByType.mediumSkin,
    'V': UNIVERSAL_SKIN_AGING.retinoidProtocolsByType.darkSkin,
    'VI': UNIVERSAL_SKIN_AGING.retinoidProtocolsByType.darkSkin,
  };
  return directMap[fitzpatrickCategory] || null;
}

export function getTraditionalIngredient(ingredientKey) {
  const directMap = {
    'shea-butter': TRADITIONAL_ANTI_AGING_INGREDIENT_DATABASE.sheaButter,
    'moringa': TRADITIONAL_ANTI_AGING_INGREDIENT_DATABASE.moringa,
    'baobab': TRADITIONAL_ANTI_AGING_INGREDIENT_DATABASE.baobab,
    'black-seed': TRADITIONAL_ANTI_AGING_INGREDIENT_DATABASE.blackSeed,
    'pomegranate': TRADITIONAL_ANTI_AGING_INGREDIENT_DATABASE.pomegranate,
    'green-tea': TRADITIONAL_ANTI_AGING_INGREDIENT_DATABASE.greenTea,
    'ginseng': TRADITIONAL_ANTI_AGING_INGREDIENT_DATABASE.ginseng,
    'frankincense': TRADITIONAL_ANTI_AGING_INGREDIENT_DATABASE.frankincense,
    'rooibos': TRADITIONAL_ANTI_AGING_INGREDIENT_DATABASE.rooibos,
    'marula': TRADITIONAL_ANTI_AGING_INGREDIENT_DATABASE.marula,
    'aloe': TRADITIONAL_ANTI_AGING_INGREDIENT_DATABASE.aloeVera_ferox,
    'amla': TRADITIONAL_ANTI_AGING_INGREDIENT_DATABASE.amla,
    'sea-moss': TRADITIONAL_ANTI_AGING_INGREDIENT_DATABASE.seaMoss,
    'camel-milk': TRADITIONAL_ANTI_AGING_INGREDIENT_DATABASE.camelMilk,
    'avocado': TRADITIONAL_ANTI_AGING_INGREDIENT_DATABASE.avocado,
  };
  return directMap[ingredientKey] || null;
}

export function getCommunityRoutine(communityId) {
  const directMap = {
    'west-african': ANTI_AGING_SKINCARE_ROUTINES_BY_COMMUNITY['west-african'],
    'south-asian': ANTI_AGING_SKINCARE_ROUTINES_BY_COMMUNITY['south-asian'],
    'caribbean': ANTI_AGING_SKINCARE_ROUTINES_BY_COMMUNITY.caribbean || null,
    'arab': ANTI_AGING_SKINCARE_ROUTINES_BY_COMMUNITY.arab || null,
    'latina': ANTI_AGING_SKINCARE_ROUTINES_BY_COMMUNITY.latina || null,
    'east-asian': ANTI_AGING_SKINCARE_ROUTINES_BY_COMMUNITY['east-asian'],
    'east-african': ANTI_AGING_SKINCARE_ROUTINES_BY_COMMUNITY['east-african'] || null,
    'south-african': ANTI_AGING_SKINCARE_ROUTINES_BY_COMMUNITY['south-african'] || null,
    'black-american': ANTI_AGING_SKINCARE_ROUTINES_BY_COMMUNITY['black-american'],
  };
  return directMap[communityId] || null;
}

export function getMythsByRelevance(communityId) {
  if (!communityId) return SKIN_AGING_MYTHS_AND_FACTS.myths;
  return SKIN_AGING_MYTHS_AND_FACTS.myths.filter(
    myth => myth.relevantCommunities.includes(communityId) || myth.relevantCommunities.includes('all')
  );
}

export function getAntiAgingMythFact(index) {
  const myths = SKIN_AGING_MYTHS_AND_FACTS.myths;
  if (typeof index === 'number' && index >= 0 && index < myths.length) return myths[index];
  return null;
}

export function getDecadeGuidance(decade) {
  const directMap = {
    '20s': SKIN_AGING_BY_DECADE.twenties,
    '30s': SKIN_AGING_BY_DECADE.thirties,
    '40s': SKIN_AGING_BY_DECADE.forties,
    '50s': SKIN_AGING_BY_DECADE.fifties,
    '60s': SKIN_AGING_BY_DECADE.sixtiesAndBeyond,
    'twenties': SKIN_AGING_BY_DECADE.twenties,
    'thirties': SKIN_AGING_BY_DECADE.thirties,
    'forties': SKIN_AGING_BY_DECADE.forties,
    'fifties': SKIN_AGING_BY_DECADE.fifties,
    'sixties': SKIN_AGING_BY_DECADE.sixtiesAndBeyond,
  };
  return directMap[decade] || null;
}

export function getProfessionalTreatments(skinConcern) {
  const directMap = {
    'laser': PROFESSIONAL_TREATMENTS_BY_SKIN_TYPE.lasers,
    'peels': PROFESSIONAL_TREATMENTS_BY_SKIN_TYPE.chemicalPeels,
    'microneedling': PROFESSIONAL_TREATMENTS_BY_SKIN_TYPE.microneedling,
    'injectables': PROFESSIONAL_TREATMENTS_BY_SKIN_TYPE.injectables,
    'dark-skin-microneedling': PROFESSIONAL_TREATMENTS_BY_SKIN_TYPE.microneedlingForDarkSkin,
  };
  return directMap[skinConcern] || null;
}

export function getLongevityFoods(communityId) {
  const directMap = {
    'west-african': ['Palm oil (tocotrienols)', 'Moringa leaf', 'Baobab fruit', 'Oily fish (omega-3)', 'Leafy greens (ugwu, kontomire)'],
    'south-asian': ['Amla (vitamin C)', 'Turmeric + black pepper (curcumin)', 'Ashwagandha milk', 'Chyawanprash', 'Legumes', 'Fermented foods (yogurt, idli, dosa)'],
    'caribbean': ['Sea moss', 'Coconut water', 'Tropical fruits (guava, papaya, mango)', 'Fresh fish (omega-3)', 'Cerasee (bitter melon)', 'Breadfruit'],
    'arab': ['Olive oil (polyphenols)', 'Pomegranate', 'Black seed', 'Honey', 'Dates (antioxidants)', 'Figs', 'Nuts'],
    'latina': ['Avocado', 'Chia seeds (omega-3)', 'Cacao (70%+)', 'Bone broth (collagen)', 'Beans (lysine)', 'Nopal cactus', 'Jicama'],
    'east-asian': ['Green tea (EGCG)', 'Ginseng', 'Purple sweet potato', 'Fermented foods (kimchi, miso)', 'Seaweed', 'Tofu/soy isoflavones', 'Oily fish'],
    'east-african': ['Teff injera (complete protein)', 'Red lentils (misir)', 'Ethiopian honey', 'Berbere spice blend', 'Camel milk', 'Morinda (noni)'],
    'south-african': ['Rooibos tea (aspalathin)', 'Marula fruit', 'Amasi (fermented milk, probiotic)', 'Moringa', 'Mopane worms (complete protein, zinc)'],
    'black-american': ['Collard greens (vitamin K, antioxidants)', 'Black-eyed peas (lysine for collagen)', 'Sweet potato (beta-carotene)', 'Watermelon (lycopene)', 'Oily fish (omega-3)'],
  };
  return directMap[communityId] || null;
}

// ============================================================
// EXTENDED SCIENCE SECTIONS
// ============================================================

export const COLLAGEN_SCIENCE_DEEP = {
  types: {
    typeI: {
      
      function: 'Provides tensile strength and resistance to stretching; main structural scaffold of skin',
      aging: 'Type I collagen decreases most dramatically with UV exposure and chronological aging; loss is responsible for wrinkle formation',
      synthesis: 'Synthesized by dermal fibroblasts; requires vitamin C as cofactor for post-translational hydroxylation of proline and lysine residues',
    },
    typeIII: {
      location: 'Co-localizes with Type I; abundant in fetal and healing skin; "reticulin fibers"',
      function: 'Provides elasticity and flexibility; scaffold for type I deposition during wound healing',
      aging: 'Type III to Type I ratio shifts with aging; less type III means reduced flexibility and slower wound healing',
      ingredients: 'Copper peptides stimulate Type III collagen in healing contexts; topical application may replicate this in aging skin',
    },
    typeIV: {
      location: 'Basement membrane (boundary between epidermis and dermis)',
      function: 'Anchors epidermis to dermis; provides filtration barrier; supports keratinocyte attachment',
      aging: 'Thinning of basement membrane collagen IV with age impairs epidermal-dermal communication; contributes to epidermal thinning and fragility',
    },
    typeVII: {
      location: 'Anchoring fibrils at the dermal-epidermal junction',
      function: 'Anchors dermis to epidermis; critical for skin structural integrity and preventing blistering',
      aging: 'Type VII collagen anchoring fibrils decrease with age; epidermal fragility and delayed healing result',
    },
  },
  degradation: {
    MMPs: {
      overview: 'Matrix metalloproteinases (MMPs) are the primary collagen-degrading enzymes; zinc-dependent endopeptidases',
      MMP1: 'MMP-1 (collagenase-1): the main collagen-degrader; increases with UV exposure, aging, and inflammation; breaks Type I and III collagen',
      MMP3: 'MMP-3 (stromelysin-1): degrades proteoglycans and activates other MMPs; amplifies collagen degradation cascade',
      MMP9: 'MMP-9 (gelatinase B): degrades Type IV collagen (basement membrane); increases with UV; undermines epidermal anchoring',
      activation: 'MMPs are activated by UV via AP-1 transcription factor; a single unprotected sun exposure measurably increases MMP expression in human dermis',
      inhibition: 'MMP inhibitors as anti-aging ingredients: retinoids (reduce MMP-1 via AP-1 inhibition), antioxidants (reduce ROS that activate AP-1), rooibos polyphenols, pomegranate punicalagins',
    },
    TIMPs: {
      overview: 'TIMPs (Tissue Inhibitors of Metalloproteinases) are the natural regulators of MMP activity',
      aging: 'TIMP levels decrease with aging; the MMP/TIMP ratio shifts toward degradation as we age',
      interventions: 'Supporting TIMP function: avoiding chronic UV, reducing oxidative stress, adequate zinc (MMP cofactor — complex relationship), retinoids in low doses',
    },
  },
  synthesis: {
    pathway: 'Procollagen synthesis pathway: Fibroblast → ribosome synthesis of procollagen peptides → hydroxylation of proline/lysine (requires vitamin C + O2) → triple helix formation → Golgi processing → secretion → extracellular crosslinking by lysyl oxidase → mature collagen fibril',
    rateLimiting: 'Vitamin C is rate-limiting for collagen synthesis at the hydroxylation step; sub-optimal vitamin C = structurally defective collagen (proto-scurvy effect at cellular level)',
    copper: 'Copper is the cofactor for lysyl oxidase (collagen crosslinking); copper deficiency impairs mature collagen formation; copper peptides in skincare aim to support this step',
    silica: 'Silica (silicon): required for collagen type I synthesis in fibroblasts; dietary silica from whole grains, bamboo extract, and some mineral waters correlates with collagen density in studies',
  },
  oralSupplements: {
    hydrolyzed: {
      form: 'Hydrolyzed collagen peptides (molecular weight 1-20 kDa): small enough to be absorbed intact from gut',
      mechanism: 'Absorbed collagen peptides (Pro-Hyp, Gly-Pro-Hyp dipeptides and tripeptides): act as signals to fibroblasts to increase endogenous collagen synthesis; not incorporated directly',
      
      dose: '2.5-10g/day shows efficacy range; most RCTs use 5-10g; marine collagen and bovine collagen both effective',
      timing: 'Oral collagen + vitamin C combined: most effective; vitamin C required for endogenous collagen synthesis that the collagen peptides stimulate',
    },
    vitaminC: {
      oral: 'Vitamin C 500-1000mg/day oral: significantly increases skin vitamin C stores depleted by UV; required cofactor for collagen synthesis',
      synergy: 'Oral vitamin C + collagen peptides: synergistic; the peptides signal synthesis while vitamin C provides the cofactor required to actually make collagen',
    },
  },
};

export const ANTI_AGING_INGREDIENT_SCIENCE = {
  retinoids: {
    mechanism: {
      RARbinding: 'Retinoids bind to nuclear retinoic acid receptors (RARs); RAR complexes bind RAREs (retinoic acid response elements) in DNA to regulate gene transcription',
      collagenGenes: 'Retinoids upregulate procollagen type I and III gene expression in dermal fibroblasts; measurably increase collagen synthesis within weeks',
      MMPSuppression: 'Retinoids reduce AP-1 transcription factor activity → decreased MMP-1, -3, and -9 expression → reduced collagen degradation',
      turnover: 'Retinoids increase epidermal cell proliferation and accelerate desquamation; restore youthful cell turnover rate of ~28 days',
      pigmentation: 'Retinoids reduce tyrosinase expression and melanin transfer; effective against hyperpigmentation — the primary aging concern in dark skin',
    },
    forms: {
      
      
      tretinoin: 'Tretinoin (all-trans retinoic acid): prescription; directly active; most studied; strongest evidence; most irritating',
      adapalene: 'Adapalene 0.1-0.3%: synthetic retinoid; selective RAR-beta and gamma agonist; less irritating than tretinoin; prescription for acne, OTC 0.1% in US/Canada',
      bakuchiol: 'Bakuchiol: non-retinoid from Psoralea corylifolia; activates retinoid receptors via different mechanism; RCT evidence comparable to 0.5% retinol; safe in pregnancy',
    },
    darkSkinConsiderations: 'Dark skin carries higher retinoid risk (PIH) but also higher retinoid benefit (hyperpigmentation is the primary aging concern). The calculus: start lowest dose possible, buffer always, niacinamide alongside, SPF non-negotiable; the anti-aging benefit justifies the extra caution needed in the titration',
  },
  vitaminC: {
    forms: {
      Lascorbic: 'L-ascorbic acid: most potent and best evidenced; unstable (oxidizes rapidly); requires pH <3.5 for skin penetration; effective at 10-20%; may cause irritation',
      ascorbylGlucoside: 'Ascorbyl glucoside: stable; converts to L-ascorbic acid in skin; gentler; effective at 2-5% for comparable clinical outcomes',
      sodiumAscorbylPhosphate: 'Sodium ascorbyl phosphate: very stable; less irritating; converts to active form in skin; well-tolerated in sensitive skin; good choice for melanin-rich skin to avoid oxidation-induced darkening',
      ascorbylTetraisopalmitate: 'Ascorbyl tetraisopalmitate: oil-soluble; very stable; penetrates well; anti-aging and brightening; good for dry or dehydrated skin types',
    },
    mechanisms: {
      collagen: 'Required cofactor for prolyl-4-hydroxylase and lysyl hydroxylase enzymes that hydroxylate proline/lysine residues in procollagen; without it, collagen is unstable',
      antioxidant: 'Neutralizes superoxide, hydroxyl radical, and singlet oxygen in the hydrophilic compartment of skin cells; the primary water-soluble antioxidant defense',
      photoprotection: 'Reduces UV-induced oxidative damage AFTER UV hits skin; not a sunscreen (does not absorb UV) but a scavenger of the ROS UV generates; synergistic with SPF',
      melanin: 'Reduces melanin synthesis by inhibiting copper-dependent tyrosinase enzyme; reduces oxidation of DOPA to dopaquinone (early step in melanin production)',
      regeneration: 'Regenerates vitamin E (tocopherol) from the tocopheroxyl radical; the two antioxidants cycle together to provide combined antioxidant protection',
    },
  },
  niacinamide: {
    mechanism: {
      NAD: 'Niacinamide (nicotinamide) is a precursor to NAD+ and NADP+; these coenzymes power cellular energy production and DNA repair; NAD+ declines with age',
      sirtuins: 'NAD+-dependent sirtuins (SIRT1-7) regulate cellular aging, DNA repair, and metabolic homeostasis; niacinamide increases cellular NAD+ and thereby sirtuin activity',
      melanin: 'Inhibits melanosome transfer from melanocytes to keratinocytes at a concentration of 5%; does not inhibit tyrosinase directly; targets the transfer step',
      barrier: 'Increases ceramide synthesis in keratinocytes: ceramides are the lipid matrix of the stratum corneum; stronger barrier = less TEWL, less environmental damage, less PIH-triggering inflammation',
      antiInflammatory: 'Reduces inflammatory cytokines IL-1β, TNF-α, IL-8; reduces skin redness and the inflammaging cascade',
      poreSize: 'Reduces sebum production and pore visibility by regulation of sebocyte differentiation; aging skin benefits from reduced sebum variation',
    },
    dosing: '5% is optimal for hyperpigmentation; 10% maximum; above 10% can cause flushing reactions in some; 2-5% for sensitive skin; well-tolerated at all Fitzpatrick types',
  },
  peptides: {
    signaling: 'Signal peptides (Matrixyl, Argireline): mimic collagen fragments that signal fibroblasts to produce more collagen; the broken collagen fragment signals repair — peptides replicate this signal without the breakdown',
    carrier: 'Carrier peptides (GHK-Cu, GQPR): deliver trace minerals (copper, manganese) to specific enzymes; GHK-Cu directly activates lysyl oxidase (collagen crosslinking enzyme) and MMP inhibition',
    neurotransmitter: 'Neurotransmitter-inhibiting peptides (Argireline, Leuphasyl): reduce acetylcholine release at neuromuscular junction; relax expression-line muscles; topical effect is modest but measurable',
    
    darkerSkin: 'Peptides are an excellent choice for Fitzpatrick V-VI skin as they produce anti-aging collagen stimulation without the PIH-triggering inflammatory mechanism of retinoids; particularly valuable for cautious anti-aging in Black and Brown skin',
  },
  AHAs: {
    glycolicAcid: {
      mechanism: 'Smallest AHA (molecular weight 76 Da); deepest penetration; loosens desmosomes between corneocytes (dead cells) → desquamation; increases cell turnover',
      antiAging: 'At 5-10%: exfoliation and turnover improvement; at 20-70% (professional): increases dermal collagen by stimulating GAG synthesis; one of few topicals with collagen synthesis evidence beyond retinoids',
      darkSkin: 'Glycolic acid irritation risk increases PIH risk in dark skin; use at lower concentrations (5-8%), lower pH versions, or switch to lactic acid as gentler alternative',
    },
    lacticAcid: {
      mechanism: 'Larger molecule (90 Da); gentler than glycolic; also a humectant (attracts water to skin surface)',
      antiAging: 'Exfoliation + hydration combination; clinical study at 12% lactic acid shows improved skin thickness and collagen density',
      darkSkin: 'Better choice than glycolic for Fitzpatrick IV-VI skin: less irritating, lower PIH risk, dual exfoliation + hydration action',
    },
  },
  SPFscience: {
    UVA_UVB: 'UVB (290-320nm): primary sunburn cause; most direct DNA damage; drives skin cancer; SPF number measures UVB protection. UVA (320-400nm): penetrates deeper; more abundant; primary photoaging cause; PA+ system measures UVA protection',
    SPFnumber: 'SPF 15 blocks ~93% UVB; SPF 30 blocks ~97%; SPF 50 blocks ~98%; SPF 100 blocks ~99%; the jump from 30 to 50 is clinically meaningful for daily use; diminishing returns above 50',
    broadSpectrum: 'Broad-spectrum: covers both UVA and UVB; critical for preventing photoaging, melasma, and PIH even if dark skin is less prone to sunburn',
    mineralVsChemical: 'Mineral (zinc oxide, titanium dioxide): physical UV deflectors; stable; suitable for all skin tones; zinc oxide is broad-spectrum alone; some leave white cast on dark skin (concern for compliance). Chemical filters: absorb UV and convert to heat; no white cast; some reef concern; more options for cosmetically acceptable formulas on dark skin',
    darkSkinCompliance: 'SPF compliance is a real issue for dark skin: white cast from mineral SPFs, belief that dark skin doesn\'t need SPF, cultural messages. Tinted mineral SPFs, lightweight fluid chemical SPFs, and SPF-infused moisturizers improve compliance — formulary matters for habit formation',
    
  },
};

export const TRADITIONAL_LONGEVITY_SCIENCE = {
  adaptogens: {
    
    antiAgingMechanism: 'Chronic stress → elevated cortisol → collagen degradation, inflammaging, premature aging; adaptogens reduce the cortisol spike and improve stress resilience; indirect but significant anti-aging mechanism',
    validated: [
      { name: 'Ashwagandha (Withania somnifera)', mechanism: 'Small trials suggest it may lower stress hormones; may reduce stress-driven skin aging' },
      { name: 'Rhodiola rosea', mechanism: 'Salidroside and rosavins; reduces cortisol; activates AMPK (cellular energy sensor with anti-aging properties); Siberian adaptogen used across Central Asia' },
      { name: 'Panax ginseng', mechanism: 'Ginsenosides; SIRT1 activation; collagen stimulation; 2000+ year history in East Asian anti-aging' },
      { name: 'Holy basil (Ocimum tenuiflorum, tulsi)', mechanism: 'Eugenol, ursolic acid; anti-inflammatory; cortisol modulation; Ayurvedic adaptogen with skin anti-aging evidence' },
      { name: 'Schisandra (Wu wei zi)', mechanism: 'Schisandrins; liver-protective (clearer skin); antioxidant; anti-inflammatory; used in TCM for longevity' },
    ],
  },
  bluezoneCommonalities: {
    overview: 'Blue Zones (Dan Buettner): regions with exceptional centenarian rates — Okinawa Japan, Sardinia Italy, Ikaria Greece, Nicoya Costa Rica, Loma Linda CA. Common anti-aging patterns',
    plantRich: 'All Blue Zone diets are predominantly plant-based; animal protein secondary; plant polyphenols, fiber, and phytochemicals are anti-aging via multiple mechanisms',
    caloric: 'All Blue Zone populations consume fewer calories than sedentary Westerners; mild caloric restriction consistently extends lifespan in animal models; hara hachi bu (Okinawa), small portions (Sardinia)',
    movement: 'Natural movement (gardening, walking, traditional work): daily low-intensity physical activity improves circulation, reduces inflammation, maintains muscle mass that supports skin; not gym exercise but incidental daily movement',
    social: 'Strong social bonds across all Blue Zones: social connection reduces cortisol; loneliness and isolation are measurably associated with accelerated biological aging (shorter telomeres)',
    purpose: 'Ikigai (Japan), plan de vida (Nicoya): sense of purpose/reason to live; psychological meaning reduces chronic stress; documented lower cortisol and inflammatory markers',
    plants: {
      okinawa: 'Goya (bitter melon), imo (purple sweet potato), tofu, green tea, turmeric',
      sardinia: 'Cannonau red wine (high resveratrol), flat bread, sheep\'s milk cheese, legumes, olive oil',
      ikaria: 'Wild greens (foraged), herbal teas (sage, rosemary), olive oil, legumes, modest red wine',
      nicoya: 'Black beans, corn tortillas (nixtamalized — high calcium), squash, tropical fruit, yuca',
      lomaLinda: 'Whole grains, nuts, legumes, avocado (SDA vegetarian diet)',
    },
  },
  fermentedFoods: {
    overview: 'Fermented foods appear in every traditional culture with noted longevity; the mechanisms now understood through gut-skin axis research',
    gutSkinAxis: 'The gut microbiome communicates with skin via systemic circulation of microbial metabolites (SCFAs, vitamins), modulation of systemic immunity, and the gut-brain-skin axis via the vagus nerve',
    SCFA: 'Short-chain fatty acids (SCFAs: butyrate, propionate, acetate) produced by gut bacteria from fiber: reduce systemic inflammation (inflammaging) via inhibition of NF-kB; butyrate also supports skin barrier via epigenetic mechanisms',
    microbiomeAging: 'The aging gut microbiome shows reduced diversity, more pathobionts, less SCFA production — the same dysbiosis seen in chronic skin inflammation; restoring microbiome diversity via fermented foods is a genuine anti-aging intervention',
    topical: 'Topical microbiome also ages: skin microbiome diversity decreases with age; maintaining skin microbiome diversity (avoiding excessive antibacterial products) may be an underrecognized anti-aging strategy',
    examples: {
      kimchi: 'Lactobacillus plantarum W1 from kimchi: RCT shows improved skin hydration, elasticity, and reduced TEWL at 12 weeks',
      
      miso: 'Miso (fermented soybean): isoflavones (phytoestrogens) + probiotic strains; Japanese miso consumption negatively associated with wrinkle depth in epidemiological data',
      injera: 'Injera (Ethiopian teff ferment): probiotic + prebiotic fiber; gut-skin axis benefit; unique to Ethiopian food culture but equivalent benefit to other fermented starches',
      yogurt: 'Yogurt consumption (South Asian, Mediterranean, East African traditions): Lactobacillus acidophilus and L. bulgaricus; anti-inflammatory skin effects via IL-10 upregulation',
    },
  },
  fasting: {
    overview: 'Intermittent fasting (IF) and time-restricted eating (TRE) have robust anti-aging evidence; practiced in various forms across many longevity cultures',
    autophagy: 'Fasting triggers autophagy (cellular self-eating): cells digest and recycle damaged proteins, organelles, and misfolded proteins; autophagy declines with aging and its stimulation is anti-aging at cellular level',
    skinAutophagy: 'Skin autophagy: removes damaged collagen, misfolded proteins, and cellular debris; fasting-stimulated autophagy in skin cells improves dermal quality in animal models',
    inflammation: 'Fasting reduces inflammatory markers (CRP, IL-6, TNF-α); reduces the inflammaging driving skin aging; 16:8 IF reduces these markers measurably in clinical studies',
    cultures: {
      islam: 'Ramadan fasting (Islam): one month of daily dawn-to-sunset fast; Islamic community distributes across all 9 ethnic communities in this guide; Ramadan fasting improves metabolic markers associated with inflammaging',
      ayurveda: 'Upavasa (Ayurvedic fasting): periodic fasting prescribed in Ayurveda for cleansing and longevity; correlates with modern IF evidence',
      okinawa: 'Okinawan hara hachi bu effectively results in mild daily caloric restriction; similar metabolic benefit to IF without full fasting',
    },
  },
};

export const PROFESSIONAL_TREATMENTS_BY_SKIN_TYPE = {
  overview: `Professional anti-aging treatments vary significantly in appropriateness by Fitzpatrick
  type. The same laser or peel that safely treats a Fitzpatrick II patient can cause severe PIH or
  permanent hypopigmentation in a Fitzpatrick V-VI patient. Choosing treatments appropriate for
  skin tone is critical for safety and efficacy.`,

  lasers: {
    ablative: {
      description: 'Ablative lasers (CO2, Er:YAG): vaporize outer skin layers; dramatic resurfacing; significant recovery',
      suitability: 'Fitzpatrick I-III: good candidates with experienced operator; Fitzpatrick IV: high risk; V-VI: contraindicated without specialist experience; PIH and scarring risk significant in dark skin',
      alternatives: 'For dark skin: non-ablative options; RF microneedling; chemical peels at appropriate depth',
    },
    nonAblative: {
      description: 'Non-ablative fractional lasers (1540nm, 1927nm): heat dermis without removing epidermis; less dramatic but safer across more skin tones',
      suitability: 'Fitzpatrick I-IV: suitable; V-VI: possible with very conservative settings and experienced practitioner; less PIH risk than ablative',
      
    },
    pico: {
      description: 'Picosecond lasers (PicoWay, PicoSure): ultra-short pulses; less thermal injury; good for pigmentation treatment across more skin tones',
      suitability: 'Fitzpatrick I-V: reasonable evidence of safety; VI: requires expertise; significantly safer than nanosecond Q-switched lasers for dark skin',
      antiAging: 'Treats age spots, solar lentigines, uneven tone; also some collagen remodeling effect from acoustic wave generation',
    },
    IPL: {
      description: 'Intense Pulsed Light (IPL): broad spectrum light; treats pigmentation and vascular concerns; not a laser',
      suitability: 'Fitzpatrick I-III: good; IV: caution; V-VI: generally avoid; melanin-rich skin absorbs too much energy → burns and PIH risk',
      alternatives: 'Dark skin alternatives: tranexamic acid topical, niacinamide, azelaic acid, vitamin C — address pigmentation without PIH risk',
    },
  },
  chemicalPeels: {
    superficial: {
      description: 'Superficial peels: <30% glycolic acid, Jessner\'s solution, 20-30% salicylic acid, low TCA',
      suitability: 'Fitzpatrick I-IV: suitable; V-VI: use with caution at lower concentrations; lactic acid peels safer than glycolic for dark skin',
      antiAging: 'Exfoliation + cell turnover; modest collagen stimulation; significant improvements in hyperpigmentation in series of treatments',
    },
    medium: {
      description: 'Medium depth peels: 35-50% TCA, combination Jessner\'s + TCA; penetrate to papillary dermis',
      suitability: 'Fitzpatrick I-III: suitable; IV: high risk for PIH; V-VI: contraindicated by most guidelines',
      
    },
    darkSkinSafe: {
      options: 'Safer chemical peels for dark skin: salicylic acid 20-30% (beta hydroxy, less irritating), mandelic acid (larger molecule, slower penetration), lactic acid 50%+ (by trained professional)',
      mandelic: 'Mandelic acid: derived from bitter almonds; larger molecular weight = slower, more uniform penetration; antibacterial and anti-aging; less PIH risk than glycolic; preferred for Fitzpatrick IV-VI',
      salicylicForDark: 'Salicylic acid 30%: lipophilic; penetrates follicles; anti-inflammatory; well-tolerated by dark skin; improves acne-driven PIH; mild collagen-stimulating effect at professional concentrations',
    },
  },
  microneedling: {
    description: 'Microneedling (collagen induction therapy): fine needles create controlled micro-injuries; triggers wound healing cascade → collagen and elastin synthesis',
    suitability: 'Fitzpatrick I-VI: one of the few anti-aging treatments safe across all skin tones; does not generate UV-absorbing thermal energy; PIH risk is low with proper technique and depth',
    mechanism: 'Needle punctures trigger platelet degranulation, growth factor release (TGF-β, PDGF, VEGF), fibroblast activation → Type I and III collagen synthesis',
    
    RF: 'Radiofrequency microneedling (RF microneedling / Morpheus8): adds RF energy delivered through insulated needles; heats dermis below epidermis; collagen remodeling without epidermal thermal damage; appropriate for Fitzpatrick I-VI with care',
    PRP: 'PRP (platelet-rich plasma) combined with microneedling: centrifuged patient blood applied during/after treatment; growth factor delivery directly into micro-channels; popular; clinical evidence variable but growing',
  },
  injectables: {
    botox: {
      description: 'Botulinum toxin (Botox, Dysport, Xeomin): temporarily paralyzes facial muscles; prevents expression-line formation; does not address structural or pigmentation aging',
      suitability: 'All Fitzpatrick types; technique adaptations for different facial anatomy; less commonly used in darker skin communities partly due to cultural norms and access barriers',
      antiAging: 'Prevention effect: preventing repeated muscle contraction prevents dynamic lines deepening into static lines; best results when started before lines are deeply etched',
    },
    fillers: {
      description: 'HA fillers (Juvederm, Restylane), biostimulators (Sculptra poly-L-lactic acid, Radiesse CaHA): restore volume, stimulate collagen',
      darkSkinConsiderations: 'Volume loss is often the primary structural aging sign in darker-skinned populations (subcutaneous fat loss from ~50s); fillers address this directly',
      keloidRisk: 'Injection in keloid-prone individuals (East African, West African populations): risk of hypertrophic or keloid reaction at injection site; discuss risk/benefit carefully',
      biostimulators: 'Poly-L-lactic acid (Sculptra): stimulates fibroblasts to produce collagen over 3-6 months; results develop gradually; particularly effective for volume loss and skin quality in darker skin',
    },
  },
  microneedlingForDarkSkin: {
    whyPreferred: 'Microneedling with topical vitamin C, hyaluronic acid, or PRP is the most broadly safe professional anti-aging treatment for dark skin; it avoids the thermal and oxidative stress that ablative lasers and aggressive peels generate in melanin-rich skin',
    protocol: 'Professional microneedling series: 3-6 sessions 4-6 weeks apart; home care: vitamin C + SPF AM; peptides + ceramides PM; no retinol for 1 week post-treatment',
    depths: '0.5mm: superficial texture and hyperpigmentation; 1.0mm: anti-aging collagen remodeling; 1.5-2.0mm: deeper scarring and advanced anti-aging (professional only, risk increases)',
  },
};

export const DIET_AND_SKIN_AGING_SCIENCE = {
  

  glycation: {
    definition: 'Glycation: non-enzymatic reaction between sugars (glucose, fructose) and proteins or lipids; forms advanced glycation end products (AGEs)',
    skinEffect: 'AGEs crosslink collagen fibers → stiff, yellow-tinged, less elastic collagen; accumulation of glycation-crosslinked collagen is a major contributor to aged skin appearance and loss of elasticity',
    rate: 'Glycation begins to accumulate from the 20s; significantly increases post-40; accelerated by high dietary sugar, diabetes, UV exposure (photo-oxidation-driven glycation)',
    antiGlycation: {
      dietary: 'Reduce added sugar and refined carbohydrates; low-glycemic diet in studies associates with fewer wrinkles; every 100g/day increase in carbohydrates associated with increased photoaging score in epidemiological data',
      cooking: 'High-heat, dry cooking methods (grilling, frying) produce dietary AGEs that can be absorbed; lower-heat, moist cooking (boiling, steaming, stewing) produces fewer dietary AGEs; traditional stewing methods (Ethiopian wot, Caribbean stews, South Asian curries) are AGE-appropriate cooking methods',
      
    },
  },

  oxidativeLoad: {
    principle: 'Oxidative stress (ROS exceeding antioxidant capacity) drives collagen degradation, inflammation, DNA damage, and pigmentation changes — all aging mechanisms; diet is the primary source of antioxidant capacity',
    ORAC: 'ORAC (Oxygen Radical Absorbance Capacity): measure of antioxidant capacity of foods; berries, moringa, baobab, pomegranate, dark chocolate, green tea among highest',
    antioxidantFoods: {
      berries: 'Blueberries, blackberries, açaí: anthocyanins; EGCG; quercetin; among highest ORAC values; epidemiological data links high berry intake with reduced skin aging markers',
      darkGreenLeaves: 'Kale, spinach, collard greens (traditional Black American), kontomire (Ghanaian): vitamin K, lutein, zeaxanthin, vitamin C; anti-inflammatory; contribute to skin antioxidant pool',
      spices: 'Turmeric (curcumin), black pepper (piperine), ginger (gingerols), cinnamon (cinnamaldehyde), cloves (eugenol): some of the highest antioxidant concentrations per gram of any food; all present in multiple communities\' traditional cuisines',
      darkChocolate: 'Cacao 70%+: procyanidins; flavanols; clinical evidence for reduced wrinkle depth and improved elasticity at 326mg/day flavanols (small RCT)',
    },
  },

  proteinAndCollagen: {
    collagenAminos: 'Dietary amino acids are the raw materials for collagen synthesis; rate-limiting amino acids: glycine, proline, hydroxyproline, lysine',
    glycine: 'Glycine: most abundant amino acid in collagen; not "essential" but "conditionally essential" — the body cannot produce enough for maximum collagen synthesis; dietary sources: bone broth, gelatin, pork skin, legumes',
    lysine: 'Lysine: essential amino acid; required for collagen crosslinking by lysyl oxidase; dietary sources: meat, poultry, legumes, dairy; vegan diets may be lysine-limited which affects collagen crosslinking capacity',
    boneBroth: 'Bone broth (caldo de pollo, Ethiopian berbere stews, Asian pho/ramen broth): collagen hydrolysate and gelatin-rich; glycine and proline content; same mechanistic basis as commercial collagen supplements at lower dose',
    plantProtein: 'Plant protein can be collagen-sufficient if well-planned: lysine from legumes, glycine from a variety of plants; complete protein from quinoa, soy, buckwheat, and hemp seed',
  },

  antiInflammatoryDiets: {
    principle: 'Inflammaging (chronic low-grade inflammation driving skin aging) is significantly modulated by diet; anti-inflammatory diets reduce systemic inflammatory markers (CRP, IL-6) that drive MMP upregulation and collagen breakdown',
    Mediterranean: {
      
      components: 'Olive oil (oleocanthal anti-inflammatory), fish (omega-3), legumes, whole grains, vegetables, fruits, moderate wine (resveratrol); limited red meat and processed food',
      skinStudy: 'Study of 1264 people: high adherence to Mediterranean diet associated with significantly fewer actinic keratoses (precancerous UV-damaged skin) vs. low adherence',
    },
    omega3Balance: {
      ratio: 'Western diet omega-6:omega-3 ratio approximately 15:1 (target 4:1 or lower for anti-inflammatory); this ratio imbalance drives systemic inflammation',
      
    },
    sugar: {
      refined: 'Added sugar and refined carbohydrates: drive glycation, gut dysbiosis, insulin spikes (insulin-driven growth factors that can worsen PIH in dark skin), and systemic inflammation',
      targets: 'WHO recommendation: <25g added sugar/day; most Western diets average 80-100g/day; traditional diets across all 9 communities historically contained minimal added sugar',
    },
  },

  specificNutrients: {
    vitaminA: {
      dietary: 'Dietary vitamin A (retinol from animal sources; beta-carotene from plants → converted to retinol in body): essential for skin cell differentiation, cornification, and sebum production',
      deficiency: 'Vitamin A deficiency causes hyperkeratosis (rough, bumpy skin), impaired wound healing, and Bitot\'s spots; severe deficiency affects skin aging rate',
      
      topical: 'Topical retinoids (vitamin A derivatives) are the most evidence-backed anti-aging topical; dietary vitamin A supports but does not replace topical retinoids',
    },
    vitaminD: {
      function: 'Vitamin D (calcitriol) regulates keratinocyte proliferation and differentiation; anti-inflammatory; modulates immune response in skin',
      
      skinEffect: 'Deficiency: impaired barrier function, increased skin inflammation, worsened atopic dermatitis, reduced wound healing speed',
      
      antiAging: 'Adequate vitamin D: anti-inflammatory (reduces IL-6, TNF-α); some evidence for improved skin barrier function and reduced age-related skin inflammation',
    },
    zinc: {
      function: 'Zinc: cofactor for 300+ enzymes; essential for collagen crosslinking (lysyl oxidase), DNA repair, immune function, wound healing, and sebum regulation',
      aging: 'Zinc absorption decreases with aging; elderly populations frequently zinc-insufficient; zinc insufficiency impairs wound healing (anti-aging tissue repair)',
      
      topical: 'Topical zinc (zinc oxide, zinc pyrithione): anti-inflammatory, antimicrobial; reduces post-acne PIH by reducing acne-driven inflammation',
    },
    selenium: {
      function: 'Selenium: cofactor for glutathione peroxidase (the body\'s primary antioxidant enzyme system); thyroid function (thyroid hormones regulate skin cell turnover)',
      photoprotection: 'Selenium supplementation reduces UV-induced skin damage in some studies; Brazilian nuts (2/day = adequate selenium), sea moss, teff, fish',
      deficiency: 'Selenium deficiency: increased oxidative stress, impaired antioxidant defenses, hypothyroid tendency → slower skin cell turnover → dullness and texture changes that register as aging',
    },
  },
};

export const SKIN_AGING_MYTHS_AND_FACTS = {
  overview: 'Common misconceptions about skin aging that persist across communities, corrected with current evidence.',

  myths: [
    {
      myth: '"Black skin doesn\'t need sunscreen"',
      fact: 'Melanin gives meaningful protection but far from complete. SPF 30 provides 97% UVB blockage. Dark skin still experiences photoaging, hyperpigmentation from UV exposure, and elevated melanoma risk on acral (palm, sole) and mucosal areas. Sunscreen is recommended for all Fitzpatrick types.',
      relevantCommunities: ['west-african', 'black-american', 'east-african', 'south-african'],
    },
    {
      myth: '"Natural ingredients are always safe for skin"',
      fact: 'Many natural ingredients are potent sensitizers, irritants, or allergens. Essential oils (lavender, tea tree, citrus) commonly cause contact dermatitis. Undiluted lemon juice causes phytophotodermatitis. "Natural" does not mean safe. The dose, concentration, and application method matter as much as the origin.',
      relevantCommunities: ['all'],
    },
    {
      myth: '"More expensive skincare means more effective anti-aging"',
      
      relevantCommunities: ['all'],
    },
    {
      myth: '"If a product tingles, it\'s working"',
      fact: 'Tingling is a sign of irritation, not efficacy. Retinoids cause a "retinoid reaction" (peeling, redness) in the first weeks, but the anti-aging benefits do not require this — irritation should be minimized. For melanin-rich skin, tingling often precedes PIH. A non-irritating product that maintains barrier health may be more anti-aging than an irritating one.',
      relevantCommunities: ['west-african', 'black-american', 'south-asian', 'east-african'],
    },
    {
      myth: '"Collagen creams restore collagen in skin"',
      fact: 'Topical collagen molecules are too large to penetrate the dermis where collagen is made. Collagen creams work as moisturizers (hydrating protein film on skin surface) but cannot replace lost dermal collagen. Collagen STIMULANTS (retinoids, vitamin C, peptides, microneedling) actually increase collagen production. Oral collagen peptides (small enough to absorb) have genuine evidence for stimulating endogenous collagen synthesis.',
      relevantCommunities: ['all'],
    },
    {
      myth: '"Oil-based skincare causes breakouts and should be avoided for anti-aging"',
      fact: 'Comedogenicity depends on the specific oil and the individual. Many non-comedogenic oils (rosehip, argan, marula, moringa, squalane) are anti-aging and anti-acne when chosen correctly. Face oils applied correctly (after water-based products, not to already-oily areas) can improve barrier function, deliver antioxidants, and support anti-aging. Traditional communities have used face oils for millennia — shea, argan, olive, coconut (non-face) — with positive skin outcomes.',
      relevantCommunities: ['all'],
    },
    {
      myth: '"Facial exercises prevent aging"',
      fact: 'Facial exercises are largely ineffective for anti-aging and can worsen dynamic wrinkles by increasing muscle activity that creases skin. The exception is facial massage (not exercises): gentle massage improves lymphatic drainage, increases blood flow, and provides some temporary lifting. The contrast: facial yoga = no evidence; facial massage = modest evidence for circulation and temporary improvement.',
      relevantCommunities: ['latina', 'east-asian'],
    },
    {
      myth: '"SPF in makeup provides adequate protection"',
      fact: 'Most people apply 1/4 to 1/5 of the amount of makeup needed to achieve the labeled SPF. SPF 15 foundation applied at typical makeup amounts provides SPF 3-5 equivalent. A dedicated SPF product applied under makeup is required for meaningful protection. SPF in primer or foundation is an insufficient daily photo-protection strategy.',
      relevantCommunities: ['all'],
    },
    {
      myth: '"Traditional remedies are scientifically unproven and ineffective"',
      fact: 'Many traditional anti-aging ingredients are now among the best-evidenced in the scientific literature. Aloe vera: RCT evidence for collagen increase in postmenopausal women. Pomegranate extract: multiple RCTs showing elasticity improvement. Red ginseng: RCT showing significant wrinkle reduction. Green tea EGCG: measurable photoprotective effect in humans. The evidence base for traditional ingredients is growing rapidly. Traditional ≠ unscientific.',
      relevantCommunities: ['all'],
    },
    {
      myth: '"Anti-aging skincare is only important after wrinkles appear"',
      fact: 'The most impactful anti-aging decade is the 20s, before any damage is visible. Cumulative UV damage accumulates silently for decades before manifesting as photoaging. Starting SPF and vitamin C at 20 provides 20 years of UV prevention before the first wrinkle appears. Retinoids are most effective when started in the 30s — before extensive collagen loss — rather than in the 50s trying to reverse significant structural change.',
      relevantCommunities: ['all'],
    },
    {
      myth: '"Hyaluronic acid plumps skin by hydrating deeper skin layers"',
      fact: 'Topical hyaluronic acid (typical molecular weight 1000-1500 kDa) cannot penetrate the stratum corneum to reach the dermis. Its hydrating effect is superficial — it forms a moisture-trapping film on the skin surface and draws water from the environment and upper skin layers. This provides real but surface-level plumping. Injectable HA fills the dermis directly — that\'s where the structural plumping occurs. Low molecular weight HA (<50 kDa) may penetrate slightly deeper but the evidence is mixed.',
      relevantCommunities: ['all'],
    },
    {
      myth: '"Darker skin tones age the same way as lighter skin tones, just later"',
      fact: 'Darker skin tones do not simply age "the same way but slower." The aging pattern is qualitatively different: lighter skin ages primarily through wrinkle formation and volume loss; darker skin ages primarily through hyperpigmentation changes, uneven tone, and elasticity loss — with wrinkles appearing significantly later. This means the treatment priorities are different: hyperpigmentation management is the priority for dark skin, not wrinkle reduction. Misapplying light-skin anti-aging protocols to dark skin (e.g., aggressive peeling for wrinkles) can cause PIH and worsened appearance.',
      relevantCommunities: ['west-african', 'black-american', 'east-african', 'south-african', 'south-asian'],
    },
  ],
};

export const ANTI_AGING_SKINCARE_ROUTINES_BY_COMMUNITY = {
  overview: `These routines integrate the community-specific traditional ingredients with modern evidence-based
  actives. They are designed around the primary aging concerns of each community's typical Fitzpatrick type,
  while respecting the science of ingredient layering and interaction. All routines include SPF as non-negotiable.`,

  'west-african': {
    morningRoutine: [
      { step: 1, product: 'Cleanser', detail: 'Gentle foaming cleanser (pH 5.5); traditional dudu osun (black soap) optional 2-3x/week for exfoliating cleanser effect' },
      { step: 2, product: 'Vitamin C serum', detail: 'Sodium ascorbyl phosphate 10% or L-ascorbic acid 15% (more stable form for dark skin; oxidized vitamin C can worsen hyperpigmentation)' },
      { step: 3, product: 'Niacinamide', detail: '5-10% niacinamide for hyperpigmentation prevention and barrier support; the anti-PIH priority ingredient' },
      { step: 4, product: 'Moisturizer', detail: 'Lightweight ceramide moisturizer or shea-butter enriched cream (traditional and evidence-backed); hyaluronic acid for dehydration' },
      { step: 5, product: 'SPF', detail: 'SPF 50+ broad-spectrum; tinted mineral SPF for even tone; "Black don\'t crack" does NOT mean skip SPF — melanin is not enough protection on its own' },
    ],
    eveningRoutine: [
      { step: 1, product: 'Oil cleanser', detail: 'Moringa oil or baobab oil as first cleanse; dissolves sunscreen and makeup; delivers antioxidants' },
      { step: 2, product: 'Water cleanser', detail: 'Second cleanse: gentle pH-balanced cleanser' },
      { step: 3, product: 'Azelaic acid', detail: '15-20% azelaic acid 3-4 nights/week: dual anti-acne and anti-pigmentation; excellent for PIH prevention; well-tolerated in dark skin' },
      { step: 4, product: 'Retinol (titrate slowly)', detail: '0.01-0.025% retinol maximum start; once weekly; on top of moisturizer (buffer method); niacinamide beforehand; extremely slow titration' },
      { step: 5, product: 'Moisturizer/oil', detail: 'Shea butter or moringa oil as occlusive; locks in moisture; vitamin E from shea provides overnight antioxidant' },
    ],
    supplementProtocol: ['Palm oil (dietary, tocotrienols)', 'Moringa powder in smoothies (antioxidant, collagen cofactors)', 'Baobab powder (vitamin C)', 'Omega-3 from fish (anti-inflammatory)'],
  },

  'south-asian': {
    morningRoutine: [
      { step: 1, product: 'Cleanser', detail: 'Gentle milky cleanser; avoid harsh sulfates that disrupt barrier' },
      { step: 2, product: 'Tranexamic acid', detail: '2-3% tranexamic acid: first-line for melasma (the primary South Asian aging concern); excellent safety profile; can use daily' },
      { step: 3, product: 'Vitamin C', detail: 'Ascorbyl glucoside 5% or ascorbyl tetraisopalmitate 3%: stable forms; brightening + collagen; avoids irritation in melasma-prone skin' },
      { step: 4, product: 'Moisturizer', detail: 'Lightweight gel-cream; include centella asiatica (gotu kola — Ayurvedic herb with collagen-synthesis evidence) if available' },
      { step: 5, product: 'SPF', detail: 'SPF 50+ PA++++ essential; melasma is a UV-activated condition; no SPF = melasma treatment is futile; reapply every 2 hours in direct sun' },
    ],
    eveningRoutine: [
      { step: 1, product: 'Cleansing oil', detail: 'Coconut or sesame oil first cleanse (traditional Ayurvedic abhyanga principle at micro scale); dissolves impurities' },
      { step: 2, product: 'Second cleanse', detail: 'Gentle surfactant cleanser' },
      { step: 3, product: 'Niacinamide', detail: '5-10% niacinamide for melanin transfer inhibition; compatible with tretinoin (apply separately)' },
      { step: 4, product: 'Tretinoin/retinol', detail: 'Tretinoin 0.025% (prescription) or retinol 0.025-0.05%; slow titration; buffer method; addresses both hyperpigmentation AND collagen loss' },
      { step: 5, product: 'Amla extract or turmeric moisturizer', detail: 'Curcumin cream or amla oil as overnight treatment; traditional ingredients with anti-inflammatory and brightening evidence' },
    ],
    supplementProtocol: ['Chyawanprash (amla-based tonic — traditional rasayana)', 'Turmeric 500mg + piperine supplement', 'Ashwagandha 300-600mg KSM-66 extract (cortisol reduction)', 'Oral collagen peptides 5-10g + vitamin C'],
  },

  'east-asian': {
    morningRoutine: [
      { step: 1, product: 'Gentle cleanser', detail: 'Low-pH cleanser (5.5); avoid alkaline cleansers that disrupt acid mantle; double cleanse only at night' },
      { step: 2, product: 'Essence/toner', detail: 'Fermented galactomyces filtrate toner or rice ferment water; layering lightweight hydration (the K-beauty essence step); pitera or similar' },
      { step: 3, product: 'Antioxidant serum', detail: 'Green tea EGCG serum or vitamin C 10%; photoprotection + collagen; layer thin before heavier products' },
      { step: 4, product: 'Moisturizer', detail: 'Lightweight gel-cream; snail secretion filtrate (popular K-beauty: mucin + allantoin for skin repair); ceramide base' },
      { step: 5, product: 'SPF', detail: 'SPF 50+ PA++++ (PA++++ specifically: East Asian SPF culture pioneered UVA measurement; many Asian SPFs have superior UVA protection); reapply if outdoors' },
    ],
    eveningRoutine: [
      { step: 1, product: 'Oil cleanse', detail: 'Camellia oil or light cleansing oil; traditional Japanese tsubaki (camellia) for face cleansing' },
      { step: 2, product: 'Water cleanse', detail: 'Low-pH gel cleanser' },
      { step: 3, product: 'Essence layers', detail: 'Sheet mask 2-3x/week (Korean ritual); or ferment filtrate essence multiple applications (the "7-skin method" moisturizing technique)' },
      { step: 4, product: 'Retinol/bakuchiol', detail: 'Retinol 0.025-0.05% (Fitzpatrick III) or bakuchiol 0.5% (gentler for sensitive skin or retinoid-intolerant); ginseng extract as alternative collagen stimulant' },
      { step: 5, product: 'Sleeping pack', detail: 'Korean sleeping pack (thick cream/gel mask left overnight): additional hydration sealing; many contain fermented ingredients, ginseng, or centella' },
    ],
    supplementProtocol: ['Green tea 2-5 cups/day or EGCG supplement 400mg', 'Korean red ginseng extract (홍삼) daily', 'Oral collagen peptides 5g + vitamin C', 'Fermented foods daily (kimchi, miso, kefir)', 'Oily fish 3x/week (omega-3)'],
    okinawanDietBasics: ['Hara hachi bu (eat to 80% full)', 'Purple sweet potato as staple starch', 'Tofu and miso (soy isoflavones)', 'Bitter melon (goya)', 'Seaweed (kelp, wakame)', 'Turmeric (ukon)'],
  },

  'black-american': {
    morningRoutine: [
      { step: 1, product: 'Gentle cleanser', detail: 'Non-stripping surfactant cleanser; avoid harsh sulfates that compromise barrier (fragile in deeply dark skin)' },
      { step: 2, product: 'Vitamin C', detail: 'Sodium ascorbyl phosphate 10% (stable form): antioxidant + collagen + hyperpigmentation; safe for very dark skin; avoid L-ascorbic in oxidizing conditions' },
      { step: 3, product: 'Niacinamide', detail: '10% niacinamide: the workhorse anti-aging active for Black American skin; addresses hyperpigmentation, barrier, and NAD+ pathway simultaneously' },
      { step: 4, product: 'Moisturizer', detail: 'Ceramide-rich cream; occlusive for dehydration prevention; JBCO 1-2 drops mixed in (for facial anti-aging); shea butter for body' },
      { step: 5, product: 'SPF', detail: 'SPF 50+ broad-spectrum; tinted mineral or fluid chemical formula for compliance; "We need sunscreen too" is the cultural education piece that has the most impact' },
    ],
    eveningRoutine: [
      { step: 1, product: 'Double cleanse', detail: 'Oil first (JBCO blend or moringa oil); water-based second' },
      { step: 2, product: 'Niacinamide', detail: 'Niacinamide 5-10% before retinol: reduces retinoid-induced irritation → reduces PIH risk; critical step for dark skin retinol users' },
      { step: 3, product: 'Retinol (ultra-conservative start)', detail: '0.01-0.025% maximum start; on top of moisturizer; once weekly for 6 weeks minimum; any irritation = stop and wait; PIH from retinoid irritation can last 6-12 months' },
      { step: 4, product: 'Peptide serum (alternating)', detail: 'On non-retinol nights: GHK-Cu copper peptides or Matrixyl 3000; collagen stimulation without irritation risk; ideal for the 5 nights/week not doing retinol' },
      { step: 5, product: 'Rich moisturizer', detail: 'Ceramide cream + JBCO for scalp (if applying to hairline/scalp as anti-aging scalp treatment); thick shea for occlusion if needed' },
    ],
    supplementProtocol: ['Oral collagen 5-10g + vitamin C 500mg', 'Omega-3 (EPA+DHA) 2g/day (anti-inflammatory)', 'Niacinamide oral 500mg (systemic NAD+ support — separate from topical)',  'Vitamin D3 (Black Americans are disproportionately deficient; vitamin D affects skin cell function)'],
    restProtocol: {
      minimumSleep: '7-9h in a darkened room; phone outside bedroom or blue-light blocked after 9pm',
      trackerNote: 'Track sleep quality (app or wearable): slow-wave sleep quality is the anti-aging variable, not just duration',
      napMinistry: 'Rest as resistance: recuperative rest is anti-aging, anti-inflammaging, and a self-care practice with cultural resonance for Black American women navigating chronic stress',
    },
  },
};

export const GUT_SKIN_AGING_AXIS = {
  overview: `The gut-skin axis is now a recognized and extensively studied connection. The gut microbiome
  communicates with skin via systemic inflammatory signals, circulating microbial metabolites, and the
  neuroendocrine system. Aging disrupts both the gut microbiome and skin health simultaneously — and
  interventions that support gut health have measurable skin anti-aging effects.`,

  microbiomeChanges: {
    young: 'Young, healthy gut microbiome: diverse, Lactobacillus and Bifidobacterium rich, high SCFA production, intact mucosal barrier',
    aging: 'Aged gut microbiome: decreased diversity, decreased Bifidobacterium, increased Proteobacteria (pro-inflammatory), decreased SCFA production, increased intestinal permeability (leaky gut)',
    consequence: 'Aged microbiome → increased lipopolysaccharide (LPS) translocation → systemic inflammation → elevated IL-6, TNF-α, CRP → inflammaging → collagen degradation → skin aging',
  },

  skinMicrobiome: {
    balance: 'Skin microbiome (Cutibacterium acnes, Staphylococcus epidermidis, Malassezia): maintains skin pH, outcompetes pathogenic bacteria, modulates local immunity',
    aging: 'Aged skin microbiome: decreased diversity, increased pH (from weakened barrier), increased Staphylococcus aureus colonization, increased inflammatory tone',
    interventions: [
      'Avoid antibacterial soaps that disrupt skin microbiome',
      'Prebiotics in skincare (inulin, fructooligosaccharides) support beneficial skin bacteria',
      'Probiotic skincare (live cultures): emerging category with growing evidence',
      'Postbiotics in skincare (ferment filtrates, lysates): more stable than live probiotics; good evidence for skin barrier and anti-inflammatory effects',
    ],
  },

  dietarySupport: {
    fiber: 'Dietary fiber (25-38g/day): feeds Bifidobacterium and Lactobacillus; drives SCFA production; the most impactful gut microbiome anti-aging intervention',
    fermented: 'Fermented foods (kimchi, kefir, yogurt, miso, injera, amasi): add live cultures; cross-cultural tradition with shared anti-aging mechanism',
    polyphenols: 'Dietary polyphenols (berries, green tea, pomegranate, olive oil): prebiotic effect on gut microbiome; also direct anti-inflammatory in gut',
    omega3: 'Omega-3 fatty acids: anti-inflammatory in gut; reduce LPS-driven leaky gut effects; improve gut microbiome diversity',
    sugar: 'Reduce added sugar and refined carbohydrates: drives gut dysbiosis; also drives skin glycation; dual skin aging mechanism to avoid',
  },

  supplementation: {
    probiotics: {
      Lactobacillus: {
        rhamnosus: 'L. rhamnosus GG: most studied; RCT evidence for skin hydration and barrier improvement; reduces atopic dermatitis in children; gut-to-skin immune modulation',
        plantarum: 'L. plantarum (from kimchi, fermented foods): RCT evidence for skin moisture, elasticity, and wrinkle reduction at 12 weeks; TEWL reduction measurable',
        acidophilus: 'L. acidophilus: anti-inflammatory via IL-10 upregulation; reduces gut permeability',
      },
      Bifidobacterium: {
        longum: 'B. longum: reduces skin sensitivity and reactivity; anti-inflammatory via reducing TNF-α; RCT shows reduced transient skin redness and sensitivity',
        breve: 'B. breve: improves skin hydration; studied in skin aging context; measurably reduces TEWL',
      },
      
    },
    prebiotics: {
      inulin: 'Inulin and FOS (fructooligosaccharides): preferentially feed Bifidobacterium; measurably increase fecal Bifidobacterium counts and SCFA production',
      
    },
  },
};

export const TRADITIONAL_ANTI_AGING_INGREDIENT_DATABASE = {
  overview: `A reference database of traditional botanicals used across the 9 communities for
  skin anti-aging and longevity. Each entry includes the ethnobotanical context, the identified
  bioactive compounds, the proposed anti-aging mechanism, and the current state of clinical evidence.`,

  sheaButter: {
    origin: 'West Africa (Vitellaria paradoxa)',
    communities: ['west-african', 'black-american'],
    bioactives: ['Tocopherols (vitamin E)', 'Oleanolic acid', 'Lupeol', 'Karitene', 'Stearic acid', 'Oleic acid', 'Triterpene acetates'],
    antiAgingMechanisms: ['Antioxidant (tocopherol — lipid-soluble free radical scavenger)', 'Tyrosinase inhibition (oleanolic acid — reduces hyperpigmentation)', 'Skin barrier reinforcement (stearic + oleic acid replenish lipid matrix)', 'Anti-inflammatory (lupeol — 5-alpha reductase inhibitor)', 'Mild UV absorption (karitene fraction)'],
    evidenceLevel: 'Moderate: strong in vitro evidence; clinical evidence primarily for moisturization and wound healing; anti-aging extrapolated from mechanism',
    traditionalUse: 'Pan-West African: daily body application from infancy; Yoruba, Akan, Hausa, Wolof traditions',
    modernFormulations: 'Found in: body butters, lip balms, hair creams; increasingly in facial skincare as clean beauty ingredient; raw unrefined shea retains more bioactives than refined',
  },

  moringa: {
    origin: 'Nigeria, Ghana, Senegal, East Africa, South Asia (Moringa oleifera)',
    communities: ['west-african', 'east-african', 'south-african'],
    bioactives: ['Behenic acid (22:0)', 'Zeatin (cytokinin)', 'Vitamin C', 'Quercetin', 'Kaempferol', 'Chlorogenic acid', 'Sulfur compounds (isothiocyanates)'],
    antiAgingMechanisms: ['Cytokinin (zeatin): may delay cellular senescence — plant hormones that slow plant cell aging may have analogous mammalian effects', 'Antioxidant (quercetin, kaempferol, chlorogenic acid)', 'Oxidative stability (behenic acid): the oil resists rancidity — stable oil that delivers antioxidants without pro-oxidant degradation products', 'Anti-inflammatory (isothiocyanates reduce NF-kB activation)'],
    evidenceLevel: 'Moderate: strong antioxidant evidence; zeatin anti-aging mechanism is biologically plausible; clinical skin RCTs limited',
    traditionalUse: 'Yoruba traditional medicine for skin brightening; East African use for wound healing; pan-African as nutritional supplement ("miracle tree")',
    modernFormulations: 'Moringa oil in premium skincare serums; moringa powder in nutritional supplements and smoothies; MoringaLife and similar brands',
  },

  baobab: {
    origin: 'Sub-Saharan Africa (Adansonia digitata)',
    communities: ['west-african', 'east-african', 'south-african'],
    bioactives: ['Vitamin C (highest of any fruit tested)', 'Omega 3, 6, 9 fatty acids', 'Triterpenes', 'Polyphenols', 'Mucilaginous polysaccharides'],
    antiAgingMechanisms: ['Collagen synthesis cofactor (vitamin C — rate-limiting step in hydroxylation)', 'Barrier reinforcement (omega fatty acid blend)', 'Anti-inflammatory (triterpenes)', 'Wound healing acceleration (polysaccharides stimulate keratinocyte migration)'],
    evidenceLevel: 'Moderate: vitamin C content well-documented; clinical anti-aging trials limited; strong mechanistic basis',
    traditionalUse: 'Eaten fresh and dried across West, East, and Southern Africa; baobab powder in skin preparations; bark used in traditional medicine',
    modernFormulations: 'Baobab oil in luxury skincare; baobab powder supplement and functional food',
  },

  blackSeed: {
    origin: 'Middle East, North Africa (Nigella sativa)',
    communities: ['arab', 'south-asian', 'east-african'],
    bioactives: ['Thymoquinone (TQ)', 'Carvacrol', 'Thymohydroquinone', 'Nigellicine', 'Nigellidine', 'Fixed oils (linoleic acid dominant)'],
    antiAgingMechanisms: ['TQ: potent NF-kB inhibitor (master inflammaging switch)', 'TQ: SIRT1 activator via indirect pathway (anti-aging sirtuin activation)', 'Fibroblast stimulation: black seed oil increases procollagen synthesis in wound-healing studies', 'Antioxidant: radical scavenging across multiple ROS species'],
    evidenceLevel: 'Strong for anti-inflammatory; moderate for skin anti-aging specifically; oral and topical evidence accumulating',
    traditionalUse: 'Prophetic medicine: "a cure for everything except death" (Hadith); 2000+ year use in Middle East, South Asia; topical and internal use',
    modernFormulations: 'Nigella sativa oil in modern natural skincare; thymoquinone-standardized extracts in supplement market',
  },

  pomegranate: {
    origin: 'Iran/Middle East (Punica granatum); now pan-Mediterranean and global',
    communities: ['arab', 'south-asian', 'east-african'],
    bioactives: ['Punicalagins (largest polyphenol MW in plant world)', 'Punicalins', 'Ellagic acid', 'Punicic acid (conjugated linolenic acid)', 'Anthocyanins', 'Hydroxycinnamic acids'],
    antiAgingMechanisms: [ 'Ellagic acid: tyrosinase inhibition (brightening); anti-inflammatory', 'Punicic acid in seed oil: anti-inflammatory omega-5; cell proliferation support', 'Urolithin A (gut metabolite from punicalagins): mTOR inhibition → autophagy → cellular anti-aging; produced from pomegranate by gut bacteria'],
    evidenceLevel: 'Strong: multiple human RCTs (oral pomegranate extract improves skin elasticity and reduces UV-induced damage); clinical evidence among the best for any traditional botanical',
    traditionalUse: 'Ancient Persia, Arab world, Indian Ayurveda, Jewish tradition (40 seeds in circumference); peel powder used topically in North African and Middle Eastern beauty',
    modernFormulations: 'Pomegranate seed oil in premium anti-aging serums; pomegranate extract in oral supplements; Urolithin A now available as isolated supplement',
  },

  greenTea: {
    origin: 'China, Japan, Korea (Camellia sinensis)',
    communities: ['east-asian'],
    bioactives: ['Epigallocatechin gallate (EGCG)', 'Epicatechin gallate (ECG)', 'Epicatechin (EC)', 'L-theanine', 'Caffeine', 'Theogallin', 'Gallic acid'],
    antiAgingMechanisms: ['EGCG: MMP-1 and MMP-9 inhibition (slows collagen breakdown in lab studies)', 'EGCG: SIRT1 activation; NAD+ pathway support', 'EGCG: reduces AP-1 transcription factor (same target as retinoids, but gentler mechanism)', 'Photoprotection: oral EGCG measurably increases MED (minimal erythema dose) — dietary photoprotection', 'L-theanine: reduces cortisol response to stress; indirect anti-aging via stress axis'],
    evidenceLevel: 'Strong: multiple human studies for oral and topical; epidemiological data from Japan; RCT evidence for photoprotection and skin elasticity',
    traditionalUse: 'Daily beverage in Japan, Korea, China for 2000+ years; Japanese chado (tea ceremony) as cultural practice; topical green tea preparations in traditional East Asian medicine',
    modernFormulations: 'Green tea extract in K-beauty and J-beauty serums; standardized EGCG supplements; green tea SPF serums for layering under sunscreen',
  },

  ginseng: {
    origin: 'Korean Peninsula, Northern China (Panax ginseng)',
    communities: ['east-asian'],
    bioactives: ['Ginsenoside Rb1, Rb2, Rc, Rd, Re, Rg1, Rh1, Rh2', 'Panaxydol', 'Panaxynol', 'Polysaccharides', 'Peptides'],
    antiAgingMechanisms: ['Ginsenoside Rb1: stimulates collagen Type I synthesis in fibroblasts; reduces MMP-1 and MMP-3; measurable in cell studies', 'Ginsenosides: SIRT1 and SIRT3 activation → telomere maintenance, mitochondrial biogenesis', 'Adaptogen: reduces cortisol via HPA axis modulation → indirect collagen preservation', 'Ginsenoside Rg1: stimulates IGF-1 receptors on skin fibroblasts → proliferation and collagen'],
    evidenceLevel: 'Strong: human RCT (red ginseng 3g/day, 24 weeks) shows significant wrinkle reduction, elasticity improvement; topical ginseng studies also showing collagen density increase',
    traditionalUse: 'Korea: the most valued medicinal plant; samgye-tang (ginseng chicken); daily red ginseng extract shots; 2000+ year history; grown in carefully tended mountain ginseng gardens',
    modernFormulations: 'Korean prestige brands (Sulwhasoo, History of Whoo) built around ginseng; red ginseng extract widely available in supplement and skincare format',
  },

  frankincense: {
    origin: 'Ethiopia, Somalia, Oman, Yemen (Boswellia sacra, B. papyrifera, B. serrata)',
    communities: ['east-african', 'arab'],
    bioactives: ['Acetyl-keto-boswellic acid (AKBA)', 'Beta-boswellic acid', 'Incensole acetate', 'Alpha-boswellic acid', 'Tigogenin', 'Essential oils (alpha-pinene, limonene)'],
    antiAgingMechanisms: ['AKBA: 5-LOX (5-lipoxygenase) inhibitor — blocks leukotriene synthesis; potent anti-inflammatory; reduces inflammaging', 'Incensole acetate: anti-inflammatory + neuroprotective (brain-skin connection in stress response)', 'Boswellic acids: reduce MMP-1 and MMP-3 activity in fibroblast studies; collagen matrix preservation', 'Tigogenin: topical application increases skin elasticity in small clinical studies'],
    evidenceLevel: 'Moderate: strong anti-inflammatory evidence; skin elasticity clinical study positive; mechanism of action well-characterized; more RCTs needed',
    traditionalUse: 'Ethiopian and Somali: etan (burning frankincense) for beauty, religion, social rituals; fumigation ritual for skin and hair; resin chewed and applied topically; ancient Egypt: frankincense in kohl and beauty preparations (3000+ year history)',
    modernFormulations: 'Boswellia extract in premium anti-aging serums; frankincense oil in luxury natural skincare; increasingly studied as anti-aging active',
  },

  rooibos: {
    origin: 'Western Cape, South Africa — endemic (Aspalathus linearis)',
    communities: ['south-african'],
    bioactives: ['Aspalathin (unique — found only in rooibos)', 'Nothofagin', 'Quercetin', 'Luteolin', 'Orientin', 'Vitexin', 'Isorientin', 'Chrysoeriol'],
    antiAgingMechanisms: ['Aspalathin: scavenges superoxide and reduces UV-induced ROS in keratinocytes (unique mechanism not replicated by other antioxidants)', 'Rooibos polyphenols: inhibit MMP-1 and MMP-3; preserves collagen matrix',  'Quercetin: anti-inflammatory, mild tyrosinase inhibition; supports aspalathin\'s anti-aging action'],
    evidenceLevel: 'Early: mostly lab evidence; distinctive mechanism from other plant antioxidants',
    traditionalUse: 'Khoikhoi and San people: traditional use predates European contact; became nationally important beverage in 20th century; South African cultural symbol; skin applications emerging from beauty industry interest',
    modernFormulations: 'Rooibos extract in South African skincare brands (Liz Earle rooibos products, African Extracts); AspalFresh standardized extract; rooibos tea bags as DIY toner',
  },

  marula: {
    origin: 'Southern Africa (Sclerocarya birrea)',
    communities: ['south-african'],
    bioactives: ['Oleic acid (C18:1, ~70%)', 'Linoleic acid (C18:2)', 'Procyanidins', 'Gallic acid', 'Ellagic acid', 'Catechins', 'Tocopherols'],
    antiAgingMechanisms: ['Procyanidins: inhibit MMP-2 and MMP-9; anti-inflammatory; antioxidant — multiple anti-aging actions', 'Gallic acid and ellagic acid: tyrosinase inhibition (anti-hyperpigmentation), antioxidant', 'High oleic acid: superior barrier reinforcement; reduces TEWL; anti-inflammatory in dermis', 'Exceptional oxidative stability: oil delivers antioxidants without pro-oxidant breakdown products (unlike less stable oils)'],
    evidenceLevel: 'Moderate-strong: in vitro excellent; clinical study (60 participants, 4 weeks) shows improved moisture retention and elasticity; safety profile excellent across all skin types',
    traditionalUse: 'Swazi, Tsonga, Zulu, Sotho communities: traditional oil from kernel; marula fruit eaten fresh; marula beer (umqombothi); oil applied to skin and hair; now a globally premium ingredient',
    modernFormulations: 'Drunk Elephant Marula Oil made it globally famous; many premium brands followed; also available from South African artisan producers (e.g., Marula Company)',
  },

  aloeVera_ferox: {
    origin: 'Global (Aloe vera); South Africa (Aloe ferox)',
    communities: ['caribbean', 'south-african', 'west-african', 'arab'],
    bioactives: ['Acemannan (polysaccharide)', 'Aloin (anthraquinone)', 'Emodin', 'Aloecin (A. ferox specific)', 'Chrysophanol', 'Vitamin C, B1, B2, B6', 'Folic acid', 'Choline'],
    antiAgingMechanisms: ['Acemannan: stimulates fibroblast proliferation; increases collagen and HA synthesis; immunomodulatory', 'Aloin: inhibits tyrosinase (mild brightening effect)', 'Anti-inflammatory: reduces IL-1, IL-6, TNF-alpha; reduces inflammaging in dermis', 'Wound healing: extensive clinical evidence; anti-aging wound repair pathways shared with anti-aging mechanisms'],
    evidenceLevel: 'Strong (for wound healing and anti-inflammatory); moderate (for anti-aging specifically); limited human data',
    traditionalUse: 'Caribbean: fresh aloe fillet on skin after sun; pan-African use for burns and skin conditions; Arab world: Quranic herb, widely used; pan-Asian: traditional burn treatment; truly global traditional herb',
    modernFormulations: 'Aloe vera gel as standalone product; base in almost every moisturizer; A. ferox gel from South African brands premium priced; inner leaf gel vs. whole leaf (aloin removed for topical safety)',
  },

  amla: {
    origin: 'Indian subcontinent (Emblica officinalis / Phyllanthus emblica)',
    communities: ['south-asian'],
    bioactives: ['Emblicanin A and B (unique tannins)', 'Vitamin C (600-700mg/100g)', 'Ellagic acid', 'Gallic acid', 'Phyllaemblic acid', 'Flavonoids (quercetin, kaempferol)'],
    antiAgingMechanisms: ['Emblicanin A and B: stable tannin antioxidants that chelate iron (preventing Fenton reaction / free radical generation); more thermally stable than pure vitamin C', 'Vitamin C: direct collagen synthesis cofactor + antioxidant', 'Tyrosinase inhibition (gallic acid, ellagic acid): reduces hyperpigmentation — primary aging concern in South Asian skin', 'MMP inhibition: reduces collagen degradation'],
    evidenceLevel: 'Moderate-strong: well-studied in Ayurvedic context; phytochemistry well-characterized; anti-aging RCTs limited but mechanistic case strong; vitamin C content definitively measured',
    traditionalUse: 'Central to Ayurveda: chyawanprash (daily tonic), triphala (digestive), amla oil (hair); in Charaka Samhita, Sushruta Samhita as primary rasayana (rejuvenation) herb; historical use across 3000+ years',
    modernFormulations: 'Amla oil widely available; amla powder in Indian grocers; Emblicanyl standardized extract in premium skincare; oral supplement for hair, skin, and anti-aging',
  },

  seaMoss: {
    origin: 'Atlantic (Chondrus crispus, Gracilaria species) — Caribbean, Irish coast',
    communities: ['caribbean'],
    bioactives: ['Carrageenan (sulfated polysaccharide)', 'Citrulline', 'Iodine', 'Zinc', 'Selenium', 'Magnesium', 'Vitamin C', 'B vitamins', 'Chlorophyll'],
    antiAgingMechanisms: ['Carrageenan: supports collagen synthesis; reduces collagen degradation (sulfated polysaccharides bind to growth factors and protect them from degradation)', 'Iodine: thyroid support → optimal thyroid function → normal skin cell turnover and hydration (thyroid decline is a hidden driver of dull, aging skin)', 'Zinc: cofactor for superoxide dismutase (antioxidant enzyme); required for DNA repair; wound healing', 'Selenium: cofactor for glutathione peroxidase (antioxidant); thyroid function support'],
    evidenceLevel: 'Low-moderate: mineral content well-documented; carrageenan mechanisms studied in vitro; clinical RCTs specifically for skin anti-aging not available; traditional use strong',
    traditionalUse: 'Jamaica, Trinidad, Barbados, St. Lucia: sea moss drink (blended with milk, cinnamon, vanilla) as health tonic; grandmother remedy for skin and vitality; now globally popular as superfood',
    modernFormulations: 'Sea moss gel (self-prepared); sea moss capsules; sea moss topical masks (DIY and commercial)',
  },

  camelMilk: {
    origin: 'Horn of Africa, Arabian Peninsula (Camelus dromedarius)',
    communities: ['east-african', 'arab'],
    bioactives: ['Lactoferrin', 'Lysozyme', 'Immunoglobulins (IgG, IgA, IgM)', 'Insulin and insulin-like growth factor (IGF-1)', 'Vitamin C (3-5x cow milk)', 'Lacto-peroxidase'],
    antiAgingMechanisms: ['IGF-1: stimulates fibroblast proliferation and collagen synthesis (same growth factor that peaks with youthful growth hormone — activates skin repair pathways)', 'Lactoferrin: anti-inflammatory via iron chelation (prevents inflammatory iron-driven oxidation); antimicrobial', 'Vitamin C: collagen synthesis cofactor; unique in milk (cow milk has minimal vitamin C)', 'Immunoglobulins: modulate skin immune response; reduce inflammatory tone'],
    evidenceLevel: 'Low-moderate: composition well-studied; in vitro skin cell studies positive; pilot clinical studies for atopic dermatitis and skin aging showing promise; large RCTs needed',
    traditionalUse: 'Somali, Ethiopian, Sudanese, Saudi Arabian, UAE nomadic communities: consumed for health and "beauty from within"; traditional skin-clearing reputation; camel milk soap traditional in Arabian communities',
    modernFormulations: 'Camel milk soap; camel milk face cream; pasteurized camel milk for consumption; artisan camel milk producers in UAE, Australia, US, Netherlands',
  },

  avocado: {
    origin: 'Mexico, Central America (Persea americana)',
    communities: ['latina'],
    bioactives: ['Oleic acid (60-80%)', 'Beta-sitosterol', 'Vitamin E (tocopherols)', 'Glutathione (and precursors)', 'Vitamin C', 'Lutein', 'Zeaxanthin', 'Mannoheptulose', 'Persin'],
    antiAgingMechanisms: ['Glutathione: master antioxidant; limits pheomelanin production (brightening); reduces oxidative stress driving inflammaging; topical glutathione gaining evidence', 'Beta-sitosterol: anti-inflammatory phytosterol; stimulates fibroblast proliferation at low concentrations', 'Oleic acid: superior dermal penetration; anti-inflammatory; barrier-reinforcing', 'Perseose (avocado sugars): increases epidermal basal cell activity; may maintain epidermal thickness that thins with aging'],
    evidenceLevel: 'Moderate: well-studied composition; wound healing clinical evidence (oil); epidermis-thickening evidence for perseose; glutathione brightening supported by oral supplement RCTs',
    traditionalUse: 'Aztec and Maya: 3000+ year culinary and cosmetic use; avocado hair masks; avocado face packs; first mentioned as cosmetic by Francisco Hernández (1570s)',
    modernFormulations: 'Avocado oil in premium skincare; avocado butter in body care; Perseose extract (Cognis/BASF) in professional anti-aging formulations; oral glutathione now in commercial supplements',
  },
};

export const HORMONES_AND_SKIN_AGING = {
  estrogen: {
    skinRole: 'Estrogen maintains skin thickness, collagen density, moisture, and elasticity via estrogen receptor alpha and beta on keratinocytes, fibroblasts, and melanocytes',
    decline: 'Menopause: estradiol falls sharply, and collagen loss speeds up in the following years',
    skinEffects: [
      'Skin thinning: epidermal and dermal thickness decreases measurably within 1-2 years of menopause',
      'Dryness: reduced sebum and hyaluronic acid production',
      'Increased laxity: collagen and elastin decline simultaneously',
      'Wounds heal more slowly: estrogen promotes keratinocyte migration in wound healing',
      'Pigmentation changes: estrogen-sensitive melanocytes become less regulated; may increase melasma or decrease in unpredictable pattern',
    ],
    HRT: {
      
      topicalEstrogen: 'Topical vaginal estrogen: used for urogenital atrophy; some evidence for local skin anti-aging effect; lower systemic exposure than oral',
      
      risk: 'HRT benefits must be weighed against individual risks (breast cancer, thrombosis); medical decision with physician',
    },
  },
  progesterone: {
    skinRole: 'Progesterone: anti-inflammatory; reduces sebum (but decline in menopause may lead to rebound sebum and breakouts); maintains skin elasticity',
    aging: 'Progesterone declines before estrogen in perimenopause; the imbalance phase (low progesterone, fluctuating estrogen) causes acne breakouts and skin reactivity in perimenopause',
    topical: 'Topical progesterone creams: some evidence for improved skin elasticity; absorbed transdermally; systemic effect variable',
  },
  testosterone: {
    skinRole: 'Testosterone (DHT): drives sebum production; maintains skin thickness; affects skin microbiome balance',
    men: 'Men\'s slower estrogen decline: skin stays thicker and oilier longer; wrinkles often develop later but become more prominent once collagen loss begins in 60s-70s',
    women: 'Women also produce testosterone; androgen excess in PCOS → acne, oily skin; testosterone decline in menopause contributes to libido and skin changes',
  },
  growthHormone: {
    peak: 'Growth hormone (GH) peaks during deep sleep (slow-wave sleep); drives collagen synthesis, cell proliferation, and skin repair',
    
    sleep: 'Sleep quality improvement: the most accessible intervention to optimize GH pulsatility; deep sleep is when GH does its anti-aging work in skin',
    IGF1: 'IGF-1 (insulin-like growth factor 1): downstream mediator of GH effects; stimulates fibroblasts; found in camel milk at notable concentrations; declines with aging',
  },
  cortisol: {
    mechanism: 'Cortisol (the stress hormone): upregulates MMP-1, -3, -9 expression → collagen degradation; suppresses collagen synthesis via fibroblast downregulation',
    chronicStress: 'Chronic elevation of cortisol from psychological stress, sleep deprivation, or chronic illness causes measurable skin collagen degradation; a primary mechanism of stress-driven aging',
    measurement: 'Cortisol can be measured in saliva, blood, or hair (chronic cortisol exposure); diurnal cortisol pattern (morning peak, evening trough) flattens with chronic stress',
    interventions: ['7-9h quality sleep (most impactful for cortisol normalization)', 'Regular exercise (reduces stress cortisol, though acute cortisol spike during exercise is normal)', 'Mindfulness meditation (documented cortisol reduction in RCTs)', 'Adaptogens such as ashwagandha (small trials; ask your doctor)', 'Social connection (reduces baseline cortisol)'],
    weathering: 'The weathering hypothesis: chronic psychosocial stress from systemic disadvantage causes chronically elevated allostatic load → elevated cortisol → accelerated biological aging including skin aging; documented primarily in Black American women but broadly applicable to any chronically stressed population',
  },
  melatonin: {
    function: 'Melatonin: the darkness hormone; antioxidant; produced by pineal gland in darkness; also produced locally in skin cells',
    skinAntioxidant: 'Melatonin is one of the most potent biological antioxidants; scavenges hydroxyl radical, peroxyl radical, and singlet oxygen; protects skin DNA from oxidative damage',
    nightRepair: 'Melatonin peaks 2am-4am; coincides with peak skin DNA repair enzyme activity; this nocturnal antioxidant surge supports overnight skin repair',
    light: 'Blue light from screens (wavelength 450-480nm) suppresses melatonin production; even low-level bedroom light disrupts melatonin timing; affects skin\'s nighttime repair cycle',
    aging: 'Melatonin production declines with age: older adults produce less and peak earlier; contributing to age-related decline in overnight skin repair',
    topical: 'Topical melatonin: some evidence for antioxidant protection and anti-aging effect in clinical studies; niche skincare category with growing interest',
  },
};

export const SKIN_AGING_BY_DECADE = {
  twenties: {
    overview: 'Intrinsic aging is minimal and largely invisible; this is the prevention decade',
    keyChanges: [
      'Collagen production begins its gradual decline — invisible at this stage but establishing the cumulative trajectory',
      'Cell turnover starting to slow from childhood peak',
      'Cumulative UV damage accumulating invisibly (may not be visible for 2-3 decades)',
      'This is the decade when consistent SPF has the greatest lifetime impact',
    ],
    priorities: ['SPF 30-50 daily (every day, not just sunny days)', 'Vitamin C antioxidant serum AM', 'Basic moisturizer with hyaluronic acid', 'No smoking; moderate alcohol; consistent sleep'],
    darkSkinNote: 'For Fitzpatrick V-VI skin in 20s: PIH from acne is the most visible skin concern; treating acne aggressively to prevent PIH sets the skin aging trajectory better than any anti-aging product',
  },
  thirties: {
    overview: 'Early signs appear; intrinsic and extrinsic aging become visible for the first time in lighter skin; darker skin still largely wrinkle-free but hyperpigmentation starts',
    keyChanges: [
      'First fine lines (especially under eye, forehead) in lighter skin tones',
      'Hyperpigmentation and uneven tone appearing in darker skin tones — the first aging sign for Fitzpatrick IV-VI',
      'Collagen loss now cumulative and measurable in skin biopsy studies',
      'Cell turnover noticeably slower; dullness increases',
      'Hormonal changes if approaching 35-40: early perimenopause effects on some women',
    ],
    priorities: ['Introduce retinol (low concentration; slow start)', 'Niacinamide 5% for hyperpigmentation (dark skin) or texture (light skin)', 'Consistent SPF', 'Peptide serum for collagen support'],
    darkSkinNote: 'This is the key decade for dark skin to establish anti-hyperpigmentation habits: SPF, niacinamide, and careful retinol introduction prevent the PIH accumulation that registers as significant aging by 40s',
  },
  forties: {
    overview: 'Aging becomes more prominent; collagen loss now clinically significant; hormonal changes may accelerate skin change for women',
    keyChanges: [
      'Volume loss begins (subcutaneous fat redistribution): cheeks become less plump, lower face more prominent',
      'Significant collagen and elastin loss measurable in all skin tones',
      'Perimenopause: estrogen reduction drives rapid collagen loss acceleration',
      'For lighter skin: established fine lines, sun spots, some skin laxity',
      'For darker skin: hyperpigmentation patterns established, potential jowl laxity, some under-eye changes',
    ],
    priorities: ['Upgrade to prescription tretinoin if tolerated (most anti-aging evidence)', 'Peptides to complement retinoids', 'Vitamin C daily (collagen cofactor)', 'Consider: microneedling or laser (appropriate for skin type)', 'Hormonal health discussion with physician'],
    collagenFocus: 'Oral collagen supplementation (5-10g/day hydrolyzed with vitamin C) now has meaningful clinical evidence; from 40s onward, the cumulative collagen deficit makes supplementation more impactful',
  },
  fifties: {
    overview: 'Menopause is a watershed for most women; faster collagen loss in the first years; rapid visible change; the decade that most demands comprehensive anti-aging strategy',
    keyChanges: [
      'Menopausal collagen loss: skin noticeably thinner, drier, more fragile',
      'Significant facial volume loss; jowls and neck skin changes prominent',
      'For lighter skin: deep wrinkles, significant texture and pigmentation changes',
      'For darker skin: structural changes now more visible as melanin photoprotection advantage is less able to compensate for intrinsic collagen loss',
      'Skin barrier weakens: more reactive, more easily irritated',
    ],
    priorities: ['HRT consultation (most effective intervention for menopausal skin aging)', 'Increase moisturizer richness (ceramides, peptides, oils)', 'Professional treatments (retinoid prescription, professional peels for Fitzpatrick I-IV, microneedling for V-VI)', 'Oral collagen + vitamin C + omega-3 comprehensive supplement protocol'],
    darkerSkinFifties: 'Dark skin in 50s: the "Black don\'t crack" advantage remains for wrinkles but is less dramatic; the cumulative hyperpigmentation and the structural changes (volume loss, elasticity) are now significant; professional treatment access is important',
  },
  sixtiesAndBeyond: {
    overview: 'Compounding of all previous aging processes; management over reversal; quality of life and skin health focus',
    keyChanges: [
      'Skin is significantly thinner, more fragile, heals more slowly',
      'Collagen is now well below its peak; structural changes significant across all skin tones',
      'Barrier function reduced: increased sensitivity and reactivity',
      'Wound healing impaired: the fibroblast and keratinocyte responses slow dramatically',
    ],
    priorities: ['Simplify routine (fewer but evidence-based actives)', 'Barrier repair products (ceramides, fatty acids) priority', 'Continue SPF (prevents further photoaging addition)', 'Low-dose retinoid if tolerated', 'Oral supplement support: omega-3, collagen peptides, vitamin C, D3'],
    acceptance: 'Genuine beauty in every decade; the goal of anti-aging science is not the erasure of aging but optimization of skin health and minimization of avoidable damage that accelerates the aging process beyond its natural pace',
  },
};
