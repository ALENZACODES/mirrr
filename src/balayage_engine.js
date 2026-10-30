/**
 * balayage_engine.js — Hair colour technique database for MIRRR
 * Balayage, ombre, highlights, traditional multicultural techniques
 */

// ─── COLOUR TECHNIQUE CATEGORIES ─────────────────────────────────────────────

export const TECHNIQUE_CATEGORIES = {
  highlight: { id: 'highlight', label: 'Highlights', description: 'Sections lightened throughout hair' },
  balayage: { id: 'balayage', label: 'Balayage', description: 'Hand-painted, sun-kissed lightening' },
  ombre: { id: 'ombre', label: 'Ombré', description: 'Gradient from dark roots to lighter ends' },
  sombre: { id: 'sombre', label: 'Sombré', description: 'Subtle, softer ombré' },
  full_colour: { id: 'full_colour', label: 'Full Colour', description: 'All-over permanent colour' },
  toning: { id: 'toning', label: 'Toning', description: 'Colour correction and neutralising' },
  gloss: { id: 'gloss', label: 'Gloss', description: 'Semi-permanent shine treatment' },
  traditional: { id: 'traditional', label: 'Traditional', description: 'Cultural/multicultural dyeing techniques' },
  natural: { id: 'natural', label: 'Natural Dye', description: 'Plant-based and natural colourants' },
};

// ─── HAIR COLOUR TECHNIQUES ───────────────────────────────────────────────────

