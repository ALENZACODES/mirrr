/**
 * MIRRR — Scalp Care Guide (Ethnic Perspectives)
 * Complete scalp anatomy, conditions, care routines, scalp treatments,
 * and ethnic scalp care across all 9 communities.
 */

export const SCALP_ANATOMY = {
  title: 'Scalp Anatomy and Physiology',
  structure: {
    layers: 'The scalp has 5 distinct layers (remembered by the acronym SCALP): Skin (epidermis and dermis), Connective tissue (dense fibrous subcutaneous layer), Aponeurosis (the epicranial aponeurosis muscle layer), Loose areolar connective tissue, and Pericranium (periosteum covering the skull); most scalp care addresses the outermost skin layer',
    thickness: 'The scalp skin is approximately 3-8mm thick — significantly thicker than skin elsewhere on the body; this thickness is partly why scalp wounds bleed profusely (the dense vascular connective tissue layer)',
    hairFollicles: 'The scalp contains approximately 100,000 to 150,000 hair follicles; follicle density varies with ethnicity and individual genetics; follicles are embedded in the dermis and reach into the subcutaneous layer; each follicle is surrounded by a sebaceous (oil) gland, an arrector pili muscle, and blood vessels',
    sebaceousGlands: 'Scalp sebaceous glands produce sebum (natural oil) to lubricate the scalp and hair shaft; the scalp has among the highest sebaceous gland density of any skin area on the body; sebum production is the primary determinant of "oily" vs "dry" scalp experience',
    bloodSupply: 'The scalp is extremely well-vascularised (rich blood supply); 5 arteries supply each side of the scalp; this rich blood supply supports the metabolically active hair follicles; scalp massage improves local circulation and is associated with modestly increased hair growth in some studies'
  },
  scalpMicrobiome: {
    what: 'The scalp has its own distinct microbiome — a community of microorganisms (bacteria, fungi, and other organisms) that colonise the scalp skin; the most significant scalp-resident fungus is Malassezia, which is present on all human scalps and plays a role in dandruff and seborrhoeic dermatitis when populations become imbalanced',
    malassezia: {
      what: 'Malassezia (previously called Pityrosporum) is a lipid-dependent yeast that colonises all human scalps from birth; it feeds on the fatty acids in sebum; it is not inherently pathological but overgrowth triggers inflammatory responses in susceptible individuals',
      dandruff: 'Dandruff (pityriasis simplex capitis) is caused by Malassezia\'s metabolic by-products irritating the scalp in people with susceptible immune responses; the irritated scalp speeds up skin cell turnover and the dead cells clump together and shed as visible white flakes; anti-dandruff shampoos containing zinc pyrithione, selenium sulfide, or ketoconazole work by reducing Malassezia populations',
      seborrhoeic: 'Seborrhoeic dermatitis is a more severe form of Malassezia-triggered inflammatory scalp condition; causes red, scaly, inflamed patches on the scalp and face (nasolabial folds, eyebrows, behind the ears); treated with medicated shampoos and topical antifungals'
    },
    bacterialBalance: 'Bacterial scalp microbiome components include Staphylococcus, Cutibacterium (formerly Propionibacterium), and Corynebacterium species; harsh, frequent shampooing disrupts this balance; the scalp microbiome changes with age, diet, hormonal status, and hair care practices'
  },
  ethnicDifferences: {
    sebumProduction: 'Scalp sebum production varies with ethnicity; Asian scalps (particularly East Asian) tend to produce more sebum than European scalps on average; Black and African-descent scalps tend to produce less sebum than European scalps on average but have more tightly coiled hair that makes sebum travel from root to tip more slowly, creating a drier hair shaft experience despite potentially adequate scalp sebum production',
    pHdifferences: 'Scalp pH also varies; a healthy scalp pH is approximately 5.5 (slightly acidic); disrupting the pH (e.g. with alkaline shampoos or chemical treatments) affects the scalp microbiome and barrier function',
    follicleShape: {
      round: 'Round follicle cross-section produces straight hair (common in East Asian populations)',
      oval: 'Oval follicle cross-section produces wavy hair (common in European and South Asian populations)',
      elliptical: 'Elliptical to ribbon-shaped follicle cross-section produces coiled/curly/kinky hair (common in African and African-descent populations); the more elliptical the follicle, the tighter the curl pattern; highly coiled Type 4 hair has a significantly flattened elliptical follicle cross-section'
    }
  }
};

