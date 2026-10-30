/**
 * MIRRR — Colour Theory for Beauty (Ethnic Perspectives)
 * Comprehensive colour theory fundamentals applied to makeup,
 * hair colour, clothing, and ethnic beauty aesthetics.
 */

export const COLOUR_THEORY_FUNDAMENTALS = {
  title: 'Colour Theory Fundamentals for Beauty',
  colourWheel: {
    primary: 'Red, Yellow, Blue — the three primary colours from which all other colours are mixed; in light (additive colour mixing used in screens), the primaries are Red, Green, Blue (RGB)',
    secondary: 'Orange (red + yellow), Green (yellow + blue), Violet/Purple (blue + red) — the three secondary colours created by mixing pairs of primary colours',
    tertiary: 'Red-orange, yellow-orange, yellow-green, blue-green, blue-violet, red-violet — the six tertiary colours created by mixing a primary and an adjacent secondary colour',
    pigmentVsLight: 'Important distinction: pigment colour mixing (subtractive — mixing paints, makeup) works differently from light colour mixing (additive — screens, stage lighting); in pigment, blue + yellow = green; in light, blue + green = cyan; beauty products work in subtractive/pigment mixing'
  },
  colourProperties: {
    hue: 'The colour itself — red, orange, yellow, green, blue, violet; what we commonly refer to when we say something is "red" or "blue"',
    value: 'The lightness or darkness of a colour; a light blue has high value (closer to white); a dark navy has low value (closer to black); value is what makes a colour appear "light" or "deep"',
    saturation: 'Also called chroma or intensity; how vivid or muted a colour is; a highly saturated red is a bright, vivid red; a desaturated red becomes brownish/greyish; pastels are desaturated versions of their parent hues; neutrals (taupes, greys, beiges) have very low saturation',
    temperature: 'Colours are described as warm (red, orange, yellow — reminiscent of fire and sunlight) or cool (blue, green, violet — reminiscent of water and sky); this temperature property is crucial in makeup for understanding undertones and colour correcting'
  },
  colourHarmonies: {
    complementary: 'Colours opposite each other on the colour wheel; red and green, orange and blue, yellow and violet; create maximum contrast; complementary colour pairings are inherently energetic and attention-grabbing; using a colour\'s complement neutralises it (orange under-eyes neutralised by blue-based concealer)',
    analogous: 'Colours adjacent to each other on the colour wheel; warm coral + peach + orange; cool blue + blue-green + teal; analogous colours create harmonious, cohesive looks without strong contrast',
    triadic: 'Three colours equally spaced around the colour wheel; red + yellow + blue; orange + green + violet; creates vibrant, balanced colour looks',
    split: 'A colour paired with the two colours adjacent to its complement; creates more subtle contrast than direct complementary',
    monochromatic: 'Various tints (lighter) and shades (darker) of a single hue; creates a cohesive, sophisticated, tonal look; very popular in editorial and runway makeup; the "monochromatic makeup" trend (same colour family on eyes, cheeks, and lips)'
  },
  undertones: {
    what: 'Undertone is the subtle colour beneath the surface of the skin; the skin\'s surface colour (what you see) is the overtone; undertone describes whether the skin has a warm (golden, peachy, yellow), cool (pink, red, bluish), or neutral (a balance of both) underlying hue',
    importance: 'Undertone determines which makeup shades, hair colours, clothing colours, and metals flatter — regardless of how light or dark the skin is; a person can be very dark with warm undertones or very light with cool undertones',
    identifying: {
      veins: 'Classic test: look at the veins on the inside of the wrist in natural light; green or olive veins suggest warm undertones; blue or purple veins suggest cool undertones; a mix of green and blue suggests neutral',
      jewellery: 'Gold jewellery looks more flattering on warm undertones; silver jewellery looks more flattering on cool undertones; those who look equally good in both tend toward neutral',
      white: 'Hold a pure white piece of paper next to the face in natural light; warm undertones will make the face look slightly yellow or peachy against the white; cool undertones will make the face look slightly pink or rosy; neutral undertones won\'t noticeably shift either way',
      sun: 'Warm undertones tend to tan easily (yellow-gold tan); cool undertones tend to burn and pink before tanning (if they tan at all)'
    },
    ethnicPatterns: {
      note: 'Undertones cut across all ethnicities and skin tones; every skin tone from the lightest Fitzpatrick I to the deepest Fitzpatrick VI can have warm, cool, or neutral undertones; that said, some patterns exist within communities:',
      warmTendencies: 'East Asian, South Asian, Latin American, and West African populations have higher frequencies of warm (golden/olive/yellow) undertones though significant individual variation exists',
      coolTendencies: 'Northern European populations have higher frequencies of cool (pink/rosy) undertones; some East African and other African populations have cool-neutral undertones despite very dark skin; some South Asian individuals have notably cool-rosy undertones',
      neutral: 'Mixed heritage individuals often have beautifully complex neutral or "warm neutral" undertones that make shade matching particularly nuanced'
    }
  }
};

