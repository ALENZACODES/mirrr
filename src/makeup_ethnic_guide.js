/**
 * MIRRR — Makeup & Color Cosmetics Ethnic Guide
 * Foundation matching for all skin tones, cultural makeup traditions, color theory for diverse skin
 * Topics: undertones, Fitzpatrick matching, cultural beauty looks, eye/lip techniques by community
 */

// ============================================================
// FOUNDATION & SKIN TONE SCIENCE
// ============================================================

export const FOUNDATION_SCIENCE = {
  overview: `Foundation formulation and shade matching is one of the most culturally fraught areas
  of mainstream beauty. For decades, shade ranges ended at "medium tan" — leaving billions of
  women of color without suitable foundation. The Fenty Beauty 40-shade launch in 2017 was a
  cultural moment that forced industry-wide change. Understanding undertones and depth properly
  allows anyone to find their perfect match.`,

  skintoneComponents: {
    depth: {
      description: 'How light or dark the skin is; measured on the Fitzpatrick Scale (I-VI) or proprietary shade numbering systems',
      fitzpatrick: {
        I: 'Very fair; burns always, never tans.',
        II: 'Fair; burns easily, tans minimally; light European',
        III: 'Light-medium; burns moderately, tans gradually; Mediterranean, some East Asian, some Latin',
        V: 'Dark brown; rarely burns, tans deeply; Middle Eastern, some East African, some South Asian',
        VI: 'Deepest brown to dark; never burns; Sub-Saharan African, Melanesian, indigenous Australian heritage'
      }
    },

    undertone: {
      description: 'Underlying hue in skin that influences which colors look harmonious against it; undertone is independent of depth',
      warm: {
        description: 'Yellow, golden, peachy, or orange undertones',
        common: 'East Asian, South Asian, Latin/Hispanic, many Black Americans, Mediterranean',
        test: 'Gold jewelry looks better; veins look green; look better in orange/yellow/warm-toned clothing'
      },
      cool: {
        description: 'Pink, red, or bluish undertones',
        common: 'Northern European, some East Asian, some Black Americans (especially with cool-depth melanin)',
        test: 'Silver jewelry looks better; veins look blue/purple; look better in jewel tones and cool colors'
      },
      neutral: {
        description: 'Mix of warm and cool; most versatile for foundation matching',
        common: 'Very common across all ethnicities; many foundations marketed as "neutral" skew warm or cool',
        test: 'Both gold and silver look good; veins look blue-green'
      },
      olive: {
        description: 'Green or gray cast; specific undertone category not covered by warm/cool/neutral',
        common: 'Mediterranean, Middle Eastern, Southern European, some South Asian, some Latin',
        challenge: 'Many foundations look too pink or too yellow on olive skin; need true olive-undertoned formula'
      }
    },

    melanin: {
      eumelanin: 'Brown/black melanin — primary pigment; amounts determine skin depth',
      pheomelanin: 'Red/yellow melanin — contributes to warm/peachy undertones; more prevalent in lighter skin',
      distribution: 'Melanin distributed differently in deep skin tones — affects how foundation interacts with skin'
    }
  },

  formulaTypes: {
    liquidFoundation: {
      coverage: 'Light to full coverage; most versatile',
      finishes: ['Matte (controls shine; can look flat on dry skin)', 'Satin (moderate shine; most wearable)', 'Luminous/dewy (glowy; can look oily if skin already oily)'],
      deepSkin: 'Deep skin tones: avoid light-scattering formulas that give ashy appearance; choose luminous or satin finish'
    },
    powderFoundation: {
      coverage: 'Light to medium; buildable',
      deepSkin: 'Can emphasize texture and pores; be cautious with powder-heavy looks on deep skin',
      benefit: 'Great oil control for oily South Asian, West African skin types'
    },
    tinted: 'Tinted moisturizers and BB/CC creams: light coverage; good for daily wear; shade ranges often limited'
  },

  commonMistakes: {
    tooPink: 'Choosing foundation too pink for olive or warm-toned skin — makes skin look ashy or unnatural',
    oxidize: 'Foundation oxidizes (turns orange on skin after hour of wear) — happens more with certain formulas on certain skin chemistries; try before committing',
    neck: 'Matching to face not neck: face is often lighter than neck/chest; blend down or match neck to chest',
    shade: 'Buying darkest shade in line: if brand\'s darkest doesn\'t match, that brand\'s range is inadequate'
  }
};