export const SCALP_CONDITIONS = {
  title: 'Common Scalp Conditions',
  dandruff: {
    definition: 'A common, non-contagious chronic condition causing flaking of dead scalp skin; affects approximately 50% of adults to some degree globally; caused by Malassezia yeast overgrowth triggering accelerated skin cell turnover',
    symptoms: 'White or yellowish flakes shed from the scalp and visible on hair and clothing; itching; occasional mild redness; generally no significant scalp inflammation or scaling',
    treatment: {
      zincPyrithione: 'Zinc pyrithione (found in Head & Shoulders and many anti-dandruff shampoos) reduces Malassezia populations; the most widely available anti-dandruff ingredient; gentle enough for frequent use; effective for mild to moderate dandruff',
      ketoconazole: 'Ketoconazole (Nizoral 1% OTC, Nizoral 2% prescription) is an antifungal medication effective against Malassezia; very effective for moderate to severe dandruff; use 2-3 times per week rather than daily to avoid scalp barrier disruption',
      seleniumSulfide: 'Selenium sulfide (Selsun Blue) slows the rate of skin cell death on the scalp; effective but can leave a residue; some people find it drying; not recommended for colour-treated hair as it may affect colour',
      salicylicAcid: 'Salicylic acid shampoos (T/Sal by Neutrogena) dissolve the bonds holding dead skin cells together, preventing clumping and making existing flakes easier to wash away; treats the symptom (flaking) rather than the cause (Malassezia)'
    }
  },
  seborrhoeicDermatitis: {
    definition: 'A more severe inflammatory scalp (and skin) condition; distinct from dandruff in the presence of inflammation, redness, and scaling that can be greasy and yellowish; Malassezia is also involved',
    symptoms: 'Red, scaly, flaky patches on the scalp; often extends to the face (nasolabial folds, eyebrows, behind ears, around the nose); can affect chest and back folds; itching; the flakes in seborrhoeic dermatitis are often larger, greasier, and more yellowish than dandruff flakes',
    treatment: 'Prescription-strength ketoconazole shampoo and topical antifungals; mild topical corticosteroids (by prescription) for inflammation; coal tar shampoos; see a dermatologist for proper diagnosis and treatment plan',
    darkSkin: 'Seborrhoeic dermatitis can cause post-inflammatory hyperpigmentation (PIH) on darker skin tones from the inflammatory process; treating the inflammation promptly with antifungals reduces PIH risk'
  },
  psoriasis: {
    definition: 'An autoimmune condition causing accelerated skin cell proliferation; scalp psoriasis causes thick, silvery-white scaly patches on the scalp; can extend beyond the hairline onto the forehead, neck, and around the ears; distinct from dandruff and seborrhoeic dermatitis in its autoimmune nature',
    symptoms: 'Thick, raised, red patches covered with silvery-white scales; may itch intensely or burn; hair loss in affected areas (usually temporary); patches often have very distinct, defined edges',
    treatment: 'Requires dermatologist management; topical treatments include corticosteroids (most effective first-line), calcipotriene (vitamin D analog), coal tar, and salicylic acid to remove scale; moderate to severe scalp psoriasis may require biologics (injectable medications that target the immune system)',
    darkSkin: 'Scalp psoriasis scales appear differently on darker skin — the underlying plaque may appear violet or grey rather than red; the silver-white scale is still visible; post-inflammatory hyperpigmentation after psoriasis resolves is common in Fitzpatrick IV-VI skin'
  },
  scalp: {
    tinea: {
      definition: 'Tinea capitis (scalp ringworm) — a fungal infection of the scalp caused by dermatophyte fungi (Trichophyton and Microsporum species); not actually caused by a worm despite the name; requires oral antifungal medication (topical antifungals alone are insufficient to penetrate the hair follicle)',
      symptoms: 'Patchy hair loss with scaling; inflamed, boggy mass called a kerion can develop; may fluoresce under UV light (Wood\'s lamp) depending on the dermatophyte species',
      demographic: 'Most common in children; higher rates in African, African-American, and Caribbean children; the higher prevalence in Black children is thought to be related to specific dermatophyte species (T. tonsurans) that predominate in these communities'
    },
    folliculitis: {
      definition: 'Inflammation or infection of hair follicles on the scalp; can be bacterial (most commonly Staphylococcus aureus), fungal, or caused by other factors; creates pustules or pimples at the base of hair follicles',
      treatment: 'Bacterial folliculitis: topical or oral antibiotics; antifungal shampoos for fungal folliculitis; avoiding tight protective hairstyles or headwear that creates friction may prevent mechanical folliculitis'
    }
  },
  traction: {
    definition: 'Traction alopecia — hair loss caused by repeated tension on the hair follicle; caused by tight hairstyles (tight braids, cornrows, extensions, ponytails, weaves, buns); one of the most common causes of hair loss in Black women and South Asian women who wear their hair in tight traditional styles',
    mechanism: 'Persistent tension on the hair follicle causes inflammation around the follicle; if the tension is applied repeatedly before the inflammation resolves, permanent follicle damage and scarring occurs; early traction alopecia is reversible; late-stage traction alopecia with scarring is permanent',
    signs: 'Early: small bumps (folliculitis) around the hairline; broken hairs; itching and soreness at the hairline; thin edges at the temples and hairline. Late: visible recession of the hairline, particularly at the temples and edges; sparse or absent hair in a distribution consistent with the tight hairstyle',
    prevention: 'Wearing hairstyles with less tension; taking breaks between tight styles; choosing looser box braids or twists; not sleeping in tight hairstyles; using satin bonnets or pillowcases to reduce friction',
    treatment: 'Early: loosen hairstyles; anti-inflammatory topical treatments; stop the traction. Late (scarring): minoxidil for any remaining active follicles; consultation with a dermatologist specialising in alopecia in skin of colour'
  }
};

