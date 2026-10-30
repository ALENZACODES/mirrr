/**
 * MIRRR Bridal Beauty Guide
 * Complete wedding day beauty across cultures
 * South Asian, Arab, West African, Latin American, East Asian bridal traditions
 */

// ─── BRIDAL BEAUTY FUNDAMENTALS ───────────────────────────────────────────────

export const BRIDAL_FUNDAMENTALS = {
  timeline: {
    '12_months': {
      title: '12 Months Before',
      tasks: [
        'Start a consistent skincare routine — results take months to show',
        'Begin seeing a dermatologist if you have PIH, acne, melasma, or other concerns',
        'Note: most prescription treatments (tretinoin, hydroquinone) need 6+ months to show results',
        'Start protecting against future sun damage with daily SPF — new sun damage undoes gains from treating past damage',
        'Begin hair health routine — oils, deep conditioning and protein treatments depending on hair type',
      ],
    },
    '9_months': {
      title: '9 Months Before',
      tasks: [
        'Trial facial treatment — decide on regular facials, chemical peels, or laser (if laser, allow 6 months minimum for full skin recovery)',
        'Begin regular monthly facials for even skin texture by wedding day',
        'Start waxing if you plan to on the wedding day — skin adjusts over 3–4 sessions; first wax is the most reactive',
        'Commit to hair length goal — stop cutting if growing; start targeted treatments',
        'Book your bridal MUA (makeup artist) — good ones book 12–18 months out, especially in South Asian and Arab communities',
      ],
    },
    '6_months': {
      title: '6 Months Before',
      tasks: [
        'Book your bridal hair stylist if not already done',
        'Trial run of your bridal look — this is NOT optional. See how the look photographs. See how it lasts.',
        'Order any specialised products (Kumkumadi, specific attar, wedding jewellery you\'ll wear)',
        'Decide on threading/waxing/laser hair removal for face and body',
        'If doing laser hair removal, start NOW (multiple sessions needed)',
        'Begin intensive hair conditioning program — weekly deep conditioning or masking',
      ],
    },
    '3_months': {
      title: '3 Months Before',
      tasks: [
        'Second bridal trial if the first needed significant changes',
        'Finalise MUA and hair stylist contracts',
        'Source all bridal beauty products — don\'t leave to last minute',
        'Begin specific bridal skin prep: vitamin C in AM, retinol building up in PM (stop both 2 weeks before wedding)',
        'Regular body exfoliation to prep for body makeup if planned',
        'Schedule mehndi appointment (henna for South Asian brides — minimum 48 hours before wedding)',
      ],
    },
    '1_month': {
      title: '1 Month Before',
      tasks: [
        'Finalise all bridal looks (face, hair, body)',
        'Have your final pre-bridal facial treatment NO LATER than 2 weeks before wedding (allow recovery)',
        'Stop retinol and strong acids 2 weeks before wedding',
        'Stock up on touch-up kit for the wedding day',
        'Thread/wax eyebrows no later than 1 week before (but NO SOONER than 48 hours before)',
        'DO NOT try any new products or treatments this close to the wedding',
      ],
    },
    '1_week': {
      title: '1 Week Before',
      tasks: [
        'Final brow threading or waxing',
        'Hair treatment / blow-out / oiling',
        'Get full body massage and scrub (hammam, ubtan, or spa) — allow 3–5 days recovery for any reactions',
        'Pre-bridal facial ONLY if your skin is well-tested for this treatment',
        'Mehndi application (South Asian brides) — ideally 48–72 hours before ceremony',
        'Nail appointment',
        'Lay out all products, tools, and accessories for wedding morning',
      ],
    },
    'wedding_day': {
      title: 'Wedding Day',
      schedule: [
        'Wash hair night before (for updos — freshly washed hair is too slippery for styles)',
        'Cleanse face with gentle cleanser; follow with regular skincare minus retinol',
        'Apply a hydrating face mask 1–2 hours before makeup',
        'MUA arrives: primer, base, eye, contour, cheek, highlight, lip',
        'Hair stylist arrives or you go to them',
        'Jewellery on AFTER makeup (to avoid powder fallout on necklace etc)',
        'Final setting spray',
        'Bridal touch-up kit in bag',
      ],
    },
  },
};

// ─── SOUTH ASIAN BRIDAL BEAUTY ────────────────────────────────────────────────

