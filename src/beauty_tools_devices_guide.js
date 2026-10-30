/**
 * MIRRR — Beauty Tools and Devices Guide (Multicultural Focus)
 * LED masks, gua sha, jade rollers, facial massagers, dermaplaning, and more.
 */

export const BEAUTY_TOOLS_OVERVIEW = {
  title: 'At-Home Beauty Tools and Devices',
  marketContext: 'The at-home beauty device market exceeded USD 40 billion globally in 2023 and is the fastest-growing segment of the beauty industry; devices range from evidence-based tools with clinical backing (FDA-cleared LED devices, microneedling rollers) to items with limited scientific support (jade rollers for "toxin removal", crystal facial tools); this module evaluates each tool against the available evidence and provides specific guidance for melanin-rich skin types',
  evidenceStandard: 'We evaluate tools against: (1) mechanism of action — is the proposed mechanism biologically plausible? (2) clinical evidence — RCTs, controlled studies, FDA clearance; (3) safety for skin of colour — specific considerations for Fitzpatrick III-VI; (4) cultural context — traditional uses and their scientific re-evaluation'
};

export const LED_THERAPY_SCIENCE = {
  title: 'LED (Light-Emitting Diode) Phototherapy',
  mechanism: 'Photobiomodulation (PBM): specific wavelengths of light are absorbed by chromophores in skin cells (particularly cytochrome c oxidase in mitochondria); this absorption triggers biological responses including increased ATP production, altered cell signalling, reduced inflammation, and stimulated collagen production; differs from laser in that LED is non-coherent, non-ablative, low energy — it stimulates biological processes without causing thermal damage',
  wavelengths: {
    red: {
      wavelength: '620-700nm (red)',
      primaryTarget: 'Fibroblasts; mitochondria',
      effects: 'Stimulates collagen and elastin production; increases fibroblast proliferation; promotes wound healing; anti-inflammatory effects; 633nm is the most studied wavelength for anti-ageing',
      evidence: 'Wunsch & Matuschka (2014) RCT: red LED improved skin complexion, skin feeling, and collagen density measured by ultrasonography vs placebo; multiple case series and small RCTs demonstrate benefit for fine lines, skin texture, and wound healing',
      ethnicSafety: 'Safe for all skin types including Fitzpatrick V-VI; no thermal mechanism means no PIH risk; suitable for skin of colour'
    },
    nearInfrared: {
      wavelength: '800-1100nm (near-infrared, NIR)',
      primaryTarget: 'Deeper tissue; mitochondria in dermis and hypodermis',
      effects: 'Deeper penetration than visible light; wound healing; anti-inflammatory; tissue repair; commonly combined with red light in professional and home devices',
      evidence: 'Combined red + NIR therapy is the most studied combination; evidence for improved skin quality, wound healing acceleration, and anti-inflammatory effects',
      ethnicSafety: 'Safe for all skin types; no melanin interaction concerns at these wavelengths'
    },
    blue: {
      wavelength: '415-430nm (blue)',
      primaryTarget: 'Cutibacterium acnes (formerly P. acnes) bacteria in follicles; porphyrins produced by acne bacteria',
      effects: 'Blue light activates porphyrins in C. acnes bacteria → generation of singlet oxygen → bacterial destruction; anti-inflammatory through suppression of inflammatory cytokines',
      evidence: 'Papageorgiou et al. (2000) RCT: 5% benzoyl peroxide vs blue/red LED vs blue LED alone vs control; combination blue + red outperformed all others for inflammatory acne (76% reduction at 12 weeks vs 34% for BPO); FDA cleared for mild-to-moderate acne',
      ethnicSafety: 'Generally safe; no thermal mechanism; however, some concern about blue light (400-450nm) and melanin stimulation in darker skin — the evidence for blue light causing hyperpigmentation in Fitzpatrick IV-VI from low-energy LED devices is not well established, but some practitioners recommend caution with high-powered blue LED in Fitzpatrick V-VI; near-UV blue light (below 430nm) is of more theoretical concern than pure blue (430nm+)',
      ethnicNote: 'The majority of FDA-cleared at-home LED acne devices (Foreo UFO, Currentbody Skin, LightStim for Acne) use blue light wavelengths; given that acne disproportionately causes PIH in darker skin types, effective acne treatment with LED is a significant benefit; the theoretical blue light + hyperpigmentation concern for dark skin at LED device energy levels is not well evidenced — the anti-acne benefit likely outweighs the theoretical risk'
    },
    green: {
      wavelength: '520-540nm (green)',
      primaryTarget: 'Melanocytes; OxyHaemoglobin',
      effects: 'Proposed: reduces melanin production through effect on melanocytes; research limited vs red and blue light; some devices market green LED for hyperpigmentation and redness reduction',
      evidence: 'Limited high-quality RCT evidence specifically for green LED; some small studies suggest benefit for hyperpigmentation; more clinical research needed',
      ethnicSafety: 'No thermal mechanism; safe for all skin types'
    },
    yellow: {
      wavelength: '570-590nm (yellow)',
      primaryTarget: 'OxyHaemoglobin; skin redness; rosacea',
      effects: 'Reduces redness; anti-inflammatory effects; proposed: reduces oedema and sensitivity',
      evidence: 'Limited evidence compared to red and blue; used in some professional contexts for post-procedure recovery and rosacea',
      ethnicSafety: 'Safe for all skin types'
    }
  },
  devices: {
    professionalVsHome: 'Professional in-clinic LED panels (e.g. Dermalux, LightStim Pro) deliver significantly higher irradiance than home devices; home devices are effective but require more frequent use; key specifications: wavelength accuracy (nm), irradiance (mW/cm²), treatment time',
    topHomeDevices: 'FDA-cleared devices include: CurrentBody Skin LED Light Therapy Mask (633nm red + 830nm NIR; £399 — well-evidenced, CE marked, FDA cleared); Omnilux Contour Face (633nm + 830nm; FDA cleared; published clinical studies); Dr Dennis Gross Spectralite FaceWare Pro (red + blue; FDA cleared); Foreo UFO 3 (combined red + blue + thermoelectric)',
    ethnicConsiderations: 'LED therapy is genuinely one of the most skin-type-inclusive at-home technologies; the absence of a thermal mechanism makes it appropriate for all Fitzpatrick types; for skin of colour specifically, the collagen-stimulating benefits of red light are valuable (dark skin loses elasticity through structural ageing even when photoageing is less prominent); the acne-targeting benefits of blue light are significant given the PIH risk of acne in darker skin'
  }
};

