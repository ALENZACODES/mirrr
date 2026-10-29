/**
 * MIRRR — Clean Beauty Guide (Ethnic Skin Focus)
 * Ingredient safety, greenwashing, clean beauty for ethnic communities.
 */

export const CLEAN_BEAUTY_OVERVIEW = {
  title: 'Clean Beauty — What It Actually Means',
  definition: '"Clean beauty" has no legal definition in the US, EU, or most other jurisdictions; it is a marketing term adopted voluntarily by brands; the meaning varies enormously: some brands define "clean" as "free from a list of ingredients we deem problematic"; others define it as "vegan and cruelty-free"; others as "natural origin"; without a regulatory standard, "clean" means whatever the brand says it means — this lack of standardisation is both the primary weakness of the clean beauty movement and the reason consumers need to develop their own literacy rather than trusting a label',
  naturalVsSafe: 'A common misconception is that "natural" means safe and "synthetic" means dangerous; both claims are false; poison ivy is natural; penicillin was derived from a natural source but is still an active drug; water is H2O whether derived naturally or synthetically; the safety profile of an ingredient depends on its chemical properties, concentration, and how it is used — not its origin; many highly effective synthetic ingredients (niacinamide, retinol, hyaluronic acid) are safe and well-studied; many "natural" ingredients (essential oils, citrus extracts) cause significant skin reactions',
  regulatoryContext: {
    us: 'In the United States, cosmetics are regulated by the FDA under the Federal Food, Drug, and Cosmetic Act (FD&C Act); however, the FDA does NOT pre-approve cosmetics before they go to market; manufacturers are responsible for ensuring product safety; the FDA takes action after the fact when products cause harm; this means US consumers have less regulatory protection than they might expect',
    eu: 'The EU has the most comprehensive cosmetics regulation in the world (EU Cosmetics Regulation 1223/2009); the EU has banned or restricted over 1300 substances in cosmetics; by comparison, the US has banned or restricted approximately 30 substances; this gap is significant and is why many consumers look to EU-approved ingredient standards',
    uk: 'Post-Brexit, the UK maintains similar standards to the EU under UK Cosmetics Regulation; all products must be registered on the SCPN (Submit Cosmetic Product Notification)',
    genuinely_regulated: 'Some ingredients are genuinely regulated internationally: mercury is banned in cosmetics worldwide (not just clean beauty marketing) because it causes severe systemic toxicity; lead is subject to limits; certain preservatives, UV filters, and colourants are on regulated lists'
  }
};

