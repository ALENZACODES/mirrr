/**
 * MIRRR — Color Theory for Ethnic Skin Tones
 * Understanding which makeup shades, clothing colors, and beauty palette choices
 * work best for different skin tones across all 9 communities. Color theory is
 * universal physics applied to the infinite variety of human skin, hair, and eyes.
 * This module bridges Western color theory with culturally-specific color traditions.
 */

export const ETHNIC_COLOR_THEORY_GUIDES = {
  'west-african': {
    communityId: 'west-african',
    communityName: 'West African',
    foundationMatching: {
      challenge: 'The beauty industry famously failed deep skin tones for decades — 40 shades ended at a medium tan. This is changing but still requires strategy.',
      strategy: [
        'Test in natural light — store lighting makes everything look different.',
        'Swatch on jawline, not hand (different undertone and shade).',
        'For warm undertones: look for shades with N (neutral), W (warm), WN, or specific terms like mahogany, espresso, mocha, amber.',
        'Avoid foundations that oxidize orange — test for 2+ hours before committing.',
        'Brands doing deep shades well: Fenty Beauty, MAC, NARS, Huda Beauty, Juvia\'s Place (Black-owned, specifically for deep tones), Black Opal (historically for Black skin).',
      ],
    },
    makeupColors: {
      eyeshadow: {
        mostFlattering: ['Jewel tones: emerald, sapphire, amethyst, ruby pop dramatically on deep skin', 'Warm tones: terracotta, burnt orange, copper, bronze complement warm undertones', 'True black creates drama', 'Neon colors: lime, hot pink, electric blue — pop in ways they cannot on lighter skin'],
        toAvoid: ['Chalky pastels that wash out without heavy pigmentation', 'Overly sheer or frost-only formulas that don\'t show up'],
        culturalColors: ['Gold: the color of Yoruba royalty (ose ibeji, gold beads)', 'Purple/violet: associated with Ashanti royalty in Ghana', 'Red: celebratory across West African cultures', 'White: ceremonial and spiritual across many traditions'],
      },
      lipColors: {
        mostFlattering: ['Deep berries and plums (gorgeous on dark skin)', 'True reds (classic)', 'Bright corals and oranges (unexpected but stunning)', 'Nude: must be warm/brown-based for deep skin. Cool-toned nudes read grey/corpse. Rule: nude should be 1-2 shades lighter than your actual lip color.'],
        toAvoid: ['Cold-toned nude/pink that reads grey on deep skin', 'Very light pinks that look ashy'],
      },
      blush: {
        mostFlattering: ['Brick red, deep rose, wine-colored blushes — the light colors that work on lighter skin don\'t show up', 'Pat McGrath Labs and Fenty have blushes formulated for deep skin'],
        application: 'Apply more product than you think — the opacity of melanin-rich skin requires bolder application to show color.',
      },
      highlighter: {
        mostFlattering: ['Gold, copper, bronze highlighters create extraordinary luminosity against dark skin', 'Champagne and white highlighters can appear ashy — test first'],
        culturalNote: 'The West African tradition of anointing skin with oil for shine predates the "strobing" and "glass skin" beauty trend by thousands of years.',
      },
    },
    clothingColors: {
      explode: ['White and ivory against deep skin (incredible contrast)', 'Primary brights: red, yellow, royal blue, grass green', 'Neons: lime, hot pink, orange — colors that "overwhelm" lighter skin are vibrant on dark skin', 'Bold patterns: West African ankara/kente patterns were always saturated and bold because they were designed for deep skin tones to begin with'],
      beautiful: ['Rich earth tones: terracotta, rust, deep ochre complement warm undertones', 'Jewel tones: deep purple, emerald, sapphire', 'Black: the ultimate power color, stunning on dark skin', 'Gold: both as a clothing color and as accessories'],
      considerations: ['Very dark navy and charcoal on very dark skin creates a "lost in shadow" effect — contrast helps', 'Dusty or muted tones work but need care — make sure they don\'t appear to dull your skin vs. illuminate it'],
    },
    jewelryMetals: {
      gold: 'Flatters warm undertones and carries deep cultural meaning. Pure gold, yellow gold, rose gold — all excellent.',
      silver: 'Can work beautifully with cool-undertone deep skin. Less traditional but striking.',
      coppperBronze: 'Spectacular against deep skin. Ancient and contemporary in West African aesthetics.',
    },
    wearingColorTraditionally: {
      description: 'West African textile traditions — kente, ankara/wax print, aso-oke, kanga, boubou fabrics — were designed with saturated, jewel-toned, high-contrast colors from their origin. They were designed BY and FOR deeply melanated people and are optimized for this skin tone. Wearing these traditional textiles is not just cultural connection — it is color theory perfected.',
    },
  },

  'south-asian': {
    communityId: 'south-asian',
    communityName: 'South Asian',
    foundationMatching: {
      strategy: [
        'South Asian skin often has yellow-olive undertones — avoid foundations with too much pink, which will look mask-like.',
        'Look for: warm beige, warm tan, warm golden, olive in descriptions.',
        'Brands that do well: Fenty, Maybelline Fit Me (vast range), NARS, MAC (Studio Fix extensive range).',
        'Elf, L.A. Girl, NYX drugstore options have improved significantly for olive/warm undertones.',
      ],
    },
    makeupColors: {
      eyeshadow: {
        mostFlattering: ['Purple-plum: the complementary colour to warm-brown skin', 'Bronze and copper: enhance warm undertones beautifully', 'Warm browns: an everyday staple — blends naturally with warm skin', 'Teal and green: surprising but beautiful on warmer undertones', 'Gold: the classic Indian bridal look is a masterclass in gold eyeshadow for a reason'],
        culturalColors: ['The South Asian bridal eye: kohl + gold shadow + deep crease color + red sindoor + gold jewelry. A complete color system developed over centuries.'],
      },
      lipColors: {
        mostFlattering: ['Deep berry and wine: stunning on warm-olive skin', 'Classic red: the go-to for good reason — works on virtually all South Asian skin tones', 'Nude: warm-beige nudes with slight yellow or rose-brown. NOT cool-grey nudes.', 'Coral-peach: freshens up the face beautifully'],
        culturalNote: 'Red lipstick has deep significance in South Asian culture — associated with marriage, Shakti (divine feminine energy), and celebration.',
      },
      blush: {
        mostFlattering: ['Warm peachy-coral for lighter South Asian skin', 'Deep rose or berry for medium-deep South Asian skin', 'A bronzer as contour is often more natural-looking than cool-toned contour powder'],
      },
    },
    clothingColors: {
      perfect: ['Warm jewel tones: emerald, royal blue, deep purple — classic Indian colors for a reason', 'Red: the quintessential South Asian bridal and festival color (power red, deep red)', 'Orange and saffron: cultural and aesthetically perfect for warm undertones', 'Gold and yellow: traditional significance and visually spectacular', 'Hot pink/magenta: iconic in South Asian textiles because it works perfectly on warm skin'],
      avoid: ['Mustard yellow on very yellow-undertoned skin (can clash rather than complement)', 'Washed-out pastels that aren\'t vibrant enough to register against warm skin'],
    },
  },

  'caribbean': {
    communityId: 'caribbean',
    communityName: 'Caribbean',
    generalPrinciples: [
      { principle: 'Embrace the tropical palette', why: 'The Caribbean\'s color traditions evolved in a tropical environment — bright ocean blues, intense greens of the forest, vivid hibiscus pinks, hot sunset oranges. These colors were developed IN an environment where the people who used them were Caribbean. Trust the tradition.' },
      { principle: 'Saturated colors are your birthright', why: 'The Carnival/Mas tradition of the Caribbean — among the most spectacular color celebrations in the world — evolved in communities of color. The costuming, the sequins, the feathers, the paint: these are designed for Caribbean skin.' },
      { principle: 'Match warmth or create contrast', why: 'For warm-undertoned Caribbean skin: match with warm colors (gold, terracotta, coral). For contrast and drama: go complementary (if warm skin, cool jewel tones create striking contrast).' },
    ],
    carnivalColors: {
      description: 'Carnival (Trinidad and Tobago, Barbados, Jamaica, etc.) is the world\'s greatest expression of color theory applied to human bodies. The colors used in Mas bands are specifically designed to be visible, vibrant, and celebratory when worn by people of African and Caribbean descent.',
      signature: ['Sequined gold, silver, and bronze', 'Electric blue feathers', 'Hot magenta', 'Brilliant orange and red', 'Lime and chartreuse', 'Full-body glitter in bold colors'],
    },
    makeupColors: {
      eyeshadow: ['Bright tropicals: teal, turquoise, electric blue for the ocean reference', 'Hot coral and orange', 'Gold and bronze (humidity-proof formulas essential)', 'Purple-violet'],
      lips: ['Coral and orange (stunning on warm Caribbean skin)', 'Red (universal)', 'Bright berry', 'Sheer gloss over a bold liner for the glossy-bold look'],
    },
  },

  'arab': {
    communityId: 'arab',
    communityName: 'Arab Middle Eastern',
    arabBeautyColorTradition: {
      kohl: 'Kohl (ithmid) around the eyes is the defining color tradition of Arab beauty — it was both cosmetic and medicinal. The deep black creates the dramatic eye that is the signature of Arab beauty aesthetics.',
      
      gold: 'Gold jewelry and embroidery has been central to Arab beauty aesthetics across all socioeconomic levels. The Khaleeji (Gulf) tradition of heavy gold jewelry is a complete color and aesthetic system.',
    },
    makeupColors: {
      eyeshadow: {
        mostFlattering: ['Gold: the Arab bridal eye is almost exclusively gold — for excellent reason', 'Bronze and copper: enhance the warm undertones', 'Deep brown smoky eye: the sophisticated everyday look', 'Burgundy and wine: for depth', 'Teal and jewel tones: for color, very striking against olive skin'],
      },
      lips: {
        mostFlattering: ['Nude-warm: warm, slightly peachy nude, never cool-toned grey', 'Deep wine and berry: evening drama', 'True red: elegant and classic', 'Coral: fresh and warm-weather appropriate'],
        tradition: 'In Arab beauty tradition, the eye is often the statement and the lip is kept nude or neutral — or both are bold for weddings.',
      },
    },
    clothingColors: {
      traditional: ['White thobes/abayas with embroidery: the contrast of gold embroidery on white against warm skin is a considered aesthetic choice', 'Black abaya: profound elegance, particularly with gold accessories', 'Deep jewel tones: the tradition of rich kaftan fabrics in ruby, emerald, sapphire, violet', 'Gold: as embroidery, as fabric, as accessories — gold against warm Arab skin tones is extraordinary'],
    },
  },

  'latina': {
    communityId: 'latina',
    communityName: 'Latina',
    theLatinaPalette: {
      
      oaxacanColors: ['The saturated cochineal red (made from insects — one of the most vivid reds in history)', 'Indigo deep blue', 'Marigold yellow (also deeply spiritual — used in Día de Muertos)', 'Intense tropical greens'],
    },
    makeupColors: {
      eyeshadow: {
        mostFlattering: ['Warm terracotta, rust, burnt sienna: the "tierra caliente" palette', 'Gold and bronze: complement warm undertones', 'Purple-plum: the complementary to warm skin tones', 'Smoky brown: an easy everyday choice'],
        culturalNote: 'Frida Kahlo\'s beauty aesthetic — thick dark brows, colorful flowers in hair, bold statement jewelry, bright colors — was a political and cultural statement that also happened to be perfectly suited to her warm Latina skin tone and dark features.',
      },
      lips: ['Terracotta and clay brown (THE millennial Latina lip, extremely flattering on warm skin)', 'Red (classic — a Latin beauty staple)', 'Warm berry-wine', 'Coral and orange for brightness'],
    },
    clothingColors: {
      perfect: ['Warm jewel tones: terracotta, rust, ochre, warm gold, rich red', 'Tropical brights: coral, mango, lime, turquoise — common across Caribbean Latina communities', 'Earth tones: warm brown, caramel, cream'],
      avoid: ['Icy pastels and cool-toned neons on warm-undertoned Latina skin — they fight with the undertone rather than complement it'],
    },
  },

  'east-asian': {
    communityId: 'east-asian',
    communityName: 'East Asian',
    theKBeautyColorPhilosophy: {
      title: 'Korean Beauty Color Philosophy: Dewy, Luminous, Effortless',
      philosophy: 'K-beauty aims for a specific aesthetic: "chok chok" (dewy, bouncy skin), glass skin (reflective luminosity), and an "I woke up like this" finish — not a heavily made-up look. The color choices in K-beauty reflect this philosophy: softer, diffused, blurred edges rather than sharp lines; blush applied lightly; lip colors often gradient-blurred.',
      signature: ['Blush applied to the nose as well as cheeks ("puppy makeup")', 'Gradient lip (darker at center, faded to edges)', 'Lower lash line emphasis (aegyo sal — emphasis on the lower "puffy" undereye area for a youthful look)', 'Very light foundation with significant coverage — the "natural flawless" paradox'],
    },
    makeupColors: {
      eyeshadow: {
        mostFlattering: ['Terracotta and warm brown (flatter warm and neutral undertones)', 'Coral and warm orange (complements neutral-warm undertones)', 'Dusty rose and mauve (for neutral-cool undertones)', 'Burgundy (for depth without drama)', 'Navy blue (interesting depth that works on neutral undertones)'],
        monolid: 'Eye makeup for monolid eyes is fundamentally different from hooded or double-lid application. Key techniques: apply color all over lid rather than in a crease; emphasize the lash line heavily; lower lash line emphasis creates depth and definition; eyelid tape or glue can create a temporary crease for those who choose to — this is a personal choice with significant cultural debate.',
      },
      lips: {
        mostFlattering: ['Coral-peach (the K-beauty fresh look)', 'Warm red (warm undertones)', 'Rose and mauve (neutral-cool undertones)', 'The K-beauty gradient: apply to the center of the lip and blend outward to a softer edge'],
      },
    },
    clothingColors: {
      perfect: ['Soft, muted tones work beautifully on lighter East Asian skin tones — dusty pink, sage, lavender, cream, soft blue', 'Jewel tones and brights for medium-deeper East Asian skin', 'White and ivory create classic contrast against black hair'],
    },
  },

  'east-african': {
    communityId: 'east-african',
    communityName: 'East African',
    colorTraditions: {
      ethiopian: 'Ethiopian traditional dress (habesha kemis) is usually white with coloured embroidery at the borders, worn with gold jewellery. The coffee ceremony aesthetic — white clothing, golden jewelry, incense smoke — is a complete color and sensory experience.',
      somali: 'Somali women\'s dirac (traditional dress) features vibrant, saturated colors — hot pink, royal blue, brilliant green, vivid orange — with gold embroidery. The dirac colors were chosen to complement deep Somali skin. Extensive gold jewelry completes the palette.',
      kenyan: 'Maasai beadwork is among the most sophisticated color coding systems in the world — colors have meaning: red for bravery, blue for sky/water/rain (God), orange and yellow for hospitality, green for land/health, white for purity, black for the people. The visual system was designed for deep-toned Maasai skin.',
    },
    makeupColors: {
      eyeshadow: ['Jewel tones: electric blue, emerald, ruby red pop extraordinarily against deep East African skin', 'Gold: stunning', 'Warm bronze and copper: complement warm undertones', 'Pure black: dramatic and perfect'],
      lips: ['Deep berry and wine: magnificent on deep skin', 'Bright red: classic', 'Orange and coral: vibrant and striking', 'Warm nude: must have brown-red base (not grey-pink)'],
    },
    clothingColors: {
      perfect: ['Brilliant, saturated colors that match the dirac tradition: fuchsia, royal blue, brilliant orange, lime', 'White with colored embroidery: the Ethiopian aesthetic', 'Gold embroidery on rich fabric'],
    },
  },

  'south-african': {
    communityId: 'south-african',
    communityName: 'South African',
    ndebeleMakeup: {
      description: 'Ndebele visual culture is one of the most distinctive geometric color traditions in the world. Ndebele homestead murals use primary colors (red, yellow, blue) against black and white geometric patterns. Ndebele women\'s beadwork follows a color coding system. This tradition influences modern South African beauty in how bold geometric color combinations are embraced.',
    },
    makeupColors: {
      eyeshadow: ['Jewel tones for Bantu-origin deep skin: emerald, cobalt, violet, ruby', 'Gold and bronze: always flattering', 'Terracotta and earth tones: South African landscape reference', 'For lighter Cape Malay/Indian South African skin: warm neutrals, terracotta, dusky rose'],
      lips: ['Deep wine and berry for deep skin tones', 'Terracotta and warm nude', 'Bold reds', 'Coral for lighter South African skin tones'],
    },
    clothingColors: {
      zulu: 'Zulu beadwork uses colors with specific cultural meanings. Red for love and sexuality. Blue for loyalty and fidelity. White for purity. Black for marriage. Green for domestic bliss. Yellow for wealth.',
      modern: 'Modern South African fashion draws on the complete spectrum — from Ndebele geometric bold colors to Cape Malay paisley to contemporary township street fashion (tsotsi style with bold prints).',
    },
  },

  'black-american': {
    communityId: 'black-american',
    communityName: 'Black American',
    blackBeautyColorHistory: {
      title: 'The History of Color in Black American Beauty',
      description: 'Black American beauty has a complex history with color. During the era of explicit white supremacy, certain colors and styles were coded as "appropriate" or "inappropriate" for Black people. The Civil Rights and Black Power movements reclaimed color as political statement — natural Afro, bright African prints, Black pride symbolism. The 1980s and 1990s brought the Harlem Renaissance influence on color — bold, joyful, expressive. Today, Black beauty is in a renaissance, with Black-owned brands finally offering the depth of shade ranges and the color expertise that had been denied by the mainstream industry.',
      fenty: 'Fenty Beauty\'s 40-shade foundation launch in 2017 was not just a business decision — it was a statement that deep skin tones deserve color options. The ripple effect changed the entire beauty industry.',
    },
    makeupColors: {
      eyeshadow: {
        mostFlattering: ['Jewel tones: the rule for deep skin — the richer the jewel, the more striking. Emerald, cobalt, amethyst, ruby.', 'Warm bronzes and coppers', 'Neon brights: on deep skin, neons are surprisingly wearable — electric blue, lime green, hot pink', 'True black: for the graphic liner moments that only work on deep skin', 'Bright white: as an inner corner highlight or on the water line, pops dramatically against dark skin'],
        technique: 'Pigment is key for deep skin. Many eyeshadows that show up on lighter skin fail to register on deep skin. Look for high-pigment, "ultra-pigmented" formulas, or build up with multiple layers. Use an eyeshadow primer.',
      },
      lipColors: {
        mostFlattering: ['Every shade of berry: plum, wine, black cherry — these are stunning on deep skin', 'Bold red: an eternal classic', 'Bright orange: unexpected but extraordinary on deep skin', 'Nude: the specific nude for deep skin must be darker than most "nudes" in stores — a warm brown-red nude, not a pink-beige', 'Black: a fashion-forward choice that works on deep skin in a way it cannot on lighter skin'],
        note: 'The standard "nude" lip in most stores is designed for white skin. For dark skin, your "nude" is in the warm brown-red-burgundy family.',
      },
      foundation: {
        undertoneRules: ['Warm undertones (red-orange cast in sunlight): look for N (neutral) or W (warm) formulas', 'Cool undertones (blue-violet cast): less common but look for cool/ashy formulations — Fenty has these', 'Test in natural light always', 'Fenty Beauty: the current gold standard for deep shade range and undertone variation'],
      },
      highlighter: {
        mustHave: ['Gold, copper, bronze highlighters on deep skin are extraordinary — light reflects off deep skin in ways it cannot off lighter skin', 'Try: Fenty Killawatt in Trophy Wife (gold), MAC Soft and Gentle (gold), NYX budget options'],
      },
    },
    clothingColors: {
      explode: ['White: maximum contrast against deep skin. Pure white is one of the most powerful color choices for deep skin tones.', 'Bright primaries: red, yellow, royal blue — colors that can overwhelm lighter skin tones are handled perfectly by deep skin\'s richness', 'Neons: lime, hot pink, electric blue — startlingly vibrant', 'Metallics: gold, silver, copper, bronze — spectacular'],
      classic: ['Black: the power statement. Black on black is sophisticated.', 'Earth tones: rich terracotta, deep rust, warm brown', 'Jewel tones: deep emerald, sapphire, ruby, amethyst'],
      culturalNote: 'The tradition of Afrocentric fashion — kente cloth, ankara patterns, adire indigo — specifically uses colors designed to be worn by African and African-descended people. These patterns evolved on, with, and for dark skin. Wearing them is honoring the color system they were built for.',
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL COLOR THEORY PRINCIPLES
// ─────────────────────────────────────────────────────────────────────────────

export const UNIVERSAL_COLOR_THEORY = {
  undertoneScience: {
    description: 'Undertones are the subtle color beneath the surface of your skin. While your skin tone changes (tans in summer, lighter in winter), your undertone remains constant. Undertones are the basis of color matching.',
    types: [
      { undertone: 'Warm', description: 'Golden, yellow, peachy, orange-red. The veins in your wrist appear green.', bestColors: 'Warm: gold, earthy tones, warm greens, oranges, corals, warm reds, warm neutrals', avoidColors: 'Very cool, icy tones can clash' },
      { undertone: 'Cool', description: 'Pink, red, blue, violet. The veins in your wrist appear blue or purple.', bestColors: 'Cool: jewel tones, sapphire, emerald, true red, rose, lilac, silver', avoidColors: 'Very warm, orange-toned colors can clash' },
      { undertone: 'Neutral', description: 'A mix of warm and cool, or balanced. Veins may appear blue-green.', bestColors: 'The most flexible undertone — most colors work. True black, true white, warm or cool.', note: 'Many people have neutral undertones and can wear both warm and cool colors.' },
      { undertone: 'Olive', description: 'A specific undertone common in Mediterranean, Middle Eastern, South Asian, and Latin skin. Green-gray cast over warm skin.', bestColors: 'Rich earth tones, warm jewel tones, deep greens', challenge: 'Can lean both warm and cool. Test before committing.' },
    ],
    howToFind: ['Vein test: check inner wrist in natural light (green = warm, blue/purple = cool, blue-green = neutral)', 'Jewelry test: does gold (warm) or silver (cool) look better on you?', 'White paper test: hold white paper next to face. If skin looks yellow/peachy next to it = warm. If skin looks pink/rosy = cool.'],
  },

  colorWheelBasics: {
    description: 'The color wheel shows relationships between colors. Knowing these relationships explains why certain colors flatter certain skin tones.',
    relationships: [
      { relationship: 'Complementary Colors', description: 'Colors opposite on the wheel. They create maximum contrast and vibrancy when paired.', examples: ['Red + Green', 'Blue + Orange', 'Purple + Yellow'] },
      { relationship: 'Analogous Colors', description: 'Colors adjacent on the wheel. They harmonize and create a cohesive look.', examples: ['Red + Orange + Yellow (warm palette)', 'Blue + Green + Teal (cool palette)'] },
      { relationship: 'Neutral Colors', description: 'Black, white, gray, brown, navy. These work with everything and are the foundation of any wardrobe.', skinToneNote: 'Neutrals flatter differently: white is most striking against deep skin; black is most striking against very light skin (maximum contrast).' },
    ],
  },

  makeupByFitzpatrick: {
    I_II: { description: 'Fair skin — blue or pink undertones often. Beware of anything orange-toned which washes out. Deep jewel tones create drama. Avoid very light, frosted colors that disappear.', lipNude: 'Pink-nude, baby pink, rose', highlighter: 'Champagne, pink gold', eyeshadow: 'Cool and warm both work. Pastels show up. Dark colors create strong drama.' },
    III_IV: { description: 'Medium/olive skin — the most versatile range. Almost all colors work. Olive undertones mean warm colors are especially flattering.', lipNude: 'Warm beige, warm rose-brown', highlighter: 'Gold, warm champagne, bronze', eyeshadow: 'Everything works. Warm tones complement. Jewels pop.' },
    V_VI: { description: 'Deep/very deep skin — the richest melanin. Bright, saturated colors are extraordinary. White creates maximum contrast. Pastels without pigment disappear.', lipNude: 'Warm brown-red, terracotta, mocha (NOT pink-beige)', highlighter: 'Gold, copper, bronze (white may appear grey)', eyeshadow: 'High-pigment formulas required. Jewel tones, neons, and deep shades all extraordinary.' },
  },

  colorSeasons: {
    description: 'The 4-season color analysis system (Spring, Summer, Autumn, Winter) is a Western framework developed primarily with light-skinned models. Applying it to skin tones of color requires adaptation. The core principle — that your natural coloring tells you what colors you look best in — remains useful even when the original labels don\'t perfectly fit.',
    adaptedSystem: [
      { season: 'Deep Autumn/Deep Winter (most common for Fitzpatrick V-VI)', colors: 'Rich, saturated, deep colors. Not washed-out or icy. The boldest colors are your best friends.', examples: 'Deep burgundy, forest green, cobalt, gold, pure white, charcoal, brilliant red' },
      { season: 'True Autumn (common for warm undertoned medium skin)', colors: 'Warm earth tones, spice tones, deep rusts and teals, gold.', examples: 'Terracotta, camel, olive green, teal, warm red, cognac' },
      { season: 'True Summer (cool-undertoned, medium-light)', colors: 'Soft, muted, cooler tones. Rose, dusty blue, plum, soft teal.', examples: 'Dusty rose, lavender, medium blue, soft red-raspberry, cool grey' },
      { season: 'True Spring (warm-undertoned light-medium)', colors: 'Warm but light. Peachy, warm pinks, clear greens, warm gold.', examples: 'Coral, peach, warm ivory, bright clear yellow-green, light warm brown' },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export function getColorTheoryGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_COLOR_THEORY_GUIDES['west-african'],
    'south-asian': ETHNIC_COLOR_THEORY_GUIDES['south-asian'],
    'caribbean': ETHNIC_COLOR_THEORY_GUIDES['caribbean'],
    'arab': ETHNIC_COLOR_THEORY_GUIDES['arab'],
    'latina': ETHNIC_COLOR_THEORY_GUIDES['latina'],
    'east-asian': ETHNIC_COLOR_THEORY_GUIDES['east-asian'],
    'east-african': ETHNIC_COLOR_THEORY_GUIDES['east-african'],
    'south-african': ETHNIC_COLOR_THEORY_GUIDES['south-african'],
    'black-american': ETHNIC_COLOR_THEORY_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

