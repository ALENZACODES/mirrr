/**
 * MIRRR Glass Skin Techniques
 * Extended K-Beauty glass skin guide, techniques, ingredients,
 * routine adaptations for all skin types and Fitzpatrick tones
 */

// ─── GLASS SKIN OVERVIEW ──────────────────────────────────────────────────────

export const GLASS_SKIN_OVERVIEW = {
  origin: 'Glass skin (유리 피부, "yuripibu" in Korean) is a Korean beauty term describing skin that looks as smooth, clear, and luminous as glass. It emphasises skin HEALTH over makeup coverage — the goal is to achieve the appearance through skincare, not products on top of the skin.',
  characteristics: {
    translucency: 'Skin looks almost translucent — healthy from within rather than coated with product.',
    smoothness: 'Zero visible texture — no pores, bumps, or rough patches.',
    radiance: 'High luminosity — skin reflects light evenly, creating an inner glow.',
    even_tone: 'No visible dark spots, redness, or discolouration.',
    hydration: 'Plump, well-hydrated appearance — skin looks "full" from within.',
    clarity: 'No congestion, no blackheads, no visible clogged pores.',
  },
  distinction: {
    vs_dewy: 'Glass skin is more refined than dewy. Dewy can include some oil or shine. Glass skin is a specific high-clarity, high-translucency appearance — the reflection of light is even and mirror-like.',
    vs_matte: 'The opposite of the matte trend. Glass skin rejects powder and absorption.',
    vs_glassy: 'Sometimes used interchangeably with "glassy skin" — they describe the same aesthetic.',
  },
  timeline: 'Glass skin takes time. A 4-6 week commitment to the routine before seeing significant results. Full transformation can take 3-6 months of consistent practice.',
};

// ─── THE GLASS SKIN ROUTINE ───────────────────────────────────────────────────

