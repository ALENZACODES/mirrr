/**
 * MIRRR Facial Massage Guide
 * Lymphatic drainage, face yoga, depuffing techniques, gua sha,
 * jade roller, kansa wand, buccal massage, and tool guides
 * with skin-of-colour specific safety notes
 */

// ─── FACIAL MASSAGE SCIENCE ───────────────────────────────────────────────────

export const FACIAL_MASSAGE_SCIENCE = {
  evidence_overview: 'Facial massage has ancient traditions across cultures. Scientific evidence for specific anti-aging claims is limited; evidence for circulation improvement, lymphatic drainage, and relaxation is stronger.',

  what_we_know: {
    circulation: 'Massage increases blood flow to the massaged area — visible as temporary flush/redness. Increased circulation brings nutrients and oxygen to skin cells.',
    lymphatic_drainage: 'The lymphatic system runs parallel to blood vessels; unlike blood vessels, lymph has no heart pumping it — it relies on muscle movement and external pressure. Gentle massage along lymph drainage pathways encourages lymph flow and reduces fluid accumulation.',
    muscle_relaxation: 'Facial muscles (frontalis, temporalis, zygomaticus, etc.) can hold tension. Massage releases tension and may temporarily soften expression lines caused by muscular tension.',
    product_absorption: 'Massage helps drive facial oil or serum into skin rather than it sitting on the surface — though most research suggests this effect is modest.',
    cortisol_reduction: 'Facial massage activates the parasympathetic nervous system, reducing cortisol. The effect on skin is indirect — lower cortisol supports skin barrier integrity and reduces inflammation.',
  },

  what_we_dont_know: {
    anti_aging: 'Claims that facial massage "lifts" or provides lasting structural change to facial tissue are not well-supported. The Kegel-for-the-face metaphor (strengthening facial muscles = lifting) is appealing but not verified by controlled research. Some researchers argue the opposite — repetitive facial muscle movements contribute to expression lines.',
    collagen: 'Claims that massage stimulates collagen production are largely theoretical; clinical evidence is thin.',
  },

  dark_skin_caution: {
    PIH_risk: 'For Fitzpatrick IV-VI skin tones: ANY technique that causes visible redness, skin irritation, or petechiae (tiny broken capillaries under skin) is inappropriate. The inflammatory response from over-aggressive massage can trigger PIH.',
    rule: 'Facial massage for dark skin tones = light pressure; smooth gliding; no dragging; no suction cups; stop immediately if any redness develops.',
  },
};

// ─── LYMPHATIC DRAINAGE MASSAGE ───────────────────────────────────────────────

export const LYMPHATIC_DRAINAGE = {
  lymphatic_system_basics: {
    function: 'The lymphatic system is the body\'s "drainage" system — collecting interstitial fluid, proteins, and waste products from tissues and returning them to the bloodstream.',
    facial_nodes: {
      preauricular: 'In front of the ear',
      postauricular: 'Behind the ear',
      submandibular: 'Under the jaw',
      submental: 'Under the chin',
      cervical: 'Along the neck',
    },
    why_face_puffs: 'Fluid accumulation in facial tissue (particularly under eyes and along jawline) occurs when lymph isn\'t draining efficiently. Sleep position, salt intake, alcohol, and sinus issues all affect facial puffiness.',
  },

  correct_technique: {
    principles: [
      'Extremely gentle pressure — lymph vessels are close to the skin surface and very delicate',
      'Direction always toward nearest lymph node, then down the neck toward the clavicle (collar bone)',
      'Slow, rhythmic pumping or stroking movements',
      'Never press hard; never drag skin',
    ],
    sequence: [
      '1. Begin at collar bone — gently pump skin at the base of the neck downward. This creates a "drain" for fluid above.',
      '2. Neck: sweep upward-and-outward strokes from base of neck to ears (10 strokes each side)',
      '3. Jaw: light strokes from chin along jawline toward ears and down neck (10 strokes)',
      '4. Cheeks: from nose outward to ears, then down to neck (10 strokes each side)',
      '5. Under eyes: extremely gentle; two-finger tap from inner to outer corner and down to cheekbone',
      '6. Forehead: from centre outward to temples, then down in front of ear to neck (10 strokes)',
      '7. End at collar bone: pump again to complete the drainage circuit',
    ],
    product: 'Apply facial oil or gentle moisturiser first; dry massage drags skin. A few drops of squalane or jojoba oil allows hands to glide without friction.',
    duration: '3-5 minutes daily; best done in the morning to address overnight puffiness.',
    for_dark_skin: 'Lymphatic drainage is an excellent technique for all skin tones — it uses extremely light pressure and should cause no redness or irritation.',
  },

  specific_concerns: {
    undereye_puffiness: {
      cause: 'Most commonly fluid accumulation; can also be fat herniation (permanent structural change that massage does not help). Massage helps the fluid cause only.',
      technique: 'Very gentle two-finger tapping from inner corner along orbital bone (below eye) outward to temple, then down pre-auricular node to neck.',
      cold: 'Cold compress (cold spoon, jade roller from fridge, cold tea bags) before massage — vasoconstriction reduces puffiness immediately; massage drains it.',
    },
    jawline_puffiness: {
      common_cause: 'Water retention; dental inflammation; lymph node swelling (check for illness).',
      technique: 'Gentle strokes along jawline from chin toward ear, then down in front of ear.',
      when_not_massage: 'Swollen lymph nodes that are tender or persistent (more than 2 weeks) should be seen by a doctor — lymph node swelling can indicate infection or other conditions.',
    },
  },
};

