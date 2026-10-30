/**
 * MIRRR Hair Care Science Extended
 * Protein treatments, bond repair, porosity deep dive,
 * hair biology, chemical damage science, and ethnic hair science
 */

// ─── HAIR BIOLOGY ─────────────────────────────────────────────────────────────

export const HAIR_BIOLOGY = {
  structure: {
    cuticle: 'The outermost layer of the hair shaft. Made of overlapping, scale-like cells (like roof shingles). When cuticles lie flat and smooth, hair looks shiny and light reflects uniformly. When cuticles are raised or damaged, hair looks dull, feels rough, tangles easily.',
    cortex: 'The middle layer — the bulk of the hair shaft. Contains keratin protein, melanin (pigment), and the disulfide bonds that give hair its strength and shape. The cortex is what is altered during colouring and perming.',
    medulla: 'The innermost layer, present only in thick, coarse hair. Not present in fine or blonde hair. Not functionally significant for most hair care purposes.',
    cuticle_detail: 'Cuticle scales are held down by the lipid (fatty acid) layer on the surface. Chemical processes (colour, bleach, relaxers) and mechanical damage (heat, friction) strip this lipid layer and raise the cuticle.',
  },
  growth: {
    anagen: 'The active growth phase. Lasts 2-7 years. Determines maximum possible length. Genetics control anagen length — the reason some people can grow hair to their feet and others max out at shoulder length.',
    catagen: 'The transition phase. Hair detaches from the blood supply. Lasts 2-3 weeks.',
    telogen: 'The resting phase. Lasts 3-4 months. The hair is still in the follicle but not growing. Ends with the hair shedding.',
    shedding: '50-100 hairs per day is normal shedding (telogen shedding). After illness, surgery, hormonal changes, or stress, a larger than normal percentage of follicles shift to telogen simultaneously — this presents as heavy shedding 3-4 months later (telogen effluvium).',
    growth_rate: 'Average hair growth: 0.5 inches (1.25cm) per month = 6 inches (15cm) per year. Slightly faster in summer (increased circulation). African hair tends to grow at the same rate but has more curl compression, making growth appear slower. Retention (keeping the inches you grow) is the real challenge for tightly coiled hair.',
  },
  melanin: {
    eumelanin: 'Brown-to-black pigment. More eumelanin = darker hair. People with high eumelanin: Black, East Asian, South Asian, Middle Eastern, Mediterranean.',
    phaeomelanin: 'Yellow-to-red pigment. More phaeomelanin = red or strawberry blonde hair.',
    
  },
};

// ─── HAIR POROSITY ────────────────────────────────────────────────────────────

export const HAIR_POROSITY = {
  definition: 'Porosity describes how well hair absorbs and retains moisture. It is determined by the state of the cuticle layer.',
  types: {
    low: {
      name: 'Low Porosity',
      cuticle_state: 'Cuticles lie flat and tightly packed. Hard for water or products to penetrate INTO the hair shaft.',
      characteristics: ['Products sit on top of hair rather than absorbing', 'Hair takes a long time to get fully wet', 'Hair takes a long time to dry', 'Product buildup is common', 'Water beads on the surface'],
      what_works: ['Heat opens the cuticle — use a steamer, warm water, or heated deep conditioning cap', 'Lightweight products (water-based, liquid moisturisers)', 'Humectants work well when environmental humidity is adequate', 'Clarifying shampoo regularly to clear buildup', 'Protein treatments are usually NOT needed — the structure is intact'],
      what_to_avoid: ['Heavy butters and oils that sit on top', 'Overly thick creams', 'Protein-heavy products — low porosity hair is usually protein-sensitive'],
      
    },
    medium: {
      name: 'Medium / Normal Porosity',
      cuticle_state: 'Cuticles are slightly raised — enough to allow moisture in but not so raised that it escapes immediately.',
      characteristics: ['Absorbs moisture well', 'Retains moisture well', 'Accepts colour and chemical treatments evenly', 'Dries in a reasonable time'],
      what_works: ['Most products work well', 'Balanced protein and moisture routine', 'Standard care routine'],
      note: 'Medium porosity hair is the "ideal" state. If your hair is medium porosity, your main goal is maintaining it.',
    },
    high: {
      name: 'High Porosity',
      cuticle_state: 'Cuticles are raised, damaged, or have gaps. Water enters easily but also escapes easily.',
      characteristics: ['Absorbs water very quickly', 'Dries quickly', 'Frizzy in humid weather (moisture enters and expands the shaft rapidly)', 'Tangles easily', 'May feel rough or porous to touch', 'Colour fades quickly'],
      causes: ['Chemical treatments (colour, bleach, relaxers)', 'Heat damage', 'Mechanical damage (excessive brushing, friction, tight styles)', 'Can be genetic (some people have naturally high porosity)'],
      what_works: ['Protein treatments (fill in gaps in the cuticle)', 'Leave-in conditioners', 'Sealing with oils AFTER water-based moisturisers (the LOC/LCO method)', 'Cold water rinses (temporarily closes the cuticle)', 'Anti-humidity products or protective styles in humid weather', 'Deep conditioning regularly'],
      what_to_avoid: ['Skipping conditioner', 'Heat without protection'],
    },
  },
  how_to_test: {
    float_test: 'The float test: take a few clean, product-free strands and place them in a glass of water. Low porosity: hair floats on top for 2-4 minutes. Medium: sinks slowly over 1-2 minutes. High porosity: sinks quickly to the bottom. Note: the float test is not perfectly accurate — it can be affected by buildup on the hair.',
    feel_test: 'Run your fingers up the hair shaft from tip to root. Smooth: low porosity (cuticles lying flat). Rough or bumpy: high porosity (raised cuticles).',
    spray_test: 'Spray water on a section of clean, dry hair. High porosity absorbs immediately. Low porosity beads on top.',
  },
};

