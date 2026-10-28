/**
 * MIRRR Wig Matchmaker
 *
 * Standalone wig recommendation engine. Takes hair texture, length preference,
 * colour preference, and the aesthetic vector to return a curated wig shortlist.
 *
 * Wigs are a cornerstone of beauty for Black, South Asian, Arab, and Caribbean
 * women — yet they're an afterthought in most beauty apps. MIRRR leads with them.
 */

// ---------------------------------------------------------------------------
// Wig catalogue
// ---------------------------------------------------------------------------

export const WIG_CATALOGUE = [
  // ── Natural / Afro textures ──────────────────────────────────────────────
  {
    id: 'kinky_coily_afro',
    name: 'Kinky Coily Afro',
    texture: 'kinky-coily',
    length: 'short-medium',
    colours: ['natural-black', 'dark-brown'],
    finish: 'natural',
    archetype_fit: ['afro_glam', 'hip_hop_glam'],
    communities: ['west_african', 'east_african', 'black_american'],
    hair_vibe_match: ['natural-afro'],
    tags: ['protective', 'natural', 'low-maintenance'],
    description: 'Defined coils and full volume — your crown, amplified.',
  },
  {
    id: 'twist_out_natural',
    name: 'Twist-Out Natural',
    texture: 'kinky-curly',
    length: 'medium',
    colours: ['natural-black', 'dark-brown', 'honey-brown'],
    finish: 'natural',
    archetype_fit: ['afro_glam', 'clean_minimal'],
    communities: ['west_african', 'black_american', 'caribbean'],
    hair_vibe_match: ['natural-afro'],
    tags: ['protective', 'versatile', 'natural'],
    description: 'Juicy twist-out coils with definition and bounce.',
  },
  {
    id: 'big_chop_fro',
    name: 'Big Chop Fro',
    texture: 'kinky',
    length: 'short',
    colours: ['natural-black', 'dark-brown'],
    finish: 'natural',
    archetype_fit: ['afro_glam', 'clean_minimal'],
    communities: ['west_african', 'east_african', 'black_american'],
    hair_vibe_match: ['natural-afro'],
    tags: ['statement', 'editorial', 'low-maintenance'],
    description: 'Short, full, and unapologetically you.',
  },

  // ── Sleek / Straight ─────────────────────────────────────────────────────
  {
    id: 'bone_straight_long',
    name: 'Bone Straight (Long)',
    texture: 'straight',
    length: 'long',
    colours: ['jet-black', 'natural-black', 'dark-brown', 'warm-brown'],
    finish: 'silky',
    archetype_fit: ['hip_hop_glam', 'gulf_glam', 'clean_minimal'],
    communities: ['black_american', 'arab', 'latina', 'east_asian'],
    hair_vibe_match: ['long-sleek-wig', 'straight-sleek', 'long-silky'],
    tags: ['sleek', 'versatile', 'high-gloss'],
    description: 'Pin-straight, glass-smooth, endless length.',
  },
  {
    id: 'sleek_bob',
    name: 'Sleek Bob',
    texture: 'straight',
    length: 'bob',
    colours: ['jet-black', 'natural-black', 'warm-brown', 'burgundy'],
    finish: 'silky',
    archetype_fit: ['k_beauty_glass', 'clean_minimal', 'hip_hop_glam'],
    communities: ['east_asian', 'southeast_asian', 'black_american'],
    hair_vibe_match: ['straight-sleek', 'long-sleek-wig'],
    tags: ['chic', 'editorial', 'low-maintenance'],
    description: 'The Korean chic bob — sharp, sleek, effortlessly modern.',
  },
  {
    id: 'blunt_lob',
    name: 'Blunt Lob (Long Bob)',
    texture: 'straight',
    length: 'lob',
    colours: ['natural-black', 'dark-brown', 'honey-brown', 'ash-brown'],
    finish: 'silky',
    archetype_fit: ['k_beauty_glass', 'gulf_glam', 'clean_minimal'],
    communities: ['east_asian', 'arab', 'southeast_asian'],
    hair_vibe_match: ['straight-sleek', 'long-silky'],
    tags: ['minimalist', 'versatile', 'glass-skin compatible'],
    description: 'Blunt ends, mid-length, the understated power cut.',
  },

  // ── Wavy / Indian Remy ──────────────────────────────────────────────────
  {
    id: 'indian_remy_wavy',
    name: 'Indian Remy Wavy (Long)',
    texture: 'wavy',
    length: 'long',
    colours: ['jet-black', 'natural-black', 'dark-brown'],
    finish: 'silky',
    archetype_fit: ['desi_glam', 'gulf_glam', 'latina_glam'],
    communities: ['south_asian', 'arab', 'latina'],
    hair_vibe_match: ['long-wavy-indian', 'long-silky'],
    tags: ['bridal', 'luxe', 'traditional-modern'],
    description: 'Full, flowing waves in authentic Indian Remy texture — wedding-ready.',
  },
  {
    id: 'beach_wave_medium',
    name: 'Beach Wave (Medium)',
    texture: 'wavy',
    length: 'medium',
    colours: ['natural-black', 'dark-brown', 'honey-brown', 'golden-blonde'],
    finish: 'natural',
    archetype_fit: ['latina_glam', 'clean_minimal', 'desi_glam'],
    communities: ['latina', 'south_asian', 'mixed'],
    hair_vibe_match: ['long-wavy-indian', 'curly-ombre'],
    tags: ['effortless', 'versatile', 'everyday'],
    description: 'Relaxed, sun-kissed waves — effortless and always pretty.',
  },

  // ── Curly / Ombré ────────────────────────────────────────────────────────
  {
    id: 'curly_ombre_carnival',
    name: 'Curly Ombré',
    texture: 'curly',
    length: 'long',
    colours: ['black-to-honey', 'brown-to-caramel', 'black-to-auburn'],
    finish: 'natural',
    archetype_fit: ['caribbean_carnival', 'latina_glam', 'hip_hop_glam'],
    communities: ['caribbean', 'latina', 'black_american'],
    hair_vibe_match: ['curly-ombre'],
    tags: ['festival', 'statement', 'colour'],
    description: 'Defined curls graduating into sun-kissed colour — festival gold.',
  },
  {
    id: 'deep_wave_body',
    name: 'Deep Wave Body',
    texture: 'deep-wave',
    length: 'long',
    colours: ['natural-black', 'dark-brown', 'burgundy'],
    finish: 'silky',
    archetype_fit: ['hip_hop_glam', 'afro_glam', 'latina_glam'],
    communities: ['black_american', 'caribbean', 'latina'],
    hair_vibe_match: ['long-sleek-wig', 'curly-ombre'],
    tags: ['glam', 'voluminous', 'versatile'],
    description: 'Lush, deep-wave texture with serious body and movement.',
  },

  // ── Gulf / Luxe Silky ────────────────────────────────────────────────────
  {
    id: 'ultra_silky_long',
    name: 'Ultra Silky (Long)',
    texture: 'silky-straight',
    length: 'extra-long',
    colours: ['jet-black', 'natural-black', 'warm-brown'],
    finish: 'mirror-gloss',
    archetype_fit: ['gulf_glam', 'desi_glam', 'hip_hop_glam'],
    communities: ['arab', 'south_asian', 'east_asian'],
    hair_vibe_match: ['long-silky', 'long-wavy-indian'],
    tags: ['luxe', 'statement', 'bridal'],
    description: 'Mirror-gloss silk, floor-grazing length — Gulf luxury defined.',
  },
  {
    id: 'layered_silk_curtain',
    name: 'Curtain-Bang Silk Layers',
    texture: 'straight',
    length: 'long',
    colours: ['natural-black', 'dark-brown', 'ash-brown'],
    finish: 'silky',
    archetype_fit: ['gulf_glam', 'k_beauty_glass', 'clean_minimal'],
    communities: ['arab', 'east_asian', 'southeast_asian'],
    hair_vibe_match: ['long-silky', 'straight-sleek'],
    tags: ['editorial', 'face-framing', 'K-beauty compatible'],
    description: 'Curtain bangs with long silk layers — the sophisticated K-beauty update.',
  },

  // ── Protective / Braided ─────────────────────────────────────────────────
  {
    id: 'knotless_braids',
    name: 'Knotless Box Braids',
    texture: 'braided',
    length: 'long',
    colours: ['natural-black', 'dark-brown', 'honey-brown', 'blonde'],
    finish: 'matte',
    archetype_fit: ['afro_glam', 'hip_hop_glam', 'caribbean_carnival'],
    communities: ['west_african', 'black_american', 'caribbean'],
    hair_vibe_match: ['natural-afro'],
    tags: ['protective', 'versatile', 'cultural'],
    description: 'Tension-free knotless braids — traditional roots, modern wear.',
  },

  // ── Glass Skin / K-Beauty ─────────────────────────────────────────────────
  {
    id: 'kpop_idol_straight',
    name: 'K-Pop Idol Straight',
    texture: 'straight',
    length: 'long',
    colours: ['jet-black', 'dark-brown', 'ash-brown', 'silver-black'],
    finish: 'silky',
    archetype_fit: ['k_beauty_glass', 'clean_minimal'],
    communities: ['east_asian', 'southeast_asian'],
    hair_vibe_match: ['straight-sleek', 'long-silky'],
    tags: ['glass-skin', 'K-pop', 'idol-ready'],
    description: 'Idol-perfect straight hair — zero frizz, maximum luminance.',
  },
];

