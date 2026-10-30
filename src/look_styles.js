/**
 * look_styles.js — Comprehensive multicultural beauty look style database for MIRRR
 * 38 looks across 9 communities, plus 4 for everyone; every look can be worn on any skin
 */

export const LOOK_CATEGORIES = {
  bridal: { id: 'bridal', label: 'Bridal & Wedding', icon: '💍', sortOrder: 1 },
  festive: { id: 'festive', label: 'Festive & Occasion', icon: '🎉', sortOrder: 2 },
  everyday: { id: 'everyday', label: 'Everyday Glam', icon: '✨', sortOrder: 3 },
  editorial: { id: 'editorial', label: 'Editorial', icon: '📸', sortOrder: 4 },
  natural: { id: 'natural', label: 'Natural & Clean', icon: '🌿', sortOrder: 5 },
  bold: { id: 'bold', label: 'Bold & Statement', icon: '🔥', sortOrder: 6 },
  vintage: { id: 'vintage', label: 'Vintage & Retro', icon: '🕰️', sortOrder: 7 },
  streetstyle: { id: 'streetstyle', label: 'Street Style', icon: '🏙️', sortOrder: 8 },
  performance: { id: 'performance', label: 'Performance & Stage', icon: '🎭', sortOrder: 9 },
  skincare: { id: 'skincare', label: 'Skincare-First', icon: '💧', sortOrder: 10 },
};

