/**
 * MIRRR — Skincare Ingredients Encyclopedia
 * Comprehensive A-Z guide to skincare active ingredients, mechanisms,
 * evidence, safety for ethnic skin types, and ethnic community applications.
 */

export const VITAMIN_C_GUIDE = {
  title: 'Vitamin C (L-Ascorbic Acid and Derivatives)',
  what: 'Vitamin C is a potent antioxidant and tyrosinase inhibitor (reduces melanin production); the gold-standard brightening active ingredient; one of the best-studied skincare ingredients with robust evidence',
  mechanism: 'L-ascorbic acid (the pure form) is a water-soluble vitamin that: (1) scavenges free radicals to protect skin from oxidative damage; (2) inhibits tyrosinase enzyme — reducing melanin synthesis; (3) stimulates collagen synthesis by acting as a cofactor for prolyl hydroxylase, an enzyme necessary for collagen stability; (4) reduces oxidised vitamin E back to its active form (synergistic with vitamin E)',
  forms: {
    LAscorbicAcid: {
      name: 'L-Ascorbic Acid (LAA)',
      effectiveness: 'The most bioavailable form; most research-backed; the gold standard',
      stability: 'Very unstable; oxidises in presence of light, air, and water; should be packaged in an opaque, airtight, dark-glass bottle; turns yellow then orange-brown as it oxidises (a light yellowing is normal; dark brown/orange indicates degraded product)',
      percentages: '10-20% is the effective range; 10-15% is as effective as higher concentrations for most uses; above 20% does not significantly increase efficacy but significantly increases irritation risk',
      pH: 'Must be formulated below pH 3.5 for skin penetration; low pH can cause irritation',
      packaging: 'Look for products in dark/opaque bottles with limited air exposure (dropper bottles or pump bottles rather than jars)'
    },
    ascorbylGlucoside: {
      name: 'Ascorbyl Glucoside',
      effectiveness: 'Stable derivative converted to LAA in skin; slightly less potent but significantly more stable than pure LAA',
      stability: 'Much more stable than pure LAA; clear serums that remain stable for the product lifetime; less irritating',
      percentages: '2-10% effective range'
    },
    sodium: {
      name: 'Sodium Ascorbyl Phosphate (SAP)',
      effectiveness: 'Stable derivative; converts to LAA in skin; also has direct antibacterial properties useful for acne',
      percentages: '5-10%'
    },
    THD: {
      name: 'Tetrahexyldecyl Ascorbate (THD Ascorbate)',
      effectiveness: 'Oil-soluble vitamin C derivative; oil-soluble form penetrates differently; considered highly effective with good stability',
      stability: 'Oil-soluble and air/light stable; excellent for lipid-soluble formulations'
    }
  },
  synergies: 'Vitamin C + Vitamin E + Ferulic Acid is the classic evidence-backed antioxidant cocktail (Skinceuticals CE Ferulic pioneered this combination); ferulic acid stabilises both vitamins C and E and doubles their antioxidant effectiveness',
  bestFor: 'Brightening hyperpigmentation; evening skin tone; antioxidant protection (use in morning before SPF); anti-ageing (collagen support)',
  ethnicConsiderations: 'Vitamin C is one of the most important active ingredients for communities with higher PIH (post-inflammatory hyperpigmentation) prevalence (Fitzpatrick III-VI); consistent use over 6-12 weeks produces measurable brightening of dark spots; particularly beneficial for South Asian, Arab, Latina, Black American, and African communities managing hyperpigmentation',
  recommendedProducts: ['SkinCeuticals C E Ferulic (gold standard, expensive)', 'Paula\'s Choice C15 Super Booster', 'The Ordinary Vitamin C Suspension 23% + HA Spheres (irritating for sensitive skin)', 'Timeless 20% Vitamin C + E Ferulic Acid Serum (excellent dupe for SkinCeuticals at fraction of the price)', 'Good Molecules Vitamin C Serum (ascorbyl glucoside, stable, affordable)']
};

