/**
 * MIRRR DIY Beauty Ingredients
 * What works (aloe vera, honey, oat, rosehip), what doesn't,
 * what's actively dangerous, and ethnic kitchen beauty wisdom
 */

// ─── PHILOSOPHY ────────────────────────────────────────────────────────────────

export const DIY_BEAUTY_PHILOSOPHY = {
  overview: 'DIY beauty using kitchen and pantry ingredients has a long, cross-cultural history. Traditional beauty practices across every culture pre-dated modern cosmetics by centuries. Modern formulation science has given us more potent, stable, and irritation-tested products — but many traditional ingredients have genuine, well-studied benefits. This guide separates evidence from myth.',
  approach: 'Rate each ingredient: WORKS (evidence-based benefits), VARIES (mixed evidence or depends on use), AVOID (no benefit or actively harmful), DANGER (real risk of injury).',
  disclaimer: 'DIY skincare cannot be tested or standardised the way commercial products are. If you have sensitive skin, skin conditions, or are prone to reactions, patch-test every DIY application behind the ear for 48 hours before full application.',
};

// ─── INGREDIENTS THAT WORK ────────────────────────────────────────────────────

export const INGREDIENTS_THAT_WORK = {
  aloe_vera: {
    ingredient: 'Aloe Vera (Aloe barbadensis miller)',
    rating: 'WORKS — strong evidence',
    what_it_does: [
      'Humectant — draws moisture into skin',
      'Anti-inflammatory — acemannan (polysaccharide) reduces redness and irritation',
      'Wound-healing — accelerates skin regeneration (well-documented)',
      'Antimicrobial — mild antibacterial properties',
      'Cooling and soothing — immediate calming effect on sunburn, heat, or irritated skin',
    ],
    how_to_use: {
      fresh_leaf: 'Slice the leaf; scoop out the clear gel. Apply directly to skin. AVOID the yellow "latex" layer just inside the green leaf — this is aloin (laxative and potentially irritating). Only the clear gel.',
      store_bought: '99% pure aloe vera gel (no alcohol, no artificial colour, no fragrance). Best: Lily of the Desert, Seven Minerals, or similar pure brands.',
    },
    uses: ['Soothing face mask base', 'After-sun treatment', 'Light daily moisturiser for oily/acne-prone skin', 'Scalp treatment', 'Eyebrow groomer', 'Setting gel for edges (natural look)'],
    ethnic_note: 'Aloe vera is used in beauty rituals across West African, Caribbean, South Asian, Latina, and Arab communities. A truly universal skin soother.',
    caution: 'Aloe allergy exists (rare) — patch test. Avoid the latex (yellow) section of fresh leaf. Fresh gel expires within 1-2 days in the fridge.',
  },
  honey: {
    ingredient: 'Honey (raw, unprocessed)',
    rating: 'WORKS — strong evidence',
    what_it_does: [
      'Humectant — draws moisture to skin',
      'Antibacterial — hydrogen peroxide; low pH; osmotic pressure all inhibit bacterial growth',
      'Anti-inflammatory — inhibits inflammatory cytokines',
      'Wound healing — Manuka honey is a medical-grade wound treatment (L-Methylglyoxal)',
      'Mild exfoliant — enzymes (glucose oxidase) break down dead skin gently',
    ],
    types: {
      raw_honey: 'Best for DIY. Unprocessed; retains enzymes and antibacterial compounds. Slightly opaque and crystallised.',
      manuka: 'Strongest antibacterial (UMF 10+ or MGO 263+). Medical-grade for wound care. Very expensive for skincare but legitimate.',
      commercial_processed: 'Most store honey. Heat-processing destroys most enzymes. Still a humectant but less potent for skin.',
    },
    uses: ['Face mask (raw honey alone or mixed with oat, yoghurt, turmeric)', 'Lip treatment', 'Acne spot treatment (antibacterial)', 'Hair mask for shine and moisture'],
    how_to_use: 'Apply raw honey to damp skin; leave 15-20 minutes; rinse with warm water. Slightly warming in hands first makes it easier to apply.',
    ethnic_note: 'Honey is used in beauty across Arab (desert honey), West African, South Asian (in Ayurveda), and Latina communities. Black seed honey (from Nigella sativa, popular in Arab and South Asian communities) has particularly studied anti-inflammatory properties.',
  },
  oat: {
    ingredient: 'Oat / Colloidal Oatmeal (Avena sativa)',
    rating: 'WORKS — very strong evidence; FDA-approved OTC skin protectant',
    what_it_does: [
      'Skin barrier protection — beta-glucan forms a protective film',
      'Anti-inflammatory — avenanthramides (phenolic compounds unique to oats) are powerful anti-inflammatory',
      'Itch relief — used medically for eczema and psoriasis',
      'Humectant and emollient — moisturises and softens',
      'Gentle cleansing — saponins in oats act as mild cleansers',
    ],
    colloidal_vs_regular: {
      colloidal: 'Colloidal oatmeal = oats ground to a very fine powder that suspends in water. Most effective for skin; activates beta-glucan better. Make at home: blend rolled oats in a blender or food processor until a very fine powder.',
      regular_rolled: 'Regular oats work in masks but less effective than colloidal. Better as a face scrub (use whole oat) rather than a soothing treatment.',
    },
    uses: {
      bath: 'Colloidal oatmeal bath for eczema, chickenpox, psoriasis, or full-body irritation. Add 1-2 cups to lukewarm water; soak 15-20 minutes.',
      face_mask: 'Mix colloidal oatmeal + honey + a drop of facial oil → soothing and nourishing mask.',
      cleanser: 'Colloidal oatmeal + water → a gentle, soap-free cleansing paste.',
      scrub: 'Rolled oats + honey → a gentle physical exfoliant scrub (face or body).',
    },
    ethnic_note: 'Oat treatment particularly excellent for skin conditions common in Fitzpatrick IV-VI (eczema, PIH-prone irritated skin). The anti-inflammatory avenanthramides can reduce post-inflammatory redness before it progresses to PIH.',
  },
  rosehip_oil: {
    ingredient: 'Rosehip Seed Oil (Rosa canina / Rosa rubiginosa)',
    rating: 'WORKS — well-evidenced for specific concerns',
    what_it_does: [
      'High in vitamin A (retinol precursor — trans-retinoic acid): gentle skin renewal',
      'High in vitamin C: antioxidant, brightening',
      'High in essential fatty acids (linoleic, alpha-linolenic acid): barrier repair and moisture',
      'Anti-pigmentation evidence: studies show reduction in hyperpigmentation and surgical scar improvement',
    ],
    best_for: ['Post-acne marks (PIH)', 'Uneven skin tone', 'Dry and dehydrated skin', 'Early signs of aging', 'Stretch marks and scars'],
    how_to_use: '2-3 drops pressed onto skin in PM routine. The vitamin A content makes it most effective used at night. Avoid heavy sun exposure after application.',
    ethnic_note: 'Excellent for PIH because of its vitamin A and C content. One of the best-evidenced natural oils for hyperpigmentation. Widely used in South American traditional beauty (endemic to Chilean Andes in wild form).',
    caution: 'Can oxidise quickly — buy small bottles; store in fridge or dark cool place; amber glass. Avoid if prone to acne from oil (linoleic acid is non-comedogenic, but any oil can clog if overused).',
  },
  turmeric: {
    ingredient: 'Turmeric (Curcuma longa) — used topically with caution',
    rating: 'VARIES — real benefits with significant caveats',
    what_it_does: [
      'Curcumin: powerful anti-inflammatory; antioxidant',
      'Mild skin brightening (inhibits tyrosinase — melanin enzyme)',
      'Antimicrobial properties',
    ],
    caveats: [
      'STAINING: turmeric stains yellow-orange persistently. Stains skin (especially light skin), nails, towels, sinks, clothes.',
      'The stain can last days on fair skin. Deep skin tones may have less visible staining but it still occurs.',
      'Commercial curcumin extracts cause less staining than whole turmeric powder.',
    ],
    how_to_use: 'Mix a very small amount (1/4 tsp) into a larger mask (honey + yoghurt base). Do not use neat. Rinse promptly and thoroughly. Use OLD towels.',
    ethnic_note: 'Haldi ceremony (turmeric ritual before South Asian weddings) is cultural practice; the yellow staining is traditional and considered auspicious. In West African communities, turmeric masks are also traditional. The benefits are real — the staining is simply part of the practice.',
  },
  green_tea: {
    ingredient: 'Green Tea (Camellia sinensis)',
    rating: 'WORKS — well-evidenced topically and internally',
    active: 'EGCG (Epigallocatechin gallate) — a polyphenol antioxidant with anti-inflammatory and anti-carcinogenic properties.',
    what_it_does: ['Antioxidant protection from UV damage', 'Anti-inflammatory', 'Reduces redness', 'Some evidence for sebum reduction (acne)'],
    how_to_use: {
      brew_and_chill: 'Brew a strong green tea; allow to cool completely; use as a toner (pat on with cotton pad or spritz) or as a soothing compress on irritated skin.',
      cooled_tea_bags: 'Cool used tea bags in the fridge; place on closed eyes for 10 minutes — reduces puffiness (caffeine + tannins constrict blood vessels).',
      green_tea_mask: 'Mix green tea powder (matcha) with honey and aloe vera for an antioxidant mask.',
    },
  },
  coconut_oil: {
    ingredient: 'Coconut Oil',
    rating: 'WORKS for some purposes; varies by use and skin type',
    what_it_does: [
      'Emollient — softens and moisturises',
      'Lauric acid (50% of coconut oil): antimicrobial; small molecule penetrates hair shaft',
      'Barrier occlusive — seals in moisture',
    ],
    works_well_for: ['Hair conditioning and protein loss reduction (lauric acid penetrates cortex)', 'Body moisturiser (especially for non-acne-prone body skin)', 'Cuticle care', 'Lip balm', 'Oil cleansing (as one of several oils in a cleansing oil blend)', 'Scalp massage oil'],
    not_for_facial_skin: 'Coconut oil is COMEDOGENIC (particularly for some people) — it can block pores on face. Acne-prone skin should avoid coconut oil on the face. Non-acne-prone skin MAY tolerate it but risk is real.',
    ethnic_note: 'Coconut oil is the foundation ingredient in beauty traditions across South Asian, Caribbean, East African, and Pacific communities. Its hair benefits are well-documented. Facial use is culturally common but should be individualised based on skin type.',
  },
  castor_oil_diy: {
    ingredient: 'Castor Oil (DIY use)',
    rating: 'VARIES — benefits are mixed with overblown claims',
    what_it_does: ['Emollient — very thick, creates a strong occlusive seal', 'Ricinoleic acid (90% of fatty acid content) has anti-inflammatory and laxative properties'],
    works_for: ['Thick occlusive balm for lips or cuticles', 'Mixed with lighter oils for body massage or hair scalp treatment'],
    does_not_do: 'Castor oil does NOT directly grow eyebrows, eyelashes, or scalp hair at a faster rate. No clinical evidence for hair growth. The anecdotal reports likely reflect improved moisture, reduced breakage, and scalp massage benefit rather than follicle stimulation.',
    caution: 'Very thick (high viscosity). Used neat on scalp causes significant build-up. Mix with lighter oils (jojoba, argan) for scalp use. Never use undiluted as a single scalp treatment.',
  },
};

