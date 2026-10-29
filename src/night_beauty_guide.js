/**
 * MIRRR Night Beauty Guide
 * Circadian chrono-beauty, slugging, overnight treatments,
 * PM skincare routines, sleep position, silk pillowcase science,
 * and ethnic nighttime beauty traditions
 */

// ─── CHRONO-BEAUTY OVERVIEW ──────────────────────────────────────────────────

export const CHRONO_BEAUTY_OVERVIEW = {
  definition: 'Chrono-beauty (or circadian beauty) is skincare and beauty practice aligned with the body\'s circadian rhythm — the 24-hour internal clock that governs biological processes including skin cell behaviour.',
  skin_at_night: {
    cell_turnover: 'Skin cell division (mitosis) peaks at night — particularly between 11 PM and 4 AM. The basal cell layer of the epidermis produces new cells most actively during this window. Night is when the skin renews itself.',
    repair: 'DNA repair enzymes in skin cells are more active at night. Damage from UV, pollution, and oxidative stress accumulated during the day is repaired during sleep.',
    transepidermal_water_loss: 'TEWL (transepidermal water loss) is higher at night — the skin is slightly more permeable, losing more water. This is why you may wake up with drier skin. It also means products penetrate more effectively.',
    cortisol: 'Cortisol (the stress hormone) is lowest at night. High daytime cortisol can trigger inflammation and sebum production. The overnight low cortisol period is anti-inflammatory — ideal for barrier repair.',
    growth_hormone: 'Human growth hormone peaks during deep sleep. GH stimulates collagen synthesis and cell repair. Poor sleep disrupts GH release, slowing skin repair.',
  },
  implications_for_routine: 'A PM skincare routine can be more active (retinoids, AHAs, stronger actives) because: UV sensitivity is irrelevant at night; the skin\'s natural repair cycle is active; TEWL means better product penetration. An AM routine focuses on protection (antioxidants, SPF, lightweight base).',
};

// ─── PM SKINCARE ROUTINE ──────────────────────────────────────────────────────

export const PM_SKINCARE_ROUTINE = {
  overview: 'The evening skincare routine should clean the day\'s accumulated pollutants, makeup, and sunscreen, then support the skin\'s natural overnight repair process.',
  steps: [
    {
      step: 1,
      name: 'Makeup Removal / First Cleanse',
      why: 'Cleanser alone cannot effectively remove waterproof makeup, SPF, and heavy sunscreen. An oil-based first cleanse (oil cleanser, micellar water, or cleansing balm) dissolves these oil-based products without stripping. "Double cleansing" is a Korean beauty principle: first cleanse removes makeup/SPF, second cleanse cleans the skin itself.',
      products: 'Oil cleansers: DHC Deep Cleansing Oil, Clinique Take the Day Off Cleansing Balm, drugstore micellar water',
      note: 'Skip if you wear no makeup or only tinted SPF — a single gentle cleanser is sufficient.',
    },
    {
      step: 2,
      name: 'Second Cleanse / Cleanser',
      why: 'A gentle water-based cleanser removes residue from the first cleanse and any sweat, oil, or water-soluble debris.',
      products: 'Choose based on skin type: gel for oily, cream for dry, foaming for combination. pH-balanced (pH 4.5-6.5).',
    },
    {
      step: 3,
      name: 'Exfoliation (1-3x per week, not every night)',
      why: 'Remove accumulated dead skin cells to allow better product penetration and reveal smoother skin.',
      products: 'AHA (glycolic or lactic acid) for surface exfoliation and brightening. BHA (salicylic acid) for inside-pore decongestion.',
      note: 'Do NOT use on the same night as retinol. Space active nights.',
    },
    {
      step: 4,
      name: 'Toner / First Essence (optional)',
      why: 'Restores skin pH after cleansing. Delivers a first layer of hydration or treatment.',
      products: 'Hydrating toners: Pyunkang Yul Essence Toner, Paula\'s Choice Resist Super-Antioxidant Concentrate Serum. Treatment toners: exfoliating toner (AHA/BHA) — in which case this IS your exfoliation step.',
    },
    {
      step: 5,
      name: 'Treatment / Active Serum',
      why: 'The core treatment step. Use your primary active here.',
      products: {
        retinol_retinoid: 'Retinol or prescription tretinoin — the most evidence-based night treatment for anti-aging, acne, pigmentation. Start 1-2x per week; increase frequency.',
        niacinamide: 'Niacinamide 10%: sebum regulation, pore appearance, barrier repair, PIH fading.',
        peptides: 'Peptide serum: collagen-stimulating, anti-aging.',
        vitamin_c: 'Vitamin C: some formulas work PM (L-ascorbic acid is better in AM; stabilised vitamin C esters work well PM).',
      },
    },
    {
      step: 6,
      name: 'Eye Cream (optional)',
      why: 'Targeted treatment for the delicate periorbital area.',
      products: 'Gentle retinol eye cream (PM). Peptide eye cream. Caffeine eye cream PM or AM.',
    },
    {
      step: 7,
      name: 'Moisturiser / Night Cream',
      why: 'Seals in previous layers. Reduces TEWL. Supports barrier. Night creams tend to be richer than day creams.',
      products: 'Rich moisturiser for dry skin. Gel-cream for oily. Barrier-repair cream (ceramides, fatty acids, cholesterol) for compromised skin.',
    },
    {
      step: 8,
      name: 'Facial Oil (optional, after moisturiser or mixed in)',
      why: 'Occlusive layer. Adds lipids. Seals everything in. Can boost radiance.',
      products: 'Rosehip oil (vitamin A, antioxidants). Squalane (lightweight, non-comedogenic). Marula oil.',
      note: 'For oily or acne-prone skin: this step may be skipped or a very light oil used in tiny amount.',
    },
    {
      step: 9,
      name: 'Slugging (optional — last step)',
      why: 'Applying a thin layer of petrolatum (Vaseline) as the final occlusive seals the routine completely. Maximum moisture retention.',
      note: 'Not suitable for acne-prone skin (can clog pores for some people). Best for dry, barrier-compromised skin.',
    },
  ],
};

