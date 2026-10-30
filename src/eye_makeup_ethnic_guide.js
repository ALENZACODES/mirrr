// eye_makeup_ethnic_guide.js
// Eye makeup traditions, techniques, and products across 9 ethnic communities
// Fully self-contained ESM module — no imports

export const ETHNIC_EYE_MAKEUP_GUIDES = {
  'west-african': {
    id: 'west-african',
    name: 'West African Eye Makeup',
    regions: ['Nigeria', 'Ghana', 'Senegal', 'Côte d\'Ivoire', 'Mali', 'Benin'],
    overview: `West African eye makeup traditions are rooted in practices far older
    than modern cosmetics. The use of kohl —
    called tiro in Yoruba — is a sacred, medical, and aesthetic tradition that spans ethnic groups
    across the region. The dramatic eye is a hallmark of West African beauty, particularly during
    festivals, weddings, and rites of passage.`,

    ancientTraditions: {
      tiro: {
        name: 'Tiro (Yoruba Kohl)',
        description: `Tiro is the Yoruba term for the black kohl powder applied to the eyes.
        It has been used in Nigeria for thousands of years, and its application is deeply
        embedded in Yoruba culture. Tiro is traditionally made from antimony sulfide (stibnite),
        charcoal, or soot collected from cooking pots. The powder is stored in a small decorative
        container called an ìkòkò tiro or tiro pot, which is itself a craft object.`,
        preparation: [
          'Traditional tiro is ground from raw stibnite (antimony ore) on a smooth grinding stone',
          'Charcoal-based tiro uses fine wood ash or palm kernel soot, filtered through cloth',
          'Some preparations include ground clove, frankincense, or shea oil as a carrier',
          'Modern tiro blends combine carbon black pigment with natural oils for safe use',
        ],
        application: [
          'Applied with a thin stick called an ìgbá tiro (applicator stick), traditionally made from bone or wood',
          'Drawn along the inner waterline of both upper and lower lids',
          'Can be extended to create a dramatic rim around the entire eye',
          'Blended outward with a fingertip for a smoky, diffused effect',
          'Reapplied multiple times for deeper, more dramatic color',
        ],
        culturalContext: `Tiro application in Yoruba culture is often a communal act.
        Mothers apply it to infants (in traditional belief, to strengthen eyesight and
        ward off evil eye), and brides have their eyes done by elder women on wedding days.
        The act of applying tiro is considered an act of care and blessing.`,
      },
      ghanaKohl: {
        name: 'Kohl in Ghana',
        description: `In Ghana, kohl is used across Akan, Ga, and Ewe communities under
        various local names. The Akan use it particularly during puberty rites (bragoro),
        where a young woman's eyes are dramatically lined as part of her ceremonial transformation
        into adulthood. Kohl is also used in funerary rites and masquerade festivals.`,
        keyGroups: ['Akan (kohl during bragoro rites)', 'Ga (festival and funeral use)', 'Ewe (ritual and aesthetic)'],
      },
      senegalKohl: {
        name: 'Kohl in Senegal (Khôl)',
        description: `Senegalese women, particularly in the Wolof and Toucouleur communities,
        use khôl as a daily beauty staple. The application in Senegal tends to be bolder than
        in some other West African contexts — a full rim around both eyes, sometimes extending
        to create almond-shaped exaggeration. The word khôl is the direct French transliteration
        of the Arabic, reflecting Senegal's deep Islamic cultural connections.`,
      },
    },

    ethnicGroupTraditions: {
      yoruba: {
        group: 'Yoruba (Nigeria, Benin)',
        eyeTraditions: `The Yoruba aesthetic places enormous importance on the eyes as a
        window to character and spiritual state. In Yoruba cosmology, the eyes (ojú) are
        considered the physical manifestation of one's inner light (imọlẹ). A beautifully
        lined eye is not merely decorative — it signals dignity, ritual preparedness, and
        social status. During Gelede festivals, elaborate eye treatments accompany ceremonial
        costumes. Brides (ìyàwó) undergo full eye makeup as part of their wedding preparation,
        often including heavy tiro, false lashes, and gold eyeshadow on the lid.`,
        signatureEyeLook: 'Heavy tiro waterline with blended smoky outer corner, gold lid',
      },
      hausa: {
        group: 'Hausa-Fulani (Northern Nigeria, Niger)',
        eyeTraditions: `The Hausa-Fulani tradition of kohl use is the most directly connected
        to the Arab Islamic tradition in West Africa. Surma (the Hausa word for kohl) is applied
        daily by women and has prophylactic (protective) connotations. Hausa bridal eye looks
        are among the most dramatic in the region — a full black rim, heavily extended inner
        corner, and sometimes stacked layers of kohl applied over three days before the wedding.`,
        signatureEyeLook: 'Full rim surma, heavily extended inner corner, dramatic thickness',
      },
      akan: {
        group: 'Akan (Ghana)',
        eyeTraditions: `Akan women use kohl strategically rather than as a daily routine.
        Its application is reserved for festivals like Akwasidae, funerals of elder community
        members, and special rites of passage. The Akan eye look tends toward a cleaner line
        rather than the smoked-out look favored in Yoruba aesthetics.`,
        signatureEyeLook: 'Clean kohl rim with white inner corner highlight',
      },
    },

    modernTrends: {
      boldEyeLooks: `Contemporary West African makeup artists — many trained at international
      schools or self-taught through YouTube and Instagram — blend traditional tiro techniques
      with modern cosmetic products. The result is eye looks that honor the bold, full-rim
      tradition while incorporating glitter, cut-creases, and structured graphic lines.`,
      lashExtensions: {
        culturalContext: `Lash extensions have become a major part of West African beauty culture,
        particularly in Nigeria, Ghana, and Côte d'Ivoire. They are viewed as an enhancement
        of natural beauty rather than a replacement for it — stacking with kohl and bold eyeshadow.
        The Nigerian beauty market for lash extensions grew significantly through the 2010s-2020s,
        with mink and silk lashes favored for their softness and natural appearance.`,
        popularStyles: ['Wispy mixed-length', 'Dramatic volume sets', 'Bottom lash extensions', 'Individual placement for festive occasions'],
      },
    },

    skinConsiderations: {
      periorbitalHyperpigmentation: {
        description: `Periorbital hyperpigmentation — darkening of the skin around the eyes —
        is extremely common in West African women and is often misidentified as a beauty flaw
        when it is simply a feature of high-melanin skin. It is caused by a combination of
        post-inflammatory pigmentation, thin under-eye skin (through which dark blood vessels
        show), and genetic predisposition.`,
        makeupTechniques: [
          'Color-correcting with peach or orange concealer before foundation — peach cancels purple tones on medium-deep skin, orange cancels deeper bluish-black tones',
          'Setting with a banana or gold-toned powder to prevent creasing and maintain correction',
          'Avoiding heavy layers that sink into fine lines under the eye',
          'Using a slightly lighter concealer than foundation — one shade, not two — to avoid ashiness',
          'Brightening inner corner with champagne or gold highlight rather than stark white',
        ],
        productRecommendations: [
          'Orange color-correcting concealer (NYX, Maybelline, MAC)',
          'Banana setting powder (Laura Mercier, Black Radiance)',
          'Hydrating eye cream with vitamin C to address over time',
          'Caffeine eye serum to depuff and reduce dark vessel visibility',
        ],
      },
    },

    productRecommendations: {
      kohls: ['MAC Blacktrack Fluidline', 'NYX Epic Ink Liner', 'Maybelline Lasting Drama Gel Liner', 'Traditional tiro (artisan/market-sourced)'],
      eyeshadows: ['Juvia\'s Place Nubian palettes (designed for deep skin)', 'Black Radiance True Complexion', 'Fenty Beauty Snap Shadows'],
      mascaras: ['L\'Oréal Telescopic', 'Maybelline Sky High', 'Essence Lash Princess'],
    },
  },

  'south-asian': {
    id: 'south-asian',
    name: 'South Asian Eye Makeup',
    regions: ['India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Diaspora'],
    overview: `Eye makeup in South Asian culture is an old and well-documented tradition.
    Kajal and kohl have been used on the Indian subcontinent for thousands of years, with references in the Vedic texts, the
    Ayurvedic medical canon, and classical Sanskrit poetry. In many traditions the eyes are treated
    as the most expressive feature of the face.`,

    kajal: {
      history: `Kajal (also called kohl, surma, or anjan depending on region) is the defining
      eye cosmetic of South Asian beauty. Its use is documented in the Sushruta Samhita and
      Charaka Samhita — the foundational Ayurvedic medical texts — which describe specific
      preparations of anjana (eye collyrium) for treating eye diseases, improving vision,
      and enhancing beauty.`,
      ayurvedicScience: {
        description: `From an Ayurvedic perspective, the eyes (drishti) are governed by
        the Alochaka Pitta sub-dosha. Kajal was believed to protect the eyes by:`,
        mechanisms: [
          'Reducing glare: the dark line on the waterline reduces light scatter, functionally similar to the black grease athletes use under their eyes',
          'Cooling effect: camphor and rose water preparations were believed to reduce inflammation and redness',
          'Tearing stimulation: some preparations caused mild lacrimation, which practitioners believed cleared dust and impurities',
        ],
        modernCaveats: `Modern analysis has complicated the health claims. Lead-based kajal
        (galena/surma) presents genuine health risks, particularly for infants. The WHO has
        flagged traditional lead-based eye kohl as a source of lead toxicity in children in
        South Asian and MENA communities. Choose kajal sold as lead-free and compliant with
        cosmetics regulations, and never apply traditional preparations to babies.`,
      },
      preparation: {
        traditional: [
          'Deepam kajal: lamp soot collected from a wick burning in castor oil or ghee, caught on a copper plate, mixed with ghee or breast milk',
          'Almond kajal: almonds burned in controlled conditions, the carbon mixed with coconut or almond oil',
          'Camphor kajal: camphor burned and the soot collected, noted for its cooling properties',
          'Trifala anjana: three-herb (amla, haritaki, bibhitaki) preparation, a medicinal rather than cosmetic formulation',
        ],
        modern: [
          'Kohl pencils with carbon black pigment and wax base',
          'Kajal sticks (twist-up) with soft, blendable formula',
          'Gel kajal in pots for longest wear',
          'Waterproof formulas using synthetic waxes and film-formers',
        ],
      },
      applicationTechnique: {
        waterlineApplication: `The defining characteristic of South Asian kajal application
        is the inner waterline (the wet rim of the eye, upper and lower). Unlike Western
        liner technique which draws on the outer lash line, kajal is applied inside the eye,
        creating a darkness that originates from within the eye itself, making the eye appear
        deeper and more defined without the appearance of makeup on the surface.`,
        steps: [
          'Pull lower lid gently downward with ring finger of non-dominant hand',
          'With a soft kajal stick or traditional kohl applicator (salai), draw a smooth line on the inner rim of the lower waterline',
          'For upper waterline: tilt head back, look down, and gently draw along inner upper rim',
          'Blink to distribute and soften the line naturally',
          'Use fingertip or small brush to blend any fallout onto the lower lash line',
          'For smoky effect: drag a thin brush or fingertip along the lower lash line while kajal is still fresh',
          'For staying power: apply translucent setting powder gently to lower lash line after',
        ],
        kajaleVsLiner: `The key distinction between kajal and eyeliner: kajal sits ON the
        waterline (mucous membrane), creating a smudged, lived-in darkness. Eyeliner sits
        ABOVE or BELOW the lash line on skin, creating a cleaner, more graphic definition.
        South Asian beauty traditionally uses kajal on the waterline and may layer eyeliner
        on top of the lash line for added drama.`,
      },
    },

    eyeShapes: {
      overview: `South Asia is home to remarkable eye shape diversity, reflecting the
      genetic mixing of Dravidian, Indo-Aryan, Mongolian (especially in Northeast India
      and Nepal), and other ancestral populations.`,
      shapes: {
        deepSet: {
          name: 'Deep-Set Eyes',
          
          characteristics: 'Eyes appear recessed; brow bone is prominent; lid space appears smaller than average',
          techniques: [
            'Light shimmer or satin shadow on the lid to bring it forward',
            'Avoid heavy dark shadow on the entire lid — concentrate dark color in the outer V only',
            'Highlight under the brow bone and inner corner strongly',
            'Kajal on waterline can make eyes appear even deeper — balance with lid highlight',
            'Curl lashes to open upward and counteract the recessed appearance',
          ],
        },
        almond: {
          name: 'Almond Eyes',
          
          characteristics: 'Balanced proportions; slightly pointed outer corners; visible lid space',
          techniques: [
            'Most flattering for all techniques — eyeliner, kajal, shadow all work well',
            'Cat eye extends naturally from the outer corner',
            'Can handle dramatic cut-crease looks',
          ],
        },
        monolid: {
          name: 'Monolid (Epicanthal fold present)',
          
          characteristics: 'No visible crease line; upper lid appears smooth; eye opening may appear smaller',
          techniques: [
            'Skip crease work — it won\'t show when eyes are open',
            'Focus on lash line definition with graphic liner',
            'Emphasize lower lash line for balance',
            'Eyelid tape or glue can create a temporary fold for those who want it',
            'Lengthening mascara with horizontal brush movement to maximize lash spread',
            'Waterproof kajal on the upper inner waterline helps prevent smudging on smooth lid surface',
          ],
        },
      },
    },

    bridalEyeLooks: {
      
      classical: {
        name: 'Bharatanatyam-Inspired Bridal Eye',
        description: `Classical Indian dance (Bharatanatyam, Kathak, Odissi) has directly
        influenced South Asian bridal eye makeup. The elongated kajal line extending past the
        outer corner, the white or silver dot at the inner corner (symbolizing the third eye
        of Saraswati), and the heavy kohl rim all originate in classical performance makeup.`,
        steps: [
          'Heavy kajal on full waterline, upper and lower',
          'Black kohl along lash line extending to winged point 1–1.5cm past outer corner',
          'Deep gold, burgundy, or copper shadow on the lid',
          'A second, lighter shade on the brow bone as highlight',
          'White or silver kohl dot at inner corner (bindiya of the eye)',
          'Full false lashes or lash extensions',
          'Mascara on lower lashes for bat-wing effect',
          'Optional: bindi above the nose bridge (complements eye look)',
        ],
      },
      regional: [
        { region: 'Bengali', style: 'Very heavy kajal extending far past outer corner; kohled lower waterline; focus on fullness and depth' },
        { region: 'Punjabi', style: 'Gold-heavy lids, dramatic liner wings, often with silver glitter' },
        { region: 'Tamil/South Indian', style: 'Thick kajal, red or gold shadow, flowers incorporated into overall look' },
        { region: 'Pakistani', style: 'Smoky eyes in grey-black, lighter than some Indian bridal styles; kohl-heavy' },
        { region: 'Kashmiri', style: 'Deep-set eyes enhanced with heavy kajal; silver accents reflecting Mughal influence' },
      ],
    },

    smokyEye: {
      southAsianVersion: `The South Asian smoky eye predates the Western "smoky eye" by centuries.
      The smudged, smoked-out kajal look — achieved simply by applying kajal and blending with a
      fingertip — is the original smoky eye. The Western version adapted this aesthetic in the
      early 2000s using multiple eyeshadow shades, but the South Asian approach creates a similar
      effect with a single product in minutes.`,
      modernApproach: [
        'Apply kajal on waterline and smudge outward with small brush',
        'Layer dark eyeshadow (matte black, espresso, or dark brown) over the smudged line',
        'Blend upward in circular motion toward the crease',
        'Use a transition shade (medium brown or taupe) to soften the edge into the brow bone',
        'Apply shimmer to center of lid only for South Asian-influenced glamour look',
        'Finish with kajal on upper waterline and heavy mascara',
      ],
    },

    productRecommendations: {
      kajal: ['Colorbar Just Smoky Kajal', 'Lakme Eyeconic Kajal', 'Himalaya Herbals Kajal', 'NYX Retractable Eye Liner', 'Maybelline Colossal Kajal'],
      eyeshadow: ['Sugar Cosmetics eyeshadow palettes', 'Lakme 9 To 5 Eye Shadow', 'Nykaa SkinGenius range', 'Morphe 35O palette for warm tones'],
      falseLashes: ['Ardell Natural Lashes 110', 'House of Lashes Iconic', 'Eylure Dramatic Lashes'],
    },
  },

  'caribbean': {
    id: 'caribbean',
    name: 'Caribbean Eye Makeup',
    regions: ['Trinidad & Tobago', 'Barbados', 'Jamaica', 'Guyana', 'Haiti', 'Dominican Republic', 'Puerto Rico', 'Martinique', 'Cuba'],
    overview: `Caribbean beauty is defined by its celebration of color, culture, and resilience.
    Eye makeup in the Caribbean draws from African, South Asian (Indo-Caribbean), Indigenous,
    and European influences, creating a uniquely vibrant aesthetic that is inseparable from
    the region's festival culture. From Trinidadian Carnival to Barbados Crop Over, the
    Caribbean eye look is theatrical, bold, and built to withstand heat and humidity.`,

    carnivalEyeLooks: {
      description: `Caribbean Carnival eye makeup is in a category of its own. The context —
      hours outdoors in tropical heat, dancing, and close physical proximity — demands products
      that are waterproof, highly pigmented, and durable. The aesthetic demands are equally
      extreme: colors must be visible from distance, dramatic enough to complement elaborate
      costumes, and often incorporate theatrical elements.`,
      trinidadCarnival: {
        name: 'Trinidad & Tobago Carnival',
        aesthetics: 'The most technically demanding eye looks in the region. Full face and eye looks coordinate with mas costumes.',
        techniques: [
          'Body paint technology applied to face — high-pigment, sweat-proof base',
          'Rhinestones and gems applied with eyelash glue or spirit gum around brow and orbital bone',
          'Holographic and duo-chrome eyeshadow for shimmer visible in daylight',
          'Heavy false lashes with individual gems or feather accents',
          'Graphic liner in neon colors (pink, yellow, green) for visibility',
          'Setting spray throughout the day to prevent melt',
          'Under-eye concealer set with baking powder to prevent mascara transfer',
        ],
        signatureLook: 'Full holographic lid, rhinestone orbital arch, super-wing liner in bright color, stacked lashes',
      },
      barbadosCropOver: {
        name: 'Barbados Crop Over',
        aesthetics: 'Slightly more wearable than T&T Carnival but still intensely colorful. Blue and gold are traditional Crop Over colors.',
        techniques: [
          'Blue eyeshadow looks (electric blue, cobalt, turquoise) paired with gold inner corner',
          'Glitter topcoat over base shadow for sun-reflective shimmer',
          'Waterproof gel liner in black or navy for base definition',
          'Individual lash clusters for fuller but more natural effect than drag-style falsies',
        ],
      },
      haitianRaRa: {
        name: 'Haitian Rara and Kanaval',
        aesthetics: 'Bold and artistic, drawing from Vodou ceremonial face painting aesthetic combined with modern beauty.',
        techniques: [
          'Face painting elements incorporated into eye look',
          'Bright color blocking on lid — no gradient blending, deliberate color divisions',
          'White eyeliner on lower waterline for contrast with dark skin',
          'Gold shadow on brow bone as highlight',
        ],
      },
    },

    everydayCaribbean: {
      description: `Away from carnival season, Caribbean everyday eye makeup tends toward
      natural enhancement with practical waterproof formulas. The climate (high humidity,
      tropical heat) makes staying power essential for any makeup.`,
      climateConsiderations: [
        'Waterproof mascara is non-negotiable in most Caribbean climates',
        'Gel liner outperforms pencil and liquid in humidity',
        'Setting spray with hold (not dewy) helps prevent sliding',
        'Minimal eyeshadow or only powder formula — cream products can crease in heat',
        'Under-eye setting powder prevents mascara panda eye',
        'Inner corner white or champagne highlight prevents tired look in bright sunlight',
      ],
      naturalLooks: [
        'Mascara + tinted brow gel for work/everyday',
        'Brown pencil liner smudged on lower lash line for soft definition',
        'One-shadow wash on lid in terracotta, mauve, or bronze (flattering across the full Caribbean skin tone range)',
        'Gloss on lid for dewy, beachy eye look',
      ],
    },

    indoCaribbeanTraditions: {
      description: `The significant Indo-Caribbean community (descendants of South Asian
      indentured laborers brought to Trinidad, Guyana, Suriname) maintains South Asian
      beauty traditions including kajal use, particularly among older generations. Younger
      Indo-Caribbean women blend South Asian kajal tradition with Caribbean boldness —
      kajal on the waterline, but paired with Carnival-style shimmer on the lid.`,
    },

    skinToneRange: `Caribbean skin tones run from very deep to fair, often within the
    same island and the same family. Eye makeup colour choices must account for this full spectrum.`,

    productRecommendations: {
      waterproof: ['Urban Decay All Nighter Setting Spray', 'Too Faced Better Than Sex Waterproof Mascara', 'Maybelline TattooStudio Gel Pencil Eyeliner'],
      glitter: ['Lit Cosmetics glitters', 'NARS Powder Blush (shimmer shades for lid)', 'MAC Reflects Glitter'],
      falseLashes: ['Ardell Wispies', 'House of Lashes Starlet', 'Kiss EverEZ Lashes'],
    },
  },

  'arab': {
    id: 'arab',
    name: 'Arab Eye Makeup',
    regions: ['Egypt', 'Saudi Arabia', 'UAE', 'Jordan', 'Lebanon', 'Morocco', 'Iraq', 'Syria', 'Kuwait', 'Tunisia', 'Algeria', 'Diaspora'],
    overview: `The Arab world possesses arguably the most dramatic and historically rich
    eye makeup tradition on earth. For thousands of years — predating even ancient Egypt's
    famous eye looks — kohl has been applied to Arab eyes for medical, spiritual, and
    aesthetic purposes. The eyes hold unique significance in Arab culture: they are the
    primary visible feature for women wearing hijab or niqab, making eye makeup a central
    form of self-expression and social communication.`,

    historicalContext: {
      ancient: `The history of kohl in the Arab world extends to at least 3,000 BCE,
      with archaeological evidence from the Arabian Peninsula and Levant showing small
      kohl pots and applicators. Ancient Egyptian kohl (the famous kohled eyes of
      hieroglyphic art) was itself influenced by and shared with neighboring Arab cultures.
      The Prophet Muhammad (SAW) is reported to have recommended the use of ithmid (pure
      antimony kohl) for eye health, which contributed to the tradition's deep roots in
      Islamic societies.`,
      islamicMedicalTradition: `Medieval Arab physicians — Ibn Sina (Avicenna), Al-Razi,
      and others — wrote extensively about eye preparations. Ibn Sina's Canon of Medicine
      describes over a dozen collyrium (eye preparation) formulas for various conditions,
      many using galena, antimony, and herbal preparations. The medical legitimacy of
      kohl in Islamic medicine contributed to its widespread daily use across the Arab world.`,
      surma: `Surma (also spelled surmah) is the most prestigious form of kohl in Arab
      and South Asian Islamic tradition. Made from pure ithmid (antimony ore from specific
      mines, traditionally Al-Anbari from Andalusia or Hijaz), it is considered to have
      the strongest prophylactic benefits. Modern medical studies on traditional ithmid are
      mixed — while it lacks the toxicity of lead-based surma variants, its health claims
      remain unverified.`,
    },

    eyeAesthetics: {
      theArabEye: `The "Arab eye" aesthetic is defined by darkness, depth, and drama.
      The ideal Arab eye look creates an eye that appears deeply set, dramatically rimmed,
      and almost impossibly large. This is achieved through techniques refined over
      millennia: lining the inner rim (waterline) on both upper and lower lids, smudging
      outward to create a natural smoke, and extending the line beyond the natural eye
      corner to create the impression of a wider, almond-shaped eye.`,
      veiling: `In cultures where women wear hijab or niqab, the eyes become the primary
      canvas for beauty expression. The tradition of "eyes visible while veiled" has driven
      the development of extraordinarily sophisticated eye makeup within Arab cultures.
      Lebanese and Egyptian women are particularly noted globally for their eye makeup
      artistry, with Instagram and YouTube Arab beauty creators having global followings.`,
    },

    techniques: {
      traditionalKohl: {
        name: 'Traditional Kohl Application',
        steps: [
          'Begin with clean, moisturized eye area',
          'Dip kohl stick (mirwad) into kohl pot',
          'Gently pull lower lid down and apply to inner waterline',
          'Repeat for upper waterline, rolling stick along the rim',
          'Blink several times to distribute and set',
          'With fingertip, gently tap and smudge outward along lower lash line',
          'For upper lid: draw a thin line along lash line and blend upward at outer corner',
          'The inner corner is often left as a dark point rather than highlighted',
        ],
      },
      modernSmokyEye: {
        name: 'Arab-Origin Smoky Eye',
        description: `The "smoky eye" as known globally in modern cosmetics is essentially
        a cleaned-up, product-diversified version of the Arab kohl smudge technique. The
        Arab origin of this look is rarely credited in Western beauty media, yet it is the
        direct cultural ancestor of the technique.`,
        steps: [
          'Apply kohl on upper and lower waterlines',
          'Use a dense brush to pack dark matte shadow (black, deep brown, or dark navy) along the lash line',
          'Blend in windshield-wiper motion to smoke the shadow upward',
          'Layer progressively lighter shades toward the crease and brow bone',
          'Apply medium shadow to outer V for dimension',
          'Highlight inner corner with gold or champagne (optional — some Arab looks keep inner corner dark)',
          'Apply kohl to inner lower waterline to maintain the traditional look within the modern technique',
          'Finish with volumizing mascara and consider individual lash clusters at outer corner',
        ],
      },
      weddingEye: {
        name: 'Arab Wedding Eye Look',
        
        khaleeji: {
          style: 'Gulf/Khaleeji Bridal',
          elements: [
            'Gold cut-crease or glitter lid',
            'Heavy black kohl on full waterline',
            'Extended wing liner in black',
            'Lower lash emphasis with individual lashes',
            'Gold flake or micro-glitter over the lid',
            'Brow bone highlighted with bright gold or silver',
            'False lashes stacked (two or three pairs)',
          ],
        },
        egyptian: {
          style: 'Egyptian Bridal',
          elements: [
            'Dramatic winged liner with significant extension',
            'Kohl-rimmed eye with blended smoke',
            'Jewel-toned shadows (emerald, sapphire) more common than in Gulf style',
            'Pearl or crystal embellishments on lid',
          ],
        },
        lebanese: {
          style: 'Lebanese Bridal',
          elements: [
            'Highly technical cut-crease or halo eye',
            'Fashion-forward colors (not always traditional black/gold)',
            'Negative space liner or graphic elements',
            'The Lebanese beauty industry is considered the most technically advanced in the Arab world',
          ],
        },
      },
    },

    everydayLooks: {
      description: `Beyond special occasions, Arab women have a strong tradition of everyday
      eye makeup. The "no-makeup eye makeup" of the Arab world involves subtle kohl on the
      waterline to define and deepen the eye, with little else. For more dramatic daily looks,
      a pencil liner wing and mascara complete a simple but effective routine.`,
      dailyRoutine: [
        'Kohl pencil on lower waterline (5 minutes)',
        'Mascara on upper and lower lashes',
        'Brow grooming with pencil or powder',
        'Optional: one matte shadow on lid for depth',
      ],
    },

    productRecommendations: {
      kohl: ['Urban Decay 24/7 Glide-On Eye Pencil', 'Kajal by Kiko Milano', 'Charlotte Tilbury Rock \'N\' Kohl', 'Traditional ithmid kohl (imported)'],
      eyeshadow: ['Anastasia Beverly Hills palettes', 'NARS Eyeshadow', 'Charlotte Tilbury Legendary Lashes + shadow sets'],
      liner: ['Stila Stay All Day Waterproof Liquid Liner', 'L\'Oréal Paris Flash Cat Eye liner', 'Kat Von D Tattoo Liner'],
    },
  },

  'latina': {
    id: 'latina',
    name: 'Latina Eye Makeup',
    regions: ['Mexico', 'Colombia', 'Brazil', 'Argentina', 'Venezuela', 'Peru', 'Dominican Republic', 'Cuba', 'Puerto Rico', 'US Latina diaspora'],
    overview: `Latina beauty encompasses a vast spectrum of ethnic backgrounds — Indigenous,
    African, European, and Asian — and the eye makeup traditions of Latin America reflect
    this rich diversity. The "ojo" (eye) is central to Latina beauty culture, with eyes
    considered the primary instrument of flirtation, communication, and self-expression.
    From the bold cat eye of Mexican beauty influencers to the terracotta warmth of
    Andean-inspired looks, Latina eye makeup is defined by confidence and cultural pride.`,

    culturalSignificance: {
      elOjo: `In Spanish, "hacer ojos" (to make eyes) is a phrase for flirtatious glancing,
      reflecting the cultural importance of expressive eyes in Latin social culture. The
      novela tradition — dramatic eye expressions in Latin American soap operas — has
      influenced beauty ideals for generations. Eyes must be able to perform: to express
      passion, anger, seduction, and mischief.`,
      colorTradition: `Latin American eye makeup leans warm — terracotta, copper, rust,
      gold, warm brown, brick red. These warm tones reflect the region's Indigenous and
      African color traditions while complementing the most common Latina skin tones
      (warm olive to deep brown). Jewel tones are also significant — emerald green is
      particularly iconic in Mexican and Central American beauty traditions.`,
    },

    iconicLooks: {
      catEye: {
        name: 'The Latina Cat Eye',
        description: `The cat eye is perhaps the most iconic Latina eye look — a sharp,
        dramatic wing that exaggerates the outer corner of the eye. Mexican-American
        beauty culture in particular elevated the graphic cat eye as a form of identity
        and resistance. The look crosses generations, from the Pachuca aesthetic of the
        1940s to contemporary Chicana art.`,
        technique: [
          'Begin with gel or liquid liner at inner corner',
          'Draw along upper lash line keeping close to lashes',
          'At outer corner, pause and look at the natural downward slant of your eye',
          'Angle the wing tip upward at roughly 45 degrees from the outer lash line',
          'The wing length is typically 1–2cm depending on eye size',
          'Fill in the triangle between the wing tip, the last lash, and the lid',
          'Go back and thicken the line at the outer two-thirds for drama',
          'Option: flick lower liner from outer corner to meet the wing tip',
        ],
        variations: [
          'Dramatic Chicana cat eye: very long wing, extreme upward flick',
          'Modern Latina Instagram: graphic cut-crease with small wing',
          'Telenovela: thick liner along entire lid with medium wing, heavy mascara',
        ],
      },

      cholaEye: {
        name: 'Chola Eye Look',
        description: `The Chola eye look originated in Mexican-American barrio communities
        in Southern California, particularly in East LA, from the 1970s–1990s. It is a
        cultural aesthetic deeply tied to Chicana identity, working-class pride, and
        resistance to mainstream beauty standards. The look has been appropriated by
        mainstream beauty media — a contested and sensitive topic — but within Chicana
        culture it remains a statement of heritage and identity.`,
        elements: [
          'Very thin, severely arched eyebrow penciled above the natural brow',
          'Intense, dark lip liner extending beyond natural lip',
          'Heavy liner on the upper lid with dramatic flick',
          'Minimal eyeshadow or none — the focus is liner and brows',
          'Mascara on lower lashes',
        ],
        culturalNote: `Non-Chicana adoption of this look (particularly by celebrities)
        has been widely criticized as cultural appropriation without credit or context.
        When engaging with this aesthetic, acknowledging its Chicana origins is essential.`,
      },

      quinceaneraEye: {
        name: 'Quinceañera Eye Look',
        description: `The quinceañera (15th birthday celebration) is a major rite of passage
        in Latin American culture, and the eye makeup for this occasion is formal, glam,
        and marking a young woman's first full makeup moment. The look blends tradition
        (matching the dress color, often pink or purple) with contemporary glamour.`,
        elements: [
          'Shadow color coordinated with dress — rose, dusty pink, lavender, fuchsia',
          'Shimmer or glitter lid with matte transition shade in crease',
          'Defined black liner wing — sharp and polished',
          'Full false lashes (first time for many)',
          'Strong brow to frame the face for photography',
          'Champagne or gold inner corner highlight',
        ],
      },
    },

    warmColorTradition: {
      description: `The terracotta, copper, and rust color palette is the defining signature
      of Latina eye makeup in the natural/everyday register. These warm earth tones complement
      nearly every Latina skin tone, from fair (many Argentine and Cuban heritage women)
      to deep (Afro-Latina and Indigenous-heritage women).`,
      palette: [
        { shade: 'Terracotta', hex: '#C76A3B', use: 'Lid wash for everyday warmth' },
        { shade: 'Copper', hex: '#B87333', use: 'Shimmer lid for evening' },
        { shade: 'Rust', hex: '#B7410E', use: 'Crease shadow for depth' },
        { shade: 'Brick', hex: '#9C3A2C', use: 'Outer V and liner combination' },
        { shade: 'Gold', hex: '#CFB53B', use: 'Inner corner and highlight' },
        { shade: 'Warm Brown', hex: '#7B4A2B', use: 'Transition and crease' },
        { shade: 'Burnt Sienna', hex: '#883222', use: 'Deep crease definition' },
      ],
    },

    asianLatinaConsiderations: {
      description: `A significant but often overlooked subset of Latina beauty includes
      women of East Asian heritage — particularly in Peru, Brazil (largest Japanese-heritage
      population outside Japan), and Mexico (Chinese immigration history). These women
      navigate both Latina and East Asian beauty traditions.`,
      monoeyelid: [
        'Monolid techniques apply (see East Asian section) — crease work won\'t show when eyes open',
        'Focus on lash line graphic liner rather than crease shadow',
        'The cat eye adapts beautifully to monolid — the wing remains visible',
        'Eyelid tape can create a temporary fold for those who desire it',
        'Lower lash emphasis creates balance and drama on a monolid',
      ],
    },

    productRecommendations: {
      liner: ['L\'Oréal Paris Infallible Flash Cat Eye', 'Maybelline Hyper Precise All Day Liner', 'NYX Matte Liquid Liner'],
      eyeshadow: ['Too Faced Sweet Peach palette', 'Urban Decay Naked Heat palette', 'Juvia\'s Place The Nubian palette'],
      mascara: ['L\'Oréal Voluminous Original', 'Maybelline Lash Sensational', 'Essence Lash Princess'],
    },
  },

  'east-asian': {
    id: 'east-asian',
    name: 'East Asian Eye Makeup',
    regions: ['South Korea', 'Japan', 'China', 'Taiwan', 'Vietnam', 'Thailand', 'Diaspora'],
    overview: `East Asian eye makeup is one of the most dynamic, technically innovative,
    and culturally debated areas of global beauty. At its heart is a fundamental question
    that East Asian communities continue to navigate: should makeup techniques work with
    the natural East Asian eye shape (monolid, epicanthal fold, smaller lid space) or
    attempt to replicate Western double-eyelid aesthetics? This tension has produced
    extraordinary innovation on both sides — celebrating the natural eye while also
    developing highly sophisticated enhancement techniques.`,

    monolidRevolution: {
      naturalCelebration: `The "monolid positivity" movement, particularly visible in Korean
      beauty influencer culture since the early 2020s, argues that the monolid eye is not
      a "problem" to be fixed but a beautiful feature to be enhanced on its own terms.
      Makeup techniques that work with the monolid — graphic liner, lower lash emphasis,
      straight brow, color on lower lid — create looks that are uniquely East Asian and
      do not attempt to recreate Western lid space.`,
      monoeyelidTechniques: [
        'Skip the crease shadow — it vanishes when eyes open',
        'Use graphic liner to define the eye: thick upper liner stays visible above the lash line',
        'Lower lash line shadow (smudged pencil or shadow) is the primary depth tool',
        'Lengthening and volumizing mascara especially on lower lashes for balance',
        'Inner corner highlight — pink or white — to open and enlarge the eye',
        'Bold eyebrow style — straight Korean brows or dramatic arched brows — frame the eye',
        'Color is placed lower on the lid (near the lash line) to be visible when eyes are open',
        'Shimmer on center of mobile lid (the part that shows when eye is open)',
      ],
    },

    doubleEyelid: {
      
      
      nonsurgicalAlternatives: {
        tape: {
          name: 'Eyelid Tape',
          description: 'Thin double-sided tape applied to the lid to create a temporary crease. A major consumer category in East Asia.',
          application: [
            'Clean and dry the eyelid completely',
            'Measure tape to fit lid width',
            'Using a provided fork/wand, locate the desired crease position',
            'Apply tape and press with fork to set',
            'Apply eyeshadow and liner on top',
            'Waterproof tape varieties last through normal activities',
          ],
          limitations: ['Visible if not concealed with makeup', 'Can peel in heat or if eye gets wet', 'Requires practice to place correctly'],
        },
        glue: {
          name: 'Eyelid Glue',
          description: 'Clear adhesive applied with a small wand to create crease. More natural-looking than tape when applied skillfully.',
          application: [
            'Apply thin line of glue to lid where crease is desired',
            'Allow to become tacky (30–60 seconds)',
            'Use fork tool to press lid upward into the glue',
            'Hold for 30 seconds',
            'Apply powder shadow to set and camouflage',
          ],
        },
        fiber: {
          name: 'Fiber/Mesh Tape',
          description: 'Nearly invisible thread or mesh that creates crease with minimal visible product. Professional-grade tool popular in Korean television industry.',
        },
      },
    },

    countrySpecific: {
      korean: {
        name: 'Korean Eye Aesthetics',
        subcultures: {
          ulzzang: {
            name: 'Ulzzang Style',
            meaning: 'Best face (얼짱) — internet-famous beauty ideal originating in Korean online communities circa 2000s',
            elements: [
              'Large, doe-like eyes as the primary goal',
              'Lower lash line heavily smudged with brown or black pencil',
              'Circle lenses (colored contact lenses that enlarge the iris) to maximize eye size',
              'Light shimmer on center of mobile lid',
              'Straight, natural-looking eyebrows',
              'Rosy blush placed under the eyes (aegyo sal emphasis)',
              'Light mascara — defined but not clumped',
              'Under-eye aegyo sal (the lower lid fat pad) highlighted, not concealed',
            ],
            aegyo: {
              name: 'Aegyo Sal',
              description: `Aegyo sal (애교살) refers to the small cushion of fat directly
              below the lower lash line. In Korean beauty, this feature is highly desirable
              — it creates a youthful, slightly swollen look that conveys cuteness (aegyo).
              Unlike Western beauty where under-eye puffiness is eliminated, Korean makeup
              techniques intentionally highlight and even create artificial aegyo sal.`,
              technique: [
                'Apply shimmery light shadow or pearlescent highlighter along the lower lash line',
                'Then apply a slightly darker (but not dark) matte shadow BELOW the shimmer line to create shadow that mimics the natural shadow below the fat pad',
                'Result: the shimmery strip appears to protrude, mimicking the natural aegyo sal shape',
                'Do not extend this technique past the outer corner — keep it centered under the eye',
              ],
            },
          },
        },
        kBeautyMakeup: {
          dewy: 'Korean makeup philosophy emphasizes dewy, glass-like skin as the base for eye looks',
          gradient: 'Color gradient techniques (heavy outer, lighter inner) are preferred over uniform coverage',
          monochrome: 'Tonal makeup (same color family for eyes, lips, cheeks) is a core Korean makeup concept',
        },
      },

      japanese: {
        name: 'Japanese Eye Aesthetics',
        gyaru: {
          name: 'Gyaru Eye Look',
          description: `Gyaru (ギャル, from "gal") was a Japanese youth subculture from the 1990s–2010s
          characterized by heavily made-up, Western-influenced aesthetics. The gyaru eye look is
          the most dramatic Japanese eye technique, notable for its intense lower lash emphasis.`,
          elements: [
            'Individual lower lashes applied to the lower lid (often 20+ individual lashes for a cluster effect)',
            'White or flesh-colored liner on lower waterline (opens and enlarges eye)',
            'Dark shadow on upper lid blended into socket',
            'Very thick upper falsies',
            'Heavy lower lash mascara or individual lower lash clusters',
            'Light shimmer on inner corner and brow bone',
            'Circle lenses for enlarged iris',
          ],
          subStyles: [
            'Hime gyaru: princess aesthetic, softer colors',
            'Ganguro: darker skin, platinum hair, even more extreme liner',
            'B-gyaru: Black-influenced gyaru with braids and hip-hop aesthetics',
          ],
        },
        waseiEye: `Traditional Japanese beauty (wabi-sabi aesthetic) emphasizes restraint —
        mascara, light shadow, groomed brows. The dramatic gyaru look existed in tension with
        this traditional ideal and has significantly declined since 2015.`,
      },

      chinese: {
        name: 'Chinese Eye Aesthetics',
        modern: `Contemporary Chinese beauty (C-beauty) has developed its own distinct aesthetic,
        distinct from K-beauty and J-beauty. C-beauty emphasizes natural-looking enhancement —
        the "no-makeup makeup" is very popular — with specific emphasis on youthful, delicate
        looks rather than the dramatic styles of Korean or Japanese subcultures.`,
        techniques: [
          'Light, sheer shadow in pink, peach, or nude tones',
          'Very thin liner at upper lash line only (often skipped)',
          'Strong focus on brow shape and definition',
          'Light mascara, combed through for separation',
          'Subtle inner corner pink or white highlight',
        ],
        hanfu: `The rise of Hanfu fashion (traditional Chinese dress) has sparked interest
        in classical Tang Dynasty and Song Dynasty eye looks — fine liner, specific crease
        paint styles documented in historical paintings and sculptures.`,
      },
    },

    productRecommendations: {
      eyelidProducts: ['D-UP Wonder Eyelid Tape', 'Koji Eyelid Fiber', 'Eye Talk Double Eyelid Glue', 'Lids by Design'],
      liner: ['Kate Tokyo Lasting Liner', 'Heroine Make Smooth Liquid Liner', 'Clio Kill Black Waterproof Liner'],
      circlelenses: ['Freshkon Alluring Eyes', 'Bausch + Lomb Lacelle series', 'GEO Medical lenses'],
      mascara: ['Shiseido Majolica Majorca Lash Expander', 'Dolly Wink Lash Fixer', 'Clio Waterproof Kill Lash Mascara'],
    },
  },

  'east-african': {
    id: 'east-african',
    name: 'East African Eye Makeup',
    regions: ['Ethiopia', 'Somalia', 'Eritrea', 'Djibouti', 'Kenya', 'Tanzania', 'Uganda'],
    overview: `East African eye makeup traditions are among the most distinctive globally,
    characterized by their connection to both ancient Cushitic and Semitic beauty customs
    and to the Islamic traditions that have shaped Somali, Djiboutian, and coastal Kenyan
    (Swahili) communities. The kohl tradition of East Africa is deeply tied to spiritual
    protection, medical practice, and social identity.`,

    ethiopianTraditions: {
      ithmid: {
        name: 'Ithmid (Ethiopian Kohl)',
        description: `Ethiopian kohl tradition uses ithmid — pure antimony sulfide (stibnite)
        — ground to a fine powder and stored in ornate containers. The Ethiopian ithmid pot
        (often made of silver or horn) is itself a crafted object passed down through families.
        The tradition of kohl use in Ethiopia predates the Islamic period and is documented
        in ancient Aksumite culture.`,
        application: `Ethiopian kohl is applied to the full inner rim of the eye — both upper
        and lower waterlines — using a thin stick. The application is often repeated in layers
        to achieve extreme darkness. In Oromo and Amhara wedding traditions, the bride's eyes
        are kohled multiple times over the days before the wedding, with the darkness building.`,
        iquba: 'The traditional kohl applicator stick in Ethiopia is called an iquba, made from bone, metal, or treated wood',
      },
      bridalEye: {
        name: 'Ethiopian Bridal Eye',
        elements: [
          'Heavy ithmid kohl on full upper and lower waterlines',
          'Smudged outward along lower lash line with fingertip',
          'Sometimes extended with a thin line to the outer temple',
          'Habesha bride hair (elaborate curled style) frames the kohled eyes',
          'No additional eyeshadow traditionally — kohl is the entire eye look',
          'Modern bridal looks add gold eyeshadow over the traditional kohl base',
        ],
      },
    },

    somaliTraditions: {
      description: `Somali eye makeup is among the boldest in the region. The Somali
      cultural aesthetics places enormous value on expressive, defined eyes — a full
      kohl rim is everyday wear for many Somali women, not a special occasion look.
      This boldness is particularly significant because many Somali women wear hijab
      or niqab, making the eyes the primary visible beauty expression.`,
      kohl: {
        name: 'Somali Kohl (Isbiid)',
        description: 'Isbiid is the Somali word for kohl (also spelled isbiidh). Traditional Somali kohl is dark grey-black, made from galena (lead sulfide) traditionally, though modern preparations use safer alternatives.',
        application: [
          'Applied to the full inner rim of both upper and lower lids',
          'A thick line rather than a thin one — bold application is the norm',
          'Extended slightly at the outer corners to elongate',
          'Often applied to infants and children in traditional communities (a practice now medically discouraged due to lead content concerns in traditional preparations)',
          'Re-applied throughout the day as needed',
        ],
      },
      modernSomali: `Contemporary Somali-British, Somali-American, and Somali diaspora beauty
      creators have become a force on social media, blending traditional kohl with Western
      techniques. The "Somali glam" aesthetic (bold kohl + dramatic falsies + bronzed skin)
      has gained international followers.`,
    },

    eritreanDjiboutian: {
      eritrea: {
        name: 'Eritrean Kohl Tradition',
        description: `Eritrean kohl use blends the Cushitic (Tigrinya, Bilen, Saho) and
        the Afar/Saho traditions. The dramatic eye is culturally expected at weddings and
        festivals. Eritrean kohl tends toward a full rim with a deliberately smudged,
        non-precise edge — a soft dramatic rather than a sharp graphic look.`,
      },
      djibouti: {
        name: 'Djiboutian Eye Tradition',
        description: `Djibouti's beauty culture is shared with Somali and Afar traditions,
        both of which feature prominent kohl use. Djiboutian women at festivals and weddings
        use kohl heavily, often combined with henna art on the hands and face. The eye
        look is typically a full rim of dark kohl smudged to a soft finish.`,
      },
    },

    lashCulture: {
      description: `Lash culture is deeply embedded in East African beauty aesthetics.
      Natural East African lash traits vary considerably, but the cultural aspiration
      toward full, long lashes is consistent. Lash extensions have become the dominant
      beauty industry in major East African cities (Nairobi, Addis Ababa, Mogadishu
      diaspora cities) since the 2010s.`,
      popular: ['Mink lash extensions in volume or hybrid styles', 'Individual cluster lashes for daily wear', 'Ardell naturals for at-home use'],
    },

    skinConsiderations: {
      deepSkin: `East African skin tones typically run from warm brown through very deep
      espresso. Eye makeup considerations for deep skin include:`,
      tips: [
        'Avoid matte black as the only eyeshadow color — it can look flat on very deep skin; add dimension with deep brown or aubergine',
        'Shimmer and metallic shadows photograph and appear beautifully on deep skin — lean into them',
        'White or cream kohl on lower waterline brightens and enlarges on deep skin tones',
        'Warm browns and golds flatter olive-adjacent skin tones in coastal Kenyan/Swahili communities',
        'Avoid very light, ashy matte shades as transition colors — they can appear chalky',
      ],
    },

    productRecommendations: {
      kohl: ['MAC Chromagraphic Pencil in Carbon Black', 'NYX Retractable Eye Liner', 'Urban Decay 24/7 Liner in Zero', 'Traditional ithmid kohl (market/specialty)'],
      eyeshadow: ['Juvia\'s Place The Nubian (deep tones)', 'Fenty Beauty Snap Shadows Mix & Match', 'Black Radiance eye palettes'],
      mascara: ['Too Faced Better Than Sex', 'L\'Oréal Voluminous', 'Maybelline Sky High'],
    },
  },

  'south-african': {
    id: 'south-african',
    name: 'South African Eye Makeup',
    regions: ['Johannesburg', 'Cape Town', 'Durban', 'South Africa broadly', 'Diverse ethnic communities'],
    

    ndebeleTradition: {
      name: 'Ndebele Decorative Eye Tradition',
      description: `The Ndebele people of South Africa are globally renowned for their
      geometric art — the boldly patterned painted homes (indlu) and beadwork that are among
      the most visually striking traditions in Africa. Ndebele body art includes face painting
      for ceremonies, where geometric patterns can incorporate the eye as a central design element.
      The eye itself becomes part of a larger geometric composition rather than an isolated
      feature to enhance.`,
      eyeElements: [
        'White clay (inyongo) as a base for facial patterns around the eye',
        'Bold black geometric lines framing the eye socket',
        'Red or yellow ochre elements in wedding/initiation contexts',
        'The eye as focal point of a larger abstract face composition',
      ],
      modernInfluence: `Contemporary South African makeup artists, particularly those working
      in the fashion editorial space (Vogue SA, Glamour SA), draw on Ndebele geometric tradition
      for avant-garde eye looks. Bold graphic liner in geometric formations, color-blocked eye
      looks in Ndebele colors (black, white, red, yellow, green), and patterned eyeshadow
      placement reflect this heritage.`,
    },

    capeMalayTradition: {
      name: 'Cape Malay Kohl Tradition',
      description: `The Cape Malay community of Cape Town (descendants of slaves and political
      exiles brought from Southeast Asia, particularly Indonesia, Malaysia, and the Indian Ocean
      world, by the Dutch East India Company from the 1650s onward) has maintained a distinct
      Islamic kohl tradition for over 350 years. Cape Malay women apply surma (kohl) as both
      a spiritual practice (Sunnah of the Prophet) and an aesthetic one.`,
      tradition: [
        'Applied on lower waterline with a thin applicator (same technique as Arab/South Asian tradition)',
        'Used for special occasions like Eid, weddings, and Moulood celebrations',
        'Traditional Cape Malay weddings feature heavily kohled bridal eyes',
        'The tradition is maintained by older women and is passing to younger generations through active community transmission',
      ],
    },

    urbanSouthAfrican: {
      description: `In urban centers (Johannesburg, Cape Town, Durban), South African eye
      makeup culture is heavily influenced by global trends via Instagram, the local salon
      and beauty industry, and African-American beauty culture (particularly among Black
      South Africans who share cultural aesthetics through music, social media, and fashion).`,
      trends: [
        'Fox eye technique using liner and brow tail extension',
        'Bold colored liner in pink, green, or purple — popular among Cape Town creative communities',
        'Natural eye looks with strong brows — a major local trend',
        'Lash extensions as daily beauty staple across communities',
        'Cut-crease eyeshadow looks influenced by international MUA tutorials',
      ],
      localBeautyIndustry: `The South African beauty industry has grown significantly,
      with local brands (Woolworths Beauty, Clicks Beauty, Edgars Beauty) and international
      brands (MAC, Maybelline, Revlon) serving diverse skin tone needs. Shade diversity
      in foundation and concealer has improved significantly since the Fenty Beauty effect
      (2017 onwards).`,
    },

    zuluXhosa: {
      name: 'Zulu and Xhosa Eye Traditions',
      description: `Among Zulu and Xhosa communities, traditional ceremonial face painting
      uses ochre (umhlobo — red clay) and white clay (inyoni or izimbilo) in patterns that
      extend to the eye area. For umemulo (Zulu coming-of-age) and ulwaluko (Xhosa initiation)
      ceremonies, face painting creates a transformative appearance. The everyday eye makeup
      tradition in urban Zulu and Xhosa communities is largely contemporary and influenced
      by global trends.`,
    },

    indianSouthAfrican: {
      description: `The Indian-South African community (primarily in KwaZulu-Natal, particularly
      Durban — home to the largest Indian diaspora outside India) maintains kajal and kohl
      traditions brought from the Indian subcontinent by indentured laborers in the 1860s.
      South African Tamil and Telugu communities observe bridal kajal traditions nearly
      identical to those in Tamil Nadu and Andhra Pradesh, with South African cosmetic products
      substituted for traditional preparations.`,
    },

    productRecommendations: {
      available: ['Essence makeup (widely available and affordable)', 'Revlon ColorStay Liner', 'Maybelline Hyper Precise Liner', 'MAC (premium)'],
      local: ['Sorbet Beauty', 'Clicks own-brand beauty', 'Woolworths Beauty'],
    },
  },

  'black-american': {
    id: 'black-american',
    name: 'Black American Eye Makeup',
    regions: ['United States', 'Black American culture across all regions'],
    overview: `Black American eye makeup culture is one of the most dynamic, innovative,
    and globally influential beauty traditions of the 20th and 21st centuries. Born from
    the convergence of West African beauty traditions brought through the Middle Passage,
    the resourcefulness of community developed under systemic exclusion from mainstream
    beauty industries, and the explosive creative energy of Black American art, music,
    and fashion, Black beauty eye traditions have repeatedly defined global trends —
    often without receiving credit.`,

    historicalContext: {
      exclusion: `For most of the 20th century, mainstream US cosmetics brands (Revlon,
      Max Factor, Maybelline) did not develop products for dark skin tones. Black American
      women developed their own brands (Madam C.J. Walker's empire, Naomi Sims Beauty,
      Fashion Fair) and their own techniques for making mainstream products work with deep skin.
      This era of resourcefulness and creativity produced a distinctly Black American beauty
      aesthetic that values bold, visible impact.`,
      sixties: {
        name: '1960s–1970s: The Black Power Eye',
        description: `The Black Power and Black Is Beautiful movements of the 1960s–70s
        revolutionized Black American beauty ideals. The rejection of Eurocentric beauty
        standards was aesthetic as well as political. The eye look of this era was bold,
        deliberate, and proud:`,
        elements: [
          'Heavy liner in the Black Power graphic style',
          
          'Strong, unmanipulated eyebrow (rejection of the thin penciled brow)',
          'False lashes as a statement (Lola Falana, Diana Ross-era looks)',
          'Eye looks inspired by the Afrocentric aesthetic movement',
        ],
        icons: ['Diana Ross', 'Pam Grier', 'Cicely Tyson', 'Angela Davis'],
      },
      eighties: {
        name: '1980s–1990s: Soul Train Beauty',
        description: `The Soul Train era brought glamour and confidence to Black American
        eye looks. Smoky eyes, bright shadows, and dramatic lashes defined the decade.`,
        elements: ['Bright blue and green shadow on deep skin (revolutionary)', 'Heavy mascara on both upper and lower lashes', 'Pencil liner as defining tool', 'Frosted shadow on inner corner and brow bone'],
      },
    },

    deepSkinToneExpertise: {
      whatShows: {
        description: `A primary technical challenge for eye makeup on deep skin tones
        is knowing which colors are visible and which are lost. The deep pigmentation of
        the skin creates more contrast against some colors and absorbs others.`,
        showsWell: [
          'Metallics and shimmer — gold, copper, bronze, silver all show vividly on deep skin',
          'Bright, saturated jewel tones — cobalt, emerald, amethyst, sapphire',
          'Pure white and cream (particularly on waterline — creates dramatic contrast)',
          'Deep burgundy, plum, and wine (contrast with skin at a richer depth than on lighter skin)',
          'Fuchsia and hot pink on very deep skin (dramatic and beautiful)',
          'Glitter and holographic pigments (catch light regardless of skin darkness)',
        ],
        lessVisible: [
          'Light matte nudes and taupes — they blend into skin rather than creating contrast',
          'Pale pink on deep skin — very subtle or invisible',
          'Light lavender — can appear greyish or ashy',
          'Matte black across the entire lid with no shimmer — can look flat without dimension',
        ],
        workaround: `For depth and dimension without shimmer, deep matte purples, wines,
        and espresso-browns provide darkness with richness. Pair with a shimmer center
        of lid to add light.`,
      },
      purpleAndBlue: `Purple and blue eyeshadow on deep skin tones is one of the most
      beautiful color combinations in makeup — the contrast between deep skin and cool-toned
      deep jewel shadows creates an effect that is not achievable on lighter skin tones.
      Purple particularly reads with extraordinary richness and depth. This is a distinctly
      Black beauty aesthetic contribution to global beauty culture.`,
    },

    graphicLiner: {
      description: `Razor-sharp winged liner is perhaps the single most iconic Black American
      eye makeup technique. The perfect wing — needle-point tip, zero wobble, mirror-image
      symmetry — is a skill celebrated, shared, and refined in Black beauty culture.`,
      technique: {
        tools: ['Felt-tip liner pens (most control)', 'Gel liner with thin brush', 'Tape method for perfect wing angle'],
        steps: [
          'Start with a well-moisturized and primed eyelid',
          'Draw a dot at the outer corner where the wing will end — use the angle of the lower lash line extended upward as your guide',
          'Draw a second dot at the base of the outer lashes',
          'Connect the two dots with a thin line to create the wing outline',
          'Fill in the triangle',
          'Draw the main liner from inner corner to outer corner, connecting to the filled wing',
          'Thicken the liner at the outer half of the eye',
          'Use a cotton swab dipped in concealer to clean any wobble along the edge — this is the secret to sharp edges',
          'Repeat on other eye, using the first wing as reference',
        ],
        tips: [
          'Do wings BEFORE eyeshadow — concealer cleanup changes after shadow makes shadow application easier',
          'Stamp the wing rather than drag to reduce error',
          'Work in layers — thin lines build to thick more controllably than going thick immediately',
        ],
      },
    },

    viralMoments: {
      description: `Black American beauty has generated some of the most viral and culturally
      significant makeup moments in social media history.`,
      culturalMoments: [
        'The "no-makeup makeup" redefined as Black women showing that full glam and natural beauty are both valid',
        
        'Beyoncé\'s 2016 Lemonade visual album eye looks — editorial Black beauty at its peak',
        
        
        'The natural beauty and Afrocentric eye look resurgence in the early 2020s',
      ],
    },

    productRecommendations: {
      liner: ['Kat Von D Tattoo Liner', 'Stila Stay All Day Liquid Liner', 'MAC Blacktrack Fluidline Gel', 'NYX Matte Liquid Liner'],
      eyeshadow: ['Fenty Beauty Snap Shadows', 'Juvia\'s Place full product line', 'Pat McGrath Labs (founded by Black British legend)', 'ColourPop (affordable deep-shade range)'],
      mascara: ['Too Faced Better Than Sex', 'Maybelline Lash Sensational', 'L\'Oréal Telescopic'],
      foundation: ['Fenty Beauty Pro Filt\'r', 'Black Opal', 'Fashion Fair (heritage Black beauty brand)'],
    },
  },
};

