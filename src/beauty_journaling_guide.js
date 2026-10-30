/**
 * MIRRR — Beauty Journaling Guide
 * Tracking skincare progress, building personalised routines through documentation,
 * and the science of beauty journaling for skin of colour.
 */

export const BEAUTY_JOURNALING_BASICS = {
  title: 'Why Beauty Journaling Works',
  summary: 'Beauty journaling is the systematic documentation of skincare, makeup, and haircare products, routines, and results over time. It is not a trend; it is how dermatologists and cosmetic chemists approach product testing. Without documentation, humans are notoriously bad at remembering what a product felt like three weeks ago, whether a breakout preceded or followed a product introduction, or which factor in a multi-product routine change actually caused the improvement.',
  keyPrinciples: [
    'The skin has a natural renewal cycle of approximately 28 days (longer in older adults); this means most products need 28 days of consistent use before their effects can be evaluated — journaling is how you track that period without relying on memory',
    'Confirmation bias is powerful in beauty: if you expect a product to work (or fail), you will perceive it as working (or failing); journaling daily forces you to record data before you have a conclusion to confirm',
    'Ingredient sensitivity can take multiple exposures to become evident (sensitisation); a journal can reveal that the same ingredient appears in multiple products that caused reactions, even when the reactions seemed unrelated at the time',
    'Skin is cyclical: monthly hormonal fluctuations, seasonal changes, diet variation, and sleep affect skin condition; only longitudinal documentation reveals what is cyclical versus what is product-related',
    'Beauty routines tend to accumulate over time without curation; a journal creates an audit trail that makes it clear which products are genuinely doing something versus which are padding'
  ],
  whatToDocument: {
    daily: ['Cleansing step used', 'Products applied (morning and night)', 'Any new product introduced', 'Skin rating (1-10 on hydration, oiliness, irritation, clarity)', 'How much sleep in the past 24 hours', 'Water intake (rough estimate)', 'Menstrual cycle day (for those who cycle)', 'Notable diet changes or unusual food', 'Physical symptoms (stress, illness, exercise)'],
    weekly: ['Photo (same lighting, same angle, same time of day)', 'Overall skin progress rating', 'Products that ran out or were discontinued', 'New products purchased or received', 'Mood and stress level average for the week'],
    monthly: ['Routine review and edit', 'Monthly photo comparison', 'Assessment of ongoing products (continue, discontinue, adjust frequency)', 'Seasonal adjustment consideration', 'Note of any hormonal patterns observed']
  }
};

export const JOURNALING_FORMATS = {
  title: 'Beauty Journal Formats',
  options: {
    physicalJournal: {
      pros: ['No screens at night', 'Can paste samples, swatches, and receipts', 'Doesn\'t require remembering a login', 'Handwriting engages memory more deeply than typing', 'Private by default — no cloud security concerns'],
      cons: ['Not easily searchable', 'Can be lost or damaged', 'Difficult to photograph and share with a dermatologist', 'No analytics or trend visualization'],
      recommended: 'A dot-grid journal (Leuchtturm1917 or similar) with index pages for ingredient tracking'
    },
    spreadsheet: {
      pros: ['Easily searchable', 'Can filter by product, ingredient, reaction', 'Can generate charts of progress scores', 'Shareable with a dermatologist via link', 'Formulas can calculate streak lengths and averages'],
      cons: ['Requires consistent data entry discipline', 'Can feel clinical', 'Less enjoyable for creative tracking'],
      recommended: 'Google Sheets with a master log tab + a separate products library tab + a monthly photo log tab'
    },
    apps: {
      'Think Dirty': 'Scans product barcodes to show ingredient ratings; not a journal but useful alongside one',
      'Yuka': 'Product ingredient scanning and health rating',
      'INCIdecoder': 'Deep ingredient analysis',
      'SkinCoach': 'Dedicated skincare tracking app',
      'Notion': 'Highly customisable database; many community-built beauty tracking templates available free'
    },
    photos: {
      importance: 'Photos are the most objective beauty journal format; skin progress is nearly impossible to perceive subjectively in real time because the change is so gradual; comparing a photo from week 1 to week 12 reveals what day-by-day perception misses',
      protocol: ['Same phone or camera', 'Same room (natural light near a window, or a ring light)', 'Same time of day (morning, before products, is clearest)', 'Same angle (front, and optionally left/right profile)', 'Same facial expression (neutral, relaxed)', 'Include both a full face and a close-up of the primary concern area', 'Store in a dedicated dated folder; never rely on phone camera roll organisation alone']
    }
  }
};

