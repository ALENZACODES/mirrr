/**
 * MIRRR — Clean Beauty & Ingredient Safety Guide
 * Evidence-based ingredient safety, greenwashing, certifications,
 * truly harmful vs unnecessarily demonised ingredients, and
 * ethnic community clean beauty considerations.
 */

export const CLEAN_BEAUTY_OVERVIEW = {
  title: 'Clean Beauty: Evidence-Based Guide to Ingredient Safety',
  introduction: `"Clean beauty" is one of the most misused terms in the industry — a marketing concept with no universal legal definition. In the US, Canada, and UK, the term has no regulatory meaning. This guide separates evidence-based ingredient concerns from greenwashed fearmongering, helps you understand what "clean beauty" certifications actually mean, and identifies ingredients with genuine safety concerns versus those unjustly demonised.`,
  regulatoryContext: {
    US: {
      body: 'FDA (Food and Drug Administration)',
      banned_ingredients: 'Approximately 11 ingredients banned in cosmetics',
      approach: 'Post-market surveillance; safety is primarily the manufacturer\'s responsibility',
      comparison: 'The EU has banned or restricted over 1,400 ingredients from cosmetics'
    },
    EU: {
      body: 'European Commission / SCCS (Scientific Committee on Consumer Safety)',
      banned_ingredients: 'Over 1,400 banned or restricted',
      approach: 'Precautionary principle — ingredients must be assessed and approved',
      note: 'EU regulatory framework is significantly more protective than US for cosmetics'
    },
    UK: {
      body: 'OPSS (Office for Product Safety and Standards) post-Brexit',
      approach: 'Largely maintained EU standards',
      banned_ingredients: 'Maintained ~1,400 ban list from EU law'
    }
  },
  cleanBeautyDefinitions: {
    industryVarying: 'Sephora Clean, Credo, EWG Verified, COSMOS Organic, NATRUE — all have different standards',
    commonCriteria: ['No parabens', 'No phthalates', 'No sulphates (SLS/SLES)', 'No synthetic fragrances', 'No formaldehyde-releasers', 'Often also: cruelty-free, vegan, sustainable packaging'],
    problem: 'Some "clean" brands avoid scientifically safe ingredients while using genuinely problematic natural alternatives. "Natural" does not equal safe; "synthetic" does not equal dangerous.',
    bestApproach: 'Evaluate individual ingredients based on evidence, not blanket "clean" labels'
  }
};

