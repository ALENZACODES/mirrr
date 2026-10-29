/**
 * MIRRR K-Beauty Extended Guide
 * Korean skincare philosophy, 10-step routine, essence/ampoule/serum science,
 * sheet masks, glass skin technique, and K-Beauty influence on global ethnic beauty
 */

// ─── K-BEAUTY PHILOSOPHY ─────────────────────────────────────────────────────

export const K_BEAUTY_PHILOSOPHY = {
  origin: 'K-Beauty (Korean Beauty) refers to skincare and cosmetic practices originating in South Korea. It became a global phenomenon from approximately 2012-2016, fundamentally shifting Western and global skincare to focus on prevention, hydration, layering, and texture rather than correction and coverage.',
  core_tenets: {
    prevention_over_correction: 'The Korean skincare philosophy prioritises preventing skin damage and aging before it starts rather than correcting it afterward. Heavy, daily SPF use from a young age is fundamental.',
    hydration_as_foundation: 'Optimal skin hydration is the base for all other skincare benefits. A dehydrated skin barrier cannot function optimally — it ages faster, breaks out more, and absorbs active ingredients poorly.',
    layering: 'Multiple lightweight hydrating layers are more effective than one heavy cream. Each layer builds upon the last, allowing the skin to absorb each product fully.',
    inside_out: 'Diet, water intake, sleep, and stress management are considered as important as topical products for skin health.',
    texture_first: 'Smooth, pore-minimised, hydrated skin texture is the first goal. Then tone, then brightness.',
    joyful_routine: 'The evening skincare routine is considered a form of self-care — it should be a pleasurable ritual, not a chore.',
  },
  skin_ideals: {
    glass_skin: 'Extremely smooth, hydrated, translucent skin that reflects light like glass — pore-minimised, deeply hydrated, lit from within.',
    chok_chok: 'Korean for "bouncy" or "dewy" skin. The goal texture of optimally hydrated skin.',
    mul_gwang: '"Water light" — the specific type of inner glow that comes from hydration, not shimmer.',
    honey_skin: 'The skin of a healthy baby — smooth, luminous, soft.',
  },
};

// ─── THE 10-STEP K-BEAUTY ROUTINE ────────────────────────────────────────────