export const MICROCURRENT_DEVICES = {
  title: 'Microcurrent Devices',
  mechanism: 'Microcurrent devices deliver very low-level electrical current (below the threshold of sensation — microamperes rather than milliamperes) to the facial muscles and tissues; proposed mechanisms: ATP stimulation in muscle cells; stimulation of fibroblasts (to produce collagen and elastin); re-education of facial muscles (contracting atrophied muscles); enhancement of product penetration through electroporation',
  evidence: 'Microcurrent has been used in professional settings (physical therapy, wound healing) for decades; evidence for facial aesthetic effects (lifting, toning) is largely from case series and before-and-after photography rather than RCTs; NuFace (the market leader) has published some clinical data; long-term randomised controlled data for cosmetic microcurrent is limited — the mechanism is biologically plausible but the cosmetic claims need stronger clinical evidence',
  popularDevices: 'NuFace Trinity (FDA cleared for facial toning; the best-known brand); NuFace Mini; Bear by Foreo (adds microcurrent to oscillation); Ziip Beauty (microcurrent + nanocurrent)',
  ethnicConsiderations: 'Microcurrent carries no melanin-interaction risk; safe for all skin types including Fitzpatrick V-VI; the lifting and toning benefits may be particularly relevant for skin types where volume loss and structural ageing (rather than photoageing) are the dominant concerns, as is more common in Black and African skin types; regular 5-minute sessions shown to produce cumulative effects with consistent use'
};

