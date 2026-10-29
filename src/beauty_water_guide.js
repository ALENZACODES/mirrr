/**
 * MIRRR — Beauty Waters Guide
 * Micellar water, thermal water, facial mists, toners, hydrosols,
 * essences, and water-based skincare science. All 9 ethnic communities.
 */

export const WATER_CHEMISTRY_BASICS = {
  title: 'Water Chemistry & Skin',
  hardVsSoftWater: {
    hardWater: {
      description: 'Water with high mineral content (calcium, magnesium ions); the majority of tap water in many countries',
      skEffect: 'Calcium and magnesium ions react with soap and cleansers to form insoluble "soap scum" deposits that remain on skin and hair; disrupts skin\'s natural pH (tap water ~7-8; skin ideal 4.5-5.5); can contribute to dryness, irritation, and in those predisposed, eczema flares',
      hairEffect: 'Calcium deposits on hair shaft increase friction, reduce shine, make hair feel rough; also reduces the effectiveness of conditioner',
      solutions: ['Shower filter: attaches to showerhead; removes calcium/magnesium and sometimes chlorine', 'Final rinse with diluted apple cider vinegar (for hair: balances pH, dissolves mineral deposits)', 'Chelating shampoo: contains EDTA or citric acid that binds and removes mineral deposits', 'Apply skincare immediately after washing while skin is still damp; barrier creams seal out mineral irritants']
    },
    chlorineInWater: {
      description: 'Municipal water is chlorinated to kill bacteria; residual chlorine reaches skin during washing',
      skEffect: 'Chlorine is an oxidant; denatures proteins including skin barrier proteins; strips natural oils; associated with skin dryness and potential irritation for those with sensitive skin',
      solutions: ['Shower filter with KDF or Vitamin C media removes chlorine effectively', 'Vitamin C neutralises chlorine: a small Vitamin C (sodium ascorbate) tablet dissolved in rinse water neutralises chlorine chemically']
    }
  },
  waterInFormulations: {
    aqua: 'Almost all skincare formulations list "Aqua" (water) as the first ingredient; water is the universal solvent and carrier; it is never "just filler" — the water quality and pH of a formulation significantly affect stability and efficacy',
    pH: 'Product pH profoundly affects efficacy: Vitamin C (L-ascorbic acid) works best at pH 3.5 or lower; AHAs/BHAs require acidic pH 3-4; retinoids work best at slightly acidic pH; moisturisers should be close to skin pH 4.5-5.5',
    surfactants: 'Micellar water, cleansers, and many toners contain surfactants — molecules with water-loving (hydrophilic) and oil-loving (lipophilic) ends that can lift oil, sebum, and makeup off skin and disperse them into the water phase',
    humectants: 'Water-based products contain humectants — molecules that attract and bind water molecules from the environment or deeper skin layers to the surface; key humectants: glycerin, hyaluronic acid, sodium PCA, urea, aloe vera'
  }
};

