/**
 * MIRRR Skin Microbiome Guide
 * The skin microbiome, diversity and function, disruption and repair,
 * probiotic skincare, prebiotic ingredients, microbiome differences
 * across ethnic communities and body sites
 */

// ─── SKIN MICROBIOME BASICS ───────────────────────────────────────────────────

export const SKIN_MICROBIOME_BASICS = {
  what_is_it: {
    definition: 'The skin microbiome is the community of trillions of microorganisms — bacteria, fungi, viruses, mites, and archaea — that live on and in human skin. The collective term for these organisms and their genetic material is the "skin microbiome" or "cutaneous microbiome."',
    diversity: 'A single human body hosts approximately 1,000 bacterial species and 1 million-1 trillion individual microbial cells on the skin. This community is highly individual — your skin microbiome is as unique as your fingerprint.',
    relationship: 'The relationship between humans and skin microorganisms is largely commensal (mutually beneficial or neutral), not parasitic. These organisms have coevolved with humans over millions of years.',
  },

  key_organisms: {
    bacteria: {
      cutibacterium_acnes: {
        what: 'Formerly Propionibacterium acnes — the most studied skin bacterium. Lives primarily in follicles where sebum is abundant.',
        nuanced: 'C. acnes is not simply "bad" — healthy skin has it. Different strains (phylotypes) of C. acnes may behave differently — some are associated with healthy skin. It becomes problematic when follicles are blocked (comedones form) and the microenvironment changes, allowing inflammatory strains to dominate.',
      },
      staphylococcus_epidermidis: {
        what: 'Typically a beneficial commensal. Produces substances that inhibit pathogens including S. aureus. Plays a role in educating the immune system.',
      },
      staphylococcus_aureus: {
        what: 'A pathobiont — can be benign in small amounts but problematic in large numbers. Found in high abundance in eczema (atopic dermatitis) skin — its presence worsens the inflammatory cycle.',
        ethnic_note: 'S. aureus colonisation is higher in atopic dermatitis, which has higher prevalence in some ethnic groups.',
      },
      malassezia: {
        what: 'Actually a FUNGUS — a lipophilic (fat-loving) yeast that lives on all human skin, particularly in oily areas. Feeds on skin lipids.',
        role: 'Normal commensal on healthy skin. Can become problematic: dandruff (Malassezia overgrowth on scalp), seborrheic dermatitis, pityriasis versicolor, and Malassezia folliculitis (fungal acne).',
        note: 'Malassezia folliculitis ("fungal acne") mimics acne but requires DIFFERENT treatment — antifungals not antibacterials.',
      },
    },
    demodex_mites: {
      what: 'Demodex folliculorum and Demodex brevis are microscopic mites that live in hair follicles and sebaceous glands, primarily on the face.',
      prevalence: 'Almost universally present in adults over 18. Invisible to naked eye. Generally harmless.',
      when_problematic: 'In high densities, associated with rosacea, blepharitis, and certain chronic skin conditions.',
    },
  },

  functions: {
    immune_training: 'Skin microbiota play a critical role in educating the immune system — helping it distinguish between harmless and harmful organisms. The "hygiene hypothesis" suggests that reduced microbial exposure in early life contributes to increased allergy and autoimmune conditions.',
    barrier_support: 'Commensal bacteria produce short-chain fatty acids and other metabolites that maintain skin pH and support barrier integrity.',
    pathogen_defence: 'Commensal bacteria competitively exclude pathogens — occupying niches and consuming resources that would otherwise allow pathogen colonisation.',
    pH_maintenance: 'The "acid mantle" of skin (pH 4.5-5.5) is partly maintained by bacterial metabolic activity.',
  },
};

// ─── SKIN MICROBIOME BY BODY SITE ─────────────────────────────────────────────

