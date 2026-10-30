/**
 * MIRRR — Teen & Adolescent Beauty Ethnic Guide
 * Puberty skincare, acne management, teen hair, self-esteem and beauty identity by community
 * Topics: sebum increase, hormonal acne, teen hair care, minimal routines, cultural beauty identity
 */

// ============================================================
// TEEN SKIN BIOLOGY
// ============================================================

export const TEEN_SKIN_BIOLOGY = {
  overview: `Adolescence triggers dramatic hormonal changes that fundamentally alter skin biology.
  The surge in androgens (testosterone in all sexes) dramatically increases sebum production,
  expands pore size, and creates the conditions for acne. The skin microbiome shifts;
  barrier function changes; pigmentation can become uneven. Understanding these changes helps
  teens build appropriate routines rather than over-treating with adult formulas.`,

  hormonalChanges: {
    androgens: {
      source: 'Adrenal glands and gonads begin producing androgens at puberty (typically ages 8-13 girls, 9-14 boys)',
      effect: 'Androgens bind to sebaceous gland receptors → glands enlarge (2-3x) → sebum production increases 2-5x',
      timeline: 'Sebum surge peaks at approximately 15-17; gradually moderates through early 20s for most'
    },
    sebumComposition: {
      teen: 'Teen sebum: higher squalene, higher wax esters, higher oleic acid vs. adult ratio',
      problem: 'Elevated oleic acid is comedogenic; disrupts skin barrier; C. acnes bacteria metabolize it into irritating fatty acids',
      treatment: 'Goal: normalize sebum production (not eliminate — some sebum is protective)'
    },
    estrogen: {
      girls: 'Estrogen increase supports collagen and skin thickness; but menarche triggers monthly hormonal acne for many',
      boys: 'Lower estrogen + higher DHT = typically more severe teen acne in boys; larger pores persist'
    }
  },

  acneMechanism: {
    steps: [
      '1. Androgen-driven sebum overproduction',
      '2. Abnormal keratinization — skin cells inside pore shed abnormally, block pore opening',
      '3. Comedone (blackhead or whitehead) forms — clogged pore',
      '4. Cutibacterium acnes (C. acnes) bacteria colonize clogged follicle',
      '5. Bacteria metabolize sebum → inflammatory fatty acids',
      '6. Immune response → inflammation → papule, pustule, cyst'
    ],
    types: {
      nonInflammatory: 'Blackheads (open comedone): oxidized sebum; Whiteheads (closed comedone): covered pore',
      inflammatory: 'Papules (raised, red), Pustules (pus-filled), Nodules (deep, large, painful), Cysts (deep cystic acne — highest risk for scarring)'
    },
    grades: {
      mild: 'Grade 1-2: mostly comedones, few inflammatory lesions; OTC treatment appropriate',
      moderate: 'Grade 3: multiple inflammatory papules and pustules; consider prescription',
      severe: 'Grade 4: nodules, cysts, widespread; dermatologist needed; risk of permanent scarring'
    }
  },

  teenVsAdultSkin: {
    teens: {
      oilier: 'Significantly higher sebum production — routine should focus on oil management without stripping',
      moreReactive: 'Teen skin more reactive to harsh ingredients; avoid high-concentration actives',
      heals: 'Faster healing capacity — minor lesions heal quickly with proper treatment',
      lessSunDamage: 'Sun damage is cumulative — teen years are when sun protection habits form (or don\'t)'
    },
    appropriateIngredients: ['Salicylic acid 0.5-2%', 'Benzoyl peroxide 2.5-5%', 'Niacinamide 5%', 'Gentle AHAs (lactic acid 5-10%)'],
    tooStrong: ['Retinoids (Rx only for teens with severe acne; OTC retinol inappropriate as first line)', 'High-concentration glycolic acid', 'Kojic acid for extended use', 'Hydroquinone without medical supervision']
  },

  simpleRoutine: {
    morning: [
      'Gentle cleanser (cream or gel, fragrance-free)',
      'Lightweight moisturizer or gel moisturizer (oil-free for oily skin)',
      'Broad-spectrum SPF 30+ (non-comedogenic, lightweight formula)'
    ],
    evening: [
      'Double cleanse if wearing sunscreen or makeup (oil/balm first, then cleanser)',
      'OR single cleanse if no sunscreen/makeup',
      'Acne spot treatment (benzoyl peroxide 2.5% or salicylic acid 2%)',
      'Moisturizer (even oily skin needs moisture — without it, skin overproduces oil to compensate)'
    ],
    weekly: ['Exfoliating cleanser or mask (not needed if already using BHA/AHA)']
  }
};