export const MICELLAR_WATER_GUIDE = {
  title: 'Micellar Water: Science & Use',
  history: 'Micellar water was developed in France in the early 2000s as a response to Paris\'s notoriously hard tap water, which was harsh and irritating on sensitive skin. Bioderma Sensibio H2O (launched 2000) became the cult classic that made micellar water internationally famous. French pharmacies became synonymous with micellar water as a gentle alternative to soap cleansing.',
  howItWorks: {
    micelles: 'Micellar water contains very low concentrations of surfactant molecules; in water at these low concentrations, surfactant molecules cluster into spherical structures called micelles — the water-loving heads face outward into the water; the oil-loving tails cluster in the center of the sphere; when the micelle contacts oil, sebum, or makeup on the skin surface, the oil-loving core of the micelle engulfs the oil particle; the water-loving exterior allows the whole complex (micelle + captured oil) to be rinsed or wiped away with a cotton pad',
    gentleness: 'The surfactant concentration in micellar water is too low to disrupt the skin barrier significantly — unlike regular cleansers with higher surfactant concentrations; this makes micellar water one of the gentlest possible cleansing methods'
  },
  types: {
    classic: { example: 'Bioderma Sensibio H2O', description: 'Clear, water-like; removes light-medium makeup, everyday SPF; rinse-free', forSkin: 'Sensitive, dry, normal' },
    micellar_oil: { example: 'Bioderma Atoderm Micellar Oil', description: 'Opaque; contains emollient oils in micellar suspension; removes heavy/waterproof makeup more effectively than classic; rinse-free', forSkin: 'Very dry, eczema-prone' },
    waterproof: { example: 'Garnier Micellar Water with Oil (Dual-Phase)', description: 'Two phases that must be shaken; oil phase dissolves waterproof formulas; water phase holds surfactants; shake before use', forSkin: 'Anyone wearing waterproof eye makeup or heavy coverage foundation' },
    gel: { description: 'Gel-format micellar cleanser; thicker; more cleansing power; not rinse-free', forSkin: 'Oily, combination' }
  },
  howToUse: {
    correct: ['Saturate a cotton pad fully — a barely-damp pad drags and can cause micro-tears in skin', 'Press the saturated pad onto the area; hold for 5-10 seconds to dissolve makeup before wiping', 'Wipe in one direction (don\'t scrub in circles)', 'Eye makeup: hold pad closed for 20-30 seconds; mascara, eyeliner, and eyeshadow need dissolution time before wiping; rushing causes the scrubbing that pulls lashes', 'For very heavy makeup: use micellar as a first cleanse, then follow with a regular cleanser (double cleansing)'],
    common_mistake: 'Rubbing vigorously instead of pressing-then-gliding; this drags skin, can cause broken capillaries (especially under eyes), and rips eyelashes out mechanically'
  },
  ethnic_note: {
    dark_skin: 'Cotton pad rubbing around the eye area can cause friction hyperpigmentation (PIH) on dark skin — dark circles can worsen; use the press-then-glide method; very saturated pad minimises friction',
    sensitive: 'For rosacea, eczema-prone skin (common in South Asian and East Asian communities): rinse-free micellar water is gentler than soap cleansing; choose fragrance-free, alcohol-free formulas'
  }
};

export const THERMAL_SPRING_WATERS = {
  title: 'Thermal Spring & Mineral Waters for Skin',
  overview: 'Thermal spring waters are mineral-rich natural spring waters used in skincare for their mineral content and perceived soothing properties. Several European spa towns have built entire beauty product lines around their spring water sources.',
  majorBrands: {
    avene: { origin: 'Avène, France (Cévennes region)', mineralContent: 'Low mineral content; particularly low calcium; neutral pH 7.5; notable for silica content', benefit: 'Calming to hypersensitive skin; anti-inflammatory properties documented; used in clinics for burn patients, eczema, psoriasis', research: 'One of the most clinically studied thermal waters; French dermatology hospitals use Avène thermal water post-procedure' },
    la_roche_posay: { origin: 'La Roche-Posay, France (Vienne region)', mineralContent: 'Selenium-rich (one of highest selenium content of any thermal water); also contains fluoride, silicates', benefit: 'Selenium is a powerful antioxidant; free radical damage repair; particularly noted for calming skin post-sun or post-procedure', research: 'Studies showing reduction in skin inflammation; soothing in atopic dermatitis' },
    vichy: { origin: 'Vichy, France (Auvergne region)', mineralContent: '17 minerals including calcium, sulfur, magnesium, manganese, cobalt, zinc, fluoride, silica; one of the most mineral-diverse thermal waters', benefit: 'Mineral-rich for overall skin health; Vichy became associated with hydrotherapy and medical spa culture' },
    uriage: { origin: 'Uriage-les-Bains, France', mineralContent: 'Bicarbonate-rich; contains magnesium, calcium, sulfur; isotonic to plasma (same osmotic pressure as blood)', benefit: 'Isotonic nature is theorised to allow skin to readily absorb the mineral content; very hydrating sensation' },
    saint_gervais: { origin: 'Mont Blanc region, France', benefit: 'High altitude spring water; Mont Blanc glacier source; very low mineral content; used as a neutral calming water' }
  },
  howToUse: {
    spray: 'Hold can/bottle 20-30 cm from face; mist lightly; can be left on as skin drink or immediately spritzed and patted in',
    postProcedure: 'Extremely valuable post-laser, post-peel, post-microneedling, post-waxing — soothing minerals reduce inflammation and discomfort',
    midFlight: 'In-flight skin care: cabin humidity 10-15% vs ideal 30-60%; thermal water mist as hydration top-up during long haul flights',
    midDay: 'For oily skin: spray to refresh without adding oil; set makeup; reduces shine; for dry skin: spray then seal with moisturiser to lock hydration in'
  },
  ethnic_applications: {
    South_Asian: 'Ayurvedic concept of "skin thirst" aligns with thermal water misting; rosewater (distilled from roses) is the traditional South Asian equivalent; thermal water mists are the modern clinical equivalent used post-facial procedures at clinics in India and globally',
    Arab: 'Rosewater (maa el ward) is the Arab/North African equivalent of a hydrating floral water mist; been used for centuries; modern thermal water sprays are adopted alongside this tradition in Gulf and Levant beauty routines',
    East_African: 'The Ethiopian and East African tradition of steam bathing (using frankincense and other botanicals) aligns with the concept of benefiting from mineralised water vapour on skin'
  }
};

