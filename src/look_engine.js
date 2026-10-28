/**
 * Look Engine for MIRRR
 * Ported & expanded from beljour/api/plumb_api/taste/look_engine.py
 *
 * Scores and recommends complete looks (makeup + wig) from an AestheticVector.
 * Looks are weighted toward Black, South Asian, Arab, Latina, Caribbean
 * and East Asian beauty styles — the communities mainstream apps underserve.
 */

// ---------------------------------------------------------------------------
// Look catalogue
// ---------------------------------------------------------------------------

export const LOOKS = [
  {
    id: 'afro_glam_editorial',
    name: 'Afro-Glam Editorial',
    archetype: 'afro_glam',
    description:
      'Rich ochre and burnt-sienna eyeshadow, deep bronze cut crease, full lash, '
      + 'glossy terracotta lip, high-shine skin finish. Crown energy — built for West African '
      + 'editorial, Afrobeats parties, Nollywood.',
    products: [
      { category: 'foundation', shade_range: 'N40–N60', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['burnt sienna', 'ochre', 'deep bronze', 'gold'] },
      { category: 'liner', style: 'graphic wing', colour: 'black' },
      { category: 'lash', style: 'dramatic volume' },
      { category: 'lip', shade: 'terracotta gloss', finish: 'glossy' },
      { category: 'highlight', placement: 'cheekbone + inner corner', finish: 'blinding' },
    ],
    wig_styles: [
      { id: 'afro_coil_big', name: 'Big Afro Coils', texture: 'coily', length: 'medium', colour: 'natural' },
      { id: 'kinky_straight_xl', name: 'Kinky-Straight XL', texture: 'kinky-straight', length: 'long', colour: 'natural-to-honey' },
      { id: 'box_braids_xl', name: 'XL Box Braids', texture: 'braided', length: 'long', colour: 'black-to-burgundy' },
    ],
    weights: {
      intensity: 0.85,
      warmth: 0.80,
      boldness: 0.75,
      texture: 0.65,
    },
    cultural_affinity: ['afrobeats', 'naija', 'ghana', 'nollywood', 'amapiano', 'south africa'],
    tags: ['editorial', 'glam', 'warm', 'bold'],
  },

  {
    id: 'hip_hop_glam',
    name: 'Hip Hop Glam',
    archetype: 'hip_hop_glam',
    description:
      'Icy highlighter, dramatic smoky eye in bronze and black, long lash, nude-to-caramel '
      + 'matte lip, flawless matte-finish base. The aesthetic of Cardi B, Nicki Minaj, '
      + 'and a whole culture of Black women who invented the beauty standard.',
    products: [
      { category: 'foundation', shade_range: 'N20–N60', finish: 'matte', coverage: 'full' },
      { category: 'eyeshadow', tones: ['black', 'deep brown', 'bronze', 'champagne'] },
      { category: 'liner', style: 'extended wing + waterline', colour: 'black' },
      { category: 'lash', style: 'extra-length volume' },
      { category: 'lip', shade: 'nude-caramel matte', finish: 'matte' },
      { category: 'highlight', placement: 'nose + cupids bow + cheekbone', finish: 'icy' },
      { category: 'contour', intensity: 'defined' },
    ],
    wig_styles: [
      { id: 'sleek_bone_straight_xl', name: 'Bone Straight XL', texture: 'straight', length: 'extra-long', colour: 'jet-black' },
      { id: 'body_wave_lace', name: 'Body Wave Lace Front', texture: 'wavy', length: 'long', colour: 'natural-black' },
      { id: 'knotless_jumbo', name: 'Jumbo Knotless Braids', texture: 'braided', length: 'long', colour: 'black-to-caramel' },
    ],
    weights: {
      intensity: 0.90,
      warmth: 0.50,
      boldness: 0.80,
      texture: 0.45,
    },
    cultural_affinity: ['hip-hop', 'hip hop', 'r&b', 'rnb', 'trap', 'rap', 'urban', 'baddie', 'streetwear'],
    tags: ['glam', 'urban', 'bold', 'iconic'],
  },

  {
    id: 'caribbean_carnival',
    name: 'Caribbean Carnival',
    archetype: 'caribbean_carnival',
    description:
      'Sun-kissed bronzed skin, vibrant tropical eyeshadow, glitter cut crease, '
      + 'bold coral or magenta lip, rhinestones, full-glamour lash. '
      + 'Soca-season energy — Trinidad, Barbados, Jamaica, the diaspora.',
    products: [
      { category: 'foundation', shade_range: 'N30–N60', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['electric blue', 'magenta', 'sunshine yellow', 'green', 'coral'] },
      { category: 'liner', style: 'graphic coloured liner', colour: 'vibrant' },
      { category: 'lash', style: 'feather/festival lash' },
      { category: 'glitter', placement: 'cut crease + lower lash + cheekbone', finish: 'chunky glitter' },
      { category: 'lip', shade: 'coral or hot magenta', finish: 'glossy' },
      { category: 'body', bronzer: 'full body shimmer' },
    ],
    wig_styles: [
      { id: 'curly_ombre_caribbean', name: 'Carnival Curls Ombré', texture: 'curly', length: 'medium', colour: 'black-to-gold-ombre' },
      { id: 'loose_wave_highlighted', name: 'Sun-Kissed Loose Waves', texture: 'wavy', length: 'long', colour: 'brunette-to-copper' },
      { id: 'big_chop_coily', name: 'Big Chop Coily', texture: 'coily', length: 'short', colour: 'natural' },
    ],
    weights: {
      intensity: 0.80,
      warmth: 0.90,
      boldness: 0.95,
      texture: 0.90,
    },
    cultural_affinity: ['caribbean', 'jamaican', 'dancehall', 'soca', 'carnival', 'trinidadian', 'reggae'],
    tags: ['festival', 'vibrant', 'warm', 'glitter'],
  },

  {
    id: 'desi_glam',
    name: 'Desi Glam',
    archetype: 'desi_glam',
    description:
      'Deep jewel-tone eyeshadow (emerald, plum, navy), kohl-lined eyes, dramatic lash, '
      + 'matte or glossy deep berry/red lip. Bridal and festive beauty for South Asian women — '
      + 'Bollywood, Punjabi weddings, Diwali, Eid.',
    products: [
      { category: 'foundation', shade_range: 'W10–N50', finish: 'satin', coverage: 'full' },
      { category: 'eyeshadow', tones: ['emerald', 'plum', 'navy', 'gold', 'deep burgundy'] },
      { category: 'liner', style: 'kajal/kohl smudge + dramatic wing', colour: 'black' },
      { category: 'lash', style: 'full dramatic volume' },
      { category: 'bindi', optional: true, stone: 'crystal/tikka' },
      { category: 'lip', shade: 'deep red or berry', finish: 'matte' },
      { category: 'highlight', placement: 'cupids bow + nose bridge + collarbone' },
    ],
    wig_styles: [
      { id: 'long_straight_black', name: 'Long Silky Straight', texture: 'straight', length: 'extra-long', colour: 'jet-black' },
      { id: 'long_wavy_indian', name: 'Indian Wave', texture: 'wavy', length: 'long', colour: 'natural-black' },
      { id: 'bun_slick', name: 'Sleek High Bun', texture: 'straight', length: 'updo', colour: 'black' },
    ],
    weights: {
      intensity: 0.80,
      warmth: 0.85,
      boldness: 0.70,
      texture: 0.55,
    },
    cultural_affinity: ['bollywood', 'desi', 'south asian', 'indian', 'bengali', 'pakistani', 'punjabi', 'tamil'],
    tags: ['jewel-tones', 'bridal', 'festive', 'warm'],
  },

  {
    id: 'gulf_glam',
    name: 'Gulf Glam',
    archetype: 'gulf_glam',
    description:
      'Flawless porcelain-to-olive base, smouldering smoky kohl eye, champagne/gold shadow, '
      + 'lush lash, nude-to-blush glossy lip. Gold-and-pearl aesthetic of Khaleeji, Levantine, '
      + 'and Persian beauty — Dubai, Riyadh, Tehran, Beirut.',
    products: [
      { category: 'foundation', shade_range: 'C10–N40', finish: 'luminous', coverage: 'full-buildable' },
      { category: 'eyeshadow', tones: ['champagne', 'gold', 'bronze', 'deep brown', 'black'] },
      { category: 'liner', style: 'kohl rimmed inner + outer + dramatic wing', colour: 'black kohl' },
      { category: 'lash', style: 'ultra-volume or mink' },
      { category: 'lip', shade: 'nude-rose or blush gloss', finish: 'glossy' },
      { category: 'highlight', placement: 'global glow', finish: 'pearl' },
      { category: 'brow', style: 'full arched defined' },
    ],
    wig_styles: [
      { id: 'long_silky_khaleeji', name: 'Khaleeji Silky Blow-Out', texture: 'straight', length: 'extra-long', colour: 'jet-black-to-espresso' },
      { id: 'voluminous_blowout', name: 'Voluminous Blow-Out', texture: 'straight-to-wave', length: 'long', colour: 'brunette' },
      { id: 'sleek_low_chignon', name: 'Sleek Low Chignon', texture: 'straight', length: 'updo', colour: 'black' },
    ],
    weights: {
      intensity: 0.75,
      warmth: 0.70,
      boldness: 0.55,
      texture: 0.80,
    },
    cultural_affinity: ['middle east', 'arab', 'gulf', 'khaleeji', 'persian', 'arabic', 'dubai', 'levant', 'turkish'],
    tags: ['luxury', 'kohl', 'gold', 'glossy'],
  },

  {
    id: 'latina_glam',
    name: 'Latina Glam',
    archetype: 'latina_glam',
    description:
      'Bronzed glow base, warm terracotta or copper eyeshadow, defined cat-eye, '
      + 'lush lash, bold red or coral lip. The beauty of JLo, Bad Bunny-era aesthetics, '
      + 'reggaeton video glamour — Mexico, Colombia, Puerto Rico, DR, Cuba.',
    products: [
      { category: 'foundation', shade_range: 'W20–N50', finish: 'luminous', coverage: 'medium-full' },
      { category: 'eyeshadow', tones: ['terracotta', 'copper', 'rose gold', 'burnt orange'] },
      { category: 'liner', style: 'cat-eye wing', colour: 'black or brown' },
      { category: 'lash', style: 'full volume' },
      { category: 'bronzer', placement: 'sun-kiss placement' },
      { category: 'lip', shade: 'bold red or coral-orange', finish: 'matte or satin' },
      { category: 'highlight', placement: 'C-zone + cheekbone', finish: 'bronze shimmer' },
    ],
    wig_styles: [
      { id: 'long_body_wave_latina', name: 'Body Wave Volume', texture: 'wavy', length: 'long', colour: 'brunette-to-caramel' },
      { id: 'sleek_straight_voluminous', name: 'Voluminous Straight', texture: 'straight', length: 'long', colour: 'dark-brunette' },
      { id: 'curly_natural_latina', name: 'Natural Curl Pattern', texture: 'curly', length: 'medium', colour: 'natural-brunette' },
    ],
    weights: {
      intensity: 0.75,
      warmth: 0.85,
      boldness: 0.70,
      texture: 0.60,
    },
    cultural_affinity: ['latin', 'latina', 'reggaeton', 'salsa', 'cumbia', 'mexican', 'colombian', 'brazilian', 'puerto rican'],
    tags: ['bronzed', 'warm', 'bold-lip', 'vibrant'],
  },

  {
    id: 'k_beauty_glass',
    name: 'K-Beauty Glass Skin',
    archetype: 'k_beauty',
    description:
      'Porcelain glass-skin base, soft gradient (ombre) lip, monolid-friendly eye techniques, '
      + 'straight brows, ultra-dewy finish, no-makeup makeup with dimension. '
      + 'Seoul-standard beauty — K-pop idol clean, Hallyu global.',
    products: [
      { category: 'foundation', shade_range: 'C10–N20', finish: 'glass/dewy', coverage: 'light-medium' },
      { category: 'eyeshadow', tones: ['champagne', 'soft pink', 'peach', 'matte brown', 'white shimmer'] },
      { category: 'liner', style: 'thin subtle wing or none', colour: 'brown or black' },
      { category: 'lash', style: 'natural flutter' },
      { category: 'lip', shade: 'ombre berry-to-nude or coral gradient', finish: 'jelly gloss' },
      { category: 'brow', style: 'straight soft brow' },
      { category: 'skincare_base', steps: ['essence', 'serum', 'cushion', 'setting mist'] },
    ],
    wig_styles: [
      { id: 'straight_sleek_bob', name: 'Sleek Straight Bob', texture: 'straight', length: 'bob', colour: 'jet-black' },
      { id: 'straight_xl_black', name: 'Idol Long Straight', texture: 'straight', length: 'long', colour: 'jet-black' },
      { id: 'straight_curtain_bangs', name: 'Curtain Bangs Straight', texture: 'straight', length: 'medium', colour: 'black-to-dark-brown' },
    ],
    weights: {
      intensity: 0.35,
      warmth: 0.25,
      boldness: 0.25,
      texture: 0.90,
    },
    cultural_affinity: ['k-pop', 'k-beauty', 'korean', 'seoul', 'idol', 'hallyu', 'kpop'],
    tags: ['glass-skin', 'dewy', 'clean', 'cool'],
  },

  {
    id: 'clean_minimal',
    name: 'Clean Minimal',
    archetype: 'clean_minimal',
    description:
      'Skin-first, product-less, effortless. Tinted moisturiser, subtle mascara, '
      + 'clear gloss, defined brow. Works for every skin tone — the canvas everything else is built on.',
    products: [
      { category: 'foundation', shade_range: 'all', finish: 'natural', coverage: 'light' },
      { category: 'mascara', style: 'natural lengthening' },
      { category: 'lip', shade: 'clear or your-lips-but-better', finish: 'glossy' },
      { category: 'brow', style: 'groomed natural' },
    ],
    wig_styles: [
      { id: 'natural_texture', name: 'Your Natural Texture', texture: 'natural', length: 'your-length', colour: 'your-colour' },
      { id: 'simple_straight', name: 'Simple Straight', texture: 'straight', length: 'medium', colour: 'natural' },
    ],
    weights: {
      intensity: 0.10,
      warmth: 0.50,
      boldness: 0.10,
      texture: 0.30,
    },
    cultural_affinity: ['natural', 'clean', 'minimalist', 'no-makeup'],
    tags: ['natural', 'minimal', 'effortless'],
  },
];

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Score a look against an aesthetic vector.
 *
 * @param {object} look       — a LOOKS entry
 * @param {import('./aesthetic.js').AestheticVector} vec
 * @returns {number} 0–1
 */