export const SOUTH_ASIAN_BRIDAL = {
  community: 'South Asian (Indian, Pakistani, Bangladeshi, Sri Lankan)',
  overview: 'South Asian bridal beauty is among the most elaborate and deeply cultural in the world. A full bridal look can take 4–8 hours and involves multiple specialists.',
  ceremonies: {
    mehndi_ceremony: {
      name: 'Mehndi Ceremony',
      what: 'Pre-wedding celebration where intricate henna designs are applied to the bride\'s hands and feet, and sometimes bridesmaids and guests',
      timing: '1–3 days before the wedding',
      mehndi_designs: {
        rajasthani: 'Traditional North Indian — fine lines, intricate, often includes the groom\'s name or initials hidden in the pattern',
        arabic: 'Bolder, more spaced-out floral and geometric — popular for modern brides',
        indo_arabic: 'Fusion of both — currently most popular among South Asian diaspora brides',
        gujarati: 'Traditional Gujarati style — unique geometric patterns specific to the region',
      },
      bride_beauty_for_mehndi: [
        'Fresh, glowing skin — this is typically a more natural look day',
        'Bold eyes with subtle lip or vice versa',
        'Floral or traditionally styled hair (flowers in hair are traditional)',
        'Light, wearable jewellery — save the heavy pieces for the main day',
      ],
    },
    haldi_ceremony: {
      name: 'Haldi Ceremony',
      what: 'Turmeric paste applied to bride and groom\'s skin by family members — a ritual cleansing and skin preparation ceremony',
      what_it_does: [
        'Turmeric is antibacterial and anti-inflammatory',
        'Brightens skin naturally',
        'Is a communal act of love — family members apply it one by one',
        'Creates the iconic yellow-stained skin look that washes off and leaves glowing skin',
      ],
      when: 'Morning of the wedding or day before',
      traditional_ubtan: {
        ingredients: ['Besan (chickpea flour)', 'Turmeric', 'Sandalwood powder', 'Rose water or milk', 'Optional: raw honey, saffron'],
        application: 'Mixed to paste, applied by family members to face, neck, arms, and legs',
        duration: 'Left 20–30 minutes, then washed off',
      },
      caution: 'Turmeric stains. Everything. Everywhere. Wear old yellow clothes (traditionally yellow is worn). The stain washes off skin in 1–2 days.',
    },
    shaadi_wedding: {
      name: 'Shaadi (Wedding Ceremony) Look',
      characteristics: [
        'Full coverage, long-wear bridal foundation',
        'Heavy contouring and sculpting',
        'Cut crease or fully blended eyeshadow look with gold/burgundy/deep tones',
        'Glitter or shimmer on eyes',
        'Kohl on waterline (MUST — traditional and beautiful)',
        'Bold red lip (traditional) or deep burgundy, wine, or mauve (modern)',
        'Intense bindi placement after makeup is set',
        'Maang tikka, jhoomar or other head jewellery',
      ],
      hair: {
        traditional: 'Elaborate bun (juda) with flowers, tikka, and maang tikka',
        modern: 'Loose waves, braids, or half-up with heavy embellishment',
        flowers: 'Mogra (jasmine) or roses are traditional — gajra (jasmine string) around bun or down a braid',
      },
    },
    sangeet: {
      name: 'Sangeet (Music & Dance Night)',
      look: 'Festive but slightly lighter than the main wedding. Can be more experimental with colour. This is the night for the fun outfit and slightly more playful look.',
      beauty: 'Bold eye or bold lip, glowing base, jewellery that moves with you on the dance floor',
    },
  },
  south_asian_bridal_products: {
    foundation: {
      recommendations: [
        { name: 'Kay Beauty Hydrating Foundation', note: 'Katrina Kaif\'s brand, with shades for South Asian skin tones',  buy_from: 'Nykaa' },
        { name: 'Huda Beauty #FauxFilter Foundation', note: 'Wide shade range, long-wear' },
        { name: 'Make Up For Ever Ultra HD Foundation', note: 'Used by South Asian MUAs for photography-proof finish' },
      ],
    },
    bindi: {
      what: 'Decorative dot worn in the centre of the forehead — sacred to Hinduism (ajna chakra) and also a cultural beauty mark across South Asia regardless of religion',
      how_to: 'Applied after all makeup is complete. Position slightly above the natural space between brows. Press firmly.',
      types: { traditional: 'Red circular kumkum (vermillion paste) for married Hindu women', decorative: 'Adhesive crystal, velvet, or metallic bindis in any colour for fashion' },
    },
  },
};