export const LOOK_STYLES = {
  asoebi_glam: {
    id: 'asoebi_glam',
    label: 'Aso-Ebi Glam',
    community: 'west-african',
    category: 'festive',
    description: 'A classic Nigerian party look. Metallic-lid, cut-crease eyes paired with a flawless contoured face and bold lip in warm berry or rust.',
    culturalContext: 'Aso-ebi is the tradition of wearing matching fabric to celebrate a family event. The makeup mirrors the opulence of the ceremony.',
    tags: ['metallic', 'cut-crease', 'contour', 'bold-lip', 'nigerian', 'party'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'cut-crease', primaryColour: 'bronze-gold', liner: 'black wing, bold flick', lash: 'full glam, 3D lashes', brow: 'defined arch, soap brow finish' },
    faceLook: {
      base: 'full-coverage, luminous finish',
      contour: 'warm mahogany, strong sculpture',
      highlight: 'gold beam on cheekbones',
      blush: 'deep peach or dusty rose',
      setting: 'translucent bake under eyes',
    },
    lipLook: {
      options: ['warm berry', 'burnt sienna', 'brick red', 'cognac nude'],
      liner: 'match-and-fill, defined cupid bow',
      finish: 'satin or semi-matte',
    },
    difficulty: 4,
    timeMinutes: 45,
    occasions: ['wedding', 'naming ceremony', 'engagement', 'birthday'],
    season: ['all'],
  },
  afrobeats_festival: {
    id: 'afrobeats_festival',
    label: 'Afrobeats Festival',
    community: 'west-african',
    category: 'performance',
    description: 'High-energy, sweat-proof look for open-air concerts. Vivid graphic liner, rhinestone accents, full coverage base and neon pops on lids.',
    culturalContext: 'Afrobeats festivals from Lagos to London call for looks that survive dancing and heat while standing out in a crowd.',
    tags: ['rhinestone', 'graphic-liner', 'neon', 'festival', 'sweat-proof', 'bold'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: {
      technique: 'graphic cut-crease with rhinestones',
      primaryColour: 'electric orange or yellow on inner corner',
      liner: 'geometric black lines, floating liner',
      lash: 'wispy or individual clusters',
      brow: 'bleached brow or bold defined arch',
    },
    faceLook: {
      base: 'longwear full coverage, matte finish',
      contour: 'powder contour, blended hard',
      highlight: 'solar gold strobe',
      blush: 'deep coral blush drape',
      setting: 'setting spray, no powder (sweat proof)',
    },
    lipLook: {
      options: ['neon orange', 'fire red', 'glossy nude', 'deep plum'],
      liner: 'overdrawn for drama',
      finish: 'gloss or high-shine',
    },
    difficulty: 5,
    timeMinutes: 60,
    occasions: ['festival', 'concert', 'outdoor party'],
    season: ['spring', 'summer'],
  },
  nigerian_editorial: {
    id: 'nigerian_editorial',
    label: 'Lagos Editorial',
    community: 'west-african',
    category: 'editorial',
    description: 'Magazine-ready look blending Adire textile patterns inspiration into graphic eye art with rich skin prep.',
    culturalContext: 'Lagos has a growing fashion scene. Editorial looks often reference Yoruba adire textile patterns, ancestral markings and Afrofuturism.',
    tags: ['editorial', 'graphic', 'adire', 'afrofuturism', 'magazine'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: {
      technique: 'mixed-media graphic — shadow + liner + pigment',
      primaryColour: 'indigo blue with white highlight',
      liner: 'jagged structural lines',
      lash: 'none or individual artistic clusters',
      brow: 'bleached or sculpted',
    },
    faceLook: { base: 'skin-prep focus, luminous tint', contour: 'sharp nose sculpture', highlight: 'moonbeam silver on temples', blush: 'editorial peach flush', setting: 'dewy finish, minimal powder' },
    lipLook: {
      options: ['clear gloss', 'chocolate brown', 'ink blue'],
      liner: 'precise, graphic',
      finish: 'glass or ultra-matte',
    },
    difficulty: 5,
    timeMinutes: 75,
    occasions: ['editorial shoot', 'fashion week', 'art event'],
    season: ['all'],
  },
  gele_bridal: {
    id: 'gele_bridal',
    label: 'Gele Bridal',
    community: 'west-african',
    category: 'bridal',
    description: 'Sophisticated, camera-ready bridal makeup to complement the iconic gele headwrap. Intense contouring, feathery brows, and classic red or burgundy lip.',
    culturalContext: 'The gele (headwrap) is the centrepiece of a Nigerian bride\'s look, so the face is made up to hold its own beside it: strong yet soft.',
    tags: ['bridal', 'gele', 'contouring', 'red-lip', 'nigerian-bride'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: {
      technique: 'classic halo or soft cut-crease',
      primaryColour: 'champagne gold or warm brown',
      liner: 'tight-line + extended wing',
      lash: 'natural glam or 3D',
      brow: 'microbladed-effect, feather',
    },
    faceLook: {
      base: 'long-wear full coverage, natural finish',
      contour: 'chiseled, warm tone',
      highlight: 'inner corner + brow bone + cupid bow',
      blush: 'peach rose on apples',
      setting: 'bake under eyes, translucent set',
    },
    lipLook: {
      options: ['classic red', 'deep burgundy', 'berry plum', 'brick red'],
      liner: 'overlined slightly, defined cupid bow',
      finish: 'long-wear matte or satin',
    },
    difficulty: 5,
    timeMinutes: 90,
    occasions: ['traditional wedding', 'introduction ceremony'],
    season: ['all'],
  },
  bollywood_bridal: {
    id: 'bollywood_bridal',
    label: 'Bollywood Bridal',
    community: 'south-asian',
    category: 'bridal',
    description: 'Heavily pigmented, multi-step bridal look inspired by Bollywood films. Smoky kohl-rimmed eyes, flawless base, and classic deep red lip.',
    culturalContext: 'Indian bridal makeup draws on long traditions, including kajal and sindoor, blended with contemporary techniques.',
    tags: ['bridal', 'kohl', 'smoky', 'red-lip', 'indian', 'bollywood', 'mehndi'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'intense kohl smoky eye', primaryColour: 'deep espresso or forest green', liner: 'kohl-heavy waterline + extended wing', lash: 'dramatic full lash', brow: 'defined natural arch' },
    faceLook: {
      base: 'full coverage, demi-matte',
      contour: 'precise nose and cheekbone sculpt',
      highlight: 'gold inner corner, brow bone',
      blush: 'warm peach-pink',
      setting: 'bake + setting spray for longevity',
    },
    lipLook: {
      options: ['classic red', 'deep maroon', 'magenta', 'burgundy'],
      liner: 'slightly overlined, precise',
      finish: 'long-wear matte',
    },
    difficulty: 5,
    timeMinutes: 90,
    occasions: ['wedding', 'mehendi', 'sangeet', 'haldi'],
    season: ['all'],
  },
  south_asian_everyday: {
    id: 'south_asian_everyday',
    label: 'Desi Everyday',
    community: 'south-asian',
    category: 'everyday',
    description: 'Polished daytime look with kajal-lined eyes, even skin tone, and warm pink lips—wearable and celebratory without being overdone.',
    culturalContext: 'Kajal is part of many South Asian women\'s daily routine, as a beauty tradition and one long believed to protect the eyes. Traditional kajal and surma can contain lead, so choose a cosmetic pencil sold for the waterline.',
    tags: ['kajal', 'everyday', 'warm-pink', 'natural', 'desi'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: {
      technique: 'kajal rim with soft blended shadow',
      primaryColour: 'warm terracotta or muted plum',
      liner: 'thick kajal waterline, smudged lower lid',
      lash: 'curled natural lash or single coat mascara',
      brow: 'groomed natural, spoolie-brushed',
    },
    faceLook: { base: 'medium coverage, natural finish', contour: 'light bronzer, no harsh lines', highlight: 'subtle glow on tops of cheeks', blush: 'warm rose', setting: 'light powder or no powder' },
    lipLook: {
      options: ['warm pink', 'mauve', 'terracotta nude', 'berry stain'],
      liner: 'natural line',
      finish: 'tinted balm or sheer gloss',
    },
    difficulty: 2,
    timeMinutes: 20,
    occasions: ['work', 'college', 'shopping', 'family visit'],
    season: ['all'],
  },
  mehndi_look: {
    id: 'mehndi_look',
    label: 'Mehendi Night',
    community: 'south-asian',
    category: 'festive',
    description: 'Vibrant, joyful look for mehendi ceremonies. Pops of yellow and orange shadow, dewy glowing skin, and a coral or mustard lip.',
    culturalContext: 'The mehendi ceremony is one of the most joyful pre-wedding events. Colours echo the marigold garlands, haldi turmeric, and the mehendi paste itself.',
    tags: ['mehndi', 'yellow', 'orange', 'festive', 'dewy', 'haldi'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'graphic colour pop with liner', primaryColour: 'mustard yellow + orange', liner: 'teal or electric blue graphic liner', lash: 'wispy mascara', brow: 'fluffy natural brow' },
    faceLook: { base: 'light-to-medium coverage, dewy', contour: 'none or very soft', highlight: 'gold cheekbone', blush: 'coral or peach', setting: 'facial mist for glow' },
    lipLook: {
      options: ['coral', 'mustard', 'orange-red', 'warm peach'],
      liner: 'match lip colour',
      finish: 'gloss or satin',
    },
    difficulty: 3,
    timeMinutes: 30,
    occasions: ['mehendi ceremony', 'haldi', 'outdoor celebration'],
    season: ['spring', 'summer'],
  },
  k_beauty_glass: {
    id: 'k_beauty_glass',
    label: 'Glass Skin K-Beauty',
    community: 'east-asian',
    category: 'skincare',
    description: 'The Korean glass-skin look: a translucent, luminous base with monochromatic soft rose tones and barely-there lashes.',
    culturalContext: 'K-beauty is known for putting skincare first. The glass-skin look follows that idea: skin so hydrated it looks like glass.',
    tags: ['glass-skin', 'korean', 'monochromatic', 'dewy', 'minimal', 'luminous'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: {
      technique: 'monochromatic blush eye',
      primaryColour: 'soft rose or peach blush',
      liner: 'none or very soft brown lower lash',
      lash: 'individual lower clusters or none',
      brow: 'straight natural brow (Korean-style)',
    },
    faceLook: {
      base: 'glass-skin routine: toner, essence, serum, cushion foundation',
      contour: 'none',
      highlight: 'liquid highlighter mixed into base',
      blush: 'jelly blush — monochrome with eye',
      setting: 'hydrating setting spray, no powder',
    },
    lipLook: {
      options: ['MLBB (My Lips But Better)', 'sheer cherry', 'clear gloss'],
      liner: 'none',
      finish: 'glass or jelly gloss',
    },
    difficulty: 2,
    timeMinutes: 25,
    occasions: ['everyday', 'date', 'brunch', 'office'],
    season: ['all'],
  },
  carnival_queen: {
    id: 'carnival_queen',
    label: 'Carnival Queen',
    community: 'caribbean',
    category: 'performance',
    description: 'Spectacular face art for Trinidad Carnival or Notting Hill. Full rhinestone embellishment, tropical colour palette, and waterproof warrior base.',
    culturalContext: 'Caribbean Carnival makeup is theatrical body art. It must survive heat, sweat, dancing, and feathered costumes for hours on end.',
    tags: ['carnival', 'rhinestone', 'tropical', 'body-art', 'waterproof', 'trinidad', 'barbados'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'full eye art with gems', primaryColour: 'turquoise + fuchsia + gold', liner: 'dramatic wing + lower gems', lash: 'enormous fan lashes', brow: 'sculpted, filled-in, gemstone accent' },
    faceLook: {
      base: 'body-paint foundation, fully waterproof',
      contour: 'intense 3D sculpture',
      highlight: 'chunky festival glitter + glow',
      blush: 'tropical coral drape',
      setting: 'waterproof setting spray',
    },
    lipLook: {
      options: ['hot pink', 'fire engine red', 'tangerine', 'gold glitter lip'],
      liner: 'overdrawn, aggressive',
      finish: 'waterproof gloss or vinyl',
    },
    difficulty: 5,
    timeMinutes: 120,
    occasions: ['carnival', 'jouvert', 'mas band', 'soca festival'],
    season: ['summer'],
  },
  caribbean_beach: {
    id: 'caribbean_beach',
    label: 'Island Beach Glow',
    community: 'caribbean',
    category: 'natural',
    description: 'Sun-kissed, bronzed, sweat-proof beach glow for Caribbean heat. Mineral SPF, bronze lid wash, and lip oil.',
    culturalContext: 'Island living demands beauty that lasts through salt air, UV rays, and dancing in the water. Minimal fuss, maximum radiance.',
    tags: ['beach', 'bronzed', 'SPF', 'minimal', 'glow', 'summer'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'bronze wash + smudged kohl', primaryColour: 'copper + warm sand', liner: 'smudged chocolate kohl', lash: 'waterproof mascara, curled', brow: 'brushed up, sun-bleached effect' },
    faceLook: {
      base: 'SPF tinted moisturiser or BB cream',
      contour: 'bronzer over cheeks, forehead, nose',
      highlight: 'champagne highlighter on nose bridge + brow bone',
      blush: 'peachy bronze',
      setting: 'setting spray',
    },
    lipLook: {
      options: ['clear lip oil', 'coral gloss', 'warm peach balm'],
      liner: 'none or barely-there',
      finish: 'glossy',
    },
    difficulty: 1,
    timeMinutes: 10,
    occasions: ['beach', 'pool', 'vacation', 'daytime outdoor'],
    season: ['summer'],
  },
  dancehall_night: {
    id: 'dancehall_night',
    label: 'Dancehall Night',
    community: 'caribbean',
    category: 'bold',
    description: 'Bold Jamaican dancehall-inspired look: sharp full-coverage base, exaggerated cat eye, and standout fierce lip.',
    culturalContext: 'Jamaican dancehall fashion and beauty are globally influential. The dancehall queen look is fearless, maximalist, and unapologetically powerful.',
    tags: ['dancehall', 'cat-eye', 'bold', 'jamaican', 'maximalist', 'night-out'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: {
      technique: 'extreme elongated cat eye',
      primaryColour: 'jet black + colour pop (hot pink or royal blue)',
      liner: 'extended ultra-fine wing, 4cm',
      lash: 'dramatic volume lash',
      brow: 'defined sharp arch',
    },
    faceLook: { base: 'full matte coverage', contour: 'severe contour + highlight', highlight: 'blinding on high points', blush: 'plum or deep rose sculpt-blush', setting: 'bake + setting spray' },
    lipLook: {
      options: ['hot pink', 'candy red', 'copper metallic', 'nude glam'],
      liner: 'overdraw, define aggressively',
      finish: 'matte or metallic',
    },
    difficulty: 4,
    timeMinutes: 45,
    occasions: ['nightclub', 'dancehall', 'birthday party'],
    season: ['all'],
  },
  khaleeji_glam: {
    id: 'khaleeji_glam',
    label: 'Khaleeji Glam',
    community: 'arab',
    category: 'festive',
    description: 'Opulent Gulf-style glam with kohl-dark smoky eyes, a flawless luminous base, and a muted nude or rose lip. Fragrance-inspired.',
    culturalContext: 'Gulf beauty often centres on kohl-rimmed eyes (an ancient tradition), a flawless base and softly perfumed lips, passed down through generations.',
    tags: ['khaleeji', 'kohl', 'smoky', 'nude-lip', 'gulf', 'luxury', 'oud'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: {
      technique: 'deep cut-crease, kohl-heavy',
      primaryColour: 'espresso brown + black',
      liner: 'kohl-rimmed waterline + extended flick',
      lash: '3D dramatic volume',
      brow: 'defined arch, ombre powder fill',
    },
    faceLook: { base: 'full coverage, natural glow finish', contour: 'soft nose contour', highlight: 'dewy sheen on cheeks + forehead', blush: 'soft rose or peach', setting: 'setting spray or minimal powder' },
    lipLook: {
      options: ['warm nude', 'rose beige', 'soft pink', 'champagne gloss'],
      liner: 'one shade deeper than lip',
      finish: 'semi-matte or gloss',
    },
    difficulty: 4,
    timeMinutes: 50,
    occasions: ['eid', 'wedding', 'majlis', 'gala'],
    season: ['all'],
  },
  levantine_everyday: {
    id: 'levantine_everyday',
    label: 'Levantine Everyday',
    community: 'arab',
    category: 'everyday',
    description: 'Lebanese/Syrian/Jordanian everyday chic: defined brows, subtle smoky eye, dewy skin, berry lip.',
    culturalContext: 'The Levantine everyday look is effortlessly polished: bold brows and dewy skin are its signatures.',
    tags: ['levantine', 'everyday', 'bold-brow', 'dewy', 'berry', 'natural-glam'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'soft day smoky', primaryColour: 'taupe + warm brown', liner: 'thin wing', lash: 'natural mascara volume', brow: 'defined full brow (signature)' },
    faceLook: { base: 'medium coverage, dewy finish', contour: 'light bronze only', highlight: 'liquid highlighter under eyes', blush: 'rosy bronze', setting: 'hydrating mist' },
    lipLook: {
      options: ['berry', 'mauve', 'raspberry', 'warm nude with gloss'],
      liner: 'define + fill',
      finish: 'satin',
    },
    difficulty: 2,
    timeMinutes: 20,
    occasions: ['work', 'brunch', 'casual outing'],
    season: ['all'],
  },
  eid_festive: {
    id: 'eid_festive',
    label: 'Eid Celebration',
    community: 'arab',
    category: 'festive',
    description: 'Radiant Eid look with golden cut-crease, flawless canvas, and festive rose or red lip. Celebratory and modest-glam.',
    culturalContext: 'Eid celebrations across the Arab world call for beautiful, festive makeup that is modest yet glowing—gold accents and rich pigment honour the occasion.',
    tags: ['eid', 'gold', 'cut-crease', 'festive', 'arab', 'modest-glam'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'gold-focused cut-crease', primaryColour: 'rose gold + champagne', liner: 'black wing with kohl water line', lash: 'glam full lash', brow: 'full defined brow' },
    faceLook: { base: 'full coverage luminous', contour: 'soft cheekbone sculpt', highlight: 'gold highlight', blush: 'rose or warm peach', setting: 'baked under eyes' },
    lipLook: {
      options: ['rose red', 'hot pink', 'deep rose', 'warm nude'],
      liner: 'define clearly',
      finish: 'matte or satin',
    },
    difficulty: 3,
    timeMinutes: 40,
    occasions: ['eid al-fitr', 'eid al-adha', 'family celebration'],
    season: ['all'],
  },
  'quinceañera_glam': {
    id: 'quinceañera_glam',
    label: 'Quinceañera Glam',
    community: 'latina',
    category: 'festive',
    description: 'Lavish coming-of-age celebration look. Princess pink and pearl tones, full glam eye, and deep rose lip.',
    culturalContext: 'The quinceañera is a milestone Latino celebration of a girl\'s 15th birthday. The makeup must be both youthful and glamorous—a delicate balance.',
    tags: ['quinceañera', 'pink', 'glam', 'princess', 'celebration', 'latina'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'shimmer halo eye', primaryColour: 'rose gold + blush pink', liner: 'thin black wing', lash: 'volume glam', brow: 'defined soft arch' },
    faceLook: { base: 'full coverage, natural finish', contour: 'soft peach contour', highlight: 'pearl highlight', blush: 'bright rose', setting: 'setting spray' },
    lipLook: {
      options: ['hot rose', 'bright coral', 'deep pink', 'rose nude'],
      liner: 'define + fill',
      finish: 'satin or gloss',
    },
    difficulty: 3,
    timeMinutes: 40,
    occasions: ['quinceañera', 'prom', 'sweet 16', 'first communion'],
    season: ['all'],
  },
  latina_telenovela: {
    id: 'latina_telenovela',
    label: 'Telenovela Drama',
    community: 'latina',
    category: 'bold',
    description: 'Dramatically contoured, full lash, bold red lip telenovela look.',
    culturalContext: 'The telenovela aesthetic has shaped Latin American beauty for decades—strong contouring, bold colour, and unforgettable drama are its hallmarks.',
    tags: ['telenovela', 'dramatic', 'contouring', 'red-lip', 'latina', 'bold'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'classic Old Hollywood glam', primaryColour: 'warm bronze + black', liner: 'cat wing, defined', lash: 'full volume', brow: 'sharp defined arch' },
    faceLook: { base: 'full coverage matte', contour: 'severe sculpt — cheeks, forehead, nose', highlight: 'blinding nose tip + brow bone', blush: 'warm bronze-rose', setting: 'matte bake' },
    lipLook: {
      options: ['classic red', 'fuchsia', 'berry red', 'burgundy'],
      liner: 'defined, slightly overdrawn',
      finish: 'matte',
    },
    difficulty: 4,
    timeMinutes: 50,
    occasions: ['gala', 'nightout', 'photoshoot', 'party'],
    season: ['all'],
  },
  mexica_inspired: {
    id: 'mexica_inspired',
    label: 'Frida Inspired',
    community: 'latina',
    category: 'editorial',
    description: 'Tribute to the iconic Frida Kahlo aesthetic: unibrow artistry, floral crown, warm earth tones, red lip.',
    culturalContext: 'Frida Kahlo\'s self-portraits challenged European beauty norms and celebrated Indigenous Mexican identity. Her aesthetic remains a powerful cultural symbol.',
    tags: ['frida', 'editorial', 'floral', 'unibrow', 'earthy', 'mexican', 'indigenous'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: {
      technique: 'connected brow + earth shadow',
      primaryColour: 'terracotta + burnt umber',
      liner: 'extended unibrow (editorial)',
      lash: 'mascara only',
      brow: 'connected, unibrow statement (editorial)',
    },
    faceLook: { base: 'medium dewy coverage', contour: 'warm tan bronzer', highlight: 'gold on cheeks', blush: 'bright coral or rose', setting: 'light mist' },
    lipLook: {
      options: ['classic red', 'fuchsia rose', 'warm coral'],
      liner: 'traditional shape',
      finish: 'matte',
    },
    difficulty: 4,
    timeMinutes: 35,
    occasions: ['editorial shoot', 'art event', 'Day of the Dead', 'protest'],
    season: ['all'],
  },
  jk_idol_glam: {
    id: 'jk_idol_glam',
    label: 'K-Pop Idol',
    community: 'east-asian',
    category: 'performance',
    description: 'High-production stage look: monochromatic soft base, puppy liner, lip tint, and under-eye gems.',
    culturalContext: 'Korean pop idol makeup is globally influential—characterized by puppy-eye liner, gradient lips, and luminous skin.',
    tags: ['kpop', 'idol', 'puppy-liner', 'gradient-lip', 'stage', 'korean'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: {
      technique: 'puppy eye + inner corner highlight',
      primaryColour: 'terra cotta or soft pink',
      liner: 'puppy-drooped liner',
      lash: 'lower lash mascara emphasis',
      brow: 'straight natural brow, light fill',
    },
    faceLook: { base: 'weightless cushion foundation', contour: 'very light shade drop on temples', highlight: 'liquid drops under eyes', blush: 'monochromatic to eye shadow', setting: 'fixing spray' },
    lipLook: {
      options: ['bitten lip gradient', 'MLBB', 'soft coral ombre'],
      liner: 'smudged inside edge only',
      finish: 'gradient matte',
    },
    difficulty: 3,
    timeMinutes: 30,
    occasions: ['performance', 'concert', 'content creation', 'event'],
    season: ['all'],
  },
  japanese_shironuri: {
    id: 'japanese_shironuri',
    label: 'Shironuri Art',
    community: 'east-asian',
    category: 'editorial',
    description: 'Traditional Japanese white-face art inspired by kabuki theatre and harajuku street style. White base, graphic colour accents.',
    culturalContext: 'Shironuri (painted in white) draws from kabuki, maiko and Harajuku. Modern shironuri artists have turned it into avant-garde street art.',
    tags: ['shironuri', 'white-base', 'kabuki', 'harajuku', 'editorial', 'japanese'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'graphic on white base', primaryColour: 'vivid red or graphic black', liner: 'structural art lines', lash: 'extreme volume or nothing', brow: 'none or drawn very high' },
    faceLook: { base: 'white face paint (shironuri)', contour: 'red or purple hues', highlight: 'iridescent shimmer', blush: 'graphic sweep of red or pink', setting: 'powder seal' },
    lipLook: {
      options: ['bold red', 'graphic black', 'vivid purple'],
      liner: 'extended or bowshaped',
      finish: 'matte or lacquer',
    },
    difficulty: 5,
    timeMinutes: 90,
    occasions: ['editorial', 'performance', 'harajuku event', 'cosplay'],
    season: ['all'],
  },
  cn_festival_traditional: {
    id: 'cn_festival_traditional',
    label: 'Chinese New Year',
    community: 'east-asian',
    category: 'festive',
    description: 'Prosperous red-dominant look for Lunar New Year. Red eye shadow, flawless luminous skin, red lip.',
    culturalContext: 'Red symbolises luck, prosperity, and joy in Chinese culture. Lunar New Year calls for celebratory, auspicious makeup that brings good fortune.',
    tags: ['chinese-new-year', 'red', 'festive', 'lunar', 'lucky', 'traditional'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'red shadow blended + liner', primaryColour: 'cherry red + gold inner corner', liner: 'classic wing', lash: 'natural glam or wispy', brow: 'defined straight brow' },
    faceLook: { base: 'luminous full coverage', contour: 'subtle nose sculpt', highlight: 'gold liquid drop', blush: 'rosy red', setting: 'dewy finish spray' },
    lipLook: {
      options: ['classic red', 'cherry red', 'warm red'],
      liner: 'precise',
      finish: 'satin',
    },
    difficulty: 3,
    timeMinutes: 30,
    occasions: ['chinese new year', 'lunar new year', 'traditional ceremony'],
    season: ['winter', 'spring'],
  },
  ethiopian_bridal: {
    id: 'ethiopian_bridal',
    label: 'Ethiopian Bridal',
    community: 'east-african',
    category: 'bridal',
    description: 'Bridal look with rich, warm spiced tones and kohl-lined eyes, made to sit with the white habesha kemis.',
    culturalContext: 'Ethiopian and Eritrean brides often wear the white habesha kemis with embroidered borders, and pair it with bold kohl and makeup that photographs well.',
    tags: ['ethiopian', 'bridal', 'kohl', 'traditional', 'warm-spice', 'habesha'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'kohl-heavy smoky', primaryColour: 'rich brown + gold', liner: 'kohl, heavy on water line', lash: 'full glam', brow: 'defined natural' },
    faceLook: { base: 'medium-full coverage, warm undertone match', contour: 'warm brown, sculpted', highlight: 'gold on nose bridge', blush: 'burnt sienna or warm peach', setting: 'bake + translucent powder' },
    lipLook: {
      options: ['brick red', 'warm berry', 'copper', 'nude mocha'],
      liner: 'define + fill',
      finish: 'matte or satin',
    },
    difficulty: 4,
    timeMinutes: 60,
    occasions: ['habesha wedding', 'timkat', 'meskel'],
    season: ['all'],
  },
  amapiano_beat: {
    id: 'amapiano_beat',
    label: 'Amapiano Beat',
    community: 'south-african',
    category: 'streetstyle',
    description: 'Street-style-meets-club: graphic metallics, deep skin luminosity, and bold statement lip.',
    culturalContext: 'Amapiano is a South African-born house genre that is now popular across Africa. The fashion around it blends township style with high fashion.',
    tags: ['amapiano', 'metallic', 'street', 'club', 'south-african', 'east-african'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'metallic foil lid', primaryColour: 'copper + electric blue', liner: 'graphic sharp wing', lash: 'dramatic wispy', brow: 'sharp defined' },
    faceLook: { base: 'full coverage, glowing finish', contour: 'sharp bronze', highlight: 'blinding metallic', blush: 'deep berry drape', setting: 'light spray' },
    lipLook: {
      options: ['deep purple', 'burgundy', 'berry gloss', 'nude glam'],
      liner: 'aggressive define',
      finish: 'gloss or metallic',
    },
    difficulty: 3,
    timeMinutes: 35,
    occasions: ['club', 'street event', 'music video', 'amapiano party'],
    season: ['all'],
  },
  kenyan_editorial: {
    id: 'kenyan_editorial',
    label: 'Nairobi Editorial',
    community: 'east-african',
    category: 'editorial',
    description: 'Nairobi fashion week-inspired look blending Maasai beadwork colour palette with contemporary technique.',
    culturalContext: 'Nairobi\'s fashion scene increasingly draws from Maasai, Kikuyu and Swahili visual culture.',
    tags: ['nairobi', 'editorial', 'maasai', 'beadwork', 'fashion-week', 'kenya'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'beadwork-inspired graphic liner', primaryColour: 'red + teal + white dots', liner: 'graphic Maasai-inspired lines', lash: 'wispy editorial', brow: 'bold sculpted' },
    faceLook: { base: 'dewy luminous base', contour: 'warm bronze', highlight: 'electric gold', blush: 'deep rose', setting: 'mist' },
    lipLook: {
      options: ['red', 'orange-red', 'coral', 'nude bronze'],
      liner: 'define',
      finish: 'matte or satin',
    },
    difficulty: 5,
    timeMinutes: 60,
    occasions: ['fashion week', 'editorial shoot', 'art exhibit'],
    season: ['all'],
  },
  zulu_bride: {
    id: 'zulu_bride',
    label: 'Zulu Bride',
    community: 'south-african',
    category: 'bridal',
    description: 'Ceremonial beauty to accompany traditional Zulu beadwork and isidwaba skirt. Red ochre-inspired tones, strong kohl eyes.',
    culturalContext: 'Zulu traditional weddings (umabo) are spectacular cultural events. Brides wear intricate beadwork, and red ochre appears in several southern African beauty traditions.',
    tags: ['zulu', 'bridal', 'ochre', 'beadwork', 'traditional', 'south-african'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'earthy halo eye with kohl', primaryColour: 'terracotta + ochre + gold', liner: 'kohl-lined waterline', lash: 'natural glam', brow: 'defined natural' },
    faceLook: { base: 'full coverage, warm undertone match', contour: 'burnt sienna', highlight: 'gold cheekbone', blush: 'warm terracotta', setting: 'bake + translucent' },
    lipLook: {
      options: ['burnt orange', 'brick red', 'copper bronze', 'nude plum'],
      liner: 'fill + define',
      finish: 'matte or satin',
    },
    difficulty: 4,
    timeMinutes: 60,
    occasions: ['umabo ceremony', 'traditional wedding'],
    season: ['all'],
  },
  capetown_street: {
    id: 'capetown_street',
    label: 'Cape Town Street',
    community: 'south-african',
    category: 'streetstyle',
    description: 'Cape Malay-influenced colour palette meets modern street style. Vibrant eye, graphic liner, and warm earthy lip.',
    culturalContext: 'Cape Town\'s Bo-Kaap neighbourhood and Cape Malay heritage bring vibrant colour to South African street style.',
    tags: ['cape-town', 'bo-kaap', 'cape-malay', 'street', 'colourful', 'south-african'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'bold colour wash', primaryColour: 'teal + yellow + orange', liner: 'graphic double liner', lash: 'mascara', brow: 'defined natural arch' },
    faceLook: { base: 'medium coverage, dewy', contour: 'light bronze', highlight: 'gold pop', blush: 'warm peach', setting: 'mist' },
    lipLook: {
      options: ['terracotta', 'warm orange', 'nude bronze', 'coral'],
      liner: 'define',
      finish: 'satin or tinted balm',
    },
    difficulty: 2,
    timeMinutes: 20,
    occasions: ['street', 'market', 'casual outing', 'art event'],
    season: ['all'],
  },
  afrikaans_glam: {
    id: 'afrikaans_glam',
    label: 'Highveld Glam',
    community: 'south-african',
    category: 'festive',
    description: 'Johannesburg-inspired polished glam with bronzed skin, defined eyes, and classic berry lip.',
    culturalContext: 'Johannesburg\'s diverse social scene demands versatile glam—polished enough for high-end events, bold enough to stand out.',
    tags: ['johannesburg', 'glam', 'bronzed', 'berry', 'south-african', 'highveld'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'classic cut-crease bronze', primaryColour: 'bronze + gold', liner: 'black wing', lash: 'volume lash', brow: 'defined arch' },
    faceLook: { base: 'full coverage luminous', contour: 'bronze sculpt', highlight: 'gold beam', blush: 'warm rose', setting: 'bake + spray' },
    lipLook: {
      options: ['deep berry', 'plum', 'burgundy', 'warm nude'],
      liner: 'define',
      finish: 'matte or satin',
    },
    difficulty: 3,
    timeMinutes: 35,
    occasions: ['gala', 'party', 'formal event', 'date night'],
    season: ['all'],
  },
  harlem_renaissance: {
    id: 'harlem_renaissance',
    label: 'Harlem Renaissance',
    community: 'black-american',
    category: 'vintage',
    description: 'Art deco-inspired look evoking the 1920s Harlem Renaissance. Defined cupid bow, shimmery lids, cloche hat energy.',
    culturalContext: 'The Harlem Renaissance was a golden age of Black American culture. Beauty was political—asserting dignity through elegance in the face of systemic racism.',
    tags: ['harlem', 'renaissance', 'vintage', 'art-deco', '1920s', 'classic'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: {
      technique: 'art deco shimmer + defined liner',
      primaryColour: 'champagne gold + deep brown',
      liner: 'precise wing, vintage flick',
      lash: 'individual volume lash',
      brow: 'thin defined arch (1920s shape)',
    },
    faceLook: { base: 'medium coverage, soft matte finish', contour: 'light warm sculpt', highlight: 'pearl + gold highlight', blush: 'warm apricot', setting: 'powder set' },
    lipLook: {
      options: ['classic red', 'deep wine', 'brick'],
      liner: 'overdrawn cupid bow, defined',
      finish: 'matte',
    },
    difficulty: 4,
    timeMinutes: 45,
    occasions: ['themed event', 'gala', 'jazz night', 'editorial'],
    season: ['all'],
  },
  black_girl_magic: {
    id: 'black_girl_magic',
    label: 'Black Girl Magic',
    community: 'black-american',
    category: 'everyday',
    description: 'Effortless, radiant everyday look that centers melanin-rich skin. SPF glow, tinted moisturiser, fluffed brows, glossy lip.',
    culturalContext: 'Black Girl Magic celebrates the beauty of dark skin and Afrocentric features. This look lets the skin be the hero without masking it.',
    tags: ['bgm', 'melanin', 'glow', 'minimal', 'everyday', 'radiance', 'spf'],
    fitzpatrickFit: ['V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'clean lid, defined lash line', primaryColour: 'bronze glow lid', liner: 'smudged brown liner', lash: 'tinted mascara or bold individual', brow: 'fluffy natural brow' },
    faceLook: { base: 'tinted moisturiser with SPF 30+', contour: 'none or soft bronzer', highlight: 'dewy oil-based highlighter', blush: 'berry or deep coral', setting: 'none or light mist' },
    lipLook: {
      options: ['clear gloss', 'berry gloss', 'MLBB', 'warm nude'],
      liner: 'none or light define',
      finish: 'gloss',
    },
    difficulty: 1,
    timeMinutes: 10,
    occasions: ['everyday', 'work', 'school', 'errands'],
    season: ['all'],
  },
  hbcu_homecoming: {
    id: 'hbcu_homecoming',
    label: 'HBCU Homecoming',
    community: 'black-american',
    category: 'festive',
    description: 'Spirited, bold look for HBCU homecoming celebrations. School colours influence the palette, full glam, and school pride.',
    culturalContext: 'HBCU homecoming is one of the biggest cultural events in Black America—blending fashion, music, and pride in Black excellence.',
    tags: ['hbcu', 'homecoming', 'school-spirit', 'bold', 'celebration', 'black-excellence'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'glam cut-crease, school colours optional', primaryColour: 'gold + deep navy / or school colour', liner: 'black wing', lash: '3D full', brow: 'bold defined' },
    faceLook: { base: 'full coverage, semi-matte', contour: 'warm sculpt', highlight: 'gold shimmer', blush: 'warm rose or deep peach', setting: 'bake + spray' },
    lipLook: {
      options: ['red', 'navy (editorial)', 'hot pink', 'berry'],
      liner: 'define + fill',
      finish: 'matte or satin',
    },
    difficulty: 3,
    timeMinutes: 40,
    occasions: ['hbcu homecoming', 'step show', 'tailgate', 'alumni event'],
    season: ['fall'],
  },
  old_hollywood_black: {
    id: 'old_hollywood_black',
    label: 'Old Hollywood',
    community: 'black-american',
    category: 'vintage',
    description: 'Dorothy Dandridge-inspired Old Hollywood glamour. Pencil-thin brows, red lip, full coverage foundation, classic cat eye.',
    culturalContext: 'Despite systemic exclusion, Black women like Dorothy Dandridge and Lena Horne created their own version of Hollywood glamour—equally elegant and culturally distinct.',
    tags: ['old-hollywood', 'vintage', 'dorothy-dandridge', 'red-lip', 'classic', 'cat-eye'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'classic cat eye', primaryColour: 'ivory + deep brown', liner: 'thin precise cat flick', lash: 'individual vintage lash', brow: 'arched thin brow (era-appropriate)' },
    faceLook: { base: 'matte full coverage', contour: 'light cheekbone sculpt', highlight: 'pearl inner corner', blush: 'warm apricot', setting: 'powder set' },
    lipLook: {
      options: ['cardinal red', 'classic red', 'berry red'],
      liner: 'defined cupid bow',
      finish: 'matte',
    },
    difficulty: 3,
    timeMinutes: 40,
    occasions: ['gala', 'award show', 'formal event', 'vintage party'],
    season: ['all'],
  },
  melanin_glow_universal: {
    id: 'melanin_glow_universal',
    label: 'Melanin Glow',
    community: 'all',
    category: 'skincare',
    description: 'Universal skin-first, melanin-celebrating look for deeper skin tones. SPF-inclusive dewy base, bronze lid, and glossy lip.',
    culturalContext: 'A celebration of deep skin tones, for anyone with Fitzpatrick V-VI skin, whatever their community.',
    tags: ['melanin', 'glow', 'universal', 'deep-skin', 'dewy', 'spf'],
    fitzpatrickFit: ['V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'bronzed shimmer lid', primaryColour: 'warm bronze + gold', liner: 'smudged brown', lash: 'individual clusters', brow: 'fluffy natural brow' },
    faceLook: { base: 'tinted SPF50 or dewy foundation', contour: 'warm bronze', highlight: 'oil-drop highlight', blush: 'coral berry', setting: 'hydrating mist' },
    lipLook: {
      options: ['clear gloss', 'berry', 'nude bronze', 'warm pink'],
      liner: 'none or light',
      finish: 'glass gloss',
    },
    difficulty: 1,
    timeMinutes: 15,
    occasions: ['everyday', 'beach', 'work', 'casual'],
    season: ['all'],
  },
  no_makeup_makeup: {
    id: 'no_makeup_makeup',
    label: 'No-Makeup Makeup',
    community: 'all',
    category: 'natural',
    description: 'The classic "I woke up like this" elevated look. Concealer, mascara, tinted balm—universal across all communities.',
    culturalContext: 'No-makeup makeup has become a global standard across cultures. Adapted for skin of colour, it centres skincare, colour-matching, and natural texture.',
    tags: ['no-makeup', 'natural', 'minimal', 'everyday', 'universal', 'skincare-first'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'nothing or barely-there', primaryColour: 'your natural lid colour', liner: 'none or white waterline', lash: 'mascara on top lashes only', brow: 'spoolie brush-up' },
    faceLook: { base: 'skin tint or concealer spot-treat', contour: 'none', highlight: 'dab of highlighter on nose + brow bone', blush: 'natural blush or cream pop', setting: 'none' },
    lipLook: {
      options: ['tinted balm', 'clear gloss', 'MLBB'],
      liner: 'none',
      finish: 'glossy balm',
    },
    difficulty: 1,
    timeMinutes: 5,
    occasions: ['everyday', 'gym', 'quick errand', 'travel'],
    season: ['all'],
  },
  power_brow: {
    id: 'power_brow',
    label: 'Power Brow Statement',
    community: 'all',
    category: 'bold',
    description: 'Make the brow the hero: bold defined brows paired with minimal face, bare lip, and simple lash.',
    culturalContext: 'Bold, defined brows are celebrated in many beauty traditions. This look makes the brow the centre of the face.',
    tags: ['brow', 'statement', 'bold-brow', 'minimal', 'universal', 'identity'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: {
      technique: 'brow focus, minimal lid',
      primaryColour: 'neutral lid shadow or none',
      liner: 'none or lash line only',
      lash: 'mascara or none',
      brow: 'full, bold, defined with pomade or soap brow',
    },
    faceLook: { base: 'serum foundation or skin tint', contour: 'none or light bronze', highlight: 'inner corner only', blush: 'cream blush', setting: 'mist' },
    lipLook: {
      options: ['clear gloss', 'MLBB', 'nude matte'],
      liner: 'none or very light',
      finish: 'natural',
    },
    difficulty: 2,
    timeMinutes: 15,
    occasions: ['everyday', 'work', 'fashion event', 'photo'],
    season: ['all'],
  },
  disco_bliss: {
    id: 'disco_bliss',
    label: 'Disco Bliss',
    community: 'all',
    category: 'bold',
    description: 'Full-throttle disco-inspired look: holographic lids, sun-kissed skin, oversized glitter, classic red lip.',
    culturalContext: 'Disco culture was profoundly shaped by Black, Latino, and queer communities in New York. This look honours that heritage with maximum sparkle.',
    tags: ['disco', 'holographic', 'glitter', 'red-lip', '70s', 'nightclub'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'holographic glitter all over lid', primaryColour: 'silver or holographic', liner: 'graphic wing', lash: 'huge volume', brow: 'defined full' },
    faceLook: { base: 'full coverage, glossy', contour: 'bronze', highlight: 'strobe — nose + forehead + cheeks', blush: 'coral or hot pink', setting: 'dewy spray' },
    lipLook: {
      options: ['classic red', 'hot pink', 'fuchsia', 'glitter lip'],
      liner: 'define',
      finish: 'vinyl or gloss',
    },
    difficulty: 4,
    timeMinutes: 45,
    occasions: ['party', 'nightclub', 'disco themed event', 'festival'],
    season: ['all'],
  },
  afro_punk: {
    id: 'afro_punk',
    label: 'Afro Punk',
    community: 'black-american',
    category: 'bold',
    description: 'Afropunk festival-ready: radical colour against dark skin, spikes, chains, and bold pigment.',
    culturalContext: 'Afropunk reclaims punk culture through a Black lens, creating a space where Blackness, queerness, and non-conformity coexist beautifully.',
    tags: ['afropunk', 'festival', 'punk', 'colour', 'radical', 'black-alternative'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'graphic colour block', primaryColour: 'electric blue + green + orange', liner: 'heavy black or neon', lash: 'spiky or extreme', brow: 'bleached or coloured' },
    faceLook: { base: 'full matte coverage or bare skin', contour: 'dramatic', highlight: 'none or metallic accents', blush: 'berry + neon drape', setting: 'sweat-proof spray' },
    lipLook: {
      options: ['black', 'electric purple', 'neon green', 'orange'],
      liner: 'heavy define or outline only',
      finish: 'matte or vinyl',
    },
    difficulty: 5,
    timeMinutes: 75,
    occasions: ['afropunk festival', 'alternative concert', 'protest art', 'editorial'],
    season: ['summer'],
  },
  soca_brunch: {
    id: 'soca_brunch',
    label: 'Soca Sunday Brunch',
    community: 'caribbean',
    category: 'everyday',
    description: 'Effortless Caribbean Sunday energy: sun-kissed bronze, bright eyes, fruit-inspired lip.',
    culturalContext: 'Sunday brunch is a social ritual of music, food, family and joy. The beauty is bright and easy.',
    tags: ['soca', 'brunch', 'caribbean', 'easy', 'bronze', 'tropical'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'bright lid wash', primaryColour: 'mango yellow or lilac', liner: 'thin brown or nothing', lash: 'mascara', brow: 'groomed natural' },
    faceLook: { base: 'tinted SPF', contour: 'none', highlight: 'dewy bronze', blush: 'coral', setting: 'mist' },
    lipLook: {
      options: ['mango gloss', 'papaya coral', 'watermelon pink'],
      liner: 'none',
      finish: 'fruity gloss',
    },
    difficulty: 1,
    timeMinutes: 10,
    occasions: ['brunch', 'daytime event', 'casual'],
    season: ['spring', 'summer'],
  },
  south_asian_winter_glam: {
    id: 'south_asian_winter_glam',
    label: 'Diwali Night',
    community: 'south-asian',
    category: 'festive',
    description: 'Diwali night look: deep kohl eye, jewel-toned shadow (emerald or sapphire), full glow, and deep cranberry lip.',
    culturalContext: 'Diwali — the festival of lights — calls for luminous, jewel-bright makeup mirroring the lamps, fireworks, and gold.',
    tags: ['diwali', 'jewel', 'emerald', 'festive', 'south-asian', 'deep-kohl'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'jewel-toned cut-crease', primaryColour: 'emerald + sapphire or garnet + gold', liner: 'kohl water line + extended wing', lash: '3D full glam', brow: 'defined arch' },
    faceLook: { base: 'full coverage luminous', contour: 'warm sculpt', highlight: 'gold', blush: 'deep rose or warm peach', setting: 'bake + spray' },
    lipLook: {
      options: ['cranberry', 'deep burgundy', 'jewel red', 'plum'],
      liner: 'define clearly',
      finish: 'matte',
    },
    difficulty: 4,
    timeMinutes: 50,
    occasions: ['diwali', 'karwa chauth', 'navratri', 'pooja'],
    season: ['fall', 'winter'],
  },
  arab_nude_sophistication: {
    id: 'arab_nude_sophistication',
    label: 'Arab Nude Sophistication',
    community: 'arab',
    category: 'everyday',
    description: 'Clean, classic look: flawless skin, neutral-warm contour, warm nude lip, and defined kohl.',
    culturalContext: 'Modern Gulf and Levantine women have pioneered a sophisticated nude-glam look that is globally recognised on social media.',
    tags: ['nude', 'sophisticated', 'arab', 'kohl', 'clean-glam', 'everyday'],
    fitzpatrickFit: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    undertones: ['all'],
    eyeLook: { technique: 'neutral lid, kohl accent', primaryColour: 'warm taupe + champagne', liner: 'kohl waterline, thin wing', lash: 'natural mascara or single flutter', brow: 'defined full brow' },
    faceLook: { base: 'medium-full coverage, natural finish', contour: 'warm tone nose + cheek', highlight: 'golden liquid glow', blush: 'warm peach', setting: 'dewy spray or light powder' },
    lipLook: {
      options: ['warm nude', 'dusty pink', 'beige rose', 'champagne'],
      liner: 'define + fill precisely',
      finish: 'satin or gloss',
    },
    difficulty: 2,
    timeMinutes: 25,
    occasions: ['work', 'brunch', 'mall', 'social media content'],
    season: ['all'],
  },
};

export function getLooksForCommunity(communityId) {
  return Object.values(LOOK_STYLES).filter(look =>
    look.community === communityId || look.community === 'all'
  );
}

export function getLooksByCategory(categoryId) {
  return Object.values(LOOK_STYLES).filter(look => look.category === categoryId);
}

export function getLooksByFitzpatrick(fitzLevel) {
  return Object.values(LOOK_STYLES).filter(look =>
    look.fitzpatrickFit.includes(fitzLevel)
  );
}

export function getLookById(lookId) {
  return LOOK_STYLES[lookId] || null;
}

export function getLooksByTag(tag) {
  const normalised = tag.toLowerCase().replace(/\s+/g, '-');
  return Object.values(LOOK_STYLES).filter(look =>
    look.tags.some(t => t.includes(normalised) || normalised.includes(t))
  );
}

export function getLooksByOccasion(occasion) {
  const norm = occasion.toLowerCase();
  return Object.values(LOOK_STYLES).filter(look =>
    look.occasions.some(o => o.includes(norm) || norm.includes(o))
  );
}

export function getFeaturedLooks(communityId) {
  let looks = Object.values(LOOK_STYLES).filter(look =>
    look.difficulty >= 3 && ['editorial', 'festive', 'bridal', 'performance'].includes(look.category)
  );
  if (communityId) {
    looks = looks.filter(look => look.community === communityId || look.community === 'all');
  }
  return looks.sort((a, b) => b.difficulty - a.difficulty);
}

export function getBeginnerLooks() {
  return Object.values(LOOK_STYLES).filter(look => look.difficulty <= 2);
}

export function getQuickLooks() {
  return Object.values(LOOK_STYLES).filter(look => look.timeMinutes <= 20);
}

export function rankLooksForProfile(profile) {
  const {
    community,
    fitzpatrick,
    undertone,
    occasions = [],
    difficulty_max = 5,
  } = profile;

  return Object.values(LOOK_STYLES)
    .map(look => {
      let score = 0;

      // Community match (highest weight)
      if (look.community === community) score += 40;
      else if (look.community === 'all') score += 20;

      // Fitzpatrick match
      if (look.fitzpatrickFit.includes(fitzpatrick)) score += 25;

      // Undertone match
      if (look.undertones.includes(undertone) || look.undertones.includes('all')) score += 20;

      // Occasion relevance
      if (occasions.length > 0) {
        const occMatch = occasions.some(occ =>
          look.occasions.some(o => o.includes(occ.toLowerCase()) || occ.toLowerCase().includes(o))
        );
        if (occMatch) score += 15;
      }

      // Difficulty filter (hard penalty)
      if (look.difficulty > difficulty_max) score -= 30;

      return { ...look, relevanceScore: score };
    })
    .filter(look => look.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

export function getSeasonalLooks(season, communityId) {
  let looks = Object.values(LOOK_STYLES).filter(look =>
    look.season.includes(season) || look.season.includes('all')
  );
  if (communityId) {
    looks = looks.filter(look => look.community === communityId || look.community === 'all');
  }
  return looks;
}

export function getAllBridalLooks() {
  return Object.values(LOOK_STYLES).filter(look => look.category === 'bridal');
}

export function getLookSummary(lookId) {
  const look = LOOK_STYLES[lookId];
  if (!look) return null;
  return {
    id: look.id,
    label: look.label,
    community: look.community,
    category: look.category,
    description: look.description,
    difficulty: look.difficulty,
    timeMinutes: look.timeMinutes,
    tags: look.tags.slice(0, 5),
    primaryColour: look.eyeLook?.primaryColour,
    lipOptions: look.lipLook?.options?.slice(0, 2),
  };
}

export function getAllLookIds() {
  return Object.keys(LOOK_STYLES);
}

export function getLooksGroupedByCategory(communityId) {
  const looks = getLooksForCommunity(communityId);
  return looks.reduce((acc, look) => {
    if (!acc[look.category]) acc[look.category] = [];
    acc[look.category].push(look);
    return acc;
  }, {});
}

export function getSimilarLooks(lookId, limit = 4) {
  const source = LOOK_STYLES[lookId];
  if (!source) return [];

  return Object.values(LOOK_STYLES)
    .filter(look => look.id !== lookId)
    .map(look => {
      let similarity = 0;
      if (look.community === source.community) similarity += 3;
      if (look.category === source.category) similarity += 2;
      const sharedTags = look.tags.filter(t => source.tags.includes(t)).length;
      similarity += sharedTags;
      const sharedFitz = look.fitzpatrickFit.filter(f => source.fitzpatrickFit.includes(f)).length;
      similarity += sharedFitz;
      return { ...look, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 4);
}