// ─── UNIVERSAL EYE MAKEUP GUIDE ─────────────────────────────────────────────

export const UNIVERSAL_EYE_MAKEUP = {
  anatomy: {
    title: 'Eye Anatomy for Makeup Application',
    overview: `Understanding the anatomy of the eye allows makeup artists and individuals
    to apply products intentionally and effectively, rather than by rote instruction.
    The same technique may need to be modified based on the unique anatomy of different eyes.`,

    zones: {
      lidSpace: {
        name: 'Lid Space (Mobile Lid)',
        description: 'The area of eyelid that is visible between the open eye and the brow bone. This is where eyeshadow has the most impact. Lid space varies enormously: monolids have very little visible lid space; deep-set eyes have minimal lid space because the brow bone shadows it; prominent eyes have generous lid space.',
        makeup: 'Dark shadow here recedes the eye; light or shimmer shadow here advances/opens it',
      },
      crease: {
        name: 'Crease (Orbital Crease)',
        description: 'The natural indentation where the mobile lid meets the brow bone. On a standard double eyelid, the crease is visible when the eye is open. On a monolid, the crease exists but is covered by the skin fold and not visible.',
        makeup: 'Applying darker shadow in the crease creates the illusion of depth; lighter shadow above it creates lift',
      },
      browBone: {
        name: 'Brow Bone',
        description: 'The protruding bone below the eyebrow. Highlighter here lifts and opens the eye. Matte shadow here can soften a very prominent brow bone.',
        makeup: 'Highlight with shimmer or matte light shade; avoid harsh light if brow bone is very prominent',
      },
      innerCorner: {
        name: 'Inner Corner (Tear Duct Area)',
        description: 'The innermost point of the eye near the nose. Lighting this area brightens and widens the eye. Darkening it elongates inward for a more deep-set appearance.',
        makeup: 'Champagne, gold, or white highlight to open; dark shadow to elongate',
      },
      outerCorner: {
        name: 'Outer V / Outer Corner',
        description: 'The outer angle where upper and lower lids meet. Applying dark shadow here in a V shape adds depth and a slightly downturned elongation. Lifting the wing liner at this point creates upward lift.',
        makeup: 'Dark shadow in outer V for depth; wing liner angle determines eye direction (up=lifted, horizontal=almond)',
      },
      waterline: {
        name: 'Waterline (Inner Rim)',
        description: 'The mucous membrane rim of the eye — the wet edge of the eyelid. Lining this with dark kohl/kajal makes the eye appear deeper; lining with white or nude makes it appear more open and awake.',
        makeup: 'Dark waterline: dramatic, sleepy, or sultry; Nude/white waterline: alert, wide-awake, brightened',
      },
      tearLine: {
        name: 'Lower Lash Line',
        description: 'The strip of skin immediately below the lower lashes. Smudging liner or shadow here creates a softer, diffused look; a precise line here creates definition without the intensity of kohl on the waterline.',
        makeup: 'Shadow here: smudgy and soft; Liner here: defined lower rim; Empty: natural and open',
      },
      lacrimalCaruncle: {
        name: 'Caruncle (Pinkish inner corner tissue)',
        description: 'The small pink nodule at the innermost inner corner. Applying highlight here adds extreme brightness but care should be taken not to cover this area with pigment that would migrate into the eye.',
      },
    },

    eyeShapeTypes: {
      monolid: {
        name: 'Monolid',
        description: 'No visible crease when eye is open; smooth lid surface. Common in East Asian, some Southeast Asian, and some Indigenous American populations.',
        characteristics: ['No crease visible when open', 'Eye appears smaller from Western standards', 'Lower lid often more prominent', 'Epicanthal fold present'],
        bestTechniques: ['Graphic liner', 'Lower lash emphasis', 'Color near lash line', 'Eyelid tape for temporary fold'],
      },
      hooded: {
        name: 'Hooded Eyes',
        description: 'The skin of the brow bone overhangs the lid space, partially or fully covering the mobile lid when the eye is open. Common in all ethnicities but increases with age.',
        characteristics: ['Lid space hidden or reduced when eye open', 'Crease may be invisible', 'Shadow applied to visible lid may not show'],
        bestTechniques: ['Apply shadow higher than feels natural (where hood starts)', 'Apply liner with eyes open (not closed)', 'Small wing that points upward rather than outward', 'Avoid shimmer on the hooded area (emphasizes the droop)'],
      },
      deepSet: {
        name: 'Deep-Set Eyes',
        description: 'Eyes appear set deep within the skull; prominent brow bone that casts a shadow over the lid. Lid space appears smaller because of the shadow.',
        characteristics: ['Eyes recessed', 'Prominent brow bone', 'Natural shadow on lid'],
        bestTechniques: ['Light shimmer on lid to bring forward', 'Dark shadow concentrated in outer V only', 'Strong inner corner highlight', 'Lighter upper lid, darker outer only'],
      },
      prominent: {
        name: 'Prominent (Protruding) Eyes',
        description: 'Eyes appear to project forward; generous lid space; the eyeball appears larger relative to the socket.',
        characteristics: ['Large visible lid area', 'Eyes may appear "buggy"', 'Very good canvas for creative shadow work'],
        bestTechniques: ['Dark shadow on lid to recede', 'Avoid highlight on mobile lid', 'Upper and lower liner creates frame', 'Full lid shadow techniques work beautifully'],
      },
      upturned: {
        name: 'Upturned (Cat Eyes)',
        description: 'Outer corner of the eye is higher than the inner corner, creating a natural upward slant.',
        characteristics: ['Natural lift at outer corner', 'Cat-eye appearance without makeup'],
        bestTechniques: ['Cat liner extends this naturally', 'Shadow in outer V enhances the shape', 'Works with most liner styles'],
      },
      downturned: {
        name: 'Downturned Eyes',
        description: 'Outer corner of the eye is lower than the inner corner, creating a slight drooping appearance at the outer corner.',
        characteristics: ['Outer corner drops', 'Can appear sad or tired'],
        bestTechniques: ['Lift the liner wing sharply upward (do not follow natural downward angle)', 'Concentrate highlight at outer corner brow bone', 'Dark shadow in outer corner V angled upward', 'Avoid liner on outer lower lash line (increases drooping appearance)'],
      },
    },
  },

  skinToneAndColor: {
    title: 'How Skin Tone Affects Eye Makeup',
    overview: `Skin tone profoundly affects how eye makeup colors read, how they photograph,
    and which shades create the most flattering effects. Understanding the relationship
    between skin tone and eyeshadow/liner color is essential for effective eye makeup
    across all communities.`,

    deepSkin: {
      tones: 'Deep brown to very deep espresso',
      what_works: [
        'Metallics and shimmers: gold, copper, bronze, silver — all read vividly',
        'Bright jewel tones: cobalt, emerald, sapphire, amethyst, hot pink, fuchsia',
        'Deep jewel tones: burgundy, plum, wine — show with rich depth',
        'White, cream, champagne on waterline (creates dramatic brightening contrast)',
        'Glitter pigments (catch light regardless of base tone)',
      ],
      avoid: [
        'Very light matte nudes — disappear into deep skin',
        'Pale lavender — can read ashy',
        'Baby pink matte — barely visible',
      ],
      contrastPrinciple: 'The greater the contrast between shadow and skin, the more visible the effect. On very deep skin, even "neutral" shadows may need to be lighter or more saturated than their name suggests.',
    },

    mediumDeepSkin: {
      tones: 'Warm tan to medium-deep brown',
      what_works: [
        'Terracotta, copper, rust, and warm earth tones — extremely flattering',
        'Gold and bronze metallics',
        'Warm purples and plums',
        'Emerald and forest green',
        'Cranberry and deep rose',
      ],
      versatile: 'Medium-deep skin is the most versatile for eye makeup — the warm undertones work with both warm and cool shadow palettes, and contrast is achievable with a wide range of saturation levels.',
    },

    mediumOliveSkin: {
      tones: 'Warm olive, medium beige with yellow/green undertone',
      what_works: [
        'Warm browns and bronzes to complement yellow undertone',
        'Mauve and taupe to neutralize without clashing',
        'Rose gold and peachy copper',
        'Navy and forest green (cool accents that contrast with warm base)',
      ],
    },

    lightSkin: {
      tones: 'Fair to light with various undertones',
      what_works: [
        'Wide range — most shadows show well',
        'Darker shades show more dramatically due to contrast with skin',
        'Soft neutrals (taupe, muted pink, champagne) for daytime',
        'Any color works — saturation and placement choices matter most',
      ],
      caution: 'Very pale skin can make certain colors look harsh or costume-like — blending becomes more important to soften edges',
    },
  },

  eyelinerTypes: {
    title: 'Eyeliner Types: Complete Guide',
    types: {
      kohl: {
        name: 'Kohl',
        texture: 'Extremely soft, creamy, powdery',
        finish: 'Smudged, smoky, diffused',
        application: 'Applied to waterline and inner rim; smudges easily for smoky effect',
        bestFor: 'Waterline application, smoky eyes, traditional Middle Eastern and South Asian looks',
        drawbacks: 'Migrates quickly; not suitable for sharp graphic liner',
        tips: 'Set with matching eyeshadow over the top to extend wear',
      },
      kajal: {
        name: 'Kajal',
        texture: 'Soft to medium — slightly firmer than traditional kohl',
        finish: 'Dark and defined but blendable',
        application: 'Can be used on waterline or along lash line; easier to control than pure kohl',
        bestFor: 'South Asian and Middle Eastern techniques; versatile for both waterline and lash line use',
        drawbacks: 'May not be as sharp as liquid or gel for graphic looks',
      },
      gel: {
        name: 'Gel Liner (in pot)',
        texture: 'Smooth gel; dries to a slightly set finish',
        finish: 'Precise and defined; can be smudged before drying',
        application: 'Applied with a thin angled brush for maximum control',
        bestFor: 'Sharp wings, precise lines, long wear; works in humid climates',
        drawbacks: 'Requires brush; product in pot can dry out if not sealed properly',
        tips: 'MAC Blacktrack is the industry gold standard; apply in thin layers',
      },
      liquid: {
        name: 'Liquid Liner (felt tip)',
        texture: 'Liquid; dries quickly to a hard finish',
        finish: 'Most precise, most graphic, most opaque',
        application: 'Felt-tip pen or brush applicator',
        bestFor: 'Sharp cat eyes, graphic liner, razor-edge wings',
        drawbacks: 'Very hard to smudge or blend; difficult for beginners; harsh if line wobbles',
        tips: 'Use tape or a business card edge to guide the wing angle',
      },
      pencil: {
        name: 'Pencil Liner',
        texture: 'Waxy; ranges from very soft to hard',
        finish: 'Softer than gel or liquid',
        application: 'Twist-up or sharpen; applied directly',
        bestFor: 'Everyday definition, soft looks, lower lash line; fastest application',
        drawbacks: 'Less precise than liquid/gel; shorter wear; harder to get opaque color',
      },
      powder: {
        name: 'Powder Shadow as Liner',
        texture: 'Dry powder',
        finish: 'Soft, diffused, smoky',
        application: 'Applied with a thin angled or liner brush, dampened for intensity',
        bestFor: 'Smoky looks, soft definitions, color liner (easy to find any shade)',
        tips: 'Dampen the brush with setting spray for more intense, longer-wearing color',
      },
    },
  },

  mascaraGuide: {
    title: 'Mascara for Different Lash Types',
    lashTypes: {
      straight: {
        name: 'Straight Lashes',
        
        challenge: 'Lashes point downward or horizontally, making them appear shorter and less visible',
        solutions: [
          'Use an eyelash curler BEFORE mascara — always',
          'Curl in three positions: base, middle, and tip of lash',
          'Heat the curler slightly with a hair dryer (test heat on wrist first) for stronger curl',
          'Apply tubing mascara — the formula wraps each lash, maintaining curl through wear',
          'Waterproof formula maintains curl better than regular formula',
          'Consider a lash lift treatment (professional) for semi-permanent curl',
        ],
        products: ['Shiseido Curler (best for straight lashes)', 'Benefit Bad Gal Bang (strong hold)', 'L\'Oréal Lash Paradise'],
      },
      sparse: {
        name: 'Sparse or Fine Lashes',
        
        challenge: 'Mascara clumps and weighs down few lashes; eyes appear naked without extensive product',
        solutions: [
          'Fiber mascara or lash-building mascara (fibers adhere to existing lashes to increase apparent volume)',
          'Individual false lash clusters at outer corners for subtle enhancement',
          'Lash serum (bimatoprost-based prescription or over-the-counter peptide serums) for gradual growth',
          'Full false lash strip application',
          'Lash tinting for darker appearance without volume products',
        ],
        products: ['Grande Lash-MD Serum', 'Benefit They\'re Real Mascara (lengthening fibers)', 'Ardell individual lash clusters'],
      },
      thick: {
        name: 'Thick, Dense Lashes',
        
        challenge: 'Lashes can clump when too much product is applied; already-full lashes need separation more than volume',
        solutions: [
          'Lengthening and separating mascara formula rather than volumizing',
          'Wipe brush before applying to remove excess product',
          'Use a lash comb after application to separate',
          'First coat volumizing, second coat lengthening for best of both',
          'Avoid heavy waterproof formula on already-thick lashes (can stick together)',
        ],
        products: ['L\'Oréal Telescopic (lengthening/separating)', 'Clinique Lash Power (separating)', 'Covergirl Lashblast (if volume is still desired)'],
      },
      short: {
        name: 'Short Lashes',
        challenge: 'Product builds up quickly and makes lashes look stubby',
        solutions: [
          'Apply mascara at base only, then wiggle brush upward in a zigzag motion',
          'Lengthening formula specifically',
          'Individual false lashes at outer corner only for elongation illusion',
          'Liner along upper lash line enhances even when lash length is limited',
        ],
      },
    },
  },

  eyeHealth: {
    title: 'Eye Health and Makeup Safety',
    concerns: {
      leadInKohl: {
        name: 'Lead Content Warning: Traditional Kohl',
        importance: 'CRITICAL',
        details: `Traditional kohl preparations, particularly galena-based surma and tiro
        made from lead sulfide, have been identified by health authorities (WHO, CDC, FDA)
        as a significant source of lead exposure. Lead poisoning from kohl is documented
        particularly in South Asian, Middle Eastern, and North African communities where
        traditional preparations are still used.`,
        risk: [
          'Infants and children are most vulnerable — traditional practice of applying kohl to infant eyes/skin should be discontinued',
          'Lead from kohl applied to the eye can be absorbed systemically through the mucous membrane of the waterline',
          'Blood lead levels in communities using traditional galena kohl are measurably elevated',
        ],
        safeAlternatives: [
          'Carbon black-based kajal (common in commercial products)',
          'Plant-based preparations (lampblack, charcoal from specified plant sources)',
          'Any commercial kohl/kajal with FDA or EU cosmetics compliance (restricted lead levels)',
          'Look for kohl products labeled "lead-free" or certified by cosmetics regulatory bodies',
        ],
        testing: 'If purchasing traditional kohl in markets, there is no consumer test to detect lead. Choose certified commercial alternatives for safety.',
      },
      removalProtocol: {
        name: 'Removing Eye Makeup Safely',
        importance: 'HIGH',
        steps: [
          'Saturate a cotton pad with micellar water or oil-based makeup remover (not rubbing alcohol)',
          'Press pad gently over closed eye for 20–30 seconds — let the product dissolve makeup before rubbing',
          'Sweep gently downward and outward — do not rub side to side, which causes lash loss',
          'Use a separate cotton swab for waterline area — the eye rim is sensitive',
          'Rinse the eye area with clean water after product removal',
          'Apply a gentle eye cream or moisture after to counteract drying effect of removers',
          'Never sleep with eye makeup on — mascara and liner can migrate into the eye overnight and cause irritation, infection, or chalazion (eyelid cyst)',
        ],
        tools: ['Micellar water (Bioderma Sensibio is the gold standard)', 'Cleansing balm (removes heavy waterproof mascara)', 'Oil-based makeup remover', 'Bifasic (two-phase) remover for waterproof formulas'],
      },
      contactLensProtocol: {
        name: 'Makeup with Contact Lenses',
        rules: [
          'Insert contact lenses BEFORE applying makeup',
          'Remove lenses BEFORE removing makeup',
          'Avoid applying liner to inner waterline if wearing contacts — product migrates onto lens',
          'Choose contact-lens-safe mascara if wearing daily lenses',
          'Avoid powder shadow close to the eye if lenses are in — particles can get under the lens',
          'Replace lenses if any makeup product gets in the eye',
        ],
      },
      eyeInfections: {
        name: 'Preventing Eye Infections from Makeup',
        rules: [
          'Replace mascara every 3 months — it is the most bacteria-prone cosmetic',
          'Never share eye makeup (risk of stye, pink eye, herpes simplex transmission)',
          'Sharpen eye pencils before each use — fresh tip, less bacteria',
          'Gel liner pots: keep lid closed tightly; if dry, do not add water (use a drying-agent-safe product extender or replace)',
          'Discard any eye product after an eye infection',
          'If you develop stye or conjunctivitis, stop all eye makeup immediately and see a healthcare provider',
        ],
      },
    },
  },

  eyebrowShaping: {
    title: 'Eyebrow Shaping by Face Shape',
    overview: `Eyebrows frame the eye and the face. Well-shaped brows can alter perceived
    face shape, balance features, and create the backdrop for all eye makeup. Brow shaping
    conventions vary by culture — the thin penciled brow favored in some Latin American
    traditions differs from the straight, full Korean brow or the dramatically arched
    Arab brow.`,

    faceShapes: {
      oval: {
        shape: 'Oval',
        description: 'Face length is approximately 1.5x width; widest at cheeks; forehead and jaw roughly equal',
        bestBrow: 'Softly arched — almost any brow shape works; avoid extreme arch',
        avoid: 'Very flat or very high-arched — both distort the natural balance',
      },
      round: {
        shape: 'Round',
        description: 'Face width and length roughly equal; soft jawline; full cheeks',
        bestBrow: 'High arch with angular peak — lengthens the face vertically',
        avoid: 'Rounded brows — mirror the round face and emphasize wideness',
      },
      square: {
        shape: 'Square',
        description: 'Strong jawline; roughly equal face width at forehead, cheeks, and jaw',
        bestBrow: 'Softly arched, curved — softens the angular jaw',
        avoid: 'Straight horizontal brow — emphasizes squareness; overly angular brow — doubles down on angularity',
      },
      heart: {
        shape: 'Heart',
        description: 'Wide forehead; narrow, pointed chin; often high hairline',
        bestBrow: 'Low, rounded arch or straight brow — balances wide forehead by not adding more width at the top',
        avoid: 'Very high arch — draws attention to and exaggerates forehead width',
      },
      oblong: {
        shape: 'Oblong / Long',
        description: 'Face notably longer than wide; forehead, cheeks, and jaw similar widths',
        bestBrow: 'Flat or very low arch — horizontal line balances vertical face length',
        avoid: 'High arch — elongates further',
      },
      diamond: {
        shape: 'Diamond',
        description: 'Narrow forehead and chin; wide cheekbones',
        bestBrow: 'Curved arch — softens prominent cheekbones; adds width to forehead',
        avoid: 'Thin or flat brows — emphasize the sharp diamond angles',
      },
    },

    culturalBrowStyles: {
      arab: {
        name: 'Arab Brow',
        style: 'Full, thick, dramatically arched; the unibrow (mono-brow) was historically beautiful in some Arab traditions before Western influence; now high, defined arches dominate',
      },
      southAsian: {
        name: 'South Asian Brow',
        style: 'Full and dark naturally; threading is the traditional shaping method (originated in South Asia/Middle East); defined arch with clear shape; threading creates extremely precise lines',
      },
      eastAsian: {
        name: 'East Asian (Korean) Brow',
        style: 'Straight, horizontal, full — the straight Korean brow is the antithesis of the Western arched brow ideal; creates a youthful, friendly appearance',
      },
      westAfrican: {
        name: 'West African Brow',
        style: 'Full and naturally wide; often left natural or given soft definition; dramatic arch for formal occasions',
      },
      latina: {
        name: 'Latina Brow',
        style: 'Full, defined arch; chola-influenced style features thin, highly arched penciled brow; mainstream Latina beauty now emphasizes strong, full natural brows',
      },
    },

    techniques: {
      threading: 'Traditional Indian and Middle Eastern method using twisted cotton thread to remove hair at root level; very precise; pulls hair, not skin; excellent for textured hair types',
      waxing: 'Quick; removes large areas; risk of skin lift (especially with retinoid use or aging skin)',
      tweezing: 'Precise for shaping and maintenance; best for individual stray hairs',
      microblading: 'Semi-permanent tattooing of individual hair strokes; lasts 1–3 years; popular across all communities',
      lamination: 'Chemical treatment that straightens and lifts brow hairs; achieves the fluffy "soap brow" effect; popular in East Asian beauty',
      henna: 'Traditional plant-based dye used in South Asian and Middle Eastern communities; tints both brow hair and skin; temporary (1–4 weeks)',
    },
  },

  contouringHighlighting: {
    title: 'Contouring and Highlighting Around Eyes',
    overview: `Eye contouring uses shadow (to recede and define) and highlight (to advance and open)
    to reshape the apparent size and position of the eyes. These techniques are universally applicable
    but must be adapted to different skin tones — the products used and the intensity of application differ.`,

    techniques: {
      browBoneHighlight: {
        name: 'Brow Bone Highlight',
        purpose: 'Creates lift and openness; separates the eye from the eyebrow',
        product: 'Matte light shadow or shimmery cream/powder highlight',
        application: 'Sweep directly under the arch of the brow; blend edges',
        skinTone: 'All tones — use a shade 1–2 levels lighter than skin tone for natural effect; brighter for dramatic',
      },
      innerCornerHighlight: {
        name: 'Inner Corner Highlight',
        purpose: 'Widens and brightens the eye; counteracts dark circles at inner corner',
        product: 'Champagne, gold, or white shimmer shadow; shimmery pencil',
        application: 'Dab precisely at inner corner tear duct area; do not blend outward (keep concentrated)',
        skinTone: 'Deep skin: use gold or warm bronze, not stark white (can look ashy); Medium: champagne; Fair: white or pink pearl',
      },
      undereye: {
        name: 'Under-Eye Concealer and Setting',
        purpose: 'Brightens dark circles; creates a clean base for lower lash line shadow',
        steps: [
          'Apply hydrating eye cream first',
          'Color correct with peach (medium-deep) or orange (deep) concealer to cancel darkness',
          'Apply skin-tone concealer or 1-shade-lighter-than-skin concealer on top',
          'Set with translucent or banana powder — press (not sweep) to avoid disturbing concealer',
          'The technique is called "baking" — allowing powder to sit for 5–10 minutes then dusting away excess',
        ],
      },
      liftingContour: {
        name: 'Lifting Contour for Downturned Eyes',
        purpose: 'Creates illusion of lifted outer corner',
        steps: [
          'Apply medium-depth matte shadow starting from center of lid, blending upward and outward toward temple',
          'Keep the outer corner shadow high — above where it naturally wants to go',
          'No shadow on outer lower lash line (this would drag the eye down)',
          'Liner wing angles upward sharply at outer corner',
          'Highlight outer corner brow bone strongly',
        ],
      },
    },
  },
};