export const COLOUR_CORRECTING = {
  title: 'Colour Correcting Theory and Practice',
  principle: 'Colour correcting uses the principle of complementary colours: applying the opposite colour on the colour wheel to neutralise (cancel out) an unwanted skin tone or discolouration; the complementary colours cancel each other out when mixed, creating a neutral that matches the skin',
  correctors: {
    orange: {
      neutralises: 'Blue-toned and deep purple-brown under-eye darkness; dark spots with blue-grey undertones on deep skin',
      bestFor: 'Fitzpatrick IV-VI under-eye circles and dark spots; orange is the complement of blue; medium-to-dark skin tones need an orange or peach-brown corrector for dark circles',
      products: 'Colour correctors marketed as "deep" peach, burnt orange, or terracotta; black-owned brand Mented and others have created orange correctors specifically for deep skin tones'
    },
    peach: {
      neutralises: 'Blue-purple and violet under-eye darkness; redness on medium skin tones',
      bestFor: 'Medium skin tones (Fitzpatrick III-IV) with purple-tinged under eyes; lighter peach works on Fitzpatrick II-III',
      products: 'Peach colour correcting concealers by NYX, Too Faced, Tarte'
    },
    green: {
      neutralises: 'Redness: red spots, active acne, rosacea, broken capillaries; the complement of red is green',
      bestFor: 'All skin tones with red blemishes, rosacea, flushing, or red acne scarring; apply targeted to red areas, blend edges',
      application: 'Apply only to the red area (not all over the face); a thin layer is sufficient; blend edges to avoid visible green cast; apply skin-tone-matching foundation or concealer on top'
    },
    lavender: {
      neutralises: 'Yellow or sallow skin tones; brightens yellow cast',
      bestFor: 'Fair to medium skin with yellow or olive cast that appears dull or sallow',
      products: 'Lavender colour corrector; also available in colour-correcting primers'
    },
    yellow: {
      neutralises: 'Purple discolouration; mild bruising; purple-toned dark circles',
      bestFor: 'Light to medium skin tones; yellow primer can add a healthy "luminous" quality'
    },
    pink: {
      neutralises: 'Sallow or grey-looking skin; adds warmth and life to dull complexions',
      bestFor: 'Fair to light-medium skin with a grey or bluish cast; adds rosy warmth'
    }
  },
  applicationOrder: 'Apply colour corrector to the problem area first; allow to set for 30 seconds; apply full-coverage concealer on top; set with powder; full foundation can be applied over or blended at the edges',
  pitfalls: ['Using too much corrector creates a visible tinted cast that shows through coverage', 'Using the wrong corrector colour for the skin tone (pink peach on deep dark circles on dark skin requires orange-toned corrector, not light peach)', 'Not setting colour corrector before applying concealer (it moves around)']
};

