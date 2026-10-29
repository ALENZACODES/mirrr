/**
 * MIRRR Skincare Devices Guide
 * LED masks, RF devices, microneedling rollers, cleansing brushes,
 * facial steamers, gua sha tools, and at-home skin technology
 */

// ─── AT-HOME DEVICE LANDSCAPE ─────────────────────────────────────────────────

export const DEVICES_OVERVIEW = {
  context: 'At-home skincare devices have grown from a niche market to a multi-billion dollar industry. The best devices deliver measurable clinical results; many deliver primarily a relaxing ritual. Understanding the difference saves money and manages expectations.',
  professional_vs_home: {
    professional: 'In-clinic devices operate at higher energy levels (more powerful lasers, deeper RF penetration, stronger microneedling depth). Professional results remain superior for most categories.',
    home: 'Home devices work at lower, safer energy levels to avoid risk of burns or scarring without professional supervision. They deliver meaningful improvement with consistent, long-term use — but rarely match a single professional session.',
  },
  evidence_hierarchy: {
    strong_evidence: ['LED light therapy (red and near-infrared)', 'Microcurrent (some evidence for muscle toning)', 'RF (radiofrequency) for collagen stimulation'],
    moderate_evidence: ['Microneedling rollers (at safe depths)', 'Ultrasonic facial cleansing', 'LLLT (low-level laser therapy)'],
    limited_evidence: ['Most cleansing brushes vs manual cleansing', 'Facial steamers', 'Ionic facial devices'],
  },
};

// ─── LED LIGHT THERAPY ────────────────────────────────────────────────────────

export const LED_THERAPY_GUIDE = {
  how_it_works: 'LED (Light Emitting Diode) therapy uses specific wavelengths of light to penetrate skin at different depths and trigger cellular responses. Different wavelengths have different effects. Photobiomodulation — light stimulates mitochondria, increasing ATP (cellular energy) production.',
  wavelengths: {
    red: {
      wavelength: 'Red Light: 620-700nm',
      depth: 'Penetrates to dermis (1-2mm)',
      effects: ['Stimulates fibroblasts to produce collagen and elastin', 'Reduces inflammation', 'Improves skin texture', 'Improves healing speed', 'Reduces fine lines with consistent use'],
      best_for: 'Anti-aging; skin texture improvement; wound healing; redness reduction',
      session_frequency: '3-5x per week; 10-20 minutes per session',
    },
    near_infrared: {
      wavelength: 'Near-Infrared: 700-1000nm',
      depth: 'Penetrates deepest (>2mm into subcutaneous tissue)',
      effects: ['Deep tissue repair', 'Anti-inflammatory', 'Pain relief (muscles)', 'Enhanced circulation'],
      best_for: 'Combined with red for anti-aging; muscle recovery; deep tissue repair',
    },
    blue: {
      wavelength: 'Blue Light: 415-450nm',
      depth: 'Penetrates to epidermis (0.5mm)',
      effects: ['Kills Propionibacterium acnes (acne bacteria) through porphyrin activation', 'Reduces acne', 'Some reduction in oil production'],
      best_for: 'Active acne; oily skin',
      caution: 'Daily long-term blue light use not well-studied. Some experts recommend limiting blue LED (not to be confused with blue light from screens — very different energy levels).',
    },
    green: {
      wavelength: 'Green Light: 520-560nm',
      effects: ['Targets melanocytes; may reduce melanin production', 'Some evidence for hyperpigmentation reduction'],
      best_for: 'Hyperpigmentation; evening skin tone',
      note: 'Less robust evidence than red or blue. Emerging area.',
    },
    yellow: {
      wavelength: 'Yellow/Amber: 570-620nm',
      effects: ['Stimulates lymphatic drainage', 'Reduces redness and rosacea symptoms', 'Some evidence for skin rejuvenation'],
      best_for: 'Sensitive skin; rosacea; redness',
    },
  },
  popular_devices: {
    CurrentBody_LED: {
      name: 'CurrentBody Skin LED Light Therapy Mask',
      type: 'Red + Near-infrared mask',
      clinical_data: 'Has published clinical trial data showing improvements in fine lines, skin texture, and radiance. One of the better-evidenced consumer devices.',
      use: '10 minutes 3-5x weekly. Recommended treatment: 4+ weeks to see results.',
    },
    Dr_Dennis_Gross: {
      name: 'Dr. Dennis Gross DRx SpectraLite FaceWare Pro',
      type: 'Red + Blue LED mask',
      use: '3 minutes daily (shorter sessions than most). Red + blue alternating for anti-aging and acne.',
    },
    Omnilux: {
      name: 'Omnilux Contour Face',
      type: 'Red + Near-infrared panel mask',
      note: 'Professional grade LED used in clinics; consumer version available. Well-regarded.',
    },
  },
  ethnic_note: 'LED red light therapy is safe for ALL Fitzpatrick skin types including VI. Blue LED is also considered safe across all types, though its effects on melanin production in darker skin types require more study. LED light therapy does NOT cause PIH and is one of the safest tech interventions for dark skin.',
  contraindications: ['Epilepsy (flashing lights)', 'Photosensitising medications (check with doctor)', 'Active thyroid conditions (near-infrared can affect thyroid)'],
  tips: ['Must be used consistently — 4+ weeks for visible results', 'Use on clean, serumless skin OR after water-based serums (silicone serums may block light)', 'Can be used before or after other treatments'],
};

