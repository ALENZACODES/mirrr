/**
 * MIRRR Beauty Routines by Budget
 * Drugstore to luxury alternatives for ethnic beauty routines
 * Best affordable dupes, splurge-worthy investments, and free DIY alternatives
 */

// ─── BUDGET PHILOSOPHY ────────────────────────────────────────────────────────

export const BUDGET_PHILOSOPHY = {
  principle: 'Good skincare is not about spending the most money. It is about choosing the right ingredients at the right concentrations, used consistently. Many drugstore products outperform luxury ones in clinical studies. The most expensive product is always the one you buy and don\'t use.',

  where_to_spend_vs_save: {
    worth_splurging: [
      { category: 'Prescription retinoids', why: 'Tretinoin requires a prescription but costs very little and outperforms all OTC retinols' },
      { category: 'Broad-spectrum SPF', why: 'You\'ll use a full bottle monthly — buy one you enjoy wearing daily. Texture compliance matters.' },
      { category: 'Professional treatments', why: 'A quarterly chemical peel from a qualified aesthetician exceeds what 6 months of expensive creams can do' },
      { category: 'Foundation/concealer for deep skin', why: 'Shade range is drastically better in professional lines for deeper skin tones — Fenty, NARS, MAC' },
    ],
    save_without_compromise: [
      { category: 'Cleansers', why: 'Washes off the face. Even if it contains luxury ingredients, contact time is too brief for them to work.' },
      { category: 'Basic SPF moisturisers', why: 'Many drugstore SPF moisturisers are equal to luxury versions in UV protection' },
      { category: 'Sheet masks', why: 'The main benefit is the temporary hydration hit — cheap sheet masks achieve this equally well' },
      { category: 'Petroleum jelly / Vaseline', why: 'The best occlusive available at $3 a jar' },
      { category: 'The Ordinary actives', why: 'Retinol, niacinamide, vitamin C — among the most studied actives at 10-20% of luxury price' },
    ],
  },
};

// ─── CLEANSER BY BUDGET ───────────────────────────────────────────────────────

export const CLEANSER_BY_BUDGET = {
  budget: [
    { name: 'CeraVe Hydrating Cleanser', price: '$12-15', why: 'Ceramides, hyaluronic acid, no fragrance. Dermatologist favourite for sensitive and darker skin.', skin_types: ['dry', 'sensitive', 'all'] },
    { name: 'Neutrogena Ultra Gentle Daily Cleanser', price: '$8-10', why: 'Fragrance-free, extremely gentle, rinses clean', skin_types: ['sensitive', 'acne-prone'] },
    { name: 'Simple Kind to Skin Moisturising Facial Wash', price: '$7-9', why: 'Available in many markets globally, fragrance-free, gentle', skin_types: ['all'] },
    { name: 'Vanicream Gentle Facial Cleanser', price: '$10-12', why: 'Free of dyes, fragrance, parabens — extremely clean formula for reactive skin', skin_types: ['sensitive', 'eczema'] },
  ],
  mid_range: [
    { name: 'La Roche-Posay Toleriane Hydrating Gentle Cleanser', price: '$18-22', why: 'Prebiotic thermal water, excellent for sensitive darker skin, no fragrance', skin_types: ['sensitive', 'dry'] },
    { name: 'First Aid Beauty Pure Skin Face Cleanser', price: '$22-25', why: 'Colloidal oatmeal, good for eczema-prone skin', skin_types: ['sensitive', 'eczema'] },
  ],
  luxury: [
    { name: 'Tatcha The Rice Polish', price: '$38-65', why: 'Enzyme exfoliating cleanser, excellent for brightening dark skin, the Japanese rice tradition', skin_types: ['all', 'brightening focus'] },
    { name: 'Augustinus Bader The Cream Cleansing Gel', price: '$60', why: 'TFC8 technology, luxury formulation, effective deep cleanse', skin_types: ['mature', 'dry'] },
  ],
  diy: [
    { name: 'Raw honey cleanse', cost: 'Under $5', how: 'Manuka or raw honey massaged over face and rinsed. Natural antibacterial and humectant properties. Safe for most skin types including acne-prone.' },
    { name: 'Micellar water (any brand)', cost: '$6-8', how: 'Garnier, store brands — effective makeup removal for those who prefer no-rinse' },
  ],
};

// ─── MOISTURISER BY BUDGET ────────────────────────────────────────────────────