export const GLASS_SKIN_ROUTINE = {
  step1_double_cleanse: {
    step: 1,
    name: 'Double Cleanse',
    purpose: 'Remove ALL makeup, SPF, and surface pollution without disturbing the skin barrier.',
    cleanse1: {
      type: 'Oil or balm cleanser',
      targets: 'Oil-based impurities: makeup, SPF, sebum, pollution particles attached to skin oils.',
      how: 'Apply to DRY face. Massage 60 seconds in circular motions. Add a splash of water to emulsify. Rinse.',
      products: 'Cleansing oils, micellar oils, cleansing balms (banana balm, shea balm).',
    },
    cleanse2: {
      type: 'Water-based cleanser',
      targets: 'Water-based impurities: sweat, environmental residue, anything the oil cleanser lifted but didn\'t fully remove.',
      how: 'Apply to damp face. Massage 30-60 seconds. Rinse with lukewarm water.',
      products: 'Gel cleanser, foam cleanser, cream cleanser (for dry skin).',
      ph: 'Look for slightly acidic pH 5.0-5.5 — matches skin\'s natural pH to avoid disrupting the barrier.',
    },
    note: 'In the morning, a single gentle rinse or water-only cleanse is sufficient — the skin has not been exposed to makeup or pollution overnight.',
  },
  step2_exfoliate: {
    step: 2,
    name: 'Gentle Exfoliation',
    frequency: '2-3 times per week MAXIMUM. Over-exfoliation destroys the barrier that glass skin requires.',
    chemical: {
      aha: 'AHA (glycolic acid 5-10%, lactic acid 5-12%): works on the skin surface, dissolving bonds between dead skin cells. Best for dry, normal, mature skin. Creates luminosity.',
      bha: 'BHA (salicylic acid 0.5-2%): penetrates into pores. Best for oily/acne-prone skin alongside AHA.',
      pha: 'PHA (gluconolactone, lactobionic acid): gentlest chemical exfoliant. Excellent for sensitive skin and Fitzpatrick IV-VI where AHA can cause irritation.',
    },
    physical: 'If using physical exfoliation: a very soft washcloth or konjac sponge only. NO harsh scrubs with walnut shells or rough particles — they cause micro-tears.',
    caution: 'Do not exfoliate the same night as retinol. Do not layer multiple chemical exfoliants.',
  },
  step3_essence: {
    step: 3,
    name: 'Essence',
    what: 'A Korean beauty product category — a thin, watery liquid with a high concentration of active ingredients. Usually fermentation-derived. Applied by patting into skin.',
    purpose: 'Enhances skin cell renewal, boosts hydration uptake for subsequent layers, improves overall skin function.',
    key_ingredients: ['Fermented extracts (galactomyces, bifida)', 'Hyaluronic acid', 'Niacinamide', 'Centella asiatica', 'Snail mucin'],
    how_to_apply: {
      hands: 'Pour 2-3 drops into palm. Press palms together. Pat — do NOT rub — into skin. The warmth of hands assists absorption.',
      seven_skin_method: 'A Korean technique: apply 7 thin layers of essence/toner, patting each layer fully into the skin before the next. Creates intense hydration.',
    },
  },
  step4_serum: {
    step: 4,
    name: 'Serum(s)',
    purpose: 'Targeted treatment — one to two serums addressing your specific concerns. Serums have the smallest molecular size (deepest penetration) and highest active ingredient concentration.',
    glass_skin_serums: {
      niacinamide: {
        ingredient: 'Niacinamide 5-10%',
        purpose: 'Pore refinement, oil control, brightening, PIH reduction, barrier strengthening.',
        order: 'Before hyaluronic acid or vitamin C.',
      },
      vitamin_c: {
        ingredient: 'Vitamin C (ascorbic acid 10-20% or derivatives)',
        purpose: 'Brightening, collagen synthesis, antioxidant protection, evenness.',
        note: 'Vitamin C + niacinamide: historically said to interact poorly (turn yellow). Modern formulations address this. If concerned, use vitamin C AM and niacinamide PM, or use them as separate layers.',
      },
      hyaluronic_acid: {
        ingredient: 'Hyaluronic acid (multiple molecular weights)',
        purpose: 'Deep hydration, plumping, smoothing surface texture.',
        key: 'Apply to DAMP skin — hyaluronic acid pulls moisture from surroundings. On dry skin in a dry environment, it can pull from within the skin, causing dryness.',
      },
      snail_mucin: {
        ingredient: 'Snail Secretion Filtrate (snail mucin)',
        purpose: 'Skin repair, hydration, anti-acne, scar fading. The multi-tasker of K-beauty.',
        texture: 'Slightly sticky, gel-like.',
        note: 'The snail mucin ingredient was K-beauty\'s signature breakout ingredient globally.',
      },
      centella: {
        ingredient: 'Centella Asiatica (Cica)',
        purpose: 'Calming, anti-inflammatory, skin barrier repair. Ideal for sensitive skin.',
      },
      galactomyces: {
        ingredient: 'Galactomyces Ferment Filtrate',
        purpose: 'Brightening, pore minimisation, skin texture improvement.',
        origin: 'Discovered when a scientist noticed sake brewery workers had exceptionally smooth, bright hands — the galactomyces yeast ferment contact is the hypothesised mechanism.',
      },
    },
  },
  step5_sheet_mask: {
    step: 5,
    name: 'Sheet Mask (weekly)',
    purpose: 'Intensive hydration treatment — forces a high concentration of essence/serum into the skin through occlusion.',
    frequency: '1-3 times per week as a glass skin boost. Daily use is not necessary and can sensitise skin.',
    how: 'Unfold mask. Apply to face. Leave 15-20 minutes. Remove and PAT (do not rinse) the remaining essence into skin. Apply moisturiser over the top while the essence is still slightly tacky.',
    types: {
      hydration: 'Hyaluronic acid, glycerin sheet masks — the foundation.',
      brightening: 'Vitamin C, niacinamide, galactomyces — for even tone.',
      firming: 'Collagen peptides, retinol (leave-on short time) — for elasticity.',
      calming: 'Centella, aloe, green tea — for irritated or sensitive skin.',
    },
    fitzpatrick_note: 'Sheet masks are universally suitable for all Fitzpatrick types. Choose active ingredients based on concern: brightening for PIH (niacinamide, vitamin C), calming for sensitivity (centella), hydrating for dryness (HA).',
  },
  step6_eye_cream: {
    step: 6,
    name: 'Eye Cream',
    purpose: 'The under-eye area is the thinnest skin (0.5mm vs 2mm elsewhere). It shows dehydration, dark circles, and lines first. Glass skin requires the eye area to look as smooth and plump as the rest.',
    apply: 'Ring finger (lightest pressure). Pat from inner to outer corner along orbital bone — not directly on eyelid. Morning and evening.',
    ingredients: 'Caffeine (puffiness), retinol (lines), vitamin C/niacinamide (dark circles), peptides (firmness).',
  },
  step7_moisturiser: {
    step: 7,
    name: 'Moisturiser',
    purpose: 'Seals in all the hydration from previous layers. Prevents trans-epidermal water loss (TEWL). Supports the skin barrier.',
    for_glass_skin: 'Choose a moisturiser with humectants (hyaluronic acid, glycerin — draw moisture in) + emollients (ceramides, fatty acids — smooth surface) + occlusives (light — petrolatum-free for daytime; heavier for nighttime).',
    formats: {
      gel: 'Oily/combination skin. Lightweight. Hyaluronic acid + centella gel.',
      emulsion: 'Normal skin. Lightweight fluid moisturiser.',
      cream: 'Dry, mature skin. Richer texture with ceramides and fatty acids.',
      sleeping_mask: 'Evening: an occlusive sleeping mask as the final step — intense hydration treatment without wiping off.',
    },
  },
  step8_spf: {
    step: 8,
    name: 'SPF (AM only)',
    purpose: 'The most important glass skin ingredient. UV damage is the number one cause of uneven tone, premature aging, pore enlargement, and barrier damage — all the antitheses of glass skin.',
    for_glass_skin: 'A chemical or hybrid SPF with a skin-like finish — not a heavy white mineral SPF that opacifies the skin.',
    formats: 'Fluid SPF. Tinted SPF. Korean "sun essence" — ultra-lightweight SPF formulations with near-invisible application.',
    white_cast: 'Mineral (zinc/titanium) SPFs can cause white cast on Fitzpatrick IV-VI — especially Fitzpatrick V-VI. Look for tinted mineral SPFs or chemical/hybrid SPFs for deeper skin tones.',
    reapply: 'Reapply every 2 hours of UV exposure. Setting spray SPF or SPF cushion compact for reapplication over makeup.',
  },
};

