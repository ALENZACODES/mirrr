/**
 * MIRRR — Menstrual Cycle Beauty and Skin Guide (Ethnic Focus)
 * Cycle-syncing beauty routines, hormonal skin changes, and ethnic considerations.
 */

export const CYCLE_BEAUTY_OVERVIEW = {
  title: 'Your Cycle and Your Skin: A Complete Guide',
  introduction: 'The menstrual cycle creates a predictable wave of hormonal changes that directly influence skin, hair, and overall appearance; understanding these changes allows for cycle-syncing beauty routines that work with your hormones rather than against them; this approach is particularly valuable for communities where hormonal conditions (PCOS, endometriosis, fibroids) are disproportionately prevalent',
  hormones: {
    estrogen: {
      name: 'Estrogen (Oestrogen)',
      peaks: 'Peaks just before ovulation (around Day 12-14 of a 28-day cycle)',
      skinEffects: 'Stimulates collagen and hyaluronic acid production → plumper, more hydrated skin; increases skin thickness and elasticity; promotes skin healing; at peak estrogen levels most people have their best skin days of the month; estrogen also increases skin luminosity and improves moisture barrier function',
      hairEffects: 'High estrogen prolongs the anagen (growth) phase of the hair cycle → more hairs in growth phase simultaneously = maximum hair thickness and density; this is the "pregnancy hair" effect — elevated estrogen in pregnancy keeps hair in anagen longer; post-partum estrogen crash → mass shift to telogen → post-partum hair shedding 3-4 months post-birth'
    },
    progesterone: {
      name: 'Progesterone',
      peaks: 'Peaks in the luteal phase (Days 15-28, between ovulation and menstruation)',
      skinEffects: 'Increases sebum production → oilier skin in the second half of the cycle; promotes skin swelling and fluid retention → pores appear larger; creates the pre-menstrual breakout environment; progesterone also has mild androgenic activity in some people, contributing to pre-menstrual acne',
      hairEffects: 'High progesterone in the second half of the cycle may cause slight scalp oiliness; progesterone can modulate sensitivity to androgens affecting the hair follicle'
    },
    androgens: {
      name: 'Androgens (Testosterone, DHEA, DHT)',
      skinEffects: 'Androgens directly stimulate sebum production via sebocyte (sebaceous gland cell) androgen receptors; androgen surge in the days before menstruation (when estrogen drops but androgens remain relatively high) is the primary driver of pre-menstrual breakouts; in PCOS, elevated androgens cause chronic acne, not just cyclical; DHT (dihydrotestosterone) is the primary driver of androgenetic alopecia (female pattern hair loss)',
      note: 'South Asian and Mediterranean women show higher androgen sensitivity in skin; PCOS prevalence ~20-25% in South Asian women creates a significantly more severe cyclical (or chronic) hormonal acne pattern'
    },
    prostaglandins: {
      name: 'Prostaglandins',
      skinEffects: 'Prostaglandins drive menstrual cramping through uterine muscle contraction; they also promote systemic inflammation; this systemic inflammatory state during menstruation can worsen inflammatory skin conditions (eczema, rosacea, psoriasis) during the period itself; NSAIDs (ibuprofen) reduce both cramping and the associated skin inflammation by inhibiting prostaglandin synthesis'
    }
  }
};

