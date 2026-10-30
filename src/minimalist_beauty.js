/**
 * MIRRR Minimalist Beauty Guide
 * Skinimalism, capsule makeup, 5-minute routines, no-makeup makeup,
 * skincare-first philosophy, and multicultural minimalist traditions
 */

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────

export const MINIMALIST_BEAUTY_OVERVIEW = {
  definition: 'Minimalist beauty is the practice of using fewer products with more intentional purpose. It prioritises skin health over coverage, quality over quantity, and a natural finish over a heavily made-up look.',
  key_philosophies: {
    skinimalism: 'A portmanteau of "skin" and "minimalism". Trending post-pandemic (2020-present). The idea that glowing, healthy skin is the aesthetic — not heavy foundation and full glam. Products are chosen to enhance skin, not conceal it.',
    less_is_more: 'Fewer products mean fewer ingredients reacting with each other on your skin. Simpler routines have higher adherence. Less product buildup, waste, cost, and decision fatigue.',
    skin_first_makeup_second: 'Invest in skincare first. The best canvas for makeup is healthy, hydrated skin. Good skincare reduces how much makeup you need.',
    intentional_purchases: 'Instead of buying trending products, buy products that solve a specific, identified need on your own skin.',
  },
  origins: {
    cultural_roots: 'Minimalist beauty is not a new concept — it is deeply embedded in East Asian beauty culture (Japanese mono no aware — the beauty of impermanence; wabi-sabi — the beauty of imperfection and simplicity). Korean skincare philosophy has always been about building healthy skin as the primary goal.',
    western_adoption: 'Western beauty culture adopted heavy full-coverage looks in the 20th century. The minimalist movement in Western beauty is partly a return, partly an influence from East Asian beauty philosophy.',
  },
};

// ─── SKINIMALISM ──────────────────────────────────────────────────────────────

export const SKINIMALISM_GUIDE = {
  definition: 'Skinimalism is a beauty philosophy and trend where the goal is skin that looks good BARE or with minimal product — not skin that looks good because it is covered. This means investing in skincare (hydration, barrier health, texture treatment) so you need less makeup.',
  key_products: {
    cleanser: 'A gentle, pH-balanced cleanser. The only cleanser you need. Fragrance-free for sensitive or compromised skin.',
    spf_moisturiser: 'A moisturiser with built-in SPF 30-50. One step that does two jobs. Morning essential.',
    targeted_treatment: 'ONE targeted treatment (retinol, or vitamin C, or niacinamide — not all three simultaneously). Address your primary skin concern only.',
    optional_tint: 'A tinted moisturiser or skin tint for days you want light coverage. This replaces foundation in a skinimalist routine.',
  },
  what_to_skip: {
    heavy_foundation: 'Full-coverage foundation that sits on top of skin and settles into texture.',
    excessive_layering: 'Multiple serums, essences, ampoules layered simultaneously. Each additional product increases sensitivity risk.',
    mattifying_products: 'Mattifying primers, powders, etc — these flatten the skin and remove the natural luminosity.',
    unnecessary_steps: 'Toner if your cleanser maintains pH. Eye cream if your regular moisturiser contains the same actives. Multiple SPF products when one is sufficient.',
  },
  skin_conditions_to_address: {
    hydration: 'Dehydrated skin looks dull, crepey, shows more lines. Hyaluronic acid + a moisturiser with occlusive helps retain water.',
    barrier: 'A damaged barrier causes redness, sensitivity, breakouts, and flaking — all of which require more makeup to cover. Ceramides, fatty acids, and cholesterol repair the barrier.',
    texture: 'Rough texture (from keratosis pilaris, closed comedones, or congestion) is visible even under foundation. A gentle AHA or BHA resolves texture over time.',
    pigmentation: 'Uneven skin tone is the main reason for foundation. Targeted vitamin C or niacinamide treatment fades spots gradually so you can eventually skip base makeup.',
  },
};

// ─── 5-MINUTE FACE ────────────────────────────────────────────────────────────

