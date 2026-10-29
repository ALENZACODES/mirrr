/**
 * seasonal_beauty_guide.js — Seasonal and climate-adjusted beauty guides for ethnic communities
 * How to adjust your beauty routine for season, climate, and environment
 */

// ─── SEASONS ─────────────────────────────────────────────────────────────────

export const SEASONS = {
  spring: { id: 'spring', label: 'Spring', icon: '🌸', months: [3, 4, 5] },
  summer: { id: 'summer', label: 'Summer', icon: '☀️', months: [6, 7, 8] },
  autumn: { id: 'autumn', label: 'Autumn / Fall', icon: '🍂', months: [9, 10, 11] },
  winter: { id: 'winter', label: 'Winter', icon: '❄️', months: [12, 1, 2] },
  tropical_wet: { id: 'tropical_wet', label: 'Tropical Wet Season', icon: '🌧️', months: [] },
  tropical_dry: { id: 'tropical_dry', label: 'Tropical Dry Season', icon: '🌴', months: [] },
};

// ─── CLIMATE TYPES ────────────────────────────────────────────────────────────

export const CLIMATES = {
  temperate: { id: 'temperate', label: 'Temperate (UK, NE USA, Canada)', seasonal: true },
  tropical_humid: { id: 'tropical_humid', label: 'Tropical Humid (Caribbean, West Africa, South India)', seasonal: false },
  semi_arid: { id: 'semi_arid', label: 'Semi-arid / Desert (Middle East, North Africa, Southern Africa)', seasonal: false },
  mediterranean: { id: 'mediterranean', label: 'Mediterranean (Southern Europe, California)', seasonal: true },
  cold: { id: 'cold', label: 'Cold / Nordic', seasonal: true },
};

// ─── SEASONAL ROUTINES ────────────────────────────────────────────────────────