export const FOUNDATION_SHADE_MATCHING = {
  title: 'Foundation Shade Matching Theory',
  overtoneVsUndertone: 'Foundation matching requires two components: matching the depth (how light or dark), and matching the undertone (warm/cool/neutral); many people know their depth but choose the wrong undertone, resulting in a foundation that looks ashy, too pink, or too orange',
  testing: {
    jawline: 'The gold-standard foundation test is on the jawline in natural daylight; a matched foundation disappears into the skin at the jaw without creating a visible line between face and neck; testing on the wrist is not reliable as the wrist is often a different tone from the face',
    natural: 'Always assess foundation in natural daylight; indoor store lighting (especially cool fluorescent light) makes foundations appear more neutral and can cause significant mismatches',
    settling: 'Allow foundation to oxidise on the skin for 5-10 minutes before assessing; many foundations oxidise (become warmer and slightly darker) on the skin due to skin pH and oils interacting with the pigments'
  },
  deepSkinfoundation: {
    challenge: 'Foundation shade matching for Fitzpatrick V-VI skin historically was the most poorly served segment of the beauty industry; deep skin tones often had access to only 2-5 very limited shades while light skin had 20+ options',
    fentyEffect: 'Fenty Beauty\'s 2017 launch with 40 shades revolutionised industry standards for deep skin coverage; the "Fenty Effect" caused competitor brands to expand their shade ranges; brands like NARS, MAC, Armani, and others expanded deep shade offerings significantly after Fenty',
    undertones: 'Deep skin tones have the most complex undertone variation and also the most industry neglect in undertone matching; deep skin can be deeply warm (golden-to-orange undertone), deeply cool (ashy/bluish-neutral), or deeply neutral; ash-skewing foundations (designed for light skin with cool undertones) often look ashy or greyish on deep warm skin; brands like Fenty Beauty, Fashion Fair (the historic Black-owned cosmetics pioneer), and NARS Sheer Glow have made serious efforts at deep skin undertone diversity',
    orange: 'The "too orange" foundation problem: many foundations that are the correct depth for deep skin tones had excessively warm/orange undertones; they read as orange or muddy on cool-undertone deep skin; finding cool-neutral deep foundations remains challenging'
  },
  asianFoundation: {
    challenge: 'East Asian skin tones are often yellow-undertoned with a unique "translucent" quality that Western foundation formulas sometimes overwhelm; Korean foundations (K-beauty) have been developed specifically for the East Asian skin aesthetic: lighter coverage, more translucent, with less white cast',
    koreaForA: 'Korean foundations often add a subtle "brightening" effect that creates the luminous, glass-skin look rather than full matte coverage; the K-beauty "cushion foundation" delivery system (liquid foundation in a sponge cushion applicator) was a major Korean beauty innovation now adopted globally'
  }
};

