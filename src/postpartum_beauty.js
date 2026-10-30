/**
 * MIRRR — Postpartum Beauty Guide
 * Hair loss, skin changes, safe products while breastfeeding,
 * recovery timelines, and multicultural postpartum beauty traditions.
 */

export const POSTPARTUM_OVERVIEW = {
  title: 'Postpartum Beauty: What to Expect & What Helps',
  introduction: `The postpartum period (the "fourth trimester" — first 3 months after birth, and beyond) brings dramatic physical changes driven by the sudden shift in hormone levels after delivery. Oestrogen and progesterone, which were extremely elevated during pregnancy, drop sharply within 24–48 hours of birth. This hormonal crash affects skin, hair, body, and mood profoundly.`,
  timeline: [
    { weeks: '0–2', phase: 'Immediate postpartum', changes: ['Oestrogen and progesterone crash', 'Skin may be dry, oily, or broken out due to hormone shift', 'Baby blues common (distinct from PPD)', 'Breast engorgement affects skin on chest', 'Healing from birth — focus on recovery over beauty'] },
    { weeks: '2–8', phase: 'Early recovery', changes: ['Hair shedding begins (telogen effluvium)', 'Melasma may fade slowly', 'Skin settling — but may remain reactive or sensitised', 'Breastfeeding: oxytocin release affects skin hydration; high prolactin continues to affect sebum', 'Stress and sleep deprivation show on skin (dark circles, dull complexion)'] },
    { weeks: '8–16', phase: 'Peak hair shedding', changes: ['Telogen effluvium peaks at 3–4 months postpartum', 'May notice significant hair at drain, on pillow, on clothing', 'Can be alarming — important to understand this is expected', 'Scalp visible in some cases due to diffuse thinning', 'If still breastfeeding: prolactin still elevated, affecting skin oil balance'] },
    { months: '4–12', phase: 'Gradual recovery', changes: ['Shedding slows; new growth begins (may see halo of shorter baby hairs at hairline)', 'Hormones gradually stabilising (unless breastfeeding, which delays return of menstrual cycle)', 'Melasma lightening as oestrogen normalises', 'Skin barrier recovering if supported well'] },
    { months: '12+', phase: 'Long-term recovery', changes: ['Many women fully recover hair density by 12 months', 'Some changes from pregnancy persist: wider hips, abdominal changes, changed breast tissue', 'Body is fundamentally different in many ways — this is not a problem to fix but a reality to understand and care for'] }
  ]
};