// ─── RADIOFREQUENCY (RF) DEVICES ──────────────────────────────────────────────

export const RF_DEVICE_GUIDE = {
  how_it_works: 'Radiofrequency energy heats the dermis (specifically the collagen in the dermis) to 40-43°C without damaging the epidermis. This heat: (1) immediately tightens existing collagen fibres (short-term visible result); (2) triggers a controlled wound-healing response, stimulating new collagen and elastin production over 2-6 months.',
  clinical_evidence: 'Strong evidence for in-clinic RF (Thermage, Morpheus8, Sofwave). Consumer devices show improvement but at lower energy levels — results are meaningful but less dramatic.',
  popular_devices: {
    NuFace_Trinity: {
      name: 'NuFACE Trinity (Microcurrent + RF attachment)',
      distinction: 'NuFACE Trinity is primarily microcurrent. The RF attachment (FIRMINGboost) adds RF. The two technologies are different — microcurrent stimulates facial muscles; RF stimulates collagen.',
    },
    NEWA: {
      name: 'NEWA RF Device',
      description: 'Focused monopolar RF device. The technology has been around long enough to have clinical studies. Used in clinic-grade technology; NEWA consumer version shows real results with consistent use.',
      protocol: '4-5 minutes per area, 3x weekly for the first 4 weeks, then maintenance.',
    },
    TriPollar_STOP: {
      name: 'TriPollar STOP',
      description: 'Bipolar and tripolar RF. Good evidence base. Israeli technology widely used.',
    },
  },
  ethnic_note: 'RF devices require additional caution for darker skin tones (Fitzpatrick IV-VI). RF energy heats tissue indiscriminately — improper use at high settings can cause thermal injury and HYPERPIGMENTATION in melanin-rich skin. Start at lowest setting; do NOT use on freshly tanned skin; avoid if skin is inflamed. Dermatologist supervision for home RF recommended for Fitzpatrick V-VI.',
  treatment_area_tips: {
    jawline: 'Start at jawline and sweep upward and back toward ear.',
    jowls: 'Slow strokes from jowl area (below cheekbone) outward toward hairline.',
    neck: 'Upward strokes from clavicle to chin.',
    under_eye: 'Check device manual — many consumer RF devices are NOT safe for undereye area.',
  },
};

// ─── MICROCURRENT DEVICES ─────────────────────────────────────────────────────