export const FACIAL_TONER_GUIDE = {
  title: 'Facial Toners: Evolution & Science',
  history: 'Traditional toners (1980s-1990s) were alcohol-heavy astringents designed to "close pores" (pores don\'t open and close) and remove any remaining cleanser or hard water residue. They were often genuinely harmful to the skin barrier. Modern toners have been entirely reimagined.',
  types: {
    clarifying: { pH: '3-4', purpose: 'Prepares skin for active ingredients by lowering pH after alkaline cleansing; helps AHAs and BHAs work more effectively; may contain low concentrations of AHA or BHA itself', examples: 'Paula\'s Choice BHA Toner; COSRX BHA Blackhead Power Liquid', when: 'Before serums in the evening; after double-cleansing; oily/acne-prone skin' },
    hydrating: { pH: '5-7', purpose: 'Adds a layer of hydration before serum/moisturiser; often contains hyaluronic acid, glycerin, panthenol, centella asiatica', examples: 'Klairs Supple Preparation Toner; Pyunkang Yul Essence Toner; Hada Labo Premium Lotion', when: 'After cleansing, before serum; any skin type; morning and evening; core of Korean skincare' },
    exfoliating: { pH: '3-4', purpose: 'Contains meaningful concentrations of AHA (glycolic, lactic, mandelic) or BHA (salicylic) — more a treatment than a traditional toner', examples: 'The Ordinary Glycolic Acid 7% Toning Solution; Pixi Glow Tonic', when: 'PM only (AHAs cause photosensitivity); 2-3x per week maximum; NOT on sensitive, compromised, or recently irritated skin' },
    essence_toner_hybrid: { origin: 'Korean skincare invented the essence-toner (sometimes called a "first essence" or "skin")', purpose: 'Very watery but packed with beneficial fermented ingredients, probiotics, peptides; bridges toner and essence; provides deep hydration layer', examples: 'SK-II Facial Treatment Essence (famed for Pitera — fermented yeast derivative); Missha Time Revolution', when: 'Core step in K-beauty 7-step routines; after cleansing, before serum' }
  },
  applicationMethods: {
    cottonPad: 'Traditional; some friction; cotton absorbs some product; less product reaches skin than other methods',
    palmPatting: 'K-beauty technique: pour into palms; press palms to face; pat gently in upward motions; maximum absorption; zero waste; gentle; preferred method for hydrating toners',
    cottonPadSwipe: 'Better for exfoliating toners where the mechanical swipe helps the AHA/BHA reach the skin; good for removing remaining residue'
  },
  ethnicSkinConsiderations: {
    Fitzpatrick_V_VI: 'Alcohol-containing toners (old-style astringents) are particularly problematic for deeper skin tones — they disrupt the skin barrier, trigger reactive oiliness, and can cause irritation-related PIH; strictly avoid',
    Sensitive_skin: 'Eczema-prone skin common in South Asian, East Asian communities: use only fragrance-free hydrating toners; no exfoliating toners; add one product at a time to identify triggers',
    Oily_dark_skin: 'West African, East African, Black American skin: oiliness is common; AVOID using alcohol toners to control it; use BHA toner max 2-3x per week instead; always follow with lightweight moisturiser'
  }
};

