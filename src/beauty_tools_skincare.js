/**
 * MIRRR Beauty Tools for Skincare
 * Gua sha, jade roller, ice roller, dermaplaning, microcurrent,
 * facial massage, LED therapy — evidence, technique, and ethnic skin safety
 */

// ─── GUA SHA ──────────────────────────────────────────────────────────────────

export const GUA_SHA_GUIDE = {
  what: 'Gua sha (刮痧 — "scraping for redness") is a traditional Chinese medicine practice that has been used for thousands of years. In traditional practice it was used on the body — sometimes quite vigorously, producing red marks (sha) that were considered therapeutic. The modern facial gua sha is a much gentler adaptation that uses similar tools for lymphatic drainage, tension release, and skin circulation.',

  origin_and_cultural_context: {
    traditional: 'Traditional body gua sha in TCM creates petechiae (small red marks) through friction — considered to release stagnant energy and improve circulation. This is a legitimate medical practice in many East Asian countries.',
    facial_adaptation: 'Facial gua sha is NOT the same as traditional body gua sha. The face requires much lighter pressure — no marks should be produced. The facial version draws from the tool and motion but has been adapted for a much gentler application.',
    cultural_appropriation_note: 'Gua sha tools and facial techniques have become widely commercially popularised — their Chinese origin and traditional Chinese medicine roots should be acknowledged. Support brands that credit this heritage or are founded by people from these communities.',
  },

  proven_benefits: {
    lymphatic_drainage: 'Gentle upward and outward strokes along lymphatic pathways can support lymphatic flow — reducing puffiness, particularly under-eye and jaw area. Evidence is anecdotal-to-moderate but mechanism is sound.',
    fascia_release: 'The scraping motion can release tension in the superficial fascia (connective tissue under the skin) and facial muscles — similar mechanism to foam rolling for muscles',
    circulation: 'Increased local blood circulation from the friction and pressure — creates a temporary brightening and warming effect',
    relaxation: 'The ritual itself has stress-reducing effects — and stress is a significant factor in skin health',
    not_proven: [
      'Permanent "lifting" or "sculpting" of facial structure — the bone does not move',
      'Significant long-term anti-aging effects beyond those from consistency of any massage',
      'Drainage of toxins (the lymphatic system handles waste regardless)',
    ],
  },

  for_ethnic_skin: {
    concern: 'Darker skin tones (Fitzpatrick IV-VI) are at higher risk of post-inflammatory hyperpigmentation from ANY skin trauma, including overly aggressive gua sha.',
    safe_practice: [
      'Always apply generous oil or serum before gua sha — NEVER on dry skin',
      'Use light pressure — the tool should glide smoothly; if you feel resistance, use more product',
      'NO red marks should appear. If they do, pressure is too heavy.',
      'Avoid dragging over active breakouts, inflamed acne, rosacea flares, or irritated skin — PIH risk',
      'Start with minimal pressure and sessions, increasing gradually',
    ],
    skin_conditions_to_avoid: 'Do not use over active acne lesions, open wounds, inflamed eczema, rosacea, or compromised skin.',
  },

  tools: {
    jade: {
      what: 'Traditional jade stone — cool to touch, smooth',
      properties: 'Stays cool naturally, smooth surface. The "original" material for facial gua sha',
      note: 'Much "jade" sold is actually dyed stone — genuine nephrite jade is expensive. The material matters less than technique.',
    },
    rose_quartz: {
      what: 'Pink crystal gua sha — popular aesthetic choice',
      properties: 'Similar in use to jade. Rose quartz is associated with love and self-care in crystal healing traditions (not a scientific claim).',
    },
    bian_stone: {
      what: 'Traditional stone used in classical TCM gua sha',
      properties: 'Often considered most traditional. Contains 40+ trace minerals.',
    },
    stainless_steel: {
      what: 'Stainless steel gua sha tools',
      properties: 'Easy to clean, durable, stays cold longer when refrigerated. Non-porous so very hygienic.',
    },
  },

  technique: {
    prep: 'Cleanse face. Apply 2-3 drops of facial oil (jojoba, marula, rosehip) or a serum with good slip.',
    sections: [
      { area: 'Neck', motion: 'Three strokes upward on each side of neck, from clavicle to jaw', note: 'Always start with the neck to open lymph pathways' },
      { area: 'Jaw', motion: 'Three strokes from chin to ear along jawline', note: 'Excellent for jaw tension; many people carry significant tension here' },
      { area: 'Cheek', motion: 'Three strokes from nose outward and upward toward ear', note: 'Lymphatic pathway follows this direction' },
      { area: 'Under eye', motion: 'VERY gentle 3 strokes from inner to outer under eye', note: 'Minimal pressure here — skin is thinnest' },
      { area: 'Brow and forehead', motion: 'Strokes outward and upward', note: 'Good for forehead tension' },
    ],
    frequency: '3-5x per week for maintenance; daily if you enjoy it and skin tolerates it',
    duration: '5-10 minutes per session',
  },
};