export const GENUINELY_CONCERNING_INGREDIENTS = {
  title: 'Ingredients with Evidence-Based Concerns',
  disclaimer: 'Concerns are dose- and context-dependent. Most of these are used at low concentrations that may be safe. The concern is cumulative exposure across multiple products.',
  oxybenzone: {
    type: 'Chemical UV filter',
    found_in: 'Chemical sunscreens (most US sunscreens)',
    concern: 'Endocrine disruption in animal studies; FDA study found absorption into bloodstream at concentrations significantly above FDA safety threshold after 4 days of sunscreen use',
    EU_status: 'Restricted to 6% in EU (UK maintains this); FDA is still reviewing safety',
    verdict: 'Genuine evidence of concern; easy to avoid by choosing mineral sunscreen or EU-approved filters (tinosorb, bis-ethylhexyloxyphenol methoxyphenyl triazine)',
    alternatives: 'Zinc oxide, titanium dioxide (mineral); or avobenzone (less concerning), tinosorb M/S (if available in your country)'
  },
  formaldehyde_releasers: {
    type: 'Preservatives that slowly release formaldehyde',
    names: ['DMDM hydantoin', 'Imidazolidinyl urea', 'Diazolidinyl urea', 'Quaternium-15 (highest releaser)', 'Bronopol (2-bromo-2-nitropropane-1,3-diol)', 'Sodium hydroxymethylglycinate'],
    found_in: 'Hair products (especially keratin treatments), shampoos, lotions, baby products',
    concern: 'Formaldehyde is a confirmed human carcinogen (IARC Group 1). Releasers emit low-level formaldehyde continuously; risk is greatest in poorly ventilated spaces and for hairdressers with occupational exposure',
    verdict: 'Legitimate concern; especially problematic in high-concentration hair products. Easy to avoid — check INCI names.',
    note: 'Brazilian blowout products are notorious for formaldehyde; check for releasers and avoid products without clear ingredient transparency'
  },
  phthalates: {
    type: 'Plasticisers and fragrance fixatives',
    names: ['DBP (dibutyl phthalate)', 'DEHP (diethylhexyl phthalate)', 'DEP (diethyl phthalate)'],
    found_in: 'Nail polish (DBP — EU banned); fragrance (DEP — not listed due to "fragrance" loophole); hairspray; plastic packaging that leaches',
    concern: 'DBP and DEHP are endocrine disruptors confirmed in multiple studies; DEHP classified as Repro Cat 1B (reproductive toxicity) in EU and banned from cosmetics. DEP used in fragrance is less clearly problematic.',
    EU_status: 'DBP and DEHP banned in EU cosmetics',
    verdict: 'DBP and DEHP: legitimate concern; EU standards adequately protect. DEP: evolving evidence.',
    howToAvoid: 'Choose nail polishes labelled "3-free" or "7-free" (excludes DBP); choose fragrance-free or products from brands with full fragrance transparency'
  },
  mercury: {
    type: 'Heavy metal',
    found_in: 'Skin-lightening creams (especially unregulated products from Southeast Asia, West Africa, Latin America, Middle East); some eye drops; traditional mascara',
    concern: 'Mercury is a confirmed neurotoxin and nephrotoxin. Mercury-containing skin lighteners are banned in the EU, US, and UK but are still widely sold illegally. Heavy use causes nerve damage, kidney damage, and skin thinning.',
    verdict: 'Clear danger; always avoid',
    testing: 'Many public health departments offer free testing of suspected mercury-containing products',
    communityNote: 'Particularly relevant for communities with cultural skin lightening practices — the illegal products are targeted at East Asian, South Asian, West African, and Caribbean communities. Regulated alternatives exist.'
  },
  high_dose_hydroquinone: {
    type: 'Skin-lightening agent',
    concern: 'At high concentrations (>2%) and extended use, risk of ochronosis (paradoxical darkening, irreversible blue-black discolouration). At 2% (OTC US) or as prescribed by dermatologist: evidence-based treatment for hyperpigmentation.',
    verdict: 'At proper doses with medical supervision: effective and relatively safe. Unregulated high-dose use: genuinely concerning.',
    alternatives_for_fear_of_hydroquinone: 'Azelaic acid, tranexamic acid, kojic acid, niacinamide, vitamin C, arbutin — all effective with better safety profiles',
    EU_status: 'Prescription only in EU for skincare; banned as OTC'
  },
  coal_tar: {
    type: 'Derived from coal processing',
    found_in: 'Dandruff shampoos, psoriasis treatments',
    concern: 'Coal tar contains polycyclic aromatic hydrocarbons (PAHs), some of which are carcinogenic. FDA considers therapeutic benefit outweighs risk in dandruff/psoriasis concentrations. EU restricts to very low concentrations.',
    verdict: 'Caution warranted for regular long-term use; safer alternatives available for dandruff (ketoconazole, zinc pyrithione, ciclopirox). May be appropriate for psoriasis under medical supervision.'
  },
  lead_in_lipstick: {
    type: 'Heavy metal contaminant',
    found_in: 'Lead is not intentionally added to lipstick but is a common contaminant from colour pigments, especially red/dark shades',
    concern: 'FDA tested lipsticks and found lead in virtually all (400 products tested); highest in dark reds and some L\'Oréal products. FDA concluded levels are below risk thresholds but noted daily oral exposure from lip products.',
    verdict: 'Levels found are likely not acutely dangerous for most adults; concern valid for children (hand-to-mouth) and heavy daily lipstick use by pregnant people. Choosing certified lead-free brands is reasonable.',
    alternatives: 'Several clean beauty brands test for heavy metals; look for brands publishing testing results'
  },
  triclosan: {
    type: 'Antibacterial/antifungal agent',
    found_in: 'Antibacterial soaps and body washes; was in toothpaste; some deodorants and cosmetics',
    concern: 'Endocrine disruption; antibiotic resistance contribution; environmental contamination; disrupts thyroid signalling',
    regulatory: 'FDA banned triclosan from OTC soap products in 2016 (no evidence better than plain soap; potential hazards). Still allowed in some cosmetics in US.',
    verdict: 'Avoid; effective alternatives exist; no benefit in soap products demonstrated'
  },
  parabens: {
    note: 'See UNNECESSARILY_DEMONISED_INGREDIENTS for the paraben nuance',
    genuinely_concerning: ['Isobutylparaben', 'Butylparaben (at higher concentrations)', 'Benzylparaben', 'Propylparaben in large amounts'],
    likely_safe: 'Methylparaben and ethylparaben (short-chain) used at EU-permitted levels appear to have acceptable safety profiles based on current evidence'
  }
};