export const POSTPARTUM_HAIR_LOSS = {
  title: 'Postpartum Hair Loss (Postpartum Telogen Effluvium)',
  mechanism: {
    explanation: `During pregnancy, elevated oestrogen keeps more hairs in the anagen (growth) phase than usual — normal hair has 85–90% of hairs in anagen; during pregnancy this increases, so hair appears fuller, thicker, and seemingly grows faster. After delivery, oestrogen drops sharply, and all those extra hairs that were held in anagen simultaneously enter telogen (resting) phase. Two to four months later, these hairs shed simultaneously — telogen effluvium.`,
    statistics: 'Affects approximately 40–50% of postpartum women to some degree; up to 90% notice some shedding; clinically significant for about 10–15%',
    peakTiming: '3–4 months after delivery; some women experience it earlier or later',
    duration: 'Most resolve by 6 months postpartum; some take up to 12 months; if shedding continues beyond 12 months, investigation needed'
  },
  severity_factors: {
    worse: ['Multiple pregnancy (twins, triplets)', 'Nutritional deficiencies during or after pregnancy', 'High stress postpartum period', 'Low ferritin/iron stores', 'Thyroid dysfunction postpartum (thyroiditis is common postpartum condition)', 'Breastfeeding with poor nutritional support'],
    better: ['Excellent nutritional status', 'Lower stress environment', 'Shorter breastfeeding period or formula supplementation', 'Good sleep (rare with newborn but when possible)']
  },
  nutrition_critical: {
    ferritin: 'Most important: ferritin (stored iron) below 30 ng/mL associated with significant hair shedding; aim for ferritin above 70 ng/mL for hair health; breastfeeding depletes iron; standard postnatal supplements may not contain enough',
    protein: '1.2–1.6g per kg body weight daily; inadequate protein while breastfeeding is a significant hair loss accelerant; many new mothers undereat protein due to stress and time constraints',
    vitaminD: 'Deficiency widespread; very common postpartum; affects hair cycle; test and supplement if deficient',
    zinc: 'Depleted by breastfeeding; important for hair follicle function; zinc-containing foods: meat, legumes, seeds, nuts',
    biotin: 'Note: biotin supplementation is very commonly recommended but evidence for hair loss is weak unless biotin deficient; biotin interferes with thyroid function tests if labs are needed — tell doctor if supplementing',
    omega3: 'Anti-inflammatory; may support hair growth; from fatty fish, flaxseed, walnuts, or algae-based supplement'
  },
  postpartum_thyroiditis: {
    description: 'Affects 5–10% of postpartum women; autoimmune inflammation of thyroid gland; often undiagnosed',
    phases: 'Usually hyperthyroid (overactive) phase first at 1–4 months, followed by hypothyroid (underactive) phase at 4–8 months; most recover, but 25% develop permanent hypothyroidism',
    symptoms_hypothyroid: ['Persistent hair loss beyond expected timeline', 'Fatigue (beyond new-parent baseline)', 'Dry skin that doesn\'t respond to moisturiser', 'Weight difficulty', 'Depression/brain fog'],
    testing: 'TSH test (thyroid stimulating hormone) can diagnose; all women with persistent postpartum hair loss should have thyroid checked'
  },
  hair_strategies: {
    medical: ['Minoxidil: safe to use once breastfeeding stopped; can begin during shedding to limit loss and stimulate regrowth', 'Ferritin correction: this is the most impactful intervention for many women', 'Thyroid treatment if thyroiditis identified'],
    scalp: ['Scalp massage: 4 minutes daily; supports blood flow to follicles; evidence for hair thickness improvement', 'Rosemary oil: anti-androgenic; vasodilator; apply to scalp 2x weekly', 'Avoid tight hairstyles that increase tension while follicles are vulnerable'],
    lifestyle: ['Prioritise protein at every meal; protein shakes can help when time and appetite are limited', 'Ferritin-rich foods: red meat, liver, lentils, spinach, pumpkin seeds', 'Stress management: any form that works for a new parent'],
    visual_help: ['Scalp powder or concealer for visible scalp', 'Hair thickening products (volume spray, dry shampoo adds body)', 'Styling to maximise volume: diffuse dry, avoid heavy products near roots', 'Hairstyle consideration: layers add movement; blunt cuts can make thin hair more obvious', 'Clip-in extensions or hair toppers for severe cases']
  }
};

export const POSTPARTUM_SKIN_GUIDE = {
  title: 'Postpartum Skin Changes',
  melasmaPostpartum: {
    description: 'Melasma that appeared during pregnancy may persist or shift postpartum; oestrogen-driven pigmentation should gradually fade once hormones normalise',
    timeline: 'Can take 3–12 months to significantly fade after delivery; sun protection is the most important intervention',
    breastfeedingSafeApproach: ['SPF 30+ daily — most critical intervention', 'Niacinamide 5–10%: safe while breastfeeding; gentle brightening', 'Vitamin C serum: safe; antioxidant + brightening', 'Azelaic acid: considered safe; brightening and anti-inflammatory'],
    avoid_breastfeeding: ['Hydroquinone: absorbed systemically; avoid until weaned', 'Retinoids: avoid until fully weaned; small amounts pass to breast milk', 'Chemical sunscreens like oxybenzone: limited data; mineral SPF (zinc oxide, titanium dioxide) preferred'],
    longerTerm_afterWeaning: ['Retinol or tretinoin: most effective for melasma and general skin renewal; can begin after weaning', 'Hydroquinone 2–4%: effective for persistent melasma; see dermatologist for prescription strengths']
  },
  hormoneRelatedAcne: {
    trigger: 'Postpartum oestrogen drop + androgen exposure + increased sebum production can trigger breakouts that didn\'t occur during pregnancy',
    timeline: 'Usually appears weeks 1–6 postpartum; should stabilise by months 3–6',
    breastfeedingSafe: ['Salicylic acid (BHA): low concentrations (0.5–2%) considered acceptable by most dermatologists; minimal systemic absorption', 'Niacinamide: excellent for postpartum acne; regulates sebum; anti-inflammatory', 'Benzoyl peroxide: generally considered safe at 2.5–5%; rinse thoroughly before breastfeeding if applying to chest', 'Azelaic acid: safe; anti-inflammatory; anti-androgenic effect'],
    avoid: ['Isotretinoin (Accutane): absolutely contraindicated during breastfeeding — excreted in breast milk', 'Spironolactone: not recommended while breastfeeding', 'Strong retinoids: avoid until weaned']
  },
  skinSensitisation: {
    description: 'Many women find their skin becomes more sensitive or reactive postpartum, even if they never had sensitive skin before',
    reasons: ['Hormonal changes affect skin barrier function', 'Sleep deprivation impairs barrier repair', 'Stress increases skin reactivity', 'Immune changes of postpartum period'],
    approach: ['Simplify skincare to fewest possible products', 'Fragrance-free wherever possible', 'Gentle low-ingredient-count cleanser', 'Focus on barrier repair: ceramides, niacinamide, hyaluronic acid, gentle moisturiser']
  },
  undereyeChanges: {
    causes: ['Sleep deprivation increases blood pooling under eyes (inflammation response)', 'Dehydration common when breastfeeding', 'Collagen changes with hormonal shift', 'Genetics plays a large role'],
    approach: ['Extra hydration: drink more water especially when breastfeeding', 'Caffeine eye products: reduces puffiness (vasoconstriction)', 'Vitamin K eye cream: some evidence for reducing dark circles from blood pooling', 'Colour-correcting concealer: peach/salmon corrects blue-purple circles on medium-dark skin; pink/lavender corrects brown circles', 'Cold compress or chilled spoons: temporary puffiness reduction']
  },
  dryness: {
    cause: 'If breastfeeding: prolactin suppresses oestrogen production → low oestrogen → drier skin and mucous membranes (vaginal dryness also very common postpartum)',
    face: ['Richer moisturiser than pre-pregnancy routine', 'Hyaluronic acid applied to damp skin', 'Face oil as final step', 'Avoid alcohol-containing toners or harsh cleansers that strip further'],
    body: ['Body butter or oil after shower while still damp: traps moisture', 'Abdominal skin specifically: needs rich moisturisation; stretch marks may benefit from oils (rosehip, bakuchiol-containing creams)']
  }
};

