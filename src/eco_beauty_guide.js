/**
 * MIRRR Eco & Sustainable Beauty Guide
 * Sustainable packaging, clean beauty myths, refillable systems,
 * ethical sourcing, DIY beauty, environmental impact of beauty industry,
 * and eco-conscious beauty by ethnic community
 */

// ─── ENVIRONMENTAL IMPACT OF BEAUTY ──────────────────────────────────────────

export const BEAUTY_ENVIRONMENTAL_IMPACT = {
  packaging_problem: {
    scale: 'The global beauty industry produces approximately 120 billion units of packaging annually — most of it plastic that is not recycled.',
    recycling_reality: {
      what_gets_recycled: 'Less than 9% of plastic waste is actually recycled globally. For cosmetics packaging specifically — with its mixed materials, pumps, and contamination from product residue — the recycling rate is thought to be even lower.',
      why_low: 'Cosmetics packaging is often made from multiple materials (glass jar with metal lid with plastic insert), making separation extremely difficult. Residual product contaminates recycling streams. Small pumps and caps fall through sorting machinery.',
      greenwashing: 'Claiming packaging is "recyclable" is different from it being recycled. Check whether it is accepted by your LOCAL recycling programme — rules vary enormously by region.',
    },
    microplastics: {
      what: 'Microplastics are plastic particles under 5mm — they enter water systems and the food chain.',
      in_beauty: 'Microbeads (now banned in many countries), glitter, certain film-forming polymers in cosmetics, and degradation of larger plastic packaging all contribute microplastics.',
      current_status: 'The EU banned microplastics in rinse-off products in 2023. The UK banned microbeads in 2018. The US banned rinse-off microbeads in 2015.',
    },
  },

  ingredient_concerns: {
    palm_oil: {
      prevalence: 'Palm oil (or its derivatives — sodium lauryl sulfate, glycerin, stearic acid, etc.) is found in an estimated 70% of cosmetics.',
      issue: 'Palm oil production has driven significant deforestation in Indonesia, Malaysia, and West Africa, destroying orangutan and tiger habitat.',
      solution: 'RSPO (Roundtable on Sustainable Palm Oil) certified palm oil is an improvement but contested. Some brands are working toward palm-free formulations.',
    },
    mica: {
      prevalence: 'Mica gives shimmer to eyeshadow, highlighters, and foundations. Over 50% of the world\'s mica comes from Jharkhand and Bihar, India.',
      issue: 'Child labour in mica mining in India has been extensively documented. The dark, glittery shimmer on beauty counters has, historically, come with serious human cost.',
      progress: 'The Responsible Mica Initiative, founded in 2017, tracks and addresses child labour. Some brands now use synthetic mica (fluorophlogopite) — functionally identical, no mining required.',
      synthetic_mica: 'Brands advertising "synthetic mica" have removed this supply chain concern. No performance difference visible to consumers.',
    },
    mineral_oil: {
      concerns: 'Petroleum-derived; not harmful but not sustainable.',
      note: 'Not toxic — mineral oil in cosmetics is highly refined and safe. The environmental concern is that it\'s derived from petroleum.',
    },
    fragrance_ingredients: 'Some synthetic musks (galaxolide, tonalide) are persistent environmental pollutants — they are not biodegradable and accumulate in water systems and fish tissue.',
  },

  carbon_footprint: {
    packaging_vs_formula: 'Research consistently shows that packaging accounts for a larger portion of a cosmetic product\'s carbon footprint than the formula itself — particularly for plastic.',
    shipping: 'Air freight (used for fast delivery) has dramatically higher emissions than sea freight. Consolidated orders and slower shipping reduces footprint.',
    concentrated_products: 'Waterless and concentrated beauty products require less packaging per use and less water as an ingredient (water is heavy to ship). Concentrated products are often significantly more eco-friendly.',
  },
};

// ─── CLEAN BEAUTY MYTHS ──────────────────────────────────────────────────────