// ============================================================
// TEEN ACNE MANAGEMENT
// ============================================================

export const TEEN_ACNE_MANAGEMENT = {
  overview: 'Acne affects 85% of teens at some point; severity varies enormously by genetics, ethnicity, hormones, and routine',

  OTC: {
    salicylicAcid: {
      mechanism: 'BHA (beta hydroxy acid); oil-soluble; penetrates into pore; dissolves sebum; exfoliates inside follicle',
      concentration: '0.5-2%; higher = more effective but more drying',
      bestFor: 'Blackheads, whiteheads, oily congested skin',
      forms: 'Cleanser (shorter contact), toner (medium contact), serum/spot treatment (longest contact)'
    },
    benzylPeroxide: {
      mechanism: 'Oxidizing agent; kills C. acnes bacteria; reduces inflammation; mildly comedolytic',
      concentration: '2.5% as effective as 10% with less irritation; start 2.5%',
      bestFor: 'Inflammatory acne (papules, pustules)',
      caution: 'Bleaches fabrics and pillowcases; use white pillowcase; rinse off formulations reduce bleaching'
    },
    niacinamide: {
      mechanism: 'Reduces sebum production; anti-inflammatory; reduces PIH; barrier support',
      concentration: '5-10%; well-tolerated; suitable for all skin types including sensitive',
      bestFor: 'Oily skin, post-acne marks, sensitive skin that can\'t tolerate BHA/BPO'
    },
    adapalene: {
      mechanism: 'Retinoid; normalizes keratinization; prevents comedone formation; anti-inflammatory',
      concentration: '0.1% gel now OTC in US (Differin)',
      bestFor: 'Prevention of acne; comedonal and mild-moderate inflammatory acne',
      note: 'Most evidence-based OTC acne treatment besides BPO; use every other night → build to nightly'
    }
  },

  prescription: {
    topicalRetinoids: 'Tretinoin, tazarotene: stronger; require prescription; most effective for all acne types',
    antibiotics: 'Topical clindamycin/erythromycin: anti-inflammatory; always combined with BPO to prevent resistance',
    oral: {
      antibiotics: 'Doxycycline, minocycline: for moderate-severe; 3-6 month maximum; resistance concern',
      OCP: 'Oral contraceptives (certain types): FDA approved for acne in girls; reduces androgen activity',
      spironolactone: 'Anti-androgen; blocks DHT at sebaceous gland; for adult female hormonal acne',
      isotretinoin: 'Accutane: severe nodular/cystic acne only; potentially curative; serious side effects; strict monitoring required'
    }
  },

  PIH: {
    definition: 'Post-inflammatory hyperpigmentation: dark spot left after pimple heals',
    ethnicRisk: 'Higher risk in Fitzpatrick types III-VI; more melanin = more PIH per inflammatory event',
    prevention: 'Avoid picking; use anti-inflammatory ingredients; SPF (UV darkens PIH); treat acne promptly',
    treatment: ['Niacinamide 10%', 'Alpha arbutin 2%', 'Azelaic acid 10-15%', 'Vitamin C (L-ascorbic acid)', 'Tranexamic acid']
  },

  mentalHealth: {
    impact: 'Acne has documented negative impact on self-esteem, social anxiety, depression — especially in teen years',
    normalize: 'Acne is near-universal in teens; not a hygiene failure; not caused by "bad" food in most cases',
    whenToSeek: 'Dermatologist if: severe, scarring, not responding to OTC after 8-12 weeks, significant emotional distress',
    sensitivity: 'Adults: avoid shaming language; celebrate any improvement; acne never defines worth'
  }
};

// ============================================================
// TEEN HAIR GUIDE
// ============================================================

