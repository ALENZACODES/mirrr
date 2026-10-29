/**
 * bridal_beauty_planner.js — Ethnic bridal beauty planning guide for MIRRR
 * Timelines, rituals, products, and looks for 9 ethnic communities
 */

// ─── BRIDAL TIMELINE ─────────────────────────────────────────────────────────

export const BRIDAL_TIMELINE = {
  twelve_months: {
    timeframe: '12 months before',
    label: '1 Year Out',
    tasks: [
      'Book your bridal makeup artist (the best book up to 18 months in advance)',
      'Begin skincare journey — consult dermatologist for any PIH, scarring, or texture concerns',
      'Book hair trial appointments with potential stylists',
      'Pin your bridal look inspiration across communities, cultures, traditions',
      'Start a nail care routine — grow and strengthen nails naturally',
      'Begin dietary changes for hair and skin health: biotin, collagen, antioxidants',
    ],
    communitySpecific: {
      'south-asian': 'Begin consultation with mehndi artist for bridal mehdi design',
      'west-african': 'Source gele fabric and begin learning or hiring gele tying specialist',
      'arab': 'Research gold jewellery pieces (mahr gifts, bridal jewellery sets)',
      'caribbean': 'Book carnival or festival-inspired bridal look stylists early',
    },
  },

  six_months: {
    timeframe: '6 months before',
    label: '6 Months Out',
    tasks: [
      'Bridal makeup trial #1 — test looks, discuss skin concerns',
      'Hair trial #1 — test styles, extensions, accessories',
      'Intensify skincare: add actives (retinol, AHAs, Vitamin C) slowly',
      'Begin consistent facial routine with professional facials monthly',
      'Nail trial — decide shape, length, and art concept',
      'Deep conditioning hair treatments to prepare for any colour or styling',
      'Begin lymphatic drainage facials if skin tightening is a goal',
    ],
    communitySpecific: {
      'south-asian': 'Second mehndi consultation — finalize design elements',
      'west-african': 'Aso-ebi fabric selection and nail colour coordination meeting',
      'arab': 'Hammam preparation series begins (monthly deep ritual cleanse)',
      'latina': 'Quinceañera-adjacent traditions: book quinceanera-experienced stylists if applicable',
    },
  },

  three_months: {
    timeframe: '3 months before',
    label: '3 Months Out',
    tasks: [
      'Bridal makeup trial #2 — refine the look, photograph under different lighting',
      'Lock in skincare routine — no new products from here on',
      'Final hair trial — test with accessories, veil, headpiece, gele, dupatta, etc.',
      'Source all beauty items: setting spray, touch-up kit, blotting papers',
      'Begin teeth whitening if desired (3 months allows for sensitivity management)',
      'Final nail shape decided, begin prepping cuticles and nails',
    ],
    communitySpecific: {
      'south-asian': 'Ubtan paste skin prep treatment begins (weekly)',
      'west-african': 'Shea body treatment intensive — full body skin prep',
      'arab': 'Kohl practice for eye look (getting consistent application)',
      'east-asian': 'K-beauty facial prep intensive — sheet mask every other day',
    },
  },

  one_month: {
    timeframe: '1 month before',
    label: '1 Month Out',
    tasks: [
      'Final skincare and makeup products locked in — ZERO experimentation',
      'Final nail appointment — confirm shape and design with artist',
      'Brow appointment — final shaping before wedding',
      'Body scrub and moisturizing intensive begins',
      'Last hair colour or treatment (leaves adequate heal time)',
      'Build touch-up kit: foundation, setting spray, lip colour, oil blotting sheets',
    ],
    communitySpecific: {
      'south-asian': 'Mehndi appointment confirmed for 2-3 days before wedding',
      'west-african': 'Final fitting of aso-ebi and gele with full makeup test',
      'arab': 'Gold jewellery cleaned and photographed for insurance',
    },
  },

  one_week: {
    timeframe: '1 week before',
    label: 'Wedding Week',
    tasks: [
      'Facial — gentle hydrating only, no extractions or strong acids',
      'Body waxing or threading (7 days allows any redness to subside)',
      'Eyebrow final tinting if desired',
      'Hydrate intensively: 2.5L water daily, humidifier at night',
      'Sheet mask every evening',
      'Rest, sleep, and reduce stress',
    ],
    communitySpecific: {
      'south-asian': 'Mehndi/haldi ceremony (typically 2-3 days before wedding day)',
      'arab': 'Hammam ritual — full cleanse and exfoliation before wedding',
      'caribbean': 'Cornrow/plait base for protective style under wig or extensions',
      'east-african': 'Incense smoke ritual (body fragrance preparation)',
    },
  },

  wedding_day: {
    timeframe: 'Wedding day',
    label: 'The Day',
    tasks: [
      'Wake 3+ hours before ceremony for full beauty preparation',
      'Cleanse and apply skincare — let it absorb fully before primer',
      'Primer applied, let sit 10 minutes',
      'Foundation application — start from centre of face outward',
      'Concealer under eyes and any hyperpigmentation coverage',
      'Eyes and brows before face powder (to catch fall-out)',
      'Setting powder — especially for oily skin or warm climates',
      'Glow and highlight — applied to high points',
      'Lips — the final step',
      'Setting spray — to lock in look',
    ],
  },
};

