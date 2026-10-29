/**
 * MIRRR Seasonal Skincare Guide
 * How skin changes across seasons, how to adapt your routine,
 * and ethnic/climate-specific seasonal beauty wisdom
 */

// ─── SEASONAL SKIN SCIENCE ────────────────────────────────────────────────────

export const SEASONAL_SKIN_SCIENCE = {
  overview: {
    title: 'Why Seasons Affect Skin',
    explanation: 'Skin is a dynamic organ that responds to environmental conditions. Temperature, humidity, UV intensity, wind, and indoor heating/cooling all affect the skin barrier, sebum production, hydration levels, and melanin activity. Adapting your routine seasonally keeps the skin barrier optimised year-round.',
    key_variables: [
      'Humidity — affects transepidermal water loss (TEWL)',
      'Temperature — affects sebum production and barrier function',
      'UV index — affects melanin production and photoaging',
      'Wind — strips moisture; damages surface skin cells',
      'Indoor climate control — heating dries air; air conditioning also dehydrates',
      'Dietary shifts — seasonal foods affect skin nutrients',
    ],
  },
  sebum_and_temperature: {
    hot_weather: 'Higher temperatures increase sebaceous gland activity — skin produces more sebum. This can worsen acne and shine, clog pores with trapped sweat/sebum/debris.',
    cold_weather: 'Lower temperatures reduce sebum production — skin becomes drier. Combined with low outdoor humidity and dry indoor heating, cold weather severely dehydrates the skin barrier.',
    sweet_spot: 'Mild, moderate humidity conditions (spring/fall in temperate climates) are when most people\'s skin behaves most "normally."',
  },
  TEWL_and_humidity: {
    explanation: 'TEWL (transepidermal water loss) increases when ambient humidity is low. In dry air, water evaporates from skin faster than it can be replenished.',
    summer_humidity: 'In humid summer climates, TEWL is lower — humectants work better because there is moisture in the air to draw in. Lighter moisturisers may suffice.',
    winter_heating: 'Central heating reduces indoor relative humidity to 20-30% (equivalent to desert air). TEWL spikes. The same humectant that worked all summer now draws moisture OUT of deeper skin layers unless sealed with an occlusive.',
    fix: 'In dry winter: apply humectant (HA serum, glycerin) to DAMP skin, seal immediately with emollient/occlusive (moisturising cream, face oil, petrolatum in extreme cases).',
  },
};

// ─── SPRING ───────────────────────────────────────────────────────────────────

export const SPRING_SKINCARE = {
  skin_changes: {
    what_happens: 'Transitional season. Humidity rises from winter lows. Temperatures increase gradually. UV index begins to climb. Skin may still be in "winter dry mode" while environmental conditions are shifting.',
    common_concerns: [
      'Congestion and breakouts — transitioning from heavy winter products; pores warming up and expanding',
      'Flakiness from winter damage still resolving',
      'Uneven skin tone — hyperpigmentation more visible as skin lightens back',
      'Increased sensitivity — skin barrier rebuilding from winter',
    ],
  },
  routine_adjustments: {
    cleansers: 'Can transition from cream/oil cleansers toward lighter gel or foam options as temperatures rise. If skin is still dry, keep cream cleansers through early spring.',
    moisturisers: 'Begin transitioning from rich winter creams to lighter fluid lotions or gel creams. Can introduce a facial oil over the summer moisturiser as skin adjusts.',
    exfoliation: 'Great time to restart regular exfoliation if reduced during winter. Introduce AHAs gently — skin may be sensitised from winter.',
    SPF: 'CRITICAL REMINDER: UV begins intensifying in spring. SPF 30+ becomes essential daily protection, even on cloudy days. Many skip SPF in winter, then get caught out in spring.',
    actives: 'Ideal time to introduce new actives — skin recovers better in moderate temperatures. Good season for vitamin C (antioxidant protection as UV rises), retinoid restart if paused.',
  },
  ethnic_notes: {
    darker_skin: 'Post-winter, melanocytes are more reactive. Spring UV triggers melanin overproduction more readily in Fitzpatrick IV-VI. Consistent SPF and antioxidant vitamin C especially important.',
    south_asian: 'Holi festival in spring — intense skin colours can stain and irritate; coat skin with coconut oil before Holi to create a barrier; double cleanse thoroughly after.',
    east_asian: 'Cherry blossom season — airborne pollen can trigger skin sensitivity and rosacea flares in predisposed individuals.',
  },
};