export const RETINOID_GUIDE = {
  title: 'Retinoids (Vitamin A Derivatives)',
  what: 'Retinoids are vitamin A derivatives that are the most evidence-backed anti-ageing class of skincare ingredients; they affect gene expression in skin cells to accelerate cell turnover and stimulate collagen production; prescription retinoids are the most studied topicals in dermatology',
  forms: {
    tretinoin: {
      name: 'Tretinoin (Retinoic Acid)',
      availability: 'Prescription only in UK, US, Australia; OTC in some countries including Mexico and some European countries',
      effectiveness: 'The gold standard; most evidence-backed topical for both acne and anti-ageing; directly binds to retinoic acid receptors in skin',
      percentages: '0.025%, 0.05%, 0.1%; start with lowest and work up',
      use: 'The only retinoid the FDA has approved for treating wrinkles (in addition to acne); 6 months to 1+ year for full benefit visible'
    },
    adapalene: {
      name: 'Adapalene',
      availability: 'OTC 0.1% in US (Differin); prescription 0.3% in some countries',
      effectiveness: 'Third-generation retinoid; similar efficacy to tretinoin for acne with significantly less irritation; less evidence for anti-ageing than tretinoin',
      note: 'The most tolerable prescription-strength retinoid; excellent starting point for retinoid newcomers; well-studied in darker skin tones for acne'
    },
    retinol: {
      name: 'Retinol',
      availability: 'OTC',
      effectiveness: 'Converted to retinaldehyde then to retinoic acid in the skin; each conversion step reduces potency; approximately 10-100x less potent than tretinoin depending on concentration',
      percentages: '0.025%-1%; effective range for most people is 0.1%-0.5%; very high concentrations (1%+) are not significantly more effective and are much more irritating',
      note: 'The most widely available retinoid; significant time lag (6+ months) to see full results due to conversion steps; lower irritation than prescription retinoids'
    },
    retinal: {
      name: 'Retinaldehyde (Retinal)',
      availability: 'OTC (some high-end brands); also written as "retinaldehyde"',
      effectiveness: 'One conversion step from retinoic acid (versus two for retinol); 5-10x more potent than retinol; much less irritating than tretinoin; considered the sweet spot between retinol and tretinoin',
      products: ['Avene RetrinAL 0.1 Concentrate (the most celebrated retinal product)', 'Medik8 Crystal Retinal', 'ISDIN Isdinceutics Retinal']
    },
    retinylEsters: {
      name: 'Retinyl Esters (Retinyl Palmitate, Retinyl Acetate)',
      availability: 'OTC; the most gentle form',
      effectiveness: 'Weakest retinoid family member; requires multiple conversion steps; very low irritation; evidence for benefit in very sensitive skin where stronger forms are not tolerated',
      note: 'Often used in products for very sensitive or reactive skin; for those who cannot tolerate retinol'
    }
  },
  retinoidization: {
    what: 'Retinisation is the adjustment period when starting a retinoid; lasts 2-6 weeks typically; characterised by: dryness, peeling, flaking, redness, irritation, and temporary increase in breakouts (purging)',
    management: ['Start with the lowest available percentage', 'Apply every third night for first two weeks; every other night for weeks 3-4; nightly if tolerated', 'Sandwich method: apply moisturiser first, then retinoid, then moisturiser on top — reduces irritation', 'Avoid using AHAs/BHAs/vitamin C on the same night as a retinoid (especially at first)', 'Never use retinoids under occlusion (no vaseline on top) as this dramatically increases absorption and irritation', 'Strictly increase SPF use during retinoid treatment as skin is more photosensitive'],
    purging: 'Skin purging (increase in breakouts) is normal in the first 4-8 weeks of retinoid use; retinoids speed cell turnover, bringing existing congestion to the surface faster; true purging occurs only in areas already prone to breakouts; if new breakouts appear in areas never previously affected, the retinoid may be the cause rather than purging'
  },
  darkSkinConsiderations: {
    PIHrisk: 'The irritation caused by retinoid introduction can trigger post-inflammatory hyperpigmentation in Fitzpatrick III-VI skin; this means the very product being used to treat PIH can temporarily worsen it during the adjustment phase if not started correctly',
    strategy: ['Start with lowest possible concentration (0.01-0.025% retinol)', 'Use every third night and extend the spacing if any irritation occurs', 'If irritation or darkening occurs, reduce frequency and add hydration and barrier repair', 'Adapalene is often recommended for darker skin tones because of its significantly lower irritation profile', 'Consider a dermatologist consultation before starting tretinoin if Fitzpatrick V-VI with PIH history']
  }
};

export const NIACINAMIDE_GUIDE = {
  title: 'Niacinamide (Vitamin B3)',
  what: 'Niacinamide is the active form of vitamin B3 (nicotinamide); one of the most versatile and well-tolerated skincare actives; addresses multiple skin concerns simultaneously with minimal risk of irritation; suitable for all skin types and tones',
  mechanism: 'Niacinamide works through multiple pathways: (1) inhibits melanosome transfer from melanocytes to keratinocytes — reduces pigmentation reaching the skin surface; (2) strengthens the skin barrier by stimulating ceramide and fatty acid synthesis; (3) reduces sebum production (anti-acne); (4) has anti-inflammatory effects reducing redness; (5) stimulates collagen production; (6) reduces transepidermal water loss (TEWL)',
  percentages: {
    standard: '2-5% is effective for barrier strengthening and anti-pigmentation; 4-5% is the most commonly studied and used range',
    higher: '5-10% addresses acne and sebum reduction; some evidence for higher concentrations (10%) for more significant pigmentation',
    tooMuch: 'Above 10% some people experience flushing (niacin flush) and irritation; the 10% products from The Ordinary generate this response in some users; 4-5% is sufficient for most benefits without side effects'
  },
  withVitaminC: {
    myth: 'A persistent internet myth claims niacinamide and vitamin C cannot be used together because they form nicotinic acid (niacin); this is largely outdated information; the reaction does occur but requires very high temperatures and concentrations not found in skincare products; in real use they can be used together',
    practical: 'If concerned, apply them at different times of day (vitamin C in morning, niacinamide in evening); this also allows each to have optimal pH conditions (vitamin C needs low pH, niacinamide is more flexible)'
  },
  ethnicConsiderations: 'Niacinamide is one of the most recommended brightening ingredients for darker skin tones because it reduces melanosome transfer rather than directly inhibiting melanin synthesis; it does not cause the inflammation that can worsen PIH in sensitive darker skin; safe, gentle, and effective for South Asian, Arab, Black American, African, and Latina skin types',
  recommendedProducts: ['The Ordinary Niacinamide 10% + Zinc 1% (affordable, effective; the zinc also reduces sebum)', 'Paula\'s Choice 10% Niacinamide Booster', 'Good Molecules Discoloration Correcting Serum (niacinamide + tranexamic acid combination)', 'Cetaphil Healthy Radiance Daily Vitamin C Serum (actually contains more niacinamide than vitamin C)']
};