export const CLEAN_BEAUTY_MYTHS = {
  definitions_problem: {
    note: 'There is no regulated definition of "clean beauty" — brands can claim it without any verification. "Clean," "natural," "green," and "non-toxic" are marketing terms, not regulated categories.',
    contrast_with_organic: 'USDA Organic certification IS regulated for food and some cosmetics. EU Cosmos Organic is a certified standard in Europe. These are verifiable.',
  },

  common_myths: {
    natural_safe_synthetic_unsafe: {
      myth: '"Natural" ingredients are safe; "synthetic" or "chemical" ingredients are dangerous.',
      reality: 'Everything is a chemical. Arsenic is natural. Botulinum toxin (botox) is natural. Formaldehyde is found in nature (and your body produces it in metabolism). Danger depends on dose, not source. Synthetic vitamins are chemically identical to natural ones. Synthetic mica is safer for child labour concerns.',
      examples: 'Tea tree oil is natural and can cause significant skin irritation and endocrine disruption at high doses. Parabens are synthetic and have been used safely for decades at concentrations used in cosmetics.',
    },

    parabens_dangerous: {
      myth: 'Parabens cause cancer and disrupt hormones.',
      reality: {
        study_origin: 'A 2004 study (Darbre et al.) detected parabens in breast tissue samples. Headlines suggested parabens cause cancer. However: the study did not have a control group, could not show cause vs. correlation, and could not account for where the parabens came from.',
        what_science_says: 'Parabens are among the most studied cosmetic preservatives. Major regulatory bodies (FDA, EU SCCS, Health Canada) have reviewed extensive evidence and concluded that cosmetic parabens are safe at concentrations used in cosmetics (typically 0.01-0.3%).',
        endocrine: 'Parabens bind to oestrogen receptors approximately 10,000-100,000 times more weakly than human oestrogen (estradiol). The body\'s own estrogen is far more potent.',
        conclusion: 'Current scientific consensus does not support parabens being dangerous in cosmetics. Avoiding them is a personal choice; it is not required by evidence.',
      },
    },

    sulfates_stripping: {
      myth: 'Sodium lauryl sulfate (SLS) is toxic.',
      reality: 'SLS is an extremely effective surfactant (cleansing agent). It CAN be irritating for some people, particularly those with sensitive skin, eczema, or contact dermatitis. It can disrupt the skin barrier in some individuals. But it is not toxic — it is rapidly metabolised and does not accumulate in the body.',
      note: 'Sensitivity to SLS is real for some people. Choosing SLS-free is entirely valid if you have sensitive skin. It is not a universal necessity.',
    },

    fragrance_toxic: {
      myth: '"Fragrance" or "parfum" on the ingredient list hides dangerous chemicals.',
      reality: 'Fragrance formulas are trade secrets — companies do not have to disclose individual fragrance ingredients under "fragrance" or "parfum." This lack of transparency is a valid concern, particularly for people with fragrance allergies. Fragrance IS a common allergen. However, the specific claim that "fragrance" contains specifically harmful chemicals is not supported — most fragrance ingredients are assessed by the IFRA (International Fragrance Association) for safety.',
      action: 'If you have fragrance sensitivity or allergy, choosing fragrance-free products is sensible. If you don\'t, the blanket fear of "parfum" on ingredient lists is not based on evidence.',
    },

    aluminum_in_deodorant: {
      myth: 'Aluminum in antiperspirant causes Alzheimer\'s or breast cancer.',
      reality: 'This claim has been studied extensively. No causal link between aluminum in antiperspirant and breast cancer or Alzheimer\'s has been established. Aluminum applied to intact underarm skin does not penetrate in significant quantities.',
      for_sensitive_skin: 'Some people find aluminum-based antiperspirants irritating to skin — this is a valid reason to choose aluminum-free deodorant. But fear of Alzheimer\'s or cancer is not supported by evidence.',
    },
  },

  what_is_legitimately_concerning: {
    formaldehyde_releasers: {
      concern: 'Some preservatives (DMDM hydantoin, diazolidinyl urea, imidazolidinyl urea, quaternium-15) release small amounts of formaldehyde slowly over time. Formaldehyde is a known carcinogen at significant exposure levels.',
      context: 'The amounts released from cosmetics are orders of magnitude below occupational exposure limits. These ingredients are legal and used safely in cosmetics globally. People with formaldehyde sensitivity should avoid them.',
    },
    lead_in_lipstick: {
      concern: 'FDA surveys have found trace amounts of lead in some lipsticks, from naturally occurring lead in colour pigments.',
      context: 'The FDA has set a limit. The levels found are not considered dangerous by regulatory standards. However, given that lips are frequently licked, this is worth being aware of. Choosing pigments from traceable, clean supply chains is reasonable.',
    },
    sunscreen_chemicals: {
      concern: 'Oxybenzone (benzophenone-3) found in chemical sunscreens has been detected in human breast milk and blood, and is toxic to coral reefs.',
      context: 'The FDA has asked for further safety data on oxybenzone. Many Hawaii and reef-protection laws prohibit it. Mineral sunscreens (zinc oxide, titanium dioxide) avoid this concern. This is one of the more substantiated environmental concerns in beauty.',
    },
  },
};