// ─── SLUGGING GUIDE ───────────────────────────────────────────────────────────

export const SLUGGING_GUIDE = {
  origin: 'Slugging gets its name from the slug-like shiny appearance of the skin after application of a thick occlusive. The technique was long practised in Black and Caribbean communities — applying Vaseline as an overnight treatment on the face and lips — before it went mainstream via Korean beauty influencers and Reddit skincare communities around 2020-2021.',
  what_it_is: 'Applying a thin layer of petrolatum-based product (Vaseline/petroleum jelly, Aquaphor) as the very last step in your PM routine. Petrolatum is one of the most effective occlusives known — it reduces TEWL by up to 98%, essentially creating a seal over the skin surface.',
  science: {
    petrolatum: 'Petroleum jelly (petrolatum) is an inert mixture of mineral oil and wax. It does NOT penetrate the skin or add water. What it does is create an impermeable barrier on the skin surface that prevents water from evaporating. Your own skin\'s moisture is locked in.',
    barrier_repair: 'Slugging is particularly beneficial for damaged or compromised skin barriers. When the barrier is impaired (ceramide depletion from over-exfoliation, harsh cleansers, retinoid irritation), slugging provides immediate protection while the skin rebuilds.',
    occlusive_principle: 'The principle of slugging applies to any occlusive — the petrolatum brand is simply the most effective and cheapest. Aquaphor (petrolatum + other ingredients) works similarly. Vaseline is the most common.',
  },
  how_to: {
    step1: 'Complete your entire skincare routine.',
    step2: 'Wait until serums and moisturisers are absorbed (1-2 min).',
    step3: 'Take a very small amount of petroleum jelly (pea-sized to a dime-sized) on your fingertips.',
    step4: 'Warm between fingers and press gently onto face. Focus on dry areas.',
    step5: 'The result should be a thin, shiny layer — not thick.',
    step6: 'Wake up, wash off with gentle cleanser.',
  },
  who_should_slug: ['Dry skin', 'Compromised/damaged barrier', 'Retinoid users (slugging on retinoid nights can buffer irritation — though it may reduce retinoid efficacy)', 'Eczema-prone skin', 'Harsh climate (cold, dry, air conditioning)'],
  who_should_avoid: ['Acne-prone skin: petrolatum can trap bacteria and exacerbate breakouts for some people', 'Fungal acne: occlusive environments promote Malassezia growth', 'Very oily skin'],
  ethnic_tradition: {
    note: 'Vaseline as an overnight beauty treatment is deeply embedded in Black, Caribbean, and West African beauty traditions — applying petroleum jelly to face, lips, and elbows before bed has been practised for generations. The contemporary "slugging" trend is mainstream adoption of a long-standing Black beauty tradition.',
  },
};

// ─── OVERNIGHT TREATMENTS ─────────────────────────────────────────────────────