export const UNNECESSARILY_DEMONISED_INGREDIENTS = {
  title: 'Ingredients Demonised Without Sufficient Evidence',
  introduction: `The clean beauty movement has unfortunately created a culture of ingredient fear that is disproportionate to actual risk. Many ingredients described as "toxic," "harmful," or "carcinogenic" in popular media are either safe at concentrations used in cosmetics, have very thin evidence for the claimed harm, or have been misrepresented. This section reviews the most commonly mischaracterised ingredients.`,
  parabens: {
    name: 'Parabens (methylparaben, ethylparaben, propylparaben, butylparaben)',
    claim: 'Cause breast cancer; mimic oestrogen',
    reality: `The 2004 Philippa Darbre study found parabens in breast tumours — but did NOT find they cause breast cancer (correlation vs causation; no cancer-free control). Parabens have very weak oestrogenic activity (100,000x weaker than estradiol). A 2018 Breast Cancer Research review found no evidence linking parabens to breast cancer. Short-chain parabens (methyl, ethyl) are metabolised rapidly and appear very safe. EU SCCS has reviewed and permitted methylparaben and ethylparaben in cosmetics.`,
    verdict: 'Short-chain parabens at EU-permitted concentrations: evidence does not support the cancer claim. Long-chain parabens (butyl, isobutyl) at high concentrations: some concern remains warranted. Avoiding parabens entirely is not scientifically necessary but is personal choice.',
    irony: 'Many paraben-free products use preservatives with weaker evidence of safety than parabens'
  },
  SLS_SLES: {
    name: 'Sodium Lauryl Sulphate (SLS) / Sodium Laureth Sulphate (SLES)',
    claim: 'Carcinogenic; causes cancer',
    reality: 'SLS and SLES are not carcinogens. This myth traces to a 1998 internet hoax that was comprehensively debunked. The American Cancer Society confirmed there is no evidence SLS causes cancer. These are surfactants — detergents that remove oil and dirt.',
    genuine_concern: 'SLS can cause skin irritation, disrupt the skin barrier, and worsen eczema in sensitive individuals. SLES is gentler due to ethoxylation (adds ethylene oxide in processing, which removes the skin-sensitising dodecyl sulphate). For dry, sensitive, or eczema-prone skin, avoiding SLS is reasonable for comfort, not cancer prevention.',
    verdict: 'Avoid for skin irritation reasons if relevant to your skin type. Not a cancer risk.'
  },
  mineral_oil: {
    name: 'Mineral oil, paraffin, petrolatum',
    claim: 'Carcinogenic; clogs pores; suffocates skin',
    reality: `Cosmetic-grade mineral oil, petrolatum, and paraffin are rigorously refined and purified — completely different from industrial-grade mineral oil (which does contain carcinogenic PAHs). Cosmetic-grade petrolatum is one of the most effective and studied moisturising ingredients. Vaseline (petrolatum) has decades of clinical safety data. FDA GRAS status. Skin does not "breathe" through pores — oxygen exchange is via blood; occlusion does not cause harm.`,
    pore_clogging: 'Refined mineral oil is non-comedogenic (comedogenicity rating 0). It forms a barrier that PREVENTS transepidermal water loss rather than trapping dirt.',
    EU_PAH_concern: 'EU requires testing for PAH contamination in mineral oils used cosmetically; reputable brands comply. EU lists certain categories as restricted but cosmetic-grade use is permitted.',
    verdict: 'Cosmetic-grade mineral oil and petrolatum are safe, effective, evidence-based ingredients. The carcinogen claim is false for cosmetic-grade. Non-comedogenic. Excellent for dry and eczema-prone skin.',
    exception: 'Personal preference against petroleum-derived ingredients is valid from a sustainability standpoint'
  },
  silicones: {
    name: 'Dimethicone, cyclopentasiloxane, cyclomethicone, etc.',
    claim: 'Suffocate skin; cause acne; accumulate in body',
    reality: 'Dimethicone (non-volatile silicone) does not absorb into skin; it forms a breathable film that enhances slip, softens feel, and protects the skin barrier without blocking oxygen (skin doesn\'t absorb oxygen from air). Non-comedogenic. Large molecular size means no systemic absorption.',
    cyclomethicone_concern: 'Cyclopentasiloxane (D5) and cyclomethicone are volatile silicones that may bioaccumulate in aquatic environments; EU has restricted D4 in rinse-off products and is reviewing D5. Environmental concern is legitimate; human health concern is not.',
    verdict: 'No evidence of harm to human skin or health. Environmental accumulation is a legitimate concern for certain volatile silicones. Dimethicone in leave-on products: safe and effective.',
    community_note: 'For 4C natural hair: some find silicones coat the hair shaft and require sulphate shampoo to remove (which can be drying). Water-soluble silicones (PEG-modified) are an alternative.'
  },
  fragrances: {
    name: 'Synthetic fragrance',
    claim: 'All synthetic fragrances are toxic',
    reality: 'Fragrance sensitivity and contact dermatitis from fragrances are real — approximately 1-3% of the population has fragrance contact allergy. The concern is sensitisation and allergic reaction, not toxicity.',
    genuine_issue: 'The "fragrance" or "parfum" label on INCI can hide hundreds of undisclosed ingredients; this lack of transparency is a real problem, especially for fragrance allergy identification',
    some_concern: 'A few specific fragrance chemicals have evidence for concern: musks (HHCB, AHTN) may bioaccumulate; certain oxidised terpenes (linalool oxide) are potent sensitisers',
    verdict: 'For sensitive skin or known fragrance allergy: avoiding all fragrance (natural and synthetic) is the right approach. For most people: synthetic fragrance at IFRA-compliant concentrations is not a "toxic" risk. Natural fragrances cause MORE contact allergies than synthetic (because essential oils contain many sensitising terpenes).',
    fragrance_free_note: 'Both synthetic and natural fragrance can cause contact dermatitis; "fragrance-free" is the safest option for reactive skin'
  },
  retinoids: {
    name: 'Retinol, retinaldehyde, tretinoin',
    claim: 'Thin your skin permanently; dangerous',
    reality: 'Retinoids do not thin the skin permanently. Initial peeling and sensitivity is temporary and reverses. Long-term retinoid use INCREASES skin thickness (via collagen stimulation), improves skin texture, and reverses UV damage. Tretinoin is one of the most studied and evidence-supported ingredients in dermatology.',
    genuine_caution: ['Teratogenic in pregnancy — absolute contraindication', 'Should be used with SPF always as retinoids increase photosensitivity', 'Can cause initial irritation, purging, and peeling', 'Start slowly (2-3x per week) and build up'],
    verdict: 'Safe and highly effective for most people; not a reason to avoid for anyone who is not pregnant. The "skin thinning" claim is factually incorrect long-term.'
  },
  niacinamide: {
    claim: 'Reacts with vitamin C to form niacin (causes flushing)',
    reality: 'This reaction requires very high concentrations, high temperatures, and extended time that do not occur on skin. Multiple product tests have shown niacinamide and vitamin C can be used together without clinically significant interaction at normal skincare concentrations and temperatures.',
    verdict: 'Safe to use with vitamin C. Myth based on theoretical chemistry extrapolated incorrectly to real-world skincare conditions.'
  }
};