// ─── ARAB/MIDDLE EASTERN BRIDAL ───────────────────────────────────────────────

export const ARAB_BRIDAL = {
  community: 'Arab/Middle Eastern (Saudi, Lebanese, Moroccan, Jordanian, Egyptian)',
  overview: 'Arab bridal beauty is architectural and editorial — contour that creates sculpture, eyes that are dramatic and precise, skin that is flawless and luminous.',
  traditions: {
    hammam_bridal: {
      name: 'Pre-Bridal Hammam',
      what: 'Traditional bathing ritual — the bride visits the hammam with female family members for a pre-wedding purification and beauty ritual',
      includes: ['Savon beldi (black soap) full-body cleanse', 'Kessa glove full-body exfoliation', 'Ghassoul clay hair and face mask', 'Rose water rinse', 'Argan oil body treatment'],
      when: '1–3 days before the wedding',
      region: 'Most common in Moroccan, Lebanese, Algerian, and North African communities',
    },
    zaffa: {
      name: 'Zaffa (Wedding Procession)',
      what: 'Traditional Arab wedding procession involving drummers, music, and celebration — the bride makes a grand entrance',
      beauty_for_zaffa: 'The most photographed and videoed moment — full bridal look must be perfect. Often the heaviest makeup application of the day.',
    },
  },
  arab_bridal_look: {
    base: [
      'Full-coverage, long-wear matte foundation',
      'Professional setting spray',
      'Multiple setting techniques (baking under eyes and face)',
    ],
    eyes: [
      'Heavily kohl-lined (traditional Arabic eye)',
      'Dramatic eyeshadow in warm neutrals or jewel tones',
      'False lashes (dramatic, not natural)',
      'Precise cut crease or arabic style eye (blended kohl with heavy lower liner)',
    ],
    brows: [
      'Precisely filled, arched brows — the most "architectural" of all bridal brow styles',
      'Defined front, high arch, tapered tail',
      'Often laminated or tinted brows as base',
    ],
    lips: [
      'Classic bridal: nude to soft pink (to keep attention on the eyes)',
      'Modern Arab bridal: deep berry, plum, or red for a statement',
    ],
    hair: [
      'Elaborate updo with volume at crown',
      'Often accessorised with crystal hair piece or traditional head covering',
      'Veil or shayla incorporated',
    ],
    fragrance: 'Oud is essential — layered with bakhoor on the dress and attar on pulse points',
  },
  arab_bridal_mua_culture: {
    
    characteristics_of_arab_mua_style: [
      'Extremely precise, editorial technique',
      'Heavy but flawless-looking base',
      'Camera-ready and photography-optimised',
      'Often more theatrical than Western bridal beauty',
    ],
  },
};

// ─── WEST AFRICAN BRIDAL ──────────────────────────────────────────────────────