export function scoreLook(look, vec) {
  const w = look.weights;
  const dims = {
    intensity: 1 - Math.abs(vec.intensity - w.intensity),
    warmth: 1 - Math.abs(vec.warmth - w.warmth),
    boldness: 1 - Math.abs(vec.boldness - w.boldness),
    texture: 1 - Math.abs(vec.texture - w.texture),
  };

  // weighted average (all equal weight for now)
  const base = (dims.intensity + dims.warmth + dims.boldness + dims.texture) / 4;

  // archetype affinity bonus
  const archetypeBonus = vec.archetypes.includes(look.archetype) ? 0.15 : 0;

  // cultural tag overlap bonus
  const normCulture = look.cultural_affinity.map((s) => s.toLowerCase());
  const culturalMatches = vec.cultural_tags.filter((t) =>
    normCulture.some((c) => t.toLowerCase().includes(c) || c.includes(t.toLowerCase()))
  ).length;
  const culturalBonus = Math.min(0.10, culturalMatches * 0.03);

  return Math.min(1, base + archetypeBonus + culturalBonus);
}

/**
 * Recommend the top looks for a given aesthetic vector.
 *
 * @param {import('./aesthetic.js').AestheticVector} vec
 * @param {object} [options]
 * @param {number} [options.topN]     — number of looks to return
 * @param {number} [options.minScore] — minimum score threshold
 * @returns {Array<{look: object, score: number, wigStyle: object}>}
 */
export function recommendLooks(vec, { topN = 3, minScore = 0.2 } = {}) {
  const scored = LOOKS.map((look) => ({
    look,
    score: scoreLook(look, vec),
  }))
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  // pick best wig style for each recommended look
  return scored.map(({ look, score }) => {
    const wigStyle = pickWig(look, vec);
    return { look, score: Math.round(score * 100) / 100, wigStyle };
  });
}

/**
 * Pick the most suitable wig style from a look's options.
 * Currently picks first style — future: score against hair_vibe.
 *
 * @param {object} look
 * @param {import('./aesthetic.js').AestheticVector} vec
 * @returns {object}
 */
function pickWig(look, vec) {
  if (!look.wig_styles?.length) return null;
  // prefer a wig style whose texture matches hair_vibe
  const vibeMap = {
    'natural-afro': 'coily',
    'long-sleek-wig': 'straight',
    'straight-sleek': 'straight',
    'long-wavy-indian': 'wavy',
    'curly-ombre': 'curly',
    'long-silky': 'straight',
    natural: null,
  };
  const targetTexture = vibeMap[vec.hair_vibe];
  const match = look.wig_styles.find((w) => w.texture === targetTexture);
  return match ?? look.wig_styles[0];
}