// ─── FACE YOGA ────────────────────────────────────────────────────────────────

export const FACE_YOGA = {
  overview: 'Face yoga uses intentional facial muscle exercises to purportedly tone and strengthen facial muscles, with the goal of a lifted, firmer appearance.',
  evidence: 'A small 2018 Northwestern University study found that a 20-week face yoga programme resulted in slightly fuller upper and lower cheeks and younger perceived age. Study was small and lacked blinding; results were modest. Other research is limited.',
  controversy: {
    opposing_view: 'Some dermatologists and facial plastic surgeons argue that facial exercises that create repeated creasing of skin contribute to dynamic wrinkles rather than reducing them. The dermatology literature on expression line formation supports this concern.',
    balanced: 'Face yoga may provide modest toning benefits for some people. The likely negative of repeated creasing is low for young skin; more significant for mature skin. Practices that focus on LIFTING (against gravity) rather than repeated creasing are less concerning.',
  },

  basic_exercises: {
    cheek_lift: {
      name: 'Cheek Sculpting',
      how: 'Smile broadly with lips closed; press fingertips gently to cheek muscles; lift gently upward against resistance.',
      targets: 'Zygomaticus, levator labii — cheek muscles.',
    },
    forehead_smoother: {
      name: 'Forehead Soother',
      how: 'Press palms flat on forehead; gently slide upward toward hairline as if smoothing a cloth. Creates resistance against frontalis muscle.',
      targets: 'Reduces forehead tension without creasing.',
    },
    neck_and_jawline: {
      name: 'Giraffe Neck',
      how: 'Tilt head back; press tongue to roof of mouth; swallow. Repeat.',
      targets: 'Platysma (neck muscle); jawline definition.',
    },
    eye_area: {
      name: 'Eye Opener',
      how: 'Place index fingers above eyebrows; apply gentle downward pressure while raising eyebrows as if surprised. Hold 5 seconds.',
      targets: 'Orbicularis oculi; frontalis.',
      CAUTION: 'Any tugging on eye skin should be minimal — eye area skin is most fragile.',
    },
  },

  consistency: 'Most face yoga practitioners recommend 20 minutes daily for 3+ months to see any results. The commitment required means starting a habit is the primary challenge.',
};

// ─── FACIAL MASSAGE TOOLS ─────────────────────────────────────────────────────

