/**
 * MIRRR — Celebrity Looks & Iconic Style Recreation Guide
 * How to achieve iconic beauty looks from each ethnic community's
 * most celebrated style icons. Products, techniques, and cultural context.
 */

export const CELEBRITY_LOOKS_OVERVIEW = {
  title: 'Iconic Beauty Looks: Recreation Guides',
  introduction: `This module provides inspiration from celebrated style icons in each of MIRRR's nine ethnic communities. These are not "look-alikes" — they are technique and product guides for achieving the aesthetic qualities that define each look. Whether it's the luminous "glass skin" effect associated with K-beauty icons, the bold sculpted aesthetic of West African runway makeup, or the natural radiance of South Asian Bollywood styling, each look represents a distinct beauty tradition.`,
  approach: 'We celebrate diverse beauty ideals across cultures without promoting one standard over another. Each community\'s icons represent authentic expressions of their cultural beauty heritage.',
  disclaimer: 'Product mentions are for ingredient/technique reference only. MIRRR connects to Qloo API for personalised, real-time product recommendations. Prices and availability vary.'
};

export const WEST_AFRICAN_ICONIC_LOOKS = {
  title: 'West African Iconic Beauty Looks',
  icons: [
    {
      name: 'Alek Wek — Sudanese-British supermodel',
      era: '1990s–present',
      aestheticSignature: 'Striking close-cropped natural hair or head jewellery; bold graphic eye; no-foundation or minimal makeup letting Fitzpatrick VI deep ebony skin be the canvas; sculptural bone structure celebrated',
      recreationGuide: {
        skin: {
          steps: ['Start with a thorough double cleanse — no texture or dry skin allowed on deep skin; any unevenness is magnified', 'Apply a rich oil — jojoba or marula — to slightly damp skin to maximise glow', 'If base is used: colour-matched sheer tinted moisturiser or skin tint for a skin-like finish, not coverage', 'Body luminiser on collarbone, shoulders if bare'],
          products_guide: ['Fenty Beauty Pro Filt\'r Hydrating Longwear Foundation (shade 450-490 range)', 'Pat McGrath Labs Skin Fetish Balm (creates the oil-varnished skin effect)', 'Rare Beauty Liquid Touch Weightless Foundation (sheer, buildable)']
        },
        eyes: {
          steps: ['Single graphic liner in deep black or royal blue on the lower waterline and lower lash line (not upper — opens eye)', 'White kohl or nude liner on lower waterline to make eyes appear larger', 'Mascara on upper lashes only — volumising not lengthening', 'Strong defined brows — follow natural brow shape, fill with matching pomade'],
          product_types: ['Gel liner pencil', 'Volumising black mascara', 'Brow pomade in deepest brown-black shade']
        },
        lips: ['Minimal — clear gloss or skin-matching lip balm to let the skin be the focus'],
        complexion_note: 'Deep Fitzpatrick V-VI skin has a natural luminosity and richness that this look is built to celebrate. Avoid heavy coverage or setting powder. Oil is the friend.'
      }
    },
    {
      name: 'Osas Ighodaro — Nigerian-American actress',
      era: '2010s–present',
      aestheticSignature: 'Full Afrobeat glamour: bold warm amber eye, sculpted cheekbones with warm bronzer, glossy terracotta or deep berry lip, luminous brown skin, elegant natural updo or braided style',
      recreationGuide: {
        skin: {
          prep: 'Moisturise well; allow 10 minutes before base application',
          base: 'Full-coverage foundation matched to neck colour (critical — test in natural light on jawline); set only T-zone with translucent powder; keep cheeks dewy',
          contour: 'Deep warm brown contour powder (3-4 shades deeper than foundation) under cheekbones, temples, jawline; blend well — no harsh lines on dark skin',
          highlight: 'Deep gold or bronze highlighter on cheekbone top, brow bone, cupid\'s bow; avoid silver/white highlighters on deep skin — they look chalky',
          products_types: ['Fenty Beauty Pro Filt\'r Soft Matte Foundation', 'Juvia\'s Place or Mented Cosmetics contour palettes for deep skin', 'Gold-toned highlighter: Black Opal, Sacha Cosmetics']
        },
        eyes: {
          look: 'Cut crease with warm amber/terracotta/copper tones; bold winged liner; dramatic false lashes',
          steps: ['Set and prime lid with concealer', 'Apply transition shade (warm brown) in crease with fluffy brush, blending upward', 'Apply deep copper or amber shimmer on lid', 'Blend dark brown in outer V', 'Cut crease with concealer for sharp definition', 'Wing liner extending 1-2cm beyond outer eye', 'Apply strip lashes (dramatic wispies or full glam)']
        },
        lips: ['Line lips slightly overdrawing cupid\'s bow with slightly deeper liner than lip shade', 'Fill with terracotta, warm brick, or deep berry lipstick', 'Optional: gloss on centre of lip for dimension']
      }
    },
    {
      name: 'Genevieve Nnaji — Nollywood icon',
      era: '2000s–present',
      aestheticSignature: 'Nollywood elegance: flawless skin as priority, refined classic makeup, natural hair or elegant weave, regal bearing. Warm brown or rose makeup, no over-the-top drama — sophisticated glamour.',
      recreationGuide: {
        skin: 'Full flawless base with skin-matching foundation; warm peach blush rather than pink (pink reads ashy on brown skin); baked or press powder technique for setting',
        eyes: 'Subtle warm brown smoky with individual false lashes (not full strip — natural glamour), defined liner, arched brows',
        lips: 'Nudes with warm rose or terracotta undertone; deep plum for evening; avoid cool pink or orange-red which clash with warm brown complexion',
        noteOnShade: 'For Fitzpatrick IV-V warm-toned skin: always choose makeup with warm or neutral undertones (yellow, peach, terracotta, warm brown). Cool undertone products (pink blush, cool nude lips) will appear purple/ashy.'
      }
    }
  ],
  westAfricanMakeupTips: {
    foundationFitting: 'Pull the shade slightly warm (yellow-orange) rather than cool (pink); many mainstream brands run too pink for West African complexions',
    blush: 'Warm peach, copper, warm coral or brick red blush for Fitzpatrick V-VI; apply on the apples of cheeks blending toward temples; use a large powder brush for buildable colour',
    contour: 'Skip grey-toned contour — it creates an ashy grey shadow on deep skin. Use deep warm brown matte powder (like cocoa or nutmeg shades)',
    gele_beauty: 'Headwrapping (gele in Yoruba) is an art form and part of owambe beauty — the face must be done before gele is tied; dramatic eyes and sculptural makeup complement the elevated headwrap height'
  }
};

