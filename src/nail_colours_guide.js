/**
 * MIRRR Nail Colours Guide
 * Colour theory for nails, shades by skin tone, seasonal palettes,
 * finish types, nail shape guide, and multicultural nail colour traditions
 */

// ─── NAIL COLOUR THEORY ───────────────────────────────────────────────────────

export const NAIL_COLOUR_THEORY = {
  why_it_matters: 'Nail colour interacts with skin tone, undertone, and hand appearance in the same way lip and foundation colours do. The "right" colour does not exist as an absolute — but understanding colour principles helps choose shades that flatter and complement.',
  warm_cool_neutral: {
    warm: 'Warm nail colours (reds with orange undertones, warm corals, golden yellows, warm bronzes) tend to harmonise with warm-undertoned skin and complement cool-undertoned skin through contrast.',
    cool: 'Cool nail colours (blues, purples, pinks with blue undertones, true reds with blue undertone) harmonise with cool-undertoned skin.',
    neutral: 'Neutral nail colours (beige, soft pink, taupe) complement most skin tones because they don\'t create strong undertone conflict.',
  },
  contrast_principle: 'High contrast (very dark nail on very light hand; very bright nail on deep skin) creates a striking, bold effect. Low contrast (nude nail close to skin tone) creates a sophisticated, elongating effect. Neither is better — they serve different aesthetic goals.',
  nude_spectrum: {
    concept: 'A "nude" nail is relative — it approximates the wearer\'s own skin tone. A shade marketed as "nude" by brands with predominantly light-skin focus often looks grey, pink, or washed out on deeper skin tones.',
    fair_nude: 'Sheer pink, peachy pink, warm ivory, pale beige',
    medium_nude: 'Beige-pink, warm rose, sandy taupe',
    tan_nude: 'Warm caramel beige, tan-nude, warm taupe',
    deep_nude: 'Warm caramel, tawny brown, mocha, butterscotch — NOT grey-beige which will look corpse-like',
  },
};

// ─── NAIL COLOURS BY SKIN TONE ────────────────────────────────────────────────

export const NAIL_COLOURS_BY_SKIN_TONE = {
  fair: {
    skin_tone: 'Fair / Porcelain (Fitzpatrick I-II)',
    flattering: {
      everyday: ['Sheer pink', 'Soft rose', 'Nude-pink', 'Pale peach', 'Classic white', 'Pale lavender'],
      statement: ['True red (blue-toned — perfect on fair skin)', 'Navy blue', 'Soft pastels', 'Dusty blue', 'Lilac'],
      dark_drama: ['Deep burgundy', 'Black', 'Forest green'],
    },
    tip: 'Very light pinks and nudes that are too close to skin tone can make hands look bare from a distance — choose slightly pinker or warmer than skin for best effect.',
    avoid: 'Very orange or brick shades can look jarring on very cool-toned fair skin — unless that\'s the intended contrast.',
  },
  light_medium: {
    skin_tone: 'Light-Medium (Fitzpatrick II-III)',
    flattering: {
      everyday: ['Classic pink', 'Soft coral', 'Warm nude', 'Rose gold'],
      statement: ['Berry pink', 'Warm red', 'Cobalt blue', 'Teal', 'Burnt orange'],
      dark_drama: ['Oxblood', 'Deep plum', 'Midnight blue'],
    },
    notes: 'Most flexible range — the widest variety of shades look good here.',
  },
  medium_olive: {
    skin_tone: 'Medium-Olive (Fitzpatrick III-IV)',
    flattering: {
      everyday: ['Terracotta nude', 'Warm peach', 'Caramel', 'Warm rose'],
      statement: ['Warm red', 'Burnt orange (excellent on olive)', 'Teal', 'Olive green', 'Rust'],
      dark_drama: ['Deep berry', 'Chocolate brown', 'Warm plum'],
    },
    notes: 'Warm, earthy tones are particularly beautiful on olive skin. Terracotta and rust shades exceptional here.',
  },
  tan: {
    skin_tone: 'Tan-Medium (Fitzpatrick IV)',
    flattering: {
      everyday: ['Warm caramel nude', 'Tawny pink', 'Bronze-gold'],
      statement: ['Bright coral', 'Warm orange-red', 'Vivid fuchsia', 'Deep teal', 'Bronze metallic'],
      dark_drama: ['Deep plum', 'Burgundy', 'Navy'],
    },
    notes: 'Bright, vivid shades look particularly striking against tan skin.',
  },
  deep: {
    skin_tone: 'Deep-Dark (Fitzpatrick V-VI)',
    flattering: {
      everyday: ['Warm mocha nude', 'Warm caramel', 'Deep copper', 'Brick red'],
      statement: ['Vivid coral', 'Bright fuchsia', 'Electric blue', 'Vivid orange', 'Bright yellow', 'Hot pink — ALL vibrant shades pop against deep skin'],
      dark_drama: ['Deep plum', 'Blackened berry', 'Midnight green', 'Pure black', 'Very deep red'],
      metallics: 'Gold, copper, and bronze metallics are EXCEPTIONAL on deep skin tones — luminous against melanin.',
    },
    notes: 'Deep skin tones have the most striking visual relationship with vivid, saturated colours. Bright and bold nail colours that might look "too much" on lighter skin are absolutely stunning against deep melanin.',
    avoid: 'Very light pinks, grey-beige nudes, and pale lilacs can look ashy or washed out. Warm shades perform far better.',
  },
};