export const FACIAL_MIST_GUIDE = {
  title: 'Facial Mists: Beyond Hydration',
  categories: {
    pure_water: { description: 'Distilled water or mineral water in a spray bottle; pure hydration; no actives', use: 'Refresh; cool down; mid-day refresh between steps' },
    hydrating_mist: { description: 'Water + humectants (glycerin, hyaluronic acid, aloe); actively hydrating', use: 'Refresh; between skincare steps; after sunscreen application (if formula compatible)' },
    setting_mist: { description: 'Contains polymers that help makeup adhere and last longer; often has a fine film-forming ingredient; fixes makeup on face', use: 'Over finished makeup look to set and extend wear', examples: 'Urban Decay All Nighter Setting Spray; NYX Matte Finish' },
    glow_mist: { description: 'Contains illuminating particles (mica, gold flecks) or reflective humectants; adds a luminous sheen over makeup', use: 'Over finished makeup for a dewy glow; culturally popular in West African and Black American beauty spaces for events' },
    aloe_mist: { description: 'Aloe vera in mist format; anti-inflammatory, soothing, lightly hydrating', use: 'Post-sun, post-waxing, irritated skin; soothing facial refresh' },
    rosewater: { description: 'Traditional hydrosol; distilled from rose petals; contains rose phenylethanol and other compounds; mild antibacterial, anti-inflammatory; beautiful scent; slight humectant properties', use: 'Mid-day refresh; toner; final step in skincare routine (light seal); most culturally universal beauty water across Arab, South Asian, East African traditions' }
  },
  howToMistCorrectly: {
    distance: '20-30 cm from face; too close creates large droplets that run; too far creates mist that evaporates before reaching face',
    timing: 'Apply to slightly damp skin; on completely dry skin, the mist evaporates fast taking moisture from the skin with it; ideal window is after serum, before moisturiser, while skin is still slightly damp',
    seal: 'Always follow a hydrating mist with a moisturiser or face oil to seal the moisture in; mist alone without a sealant can paradoxically lead to transepidermal water loss (TEWL)'
  }
};

export const HYDROSOLS_AND_FLOWER_WATERS = {
  title: 'Hydrosols, Floral Waters & Traditional Beauty Waters',
  whatIsAHydrosol: 'A hydrosol (also called floral water, hydrolat, or distillate water) is the water that remains after steam distillation of plant material for essential oils; it contains the water-soluble components of the plant including trace amounts of essential oil, minerals, and plant compounds; distinct from a rose water made by adding rose oil to water',
  rosewater: {
    origin: 'Persia (modern Iran); the rose-water city of Kashan has produced rosewater for over 2000 years; Gol-e-Mohammad rose (Rosa damascena) is the traditional distillation variety; Persian rose water was a luxury trade good exported throughout the Middle East, South Asia, and Europe',
    modernUse: 'Skincare toner; makeup setting spray; beverage (rose water lassie, rose syrup sherbet, Turkish rosewater desserts); culinary (baklava, Turkish delight, gulab jamun, mawa cake, rice pudding); religious use (Islamic tradition of using rosewater to clean mosques)',
    skinBenefits: 'Anti-inflammatory; mild antibacterial; humectant; pH 4.5-5.0 (compatible with skin); phenylethanol (main aromatic compound) has some antimicrobial activity',
    majorProducers: 'Iran (Kashan); Turkey (Isparta); Bulgaria (Rose Valley); Morocco (Dadès Valley)'
  },
  orangeBlossomWater: {
    description: 'Hydrosol from Citrus × aurantium (bitter orange) flowers; similar process to rosewater',
    origin: 'Morocco, Tunisia, Lebanon; maâ el ward el bartoqal (orange blossom water) central to North African and Levantine cuisine and beauty',
    skBenefits: 'Toning; anti-anxiety scent; slight antiseptic; used for oily and combination skin',
    culinary: 'Essential ingredient in Lebanese and North African desserts: mkhabez, baklava, qatayef, ma\'amoul; the aroma is immediately evocative of the Middle East'
  },
  lavendorHydrosol: {
    benefits: 'Anti-inflammatory; antimicrobial; calming scent; excellent for sunburn, insect bites, minor irritation',
    use: 'Body mist; face toner; pillow spray; after-sun spray'
  },
  witchHazel: {
    description: 'Hamamelis virginiana; a North American plant extract; natural astringent',
    traditional: 'Native American traditional medicine plant for wounds and inflammation',
    skinUse: 'Astringent toner; reduces appearance of pores; anti-inflammatory for acne; available alcohol-free (distilled hydrosol) or with alcohol (traditional alcohol-based); ONLY the alcohol-free version is recommended for regular skincare use on all skin types',
    warning: 'Alcohol-based witch hazel (the most common version in US drugstores) contains 14% alcohol — dries out skin, disrupts barrier, should not be used as a regular toner despite its popularity in this role'
  }
};

