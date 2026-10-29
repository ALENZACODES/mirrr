/**
 * MIRRR — Hair Porosity Deep Dive
 * The most predictive factor in hair care product selection.
 * Biology, testing, ethnic variation, product matching, and routines.
 */

export const POROSITY_BIOLOGY = {
  title: 'Hair Porosity — Biology & Science',
  whatItIs: {
    definition: 'Hair porosity refers to the hair\'s ability to absorb and retain moisture; specifically, it describes how open or closed the hair cuticle (the outermost protective layer of the hair shaft) is; porosity is widely considered a MORE important factor in hair product selection than curl type or hair type classification',
    cuticleStructure: {
      anatomy: 'The hair shaft has three layers: the medulla (innermost, hollow or semi-hollow), the cortex (main body of the hair, contains melanin and keratin fibrils), and the cuticle (outermost protective scales); the cuticle consists of overlapping cells (resembling fish scales or roof shingles) that can lie flat, slightly raised, or very raised',
      lowPorosity: 'In low porosity hair, the cuticle scales lie very flat and tightly overlapping; this provides excellent protection for the inner cortex but makes it difficult for water and product to penetrate; the hair is naturally resistant to moisture absorption but also to moisture loss',
      mediumPorosity: 'In medium/normal porosity hair, the cuticle scales lie moderately flat; moisture is absorbed at a reasonable rate and retained reasonably well; the easiest porosity to care for',
      highPorosity: 'In high porosity hair, the cuticle scales are raised or damaged, creating gaps and holes; moisture is absorbed very quickly but is also lost very quickly; hair may feel perpetually dry even with product application because moisture escapes as fast as it enters'
    }
  },
  porosityVsCurlType: {
    comparison: 'Andre Walker\'s hair type system (1A-4C, based on curl pattern) is widely known but is not the most useful predictive tool for product selection; two people with 3C curl pattern but different porosity will need completely different products and routines; porosity predicts product performance much better',
    combinedApproach: 'The most accurate approach combines both: knowing that a hair is 4B AND high porosity gives very specific guidance; but if you had to choose one metric, porosity guides product choices more reliably',
    geneticsVsDamage: 'IMPORTANT: Porosity has BOTH genetic and damage-related components; natural (virgin) hair has a genetically determined baseline porosity; chemical processing (colour, bleach, relaxer, perm), heat damage, UV damage, and mechanical damage (brushing, braiding too tightly) can permanently raise porosity beyond its natural level'
  },
  porosityTests: {
    floatTest: {
      method: 'Take 2-3 clean hairs (no product) and drop them into a glass of room-temperature water; watch for 2-4 minutes',
      results: 'Hairs float for 3+ minutes = low porosity; hairs float briefly then sink slowly = medium porosity; hairs sink immediately = high porosity',
      limitations: 'The float test is commonly taught but has significant limitations; product buildup, oils, or an unclean hair sample can skew results; the test also doesn\'t account for the full length of the hair (roots may differ from ends); consider it one data point among several'
    },
    slideTest: {
      method: 'Take a single hair strand between two fingers and slide your fingers from tip to root (against the direction of the cuticle scales)',
      results: 'Very smooth, no resistance = low porosity (scales very flat); slight texture and bumps = medium porosity; rough, catches easily, or hair seems to shred = high porosity (raised or damaged scales)',
      note: 'More reliable than the float test for assessing cuticle condition'
    },
    sprayTest: {
      method: 'Lightly spray clean hair with water; watch how the water behaves',
      results: 'Water beads up and sits on the surface for 10+ seconds before absorbing = low porosity; water absorbs within a few seconds = medium porosity; water is absorbed almost immediately = high porosity'
    },
    dryingTime: {
      observation: 'How quickly does your hair dry after washing? Very slow (4+ hours for curly/coily hair) = likely low porosity; moderate drying time = medium porosity; hair dries very quickly but feels dry = likely high porosity'
    }
  }
};

