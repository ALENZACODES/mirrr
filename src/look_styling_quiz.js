/**
 * MIRRR Look Styling Quiz
 * Interactive quiz to help users find their signature MIRRR look
 * Maps lifestyle, aesthetic preferences, occasion, and skin type to look recommendations
 */

// ─── QUIZ QUESTIONS ───────────────────────────────────────────────────────────

export const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    question: 'What\'s your go-to weekend vibe?',
    category: 'lifestyle',
    options: [
      { id: 'a', label: 'Brunch with the girls — dressed but casual', tags: ['social', 'day', 'natural'] },
      { id: 'b', label: 'Festival or cultural event — all out', tags: ['bold', 'cultural', 'festive'] },
      { id: 'c', label: 'Staying in, skincare day, self-care', tags: ['minimal', 'skincare', 'soft'] },
      { id: 'd', label: 'Night out — we\'re going OUT out', tags: ['glam', 'evening', 'dramatic'] },
    ],
  },
  {
    id: 'q2',
    question: 'Your skin: what do you want your base to look like?',
    category: 'skin',
    options: [
      { id: 'a', label: 'Glowing and dewy — like I just got back from vacation', tags: ['glow', 'dewy', 'luminous'] },
      { id: 'b', label: 'Full-coverage, airbrushed and matte', tags: ['full-coverage', 'matte', 'flawless'] },
      { id: 'c', label: 'Barely there — just skin but better', tags: ['minimal', 'natural', 'sheer'] },
      { id: 'd', label: 'Satin — somewhere between matte and glow', tags: ['satin', 'medium', 'balanced'] },
    ],
  },
  {
    id: 'q3',
    question: 'Pick the eye look that calls to you most:',
    category: 'eyes',
    options: [
      { id: 'a', label: 'Dramatic smoky eye — dark, blended, sultry', tags: ['smoky', 'dramatic', 'dark'] },
      { id: 'b', label: 'Cut crease with colour — graphic and precise', tags: ['graphic', 'colour', 'precise'] },
      { id: 'c', label: 'Natural mascara and liner — classic and clean', tags: ['natural', 'classic', 'minimal'] },
      { id: 'd', label: 'Shimmer and glitter — give me ALL the sparkle', tags: ['shimmer', 'sparkle', 'bold'] },
    ],
  },
  {
    id: 'q4',
    question: 'What does your daily lip situation look like?',
    category: 'lip',
    options: [
      { id: 'a', label: 'Bold lip, no apologies — red, berry, or deep plum', tags: ['bold', 'statement', 'deep'] },
      { id: 'b', label: 'MLBB (My Lips But Better) — nude or my-shade', tags: ['mlbb', 'nude', 'natural'] },
      { id: 'c', label: 'Gloss — shiny, bouncy, full', tags: ['gloss', 'shine', 'plump'] },
      { id: 'd', label: 'A stain or tint — low maintenance, always there', tags: ['tint', 'effortless', 'light'] },
    ],
  },
  {
    id: 'q5',
    question: 'What\'s your relationship with colour?',
    category: 'colour',
    options: [
      { id: 'a', label: 'Neutrals only — browns, nudes, terracottas', tags: ['neutral', 'earth', 'warm'] },
      { id: 'b', label: 'Pop of colour on eyes or lips but not both', tags: ['selective', 'accent', 'balanced'] },
      { id: 'c', label: 'BOLD colour everywhere — I am the main character', tags: ['maximal', 'colourful', 'statement'] },
      { id: 'd', label: 'Metallics — gold, bronze, silver', tags: ['metallic', 'luminous', 'glow'] },
    ],
  },
  {
    id: 'q6',
    question: 'Your heritage or the cultures you love most aesthetically:',
    category: 'culture',
    options: [
      { id: 'a', label: 'South Asian — Bollywood, bridal, mehndi', tags: ['south-asian', 'bollywood', 'bridal'] },
      { id: 'b', label: 'West / East African — bold, rich, regal', tags: ['west-african', 'east-african', 'regal'] },
      { id: 'c', label: 'Middle Eastern — editorial, polished, architectural', tags: ['arab', 'editorial', 'architectural'] },
      { id: 'd', label: 'East Asian — K-beauty, J-beauty, glass skin', tags: ['east-asian', 'k-beauty', 'glass-skin'] },
    ],
  },
  {
    id: 'q7',
    question: 'How long do you have for your makeup routine?',
    category: 'practicality',
    options: [
      { id: 'a', label: 'Under 10 minutes — I need it quick', tags: ['quick', 'minimal', 'efficient'] },
      { id: 'b', label: '15–30 minutes — the regular', tags: ['medium', 'balanced', 'daily'] },
      { id: 'c', label: '30–60 minutes — I enjoy the process', tags: ['elaborate', 'ritual', 'invested'] },
      { id: 'd', label: 'Hours if needed for a special occasion', tags: ['occasion', 'glam', 'full'] },
    ],
  },
  {
    id: 'q8',
    question: 'Pick your beauty icon energy:',
    category: 'icon',
    options: [
      { id: 'a', label: 'Lupita Nyong\'o — luminous, bold, authentic', tags: ['west-african', 'bold', 'luminous'] },
      { id: 'b', label: 'Priyanka Chopra — global, polished, elegant', tags: ['south-asian', 'elegant', 'polish'] },
      { id: 'c', label: 'Huda Kattan — editorial, dramatic, constructed', tags: ['arab', 'editorial', 'glam'] },
      { id: 'd', label: 'Song Hye-kyo — minimal, glowing, effortless', tags: ['east-asian', 'minimal', 'glow'] },
    ],
  },
];