export const BREASTFEEDING_SAFE_INGREDIENTS = {
  title: 'Ingredients Safety While Breastfeeding',
  generally_safe: {
    active_ingredients: ['Niacinamide (all percentages)', 'Vitamin C (ascorbic acid, L-ascorbic acid, all vitamin C derivatives)', 'Hyaluronic acid', 'Ceramides', 'Azelaic acid', 'Glycolic acid (low percentage, limited frequency)', 'Salicylic acid (low 0.5–2%, not body-wide)', 'Benzoyl peroxide (low %, rinse area before feeding)', 'Bakuchiol (retinol alternative; considered safe)', 'Peptides', 'Alpha arbutin', 'Tranexamic acid'],
    sunscreen: ['Zinc oxide: preferred; mineral; minimal systemic absorption', 'Titanium dioxide: mineral; considered safe', 'Note: many dermatologists suggest mineral-only SPF while breastfeeding to avoid potential oxybenzone absorption'],
    oils: ['Plant oils: all generally considered safe — rosehip, jojoba, argan, marula, etc.', 'Essential oils: diluted to 0.5–1% in a carrier are generally acceptable; avoid peppermint oil and wintergreen near baby face area']
  },
  avoid_while_breastfeeding: {
    highest_concern: ['Retinoids (retinol, retinaldehyde, tretinoin, adapalene, tazarotene): pass to breast milk; avoid until weaned', 'Hydroquinone: significant systemic absorption; avoid until weaned', 'Isotretinoin (oral): absolutely contraindicated', 'Oxybenzone chemical sunscreen: detectable in breast milk; choose mineral alternative'],
    limited_avoid: ['Salicylic acid in high percentages or over large body areas: systemic aspirin-like effect', 'Strong exfoliants (high % AHAs) used frequently over large areas', 'Chemical peels (professional)'],
    perfume_safety: ['Fragranced products: many essential oil components absorb systemically; avoiding heavy fragrance while breastfeeding is a reasonable precaution, especially near breast/chest area; fragrance-free versions of products exist for most skincare needs']
  },
  always_consult_doctor: 'When in doubt about any ingredient, consult your doctor or dermatologist — this list is general guidance, not medical advice. Individual sensitivities and health conditions affect recommendations.'
};