export const INGREDIENTS_TO_KNOW = {
  parabens: {
    ingredient: 'Parabens (methylparaben, ethylparaben, propylparaben, butylparaben, phenylparaben, benzylparaben)',
    function: 'Preservatives — prevent bacterial and fungal contamination in cosmetics; essential for product safety',
    concern: 'Detected in breast tumour tissue in a 2004 Darbre et al. study; this raised concerns about oestrogenic activity; the "link to breast cancer" became a major clean beauty talking point',
    actualEvidence: 'The Darbre study showed detection, NOT causation; parabens are found in virtually all human tissue because they are so widely used — detecting them proves exposure, not cancer causation; multiple systematic reviews and the FDA, EU Scientific Committee on Consumer Safety (SCCS), and Cancer Research UK have concluded that parabens in cosmetics at currently used concentrations are safe; the EU has restricted the highest-concentration applications of some longer-chain parabens (isobutylparaben, isopropylparaben) out of precaution, but the shorter-chain parabens (methylparaben, ethylparaben) remain permitted',
    ethnicSkinRelevance: 'Parabens are among the most gentle preservative systems for skin; common alternatives (phenoxyethanol, methylisothiazolinone) have higher skin sensitisation rates; for atopic skin (eczema-prone — more common in certain ethnic communities) parabens are often LESS irritating than the "clean" alternatives',
    verdict: 'The evidence does not support avoiding parabens for skin safety reasons; individuals may choose to avoid them on personal principle; parabens are not among the higher-risk ingredients in cosmetics'
  },
  mineralOilPetrolatum: {
    ingredient: 'Mineral oil, petrolatum (petroleum jelly, Vaseline), paraffin',
    function: 'Emollient and occlusive — forms a barrier on the skin that prevents water loss; highly effective moisturising ingredient',
    concern: 'Petroleum-derived; "clogs pores"; "suffocates skin"',
    actualEvidence: 'Mineral oil and petrolatum in cosmetic-grade purity are among the safest, best-studied skin ingredients available; cosmetic-grade mineral oil (a different product from industrial mineral oil) has been shown in multiple studies to be non-comedogenic and safe; petrolatum (Vaseline) is the gold standard occlusive agent in dermatology for wound healing, eczema treatment, and skin barrier restoration; the FDA considers petrolatum safe; the claim that it "clogs pores" comes from the industrial-grade product that is not used in cosmetics',
    ethnicSkinRelevance: 'Petrolatum has been a staple in Black American skincare for generations (as Vaseline); it is particularly effective for the higher transepidermal water loss (TEWL) associated with dark skin (some studies suggest darker skin has higher baseline TEWL than lighter skin, though this is debated in literature); it is genuinely beneficial for very dry skin in east African and Caribbean communities; "clean beauty" marketing against petrolatum has no scientific basis and may have inadvertently targeted an effective ingredient widely used by communities of colour',
    verdict: 'Petrolatum and cosmetic-grade mineral oil are among the most safe, effective, and evidence-backed moisturising ingredients available; no reason to avoid them on safety grounds; environmental considerations (petroleum-derived) are a separate valid concern'
  },
  fragrances: {
    ingredient: 'Fragrance / parfum (and specific fragrant compounds: linalool, geraniol, citronellol, eugenol, limonene, etc.)',
    function: 'Scent; consumer experience; some claimed aromatherapy benefits',
    concern: 'Fragrance is one of the leading causes of contact allergic dermatitis; "fragrance" on an ingredient label can represent a blend of hundreds of undisclosed chemicals (trade secret protection); cannot evaluate what you cannot see on the label',
    actualEvidence: 'Fragrance is a genuine and well-documented skin sensitiser; the International Fragrance Association (IFRA) and Research Institute for Fragrance Materials (RIFM) set concentration limits for sensitising fragrant compounds; the EU requires disclosure of 26 specific potentially allergenic fragrance compounds when above threshold concentration; fragrance-induced contact dermatitis is a real clinical problem; sensitisation (not allergy — these are different mechanisms) is acquired with repeated exposure, meaning it can develop even in people who previously tolerated a fragrant product',
    naturalFragrance: 'Note: "natural fragrance" or "botanical extracts" used for scent can be just as sensitising as synthetic fragrance; essential oils (lavender, tea tree, citrus) are common allergens; "natural" does not mean non-allergenic; some people with fragrance sensitivity react to natural fragrances and not synthetic, or vice versa — the molecules are what matter, not the origin',
    ethnicSkinRelevance: 'Post-Inflammatory Hyperpigmentation (PIH) is a significant concern for Fitzpatrick IV-VI skin types (common in West African, South Asian, East African, Caribbean, Black American communities); contact dermatitis — even mild inflammation — in dark skin can trigger PIH that lasts months to years; for this reason, fragrance avoidance in skincare is more consequential for dark skin tones than for lighter ones; a mild reaction that would clear without a mark in fair skin may leave a lasting darkened spot in darker skin',
    verdict: 'Fragrance is a legitimately higher-risk category for skin sensitisation; avoiding fragrance in face skincare and sensitive-area products is evidence-based advice, particularly for dark skin tones prone to PIH; fragrance in haircare and body products that are rinsed off is a lower risk'
  },
  sulfates: {
    ingredient: 'Sodium lauryl sulfate (SLS), Sodium laureth sulfate (SLES), Ammonium laureth sulfate (ALS)',
    function: 'Surfactants — cleansing agents that remove oil, dirt, and product buildup through their detergent action',
    concern: 'Skin irritation; stripping; "toxic"',
    actualEvidence: 'SLS is a harsher surfactant than SLES (which is ethoxylated — a process that makes it milder); SLS at high concentrations is a skin irritant; SLS is actually used in dermatology as a positive control for contact irritation testing (intentionally irritating a test site to compare against test substances); however, in shampoos and body washes that are rinsed off quickly, SLS at typical concentrations (5-15%) does not cause clinical irritation in most people with normal skin; the "SLS is toxic" claim is not supported; SLS is among the most studied cosmetic ingredients in the world',
    notForFace: 'SLS at cleansing concentrations is not typically used in facial cleansers due to its irritancy potential; when it appears in facial cleansers it is usually at much lower concentrations; its use in shampoo/body wash is distinct from facial use',
    ethnicSkinRelevance: 'For Type 4 natural hair: SLS-based shampoos strip the natural oil (sebum) from the hair shaft; since Type 4 coiled hair has a spiral structure that makes sebum distribution from scalp to shaft very difficult anyway, additional stripping from SLS can leave hair very dry; sulfate-free shampoos that use gentler surfactants (cocamidopropyl betaine, sodium cocoyl isethionate) are genuinely preferable for Type 4 hair — this is a real difference, not marketing; for scalp-focused dandruff/seborrhoeic dermatitis treatment, stronger sulfates may be appropriate under dermatologist guidance',
    verdict: 'SLS in rinse-off products at typical concentrations is safe for most people; it is genuinely harsher than alternatives; for Type 4 hair and dry scalp conditions, sulfate-free shampoos are evidence-based choices'
  },
  formaldehyde: {
    ingredient: 'Formaldehyde and formaldehyde-releasing preservatives: DMDM hydantoin, imidazolidinyl urea, diazolidinyl urea, quaternium-15, bronopol (2-bromo-2-nitropropane-1,3-diol)',
    function: 'Preservatives — antimicrobial; prevent contamination',
    concern: 'Formaldehyde is a known human carcinogen (IARC Group 1); releases toxic gas at high concentrations',
    actualEvidence: 'The carcinogenic evidence for formaldehyde is primarily from occupational inhalation exposure (embalmers, pathologists, textile workers) at concentrations far exceeding cosmetic use; in cosmetics, formaldehyde-releasing preservatives release tiny amounts of formaldehyde — the SCCS (EU safety committee) has reviewed and permits them at current concentrations; however, formaldehyde is the most common cause of preservative-related contact dermatitis; for skin sensitisation (developing an allergy), formaldehyde releasers are a more legitimate concern than for carcinogenicity from cosmetic use',
    verdict: 'Formaldehyde releasers are worth avoiding primarily for their sensitisation potential; the carcinogenicity concern at cosmetic concentrations is less supported but precautionary avoidance is reasonable'
  },
  oxybenzone: {
    ingredient: 'Oxybenzone (benzophenone-3) — chemical UV filter',
    function: 'UV absorption (UVA and UVB protection in chemical/organic sunscreens)',
    concern: 'Endocrine disruption; coral reef toxicity',
    actualEvidence: 'Oxybenzone does show endocrine activity in in-vitro and animal studies; human studies show it is absorbed through the skin and detectable in blood after application; however, the blood concentrations detected are far below the levels shown to cause endocrine effects in animal studies; the FDA is currently studying whether sunscreen ingredients (including oxybenzone) are "generally recognized as safe and effective" due to systemic absorption findings; the EU requires a maximum concentration of 6%; oxybenzone is banned in Hawaii and Palau to protect coral reefs (it has documented coral toxicity effects)',
    alternatives: 'Mineral sunscreens (zinc oxide, titanium dioxide) are FDA-approved and have no endocrine concerns; Tinosorb S, Tinosorb M, and Mexoryl (UV filters approved in the EU and most of the world but not currently FDA-approved in the US) have better UVA protection profiles; Asian and European sunscreens often use these more advanced filters',
    ethnicSkinRelevance: 'The sunscreen-avoidance problem is already significant in darker-skinned communities due to the white cast from mineral filters; oxybenzone concerns driving people to avoid all chemical sunscreens, and mineral sunscreens leaving white casts → net result can be under-use of sun protection; prioritising sun protection above all is the correct dermatological advice; for those preferring to avoid oxybenzone, chemical sunscreens using avobenzone, octinoxate, or filters like octisalate are alternatives; Asian sunscreens with Tinosorb filters often have better cosmetic elegance for darker skin',
    verdict: 'Oxybenzone is a legitimate area of uncertainty; EU limits are precautionary; alternatives exist; avoiding it while maintaining sun protection is a reasonable approach'
  },
  hydroquinone: {
    ingredient: 'Hydroquinone (HQ)',
    function: 'Skin lightening / depigmenting agent; inhibits tyrosinase (the enzyme that catalyses melanin production)',
    concern: 'Potential carcinogenicity (debated — IARC insufficient evidence in humans); ochronosis (a blue-black discolouration of the skin with prolonged use) with high concentrations and extended use; potential systemic absorption with wide-area application',
    actualEvidence: 'Hydroquinone is the most extensively studied skin-lightening ingredient and is considered the gold standard for hyperpigmentation treatment in clinical dermatology; 2% OTC hydroquinone is available in the US; 4% prescription; the FDA proposed banning OTC hydroquinone in 2006 but the rule was never finalised; the EU has banned hydroquinone in cosmetics (2001); South Africa banned it in 1990 after widespread use of high-concentration (>2%) products causing ochronosis; the ochronosis risk appears related to concentration and duration of use, not short-term therapeutic use of 2-4%',
    ethnicSkinRelevance: 'PIH is a leading skin concern for Fitzpatrick IV-VI communities; hydroquinone is effective treatment but carries real risks with the pattern of use common in communities where "skin lightening" is culturally entrenched (West Africa, South Africa, South Asia, East Africa); high-concentration hydroquinone-mercury combination products sold informally in these communities have caused severe and permanent harm; responsible use under dermatologist supervision for specific hyperpigmentation vs systemic skin lightening are entirely different contexts',
    verdict: 'Hydroquinone is a powerful depigmenting agent; safe and evidence-based at 2-4% under dermatologist supervision for specific hyperpigmentation (acne marks, melasma, PIH) with appropriate breaks from use; dangerous when used as a full-body skin lightening agent at high concentrations or in mercury-containing formulations; context is everything'
  },
  mercury: {
    ingredient: 'Mercury / calomel / mercurous chloride / mercurio / mercure',
    function: 'Skin lightening; antimicrobial (historically)',
    concern: 'Mercury is a potent neurotoxin; causes permanent neurological damage, kidney damage, and other severe systemic effects; banned in cosmetics worldwide',
    actualEvidence: 'Mercury in cosmetics is banned in the US (except 0.0065% thimerosal in eye products as a preservative), the EU, Canada, and most countries; however, illegal mercury-containing skin-lightening creams are widely sold in informal markets particularly in West Africa, East Africa, South Asia, and among immigrant communities in the US; documented cases of mercury poisoning from cosmetic products are reported globally; even small amounts absorbed through the skin over months of daily use can cause severe systemic toxicity',
    warning: 'CRITICAL: Any product labelled or suspected to contain mercury should be immediately discontinued and disposed of safely; household members may also be at risk from exposure to treated skin; symptoms of mercury poisoning include tingling in extremities, memory problems, mood changes, vision changes; seek medical evaluation if concerned',
    ethnicSkinRelevance: 'Mercury-containing skin lightening products are disproportionately sold in and targeted at communities of colour where skin lightening is culturally practised; West African (particularly Ghanaian, Nigerian, Senegalese), East African, South Asian, and Caribbean immigrant communities in the UK, US, and Europe are among those most affected by harmful skin lightening products sold in local beauty supply stores and markets; public health interventions and community education are critical',
    verdict: 'Never use — no safe concentration for skin application; report suspicious products to the FDA (US) or relevant national authority'
  }
};