export const TEEN_HAIR_GUIDE = {
  overview: 'Teen hair changes: sebum increase makes scalp oilier; hormonal shifts can cause temporary shedding; texture may change slightly during puberty',

  scalp: {
    oilierScalp: 'Androgen-driven sebum increase affects scalp more than skin for some teens; scalp oiliness peaks mid-puberty',
    washFrequency: {
      straight: 'Type 1: daily washing often appropriate and preferred for oily scalp',
      wavy: 'Type 2: every other day; dry shampoo between',
      curly: 'Type 3: 2-3x weekly maximum; over-washing is biggest mistake',
      coily: 'Type 4: weekly or biweekly; over-washing destroys natural oils protective for Type 4'
    },
    dandruff: 'Teen dandruff common: Malassezia yeast thrives with increased sebum; zinc pyrithione, selenium sulfide, or ketoconazole shampoos effective'
  },

  naturalHairTeen: {
    discovery: 'Many Black teens discover/embrace natural texture in adolescence; this can be fraught or empowering',
    firstNatural: 'First natural hair journey: protective styles reduce manipulation; co-washing; LOC method; finding your curl pattern',
    schoolPolicies: 'Natural hair policies in schools: CROWN Act (Creates a Respectful and Open World for Natural Hair) protects natural hair in many US states',
    social: 'Natural hair acceptance varies by community; diaspora teens may face more pressure to chemically straighten'
  },

  protectiveStyles: {
    school: 'Box braids, cornrows, twists: protective styles ideal for school year — low manipulation, reduced breakage',
    care: 'Under protective style: keep scalp moisturized; oil scalp weekly; don\'t keep style longer than 6-8 weeks',
    braids: 'Braids too tight = traction alopecia (hair loss at edges); loose braids preferred; take breaks between styles'
  }
};

// ============================================================
// 9 COMMUNITY TEEN BEAUTY GUIDES
// ============================================================