export const TEN_STEP_ROUTINE = {
  overview: 'The "10-step routine" is more philosophy than rigid prescription. Not every step is needed every day — the routine is adapted based on skin needs, time, and season.',
  steps: {
    step_1_oil_cleanser: {
      step: 1,
      name: 'Oil Cleanser',
      purpose: 'Removes oil-based impurities: sunscreen, makeup, sebum, air pollution particles. Part of the "double cleanse" method.',
      how_to_use: 'Apply to dry face; massage 1-2 minutes; emulsify with a splash of water (turns milky); rinse.',
      key_ingredients: ['Squalane', 'Jojoba oil', 'Rosehip oil', 'Cleansing esters'],
      popular_korean: ['Banila Co Clean It Zero', 'Heimish All Clean Balm', 'Benton Deep Green Tea Cleansing Milk'],
      when_to_use: 'Every evening. If wearing minimal makeup or SPF-only, can occasionally skip and go straight to step 2.',
    },
    step_2_water_cleanser: {
      step: 2,
      name: 'Water-Based Cleanser (Second Cleanse)',
      purpose: 'Removes water-based impurities: sweat, leftover residue from oil cleanse, environmental pollutants.',
      how_to_use: 'Apply to damp face; lather; massage 30-60 seconds; rinse with lukewarm (never hot) water.',
      texture: 'Foam, gel, or cream — depending on skin type. Foam/gel for oily; cream/milk for dry.',
      popular_korean: ['COSRX Low pH Good Morning Gel Cleanser (a global bestseller)', 'Round Lab 1025 Dokdo Cleanser (hydrating)', 'Innisfree Jeju Volcanic Pore Cleansing Foam (for oily skin)'],
      when_to_use: 'Morning and evening. In the morning: gentle cleanser only (no oil cleanse needed).',
    },
    step_3_exfoliator: {
      step: 3,
      name: 'Exfoliator',
      purpose: 'Removes dead skin cells; improves skin texture; allows better penetration of subsequent products.',
      types: {
        chemical_AHA: 'AHA (glycolic, lactic acid) — dissolves the bonds between dead skin cells; best for surface brightening and anti-aging.',
        chemical_BHA: 'BHA (salicylic acid) — oil-soluble; penetrates pores; best for oily and acne-prone skin.',
        PHA: 'Polyhydroxy Acid — larger molecules than AHA, more gentle; good for sensitive skin.',
        physical: 'Granule scrubs — used very gently in Korean beauty (avoid daily; avoid harsh walnut or apricot scrubs that create micro-tears).',
        enzyme: 'Papain (papaya), bromelain (pineapple) — very gentle, dissolve protein bonds.',
      },
      frequency: '2-3 times per week. Not daily for most people — daily exfoliation can compromise the skin barrier.',
      when_to_use: 'After cleansing, before toner. Evening use preferred (sun sensitivity from AHAs).',
    },
    step_4_toner: {
      step: 4,
      name: 'Toner',
      purpose: 'Restores skin\'s pH after cleansing; provides first layer of hydration; prepares skin for subsequent product absorption.',
      korean_vs_western: 'CRITICAL DISTINCTION: Korean toners are hydrating essences. Western toners are historically astringent/alcohol-based (to remove residue after old cold cream cleansers). These are entirely different products. A Korean toner is more similar to a Western essence or first serum.',
      how_to_use: 'Can be applied with hands (patted in with a gentle pressing motion, not rubbing) or with a cotton pad. 7-Skin Method: apply 7 thin layers of toner, patting each layer into skin before applying the next.',
      key_ingredients: ['Hyaluronic acid', 'Glycerin', 'Niacinamide', 'Green tea extract', 'Cica (centella asiatica)', 'Propolis extract'],
      popular_korean: ['Klairs Supple Preparation Unscented Toner', 'Cosrx AHA/BHA Clarifying Treatment Toner', 'Some By Mi AHA BHA PHA 30 Days Miracle Toner', 'Pyunkang Yul Essence Toner'],
    },
    step_5_essence: {
      step: 5,
      name: 'Essence',
      purpose: 'The heart of Korean skincare. A lightweight, concentrated hydrating and treatment product.',
      what_is_essence: 'An essence sits between a toner and a serum in texture. It is more hydrating than a toner and lighter than a serum. It is often fermented (contains fermentation filtrate for enhanced efficacy and microbiome support).',
      key_function: 'Targets specific skin concerns (brightening, anti-aging, hydration, barrier repair) in a lightweight, highly-absorbable format.',
      fermentation_technology: 'Korean skincare pioneered fermentation technology for beauty. Fermented ingredients are more bioavailable (smaller molecules), contain beneficial metabolic by-products of fermentation, and have probiotic support for the skin microbiome.',
      popular_korean: ['SK-II Facial Treatment Essence (galactomyces ferment filtrate — classic)', 'Missha Time Revolution First Treatment Essence (affordable SK-II alternative)', 'Cosrx Advanced Snail 96 Mucin Power Essence', 'Laneige Cream Skin Refiner'],
    },
    step_6_serum_ampoule: {
      step: 6,
      name: 'Serum / Ampoule',
      purpose: 'Concentrated treatment for specific skin concerns.',
      serum_vs_ampoule: 'Ampoule = a more concentrated version of serum (sometimes called a booster). Often used as an intensive treatment course (e.g., one ampoule every evening for 30 days) rather than daily long-term.',
      by_concern: {
        hyperpigmentation: ['Vitamin C serum (L-ascorbic acid, ascorbyl glucoside)', 'Niacinamide serum', 'Tranexamic acid', 'Arbutin serum'],
        hydration: ['Hyaluronic acid serum (look for multiple molecular weights)', 'Ceramide serum', 'Polyglutamic acid (stronger humectant than HA)'],
        anti_aging: ['Retinol or retinal serum (start low, 0.025-0.05%, build to 0.1%+)', 'Peptide serum (Matrixyl, Argireline)', 'Vitamin C + E + Ferulic acid (antioxidant complex)'],
        acne: ['Salicylic acid serum (BHA)', 'Azelaic acid serum (also for pigmentation)', 'Niacinamide (sebum control + anti-inflammatory)'],
        sensitive_barrier: ['Cica (centella asiatica)', 'Ceramide serum', 'Galactomyces ferment filtrate'],
      },
      layering_serums: 'Apply lightest to heaviest. If using multiple serums, wait 1-2 minutes between layers for each to absorb.',
    },
    step_7_sheet_mask: {
      step: 7,
      name: 'Sheet Mask',
      purpose: 'Intensive delivery of a concentrated serum directly onto the skin under occlusion. The occlusion (the sheet) prevents evaporation and forces penetration.',
      frequency: 'Not daily for most people — 2-3 times per week is common. Daily during intensive treatment weeks or before special events.',
      how_to_use: [
        'Cleanse, tone, apply essence first.',
        'Apply sheet mask (align carefully over features).',
        'Leave on 15-20 minutes (do NOT leave on longer — the mask will re-absorb moisture from skin as it dries).',
        'Remove and PAT (do not wipe) the remaining serum into skin.',
        'Follow immediately with moisturiser to seal in.',
      ],
      types: {
        hydrating: 'Hyaluronic acid, aloe vera, cucumber. Most common and suitable for everyone.',
        brightening: 'Vitamin C, niacinamide, licorice extract, tranexamic acid.',
        anti_aging: 'Peptides, retinol (generally too strong for sheet mask delivery), collagen.',
        calming: 'Cica (centella asiatica), green tea, aloe, chamomile. For sensitive skin and post-procedure.',
      },
      ethnic_note: 'Sheet masks are a perfect delivery system for brightening and PIH-fighting ingredients for Fitzpatrick III-VI. Niacinamide, tranexamic acid, and vitamin C sheet masks can be used consistently to address hyperpigmentation.',
    },
    step_8_eye_cream: {
      step: 8,
      name: 'Eye Cream',
      purpose: 'Target-treats the delicate periorbital (around the eye) area.',
      why_separate: 'The skin around the eye is the thinnest on the body (0.5mm vs 2mm elsewhere). It has fewer oil glands and ages faster. Regular face moisturisers can be too heavy or potentially irritating for the eye area.',
      application: 'Ring finger only (lightest pressure). Tap gently around the orbital bone — do not drag.',
      concerns: {
        dark_circles: 'Vitamin C (brightens), caffeine (reduces puffiness from improved circulation), niacinamide, retinol (long-term collagen support).',
        puffiness: 'Caffeine (most effective for puffiness), cold application, peptides.',
        fine_lines: 'Retinol (lowest available percentage for eye area), peptides, hyaluronic acid.',
      },
    },
    step_9_moisturiser: {
      step: 9,
      name: 'Moisturiser',
      purpose: 'Seals in all preceding hydration layers; provides emollient and occlusive components to reduce TEWL (transepidermal water loss); maintains skin barrier function.',
      texture_by_skin_type: {
        oily: 'Gel moisturiser or light lotion. Look for "non-comedogenic" and "water-based".',
        combination: 'Gel-cream or light cream. Can apply cream to dry areas and gel to oily areas.',
        normal: 'Cream or lotion.',
        dry: 'Rich cream. Can layer a facial oil under the cream.',
        very_dry: 'Sleeping mask as final step (step 10) in addition to cream.',
      },
      popular_korean: ['Tatcha Water Cream (best-seller)', 'Belif True Cream Moisturizing Bomb', 'Laneige Water Sleeping Mask', 'Cosrx Oil-Free Ultra Moisturizing Lotion'],
    },
    step_10_SPF_day_sleeping_mask_night: {
      step: 10,
      name: 'SPF (Morning) / Sleeping Mask (Night)',
      morning: {
        product: 'Sunscreen (SPF 30+ minimum; SPF 50 preferred)',
        why_last: 'SPF must be the last step in the morning routine to work properly. Any product applied on top dilutes the UV filter coverage.',
        korean_innovation: 'Korean sunscreens have arguably led the world in SPF technology — especially in creating lightweight, cosmetically elegant formulas that don\'t leave a white cast. Korean sunscreens are often PA+++ or PA++++ rated for UVA protection (a rating system more granular than the US system).',
        popular: ['Beauty of Joseon Relief Sun (for dry skin; widely recommended for deep skin tones — minimal white cast)', 'Anua Heartleaf I\'m Safe Sun Serum', 'COSRX Aloe Soothing Sun Cream', 'Purito Daily Go-To Sunscreen'],
      },
      night: {
        product: 'Sleeping mask (sleeping pack)',
        what_it_is: 'A gel or gel-cream applied as the final evening step. Creates an occlusive layer over the entire routine to maximise overnight absorption and prevent moisture loss while sleeping.',
        difference_from_night_cream: 'Sleeping masks are often lighter in texture but more gel-occlusive than night creams. Many have active ingredients that work overnight.',
        popular: ['Laneige Water Sleeping Mask (the original and still the most popular)', 'Glow Recipe Watermelon Sleeping Mask'],
      },
    },
  },
};