export const CLEAN_BEAUTY_CERTIFICATIONS = {
  title: 'Certifications That Mean Something vs Marketing Labels',
  meaningfulCertifications: {
    ecocert: {
      name: 'ECOCERT',
      type: 'Third-party certification (French)',
      what: 'Certifies organic and natural cosmetics; requires minimum 95% natural-origin ingredients; minimum 10% organic ingredients; prohibits specific synthetic substances; third-party audited',
      trustLevel: 'High — third-party audited with published standards'
    },
    cosmos: {
      name: 'COSMOS (COSMOS-Natural, COSMOS-Organic)',
      type: 'Third-party certification (European consortium)',
      what: 'A unified European organic and natural cosmetic standard; COSMOS-Organic requires minimum 95% natural-origin ingredients, minimum 20% certified organic; COSMOS-Natural has lower organic threshold; the COSMOS standard is harmonised across multiple national certification bodies (Soil Association UK, Cosmebio France, BDIH Germany, AIAB Italy, ICEA Italy)',
      trustLevel: 'High — the most rigorous European natural/organic cosmetic standard'
    },
    crueltyFree: {
      name: 'Leaping Bunny / PETA Cruelty Free',
      type: 'Third-party certification',
      what: 'Certifies that no animal testing was conducted at any stage of product development by the company or its suppliers; the Leaping Bunny is considered the gold standard; PETA certification is less stringent (company self-certification)',
      trustLevel: 'Leaping Bunny: high (supply chain audited); PETA: moderate (self-certification)'
    },
    vegan: {
      name: 'Vegan Society / Certified Vegan',
      type: 'Third-party certification',
      what: 'Certifies no animal-derived ingredients AND no animal testing; note: cruelty-free and vegan are different certifications — a product can be vegan (no animal ingredients) but not cruelty-free (may be tested on animals)',
      trustLevel: 'High for ingredient claims; audited'
    }
  },
  marketingOnlyLabels: {
    clean: '"Clean" — no legal meaning; each brand defines it themselves',
    natural: '"Natural" — no legal standard in US cosmetics; can mean anything from 100% natural origin to "contains some plant extracts"',
    green: '"Green" — no legal definition',
    dermatologistTested: '"Dermatologist tested" — means a dermatologist conducted a test; says nothing about results or what they found; any result passes the test',
    hypoallergenic: '"Hypoallergenic" — no legal definition; the FDA attempted to regulate this term but the rule was overturned in 1978; any brand can call any product hypoallergenic; it does not mean it will not cause reactions',
    nonComedogenic: '"Non-comedogenic" — no standard test or definition; some brands self-certify based on individual ingredient data; the Human Repeated Insult Patch Test (HRIPT) is the most commonly used test but is not mandatory; "non-comedogenic" should be taken as a claim to investigate, not a guarantee'
  }
};