export const SCALP_CARE_ROUTINES = {
  title: 'Scalp Care Routines and Techniques',
  washing: {
    frequency: {
      oilyScalp: 'Daily to every 2-3 days; excess sebum creates an environment conducive to Malassezia overgrowth and scalp congestion; low-lather or gentle daily shampoos reduce over-stripping',
      normalScalp: 'Every 2-4 days for most scalp and hair types',
      dryScalp: 'Every 5-7 days; over-washing strips natural oils and worsens dryness; cowash (conditioner-only washing) between shampoo sessions',
      type4Hair: 'Type 4 (4A-4C) hair requires the least frequent shampooing of all hair types — typically every 7-14 days; the tight coil structure means sebum distributes very slowly down the hair shaft; scalp buildup (from styling products) is the more common concern than excess oil'
    },
    technique: {
      dilute: 'Diluting shampoo in water before applying to the scalp produces a more even distribution and less concentrated product application; some trichologists recommend mixing shampoo with water 1:1',
      massage: 'Apply shampoo to the scalp, not the length of hair; massage the scalp with fingertip pads (not nails) in small circular motions for at least 60-90 seconds; this mechanically removes buildup and dead skin while stimulating circulation',
      rinse: 'Rinse thoroughly; inadequately rinsed shampoo causes scalp irritation and can look like dandruff; rinse until the water runs clear and the scalp feels "squeaky clean"'
    }
  },
  scalpMassage: {
    benefits: 'Scalp massage increases local blood circulation, which may modestly support hair follicle function; a small Japanese study found that scalp massage performed daily for 24 weeks increased hair shaft thickness; scalp massage also reduces scalp tension and promotes stress relief (the scalp is tightly connected to the frontalis and occipitalis muscles)',
    technique: 'Use fingertip pads, a silicone scalp massager tool, or a scalp brush; apply gentle but firm circular or kneading pressure; move systematically across the scalp; 4-5 minutes daily; can be performed on dry scalp or during shampoo or oil application',
    oils: 'Applying a small amount of oil (castor, peppermint-diluted, rosemary-infused) during scalp massage may enhance benefits; see scalp oil section'
  },
  exfoliation: {
    what: 'Scalp exfoliation removes buildup of dead skin cells, product residue, and sebum that can clog follicles and irritate the scalp; distinct from and complementary to shampooing',
    physical: 'Scalp scrubs (sugar, salt, or silica microspheres in a liquid or gel base) physically remove dead skin cells; apply to damp hair, massage into scalp, and rinse; use once per week maximum as over-exfoliation can irritate the scalp',
    chemical: 'Scalp-specific chemical exfoliants (salicylic acid, glycolic acid, lactic acid) dissolve the bonds holding dead cells together; some are applied before shampooing as a pre-wash treatment; very effective for product buildup and scalp congestion; start with low frequency (every 2 weeks) and increase as tolerated',
    frequency: 'Once per week for oily/normal scalps; once every 2-4 weeks for dry scalps; skip during active scalp inflammation or irritation'
  },
  scalpOils: {
    rosemaryOil: {
      evidence: 'A 2023 study published in Skinmed journal found rosemary oil to be as effective as 2% minoxidil for androgenetic hair loss; rosemary oil contains carnosic acid which is thought to stimulate nerve growth factor in hair follicle cells; the study used rosemary leaf extract applied topically twice daily',
      application: 'Must be diluted in a carrier oil (jojoba, grapeseed, argan) to 2-5% concentration; direct application of essential oils to the scalp causes irritation and chemical burns; massage into the scalp 3-5 times per week',
      note: 'Rosemary oil (and minoxidil) effects require at least 6 months of consistent use to evaluate; hair loss has many causes and rosemary oil is not effective for all types'
    },
    peppermintOil: {
      what: 'Peppermint oil (diluted to 3% in carrier oil) has preliminary evidence supporting scalp stimulation for hair growth; the menthol component creates a cooling vasodilatory effect on the scalp; a small Korean study found peppermint oil superior to saline and comparable to minoxidil for hair growth stimulation in the study period',
      application: 'Dilute 3-5 drops in 1 tablespoon of carrier oil; massage into scalp; leave for at least 30 minutes or overnight; shampoo out'
    },
    castorOil: {
      what: 'Castor oil (Ricinus communis) is used extensively in hair and scalp care, particularly in Black American and Caribbean communities; very thick, viscous oil high in ricinoleic acid; widely used to "seal in" moisture at the scalp and hair shaft',
      evidence: 'Limited clinical evidence for hair growth claims; the oil is highly viscous and can cause significant buildup if overused; may be diluted with lighter oils for easier application and removal',
      jamaicaBlack: 'Jamaican Black Castor Oil (JBCO) is roasted castor oil with a distinctive dark colour and smoky scent; the roasting process adds ash content that some claim makes it more alkaline and better for lifting the hair cuticle; a beloved staple in many Black and Caribbean hair care communities'
    }
  }
};