export const LOW_POROSITY_GUIDE = {
  title: 'Low Porosity Hair — Complete Guide',
  characteristics: {
    appearance: 'Often shiny (flat cuticles reflect light well); tends to be healthy-looking; colour-treated: takes a long time to absorb colour and may need extra processing time or heat',
    feelAndBehaviour: ['Water beads up on the hair surface; takes time to absorb water', 'Products sit on the hair rather than absorbing (product buildup is a major issue)', 'Hair takes a very long time to dry', 'Colour processing may require more time or developer', 'Hair feels fine or silky to the touch (flat scales)']
  },
  challenges: {
    mainChallenge: 'Getting moisture IN is the primary challenge; the tightly closed cuticle resists water and product penetration; products tend to sit on the surface rather than enter the hair shaft',
    buildupProblem: 'Because product absorbs so poorly, low porosity hair is extremely prone to buildup; product that doesn\'t absorb simply sits on the hair, attracting more product and creating a coating that makes the hair feel greasy, heavy, and limp; this buildup further prevents moisture from entering',
    proteinSensitivity: 'Low porosity hair is often protein-sensitive: the already-tight cuticle with protein treatments (which coat and further close the cuticle) can create stiffness, brittleness, and breakage; low porosity hair generally benefits from moisture-focused products more than protein treatments'
  },
  productGuidance: {
    bestIngredients: ['Humectants: glycerin, hyaluronic acid, aloe vera — these are water-loving and work with low porosity hair\'s tendency to retain once moisture gets in', 'Lightweight oils: grapeseed oil, argan oil, sweet almond oil — penetrate before the cuticle closes again', 'Emollients: behentrimonium methosulfate (BTMS), cetearyl alcohol — condition without heavy coating'],
    avoid: ['Heavy butters (shea, mango, cocoa) as primary products: these are too large to penetrate the cuticle and will sit on top, causing buildup; can be used in small amounts as sealants', 'Protein treatments: castor oil, egg, keratin treatments — risk of protein overload and brittleness', 'Heavy oils: castor oil, olive oil — too thick for easy penetration of low porosity hair'],
    keyTechnique: 'HEAT IS THE KEY for low porosity hair: applying products to hair under a heated deep conditioning cap, warm towel, or in a warm bathroom opens the cuticle temporarily and allows product penetration; steamers (dedicated hair steamers or facial steamers used on hair) are a game changer for low porosity hair deep conditioning'
  },
  washDayRoutine: {
    steps: [
      '1. Pre-poo with a lightweight oil (grapeseed, sweet almond) applied to dry hair before washing',
      '2. Wash with a clarifying or lightweight sulphate-free shampoo to remove any buildup',
      '3. Apply conditioner to wet hair — use a heat cap or warm towel turban for 20-30 minutes to open cuticle and allow penetration',
      '4. Rinse with cool water to close the cuticle and seal in moisture',
      '5. Apply lightweight leave-in conditioner while hair is very wet',
      '6. Apply a humectant gel or cream (no heavy butters)',
      '7. Seal with a TINY amount of lightweight oil',
      '8. Diffuse, air dry, or hood dry (continued warmth keeps the cuticle slightly open for absorption while styling)'
    ]
  },
  clarifyingRoutine: {
    frequency: 'Monthly or every 4-6 washes',
    method: 'Use a clarifying shampoo (containing sodium lauryl sulphate or apple cider vinegar rinse) to strip all buildup from the hair; follow with deep conditioning treatment under heat; this reset allows hair to absorb moisture effectively for the next few weeks'
  }
};

