/**
 * MIRRR Beauty Ingredient Safety Guide
 * Ingredients to avoid, ingredients to embrace
 * Special focus on ingredients that disproportionately harm melanin-rich skin
 */

// ─── INGREDIENTS TO AVOID ─────────────────────────────────────────────────────

export const INGREDIENTS_TO_AVOID = {
  hydroquinone: {
    name: 'Hydroquinone',
    commonIn: 'Skin-lightening creams, dark spot treatments, brightening serums',
    concern: 'Long-term use (12+ months) can cause ochronosis — a permanent bluish-black skin discolouration, especially documented in darker skin tones in Africa and among African-descent populations globally.',
    regulatoryStatus: {
      EU: 'BANNED in cosmetics',
      USA: 'FDA currently restricting over-the-counter use (proposed rule 2020); prescription concentration still allowed',
      Africa: 'Many African countries ban over-the-counter; still widely sold illegally',
      UK: 'Restricted — only prescription',
    },
    risk: 'HIGH for prolonged use — particularly for Fitzpatrick IV-VI',
    safer_alternatives: ['Niacinamide', 'Alpha-arbutin', 'Kojic acid', 'Tranexamic acid', 'Vitamin C', 'Azelaic acid'],
    ifYouMustUse: 'Only under dermatologist supervision. Maximum 12 weeks. Take 3-month breaks between courses. Mandatory SPF use.',
  },
  mercury: {
    name: 'Mercury / Mercurous Chloride / Calomel / Mercuric',
    commonIn: 'Skin-lightening soaps and creams (particularly from parts of West Africa, Southeast Asia, Latin America)',
    concern: 'Mercury is a neurotoxin. Causes kidney damage, neurological damage, skin damage, and can harm unborn children and breastfed infants.',
    regulatoryStatus: {
      worldwide: 'BANNED in cosmetics in most regulated markets',
      reality: 'Still present in unregulated products sold in grey markets, multicultural beauty shops, and online',
    },
    risk: 'SEVERE — neurotoxic and nephrotoxic at low concentrations',
    identification: 'Appears on labels as: Mercury, Mercurous chloride, Calomel, Mercuric, Mercurio',
    action: 'If you suspect a product contains mercury, stop use immediately and report to your country\'s health regulator.',
  },
  parabens: {
    name: 'Parabens (methylparaben, propylparaben, butylparaben, ethylparaben)',
    commonIn: 'Shampoo, conditioner, lotion, foundation, mascara, deodorant',
    concern: 'Weak oestrogen mimics (endocrine disruptors). Studies show parabens concentrate in breast tissue. Association with breast cancer is studied but not conclusive.',
    risk: 'MODERATE — caution warranted especially given disproportionate breast cancer burden in Black women',
    note: 'Black women are diagnosed with breast cancer at younger ages and with more aggressive subtypes. While the paraben-breast cancer link is not proven, precautionary principle is reasonable.',
    safer_alternatives: ['Phenoxyethanol', 'Sodium benzoate', 'Potassium sorbate', 'Ethylhexylglycerin'],
  },
  formaldehyde_releasers: {
    name: 'Formaldehyde & Formaldehyde-Releasing Preservatives',
    compounds: ['DMDM Hydantoin', 'Quaternium-15', 'Imidazolidinyl Urea', 'Diazolidinyl Urea', 'Sodium Hydroxymethylglycinate'],
    commonIn: 'Shampoos, conditioners — particularly some cheaper formulations',
    concern: 'Formaldehyde is a known human carcinogen (Group 1 — IARC). Formaldehyde-releasing preservatives slowly release formaldehyde.',
    hotspot: 'Black hair care: in 2023, NIEHS study (Sister Study) found hair straightening products containing formaldehyde-releasers associated with increased uterine cancer risk. The effect was larger for Black women who use these products more frequently.',
    risk: 'HIGH for frequent users of relaxers/straighteners containing these compounds',
    action: 'Check your relaxer and hair care ingredients lists for formaldehyde-releasing preservatives.',
  },
  paraphenylenediamine: {
    name: 'PPD (Paraphenylenediamine)',
    commonIn: 'Hair dyes (dark brown and black), black henna temporary tattoos',
    concern: 'Common contact allergen. Can cause severe allergic reaction (ranging from contact dermatitis to anaphylaxis). Sensitisation builds over time — each exposure increases reaction severity.',
    forEthnicSkin: 'Widely used in South Asian and Middle Eastern dark hair colouring, and in "black henna" temporary tattoos popular at tourist sites and cultural events.',
    action: [
      'NEVER use black henna temporary tattoos — they contain high concentrations of PPD',
      'Patch test any dark hair dye 48 hours before first use and before every use after a break',
      'Alternatives: henna (real, not black), semi-permanent dyes (no PPD), vegetable-based dyes',
    ],
    risk: 'HIGH for sensitised individuals; SEVERE risk of anaphylaxis in those already sensitised',
  },
  sodium_lauryl_sulfate: {
    name: 'SLS / Sodium Lauryl Sulfate',
    commonIn: 'Shampoos, facial cleansers, body wash',
    concern: 'Harsh surfactant. Strips protective lipids from skin and scalp. Can disrupt skin microbiome and irritate mucous membranes.',
    forEthnicHair: 'Particularly damaging for natural Afro-textured hair and dry scalp — strips the limited natural sebum that barely reaches coil ends',
    forEthnicSkin: 'Disrupts skin barrier (see skin_barrier_guide.js) — especially relevant for already ceramide-depleted darker skin',
    safer_alternatives: ['Sodium Laureth Sulfate (SLES — gentler)', 'Decyl Glucoside', 'Coco-Glucoside', 'Sodium Cocoyl Isethionate (SCI)'],
    note: 'SLS-free shampoos are non-negotiable for Type 4 natural hair',
  },
  alcohol_denat: {
    name: 'Alcohol Denat / SD Alcohol / Isopropyl Alcohol',
    commonIn: 'Toners, astringents, setting sprays, hairsprays, gel formulas',
    concern: 'Drying and barrier-disrupting. Short-term sensation of tightening is barrier damage, not astringency.',
    exception: 'Small amounts in leave-on products (as a penetration enhancer) differ from alcohol as a primary ingredient in a toner.',
    identifyProblematic: 'Problem = alcohol appears in first 5 ingredients. Safe = alcohol appears near bottom of list.',
    alternative: 'Rose water, witch hazel (low alcohol formulations), glycerin-based toners',
  },
  mineral_oil: {
    name: 'Mineral Oil / Petrolatum (nuanced)',
    commonIn: 'Baby oil, hair grease, many body lotions, some lip balms',
    concern: 'When non-cosmetic grade mineral oil is used: potentially contaminated with PAHs (polycyclic aromatic hydrocarbons, some carcinogenic)',
    nuance: 'COSMETIC GRADE petrolatum/mineral oil is considered safe and is in Vaseline, CeraVe Healing Ointment, and Aquaphor. The risk is with industrial-grade or impure mineral oils used in cheap products.',
    forEthnicHair: 'Heavy mineral oils in greases (Blue Magic, etc.) can block moisture absorption for natural hair textures — they seal the shaft without penetrating',
    recommendation: 'Use cosmetic-grade petrolatum for barrier repair (Vaseline). Avoid heavy mineral-oil greases on natural Afro-textured hair.',
  },
  talc: {
    name: 'Talc',
    commonIn: 'Baby powder, setting powder, eyeshadow, blush, bronzer',
    concern: 'Talc can be contaminated with asbestos in mines where talc and asbestos-containing minerals are found together. Contested area — some talc is asbestos-free.',
    risk: 'Inhalation risk is the primary concern — particularly for babies (never use near infant airways)',
    regulatoryStatus: 'FDA issued a proposed rule (2022) requiring asbestos testing of cosmetic talc products',
    alternatives: 'Corn starch, tapioca starch, arrowroot powder, rice powder (in Asian beauty), mica',
    note: 'Many brands have voluntarily moved away from talc. Look for "talc-free" if this is a concern.',
  },
  oxybenzone: {
    name: 'Oxybenzone',
    commonIn: 'Chemical sunscreens',
    concerns: ['Potential endocrine disruptor', 'Coral reef bleaching (banned in Hawaii)', 'Can penetrate skin and reach bloodstream', 'Possible photoallergen'],
    risk: 'MODERATE — FDA has asked for more safety data; not banned in US; EU allows with restrictions',
    safer_chemical_alternatives: ['Avobenzone (UVA)', 'Octinoxate', 'Homosalate', 'Octisalate', 'Octocrylene'],
    note: 'Especially relevant for Fitzpatrick V-VI who need chemical SPF (no white cast) but want to avoid oxybenzone',
  },
};