export const TECHNIQUES = {

  // ── BALAYAGE ────────────────────────────────────────────────────────────────

  classic_balayage: {
    id: 'classic_balayage',
    name: 'Classic Balayage',
    category: 'balayage',
    description: 'Hand-painted highlights that mimic natural sun-lightening. Soft, blended, low-maintenance.',
    communities: ['all'],
    suitableFor: {
      hairTypes: ['1B', '1C', '2A', '2B', '2C', '3A'],
      fitzpatrick: ['I', 'II', 'III', 'IV'],
      baseShades: ['dark-brown', 'medium-brown', 'light-brown', 'dark-blonde'],
    },
    technique: {
      placement: 'Hand-painted sections from mid-length to ends',
      blending: 'Soft, feathered edges — no foils',
      processor: 'Bleach with 20-30 vol developer',
      developTime: '30-45 minutes',
      sectionPattern: 'Random, natural placement',
      applicationMethod: 'Freehand with paddle brush',
    },
    colourTargets: {
      liftLevels: ['2-3 levels of lift above base'],
      targetShades: ['honey blonde', 'caramel', 'golden brown'],
      finishingTone: 'Warm golden toner (8G, 9N)',
    },
    maintenance: {
      refreshInterval: '4-6 months',
      homeCareTips: [
        'Use colour-safe, sulfate-free shampoo',
        'Purple shampoo 1x per week to prevent brassiness',
        'Deep condition weekly',
      ],
      touchupAreas: 'Regrowth blends naturally — one of the lowest maintenance techniques',
    },
    difficulty: 4,
    duration: '3-4 hours',
    
    proOnly: true,
    tags: ['balayage', 'low-maintenance', 'sun-kissed', 'blended', 'highlights'],
  },

  melanin_balayage: {
    id: 'melanin_balayage',
    name: 'Melanin Balayage',
    category: 'balayage',
    description: 'Balayage technique adapted for deep skin tones and dark hair (Fitzpatrick IV-VI). Focuses on warm, rich dimension rather than extreme lightness.',
    communities: ['west-african', 'east-african', 'south-african', 'black-american', 'caribbean'],
    suitableFor: {
      hairTypes: ['3A', '3B', '3C', '4A', '4B', '4C'],
      fitzpatrick: ['IV', 'V', 'VI'],
      baseShades: ['black', 'very-dark-brown', 'dark-brown'],
    },
    technique: {
      placement: 'Face-framing pieces + scattered through lengths',
      blending: 'Smudge root technique for soft grow-out',
      processor: 'Bleach with 20 vol developer — low and slow',
      developTime: '40-60 minutes',
      sectionPattern: 'Chunky, visible sections for maximum impact on dark base',
      applicationMethod: 'Balayage board technique — supports hair during painting',
    },
    colourTargets: {
      liftLevels: ['1-2 levels on natural black/dark brown'],
      targetShades: ['auburn', 'deep red-brown', 'copper', 'caramel', 'cognac'],
      finishingTone: 'Red-warm toner to enhance rather than neutralise warmth',
    },
    maintenance: {
      refreshInterval: '3-4 months',
      homeCareTips: [
        'Avoid protein-heavy products on lightened sections',
        'Deep condition every wash',
        'Use Olaplex or similar bond-protecting treatment monthly',
      ],
      touchupAreas: 'Touch up face-framing every 3 months; body of hair 4-5 months',
    },
    difficulty: 5,
    duration: '4-6 hours',
    
    proOnly: true,
    tags: ['melanin', 'balayage', 'dark-hair', 'deep-skin', 'warm-tones', 'african'],
    notes: 'Natural black hair requires pre-softening or a slower lift process. Rushing risks damage on tightly coiled textures.',
  },

  foilayage: {
    id: 'foilayage',
    name: 'Foilayage',
    category: 'balayage',
    description: 'Balayage technique placed in foils for more controlled lift. Combines hand-painting precision with foil lightening power.',
    communities: ['all'],
    suitableFor: {
      hairTypes: ['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B'],
      fitzpatrick: ['I', 'II', 'III', 'IV'],
      baseShades: ['dark-brown', 'medium-brown', 'light-brown'],
    },
    technique: {
      placement: 'Painted sections placed into foil for enhanced lift',
      blending: 'Soft at roots (open air) — hotter at lengths (in foil)',
      processor: 'Bleach with 20-30 vol developer in foil',
      developTime: '25-40 minutes in foil',
      sectionPattern: 'Alternating between open air and foil sections',
      applicationMethod: 'Hand paint → place in foil → fold',
    },
    colourTargets: {
      liftLevels: ['3-5 levels of lift — more than open-air balayage'],
      targetShades: ['bright blonde', 'platinum', 'champagne', 'ash blonde'],
      finishingTone: 'Purple/violet toner to cancel yellow (9V, 10B)',
    },
    maintenance: {
      refreshInterval: '3-5 months',
      homeCareTips: [
        'Purple shampoo 2x per week',
        'Weekly mask',
        'Avoid heat above 180°C (350°F)',
      ],
      touchupAreas: 'Roots/face frame every 3 months; full refresh 5 months',
    },
    difficulty: 5,
    duration: '4-5 hours',
    
    proOnly: true,
    tags: ['foilayage', 'foils', 'blonde', 'lift', 'balayage'],
  },

  // ── HIGHLIGHTS ──────────────────────────────────────────────────────────────

  face_framing_highlights: {
    id: 'face_framing_highlights',
    name: 'Face-Framing Highlights',
    category: 'highlight',
    description: 'Brightening highlights placed around the face to frame and illuminate features. Flattering for all skin tones.',
    communities: ['all'],
    suitableFor: {
      hairTypes: ['all'],
      fitzpatrick: ['all'],
      baseShades: ['all'],
    },
    technique: {
      placement: '4-6 sections at front hairline and temples',
      blending: 'Blend into base 2-3 inches from roots',
      processor: 'Bleach or high-lift colour',
      developTime: '20-35 minutes',
      sectionPattern: 'Triangle sections on either side of face',
      applicationMethod: 'Foil or open air',
    },
    colourTargets: {
      liftLevels: ['2-4 levels lighter than base'],
      targetShades: ['Depends on base — caramel for brown, golden for dark blonde, warm blonde for medium blonde'],
      finishingTone: 'Personalised to skin undertone',
    },
    maintenance: {
      refreshInterval: '6-10 weeks',
      homeCareTips: ['Purple shampoo if blonde tones', 'Colour-safe products'],
      touchupAreas: 'Face frame only — quick service',
    },
    difficulty: 3,
    duration: '1.5-2.5 hours',
    
    proOnly: false,
    tags: ['face-frame', 'highlights', 'quick', 'beginners', 'flattering'],
  },

  traditional_chunky_highlights: {
    id: 'traditional_chunky_highlights',
    name: 'Chunky Highlights (Y2K Revival)',
    category: 'highlight',
    description: 'Bold, wide highlight sections inspired by early 2000s. Trending revival especially in Black-American and Latina communities.',
    communities: ['black-american', 'latina', 'caribbean'],
    suitableFor: {
      hairTypes: ['2A', '2B', '3A', '3B', '3C', '4A'],
      fitzpatrick: ['III', 'IV', 'V', 'VI'],
      baseShades: ['black', 'dark-brown', 'medium-brown'],
    },
    technique: {
      placement: 'Wide, visible foil sections — no blending between sections',
      blending: 'Hard line between highlight and base is intentional',
      processor: 'Bleach with 30 vol developer',
      developTime: '35-50 minutes',
      sectionPattern: 'Chunky, wide alternating sections',
      applicationMethod: 'Wide foils, no balayage',
    },
    colourTargets: {
      liftLevels: ['3-4 levels minimum for visible contrast on dark hair'],
      targetShades: ['platinum blonde', 'bleached blonde', 'bold contrast'],
      finishingTone: 'Bright toner or none (let warmth show for Y2K aesthetic)',
    },
    maintenance: {
      refreshInterval: '6-8 weeks',
      homeCareTips: ['Weekly bond treatment (Olaplex)', 'No sulfate shampoo', 'Purple shampoo for blonde sections'],
      touchupAreas: 'Regrowth on each highlight section',
    },
    difficulty: 3,
    duration: '2-3 hours',
    
    proOnly: false,
    tags: ['chunky-highlights', 'y2k', 'bold', 'contrast', 'black-american', 'latina'],
  },

  // ── OMBRÉ ───────────────────────────────────────────────────────────────────

  classic_ombre: {
    id: 'classic_ombre',
    name: 'Classic Ombré',
    category: 'ombre',
    description: 'Distinct gradient from dark roots to lighter ends with a visible transition point.',
    communities: ['all'],
    suitableFor: {
      hairTypes: ['1A', '1B', '1C', '2A', '2B', '2C', '3A'],
      fitzpatrick: ['I', 'II', 'III', 'IV'],
      baseShades: ['dark-brown', 'medium-brown', 'black'],
    },
    technique: {
      placement: 'Applied from a defined horizontal line mid-hair to ends',
      blending: 'Soft transition zone — blended at the gradient line',
      processor: 'Bleach or high-lift colour',
      developTime: '30-45 minutes',
      sectionPattern: 'Horizontal sections from defined point downward',
      applicationMethod: 'Brush application on lower sections, blended upward',
    },
    colourTargets: {
      liftLevels: ['3-6 levels from root to tip'],
      targetShades: ['blonde ends', 'honey ends', 'caramel ends'],
      finishingTone: 'Warm gold toner on ends; cool shadow root',
    },
    maintenance: {
      refreshInterval: '4-6 months',
      homeCareTips: ['Focus conditioning on ends', 'Purple shampoo on lighter ends'],
      touchupAreas: 'Blend line every 4-6 months; ends every 6 months',
    },
    difficulty: 3,
    duration: '2-4 hours',
    
    proOnly: true,
    tags: ['ombre', 'gradient', 'two-tone', 'classic'],
  },

  red_ombre_caribbean: {
    id: 'red_ombre_caribbean',
    name: 'Caribbean Red Ombré',
    category: 'ombre',
    description: 'Vibrant red-to-blonde or black-to-red gradient. Popular in Caribbean and Afro-Latina communities.',
    communities: ['caribbean', 'latina', 'black-american'],
    suitableFor: {
      hairTypes: ['3A', '3B', '3C', '4A', '4B'],
      fitzpatrick: ['IV', 'V', 'VI'],
      baseShades: ['black', 'dark-brown'],
    },
    technique: {
      placement: 'Black/dark roots fading to vivid red or copper-red at mid-length and ends',
      blending: 'Smudged gradient in red zone',
      processor: 'Bleach to pale yellow on ends, then vivid red colour',
      developTime: '40-60 minutes bleach + 25 minutes colour',
      sectionPattern: 'Lower two-thirds of hair',
      applicationMethod: 'Bleach lower sections, tone with vivid red',
    },
    colourTargets: {
      liftLevels: ['4-5 levels on ends for vivid colour to show'],
      targetShades: ['vivid red', 'fire red', 'copper red', 'auburn red'],
      finishingTone: 'Direct vivid red or semi-permanent red over bleached hair',
    },
    maintenance: {
      refreshInterval: '4-6 weeks (vivid fades fast)',
      homeCareTips: ['Colour-safe shampoo only', 'Cold water rinse to extend vibrancy', 'Red conditioner to refresh'],
      touchupAreas: 'Colour refresh every 4-6 weeks; bleach refresh 3-4 months',
    },
    difficulty: 5,
    duration: '4-6 hours',
    
    proOnly: true,
    tags: ['red', 'ombre', 'vivid', 'caribbean', 'afro-latina', 'bold'],
  },

  // ── TRADITIONAL / ETHNIC TECHNIQUES ─────────────────────────────────────────

  henna_colour: {
    id: 'henna_colour',
    name: 'Henna Hair Colour',
    category: 'traditional',
    description: 'Traditional plant-based hair colouring using Lawsonia inermis (henna). Used across South Asia, Middle East, North Africa for centuries.',
    communities: ['south-asian', 'arab', 'east-african', 'west-african'],
    suitableFor: {
      hairTypes: ['all'],
      fitzpatrick: ['all'],
      baseShades: ['all (results vary by base)'],
    },
    technique: {
      placement: 'Full-head application (or roots for coverage)',
      blending: 'No blending needed — uniform application',
      processor: 'Natural henna paste (no developer)',
      developTime: '2-4 hours or overnight (longer = deeper colour)',
      sectionPattern: 'Sectioned and applied root to tip',
      applicationMethod: 'Thick paste applied by hand or brush, wrapped in plastic',
    },
    colourTargets: {
      liftLevels: ['No lift — adds warm red/orange tone over existing colour'],
      targetShades: ['red-orange on black hair', 'vivid orange-red on brown hair', 'bright orange on lighter hair'],
      finishingTone: 'No toner — natural warmth is the goal',
    },
    ingredients: ['Henna powder (Lawsonia inermis)', 'Warm water or tea', 'Lemon juice (optional — brightens)', 'Amla powder (optional — darkens/conditions)', 'Coconut oil (optional — eases removal)'],
    maintenance: {
      refreshInterval: '4-6 weeks',
      homeCareTips: ['No chemical colour for 6 weeks after henna', 'Coconut oil to condition and deepen', 'Do not use metallic salts on top of henna'],
      touchupAreas: 'Full head or roots',
    },
    difficulty: 2,
    duration: '3-5 hours (including development)',
    
    proOnly: false,
    naturalDye: true,
    warnings: ['Henna is permanent — cannot be lifted out easily', 'Chemical dye over henna can cause green result', 'Black henna contains PPD — dangerous'],
    tags: ['henna', 'natural', 'traditional', 'south-asian', 'arab', 'plant-based', 'DIY'],
  },

  indigo_hair_black: {
    id: 'indigo_hair_black',
    name: 'Indigo for Natural Black Hair',
    category: 'traditional',
    description: 'Traditional indigo (Indigofera tinctoria) applied after henna to achieve natural black. Ancient technique from India, North Africa, and the Arab world.',
    communities: ['south-asian', 'arab', 'east-african'],
    suitableFor: {
      hairTypes: ['all'],
      fitzpatrick: ['all'],
      baseShades: ['all'],
    },
    technique: {
      placement: 'Full-head application after henna step',
      blending: 'Full, even coverage',
      processor: 'Natural indigo powder mixed with warm water',
      developTime: '1-2 hours',
      sectionPattern: 'Same as henna — full sections',
      applicationMethod: 'Paste applied over hennaed hair, wrapped in plastic',
    },
    colourTargets: {
      liftLevels: ['None'],
      targetShades: ['jet black', 'blue-black', 'dark brown-black'],
      finishingTone: 'Natural cool-black',
    },
    ingredients: ['Henna powder (applied first, 2hrs)', 'Indigo powder (applied second)', 'Warm water', 'Salt (optional — intensifies colour)'],
    maintenance: {
      refreshInterval: '4-6 weeks',
      homeCareTips: ['No chemical colour on top', 'Deep condition after each treatment', 'Coconut oil keeps colour glossy'],
      touchupAreas: 'Full head every 4-6 weeks; roots more frequently',
    },
    difficulty: 2,
    duration: '4-6 hours (two steps)',
    
    proOnly: false,
    naturalDye: true,
    tags: ['indigo', 'henna', 'black-hair', 'natural', 'traditional', 'south-asian', 'arab', 'plant-based'],
  },

  rooibos_tint: {
    id: 'rooibos_tint',
    name: 'Rooibos Tea Gloss',
    category: 'natural',
    description: 'South African rooibos tea used as a natural red-enhancing hair rinse. Adds warm, coppery tones to lighter brown or natural hair.',
    communities: ['south-african', 'all'],
    suitableFor: {
      hairTypes: ['all'],
      fitzpatrick: ['all'],
      baseShades: ['light-brown', 'medium-brown', 'blonde', 'red-brown'],
    },
    technique: {
      placement: 'Pour-over or soak method',
      blending: 'Uniform full-hair rinse',
      processor: 'Brewed rooibos tea (strong concentration)',
      developTime: '30-60 minutes soak or 10-minute rinse',
      sectionPattern: 'N/A — pour over all hair',
      applicationMethod: 'Pour brewed tea over hair after washing, leave 30-60 mins, rinse',
    },
    colourTargets: {
      liftLevels: ['None — adds warm tint only'],
      targetShades: ['subtle copper tone', 'warm red-brown hint'],
      finishingTone: 'Natural warmth',
    },
    ingredients: ['Rooibos tea bags (5-10 bags)', 'Boiling water (2 cups)', 'Optional: hibiscus tea for deeper red', 'Optional: apple cider vinegar (seals cuticle)'],
    maintenance: {
      refreshInterval: 'Weekly for cumulative effect',
      homeCareTips: ['Use weekly for gradual colour build-up', 'Combine with apple cider vinegar rinse for shine'],
      touchupAreas: 'Full hair — this is a rinse, not a targeted treatment',
    },
    difficulty: 1,
    duration: '45 minutes',
    
    proOnly: false,
    naturalDye: true,
    tags: ['rooibos', 'natural', 'south-african', 'tea-rinse', 'DIY', 'subtle'],
  },

  amla_darkening: {
    id: 'amla_darkening',
    name: 'Amla Darkening Treatment',
    category: 'traditional',
    description: 'Ayurvedic amla (Indian gooseberry) used as a conditioning darkening treatment. Darkens and strengthens simultaneously.',
    communities: ['south-asian'],
    suitableFor: {
      hairTypes: ['all'],
      fitzpatrick: ['all'],
      baseShades: ['all'],
    },
    technique: {
      placement: 'Full-head scalp and hair mask',
      blending: 'Even distribution root to tip',
      processor: 'Amla powder paste (no developer)',
      developTime: '1-3 hours',
      sectionPattern: 'Full sectioned application',
      applicationMethod: 'Paste mixed with warm water (and optional oils), applied like a mask',
    },
    colourTargets: {
      liftLevels: ['None — gently darkens over time'],
      targetShades: ['adds depth and richness to dark brown/black hair'],
      finishingTone: 'Naturally darker tone with added shine',
    },
    ingredients: ['Amla powder', 'Warm water', 'Coconut oil (optional)', 'Henna (optional — for stronger darkening + conditioning)'],
    maintenance: {
      refreshInterval: 'Monthly',
      homeCareTips: ['Use amla oil between treatments for maintenance', 'Combine with deep conditioning'],
      touchupAreas: 'Full head',
    },
    difficulty: 1,
    duration: '1.5-3 hours',
    
    proOnly: false,
    naturalDye: true,
    tags: ['amla', 'darkening', 'ayurveda', 'south-asian', 'conditioning', 'natural'],
  },

  // ── TONING / GLOSS ──────────────────────────────────────────────────────────

  toning_brass_correction: {
    id: 'toning_brass_correction',
    name: 'Anti-Brass Toning for Deep Skin',
    category: 'toning',
    description: 'Colour correction toning to neutralise unwanted warm/orange tones after bleaching on dark hair. Critical for achieving cool blondes on Fitzpatrick IV-VI.',
    communities: ['black-american', 'west-african', 'south-african', 'caribbean', 'east-african'],
    suitableFor: {
      hairTypes: ['3A', '3B', '3C', '4A', '4B'],
      fitzpatrick: ['IV', 'V', 'VI'],
      baseShades: ['pre-lightened'],
    },
    technique: {
      placement: 'Applied to pre-lightened hair only',
      blending: 'Even full coverage application',
      processor: '20 vol developer or low-volume (for glossing)',
      developTime: '15-25 minutes (watch carefully)',
      sectionPattern: 'Full even coverage',
      applicationMethod: 'Applied after bleach is rinsed and hair is towel-dried',
    },
    colourTargets: {
      liftLevels: ['Not applicable — corrective step'],
      targetShades: ['ash blonde', 'platinum', 'cool golden blonde', 'mushroom blonde'],
      finishingTone: '9P (violet), 9A (ash), 10V (violet) depending on target',
    },
    maintenance: {
      refreshInterval: '6-8 weeks',
      homeCareTips: ['Purple shampoo 2x per week', 'Blue shampoo for stronger brass control', 'Deep condition after every toning'],
      touchupAreas: 'Full head tone every 6-8 weeks',
    },
    difficulty: 3,
    duration: '1-1.5 hours',
    
    proOnly: true,
    warnings: ['Over-toning turns hair grey/lavender — watch timing', 'Always deep condition after toner'],
    tags: ['toning', 'brass', 'anti-brass', 'correction', 'deep-skin', 'blonde', 'bleached'],
  },

  // ── FULL COLOUR ─────────────────────────────────────────────────────────────

  burgundy_full_colour: {
    id: 'burgundy_full_colour',
    name: 'Burgundy/Bordeaux Full Colour',
    category: 'full_colour',
    description: 'Rich, deep burgundy or wine red all-over colour. One of the most flattering shades for deep skin tones — a beauty community favourite.',
    communities: ['black-american', 'west-african', 'south-african', 'caribbean', 'east-african'],
    suitableFor: {
      hairTypes: ['3A', '3B', '3C', '4A', '4B', '4C'],
      fitzpatrick: ['IV', 'V', 'VI'],
      baseShades: ['black', 'dark-brown'],
    },
    technique: {
      placement: 'Full head root to tip',
      blending: 'Even saturation',
      processor: 'Permanent colour with 20-30 vol developer, or vibrant semi-permanent over bleached base',
      developTime: '35-45 minutes',
      sectionPattern: 'Four quadrant sections',
      applicationMethod: 'Brush application root to end; let bleed to grey',
    },
    colourTargets: {
      liftLevels: ['Pre-lighten to red-orange first for vivid; or use dark burgundy permanent'],
      targetShades: ['deep burgundy', 'wine red', 'bordeaux', 'dark cherry'],
      finishingTone: 'Red-violet shampoo or colour-depositing conditioner to maintain',
    },
    maintenance: {
      refreshInterval: '4-6 weeks',
      homeCareTips: ['Colour-depositing shampoo in red/burgundy', 'Avoid heat tools', 'Colour-safe products only'],
      touchupAreas: 'Full head, or roots only if keeping shade',
    },
    difficulty: 3,
    duration: '2-3 hours',
    
    proOnly: false,
    tags: ['burgundy', 'wine-red', 'bordeaux', 'full-colour', 'deep-skin', 'popular'],
  },

};