export const EYE_COLOUR_THEORY = {
  title: 'Eyeshadow Colour Theory for Eye Shape and Colour',
  byEyeColour: {
    brown: {
      description: 'Brown eyes are the most common globally; complementary and enhancing colours are wide-ranging because brown is a neutral; the challenge is finding shades that make brown eyes stand out rather than blend in',
      complementary: 'Purple (complement of yellow/brown\'s warm component): plum, lavender, mauve, amethyst make brown eyes appear warm and defined; blue and teal make brown eyes appear brighter; orange-copper and bronze warm tones enhance the golden-brown warmth of hazel-brown eyes; green eyeshadow enhances the green flecks in many hazel eyes',
      avoiding: 'Brown-on-brown (same family as the eye colour) tends to make eyes look smaller and muddier without contrast'
    },
    dark: {
      description: 'Very dark brown to black eyes; a deep, rich natural presence',
      complementary: 'Virtually any colour is complementary against very dark eyes as they provide strong contrast with almost any hue; shimmery and metallic shades are especially stunning as they catch light against dark eyes; deep wine, copper, gold, and emerald are particularly striking',
      technique: 'With very dark eyes, creating definition often means focusing on intensity, cut creases, or graphic liner rather than trying to "make" the dark eyes a different colour'
    },
    monolid: {
      
      techniques: ['All-over lid colour in a single shade or simple gradient is highly effective and elegant', 'Pupil-centred shimmer (applying shimmer only over the pupil area) creates the illusion of a rounder, more open eye', 'Eyeliner-forward looks that define the lash line; graphic liner in bold colours', 'Shadow placement must consider that the crease (if present) is low and may not be visible at first; depositing the "crease" colour higher than it appears in a closed eye']
    }
  },
  smokyEyeColour: {
    black: 'Classic black smoky eye; universal but particularly impactful on darker skin tones where the black creates a dramatic but not overpowering effect',
    navy: 'Navy blue smoky eye; creates a similar intensity to black but with more dimension; particularly flattering for cool undertones',
    deepBerry: 'Wine/plum/burgundy smoky eye; very flattering on olive to deep skin tones; creates a romantic, sultry effect',
    bronze: 'Bronze and copper smoky eye; warm and wearable; particularly striking on deeper skin tones where bronze catches the light beautifully',
    forest: 'Deep forest green smoky eye; unexpected and modern; beautiful for warm and neutral undertones'
  }
};

export const CLOTHING_COLOUR_ETHNIC = {
  title: 'Clothing Colour Harmonics for Ethnic Communities',
  principle: 'Clothing colour choice is a matter of personal preference and cultural significance; colour theory provides a framework but cultural tradition, personal meaning, and individual style preferences are equally or more important; these are suggestions, not rules',
  byUndertone: {
    warmUndertones: {
      flatteringColours: 'Earth tones (terracotta, rust, burnt orange, ochre, camel); olive and forest green; warm navy and cobalt; burgundy and wine; gold, copper, and bronze metallics; warm-toned creams and ivory (not pure cool white)',
      reasonForFlattery: 'Warm-toned colours resonate with the golden/yellow/peachy undertone in warm-undertoned skin, creating a harmonious warmth across the complexion'
    },
    coolUndertones: {
      flatteringColours: 'Cool jewel tones: royal blue, sapphire, emerald, amethyst; pure white; charcoal and cool grey; rose and bubblegum pink; burgundy with cool (blue-red) base; silver metallics',
      reasonForFlattery: 'Cool-toned colours complement the pink/rosy/blue undertone in cool-undertoned skin, creating a harmonious coolness'
    },
    neutralUndertones: {
      flatteringColours: 'The broadest range — both warm and cool colours can work; pure white, true navy, classic red, jade green are easy neutrals',
      advantage: 'Neutral-undertoned people can wear the widest range of colours without the "clash" effect that warm clothes create on cool undertones and vice versa'
    }
  },
  ethnicCulturalColour: {
    southAsian: 'Red (auspicious and bridal), saffron/yellow (sacred in Hindu tradition), green (associated with Islam in South Asian Muslim communities), pink (celebratory), white (historically mourning, though contemporary South Asian fashion embraces white clothing)',
    arab: 'White (purity and traditional dress — the thobe for men, some abayas for women); gold (affluence and celebration, significant in wedding attire); black (widely worn abaya in Gulf countries, also formal); green (sacred colour in Islam, historical significance)',
    westAfrican: 'Ankara (Dutch wax print) fabrics in bold, vibrant multi-colour patterns; kente cloth in gold, green, and red for Ghanaian occasions; white for traditional ceremonies; royal blue for Yoruba weddings; the colour story of West African fashion celebrates maximum vibrancy and pattern',
    eastAfrican: 'Somali traditional dress: white is common for men\'s traditional dress; women\'s dirac (traditional dress) in jewel tones and bright colours; Ethiopian traditional dress includes white shema fabric with colourful borders; Swahili coast kanga fabric in bold patterns',
    latina: 'Vibrant, saturated colours reflect Latin American folk art traditions: Mexican textiles use cobalt, pink, green, red; Caribbean fashion embraces tropical brights; formal occasions in many Latin American cultures use deep jewel tones',
    eastAsian: 'Red (auspicious in Chinese culture, particularly for Lunar New Year and weddings); white (traditionally mourning in Chinese culture — the opposite of Western convention); gold (prosperity); jade green (a culturally significant stone colour); Korean hanbok uses specific colour combinations that convey age, marital status, and occasion',
    blackAmerican: 'Black (sophistication and elegance, reclaimed as a power statement); white (notably at HBCU events and organisations); red, black, and green (Pan-African colours, representing blood, people, and land); Afrocentric colour palettes in Afrocentric fashion movements; blue and white for Crips in gang culture (now a gang identifier, not general fashion); the rich colour language of Black American fashion across decades from Harlem Renaissance to contemporary streetwear'
  }
};

