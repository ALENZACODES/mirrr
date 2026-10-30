/**
 * MIRRR Scalp Health & Conditions Guide
 * Seborrheic dermatitis, scalp psoriasis, tinea capitis,
 * scalp acne, alopecia areata, and scalp care across communities
 */

// ─── SCALP ANATOMY ─────────────────────────────────────────────────────────────

export const SCALP_ANATOMY = {
  

  unique_challenges: [
    'High sebum production creates the ideal environment for Malassezia yeast',
    'Hair itself traps products, sweat, and environmental pollutants',
    'Difficult to treat — products applied must penetrate through hair to reach scalp',
    'Different hair washing frequencies across cultures affect scalp microbiome differently',
    'Cultural hair practices (oils, protective styles, relaxers) significantly impact scalp health',
  ],

  scalp_microbiome: {
    what: 'Like the gut and skin, the scalp has a microbial community. The dominant organism is Malassezia — a lipophilic (fat-loving) yeast. When the microbiome is balanced, Malassezia is harmless. Disruption can lead to seborrheic dermatitis and flaking.',
    factors_affecting: [
      'Washing frequency — both too frequent and too infrequent disrupt the balance',
      'Sebum production levels (hormonal, genetic)',
      'Heavy oils applied to scalp feed Malassezia',
      'Antibiotics (systemic and topical)',
      'Stress — increases cortisol, changes sebum composition',
      'Humidity and climate',
    ],
  },
};

// ─── DANDRUFF & SEBORRHEIC DERMATITIS ────────────────────────────────────────

export const DANDRUFF_SEBB_DERM_GUIDE = {
  overview: {
    dandruff: 'Mild, non-inflammatory form of Malassezia overgrowth — white/grey flakes, possibly itchy scalp. No significant redness.',
    seborrheic_dermatitis: 'Moderate-severe — inflammatory response to Malassezia. Oily, yellow-white flakes; red, inflamed scalp; can extend to hairline, eyebrows, nose folds, ears, chest.',
    relationship: 'Dandruff and seborrheic dermatitis exist on the same spectrum — dandruff is the mild, non-inflammatory form, seborrheic dermatitis is moderate-severe with inflammation.',
  },

  

  appearance_in_different_skin_tones: {
    light_skin: 'Classic red/pink inflamed scalp with yellow-white oily flakes or white dry flakes.',
    medium_skin: 'Scalp appears darker and irritated rather than red. Flakes are white-grey.',
    dark_skin: 'Inflammation may appear as ashy, darker patches or irritation. Flakes appear white against dark hair — often more visible. In very dark skin, the "red" appears as deep purple-brown inflammation.',
  },

  treatment: {
    mild_dandruff: {
      pyrithione_zinc: {
        what: 'Antifungal and antibacterial — kills Malassezia, reduces flaking.',
        products: ['Head & Shoulders (classic, widely available)', 'DHS Zinc Bar', 'Vanicream Dandruff Shampoo'],
        use: 'Lather, leave on scalp 3-5 minutes before rinsing.',
      },
      selenium_sulfide: {
        what: 'Antifungal — highly effective against Malassezia.',
        products: ['Selsun Blue', 'Head & Shoulders Refresh (selenium version)'],
        note: 'Can temporarily discolour chemically-treated or light-coloured hair — use cautiously.',
      },
    },
    moderate_dandruff_seb_derm: {
      ketoconazole: {
        what: 'Antifungal — the most potent OTC/prescription antifungal shampoo against Malassezia.',
        products: ['Nizoral 1% (OTC)', 'Nizoral 2% (prescription in many countries)'],
        use: '2-3x per week for treatment, then once weekly for maintenance.',
        note: 'The standard first-line recommendation from dermatologists for seborrheic dermatitis.',
      },
      ciclopirox: {
        what: 'Antifungal — also works against bacteria. Prescription (Loprox shampoo).',
      },
      coal_tar: {
        what: 'Reduces scaling and slows cell turnover. Also anti-inflammatory.',
        products: ['Neutrogena T-Gel', 'DHS Tar Shampoo', 'Scytera'],
        note: 'Distinctive smell. Can temporarily stain light hair or scalp.',
        for_dark_skin: 'Coal tar is safe for darker skin — no special concern. It does not cause PIH.',
      },
    },
    severe_or_resistant: {
      topical_steroids: 'Prescription — fluocinolone acetonide scalp oil, betamethasone scalp solution. Use under dermatologist supervision.',
      topical_calcineurin_inhibitors: 'Tacrolimus and pimecrolimus used off-label — effective, no steroid side effects.',
      oral_antifungals: 'Fluconazole or itraconazole for severe, widespread, or resistant seborrheic dermatitis.',
    },
  },

  in_ethnic_hair: {
    challenge: 'Standard medicated shampoo use requires frequent washing, which conflicts with textured hair care practices.',
    solutions: [
      'Apply ketoconazole shampoo directly to the scalp section-by-section, leave 5 minutes, then shampoo as normal — reduces need to wash full hair repeatedly',
      'Targeted spot treatment with antifungal solution between wash days',
      'Fluocinolone acetonide scalp oil (Derma-Smoothe) — applied to scalp, left overnight or several hours, then rinsed. Oil format suits textured hair care routines.',
      'Apple cider vinegar diluted 1:1 — antimicrobial, temporarily reduces Malassezia. Use between washes. Not a substitute for antifungal treatment.',
      'Tea tree oil diluted in carrier oil — some evidence for antimicrobial activity against Malassezia. Apply to scalp pre-wash.',
    ],
    oil_caution: 'Heavy oils applied directly to the scalp (a common practice in many textured-hair traditions) feed Malassezia. If experiencing seborrheic dermatitis, stop applying heavy oils to the scalp directly. Apply to hair length only.',
  },
};

