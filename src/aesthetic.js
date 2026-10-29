/**
 * Aesthetic Engine for MIRRR
 * Ported from beljour/api/plumb_api/taste/aesthetic_engine.py
 *
 * Maps Qloo cultural taste tags → AestheticVector
 * which drives look/wig recommendations.
 */

// ---------------------------------------------------------------------------
// Tag signal maps — ordered by priority within each dimension
// ---------------------------------------------------------------------------

const TAG_SIGNALS = {
  // intensity (how bold/dramatic the overall look is)
  intensity: {
    high: [
      'afrobeats', 'afropop', 'afro-fusion', 'dancehall', 'hip-hop', 'hip hop',
      'rap', 'trap', 'carnival', 'soca', 'reggaeton', 'amapiano', 'gqom',
      'nollywood', 'lagos', 'naija', 'streetwear', 'urban', 'ghetto fab',
      'baddie', 'glam', 'editorial', 'avant-garde', 'bold',
    ],
    low: [
      'minimalist', 'clean', 'natural', 'bare', 'soft', 'subtle',
      'j-pop', 'indie', 'folk', 'acoustic', 'classical', 'ambient',
      'hygge', 'cottagecore', 'normcore',
    ],
  },

  // warmth (warm amber/bronze/red vs cool blue/grey/silver)
  warmth: {
    warm: [
      'afrobeats', 'caribbean', 'jamaican', 'lagos', 'naija', 'ghana', 'accra',
      'dancehall', 'reggaeton', 'latin', 'salsa', 'cumbia', 'tropical',
      'bollywood', 'desi', 'south asian', 'indian', 'bengali', 'pakistani',
      'middle east', 'arab', 'gulf', 'khaleeji', 'persian', 'turkish',
      'mediterranean', 'bronze', 'terracotta', 'amber',
    ],
    cool: [
      'k-pop', 'k-beauty', 'korean', 'j-pop', 'japanese', 'anime', 'e-girl',
      'y2k', 'cyber', 'futuristic', 'nordic', 'scandinavian', 'blue', 'silver',
      'pastel', 'lilac', 'lavender', 'mint',
    ],
  },

  // boldness (pattern/colour complexity)
  boldness: {
    high: [
      'ankara', 'kente', 'dashiki', 'african print', 'wax print', 'tribal',
      'maximalist', 'psychedelic', 'neon', 'graphic', 'streetwear', 'drip',
      'carnival', 'festival', 'rave', 'club', 'nightlife',
    ],
    low: [
      'monochrome', 'monotone', 'minimalist', 'clean girl', 'no-makeup makeup',
      'understated', 'capsule', 'classic', 'timeless',
    ],
  },

  // texture (matte earth vs glass glow vs shimmer/glitter)
  texture: {
    glass: [
      'glass skin', 'dewy', 'glow', 'luminous', 'radiant', 'k-beauty',
      'korean skin', 'hydration', 'glossy lip', 'wet look', 'bling',
    ],
    shimmer: [
      'glitter', 'rhinestone', 'bling', 'sequin', 'metallic', 'chrome',
      'highlight', 'shimmer', 'carnival', 'festival',
    ],
    matte: [
      'matte', 'velvet', 'no-makeup', 'natural skin', 'earthy', 'clay',
      'terracotta', 'suede', 'minimal makeup',
    ],
  },
};

// ---------------------------------------------------------------------------
// Colour palette mapping
// ---------------------------------------------------------------------------