// ─── SUSTAINABLE PACKAGING GUIDE ─────────────────────────────────────────────

export const SUSTAINABLE_PACKAGING = {
  material_hierarchy: {
    best_to_worst_environmental: [
      { material: 'Refillable system (any material)', note: 'Best — dramatically reduces packaging waste per use' },
      { material: 'Glass', note: 'Infinitely recyclable; heavy (higher shipping emissions); widely accepted in recycling' },
      { material: 'Aluminium', note: 'Infinitely recyclable; lighter than glass; widely recycled. Better than glass for shipping carbon' },
      { material: 'PCR (post-consumer recycled) plastic', note: 'Better than virgin plastic — uses existing material. Still plastic but closing the loop' },
      { material: 'Paper/cardboard', note: 'Readily recyclable where contamination by product is minimal; compostable in some cases' },
      { material: 'Bioplastic (PLA)', note: 'Complicated — often requires industrial composting, not home composting; often not accepted by standard recycling; can contaminate recycling streams' },
      { material: 'Standard virgin plastic', note: 'Worst — lowest recycling rates, petroleum-derived' },
    ],
  },

  refillable_beauty: {
    how_it_works: 'Brands offer a permanent outer casing (often premium materials) and refill "pods" or "cartridges" at lower price and environmental footprint than a whole new product.',
    leaders: [
      { brand: 'Kjaer Weis', category: 'Luxury makeup', note: 'Beautiful metal compacts, refillable since founding' },
      { brand: 'Chanel', category: 'Luxury makeup', note: 'Les Beiges foundation and Les Beiges compact refillable' },
      { brand: 'Charlotte Tilbury', category: 'Makeup', note: 'Legendary compacts refillable' },
      { brand: 'Elate Beauty', category: 'Makeup', note: 'B Corp, bamboo packaging, refillable compacts' },
      { brand: 'The Body Shop', category: 'Skincare/haircare', note: 'In-store refill stations; aluminium bottles' },
      { brand: 'Plaine Products', category: 'Haircare', note: 'Aluminium bottles returned and refilled by mail' },
      { brand: 'Laline', category: 'Bath and body', note: 'Refillable home fragrance' },
    ],
  },

  packaging_to_look_for: {
    certification: {
      forest_stewardship_council: 'FSC certified paper — sustainably managed forests.',
      how2recycle: 'US labelling programme — tells you how to actually recycle packaging in the US.',
      EU_recycling_symbol: 'Möbius loop (three arrows) does NOT guarantee recyclability — it means COULD be recycled in some systems, not that your local council accepts it.',
    },
  },
};

// ─── WATERLESS BEAUTY ─────────────────────────────────────────────────────────