// ─── JADE ROLLER ─────────────────────────────────────────────────────────────

export const JADE_ROLLER_GUIDE = {
  what: 'A facial massage tool with a rolling stone head — similar principle to gua sha but in a rolling format. The rolling motion is gentler and easier to control than a gua sha tool.',

  benefits: {
    similar_to_gua_sha: 'Lymphatic drainage, circulation, relaxation, product penetration (helps press serum into skin)',
    puffiness_reduction: 'Rolling out facial puffiness — particularly effective in the morning when stored in the refrigerator. The cold + rolling motion reduces morning puffiness quickly.',
    product_penetration: 'Rolling after applying serum helps press product into the skin — increases product contact time and may improve penetration slightly',
    cooling: 'A refrigerated roller on the face feels refreshing and reduces redness temporarily',
  },

  for_ethnic_skin: 'Lower risk than gua sha since the rolling motion is less likely to create micro-friction. Still use oil or serum underneath for glide.',

  technique: {
    direction: 'Always roll outward and upward — from center of face outward, from jaw upward. This follows lymphatic drainage direction.',
    pressure: 'Light and consistent. The roller should glide smoothly.',
    refrigerator: 'Store in refrigerator for cooling/de-puffing effect. Particularly effective for under-eye puffiness.',
  },

  genuine_vs_fake: 'Many "jade rollers" are not genuine jade — they are dyed quartzite or glass. Genuine jade has an uneven temperature when touched (feels cold in some spots, less cold in others). Dyed stone is uniform. The functional benefit is minimal either way — technique matters more than stone type.',
};

// ─── ICE ROLLER / ICE THERAPY ─────────────────────────────────────────────────

export const ICE_THERAPY_GUIDE = {
  what: 'Applying cold (ice, cold roller, ice globes, cold spoon) to the face for various skin benefits.',

  ice_roller: {
    what: 'A roller filled with water that is frozen and used on the face',
    benefits: [
      'Reduces inflammation and redness rapidly',
      'Minimises appearance of pores temporarily (cold tightens)',
      'Reduces puffiness (morning routine)',
      'Soothes after extractions, waxing, or procedures',
      'Reduces sunburn and heat redness',
    ],
    for_ethnic_skin: {
      benefit: 'Particularly useful for managing rosacea and redness that darker skin tones can experience (rosacea is underdiagnosed in darker skin but very much exists). Cold therapy reduces inflammatory redness.',
      post_procedure: 'After any procedure that may trigger PIH (waxing, extractions), immediate ice application reduces the inflammatory response that triggers melanin production — a preventive step for PIH.',
    },
  },

  cryotherapy_facials: {
    what: 'Professional liquid nitrogen or cryo-probe facials — extreme cold applied to the face',
    claimed_benefits: 'Anti-aging, brightening, reducing inflammation',
    evidence: 'Mixed — insufficient high-quality evidence',
    caution_for_ethnic_skin: 'Cryotherapy is used medically for treating hyperpigmented spots (freezing). Any uncontrolled cryo application to darker skin has risk of creating hypopigmented (lighter) patches if applied incorrectly. Seek experienced practitioners.',
  },
};

