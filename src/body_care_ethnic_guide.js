/**
 * MIRRR — Body Care Multicultural Guide
 * Comprehensive body care science and rituals for 9 ethnic communities
 * Topics: moisturisation, body oils, scrubs, stretch marks, cellulite, body hyperpigmentation
 */

// ============================================================
// BODY SKIN BIOLOGY
// ============================================================

export const BODY_SKIN_BIOLOGY = {
  overview: `Body skin differs significantly from facial skin in thickness, sebaceous gland density,
  sun exposure patterns, and barrier function. Understanding these differences is critical for
  selecting appropriate body care products and treatments, particularly for melanin-rich skin tones
  where hyperpigmentation and uneven tone are primary concerns.`,

  skinLayers: {
    epidermis: {
      description: 'Outer protective layer, 0.05-1.5mm thick depending on body location',
      sublayers: ['stratum corneum (outermost)', 'stratum granulosum', 'stratum spinosum', 'stratum basale'],
      melanocytes: 'Melanin-producing cells in stratum basale — density similar across ethnicities, output varies',
      keratinocytes: 'Primary cell type; produce keratin for barrier function',
      turnoverRate: '28-40 days complete cell cycle; slows with age'
    },
    dermis: {
      description: 'Middle layer containing collagen, elastin, blood vessels, nerve endings',
      collagen: 'Types I and III; provides tensile strength; degrades with UV and age',
      elastin: 'Provides skin elasticity; difficult to restore once lost',
      hyaluronicAcid: 'Natural humectant in dermis; holds 1000x its weight in water'
    },
    hypodermis: {
      description: 'Deepest subcutaneous fat layer; insulation and cushioning',
      cellulite: 'Herniation of subcutaneous fat through fibrous connective tissue; affects 80-90% of women post-puberty',
      stretchMarks: 'Tears in dermis when skin expands faster than collagen can regenerate'
    }
  },

  bodyVsFaceComparison: {
    thickness: 'Body skin generally 2-3mm vs face 1.5-2mm; palms and soles up to 4mm',
    sebaceousGlands: 'Far fewer on body than face; chest/back/shoulders exception (acne-prone zones)',
    hydration: 'Body skin loses water faster due to larger surface area and less sebum',
    sunExposure: 'Often more cumulative but less daily care attention than face',
    darkSkinBodyDifferences: [
      'Body skin in darker tones may appear more ashy/grey when dehydrated due to contrast against melanin',
      'Post-inflammatory hyperpigmentation (PIH) from body acne, ingrown hairs, friction common',
      'Elbows, knees, ankles, knuckles commonly hyperpigmented — areas of chronic friction',
      'Stretch marks often appear darker (hyperpigmented) rather than silver/white in Fitzpatrick IV-VI'
    ]
  },

  ashySkiScience: {
    definition: 'Colloquial term for dry, dull, grey-cast skin appearance, especially on dark skin tones',
    mechanism: 'Dead skin cells on stratum corneum scatter light differently when dehydrated; melanin contrast makes this more visible on dark skin',
    triggers: ['Cold/dry weather', 'Hard water', 'Harsh soaps with high pH', 'Insufficient moisturisation', 'Chlorine from swimming'],
    prevention: ['Moisturise immediately post-shower while skin still damp (within 3 minutes)', 'Humectant + emollient + occlusive layering', 'pH-balanced cleansers', 'Regular exfoliation to remove dead cell buildup'],
    treatments: ['Shea butter', 'Glycerin-based lotions', 'Body oils (jojoba, almond, marula)', 'Urea 10% for severely rough areas']
  }
};

// ============================================================
// MOISTURISATION SCIENCE
// ============================================================