export const HIGH_POROSITY_GUIDE = {
  title: 'High Porosity Hair — Complete Guide',
  characteristics: {
    appearance: 'May look frizzy, dull, or dry; tangles easily; often has split ends; may feel rough or course to the touch (raised cuticle edges create texture)',
    feelAndBehaviour: ['Water is absorbed almost immediately — too fast', 'Products absorb quickly but moisture is lost quickly too', 'Frizz in humidity (raised cuticles absorb ambient moisture unevenly)', 'Colour-treated: absorbs colour very fast but also fades quickly', 'Hair feels rough or "sticky" when dry due to raised cuticle edges']
  },
  causes: {
    genetic: 'Natural (genetic) high porosity is common in certain hair textures, particularly very coily (4A-4C) hair types; the tight coil means more bends in the hair shaft which creates natural areas of cuticle weakness; also common in fine hair',
    acquired: ['Chemical damage: bleaching, colouring, relaxing, perming all permanently damage and raise the cuticle', 'Heat damage from flat irons and blow dryers (especially without heat protectant)', 'Mechanical damage from excessive brushing, tight braiding, and rubbing with rough towels', 'UV damage from prolonged sun exposure without UV protection', 'Chlorine damage from pool swimming without protection']
  },
  challenges: {
    mainChallenge: 'RETENTION is the primary challenge; water and product get in easily but leave just as easily; the raised or damaged cuticle cannot seal properly to keep moisture in',
    frizz: 'Raised cuticles pick up moisture from humid air unevenly, causing the classic humidity frizz; even after moisturising, if humidity changes, frizz returns as the raised cuticle responds to ambient moisture',
    proteinNeeds: 'High porosity hair often benefits from protein treatments; damaged cuticles have gaps and holes; protein temporarily fills these gaps and helps the hair retain moisture better; however, protein overload causes brittleness, so the protein-moisture balance must be monitored'
  },
  productGuidance: {
    bestIngredients: ['Heavy emollients and butters: shea butter, mango butter, cocoa butter — coat the hair shaft and prevent moisture loss', 'Heavy oils: castor oil (very thick, effective for sealing), avocado oil, olive oil — seal the raised cuticles', 'Proteins: hydrolysed proteins (hydrolysed keratin, silk protein, rice protein, wheat protein) — fill gaps in the damaged cuticle temporarily', 'Film-forming agents: flaxseed gel, aloe vera, marshmallow root — create a sealing film over the hair'],
    LOCMethod: 'The LOC Method (Liquid-Oil-Cream) is especially important for high porosity hair: (L) Liquid/Leave-in conditioner — adds moisture; (O) Oil — seals in moisture before the heavy cream; (C) Cream/Butter — heavy emollient over everything to create an outer seal; some also use LCO (Liquid-Cream-Oil); experimenting to find which sealing order works best is common',
    coolRinse: 'Always rinse with cool water — cold water helps close the cuticle and improves moisture retention in high porosity hair; avoid hot water'
  },
  deepConditioning: {
    frequency: 'Weekly deep conditioning is standard for high porosity hair',
    products: 'Heavy, protein-containing conditioners; mask products with ceramides, amino acids, hydrolysed proteins; shea butter masks',
    method: 'Apply to damp hair; cover with plastic cap and allow to sit for 20-45 minutes; heat is optional (unlike low porosity, the cuticle is already open, so heat is not required but can enhance penetration)'
  },
  sealingTechniques: {
    greenhouse: 'Greenhouse method: applying leave-in and heavy butter/oil to hair, covering with a plastic cap overnight, and sleeping in it; body heat creates a warm, humid environment that helps high porosity hair absorb and retain moisture',
    baggyMethod: 'Baggy method: same concept but applied to just the hair ends, tucked into a plastic cap or bag, to target the most damaged and porous hair sections'
  }
};

