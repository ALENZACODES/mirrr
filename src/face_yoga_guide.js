/**
 * MIRRR — Face Yoga & Facial Exercise Guide
 * Facial muscle anatomy, evidence-based techniques, anti-aging science,
 * multicultural considerations and traditional practices.
 */

export const FACIAL_MUSCLE_ANATOMY = {
  title: 'Facial Muscle Anatomy for Face Yoga',
  overview: 'The human face has approximately 43 muscles, many of which are unique in that they attach directly to skin rather than bone-to-bone like most body muscles. This means facial muscles move the skin itself, making facial expressions possible — and also creating expression lines over time.',
  keyMuscles: {
    forehead: {
      frontalis: { function: 'Raises the eyebrows; creates horizontal forehead lines; the only muscle that raises the entire brow', yoga_relevance: 'Repeatedly raising brows deepens horizontal lines; forehead-firming exercises work on strengthening without excessive contraction' }
    },
    aroundEyes: {
      orbicularis_oculi: { function: 'Circular muscle around the eye socket; closes the eye; creates crow\'s feet at corners; the pretarsal portion controls blinking', yoga_relevance: 'Eye-opening exercises and gentle squinting resistance work on this muscle' },
      corrugator_supercilii: { function: 'Pulls brows together and down; creates the "11 lines" (vertical glabellar lines between brows)', yoga_relevance: 'Tension in this muscle from stress, screen use; exercise to consciously relax this muscle; Botox targets this muscle specifically' }
    },
    midFace: {
      zygomaticus_major: { function: 'Pulls mouth corners upward and backward to create a smile; the main smiling muscle', yoga_relevance: 'Cheek-lifting exercises; strengthening this muscle may lift the cheek area' },
      zygomaticus_minor: { function: 'Elevates upper lip; contributes to smile and nasolabial fold formation', yoga_relevance: 'Nasolabial fold exercises' },
      levator_labii: { function: 'Lifts upper lip; contributes to nasolabial fold; significant in ethnic variation', yoga_relevance: 'Upper lip exercises' },
      buccinator: { function: 'Muscle of the cheek wall; involved in chewing and sucking; its weakening with age contributes to jowl formation', yoga_relevance: 'Cheek resistance exercises; puffing cheeks; sucking in cheeks' }
    },
    lowFace: {
      orbicularis_oris: { function: 'Circular muscle around the mouth; closes lips; creates lip movements; produces vertical perioral lines ("smoker\'s lines") with repeated contraction', yoga_relevance: 'Lip-pressing exercises; lip-stretching; but be cautious — the lip area is very line-prone' },
      mentalis: { function: 'Controls chin movement; creates chin dimpling; chin raising muscle', yoga_relevance: 'Chin lifts; counteracting double chin appearance' },
      platysma: { function: 'Thin sheet muscle of the neck extending to the lower face; responsible for necklines; weakens with age; creates turkey neck', yoga_relevance: 'Neck exercises are some of the most effective in facial yoga — the platysma responds well' }
    }
  },
  scienceBehindFaceYoga: {
    study2018: 'Northwestern University study (2018) — the first rigorous controlled trial of face yoga; 27 participants aged 40-65; practiced 30-minute face yoga sessions 30 minutes/day for 8 weeks then 3x/week for 12 weeks; result: estimated age decreased by approximately 3 years from baseline to 20-week assessment; upper cheek fullness and lower cheek fullness scores increased significantly',
    mechanism: 'Two proposed mechanisms: (1) hypertrophy — facial muscles, like body muscles, can increase in volume with exercise; increasing muscle volume may lift and fill hollow or sunken areas; (2) increased circulation — massage components of face yoga increase blood flow to skin, potentially improving skin quality and glow',
    limitations: ['The 2018 Northwestern study was small (27 participants) and uncontrolled', 'Results were self-reported appearance ratings and dermatologist age estimates — no objective skin measurements', 'Some exercises may worsen rather than prevent wrinkles if they involve repeated strong contractions in already-lined areas', 'Face yoga does not affect bone density loss (which is a significant driver of facial ageing), skin collagen loss, or fat pad redistribution'],
    verdict: 'Face yoga is safe, free, and has some evidence of benefit particularly for lifting the cheek area. It is not a substitute for clinical anti-aging treatments but is a legitimate adjunct. Avoid exercises that involve deep repeated creasing in already-wrinkled areas.'
  }
};