// ─── SCALP PSORIASIS ──────────────────────────────────────────────────────────

export const SCALP_PSORIASIS_GUIDE = {
  what: 'Scalp psoriasis is an autoimmune condition where the immune system triggers accelerated skin cell production on the scalp. Thick, silvery-white scales (plaques) form on the scalp, often extending to the hairline, forehead, back of neck, and ears.',

  vs_seborrheic_dermatitis: {
    scale: 'Seborrheic dermatitis — yellow, oily, soft scales. Psoriasis — silvery-white, thicker, dry scales.',
    extent: 'Psoriasis plaques are more well-defined and thicker. Seb derm tends to be more diffuse.',
    distribution: 'Psoriasis can extend well beyond the hairline. Seb derm tends to stay in sebum-rich areas.',
  },

  in_dark_skin: {
    appearance: 'On darker skin, psoriasis plaques appear with less obvious redness at their base — more purple, brown, or deep pink. Scales appear white. Can be mistaken for seborrheic dermatitis.',
    pih: 'After psoriasis plaques resolve, significant PIH marks are left. For darker-skinned individuals, managing PIH is a key part of psoriasis care.',
  },

  treatment: {
    topical: [
      'Coal tar shampoos and solutions — reduce scaling, slow cell production, anti-inflammatory',
      'Topical corticosteroids (prescription) — first-line medical treatment. Betamethasone solution/foam.',
      'Calcipotriol (Vitamin D analogue) — effective, no steroid side effects',
      'Salicylic acid — descaling agent, helps remove thick scales to allow other treatments to penetrate',
      'Combination betamethasone/calcipotriol — very effective',
    ],
    for_textured_hair: {
      challenge: 'Same challenge as seb derm — frequent product application conflicts with textured hair washing schedules.',
      solutions: [
        'Fluocinolone acetonide oil (Derma-Smoothe FS) — specifically designed to be applied to scalp and left in — ideal for textured hair',
        'Clobetasol propionate foam — easier to apply to scalp without disrupting hair',
        'Targeting wash days for active treatment application',
      ],
    },
    systemic: 'For widespread or severe scalp psoriasis: oral methotrexate, biologics (adalimumab, secukinumab, risankizumab). Discuss with dermatologist.',
  },
};

// ─── TINEA CAPITIS ─────────────────────────────────────────────────────────────

export const TINEA_CAPITIS_GUIDE = {
  what: 'Tinea capitis is a fungal infection of the scalp and hair shaft — caused by dermatophyte fungi (Trichophyton and Microsporum species). Commonly called "ringworm of the scalp" — nothing to do with worms.',

  

  appearance: {
    black_dot: 'Black dot pattern — hair breaks off at the scalp level, leaving characteristic black dots. Common with T. tonsurans infections. More prevalent in African American children.',
    scaly_patches: 'Grey, scaly, hypopigmented areas with broken hairs. Can be itchy.',
    kerion: 'Severe inflammatory response — painful, boggy scalp mass with pus discharge. Can cause permanent scarring and hair loss if not treated promptly.',
    favus: 'Less common — yellow crusts (scutula) on scalp.',
  },

  treatment: {
    important: 'TOPICAL antifungals ALONE ARE NOT EFFECTIVE for tinea capitis — the infection is inside the hair shaft where topicals cannot penetrate.',
    oral: {
      first_line: [
        'Griseofulvin (traditional first-line, especially for Microsporum)',
        'Terbinafine (newer, shorter course — preferred for Trichophyton)',
        'Itraconazole or fluconazole (alternatives)',
      ],
      adjunct: 'Antifungal shampoo (ketoconazole or selenium sulfide) ALONGSIDE oral treatment reduces spore shedding and spread to others.',
    },
    preventing_spread: [
      'Children should stay home from school until treatment is started (not until fully cleared)',
      'Do not share hats, combs, pillowcases, towels',
      'Screen household contacts',
      'Wash bedding and personal items',
    ],
  },
};