export const ETHNIC_BEAUTY_WATERS = {
  'west-african': {
    traditionalWaters: 'Rose water used in ceremonial contexts; spring water believed to have purifying properties; aloe vera juice applied to skin; hibiscus water (zobo water) used topically in some communities — rich in anthocyanins (antioxidants)',
    modernAdoptions: 'Thermal water mists used post-procedure at Lagos and Accra clinics; Fenty Skin is popular with West African women for its water-based formulations',
    recommendation: 'Hydrating toners with glycerin and HA suit the climate and skin needs well; thermal spring water for calming post-waxing or threading'
  },
  'south-asian': {
    traditionalWaters: 'Rose water (gulab jal) is the most essential beauty water; used as toner, cooling mist, makeup setting spray; cucumber water (applied as slices or blended cucumber juice strained) applied to skin for cooling; neem water (boiled neem leaves cooled and strained) used as astringent for acne; tulsi (holy basil) water for skin; kewra water (Pandanus amaryllifolius distillate) used in some communities',
    modernAdoptions: 'K-beauty essence-toners very popular with Indian consumers with wavy to curly hair; Indian-market formulations increasingly water-first and lightweight; micellar water huge in Indian market (Bioderma, Garnier)',
    recommendation: 'Ayurvedic hydrosols (rose, tulsi, neem) align with traditional values while providing modern skincare benefits; for humid South Asian climates, lightweight water-based toners without heavy oils'
  },
  caribbean: {
    traditionalWaters: 'Aloe vera (abundant throughout Caribbean) applied directly from the plant to skin as a soothing water-like gel; coconut water (fresh) applied to skin as a hydrating toner — contains cytokinins and lauric acid; sorrel (hibiscus) water applied topically; Jamaican pimento (allspice) water used as a toning astringent in folk beauty',
    modernAdoptions: 'Setting sprays very popular for carnival and event makeup (sweat-proof makeup needs a good setting spray in Caribbean heat); hydrating mists for managing dehydration in heat',
    recommendation: 'Coconut water toner; aloe vera gel diluted as a refreshing mist; tropical heat means lightweight, non-occlusive water-based products are practical and comfortable'
  },
  arab: {
    traditionalWaters: 'Rosewater (maa el ward) is the Arab beauty water — used for centuries throughout the Middle East and North Africa; maa el ward el bartoqal (orange blossom water) from North African tradition; kohl preparation sometimes involved water; oud-infused waters for fragrant skin misting; frankincense water (distillate) used in Oman and Arabian Peninsula for skin',
    modernAdoptions: 'La Roche-Posay and Avène thermal waters extremely popular across the Arab world (particularly Gulf); dermatology culture is very well-established; thermal water post-laser is standard practice',
    recommendation: 'Rose water as traditional toner; thermal water for post-treatment soothing; hydrating toners that are fragrance-free for those with sensitive skin (common in Gulf)'
  },
  latina: {
    traditionalWaters: 'Aloe vera (sábila) is available throughout Latin America; applied directly; used as a toner, hair gel, and wound healer; rosewater (agua de rosas) used especially in Mexico and Central America; cucumber water (agua de pepino) applied topically for skin; agua de azahar (orange blossom water) in some communities; palo santo water (boiled palo santo chips cooled) for aromatic refreshing mist in Andean communities',
    modernAdoptions: 'K-beauty toners and essences popular among Latina beauty consumers especially in the US; micellar water standard; tinted mists and setting sprays popular in Latinx makeup culture (dewy Latina skin requires good setting)',
    recommendation: 'Aloe vera as a natural, culturally familiar toner; hydrating mist before moisturiser in dry climates (Andes, Northern Mexico); setting spray essential for humid coastal climates (Caribbean coast of Colombia, Brazil)'
  },
  'east-asian': {
    traditionalWaters: 'Rice water is the quintessential East Asian beauty water — particularly Yao women and Japanese and Korean traditions; pearl powder water (pearl oyster shell hydrolysate dissolved in water — used in Chinese imperial beauty); camelia water; green tea water (applied as a toner — rich in EGCG catechins, antioxidants); sake (Japanese rice wine) used as a hydrating toner — contains kojic acid (natural skin brightener from fermentation)',
    koreanEssences: 'The Korean 7-step skincare routine places essence-toners as the third and fourth steps (after double-cleansing); this cultural practice has been the single biggest influence on the global skincare market in the last decade; terms: "skin" (스킨) = toner in Korean; "lotion" (로션) = emulsion in Korean; "essence" (에센스) = between toner and serum',
    japaneseCulture: 'Lotion (化粧水, keshousu) in Japanese = what Koreans call skin/toner; Hada Labo Gokujyun Premium Lotion became one of the best-selling toners globally due to its ultra-concentrated HA formula',
    recommendation: 'Rice water rinse for hair and face; green tea toner; hydrating essence-toner as a cornerstone of skincare routine; Hada Labo, Klairs, COSRX formula types are culturally authentic and highly effective'
  },
  'east-african': {
    traditionalWaters: 'Frankincense resin (Boswellia) water — boswellia resin dissolved or steeped in water and used on skin; aloe vera grows wild in East Africa and is used topically; moringa water (moringa leaf infusion) used in Ethiopian and Kenyan traditions; rose geranium water (pelargonium) used in Kenya; henna water preparation; Somali traditional: udsi (incense smoke bathing) for skin — the condensed water from the smoke contains compounds',
    modernAdoptions: 'Micellar water popular in urban East African markets; thermal water mists at city dermatology clinics in Nairobi, Addis Ababa, Dar es Salaam',
    recommendation: 'Moringa water toner (moringa leaf infusion — naturally rich in zeatin, a cytokinin that supports cell renewal); frankincense water for its traditional cultural resonance and genuine anti-inflammatory properties'
  },
  'south-african': {
    traditionalWaters: 'Rooibos tea water (Aspalathus linearis infusion applied to skin) — South African natural ingredient with high antioxidant content; buchu hydrosol (Agathosma betulina — Cape fynbos plant with antiseptic properties; used by Khoikhoi for centuries as body wash); aloe ferox water (Cape aloe — different from aloe vera; found at Cape); marula water',
    modernAdoptions: 'South African beauty brands increasingly feature rooibos and fynbos ingredients; Faithful to Nature (organic beauty retailer) prominent; thermal water mists from European brands well-established in South African skincare market',
    recommendation: 'Rooibos toner (brew strong, cool, apply with cotton pad — high in aspalathin, nothofagin and other flavonoids); buchu hydrosol for oily and acne-prone skin; authentic South African botanicals are genuinely active and culturally resonant'
  },
  'black-american': {
    traditionalWaters: 'Aloe vera juice (applied topically or consumed); rose water in some communities; witch hazel (alcohol-free) as an astringent toner — widely used; apple cider vinegar (diluted) as a pH-balancing toner — popular in Black American natural beauty community; glycerin-water mixture applied to damp skin',
    modernAdoptions: 'Hydrating toners for managing dark spot care; water-based serums for niacinamide and Vitamin C; setting sprays essential for completing the "snatched" full makeup look; LA Splash, NYX, and Fenty Beauty setting mists culturally popular',
    recommendation: 'Alcohol-free witch hazel as toner for oily, acne-prone skin; hydrating water-based toner with niacinamide for PIH (post-inflammatory hyperpigmentation) management; rose water mist as a refreshing final step'
  }
};