export const SOUTH_ASIAN_ICONIC_LOOKS = {
  title: 'South Asian Iconic Beauty Looks',
  icons: [
    {
      name: 'Priyanka Chopra Jonas — Bollywood and Hollywood actress',
      era: '2000s–present',
      aestheticSignature: 'Flawless luminous warm olive-brown skin; defined smoky almond eye; strong arched defined brows; bronzed goddess glow; bold wine or nude lip; long sleek or volumised hair',
      recreationGuide: {
        skin: {
          base: 'Build luminous skin base: priming with a vitamin C serum, then lightweight hydrating primer; medium-coverage foundation with warm undertone (yellow-beige, never pink); concealer only where needed',
          bronzing: 'The key to Bollywood glow: warm bronze powder swept across forehead, cheeks, nose bridge, and chin in a sun-kiss pattern; use a large fluffy brush; blend thoroughly',
          highlight: 'Pearl or warm champagne highlighter on cheekbones, nose tip, cupid\'s bow, inner corners; creates the camera-catching warmth',
          blush: 'Peach or warm rose blush on apples of cheeks; blend up toward temple'
        },
        eyes: {
          almond_eye: 'South Asian eyes are often almond or hooded; this technique maximises the almond shape',
          steps: ['Prime the lid (especially important for oily lids common in warmer climates)', 'Apply neutral matte brown in crease', 'Layer deeper brown and black in crease and outer V', 'Apply shimmery taupe or champagne on lid', 'Tight-line upper waterline with black gel liner — close the gap between lashes and liner', 'Wing the liner with a thin precise wing extending just past the outer corner', 'Smudge dark shadow under lower lash line', 'Black kajal on lower waterline (traditional; also very effective)', 'Upper and lower mascara; individual lashes optional'],
          kohl_tradition: 'Black kajal in the waterline is both traditional and effective — the original kohl aesthetic that Bollywood beauty builds from'
        },
        lips: ['Bold wine lip for classic Bollywood: line lips fully with matching wine liner, fill with deep wine matte; a tiny dab of highlight on cupid\'s bow', 'Nude Bollywood look: warm peachy nude slightly darker than lip colour (not too pale or it washes out Fitzpatrick III-IV skin)'],
        hair: 'Classic Bollywood styles: high bun with face-framing wisps; long silk blowout with volume at roots; half-up half-down with hair accessories (maang tikka, matha patti for occasions)'
      }
    },
    {
      name: 'Mehwish Hayat — Pakistani actress',
      era: '2010s–present',
      aestheticSignature: 'Pakistani bridal-adjacent elegance: heavy eye drama with Arabic-influenced kohl and liner flicks, bold jewelled lip colour, intricate brows, against warm honey complexion',
      recreationGuide: {
        eyes: 'Extended dramatic liner: tight-line waterline, wing that extends and curves up more than a classic wing, bottom lash line heavily smudged with kohl',
        lips: 'Rich jewel tones: ruby red, deep plum, magenta; perfectly outlined — lips lined then filled without blurring the edges',
        skin: 'Ultra-smooth matte base; no visible pores; stamped pressed powder finish for photographs',
        occasion: 'This aesthetic is particularly relevant for eid, mehendi, nikkah, and baraat occasion beauty'
      }
    },
    {
      name: 'Deepika Padukone — Bollywood actress',
      era: '2000s–present',
      aestheticSignature: 'Understated natural radiance with impeccably groomed features; strong defined features highlighted not hidden; dewy clean skin; minimal-maximum aesthetic — fewer products but each does max work',
      recreationGuide: {
        skin: 'Dewy skin: hyaluronic acid serum, moisturiser, and a skin tint or sheer foundation; set only where needed; mist with face oil spray for camera glow',
        brows: 'Very structured, full, straight-ish South Indian brow shape (distinct from the arched Bollywood brow); brush up and fill any sparse areas only',
        eyes: 'One-product eyes: a single deep brown shadow smudged along lash line upper and lower, blended with fingers; black mascara; no liner needed with this approach',
        lips: 'The distinctive Deepika element: slightly oversized lower lip; select warm rose or nude slightly deeper than natural lip; blend without hard liner edge'
      }
    }
  ],
  southAsianMakeupTips: {
    longevity: 'South Asian events can last 8-16 hours; primer, setting spray, and midday blot with rice paper are essential. Avoid powder on cheeks for first application — it photographs grey.',
    undereye: 'Fitzpatrick III-IV undereye circles typically have a blue-purple cast; use a peach or salmon colour corrector before concealer (never pink corrector on medium-warm skin — makes circles look bruised)',
    skinTone: 'South Asian skin can appear dull or yellowish in unflattering light; the Bollywood technique of brightening with a peachy-yellow primer under foundation counteracts this while maintaining warm undertones',
    henna_beauty: 'Bridal mehndi on hands and feet is meant to be the darkest possible colour; after removal, seal with sugar-lemon mixture and avoid water for 24 hours; the revealed deep mahogany colour is the beauty goal'
  }
};