export const ETHNIC_SCALP_GUIDES = {
  'west-african': {
    hairType: 'Type 4 hair (predominantly 4C) with tightly coiled, high-shrinkage hair; scalp sebum production adequate but sebum travels very slowly down highly coiled hair shafts, leaving the hair shaft relatively dry despite the scalp being well-oiled',
    commonConcerns: ['Product buildup from heavy styling products (shea butter, oils, pomades) used to seal in moisture', 'Traction alopecia from tight braids, cornrows, and extension styles', 'Scalp sensitivity under protective styles (weaves, braids) where the scalp cannot be washed easily', 'Dry flaky scalp that can be mistaken for dandruff but is often product buildup + dry scalp rather than Malassezia overgrowth'],
    washingFrequency: 'Every 7-14 days typical; more frequent washing strips the hair of oils before sebum can travel down the shaft; between washes, scalp oils (light jojoba, argan) can be massaged into the scalp to moisturise without full washing',
    protectiveStyleCare: 'During protective styles (braids, cornrows, weaves): use a diluted apple cider vinegar spray or micellar water to cleanse the scalp between washes; dry shampoo formulated for textured/natural hair; scalp massage with light oils through the braided sections'
  },
  'south-asian': {
    hairType: 'Predominantly Type 2-3 (wavy to curly); generally thick, dark hair with moderate to high density; scalp tends toward normal to slightly oily; hair shaft is typically robust',
    champiTradition: {
      what: 'Champi (head massage with oil) is a foundational South Asian hair care tradition; a warm oil scalp massage performed regularly (traditionally weekly) by a family member or at a barber/salon; the practice has deep cultural and social significance in South Asian families; it is a sensory and bonding experience as much as a hair care practice',
      oils: ['Coconut oil: the most traditional champi oil across South Asia; penetrating oil that reduces protein loss in hair; also has antifungal properties relevant to scalp health', 'Brahmi oil: Bacopa monnieri herb-infused oil; used in Ayurvedic hair care to strengthen hair and treat scalp conditions', 'Amla (Indian gooseberry) oil: rich in Vitamin C; used to strengthen hair and treat premature greying in Ayurvedic tradition', 'Bhringraj oil: Eclipta prostrata herb in a carrier oil; Ayurvedic reputation as the "king of hair" for strengthening and growth'],
      technique: 'Warm the oil slightly; part hair in sections and apply oil to the scalp; massage with fingertip pads in firm circular motions starting from the temples and working toward the crown; apply to the length of the hair as well; cover with a warm towel or shower cap for at least 30 minutes (or overnight); shampoo out twice with a gentle shampoo'
    },
    commonConcerns: ['Premature greying is more common in South Asian populations than European populations (possibly related to vitamin B12 deficiency in vegetarian/vegan diets); amla oil and B12 supplementation are traditional and modern approaches respectively', 'Dandruff: extremely common; anti-dandruff shampoos with ketoconazole or zinc pyrithione are widely used in South Asian communities', 'Hair fall after major life events (illness, post-partum, stress) — often temporary telogen effluvium which resolves with time']
  },
  caribbean: {
    hairType: 'Predominantly Type 3-4 across Caribbean communities; Afro-Caribbean hair is typically Type 4; Indo-Caribbean hair Type 2-3; mixed heritage encompasses wide variation',
    traditions: 'Caribbean hair oiling traditions: coconut oil is central to Caribbean hair culture; bay rum (the traditional Caribbean fragrance distilled from bay leaves) has scalp toning and antiseptic properties and is used as a traditional hair and scalp tonic; Jamaican Black Castor Oil is a Caribbean product adopted globally',
    commonConcerns: ['Dryness and moisture retention in textured hair', 'Scalp care under protective styles', 'Scalp sensitivity from chemical relaxers (still used in some Caribbean communities)', 'Humid tropical climate scalp considerations when in the Caribbean versus dry diaspora climates'],
    JBCO: 'Jamaican Black Castor Oil (JBCO) originated as a Caribbean hair care product and became one of the most globally exported Caribbean beauty innovations; the roasting process gives JBCO its characteristic dark colour and scent'
  },
  arab: {
    hairType: 'Predominantly Type 2-3 (wavy to loose curly); typically dark, dense, with a robust hair shaft; scalp tends toward normal to slightly oily; natural oils are generous',
    traditions: 'Argan oil (Morocco, North Africa); black seed oil (habba sawda, Nigella sativa) — a traditional Islamic medicinal oil with some evidence for hair and scalp benefits; Moroccan hammam (steam bath) hair care; henna (lawsonia) as a traditional scalp and hair treatment',
    blackSeedOil: {
      what: 'Black seed oil (Nigella sativa, called "habba sawda" or "kalonji") is deeply rooted in Islamic and Arab medical tradition; a hadith of the Prophet Muhammad describes it as a cure for every disease except death; it has anti-inflammatory, antimicrobial, and antioxidant properties; some evidence for hair loss reduction',
      application: 'Applied to the scalp, massaged in, left for 30-60 minutes, then washed out; can be mixed with coconut or argan oil for easier application'
    },
    commonConcerns: ['Heat-related scalp dryness in hot dry Gulf and Middle East climates', 'Heavy product use from hair styling traditions', 'Scalp care when wearing hijab (covered hair) — perspiration and reduced air circulation can increase scalp conditions'],
    hijabScalpCare: 'Women who wear hijab face specific scalp care considerations: the covered environment creates warmth and reduces air circulation, which can increase perspiration and potentially scalp congestion or fungal conditions; scalp cleansing frequency may need to increase; lightweight scalp products are preferred; cotton underlining breathes better than synthetic hijab fabrics'
  },
  latina: {
    hairType: 'Enormous variation across Latin America; Indigenous Latin American hair typically Type 1-2; Afro-Latina hair Type 3-4; mixed heritage encompasses all types',
    traditions: 'Latin American hair oiling traditions include aloe vera (widely grown in Latin America) as a scalp treatment; chamomile rinses for scalp calming in Mexico; avocado (also Latin American in origin) as scalp and hair treatment; castor oil in Latin American hair traditions',
    aloeVera: {
      what: 'Aloe vera gel is used extensively in Latin American scalp and hair care; aloe vera (Aloe barbadensis) has anti-inflammatory, antimicrobial, and hydrating properties; applied to the scalp as a calming, moisturising scalp treatment; also used directly on sunburned scalp skin',
      application: 'Fresh aloe gel from the cut leaf or commercial stabilised aloe gel applied to the scalp; can be used as a scalp treatment before washing or as a light leave-in scalp moisturiser'
    },
    commonConcerns: ['Scalp sunburn in very sunny Latin American and Caribbean climates (important: the scalp is commonly sunburned and skin cancer occurs on the scalp in fair-skinned Latin Americans; hair provides SPF protection for darker skin)', 'Chemical treatment scalp sensitivity (relaxers, lightening)']
  },
  'east-asian': {
    hairType: 'Predominantly Type 1 (straight) across East Asian populations; hair shaft is typically round in cross-section; generally high density; scalp tends toward normal to oily; hair shaft is typically smooth-cuticled',
    ginsengTradition: 'Ginseng (Panax ginseng, Korean red ginseng) has been used in East Asian medicine and scalp care for thousands of years; ginsenosides in ginseng have demonstrated ability to promote hair follicle stem cell proliferation in laboratory studies; Korean scalp care products incorporating ginseng extract are widely used',
    camellia: 'Tsubaki (camellia) oil is the traditional Japanese hair oil; Shimojima tsubaki oil from the Izu Oshima island has been used in Japan for centuries; lightweight, non-greasy oil that provides excellent shine and conditioning; a cornerstone of Japanese hair beauty tradition',
    scaliness: {
      kbeautyApproach: 'Korean skincare\'s skin-first philosophy extends to the scalp; Korean scalp care products (scalp serums, scalp essences, scalp tonics) are applied to the scalp as K-skincare products are applied to the face; scalp health is treated as the foundation of hair health; the K-beauty scalp care product market is highly sophisticated',
      products: ['Scalp serums (contains niacinamide, peptides, fermented ingredients)', 'Scalp essences (light liquid treatments)', 'Scalp tonics (refreshing sprays for between washes)']
    },
    commonConcerns: ['Higher sebum production on average — oily scalp/roots with dryness at the ends is common', 'Scalp congestion from heavy silicone-based styling products', 'Sensitivity to the highly alkaline perm chemicals (permanent wave solutions) used extensively in East Asian hair styling', 'Hair loss (androgenetic alopecia affects a significant portion of East Asian men; Korean hair loss treatment market is enormous)']
  },
  'east-african': {
    hairType: 'Predominantly Type 4 (4A-4C); tight coil to kinky curl patterns; highly textured; scalp sebum adequate but travels extremely slowly down the hair shaft',
    traditions: 'Shea butter as scalp and hair moisturiser; castor oil (African castor oil, distinct from Jamaican Black Castor Oil); Ethiopian Tilossissa hair butter; traditional braiding with natural oiling at the scalp; frankincense and myrrh smoke as hair fragrance (smoke-based hair care tradition throughout East Africa)',
    commonConcerns: ['Dryness: high priority in East African hair care', 'Traction alopecia from tight traditional styles (braids, cornrows)', 'Scalp sensitivity from chemical straightening', 'Flaky scalp from product buildup and dry conditions'],
    washingRoutine: 'Pre-poo (pre-shampoo oil treatment) with castor or shea butter applied to the scalp and hair before shampooing provides protection against the drying effect of shampoo; leave on for at least 30 minutes before shampooing'
  },
  'south-african': {
    hairType: 'Extremely diverse: Black South African hair predominantly Type 4; South African Indian hair Type 2-3; Cape Malay community hair encompasses mixed heritage; Afrikaans European community hair Type 1-2',
    traditions: 'Marula oil (Sclerocarya birrea) — indigenous to Southern Africa and now internationally acclaimed; lightweight, non-greasy, nourishing oil used by San people historically; applied to scalp and hair; baobab oil — from the baobab tree abundant across Southern Africa; omega fatty acid rich; scalp moisturiser',
    marulaOil: {
      what: 'Marula oil is extracted from the kernel of the marula fruit (Sclerocarya birrea); indigenous to Southern Africa; very lightweight, non-greasy oil with very high oleic acid content (70%+); absorbs quickly; excellent for scalp and hair without heaviness; the Oprah-featured Africas Best and internationally sold Marula Oil by Lulu & Georgia products brought marula to global attention',
      application: 'Applied to dry or damp scalp before styling; also excellent as a hair finishing oil for shine and frizz control; very well-tolerated by most scalp types including oily scalps due to its lightness'
    },
    commonConcerns: ['Same Type 4 hair concerns as other African communities: dryness, traction alopecia, product buildup', 'For European-heritage South Africans: sun damage to scalp skin (South Africa\'s UV index is among the highest in the world due to altitude and proximity to the ozone hole over Antarctica)']
  },
  'black-american': {
    hairType: 'Predominantly Type 3-4 across Black American community; enormous variation from 3A loose curls to 4C very tightly coiled; textured hair',
    naturalHairMovement: {
      what: 'The natural hair movement — Black Americans embracing their natural hair texture rather than chemical straightening (relaxers) — transformed Black American hair and scalp care in the 2000s-2010s; relaxer sales declined dramatically; natural hair care product lines, YouTube tutorials, and community knowledge sharing exploded; figures like Chris Rock\'s documentary "Good Hair" (2009) brought mainstream awareness to the significance of Black hair',
      scalp: 'The return to natural hair required a return to scalp care practices appropriate for highly textured hair; the relaxer era\'s scalp care advice was entirely different from natural hair care; scalp health resources specifically for textured natural hair grew enormously in this period'
    },
    edges: {
      what: 'The "edges" — the hairline and the hair growing at the temples and nape — hold particular cultural significance in Black American hair culture; "laid edges" (smooth, styled edges using edge control products) are an important styling element; loss of edges to traction alopecia is a significant concern',
      edgeControl: 'Edge control products (pomades and gels specifically formulated for laying down baby hairs and edges) are a major Black hair care product category; Eco Style Gel, Got2b Glued, and dozens of Black-owned edge control brands serve this market',
      traction: 'The same tight styles that create beautiful laid edges can cause traction alopecia over time; care in how tight the edges are pulled, and regular breaks from styled-tight-edges looks, is important for long-term hairline health'
    },
    LOCmethod: 'The LOC method (Liquid, Oil, Cream) and LCO method (Liquid, Cream, Oil) are moisture-layering techniques developed within Black American natural hair community to address the high moisture needs of highly coiled textured hair; the scalp typically benefits from all components; see hair porosity guide for full LOC method details'
  }
};