export const SEASONAL_ROUTINES = {

  spring: {
    season: 'spring',
    title: 'Spring Refresh',
    skinFocus: 'Repair winter dryness and damage. Lighten heavy products. Introduce actives back gradually.',
    skinTips: [
      'Switch heavy cream to lighter gel-cream moisturiser',
      'Introduce Vitamin C serum after winter — spring is ideal to start brightening treatment',
      'Continue SPF (spring UVB increases significantly)',
      'Exfoliate once weekly to remove dry winter skin buildup',
      'Hyaluronic acid — still needed as humidity begins to return',
    ],
    hairFocus: 'Treat winter damage. Start protective styling season. Moisturise deeply.',
    hairTips: [
      'Intensive protein treatment — winter and indoor heating cause protein loss',
      'Trim split ends before protective styling season',
      'Reduce heavy butters as humidity begins — switch to lighter leave-ins',
      'Begin scalp massage ritual to stimulate spring growth',
    ],
    makeupFocus: 'Lighter coverage, fresh colour palette, SPF in foundation',
    makeupTips: [
      'Swap full-coverage foundation for tinted moisturiser with SPF',
      'Introduce coral, peach, and warm pinks into colour palette',
      'Lighter-coverage setting powder',
      'Warm bronzer instead of heavy contour',
    ],
    communityNotes: {
      'south-asian': 'Spring precedes Holi — incorporate colourful rangoli-inspired eye looks',
      'west-african': 'Spring is wedding season in the diaspora — prep bridal looks now',
      'arab': 'Ramadan often falls in spring/summer — modest beauty with long-wear formulas',
    },
  },

  summer: {
    season: 'summer',
    title: 'Summer Survival',
    skinFocus: 'SPF is non-negotiable. Sweat-proof and humidity-proof everything. Oil control.',
    skinTips: [
      'SPF 50+ every morning — even for Fitzpatrick V-VI, UV damages melanocyte DNA',
      'Lightweight gel or fluid moisturiser only',
      'Niacinamide to control oil production',
      'Micellar water cleanser for gym-bag portability',
      'Blotting papers — always in the bag',
      'Mist with thermal spring water or rosewater to cool and refresh throughout day',
    ],
    hairFocus: 'Protect from UV, chlorine (pools), and salt water. Protective styles. Deep moisture.',
    hairTips: [
      'Wear a hat or hair scarf for UV protection on scalp',
      'Rinse hair with fresh water BEFORE pool or beach (saturated hair absorbs less chlorine)',
      'Protective styles (braids, twists, locs) ideal for summer to minimise manipulation',
      'Deep conditioning mask weekly — summer dehydrates hair',
      'Avoid direct heat styling in summer — the sun is already heat-stressing your hair',
    ],
    makeupFocus: 'Transfer-proof, sweat-proof, SPF in every product. Less is more.',
    makeupTips: [
      'Waterproof mascara and eyeliner only',
      'Long-wear lip stain instead of lipstick',
      'Primer — always, especially silicone-based for humid environments',
      'Setting spray (waterproof formula)',
      'Tinted SPF moisturiser instead of foundation when possible',
      'Bold eye OR bold lip, not both — heat + full face = too much',
    ],
    communityNotes: {
      'caribbean': 'Carnival season — maximum wear-time formulas, waterproof everything, long-lasting lip stain',
      'south-asian': 'Monsoon season for South Asians in UK/diaspora: still need SPF, switch to lightweight formulas',
      'black-american': 'Juneteenth and summer festivals — bold looks, natural hair protective styles',
    },
  },

  autumn: {
    season: 'autumn',
    title: 'Autumn Transition',
    skinFocus: 'Start reintroducing richer products. Address summer hyperpigmentation. Begin retinol if not using.',
    skinTips: [
      'Introduce retinol or bakuchiol now (autumn = less sun exposure = fewer retinol side effects)',
      'Switch to richer moisturiser as temperature drops',
      'Continue SPF — UVA (the aging ray) is year-round',
      'Address summer dark spots with Vitamin C and AHA exfoliation',
      'Increase hyaluronic acid as humidity drops indoors',
    ],
    hairFocus: 'Transition from summer to winter protection. Protein treatments. Moisture balance.',
    hairTips: [
      'Protein treatment in October before heating season begins (indoor heat = dryness)',
      'Heavy butter or cream product to prepare for winter',
      'Consider silk or satin headscarf at night to prevent autumn dry-air frizz',
      'Trim any summer damage before winter',
    ],
    makeupFocus: 'Deeper, richer palette. Fuller coverage returns. Earth tones.',
    makeupTips: [
      'Switch to full-coverage foundation',
      'Introduce autumn palette: burnt orange, terracotta, deep plum, burgundy lip',
      'Deepen brow colour slightly',
      'Fuller lashes for the season',
      'Warm bronzer heavy, cool contour minimal',
    ],
    communityNotes: {
      'south-asian': 'Navratri (9 nights) and Diwali — most beauty-intense season. Colourful festive looks by night, each with cultural significance.',
      'arab': 'Autumn is Eid al-Adha season some years — bold jewel-tone festive looks',
      'east-african': 'Ethiopian New Year (Enkutatash) is September — flower garlands and celebration',
    },
  },

  winter: {
    season: 'winter',
    title: 'Winter Protection',
    skinFocus: 'HYDRATION is everything. Protect the moisture barrier. Thick emollients.',
    skinTips: [
      'Occlusive moisturiser (shea butter, petroleum-based, ceramide-rich) as the final skin step',
      'No harsh exfoliation in winter — skin barrier is already under stress from cold and heat',
      'Hyaluronic acid on damp skin, seal with moisturiser',
      'Facial oils — rosehip, marula, argan — as a barrier booster at night',
      'Lip balm with SPF — lips crack and darken without protection',
      'Sleeping mask 2-3x weekly',
    ],
    hairFocus: 'Maximum moisture retention. Protective styles. Limit heat. Seal with oils.',
    hairTips: [
      'LOC method (liquid, oil, cream) for maximum moisture retention on natural hair',
      'Winter is prime protective style season (braids, twists, locs, wigs)',
      'Scalp oil massages — cold causes reduced blood flow to scalp',
      'Avoid going out in cold with wet hair — it damages the hair shaft',
      'Humidifier in bedroom — indoor heating strips moisture from hair and skin',
      'Satin pillowcase and bonnet to prevent breakage from winter static',
    ],
    makeupFocus: 'Rich, long-lasting, moisturising formulas. The most glam season.',
    makeupTips: [
      'Cream foundation over powder foundation in winter (powder accentuates dryness)',
      'Dewy finish products — luminous and hydrating',
      'Rich, balm-like lip products',
      'Deep, jewel-toned colour palette: emerald, sapphire, burgundy, wine, deep violet',
      'Set with luminous setting spray, not heavy powder',
      'Hydrating primer under foundation',
    ],
    communityNotes: {
      'black-american': 'Kwanzaa (Dec 26 – Jan 1) — red, black, and green colour story. Pan-African aesthetic.',
      'south-asian': 'Christmas and New Year increasingly celebrated by diaspora — the most glamorous ball and party season',
      'arab': 'Winter is Eid season some years — full bridal-level glamour',
      'caribbean': 'Caribbean diaspora: winter is carnival-prep season — sewing and planning begins',
    },
  },

};

