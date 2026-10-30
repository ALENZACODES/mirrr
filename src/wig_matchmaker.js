/**
 * MIRRR Wig Matchmaker
 *
 * 35-style wig catalogue covering every wig type that exists — from natural
 * kinky afros to Nilotic locs, from Khaleeji blowouts to K-pop idol cuts,
 * from Senegalese twists to Peruvian body waves to fulani braids.
 *
 * Wigs are a cornerstone of Black, South Asian, Arab, and Caribbean beauty.
 * MIRRR leads with them. No style left out.
 */

export const WIG_CATALOGUE = [

  // ── NATURAL KINKY / COILY ─────────────────────────────────────────────────
  {
    id: 'kinky_coily_afro',
    name: 'Kinky Coily Afro',
    texture: 'kinky-coily',
    length: 'short-medium',
    colours: ['natural-black', 'dark-brown'],
    finish: 'natural',
    archetype_fit: ['afro_glam', 'hip_hop_glam', 'clean_minimal'],
    communities: ['west_african', 'east_african', 'black_american', 'caribbean', 'south_african'],
    hair_vibe_match: ['natural-afro'],
    tags: ['protective', 'natural', 'statement', 'low-maintenance'],
    description: 'Defined coils, full volume — your crown, amplified.',
  },
  {
    id: 'big_chop_fro',
    name: 'Big Chop Fro',
    texture: 'kinky',
    length: 'short',
    colours: ['natural-black', 'dark-brown', 'auburn'],
    finish: 'natural',
    archetype_fit: ['afro_glam', 'clean_minimal', 'amapiano_beat'],
    communities: ['west_african', 'east_african', 'black_american', 'south_african'],
    hair_vibe_match: ['natural-afro'],
    tags: ['statement', 'editorial', 'bold'],
    description: 'Short, full, unapologetically natural. The ultimate power move.',
  },
  {
    id: 'twist_out_natural',
    name: 'Twist-Out Natural',
    texture: 'kinky-curly',
    length: 'medium',
    colours: ['natural-black', 'dark-brown', 'honey-brown'],
    finish: 'natural',
    archetype_fit: ['afro_glam', 'clean_minimal', 'hip_hop_glam'],
    communities: ['west_african', 'black_american', 'caribbean', 'south_african'],
    hair_vibe_match: ['natural-afro'],
    tags: ['protective', 'versatile', 'natural'],
    description: 'Juicy, defined twist-out coils with bounce and body.',
  },
  {
    id: 'stretched_puff',
    name: 'Blown-Out Stretched Puff',
    texture: 'kinky-straight',
    length: 'medium',
    colours: ['natural-black', 'dark-brown', 'honey'],
    finish: 'natural',
    archetype_fit: ['afro_glam', 'hip_hop_glam'],
    communities: ['black_american', 'west_african', 'caribbean'],
    hair_vibe_match: ['natural-afro'],
    tags: ['voluminous', 'textured', 'halo'],
    description: 'Stretched and blown out — big halo puff energy, all volume.',
  },
  {
    id: 'loc_wig',
    name: 'Locs (Medium Length)',
    texture: 'locs',
    length: 'medium',
    colours: ['natural-black', 'dark-brown', 'burgundy', 'blonde'],
    finish: 'natural',
    archetype_fit: ['afro_glam', 'clean_minimal', 'amapiano_beat'],
    communities: ['west_african', 'black_american', 'caribbean', 'east_african', 'south_african'],
    hair_vibe_match: ['natural-afro', 'locs'],
    tags: ['spiritual', 'cultural', 'protective', 'statement'],
    description: 'Gorgeous, defined locs — cultural roots worn with pride.',
  },
  {
    id: 'faux_locs',
    name: 'Faux Locs (Long)',
    texture: 'faux-locs',
    length: 'long',
    colours: ['natural-black', 'dark-brown', 'auburn', 'honey-blonde'],
    finish: 'natural',
    archetype_fit: ['afro_glam', 'hip_hop_glam', 'caribbean_carnival'],
    communities: ['west_african', 'black_american', 'caribbean'],
    hair_vibe_match: ['natural-afro', 'locs'],
    tags: ['bohemian', 'protective', 'statement'],
    description: 'Effortlessly textured faux locs — bohemian and protective.',
  },
  {
    id: 'butterfly_locs',
    name: 'Butterfly Locs',
    texture: 'butterfly-locs',
    length: 'long',
    colours: ['natural-black', 'dark-brown', 'burgundy', 'caramel'],
    finish: 'natural',
    archetype_fit: ['afro_glam', 'hip_hop_glam'],
    communities: ['black_american', 'west_african', 'caribbean'],
    hair_vibe_match: ['natural-afro', 'locs'],
    tags: ['bohemian', 'romantic', 'textured', 'protective'],
    description: 'Soft, distressed butterfly locs with wispy, romantic texture.',
  },
  {
    id: 'sister_locs',
    name: 'Sisterlocks / Micro Locs',
    texture: 'micro-locs',
    length: 'medium',
    colours: ['natural-black', 'dark-brown'],
    finish: 'natural',
    archetype_fit: ['afro_glam', 'clean_minimal'],
    communities: ['black_american', 'west_african', 'caribbean'],
    hair_vibe_match: ['natural-afro', 'locs'],
    tags: ['refined', 'versatile', 'natural', 'elegant'],
    description: 'Tiny, neat micro locs — sophisticated natural texture at its finest.',
  },

  // ── BRAIDED / PROTECTIVE ──────────────────────────────────────────────────
  {
    id: 'knotless_box_braids',
    name: 'Knotless Box Braids',
    texture: 'braided',
    length: 'long',
    colours: ['natural-black', 'dark-brown', 'honey-brown', 'blonde', 'burgundy'],
    finish: 'matte',
    archetype_fit: ['afro_glam', 'hip_hop_glam', 'caribbean_carnival'],
    communities: ['west_african', 'black_american', 'caribbean', 'south_african'],
    hair_vibe_match: ['natural-afro', 'braided'],
    tags: ['protective', 'versatile', 'cultural', 'low-tension'],
    description: 'Tension-free knotless braids — traditional roots, modern wear.',
  },
  {
    id: 'jumbo_box_braids',
    name: 'Jumbo Box Braids',
    texture: 'braided',
    length: 'long',
    colours: ['natural-black', 'dark-brown', 'blonde', 'red', 'blue'],
    finish: 'matte',
    archetype_fit: ['afro_glam', 'hip_hop_glam', 'caribbean_carnival'],
    communities: ['west_african', 'black_american', 'caribbean'],
    hair_vibe_match: ['natural-afro', 'braided'],
    tags: ['bold', 'statement', 'fast-install', 'protective'],
    description: 'Chunky jumbo braids — big, bold, zero apologies.',
  },
  {
    id: 'senegalese_twists',
    name: 'Senegalese Twists',
    texture: 'twist-braided',
    length: 'long',
    colours: ['natural-black', 'dark-brown', 'honey', 'auburn'],
    finish: 'silky',
    archetype_fit: ['afro_glam', 'hip_hop_glam', 'clean_minimal'],
    communities: ['west_african', 'black_american', 'caribbean'],
    hair_vibe_match: ['natural-afro', 'braided'],
    tags: ['elegant', 'silky', 'protective', 'cultural'],
    description: 'Sleek, rope-like Senegalese twists — elegant and enduring.',
  },
  {
    id: 'fulani_braids',
    name: 'Fulani Braids',
    texture: 'braided',
    length: 'medium',
    colours: ['natural-black', 'dark-brown', 'auburn'],
    finish: 'natural',
    archetype_fit: ['afro_glam', 'clean_minimal'],
    communities: ['west_african'],
    hair_vibe_match: ['natural-afro', 'braided'],
    tags: ['cultural', 'traditional', 'tribal', 'statement'],
    description: 'Traditional Fulani braids with centre part and accessories — heritage beauty.',
  },
  {
    id: 'goddess_braids',
    name: 'Goddess Braids',
    texture: 'cornrow-braided',
    length: 'medium',
    colours: ['natural-black', 'dark-brown', 'honey'],
    finish: 'natural',
    archetype_fit: ['afro_glam', 'caribbean_carnival'],
    communities: ['west_african', 'black_american', 'caribbean'],
    hair_vibe_match: ['natural-afro', 'braided'],
    tags: ['regal', 'cultural', 'protective', 'editorial'],
    description: 'Thick, chunky cornrow-style goddess braids — regal and editorial.',
  },
  {
    id: 'passion_twists',
    name: 'Passion Twists',
    texture: 'curly-twist',
    length: 'long',
    colours: ['natural-black', 'dark-brown', 'honey', 'auburn', 'peach'],
    finish: 'natural',
    archetype_fit: ['afro_glam', 'hip_hop_glam'],
    communities: ['black_american', 'caribbean', 'west_african'],
    hair_vibe_match: ['natural-afro', 'braided'],
    tags: ['romantic', 'bohemian', 'protective', 'textured'],
    description: 'Springy, curly-tipped passion twists — soft and gorgeous.',
  },
  {
    id: 'spring_twist',
    name: 'Spring / Bomb Twists',
    texture: 'kinky-twist',
    length: 'medium',
    colours: ['natural-black', 'dark-brown', 'honey', 'burgundy'],
    finish: 'natural',
    archetype_fit: ['afro_glam', 'clean_minimal'],
    communities: ['black_american', 'west_african', 'caribbean'],
    hair_vibe_match: ['natural-afro', 'braided'],
    tags: ['fluffy', 'soft', 'protective', 'light'],
    description: 'Ultra-light, fluffy spring twists — airy and effortless.',
  },

  // ── SLEEK / STRAIGHT ──────────────────────────────────────────────────────
  {
    id: 'bone_straight_long',
    name: 'Bone Straight (Long)',
    texture: 'straight',
    length: 'long',
    colours: ['jet-black', 'natural-black', 'dark-brown', 'warm-brown'],
    finish: 'silky',
    archetype_fit: ['hip_hop_glam', 'gulf_glam', 'clean_minimal', 'bollywood_bridal'],
    communities: ['black_american', 'arab', 'latina', 'east_asian', 'south_asian'],
    hair_vibe_match: ['long-sleek-wig', 'straight-sleek', 'long-silky'],
    tags: ['sleek', 'versatile', 'high-gloss'],
    description: 'Pin-straight, glass-smooth, endless length.',
  },
  {
    id: 'ultra_silky_xl',
    name: 'Ultra Silky Extra-Long',
    texture: 'silky-straight',
    length: 'extra-long',
    colours: ['jet-black', 'natural-black', 'warm-brown'],
    finish: 'mirror-gloss',
    archetype_fit: ['gulf_glam', 'bollywood_bridal', 'hip_hop_glam'],
    communities: ['arab', 'south_asian', 'east_asian', 'black_american'],
    hair_vibe_match: ['long-silky', 'long-sleek-wig'],
    tags: ['luxe', 'statement', 'bridal', 'editorial'],
    description: 'Mirror-gloss silk, floor-grazing length — Gulf luxury defined.',
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
    hair_vibe_match: ['straight-sleek'],
    tags: ['chic', 'editorial', 'low-maintenance'],
    description: 'The classic chic bob — sharp, sleek, effortlessly modern.',
  },
  {
    id: 'blunt_lob',
    name: 'Blunt Lob (Long Bob)',
    texture: 'straight',
    length: 'lob',
    colours: ['natural-black', 'dark-brown', 'honey-brown', 'ash-brown'],
    finish: 'silky',
    archetype_fit: ['k_beauty_glass', 'gulf_glam', 'clean_minimal', 'latina_glam'],
    communities: ['east_asian', 'arab', 'southeast_asian', 'latina'],
    hair_vibe_match: ['straight-sleek', 'long-silky'],
    tags: ['minimalist', 'versatile'],
    description: 'Blunt ends, mid-length, the understated power cut.',
  },
  {
    id: 'curtain_bang_layers',
    name: 'Curtain-Bang Silk Layers',
    texture: 'straight',
    length: 'long',
    colours: ['natural-black', 'dark-brown', 'ash-brown'],
    finish: 'silky',
    archetype_fit: ['gulf_glam', 'k_beauty_glass', 'clean_minimal'],
    communities: ['arab', 'east_asian', 'southeast_asian'],
    hair_vibe_match: ['long-silky', 'straight-sleek'],
    tags: ['editorial', 'face-framing', 'romantic'],
    description: 'Curtain bangs with long silk layers — the K-beauty update.',
  },
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
  {
    id: 'silk_press_natural',
    name: 'Silk Press (Natural Hair)',
    texture: 'silk-press-straight',
    length: 'medium',
    colours: ['natural-black', 'dark-brown', 'honey'],
    finish: 'silky',
    archetype_fit: ['hip_hop_glam', 'clean_minimal', 'afro_glam'],
    communities: ['black_american', 'caribbean', 'west_african'],
    hair_vibe_match: ['straight-sleek', 'long-sleek-wig'],
    tags: ['silk-press', 'sleek', 'versatile', 'natural-hair-alternative'],
    description: 'The silk press glow — natural hair, heat-styled to mirror perfection.',
  },
  {
    id: 'pixie_cut',
    name: 'Pixie Cut',
    texture: 'straight',
    length: 'pixie',
    colours: ['natural-black', 'dark-brown', 'auburn', 'platinum', 'burgundy'],
    finish: 'silky',
    archetype_fit: ['clean_minimal', 'afro_glam', 'k_beauty_glass'],
    communities: ['black_american', 'east_asian', 'latina', 'mixed'],
    hair_vibe_match: ['straight-sleek'],
    tags: ['editorial', 'bold', 'cropped', 'statement'],
    description: 'The iconic pixie cut — cropped, fierce, and unforgettable.',
  },

  // ── WAVY ──────────────────────────────────────────────────────────────────
  {
    id: 'indian_remy_wavy',
    name: 'Indian Remy Wavy (Long)',
    texture: 'wavy',
    length: 'long',
    colours: ['jet-black', 'natural-black', 'dark-brown'],
    finish: 'silky',
    archetype_fit: ['bollywood_bridal', 'gulf_glam', 'latina_glam'],
    communities: ['south_asian', 'arab', 'latina'],
    hair_vibe_match: ['long-wavy-indian', 'long-silky'],
    tags: ['bridal', 'luxe', 'traditional-modern'],
    description: 'Full, flowing waves in authentic Indian Remy — wedding-ready.',
  },
  {
    id: 'peruvian_body_wave',
    name: 'Peruvian Body Wave',
    texture: 'wavy',
    length: 'long',
    colours: ['natural-black', 'dark-brown', 'warm-brown'],
    finish: 'silky',
    archetype_fit: ['latina_glam', 'hip_hop_glam', 'caribbean_carnival'],
    communities: ['latina', 'black_american', 'caribbean'],
    hair_vibe_match: ['long-wavy-indian', 'long-sleek-wig'],
    tags: ['voluminous', 'soft', 'luxe'],
    description: 'Lush Peruvian body wave with serious volume and natural movement.',
  },
  {
    id: 'beach_wave_medium',
    name: 'Beach Wave (Medium)',
    texture: 'wavy',
    length: 'medium',
    colours: ['natural-black', 'dark-brown', 'honey-brown', 'golden-blonde'],
    finish: 'natural',
    archetype_fit: ['latina_glam', 'clean_minimal', 'bollywood_bridal'],
    communities: ['latina', 'south_asian', 'mixed', 'arab'],
    hair_vibe_match: ['long-wavy-indian'],
    tags: ['effortless', 'versatile', 'everyday'],
    description: 'Relaxed, sun-kissed waves — effortless and always pretty.',
  },
  {
    id: 'loose_deep_wave',
    name: 'Loose Deep Wave',
    texture: 'loose-wave',
    length: 'long',
    colours: ['natural-black', 'dark-brown', 'burgundy', 'auburn'],
    finish: 'silky',
    archetype_fit: ['hip_hop_glam', 'afro_glam', 'caribbean_carnival'],
    communities: ['black_american', 'caribbean', 'latina'],
    hair_vibe_match: ['long-sleek-wig', 'long-wavy-indian'],
    tags: ['voluminous', 'glamorous', 'versatile'],
    description: 'Deeply defined loose waves with movement and gloss.',
  },

  // ── CURLY ─────────────────────────────────────────────────────────────────
  {
    id: 'curly_ombre',
    name: 'Curly Ombré',
    texture: 'curly',
    length: 'long',
    colours: ['black-to-honey', 'brown-to-caramel', 'black-to-auburn', 'black-to-burgundy'],
    finish: 'natural',
    archetype_fit: ['caribbean_carnival', 'latina_glam', 'hip_hop_glam'],
    communities: ['caribbean', 'latina', 'black_american'],
    hair_vibe_match: ['curly-ombre'],
    tags: ['festival', 'statement', 'colour'],
    description: 'Defined curls graduating into sun-kissed colour — festival gold.',
  },
  {
    id: 'water_wave',
    name: 'Water Wave',
    texture: 'water-wave',
    length: 'long',
    colours: ['natural-black', 'dark-brown', 'honey', 'auburn'],
    finish: 'natural',
    archetype_fit: ['afro_glam', 'caribbean_carnival', 'latina_glam'],
    communities: ['black_american', 'caribbean', 'west_african'],
    hair_vibe_match: ['curly-ombre', 'long-wavy-indian'],
    tags: ['bouncy', 'voluminous', 'romantic'],
    description: 'Tight, rippling water waves — bouncy, full, and gorgeous.',
  },
  {
    id: 'kinky_curly_mix',
    name: 'Kinky Curly Mix',
    texture: 'kinky-curly',
    length: 'medium',
    colours: ['natural-black', 'dark-brown', 'honey'],
    finish: 'natural',
    archetype_fit: ['afro_glam', 'hip_hop_glam', 'clean_minimal'],
    communities: ['black_american', 'caribbean', 'mixed', 'west_african'],
    hair_vibe_match: ['natural-afro', 'curly-ombre'],
    tags: ['natural', 'textured', 'mixed-hair'],
    description: 'Kinky-curly blend — natural coil texture with curl definition.',
  },
  {
    id: 'jerry_curl',
    name: 'Jerry Curl / Loose Curl',
    texture: 'loose-curl',
    length: 'medium',
    colours: ['natural-black', 'dark-brown', 'wet-look-black'],
    finish: 'wet-look',
    archetype_fit: ['hip_hop_glam', 'afro_glam'],
    communities: ['black_american', 'caribbean'],
    hair_vibe_match: ['curly-ombre'],
    tags: ['retro', 'wet-look', 'nostalgic', 'glossy'],
    description: 'Classic Jerry curl — wet-look glossy coils with old-school glam energy.',
  },

  // ── KHALEEJI / VOLUMINOUS ────────────────────────────────────────────────
  {
    id: 'khaleeji_blowout',
    name: 'Khaleeji Voluminous Blow-Out',
    texture: 'voluminous-straight',
    length: 'extra-long',
    colours: ['jet-black', 'dark-brunette', 'deep-espresso'],
    finish: 'glossy',
    archetype_fit: ['gulf_glam', 'arab_chic'],
    communities: ['arab', 'south_asian', 'east_african'],
    hair_vibe_match: ['long-silky', 'long-sleek-wig'],
    tags: ['voluminous', 'luxe', 'Gulf', 'statement'],
    description: 'Sky-high volume with a perfect blow-out — Khaleeji beauty at its peak.',
  },
  {
    id: 'bollywood_blowout',
    name: 'Bollywood Blowout Waves',
    texture: 'voluminous-wavy',
    length: 'long',
    colours: ['jet-black', 'dark-brown', 'warm-black'],
    finish: 'glossy',
    archetype_fit: ['bollywood_bridal', 'desi_glam', 'gulf_glam'],
    communities: ['south_asian', 'arab'],
    hair_vibe_match: ['long-wavy-indian', 'long-silky'],
    tags: ['voluminous', 'cinematic', 'bridal', 'romantic'],
    description: 'The Bollywood blow-out — lush, cinematic, deeply romantic waves.',
  },

  // ── UPDO / SLEEK ────────────────────────────────────────────────────────
  {
    id: 'slicked_bun',
    name: 'Sleek Slicked Bun',
    texture: 'straight',
    length: 'updo',
    colours: ['jet-black', 'natural-black', 'dark-brown'],
    finish: 'silky',
    archetype_fit: ['clean_minimal', 'gulf_glam', 'k_beauty_glass'],
    communities: ['east_asian', 'arab', 'black_american', 'south_asian'],
    hair_vibe_match: ['straight-sleek'],
    tags: ['sleek', 'chic', 'editorial', 'sculpted'],
    description: 'Baby-hair-slicked, gel-smooth bun — the ultimate controlled glam.',
  },
  {
    id: 'high_pony_sleek',
    name: 'High Sleek Ponytail',
    texture: 'straight',
    length: 'long',
    colours: ['jet-black', 'natural-black', 'warm-brown', 'honey'],
    finish: 'silky',
    archetype_fit: ['hip_hop_glam', 'clean_minimal', 'latina_glam'],
    communities: ['black_american', 'latina', 'east_asian', 'arab'],
    hair_vibe_match: ['straight-sleek', 'long-sleek-wig'],
    tags: ['sleek', 'versatile', 'statement', 'everyday-glam'],
    description: 'Sky-high sleek ponytail — the beauty power move.',
  },

  // ── COLOUR / STATEMENT ────────────────────────────────────────────────────
  {
    id: 'coloured_wig',
    name: 'Bold Colour Wig',
    texture: 'straight',
    length: 'medium',
    colours: ['platinum-blonde', 'hot-pink', 'silver', 'red', 'cobalt-blue', 'lavender', 'orange'],
    finish: 'silky',
    archetype_fit: ['hip_hop_glam', 'afro_glam', 'caribbean_carnival'],
    communities: ['black_american', 'caribbean', 'mixed'],
    hair_vibe_match: ['long-sleek-wig'],
    tags: ['bold', 'colour', 'statement', 'creative'],
    description: 'Go full colour — platinum, pink, cobalt, red. No limits.',
  },
  {
    id: 'highlighted_balayage',
    name: 'Balayage / Highlighted',
    texture: 'wavy',
    length: 'long',
    colours: ['brunette-to-caramel', 'black-to-honey', 'dark-to-copper', 'brown-to-gold'],
    finish: 'natural',
    archetype_fit: ['latina_glam', 'hip_hop_glam', 'clean_minimal'],
    communities: ['latina', 'black_american', 'mixed', 'arab'],
    hair_vibe_match: ['long-wavy-indian', 'curly-ombre'],
    tags: ['sun-kissed', 'dimensional', 'natural'],
    description: 'Hand-painted balayage — lived-in colour that catches every light.',
  },
  // Batch 12
  {
    id: 'coloured_wig_silver',
    name: 'Silver / Platinum Wig',
    texture: 'straight',
    length: 'medium',
    colours: ['silver', 'platinum', 'grey', 'ice'],
    finish: 'silky',
    archetype_fit: ['afro_glam', 'hip_hop_glam', 'clean_minimal'],
    communities: ['black_american', 'afro_diaspora', 'mixed'],
    hair_vibe_match: ['long-sleek-wig', 'colour-wig'],
    tags: ['silver', 'bold', 'statement', 'editorial'],
    description: 'Ice-cool silver and platinum — an editorial statement that commands every room.',
  },
  {
    id: 'afro_editorial',
    name: 'Afro Editorial',
    texture: 'kinky',
    length: 'medium',
    colours: ['black', 'dark-brown', 'natural'],
    finish: 'natural',
    archetype_fit: ['afro_glam', 'afrocentric_maximalist', 'hip_hop_glam'],
    communities: ['black_american', 'west_african', 'east_african', 'south_african', 'caribbean'],
    hair_vibe_match: ['big-natural-fro', 'natural-kinky'],
    tags: ['natural', 'bold', 'afro', 'editorial', 'statement'],
    description: 'A sculptural afro shaped for the runway — natural texture turned high art.',
  },
  {
    id: 'box_braids_updo',
    name: 'Box Braids Updo',
    texture: 'braided',
    length: 'updo',
    colours: ['black', 'dark-brown', 'caramel', 'burgundy'],
    finish: 'natural',
    archetype_fit: ['afrocentric_maximalist', 'afro_glam', 'hip_hop_glam'],
    communities: ['black_american', 'west_african', 'caribbean', 'afro_diaspora'],
    hair_vibe_match: ['box-braids', 'protective-style'],
    tags: ['braided', 'updo', 'protective', 'elegant'],
    description: 'Box braids swept up into a regal updo — protective style meets formal elegance.',
  },
  {
    id: 'cornrow_sleek',
    name: 'Cornrow Sleek',
    texture: 'braided',
    length: 'short',
    colours: ['black', 'dark-brown'],
    finish: 'natural',
    archetype_fit: ['clean_minimal', 'afrocentric_maximalist', 'hip_hop_glam'],
    communities: ['black_american', 'west_african', 'caribbean', 'afro_diaspora'],
    hair_vibe_match: ['protective-style', 'cornrows'],
    tags: ['sleek', 'cornrows', 'protective', 'neat'],
    description: 'Clean cornrows laid flat — effortlessly sleek and always timeless.',
  },
  {
    id: 'jewelled_updo',
    name: 'Jewelled Updo',
    texture: 'straight',
    length: 'updo',
    colours: ['black', 'dark-brown', 'brunette'],
    finish: 'silky',
    archetype_fit: ['bollywood_maximalist', 'afro_glam', 'arab_luxury'],
    communities: ['south_asian', 'black_american', 'arab', 'mixed'],
    hair_vibe_match: ['sleek-updo', 'bridal'],
    tags: ['updo', 'jewelled', 'bridal', 'formal', 'luxury'],
    description: 'An embellished updo adorned with jewels — made for weddings, galas, and grand occasions.',
  },
];

