/**
 * MIRRR Collagen Guide
 * Collagen science, types, loss, ingestibles, topicals,
 * and collagen-supporting ingredients for all ethnicities
 */

// ─── COLLAGEN SCIENCE OVERVIEW ────────────────────────────────────────────────

export const COLLAGEN_SCIENCE_OVERVIEW = {
  what_is_collagen: 'Collagen is the most abundant protein in the human body, accounting for roughly one-third of total protein content. It is the structural scaffold of skin, bones, tendons, cartilage, and blood vessels.',
  structure: {
    triple_helix: 'Collagen molecules consist of three polypeptide chains wound around each other in a tight triple helix — one of the strongest structural configurations in biology.',
    fibrils: 'Collagen molecules pack together to form fibrils, which bundle into fibres. These fibres form a dense, interwoven network in the dermis (middle layer of skin).',
    cross_links: 'Collagen fibres are held together by cross-links (covalent bonds between chains). These cross-links give skin its tensile strength and resistance to stretching.',
  },
  collagen_in_skin: {
    layer: 'Collagen is produced by fibroblasts in the DERMIS — the middle layer of skin, beneath the epidermis.',
    proportion: 'Collagen makes up approximately 70-80% of the dry weight of the dermis.',
    function: 'Collagen provides firmness and structure to skin. Elastin (a different protein) provides the spring/bounce. Hyaluronic acid provides the cushioning and hydration. Together they give skin its plump, youthful appearance.',
  },
  production: 'Fibroblasts (specialist dermal cells) continuously synthesise collagen. Vitamin C is an essential cofactor — collagen cannot be synthesised without it. Copper is also required. Production peaks in the late teens/early twenties.',
};

// ─── COLLAGEN TYPES ───────────────────────────────────────────────────────────

export const COLLAGEN_TYPES = {
  type_1: {
    type: 'Type I',
    abundance: 'Most abundant — makes up 80-90% of skin collagen',
    function: 'Tensile strength, structure, and firmness. The collagen of scars, tendons, and bones. Gives skin its taughtness.',
    in_beauty: 'Most collagen supplements and topical products target Type I collagen.',
  },
  type_2: {
    type: 'Type II',
    abundance: 'Less common in skin',
    function: 'Primary component of cartilage. Less relevant to skin beauty.',
    in_beauty: 'Found in joint-focused collagen supplements.',
  },
  type_3: {
    type: 'Type III',
    abundance: 'Significant component — often found alongside Type I',
    function: 'Provides elasticity and flexibility. Abundant in blood vessels, muscles, and foetal skin. Young skin has more Type III; it decreases with age.',
    in_beauty: 'Targeted by the same ingredients that boost Type I.',
  },
  type_4: {
    type: 'Type IV',
    abundance: 'Less abundant but critical',
    function: 'Forms the basement membrane (the structural interface between the epidermis and dermis). Critical for skin architecture.',
    in_beauty: 'Retinoids support Type IV collagen maintenance.',
  },
  type_5: {
    type: 'Type V',
    abundance: 'Minor component',
    function: 'Regulates the formation of Type I and III fibres. Important for hair and the placenta.',
    in_beauty: 'Found in multi-type collagen supplements.',
  },
};

// ─── COLLAGEN LOSS ────────────────────────────────────────────────────────────

export const COLLAGEN_LOSS = {
  natural_aging: {
    rate: 'From approximately age 25, the body produces approximately 1-1.5% less collagen per year.',
    menopause: 'In the first 5 years post-menopause, women lose approximately 30% of skin collagen due to declining oestrogen. Oestrogen receptors in fibroblasts directly regulate collagen synthesis.',
    visible_signs: 'Fine lines and wrinkles (loss of structural support), skin laxity (loss of firmness), hollowing under the eyes and cheeks (loss of collagen scaffold), thinning skin.',
  },
  accelerated_loss: {
    uv: 'UV radiation is the LARGEST accelerator of collagen loss. UV activates matrix metalloproteinases (MMPs) — enzymes that break down collagen. UV also directly damages fibroblasts, reducing their ability to synthesise new collagen. SPF is the single most important anti-aging measure.',
    smoking: 'Smoking dramatically accelerates collagen breakdown. Nicotine constricts blood vessels, reducing oxygen and nutrient delivery to fibroblasts. Cigarette chemicals directly damage collagen fibres.',
    sugar: 'High blood sugar triggers glycation — glucose molecules attach to collagen fibres, making them stiff and brittle. Glycated collagen cannot be repaired and is associated with premature aging.',
    inflammation: 'Chronic inflammation (from skin conditions, diet, stress) activates MMPs. Anti-inflammatory diet and lifestyle protect collagen.',
    pollution: 'Particulate matter and ozone damage collagen via free radical generation. Urban skin ages faster.',
    sleep_deprivation: 'During deep sleep, growth hormone is released — a key collagen synthesis signal. Poor sleep reduces growth hormone and elevates cortisol (which breaks down collagen).',
  },
  fitzpatrick_note: 'Fitzpatrick V-VI skin has a thicker dermis, higher natural melanin (which blocks some UV), and lower incidence of photoaging compared to Fitzpatrick I-II. However, this does NOT mean darker skin is immune to collagen loss — UV protection, smoking cessation, and anti-inflammatory habits are important across all skin tones.',
};