// ─── INGREDIENTS WITH VARYING RESULTS ─────────────────────────────────────────

export const INGREDIENTS_THAT_VARY = {
  yoghurt: {
    ingredient: 'Yoghurt (plain, full-fat)',
    rating: 'VARIES',
    potential_benefits: ['Lactic acid (AHA) in yoghurt: mild exfoliation', 'Probiotics: may benefit skin microbiome (limited evidence when applied topically)', 'Protein: temporary skin-tightening'],
    notes: 'The lactic acid content varies widely by yoghurt brand and fermentation. Greek yoghurt has higher lactic acid concentration. Benefits are real but mild — for significant AHA exfoliation, a formulated lactic acid product at 5-10% is more effective.',
  },
  egg: {
    ingredient: 'Egg White / Egg Yolk',
    rating: 'VARIES',
    egg_white: 'Egg white masks create a temporary tightening effect as the protein dries. No permanent pore-reduction or collagen-building. Can cause contact allergy in some people.',
    egg_yolk: 'Rich in vitamins (A, D, E, B12), choline, and lecithin. Used in hair masks — the fats and vitamins condition the hair shaft.',
    salmonella_caution: 'Raw eggs carry salmonella risk. Avoid if you have any skin breaks. Rinse thoroughly.',
  },
  apple_cider_vinegar: {
    ingredient: 'Apple Cider Vinegar (ACV)',
    rating: 'VARIES — NOT recommended neat on skin',
    potential: 'ACV is acidic (pH 2-3) and has acetic acid with some antimicrobial properties.',
    danger_neat: 'NEVER apply undiluted ACV to skin. Burns and chemical damage (pH far too low). There are documented cases of chemical burns from ACV "skincare". Even diluted, it can irritate sensitive skin.',
    limited_use: 'A heavily diluted rinse (1 tablespoon ACV in 1 cup water) on scalp to address flaking or scalp pH — this is the most reasonable use. Not for facial skin.',
  },
  baking_soda: {
    ingredient: 'Baking Soda (Sodium Bicarbonate)',
    rating: 'AVOID for facial use',
    problem: 'pH of ~8-9 (very alkaline). Skin acid mantle has optimal pH of 4.5-5.5. Applying baking soda disrupts the acid mantle, damages the skin barrier, and can trigger breakouts, sensitisation, and worsened skin conditions.',
    no_benefit: 'Claims that baking soda "balances pH" are the opposite of accurate — it raises pH away from skin\'s optimal acidic range.',
    possible_use: 'Body scrub on non-sensitive body skin (heels, elbows) where barrier disruption is less consequential. Not for face.',
  },
  sugar_scrub_face: {
    ingredient: 'Sugar Scrub on Face',
    rating: 'VARIES — not ideal for facial skin',
    problem: 'Sugar crystals are sharp and irregularly shaped — they create micro-tears in facial skin rather than smooth exfoliation. Fine for body skin (thicker); better options for face include oat (rounded) or chemical exfoliants.',
    body_fine: 'Sugar scrub on body (legs, arms, décolletage) is perfectly fine and a time-honoured DIY.',
  },
};