// ─── CLIMATE-SPECIFIC GUIDANCE ────────────────────────────────────────────────

export const CLIMATE_GUIDANCE = {

  tropical_humid: {
    climate: 'tropical_humid',
    title: 'Beauty in the Tropics',
    description: 'Hot, humid climates (Caribbean, West Africa, South India, Southeast Asia) require makeup and skincare that can survive sweat, humidity, and heat.',
    skincare: [
      'Lightweight water-based moisturiser only — heavy creams will slide off',
      'SPF 50+ — the equatorial sun is significantly more intense',
      'Blotting papers, powder, and oil-absorbing products are essentials',
      'Niacinamide for oil control in humid conditions',
      'Avoid heavy occlusives on face (fine on body)',
    ],
    makeup: [
      'Silicone primer creates a sweat barrier',
      'Transfer-proof, matte, long-wear foundation',
      'Minimal eye makeup — or set waterproof eyeliner over cream shadow',
      'Lip stain instead of lipstick',
      'Setting spray is critical — mattifying for daytime, dewy for evenings',
      'Full face looks should be reserved for evenings in air-conditioning',
    ],
    hair: [
      'Humidity causes frizz — LOC method with hold product on top',
      'Protective styles are smart: braids, locs, buns, wigs',
      'Natural oils are less needed in humid climate — hair absorbs moisture from air',
      'Anti-humidity products (silicone serums) as final step on styled hair',
      'Scalp can get fungal issues in heat — use tea tree oil in shampoo periodically',
    ],
  },

  semi_arid: {
    climate: 'semi_arid',
    title: 'Beauty in Desert and Arid Climates',
    description: 'Desert and arid conditions (Middle East, North Africa, parts of Sub-Saharan Africa, Australian outback) strip moisture rapidly. Everything must be deeply nourishing and protective.',
    skincare: [
      'Rich, emollient moisturiser — multiple layers if needed',
      'Facial oil as morning first step (squalane, argan, marula)',
      'SPF is critical — desert UV is intense year-round',
      'Lip care daily — lips crack extremely fast in arid conditions',
      'Humidifier at home if possible',
      'Body lotion applied immediately after shower while skin is damp',
    ],
    makeup: [
      'Hydrating serum foundation',
      'Avoid very matte formulas — accentuates dryness visually',
      'Dewy or satin finish',
      'Hydrating setting spray',
      'Cream blush and cream highlight',
    ],
    hair: [
      'Deep conditioning mask weekly',
      'Protective styles to retain moisture',
      'Head coverings are practical AND beautiful in desert — protect from sun and dry wind',
      'Heavier butters and oils for sealing in moisture',
    ],
  },

};

// ─── YEARLY BEAUTY CALENDAR ───────────────────────────────────────────────────