export const MICROCURRENT_GUIDE = {
  how_it_works: 'Microcurrent delivers very low-level electrical current (measured in microamperes — millionths of an ampere) that mimics the body\'s own bioelectric signals. Targets facial muscles and ATP production in cells.',
  claimed_effects: ['Toning and lifting facial muscles (similar concept to body exercise)', 'Improved collagen and elastin synthesis', 'Increased ATP production', 'Lymphatic drainage stimulation'],
  evidence: 'Moderate. Microcurrent has clinical history in physical therapy and wound healing at therapeutic levels. Aesthetic microcurrent at consumer device levels shows promising but less robust evidence. Many users report visible lifting and tightening effects.',
  popular_devices: {
    NuFace: {
      name: 'NuFACE Mini / Trinity',
      description: 'The market leader. FDA-cleared device. Most-reviewed consumer microcurrent. Mini is the entry level (face only). Trinity is expandable with attachments (eyes, RF).',
      protocol: '5 minutes daily for 60 days; then 2-3x weekly maintenance.',
    },
    ZIIP: {
      name: 'ZIIP GX Facial Device',
      description: 'Combines microcurrent and nanocurrent. App-guided treatment protocols.',
    },
  },
  conductive_gel: 'Microcurrent requires a conductive gel to work. The electricity needs a medium to travel through skin. Use only recommended gels — applying without gel can cause discomfort or damage.',
  contraindications: ['Pacemakers', 'Pregnancy', 'Metal implants in the face', 'Epilepsy', 'Active acne, rosacea, or broken skin in treatment area'],
};

// ─── AT-HOME MICRONEEDLING ────────────────────────────────────────────────────

export const MICRONEEDLING_HOME_GUIDE = {
  types: {
    dermaroller: {
      type: 'Dermaroller (Rolling Microneedler)',
      description: 'A roller covered in fine needles that is rolled across the skin to create micro-channels.',
      safe_needle_depth: '0.2mm for home use. No deeper than 0.3mm without professional supervision.',
      NOT_safe: 'Depths >0.5mm marketed for home use — these are professional depths and carry infection and scarring risk at home.',
    },
    dermapen_style: {
      type: 'Dermapen-Style (Stamp/Pen Microneedler)',
      description: 'Electric or manual stamping device. More precise than a roller; better for difficult areas (around nose, lips).',
      safe_depth: '0.25-0.5mm for home use. 0.5mm pushes toward professional territory.',
    },
  },
  evidence: 'Significant clinical evidence that professional microneedling (1.0-2.5mm) builds collagen and improves texture, scars, and pigmentation. Home-use at 0.2-0.5mm creates micro-channels that enhance topical product absorption — the beauty benefit at home is primarily as a "product driver" rather than a collagen-building treatment.',
  safety_rules: [
    'Sterilise needle device with 70% isopropyl alcohol before EVERY use',
    'Do NOT share dermarollers — serious infection risk',
    'Replace roller heads every 3 months (needles blunt; blunt needles tear skin rather than puncture)',
    'Do NOT use over active acne, cold sores, rosacea, or inflamed skin',
    'Apply a vitamin C serum or hyaluronic acid after microneedling (skin is highly receptive)',
    'Apply SPF immediately after any outdoor exposure post-microneedling',
    'Do NOT use immediately after AHA/BHA/retinol — the combination with open micro-channels can cause extreme irritation',
  ],
  ethnic_safety: {
    warning: 'CRITICAL for Fitzpatrick IV-VI: microneedling at any depth carries a risk of post-inflammatory hyperpigmentation (PIH) if the skin is irritated, inflamed, or improperly treated. Home microneedling at safe depths (0.2mm) has a lower risk, but any redness, inflammation, or swelling post-treatment can trigger PIH.',
    protocol: 'Start with the SHORTEST needle depth available (0.2mm). Test a small area. Allow to fully heal. Build up depth SLOWLY. Avoid microneedling during high-sun-exposure seasons without rigorous SPF discipline.',
  },
};

// ─── CLEANSING DEVICES ────────────────────────────────────────────────────────