export function getScalpAnatomy(section) {
  const map = {
    structure: SCALP_ANATOMY.structure,
    microbiome: SCALP_ANATOMY.scalpMicrobiome,
    ethnic: SCALP_ANATOMY.ethnicDifferences
  };
  return map[section] || SCALP_ANATOMY;
}

export function getScalpCondition(condition) {
  const map = {
    dandruff: SCALP_CONDITIONS.dandruff,
    seborrhoeic: SCALP_CONDITIONS.seborrhoeicDermatitis,
    psoriasis: SCALP_CONDITIONS.psoriasis,
    tinea: SCALP_CONDITIONS.scalp.tinea,
    folliculitis: SCALP_CONDITIONS.scalp.folliculitis,
    traction: SCALP_CONDITIONS.traction
  };
  return map[condition] || SCALP_CONDITIONS;
}

export function getScalpCareRoutine(aspect) {
  const map = {
    washing: SCALP_CARE_ROUTINES.washing,
    massage: SCALP_CARE_ROUTINES.scalpMassage,
    exfoliation: SCALP_CARE_ROUTINES.exfoliation,
    oils: SCALP_CARE_ROUTINES.scalpOils
  };
  return map[aspect] || SCALP_CARE_ROUTINES;
}

export function getEthnicScalpGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_SCALP_GUIDES['west-african'],
    'south-asian': ETHNIC_SCALP_GUIDES['south-asian'],
    caribbean: ETHNIC_SCALP_GUIDES.caribbean,
    arab: ETHNIC_SCALP_GUIDES.arab,
    latina: ETHNIC_SCALP_GUIDES.latina,
    'east-asian': ETHNIC_SCALP_GUIDES['east-asian'],
    'east-african': ETHNIC_SCALP_GUIDES['east-african'],
    'south-african': ETHNIC_SCALP_GUIDES['south-african'],
    'black-american': ETHNIC_SCALP_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