export const AHA_BHA_GUIDE = {
  title: 'Exfoliating Acids (AHAs and BHAs)',
  overview: 'Chemical exfoliants dissolve the bonds between dead skin cells rather than physically abrading them; generally superior to physical scrubs for precise, controlled exfoliation; divided into two main categories: AHAs (water-soluble, surface-exfoliating) and BHAs (oil-soluble, pore-penetrating)',
  AHAs: {
    glycolicAcid: {
      name: 'Glycolic Acid',
      what: 'The smallest AHA molecule; fastest penetration; most studied; most effective for anti-ageing at higher concentrations; derived from sugarcane',
      percentages: '5-10% for OTC; 20-70% professional peels; 5-7% is effective for regular use',
      bestFor: 'Anti-ageing; uneven texture; mild hyperpigmentation; increasing radiance',
      caution: 'Most potentially irritating AHA due to small molecular size and fast penetration; those with reactive skin may prefer lactic or mandelic acid'
    },
    lacticAcid: {
      name: 'Lactic Acid',
      what: 'Larger molecular size than glycolic; gentler with slower penetration; additionally acts as a humectant (draws moisture) unlike glycolic; derived from milk (lactobacillus fermentation)',
      percentages: '5-10% OTC; more suitable for sensitive skin and darker skin tones',
      bestFor: 'Sensitive skin; dry skin (humectant properties); hyperpigmentation; beginners to acids',
      darkSkin: 'Preferred AHA for Fitzpatrick III-VI skin due to lower irritation risk'
    },
    mandelicAcid: {
      name: 'Mandelic Acid',
      what: 'Very large AHA molecule from bitter almonds; slowest penetration; most gentle AHA; additionally has mild antibacterial properties',
      bestFor: 'Very sensitive skin; darker skin tones; acne-prone skin; those who cannot tolerate glycolic or lactic',
      darkSkin: 'The most recommended AHA for Fitzpatrick V-VI skin due to the lowest irritation potential; large molecule reduces risk of PIH-triggering inflammation'
    },
    PHAs: {
      name: 'Polyhydroxy Acids (Gluconolactone, Lactobionic Acid)',
      what: 'Next generation beyond AHAs; even larger molecules; extremely gentle; also act as moisturisers and antioxidants; considered a gentler alternative to AHAs with additional benefits',
      bestFor: 'Extremely sensitive or reactive skin; rosacea-prone skin; those who cannot tolerate standard AHAs'
    }
  },
  BHAs: {
    salicylicAcid: {
      name: 'Salicylic Acid (Beta Hydroxy Acid)',
      what: 'The only BHA in common skincare use; oil-soluble — uniquely able to penetrate and dissolve inside the pore; derived from willow bark; also has anti-inflammatory properties',
      percentages: '0.5-2% for OTC use; 2% is the FDA-approved acne treatment concentration',
      bestFor: 'Acne; blackheads; whiteheads; oily skin; enlarged pores; the only exfoliant that enters pore canals to dissolve congestion',
      mechanism: 'Salicylic acid exfoliates both the surface and inside the pore (due to oil-solubility); reduces sebum production; anti-inflammatory (reduces pimple redness and swelling); mild antibacterial',
      caution: 'Do not use during pregnancy (salicylate absorption concern); those with aspirin sensitivity should avoid'
    }
  },
  frequency: 'AHAs/BHAs should be used 1-3x per week for most skin types; daily use is possible with lower concentrations but increases photosensitivity and risk of over-exfoliation; always use SPF the morning after AHA/BHA use',
  overExfoliation: 'Signs of over-exfoliated skin: stinging when applying water or other products; redness; excessive sensitivity; tight shiny skin; increased breakouts; these signs indicate the barrier has been compromised; stop all exfoliants and focus on barrier repair (ceramides, fatty acids, plain moisturiser) for 1-2 weeks',
  darkSkinProtocol: 'For Fitzpatrick IV-VI skin: start with mandelic or lactic acid (not glycolic); use maximum 1-2x per week initially; always patch test; watch for any darkening of exfoliated areas (potential PIH); start at low concentration (5% lactic acid); add BHA (salicylic 0.5-1%) for acne-specific concerns; see a dermatologist if unsure'
};

