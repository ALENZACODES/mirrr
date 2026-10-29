/**
 * MIRRR Spa & Wellness Treatments Guide
 * Global spa traditions, hammam, abhyanga, gua sha, facial treatments,
 * steam therapies, and ethnic beauty wellness rituals
 */

// ─── GLOBAL SPA TRADITIONS ────────────────────────────────────────────────────

export const GLOBAL_SPA_TRADITIONS = {
  hammam: {
    origin: 'Middle East, North Africa, Ottoman Empire (Turkey)',
    history: 'The hammam (Turkish bath / Arabic: حمّام) has existed for over 1,000 years, rooted in Roman thermae that were adapted through Islamic culture. Public hammams were (and still are) social institutions — places of cleansing, community, and beauty ritual.',
    traditional_experience: {
      stages: [
        { stage: 1, name: 'Tepidarium (Tepid Room)', description: 'Acclimatisation — 20-30 minutes in warm, humid air to open pores and soften skin.' },
        { stage: 2, name: 'Caldarium (Hot Room)', description: 'The hot marble slab (göbek taşı) — lie on heated marble. Sweat deeply for 15-30 minutes.' },
        { stage: 3, name: 'Kese (Exfoliation)', description: 'The tellak (scrubber) uses a coarse kese (exfoliating mitt) to scrub the entire body, removing layers of dead skin. The amount of dead skin that lifts away is often startling — testament to how much builds up under normal washing.' },
        { stage: 4, name: 'Sabunlama (Soap Massage)', description: 'Olive oil soap lather — large pillow-like foam applied all over the body, followed by a thorough soap massage.' },
        { stage: 5, name: 'Soğukluk (Cool Room)', description: 'Cool down and rest. Tea, water, social time.' },
      ],
    },
    benefits: {
      skin: 'Removes dead skin cells more thoroughly than conventional exfoliation; stimulates circulation; the heat opens pores for deep cleansing.',
      body: 'Deeply relaxing; relieves muscle tension; stimulates lymphatic drainage.',
      hair: 'Traditional hammam includes hair oiling and herbal treatments.',
    },
    at_home: {
      steam: 'Create steam in bathroom — run very hot shower, close the door for 10 minutes.',
      kese_at_home: 'Authentic kese mitts (Italian-style for similarity) can be purchased; use on wet, steamed skin after 15-20 minutes of steam exposure.',
      moroccan_beldi_soap: 'Black beldi soap (savon beldi) — olive oil and black olives, softened by steam — is a signature of Moroccan hammam. Apply before kese.',
      ghassoul: 'Moroccan rhassoul clay (ghassoul) — used as hair mask and body mask in traditional hammam.',
    },
    moroccan_variation: {
      note: 'Moroccan hammam (douche marocaine) differs slightly from Turkish hammam — longer steam exposure, distinctive beldi soap, ghassoul clay, and the kessa mitt technique.',
    },
    ethnic_communities: ['Arab community', 'North African community', 'Turkish community', 'Persian/Iranian community'],
  },

  onsen_sento: {
    origin: 'Japan',
    history: 'Onsen (温泉) are Japan\'s natural geothermal hot springs. Sento (銭湯) are public bathhouses using heated water. Both are pillars of Japanese daily culture and holistic wellness.',
    experience: {
      pre_onsen: 'Must wash body thoroughly BEFORE entering the communal bath — onsen water is not for cleaning, it is for soaking. This is considered essential etiquette.',
      water_types: {
        sulfur: 'Volcanic sulfur springs (milky white) — antiseptic, good for skin conditions',
        bicarbonate: '"Smooth water" — bicarbonate springs feel silky, leave skin notably smooth',
        iron: 'Rust-coloured water — iron springs traditionally used for fatigue and circulation',
        radium: 'Mild radioactive springs (radon) — deeply warming',
        brine: 'Salt water springs — warm the body deeply, retain heat longer',
      },
      ashi_yu: 'Foot bath onsen — public foot soaking pools, accessible clothed. Often at train stations in onsen towns.',
    },
    beauty_benefits: {
      skin: 'Japanese women credit onsen for the "mochi skin" texture — soft, plump, resilient. The mineral content, heat, and extended soaking have genuine measurable effects on skin hydration and texture.',
      relaxation: 'Extreme — the combination of heat, minerals, and the ritual of quiet soaking creates profound relaxation.',
    },
    at_home_onsen: {
      bath_salts: 'Japanese onsen bath powders/salts (nyuuyoku-zai) — available at Japanese grocery stores and online. Available in sulfur, citrus, cedar, and many seasonal varieties.',
      temperature: 'Traditional onsen temperature: 39-43°C (102-109°F). Soak 10-20 minutes.',
      moisturise: 'Apply moisturiser immediately after exiting the bath while skin is still slightly damp — onsen heat opens channels for absorption.',
    },
    ethnic_communities: ['East Asian community'],
  },

  jimjilbang: {
    origin: 'Korea',
    history: 'Korean jjimjilbang (찜질방) are large, heated communal bathhouses that go beyond Japanese sento — they include heated rooms, dry saunas (with salt rooms, charcoal rooms, jade rooms), skin care stations, food, rest areas, and sometimes sleeping areas. Functioning as a community hub.',
    experience: {
      Italy_towel: 'The "Italy towel" (이태리 타올) — Korea\'s iconic rough exfoliating mitt, introduced in the 1960s — is used by professional "seshin" scrubbers to exfoliate entire body deeply. Most famous of the Korean beauty exports.',
      seshin: 'Professional body scrubber service — the seshin ajumma/adjoshi will scrub your entire body with the Italy towel, removing extraordinary amounts of dead skin.',
      heated_rooms: [
        'Hwangto room (황토방) — red clay room at around 45-50°C',
        'Charcoal room — far-infrared heat, detox claims',
        'Salt room — walls of halite crystal',
        'Ice room — contrast therapy after heated rooms',
        'Jade room',
      ],
    },
    at_home: {
      italy_towel: 'Korean exfoliating mitts are widely available online — green, blue, or pink (different abrasion levels). Must be used on wet skin after soaking 15+ minutes.',
      technique: 'Long strokes from extremities toward the body centre. The dead skin "rolls" off — deeply satisfying and genuinely effective.',
    },
    ethnic_communities: ['East Asian community'],
  },

  abhyanga: {
    origin: 'India — Ayurvedic medicine',
    history: 'Abhyanga (अभ्यंग) is a Sanskrit term for the traditional Ayurvedic practice of warm oil self-massage. It is described in the Ashtanga Hridayam (8th century CE Ayurvedic text) and is considered a fundamental daily practice for health and longevity.',
    principles: {
      why_warm_oil: 'Warm oil penetrates skin more deeply than cold oil. The heat and massage together stimulate circulation, move lymph, and deeply nourish tissue. Ayurveda understands skin as a site of absorption for therapeutic benefit.',
      dosha_oils: {
        vata: 'Sesame oil (grounding, warming) — for Vata types (anxious, dry, light)',
        pitta: 'Coconut oil (cooling) — for Pitta types (fiery, intense)',
        kapha: 'Sunflower or safflower oil (lighter) — for Kapha types (heavier, slower)',
      },
    },
    technique: {
      oil: 'Warm the oil — place the bottle in a cup of hot water for 5 minutes.',
      sequence: [
        'Start at the crown of the head (if doing full body)',
        'Massage scalp vigorously',
        'Move to face with gentle circular strokes',
        'Neck and shoulders — circular on joints, long strokes on limbs',
        'Arms — long strokes on limb, circular at elbow and shoulder',
        'Chest — gentle clockwise circles over the chest and sternum',
        'Abdomen — always clockwise, following the direction of digestion',
        'Back — as best you can reach, or enlist a partner',
        'Legs — long strokes on thighs and calves, circular at knees and ankles',
        'Feet last — press into soles and between toes',
      ],
      duration: '15-45 minutes minimum for a full abhyanga',
      after: 'Allow oil to absorb 15-20 minutes minimum (Ayurveda recommends up to 1 hour) before washing off with warm water and mild soap. Do not use harsh cleansers.',
    },
    benefits: 'Deeply moisturising; increases circulation; stimulates lymphatic movement; calming to the nervous system; skin becomes visibly softer, more radiant over consistent use.',
    at_home: {
      minimum: 'Even 5-10 minutes of warm oil on legs and arms provides measurable benefit. The head (scalp) and feet are most important if time is limited.',
      sesame_note: 'Unroasted, cold-pressed white sesame oil is the classic Ayurvedic choice — NOT the toasted sesame oil used in cooking.',
    },
    ethnic_communities: ['South Asian community'],
  },
};