export const GUA_SHA_JADE_ROLLERS = {
  title: 'Gua Sha and Jade / Crystal Rollers',
  guaSha: {
    origin: 'Gua Sha (刮痧 — "scraping sha") is a Traditional Chinese Medicine (TCM) practice 2000+ years old; traditional gua sha uses a smooth-edged tool (originally a jade, stone, or bone tool) and firm scraping strokes on lubricated skin; the traditional therapeutic intent is to promote "qi" flow, release "sha" (stagnant blood causing disease), and treat musculoskeletal conditions; traditional gua sha produces intentional petechiae (small broken capillaries — the red "sha" marks) as the therapeutic goal; the force used is much greater than the gentle strokes of modern "facial gua sha"',
    modernFacialGuaSha: 'Modern facial gua sha is a significantly adapted, gentler version of traditional gua sha using smooth stones (jade, rose quartz, bian stone, stainless steel) with light pressure strokes; the intent is lifting and contouring, lymphatic drainage, reducing puffiness, and promoting skin radiance; modern facial gua sha does NOT create the petechiae of traditional gua sha — the force is much lighter',
    mechanism: 'Proposed mechanisms for facial gua sha: lymphatic drainage (manual stimulation of lymphatic flow reduces puffiness, particularly under-eye bags and morning facial swelling); fascial manipulation (the fascia — connective tissue — connecting skin to muscle is manipulated, potentially releasing tension and improving contour); improved microcirculation through light pressure and friction; relaxation of facial muscles through massage',
    evidence: 'Clinical evidence for modern facial gua sha specifically is extremely limited; the lymphatic drainage effect is mechanically plausible (gentle massage toward lymph nodes facilitates fluid movement); the "lifting" effects are largely temporary (immediate reduction in puffiness from lymphatic drainage; any lasting contouring effect from repeated use is not well documented in RCTs); gua sha is unlikely to cause lasting structural change in facial anatomy; it is a legitimate wellness and skin care ritual with real (primarily lymphatic drainage and relaxation) effects when used consistently',
    ethnicConsiderations: 'Jade gua sha tools: historically associated with East Asian culture and Traditional Chinese Medicine; the modern adoption of gua sha across all ethnic communities represents a significant cultural crossover that has been both celebrated (increased global awareness of TCM practices) and critiqued (commodification and stripping of cultural and medicinal context); for darker skin types, gua sha is very safe with appropriate oil/serum lubrication; the lymphatic drainage benefits are universal across skin types'
  },
  jadeRollers: {
    origin: 'Jade facial rollers have been documented in Chinese beauty practices since the 17th century Qing dynasty; jade was considered a symbol of beauty, purity, and vitality in Chinese culture and was associated with the mythological concept of jade preserving and beautifying skin',
    mechanism: 'Proposed mechanisms: lymphatic drainage through rolling motion; cooling effect (jade is naturally cool and retains coolness, which reduces puffiness through vasoconstriction); massage stimulation (improved microcirculation); enhanced product penetration (increased skin temperature from friction slightly increases penetration); cooling is particularly real — refrigerating a jade roller before use significantly amplifies the de-puffing effect',
    evidencePragmatic: 'Clinical RCT evidence for jade rollers specifically is essentially absent; the cooling and lymphatic drainage effects are mechanically real and immediately palpable (reduced puffiness, temporarily reduced redness); jade rollers are a legitimate skincare ritual tool for consistency of product application and daily self-care; the cosmetic "myths" to debunk: jade rollers do not "detoxify" the skin (the liver and kidneys do this); they do not permanently change facial structure; some sellers price "genuine jade" highly when the cosmetic effects are not dependent on the stone being real jade vs any smooth, cool stone',
    ethnicConsiderations: 'Safe for all skin types; no melanin interaction risk; the cooling effect is pleasant and beneficial for skin of all colours; the cultural origin should be respected and acknowledged when adopting the practice'
  }
};

export const DERMAPLANING_HOME = {
  title: 'Dermaplaning and Facial Razors',
  mechanism: 'Dermaplaning uses a sterile surgical scalpel (professional) or a single-edge razor (home dermaplaning tools, "butterfly knives") held at a 45-degree angle to the skin to physically exfoliate the stratum corneum and remove vellus hair (peach fuzz); leaves skin extremely smooth; allows better product penetration and makeup application',
  evidenceAndBenefits: 'The exfoliation effect of dermaplaning is real and immediate; removes the layer of dead cells and vellus hair that can cause makeup to sit unevenly; not the same as deep exfoliation — it exfoliates the very surface; products penetrate slightly better on dermaplaned skin because there is less physical barrier',
  ethnicConsiderations: {
    pihRisk: 'SIGNIFICANT CAUTION for Fitzpatrick IV-VI: dermaplaning creates micro-abrasions in the skin surface; in darker skin types, any skin injury can trigger PIH; professional dermaplaning by experienced practitioners in skin of colour is possible with proper technique and post-care (sun protection is mandatory immediately after); HOME dermaplaning carries higher risk for darker skin types because technique is less controlled',
    hairGrowth: 'The myth that dermaplaning causes hair to grow back thicker, darker, or faster is FALSE; vellus hair (peach fuzz) does not have the same hormonal regulation as terminal hair; cutting or shaving vellus hair does not change the follicle or its hormonal sensitivity; the "stubble" appearance comes from the blunt end of the cut hair — not from any physiological change',
    contraindications: 'Contraindicated over active acne (spreads bacteria), eczema or psoriasis plaques, open wounds, very sensitive or reactive skin'
  }
};