// ─── SUMMER ───────────────────────────────────────────────────────────────────

export const SUMMER_SKINCARE = {
  skin_changes: {
    what_happens: 'Peak UV season. Highest temperatures and often highest humidity (in temperate/tropical climates). Maximum sebum production. Sweat combines with sebum to clog pores. Melanin production at maximum.',
    common_concerns: [
      'Oiliness and shine — especially T-zone',
      'Acne breakouts — sweat + sebum + bacteria combination',
      'Hyperpigmentation — sun exposure triggers melanin overproduction, darkens existing spots',
      'Heat rash (miliaria) — sweat ducts blocked by occlusive products',
      'Sunburn and UV damage',
      'Dehydration — sweating depletes skin moisture despite humid air',
    ],
  },
  routine_adjustments: {
    cleansers: 'Switch to gel or foaming cleansers for oily skin. Double cleanse essential — sweat, sunscreen (especially water-resistant formulas), and pollution all require thorough removal. BHA (salicylic acid) cleansers helpful for congestion.',
    toners: 'Alcohol-free BHA toner or gentle AHA toner can help manage congestion without stripping.',
    moisturisers: 'Lightest textures — gel moisturisers, fluid lotions. Hyaluronic acid serum under a lightweight moisturiser. Many with oily skin can skip heavy creams entirely and rely on SPF for coverage.',
    SPF: 'SPF 50+ broad spectrum. Reapply every 2 hours in direct sun; every 1.5 hours if swimming. Water-resistant formula if sweating or swimming. PA+++ or PA++++ rating for UVA protection.',
    setting: 'Setting powder or spray extends makeup longevity. Blotting papers for midday oil control — gently press, do not rub (rubbing causes PIH on dark skin).',
    actives: 'Reduce or pause retinoids if experiencing irritation in heat. Vitamin C antioxidant protection highly beneficial. Niacinamide excellent for oil control and pore minimising.',
    night_routine: 'Night is the best time for actives in summer — apply retinoids or AHAs at night; antioxidants in the morning.',
  },
  sweat_and_skin: {
    prickly_heat: 'Miliaria (heat rash) caused by blocked sweat ducts. Avoid heavy occlusives on body in summer. Wear breathable, moisture-wicking fabrics. Niacinamide powder-based products can help.',
    fungal_acne: 'Hot, humid conditions favour Malassezia yeast overgrowth on skin and scalp. Body and forehead breakouts in summer may be fungal (Malassezia folliculitis), not bacterial acne.',
    body_care: 'Shower promptly after sweating. Use gentle, fragrance-free body wash. Azelaic acid or BHA body lotions can treat body acne.',
  },
  ethnic_notes: {
    darker_skin: 'PIH risk is highest in summer. Every UV exposure triggers melanin production that can darken existing PIH marks. CONSISTENT SPF is the single most important habit for Fitzpatrick IV-VI in summer.',
    west_african_caribbean: 'Traditional use of coconut oil as body moisturiser is fine for the body; avoid as facial moisturiser in summer heat — can be comedogenic and may worsen breakouts.',
    south_asian: 'Traditional use of turmeric as skin brightening — caution: turmeric stains skin yellow (can worsen look of uneven tone) and can cause photo-sensitisation. Test patch first.',
    east_asian: 'UV parasols (kaigasa in Japanese tradition) are effective UV protection and excellent summer accessories. Very high SPF usage and rigorous UV avoidance is culturally embedded in East Asian skincare.',
    latina: 'Festival season (Carnival, various summer celebrations) — layer SPF under makeup; carry SPF powder for touch-ups during outdoor events.',
  },
  pool_and_beach: {
    chlorine: 'Chlorine in pools damages the skin barrier and bleaches/damages hair — dark hair and colour-treated hair especially vulnerable. Rinse immediately after pool swimming; apply leave-in conditioner and barrier moisturiser.',
    saltwater: 'Saltwater is drying but has antimicrobial properties. Rinse salt off skin and hair promptly after ocean swimming; moisturise immediately.',
    sunscreen_and_swimming: 'Apply water-resistant SPF 30-50 min before water entry. Reapply every 40-80 min while swimming (per product label).',
  },
};