// ============================================================
// COLOR THEORY FOR DIVERSE SKIN
// ============================================================

export const COLOR_THEORY_DIVERSE_SKIN = {
  overview: 'Color makeup (eyeshadow, blush, lip) interacts differently with various melanin levels and undertones',

  blush: {
    fairSkin: 'Soft pinks, light corals, peachy neutrals; heavy pigment can overwhelm fair skin',
    mediumSkin: 'Peachy corals, mauves, warm roses — most versatile range for medium skin',
    deepSkin: 'Bright corals, vivid fuchsias, deep mauves, rich berries — need highly pigmented formula; dusty/sheer blush disappears',
    placement: 'All skin tones: smile and apply to apples of cheeks; blend up toward temples for lift',
    bronzer: 'Bronzer on deep skin: use sparingly; can create uneven appearance; highlighter often more flattering'
  },

  eyeshadow: {
    warmUndertones: 'Warm tones (copper, gold, bronze, orange-red) warm up and harmonize with warm-undertoned skin',
    coolUndertones: 'Cool tones (silver, plum, navy, gray) pop against cool-undertoned skin',
    depth: 'Deeper skin tones: high-contrast and vibrant colors read best; pastels and very light shades may not show',
    fairSkin: 'Fair skin: both cool and warm work; even very light shades register; avoid harsh black liner on very sensitive, light skin'
  },

  lipColor: {
    deepSkin: {
      nudes: 'Nude lips on deep skin: need specific deep nude (often mislabeled "nude" when actually light pink that reads pale on deep skin)',
      reds: 'Red lips on deep skin: all reds work; warm reds (tomato, brick, orange-red) particularly stunning; blue-reds pop',
      darks: 'Dark lips (plum, wine, black): stunning on deep skin; bold and beautiful',
      avoid: 'Very light pinks and nudes designed for light skin — can look ashy or corpse-like on deep skin'
    },
    mediumSkin: {
      versatile: 'Medium skin is most versatile for lip color; nearly all shades translate well',
      best: 'Terracottas, brick reds, mauves, berry tones particularly flattering'
    },
    fairSkin: {
      nudes: 'Pale pinks, champagnes, and true nudes all read on fair skin; many options',
      bold: 'Bold reds and dark lips are high-contrast and dramatic — beautiful choice',
      caution: 'Very deep, dark colors can look very harsh; balance with minimal eye or contour'
    }
  },

  highlighter: {
    deepSkin: 'Gold, bronze, copper highlighters: stunning on deep skin; adds warmth and dimension; avoid silver which can look ashy',
    mediumSkin: 'Gold and rose-gold flatter medium skin; champagne also works',
    fairSkin: 'Champagne, pearl, silver: complements cool-fair skin; warm gold also beautiful on warm-fair skin',
    formula: 'Formula matters: finely milled formula blends; chunky glitter can look unflattering on any skin tone'
  }
};

// ============================================================
// CULTURAL MAKEUP TRADITIONS
// ============================================================

export const CULTURAL_MAKEUP_TRADITIONS = {
  overview: 'Makeup traditions reflect culture, religion, occasion, and aesthetics that differ dramatically across ethnic communities',

  eyeLiners: {
    kohl: {
      tradition: 'Ancient Egypt, Arab world, South Asia, East Africa: kohl (kajal) applied to waterline; protection from evil eye and harsh sun believed',
      history: '6000+ years of use; kohl made from galena (lead sulfide) historically — modern kajal is safer alternatives',
      modernKajal: 'Modern kajal: carbon black, mineral pigments; safe for waterline use; intense black',
      SPF: 'Historical kohl: soot reduced harsh desert sun glare; ancient SPF and anti-glare technology'
    },
    geishaEyeliner: 'Japanese geisha: precise red and black eye techniques; art form requiring years of training',
    koreanEyeliner: 'Korean lower lash line emphasis: distinct from Western upper lash emphasis; creates doe-eyed look'
  },

  lips: {
    indianBindi: {
      tradition: 'Bindi on forehead: sixth chakra (Ajna); worn with or without makeup; cultural and religious significance',
      note: 'Non-South Asian wearing bindi without cultural connection: complex topic; generally respectful in clearly celebratory Indian cultural contexts'
    },
    henna: {
      tradition: 'Mehndi (henna) on hands and feet: South Asian, Arab, East African bridal and ceremonial tradition',
      modern: 'Flash mehndi for festivals; bridal mehndi sessions are community events',
      safety: 'Natural henna: brown-red; safe; black henna contains PPD and is chemically dangerous'
    },
    lipTattoo: 'East African lip tattooing (traditional); Maori women\'s tā moko chin marking'
  },

  baseAndComplexion: {
    whiteFace: {
      geisha: 'Japanese oshiroi (white face): rice powder base; complete coverage; specific technique',
      opera: 'Chinese opera: elaborate white, red, and black face paint; role-specific; theatrical tradition'
    },
    tilak: {
      tradition: 'Hindu tilak (bindi variation): applied by priest or self for religious significance; red kumkum, sandalwood paste, ash varieties',
      note: 'Not a beauty statement but religious/spiritual expression; worn with or without full makeup'
    }
  }
};