export const ETHNIC_POSTPARTUM_TRADITIONS = {
  'west-african': {
    communityName: 'West African',
    traditions: [
      { name: 'Confinement/Omugwo (Igbo tradition)', description: 'New mother is "confined" — a period of rest and recovery of typically 40 days; mother-in-law or own mother (omugwo/dibia) comes to care for mother and baby; new mother is freed of cooking and chores to focus purely on healing and newborn bonding', beautyElement: 'Traditional baths prepared with herbs and warm water to cleanse and heal birth-related soreness; shea butter applied to abdomen and entire body post-bath' },
      { name: 'Waist beads (all West African traditions)', description: 'Post-birth waist beads placed on mother — tied by elder women to help abdomen contract; aesthetic and functional; often gifted for protection and welcome of new stage of life' },
      { name: 'Hot baths with medicinal plants', description: 'Lemon grass, scent leaves (efinrin in Yoruba), bitter leaf — boiled in water for postpartum healing baths; anti-inflammatory; antimicrobial; spiritually protective in some traditions' }
    ],
    skinHair: ['Shea butter body application daily during confinement period', 'Head covering traditional in immediate postpartum period across many West African cultures', 'Hair often not styled or treated for the first weeks — focus on healing']
  },
  'south-asian': {
    communityName: 'South Asian',
    traditions: [
      { name: 'Jaappa/Japa (confinement period — 40 days)', description: 'South Asian postpartum confinement period; mother rests; relatives care for cooking and household; extremely common in Hindu tradition', beautyElement: 'Daily oil massage (abhyanga) for mother — warm sesame or mustard oil massaged into body daily to restore vata balance and heal tissues; extremely nourishing for skin' },
      { name: 'Turmeric milk (haldi doodh)', description: 'Golden milk with turmeric, black pepper, and warm milk; anti-inflammatory; healing; wound healing support after delivery', beautyElement: 'Turmeric pastes applied externally to abdominal wounds, stretch marks, and body for anti-inflammatory and brightening effects (note: stains skin and fabric yellow)' },
      { name: 'Panjiri / Ladoo (herbal postpartum food)', description: 'Special nutritional preparations made with: gond katira (tragacanth gum), ajwain (carom seeds), fenugreek, dry fruits, ghee, whole wheat flour; given to new mothers to restore strength, increase milk supply, and support healing', beautyElement: 'These foods directly support skin and hair recovery through nutritional density — they contain protein, healthy fats, and mineral-rich ingredients' },
      { name: 'Head oiling during confinement', description: 'Daily head oil massage (tel champi) with warm sesame or coconut oil; prevents postpartum hair loss believed to result from "cold" entering the head; whether or not this mechanism is accurate, the scalp massage and oil nourishment do support scalp health' }
    ],
    avoid: 'Cold water traditionally avoided (replaced with warm water for all hygiene) during the 40-day confinement period; cold believed to enter the body and cause lasting harm — this has some medical parallel in that warm water is gentler on perineal wounds'
  },
  caribbean: {
    communityName: 'Caribbean',
    traditions: [
      { name: 'Belly binding', description: 'Traditional belly wrapping with cloth immediately after delivery across Caribbean cultures; believed to help uterus contract and abdomen return to shape; has some parallel with modern postpartum belly bands', beautyElement: 'The wrap is sometimes combined with herbal poultices or oils to soothe stretched skin' },
      { name: 'Bush baths', description: 'Herbal bath preparation in Caribbean tradition; bush (local medicinal plants) such as soursop leaves, aloe vera, lemongrass, chain of love, added to warm bathwater; antimicrobial and healing properties; spiritual protection for mother and child' },
      { name: 'Guinness stout tradition (Caribbean and West African diaspora)', description: 'A small amount of Guinness stout traditionally recommended by grandmothers to new mothers for milk supply and strength; not medically endorsed; the B vitamins and iron in stout may have some basis in folk medicine wisdom' }
    ]
  },
  arab: {
    communityName: 'Arab',
    traditions: [
      { name: 'Arbayeen — 40-day confinement', description: 'Forty-day period (arbayeen) following birth; similar to other cultures\' confinement periods; new mother rests, female relatives cook and care for household; visits from female friends and relatives bringing special foods', beautyElement: 'Henna applied to hands and feet for blessing and beauty during this special period; incense burned for purification' },
      { name: 'Special postpartum foods', description: 'Hilbeh (fenugreek) — boiled or as tea; extremely common in Arab postpartum tradition; believed to increase milk supply (some clinical evidence); improves breast milk supply and maternal nutrition', beautyElement: 'Fenugreek has phytoestrogen content; may help with skin recovery' },
      { name: 'Incense fumigation', description: 'Bakhoor burned in the bedroom; some traditions have specific postpartum incense combinations for mother\'s healing; frankincense particularly associated with purification and healing postpartum' }
    ]
  },
  latina: {
    communityName: 'Latina',
    traditions: [
      { name: 'La cuarentena (40 days)', description: '40-day postpartum period observed across Latin America; mother rests; extended family takes over care; very similar to other cultures\' confinement periods', beautyElement: 'Special healing foods: caldo de pollo (chicken broth) — rebuilds strength; atole (masa-based drink) — calorie-dense; mole negro in some regions — dark chocolate-based sauce' },
      { name: 'Faja (belly wrap)', description: 'Tight belly wrap applied immediately after delivery across Latin America; believed to support the abdomen and help it return to shape; Mexican tradition of tying and retying the faja several times daily for full 40 days', beautyElement: 'Belly wrapping allows mother to feel supported and comfortable to move more; psychological benefit of feeling "held together" postpartum' },
      { name: 'Sitz baths and herbal preparations', description: 'Warm herbal baths for perineal healing; manzanilla (chamomile), calendula, lavender commonly used; anti-inflammatory and gentle healing' }
    ]
  },
  'east-asian': {
    communityName: 'East Asian',
    traditions: [
      { name: 'Zuò yuèzi (坐月子) — "Sitting the Month"', description: 'Chinese postpartum confinement period (30 days minimum; extended to 100 days in some traditions); one of the most elaborate postpartum care systems in the world', rules: ['No cold water, food, or air exposure — all must be warm', 'No showering (traditionally); increasingly modified to warm water only', 'Rest absolutely; no phone, no TV, no reading (to protect eyes)', 'Special herbal foods prepared by relatives or professional yuesao (postpartum nanny)', 'No visitors except immediate family for the full month'],
        beautyElement: 'Warm sesame oil body massage; special herbal hair washing preparations when washing is permitted; careful skin care with warming ingredients' },
      { name: 'Korean San-hu-jo-ri (산후조리)', description: '3–4 weeks postpartum care period; sanhujori centres (confinement homes) are thriving businesses in South Korea; professional care for mother and baby', care: 'Seaweed soup (미역국, miyeokguk) eaten 3x daily for weeks; extremely high in iodine, calcium, and iron — direct support for hair and skin recovery; traditional belief that neglecting sanhujori causes lifelong health problems',
        beautyElement: 'Korean sanhujori includes professional postpartum massage, Korean spa treatments, and skincare support' },
      { name: 'Japanese Ansei (安静) — rest period', description: 'Traditionally 3 weeks to 1 month of rest; mother returns to her own parents\' home (satogaeri bunben) for birth and confinement; modern Japan: shorter confinement as nuclear families become more common; postpartum support is significant public health concern' }
    ]
  },
  'east-african': {
    communityName: 'East African',
    traditions: [
      { name: 'Ethiopian postpartum "smoke bathing"', description: 'Udsi/oodsi ritual — burning specific aromatics including frankincense beneath a blanket while new mother sits and the healing smoke is directed to her body; believed to help uterine contraction, healing, and spiritual protection',
        beautyElement: 'The frankincense smoke is anti-inflammatory and antimicrobial; has been used for millennia in this capacity in East Africa and Arabia' },
      { name: 'Special injera-based meals', description: 'Specific nutritional preparations for new mothers; injera with highly nutritious stews (doro wat with eggs; misir with lentils); teff grain provides exceptional iron, calcium, and protein for postpartum recovery',
        beautyElement: 'Teff\'s nutritional density directly supports hair and skin recovery' }
    ]
  },
  'south-african': {
    communityName: 'South African',
    traditions: [
      { name: 'Ukuhlanjwa (Zulu: purification)', description: 'Purification rituals following birth in Zulu tradition; involve bathing with specific herbs; transition from pregnancy to motherhood is marked with cultural ceremony', beautyElement: 'Herbal baths with healing and aromatic plants; body is ritually cleansed; marula oil application' },
      { name: 'Seclusion period in various Bantu traditions', description: 'Varying periods of rest and care across South African Bantu cultures; community of women supporting new mother; female relatives taking over household to allow healing' }
    ]
  },
  'black-american': {
    communityName: 'Black American',
    traditions: [
      { name: 'Community care', description: 'Historically, extended family and community women supported new mothers through the postpartum period; "it takes a village" ethic; church community support was significant', beautyElement: 'Community members would cook, clean, and allow mother to rest; direct impact on stress reduction which reduces telogen effluvium' },
      { name: 'Hair care considerations', description: 'Protective styling during postpartum period; keeping natural hair in a protective style during heavy shedding phase protects fragile new growth; transition of hair care to lower-manipulation styles', beautyElement: 'Scalp health prioritised; protective styles with gentle tension; JBCO (Jamaican Black Castor Oil) for scalp during shedding period' },
      { name: 'Modern Black maternal health movement', description: 'Black American women have disproportionate maternal mortality and morbidity rates in the US; the Black maternal health movement advocates for respectful, evidence-based care; postpartum mental health (including PPD) awareness is part of holistic Black women\'s health advocacy' }
    ]
  }
};