export const CARIBBEAN_ICONIC_LOOKS = {
  title: 'Caribbean Iconic Beauty Looks',
  icons: [
    {
      name: 'Rihanna (Robyn Fenty) — Barbadian singer',
      era: '2005–present',
      aestheticSignature: 'Boundary-pushing beauty experimentation; the creator of Fenty Beauty — explicitly built for all skin tones. Her own looks range from dramatic graphic editorial to barely-there glass skin. The "Fenty skin" concept: your best skin amplified.',
      recreationGuide: {
        fentySkin: {
          description: 'The "Fenty Skin" look — Rihanna\'s casual beauty aesthetic built around her own brand',
          steps: ['Fenty Skin Hydra Vizor SPF 30 moisturiser-sunscreen for the base', 'Fenty Beauty Pro Filt\'r Soft Matte Foundation in your perfect match shade (wide shade range was Fenty\'s groundbreaking contribution)', 'Fenty Beauty Gloss Bomb Cream on lips in "Fenty Glow" (universally flattering warm peachy-nude)', 'Fenty Beauty Killawatt Highlighter in Trophy Wife (gold-meets-bronze) on cheekbones', 'Clear or mascara brows'],
          essence: 'This look is about the skin looking perfect, not about dramatic colour. The beauty is in the finish — velvet-matte skin, luminous cheeks.'
        },
        dramaticFenty: {
          description: 'Rihanna\'s editorial looks often feature graphic liner, bold lips, and experimental elements',
          examples: ['Graphic orange or red liner wing', 'Negative space liner geometric', 'Monochromatic deep burgundy eye-cheek-lip', 'Bold outlined graphic lip in unconventional colours']
        }
      }
    },
    {
      name: 'Nicki Minaj — Trinidadian-American rapper',
      era: '2007–present',
      aestheticSignature: 'High-fantasy, maximalist beauty: bold colour, theatrical lashes, defined contour, dramatic liner, exaggerated everything — playful and powerful simultaneously.',
      recreationGuide: {
        boldLip: 'The Nicki signature: bright opaque lip in pink, hot pink, or magenta (Barbie pink) — fully matte, precisely lined, no feathering; lip liner slightly darker, full lip with liner, then fill with bright matte',
        contour: 'Heavy sculpted contour — deep bronze/brown under cheekbones, nose (slimming bridge contour), temples; heavy blending is key on deep skin',
        lashes: 'Dramatic full-length false lashes — 25mm or longer; spidery individual clusters for texture; stack with mascara on natural lashes first',
        liner: 'Cat eye — sharp wing at outer corner pointing up at 45° angle; the longer the better; high-precision liquid liner'
      }
    },
    {
      name: 'Grace Jones — Jamaican model and singer',
      era: '1970s–present',
      aestheticSignature: 'Avant-garde geometric makeup; closely cropped natural hair as sculptural element; androgynous; bold graphic eye; dark lip; high architecture of the face celebrated',
      recreationGuide: {
        geometric: 'This look requires painting rather than blending: foundation, then sharp geometric lines in contrasting colours (gold, white, black) drawn on the face with precision',
        boneStructure: 'Foundation and contour applied to maximise the architecture of the face as sculpture; this is makeup as three-dimensional art',
        inspiration: 'Study Grace Jones\' album covers and Keith Haring collaborations — the face as canvas concept'
      }
    }
  ],
  caribbeanMakeupTips: {
    carnavalMakeup: 'Carnival beauty needs to last 8+ hours in heat and humidity; lock-down is everything: silicone primer, long-wear formula everything, setting spray, zero touchups planned. Sweat resistance is the brief.',
    vibrant_palette: 'Caribbean makeup traditions embrace tropical colour: turquoise liner, coral blush, mango lip, lime eyeshadow; vivid colour on darker skin tones is stunning rather than garish',
    sunkissed_look: 'Barbadian bronzed beauty: golden bronzer on darker skin (warm not orange); sheer glow on all high points; minimal makeup letting natural warmth of brown skin show'
  }
};