export const FACIAL_TOOLS = {
  jade_roller: {
    what: 'A roller with a small jade (or other stone) barrel at each end on a handle. Rolled across face for massage.',
    actual_benefit: 'The rolling action provides gentle lymphatic stimulation; the coolness of stone provides mild vasoconstriction.',
    jade_vs_others: 'Rose quartz, amethyst, obsidian rollers are also marketed. The stone type is largely irrelevant to efficacy — the rolling action and coolness is what provides benefit.',
    cooling: 'Store in refrigerator for enhanced depuffing. Cold + gentle rolling = excellent morning depuffing routine.',
    how_to_use: [
      '1. Apply facial oil or serum',
      '2. Start at neck — roll upward-outward toward ear',
      '3. Cheeks: roll from nose outward toward ear',
      '4. Under eye: use smaller barrel; very gentle outward roll',
      '5. Forehead: roll upward toward hairline',
      '6. Total: 3-5 minutes',
    ],
    cleaning: 'Wipe with damp cloth after each use; sanitise weekly with gentle cleanser.',
    real_stone_check: 'Authentic jade and rose quartz feel cold immediately and warm slowly. Glass and plastic stay at room temperature more quickly. Most affordable "jade" rollers are glass.',
    verdict: 'Genuinely useful tool for gentle lymphatic drainage and depuffing. Not a miracle anti-aging device.',
  },

  gua_sha_facial: {
    what: 'A flat scraping tool (traditionally jade, quartz, or bian stone; now also many other materials) used with oil to massage and "scrape" skin.',
    traditional_vs_facial: {
      traditional_body_gua_sha: 'Traditional gua sha is applied with firm pressure to the back and body to produce petechiae (red, purple bruise-like marks — "sha") believed to release stagnant blood and improve circulation. This produces real therapeutic effects and real skin markings.',
      facial_gua_sha: 'COMPLETELY DIFFERENT technique. Facial gua sha should use VERY LIGHT pressure, no petechiae, no redness, smooth gliding. It is essentially a specialised form of facial massage, not traditional therapeutic gua sha.',
    },
    benefits: 'Lymphatic drainage; muscle tension release; product absorption; circulation.',
    how_to_use: [
      '1. Apply generous facial oil',
      '2. Hold tool at shallow angle (15-30 degrees) to skin',
      '3. Light, sweeping strokes always moving OUTWARD and UPWARD',
      '4. Jawline: flat edge, sweep from chin toward ear (5-10 strokes)',
      '5. Cheek: sweep from nose toward ear (5-10 strokes)',
      '6. Brow: sweeping outward along brow bone',
      '7. Neck: downward strokes toward collarbone at end',
    ],
    dark_skin_critical: 'For Fitzpatrick IV-VI: gua sha must be with MINIMAL pressure. The SLIGHTEST redness or skin irritation indicates too much pressure — lighten immediately. The risk of PIH from over-aggressive gua sha is real and significant.',
    tool_shapes: {
      double_curve: 'For jawline contouring',
      heart: 'For cheek and forehead',
      comb_edge: 'For scalp massage',
      straight_edge: 'For neck and décolleté',
    },
    cleaning: 'Wash with warm soapy water after each use.',
  },

  kansa_wand: {
    what: 'An Ayurvedic massage tool made from kansa metal (bronze alloy of copper, tin, and sometimes zinc). Has a dome-shaped head used in circular massaging motions.',
    origin: 'Ancient Ayurvedic tradition. Kansa is considered in Ayurveda to draw out acidity and pitta (heat/fire dosha) from the body.',
    modern_use: 'Facial massage tool. The kansa metal is claimed to draw out toxins and alkalize skin pH. Evidence is limited but the massage action itself provides the documented benefits.',
    technique: 'Apply oil; use circular motions with gentle pressure across face, particularly at lymph nodes.',
    grey_film: 'The tool sometimes leaves a grey film on skin — this is a normal reaction of the metal with skin oils, not "toxins being drawn out." Wipe face after use.',
    for_south_asian_community: 'Particularly meaningful as part of South Asian Ayurvedic beauty tradition; the ritual and cultural connection has value beyond any claimed clinical effect.',
  },

  ice_rolling: {
    what: 'A facial roller filled with water that is frozen before use.',
    benefits: 'Vasconstriction reduces puffiness immediately; numbs mild pain; closes pores (temporarily).',
    technique: 'Remove from freezer; roll across face immediately (melts quickly).',
    CAUTION: 'Do not apply directly frozen metal on very sensitive or rosacea skin — can cause broken capillaries. Wrap in thin cloth if sensitive.',
    best_for: 'Morning depuffing; after exercise; acne inflammation.',
    dark_skin_note: 'Ice rolling is generally safe for dark skin tones; cold constriction does not stimulate melanin production.',
  },

  facial_cup: {
    what: 'Small silicone suction cups used on the face. Claimed to stimulate collagen and lift tissue.',
    CAUTION_DARK_SKIN: 'AVOID FACIAL CUPPING ON DARK SKIN (Fitzpatrick IV-VI). The suction creates controlled bruising in underlying tissue — this is the mechanism, not just a side effect. In darker skin, this bruising can manifest as prolonged PIH.',
    caution_general: 'Cupping on face should be done with gentle, CONSTANT MOTION — never leave cups stationary as this causes circular bruise marks.',
    verdict: 'Higher risk than other tools; less evidence; particularly inappropriate for darker skin tones.',
  },

  microcurrent: {
    what: 'Devices that deliver very low-level electrical current to face, purported to tone facial muscles (often called "non-surgical facelift").',
    examples: ['NuFACE Trinity', 'Bear by FOREO'],
    evidence: 'NuFACE has FDA clearance for facial toning; the clinical evidence shows modest, temporary improvements.',
    who_to_avoid: 'Contraindicated for: anyone with electronic implants (pacemakers, cochlear implants); pregnancy; epilepsy.',
    professional_vs_home: 'Professional microcurrent treatments use higher current; home devices are lower intensity and require more consistent use.',
    verdict: 'More credible technology than many facial tools; the electrical stimulation mechanism is physiologically plausible. Results are real but modest without professional-grade devices.',
  },
};

