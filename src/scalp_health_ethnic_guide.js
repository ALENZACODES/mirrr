/**
 * MIRRR — Scalp Health: Ethnic Focus
 * Scalp biology, dandruff, seborrheic dermatitis, scalp care, all 9 communities.
 */

export const SCALP_BIOLOGY = {
  title: 'Scalp Biology and Physiology',
  structure: {
    uniqueness: 'The scalp is the most sebaceous (oil-producing) region of the entire body; sebaceous gland density on the scalp is approximately 900 glands/cm² compared to 100-200/cm² on the face; the scalp produces 100-400 mg of sebum per day; this high sebum environment creates unique conditions: it supports a specific microbial ecosystem; it provides natural conditioning to hair; and it creates the substrate for scalp conditions like seborrheic dermatitis',
    microbiome: 'Scalp microbiome: the scalp hosts a distinct microbial ecosystem adapted to the high-sebum, moderately moist environment; key microorganisms: Malassezia species (lipophilic yeasts that digest sebum lipids and are present on virtually all human scalps; the metabolic byproducts of Malassezia digestion contribute to dandruff and seborrheic dermatitis when overgrowth or immune response occurs); Cutibacterium acnes (formerly Propionibacterium acnes; also present on scalp; involved in scalp acne/folliculitis); Staphylococcus epidermidis (generally commensal and protective); the scalp microbiome balance is influenced by hair care products, washing frequency, sebum production, and genetics',
    pHLevel: 'Scalp pH: the healthy scalp pH is approximately 4.5-5.5 (slightly acidic); this acidic environment: supports the beneficial microbial balance; maintains the integrity of the hair cuticle; inhibits the growth of pathogenic organisms; many hair care products (especially conditioners with quaternary ammonium compounds — quats) have higher pH that disrupts this balance; shampoos with sulfates drop scalp pH but the acidic rinse of apple cider vinegar (pH approximately 3) restores it'
  },
  hairGrowthCycle: {
    overview: 'Scalp hair growth cycle: the scalp has approximately 100,000 hair follicles; each follicle cycles independently; anagen (growth phase): 2-6 years on average (the determinant of maximum hair length); catagen (transition): 2-3 weeks; telogen (resting): 3-4 months; exogen (shedding): the hair is released; normal daily shedding: 50-100 hairs/day; increased shedding (telogen effluvium) occurs when more follicles than normal enter telogen simultaneously',
    follicleTypes: 'Follicle types and their care needs: round follicles produce straight hair (East Asian); slightly elliptical follicles produce wavy hair; highly elliptical follicles produce tightly coiled hair (West African, Black American); the shape of the follicle affects sebum distribution along the hair shaft — sebum travels down the hair shaft through physical contact; straight hair conducts sebum efficiently down the shaft; tightly coiled hair has many bends that interrupt sebum travel, meaning the scalp may be oily while the length of coily hair is dry'
  }
};

