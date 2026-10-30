/**
 * MIRRR — Skin Barrier Guide
 * Comprehensive guide to the skin barrier, damage, repair, and skin-of-colour considerations.
 */

export const SKIN_BARRIER_SCIENCE = {
  title: 'Skin Barrier — Biology & Function',
  whatItIs: {
    definition: 'The skin barrier (stratum corneum) is the outermost layer of the skin — the final frontier between the external environment and the body\'s living tissue. It is composed of dead, flattened keratinocyte cells (corneocytes) embedded in a lipid matrix (ceramides, fatty acids, cholesterol). The analogy most often used is "bricks and mortar": the corneocytes are the bricks, the lipid matrix is the mortar holding them together.',
    functions: ['TEWL prevention: Trans-Epidermal Water Loss — prevents the skin from losing moisture to the environment; a healthy barrier retains skin hydration', 'Pathogen barrier: prevents bacteria, viruses, and fungi from penetrating the skin', 'Environmental barrier: blocks UV radiation (partially), pollution particulates, allergens, and irritants', 'pH maintenance: keeps skin surface slightly acidic (pH 4.5-5.5) which supports healthy skin microbiome and barrier enzyme function']
  },
  lipidComposition: {
    ceramides: {
      
      ceramideTypes: 'There are at least 12 ceramide types (Cer EOS, Cer NS, Cer NP, etc.); Ceramide NP (Ceramide 3) is the most studied; different ceramides serve different structural roles',
      
    },
    fattyAcids: {
      
      linoleicAcid: 'Linoleic acid (an omega-6 essential fatty acid) is particularly important for barrier integrity; deficiency of linoleic acid is associated with dry, scaly skin and barrier impairment; it cannot be synthesised by the body and must come from diet or topical application',
      note: 'This is why facial oils rich in linoleic acid (rosehip, hemp seed, sea buckthorn) are beneficial for barrier support, while high-oleic oils (marula, argan, olive oil) are better for moisturisation than barrier repair'
    },
    cholesterol: {
      
      practical: 'This is why some barrier repair creams include cholesterol as an ingredient alongside ceramides; the ideal ratio for barrier repair is roughly ceramides:cholesterol:fatty acids = 3:1:1'
    }
  },
  naturalMoisturisingFactor: {
    definition: 'NMF (Natural Moisturising Factor) is a collection of water-soluble compounds found within the corneocytes (skin cells) of the stratum corneum; NMF is hygroscopic — it draws water from the environment and from deeper skin layers to maintain skin hydration',
    components: 'NMF includes amino acids (40%), PCA (pyrrolidone carboxylic acid, 12%), lactate (12%), urea (7%), and smaller amounts of sugars, ions, and other organic acids',
    
    importance: 'When NMF is depleted (through excessive cleansing, harsh surfactants, hot water, low humidity), the skin becomes dehydrated even if the structural barrier is intact; NMF is distinct from the lipid barrier — you can have good structural barrier but depleted NMF, or vice versa'
  },
  acidMantle: {
    definition: 'The acid mantle is the slightly acidic surface of the skin (pH 4.5-5.5); it is maintained by a combination of sweat, sebum, and NMF components; the acidic pH inhibits pathogen growth, supports keratinocyte function, activates essential barrier enzymes (serine proteases), and maintains the skin microbiome',
    disruption: 'Products with alkaline pH (harsh soaps, baking soda, many "natural" cleansers) disrupt the acid mantle, impairing barrier enzyme function and allowing pathogen overgrowth; the skin can restore its acid mantle within hours of a single disruption but repeated disruption causes cumulative impairment',
    skinMicrobiome: 'The skin microbiome (the community of bacteria, fungi, and other microorganisms living on the skin surface) is closely linked to the acid mantle; Staphylococcus epidermidis is a beneficial skin commensal that helps maintain the acid mantle; in atopic dermatitis, Staphylococcus aureus overgrows due to microbiome disruption'
  }
};