export const ETHNIC_CLEAN_BEAUTY_GUIDES = {
  'west-african': {
    community: 'West African',
    keyIssues: ['mercury in lightening products', 'counterfeit cosmetics', 'PIH and inflammation', 'humidity skincare'],
    guide: {
      criticalWarning: 'Skin lightening products are widely sold across West Africa and in diaspora communities; many contain mercury, hydroquinone above safe concentrations, or corticosteroids not disclosed on labels; mercury-containing products cause irreversible neurological damage; this is a major public health crisis; look for: oily consistency inconsistent with claimed formula; bleach-like smell; very rapid lightening within days; the terms "éclaircissant," "brightening," "toning," or "fair skin" in product names are common in this market — not all are dangerous but they are a category requiring scrutiny',
      safeIngredients: 'Shea butter (karite) is genuinely one of the best natural moisturisers — rich in oleic and stearic acid, vitamin E, and has anti-inflammatory cinnamic acid esters; moringa oil is high-quality and non-comedogenic; baobab oil has excellent fatty acid profile; African black soap (dudu-osun style) with natural lye (plantain ash or shea bark ash) is well-tolerated for most skin types; camwood is an anti-inflammatory traditional ingredient',
      cleanBeautyContext: 'The Nigerian and Ghanaian natural beauty market has grown significantly; brands like House of Tara, Nuban Beauty (Nigeria), Black Earth Products (diaspora) are developing clean formulations grounded in African ingredients; Afrocenchix (UK-based Nigerian founders) makes clean haircare specifically for natural African hair',
      approach: 'Focus on safety and basic efficacy evidence rather than marketing labels; prioritise avoiding truly harmful ingredients (mercury, unregulated corticosteroids, high-concentration hydroquinone without medical supervision) over chasing "clean" marketing terms; high humidity requires lightweight, water-based formulations'
    }
  },
  'south-asian': {
    community: 'South Asian',
    keyIssues: ['skin lightening industry', 'PCOS hormonal acne', 'traditional ingredient validation', 'halal formulations'],
    guide: {
      skinLightening: 'South Asia has a deeply embedded skin-tone hierarchy that has driven a massive fairness/skin lightening industry; Fair & Lovely (rebranded as Glow & Lovely in 2020) has long been one of the best-selling skincare products in the region; these products often contain niacinamide (genuinely effective for hyperpigmentation at 5-10%); some contain kojic acid; historically some contained mercury (now banned in India under cosmetic regulations); cultural pressure to lighten skin is a separate conversation from clinical hyperpigmentation treatment',
      traditionalIngredients: 'Turmeric (haldi): genuine anti-inflammatory and tyrosinase-inhibiting properties; use in formulations rather than raw paste directly (direct paste can stain and the concentration of curcumin is uncontrolled); ubtan (chickpea flour + turmeric + rose water): validated gentle physical and mild chemical exfoliation; neem: antimicrobial properties with reasonable evidence; rose water (gulab jal): gentle anti-inflammatory toner; bakuchiol: plant-based compound from babchi (Psoralea corylifolia) with retinol-like effects demonstrated in comparative RCT 2019 (Dhaliwal et al.)',
      halalConsiderations: 'Halal cosmetics exclude: alcohol derived from grapes or dates as a solvent (note: fatty alcohols like cetyl alcohol are permissible and are not intoxicating; the prohibition is on ethanol/isopropanol); pork-derived gelatin or collagen; certain animal-derived ingredients without proper slaughter; many Muslim South Asian consumers seek halal-certified or vegan alternatives to ensure compliance'
    }
  },
  caribbean: {
    community: 'Caribbean',
    keyIssues: ['phytophotodermatitis citrus risk', 'sea moss trends', 'DIY natural remedies', 'sun protection'],
    guide: {
      criticalWarning: 'PHYTOPHOTODERMATITIS WARNING: A traditional Caribbean skincare remedy is applying lime juice or other citrus juice to the skin for brightening or to treat hyperpigmentation; this causes phytophotodermatitis when followed by sun exposure — furanocoumarins in lime/lemon/grapefruit juice + UV radiation = severe chemical burns and permanent hyperpigmentation; this risk is particularly catastrophic in the Caribbean where sun intensity is very high; do not apply citrus juice to skin in any sun-exposed context',
      seaMossTrend: 'Sea moss gel has become popular in Caribbean and broader Black wellness communities; it is a hydrating ingredient topically (carrageenan forms a film); it is nutritious eaten (iodine, minerals); specific claims about "92 of the 102 minerals the human body needs" are exaggerated and not scientifically grounded; sea moss is a legitimate wellness food and topical ingredient but many specific claims are overstated',
      cleanBeautyContext: 'Caribbean natural beauty brands include Shea Radiance (Caribbean-inspired), various Jamaican black castor oil brands (Jamaican Black Castor Oil is a legitimate industry with some very good products and many lower-quality imitations); Burt\'s Bees was founded partly inspired by Caribbean ingredients; Caribbean aloe vera (different from standard aloe vera) is widely used and genuinely effective'
    }
  },
  arab: {
    community: 'Arab',
    keyIssues: ['oud and frankincense fragrance sensitivity', 'halal certification', 'harsh desert climate', 'hammam tradition'],
    guide: {
      halalFragrance: 'Traditional Arab perfumery uses oud (agarwood), frankincense, rose, amber, and musk — many of which are high-concentration skin sensitisers; "clean beauty" in an Arab context intersects with halal beauty (certified halal ingredients and manufacturing); The Body Shop's halal-certified line, Inika (Australian halal brand), and locally produced Gulf brands like WARDA (KSA) address halal beauty market needs',
      frankincenseEvidence: 'Frankincense (Boswellia species) resin contains boswellic acids with genuine anti-inflammatory evidence; used in traditional Arab and East African skincare for centuries; some clinical evidence for soothing properties; the modern "frankincense oil" market varies enormously in quality — Boswellia carterii vs B. serrata vs B. sacra have different compositions; third-party testing important',
      arganOil: 'Argan oil (from Argania spinosa, endemic to Morocco) is genuinely high quality — rich in oleic acid, linoleic acid, vitamin E, and squalene; non-comedogenic; evidence for skin moisturisation and antioxidant protection; the Moroccan argan oil industry directly employs Berber women\'s cooperatives — genuinely ethical sourcing is available but the premium price and marketing around argan means many diluted products exist; look for 100% pure argan oil rather than blended products'
    }
  },
  latina: {
    community: 'Latina/Latin American',
    keyIssues: ['PCOS hormonal acne PIH cycle', 'citrus phytophotodermatitis', 'telogen effluvium stress hair loss', 'diverse skin tone range'],
    guide: {
      criticalWarning: 'PHYTOPHOTODERMATITIS: Like Caribbean beauty, some Latin American folk remedies involve applying lemon juice for skin brightening; the same phytophotodermatitis risk applies; lime/lemon + sun = severe burns and hyperpigmentation particularly serious given the high UV in Latin American climates and the PIH risk for darker Latin skin tones',
      malinche: 'The concept of "natural" beauty in Latina communities is complicated by colorism — lighter skin has historically been privileged in Latin American societies (a legacy of Spanish colonialism and the casta system); "clean beauty" claims around skin brightening/lightening need to be approached with awareness of this context; safe evidence-based depigmentation for PIH (from acne, sun damage) is distinct from colorism-driven skin lightening',
      traditionalIngredients: 'Aloe vera (widely grown throughout Latin America): genuine anti-inflammatory, wound-healing, and moisturising properties; solid RCT evidence for burn healing; rosewater; chamomile (manzanilla) for sensitive skin; hibiscus (jamaica flower) with genuine antioxidant properties; centella asiatica (gotu kola) grown in Brazil — genuinely well-evidenced for wound healing and collagen stimulation; cactus (nopal) sap as a moisturising ingredient'
    }
  },
  'east-asian': {
    community: 'East Asian',
    keyIssues: ['whitening industry scrutiny', 'K-beauty innovation vs claims', 'Japanese minimalism', 'ingredient innovation'],
    guide: {
      kBeautyCleanCredentials: 'Korean beauty (K-beauty) has driven enormous global skincare innovation; many K-beauty ingredients have stronger evidence bases than Western "clean beauty" alternatives; however, "whitening" is a significant skin-lightening industry in East Asia; Niacinamide at 5-10% is genuinely effective for hyperpigmentation and is commonly used in K-beauty; arbutin (a glycoside of hydroquinone) is a gentler depigmenting ingredient with reasonable evidence; tranexamic acid has emerging evidence for melasma in RCTs',
      japaneseMinimalism: 'Japanese skincare philosophy tends toward fewer, high-quality products rather than multi-step routines; many Japanese brands (HABA, DHC, Tatcha, Muji skincare) emphasise clean formulations; HABA\'s flagship product is a squalane oil (100% pure squalane from olive) that exemplifies minimalist clean formulation; Japanese sunscreens are among the most cosmetically elegant in the world with superior UV filters (Tinosorb, Uvinul, Mexoryl)',
      fermentedIngredients: 'Fermented ingredients are a significant K-beauty trend with legitimate backing: fermented extracts (fermented rice water, fermented soybean, fermented Centella) have smaller molecular weights that may penetrate more effectively than unfermented equivalents; the fermentation process also generates unique metabolites with bioactive properties; SKII\'s Pitera (a fermentation filtrate) and Missha\'s fermented snail products are in this category'
    }
  },
  'east-african': {
    community: 'East African',
    keyIssues: ['frankincense and coffee traditional use', 'vitamin D deficiency in diaspora', 'altitude UV in Ethiopian highlands', 'diaspora product availability'],
    guide: {
      frankincenseTradition: 'East Africa is one of the primary sources of Boswellia (frankincense) — particularly Boswellia papyrifera in Ethiopia and Boswellia neglecta; frankincense has been used in Ethiopian and Somali traditional beauty practices for centuries; the anti-inflammatory boswellic acid evidence is genuine; traditional frankincense smoking (the incense fumigation of hair and body in Somali and Ethiopian tradition) has antimicrobial and aromatic properties; modern clean beauty brands are incorporating Boswellia extracts with appropriate standardisation',
      nilosseCoconutOil: 'Niloticus oil (from the Nile crocodile — traditional East African) is not a mainstream clean beauty ingredient; more relevantly, coconut oil is widely used in East African communities; coconut oil is comedogenic for many people (rated 4/5 on comedogenicity scales); for acne-prone East African or diaspora skin, coconut oil on the face may trigger breakouts; as a pre-shampoo hair treatment it is beneficial for damaged hair',
      diaspora: 'East African diaspora communities (Ethiopian, Somali, Eritrean, Kenyan) in the US, UK, and Scandinavia face significant product availability challenges; hair texture (3C-4B range for many) is served by natural hair products but ethnic-specific products remain limited; diaspora brands are emerging: Habesha Beauty, ASOS Roots'
    }
  },
  'south-african': {
    community: 'South African',
    keyIssues: ['rooibos and indigenous plant credibility', 'cape fynbos biome', 'mercury skin lightening legacy', 'marula and baobab supply chain'],
    guide: {
      indigenousIngredients: 'South Africa\'s Cape Floristic Region (fynbos biome) is one of the most biodiverse plant areas on earth, with over 9000 plant species; several have genuine cosmetic application: rooibos (aspalathin antioxidant — unique globally); buchu (unique volatile compounds); honeybush (similar to rooibos, from Cyclopia species); pelargonium (geranium oil from Pelargonium graveolens — widely used in clean beauty for scent, though sensitising for some); Cape chamomile (Eriocephalus punctulatus — different from German and Roman chamomile, with a rich deep blue colour from chamazulene)',
      marulaSustainability: 'Marula oil is produced from fruits collected and cold-pressed in southern Africa; when sourced through fair-trade cooperatives (Swazi women\'s cooperatives in Swaziland/Eswatini; Namibian communities), marula provides economic benefit to indigenous communities; Afrikan Botanics (South African brand) and Skin Creamery emphasise community-sourced marula',
      skinLighteningLegacy: 'South Africa banned hydroquinone in 1990 following public health consequences from high-concentration mercury/hydroquinone combination products; the legacy of apartheid-era skin-tone discrimination continues to drive demand for skin lightening products; illegal mercury-containing products are still sold; post-apartheid South African brands like Skin Republic and African Extracts (rooibos-based) offer effective skincare without lightening harm'
    }
  },
  'black-american': {
    community: 'Black American',
    keyIssues: ['PIH inflammation cycle', 'clean beauty industry diversity', 'scalp care ingredients', 'uterine fibroids chemical exposure hypothesis'],
    guide: {
      fibroidsAndChemicals: 'An area of ongoing research: Black women have significantly higher rates of uterine fibroids than white women (estimated 3× higher prevalence; earlier onset; more severe); some research has investigated whether chemical hair relaxers (which contain potassium or sodium hydroxide) or other products commonly used by Black women contribute to fibroid risk; a 2022 NIEHS study found an association between hair relaxer use and uterine fibroid risk; this is an association finding, not proven causation, and requires more research; however, it has understandably increased clean beauty interest among Black women, particularly reducing relaxer use and switching to natural alternatives',
      cleanBeautyIndustry: 'The clean beauty industry has historically underserved Black consumers; shade ranges, formulas for darker skin, and representation were lacking until the Fenty Beauty moment (2017, 40 shades at launch) shifted the industry; Black-owned clean beauty brands that have emerged: Ami Colé (melanin-focused clean beauty); Undefined Beauty (scalp and hair); Golde (wellness powders); Hyper Skin (hyperpigmentation-focused, melanin-rich skin); Flora + Fauna; many others',
      relaxerCleanBeauty: 'For those using chemical relaxers: the straightening chemistry (lye/no-lye) is fundamentally different from scalp care product chemistry; reducing application to hair rather than scalp; pre-application scalp protection; prioritising scalp health after processing are evidence-based practices; the transition to natural hair or protective styles reduces chemical exposure but is a personal choice without a clean-vs-not-clean judgment',
      petrolatum: 'Vaseline (petrolatum) and Aquaphor (petrolatum + lanolin) have been generational staples in Black American skincare and haircare; they are among the most effective and safe moisturising ingredients available; clean beauty marketing against petrolatum has disproportionately targeted products used by Black consumers; the scientific evidence does not support this avoidance; petrolatum is safe and effective'
    }
  }
};