export const SCALP_CONDITIONS = {
  dandruff: {
    name: 'Dandruff (Pityriasis simplex capillitii)',
    overview: 'Dandruff is the shedding of dead skin cells from the scalp in visible white/grey flakes; it affects approximately 50% of the global adult population; it is not caused by poor hygiene or dry scalp (a common misconception); dandruff is associated with Malassezia yeast and a scalp inflammatory response',
    mechanism: 'Dandruff mechanism: Malassezia yeast metabolises scalp sebum; oleic acid produced as a byproduct penetrates the scalp epidermis; in susceptible individuals (approximately 50% of the population), this triggers an inflammatory immune response; the inflammation accelerates epidermal cell turnover, causing the visible clumping and shedding of skin cells as flakes',
    treatment: 'Dandruff treatment: zinc pyrithione (ZPT): anti-fungal and antibacterial; the most commonly used active in OTC dandruff shampoos; ketoconazole (2%): prescription-strength antifungal; excellent evidence for moderate-severe dandruff; selenium sulfide: reduces Malassezia through anti-fungal and anti-proliferative mechanisms; coal tar: reduces cell proliferation and has anti-inflammatory properties; useful for scalp psoriasis overlap; salicylic acid: keratolytic — physically removes scale from the scalp; pyroctone olamine (OCT): gentler antifungal used in European scalp products',
    ethnicVariation: 'Dandruff in different communities: dandruff appears different on dark hair and dark skin vs fair hair and light skin; on dark clothing and dark hair, white flakes are more visible; on the scalp, scaling appears different on dark skin (may appear grey rather than white); the same Malassezia mechanism operates across all ethnicities; sebum production differences (Black women typically have lower sebum production than East Asian or White women) may influence dandruff patterns'
  },
  seborrheicDermatitis: {
    name: 'Seborrheic Dermatitis',
    description: 'Seborrheic dermatitis is a more inflammatory version of dandruff; it causes red, greasy, scaly patches not only on the scalp but also on the face (nasolabial folds, eyebrows, beard area, ears), chest, and other sebaceous areas; it is a chronic relapsing condition; the same Malassezia-mediated mechanism underlies both dandruff and seborrheic dermatitis, with seborrheic dermatitis representing a more intense immune response',
    prevalence: 'Seborrheic dermatitis prevalence: 1-3% of the general population for the full condition; 11% in immunocompromised individuals; significantly more common in patients with HIV/AIDS and Parkinson\'s disease; genetics, immune function, and stress influence susceptibility',
    treatment: 'Seborrheic dermatitis treatment: ketoconazole 2% shampoo and cream; ciclopirox olamine shampoo; low-potency topical corticosteroids (triamcinolone or betamethasone scalp solution) for flares — with caution against long-term use (skin thinning, hair loss); topical calcineurin inhibitors (tacrolimus, pimecrolimus) as steroid-sparing alternatives; coal tar for scalp psoriasis overlap'
  },
  scalpAcne: {
    name: 'Scalp Acne (Scalp Folliculitis)',
    description: 'Scalp acne (folliculitis decalvans in severe cases; scalp acne in mild cases) occurs when hair follicles become inflamed, typically from bacteria (Staphylococcus aureus) or from product buildup trapping bacteria; small red, itchy bumps along the hairline and scalp; more common in individuals who use heavy products (grease, heavy oils, pomades) that occlude follicles; product buildup is a significant contributor in communities that use heavy hair products',
    treatment: 'Scalp acne treatment: clarifying shampoo (removes product buildup); salicylic acid scalp treatment; tea tree oil shampoo (anti-bacterial/anti-fungal); for severe or persistent cases: topical antibiotics (clindamycin solution) or oral antibiotics prescribed by a dermatologist; avoid occlusive products on the scalp particularly near the hairline'
  },
  tractionAlopecia: {
    name: 'Traction Alopecia',
    description: 'See hair_growth_guide_ethnic.js for full coverage; brief summary: hair loss from chronic tension on the hair shaft and follicle from tight hairstyling (braids, weaves, extensions, high ponytails, tight buns); affects approximately 17% of Black women; follicle damage is reversible early (marginal temporal recession with follicular openings still visible); permanent scarring alopecia develops with prolonged traction; the temporal and marginal scalp are most affected',
    scalp: 'Scalp health in traction: tight hairstyles also affect the scalp health directly; the tension on the scalp skin causes local inflammation; tight scalp tension contributes to headaches and scalp sensitivity; appropriate scalp care during protective styling periods: keep the scalp clean (dry shampoo or diluted shampoo applied with a spray bottle through the style); apply scalp oil (light oil such as jojoba, diluted tea tree) to the exposed scalp between braids; moisturise the scalp at the roots'
  },
  CCCA: {
    name: 'Central Centrifugal Cicatricial Alopecia (CCCA)',
    description: 'CCCA is a scarring alopecia most prevalent in Black women; it begins as hair loss and scalp tenderness at the crown and spreads centrifugally (outward); as it progresses, the follicles are destroyed and replaced by fibrous scar tissue; the genetic basis (PADI3 gene mutation) means it can occur without any particular hairstyling cause; it is associated with high-tension hairstyling but can occur in women who never use heat or tight styles; biopsy is required for definitive diagnosis; treatment must begin early to preserve remaining follicles; treatment includes topical or injected corticosteroids; doxycycline; topical minoxidil for any remaining follicles'
  }
};