export const FIVE_MINUTE_FACE = {
  overview: 'A complete-looking face in 5 minutes or less. Uses multitasking products and strategic placement — not full face coverage.',
  routine: [
    {
      step: 1,
      time: '1 min',
      product: 'Tinted SPF or tinted moisturiser',
      how: 'Apply with fingers — 2-3 dots on each cheek, 1 on forehead, 1 on chin and nose. Blend inward with fingers for a skin-like finish.',
      purpose: 'Even out skin tone, protect from UV, hydrate.',
    },
    {
      step: 2,
      time: '45 sec',
      product: 'Concealer (under eyes + any blemishes only)',
      how: 'Tap with ring finger under eyes in a V-shape. Dot onto any active blemishes and pat gently.',
      purpose: 'Brighten and spot-conceal without full base coverage.',
    },
    {
      step: 3,
      time: '30 sec',
      product: 'Cream blush',
      how: 'Smile and tap 2 fingers of cream blush onto the apples of cheeks. Blend upward toward temples with fingers.',
      purpose: 'Adds life and colour to face. Cream blushes also add glow — no powder necessary.',
    },
    {
      step: 4,
      time: '45 sec',
      product: 'Brow gel or pencil',
      how: 'Fill any sparse areas with short, hair-like strokes. Brush through with spoolie.',
      purpose: 'Defined brows frame the face — single biggest impact for effort.',
    },
    {
      step: 5,
      time: '30 sec',
      product: 'Mascara (one coat) or lash curl',
      how: 'One coat from root to tip, wiggling the wand. On lower lashes if desired.',
      purpose: 'Opens eyes instantly.',
    },
    {
      step: 6,
      time: '30 sec',
      product: 'Lip tint or gloss',
      how: 'Apply with finger or directly from product.',
      purpose: 'Polishes the look. A lip tint with sheer colour adds warmth to the whole face.',
    },
  ],
  total_products: 6,
  total_time: '~5 minutes',
  multitaskers: {
    lip_cheek_cream: 'A single cream product applied to cheeks AND lips — blush and lip colour from one product.',
    tinted_spf: 'Skincare + coverage + sun protection in one step.',
    brow_mascara_duo: 'Some products are both brow gel and lash mascara formulated together.',
    highlighter_concealer: 'Some highlighter sticks double as undereye luminiser.',
  },
};

// ─── CAPSULE MAKEUP BAG ───────────────────────────────────────────────────────

export const CAPSULE_MAKEUP_BAG = {
  overview: 'A capsule makeup bag applies the concept of a capsule wardrobe to beauty — a small, curated collection of products that can create multiple looks. Every product earns its place by being either multi-functional or irreplaceable.',
  philosophy: 'The goal is to cover 80-90% of your beauty needs with 10-15 products. Every product should either multitask or be irreplaceable.',
  core_fifteen: [
    { item: 'Tinted moisturiser or skin tint', role: 'Base + skincare + light coverage' },
    { item: 'Concealer (one shade)', role: 'Spot correction + undereye brightening' },
    { item: 'Cream blush (one warm shade)', role: 'Cheeks + optional lip tint' },
    { item: 'Bronzer/contour stick', role: 'Warmth + definition' },
    { item: 'Highlighter (one shade)', role: 'Glow on cheekbones + brow bone + bridge' },
    { item: 'Neutral eyeshadow palette (4-6 shades)', role: 'Day + evening eye looks' },
    { item: 'Black eyeliner (pencil or gel)', role: 'Lash line + tightline + cat eye' },
    { item: 'Brown/taupe eyeliner', role: 'Soft day liner + brow fill' },
    { item: 'Mascara', role: 'Lash volume and length' },
    { item: 'Brow gel (tinted)', role: 'Brow shaping + fill' },
    { item: 'Lip liner (nude-ish or matching lip)', role: 'Lip definition + ombre' },
    { item: 'Nude/MLBB lipstick', role: 'Day lip + base for bold lip' },
    { item: 'Bold lip (red, berry, or deep)', role: 'One statement colour' },
    { item: 'Setting spray', role: 'Longevity + dewy finish' },
    { item: 'SPF (tinted or untinted)', role: 'Sun protection' },
  ],
  what_to_cut: {
    foundation_and_tinted_moisturiser: 'Choose ONE — not both.',
    multiple_eyeshadow_palettes: 'One versatile neutral palette creates every look.',
    multiple_lip_products_in_same_family: 'Do you really need six nudes? Choose two — a day nude and a night nude.',
    products_you_never_reach_for: 'If you have not used it in 3 months, it does not belong in a capsule collection.',
  },
};

// ─── NO-MAKEUP MAKEUP ─────────────────────────────────────────────────────────