// ─── INGREDIENTS TO EMBRACE ───────────────────────────────────────────────────

export const INGREDIENTS_TO_EMBRACE = {
  niacinamide: {
    name: 'Niacinamide (Vitamin B3)',
    why: 'The most versatile ingredient in skincare — especially for melanin-rich skin',
    benefits: [
      'Fades post-inflammatory hyperpigmentation (PIH) — reduces melanin transfer to surface',
      'Strengthens skin barrier by stimulating ceramide production',
      'Regulates sebum (reduces oily shine)',
      'Minimises pore appearance',
      'Anti-inflammatory',
      'Anti-glycation (prevents collagen stiffening)',
    ],
    concentration: '5% daily; 10% for targeted PIH treatment',
    stability: 'Very stable — works with almost all other ingredients',
    pairsWith: 'Everything: retinol, acids, SPF, Vitamin C',
    avoid: 'Old concern about niacinamide + Vitamin C interaction is a myth — both together are fine at room temperature',
    picks: [
      { name: 'The Ordinary Niacinamide 10% + Zinc 1%', price: '$7', fitzpatrick: 'All types' },
      { name: 'Paula\'s Choice 10% Niacinamide Booster', price: '$44', fitzpatrick: 'All types; luxury pick' },
      { name: 'Naturium Niacinamide Serum 12% Plus Zinc 2%', price: '$20', fitzpatrick: 'All types; great for oily/combo' },
    ],
  },
  alpha_arbutin: {
    name: 'Alpha-Arbutin',
    what: 'A glycosylated form of hydroquinone (derived from bearberry plant) — all the brightening, without the risks',
    why: 'The SAFE version of hydroquinone-like brightening. Inhibits tyrosinase (the enzyme that produces melanin) without the risk of ochronosis.',
    concentration: '1–2% effective; 2% is the sweet spot for cosmetics',
    stability: 'Can degrade over time; keep products away from light and heat',
    pairsWith: 'Vitamin C (enhances effect), Niacinamide, Tranexamic acid',
    forPIH: 'Excellent targeted treatment for PIH — safe for long-term daily use',
    picks: [
      { name: 'The Ordinary Alpha Arbutin 2% + HA', price: '$12' },
      { name: 'COSRX Advanced Snail 92 All In One Cream (contains arbutin)', price: '$25' },
    ],
  },
  tranexamic_acid: {
    name: 'Tranexamic Acid',
    what: 'A lysine derivative that inhibits multiple steps of pigmentation formation',
    why: 'Increasingly recognised as one of the most effective melasma and PIH treatments — used clinically (oral) and topically',
    concentration: '2–5% in skincare',
    clinicalBacking: 'Strong clinical evidence for melasma treatment; emerging evidence for post-inflammatory hyperpigmentation',
    forMelaninSkin: 'Specifically effective for the melasma that disproportionately affects South Asian, Arab, and Latina women',
    stability: 'Highly stable — doesn\'t degrade like Vitamin C',
    picks: [
      { name: 'Good Molecules Discoloration Correcting Serum', price: '$12' },
      { name: 'Naturium Tranexamic Topical Acid 5%', price: '$20' },
      { name: 'Paula\'s Choice 10% Azelaic Acid Booster (contains TA)', price: '$38' },
    ],
  },
  azelaic_acid: {
    name: 'Azelaic Acid',
    what: 'A naturally occurring dicarboxylic acid (found in wheat, rye, barley) with broad-spectrum benefits',
    benefits: [
      'Dual brightening and anti-inflammatory',
      'One of few ingredients safe during pregnancy',
      'Anti-bacterial (acne treatment)',
      'Rosacea treatment (20% concentration by prescription)',
      'Tyrosinase inhibitor (anti-PIH)',
      'Normalises keratin production (anti-comedogenic)',
    ],
    concentration: '10% over-the-counter (The Ordinary, Paula\'s Choice); 15-20% prescription',
    safety: 'One of the safest actives for all skin types, including pregnancy and breastfeeding',
    texture: 'Can feel gritty at higher concentrations (15-20%) — normal, not a sign of poor formulation',
    picks: [
      { name: 'The Ordinary Azelaic Acid Suspension 10%', price: '$13' },
      { name: 'Paula\'s Choice 10% Azelaic Acid Booster', price: '$38' },
      { name: 'Cos De Baha Azelaic Acid 10% Gel Serum', price: '$18' },
    ],
  },
  vitamin_c: {
    name: 'Vitamin C (L-Ascorbic Acid and Derivatives)',
    benefits: ['Brightening and anti-PIH', 'Antioxidant protection (blocks free radicals from UV/pollution)', 'Collagen synthesis stimulation', 'Synergistic with SPF (boosts photoprotection)'],
    forms: {
      l_ascorbic_acid: { name: 'L-Ascorbic Acid', potency: 'Most potent', stability: 'Least stable (oxidises easily)', concentration: '10–20%', pH: 'Must be pH 3.5 or below to be effective', skin_note: 'Can sting on sensitive or compromised barriers' },
      ascorbyl_glucoside: { name: 'Ascorbyl Glucoside', potency: 'Moderate', stability: 'Very stable', note: 'Good for sensitive skin; gentler and highly stable' },
      sodium_ascorbyl_phosphate: { name: 'Sodium Ascorbyl Phosphate (SAP)', potency: 'Moderate', stability: 'Stable', note: 'Water-soluble; works well in serums; less irritating than L-AA' },
      ascorbyl_tetraisopalmitate: { name: 'Ascorbyl Tetraisopalmitate', potency: 'Moderate-High', stability: 'Very stable', note: 'Oil-soluble; penetrates deeply; works in water-free formulas' },
    },
    storage: 'Keep Vitamin C (especially L-ascorbic acid) refrigerated and away from light',
    picks: [
      { name: 'Timeless Vitamin C 20% + E + Ferulic Acid Serum', price: '$25', note: 'Cult dupe for $180 SkinCeuticals CE Ferulic' },
      { name: 'Naturium Vitamin C Complex Serum 22%', price: '$22' },
      { name: 'The Ordinary Ascorbyl Glucoside Solution 12%', price: '$12', note: 'Stable, gentle version' },
    ],
  },
  ceramides: {
    name: 'Ceramides',
    what: 'Lipid molecules that naturally form the mortar of the skin barrier. Supplementing with topical ceramides directly rebuilds the barrier.',
    types: ['Ceramide 1 (EOP)', 'Ceramide 3 (NP)', 'Ceramide 6-II (AP)'],
    why_critical_for_darker_skin: 'Melanin-rich skin has lower baseline ceramide content — see skin_barrier_guide.js. Direct ceramide supplementation more important, not less.',
    picks: [
      { name: 'CeraVe Moisturising Cream', price: '$20', note: 'Gold standard; 3 ceramides + MVE technology' },
      { name: 'Dr. Jart+ Ceramidin Cream', price: '$48', note: 'K-beauty premium ceramide' },
      { name: 'Kiehl\'s Ultra Facial Cream', price: '$40', note: 'Contains squalane and ceramides' },
    ],
  },
  bakuchiol: {
    name: 'Bakuchiol',
    origin: 'Psoralea corylifolia (Babchi plant) — used in Ayurvedic medicine for skin conditions',
    what: 'Plant-based functional analog to retinol — achieves similar collagen-stimulating and brightening effects via different mechanism with dramatically less irritation',
    benefits: ['Collagen stimulation', 'Fine line reduction', 'Skin brightening', 'Anti-bacterial', 'Anti-inflammatory — opposite of retinol\'s irritation profile'],
    safe_for: 'All skin types including sensitive skin; currently considered safe during pregnancy (unlike retinol); all Fitzpatrick types',
    comparison: 'Multiple clinical studies show comparable efficacy to 0.5% retinol with dramatically fewer side effects',
    picks: [
      { name: 'Biossance Squalane + Phyto-Retinol Serum', price: '$72', note: 'Bakuchiol + squalane = luxury barrier-friendly formulation' },
      { name: 'Herbivore Bakuchiol Retinol Alternative Serum', price: '$54' },
      { name: 'The Inkey List Bakuchiol Serum', price: '$15', note: 'Budget entry point' },
    ],
    for_south_asian: 'Has roots in Ayurvedic medicine — culturally resonant ingredient for South Asian consumers',
  },
};