export const ARAB_ICONIC_LOOKS = {
  title: 'Arab Iconic Beauty Looks',
  icons: [
    {
      name: 'Haifa Wehbe — Lebanese singer and actress',
      era: '2000s–present',
      aestheticSignature: 'Levantine glamour: flawlessly airbrushed olive skin; dramatic defined cat-eye; voluminous highlighted auburn or dark hair; deep plum or nude glossy lip; bold lashes',
      recreationGuide: {
        arabEye: {
          description: 'The classic Arab eye: heavy and dramatic, fully defined around the entire eye, with a dramatic upward wing',
          steps: ['Apply nude eyeshadow primer over lid and under-eye', 'Line the entire upper lid tight to lashes with black gel liner — thick and close', 'Wing the liner in an elongated upswing (extending 2cm beyond outer corner, angling up toward brow tail)', 'Apply black kohl in both upper and lower waterlines (this is traditional — the inside of the eye)', 'Smudge black shadow along entire lower lash line', 'Apply dark matte brown in crease, blending harshly for drama not subtlety', 'Apply false lashes — full glam strip; Arab lash aesthetic is abundant', 'Mascara on lower lashes only (to define without clumping with upper strip)']
        },
        skin: 'Full coverage, airbrushed matte finish — the Arab beauty aesthetic values a poreless, flawless base; baking technique common. The drama is in the eyes, not the skin texture.',
        lip: 'Either: deep plum matte (for full drama); or nude glossy neutral (all-attention-on-eyes mode). Both avoid pink shades that clash with olive skin.',
        contouring: 'Moderate sculpting with warm brown; nose contour common (thinning the bridge); strong cheekbone definition'
      }
    },
    {
      name: 'Yasmine Sabri — Egyptian actress',
      era: '2010s–present',
      aestheticSignature: 'Modern Egyptian glamour: the ancient kohl tradition modernised; honey-warm olive skin glowing; defined cat-flick liner; arched perfect brows; wine-berry lip; hair long, lustrous and straight',
      recreationGuide: {
        kohl_modernised: 'The Egyptian eye: waterline kohl is the foundation; build liner from there; the look should appear to come from inside the eye rather than painted on top',
        warmth: 'Egyptian beauty aesthetic is warm — choose bronze-toned highlighter, warm blush, and warm lip shades to complement olive skin with yellow-warm undertones',
        brows: 'High arch is specifically Egyptian ideal — a bit more arch than the relatively flat Levantine style; strong defined brows slightly overdrawn at arch peak'
      }
    }
  ],
  arabMakeupTips: {
    kohl_tradition: 'Traditional black kohl in the waterline is the foundation of Arab eye makeup — all other techniques build on this base. Modern kohl pencils make this safe and clean.',
    photographyDress: 'Arabic makeover shoots often use extensive airbrushing in editing; achieve an approximation in person with: heavy primer, setting powder under foundation (for staying power), translucent baking powder set with a damp beauty sponge',
    hamam_prep: 'The best canvas for Arab beauty is prepared with hammam treatment beforehand — the deep exfoliation and steam creates a luminous, smooth skin texture that holds makeup differently',
    bridal: 'Arab bridal makeup is among the most elaborate in the world — heavy foundation, full contouring, full glam eyes, rhinestones, dramatic lashes; many brides have a separate morning henna look (lighter) and evening wedding look (full drama)'
  }
};