export const MICROBIOME_BY_SITE = {
  face: {
    description: 'Rich in sebaceous follicles — oily microenvironment favours sebum-loving organisms.',
    dominant: 'Cutibacterium (Propionibacterium) species — exploiters of the rich sebum environment.',
    note: 'The face microbiome varies significantly by area — the T-zone (forehead, nose) is more oily and Cutibacterium-dominant than the drier cheeks.',
  },
  scalp: {
    description: 'One of the densest populations of sebaceous glands — high sebum production creates a rich environment for Malassezia.',
    dominant: 'Malassezia species; Cutibacterium.',
    note: 'Malassezia overgrowth on the scalp is the primary driver of dandruff and seborrheic dermatitis.',
  },
  armpit: {
    description: 'Warm, moist, high in apocrine sweat glands (produce odour precursors). Dramatically different from other sites.',
    dominant: 'Corynebacterium and Staphylococcus. Corynebacterium breaks down odourless apocrine sweat compounds into the volatile odour molecules we detect as body odour.',
    implication: 'Body odour is bacterial metabolism, not the sweat itself. Shaving the underarm reduces surface area and microenvironment for bacteria, reducing odour. Deodorant ingredients kill or inhibit bacteria.',
  },
  forearm_dry: {
    description: 'Dry, lower sebum, lower moisture.',
    dominant: 'Staphylococcus and Corynebacterium — organisms tolerant of dry conditions.',
  },
  foot: {
    description: 'Enclosed environment, sweat-prone. Different between individuals based on footwear, hygiene, and other factors.',
    dominant: 'Highly variable — Corynebacterium, Staphylococcus, and some fungi.',
    conditions: 'Tinea pedis (athlete\'s foot) is fungal (Trichophyton species) — thrives in the warm, moist enclosed foot environment.',
  },
};

// ─── MICROBIOME DISRUPTION ────────────────────────────────────────────────────

export const MICROBIOME_DISRUPTION = {
  what_disrupts: {
    harsh_cleansers: {
      mechanism: 'High pH cleansers (bar soap, sodium lauryl sulfate-heavy cleansers at high concentrations) strip the acid mantle and directly kill commensal bacteria along with unwanted organisms.',
      note: 'The dermatology recommendation for a "gentle, pH-balanced cleanser" is partly about preserving the microbiome, not just the barrier.',
    },
    over_washing: {
      mechanism: 'Each wash removes microorganisms along with dirt. Frequent washing reduces diversity and may allow opportunistic organisms to take hold.',
      ethnic_hair_note: 'The debate around washing frequency for afro-textured hair has a microbiome dimension — some natural hair communities advocate infrequent washing, but this creates a different (not necessarily better or worse) scalp microbiome environment. Seborrheic dermatitis paradox: requires MORE frequent washing because Malassezia needs to be controlled, despite the natural hair cultural preference for less frequent washing.',
    },
    antibiotics: {
      topical: 'Topical antibiotics for acne (clindamycin, erythromycin) kill Cutibacterium but also reduce overall skin microbiome diversity. Resistance is a growing concern.',
      oral: 'Oral antibiotics for acne have effects on gut microbiome and skin microbiome simultaneously. Probiotics during and after oral antibiotic courses may be protective.',
    },
    excess_active_ingredients: {
      retinoids: 'High-concentration retinoids increase cell turnover rapidly — this changes the microenvironment and may reduce microbial diversity initially before stabilising.',
      AHA_BHA: 'Exfoliating acids lower skin pH, which is generally microbiome-friendly (acid mantle is naturally acidic). However, very high concentrations may be disruptive.',
    },
    stress: {
      mechanism: 'Psychological stress changes skin sebum composition and immune signalling. Cortisol from stress affects skin permeability. These changes alter the microenvironment for skin microorganisms.',
    },
    environmental: 'UV radiation, air pollution, temperature extremes, and humidity changes all affect the skin microbiome.',
  },

  signs_of_disruption: [
    'Increased skin sensitivity or reactivity',
    'Breakouts or worsening acne',
    'Dandruff flares',
    'Eczema flares',
    'Increased skin infections',
    'Rosacea worsening',
  ],
};

// ─── MICROBIOME-SUPPORTING SKINCARE ──────────────────────────────────────────