export const SCALP_CARE_INGREDIENTS = {
  overview: 'Key scalp care ingredients and their mechanisms',
  antifungal: {
    ketoconazole: 'Ketoconazole 2%: the gold standard antifungal for Malassezia-related dandruff and seborrheic dermatitis; inhibits the ergosterol synthesis pathway of fungal cells; available OTC at 1% and prescription at 2%; highly effective but should be used 2-3x weekly during treatment, then maintenance 1-2x monthly',
    zinpyrithione: 'Zinc pyrithione (ZPT): anti-fungal and anti-bacterial; the most common active in OTC dandruff shampoos; Head & Shoulders and many others use ZPT; good maintenance option for mild-moderate dandruff',
    seleniumSulfide: 'Selenium sulfide: reduces Malassezia growth; can cause discolouration of chemically lightened (bleached or highlighted) hair and should be avoided by those with such colour treatments; effective for severe dandruff'
  },
  antiInflammatory: {
    coalTar: 'Coal tar: reduces skin cell proliferation (keratolytic) and has anti-inflammatory effects; particularly effective for scalp psoriasis and seborrheic dermatitis with scalp psoriasis overlap; has a strong odour; can discolour blonde or light-coloured hair',
    salicylicAcid: 'Salicylic acid (scalp): keratolytic — breaks down and removes scalp scale physically; useful as an adjunct to anti-fungal shampoos; used alone, it treats the symptom (scaling) without the cause (Malassezia); combines well with zinc pyrithione or ketoconazole',
    teaTree: 'Tea tree oil (Melaleuca alternifolia): has demonstrated anti-fungal and anti-bacterial properties in vitro; a 5% tea tree oil shampoo showed improvement in dandruff in a clinical trial; less well-studied than ketoconazole or ZPT but popular and generally well-tolerated; can irritate sensitive scalps at higher concentrations'
  },
  moisturising: {
    scalpOils: 'Scalp oils for healthy scalp: jojoba oil (closely mimics sebum; non-greasy; suitable for all scalp types); argan oil (light; anti-inflammatory; for dry scalp); peppermint oil (stimulates blood flow to follicles; cooling sensation; 2019 study showed peppermint oil outperformed minoxidil for hair growth in mice — human evidence limited); rosemary oil (2015 RCT showed comparable results to 2% minoxidil for androgenetic alopecia at 6 months); neem oil (anti-fungal and anti-bacterial; useful for scalp conditions; strong odour)',
    avc: 'Apple cider vinegar (ACV): pH approximately 3; diluted ACV (1:4 with water) as a scalp rinse restores acidic pH after alkaline shampoos; closes the hair cuticle; has weak anti-fungal properties; reduces scalp itch for some individuals; must be diluted to avoid scalp irritation; not a substitute for medical treatment of seborrheic dermatitis'
  }
};