// ─── ALOPECIA AREATA ──────────────────────────────────────────────────────────

export const ALOPECIA_AREATA_GUIDE = {
  what: 'Alopecia areata is an autoimmune condition where the immune system attacks hair follicles, causing sudden patchy hair loss. The follicles remain alive — hair can regrow but may fall out again.',

  types: [
    { type: 'Alopecia areata', description: 'One or more smooth, oval patches of hair loss' },
    { type: 'Alopecia totalis', description: 'Complete scalp hair loss' },
    { type: 'Alopecia universalis', description: 'Complete scalp AND body hair loss (eyebrows, eyelashes, body hair)' },
    { type: 'Ophiasis pattern', description: 'Hair loss in a band shape along the sides and lower scalp — poor prognosis for regrowth' },
  ],

  in_ethnic_communities: {
    
    black_community: {
      emotional_impact: 'Hair has deep cultural, racial, and spiritual significance in Black communities — alopecia areata can therefore carry profound emotional weight beyond its physical effects.',
      support: 'The National Alopecia Areata Foundation (NAAF) and community groups specifically for Black and POC individuals with alopecia offer important support and community.',
    },
  },

  treatment: {
    topical_steroids: 'First-line for limited disease — superpotent corticosteroid creams or foam applied to patches.',
    intralesional_steroids: 'Injections directly into patches by dermatologist — most effective for limited disease.',
    minoxidil: 'Promotes regrowth — not a disease-modifying treatment but aids hair return.',
    contact_immunotherapy: 'DPCP or SADBE — topical chemicals applied to deliberately cause a local immune response, "distracting" the immune system from attacking follicles. Effective for extensive disease.',
    jak_inhibitors: {
      what: 'Baricitinib (Olumiant), ritlecitinib (Litfulo) — FDA-approved JAK inhibitors specifically for alopecia areata. Revolutionary — the first systemic treatments proven effective for alopecia areata.',
      effectiveness: 'Can produce significant regrowth including in totalis and universalis cases that previously had no effective treatment.',
      note: 'Prescription, requires monitoring due to immunosuppression. A major advance in alopecia areata care.',
    },
  },
};

// ─── SCALP ACNE ──────────────────────────────────────────────────────────────

export const SCALP_ACNE_GUIDE = {
  what: 'Folliculitis (inflamed, infected hair follicles) on the scalp — pimple-like bumps, sometimes with pus, often painful or itchy.',

  causes: [
    'Sweat and occlusion — sports helmets, tight hair ties, sweatbands',
    'Product buildup — heavy oils, dry shampoo, styling products on scalp',
    'Infrequent washing — allows sebum, sweat, and bacteria to build up',
    'Bacterial (Staphylococcus aureus) — most common cause',
    'Malassezia (pityrosporum folliculitis) — fungal folliculitis looks identical to bacterial',
    'Physical trauma — tight styles, too-tight braids',
  ],

  treatment: {
    mild: [
      'Salicylic acid shampoo (2%) — unclogs follicles',
      'Tea tree oil in shampoo — antimicrobial',
      'More frequent washing if buildup is the cause',
    ],
    bacterial: [
      'Benzoyl peroxide wash applied to scalp (leave on before rinsing)',
      'Topical clindamycin solution (prescription)',
      'Oral antibiotics for extensive or resistant cases',
    ],
    fungal: [
      'Ketoconazole shampoo — treats Malassezia folliculitis (not bacterial)',
      'Oral fluconazole for extensive fungal folliculitis',
    ],
  },

  prevention: [
    'Remove sweaty headgear promptly',
    'Wash hair after intense exercise',
    'Avoid applying heavy products directly to scalp',
    'Ensure styles are not too tight',
    'Regular scalp cleansing appropriate to hair type',
  ],
};

// ─── SCALP CARE BY COMMUNITY ──────────────────────────────────────────────────