// ─── DERMAPLANING ─────────────────────────────────────────────────────────────

export const DERMAPLANING_GUIDE = {
  what: 'Dermaplaning is a physical exfoliation technique using a sterile surgical-grade scalpel (or consumer-grade flat razor) held at a 45-degree angle to remove the top layer of dead skin cells and vellus hair (peach fuzz) from the face.',

  benefits: {
    exfoliation: 'Removes dead skin cell buildup — immediately smoother skin',
    vellus_hair_removal: 'Removes the fine vellus hair on the face — makeup application becomes smoother',
    product_absorption: 'With the dead skin layer removed, serums and moisturisers absorb more effectively',
    glow: 'Immediate brightening effect from removed dead skin',
  },

  for_ethnic_skin: {
    the_concern: 'Dermaplaning creates micro-trauma on the skin surface. For Fitzpatrick IV-VI, this micro-trauma can trigger PIH — the inflammatory response produces excess melanin.',
    risk_assessment: [
      'LOW RISK if: skin is healthy, no active inflammation, professional application with correct blade angle, followed by proper aftercare',
      'HIGH RISK if: prone to PIH, have active acne, rosacea, or inflammatory skin conditions',
      'FORBIDDEN if: active acne — this will spread bacteria and cause significant PIH',
    ],
    safety_tips: [
      'Always done on cleansed, dry skin',
      'Use a sharp blade — dull blades require more pressure and cause more trauma',
      'Avoid over active breakouts, inflamed skin, any raised lesions',
      'Follow immediately with calming, anti-inflammatory products (centella, niacinamide, aloe)',
      'MANDATORY SPF the next day — freshly dermaplaned skin is significantly more UV-sensitive and PIH risk is highest when damaged skin meets UV',
      'If any redness persists more than a few hours, this is a bad sign. Monitor for PIH development.',
    ],
    hair_regrowth_myth: 'Dermaplaning does NOT cause vellus hair to grow back thicker or darker. This is a myth. Vellus hair grows from a different follicle type than terminal hair — its character cannot change from surface removal.',
  },

  professional_vs_diy: {
    professional: {
      what: 'Performed by an aesthetician or dermatologist using a surgical-grade scalpel (#10 blade)',
      benefit: 'Correct angle control, consistent pressure, trained for complications',
      frequency: 'Every 4-6 weeks',
    },
    diy: {
      tools: 'Consumer dermaplaning razors (Dermaflash, Michael Todd Beauty), facial razors, eyebrow razors',
      risk: 'Higher risk of incorrect angle causing cuts. Consumer razors are smaller and designed for more limited use.',
      technique: 'Hold at 45 degrees, short light strokes downward on cheeks and forehead. Do NOT go over lips, around eyes, or any active blemishes.',
    },
  },
};

// ─── MICROCURRENT ─────────────────────────────────────────────────────────────

