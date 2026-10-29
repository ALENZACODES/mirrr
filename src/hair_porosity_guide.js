/**
 * MIRRR Hair Porosity Guide
 * The science of hair porosity, low/medium/high porosity care,
 * porosity testing, product recommendations by porosity, and
 * ethnic hair porosity patterns
 */

// ─── HAIR SCIENCE FUNDAMENTALS ────────────────────────────────────────────────

export const HAIR_SCIENCE = {
  hair_structure: {
    cuticle: {
      what: 'The outermost layer of each hair strand — composed of overlapping scales, like roof tiles or fish scales. The condition of the cuticle determines porosity, shine, and moisture retention.',
      healthy_cuticle: 'Flat, smooth, overlapping tightly. Reflects light (shine). Resists moisture loss.',
      damaged_cuticle: 'Raised, rough, missing sections. Allows moisture to escape rapidly. Hair appears dull.',
    },
    cortex: {
      what: 'The middle layer — makes up the majority of the hair\'s mass. Contains the melanin (colour) and keratin proteins that give hair its strength and elasticity.',
      damage_here: 'Bleaching, perming, relaxing damage the cortex. This damage cannot be repaired — only new growth is undamaged.',
    },
    medulla: {
      what: 'The innermost layer — present in thick, coarse hair; absent in fine hair. Function not fully understood but may contribute to strength.',
    },
  },

  melanin_and_hair: {
    eumelanin: 'Black and brown pigment — dominant in darker hair. Higher eumelanin = darker hair, more UV protection.',
    pheomelanin: 'Red and yellow pigment — in red and blonde hair. Less UV protection than eumelanin.',
    greying: 'Melanocytes (pigment-producing cells in follicle) stop producing melanin with age. Affected by genetics primarily. Stress acceleration is real but overstated — telogen effluvium from severe stress can cause hair to grow back differently.',
    dark_skin_UV: 'Darker hair has more eumelanin, which absorbs UV radiation. Dark hair needs UV protection too, however — UV degrades keratin and discolours colour-treated hair.',
  },

  hair_growth_cycle_basics: {
    anagen: '2-7 years — active growth phase. Longer anagen = longer potential hair length.',
    catagen: '2-3 weeks — transition, follicle prepares to shed.',
    telogen: '3-4 months — resting phase. Hair is shed. 50-100 hairs shed daily is normal.',
    exogen: 'Active shedding phase (some models separate this from telogen).',
    ethnic_note: 'Afro-textured hair follicles are curved/helical — hair grows in a spiral rather than straight out of the follicle. This coiling means afro-textured hair naturally intertwines, appears shorter than its actual length (shrinkage), and is more prone to tangling.',
  },
};

// ─── POROSITY SCIENCE ─────────────────────────────────────────────────────────

export const POROSITY_SCIENCE = {
  definition: 'Hair porosity is the hair\'s ability to absorb and retain moisture. It is determined by the state of the cuticle layer — how open or closed the cuticle scales are.',

  factors_affecting_porosity: {
    genetics: 'Natural baseline porosity is genetic. Some people naturally have more tightly packed cuticle scales; others have more open cuticles.',
    hair_type: 'Afro-textured and curly hair tends toward higher natural porosity due to the curved follicle and coiled structure creating more points of cuticle disruption along each strand.',
    damage: 'Chemical damage (bleach, relaxers, perms) permanently raises and damages the cuticle, increasing porosity.',
    heat: 'Repeated heat styling raises the cuticle temporarily and permanently over time.',
    pH: 'High pH (alkaline) raises the cuticle; low pH (acidic) closes it. This is why acidic rinses (diluted apple cider vinegar) temporarily flatten the cuticle.',
    age: 'Hair porosity often increases with age as cuticle integrity diminishes.',
  },

  porosity_spectrum: {
    note: 'Porosity is a spectrum, not three fixed categories. The low/medium/high framework is a useful simplification. Hair can also be different porosity in different sections (higher at ends, where damage accumulates; lower at roots where new growth emerges).',
  },
};

// ─── LOW POROSITY ─────────────────────────────────────────────────────────────