export const MICROBIOME_SKINCARE = {
  philosophy: {
    less_is_more: 'The microbiome requires a stable, predictable environment. Fewer, milder interventions preserve this better than aggressive, multi-active routines.',
    pH_matters: 'Skin has a natural pH of approximately 4.5-5.5. Most cleansers should be formulated in this range. Pure bar soaps are often pH 9-10 — highly alkaline and disruptive.',
  },

  prebiotics: {
    what: 'Prebiotics are substances that feed and support beneficial microorganisms (similar to dietary prebiotics for the gut).',
    in_skincare: {
      inulin: 'Plant-derived carbohydrate that selectively feeds beneficial bacteria. Found in some skincare formulations.',
      fructooligosaccharides: 'Short-chain carbohydrates — similar prebiotic function to inulin.',
      xylitol: 'Natural sugar alcohol that may inhibit S. aureus attachment to skin.',
    },
    found_in: 'Some "microbiome-friendly" products, particularly from European brands (La Roche-Posay has invested in microbiome research).',
  },

  probiotics: {
    what: 'Live bacteria in skincare — theoretically colonising the skin to support healthy microbiome.',
    challenge: 'Stability is a major challenge — live bacteria are difficult to keep viable in a cosmetic product, particularly across varying temperatures and storage conditions.',
    lysates: 'Bacterial lysates (fragments of bacteria, not live) — used in some products. Evidence for benefit is growing but modest.',
    brands: ['Mother Dirt AO+ Mist (live ammonia-oxidising bacteria — nitrosomonas)', 'Aurelia Probiotic Skincare', 'La Roche-Posay Lipikar (with microbiome technology)'],
    honest_note: 'The microbiome skincare space is exciting but ahead of the science in some claims. Many "microbiome" products contain prebiotics, postbiotics (metabolites), or lysates — not live bacteria. This is not inherently bad, just different from what the marketing implies.',
  },

  postbiotics: {
    what: 'Metabolites and end-products of bacterial activity — what bacteria produce. Some postbiotics have measurable skin benefits.',
    examples: 'Short-chain fatty acids (SCFA) produced by bacteria; biosurfactants; certain peptides.',
    interest: 'Growing area of research — some cosmetic ingredients derived from bacterial fermentation are classified as postbiotics.',
  },

  fermented_ingredients: {
    what: 'Fermentation by bacteria or yeasts produces modified versions of ingredients that may be more bioavailable or contain additional beneficial compounds.',
    examples: {
      galactomyces_ferment: 'A byproduct of Galactomyces fungi — SK-II\'s "Pitera" is galactomyces ferment filtrate. Associated with improved skin texture and radiance.',
      bifida_ferment_lysate: 'Lysate from Bifida bacteria — La Roche-Posay uses this. Some evidence for skin barrier support.',
      sake: 'Sake (rice wine) contains kojic acid (skin brightening) and a microbiome of Aspergillus fungi and Saccharomyces yeasts that modify the rice compounds. Traditional Japanese beauty food and beauty ingredient.',
      kimchi_extract: 'Fermentation by Lactobacillus produces lactic acid and other compounds from vegetables.',
      rice_water: 'Fermented rice water — traditional East Asian hair treatment; lactic acid content from fermentation.',
    },
  },
};

// ─── MICROBIOME BY ETHNIC COMMUNITY ──────────────────────────────────────────

export const MICROBIOME_BY_COMMUNITY = {
  overview: 'Research into skin microbiome differences across ethnicities is an emerging field. Current data is limited but growing. Key factors include: climate and geography, genetic variation in immune response, dietary differences, traditional hygiene practices, and historical environment.',

  african_diaspora: {
    eczema: 'Atopic dermatitis (eczema) has higher prevalence in Black children in Western countries. S. aureus colonisation is a consistent finding in eczema. Filaggrin gene mutations (associated with barrier deficiency and eczema) are more common in populations of European descent; eczema in Black populations may have different immune pathways.',
    scalp: 'High sebum production on the scalp, combined with less frequent washing practices in some natural hair communities, may create different Malassezia dynamics.',
    dry_skin: 'Transepidermal water loss (TEWL) — the rate at which water evaporates through skin — differs across ethnicities; dark skin has different ceramide composition which affects both barrier function and microenvironment.',
  },

  south_asian: {
    fermented_foods: 'Traditional South Asian diet is very high in fermented foods — dahi (yoghurt), lassi, idli, dosa (fermented rice/lentil), pickles. Dietary microbial diversity may influence skin microbiome through gut-skin axis connections, though this is an area of active research.',
    oil_usage: 'Traditional oil application to skin and hair (coconut oil, sesame oil, mustard oil) creates a different lipid environment on the skin surface, potentially influencing microbial composition. Some oils have demonstrated antimicrobial properties (coconut oil has activity against C. acnes).',
    turmeric: 'Traditional use of turmeric on skin — curcumin has demonstrated antimicrobial activity against some pathogens in vitro, though clinical effects on the skin microbiome are not well characterised.',
  },

  east_asian: {
    fermentation_tradition: 'Japan (miso, soy sauce, sake, natto), Korea (kimchi, doenjang, jeotgal), China (doubanjiang, vinegar) — all have ancient, highly developed fermentation food traditions. Korea has applied this tradition directly to beauty in fermented skincare.',
    cleansing_culture: 'Korean double-cleansing removes more of the daily surface debris but may also affect the transient microbiome. Japanese cleansing tradition is thorough but often gentler — cleansing oils and low-surfactant cleansers preserve more of the commensal community.',
    lower_body_hair: 'Lower visible body hair in many East Asian people (fewer sebaceous follicles per square centimetre in some studies) may mean a somewhat different microenvironment compared to higher hair density populations.',
  },

  arab_north_african: {
    hammam_tradition: 'Regular hammam visits with kese scrubbing dramatically change the surface microbiome temporarily — removing millions of microorganisms along with dead skin. The microbiome rapidly repopulates after. Regular extreme exfoliation may select for faster-populating species.',
    traditional_oils: 'Argan oil has some antimicrobial properties; black seed (Nigella sativa) oil has well-documented antimicrobial activity against S. aureus and Malassezia — which has implications for scalp health in particular.',
  },
};