// ─── GLASS SKIN TECHNIQUE ────────────────────────────────────────────────────

export const GLASS_SKIN_TECHNIQUE = {
  overview: 'Glass skin is an aesthetic — the most refined expression of K-Beauty skincare. It requires sustained commitment to the skincare routine over time as much as any particular product.',
  requirements: {
    texture: 'No visible pores, dry patches, or skin texture.',
    tone: 'No visible hyperpigmentation, redness, or uneven tone.',
    hydration: '"Chok-chok" bounciness and dewiness.',
    luminosity: 'Inner glow — light reflects off the skin itself, not from shimmer products.',
  },
  routine_tweaks: [
    'The 7-skin method — applying toner in 7 thin layers — is one of the most effective hydration-boosting practices for glass skin.',
    'Essence is arguably the most important step for glass skin.',
    'Sheet masking 3-4 times per week during a glass skin "challenge" period.',
    'Internal: significant water intake; collagen-supportive diet (vitamin C, protein); quality sleep.',
    'SPF every morning without exception — sun damage destroys the even texture glass skin requires.',
  ],
  makeup_for_glass_skin: {
    foundation: 'Sheer to light coverage — you are showing off skin, not covering it. Skin tint or serum foundation. Luminous to satin finish.',
    no_powder: 'Avoid setting powder for glass skin makeup — it mattifies and reduces the glass effect.',
    highlight: 'Liquid or cream highlighter pressed onto cheekbones, cupid\'s bow, inner corners, brow bone. No powder highlighter.',
    setting: 'Setting spray (dewy/glow type) as the final step.',
  },
  ethnic_note: 'Glass skin is achievable across all Fitzpatrick types. For Fitzpatrick V-VI: deeply hydrated, even-toned, well-moisturised dark skin has a natural luminosity that is stunning under natural light. The "glass skin" goal is universal — the products to get there may vary by skin type and concern.',
};