export const HAIR_COLOUR_THEORY = {
  title: 'Hair Colour Theory and Undertone Harmony',
  warmVsCool: {
    warmHairColours: 'Golden blonde, honey blonde, warm chestnut brown, auburn, copper, red; these hair colours have yellow/orange/red bases; warm hair colours are harmonious with warm skin undertones',
    coolHairColours: 'Platinum blonde, ash blonde, cool brown (mushroom, taupe), dark chocolate brown with no warm base, blue-black; these hair colours have blue or grey-ash bases; cool hair colours harmonise with cool skin undertones',
    contrast: 'High contrast (very different hair colour from the skin tone — very dark hair on very fair skin, or very light hair on very dark skin) creates a dramatic, striking effect; low contrast (hair colour close to the skin tone) creates a softer, more blended effect'
  },
  deepSkinHairColour: {
    challenge: 'Hair lightening on highly melanated (Fitzpatrick V-VI) hair requires much more developer and lightening sessions than lighter hair; this means the lightening stages go from black to reddish-brown to red to orange before reaching gold or yellow-blonde',
    stages: ['Black/very dark brown (starting point)', 'Very dark red-brown', 'Red-brown', 'Red', 'Orange-red', 'Orange', 'Gold-orange', 'Gold', 'Yellow-gold', 'Yellow (very difficult to achieve on high-melanin hair without significant damage)'],
    warmTones: 'Warm colours — auburn, copper, burgundy, red, caramel highlights — are achievable with less damage and often look stunning on darker skin tones; Fitzpatrick V-VI skin with warm undertones and warm chestnut or auburn hair colour creates beautiful harmony',
    bleaching: 'Full bleaching to platinum on highly textured Type 4 hair is among the most damaging hair processes possible; the combination of the inherent fragility of Type 4 hair (more breakage points due to the coil) and the chemical damage of bleach requires exceptional care, protein treatments, and sometimes multiple staged sessions spread weeks apart'
  },
  greyHair: {
    biology: 'Grey hair is caused by the gradual loss of melanocytes (pigment-producing cells) in the hair follicle; hydrogen peroxide naturally produced in hair follicles accumulates over time and bleaches the melanin from inside; this process is genetically determined in its timeline',
    embracing: 'Grey hair has experienced a significant cultural rehabilitation in the 2010s-2020s; the "grey acceptance" movement, particularly in Black American communities (salt-and-pepper naturalistas) and the broader natural hair movement, has made grey hair a badge of confidence and authenticity rather than something to be hidden',
    covering: 'For those who choose to cover grey, the shade selection considers that grey hair is fully depigmented and therefore takes colour differently than pigmented hair; grey tends to be stubborn to colour (particularly silver-white grey) and may require higher developer or different processing'
  }
};