// ─── AUTUMN / FALL ────────────────────────────────────────────────────────────

export const AUTUMN_SKINCARE = {
  skin_changes: {
    what_happens: 'Second transitional season. Temperatures drop, humidity begins to fall. UV decreases but remains significant (still needs SPF). Skin begins to produce less sebum. Indoor heating starts — begins to drop indoor humidity.',
    common_concerns: [
      'Skin beginning to feel tighter and drier',
      'Post-summer PIH assessment — hyperpigmentation from UV exposure most visible',
      'Congestion resolving from summer, or lingering breakouts',
      'Sensitivity to temperature swings (between outdoor cold and indoor warmth)',
    ],
  },
  routine_adjustments: {
    cleansers: 'Transition back toward creamier or oil-based cleansers as skin dries. Keep the double cleanse.',
    moisturisers: 'Begin adding richer moisturisers. Introduce ceramide-rich creams. Consider a face oil at night.',
    exfoliation: 'Great time to address post-summer pigmentation. AHA treatment — glycolic or lactic acid — fades summer PIH and sun damage. Mandelic acid for darker skin.',
    actives: 'Best season to restart retinoids (if paused in summer). UV is lower; skin tolerates retinoids better without sun sensitisation. Restart slowly — once weekly, build up.',
    SPF: 'Common mistake: reducing SPF in autumn. UVA rays (aging, pigmentation) are constant year-round regardless of temperature or weather. Broad-spectrum SPF 30 daily all year.',
    treatments: 'Chemical exfoliant treatments (AHA peels) are better tolerated in cooler months — lower UV means lower PIH risk after treatments.',
  },
  ethnic_notes: {
    darker_skin: 'October-November ideal for starting/intensifying PIH treatment — lower UV means less triggering of melanin production. Autumn is the best season for aggressive hyperpigmentation protocols.',
    black_american: 'Transition to heavier protective styles and scalp moisturising routines for winter. October-November: add deep conditioning treatments before winter dryness sets in.',
    south_asian: 'Diwali beauty prep — autumnal skin brightening treatments (vitamin C, niacinamide, azelaic acid) 4-6 weeks before Diwali for a glowing result.',
  },
};

// ─── WINTER ───────────────────────────────────────────────────────────────────