export const CLEAN_BEAUTY_CERTIFICATIONS = {
  title: 'Understanding Clean Beauty Certifications',
  certifications: {
    COSMOS_Organic: {
      body: 'ECOCERT, BDIH, COSMEBIO, Soil Association (European coalition)',
      standards: 'At least 95% of plant-based ingredients organic; 20% of total formula organic; prohibits petrochemical-derived ingredients, GMOs, synthetic colours/fragrances, irradiation',
      strength: 'Most rigorous and respected certification; supply chain audited',
      limitation: 'Natural ingredients can still be sensitising; organic doesn\'t mean safer for all skin types'
    },
    EWG_Verified: {
      body: 'Environmental Working Group (US non-profit)',
      standards: 'Ingredients scored against EWG Skin Deep database; no ingredients with EWG scores of 7-10; manufacturing transparency requirement',
      strength: 'Consumer-friendly; widely recognised in US',
      limitation: 'EWG scoring methodology has been criticised by toxicologists for not adequately weighting dose and exposure in risk assessment; some low-risk ingredients are scored high (precautionary approach taken beyond evidence)'
    },
    NATRUE: {
      body: 'International NATRUE Label Association (Belgian non-profit)',
      standards: 'Three-tier certification (natural, natural with organic, organic); strict definitions of what constitutes natural transformation',
      strength: 'Strong European presence; rigorous definitions',
      limitation: 'Less well-known outside Europe'
    },
    cruelty_free_certifications: {
      leaping_bunny: {
        body: 'Coalition for Consumer Information on Cosmetics',
        standards: 'No animal testing at any stage of production, including ingredients and suppliers; annual recommitment required',
        strength: 'Most comprehensive cruelty-free standard; supply chain included'
      },
      PETA_CF: {
        body: 'PETA',
        standards: 'Company self-certifies no animal testing',
        limitation: 'No third-party audit of supply chain; less rigorous than Leaping Bunny'
      }
    },
    vegan: {
      body: 'Vegan Society, Vegan Action, or brand self-certification',
      standards: 'No animal-derived ingredients; if certified, no animal testing',
      note: 'Vegan ≠ cruelty-free: a product can contain no animal ingredients but still be tested on animals. Vegan ≠ natural or clean. Many vegan products contain synthetic ingredients.'
    },
    Sephora_Clean: {
      body: 'Sephora',
      standards: 'Avoids a list of specific ingredients Sephora has identified; list publicly available',
      limitation: 'Proprietary standard; not independently audited; some effective ingredients incorrectly included in avoid list'
    }
  }
};