export const ELIMINATION_PROTOCOL = {
  title: 'The Beauty Journal Elimination Protocol',
  summary: 'The most powerful use of a beauty journal is troubleshooting: identifying which product is causing a reaction, which ingredient keeps appearing at breakout times, or which routine change produced an improvement. Without a journal, elimination becomes guesswork.',
  reactionTracking: {
    whenReactionOccurs: [
      'Record immediately: date, time, exactly which products were applied, how long since application the reaction appeared',
      'Photograph the reaction if visible',
      'Note the reaction type: redness, bumps, burning, itching, dryness, flaking, cystic breakout — these can indicate different causes',
      'Do NOT change multiple things at once; when a reaction occurs, the instinct is to strip everything; instead, remove only the most likely suspect (the newest product or the one with the most actives)'
    ],
    ingredientMapping: {
      method: 'After three or more reactions, cross-reference product ingredient lists to find common ingredients; a skincare ingredient scanner (INCIdecoder or INCI Beauty) makes this faster',
      commonCulprits: ['Fragrance (parfum) — most common cause of contact dermatitis in skincare', 'Essential oils (lavender, tea tree, citrus oils) — frequently sensitising', 'Alcohol denat (denatured alcohol) — drying and irritating for sensitive skin', 'SLS/SLES — sulphate surfactants; stripping for dry and sensitive skin', 'Lanolin — can be sensitising (wool allergy cross-reaction)', 'Propylene glycol — rare sensitiser but worth noting if appears in multiple reaction products', 'Specific sunscreen filters (especially chemical filters like oxybenzone, avobenzone) — can sensitise some skin types'],
      documentation: 'In the journal, keep a running list of "suspected sensitisers" and "confirmed sensitisers"; note when an ingredient is confirmed as non-reactive after 4+ weeks of consistent use'
    }
  },
  patchTestJournal: {
    howTo: 'For each new product, document a 48-hour patch test (apply to inner arm, cover with a bandage, check at 24h and 48h); also document the face-introduction process: one new product at a time, minimum 1 week between introductions',
    journalEntry: 'Date of introduction, product name, area of face introduced to first, and a daily rating of any response for the first 2 weeks'
  }
};

export const SKINCARE_ROUTINE_BUILDING_JOURNAL = {
  title: 'Building a Routine Through Journaling',
  steps: {
    step1: {
      title: 'Audit Your Current State',
      tasks: ['List every product you currently use, including frequency and amount', 'Rate your skin in its current state across: hydration, clarity, oiliness, texture, hyperpigmentation, sensitivity', 'Note your primary concern (the one thing you most want to improve)', 'Note your skin type as you currently understand it (dry, oily, combination, normal, sensitive)', 'Photograph your skin in natural light before making any changes']
    },
    step2: {
      title: 'Baseline Tracking (4 Weeks)',
      tasks: ['Use only your current existing products — no changes', 'Daily: rate skin 1-10 on your primary concern and document all products used', 'Weekly: photograph in same conditions', 'End of 4 weeks: review — is your concern getting better or worse with current routine? This is your baseline.']
    },
    step3: {
      title: 'Introduction Phase (4 Weeks Per New Product)',
      tasks: ['Introduce ONE new product at a time', 'Patch test for 48 hours first', 'Apply only to one area of the face for the first week', 'Continue journaling daily: same ratings plus notes on how the new product feels and whether primary concern is improving, static, or worsening', 'At 4 weeks: DECISION — keep or remove?']
    },
    step4: {
      title: 'Long-Term Tracking (Ongoing)',
      tasks: ['Monthly routine reviews to remove products not earning their place', 'Seasonal reviews to adjust for climate changes', 'Annual photo review to see cumulative progress', 'Document ingredient tolerance — ingredients that consistently work for you and ingredients that consistently react']
    }
  }
};

