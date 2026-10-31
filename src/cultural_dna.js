/**
 * MIRRR Cultural DNA Engine
 *
 * Translates a user's cultural self-identification into an initial aesthetic
 * signal before any Qloo data is available. This pre-seeds the aesthetic
 * vector so the first recommendation is already culturally resonant.
 *
 * "Your culture is your beauty blueprint."
 */

// ---------------------------------------------------------------------------
// Cultural community definitions
// ---------------------------------------------------------------------------

export const COMMUNITIES = [
  {
    id: 'west_african',
    label: 'West African',
    subLabel: 'Nigerian, Ghanaian, Senegalese, Ivorian…',
    emoji: '🌍',
    seeds: {
      intensity: 0.82, warmth: 0.80, boldness: 0.85, texture: 'shimmer',
      colour_palette: 'rich-earth',
      // No pre-set hair or look per community: she picks (nothing pre-selected).
    },
    qloo_anchors: ['Afrobeats', 'Burna Boy', 'Wizkid', 'Tiwa Savage', 'Davido', 'Lagos'],
  },
  {
    id: 'east_african',
    label: 'East African',
    subLabel: 'Ethiopian, Somali, Kenyan, Ugandan…',
    emoji: '🌄',
    seeds: {
      intensity: 0.75, warmth: 0.78, boldness: 0.80, texture: 'glass',
      colour_palette: 'jewel-tones',
      // No pre-set hair or look per community: she picks (nothing pre-selected).
    },
    qloo_anchors: ['Ethiopian music', 'Afrobeats', 'Nairobi'],
  },
  {
    id: 'black_american',
    label: 'Black American',
    subLabel: 'African-American, Southern, HBCU culture…',
    emoji: '👑',
    seeds: {
      intensity: 0.85, warmth: 0.77, boldness: 0.88, texture: 'shimmer',
      colour_palette: 'warm-vibrant',
      // No pre-set hair or look per community: she picks (nothing pre-selected).
    },
    qloo_anchors: ['Hip hop', 'R&B', 'Beyoncé', 'Cardi B', 'SZA', 'Atlanta'],
  },
  {
    id: 'caribbean',
    label: 'Caribbean',
    subLabel: 'Jamaican, Trinidadian, Barbadian, Haitian…',
    emoji: '🌴',
    seeds: {
      intensity: 0.90, warmth: 0.85, boldness: 0.90, texture: 'shimmer',
      colour_palette: 'warm-vibrant',
      // No pre-set hair or look per community: she picks (nothing pre-selected).
    },
    qloo_anchors: ['Dancehall', 'Soca', 'Carnival', 'Rihanna', 'Reggae', 'Jamaica'],
  },
  {
    id: 'south_asian',
    label: 'South Asian',
    subLabel: 'Indian, Pakistani, Bangladeshi, Sri Lankan…',
    emoji: '💎',
    seeds: {
      intensity: 0.83, warmth: 0.79, boldness: 0.80, texture: 'glass',
      colour_palette: 'jewel-tones',
      // No pre-set hair or look per community: she picks (nothing pre-selected).
    },
    qloo_anchors: ['Bollywood', 'A.R. Rahman', 'Arijit Singh', 'Mumbai', 'Diwali'],
  },
  {
    id: 'arab',
    label: 'Arab',
    subLabel: 'Gulf, Levantine, Iraqi, Egyptian · North African: Moroccan, Algerian, Tunisian (Arab and Amazigh)…',
    emoji: '✨',
    seeds: {
      intensity: 0.80, warmth: 0.75, boldness: 0.78, texture: 'glass',
      colour_palette: 'gold-pearl',
      // No pre-set hair or look per community: she picks (nothing pre-selected).
    },
    qloo_anchors: ['Arabic music', 'Fairuz', 'Nancy Ajram', 'Oud', 'Dubai', 'Amman'],
  },
  {
    id: 'latina',
    label: 'Latina',
    subLabel: 'Mexican, Colombian, Puerto Rican, Cuban, Dominican…',
    emoji: '🌺',
    seeds: {
      intensity: 0.82, warmth: 0.83, boldness: 0.82, texture: 'shimmer',
      colour_palette: 'warm-vibrant',
      // No pre-set hair or look per community: she picks (nothing pre-selected).
    },
    qloo_anchors: ['Reggaeton', 'Bad Bunny', 'J Balvin', 'Shakira', 'Latin pop', 'Mexico City'],
  },
  {
    id: 'east_asian',
    label: 'East Asian',
    subLabel: 'Korean, Chinese, Japanese, Taiwanese…',
    emoji: '🍃',
    seeds: {
      intensity: 0.38, warmth: 0.40, boldness: 0.35, texture: 'glass',
      colour_palette: 'soft-pastels',
      // No pre-set hair or look per community: she picks (nothing pre-selected).
    },
    qloo_anchors: ['K-pop', 'BTS', 'BLACKPINK', 'J-pop', 'Korean drama', 'Seoul'],
  },
  {
    id: 'southeast_asian',
    label: 'Southeast Asian',
    subLabel: 'Filipino, Vietnamese, Thai, Indonesian…',
    emoji: '🌸',
    seeds: {
      intensity: 0.60, warmth: 0.62, boldness: 0.58, texture: 'glass',
      colour_palette: 'soft-pastels',
      // No pre-set hair or look per community: she picks (nothing pre-selected).
    },
    qloo_anchors: ['K-pop', 'OPM', 'Manila', 'Bangkok', 'Vietnamese pop'],
  },
  {
    id: 'mixed',
    label: 'Mixed / Multiracial',
    subLabel: 'Multiple heritages — my look is all my own',
    emoji: '🌈',
    seeds: {
      intensity: 0.60, warmth: 0.60, boldness: 0.60, texture: 'shimmer',
      colour_palette: 'neutral',
      // No pre-set hair or look per community: she picks (nothing pre-selected).
    },
    qloo_anchors: [],
  },
];