export const BARRIER_DAMAGE_SIGNS = {
  title: 'Signs of Skin Barrier Damage',
  symptoms: {
    dehydration: 'Tight or "squeaky" feeling skin after cleansing; fine lines appear more pronounced; skin looks dull or grey; skincare products "sting" or burn that normally do not',
    dryness: 'Flaking, scaling, or rough texture; visible dry patches; skin feels rough to the touch',
    sensitisation: 'Previously tolerated products suddenly cause stinging, burning, or redness; skin reacts to alcohol, fragrance, acids at concentrations that were previously fine; new allergies seem to develop',
    inflammation: 'Persistent redness; prolonged irritation after skincare application; "angry skin" that reacts to nearly everything',
    TEWLIncrease: 'Skin that feels dry regardless of how much moisturiser is applied (product is going on but water is still escaping through a compromised barrier)',
    patching: 'Pink or red patches; uneven skin tone; areas of extreme dryness next to normal skin'
  },
  commonCauses: {
    overCleansing: 'Cleansing more than twice daily; using harsh, stripping, high-surfactant cleansers (SLS, SLES); using very hot water; using physical scrubs too frequently',
    overExfoliation: 'AHA/BHA acids used too frequently or at too high concentrations; using multiple exfoliating products; physical exfoliation combined with chemical',
    environment: 'Very low humidity (winter heating, air conditioning); UV exposure; cold wind; pollution',
    agingBarrier: 'Natural ceramide loss with age; reduced lipid production; slower cell turnover',
    medication: 'Oral retinoids (isotretinoin); topical corticosteroids used long-term; some acne medications',
    poorDiet: 'Essential fatty acid deficiency (particularly linoleic acid); dehydration; nutrient deficiencies'
  }
};

export const BARRIER_REPAIR_PROTOCOL = {
  title: 'Skin Barrier Repair — Step by Step',
  immediateProtocol: {
    step1Simplify: {
      action: 'STOP all actives immediately',
      details: 'Remove all AHAs, BHAs, retinoids, vitamin C, benzoyl peroxide, niacinamide (at high concentrations) from the routine temporarily; a compromised barrier cannot tolerate active ingredients — they penetrate too deeply, causing more inflammation and damage'
    },
    step2Cleanse: {
      action: 'Switch to the gentlest possible cleanser',
      details: 'A pH-balanced (5-6) milky, cream, or oil cleanser with no fragrance, no alcohol, no sulphates; examples: Vanicream Gentle Facial Cleanser, CeraVe Hydrating Cleanser, La Roche-Posay Toleriane; cleanse only once daily (evenings) if the barrier is severely compromised; skip morning cleanse and rinse with cool water only'
    },
    step3Humectant: {
      action: 'Apply a fragrance-free humectant',
      details: 'Hyaluronic acid serum or glycerin-water toner on damp skin; draws moisture into the skin from environment and from below; do not apply to very dry skin in a dry environment as this can actually pull moisture from the skin; always follow with an occlusive'
    },
    step4BarrierRepair: {
      action: 'Apply a barrier-repair moisturiser',
      details: 'Look for products containing ceramides, fatty acids, and cholesterol in combination; these are the molecules the skin barrier is made of and topical application helps accelerate repair; CeraVe, Cerave AM/PM, Avene Cicalfate, La Roche-Posay Cicaplast Baume B5 are well-researched options'
    },
    step5Occlusive: {
      action: 'Seal with an occlusive at night',
      details: 'Petroleum jelly (Vaseline), Aquaphor, squalane, or a dedicated occlusive cream over the barrier repair product; occlussives create a physical seal that prevents TEWL; the "slugging" trend (applying Vaseline as final step) directly addresses TEWL; use occlusives at night when the skin is in repair mode'
    },
    step6Patience: {
      action: 'Wait 2-4 weeks before reintroducing actives',
      details: 'Barrier repair takes time; the skin renewal cycle (from basal layer to surface shedding) is approximately 28 days in young adults, longer with age; allow at least one full cycle before reintroducing any active ingredient; reintroduce ONE active at a time, at a low frequency'
    }
  },
  longTermMaintenance: {
    lessCleansing: 'Once daily cleansing is sufficient for most people; twice daily is appropriate only if heavy makeup or SPF is worn; over-cleansing is the most common route to barrier damage',
    spfDaily: 'Daily SPF protects the barrier from UV damage; UV is the largest environmental cause of barrier damage and skin aging; SPF 30+ every morning',
    ceramideRichMoisturiser: 'Using a ceramide-containing moisturiser regularly (not just when damaged) supports the baseline barrier',
    humidity: 'A humidifier in dry spaces (during winter heating, in air-conditioned rooms) maintains the ambient humidity that the skin needs for hydration',
    diet: 'Essential fatty acid intake (omega-3 from fish, flaxseed; omega-6 linoleic from seed oils) directly supports ceramide production; good hydration supports skin from inside'
  }
};

