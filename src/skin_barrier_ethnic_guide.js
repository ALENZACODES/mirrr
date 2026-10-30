/**
 * MIRRR — Skin Barrier Multicultural Guide
 * The science and cultural context of skin barrier function across
 * all 9 ethnic communities. The skin barrier is the foundational
 * layer that determines moisture retention, sensitivity, and resilience.
 * Understanding barrier function in the context of skin tone, heritage,
 * and traditional practices is essential for effective skincare.
 */

export const ETHNIC_SKIN_BARRIER_GUIDES = {
  'west-african': {
    communityId: 'west-african',
    communityName: 'West African',
    barrierProfile: {
      description: 'West African skin (and broadly, skin with high melanin content) has a skin barrier with distinct characteristics that are often misunderstood by mainstream dermatology. The assumption that "Black skin is tougher" is a harmful myth. Measurements of water loss through Black skin disagree from study to study, and ashy, dry-looking skin is common, so the barrier still needs consistent and thoughtful care.',
      
      sebumProduction: 'Sebum production varies by individual, but higher sebum in the T-zone with dryness on the cheeks is a common pattern in West African skin types.',
      uniqueStrengths: 'Higher melanin content provides inherent UV protection (though NOT sufficient — SPF is still required). Greater skin thickness in some studies may offer structural resilience.',
    },
    commonBarrierChallenges: [
      {
        challenge: 'Ashy Skin',
        whatHappens: 'When the skin barrier is compromised or dehydrated, surface dead skin cells become visible as a whitish or grayish cast on dark skin. This "ashing" is essentially barrier compromise made visible.',
        solution: 'Humectant (hyaluronic acid, glycerin) + emollient (shea butter, natural oils) + occludent (sealing the moisture in) — the moisturization trifecta.',
        traditionalFix: 'Shea butter has been the West African answer to ashy skin for centuries. Applied to damp skin, it seals moisture and prevents TEWL.',
      },
      {
        challenge: 'Post-Inflammatory Hyperpigmentation (PIH)',
        whatHappens: 'Any breach of the skin barrier — a pimple, a cut, friction — triggers melanin production as part of the inflammatory response. In highly melanated skin, this inflammation response produces more melanin, leading to dark spots that can take months to years to fade.',
        solution: 'Protecting the barrier (preventing PIH) is far more effective than treating it. SPF, gentle handling, anti-inflammatory products.',
        traditionalApproach: 'Shea butter (anti-inflammatory), turmeric, and black soap (gentle cleansing) have all been used in West African skincare to reduce PIH occurrence.',
      },
      {
        challenge: 'Contact Dermatitis and Fragrance Sensitivity',
        whatHappens: 'The popularity of strongly fragranced body products in West African beauty culture can compromise the barrier through fragrance-induced contact dermatitis.',
        solution: 'Fragrance-free or minimal fragrance products for sensitive or compromised skin.',
      },
    ],
    barrierFoods: [
      { food: 'Palm Oil (Red, Unrefined)', benefit: 'Tocotrienols (a superior form of vitamin E), carotenoids. Fat-soluble antioxidants that support barrier function from the inside.' },
      { food: 'Egusi Melon Seeds', benefit: 'Zinc and omega-6 fatty acids critical for barrier integrity.' },
      { food: 'Moringa', benefit: 'Contains zinc, vitamin A, and multiple barrier-supporting nutrients. The moringa oil (from seeds) applied topically also directly supports the barrier.' },
    ],
    traditionalBarrierPractices: [
      { practice: 'Shea Butter', how: 'Applied to damp skin after bathing. The key is applying to damp skin — this traps existing moisture rather than just sitting on dry skin surface.', why: 'Unrefined shea butter contains triterpene alcohols (lupeol, α-amyrin) with anti-inflammatory properties, plus oleic and stearic acid as emollients, and vitamins E and A.' },
      { practice: 'Black Soap Cleansing', how: 'Genuine African black soap (dudu osun) made from plantain ash, cocoa pod ash, shea butter, and palm kernel oil. pH-balanced, gentle, naturally antibacterial.', why: 'Maintains the skin\'s acid mantle better than harsh synthetic soaps. The natural alkalinity from ash is balanced by the shea butter and oils.' },
      { practice: 'Waterless Bathing with Oils (Historical)', how: 'In traditional West African contexts (especially in drier northern regions), the skin was sometimes oiled rather than water-washed, or oil was applied immediately after brief washing.', why: 'Prevents TEWL in dry climates. Maintains the barrier without the stripping effect of harsh soap and water bathing.' },
    ],
  },

  'south-asian': {
    communityId: 'south-asian',
    communityName: 'South Asian',
    barrierProfile: {
      description: 'South Asian skin spans Fitzpatrick Types III-V, with substantial variation between regions. South Indian and Sri Lankan skin tends toward deeper tones (Fitzpatrick IV-V); North Indian and Pakistani skin ranges from III-IV. Ayurveda provides a uniquely sophisticated framework for understanding skin barrier function through the doshic lens — identifying individual skin constitution and tailoring barrier care to the individual rather than the population.',
      doshicBarrier: {
        vata: 'Thin, dry, prone to premature aging and cracking. Weakest natural barrier. Requires the richest, most occlusive care.',
        pitta: 'Sensitive, prone to redness and inflammation. Easily irritated barrier that reacts to physical and chemical triggers.',
        kapha: 'Thick, oily, most resilient barrier. Prone to comedones (congestion) rather than dryness.',
      },
    },
    commonBarrierChallenges: [
      {
        challenge: 'Skin Sensitivity from Ayurvedic Pitta Types',
        whatHappens: 'Pitta-dominant skin has a reactive barrier that responds strongly to heat, friction, certain ingredients, and sun. Rosacea-like redness, contact dermatitis, and photo-sensitivity are common.',
        solution: 'Cooling products (aloe, rose water, neem), mineral sunscreen (less reactive than chemical filters), avoiding heat triggers.',
        ayurvedicApproach: 'Cooling diet (avoiding excess spicy and fermented foods). Coconut oil (cooling dosha). Brahmi and neem topically.',
      },
      {
        challenge: 'Post-Inflammatory Hyperpigmentation',
        whatHappens: 'Same mechanism as in other communities with melanin-rich skin — any barrier breach triggers excess melanin production.',
        solution: 'SPF. Gentle barrier repair. Azelaic acid (reducing melanin transfer). Vitamin C. Niacinamide.',
        ayurvedicApproach: 'Kumkumadi tailam (saffron-based Ayurvedic oil) for PIH treatment. Manjistha (Rubia cordifolia) for brightening.',
      },
    ],
    barrierPractices: [
      { practice: 'Ubtan (Turmeric-Based Scrub/Mask)', ingredients: 'Gram flour, turmeric, rose water, milk or yogurt', howItHelps: 'Lactic acid in dairy provides gentle exfoliation without barrier damage. Turmeric\'s curcumin is anti-inflammatory. Gram flour gently cleanses without stripping.' },
      { practice: 'Oil Cleansing (Tela Mardana Abhyanga to Face)', method: 'Apply oil to dry face. Massage. Remove with warm water or a warm cloth.', whyItWorks: 'Oil dissolves excess sebum and residue without disrupting the acid mantle. Retains natural moisture.' },
      { practice: 'Rosewater Toning', method: 'Spritz or apply with cotton pad after cleansing.', why: 'Rose water is slightly acidic (pH 5-6), helping restore the skin\'s acid mantle after cleansing. Anti-inflammatory and hydrating.' },
      { practice: 'Sandalwood (Chandan) Paste', ingredients: 'Sandalwood powder + rose water', benefit: 'Anti-inflammatory, cooling (for pitta skin), gentle on the barrier. Used for thousands of years in Indian beauty.' },
    ],
    barrierFoods: [
      { food: 'Ghee', benefit: 'The Ayurvedic "skin from within" food. Butyrate (from fermentation in digestion of ghee) nourishes the gut lining — a healthy gut barrier supports a healthy skin barrier.' },
      { food: 'Turmeric', benefit: 'Curcumin reduces systemic inflammation that compromises the skin barrier.' },
      { food: 'Sesame Seeds', benefit: 'Sesamin is a potent antioxidant. Zinc for barrier enzyme activity. Omega-6 linoleic acid for ceramide synthesis.' },
    ],
  },

  'caribbean': {
    communityId: 'caribbean',
    communityName: 'Caribbean',
    barrierProfile: {
      description: 'Caribbean skin reflects the extraordinary genetic diversity of the region — a mixture of West African, Indigenous Taino and Arawak, European (Spanish, British, French, Dutch), South Asian (from the Indian indentureship period), and East Asian heritage. This creates significant variation in skin types and barrier characteristics. One thing is consistent: the Caribbean sun is exceptionally intense, making UV-induced barrier damage a universal concern.',
      solarBarrierDamage: 'The Caribbean receives among the highest UV radiation on Earth. Years of unprotected sun exposure cause photoaging, barrier disruption, DNA damage, and PIH — all of which are underaddressed due to the myth that dark skin doesn\'t need SPF.',
    },
    commonBarrierChallenges: [
      {
        challenge: 'UV-Induced Barrier Damage',
        whatHappens: 'UV radiation degrades ceramides in the skin barrier, reduces collagen and elastin, and triggers inflammatory responses that lead to both PIH and chronic skin barrier dysfunction.',
        solution: 'Daily mineral SPF 30+. Antioxidant serums (vitamin C, vitamin E, ferulic acid). Niacinamide for barrier repair and pigment regulation.',
        culturalBarrier: 'SPF use has historically been low in Caribbean communities due to the misbelief that darker skin doesn\'t burn or age from sun. This is a significant health message.',
      },
      {
        challenge: 'Humidity-Related Barrier Issues',
        whatHappens: 'High humidity (Caribbean average 70-90%) can actually compromise the barrier through mold exposure, sweat accumulation, and friction in skin folds. Tinea versicolor (fungal skin condition) is common.',
        solution: 'Lightweight, non-comedogenic moisturizers. Antifungal ingredients (neem, tea tree) for predisposed skin. Breathable fabrics.',
      },
    ],
    barrierPractices: [
      { practice: 'Coconut Oil Moisturization', how: 'Applied to damp skin. The lauric acid in coconut oil is both antimicrobial and emollient.', caveat: 'Comedogenic for some (rated 4/5). May cause breakouts in acne-prone individuals. Better for body than face in acne-prone skin.' },
      { practice: 'Aloe Vera (From the Plant)', how: 'Break a leaf from an aloe vera plant (or buy pure gel). Apply to skin.', why: 'Aloe contains polysaccharides that form a protective film on skin, supporting barrier function. Anti-inflammatory. Hydrating.' },
      { practice: 'Sea Salt Baths', how: 'Add sea salt to a warm bath. Soak.', why: 'Magnesium in sea salt can calm inflamed skin. The mineral soak supports barrier function. A traditional Caribbean healing bath.' },
      { practice: 'Papaya Enzyme Treatment', how: 'Fresh papaya pulp applied to skin for 10-15 minutes, rinsed off.', why: 'Papain enzyme gently removes dead skin cells (promoting barrier renewal) without abrasive damage. Vitamin A content supports barrier integrity.' },
    ],
    barrierFoods: [
      { food: 'Coconut Water', benefit: 'Electrolytes for cellular hydration. Well-hydrated cells support barrier function.' },
      { food: 'Sea Moss', benefit: 'Its minerals provide multiple cofactors for barrier enzyme activity, including zinc and magnesium.' },
      { food: 'Papaya', benefit: 'Beta-carotene (pro-vitamin A) for barrier gene expression. Vitamin C for collagen.' },
    ],
  },

  'arab': {
    communityId: 'arab',
    communityName: 'Arab Middle Eastern',
    barrierProfile: {
      description: 'Arab skin typically spans Fitzpatrick Types III-V, with significant variation by geography — Lebanese and Syrian women may be Type III, while Saudi, Yemeni, and Egyptian skin can range to Type V. Desert climates (Gulf, North Africa) create unique barrier challenges: extreme heat, low humidity, and wind strip the barrier aggressively, while the simultaneously harsh UV index causes photobarrier damage. The Arab skincare tradition — hammam, ghassoul clay, argan oil — evolved precisely to address these desert climate challenges.',
    },
    desertBarrierChallenges: [
      {
        challenge: 'Low-Humidity Barrier Dehydration',
        description: 'In Gulf countries, humidity can drop to 10-20% (air-conditioned indoors even drier). The skin loses water rapidly through TEWL.',
        solution: 'Humectant + emollient + occludent layering. Rose water (humectant), argan oil (emollient), shea or beeswax (occludent).',
        traditionalSolution: 'Argan oil has been used in Morocco for 4000 years for this reason. It is the perfect emollient for dry climates — high oleic acid and vitamin E, rapidly absorbed.',
      },
      {
        challenge: 'UV-Induced Pigmentation',
        description: 'High UV index across the Arab world combined with higher melanin content in skin predisposes to significant PIH and melasma.',
        solution: 'SPF 50+ (mineral preferred for photosensitive skin). Vitamin C. Azelaic acid.',
      },
    ],
    barrierPractices: [
      { practice: 'Kessa Hammam Exfoliation', how: 'After 15-20 minutes of steam, vigorously scrub with a kessa (rough glove) to remove dead skin.', why: 'Removes the thick build-up of dead cells that impede barrier renewal. Promotes cellular turnover. Dramatic visible improvement in skin texture.', caution: 'Do not kessa more than weekly. The abrasiveness can damage a compromised barrier if overdone.' },
      { practice: 'Ghassoul (Rhassoul) Clay', how: 'Mix ghassoul powder with rose water into a paste. Apply to face. Leave 5-10 minutes. Rinse.', why: 'Rhassoul clay is particularly high in silica and magnesium. Adsorbs excess oil and impurities without stripping the barrier\'s natural lipids.' },
      { practice: 'Argan Oil Finishing', how: 'After cleansing and toning, apply 3-4 drops of pure argan oil to the face while slightly damp.', why: 'Oleic acid in argan oil mimics the skin\'s natural sebum. Vitamin E protects against oxidative damage. Phenols in argan oil are anti-inflammatory.' },
      { practice: 'Rose Water (Ma\'al Wurdud)', how: 'Spritz or wipe with cotton pad at any point in the routine — as toner, as midday refresh.', why: 'Rose water pH (5-6) matches skin\'s acid mantle, helping restore it after cleansing. Anti-inflammatory (contains rose polyphenols). Hydrating.' },
    ],
    barrierFoods: [
      { food: 'Olive Oil', benefit: 'Oleocanthal in olive oil is a potent anti-inflammatory (acts like ibuprofen). Polyphenols protect skin from oxidative damage. Internal and topical use.' },
      { food: 'Pomegranate', benefit: 'Punicalagins — unique antioxidants that stimulate collagen synthesis and protect skin from UV-induced damage.' },
      { food: 'Dates', benefit: 'Pantothenic acid (vitamin B5) — critical for barrier repair and ceramide synthesis.' },
    ],
  },

  'latina': {
    communityId: 'latina',
    communityName: 'Latina',
    barrierProfile: {
      description: 'Latina skin spans the full Fitzpatrick spectrum — from Type I-II in lighter-skinned Southern Cone communities to Type V-VI in darker-skinned Afro-Latina and Indigenous communities. The unifying beauty concern across this spectrum is the skin barrier\'s relationship with sun exposure — Latin America has high UV index across most of the continent, and melasma (the "mask of pregnancy," but also related to sun exposure, heat, and genetic predisposition) is a disproportionate concern for Latinas.',
      melasmaVulnerability: 'Latinas have one of the highest rates of melasma of any ethnic group. The combination of genetic predisposition (multiple ethnic heritages), high UV exposure, and hormonal factors (pregnancy, birth control) creates significant melasma risk.',
    },
    commonBarrierChallenges: [
      {
        challenge: 'Melasma',
        whatHappens: 'Melasma is driven by UV exposure triggering excess melanin production in genetically predisposed skin. It is exacerbated by heat, hormonal factors, and inflammation.',
        solution: 'SPF 50+ is the most important intervention. Tinted mineral sunscreen (which reflects both UV and visible light — important for melasma, which visible light can also trigger). Vitamin C, azelaic acid, niacinamide.',
      },
      {
        challenge: 'Oiliness and Congestion in Humid Climates',
        whatHappens: 'Many Latin American climates are humid and warm, which promotes sebum production. A barrier compromised by excess oil and inadequate cleansing leads to congestion.',
        solution: 'Proper cleansing (micellar water or gentle cleanser). Niacinamide for sebum regulation. Non-comedogenic moisturizers.',
      },
    ],
    barrierPractices: [
      { practice: 'Nopal (Cactus) Gel Mask', how: 'Apply fresh nopal gel or a nopal-based product to the face. Leave 15-20 minutes. Rinse.', why: 'Nopal cactus contains mucilage (a natural polysaccharide) that forms a moisture-retaining film on skin. Anti-inflammatory betacyanins. Supports barrier hydration without greasiness.' },
      { practice: 'Avocado Face Mask', how: 'Mash ripe avocado. Apply to face. Leave 15-20 minutes. Rinse.', why: 'Oleic acid in avocado is deeply emollient. Glutathione for skin brightening. Vitamin E for antioxidant protection. A natural barrier support treatment.' },
      { practice: 'Aloe Vera from the Garden', how: 'Fresh aloe gel applied to skin after sun exposure or as a daily moisturizer.', why: 'Aloe\'s polysaccharides form a protective film. Anti-inflammatory for reactive skin. Hydrating without being heavy.' },
      { practice: 'Agua de Rosas (Rose Water)', how: 'Used as a toner, facial spray, or mixed into face masks.', why: 'pH-balancing, anti-inflammatory, hydrating. A traditional Latina beauty staple for generations.' },
    ],
    barrierFoods: [
      { food: 'Chia Seeds', benefit: 'Omega-3 ALA (anti-inflammatory) and omega-6 linoleic acid (ceramide precursor). Barrier support from within.' },
      { food: 'Avocado', benefit: 'Glutathione (the "master antioxidant") — protects skin cells from oxidative damage. Oleic acid for cellular membrane integrity.' },
      { food: 'Hibiscus (Jamaica)', benefit: 'Anthocyanins protect against UV-induced barrier damage. Vitamin C for collagen. Anti-inflammatory.' },
    ],
  },

  'east-asian': {
    communityId: 'east-asian',
    communityName: 'East Asian',
    barrierProfile: {
      description: 'East Asian skin has been the most extensively studied in terms of barrier function, driven by the global influence of Korean beauty (K-beauty) and Japanese skincare on dermatological research and consumer culture. East Asian skin (typically Fitzpatrick Types II-IV) has some distinct barrier characteristics: a tighter stratum corneum (fewer corneocytes per unit), which can make it more resistant to certain types of damage but also potentially more reactive to harsh ingredients. The K-beauty revolution is fundamentally a barrier-first philosophy.',
      kBeautyBarrierPhilosophy: '"Skip-care" and "glass skin" — both K-beauty concepts — are ultimately about barrier health. Glass skin (the luminous, almost translucent glow) is achieved through consistent barrier support, not heavy makeup. A healthy, well-hydrated barrier reflects light evenly and appears radiant.',
    },
    barrierPractices: [
      { practice: 'Double Cleansing', step1: 'Oil cleanser (removes sunscreen, makeup, sebum)', step2: 'Water-based cleanser (removes remaining residue without over-stripping)', why: 'Single cleansing often requires more aggressive surfactants that disrupt the barrier. Double cleansing gets the skin clean with gentler products, preserving barrier integrity.' },
      { practice: 'Essence Application (7-Skin Method)', how: 'Apply 7 thin layers of toner/essence, allowing each to absorb before the next.', why: 'Multiple thin layers of hydration are more effective than one thick layer. Essentially teaches the barrier to hold moisture. The 7-skin method is the ultimate barrier hydration technique.' },
      { practice: 'Fermented Ingredients', products: 'Fermented rice water (sake), fermented snail mucin, fermented soy (galactomyces ferment filtrate)', why: 'Fermentation breaks down ingredients into smaller molecules that penetrate the barrier more effectively. Fermented ingredients also naturally produce compounds (lactobacillus ferment lysate, etc.) that are barrier-supportive.' },
      { practice: 'Sheet Masks', how: 'Apply sheet mask saturated in essence to face. Leave 15-20 minutes.', why: 'The occlusive sheet forces deep ingredient penetration. The liquid prevents evaporation during treatment. Delivers a concentrated dose of barrier-supporting humectants and antioxidants.' },
      { practice: 'Snail Mucin Serum', why: 'Snail secretion filtrate contains glycoproteins, hyaluronic acid, glycolic acid, and copper peptides — a comprehensive natural barrier repair complex. Some of the strongest evidence for any "unconventional" skincare ingredient.' },
    ],
    barrierFoods: [
      { food: 'Fermented Foods (Kimchi, Miso, Doenjang)', benefit: 'Probiotics that support the gut microbiome, which directly influences skin barrier function and skin inflammation through the gut-skin axis.' },
      { food: 'Green Tea', benefit: 'EGCG is one of the most UV-protective antioxidants known. Reduces UV-induced barrier damage when consumed regularly.' },
      { food: 'Seaweed (Miyeok, Wakame, Nori)', benefit: 'Fucoidan (a sulfated polysaccharide unique to seaweed) is a potent antioxidant and may protect against barrier-disrupting UV damage. Minerals: iodine, zinc, magnesium.' },
    ],
  },

  'east-african': {
    communityId: 'east-african',
    communityName: 'East African',
    barrierProfile: {
      description: 'East African skin spans Fitzpatrick Types IV-VI, with deep melanin-rich skin being the characteristic of the Horn of Africa\'s populations. The skin barrier in this context shares characteristics with other highly melanated skin: high UV protection but potential for lower ceramide content and TEWL. Unique to the region is the dry/hot climate of the Ethiopian highlands and Somali coast, which creates specific barrier challenges. The extraordinary botanical heritage of East Africa — frankincense, myrrh, Ethiopian herbs — provides powerful barrier-supporting ingredients.',
    },
    commonBarrierChallenges: [
      {
        challenge: 'Dry Climate Barrier Dehydration',
        description: 'The Ethiopian highlands, Somalia, and parts of Kenya and Tanzania have dry seasons with very low humidity. Combined with melanated skin\'s potential for TEWL, barrier dehydration is common.',
        solution: 'Rich emollients (frankincense-infused oil, shea butter, camel milk products). Humectants before emollients. Staying hydrated.',
      },
    ],
    barrierPractices: [
      { practice: 'Frankincense Oil as Facial Serum', how: 'Dilute frankincense essential oil (Boswellia carterii or Boswellia sacra) 1-2% in jojoba oil. Apply to face.', why: 'Boswellic acids are potent anti-inflammatories that directly reduce the inflammatory cascade that damages the barrier. Frankincense promotes skin cell regeneration. Terpenes in the oil have antimicrobial properties.' },
      { practice: 'Honey Application (Ethiopian Wild Honey)', how: 'Raw honey applied to the face for 10-15 minutes.', why: 'Raw honey contains glucuronic acid and gluconic acid (mild exfoliants), hydrogen peroxide (antimicrobial), and methylglyoxal (Manuka-like properties in some honeys). Natural humectant. Supports barrier repair.' },
      { practice: 'Camel Milk Mask or Cleanser', how: 'Fresh camel milk applied to the face or used as a gentle cleanser.', why: 'Camel milk contains immunoglobulins (natural antibodies), vitamin C, and small proteins. The natural lactic acid provides gentle exfoliation. Growing evidence base for skin benefits.' },
    ],
    barrierFoods: [
      { food: 'Teff (Injera)', benefit: 'Iron prevents anemia-related skin pallor. Calcium and zinc support barrier enzyme activity.' },
      { food: 'Camel Milk', benefit: 'Vitamin C (surprising in an animal product), immunoglobulins, lactoferrin (anti-inflammatory). Both consumed and applied topically.' },
      { food: 'Frankincense (Consumed as Resin)', benefit: 'Boswellic acids internally as anti-inflammatory supplement. Emerging evidence for systemic anti-inflammatory benefit.' },
    ],
  },

  'south-african': {
    communityId: 'south-african',
    communityName: 'South African',
    
    uniqueBarrierAssets: {
      
      plants: [
        { plant: 'Rooibos (Aspalathus linearis)', mechanism: 'Aspalathin — a unique dihydrochalcone antioxidant found only in rooibos — has been shown to reduce UV-induced barrier damage. Zinc in rooibos supports barrier enzyme activity.', use: 'Rooibos toner (cooled tea). Rooibos-infused skincare products. Consumed as tea.' },
        { plant: 'Aloe Ferox (Cape Aloe)', mechanism: 'Higher polysaccharide content than aloe vera. More potent barrier support, healing, and anti-inflammatory action.', use: 'Fresh aloe ferox gel applied to skin. Aloe ferox-based skincare products.' },
        { plant: 'Marula Oil (Sclerocarya birrea)',  use: 'Applied as a facial oil or body oil on damp skin. Blended into DIY skincare.' },
        { plant: 'Kalahari Melon Seed Oil', mechanism: 'Rich in linoleic acid (omega-6) — a critical fatty acid for ceramide synthesis. Barriers low in ceramides benefit particularly from linoleic acid supplementation.', use: 'Facial oil. Included in South African natural skincare formulations.' },
      ],
    },
    barrierPractices: [
      { practice: 'Marula Oil Occlusion', how: 'Apply 3-5 drops of pure cold-pressed marula oil to damp skin. The oil seals in moisture.', why: 'Oleic acid in marula mimics natural sebum and is particularly effective at restoring barrier integrity in dry, compromised skin.' },
      { practice: 'Rooibos Toner', how: 'Brew strong rooibos tea. Let cool. Transfer to a spray bottle. Spritz on face after cleansing.', why: 'Aspalathin reduces barrier-damaging oxidative stress. The tea\'s natural pH (5-6) helps restore the acid mantle.' },
      { practice: 'Aloe Ferox Gel Application', how: 'Pure aloe ferox gel applied to skin after cleansing, before oil or cream.', why: 'The polysaccharides form a protective film, draw in moisture, and reduce inflammation.' },
    ],
    barrierFoods: [
      { food: 'Marula Fruit', benefit: 'Vitamin C content 4x oranges — for collagen synthesis. Antioxidant protection.' },
      { food: 'Imifino (Wild Greens)', benefit: 'Highly nutritious indigenous greens — beta-carotene, vitamin C, iron — supporting barrier from within.' },
      { food: 'Rooibos Tea', benefit: 'Aspalathin and nothofagin antioxidants — shown to reduce UV-induced oxidative stress in skin cells.' },
    ],
  },

  'black-american': {
    communityId: 'black-american',
    communityName: 'Black American',
    barrierProfile: {
      description: 'Black American skin (typically Fitzpatrick IV-VI) reflects the genetic diversity of West African, Central African, and other ancestries, combined with the historical and contemporary context of American life. The skin barrier in this community is often managed with a complex mix of traditional wisdom (grandmothers\' Vaseline-based approaches), modern natural beauty movement practices, and mainstream dermatology. There are unique considerations: the ongoing myth that "Black skin doesn\'t need SPF," the disproportionate representation in dermatological research, and the cultural shift toward natural and clean beauty within the Black community.',
    },
    commonBarrierChallenges: [
      {
        challenge: 'Ashy Skin and TEWL',
        description: 'Ash (visible white or gray cast from dehydrated skin surface) is essentially visible barrier dysfunction — dead skin cells become more visible when the barrier isn\'t maintaining adequate hydration.',
        solution: 'The OG Black beauty wisdom — Vaseline (petroleum jelly) applied after bathing — is actually one of the most effective occludents science has found. It reduces TEWL by creating an impermeable barrier layer. Applied to damp skin: seal + moisture = glow.',
        modern: 'CeraVe, Cetaphil (ceramide-based moisturizers). Shea butter for face and body. Natural oil occludents (jojoba, marula).',
      },
      {
        challenge: 'PIH from Barrier Breaches',
        description: 'Any inflammation or barrier breach — a pimple, a rug burn, a scratch — triggers excess melanin production in melanin-rich skin.',
        solution: 'Avoid touching/picking at skin. Barrier protection prevents most PIH. For existing PIH: vitamin C, niacinamide, azelaic acid, SPF.',
      },
      {
        challenge: 'Keloids',
        description: 'Black Americans have significantly higher rates of keloid formation — where a healed skin wound produces excessive scar tissue that grows beyond the original wound boundary.',
        barrierRelevance: 'Keloids represent an exaggerated barrier repair response. Preventing keloids starts with preventing the original skin breach.',
        care: 'Silicone gel sheeting. Gentle scar massage. Consult a dermatologist for existing keloids.',
      },
    ],
    barrierPractices: [
      { practice: 'Vaseline (Petroleum Jelly) as Occludent', how: 'Apply a thin layer of petroleum jelly to damp skin after bathing, or as a "slugging" mask (heavier layer) overnight.', why: 'Petroleum jelly is one of the most effective occludents studied. Non-comedogenic for most people despite its reputation. Reduces TEWL by 98%. "Slugging" (overnight petrolatum layer) is a legitimate dermatologist-endorsed technique that was mainstream in Black beauty long before it became a skincare trend.', culturalNote: 'Vaseline has been in Black American households as a beauty staple for over a century. Modern dermatology has validated what Black grandmothers always knew.' },
      { practice: 'Shea Butter Application', how: 'Applied to damp skin. Unrefined raw shea butter for maximum benefit.', why: 'Triterpene alcohols (anti-inflammatory), vitamins E and A, and oleic and stearic acids. An African heritage practice maintained in Black American beauty culture for generations.' },
      { practice: 'JBCO Scalp and Skin Applications', how: 'Jamaican Black Castor Oil applied to scalp, edges, and skin needing barrier repair.', why: 'Ricinoleic acid has unique barrier-supporting and anti-inflammatory properties. Different from regular castor oil — the ash from roasted castor beans raises the pH and creates slightly different properties.' },
      { practice: 'Natural Hair LOC Method (Moisture for Scalp Barrier)', how: 'Liquid (water-based leave-in), Oil (seals the moisture), Cream (emollient cream to lock everything in).', why: 'The LOC method essentially applies the humectant-emollient-occludent moisturization framework to natural hair and scalp — supporting the scalp barrier as well as the hair shaft.' },
    ],
    barrierFoods: [
      { food: 'Sweet Potato', benefit: 'Beta-carotene converts to vitamin A — essential for barrier gene expression and skin cell turnover.' },
      { food: 'Fatty Fish (Salmon, Catfish)', benefit: 'Omega-3 EPA and DHA — directly incorporated into skin cell membranes, reducing inflammatory barrier disruption.' },
      { food: 'Collard Greens', benefit: 'Vitamin A, vitamin C (collagen support), zinc, iron — comprehensive barrier support nutrients.' },
      { food: 'Black Beans', benefit: 'Zinc (barrier enzyme activity). Protein (barrier structural proteins). Antioxidant anthocyanins (oxidative barrier protection).' },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL SKIN BARRIER SCIENCE
// ─────────────────────────────────────────────────────────────────────────────

export const UNIVERSAL_SKIN_BARRIER = {
  whatIsTheSkinBarrier: {
    description: 'The skin barrier — formally the "stratum corneum" — is the outermost layer of skin. It is 10-20 cells thick and structured like a brick wall: corneocytes (dead skin cells) are the "bricks," held together by lipid "mortar" (ceramides, fatty acids, and cholesterol).',
    function: [
      'Preventing TEWL (transepidermal water loss) — keeping skin hydrated',
      'Blocking environmental pathogens (bacteria, fungi, viruses) from entering',
      'Protecting against UV radiation, pollution, and chemical irritants',
      'Enabling skin to maintain its natural pH (4.5-5.5 — slightly acidic)',
    ],
  },

  ceramides: {
    
    typesAndFunctions: [
      'Ceramide 1 (EOS): Critical for overall barrier organization',
      'Ceramide 3 (NP): Most abundant; water retention',
      'Ceramide 6-II (AP): Barrier repair after damage',
    ],
    howToReplenish: [
      'Ceramide-containing skincare (CeraVe, Elizabeth Arden Ceramide line)',
      'Sunflower seed oil and borage seed oil (high in linoleic acid — a ceramide precursor)',
      'Niacinamide (stimulates ceramide synthesis)',
      'Avoiding harsh surfactants that strip ceramides',
    ],
  },

  acidMantle: {
    description: 'The skin\'s surface has a slightly acidic pH of 4.5-5.5, created by a mix of sebum, sweat, and natural microbial activity. This "acid mantle" is essential for healthy barrier function — it supports the skin microbiome and inhibits pathogen growth.',
    howItGetsDisrupted: [
      'Alkaline soaps (traditional bar soap, pH 8-10)',
      'Over-cleansing',
      'Hard water (mineral deposits alter pH)',
      'Harsh exfoliants',
    ],
    howToRestore: [
      'pH-balanced cleansers (4.5-6.5)',
      'Toners with slightly acidic pH (rose water, witch hazel-free toners)',
      'Allow time — the acid mantle naturally restores within 30-60 minutes after washing',
    ],
  },

  barrierRepairIngredients: [
    { ingredient: 'Ceramides', function: 'Direct barrier lipid replenishment' },
    { ingredient: 'Niacinamide (Vitamin B3)', function: 'Stimulates ceramide synthesis, reduces TEWL, anti-inflammatory, PIH reduction', dosage: '2-10% effective range', suitability: 'All skin types, all skin tones. A universal hero ingredient.' },
    { ingredient: 'Hyaluronic Acid', function: 'Humectant — draws moisture into the skin. Can hold 1000x its weight in water.', note: 'Must be applied to damp skin and immediately followed with an emollient/occludent or it will pull moisture out of skin in dry environments.' },
    { ingredient: 'Glycerin', function: 'The most studied humectant. Draws moisture from environment and from deeper skin layers.', suitability: 'All skin types. Very gentle.' },
    { ingredient: 'Petrolatum (Petroleum Jelly)',  suitability: 'All skin types topically. Some prefer to use on body rather than face (comedogenicity concerns, though evidence is mixed).' },
    { ingredient: 'Squalane', function: 'Emollient. Mimics the skin\'s natural squalene (a natural skin oil that declines with age). Lightweight, non-comedogenic.' },
    { ingredient: 'Linoleic Acid (Omega-6)', function: 'A ceramide precursor. Skin deficient in linoleic acid has compromised barriers.' },
    { ingredient: 'Centella Asiatica (Cica)', function: 'Anti-inflammatory. Stimulates collagen synthesis. Promotes barrier repair.', products: 'Dr. Jart Cicapair, numerous K-beauty products. Growing evidence base.' },
    { ingredient: 'Panthenol (Provitamin B5)', function: 'Penetrates the skin and converts to pantothenic acid. Highly effective humectant and skin soother. Supports barrier repair.', products: 'Found in countless skincare products. Very gentle.' },
    { ingredient: 'Aloe Vera', function: 'Polysaccharides support barrier function. Anti-inflammatory. Hydrating.', note: 'Best used in its whole form (from the plant) or as a product where it is the primary ingredient.' },
    { ingredient: 'Beta-Glucan', function: 'A polysaccharide that supports barrier function and is anti-inflammatory. From oats (colloidal oatmeal).', products: 'Aveeno products (colloidal oatmeal), dedicated serums.' },
  ],

  barrierCompromisingSituations: [
    { situation: 'Over-exfoliation', description: 'Using AHA, BHA, or physical exfoliants too frequently strips the barrier\'s lipid matrix.', recovery: 'Stop exfoliating. Switch to only gentle cleansing. Ceramide-heavy moisturizer. SPF. Allow 1-2 weeks for recovery.' },
    { situation: 'New Product Introduction Too Fast', description: 'Introducing multiple new actives simultaneously makes it impossible to identify what is irritating the skin and causes cumulative barrier disruption.', prevention: 'Introduce one new product every 2-4 weeks. Patch test first.' },
    { situation: 'Extreme Weather Changes', description: 'Sudden shifts in humidity (traveling from humid to dry climates, or vice versa) stress the barrier. Cold, wind, and low humidity strip moisture.', management: 'Adjust skincare routine to climate. Add occludents in dry/cold weather.' },
    { situation: 'Allergen Exposure', description: 'Fragrance, certain preservatives (MI, MCI), nickel, and other allergens cause contact dermatitis — a barrier-damaging inflammatory reaction.', management: 'Identify and eliminate the allergen. Barrier repair afterward.' },
  ],

  layeringOrder: {
    description: 'The order of skincare application matters for barrier function. Apply from thinnest to thickest consistency, and from most water-like to most oil-like.',
    order: [
      { step: 1, product: 'Micellar water or oil cleanser (first cleanse)' },
      { step: 2, product: 'Water-based cleanser (second cleanse)' },
      { step: 3, product: 'Exfoliant (1-3x weekly, not daily)' },
      { step: 4, product: 'Toner or essence (humectant layer)' },
      { step: 5, product: 'Treatment serum (vitamin C, niacinamide, etc.)' },
      { step: 6, product: 'Eye cream (thinner than face cream, applied first)' },
      { step: 7, product: 'Moisturizer (emollient layer)' },
      { step: 8, product: 'Facial oil (if using — seals in all the layers below)' },
      { step: 9, product: 'SPF (morning only — the most important barrier protection)' },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export function getSkinBarrierGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_SKIN_BARRIER_GUIDES['west-african'],
    'south-asian': ETHNIC_SKIN_BARRIER_GUIDES['south-asian'],
    'caribbean': ETHNIC_SKIN_BARRIER_GUIDES['caribbean'],
    'arab': ETHNIC_SKIN_BARRIER_GUIDES['arab'],
    'latina': ETHNIC_SKIN_BARRIER_GUIDES['latina'],
    'east-asian': ETHNIC_SKIN_BARRIER_GUIDES['east-asian'],
    'east-african': ETHNIC_SKIN_BARRIER_GUIDES['east-african'],
    'south-african': ETHNIC_SKIN_BARRIER_GUIDES['south-african'],
    'black-american': ETHNIC_SKIN_BARRIER_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