export const MICROCURRENT_GUIDE = {
  what: 'Microcurrent devices deliver very low-level electrical current to facial muscles — mimicking the body\'s own bioelectrical field. The current is imperceptible to most people.',

  mechanism: {
    atp_production: 'Microcurrent is thought to stimulate ATP (adenosine triphosphate) production in cells — the energy currency of the cell. Increased ATP supports collagen and elastin production.',
    muscle_re_education: 'Repeated microcurrent treatment is said to "re-educate" facial muscles — training lifted, toned facial muscle positions over time',
    product_penetration: 'Conductive gels used with microcurrent carry skincare ingredients deeper into the skin via electrical current (iontophoresis principle)',
  },

  evidence: {
    clinical: 'Strongest evidence base of any facial tool — several small clinical studies show increased fibroblast activity, collagen production, and muscle activity changes',
    professional_vs_consumer: 'Professional microcurrent (100-400 microamperes) is more powerful than consumer devices (up to 400 microamperes but typically less). Professional results are more dramatic.',
    realistic_expectation: 'Subtle, cumulative lifting and toning over weeks-months of regular use. NOT a dramatic instant transformation. The best results come from consistent long-term use.',
  },

  devices: {
    professional: [
      { name: 'NuFace Trinity', note: 'The most clinically studied consumer device. FDA-cleared. Considered the gold standard in consumer microcurrent.', price: 'Mid-high ($400)' },
      { name: 'NuFace Mini', note: 'Smaller, less powerful NuFace. Good for targeted areas.', price: 'Mid ($300)' },
    ],
    emerging: [
      { name: 'ZIIP', note: 'Uses both microcurrent and nano current. App-controlled. Positive reviews.', price: 'Luxury ($500)' },
      { name: 'Foreo Bear', note: 'Combines microcurrent with T-sonic pulsations. App-controlled.', price: 'Mid-high ($300)' },
    ],
  },

  for_ethnic_skin: {
    safety: 'Microcurrent is safe for all skin tones — it is an electrical current affecting muscle and cellular function, not a pigment-based or heat-based treatment',
    benefit: 'Particularly relevant for those concerned with facial contour and firmness — concerns that exist across all skin tones. Many women of colour report excellent results with consistency.',
    contraindications: 'Do NOT use if you have: pacemaker, implanted metal (dental implants are fine), epilepsy, pregnancy, active acne/rosacea flares (wait until healed)',
  },

  technique: {
    gel: 'Use the conductive gel that comes with the device OR a water-based serum. Oil is NOT conductive — current will not travel properly through oil.',
    direction: 'Follow the specific directional guides for your device. Generally upward and outward motions on the face and neck.',
    frequency: 'Daily or 5x per week for first 60 days (loading phase); then 2-3x per week maintenance.',
    consistency: 'Results require consistent long-term use — like exercise for facial muscles. Missing sessions = losing results.',
  },
};

// ─── LED LIGHT THERAPY ────────────────────────────────────────────────────────

export const LED_THERAPY_GUIDE = {
  what: 'LED (Light Emitting Diode) therapy uses specific wavelengths of light to stimulate different biological processes in the skin. Different wavelengths (colours of light) have different effects.',

  wavelengths_and_effects: {
    red: {
      wavelength: '620-700nm',
      effects: ['Stimulates fibroblasts and collagen production', 'Reduces inflammation', 'Improves circulation', 'Anti-aging effects'],
      best_for: 'Anti-aging, overall skin health, wound healing',
    },
    near_infrared: {
      wavelength: '800-900nm',
      effects: ['Deeper tissue penetration than red', 'More potent anti-aging effects', 'Muscle recovery', 'Deeper collagen stimulation'],
      best_for: 'Serious anti-aging, deeper tissue effects',
    },
    blue: {
      wavelength: '415-460nm',
      effects: ['Kills Cutibacterium acnes (acne bacteria) on the skin surface', 'Reduces acne lesions'],
      best_for: 'Active acne treatment',
      caution: 'Blue light generates free radicals — always apply antioxidant (vitamin C, vitamin E) after blue LED treatment',
    },
    yellow: {
      wavelength: '570-590nm',
      effects: ['Redness reduction', 'Stimulates lymphatic flow', 'Some brightening evidence'],
      best_for: 'Sensitive skin, redness',
    },
    green: {
      wavelength: '520-560nm',
      effects: ['Hyperpigmentation', 'Some calming effects'],
      best_for: 'Hyperpigmentation, although evidence is weaker than for red light',
    },
  },

  for_ethnic_skin: {
    safety: 'LED light therapy at correct wavelengths and intensities is safe for all skin tones. Unlike laser treatments, LED does not concentrate energy in a way that can cause heat-related hyperpigmentation.',
    recommendation: {
      red_light: 'Excellent and safe for all skin tones. Anti-aging and anti-inflammatory benefits.',
      green_light: 'Some potential for hyperpigmentation reduction — can be a useful adjunct to topical treatments',
      blue_light: 'Safe but follow with antioxidants — the free radical generation risk is universal regardless of skin tone',
    },
    eye_protection: 'ALWAYS wear the provided eye shields. Direct LED exposure to eyes is dangerous regardless of skin tone.',
  },

  devices: {
    professional: {
      what: 'Omnilux, LightStim, and dermatology office devices. Much higher power output than consumer devices.',
      note: 'Professional treatments typically involve 20-minute sessions with powerful panels',
    },
    consumer: [
      { name: 'Omnilux Contour Face', note: 'FDA-cleared, one of the most clinically validated consumer LED masks. Flexible, covers whole face.', price: 'Luxury ($395)' },
      { name: 'CurrentBody LED Face Mask', note: 'Award-winning, clinically tested LED mask. Very popular.', price: 'Mid-high ($380)' },
      { name: 'Dr. Dennis Gross DRx SpectraLite FaceWare Pro', note: 'Both red and blue light. Rigid mask format.', price: 'Mid-high ($455)' },
      { name: 'Baby Quasar MD Plus', note: 'Handheld red and near-infrared device, for targeted areas', price: 'Mid ($350)' },
    ],
    budget_note: 'Very cheap LED devices (under $50) typically have too low output to produce clinical results. The investment-level devices have documented power output.',
  },
};