export const LOW_POROSITY = {
  characteristics: {
    cuticle: 'Tightly closed, flat, overlapping scales. Very resistant to moisture entry.',
    appearance: 'Often shiny and healthy-looking — the tight cuticle reflects light well.',
    behaviour: [
      'Takes a long time to get wet in the shower',
      'Products sit ON top of hair rather than absorbing in',
      'Hair takes a very long time to dry',
      'Product buildup is a major issue — products layer without being absorbed',
      'Hair feels coated or greasy even with light products',
      'May resist colour treatments (same closed cuticle resists dye entry)',
    ],
  },

  how_to_tell: {
    float_test: 'Take a clean strand of hair (wash out products first). Place in a glass of water at room temperature. Low porosity: floats for a long time (30+ minutes) before sinking, or never sinks. High porosity: sinks quickly (within 1-2 minutes). Note: this test is imprecise and affected by product buildup.',
    water_test: 'Spray water on a section. Low porosity: water beads and sits on the hair surface. High porosity: water absorbs immediately.',
    slide_test: 'Slide fingers from tip to root along a strand. Low porosity: smooth — the flat cuticle. High porosity: rough, bumpy feeling — raised cuticle scales.',
  },

  care_principles: {
    heat_to_open_cuticle: 'Low porosity hair NEEDS heat to open the cuticle for product absorption. Use heat during conditioning treatments: hair dryer on low while deep conditioning (with a plastic cap), steam treatment, or hot oil treatment.',
    lightweight_products: 'Heavy butters and thick oils sit on the surface without penetrating. Choose lightweight liquids and water-based products.',
    humectants: 'Aloe vera, glycerin, panthenol attract moisture from air into the hair shaft.',
    clarify_regularly: 'Product buildup accumulates easily on low porosity hair. Clarify (chelating shampoo or baking soda rinse) monthly to remove buildup.',
  },

  best_products_types: {
    conditioners: 'Protein-free conditioners (protein can make low porosity hair stiff — the cuticle is already tightly closed); humectant-rich',
    oils: 'Lightweight oils that penetrate: argan oil, sweet almond oil, jojoba oil, avocado oil. NOT heavy butters.',
    avoid: 'Heavy shea butter as a styler, thick creams, protein treatments (generally)',
  },

  ethnic_context: {
    note: 'Low porosity hair can occur across all ethnicities. Within afro-textured hair, low porosity is somewhat less common than high porosity, but is a real pattern particularly in virgin (unprocessed) 4a-4c type hair.',
    challenge: 'The combination of tight curl pattern and low porosity means water and product seem to repel. Heat is the key — warm water, warm conditioner, steam cap.',
  },
};

// ─── MEDIUM POROSITY ──────────────────────────────────────────────────────────

export const MEDIUM_POROSITY = {
  characteristics: {
    cuticle: 'Slightly raised but not damaged — a balance between open and closed.',
    behaviour: [
      'Absorbs moisture at an even, moderate rate',
      'Holds styles well',
      'Takes colour predictably',
      'Not prone to extreme dryness or extreme product buildup',
    ],
    ideal: 'Medium porosity is often described as the "ideal" — hair that behaves predictably and responds well to most products.',
  },

  care_principles: {
    maintenance_focus: 'The goal is maintaining medium porosity — which means preventing damage that would increase porosity. Protecting from heat and chemical processes is primary.',
    balanced_products: 'Medium porosity hair tolerates a range of products. Neither exclusively lightweight nor exclusively heavy.',
    protein_moisture: 'A balanced protein-moisture regimen keeps medium porosity hair resilient.',
  },

  maintaining: {
    heat_protectant: 'Essential — heat raises cuticle, gradually moving hair toward high porosity.',
    deep_condition: 'Weekly to bi-weekly, depending on styling habits.',
    protein: 'Monthly protein treatment to maintain structure.',
  },
};

// ─── HIGH POROSITY ────────────────────────────────────────────────────────────