// ─── INGREDIENT INTERACTIONS ──────────────────────────────────────────────────

export const INGREDIENT_INTERACTIONS = {
  safe_combinations: [
    { a: 'Niacinamide', b: 'Vitamin C', note: 'Despite the old myth, these can be used together. No nicotinic acid flushing at cosmetic temperatures.' },
    { a: 'Niacinamide', b: 'Hyaluronic Acid', note: 'Perfect pairing — barrier support + hydration' },
    { a: 'Niacinamide', b: 'Retinol', note: 'Niacinamide soothes retinol irritation — use together' },
    { a: 'Vitamin C', b: 'Vitamin E + Ferulic Acid', note: 'Synergistic triple antioxidant — the gold-standard antioxidant combination' },
    { a: 'AHA/BHA', b: 'Niacinamide', note: 'Use niacinamide after acid treatment to soothe and repair' },
    { a: 'Ceramides', b: 'Anything', note: 'Ceramides are universal — pair with everything' },
    { a: 'SPF', b: 'Antioxidants', note: 'Antioxidants boost photoprotection of SPF — use together always' },
  ],
  use_separately: [
    { a: 'Retinol', b: 'Acids (AHA/BHA)', reason: 'Both irritating; together = high irritation and barrier damage. Use retinol PM, acids on alternating nights.' },
    { a: 'Retinol', b: 'Vitamin C (same time)', reason: 'Different optimal pH ranges. Apply Vitamin C AM, retinol PM.' },
    { a: 'Benzoyl Peroxide', b: 'Retinol', reason: 'BP oxidises retinol, making it ineffective. Use BP AM, retinol PM.' },
    { a: 'Benzoyl Peroxide', b: 'Vitamin C', reason: 'BP oxidises Vitamin C. Use on separate routines.' },
    { a: 'Two AHAs/BHAs simultaneously', reason: 'Don\'t layer multiple acids — over-exfoliation destroys barrier. One acid product per routine.' },
    { a: 'High-concentration Vitamin C', b: 'Niacinamide (different pH)', reason: 'L-ascorbic acid needs pH 3.5; niacinamide needs pH 5-7. Applying consecutively neutralises. Wait 15–30 min between, or use different forms of Vitamin C.' },
  ],
};