// ─── INGREDIENTS TO AVOID ─────────────────────────────────────────────────────

export const INGREDIENTS_TO_AVOID = {
  lemon_juice: {
    ingredient: 'Lemon Juice',
    rating: 'AVOID — real risk',
    why: [
      'Highly acidic (pH 2-3): can chemically damage and irritate skin; disrupts acid mantle',
      'PHOTOTOXIC: lemon juice + UV light → severe burns and PIH. Phytophotodermatitis is a documented medical condition from citrus + sun.',
      'Can bleach skin unevenly, causing patchy discolouration rather than "brightening"',
    ],
    for_dark_skin: 'ESPECIALLY DANGEROUS for Fitzpatrick IV-VI: phytophotodermatitis causes severe PIH that can last months. Avoid completely.',
    what_to_use_instead: 'Vitamin C serum (stable, formulated, tested) for brightening. Mandelic acid for exfoliation on dark skin tones.',
  },
  toothpaste: {
    ingredient: 'Toothpaste',
    rating: 'AVOID — no benefit; potential harm',
    why: [
      'Toothpaste is formulated for enamel cleaning, not skin treatment',
      'Contains fluoride, sodium lauryl sulphate (SLS), peroxides, and flavours — all potentially irritating to skin',
      'SLS particularly strips skin barrier and can worsen breakouts',
      'May temporarily dry a pimple (triclosan in older formulas; now largely removed) but causes irritation and potential PIH in the process',
    ],
    what_to_use_instead: 'A genuine benzoyl peroxide spot treatment, sulfur mask, or salicylic acid product for acne.',
  },
  hairspray_as_setting_spray: {
    ingredient: 'Hairspray as Makeup Setting Spray',
    rating: 'AVOID — potential harm',
    why: [
      'Hairspray contains alcohol (very drying), polymers, resins, and parfum — all irritating to facial skin',
      'The setting benefit is real but not worth the barrier disruption and irritation risk',
    ],
    what_to_use_instead: 'A proper makeup setting spray (MAC Fix+, Morphe Continuous Setting Mist, Urban Decay All Nighter).',
  },
  glue_blackhead: {
    ingredient: 'Glue (for "blackhead removal")',
    rating: 'AVOID — can cause skin damage',
    why: [
      'Applying craft or school glue to skin and peeling it off may remove some surface dead skin cells',
      'DOES NOT remove actual blackheads (oxidised sebum in the pore) — only superficial material',
      'Pulling adhesive off skin disrupts the skin barrier; can pull off skin cells',
      'Repeated use can cause redness and sensitisation',
    ],
    what_to_use_instead: 'Salicylic acid cleanser dissolves sebum inside pores. BHA toner (2% salicylic). Professional extraction by licensed esthetician.',
  },
  undiluted_essential_oils: {
    ingredient: 'Undiluted Essential Oils',
    rating: 'AVOID neat on skin — always dilute',
    why: [
      'Essential oils are HIGHLY concentrated plant extracts. Neat application causes chemical burns and sensitisation.',
      'Even "gentle" oils (lavender, tea tree) can cause contact dermatitis when applied undiluted.',
      'Sensitisation is cumulative — repeated exposure to undiluted oils can create a permanent allergy.',
    ],
    correct_use: 'Dilute essential oils in a carrier oil at maximum 2-3% concentration. For face: 1% (6 drops per 30ml carrier). For body: 2-3% (12-18 drops per 30ml). For scalp: 3-5 drops in 1 tablespoon of carrier.',
    for_dark_skin: 'Several essential oils are phototoxic (citrus oils, especially bergamot, lime, grapefruit). Phototoxicity = PIH risk for Fitzpatrick IV-VI. Avoid phototoxic EOs before sun exposure.',
  },
};