export const MOISTURISATION_SCIENCE = {
  overview: `Effective body moisturisation requires understanding the three categories of moisturising
  ingredients: humectants (attract water), emollients (soften and smooth), and occlusives (seal moisture in).
  For melanin-rich skin prone to ashiness, a layered approach combining all three is most effective.`,

  humectants: {
    description: 'Draw water from environment and dermis into stratum corneum',
    examples: {
      glycerin: { concentration: '5-10% optimal', benefit: 'Most effective humectant; gentle; widely available', note: 'Can draw water from dermis in very dry climates — must pair with occlusive' },
      hyaluronicAcid: { benefit: 'Holds 1000x its weight in water; multiple molecular weights penetrate differently', note: 'High MW stays on surface; low MW penetrates deeper' },
      aloeVera: { benefit: 'Natural humectant + anti-inflammatory; 99% water', note: 'Contains polysaccharides, vitamins C and E; soothing for body acne' },
      urea: { concentrations: '5-10% humectant; 20-40% keratolytic', benefit: 'Dual action: moisturises AND exfoliates; excellent for rough elbows, knees, heels' },
      panthenol: { benefit: 'Pro-vitamin B5; penetrates skin, converts to pantothenic acid; healing and soothing' },
      sodiumPCA: { benefit: 'Natural moisturising factor (NMF) component; extremely hygroscopic' }
    }
  },

  emollients: {
    description: 'Fill spaces between skin cells, smoothing texture and softening skin',
    examples: {
      sheButter: { origin: 'Vitellaria paradoxa tree, West/Central Africa', composition: 'Oleic acid 40-60%, stearic acid 20-50%, linoleic 3-11%', benefit: 'Rich emollient + mild occlusive; anti-inflammatory (lupeol, cinnamic acid); historically used across African continent for millennia', grades: 'Raw/unrefined (yellow, strong smell) vs refined (white, neutral) — raw retains more bioactives' },
      cocoButter: { composition: 'Saturated fatty acids 90%+; solid at room temperature', benefit: 'Rich emollient; chocolatey scent; popular for stretch marks (limited clinical evidence but well-tolerated)', note: 'Can be comedogenic for body acne-prone skin' },
      jojobaOil: { composition: 'Technically a liquid wax ester, not oil; mimics skin sebum', benefit: 'Non-comedogenic; extremely stable; excellent for all skin types; balances sebum' },
      sweetAlmondOil: { composition: 'Oleic acid 62-86%, linoleic 20-30%', benefit: 'Light texture; soothing; often used for baby massage across South Asian traditions' },
      arganOil: { origin: 'Argania spinosa tree, Morocco', composition: 'Oleic 43-49%, linoleic 29-36%, vitamin E', benefit: 'Anti-aging, hair and skin; Moroccan traditional use for centuries' },
      marula: { origin: 'Sclerocarya birrea tree, Southern and East Africa', composition: 'Oleic acid 70-78%, palmitic 9-12%', benefit: 'Rapidly absorbing; anti-aging; traditional South African use' },
      baobab: { origin: 'Adansonia digitata, Africa', composition: 'Palmitic, oleic, linoleic fatty acids + vitamins A, D, E, F', benefit: 'Excellent skin regeneration; used in traditional African body care' }
    }
  },

  occlusives: {
    description: 'Create physical barrier on skin surface to prevent transepidermal water loss (TEWL)',
    examples: {
      petrolatum: { also: 'Vaseline, petroleum jelly', benefit: 'MOST effective occlusive; reduces TEWL by 99%; FDA-approved skin protectant', note: 'Non-comedogenic despite reputation; medical-grade is refined and safe', cultural: 'Iconic in Black American communities as "greasing" — skin and scalp; generations of use' },
      sheButter: { note: 'Also functions as mild occlusive in addition to emollient properties' },
      beeswax: { benefit: 'Natural occlusive; antimicrobial; creates breathable barrier', cultural: 'Used in many traditional African and Middle Eastern preparations' },
      dimethicone: { benefit: 'Silicone-based; smooth application; reduces TEWL; non-comedogenic' },
      lanolin: { benefit: 'Closest to human sebum; extremely effective occlusive', note: 'Potential allergen for some; derived from sheep wool' }
    }
  },

  applicationTiming: {
    goldStandard: 'Apply within 3 minutes of shower/bath — the "3-minute rule"',
    rationale: 'Skin is maximally hydrated post-bathing; occlusive layer locks in water before evaporation',
    technique: 'Pat dry (do not rub); apply humectant first; follow with emollient/occlusive while still slightly damp',
    layering: 'Thinnest to thickest: serum/water-based → lotion → cream → oil/butter → balm'
  }
};

// ============================================================
// BODY EXFOLIATION
// ============================================================

export const BODY_EXFOLIATION = {
  overview: `Regular exfoliation removes dead skin cells (corneocytes) from the stratum corneum,
  revealing brighter skin beneath and improving moisturiser penetration. For melanin-rich skin,
  the choice of exfoliation method and frequency is critical — over-exfoliation triggers PIH.`,

  physicalExfoliation: {
    scrubs: {
      sugarScrubs: { benefit: 'Dissolves on contact with water, self-limiting; glycolic acid content; gentler than salt', texture: 'Fine to coarse; fine preferred for sensitive or dark skin' },
      saltScrubs: { benefit: 'Mineral-rich; antibacterial; stronger exfoliation', caution: 'Can irritate cuts or very sensitive skin; avoid on broken skin' },
      coffeeGrounds: { benefit: 'Caffeine may temporarily reduce appearance of cellulite (vasoconstriction); medium texture', cultural: 'Used in Brazilian beauty rituals; popular worldwide' },
      gramFlour: { benefit: 'Traditional South Asian exfoliant (besan/ubtan); mild; brightening', cultural: 'Core ingredient in ubtan (turmeric + gram flour + milk paste); bridal beauty ritual' },
      oatmeal: { benefit: 'Colloidal oatmeal is FDA-approved skin protectant; soothing; good for eczema-prone skin', chemical: 'Avenanthramides are anti-inflammatory' }
    },
    tools: {
      loofah: { benefit: 'Natural exfoliation; stimulates circulation', caution: 'Must dry completely to prevent mold/bacteria; replace every 3-4 weeks' },
      konjacSponge: { benefit: 'Extremely gentle; good for sensitive skin; biodegradable', chemical: 'Glucomannan fiber; slightly alkaline — rinse well' },
      italianTowel: { benefit: 'Korean Italy towel (때밀이); removes significant dead skin buildup', cultural: 'Core of Korean jjimjilbang (bathhouse) culture; reveals dramatically smoother skin', technique: 'Used after long soak to soften skin; rubbing motion releases dead cells in grey rolls' },
      kessa: { benefit: 'North African/Arab bath mitt used in hammam', cultural: 'Central to hammam ritual; pair with savon beldi (black soap)' },
      dryBrushing: { benefit: 'Stimulates lymphatic system; exfoliates; energising', technique: 'Brush toward heart on dry skin before shower; firm but not harsh' }
    }
  },

  chemicalExfoliation: {
    ahas: {
      glycolicAcid: { size: 'Smallest AHA; deepest penetration', concentration: '5-10% body; 15-20% professional', benefit: 'Excellent for KP (keratosis pilaris), rough texture, body hyperpigmentation', caution: 'Increases photosensitivity; use SPF on exposed areas' },
      lacticAcid: { benefit: 'Gentler than glycolic; also humectant; better for sensitive dark skin', products: 'AmLactin 12% widely used for KP and rough skin' },
      mandelicAcid: { benefit: 'Gentlest AHA; good for darker skin; antibacterial (good for body acne)' }
    },
    bhas: {
      salicylicAcid: { benefit: 'Oil-soluble; penetrates follicles; excellent for body acne, chest, back, butt breakouts', concentration: '0.5-2% OTC; 3-4% professional', caution: 'Avoid large body surface area in pregnancy' }
    },
    urea: { benefit: 'Dual humectant/keratolytic; 10-25% ideal for KP, rough elbows, keratotic skin' }
  },

  keratosisPilaris: {
    definition: 'Harmless condition of keratin plugging hair follicles; "chicken skin" on upper arms, thighs, cheeks',
    prevalence: 'Affects ~40% of adults and 50-80% of adolescents; genetic component',
    darkerSkinManifestation: 'Follicular plugs appear more prominent; post-inflammatory hyperpigmentation marks after picking',
    treatments: ['Lactic acid 12% (AmLactin)', 'Urea 10-20%', 'Salicylic acid 2%', 'Glycolic acid 10%', 'Gentle physical exfoliation', 'Moisturising immediately after shower'],
    avoid: 'Picking or squeezing — causes PIH on dark skin that can last months'
  }
};