export const HYALURONIC_ACID_GUIDE = {
  title: 'Hyaluronic Acid (HA)',
  what: 'Hyaluronic acid is a natural glycosaminoglycan (sugar molecule) found in the skin, joints, and eyes; one of the most powerful humectants in skincare; can hold up to 1000 times its weight in water',
  mechanism: 'HA works primarily as a humectant — it draws water molecules from the environment and from deeper skin layers to the epidermis; large molecular weight HA sits on the skin surface and provides immediate plumping; smaller molecular weight HA penetrates more deeply; the smallest HA (sodium hyaluronate) penetrates well but high concentrations of very small HA can cause skin dehydration in dry climates',
  variants: {
    highMolecular: 'High molecular weight HA (100kDa+): sits on skin surface; immediate plumping and barrier function; less potential for irritation',
    lowMolecular: 'Low molecular weight HA (under 50kDa): penetrates deeper; longer-lasting hydration; very small fragments may have pro-inflammatory effects in high concentrations',
    sodiumHyaluronate: 'Sodium hyaluronate: the sodium salt form of HA; smaller molecule; penetrates well; the form most commonly found in skincare products (more stable than pure HA)'
  },
  application: 'Apply HA to damp skin (just after washing or misting) to give it water to draw in; applying HA to very dry skin in a dry environment causes it to draw water out of the deeper skin layers, potentially increasing dehydration; immediately follow with a moisturiser to seal in the hydration',
  ethnicConsiderations: 'HA is well-tolerated across all skin types and tones; no ethnic-specific contraindications; particularly beneficial for communities in dry climates (Gulf Arab, East African where Harmattan/dry season is extreme); essential in post-treatment skin care after lasers, chemical peels, or skin treatments'
};

export const CERAMIDE_GUIDE = {
  title: 'Ceramides — The Skin Barrier Builders',
  what: 'Ceramides are a class of lipid (fat) molecules that make up approximately 50% of the skin barrier\'s lipid matrix (alongside cholesterol and fatty acids); the lipid matrix fills the spaces between skin cells like mortar between bricks; ceramides are the single most important lipid class for barrier function',
  mechanism: 'When ceramides are depleted (through over-washing, harsh products, cold weather, or ageing), the skin barrier becomes permeable: water escapes easily (increased TEWL) and irritants and allergens can enter; this leads to dryness, sensitivity, and conditions like eczema and atopic dermatitis; replacing ceramides restores barrier integrity',
  types: 'The skin contains at least 12 types of ceramide (Ceramide 1-12, also designated as EOP, EOS, EOH, AP, NP, AS, NS, etc.); the most effective ceramide skincare products contain a mixture of multiple ceramide types to match the skin\'s natural lipid profile',
  keyProducts: {
    CeraVe: 'CeraVe products contain a blend of Ceramides 1, 3, and 6-II (NP, AP, and EOP equivalents) plus hyaluronic acid and cholesterol; the patented "MVE technology" slowly releases ingredients over 24 hours; established themselves as the dermatologist-recommended ceramide brand',
    Elizabeth: 'Elizabeth Arden Ceramide capsules are serums in individual capsules; a more expensive option',
    Medik8: 'Medik8 and other niche brands produce sophisticated ceramide products'
  },
  ethnicConsiderations: {
    eczema: 'Atopic dermatitis (eczema) disproportionately affects children of African and African-descent origin; a 2019 study found Black children in the US are 1.7x more likely to develop eczema than white children; research suggests Black skin may have naturally lower ceramide levels in some populations, contributing to this disparity; ceramide-rich moisturisers are particularly important for Black and African-descent children with eczema tendency',
    drySkin: 'Dry climates (Middle East, parts of Africa) increase ceramide depletion; communities in these climates benefit particularly from ceramide-rich moisturisers',
    darkSkin: 'Dark skin (Fitzpatrick V-VI) has a more compact stratum corneum with more cell layers than lighter skin — providing some natural barrier advantage; however, the greater susceptibility to PIH means maintaining excellent barrier function (reducing inflammation triggers) is even more important'
  }
};