export const ETHNIC_COLOUR_GUIDES = {
  'west-african': {
    colourPhilosophy: 'West African colour philosophy, expressed most vibrantly through Ankara (Dutch wax print fabric) and traditional kente cloth, embraces maximum colour intensity, bold pattern mixing, and a joyful abundance of colour; the "more is more" aesthetic of West African fashion directly contradicts Western "neutral-forward" fashion sensibilities',
    makeup: 'Ghanaian women show variation but warm tones are common; colour correcting should address this specifically; vivid eyeshadow colours — electric blue, emerald, fuchsia — have long been part of West African beauty'
  },
  'south-asian': {
    colourPhilosophy: 'South Asian colour use in traditional dress is sophisticated and season/occasion coded; jewellery and clothing colours are carefully selected to harmonise with skin tone; the enormous variety of South Asian textiles (Banarasi silk, Kanjeevaram, Chanderi, Bandhani) involves rich, saturated colour traditions',
    makeup: 'this can create a naturally dramatic eye effect; complementary eyeshadow colours for South Asian warm undertones include warm copper, bronze, emerald green, deep purple, warm rose gold'
  },
  caribbean: {
    colourPhilosophy: 'Caribbean colour sensibility is tropical, vibrant, and celebratory; the natural environment — turquoise sea, tropical flowers, vivid sunsets — inspires a colour palette that translates into fashion and beauty; carnival culture celebrates the most extreme colour combinations possible',
    makeup: 'Carnival makeup (for Trinidad Carnival, Crop Over, etc.) is its own art form: full-face body paint, glitter, rhinestones, and designs inspired by masquerade costumes; for everyday Caribbean beauty, natural-enhancing looks with a pop of vivid colour (lip or eye) reflecting the tropical environment'
  },
  arab: {
    colourPhilosophy: 'Arab colour sensibility in makeup is sophisticated: dramatic, defined eye looks with perfectly groomed brows are the centre of Arab makeup culture; in beauty, colour is concentrated on the eyes and lips with a flawless, even skin base; the tradition of kohl-lined eyes in Arab beauty is thousands of years old',
    makeup: 'Arab eye makeup is characterised by very dramatic definition: thick kohl liner, extended cat-eye, smoky build; colour choices range from classic black to deep jewel tones; the warm caramel to medium-dark skin tones that are common across many Arab populations make warm eye colours (copper, bronze, deep rose gold) extremely flattering'
  },
  latina: {
    colourPhilosophy: 'Latina colour aesthetics reflect the vibrant Latin American cultural heritage: Mexican folk art uses cobalt blue, hot pink, lime green, and scarlet; Caribbean-Latina style embraces tropical brights; Andean weavings use earth tones with vivid accents; bold, confident colour use is a hallmark of Latina fashion and beauty identity',
    makeup: 'The "Latina beat" makeup aesthetic (full, glam, contoured, with bold lip) celebrates confident colour use; classic red lip is a staple of Latin beauty; smoky brown or warm bronze eye with a coral-red lip is a beloved combination; vivid colour is embraced'
  },
  'east-asian': {
    colourPhilosophy: 'East Asian beauty colour philosophy emphasises restraint, precision, and skin perfection as the foundation; makeup colour is often subtle and refined rather than vivid and dramatic (outside of specific subcultural aesthetics like J-fashion and visual kei); the K-beauty influence globally has spread a preference for subtle, natural-seeming colour enhancement ("your face but better")',
    makeup: 'East Asian makeup colour trends (from K-beauty and J-beauty) include: gradient lip (ombre red-orange-nude fading from the centre outward); monochromatic peachy-rose cheek and lip coordination; subtle shimmer on the eyes; glass skin (dewy, transparent-looking skin base) with very light colour on top; dramatic cosplay makeup in specific subcultures'
  },
  'east-african': {
    colourPhilosophy: 'East African colour aesthetics reflect the region\'s remarkable diversity; Somali fashion traditionally features white (for men\'s formal dress), jewel-toned dirac (traditional women\'s dress), and gold jewellery; Ethiopian traditional dress features white shema fabric with colourful silk borders; Swahili coast kanga fabric is internationally known for vibrant two-tone printed designs with text proverbs',
    makeup: 'Kohl eyeliner is a traditional East African and Arab-influenced beauty element across Muslim East African communities; the same deep, kohled eye tradition that runs through the Horn of Africa connects to Arab beauty traditions through centuries of trade and cultural exchange; vivid lips with a kohled eye is a classic East African beauty combination'
  },
  'south-african': {
    colourPhilosophy: 'South African colour sensibility encompasses the extraordinary diversity of the country\'s population and its cultures; Ndebele geometric painted houses and beadwork use a vibrant and mathematically precise colour language; Zulu beadwork uses a colour-coded system that conveys social messages; contemporary South African fashion (emerging on international fashion weeks) often draws on these indigenous colour traditions with a modern lens',
    makeup: 'South African contemporary makeup, particularly in Johannesburg and Cape Town, follows international trends with the lens of skin tone diversity; "Africa is not a country" awareness means South African makeup artists are highly skilled across the full Fitzpatrick scale; orange-toned correctors for deep under-eye circles; foundation matching for Fitzpatrick V-VI is a core competency of South African professional makeup'
  },
  'black-american': {
    colourPhilosophy: 'Vivid colour, bold contrast, and confident colour choices are central to Black American beauty expression; from the Harlem Renaissance\'s bold fashion statements to the Black Arts Movement\'s embrace of African textile colours to contemporary bold lip and eye trends, Black American beauty has always pushed colour forward',
    makeup: 'The "BEAT" look (Beautiful, Excellent, Artistry, Talent — a Black American beauty community term for a perfectly done full glam face) is a significant Black American makeup aesthetic; vivid colour is embraced; burgundy and deep berry lips are icons of Black American beauty; the ombre lip, the perfectly baked concealer, and the fiercely contoured face have roots in Black American beauty communities'
  }
};