export const POROSITY_AND_ETHNICITY = {
  title: 'Hair Porosity Patterns Across Ethnic Communities',
  'west-african': {
    typicalPorosity: 'West African hair is typically 4A-4C curl type; this tightly coiled texture has inherently more points of cuticle stress than straighter hair due to the number of bends in the hair shaft; natural (untreated) West African hair tends toward medium to high porosity',
    damageHistory: 'Historical use of relaxers (chemical straightening) in West African and Black African communities has left many women with high porosity or bleached/colour-damaged sections alongside natural new growth; the line of demarcation between relaxed and natural hair is a common breakage point',
    careApproach: 'LOC method with heavy butters; deep conditioning weekly; protective styles to minimise mechanical damage; JBCO for scalp and edges',
    note: 'The natural hair movement has transformed the West African and diaspora hair care landscape; the shift from relaxers to natural texture care has driven enormous growth in products understanding and designed for high porosity coily hair'
  },
  'south-asian': {
    typicalPorosity: 'South Asian hair is typically 1C-2B (straight to wavy); naturally low to medium porosity; typically thick in diameter; the straight or gently wavy cuticle lies relatively flat naturally',
    heatDamage: 'Heat styling (flat ironing the naturally straight-to-wavy hair for extreme sleekness) is common in South Asian beauty culture; this can raise porosity over time particularly at the ends',
    careApproach: 'Oil pre-poo (champi) with coconut or almond oil; typically low porosity approach — lightweight products, adequate moisture, minimal protein',
    oiling: 'South Asian hair benefits from traditional champi (head oil massage) with coconut oil; this is low-porosity-appropriate — coconut oil is a penetrating oil that enters the hair shaft without raising porosity'
  },
  caribbean: {
    typicalPorosity: 'Extremely diverse; Afro-Caribbean hair (3C-4C) similar to West African considerations; mixed-heritage Caribbean communities have enormous variety',
    damageHistory: 'Chemical relaxers have been common; transitioning from relaxed to natural is common; heat damage from hot combs (historically used by Caribbean communities) creates high porosity',
    careApproach: 'High porosity approaches for Afro-Caribbean hair; JBCO (Jamaican Black Castor Oil) is culturally central and effective for sealing high porosity hair'
  },
  arab: {
    typicalPorosity: 'Arab hair is typically 1C-3A; straight to wavy with some curly in the mix depending on heritage; naturally lower porosity; very thick in diameter in many Arab communities',
    challenges: 'Thick, dense Arab hair can be slow to absorb product even at medium porosity because of diameter; argan oil as a conditioning treatment penetrates well; heavy products can weigh down thick Arab hair',
    careApproach: 'Argan oil treatments; lightweight leave-in conditioners for medium porosity; deep conditioning for any heat-damaged sections; note that hair oiling traditions in Arab culture (often weekly) are well-suited to medium porosity maintenance'
  },
  latina: {
    typicalPorosity: 'Enormous diversity; Afro-Latina hair similar to West African or Caribbean considerations; Mestiza Latina hair typically 2C-3B wavy to curly, often medium porosity; Indigenous-heritage Latinas often have very straight, low-medium porosity hair',
    careApproach: 'Product selection should be guided by individual porosity test rather than assumed based on ethnicity due to the enormous genetic diversity within the Latina community'
  },
  'east-asian': {
    typicalPorosity: 'East Asian hair is typically 1A-1C; very straight; individual cuticle scales are arranged very flatly; typically low porosity; hair is often very shiny due to flat cuticle light reflection; thickest individual hair diameter of any ethnic group on average (approximately 80 micrometers vs 60-70 for European and 60-65 for African hair on average)',
    thickDiameter: 'The thick individual hair diameter and flat cuticle mean East Asian hair is naturally very resilient and strong per strand; it does not absorb product or colour quickly; bleaching and colour processing require more time or stronger developer; this is why Asian hair can require double-bleaching for very light colour results',
    chemicalDamage: 'Perming (to add wave or curl) and relaxing (some East Asian hair is relaxed for manageability) can significantly increase porosity in an otherwise low-porosity hair type; Korean straight perms and Japanese thermal reconditioning (rebonding) are designed to minimise damage compared to traditional perms and relaxers',
    careApproach: 'Low-porosity care approach; lightweight camellia or argan oil; minimal protein; heat for deep conditioning penetration; clarifying routinely to prevent buildup'
  },
  'east-african': {
    typicalPorosity: 'East African hair (particularly Somali, Ethiopian, Eritrean hair) often has a distinct hair texture pattern — it can be 3C-4B; some East African hair textures are described as "wavy coily"; typically higher porosity due to curl pattern and potential heat and manipulation damage',
    careApproach: 'High to medium porosity care approaches; protective styles; deep conditioning; sealing with oils and butters',
    note: 'Research on East African hair specifically is limited; most hair care research has focused on West African, South Asian, and East Asian hair textures'
  },
  'south-african': {
    typicalPorosity: 'Black South African hair is typically 4A-4C (similar to West African); similar porosity considerations; Indian South African hair similar to South Asian; Coloured (mixed-heritage) South African hair is extremely diverse in porosity',
    careApproach: 'Similar to West African for Black South African hair; LOC method; heavy sealants; protective styles; marula and baobab oils are locally available and well-suited sealants'
  },
  'black-american': {
    typicalPorosity: 'Reflects the enormous diversity of the Black American community; typically 3B-4C; porosity ranges from natural medium to chemically/heat damaged high; the natural hair movement has dramatically increased awareness of porosity concepts in this community',
    naturalHairMovement: 'The 2000s-2010s natural hair movement (driven by bloggers and YouTubers including Naptural85, NaturallyNatasha, and others) created an enormous body of accessible knowledge about porosity, curl typing, and product selection specifically for Type 3-4 Black American hair; this community has been the primary driver of mainstream understanding of porosity in beauty culture',
    careApproach: 'Highly porosity-specific; the Black American natural hair community has developed the most detailed and nuanced product recommendations for high-porosity coily hair of any community; the LOC method was popularised in this community'
  }
};