// ─── GUA SHA ──────────────────────────────────────────────────────────────────

export const GUA_SHA_GUIDE = {
  what: 'Gua sha (刮痧) is a Traditional Chinese Medicine technique of pressing and scraping skin with a smooth tool to improve circulation. "Gua" = scrape, "sha" = redness/petechiae. The original therapeutic form created intentional bruising; the modern facial gua sha is a much gentler adaptation.',

  facial_vs_body: {
    body: 'Traditional gua sha uses strong pressure to the back, neck, shoulders — intentionally raising petechiae (bruising) for therapeutic benefits (pain, respiratory conditions). This is effective and has clinical study support, but is very different from facial gua sha.',
    facial: 'Modern facial gua sha uses extremely light pressure — the goal is lymphatic drainage and gentle stimulation, NOT petechiae. Very little pressure is needed.',
  },

  tools: {
    jade: { description: 'Classic material. Cool to the touch — traditionally seen as balancing. Affordable, widely available.', note: 'Many "jade" tools are aventurine or serpentine — beautiful but different from nephrite jade.' },
    rose_quartz: { description: 'Cool, smooth. Popular in modern facial gua sha. Traditional in Chinese beauty but originally used differently.' },
    bian_stone: { description: 'Traditional material in gua sha — a specific volcanic stone that produces far-infrared radiation and ultrasonic energy when rubbed. More expensive; beloved by practitioners.' },
    stainless_steel: { description: 'Modern option — can be chilled or warmed. Very hygienic. S-shaped tools work well for facial contours.' },
  },

  technique: {
    preparation: 'Always use gua sha on cleansed skin with a facial oil or serum — NEVER on dry skin. The tool must glide smoothly.',
    pressure: 'For facial gua sha: approximately 15-20 grams of pressure — barely any. The tool should glide, not drag.',
    direction: 'For lymphatic drainage: all movements go OUTWARD and DOWNWARD from the centre of the face, toward the ears and neck. End at neck lymph nodes (behind the ears, down the neck).',
    strokes: [
      { area: 'Under chin', direction: 'From chin → toward ear, along jawline' },
      { area: 'Cheeks', direction: 'From nose → toward ear' },
      { area: 'Under eye', direction: 'From inner corner → outward to temple (very light pressure)' },
      { area: 'Forehead', direction: 'From centre → outward to temples' },
      { area: 'Neck', direction: 'Downward from chin to décolletage — completing lymphatic drainage pathway' },
    ],
    frequency: '3-5x per week for maintenance. Daily is fine if gentle.',
    realistic_claims: 'Gua sha will NOT permanently slim the face or lift jowls. It may temporarily depuff (by moving fluid out of tissue), improve circulation (temporary glow), relax muscle tension, and enhance product absorption. Results are real but subtle and temporary without consistency.',
  },

  for_ethnic_skin: {
    note: 'Gua sha is suitable for all skin tones. Important consideration: if any technique causes redness or petechiae, reduce pressure immediately — petechiae on dark skin may appear as darker spots that could take time to fade.',
    PIH_note: 'Post-Inflammatory Hyperpigmentation (PIH) — any skin trauma, including bruising from too-aggressive gua sha, can cause hyperpigmentation in skin types Fitzpatrick IV-VI. Keep pressure very light.',
  },
};