// ─── EYE MAKEUP STATISTICS ───────────────────────────────────────────────────

// ─── GETTER FUNCTIONS ─────────────────────────────────────────────────────────

export function getEyeMakeupGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_EYE_MAKEUP_GUIDES['west-african'],
    'south-asian': ETHNIC_EYE_MAKEUP_GUIDES['south-asian'],
    'caribbean': ETHNIC_EYE_MAKEUP_GUIDES['caribbean'],
    'arab': ETHNIC_EYE_MAKEUP_GUIDES['arab'],
    'latina': ETHNIC_EYE_MAKEUP_GUIDES['latina'],
    'east-asian': ETHNIC_EYE_MAKEUP_GUIDES['east-asian'],
    'east-african': ETHNIC_EYE_MAKEUP_GUIDES['east-african'],
    'south-african': ETHNIC_EYE_MAKEUP_GUIDES['south-african'],
    'black-american': ETHNIC_EYE_MAKEUP_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

export function getUniversalEyeMakeup() {
  return UNIVERSAL_EYE_MAKEUP;
}

export function getAllCommunities() {
  return Object.keys(ETHNIC_EYE_MAKEUP_GUIDES);
}

export function getEyelinerGuide(typeId) {
  const directMap = {
    'kohl': UNIVERSAL_EYE_MAKEUP.eyelinerTypes.types.kohl,
    'kajal': UNIVERSAL_EYE_MAKEUP.eyelinerTypes.types.kajal,
    'gel': UNIVERSAL_EYE_MAKEUP.eyelinerTypes.types.gel,
    'liquid': UNIVERSAL_EYE_MAKEUP.eyelinerTypes.types.liquid,
    'pencil': UNIVERSAL_EYE_MAKEUP.eyelinerTypes.types.pencil,
    'powder': UNIVERSAL_EYE_MAKEUP.eyelinerTypes.types.powder,
  };
  return directMap[typeId] || null;
}

