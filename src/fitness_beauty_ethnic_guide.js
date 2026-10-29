/**
 * MIRRR — Fitness & Beauty Ethnic Guide
 * Exercise effects on skin and hair, sweat care, athletic beauty by community
 * Topics: exercise physiology, sweat, hair management, post-workout care, athlete skin
 */

// ============================================================
// EXERCISE SKIN SCIENCE
// ============================================================

export const EXERCISE_SKIN_SCIENCE = {
  overview: `Exercise is one of the most powerful natural beauty interventions available. Regular physical
  activity increases circulation to the skin, delivers oxygen and nutrients, flushes waste products,
  modulates inflammatory hormones, reduces cortisol, stimulates collagen, improves sleep quality (which
  drives repair), and has been shown to reverse some cellular aging markers. A 2014 McMaster University
  study showed exercising individuals in their 60s had skin composition closer to 25-year-olds than
  age-matched sedentary individuals. Exercise is genuinely anti-aging.`,

  circulationEffects: {
    overview: 'Aerobic exercise increases heart rate and blood flow; skin receives 3-5x normal blood flow during vigorous exercise',
    oxygenation: 'Increased skin oxygenation during exercise; oxygen is essential for cellular metabolism and collagen synthesis',
    nutrients: 'Enhanced delivery of amino acids, vitamins, minerals to skin cells',
    waste: 'Accelerated removal of metabolic waste products from skin tissue',
    glow: 'Post-exercise glow: vasodilation causes temporary redness and luminosity; visible immediately after exercise',
    longterm: 'Regular exercisers: sustained improved microcirculation even at rest; more radiant baseline skin tone'
  },

  hormoneEffects: {
    cortisol: 'Moderate exercise: reduces baseline cortisol; chronic stress cortisol reduction → less collagen breakdown',
    overtraining: 'Overtraining syndrome: chronically elevated cortisol → accelerated skin aging, hair loss, acne — the opposite of desired effect',
    hormones: 'Exercise regulates sex hormones; helps normalize testosterone/estrogen ratio; beneficial for PCOS management',
    igf1: 'Growth hormone + IGF-1 increase with exercise; these drive tissue repair and collagen synthesis',
    endorphins: 'Endorphin release reduces stress; stress is a significant accelerator of skin aging'
  },

  collagenEffects: {
    overview: 'Exercise stimulates fibroblast activity (collagen-producing cells)',
    research: '2013 University of North Carolina study showed 30+ min exercise 3x/week associated with thicker dermis and thinner stratum corneum (younger skin profile)',
    type1: 'Type I collagen (structural skin collagen) synthesis increases with regular aerobic exercise',
    wound: 'Regular exercisers heal wounds 25-35% faster than sedentary individuals; critical for post-acne/PIH recovery',
    mcmaster: 'McMaster 2014: 65-year-old exercisers had stratum corneum + dermis thickness similar to 20-40-year-olds vs sedentary same-age controls'
  },

  antiInflammatory: {
    il6: 'Exercise releases IL-6 from muscle (myokine) — paradoxically anti-inflammatory in trained individuals despite being pro-inflammatory in disease states',
    cytokins: 'Regular exercise shifts cytokine profile toward anti-inflammatory; benefits inflammatory skin conditions',
    acne: 'Regular exercise reduces inflammatory acne in many patients via cortisol/hormone regulation',
    psoriasis: 'Exercise demonstrated to reduce psoriasis severity; anti-inflammatory effect on autoimmune skin conditions',
    eczema: 'Mixed evidence on eczema + exercise; sweat can trigger, but overall anti-inflammatory effect beneficial'
  },

  sweating: {
    overview: 'Sweat is not inherently beneficial or harmful for skin — it\'s the aftermath management that matters',
    composition: 'Sweat: 99% water; salt (NaCl, electrolytes); urea; small amounts lactic acid, urocanic acid, antimicrobial peptides',
    antimicrobial: 'Sweat contains dermcidin — natural antimicrobial peptide; normal healthy skin sweat has protective function',
    ph: 'Sweat is slightly acidic (pH 4.5-6.8); maintains acid mantle of skin',
    problems: {
      sat: 'Sweat sitting on skin for extended periods: salt + bacteria → irritation, congestion, potential breakout',
      bacteria: 'Sweat + bacteria on skin surface → body odor; Corynebacterium, Staphylococcus bacteria metabolize sweat components',
      folliculitis: 'Hot environment + occlusive clothing + sweat = Malassezia folliculitis (fungal acne) or bacterial folliculitis',
      eczema: 'Individuals with eczema: sweat salt and urea can trigger pruritus and inflammation on disrupted barrier skin'
    }
  }
};