// ============================================================
// STRETCH MARKS SCIENCE
// ============================================================

export const STRETCH_MARKS_SCIENCE = {
  definition: `Striae distensae — tears in the dermis caused by rapid skin stretching that outpaces
  collagen and elastin production. Extremely common: affect 50-90% of pregnant women, 70% of
  adolescent girls, 40% of adolescent boys during growth spurts.`,

  stages: {
    striaRubra: {
      description: 'Fresh, active stretch marks — red/purple/pink appearance',
      mechanism: 'Blood vessels visible through thinned dermis; inflammation present',
      darkerSkin: 'May appear very dark purple/brown/black rather than red — contrast with skin tone',
      treatability: 'MOST treatable stage — intervention here is most effective'
    },
    striaAlba: {
      description: 'Mature, older stretch marks — silver/white in lighter skin; lighter or darker than surrounding skin in dark skin',
      mechanism: 'Fibrous scar tissue has replaced torn collagen; blood vessels no longer visible',
      darkerSkin: 'Can appear hypopigmented (lighter) OR hyperpigmented (darker) than surrounding skin',
      treatability: 'More difficult to treat; cannot fully reverse but can improve appearance'
    }
  },

  riskFactors: ['Pregnancy (especially rapid weight gain)', 'Puberty growth spurts', 'Rapid weight gain/loss', 'Corticosteroid use (systemic and topical)', 'Genetic predisposition', 'Cushing syndrome'],

  ethnicConsiderations: {
    darkerSkin: 'Stretch marks often appear darker (hyperpigmented) or show more contrast; more visible',
    lightSkin: 'Classic silver/white mature appearance stands out less on lighter backgrounds',
    treatment: 'Brightening ingredients (niacinamide, vitamin C, kojic acid) more important for hyperpigmented striae in dark skin'
  },

  treatments: {
    topical: {
      retinoids: { evidence: 'Strongest topical evidence for striae rubra; stimulates collagen production', protocol: 'Tretinoin 0.05-0.1% nightly; avoid in pregnancy', darkerSkinCaution: 'Buffer technique required to prevent retinoid dermatitis + PIH in Fitzpatrick IV-VI' },
      centellAsiatica: { evidence: 'Gotu kola; studied in pregnancy for prevention; stimulates collagen synthesis', benefit: 'Safe in pregnancy unlike retinoids; traditional Ayurvedic use' },
      hyaluronicAcid: { evidence: 'Applied during striae rubra stage; improves hydration and may improve appearance', note: 'Prevention evidence stronger than treatment' },
      'vitamin C': { evidence: 'Ascorbic acid stimulates collagen synthesis; antioxidant; brightens hyperpigmented striae' },
      cocoaButter: { evidence: 'Popular but limited RCT evidence for prevention; well-tolerated; may help with itch', cultural: 'Iconic in Caribbean and Black American communities for pregnancy skincare' },
      niacinamide: { evidence: 'Helps with pigmentation component; improves skin barrier' }
    },
    professional: {
      microneedling: 'Creates controlled micro-injuries stimulating collagen; effective across skin tones with appropriate needle depth',
      laserTherapy: 'PDL (pulsed dye laser) for rubra; fractional CO2 for alba — CAUTION: risk of PIH in dark skin; test patch essential',
      microDermAbrasion: 'Physical resurfacing; limited evidence for deep striae',
      prpTherapy: 'Platelet-rich plasma injections; emerging evidence'
    }
  }
};

// ============================================================
// BODY HYPERPIGMENTATION
// ============================================================

export const BODY_HYPERPIGMENTATION = {
  overview: `Body hyperpigmentation affects melanin-rich skin disproportionately. Key sites:
  elbows, knees, knuckles (friction-induced), underarms (shaving/deodorant), inner thighs
  (friction), bikini line (ingrown hairs), and stretch marks. Treatment requires both addressing
  cause and brightening existing pigment.`,

  commonSites: {
    elbowsKneesKnuckles: {
      cause: 'Chronic friction and pressure; thicker skin accumulates dead cells and melanin',
      treatment: ['Urea 20-40% to soften', 'AHA exfoliation', 'Niacinamide for brightening', 'Moisturise frequently', 'Avoid pressure/friction where possible']
    },
    underarms: {
      causes: ['Shaving irritation', 'Deodorant/antiperspirant reactions (aluminum compounds)', 'Friction from clothing', 'PIH from ingrown hairs', 'Acanthosis nigricans (insulin resistance-related)'],
      treatment: ['Switch to natural deodorant or crystal deodorant', 'Laser hair removal reduces shaving-related trauma', 'AHA exfoliation', 'Niacinamide', 'Tranexamic acid for stubborn cases', 'Rule out acanthosis nigricans with doctor if darkening is sudden'],
      acanthosisNigricans: 'Velvety dark patches in folds (underarms, neck, groin) — can signal insulin resistance/type 2 diabetes risk; consult doctor'
    },
    innerThighs: {
      cause: 'Friction (chafing), ingrown hairs, PIH from folliculitis',
      treatment: ['Anti-chafing shorts or balms to prevent friction', 'Salicylic acid for ingrown hairs', 'Niacinamide', 'Gentle AHA exfoliation']
    },
    bikiniLine: {
      cause: 'Shaving trauma, ingrown hairs, friction, waxing irritation',
      treatment: ['Laser hair removal preferred long-term', 'If shaving: go with grain, single-blade razor', 'Salicylic acid 2% to prevent ingrowns', 'Niacinamide 5% for brightening']
    }
  },

  brighteningIngredients: {
    niacinamide: { concentration: '4-10%', mechanism: 'Inhibits melanosome transfer from melanocyte to keratinocyte', safety: 'Extremely well-tolerated; first-line for dark skin body brightening' },
    kojicAcid: { concentration: '1-4%', mechanism: 'Inhibits tyrosinase enzyme in melanin production', note: 'Can cause irritation at high concentrations; patch test' },
    vitaminC: { forms: 'Ascorbic acid, ascorbyl glucoside, sodium ascorbyl phosphate', mechanism: 'Antioxidant; reduces melanin synthesis; inhibits tyrosinase', bodyFriendly: 'More stable forms (ascorbyl glucoside) better for body use' },
    alphaArbutin: { mechanism: 'Hydroquinone derivative without toxicity concerns; inhibits tyrosinase', safety: 'Safe for long-term use; effective on dark skin' },
    tranexamicAcid: { emerging: 'Growing evidence for body hyperpigmentation; originally medical hemostatic agent', forms: 'Topical 2-5%; oral (prescription); IV' },
    azelaicAcid: { benefit: 'Anti-inflammatory + brightening; excellent for PIH; also treats folliculitis', concentration: '10-20%' }
  }
};