export const MOISTURISER_BY_BUDGET = {
  budget: [
    { name: 'CeraVe Moisturising Cream', price: '$16-20', why: 'Ceramides, hyaluronic acid, no fragrance. Recommended by dermatologists globally for dry skin and eczema.', consistency: 'Thick cream', for_community: 'Excellent for West African, East African skin types prone to dryness' },
    { name: 'Neutrogena Hydro Boost Water Gel', price: '$18-22', why: 'Hyaluronic acid gel, non-greasy, absorbs quickly', consistency: 'Gel', for_community: 'Great for oily/acne-prone skin; lighter weight for South Asian combination skin' },
    { name: 'Olay Regenerist Micro-Sculpting Cream', price: '$25-30', why: 'Contains niacinamide, hyaluronic acid, and amino-peptides. Outstanding anti-aging value.', consistency: 'Cream' },
    { name: 'Pond\'s Bright Miracle', price: '$8-15 (varies by market)', why: 'Contains niacinamide and vitamin B3, very affordable, available globally', for_community: 'Popular across Asian markets, affordable for South Asian, East Asian communities' },
  ],
  mid_range: [
    { name: 'Tatcha The Water Cream', price: '$68', why: 'Oil-free, Japanese wild rose extract, antioxidants, excellent texture', for_community: 'East Asian skin types, those who prefer lightweight' },
    { name: 'Paula\'s Choice Skin Recovery Moisturiser', price: '$32-38', why: 'Science-backed, no fragrance, excellent formulation for dry/sensitive skin' },
    { name: 'Kiehl\'s Ultra Facial Cream', price: '$32-75', why: 'A classic — effective, well-formulated, available globally', consistency: 'Medium weight cream' },
  ],
  luxury: [
    { name: 'La Mer Moisturising Soft Cream', price: '$190+', why: 'The ultimate luxury moisturiser. Kelp ferment (Miracle Broth). Beautiful texture. The results are real but debated whether they justify the price versus La Roche-Posay.' },
    { name: 'Augustinus Bader The Cream', price: '$170-265', why: 'TFC8 complex based on wound healing research. Real clinical backing. Beloved by dermatologists.' },
    { name: 'Tatcha The Dewy Skin Cream', price: '$68', why: 'High-end but not extreme — Japanese leopard lily, hyaluronic acid, excellent for dry or mature menopausal skin' },
  ],
  shea_butter_note: {
    product: 'Raw shea butter',
    price: '$10-20 for 1 pound',
    worth_knowing: 'Raw shea butter from a reputable source is one of the most effective and deeply moisturising products available at any price point. It is the traditional staple of West African beauty for very good reason. A 1-pound jar lasts months for face and body use.',
    for_community: 'Especially important for West African, Black American, Caribbean communities where shea is a cultural heritage ingredient',
  },
};

// ─── SERUM AND TREATMENT BY BUDGET ───────────────────────────────────────────