export const WINTER_SKINCARE = {
  skin_changes: {
    what_happens: 'Most challenging season for most skin types. Lowest temperatures outside; driest air inside (central heating). TEWL at maximum. Sebum production at minimum. Skin barrier most vulnerable.',
    common_concerns: [
      'Dry, tight, flaky skin — especially cheeks, around nose and mouth',
      'Eczema and rosacea flares',
      'Chapped, cracked lips',
      'Dry, itchy hands and body skin',
      'Dull complexion — slower cell turnover in cold',
      'Cold sores triggered by cold wind',
    ],
  },
  routine_adjustments: {
    cleansers: 'Switch to gentle cream or oil cleansers. Avoid foaming cleansers that strip the acid mantle. Micellar water as first cleanse or single cleanse on no-makeup days.',
    toners: 'Hydrating toners (glycerin-based, essence-type). Avoid any alcohol-based toner.',
    serums: 'Hyaluronic acid serum ESSENTIAL — apply to damp skin. Niacinamide to support barrier. Consider peptides for repair.',
    moisturisers: 'Richest formulas: cream over fluid/lotion. Ceramide-rich moisturisers for barrier repair. Apply while skin is still slightly damp from toner. Consider slugging (petrolatum as final occlusive layer) on very dry nights.',
    face_oils: 'Add a face oil as the final step (traps moisture). Rosehip, marula, argan, jojoba — choose based on skin type. Even oily skin benefits from a light facial oil in winter.',
    SPF: 'COMMON MISTAKE: stopping SPF in winter. UVA year-round. SPF must continue daily — can switch to a lower SPF (30 vs 50) formula if it reduces barrier, but do not skip.',
    lips: 'Lip balm with occlusive ingredients (lanolin, beeswax, shea butter, petrolatum). Apply layered — hydrating core, occlusive over top. Avoid licking lips (saliva dehydrates).',
    actives: 'Introduce retinoids carefully — winter dryness can amplify irritation. Reduce AHA frequency if skin is already irritated. Prioritise barrier repair over exfoliation.',
    humidifier: 'Adding a humidifier to the bedroom is the single most impactful addition to winter skincare — raises ambient humidity to 40-60%, significantly reduces TEWL overnight.',
  },
  slugging: {
    definition: 'Applying a thin layer of petrolatum (Vaseline) as the final step of the PM routine to "slug" — occlude moisture and prevent TEWL overnight.',
    method: 'Complete entire skincare routine first. Take a small amount of petrolatum (pea-to-dime size for face); warm between fingertips; press lightly over face.',
    caution: 'Petrolatum does not cause acne (non-comedogenic) but can trap debris if skin is not clean. Only apply to clean, fully cleansed skin. Those with active fungal acne should be cautious.',
  },
  hands_and_body: {
    hands: 'Hands are exposed to cold and frequent hand-washing; lose barrier function rapidly. Apply hand cream after every wash. Look for ceramides, glycerin, and shea butter. At night, apply thick hand cream and wear cotton gloves to sleep.',
    body: 'Apply body moisturiser immediately after shower while skin is damp (within 60 seconds of drying lightly). Rich lotions with ceramides or shea butter for very dry areas (legs, elbows, knees).',
    bath_temperature: 'Hot showers and baths strip the skin barrier. Lukewarm water only in winter for face and body. Keep showers shorter in winter.',
  },
  ethnic_notes: {
    darker_skin: 'Winter is when ashy skin becomes most noticeable — dry, dead skin cells appear grey-white against darker skin. Daily body moisturising and gentle exfoliation (loofah/body scrub 1-2x per week) prevents ashiness.',
    west_african: 'Traditional shea butter use is ideal for winter — thick, nourishing, forms an occlusive layer. Unrefined shea butter is more potent than refined cosmetic shea.',
    south_asian: 'Sesame and coconut oil body massage (abhyanga) is an excellent winter practice — oils high in fatty acids provide deep nourishment.',
    east_african: 'Frankincense and myrrh resins used as winter skin treatments — anti-inflammatory; evidence-based for wound healing; a traditional practice validated by modern skincare science.',
    east_asian: 'Camellia oil (tsubaki oil in Japan, dongbaek in Korea) is a traditional winter facial oil — high oleic acid content; excellent for dry, aging, or sensitive winter skin.',
    arab: 'Argan oil (Morocco/North Africa), oud body oil, and rose water toner — all excellent winter skin treatments with moisturising and antioxidant properties.',
    latina: 'Traditional chamomile (manzanilla) rinses for sensitive winter skin; aloe vera gel for chapped, irritated skin.',
  },
};

// ─── CLIMATE VARIATIONS ───────────────────────────────────────────────────────