export const HIGH_POROSITY = {
  characteristics: {
    cuticle: 'Raised, rough, damaged cuticle scales — may have gaps or missing sections.',
    causes: ['Chemical damage (bleach, relaxer, perm)', 'Cumulative heat damage', 'Environmental damage (hard water, UV, chlorine)', 'Genetic (some naturally higher porosity)', 'Physical damage (rough towel drying, aggressive brushing on wet hair)'],
    behaviour: [
      'Absorbs water quickly (get wet fast in shower)',
      'Loses moisture equally quickly — dries fast',
      'Product absorbs quickly but doesn\'t hold',
      'Frizzy — moisture from air enters and expands the hair shaft',
      'Prone to tangling (raised cuticle catches on adjacent strands)',
      'Breakage-prone due to damaged structure',
      'May feel rough or coarse',
      'Colour fades rapidly',
    ],
  },

  care_principles: {
    goal: 'Close the cuticle as much as possible to trap moisture in. Layer products to seal moisture. Fill gaps in cuticle with protein.',
    protein_fills_gaps: 'Protein treatments fill gaps in damaged cuticles — hydrolysed keratin, hydrolysed collagen, rice protein. This is where protein treatments are most important.',
    seal_with_heavy_oils: 'Heavy oils (castor oil, jamaican black castor oil, shea butter, mango butter) create a sealant layer over the cuticle, slowing moisture loss.',
    acidic_rinses: 'Apple cider vinegar rinse (diluted: 1 part ACV to 4 parts water) flattens the cuticle temporarily. Use as final rinse.',
    cold_water_rinse: 'Cold water at end of shower contracts the cuticle temporarily — helps seal in conditioner.',
    LOC_LCO_method: {
      LOC: { sequence: 'Liquid → Oil → Cream', for: 'High porosity hair needing strong sealing (oil creates barrier, cream locks in)' },
      LCO: { sequence: 'Liquid → Cream → Oil', for: 'Also effective; cream helps distribute; oil seals last' },
    },
  },

  protein_moisture_balance: {
    critical: 'High porosity hair needs BOTH protein AND moisture, but the balance matters. Too much protein without moisture = brittle, rigid hair that breaks. Too much moisture without protein = limp, overly soft hair that stretches and breaks.',
    test: 'Take a wet strand and stretch gently. Breaks immediately without stretching → needs moisture. Stretches significantly but doesn\'t return to shape → needs protein. Stretches and bounces back → balanced.',
  },

  ethnic_context: {
    afro_textured: 'Naturally high porosity is more common in afro-textured hair due to the coiled structure and more cuticle disruption points per inch. Chemical relaxers significantly increase porosity further. Transitioning from relaxer to natural often means managing very high porosity new-growth and lower-porosity relaxed ends simultaneously.',
    bleached_hair: 'Any ethnic background — bleaching hair significantly increases porosity. Black hair bleached to platinum blonde has undergone massive cuticle disruption; products that fill and seal are essential.',
  },
};

// ─── PRODUCT GUIDE BY POROSITY ────────────────────────────────────────────────

export const PRODUCTS_BY_POROSITY = {
  low_porosity: {
    shampoos: ['Kinky Curly Come Clean (clarifying)', 'As I Am Curl Clarity Clarifying Shampoo', 'Malibu C Hard Water Weekly Demineralizer'],
    conditioners: ['As I Am Coconut CoWash (lightweight)', 'Mielle Organics Babassu & Mint Deep Conditioner (heat optional)', 'Camille Rose Curl Love Moisture Milk'],
    leave_in: ['Kinky Curly Knot Today (lightweight)', 'TGIN Miracle RepaiRx Curl Milk'],
    oils: ['Jojoba oil (closely mimics sebum)', 'Argan oil', 'Sweet almond oil', 'Camellia (green tea seed) oil'],
    avoid: ['Heavy shea butter as leave-in or styler', 'Castor oil as primary oil (too heavy)', 'Most DIY egg/protein treatments'],
  },

  medium_porosity: {
    shampoos: ['Shea Moisture Jamaican Black Castor Oil Strengthen & Restore Shampoo', 'Mielle Organics Pomegranate & Honey Moisturising Shampoo'],
    conditioners: ['SheaMoisture Jamaican Black Castor Oil Strengthen & Restore', 'Aussie Miracle Moist Conditioner (budget-friendly)'],
    leave_in: ['Most leave-in conditioners work — experiment for preference'],
    oils: ['Mix of weights — coconut, argan, and occasional castor oil'],
    protein: 'Monthly protein treatment to maintain',
  },

  high_porosity: {
    shampoos: ['Shea Moisture Manuka Honey & Mafura Oil Hydrating Shampoo', 'Aunt Jackie\'s Oh So Clean Moisturising & Softening Shampoo'],
    conditioners: ['Protein-moisture balanced: Aphogee 2-Minute Keratin Reconstructor (protein treatment)', 'Olaplex No. 5 Bond Maintenance Conditioner', 'Briogeo Don\'t Despair Repair Deep Conditioning Mask'],
    sealants: ['Jamaican Black Castor Oil (Tropic Isle, Sunny Isle)', 'Raw shea butter', 'Mango butter'],
    acidic_rinse: 'Apple cider vinegar diluted rinse after washing',
    LOC_method: 'Apply in Liquid → Oil → Cream sequence',
    protein_treatments: ['Aphogee 2-Minute Reconstructor (light)', 'Aphogee Two-Step Protein Treatment (intense — monthly maximum)', 'Shea Moisture Jamaican Black Castor Oil Strengthen & Restore Treatment Masque'],
  },
};

// ─── POROSITY BY COMMUNITY ────────────────────────────────────────────────────