export const WEST_AFRICAN_BRIDAL = {
  community: 'West African (Nigerian, Ghanaian, Senegalese, Ivorian)',
  overview: 'West African bridal beauty celebrates abundance — rich colour, luminous skin, elaborate headwraps (gele), and dramatic jewellery. The bride is royalty.',
  traditions: {
    gele: {
      name: 'Gele (Nigerian Headwrap)',
      what: 'Elaborate head-tied fabric wrap — an art form in itself. A skilled gele tier is as important as a makeup artist for a Nigerian bride.',
      fabrics: ['Aso-Oke (hand-woven, traditional for weddings)', 'Satin', 'Organza', 'Damask'],
      styles: ['Flat gele', 'Tall, sculptural gele', 'Half-gele with twisted detail', 'Low gele'],
      colour: 'Typically matches the aso-ebi (matching fabric worn by bridal party)',
      beauty_consideration: 'Gele frames the face — makeup must balance the drama of the headwear without being swallowed by it. Typically stronger eyes and a statement lip.',
    },
    aso_ebi: {
      name: 'Aso-Ebi',
      what: 'Matching fabric worn by friends and family to show solidarity with the couple. Distinctly West African (Nigerian, Ghanaian) practice.',
      beauty_consideration: 'Bridal party coordinates beauty looks to some degree — often same-colour lip, matching colour palette',
    },
    traditional_ceremonies: {
      igbo: {
        name: 'Igbo Traditional Wedding (Igba Nkwu)',
        what: 'The bride pours palm wine and finds her husband in the crowd to offer it to him — a central ritual',
        look: 'Coral beads and elaborate headwear. Rich, regal colours. Heavy face makeup.',
        coral_beads: 'Coral beads are sacred in Igbo and Edo tradition — royalty and wealth marker. Brides often wear coral jewellery passed down through generations.',
      },
      yoruba: {
        name: 'Yoruba Traditional Wedding',
        
        look: 'Heavy gele, matching jewellery, bold makeup',
      },
      ghanaian: {
        name: 'Ghanaian Kente Wedding',
        what: 'Traditional kente cloth woven to order for the wedding',
        look: 'Rich gold and red kente. Traditional hairstyles or natural hair in elaborate styles.',
      },
    },
  },
  west_african_bridal_beauty: {
    base: [
      'Full coverage, long-wear matte foundation',
      'IMPORTANT: Match foundation to neck AND chest (brides often in strapless or low-cut) — West African brides commonly photographed in multiple outfits, so chest and décolletage exposure is common',
      'Heavy-duty setting powder and setting spray',
    ],
    eyes: [
      'Rich, deep eyeshadow — copper, burgundy, gold, chocolate brown',
      'Dramatic cut crease or full smoky eye',
      'Full false lashes (often 3D or dramatic)',
      'Bold brows — defined, full',
    ],
    highlighter: [
      'Rich gold or deep bronze — light pink highlights are not visible on deeper skin tones',
      'Applied to: cheekbones, nose tip, cupid\'s bow, inner corners',
      'INTENSE application — photographs must capture it under flash',
    ],
    lip: [
      'Bold lip common — deep red, berry, or ox blood',
      'Glossy lip popular (glass skin era influence)',
    ],
    recommended_brands: [
      { name: 'Juvia\'s Place eyeshadow palettes', note: 'Pigmented shades that show up on deep skin' },
      { name: 'Fenty Beauty Pro Filt\'r Foundation', note: 'A wide shade range, including deep shades' },
      { name: 'Pat McGrath MatteTrance Lipstick', note: 'Deep shades for melanin-rich lips' },
      { name: 'Make Up For Ever Ultra HD Foundation', note: 'Flash photography tested' },
    ],
  },
};

// ─── EAST ASIAN BRIDAL ────────────────────────────────────────────────────────

export const EAST_ASIAN_BRIDAL = {
  community: 'East Asian (Chinese, Korean, Japanese)',
  overview: 'East Asian bridal beauty ranges from traditional ceremonial looks to the modern K-beauty minimal aesthetic. Many East Asian brides wear multiple looks across different ceremonies.',
  traditions: {
    chinese_traditional: {
      name: 'Chinese Traditional Wedding (Gua Sha and Qipao Look)',
      look: [
        'Red qipao or hanbok (Korean) — classic bridal colour',
        'Traditional heavy opera-influenced makeup: intense rouge cheek, precise red lip',
        'Jade and gold accessories',
        'Elaborate updo with hair ornaments (buyao — dangling hair pins)',
      ],
      modern_chinese: 'Modern Chinese brides often incorporate a white gown Western look + traditional qipao for tea ceremony. Two very different beauty looks.',
    },
    korean: {
      name: 'Korean Wedding Beauty',
      look: [
        'Extremely luminous "dewy" glass skin base',
        'Soft gradient lip (light in corners, pigmented in centre)',
        'Minimal or no eyeshadow — mascara and light liner only',
        'Natural false lashes (very natural-looking)',
        'Hair: elegant updo or soft waves',
        'VERY different from Western bridal — subtlety is the goal',
      ],
      trend: 'Many Korean bridal looks favour a fresh, light "no makeup" finish over heavy glam',
    },
    japanese: {
      name: 'Japanese Shinto Wedding',
      traditional_look: 'Shiromuku (all-white kimono). White face makeup (traditional). This is one of the few remaining contexts where full traditional Japanese court makeup is worn.',
      modern_japanese: 'Most Japanese brides choose between a traditional kimono look and a Western white dress with modern fresh makeup.',
    },
  },
};

// ─── LATIN AMERICAN BRIDAL ────────────────────────────────────────────────────

