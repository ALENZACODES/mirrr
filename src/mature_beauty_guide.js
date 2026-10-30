/**
 * MIRRR Mature Beauty Guide
 * Skin changes at 40+, 50+, 60+; effective anti-aging ingredients;
 * non-surgical treatments; multicultural aging patterns; mature hair care
 */

// ─── UNDERSTANDING SKIN AGING ─────────────────────────────────────────────────

export const SKIN_AGING_SCIENCE = {
  intrinsic_aging: {
    term: 'Intrinsic Aging (Chronological)',
    
    processes: [
      'Collagen production decreases — skin loses firmness and structure',
      'Elastin degrades — skin loses elasticity and "snap-back"',
      'Cell turnover slows — dead cells accumulate; skin appears dull',
      'Sebaceous gland activity declines — skin becomes drier',
      'Fat redistribution in the face — temples and cheeks hollow; jowls develop',
      'Bone resorption — the skull gradually loses volume, particularly around the eye sockets and jaw',
      'Muscle atrophy — facial muscles thin; less support for overlying tissue',
    ],
  },
  extrinsic_aging: {
    term: 'Extrinsic Aging (Photoaging and Environmental)',
    definition: 'Premature aging caused by external factors — primarily UV radiation (photoaging), but also pollution, smoking, poor nutrition, chronic stress, and sleep deprivation.',
    photoaging_features: [
      'Fine lines and wrinkles (primarily UV-caused)',
      'Hyperpigmentation — sunspots, age spots, melasma',
      'Leathery texture',
      'Broken capillaries (telangiectasia)',
      'Uneven skin tone',
    ],
    ethnic_note: 'Melanin provides some natural UV protection — darker skin tones (Fitzpatrick IV-VI) show photoaging significantly later than lighter skin tones. "Black don\'t crack" has a scientific basis. However, darker skin IS affected by UV damage and pigmentation concerns — just differently and later.',
  },
  menopause_skin: {
    hormonal_changes: 'Oestrogen decline (perimenopause 40s → menopause typically 51 average) dramatically accelerates skin aging. Oestrogen is critical for collagen synthesis, skin hydration, and barrier function.',
    menopause_skin_changes: [
      'Rapid collagen loss in the first years of menopause',
      'Dramatic dryness and loss of plumpness',
      'Increased sensitivity and redness',
      'Hot flashes affecting skin temperature and hydration',
      'Adult acne returning for some women (hormonal shifts)',
      'Facial hair increase (chin, upper lip)',
      'Skin thinning — especially around eyes',
    ],
    ethnic_menopausal: {
      darker_skin: 'Oestrogen loss can intensify hyperpigmentation and melasma in Fitzpatrick III-VI. Paradoxically, many dark-skinned women find hyperpigmentation WORSENS in perimenopause/menopause.',
      south_asian: 'Vitamin D3 supplementation important — darker skin produces less vitamin D from UV; postmenopausal bone health (collagen and bone matrix both estrogen-dependent).',
      
    },
  },
};

// ─── DECADES GUIDE ────────────────────────────────────────────────────────────

export const FORTIES_GUIDE = {
  decade: '40s',
  what_to_expect: {
    skin: [
      'Collagen loss becomes visibly apparent — fine lines deepen to wrinkles',
      'Nasolabial folds (nose-to-mouth lines) more pronounced',
      'Under-eye area — more pronounced hollowing, dark circles, puffiness',
      'Skin appears less plump and luminous',
      'Cell turnover slowing — dullness increasing',
      'Perimenopause may begin — skin can swing between oily (hormonal acne) and dry',
      'Hyperpigmentation accumulating from sun damage',
    ],
    hair: [
      'Grey hair appears (timing is genetic)',
      'Hair may become finer',
      'Density begins to decrease',
      'Scalp may become drier',
    ],
  },
  key_ingredients: {
    retinoids: 'If not already using, start now. Tretinoin (prescription) or retinaldehyde (OTC). Greatest anti-aging evidence of any topical. Builds collagen, accelerates cell turnover, fades pigmentation.',
    vitamin_c: 'Morning antioxidant. Brightens hyperpigmentation; stimulates collagen; protects against UV oxidative damage.',
    peptides: 'Signal peptides (Matrixyl, Argireline) support collagen production and skin structure. Good addition to retinoid routine.',
    niacinamide: 'Multi-tasking — brightening, barrier support, pore minimising. Excellent for hormonally-shifting 40s skin.',
    hyaluronic_acid: 'As skin produces less sebum and loses collagen, plumping hydration becomes critical.',
    sunscreen: 'SPF 50 every day without exception. Each day of protection now prevents visible aging in 10 years.',
  },
  skincare_priorities: [
    'Establish retinoid use if not already done',
    'Double cleanse at night (gentle AM cleanse)',
    'Layer hydration — humectant + emollient + occlusive at night',
    'Morning antioxidant (vitamin C or niacinamide) under SPF',
    'Eye cream with peptides and caffeine',
    'Regular exfoliation (AHA 2-3x per week) for cell turnover',
  ],
};