// ─── GLASS SKIN BY SKIN TYPE ──────────────────────────────────────────────────

export const GLASS_SKIN_BY_TYPE = {
  oily: {
    challenge: 'Oiliness can read as shine, not glass skin. The goal is controlled luminosity, not oiliness.',
    adaptations: {
      cleanse: 'Double cleanse every night. Gentle water-only rinse AM.',
      exfoliate: 'BHA (salicylic acid) 2x per week is the priority — keeps pores clear.',
      serum: 'Niacinamide (reduces sebum production long-term) + HA serum.',
      moisturiser: 'Gel moisturiser — non-comedogenic, oil-free.',
      spf: 'Fluid or gel SPF — non-comedogenic.',
      avoid: 'Facial oils in the morning. Heavy sleeping masks.',
    },
  },
  dry: {
    challenge: 'Dry skin lacks the natural luminosity to look glassy. The skin surface texture must be addressed.',
    adaptations: {
      cleanse: 'Oil cleanser evening, micellar water morning. No foaming cleansers — too stripping.',
      exfoliate: 'Lactic acid (gentler AHA, also moisturises). Once weekly only.',
      serum: 'Multiple HA serums (layered), ceramide serum.',
      moisture: 'Rich cream moisturiser. Evening facial oil (squalane or rosehip) under sleeping mask.',
      glass_hack: 'The seven skin method is particularly transformative for dry skin.',
      avoid: 'Strong actives that further disrupt the barrier (tretinoin, AHAs in high concentration) until barrier is repaired.',
    },
  },
  combination: {
    challenge: 'Different zones need different care — T-zone oiliness vs dry cheeks.',
    adaptations: {
      cleanse: 'Gentle double cleanse.',
      exfoliate: 'BHA on T-zone, AHA on dry zones.',
      tone: 'Zone-treat as needed.',
      moisturiser: 'Light gel on T-zone. Richer emulsion on cheeks.',
    },
  },
  sensitive: {
    challenge: 'Sensitive skin reacts to many glass skin actives — the foundation must be strengthening the barrier.',
    adaptations: {
      cleanse: 'One gentle cleanse only — fragrance-free, low-surfactant cleanser.',
      exfoliate: 'PHA only (gentlest). Once per week maximum, or skip exfoliation entirely initially.',
      actives: 'Centella, aloe, snail mucin. Avoid: fragrance, high-concentration AHA, vitamin C (initially).',
      introduce: 'Introduce one new product at a time. Patch test always.',
      note: 'Glass skin for sensitive skin is a long game — barrier first, actives later.',
    },
  },
  acne_prone: {
    challenge: 'Active acne is the antithesis of glass skin. The acne must be addressed first.',
    adaptations: {
      treat_acne_first: 'Use the acne treatment protocol (BHA, benzoyl peroxide, retinoid) until acne is controlled before full glass skin routine.',
      concurrent: 'Niacinamide and centella can run concurrent with acne treatment — they don\'t conflict.',
      pih: 'Once acne is controlled, address PIH with niacinamide, vitamin C, and if needed azelaic acid.',
      glass_skin_after: 'Glass skin is achievable post-acne — but requires PIH treatment to be well underway.',
    },
  },
};