// ---------------------------------------------------------------------------
// Wig Matchmaker API
// ---------------------------------------------------------------------------

/** True when a wig fits a texture filter id from getWigTextures(). */
export function wigHasTexture(wig, textureId) {
  if (textureId === 'colour') return (wig.tags ?? []).includes('colour');
  return String(wig.texture ?? '').includes(textureId);
}

export function matchWigs({ aesthetic = {}, communityId = 'mixed', lengthPref = null, texturePref = null, topN = 6 }) {
  const hairVibe = aesthetic.hair_vibe ?? 'natural';

  // Apply length and texture as hard filters when specified (not 'any' / empty)
  const effectiveLength = lengthPref && lengthPref !== 'any' ? lengthPref : null;
  const effectiveTexture = texturePref && texturePref !== 'any' ? texturePref : null;

  return WIG_CATALOGUE
    .filter(wig => {
      // Hard filter: only show wigs matching the selected length
      if (effectiveLength && wig.length !== effectiveLength) return false;
      // Hard filter: only show wigs matching the selected texture (substring match). "Bold Colour"
      // is a colour, not a curl pattern, so it matches wigs tagged as colour statements.
      if (effectiveTexture && !wigHasTexture(wig, effectiveTexture)) return false;
      return true;
    })
    .map(wig => {
      // Three yes/no checks, ranked hair vibe first, then community, then look style. The result
      // says which matched; it is not a percentage.
      const criteria = {
        hairVibe: wig.hair_vibe_match.includes(hairVibe),
        community: wig.communities.includes(communityId),
        lookStyle: !!aesthetic.archetypes?.some(a => wig.archetype_fit.includes(a)),
      };
      const score = (criteria.hairVibe ? 4 : 0) + (criteria.community ? 2 : 0) + (criteria.lookStyle ? 1 : 0);
      const reason = buildReason(wig, hairVibe, communityId, aesthetic);
      return { wig, score, rank: score, criteria, matched: Object.values(criteria).filter(Boolean).length, of: 3, reason };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

/** Points per ranking check (shown to the user so the order is explainable). */
export const WIG_CHECK_POINTS = { hairVibe: 4, community: 2, lookStyle: 1 };

/**
 * Wig Match for the UI: every returned wig satisfies every selected filter. When no wig in the
 * catalogue fits all of them, `wigs` is empty and `nearest` lists wigs that keep one filter and
 * drop the other, each group labelled with what was kept, so nothing is passed off as a match.
 */
export function matchWigsForFilters({ aesthetic = {}, communityId = 'mixed', lengthPref = null, texturePref = null, topN = 6 } = {}) {
  const len = lengthPref && lengthPref !== 'any' ? lengthPref : null;
  const tex = texturePref && texturePref !== 'any' ? texturePref : null;
  const wigs = matchWigs({ aesthetic, communityId, lengthPref: len, texturePref: tex, topN });
  const total = WIG_CATALOGUE.length;
  if (wigs.length || (!len && !tex)) return { wigs, filters: { length: len, texture: tex }, total, nearest: [] };
  const nearest = [];
  if (len && tex) {
    const keepTex = matchWigs({ aesthetic, communityId, texturePref: tex, topN: 3 });
    const keepLen = matchWigs({ aesthetic, communityId, lengthPref: len, topN: 3 });
    if (keepTex.length) nearest.push({ kept: 'texture', dropped: 'length', wigs: keepTex });
    if (keepLen.length) nearest.push({ kept: 'length', dropped: 'texture', wigs: keepLen });
  }
  return { wigs: [], filters: { length: len, texture: tex }, total, nearest };
}

function buildReason(wig, hairVibe, communityId, aesthetic) {
  const parts = [];
  if (wig.hair_vibe_match.includes(hairVibe)) parts.push(`matches your ${hairVibe.replace(/-/g, ' ')} vibe`);
  if (wig.communities.includes(communityId)) parts.push('popular in your community');
  if (aesthetic.archetypes?.some(a => wig.archetype_fit.includes(a))) {
    parts.push(`pairs with ${wig.archetype_fit[0].replace(/_/g, ' ')} look`);
  }
  return parts.slice(0, 2).join(' · ') || 'versatile choice';
}

export function getWigLengths() {
  return [
    { id: 'any',        label: 'Any length' },
    { id: 'pixie',      label: 'Pixie' },
    { id: 'short',      label: 'Short' },
    { id: 'bob',        label: 'Bob' },
    { id: 'lob',        label: 'Lob (long bob)' },
    { id: 'medium',     label: 'Medium' },
    { id: 'long',       label: 'Long' },
    { id: 'extra-long', label: 'Extra long' },
    { id: 'updo',       label: 'Updo' },
  ];
}

export function getWigTextures() {
  return [
    { id: 'any',           label: 'Any texture' },
    { id: 'straight',      label: 'Straight / Silky' },
    { id: 'wavy',          label: 'Wavy' },
    { id: 'curly',         label: 'Curly' },
    { id: 'kinky',         label: 'Kinky / Natural' },
    { id: 'braided',       label: 'Braided / Protective' },
    { id: 'locs',          label: 'Locs / Dreadlocks' },
    { id: 'twist-braided', label: 'Twists' },
    { id: 'voluminous',    label: 'Voluminous / Blow-Out' },
    { id: 'colour',        label: 'Bold Colour' },
  ];
}

export function getWigCatalogue() { return WIG_CATALOGUE; }