export function getCleanBeautyGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_CLEAN_BEAUTY_GUIDES['west-african'],
    'south-asian': ETHNIC_CLEAN_BEAUTY_GUIDES['south-asian'],
    caribbean: ETHNIC_CLEAN_BEAUTY_GUIDES.caribbean,
    arab: ETHNIC_CLEAN_BEAUTY_GUIDES.arab,
    latina: ETHNIC_CLEAN_BEAUTY_GUIDES.latina,
    'east-asian': ETHNIC_CLEAN_BEAUTY_GUIDES['east-asian'],
    'east-african': ETHNIC_CLEAN_BEAUTY_GUIDES['east-african'],
    'south-african': ETHNIC_CLEAN_BEAUTY_GUIDES['south-african'],
    'black-american': ETHNIC_CLEAN_BEAUTY_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

export const CLEAN_BEAUTY_STATS = {
  moduleId: 'clean_beauty_guide',
  version: '1.0.0',
  topics: ['greenwashing clean beauty definition', 'parabens evidence not harmful', 'petrolatum Vaseline safe effective', 'fragrance sensitisation PIH dark skin', 'SLS sulfate Type 4 hair', 'mercury banned toxic skin lightening', 'hydroquinone evidence-based dermatology', 'oxybenzone endocrine UV filter alternative', 'ECOCERT COSMOS certification', 'rooibos aspalathin South African endemic', 'frankincense boswellic acid anti-inflammatory', 'fibroids chemical relaxer NIEHS 2022'],
  communitiesSupported: 9,
  keyFacts: [
    '"Clean beauty" has no legal definition and is entirely a marketing term; every brand defines it differently; consumer literacy about actual ingredient safety evidence is more useful than trusting any "clean" label; the European Union has banned or restricted over 1300 cosmetic substances vs approximately 30 in the United States, making EU regulatory standards a useful benchmark for safety-conscious consumers worldwide',
    'Fragrance (parfum) is genuinely a higher-risk ingredient category and one of the most legitimate areas to prioritise avoidance: it is the leading cause of contact allergic dermatitis in cosmetics; "fragrance" on a label can represent hundreds of undisclosed compounds; for Fitzpatrick IV-VI skin types (common in West African, South Asian, Caribbean, Black American, East African communities) even mild contact dermatitis can trigger Post-Inflammatory Hyperpigmentation that persists for months — making fragrance avoidance more consequential for darker skin than for lighter skin',
    'The "petrolatum is harmful" clean beauty narrative has no scientific basis and has disproportionately targeted an effective ingredient widely used in Black American skincare traditions; cosmetic-grade petrolatum is the gold standard occlusive agent in clinical dermatology for wound healing, eczema treatment, and skin barrier restoration; the concern conflated cosmetic-grade petrolatum with industrial-grade mineral oil, which is a different product',
    'Mercury-containing skin lightening products are a genuine public health crisis in West Africa, East Africa, South Asia, and among immigrant communities in the US and UK; they are illegal everywhere but widely available through informal markets; exposure causes permanent neurological damage and kidney toxicity; this is not a clean beauty marketing issue — it is a public health emergency requiring community education and regulatory enforcement'
  ]
};