export const SCALP_CARE_BY_COMMUNITY = {
  west_african_black_american: {
    context: 'Textured hair typically has lower natural sebum distribution from root to tip due to the coil/curl pattern, meaning scalp can be oilier at the root while hair is drier at the tips. Wash days are less frequent (1-2x weekly is common for natural hair; less for protective styles).',
    practices: {
      scalp_oiling: 'Applying oil directly to the scalp is a traditional practice. While nourishing for hair, heavy oils (coconut, castor) directly on the scalp can exacerbate seborrheic dermatitis in susceptible individuals.',
      recommended_scalp_oils: [
        'Jojoba oil — most closely resembles sebum, non-comedogenic for scalp',
        'Peppermint oil (diluted in carrier) — antimicrobial, stimulates circulation',
        'Rosemary oil (diluted) — DHT-blocking evidence; promotes hair growth',
        'Avoid: heavy castor oil directly on scalp if prone to seborrheic dermatitis',
      ],
      scalp_scrubs: 'Physical scalp scrubs — commercial or DIY (brown sugar + conditioner) — effective for removing buildup and dead skin. Use monthly.',
    },
  },

  south_asian: {
    context: 'Champi (head massage with warm oil) is a centuries-old tradition across the subcontinent. Traditional oils: coconut, sesame, mustard, brahmi, amla.',
    practices: {
      champi: {
        what: 'Warm oil massage of the scalp, hair, and sometimes shoulders and upper back. Practiced from childhood.',
        benefits: 'Improves scalp circulation, can promote hair growth, deeply conditioning for dry hair.',
        oils: 'Coconut oil (most common), amla oil (Indian gooseberry — rich in vitamin C and tannins, traditionally believed to prevent greying), brahmi oil (anti-inflammatory for scalp).',
        frequency: 'Traditional: 1-3x weekly before wash. Leaves hair very heavy — full shampoo required after.',
      },
      concern: 'If prone to scalp seborrheic dermatitis, the champi tradition can exacerbate due to heavy oil application. Modified approach: apply oil to hair length only, not scalp.',
    },
  },

  arab: {
    context: 'Hammam (steam bath) tradition provides regular deep scalp cleansing. Argan oil and black seed oil are traditional scalp treatments.',
    practices: {
      hammam_effect: 'Regular hammam visits with kese exfoliation on the scalp effectively removes buildup and dead skin. Scalp health is often excellent in cultures with regular hammam access.',
      black_seed: 'Nigella sativa (black seed) oil — anti-inflammatory, some evidence for scalp health and hair growth. Applied to scalp, left for 30 minutes, then washed.',
    },
  },

  east_asian: {
    context: 'Korean and Japanese scalp care is meticulous — the concept of a healthy scalp for healthy hair is deeply embedded.',
    practices: {
      scalp_scalers: 'Scalp exfoliant serums applied before shampooing — dissolve sebum and dead skin. Brands: AMOS (professional Korean brand), scalp serums from Mise en Scene.',
      scalp_massage: 'Dedicated scalp massage tools (rubber massage brushes, electric scalp massagers) are mainstream in Korea and Japan.',
      frequent_washing: 'Daily or every-other-day washing is standard in Japan — excellent for scalp health, may require extra conditioning for hair length.',
    },
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getScalpAnatomyGuide() {
  return SCALP_ANATOMY;
}

export function getDandruffGuide() {
  return DANDRUFF_SEBB_DERM_GUIDE;
}

export function getScalpPsoriasisGuide() {
  return SCALP_PSORIASIS_GUIDE;
}

export function getTineaCapitisGuide() {
  return TINEA_CAPITIS_GUIDE;
}

export function getAlopeciaAreaataGuide() {
  return ALOPECIA_AREATA_GUIDE;
}

export function getScalpAcneGuide() {
  return SCALP_ACNE_GUIDE;
}

export function getScalpCareForCommunity(communityId) {
  return SCALP_CARE_BY_COMMUNITY[communityId] || null;
}

export function getScalpConditionGuide(condition) {
  const map = {
    dandruff: DANDRUFF_SEBB_DERM_GUIDE,
    seb_derm: DANDRUFF_SEBB_DERM_GUIDE,
    psoriasis: SCALP_PSORIASIS_GUIDE,
    tinea: TINEA_CAPITIS_GUIDE,
    alopecia_areata: ALOPECIA_AREATA_GUIDE,
    scalp_acne: SCALP_ACNE_GUIDE,
  };
  return map[condition] || null;
}