// ─── PROTEIN SCIENCE ──────────────────────────────────────────────────────────

export const PROTEIN_SCIENCE = {
  why_protein: 'Hair is 95% keratin protein. Chemical processes, heat, and mechanical damage break the protein bonds in the hair shaft, leaving gaps in the cuticle and cortex. Protein treatments temporarily fill these gaps, restoring strength, reducing breakage, and improving elasticity and texture.',
  types: {
    hydrolysed_keratin: {
      name: 'Hydrolysed Keratin',
      molecular_size: 'Small — penetrates the hair shaft',
      benefit: 'Fills internal gaps in the cortex. Rebuilds internal structure.',
      products: 'Found in salon protein treatments (Kerastase, Olaplex No. 3 contains bis-aminopropyl diglycol dimaleate, not keratin but comparable bond repair).',
    },
    hydrolysed_collagen: {
      name: 'Hydrolysed Collagen',
      molecular_size: 'Medium',
      benefit: 'Adds flexibility and strength. Coats and smoothes the cuticle.',
      products: 'Common in "strengthening" conditioners.',
    },
    hydrolysed_wheat_protein: {
      name: 'Hydrolysed Wheat Protein',
      molecular_size: 'Small to medium',
      benefit: 'Strengthens, adds body to fine hair, film-forming.',
      products: 'Common in drugstore protein conditioners.',
    },
    rice_water: {
      name: 'Rice Water (inositol + proteins)',
      molecular_size: 'Inositol is very small',
      benefit: 'Inositol penetrates the hair shaft and fills damage from inside. Fermented rice water has additional amino acids.',
      products: 'DIY rice water rinses (plain or fermented). Asian hair tradition — particularly Yao women of Huangluo village, China.',
    },
    egg: {
      name: 'Egg Protein',
      molecular_size: 'Variable — some penetrate, some coat',
      benefit: 'High in protein (specifically sulfur amino acids which are part of keratin). Strengthens and adds shine.',
      how_to_use: 'DIY egg mask: 1-2 raw eggs applied to damp hair for 30 min, rinse with cool water (hot water COOKS the egg and you will spend an hour removing scrambled egg from your hair).',
    },
  },
  protein_moisture_balance: {
    overview: 'Hair needs BOTH protein and moisture in balance. Too much protein without enough moisture = brittle, hard, snapping hair (protein overload). Too much moisture without enough protein = mushy, limp, overly stretchy hair (moisture overload/hygral fatigue).',
    signs_of_overload: {
      protein: 'Hair feels hard, straw-like, snaps when stretched with almost no elasticity. Finish is dull. Breaks easily.',
      moisture: 'Hair feels mushy, soft, limp, spongy when wet. Stretches excessively when pulled and doesn\'t spring back. High hygral fatigue risk with naturally porous hair.',
    },
    the_strand_test: 'Take a single strand from your head. Wet it. Gently stretch it. Healthy hair stretches noticeably before breaking, then returns to shape. Snaps immediately = needs moisture. Stretches too far and doesn\'t return = needs protein.',
  },
  how_to_use: {
    frequency: 'Most hair needs a protein treatment every 4-6 weeks, or after any chemical process. Low porosity hair: 1-2x per year or less. High porosity / damaged hair: monthly.',
    how_to: 'Apply to clean, damp hair. Leave on for the product-specified time (usually 5-30 minutes for most products; up to 60 for intense treatments). Rinse thoroughly. Follow with a moisturising conditioner — protein treatments are typically drying and need moisture after.',
    caution: 'More is not better. Do not do protein treatments every week unless your hair is severely damaged and you are monitoring the results. Protein overload damage is real.',
  },
};

// ─── BOND REPAIR SCIENCE ──────────────────────────────────────────────────────