export function getWaterChemistryBasics() {
  return WATER_CHEMISTRY_BASICS;
}

export function getMicellarWaterGuide(type) {
  if (!type) return MICELLAR_WATER_GUIDE;
  const map = {
    science: MICELLAR_WATER_GUIDE.howItWorks,
    types: MICELLAR_WATER_GUIDE.types,
    howTo: MICELLAR_WATER_GUIDE.howToUse,
    history: MICELLAR_WATER_GUIDE.history
  };
  return map[type] || MICELLAR_WATER_GUIDE;
}

export function getThermalWaterGuide(brand) {
  if (!brand) return THERMAL_SPRING_WATERS;
  const map = {
    avene: THERMAL_SPRING_WATERS.majorBrands.avene,
    'la roche posay': THERMAL_SPRING_WATERS.majorBrands.la_roche_posay,
    laRochePosay: THERMAL_SPRING_WATERS.majorBrands.la_roche_posay,
    vichy: THERMAL_SPRING_WATERS.majorBrands.vichy,
    uriage: THERMAL_SPRING_WATERS.majorBrands.uriage
  };
  return map[brand.toLowerCase()] || THERMAL_SPRING_WATERS;
}

export function getTonerGuide(type) {
  if (!type) return FACIAL_TONER_GUIDE;
  const map = {
    clarifying: FACIAL_TONER_GUIDE.types.clarifying,
    hydrating: FACIAL_TONER_GUIDE.types.hydrating,
    exfoliating: FACIAL_TONER_GUIDE.types.exfoliating,
    essence: FACIAL_TONER_GUIDE.types.essence_toner_hybrid,
    application: FACIAL_TONER_GUIDE.applicationMethods
  };
  return map[type.toLowerCase()] || FACIAL_TONER_GUIDE;
}