export const OVERNIGHT_TREATMENTS = {
  sleeping_masks: {
    name: 'Sleeping Masks',
    what: 'A thick gel or cream product applied as the last step, left on overnight, rinsed off in the morning. More occlusive than a regular night cream. Originated in Korean beauty.',
    who: 'Any skin type. Particularly beneficial for dry, dehydrated, or dull skin.',
    how: '2-3 nights per week (not every night — can cause milia in some people). Scoop out a small amount, warm in palms, press onto face.',
    popular: 'Laneige Water Sleeping Mask (classic), Belif The True Cream Aqua Bomb as overnight treatment, Origins Drink Up Intensive Overnight Mask.',
  },
  hair_masks: {
    name: 'Overnight Hair Masks',
    what: 'Deep conditioning treatment left on hair overnight under a shower cap or silk cap.',
    how: 'Apply a generous layer of deep conditioner or hair mask from mid-lengths to ends. Cover with a plastic shower cap (to prevent product transfer to pillowcase) and a silk bonnet or satin cap over that.',
    benefits: 'Extended contact time allows deeper penetration of conditioning ingredients. More effective than a 5-minute rinse-out.',
    caution: 'Not recommended for fine hair — extended conditioning can make fine hair limp and heavy. Protein masks overnight can cause protein overload. Moisture masks overnight are safest.',
  },
  lip_treatment: {
    name: 'Overnight Lip Treatment',
    what: 'A thick balm or mask applied to lips before sleep.',
    products: 'Laneige Lip Sleeping Mask (fruity, sweet-scented), plain Vaseline (most effective occlusive), Aquaphor Lip Repair, Tatcha Kissu Lip Mask.',
    result: 'Dramatically softer, more plump-looking lips in the morning. Repairs chronic dryness and cracking over time.',
  },
  foot_treatment: {
    name: 'Overnight Foot Treatment',
    what: 'Apply a thick cream or foot-specific balm (urea 10-25%), then cover with cotton socks overnight.',
    products: 'Urea cream (10-25%) for calluses and dry skin. O\'Keeffe\'s Healthy Feet. Baby Foot (chemical peel for feet — not nightly, a 1-2x per year intensive).',
  },
  retinol_application: {
    name: 'Retinol / Tretinoin (Most Important Overnight Active)',
    what: 'Vitamin A derivatives are the most evidence-based overnight treatment for anti-aging, acne, texture, and pigmentation.',
    why_night_only: 'Retinoids increase photosensitivity — they make skin more vulnerable to UV damage and should not be worn during the day (for prescription strength). Retinol also degrades faster in UV light.',
    results: 'Over 12-24 weeks: improved skin texture, reduced fine lines, lighter PIH, smaller pore appearance, improved acne.',
  },
};

// ─── SLEEP POSITION AND SKIN ──────────────────────────────────────────────────

export const SLEEP_POSITION_GUIDE = {
  back_sleeping: {
    position: 'Back sleeping',
    skin_impact: 'Best for skin. Face does not press against any surface — no friction, no compression of skin folds that become sleep lines over time.',
    disadvantages: 'Can worsen snoring, acid reflux. Not comfortable for all body types.',
  },
  side_sleeping: {
    position: 'Side sleeping',
    skin_impact: 'The face compresses against the pillow, creating sleep lines (mechanical creases from compression). Over many years, these can contribute to premature lines on the side you sleep on. Also: one side of the face may become more prone to breakouts or dryness from pillow contact.',
    mitigation: 'Silk or satin pillowcase (reduces friction). A sleep-specific silk pillow (curved to reduce face compression).',
  },
  face_down: {
    position: 'Face-down sleeping',
    skin_impact: 'Worst for skin. Maximum compression and friction. Can cause premature lines, puffiness from fluid restriction, and clogged pores from direct pillow contact.',
    recommendation: 'Avoid for skin health.',
  },
};

// ─── SILK PILLOWCASE SCIENCE ──────────────────────────────────────────────────

export const SILK_PILLOWCASE_GUIDE = {
  overview: 'Silk (and satin) pillowcases are recommended for both skin and hair care. The science is straightforward: silk has less friction against the skin and hair than cotton.',
  skin_benefits: {
    friction: 'Cotton has a rougher surface texture that causes friction against the face during sleep. This friction can contribute to sleep lines over years. Silk\'s smooth surface glides without friction.',
    moisture_retention: 'Cotton is highly absorbent — it draws moisture from your skin and products overnight. Silk is much less absorbent, leaving product and skin moisture on your face.',
    acne: 'Cotton absorbs skin oils and bacteria and redeposits them onto skin every night. Silk is less absorbent and therefore fewer bacteria accumulate on the surface.',
  },
  hair_benefits: {
    friction: 'Cotton pillowcase friction causes physical damage to the hair cuticle — the rough surface catches on the cuticle scales, creating frizz, breakage, and knots. Silk/satin allows hair to glide.',
    moisture: 'Cotton absorbs hair\'s moisture (particularly important for dry, coily, or chemically treated hair). Silk retains moisture in the hair.',
    afro_textured: 'For Afro-textured hair: a silk bonnet or satin pillowcase is a foundational nighttime care practice. The curl pattern and fragility of 4C hair means cotton friction causes significant breakage overnight. A silk bonnet protects the style and reduces manipulation.',
  },
  silk_vs_satin: 'True silk is the most effective and most expensive. Satin (a weave pattern, typically polyester or a blend) mimics many of silk\'s friction-reducing properties at a much lower price point. Charmeuse satin is closest to silk in performance. Both are significantly better for hair than cotton.',
  mulberry_silk: 'Mulberry silk (from silkworms fed exclusively mulberry leaves) is the highest quality silk — strongest, smoothest, longest fibres. Momme weight (mm) indicates density: 19-22mm is recommended for pillowcases.',
};