export const SERUM_BY_BUDGET = {
  vitamin_c: {
    budget: { name: 'The Ordinary Ascorbyl Glucoside Solution 12%', price: '$8-12', note: 'Stable vitamin C derivative, good brightening, less potent than L-ascorbic acid' },
    mid: { name: 'Paula\'s Choice C15 Super Booster', price: '$48-55', note: 'Pure L-ascorbic acid 15% with ferulic acid and vitamin E — excellent clinical formulation' },
    luxury: { name: 'SkinCeuticals CE Ferulic', price: '$170-185', note: 'The gold standard. The original patent-backed formula. Real results, real price.' },
    diy: { name: 'Fresh lemon juice at 5% in rose water', price: '~$2', note: 'NOT recommended — uncontrolled pH, psoralens, risk of phytophotodermatitis. Theory sounds good, practice is risky.' },
  },

  retinol: {
    budget: [
      { name: 'The Ordinary Retinol 0.5% in Squalane', price: '$8-10', note: 'Good stable retinol in squalane base. Excellent for beginners.' },
      { name: 'L\'Oréal Revitalift 1.5% Pure Retinol', price: '$30-35', note: 'Higher concentration, excellent value, widely studied' },
    ],
    mid: { name: 'Paula\'s Choice 1% Retinol Treatment', price: '$48', note: '1% retinol with peptides and antioxidants' },
    luxury: { name: 'Sunday Riley A+ Retinoid Serum', price: '$85', note: 'Good quality retinoid with supportive ingredients' },
    prescription: { name: 'Tretinoin 0.025-0.1%', price: '$5-30 (generic)', note: 'Outperforms all OTC retinols in clinical studies. Requires prescription but is dramatically more effective and affordable than luxury retinols. Worth pursuing.' },
  },

  niacinamide: {
    budget: [
      { name: 'The Ordinary Niacinamide 10% + Zinc 1%', price: '$5-7', note: 'The most cost-effective niacinamide available. Proven effective.' },
      { name: 'Insta Natural Vitamin C 20% with Niacinamide', price: '$15', note: 'Combined vitamin C and niacinamide — convenient dual action' },
    ],
    mid: { name: 'Murad Rapid Age Spot Correcting Serum', price: '$73', note: 'Niacinamide + tranexamic acid combination — targeted for hyperpigmentation' },
  },

  brightening: {
    budget: [
      { name: 'The INKEY List Tranexamic Acid', price: '$10-14', note: 'Excellent for PIH. Tranexamic acid at effective concentration. Great for Fitzpatrick IV-VI.' },
      { name: 'Good Molecules Discoloration Correcting Serum', price: '$12', note: 'Tranexamic acid, niacinamide, kojic acid — comprehensive brightening at very low cost' },
    ],
    mid: { name: 'Paula\'s Choice 10% Azelaic Acid Booster', price: '$36-42', note: 'Azelaic acid at clinical concentration — excellent for PIH, rosacea, and general brightening' },
    luxury: { name: 'SkinCeuticals Discoloration Defense', price: '$98-112', note: 'Tranexamic acid, kojic acid, niacinamide — premium brightening serum, strong clinical support' },
    community_note: 'For South Asian, Arab, Black/West African, Caribbean, and East African communities dealing with significant PIH, budget brightening options (tranexamic acid, niacinamide, kojic acid) are genuinely effective — you do not need luxury pricing for good results.',
  },

  hydration: {
    budget: { name: 'The Ordinary Hyaluronic Acid 2% + B5', price: '$7-9', note: 'Multiple molecular weights of HA for layered hydration. Excellent value.' },
    mid: { name: 'Neutrogena Hydro Boost Serum', price: '$25-30', note: 'Hyaluronic acid serum, accessible, well-formulated' },
    luxury: { name: 'Drunk Elephant B-Hydra Intensive Hydration Serum', price: '$49', note: 'Hyaluronic acid, vitamin B5, pineapple ceramide — good clean formulation' },
  },
};

// ─── SPF BY BUDGET ────────────────────────────────────────────────────────────

export const SPF_BY_BUDGET = {
  challenge_for_dark_skin: 'The SPF challenge for Fitzpatrick IV-VI is white cast from mineral (zinc oxide, titanium dioxide) sunscreens. Chemical sunscreens avoid white cast but some filters (benzophenone) can cause hormonal disruption. The best SPF for dark skin is one you WILL ACTUALLY USE consistently.',

  budget_no_white_cast: [
    { name: 'Black Girl Sunscreen SPF 30', price: '$15-18', why: 'Specifically formulated for dark skin. Zero white cast. Moisturising. Black-owned.', format: 'Lotion' },
    { name: 'Neutrogena Clear Face SPF 55', price: '$12-15', why: 'Chemical sunscreen, no white cast, oil-free, good for acne-prone dark skin', format: 'Fluid' },
    { name: 'La Roche-Posay Anthelios Mineral Ultra-Light SPF 50 (tinted)', price: '$36', why: 'Tinted mineral sunscreen, no white cast for medium-dark skin, very elegant texture', format: 'Tinted fluid' },
    { name: 'Biore UV Aqua Rich Watery Essence SPF 50+ (Asian formula)', price: '$10-15 (Asian grocery or Amazon)', why: 'The most popular chemical sunscreen globally for its extraordinary light texture. No white cast whatsoever. The gold standard for texture.', format: 'Essence' },
    { name: 'EltaMD UV Clear SPF 46', price: '$36-40', why: 'Niacinamide + zinc oxide, tinted option for medium-dark skin, dermatologist favourite', format: 'Fluid' },
  ],

  luxury: [
    { name: 'Supergoop! Unseen Sunscreen SPF 40', price: '$38', why: 'Chemical filter, truly invisible finish, excellent for deep skin under makeup', format: 'Gel' },
    { name: 'Tatcha The Silk Sunscreen SPF 50', price: '$55', why: 'Elegant Japanese-style sunscreen, no white cast, contains skincare actives', format: 'Fluid' },
  ],
};

// ─── MAKEUP BY BUDGET ─────────────────────────────────────────────────────────