export const NO_MAKEUP_MAKEUP = {
  overview: 'No-makeup makeup looks like you are wearing no makeup — but you are. The goal is skin that looks naturally flawless, with features that appear enhanced without the appearance of product.',
  principles: {
    skin_texture: 'Some skin texture must be visible. Perfectly pore-less skin looks unnatural in person (though it photographs well). A slight texture gives the appearance of bare skin.',
    no_obvious_lines: 'Foundation stops at the jaw, blush blending lines, overly contoured areas — these mark the face as "made up". Blend completely into the neck.',
    matching: 'Concealer, foundation, or tinted product must exactly match skin in natural daylight. A product slightly lighter (as often recommended for brightening) reads as makeup in no-makeup looks.',
    minimal_shimmer: 'Heavy shimmer or glitter is visible from a distance and reads as makeup. Subtle skin-like luminosity, gentle glow, or satin finish is what creates the no-makeup glow.',
  },
  technique: {
    skin_prep: 'Good skin prep is mandatory for no-makeup makeup. Hydrating serum, moisturiser, primer (optional) — skin should be plump, hydrated, and smooth.',
    skin_tint: 'A sheer skin tint or bb cream, applied lightly, evens skin tone without concealing texture.',
    concealer: 'Only where needed: undereye, any redness, blemishes. Do not apply all-over — this defeats the purpose.',
    blush: 'Sheer cream or liquid blush BLENDED OUT so you see a wash of colour, not a defined blush placement.',
    brows: 'Groomed, filled but natural-looking. No harsh lines.',
    mascara: 'One thin coat — or lash tint/lash lift as a permanent solution.',
    lip: 'A lip balm with colour, a MLBB (My Lips But Better) shade, or nothing. No overdrawn lip.',
    setting: 'A dewy setting spray — not powder — preserves the skin-like finish.',
  },
  ethnic_no_makeup: {
    deep_skin: 'For Fitzpatrick V-VI: a skin tint or foundation must match exactly without oxidising orange or looking ashy. Skin tints are often better than foundations for no-makeup looks on deep skin as they allow natural depth to show through.',
    south_asian: 'Glossy lips (layered balm/gloss), minimal eye (kajal smudged lightly on waterline rather than eyeliner), well-groomed bold brows.',
    east_asian: 'Glass skin as the no-makeup look — supreme hydration so skin has a wet, dewy glow. Very sheer or zero base, tinted lip balm, individual lash mascara.',
    black_american: 'Melanin glow as the no-makeup look — body oil or facial oil for luminosity, sheer gloss lip, clean groomed brows.',
  },
};

// ─── MINIMAL SKINCARE ROUTINE ─────────────────────────────────────────────────

export const MINIMAL_SKINCARE = {
  absolute_minimum: {
    morning: ['Gentle cleanser or water rinse', 'Moisturiser with SPF 30+'],
    evening: ['Gentle cleanser', 'Moisturiser'],
    note: 'This is the absolute minimum. 2 steps morning, 2 steps evening. Suitable for any skin type when using the right products for that type.',
  },
  efficient_four_product_routine: {
    products: [
      { product: 'Gentle cleanser', am: true, pm: true },
      { product: 'Niacinamide serum (pores, tone, barrier)', am: true, pm: true },
      { product: 'Moisturiser', am: true, pm: true },
      { product: 'Broad spectrum SPF 30-50', am: true, pm: false },
    ],
    note: 'Four products that address the majority of skin concerns without overloading or introducing interaction risk.',
  },
  efficient_actives: {
    note: 'If you want actives, choose one primary active and add it to your minimal routine. Do not stack multiple actives.',
    options: [
      { active: 'Retinol (vitamin A)', concern: 'Anti-aging, acne, texture, pigmentation', when: 'PM only; start 1x per week; increase frequency gradually', caution: 'Skin purging is normal; mandatory SPF; not in pregnancy' },
      { active: 'Vitamin C (L-ascorbic acid)', concern: 'Brightening, antioxidant, collagen support', when: 'AM, then SPF on top', caution: 'Unstable; look for stabilised forms; can sting sensitive skin' },
      { active: 'AHA (glycolic/lactic)', concern: 'Exfoliation, texture, pigmentation', when: 'PM, 1-3x weekly', caution: 'Sun sensitive; do not combine with retinol in same session' },
      { active: 'BHA (salicylic acid)', concern: 'Acne, congestion, blackheads', when: 'AM or PM, 1-3x weekly', caution: 'Can be drying; avoid over-use' },
    ],
  },
};

// ─── ETHNIC MINIMALIST TRADITIONS ─────────────────────────────────────────────

