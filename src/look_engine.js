/**
 * MIRRR Look Engine
 *
 * 25-look catalogue covering multicultural beauty in full depth:
 * West African editorial, Caribbean Carnival, Bollywood bridal, Gulf Glam,
 * K-Beauty glass skin, Amapiano beat, Afro-punk, Latina glam, Arab chic,
 * HBCU homecoming, Desi festive, J-Beauty, Southeast Asian glow,
 * Ethiopian jewel, South African Zulu bridal, mixed-heritage luminous,
 * Black American baddie, natural clean, and more.
 *
 * Most beauty apps have 5-8 looks. MIRRR has 25.
 */

export const LOOKS = [

  // ─────────────────────────────────────────────────────────────────────────
  // WEST AFRICAN / AFROBEATS
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'afro_glam_editorial',
    name: 'Afro-Glam Editorial',
    archetype: 'afro_glam',
    description:
      'Rich ochre and burnt-sienna eyeshadow, deep bronze cut crease, full drama lash, '
      + 'glossy terracotta lip, blinding cheekbone highlight. Crown energy — built for '
      + 'West African editorial, Afrobeats concerts, Nollywood red carpets.',
    products: [
      { category: 'foundation', shade_range: 'N40–N60', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['burnt sienna', 'ochre', 'deep bronze', 'gold'] },
      { category: 'liner', style: 'graphic wing', colour: 'black' },
      { category: 'lash', style: 'dramatic volume' },
      { category: 'lip', shade: 'terracotta gloss', finish: 'glossy' },
      { category: 'highlight', placement: 'cheekbone + inner corner', finish: 'blinding-gold' },
    ],
    wig_styles: [
      { id: 'kinky_coily_afro', name: 'Kinky Coily Afro' },
      { id: 'knotless_box_braids', name: 'Knotless Box Braids' },
      { id: 'faux_locs', name: 'Faux Locs' },
    ],
    weights: { intensity: 0.87, warmth: 0.80, boldness: 0.80, texture: 0.65 },
    cultural_affinity: ['afrobeats', 'naija', 'ghana', 'nollywood', 'lagos', 'accra'],
    tags: ['editorial', 'glam', 'warm', 'bold'],
  },

  {
    id: 'afropunk_edge',
    name: 'Afro-Punk Edge',
    archetype: 'afro_glam',
    description:
      'Graphic cut crease in deep indigo or forest green, bold geometric liner art, '
      + 'black matte lip or electric red, blinding highlight. Where Afrocentric meets punk '
      + 'avant-garde — Brooklyn, London, Lagos.',
    products: [
      { category: 'foundation', shade_range: 'N30–N60', finish: 'matte-satin', coverage: 'full' },
      { category: 'eyeshadow', tones: ['indigo', 'forest green', 'black', 'deep purple'] },
      { category: 'liner', style: 'graphic geometric art', colour: 'black or coloured' },
      { category: 'lash', style: 'spiked or feather lash' },
      { category: 'lip', shade: 'black or electric red', finish: 'matte' },
      { category: 'highlight', placement: 'nose + orbital bone', finish: 'blinding' },
    ],
    wig_styles: [
      { id: 'big_chop_fro', name: 'Big Chop Fro' },
      { id: 'coloured_wig', name: 'Bold Colour' },
      { id: 'butterfly_locs', name: 'Butterfly Locs' },
    ],
    weights: { intensity: 0.95, warmth: 0.30, boldness: 0.98, texture: 0.55 },
    cultural_affinity: ['afropunk', 'afrobeats', 'naija', 'nigerian', 'punk', 'alternative', 'avant-garde'],
    tags: ['editorial', 'bold', 'graphic', 'punk'],
  },

  {
    id: 'amapiano_beat',
    name: 'Amapiano Beat',
    archetype: 'amapiano_beat',
    description:
      'Sun-bronzed glowing skin, smoky brown-gold eye, glossy caramel lip, '
      + 'dewy finish. South African house music aesthetic — Joburg, Pretoria, Soweto clubs.',
    products: [
      { category: 'foundation', shade_range: 'N35–N60', finish: 'luminous', coverage: 'medium-full' },
      { category: 'eyeshadow', tones: ['deep brown', 'gold shimmer', 'copper', 'black smoke'] },
      { category: 'liner', style: 'smudged kohl', colour: 'black' },
      { category: 'lash', style: 'full volume' },
      { category: 'bronzer', placement: 'sun-kiss', finish: 'warm glow' },
      { category: 'lip', shade: 'caramel gloss', finish: 'glossy' },
    ],
    wig_styles: [
      { id: 'twist_out_natural', name: 'Twist-Out Natural' },
      { id: 'kinky_coily_afro', name: 'Kinky Coily Afro' },
      { id: 'bone_straight_long', name: 'Bone Straight Long' },
    ],
    weights: { intensity: 0.78, warmth: 0.85, boldness: 0.72, texture: 0.60 },
    cultural_affinity: ['amapiano', 'south african', 'afro house', 'gqom', 'joburg', 'zulu'],
    tags: ['glow', 'warm', 'club-ready', 'bronzed'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BLACK AMERICAN / HIP HOP
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'hip_hop_glam',
    name: 'Hip Hop Glam',
    archetype: 'hip_hop_glam',
    description:
      'Icy highlighter, dramatic smoky bronze-and-black eye, extra-length lash, '
      + 'nude-to-caramel matte lip, flawless full-coverage matte base. '
      + 'Cardi B, Nicki Minaj, the culture that invented the beauty standard.',
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
      { id: 'bone_straight_long', name: 'Bone Straight' },
      { id: 'knotless_box_braids', name: 'Knotless Box Braids' },
      { id: 'high_pony_sleek', name: 'High Sleek Ponytail' },
    ],
    weights: { intensity: 0.90, warmth: 0.50, boldness: 0.85, texture: 0.45 },
    cultural_affinity: ['hip-hop', 'r&b', 'trap', 'rap', 'urban', 'baddie', 'streetwear'],
    tags: ['glam', 'urban', 'bold', 'iconic'],
  },

  {
    id: 'hbcu_homecoming',
    name: 'HBCU Homecoming',
    archetype: 'hip_hop_glam',
    description:
      'Warm bronze cut crease, full-glam lash, bold wine or coral lip, dewy luminous skin, '
      + 'detailed brow. The energy of Howard and Spelman homecoming — "we out here."',
    products: [
      { category: 'foundation', shade_range: 'N20–N55', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['bronze', 'copper', 'warm brown', 'champagne'] },
      { category: 'liner', style: 'defined wing', colour: 'black' },
      { category: 'lash', style: 'full glam' },
      { category: 'lip', shade: 'wine or bold coral', finish: 'satin' },
      { category: 'brow', style: 'full, defined, arched' },
    ],
    wig_styles: [
      { id: 'bone_straight_long', name: 'Bone Straight' },
      { id: 'silk_press_natural', name: 'Silk Press' },
      { id: 'knotless_box_braids', name: 'Knotless Box Braids' },
    ],
    weights: { intensity: 0.82, warmth: 0.75, boldness: 0.80, texture: 0.55 },
    cultural_affinity: ['hbcu', 'black american', 'sorority', 'homecoming', 'black college', 'step show'],
    tags: ['festive', 'warm', 'glam', 'school-spirit'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CARIBBEAN
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'caribbean_carnival',
    name: 'Caribbean Carnival',
    archetype: 'caribbean_carnival',
    description:
      'Sun-kissed bronzed skin, vibrant tropical eyeshadow, glitter cut crease, '
      + 'bold coral or magenta lip, rhinestones, feather lash. '
      + 'Soca-season energy — Trinidad, Barbados, Jamaica, the diaspora.',
    products: [
      { category: 'foundation', shade_range: 'N30–N60', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['electric blue', 'magenta', 'sunshine yellow', 'green', 'coral'] },
      { category: 'liner', style: 'graphic coloured liner' },
      { category: 'lash', style: 'feather/festival lash' },
      { category: 'glitter', placement: 'cut crease + lower lash + cheekbone' },
      { category: 'lip', shade: 'coral or hot magenta', finish: 'glossy' },
      { category: 'body', bronzer: 'full body shimmer' },
    ],
    wig_styles: [
      { id: 'curly_ombre', name: 'Curly Ombré' },
      { id: 'water_wave', name: 'Water Wave' },
      { id: 'butterfly_locs', name: 'Butterfly Locs' },
    ],
    weights: { intensity: 0.80, warmth: 0.90, boldness: 0.97, texture: 0.92 },
    cultural_affinity: ['caribbean', 'jamaican', 'dancehall', 'soca', 'carnival', 'trinidadian', 'reggae', 'bacchanal'],
    tags: ['festival', 'vibrant', 'warm', 'glitter', 'carnival'],
  },

  {
    id: 'dancehall_queen',
    name: 'Dancehall Queen',
    archetype: 'caribbean_carnival',
    description:
      'Chrome or holographic eye, ultra-glossy lip in hot pink or orange, '
      + 'blinding body shimmer, dramatic overlined eye, jewel body art. '
      + 'Kingston energy — bold, sexy, unapologetic.',
    products: [
      { category: 'foundation', shade_range: 'N25–N60', finish: 'dewy', coverage: 'full' },
      { category: 'eyeshadow', tones: ['chrome', 'holographic', 'hot pink', 'electric blue'] },
      { category: 'liner', style: 'overlined dramatic', colour: 'black + coloured' },
      { category: 'lash', style: 'mega-glam' },
      { category: 'lip', shade: 'hot pink or orange', finish: 'glossy' },
      { category: 'body', shimmer: 'holographic full body' },
    ],
    wig_styles: [
      { id: 'coloured_wig', name: 'Bold Colour' },
      { id: 'curly_ombre', name: 'Curly Ombré' },
      { id: 'high_pony_sleek', name: 'High Sleek Ponytail' },
    ],
    weights: { intensity: 0.92, warmth: 0.80, boldness: 0.99, texture: 0.85 },
    cultural_affinity: ['dancehall', 'jamaican', 'caribbean', 'soca', 'reggaeton'],
    tags: ['bold', 'chrome', 'festival', 'sexy'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SOUTH ASIAN
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'bollywood_bridal',
    name: 'Bollywood Bridal',
    archetype: 'bollywood_bridal',
    description:
      'Deep jewel-tone eyeshadow (emerald, plum, navy), kohl-lined eyes, dramatic lash, '
      + 'matte deep berry or red lip. Bridal and festive beauty for South Asian women — '
      + 'Punjabi weddings, Diwali, Eid, Navratri, Bollywood.',
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
      { id: 'indian_remy_wavy', name: 'Indian Remy Wavy' },
      { id: 'bollywood_blowout', name: 'Bollywood Blowout Waves' },
      { id: 'slicked_bun', name: 'Sleek Bun' },
    ],
    weights: { intensity: 0.83, warmth: 0.85, boldness: 0.75, texture: 0.60 },
    cultural_affinity: ['bollywood', 'desi', 'south asian', 'indian', 'bengali', 'pakistani', 'punjabi', 'tamil', 'sri lankan'],
    tags: ['jewel-tones', 'bridal', 'festive', 'warm'],
  },

  {
    id: 'desi_everyday_chic',
    name: 'Desi Everyday Chic',
    archetype: 'bollywood_bridal',
    description:
      'Olive-corrected glowing base, subtle golden eye with kohl, groomed brows, '
      + 'nude-pink or terracotta lip. Modern South Asian beauty for college, work, weekends — '
      + 'clean but rooted.',
    products: [
      { category: 'foundation', shade_range: 'W10–N40', finish: 'natural', coverage: 'medium' },
      { category: 'eyeshadow', tones: ['gold shimmer', 'warm brown', 'champagne'] },
      { category: 'liner', style: 'kohl waterline', colour: 'black' },
      { category: 'lip', shade: 'nude-pink or terracotta', finish: 'satin' },
      { category: 'brow', style: 'full natural defined' },
    ],
    wig_styles: [
      { id: 'indian_remy_wavy', name: 'Indian Remy Wavy' },
      { id: 'beach_wave_medium', name: 'Beach Wave' },
      { id: 'slicked_bun', name: 'Sleek Bun' },
    ],
    weights: { intensity: 0.50, warmth: 0.80, boldness: 0.45, texture: 0.55 },
    cultural_affinity: ['desi', 'south asian', 'indian', 'pakistani', 'bangladeshi', 'nepali'],
    tags: ['everyday', 'warm', 'natural', 'modern'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ARAB / MIDDLE EAST
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'gulf_glam',
    name: 'Gulf Glam',
    archetype: 'gulf_glam',
    description:
      'Flawless luminous base, smouldering smoky kohl eye, champagne-gold shadow, '
      + 'lush lash, nude-to-blush glossy lip, global pearl highlight. '
      + 'Gold-and-pearl aesthetic of Khaleeji, Persian, and Levantine beauty — '
      + 'Dubai, Riyadh, Tehran, Beirut.',
    products: [
      { category: 'foundation', shade_range: 'C10–N40', finish: 'luminous', coverage: 'full-buildable' },
      { category: 'eyeshadow', tones: ['champagne', 'gold', 'bronze', 'deep brown', 'black'] },
      { category: 'liner', style: 'kohl rimmed inner + outer + wing', colour: 'black kohl' },
      { category: 'lash', style: 'ultra-volume or mink' },
      { category: 'lip', shade: 'nude-rose or blush gloss', finish: 'glossy' },
      { category: 'highlight', placement: 'global glow', finish: 'pearl' },
      { category: 'brow', style: 'full arched defined' },
    ],
    wig_styles: [
      { id: 'khaleeji_blowout', name: 'Khaleeji Blow-Out' },
      { id: 'ultra_silky_xl', name: 'Ultra Silky XL' },
      { id: 'curtain_bang_layers', name: 'Curtain-Bang Layers' },
    ],
    weights: { intensity: 0.77, warmth: 0.68, boldness: 0.58, texture: 0.82 },
    cultural_affinity: ['middle east', 'arab', 'gulf', 'khaleeji', 'persian', 'arabic', 'dubai', 'levant', 'turkish'],
    tags: ['luxury', 'kohl', 'gold', 'glossy', 'elegant'],
  },

  {
    id: 'arab_chic',
    name: 'Arab Chic (Modern)',
    archetype: 'gulf_glam',
    description:
      'Dewy glass skin, soft taupe smoky eye, precise brushed brows, '
      + 'your-lips-but-better gloss, minimal shimmer. The modern Arab beauty influencer — '
      + 'Cairo, Amman, Dubai, Casablanca.',
    products: [
      { category: 'foundation', shade_range: 'C05–N35', finish: 'glass-dewy', coverage: 'medium' },
      { category: 'eyeshadow', tones: ['taupe', 'warm brown', 'champagne', 'vanilla'] },
      { category: 'liner', style: 'tight-line + thin flick', colour: 'dark brown' },
      { category: 'lash', style: 'fluffy natural' },
      { category: 'lip', shade: 'your-lips-but-better nude', finish: 'glossy' },
      { category: 'brow', style: 'brushed defined' },
    ],
    wig_styles: [
      { id: 'bone_straight_long', name: 'Bone Straight' },
      { id: 'curtain_bang_layers', name: 'Curtain-Bang Layers' },
      { id: 'blunt_lob', name: 'Blunt Lob' },
    ],
    weights: { intensity: 0.52, warmth: 0.65, boldness: 0.48, texture: 0.78 },
    cultural_affinity: ['arab', 'middle east', 'levant', 'north african', 'moroccan', 'tunisian', 'egyptian'],
    tags: ['glass-skin', 'modern', 'effortless', 'influencer'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LATINA
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'latina_glam',
    name: 'Latina Glam',
    archetype: 'latina_glam',
    description:
      'Bronzed glow base, warm terracotta or copper eyeshadow, defined cat-eye, '
      + 'lush lash, bold red or coral lip. The beauty of JLo, Karol G, Bad Bunny-era '
      + 'aesthetics — Mexico, Colombia, Puerto Rico, DR, Cuba.',
    products: [
      { category: 'foundation', shade_range: 'W20–N50', finish: 'luminous', coverage: 'medium-full' },
      { category: 'eyeshadow', tones: ['terracotta', 'copper', 'rose gold', 'burnt orange'] },
      { category: 'liner', style: 'cat-eye wing', colour: 'black or brown' },
      { category: 'lash', style: 'full volume' },
      { category: 'bronzer', placement: 'sun-kiss placement' },
      { category: 'lip', shade: 'bold red or coral-orange', finish: 'matte or satin' },
    ],
    wig_styles: [
      { id: 'peruvian_body_wave', name: 'Peruvian Body Wave' },
      { id: 'loose_deep_wave', name: 'Loose Deep Wave' },
      { id: 'highlighted_balayage', name: 'Balayage Highlights' },
    ],
    weights: { intensity: 0.78, warmth: 0.87, boldness: 0.72, texture: 0.62 },
    cultural_affinity: ['latin', 'latina', 'reggaeton', 'salsa', 'cumbia', 'mexican', 'colombian', 'brazilian', 'puerto rican', 'dominican'],
    tags: ['bronzed', 'warm', 'bold-lip', 'vibrant'],
  },

  {
    id: 'afro_latina',
    name: 'Afro-Latina',
    archetype: 'latina_glam',
    description:
      'Rich bronze glow, bold graphic liner or deep smoky eye, full-glam lash, '
      + 'deep berry or copper matte lip. Where Afrobeats meets reggaeton — '
      + 'Afro-Dominican, Afro-Colombian, Afro-Brazilian, Puerto Rican.',
    products: [
      { category: 'foundation', shade_range: 'N30–N55', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['deep bronze', 'copper', 'burgundy', 'black'] },
      { category: 'liner', style: 'graphic bold', colour: 'black' },
      { category: 'lash', style: 'full drama' },
      { category: 'lip', shade: 'deep berry or copper', finish: 'matte' },
      { category: 'highlight', placement: 'cheekbone', finish: 'warm gold' },
    ],
    wig_styles: [
      { id: 'curly_ombre', name: 'Curly Ombré' },
      { id: 'twist_out_natural', name: 'Twist-Out Natural' },
      { id: 'water_wave', name: 'Water Wave' },
    ],
    weights: { intensity: 0.85, warmth: 0.82, boldness: 0.82, texture: 0.70 },
    cultural_affinity: ['afro-latina', 'afrobeats', 'reggaeton', 'dominican', 'colombian', 'brazilian', 'salsa', 'bachata'],
    tags: ['editorial', 'warm', 'bold', 'multicultural'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // EAST ASIAN / K-BEAUTY / J-BEAUTY
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'k_beauty_glass',
    name: 'K-Beauty Glass Skin',
    archetype: 'k_beauty',
    description:
      'Porcelain glass-skin base, soft gradient lip, monolid-friendly eye techniques, '
      + 'straight brows, ultra-dewy finish, no-makeup-makeup with dimension. '
      + 'Seoul standard — K-pop idol clean, Hallyu global.',
    products: [
      { category: 'foundation', shade_range: 'C10–N20', finish: 'glass/dewy', coverage: 'light-medium' },
      { category: 'eyeshadow', tones: ['champagne', 'soft pink', 'peach', 'white shimmer'] },
      { category: 'liner', style: 'thin subtle wing or none', colour: 'brown' },
      { category: 'lash', style: 'natural flutter' },
      { category: 'lip', shade: 'ombre berry-to-nude or coral gradient', finish: 'jelly gloss' },
      { category: 'skincare_base', steps: ['essence', 'serum', 'cushion', 'setting mist'] },
    ],
    wig_styles: [
      { id: 'kpop_idol_straight', name: 'K-Pop Idol Straight' },
      { id: 'sleek_bob', name: 'Sleek Bob' },
      { id: 'curtain_bang_layers', name: 'Curtain-Bang Layers' },
    ],
    weights: { intensity: 0.35, warmth: 0.25, boldness: 0.25, texture: 0.92 },
    cultural_affinity: ['k-pop', 'k-beauty', 'korean', 'seoul', 'idol', 'hallyu', 'kpop'],
    tags: ['glass-skin', 'dewy', 'clean', 'cool'],
  },

  {
    id: 'j_beauty',
    name: 'J-Beauty Wabi-Sabi',
    archetype: 'k_beauty',
    description:
      'Effortless translucent skin, flushed monochrome cheek, barely-there eye, '
      + 'glossy natural lip. Japanese beauty philosophy — imperfect, minimal, '
      + 'deeply refined. Tokyo, Kyoto.',
    products: [
      { category: 'foundation', shade_range: 'C05–N15', finish: 'translucent-natural', coverage: 'light' },
      { category: 'eyeshadow', tones: ['ivory', 'soft peach', 'rosy beige'] },
      { category: 'blush', shade: 'sheer flush peach or rose', placement: 'nose-bridge drape' },
      { category: 'lip', shade: 'natural your-lips-but-better', finish: 'balm gloss' },
    ],
    wig_styles: [
      { id: 'curtain_bang_layers', name: 'Curtain-Bang Layers' },
      { id: 'blunt_lob', name: 'Blunt Lob' },
      { id: 'kpop_idol_straight', name: 'Long Straight' },
    ],
    weights: { intensity: 0.18, warmth: 0.28, boldness: 0.15, texture: 0.88 },
    cultural_affinity: ['japanese', 'j-beauty', 'tokyo', 'kyoto', 'wabi-sabi', 'anime aesthetic'],
    tags: ['minimal', 'translucent', 'cool', 'effortless'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SOUTHEAST ASIAN
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'southeast_asian_glow',
    name: 'Southeast Asian Glow',
    archetype: 'k_beauty',
    description:
      'Golden-olive glow base, warm brown or copper smoky eye, full lash, '
      + 'coral or warm nude lip. Filipino, Thai, Vietnamese, Indonesian, Malaysian '
      + 'beauty — golden-olive skin celebrated, not corrected.',
    products: [
      { category: 'foundation', shade_range: 'W15–N35', finish: 'luminous', coverage: 'medium-full' },
      { category: 'eyeshadow', tones: ['warm brown', 'copper', 'gold', 'champagne'] },
      { category: 'liner', style: 'defined cat-eye', colour: 'black or brown' },
      { category: 'lash', style: 'full volume' },
      { category: 'lip', shade: 'coral or peach-nude', finish: 'glossy' },
      { category: 'highlight', placement: 'cheekbone', finish: 'warm glow' },
    ],
    wig_styles: [
      { id: 'bone_straight_long', name: 'Bone Straight' },
      { id: 'indian_remy_wavy', name: 'Indian Remy Wavy' },
      { id: 'beach_wave_medium', name: 'Beach Wave' },
    ],
    weights: { intensity: 0.65, warmth: 0.82, boldness: 0.60, texture: 0.65 },
    cultural_affinity: ['filipino', 'thai', 'vietnamese', 'indonesian', 'malaysian', 'southeast asian', 'singaporean'],
    tags: ['glow', 'golden', 'olive', 'warm'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // EAST AFRICAN
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'ethiopian_jewel',
    name: 'Ethiopian Jewel',
    archetype: 'afro_glam',
    description:
      'Jewel-toned cut crease (sapphire, emerald, or deep plum), kohl-rimmed eyes, '
      + 'blinding gold highlight, bold wine or terracotta lip, flawless glowing skin. '
      + 'Addis Ababa editorial elegance — Habesha beauty elevated.',
    products: [
      { category: 'foundation', shade_range: 'N25–N55', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['sapphire', 'emerald', 'deep plum', 'gold'] },
      { category: 'liner', style: 'kohl smudge + graphic wing', colour: 'black kohl' },
      { category: 'lash', style: 'dramatic full' },
      { category: 'lip', shade: 'wine or terracotta', finish: 'satin' },
      { category: 'highlight', placement: 'cheekbone + brow bone', finish: 'blinding gold' },
    ],
    wig_styles: [
      { id: 'big_chop_fro', name: 'Big Chop Fro' },
      { id: 'loc_wig', name: 'Locs' },
      { id: 'indian_remy_wavy', name: 'Indian Remy Wavy' },
    ],
    weights: { intensity: 0.87, warmth: 0.72, boldness: 0.78, texture: 0.70 },
    cultural_affinity: ['ethiopian', 'habesha', 'eritrean', 'east african', 'addis ababa', 'somali'],
    tags: ['jewel-tones', 'editorial', 'kohl', 'elegant'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ZULU / SOUTHERN AFRICAN BRIDAL
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'zulu_bridal',
    name: 'Zulu Bridal (Umembeso)',
    archetype: 'amapiano_beat',
    description:
      'Rich glowing skin, terracotta and red-ochre eye, beaded accessories, '
      + 'deep red or maroon lip, traditional isidwaba-inspired bold colour. '
      + 'South African Zulu bridal — umembeso ceremony beauty.',
    products: [
      { category: 'foundation', shade_range: 'N35–N60', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['terracotta', 'red-ochre', 'deep red', 'gold'] },
      { category: 'liner', style: 'bold defined', colour: 'black' },
      { category: 'lash', style: 'full' },
      { category: 'lip', shade: 'deep red or maroon', finish: 'satin' },
      { category: 'accessories', beading: 'traditional isicwaya/beaded choker' },
    ],
    wig_styles: [
      { id: 'kinky_coily_afro', name: 'Kinky Coily Afro' },
      { id: 'twist_out_natural', name: 'Twist-Out' },
    ],
    weights: { intensity: 0.85, warmth: 0.90, boldness: 0.80, texture: 0.60 },
    cultural_affinity: ['zulu', 'south african', 'xhosa', 'nguni', 'ndebele', 'sotho', 'soweto'],
    tags: ['bridal', 'traditional', 'cultural', 'bold', 'warm'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MIXED-HERITAGE
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'mixed_heritage_luminous',
    name: 'Mixed-Heritage Luminous',
    archetype: 'clean_minimal',
    description:
      'Skin-forward dewy base celebrating ambiguous, multi-undertone complexions, '
      + 'warm bronze or rosé eye, defined natural brow, glossy your-lip-shade lip. '
      + 'For biracial, multiracial, and mixed-heritage beauties — every combination celebrated.',
    products: [
      { category: 'foundation', shade_range: 'all — mixed-calibrated', finish: 'luminous', coverage: 'medium' },
      { category: 'eyeshadow', tones: ['warm bronze', 'rose gold', 'champagne'] },
      { category: 'lip', shade: 'your-lip-shade gloss', finish: 'glossy' },
      { category: 'brow', style: 'natural groomed' },
      { category: 'highlight', placement: 'cheekbone + inner corner', finish: 'natural glow' },
    ],
    wig_styles: [
      { id: 'kinky_curly_mix', name: 'Kinky Curly Mix' },
      { id: 'highlighted_balayage', name: 'Balayage' },
      { id: 'beach_wave_medium', name: 'Beach Wave' },
    ],
    weights: { intensity: 0.55, warmth: 0.60, boldness: 0.45, texture: 0.60 },
    cultural_affinity: ['mixed', 'biracial', 'multiracial', 'blasian', 'hapa', 'afro-asian', 'mixed heritage'],
    tags: ['luminous', 'glow', 'versatile', 'natural'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CLEAN / MINIMALIST
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'clean_minimal',
    name: 'Clean Minimal',
    archetype: 'clean_minimal',
    description:
      'Skin-first, product-light, effortless. Tinted moisturiser, subtle mascara, '
      + 'clear gloss, defined brow. Works for every skin tone — the canvas everything '
      + 'else is built on. Universally wearable.',
    products: [
      { category: 'foundation', shade_range: 'all', finish: 'natural', coverage: 'light' },
      { category: 'mascara', style: 'natural lengthening' },
      { category: 'lip', shade: 'clear or YLBB', finish: 'glossy' },
      { category: 'brow', style: 'groomed natural' },
    ],
    wig_styles: [
      { id: 'twist_out_natural', name: 'Twist-Out Natural' },
      { id: 'beach_wave_medium', name: 'Beach Wave' },
      { id: 'blunt_lob', name: 'Blunt Lob' },
    ],
    weights: { intensity: 0.12, warmth: 0.50, boldness: 0.12, texture: 0.30 },
    cultural_affinity: ['natural', 'clean', 'minimalist', 'no-makeup', 'skincare'],
    tags: ['natural', 'minimal', 'effortless', 'universal'],
  },

  {
    id: 'soft_glam',
    name: 'Soft Glam',
    archetype: 'clean_minimal',
    description:
      'Warm neutral eye, subtle lash, glowing skin, pink-nude or mauve lip. '
      + 'The universal crowd-pleaser — beautiful for every community, '
      + 'every occasion, every skin tone.',
    products: [
      { category: 'foundation', shade_range: 'all', finish: 'satin', coverage: 'medium' },
      { category: 'eyeshadow', tones: ['warm nude', 'champagne', 'soft brown', 'rose'] },
      { category: 'liner', style: 'thin define', colour: 'brown or black' },
      { category: 'lash', style: 'natural flutter' },
      { category: 'lip', shade: 'pink-nude or mauve', finish: 'satin' },
    ],
    wig_styles: [
      { id: 'silk_press_natural', name: 'Silk Press' },
      { id: 'beach_wave_medium', name: 'Beach Wave' },
      { id: 'bone_straight_long', name: 'Bone Straight' },
    ],
    weights: { intensity: 0.48, warmth: 0.58, boldness: 0.42, texture: 0.55 },
    cultural_affinity: ['natural', 'everyday', 'versatile', 'all communities'],
    tags: ['soft', 'neutral', 'wearable', 'date-night'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SPECIAL OCCASION
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'owambe_glam',
    name: 'Owambe Glam',
    archetype: 'afro_glam',
    description:
      'Full-glam everything — blinding gold highlight, warm bronze cut crease, '
      + 'wine or bold terracotta lip, full lash, gele-ready impeccable skin. '
      + 'Nigerian owambe party aesthetic — arrive and conquer.',
    products: [
      { category: 'foundation', shade_range: 'N35–N65', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['deep bronze', 'warm gold', 'burnt sienna', 'champagne'] },
      { category: 'liner', style: 'full wing', colour: 'black' },
      { category: 'lash', style: 'mega-glam drama' },
      { category: 'lip', shade: 'wine or bold terracotta', finish: 'matte or satin' },
      { category: 'highlight', placement: 'cheekbone + nose + brow bone', finish: 'blinding gold' },
    ],
    wig_styles: [
      { id: 'knotless_box_braids', name: 'Knotless Box Braids' },
      { id: 'bone_straight_long', name: 'Bone Straight' },
      { id: 'senegalese_twists', name: 'Senegalese Twists' },
    ],
    weights: { intensity: 0.93, warmth: 0.85, boldness: 0.88, texture: 0.65 },
    cultural_affinity: ['nigerian', 'yoruba', 'naija', 'owambe', 'west african', 'aso-ebi'],
    tags: ['party-glam', 'festive', 'full-glam', 'warm', 'occasion'],
  },

  {
    id: 'eid_glam',
    name: 'Eid Glam',
    archetype: 'gulf_glam',
    description:
      'Flawless luminous base, dramatic smoky eye in plum or deep taupe, '
      + 'full lash, rose-nude gloss. Eid al-Fitr and Eid al-Adha beauty — '
      + 'Muslim women from every community celebrating in their full glow.',
    products: [
      { category: 'foundation', shade_range: 'all', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['plum', 'deep taupe', 'champagne gold', 'black smoke'] },
      { category: 'liner', style: 'kohl + dramatic wing', colour: 'black' },
      { category: 'lash', style: 'full drama' },
      { category: 'lip', shade: 'rose-nude or berry gloss', finish: 'glossy' },
    ],
    wig_styles: [
      { id: 'indian_remy_wavy', name: 'Indian Remy Wavy' },
      { id: 'ultra_silky_xl', name: 'Ultra Silky XL' },
      { id: 'bone_straight_long', name: 'Bone Straight' },
    ],
    weights: { intensity: 0.80, warmth: 0.65, boldness: 0.68, texture: 0.72 },
    cultural_affinity: ['muslim', 'eid', 'arab', 'south asian', 'north african', 'west african', 'southeast asian', 'turkish'],
    tags: ['festive', 'occasion', 'glam', 'modest-beauty'],
  },

  {
    id: 'black_tie_gala',
    name: 'Black-Tie Gala',
    archetype: 'hip_hop_glam',
    description:
      'The ultimate high-fashion full glam — sculpted contour, cut crease in '
      + 'black and gold or deep plum, ultra-volume lash, vampy deep lip. '
      + 'For every skin tone walking into every room they own.',
    products: [
      { category: 'foundation', shade_range: 'all', finish: 'satin-matte', coverage: 'full' },
      { category: 'contour', intensity: 'sculpted' },
      { category: 'eyeshadow', tones: ['black', 'deep gold', 'plum', 'champagne flash'] },
      { category: 'liner', style: 'cat-eye precision', colour: 'black' },
      { category: 'lash', style: 'ultra-drama volume' },
      { category: 'lip', shade: 'vampy deep wine or red', finish: 'matte or satin' },
      { category: 'highlight', placement: 'cheekbone', finish: 'blinding' },
    ],
    wig_styles: [
      { id: 'ultra_silky_xl', name: 'Ultra Silky XL' },
      { id: 'high_pony_sleek', name: 'High Sleek Ponytail' },
      { id: 'loc_wig', name: 'Locs' },
    ],
    weights: { intensity: 0.95, warmth: 0.55, boldness: 0.93, texture: 0.75 },
    cultural_affinity: ['all', 'gala', 'red carpet', 'formal', 'luxury'],
    tags: ['gala', 'full-glam', 'evening', 'bold', 'statement'],
  },
];

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export function scoreLook(look, vec) {
  const w = look.weights;
  const dims = {
    intensity: 1 - Math.abs(vec.intensity - w.intensity),
    warmth:    1 - Math.abs(vec.warmth    - w.warmth),
    boldness:  1 - Math.abs(vec.boldness  - w.boldness),
    texture:   1 - Math.abs(vec.texture   - w.texture),
  };
  const base = (dims.intensity + dims.warmth + dims.boldness + dims.texture) / 4;
  const archetypeBonus = vec.archetypes?.includes(look.archetype) ? 0.15 : 0;
  const normCulture = look.cultural_affinity.map(s => s.toLowerCase());
  const culturalMatches = (vec.cultural_tags ?? []).filter(t =>
    normCulture.some(c => t.toLowerCase().includes(c) || c.includes(t.toLowerCase()))
  ).length;
  const culturalBonus = Math.min(0.10, culturalMatches * 0.03);
  return Math.min(1, base + archetypeBonus + culturalBonus);
}

export function recommendLooks(vec, { topN = 5, minScore = 0.2 } = {}) {
  const scored = LOOKS
    .map(look => ({ look, score: scoreLook(look, vec) }))
    .filter(r => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return scored.map(({ look, score }) => ({
    look,
    score: Math.round(score * 100) / 100,
    wigStyle: pickWig(look, vec),
  }));
}

function pickWig(look, vec) {
  if (!look.wig_styles?.length) return null;
  const vibeMap = {
    'natural-afro':    'coily',
    'long-sleek-wig':  'straight',
    'straight-sleek':  'straight',
    'long-wavy-indian':'wavy',
    'curly-ombre':     'curly',
    'long-silky':      'straight',
    'locs':            'locs',
    'braided':         'braided',
  };
  const targetTexture = vibeMap[vec.hair_vibe];
  const match = look.wig_styles.find(w => w.texture === targetTexture);
  return match ?? look.wig_styles[0];
}