export const SCALP_CARE_STATS = {
  moduleId: 'scalp_care_guide',
  version: '1.0.0',
  topics: ['scalp anatomy SCALP layers', 'Malassezia dandruff fungus', 'seborrhoeic dermatitis', 'scalp psoriasis', 'tinea capitis children', 'traction alopecia protective styles', 'champi South Asian head massage', 'rosemary oil hair growth evidence', 'Jamaican Black Castor Oil', 'Korean scalp care K-beauty', 'tsubaki camellia oil Japan', 'ginseng scalp care', 'marula oil South Africa', 'edges Black American hairline', 'LOC method textured hair', 'hijab scalp care', 'black seed oil Islamic tradition', 'wash frequency Type 4 hair'],
  communitiesSupported: 9,
  keyFacts: [
    'A 2023 study found rosemary oil to be as effective as 2% minoxidil for androgenetic hair loss over a 24-week period; rosemary oil must be properly diluted in a carrier oil to 2-5% concentration before scalp application to avoid irritation or chemical burns from the undiluted essential oil',
    'Traction alopecia — hair loss from repeated tension on hair follicles from tight hairstyles — is one of the most common causes of hair loss in Black women; early traction alopecia is reversible but late-stage scarring traction alopecia is permanent; the "edges" (hairline temples) are the most commonly affected area',
    'Champi (Indian head massage with oil) is a traditional South Asian hair care practice with thousands of years of history; coconut oil is the most traditional champi oil and has demonstrated ability to penetrate the hair shaft and reduce protein loss, making it unique among common hair oils',
    'Women who wear hijab face specific scalp care challenges: the covered environment reduces air circulation, increases warmth and perspiration, and can promote fungal scalp conditions; cotton hijab underlining breathes better than synthetic fabrics; more frequent scalp cleansing may be necessary',
    'The natural hair movement of the 2000s-2010s transformed Black American hair care from a relaxer-dominated industry to a natural textured hair industry; relaxer sales declined dramatically while natural hair care products, tutorials, and community knowledge sharing resources expanded enormously'
  ]
};