// ─── MICRONEEDLING ────────────────────────────────────────────────────────────

export const MICRONEEDLING_GUIDE = {
  what: 'Microneedling uses tiny needles to create controlled micro-injuries in the skin, triggering the body\'s wound healing response — collagen and elastin production. Available as professional treatment and consumer dermarollers.',

  professional_microneedling: {
    needle_length: '1.0-2.5mm — reaches into the dermis where collagen is produced',
    benefits: ['Significant collagen induction', 'Scar improvement (acne scars, surgical scars)', 'Skin texture refinement', 'Hyperpigmentation reduction (with serum)'],
    procedure: 'Numbing cream applied 45-60 minutes before. Treatment 30-60 minutes. Significant redness and micro-bleeding during treatment.',
    recovery: '1-3 days of redness and micro-swelling',
  },

  consumer_dermaroller: {
    needle_length: '0.25-0.5mm — reaches upper dermis at most. Different result from professional.',
    benefits: ['Increased product penetration (the main consumer benefit)', 'Mild collagen stimulation', 'Some improvement in fine lines and texture over time'],
    frequency: '1-2x per week for 0.25-0.5mm. Once weekly maximum for scalp use.',
    brands: ['GloPRO (0.3mm)', 'Stacked Skincare Micro-Roller', 'Sdara Skincare Derma Roller'],
  },

  for_ethnic_skin: {
    the_critical_warning: 'Microneedling in Fitzpatrick IV-VI skin requires extra precaution due to significantly elevated PIH risk. The wound healing response that produces collagen ALSO activates melanocytes, which can produce excess pigment.',
    safe_practice: [
      'Seek a dermatologist or aesthetician with documented experience in darker skin tones',
      'Avoid microneedling during summer or high UV seasons if possible',
      'Use a tyrosinase inhibitor (niacinamide, kojic acid, tranexamic acid) in the weeks before and after to suppress melanin production',
      'Mandatory broad-spectrum SPF after any microneedling — UV exposure post-needling dramatically increases PIH risk',
      'Start with shorter needle lengths (1.0-1.5mm) for darker skin',
      'Longer intervals between sessions for darker skin (6-8 weeks vs 4 weeks)',
    ],
    when_it_is_worth_it: 'For treatment of established PIH (dark marks from acne), atrophic acne scars, or stretch marks — microneedling combined with appropriate serums (vitamin C, tranexamic acid) can be significantly more effective than topicals alone, even accounting for the risk.',
    platelet_rich_plasma: 'PRP (Platelet Rich Plasma) combined with microneedling has good evidence for scar and PIH treatment in darker skin — the growth factors in PRP support healing and reduce inflammatory pigmentation risk.',
  },
};