export function getMascaraGuide(lashType) {
  const directMap = {
    'straight': UNIVERSAL_EYE_MAKEUP.mascaraGuide.lashTypes.straight,
    'sparse': UNIVERSAL_EYE_MAKEUP.mascaraGuide.lashTypes.sparse,
    'thick': UNIVERSAL_EYE_MAKEUP.mascaraGuide.lashTypes.thick,
    'short': UNIVERSAL_EYE_MAKEUP.mascaraGuide.lashTypes.short,
  };
  return directMap[lashType] || null;
}

export function getEyeShapeTechniques(shapeId) {
  const directMap = {
    'monolid': UNIVERSAL_EYE_MAKEUP.anatomy.eyeShapeTypes.monolid,
    'hooded': UNIVERSAL_EYE_MAKEUP.anatomy.eyeShapeTypes.hooded,
    'deep-set': UNIVERSAL_EYE_MAKEUP.anatomy.eyeShapeTypes.deepSet,
    'prominent': UNIVERSAL_EYE_MAKEUP.anatomy.eyeShapeTypes.prominent,
    'upturned': UNIVERSAL_EYE_MAKEUP.anatomy.eyeShapeTypes.upturned,
    'downturned': UNIVERSAL_EYE_MAKEUP.anatomy.eyeShapeTypes.downturned,
  };
  return directMap[shapeId] || null;
}