const COLOUR_PALETTE_MAP = [
  { keywords: ['afrobeats', 'ankara', 'kente', 'afro', 'naija', 'ghana', 'west africa', 'carnival', 'soca'], palette: 'rich-earth' },
  { keywords: ['k-pop', 'k-beauty', 'korean', 'seoul', 'pastel', 'cherry blossom'], palette: 'soft-pastels' },
  { keywords: ['hip-hop', 'hip hop', 'rap', 'trap', 'urban', 'streetwear', 'drip', 'baddie'], palette: 'cool-neutrals' },
  { keywords: ['bollywood', 'desi', 'south asian', 'indian', 'bengali', 'pakistani', 'punjabi'], palette: 'jewel-tones' },
  { keywords: ['middle east', 'arab', 'gulf', 'khaleeji', 'persian', 'arabic', 'dubai', 'riyadh'], palette: 'gold-pearl' },
  { keywords: ['latin', 'latina', 'reggaeton', 'salsa', 'cumbia', 'telenovela', 'mexican', 'colombian', 'brazilian'], palette: 'warm-vibrant' },
  { keywords: ['natural', 'clean', 'minimalist', 'no-makeup', 'hygge', 'cottagecore'], palette: 'neutral' },
];

// ---------------------------------------------------------------------------
// Hair vibe mapping
// ---------------------------------------------------------------------------

const HAIR_VIBE_MAP = [
  { keywords: ['afrobeats', 'afro', 'natural hair', 'locs', 'dreadlocks', 'braids', 'ghana braids', 'cornrows', 'naija', 'west africa', 'coily', 'kinky', 'textured'], vibe: 'natural-afro' },
  { keywords: ['hip-hop', 'hip hop', 'urban', 'trap', 'rap', 'streetwear', 'baddie', 'ratchet'], vibe: 'long-sleek-wig' },
  { keywords: ['k-pop', 'k-beauty', 'korean', 'idol', 'anime', 'j-pop', 'kawaii'], vibe: 'straight-sleek' },
  { keywords: ['bollywood', 'desi', 'south asian', 'indian', 'bengali', 'pakistani'], vibe: 'long-wavy-indian' },
  { keywords: ['caribbean', 'jamaican', 'dancehall', 'reggae', 'soca', 'trinidadian'], vibe: 'curly-ombre' },
  { keywords: ['middle east', 'arab', 'gulf', 'khaleeji', 'persian', 'arabic', 'hijab', 'hijabi'], vibe: 'long-silky' },
  { keywords: ['natural', 'clean', 'minimalist'], vibe: 'natural' },
];

// ---------------------------------------------------------------------------
// Archetype mapping
// ---------------------------------------------------------------------------

const ARCHETYPE_MAP = [
  {
    id: 'afro_glam',
    label: 'Afro-Glam',
    keywords: ['afrobeats', 'afropop', 'afro-fusion', 'naija', 'ghana', 'lagos', 'accra', 'nollywood', 'west africa', 'ankara', 'kente', 'amapiano', 'south africa'],
  },
  {
    id: 'hip_hop_glam',
    label: 'Hip Hop Glam',
    keywords: ['hip-hop', 'hip hop', 'rap', 'trap', 'r&b', 'rnb', 'urban', 'streetwear', 'drip', 'baddie', 'ghetto fab', 'lil kim', 'cardi b'],
  },
  {
    id: 'caribbean_carnival',
    label: 'Caribbean Carnival',
    keywords: ['caribbean', 'jamaican', 'dancehall', 'reggae', 'soca', 'carnival', 'trinidadian', 'bajan', 'haitian', 'calypso', 'patois'],
  },
  {
    id: 'desi_glam',
    label: 'Desi Glam',
    keywords: ['bollywood', 'desi', 'south asian', 'indian', 'bengali', 'pakistani', 'punjabi', 'tamil', 'telugu', 'gujarati', 'nepali', 'sri lankan', 'bhangra'],
  },
  {
    id: 'gulf_glam',
    label: 'Gulf Glam',
    keywords: ['middle east', 'arab', 'gulf', 'khaleeji', 'persian', 'arabic', 'dubai', 'riyadh', 'mena', 'levantine', 'turkish', 'iranian', 'egyptian'],
  },
  {
    id: 'latina_glam',
    label: 'Latina Glam',
    keywords: ['latin', 'latina', 'reggaeton', 'salsa', 'cumbia', 'telenovela', 'mexican', 'colombian', 'brazilian', 'puerto rican', 'dominican', 'cuban', 'afro-latina'],
  },
  {
    id: 'k_beauty',
    label: 'K-Beauty',
    keywords: ['k-pop', 'k-beauty', 'korean', 'seoul', 'idol', 'hallyu', 'kpop', 'bts', 'blackpink', 'glass skin'],
  },
  {
    id: 'clean_minimal',
    label: 'Clean Minimal',
    keywords: ['minimalist', 'clean', 'natural', 'bare', 'no-makeup', 'soft', 'hygge', 'cottagecore', 'subtle', 'effortless'],
  },
];

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a Qloo tag to lowercase for matching.
 * @param {string} tag
 * @returns {string}
 */