export const SONIC_FACIAL_DEVICES = {
  title: 'Sonic Facial Cleansing Devices and Massagers',
  sonicCleansers: {
    examples: 'Clarisonic (discontinued but popularised the category); Foreo Luna; Michael Todd Beauty Soniclear; Vanity Planet Ultimate Skin Spa',
    mechanism: 'Oscillating or pulsating bristles or silicone nubs move at high frequency (sonic range: 20-300 vibrations per second); create mechanical cleansing through the oscillating motion; Foreo Luna uses silicone nubs with T-Sonic pulsations; traditional bristle brushes provide more abrasive exfoliation',
    evidence: 'Sonic cleansing devices provide more thorough cleansing than manual cleansing; studies show removal of more dirt, oil, and makeup; Clarisonic-commissioned studies showed 6× better product absorption, 11× better cleansing vs hand cleansing — but these were company-sponsored; silicone devices (Foreo) are more hygienic than bristle brushes (which harbour bacteria)',
    ethnicConsiderations: 'Bristle-based sonic cleansers carry risk of over-exfoliation for sensitive darker skin types prone to PIH; silicone sonic devices (Foreo) are generally gentler and more appropriate for Fitzpatrick IV-VI; frequency matters — sonic devices should not be used more than 2-3 times per week on sensitive or PIH-prone skin'
  },
  galfacialmassagers: {
    examples: 'Theraface (TheraGun makers); TriPollar STOP EYE; NuFace products',
    mechanism: 'Various technologies combined: microcurrent + heat; vibration + red light; heat + massage; the combination approaches aim to address multiple skin ageing mechanisms simultaneously'
  }
};

export const SKIN_CARE_TOOLS_ANALYSIS = {
  cryotherapy: {
    name: 'Ice Rolling / Facial Icing / Cryo Sticks',
    mechanism: 'Cold application (ice, cryo sticks, refrigerated rollers) causes vasoconstriction → reduced redness and puffiness; local anaesthetic effect reduces discomfort; anti-inflammatory through reduced inflammatory mediator release; the cooling also tightens pores temporarily',
    evidence: 'The immediate puffiness-reduction and redness-reduction effects of cold are well-established physiologically; these are real, immediate effects, not permanent; particularly effective for morning puffiness; "cryo facials" (brief exposure of the face to very cold temperatures) are professional services based on the same principle',
    ethnicConsiderations: 'Safe for all skin types; the anti-inflammatory effect (reduces redness, reduces inflammatory response) is beneficial for darker skin by helping prevent PIH after minor skin insults; ice rolling after a chemical peel or active ingredient application can help calm any irritation and reduce inflammatory response',
    warning: 'Direct ice application to skin without a barrier can cause ice burns; wrap ice in a cloth; ice rollers with stainless steel heads avoid the frostbite risk'
  },
  steamers: {
    name: 'Facial Steamers',
    mechanism: 'Steam hydrates the stratum corneum, temporarily increases skin temperature, and opens follicular ostia (pore openings); steam increases skin hydration and softens the surface debris in pores, making it easier to extract comedones; steam also increases blood flow through vasodilation',
    evidence: 'Facial steaming before extraction (either professional or gentle home extraction) is part of standard aesthetician practice; the softening and hydrating effects are real; "opening pores" is a simplified description — pores do not have muscles and do not open and close, but steam softens the debris within them making extraction easier',
    ethnicConsiderations: 'Safe for all skin types; the humidity and hydration of facial steaming is particularly beneficial for dry skin types; caution with active rosacea or very sensitive skin (the heat can exacerbate redness); for skin of colour, facial steaming before applying a mask or treatment helps enhance penetration'
  }
};