export function getColourTheoryFundamentals(section) {
  const map = {
    colourWheel: COLOUR_THEORY_FUNDAMENTALS.colourWheel,
    properties: COLOUR_THEORY_FUNDAMENTALS.colourProperties,
    harmonies: COLOUR_THEORY_FUNDAMENTALS.colourHarmonies,
    undertones: COLOUR_THEORY_FUNDAMENTALS.undertones
  };
  return map[section] || COLOUR_THEORY_FUNDAMENTALS;
}

export function getColourCorrecting(correctorColour) {
  const map = {
    orange: COLOUR_CORRECTING.correctors.orange,
    peach: COLOUR_CORRECTING.correctors.peach,
    green: COLOUR_CORRECTING.correctors.green,
    lavender: COLOUR_CORRECTING.correctors.lavender,
    yellow: COLOUR_CORRECTING.correctors.yellow,
    pink: COLOUR_CORRECTING.correctors.pink
  };
  return map[correctorColour] || COLOUR_CORRECTING;
}

export function getFoundationShadeMatching(aspect) {
  const map = {
    testing: FOUNDATION_SHADE_MATCHING.testing,
    deepSkin: FOUNDATION_SHADE_MATCHING.deepSkinfoundation,
    asian: FOUNDATION_SHADE_MATCHING.asianFoundation
  };
  return map[aspect] || FOUNDATION_SHADE_MATCHING;
}

export function getEthnicColourGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_COLOUR_GUIDES['west-african'],
    'south-asian': ETHNIC_COLOUR_GUIDES['south-asian'],
    caribbean: ETHNIC_COLOUR_GUIDES.caribbean,
    arab: ETHNIC_COLOUR_GUIDES.arab,
    latina: ETHNIC_COLOUR_GUIDES.latina,
    'east-asian': ETHNIC_COLOUR_GUIDES['east-asian'],
    'east-african': ETHNIC_COLOUR_GUIDES['east-african'],
    'south-african': ETHNIC_COLOUR_GUIDES['south-african'],
    'black-american': ETHNIC_COLOUR_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