export const LATINA_ICONIC_LOOKS = {
  title: 'Latina Iconic Beauty Looks',
  icons: [
    {
      name: 'Jennifer Lopez — Puerto Rican-American entertainer',
      era: '1990s–present',
      aestheticSignature: 'The "J.Lo glow" — bronzed luminous skin with warmth; barely-there natural makeup creating an impression of perfection; her influence launched the bronzer category',
      recreationGuide: {
        jLoGlow: {
          skin: ['Prep with retinol (long-term) and vitamin C serum morning; these create the real glow', 'Light-medium coverage foundation with yellow-warm undertone (Fitzpatrick IV skin)', 'No matte finish — everything should have a natural sheen', 'Bronze powder swept across forehead, nose, cheeks, chin in a wide 3 sweep', 'Luminous gold or champagne highlighter on cheekbones, nose tip, Cupid\'s bow, inner corners', 'Warm peach blush on apples and temples', 'Set with a dewy setting spray, not powder'],
          eyes: 'Minimal — wash of warm champagne shadow, tight-lined upper waterline, mascara, defined brows in warm brown; the face glow is the eye look',
          lips: ['J.Lo signature: barely-there nude with warm pink-nude lip; slightly overdraw for fullness', 'Alternatively: warm caramel gloss', 'The lip should look natural and full, not painted'],
          body: 'J.Lo\'s full look includes: body bronzer on all exposed skin, shimmer on décolletage and shoulders; the face and body are one cohesive bronzed look'
        }
      }
    },
    {
      name: 'Salma Hayek — Mexican actress',
      era: '1990s–present',
      aestheticSignature: 'Mexican elegance: full dark brows (before the brow trend), luminous olive-warm skin, smoldering dark eyes, bold red or nude lip; natural feminine beauty',
      recreationGuide: {
        eyes: 'Dark, slightly smoky with dark brown or deep grey shadow; not technically perfect but smoldering and sensual; defined individual lashes not full-strip',
        brows: 'Full natural brows with slight arch — minimal manipulation; brush up and set with clear gel; fill only very sparse areas with hair-like strokes',
        lip: 'Classic Mexican beauty: warm brick or terracotta red for day; deep red for night; avoid blue-reds which clash with warm skin; choose orange-warm reds'
      }
    },
    {
      name: 'Zoe Saldana — Dominican-Puerto Rican actress',
      era: '2000s–present',
      aestheticSignature: 'Refined minimalist — the beauty of restraint on deep brown skin; the focus is flawless skin and a single statement element, never overdone',
      recreationGuide: {
        approach: 'Pick ONE statement: either dramatic eye OR bold lip — never both. Let the other features be beautifully quiet.',
        skin: 'The real investment: skincare is visible here. Vitamin C serum, good moisturiser, minimal foundation; radiance not coverage is the goal.',
        deepSkinNote: 'On deep Fitzpatrick V-VI skin, choosing the right undertone-matched cosmetics is the most important makeup decision — all the technique in the world won\'t compensate for ashy or too-pink foundation.'
      }
    }
  ],
  latinaMakeupTips: {
    undertones: 'Latin skin spans warm olive (yellow-green undertone), warm brown (golden-orange undertone), and cool medium (pink-neutral undertone); the vast range means self-matching foundation in person is critical — don\'t order without a match first',
    bridal_quinceañera: 'For quinceañera and wedding beauty: the expectation is full glamour — matching nails, dramatic hair, full face. The 15-year-old birthday girl traditionally coordinates entire beauty look with her dress colour',
    telenovela_aesthetic: 'Telenovela makeup references: defined contouring, dramatic eye, pin-straight or blow-out wavy hair, warm skin. This aesthetic is aspirational in many Latin American communities and is characterized by perfect polish above all.'
  }
};