export const TRANEXAMIC_ACID_GUIDE = {
  title: 'Tranexamic Acid — The Rising Star for Hyperpigmentation',
  what: 'Tranexamic acid is an antifibrinolytic drug (used medically to reduce bleeding) that was discovered to have significant depigmenting effects when applied topically; one of the most promising relatively newer ingredients for hyperpigmentation treatment, particularly for PIH and melasma',
  mechanism: 'Multiple mechanisms: (1) inhibits plasminogen interaction with keratinocytes which reduces UV-induced pigmentation; (2) reduces prostaglandin release which signals melanocytes to produce melanin; (3) may directly inhibit tyrosinase; the multi-pathway approach makes it effective for various types of hyperpigmentation',
  percentages: '2-5% OTC topical; 1-3% is effective in most studies; also available as oral supplement (prescription in some countries — used off-label for melasma)',
  compared: 'Tranexamic acid compared to kojic acid and arbutin: all inhibit tyrosinase and reduce pigmentation; tranexamic is generally considered to have a better safety profile (less irritating) than kojic acid and shows promising results in melasma studies comparable to kojic acid; the combination of tranexamic acid + niacinamide is particularly effective',
  bestFor: 'Melasma; PIH; overall uneven skin tone; particularly valuable for darker skin tones where safer brightening options are needed',
  ethnicConsiderations: 'Among the best-tolerated brightening ingredients for Fitzpatrick IV-VI skin; does not work through irritating mechanisms that could worsen PIH; pairs very well with niacinamide; growing recognition by dermatologists specialising in skin of colour as a first-line brightening ingredient',
  recommendedProducts: ['Good Molecules Discoloration Correcting Serum (tranexamic + niacinamide + vitamin C)', 'Versed Doctor\'s Visit Instant Resurfacing Mask', 'SkinMedica Lytera 2.0 (professional brand)', 'Musely Spot Cream (prescription blend sometimes includes tranexamic)']
};

export const KOJIC_ACID_ARBUTIN = {
  title: 'Kojic Acid and Arbutin — Traditional Brightening Ingredients',
  kojicAcid: {
    what: 'Kojic acid is a by-product of the fermentation of rice (used in sake and soy sauce production in Japan); discovered to have strong tyrosinase-inhibiting properties in the 1980s; one of the most commonly used brightening ingredients in Asian skincare and globally',
    mechanism: 'Chelates copper ions necessary for tyrosinase enzyme function, making it unable to produce melanin; effective brightening agent',
    caution: 'Kojic acid is moderately irritating; can cause contact dermatitis in some users; not as gentle as niacinamide or tranexamic acid; concentrations above 1% increase irritation risk; always patch test; not recommended as first-line treatment for sensitive dark skin types',
    percentages: '0.5-2% OTC; effectiveness peaks at about 1%; above 2% mainly increases irritation without proportional benefit',
    darkSkin: 'Use with caution on Fitzpatrick V-VI skin; irritation can worsen PIH; if used, start low and monitor carefully'
  },
  arbutin: {
    what: 'Arbutin is the glucoside (sugar-bound) form of hydroquinone; it releases hydroquinone slowly on the skin surface, inhibiting tyrosinase; considered a gentler alternative to hydroquinone',
    forms: {
      alphaArbutin: 'Alpha-arbutin is the more stable form; more potent than beta-arbutin; the preferred form in contemporary skincare',
      betaArbutin: 'Beta-arbutin: natural form found in bearberry leaves; less stable, converts to alpha-arbutin or hydroquinone over time'
    },
    percentages: '0.3-2% alpha-arbutin in OTC products',
    safetyProfile: 'Generally well-tolerated; considered gentler than hydroquinone and kojic acid; suitable for sensitive skin',
    recommendedProducts: ['The Ordinary Alpha Arbutin 2% + HA', 'Paula\'s Choice BOOST 10% Azelaic Acid (combined with other brighteners)']
  }
};

export const HYDROQUINONE_GUIDE = {
  title: 'Hydroquinone — The Most Potent OTC/Prescription Brightener',
  what: 'Hydroquinone is the most powerful and evidence-backed depigmenting agent in dermatology; it directly inhibits tyrosinase and inhibits melanocyte function; the gold standard for melasma and severe PIH treatment in dermatology',
  percentages: {
    OTC: '2% in the US (OTC available); banned or restricted to prescription in EU, UK, Australia, and many other countries due to safety concerns',
    prescription: '4-8% by prescription from a dermatologist; higher concentrations (10%+) used professionally for specific situations'
  },
  mechanism: 'Inhibits tyrosinase, inhibits melanocyte function, and at higher concentrations is toxic to melanocytes; more powerful than any other brightening ingredient but with greater risk',
  risks: {
    ochronosis: 'Exogenous ochronosis — paradoxical darkening of the skin from long-term hydroquinone use; most commonly reported in Black African women using high concentrations available in some African markets (not at FDA-approved 2% concentrations); causes blue-black discolouration that is very difficult to reverse; one of the primary reasons many countries restrict hydroquinone',
    contact: 'Contact dermatitis and irritation are more common than with gentler brighteners; always patch test',
    concentrations: 'Very high concentration hydroquinone products (10-20%+) are sold illegally in some African and South Asian markets as "bleaching creams"; these products carry serious risk of ochronosis and systemic absorption; regulation exists for good reason'
  },
  use: 'A dermatologist-supervised 12-week course of prescription hydroquinone for severe melasma or PIH; followed by maintenance with gentler brighteners; cycling off hydroquinone (not using indefinitely) is recommended',
  bleachingCreams: {
    context: 'Products marketed as "skin bleaching" or "skin lightening" creams in some African, South Asian, Caribbean, and East Asian markets often contain unregulated high concentrations of hydroquinone, mercury, or corticosteroids; these products are associated with serious health risks including ochronosis, mercury poisoning, and systemic corticosteroid effects; they are regulated (often prohibited) in many countries but continue to be sold in unregulated markets',
    cultural: 'The existence of a massive skin bleaching market in communities of colour reflects the deep damage of colourism (discrimination based on skin tone within communities); lighter skin tone privileges resulting from colonial histories have created a market for skin bleaching that is both a public health concern and a manifestation of structural racism\'s damage to communities\' self-perception'
  }
};