// ─── COLOUR FAMILIES ─────────────────────────────────────────────────────────

export const COLOUR_FAMILIES = {
  warm_brunette: {
    id: 'warm_brunette',
    label: 'Warm Brunette',
    shades: ['caramel', 'honey', 'toffee', 'golden brown', 'chocolate', 'cognac'],
    bestFor: ['warm-undertone', 'neutral-undertone', 'Fitzpatrick III-V'],
    avoidFor: ['very cool skin tones'],
    communityFavourites: ['south-asian', 'latina', 'arab'],
    description: 'Rich warm brown tones that enhance golden skin undertones.',
  },
  cool_brunette: {
    id: 'cool_brunette',
    label: 'Cool Brunette / Espresso',
    shades: ['espresso', 'ash brown', 'cool chocolate', 'mushroom brown', 'mocha'],
    bestFor: ['cool-undertone', 'Fitzpatrick I-III'],
    avoidFor: ['very warm deep skin tones (can look muddy)'],
    communityFavourites: ['east-asian', 'south-asian (some)'],
    description: 'Ashy, cool brown tones that complement cooler skin undertones.',
  },
  warm_red: {
    id: 'warm_red',
    label: 'Warm Red / Auburn',
    shades: ['auburn', 'copper', 'chestnut', 'titan red', 'strawberry blonde'],
    bestFor: ['warm-undertone', 'neutral-undertone', 'Fitzpatrick II-V'],
    avoidFor: ['very pale skin (can overpower)'],
    communityFavourites: ['west-african', 'caribbean', 'black-american', 'east-african'],
    description: 'Warm red tones from copper to auburn — universally flattering on warm skin tones.',
  },
  deep_red_wine: {
    id: 'deep_red_wine',
    label: 'Deep Red / Wine',
    shades: ['burgundy', 'bordeaux', 'wine red', 'dark cherry', 'plum'],
    bestFor: ['deep-warm-undertone', 'neutral-deep-undertone', 'Fitzpatrick IV-VI'],
    avoidFor: ['Fitzpatrick I (too overwhelming)'],
    communityFavourites: ['black-american', 'west-african', 'caribbean'],
    description: 'Deep, rich reds and wines that pop beautifully against melanin-rich skin.',
  },
  natural_black: {
    id: 'natural_black',
    label: 'Natural Black / Blue-Black',
    shades: ['natural black', 'blue-black', 'jet black', 'soft black', 'off-black'],
    bestFor: ['all undertones', 'all fitzpatrick'],
    
    communityFavourites: ['east-asian', 'south-asian', 'arab'],
    description: 'Timeless black shades — from blue-black (classic K-beauty) to soft black.',
  },
  blonde_spectrum: {
    id: 'blonde_spectrum',
    label: 'Blonde Spectrum',
    shades: ['platinum', 'ash blonde', 'champagne', 'golden blonde', 'honey blonde', 'dirty blonde'],
    bestFor: ['cool-undertone (platinum/ash)', 'warm-undertone (golden/honey)'],
    
    communityFavourites: ['east-asian (platinum)', 'all (personalised to undertone)'],
    description: 'The full blonde family — from icy platinum to warm honey.',
  },
  vivid_fantasy: {
    id: 'vivid_fantasy',
    label: 'Vivid / Fantasy',
    shades: ['pastel pink', 'lilac', 'electric blue', 'teal', 'vivid green', 'rose gold'],
    bestFor: ['all — depends on shade and intention'],
    
    communityFavourites: ['east-asian', 'black-american', 'latina'],
    description: 'Vivid fantasy colours — requires bleached base for maximum vibrancy.',
  },
};