// ─── TOPICAL COLLAGEN ─────────────────────────────────────────────────────────

export const TOPICAL_COLLAGEN_GUIDE = {
  can_topicals_work: {
    question: 'Can topical collagen products rebuild skin collagen?',
    short_answer: 'Not by penetrating the skin as intact collagen. However, ingredients that STIMULATE collagen production or protect existing collagen are highly effective.',
    explanation: 'Collagen molecules are too large to penetrate the skin barrier and reach the dermis where fibroblasts live. Topically applied collagen sits on the skin surface and acts as a temporary moisturising film — beneficial for barrier function but not collagen synthesis.',
    what_works: 'Ingredients that signal fibroblasts to produce more collagen (retinoids, vitamin C, copper peptides, growth factors), that protect collagen from breakdown (antioxidants blocking UV free radicals, SPF preventing UV-activated MMPs), or that fill in the appearance of volume loss temporarily (hyaluronic acid).',
  },
  effective_topical_ingredients: {
    retinoids: {
      ingredient: 'Retinoids (Retinol, Tretinoin, Retinaldehyde)',
      mechanism: 'Retinoids bind to nuclear receptors in fibroblasts, directly upregulating collagen gene transcription. Also reduce MMP activity, slowing collagen breakdown. The most evidence-backed topical collagen stimulants.',
      evidence: 'Tretinoin (prescription) has the most clinical evidence — measurable increases in collagen density within 3-6 months of consistent use.',
      start: 'Start with retinol 0.025-0.1% (OTC), 2-3x per week. Tretinoin requires a prescription.',
      caution: 'Irritating initially. Not for use during pregnancy. PIH risk in Fitzpatrick IV-VI with initial irritation — introduce very slowly.',
    },
    vitamin_c: {
      ingredient: 'Vitamin C (L-ascorbic acid and derivatives)',
      mechanism: 'Essential cofactor for collagen synthesis enzymes (prolyl hydroxylase and lysyl hydroxylase). Without vitamin C, collagen cannot be properly cross-linked and stabilised. Also a powerful antioxidant protecting against UV free radical collagen damage.',
      best_form: 'L-ascorbic acid 10-20% (most potent but least stable). Sodium ascorbyl phosphate (more stable, gentler). Ascorbyl glucoside (very stable). Vitamin C esters (vitamin C + ferulic acid enhances stability and efficacy).',
      note: 'Vitamin C oxidises quickly. Store in dark bottle away from light and heat. Discard if turns orange-brown.',
    },
    copper_peptides: {
      ingredient: 'Copper Peptides (GHK-Cu)',
      mechanism: 'Copper is a required mineral cofactor for lysyl oxidase — the enzyme that cross-links collagen and elastin fibres. GHK-Cu tripeptide has been shown in studies to stimulate collagen I, III, and IV synthesis and reduce MMP activity.',
      evidence: 'Growing clinical evidence. Less studied than retinoids but very promising.',
      texture: 'Often slightly blue-green in colour due to copper. Look for GHK-Cu on the ingredient list.',
    },
    growth_factors: {
      ingredient: 'Growth Factors (EGF, TGF-β)',
      mechanism: 'Epidermal Growth Factor and Transforming Growth Factor signal fibroblasts to produce collagen. Found in advanced serums.',
      source: 'Often derived from plant stem cells or lab-synthesised peptides (since human growth factors cannot be ethically sourced at scale).',
      evidence: 'Some evidence for topical benefit in wound healing; cosmetic collagen benefits still being studied.',
    },
    peptides: {
      ingredient: 'Collagen Peptides (topical)',
      mechanism: 'Short-chain peptides (dipeptides, tripeptides) can penetrate the skin barrier and signal fibroblasts to produce collagen — unlike full-length collagen molecules which are too large. Matrixyl (palmitoyl pentapeptide-4) is the most studied.',
      examples: 'Matrixyl 3000, Argireline (acetyl hexapeptide-3 — for expression lines), Syn-Coll.',
    },
    bakuchiol: {
      ingredient: 'Bakuchiol',
      mechanism: 'Plant-derived compound from the seeds of Psoralea corylifolia. Activates similar receptors to retinol, stimulating collagen production, with significantly less irritation.',
      best_for: 'Pregnancy-safe retinol alternative. Sensitive skin. Fitzpatrick IV-VI who experience irritation from retinol.',
      evidence: 'Several clinical studies show comparable benefits to retinol at 0.5% for fine lines and hyperpigmentation with fewer side effects.',
    },
    niacinamide: {
      ingredient: 'Niacinamide (Vitamin B3)',
      mechanism: 'Supports the skin barrier, reducing water loss that would otherwise compromise fibroblast function. Reduces inflammation, protecting collagen from inflammatory MMP attack. Some evidence for fibroblast stimulation at 5%+.',
      note: 'Multipurpose ingredient — also addresses pore size, sebum, PIH, and barrier function.',
    },
    spf: {
      ingredient: 'Broad-Spectrum SPF',
      mechanism: 'Not a collagen-builder, but the most protective ingredient for collagen. UV is the primary driver of collagen breakdown. SPF 30-50+ prevents MMP activation and fibroblast UV damage.',
      note: 'SPF worn daily from early adulthood is the single biggest investment in long-term collagen preservation.',
    },
  },
};