export const ETHNIC_BEAUTY_TOOL_GUIDES = {
  'west-african': {
    community: 'West African',
    topToolRecommendations: [
      { tool: 'LED Therapy (Red Light)', why: 'Collagen stimulation without thermal risk; safe for Fitzpatrick V-VI; addresses the structural ageing (loss of elasticity and volume) that is the primary ageing concern in dark skin', bestDevice: 'CurrentBody Skin LED Mask or Omnilux Contour Face (633nm + 830nm)' },
      { tool: 'Gua Sha (Jade or Bian Stone)', why: 'Lymphatic drainage reduces puffiness; the cultural practice connects to a broader tradition of massage and skin care across African cultures; oil lubrication (shea butter, rosehip oil) is essential; very safe for Fitzpatrick V-VI', bestDevice: 'Jade or bian stone with facial oil; use light pressure with proper technique' },
      { tool: 'Microcurrent (NuFace)', why: 'Skin lifting and toning through muscle stimulation; no melanin interaction risk; addresses the volume and firmness loss that is a primary ageing concern in African skin; beneficial results with consistent use', bestDevice: 'NuFace Trinity or Mini (ensure conductive gel is used)' },
      { tool: 'Silicone Sonic Cleanser', why: 'Thorough cleansing for oily, acne-prone skin; more hygienic than bristle brushes; gentle enough for Fitzpatrick V-VI when used correctly', bestDevice: 'Foreo Luna 3 (silicone; not bristle)' }
    ],
    toolsToAvoid: 'Aggressive dermaplaning at home (PIH risk); high-frequency facial machines (unclear safety for very dark skin without professional supervision); facial scrubs with large abrasive particles (trigger PIH); any heating device (infrared massager, radiofrequency tools) without professional guidance — home RF and infrared devices can cause PIH in Fitzpatrick V-VI'
  },
  'south-asian': {
    community: 'South Asian',
    topToolRecommendations: [
      { tool: 'Jade Roller / Gua Sha', why: 'Deep cultural resonance with Ayurvedic facial massage traditions (abhyanga — self-massage with warm oil); lymphatic drainage helps with facial puffiness; consistent use supports the oil massage tradition already embedded in South Asian skincare', bestDevice: 'Jade or rose quartz gua sha + facial oil (rosehip, argan, or traditional sesame oil)' },
      { tool: 'LED Therapy (Red + Blue)', why: 'Red light stimulates collagen; blue light treats acne (particularly relevant for PCOS-related acne that is endemic in South Asian women); safe for Fitzpatrick III-V', bestDevice: 'CurrentBody Skin LED Mask or LightStim for Acne (for acne-specific use)' },
      { tool: 'Microcurrent', why: 'Toning and lifting; relevant for the structural ageing patterns in South Asian faces; no melanin interaction risk', bestDevice: 'NuFace Trinity or Bear by Foreo' },
      { tool: 'Facial Steamer', why: 'Pre-treatment preparation before mask or extraction; the steam-and-mask ritual aligns with the South Asian tradition of face packs (ubtan, turmeric masks, multani mitti); hydration benefit in often dry-climate or heated-building skin', bestDevice: 'Conair Facial Steamer or similar; 10-minute sessions maximum' }
    ],
    toolsToAvoid: 'Home dermaplaning without experience on darker skin (Fitzpatrick IV-V PIH risk); home radio-frequency devices at high settings; aggressive sonic brush on active acne (spreads bacteria, worsens PIH)'
  },
  caribbean: {
    community: 'Caribbean',
    topToolRecommendations: [
      { tool: 'LED Therapy (Red + Blue)', why: 'Acne treatment (blue) and collagen stimulation (red) relevant across Caribbean skin types; for Afro-Caribbean Fitzpatrick V-VI, red LED for structural ageing; for lighter-heritage Caribbean Fitzpatrick III-IV, broader LED benefits', bestDevice: 'CurrentBody Skin LED Mask (all wavelengths in one device)' },
      { tool: 'Ice Rolling', why: 'Cooling effect is particularly pleasant in the Caribbean climate; anti-inflammatory effect helps prevent PIH after acne; reduces morning puffiness; safe for all Fitzpatrick types', bestDevice: 'Any stainless steel ice roller; refrigerate before use for maximum cooling effect' },
      { tool: 'Gua Sha', why: 'Lymphatic drainage; skin radiance; the technique connects to the diverse massage traditions of the Caribbean (influenced by African, Chinese, and indigenous Caribbean healing traditions)', bestDevice: 'Jade or rose quartz gua sha' }
    ],
    toolsToAvoid: 'Aggressive dermaplaning at home for Afro-Caribbean Fitzpatrick V-VI (PIH risk); overuse of sonic cleansers on sensitive skin'
  },
  arab: {
    community: 'Arab',
    topToolRecommendations: [
      { tool: 'Microcurrent', why: 'Very popular in Gulf Arab markets; provides lifting and toning that complements the significant interest in non-invasive facial rejuvenation in Arab beauty culture; safe for Fitzpatrick III-IV Arab skin', bestDevice: 'NuFace Trinity; ZIIP Beauty (also popular in Gulf markets)' },
      { tool: 'LED Therapy', why: 'Red light for collagen stimulation; blue light for acne (significant concern in Gulf Arab skin due to diet, climate, and hormonal factors); safe for Fitzpatrick III-IV', bestDevice: 'CurrentBody Skin LED Mask; various Korean-made LED devices widely available in Gulf markets' },
      { tool: 'Gua Sha / Facial Massage', why: 'Connects to the hammam facial massage tradition; lymphatic drainage; morning ritual to reduce puffiness from the dry air conditioning prevalent in Gulf states', bestDevice: 'Jade or rose quartz gua sha; professional hammam facial massage monthly' }
    ],
    toolsToAvoid: 'Home dermaplaning without guidance; aggressive sonic cleansers on sensitive or acne-reactive skin'
  },
  latina: {
    community: 'Latina/Latin American',
    topToolRecommendations: [
      { tool: 'Gua Sha', why: 'Lymphatic drainage particularly relevant for melasma management (reduces inflammation that can worsen melasma); natural beauty ritual that aligns with the traditional plant-medicine and home remedy tradition in Latina beauty culture; connects to Mexican traditional medicine (curanderismo) approach to facial wellness', bestDevice: 'Jade, rose quartz, or obsidian (traditional volcanic stone native to Mexico and Central America) gua sha' },
      { tool: 'LED Therapy (Red)', why: 'Collagen stimulation safe for Fitzpatrick III-IV; addresses the sun damage accumulated in Latinas with high lifetime UV exposure; anti-inflammatory properties may support melasma management', bestDevice: 'Omnilux Contour Face or CurrentBody Skin LED Mask' },
      { tool: 'Facial Steamer', why: 'Pre-mask use enhances traditional masks (clay masks, avocado masks, turmeric masks of Latin American tradition); hydration in dry-climate or heated environments', bestDevice: 'Facial steamer used 2× weekly before applying traditional masks or skincare actives' }
    ],
    toolsToAvoid: 'Aggressive home dermaplaning on Fitzpatrick IV-V Latina skin (PIH risk); high-power home RF or infrared devices on Fitzpatrick IV-V without professional guidance'
  },
  'east-asian': {
    community: 'East Asian',
    topToolRecommendations: [
      { tool: 'Jade Roller and Gua Sha', why: 'These tools originate in Chinese beauty tradition (Qing dynasty and earlier); the jade roller and gua sha tools are literally coming home in East Asian skincare; lymphatic drainage; morning ritual puffiness reduction; connects to TCM facial massage tradition of anmo (Chinese massage)', bestDevice: 'Authentic bian stone or jade gua sha; jade roller from a reputable source' },
      { tool: 'Microcurrent', why: 'Very strong market in East Asian countries (particularly Korea — Bear by Foreo, Korean beauty microcurrent devices); suits the K-beauty preference for non-invasive daily rituals that accumulate results; the lifting effect is popular for V-line face shape goals', bestDevice: 'Bear by Foreo; NuFace; Korean beauty brand microcurrent devices (Clio, Galvanic Spa influenced products in Korean market)' },
      { tool: 'LED Therapy', why: 'LED facial masks are extremely popular in Korean beauty market (K-beauty innovation in at-home LED); K-beauty-born Omnilux is now international; safe for Fitzpatrick III-IV', bestDevice: 'Omnilux Contour Face; CurrentBody Skin; various K-beauty brand LED masks available in Korean market' },
      { tool: 'Sonic Cleanser (Silicone)', why: 'Deep cleansing for K-beauty double-cleansing routines; the K-beauty emphasis on very clean skin as the foundation of glass skin makes sonic cleansing popular in East Asian beauty culture', bestDevice: 'Foreo Luna 3 (Swedish brand, huge market penetration in Korea and Japan; silicone brush T-Sonic technology)' }
    ],
    toolsToAvoid: 'Aggressive home dermaplaning (Fitzpatrick III-IV PIH risk); over-exfoliation with both sonic devices and chemical exfoliants simultaneously (common mistake in K-beauty routines); high-powered home IPL on Fitzpatrick IV+ East Asian skin'
  },
  'east-african': {
    community: 'East African',
    topToolRecommendations: [
      { tool: 'LED Therapy (Red Light)', why: 'Collagen stimulation without thermal risk; safe for Fitzpatrick V-VI East African skin; addresses structural ageing concerns; inflammation reduction benefits from PIH-prone skin', bestDevice: 'CurrentBody Skin LED Mask or Omnilux Contour Face' },
      { tool: 'Gua Sha / Facial Massage', why: 'Connects to East African traditions of facial oil massage (Ethiopian butter-based massages; Eritrean skin care rituals); lymphatic drainage; very safe for all Fitzpatrick types', bestDevice: 'Jade or bian stone gua sha with neem oil, argan oil, or traditional East African botanical oils' },
      { tool: 'Ice Rolling', why: 'Anti-inflammatory; reduces post-PIH inflammation from acne or minor skin irritation; cooling relief in warm East African climates and diaspora locations without air conditioning', bestDevice: 'Stainless steel ice roller; refrigerate before use' }
    ],
    toolsToAvoid: 'Home dermaplaning (PIH risk); home microneedling devices (infection risk and keloid risk in Fitzpatrick V-VI without professional supervision); aggressive heat-based tools without professional guidance'
  },
  'south-african': {
    community: 'South African',
    topToolRecommendations: [
      { tool: 'LED Therapy (Red + Blue)', why: 'Red: collagen for Black South African Fitzpatrick V-VI structural ageing; Blue: acne treatment (acne common in younger Black South African communities); White South African Fitzpatrick I-III: red light for anti-ageing and reversal of significant UV photoageing accumulated in high-UV South African climate', bestDevice: 'CurrentBody Skin LED Mask (available through SA online retailers)' },
      { tool: 'Gua Sha', why: 'Lymphatic drainage; connects to the traditional African emphasis on self-care and beauty rituals; very safe for Fitzpatrick V-VI', bestDevice: 'Available through natural beauty retailers in Cape Town, Johannesburg; online' }
    ],
    toolsToAvoid: 'Home dermaplaning on Fitzpatrick V-VI (PIH risk); aggressive exfoliation tools on keloid-prone skin'
  },
  'black-american': {
    community: 'Black American',
    topToolRecommendations: [
      { tool: 'LED Therapy (Red + Blue)', why: 'Blue LED for acne treatment (significant issue in Black American skin with high PIH consequences); Red LED for collagen and anti-inflammatory effects (both safe for Fitzpatrick V-VI); one of the most culturally and clinically relevant at-home tools for Black American skin concerns', bestDevice: 'CurrentBody Skin LED Mask; LightStim for Acne; Omnilux Contour Face' },
      { tool: 'Microcurrent', why: 'Skin toning and lifting without thermal/melanin interaction risk; particularly relevant for Black American skin where structural ageing (rather than photoageing) is the dominant concern; complements the natural and non-invasive beauty preference that is growing in the natural beauty movement', bestDevice: 'NuFace Trinity or Mini; used consistently 5 days per week for cumulative results' },
      { tool: 'Ice Rolling', why: 'Anti-inflammatory properties help manage PIH from acne by reducing the inflammatory signal that triggers melanocyte overactivation; puffiness reduction; cooling; safe for Fitzpatrick V-VI', bestDevice: 'Stainless steel ice roller stored in freezer; use for 5 minutes on clean skin before skincare products' },
      { tool: 'Gua Sha', why: 'Lymphatic drainage; skin radiance; connects to the growing wellness-beauty movement in Black American communities that embraces holistic self-care practices; safe for Fitzpatrick V-VI with oil lubricant and gentle pressure', bestDevice: 'Rose quartz or jade gua sha; use with a generous amount of facial oil' }
    ],
    toolsToAvoid: 'Home dermaplaning (PIH risk for Fitzpatrick V-VI without professional training); home microneedling dermarollers at aggressive depths (infection risk; PIH risk; keloid risk without professional supervision — note: 0.2-0.3mm home rollers are very low risk; but 0.5mm+ home rollers are not recommended for Fitzpatrick V-VI); high-powered home IPL devices (almost universally contraindicated for Fitzpatrick V-VI — risk of burns and PIH)'
  }
};