export const CYCLE_PHASES_BEAUTY = {
  menstruation: {
    phase: 'Menstruation (Days 1-5)',
    hormones: 'Estrogen and progesterone both at their lowest levels; prostaglandins elevated causing inflammation and cramping',
    skinState: 'Skin is at its most reactive and sensitive; the inflammatory state driven by prostaglandins can worsen eczema, psoriasis, rosacea; skin may appear duller due to low estrogen; breakouts from the preceding pre-menstrual androgen surge are still resolving; skin barrier is slightly compromised',
    beautyApproach: 'Gentle, minimal, barrier-supportive; avoid harsh exfoliants (AHA/BHA), retinoids, and new active ingredients; focus on hydration and comfort; fragrance-free and non-irritating formulas; the skin is most likely to react to new products during this phase — not the time to introduce new actives',
    routine: {
      morning: 'Gentle cleanser → calming serum (niacinamide, centella, aloe) → rich moisturiser → SPF',
      evening: 'Gentle cleanser → ceramide-heavy moisturiser or face oil → barrier protection',
      avoid: 'New exfoliants, retinoids, vitamin C, anything that tingles or feels active'
    },
    hairAndBody: 'Scalp may be at its most sensitive during menstruation; gentle, fragrance-free shampoo is preferable; body may feel bloated — water-reducing herbal teas (dandelion, nettle) are traditional remedies; magnesium supplementation can reduce cramping and may reduce associated inflammatory skin flares'
  },
  follicular: {
    phase: 'Follicular Phase (Days 6-13)',
    hormones: 'Estrogen rising steadily; FSH (follicle-stimulating hormone) rising; testosterone mid-range; progesterone low',
    skinState: 'Skin progressively improves as estrogen rises; collagen synthesis increasing; sebum production at its lowest for the month; pores appear smallest; skin barrier strongest; this is the recovery and renewal phase for skin',
    beautyApproach: 'Excellent time to introduce or resume active ingredients (retinoids, AHAs, vitamin C); skin is most resilient now; can tolerate exfoliation, treatments, and professional procedures; ideal phase for in-salon treatments (chemical peels, facials, laser consultations)',
    routine: {
      morning: 'Gentle or slightly stronger cleanser → vitamin C serum → lighter moisturiser → SPF',
      evening: 'Cleanser → retinoid or AHA exfoliant → lightweight moisturiser',
      good: 'Start new actives, retinoids, vitamin C; do professional treatments; get facials or peels'
    },
    hairAndBody: 'Hair is at its shiniest and most manageable as estrogen rises; excellent time for hair colour appointments (hair integrity is highest); energy levels rising — ideal for exercise which increases blood flow to scalp and skin; GlucoseGoddess-style glucose management during this phase can optimise skin clarity'
  },
  ovulation: {
    phase: 'Ovulatory Phase (Days 12-17)',
    hormones: 'Estrogen at its absolute peak just before ovulation; LH (luteinising hormone) surge triggers ovulation; brief testosterone spike at ovulation',
    skinState: 'Peak skin day of the month; maximum hydration, luminosity, and collagen synthesis; skin appears most radiant and plumped; pores at minimum size; if acne is a concern, this is typically the clearest phase',
    beautyApproach: 'Minimal intervention needed — skin is doing its best work; lighter makeup, showcasing natural radiance; great time for photography, important events, interviews; skin needs less product to look good',
    routine: {
      morning: 'Gentle cleanser → minimal serum → tinted SPF or light moisturiser with SPF → minimal makeup for a natural glow',
      evening: 'Cleanser → favourite treatment → moisturiser'
    },
    hairAndBody: 'Hair at its most voluminous, shiny, and manageable; natural fragrance is subtly elevated at ovulation (research shows preferences shift); energy and confidence at monthly peak — ideal time for social events or important professional occasions'
  },
  luteal: {
    phase: 'Luteal Phase (Days 17-28)',
    hormones: 'Progesterone rising (peaks around Day 21); estrogen has a secondary smaller peak then falls; androgens relatively elevated as estrogen drops; PMS symptoms emerge as hormones fall in the final days',
    skinState: {
      earlyLuteal: 'Days 17-21: progesterone rising → skin begins to produce more sebum; pores appear to enlarge; skin feels slightly oilier',
      midLuteal: 'Days 21-25: peak progesterone → maximum oil production; comedones (blackheads, whiteheads) forming; the biochemical environment for pre-menstrual breakouts is established here even though visible breakouts appear in Days 25-28',
      lateLuteal: 'Days 25-28: estrogen falls sharply; androgens remain relatively elevated → classic pre-menstrual breakout; most people with hormonal acne experience breakouts on the chin, jaw, and lower face (androgen-sensitive areas) in this window; skin may also appear duller; fluid retention can make skin look puffier'
    },
    beautyApproach: {
      general: 'Adapt to increasing oiliness; gentle oil control without over-stripping; pre-menstrual breakout prevention and treatment; maintain hydration (skin may feel simultaneously oily and dehydrated)',
      earlyLuteal: 'Switch to lighter moisturisers; add salicylic acid (BHA) spot treatment or toner; clay mask once or twice per week for pore management; zinc-based spot treatments',
      lateLuteal: 'Be kind to skin; avoid harsh picking or squeezing; targeted benzoyl peroxide or niacinamide spot treatment; reduce retinoid frequency if irritation increases; prioritise sleep and stress reduction (cortisol amplifies luteal breakouts)'
    },
    routine: {
      morning: 'Salicylic acid cleanser or gel cleanser → niacinamide serum (sebum control) → oil-free moisturiser → matte SPF',
      evening: 'Cleansing oil to dissolve makeup + salicylic acid cleanser → targeted BHA toner → niacinamide or zinc serum → lighter moisturiser → spot treatment on active breakouts',
      supplements: 'DIM (diindolylmethane from cruciferous vegetables) — some evidence for estrogen metabolism support; zinc supplementation 30mg/day — evidence for reducing inflammatory acne; spearmint tea 2 cups/day — 2009 RCT showing reduction in free testosterone and improvement in hormonal acne (particularly in PCOS)'
    },
    hairAndBody: 'Hair may feel less cooperative — higher progesterone causing slightly increased scalp oil; dry shampoo more likely to be needed; the body retains more fluid in late luteal — a temporary weight gain of 1-3kg of water is normal and will resolve; reduce high-sodium foods; increase potassium (leafy greens, avocado) to counteract fluid retention'
  }
};