export const ETHNIC_TEEN_BEAUTY_GUIDES = {
  'west-african': {
    communityName: 'West African Teen',
    skinConcerns: ['Deeper skin tones (Fitzpatrick IV-VI) → acne triggers more PIH', 'Oily skin + climate humidity', 'Social pressure around skin lightening — RESIST'],

    acne: {
      approach: 'Niacinamide-forward for PIH prevention; BPO if inflammatory acne present; SPF essential',
      PIH: 'Dark spots post-acne are common and can last months; niacinamide + azelaic acid best teen-safe duo',
      avoid: 'Harsh scrubs (cause more PIH); skin lightening creams (dangerous mercury/steroid content in some African market products)'
    },

    hair: {
      type: 'Predominantly Type 4a-4c; natural texture care',
      school: 'Protective styles for school year: braids, twists; bonnet at night',
      discovery: 'Many West African teens are discovering traditional hair practices (scalp oiling, protective styling) that ancestors knew and Westernization temporarily disrupted'
    },

    cultural: {
      colorism: 'Colorism (skin tone discrimination) is real within West African communities; affirm that darker skin is beautiful; reject skin bleaching',
      tradition: 'West African beauty traditions for teens: shea butter from grandmother, black soap for acne-prone skin, moringa oil as first facial oil'
    },

    advice: `West African teen skin is designed for its environment — it has more melanin, which gives some UVB protection but not enough on its own,
    and more resilience than lighter skin tones. Acne is the challenge, and dark spots (PIH) are the
    secondary challenge. Simple routine: gentle gel cleanser + niacinamide 5-10% serum + light moisturizer +
    broad-spectrum SPF. Black soap for cleansing is a valid and effective ancestral option. Black soap +
    shea butter as the entire routine is more than sufficient for mild-moderate teen acne while honoring
    West African tradition. The most dangerous beauty mistake is skin bleaching — mercury-containing
    products can cause permanent kidney damage, nerve damage, and paradoxically worsen hyperpigmentation.`
  },

  'south-asian': {
    communityName: 'South Asian Teen',
    skinConcerns: ['Acne common + PIH on olive/brown skin', 'PCOS more prevalent (affects skin and hair)', 'Facial hair concerns (upper lip, eyebrows)'],

    acne: {
      approach: 'Salicylic acid 2% + niacinamide combination; adapalene OTC if moderate acne',
      hormonal: 'PCOS in teen girls: irregular periods + acne + excess facial hair = seek endocrinologist; OCP may be recommended',
      haldi: 'Turmeric (haldi) face masks: anti-inflammatory; reduces redness around acne; traditional and scientifically valid'
    },

    hair: {
      type: 'Predominantly Type 2-3; straight to wavy to curly; thick and dark',
      oiling: 'Coconut or almond oil scalp massage (champi) 1x weekly; ancestral practice for healthy scalp',
      facial: 'Upper lip and eyebrow threading: South Asian teens often start threading early; professional threading is fine; home waxing burns are a risk'
    },

    cultural: {
      auntyPressure: '"Aunty remarks" about skin tone and acne are common in South Asian culture; these comments cause real harm to teen self-esteem',
      fairness: 'Fairness cream pressure (Fair & Lovely etc.) is harmful; these products contain bleaching agents; affirm diverse South Asian skin tones',
      marriage: 'Cultural focus on "bridal glow" and fair skin for marriage: reject this pressure; healthy skin at any tone is the goal'
    },

    advice: `South Asian teen skin tends to be oily, prone to acne, and prone to PIH. The ancestral tools
    are actually very good: neem (antibacterial), turmeric (anti-inflammatory), and aloe (soothing) address
    acne through natural pathways. Modern additions: salicylic acid 2% cleanser and niacinamide serum
    complete the routine. The dangerous cultural pattern to resist: fairness cream use. Sun protection
    is essential (PIH darkens without SPF). If acne is severe and accompanied by irregular periods,
    excess hair growth, or hair loss — these are PCOS signs requiring medical attention, not just
    skincare attention.`
  },

  caribbean: {
    communityName: 'Caribbean Teen',
    skinConcerns: ['Sun exposure on island environments', 'Humidity and sweat-related acne', 'Mixed heritage skin diversity'],

    acne: {
      approach: 'Sweat is a significant trigger; cleanse after beach/sports immediately; oil-free SPF is non-negotiable in Caribbean sun',
      sun: 'Sun is intense in Caribbean; SPF daily habit must start in teen years; melanin does NOT protect against UV damage — PIH, premature aging, and skin cancer risk remain real',
      coconut: 'Coconut oil on face: avoid for acne-prone Caribbean teens (comedogenic for some skin types)'
    },

    hair: {
      type: 'Diverse: Type 2-4 across Caribbean heritage; Dominican straightening tradition vs. natural movement',
      beach: 'Saltwater and chlorine are harsh on hair; wet hair is most fragile; apply coconut or argan oil before beach; rinse immediately after'
    },

    cultural: {
      diversity: 'Caribbean beauty encompasses African, Indigenous, South Asian, European, Chinese heritage — diverse skin tones and textures',
      pressure: 'Tensions between natural hair and straight hair in Dominican culture specifically; both are valid'
    },

    advice: `Caribbean teen beauty is about protecting skin from intense sun while managing humidity-driven
    oiliness. SPF is the single most impactful product — consistent daily use from teen years dramatically
    reduces lifetime skin cancer risk and PIH. Use a lightweight, non-greasy SPF 50. After any beach/pool
    session, cleanse immediately — salt, chlorine, and sweat are all acne triggers. Aloe vera fresh from
    the plant is the ancestral and scientifically valid soothing treatment for sun exposure and post-acne
    inflammation. Natural hair teens: saltwater actually enhances curl pattern temporarily, but chronic
    salt exposure without conditioning leads to breakage.`
  },

  arab: {
    communityName: 'Arab / Middle Eastern Teen',
    skinConcerns: ['Mixed fair-to-olive skin tones', 'Facial hair concerns', 'Body hair and waxing practices'],

    acne: {
      approach: 'Olive skin (Fitzpatrick III-IV) PIH risk is moderate; niacinamide + salicylic acid combo',
      rosewater: 'Rose water as toner for teen skin: gentle, anti-inflammatory, traditional and appropriate',
      blackSeed: 'Nigella sativa (black seed oil): anti-inflammatory properties; diluted application on acne spots is traditional and has some evidence'
    },

    hair: {
      type: 'Predominantly straight to wavy; very thick; often dark',
      facial: 'Eyebrow threading and upper lip waxing common from teen years; threading preferred (precise)',
      bodyHair: 'Body waxing/sugaring (halawa) begins for many Arab teen girls: cultural practice; pain tolerance varies; ingrown hair prevention with exfoliation after'
    },

    cultural: {
      modesty: 'For hijab-wearing teens: haircare needs are different — scalp health focus; monthly protective style changes; humid scalp = more scalp care needed',
      skinUnderHijab: 'Skin under hijab may be less sun-damaged but scalp sweats more; medicated scalp shampoo if needed'
    },

    advice: `Arab teen beauty often involves early hair removal practices (threading, sugaring, halawa)
    that can be perfectly safe when done correctly. For ingrown hair prevention after waxing:
    exfoliate with a gentle scrub 48 hours after waxing, not before. Rosewater is the perfect
    teen toner — gentle enough for sensitive adolescent skin, anti-inflammatory, and culturally
    authentic. For olive-to-tan skin: SPF 30+ daily; niacinamide to control sebum and minimize
    acne marks. If wearing hijab: focus skincare on hairline (where sweat accumulates) and
    dedicate time to scalp health monthly.`
  },

  latina: {
    communityName: 'Latina / Hispanic Teen',
    skinConcerns: ['Wide skin tone range from fair to deep brown', 'Quinceañera preparation', 'Cultural beauty rituals beginning in teen years'],

    acne: {
      approach: 'For darker Latina skin (Fitzpatrick III-V): PIH management is key alongside acne treatment',
      hormonal: 'Hormonal acne around period very common; cycle tracking + consistent salicylic acid routine helps',
      quinceanera: 'Pre-quinceañera skin prep: start routine 6 months early; sunscreen consistently; facials 1 month before not day before (risk of breakout)'
    },

    hair: {
      type: 'Highly diverse: Type 2a-4a across Latina heritage; often thick',
      curly: 'Curly and wavy Latina hair: CG (Curly Girl) method popularized by Lorraine Massey; protein + moisture balance',
      straightening: 'Brazilian keratin treatment common in some Latina communities; formaldehyde concerns in some products; check formulas'
    },

    cultural: {
      quinceañera: 'Quinceañera (15th birthday celebration): major beauty milestone; hair, makeup, nails all planned; wonderful tradition',
      telenovela: 'Telenovela beauty standards = predominantly light-skinned, straight-haired; these are not all Latina experiences; celebrate diversity',
      abuela: 'Grandmothers pass down beauty traditions: aloe vera from the garden, chamomile rinse for highlights, olive oil on dry hair'
    },

    advice: `Latina teen beauty spans one of the widest ranges of any cultural group — from very fair
    to very deep skin tones, from straight to tightly coiled hair. The common thread is the richness
    of intergenerational beauty tradition: abuela's aloe vera, natural home remedies, the communal
    beauty rituals around major life events like quinceañera. For curly and wavy hair: embrace the
    texture with curl-specific products rather than fighting it. For skin: identify your specific
    Fitzpatrick type and needs — fair Latina skin needs SPF as urgently as any fair skin; darker
    Latina skin needs PIH management. Chamomile tea as final hair rinse (adds warmth to brunette/
    auburn tones) is a grandmother's trick that actually works.`
  },

  'east-asian': {
    communityName: 'East Asian Teen',
    skinConcerns: ['Academic stress = cortisol = skin stress', 'Double eyelid pressure in some communities', 'Early skincare habit formation'],

    acne: {
      approach: 'East Asian teens often develop robust skincare habits earlier; niacinamide is well-studied and gentle',
      korean: 'K-beauty influence: many East Asian teens already practicing sophisticated skincare; the foundation is correct — cleanse + tone + moisturize + SPF',
      stress: 'Academic pressure = chronic cortisol = acne trigger; stress management is genuinely a skincare strategy'
    },

    hair: {
      type: 'Predominantly Type 1 (straight); high density; may be fine or coarse',
      oily: 'Type 1 straight hair = shows oil fastest; daily washing for many; scalp health focus',
      coloring: 'Hair coloring common for East Asian teens; bleaching Type 1 Asian hair requires more processing = more damage; conditioning care essential'
    },

    cultural: {
      doubleEyelid: 'Eyelid tape/glue for double eyelid: common in Korea, Japan, China; not dangerous but complex beauty standard; skin irritation from daily use possible',
      surgery: 'Blepharoplasty (double eyelid surgery): increasingly common in East Asia; complex choice for teens; not recommended under 18',
      whitening: 'Skin whitening/brightening: significant market in East Asia; glutathione injections unsafe; topical niacinamide and vitamin C are safe alternatives'
    },

    advice: `East Asian teen beauty is shaped by one of the world's most sophisticated beauty cultures —
    K-beauty, J-beauty, and C-beauty all offer well-developed skincare philosophies that are largely
    gentle, layered, and appropriate for teen skin. The K-beauty double cleanse + essence + serum
    system is genuinely excellent for teens IF simplified: gel cleanser + niacinamide serum +
    moisturizer + SPF is more than sufficient. The dangerous pattern to address: glutathione injections
    or IV for skin whitening (not safe; unregulated; can cause nerve damage). Topical vitamin C and
    niacinamide achieve brightening safely. Academic stress and skin health are directly connected —
    sleep is the most underrated teen skincare ingredient.`
  },

  'east-african': {
    communityName: 'East African Teen',
    skinConcerns: ['Deep skin tones (Fitzpatrick V-VI)', 'PIH from acne or other trauma', 'Frankincense and myrrh traditions'],

    acne: {
      approach: 'PIH management is primary; use anti-inflammatory approach; azelaic acid 10% is both acne-treating and PIH-reducing',
      frankincense: 'Frankincense essential oil (diluted): antimicrobial and anti-inflammatory; traditional and scientifically valid for acne-prone skin',
      SPF: 'Even very dark skin (Fitzpatrick V-VI) needs SPF; skin cancer less common but not absent; PIH worsens dramatically without UV protection'
    },

    hair: {
      type: 'Predominantly Type 4b-4c; Ethiopian/Eritrean hair is among the densest and most coiled textures',
      traditional: 'Ethiopian hair oiling with castor or sesame oil; intergenerational practice',
      protective: 'Braids and styles: Ethiopian tress hairstyle (tight corner braids); protective for Type 4 hair; beautiful cultural expression'
    },

    cultural: {
      frankincense: 'Frankincense is sacred in Ethiopian and Somali culture; used spiritually and in beauty; teens can connect to ancestry through beauty rituals',
      cultural: 'Henna (for Somali, Djiboutian, Eritrean teens): beautiful cultural art form; fresh henna is safe; avoid "black henna" (contains PPD, causes chemical burns)'
    },

    advice: `East African teen skin is among the deepest tones globally — and requires the most careful
    PIH management. Any acne that causes inflammation risks leaving a dark mark that can last months.
    Strategy: prevent acne (gentle routine, consistent), treat immediately (azelaic acid dual-action),
    and protect from UV (SPF daily even under melanin). Frankincense and myrrh in diluted carrier oil
    form are genuine ancestral treatments with antimicrobial properties. For hair: protective styles
    with breathable scalp access are ideal through teen school years; castor oil scalp massage
    (grandmother's treatment) is validated for hair health. Henna on hands for celebrations: always
    verify it's natural brown henna, never black henna.`
  },

  'south-african': {
    communityName: 'South African Teen',
    skinConcerns: ['Strong UV (Southern Africa high UV index)', 'Diverse skin tones across communities', 'Marula oil tradition for youth'],

    acne: {
      approach: 'High UV + oily teen skin = SPF is non-negotiable; even more critical in South Africa\'s latitude',
      marula: 'Marula oil: surprisingly non-comedogenic despite being an oil; antioxidants beneficial for teen skin',
      urban: 'Urban South African teens have access to both international K-beauty products and local botanical traditions'
    },

    hair: {
      type: 'Diverse: Xhosa, Zulu, Sotho hair predominantly Type 4; Cape Coloured heritage may be Type 3-4; Afrikaans heritage predominantly Type 1-2',
      transition: 'Many Black South African teens navigating natural hair after relaxer years in family tradition',
      rooibos: 'Rooibos tea rinse for hair: South African tradition; antioxidants; anti-inflammatory scalp; appropriate for all hair types'
    },

    cultural: {
      umemulo: 'Umemulo ceremony (Zulu coming of age): deep cultural significance; beauty preparations are communal and celebratory',
      ubuntu: 'Ubuntu beauty philosophy: "I am because we are" — communal approach to beauty; beauty rituals shared among women',
      dayZero: 'Cape Town water crisis legacy: South African teens are environmentally conscious about water in beauty — minimal water beauty is already cultural'
    },

    advice: `South African teen beauty is shaped by some of the world's most intense UV radiation —
    the UV index in Johannesburg regularly reaches 11-12 (extreme). SPF 50 from teen years
    forward is the most impactful beauty investment a South African teen can make: skin cancer
    prevention, PIH prevention, premature aging prevention. Marula oil (from the marula tree)
    is a lightweight, fast-absorbing teen facial oil that is both ancestrally appropriate and
    scientifically excellent — non-comedogenic, rich in oleic acid and antioxidants. Rooibos
    tea (cooled) as a face spray or hair rinse is the quintessentially South African beauty hack:
    aspalathin and quercetin antioxidants directly on skin and scalp.`
  },

  'black-american': {
    communityName: 'Black American Teen',
    skinConcerns: ['Highest PIH risk in teen acne', 'Natural hair journey', 'SPF habit formation in community that historically skipped SPF'],

    acne: {
      approach: 'PIH is the most significant secondary consequence of teen acne in Black skin; treat acne aggressively to prevent marks',
      blackSoap: 'African black soap: traditional and effective for acne-prone Black skin; antibacterial properties; natural exfoliation',
      niacinamide: 'Niacinamide 10% is the most important ingredient in Black teen skincare: reduces sebum, treats PIH, calms inflammation — all in one'
    },

    hair: {
      type: 'Predominantly Type 4; natural hair movement prominent among Black American teens',
      crownat: 'CROWN Act protection (C.R.E.A.T.E. a Respectful and Open World for Natural Hair): enacted in many states; natural hair discrimination in schools addressed',
      schoolPressure: 'Many Black teens face pressure to straighten hair for school or social acceptance; protective styles and natural hair are valid and protected',
      firstPress: 'First relaxer or press decisions: often made in early teen years; delaying chemical treatments reduces lifetime heat/chemical damage'
    },

    cultural: {
      PIHContext: 'PIH is under-discussed in mainstream beauty media which skews toward lighter skin; representation gap causes Black teens to think dark spots are permanent',
      beautySheroes: 'Represent: Naomi Campbell, Lupita Nyong\'o, Zendaya, Normani — diverse Black beauty visibility matters for teen self-esteem',
      SPF: 'Historical medical racism (Tuskegee) contributed to medical mistrust in Black community; SPF messaging needs community-specific framing: SPF prevents dark spots (PIH)'
    },

    advice: `Black American teen skin is powerful, resilient, and deserves specific expertise — which
    mainstream dermatology and beauty media have historically failed to provide. The most important
    facts for Black teens: (1) Your melanin does NOT protect against UV damage — PIH worsens
    dramatically in UV without SPF; use SPF 30+ daily. (2) PIH from acne is NOT permanent —
    niacinamide + azelaic acid + time will fade it. (3) Your Type 4 hair is not "difficult" —
    it thrives with proper moisture, protective styles, and the LOC method. (4) Black soap is
    ancestrally yours and scientifically valid for acne-prone Black skin. The most powerful teen
    routine: African black soap cleanse + niacinamide serum + moisturizer + SPF = complete,
    culturally grounded, scientifically sound.`
  }
};