export const FIFTIES_GUIDE = {
  decade: '50s',
  what_to_expect: {
    skin: [
      'Menopause likely in early-to-mid 50s if not already — rapid collagen and oestrogen decline',
      'Significant volume loss in cheeks, temples, undereyes',
      'Deeper wrinkles and jowl development',
      'Skin markedly thinner — more fragile, more prone to bruising',
      'Dramatic dryness in many women',
      'Skin may appear more transparent',
      'Rosacea flares more common',
      'Seborrhoeic keratoses (rough, raised, waxy spots) common and harmless',
    ],
    hair: [
      'Grey/white hair increasingly dominant for most',
      'Significant density loss — hairline may recede slightly',
      'Textural change — grey hair is often coarser; coloured hair needs more moisture',
      'Scalp more vulnerable to dryness and sensitivity',
    ],
  },
  key_ingredients: {
    retinoids: 'Continue. Consider upgrading from retinol to prescription tretinoin if not already — 50s skin can handle it and needs the extra efficacy.',
    ceramides: 'Critical. Barrier function is significantly compromised. Look for formulas with Ceramide NP, AP, and EOP + cholesterol + fatty acids (the full skin-identical lipid matrix).',
    growth_factors: 'EGF (epidermal growth factor) and other growth factor serums have emerging evidence for anti-aging in 50s+ skin. Premium but effective.',
    bakuchiol: 'Retinol alternative from Psoralea corylifolia plant. Less irritating than retinol; anti-aging comparable evidence. Option for those who cannot tolerate retinoids.',
    collagen_peptides: 'Oral collagen peptides (2.5-10g daily hydrolysed collagen) have clinical evidence for skin hydration and elasticity improvement in women 40-65. Supplement, not topical.',
    spermidine: 'Emerging — naturally found in wheat germ; potential anti-aging effects through autophagy pathway.',
  },
  skincare_priorities: [
    'Maximum barrier support — ceramide moisturiser is now the foundation of the routine',
    'Facial oil at night is essential, not optional',
    'Eye and lip area require dedicated products with peptides',
    'Gentle exfoliation only — skin is thinner and more fragile',
    'SPF without question — every day',
    'Consider professional treatments (see below)',
  ],
  makeup_adjustments: {
    foundation: 'Satin or luminous finish over matte (which settles into wrinkles and looks powdery). Stick formulas can work well. Apply with damp sponge.',
    powder: 'Use sparingly or not at all — powder emphasises texture. Set only T-zone if needed. Loose powder with a light hand.',
    concealer: 'Under-eye concealer: peach/salmon colour corrector first; use finger or damp sponge (brush can crease); minimal product (less is more).',
    blush: 'Cream blush over powder for a natural flush effect. Apply to cheek apples and blend upward. Avoid heavy contouring.',
    eyes: 'Avoid heavy black liner on lower lashline (ages eyes). Try brown or grey. Mascara focused on upper lashes. Eyeshadow: shimmer on centre lid, matte on outer corner and crease.',
    lips: 'Lip liner to define and prevent bleed. Hydrating lip colours over extremely matte. Bold lip can be beautiful.',
    highlighter: 'A luminous highlighter on cheekbones, brow bone, and inner corner of eyes adds radiance and youth.',
  },
};

export const SIXTIES_PLUS_GUIDE = {
  decade: '60s and beyond',
  what_to_expect: {
    skin: [
      'Significant volume loss — hollowed temples, deepened nasolabial folds, pronounced jowls',
      'Sagging — skin and muscle laxity',
      'Very dry, thin, fragile skin for many',
      'Pronounced age spots and pigmentation changes',
      'Milia (white keratin cysts) may form',
      'Senile purpura (bruising from fragile blood vessels)',
      'Skin cancer risk elevated — regular dermatologist checks essential',
    ],
    hair: [
      'Most hair grey or white',
      'Significant density reduction',
      'Hair finer in texture',
      'Scalp skin more visible through hair',
    ],
  },
  key_ingredients: {
    everything_from_50s: 'Continue all 50s essentials — retinoids (gentler application), ceramides, growth factors, SPF',
    urea: 'Urea 5-10% in body moisturiser for very dry, thickened skin. Keratolytic and humectant combined.',
    salicylic_acid_scalp: 'For scalp flaking (common with dry scalp in 60s): 1-2% salicylic acid scalp treatment',
    vitamin_e: 'Topical vitamin E for very dry, fragile skin — soothing, healing, occlusive.',
  },
  skincare_priorities: [
    'Sun protection remains critical — skin cancer risk accumulates',
    'Annual dermatologist skin cancer check',
    'Focus on comfort and nourishment over aggression',
    'Retinoids can be continued but with very rich moisturisation',
    'Overnight masking (sleeping masks) for intense hydration',
    'Eye area: very gentle patting motions only — no tugging',
  ],
};