// ─── GLASS SKIN BY FITZPATRICK ────────────────────────────────────────────────

export const GLASS_SKIN_BY_FITZPATRICK = {
  type_1_2: {
    types: 'Fitzpatrick I-II',
    challenges: 'Redness (rosacea, sensitivity, easily flushed). Visible broken capillaries. Sun damage accumulates quickly.',
    adaptations: 'Centella and calming ingredients are priorities. SPF is critical and must be worn religiously — UV damage shows fastest on fair skin. Chemical or tinted mineral SPF (no white cast concern).',
    glass_tip: 'Green-tinted colour corrector under SPF/tinted moisturiser to neutralise redness before the glass skin look.',
  },
  type_3_4: {
    types: 'Fitzpatrick III-IV',
    challenges: 'Beginning of PIH risk. More versatile with SPF choices. Melanin provides more UV protection but not enough to skip SPF.',
    adaptations: 'Niacinamide and vitamin C are important for evenness. PIH from any pimple or irritation must be addressed proactively.',
    glass_tip: 'Tinted SPF with golden or neutral undertone creates the most even base for glass skin looks.',
  },
  type_5_6: {
    types: 'Fitzpatrick V-VI',
    challenges: 'PIH is the dominant concern for glass skin in deep skin — any inflammation creates a dark spot that disrupts the glass skin appearance. White cast from mineral SPF. Some AHAs can irritate deeper skin at high concentrations.',
    adaptations: {
      pih_priority: 'Niacinamide, azelaic acid, vitamin C (sodium ascorbyl phosphate — more stable and gentler), tranexamic acid — all address PIH.',
      spf: 'Chemical or hybrid SPF — not high percentage zinc oxide which whites out.',
      exfoliation: 'PHA or mandelic acid (gentler AHA) over glycolic acid for the most sensitive deep skin.',
      retinol: 'Introduce very slowly — 0.025% to start. Buffer with moisturiser.',
    },
    glass_skin_on_deep_skin: 'Deep Fitzpatrick V-VI skin has a natural richness and luminosity when properly hydrated that IS glass skin. Melanin gives the skin a depth that lighter skin cannot achieve — this is a beautiful characteristic of deep skin. The goal is enhancing this natural depth: maximum hydration, barrier health, PIH resolution, and SPF.',
    note: 'K-beauty glass skin as originally defined was for the East Asian skin type most common in Korean pop culture. Adapting it for deep skin means prioritising different concerns. The aesthetic principle of healthy, luminous, even skin is universal; the route to get there varies.',
  },
};

// ─── GLASS SKIN MAKEUP ────────────────────────────────────────────────────────

export const GLASS_SKIN_MAKEUP = {
  philosophy: 'Glass skin makeup enhances and intensifies the skincare result — it should be invisible as "makeup" and add to the appearance of natural skin health.',
  base: {
    prep: 'Skincare routine fully applied and set for 5-10 minutes before any makeup.',
    primer: 'Illuminating, hydrating primer — NOT silicone pore-filler primer (which creates a matte, flat base). Look for: "glass skin primer," "dewy finish primer," "lit-from-within primer."',
    foundation: 'Serum foundation, skin tint, or tinted moisturiser. AVOID: full-coverage foundations with matte finishes.',
    technique: 'Apply with a damp beauty sponge using a stippling (pressing) motion — do not drag or rub which removes luminosity.',
    coverage: 'Very light coverage overall. Conceal only where necessary (blemishes, dark circles) rather than covering the whole face.',
  },
  luminosity: {
    highlighter: 'Liquid or cream highlighter only — NOT powder (powder creates a different, drier luminosity). Apply to: cheekbones, brow bone, bridge of nose, cupid\'s bow, inner corners of eyes.',
    technique: 'Press in with ring finger or damp sponge — not sweep. Creates a "lit from within" effect rather than a topical shimmer.',
    shade: {
      fair: 'Pearl, champagne, very light gold.',
      medium: 'Gold, rose gold, warm pearl.',
      deep: 'Warm gold, bronze, copper. AVOID: silver, icy white, very pale gold — these appear ashy on Fitzpatrick V-VI.',
    },
  },
  setting: {
    never: 'NEVER heavy powder setting. Powder is glass skin\'s enemy — it flattens the luminosity and creates a dry, matte surface.',
    if_needed: 'If set at all: a single light touch of translucent powder only on oily areas (T-zone). Use a small fluffy brush, barely loaded.',
    preferred: 'Setting spray: a dewy or hydrating setting spray is the best glass skin finishing step — adds luminosity while extending wear.',
    face_oil: 'A single drop of facial oil pressed onto fingertips and then gently patted over the finished face can enhance the glass skin glow.',
  },
};