export const ETHNIC_CLEAN_BEAUTY_GUIDE = {
  'west-african': {
    skinLighteningWarning: 'Mercury-containing skin-lightening creams are actively marketed to West African communities. These products are illegal in the US, EU, and UK but sold through unregulated channels. Mercury content can cause irreversible neurological damage. Test kits are available through public health departments.',
    safeAlternatives: 'Vitamin C, niacinamide 10-12%, azelaic acid, kojic acid, arbutin, tranexamic acid — all effective for hyperpigmentation without safety concerns',
    traditionalIngredients: 'African black soap (natural pH ~11 — good for oily/acne skin but can be drying for sensitive), shea butter (rich in oleic acid — moisturising; unrefined shea has anti-inflammatory properties), argan oil (import), palm kernel oil (lauric acid — antimicrobial)',
    concerns: 'Chemical relaxers — some contain formaldehyde-releasers or very high pH (above 12) which can cause scalp burns; check pH and ingredients'
  },
  'south-asian': {
    skinLighteningWarning: 'South Asian markets have high rates of banned skin-lightening products. Mercury-containing fairness creams are still widely available outside the EU/US/UK. Clobetasol (high-potency steroid) is sometimes illegally added to fairness creams — causes skin thinning and adrenal suppression.',
    traditionIngredients: 'Turmeric (curcumin — genuine anti-inflammatory; can stain; at high topical concentrations with photosensitisers may cause phototoxicity), neem (azadirachtin — antimicrobial; well-tolerated), multani mitti (Fuller\'s earth — clarifying clay), rose water (gentle toner; pH ~5)',
    concerns: 'Kohl used traditionally contains lead in some formulations — particularly important for eye safety and keeping away from children. Sandalwood essential oil: genuine sensitiser risk at high concentrations.'
  },
  caribbean: {
    traditionalIngredients: 'Aloe vera (evidence-based: wound healing, soothing, mild lightening via aloesin), coconut oil (lauric acid — antimicrobial; can be comedogenic for acne-prone faces; excellent for hair and body), castor oil (ricinoleic acid — anti-inflammatory; popular for lash/brow growth though evidence limited)',
    skinLighteningWarning: 'Illegal skin lighteners also targeted at Caribbean communities. Hydroquinone above 2% is Rx-only in the US and banned OTC in EU.',
    essentialOilNote: 'Bay rum (bay leaf essential oil in alcohol) — traditional Caribbean product; effective for dandruff and mild antimicrobial properties; can cause irritation on sensitive skin'
  },
  arab: {
    traditionalIngredients: 'Argan oil (oleic and linoleic acid rich; antioxidant vitamin E; good evidence for skin and hair benefits), oud (agarwood — fragrance only; no safety concern at normal perfume use), kohl (traditional eye makeup — lead risk in traditional formulations; use modern regulatory-approved kohl only), black seed oil/Nigella sativa (thymoquinone — antimicrobial and anti-inflammatory; well-studied; generally safe)',
    fragranceNote: 'Oud, amber, and musk fragrances are central to Arab beauty culture. Natural musks are protected species; synthetic musks (ambrettolide, ethylene brassylate, Iso E Super) are alternatives. Some musks bioaccumulate — prefer biodegradable synthetic musks (PADMA, Nirvanolide).',
    sunscreenBarriers: 'Historically low sunscreen use partly due to white cast on olive/medium skin tones. Chemical filters or tinted mineral sunscreens address this. DEET note: in hot climates where insect repellent is used with sunscreen — apply SPF first, then DEET; DEET does not degrade sunscreen significantly but apply separately.'
  },
  latina: {
    traditionalIngredients: 'Aloe vera (Aloe barbadensis — native to Mexico; genuine evidence for wound healing and moisturising), avocado (oleic acid, vitamins E/K — excellent for dry skin and hair; avocado oil in cooking also skin-beneficial when applied topically), cacao/cocoa butter (stearic and oleic acid — excellent emollient; safe; comedogenicity rating 4 — caution for acne-prone faces), hibiscus (gentle AHA from citric and malic acid content; antioxidant; pH considerations for formulation)',
    skinLighteningWarning: 'Illegal creme para la piel (skin lightening creams) with mercury are sold in Latin American communities in the US. Report to FDA if encountered.',
    sprayTanNote: 'DHA (dihydroxyacetone) in self-tanners is safe for skin application; avoid inhaling spray tan mist; use bronzer as alternative for darker application areas'
  },
  'east-asian': {
    traditionalIngredients: 'Rice water (contains inositol — a B vitamin that can penetrate hair shaft and repair damage; also ferulic acid antioxidant; fermented version has higher antioxidant concentration), camellia oil/tsubaki (oleic acid — deeply conditioning; excellent for hair; traditional Japanese beauty ingredient), pearl powder (Empress Wu Zetian\'s legendary ingredient — nacre contains conchiolin protein, amino acids; some evidence for brightening; signalling benefit via receptor activation is unproven)',
    fermentNote: 'Galactomyces ferment filtrate, sake ferment filtrate — postbiotics from fermentation with significant evidence for brightening, pore minimising. These are legitimate K-beauty ingredients with clinical support.',
    sheetMaskSafety: 'Single-use sheet masks are generally safe; microplastic fibres in some masks are an environmental concern; biodegradable cellulose or tencel alternatives preferred',
    snailMucin: 'Helix aspersa secretion filtrate (snail mucin) — contains glycoprotein, glycosaminoglycans, allantoin, collagen, and elastin. Evidence for hydration and wound healing. Cruelty concerns around harvesting methods vary by producer.'
  },
  'east-african': {
    traditionalIngredients: 'Frankincense (Boswellia carterii/sacra — boswellic acids have genuine anti-inflammatory activity; essential oil at high concentrations can be irritating; in formulated products at 0.1-1% tends to be beneficial), myrrh (Commiphora myrrha — antimicrobial, wound healing; traditional East African and broader Horn of Africa use), butter/ghee (applied postpartum — contains fat-soluble vitamins; safe but comedogenic for some)',
    skinLighteningWarning: 'Mercury-containing skin lighteners also targeted at East African communities.',
    naturaloilNote: 'Avocado oil, sesame oil, and castor oil widely used in the region with good safety profiles'
  },
  'south-african': {
    traditionalIngredients: 'Rooibos (Aspalathus linearis extract — aspalathin, nothofagin; antioxidant anti-inflammatory; excellent for sensitive and eczema-prone skin; caffeine-free herbal origin; topical use well-tolerated), marula oil (Sclerocarya birrea — oleic acid ~73%; antioxidant; light texture; excellent for face oils and hair), buchu (Agathosma betulina — antimicrobial; South African indigenous plant; used in some skincare for its antibacterial properties)',
    skinLighteningWarning: 'South Africa has particular issues with illegal skin lighteners historically. Post-apartheid beauty standards and skin lightening practices intersect with profound socio-political histories. Medical-grade skin lightening for hyperpigmentation and cosmetic skin lightening are very different.',
    note: 'South Africa regulates cosmetics under the National Regulator for Compulsory Specifications (NRCS); generally stricter than US, aligned more with EU standards'
  },
  'black-american': {
    relaxerSafety: 'Chemical hair relaxers use sodium hydroxide (lye) or guanidine carbonate to permanently straighten hair by breaking disulphide bonds. pH ranges from 10-14. NIH Sister Study found association between frequent relaxer use and uterine fibroids (2022). Research ongoing. Note: this does not mean relaxers cause fibroids definitively; association ≠ causation.',
    naturalHairIngredients: 'Shea butter, castor oil, argan oil, jojoba, avocado oil, coconut oil — all safe and effective for 4C hair',
    productFearmongering: 'Many natural hair product brands have marketed against specific ingredients (glycerin in humid climates — not harmful, just less effective in high humidity; petroleum-based sealants — safe and effective for low-porosity hair). Evidence-based ingredient choice is preferable to marketing-driven avoidance.',
    skinLighteningWarning: 'Bleaching creams targeted at Black communities. Hydroquinone at proper medical doses (2-4%) is evidence-based for PIH; beyond that, mercury-containing products are a genuine danger.',
    sunscreenNote: 'White cast from zinc oxide is a real barrier to SPF use. Transparent zinc formulations, tinted minerals, and chemical-mineral hybrid sunscreens address this.'
  }
};