// ─── NON-SURGICAL TREATMENTS ──────────────────────────────────────────────────

export const NON_SURGICAL_TREATMENTS = {
  injectables: {
    botox_neurotoxin: {
      name: 'Botulinum Toxin (Botox, Dysport, Xeomin, Jeuveau)',
      mechanism: 'Temporarily relaxes muscles responsible for expression wrinkles. Works on dynamic wrinkles (formed by movement).',
      best_for: 'Forehead lines, frown lines (11s), crow\'s feet. Also brow lift, lip flip, gummy smile, jawline slimming (masseter injection).',
      duration: '3-6 months',
      ethnic_note: 'Masseter (jaw muscle) injections extremely popular in East Asian communities for face slimming/V-line effect. Safe but results in face shape change that may look unnatural if done to excess.',
      not_for: 'Static wrinkles (present at rest) — filler is better for those.',
    },
    dermal_fillers: {
      name: 'Dermal Fillers (HA, Radiesse, Sculptra)',
      types: {
        HA: 'Hyaluronic acid fillers (Juvederm, Restylane) — reversible with hyaluronidase; most common. Used for cheek, undereye, lip, nasolabial, jawline volume.',
        Radiesse: 'Calcium hydroxylapatite — stimulates collagen; not reversible. Hands and jawline.',
        Sculptra: 'Poly-L-lactic acid — collagen biostimulator; results build over months; longevity 2+ years.',
      },
      ethnic_note: 'Filler placement needs to respect heritage facial proportions. A skilled injector experienced with heritage faces (East Asian, South Asian, Black, Latina) is essential — inappropriate filler placement can westernise or flatten naturally beautiful heritage features.',
      risks: 'Vascular occlusion (injection into blood vessel) is the most serious risk — can cause skin necrosis or blindness if ophthalmic artery affected. Always choose board-certified practitioners.',
    },
  },
  energy_devices: {
    laser_resurfacing: {
      name: 'Laser Resurfacing (Fraxel, CO2, Erbium)',
      mechanism: 'Creates controlled wounds in skin; triggers collagen remodelling as skin heals.',
      ethnic_note: 'CRITICAL: Ablative and many non-ablative lasers have HIGH PIH risk for Fitzpatrick III-VI. Nd:YAG 1064nm and picosecond lasers are generally safest for darker skin tones. Always consult a dermatologist experienced with your skin tone.',
      best_for: 'Wrinkles, skin texture, light-medium pigmentation (in appropriate skin tones).',
    },
    radiofrequency: {
      name: 'Radiofrequency (Thermage, Morpheus8)',
      mechanism: 'Heat energy tightens existing collagen and stimulates new collagen production.',
      ethnic_note: 'Generally safer for darker skin tones than ablative lasers. Morpheus8 (RF microneedling) is often recommended for Fitzpatrick IV-VI for skin tightening and collagen stimulation.',
      best_for: 'Skin laxity, mild jowling, neck tightening.',
    },
    ultherapy: {
      name: 'Ultherapy / HIFU',
      mechanism: 'High-intensity focused ultrasound targets deep tissue (SMAS layer — same layer treated surgically). Non-invasive brow and neck lift.',
      best_for: 'Brow lift; neck and jawline tightening; non-surgical alternative to surgical facelift in early laxity.',
    },
    microneedling: {
      name: 'Microneedling (Professional)',
      mechanism: 'Creates controlled micro-injuries; stimulates collagen production; enhances product penetration.',
      ethnic_note: 'Relatively safe for darker skin tones when done professionally with appropriate settings. Avoid overly aggressive depths which could cause PIH. RF microneedling (Morpheus8) is preferred for dark skin.',
    },
    LED_therapy: {
      name: 'LED Light Therapy (Clinical)',
      red_light: 'Red light (620-700nm): stimulates fibroblasts; reduces inflammation; promotes collagen.',
      blue_light: 'Blue light (415nm): antimicrobial; kills P. acnes bacteria; anti-acne.',
      near_infrared: 'Near-infrared (700-1100nm): deeper penetration; wound healing; anti-inflammatory.',
      ethnic_note: 'Very safe for all skin tones. No PIH risk. Can be used by anyone. Home LED devices are less powerful than clinical devices but have emerging evidence.',
    },
  },
  professional_treatments: {
    chemical_peels: {
      superficial: 'Glycolic acid 10-30% or lactic acid peels. Safe for most skin tones with correct protocol. Brightening; texture improvement.',
      medium: 'TCA (trichloroacetic acid) 20-35%. Significant downtime. Moderate PIH risk for Fitzpatrick III-VI — must be done by expert in skin of colour.',
      deep: 'Phenol peels. HIGHEST PIH risk; permanently lightens skin; not recommended for Fitzpatrick III-VI.',
      
    },
    microdermabrasion: {
      name: 'Microdermabrasion',
      description: 'Physical exfoliation using microcrystals or diamond tip to remove dead skin cells. Gentle; no downtime.',
      ethnic_note: 'Generally safe for all skin tones. Hydradermabrasion (HydraFacial) is gentler and also hydrating — better option for darker skin than crystal microdermabrasion.',
    },
  },
};