// ─── READING INGREDIENTS LABELS ───────────────────────────────────────────────

export const LABEL_READING_GUIDE = {
  ingci: {
    name: 'INCI (International Nomenclature Cosmetic Ingredient)',
    what: 'The globally standardised naming system for cosmetic ingredients. Ingredients appear in descending order of concentration in the formulation.',
    rules: [
      'First 5 ingredients = majority of the product by weight',
      'Below 1% concentration = order can be anything (often this is where fragrances, preservatives, active ingredients sit)',
      'Water (Aqua/Eau) first = water-based formula',
      'Oil first = anhydrous (oil-based) formula',
    ],
    tricks: {
      finding_actives: 'Don\'t be fooled by marketing. A trendy ingredient at position 25 of 30 is present at barely-detectable trace levels.',
      fragrance: '"Fragrance" or "Parfum" is a blanket term hiding up to 3,000 possible undisclosed chemical compounds. In the EU, 26 specific allergens must be listed if above threshold — look for these if fragrance-sensitive.',
    },
  },
  greenwashing: {
    name: 'Greenwashing Red Flags',
    flags: [
      '"Natural" is not a regulated term — it means nothing legally',
      '"Clean" has no legal definition in cosmetics',
      '"Dermatologist tested" just means a dermatologist looked at it — doesn\'t mean they approved it',
      '"Hypoallergenic" has no legal definition',
      '"Non-comedogenic" is self-reported — not tested or regulated',
      '"Organic" DOES mean something if certified (USDA Organic, COSMOS Organic, Ecocert)',
      '"Cruelty-free" is meaningful when certified (Leaping Bunny, PETA, Choose Cruelty Free)',
    ],
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getIngredientSafetyProfile(ingredientName) {
  const name = ingredientName.toLowerCase().replace(/\s/g, '_');
  return INGREDIENTS_TO_AVOID[name] || INGREDIENTS_TO_EMBRACE[name] || null;
}

export function getIngredientsForCommunity(communityId) {
  const priorityIngredients = {
    'west-african': ['niacinamide', 'ceramides', 'alpha_arbutin'],
    'east-african': ['niacinamide', 'azelaic_acid', 'ceramides'],
    'south-african': ['niacinamide', 'ceramides', 'vitamin_c'],
    'black-american': ['niacinamide', 'tranexamic_acid', 'alpha_arbutin'],
    'south-asian': ['tranexamic_acid', 'bakuchiol', 'niacinamide'],
    'arab': ['tranexamic_acid', 'azelaic_acid', 'vitamin_c'],
    'latina': ['tranexamic_acid', 'niacinamide', 'azelaic_acid'],
    'caribbean': ['niacinamide', 'ceramides', 'alpha_arbutin'],
    'east-asian': ['ceramides', 'niacinamide', 'vitamin_c'],
  };
  const keys = priorityIngredients[communityId] || ['niacinamide', 'ceramides'];
  return keys.map(k => ({ key: k, ...INGREDIENTS_TO_EMBRACE[k] }));
}

export function getSafeInteractionGuide() {
  return INGREDIENT_INTERACTIONS;
}

export function getAvoidList() {
  return Object.values(INGREDIENTS_TO_AVOID);
}

export const INGREDIENT_SAFETY_STATS = {
  ingredientsToAvoid: Object.keys(INGREDIENTS_TO_AVOID).length,
  ingredientsToEmbrace: Object.keys(INGREDIENTS_TO_EMBRACE).length,
  safeCombo: INGREDIENT_INTERACTIONS.safe_combinations.length,
  unsafeCombo: INGREDIENT_INTERACTIONS.use_separately.length,
};