// ============================================================
// ATHLETIC HAIR MANAGEMENT
// ============================================================

export const ATHLETIC_HAIR_MANAGEMENT = {
  overview: `Hair management during exercise is one of the most significant practical beauty challenges for
  textured and curly hair. For Type 3-4 hair, conventional workout advice to "wash after every workout"
  is not sustainable — frequent washing of textured hair causes extreme dryness and breakage. Managing
  sweat without destroying the hair is the challenge.`,

  straightHair: {
    description: 'Type 1-2 (straight to wavy)',
    challenges: 'Sweat can make hair limp and oily quickly; sweat at roots most visible',
    solutions: [
      'High ponytail or bun during workout keeps hair off neck (sweat zone)',
      'Dry shampoo at roots post-workout extends wash day if hair visually manageable',
      'Rinse-only wash post-workout (no shampoo) removes sweat without stripping if light workout',
      'Wash every 1-3 days depending on activity level; daily wash acceptable for fine, oily hair'
    ]
  },

  wavyCurlyHair: {
    description: 'Type 2b-3b (waves to curls)',
    challenges: 'Sweat disrupts curl pattern; can cause frizz and loss of definition; frequent washing dries hair out',
    solutions: [
      'Pineapple or high loose ponytail during workout; keeps curls from direct sweat contact',
      'Scalp rinse post-workout: wet scalp, massage, rinse without shampooing the length',
      'Co-wash (conditioner-only wash) after heavy sweat sessions — cleans without full shampoo strip',
      'Refresh day: spray bottle with water + leave-in conditioner to redefine curls post-workout',
      'Wash 2-3x per week maximum for type 3 hair'
    ]
  },

  type4Hair: {
    description: 'Type 4a-4c (tightly coiled to kinky)',
    challenges: 'Extreme dryness from frequent washing; sweat can cause shrinkage and matting; 1-2 washes per week maximum for most',
    solutions: [
      'Protective style during exercise: braids, cornrows, twists prevent manipulation and sweat exposure',
      'Scalp-only focus: dry shampoo or scalp spray at roots between washes',
      'ACV (apple cider vinegar) rinse on scalp diluted 1:4 with water — clarifies sweat/buildup without full shampoo',
      'Sweat-friendly styles: cornrows, flat twists, two-strand twists — can survive daily workouts for 1-2 weeks',
      'Post-workout: blot scalp with cloth; don\'t rub; apply scalp oil if dry; protect with bonnet or wrap',
      'Wash 1x weekly or every 10-14 days for protective styles'
    ]
  },

  swimmerHair: {
    challenges: 'Chlorine: strips cuticle, dries hair, turns chemically lightened hair green; salt water: drying, tangling',
    pre: {
      wet: 'Wet hair with fresh water before entering pool — pre-saturated hair absorbs less chlorinated water',
      oil: 'Apply coconut or olive oil before swimming — creates barrier against chlorine penetration',
      cap: 'Swim cap (silicone > latex): reduces chlorine exposure dramatically if worn correctly'
    },
    during: 'If swimming daily: cap always; oil always',
    post: {
      rinse: 'Rinse immediately after pool exit — immediately means within minutes, not after changing',
      clarify: 'Chelating or clarifying shampoo post-swim removes chlorine/mineral buildup; follow with deep conditioner',
      deep: 'Deep condition after every swim if uncapped; once weekly if capped',
      green: 'Green tint (green from copper in pool + lightened hair): tomato juice or Malibu C Swimmer\'s shampoo'
    }
  },

  workoutHairstyles: {
    type12: ['Ponytail (high, with satin scrunchie)', 'Loose bun', 'Space buns', 'French braid', 'Half up'],
    type3: ['Pineapple (loose high ponytail)', 'Two-strand twist out bun', 'Braid out', 'Bantu knot out', 'Loose two braids'],
    type4: ['Protective braids (cornrows, box braids)', 'Loose two plaits', 'Flat twists', 'High puff', 'Wash-n-go under bonnet hat']
  }
};