export const HAIR_JOURNAL = {
  title: 'Hair Journaling Guide',
  summary: 'Hair journaling is less common than skincare journaling but equally valuable, especially for textured and colour-treated hair where changes are slow and damage is cumulative.',
  whatToTrack: {
    products: ['Shampoo used (and how often)', 'Conditioner used', 'Deep conditioner used (and how often)', 'Leave-in products', 'Styling products', 'Heat tools used and temperature', 'Any chemical treatments (relaxer, colour, keratin)'],
    hairState: ['Shed count (rough — how much hair in the shower drain or detangling session)', 'Moisture level (0-10)', 'Breakage: are short broken strands visible in styling session?', 'Length check (monthly: measure from scalp to ends)', 'Scalp condition: flaking, itching, tenderness, oiliness'],
    photos: ['Monthly photos: stretched length, and natural coil pattern', 'Photograph after trims with trim date', 'Photograph any significant product or routine change']
  },
  lengthRetention: {
    explanation: 'For Type 3-4 hair, length is often less about growth rate (which is roughly 1.25cm/month for all hair types) and more about length retention — whether the hair that grows is breaking off before it can be retained; a journal is the primary way to detect a breakage problem',
    stretchedLength: 'Measuring stretched length monthly (gently stretch the hair to its full length without tension) is the most accurate way to track growth and retention for curly and coily hair types'
  }
};

export const MAKEUP_JOURNAL = {
  title: 'Makeup Journaling',
  summary: 'Makeup journaling is about product performance tracking and look documentation — recording what works, what doesn\'t, and building a personal guide to replicating looks that succeed.',
  productTracking: {
    openedDates: 'Documenting the date a product was opened matters for preserving product safety — most makeup has a PAO (Period After Opening) symbol (an open jar with a number like "12M" meaning 12 months); opened-date tracking prevents using expired products',
    performance: 'Rate each makeup product on: wear time (in real conditions), colour match (was the shade right?), finish (did it look how expected?), skin effect (did it cause breakouts or dryness?), value',
    shadeMatching: 'For foundations, BB creams, and tinted SPF: journal the exact shade purchased, the undertone, and whether it was a match; foundation shade matching is notoriously difficult for deep and medium-deep melanin-rich skin tones, and a shade journal prevents repeating mistakes'
  },
  lookDocumentation: {
    method: 'After completing a successful makeup look: photograph in daylight and indoor light, list every product used (brand, shade, finish) and the application technique (fingers, brush type, sponge)',
    whyItMatters: 'Memory is not reliable for recreating makeup looks; a documented look is a personal recipe that can be repeated and adapted; this is especially valuable for special occasions where a look is developed and then needs to be recreated'
  }
};