// ─── UNDERTONE → COLOUR GUIDE ────────────────────────────────────────────────

export const UNDERTONE_COLOUR_MAP = {
  warm: {
    recommended: ['warm_brunette', 'warm_red', 'deep_red_wine', 'blonde_spectrum (golden end)'],
    avoid: ['cool_brunette', 'ash blonde', 'platinum'],
    tip: 'Warm skin tones glow in golden, copper, and auburn shades. Avoid too-ashy tones that can look muddy.',
  },
  cool: {
    recommended: ['cool_brunette', 'blonde_spectrum (platinum/ash end)', 'vivid_fantasy'],
    avoid: ['warm_brunette (too orangey)', 'copper'],
    tip: 'Cool skin tones look stunning in ashy, cool tones and platinum. Vivid jewel tones also work beautifully.',
  },
  neutral: {
    recommended: ['all families — most versatile undertone'],
    
    tip: 'Neutral undertones can wear almost any shade. Experiment with both warm and cool sides of any colour family.',
  },
  deep_warm: {
    recommended: ['deep_red_wine', 'warm_red', 'natural_black', 'vivid_fantasy'],
    avoid: ['platinum (looks ashy against deep warm skin)'],
    tip: 'Deep warm skin tones are breathtaking in rich wines, coppers, and warm reds. Vivid colours like vivid blue can also pop spectacularly.',
  },
  deep_cool: {
    recommended: ['natural_black', 'cool_brunette', 'blonde_spectrum (with warm toner)', 'vivid_fantasy'],
    avoid: ['very warm coppers (can clash)'],
    tip: 'Deep cool skin tones suit cool blacks, ashy tones, and vivid colours. Blue-black is particularly stunning.',
  },
};