export function getPorosityBiology(section) {
  if (!section) return POROSITY_BIOLOGY;
  const map = {
    tests: POROSITY_BIOLOGY.porosityTests,
    float: POROSITY_BIOLOGY.porosityTests.floatTest,
    slide: POROSITY_BIOLOGY.porosityTests.slideTest,
    cuticle: POROSITY_BIOLOGY.whatItIs.cuticleStructure,
    vstype: POROSITY_BIOLOGY.porosityVsCurlType
  };
  return map[section] || POROSITY_BIOLOGY;
}

export function getLowPorosityGuide(section) {
  if (!section) return LOW_POROSITY_GUIDE;
  const map = {
    products: LOW_POROSITY_GUIDE.productGuidance,
    challenges: LOW_POROSITY_GUIDE.challenges,
    routine: LOW_POROSITY_GUIDE.washDayRoutine,
    clarify: LOW_POROSITY_GUIDE.clarifyingRoutine
  };
  return map[section] || LOW_POROSITY_GUIDE;
}

export function getHighPorosityGuide(section) {
  if (!section) return HIGH_POROSITY_GUIDE;
  const map = {
    products: HIGH_POROSITY_GUIDE.productGuidance,
    challenges: HIGH_POROSITY_GUIDE.challenges,
    LOC: HIGH_POROSITY_GUIDE.productGuidance.LOCMethod,
    sealing: HIGH_POROSITY_GUIDE.sealingTechniques,
    causes: HIGH_POROSITY_GUIDE.causes
  };
  return map[section] || HIGH_POROSITY_GUIDE;
}

export function getEthnicPorosityGuide(communityId) {
  const directMap = {
    'west-african': POROSITY_AND_ETHNICITY['west-african'],
    'south-asian': POROSITY_AND_ETHNICITY['south-asian'],
    caribbean: POROSITY_AND_ETHNICITY.caribbean,
    arab: POROSITY_AND_ETHNICITY.arab,
    latina: POROSITY_AND_ETHNICITY.latina,
    'east-asian': POROSITY_AND_ETHNICITY['east-asian'],
    'east-african': POROSITY_AND_ETHNICITY['east-african'],
    'south-african': POROSITY_AND_ETHNICITY['south-african'],
    'black-american': POROSITY_AND_ETHNICITY['black-american']
  };
  return directMap[communityId] || null;
}

export const HAIR_POROSITY_STATS = {
  moduleId: 'hair_porosity_guide',
  version: '1.0.0',
  topics: ['hair porosity', 'low porosity hair', 'high porosity hair', 'hair cuticle', 'LOC method', 'LCO method', 'hair float test', 'heat for low porosity', 'protein sensitivity', 'protein moisture balance', 'JBCO', 'slugging hair', 'baggy method', 'greenhouse method', 'natural hair movement', 'curl type vs porosity', 'hair care by porosity', 'clarifying shampoo', 'hair buildup'],
  communitiesSupported: 9,
  keyFacts: [
    'Hair porosity is more predictive of which products work than curl type (the Andre Walker 1A-4C system); two people with the same curl pattern but different porosity need completely different products',
    'East Asian hair has the largest individual strand diameter of any ethnic group (approximately 80 micrometers) and typically the flattest cuticle, making it naturally low porosity and resistant to colour penetration',
    'The LOC method (Liquid-Oil-Cream) for moisturising high porosity hair was popularised by the Black American natural hair community in the 2000s-2010s and is now the standard approach globally for coily hair moisture retention',
    'Low porosity hair is often PROTEIN-SENSITIVE; protein treatments close the cuticle further, causing stiffness and brittleness; low porosity hair generally needs MORE moisture and LESS protein than high porosity hair',
    'The natural hair community (particularly Black American YouTubers and bloggers from the 2000s-2010s) essentially created the mainstream understanding of hair porosity as a concept; it was not previously well-known outside haircare professional circles',
    'Heat is the key tool for low porosity deep conditioning: applying a heat cap, warm towel, or steamer temporarily opens the tightly closed cuticle to allow product penetration'
  ]
};