export const YEARLY_BEAUTY_CALENDAR = {
  january: {
    month: 'January',
    focus: 'Winter hydration repair',
    tasks: ['Start retinol if paused in summer', 'Facial oil in routine', 'Protective styles'],
    community_events: ['New Year celebrations (global)', 'Nigerian Christmas (Jan 7 for Orthodox Ethiopian Christians)'],
  },
  february: {
    month: 'February',
    focus: 'Moisture barrier strengthening',
    tasks: ['Weekly sleeping mask', 'Lip care routine', 'Hair growth massage'],
    community_events: ['Carnival season begins (Caribbean diaspora)', 'Chinese New Year (Lunar New Year)'],
  },
  march: {
    month: 'March',
    focus: 'Spring vitamin C launch',
    tasks: ['Introduce brightening serum', 'Spring trim for hair', 'Switch to lighter moisturiser'],
    community_events: ['Holi (South Asian — colour festival)', 'Nowruz (Persian/Iranian New Year)', 'Women\'s History Month'],
  },
  april: {
    month: 'April',
    focus: 'SPF introduction and sun prep',
    tasks: ['SPF 50+ routine established', 'Body exfoliation begins', 'Brow shaping for spring'],
    community_events: ['Eid al-Fitr (some years — Islamic calendar)', 'Easter (global Christian)'],
  },
  may: {
    month: 'May',
    focus: 'Lightweight transition',
    tasks: ['Full switch to lightweight skincare', 'First summer protective style', 'Coral/peach palette transition'],
    community_events: ['Caribbean Heritage Month (UK)', 'Asian Pacific American Heritage Month (US)'],
  },
  june: {
    month: 'June',
    focus: 'Summer prep and SPF',
    tasks: ['Waterproof makeup in bag', 'Protein treatment before sun', 'Blotting papers everywhere'],
    community_events: ['Juneteenth (June 19, US)', 'Caribbean Carnival season peaks', 'Pride Month (globally) — colourful beauty'],
  },
  july: {
    month: 'July',
    focus: 'Sweat-proof everything',
    tasks: ['Transfer-proof lip stain', 'Matte setting spray', 'Cooling facial mist'],
    community_events: ['Independence Day (Caribbean nations)', 'Notting Hill Carnival prep (UK)'],
  },
  august: {
    month: 'August',
    focus: 'Hyperpigmentation treatment',
    tasks: ['AHA exfoliant for summer dark spots', 'Hair protein repair', 'Bold carnival looks'],
    community_events: ['Notting Hill Carnival (UK)', 'Crop Over (Barbados)', 'Caribbean Heritage Month (Canada)'],
  },
  september: {
    month: 'September',
    focus: 'Back to full routine',
    tasks: ['Retinol reintroduction', 'Switch foundation to full-coverage', 'Autumn colour palette begins'],
    community_events: ['Ethiopian New Year (Enkutatash)', 'Navratri begins (South Asian)'],
  },
  october: {
    month: 'October',
    focus: 'Hyperpigmentation correction',
    tasks: ['Vitamin C + AHA combined routine', 'Heavy cream moisturiser reintroduction', 'Deep conditioning treatment'],
    community_events: ['Diwali (South Asian)', 'Hallowe\'en — bold editorial beauty', 'Black History Month (UK/Canada)'],
  },
  november: {
    month: 'November',
    focus: 'Winter preparation',
    tasks: ['Occlusive moisturiser', 'Protective winter styles', 'Deep jewel-tone makeup palette'],
    community_events: ['Diwali (sometimes November)', 'Eid al-Adha (some years)', 'South Asian wedding season peak'],
  },
  december: {
    month: 'December',
    focus: 'Maximum glamour month',
    tasks: ['Holiday glam look practice', 'Intensive hair and skin prep for events', 'Festive nail art'],
    community_events: ['Christmas', 'Kwanzaa (Dec 26–Jan 1)', 'Nigerian Christmas parties (owambe season)'],
  },
};

// ─── QUERY FUNCTIONS ─────────────────────────────────────────────────────────

export function getSeasonalRoutine(season) {
  return SEASONAL_ROUTINES[season] || null;
}

export function getAllSeasonalRoutines() {
  return Object.values(SEASONAL_ROUTINES);
}

export function getClimateGuidance(climate) {
  return CLIMATE_GUIDANCE[climate] || null;
}

export function getMonthlyCalendar(month) {
  return YEARLY_BEAUTY_CALENDAR[month] || null;
}

export function getAllMonths() {
  return Object.values(YEARLY_BEAUTY_CALENDAR);
}

export function getCurrentSeasonTips(monthNumber) {
  const springMonths = [3, 4, 5];
  const summerMonths = [6, 7, 8];
  const autumnMonths = [9, 10, 11];
  const winterMonths = [12, 1, 2];
  if (springMonths.includes(monthNumber)) return SEASONAL_ROUTINES.spring;
  if (summerMonths.includes(monthNumber)) return SEASONAL_ROUTINES.summer;
  if (autumnMonths.includes(monthNumber)) return SEASONAL_ROUTINES.autumn;
  if (winterMonths.includes(monthNumber)) return SEASONAL_ROUTINES.winter;
  return null;
}

export const SEASONAL_GUIDE_STATS = {
  seasons: Object.keys(SEASONAL_ROUTINES).length,
  climates: Object.keys(CLIMATE_GUIDANCE).length,
  months: Object.keys(YEARLY_BEAUTY_CALENDAR).length,
};