// ============================================================
// 9 COMMUNITY BODY CARE GUIDES
// ============================================================

export const ETHNIC_BODY_CARE_GUIDES = {
  'west-african': {
    communityName: 'West African',
    skinProfile: 'Fitzpatrick IV-VI; rich melanin; prone to ashiness, PIH, and hyperpigmentation at friction points',
    hairProfile: 'Type 4 body hair; prone to ingrown hairs and PFB (folliculitis) especially in bikini/underarm areas',

    traditionalBodyCare: {
      sheButter: 'The cornerstone of West African body care for centuries — used from birth for skin, hair, and healing; every generation passes down shea traditions; raw yellow shea from Burkina Faso, Ghana, Nigeria considered superior',
      duduOsun: 'Traditional Nigerian black soap (ose dudu); natural palm oil + plantain ash + cocoa pod; exfoliating, clarifying, used for body and face',
      oilMassage: 'Palm oil, coconut oil, and shea butter massage traditions; used for newborns, pregnant women, post-partum recovery',
      neem: 'Anti-bacterial, anti-fungal neem (dogonyaro in Hausa) preparations for skin conditions'
    },

    modernRecommendations: {
      ashPrevention: 'Layer glycerin lotion + raw shea butter immediately after shower; the "3-minute rule" is especially important for Fitzpatrick V-VI',
      bodyBrightening: 'Elbows, knees, knuckles: urea 20% + niacinamide 5% applied nightly',
      stretchMarks: 'Shea butter + vitamin E oil during pregnancy; retinol (buffered) post-partum for mature stretch marks',
      ingrownHairs: 'Salicylic acid 2% in bikini and underarm areas; exfoliate 2x weekly',
      sunProtection: 'SPF 30+ on exposed body skin — melanin provides some protection but not full; daily application during summer'
    },

    keyIngredients: ['Raw shea butter', 'Dudu-osun black soap', 'Palm kernel oil', 'Neem oil', 'Moringa oil', 'Baobab oil', 'Niacinamide', 'Urea 20%'],

    culturalRituals: {
      showing: 'Body oiling before important events; "glow" is cultural currency in West African beauty',
      bridal: 'Bride preparation includes full-body shea butter and oil treatments; skin luminosity is beauty ideal',
      postpartum: 'Traditional postpartum care includes belly binding, steam baths, full-body oil massage to restore skin'
    },

    qlooBrands: ['SheaMoisture', 'African Pride', 'Nubian Heritage', 'ORS Olive Oil', 'Black Opal', 'Queen Helene'],

    advice: `West African skin thrives on richness. Raw unrefined shea butter is not just moisturiser — it's medicine,
    tradition, and love passed down through generations. Apply it generously, especially in cold/dry months when
    ashy skin shows most against deep melanin. For body brightening, target elbows and knees with urea 20%
    nightly — consistency over 8-12 weeks produces visible results.`
  },

  'south-asian': {
    communityName: 'South Asian',
    skinProfile: 'Fitzpatrick III-V; warm undertones; prone to tanning, PIH, stretch marks, and body acne (back/chest)',
    hairProfile: 'Dark, coarser body hair; laser hair removal highly effective due to high melanin contrast',

    traditionalBodyCare: {
      ubtan: 'Ancient Ayurvedic full-body paste of gram flour (besan) + turmeric + milk/rose water + sandalwood; used before marriage ceremonies for centuries; natural exfoliant + brightening',
      oilMassage: 'Abhyanga — daily or weekly full-body warm oil self-massage in Ayurveda; sesame oil primary (grounding, warming); coconut oil for Pitta types; promotes circulation and lymphatic drainage',
      haldi: 'Turmeric (haldi) has been used topically for skin brightening, antiseptic properties, and wound healing across South Asia for 4,000+ years; curcumin is active ingredient',
      nariyelPaani: 'Coconut water used topically in some South Indian traditions for skin cooling and brightening',
      multaniMitti: 'Fuller\'s Earth clay used as full-body mask for oil control and brightening, especially in Pakistan and North India'
    },

    modernRecommendations: {
      bodyAcne: 'Salicylic acid body wash 2% for back and chest acne; benzoyl peroxide 5% spot treatment',
      bodyHair: 'Laser hair removal most effective for Fitzpatrick III-IV (high melanin contrast); Nd:YAG for darker types; reduces PIH from repeated waxing',
      stretchMarks: 'Gotu kola (centella asiatica) during pregnancy; retinol post-partum; niacinamide for lingering PIH',
      eveningOut: 'Vitamin C body lotion or niacinamide for uneven tan lines; SPF daily on exposed areas prevents further darkening',
      dryness: 'Sesame oil or coconut oil post-shower; especially important in winter for vata imbalance'
    },

    keyIngredients: ['Turmeric/curcumin', 'Gram flour (besan)', 'Sesame oil', 'Coconut oil', 'Neem', 'Sandalwood', 'Multani mitti', 'Niacinamide', 'Salicylic acid'],

    culturalRituals: {
      ubtan: 'Pre-bridal haldi ceremonies involve full family application of ubtan to bride; community ritual around skin preparation',
      abhyanga: 'Ayurvedic self-massage recommended daily; different oils for different doshas (body types); sesame for Vata, coconut for Pitta, sunflower for Kapha',
      oilBath: 'Traditional oilBath in South India — sesame oil applied to body and hair before bathing, especially on Fridays/auspicious days'
    },

    qlooBrands: ['Biotique', 'Himalaya', 'Forest Essentials', 'Kama Ayurveda', 'Lotus Herbals', 'Khadi Naturals'],

    advice: `South Asian body care wisdom is thousands of years old. The ubtan tradition predates modern cosmetics
    and contains ingredients science is only now catching up to — turmeric's curcumin is genuinely anti-inflammatory,
    gram flour genuinely exfoliates. For modern concerns like body acne, salicylic acid is your friend.
    Laser hair removal is particularly effective for South Asian skin tones and eliminates the cycle of waxing PIH.`
  },

  caribbean: {
    communityName: 'Caribbean',
    skinProfile: 'Fitzpatrick IV-VI (varying by island heritage — African, Indian, mixed); humid tropical climate origins',
    hairProfile: 'Type 4 coils to 3C curls; body hair prone to ingrown hairs',

    traditionalBodyCare: {
      coconutOil: 'Universal Caribbean body moisturiser; applied after bathing from childhood; fractionated preferred for body, raw for hair',
      shea: 'Brought through diaspora; core moisturiser especially in Black Caribbean communities',
      seasalt: 'Ocean bathing and salt scrubs traditional; mineral-rich Caribbean sea salt for exfoliation',
      aloeVera: 'Grows wild across Caribbean; fresh gel applied to sunburns, rashes, skin healing; refrigerated gel especially cooling',
      limeAndCoconut: 'Traditional skin brightening preparations; WARNING: phytophotodermatitis risk from fresh lime juice + sun',
      blueIndigo: 'Traditional use in some islands for scalp and skin conditions'
    },

    modernRecommendations: {
      humidity: 'Caribbean-origin skin adapted to high humidity; may feel tight/uncomfortable in cold dry northern climates; richer moisturisers needed in winter',
      hyperpigmentation: 'Niacinamide + alpha arbutin for even tone; avoid DIY lime juice treatments (phytophotodermatitis risk)',
      stretchMarks: 'Shea + vitamin E popular; cocoa butter iconic; retinol for mature striae',
      bodyOil: 'Coconut oil + vitamin E + vitamin C serum layered for luminous body glow (Caribbean beauty ideal)',
      sunProtection: 'Even on deep skin tones: SPF 30+ on face and exposed body skin'
    },

    keyIngredients: ['Coconut oil', 'Aloe vera', 'Sea salt', 'Shea butter', 'Vitamin E', 'Niacinamide', 'Cocoa butter'],

    culturalRituals: {
      sunBathing: 'Sea salt + sun + fresh water bathing considered natural skin treatment',
      carnival: 'Body oiling and glitter for Carnival celebrations; luminosity is central Caribbean beauty expression',
      naturalMedicine: 'Bush medicine tradition: aloe, coconut, cactus, seagrape, and local herbs used for body skin conditions'
    },

    qlooBrands: ['Cantu', 'SheaMoisture', 'Cocoa Brown', 'Palmer\'s Cocoa Butter', 'Nubian Heritage'],

    advice: `Caribbean beauty is all about luminosity and skin that glows. The sea salt + coconut oil + aloe vera trinity
    has worked for generations. In northern climates, add richer butters to compensate for humidity loss.
    For hyperpigmentation, skip the DIY lime treatments (burn risk) and go straight to niacinamide and
    alpha arbutin — same brightening, zero risk.`
  },

  arab: {
    communityName: 'Arab / Middle Eastern',
    skinProfile: 'Fitzpatrick III-IV; warm to olive undertones; prone to tanning, body hair concerns, and hyperpigmentation',
    hairProfile: 'Dark, coarser body hair; significant cultural emphasis on hair removal (religious/cultural)',

    traditionalBodyCare: {
      hammam: 'Traditional Arab/North African bathhouse ritual involving steam, kessa mitt exfoliation, savon beldi (black soap) cleansing, ghassoul clay mask; full-body skin renewal',
      arganOil: 'Moroccan liquid gold; used for body and hair for centuries; UNESCO-recognized cultural heritage',
      ghassoul: 'Mineral-rich Moroccan lava clay (also called rhassoul); full-body mask for cleansing, softening, and mineral replenishment',
      savonBeldi: 'Traditional Moroccan black soap made from olives and eucalyptus; soften skin before kessa exfoliation in hammam',
      roseWater: 'Distilled from Moroccan/Turkish roses; toner, body mist, bath additive; refreshing and anti-inflammatory',
      henna: 'Body art tradition (mehndi) using Lawsonia inermis plant; also conditions skin where applied'
    },

    modernRecommendations: {
      hairRemoval: 'Threading, sugaring (halawa — traditional Middle Eastern sugar wax), laser; sugaring less traumatic than waxing for PIH prevention',
      afterHairRemoval: 'Salicylic acid 2% 48h after removal for ingrown prevention; soothing aloe immediately after',
      bodyOil: 'Argan oil + rose hip seed oil post-shower for luminous skin',
      hammamAtHome: 'Kessa mitt + savon beldi + steam shower mimics hammam; do monthly for dramatic skin renewal',
      hyperpigmentation: 'Niacinamide + argan oil for even tone; vitamin C for tan reduction'
    },

    keyIngredients: ['Argan oil', 'Rose water', 'Ghassoul clay', 'Savon beldi', 'Henna', 'Kessa mitt', 'Niacinamide', 'Sugaring wax (halawa)'],

    culturalRituals: {
      hammam: 'Weekly or bi-weekly hammam bath is social and spiritual ritual; women-only spaces; intergenerational bonding; bride preparation',
      halawa: 'Sugaring hair removal passed mother to daughter; natural alternative to waxing used for centuries across Arab world',
      oudBath: 'Burning oud incense while bathing; scenting body and hair with bakhoor before events'
    },

    qlooBrands: ['Moroccanoil', 'Huda Beauty', 'Argan Rain', 'Kahina Giving Beauty', 'NARS', 'L\'Occitane (Moroccan Rose)'],

    advice: `Arab body care centers on the hammam ritual — transformative monthly exfoliation that reveals entirely
    new skin. Invest in a good kessa mitt and authentic savon beldi to recreate this at home. Argan oil is
    genuinely exceptional for body moisturisation — light, fast-absorbing, and traditionally used across the
    Maghreb for generations. For the very common concern of hair removal PIH, sugaring (halawa) is gentler
    than waxing and causes less post-inflammatory darkening.`
  },

  latina: {
    communityName: 'Latina / Hispanic',
    skinProfile: 'Fitzpatrick III-V (wide range; light to deep depending on heritage — Indigenous, European, African)',
    hairProfile: 'Varies widely; type 2-4 depending on heritage; body hair concerns common',

    traditionalBodyCare: {
      coconutOil: 'Universal across Latin America; body moisturiser, stretch mark prevention, hair mask',
      aloeVera: 'Sábila — used fresh from the plant throughout Latin America for burns, skin healing, and moisturisation',
      avocado: 'Aguacate; full body mask or oil; rich in oleic acid and vitamins; traditional beauty food applied internally and externally',
      coffeeBody: 'Café grounds as body scrub; Brazil especially known for coffee body rituals; cellulite treatment tradition',
      arroz: 'Rice water (agua de arroz) used as skin toner and brightener; Asian and Latin overlap tradition',
      maizMorado: 'Purple corn (Peruvian tradition); anthocyanins antioxidant; natural color'
    },

    modernRecommendations: {
      cellulite: 'Coffee scrubs + dry brushing; firming creams with caffeine + retinol; maintain hydration',
      stretchMarks: 'Centella asiatica during pregnancy; vitamin C body serum for brightening; cocoa butter for hydration',
      evenTone: 'Niacinamide body lotion; salicylic acid for body acne common in humid climates',
      hairRemoval: 'Waxing PIH common; switch to sugaring or laser for reduction of post-treatment marks',
      sunProtection: 'High UV index climates of origin: SPF body lotion for arms, décolletage'
    },

    keyIngredients: ['Coconut oil', 'Aloe vera', 'Avocado', 'Coffee grounds', 'Rice water', 'Centella asiatica', 'Niacinamide', 'Vitamin C'],

    culturalRituals: {
      cafecito: 'Coffee body scrubs are bonding rituals; café de olla (Mexican spiced coffee) scrubs; Brazilian espresso body treatment',
      baby: 'Johnson\'s baby lotion iconic across Latin American households for generations; applied head to toe on children and adults alike',
      bridal: 'Pre-wedding treatments include full-body masks, scrubs, waxing rituals'
    },

    qlooBrands: ['L\'OCCITANE', 'Shiseido', 'Palmer\'s', 'Cocoa Brown', 'Neutrogena', 'Jergens Natural Glow'],

    advice: `Latina body care embraces richness and scent — moisturiser that smells like coconut or vanilla, scrubs
    that smell like coffee. This is culturally significant, not trivial. Fresh aloe from the plant is genuinely
    one of the best body treatments for heat rash, sunburn, or sensitive skin. For stretch marks during
    pregnancy, centella asiatica (gotu kola) has actual clinical evidence — more than cocoa butter alone,
    though combining them does no harm.`
  },

  'east-asian': {
    communityName: 'East Asian',
    skinProfile: 'Fitzpatrick II-IV; cool to neutral undertones; prone to dryness in cold climates; body PIH can occur',
    hairProfile: 'Fine to medium body hair; East Asian laser hair removal highly effective',

    traditionalBodyCare: {
      riceWater: 'Used across Japan, Korea, China for skin brightening and silkening for centuries; Japanese geisha tradition; inositol and B vitamins',
      cameliaOil: 'Japanese tsubaki oil — used in Kyoto geisha culture for face, body, hair; oleic acid rich; ultra-penetrating',
      greenTea: 'Matcha body treatments; EGCG antioxidant; anti-inflammatory; anti-aging; used topically and internally',
      sakeBath: 'Japanese sake (koji fermentation) bath tradition; contains kojic acid for brightening; enzymes smooth skin',
      onsen: 'Japanese hot spring bathing (mineral water); sulfur, sodium bicarbonate, calcium springs have different skin benefits; Beppu and Hakone traditions',
      ginsengBody: 'Korean red ginseng body treatments; anti-aging; circulation stimulating'
    },

    modernRecommendations: {
      italianTowel: 'Korean Italy towel (때밀이) exfoliation; dramatic dead skin removal; do every 2-3 weeks; follow with emollient oil',
      bodySerum: 'Korean body care evolving to include body serums, essences — not just lotion',
      ceramides: 'East Asian skin may have higher baseline ceramide levels; maintain with ceramide body lotion in winter',
      whitening: 'Body whitening/brightening products highly marketed in East Asian markets; niacinamide-based products effective and safe',
      sunProtection: 'Strong SPF culture in East Asia; apply to all exposed body skin; UVA protection especially important'
    },

    keyIngredients: ['Rice water', 'Camellia oil', 'Green tea/EGCG', 'Kojic acid', 'Niacinamide', 'Ceramides', 'Sake/koji ferment', 'Ginseng'],

    culturalRituals: {
      jjimjilbang: 'Korean bathhouse with various hot and cold rooms; Italy towel exfoliation; body scrub by professionals; weekly or monthly ritual',
      onsen: 'Japanese mineral hot spring bathing; different minerals for different skin benefits; cultural and spiritual ritual',
      bathroomRitual: 'Extended bathing (not quick showering) traditional across East Asia; time for skin care and relaxation'
    },

    qlooBrands: ['Hada Labo', 'Eucerin', 'CeraVe', 'Cetaphil', 'COSRX', 'Dear Klairs', 'Etude House Body'],

    advice: `East Asian body care is sophisticated — the Korea market is now producing body serums, essences, and
    multi-step body routines. The Italy towel jjimjilbang exfoliation experience is genuinely transformative
    if you've never tried it; most Korean spas in major cities offer it. For daily care, rice water as a
    pre-bath soak for hands and feet maintains the traditional brightening practice beautifully alongside
    modern ceramide body lotions.`
  },

  'east-african': {
    communityName: 'East African',
    skinProfile: 'Fitzpatrick V-VI; very deep melanin; prone to PIH, ashiness, and hyperpigmentation at friction points',
    hairProfile: 'Type 4 tight coils; body hair prone to ingrown hairs; PFB in men',

    traditionalBodyCare: {
      sheaButter: 'Widely used across East Africa; rich moisturiser; essential for preventing ashiness',
      goatMilk: 'Traditional body cleansing and moisturising in some East African pastoral communities; lactic acid content',
      frankincense: 'Boswellia tree resin; East Africa major producer; traditionally used for skin, wounds, and incense; anti-inflammatory; skin healing',
      myrrh: 'Commiphora tree resin; Somalia major producer; antimicrobial and wound-healing; traditional body application',
      habeshaCoffee: 'Ethiopian coffee ceremony; coffee grounds used as body scrub',
      saltAndHerb: 'Sea salt and herb body scrubs traditional in coastal Swahili communities'
    },

    modernRecommendations: {
      intensity: 'Very deep Fitzpatrick V-VI skin needs intensive moisturisation; layer shea butter over lotion',
      friction: 'Elbows, knees, ankles especially prone to hyperpigmentation; urea 20% + niacinamide nightly',
      ingrown: 'Tight Type 4 body hair especially susceptible to ingrowns; salicylic acid 2% on prone areas',
      bodyOil: 'Marula oil (Southern/East African) + shea for body; excellent combination of absorption and occlusion'
    },

    keyIngredients: ['Shea butter', 'Frankincense oil', 'Myrrh', 'Coffee scrub', 'Marula oil', 'Urea 20%', 'Niacinamide', 'Salicylic acid'],

    culturalRituals: {
      coffeeRitual: 'Ethiopian coffee ceremony; coffee grounds repurposed as body and face scrub',
      oilTradition: 'Body oiling before important occasions; spiritual and aesthetic practice',
      weddingPrep: 'Bridal beauty preparations involve full-body treatments; henna and oil rituals in Muslim East African communities'
    },

    qlooBrands: ['SheaMoisture', 'African Pride', 'Nubian Heritage', 'African Black Soap brands'],

    advice: `East African skin — especially Fitzpatrick VI — is stunning in its depth but needs consistent,
    intensive moisture to maintain its luminosity. The shea + urea combination is underutilized: urea softens
    hyperpigmented rough areas (elbows, knees) while shea provides deep occlusive moisture. Apply nightly for
    8 weeks and the transformation in elbow/knee tone is dramatic. Frankincense oil is genuinely one of the
    most underrated anti-aging, healing body oils available — Eastern African communities have known this for millennia.`
  },

  'south-african': {
    communityName: 'South African',
    skinProfile: 'Diverse Fitzpatrick II-VI reflecting diverse heritage (Zulu, Xhosa, Sotho, Coloured/Cape Malay, Indian-South African, white SA)',
    hairProfile: 'Type 3-4 (Black South African); straight-wavy (Cape Malay/mixed); fine (white SA)',

    traditionalBodyCare: {
      marula: 'Indigenous Sclerocarya birrea; Marula oil extracted from nut; traditionally used by San and Bantu peoples for centuries for skin and hair; now globally exported',
      rooibos: 'Aspalathus linearis; caffeine-free antioxidant herb unique to Cederberg mountains; aspalathin + nothofagin anti-inflammatory; used in body care and baths',
      umhlonyane: 'Artemisia afra (African wormwood); traditional Zulu and Xhosa healing herb; used in steam baths and skin treatments',
      shea: 'Less traditional in Southern Africa but widely adopted; part of pan-African beauty diaspora',
      buchu: 'Agathosma betulina; Cape indigenous herb; antibacterial; used in traditional Khoikhoi and Cape Malay medicine for skin'
    },

    modernRecommendations: {
      diversity: 'South African body care spans Fitzpatrick II to VI — product selection highly dependent on skin tone and heritage',
      darkSkin: 'Black South African skin: layer marula oil + shea butter; target elbows/knees with urea 20%',
      lightSkin: 'White South African skin: high skin cancer risk (high UV index); SPF 50 body sunscreen essential; skin cancer highest rates in world',
      rooibos: 'Look for rooibos extract in body lotions and bath products; genuinely anti-inflammatory and antioxidant',
      marula: 'Marula oil absorbs rapidly; excellent for all South African skin tones as body oil'
    },

    keyIngredients: ['Marula oil', 'Rooibos extract', 'Baobab oil', 'Buchu', 'Niacinamide', 'Vitamin C', 'SPF 50 (critical)'],

    culturalRituals: {
      umhlab: 'Clay body painting in Xhosa and Ndebele traditions; ochre and white clay with spiritual and aesthetic significance',
      beadwork: 'Ndebele body decoration; skin preparation is part of adornment culture',
      rooibosTeaBath: 'Rooibos tea bags added to bath water; traditional and modern Cape wellness ritual'
    },

    qlooBrands: ['Esse (SA organic)', 'Africology', 'Marula Natural Beauty', 'Skoon', 'The Body Shop (Marula range)'],

    advice: `South Africa's biodiversity gives it some of the world's most remarkable botanical skin ingredients —
    marula, rooibos, buchu, baobab. Marula oil is genuinely one of the best body oils for all South African skin tones:
    deep-absorbing, anti-aging, and African-sourced. White South African skin faces one of the world's highest skin
    cancer risks — SPF 50 body application is not optional, it's survival. Dark South African skin:
    marula + shea is the heritage combination that outperforms most modern body formulas.`
  },

  'black-american': {
    communityName: 'Black American',
    skinProfile: 'Fitzpatrick IV-VI; rich melanin; ashiness, PIH, hyperpigmentation at friction points are primary concerns',
    hairProfile: 'Type 4 tight coils; ingrown hairs, PFB; protective styles affect body skin at hairline',

    traditionalBodyCare: {
      petroleum: 'Vaseline (petroleum jelly) — the iconic Black American body moisturiser; "greasing" before school mornings; generations of use; still clinically validated as most effective occlusive',
      shea: 'Adopted through African diaspora connection; now cornerstone of natural Black beauty movement',
      cocoButter: 'Iconic for stretch marks (pregnant women, post-partum); Palmer\'s Cocoa Butter Formula cultural touchstone',
      blackSoap: 'African black soap imported and locally made; popular for body wash',
      lotion: 'Jergens, Vaseline Intensive Care, Lubriderm — drugstore lotions that are cultural touchstones',
      goldBond: 'Medicated powder and lotion; iconic comfort product across Black American households'
    },

    modernRecommendations: {
      ashRepair: 'Glycerin + shea butter + petrolatum after every shower; non-negotiable for Fitzpatrick V-VI',
      hyperpigmentation: 'Niacinamide 10% body lotion on elbows, knees, underarms; consistent 12-week use',
      stretchMarks: 'Tretinoin 0.05% for striae rubra; niacinamide + vitamin C for hyperpigmented striae',
      bodyAcne: 'Benzoyl peroxide wash for back/chest; salicylic acid body wash 2%',
      ingrown: 'Salicylic acid 2% in bikini and underarm areas after hair removal'
    },

    keyIngredients: ['Petrolatum/Vaseline', 'Shea butter', 'Cocoa butter', 'Glycerin', 'Niacinamide', 'Vitamin C', 'Salicylic acid', 'African black soap'],

    culturalRituals: {
      greasing: '"Greasing" — applying Vaseline or thick moisturiser before school; mother applying to child; intergenerational ritual of care and protection',
      cocoButter: 'Passing down Palmer\'s Cocoa Butter during pregnancy; maternal wisdom tradition',
      naturalMovement: 'Natural beauty movement (2010s+) created resurgence of shea butter, essential oils, DIY body butters in Black American communities',
      barbershop: 'Barbershop as community center extends to product recommendations; fade + body grooming culture'
    },

    qlooBrands: ['SheaMoisture', 'Cantu', 'Palmer\'s Cocoa Butter', 'Nubian Heritage', 'Carol\'s Daughter', 'Black Girl Sunscreen', 'CeraVe', 'Vaseline'],

    advice: `Black American body care wisdom is deep and functional. Vaseline (petrolatum) is not old-fashioned —
    it's clinically proven as the most effective occlusive available. The "greasing" tradition is scientifically
    sound: applying an occlusive after bathing locks in moisture and prevents ashiness better than any expensive
    cream. For the modern era, layer: glycerin lotion first, then shea butter, then seal with petrolatum on
    extremely dry areas like elbows and feet. Niacinamide 10% lotion applied to elbows and knees nightly
    for 12 weeks creates dramatic brightening that rivals professional treatments.`
  }
};