export const BOND_REPAIR_SCIENCE = {
  disulfide_bonds: 'The structural backbone of hair. These covalent bonds between sulfur atoms in keratin chains give hair its strength, elasticity, and curl pattern. Chemical processes (bleach, colour, relaxers, perms) intentionally BREAK these bonds to change the hair structure. They are supposed to reform but often do so incompletely, leaving damaged hair.',
  what_damages_bonds: ['Bleach: oxidises the melanin but also damages protein structure and disulfide bonds', 'Hair colour: particularly repeated colouring in the same areas', 'Relaxers: permanently break disulfide bonds to straighten curl', 'Perms/Jheri curls: break and reform bonds in a new configuration', 'Chemical texturisers', 'Physical damage: thermal tools break hydrogen bonds (heat damage)'],
  bond_repair_ingredients: {
    olaplex: {
      ingredient: 'Bis-aminopropyl diglycol dimaleate',
      mechanism: 'Cross-links and reconnects broken disulfide bonds within the hair cortex. The original bond-repair technology. Developed in 2014.',
      how_to_use: 'Olaplex No. 0 and No. 1 are salon treatments. No. 3 is a home pre-shampoo treatment (30 min on dry or damp hair, wash out, shampoo, condition normally). No. 4, 5, 6, 7 are maintenance.',
    },
    k18: {
      ingredient: 'K18 peptide (a bio-mimetic peptide designed to reconnect broken keratin chains)',
      mechanism: 'A synthetic peptide that mimics the structure of hair\'s natural keratin chains. Reconnects broken polypeptide chains within the cortex.',
      how_to_use: 'Applied to washed, towel-dried hair as a leave-in mask. 4 minutes. Do NOT rinse. Continue styling. No. 1 step in hair care order.',
    },
    bhave_rescue: {
      ingredient: 'Hydrolysed vegetable protein and cystine',
      mechanism: 'Cystine (the oxidised dimer form of cysteine) is a direct precursor to disulfide bonds. Provides the raw material for bond repair.',
    },
    wella_fusionplex: {
      ingredient: 'AMT technology (aminosilicone and Cortex Filler technology)',
      mechanism: 'Fills damaged areas within the cortex.',
    },
  },
  bond_repair_timing: 'Bond repair is most effective when applied during or after a chemical process. Using a bond-building additive (like Olaplex No. 1) mixed into bleach or colour IN the salon can significantly reduce damage as the chemical process occurs.',
};

// ─── HEAT DAMAGE ──────────────────────────────────────────────────────────────

export const HEAT_DAMAGE_SCIENCE = {
  what_happens: {
    hydrogen_bonds: 'Hydrogen bonds in the hair shaft are broken by water and heat. When hair is dried and restyled with heat, these bonds reform in the new configuration. This is temporary (washes out). This is how blowouts and curling iron sets work.',
    protein_denaturation: 'At very high temperatures (above 230°C / 446°F), keratin proteins begin to denature (permanently change structure). This is irreversible. This is "heat damage".',
    cortex: 'Severe heat damage causes bubbles in the cortex (visible under electron microscope), weakening the shaft and causing breakage.',
    cuticle: 'Heat raises and damages the cuticle, causing roughness, loss of shine, and porosity increase.',
  },
  temperatures: {
    safe_max: '180-200°C (350-390°F): can be used on most hair types WITH heat protectant',
    caution_zone: '200-220°C (390-430°F): use sparingly; always with heat protectant; fine and processed hair at high risk',
    danger_zone: '230°C+ (446°F+): protein denaturation begins; permanent damage possible for all hair types',
    fine_hair_note: 'Fine, bleached, or chemically treated hair is heat-damaged at LOWER temperatures. Fine hair: max 150°C (300°F). Bleached hair: max 180°C (350°F).',
  },
  heat_protectants: {
    how_they_work: 'Heat protectants work by forming a barrier between the hair shaft and the heat tool. They also often have high heat conductivity, which distributes heat more evenly rather than in concentrated hot spots.',
    key_ingredients: ['Cyclomethicone and dimethicone (silicones): film-forming, heat-protective, add slip and shine', 'Phenyl trimethicone: lighter silicone, very high thermal protection', 'BTMS (behentrimonium methosulfate): conditioning, film-forming', 'Hydrolysed proteins: temporary protein bond support during heat styling'],
    thermal_protection_threshold: 'Products specify their heat protection threshold (e.g. "protects up to 450°F/230°C"). Match the product threshold to the tool temperature you use.',
    application: 'Apply to damp or dry hair before any heat tool use. Focus on mid-lengths to ends. A pea-sized amount in the palm, emulsified, then applied — not directly from bottle to hair (concentrates on one spot).',
  },
  signs_of_heat_damage: ['Loss of curl pattern in naturally curly hair (straight sections that persist after washing)', 'Excessive split ends or mid-shaft splits', 'Lack of elasticity (snaps without stretching)', 'Dullness', 'Rough texture that does not smooth', 'Excessive breakage'],
  recovery: 'True heat damage (protein denaturation) cannot be reversed — the damaged portion must grow out or be cut. Bond repair treatments and protein treatments can strengthen the remaining healthy portions. Trimming damaged ends prevents breakage from travelling up the shaft.',
};