export const CORE_FACE_YOGA_EXERCISES = {
  title: 'Core Face Yoga Exercises',
  cheek_lifts: {
    targetMuscle: 'Zygomaticus major, zygomaticus minor, levator labii',
    targetArea: 'Upper and lower cheeks; nasolabial fold area',
    instruction: 'Smile as wide as possible while pressing your fingertips lightly into the corners of your mouth; hold the smile while using your fingers to resist the muscle contractions; hold 10 seconds; release; repeat 10 times',
    benefit: 'Strengthens the cheek muscles that naturally descend with age; may lift the mid-face area; one of the most well-studied face yoga exercises',
    frequency: 'Daily; 2-3 sets'
  },
  fish_face: {
    targetMuscle: 'Buccinator, orbicularis oris',
    targetArea: 'Hollow cheeks; lower face definition',
    instruction: 'Suck your cheeks inward while slightly smiling to create a "fish face" shape; hold for 10 seconds; release; repeat 15 times',
    benefit: 'Tones the cheek muscles and buccinator; works the hollow of the cheek',
    frequency: 'Daily'
  },
  lion_pose: {
    origin: 'From yoga — Simhasana (lion pose); face yoga adapted the face portion',
    targetMuscle: 'Nearly all facial muscles simultaneously',
    targetArea: 'Tension release; circulation',
    instruction: 'Inhale deeply; exhale while opening mouth wide, sticking out tongue fully downward, opening eyes wide, spreading all facial muscles outward as much as possible; hold the exhale position for 3-5 seconds; release; repeat 3-5 times',
    benefit: 'Tension release; stretches all facial muscles; increases circulation; feels extraordinary after prolonged screen time'
  },
  forehead_smoother: {
    targetMuscle: 'Frontalis',
    targetArea: 'Horizontal forehead lines',
    instruction: 'Place both hands flat on forehead fingers pointing inward; use the hands to gently hold the forehead skin flat while trying to raise the brows underneath; this creates resistance; hold 10 seconds; repeat 10 times',
    benefit: 'Strengthens frontalis while preventing the upward movement that deepens forehead lines',
    caution: 'Do not use this if it creates more tension or visible creasing'
  },
  V_exercise: {
    targetMuscle: 'Orbicularis oculi (under-eye), levator palpebrae',
    targetArea: 'Under-eye area, crow\'s feet prevention',
    instruction: 'Make V shapes with your index and middle fingers; place index fingers at the outer corners of your eyes and middle fingers at the inner corners; apply gentle upward pressure; look upward; squint the lower eyelids upward ten times; close eyes and hold for 10 seconds; release; repeat 6 times',
    benefit: 'Tones the orbital muscles; may reduce the appearance of eye bags by strengthening the support muscles'
  },
  jawline_exercise: {
    targetMuscle: 'Masseter, platysma',
    targetArea: 'Jawline definition, jowl prevention',
    instruction: 'Tilt head slightly back; move lower jaw forward to feel a stretch under the chin and along the jawline; hold 10 seconds; release; repeat 10 times; then tilt head back further and make chewing movements (20 repetitions)',
    benefit: 'Tones the lower face muscles; the platysma stretch may improve neck and jawline definition'
  },
  neck_sculpt: {
    targetMuscle: 'Platysma, sternocleidomastoid',
    targetArea: 'Turkey neck, necklines, jaw definition',
    instruction: 'Sit upright; place one hand flat on the upper chest (collarbone area); pull the skin downward gently with this hand; tilt your head back slowly while the hand provides resistance; hold 10 seconds; return to neutral; repeat 10 times each side',
    benefit: 'The platysma is a muscle that is almost never deliberately exercised; strengthening it can dramatically improve the appearance of the neck and lower face; probably the most effective area for face yoga results',
    note: 'Some practitioners report this being the single most noticeable face yoga exercise'
  },
  gua_sha_integration: {
    description: 'Gua sha (a Chinese massage tool technique) is often practised alongside face yoga as it shares the goals of stimulating circulation and lymphatic drainage',
    howTo: 'After face yoga: apply facial oil; use a gua sha stone with gentle upward strokes; always move upward and outward (toward lymph nodes at jawline and behind ears); 3-5 strokes per section; very light pressure',
    benefit: 'Reduces facial puffiness (lymphatic drainage); increases circulation (temporary glow); tension release in jaw (good for bruxism/TMJ); part of traditional Chinese beauty medicine'
  }
};