// ─── LOOK PROFILES ───────────────────────────────────────────────────────────

export const LOOK_PROFILES = {
  desi_baddie: {
    id: 'desi_baddie',
    name: 'Desi Baddie',
    tagline: 'Bollywood meets streetwear — bold brows, smoky eyes, and lit-from-within skin',
    community: 'south-asian',
    keyFeatures: ['Bold, defined brows', 'Smudged kohl or smoky eye', 'Glowing dewy base', 'Terracotta or deep plum lip'],
    personality: 'Confident, cultural, unapologetically bold. You love your roots and wear them like armour.',
    quizTriggerTags: ['south-asian', 'bollywood', 'smoky', 'dewy', 'bold', 'cultural'],
    matchingThreshold: 3,
  },
  persian_queen: {
    id: 'persian_queen',
    name: 'Persian Queen',
    tagline: 'Architectural contour, editorial brows, and golden skin that stops traffic',
    community: 'arab',
    keyFeatures: ['Precisely filled arched brows', 'Intense contour and highlight', 'Matte full-coverage base', 'Nude or deep nude lip'],
    personality: 'Regal, precise, architectural. You like your face to be a statement — put-together and powerful.',
    quizTriggerTags: ['arab', 'editorial', 'architectural', 'full-coverage', 'matte', 'glam'],
    matchingThreshold: 3,
  },
  west_african_glow: {
    id: 'west_african_glow',
    name: 'West African Glow',
    tagline: 'Melanin magic in full effect — rich pigment, luminous skin, and unapologetic colour',
    community: 'west-african',
    keyFeatures: ['Intensely luminous skin', 'Rich copper, bronze, or gold eyeshadow', 'Bold statement lip (red, berry, or orange)', 'Visible blush in warm terracotta tones'],
    personality: 'Radiant, magnetic, abundant. You command attention and you own it.',
    quizTriggerTags: ['west-african', 'regal', 'glow', 'luminous', 'bold', 'statement'],
    matchingThreshold: 3,
  },
  k_beauty_seoul: {
    id: 'k_beauty_seoul',
    name: 'K-Beauty Seoul',
    tagline: 'Glass skin, puppy liner, and colour-me-soft — less is more, but more is perfect',
    community: 'east-asian',
    keyFeatures: ['Glass skin base (dewy, minimal)', 'Monolid-friendly liner (puppy or straight)', 'Gradient lip (ombre from centre)', 'Blush placed high (under-eye blush trend)'],
    personality: 'Soft, deliberate, intentionally minimalist. You appreciate technique over drama.',
    quizTriggerTags: ['east-asian', 'k-beauty', 'glass-skin', 'minimal', 'dewy', 'natural'],
    matchingThreshold: 3,
  },
  hammam_goddess: {
    id: 'hammam_goddess',
    name: 'Hammam Goddess',
    tagline: 'North African ritual beauty — skin so luminous it looks like you bathed in gold',
    community: 'arab',
    keyFeatures: ['Golden-warm skin base', 'Bronze and copper eye', 'Kohl-lined eyes (traditional)', 'Rose or warm coral lip'],
    personality: 'Grounded, warm, ritualistic. You move through the world with the ease of someone who takes their time.',
    quizTriggerTags: ['arab', 'glow', 'cultural', 'warm', 'natural', 'luminous'],
    matchingThreshold: 2,
  },
  mehndi_bride: {
    id: 'mehndi_bride',
    name: 'Mehndi Bride',
    tagline: 'Full bridal glam — you\'re not just beautiful, you\'re an event',
    community: 'south-asian',
    keyFeatures: ['Heavy full-coverage bridal base', 'Cut crease with gold glitter', 'Bold red or deep maroon lip', 'Highlighter on every cut bone'],
    personality: 'Celebratory, traditional, all-out. Life is special, and you dress accordingly.',
    quizTriggerTags: ['south-asian', 'bridal', 'glam', 'full-coverage', 'shimmer', 'bold', 'statement'],
    matchingThreshold: 3,
  },
  rooibos_glow: {
    id: 'rooibos_glow',
    name: 'Rooibos Glow',
    tagline: 'South African warmth — copper highlights, natural skin, rich earth tones',
    community: 'south-african',
    keyFeatures: ['Bronzed, sun-kissed natural base', 'Terracotta and copper eyeshadow', 'Natural MLBB lip', 'Bronze highlighter'],
    personality: 'Effortless, warm, earthy. You glow without trying.',
    quizTriggerTags: ['earth', 'warm', 'natural', 'glow', 'neutral', 'mlbb'],
    matchingThreshold: 3,
  },
  loc_journey: {
    id: 'loc_journey',
    name: 'LOC Journey',
    tagline: 'Natural hair, natural beauty — let your texture lead and your skin follow',
    community: 'black-american',
    keyFeatures: ['Skincare-focused barely-there base', 'Bold natural brow', 'Pop of colour (single statement)', 'Healthy glowing skin above all'],
    personality: 'Authentic, skin-forward, natural. Your hair is the main character; your makeup is its co-star.',
    quizTriggerTags: ['natural', 'minimal', 'skincare', 'effortless', 'soft'],
    matchingThreshold: 2,
  },
};