// ─── FACIAL MASSAGE TECHNIQUES ────────────────────────────────────────────────

export const FACIAL_MASSAGE_GUIDE = {
  what: 'Manual facial massage using hands — stimulates circulation, lymphatic drainage, and fascia release. Ancient practice across all beauty cultures.',

  lymphatic_drainage: {
    what: 'Gentle technique that follows lymphatic pathways to reduce facial fluid retention and puffiness',
    technique: [
      'Start by pumping the neck lymph nodes: place fingers on either side of neck above clavicle, press gently and pump upward 5-6 times',
      'Then using very light pressure (lymphatics are superficial), stroke from center of face outward and downward toward the neck',
      'Under-eye: very gently stroke from inner eye outward and down toward ear',
      'Cheek: stroke outward from nose toward ear, then down toward neck',
    ],
    when: 'Morning for depuffing; can also do evening for relaxation',
    for_ethnic_skin: 'Very safe for all skin tones — no trauma, no friction risk when done gently with oil',
  },

  japanese_kobido_massage: {
    what: 'Traditional Japanese facial massage technique — over 500 years old. Combines lymphatic drainage, muscle stimulation, and acupressure.',
    characteristics: 'Alternates between slow drainage strokes and faster tapping/stimulation movements',
    learning: 'Best learned from a trained therapist or video demonstration — the technique is specific',
    cultural_note: 'Kobido is a Japanese art form — practitioners train for years. Respecting its origin while adapting elements for home practice is appropriate.',
  },

  buccal_massage: {
    what: 'Internal facial massage performed with gloved hands inside the mouth, working on the buccal fat pad and internal facial muscles',
    claims: 'Facial lifting, improved contour, muscle tension relief from within',
    where: 'Professional treatment only — do not attempt at home',
    evidence: 'Growing in popularity; anecdotal evidence strong; limited clinical studies',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getGuaShaGuide() {
  return GUA_SHA_GUIDE;
}

export function getMicrocurrentGuide() {
  return MICROCURRENT_GUIDE;
}

export function getLEDGuide() {
  return LED_THERAPY_GUIDE;
}

export function getDermaplaneGuide() {
  return DERMAPLANING_GUIDE;
}

export function getMicroneedlingGuide() {
  return MICRONEEDLING_GUIDE;
}

export function getFacialMassageGuide() {
  return FACIAL_MASSAGE_GUIDE;
}

export function getToolSafetyForSkinTone(fitzpatrick) {
  const level = parseInt(fitzpatrick);
  const base = { guaSha: GUA_SHA_GUIDE.for_ethnic_skin, microneedling: MICRONEEDLING_GUIDE.for_ethnic_skin };
  if (level >= 4) {
    base.highRiskTools = ['dermaplaning (PIH risk)', 'microneedling (PIH risk)', 'aggressive gua sha'];
    base.safestTools = ['LED red light', 'ice roller', 'jade roller with oil', 'microcurrent'];
    base.note = 'With Fitzpatrick IV-VI skin, always prioritise inflammation control after any tool use. PIH risk is higher — start conservative.';
  }
  return base;
}

export const BEAUTY_TOOLS_STATS = {
  toolsCovered: 8,
  specificEthnicSkinGuidance: true,
  toolsWithPIHRisk: ['dermaplaning', 'microneedling', 'overly aggressive gua sha'],
  toolsSafeForAllSkinTones: ['LED light therapy', 'ice roller', 'microcurrent', 'gentle jade roller'],
};