export const EAST_ASIAN_ICONIC_LOOKS = {
  title: 'East Asian Iconic Beauty Looks',
  icons: [
    {
      name: 'Jennie Kim (BLACKPINK) — Korean idol',
      era: '2016–present',
      aestheticSignature: '"Chanel girl" meets K-pop — the intersection of effortless French girl minimalism and precise Korean beauty. Glass skin, puppy eye liner, gradient "bitten" lip, soft peach or milky blush.',
      recreationGuide: {
        glassSkin: {
          steps: ['Double cleanse', 'Essence (apply in 7-skin method — 7 thin layers)', 'Vitamin C serum', 'Sheet mask (optional for events)', 'Moisturiser', 'Sunscreen'],
          foundation: 'Skin tint or glass-finish foundation; never full-coverage or matte; the skin must look like skin',
          finish: 'Dewy setting spray; NO powder on skin'
        },
        kPopEye: {
          description: 'K-pop "puppy eye" — the opposite of a cat-eye wing; the liner extends slightly down at the outer corner rather than up, creating a soft, approachable look',
          steps: ['No eyeshadow or very subtle wash of peachy-nude shimmer on lid', 'Pencil liner along upper lash line; extend lower at outer corner with a subtle downward extension', 'Bottom lash line: liner or shadow from centre to outer corner slightly down', 'Mascara upper and lower', 'White or nude liner on lower waterline', 'Individual lashes on outer corners only for softness']
        },
        blush: 'Milky, almost sunburned or "flushed" blush — dusty rose or peach applied high on cheeks close under eyes, blended upward; creates a youthful, healthy look',
        lips: 'Gradient lip ("ombre lip"): apply blotted lip tint to centre of lip; blend slightly outward; edges are lighter than centre; creates a natural "just eaten berries" look'
      }
    },
    {
      name: 'Fan Bingbing — Chinese actress',
      era: '2000s–present',
      aestheticSignature: 'Imperial Chinese glamour: flawless porcelain skin, bold red lip, perfect cat-eye, luxurious jet-black hair; the most dramatic iteration of Chinese beauty ideals',
      recreationGuide: {
        skin: 'Absolute porcelain flawless base: colour-matched foundation to precisely skin tone (not lighter — the C-beauty ideal is true skin matching, not lightening); full coverage; precise concealing; set with translucent powder',
        eyes: 'Sharp precise cat eye in black — the wing extends significantly at outer corner and points up; lid can have a very subtle skin-coloured shimmer shadow; lashes: natural-looking false strip',
        lips: 'Bold red lip perfectly applied — lined and filled with matching classic red; this is a Chinese cosmetics staple; choose a warm red (orange-warm) rather than cool blue-based red for warm-toned skin'
      }
    },
    {
      name: 'Naomi Osaka — Haitian-Japanese tennis player',
      era: '2018–present',
      aestheticSignature: 'Natural, effortless beauty that celebrates mixed heritage; protective natural styles; minimal no-makeup makeup; celebrating rather than concealing natural features',
      recreationGuide: {
        approach: 'The "no-makeup makeup" refined: skin first, then only the finishing touches',
        skin: 'SPF, serum, and tinted moisturiser only; let skin breathe; niacinamide for even tone',
        minimal: 'One product at a time: clear brow gel, one coat mascara, tinted lip balm; the total look takes under 5 minutes and looks intentionally effortless'
      }
    }
  ],
  eastAsianMakeupTips: {
    hooded_eyes: 'Many East Asian eyes have a monolid or hooded lid; techniques that work best: (1) eye tape to create a temporary crease fold; (2) applying eyeshadow higher up into the brow bone area so colour is visible when eyes are open; (3) lower lash definition over upper',
    doubleeyelid_options: 'Double eyelid tape, eyelid glue, or eyelid stamps create a temporary crease; double eyelid surgery (blepharoplasty) is common; both are personal choices — monolid eyes are beautiful and uniquely featured without alteration',
    gradient_lip_technique: 'The K-beauty gradient lip requires: precise application and then blotting to remove outer edge intensity; a lip gloss over the centre is an alternative approach',
    skin_first: 'K-beauty and J-beauty both prioritise skincare as the real makeup — layering hydration until skin looks its best means minimal base needed. This approach suits oily skin (common in East Asian skin types) particularly well.'
  }
};

export const EAST_AFRICAN_ICONIC_LOOKS = {
  title: 'East African Iconic Beauty Looks',
  icons: [
    {
      name: 'Liya Kebede — Ethiopian model',
      era: '2000s–present',
      aestheticSignature: 'Luminous deep skin made canvas for pure fashion; minimal make-up maximalism — no foundation to let deep brown skin glow, single striking eye or lip, exceptional bone structure highlighted not concealed',
      recreationGuide: {
        skin: ['Skip foundation entirely or use the most sheer skin tint — Liya\'s power is bare skin', 'High-quality facial oil (marula or jojoba) pressed gently over the face', 'Bronze-toned highlighter on highest points: tops of cheekbones, brow bones, nose bridge'],
        eyes_dramatic: 'One element: full graphic black liner only, or deep glossy lid, or defined lash line with single false lashes',
        lips: 'Either bold deep red-berry OR bare moisturised lip; the contrast serves the look'
      }
    },
    {
      name: 'Iman Abdulmajid — Somali-American supermodel, Mrs David Bowie',
      era: '1970s–present',
      aestheticSignature: 'Iman founded IMAN Cosmetics specifically because no makeup matched her deep skin — a pioneer. Her own aesthetic: liquid liner artistry, sculpted cheeks, warm copper eye shadow, deep warm lips, flawless rich skin.',
      recreationGuide: {
        liner_artistry: 'Iman\'s eye: pencil liner entire upper lid, defined to precision; no wing but thick and clean; bottom lash line fully defined with smudged kohl; mascara upper and lower heavily',
        cheeks: 'IMAN Cosmetics bronzer (the brand\'s most iconic product — designed specifically for deep skin without the orange cast); build in layers on cheeks, temples, forehead',
        lip: 'Deep warm wine berry or burnt sienna — warm-toned deep lips on Fitzpatrick V-VI skin are stunning; avoid cool blue-based plums which look harsh; choose warm brick-wine or mahogany'
      }
    }
  ],
  eastAfricanMakeupTips: {
    undertones: 'East African skin across Ethiopia, Somalia, Kenya, and Tanzania varies — from warm golden-brown (Fitzpatrick IV) to very deep blue-undertone (Fitzpatrick VI). Identify undertone carefully: warm (orange, brown base) vs cool (blue, red base) skin needs different makeup.',
    frankincense_prep: 'Traditional East African beauty prep: frankincense resin smoke (naqad) directed at skin and hair — antimicrobial and aromatic skin treatment before special occasions. Frankincense oil in modern skincare provides anti-inflammatory benefit as primer pre-makeup.',
    diaspora_fusion: 'East African diaspora beauty (UK, US, Scandinavia) is a beautiful fusion — traditional mehndi for celebrations, Western makeup for daily wear, African fashion for occasions'
  }
};