export const ETHNIC_JOURNALING_GUIDE = {
  'west-african': {
    primaryConcerns: 'West African skin typically prioritises: hyperpigmentation documentation (tracking PIH from any spots, marks, or inflammation), barrier health in dry season/harmattan, and even skin tone. Key metric to track: are existing dark spots lightening, stable, or darkening?',
    specialTracking: ['Document Harmattan season routine changes versus rainy season routine', 'Track shea butter sources if making traditional preparations (not all commercial shea butter products are equivalent in quality)', 'PIH tracking: photograph hyperpigmented areas in the same light monthly; subtle changes are easier to see in photos than in the mirror'],
    recommendedJournal: 'A photo-heavy journal (smartphone with monthly comparison grid) plus a simple spreadsheet tracking skin tone uniformity (1-10) and dark spot count'
  },
  'south-asian': {
    primaryConcerns: 'South Asian skin commonly prioritises: melasma management (hormonal, sun-induced), hyperpigmentation from PIH, anti-aging for mature skin (collagen supports), and hair health. Melasma can wax and wane with sun exposure, hormones, and treatment — only longitudinal photos reveal the pattern.',
    specialTracking: ['Melasma tracking: date started, severity (1-10), menstrual cycle phase, sun exposure level that week', 'Track Ubtan or traditional preparations separately: what ingredients, what frequency, what effects', 'Hair protein-moisture balance: South Asian hair can range from fine to thick, and protein sensitivity varies; journal which protein treatments help versus which feel stiff and cause breakage'],
    recommendedJournal: 'Cycle-mapped journal: track melasma severity against menstrual cycle phase to identify hormonal correlation; also monthly photos in natural light from multiple angles'
  },
  caribbean: {
    primaryConcerns: 'Caribbean skin prioritises: even skin tone, moisture in dry winter (for diaspora), sun protection in tropical environments, and natural hair retention. Diaspora adjustment from tropical to temperate climate is a significant journal entry point.',
    specialTracking: ['Document the diaspora climate adjustment if relevant: when did routine change to accommodate colder/drier weather?', 'Natural hair journals: track LOC method product combinations that work for specific hair porosity', 'SPF compliance tracking: many Caribbean communities historically did not use SPF due to climate familiarity; a journal entry noting SPF compliance builds the habit'],
    recommendedJournal: 'Split skincare and hair into separate trackers; Caribbean natural hair has its own extensive tradition of home preparation journaling'
  },
  arab: {
    primaryConcerns: 'Arab beauty journaling covers: maintaining the complexion in extreme heat and sun (Gulf), tracking oud-based traditional preparations and their effects, fragrance sensitivity (common in traditional Arab beauty with heavy rose and oud usage), and hair care in hard water (prevalent in Gulf cities).',
    specialTracking: ['Hard water hair journaling: Gulf cities have notoriously hard water; track whether chelating shampoo use is affecting build-up', 'Traditional versus modern comparison: if alternating traditional preparations (kohl, argan, oud oil) with modern products, document them separately to assess each\'s contribution', 'Air conditioning tracking: the dramatic indoor-outdoor temperature difference in Gulf summer affects skin barrier; note routine adjustments made for air-conditioned environments'],
    recommendedJournal: 'Two-stream journal: traditional preparation log and modern product log, with skin evaluation of each separately and combined'
  },
  latina: {
    primaryConcerns: 'Latina beauty journaling covers highly diverse skin and hair types; prioritise: hyperpigmentation for deeper Latina skin tones, oil control in tropical climates, hair health (from relaxed to natural 4C, from fine to coarse), and traditional ingredient tracking (aloe vera, avocado, marigold)',
    specialTracking: ['Undertone documentation: Latina skin spans cool (Afro-Latino), warm (mestizo), and olive undertones; foundation and concealer shade research benefits enormously from an undertone journal', 'Traditional remedies tracking: aloe, jojoba, avocado; document home preparations separately from commercial products', 'If managing mixed-heritage hair: document the care strategies separately for different sections if hair texture varies across the head'],
    recommendedJournal: 'Photo-focused for hyperpigmentation tracking; ingredient index for traditional preparations'
  },
  'east-asian': {
    primaryConcerns: 'East Asian beauty journaling aligns with K-beauty and J-beauty philosophy: layering tracking (which essence-serum-moisturiser combination works in what order), glass skin metrics, pore documentation, and skin barrier health through seasonal changes.',
    specialTracking: ['Layering order experiment journal: a dedicated log for testing different product order combinations and their effects on skin feel and appearance', 'COSRX / Paula\'s Choice / The Ordinary protocol tracking: many East Asian community members use highly regarded science-backed Western lines alongside K-beauty; journal both and note synergies or conflicts', 'Skin type assessment: East Asian skin type classifications sometimes differ from Western; document using both systems'],
    recommendedJournal: 'The Japanese "techo" (手帳) hobonichi planner style works well — extremely detailed daily entries; or a dedicated spreadsheet for layering experiment data'
  },
  'east-african': {
    primaryConcerns: 'East African beauty journaling often centres on: maintaining the traditional oiling practice and documenting its effects, hyperpigmentation tracking, natural hair (relaxed, natural 4C, and everything between), and traditional preparations (frankincense, henna).',
    specialTracking: ['Oiling journal: document frankincense, black seed oil, or similar traditional oil applications — frequency, technique (full body? face only?), and skin response', 'Henna tracking: date applied, brand/source, mix used (lemon juice, tea?), dye release time, colour result, hair condition before and after', 'Natural hair protective style log: what style, how long worn, take-down moisture level, retention achieved'],
    recommendedJournal: 'Traditional preparation journal (handwritten, can be passed down as a family beauty recipe book) + modern digital tracker for product ingredient cross-referencing'
  },
  'south-african': {
    primaryConcerns: 'South African beauty journaling covers: UV damage tracking (UV is extreme in South Africa), hyperpigmentation from PIH (Fitzpatrick IV-VI skin), marula and baobab oil traditional use, and hair health across the diverse range of South African hair textures.',
    specialTracking: ['Reversed season journal: Southern Hemisphere seasons are opposite to Northern Hemisphere; document clearly which month and which season to avoid confusing seasonal routine adjustments', 'Marula oil tracking: authentic South African marula oil is different from commercially modified products; track source, quality, and skin response', 'Sun damage tracking: high-altitude Highveld and coastal UV requires consistent documentation of SPF use and any sun spots or solar lentigines appearing'],
    recommendedJournal: 'Monthly photo comparison (essential for tracking UV damage); baobab and marula oil sourcing log (to track authentic versus synthetic)'
  },
  'black-american': {
    primaryConcerns: 'Black American beauty journaling has a rich cultural context: the natural hair movement has driven sophisticated personal tracking practices within the community; journaling for skincare centres on PIH, dark spot tracking, and building routines for Fitzpatrick IV-VI skin that was historically underserved by mainstream skincare brands.',
    specialTracking: ['Natural hair regimen journal: the natural hair community is one of the most sophisticated in terms of personal experimentation documentation; track porosity, protein-moisture balance, LOC vs LCO method comparison, protective style retention', 'Dark spot tracking: monthly close-up photos of hyperpigmented areas in natural light; document which actives (vitamin C, niacinamide, azelaic acid, kojic acid) show measurable improvement', 'Brand sourcing: track which brands have shades for deep Fitzpatrick V-VI skin (historically limited) and which formulas avoid white cast in sunscreens'],
    recommendedJournal: 'Many Black American beauty content creators have published free Google Sheets templates specifically for natural hair and dark skin tracking; the community produces some of the most detailed and sophisticated beauty journal templates available'
  }
};