export function getBrowGuideByFaceShape(faceShape) {
  const directMap = {
    'oval': UNIVERSAL_EYE_MAKEUP.eyebrowShaping.faceShapes.oval,
    'round': UNIVERSAL_EYE_MAKEUP.eyebrowShaping.faceShapes.round,
    'square': UNIVERSAL_EYE_MAKEUP.eyebrowShaping.faceShapes.square,
    'heart': UNIVERSAL_EYE_MAKEUP.eyebrowShaping.faceShapes.heart,
    'oblong': UNIVERSAL_EYE_MAKEUP.eyebrowShaping.faceShapes.oblong,
    'diamond': UNIVERSAL_EYE_MAKEUP.eyebrowShaping.faceShapes.diamond,
  };
  return directMap[faceShape] || null;
}

export function getSkinToneColorGuide(toneCategory) {
  const directMap = {
    'deep': UNIVERSAL_EYE_MAKEUP.skinToneAndColor.deepSkin,
    'medium-deep': UNIVERSAL_EYE_MAKEUP.skinToneAndColor.mediumDeepSkin,
    'medium-olive': UNIVERSAL_EYE_MAKEUP.skinToneAndColor.mediumOliveSkin,
    'light': UNIVERSAL_EYE_MAKEUP.skinToneAndColor.lightSkin,
  };
  return directMap[toneCategory] || null;
}