function normalise(tag) {
  return tag.toLowerCase().replace(/[_-]/g, ' ').trim();
}

/** Read a tag's affinity defensively; null when absent. */
export function affinityOf(t) {
  if (t == null || typeof t !== 'object') return null;
  const a = t.affinity ?? t.score ?? t.query?.affinity ?? null;
  const n = typeof a === 'number' ? a : Number(a);
  return Number.isFinite(n) && a !== null && n >= 0 ? n : null;
}

/**
 * Check if any keyword appears in the normalised tag string.
 * @param {string} normTag
 * @param {string[]} keywords
 * @returns {boolean}
 */
function anyMatch(normTag, keywords) {
  return keywords.some((kw) => normTag.includes(kw));
}

/**
 * Score a single dimension (high/warm/glass vs low/cool/matte).
 * Returns a value in [0, 1]; 0.5 = neutral.
 *
 * @param {string[]} normTags
 * @param {{ high: string[], low: string[] } | { warm: string[], cool: string[] } | { glass: string[], shimmer: string[], matte: string[] }} spec
 * @param {string} positiveKey
 * @param {string} negativeKey
 * @returns {number}
 */
function scoreDimension(normTags, spec, positiveKey, negativeKey, weights = null) {
  let pos = 0;
  let neg = 0;
  normTags.forEach((tag, i) => {
    const w = weights ? weights[i] : 1;
    if (spec[positiveKey] && anyMatch(tag, spec[positiveKey])) pos += w;
    if (spec[negativeKey] && anyMatch(tag, spec[negativeKey])) neg += w;
  });
  const total = pos + neg;
  if (total === 0) return 0.5;
  return Math.min(1, Math.max(0, 0.3 + (pos / total) * 0.7));
}

/**
 * Score texture across three poles.
 * @param {string[]} normTags
 * @returns {number} 0=matte, 0.5=shimmer, 1=glass
 */
function scoreTexture(normTags, weights = null) {
  let glass = 0;
  let shimmer = 0;
  let matte = 0;
  const spec = TAG_SIGNALS.texture;
  normTags.forEach((tag, i) => {
    const w = weights ? weights[i] : 1;
    if (anyMatch(tag, spec.glass)) glass += w;
    if (anyMatch(tag, spec.shimmer)) shimmer += w;
    if (anyMatch(tag, spec.matte)) matte += w;
  });
  const total = glass + shimmer + matte;
  if (total === 0) return 0.5;
  return (glass * 1.0 + shimmer * 0.5 + matte * 0.0) / total;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} AestheticVector
 * @property {number} intensity   — 0 (soft) to 1 (dramatic)
 * @property {number} warmth      — 0 (cool) to 1 (warm)
 * @property {number} boldness    — 0 (minimal) to 1 (maximal)
 * @property {number} texture     — 0 (matte) to 1 (glass)
 * @property {string} colour_palette
 * @property {string} hair_vibe
 * @property {string[]} cultural_tags
 * @property {string[]} archetypes
 * @property {string[]} trace
 */

/**
 * Build an AestheticVector from Qloo tag entities.
 *
 * @param {Array<{name: string, affinity?: number}>} qlooTags
 * @param {object} [extraInputs]
 * @param {string[]} [extraInputs.freeText] — additional text signals
 * @returns {AestheticVector}
 */