export const MAKEUP_BY_BUDGET = {
  foundation: {
    budget: [
      { name: 'L\'Oréal True Match Super-Blendable Foundation', price: '$10-14', why: 'Good shade range including deep skin tones, matches undertones well', range: 'N45-W60 for deepest shades' },
      { name: 'e.l.f. Halo Glow Liquid Filter', price: '$14', why: 'Skin tint with glow, buildable coverage, surprisingly excellent shade range', note: 'Dupe for Charlotte Tilbury Hollywood Flawless Filter' },
      { name: 'NYX Professional Can\'t Stop Won\'t Stop', price: '$15-18', why: 'Full coverage, good dark shade range, long-wearing' },
      { name: 'Revlon ColorStay (for combo/oily)', price: '$10-15', why: 'Classic drugstore foundation with decent deep shade coverage' },
    ],
    mid_range: [
      { name: 'Fenty Beauty Pro Filt\'r Soft Matte Foundation', price: '$38', why: 'Rihanna built this specifically with 40 shades for deep skin. W180 through W180 for very deep skin. Changed the industry.', note: 'The standard for inclusive foundation' },
      { name: 'MAC Studio Fix Fluid SPF 15', price: '$38-42', why: 'Professional standard, excellent deep shade range, buildable coverage' },
    ],
    luxury: [
      { name: 'Giorgio Armani Luminous Silk Foundation', price: '$64-70', why: 'The most-hyped foundation in beauty. Silky texture, beautiful finish, good depth range.' },
      { name: 'NARS Natural Radiant Longwear Foundation', price: '$50-56', why: 'Excellent deep skin shades, natural finish, long-wearing' },
    ],
  },

  concealer: {
    budget: [
      { name: 'e.l.f. 16Hr Camo Concealer', price: '$8-10', why: 'Full coverage, excellent warm deep shades, long-wearing', note: 'Consistently rated best drugstore concealer' },
      { name: 'L.A. Girl Pro Conceal', price: '$5-7', why: 'Good deep warm shades, available in beauty supply stores popular in Black communities', for_community: 'Black American community staple' },
    ],
    mid_range: [
      { name: 'Fenty Beauty Pro Filt\'r Concealer', price: '$26', why: 'Excellent deep shade range, full coverage' },
      { name: 'NARS Creamy Concealer', price: '$30', why: 'Good deep shade range, beautiful finish, excellent for under-eye' },
    ],
    luxury: { name: 'Charlotte Tilbury Magic Away Liquid Concealer', price: '$35', why: 'Beloved for its texture, good deep shade range' },
  },

  lip: {
    budget: [
      { name: 'NYX Soft Matte Lip Cream', price: '$7-9', why: 'Dark, rich shades for deep skin — Transylvania (deep plum), Addis Ababa (true red), many more', note: 'Deep plum and wine shades in this range are excellent on deep skin tones' },
      { name: 'ColourPop Lux Liquid Lip', price: '$8-10', why: 'Great deep skin shades online, affordable, various finishes' },
    ],
    mid_range: [
      { name: 'MAC Retro Matte Lipstick', price: '$22', why: 'Professional quality, incredible deep shade range. Diva (deep red), Antique Velvet (dark brown-rose), Ruby Woo (classic red).' },
      { name: 'Fenty Beauty Stunna Lip Paint', price: '$25', why: 'Longwear liquid lip, developed to look stunning on deep skin' },
    ],
  },

  highlighter: {
    note: 'Highlighter for deep skin needs to show up — pale champagne or white highlighters disappear. Go for gold, bronze, and copper.',
    budget: [
      { name: 'NYX Highlight & Contour Pro Palette', price: '$14', why: 'Multiple warm and cool highlighters at budget price' },
      { name: 'Wet n Wild MegaGlo Highlighting Bar — Caramel Gleam', price: '$8', why: 'Gold-bronze, beautiful on deep skin at incredible price' },
    ],
    mid_range: [
      { name: 'Juvia\'s Place I Am Magic Palette', price: '$30-35', why: 'Black-owned brand, African-inspired colours, highlighters designed for deep skin' },
      { name: 'Fenty Beauty Diamond Bomb', price: '$35-38', why: 'Various shades including deep gold and bronze for deeper skin' },
    ],
  },
};

// ─── FREE AND DIY BEAUTY ──────────────────────────────────────────────────────