export function getCleanBeautyOverview() {
  return CLEAN_BEAUTY_OVERVIEW;
}

export function getGenuinelyConcerningIngredient(ingredient = null) {
  if (!ingredient) return GENUINELY_CONCERNING_INGREDIENTS;
  const i = ingredient.toLowerCase().replace(/ /g, '_');
  const map = {
    oxybenzone: GENUINELY_CONCERNING_INGREDIENTS.oxybenzone,
    formaldehyde: GENUINELY_CONCERNING_INGREDIENTS.formaldehyde_releasers,
    phthalates: GENUINELY_CONCERNING_INGREDIENTS.phthalates,
    mercury: GENUINELY_CONCERNING_INGREDIENTS.mercury,
    hydroquinone: GENUINELY_CONCERNING_INGREDIENTS.high_dose_hydroquinone,
    coal_tar: GENUINELY_CONCERNING_INGREDIENTS.coal_tar,
    lead: GENUINELY_CONCERNING_INGREDIENTS.lead_in_lipstick,
    triclosan: GENUINELY_CONCERNING_INGREDIENTS.triclosan
  };
  return map[i] || GENUINELY_CONCERNING_INGREDIENTS;
}

export function getDemonisedIngredient(ingredient = null) {
  if (!ingredient) return UNNECESSARILY_DEMONISED_INGREDIENTS;
  const i = ingredient.toLowerCase();
  const map = {
    paraben: UNNECESSARILY_DEMONISED_INGREDIENTS.parabens,
    sls: UNNECESSARILY_DEMONISED_INGREDIENTS.SLS_SLES,
    sodium_lauryl: UNNECESSARILY_DEMONISED_INGREDIENTS.SLS_SLES,
    mineral_oil: UNNECESSARILY_DEMONISED_INGREDIENTS.mineral_oil,
    petrolatum: UNNECESSARILY_DEMONISED_INGREDIENTS.mineral_oil,
    silicone: UNNECESSARILY_DEMONISED_INGREDIENTS.silicones,
    dimethicone: UNNECESSARILY_DEMONISED_INGREDIENTS.silicones,
    fragrance: UNNECESSARILY_DEMONISED_INGREDIENTS.fragrances,
    retinol: UNNECESSARILY_DEMONISED_INGREDIENTS.retinoids,
    retinoid: UNNECESSARILY_DEMONISED_INGREDIENTS.retinoids,
    niacinamide: UNNECESSARILY_DEMONISED_INGREDIENTS.niacinamide
  };
  for (const [key, val] of Object.entries(map)) {
    if (i.includes(key)) return val;
  }
  return UNNECESSARILY_DEMONISED_INGREDIENTS;
}