export const SOUTH_AFRICAN_ICONIC_LOOKS = {
  title: 'South African Iconic Beauty Looks',
  icons: [
    {
      name: 'Bonang Matheba — South African TV personality',
      era: '2010s–present',
      aestheticSignature: 'South African glam meets international luxury — flawless radiant skin, contoured and highlighted; bold lip in magenta, hot pink, or classic red; long voluminous hair extensions; "Queen B" aesthetic',
      recreationGuide: {
        skin: 'Luminous but controlled — dewy skin with strategic matte T-zone; warm golden highlighter on cheeks; warm bronze blush',
        lips: 'The Bonang signature: saturated bold lip in warm pink-magenta or deep red; perfectly lined and filled; gloss optional',
        contour: 'Moderate sculpting on cheeks and temples with warm medium-brown powder; blend with damp beauty sponge for seamless finish',
        lashes: 'Full glam lashes — thick natural-look strip; mascara on lower lashes'
      }
    },
    {
      name: 'Charlize Theron — South African-American actress',
      era: '1990s–present',
      aestheticSignature: 'Minimalist European-influenced elegance reflecting her Afrikaans heritage; emphasis on flawless skin, barely-there makeup, statement red lip for occasions',
      recreationGuide: {
        skin: 'Exceptional skincare showing through minimal base — moisturiser, SPF, light tinted product; skin should look healthy not made-up',
        lips: 'The Charlize signature for red carpet: classic red lip — perfectly applied, liner followed precisely by lipstick, top coat of gloss for modern finish; all other makeup intentionally minimised'
      }
    }
  ],
  southAfricanMakeupTips: {
    diversity: 'South Africa is one of the world\'s most diverse nations; beauty practices span Black South African (Zulu, Xhosa, Sotho, Tswana), South African Indian, Coloured, and Afrikaans communities — each with distinct aesthetic traditions',
    ndebele_influence: 'Traditional Ndebele women historically decorated their faces, necks, and arms with geometric patterns using white clay and natural pigments for ceremonies — geometric graphic makeup nods to this tradition',
    rooibos_prep: 'Rooibos tea brewed strong and cooled as a toner and face mist is a South African beauty tradition — the antioxidants in rooibos create an excellent skincare base'
  }
};

export const BLACK_AMERICAN_ICONIC_LOOKS = {
  title: 'Black American Iconic Beauty Looks',
  icons: [
    {
      name: 'Beyoncé — Black American entertainer',
      era: '1997–present',
      aestheticSignature: 'Beauty that shifts with every era — from girl-next-door naturalness to goddess-level fantasy. The Renaissance era look: sculptural body, blinding gold, powerful scale.',
      recreationGuide: {
        renaissanceLook: {
          skin: ['Flawless melanin-matched foundation (no ashy or too-orange undertone)', 'Strong contour with warm brown (3 shades deeper than foundation)', 'Blinding gold highlighter on cheekbones, nose tip, temples, collar bones, shoulders if bare', 'Warm copper blush'],
          eyes: ['Gold shimmer lid — layer from inner corner to outer, building shimmer intensity', 'Define crease with matte warm brown', 'Dramatic full false lashes', 'Gold or black liner on waterline', 'Fierce arched brows — slightly over-drawn arch for impact'],
          lips: ['Nude warm peachy-brown in the "perfect nude" — matches skin exactly; add gloss', 'OR bold wine or caramel for Beyoncé vintage looks']
        },
        naturalEra: 'Lemonade-era Beyoncé: big natural hair, bold graphic liner, warm bronze skin; less complex products, more about presence'
      }
    },
    {
      name: 'Lupita Nyong\'o — Kenyan-Mexican actress',
      era: '2013–present',
      aestheticSignature: 'Celebrates dark Fitzpatrick VI skin through editorial excellence; bold graphic eye, close-cropped or sculptural natural styles, bold single-colour lip, deeply moisturised skin-as-art',
      recreationGuide: {
        skin: 'Most important step: deeply moisturised, luminous skin (no mattifying products); apply hyaluronic acid, moisturiser, then facial oil; foundation only if desired — sheer, matched precisely to deep skin tone',
        eyes: 'The Lupita eye: often graphic and precise — bold colour (violet, forest green, cobalt blue, copper) in a geometric application; eyeliner only or shadow only, not both combined',
        colour: 'Lupita demonstrates that bold colour on deep skin is not clash but complement — deep skin supports all shades; choose colours from the rich end of the spectrum',
        lip: 'Often a single striking colour — deep plum, vivid wine, or warm coral — nothing competing with the eyes; or conversely, bare skin-tone lip with dramatic eyes'
      }
    },
    {
      name: 'Viola Davis — Black American actress',
      era: '2000s–present',
      aestheticSignature: 'Authentic Black femininity — the natural hair journey that started on the Oscars stage; full glam that honours Fitzpatrick V skin with warm tones; beauty that never apologises',
      recreationGuide: {
        skin: 'Rich, warm-toned base — foundation with yellow-warm undertone (never cool or pink which will appear purple or ashy on Fitzpatrick V); set T-zone only; warm peach blush',
        naturalHairBeauty: 'Viola\'s natural hair moments — TWA (teeny weeny afro), wash-and-go curls — demonstrate that textured hair is always red-carpet ready; the styling focus is shape, moisture, and sheen',
        lips: 'Berry, burgundy, or warm mauve — deep lip colours that complement the warmth of Fitzpatrick V skin'
      }
    }
  ],
  blackAmericanMakeupTips: {
    foundationFundamentals: '1. Match in natural light on jawline, not wrist. 2. Choose warm (yellow-orange) undertone unless skin is clearly cool (blue-red undertone). 3. Build up rather than applying heavy single layer. 4. Neck and face should always match.',
    PIH_and_cover: 'PIH (Post-Inflammatory Hyperpigmentation) common on Fitzpatrick V-VI; for events: full-coverage foundation over well-moisturised skin, set only with translucent powder. For everyday: colour correction in peach-orange under foundation if PIH is visible.',
    blush: 'Warm berry, warm brick, deep peach, or warm coral blush for Fitzpatrick V-VI; apply on apples of cheeks and blend upward; never use a cool-toned or pink blush — appears too bright or contrasting',
    blackGirlMagic: 'Black American beauty culture celebrates creativity and expression — any "rule" about what colours are appropriate is rejected. Bright neons, unconventional placement, bold graphic liner, bold lip AND bold eye together — all are empowered choices.'
  }
};