export const SUNSCREEN_ACTIVE_INGREDIENTS = {
  title: 'Sunscreen Active Ingredients for Ethnic Skin',
  mineral: {
    zinc: {
      name: 'Zinc Oxide',
      what: 'Physical/mineral UV filter; sits on skin surface and reflects UVA and UVB; broadest UV coverage of any single sunscreen ingredient; rated Very High SPF and excellent UVA protection; FDA-approved',
      whitecast: 'Zinc oxide is white and leaves a white cast on medium to dark skin tones; nanoparticle zinc oxide is less white-casting but has raised some safety questions (generally considered safe as topical); newer formulations (tinted mineral sunscreens, microfine zinc) reduce white cast',
      darkSkin: 'White cast from zinc oxide is a major barrier to sunscreen use in communities of colour; finding sunscreens with tinted mineral options or hybrid formulas is important for this demographic; the dermatology community has recognised this and more skin-tone-appropriate mineral sunscreens are being developed'
    },
    titanium: {
      name: 'Titanium Dioxide',
      what: 'Physical/mineral UV filter; also sits on skin surface; excellent UVB protection but less UVA protection than zinc oxide; often combined with zinc oxide to cover both UVA and UVB thoroughly',
      whitecast: 'Also causes white cast; combined zinc + titanium dioxide sunscreens have the most white cast'
    }
  },
  chemical: {
    avobenzone: 'Strong UVA absorber; often combined with other chemical filters; photounstable (breaks down in sunlight) — must be combined with photostabilisers like octocrylene or Helioplex',
    octinoxate: 'UVB absorber; under regulatory review in US and banned in Hawaii due to coral reef concerns',
    tinosorbs: {
      what: 'Tinosorb S and Tinosorb M are next-generation broad-spectrum chemical UV filters; extremely effective UVA + UVB; photostable; widely used in European and Asian sunscreens; not yet FDA-approved in the US',
      note: 'One reason European and Asian (particularly Korean) sunscreens are considered superior is access to these advanced UV filter systems; K-beauty sunscreens benefit significantly from Tinosorb and Uvinul availability'
    },
    homosalate: 'UVB absorber; under FDA review for potential endocrine disruption at high doses'
  },
  darkSkinNote: 'Dark skin (Fitzpatrick V-VI) has higher intrinsic SPF from melanin (approximately SPF 13.4 in the deepest skin vs 3.4 in the lightest); this provides some UV protection but is not sufficient to prevent all UV damage, PIH from sun exposure, or skin cancer; SPF 30 is the minimum recommendation from dermatologists for all skin tones; SPF 50+ for those with melasma, PIH, or high sun exposure',
  tintedSPF: 'Tinted mineral sunscreens provide the dual benefit of UV protection with colour coverage that avoids white cast; particularly important for darker skin tones; iron oxide pigments in tinted SPF also provide protection against visible light (HEV/high energy visible light) which can worsen melasma and PIH; iron oxide protection from visible light is a significant additional benefit not found in untinted sunscreens'
};