// ─── K-BEAUTY INGREDIENT INNOVATIONS ────────────────────────────────────────

export const K_BEAUTY_INGREDIENTS = {
  snail_mucin: {
    name: 'Snail Mucin (Snail Secretion Filtrate)',
    source: 'Collected from Cryptomphalus aspersa or Helix aspersa snails',
    components: 'Hyaluronic acid, glycoprotein enzymes, antimicrobial peptides, proteoglycans, copper peptides, zinc, iron, allantoin',
    evidence: 'Growing body of clinical evidence for wound healing, hydration, and anti-aging.',
    benefits: ['Hydration', 'Wound healing and skin repair', 'Anti-aging (collagen stimulation)', 'Scar improvement', 'PIH reduction'],
    popular: 'COSRX Advanced Snail 96 Mucin Power Essence (global bestseller).',
  },
  galactomyces_ferment: {
    name: 'Galactomyces Ferment Filtrate',
    source: 'Fermentation by-product of the Galactomyces candida yeast',
    discovery: 'Noticed by a researcher in Japan in 1999 who observed that Japanese sake brewery workers had very smooth, young-looking hands despite hard physical labour. The galactomyces in sake fermentation was isolated as the active component.',
    benefits: ['Brightening', 'Pore minimising', 'Anti-aging', 'Texture improvement'],
    famous_product: 'SK-II Facial Treatment Essence (one of the best-selling luxury skincare products globally — contains 90%+ galactomyces ferment filtrate).',
    affordable: 'Missha Time Revolution First Treatment Essence.',
  },
  centella_asiatica: {
    name: 'Centella Asiatica (Tiger Grass / Cica)',
    actives: 'Madecassoside, asiaticoside, asiatic acid, madecassic acid',
    benefits: ['Wound healing and skin barrier repair', 'Anti-inflammatory', 'Collagen synthesis stimulation', 'Scar reduction'],
    why_k_beauty: 'Centella asiatica became a defining ingredient of K-Beauty in the sensitive skin boom. Products with "Cica" or "Tiger Grass" became global bestsellers.',
    popular: ['Dr. Jart+ Cicapair', 'COSRX Centella Blemish Cream', 'Beauty of Joseon Relief Sun (also contains centella)'],
    ayurveda_connection: 'Centella asiatica is also Gotu Kola / Brahmi in Ayurveda — bridging K-Beauty and Ayurvedic traditions.',
  },
  propolis: {
    name: 'Propolis (Bee Propolis)',
    source: 'Resinous substance collected by bees from plants; used to seal and protect the hive.',
    components: 'Flavonoids, phenolic acids, vitamins, minerals, amino acids',
    benefits: ['Antimicrobial', 'Anti-inflammatory', 'Antioxidant', 'Wound healing', 'Good for acne-prone skin'],
    popular: 'COSRX Propolis Light Ampule; A\'pieu Nonco Bee Syrup',
  },
  niacinamide_in_k_beauty: {
    name: 'Niacinamide (Vitamin B3)',
    note: 'While not uniquely Korean in origin, niacinamide became a K-Beauty staple and global phenomenon through Korean formulations.',
    benefits: ['Brightening (reduces melanin transfer)', 'Pore-minimising (reduces sebum production)', 'Anti-aging (collagen support)', 'Anti-inflammatory', 'Barrier strengthening'],
    concentration: '5-10% is the evidence-based effective range. Above 10%: diminishing returns and increased irritation risk.',
    dark_skin_note: 'Niacinamide is one of the safest and most effective hyperpigmentation actives for Fitzpatrick III-VI — it does not cause PIH risk as some stronger actives do.',
  },
  polyglutamic_acid: {
    name: 'Polyglutamic Acid (PGA)',
    source: 'A natural polymer produced by Bacillus subtilis (a bacterial fermentation process).',
    benefits: 'A humectant approximately 4x more effective than hyaluronic acid for water retention in the skin.',
    how_it_works: 'Inhibits hyaluronidase (the enzyme that breaks down hyaluronic acid in the skin), thereby extending the life of native skin hyaluronic acid as well as applied HA.',
  },
};