// ─── SEASONAL NAIL PALETTES ───────────────────────────────────────────────────

export const SEASONAL_NAIL_PALETTES = {
  spring: {
    season: 'Spring',
    mood: 'Fresh, optimistic, blooming',
    palette: ['Soft lilac', 'Mint green', 'Butter yellow', 'Soft coral', 'Warm pink', 'Periwinkle blue', 'Sage green'],
    trending_spring: ['Glazed donut/chrome (milky pink with chrome finish)', 'Floral nail art', 'Pastel rainbow nails'],
    notes: 'Spring nails celebrate softness and pastels. Jelly and sheer finishes particularly spring-appropriate.',
  },
  summer: {
    season: 'Summer',
    mood: 'Bright, vivid, energetic, playful',
    palette: ['Vivid coral', 'Hot pink', 'Turquoise', 'Vivid yellow', 'Electric blue', 'Bright orange', 'Neon (across all colours)'],
    trending_summer: ['Neon nails', 'French manicure in neon tips', 'Tropical nail art', 'Ombre beach colours', 'Jelly nails'],
    notes: 'Summer is the season for colour-play. Neons stand out against a tan. All skin tones can experiment with vivid summer colours.',
  },
  autumn: {
    season: 'Autumn / Fall',
    mood: 'Rich, warm, harvest, cozy',
    palette: ['Burnt orange', 'Deep rust', 'Warm burgundy', 'Caramel', 'Dark chocolate brown', 'Forest green', 'Warm terracotta', 'Mustard yellow'],
    trending_autumn: ['Cinnamon nails', 'Dark chocolate mocha', 'Glazed cranberry', 'Tortoiseshell nail art', 'Autumn leaves art'],
    notes: 'Autumn is the richest season for nail colour. Warm, earthy, and dark shades dominate. EXCELLENT season for deep skin tones (warm caramels and burnt oranges are spectacular).',
  },
  winter: {
    season: 'Winter',
    mood: 'Dark, dramatic, festive, icy',
    palette: ['Deep burgundy', 'Forest dark green', 'Navy blue', 'Icy silver', 'Festive red', 'Deep plum', 'Pure black', 'Rich emerald', 'Gold metallic'],
    trending_winter: ['Classic red French manicure tips', 'Velvet nail effect', 'Festive nail art (snowflakes, stars)', 'Dark jelly nails', 'Gold foil nail art'],
    notes: 'Deep, saturated, and metallic shades shine in winter. Festive accents (gold foil, star art) are appropriate here. Dark jelly nails (deep colour with a sheer-jelly finish) are very popular in winter.',
  },
};

// ─── NAIL FINISHES ────────────────────────────────────────────────────────────