export function getCleanBeautyCertifications() {
  return CLEAN_BEAUTY_CERTIFICATIONS;
}

export function getEthnicCleanBeauty(communityId) {
  const key = communityId.replace(/-/g, '_');
  const id = communityId.includes('_') ? communityId.replace(/_/g, '-') : communityId;
  return ETHNIC_CLEAN_BEAUTY_GUIDE[id] || ETHNIC_CLEAN_BEAUTY_GUIDE[communityId] || null;
}

export const CLEAN_BEAUTY_STATS = {
  moduleId: 'clean_beauty_guide',
  version: '1.0.0',
  topics: ['clean beauty definition', 'greenwashing', 'banned ingredients', 'oxybenzone', 'formaldehyde releasers', 'phthalates', 'mercury skin lighteners', 'paraben myths', 'mineral oil myths', 'silicone myths', 'certifications', 'ethnic skin lightening dangers', 'ethnic traditional ingredients'],
  communitiesSupported: 9,
  keyFacts: [
    'EU has banned 1400+ cosmetic ingredients vs ~11 in the US',
    'The paraben-cancer link originates from a 2004 study that found correlation, not causation',
    'Cosmetic-grade mineral oil/petrolatum is completely safe; the carcinogen concern applies only to industrial grade',
    'Mercury-containing skin lighteners cause irreversible neurological damage and are still illegally sold in many communities',
    '"Clean beauty" has no legal definition in the US, EU, or UK',
    'Natural fragrances cause MORE contact allergies than synthetic at comparable concentrations',
    'COSMOS Organic is the most rigorous and independently audited certification'
  ]
};