export const WATERLESS_BEAUTY = {
  what: 'Waterless (or anhydrous) beauty products are formulated without water as an ingredient. This is both an environmental innovation and a formulation trend.',

  benefits: {
    environmental: [
      'Less shipping weight (water is heavy)',
      'No preservatives needed to prevent microbial growth in water-based formula',
      'Higher concentration of active ingredients per unit',
      'Longer shelf life without water to promote degradation',
    ],
    performance: [
      'Concentrated actives — more effective per application',
      'Oil-based formulas often more compatible with natural skin lipids',
      'Excellent for dry skin and hair',
    ],
  },

  types: {
    solid_shampoo_bars: {
      note: 'A shampoo bar can replace 2-3 plastic bottles. Quality has improved dramatically.',
      good_brands: ['Ethique (New Zealand, sold globally)', 'Lush (wide availability)', 'Kitsch', 'HiBar'],
      learning_curve: 'Transition period of 1-2 weeks as scalp adjusts from sulfate-heavy shampoos. Start by using on ends and gradually work to scalp.',
      hard_water_caution: 'In very hard water areas (high mineral content), solid shampoo bars can leave a residue. Apple cider vinegar rinse resolves this.',
    },
    solid_conditioner_bars: {
      note: 'Harder to make well than shampoo bars. Ethique leads in quality.',
    },
    balm_cleansers: {
      note: 'Oil-based cleansing balms and oils are inherently water-free — and excellent first-cleanse options for removing sunscreen and makeup.',
      waterless_by_nature: 'Many of the best makeup removers are oil-based and naturally anhydrous.',
    },
    serface_oils_and_balms: 'Facial oils, body oils, hair serums — all waterless and concentrated.',
  },
};

// ─── CLEAN CERTIFICATIONS ─────────────────────────────────────────────────────

export const CERTIFICATIONS = {
  legitimate: [
    {
      name: 'USDA Organic',
      what: 'US Department of Agriculture certifies organically farmed ingredients. Strict process.',
      applies_to: 'Agricultural ingredients in the formula. Does NOT regulate all ingredients or packaging.',
      look_for: 'Products with USDA Organic seal; "made with organic" means 70-94% organic; "organic" on the main panel means 95%+.',
    },
    {
      name: 'COSMOS Organic / COSMOS Natural (Ecocert, BDIH, Soil Association, etc.)',
      what: 'European certification standard for organic and natural cosmetics. Regulated and verified.',
      includes: 'Restrictions on petrochemicals; certified organic agricultural ingredients; biodegradable formulation; sustainable packaging requirements.',
    },
    {
      name: 'Leaping Bunny',
      what: 'Cruelty-free certification — verifies no animal testing at any stage of supply chain, including ingredients.',
      note: 'PETA\'s cruelty-free mark is self-reported. Leaping Bunny does third-party auditing.',
    },
    {
      name: 'B Corporation',
      what: 'Business certification for meeting high social and environmental standards overall. Not beauty-specific but a meaningful company-level signal.',
      beauty_brands: ['Attitude', 'Ethique', 'Elate Beauty', 'Plaine Products'],
    },
    {
      name: 'Fairtrade',
      what: 'Certifies that farmers and producers receive fair prices, fair labour conditions, and community development opportunities.',
      in_beauty: 'Shea butter (from West Africa) is one of the most important Fairtrade beauty ingredients.',
    },
  ],

  marketing_terms_without_certification: {
    natural: 'Unregulated. Means nothing without certification to back it.',
    clean: 'Unregulated. Each brand defines it differently.',
    green: 'Unregulated.',
    non_toxic: 'Unregulated. Often marketing language.',
    eco_friendly: 'Unregulated. Look for specifics: what is eco-friendly about it?',
  },
};

// ─── ETHICAL SOURCING BY INGREDIENT ──────────────────────────────────────────