export const ETHNIC_INGREDIENT_PRIORITIES = {
  'west-african': {
    priority: ['SPF 30+ broad spectrum daily (critical for PIH-prone Fitzpatrick V-VI skin)', 'Niacinamide 4-5% for PIH management (very safe, very effective)', 'Tranexamic acid for melasma and hyperpigmentation', 'Vitamin C 10-15% (morning, with SPF always)', 'Lactic or mandelic acid (NOT glycolic) for gentle exfoliation', 'Ceramides for barrier support', 'Orange or terracotta colour corrector for dark circles'],
    avoid: 'High-concentration kojic acid (irritation risk worsening PIH); high-strength hydroquinone without dermatologist supervision; physical scrubs (cause inflammation)'
  },
  'south-asian': {
    priority: ['Vitamin C 10-15% (brightening, culturally important for South Asian beauty standards)', 'SPF 30-50 (UV often intensified; South Asian women show high melasma prevalence)', 'Niacinamide for hyperpigmentation', 'Alpha arbutin for spot treatment', 'Kojic acid in Korean/Japanese formulas (popular in South Asian markets) — use with caution', 'Bakuchiol (Ayurvedic-derived retinol alternative from babchi plant; traditional significance)', 'Azelaic acid for PIH and acne (very well-tolerated)'],
    traditional: 'Turmeric (curcumin): traditional South Asian brightening ingredient; limited penetration into skin but cultural significance; some evidence for anti-inflammatory effects'
  },
  caribbean: {
    priority: ['SPF 30+ (high UV in Caribbean; tropical sun increases PIH risk)', 'Niacinamide', 'Vitamin C for uneven tone', 'Aloe vera (broadly soothing; traditional ingredient throughout Caribbean)', 'Barrier support ceramides for textured hair communities with drier skin tendencies'],
    note: 'Afro-Caribbean skin shares the Fitzpatrick V-VI ingredient priorities; Indo-Caribbean follows South Asian priorities'
  },
  arab: {
    priority: ['SPF 30-50+ (Middle East has extreme UV; Fitzpatrick range varies widely)', 'Vitamin C (brightening; very popular in Arab beauty market)', 'Niacinamide', 'Retinol/retinal for anti-ageing (Arab women invest heavily in anti-ageing products)', 'Hyaluronic acid (extremely dry Gulf climate)', 'Ceramides for desert climate barrier repair', 'Black seed oil (Nigella sativa): traditional Arab medicine ingredient; anti-inflammatory; limited but growing clinical evidence'],
    note: 'Gulf Arab women are high-spending beauty consumers who have driven significant innovation in Middle Eastern beauty markets'
  },
  latina: {
    priority: ['SPF 30-50 (Latin America has intense UV in many regions)', 'Vitamin C', 'Niacinamide', 'Azelaic acid for PIH and acne', 'Tranexamic acid for melasma (Latina women have high melasma prevalence linked to hormonal factors and UV exposure)'],
    melasma: 'Melasma (chloasma) is particularly prevalent in Latina women; hormonal contraception and pregnancy increase melasma risk; sun protection is the most critical prevention'
  },
  'east-asian': {
    priority: ['Korean sunscreen (K-beauty advanced filter systems)', 'Niacinamide (extremely popular in K-beauty and J-beauty)', 'Vitamin C (brightening; Asian skin care heavily values brightness)', 'Hyaluronic acid (glass skin foundation)', 'Retinol in K/J beauty routine', 'Green tea extract (EGCG: antioxidant; catechins in green tea are anti-inflammatory and photoprotective; significant in Japanese and Korean skincare)', 'Snail secretion filtrate (Korean beauty staple; growth factors and glycoproteins in snail mucin support wound healing and skin regeneration)'],
    asian: 'East Asian skin care philosophy often centres on preventive care (preventing ageing and pigmentation before they occur) rather than treatment; SPF is the cornerstone of East Asian skincare routines; some of the world\'s most diligent sunscreen users are in Japan and Korea'
  },
  'east-african': {
    priority: ['SPF 30+ (Horn of Africa has extreme UV)', 'Niacinamide', 'Vitamin C', 'Ceramides and barrier support (dry East African climates)', 'Tranexamic acid for PIH'],
    traditional: 'Frankincense extract: anti-inflammatory, antioxidant; traditional use in the Horn of Africa; some evidence for skin benefits; increasingly incorporated into contemporary East African natural beauty products'
  },
  'south-african': {
    priority: ['SPF 50+ (South Africa has very high UV due to altitude, UV hole over Antarctica, strong sun)', 'Niacinamide', 'Vitamin C', 'Ceramides', 'Tranexamic acid or alpha arbutin for PIH'],
    indigenous: 'Rooibos extract (Aspalathus linearis): South African plant; high antioxidant content; anti-inflammatory; growing use in South African skincare brands; buchu extract: anti-inflammatory, antiseptic properties; indigenous South African beauty ingredient'
  },
  'black-american': {
    priority: ['SPF 30+ (the most critical and historically most skipped step; decades of "Black don\'t crack" mythology led to under-SPF use)', 'Niacinamide (most recommended for PIH)', 'Vitamin C (brightening)', 'Tranexamic acid for melasma/PIH', 'Retinol/adapalene for acne and anti-ageing (start low, go slow)', 'Ceramides for barrier support', 'Azelaic acid (very well-tolerated, addresses acne + PIH simultaneously)'],
    blackDontCrack: {
      myth: '"Black don\'t crack" is the popular cultural saying acknowledging that Black skin typically ages more slowly in terms of wrinkling (due to higher melanin content providing photoprotection and higher natural collagen content in darker skin); while partially true, the myth has led to insufficient attention to skin cancer risk and UV damage in Black communities; skin cancer is diagnosed later at more advanced stages in Black patients partly due to this mythology and lack of targeted skin cancer awareness campaigns; SPF is absolutely necessary for Fitzpatrick V-VI skin',
      reality: 'While wrinkles do form later in very dark skin, sun-induced skin cancer risk is real; melanoma in Black patients often occurs on palms of hands and soles of feet (acral lentiginous melanoma) where melanin provides less protection; late diagnosis dramatically increases mortality; SPF is non-negotiable for all skin tones'
    }
  }
};