export const ETHNIC_CYCLE_BEAUTY_GUIDES = {
  'west-african': {
    community: 'West African',
    prevalence: 'Fibroids (uterine leiomyoma) are significantly more common in Black African women than in any other ethnic group: studies consistently show 2-3× higher rates of fibroids in Black women versus white women in both Africa and the US diaspora; fibroids affect up to 60-80% of Black women by age 50 in some studies; larger, more numerous, and earlier-onset fibroids are characteristic; fibroids cause heavier menstrual bleeding (menorrhagia) which can lead to iron-deficiency anaemia',
    ironAndSkin: 'Iron-deficiency anaemia from fibroid-related heavy bleeding has direct skin effects: pallor (difficult to see in melanin-rich skin, but check inner lower eyelid — pale conjunctiva is a reliable sign); brittle nails with koilonychia (spoon-shaped nails); dry, dull skin; significant hair thinning and shedding (iron is a cofactor for ribonuclease reductase, which makes DNA for hair matrix cells); if you have heavy periods and also experience unexplained hair shedding and fatigue, iron-deficiency anaemia should be ruled out with a full blood count and serum ferritin',
    beautyImpact: 'Heavy menstrual bleeding creates a larger post-menstrual recovery demand: the recovery from heavy bleeding requires more iron, vitamin B12, and protein than typical menstrual losses; skin and hair recovery in the follicular phase may be slower after very heavy periods; iron supplementation (with vitamin C to enhance absorption), red meat and leafy green consumption, and monitoring ferritin (ideally above 70 ng/mL for hair growth) are particularly important for West African women with heavy periods',
    traditionalRemedies: 'West African traditional approaches to menstrual health: ginger tea for cramping (anti-prostaglandin effect); moringa (Moringa oleifera) as an iron and vitamin C source (widely grown across West Africa; moringa leaves have high iron content and the vitamin C content enhances iron absorption); baobab fruit powder (vitamin C for iron absorption; also high in antioxidants); palm wine in some traditional contexts; shea butter topical application for menstrual-related breast tenderness (progesterone effect)',
    recommendations: 'Full blood count and serum ferritin annually if periods are heavy; iron-rich foods throughout cycle (moringa, beef, kidney beans, leafy greens); vitamin C with every iron-rich meal; shea butter body massage in the luteal phase for skin comfort; gentle exercise during menstruation for prostaglandin reduction and improved blood flow'
  },
  'south-asian': {
    community: 'South Asian',
    pcos: 'PCOS (Polycystic Ovary Syndrome) prevalence is 20-25% in South Asian women — the highest prevalence in any ethnic group globally; PCOS in South Asian women often has a more severe phenotype: higher androgen levels; more significant insulin resistance; higher rates of metabolic complications; more severe acne and hirsutism (excess hair growth); the combination of PCOS, insulin resistance, and darker skin tone creates the most severe hormonal acne-PIH cycle of any community',
    pcosAndSkin: {
      acne: 'PCOS-driven acne in South Asian women: the elevated androgens of PCOS cause persistent, severe cystic acne (not just pre-menstrual breakouts but constant, deep, painful nodular acne); this is not typical teenage acne — it is hormonal and will not adequately respond to standard acne treatments without addressing the underlying hormonal driver; treating PCOS (with metformin for insulin resistance, spironolactone for anti-androgen effect, or combined oral contraceptives) is as important as topical treatments for acne in PCOS',
      pih: 'PCOS cystic acne on Fitzpatrick IV-V skin (typical South Asian skin tone) creates severe post-inflammatory hyperpigmentation (PIH); deep, inflamed cysts leave behind dark marks that can persist for 6-12 months; the PIH can be more disfiguring than the active acne; niacinamide (4-10%), vitamin C, azelaic acid (20%), and carefully dosed hydroquinone (2-4%) in prescription products under dermatologist supervision are the most effective PIH treatments',
      insulin: 'Insulin resistance in PCOS: high insulin levels stimulate the ovaries to produce more androgens (through the IGF-1 pathway) and reduce SHBG (sex hormone binding globulin — the protein that keeps testosterone bound and inactive); this creates a vicious cycle; reducing insulin resistance through diet (lower glycaemic index; reduce refined carbohydrates; increase fibre) and exercise reduces androgen production and directly improves PCOS skin outcomes'
    },
    ayurvedicCycle: 'Ayurvedic approach to menstrual wellness: Ayurveda views menstruation as apana vayu (the downward-moving life force); recommendations during menstruation include: rest (reducing intense physical activity); warming foods (ginger, cinnamon, warm milk with saffron and turmeric); sesame oil (til) massage of the lower abdomen for cramping; avoiding cold foods and drinks; the Ayurvedic lens on menstrual health is deeply body-respecting and values rest and inner attention during this phase',
    supplements: 'Evidence-based supplements for South Asian hormonal acne: spearmint tea 2 cups/day (2009 RCT showing anti-androgen effect; particular benefit in PCOS); inositol (myo-inositol + d-chiro-inositol, 40:1 ratio) — evidence for improving insulin sensitivity and androgen levels in PCOS; zinc 30mg/day for inflammatory acne; vitamin D supplementation (South Asians have high rates of vitamin D deficiency which worsens insulin resistance)',
    recommendations: 'PCOS screening if acne is persistent and cycle is irregular (blood: LH:FSH ratio, testosterone, DHEAS, fasting insulin, SHBG, vitamin D); low-GI South Asian diet modifications (brown rice, lentils, whole grains instead of refined white rice and bread); spearmint tea as a cycle-long practice; niacinamide + vitamin C dual approach to PIH; consult a dermatologist familiar with South Asian skin for PCOS acne management'
  },
  caribbean: {
    community: 'Caribbean',
    fibroids: 'Caribbean women of African descent share the elevated fibroid risk of African diaspora women; Afro-Caribbean women show similar rates to Black American and West African women; the heavy bleeding associated with fibroids is relevant to Caribbean women\'s beauty concerns for the same iron-deficiency reasons',
    skinCycle: 'Caribbean melanin-rich skin (Fitzpatrick IV-VI) has the same luteal-phase androgenic acne risk as other melanin-rich communities with the additional concern of PIH from inflammation; managing the luteal phase with salicylic acid, niacinamide, and zinc spot treatments is particularly important; avoiding picking or squeezing is critical to prevent PIH scarring',
    naturalRemedies: 'Caribbean traditional cycle remedies: soursop leaf tea (Annona muricata — antispasmodic properties, traditional use for menstrual cramps in the Caribbean); aloe vera juice for internal anti-inflammatory support; ginger root tea; scotch bonnet peppers and spicy foods are sometimes reduced during menstruation in traditional practice to avoid worsening cramping; lime juice (vitamin C) for iron absorption',
    phytophotodermatitisWarning: 'CRITICAL CYCLE WARNING: phytophotodermatitis from lime juice is a particular risk when lime is used in DIY beauty during the luteal phase or menstruation (when prostaglandin-driven inflammation may make skin more reactive); furanocoumarins in lime juice + UV exposure causes severe, potentially permanent hyperpigmentation; NEVER apply lime juice to skin before sun exposure, particularly relevant during Caribbean outdoor activities',
    recommendations: 'Iron-rich Caribbean foods throughout cycle (spinach, peas and rice, black beans, callaloo, saltfish); soursop leaf tea during menstruation for cramping; aloe vera from garden as a soothing topical during menstrual skin sensitivity; salicylic acid and niacinamide in luteal phase; SPF daily to prevent PIH from any breakouts'
  },
  arab: {
    community: 'Arab',
    geneticFactors: 'Arab women show varied hormonal profiles; Bedouin and North African Arab communities may have elevated androgen sensitivity; Arab women in the Gulf have some of the highest rates of PCOS globally (20%+ in some studies of Gulf Arab populations) — similar to South Asian prevalence; insulin resistance is a common PCOS driver in Arab communities partly related to refined-carbohydrate-rich traditional diets in the Gulf context',
    beautyAndCycle: 'Arab beauty tradition places enormous emphasis on the wedding (zawaj) and pre-wedding preparation; the comprehensive pre-wedding beauty program (hammam, hair removal with halawa/sugaring, henna, skin preparation) should ideally be timed to the follicular or ovulatory phase of the menstrual cycle when skin is most luminous and resilient; scheduling these treatments in the week after menstruation ends (Days 6-12) maximises skin receptivity',
    culturalModesty: 'The intersection of modesty culture and skincare: full body covering (hijab, abaya, niqab) has specific cycle-related skin implications; non-visible skin areas that are covered may have different sebum production and skin microbiome than sun-exposed skin; sweat accumulation under coverage may contribute to folliculitis or skin irritation during active periods; the cycle of coverage and uncovering (prayer washing, bathing) is already structured to encourage regular skin care',
    halawa: 'Halawa/sugar waxing and the cycle: skin sensitivity varies significantly by cycle phase; hair removal (halawa, waxing, threading) is best tolerated in the follicular phase (Days 6-13) when pain threshold is highest; most painful during menstruation (Days 1-5) when prostaglandin-driven inflammation is highest; many Arab women and beauty practitioners know intuitively that hair removal is most comfortable in the week or two after periods — this is a cycle-aware beauty practice already embedded in Arab beauty culture',
    recommendations: 'Schedule major beauty treatments (halawa, hammam, facial peels) in Days 6-13 for best outcomes; date syrup for iron (Arabian dates — extremely high in iron; important for any heavy-period days); black seed oil (Nigella sativa — habbatus sauda) as an internal supplement with some evidence for anti-androgen effect in PCOS'
  },
  latina: {
    community: 'Latina/Latin American',
    endometriosis: 'Endometriosis prevalence in Latina women: historically underdiagnosed due to healthcare access disparities; average diagnosis time for endometriosis is 7-10 years in all communities but longer in communities with healthcare access issues; endometriosis causes extreme menstrual pain, heavy bleeding, and infertility; the direct beauty implications include: severe iron-deficiency anaemia (same skin, hair, nail effects as fibroid-related anaemia); extreme stress of chronic pain (cortisol-mediated skin effects); the isolation and self-esteem impact of managing a debilitating chronic condition',
    skinCycle: 'Latina skin spans Fitzpatrick I-V; hormonal acne in Latina women with melanin-rich skin (Fitzpatrick III-V) has the same PIH risk as other communities; some Latina women of Indigenous ancestry (Mestiza; Maya; Aztec heritage) may have higher androgen sensitivity; hormonal acne in the premenstrual phase is a universal concern',
    traditionalRemedies: 'Latin American traditional menstrual care: te de manzanilla (chamomile tea) — well-evidenced anti-spasmodic effect for menstrual cramps through flavonoids that inhibit muscle contraction; te de canela (cinnamon tea) — anti-inflammatory, antispasmodic; yerba mate or café for fatigue during menstruation; warm corn masa applied externally for cramping in some traditions; ruda (rue herb — Ruta graveolens) — traditional but CAUTION: ruda is an emmenagogue (promotes menstruation) and is potentially abortifacient/toxic in large doses; should not be used during pregnancy',
    skincareAdvice: 'During menstruation: gentle te de manzanilla facial steam (anti-inflammatory, calming, connects to cultural tradition); aloe vera from garden plant as a soothing topical; avoid heavy makeup during menstruation to let skin breathe; during luteal phase: salicylic acid BHA, clay masks, niacinamide for oil control',
    recommendations: 'Te de manzanilla as a daily menstrual ritual (both internal for cramps and external as facial steam for skin); aloe vera plant as a skin care tool; iron-rich traditional foods (frijoles negros/black beans, spinach quesadillas, carne asada during follicular phase); magnesium-rich foods (cacao, pumpkin seeds — pepitas) to reduce cramping and improve skin'
  },
  'east-asian': {
    community: 'East Asian',
    tcmCycle: 'Traditional Chinese Medicine (TCM) views the menstrual cycle as a "micro-season cycle" with distinct energy (qi) and blood (xue) states in each phase that require different care; TCM menstrual phase theory aligns with modern cycle-syncing in many practical recommendations: rest and nourishment during menstruation; gradual rebuilding during the follicular phase; peak energy and activity around ovulation; consolidation in the luteal phase; this 2000-year-old framework anticipated modern circadian and cycle biology in practical lifestyle recommendations',
    tcmBeauty: {
      menstruation: 'During menstruation (TCM: the Heaven Water period): avoid cold foods and drinks (TCM recommends warm or room-temperature foods and herbal teas to support smooth qi and blood flow); ginger and red date (jujube) tea is the classic TCM menstrual support tea; rest is emphasised — this aligns with the modern understanding of prostaglandin-driven inflammation requiring recovery',
      follicular: 'Building the yin and blood phase (TCM perspective): foods to replenish blood — goji berries, black sesame seeds, dark leafy greens, red dates, black beans; these foods are also high in iron, folate, and antioxidants from a Western nutritional perspective',
      ovulation: 'Peak yang phase: highest energy; TCM recommends this as the optimal time for intense physical activity and important social and professional activities',
      luteal: 'Transition to yang decline: TCM recommends warming foods in the luteal phase; ginger, turmeric, and warming spices; evening primrose oil (GLA content) for PMS; the TCM luteal phase recommendations support progesterone-related oiliness management'
    },
    disordered_eating_note: 'NOTE: East Asian communities, particularly Korean and Japanese communities, have elevated rates of restrictive eating practices linked to extreme thinness beauty ideals; restrictive eating causes hypothalamic amenorrhoea (loss of menstruation from energy restriction); the loss of menstruation causes: loss of estrogen protection for skin and hair; accelerated skin ageing; bone loss; worsened hair shedding; from a beauty perspective, restriction worsens the skin and hair outcomes it attempts to optimise; adequate nutrition is the foundation of skin and hair health',
    skin: 'East Asian skin (Fitzpatrick II-IV) is generally oily in the luteal phase; the K-beauty approach to the luteal phase naturally incorporates cycle-appropriate elements: the double-cleanse responds to increased oil production; clay masks for pore management align with the luteal-phase pore-enlargement effect of progesterone; the lightweight hydrating essence responds to the fact that progesterone skin can be simultaneously oily and dehydrated',
    recommendations: 'Red date and ginger tea (jujube tea) during menstruation; goji berries and black sesame in the follicular phase for blood building; K-beauty double-cleanse in the luteal phase for oil management; mung bean clay mask in the luteal phase; white peony (bai shao) and dong quai (dang gui) herbal supplements under TCM practitioner guidance for cycle regulation'
  },
  'east-african': {
    community: 'East African',
    accessChallenges: 'In East Africa, menstrual hygiene management (MHM) is a significant public health issue with direct beauty and wellbeing implications: access to disposable menstrual products is limited in many areas; reusable menstrual pads and the menstrual cup are being promoted as sustainable alternatives; menstrual hygiene education has improved significantly through community programmes; in diaspora East African communities, access is not the barrier but cultural attitudes (menstruation as shameful or unclean in some community contexts) can affect willingness to discuss menstrual cycle beauty openly',
    skin: 'East African skin spans Fitzpatrick IV-VI; hormonal acne in the luteal phase leaves behind significant PIH on darker skin tones; Malassezia folliculitis (fungal acne — inflamed hair follicles infected with Malassezia yeasts, which are common in the tropics and on darker skin) can mimic or worsen alongside hormonal acne in the luteal phase; Malassezia folliculitis does not respond to antibacterial acne treatments and requires antifungal treatment (ketoconazole shampoo as a face wash is a common treatment)',
    traditionalRemedies: 'Ethiopian menstrual care traditions: tej (honey wine) in some traditional contexts; Teff (Ethiopian grain — extremely high in iron, particularly important for menorrhagia); gomen (Ethiopian collard greens — iron-rich); tesmi (Ethiopian spiced butter) as a warming abdominal massage for cramps; black cumin (nigella seeds) as an anti-inflammatory; frankincense resin (Boswellia papyrifera) burning during menstruation for spiritual cleansing and the documented anxiolytic effect of inhaled boswellic acid vapour',
    recommendations: 'Teff-based foods for iron during and after menstruation; frankincense burning as both a spiritual and wellbeing practice during menstruation; gentle sesame or tesmi oil massage for cramping; niacinamide + zinc in the luteal phase for oil control and PIH prevention; Malassezia folliculitis screening if back or chest acne does not respond to standard acne treatment'
  },
  'south-african': {
    community: 'South African',
    diversity: 'South Africa\'s extremely diverse ethnic population (Black African, Coloured/Mixed Race, Indian South African, White South African) means menstrual cycle beauty considerations span the full range of skin tones (Fitzpatrick I-VI) and genetic backgrounds',
    rooibos: 'Rooibos tea and the menstrual cycle: rooibos (Aspalathus linearis) is South Africa\'s most iconic herbal product and has specific relevance to menstrual cycle beauty; rooibos is naturally caffeine-free (avoiding the vasoconstriction effect of caffeine which can worsen menstrual cramps); rooibos contains the flavonoid aspalathin (unique to rooibos) and nothofagin, which have antioxidant and anti-inflammatory properties; rooibos has been studied for hormonal effects — some evidence suggests phytoestrogenic properties that may support the estrogen-low phases of the menstrual cycle; rooibos tea applied topically as a face mist or in a warm compress is anti-inflammatory during the reactive menstrual phase',
    botanicals: 'South African botanical cycle support: buchu (Agathosma betulina) — traditional Khoi San use for a range of conditions including as a diuretic relevant to the luteal-phase water retention; honeybush (Cyclopia spp.) — similar profile to rooibos with antioxidant and possibly phytoestrogenic properties; aloe ferox (Cape aloe — distinct from Aloe vera) — the gel is a topical anti-inflammatory; aloe ferox juice is used internally as a digestive bitter which may support gut health relevant to the gut-skin-hormone axis',
    blackTax: 'The "Black tax" economic pressure in South Africa (the expectation that employed Black South Africans support extended family financially) creates chronic financial stress that is amplified during periods; chronic financial stress → elevated cortisol → worsened luteal phase acne and PMS skin symptoms; recognising the connection between financial/structural stress and skin outcomes is important in the South African context',
    recommendations: 'Rooibos tea daily (caffeine-free support throughout the cycle; topical use as anti-inflammatory during menstrual phase); buchu leaf tea in the late luteal phase to reduce fluid retention; aloe ferox gel as a soothing topical; rooibos-based clay mask in the luteal phase (mix rooibos tea concentrate with kaolin clay for a culturally specific pore-cleansing mask)'
  },
  'black-american': {
    community: 'Black American',
    fibroids: 'Uterine fibroids in Black American women: the most significant cycle-related health disparity in this community; Black American women are 2-3× more likely to develop fibroids than white American women; develop them 5-10 years earlier; develop larger and more numerous fibroids; are 2-6× more likely to require hysterectomy for fibroids; the racial disparities in fibroid care (delayed diagnosis, more aggressive surgical intervention, less access to fertility-preserving uterine fibroid embolisation) are an area of ongoing healthcare advocacy',
    hairLossConnection: 'The hair loss-fibroid-iron connection in Black American women: heavy bleeding from fibroids → iron deficiency anaemia → diffuse hair shedding (telogen effluvium); this hair shedding is often unconnected to the fibroid diagnosis in most women\'s minds but is causally related; iron-deficiency hair shedding is completely reversible with iron restoration; identifying and treating the fibroid and the resulting anaemia is the most important intervention for fibroid-related hair shedding; many Black American women treating hair loss with expensive hair growth products when the underlying cause is a fibroid they may not know they have',
    stressAndCycle: 'Race-based traumatic stress and the HPA axis: the chronic stress of experiencing racism activates the HPA (hypothalamic-pituitary-adrenal) axis and maintains elevated cortisol; elevated cortisol amplifies every phase of the menstrual cycle\'s challenges: worsens luteal-phase breakouts; amplifies pre-menstrual inflammatory skin flares; disrupts the hair cycle; contributes to immune dysregulation that worsens eczema; this is not a metaphor — it is a documented physiological pathway that explains why social inequity is literally written into the skin',
    naturalHairCycle: 'The menstrual cycle and natural hair care timing in Black American community: the LOC (Liquid-Oil-Cream) method is most effective in the follicular and ovulatory phases when skin and scalp are least inflamed and sebum production is lowest; the luteal phase increased scalp oiliness requires adjustment to the LOC method (lighter oils; less cream); protective styles are particularly valuable during menstruation when scalp sensitivity is highest and manipulation should be minimised',
    recommendations: 'Fibroid screening (pelvic ultrasound) if periods are heavy, especially if hair shedding is occurring; serum ferritin monitoring (ideally above 70 ng/mL; iron-deficiency hair loss begins well before clinical anaemia); LOC method timing with the cycle (lighter products in the luteal phase); luteal phase: salicylic acid, niacinamide, zinc for oil control and PIH prevention; protect skin from UV during the luteal/menstrual phases when PIH risk from any breakout inflammation is highest'
  }
};