// ─── COLLAGEN SUPPLEMENTS ─────────────────────────────────────────────────────

export const COLLAGEN_SUPPLEMENTS = {
  overview: 'The collagen supplement market has exploded — powders, capsules, gummies, and drinks. The science is more promising than for topical collagen, but with important caveats.',
  how_ingestible_works: {
    digestion: 'When you eat collagen (whether in a supplement or in chicken skin or bone broth), it is digested into its component amino acids and peptides in the gut — just like any other protein. It does NOT go directly to the skin as collagen.',
    peptides: 'Hydrolysed collagen supplements are collagen that has been partially digested already (enzymatically broken into shorter peptides). These shorter peptides (di- and tripeptides containing hydroxyproline) are small enough to be absorbed into the bloodstream.',
    signalling: 'The theory: these hydroxyproline-containing peptides circulate in the blood and signal fibroblasts — "more collagen is being broken down, time to make more." Some research supports this signalling mechanism.',
  },
  evidence: {
    positive: 'Multiple randomised controlled trials (RCTs) have shown that 2.5-10g of hydrolysed collagen peptides daily for 8-12 weeks significantly improves skin hydration, elasticity, and measurably increases dermal collagen density versus placebo.',
    caveats: 'Many studies are industry-funded. Collagen is not a "complete" protein (low in tryptophan). The exact mechanism is still debated. Eating adequate total protein and ensuring sufficient vitamin C intake may achieve similar results.',
    bottom_line: 'Evidence is more positive than sceptics claim, but not as definitive as marketers claim. Supplementing 2.5-10g of hydrolysed collagen daily with vitamin C appears to offer meaningful skin benefits with minimal risk.',
  },
  types_of_supplements: {
    bovine: {
      type: 'Bovine (beef/cattle) collagen',
      types_present: 'Types I and III',
      best_for: 'Skin, hair, nails',
      source_note: 'Sourced from cattle hides and bones.',
    },
    marine: {
      type: 'Marine (fish) collagen',
      types_present: 'Primarily Type I',
      best_for: 'Skin',
      note: 'Smaller peptide size than bovine — some evidence of better absorption. More expensive.',
      sustainability: 'Sourced from fish scales and skin — a byproduct of the fishing industry, but sustainability varies by brand.',
    },
    chicken: {
      type: 'Chicken collagen',
      types_present: 'Type II (cartilage)',
      best_for: 'Joints rather than skin',
    },
    plant_based: {
      type: 'Plant-based "collagen"',
      what_it_is: 'No plant produces collagen — these are "collagen builders" or "collagen boosters" containing vitamin C, zinc, copper, and plant antioxidants that support the body\'s own collagen production.',
      for_whom: 'Vegans and vegetarians who cannot use animal-derived collagen.',
      evidence: 'Less direct evidence than hydrolysed collagen peptides, but ingredients like vitamin C are proven collagen synthesis cofactors.',
    },
  },
  how_to_take: {
    dose: '2.5-10g hydrolysed collagen peptides daily. Most studies use 2.5-5g.',
    vitamin_c: 'Take with vitamin C — it is required for collagen synthesis. A glass of orange juice or a vitamin C supplement with your collagen is ideal.',
    consistency: 'Benefits appear after 8-12 weeks of consistent daily use.',
    timing: 'No evidence that timing matters — take whenever is most convenient to maintain daily habit.',
    form: 'Collagen powder has most flexibility (add to coffee, smoothies, water). Capsules for travel convenience.',
  },
};