// ============================================================
// HELPER FUNCTION
// ============================================================

export function getTeenBeautyGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_TEEN_BEAUTY_GUIDES['west-african'],
    'south-asian': ETHNIC_TEEN_BEAUTY_GUIDES['south-asian'],
    'caribbean': ETHNIC_TEEN_BEAUTY_GUIDES['caribbean'],
    'arab': ETHNIC_TEEN_BEAUTY_GUIDES['arab'],
    'latina': ETHNIC_TEEN_BEAUTY_GUIDES['latina'],
    'east-asian': ETHNIC_TEEN_BEAUTY_GUIDES['east-asian'],
    'east-african': ETHNIC_TEEN_BEAUTY_GUIDES['east-african'],
    'south-african': ETHNIC_TEEN_BEAUTY_GUIDES['south-african'],
    'black-american': ETHNIC_TEEN_BEAUTY_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

// ============================================================
// STATS
// ============================================================

export const TEEN_BEAUTY_STATS = {
  moduleId: 'teen_beauty_ethnic_guide',
  version: '1.0.0',
  communities: 9,
  keyFacts: [
    'Acne affects 85% of teens at some point; androgens increase sebum production 2-5x during puberty',
    'Black, East African, and South Asian teens have highest PIH risk from acne — prevention is better than treatment',
    'Adapalene (Differin) 0.1% gel is now OTC in the US — most evidence-based OTC acne treatment available to teens',
    'Benzoyl peroxide 2.5% is as effective as 10% with less irritation — always start lower',
    'CROWN Act protects natural hairstyles in schools in many US states — Black American teen right to wear natural hair',
    'Niacinamide 5-10% is appropriate for ALL teen skin types: reduces sebum, treats PIH, anti-inflammatory',
    'Skin bleaching creams with mercury or steroids marketed in African and Asian markets are dangerous for teen skin',
    'Cape Town Water Crisis (2018) made South African teens among the most sustainability-conscious beauty consumers globally',
    'African black soap is scientifically validated for acne-prone skin — ancestral knowledge and evidence aligned',
    'SPF is the single most impactful lifetime investment a teen can make — sun damage is cumulative from teen years'
  ],
  lastUpdated: '2026-10-29'
};