export function buildAestheticVector(qlooTags = [], { freeText = [] } = {}) {
  const trace = [];

  // normalise tags + free text into one list
  const normTags = [
    ...qlooTags.map((t) => normalise(t.name ?? t)),
    ...freeText.map(normalise),
  ];

  if (normTags.length === 0) {
    trace.push('no tags — returning neutral defaults');
    return {
      intensity: 0.5,
      warmth: 0.5,
      boldness: 0.5,
      texture: 0.5,
      colour_palette: 'neutral',
      hair_vibe: 'natural',
      cultural_tags: [],
      archetypes: ['clean_minimal'],
      trace,
    };
  }

  trace.push(`scoring ${normTags.length} tags`);

  // Affinity weights: Qloo tags carry an affinity; normalise so mean weight = 1.
  // Free-text signals and tags without affinity weigh 1. Identical to unweighted
  // scoring when no tag carries an affinity (or all are equal).
  const rawAff = [
    ...qlooTags.map((t) => affinityOf(t)),
    ...freeText.map(() => null),
  ];
  const known = rawAff.filter((a) => a != null);
  let weights = null;
  if (known.length > 0) {
    const mean = known.reduce((a, b) => a + b, 0) / known.length;
    if (mean > 0) {
      weights = rawAff.map((a) => (a == null ? 1 : a / mean));
      if (weights.every((w) => Math.abs(w - 1) < 1e-9)) weights = null;
      else trace.push(`affinity-weighted (${known.length} tags)`);
    }
  }

  // dimensional scores
  const intensity = scoreDimension(normTags, TAG_SIGNALS.intensity, 'high', 'low', weights);
  const warmth = scoreDimension(normTags, TAG_SIGNALS.warmth, 'warm', 'cool', weights);
  const boldness = scoreDimension(normTags, TAG_SIGNALS.boldness, 'high', 'low', weights);
  const texture = scoreTexture(normTags, weights);

  trace.push(`intensity=${intensity.toFixed(2)} warmth=${warmth.toFixed(2)} boldness=${boldness.toFixed(2)} texture=${texture.toFixed(2)}`);

  // colour palette
  let colour_palette = 'neutral';
  for (const entry of COLOUR_PALETTE_MAP) {
    if (normTags.some((t) => anyMatch(t, entry.keywords))) {
      colour_palette = entry.palette;
      trace.push(`colour_palette=${colour_palette}`);
      break;
    }
  }

  // hair vibe
  let hair_vibe = 'natural';
  for (const entry of HAIR_VIBE_MAP) {
    if (normTags.some((t) => anyMatch(t, entry.keywords))) {
      hair_vibe = entry.vibe;
      trace.push(`hair_vibe=${hair_vibe}`);
      break;
    }
  }

  // archetypes (can match multiple) — sorted by match count so strongest is first
  const archetypeScores = [];
  for (const arch of ARCHETYPE_MAP) {
    const score = normTags.filter((t) => anyMatch(t, arch.keywords)).length;
    if (score > 0) archetypeScores.push({ id: arch.id, score });
  }
  archetypeScores.sort((a, b) => b.score - a.score);
  const archetypes = archetypeScores.map(a => a.id);
  if (archetypes.length === 0) archetypes.push('clean_minimal');
  trace.push(`archetypes=${archetypes.join(',')}`);

  // cultural tags = raw matched tag names from Qloo
  const cultural_tags = qlooTags
    .map((t) => t.name ?? t)
    .filter((name) => {
      const n = normalise(name);
      return ARCHETYPE_MAP.some((a) => anyMatch(n, a.keywords));
    })
    .slice(0, 15);

  return { intensity, warmth, boldness, texture, colour_palette, hair_vibe, cultural_tags, archetypes, trace };
}

/**
 * Return all archetype metadata (for /api/archetypes endpoint).
 */
export function getArchetypes() {
  return ARCHETYPE_MAP.map(({ id, label, keywords }) => ({ id, label, keywords }));
}