// ─── ETHNIC AGING PATTERNS ────────────────────────────────────────────────────

export const ETHNIC_AGING_PATTERNS = {
  west_african: {
    unique_concerns: 'PIH remains primary concern at any age; eczema and keloid tendency continues with age; hairline recession in women (traction alopecia from lifetime of styling).',
    traditional_anti_aging: 'Shea butter as primary facial moisturiser (excellent ceramide-like composition); palm kernel oil; African black soap for cleansing.',
    recommended: 'Niacinamide for longstanding PIH; vitamin C; SPF 30 even for darker skin; moisturising routine becomes richer with age.',
  },
  south_asian: {
    unique_concerns: 'Melasma (hormones + UV) is common on medium-to-deep skin; PIH from any skin trauma; facial hair (hirsutism) common in perimenopause.',
    traditional_anti_aging: 'Turmeric face packs (haldi); sandalwood powder (chandan); rose water; sesame oil massage; bakuchiol (from bakuchi plant — natural retinol alternative).',
    recommended: 'Azelaic acid and tranexamic acid for melasma; rigorous SPF; gentle retinol or bakuchiol; vitamin C morning.',
  },
  caribbean: {
    unique_concerns: 'PIH in darker skin tones; possible sun-damaged lighter skin tones; hair porosity challenges with age.',
    traditional_anti_aging: 'Coconut oil (body); aloe vera (cooling, healing); castor oil (hair and eyebrows); black pepper and turmeric in cooking for anti-inflammatory benefits.',
    recommended: 'Consistent SPF 30-50; hyaluronic acid + ceramide moisturiser; retinoid as tolerated; eye cream with peptides.',
  },
  arab: {
    unique_concerns: 'Melasma on medium skin; sun damage in very sunny climates; facial hair; undereye pigmentation.',
    traditional_anti_aging: 'Argan oil (Moroccan "liquid gold") — excellent anti-aging oil; rose water toning; kohl/kajal eye tradition (antimicrobial properties claimed); hammam exfoliation.',
    recommended: 'Argan oil as face oil at night; tranexamic acid for melasma; niacinamide; retinol; vitamin C.',
  },
  latina: {
    unique_concerns: 'Melasma ("mask of pregnancy" and hormonal melasma); PIH in darker skin; uneven skin tone accumulated from UV exposure.',
    traditional_anti_aging: 'Aloe vera (sábila); avocado oil; jojoba; chamomile (manzanilla) for sensitive skin; rice water (agua de arroz).',
    recommended: 'Tranexamic acid + niacinamide combo for melasma; ceramide moisturiser; retinol; SPF 50.',
  },
  east_asian: {
    unique_concerns: 'Hyperpigmentation (liver spots/age spots); sagging due to rounder face shape losing scaffolding (particularly in Korean women who may choose buccal fat pad removal — worth reconsidering at 40+ as it causes premature hollowing with age).',
    traditional_anti_aging: 'Fermented skincare (sake yeast, fermented soybean/doenjang); camellia oil; rice bran; green tea extract; seaweed; Kobido facial massage.',
    recommended: 'Galactomyces (Pitera); fermented ingredients; 10-step Korean skincare with essence step; retinol; SPF obsession; facial massage.',
  },
  east_african: {
    unique_concerns: 'Keloid scarring tendency; PIH; hair fragility with age; traditional practices like scarification and skin lightening (highly discouraged).',
    traditional_anti_aging: 'Frankincense oil (boswellia) — traditionally used for inflammation and wound care; myrrh; shea butter; Ethiopian honey (tested for antimicrobial properties).',
    recommended: 'Frankincense oil at night; shea butter; niacinamide; azelaic acid for PIH; SPF (especially higher elevations in East Africa have intense UV).',
  },
  south_african: {
    unique_concerns: 'PIH; harsh beauty product legacy (traditional skin lightening products with illegal mercury were common — health crisis); transitioning to safe products.',
    traditional_anti_aging: 'Rooibos (red bush) tea — powerful antioxidant; applied topically or consumed; marula oil — beauty secret; baobab oil.',
    recommended: 'Marula oil as primary face oil (South African origin!); rooibos extract; niacinamide; SPF; gentle retinol.',
  },
  black_american: {
    unique_concerns: 'PIH remains primary concern at all ages; moisturising hair routinely throughout life; protective style legacy maintaining hair health; dermatology access disparities.',
    traditional_anti_aging: 'Vaseline as occlusive (hugely culturally embedded — and scientifically sound); castor oil for hair; coconut oil for body.',
    recommended: 'Ceramide and niacinamide; SPF 30 (minimal — the argument that dark skin doesn\'t need it is FALSE); retinol; vitamin C for brightening; dermatologist check for skin cancer despite belief it\'s not a risk.',
  },
};