// ─── COMMUNITY BRIDAL BEAUTY PROFILES ────────────────────────────────────────

export const COMMUNITY_BRIDAL_PROFILES = {

  'south-asian': {
    communityId: 'south-asian',
    name: 'South Asian Bridal Beauty',
    keyEvents: ['Mehndi/Haldi ceremony', 'Sangeet', 'Nikah or Wedding ceremony', 'Reception'],
    signatureLook: {
      foundation: 'Full coverage with warm gold undertone — flawless but with luminosity',
      eyes: 'Heavy, smoky kohl-lined eyes. Warm brown or red-toned shadow. Dramatic cut crease.',
      brows: 'Defined, arched, filled with brow gel — often with slight tail extension',
      lips: 'Bold — deep red, wine, or berry. Often the centrepiece of the bridal look.',
      highlight: 'Gold highlight on cheeks, cupid bow, and brow bone',
      blush: 'Warm peachy-rose or deep rose, blended high',
    },
    hairStyles: ['Bridal juda (elaborate updo)', 'Mang tikka centrepiece', 'Flowers or flowers + maang tikka'],
    jewellery: ['Maang tikka (headpiece)', 'Nath (nose ring)', 'Jhumka earrings', 'Choker + haar (necklace)', 'Bajuband (arm band)', 'Patta (nose chain)', 'Kamar bandh (waist chain)'],
    rituals: ['Haldi — turmeric skin brightening', 'Mehndi — bridal henna', 'Ubtan — traditional scrub'],
    notes: 'South Asian bridal makeup is the most elaborate in the world for a reason — the multiple events, the extensive jewellery, and the cultural weight of each element require a full beauty team.',
  },

  'west-african': {
    communityId: 'west-african',
    name: 'West African (Nigerian) Bridal Beauty',
    keyEvents: ['Traditional ceremony', 'Nikah (Islamic weddings)', 'Church/registry ceremony', 'Reception/Owambe'],
    signatureLook: {
      foundation: 'Flawless skin with heavy coverage — "beat" is the aesthetic, every pore covered',
      eyes: 'Dramatic cut crease or halo eye. Heavy false lashes. Glitter or shimmer lid.',
      brows: 'Perfectly sculpted, strong brows — sharp edge, full fill',
      lips: 'Bold colour — often matching or complementing the aso-ebi. Burgundy, red, or nude satin.',
      highlight: 'Intense highlight — a "glow" that reads across the room',
      blush: 'Deep toned blush, often warm red or bronze for Fitzpatrick V-VI',
    },
    hairStyles: ['Gele (essential — fabric headpiece)', 'Weave or wig for natural look', 'Braided updo for traditional events'],
    jewellery: ['Coral beads (Yoruba tradition)', 'Gold', 'Aso-oke accessories'],
    rituals: ['Shea body treatment', 'African black soap facial series'],
    notes: 'Nigerian weddings last for days. The beauty look must be photogenic, bold enough to read in large reception halls, and long-wearing through dancing and celebrating.',
  },

  'arab': {
    communityId: 'arab',
    name: 'Arab Bridal Beauty',
    keyEvents: ['Nikah (Islamic marriage contract)', 'Henna night', 'Wedding ceremony', 'Walima (reception)'],
    signatureLook: {
      foundation: 'Matte, full-coverage, flawless. Build from forehead, fade into neck',
      eyes: 'THE centrepiece. Intensely smudged kohl, sometimes golden or deep shadow lid, heavy lashes',
      brows: 'Strong, defined with hard edge. Kohl-defined underneath in some traditions.',
      lips: 'Often kept soft and natural-nude to balance the drama of the eyes — or bold berry',
      highlight: 'Subtle gold or rose gold on high points',
      blush: 'Soft and blended, often barely-there',
    },
    hairStyles: ['Loose waves with ornate headpiece', 'Shela (draped fabric)', 'Elaborate updo with gold pins'],
    jewellery: ['Gold sets — heavy, ornate', 'Khaleeji (Gulf) gold designs', 'Mahr (wedding gift often in gold)'],
    rituals: ['Hammam ritual', 'Henna night (ladies only celebration)', 'Oud incense'],
    notes: 'Arab bridal beauty spans enormous diversity — Gulf Arab, Levantine, North African, and Iraqi brides all have different regional traditions. Eyes are almost universally the dominant feature.',
  },

  'east-asian': {
    communityId: 'east-asian',
    name: 'East Asian Bridal Beauty',
    keyEvents: ['Tea ceremony', 'Wedding ceremony', 'Reception', 'Post-wedding photoshoot (Korean "pre-wedding shoot")'],
    signatureLook: {
      foundation: 'Luminous, dewy, skin-like. Korean bridal makeup celebrates skin.',
      eyes: 'Subtle or bold depending on regional tradition. Korean: dewy lid, lash focus. Chinese: red eye liner (good luck)',
      brows: 'Soft and natural or defined — community-specific',
      lips: 'Often a statement red (Chinese tradition) or soft pink-nude (Korean tradition)',
      highlight: 'Subtle dewiness throughout face — "aura" effect',
      blush: 'Soft, high on cheeks — flushed and natural',
    },
    hairStyles: ['Korean traditional hanbok hairstyle', 'Western updo for modern ceremonies', 'Chinese qipao red dress with elaborate updo'],
    jewellery: ['Jade (Chinese tradition)', 'Gold hanboks and hairpieces (Korean)', 'Porcelain and cloisonné accessories'],
    rituals: ['Gua sha facial pre-wedding series', 'Rice water hair treatment', 'Multi-step skin prep for glass skin'],
    notes: 'East Asian bridal looks vary widely — Chinese traditional vs modern, Korean pre-wedding shoots are a whole industry. The Korean "pre-wedding" photoshoot tradition is globally influential.',
  },

  'caribbean': {
    communityId: 'caribbean',
    name: 'Caribbean Bridal Beauty',
    keyEvents: ['Beach or resort ceremony', 'Reception', 'Second-line parade (some traditions)'],
    signatureLook: {
      foundation: 'Luminous with sun-kissed finish. Strong SPF base. Must survive heat and humidity.',
      eyes: 'Warm tropical colour or sultry smoky. Bronze, copper, and warm gold tones.',
      brows: 'Defined, natural-looking',
      lips: 'Coral, warm red, or deep berry — tropical palette',
      highlight: 'Bronze-gold glow — the island sun on your skin',
      blush: 'Warm peach or coral on high cheeks',
    },
    hairStyles: ['Braided updo', 'Goddess braids', 'Natural coils down or half-up', 'Protective style with flowers'],
    jewellery: ['Colourful beads', 'Gold island-inspired pieces', 'Flowers in hair (especially hibiscus)'],
    rituals: ['Coconut oil body treatment', 'Sea salt scrub', 'Aloe vera skin prep'],
    notes: 'Caribbean bridal beauty must contend with humidity, heat, and often outdoor beach settings. Long-wear formulas and setting spray are non-negotiable.',
  },

  'latina': {
    communityId: 'latina',
    name: 'Latina Bridal Beauty',
    keyEvents: ['Catholic church ceremony (often)', 'Reception', 'Quinceañera (15th birthday ceremony)'],
    signatureLook: {
      foundation: 'Warm, golden, glowing. The ideal is bronzed luminosity.',
      eyes: 'Dramatic — smoky eyes with warm bronze or deep shadow. Heavy lashes.',
      brows: 'Thick, defined, strong. The Latine brow is iconic.',
      lips: 'Red or deep red/berry. Bold lip is central to the Latina bridal look.',
      highlight: 'Golden warmth — highlight that reads warm and sun-kissed',
      blush: 'Warm rose or coral — adds warmth and dimensions',
    },
    hairStyles: ['Big soft waves', 'Elaborate updo with flowers', 'Crown braid (trenza)', 'Volume-first always'],
    jewellery: ['Gold — earrings, necklace, bracelet', 'Floral accessories', 'Religious pieces (cross, saint medallion)'],
    rituals: ['Aloe vera skin soothing', 'Rosewater toning', 'Coconut oil hair pre-treatment'],
    notes: 'Latina bridal beauty spans enormous diversity — Mexican, Colombian, Dominican, Puerto Rican, Argentinian, Cuban traditions all differ. Volume in hair and warmth in makeup are consistent.',
  },

};

// ─── QUERY FUNCTIONS ─────────────────────────────────────────────────────────

export function getBridalTimelinePhase(phase) {
  return BRIDAL_TIMELINE[phase] || null;
}

export function getAllBridalTimelinePhases() {
  return Object.values(BRIDAL_TIMELINE);
}

export function getCommunityBridalProfile(communityId) {
  return COMMUNITY_BRIDAL_PROFILES[communityId] || null;
}

export function getAllCommunityBridalProfiles() {
  return Object.values(COMMUNITY_BRIDAL_PROFILES);
}

export function getBridalRitualsForCommunity(communityId) {
  const profile = COMMUNITY_BRIDAL_PROFILES[communityId];
  return profile?.rituals || [];
}

export function getBridalJewelleryForCommunity(communityId) {
  const profile = COMMUNITY_BRIDAL_PROFILES[communityId];
  return profile?.jewellery || [];
}

export const BRIDAL_PLANNER_STATS = {
  timelinePhases: Object.keys(BRIDAL_TIMELINE).length,
  communityProfiles: Object.keys(COMMUNITY_BRIDAL_PROFILES).length,
  communities: Object.keys(COMMUNITY_BRIDAL_PROFILES),
};