// ─── FACIAL TREATMENTS ────────────────────────────────────────────────────────

export const FACIAL_TREATMENTS = {
  european_facial: {
    description: 'The foundation of Western skincare — cleanse, exfoliate, steam, extractions, mask, tone, moisturise. A skilled facialist can radically transform skin over a series of sessions.',
    extractions: {
      what: 'Manual extraction of comedones (clogged pores, blackheads, whiteheads) by a trained aesthetician. Very different from home extraction.',
      for_dark_skin: 'CRITICAL: Aggressive extraction on Fitzpatrick IV-VI skin can cause PIH. Choose a facialist experienced with melanin-rich skin. Minimal force; warm compresses to soften; no aggressive squeezing.',
    },
    frequency: 'Monthly for most skin types; every 6 weeks for sensitive skin.',
  },

  hydrafacial: {
    description: 'A branded device-based facial using a patented vortex suction tip to cleanse, exfoliate, and infuse serums simultaneously. Gentler than traditional extractions.',
    for_dark_skin: 'Generally considered safe for all skin types including dark skin — the suction and serum infusion method is lower trauma than manual extractions.',
    benefits: 'Immediate visible improvement in hydration and smoothness. Popular for events.',
  },

  chemical_peels: {
    what: 'Controlled application of acids to the skin to remove damaged outer layers and stimulate cell turnover.',
    types: {
      superficial: { acids: 'AHA (glycolic, lactic, mandelic)', depth: 'Epidermis only', downtime: 'None to mild flaking', for_dark_skin: 'MANDELIC ACID is safest for dark skin — largest AHA molecule, gentlest, least PIH risk. Preferred for Fitzpatrick IV-VI.' },
      medium: { acids: 'TCA 15-30%, Jessner\'s', depth: 'Epidermis into upper dermis', downtime: '3-7 days', for_dark_skin: 'Requires an experienced practitioner for dark skin. PIH risk is real. TCA CROSS (Cross technique for acne scars) can be used safely by experts.' },
      deep: { acids: 'Phenol, TCA 35%+', depth: 'Dermis', downtime: '7-21 days', for_dark_skin: 'NOT recommended for Fitzpatrick IV-VI without specialised protocols. High PIH risk.' },
    },
    ethnic_skin_guidance: {
      safest: ['Mandelic acid peel', 'Lactic acid peel (lower concentrations)', 'Azelaic acid — technically not a peel but resurfacing'],
      caution: ['Glycolic acid — lower concentration, shorter contact time, experienced practitioner'],
      avoid_for_dark_skin: ['Deep phenol peels', 'High-concentration TCA without specialist'],
    },
  },

  microdermabrasion: {
    what: 'Mechanical exfoliation using fine crystals or a diamond tip to remove outer skin layers.',
    for_dark_skin: 'Moderate PIH risk. Less risk than chemical peels if done gently. Experienced practitioner important. Hydra-dermabrasion (water-based) may be gentler.',
  },

  microneedling: {
    what: 'Fine needles create controlled micro-injuries to skin, stimulating collagen production and product penetration.',
    for_dark_skin: 'Generally safe for darker skin tones when done by an experienced professional with appropriate settings. Melanin-stimulating risk exists with some energy-based devices that accompany microneedling — choose RF microneedling carefully, as RF heat can affect melanocytes in dark skin.',
    evidence: 'Strong clinical evidence for acne scarring, enlarged pores, fine lines, and skin texture improvement across all skin tones.',
  },
};