export const CLIMATE_SKINCARE = {
  tropical: {
    climate: 'Tropical (year-round heat and high humidity)',
    characteristics: 'High humidity year-round; limited seasonal variation; high UV year-round; possible rainy/dry season variation.',
    approach: 'Prioritise lightweight, gel formulas year-round. Rigorous SPF habits essential year-round. BHA/salicylic acid for congestion management. Double cleansing critical to remove sweat and sunscreen.',
    communities: 'West African, Caribbean, South Asian (some regions), East African coastal communities.',
  },
  arid: {
    climate: 'Arid/Desert (hot and dry; cold nights)',
    characteristics: 'Low humidity year-round; extreme temperature swings; high UV; dry air dehydrates skin constantly.',
    approach: 'Rich moisturisers and occlusives year-round. Hyaluronic acid essential but MUST be sealed or it draws moisture out in dry air. Physical sunscreen preferred (less skin sensitisation). Mineral water facial mists throughout the day.',
    communities: 'Arab (Middle East/North Africa), some South Asian communities.',
  },
  temperate: {
    climate: 'Temperate (four distinct seasons)',
    characteristics: 'Clear seasonal variation. Most typical context for the 4-season skincare adaptation described above.',
    communities: 'East Asian, South Asian diaspora, Black American, Caribbean diaspora, Latina diaspora in North America and Europe.',
  },
  continental: {
    climate: 'Continental (very cold winters; hot summers)',
    characteristics: 'Extreme temperature variation. Very harsh winters (dry, cold). Hot, humid summers.',
    approach: 'Maximum seasonal adaptation required. Winter barrier repair (ceramides, occlusives, slugging) to extreme degree. Summer switch to lightweight, SPF-heavy, anti-congestion routines.',
    communities: 'South Asian diaspora, East African diaspora, Black American communities in northern US/Canada.',
  },
  mediterranean: {
    climate: 'Mediterranean (hot, dry summers; mild, wetter winters)',
    characteristics: 'Hot dry summers (different from humid tropical summers); mild winters.',
    approach: 'Lightweight SPF-focused summer routine; switch to moderate moisturising in winter rather than full barrier-repair extreme.',
  },
};

// ─── SEASONAL ROUTINE SWITCHERS ───────────────────────────────────────────────

export const SEASONAL_ROUTINE_GUIDE = {
  signs_to_switch: {
    to_winter: [
      'Skin feels tight immediately after cleansing',
      'Moisturiser not lasting as long as usual',
      'Flakiness appearing, especially around nose',
      'SPF feels dry and uncomfortable rather than comfortable',
    ],
    to_summer: [
      'Skin feels oilier than usual by midday',
      'Moisturiser feels heavy and congesting',
      'Breakouts increasing with no other cause',
      'Skin feels "heavy" under current routine',
    ],
  },
  transition_tips: [
    'Change routines gradually — introduce one new product at a time',
    'Keep a skincare journal to track what works in which season for YOUR skin',
    'Use up almost-empty products before full seasonal switch',
    'Climate-controlled environments (offices, planes) affect skin year-round — always moisturise on long-haul flights',
  ],
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getSeasonGuide(season) {
  const seasons = { spring: SPRING_SKINCARE, summer: SUMMER_SKINCARE, autumn: AUTUMN_SKINCARE, fall: AUTUMN_SKINCARE, winter: WINTER_SKINCARE };
  return seasons[season?.toLowerCase()] || null;
}

export function getClimateGuide(climate) {
  return CLIMATE_SKINCARE[climate?.toLowerCase()] || Object.values(CLIMATE_SKINCARE);
}

export function getSeasonalSkinScience() { return SEASONAL_SKIN_SCIENCE; }
export function getSeasonalRoutineGuide() { return SEASONAL_ROUTINE_GUIDE; }

export function getEthnicSeasonalNotes(communityId, season) {
  const seasonData = getSeasonGuide(season);
  if (!seasonData?.ethnic_notes) return null;
  const key = communityId?.replace('-', '_');
  return seasonData.ethnic_notes[key] || seasonData.ethnic_notes;
}

export const SEASONAL_SKINCARE_STATS = {
  seasons: 4,
  climates: Object.keys(CLIMATE_SKINCARE).length,
  communities: 9,
};