export const SLUGGING_GUIDE = {
  title: 'Slugging — The Vaseline Final Step',
  whatItIs: 'Slugging is the practice of applying a thin layer of petroleum jelly (Vaseline) or another occlusive over your entire skincare routine as the final step; the name comes from the glistening, slug-like appearance of the face afterwards',
  popularised: 'Popularised as a Korean skincare technique on Reddit and TikTok from 2020-2022; the term "slugging" was popularised by Reddit\'s r/SkincareAddiction community; the practice itself has been used by dermatologists for decades to treat barrier damage',
  
  benefits: ['Dramatically improves skin hydration overnight', 'Accelerates barrier repair', 'Reduces sensitivity by protecting the compromised barrier from environmental irritants', 'Reduces fine lines temporarily (by keeping skin hydrated)', 'Inexpensive and highly evidence-based'],
  whoShouldSlug: ['People with dry or very dry skin', 'People with a compromised or recovering barrier', 'People in dry or cold climates', 'Aging skin with reduced lipid production'],
  whoShouldAvoid: ['People prone to milia (small white cysts); petroleum jelly does not cause acne (it is non-comedogenic) but can cause milia in some people by trapping dead skin cells', 'Oily or acne-prone skin may find slugging too heavy', 'Anyone with a current active breakout'],
  alternativesToVaseline: 'Aquaphor Healing Ointment (contains petrolatum plus lanolin and glycerin — slightly more emollient than pure Vaseline); Squalane oil (less occlusive but lighter feel); COSRX Advanced Snail All-in-One Cream'
};

export const ETHNIC_BARRIER_GUIDE = {
  'west-african': {
    skinCharacteristics: 'West African (Fitzpatrick V-VI) skin has higher sebum production and ceramide content compared to lighter skin tones in some studies; despite this, clinical dryness and ashy appearance are common concerns; the grey "ashy" look characteristic of dry dark skin is highly visible against the deep background skin tone',
    ashySkin: 'The "ashy" appearance on dark skin is caused by the same dry, compromised barrier that causes flaking on light skin; the difference is visibility — visible dry skin fragments appear white/grey against dark skin, which is highly noticeable; the solution is the same: barrier repair and deep moisturisation, often with shea butter, oils, and ceramide creams',
    ingredientsForBarrier: 'Raw shea butter is an excellent barrier-supporting ingredient for West African skin; it contains ceramide-like fatty acids and triterpenes that support the skin barrier; coconut oil can be added for deep moisturisation though it is comedogenic for some; black soap for cleansing must be patch-tested — traditional black soap is alkaline and can disrupt the acid mantle if used daily'
  },
  'south-asian': {
    skinCharacteristics: 'South Asian skin (Fitzpatrick III-V) has a warm olive undertone; barrier damage often presents as increased sensitivity and PIH (post-inflammatory hyperpigmentation) — any irritation leaves marks; this is a critical consideration when recommending barrier repair as barrier disruption on South Asian skin can lead to lasting darkening',
    PIHRisk: 'For South Asian skin with a compromised barrier, the risk of PIH from any continued irritation is high; strict adherence to the "stop all actives" step in barrier repair is especially important; once barrier is restored, reintroduction of actives should be very gradual',
    traditionalIngredients: 'Aloe vera (used extensively in South Asian tradition), turmeric (anti-inflammatory), coconut oil, sesame oil; turmeric can stain fabrics and should be patch-tested; coconut oil is comedogenic for some'
  },
  caribbean: {
    skinCharacteristics: 'Caribbean skin reflects enormous diversity; Afro-Caribbean skin similar to West African considerations; Indo-Caribbean skin similar to South Asian',
    climateNote: 'Caribbean climates are humid, which naturally supports skin hydration and barrier function; however, travel from humid Caribbean environments to cold, dry, winter climates in North America or Europe causes dramatic barrier stress; Caribbean people living in New York, London, or Toronto winters often experience significant barrier disruption'
  },
  arab: {
    skinCharacteristics: 'Arab skin varies; medium olive skin is common; the Middle East and North Africa have high UV and often extreme temperature variation between hot outdoors and air-conditioned interiors; this transition stresses the barrier',
    dryClimate: 'Desert climates (Saudi Arabia, UAE, Egypt, Jordan) have very low humidity which is highly challenging for skin barrier; indoor air conditioning adds further drying effect; barrier repair in these environments requires strong occlusives',
    traditionalIngredients: 'Argan oil (Morocco) — excellent for barrier support, high linoleic acid content; aloe vera; black seed (Nigella sativa) oil — has anti-inflammatory and antioxidant properties'
  },
  latina: {
    skinCharacteristics: 'Wide diversity; warm olive skin common in many Latin American populations; humid tropical climates in Latin America generally support the skin barrier; immigration to drier or colder Northern climates creates barrier stress',
    ingredients: 'Avocado oil (high oleic and linoleic acid — good for barrier); rosehip oil (linoleic acid — good for barrier repair); aloe vera (widely used throughout Latin America)'
  },
  'east-asian': {
    skinCharacteristics: 'East Asian skin (often Fitzpatrick II-IV): measurements of barrier water loss compared with other groups disagree, and many people report sensitivity; K-beauty and J-beauty put barrier care at the centre of the routine',
    layering: 'The K-beauty layering approach (toner, essence, serum, ampoule, moisturiser) can paradoxically lead to barrier disruption if some layers contain active ingredients or alcohol; the philosophy of layering moisture is correct but product choice matters',
    doubleCleanseNote: 'The double cleanse (oil cleanser + water cleanser) standard in K-beauty can be barrier-disruptive if the second step uses a harsh cleanser; the first oil cleanse is very gentle; the second cleanse should be equally gentle (a low-surfactant milky cleanser rather than a foaming gel)'
  },
  'east-african': {
    skinCharacteristics: 'Deep Fitzpatrick V-VI skin; similar to West African in terms of ceramide considerations; hot, often arid climates in East Africa (Ethiopia, Kenya, Somalia) are challenging for barrier function',
    frankincense: 'Frankincense resin (Boswellia carterii, native to East Africa and the Arabian Peninsula) has boswellic acids with anti-inflammatory properties; frankincense oil has traditional use in skincare and some modern evidence for skin barrier support',
    bodyOiling: 'The East African tradition of full-body oiling with fragranced oils (from Somalia, Ethiopia) is both culturally significant and beneficial for skin barrier; regular body oiling maintains the lipid layer on the skin surface'
  },
  'south-african': {
    skinCharacteristics: 'Very diverse; the South African climate varies enormously from the humid coast to dry interior; Johannesburg at altitude has lower humidity and higher UV',
    marula: 'Marula oil from the marula tree (Sclerocarya birrea) native to sub-Saharan Africa has high oleic acid (70%+) content and antioxidants; excellent for skin barrier moisturisation; the Drunk Elephant brand popularised marula oil globally though it has been used by South African and other sub-Saharan communities for generations',
    rooibos: 'Rooibos (Aspalathus linearis) — indigenous to the Western Cape of South Africa — contains the unique antioxidant aspalathin; rooibos tea infusion and rooibos extract are used in South African skincare products; anti-inflammatory and antioxidant benefits for skin'
  },
  'black-american': {
    
    ashySkinconcern: 'Ashy, dry-looking skin is a primary concern; the standard beauty product market historically did not prioritise products for this concern as effectively as for lighter skin tones; Black-owned beauty brands have pioneered heavy-duty moisturisers and barrier products',
    shea: 'Shea butter (imported from West Africa or sourced from US Black-owned brands) is a cornerstone of Black American skin and hair care; used in its raw form or as an ingredient in countless skincare products',
    skinIssues: 'Eczema (atopic dermatitis) disproportionately affects Black children in the US; research is ongoing on the causes; barrier repair approaches developed for eczema-prone skin are highly relevant for the Black American community'
  }
};