// ─── BODY TREATMENTS ──────────────────────────────────────────────────────────

export const BODY_TREATMENTS = {
  dry_brushing: {
    what: 'Using a firm-bristled brush on dry skin before bathing. Brush strokes move toward the heart.',
    benefits: { proven: ['Exfoliation — physically removes dead skin cells', 'Temporarily improved skin appearance'], unclear_evidence: ['Lymphatic drainage — some support, not proven', 'Cellulite reduction — not proven, but circulation improvement may help temporarily'] },
    technique: 'Start at feet, brush in long strokes moving upward toward the heart. On the abdomen, brush in clockwise circles. Always toward the heart for lymphatic flow.',
    caution: 'Avoid on inflamed, sunburned, or irritated skin. Use a natural bristle brush (not synthetic). Clean brush weekly.',
  },

  body_wraps: {
    types: {
      mud_clay: 'Remineralising — mineral-rich muds (Dead Sea mud, kaolin, bentonite) applied to body and wrapped. Draws out impurities, softens skin.',
      seaweed: 'Remineralising and anti-inflammatory — kelp and seaweed are rich in minerals. Popular for sluggish circulation and tired skin.',
      slimming: 'Most "slimming" wraps produce temporary water loss — circumference measurements will return to baseline within hours. Not a genuine fat-loss treatment. Set realistic expectations.',
    },
    at_home: {
      mud_mask: 'Dead Sea mud body application — apply to legs/body, sit 15 minutes, rinse. Genuinely effective for remineralisation and dry skin.',
    },
  },

  lymphatic_drainage_massage: {
    what: 'A specialised massage technique designed to stimulate the lymphatic system — a network of vessels that carries lymph fluid, immune cells, and waste products through the body.',
    technique_note: 'True Manual Lymphatic Drainage (MLD) uses extremely light, rhythmic pumping pressure — much lighter than you\'d expect (20-30g). Heavy pressure compresses lymphatic vessels, defeating the purpose.',
    benefits: { proven: ['Reduces oedema (swelling) — strong evidence for post-surgical and medical oedema', 'Immune system support'], claimed: ['Detoxification', 'General wellbeing', 'Cellulite reduction — weak evidence'] },
    for_beauty: 'Pre-event lymphatic drainage can visibly reduce facial puffiness. Consistent sessions can improve skin quality by supporting fluid balance.',
  },
};

// ─── AT-HOME RITUALS BY COMMUNITY ─────────────────────────────────────────────