export function getCycleBeautyGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_CYCLE_BEAUTY_GUIDES['west-african'],
    'south-asian': ETHNIC_CYCLE_BEAUTY_GUIDES['south-asian'],
    caribbean: ETHNIC_CYCLE_BEAUTY_GUIDES.caribbean,
    arab: ETHNIC_CYCLE_BEAUTY_GUIDES.arab,
    latina: ETHNIC_CYCLE_BEAUTY_GUIDES.latina,
    'east-asian': ETHNIC_CYCLE_BEAUTY_GUIDES['east-asian'],
    'east-african': ETHNIC_CYCLE_BEAUTY_GUIDES['east-african'],
    'south-african': ETHNIC_CYCLE_BEAUTY_GUIDES['south-african'],
    'black-american': ETHNIC_CYCLE_BEAUTY_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

export const PERIOD_CYCLE_BEAUTY_STATS = {
  moduleId: 'period_cycle_beauty',
  version: '1.0.0',
  topics: ['menstrual cycle hormones estrogen progesterone androgens prostaglandins', 'follicular phase skin resilience active ingredients', 'ovulation peak skin radiance luminosity', 'luteal phase sebum oil production pre-menstrual acne', 'PCOS South Asian hormonal acne PIH', 'fibroids Black women iron deficiency anaemia hair loss', 'endometriosis Latina underdiagnosis', 'TCM Traditional Chinese Medicine cycle jujube goji berry', 'spearmint tea anti-androgen PCOS', 'cycle syncing beauty routine', 'rooibos South Africa phytoestrogenic', 'chamomile manzanilla menstrual cramps anti-spasmodic'],
  communitiesSupported: 9,
  keyFacts: [
    'Uterine fibroids are 2-3× more common in Black American and West African women than in white women, develop 5-10 years earlier, and are larger and more numerous; the heavy menstrual bleeding they cause leads to iron-deficiency anaemia that directly causes diffuse hair shedding (telogen effluvium); this hair shedding is causally connected to the fibroid but is rarely identified as such in clinical practice; many Black women spending money on hair growth products when the underlying cause is undiagnosed fibroids and iron deficiency that would respond to fibroid treatment and iron supplementation',
    'PCOS prevalence in South Asian women is 20-25% — the highest of any ethnic group globally — and the phenotype is more severe than in other groups: higher androgens, greater insulin resistance, more severe acne and hirsutism; the combination of severe androgenic acne on Fitzpatrick IV-V skin creates the most serious hormonal acne-PIH (post-inflammatory hyperpigmentation) cycle of any community; treating the underlying PCOS (with anti-androgens like spironolactone, insulin sensitisers like metformin, or combined oral contraceptives) is as important as topical treatment for managing hormonal acne in South Asian women',
    'Skin is most resilient and able to tolerate active ingredients in the follicular phase (Days 6-13 of a 28-day cycle) when estrogen is rising and sebum production is lowest; conversely, skin is most reactive and should avoid new actives or harsh treatments during menstruation (Days 1-5) when prostaglandins are elevated and the skin barrier is most compromised; scheduling professional treatments (chemical peels, laser, facials) in the follicular phase and avoiding them during menstruation is a practical, evidence-based cycle-syncing strategy',
    'Spearmint tea 2 cups/day has evidence from a 2009 randomised controlled trial for reducing free testosterone and improving hormonal acne, particularly in PCOS; the anti-androgenic mechanism of spearmint (Mentha spicata) may be through inhibition of 5-alpha reductase (the enzyme that converts testosterone to the more potent DHT) and by reducing the ovarian and adrenal production of androgens; this is the only herbal intervention for hormonal acne with RCT-level evidence'
  ]
};