export function getPostpartumOverview() {
  return POSTPARTUM_OVERVIEW;
}

export function getPostpartumHairLoss(section) {
  if (!section) return POSTPARTUM_HAIR_LOSS;
  const map = {
    mechanism: POSTPARTUM_HAIR_LOSS.mechanism,
    nutrition: POSTPARTUM_HAIR_LOSS.nutrition_critical,
    thyroid: POSTPARTUM_HAIR_LOSS.postpartum_thyroiditis,
    strategies: POSTPARTUM_HAIR_LOSS.hair_strategies,
    severity: POSTPARTUM_HAIR_LOSS.severity_factors
  };
  return map[section.toLowerCase()] || POSTPARTUM_HAIR_LOSS;
}

export function getPostpartumSkinGuide(concern) {
  if (!concern) return POSTPARTUM_SKIN_GUIDE;
  const map = {
    melasma: POSTPARTUM_SKIN_GUIDE.melasmaPostpartum,
    acne: POSTPARTUM_SKIN_GUIDE.hormoneRelatedAcne,
    sensitivity: POSTPARTUM_SKIN_GUIDE.skinSensitisation,
    sensitive: POSTPARTUM_SKIN_GUIDE.skinSensitisation,
    undereye: POSTPARTUM_SKIN_GUIDE.undereyeChanges,
    circles: POSTPARTUM_SKIN_GUIDE.undereyeChanges,
    dryness: POSTPARTUM_SKIN_GUIDE.dryness,
    dry: POSTPARTUM_SKIN_GUIDE.dryness
  };
  return map[concern.toLowerCase()] || POSTPARTUM_SKIN_GUIDE;
}