export function getSkinBarrierScience(section) {
  if (!section) return SKIN_BARRIER_SCIENCE;
  const map = {
    ceramides: SKIN_BARRIER_SCIENCE.lipidComposition.ceramides,
    nmf: SKIN_BARRIER_SCIENCE.naturalMoisturisingFactor,
    acidmantle: SKIN_BARRIER_SCIENCE.acidMantle,
    lipids: SKIN_BARRIER_SCIENCE.lipidComposition,
    structure: SKIN_BARRIER_SCIENCE.whatItIs
  };
  return map[section] || SKIN_BARRIER_SCIENCE;
}

export function getBarrierDamageSigns() {
  return BARRIER_DAMAGE_SIGNS;
}

export function getBarrierRepairProtocol(section) {
  if (!section) return BARRIER_REPAIR_PROTOCOL;
  return BARRIER_REPAIR_PROTOCOL[section] || BARRIER_REPAIR_PROTOCOL;
}

export function getEthnicBarrierGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_BARRIER_GUIDE['west-african'],
    'south-asian': ETHNIC_BARRIER_GUIDE['south-asian'],
    caribbean: ETHNIC_BARRIER_GUIDE.caribbean,
    arab: ETHNIC_BARRIER_GUIDE.arab,
    latina: ETHNIC_BARRIER_GUIDE.latina,
    'east-asian': ETHNIC_BARRIER_GUIDE['east-asian'],
    'east-african': ETHNIC_BARRIER_GUIDE['east-african'],
    'south-african': ETHNIC_BARRIER_GUIDE['south-african'],
    'black-american': ETHNIC_BARRIER_GUIDE['black-american']
  };
  return directMap[communityId] || null;
}