export const ETHNIC_SCALP_GUIDES = {
  'west-african': {
    community: 'West African',
    scalpCharacteristics: 'West African scalp characteristics: Type 4 (4A, 4B, 4C) tightly coiled hair creates specific scalp care challenges; sebum production in West African women is on average lower than in East Asian or White women (research by DeAngelis and others documents this); the tight coil of the hair inhibits natural sebum from distributing down the hair shaft from the scalp; the result is a scalp that may overproduce sebum (leading to scalp buildup) while the hair length remains dry and dull without additional moisturisation',
    productBuildup: 'Product buildup: the West African and Black diaspora hair care tradition of using heavy products (shea butter, coconut oil, hair grease, edge control, heavy pomades) directly on the scalp creates product buildup that can clog follicles, create scalp acne, and create an environment for dandruff-causing yeast overgrowth; clarifying shampoo (once monthly or as needed) removes accumulated product; the scalp and length have different needs — heavy products belong on the length (or mid-shaft to ends), not the scalp',
    washFrequency: 'Wash frequency and West African hair: the traditional advice to wash Type 4 hair infrequently (to preserve natural oils) has been revisited; infrequent washing allows scalp product and sebum buildup; a washday routine every 1-2 weeks for scalp and length, preceded by a scalp massage, is a reasonable approach; those with scalp conditions may need more frequent scalp attention',
    oilingScalp: 'Scalp oiling tradition: the practice of oiling the scalp directly (grease, petroleum jelly, heavy oils) was historically widespread in Black hair care; this practice is now understood to occlude follicles and attract product buildup; light scalp oils (diluted in a dropper or applicator bottle) applied to the scalp partings are a better approach; jojoba, diluted rosemary oil, or diluted peppermint oil applied to the scalp (not heavy grease)',
    recommendations: 'Monthly clarifying shampoo; light scalp oil between wash days; tea tree oil shampoo or ZPT shampoo for any dandruff; scalp massage before washday to loosen buildup and stimulate circulation; diluted ACV rinse for pH balance; avoid heavy products directly on scalp'
  },
  'south-asian': {
    community: 'South Asian',
    champi: 'Champi (hair and scalp massage): the South Asian tradition of scalp oiling and massage (champi) is both a beauty practice and a family bonding ritual; weekly or biweekly application of warm oil (coconut, sesame, amla, brahmi oil) to the scalp followed by massage and sometimes overnight steaming is documented in Indian beauty culture for centuries; the massage component has genuine benefit for scalp circulation; the oil itself conditions the scalp and pre-poo (pre-wash conditioning) protects the hair during washing',
    dandruff: 'Dandruff prevalence in South Asian hair: dandruff is extremely common in South Asian communities; the causes may include the specific Malassezia strains present in the South Asian scalp microbiome, dietary factors, hard water (common in South Asian diaspora cities in the UK, particularly), and high product use; ketoconazole or ZPT shampoo as a treatment; cultural use of coconut or sesame oil on the scalp may actually slightly reduce Malassezia (medium-chain fatty acids in coconut oil have mild anti-fungal properties)',
    hardWater: 'Hard water and South Asian scalp: the water supply in many cities with large South Asian diaspora populations (London, Birmingham, Houston, Toronto) has high mineral content (hard water); calcium and magnesium deposits accumulate on the scalp and hair shaft; this disrupts the hair cuticle, causes scalp irritation, and exacerbates dandruff; chelating shampoos (containing EDTA or phytic acid) remove mineral deposits; hard water filters for the shower are increasingly popular in South Asian communities',
    recommendations: 'Weekly champi with warm oil; ketoconazole or ZPT shampoo for dandruff; chelating shampoo monthly for hard water mineral removal; scalp massage for circulation; amla oil traditionally for scalp health and hair growth'
  },
  caribbean: {
    community: 'Caribbean',
    seaWater: 'Caribbean scalp and salt water: Caribbean lifestyle involves significant sea water and salt water exposure; sea water is mildly clarifying for the scalp and hair (the salt has a mild antimicrobial effect) but also dehydrating for the hair length; post-beach hair care: rinse with fresh water promptly to remove salt; condition the length; the scalp generally tolerates sea water well',
    coconut: 'Coconut oil scalp tradition: coconut oil is the central scalp and hair oil of Caribbean tradition; medium-chain fatty acids in coconut oil (particularly lauric acid) penetrate the hair shaft and have mild anti-fungal properties; applied warm to the scalp as a pre-wash treatment; the LOC method (Liquid-Oil-Cream) applied to the hair but not the scalp is the modern approach to preserving the benefits of coconut oil without the scalp buildup problems',
    recommendations: 'Coconut oil as pre-wash scalp treatment (not for daily scalp application); fresh water rinse after sea water exposure; clarifying shampoo periodically for scalp buildup; ZPT or ketoconazole if dandruff develops; scalp massage; diluted ACV rinse for pH balance'
  },
  arab: {
    community: 'Arab',
    blackSeed: 'Black seed (Nigella sativa) for scalp: nigella sativa (black seed; habbatus sauda; "the seed of blessings") has significant Islamic documentation — the Prophet Muhammad (PBUH) is narrated to have said it is "a cure for everything except death"; black seed oil contains thymoquinone, a potent anti-inflammatory and anti-oxidant compound; for the scalp, black seed oil has been used in Arab traditional medicine for scalp health, dandruff, and hair growth; preliminary evidence supports anti-inflammatory and anti-fungal activity; applying black seed oil to the scalp has both religious-cultural significance and plausible biological benefit',
    argan: 'Argan oil (Moroccan Oil): native to Morocco; the Argan tree (Argania spinosa) is grown almost exclusively in a specific region of southwest Morocco; Berber women of Morocco have used argan oil for scalp and hair health for centuries; argan oil is rich in oleic acid, linoleic acid, and vitamin E; it is light enough for scalp use without excessive occlusion; it is the base for many Middle Eastern and North African scalp and hair products',
    henna: 'Henna and scalp health: henna (Lawsonia inermis) is used throughout Arab, South Asian, and North African communities both for hair colouring and for scalp health; henna has mild anti-fungal properties and is used traditionally for dandruff; applied as a paste to the scalp, henna cools the scalp and reduces inflammation; it also coats and slightly thickens the hair shaft; note: black henna (containing PPD) is a chemical and should NOT be used on scalp',
    recommendations: 'Black seed (nigella sativa) oil for scalp — traditional, culturally significant, and plausibly beneficial; argan oil as a light scalp treatment; henna for scalp health and conditioning; ZPT or ketoconazole shampoo for dandruff; scalp massage'
  },
  latina: {
    community: 'Latina',
    avocado: 'Avocado for scalp: the avocado (Persea americana; native to Mexico and Central America) is a Latin American beauty staple; avocado oil (or mashed avocado as a scalp mask) contains oleic acid (similar to sebum), vitamins B6, B9, vitamin E, and phytosterols; for the scalp, avocado oil provides a nutrient-rich conditioning treatment; avocado for scalp is traditional Latin American beauty medicine with plausible biological support',
    rosemary: 'Rosemary (romero): rosemary oil is extensively used in Latin American hair and scalp tradition; rosemary is native to the Mediterranean and was introduced to the Americas by Spanish colonists; the folk use of rosemary (as a scalp rinse, in hot water, applied to the scalp) for hair growth and scalp health is documented throughout Latin America and the Caribbean; the 2015 RCT showing rosemary oil comparable to 2% minoxidil for hair growth provides scientific support for this folk tradition',
    yerba: 'Yerba mate and scalp: yerba mate (Ilex paraguariensis; native to South America) is consumed as a tea throughout Argentina, Uruguay, Paraguay, and Brazil; yerba mate contains caffeine, polyphenols, and chlorogenic acids; caffeine has demonstrated inhibition of 5-alpha-reductase (the enzyme that converts testosterone to the hair-loss-driving DHT) in vitro and in small clinical studies; yerba mate applied topically may have mild hair-growth-supportive activity through this mechanism',
    recommendations: 'Avocado oil as scalp treatment; rosemary oil diluted for scalp stimulation; ZPT shampoo for dandruff; scalp massage in the tradition of champi (also practiced in some Latin American communities); clarifying shampoo for product buildup removal'
  },
  'east-asian': {
    community: 'East Asian',
    scalness: 'East Asian scalp sebum production: East Asian women (particularly Japanese and Korean) have among the highest sebum production rates among women of different ethnicities in comparative studies; the high sebum environment of East Asian scalps means dandruff and scalp greasiness are common concerns; the K-beauty and J-beauty approach to scalp care has become one of the most sophisticated globally in response',
    scaleCare: 'Korean scalp care: Korea has a specific sub-industry of scalp care (두피 관리 — dupi gwanri); scalp clinics in Korea analyse the scalp under microscope and prescribe specific shampoos, serums, and treatments; the Korean approach treats the scalp as the "skin" for the hair — with the same care as facial skin; scalp essence (a lightweight tonic applied to the scalp between washes), scalp scrub (periodic physical exfoliation of scalp flakes), and scalp ampoule (concentrated treatment for specific concerns) are standard K-beauty scalp care products',
    ginseng: 'Ginseng for scalp: Korean red ginseng (Panax ginseng) is extensively used in Korean scalp and hair products; ginsenosides (the active compounds in ginseng) have demonstrated effects on hair follicle cells in laboratory studies including promotion of anagen phase; Korean hair care brands formulate ginseng extensively into scalp serums, shampoos, and hair ampoules; ginseng has been used in Chinese medicine for scalp health for centuries',
    recommendations: 'Scalp-specific care products (K-beauty scalp essence, scalp serum); ginseng-based scalp products; ZPT or ketoconazole shampoo for dandruff (dandruff is common in East Asian high-sebum scalps); regular scalp exfoliation with a scalp brush; consider scalp analysis at a Korean scalp clinic if accessible; infrequent conditioning ON the scalp (conditioner on the scalp increases greasiness); wash frequency 3-7 days depending on sebum production'
  },
  'east-african': {
    community: 'East African',
    scalpOils: 'East African scalp oils: Ethiopian, Eritrean, and Somali women traditionally use locally sourced plant oils for scalp and hair health; tej oil (from Ethiopian honey wine fermentation process — a honey-based conditioner) is traditional; castor oil (JBCO, or standard castor oil) for scalp and edge growth; frankincense oil (diluted) for scalp health and anti-inflammatory effect',
    teff: 'Teff and hair health: teff (Eragrostis tef — the ancient East African grain) is the foundation of Ethiopian diet (injera bread) and contains iron, zinc, and B vitamins that are essential for hair follicle health; iron deficiency is among the most common nutritional causes of hair shedding (telogen effluvium); East African women who consume a teff-based diet have significant dietary iron; those in diaspora who move away from teff-heavy diets may benefit from ensuring adequate iron intake',
    recommendations: 'Castor oil scalp massage for hair growth support; frankincense oil (diluted) as anti-inflammatory scalp treatment; ensure dietary iron (teff consumption in diaspora reduces risk of iron-deficiency hair loss); ZPT shampoo for dandruff; scalp massage for circulation'
  },
  'south-african': {
    community: 'South African',
    marula: 'Marula oil for scalp: marula oil (Sclerocarya birrea) is used traditionally for scalp and skin health in South Africa by Zulu and other communities; its high oleic acid content (approximately 70%) gives excellent skin penetration; anti-inflammatory properties relevant to scalp inflammation; the light texture of marula oil means it can be applied to the scalp without occlusive buildup problems',
    rooibos: 'Rooibos scalp rinse: rooibos tea as a scalp rinse (brewed tea, cooled, applied to the scalp after washing) provides the anti-inflammatory flavonoids aspalathin and nothofagin to the scalp; traditionally used by South African Khoikhoi and other communities; the anti-inflammatory mechanism addresses the scalp inflammation that underlies dandruff and seborrheic dermatitis; also restores slightly acidic pH',
    recommendations: 'Marula oil scalp massage; rooibos tea scalp rinse; ZPT shampoo for dandruff; clarifying shampoo for product buildup; scalp massage; protect the scalp during protective styling (keep scalp clean and moisturised through braids/weaves)'
  },
  'black-american': {
    community: 'Black American',
    scalp: 'Black American scalp health context: the Black American hair care industry has undergone a significant shift in scalp awareness; the historical emphasis on hot combs, relaxers, and heavy product application focused primarily on the hair shaft rather than the scalp; the natural hair movement (2009-present) has driven a fundamental reassessment of scalp health as the foundation of hair health',
    wednesdaysShampoo: 'Wash day scalp care: the Black American "wash day" routine is a comprehensive hair care event; for scalp health: pre-poo scalp massage with diluted scalp oil (jojoba, rosemary, castor oil blend in a dropper bottle applied to the scalp); shampoo with ZPT or clarifying shampoo for scalp (conditioner primarily to hair length and ends, not scalp); post-wash scalp serum or light oil; the distinction between scalp products (lighter) and length products (heavier) is a key principle of modern Black American natural hair care',
    chemicals: 'Chemical treatments and scalp: relaxers (sodium hydroxide or guanidine carbonate lye applied to the scalp) can cause severe chemical burns when improperly applied (known as "creamy crack" burns); scalp burns from overprocessed relaxers cause follicle damage and permanent hair loss in affected areas; the natural hair movement has been partly motivated by avoiding chemical scalp damage; for those who continue relaxing: always use base/protective barrier on the scalp before relaxer; never overlap relaxer on previously relaxed hair; follow the correct timing strictly',
    recommendations: 'Scalp-specific light oil applied with dropper bottle to scalp between wash days; scalp massage before and during wash day; ZPT shampoo for dandruff (very common in Black American community); diluted rosemary oil scalp application for hair growth support; for relaxed hair: strict chemical service protocols to avoid scalp damage; for natural hair: JBCO at scalp edges for edge growth'
  }
};