// ============================================================
// 9 COMMUNITY MAKEUP GUIDES
// ============================================================

export const ETHNIC_MAKEUP_GUIDES = {
  'west-african': {
    communityName: 'West African',

    foundationAdvice: {
      brands: 'Brands with true deep shade range: Fenty Beauty, MAC (Studio Fix range), NARS (Deepsea, Stromboli), Pat McGrath Labs, Juvia\'s Place, Uoma Beauty',
      finish: 'Satin to luminous finish most flattering; full matte can look flat; deep skin benefits from some radiance'
    },

    culturalLooks: {
      traditional: 'Dramatic eyes with kohl; bold lip (red or deep berry); minimal base (shea-glossed skin); classic West African beauty aesthetic',
      modern: 'Bold cut crease in copper and gold; fuchsia or red lip; glowing skin base; heavy lash; vibrant editorial look',
      minimal: 'Clear gloss + mascara + precise brow; skin-forward glowing look with minimal color'
    },

    colorPalette: {
      eyes: 'Gold, copper, bronze, burnt orange, deep burgundy, vivid greens and purples — all stunning on deep warm skin',
      lips: 'Warm reds, brick reds, fuchsias, deep plums, wine, caramel nudes (not pale pink nudes)',
      blush: 'Vivid coral, fuchsia, deep berry; needs pigment to show through deep skin; powder blush most buildable'
    },

    advice: `West African beauty looks their most radiant when skin is glowing, lips are bold, and eyes
    are defined. The secret is prepping skin to shine: shea butter or a few drops of oil pressed
    into skin before a luminous foundation creates the signature West African glow. Bold lip colors
    — warm reds, fuchsias, deep plums — read brilliantly against deep skin. Eyeshadow: reach for
    warm metallics and deep jewel tones that pop against melanin-rich skin. Brands founded by
    West African women that truly understand deep skin: Juvia\'s Place, Pat McGrath Labs (founder
    has Nigerian heritage), Uoma Beauty (founded by Sharon Chuter, Nigerian).`
  },

  'south-asian': {
    communityName: 'South Asian',

    foundationAdvice: {
      challenge: 'Olive undertone: avoid formulas that look too yellow OR too pink; look for "olive" labeled or neutral-warm',
      brands: 'Kosas, Armani Luminous Silk (excellent neutral-warm range), NARS, Charlotte Tilbury (Warm Peach, Golden), MAC NC shades (yellowish-warm-neutral)'
    },

    culturalLooks: {
      bridal: 'Traditional Indian bridal: heavy smoky eye in deep brown/burgundy; red lip; heavy kohl waterline; full coverage glowing base; maang tikka and jewelry as part of the look',
      festive: 'Diwali, Eid festive: gold and copper smoky eye; red or deep pink lip; dramatic lashes',
      daily: 'Kajal (kohl) on waterline as every day definition; GRWM brow + mascara + kajal for classic South Asian minimal'
    },

    colorPalette: {
      eyes: 'Warm earth tones (copper, gold, brown, burnt sienna) for classic; jewel tones (sapphire, emerald, deep purple) for festive',
      lips: 'Reds (range of warm reds), deep pinks, berry and wine for depth; coral-beige nudes for daily; avoid very pale pinks',
      blush: 'Peachy-warm corals, warm pinks; terracotta'
    },

    advice: `South Asian skin has golden-warm undertones that are spectacularly beautiful with warm-toned
    makeup. Kajal (kohl) on the waterline is the single most transformative and culturally authentic
    makeup step for South Asian women — it instantly defines eyes with cultural depth. For foundation:
    the NC/NW system in MAC is helpful; South Asian skin typically falls in NC range (warm-neutral).
    Festive looks should lean into the warmth: copper eyeshadow on warm South Asian skin is virtually
    unmatched in beauty. For bridal looks: traditional is dramatic by Western standards — embrace
    the intensity; it photographs and reads in person with the richness of traditional attire.`
  },

  caribbean: {
    communityName: 'Caribbean',

    foundationAdvice: {
      brands: 'Fenty Beauty covers widest Caribbean spectrum; also NARS, MAC'
    },

    culturalLooks: {
      carnival: 'Trinidad Carnival, Notting Hill Carnival: full glamour face; glitter body makeup; bold color; theatrical; celebratory makeup',
      reggaeton: 'Y2K-influenced Dominican beauty: glossy skin, defined brows, precise liner, lip liner',
      natural: 'Jamaican dancehall: bold editorial looks; bright shadow; graphic liner; gloss'
    },

    colorPalette: {
      eyes: 'Depends on depth; vibrant tropical colors (turquoise, coral, mango yellow) at Carnival; warm browns and golds for daily',
      lips: 'Full spectrum; warm reds and fuchsias for brown skin; lip liner matching or slightly darker is Caribbean aesthetic',
      blush: 'Warm corals and peaches; luminous finish'
    },

    advice: `Caribbean beauty is VIBRANT — Carnival culture makes it one of the most elaborate beauty
    traditions in the world, where glitter, color, and body art are the palette. But for everyday
    Caribbean beauty: the Dominican makeup tradition of precise brow, defined liner, lip liner,
    and gloss is elegant and wearable. Foundation in tropical humidity: use a setting spray and
    a primer; humidity and heat are the enemy of foundation longevity. Setting powder in deep
    Caribbean skin tones: use translucent finely milled powder; avoid overly white setting powders
    (flashback in photos = white cast).`
  },

  arab: {
    communityName: 'Arab / Middle Eastern',

    foundationAdvice: {
      oliveProblem: 'Olive skin common problem: too yellow foundations look muddy; too pink look ashy; need true olive-neutral',
      brands: 'Armani Luminous Silk (excellent olive range), Huda Beauty (founded by Iraqi-American), Charlotte Tilbury'
    },

    culturalLooks: {
      smokyArab: 'Classic Arab eyes: intensely kohled eyes (inside and outside); heavy nude or red lip; minimal blush; dramatic eye is centerpiece',
      modern: 'Contemporary Arab beauty (Dubai, Instagram): extreme cut crease; graphic liner; overlined lip; contoured nose and cheeks',
      bridal: 'Arab bridal: elaborate eye with crystal embellishments; heavy lash; bold lip or nude; family beauty traditions vary by country of origin'
    },

    colorPalette: {
      eyes: 'Brown, gold, copper, champagne, deep black — classic; vivid jewel tones for festive; kohl-black liner essential',
      lips: 'Nudes in brown-beige range; reds; deep berries; lip liner darker than lip for Arab beauty signature',
      blush: 'Minimal blush in Arab beauty tradition; or warm bronze highlight instead'
    }
  },

  latina: {
    communityName: 'Latina / Hispanic',

    foundationAdvice: {
      brands: 'L\'Oreal True Match (warm-neutral range excellent for Latina midtones); Fenty; MAC; Maybelline Fit Me (affordable, wide range)'
    },

    culturalLooks: {
      classic: 'Classic Latina glamour: full coverage base; winged liner; volumizing mascara; red lip; contoured cheeks',
      quinceañera: 'Quinceañera: age-appropriate dramatic; age 15 makes choices; typically more dramatic than daily',
      telenovela: 'Dramatic telenovela-inspired: bold contour; defined brow; smoky eye; bold lip; full lash',
      natural: 'Moderna casual: glossy skin; fluffy brow; mascara; tinted lip balm; y2k revival very Latina-coded'
    },

    colorPalette: {
      eyes: 'Warm browns, terracotta, copper for daily; vibrant for celebration (Día de los Muertos sugar skull inspiration)',
      lips: 'Red lip is the signature classic Latina beauty statement; also coral, terracotta, berry; pink for quince',
      blush: 'Warm peach to coral on medium Latina skin; vivid for Afro-Latina deep skin'
    },

    advice: `Latina beauty encompasses the full diversity of the Americas — from very fair Argentine-heritage
    to deeply melanated Afro-Cuban and Afro-Dominican. The unifying aesthetic thread is warmth: warm
    undertones, warm makeup tones, bold lips, dramatic eyes. The red lip is the signature beauty
    statement that crosses all Latina heritage groups. For finding your foundation: the L\'Oreal True
    Match system has warm (W) shades that work beautifully for many medium-warm Latina skin tones.
    Día de los Muertos makeup (skull-inspired): a brilliant art form with deep cultural meaning;
    when non-Latina women adopt it without context, that\'s appropriation; when Latinas wear it,
    it\'s claiming ancestry.`
  },

  'east-asian': {
    communityName: 'East Asian',

    foundationAdvice: {
      yellowWarm: 'Yellow-warm East Asian skin: MAC NC range, Armani (porcelain/medium beige)',
      pinkCool: 'Pink-cool East Asian skin: Nars Deauville, Shiseido lighter shades',
      brands: 'Shiseido (Japanese brand; excellent understanding of East Asian skin tones); Sulwhasoo, Laneige (Korean); Fenty N shades'
    },

    culturalLooks: {
      kBeauty: 'K-Beauty base: glass skin glow; natural brow (not overlined); lower lash emphasis; soft rosy cheek; gradient lip (dark center blending out)',
      jBeauty: 'J-Beauty: fresh, effortless; translucent skin; light mascara; cherry blossom pink cheek and lip',
      cBeauty: 'C-Beauty (Chinese): bold brow; fox eye liner; bold lip (often red); clean skin base',
      editorial: 'East Asian editorial: avant-garde, high-fashion; Korea especially leads in creative editorial beauty'
    },

    colorPalette: {
      eyes: 'Brown-bronze for daily (classic K-beauty); pinks and rose-taupes for soft look; bold color for editorial',
      lips: 'Gradient lip (Korean: deeper shade on outer edge blending to lighter center); red lips with white center highlight (J-beauty); true red (C-beauty)',
      blush: 'Soft petal pinks, coral, peach; placed high on cheekbones for J/K-beauty "sick blush" trend'
    }
  },

  'east-african': {
    communityName: 'East African',

    foundationAdvice: {
      brands: 'Fenty W series (deep shades); NARS (Stromboli, Macao); Pat McGrath Labs; Uoma Beauty',
      finish: 'Luminous foundation + glowing highlight shows beautifully on very deep skin'
    },

    culturalLooks: {
      traditional: 'Horn of Africa traditional: kohl-rimmed eyes; henna on hands; frankincense smoke fragrance (incense); clothing as beauty canvas',
      somali: 'Somali: dramatic kohl; light lip; minimal face makeup; eye as focal point',
      ethiopian: 'Ethiopian: cross necklace as beauty element; tilet (traditional Amhara facial marks in some regions); regal, clean beauty',
      modern: 'Modern East African beauty on social media: glass skin; bold graphic liner; bold lip'
    },

    colorPalette: {
      eyes: 'Rich golds, amber, rust, deep burgundy; kohl-black liner; bright whites as inner corner on deep skin — stunning contrast',
      lips: 'Bold warm reds, vivid fuchsia, plum; nude that matches true skin tone (brown-toned, not pale pink)',
      blush: 'Vivid coral, fuchsia, berry; must be very pigmented to read on deep skin'
    },

    advice: `East African skin — particularly from the Horn of Africa — has stunning depth and natural
    luminosity that needs very little product to look radiant. Kohl (kajal) on the waterline is
    the traditional and most transformative tool: in Ethiopian, Somali, and Eritrean tradition,
    kohl is the anchor of the look. For foundation: look for ranges with
    real depth at the deep end (Fenty Beauty, Juvia's Place, Black Opal and others). Graphic white liner as inner corner
    highlight on very deep skin creates a contrast that is breathtaking. Avoid purple-based deep
    foundations which can look cool-ashy on horn of Africa skin that may have neutral undertones.`
  },

  'south-african': {
    communityName: 'South African',

    foundationAdvice: {
      brands: 'All major international brands available; local South African brand House of Malia specifically developed for deep South African skin tones',
      local: 'Revlon, Maybelline widely available in South Africa; Fenty available from selected retailers'
    },

    culturalLooks: {
      zulu: 'Traditional Zulu bridal: umemulo ceremony look; ochre and plant dye body paint; elaborate beadwork; natural beauty emphasis',
      modern: 'Modern South African: Cape Town fashion-forward; Joburg bold and editorial; beauty influenced by all South African communities',
      afrikaner: 'Afrikaner tradition: natural makeup; fair skin; suntanned from outdoor lifestyle'
    },

    colorPalette: {
      eyes: 'Deep skin South African: rich golds, coppers; bright jewel tones; kohl liner',
      lips: 'Warm reds, berry, plum; for fair South African: all lipstick shades work',
      blush: 'Bronze and warm coral for deep skin; light pink and peach for fair'
    },

    advice: `South Africa's beauty reflects its extraordinary diversity — the rainbow nation is literally
    present in its skin tones, hair textures, and beauty traditions. For Black South African women:
    the traditional ochre and plant-dye body beauty of Zulu and Xhosa tradition is one of the world's
    most powerful aesthetic systems — it predates modern cosmetics by millennia. For modern everyday
    makeup: Rooibos extract toner followed by marula oil as skin prep creates the most beautiful
    radiant base. For deep skin South African tones: follow the same advice as deep West/East African
    — warm undertone formulas, luminous finish, vivid lip and eye pigment. Maybelline and L\'Oreal
    have good South African distribution with adequate shade ranges.`
  },

  'black-american': {
    communityName: 'Black American',

    foundationAdvice: {
      brands: 'Fenty Beauty (Rihanna is Black American; brand specifically addresses this community); MAC NC range; Morphe; NARS; Uoma Beauty; Juvia\'s Place',
      history: 'For decades, Black women in America were told to buy two foundations and mix because no shade matched — Fenty Beauty 2017 changed that'
    },

    culturalLooks: {
      classic: 'Classic Black American glam: precise cut crease; dramatic lash; bold lip (red or berry); contoured and highlighted; beautiful and intentional',
      natural: 'Melanin-popping minimal: bare skin glow; fluffy brow; mascara; gloss — shows off natural melanin beauty',
      instagram: 'Instagram-era Black beauty: extremely defined contour; baked setting powder; ombre lip; 3D shadow',
      naturalHair: 'Natural hair + minimal makeup: afro or coils + lip gloss + mascara is complete — hair IS the look'
    },

    colorPalette: {
      eyes: 'Warm bronzes and coppers — stunning on deep warm skin; vivid jewel tones for pop; all-black cut crease is iconic',
      lips: 'Red lip is the signature Black American classic beauty statement; fuchsia; berry; nude in brown-caramel range; lip liner is essential',
      blush: 'Must be highly pigmented: vivid fuchsia, coral, deep berry for deep skin; pop powder blush or cream'
    },

    advice: `Black American beauty has shaped global beauty culture more than any other ethnic community —
    from the red lip as power statement to dramatic eye, to the natural hair movement — Black
    women have driven trend and invention. The most important makeup truth: Fenty Beauty's 40-shade
    expansion in 2017 was a direct response to decades of Black women being underserved by beauty
    brands. Now, more options exist. For very deep skin: avoid foundations with heavy titanium dioxide
    (flashback in flash photography = white ghost effect — the "baked" look); test SPF-heavy foundations
    on jawline first. Lip liner is not optional in Black American beauty — it defines, prevents
    feathering, and adds dimension. Match lip liner to your natural lip color or shade slightly deeper.`
  }
};

// ============================================================
// HELPER FUNCTION
// ============================================================

export function getMakeupGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_MAKEUP_GUIDES['west-african'],
    'south-asian': ETHNIC_MAKEUP_GUIDES['south-asian'],
    'caribbean': ETHNIC_MAKEUP_GUIDES['caribbean'],
    'arab': ETHNIC_MAKEUP_GUIDES['arab'],
    'latina': ETHNIC_MAKEUP_GUIDES['latina'],
    'east-asian': ETHNIC_MAKEUP_GUIDES['east-asian'],
    'east-african': ETHNIC_MAKEUP_GUIDES['east-african'],
    'south-african': ETHNIC_MAKEUP_GUIDES['south-african'],
    'black-american': ETHNIC_MAKEUP_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

// ============================================================
// STATS
// ============================================================