// ─── K-BEAUTY ACROSS ETHNIC COMMUNITIES ──────────────────────────────────────

export const K_BEAUTY_ETHNIC_INFLUENCE = {
  west_african: {
    community: 'West African',
    influence: 'K-Beauty double cleanse and hydration-first philosophy has been adopted by West African beauty communities. Sheet masking and essences have been adopted for brightening and PIH treatment. Brands have developed K-Beauty-inspired products specifically for dark skin tones.',
  },
  south_asian: {
    community: 'South Asian',
    influence: 'South Asian skincare has embraced K-Beauty hydration and layering. K-Beauty emphasis on SPF resonates with the South Asian community\'s concerns about melasma and hyperpigmentation. Many South Asian beauty creators and influencers have integrated K-Beauty into their routines.',
  },
  caribbean: {
    community: 'Caribbean',
    influence: 'K-Beauty products have been adopted by Caribbean beauty communities for their effectiveness and the growing range of deep-skin-appropriate formulations.',
  },
  arab: {
    community: 'Arab',
    influence: 'K-Beauty has been enthusiastically adopted in the Arab world — particularly the Gulf. Korean beauty brands have a strong market in the Middle East. The K-Beauty focus on even skin tone, brightening, and hydration aligns with Arab beauty ideals.',
  },
  latina: {
    community: 'Latina',
    influence: 'K-Beauty routines and products have a strong following in Latin America and among US Latina beauty communities. The multi-step approach resonates with communities that already practice elaborate beauty rituals.',
  },
  east_asian: {
    community: 'East Asian',
    origin: 'K-Beauty originated in Korea and represents Korean culture. It has influenced Chinese beauty (C-Beauty) and Japanese beauty (J-Beauty) while also being influenced by those traditions. J-Beauty and C-Beauty have their own distinct philosophies that overlap with but differ from K-Beauty.',
    j_beauty: 'J-Beauty (Japanese Beauty): emphasises simplicity, minimal steps, quality over quantity, and a refined age-gracefully philosophy. Famous for double-cleanse and moisture-in-while-skin-is-wet approach (the "water is the ultimate moisturiser" philosophy).',
    c_beauty: 'C-Beauty (Chinese Beauty): growing global influence; uses Traditional Chinese Medicine (TCM) ingredients (peony, jujube, goji berry, tremella mushroom); emphasises balanced inner health reflecting in outer skin.',
  },
  east_african: {
    community: 'East African',
    influence: 'Growing K-Beauty adoption through social media. Korean sunscreens are particularly valued for their lightweight, minimal white-cast formulas for deep skin tones.',
  },
  south_african: {
    community: 'South African',
    influence: 'K-Beauty adoption growing. The centella asiatica / cica ingredient resonates with South African botanical beauty traditions (the biome of South Africa has many plant actives).',
  },
  black_american: {
    community: 'Black American',
    influence: 'K-Beauty double cleanse and essence steps have been enthusiastically adopted by Black American skincare enthusiasts. The K-Beauty emphasis on hydration and prevention is aligned with what dermatologists have increasingly recommended for Fitzpatrick V-VI skin. Creators like @GoodLuckGirls and many others have popularised K-Beauty adapted for dark skin.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getKBeautyPhilosophy() { return K_BEAUTY_PHILOSOPHY; }
export function getTenStepRoutineStep(step) {
  const key = `step_${step}`;
  const stepData = Object.entries(TEN_STEP_ROUTINE.steps).find(([k]) => k.startsWith(key));
  return stepData ? stepData[1] : TEN_STEP_ROUTINE;
}
export function getGlassSkinTechnique() { return GLASS_SKIN_TECHNIQUE; }
export function getKBeautyIngredient(name) {
  const key = name?.toLowerCase().replace(/[\s\/]+/g, '_');
  return K_BEAUTY_INGREDIENTS[key] || Object.values(K_BEAUTY_INGREDIENTS);
}
export function getKBeautyEthnicInfluence(communityId) {
  const key = communityId?.replace('-', '_');
  return K_BEAUTY_ETHNIC_INFLUENCE[key] || Object.values(K_BEAUTY_ETHNIC_INFLUENCE);
}

export const K_BEAUTY_STATS = {
  routineSteps: 10,
  innovativeIngredients: Object.keys(K_BEAUTY_INGREDIENTS).length,
  ethnicCommunities: 9,
  skinIdeals: Object.keys(K_BEAUTY_PHILOSOPHY.skin_ideals).length,
};