// ─── KEY GLASS SKIN INGREDIENTS ───────────────────────────────────────────────

export const GLASS_SKIN_INGREDIENTS = {
  galactomyces: {
    name: 'Galactomyces Ferment Filtrate',
    what: 'A yeast ferment derived from sake brewing. Contains amino acids, vitamins, minerals that support skin luminosity.',
    target: 'Pore minimisation, brightening, even texture.',
    iconic_product: 'SK-II Facial Treatment Essence contains a very high percentage of galactomyces (90%+).',
  },
  bifida: {
    name: 'Bifida Ferment Lysate',
    what: 'A probiotic-derived ferment. Strengthens skin barrier, reduces sensitivity, promotes even complexion.',
    target: 'Barrier repair, sensitivity reduction, luminosity.',
  },
  snail: {
    name: 'Snail Secretion Filtrate',
    what: 'A filtered extract from snail mucus. Contains glycoproteins, hyaluronic acid, glycolic acid, copper peptides.',
    target: 'Multi-functional — hydration, mild exfoliation, skin repair, anti-aging.',
  },
  centella: {
    name: 'Centella Asiatica (Cica / Tiger Grass)',
    what: 'Extract from an Asian medicinal plant. Active compounds: madecassoside, asiaticoside, asiatic acid.',
    target: 'Calming, anti-inflammatory, wound healing, barrier repair.',
  },
  ha: {
    name: 'Hyaluronic Acid (Multi-Weight)',
    what: 'A natural sugar molecule that holds water. "Multi-weight" serums have high, medium, and low molecular weight forms targeting different skin depths.',
    target: 'Deep and surface hydration, plumping, smoothing texture.',
  },
  poly_gl: {
    name: 'Polyglutamic Acid (PGA)',
    what: 'A molecule derived from fermented soybeans. Holds water more effectively than hyaluronic acid (4x more). Also creates a slight film on the skin surface that smooths texture.',
    target: 'Intense hydration, surface smoothing. An upgrade from HA for glass skin purposes.',
  },
  tranexamic_acid: {
    name: 'Tranexamic Acid',
    what: 'Originally a blood-clotting medication. Topically, inhibits melanin transfer between melanocytes (pigment-producing cells) and keratinocytes.',
    target: 'PIH, melasma, uneven skin tone. Particularly relevant for Fitzpatrick III-VI glass skin goals.',
    safety: 'Excellent safety profile. Suitable for sensitive skin. Can be used in pregnancy (unlike hydroquinone or retinoids).',
  },
};

// ─── ETHNIC GLASS SKIN ────────────────────────────────────────────────────────