// ---------------------------------------------------------------------------
// Cultural DNA quiz questions
// ---------------------------------------------------------------------------

export const QUIZ_QUESTIONS = [
  {
    id: 'q_music',
    prompt: "When you need to feel yourself, what's playing?",
    emoji: '🎵',
    options: [
      { label: 'Afrobeats / Amapiano', communities: ['west_african', 'east_african'] },
      { label: 'Hip-Hop / R&B', communities: ['black_american', 'caribbean'] },
      { label: 'Soca / Dancehall', communities: ['caribbean'] },
      { label: 'Bollywood / Filmi', communities: ['south_asian'] },
      { label: 'Arabic pop / Khaleeji', communities: ['arab'] },
      { label: 'Reggaeton / Latin pop', communities: ['latina'] },
      { label: 'K-pop / J-pop', communities: ['east_asian', 'southeast_asian'] },
      { label: 'All of the above', communities: ['mixed'] },
    ],
  },
  {
    id: 'q_occasion',
    prompt: "What's your peak beauty moment?",
    emoji: '💄',
    options: [
      { label: 'Owambe / Nigerian owambe parties', communities: ['west_african'] },
      { label: 'Homecoming / HBCU step show', communities: ['black_american'] },
      { label: 'Carnival / Soca fête', communities: ['caribbean'] },
      { label: 'Desi wedding (mehendi, sangeet, baraat)', communities: ['south_asian'] },
      { label: 'Arab/Gulf wedding night', communities: ['arab'] },
      { label: 'Quinceañera / quince court', communities: ['latina'] },
      { label: 'Fan meet / K-pop concert', communities: ['east_asian', 'southeast_asian'] },
      { label: 'Everyday glow-up', communities: ['mixed', 'clean_minimal'] },
    ],
  },
  {
    id: 'q_icon',
    prompt: 'Which artist speaks to your soul?',
    emoji: '⭐',
    options: [
      { label: 'Tiwa Savage', communities: ['west_african'] },
      { label: 'Nicki Minaj', communities: ['caribbean', 'black_american'] },
      { label: 'Anitta', communities: ['latina'] },
      { label: 'BLACKPINK', communities: ['east_asian'] },
      { label: 'Beyoncé', communities: ['black_american', 'west_african'] },
      { label: 'Karol G', communities: ['latina'] },
      { label: 'Elyanna', communities: ['arab'] },
      { label: 'AP Dhillon', communities: ['south_asian'] },
    ],
  },
  {
    id: 'q_finish',
    prompt: "What's your signature finish?",
    emoji: '✨',
    options: [
      { label: 'Glass skin — I want to glow from within', communities: ['east_asian', 'arab', 'south_asian'] },
      { label: 'Bronze shimmer — sun-kissed everything', communities: ['latina', 'caribbean', 'black_american'] },
      { label: 'Editorial drama — structured + bold', communities: ['west_african', 'black_american'] },
      { label: 'Soft + dewy — pretty but natural', communities: ['southeast_asian', 'east_asian', 'mixed'] },
      { label: 'Full glam — more is more', communities: ['arab', 'south_asian', 'west_african'] },
    ],
  },
  {
    id: 'q_hair',
    prompt: "Your wig is waiting — what's the vibe?",
    emoji: '💁🏾‍♀️',
    options: [
      { label: 'Natural coils / tightly coiled afro', communities: ['west_african', 'east_african', 'black_american'] },
      { label: 'Long sleek bone-straight', communities: ['black_american', 'arab'] },
      { label: 'Long wavy / Indian-texture curls', communities: ['south_asian', 'latina'] },
      { label: 'Silky straight (long)', communities: ['arab', 'east_asian'] },
      { label: 'Curly ombré', communities: ['caribbean', 'latina'] },
      { label: 'Sleek bob / lob', communities: ['east_asian', 'southeast_asian'] },
    ],
  },
];