export function getScalpHealthGuide(communityId) {
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

export const SCALP_HEALTH_STATS = {
  moduleId: 'scalp_health_ethnic_guide',
  version: '1.0.0',
  topics: ['Malassezia yeast dandruff seborrheic dermatitis mechanism', 'ketoconazole 2% antifungal scalp', 'zinc pyrithione ZPT dandruff shampoo', 'scalp pH 4.5-5.5 acidic ACV rinse', 'champi South Asian oil scalp massage', 'black seed nigella sativa Islamic hadith', 'rosemary oil 2015 RCT minoxidil hair growth', 'CCCA central centrifugal cicatricial alopecia Black women', 'Korean scalp care dupi gwanri ginseng', 'hard water mineral deposits chelating shampoo'],
  communitiesSupported: 9,
  keyFacts: [
    'The scalp is the most sebaceous region of the entire body with approximately 900 sebaceous glands per cm² (versus 100-200/cm² on the face); it produces 100-400mg of sebum per day; dandruff (affecting approximately 50% of the global adult population) is not caused by poor hygiene or dry scalp but by Malassezia yeast metabolising scalp sebum and producing oleic acid as a byproduct, which triggers an inflammatory immune response in susceptible individuals causing accelerated skin cell turnover and visible flaking; ketoconazole 2% is the gold standard antifungal treatment for Malassezia-related dandruff',
    'In tightly coiled (Type 4) hair, the multiple bends in the coiled hair shaft interrupt the travel of scalp sebum down the hair shaft by physical contact; this means the scalp can become oily with sebum buildup while the hair length remains dry, contributing to the scalp product buildup problem common in communities using heavy products directly on the scalp; light scalp-specific oils applied with a dropper applicator bottle, and avoiding heavy products on the scalp (reserving them for the hair length), addresses this structural reality',
    'A 2015 randomised controlled trial (RCT) published in the journal Skinmed showed that rosemary oil applied to the scalp produced hair count results comparable to 2% minoxidil at the 6-month mark for androgenetic alopecia; this finding provides scientific support for the traditional use of rosemary for hair growth documented across Latin American, Arab, and European folk medicine traditions; rosemary oil must be diluted in a carrier oil before scalp application to avoid scalp irritation'
  ]
};