export const ETHICAL_SOURCING = {
  shea_butter: {
    origin: 'West and Central Africa — predominantly Burkina Faso, Ghana, Mali, Niger, Nigeria.',
    positive_story: 'Shea butter is known as "women\'s gold" — shea processing is carried out almost exclusively by women, providing significant income in areas with limited women\'s economic opportunity.',
    ethical_choice: 'Fairtrade certified shea butter, or shea from brands with verified direct-trade relationships with African cooperatives.',
    brands: 'Ten Thousand Villages (Fairtrade), Alaffia (worker-owned cooperative, Togo), Likami (Ghanaian cooperative), SheaMoisture (partner with cooperatives in Ghana)',
  },

  argan_oil: {
    origin: 'Exclusively from Morocco — Argania spinosa trees grow only in southwestern Morocco.',
    positive_story: 'Argan oil has created significant economic opportunity for Berber women in the Souss-Massa-Drâa region, who run traditional cooperative presses.',
    ethical_choice: 'Moroccan-sourced argan oil from cooperatives. Look for: Cooperative Marjana, UCFA, or fair-trade verified brands.',
    environmental: 'Increasing demand has pressured wild argan forests. Look for sustainably sourced certifications.',
  },

  mica: {
    concern: 'Child labour in Indian mica mining (see environmental impact section).',
    ethical_choice: 'Synthetic mica (fluorophlogopite) — no mining required, identical performance. Many clean beauty brands are switching.',
    check: 'Look for "synthetic mica" or "fluorophlogopite" in ingredient list instead of "mica."',
  },

  palm_oil: {
    concern: 'Deforestation, particularly in Southeast Asia.',
    ethical_choice: 'RSPO-certified sustainable palm oil; palm-free formulations.',
    in_beauty: 'Hidden as glycerin, stearic acid, sodium lauryl sulfate, cetyl alcohol, and many other INCI names.',
  },
};

// ─── ECO BEAUTY BY COMMUNITY ──────────────────────────────────────────────────

export const ECO_BEAUTY_BY_COMMUNITY = {
  west_african: {
    inherently_sustainable: 'Many West African beauty traditions are inherently sustainable — shea butter from community harvested trees, black soap from natural ash and plant oils, palm oil from long-managed local sources.',
    brands: ['Alaffia (Togo, worker-owned cooperative)', 'Shea Radiance (women cooperatives, West Africa)', 'LUSH\'s shea-based products (Fairtrade certified shea)'],
  },

  south_asian: {
    inherently_sustainable: 'Ayurvedic ingredients — amla, turmeric, neem, rose water — are traditionally plant-based and sustainable when sourced properly. Champi with oils is inherently low waste.',
    brands: ['Forest Essentials (India, Ayurvedic luxury)', 'Biotique (Indian, natural ingredients)', 'Kama Ayurveda'],
  },

  arab: {
    inherently_sustainable: 'Rose water, ghassoul clay, argan oil, black seed — all from natural, sometimes cooperative sources in North Africa and the Middle East.',
    hammam_sustainability: 'The hammam tradition itself is communal — shared spaces, water efficiency through single communal heating — originally more sustainable than individual home baths.',
    brands: ['Dounia (Moroccan, cooperative-sourced argan)', 'Moroccan Oil (argan oil brand — mainstream, not cooperative but widely available)'],
  },

  east_asian: {
    innovation_leader: 'Korean beauty has led in eco innovation — from water-activated balms to refillable compacts to concentrated serum sheets.',
    brands: ['Innisfree (South Korea, Jeju Island botanicals, sustainability-focused)', 'Aromatica (South Korea, certified natural ingredients)', 'Blithe (South Korea, waterless formulations)'],
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getBeautyEnvironmentalImpact() {
  return BEAUTY_ENVIRONMENTAL_IMPACT;
}

export function getCleanBeautyMyths() {
  return CLEAN_BEAUTY_MYTHS;
}

export function getSustainablePackaging() {
  return SUSTAINABLE_PACKAGING;
}

export function getWaterlessBeauty() {
  return WATERLESS_BEAUTY;
}

export function getCertifications() {
  return CERTIFICATIONS;
}

export function getEthicalSourcing(ingredient) {
  return ETHICAL_SOURCING[ingredient] || null;
}

export function getEcoBeautyByCommunity(communityId) {
  return ECO_BEAUTY_BY_COMMUNITY[communityId] || null;
}

export const ECO_BEAUTY_STATS = {
  mythsDebunked: Object.keys(CLEAN_BEAUTY_MYTHS.common_myths).length,
  packagingMaterials: SUSTAINABLE_PACKAGING.material_hierarchy.best_to_worst_environmental.length,
  certifications: CERTIFICATIONS.legitimate.length,
  ethicalIngredients: Object.keys(ETHICAL_SOURCING).length,
};