export const ETHNIC_GLASS_SKIN = {
  west_african: {
    community: 'West African',
    path: 'Glass skin for West African Fitzpatrick V-VI skin starts with PIH treatment. Niacinamide, vitamin C (sodium ascorbyl phosphate), azelaic acid, and tranexamic acid are priorities. The natural luminosity of dark, well-hydrated skin is extraordinary — glass skin on deep skin, when achieved, is arguably its most dramatic form.',
    key_products: 'Niacinamide serums, HA multi-weight serums, chemical SPF (not mineral to avoid white cast), centella for any inflammation.',
  },
  south_asian: {
    community: 'South Asian',
    path: 'South Asian glass skin naturally aligns with cultural ideals of fair, glowing skin (the "glowing bride" ideal). Turmeric (in careful formulations — raw turmeric stains) is a traditional glass skin ingredient. Vitamin C and niacinamide for even tone. HA for the intense monsoon-season humidity effect replication.',
    key_products: 'Brightening toners with vitamin C, niacinamide serums, galactomyces essence, centella for oil balance.',
  },
  caribbean: {
    community: 'Caribbean',
    path: 'Adequate SPF is particularly important in the high UV Caribbean climate. The natural humidity can support glass skin — hydration levels in humid climates are naturally higher.',
    key_products: 'SPF SPF SPF. Niacinamide. Vitamin C for any PIH.',
  },
  arab: {
    community: 'Arab',
    path: 'Rose water (traditional Arab ingredient) is a gentle toner/essence precursor that aligns beautifully with the glass skin essence step. Argan oil as a final facial oil step. Arab glass skin emphasises the "lit from within" freshness ideal.',
    key_products: 'Rose water toner, argan oil as last step serum/oil, niacinamide for pore refinement, mineral-hybrid SPF.',
  },
  east_asian: {
    community: 'East Asian',
    path: 'Glass skin is a native aesthetic ideal in Korean beauty culture. The full glass skin routine as described above reflects East Asian K-beauty philosophy. Galactomyces, fermented essences, and the sheet mask tradition are all native to this community.',
    key_products: 'Full K-beauty routine: galactomyces essence, snail mucin serum, polyglutamic acid, sheet masks, tinted Korean sunscreens.',
  },
  black_american: {
    community: 'Black American',
    path: 'Black skin has natural richness and melanin-conferred luminosity. Glass skin on deep Black skin is about PIH resolution, intense hydration, and barrier care. Vitamin C in a stable form (sodium ascorbyl phosphate — less irritating than L-ascorbic acid on deeper skin), niacinamide, and HA.',
    key_products: 'Sodium ascorbyl phosphate vitamin C, niacinamide, centella, HA layers, chemical SPF with no white cast (Black Girl Sunscreen, Unsun, Fenty Skin Hydra Vizor).',
  },
  latina: {
    community: 'Latina',
    path: 'Latina skin beauty ideals (miel, honey skin, in some communities; glow emphasised across Latin America) align with glass skin. Niacinamide for melasma tendency. SPF essential (melasma is UV-triggered). Vitamin C for even tone.',
    key_products: 'SPF (chemical preferred on medium skin), niacinamide for melasma, tranexamic acid, HA, galactomyces.',
  },
  east_african: {
    community: 'East African',
    path: 'Similar to West African and Black American deep skin glass skin approach. The neem oil tradition may support barrier health. SPF for the high UV in East Africa.',
    key_products: 'Centella, niacinamide, vitamin C, HA, SPF.',
  },
  south_african: {
    community: 'South African',
    path: 'Marula oil (native to southern Africa) is a natural facial oil that can serve as the glass skin finishing oil step — lightweight, rich in oleic acid, absorbs beautifully. Rooibos extract in serums is an anti-inflammatory addition.',
    key_products: 'Marula oil, rooibos extract products, niacinamide, HA, SPF.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getGlassSkinOverview() { return GLASS_SKIN_OVERVIEW; }
export function getGlassSkinRoutine(step) {
  const key = step ? `step${step}_${Object.keys(GLASS_SKIN_ROUTINE).find(k => k.startsWith(`step${step}_`))}` : null;
  if (step) {
    const found = Object.values(GLASS_SKIN_ROUTINE).find(s => s.step === parseInt(step));
    return found || GLASS_SKIN_ROUTINE;
  }
  return GLASS_SKIN_ROUTINE;
}
export function getGlassSkinByType(skinType) {
  return skinType ? GLASS_SKIN_BY_TYPE[skinType] : GLASS_SKIN_BY_TYPE;
}
export function getGlassSkinByFitzpatrick(fitzType) {
  const key = fitzType ? `type_${fitzType}` : null;
  return key ? GLASS_SKIN_BY_FITZPATRICK[key] : GLASS_SKIN_BY_FITZPATRICK;
}
export function getGlassSkinMakeup() { return GLASS_SKIN_MAKEUP; }
export function getGlassSkinIngredient(name) {
  const key = name?.toLowerCase().replace(/\s+/g, '_');
  return key ? GLASS_SKIN_INGREDIENTS[key] : GLASS_SKIN_INGREDIENTS;
}
export function getEthnicGlassSkin(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_GLASS_SKIN[key] || Object.values(ETHNIC_GLASS_SKIN);
}

export const GLASS_SKIN_STATS = {
  routineSteps: Object.keys(GLASS_SKIN_ROUTINE).length,
  skinTypeAdaptations: Object.keys(GLASS_SKIN_BY_TYPE).length,
  keyIngredients: Object.keys(GLASS_SKIN_INGREDIENTS).length,
  ethnicEntries: Object.keys(ETHNIC_GLASS_SKIN).length,
};
