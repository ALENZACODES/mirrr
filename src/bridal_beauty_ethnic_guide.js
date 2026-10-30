/**
 * MIRRR — Bridal Beauty Multicultural Guide
 * Comprehensive wedding beauty traditions, rituals, and preparation guides
 * for all 9 ethnic communities. Covers pre-wedding rituals, day-of makeup,
 * hair traditions, attire beauty coordination, and cultural beauty symbolism.
 */

// ─────────────────────────────────────────────────────────────────────────────
// BRIDAL PREPARATION TIMELINES
// ─────────────────────────────────────────────────────────────────────────────

export const BRIDAL_PREP_TIMELINES = {
  'west-african': {
    communityId: 'west-african',
    communityName: 'West African',
    weddingStyles: ['Yoruba Traditional', 'Igbo Igba Nkwu', 'Akan Engagement', 'Ghanaian Knocking', 'Wolof Tuur'],
    timeline: {
      sixMonthsBefore: {
        label: '6 Months Before',
        tasks: [
          'Schedule bridal glow consultation with aesthetician',
          'Begin a vitamin C and niacinamide routine to fade dark marks (patch-test kojic acid if you use it)',
          'Start scalp nourishment treatments for protective style health',
          'Research gele tying styles — decide on one vs. two-change',
          'Begin shea butter and marula oil body regimen for luminous skin',
          'Consult on aso-oke fabric color to match skin undertone',
          'Book professional gele artist early — they fill fast',
          'Begin lash growth serum if desired for full lash look',
        ],
      },
      threeMonthsBefore: {
        label: '3 Months Before',
        tasks: [
          'Lock in bridal MUA with West African traditional expertise',
          'Trial gele styles 1 and 2 — photograph from all angles',
          'Begin bi-weekly professional facials for bridal skin prep',
          'Deep condition protective styles weekly with baobab oil masks',
          'Start body scrub ritual (sugar + shea) 2x weekly',
          'Nail care — begin cuticle oil routine and nail strengthening',
          'Test lip products for longevity — kolanut stain vs. pigment',
          'Confirm jewelry pieces: coral beads, gold, headpiece',
        ],
      },
      oneMonthBefore: {
        label: '1 Month Before',
        tasks: [
          'Full bridal hair and makeup trial day',
          'Photograph trial look in wedding lighting conditions',
          'Finalize skincare routine — no new actives after this point',
          'Schedule waxing or threading appointments',
          'Eyebrow shaping consultation and final shape decision',
          'Order all touch-up kit products (blotting, lipstick backup)',
          'Henna hand booking if incorporating sande or adornment tradition',
          'Confirm eyelash style with MUA',
        ],
      },
      oneWeekBefore: {
        label: '1 Week Before',
        tasks: [
          'Facial — gentle brightening, no harsh actives or peels',
          'Final brow threading or waxing',
          'Body scrub and shea deep moisture treatment',
          'Rest and hydration — 3L water daily minimum',
          'Nails done 3–4 days before for settling',
          'Sleep on silk pillowcase to protect skin barrier',
          'Avoid salty food and alcohol to prevent puffiness',
          'Lay out all bridal beauty items night before',
        ],
      },
      dayOf: {
        label: 'Day Of',
        tasks: [
          'Wake early — allow 4–5 hours for full traditional prep',
          'Cleanse, tone, moisturize with familiar products only',
          'Apply SPF if outdoor ceremony is planned',
          'Primer should be applied 15 minutes before foundation',
          'Gele tying is typically last step before departure',
          'Have coral or gold jewelry laid out in sequence of application',
          'Eat a proper breakfast — long ceremonies require fuel',
          'Carry touch-up kit: powder, lipstick, blotting, setting spray',
        ],
      },
    },
    preWeddingRituals: [
      {
        name: 'Shea Oil Immersion',
        tradition: 'Pan-West African',
        description: 'Full body slathering of raw unrefined shea butter mixed with a few drops of jasmine or ylang ylang oil the evening before the wedding. Left overnight under a wrap for maximum moisture penetration.',
        timing: 'Night before',
        products: ['Raw unrefined shea butter', 'Jasmine absolute oil', 'Ylang ylang EO', 'Warm towel wrap'],
      },
      {
        name: 'Ose Dudu (Black Soap) Cleanse',
        tradition: 'Yoruba',
        description: 'Ritual cleansing with traditional black soap (ose dudu) infused with osun (camwood) powder and honey. Believed to cleanse not just skin but to prepare the bride spiritually for her new journey.',
        timing: 'Morning of wedding',
        products: ['Authentic ose dudu', 'Osun (camwood) powder', 'Raw honey', 'Warm water'],
      },
      {
        name: 'Nzu Clay Preparation',
        tradition: 'Igbo',
        description: 'Nzu (white clay) mixed with water applied to palms, soles, and sometimes forehead as a mark of beauty and purity. Ancient Igbo bridal tradition adapted for modern ceremonies.',
        timing: 'Pre-ceremony',
        products: ['Nzu (white kaolin clay)', 'Rose water', 'Soft brush'],
      },
      {
        name: 'Camwood Body Paint',
        tradition: 'Various West African',
        description: 'Camwood (osun) paste applied to arms, décolletage, and shoulders for its natural reddish-brown pigmentation and skin-conditioning properties. Traditional bridal adornment.',
        timing: '2 hours before',
        products: ['Camwood paste', 'Carrier oil', 'Artist brush'],
      },
    ],
    makeupPhilosophy: 'West African bridal beauty celebrates maximalism done with precision. Rich, jewel-toned eye looks, statement lips in deep berry or bold red, and a foundation match that honors the full spectrum of deep melanin-rich skin tones. Luminosity is prized — the bride should glow as if lit from within. Full coverage that remains breathable through hours of celebration.',
    signatureElements: [
      'Bold kohled or smoked eyes in copper, gold, or plum',
      'Deep berry, wine, or classic red lip',
      'Structured contouring for defined cheekbones',
      'Highlight placed on inner corner, brow bone, cupid\'s bow',
      'Heavy-coverage foundation matched to undertone (warm yellow/red)',
      'Lashes — full and dramatic, individual or strip',
      'Brow definition — arched, strong, well-defined',
    ],
    hairTraditions: [
      {
        style: 'Gele',
        description: 'The iconic West African head wrap. Brides typically change gele 2–3 times during the celebration, each one styled differently. Aso-oke, damask, or netted silk fabrics are used. The shape, height, and bow placement signal region and family.',
        significance: 'Identity, family pride, elegance',
        stylingTip: 'Book a gele artist who specializes in the specific regional style of your tradition. Yoruba, Igbo, and Ghanaian geles differ significantly in technique.',
      },
      {
        style: 'Didi (Cornrows with Adornment)',
        description: 'Intricate cornrow patterns underneath the gele or worn as a standalone style. Gold thread, beads, and cowrie shells are woven in for adornment.',
        significance: 'Artisanal skill, cultural identity',
        stylingTip: 'Install 3–4 days before the wedding to allow the style to relax and shine naturally.',
      },
      {
        style: 'Knotless Braids with Jewelry',
        description: 'Long knotless braids adorned with gold cuffs, beads, and rings. Modern interpretation of traditional braided bridal hair.',
        significance: 'Contemporary elegance with cultural roots',
        stylingTip: 'Install 1–2 weeks before and refresh edges the morning of.',
      },
    ],
    jewelryAndAdornment: {
      corals: 'Coral beads are sacred in Yoruba culture — bridal coral sets (necklaces, headpiece, bracelets, earrings) are often family heirlooms passed down through generations.',
      gold: 'Gold jewelry signals prosperity and celebration. Choker layers, stackable bangles, and statement earrings are common.',
      headpieces: 'Beaded and jeweled headpieces worn at the front of the gele for Igbo traditions. Akan brides wear elaborate gold headpieces.',
      waistbeads: 'Waist beads worn close to the skin — a private adornment that symbolizes femininity and sensuality.',
    },
  },

  'south-asian': {
    communityId: 'south-asian',
    communityName: 'South Asian',
    weddingStyles: ['Hindu', 'Muslim Nikah', 'Sikh Anand Karaj', 'Christian', 'Jain', 'Buddhist'],
    timeline: {
      sixMonthsBefore: {
        label: '6 Months Before',
        tasks: [
          'Book Bridal Mehendi artist — top artists book 12+ months out',
          'Schedule derm consultation for bridal skin plan',
          'Begin vitamin C serum + SPF regimen for brightening',
          'Research lehenga/saree colors against your skin undertone',
          'Start hair oiling ritual weekly (bhringraj, amla, brahmi)',
          'Book bridal MUA with South Asian wedding experience',
          'Begin teeth whitening if desired',
          'Research eyebrow shaping specialists',
        ],
      },
      threeMonthsBefore: {
        label: '3 Months Before',
        tasks: [
          'Monthly brightening facials begin (vitamin C, kojic)',
          'Waxing schedule set (full body if desired)',
          'Trial makeup appointment — bring outfit fabric swatches',
          'Nail consultation and nail care plan',
          'Start sleeping with hair oiled for deeper conditioning',
          'Practice wearing heavy dupatta/veil — build neck muscle endurance',
          'Finalize bindi choice and placement',
        ],
      },
      oneMonthBefore: {
        label: '1 Month Before',
        tasks: [
          'Full bridal trial: makeup + hair + dupatta draping',
          'Final facial — gentle brightening, no actives after this',
          'Threading appointment for upper lip, brows, and chin',
          'Body polishing treatment for radiant skin',
          'Kajal and eye drops confirmed for comfort in long day',
          'Order backup lipstick shade and touch-up products',
          'Confirm Mehendi design and duration',
          'Rest nights begin — early to bed, 8h minimum',
        ],
      },
      dayOf: {
        label: 'Day Of',
        tasks: [
          'Allow 5–6 hours for full bridal prep',
          'Begin with hair set first if using heated styling',
          'Makeup begins after hair is set',
          'Nath (nose ring) fitting must be done before full makeup',
          'Heavy gold jewelry applied after makeup is set',
          'Setting spray is essential for longevity',
          'Professional photographer to capture getting-ready shots',
          'Carry powder, lipstick, kajal, and setting spray for touch-ups',
        ],
      },
    },
    preWeddingRituals: [
      {
        name: 'Haldi Ceremony',
        tradition: 'Hindu / Pan-South Asian',
        description: 'Application of turmeric paste (haldi) mixed with rose water, sandalwood powder, and sometimes chickpea flour to the bride\'s face, neck, arms, and legs. Applied by family and friends, this pre-wedding ritual is believed to bless and beautify. Turmeric can leave a temporary yellow tint, so patch-test the paste first.',
        timing: '1–2 days before wedding',
        products: ['Fresh turmeric powder', 'Rose water', 'Sandalwood powder', 'Chickpea flour (besan)', 'Raw honey', 'Milk'],
        beautyBenefits: ['Natural brightening', 'Anti-inflammatory', 'Evening skin tone', 'Antimicrobial', 'Soft glow'],
      },
      {
        name: 'Ubtan Application',
        tradition: 'North Indian / Pakistani',
        description: 'Ubtan (a paste of chickpea flour, turmeric, sandalwood, and milk) applied to the full body for exfoliation and brightening. Traditional bridal beauty secret used for centuries to achieve a luminous, even complexion.',
        timing: '3–7 days before (done daily)',
        products: ['Besan (chickpea flour)', 'Turmeric', 'Sandalwood powder', 'Milk', 'Rose water', 'Saffron'],
        beautyBenefits: ['Deep exfoliation', 'Brightening', 'Smoothing', 'Natural glow'],
      },
      {
        name: 'Mehendi (Henna) Application',
        tradition: 'Pan-South Asian (all religions)',
        description: 'Intricate henna designs applied to hands and feet the evening before the wedding. The depth of color achieved is traditionally said to indicate the strength of the husband\'s love. Full bridal mehendi can take 4–8 hours to apply.',
        timing: 'Night before wedding',
        products: ['Natural henna paste (must be natural, never black henna)', 'Lemon-sugar sealant', 'Clove smoke for darkening'],
        designStyles: ['Mughal (intricate)', 'Arabic (bold floral)', 'Pakistani (dense full coverage)', 'Indian (figurative patterns)', 'Modern minimal'],
      },
      {
        name: 'Coconut Oil Hair Masque',
        tradition: 'Pan-South Asian',
        description: 'Overnight coconut oil application to hair the night before, washed out in the morning with shikakai powder. Traditional method for achieving deep shine and manageability for bridal styling.',
        timing: 'Night before',
        products: ['Virgin coconut oil', 'Optional: brahmi powder', 'Warm towel', 'Shikakai for wash'],
      },
    ],
    makeupPhilosophy: 'South Asian bridal makeup is an art form unto itself. The look must be camera-ready under intense flash photography, survive outdoor ceremonies in varying weather, and transition from day to evening receptions. Foundation is typically airbrushed or heavily set for longevity. Eyes are the centerpiece — elaborate eye looks using rich pigments, glitter, cut crease technique, and dramatic lashes. The goal is glamour that reads both intimate and grand.',
    signatureElements: [
      'Kajal-rimmed eyes with inner corner gold highlight',
      'Cut crease or dramatic lid with glitter or shimmer',
      'Contoured nose for photography (common in traditional style)',
      'Strong brow definition — straight or arched depending on tradition',
      'Bindi placement — matching to outfit and occasion',
      'Nath (nose ring) — sized and styled appropriately',
      'Long-wear lipstick in deep red, berry, or mauve',
      'Setting spray applied in layers for 12+ hour longevity',
    ],
    hairTraditions: [
      {
        style: 'Juda with Gajra',
        description: 'Classic South Asian bridal bun adorned with fresh mogra (jasmine) or gajra flowers woven around the base. The floral scent is considered auspicious.',
        significance: 'Auspiciousness, femininity, fragrance',
        stylingTip: 'Order fresh gajra the morning of and have it applied by the MUA or hairstylist.',
      },
      {
        style: 'Dupatta Draping',
        description: 'The veil/dupatta is an integral beauty element — its placement, pinning, and fall transform the entire look. Different regional styles (Punjabi, Bengali, Gujarati) have distinct draping methods.',
        significance: 'Modesty, elegance, cultural identity',
        stylingTip: 'Practice dupatta draping with your stylist at the trial — it takes technique to maintain.',
      },
      {
        style: 'Maatha Patti (Headpiece)',
        description: 'Gold or kundan headpiece that drapes from the center parting down the forehead, often extending to earrings. Spectacular for photography.',
        significance: 'Bridal adornment, prosperity',
        stylingTip: 'The maatha patti is applied after hair is fully styled. Plan with stylist for attachment points.',
      },
    ],
    jewelryHighlights: {
      sets: 'Complete kundan, polki, or temple jewelry sets are traditional — necklace, earrings, tikka, haath phool (hand jewelry), bangles, anklets.',
      bangles: 'Red and gold bangles (chura) for Punjabi brides. Green bangles for Pakistani Muslim brides.',
      mangtikka: 'Tikka sits at the center parting — coordinate with maatha patti or wear independently.',
      nosering: 'Nath varies by region — large hoops for Maharashtra, smaller pins for South India.',
    },
  },

  'caribbean': {
    communityId: 'caribbean',
    communityName: 'Caribbean',
    weddingStyles: ['Christian Church', 'Outdoor Garden', 'Beach', 'Civil', 'Soca/Carnival-Inspired'],
    timeline: {
      sixMonthsBefore: {
        label: '6 Months Before',
        tasks: [
          'Sunscreen routine begins — Caribbean brides often marry outdoors',
          'Book MUA with expertise in humidity-proof bridal makeup',
          'Start brightening and evening skin tone treatments',
          'Research Caribbean-inspired floral crown options',
          'Begin deep conditioning hair treatments weekly',
          'Consult nail artist for gel or acrylic longevity in heat',
          'Book calypso or steel pan live music for beauty-forward entertainment',
          'Schedule air-dry curling routine practice for natural hair brides',
        ],
      },
      threeMonthsBefore: {
        label: '3 Months Before',
        tasks: [
          'Humidity-proof makeup trial — test in warm conditions if possible',
          'Natural hair braid-out, twist-out, or protective style trial',
          'Skin care consolidation — streamline to proven products',
          'Body moisturizing regimen with cocoa butter base',
          'Floral crown consultation and material selection',
          'Lip color testing for outdoor brightness and flash photography',
          'Brow consultation — natural full brow vs. defined arch',
          'Confirm dress color coordinates with skin undertone in daylight',
        ],
      },
      dayOf: {
        label: 'Day Of',
        tasks: [
          'Start early — heat sets in and preps become harder in afternoon',
          'Oil-free moisturizer and primer as base for humidity resistance',
          'Setting spray applied between each foundation step',
          'Natural hair: pineapple overnight, refresh with water + product',
          'Fresh flowers added to hair last before departure',
          'Carry facial mist, powder, and lipstick for outdoor touch-ups',
          'Avoid excessive fragrance — tropical heat intensifies scent',
          'Sunscreen reapplication plan for outdoor reception',
        ],
      },
    },
    preWeddingRituals: [
      {
        name: 'Cocoa Butter Immersion',
        tradition: 'Pan-Caribbean',
        description: 'Weeks of daily raw cocoa butter application to the body — particularly elbows, knees, décolletage, and arms. Caribbean mothers have used pure cocoa butter for generations to achieve the deep chocolate glow that reads beautifully in tropical light.',
        timing: 'Weeks to months before',
        products: ['Raw unrefined cocoa butter', 'Optional: coconut oil blend', 'Body brush for application'],
      },
      {
        name: 'Rice Water Hair Rinse',
        tradition: 'Trinidad, Barbados, Jamaica',
        description: 'Fermented rice water rinse applied to hair the week before. Known to strengthen, add shine, and reduce breakage. Traditional Caribbean beauty secret passed down through generations.',
        timing: 'One week before',
        products: ['Fermented rice water (1–3 days old)', 'Optional: hibiscus infusion', 'Spray bottle'],
      },
      {
        name: 'Aloe and Lime Skin Treatment',
        tradition: 'Jamaica and Eastern Caribbean',
        description: 'Fresh aloe vera gel applied to face and body to soothe and hydrate. Traditionally mixed with lime juice, which this guide leaves out: lime on skin can burn and leave dark marks when it meets sunlight.',
        timing: '2–3 times in the week before',
        products: ['Fresh aloe vera (cut from plant)', 'Warm water rinse'],
        caution: 'Patch-test fresh aloe first; some people react to the yellow sap under the skin of the leaf.',
      },
    ],
    makeupPhilosophy: 'Caribbean bridal beauty celebrates joy and vibrancy. The look can range from natural beachy glow to full glam depending on wedding style. For outdoor beach or garden weddings, humidity-proof formulas are essential. Skin must look luminous (not oily) even in heat. Bold tropical-inspired color on lips or eyes, or a sun-kissed glow look with bronzed and dewy skin — both are perfectly Caribbean.',
    signatureElements: [
      'Luminous bronzed glow foundation or sun-kissed dewy skin',
      'Waterproof mascara — essential for emotional outdoor ceremonies',
      'Tropical color options: coral, hibiscus pink, sunset orange lips',
      'Setting spray applied liberally and repeatedly',
      'Fresh flower hair accessories — hibiscus, bird of paradise, plumeria',
      'Gold jewelry that catches tropical light',
      'Bold brow — naturally full and groomed',
    ],
    hairTraditions: [
      {
        style: 'Natural Curls with Floral Crown',
        description: 'Wash-and-go or twist-out natural curls adorned with fresh tropical flowers. The ultimate Caribbean bridal look — effortless beauty in harmony with the environment.',
        significance: 'Natural beauty, island identity',
        stylingTip: 'Define curls with a lightweight cream, diffuse at low heat, and add flowers on the day.',
      },
      {
        style: 'Box Braids with Gold Cuffs',
        description: 'Long or shoulder-length box braids styled up or down, adorned with gold braiding rings and cuffs. Modern Caribbean bridal elegance.',
        significance: 'Heritage, versatility, longevity',
        stylingTip: 'Install 2 weeks before for natural look and refreshed edges.',
      },
      {
        style: 'Sleek Low Chignon',
        description: 'Classic formal option — sleek low bun with edges laid smooth and a statement floral accent or jeweled clip. Works beautifully for church and formal beach ceremonies.',
        significance: 'Elegance, formality',
        stylingTip: 'Use edge control gel + setting spray for humidity resistance throughout the day.',
      },
    ],
  },

  'arab': {
    communityId: 'arab',
    communityName: 'Arab Middle Eastern',
    weddingStyles: ['Traditional Arabic', 'Lebanese', 'Egyptian', 'Gulf (Khaleeji)', 'Moroccan', 'Palestinian', 'Syrian'],
    timeline: {
      sixMonthsBefore: {
        label: '6 Months Before',
        tasks: [
          'Book Khaleeji or Arabic beauty specialist MUA',
          'Begin oud and rose water skin treatments',
          'Laser hair removal sessions begin if desired',
          'Research kaf-al-asad (bridal henna) artist',
          'Consult on thobe / kaftan vs. white dress vs. color change options',
          'Begin eyebrow mapping consultation',
          'Start intensive hair care — Argan oil treatments weekly',
          'Book Hammam (Turkish bath) series',
        ],
      },
      threeMonthsBefore: {
        label: '3 Months Before',
        tasks: [
          'Full Arabic bridal makeup trial',
          'Hammam exfoliation and steam deep cleanse',
          'Book professional threading for brows, upper lip, full face',
          'Test waterproof eye makeup for longevity',
          'Kohl eyeliner selection and technique confirmation',
          'Hair extensions consultation if adding length',
          'Body care plan for dark marks on elbows, knees and underarms (no bleaching creams)',
          'Confirm perfume — oud-based perfume or rose',
        ],
      },
      dayOf: {
        label: 'Day Of',
        tasks: [
          'Allow 4–6 hours for full Arabic bridal prep',
          'Hair blow-dry and set done first',
          'Makeup begins with extreme base prep (matte or dewy choice)',
          'Kohl application — inner waterline is key Arabic signature',
          'Lashes — dramatic full coverage for photography',
          'Perfume: spritz oud oil on pulse points before dressing',
          'Hijab or hair styling completed last',
          'Final mist with setting spray for longevity',
        ],
      },
    },
    preWeddingRituals: [
      {
        name: 'Hammam (Turkish Bath) Ritual',
        tradition: 'Pan-Arab, Turkish, North African',
        description: 'Traditional steam bath and full body exfoliation using kessa mitt and black soap (savon beldi). The Hammam session opens pores, deeply cleanses, and leaves skin radiant. Many Arab brides attend a formal hammam the day or two before the wedding with female family members.',
        timing: '1–2 days before wedding',
        products: ['Savon Beldi (black soap)', 'Kessa exfoliation mitt', 'Ghassoul clay', 'Rose water', 'Argan oil finish'],
      },
      {
        name: 'Henna Night (Laylat al-Henna)',
        tradition: 'Pan-Arab',
        description: 'The henna night is a major pre-wedding celebration for women. Intricate henna designs are applied to the bride\'s hands and feet. North African traditions feature geometric Berber patterns; Gulf traditions feature dense floral coverage; Levantine styles feature delicate vine work.',
        timing: 'Night before or 2 nights before wedding',
        products: ['Natural henna paste', 'Lemon-sugar sealant', 'Warmth source for setting'],
        designStyles: ['Gulf/Khaleeji (full dense hands)', 'Moroccan (geometric)', 'Levantine (delicate vines)', 'Egyptian (large motifs)'],
      },
      {
        name: 'Oud and Rose Water Skin Bath',
        tradition: 'Gulf and Levant',
        description: 'Bathing in water infused with rose petals and a few drops of oud oil the evening before. The oud oil conditions and lightly perfumes the skin. Rose water tones and brightens. This ritual is deeply sensory and considered an act of self-love and preparation.',
        timing: 'Night before wedding',
        products: ['Rose petals or rose water concentrate', 'Pure oud oil (1–2 drops)', 'Warm bath', 'Argan oil body finish'],
      },
      {
        name: 'Ghassoul Clay Mask',
        tradition: 'Moroccan / North African',
        description: 'Ghassoul (rhassoul) clay mixed with rose water and argan oil applied to face and body for deep cleansing, tightening, and brightening. Moroccan brides have used this for generations.',
        timing: '2 days before',
        products: ['Ghassoul clay powder', 'Rose water', 'Argan oil', 'Warm water rinse'],
      },
    ],
    makeupPhilosophy: 'Arabic bridal makeup is synonymous with drama, luxury, and precision. The signature Arabic eye — smoky, kohled, elongated with a lifted tail — is the centerpiece of the look. Foundation is typically flawless and camera-ready. Contouring and highlighting are done with expert hands. The total look is designed to photograph magnificently under flash and be the most glamorous version of the bride herself.',
    signatureElements: [
      'Kohl-rimmed inner waterline — the ultimate Arabic signature',
      'Smoky elongated eye with lifted tail',
      'Full lashes — strip or individual for maximum drama',
      'Immaculate base — no pores, no texture, porcelain finish',
      'Strong defined brow — typically straight or slightly arched',
      'Highlight: bridge of nose, inner corner, Cupid\'s bow',
      'Lip: nude glam, deep berry, or classic red depending on tradition',
      'Setting spray for humidity and longevity in warm climates',
    ],
    hairTraditions: [
      {
        style: 'Voluminous Blowout',
        description: 'Full body blowout with deep waves or curls. A signature bridal style across the Levant, Gulf, and Egypt.',
        significance: 'Beauty, luxury, feminine glamour',
        stylingTip: 'Use a volumizing mousse at roots, blow dry upside down, and set with large-barrel curling iron for longevity.',
      },
      {
        style: 'Elaborate Updo with Veil',
        description: 'Structured chignon or updo adorned with crystals, pins, and a dramatic veil. For brides wearing white Western dress for part of the celebration.',
        significance: 'Elegance, formality',
        stylingTip: 'Double-pin the veil in at least 4 points for Gulf climate wind resistance.',
      },
      {
        style: 'Hijab Bridal Styling',
        description: 'Hijab styled beautifully for the occasion using silk, chiffon, or lace fabrics. Multiple wrapping styles exist — Turkish, Gulf, Lebanese — each with distinct elegance.',
        significance: 'Modesty, identity, beauty',
        stylingTip: 'Pre-pin the base cap and have all accessories attached before the wedding day.',
      },
    ],
  },

  'latina': {
    communityId: 'latina',
    communityName: 'Latina',
    weddingStyles: ['Catholic Church', 'Civil', 'Destination', 'Quinceañera-inspired', 'Outdoor Hacienda', 'Beach'],
    timeline: {
      sixMonthsBefore: {
        label: '6 Months Before',
        tasks: [
          'Book MUA with Latin bridal experience',
          'Begin brightening routine (glycolic, niacinamide, SPF)',
          'Hair health treatments — bond repair and moisture',
          'Research flamenco-inspired or traditional hair accessories',
          'Plan mantilla (lace veil) or modern veil choice',
          'Nail art planning — intricate designs need advance booking',
          'Body care — start exfoliating and moisturizing 3x weekly',
          'Research local florals for hair crown if desired',
        ],
      },
      threeMonthsBefore: {
        label: '3 Months Before',
        tasks: [
          'Full bridal makeup trial',
          'Bold lip color testing — coordinate with bouquet and dress',
          'Hair trial — decide on up vs. down vs. half-up',
          'Waxing schedule established',
          'Monthly facial appointments begin',
          'Lash consultation — extensions, strips, or mascara',
          'Confirm jewelry — gold vs. pearl vs. statement pieces',
          'Body scrub + moisturizing ritual established',
        ],
      },
      dayOf: {
        label: 'Day Of',
        tasks: [
          'Start early for church ceremonies',
          'Primer + setting spray regimen from the start',
          'Bold lip applied last, touched up after ceremony',
          'Veil or mantilla attached to hair as final step',
          'Fresh flowers added to hair arrangement',
          'Photography at golden hour — have MUA available for touch-up',
          'Spare earrings in case of dancing loss',
          'Setting spray touchup kit for reception dancing',
        ],
      },
    },
    preWeddingRituals: [
      {
        name: 'Rompope and Honey Mask',
        tradition: 'Mexican',
        description: 'Traditional Mexican beauty mask made from rompope (Mexican eggnog) and honey applied to the face for brightening and moisturizing. A folk beauty remedy still used by grandmothers for bridal preparation.',
        timing: '2 weeks before',
        products: ['Rompope', 'Raw honey', 'Oat flour', 'Warm water rinse'],
      },
      {
        name: 'Rosa Mosqueta (Rosehip) Oil Treatment',
        tradition: 'Chilean/Argentine',
        description: 'Rosa mosqueta (rosehip oil) is applied nightly for months before the wedding in South American beauty traditions. Known for its exceptional vitamin A content and skin regenerating properties.',
        timing: 'Months before (nightly)',
        products: ['Chilean rosehip oil', 'Optional: vitamin C serum underneath'],
      },
      {
        name: 'Flor de Jamaica (Hibiscus) Hair Rinse',
        tradition: 'Mexican and Caribbean Latina',
        description: 'Hibiscus flower tea used as a final hair rinse for shine and natural color enhancement. Traditional Latina beauty ritual for voluminous, glossy hair.',
        timing: 'Week of wedding',
        products: ['Dried hibiscus flowers', 'Boiling water', 'Apple cider vinegar (optional)', 'Cold water rinse'],
      },
    ],
    makeupPhilosophy: 'Latina bridal beauty spans a spectrum from soft romantic to full bold glam, always with an emphasis on radiance and joy. The bold lip is iconic — red, berry, coral, or rose. Skin is glowing and luminous rather than matte. Eyes range from natural lash-focused looks to elaborate cut-crease glamour. The overall impression is warmth, vitality, and celebration.',
    signatureElements: [
      'Bold lip as the signature statement',
      'Glowing luminous skin — bronze or golden highlight',
      'Defined eyes with individual lashes or strips',
      'Warm bronzy glow throughout',
      'Strongly defined brow',
      'Gold or rose gold jewelry that catches reception lighting',
      'Long-lasting matte or satin lip formula for dancing',
    ],
    hairTraditions: [
      {
        style: 'Updo with Fresh Florals',
        description: 'Elegant updo adorned with fresh flowers — roses, calla lilies, or tropical blooms depending on region. Classic Latin bridal hair with a romantic, garden-wedding feel.',
        significance: 'Romance, nature, femininity',
        stylingTip: 'Add flowers the morning of — coordinate with bouquet florist for matching blooms.',
      },
      {
        style: 'Long Waves with Mantilla Veil',
        description: 'Long, loose waves or half-up half-down with a traditional lace mantilla veil placed over the head. Classic Spanish and Latin American tradition.',
        significance: 'Tradition, modesty, elegance',
        stylingTip: 'Mantilla requires a comb attachment at the crown — practice placement with stylist at trial.',
      },
      {
        style: 'Dramatic Updo with Statement Earrings',
        description: 'Sleek high bun or dramatic French twist that shows off statement earrings. Modern Latina bride preference when jewelry is the focal point.',
        significance: 'Elegance, modern sensibility',
        stylingTip: 'Secure with maximum pins for dancing endurance.',
      },
    ],
  },

  'east-asian': {
    communityId: 'east-asian',
    communityName: 'East Asian',
    weddingStyles: ['Traditional Chinese (Cheongsam)', 'Traditional Korean (Hanbok)', 'Traditional Japanese (Shiromuku)', 'Modern White Dress', 'Tea Ceremony', 'Multi-Outfit'],
    timeline: {
      sixMonthsBefore: {
        label: '6 Months Before',
        tasks: [
          'Book traditional East Asian bridal MUA',
          'Begin double-cleanse skin care ritual for glass skin',
          'Research Hanbok, Cheongsam, or Shiromuku and their color meanings',
          'Book traditional headdress rental or purchase',
          'Plan regular meals and sleep for the final months',
          'Nail art planning — intricate Korean nail art needs advance booking',
          'Research K-beauty bridal trends vs. traditional looks',
          'Begin jade roller and gua sha morning ritual',
        ],
      },
      threeMonthsBefore: {
        label: '3 Months Before',
        tasks: [
          'Full bridal makeup trial — test glass skin vs. matte finish',
          'Traditional and modern look trials (multiple outfits)',
          'Hair extension trial if adding length for traditional updo',
          'Begin ampoule and sheet mask intensive regimen',
          'Eyebrow lamination or threading consultation',
          'Lip gradient technique trial',
          'Confirm traditional hair accessories and crowns',
          'Test all jewelry for weight comfort',
        ],
      },
      dayOf: {
        label: 'Day Of',
        tasks: [
          'Allow 5–7 hours for multiple-outfit bridal prep',
          'Traditional headdress applied by specialist before ceremony',
          'First outfit typically more traditional, second more modern',
          'Glass skin or matte cream skin base applied meticulously',
          'Lip gradient (blurred) vs. full lip depending on tradition',
          'Tea ceremony preparations coordinated separately',
          'Photography: golden hour for outdoor shots',
          'Touch-up kit: cushion foundation, lip product, blotting',
        ],
      },
    },
    preWeddingRituals: [
      {
        name: 'Sheet Mask Intensive (7-Day Series)',
        tradition: 'Korean',
        description: 'Daily sheet mask for 7 consecutive nights before the wedding using hyaluronic acid, niacinamide, and collagen formulas. Korean brides treat this regimen as non-negotiable for achieving the coveted glass skin effect on the wedding day.',
        timing: '7 nights before',
        products: ['Hyaluronic acid sheet mask', 'Niacinamide sheet mask', 'Collagen mask', 'Fermented essence mask'],
      },
      {
        name: 'Green Tea Steam Ritual',
        tradition: 'Japanese',
        description: 'Steaming face over a bowl of green tea for 10 minutes, followed by green tea toner pat-down. Opens pores for deep cleansing, provides antioxidants, and is a meditative bridal ritual.',
        timing: 'Morning of wedding',
        products: ['High-quality matcha or green tea', 'Green tea toner', 'Silk cloth'],
      },
      {
        name: 'Gua Sha and Ice Globe Routine',
        tradition: 'Chinese',
        description: 'Gua sha facial massage to sculpt and depuff, followed by ice globe massage to tighten and brighten. Done the morning of the wedding for a defined, lifted look.',
        timing: 'Morning of wedding (after skincare)',
        products: ['Rose quartz gua sha', 'Ice globes', 'Facial oil', 'Jade roller'],
      },
      {
        name: 'Rice Water and Pearl Powder Mask',
        tradition: 'Chinese / Japanese',
        description: 'Ancient beauty ritual using fermented rice water and pearl powder as a face mask. Said to have been used by court ladies for centuries for porcelain skin.',
        timing: '1–2 weeks before',
        products: ['Fermented rice water', 'Pearl powder', 'Honey', 'Optional: Royal jelly'],
      },
    ],
    makeupPhilosophy: 'East Asian bridal beauty varies dramatically between traditional and modern aesthetics. Traditional looks (Shiromuku, Hanbok ceremony, Cheongsam) follow centuries-old conventions with specific products and techniques. Modern East Asian bridal beauty leans into the K-beauty glass skin aesthetic — flawless dewy skin, blush as the star, soft gradient lips, and natural-looking lashes. The overall impression is pure, refined, and luminous.',
    signatureElements: [
      'Glass skin base — dewy and poreless',
      'Soft gradient (blurred) lip vs. defined lip depending on tradition',
      'Blush as a key element — high cheekbone placement',
      'Natural-looking lashes or subtle lash line',
      'Straight or softly arched brow',
      'Inner corner highlight — brightening',
      'Contour: soft and natural for photograph depth',
      'Traditional looks: red lip (prosperity), headdress, specific pigments',
    ],
    hairTraditions: [
      {
        style: 'Traditional Updo with Hairpins (Headdress)',
        description: 'Formal structured updo adorned with traditional phoenix or floral hairpins (binyeo, kanzashi, fengguan). Each cultural tradition has distinct hairpin styles.',
        significance: 'Cultural identity, prosperity, ceremony',
        stylingTip: 'Traditional hairstyling specialists book far in advance — many are located in cultural community centers.',
      },
      {
        style: 'Modern Half-Up with Ribbon or Flower',
        description: 'Romantic half-up with loose waves, adorned with a satin ribbon or fresh floral pin. Popular for modern Western-influenced ceremonies.',
        significance: 'Youthful elegance, romance',
        stylingTip: 'Use a heat protectant and finish spray for wave longevity.',
      },
      {
        style: 'Sleek Blowout with Accessories',
        description: 'Pin-straight or softly waved blowout with a pearl or crystal headband. Clean, modern, and sophisticated.',
        significance: 'Modernity, minimalism',
        stylingTip: 'Use a serum-based product for frizz control and mirror shine.',
      },
    ],
  },

  'east-african': {
    communityId: 'east-african',
    communityName: 'East African',
    weddingStyles: ['Swahili Traditional (Arusi)', 'Ethiopian (Timket-influenced)', 'Eritrean', 'Somali Nikah', 'Kenyan Church', 'Ugandan Introduction (Kwanjula)'],
    timeline: {
      sixMonthsBefore: {
        label: '6 Months Before',
        tasks: [
          'Book henna artist for Somali/Swahili traditions',
          'Begin shea butter and coconut oil skin regimen',
          'Research traditional garment colors — East African textile traditions',
          'Book MUA with experience in deep/ebony skin tones',
          'Begin hair growth and length retention journey',
          'Book jewelry smith or rental for gold and beaded sets',
          'Research Buibui or traditional garment requirements',
          'Begin brightening routine for glowing melanin-rich skin',
        ],
      },
      threeMonthsBefore: {
        label: '3 Months Before',
        tasks: [
          'Full bridal makeup trial',
          'Natural hair protective style decision',
          'Deep conditioning treatments weekly',
          'Body care intensive begins — coffee scrub 2x weekly',
          'Kohl eyeliner selection and trial',
          'Test oil-based vs. water-based foundation for longevity',
          'Jewelry consultation — confirm pieces for multiple outfit changes',
          'Confirm attire changes and beauty transitions between outfits',
        ],
      },
      dayOf: {
        label: 'Day Of',
        tasks: [
          'Allow 4–5 hours for bridal prep',
          'Begin with hair — protective style or blow-dry',
          'Skin prep: hyaluronic serum + radiance primer',
          'Foundation matched precisely to deep skin tone',
          'Kohl liner applied to inner waterline',
          'Beaded or gold jewelry applied in sequence',
          'Colorful dirac, buibui, or ceremony dress accessories finalized',
          'Touch-up kit: oil blotting, matching lip, setting spray',
        ],
      },
    },
    preWeddingRituals: [
      {
        name: 'Henna Night (Swahili / Somali)',
        tradition: 'East African Muslim communities',
        description: 'Henna application at a women-only celebration before the wedding. Somali henna features bold, geometric designs. Swahili coastal henna incorporates Arabic-influenced floral patterns.',
        timing: '1–2 nights before',
        products: ['Natural henna paste', 'Lemon-sugar sealant', 'Clove or eucalyptus steam'],
      },
      {
        name: 'Coffee and Spice Scrub',
        tradition: 'Ethiopian / Eritrean',
        description: 'Full body scrub using finely ground Ethiopian coffee mixed with coconut oil and cardamom. Deep exfoliation that leaves skin polished and glowing. Performed in a traditional coffee ceremony setting.',
        timing: '2–3 days before',
        products: ['Fine Ethiopian coffee grounds', 'Coconut oil', 'Cardamom powder', 'Warm water rinse'],
      },
      {
        name: 'Shea and Neem Oil Body Treatment',
        tradition: 'Pan-East African',
        description: 'Full body slathering of shea butter mixed with neem oil (antibacterial) the night before. A practical and traditional treatment for clear, radiant, well-moisturized skin.',
        timing: 'Night before',
        products: ['Unrefined shea butter', 'Neem oil (a few drops)', 'Warm water bath before application'],
      },
    ],
    makeupPhilosophy: 'East African bridal beauty honors the majesty of deep, rich, ebony to warm brown skin. Foundation shade-matching is paramount — the wrong match on deep melanin-rich skin is immediately visible. Kohl liner is a cultural constant. Highlighter placed on cheekbones, temples, and cupid\'s bow creates a spectacular dimensional glow. Eye looks range from soft gold to dramatic smoked kohl depending on tradition.',
    signatureElements: [
      'Kohl inner waterline — cultural constant',
      'Gold or copper lid shimmer for cheekbone dimension',
      'Richly pigmented deep berry or brick red lip',
      'Bold brow, well-defined and arched',
      'Luminous highlight on cheekbones and brow bone',
      'Full coverage foundation matched to warm/cool undertone in deep range',
      'Lashes for drama — individual clusters or full strip',
    ],
    hairTraditions: [
      {
        style: 'Natural Afro or Twist-Out',
        description: 'Celebrated natural hair in its full glory. A proud expression of East African identity, adorned with gold pins, cowrie shells, or a simple crown.',
        significance: 'Cultural pride, natural beauty',
        stylingTip: 'Refresh with water and leave-in conditioner morning of, then add accessories.',
      },
      {
        style: 'Cornrow Crown with Gold',
        description: 'Intricate cornrow patterns styled into a crown or halo shape, with gold thread, beads, or cuffs woven throughout.',
        significance: 'Artisanal craft, cultural heritage',
        stylingTip: 'Install 3–4 days before for natural settling.',
      },
      {
        style: 'Elaborate Braid Updo',
        description: 'Complex braided updo incorporating extensions for length and volume. Adorned with jewelry, beads, or floral accessories.',
        significance: 'Elegance, celebration',
        stylingTip: 'Have a trusted stylist experienced with textured hair updo techniques.',
      },
    ],
  },

  'south-african': {
    communityId: 'south-african',
    communityName: 'South African',
    weddingStyles: ['Zulu (Umabo)', 'Xhosa', 'Sotho', 'Venda', 'Western Church', 'White Wedding'],
    timeline: {
      sixMonthsBefore: {
        label: '6 Months Before',
        tasks: [
          'Research traditional imbazo (cow hide/beaded garments) and amabali',
          'Book MUA with knowledge of South African traditional beauty',
          'Begin brightening and luminous skin journey',
          'Start intensive body moisturizing ritual',
          'Research and book beaded accessory artisan',
          'Headband/isicholo consultation for Zulu tradition',
          'Begin hair protective style journey for length retention',
          'Plan for color-change between traditional and church outfit',
        ],
      },
      threeMonthsBefore: {
        label: '3 Months Before',
        tasks: [
          'Bridal makeup trial',
          'Isicholo (Zulu headpiece) fitting and final styling',
          'Traditional beaded accessories confirmed and fitted',
          'Body oil treatment regimen begins',
          'Deep conditioning hair treatments',
          'Brow consultation — traditional aesthetics vs. modern',
          'Bold ochre, copper, or clay-inspired looks for traditional portion',
          'Confirm transition plan between traditional and reception looks',
        ],
      },
      dayOf: {
        label: 'Day Of',
        tasks: [
          'Traditional ceremony beauty prep first',
          'Isicholo placed by specialist',
          'Beaded garments layered — MUA ensures makeup shows',
          'Bold traditional eye or lip look',
          'Transition hair and makeup for church or reception portion',
          'Gold, copper, and ochre color story carried through all looks',
          'Family photographs in traditional attire — preserve the moment',
          'Touch-up kit available between outfit changes',
        ],
      },
    },
    preWeddingRituals: [
      {
        name: 'Amasi (Sour Milk) Skin Treatment',
        tradition: 'Zulu / Xhosa',
        description: 'Application of amasi (fermented/sour milk) to face and body. Its lactic acid gently exfoliates. A traditional Nguni beauty secret used for generations.',
        timing: '1 week before, 2–3 times',
        products: ['Amasi (traditional fermented milk)', 'Warm water rinse', 'Shea butter finish'],
      },
      {
        name: 'Rooibos and Honeybush Steam',
        tradition: 'South African (Cape)',
        description: 'Facial steam using rooibos and honeybush tea — both indigenous South African plants rich in antioxidants. Deeply cleanses and brightens skin. A Cape beauty tradition.',
        timing: '2 days before',
        products: ['Rooibos tea bags', 'Honeybush tea', 'Steam bowl', 'Cool water splash'],
      },
      {
        name: 'Marula Oil Body Glow',
        tradition: 'Pan-Southern African',
        description: 'Marula oil (from the marula fruit indigenous to Southern Africa) applied to entire body. Lightweight, deeply moisturizing, and gives an incredible natural glow that photographs beautifully on all deep skin tones.',
        timing: 'Night before and morning of',
        products: ['Pure marula oil', 'Optional: add a drop of vitamin E oil'],
      },
    ],
    makeupPhilosophy: 'South African bridal beauty encompasses both traditional and modern aesthetics. Traditional Zulu and Xhosa bridal beauty incorporates ochre, earth tones, and clay-inspired pigments. Modern South African bridal beauty is bold, luminous, and cosmopolitan. The transition between traditional and Western ceremony look requires planning. Skin radiance is universal — marula oil, rooibos treatments, and a glow-forward foundation.',
    signatureElements: [
      'Earth tone inspired looks for traditional ceremony (ochre, clay, copper)',
      'Bold modern glam for reception',
      'Luminous highlight on rich deep skin',
      'Strong brow — natural and full',
      'Beaded accessories integrated with makeup look',
      'Isicholo (Zulu hatpiece) coordinated with makeup',
      'Foundation with marula oil for lasting glow',
    ],
    hairTraditions: [
      {
        style: 'Natural Afro with Isicholo',
        description: 'Zulu bridal hair tradition involving the isicholo (circular hat) placed over natural or styled hair. The hat symbolizes married status.',
        significance: 'Marital status, cultural identity',
        stylingTip: 'The isicholo requires a base — consult with a Zulu hair specialist for attachment.',
      },
      {
        style: 'Xhosa Head Wrap',
        description: 'Elegant head wrap in white or ceremony colors. Xhosa bridal beauty traditions include specific wrapping techniques that vary by region.',
        significance: 'Respect, ceremony, cultural identity',
        stylingTip: 'Practice wrapping technique weeks in advance.',
      },
      {
        style: 'Modern Natural Updo',
        description: 'Contemporary natural hair updo with gold or copper accessories. Worn for Western church ceremony or reception.',
        significance: 'Natural pride, modern elegance',
        stylingTip: 'Define curls with a twist-out and pin into an updo with bobby pins for security.',
      },
    ],
  },

  'black-american': {
    communityId: 'black-american',
    communityName: 'Black American',
    weddingStyles: ['Church Wedding', 'Outdoor Garden', 'Ballroom', 'Intimate', 'Afrocentric', 'Destination'],
    timeline: {
      sixMonthsBefore: {
        label: '6 Months Before',
        tasks: [
          'Book MUA with Black bridal portfolio experience',
          'Begin brightening skincare routine',
          'Schedule hair consultation — extensions, natural, or relaxed',
          'Research Afrocentric jewelry, cowrie accessories if desired',
          'Book lash specialist for extensions or custom strips',
          'Begin body brightening and moisturizing regimen',
          'Research jumpsuit vs. gown vs. traditional dress decision',
          'Book nail artist for custom bridal nail design',
        ],
      },
      threeMonthsBefore: {
        label: '3 Months Before',
        tasks: [
          'Full bridal makeup trial',
          'Hair trial — confirm style and test longevity',
          'Lash extension consultation and fill schedule',
          'Monthly facial appointments',
          'Body scrub ritual established',
          'Bold lip testing — decide on color story',
          'Jewelry confirmed — statement earrings, necklace',
          'Edge control and protective style confirmed',
        ],
      },
      dayOf: {
        label: 'Day Of',
        tasks: [
          'Allow 4–5 hours for full prep',
          'Hair styled first if wearing up-do or extensions',
          'Edges laid smooth and gelled after full makeup',
          'Foundation shade-matched under natural light',
          'Bold lip applied after photography if preferred, or early',
          'Lashes applied 30 minutes before departure for settling',
          'Setting spray essential for humidity and dancing',
          'Touch-up kit: edges, lip color, blotting paper, setting spray',
        ],
      },
    },
    preWeddingRituals: [
      {
        name: 'Castor Oil Deep Conditioning Treatment',
        tradition: 'Black American beauty culture',
        description: 'Jamaican black castor oil applied to scalp and hair ends, covered with a plastic cap overnight. A beloved Black beauty ritual for hair growth, thickness, and strength — particularly important for brides wanting healthy natural hair on their wedding day.',
        timing: 'Weekly for months before, last treatment 5 days before',
        products: ['Jamaican black castor oil', 'Deep conditioner', 'Plastic cap', 'Heat cap optional'],
      },
      {
        name: 'African Black Soap Cleansing Ritual',
        tradition: 'Black American / West African diaspora',
        description: 'Weekly face and body cleanse with authentic African black soap. Known for clearing hyperpigmentation, controlling oil, and leaving skin with a natural luminosity.',
        timing: 'Weekly regimen',
        products: ['Authentic African black soap', 'Warm water', 'Shea butter moisturizer', 'Facial oil'],
      },
      {
        name: 'Vitamin E and Shea Scar Treatment',
        tradition: 'Black American',
        description: 'Daily application of vitamin E oil mixed with shea butter to target hyperpigmentation spots, scars, or areas of discoloration. A months-long treatment that can dramatically even skin tone for the wedding.',
        timing: 'Months before (nightly)',
        products: ['Vitamin E oil', 'Unrefined shea butter', 'Turmeric powder (optional)'],
      },
    ],
    makeupPhilosophy: 'Black American bridal beauty is deeply personal and varied — from natural and minimal to full high-glam. What is consistent is the emphasis on foundation shade-matching for the full range of Black skin from porcelain to ebony, with precision warm/cool/neutral undertone analysis. Edge control is a significant beauty consideration. Bold, joyful, celebratory — the Black American bride\'s look should make her feel the most beautiful version of herself.',
    signatureElements: [
      'Foundation shade-matched with expert undertone analysis',
      'Edges laid and secured for the full day',
      'Bold lip as a statement — red, berry, coral, or mauve',
      'Dramatic lashes — individuals or full strip',
      'Highlight on cheekbones, cupid\'s bow, inner corners',
      'Strong brow definition — arched or straight',
      'Setting spray applied in layers for dancing longevity',
      'Hair: natural curls, sleek updo, braids, or extensions',
    ],
    hairTraditions: [
      {
        style: 'Natural Hair Bridal Updo',
        description: 'Natural coils, curls, or locs styled into an elegant bridal updo. A celebration of natural hair in its full beauty.',
        significance: 'Natural pride, identity',
        stylingTip: 'Moisturize natural hair thoroughly 2 days before and allow to dry completely before styling.',
      },
      {
        style: 'Locs Updo or Crown',
        description: 'Bridal styling for loc wearers — elegant updo, crown, or half-up with hair jewelry and gold pins.',
        significance: 'Cultural identity, spiritual meaning',
        stylingTip: 'Retwist or refresh locs 2 weeks before. Use sheen spray for photography.',
      },
      {
        style: 'Sleek Pressed Look',
        description: 'Silk-pressed natural hair in a sleek style — ponytail, chignon, or blown-out waves. Classic and elegant.',
        significance: 'Versatility, timeless beauty',
        stylingTip: 'Press in sections with a bonnet dryer first, then flat iron at 365°F maximum for health.',
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// BRIDAL SKINCARE GUIDE BY SKIN TONE
// ─────────────────────────────────────────────────────────────────────────────

export const BRIDAL_SKINCARE_BY_TONE = {
  deepEbonyToDeepBrown: {
    toneRange: 'Deep Ebony to Deep Brown',
    fitzpatrickRange: 'V–VI',
    challenges: [
      'Hyperpigmentation from post-inflammatory marks',
      'Ashy appearance in flash photography if not properly moisturized',
      'Foundation shade mismatches in many mainstream lines',
      'Keloid or dark mark tendency from extractions',
      'Cool or warm undertone variation not well addressed by most brands',
    ],
    bridalSkincarePlan: {
      months6to3: {
        am: ['Gentle cleanser', 'Vitamin C serum (L-ascorbic acid 10–15%)', 'Niacinamide 10% for PIH', 'SPF 50+ mineral (avoid white cast formulas)'],
        pm: ['Oil cleanser + water cleanser double cleanse', 'AHA exfoliant 1–2x per week (lactic or mandelic; start low to avoid dark marks)', 'Retinol 0.3% (work up gradually)', 'Shea butter or natural oil moisturizer'],
        weekly: ['Clay mask for congestion control', 'Brightening sheet mask', 'Lymphatic drainage massage'],
      },
      months3to1: {
        am: ['Gentle barrier-supporting cleanser', 'Antioxidant serum', 'Hydrating moisturizer', 'SPF 50+'],
        pm: ['Double cleanse', 'Retinol (maintained)', 'Ceramide moisturizer', 'Facial oil (rosehip or squalane)'],
        weekly: ['Enzyme mask', 'Gua sha or facial massage', 'Professional facial'],
        monthlyPro: ['Mild peel only with a dermatologist experienced with deep skin', 'Microcurrent facial', 'LED red light therapy'],
      },
      finalMonth: {
        am: ['Familiar cleanser', 'Hyaluronic serum', 'Barrier cream', 'SPF'],
        pm: ['Gentle cleanse', 'Hyaluronic serum', 'Barrier cream', 'Facial oil'],
        noActives: true,
        note: 'No new products after 4 weeks before. Consolidate to proven routine only.',
      },
    },
    foundationMatchTips: [
      'Always match foundation to jawline and neck simultaneously',
      'Deep skin has warm (red/orange), cool (blue/red), or neutral undertones — match precisely',
      'Look for brands with true deep shade ranges: MAC, Fenty Beauty, Black Up, Make Up For Ever',
      'Avoid foundations with silver/gray cast — they make deep skin look ashy in photos',
      'Test in natural daylight and under reception lighting (often warm yellow)',
      'Request a shade match from an MUA who regularly works with deep skin',
    ],
  },

  warmMediumToBrown: {
    toneRange: 'Warm Medium to Brown',
    fitzpatrickRange: 'IV–V',
    challenges: [
      'Tan lines visible in strapless or backless gowns',
      'Hyperpigmentation around mouth, eyes, elbows',
      'Warm vs. cool undertone mismatch in foundation',
      'Sun damage accumulation by wedding day if outdoor lifestyle',
      'Patchy areas from previous treatments or bleaching attempts',
    ],
    bridalSkincarePlan: {
      months6to3: {
        am: ['Brightening cleanser', 'Vitamin C + E serum', 'Niacinamide 5%', 'SPF 50 (tinted if preferred)'],
        pm: ['Micellar cleanse + gentle wash', 'AHA 1–2x weekly (lactic, or a low-strength glycolic)', 'Retinol 0.25–0.5%', 'Hydrating moisturizer + oil'],
        weekly: ['Brightening enzyme mask', 'Jade roller lymphatic massage', 'Body scrub 2x (sugar + oil)'],
      },
      months3to1: {
        am: ['Calming cleanser', 'Fermented essence toner', 'Brightening serum', 'SPF'],
        pm: ['Oil cleanser', 'Retinol (maintained)', 'Hyaluronic acid serum', 'Ceramide cream'],
        monthlyPro: ['Mild peel only with a dermatologist experienced with your skin tone', 'Oxygen facial'],
      },
      finalMonth: {
        am: ['Gentle cleanser', 'Essence', 'SPF'],
        pm: ['Double cleanse', 'Hyaluronic serum', 'Nourishing cream'],
        noActives: true,
        note: 'Avoid any new products, actives, or treatments in the final month.',
      },
    },
    foundationMatchTips: [
      'Test under different lights — warm-toned skin can appear different in natural vs. artificial light',
      'Warm golden undertones need a yellow-base foundation (not pink/red)',
      'Check that foundation doesn\'t turn orange on skin by end of day (oil interaction)',
      'Full-coverage options: Charlotte Tilbury Airbrush Flawless, Armani Luminous Silk, Fenty Beauty Pro Filt\'r Soft Matte',
      'Airbrush application is an option for long-wear coverage',
    ],
  },

  fairToOlive: {
    toneRange: 'Fair to Olive',
    fitzpatrickRange: 'II–IV',
    challenges: [
      'Redness, flushing, or rosiness',
      'Olive undertone can look gray in wrong foundation',
      'Visible pores in flash photography',
      'Dark circles that increase with wedding stress',
      'Dryness causing texture visible under heavy makeup',
    ],
    bridalSkincarePlan: {
      months6to3: {
        am: ['Gel cleanser', 'Vitamin C serum', 'Peptide moisturizer', 'SPF 50'],
        pm: ['Oil cleanser + gel cleanser', 'BHA 2x weekly (salicylic)', 'Retinol 0.5%', 'Sleeping mask 3x weekly'],
      },
      months3to1: {
        am: ['Gentle cleanser', 'Hyaluronic acid toner', 'Growth factor serum', 'Moisturizer', 'SPF'],
        pm: ['Double cleanse', 'Essence', 'Retinol', 'Ceramide cream', 'Eye cream'],
        monthlyPro: ['HydraFacial', 'Brightening facial', 'Microneedling (allow 3 weeks healing)'],
      },
      finalMonth: {
        am: ['Calming cleanser', 'Barrier serum', 'SPF'],
        pm: ['Gentle cleanse', 'Hydrating serum', 'Occlusive cream'],
        noActives: true,
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// BRIDAL HAIR GUIDE — PROTECTIVE STYLES FOR WEDDING DAY
// ─────────────────────────────────────────────────────────────────────────────

export const BRIDAL_HAIR_GUIDE = {
  naturalHairBrides: {
    title: 'Natural Hair Bridal Guide',
    prepTimeline: [
      {
        timing: '3 Months Before',
        tasks: [
          'Identify hair type and porosity for proper product selection',
          'Begin protein-moisture balance routine',
          'Trim any damaged ends',
          'Start a gentle scalp massage ritual with a light oil, if you enjoy it',
          'Identify and test bridal hair style options',
        ],
      },
      {
        timing: '1 Month Before',
        tasks: [
          'Final trim if needed',
          'Full bridal hair trial — photograph from all angles',
          'Test longevity of style (wear for 12 hours)',
          'Select and order all accessories',
          'Confirm with stylist if extensions needed for volume',
        ],
      },
      {
        timing: 'Week Before',
        tasks: [
          'Deep conditioning treatment',
          'Protective styling if getting a twist-out or braid-out',
          'Install braids/twists 3–4 days before for natural look',
          'Refresh edges 1 day before',
        ],
      },
      {
        timing: 'Day Of',
        tasks: [
          'Spritz hair lightly with water and leave-in',
          'Apply styling product and begin styling',
          'Edges laid smooth with gel and firm-hold product',
          'Accessories and flowers added last',
          'Setting spray (for moisture retention) applied',
        ],
      },
    ],
    stylesForTexturedHair: [
      {
        style: 'Wash-and-Go',
        suitableTypes: ['3A', '3B', '3C', '4A'],
        description: 'Defined coils or curls worn in their natural state. Fresh, beautiful, and a powerful statement of natural identity.',
        longevityTips: 'Apply on freshly washed hair, use a light oil to seal, and pineapple overnight. Morning of, spritz and scrunch.',
        accessoryIdeas: 'Floral crown, gold headband, embellished pins',
      },
      {
        style: 'Twist-Out / Braid-Out',
        suitableTypes: ['3C', '4A', '4B', '4C'],
        description: 'Defined elongated coils achieved by unraveling twists or braids. More defined than wash-and-go, with beautiful stretch.',
        longevityTips: 'Install twists 2–3 nights before. Unravel morning of and separate gently. Set with light oil.',
        accessoryIdeas: 'Pearl pins, floral accessories, golden rings',
      },
      {
        style: 'Bantu Knot-Out',
        suitableTypes: ['3C', '4A', '4B'],
        description: 'Large defined spiral curls from bantu knots. Romantic and voluminous.',
        longevityTips: 'Set on slightly damp hair 2 nights before. Open morning of for maximum definition.',
        accessoryIdeas: 'Crystal pins, delicate flowers at hairline',
      },
      {
        style: 'Protective Updo (Natural)',
        suitableTypes: ['3A', '3B', '3C', '4A', '4B', '4C'],
        description: 'Coils or curls pinned up in an elegant updo — afro puff crown, coiled bun, or upswept style.',
        longevityTips: 'Defined coils stay in place better than stretched styles. Secure with pins and satin-wrapped rubber band.',
        accessoryIdeas: 'Tiara, gold crown, beaded headpiece, jeweled pins',
      },
    ],
  },

  extensions: {
    title: 'Extension and Weave Guide for Brides',
    types: [
      {
        type: 'Sew-In Weave',
        description: 'Natural hair cornrowed and weft extensions sewn onto braids. Provides full length and volume. Very secure for dancing and active celebrations.',
        installTiming: '1–2 weeks before wedding',
        longevity: '6–8 weeks',
        recommendation: 'Best for long straight or wavy wedding styles',
      },
      {
        type: 'U-Part Wig',
        description: 'Wig constructed with a U-shaped opening allowing natural hair to blend at the part and crown. Most natural-looking extension option.',
        installTiming: 'No installation needed — customized in advance',
        longevity: 'Day-specific or reusable',
        recommendation: 'Best for natural hair texture blending',
      },
      {
        type: 'Fusion / Keratin Extensions',
        description: 'Individual hair extensions bonded with keratin to natural hair. Very natural-looking but more expensive and time-intensive.',
        installTiming: '2–3 weeks before',
        longevity: '3–6 months',
        recommendation: 'Best for long, flowing bridal looks',
      },
      {
        type: 'Clip-Ins',
        description: 'Temporary extensions clipped in the morning of the wedding. Easiest option with no commitment.',
        installTiming: 'Day of',
        longevity: 'Single day',
        recommendation: 'Best for modest volume add or length extension when natural hair is close',
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TOUCH-UP KIT ESSENTIALS BY COMMUNITY
// ─────────────────────────────────────────────────────────────────────────────

export const BRIDAL_TOUCHUP_KITS = {
  'west-african': {
    communityId: 'west-african',
    essential: [
      'Oil-blotting papers (mattifying)',
      'Matching powder for deep skin (no gray/ashy cast)',
      'Backup bold lip color',
      'Setting spray mini',
      'Kohl pencil for inner waterline touch-up',
      'Clear mascara for eyebrow setting',
      'Small mirror',
      'Travel-size facial mist',
    ],
    forGele: [
      'Extra gele pins',
      'Hair pins in matching color',
      'Light fabric starch spray',
    ],
  },
  'south-asian': {
    communityId: 'south-asian',
    essential: [
      'Kajal pencil (must-have for inner waterline)',
      'Matching lipstick shade',
      'Compact powder for shine control',
      'Setting spray mini',
      'Double-sided tape (for dupatta and saree)',
      'Safety pins (minimum 10)',
      'Small comb for parting upkeep',
      'Blotting paper',
      'Extra bindi box',
    ],
    forMehendi: [
      'Avoid washing hands excessively — carry wipes for emergencies only',
      'Lemon-sugar sealant for last touch on fresh mehendi',
    ],
  },
  'caribbean': {
    communityId: 'caribbean',
    essential: [
      'Waterproof mascara backup',
      'Blotting papers (humidity essential)',
      'Facial mist',
      'Bold or coral lip backup',
      'Setting spray (humidity-proof)',
      'Bobby pins for flower replacement',
      'Compact bronzer for touch-up glow',
    ],
    forOutdoor: [
      'SPF touch-up product',
      'Deodorant',
      'Facial wipes (emergency)',
    ],
  },
  'arab': {
    communityId: 'arab',
    essential: [
      'Kohl pencil for inner waterline',
      'Matching nude or red lip',
      'Compact powder',
      'Setting spray',
      'Facial wipes (emergency)',
      'Extra false lash adhesive',
      'Small concealer for under-eye',
      'Eyebrow pencil for fill',
    ],
    forHijab: [
      'Extra hijab pins',
      'Mini iron or steamer for fabric refresh',
      'Static-reduction spray',
    ],
  },
  'latina': {
    communityId: 'latina',
    essential: [
      'Bold lip backup',
      'Compact bronzer',
      'Setting spray',
      'Blotting paper',
      'Bobby pins for floral arrangement',
      'Mini hairspray',
      'Concealer stick',
      'Lash glue backup',
    ],
  },
  'east-asian': {
    communityId: 'east-asian',
    essential: [
      'Cushion compact (glass skin maintenance)',
      'Lip gradient product backup',
      'Setting spray (for dewy look)',
      'Eye drops (for brightness)',
      'Facial mist',
      'Blotting paper (minimal, for emergencies only)',
      'Brow pencil',
      'Hairpins for traditional headdress',
    ],
    forTraditional: [
      'Extra traditional headdress pins',
      'Headdress specialist contact number',
    ],
  },
  'east-african': {
    communityId: 'east-african',
    essential: [
      'Kohl pencil',
      'Deep berry or brick lip backup',
      'Setting spray',
      'Blotting paper',
      'Facial oil mist for glow refresh',
      'Edge control for natural hair',
      'Concealer for under-eye',
      'Gold accessories backup piece',
    ],
  },
  'south-african': {
    communityId: 'south-african',
    essential: [
      'Marula oil face mist for glow refresh',
      'Bold lip backup',
      'Compact powder',
      'Edge control',
      'Traditional beaded pin backup',
      'Setting spray',
      'Concealer',
      'Facial blotting papers',
    ],
  },
  'black-american': {
    communityId: 'black-american',
    essential: [
      'Edge control gel for hair',
      'Bold lip color backup',
      'Setting spray (dancing proof)',
      'Blotting papers',
      'Concealer matching deep undertone',
      'False lash glue backup',
      'Compact powder',
      'Bobby pins',
      'Small comb for edges',
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// BRIDAL MAKEUP ARTISTS — WHAT TO LOOK FOR BY COMMUNITY
// ─────────────────────────────────────────────────────────────────────────────

export const MUA_SELECTION_GUIDE = {
  universalCriteria: [
    'Portfolio showing your specific skin tone and community representation',
    'Experience with your wedding type (traditional + modern transitions)',
    'Clear pricing structure with trial included',
    'Timeline they have created for similar weddings',
    'Product knowledge for your skin type and undertone',
    'Sanitation and hygiene practices',
    'Bridal testimonials from satisfied clients in your community',
    'Ability to understand and respect cultural significance of elements',
  ],

  byCommunity: {
    'west-african': [
      'Knowledge of gele tying or strong partnerships with gele artists',
      'Experience with deep melanin-rich skin shade-matching',
      'Understanding of coral, bold lip, and smoky eye cultural significance',
      'Products that photograph well without gray/ashy cast',
    ],
    'south-asian': [
      'Understanding of full traditional bridal looks (Mughal, Punjabi, South Indian)',
      'Experience with heavy jewelry and dupatta coordination',
      'Kajal application expertise',
      'Airbrush capability (common for Indian bridal)',
      'Understanding of flash photography in Indian wedding settings',
    ],
    'caribbean': [
      'Humidity-proof makeup experience',
      'Comfortable with both natural dewy and full glam looks',
      'Experience with outdoor weddings in warm climates',
      'Understanding of natural and textured hair coordination',
    ],
    'arab': [
      'Arabic eye look expertise (elongated, kohled, dramatic)',
      'Experience with multiple looks for multiple outfit changes',
      'Airbrush or extreme longevity techniques',
      'Hijab styling ability if needed',
      'Understanding of Arabic beauty standards and expectations',
    ],
    'latina': [
      'Bold lip expertise and lip color-matching',
      'Experience with church and outdoor Latina weddings',
      'Understanding of floral hair accessory coordination',
      'Humidity-proofing for outdoor ceremonies',
    ],
    'east-asian': [
      'Glass skin technique mastery',
      'Traditional vs. modern look versatility',
      'Understanding of K-beauty, J-beauty, and traditional Chinese beauty differences',
      'Experience with traditional headdress coordination',
    ],
    'east-african': [
      'Deep melanin-rich skin shade expertise',
      'Kohl application',
      'Experience with Somali, Ethiopian, and Swahili beauty traditions',
      'Understanding of traditional garment and beauty coordination',
    ],
    'south-african': [
      'Knowledge of Zulu, Xhosa, and other Southern African traditions',
      'Experience with isicholo and traditional headpiece coordination',
      'Earth-tone and ochre-inspired traditional looks',
      'Transition between traditional and modern looks',
    ],
    'black-american': [
      'Deep skin shade range expertise',
      'Understands the importance of edges',
      'Bold lip expertise',
      'Experience with natural hair styling and coordination',
      'Church and ballroom photography experience',
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// BRIDAL PERFUME GUIDE BY COMMUNITY
// ─────────────────────────────────────────────────────────────────────────────

export const BRIDAL_PERFUME_GUIDE = {
  'west-african': {
    communityId: 'west-african',
    traditionalScents: ['Oud', 'Shea blossom', 'Hibiscus', 'Kola', 'Palm wine note'],
    recommendedFamilies: ['Warm amber', 'Floral amber', 'Ambery floral'],
    applicationTips: 'Apply to pulse points: wrists, neck, behind ears, inner elbows. Avoid spraying directly on aso-oke fabric. Apply 30 minutes before dressing for skin absorption.',
    longevityTips: 'Layer with matching body oil from the same house for maximum sillage. Moisturize skin before applying — fragrance lasts longer on hydrated skin.',
    considerations: 'Long West African ceremonies in warm climates can intensify fragrance. Choose moderate sillage for indoor ceremonies and stronger for outdoor.',
  },
  'south-asian': {
    communityId: 'south-asian',
    traditionalScents: ['Rose attar', 'Jasmine (mogra)', 'Sandalwood', 'Oud', 'Saffron', 'Kewra'],
    recommendedFamilies: ['Floral amber', 'Attars', 'Warm spicy florals'],
    applicationTips: 'Traditional Indian brides may use rose or jasmine attar applied directly to skin. For longer-lasting scent, layer with matching body lotion. Fresh flowers in hair provide natural scent.',
    
    considerations: 'The mogra (jasmine) gajra in hair provides natural fragrance throughout the ceremony — a beautifully traditional choice that requires no additional perfume at the hair.',
  },
  'caribbean': {
    communityId: 'caribbean',
    traditionalScents: ['Frangipani (plumeria)', 'Hibiscus', 'Coconut', 'Tropical floral', 'Vanilla'],
    recommendedFamilies: ['Tropical floral', 'Aquatic floral', 'Gourmand floral'],
    applicationTips: 'Caribbean heat amplifies fragrance significantly — err on the side of less. Spray on wrists and neck only for outdoor weddings. Reapply lightly after 4–6 hours.',
    longevityTips: 'Layering with a matching body cream adds hours of wear. Tropical heat can make lighter fragrances last longer.',
    considerations: 'Choose a fragrance that complements rather than competes with tropical floral arrangements.',
  },
  'arab': {
    communityId: 'arab',
    traditionalScents: ['Oud', 'Rose', 'Amber', 'Musk', 'Saffron', 'Frankincense', 'Neroli'],
    recommendedFamilies: ['Amber', 'Rich amber', 'Floral amber', 'Musky amber'],
    applicationTips: 'Arabic perfume tradition is of generous sillage — the bride should leave a beautiful scent memory. Apply oud oil to pulse points, spray eau de parfum as a finishing touch. Never spray directly on fabric.',
    longevityTips: 'Pure oud oil applied to wrists, neck, and behind knees lasts for many hours. Layer with a matching spray for room-filling projection.',
    considerations: 'Gulf brides often receive gifted oud-based perfumes. Oud is a wedding fragrance — it carries cultural weight and should be chosen carefully.',
  },
  'latina': {
    communityId: 'latina',
    traditionalScents: ['Gardenia', 'Tuberose', 'White floral', 'Warm amber', 'Vanilla musk'],
    recommendedFamilies: ['White floral', 'Warm floral amber', 'Floral amber'],
    applicationTips: 'Apply to pulse points only, for a scent that is noticeable but not overwhelming. Reapply after the ceremony if needed.',
    longevityTips: 'Moisturize skin before spraying. Layer with matching body lotion for 8+ hour wear.',
  },
  'east-asian': {
    communityId: 'east-asian',
    traditionalScents: ['Osmanthus', 'Peony', 'Cherry blossom', 'Yuzu', 'White tea', 'Jasmine'],
    recommendedFamilies: ['Light floral', 'Aquatic', 'Soft amber', 'Clean floral'],
    applicationTips: 'East Asian bridal tradition leans toward delicate, close-to-skin fragrance rather than large sillage. Apply lightly to wrists and neck.',
    longevityTips: 'Japanese and Korean fragrance culture prizes subtle radiance — a trail that people notice when close. Choose an EDP for longer wear without projecting too strongly.',
  },
  'east-african': {
    communityId: 'east-african',
    traditionalScents: ['Oud', 'Myrrh', 'Frankincense', 'Rose', 'Sandalwood', 'Amber'],
    recommendedFamilies: ['Amber', 'Woody amber', 'Floral amber'],
    applicationTips: 'East African bridal fragrance follows a similar tradition to Arabic perfumery. Oud oil and incense resins are traditional. Apply oud oil directly to pulse points.',
    longevityTips: 'Burn incense (oud or bukhoor) near clothing during prep for fabric fragrance tradition.',
  },
  'south-african': {
    communityId: 'south-african',
    traditionalScents: ['Fynbos', 'Rooibos', 'Buchu', 'Wild rose', 'African floral'],
    recommendedFamilies: ['South African botanical florals', 'Light warm florals', 'Earthy botanical'],
    applicationTips: 'Southern African botanical traditions are increasingly celebrated in fragrance. Look for local South African perfumers for unique bridal scents.',
    longevityTips: 'Apply to moisturized skin. Marula oil base holds fragrance beautifully.',
  },
  'black-american': {
    communityId: 'black-american',
    traditionalScents: ['Rose', 'Amber', 'Vanilla', 'Jasmine', 'Musk', 'Oud'],
    recommendedFamilies: ['Floral amber', 'Warm amber', 'Musky floral', 'Soft amber'],
    applicationTips: 'Bold, beautiful fragrance that fills the room. Apply to pulse points generously. Classic American bridal fragrance choices include iconic white florals and warm amber fragrances.',
    longevityTips: 'Layer fragrance with matching lotion and body wash for layered, long-lasting scent profile.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// COMMUNITY LOOKUP FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export function getBridalGuide(communityId) {
  const directMap = {
    'west-african': BRIDAL_PREP_TIMELINES['west-african'],
    'south-asian': BRIDAL_PREP_TIMELINES['south-asian'],
    'caribbean': BRIDAL_PREP_TIMELINES['caribbean'],
    'arab': BRIDAL_PREP_TIMELINES['arab'],
    'latina': BRIDAL_PREP_TIMELINES['latina'],
    'east-asian': BRIDAL_PREP_TIMELINES['east-asian'],
    'east-african': BRIDAL_PREP_TIMELINES['east-african'],
    'south-african': BRIDAL_PREP_TIMELINES['south-african'],
    'black-american': BRIDAL_PREP_TIMELINES['black-american'],
  };
  return directMap[communityId] || null;
}

export function getBridalPerfumeGuide(communityId) {
  const directMap = {
    'west-african': BRIDAL_PERFUME_GUIDE['west-african'],
    'south-asian': BRIDAL_PERFUME_GUIDE['south-asian'],
    'caribbean': BRIDAL_PERFUME_GUIDE['caribbean'],
    'arab': BRIDAL_PERFUME_GUIDE['arab'],
    'latina': BRIDAL_PERFUME_GUIDE['latina'],
    'east-asian': BRIDAL_PERFUME_GUIDE['east-asian'],
    'east-african': BRIDAL_PERFUME_GUIDE['east-african'],
    'south-african': BRIDAL_PERFUME_GUIDE['south-african'],
    'black-american': BRIDAL_PERFUME_GUIDE['black-american'],
  };
  return directMap[communityId] || null;
}

export function getBridalTouchUpKit(communityId) {
  const directMap = {
    'west-african': BRIDAL_TOUCHUP_KITS['west-african'],
    'south-asian': BRIDAL_TOUCHUP_KITS['south-asian'],
    'caribbean': BRIDAL_TOUCHUP_KITS['caribbean'],
    'arab': BRIDAL_TOUCHUP_KITS['arab'],
    'latina': BRIDAL_TOUCHUP_KITS['latina'],
    'east-asian': BRIDAL_TOUCHUP_KITS['east-asian'],
    'east-african': BRIDAL_TOUCHUP_KITS['east-african'],
    'south-african': BRIDAL_TOUCHUP_KITS['south-african'],
    'black-american': BRIDAL_TOUCHUP_KITS['black-american'],
  };
  return directMap[communityId] || null;
}

export function getMUAGuide(communityId) {
  return {
    universal: MUA_SELECTION_GUIDE.universalCriteria,
    community: MUA_SELECTION_GUIDE.byCommunity[communityId] || [],
  };
}

