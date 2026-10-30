/**
 * MIRRR — Eye Care Ethnic Guide
 * Comprehensive eye health, beauty, and care traditions for all 9 ethnic communities.
 * Covers eye shape enhancement, under-eye care, lash traditions, kohl heritage,
 * and culturally specific eye beauty practices.
 */

export const ETHNIC_EYE_CARE_GUIDES = {
  'west-african': {
    communityId: 'west-african',
    communityName: 'West African',
    eyeBeautyPhilosophy: 'West African eye beauty celebrates drama, depth, and intensity. Large, expressive eyes are prized, and traditional kohl (tiro) application dates back millennia. The eye look is central to the beauty identity — bold, deliberate, and celebratory.',
    commonConcerns: [
      'Dark circles on deep melanin-rich skin (often appears as blue-black or purple shadow)',
      'Hyperpigmentation around eye corners and on lids',
      'Puffiness from high-salt diets in some regional cuisines',
      'Eye strain from reading in low-light conditions',
      'Dryness in harmattan (dry season) causing eye discomfort',
    ],
    traditionalPractices: [
      {
        name: 'Tiro (Kohl)',
        description: 'Traditional black kohl (tiro) applied to inner waterline and lash line. Used across West Africa for beauty, eye protection from the sun, and in some traditions as a protective charm. The act of applying tiro is taught mother to daughter.',
        modernSafety: 'Traditional tiro may contain lead — for daily use choose FDA/cosmetic-grade kohl or carbon-based eye liner. Reserve traditional tiro for ceremonial occasions if desired.',
        application: 'Use a thin kohl stick or the tip of a finger to apply to inner waterline. Build intensity with layers.',
      },
      {
        name: 'Shea Butter Eye Area',
        description: 'Raw shea butter applied gently to the orbital bone and upper cheek as an eye cream substitute. Traditional West African women have long used shea as a multi-purpose moisturizer.',
        modernAdaptation: 'Use unrefined shea butter thinned with a few drops of rosehip oil for better absorption around the delicate eye area.',
        caution: 'Avoid applying directly onto eyelid or in the eye. Shea is comedogenic — may cause milia (small white bumps) under the eye for some skin types.',
      },
      {
        name: 'Neem Leaf Eye Compress',
        description: 'Warm neem leaf tea used as a compress for tired eyes. Neem has anti-inflammatory and antibacterial properties.',
        recipe: 'Steep fresh or dried neem leaves in hot water for 15 minutes. Cool to warm temperature. Soak cotton pads and rest on closed eyelids for 10 minutes.',
      },
    ],
    eyeShapeCharacteristics: {
      commonShapes: ['Almond', 'Round', 'Wide-set', 'Prominent lid'],
      makeupTips: [
        'Almond eyes: elongate with a slight wing to the outer corner',
        'Round eyes: apply liner on upper lid only and blend outward for elongation',
        'Wide-set eyes: concentrate darker product toward inner corners',
        'Prominent lids: matte lid shades prevent the lid from looking heavier',
      ],
    },
    underEyeCare: {
      darkCircleCauses: ['Genetic hyperpigmentation (most common)', 'Iron deficiency anaemia', 'Dehydration', 'Sleep deprivation', 'Allergies'],
      treatments: [
        {
          treatment: 'Vitamin K Eye Cream',
          description: 'Vitamin K is clinically studied for dark circles caused by blood pooling. Look for creams with vitamin K + vitamin C combination.',
          timeline: '8–12 weeks for visible results',
        },
        {
          treatment: 'Caffeine Eye Serum',
          description: 'Caffeine constricts blood vessels temporarily, reducing the appearance of dark circles and puffiness. Apply every morning.',
          timeline: 'Immediate effect (temporary), cumulative benefit with daily use',
        },
        {
          treatment: 'Niacinamide Eye Cream',
          description: 'Niacinamide inhibits melanin transfer and brightens hyperpigmented areas including dark circles.',
          timeline: '8–12 weeks',
        },
        {
          treatment: 'Cold Black Tea Compress',
          description: 'Black tea tannins reduce puffiness and temporarily tighten skin. Steep tea bags, refrigerate, apply to eyes for 10–15 min.',
          timeline: 'Immediate',
        },
      ],
    },
    lashBeauty: {
      naturalLashCare: [
        'Castor oil applied to lash roots nightly with a clean spoolie',
        'Biotin supplement (with medical guidance) for lash growth',
        'Avoid waterproof mascara daily — dries and breaks lashes',
        'Remove eye makeup gently with oil-based remover (never rub)',
      ],
      traditionalLashPractices: 'Lash extensions and dramatic lash strips are popular for celebrations. Traditional West African ceremonies often feature full-coverage false lash looks.',
      lashEnhancementOptions: ['Strip lashes for events', 'Individual clusters for natural add', 'Lash lift and tint for natural lashes', 'Fiber mascara for daily fullness'],
    },
    eyeSkinCareRoutine: {
      am: [
        'Gentle caffeine-based eye cream patted with ring finger',
        'Color corrector (orange/peach for deep skin dark circles)',
        'Light-coverage concealer one shade lighter than skin',
        'Setting powder (translucent or banana for deep skin)',
      ],
      pm: [
        'Oil-based cleanser to remove eye makeup thoroughly',
        'Retinol eye cream 2x per week (start low, build up)',
        'Niacinamide + peptide eye cream nightly',
        'Castor oil on lash line and brow before sleep',
      ],
    },
  },

  'south-asian': {
    communityId: 'south-asian',
    communityName: 'South Asian',
    
    commonConcerns: [
      'Prominent dark circles (very common genetic trait in South Asian skin)',
      'Deep-set or hooded eyelids that require specific techniques',
      'Eyelid hyperpigmentation from rubbing or inflammation',
      'Sunken under-eye area showing as hollows',
      'Fine lines developing early in the thin eye skin',
    ],
    traditionalPractices: [
      {
        name: 'Kajal (Kohl)',
        description: 'Kajal is perhaps the most universally used cosmetic product in South Asian culture. Traditionally made from soot, camphor, and ghee, it has been applied to the inner waterline of infants, children, and adults for thousands of years. It defines, enlarges, and protects the eye.',
        history: 'Kajal use in South Asia dates to the Indus Valley Civilization. Ancient texts describe its preparation and medicinal properties. Today\'s homemade kajal recipes use castor oil, camphor, and a clean copper or silver dish.',
        modernSafety: 'Traditional kajal with lead is harmful. Commercial kajal today should be lead-free. Avoid kajal on infants — it is a cultural tradition but lacks safety data for newborn use.',
        homemadeRecipe: 'Hold a copper dish over a castor oil lamp. Collect the soot. Mix soot with a small amount of pure ghee. Store in a clean container. Apply with clean finger or stick.',
      },
      {
        name: 'Coconut Oil Eye Compress',
        description: 'Virgin coconut oil warmed slightly and applied to the eye area with gentle massage. Used for centuries in Ayurvedic tradition to nourish and protect the delicate skin around the eyes.',
        method: 'Warm a few drops of VCO between palms. Apply to orbital bone and upper cheek with ring finger patting motion. Leave overnight.',
      },
      {
        name: 'Rose Water Eye Bath',
        description: 'Pure rose water used as an eye rinse or compress to reduce redness, puffiness, and inflammation. A classic Ayurvedic and Unani remedy.',
        method: 'Soak cotton pads in refrigerated pure rose water. Apply to closed eyes for 10–15 minutes. Can also use an eye cup for a gentle rinse.',
        productTip: 'Kama Ayurveda, Forest Essentials, and Dabur rose water are high-quality options.',
      },
      {
        name: 'Triphala Eye Wash',
        description: 'Triphala (a combination of three fruits) soaked in water overnight and strained for an Ayurvedic eye rinse. Believed to strengthen vision and reduce strain.',
        preparation: 'Soak 1 tsp triphala powder in 2 cups water overnight. Strain thoroughly through fine cloth. Use as a gentle eye rinse in the morning.',
        caution: 'Strain meticulously — any particle in the eye causes irritation. Consult Ayurvedic practitioner for ongoing use.',
      },
    ],
    eyeShapeCharacteristics: {
      commonShapes: ['Almond', 'Deep-set', 'Downturned outer corner', 'Monolid (in some communities)', 'Large and wide'],
      makeupTips: [
        'Deep-set eyes: light shimmery lid shade to bring forward, no dark all over lid',
        'Downturned corners: extend liner upward at outer corner to lift',
        'Large eyes: bold liner all the way around to frame',
        'Hooded eyes: apply liner slightly above the crease so it shows when eyes are open',
      ],
    },
    underEyeCare: {
      darkCircleCauses: [
        'Genetic periorbital pigmentation (most common — structural)',
        'Thinning under-eye skin revealing blood vessels',
        'Allergic shiners (from chronic rhinitis or allergies)',
        'Iron deficiency',
        'Dehydration and high-sodium diet',
      ],
      treatments: [
        {
          treatment: 'Vitamin C + Kojic Acid Eye Cream',
          description: 'Addresses pigment-based dark circles. Vitamin C inhibits melanin production while kojic acid (from fermentation) brightens existing pigmentation.',
          timeline: '12–16 weeks',
          topPicks: ['The Inkey List Caffeine Eye Serum', 'Kiehl\'s Powerful-Strength Line-Reducing Eye Serum'],
        },
        {
          treatment: 'Retinol Eye Cream',
          description: 'Stimulates collagen and thins the appearance of crepey under-eye skin. Helps thicken the skin to conceal vascular dark circles.',
          timeline: '12–24 weeks',
          caution: 'Use only 1–2x per week initially. Avoid the lash line.',
        },
        {
          treatment: 'Hyaluronic Acid Filler',
          description: 'For hollow under-eye areas, a cosmetic procedure. Not a home remedy — consult a board-certified dermatologist.',
          timeline: 'Immediate effect, lasts 12–18 months',
        },
        {
          treatment: 'Cold Potato Compress',
          description: 'Potato contains catecholase, an enzyme with mild brightening properties. Grate raw potato, strain juice, soak cotton pad, apply for 15 minutes.',
          timeline: 'Regular use over 6–8 weeks may show mild improvement',
          
        },
      ],
    },
    kajalGuide: {
      styles: [
        {
          name: 'Classic Waterline',
          description: 'Kajal on inner waterline only — the foundational South Asian eye look. Darkens the eyes and makes whites appear brighter.',
          technique: 'Pull lower lid gently down. Apply kajal stick directly to the pink inner waterline. Do upper waterline by looking down and rolling stick along the rim.',
        },
        {
          name: 'Smudged Kohl',
          description: 'Kajal on waterline then smudged outward along the lash line for a lived-in smoky look.',
          technique: 'Apply as above. Use a smudge brush or fingertip to blend outward immediately before it sets.',
        },
        {
          name: 'Full Surma Line',
          description: 'Kajal extended from inner corner to outer corner with a slight flick. The classic South Asian bridal eye beginning.',
          technique: 'Apply waterline kajal. Extend along outer lower lash line. Flick slightly upward at outer corner.',
        },
        {
          name: 'Dramatic Cat Eye Base',
          description: 'Kajal as the base under eyeshadow and winged liner for full South Asian bridal or festive look.',
          technique: 'Apply heavy kajal to waterline. Blend onto lid. Build eyeshadow on top. Add sharp wing with liquid liner over kajal base.',
        },
      ],
    },
    lashBeauty: {
      naturalLashCare: ['Castor oil on lash roots nightly', 'Bhringraj oil application for growth', 'Avoid lash curler on dry lashes', 'Vitamin H (biotin) supplementation'],
      culturalNote: 'Full, long lashes are central to the South Asian beauty ideal — "eyes like a doe" (hiran jaisi aankhen) is a common compliment in poetry and song. Lash extension culture is very popular.',
    },
  },

  'caribbean': {
    communityId: 'caribbean',
    communityName: 'Caribbean',
    eyeBeautyPhilosophy: 'Caribbean eye beauty is expressive, joyful, and vibrant. Waterproof formulas are essential in the tropical climate. Natural lash beauty is prized, and bright pops of color on the lid — corals, turquoises, golds — celebrate the energy of island life.',
    commonConcerns: [
      'Sun-related under-eye hyperpigmentation from outdoor lifestyle',
      'Puffiness from heat and humidity',
      'Eye strain and redness from bright sunlight without proper UV eye protection',
      'Dark circles from iron deficiency or genetic factors',
      'Mascara migration in humid conditions',
    ],
    traditionalPractices: [
      {
        name: 'Aloe Vera Eye Compress',
        description: 'Fresh aloe vera gel applied around the eye area for cooling, soothing, and reducing puffiness. Caribbean aloe plants are abundant and widely used for all beauty concerns.',
        method: 'Cut an aloe vera leaf. Scoop out the clear gel. Apply a thin layer around (not in) the eye area. Leave for 15–20 minutes. Rinse with cool water.',
        caution: 'Do not apply in eyes. Aloe is generally well tolerated but patch test for those with sensitive skin.',
      },
      {
        name: 'Cucumber Slice Compress',
        description: 'The classic Caribbean grandmother remedy. Chilled cucumber slices reduce puffiness through their water content and mild anti-inflammatory properties.',
        method: 'Refrigerate cucumber slices for 30+ minutes. Lie down. Apply one slice over each closed eye for 15 minutes.',
      },
      {
        name: 'Coconut Oil Eye Treatment',
        description: 'Pure Caribbean coconut oil (often pressed locally) used as a gentle eye makeup remover and overnight moisturizer for the orbital area.',
        method: 'Apply 2–3 drops to a cotton pad. Gently sweep over closed eye to remove mascara and liner. Follow with a water-based cleanser to prevent excess oiliness.',
      },
    ],
    waterproofMakeupGuide: {
      essentials: [
        'Waterproof mascara — non-negotiable in tropical climates',
        'Long-wear eyeliner pen (felt tip) over pencil — doesn\'t smudge in heat',
        'Waterproof eyeshadow primer',
        'Setting spray with humidity-resistance claim',
      ],
      topFormulas: [
        'Too Faced Better Than Sex Waterproof Mascara',
        'Urban Decay All-Nighter Setting Spray',
        'NYX Professional Epic Ink Liner',
        'Mac Prep + Prime Eye',
      ],
      removalNote: 'Waterproof formulas require an oil-based or micellar remover. Rubbing dry causes lash breakage.',
    },
    colorfulEyeLooks: {
      inspiration: 'Caribbean eye looks embrace color fearlessly — inspired by ocean blues, sunset oranges, tropical foliage greens, and flower pinks.',
      looks: [
        {
          name: 'Caribbean Sunset',
          colors: ['Burnt orange lid', 'Deep coral crease', 'Gold inner corner', 'Coral-nude lip'],
          technique: 'Pack orange shadow on lid. Blend a deeper coral into the crease. Add gold to inner corner. Smudge warm brown on lower lash line.',
        },
        {
          name: 'Ocean Blue',
          colors: ['Teal lid', 'Deep navy crease', 'Silver inner corner', 'Nude glossy lip'],
          technique: 'Apply teal all over lid. Deepen outer corner with navy. Highlight inner corner with silver. Keep lips minimal for balance.',
        },
        {
          name: 'Tropical Neutral',
          colors: ['Champagne lid', 'Warm brown crease', 'Gold liner on waterline', 'Coral lip'],
          technique: 'A wearable everyday option — champagne base, soft brown definition, gold waterline for warmth. Pairs with any bold lip.',
        },
      ],
    },
    sunProtectionForEyes: {
      importance: 'Caribbean outdoor lifestyle means high UV exposure. Sun damage to the skin around the eyes (crows feet, hyperpigmentation, lid discoloration) accumulates over years.',
      tips: [
        'Wear UV-blocking sunglasses that wrap around the eye — not just fashion sunglasses',
        'Look for SPF in eye cream formulas',
        'Wear a hat with a brim during beach or outdoor time',
        'Apply sunscreen to orbital bone (above cheekbone) as part of daily routine',
        'Cat-eye or large lenses offer best UV coverage',
      ],
    },
  },

  'arab': {
    communityId: 'arab',
    communityName: 'Arab Middle Eastern',
    
    commonConcerns: [
      'Dark circles from genetic periorbital pigmentation',
      'Dehydration-related dark circles in dry Middle Eastern climates',
      'Puffiness from dietary habits (dates, salty foods)',
      'Fine lines from harsh sun exposure in desert climates',
      'Eyelid hyperpigmentation from chronic rubbing or inflammation',
    ],
    traditionalPractices: [
      {
        name: 'Kohl (Al-Kohl / Surma)',
        description: 'Kohl has been used across the Arab world since ancient times. Egyptian, Gulf, Levantine, and North African traditions all have their own kohl preparation methods. In Islamic tradition, hadith report that the Prophet Muhammad recommended kohl (ithmid) from antimony stone.',
        types: [
          {
            type: 'Ithmid (Antimony Kohl)',
            origin: 'Arabian Peninsula / Islamic tradition',
            description: 'Made from ground antimony stone. Considered the most authentic Islamic kohl. Silver-gray metallic color. Used on inner waterline.',
            safety: 'Ithmid is antimony-based rather than lead-based, but products sold as kohl have been found to contain lead, and antimony is not risk-free either. Only use products that list their ingredients and are sold legally as cosmetics where you live, and never use kohl on children.',
          },
          {
            type: 'Homemade Soot Kohl',
            origin: 'Pan-Arab',
            description: 'Made by burning certain materials (almond shells, sesame oil, specific incenses) and collecting the soot mixed with castor oil or animal fat.',
            safety: 'Lead contamination risk in some homemade preparations. Test products if possible.',
          },
          {
            type: 'Commercial Kohl Pencil',
            origin: 'Modern',
            description: 'Carbon-based, lead-free, cosmetic-grade kohl pencils. Safe for daily use and available in the traditional soft-smudge finish.',
            recommendation: 'NYX Jumbo Eye Pencil, MAC Eye Kohl, Kaja Wink Stamp Liner for waterline-safe options.',
          },
        ],
        applicationMethods: [
          {
            method: 'Inner Waterline (Al-Marwad)',
            description: 'The traditional application — a thin kohl stick inserted along the inner waterline of both upper and lower lids. Creates the characteristic deep, dark intensity.',
          },
          {
            method: 'Elongated Wing',
            description: 'Kohl extended past the outer corner with a slight upward tail. Creates the iconic almond-elongated Arab eye look.',
          },
          {
            method: 'Smudged Lower Lash',
            description: 'Kohl on lower waterline then smudged down onto the lower lash line for a diffused smoky effect.',
          },
        ],
      },
      {
        name: 'Rose Water Eye Compress',
        description: 'Rose water (ma\' al-ward) is central to Arab beauty tradition. Used as an eye compress, toner, and refresher, it has documented anti-inflammatory properties.',
        method: 'Soak cotton pads in chilled high-quality rose water. Apply to closed eyelids for 10–15 minutes. Can be done daily.',
        quality: 'True rose water (not synthetic rose fragrance water) has the most benefit. Turkish, Moroccan, and Lebanese rose waters are the most authentic.',
      },
      {
        name: 'Argan Oil Eye Treatment',
        description: 'Moroccan argan oil applied to the orbital area as an overnight eye treatment. High in vitamin E and essential fatty acids.',
        method: 'Apply 1–2 drops to ring fingertip. Pat gently around orbital bone — not on eyelid. Leave overnight.',
      },
      {
        name: 'Oud Smoke Eye Ritual',
        description: 'In Gulf traditions, burning oud (agarwood) and holding the face over the smoke has been used as a beauty ritual that infuses hair and sometimes the eye area with a deep, sensual scent. This is primarily a perfuming tradition, not a skincare practice.',
        note: 'Smoke exposure to eyes can cause irritation — this tradition is more about hair/overall fragrance than direct eye treatment.',
      },
    ],
    eyeShapeCharacteristics: {
      commonShapes: ['Almond', 'Large', 'Deep-set in some communities', 'Slightly hooded'],
      makeupTips: [
        'Almond eyes: any technique works — most versatile shape',
        'Large eyes: frame fully with liner all the way around for maximum drama',
        'Deep-set eyes: use light shimmer on lid, darker in crease to recede it',
        'Hooded: line above the crease so liner shows when eyes are open',
      ],
    },
    signatureArabicEyeLooks: [
      {
        name: 'Classic Kohl Rim',
        description: 'The foundational Arab eye look. Kohl on all four waterlines, extended to a slight tail at the outer corner.',
        products: ['Kohl pencil', 'Mascara', 'Setting powder to prevent transfer'],
      },
      {
        name: 'Smoky Kohl Drama',
        description: 'Heavy kohl application smudged outward into a diffused smoky shape. Most popular at weddings and celebrations.',
        products: ['Kohl pencil', 'Black eyeshadow for blending', 'Champagne inner corner', 'False lashes'],
      },
      {
        name: 'Gilded Eye',
        description: 'Gold or bronze shimmer on the lid with kohl rimming. An elevated celebration look inspired by ancient Arab aesthetic.',
        products: ['Gold loose pigment or pressed shadow', 'Kohl liner', 'Bronze blush'],
      },
    ],
  },

  'latina': {
    communityId: 'latina',
    communityName: 'Latina',
    eyeBeautyPhilosophy: 'Latina eye beauty is passionate and expressive. From the iconic arrowed liner of Mexican beauty to the dramatic smoky eyes of telenovela stars, eyes are used to communicate depth and feeling. Natural full lashes are celebrated. Colors are embraced boldly or elegantly depending on the occasion.',
    commonConcerns: [
      'Dark circles from genetic factors and olive-to-medium skin undertones',
      'Sensitivity in the eye area from hormonal fluctuations',
      'Mascara creasing on warm humid skin',
      'Lash loss from rubbing or harsh removal',
      'Under-eye fine lines from sun exposure',
    ],
    traditionalPractices: [
      {
        name: 'Manzanilla (Chamomile) Eye Compress',
        description: 'Chamomile tea compress is a beloved Latin American grandmother remedy for tired, puffy, or irritated eyes. Chamomile has documented anti-inflammatory and mild antibacterial properties.',
        recipe: 'Steep two chamomile tea bags in hot water for 5 minutes. Let cool to warm temperature. Apply the tea bags directly to closed eyes for 10–15 minutes, or soak cotton pads.',
        tradition: 'This remedy is passed down through generations in Mexico, Colombia, Argentina, and beyond. Every abuela has her chamomile tea compress.',
      },
      {
        name: 'Aloe Vera (Sábila) Eye Treatment',
        description: 'Fresh aloe gel from the sábila plant applied around the eye area. Used throughout Latin America for its cooling, anti-inflammatory, and moisturizing properties.',
        method: 'Extract gel from a fresh aloe leaf. Apply gently to the orbital area and upper cheek. Allow to absorb for 20 minutes. Rinse.',
      },
      {
        name: 'Aceite de Almendra (Almond Oil)',
        description: 'Sweet almond oil as an overnight eye treatment and makeup remover. A traditional Latin beauty staple for soft, nourished skin around the eyes.',
        uses: ['Makeup removal (including waterproof mascara)', 'Nightly eye area moisturizer', 'Lash conditioning'],
      },
    ],
    eyeShapeCharacteristics: {
      commonShapes: ['Almond', 'Round', 'Wide-set', 'Downturned'],
      makeupTips: [
        'Round eyes: extend liner outward and upward for elongation',
        'Wide-set: concentrate pigment on inner third of eye',
        'Downturned: lift outer corner with liner',
        'Almond: versatile — any look works',
      ],
    },
    iconicLatinaEyeLooks: [
      {
        name: 'Classic Cat Eye',
        description: 'Sharp black liquid liner wing. The definitive Latina beauty signature — from Sofía Vergara to Selena Quintanilla.',
        technique: 'Draw upper lash line from inner corner outward. At outer corner, draw a line extending toward the tail of the brow. Fill in the triangle. Use tape as a guide for a sharp edge.',
        products: ['Liquid liner pen', 'Cotton swabs for correction', 'Black eyeshadow to set'],
      },
      {
        name: 'Warm Smoky Eye',
        description: 'Deep bronze, copper, or burgundy smoky eye. Celebratory and romantic — popular at quinceañeras, weddings, and events.',
        technique: 'Pack warm bronze on lid. Blend a deeper burgundy into the crease. Add gold to inner corner. Smoke out lower lash line with brown.',
        products: ['Warm eyeshadow palette', 'Blending brushes', 'Shimmer shadow for lid', 'Matte for crease'],
      },
      {
        name: 'Telenovela Glam',
        description: 'Full lash, bold liner, cut crease. The dramatic eye look of Latin soap opera stars — fully contoured and photogenic.',
        technique: 'Cut crease with concealer. Apply bold shimmer to inner 2/3 of lid. Deep shade in crease. Strong liner. Full false lashes.',
      },
    ],
    lashTradition: {
      note: 'Full, long lashes are central to the Latina beauty aesthetic. Mascara is considered non-optional for many Latina women even in minimal makeup routines.',
      caseyTip: 'Apply mascara to upper lashes while looking down into a mirror for even coverage. Use a spoolie between coats to prevent clumping.',
      growthTips: ['Castor oil nightly', 'Coconut oil removal (never rub)', 'Biotin supplement', 'Avoid eyelash curler daily use'],
    },
  },

  'east-asian': {
    communityId: 'east-asian',
    communityName: 'East Asian',
    eyeBeautyPhilosophy: 'East Asian eye beauty is nuanced, sophisticated, and deeply tied to cultural shifts in aesthetic philosophy. Traditional ideals celebrated the natural monolid as elegant. K-beauty and J-beauty have created entirely new eye makeup languages — gradient lids, puppy liner, glass skin around the eye — while traditional beauty culture (hanbok, kimono, cheongsam era) used precise, minimal eye artistry. Both are valid and beautiful.',
    commonConcerns: [
      'Monolid — creating the illusion of a lid crease without surgery',
      'Inner epicanthal fold — liner placement requires specific technique',
      'Ptosis (drooping lid) — common in some East Asian populations',
      'Delicate skin around eyes prone to fine lines',
      'Waterline visibility — inner waterline can be narrow',
    ],
    traditionalPractices: [
      {
        name: 'Green Tea Eye Compress',
        description: 'Green tea bags chilled and applied to eyes. Green tea catechins and caffeine reduce puffiness and provide antioxidant benefit. Central to Japanese and Korean morning rituals.',
        method: 'Steep green tea bags. Refrigerate for 20–30 minutes. Apply to closed eyes for 10 minutes. Follow with eye cream.',
        scienceBasis: 'EGCG (epigallocatechin gallate) in green tea has anti-inflammatory and UV-protective properties.',
      },
      {
        name: 'Rice Water Eye Treatment',
        description: 'Fermented rice water pat-down on the under-eye area. East Asian women have used fermented rice water for centuries for brightening skin.',
        method: 'Ferment rice water for 24–48 hours. Strain. Pour a small amount onto cotton pad. Pat gently under eyes and on orbital area. Leave on.',
        benefit: 'Inositol in fermented rice water repairs skin barrier and improves brightness.',
      },
      {
        name: 'Jade Roller Eye Massage',
        description: 'Chilled jade or rose quartz roller used around the eye contour for lymphatic drainage and depuffing.',
        method: 'Refrigerate jade roller. Apply a drop of eye serum or oil. Roll outward from inner corner to temple. Roll downward on under-eye. Repeat 3–5 times each side.',
        frequency: 'Daily in the morning for consistent lymphatic benefit.',
      },
      {
        name: 'Pearl Powder Eye Treatment',
        description: 'Pearl powder (zhenzhu fen) mixed with rose water as a brightening under-eye treatment. An ancient Chinese imperial beauty secret.',
        method: 'Mix a pinch of food-grade pearl powder with enough rose water to make a thin paste. Apply under eyes. Leave 10 minutes. Rinse gently.',
        scienceBasis: 'Pearl powder contains conchiolin, calcium, and amino acids — some have documented skin-brightening properties.',
      },
    ],
    monoeyelidMakeupTechniques: {
      definitionNote: 'Monolid (or small crease) is a beautiful eye shape common in East Asian populations. It does not need to be changed — it simply requires different technique than double-lid tutorials assume.',
      techniques: [
        {
          name: 'Puppy Liner',
          description: 'Popular K-beauty technique. Liner extends slightly downward at the outer corner (opposite of a cat eye). Creates a youthful, soft, innocent look.',
          steps: [
            'Line upper lash line from inner to outer corner',
            'At the outer corner, angle the liner slightly downward instead of up',
            'Apply lower liner on outer third of lower lash line connecting to the dropped tail',
          ],
        },
        {
          name: 'Doubling Tape',
          description: 'Eyelid tape or glue creates a temporary double lid crease. Widely used in East Asian beauty routines.',
          types: ['Mesh tape (invisible)', 'Clear tape strips', 'Eyelid glue'],
          application: 'Place above existing lash line at desired crease point. Press with a thin stick. Apply eyeshadow over to blend the edge.',
          perspective: 'This is a valid personal choice. Both monolid and double lid are beautiful. Tape is a cosmetic tool like any other.',
        },
        {
          name: 'Gradient Shadow',
          description: 'Shadow concentrated at the lash line and fading upward — not placed in a crease. Creates the illusion of depth without requiring a crease.',
          technique: 'Apply darkest shade only at the lash line. Blend a medium shade above. Leave the upper lid clean or with a very sheer shimmer.',
        },
        {
          name: 'Tight-line Liner',
          description: 'Liner applied on the upper waterline (tight-lining) only. This makes lashes appear fuller and thicker without an obvious liner look.',
          technique: 'Push liner against the base of upper lashes on the waterline. Use a pencil (not liquid) for this technique.',
        },
      ],
    },
    kBeautyEyeCare: {
      philosophy: 'K-beauty eye care philosophy centers on prevention, hydration, and multi-step care. The eye is treated as the most delicate zone.',
      products: [
        {
          type: 'Eye Serum',
          function: 'Light fluid treatment with active ingredients — caffeine, peptides, or niacinamide',
          usage: 'Morning and night, applied before eye cream',
          topPicks: ['COSRX Advanced Snail Peptide Eye Cream', 'Some By Mi Eye Serum'],
        },
        {
          type: 'Eye Cream',
          function: 'Occlusive layer to lock in serum and provide barrier support',
          usage: 'Morning and night, applied after serum',
          topPicks: ['Laneige Water Bank Eye Gel', 'IOPE Retinol Eye Cream'],
        },
        {
          type: 'Eye Patches / Masks',
          function: 'Concentrated treatment with hyaluronic acid, collagen, or gold',
          usage: '2–3x per week, 10–20 minutes under eye',
          topPicks: ['Mediheal N.M.F. Eye Patches', 'Jayjun Eye Gel Patches'],
        },
      ],
    },
  },

  'east-african': {
    communityId: 'east-african',
    communityName: 'East African',
    eyeBeautyPhilosophy: 'East African eye beauty is powerful and striking. Deep-set, wide-set, or almond eyes on ebony to warm brown skin have inspired centuries of artistic admiration across the world. Kohl is central to Somali, Swahili, and Ethiopian beauty traditions. The eyes are expressive, dramatic, and often minimally adorned to let their natural beauty lead.',
    commonConcerns: [
      'Hyperpigmentation on upper eyelids (common in darker skin tones)',
      'Dark circles appearing as deep blue-black or purple undertone',
      'Dryness and sensitivity from desert or highland climates',
      'Eye strain in regions with limited artificial lighting',
      'Lash damage from harsh products not designed for African hair texture',
    ],
    traditionalPractices: [
      {
        name: 'Kohl (Kuhl / Surma)',
        description: 'East African kohl traditions are diverse. Somali kohl (applied daily to inner waterline) is a deep cultural and religious practice. Ethiopian women use kohl for beauty and in some communities as a spiritual protective application.',
        communityVariations: {
          somali: 'Daily kohl application is part of Somali feminine identity. Applied to both upper and lower waterlines. Mothers apply a dot of kohl to newborns as a protective charm.',
          ethiopian: 'Kohl combined with eye shading techniques. Formal occasions feature elaborate eye decoration.',
          swahili: 'Kohl applied for beauty and as part of coastal Islamic tradition.',
        },
      },
      {
        name: 'Castor Oil Eye and Lash Treatment',
        description: 'Pure castor oil (ricinoleic acid) applied to lash roots for growth and to the orbital area for moisturizing. Used across East Africa as a versatile beauty oil.',
        method: 'Dip clean spoolie into castor oil. Apply to lash roots before sleep. Apply a drop to orbital bone with ring finger for moisturizing.',
        results: 'Lash thickening visible in 6–8 weeks with consistent nightly use.',
      },
      {
        name: 'Coffee Ground Eye Mask',
        description: 'Ethiopian coffee grounds mixed with a small amount of honey and applied around the eye area. Caffeine in coffee reduces puffiness and temporarily brightens dark circles.',
        recipe: 'Mix 1 tsp fine coffee grounds with 1 tsp honey. Apply carefully around (not close to) the eye area. Leave 10–15 minutes. Rinse gently.',
        caution: 'Keep coffee grounds away from the eye itself. The abrasive nature of grounds is not for use on eyelid skin.',
      },
      {
        name: 'Neem and Shea Eye Treatment',
        description: 'A few drops of neem oil mixed into shea butter, applied to the orbital area. Both ingredients are East African beauty staples with established skin benefits.',
        method: 'Warm a small amount of shea butter. Add 1–2 drops neem oil. Apply around the orbital bone before sleep.',
      },
    ],
    eyeShapeCharacteristics: {
      commonShapes: ['Wide-set', 'Deep-set', 'Almond', 'Prominent browbone'],
      makeupTips: [
        'Wide-set eyes: bring dark shade toward inner corner to create closeness',
        'Deep-set eyes: highlight the brow bone and lid to bring eyes forward',
        'Almond: any technique — this shape is the most versatile',
        'Prominent browbone: shade just below the brow to visually reduce projection',
      ],
    },
    signatureEyeLooks: [
      {
        name: 'East African Kohl',
        description: 'Heavy kohl on all four waterlines, extended past outer corners. The definitive East African eye look.',
        products: ['Soft kohl pencil', 'Castor oil on lash line for blending', 'Mascara'],
      },
      {
        name: 'Golden Desert',
        description: 'Deep gold shimmer on lid with kohl liner. Inspired by East African desert landscapes and gold jewelry traditions.',
        products: ['Deep gold or copper shadow', 'Kohl liner', 'Individual lash clusters'],
      },
    ],
  },

  'south-african': {
    communityId: 'south-african',
    communityName: 'South African',
    eyeBeautyPhilosophy: 'South African eye beauty blends the bold traditions of Southern African cultures with the sophistication of a globally cosmopolitan beauty scene. Zulu, Xhosa, and Sotho beauty traditions each have distinct eye decoration practices. Modern South African beauty culture is internationally influenced, trend-forward, and celebrates all expressions from natural to full glam.',
    commonConcerns: [
      'Hyperpigmentation on lids and under-eye from sun exposure',
      'Dark circles from genetic factors',
      'Sensitivity and dryness in dry highveld climate (Johannesburg)',
      'Puffiness from high-altitude living',
      'Lash care for textured hair lash profiles',
    ],
    traditionalPractices: [
      {
        name: 'Rooibos Eye Compress',
        description: 'Rooibos tea (indigenous to South Africa) brewed and used as an eye compress. Rich in antioxidants, anti-inflammatory compounds, and vitamin C.',
        method: 'Brew rooibos tea bags. Cool completely. Refrigerate if possible. Apply chilled tea bags to closed eyes for 10–15 minutes.',
        southAfricanPride: 'Rooibos is one of South Africa\'s great gifts to the world. Using it in beauty is a beautiful act of local pride.',
      },
      {
        name: 'Marula Oil Eye Treatment',
        description: 'Marula oil (from the marula fruit, indigenous to Southern Africa) applied to the orbital area. Rich in antioxidants and oleic acid.',
        method: 'Apply 1–2 drops to ring finger. Pat gently around the eye contour. Leave on as an overnight treatment.',
        uniqueProperty: 'Marula oil is quickly absorbed and non-comedogenic — ideal for the delicate eye area.',
      },
      {
        name: 'Aloe Ferox Eye Gel',
        description: 'Aloe ferox (Cape aloe, indigenous to South Africa) gel applied to the eye area. More potent than aloe vera for anti-inflammatory and brightening purposes.',
        method: 'Apply a thin layer of aloe ferox gel around the eye contour. Allow to dry. Follow with eye cream.',
      },
    ],
    urbanBeautyTrends: {
      johannesburg: 'High-fashion, editorial, and bold. Jo\'burg eye looks draw from both traditional African aesthetics and global high-fashion.',
      capeTown: 'Sun-kissed, natural, and bohemian. Cape Town beauty embraces natural lashes, minimal liner, and a sun-kissed glow.',
      durban: 'Vibrant and expressive, influenced by the Indian Ocean coastal culture and significant South Asian community in KZN.',
    },
    eyeLooksInspiredByCulture: [
      {
        name: 'Ubuntu Smoky',
        description: 'Rich deep earth-tone smoky eye — clay, ochre, burgundy — inspired by traditional Southern African pigment aesthetics.',
        colors: ['Deep ochre', 'Clay brown crease', 'Black outer corner', 'Gold inner corner'],
      },
      {
        name: 'Cape Town Natural',
        description: 'Barely-there eye with a hint of bronze shimmer and defined lashes.',
        colors: ['Champagne lid', 'Soft taupe crease', 'Mascara only liner', 'Rose nude lip'],
      },
    ],
  },

  'black-american': {
    communityId: 'black-american',
    communityName: 'Black American',
    eyeBeautyPhilosophy: 'Black American eye beauty is a story of artistry, innovation, and cultural pride. From Josephine Baker\'s dramatic kohl-rimmed eyes to modern-day MUAs pushing the boundaries of eye art on deep melanin-rich skin, this community has continually shaped global beauty trends. Natural lashes, lash extensions, elaborate shadow art, and graphic liner are all celebrated. Eye looks range from "slay for the gods" full glam to effortless natural girl.',
    commonConcerns: [
      'Dark circles with blue-black or purple appearance on deep skin',
      'Lid hyperpigmentation from inflammation or allergic reactions',
      'Lash breakage from repeated waterproof mascara use',
      'Under-eye hollows causing shadow that reads as dark circles',
      'Eyelid texture from heavy makeup use without proper prep',
    ],
    traditionalPractices: [
      {
        name: 'African Black Soap Eye Makeup Removal',
        description: 'Authentic African black soap lather used as a gentle but effective eye makeup remover. Avoids the harsh preservatives in commercial removers that can cause reactions on sensitive Black skin.',
        method: 'Work a small amount of black soap into a light lather. Close eye. Gently wipe with a damp cloth. Rinse thoroughly. Follow with a nourishing eye cream.',
        caution: 'Avoid getting lather directly in the eye. Black soap is alkaline — some find it irritating. Rinse thoroughly.',
      },
      {
        name: 'Castor Oil Lash Treatment',
        description: 'Jamaican black castor oil on lash roots is a cornerstone of Black American beauty culture. Passed through generations for lash growth and conditioning.',
        method: 'Load a clean mascara wand or spoolie with JBCO. Apply to lash roots before sleep. Remove in the morning during regular cleansing.',
        science: 'Ricinoleic acid in castor oil has documented prostaglandin-like effects. Clinical evidence is limited but anecdotal support is extensive and consistent.',
        timeline: '6–8 weeks for visible lash thickening.',
      },
      {
        name: 'Shea and Vitamin E Eye Cream',
        description: 'DIY eye treatment of unrefined shea butter and vitamin E oil. A classic Black American beauty tradition for treating dark circles and fine lines at home.',
        recipe: 'Warm 1 tbsp unrefined shea butter. Add 3–4 drops vitamin E oil. Add optional 1 drop lavender EO. Mix and cool. Apply nightly to the eye area.',
      },
    ],
    eyeShapeCharacteristics: {
      communityNote: 'Black American women represent an enormous variety of eye shapes — almond, round, deep-set, monolid, hooded, and wide. There is no single "Black eye shape." Technique recommendations vary by individual shape.',
      shapeGuide: [
        'Almond: most versatile — any technique',
        'Round: elongate with extended liner',
        'Deep-set: light shimmer on lid, darker in crease',
        'Hooded: liner above the crease',
        'Wide-set: concentrate inner corner',
        'Monolid: tight-line, gradient, or puppy liner techniques',
      ],
    },
    iconicBlackAmericanEyeLooks: [
      {
        name: 'The Classic Glam',
        description: 'Full cut crease, dramatic lashes, bold liner. The signature Black American glam eye look.',
        technique: 'Cut crease with concealer on the crease line. Apply shimmer to lid. Dark matte in crease. Graphic liner. Full false lashes.',
        icons: ['Inspired by MUA legends of the Black beauty community'],
      },
      {
        name: 'Harlem Renaissance Eye',
        description: 'Smudged kohl, arched brow, matte lid with a sheen. Inspired by the glamour of 1920s and 30s Harlem.',
        technique: 'Soft kohl all around. Matte deep brown on lid. Sheen at center of lid. Defined arched brow.',
      },
      {
        name: 'Soft Life Eye',
        description: 'Natural, glowy, effortless. Brown mascara, nude shimmer lid, fluffy brows. The modern Black American soft aesthetic.',
        technique: 'Primer. Soft beige or nude-bronze shadow all over. Brown mascara. Clear brow gel. Dewy skin-first.',
      },
      {
        name: 'Graphic Liner Art',
        description: 'Freehand liner art — graphic shapes, floating liner, geometric cuts — a distinctly Black American MUA-driven trend.',
        technique: 'Use a fine-tip liquid liner. Sketch design first with an eye pencil. Trace with liquid liner. Remove guide marks.',
      },
    ],
    concealingDarkCircles: {
      colorCorrectionGuide: {
        deepEbony: 'Orange or red corrector — neutralizes the blue-black cast. Then medium-to-full coverage concealer.',
        deepBrown: 'Peach-orange corrector. Then warm-toned concealer.',
        warmBrown: 'Peach corrector. Then warm concealer.',
        application: 'Apply corrector first with a damp sponge. Let dry. Pat concealer on top. Set with loose translucent or banana powder.',
      },
      topConcealers: [
        'Fenty Beauty Pro Filt\'r Instant Retouch Concealer (extensive deep shade range)',
        'Danessa Myricks Yummy Skin Blurring Balm Powder',
        'Black Up Correcteur Teinte Concealer',
        'Pat McGrath Labs Skin Fetish Concealer',
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// EYE HEALTH GUIDE — UNIVERSAL + COMMUNITY SPECIFIC
// ─────────────────────────────────────────────────────────────────────────────

export const EYE_HEALTH_GUIDE = {
  universalEyeHealth: {
    dailyHabits: [
      'Remove all eye makeup before sleep — every single night',
      'Never sleep in contact lenses',
      'Replace mascara every 3 months (bacteria breeding ground)',
      'Clean makeup brushes used on eyes weekly',
      'Use separate applicators for each eye to prevent cross-contamination',
      'Never share eye products or applicators',
      'Wear UV-blocking sunglasses outdoors — UV damage to eyes and periorbital skin is cumulative',
      'Take screen breaks: 20-20-20 rule (every 20 min, look 20 ft away, for 20 sec)',
    ],
    hygieneRules: [
      'Replace eye makeup every 3–6 months',
      'Discard all eye products after an eye infection',
      'Clean false lash bands before reuse',
      'Wash hands before touching eyes or applying eye makeup',
      'Sanitize eyeshadow pans that have been used during illness',
    ],
    redFlags: [
      'Persistent redness that doesn\'t resolve',
      'Pain or pressure behind the eyes',
      'Sudden changes in vision',
      'Yellow discharge',
      'Extreme light sensitivity',
      'A new growth on or near the eyelid',
    ],
  },

  screenTimeEyeCare: {
    title: 'Digital Eye Strain for all Communities',
    symptoms: ['Dry eyes', 'Burning', 'Headache behind eyes', 'Blurry vision after screen use', 'Difficulty focusing'],
    solutions: [
      'Blue light blocking glasses',
      'Screen brightness matching ambient light',
      '20-20-20 rule',
      'Lubricating eye drops (preservative-free)',
      'Humidifier in dry climate or office',
      'Position screen at or below eye level',
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function getEyeCareGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_EYE_CARE_GUIDES['west-african'],
    'south-asian': ETHNIC_EYE_CARE_GUIDES['south-asian'],
    'caribbean': ETHNIC_EYE_CARE_GUIDES['caribbean'],
    'arab': ETHNIC_EYE_CARE_GUIDES['arab'],
    'latina': ETHNIC_EYE_CARE_GUIDES['latina'],
    'east-asian': ETHNIC_EYE_CARE_GUIDES['east-asian'],
    'east-african': ETHNIC_EYE_CARE_GUIDES['east-african'],
    'south-african': ETHNIC_EYE_CARE_GUIDES['south-african'],
    'black-american': ETHNIC_EYE_CARE_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