export const FACE_YOGA_PROGRAMS = {
  beginner: {
    duration: '10 minutes/day',
    routine: [
      { exercise: 'Lion Pose', reps: '3-5 times', purpose: 'Warm up; tension release' },
      { exercise: 'Forehead Smoother', reps: '10 reps, hold 10s each', purpose: 'Forehead and brow area' },
      { exercise: 'V Exercise', reps: '6 reps, hold 10s each', purpose: 'Eye area' },
      { exercise: 'Cheek Lifts', reps: '10 reps', purpose: 'Mid-face' },
      { exercise: 'Fish Face', reps: '15 reps', purpose: 'Lower face' },
      { exercise: 'Neck Sculpt', reps: '10 reps each side', purpose: 'Neck and jaw' }
    ]
  },
  advanced: {
    duration: '20-30 minutes/day',
    additions: ['Brow lifting resistance exercises', 'Eye orbit massage', 'TMJ release', 'Skull base pressure point release', 'Full gua sha sequence post-exercises']
  }
};

export const ETHNIC_FACE_YOGA_CONSIDERATIONS = {
  'west-african': {
    tradition: 'Facial massage with shea butter or oil is a traditional West African beauty practice; massaging the face with warm shea butter before the day was practised by many West African women; the concept of intentional facial muscle work has cultural precedents',
    skinConsideration: 'For Fitzpatrick V-VI: exercises that involve repeated strong creasing in areas already prone to hyperpigmentation (nasolabial fold area, perioral area) should be done gently; the goal is to tone, not to crease',
    recommendation: 'Neck sculpting and cheek lifting are particularly flattering in combination with existing strong West African facial bone structure; gua sha with marula or shea oil is culturally resonant'
  },
  'south-asian': {
    tradition: 'Face yoga aligns perfectly with Ayurvedic traditions of Abhyanga (self-massage with warm oil); Mukhabyanga (facial massage in Ayurveda) is a well-documented Ayurvedic treatment; Ayurveda traditionally recommends massaging the face with sesame or coconut oil in upward strokes before bathing — this is essentially ancient face yoga',
    practices: 'Kansa wand massage (a copper and bronze alloy tool) is an Ayurvedic facial tool used to draw out heat and tone the face; ancient equivalent of gua sha; becoming globally popular',
    skinConsideration: 'South Asian skin (Fitzpatrick III-V) heals well; face yoga appropriate across the full range; post-massage redness is brief and resolves quickly',
    recommendation: 'Integrating Mukhabyanga oil massage with face yoga exercises is an authentic South Asian approach; sesame oil (til tel) or coconut oil are traditional massage oils for the face'
  },
  caribbean: {
    tradition: 'Coconut oil facial massage; aloe vera application and massage; Caribbean women have long used facial massage with available oils as part of beauty routine',
    recommendation: 'JBCO (Jamaican Black Castor Oil) is thick and rich but can be diluted with lighter oil for facial massage; aloe vera as a lubricant for face yoga exercises has a cooling effect ideal in tropical climates'
  },
  arab: {
    tradition: 'Hamam (hammam steam bath) tradition includes facial massage by the attendant; the art of facial massage is embedded in Middle Eastern and North African spa culture; rosewater and orange blossom water are traditional post-massage applications',
    arganMassage: 'Argan oil is the gold standard facial massage oil across North Africa and the Arab world; its oleic acid content and vitamin E profile make it ideal for facial massage during face yoga',
    recommendation: 'Argan oil massage during face yoga exercises; rosewater mist after; Moroccan hammam ritual is an ancient cultural parallel to the modern face yoga + gua sha approach'
  },
  latina: {
    tradition: 'Cuarentena traditions include facial massage; abuela wisdom often includes facial massage with available oils; in Mexican tradition, aloe vera (sábila) is applied to the face and massaged in; temazcal (steam bath, Aztec origin) includes facial steaming and massage',
    recommendation: 'Rose hip oil (aceite de rosa mosqueta — Chilean origin; widely used throughout Latin America) is excellent for facial massage during face yoga; rich in Vitamin A and C; skin brightening properties',
    note: 'Chilean rosehip oil (Rosa rubiginosa) was one of the first widely known plant-based facial oils internationally; it became globally popular starting from South American organic beauty movement'
  },
  'east-asian': {
    tradition: 'Facial massage has the longest documented history in East Asia; Japanese kobido (literally "ancient way of beauty") is a 500-year-old Japanese facial massage technique predating modern face yoga by centuries; Chinese gua sha (刮痧) is an ancient technique adapted for modern use; Anma (Japanese massage) includes facial components',
    kobido: 'Kobido massage involves specific percussion (patting) techniques, pressure point work, and lymphatic drainage strokes; once reserved for Japanese royalty; now taught globally; this is a more advanced technique than basic face yoga but shares the same muscle-stimulation philosophy',
    guaSha: 'Modern face gua sha was popularised from Chinese traditional practice; involves a smooth stone or crystal (jade, rose quartz, bian stone) used to scrape the skin in specific directional strokes; increases microcirculation; lymphatic drainage; tension release in masseter muscle (beneficial for those who clench or grind)',
    recommendation: 'East Asian women statistically have some of the most age-resistant facial skin in global studies — attributable to genetic factors, diet (green tea, fermented foods), and cultural emphasis on skincare; face yoga is a culturally resonant addition to this existing sophisticated approach'
  },
  'east-african': {
    tradition: 'Ethiopian and East African women have traditionally used butter (clarified or fresh) for facial massage in some communities; the practice of massaging oils into the face before bathing or as a daily ritual has roots in East African beauty traditions',
    recommendation: 'Moringa oil (produced in Ethiopia and Kenya) is a culturally authentic and scientifically impressive facial massage oil — rich in oleic acid, zinc, and Vitamin A; excellent for face yoga massage medium'
  },
  'south-african': {
    tradition: 'Marula oil (from the marula tree, Sclerocarya birrea, native to Southern Africa) used by Zulu and Swazi women for skin conditioning for centuries; similar to Argan oil in cultural significance; Rooibos has become part of the South African self-care movement',
    recommendation: 'Marula oil as the facial massage oil for face yoga is culturally significant and beautifully formulated for the purpose; the Zulu facial oil tradition and modern face yoga merge naturally'
  },
  'black-american': {
    tradition: 'Black American women have long practised face massage; a cultural beauty tradition includes facial steaming (over a bowl of hot water with herbs), followed by masking, followed by massage; the modern face yoga movement has strong Black representation through content creators like Danielle Collins, but also through TikTok and YouTube face yoga creators of colour who have made the practice more culturally inclusive',
    recommendation: 'Face yoga is being adopted strongly in the Black American beauty community, particularly alongside gua sha, jade roller, and facial oil trends; the emphasis on non-invasive approaches to healthy ageing resonates deeply in this community; products in the Fenty Skin and Black-owned skincare ranges formulated with face yoga in mind'
  }
};

