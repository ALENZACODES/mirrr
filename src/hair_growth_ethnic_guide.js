/**
 * MIRRR — Hair Growth Ethnic Guide
 * The science and cultural traditions of hair growth, retention, and
 * length across all 9 ethnic communities. Hair growth is a universal
 * desire with deeply community-specific practices, ingredients, and
 * challenges. This module covers the biology, the tradition, and the
 * practical guidance for each community.
 */

export const ETHNIC_HAIR_GROWTH_GUIDES = {
  'west-african': {
    communityId: 'west-african',
    communityName: 'West African',
    hairGrowthProfile: {
      description: 'West African hair (type 4A-4C in natural hair typing) grows at the same rate as any other hair: approximately 1.25cm (half an inch) per month. The challenge for length retention isn\'t growth rate — it\'s breakage. Type 4 coily hair has structural characteristics (tight helical curl pattern, irregular distribution of the cuticle layer) that make it inherently more vulnerable to breakage, moisture loss, and mechanical damage than straighter hair textures.',
      growthRate: 'Approximately 6 inches per year (same as all hair). Type 4 hair may appear to grow slower because significant shrinkage (40-80%) makes length gains invisible until the hair is stretched.',
      shrinkage: 'Type 4C hair can shrink by up to about 75% — hair that is 12 inches long can look about 3 inches long when dry and coiled. This is a normal, healthy characteristic of the hair — not a sign of no growth.',
      breakagePrevention: 'The primary goal for West African hair length retention is reducing breakage, not accelerating growth. Growth is consistent. Retention is the variable.',
    },
    rootsOfGrowthWisdom: {
      title: 'West African Hair Growth Traditions',
      practices: [
        { practice: 'Scalp Oiling', tradition: 'Regular application of palm oil, coconut oil, castor oil, or shea butter to the scalp and hair roots. This practice crosses all West African cultures.', science: 'Oil cannot directly stimulate hair follicles (oil cannot penetrate the scalp deeply), but regular scalp massage DOES increase blood flow to follicles (increasing nutrient delivery and oxygen to hair cells). The massage is the mechanism; the oil is the medium.' },
        { practice: 'Protective Styling for Length', tradition: 'Braids, twists, and weaves have been used in West Africa for thousands of years (Namibian Himba women, Fulani braids, Yoruba threading). These styles protect the ends of the hair from breakage.', science: 'Ends are the oldest part of the hair and most vulnerable to breakage. Keeping ends protected (tucked in, moisturized, not manipulated constantly) is the most important factor in length retention.' },
        { practice: 'Infrequent Manipulation', tradition: 'In West African households, children\'s hair was often braided and left untouched for weeks. This is contrary to the Western beauty norm of daily hair styling.', science: 'Every time you manipulate type 4 hair — combing, brushing, styling — you risk breakage. Less manipulation = less breakage = more length retained.' },
      ],
    },
    keyGrowthIngredients: [
      { ingredient: 'Jamaican Black Castor Oil (JBCO)', why: 'Ricinoleic acid is a hydroxyl fatty acid that has mild prostaglandin-like activity, which may mildly stimulate follicle activity. More practically: JBCO coats hair strands, reducing friction and breakage. It also penetrates slightly more than regular castor oil due to the alkaline environment from roasted castor beans.', how: 'Apply to scalp in sections. Massage for 5-10 min. Leave in. Can mix with a lighter carrier oil (jojoba) for easier application.' },
      { ingredient: 'Black Seed Oil (Nigella Sativa)', why: 'Thymoquinone in black seed oil has anti-inflammatory properties that may reduce scalp inflammation that impairs follicle function. Anecdotal reports of hair growth improvement are common; limited but emerging scientific study.', how: '3-4 drops massaged into scalp 2-3x per week.' },
      { ingredient: 'Moringa Oil', why: 'Behenic acid in moringa oil is a large fatty acid particularly effective at sealing the hair shaft and reducing moisture loss (TEWL from hair) — reducing breakage.', how: 'Apply as a sealant after water-based leave-in product.' },
    ],
    growthDietFoods: [
      { food: 'Egusi Melon Seeds', nutrients: 'Zinc and protein — the two most critical nutrients for hair follicle function. Zinc deficiency causes hair shedding (telogen effluvium).' },
      { food: 'Chicken (Ofe Onugbu, Egusi Soup)', nutrients: 'Complete protein for keratin synthesis. Biotin from the chicken. Iron.' },
      { food: 'Moringa Leaves', nutrients: 'Iron (twice the iron of spinach), zinc, vitamins A and C for collagen synthesis around follicles.' },
      { food: 'Groundnuts (Peanuts)', nutrients: 'Biotin, protein, niacin. Traditional West African snack that happens to be excellent for hair.' },
    ],
    protectiveStylesForGrowth: {
      description: 'Protective styles minimize manipulation and breakage while growing hair out.',
      topStyles: [
        { style: 'Box Braids', retention: 'Can be kept in 6-8 weeks. Excellent length retention. Protect ends.', caution: 'Must not be too tight at roots (traction alopecia risk). Keep scalp clean and moisturized under braids.' },
        { style: 'Twists (Two-strand)', retention: 'Medium protection. Good for transitioning or stretched growth.', benefit: 'Less tension on scalp than braids. Defined curl pattern when unraveled.' },
        { style: 'Cornrows', retention: 'Good protection. Keep ends tucked.', caution: 'Traction risk if too tight. Should not cause pain or bumps at hairline.' },
        { style: 'Wigs (with own hair braided underneath)', retention: 'Excellent protection. No manipulation of own hair at all.', benefit: 'Complete versatility while protecting natural hair.' },
      ],
    },
  },

  'south-asian': {
    communityId: 'south-asian',
    communityName: 'South Asian',
    hairGrowthProfile: {
      description: 'South Asian hair is often type 1C-2B (straight to wavy), with some variation including type 3A in some South Indian and Sri Lankan communities. The hair shaft tends to be thick and dense. This hair type is generally more resistant to breakage than type 4, but has its own growth challenges including high density that can lead to buildup, oiliness at the roots, and damage from excessive heat styling.',
      growthRate: 'Growth rate varies from person to person; length retention matters more than speed.',
      density: 'South Asian hair is often very dense — many follicles per square centimeter. This can cause the hair to appear fuller but also means the scalp microbiome is more affected by sebum accumulation.',
    },
    ayurvedicHairGrowth: {
      title: 'Ayurvedic Approach to Hair Growth',
      philosophy: 'In Ayurveda, healthy hair growth is a function of balanced doshas, strong agni (digestive fire), and adequate ojas (vital essence). Hair is considered a byproduct (upadhatu) of the bone tissue (asthi dhatu) — meaning bone health and hair health are connected. The practice of daily scalp oiling (shiro abhyanga) directly addresses the vata imbalance that causes hair loss and poor growth.',
      practices: [
        { practice: 'Shiro Abhyanga (Head Oil Massage)', method: 'Warm sesame or coconut oil. Part hair in sections. Apply to scalp. Massage gently in circular motions for 15-20 minutes. Leave for minimum 30 minutes (ideally overnight). Wash out.', frequency: '1-3 times per week', benefit: 'Increases circulation (demonstrated benefit), nourishes the scalp, reduces vata aggravation that Ayurveda links to hair loss.' },
        { practice: 'Bhringraj (Eclipta prostrata) Oil', method: 'Oil made by simmering bhringraj herb in sesame or coconut oil. Apply as scalp treatment.' },
        { practice: 'Amla (Indian Gooseberry) Hair Treatment', method: 'Amla oil or fresh amla paste applied to hair.', why: 'Amla is the highest plant source of vitamin C. Antioxidant protection for follicles. Contains tannins that may support hair shaft integrity.' },
      ],
      herbs: [
        { herb: 'Bhringraj', sanskrit: 'Raja of Hair / King of Hair', benefit: 'Traditional hair growth herb. Contains wedelolactone which may have activity on hair follicles.', use: 'Oil infusion for scalp' },
        { herb: 'Brahmi (Bacopa monnieri)', benefit: 'Bacoside compounds are neuroprotective and may calm the nervous system — stress reduction supports hair growth.', use: 'Brahmi oil for scalp, or supplement' },
        { herb: 'Amla (Phyllanthus emblica)', benefit: 'Antioxidant, vitamin C rich, traditional hair growth and darkening herb', use: 'Amla powder hair mask, amla oil' },
        { herb: 'Hibiscus (Hibiscus rosa-sinensis)', benefit: 'Contains amino acids and vitamins. Traditional Indian hair growth herb. May inhibit 5-alpha reductase (the enzyme that causes DHT-related hair loss).', use: 'Hibiscus flower and leaf oil or paste applied to scalp' },
        { herb: 'Neem (Azadirachta indica)', benefit: 'Antibacterial and antifungal — addresses scalp conditions (dandruff, seborrheic dermatitis) that impair hair growth', use: 'Neem oil in carrier oil, neem powder paste' },
      ],
    },
    growthDiet: [
      { food: 'Dals and Lentils', nutrients: 'Complete amino acids when combined with rice. Plant iron. B vitamins including biotin.' },
      { food: 'Sesame Seeds (Til)', nutrients: 'Sesamin antioxidant, zinc, omega-6 fatty acids for hair shaft integrity' },
      { food: 'Amla (as food)', nutrients: 'Highest plant vitamin C — essential for collagen production in hair follicle papilla' },
    ],
  },

  'caribbean': {
    communityId: 'caribbean',
    communityName: 'Caribbean',
    hairGrowthProfile: {
      description: 'Caribbean hair spans an extraordinary range due to the region\'s genetic diversity. Afro-Caribbean hair (type 4, common in Jamaica, Trinidad, Barbados, etc.) shares characteristics with West African hair — high shrinkage, breakage risk, and need for moisture and protective styling. Indo-Caribbean hair (from South Asian indentured labor heritage, common in Trinidad, Guyana) tends to be type 1C-2B. Mixed heritage Caribbean hair spans 2C-3C in many communities. The unifying challenge is the tropical environment — salt water, sun, and humidity create hair challenges unique to island life.',
    },
    caribbeanGrowthWisdom: [
      { practice: 'Castor Oil (Caribbean Black Castor)', tradition: 'Jamaican Black Castor Oil became globally famous partly because of Caribbean women\'s success with it. Castor oil applied to the scalp and hair has been a Caribbean beauty staple for generations.', how: 'Apply JBCO or regular castor oil to scalp and edges. Massage in. Leave minimum overnight. Wash out.' },
      { practice: 'Sea Moss for Internal Hair Health', tradition: 'Sea moss (Irish moss, Chondrus crispus) is eaten throughout the Caribbean as a health tonic.', why: 'Contains iodine (for thyroid function, which regulates hair growth) and zinc. Thyroid dysfunction is a leading cause of hair shedding.' },
      { practice: 'Coconut Oil Hair Treatment', tradition: 'Coconut oil is the universal Caribbean hair treatment — used before washing, as leave-in, as styling product.', science: 'Coconut oil uniquely can penetrate the hair shaft (due to lauric acid\'s low molecular weight). Reduces protein loss during washing. Pre-wash coconut oil treatment is one of the best-studied natural hair treatments.' },
      { practice: 'Avocado Deep Conditioner', tradition: 'Mashed ripe avocado as a hair mask is a traditional Caribbean beauty treatment.', science: 'Oleic acid in avocado coats the hair shaft. Natural protein from the avocado feeds the hair. Biotin content.' },
    ],
  },

  'arab': {
    communityId: 'arab',
    communityName: 'Arab Middle Eastern',
    hairGrowthProfile: {
      description: 'Arab hair often ranges from type 1C (straight) to type 3A (loose curly), with North African Arab communities showing more type 3 and some type 4 variation (particularly in communities with Sub-Saharan African ancestry). Gulf Arab women\'s hair tends to be type 1C-2A — straight to slightly wavy, dense, and thick. Hair length is deeply valued in Arab culture — the tradition of long, thick, glossy hair as a beauty ideal has driven sophisticated hair care traditions.',
    },
    arabHairGrowthTraditions: [
      { practice: 'Argan Oil as Hair Treatment', tradition: 'Moroccan Berber women have applied argan oil to their hair for centuries. Argan oil was their hair product before it became a global beauty industry ingredient.', how: 'Apply a small amount of pure argan oil to ends after washing. Can be used as a pre-wash scalp treatment.', science: 'Tocopherols in argan oil protect against oxidative damage to hair. Oleic acid coats the cuticle for smoothness and shine.' },
      { practice: 'Black Seed Oil (Habbatus Sauda) Scalp Treatment', tradition: 'The Prophet Mohammed (PBUH) said that black seed is a cure for every disease except death. Black seed oil has been used on scalp in the Arab world for centuries.',  how: 'Apply 2-4 drops to scalp sections. Massage. Leave 30 min to overnight. Wash out.' },
      { practice: 'Henna as Hair Treatment', tradition: 'Henna is used across the Arab world not just for coloring but as a conditioning treatment.', science: 'Lawsone (henna\'s active molecule) bonds to the keratin protein in hair, coating and strengthening the shaft. This temporarily adds thickness and reduces breakage.' },
      { practice: 'Olive Oil Hot Oil Treatment', how: 'Warm pure extra virgin olive oil. Apply to hair. Wrap in warm towel. Leave 30-60 min. Wash out.', why: 'Squalene in olive oil mimics the natural oils produced by sebaceous glands. Antioxidants protect hair from oxidative damage.' },
    ],
    growthFoods: [
      { food: 'Dates', nutrients: 'Pantothenic acid (B5) — directly supports hair follicle function. Iron. Zinc.' },
      { food: 'Pomegranate', nutrients: 'Punicalagins support collagen in hair follicle. Zinc. Iron.' },
      { food: 'Olive Oil (Internal)', nutrients: 'Squalene, polyphenols, vitamin E for systemic antioxidant protection of follicles' },
    ],
  },

  'latina': {
    communityId: 'latina',
    communityName: 'Latina',
    hairGrowthProfile: {
      description: 'Latina hair spans the full spectrum from straight (type 1, common in Mexican-Indigenous and Southern Cone communities) to tightly coiled (type 4, common in Afro-Latina communities). The most common Latina hair type is type 2C-3B — wavy to curly, with a tendency toward frizz and dryness. This diversity means growth protocols must be customized. What works for a Mexican woman with straight type 1B hair is completely different from what works for an Afro-Dominican woman with type 4B hair.',
    },
    latinaGrowthTraditions: [
      { practice: 'Rosemary (Romero)', tradition: 'Rosemary is used across Latin American cultures as a hair growth and darkening herb. Rosemary water rinses, rosemary oil, and rosemary in shampoo are all traditional practices.',  how: 'Steep fresh rosemary in boiling water. Cool. Use as a final rinse after shampooing. Or: apply diluted rosemary essential oil (2% in carrier oil) to scalp 2-3x per week.' },
      { practice: 'Coconut Oil', tradition: 'Universal Latin American hair treatment, particularly strong in tropical regions.', how: 'Pre-wash treatment: apply to dry hair 30 min before washing. Or: use as sealant after leave-in.' },
      { practice: 'Egg Mask', tradition: 'The egg hair mask is a grandmother\'s beauty secret across Latin America.', science: 'Eggs provide protein (including all essential amino acids for keratin synthesis) and biotin. Egg yolk specifically contains cholesterol and fat that coat and condition hair.', how: '2 eggs applied to dry hair. Leave 20-30 min. Rinse with cool water. Shampoo once to remove.' },
      { practice: 'Beer Rinse', tradition: 'Beer as a final hair rinse for shine and volume is a widely shared Latin American tradition.', why: 'Beer contains hops and malt that coat hair and add temporary body. The carbonation can flatten the cuticle, increasing shine.' },
    ],
    rosemaryOilProtocol: {
      title: 'The Rosemary Oil Growth Protocol — Backed by Science',
      
      how: 'Dilute rosemary essential oil in jojoba, coconut, or olive oil (1% to 2% — roughly 5-10 drops per 50ml carrier oil). Apply to scalp in sections. Massage gently. Leave for 30+ minutes (or overnight). Wash out. Repeat 2-3x per week.',
      timeline: 'Allow 4-6 months of consistent use before judging effectiveness — hair growth cycles are long.',
    },
  },

  'east-asian': {
    communityId: 'east-asian',
    communityName: 'East Asian',
    hairGrowthProfile: {
      description: 'East Asian hair is often type 1 (straight) and is among the thickest hair strands by diameter of any hair type. East Asian strands are generally thicker in diameter than other hair types, though there are fewer strands per square centimeter. This makes East Asian hair naturally strong and resistant to breakage, but also means it responds differently to chemicals and heat.',
    },
    eastAsianGrowthTraditions: [
      { practice: 'Rice Water Rinse', tradition: 'The Yao women of Huangluo, China (the "long hair village") are famous for hair that often reaches well over a metre in length. They credit fermented rice water for their extraordinary hair growth and retention.', science: 'Rice water contains inositol (a carbohydrate that can penetrate the hair shaft and repair damage from the inside out), amino acids, and antioxidants. Fermented rice water has slightly lower pH, which may help close the cuticle.', how: 'Soak rice in water 15-30 min (fresh water) or leave at room temperature 24-48 hours (fermented). Pour off the milky water. Apply to hair as a rinse after shampooing. Leave 5-20 min. Rinse with clean water.' },
      { practice: 'Camellia Oil (Tsubaki)', tradition: 'Camellia oil has been used for hair in Japan for centuries — particularly by geisha for the high-gloss black hair of traditional Japanese styling.', science: 'The oil is mostly oleic acid, a fatty acid that penetrates hair well. Creates extraordinary shine and smoothness on straight hair.' },
      { practice: 'Ginseng Scalp Treatment', tradition: 'Ginseng is used in both Korean and Chinese traditional medicine for hair growth.',  how: 'Ginseng-infused tonic massaged into scalp.' },
    ],
    japaneseHairCare: {
      title: 'Japanese Hair Care Philosophy',
      philosophy: 'Japanese hair care prioritizes scalp health as the foundation of hair growth — "scalp care is the new skincare." The scalp is treated with the same attention as facial skin: cleansed gently, toned, treated, and protected.',
      practices: ['Scalp massager (silicone scalp brush) used during shampooing', 'Scalp serum applied to the parted scalp', 'Double-shampooing to fully remove buildup', 'Hair oil (camellia, argan) as finishing treatment'],
    },
  },

  'east-african': {
    communityId: 'east-african',
    communityName: 'East African',
    hairGrowthProfile: {
      description: 'East African hair is predominantly type 4 (coily), similar to West African hair in growth challenges. However, there is notable variety: the horn of Africa has a distinct hair texture in Somali and Ethiopian Cushitic communities that is often type 4A-4B with a unique texture and coil pattern. Nilotic communities (South Sudan, parts of Kenya and Uganda) have extremely tight type 4C coils. The region has its own traditional hair care practices developed over millennia.',
    },
    growthTraditions: [
      { practice: 'Frankincense Oil Scalp Treatment',  science: 'Boswellic acids are anti-inflammatory — reducing scalp inflammation that can impair follicle function. Some evidence for wound healing and skin repair that may extend to follicle health.', how: 'Dilute 1-2% frankincense essential oil in jojoba. Massage into scalp. Leave 30 min to overnight.' },
      { practice: 'Camel Milk for Hair', tradition: 'Camel milk is used internally and topically in Somalia and other East African communities for skin and hair.', science: 'Camel milk contains vitamins B1, B2, C, and lactoferrin (anti-inflammatory protein). May contribute to scalp health when applied topically.' },
      { practice: 'Ethiopian Honey Treatment', tradition: 'Ethiopia produces some of the world\'s best honey (from the extraordinary botanical diversity of Ethiopian forests). Used both as food and as hair/scalp treatment.', how: 'Apply raw honey to scalp and hair. Leave 20-30 min. Rinse. Can mix with a few drops of oil for easier application.' },
    ],
  },

  'south-african': {
    communityId: 'south-african',
    communityName: 'South African',
    hairGrowthProfile: {
      description: 'South African hair reflects the nation\'s diversity. Bantu-origin South African hair is type 4 — with many of the same growth retention challenges as West African type 4 hair. Cape Malay and Indian South African hair spans 1C-3A. The natural hair movement came to South Africa with strong force, and many Black South African women are reclaiming type 4 hair care traditions that had been suppressed by colonialism\'s beauty standards.',
    },
    growthTraditions: [
      { practice: 'Rooibos Rinse', tradition: 'Brewed rooibos tea used as a final hair rinse after washing.', science: 'Aspalathin in rooibos has antioxidant properties that may protect scalp and follicle from oxidative damage. The rinse adds minerals from the tea to the hair.' },
      { practice: 'Marula Oil Treatment', tradition: 'Marula oil from the marula fruit tree (indigenous to Southern Africa) has been used by South African women for centuries.', science: 'Extremely high oleic acid content coats and protects the hair shaft. Procyanidin antioxidants protect from oxidative damage. One of the most absorbing natural oils (doesn\'t sit heavy on hair).' },
      { practice: 'Buchu-Infused Oil', tradition: 'Buchu (Agathosma betulina), a South African endemic plant, has been used by the Khoikhoi and San peoples for its medicinal and cosmetic properties.', science: 'Contains volatile oils including pulegone and isopulegone with antimicrobial and anti-inflammatory properties that may benefit scalp health.' },
    ],
  },

  'black-american': {
    communityId: 'black-american',
    communityName: 'Black American',
    
    naturalHairMovementGrowth: {
      description: 'The modern natural hair movement (approximately 2010s onward, catalyzed by YouTube, Instagram, and a cultural shift) drove an explosion of knowledge about type 4 hair growth, moisture retention, and protective styling that has directly contributed to Black American women achieving lengths previously thought impossible.',
      keyDiscoveries: ['The LOC method (Liquid-Oil-Cream) for moisture retention', 'Protective styling (braids, twists, wigs) for length retention', 'Low porosity vs. high porosity hair types and their different needs', 'The Curly Girl Method adapted for type 4', 'Gentle detangling techniques (fingers, wide-tooth comb) instead of brush'],
    },
    growthIngredients: [
      { ingredient: 'JBCO (Jamaican Black Castor Oil)', why: 'The #1 hair growth product in Black American natural hair culture. Ricinoleic acid. Scalp massage medium. Edge growth.', how: 'Apply to edges and scalp. Massage 5 min daily or every other day. Protective style edges afterward.' },
      { ingredient: 'Peppermint Oil',  how: '3-5 drops in 1 tbsp carrier oil. Massage into scalp. Leave 30 min. Rinse. Note: can be irritating — test first.' },
      { ingredient: 'Rosemary Oil', science: 'One small 2015 trial found rosemary oil comparable to 2% minoxidil for pattern hair loss after six months; more research is needed.', how: '2% dilution in carrier oil. Scalp massage. Leave overnight.' },
      { ingredient: 'Biotin (Internal)', science: 'Biotin deficiency causes hair loss. Most people aren\'t deficient — biotin supplementation helps if deficient, unclear benefit if not. But widely used.', note: 'Can cause acne in some people. Can interfere with lab tests (tell your doctor if taking biotin before bloodwork).' },
    ],
    lengthRetentionFocus: {
      title: 'The Length Retention Formula',
      description: 'Black American natural hair growth wisdom has identified that length retention = moisture + protein balance + protective styling + minimal manipulation.',
      moisture: 'Water is the ultimate moisturizer. Apply water-based leave-in first. Seal with oil (emollient). Seal with cream (occludent). Repeat frequently.',
      protein: 'Type 4 hair needs protein treatments to maintain strength. Too much protein = brittle. Too little = mushy and weak. Do a protein treatment when hair feels weak/stretchy. Follow with a deep moisture treatment.',
      protectiveStyle: 'Keep ends protected at all times. Do not manipulate hair daily. Style once and leave.',
      schedule: 'Many successful length retention natural hair journeys follow a "low manipulation" schedule: wash weekly or biweekly, protective style between washes, minimal heat (heat once a month maximum).',
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL HAIR GROWTH SCIENCE
// ─────────────────────────────────────────────────────────────────────────────

export const UNIVERSAL_HAIR_GROWTH = {
  hairGrowthCycle: {
    description: 'Every hair on your head is independently cycling through a growth pattern. Understanding this cycle explains both why hair growth seems slow and why treatments take months to work.',
    phases: [
      { phase: 'Anagen (Growth)', duration: '2-7 years',  description: 'The active growth phase. Hair cells divide rapidly in the follicle bulb. The length of your anagen phase determines your maximum hair length potential. This is genetic.' },
      { phase: 'Catagen (Transition)', duration: '2-3 weeks',  description: 'Growth stops. The follicle shrinks. The hair separates from the blood supply.' },
      { phase: 'Telogen (Resting)', duration: '3-4 months',  description: 'The hair rests. A new anagen hair begins forming beneath it. At the end of telogen, the old hair sheds.' },
      { phase: 'Exogen (Shedding)', duration: 'Part of telogen', description: 'The old hair falls. Normally 50-100 hairs per day is healthy shedding.' },
    ],
    implication: 'If you start a hair growth treatment today, you won\'t see results for 3-4 months — the time for the follicle to complete a telogen phase and begin a new anagen cycle.',
  },

  hairGrowthNutrients: {
    critical: [
      { nutrient: 'Iron', role: 'Ferritin (iron storage protein) is essential for hair follicle matrix cell division. Low iron is one of the most common causes of hair shedding in women of reproductive age.' },
      { nutrient: 'Zinc', role: 'Required for DNA and RNA polymerase activity in rapidly dividing hair follicle cells. Zinc deficiency causes diffuse hair shedding.' },
      { nutrient: 'Protein', role: 'Hair is 95% keratin protein. Inadequate dietary protein directly impairs hair growth.', requirement: '0.8g per kg body weight minimum; higher if physically active' },
      { nutrient: 'Biotin (B7)', role: 'Required for keratin synthesis. Deficiency causes hair loss and nail brittleness. Deficiency is uncommon except in raw egg white consumption (avidin blocks biotin absorption) or inflammatory bowel disease.' },
      { nutrient: 'Vitamin D', role: 'Vitamin D receptors in hair follicles are required for normal follicle cycling. Deficiency (extremely common globally) is associated with hair loss.', testing: 'Get a 25-OH Vitamin D blood test if experiencing hair loss', target: '50-80 ng/mL is optimal for hair' },
    ],
  },

  hairLossTypes: {
    telogenEffluvium: { description: 'Diffuse shedding triggered by a stressor 2-4 months prior: stress, illness, crash dieting, surgery, giving birth, stopping birth control. The most common type of acute hair loss.', duration: 'Typically resolves within 6-12 months', treatment: 'Address the underlying trigger. Iron levels. Protein. Manage stress.' },
    alopeciaAreata: { description: 'Autoimmune condition causing patchy hair loss. The immune system attacks follicles.', treatment: 'Dermatologist treatment required: intralesional steroid injections, minoxidil, JAK inhibitors (newer treatment).' },
    androgenicAlopecia: { description: 'The most common type of hair loss. Genetically influenced sensitivity to DHT (dihydrotestosterone) causes follicle miniaturization.', treatment: 'Minoxidil (topical or oral), finasteride (males), spironolactone (females), rosemary oil as natural option.' },
    tractionAlopecia: { description: 'Hair loss at the hairline from repeated tension — tight ponytails, tight braids, tight weaves, extensions.', prevention: 'No-tension styles. No pain at scalp. Rotate styles. Give hair breaks from extensions.', treatment: 'Remove the source of tension. Hair may regrow if follicles not yet scarred.' },
  },

  topGrowthIngredients: [
    { ingredient: 'Rosemary Oil (2%)',  how: 'Dilute to 2% in carrier oil. Scalp massage 2-3x weekly.' },
    { ingredient: 'Minoxidil (2% or 5%)',  note: 'Works only while using — hair loss returns if stopped. 2% for women, 5% (or oral low-dose) for men.' },
    { ingredient: 'Peppermint Oil',  how: 'Dilute to 3% in carrier oil. Scalp massage.' },
    { ingredient: 'Castor Oil (JBCO)',  how: 'Scalp massage and hair application. Mix with lighter oils for manageability.' },
    { ingredient: 'Scalp Massage (Tool or Hands)',  how: '4-10 minutes of scalp massage daily, with or without oil.' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export function getHairGrowthGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_HAIR_GROWTH_GUIDES['west-african'],
    'south-asian': ETHNIC_HAIR_GROWTH_GUIDES['south-asian'],
    'caribbean': ETHNIC_HAIR_GROWTH_GUIDES['caribbean'],
    'arab': ETHNIC_HAIR_GROWTH_GUIDES['arab'],
    'latina': ETHNIC_HAIR_GROWTH_GUIDES['latina'],
    'east-asian': ETHNIC_HAIR_GROWTH_GUIDES['east-asian'],
    'east-african': ETHNIC_HAIR_GROWTH_GUIDES['east-african'],
    'south-african': ETHNIC_HAIR_GROWTH_GUIDES['south-african'],
    'black-american': ETHNIC_HAIR_GROWTH_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