export const AT_HOME_RITUALS = {
  arab: {
    weekly: [
      'Sugar wax (halawa) session',
      'Rose water face spritz throughout the day',
      'Bukhoor (incense) burning',
    ],
    monthly: [
      'Hammam-style body scrub — kese mitt on steamed skin',
      'Henna application (hands, feet)',
      'Ghassoul clay hair and body mask',
    ],
    products: ['Rose water', 'Argan oil', 'Ghassoul clay', 'Black seed (Nigella sativa) oil', 'Oud oil'],
  },

  south_asian: {
    weekly: [
      'Champi (head massage with oil) — typically weekly, often Sunday',
      'Ubtan (turmeric paste) body scrub',
      'Haldi (turmeric) milk before bed',
    ],
    monthly: [
      'Full oil bath — sesame or coconut oil applied 1-2 hours before bathing',
      'Multani mitti (Fuller\'s Earth) face mask',
      'Hair oiling treatment — overnight',
    ],
    products: ['Coconut oil', 'Mustard oil', 'Sesame oil', 'Rose water', 'Multani mitti', 'Besan (chickpea flour)', 'Turmeric', 'Amla powder'],
  },

  east_asian: {
    weekly: [
      'Sheet mask 1-2x',
      'Essence application (Korean 7-skin method on some evenings)',
      'Scalp massage (Korean care)',
    ],
    monthly: [
      'Italy towel exfoliation session',
      'Professional facial or gua sha treatment',
      'Snail mucin overnight mask',
    ],
    products: ['Essence', 'Snail secretion filtrate', 'Centella asiatica products', 'Rice water', 'Camellia oil', 'Green tea extract'],
  },

  west_african: {
    weekly: [
      'Shea butter body application after shower',
      'Scalp oiling and protective style maintenance',
    ],
    monthly: [
      'Deep conditioning hair treatment',
      'Black soap (ose dudu / dudu-osu) face and body wash',
      'Full body shea butter treatment',
    ],
    products: ['Raw shea butter', 'African black soap', 'Black seed oil', 'Moringa oil', 'Baobab oil', 'Hibiscus (zobo) for hair'],
  },

  east_african: {
    weekly: [
      'Coffee scrub (East African coffee tradition)',
      'Frankincense oil on skin',
    ],
    monthly: [
      'Kikomba (East African body scrub)',
      'Udi incense ritual',
      'Suke sugar paste hair removal',
    ],
    products: ['Coffee grounds', 'Frankincense resin oil', 'Sesame oil', 'Henna'],
  },

  caribbean: {
    weekly: [
      'Coconut oil hair and skin application',
      'Aloe vera gel (fresh from plant or high-quality commercial)',
    ],
    monthly: [
      'Rum and honey hair mask',
      'Sugar cane scrub',
      'Sea salt body exfoliation',
    ],
    products: ['Virgin coconut oil', 'Aloe vera', 'Sea island cotton oil', 'Cane sugar', 'Bay rum'],
  },

  latina: {
    weekly: [
      'Rice water hair rinse',
      'Coconut oil hair treatment',
    ],
    monthly: [
      'Egg hair mask',
      'Avocado and honey face mask',
      'Coffee body scrub',
    ],
    products: ['Coconut oil', 'Avocado', 'Egg', 'Rice water', 'Rose water', 'Aloe vera', 'Olive oil'],
  },

  black_american: {
    weekly: [
      'Protective style maintenance and scalp oiling',
      'Shea butter body moisturising',
    ],
    monthly: [
      'Steam treatment for hair',
      'Scalp massage with growth oil',
      'Cuticle oil application',
    ],
    products: ['Shea butter', 'Castor oil (Jamaican black)', 'Peppermint oil', 'African black soap', 'Coconut oil'],
  },

  south_african: {
    weekly: [
      'Rooibos tea as a skin toner (cooled tea)',
      'Marula oil skin application',
    ],
    monthly: [
      'Buchu herbal steam',
      'Red clay face mask',
      'African potato body treatment',
    ],
    products: ['Marula oil', 'Rooibos tea', 'Mongongo oil', 'Red clay'],
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getSpaTraditional(tradition) {
  return GLOBAL_SPA_TRADITIONS[tradition] || null;
}

export function getAllSpaTraditions() {
  return GLOBAL_SPA_TRADITIONS;
}

export function getGuaShaGuide() {
  return GUA_SHA_GUIDE;
}

export function getFacialTreatments() {
  return FACIAL_TREATMENTS;
}

export function getBodyTreatments() {
  return BODY_TREATMENTS;
}

export function getAtHomeRitualsForCommunity(communityId) {
  return AT_HOME_RITUALS[communityId] || null;
}

export const SPA_TREATMENTS_STATS = {
  spaTraditions: Object.keys(GLOBAL_SPA_TRADITIONS).length,
  communitiesWithRituals: Object.keys(AT_HOME_RITUALS).length,
  facialTreatmentTypes: Object.keys(FACIAL_TREATMENTS).length,
  bodyTreatmentTypes: Object.keys(BODY_TREATMENTS).length,
};