// ─── ETHNIC NIGHTTIME BEAUTY ──────────────────────────────────────────────────

export const ETHNIC_NIGHTTIME_BEAUTY = {
  west_african: {
    community: 'West African',
    traditions: 'Shea butter as an all-over body and face overnight moisturiser — a long-standing traditional practice. Head wrapping with fabric or a sleeping cap to protect natural hair styles. Shea butter on lips overnight.',
  },
  south_asian: {
    community: 'South Asian',
    traditions: 'Overnight oil treatment — applying coconut or mustard oil to hair and massaging the scalp (champi) before sleep. Covering with a towel or cap. Turmeric paste applied to skin overnight (caution: stains). Milk cream (malai) as an overnight face treatment.',
  },
  caribbean: {
    community: 'Caribbean',
    traditions: 'Jamaican black castor oil applied to scalp and edges before sleep. Coconut oil on lips and face. Satin/silk bonnet use is strongly embedded in Caribbean hair culture.',
  },
  arab: {
    community: 'Arab',
    traditions: 'Argan oil applied to face and hair overnight. Rose water on face. Overnight oil wrap on hair.',
  },
  east_asian: {
    community: 'East Asian',
    traditions: 'Japanese: applying a rich layered lotion/emulsion overnight routine. Korean: sleeping mask as the final step. The Korean 7-skin method can be performed at night — layering 7 applications of a watery toner for maximum hydration.',
  },
  east_african: {
    community: 'East African',
    traditions: 'Ethiopian qibe (spiced butter — clarified butter with fenugreek, onion, and spices) applied to hair overnight. East African women also traditionally apply plant-based oils to hair and body before sleeping.',
  },
  black_american: {
    community: 'Black American',
    traditions: 'The silk bonnet is a cornerstone of Black American nighttime beauty. Protecting natural hair styles, braids, twists, and wigs overnight with a satin or silk bonnet or scarf is a deeply embedded practice. Vaseline on lips, elbows, and knees overnight. Castor oil applied to edges and scalp before sleep. "Night moisturising" — moisturising on damp skin after washing, then sealing with an oil or butter before the bonnet.',
  },
  south_african: {
    community: 'South African',
    traditions: 'Marula oil applied overnight. Traditional body oiling before sleep. Silk or satin bonnet traditions common to all Sub-Saharan African communities.',
  },
  latina: {
    community: 'Latina',
    traditions: 'Coconut oil or rose hip oil on face overnight. Olive oil (aceite de oliva) as an overnight hair mask in Latin traditions. Aloe vera (sábila) gel applied overnight to skin for soothing.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getChronoBeautyOverview() { return CHRONO_BEAUTY_OVERVIEW; }
export function getPMSkincareRoutine(step) {
  return step ? PM_SKINCARE_ROUTINE.steps[step - 1] : PM_SKINCARE_ROUTINE;
}
export function getSluggingGuide() { return SLUGGING_GUIDE; }
export function getOvernightTreatment(type) {
  return type ? OVERNIGHT_TREATMENTS[type] : OVERNIGHT_TREATMENTS;
}
export function getSleepPositionGuide() { return SLEEP_POSITION_GUIDE; }
export function getSilkPillowcaseGuide() { return SILK_PILLOWCASE_GUIDE; }
export function getEthnicNighttimeBeauty(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_NIGHTTIME_BEAUTY[key] || Object.values(ETHNIC_NIGHTTIME_BEAUTY);
}

export const NIGHT_BEAUTY_STATS = {
  pmSteps: PM_SKINCARE_ROUTINE.steps.length,
  overnightTreatments: Object.keys(OVERNIGHT_TREATMENTS).length,
  ethnicCommunities: Object.keys(ETHNIC_NIGHTTIME_BEAUTY).length,
  sleepPositions: Object.keys(SLEEP_POSITION_GUIDE).length,
};