// ─── COLLAGEN-BOOSTING LIFESTYLE ──────────────────────────────────────────────

export const COLLAGEN_LIFESTYLE = {
  sleep: 'Deep sleep triggers growth hormone release — a primary collagen synthesis signal. 7-9 hours per night of quality sleep is a collagen-building behaviour.',
  stress_management: 'Chronic cortisol elevation breaks down collagen. Stress management (exercise, meditation, sleep) protects collagen.',
  diet: {
    protein: 'Adequate dietary protein provides the amino acid building blocks for collagen. Glycine, proline, and hydroxyproline are the key amino acids — found abundantly in meat, fish, eggs, and dairy.',
    vitamin_c: 'Vitamin C from food (citrus, bell peppers, broccoli, strawberries) is essential. Deficiency directly prevents collagen synthesis.',
    antioxidants: 'Antioxidant-rich diet (berries, leafy greens, tomatoes) protects collagen from free radical damage.',
    zinc_copper: 'Zinc (meat, seeds) and copper (shellfish, nuts, seeds) are cofactors for collagen cross-linking enzymes.',
    reduce_sugar: 'High sugar diet causes glycation of collagen fibres. Reducing refined sugar and high-GI foods protects collagen quality.',
    bone_broth: 'Traditional bone broth (simmered bones, cartilage) is a natural source of hydrolysed collagen and glycine — the science behind the cultural practice of consuming bone broth for health.',
  },
  exercise: 'Resistance training and high-intensity exercise increase IGF-1 and growth hormone, which stimulate collagen synthesis. Exercise-associated loading on joints and skin mechanically stimulates fibroblasts.',
  avoid: {
    smoking: 'Smoking dramatically accelerates collagen breakdown — arguably the single worst lifestyle habit for skin collagen.',
    uv: 'Unprotected UV exposure (no SPF) accelerates collagen loss rapidly.',
    excessive_alcohol: 'Alcohol dehydrates skin and may impair collagen synthesis.',
    crash_diets: 'Rapid weight loss depletes protein and key collagen cofactors.',
  },
};

// ─── ETHNIC COLLAGEN CONSIDERATIONS ───────────────────────────────────────────