export function getBeautyToolsGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_BEAUTY_TOOL_GUIDES['west-african'],
    'south-asian': ETHNIC_BEAUTY_TOOL_GUIDES['south-asian'],
    caribbean: ETHNIC_BEAUTY_TOOL_GUIDES.caribbean,
    arab: ETHNIC_BEAUTY_TOOL_GUIDES.arab,
    latina: ETHNIC_BEAUTY_TOOL_GUIDES.latina,
    'east-asian': ETHNIC_BEAUTY_TOOL_GUIDES['east-asian'],
    'east-african': ETHNIC_BEAUTY_TOOL_GUIDES['east-african'],
    'south-african': ETHNIC_BEAUTY_TOOL_GUIDES['south-african'],
    'black-american': ETHNIC_BEAUTY_TOOL_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

export const BEAUTY_TOOLS_STATS = {
  moduleId: 'beauty_tools_devices_guide',
  version: '1.0.0',
  topics: ['LED therapy photobiomodulation red blue light', 'jade roller gua sha lymphatic drainage TCM', 'microcurrent NuFace facial toning', 'dermaplaning vellus hair skin-of-colour PIH risk', 'sonic facial cleanser Foreo', 'ice rolling anti-inflammatory', 'at-home beauty devices skin-of-colour Fitzpatrick', 'LED therapy melanin safe all skin types', 'facial steamer pre-mask treatment'],
  communitiesSupported: 9,
  keyFacts: [
    'LED therapy (photobiomodulation) is one of the most skin-type-inclusive at-home beauty technologies because it works through a non-thermal, non-melanin-targeting biological mechanism (stimulating cytochrome c oxidase in mitochondria); the absence of thermal damage means there is no risk of PIH from LED exposure for Fitzpatrick IV-VI skin; this makes it one of the rare categories of at-home devices that is equally appropriate for all skin types including very dark skin',
    'The commonly stated "myth" that dermaplaning causes facial hair to grow back thicker, darker, or faster is FALSE: vellus hair (peach fuzz) does not have hormonal regulation driving terminal hair growth; cutting the hair shaft does not change the follicle or its biology; the perception of "stubbly" regrowth comes from the blunt end of the cut hair (which feels different to the tapered natural tip) not from any follicular change — however dermaplaning DOES carry PIH risk for darker skin types (Fitzpatrick IV-VI) because the micro-abrasions can trigger melanocyte overactivation',
    'Gua Sha was originally a Traditional Chinese Medicine therapeutic practice using firm pressure strokes that intentionally created petechiae (the "sha" — broken capillaries seen as red spots); modern "facial gua sha" is a significantly gentler adapted version that does NOT create petechiae; the primary real benefits of modern facial gua sha are lymphatic drainage (mechanically reducing facial puffiness by moving fluid toward lymph nodes) and relaxation; the structural "lifting" effects are largely immediate and temporary rather than permanent anatomical changes',
    'Home IPL (Intense Pulsed Light) devices are almost universally contraindicated for Fitzpatrick V-VI (very dark skin); IPL devices emit broad-spectrum light that is heavily absorbed by epidermal melanin in dark skin, causing burns, hyperpigmentation, and scarring; this contrasts with professional Nd:YAG 1064nm laser treatments which can be safely performed on dark skin in experienced hands; home IPL packaging typically warns against use in dark skin types and this warning should always be respected'
  ]
};