export const NAIL_FINISHES = {
  creme: {
    finish: 'Crème',
    description: 'Classic fully opaque, non-reflective finish. The most common nail finish. What most people think of as "standard" nail polish.',
    best_for: 'Classic looks; everyday; office',
  },
  shimmer: {
    finish: 'Shimmer',
    description: 'Fine reflective particles throughout the polish. Adds dimension and subtle sparkle without full glitter.',
    difference_from_glitter: 'Shimmer = fine uniform particles throughout. Glitter = larger visible particles (often chunky). The line blurs with ultra-fine micro-glitter.',
  },
  glitter: {
    finish: 'Glitter',
    description: 'Visible glitter particles. Can be dense (full glitter coverage) or sparse (glitter accent).',
    removal_warning: 'Glitter polish is the hardest to remove. Use foil method: saturate a cotton pad with remover, press to nail, wrap in foil 5-10 minutes, then press and twist off.',
  },
  metallic: {
    finish: 'Metallic / Foil',
    description: 'High-shine mirror-like metallic finish. Chrome effect, foil nails. The closest to actual metal appearance.',
    application_note: 'Many metallic finishes are best applied with a sponge or specific chrome powder method rather than brush application.',
  },
  jelly: {
    finish: 'Jelly / Glass',
    description: 'Translucent, sheer, gelatinous appearance. Looks "squishy" or like coloured glass. Requires layering for colour payoff.',
    trend: 'Extremely popular 2022-2025. Particularly popular in glazed donut (sheer milky pink with chrome) and watermelon (red jelly with green tips) iterations.',
  },
  matte: {
    finish: 'Matte',
    description: 'Flat, non-reflective surface. Very chic and modern. Soft-focus nail.',
    application: 'Matte topcoat can be applied over any crème colour to matte-ify it.',
    tip: 'Matte nails show oil and fingerprints more than glossy. Wash hands minimally after application.',
  },
  chrome: {
    finish: 'Chrome / Mirror',
    description: 'Ultra-high-shine reflective finish achieved with chrome powder. Applied over gel base coat; powder is rubbed onto gel before curing.',
    home_application: 'Requires gel system. A chrome topcoat (brush-on liquid chrome) can approximate but rarely matches salon chrome powder effect.',
  },
  velvet: {
    finish: 'Velvet / Textured',
    description: 'Soft, textured appearance (like velvet or suede) achieved with textured polish or flock (fine fibres) application.',
    note: 'Difficult to achieve at home without flock powder. Several brands sell textured polishes with the texture already in the formula.',
  },
  duochrome: {
    finish: 'Duochrome / Multichrome',
    description: 'Shifts colour depending on the angle of light — can appear to go from blue to purple, or gold to green. Created by specialised light-interference pigments.',
    note: 'A real showstopper. Brands like KBShimmer, ILNP, and Cirque Colors specialise in these effects.',
  },
};

// ─── NAIL SHAPES AND COLOUR INTERACTION ──────────────────────────────────────

export const NAIL_SHAPES = {
  overview: 'Nail shape affects how colour appears. Long nails show more colour surface area; short nails show less. Certain shapes also make fingers appear longer or shorter.',
  shapes: {
    square: {
      shape: 'Square',
      description: 'Flat straight tip with sharp 90° corners.',
      finger_effect: 'Makes fingers appear wider.',
      colour_tip: 'Bold, dark, and graphic colours look great. French manicure works well.',
    },
    squoval: {
      shape: 'Squoval (Square-Oval)',
      description: 'Flat tip with slightly rounded corners. The most popular shape.',
      finger_effect: 'Neutral — flatters most finger shapes.',
      colour_tip: 'Versatile — suits all colours.',
    },
    oval: {
      shape: 'Oval',
      description: 'Sides filed in; tip rounded like an egg.',
      finger_effect: 'Elongates fingers. Very feminine and traditional.',
      colour_tip: 'All colours work; classic reds and nudes look particularly elegant.',
    },
    almond: {
      shape: 'Almond',
      description: 'Similar to oval but tapers more sharply to a point at the tip.',
      finger_effect: 'Most elongating shape. Very elegant.',
      colour_tip: 'Dark shades and metallics look very editorial. Nudes are ultra-chic.',
    },
    coffin: {
      shape: 'Coffin / Ballerina',
      description: 'Long with squared-off tip and tapered sides.',
      finger_effect: 'Long and bold.',
      colour_tip: 'Bold, vivid, and graphic looks. Nail art shows well on the flat tip area.',
      ethnic_note: 'Coffin nails have been particularly popular in Black American, Latina, and Caribbean beauty culture. The long, dramatic nail as self-expression has deep roots in these communities.',
    },
    stiletto: {
      shape: 'Stiletto / Pointed',
      description: 'Very pointed tip. Exclusively achieved with acrylics or very long natural nails.',
      finger_effect: 'Extreme elongation. Very dramatic.',
      colour_tip: 'Dramatic colours and nail art. Barely-there nude for a paradoxically striking minimal look.',
    },
    round: {
      shape: 'Round',
      description: 'Follows the natural curve of the fingertip. Short and practical.',
      finger_effect: 'Natural and understated.',
      colour_tip: 'Soft, everyday colours. Jelly nails and naturals look beautiful.',
    },
  },
};

// ─── FRENCH MANICURE VARIATIONS ───────────────────────────────────────────────

export const FRENCH_MANICURE_GUIDE = {
  classic: {
    style: 'Classic French Manicure',
    description: 'Sheer pink or nude base with white tips. The most timeless nail look globally.',
    application: ['Apply sheer pink or nude base', 'Use French manicure guide strips or freehand a smile line', 'Apply white tip polish', 'Top coat'],
    ethnic_note: 'Classic white French tips look beautiful on all skin tones but the base colour should be adjusted — a pink base looks different on fair vs deep skin. Choose a base that complements your skin: deeper nudes for deep skin, pinkier shades for fair skin.',
  },
  modern_french: {
    style: 'Modern French',
    description: 'Updated versions replacing white tips with: colour tips, metallic tips, double-line French, negative space, barely-there glazed French.',
    variations: {
      
      glazed_donut: 'Sheer milky pink base + chrome mirror topcoat. Very popular 2022-2024.',
      reverse_french: 'Colour at the base (half-moon) rather than the tip.',
      double_french: 'Two lines of French tips in different colours or with gap between.',
    },
  },
};