// ─── QUERY FUNCTIONS ─────────────────────────────────────────────────────────

/**
 * Get technique by ID
 * @param {string} id
 * @returns {Object|null}
 */
export function getTechnique(id) {
  return TECHNIQUES[id] || null;
}

/**
 * Get techniques suitable for a community
 * @param {string} communityId
 * @returns {Object[]}
 */
export function getTechniquesForCommunity(communityId) {
  return Object.values(TECHNIQUES).filter(t =>
    (t.communities || []).includes(communityId) || (t.communities || []).includes('all')
  );
}

/**
 * Get techniques suitable for a Fitzpatrick level
 * @param {string} fitzpatrick e.g. 'IV'
 * @returns {Object[]}
 */
export function getTechniquesForFitzpatrick(fitzpatrick) {
  return Object.values(TECHNIQUES).filter(t =>
    (t.suitableFor?.fitzpatrick || []).includes(fitzpatrick) ||
    (t.suitableFor?.fitzpatrick || []).includes('all')
  );
}

/**
 * Get all natural dye techniques
 * @returns {Object[]}
 */
export function getNaturalDyeTechniques() {
  return Object.values(TECHNIQUES).filter(t => t.naturalDye === true);
}

/**
 * Get techniques by category
 * @param {string} category
 * @returns {Object[]}
 */
export function getTechniquesByCategory(category) {
  return Object.values(TECHNIQUES).filter(t => t.category === category);
}

/**
 * Get DIY-safe techniques
 * @returns {Object[]}
 */
export function getDIYTechniques() {
  return Object.values(TECHNIQUES).filter(t => t.proOnly === false);
}

/**
 * Get colour recommendations for skin undertone
 * @param {string} undertoneId
 * @returns {Object|null}
 */
export function getColoursByUndertone(undertoneId) {
  return UNDERTONE_COLOUR_MAP[undertoneId] || null;
}

/**
 * Get colour family by ID
 * @param {string} familyId
 * @returns {Object|null}
 */
export function getColourFamily(familyId) {
  return COLOUR_FAMILIES[familyId] || null;
}

/**
 * Get techniques by tag
 * @param {string} tag
 * @returns {Object[]}
 */
export function searchTechniquesByTag(tag) {
  const norm = tag.toLowerCase();
  return Object.values(TECHNIQUES).filter(t =>
    (t.tags || []).some(tg => tg.includes(norm))
  );
}

// ─── STATS ───────────────────────────────────────────────────────────────────