export const FREE_AND_DIY_BEAUTY = {
  ice_therapy: {
    cost: 'Free',
    use: 'Ice cube wrapped in thin cloth: reduces puffiness, shrinks appearance of pores temporarily, soothes inflammation, reduces PIH triggering after extractions',
  },
  cold_water: {
    cost: 'Free',
    use: 'Finish shower with cold water rinse for body — same circulation and pore-appearance benefits as cold roller',
  },
  head_massage: {
    cost: 'Free',
    use: 'Daily 4-minute scalp massage has clinical evidence for increasing hair thickness over 24 weeks. No product required.',
  },
  green_tea_bags: {
    cost: '$3-5 for many treatments',
    use: 'Brew green tea, cool the bags in refrigerator. Apply to under-eye area for 10-15 minutes — tannins reduce puffiness, caffeine reduces vascular appearance.',
  },
  yoghurt_face_mask: {
    cost: '$3-5 per tub (many treatments)',
    use: 'Plain natural yoghurt contains lactic acid. Apply to clean face, leave 10-15 minutes, rinse. Gentle brightening and exfoliation effect. The oldest chemical peel.',
    for_ethnic_skin: 'Very safe for all skin tones, minimal PIH risk. Cultural tradition in South Asia, Mediterranean, North Africa.',
  },
  oat_milk: {
    cost: '$3-4 per treatment',
    use: 'Soak oats, strain liquid. Apply colloidal oatmeal water to skin — powerful anti-inflammatory for eczema, redness, sensitivity.',
  },
  green_tea_toner: {
    cost: '$4-5 for many treatments',
    use: 'Brew strong green tea, cool completely. Apply to face with cotton pad as toner. EGCG (epigallocatechin gallate) is a powerful antioxidant and anti-inflammatory.',
  },
  rice_water: {
    cost: 'Free/minimal (from cooking rice)',
    use: 'Fermented rice water for hair — see fermented ingredients module. Real science (inositol) behind the traditional practice.',
  },
};

// ─── GLOBAL AFFORDABLE BEAUTY ─────────────────────────────────────────────────

export const GLOBAL_AFFORDABLE_BEAUTY = {
  korean_drugstore: {
    note: 'Korean drugstore brands (Innisfree, Etude House, Holika Holika, TonyMoly) offer excellent quality skincare at mid-range prices. Available globally through online retailers or Korean grocery stores.',
    top_picks: [
      'Innisfree Green Tea Balancing Cream — excellent hydration, good for oily skin',
      'COSRX products — pharmaceutical-grade active skincare at accessible prices',
      'Etude House Moistfull Collagen Cream — excellent anti-aging for the price',
    ],
  },
  indian_brands: {
    note: 'Domestic Indian brands are excellent value and often formulated for South Asian skin types and concerns',
    top_picks: [
      'Minimalist (India) — similar to The Ordinary, excellent actives at affordable prices, widely available',
      'Biotique — Ayurvedic formulations at accessible prices',
      'Himalaya — widely available globally, good basic skincare range',
      'WOW Skin Science — good budget option, available globally',
    ],
  },
  west_african_and_black_owned: {
    note: 'Supporting Black-owned and West African brands maintains community wealth while accessing formulations designed for the skin',
    brands: [
      'Ami Colé — makeup specifically for melanin-rich skin',
      'UOMA Beauty — high performance and inclusive',
      'Black Girl Sunscreen — affordable SPF for dark skin',
      'Juvia\'s Place — affordable makeup celebrating African heritage',
      'Sienna Naturals — clean hair care for natural hair',
    ],
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getBudgetRecommendations(category, budget) {
  const budgetMap = { cleanser: CLEANSER_BY_BUDGET, moisturiser: MOISTURISER_BY_BUDGET, spf: SPF_BY_BUDGET, makeup: MAKEUP_BY_BUDGET };
  const catData = budgetMap[category];
  if (!catData) return null;
  if (budget === 'budget') return catData.budget;
  if (budget === 'luxury') return catData.luxury;
  return catData;
}

export function getDIYBeauty() {
  return FREE_AND_DIY_BEAUTY;
}

export function getBudgetPhilosophy() {
  return BUDGET_PHILOSOPHY;
}

export function getAffordableAlternatives(communityId) {
  const globalBrands = GLOBAL_AFFORDABLE_BEAUTY;
  const communityMap = {
    'south-asian': globalBrands.indian_brands,
    'east-asian': globalBrands.korean_drugstore,
    'west-african': globalBrands.west_african_and_black_owned,
    'black-american': globalBrands.west_african_and_black_owned,
    'east-african': globalBrands.west_african_and_black_owned,
  };
  return communityMap[communityId] || { note: 'Check the global affordable beauty section for recommendations across all communities' };
}

export const BUDGET_GUIDE_STATS = {
  categoriesCovered: 5,
  diyOptions: Object.keys(FREE_AND_DIY_BEAUTY).length,
  blackOwnedBrandsHighlighted: GLOBAL_AFFORDABLE_BEAUTY.west_african_and_black_owned.brands.length,
};