// ─── ETHNIC NAIL COLOUR TRADITIONS ───────────────────────────────────────────

export const ETHNIC_NAIL_TRADITIONS = {
  west_african: {
    community: 'West African',
    traditions: 'Nail polish and decoration important in West African celebratory culture. Henna nail staining (mehndi) in some Muslim communities — particularly for Eid. Bright, vivid colours popular for festive occasions.',
    modern: 'Nigerian beauty culture pushes the longest, most elaborate nail looks. Coffin and stiletto acrylics with nail art are prominent.',
  },
  south_asian: {
    community: 'South Asian',
    traditions: 'Mehendi (henna) on the nails and hands is the traditional nail colouring. Bridal mehendi patterns extending to the nail bed are traditional at South Asian weddings. Bright red nail lacquer was the first western nail colour widely adopted in South Asian communities.',
    modern: 'Gel and acrylic nails increasingly popular especially in diaspora communities. Bridal nails (intricate nail art, gel extensions) growing.',
  },
  caribbean: {
    community: 'Caribbean',
    traditions: 'Bright, vivid nail colours are culturally celebrated. Carnival-inspired colours (vivid pinks, oranges, blues, greens) for festival season. Nail salons are community social spaces in Caribbean communities.',
  },
  arab: {
    community: 'Arab',
    traditions: 'Henna staining of nails in traditional Arab and Gulf communities. Some Muslim scholars consider regular nail polish to invalidate wudu (ablution); water-permeable nail polishes developed specifically for this concern (brands like Monday Polish, 786 Cosmetics, Orly Breathable).',
    modern: 'Long, coffin-shaped nails very popular across Gulf Arab beauty culture. Elaborate nail art and gel extensions for formal occasions.',
    permeable_polish: 'Breathable/water-permeable nail polishes are a growing category serving Muslim women who wish to practice nail polish within the observance of wudu — the polish allows water molecules to pass through.',
  },
  latina: {
    community: 'Latina',
    traditions: 'Nail beauty is highly valued across Latina cultures. Vivid reds, pinks, and bright colours are staples. Nail salons are important community spaces.',
    modern: 'Coffin, almond, and long gel extensions are popular. Quinceañera nail looks (elaborate, themed) are a proud tradition.',
  },
  east_asian: {
    community: 'East Asian',
    
    modern: 'Japanese nail art (3D nail art, character nail art) is globally influential and highly skilled. Korean "subtle" nail art (simple geometric, thin line art) widely replicated globally.',
  },
  east_african: {
    community: 'East African',
    traditions: 'Henna nail staining for celebrations. Bright colours for festive occasions.',
  },
  south_african: {
    community: 'South African',
    traditions: 'Nail decoration important in South African Black beauty culture. Nail salons widespread. Cape Malay communities celebrate vivid nail colours.',
  },
  black_american: {
    community: 'Black American',
    traditions: 'Long nails as a beauty statement have been part of Black American beauty culture for decades before becoming a global trend. Acrylic nails, gel nails, and elaborate nail art were popularised significantly by Black American women and nail technicians. The "ghetto nail" (pejorative term for long, vivid nails) has been reclaimed as culturally significant Black beauty expression.',
    icons: 'Cardi B (elaborate long nails), Lizzo, and countless others have celebrated long, bold nails as Black cultural expression.',
    nail_techs: 'Black nail technicians played a massive role in building the acrylic and gel nail industry in America, particularly in the 1980s-90s.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getNailColourTheory() { return NAIL_COLOUR_THEORY; }
export function getNailColoursBySkinTone(skinTone) {
  return NAIL_COLOURS_BY_SKIN_TONE[skinTone] || NAIL_COLOURS_BY_SKIN_TONE;
}
export function getSeasonalNailPalette(season) {
  const key = season?.toLowerCase();
  return SEASONAL_NAIL_PALETTES[key] || SEASONAL_NAIL_PALETTES;
}
export function getNailFinish(finish) {
  return NAIL_FINISHES[finish] || NAIL_FINISHES;
}
export function getNailShapeGuide(shape) {
  return NAIL_SHAPES.shapes[shape] || NAIL_SHAPES;
}
export function getFrenchManicureGuide() { return FRENCH_MANICURE_GUIDE; }
export function getEthnicNailTradition(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_NAIL_TRADITIONS[key] || Object.values(ETHNIC_NAIL_TRADITIONS);
}