// ============================================================
// HELPER FUNCTION
// ============================================================

export function getBodyCareGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_BODY_CARE_GUIDES['west-african'],
    'south-asian': ETHNIC_BODY_CARE_GUIDES['south-asian'],
    'caribbean': ETHNIC_BODY_CARE_GUIDES['caribbean'],
    'arab': ETHNIC_BODY_CARE_GUIDES['arab'],
    'latina': ETHNIC_BODY_CARE_GUIDES['latina'],
    'east-asian': ETHNIC_BODY_CARE_GUIDES['east-asian'],
    'east-african': ETHNIC_BODY_CARE_GUIDES['east-african'],
    'south-african': ETHNIC_BODY_CARE_GUIDES['south-african'],
    'black-american': ETHNIC_BODY_CARE_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

// ============================================================
// STATS
// ============================================================

export const BODY_CARE_STATS = {
  moduleId: 'body_care_ethnic_guide',
  version: '1.0.0',
  communities: 9,
  topicsCount: 8,
  keyFacts: [
    'Striae (stretch marks) affect 50-90% of pregnant women across all ethnicities',
    'Petrolatum (Vaseline) reduces transepidermal water loss by 99% — most effective occlusive available',
    'The "3-minute rule": apply moisturiser within 3 minutes of shower for maximum benefit',
    'Acanthosis nigricans (dark underarm patches) can signal insulin resistance — see a doctor',
    'Urea 20% applied nightly to elbows/knees over 8-12 weeks significantly reduces hyperpigmentation',
    'Keratosis pilaris affects ~40% of adults regardless of ethnicity',
    'Shea butter has been used in West Africa for body care and healing for at least 3,000 years',
    'Phytophotodermatitis from lime juice on skin + sun exposure causes severe chemical burns — avoid DIY lime treatments',
    'South Africa has one of the world\'s highest skin cancer rates — SPF 50 body application is critical for lighter-skinned South Africans',
    'Korean Italy towel exfoliation removes a dramatic amount of dead skin buildup — do every 2-3 weeks for smoother texture'
  ],
  lastUpdated: '2026-10-29'
};