export const CLEANSING_DEVICE_GUIDE = {
  sonic_cleansing_brushes: {
    type: 'Sonic Cleansing Brushes',
    description: 'Oscillating or rotating brush heads that physically aid in cleansing and light exfoliation.',
    evidence: 'Studies show sonic cleansing removes makeup and environmental pollutants more effectively than manual cleansing.',
    popular: ['Clarisonic (discontinued)', 'Foreo Luna (silicone; antimicrobial)', 'Michael Todd SONICLEAR', 'PMD Clean'],
    frequency: '2-3x weekly maximum. Daily use can over-exfoliate sensitive skin.',
    caution: 'Not for active acne (spreads bacteria), open wounds, or sensitive rosacea.',
    ethnic_note: 'Deep brown and Black skin can be more reactive to over-exfoliation. Use on lowest intensity; silicone brush heads (e.g. Foreo Luna) are gentler than nylon bristles.',
  },
  facial_steamers: {
    type: 'Facial Steamers',
    description: 'Generate steam directed at the face; warm water vapour opens pores and softens sebum.',
    benefits: ['Softens and loosens sebum in pores for easier extraction', 'Increases skin permeability (better product absorption after steaming)', 'Increases local circulation', 'Relaxing'],
    limitations: ['Steam alone does NOT "open pores" — pores are not muscles with open/close function; steam softens contents for easier extraction', 'Does NOT steam away acne or blackheads without mechanical extraction after'],
    protocol: 'Steam 5-10 minutes. Perform extractions or masks immediately after. Apply serums while skin is still warm (enhanced absorption).',
    ethnic_note: 'Steam followed by aggressive manual extraction can cause PIH in darker skin. Steam to soften; use gentle extraction tools; follow with soothing serum immediately.',
  },
  ultrasonic_spatulas: {
    type: 'Ultrasonic Skin Spatulas (Skin Scrubber)',
    description: 'Vibrate at high frequency to loosen sebum and dead skin via ultrasonic waves. The popular "pore purging" spatulas that extract visible sebum in a satisfying way.',
    technique: 'Use on damp skin (water acts as conductor). Angle blade against skin at 45°. Sweep in outward strokes. The moist sebum is dislodged and lifted to the surface.',
    evidence: 'Limited robust clinical data. Evidence primarily anecdotal and observational.',
    frequency: '1-2x weekly.',
  },
};

// ─── GUA SHA AND FACIAL TOOLS ─────────────────────────────────────────────────

export const GUA_SHA_FACIAL_GUIDE = {
  origins: 'Gua sha (刮痧) originates in Traditional Chinese Medicine. Traditional gua sha on the body is vigorous scraping that intentionally brings blood to the surface (the "sha" — the red marks). FACIAL gua sha is completely different — very light pressure, no bruising intended, no "sha" marks.',
  facial_benefits: ['Lymphatic drainage (moves lymph fluid; reduces puffiness)', 'Improved circulation', 'Relaxation of facial tension', 'Some evidence for improved skin texture'],
  tools: {
    rose_quartz: 'Rose quartz: stays cool; feminine aesthetic. Popular.',
    jade: 'Jade: traditional TCM material; cool.',
    bian_stone: 'Bian stone: black; traditional; warm when heated.',
    stainless_steel: 'Stainless steel: stays very cold; easy to sanitise.',
  },
  technique: {
    important: 'ALWAYS use a facial oil or serum as lubricant. Never drag tool on dry skin — causes micro-tears.',
    pressure: 'LIGHT pressure only for facial gua sha. If you see redness or petechiae (red spots) you are pressing too hard.',
    direction: 'Always sweep UPWARD and OUTWARD (toward the hairline and ears) — this moves lymph toward lymph nodes at the ears and neck.',
    sequence: ['Neck first (clear the drainage pathway)', 'Decolletage', 'Jawline', 'Cheeks', 'Under-eye (VERY gently, if at all)', 'Forehead'],
  },
  ethnic_caution: 'CRITICAL for Fitzpatrick IV-VI: too much pressure in facial gua sha = bruising = PIH risk. This risk is elevated for darker skin. Keep pressure very light. If any redness appears, reduce pressure immediately. The beauty benefit is from lymphatic movement, NOT from the pressure itself.',
  frequency: '3-5x weekly (gentle routine); daily is fine if pressure is truly light.',
};