export function getFacialMuscleAnatomy() {
  return FACIAL_MUSCLE_ANATOMY;
}

export function getFaceYogaExercise(exercise) {
  if (!exercise) return CORE_FACE_YOGA_EXERCISES;
  const map = {
    cheek: CORE_FACE_YOGA_EXERCISES.cheek_lifts,
    fish: CORE_FACE_YOGA_EXERCISES.fish_face,
    lion: CORE_FACE_YOGA_EXERCISES.lion_pose,
    forehead: CORE_FACE_YOGA_EXERCISES.forehead_smoother,
    eye: CORE_FACE_YOGA_EXERCISES.V_exercise,
    jaw: CORE_FACE_YOGA_EXERCISES.jawline_exercise,
    jawline: CORE_FACE_YOGA_EXERCISES.jawline_exercise,
    neck: CORE_FACE_YOGA_EXERCISES.neck_sculpt,
    gua_sha: CORE_FACE_YOGA_EXERCISES.gua_sha_integration
  };
  return map[exercise.toLowerCase()] || CORE_FACE_YOGA_EXERCISES;
}

export function getFaceYogaProgram(level) {
  if (!level) return FACE_YOGA_PROGRAMS;
  return FACE_YOGA_PROGRAMS[level.toLowerCase()] || FACE_YOGA_PROGRAMS.beginner;
}

