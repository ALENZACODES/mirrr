/**
 * MIRRR Look Engine
 *
 * 75-look catalogue — the most comprehensive multicultural beauty catalog
 * ever built into a beauty AI. Covers every major ethnic community, every
 * occasion, every aesthetic — West African, East African, Southern African,
 * North African, Caribbean, Black American, South Asian, Arab, Latina,
 * East Asian, Southeast Asian, Pacific Islander, Indigenous, Central Asian,
 * Mixed Heritage, and universal archetypes.
 *
 * Most beauty apps have 5–8 looks. MIRRR has 75.
 */

export const LOOKS = [

  // ═══════════════════════════════════════════════════════════════════════════
  // WEST AFRICAN / AFROBEATS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'afro_glam_editorial',
    name: 'Afro-Glam Editorial',
    archetype: 'afro_glam',
    description: 'Rich ochre and burnt-sienna eyeshadow, deep bronze cut crease, full drama lash, glossy terracotta lip, blinding cheekbone highlight. Crown energy — built for West African editorial, Afrobeats concerts, Nollywood red carpets.',
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
    description: 'Graphic cut crease in deep indigo or forest green, bold geometric liner art, black matte lip or electric red, blinding highlight. Where Afrocentric meets punk avant-garde — Brooklyn, London, Lagos.',
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
    cultural_affinity: ['afropunk', 'naija', 'nigerian', 'punk', 'alternative', 'avant-garde'],
    tags: ['editorial', 'bold', 'graphic', 'punk'],
  },

  {
    id: 'owambe_glam',
    name: 'Owambe Glam',
    archetype: 'afro_glam',
    description: 'Full-glam everything — blinding gold highlight, warm bronze cut crease, wine or bold terracotta lip, full lash, gele-ready impeccable skin. Nigerian owambe party aesthetic — arrive and conquer.',
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
    tags: ['party-glam', 'festive', 'full-glam', 'warm'],
  },

  {
    id: 'nollywood_red_carpet',
    name: 'Nollywood Red Carpet',
    archetype: 'afro_glam',
    description: 'Velvet matte skin, ultra-defined cut crease in jewel tones, rhinestone liner details, mega-lash, deep plum or wine lip. Lagos red carpet — Genevieve Nnaji elegance meets Nollywood spectacle.',
    products: [
      { category: 'foundation', shade_range: 'N35–N65', finish: 'velvet-matte', coverage: 'full' },
      { category: 'eyeshadow', tones: ['deep plum', 'royal purple', 'black', 'gold flash'] },
      { category: 'liner', style: 'rhinestone detail + wing', colour: 'black' },
      { category: 'lash', style: 'mega-glam' },
      { category: 'lip', shade: 'deep plum or wine', finish: 'matte' },
    ],
    wig_styles: [
      { id: 'bone_straight_long', name: 'Bone Straight' },
      { id: 'high_pony_sleek', name: 'High Sleek Ponytail' },
    ],
    weights: { intensity: 0.92, warmth: 0.60, boldness: 0.90, texture: 0.55 },
    cultural_affinity: ['nollywood', 'nigerian', 'lagos', 'west african', 'yoruba', 'igbo'],
    tags: ['red-carpet', 'glam', 'jewel-tone', 'matte'],
  },

  {
    id: 'afrobeats_concert',
    name: 'Afrobeats Concert',
    archetype: 'afro_glam',
    description: 'Sweat-proof full glam, bronze-and-gold smoky eye, glossy full lip, blinding shimmer — built to last a Burna Boy or Wizkid concert from start to finish. Lagos, London, Toronto.',
    products: [
      { category: 'foundation', shade_range: 'N30–N65', finish: 'long-wear-satin', coverage: 'full' },
      { category: 'eyeshadow', tones: ['bronze', 'gold', 'burnt orange', 'black smoke'] },
      { category: 'liner', style: 'waterproof wing', colour: 'black' },
      { category: 'lash', style: 'drama waterproof' },
      { category: 'lip', shade: 'warm nude gloss', finish: 'glossy' },
      { category: 'setting', spray: 'long-wear fix' },
    ],
    wig_styles: [
      { id: 'kinky_coily_afro', name: 'Kinky Coily Afro' },
      { id: 'twist_out_natural', name: 'Twist-Out Natural' },
      { id: 'knotless_box_braids', name: 'Knotless Box Braids' },
    ],
    weights: { intensity: 0.85, warmth: 0.82, boldness: 0.80, texture: 0.62 },
    cultural_affinity: ['afrobeats', 'afropop', 'naija', 'ghana', 'diaspora', 'concert'],
    tags: ['concert', 'long-wear', 'warm', 'shimmer'],
  },

  {
    id: 'ghanaian_kente_glam',
    name: 'Ghanaian Kente Glam',
    archetype: 'afro_glam',
    description: 'Inspired by kente cloth — bold geometric graphic liner in gold and green, warm bronzed skin, terracotta lip, statement lash. Accra, Ghana, the diaspora dressed to honour.',
    products: [
      { category: 'foundation', shade_range: 'N40–N65', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['forest green', 'gold', 'deep red', 'black'] },
      { category: 'liner', style: 'graphic kente-inspired geometry', colour: 'gold + black' },
      { category: 'lash', style: 'full glam' },
      { category: 'lip', shade: 'terracotta or brick red', finish: 'satin' },
    ],
    wig_styles: [
      { id: 'big_chop_fro', name: 'Big Chop Fro' },
      { id: 'knotless_box_braids', name: 'Knotless Box Braids' },
      { id: 'goddess_braids', name: 'Goddess Braids' },
    ],
    weights: { intensity: 0.88, warmth: 0.80, boldness: 0.87, texture: 0.60 },
    cultural_affinity: ['ghanaian', 'akan', 'kente', 'accra', 'west african', 'diasporan'],
    tags: ['cultural', 'graphic', 'editorial', 'bold'],
  },

  {
    id: 'congolese_sapeur',
    name: 'Congolese Sapeur Chic',
    archetype: 'afro_glam',
    description: 'La Sape — Congolese culture of radical elegance. Flawless glowing skin, sharp defined brow, a single bold lip in fuchsia or cobalt, sculptural minimalism. Kinshasa and Brazzaville swagger.',
    products: [
      { category: 'foundation', shade_range: 'N40–N60', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['champagne', 'soft brown', 'minimal'] },
      { category: 'liner', style: 'precise thin wing', colour: 'black' },
      { category: 'lash', style: 'natural-full' },
      { category: 'lip', shade: 'fuchsia or cobalt statement', finish: 'matte' },
      { category: 'brow', style: 'razor-sharp defined' },
    ],
    wig_styles: [
      { id: 'sleek_bob', name: 'Sleek Bob' },
      { id: 'blunt_lob', name: 'Blunt Lob' },
      { id: 'silk_press_natural', name: 'Silk Press' },
    ],
    weights: { intensity: 0.72, warmth: 0.55, boldness: 0.82, texture: 0.70 },
    cultural_affinity: ['congolese', 'sapeur', 'kinshasa', 'brazzaville', 'la sape', 'central african'],
    tags: ['chic', 'elegant', 'statement-lip', 'minimalist'],
  },

  {
    id: 'afrofuturist_editorial',
    name: 'Afrofuturist Editorial',
    archetype: 'afro_glam',
    description: 'Chrome and metallic eye, holographic face gems, sculptural brow, futuristic graphic liner, silver or metallic lip. Black women in the future — Wakanda, sci-fi, Janelle Monáe energy.',
    products: [
      { category: 'foundation', shade_range: 'N30–N65', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['chrome silver', 'holographic', 'electric blue', 'black'] },
      { category: 'liner', style: 'architectural sculptural', colour: 'silver or chrome' },
      { category: 'gems', placement: 'temples + brow + inner corner' },
      { category: 'lip', shade: 'metallic silver or chrome nude', finish: 'metallic' },
    ],
    wig_styles: [
      { id: 'kinky_coily_afro', name: 'Kinky Coily Afro' },
      { id: 'coloured_wig', name: 'Bold Colour (silver/white)' },
      { id: 'sisterlocks', name: 'Sisterlocks' },
    ],
    weights: { intensity: 0.95, warmth: 0.20, boldness: 0.98, texture: 0.50 },
    cultural_affinity: ['afrofuturism', 'sci-fi', 'editorial', 'black culture', 'avant-garde'],
    tags: ['chrome', 'futuristic', 'editorial', 'statement'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUTH AFRICAN / AMAPIANO
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'amapiano_beat',
    name: 'Amapiano Beat',
    archetype: 'amapiano_beat',
    description: 'Sun-bronzed glowing skin, smoky brown-gold eye, glossy caramel lip, dewy finish. South African house music aesthetic — Joburg, Pretoria, Soweto clubs.',
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
      { id: 'bone_straight_long', name: 'Bone Straight' },
    ],
    weights: { intensity: 0.78, warmth: 0.85, boldness: 0.72, texture: 0.60 },
    cultural_affinity: ['amapiano', 'south african', 'afro house', 'gqom', 'joburg', 'zulu'],
    tags: ['glow', 'warm', 'club-ready', 'bronzed'],
  },

  {
    id: 'zulu_bridal',
    name: 'Zulu Bridal (Umembeso)',
    archetype: 'amapiano_beat',
    description: 'Rich glowing skin, terracotta and red-ochre eye, beaded accessories, deep red or maroon lip, traditional isidwaba-inspired bold colour. South African Zulu bridal — umembeso ceremony beauty.',
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
    cultural_affinity: ['zulu', 'south african', 'xhosa', 'nguni', 'ndebele', 'sotho'],
    tags: ['bridal', 'traditional', 'cultural', 'bold'],
  },

  {
    id: 'xhosa_glam',
    name: 'Xhosa Ceremony Glam',
    archetype: 'amapiano_beat',
    description: 'Bold cobalt or deep blue eye (echoing isidwaba blue), red-ochre cheek, warm glow base, strong defined brow, deep red lip. Xhosa ceremony and ubuntu beauty — Eastern Cape, South Africa.',
    products: [
      { category: 'foundation', shade_range: 'N35–N60', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['cobalt blue', 'deep navy', 'ochre', 'black'] },
      { category: 'liner', style: 'bold defined', colour: 'black' },
      { category: 'lash', style: 'full glam' },
      { category: 'lip', shade: 'deep red or burgundy', finish: 'satin' },
      { category: 'blush', shade: 'terracotta drape' },
    ],
    wig_styles: [
      { id: 'big_chop_fro', name: 'Big Chop Fro' },
      { id: 'kinky_coily_afro', name: 'Kinky Coily Afro' },
    ],
    weights: { intensity: 0.87, warmth: 0.78, boldness: 0.84, texture: 0.58 },
    cultural_affinity: ['xhosa', 'zulu', 'south african', 'eastern cape', 'nguni'],
    tags: ['ceremony', 'cultural', 'bold', 'cobalt'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EAST AFRICAN
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'ethiopian_jewel',
    name: 'Ethiopian Jewel',
    archetype: 'afro_glam',
    description: 'Jewel-toned cut crease (sapphire, emerald, or deep plum), kohl-rimmed eyes, blinding gold highlight, bold wine or terracotta lip, flawless glowing skin. Addis Ababa editorial elegance — Habesha beauty elevated.',
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
    cultural_affinity: ['ethiopian', 'habesha', 'eritrean', 'east african', 'addis ababa'],
    tags: ['jewel-tones', 'editorial', 'kohl', 'elegant'],
  },

  {
    id: 'somali_glam',
    name: 'Somali Glam',
    archetype: 'afro_glam',
    description: 'Dewy luminous base, dramatic kohl-smoked eye, henna-inspired hand art, warm nude or terracotta gloss. Mogadishu and diaspora — Somali women in full glow, unapologetically.',
    products: [
      { category: 'foundation', shade_range: 'N25–N50', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['deep brown', 'warm gold', 'black smoke', 'copper'] },
      { category: 'liner', style: 'kohl rimmed + soft wing', colour: 'black kohl' },
      { category: 'lash', style: 'full drama' },
      { category: 'lip', shade: 'warm nude gloss or terracotta', finish: 'glossy' },
    ],
    wig_styles: [
      { id: 'bone_straight_long', name: 'Bone Straight' },
      { id: 'indian_remy_wavy', name: 'Indian Remy Wavy' },
      { id: 'loc_wig', name: 'Locs' },
    ],
    weights: { intensity: 0.82, warmth: 0.75, boldness: 0.72, texture: 0.65 },
    cultural_affinity: ['somali', 'east african', 'horn of africa', 'mogadishu', 'diaspora'],
    tags: ['kohl', 'warm', 'luminous', 'glam'],
  },

  {
    id: 'kenyan_nairobi_chic',
    name: 'Nairobi Chic',
    archetype: 'afro_glam',
    description: 'Glass-skin glow, warm bronze smoky eye, defined brow, terracotta-nude lip, Kenyan cool. Nairobi\'s fashion scene — effortlessly modern, deeply rooted.',
    products: [
      { category: 'foundation', shade_range: 'N30–N55', finish: 'glass-luminous', coverage: 'medium-full' },
      { category: 'eyeshadow', tones: ['warm bronze', 'copper', 'champagne', 'soft black'] },
      { category: 'liner', style: 'tight-line + flick', colour: 'brown-black' },
      { category: 'lash', style: 'full natural' },
      { category: 'lip', shade: 'terracotta-nude', finish: 'satin' },
      { category: 'brow', style: 'full defined' },
    ],
    wig_styles: [
      { id: 'twist_out_natural', name: 'Twist-Out Natural' },
      { id: 'knotless_box_braids', name: 'Knotless Box Braids' },
      { id: 'bone_straight_long', name: 'Bone Straight' },
    ],
    weights: { intensity: 0.70, warmth: 0.80, boldness: 0.65, texture: 0.62 },
    cultural_affinity: ['kenyan', 'nairobi', 'east african', 'kikuyu', 'luo', 'swahili'],
    tags: ['glass-skin', 'chic', 'warm', 'modern'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NORTH AFRICAN
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'nubian_queen',
    name: 'Nubian Queen',
    archetype: 'afro_glam',
    description: 'Deep glowing skin, dramatic kohl and gold eye, bold geometric liner elements, rich copper or wine lip. Ancient Nubian beauty — Sudan, Southern Egypt, the Nile corridor.',
    products: [
      { category: 'foundation', shade_range: 'N45–N65', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['kohl black', 'gold', 'copper', 'lapis blue'] },
      { category: 'liner', style: 'bold geometric kohl', colour: 'black kohl' },
      { category: 'lash', style: 'dramatic full' },
      { category: 'lip', shade: 'copper or rich wine', finish: 'satin' },
      { category: 'highlight', placement: 'cheekbone', finish: 'gold' },
    ],
    wig_styles: [
      { id: 'kinky_coily_afro', name: 'Kinky Coily Afro' },
      { id: 'sisterlocks', name: 'Sisterlocks' },
      { id: 'knotless_box_braids', name: 'Knotless Box Braids' },
    ],
    weights: { intensity: 0.90, warmth: 0.75, boldness: 0.87, texture: 0.62 },
    cultural_affinity: ['nubian', 'sudanese', 'egyptian', 'north african', 'nile', 'ancient egypt'],
    tags: ['kohl', 'gold', 'editorial', 'ancient'],
  },

  {
    id: 'amazigh_berber',
    name: 'Amazigh Bridal',
    archetype: 'gulf_glam',
    description: 'Kohl-defined eyes with blue-tinted liner (evil eye protection), silver and amber jewel accents, warm nude lip, henna-pattern details. Moroccan, Algerian, Libyan Amazigh heritage beauty.',
    products: [
      { category: 'foundation', shade_range: 'W10–N35', finish: 'satin', coverage: 'full' },
      { category: 'eyeshadow', tones: ['kohl black', 'cobalt blue', 'silver', 'warm brown'] },
      { category: 'liner', style: 'kohl heavy lower + wing', colour: 'kohl + blue-black' },
      { category: 'lash', style: 'full natural-dramatic' },
      { category: 'lip', shade: 'warm nude or terracotta', finish: 'satin' },
      { category: 'accessories', jewellery: 'silver amber Amazigh tiara/necklace' },
    ],
    wig_styles: [
      { id: 'indian_remy_wavy', name: 'Indian Remy Wavy' },
      { id: 'bone_straight_long', name: 'Bone Straight' },
    ],
    weights: { intensity: 0.78, warmth: 0.70, boldness: 0.75, texture: 0.68 },
    cultural_affinity: ['amazigh', 'berber', 'moroccan', 'algerian', 'north african', 'imazighen'],
    tags: ['bridal', 'traditional', 'kohl', 'silver'],
  },

  {
    id: 'moroccan_soiree',
    name: 'Moroccan Soirée',
    archetype: 'gulf_glam',
    description: 'Luminous warm base, smoky almond eye with hammered-gold accents, rose-pink or plum gloss, mosaic-inspired liner detail. Marrakech nights, Casablanca soirée.',
    products: [
      { category: 'foundation', shade_range: 'W10–N35', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['warm bronze', 'hammered gold', 'deep brown', 'rose'] },
      { category: 'liner', style: 'mosaic geometric details', colour: 'gold + brown' },
      { category: 'lash', style: 'full drama' },
      { category: 'lip', shade: 'rose-plum', finish: 'glossy' },
    ],
    wig_styles: [
      { id: 'khaleeji_blowout', name: 'Khaleeji Blow-Out' },
      { id: 'indian_remy_wavy', name: 'Indian Remy Wavy' },
      { id: 'bone_straight_long', name: 'Bone Straight' },
    ],
    weights: { intensity: 0.80, warmth: 0.78, boldness: 0.72, texture: 0.72 },
    cultural_affinity: ['moroccan', 'maghrebi', 'north african', 'marrakech', 'casablanca'],
    tags: ['soiree', 'gold', 'warm', 'glam'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BLACK AMERICAN / HIP HOP
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'hip_hop_glam',
    name: 'Hip Hop Glam',
    archetype: 'hip_hop_glam',
    description: 'Icy highlighter, dramatic smoky bronze-and-black eye, extra-length lash, nude-to-caramel matte lip, flawless full-coverage matte base. Cardi B, Nicki Minaj — the culture that invented the beauty standard.',
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
    description: 'Warm bronze cut crease, full-glam lash, bold wine or coral lip, dewy luminous skin, detailed brow. The energy of Howard and Spelman homecoming — "we out here."',
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
    cultural_affinity: ['hbcu', 'black american', 'sorority', 'homecoming', 'black college'],
    tags: ['festive', 'warm', 'glam', 'school-spirit'],
  },

  {
    id: 'black_girl_natural',
    name: 'Black Girl Natural',
    archetype: 'clean_minimal',
    description: 'Skin-forward luminous base, subtle bronze eye, defined natural brow, YLBB gloss, no-makeup-makeup celebrating natural Black beauty. For the wash-and-go era.',
    products: [
      { category: 'foundation', shade_range: 'N25–N65', finish: 'luminous', coverage: 'light-medium' },
      { category: 'eyeshadow', tones: ['warm bronze', 'champagne', 'nude'] },
      { category: 'brow', style: 'natural full defined' },
      { category: 'lash', style: 'natural mascara' },
      { category: 'lip', shade: 'your-lip-shade gloss', finish: 'glossy' },
    ],
    wig_styles: [
      { id: 'twist_out_natural', name: 'Twist-Out Natural' },
      { id: 'kinky_coily_afro', name: 'Kinky Coily Afro' },
      { id: 'loc_wig', name: 'Locs' },
    ],
    weights: { intensity: 0.42, warmth: 0.72, boldness: 0.38, texture: 0.52 },
    cultural_affinity: ['black american', 'natural hair', 'wash-and-go', 'naturalista'],
    tags: ['natural', 'skin-forward', 'glow', 'everyday'],
  },

  {
    id: 'y2k_revival',
    name: 'Y2K Revival',
    archetype: 'hip_hop_glam',
    description: 'Frosty holographic eye, nude-brown overlined lip, heavy black liner, rhinestone under-eye gems, micro-glitter. Early 2000s nostalgia — TLC, Destiny\'s Child, Paris Hilton reimagined.',
    products: [
      { category: 'foundation', shade_range: 'all', finish: 'matte-powder', coverage: 'full' },
      { category: 'eyeshadow', tones: ['icy lilac', 'holographic', 'white', 'pale blue'] },
      { category: 'liner', style: 'heavy black pencil + lower lid', colour: 'black' },
      { category: 'gems', placement: 'under-eye rhinestone cluster' },
      { category: 'glitter', placement: 'lid wash' },
      { category: 'lip', shade: 'nude-brown overlined', finish: 'frosty-nude' },
    ],
    wig_styles: [
      { id: 'bone_straight_long', name: 'Bone Straight' },
      { id: 'high_pony_sleek', name: 'High Sleek Ponytail' },
      { id: 'coloured_wig', name: 'Bold Colour' },
    ],
    weights: { intensity: 0.82, warmth: 0.25, boldness: 0.85, texture: 0.60 },
    cultural_affinity: ['y2k', 'nostalgia', 'black american', 'pop', 'retro', 'early 2000s'],
    tags: ['y2k', 'frosty', 'nostalgia', 'glitter'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CARIBBEAN
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'caribbean_carnival',
    name: 'Caribbean Carnival',
    archetype: 'caribbean_carnival',
    description: 'Sun-kissed bronzed skin, vibrant tropical eyeshadow, glitter cut crease, bold coral or magenta lip, rhinestones, feather lash. Soca-season energy — Trinidad, Barbados, Jamaica, the diaspora.',
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
    cultural_affinity: ['caribbean', 'jamaican', 'dancehall', 'soca', 'carnival', 'trinidadian'],
    tags: ['festival', 'vibrant', 'warm', 'glitter'],
  },

  {
    id: 'dancehall_queen',
    name: 'Dancehall Queen',
    archetype: 'caribbean_carnival',
    description: 'Chrome or holographic eye, ultra-glossy lip in hot pink or orange, blinding body shimmer, dramatic overlined eye, jewel body art. Kingston energy — bold, sexy, unapologetic.',
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

  {
    id: 'haitian_vodou_editorial',
    name: 'Haitian Editorial',
    archetype: 'caribbean_carnival',
    description: 'Vibrant editorial — bold red and black eye, gold face accents, dramatic lash, deep wine lip. Haitian artistry and resilience made visual — Port-au-Prince and diaspora celebrating culture.',
    products: [
      { category: 'foundation', shade_range: 'N30–N60', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['scarlet red', 'black', 'gold', 'deep crimson'] },
      { category: 'liner', style: 'bold graphic', colour: 'black' },
      { category: 'gold_accents', placement: 'temple + cheekbone' },
      { category: 'lash', style: 'mega-dramatic' },
      { category: 'lip', shade: 'deep wine or scarlet', finish: 'satin' },
    ],
    wig_styles: [
      { id: 'kinky_coily_afro', name: 'Kinky Coily Afro' },
      { id: 'butterfly_locs', name: 'Butterfly Locs' },
      { id: 'coloured_wig', name: 'Bold Colour' },
    ],
    weights: { intensity: 0.93, warmth: 0.65, boldness: 0.95, texture: 0.60 },
    cultural_affinity: ['haitian', 'caribbean', 'creole', 'port-au-prince', 'diaspora'],
    tags: ['editorial', 'bold', 'cultural', 'red'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUTH ASIAN
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'bollywood_bridal',
    name: 'Bollywood Bridal',
    archetype: 'bollywood_bridal',
    description: 'Deep jewel-tone eyeshadow (emerald, plum, navy), kohl-lined eyes, dramatic lash, matte deep berry or red lip. Bridal and festive beauty for South Asian women — Punjabi weddings, Diwali, Eid, Navratri, Bollywood.',
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
    cultural_affinity: ['bollywood', 'desi', 'south asian', 'indian', 'bengali', 'pakistani', 'punjabi', 'tamil'],
    tags: ['jewel-tones', 'bridal', 'festive', 'warm'],
  },

  {
    id: 'desi_everyday_chic',
    name: 'Desi Everyday Chic',
    archetype: 'bollywood_bridal',
    description: 'Olive-corrected glowing base, subtle golden eye with kohl, groomed brows, nude-pink or terracotta lip. Modern South Asian beauty for college, work, weekends — clean but rooted.',
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

  {
    id: 'tamil_classical',
    name: 'Tamil Classical Beauty',
    archetype: 'bollywood_bridal',
    description: 'Pristine glowing warm-toned base, heavy kohl, bold kumkum bindi, jasmine-white contrast, deep red lip. Bharatanatyam and South Indian classical beauty — Chennai, Tamil Nadu.',
    products: [
      { category: 'foundation', shade_range: 'W15–N45', finish: 'luminous-satin', coverage: 'full' },
      { category: 'eyeshadow', tones: ['kohl black', 'gold', 'deep brown'] },
      { category: 'liner', style: 'heavy kohl upper + lower', colour: 'black kohl' },
      { category: 'lash', style: 'dramatic classic' },
      { category: 'bindi', placement: 'bold round kumkum' },
      { category: 'lip', shade: 'deep red', finish: 'matte' },
      { category: 'accessories', flowers: 'jasmine hair accessory' },
    ],
    wig_styles: [
      { id: 'slicked_bun', name: 'Sleek Bun' },
      { id: 'indian_remy_wavy', name: 'Indian Remy Wavy' },
    ],
    weights: { intensity: 0.85, warmth: 0.90, boldness: 0.78, texture: 0.62 },
    cultural_affinity: ['tamil', 'south indian', 'kerala', 'bharatanatyam', 'classical indian'],
    tags: ['classical', 'traditional', 'kohl', 'red-lip'],
  },

  {
    id: 'diwali_festive',
    name: 'Diwali Festive',
    archetype: 'bollywood_bridal',
    description: 'Glittering golden eye, shimmer-kissed glowing skin, deep berry or red lip, sparkle highlight. Festival of Lights — luminous, warm, celebratory.',
    products: [
      { category: 'foundation', shade_range: 'W10–N50', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['gold glitter', 'warm bronze', 'copper', 'deep brown'] },
      { category: 'liner', style: 'gold wing', colour: 'gold + black' },
      { category: 'lash', style: 'full drama' },
      { category: 'lip', shade: 'deep berry or red', finish: 'satin' },
      { category: 'highlight', placement: 'full glow', finish: 'gold shimmer' },
    ],
    wig_styles: [
      { id: 'indian_remy_wavy', name: 'Indian Remy Wavy' },
      { id: 'bollywood_blowout', name: 'Bollywood Blowout Waves' },
      { id: 'slicked_bun', name: 'Sleek Bun' },
    ],
    weights: { intensity: 0.87, warmth: 0.88, boldness: 0.80, texture: 0.68 },
    cultural_affinity: ['diwali', 'south asian', 'indian', 'hindu', 'festive', 'celebration'],
    tags: ['festive', 'gold', 'glitter', 'celebratory'],
  },

  {
    id: 'mehndi_bridal',
    name: 'Mehndi Bridal',
    archetype: 'bollywood_bridal',
    description: 'Dewy glowing warm base, soft golden eye, delicate liner, rose-pink gloss, henna art on hands. The Mehndi ceremony — joyful, intimate, beautiful.',
    products: [
      { category: 'foundation', shade_range: 'W10–N45', finish: 'dewy', coverage: 'medium-full' },
      { category: 'eyeshadow', tones: ['champagne gold', 'soft peach', 'ivory'] },
      { category: 'liner', style: 'delicate thin line', colour: 'brown' },
      { category: 'lash', style: 'natural flutter' },
      { category: 'lip', shade: 'rose pink gloss', finish: 'glossy' },
      { category: 'accessories', henna: 'full mehndi hand art' },
    ],
    wig_styles: [
      { id: 'indian_remy_wavy', name: 'Indian Remy Wavy' },
      { id: 'beach_wave_medium', name: 'Beach Wave' },
    ],
    weights: { intensity: 0.65, warmth: 0.85, boldness: 0.55, texture: 0.72 },
    cultural_affinity: ['mehndi', 'south asian', 'indian', 'pakistani', 'bangladeshi', 'wedding ceremony'],
    tags: ['bridal', 'dewy', 'warm', 'romantic'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ARAB / MIDDLE EAST
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'gulf_glam',
    name: 'Gulf Glam',
    archetype: 'gulf_glam',
    description: 'Flawless luminous base, smouldering smoky kohl eye, champagne-gold shadow, lush lash, nude-to-blush glossy lip, global pearl highlight. Gold-and-pearl aesthetic of Khaleeji, Persian, and Levantine beauty.',
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
    cultural_affinity: ['middle east', 'arab', 'gulf', 'khaleeji', 'persian', 'arabic', 'dubai'],
    tags: ['luxury', 'kohl', 'gold', 'glossy'],
  },

  {
    id: 'arab_chic',
    name: 'Arab Chic (Modern)',
    archetype: 'gulf_glam',
    description: 'Dewy glass skin, soft taupe smoky eye, precise brushed brows, your-lips-but-better gloss, minimal shimmer. The modern Arab beauty influencer — Cairo, Amman, Dubai, Casablanca.',
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
    cultural_affinity: ['arab', 'middle east', 'levant', 'north african', 'egyptian'],
    tags: ['glass-skin', 'modern', 'effortless', 'influencer'],
  },

  {
    id: 'eid_glam',
    name: 'Eid Glam',
    archetype: 'gulf_glam',
    description: 'Flawless luminous base, dramatic smoky eye in plum or deep taupe, full lash, rose-nude gloss. Eid al-Fitr and Eid al-Adha beauty — Muslim women from every community celebrating in their full glow.',
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
    cultural_affinity: ['muslim', 'eid', 'arab', 'south asian', 'north african', 'southeast asian'],
    tags: ['festive', 'occasion', 'glam', 'modest-beauty'],
  },

  {
    id: 'persian_editorial',
    name: 'Persian Editorial',
    archetype: 'gulf_glam',
    description: 'Luminous pale base, dramatic black or dark green cut crease, precise strong brow, wine-berry lip. Persian beauty — Tehran, LA Tehrangeles, the Iranian diaspora.',
    products: [
      { category: 'foundation', shade_range: 'C05–N30', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['black', 'dark forest green', 'champagne', 'deep taupe'] },
      { category: 'liner', style: 'precise cat-eye', colour: 'black' },
      { category: 'lash', style: 'full drama' },
      { category: 'brow', style: 'strong full defined' },
      { category: 'lip', shade: 'wine-berry', finish: 'matte' },
    ],
    wig_styles: [
      { id: 'bone_straight_long', name: 'Bone Straight' },
      { id: 'khaleeji_blowout', name: 'Khaleeji Blow-Out' },
      { id: 'blunt_lob', name: 'Blunt Lob' },
    ],
    weights: { intensity: 0.85, warmth: 0.50, boldness: 0.82, texture: 0.72 },
    cultural_affinity: ['persian', 'iranian', 'tehran', 'tehrangeles', 'middle east'],
    tags: ['editorial', 'dramatic', 'strong-brow', 'bold'],
  },

  {
    id: 'turkish_glam',
    name: 'Turkish Glam',
    archetype: 'gulf_glam',
    description: 'Velvet matte skin, defined almond-shaped kohl eye, strong brow, nude-rose gloss. Istanbul beauty — European-meets-Middle-Eastern sophistication, modern and timeless.',
    products: [
      { category: 'foundation', shade_range: 'C05–N30', finish: 'satin', coverage: 'full' },
      { category: 'eyeshadow', tones: ['warm taupe', 'deep brown', 'champagne flash', 'black'] },
      { category: 'liner', style: 'almond kohl + wing', colour: 'black kohl' },
      { category: 'lash', style: 'full natural-dramatic' },
      { category: 'brow', style: 'strong full arched' },
      { category: 'lip', shade: 'nude rose', finish: 'satin' },
    ],
    wig_styles: [
      { id: 'khaleeji_blowout', name: 'Khaleeji Blow-Out' },
      { id: 'curtain_bang_layers', name: 'Curtain-Bang Layers' },
      { id: 'blunt_lob', name: 'Blunt Lob' },
    ],
    weights: { intensity: 0.75, warmth: 0.62, boldness: 0.70, texture: 0.78 },
    cultural_affinity: ['turkish', 'turkey', 'istanbul', 'ottoman', 'middle east', 'mediterranean'],
    tags: ['sophisticated', 'kohl', 'brow', 'elegant'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LATINA
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'latina_glam',
    name: 'Latina Glam',
    archetype: 'latina_glam',
    description: 'Bronzed glow base, warm terracotta or copper eyeshadow, defined cat-eye, lush lash, bold red or coral lip. JLo, Karol G, Bad Bunny-era aesthetics — Mexico, Colombia, Puerto Rico, DR, Cuba.',
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
    cultural_affinity: ['latin', 'latina', 'reggaeton', 'salsa', 'cumbia', 'mexican', 'colombian', 'brazilian'],
    tags: ['bronzed', 'warm', 'bold-lip', 'vibrant'],
  },

  {
    id: 'afro_latina',
    name: 'Afro-Latina',
    archetype: 'latina_glam',
    description: 'Rich bronze glow, bold graphic liner or deep smoky eye, full-glam lash, deep berry or copper matte lip. Where Afrobeats meets reggaeton — Afro-Dominican, Afro-Colombian, Afro-Brazilian, Puerto Rican.',
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
    cultural_affinity: ['afro-latina', 'afrobeats', 'reggaeton', 'dominican', 'colombian', 'brazilian'],
    tags: ['editorial', 'warm', 'bold', 'multicultural'],
  },

  {
    id: 'brazilian_carnival',
    name: 'Brazilian Carnival',
    archetype: 'caribbean_carnival',
    description: 'Sun-drenched bronzed glow, vibrant tropical eyeshadow, body glitter, feather lash, hot red or fuchsia lip. Rio de Janeiro Carnaval — samba, sequins, unapologetic joy.',
    products: [
      { category: 'foundation', shade_range: 'W25–N55', finish: 'luminous', coverage: 'medium-full' },
      { category: 'eyeshadow', tones: ['electric green', 'yellow', 'hot pink', 'cobalt blue'] },
      { category: 'liner', style: 'graphic coloured' },
      { category: 'lash', style: 'feather carnival lash' },
      { category: 'glitter', placement: 'full lid + body' },
      { category: 'lip', shade: 'red or fuchsia', finish: 'glossy' },
      { category: 'body', shimmer: 'carnival body sequins' },
    ],
    wig_styles: [
      { id: 'curly_ombre', name: 'Curly Ombré' },
      { id: 'water_wave', name: 'Water Wave' },
      { id: 'coloured_wig', name: 'Bold Colour' },
    ],
    weights: { intensity: 0.90, warmth: 0.92, boldness: 0.98, texture: 0.90 },
    cultural_affinity: ['brazilian', 'carnaval', 'rio', 'samba', 'latin', 'festival'],
    tags: ['carnival', 'vibrant', 'glitter', 'festival'],
  },

  {
    id: 'indigenous_latina',
    name: 'Indigenous Latina',
    archetype: 'latina_glam',
    description: 'Warm earth-tone eyeshadow in copper, sienna and terracotta, bold brow, deep berry or copper lip, glowing warm-toned skin. Celebrating Mayan, Aztec, Andean and indigenous Latin beauty — the roots beneath the flags.',
    products: [
      { category: 'foundation', shade_range: 'W20–N50', finish: 'luminous', coverage: 'medium-full' },
      { category: 'eyeshadow', tones: ['copper', 'sienna', 'terracotta', 'deep earth'] },
      { category: 'liner', style: 'defined warm-brown', colour: 'deep brown' },
      { category: 'lash', style: 'natural full' },
      { category: 'lip', shade: 'deep berry or terracotta', finish: 'matte' },
      { category: 'brow', style: 'bold full natural' },
    ],
    wig_styles: [
      { id: 'bone_straight_long', name: 'Bone Straight' },
      { id: 'indian_remy_wavy', name: 'Indian Remy Wavy' },
    ],
    weights: { intensity: 0.72, warmth: 0.90, boldness: 0.68, texture: 0.60 },
    cultural_affinity: ['indigenous', 'mayan', 'aztec', 'andean', 'quechua', 'latin american'],
    tags: ['earth-tones', 'warm', 'cultural', 'natural'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EAST ASIAN / K-BEAUTY / J-BEAUTY
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'k_beauty_glass',
    name: 'K-Beauty Glass Skin',
    archetype: 'k_beauty',
    description: 'Porcelain glass-skin base, soft gradient lip, monolid-friendly eye techniques, straight brows, ultra-dewy finish, no-makeup-makeup with dimension. Seoul standard — K-pop idol clean, Hallyu global.',
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
    description: 'Effortless translucent skin, flushed monochrome cheek, barely-there eye, glossy natural lip. Japanese beauty philosophy — imperfect, minimal, deeply refined. Tokyo, Kyoto.',
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
    cultural_affinity: ['japanese', 'j-beauty', 'tokyo', 'kyoto', 'wabi-sabi'],
    tags: ['minimal', 'translucent', 'cool', 'effortless'],
  },

  {
    id: 'chinese_new_year',
    name: 'Chinese New Year Glam',
    archetype: 'k_beauty',
    description: 'Lucky red — bold glossy red lip, subtle gold eye, luminous skin, defined brow. Chinese New Year, Lunar New Year celebrations — auspicious, joyful, radiant.',
    products: [
      { category: 'foundation', shade_range: 'C05–N25', finish: 'luminous', coverage: 'medium-full' },
      { category: 'eyeshadow', tones: ['soft gold', 'champagne', 'nude rose'] },
      { category: 'liner', style: 'subtle wing', colour: 'black' },
      { category: 'lash', style: 'natural-full' },
      { category: 'lip', shade: 'bold glossy red', finish: 'glossy' },
      { category: 'brow', style: 'defined natural' },
    ],
    wig_styles: [
      { id: 'bone_straight_long', name: 'Bone Straight' },
      { id: 'blunt_lob', name: 'Blunt Lob' },
      { id: 'kpop_idol_straight', name: 'K-Pop Straight' },
    ],
    weights: { intensity: 0.65, warmth: 0.55, boldness: 0.68, texture: 0.72 },
    cultural_affinity: ['chinese', 'lunar new year', 'chinese new year', 'hong kong', 'taiwan', 'singapore'],
    tags: ['festive', 'red-lip', 'lucky', 'celebration'],
  },

  {
    id: 'japanese_gyaru',
    name: 'Japanese Gyaru',
    archetype: 'k_beauty',
    description: 'Dramatic lower-lash eye circles, bleached-blonde or caramel wig, tan skin, nude-pink gloss, large contact lens effect. Gyaru subculture — Shibuya, Harajuku, defying Japanese beauty norms.',
    products: [
      { category: 'foundation', shade_range: 'W15–N30', finish: 'matte', coverage: 'full' },
      { category: 'eyeshadow', tones: ['white shimmer', 'nude', 'soft brown'] },
      { category: 'liner', style: 'circle lower lash line', colour: 'brown or black' },
      { category: 'lash', style: 'lower lash focused + upper drama' },
      { category: 'lip', shade: 'nude pink gloss', finish: 'glossy' },
      { category: 'blush', shade: 'heavy soft peach', placement: 'full cheek' },
    ],
    wig_styles: [
      { id: 'highlighted_balayage', name: 'Balayage/Highlighted' },
      { id: 'loose_deep_wave', name: 'Loose Deep Wave' },
      { id: 'coloured_wig', name: 'Bold Colour (blonde/caramel)' },
    ],
    weights: { intensity: 0.75, warmth: 0.55, boldness: 0.75, texture: 0.80 },
    cultural_affinity: ['japanese', 'gyaru', 'shibuya', 'harajuku', 'subculture', 'tokyo street'],
    tags: ['gyaru', 'dramatic-lash', 'subculture', 'harajuku'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUTHEAST ASIAN
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'southeast_asian_glow',
    name: 'Southeast Asian Glow',
    archetype: 'k_beauty',
    description: 'Golden-olive glow base, warm brown or copper smoky eye, full lash, coral or warm nude lip. Filipino, Thai, Vietnamese, Indonesian, Malaysian beauty — golden-olive skin celebrated, not corrected.',
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
    cultural_affinity: ['filipino', 'thai', 'vietnamese', 'indonesian', 'malaysian', 'southeast asian'],
    tags: ['glow', 'golden', 'olive', 'warm'],
  },

  {
    id: 'filipina_glam',
    name: 'Filipina Glam',
    archetype: 'k_beauty',
    description: 'Dewy luminous warm-toned base, bold dramatic lash, warm bronze or rose cut crease, glossy coral-pink lip. Manila, OFW diaspora, Filipina beauty celebrating morena skin.',
    products: [
      { category: 'foundation', shade_range: 'W15–N35', finish: 'dewy-luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['warm bronze', 'rose gold', 'copper', 'champagne'] },
      { category: 'liner', style: 'wing + waterline', colour: 'black' },
      { category: 'lash', style: 'dramatic full' },
      { category: 'lip', shade: 'coral-pink gloss', finish: 'glossy' },
    ],
    wig_styles: [
      { id: 'bone_straight_long', name: 'Bone Straight' },
      { id: 'beach_wave_medium', name: 'Beach Wave' },
      { id: 'loose_deep_wave', name: 'Loose Deep Wave' },
    ],
    weights: { intensity: 0.78, warmth: 0.85, boldness: 0.72, texture: 0.68 },
    cultural_affinity: ['filipina', 'philippines', 'manila', 'morena', 'ofw', 'southeast asian'],
    tags: ['dewy', 'coral', 'warm', 'glam'],
  },

  {
    id: 'thai_celestial',
    name: 'Thai Celestial',
    archetype: 'k_beauty',
    description: 'Ultra-smooth glass skin, gold and champagne halo eye, delicate liner, peachy-nude gloss. Thai skincare-forward beauty — Bangkok influencer meets royal celestial elegance.',
    products: [
      { category: 'foundation', shade_range: 'W10–N25', finish: 'glass', coverage: 'light-medium' },
      { category: 'eyeshadow', tones: ['gold', 'champagne', 'vanilla', 'ivory'] },
      { category: 'liner', style: 'delicate halo detail', colour: 'brown' },
      { category: 'lash', style: 'natural flutter' },
      { category: 'lip', shade: 'peachy-nude', finish: 'glassy' },
    ],
    wig_styles: [
      { id: 'kpop_idol_straight', name: 'Long Straight' },
      { id: 'curtain_bang_layers', name: 'Curtain-Bang Layers' },
    ],
    weights: { intensity: 0.42, warmth: 0.62, boldness: 0.35, texture: 0.88 },
    cultural_affinity: ['thai', 'thailand', 'bangkok', 'southeast asian'],
    tags: ['glass-skin', 'gold', 'delicate', 'celestial'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PACIFIC ISLANDER
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'polynesian_warrior',
    name: 'Polynesian Glow',
    archetype: 'caribbean_carnival',
    description: 'Bold graphic winged liner, sun-bronzed glowing skin, deep coral or berry lip. Celebrates Māori, Samoan, Tongan, Hawaiian and Fijian beauty. Tā moko and pe\'a are sacred, earned and personal, so this look uses its own graphic liner and never copies them.',
    products: [
      { category: 'foundation', shade_range: 'W20–N45', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['deep brown', 'bronze', 'terracotta', 'black'] },
      { category: 'liner', style: 'bold geometric graphic wing', colour: 'black' },
      { category: 'lash', style: 'full drama' },
      { category: 'lip', shade: 'deep coral or berry', finish: 'satin' },
      { category: 'bronzer', placement: 'sun-kissed all over' },
    ],
    wig_styles: [
      { id: 'kinky_coily_afro', name: 'Kinky Coily Afro (tight coil)' },
      { id: 'loose_deep_wave', name: 'Loose Deep Wave' },
      { id: 'bone_straight_long', name: 'Bone Straight' },
    ],
    weights: { intensity: 0.85, warmth: 0.85, boldness: 0.90, texture: 0.62 },
    cultural_affinity: ['polynesian', 'maori', 'samoan', 'tongan', 'hawaiian', 'fijian', 'pacific islander'],
    tags: ['graphic', 'bold', 'cultural', 'glow'],
  },

  {
    id: 'hawaiian_aloha',
    name: 'Hawaiian Aloha',
    archetype: 'caribbean_carnival',
    description: 'Sun-kissed bronzed glow, tropical warm coral eye, hibiscus-pink lip, natural flower accessory. Inspired by the flowers and warmth of Hawaiʻi, worn with respect for Kanaka Maoli (Native Hawaiian) culture.',
    products: [
      { category: 'foundation', shade_range: 'W15–N40', finish: 'dewy', coverage: 'medium' },
      { category: 'eyeshadow', tones: ['coral', 'warm peach', 'champagne', 'bronze'] },
      { category: 'liner', style: 'natural flick', colour: 'brown' },
      { category: 'lash', style: 'natural full' },
      { category: 'lip', shade: 'hibiscus pink or coral', finish: 'glossy' },
      { category: 'bronzer', placement: 'sun-kissed' },
      { category: 'accessories', flowers: 'plumeria hair flower' },
    ],
    wig_styles: [
      { id: 'loose_deep_wave', name: 'Loose Deep Wave' },
      { id: 'beach_wave_medium', name: 'Beach Wave' },
      { id: 'indian_remy_wavy', name: 'Indian Remy Wavy' },
    ],
    weights: { intensity: 0.58, warmth: 0.90, boldness: 0.55, texture: 0.70 },
    cultural_affinity: ['hawaiian', 'polynesian', 'pacific islander', 'aloha', 'hula'],
    tags: ['tropical', 'warm', 'floral', 'aloha'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INDIGENOUS / FIRST NATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'first_nations_powwow',
    name: 'First Nations Beadwork Glam',
    archetype: 'caribbean_carnival',
    description: 'Earth-tone eyeshadow in ochre, sienna and deep brown, defined warm brow, deep plum or berry lip, beaded earrings. Celebrates contemporary Indigenous beauty and the art of Indigenous beadwork (Cree, Anishinaabe, Lakota, Diné and many more Nations). Powwow regalia and ceremonial items are not costume, so this is an everyday and evening look, not regalia; buy beadwork from Indigenous artists.',
    products: [
      { category: 'foundation', shade_range: 'W20–N50', finish: 'satin', coverage: 'full' },
      { category: 'eyeshadow', tones: ['ochre', 'sienna', 'deep earth brown', 'copper'] },
      { category: 'liner', style: 'defined warm', colour: 'deep brown' },
      { category: 'lash', style: 'full natural' },
      { category: 'lip', shade: 'deep plum or berry', finish: 'satin' },
      { category: 'accessories', beading: 'beaded earrings by Indigenous artists' },
    ],
    wig_styles: [
      { id: 'bone_straight_long', name: 'Bone Straight' },
      { id: 'indian_remy_wavy', name: 'Indian Remy Wavy' },
      { id: 'loc_wig', name: 'Locs' },
    ],
    weights: { intensity: 0.75, warmth: 0.88, boldness: 0.70, texture: 0.62 },
    cultural_affinity: ['indigenous', 'first nations', 'native american', 'cree', 'anishinaabe', 'lakota', 'navajo', 'powwow'],
    tags: ['beadwork', 'earth-tones', 'cultural', 'warm'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CENTRAL ASIAN
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'central_asian_steppe',
    name: 'Central Asian Steppe Glam',
    archetype: 'gulf_glam',
    description: 'Luminous warm-olive base, bold almond kohl eye, strong defined brow, deep plum or rose lip. Kazakh, Uzbek, Kyrgyz, Tajik, Afghan beauty — Silk Road elegance.',
    products: [
      { category: 'foundation', shade_range: 'W10–N35', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['warm bronze', 'deep plum', 'gold', 'deep brown'] },
      { category: 'liner', style: 'kohl almond + defined', colour: 'black kohl' },
      { category: 'lash', style: 'full drama' },
      { category: 'brow', style: 'strong full defined' },
      { category: 'lip', shade: 'deep plum or warm rose', finish: 'satin' },
    ],
    wig_styles: [
      { id: 'bone_straight_long', name: 'Bone Straight' },
      { id: 'khaleeji_blowout', name: 'Khaleeji Blow-Out' },
      { id: 'indian_remy_wavy', name: 'Indian Remy Wavy' },
    ],
    weights: { intensity: 0.80, warmth: 0.72, boldness: 0.75, texture: 0.68 },
    cultural_affinity: ['kazakh', 'uzbek', 'kyrgyz', 'tajik', 'afghan', 'central asian', 'silk road'],
    tags: ['kohl', 'warm-olive', 'bold-brow', 'elegant'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MIXED HERITAGE
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'mixed_heritage_luminous',
    name: 'Mixed-Heritage Luminous',
    archetype: 'clean_minimal',
    description: 'Skin-forward dewy base celebrating ambiguous, multi-undertone complexions, warm bronze or rosé eye, defined natural brow, glossy your-lip-shade lip. For biracial, multiracial, and mixed-heritage beauties.',
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
    cultural_affinity: ['mixed', 'biracial', 'multiracial', 'blasian', 'hapa', 'afro-asian'],
    tags: ['luminous', 'glow', 'versatile', 'natural'],
  },

  {
    id: 'blasian_editorial',
    name: 'Blasian Editorial',
    archetype: 'k_beauty',
    description: 'The meeting of K-Beauty glass skin technique with Afrocentric colour boldness — glass-dewy base, dramatic kohl eye with gold shimmer, warm nude gloss. For Black-Asian mixed beauties.',
    products: [
      { category: 'foundation', shade_range: 'N25–N50', finish: 'glass-luminous', coverage: 'medium-full' },
      { category: 'eyeshadow', tones: ['gold shimmer', 'deep brown', 'champagne', 'black'] },
      { category: 'liner', style: 'kohl defined + inner corner shimmer', colour: 'black' },
      { category: 'lash', style: 'natural-dramatic' },
      { category: 'lip', shade: 'warm nude gloss', finish: 'glossy' },
    ],
    wig_styles: [
      { id: 'kinky_curly_mix', name: 'Kinky Curly Mix' },
      { id: 'beach_wave_medium', name: 'Beach Wave' },
      { id: 'highlighted_balayage', name: 'Balayage' },
    ],
    weights: { intensity: 0.70, warmth: 0.65, boldness: 0.65, texture: 0.72 },
    cultural_affinity: ['blasian', 'black-asian', 'mixed', 'biracial', 'afro-asian'],
    tags: ['glass-skin', 'editorial', 'kohl', 'mixed'],
  },

  {
    id: 'indo_arabian_fusion',
    name: 'Indo-Arabian Fusion',
    archetype: 'bollywood_bridal',
    description: 'Where Bollywood meets Gulf Glam — jewel-tone cut crease, kohl-heavy eye, heavy gold highlight, rose-berry or deep nude gloss. South Asian meets Arab beauty in one look.',
    products: [
      { category: 'foundation', shade_range: 'W10–N40', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['sapphire', 'plum', 'gold', 'deep brown'] },
      { category: 'liner', style: 'kohl heavy inner + outer + wing', colour: 'black kohl' },
      { category: 'lash', style: 'ultra-volume' },
      { category: 'highlight', placement: 'global blinding gold' },
      { category: 'lip', shade: 'rose-berry nude', finish: 'satin' },
    ],
    wig_styles: [
      { id: 'bollywood_blowout', name: 'Bollywood Blowout Waves' },
      { id: 'khaleeji_blowout', name: 'Khaleeji Blow-Out' },
      { id: 'indian_remy_wavy', name: 'Indian Remy Wavy' },
    ],
    weights: { intensity: 0.88, warmth: 0.78, boldness: 0.82, texture: 0.75 },
    cultural_affinity: ['south asian', 'arab', 'indian', 'gulf', 'fusion', 'south asian diaspora'],
    tags: ['fusion', 'jewel-tone', 'gold', 'kohl'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UNIVERSAL / OCCASION
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'clean_minimal',
    name: 'Clean Minimal',
    archetype: 'clean_minimal',
    description: 'Skin-first, product-light, effortless. Tinted moisturiser, subtle mascara, clear gloss, defined brow. Works for every skin tone — the canvas everything else is built on.',
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
    description: 'Warm neutral eye, subtle lash, glowing skin, pink-nude or mauve lip. The universal crowd-pleaser — beautiful for every community, every occasion, every skin tone.',
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

  {
    id: 'black_tie_gala',
    name: 'Black-Tie Gala',
    archetype: 'hip_hop_glam',
    description: 'The ultimate high-fashion full glam — sculpted contour, cut crease in black and gold or deep plum, ultra-volume lash, vampy deep lip. For every skin tone walking into every room they own.',
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

  {
    id: 'wedding_guest_universal',
    name: 'Wedding Guest Universal',
    archetype: 'clean_minimal',
    description: 'Long-wear glowing base, warm smoky eye, full lash, satin berry or rose lip. Every wedding, every culture, every role — bride\'s friend, guest, mother of — this look shows up.',
    products: [
      { category: 'foundation', shade_range: 'all', finish: 'satin', coverage: 'medium-full' },
      { category: 'eyeshadow', tones: ['warm brown', 'champagne', 'rose gold', 'soft bronze'] },
      { category: 'liner', style: 'defined wing', colour: 'black or brown' },
      { category: 'lash', style: 'full flutter' },
      { category: 'lip', shade: 'satin berry or dusty rose', finish: 'satin' },
    ],
    wig_styles: [
      { id: 'bone_straight_long', name: 'Bone Straight' },
      { id: 'indian_remy_wavy', name: 'Indian Remy Wavy' },
      { id: 'knotless_box_braids', name: 'Knotless Box Braids' },
    ],
    weights: { intensity: 0.65, warmth: 0.65, boldness: 0.58, texture: 0.62 },
    cultural_affinity: ['all', 'wedding', 'formal', 'occasion'],
    tags: ['occasion', 'universal', 'satin', 'warm'],
  },

  {
    id: 'office_power',
    name: 'Office Power',
    archetype: 'clean_minimal',
    description: 'Polished long-wear base, defined brow, neutral eye, bold structured lip in red, plum or deep nude. Walk into any boardroom, any culture, any city — fully put together.',
    products: [
      { category: 'foundation', shade_range: 'all', finish: 'natural-satin', coverage: 'medium-full' },
      { category: 'eyeshadow', tones: ['taupe', 'warm nude', 'soft brown'] },
      { category: 'liner', style: 'clean wing', colour: 'black or brown' },
      { category: 'brow', style: 'full defined groomed' },
      { category: 'lash', style: 'natural full' },
      { category: 'lip', shade: 'red, plum or deep nude', finish: 'matte or satin' },
    ],
    wig_styles: [
      { id: 'blunt_lob', name: 'Blunt Lob' },
      { id: 'silk_press_natural', name: 'Silk Press' },
      { id: 'sleek_bob', name: 'Sleek Bob' },
    ],
    weights: { intensity: 0.60, warmth: 0.55, boldness: 0.62, texture: 0.62 },
    cultural_affinity: ['all', 'professional', 'corporate', 'business'],
    tags: ['professional', 'power', 'polished', 'everyday'],
  },

  {
    id: 'festival_glitter',
    name: 'Festival Glitter',
    archetype: 'caribbean_carnival',
    description: 'Holographic glitter everywhere — eye, cheek, collarbone — glossy lip, festival-ready dewy skin. Coachella, Afropunk, Glastonbury, Lollapalooza — all communities, one vibe.',
    products: [
      { category: 'foundation', shade_range: 'all', finish: 'dewy', coverage: 'medium' },
      { category: 'glitter', placement: 'eye + cheek + body', type: 'holographic' },
      { category: 'liner', style: 'glitter liner', colour: 'holographic' },
      { category: 'lash', style: 'full natural' },
      { category: 'lip', shade: 'clear gloss or electric pink', finish: 'glossy' },
    ],
    wig_styles: [
      { id: 'coloured_wig', name: 'Bold Colour' },
      { id: 'curly_ombre', name: 'Curly Ombré' },
      { id: 'kinky_coily_afro', name: 'Kinky Coily Afro' },
    ],
    weights: { intensity: 0.82, warmth: 0.60, boldness: 0.92, texture: 0.82 },
    cultural_affinity: ['festival', 'coachella', 'afropunk', 'all communities', 'glitter'],
    tags: ['festival', 'glitter', 'holographic', 'fun'],
  },

  {
    id: 'date_night_drama',
    name: 'Date Night Drama',
    archetype: 'hip_hop_glam',
    description: 'Smoky eye, glowing skin, glossy or matte bold lip, lash, confidence. For every woman, every skin tone — this is the look you wear when you want to be seen.',
    products: [
      { category: 'foundation', shade_range: 'all', finish: 'luminous', coverage: 'full' },
      { category: 'eyeshadow', tones: ['your-favourite-smoke', 'champagne flash'] },
      { category: 'liner', style: 'smudged wing', colour: 'black' },
      { category: 'lash', style: 'full drama' },
      { category: 'lip', shade: 'bold or nude — your choice', finish: 'glossy or matte' },
    ],
    wig_styles: [
      { id: 'bone_straight_long', name: 'Bone Straight' },
      { id: 'loose_deep_wave', name: 'Loose Deep Wave' },
      { id: 'high_pony_sleek', name: 'High Sleek Ponytail' },
    ],
    weights: { intensity: 0.80, warmth: 0.60, boldness: 0.78, texture: 0.65 },
    cultural_affinity: ['all', 'date night', 'evening'],
    tags: ['smoky', 'drama', 'evening', 'universal'],
  },

  {
    id: 'graduation_glow',
    name: 'Graduation Glow',
    archetype: 'clean_minimal',
    description: 'Flawless blurring base, soft warm eye, bold brow, glossy full lip, photograph-perfect highlight. For every graduate, every culture, every cap-and-gown moment.',
    products: [
      { category: 'foundation', shade_range: 'all', finish: 'satin', coverage: 'full' },
      { category: 'eyeshadow', tones: ['warm champagne', 'soft brown', 'nude rose'] },
      { category: 'liner', style: 'defined clean', colour: 'black or brown' },
      { category: 'lash', style: 'full natural' },
      { category: 'lip', shade: 'glossy full nude or rose', finish: 'glossy' },
      { category: 'highlight', placement: 'cheekbone + nose', finish: 'natural radiance' },
    ],
    wig_styles: [
      { id: 'bone_straight_long', name: 'Bone Straight' },
      { id: 'silk_press_natural', name: 'Silk Press' },
      { id: 'knotless_box_braids', name: 'Knotless Box Braids' },
    ],
    weights: { intensity: 0.62, warmth: 0.65, boldness: 0.55, texture: 0.58 },
    cultural_affinity: ['all', 'graduation', 'milestone', 'celebration'],
    tags: ['milestone', 'glow', 'photograph-ready', 'universal'],
  },

  // Balance set (Oct 30): hijab, 50+, 65+, plus-size, disabled and under-shown communities

  {
    id: 'eid_glam_hijab',
    name: 'Eid Glam with Hijab',
    archetype: 'gulf_glam',
    description: 'Luminous satin base, soft gold-and-bronze shimmer lid, precise wing, fluttery lashes, rose-gold highlight and a warm rose-nude satin lip, framed by a neatly pinned hijab. Eid beauty for women who cover.',
    products: [
      { category: 'foundation', shade_range: 'all', finish: 'satin', coverage: 'medium' },
      { category: 'eyeshadow', tones: ['soft gold', 'bronze', 'champagne'] },
      { category: 'liner', style: 'precise wing', colour: 'black' },
      { category: 'lash', style: 'fluttery' },
      { category: 'highlight', placement: 'cheekbone', finish: 'rose gold' },
      { category: 'lip', shade: 'warm rose-nude', finish: 'satin' },
    ],
    wig_styles: [],
    weights: { intensity: 0.70, warmth: 0.68, boldness: 0.55, texture: 0.70 },
    cultural_affinity: ['muslim', 'eid', 'hijab', 'arab', 'south asian', 'north african', 'southeast asian'],
    tags: ['festive', 'occasion', 'glam', 'modest-beauty', 'hijab'],
  },

  {
    id: 'mature_50_glam',
    name: 'Radiant at 50+',
    archetype: 'clean_minimal',
    description: 'Satin (never flat matte) skin, soft plum-bronze eyes, a defined brow, warm berry satin lip and a cream blush lifted high on the cheekbone. Beauty that works with her lines, not against them.',
    products: [
      { category: 'foundation', shade_range: 'all', finish: 'satin', coverage: 'light-medium' },
      { category: 'eyeshadow', tones: ['plum', 'bronze', 'soft taupe'] },
      { category: 'brow', style: 'defined, softly filled' },
      { category: 'blush', shade: 'warm cream', finish: 'cream' },
      { category: 'lip', shade: 'warm berry', finish: 'satin' },
    ],
    wig_styles: [
      { id: 'pixie_cut', name: 'Pixie Cut' },
      { id: 'blunt_lob', name: 'Blunt Lob' },
    ],
    weights: { intensity: 0.50, warmth: 0.66, boldness: 0.45, texture: 0.70 },
    cultural_affinity: ['all', 'mature', 'over 50', 'black', 'african american'],
    tags: ['mature', 'satin', 'radiant', 'universal'],
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
  // Plain similarity of the four taste dimensions (0-1). No bonuses and no clamp, so it never shows a
  // made-up 1.00; Qloo evidence is added separately by recommendLooks.
  return (dims.intensity + dims.warmth + dims.boldness + dims.texture) / 4;
}

const ARCH_ALIAS = { amapiano_beat: ['afro_glam'], bollywood_bridal: ['desi_glam'] };
const wordRe = k => new RegExp(`(^|[^a-z0-9])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`);
const normTag = s => String(s ?? '').toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Qloo tags that speak for a look: tags matching its own cultural words count double, tags matching
 * only its archetype's keywords count once. Returns tags with their evidence weight.
 */
export function lookEvidence(look, tags, archetypeKeywords) {
  const archWords = [...(archetypeKeywords[look.archetype] ?? []), ...(ARCH_ALIAS[look.archetype] ?? []).flatMap(a => archetypeKeywords[a] ?? [])].map(normTag);
  const own = [...(look.cultural_affinity ?? []), ...(look.tags ?? [])].map(normTag).filter(w => w.length > 2 && !['all', 'everyday', 'celebration', 'milestone', 'graduation', 'glam', 'bold', 'natural', 'soft'].includes(w));
  const archRe = [...new Set(archWords)].map(wordRe), ownRe = [...new Set(own)].map(wordRe);
  const out = [];
  for (const t of tags) {
    const n = normTag(t.name), base = t.weight ?? t.affinity ?? 1;
    const o = ownRe.some(re => re.test(n)), a = archRe.some(re => re.test(n));
    if (o || a) out.push({ ...t, ev: base * (o ? 2 : 1) });
  }
  return out.sort((x, y) => y.ev - x.ev);
}

/**
 * Rank looks. Without evidence: by taste-vector fit alone (1 - mean distance on four dimensions).
 * With Qloo evidence (kept tags with affinity): half vector fit, half the share of Qloo's affinity
 * that points at the look. No clamping, no bonuses: the score is what was computed.
 */
export function recommendLooks(vec, { topN = 5, minScore = 0.2, evidence = null, archetypeKeywords = null } = {}) {
  const useEv = Array.isArray(evidence) && evidence.length > 0 && archetypeKeywords;
  const totalAff = useEv ? 2 * evidence.reduce((a, t) => a + (t.weight ?? t.affinity ?? 1), 0) : 0;
  const scored = LOOKS.map(look => {
    const w = look.weights;
    const fit = 1 - (Math.abs(vec.intensity - w.intensity) + Math.abs(vec.warmth - w.warmth) + Math.abs(vec.boldness - w.boldness) + Math.abs(vec.texture - w.texture)) / 4;
    if (!useEv) return { look, score: fit, fit, qlooEvidence: null, evidenceTags: [] };
    const ev = lookEvidence(look, evidence, archetypeKeywords);
    const share = ev.reduce((a, t) => a + t.ev, 0) / totalAff;
    return { look, score: 0.5 * fit + 0.5 * share, fit, qlooEvidence: share, evidenceTags: ev.slice(0, 5).map(t => t.name) };
  })
    .filter(r => r.score >= minScore)
    .sort((a, b) => b.score - a.score || b.fit - a.fit)
    .slice(0, topN);

  return scored.map(r => ({
    look: r.look,
    score: Math.round(r.score * 100) / 100,
    fit: Math.round(r.fit * 100) / 100,
    qlooEvidence: r.qlooEvidence == null ? null : Math.round(r.qlooEvidence * 100) / 100,
    evidenceTags: r.evidenceTags,
    wigStyle: pickWig(r.look, vec),
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