export function getBeautyJournalingBasics() {
  return BEAUTY_JOURNALING_BASICS;
}

export function getJournalingFormat(format) {
  const map = {
    physical: JOURNALING_FORMATS.options.physicalJournal,
    spreadsheet: JOURNALING_FORMATS.options.spreadsheet,
    apps: JOURNALING_FORMATS.options.apps,
    photos: JOURNALING_FORMATS.options.photos
  };
  return map[format?.toLowerCase()] || JOURNALING_FORMATS;
}

export function getEliminationProtocol() {
  return ELIMINATION_PROTOCOL;
}

export function getRoutineBuildingJournal() {
  return SKINCARE_ROUTINE_BUILDING_JOURNAL;
}

export function getHairJournal() {
  return HAIR_JOURNAL;
}

export function getMakeupJournal() {
  return MAKEUP_JOURNAL;
}

export function getEthnicJournalingGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_JOURNALING_GUIDE['west-african'],
    'south-asian': ETHNIC_JOURNALING_GUIDE['south-asian'],
    caribbean: ETHNIC_JOURNALING_GUIDE.caribbean,
    arab: ETHNIC_JOURNALING_GUIDE.arab,
    latina: ETHNIC_JOURNALING_GUIDE.latina,
    'east-asian': ETHNIC_JOURNALING_GUIDE['east-asian'],
    'east-african': ETHNIC_JOURNALING_GUIDE['east-african'],
    'south-african': ETHNIC_JOURNALING_GUIDE['south-african'],
    'black-american': ETHNIC_JOURNALING_GUIDE['black-american']
  };
  return directMap[communityId] || null;
}

export const BEAUTY_JOURNALING_STATS = {
  moduleId: 'beauty_journaling_guide',
  version: '1.0.0',
  topics: ['beauty journal', 'skincare tracking', 'product testing', 'elimination protocol', 'ingredient tracking', 'skin photography', 'hair regimen journal', 'PAO dates', 'makeup journal', 'routine building', 'confirmation bias beauty', 'patch test journal', 'length retention tracking', 'PIH tracking', 'melasma journal', 'natural hair journal', 'dark spot tracking', 'spreadsheet skincare'],
  communitiesSupported: 9,
  keyFacts: [
    'The skin renewal cycle is approximately 28 days; most products need a full 28-day cycle of consistent use before their effects can be meaningfully evaluated — beauty journaling is the only reliable way to track this period without relying on faulty human memory',
    'Confirmation bias is one of the most powerful forces in beauty product evaluation: if you expect a product to work, you will perceive it as working, even when your skin ratings show no change; a beauty journal that records daily ratings BEFORE reading prior entries combats this',
    'Fragrance (parfum) and essential oils (lavender, tea tree, citrus) are the most common causes of contact dermatitis in skincare — an ingredient tracking journal that cross-references reactions with product ingredient lists is the most effective way to identify these sensitisers',
    'For Type 3-4 hair, growth rate is roughly equal to other hair types (~1.25cm/month), but length retention is often lower due to breakage — a hair journal that tracks stretched length monthly is the only way to determine whether a hair care concern is a growth problem or a retention problem',
    'Black American beauty content creators and the natural hair community produce some of the most sophisticated free beauty tracking templates available online, reflecting decades of community documentation of routines for hair and skin that mainstream beauty brands historically ignored'
  ]
};