// ─── ETHNIC HAIR SCIENCE ──────────────────────────────────────────────────────

export const ETHNIC_HAIR_SCIENCE = {
  afro_textured: {
    community: 'West African, East African, South African, Black American, Caribbean',
    unique_biology: 'Afro-textured hair has an elliptical (oval or flattened) cross-section, compared to the round cross-section of Asian straight hair and the slightly oval cross-section of wavy European hair. The more oval the cross-section, the curlier the hair. The curl pattern is also due to the follicle being curved rather than straight.',
    porosity_tendency: 'Afro-textured hair has naturally occurring "windows" (gaps) in the cuticle where the curls bend most sharply — creating naturally higher porosity at these points. This is NOT damage — it is structural.',
    sebum_distribution: 'Sebum from the scalp travels down the hair shaft with difficulty on tightly coiled hair — the curls impede the downward flow. This is why 4C hair can feel driest at the ends despite having a healthy scalp. Finger detangling and techniques that allow sebum to travel down the shaft are important.',
    breakage_risk: 'The "stress points" at the tightest bends in 4C hair are where breakage most commonly occurs. Tension from styling, heat, or rough handling concentrated at these points.',
    
  },
  asian_hair: {
    community: 'East Asian',
    unique_biology: 'East Asian hair (Japanese, Chinese, Korean) has a round cross-section, the highest density of medulla, and the largest diameter of any hair type. It is typically straight (follicle is straight/perpendicular to scalp). Black Asian hair has the highest density of melanin (eumelanin).',
    porosity_tendency: 'Naturally low porosity — cuticle lies very flat. Hair is very shiny due to the flat cuticle and round cross-section (maximum light reflection). Resistant to chemical processes.',
    unique_considerations: 'The high density and diameter of East Asian hair makes it resistant to bleach and requires more processing time. Low porosity means product absorption is slow — heat or steam helps.',
  },
  south_asian: {
    community: 'South Asian',
    unique_biology: 'South Asian hair varies significantly — from wavy (1C-2B) to tightly coiled in some communities. Most common: thick, dark, with a slightly oval cross-section giving wave or loose curl.',
    oil_culture: 'The deep tradition of oil application in South Asian hair care (particularly coconut and mustard oil) is functionally effective. Pre-shampoo oiling BEFORE washing helps reduce hygral fatigue (swelling when wet), provides slip for detangling, and protects the cuticle during washing.',
    common_concerns: 'Oiliness at the scalp combined with dryness at the ends. Premature greying (particularly common in South Asian populations — genetic and possibly related to lower melanin reserve). Excess shedding during telogen effluvium (stress, postpartum).',
  },
  arab: {
    community: 'Arab',
    unique_biology: 'Arab hair varies from straight to wavy to curly (2A-3B range is most common). Typically dark and dense.',
    traditions: 'Argan oil application is a traditional practice. Hair oiling before hammam. Henna treatment (strengthens and adds red tint).',
    common_concerns: 'Frizz, especially in humid Middle Eastern coastal climates. Dryness from heat and sun exposure.',
  },
  latin: {
    community: 'Latina',
    unique_biology: 'Latin American communities have the most diverse range of hair types due to the diverse genetic ancestry (Indigenous, West African, Spanish, Portuguese, other European). Hair can range from straight to tightly coiled across Latin communities.',
    note: '"Latina hair" is not a single type — a Mexican-Indigenous woman and an Afro-Latina woman from Brazil have completely different hair biology. The community encompasses the full hair type spectrum.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getHairBiology(section) {
  return section ? HAIR_BIOLOGY[section] : HAIR_BIOLOGY;
}
export function getHairPorosityType(type) {
  return type ? HAIR_POROSITY.types[type] : HAIR_POROSITY;
}
export function getPorosityTest() { return HAIR_POROSITY.how_to_test; }
export function getProteinScience() { return PROTEIN_SCIENCE; }
export function getProteinType(type) {
  return PROTEIN_SCIENCE.types[type] || PROTEIN_SCIENCE.types;
}
export function getBondRepairScience() { return BOND_REPAIR_SCIENCE; }
export function getHeatDamageScience() { return HEAT_DAMAGE_SCIENCE; }
export function getEthnicHairScience(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_HAIR_SCIENCE[key] || Object.values(ETHNIC_HAIR_SCIENCE);
}