export function getEyeHealthInfo(topic) {
  const directMap = {
    'kohl-safety': UNIVERSAL_EYE_MAKEUP.eyeHealth.concerns.leadInKohl,
    'removal': UNIVERSAL_EYE_MAKEUP.eyeHealth.concerns.removalProtocol,
    'contacts': UNIVERSAL_EYE_MAKEUP.eyeHealth.concerns.contactLensProtocol,
    'infection': UNIVERSAL_EYE_MAKEUP.eyeHealth.concerns.eyeInfections,
  };
  return directMap[topic] || null;
}

export function searchEyeMakeupGuides(keyword) {
  const keyLower = keyword.toLowerCase();
  const results = [];

  for (const [communityId, guide] of Object.entries(ETHNIC_EYE_MAKEUP_GUIDES)) {
    const guideStr = JSON.stringify(guide).toLowerCase();
    if (guideStr.includes(keyLower)) {
      results.push({
        communityId,
        name: guide.name,
        relevance: (guideStr.match(new RegExp(keyLower, 'g')) || []).length,
      });
    }
  }

  results.sort((a, b) => b.relevance - a.relevance);
  return results;
}

export function getKohlTraditionsByCommunity() {
  const directMap = {
    'west-african': {
      name: ETHNIC_EYE_MAKEUP_GUIDES['west-african'].name,
      tradition: ETHNIC_EYE_MAKEUP_GUIDES['west-african'].ancientTraditions.tiro,
    },
    'south-asian': {
      name: ETHNIC_EYE_MAKEUP_GUIDES['south-asian'].name,
      tradition: ETHNIC_EYE_MAKEUP_GUIDES['south-asian'].kajal,
    },
    'arab': {
      name: ETHNIC_EYE_MAKEUP_GUIDES['arab'].name,
      tradition: ETHNIC_EYE_MAKEUP_GUIDES['arab'].historicalContext,
    },
    'east-african': {
      name: ETHNIC_EYE_MAKEUP_GUIDES['east-african'].name,
      tradition: ETHNIC_EYE_MAKEUP_GUIDES['east-african'].ethiopianTraditions.ithmid,
    },
    'south-african': {
      name: ETHNIC_EYE_MAKEUP_GUIDES['south-african'].name,
      tradition: ETHNIC_EYE_MAKEUP_GUIDES['south-african'].capeMalayTradition,
    },
  };
  return directMap;
}