export function getBreastfeedingSafeIngredients() {
  return BREASTFEEDING_SAFE_INGREDIENTS;
}

export function getEthnicPostpartumTraditions(communityId) {
  const key = communityId.replace(/-/g, '_');
  const data = ETHNIC_POSTPARTUM_TRADITIONS;
  return data[communityId] || data[key] || null;
}

export const POSTPARTUM_BEAUTY_STATS = {
  moduleId: 'postpartum_beauty',
  version: '1.0.0',
  topics: ['postpartum beauty', 'postpartum hair loss', 'telogen effluvium', 'breastfeeding safe skincare', 'postpartum skin', 'melasma postpartum', 'postpartum confinement', 'zuò yuèzi', 'sanhujori', 'cuarentena', 'omugwo', 'postpartum traditions'],
  communitiesSupported: 9,
  keyFacts: [
    'Postpartum telogen effluvium affects 40–50% of new mothers, peaking at 3–4 months after delivery',
    'Ferritin below 70 ng/mL is a major driver of postpartum hair loss; correcting iron stores is the most impactful non-pharmaceutical intervention',
    'Postpartum thyroiditis affects 5–10% of postpartum women and is frequently missed; causes persistent hair loss, fatigue, and mood changes',
    'Chinese zuò yuèzi (sitting the month) is among the world\'s most elaborate postpartum care traditions — lasting 30–100 days',
    'Korean miyeokguk (seaweed soup) eaten 3x daily post-birth provides exceptional iodine, calcium, and iron directly supporting hair and skin recovery',
    'Retinoids, hydroquinone, and oxybenzone sunscreen should be avoided while breastfeeding; mineral SPF (zinc oxide) is the preferred sunscreen',
    'Bakuchiol is a breastfeeding-safe retinol alternative with evidence for similar photoaging benefits without retinoid risks',
    'Black American women have disproportionate maternal mortality rates in the US; the Black maternal health movement addresses this systemic issue'
  ]
};