// ============================================================
// POST-WORKOUT SKINCARE
// ============================================================

export const POST_WORKOUT_SKINCARE = {
  timing: {
    ideal: 'Cleanse within 30-60 minutes post-workout; sweat + bacteria on skin = breakout risk if left',
    minimum: 'At minimum: rinse with cool water if full cleanse not possible; removes surface sweat and bacteria',
    heavy: 'Heavy gym or outdoor exercise: always cleanse face and body; don\'t skip to "save" a skincare routine'
  },

  faceRoutine: {
    steps: [
      { step: 1, name: 'Cleanse', description: 'Gentle cleanser post-workout; not the same as morning/evening double cleanse — one thorough cleanse sufficient; micellar water works if no shower available' },
      { step: 2, name: 'Tone', description: 'Optional; AHA/BHA toner for acne-prone skin can address workout congestion; skip for dry/sensitive skin' },
      { step: 3, name: 'Hydrate', description: 'Post-exercise skin is flushed and warm; lighter moisturizer works; gel formula ideal for hot post-workout skin' },
      { step: 4, name: 'SPF', description: 'If heading outside after workout; reapply after sweating off earlier application' }
    ],
    acneProne: 'Post-workout breakouts: add salicylic acid 2% cleanser or BHA toner 3-4 hours post-exercise; addresses sweat-congested pores',
    darkSkin: 'Dark skin post-workout: niacinamide serum after cleanse maintains hyperpigmentation prevention routine even with extra cleanse'
  },

  bodyRoutine: {
    shower: 'Cool-to-warm shower (not hot); hot water post-exercise when skin is already vasodilated and flushed = extra stress on skin + increased dryness',
    cleanse: 'Body wash with salicylic acid or glycolic acid for acne-prone back/chest (chest acne common in exercisers from sweat + tight clothing)',
    moisture: 'Moisturise within 3 minutes of shower — post-exercise skin needs hydration; shea butter or cocoa butter for dark skin',
    darkSkin: 'Dark skin: apply body lotion while still slightly damp; seal with shea butter; 3-minute rule essential'
  },

  athleteAcne: {
    name: 'Sports-related acne (Acne mechanica)',
    causes: [
      'Friction from helmets, chinstraps, shoulder pads, tight clothing',
      'Sweat trapped against skin for extended periods',
      'Heat increasing sebum production',
      'Bacteria on shared gym equipment'
    ],
    prevention: [
      'Moisture-wicking fabrics; avoid occlusive nylon',
      'Clean gym equipment with disinfectant before use',
      'Immediate shower after workout',
      'Benzoyl peroxide wash on acne-prone areas 2-3x weekly',
      'Bacne: salicylic acid spray on back immediately post-workout before shower'
    ],
    darkSkin: 'Sports acne in dark skin creates PIH that outlasts the acne itself; prevention is critical; treat with azelaic acid at first sign'
  },

  sunProtection: {
    outdoor: 'Outdoor exercise: sport SPF essential; regular SPF sweats off within 30 minutes of exercise',
    sportSpf: 'Sport SPF: water-resistant; tested at 40 or 80 minutes of water/sweat exposure; SPF 50+ recommended',
    reapply: 'Reapply every 90 minutes during sustained outdoor exercise; every 40-60 minutes if sweating heavily',
    darkSkin: 'Dark skin still burns and still suffers UV-driven hyperpigmentation; sport SPF is mandatory for outdoor athletes of all ethnicities'
  }
};