// ─── SKIN CONDITIONS AND MICROBIOME ──────────────────────────────────────────

export const CONDITIONS_MICROBIOME = {
  acne: {
    traditional_view: 'Acne caused by Cutibacterium acnes (C. acnes).',
    updated_view: 'The microbiome picture is more complex. People with acne have DIFFERENT STRAINS of C. acnes, not more of them. Diversity of the overall microbiome may matter — acne-prone skin often shows reduced diversity.',
    implication: 'Targeted treatments (killing specific strains) may be more effective than broad-spectrum antibiotics that reduce all diversity.',
  },
  eczema: {
    S_aureus_role: 'S. aureus colonisation is significantly elevated in atopic dermatitis. It isn\'t clear whether S. aureus causes eczema or is a consequence, but disrupting S. aureus appears to improve eczema.',
    microbiome_therapy: 'Microbiome transplants for eczema are in clinical trials — applying rosette of commensal Staphylococcus bacteria to skin to competitively displace S. aureus.',
    bleach_baths: 'Diluted bleach baths (0.005% sodium hypochlorite — approximately 1 teaspoon bleach per 4L water) are prescribed for eczema management. They reduce S. aureus colonisation. Despite the unintuitive nature of putting bleach on inflamed skin, evidence supports safety and efficacy when used as directed.',
  },
  rosacea: {
    demodex: 'Rosacea is associated with higher Demodex mite density on the face. Ivermectin (anti-parasitic) prescription cream has shown effectiveness in rosacea by reducing Demodex.',
    microbiome: 'Cutibacterium may also play a role in rosacea — but through inflammatory mechanisms rather than simple overgrowth.',
  },
  dandruff_sebderm: {
    malassezia: 'Malassezia is the primary driver. It produces metabolites from sebum that irritate the scalp in susceptible individuals.',
    treatment: 'Antifungal treatments (ketoconazole, ciclopirox, zinc pyrithione, selenium sulfide) target Malassezia. Regular use required as Malassezia naturally repopulates.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getMicrobiomeBasics() {
  return SKIN_MICROBIOME_BASICS;
}

export function getMicrobiomeBySite(site) {
  return MICROBIOME_BY_SITE[site] || null;
}

export function getMicrobiomeDisruption() {
  return MICROBIOME_DISRUPTION;
}

export function getMicrobiomeSkincare() {
  return MICROBIOME_SKINCARE;
}

export function getMicrobiomeByCommunity(communityId) {
  return MICROBIOME_BY_COMMUNITY[communityId] || null;
}

export function getConditionMicrobiomeInfo(condition) {
  return CONDITIONS_MICROBIOME[condition] || null;
}

export const SKIN_MICROBIOME_STATS = {
  bodySitesCovered: Object.keys(MICROBIOME_BY_SITE).length,
  communitiesCovered: 4,
  conditionsCovered: Object.keys(CONDITIONS_MICROBIOME).length,
};