// ─── MATURE HAIR ──────────────────────────────────────────────────────────────

export const MATURE_HAIR_GUIDE = {
  grey_hair_care: {
    characteristics: 'Grey hair lacks melanin — the pigment that was responsible for colour. Without melanin, the cuticle structure changes. Grey hair is often coarser, more wiry, and less shiny than pigmented hair. It has a more porous cuticle.',
    care_approach: [
      'Purple/blue shampoo ("silver shampoo") neutralises yellow/brassiness in grey hair — use weekly',
      'Deep conditioning every week — grey hair needs more moisture',
      'Glossing treatments add shine (protein or moisture-based)',
      'Lighter hold styling products — heavy products dull grey hair',
      'Embrace the grey fully for a striking, intentional look',
    ],
    styling: 'Grey hair can look stunning when healthy, shiny, and well-styled. Investment in quality haircut is visible in grey hair — good shape is everything.',
  },
  thinning_hair: {
    causes_in_women: [
      'Female pattern hair loss (androgenetic alopecia) — genetically determined',
      'Menopausal and perimenopausal hormonal changes',
      'Postpartum telogen effluvium',
      'Nutritional deficiencies (iron, ferritin, vitamin D, B12)',
      'Chronic stress',
      'Thyroid dysfunction',
      'Traction alopecia from lifetime of tight styles',
    ],
    treatments: {
      minoxidil: 'Minoxidil 2-5% applied to scalp — only FDA-approved OTC treatment for female pattern hair loss. Requires consistent use; cessation leads to loss of gained density.',
      low_level_laser: 'LLLT (low-level laser therapy) — helmets and combs. Modest evidence for increased hair density.',
      platelet_rich_plasma: 'PRP (platelet-rich plasma scalp injections) — growing evidence for hair loss. Expensive; professional procedure.',
      finasteride: 'Prescription finasteride (Propecia) — effective but requires careful medical guidance in women; not for women of childbearing age.',
      spironolactone: 'Spironolactone — anti-androgen; often prescribed for female pattern hair loss; requires prescription.',
      nutrition: 'Iron (ferritin > 70), vitamin D, biotin (if actually deficient), omega-3s. Blood test before supplementing.',
    },
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getDecadeGuide(decade) {
  const named = { forties: FORTIES_GUIDE, fifties: FIFTIES_GUIDE, sixties: SIXTIES_PLUS_GUIDE };
  const byNumber = { 40: FORTIES_GUIDE, 50: FIFTIES_GUIDE, 60: SIXTIES_PLUS_GUIDE };
  return named[decade] || byNumber[parseInt(decade)] || null;
}

export function getSkinAgingScience() { return SKIN_AGING_SCIENCE; }
export function getNonSurgicalTreatments() { return NON_SURGICAL_TREATMENTS; }
export function getMatureHairGuide() { return MATURE_HAIR_GUIDE; }

export function getEthnicAgingGuide(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_AGING_PATTERNS[key] || Object.values(ETHNIC_AGING_PATTERNS);
}