export const POROSITY_BY_COMMUNITY = {
  black_american: {
    patterns: 'Type 4 hair (4a, 4b, 4c) tends to medium-to-high natural porosity. Relaxed hair is typically high porosity. Natural hair transitioning from relaxer often has mixed porosity sections.',
    priorities: ['Moisture retention', 'Sealing the cuticle', 'Protein-moisture balance', 'Scalp health for healthy new growth'],
    products: 'Black-owned brands have developed the most innovative products for high-porosity natural hair — SheaMoisture, Mielle Organics, Camille Rose, Alikay Naturals, As I Am.',
  },

  south_asian: {
    patterns: 'South Asian hair is typically straight to wavy (Type 1-2), often fine to medium in width, medium to low porosity when healthy. Hair is often very dark (high eumelanin) and can be strong.',
    common_issues: 'Oiliness (seborrheic dermatitis is common — see scalp guide), scalp health, and managing thick/heavy hair.',
    traditional_care: 'Champi (head oil massage) maintains the cuticle; coconut and amla oil application before washing coats cuticle protectively.',
  },

  east_asian: {
    patterns: 'Type 1 straight hair with typically round follicle cross-section. Asian hair is often thicker in diameter than European or African hair but fewer strands per scalp. Generally low to medium porosity when healthy.',
    challenges: 'Maintaining volume (individual strands are thicker but total density may be lower), managing shine without greasiness.',
    note: 'Korean and Japanese beauty innovation has produced some of the best lightweight products for low-porosity straight hair.',
  },

  arab: {
    patterns: 'Highly diverse — can range from Type 1 straight (Persian/Iranian) to Type 3-4 curly (some Arab regions, depending on geographic heritage). Medium to high porosity common.',
    traditional: 'Argan oil (Moroccan argan is the original beauty oil), olive oil, black seed oil are traditional cuticle sealants.',
  },

  latina: {
    patterns: 'Extremely diverse across Central American, South American, Caribbean, and Spanish heritages. Can range from straight Type 1 to coily Type 4. Often Type 2-3.',
    traditional: 'Coconut oil, olive oil, rice water, avocado masks are traditional porosity management techniques across Latin cultures.',
  },

  caribbean: {
    patterns: 'Often Type 3-4, medium-to-high natural porosity.',
    traditional: 'Coconut oil is the primary traditional sealant. Bay rum for scalp. Rum and honey hair masks.',
  },

  west_african: {
    patterns: 'Typically Type 4 afro-textured, often high porosity naturally due to coiled structure. Complex diversity across the continent.',
    traditional: 'Shea butter application for sealing is deeply traditional. Black soap for cleansing.',
  },

  east_african: {
    patterns: 'Highly diverse — Ethiopian and Somali hair often Type 4a-4c; coastal communities influenced by Arab and South Asian mixing may have different patterns.',
    traditional: 'Butter (Ethiopian niter kibbeh — clarified spiced butter) historically used for hair; sesame oil; henna.',
  },

  south_african: {
    patterns: 'Diverse — Zulu, Xhosa, and many South African communities have Type 3-4 hair. Coloured South African community highly diverse.',
    traditional: 'Amafutha (fat/oil for hair) — traditional fat-based preparations for moisture and shine.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getHairScience() {
  return HAIR_SCIENCE;
}

export function getPorositySciece() {
  return POROSITY_SCIENCE;
}

export function getLowPorosityGuide() {
  return LOW_POROSITY;
}

export function getMediumPorosityGuide() {
  return MEDIUM_POROSITY;
}

export function getHighPorosityGuide() {
  return HIGH_POROSITY;
}

export function getProductsByPorosity(porosity) {
  return PRODUCTS_BY_POROSITY[porosity] || null;
}

export function getPorosityForCommunity(communityId) {
  return POROSITY_BY_COMMUNITY[communityId] || null;
}

export function diagnosePorosity(floatResult, waterBeadsResult, slideResult) {
  let score = 0;
  if (floatResult === 'floats') score--;
  if (floatResult === 'sinks') score++;
  if (waterBeadsResult === 'beads') score--;
  if (waterBeadsResult === 'absorbs') score++;
  if (slideResult === 'smooth') score--;
  if (slideResult === 'rough') score++;

  if (score <= -1) return { porosity: 'low', guide: getLowPorosityGuide() };
  if (score >= 1) return { porosity: 'high', guide: getHighPorosityGuide() };
  return { porosity: 'medium', guide: getMediumPorosityGuide() };
}

export const HAIR_POROSITY_STATS = {
  porosityLevels: 3,
  communitiesCovered: Object.keys(POROSITY_BY_COMMUNITY).length,
  testMethods: 3,
};