// ============================================================
// 9 COMMUNITY FITNESS BEAUTY GUIDES
// ============================================================

export const ETHNIC_FITNESS_BEAUTY_GUIDES = {
  'west-african': {
    communityName: 'West African',
    primaryConcerns: ['Type 4 hair management during exercise', 'PIH from workout-induced acne', 'Sweat care for dark skin'],

    fitnessTradition: {
      overview: 'West African fitness traditions: highlife dance, Afrobeats dance workouts, traditional wrestling (laamb), football',
      dance: 'Dance-based fitness popular; sweat-intensive; appropriate hair protection critical',
      outdoor: 'Football and outdoor sports: high UV exposure; sport SPF important'
    },

    hairFitness: {
      style: 'Cornrows, box braids, or Ghana weaving for workout period — can survive 1-2 weeks of daily workouts',
      wet: 'Post-workout natural hair: scalp spritz with water + leave-in; do not rub dry; air dry under satin cap',
      wash: 'Wash 1x weekly; co-wash mid-week if heavy sweat; deep condition always after shampoo',
      protective: 'Protective styles reduce manipulation injury and sweat exposure simultaneously — ideal for active West African women'
    },

    skinFitness: {
      postWorkout: 'Cleanse face within 30 min post-workout; niacinamide serum prevents exercise-triggered PIH',
      body: 'Post-workout body: shea butter on still-damp skin; prevents the dullness/ashy appearance that sweat + friction can worsen',
      spf: 'SPF 30+ for outdoor football/running; Fitzpatrick V-VI still accumulates UV damage over time'
    },

    advice: `West African fitness beauty comes down to two priorities: protect the hair (cornrows or box braids
    during workout periods are the best solution — functional, beautiful, and workout-proof) and protect
    the skin post-workout (prevent the workout → sweat → congestion → acne → PIH cycle with prompt
    cleansing and niacinamide). Dance workouts (Afrobeats, Zumba) are outstanding for skin health because
    cardio + joy + community reduces cortisol dramatically more than isolated gym exercise.`
  },

  'south-asian': {
    communityName: 'South Asian',
    primaryConcerns: ['Sweat-triggered melasma activation', 'PCOS exercise benefits', 'Hair oil and exercise timing'],

    fitnessTradition: {
      overview: 'South Asian fitness: yoga, Bollywood dance, cricket, kabaddi, badminton',
      yoga: 'Yoga: low sweat; beneficial for cortisol reduction; skin health benefits of stress reduction',
      dance: 'Bollywood dance workout: cardio with cultural connection; high energy; manage sweat'
    },

    hairFitness: {
      oilTiming: 'If doing overnight oil treatment: wash morning of exercise day; don\'t exercise with heavy oil in hair (worsens scalp sweat/clogging)',
      braids: 'French braid or two plaits for workout; loose braid protects long South Asian hair from friction',
      swim: 'Pre-swim: coconut oil on hair; post-swim: chelating shampoo to remove chlorine; condition generously'
    },

    skinFitness: {
      melasma: 'Sweat on melasma-prone skin: UV + heat + sweat can activate melanocytes; sport SPF 50 mandatory outdoors; workout in cool/shade when possible',
      postWorkout: 'Post-workout cleanse immediately; vitamin C serum after for antioxidant protection; tinted SPF if going outside',
      pcos: 'Exercise for PCOS: moderate intensity exercise (not overtraining) reduces androgens and insulin resistance; 150 min/week cardiovascular activity recommended'
    },

    advice: `South Asian fitness beauty has a unique consideration: heat and UV interaction with melasma-prone
    skin. Even indoor hot yoga can activate melanocytes through heat alone. Sport SPF + indoor/shade
    exercise preference when managing active melasma. But don\'t avoid exercise — the cortisol reduction
    and insulin sensitization from regular moderate exercise are among the most powerful PCOS management
    tools available. Yoga is particularly well-suited: low UV, low sweat, high cortisol reduction.`
  },

  caribbean: {
    communityName: 'Caribbean',
    primaryConcerns: ['High UV outdoor sport SPF', 'Sweat management in humidity', 'Post-workout skin brightness'],

    fitnessTradition: {
      overview: 'Caribbean fitness: beach sports, swimming, carnival dancing (Soca, dancehall), track athletics, cricket',
      beach: 'Beach/water sports: high UV + salt water + sand = intense conditions for skin and hair',
      dance: 'Carnival and soca dance: intense cardio; massive sweat events; hair protection essential'
    },

    hairFitness: {
      beach: 'Before beach: saturate hair with fresh water + coconut oil; after: fresh water rinse immediately on leaving water',
      workout: 'Pineapple bun for curly/coily hair; satin-lined baseball cap for gym sessions',
      humid: 'High humidity: embrace curl — humidity helps Type 3-4 hair; anti-frizz serum in humid workout environments'
    },

    skinFitness: {
      spf: 'Caribbean UV index: sport SPF 50 mandatory for all outdoor activities; reapply every 60 min',
      postWorkout: 'Post-beach: rinse sand, rinse salt; cold shower preferred; aloe vera gel for sun-exposed skin',
      glow: 'Caribbean fitness glow: active lifestyle + tropical diet → genuinely luminous dark skin; maintain with vitamin C serum'
    },

    advice: `Caribbean fitness beauty is at its best in the ocean — swimming is incredible for circulation,
    skin health, and lymphatic drainage. The challenge is the UV: sport SPF 50 is non-negotiable, not
    optional. The good news: Fitzpatrick IV-VI skin that is well-moisturized and UV-protected develops
    a deep, rich, even tone from outdoor activity that is genuinely beautiful. Managing the UV is the
    difference between a gorgeous outdoor athlete glow and hyperpigmentation accumulation.`
  },

  arab: {
    communityName: 'Arab / Middle Eastern',
    primaryConcerns: ['Covered clothing and sweat', 'Post-workout skin under makeup', 'Hair under hijab during workout'],

    fitnessTradition: {
      overview: 'Arab fitness: increasing female participation; gym culture growing; home workouts; equestrian sports',
      hijab: 'Hijab-wearing athletes: specific considerations for hair under covering during exercise',
      traditional: 'Traditional Arab movement: dabke dance, sword dance, horse riding'
    },

    hairFitness: {
      hijab: 'Under hijab during exercise: moisture wicks under covering; breathable hijab fabrics essential; cotton hijab absorbs sweat; performance sport hijab fabrics are polyester-blend (moisture-wicking)',
      braid: 'Braid or bun under hijab during workout; reduces friction and sweat pooling on scalp',
      postWorkout: 'Post-workout hair: remove hijab; allow scalp to air and cool; apply light scalp oil if drying'
    },

    skinFitness: {
      covered: 'Covered-skin areas (arms, legs) are protected from UV but sweat + fabric = folliculitis risk; moisture-wicking fabrics essential',
      face: 'Face is often the only uncovered area; sport SPF 50 on face for outdoor sport is critical',
      postWorkout: 'Remove makeup before intense workouts; makeup + sweat = congestion + breakouts; exercise with SPF only if going outdoors'
    },

    advice: `Arab women in fitness have pioneered the sport hijab market — Nike, Adidas, Under Armour all
    now make performance hijabs. The real concern is scalp and hair health under heat-trapping covering
    during exercise. Solutions: breathable performance fabric hijabs; braid or bun underneath; immediate
    removal and cooling after workout; light scalp oil (argan) after drying. For face: always remove
    heavy makeup before intense exercise; the face being the primary exposed area means it gets the
    maximum sweat + UV combination — sport SPF + post-workout cleanse is non-negotiable.`
  },

  latina: {
    communityName: 'Latina / Hispanic',
    primaryConcerns: ['Dance fitness sweat management', 'Outdoor UV sport SPF', 'Post-workout hair maintenance'],

    fitnessTradition: {
      overview: 'Latin fitness culture: Zumba, salsa dance, bachata, outdoor sports, yoga, athletics',
      zumba: 'Zumba and Latin dance: cardio-intensive; high sweat; social; incredibly popular globally',
      outdoor: 'Soccer, volleyball, running in high UV environments'
    },

    hairFitness: {
      dance: 'Dance workout hair: half-up half-down or high ponytail; let rhythm express; protect length with satin scrunchie',
      type3: 'Type 3 hair: pineapple during workout; refresh curls post-workout with water spray + leave-in + diffuse or air dry',
      sweat: 'Scalp sweat after dance: do not rub dry; pat gently; apply light oil to scalp; style next day'
    },

    skinFitness: {
      dance: 'Dance workout post-care: cleanse immediately (dance studios have varying hygiene); micellar water if no shower available',
      outdoor: 'Sport SPF 50 for outdoor Latin fitness; reapply during extended activity',
      brightening: 'Vitamin C serum post-workout cleanser for athletes with active hyperpigmentation concern'
    },

    advice: `Latina fitness beauty centers on dance — and Zumba/Latin dance workouts are among the most
    effective cardiovascular activities for skin health because they combine intense circulation benefits
    with profound joy and cortisol reduction. The post-dance cleanse is important: dance studios can
    harbor bacteria, and sweat sitting in hair and on skin while socializing post-class leads to breakouts.
    A quick cleanse and hair refresh maintains the post-dance glow for hours.`
  },

  'east-asian': {
    communityName: 'East Asian',
    primaryConcerns: ['UV-triggered pigmentation in outdoor sports', 'Maintaining multi-step skincare routine', 'Scalp care'],

    fitnessTradition: {
      overview: 'East Asian fitness: hiking, cycling, martial arts (taekwondo, judo, wushu), yoga, gym culture',
      uvCulture: 'Korean and Japanese UV protection culture extends to extreme outdoor sports protection: full sun sleeves, UV gloves, face masks for outdoor exercise',
      kBeauty: 'Korean workout beauty culture: BB cream SPF30 that withstands exercise; post-workout 10-step continuation'
    },

    hairFitness: {
      straight: 'Straight fine hair: simple ponytail or bun for workouts; manage scalp oil with dry shampoo post-workout',
      sweat: 'Fine hair scalp sweats quickly; dry shampoo at roots post-workout before full wash',
      scalp: 'Korean scalp toner post-workout: addresses scalp health while hair is clean from sweat'
    },

    skinFitness: {
      uvExtreme: 'UV protection during outdoor Korean/Japanese fitness: tinted SPF50++ full face coverage; UV-protective clothing covers arms',
      postWorkout: 'Post-workout Korean routine: cleansing + toner + essence + serum + cream; the routine continues',
      sheet: 'Sheet mask post-workout: intense hydration after sweating; Korean athletes use sheet masks post-exercise'
    },

    advice: `East Asian fitness beauty takes sun protection to the extreme — and for good reason. East Asian
    skin\'s UV sensitivity and propensity for post-inflammatory hyperpigmentation makes outdoor sport without
    protection risky for even tone. Korean and Japanese UV protective sportswear culture (arm sleeves,
    gloves, face masks) has real science behind it. Post-workout sheet masking is a genuinely effective
    recovery tool: intense hydration after sweating + the relaxation effect compounds the cortisol-reduction
    benefit of exercise itself.`
  },

  'east-african': {
    communityName: 'East African',
    primaryConcerns: ['Elite running heritage', 'Hot climate exercise skin', 'Type 4 hair management for runners'],

    fitnessTradition: {
      overview: 'East African fitness: world-class long-distance running heritage (Ethiopia, Kenya), football, traditional sports',
      running: 'East African running excellence: Ethiopia and Kenya dominate global distance running; unique physiological and cultural factors',
      traditional: 'Traditional Somali, Ethiopian, Eritrean movement: traditional dance, agricultural work movement'
    },

    hairFitness: {
      running: 'Running with Type 4 hair: cornrows or box braids; flat to head reduces wind resistance and sweat accumulation',
      sweat: 'Heavy sweat in tight coils: ACV scalp rinse mid-week; protective style continues; keep scalp clean without full wash',
      elite: 'Elite East African runners: often shave heads or keep very short natural; practical for training load'
    },

    skinFitness: {
      running: 'Long-distance running: chafing prevention critical; anti-chafe sticks on inner thighs; nipple protection for men',
      spf: 'Outdoor running SPF: Fitzpatrick V-VI still accumulates UV damage; sport SPF on face and exposed skin',
      hydration: 'Running dehydration: skin shows it; drink water before, during, after; electrolytes for runs over 60 min'
    },

    advice: `East African athletic excellence and skin beauty coexist beautifully — elite runners have
    extraordinarily healthy cardiovascular skin (circulation benefit of miles of running is immense).
    The practical challenge is Type 4 hair management for runners: cornrows or box braids are the
    solution that professional East African female runners use. For skin: hydration is critical —
    running in heat dehydrates skin; post-run oil application (frankincense, marula) while still damp
    is the simple solution to maintaining that east African skin glow through intense training.`
  },

  'south-african': {
    communityName: 'South African',
    primaryConcerns: ['Extreme UV sport exposure', 'Diverse hair types for sport', 'Post-Highveld altitude skincare'],

    fitnessTradition: {
      overview: 'South African fitness: rugby, cricket, surfing, mountain hiking, trail running, football',
      surf: 'Surfing: extreme UV + salt water; one of the most skin-challenging sports',
      highaltitude: 'Johannesburg at 1,753m altitude; UV index significantly higher at altitude than at sea level'
    },

    hairFitness: {
      surf: 'Pre-surf: coconut oil or intensive conditioner; post-surf: rinse immediately with fresh water; chelating shampoo',
      type4: 'Black South African surfers/runners: cornrows or flat twists; protective and practical',
      diverse: 'South African diverse hair: tailor to texture; straight → ponytail; coiled → protective style'
    },

    skinFitness: {
      altitude: 'Johannesburg altitude: UV radiation intensity 15-30% higher than sea level; SPF 50 becomes even more critical',
      surf: 'Surfing UV: water reflective; surfers receive 2x UV of adjacent beach goers; reef-safe SPF 50 every 60 minutes',
      body: 'Post-outdoor sport body: marula oil on exposed areas; rooibos-infused lotion for anti-inflammatory repair'
    },

    advice: `South African outdoor fitness is some of the most beautiful in the world — trails through
    Drakensberg, surfing at Jeffreys Bay, rugby pitches under open skies. It also means extreme UV exposure.
    The calculation is stark: every outdoor sport session without SPF 50 accelerates hyperpigmentation
    and photoaging. The sport SPF habit is the most important beauty habit for active South Africans.
    After that: marula oil post-sport for skin repair, and South Africa\'s extraordinary trail and outdoor
    culture delivers all the circulation and cortisol-reduction benefits that make skin genuinely healthier.`
  },

  'black-american': {
    communityName: 'Black American',
    primaryConcerns: ['Type 4 natural hair in exercise', 'Post-workout acne PIH', 'Athletic beauty culture'],

    fitnessTradition: {
      overview: 'Black American fitness culture: gym, basketball, track, dance, weight training, yoga rising',
      weightlifting: 'Black American women leading natural and powerlifting culture; body-positive fitness revolution',
      dance: 'Step, hip-hop dance, West African-influenced aerobics popular in Black fitness spaces'
    },

    hairFitness: {
      primary: 'Natural hair management during exercise is one of the most discussed topics in Black beauty culture',
      solutions: [
        'Cornrows: install for workout period (1-2 weeks); daily workout without washing',
        'High puff: simple, quick, keeps hair out of face',
        'Pineapple: for wash-n-go styles; preserves curl pattern',
        'Braid-out bun: stretches shrinkage; survives multiple workout days',
        'Satin-lined hat or headband: moisture-retaining and stylish'
      ],
      relaxed: 'Relaxed hair: avoid getting soaked in sweat (damages chemical treatment); dry shampoo + root lift',
      swim: 'Swimming with natural Black hair: major topic; swim cap mandatory; pre-oil hair; chelating shampoo after; deep condition always'
    },

    skinFitness: {
      gym: 'Gym equipment bacteria: disinfect equipment before use; don\'t touch face during workout; cleanse immediately after',
      postWorkout: 'Post-gym cleanse: gentle cleanser; niacinamide serum for PIH prevention; don\'t skip even late at night',
      body: 'Body post-workout: shower within 30 min; shea butter or cocoa butter on damp skin; prevents dry skin and maintains even tone'
    },

    advice: `Black American fitness culture and beauty culture are deeply intertwined — the natural hair +
    exercise conversation has produced enormous community knowledge. The consensus: protective styles
    (cornrows, braids) during training blocks are the most practical solution for maintaining hair
    health through consistent workouts. For skin: gym bacteria + sweat is the trigger for bacne and
    facial breakouts in many Black athletes; prompt cleansing and niacinamide use prevents the
    workout → acne → PIH cycle. The broader message: fitness is beauty for Black skin — the circulation
    benefit is more visible on melanin-rich skin that catches light beautifully post-workout.`
  }
};