export const LATIN_AMERICAN_BRIDAL = {
  community: 'Latin American (Mexican, Colombian, Brazilian, Puerto Rican)',
  overview: 'Latina bridal beauty embraces colour, warmth, and celebration. The look is full-glam but festive — more than European bridal but with a warm, sun-kissed quality.',
  quinceanera: {
    name: 'Quinceañera (15th Birthday Celebration)',
    what: 'The Latin American coming-of-age celebration — as significant as a wedding in many families',
    beauty: 'First formal makeup experience for many Latina girls. Often the first time with professional MUA.',
    look: [
      'Youthful but glamorous',
      'Bold colour (often matches the dress)',
      'Age-appropriate glamour — not bridal heavy',
    ],
    note: 'Quinceañera beauty preparation teaches girls about makeup before they need to know for a wedding. Cultural beauty education embedded in celebration.',
  },
  wedding_traditions: {
    dia_de_los_muertos_influence: 'Some modern Latina brides incorporate Día de los Muertos (Day of the Dead) aesthetics into engagement or bridal party photos — sugar skull makeup as art form',
    traditional_beauty: 'Catholic wedding: modest, elegant. The more festive cultural celebration after mass is where the full beauty expression happens.',
    fiesta_look: [
      'Warm, bronzed base — sun-kissed always',
      'Bold colour — red lips are iconic for Latina brides',
      'Statement accessories — large earrings, elaborate hair pieces',
      'Hair: often dramatic — big waves, curls, or elaborate updo',
    ],
  },
};

// ─── BRIDAL TOUCH-UP KIT ──────────────────────────────────────────────────────

export const BRIDAL_TOUCH_UP_KIT = {
  essentials: [
    { item: 'Mini setting spray', use: 'Refresh look and reduce shine throughout day' },
    { item: 'Your lipstick (full size)', use: 'The one item you\'ll reapply most — especially before cake' },
    { item: 'Translucent setting powder compact', use: 'Blot and set; avoid foundation (looks cakey)' },
    { item: 'Clear lip gloss', use: 'For "just kissed" refresh between photos' },
    { item: 'Blotting papers', use: 'Remove excess oil without disturbing makeup' },
    { item: 'Individual lash glue', use: 'If a lash lifts' },
    { item: 'Concealer', use: 'The exact shade you\'re wearing; for any smudging under eyes' },
    { item: 'Clear brow gel', use: 'Keeps brows in place all day' },
    { item: 'Fragrance rollerball or tiny attar bottle', use: 'Touch-up scent throughout day' },
    { item: 'Facial mist', use: 'Cooling and skin refreshing (rosewater mist works beautifully)' },
    { item: 'Bobby pins (in your hair colour)', use: 'Inevitable styling fixes' },
    { item: 'Safety pins', use: 'Unexpected wardrobe needs' },
  ],
  what_moh_should_have: 'The Maid of Honour / Chief Bridesmaid should carry the touch-up kit. The bride shouldn\'t be carrying anything.',
  for_ethnic_brides: 'For South Asian and West African brides with especially elaborate looks: ask your MUA for a touch-up tutorial. They should show you (and your MOH) exactly how to fix the most likely issues: kohl smudge, lipstick after eating, any highlighting refresh.',
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getBridalTimelineForCommunity(communityId) {
  const communityGuides = {
    'south-asian': SOUTH_ASIAN_BRIDAL,
    'arab': ARAB_BRIDAL,
    'west-african': WEST_AFRICAN_BRIDAL,
    'east-african': WEST_AFRICAN_BRIDAL,
    'east-asian': EAST_ASIAN_BRIDAL,
    'latina': LATIN_AMERICAN_BRIDAL,
    'caribbean': LATIN_AMERICAN_BRIDAL,
  };
  return {
    timeline: BRIDAL_FUNDAMENTALS.timeline,
    communitySpecific: communityGuides[communityId] || null,
    touchUpKit: BRIDAL_TOUCH_UP_KIT,
  };
}

export function getBridalTimeline() {
  return BRIDAL_FUNDAMENTALS.timeline;
}

export function getTouchUpKit() {
  return BRIDAL_TOUCH_UP_KIT;
}

export function getBridalTraditions(communityId) {
  const guides = {
    'south-asian': SOUTH_ASIAN_BRIDAL,
    'arab': ARAB_BRIDAL,
    'west-african': WEST_AFRICAN_BRIDAL,
    'east-asian': EAST_ASIAN_BRIDAL,
    'latina': LATIN_AMERICAN_BRIDAL,
  };
  return guides[communityId] || null;
}