// ─── BUCCAL MASSAGE ───────────────────────────────────────────────────────────

export const BUCCAL_MASSAGE = {
  what: 'Buccal massage (also called intraoral massage) is a technique where a trained therapist inserts gloved fingers inside the mouth and massages the cheek muscles and fascia from the inside.',
  origin: 'Developed by French facialist Nathalie Gondinet-Monceau; made famous by celebrity facialist Joanna Czech.',
  claims: 'Deeply releases masseter tension, jaw tension, cheek volume, facial contouring, TMJ relief.',
  evidence: 'Limited controlled studies. Anecdotal reports of visible facial change post-treatment. The mechanism of releasing fascial tension from the inside is physiologically credible.',
  who_performs: 'Must be performed by a trained aesthetician or physiotherapist specialising in the technique. Not a DIY technique.',
  contraindications: ['Recent dental work', 'Active oral infection', 'TMJ conditions (consult with specialist first)', 'Very sensitive gag reflex'],
  popularity: 'Increasingly offered in high-end facialists; driven by social media celebrity endorsements. Cost: $200-600 per session.',
};

// ─── COMMUNITY MASSAGE TRADITIONS ─────────────────────────────────────────────

export const COMMUNITY_MASSAGE_TRADITIONS = {
  south_asian: {
    champi: {
      name: 'Champi (Indian Head Massage)',
      tradition: 'A centuries-old Ayurvedic practice. Originally a scalp massage using warm oil; the modern version (popularised internationally) also includes neck, shoulders, and face.',
      oils: 'Sesame oil (warming; Vata balancing), coconut oil (cooling; Pitta balancing), amla oil (hair strengthening).',
      technique: 'Circular strokes on scalp with fingertips; kneading; pressure on marma points. Rhythmic and meditative.',
      benefits: 'Hair growth stimulation; stress relief; lymphatic drainage.',
      cultural_context: 'Weekly champi by mother or grandmother was a bonding ritual across South Asia. Intergenerational beauty care.',
    },
    abhyanga_face: {
      name: 'Facial Abhyanga',
      tradition: 'Extension of full-body Ayurvedic oil massage to face. Specific marma (pressure) points on face.',
      marma_points: ['Sthapani (third eye)', 'Phana (sides of nostrils)', 'Apanga (outer eye corner)', 'Shanka (temple)'],
      technique: 'Warm medicated oil applied; circular and linear massage strokes following marma point map.',
    },
  },

  east_asian: {
    kobido: {
      name: 'Kobido (古美道)',
      origin: 'Japanese massage tradition dating to 1472. The ancient Japanese art of facial massage, literally "ancient way of beauty."',
      technique: 'Precise acupressure points; rhythmic tapping; pinching; kneading. Complex sequence of approximately 120 movements.',
      claim: 'Often called the "Japanese facelift." Increases blood circulation; activates facial muscles; lymphatic drainage.',
      modern_availability: 'Specialist Kobido practitioners; expensive; increasingly available in luxury spas globally.',
    },
    gua_sha_traditional: {
      name: 'Gua Sha Traditional (刮痧)',
      origin: 'Chinese medicine practice. Gua = scraping; Sha = petechiae.',
      body_use: 'Traditional body gua sha is therapeutic — applied with firm pressure to back, shoulders, limbs to release musculoskeletal tension and "sha" (stagnation).',
      NOT_facial: 'Traditional body gua sha technique is inappropriate for the face — see FACIAL_TOOLS.gua_sha_facial for correct facial approach.',
    },
  },

  arab: {
    hammam_facial: {
      name: 'Hammam Facial Ritual',
      tradition: 'The steam environment of the hammam opens pores; kesse mitt exfoliation is performed; ghassoul clay mask applied; rosehip oil used for massage.',
      rose_water: 'Rose water misting is traditional across Arab beauty as a finishing step — hydrating, aromatic, gentle toning.',
      kohl_application: 'Kohl application as part of the post-hammam beauty ritual — the steamed skin is considered ideal for kohl absorption.',
    },
  },

  west_african: {
    shea_butter_ritual: {
      tradition: 'Shea butter application is both practical and ritualistic in West African communities. Generous, enveloping application — warming the shea in palms before application is part of the practice.',
      community: 'Shared beauty rituals — women applying shea to children, mothers applying to daughters — are intergenerational bonding practices.',
    },
  },

  east_african: {
    frankincense: {
      tradition: 'Incense burning and frankincense resin applied to skin is traditional in East African (particularly Somali and Ethiopian) beauty practice.',
      boswellia: 'Boswellic acids in frankincense have documented anti-inflammatory properties. Frankincense essential oil used in facial massage (properly diluted in carrier oil).',
    },
  },

  latin_american: {
    maize_based: {
      tradition: 'Corn/maize-based treatments traditional in Mesoamerica. Masa (corn dough) sometimes used as a gentle skin cleansing and exfoliation treatment.',
    },
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getFacialMassageScience() {
  return FACIAL_MASSAGE_SCIENCE;
}

export function getLymphaticDrainageGuide(concern) {
  if (concern === 'undereye') return LYMPHATIC_DRAINAGE.specific_concerns.undereye_puffiness;
  if (concern === 'jawline') return LYMPHATIC_DRAINAGE.specific_concerns.jawline_puffiness;
  return LYMPHATIC_DRAINAGE;
}

export function getFaceYogaGuide(exercise) {
  if (exercise) return FACE_YOGA.basic_exercises[exercise] || FACE_YOGA;
  return FACE_YOGA;
}

export function getFacialToolGuide(tool) {
  return FACIAL_TOOLS[tool] || FACIAL_TOOLS;
}

export function getBuccalMassageGuide() {
  return BUCCAL_MASSAGE;
}

export function getCommunityMassageTradition(communityId) {
  return COMMUNITY_MASSAGE_TRADITIONS[communityId.replace('-', '_')] || null;
}

export const FACIAL_MASSAGE_STATS = {
  toolsReviewed: Object.keys(FACIAL_TOOLS).length,
  faceYogaExercises: Object.keys(FACE_YOGA.basic_exercises).length,
  communitiesCovered: Object.keys(COMMUNITY_MASSAGE_TRADITIONS).length,
  lymphNodesCovered: Object.keys(LYMPHATIC_DRAINAGE.lymphatic_system_basics.facial_nodes).length,
};