export const ETHNIC_MINIMALIST_TRADITIONS = {
  west_african: {
    community: 'West African',
    minimalist_approach: 'Natural oils (shea, marula) and black soap as the entire skincare routine. The West African tradition is inherently minimalist — fewer steps, more quality. Body shea butter, face shea butter. Shea is moisturiser, serum, and protection in one product.',
    makeup_minimal: 'Kajal/kohl on the eyes, oil on the lips. A traditionally minimal approach in everyday settings — full makeup for ceremonies and celebrations.',
  },
  south_asian: {
    community: 'South Asian',
    minimalist_approach: 'Desi grandma beauty: mustard oil hair massage, besan (chickpea flour) + turmeric face wash, rose water toner. The traditional South Asian routine is 3-4 ingredients. Kitchen-cupboard beauty at its most efficient.',
    makeup_minimal: 'Kajal eyeliner as the single makeup item. A single kohl line transforms the eyes — traditional and deeply minimal.',
  },
  caribbean: {
    community: 'Caribbean',
    minimalist_approach: 'Coconut oil for hair, skin, and lips. Aloe vera plant kept at home for sun, burns, and skin. A 2-ingredient body routine.',
    makeup_minimal: 'Natural lip (glossy with coconut oil or clear gloss), mascara. The Caribbean minimalist look celebrates sun-kissed glow naturally.',
  },
  arab: {
    community: 'Arab',
    minimalist_approach: 'Argan oil ("liquid gold") used for face, hair, and body. Rose water as toner and setting spray. A 2-3 ingredient traditional routine.',
    makeup_minimal: 'Kohl eyeliner (kajal) as the defining element. Kohl alone is enough — the dramatic eye is the traditional Arab beauty focal point.',
  },
  latina: {
    community: 'Latina',
    minimalist_approach: 'Agua de rosas (rose water) as a daily toner and refresher. Aloe vera (sábila) from the plant directly. Coconut oil.',
    makeup_minimal: 'Bold lip (the single statement product). A minimalist Latina approach is clean skin + bold lip — everything else left bare.',
  },
  east_asian: {
    community: 'East Asian',
    minimalist_approach: 'Japanese minimalism: one quality toning lotion, one moisturiser, one SPF. The Japanese 3-step routine is the original minimalist routine. Korean 10-step is actually about skin health and most steps are optional/situational.',
    makeup_minimal: 'Glass skin (bare or skin-tint) + tinted lip balm. The East Asian minimalist ideal is flawless skin needing no coverage.',
  },
  east_african: {
    community: 'East African',
    minimalist_approach: 'Ethiopian spiced butter (tesmi/qibe) for hair, skin, and body. A traditional beauty all-in-one. Natural oils (argan from Morocco, coconut).',
    makeup_minimal: 'Kohl eyeliner + natural lip. Minimalist Ethiopian beauty is kohl-focused.',
  },
  south_african: {
    community: 'South African',
    minimalist_approach: 'Marula oil (indigenous to Southern Africa) for face and body. Rooibos tea as a skin rinse (antioxidant). Natural clay masks.',
    makeup_minimal: 'Natural skin + adornment (beadwork, jewellery). Body adornment as the beauty focus rather than face makeup.',
  },
  black_american: {
    community: 'Black American',
    minimalist_approach: 'The "Black don\'t crack" philosophy — melanin-rich skin ages well with moisturisation and SPF. Many Black American beauty traditions are inherently minimalist: shea butter, coconut oil, castor oil, vaseline. The less-is-more approach to skincare is part of the cultural fabric.',
    makeup_minimal: 'Mascara + bold lip. The classic Black American minimal look: defined eyes and statement lip.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getMinimalistOverview() { return MINIMALIST_BEAUTY_OVERVIEW; }
export function getSkinimasimGuide() { return SKINIMALISM_GUIDE; }
export function getFiveMinuteFace() { return FIVE_MINUTE_FACE; }
export function getCapsuleMakeupBag() { return CAPSULE_MAKEUP_BAG; }
export function getNoMakeupMakeup() { return NO_MAKEUP_MAKEUP; }
export function getMinimalSkincare(type) {
  return type ? MINIMAL_SKINCARE[type] : MINIMAL_SKINCARE;
}
export function getEthnicMinimalist(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_MINIMALIST_TRADITIONS[key] || Object.values(ETHNIC_MINIMALIST_TRADITIONS);
}

export const MINIMALIST_BEAUTY_STATS = {
  fiveMinuteSteps: FIVE_MINUTE_FACE.routine.length,
  capsuleProducts: CAPSULE_MAKEUP_BAG.core_fifteen.length,
  ethnicTraditions: Object.keys(ETHNIC_MINIMALIST_TRADITIONS).length,
  activesOptions: MINIMAL_SKINCARE.efficient_actives.options.length,
};