// ─── HIGH-TECH ANTI-AGING DEVICES ────────────────────────────────────────────

export const ADVANCED_DEVICES = {
  HIFU_home: {
    device_type: 'At-Home HIFU (High Intensity Focused Ultrasound)',
    description: 'Professional Ultherapy uses HIFU to heat deep SMAS layer of skin for significant lifting. Home devices use lower energy.',
    caution: 'AT-HOME HIFU products vary widely in safety and efficacy. Some unregulated devices on Amazon have caused burns. Stick to established brands with clinical evidence.',
    ethnic_note: 'HIFU carries PIH risk for Fitzpatrick IV-VI — especially important to not overlap passes or use at highest settings. Professional HIFU with an experienced practitioner is safer for dark skin than unregulated home devices.',
  },
  plasma_pens: {
    device_type: 'Plasma Pens (Fibroblast Therapy)',
    description: 'Create a plasma arc that causes controlled micro-trauma and skin tightening. Used professionally for eyelid tightening and other treatments.',
    home_warning: 'AVOID home plasma pens without extensive professional training. These devices have caused significant scarring and permanent hyperpigmentation, particularly in darker skin tones. Not recommended for home use for ANY Fitzpatrick type. Catastrophic risk for Fitzpatrick IV-VI.',
  },
  laser_hair_removal: {
    device_type: 'At-Home Laser / IPL Hair Removal',
    overview: 'IPL (Intense Pulsed Light) and laser hair removal devices for home use. Target melanin in the hair follicle.',
    ethnic_safety: {
      WARNING: 'CRITICAL SAFETY NOTE: Most at-home IPL devices are UNSAFE for Fitzpatrick V-VI (dark brown to black skin). IPL cannot distinguish between melanin in the hair and melanin in the skin — on dark skin it heats the skin itself, causing burns and hyperpigmentation.',
      safe_for: 'Home IPL: Fitzpatrick I-III (safest), possibly Fitzpatrick IV with great caution and skin-tone sensors',
      NOT_safe: 'DO NOT use home IPL on Fitzpatrick V-VI skin',
      safe_alternative: 'The ONLY laser proven safe for Fitzpatrick V-VI is the Nd:YAG 1064nm laser — a professional clinic device that bypasses epidermal melanin. Must be done by a trained professional.',
      devices_with_skin_sensors: ['Braun Silk Expert Pro 5 (skin sensor)', 'Philips Lumea (skin tone sensor)', 'Tria Beauty Laser (restricted for dark skin)'],
    },
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getLEDTherapyGuide() { return LED_THERAPY_GUIDE; }
export function getLEDWavelength(colour) {
  return LED_THERAPY_GUIDE.wavelengths[colour] || LED_THERAPY_GUIDE.wavelengths;
}
export function getRFDeviceGuide() { return RF_DEVICE_GUIDE; }
export function getMicrocurrentGuide() { return MICROCURRENT_GUIDE; }
export function getMicroneedlingGuide() { return MICRONEEDLING_HOME_GUIDE; }
export function getCleansingDeviceGuide(type) {
  return CLEANSING_DEVICE_GUIDE[type] || CLEANSING_DEVICE_GUIDE;
}
export function getGuaShaGuide() { return GUA_SHA_FACIAL_GUIDE; }
export function getAdvancedDeviceInfo(type) {
  return ADVANCED_DEVICES[type] || ADVANCED_DEVICES;
}
export function getDevicesOverview() { return DEVICES_OVERVIEW; }

export const SKINCARE_DEVICES_STATS = {
  LEDWavelengths: Object.keys(LED_THERAPY_GUIDE.wavelengths).length,
  deviceCategories: 6,
  safetyNotes: 'Fitzpatrick I-VI coverage across all devices',
};