export function getIngredientGuide(ingredient) {
  const map = {
    vitaminC: VITAMIN_C_GUIDE,
    retinoids: RETINOID_GUIDE,
    niacinamide: NIACINAMIDE_GUIDE,
    acids: AHA_BHA_GUIDE,
    ha: HYALURONIC_ACID_GUIDE,
    ceramides: CERAMIDE_GUIDE,
    tranexamic: TRANEXAMIC_ACID_GUIDE,
    kojicArbutin: KOJIC_ACID_ARBUTIN,
    hydroquinone: HYDROQUINONE_GUIDE,
    sunscreen: SUNSCREEN_ACTIVE_INGREDIENTS
  };
  return map[ingredient] || null;
}

export function getEthnicIngredientPriorities(communityId) {
  const directMap = {
    'west-african': ETHNIC_INGREDIENT_PRIORITIES['west-african'],
    'south-asian': ETHNIC_INGREDIENT_PRIORITIES['south-asian'],
    caribbean: ETHNIC_INGREDIENT_PRIORITIES.caribbean,
    arab: ETHNIC_INGREDIENT_PRIORITIES.arab,
    latina: ETHNIC_INGREDIENT_PRIORITIES.latina,
    'east-asian': ETHNIC_INGREDIENT_PRIORITIES['east-asian'],
    'east-african': ETHNIC_INGREDIENT_PRIORITIES['east-african'],
    'south-african': ETHNIC_INGREDIENT_PRIORITIES['south-african'],
    'black-american': ETHNIC_INGREDIENT_PRIORITIES['black-american']
  };
  return directMap[communityId] || null;
}

export const INGREDIENTS_ENCYCLOPEDIA_STATS = {
  moduleId: 'skincare_ingredients_encyclopedia',
  version: '1.0.0',
  topics: ['vitamin C LAscorbic acid derivatives stability', 'retinoids tretinoin retinol retinal adapalene', 'retinoid PIH risk dark skin', 'niacinamide vitamin B3 melanosome transfer', 'AHA BHA glycolic lactic mandelic salicylic', 'hyaluronic acid molecular weight', 'ceramides barrier skin eczema Black children', 'tranexamic acid melasma PIH', 'kojic acid arbutin tyrosinase', 'hydroquinone ochronosis bleaching creams colourism', 'zinc oxide white cast dark skin', 'Tinosorb European sunscreen advanced filters', 'tinted SPF iron oxide HEV visible light', 'SPF Black skin cancer myth', 'bakuchiol Ayurvedic retinol', 'green tea EGCG Korean Japanese skincare', 'rooibos South African antioxidant', 'frankincense East Africa anti-inflammatory'],
  communitiesSupported: 9,
  keyFacts: [
    'Retinoids (retinol, adapalene, tretinoin) can cause post-inflammatory hyperpigmentation in Fitzpatrick III-VI skin during the adjustment phase — the same problem they are often used to treat; starting with the absolute lowest concentration (0.01-0.025% retinol) and extending the spacing between applications is critical for darker skin tones',
    'The "Black don\'t crack" cultural saying about Black skin ageing slowly has led to insufficient SPF use in Black communities; while melanin does provide some UV protection (natural SPF 13.4 in the darkest skin vs 3.4 in the lightest skin), this is insufficient; melanoma is diagnosed at more advanced stages in Black patients partly due to reduced skin cancer awareness, and acral lentiginous melanoma (on palms and soles) occurs in areas where melanin provides less protection',
    'Exogenous ochronosis — paradoxical permanent darkening of skin — is a serious risk from long-term high-concentration hydroquinone use; it has been most commonly reported in Black African women using unregulated high-concentration (10-20%+) hydroquinone skin bleaching products; these products exist because of colourism and cause serious, often irreversible harm; the FDA-approved 2% OTC concentration has a much better safety profile',
    'Tinted mineral sunscreens contain iron oxide pigments that block visible light (high-energy visible/HEV light); this is important because visible light can worsen melasma and PIH independently of UV — a protection that untinted sunscreens do not provide; for communities with higher melasma prevalence (Latina women, South Asian women, Arab women), tinted SPF with iron oxides is particularly valuable',
    'Niacinamide (vitamin B3 at 4-5%) reduces pigmentation by inhibiting the transfer of melanosomes from melanocytes to keratinocytes — the step that actually deposits pigment in the skin surface cells — rather than by suppressing melanin production itself; this mechanism is particularly valuable because it does not create the irritation that can trigger more pigmentation in darker skin types'
  ]
};