// ─── QUIZ SCORING ENGINE ──────────────────────────────────────────────────────

export function scoreQuiz(answers) {
  // answers = { q1: 'a', q2: 'b', ... }
  const tagCounts = {};

  for (const [qId, selectedOptionId] of Object.entries(answers)) {
    const question = QUIZ_QUESTIONS.find(q => q.id === qId);
    if (!question) continue;
    const option = question.options.find(o => o.id === selectedOptionId);
    if (!option) continue;
    for (const tag of option.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  const scores = {};
  for (const [lookId, look] of Object.entries(LOOK_PROFILES)) {
    let score = 0;
    for (const triggerTag of look.quizTriggerTags) {
      if (tagCounts[triggerTag]) {
        score += tagCounts[triggerTag];
      }
    }
    scores[lookId] = score;
  }

  const ranked = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([lookId, score]) => ({ lookId, score, look: LOOK_PROFILES[lookId] }));

  return {
    topMatch: ranked[0],
    runner_up: ranked[1],
    all: ranked,
    tagProfile: tagCounts,
  };
}

// ─── RESULT NARRATIVES ────────────────────────────────────────────────────────

export const RESULT_NARRATIVES = {
  desi_baddie: {
    headline: 'You\'re a DESI BADDIE 💫',
    summary: 'Bold, cultural, and unapologetically you. You carry your heritage in your kohl-lined eyes and your attitude.',
    whatYouNeed: 'A smudged kohl liner, a dewy base that catches light, and one killer eyeshadow palette in warm browns and spice tones.',
    soundtrack: 'AP Dhillon, Doja Cat, or Badshah — your choice.',
    hashtagEnergy: '#DesiBeauty #BollyglammMakeup #SouthAsianGlow',
  },
  persian_queen: {
    headline: 'You\'re a PERSIAN QUEEN 👑',
    summary: 'Architectural, regal, precise. Your face is a work of art and you treat it like one.',
    whatYouNeed: 'A high-coverage matte foundation, a contour that could cut glass, and architectural brows that mean business.',
    soundtrack: 'Haifa Wehbe, Nancy Ajram, or Stromae depending on your mood.',
    hashtagEnergy: '#ArabBeauty #EditorialMakeup #MiddleEasternGlam',
  },
  west_african_glow: {
    headline: 'You\'re WEST AFRICAN GLOW ✨',
    summary: 'Luminous, rich, magnetic. Your skin is your statement and your colour game is unmatched.',
    whatYouNeed: 'A serum foundation that lets your skin breathe, rich copper and gold pigments, and a red lip that does all the talking.',
    soundtrack: 'Tiwa Savage, Burna Boy, or Tems.',
    hashtagEnergy: '#WestAfricanBeauty #MelaninMagic #AfricanGlow',
  },
  k_beauty_seoul: {
    headline: 'You\'re K-BEAUTY SEOUL 🌸',
    summary: 'Minimal, perfected, intentional. You understand that the goal is skin, not makeup.',
    whatYouNeed: 'A glass skin tinted moisturiser, a cushion foundation for touch-ups, and the softest pout in the room.',
    soundtrack: 'aespa, NewJeans, or IU for the cosy aesthetic.',
    hashtagEnergy: '#KBeauty #GlassSkin #SeoulStyle',
  },
  hammam_goddess: {
    headline: 'You\'re a HAMMAM GODDESS 🌿',
    summary: 'Warm, luminous, ritualistic. You believe beauty is a practice, not a performance.',
    whatYouNeed: 'Argan oil in everything, a bronze highlighter that reads like sunshine, and kohl that connects you to tradition.',
    soundtrack: 'Fairuz, Natacha Atlas, or Khaled.',
    hashtagEnergy: '#MoroccanBeauty #HammamGlow #NorthAfricanBeauty',
  },
  mehndi_bride: {
    headline: 'You\'re a MEHNDI BRIDE 🪷',
    summary: 'Every day is a celebration. You don\'t do half-measures — when you show up, you SHOW UP.',
    whatYouNeed: 'A full bridal kit: high-coverage foundation, a cut crease palette with gold glitter, the boldest lip in your collection.',
    soundtrack: 'Lata Mangeshkar, Shreya Ghoshal, or anything from your favourite Bollywood wedding.',
    hashtagEnergy: '#BridalMakeup #DesiWedding #MehndiLook',
  },
  rooibos_glow: {
    headline: 'You\'re ROOIBOS GLOW 🌄',
    summary: 'Earthy, warm, effortless. You look like you\'ve been kissed by South African sun.',
    whatYouNeed: 'A bronzer that looks like your skin just woke up right, terracotta eyeshadow, and a nude lip that\'s perfectly your colour.',
    soundtrack: 'Sho Madjozi, Tyla, or anything from the Cape Jazz scene.',
    hashtagEnergy: '#SouthAfricanBeauty #AfricanGlow #TerraCottaMakeup',
  },
  loc_journey: {
    headline: 'You\'re on a LOC JOURNEY 🌿',
    summary: 'Natural, authentic, skin-first. Your texture is your statement and your skin is your signature.',
    whatYouNeed: 'Your best skincare routine, a tinted SPF, a bold brow gel, and ONE pop of colour wherever you feel like it today.',
    soundtrack: 'India.Arie, SZA, or Lizzo for that self-love energy.',
    hashtagEnergy: '#NaturalHair #SkincareFirst #BlackNaturalBeauty',
  },
};

// ─── QUICK PICKS (SKIP QUIZ) ──────────────────────────────────────────────────

export const QUICK_PICKS = {
  by_occasion: {
    bridal: ['mehndi_bride', 'persian_queen'],
    festival: ['desi_baddie', 'west_african_glow'],
    everyday: ['k_beauty_seoul', 'rooibos_glow', 'loc_journey'],
    evening: ['persian_queen', 'hammam_goddess', 'west_african_glow'],
  },
  by_skin_type: {
    oily: ['k_beauty_seoul', 'persian_queen'],
    dry: ['hammam_goddess', 'west_african_glow'],
    combination: ['rooibos_glow', 'desi_baddie'],
    sensitive: ['loc_journey', 'rooibos_glow'],
  },
  by_time: {
    under_10_min: ['loc_journey', 'k_beauty_seoul'],
    '15_to_30_min': ['rooibos_glow', 'hammam_goddess', 'desi_baddie'],
    over_30_min: ['persian_queen', 'mehndi_bride', 'west_african_glow'],
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getAllQuizQuestions() {
  return QUIZ_QUESTIONS;
}

export function getLookProfile(lookId) {
  return LOOK_PROFILES[lookId] || null;
}

export function getAllLookProfiles() {
  return Object.values(LOOK_PROFILES);
}

export function getQuickPicks(criteria, value) {
  if (QUICK_PICKS[criteria] && QUICK_PICKS[criteria][value]) {
    return QUICK_PICKS[criteria][value].map(id => LOOK_PROFILES[id]).filter(Boolean);
  }
  return [];
}

export function getResultNarrative(lookId) {
  return RESULT_NARRATIVES[lookId] || null;
}

export function runFullQuiz(answers) {
  const scores = scoreQuiz(answers);
  const topId = scores.topMatch?.lookId;
  return {
    ...scores,
    narrative: topId ? RESULT_NARRATIVES[topId] : null,
    profile: topId ? LOOK_PROFILES[topId] : null,
  };
}

export const QUIZ_STATS = {
  questions: QUIZ_QUESTIONS.length,
  looks: Object.keys(LOOK_PROFILES).length,
  optionsPerQuestion: 4,
};