export function getCelebrityLooksOverview() {
  return CELEBRITY_LOOKS_OVERVIEW;
}

export function getIconicLooks(communityId) {
  const key = communityId.replace(/-/g, '_');
  const map = {
    'west-african': WEST_AFRICAN_ICONIC_LOOKS,
    'south-asian': SOUTH_ASIAN_ICONIC_LOOKS,
    caribbean: CARIBBEAN_ICONIC_LOOKS,
    arab: ARAB_ICONIC_LOOKS,
    latina: LATINA_ICONIC_LOOKS,
    'east-asian': EAST_ASIAN_ICONIC_LOOKS,
    'east-african': EAST_AFRICAN_ICONIC_LOOKS,
    'south-african': SOUTH_AFRICAN_ICONIC_LOOKS,
    'black-american': BLACK_AMERICAN_ICONIC_LOOKS,
    west_african: WEST_AFRICAN_ICONIC_LOOKS,
    south_asian: SOUTH_ASIAN_ICONIC_LOOKS,
    east_asian: EAST_ASIAN_ICONIC_LOOKS,
    east_african: EAST_AFRICAN_ICONIC_LOOKS,
    south_african: SOUTH_AFRICAN_ICONIC_LOOKS,
    black_american: BLACK_AMERICAN_ICONIC_LOOKS
  };
  return map[communityId] || map[key] || null;
}

export function getMakeupTips(communityId) {
  const looks = getIconicLooks(communityId);
  if (!looks) return null;
  const tipKeys = Object.keys(looks).filter(k => k.toLowerCase().includes('tip'));
  if (tipKeys.length > 0) return looks[tipKeys[0]];
  return null;
}

export const CELEBRITY_LOOKS_STATS = {
  moduleId: 'celebrity_looks_guide',
  version: '1.0.0',
  topics: ['celebrity beauty looks', 'iconic style recreation', 'Bollywood makeup', 'K-pop beauty', 'Arab eye makeup', 'J.Lo glow', 'Fenty beauty', 'West African glam', 'natural hair beauty', 'multicultural beauty icons'],
  communitiesSupported: 9,
  iconsTotal: 24,
  keyFacts: [
    'Rihanna founded Fenty Beauty with 40 foundation shades to address the industry-wide gap for dark skin tones',
    'Iman Abdulmajid founded IMAN Cosmetics because no existing makeup matched her deep skin',
    'The K-beauty gradient "ombre" lip is applied at the centre only and blended outward for a bitten-lip effect',
    'Arab bridal makeup is among the most elaborate globally; traditional heavy kohl application in waterlines is thousands of years old',
    'Lupita Nyong\'o demonstrates that all bold colour categories work on deep Fitzpatrick VI skin — colour theory does not have a skin tone limit',
    'Cool-toned (pink/purple) blush and foundation appears ashy or purple on warm brown and deep skin tones',
    'The J.Lo glow pioneered the bronzer category — her warm bronzed aesthetic launched an entire product segment'
  ]
};