// ---------------------------------------------------------------------------
// Wig Matchmaker API
// ---------------------------------------------------------------------------

/**
 * Recommend wigs based on aesthetic vector + explicit preferences.
 *
 * @param {object} opts
 * @param {object} opts.aesthetic       - aesthetic vector from buildAestheticVector()
 * @param {string} opts.communityId     - from cultural DNA quiz
 * @param {string} opts.lengthPref      - 'short' | 'bob' | 'lob' | 'medium' | 'long' | 'extra-long' | 'any'
 * @param {string} opts.texturePref     - 'straight' | 'wavy' | 'curly' | 'kinky' | 'braided' | 'any'
 * @param {number} opts.topN
 * @returns {{ wig: object, score: number, reason: string }[]}
 */
export function matchWigs({ aesthetic = {}, communityId = 'mixed', lengthPref = 'any', texturePref = 'any', topN = 4 }) {
  const hairVibe = aesthetic.hair_vibe ?? 'natural';

  return WIG_CATALOGUE
    .map(wig => {
      let score = 0;

      // Hair vibe match (primary signal)
      if (wig.hair_vibe_match.includes(hairVibe)) score += 0.40;

      // Community match
      if (wig.communities.includes(communityId)) score += 0.25;

      // Archetype match
      if (aesthetic.archetypes?.some(a => wig.archetype_fit.includes(a))) score += 0.20;

      // User preferences
      if (lengthPref !== 'any' && wig.length === lengthPref) score += 0.10;
      if (texturePref !== 'any' && wig.texture.includes(texturePref)) score += 0.05;

      const reason = buildReason(wig, hairVibe, communityId, aesthetic);
      return { wig, score: Math.min(1, score), reason };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

function buildReason(wig, hairVibe, communityId, aesthetic) {
  const parts = [];
  if (wig.hair_vibe_match.includes(hairVibe)) parts.push(`matches your ${hairVibe.replace(/-/g, ' ')} vibe`);
  if (wig.communities.includes(communityId)) parts.push('common in your community');
  if (aesthetic.archetypes?.some(a => wig.archetype_fit.includes(a))) {
    parts.push(`pairs with ${wig.archetype_fit[0].replace(/_/g, ' ')} look`);
  }
  return parts.slice(0, 2).join(' · ') || 'versatile choice';
}

/**
 * Get available length options for the wig preferences UI.
 */
export function getWigLengths() {
  return [
    { id: 'any',        label: 'Any length' },
    { id: 'short',      label: 'Short' },
    { id: 'bob',        label: 'Bob' },
    { id: 'lob',        label: 'Lob (long bob)' },
    { id: 'medium',     label: 'Medium' },
    { id: 'long',       label: 'Long' },
    { id: 'extra-long', label: 'Extra long' },
  ];
}

/**
 * Get available texture options for the wig preferences UI.
 */
export function getWigTextures() {
  return [
    { id: 'any',     label: 'Any texture' },
    { id: 'straight', label: 'Straight / Silky' },
    { id: 'wavy',    label: 'Wavy' },
    { id: 'curly',   label: 'Curly' },
    { id: 'kinky',   label: 'Kinky / Natural' },
    { id: 'braided', label: 'Braided / Protective' },
  ];
}

/**
 * Full catalogue for browsing UI.
 */
export function getWigCatalogue() {
  return WIG_CATALOGUE;
}