// ─── ETHNIC KITCHEN BEAUTY WISDOM ────────────────────────────────────────────

export const ETHNIC_KITCHEN_BEAUTY = {
  west_african: {
    community: 'West African',
    traditions: [
      'Shea butter (karité) — raw, unrefined shea for body, hair, and scalp. West Africa is the source of the best quality shea.',
      'Black soap (ose dudu) — traditional soap from plantain ash, palm kernel oil, and cocoa pods. Natural, saponified. Excellent for cleansing.',
      'Palm kernel oil — applied to hair and skin for moisture and protection.',
      'Uda seeds — used in steam treatments; antimicrobial.',
      'Turmeric face masks (common in Ghanaian beauty rituals).',
    ],
    evidence: 'Shea butter: excellent evidence as an emollient and anti-inflammatory (contains cinnamic acid). Black soap: genuine cleansing benefits but pH can be high (alkaline from ash) — test with pH strip.',
  },
  south_asian: {
    community: 'South Asian',
    traditions: [
      'Besan (chickpea flour) face wash — gentle exfoliation; cleanses without stripping.',
      'Ubtan — traditional face and body scrub paste: besan + turmeric + milk + rosewater. Used as part of pre-wedding beauty ritual.',
      'Multani mitti (fuller\'s earth clay) — excellent natural clay mask for oily skin; absorbs excess oil.',
      'Rose water (gulab jal) — as toner; mixed into masks.',
      'Amla (Indian gooseberry) — in hair oil or masks for hair strengthening.',
      'Neem (Azadirachta indica) — antimicrobial; used in face packs for acne-prone skin.',
    ],
    evidence: 'Multani mitti: well-documented absorbent clay with real pore-cleansing effects (smectite clay — similar to bentonite). Rose water: has anti-inflammatory properties. Besan: mild exfoliation only. Neem: genuine antimicrobial (azadirachtin, nimbin).',
  },
  caribbean: {
    community: 'Caribbean',
    traditions: [
      'Aloe vera — used straight from the plant for sunburn, irritation, and hair setting.',
      'Coconut oil — for hair, body, and cooking; the ingredient running through all Caribbean beauty tradition.',
      'Bay rum — a traditional aftershave and tonic from bay laurel berries steeped in rum or alcohol. Antimicrobial and astringent.',
      'Lime and honey skin brightening (CAUTION: lime phototoxicity).',
      'Cane sugar body scrubs.',
    ],
    evidence: 'Aloe vera and coconut oil: excellent (see above). Bay rum: real antimicrobial properties. Lime: effective but phototoxic DANGER.',
  },
  arab: {
    community: 'Arab',
    traditions: [
      'Argan oil (Morocco) — rich in vitamin E, oleic, and linoleic acid. Excellent for hair and skin. Well-studied.',
      'Rose water (ma\' el-ward) — distillate of Damascus rose. Toner; skin-refresher; hair rinse. Anti-inflammatory.',
      'Black seed oil (Nigella sativa / kalonji oil) — deeply rooted in Islamic medical tradition. Anti-inflammatory; thymoquinone active compound.',
      'Ghassoul / Rhassoul clay — Moroccan mineral-rich clay from the Atlas Mountains. Excellent cleanser and mask.',
      'Frankincense (boswellia) — used in Omani and Gulf beauty; anti-inflammatory; some evidence for skin rejuvenation.',
    ],
    evidence: 'Argan oil: excellent evidence. Rhassoul clay: comparable to other mineral clays (absorbent, cleansing). Black seed oil: growing evidence for anti-inflammatory and possibly hair growth effects. Frankincense: some evidence for anti-inflammatory effects topically.',
  },
  latina: {
    community: 'Latina',
    traditions: [
      'Avocado mask — rich in vitamins E, C, and healthy fats; excellent emollient.',
      'Olive oil — used on hair, skin, and cuticles across Mediterranean Latin communities.',
      'Aloe vera — universal across Latin America.',
      'Maize (corn) starch — as a dry shampoo or body powder.',
      'Beer rinse — beer contains hops (silicon, conditioning) and malt (vitamins); used as a hair rinse for shine and body.',
    ],
    evidence: 'Avocado: excellent emollient and antioxidant. Olive oil: well-evidenced emollient (oleic acid); non-comedogenic on the face for most skin types. Beer rinse: some conditioning benefits (B vitamins, silicon content).',
  },
  east_asian: {
    community: 'East Asian',
    traditions: [
      'Rice water — fermented rice water used as toner and hair rinse. Contains inositol, vitamins B, C, E, and amino acids.',
      'Rice bran oil — rich in oryzanol (antioxidant); used in facial oils.',
      'Camellia (tsubaki) oil — light oil used in Japanese beauty for centuries. High oleic acid; good for hair and skin.',
      'Ginseng — used in Korean beauty. Adapts to stress; antioxidant; some evidence for improved skin texture.',
      'Mung bean powder — as a gentle cleansing wash in Korean and Chinese tradition.',
    ],
    evidence: 'Rice water: contains inositol that does penetrate the hair shaft; some evidence for reduced surface friction. Camellia oil: well-evidenced non-comedogenic skin oil. Ginseng: growing clinical evidence for skin benefits.',
  },
  east_african: {
    community: 'East African',
    traditions: [
      'Shea butter — used across the Sahel region.',
      'Frankincense resin (Ethiopian frankincense, Boswellia) — smoke purification; resin on skin.',
      'Castor oil — used across sub-Saharan Africa for hair and skin.',
      'Baobab oil (Adansonia digitata) — from baobab fruit. Rich in omega 3, 6, 9. Non-greasy. Traditional across Sahelian Africa.',
    ],
    evidence: 'Baobab oil: excellent light-weight emollient with genuine antioxidant content. Well-studied.',
  },
  south_african: {
    community: 'South African',
    traditions: [
      'Rooibos (Aspalathus linearis) — as a rinse or mask. Rich in antioxidants (aspalathin); anti-inflammatory; anti-aging properties.',
      'Marula oil (Sclerocarya birrea) — extraordinary non-greasy oil. Very high in oleic acid. Absorbs rapidly. Genuinely luxurious and effective.',
      'Baobab oil — used in Cape regions.',
      'Devil\'s claw — anti-inflammatory herb used in Southern African traditional medicine; some evidence topically.',
    ],
    evidence: 'Marula oil: excellent evidence. One of the best dry skin oils. Rooibos: genuine antioxidant with some clinical data for anti-inflammatory benefit topically.',
  },
  black_american: {
    community: 'Black American',
    traditions: [
      'Petroleum jelly (Vaseline) — iconic in Black American beauty culture for sealing in moisture (slugging), protecting edges, and waterproofing lips.',
      'Shea butter — adopted widely in natural hair movement.',
      'Castor oil (Jamaican Black Castor Oil variant) — for hair.',
      'Blue Magic hair grease — petroleum and mineral oil-based. Traditional scalp application.',
      'Kitchen sink deep conditioning — hair masks with eggs, mayonnaise, honey, and oils. Hot towel treatment.',
    ],
    evidence: 'Petroleum jelly: EXCELLENT occlusive. The gold standard sealing agent. Dermatologist recommended. Non-comedogenic (large molecule cannot penetrate pores). Shea butter: excellent. Kitchen DIY deep conditioning: protein (egg) and moisture (honey, oils) combination is genuinely effective for hair.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getDIYPhilosophy() { return DIY_BEAUTY_PHILOSOPHY; }
export function getIngredientThatWorks(ingredient) {
  return INGREDIENTS_THAT_WORK[ingredient] || INGREDIENTS_THAT_WORK;
}
export function getIngredientsThatVary() { return INGREDIENTS_THAT_VARY; }
export function getIngredientsToAvoid() { return INGREDIENTS_TO_AVOID; }
export function getEthnicKitchenBeauty(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_KITCHEN_BEAUTY[key] || Object.values(ETHNIC_KITCHEN_BEAUTY);
}

export const DIY_BEAUTY_STATS = {
  ingredientsThatWork: Object.keys(INGREDIENTS_THAT_WORK).length,
  ingredientsToAvoid: Object.keys(INGREDIENTS_TO_AVOID).length,
  ethnicCommunities: 9,
};