// ============================================================
// HELPER FUNCTION
// ============================================================

export function getFitnessBeautyGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_FITNESS_BEAUTY_GUIDES['west-african'],
    'south-asian': ETHNIC_FITNESS_BEAUTY_GUIDES['south-asian'],
    'caribbean': ETHNIC_FITNESS_BEAUTY_GUIDES['caribbean'],
    'arab': ETHNIC_FITNESS_BEAUTY_GUIDES['arab'],
    'latina': ETHNIC_FITNESS_BEAUTY_GUIDES['latina'],
    'east-asian': ETHNIC_FITNESS_BEAUTY_GUIDES['east-asian'],
    'east-african': ETHNIC_FITNESS_BEAUTY_GUIDES['east-african'],
    'south-african': ETHNIC_FITNESS_BEAUTY_GUIDES['south-african'],
    'black-american': ETHNIC_FITNESS_BEAUTY_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

// ============================================================
// STATS
// ============================================================

export const FITNESS_BEAUTY_STATS = {
  moduleId: 'fitness_beauty_ethnic_guide',
  version: '1.0.0',
  communities: 9,
  keyFacts: [
    'McMaster 2014 study: exercising 65-year-olds had skin composition similar to 20-40-year-olds vs sedentary age-matched controls',
    'Regular exercisers heal wounds 25-35% faster — critical for PIH recovery in dark skin',
    'Post-workout acne (acne mechanica): friction + sweat + bacteria; preventable with moisture-wicking fabrics + immediate cleanse',
    'Type 4 hair and exercise: cornrows or box braids for workout periods eliminate the daily wash requirement',
    'Sport SPF must be reapplied every 60-90 minutes during sustained outdoor exercise',
    'Water-resistant sport SPF is tested at 40 or 80 minutes of water/sweat exposure — check the label',
    'Altitude increases UV intensity 15-30% per 1000m elevation — South African Highveld athletes need higher SPF',
    'Swimming with natural Black hair: pre-coat with oil, use silicone swim cap, chelating shampoo after every swim',
    'Exercise reduces cortisol chronically — lower cortisol means less collagen breakdown and less stress-triggered acne',
    'Overtraining syndrome causes chronically elevated cortisol — too much exercise reverses the skin benefits'
  ],
  lastUpdated: '2026-10-29'
};