export const ETHNIC_COLLAGEN_NOTES = {
  west_african: {
    community: 'West African',
    notes: 'Fitzpatrick V-VI skin has a naturally thicker dermis and higher baseline collagen density, which confers some natural protection against visible photoaging. However, collagen still depletes with age. Traditional foods like groundnut soup, stewed meats, and egusi soup are naturally collagen-rich. Shea butter has antioxidant properties that protect skin collagen.',
    concern: 'UV protection is still critical — melanin provides partial but not complete UV protection. Collagen loss still occurs; it just manifests differently (laxity rather than wrinkles as the primary sign).',
  },
  south_asian: {
    community: 'South Asian',
    notes: 'Turmeric (curcumin) is a powerful anti-inflammatory antioxidant used in traditional South Asian diet and skincare — it may protect collagen from inflammatory breakdown. Dals (lentils) are rich in plant protein and zinc. Traditional bone-based curries and stocks are collagen-containing foods.',
    concern: 'Medium Fitzpatrick III-IV skin ages visibly earlier than Fitzpatrick V-VI but benefits from moderate melanin protection compared to Fitzpatrick I-II. Sun protection is important, especially given high UV index in South Asia.',
  },
  caribbean: {
    community: 'Caribbean',
    notes: 'Traditional Caribbean diet includes significant collagen-rich foods: fish soups, oxtail stew, cow foot soup, chicken foot. These are traditional collagen-delivery mechanisms. High UV index in the Caribbean makes sun protection critical for collagen preservation.',
    concern: 'Melanin protection varies widely across Caribbean communities.',
  },
  arab: {
    community: 'Arab',
    notes: 'Traditional Arab diet includes collagen-supporting ingredients: lamb and beef stews with bones, rose water (antioxidant), argan oil (vitamin E antioxidant). Traditional hammam practice (kessa exfoliation) stimulates skin turnover and may mechanically signal fibroblasts. High UV in MENA region requires consistent SPF.',
  },
  east_asian: {
    community: 'East Asian',
    notes: 'Korean and Japanese collagen supplement cultures are among the most developed in the world — collagen drinks, gummies, and powders are mainstream beauty products across East Asia. Bone-based broths (Korean gomtang, tonkotsu ramen broth, Chinese pig trotter collagen soup) are traditional collagen foods. Green tea is a powerful antioxidant protecting collagen from oxidative damage.',
    unique: 'The "collagen drink" trend originated in Japan and Korea. Marine collagen from fish skin is especially popular in coastal East Asian cultures.',
  },
  black_american: {
    community: 'Black American',
    notes: 'Southern food traditions include collagen-rich foods: pig feet, oxtails, chitlins — traditionally dismissed but rich in glycine and hydroxyproline, the collagen amino acids. Black skin\'s thicker dermis and higher collagen density means a longer runway before visible collagen loss — but does not eliminate the need for protective habits. SPF adoption historically lower in the Black American community due to the myth that dark skin doesn\'t burn (it does, just less quickly).',
  },
  latina: {
    community: 'Latina',
    notes: 'Traditional Latin American foods include collagen-rich preparations: caldo de res (beef bone broth), menudo (tripe soup with collagen), carnitas. Lime juice rich in vitamin C — a critical collagen cofactor. Melasma is a significant concern for Latina women due to hormonal and UV factors; sun protection is collagen AND melasma protection.',
  },
  east_african: {
    community: 'East African',
    notes: 'Ethiopian and East African cuisine includes collagen-rich bone-based stews (tibs, kitfo with cartilage-containing cuts). Coffee has antioxidant compounds that may protect against collagen oxidation. High UV index requires consistent SPF for collagen preservation.',
  },
  south_african: {
    community: 'South African',
    notes: 'South African braai culture includes bone-in meats (potjiekos, lamb ribs) — naturally collagen-rich preparations. Rooibos tea is a South African tradition with high antioxidant content — catechins and aspalathin protect collagen from oxidative damage.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getCollagenScienceOverview() { return COLLAGEN_SCIENCE_OVERVIEW; }
export function getCollagenType(type) {
  return type ? COLLAGEN_TYPES[type] : COLLAGEN_TYPES;
}
export function getCollagenLoss() { return COLLAGEN_LOSS; }
export function getTopicalCollagenGuide(ingredient) {
  if (ingredient) return TOPICAL_COLLAGEN_GUIDE.effective_topical_ingredients[ingredient] || TOPICAL_COLLAGEN_GUIDE;
  return TOPICAL_COLLAGEN_GUIDE;
}
export function getCollagenSupplements(type) {
  if (type) return COLLAGEN_SUPPLEMENTS.types_of_supplements[type] || COLLAGEN_SUPPLEMENTS;
  return COLLAGEN_SUPPLEMENTS;
}
export function getCollagenLifestyle() { return COLLAGEN_LIFESTYLE; }
export function getEthnicCollagenNotes(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_COLLAGEN_NOTES[key] || Object.values(ETHNIC_COLLAGEN_NOTES);
}

export const COLLAGEN_STATS = {
  collagenTypes: Object.keys(COLLAGEN_TYPES).length,
  topicalIngredients: Object.keys(TOPICAL_COLLAGEN_GUIDE.effective_topical_ingredients).length,
  supplementTypes: Object.keys(COLLAGEN_SUPPLEMENTS.types_of_supplements).length,
  ethnicEntries: Object.keys(ETHNIC_COLLAGEN_NOTES).length,
  lifestyleFactors: Object.keys(COLLAGEN_LIFESTYLE.diet).length,
};