// ---------------------------------------------------------------------------
// DNA scoring
// ---------------------------------------------------------------------------

/**
 * Score quiz answers and return a ranked list of communities + seed aesthetic.
 *
 * @param {Record<string, string[]>} answers - { questionId: [communityId, …] }
 * @returns {{ topCommunity: object, scores: object, seedAesthetic: object }}
 */
export function scoreDNA(answers) {
  const scores = {};
  for (const community of COMMUNITIES) scores[community.id] = 0;

  for (const communityIds of Object.values(answers)) {
    for (const cid of communityIds) {
      if (cid in scores) scores[cid] += 1;
    }
  }

  const ranked = COMMUNITIES
    .map(c => ({ ...c, score: scores[c.id] }))
    .sort((a, b) => b.score - a.score);

  const top = ranked[0];
  const runner = ranked[1];

  // Blend top two communities for richer seeds
  const blendWeight = runner.score / Math.max(top.score + runner.score, 1);
  const seedAesthetic = blendSeeds(top.seeds, runner.seeds, blendWeight);

  return {
    topCommunity: top,
    runnerUp: runner,
    scores,
    seedAesthetic,
    qlooAnchors: [...new Set([...top.qloo_anchors, ...runner.qloo_anchors])].slice(0, 6),
  };
}

function blendSeeds(a, b, wB) {
  const wA = 1 - wB;
  return {
    intensity: clamp(a.intensity * wA + b.intensity * wB),
    warmth: clamp(a.warmth * wA + b.warmth * wB),
    boldness: clamp(a.boldness * wA + b.boldness * wB),
    texture: wA >= 0.5 ? a.texture : b.texture,
    colour_palette: wA >= 0.5 ? a.colour_palette : b.colour_palette,
    // Communities carry no pre-set hair or look: hair and looks come only from her own taste and picks.
    hair_vibe: null,
    archetypes: [],
  };
}

function clamp(v) { return Math.max(0, Math.min(1, v)); }

/**
 * Get all communities for the community selector UI.
 */
export function getCommunities() {
  return COMMUNITIES.map(({ id, label, subLabel, emoji, qloo_anchors }) => ({
    id, label, subLabel, emoji, qlooAnchors: qloo_anchors,
  }));
}