export function getEthnicFaceYoga(communityId) {
  const directMap = {
    'west-african': ETHNIC_FACE_YOGA_CONSIDERATIONS['west-african'],
    'south-asian': ETHNIC_FACE_YOGA_CONSIDERATIONS['south-asian'],
    caribbean: ETHNIC_FACE_YOGA_CONSIDERATIONS.caribbean,
    arab: ETHNIC_FACE_YOGA_CONSIDERATIONS.arab,
    latina: ETHNIC_FACE_YOGA_CONSIDERATIONS.latina,
    'east-asian': ETHNIC_FACE_YOGA_CONSIDERATIONS['east-asian'],
    'east-african': ETHNIC_FACE_YOGA_CONSIDERATIONS['east-african'],
    'south-african': ETHNIC_FACE_YOGA_CONSIDERATIONS['south-african'],
    'black-american': ETHNIC_FACE_YOGA_CONSIDERATIONS['black-american']
  };
  return directMap[communityId] || null;
}

export const FACE_YOGA_STATS = {
  moduleId: 'face_yoga_guide',
  version: '1.0.0',
  topics: ['face yoga', 'facial exercises', 'gua sha', 'facial massage', 'kobido', 'kansa wand', 'Mukhabyanga', 'platysma', 'facial muscles', 'anti-aging exercises', 'cheek lifting exercises', 'jawline exercise', 'neck exercise', 'lion pose yoga'],
  communitiesSupported: 9,
  keyFacts: [
    'A Northwestern University study (2018) found face yoga participants were estimated to look approximately 3 years younger after 20 weeks of practice, with increased cheek fullness scores',
    'The platysma (neck sheet muscle) is almost never deliberately exercised but responds very well to face yoga — neck exercises may show the most visible results',
    'Japanese kobido facial massage technique is over 500 years old — predating modern face yoga by centuries; it was traditionally reserved for Japanese royalty',
    'Ayurvedic Mukhabyanga (facial oil massage) is essentially ancient face yoga documented in Indian classical texts; sesame or coconut oil applied to face and massaged upward before bathing',
    'Marula oil (South Africa) and moringa oil (East Africa) are culturally authentic facial massage oils for face yoga in their respective communities',
    'The corrugator supercilii muscle creates the "11 lines" between the brows — this is precisely the muscle that Botox targets when injecting for these lines',
    'Face yoga does NOT address bone density loss or fat pad migration — significant drivers of facial aging that exercise cannot reverse; it is a complement to, not replacement for, clinical approaches'
  ]
};