export function getEthnicBeautyWaters(communityId) {
  const directMap = {
    'west-african': ETHNIC_BEAUTY_WATERS['west-african'],
    'south-asian': ETHNIC_BEAUTY_WATERS['south-asian'],
    caribbean: ETHNIC_BEAUTY_WATERS.caribbean,
    arab: ETHNIC_BEAUTY_WATERS.arab,
    latina: ETHNIC_BEAUTY_WATERS.latina,
    'east-asian': ETHNIC_BEAUTY_WATERS['east-asian'],
    'east-african': ETHNIC_BEAUTY_WATERS['east-african'],
    'south-african': ETHNIC_BEAUTY_WATERS['south-african'],
    'black-american': ETHNIC_BEAUTY_WATERS['black-american']
  };
  return directMap[communityId] || null;
}

export const BEAUTY_WATER_STATS = {
  moduleId: 'beauty_water_guide',
  version: '1.0.0',
  topics: ['micellar water', 'toner', 'thermal water', 'facial mist', 'rosewater', 'hydrosol', 'rice water', 'orange blossom water', 'witch hazel', 'aloe vera', 'porosity', 'hard water hair', 'K-beauty essence', 'setting spray', 'frankincense water'],
  communitiesSupported: 9,
  keyFacts: [
    'Bioderma Sensibio H2O micellar water was developed in France specifically because Paris tap water is notoriously hard and harsh — it became a cult classic globally',
    'La Roche-Posay thermal water contains some of the highest selenium concentrations of any natural spring water — selenium is a powerful antioxidant',
    'A hydrosol is the actual water condensed from steam distillation of plants — distinct from "rose water" made by mixing rose oil with water',
    'Fermented rice water contains inositol which fills cuticle gaps — the Yao women of Huangluo village in China attribute their Rapunzel-length hair to this practice',
    'Applying a hydrating mist WITHOUT a follow-up moisturiser can paradoxically increase transepidermal water loss as the water evaporates',
    'Alcohol-containing witch hazel (most common drugstore variety in the US) contains 14% alcohol and disrupts the skin barrier — only alcohol-free versions recommended as toner',
    'SK-II\'s Pitera (fermented yeast derivative) in its Facial Treatment Essence inspired the entire "essence" category in Korean and global skincare'
  ]
};
