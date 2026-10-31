/**
 * MIRRR — Skin Microbiome Beauty Multicultural Guide
 * The science of the skin microbiome — the trillions of bacteria, fungi,
 * and other microorganisms that live on our skin — and how different
 * ethnic communities' traditional practices have unknowingly (and knowingly)
 * supported microbiome health for centuries. This is cutting-edge dermatology
 * meeting ancient wisdom.
 */

export const ETHNIC_MICROBIOME_BEAUTY_GUIDES = {
  'west-african': {
    communityId: 'west-african',
    communityName: 'West African',
    microbiomeProfile: {
      description: 'West African skin\'s microbiome has been shaped by centuries of living in humid, tropical environments where the skin must manage high bacterial and fungal loads from the environment while maintaining its own protective microbial ecosystem. Research is limited but suggests melanin-rich skin may have differences in Cutibacterium (Propionibacterium) populations that contribute to the differences in acne presentation between skin tones.',
      uniqueFactors: [
        'High humidity environment selects for a microbiome adapted to moisture management',
        'Lifelong exposure to diverse environmental microbiomes (soil, water, food ferments) that may diversify skin microbiome',
        'Traditional washing practices (black soap, clay) may maintain microbiome differently than synthetic surfactants',
      ],
    },
    traditionalMicrobiomeSupporters: [
      {
        practice: 'African Black Soap (Ose Dudu)',
        microbiomeScience: 'African black soap is made via saponification of plantain skin ash, shea butter, cocoa pod ash, and palm oil. Unlike synthetic surfactants that can strip all microorganisms indiscriminately, black soap\'s natural saponins may be more selectively antimicrobial — reducing pathogenic bacteria while preserving commensal (beneficial) skin bacteria. The ash content creates a slightly alkaline wash that may disrupt pathogenic biofilms without the indiscriminate microbiome devastation of aggressive synthetic cleansers.',
        traditional: 'Used across Ghana, Nigeria, and throughout West Africa for skin cleansing, treating skin conditions, and bathing babies.',
        how: 'Wet hands. Lather a small amount of raw black soap between palms (not directly on face — can be too concentrated). Apply lather to face/body gently. Rinse thoroughly.',
      },
      {
        practice: 'Fermented Shea Products',
        microbiomeScience: 'When shea nuts are processed traditionally (pitted, boiled, sun-dried, roasted, ground, and whipped), the process involves fermentation steps. Fermented components of traditional processing may preserve beneficial bacteria-derived compounds from the shea processing that support skin microbiome when applied topically.',
        traditional: 'Shea butter production has been women\'s work across the Sahel for centuries, with traditional processing methods that vary by region and family.',
        modern: 'Look for raw, unrefined shea butter that has gone through minimal processing to preserve bioactive compounds.',
      },
      {
        practice: 'Neem (Dogonyaro) Treatments',
        microbiomeScience: 'Neem\'s active compounds (azadirachtin, nimbin, nimbidine) are selectively antimicrobial — effective against Staphylococcus aureus (a pathogen that causes skin infections and worsens eczema) and Malassezia (the yeast involved in dandruff and seborrheic dermatitis) while research suggests it may spare beneficial commensal bacteria more than broad-spectrum antibiotics.',
        traditional: 'The neem tree (called dogonyaro in Hausa, igi ẹmu in Yoruba) has been used medicinally across West Africa for skin conditions for thousands of years.',
        how: 'Neem oil diluted in carrier (2-3%) for scalp or body spot treatments. Neem leaf tea as a skin rinse for acne-prone areas.',
      },
    ],
    fermentedFoods: {
      description: 'Fermented foods support the gut microbiome, which has documented connections to skin health (the gut-skin axis). West African cuisine is rich in fermented foods:',
      foods: [
        { food: 'Ogi/Akamu', ferment: 'Fermented maize/sorghum porridge. Lactic acid bacteria. Eaten at breakfast.', skinBenefit: 'Lactobacillus from fermented grains may improve gut microbiome diversity, reducing inflammatory signals that manifest as skin inflammation, acne, and eczema.' },
        { food: 'Dawadawa/Locust Bean', ferment: 'Deeply fermented African locust bean seeds. High in Bacillus subtilis fermentation products including nattokinase-like enzymes.', skinBenefit: 'Gut probiotic effect. The strong smell indicates the depth of fermentation — bioactive compounds support gut microbiome.' },
        { food: 'Ogiri', ferment: 'Fermented castor seeds or sesame used as seasoning across southeastern Nigeria.', skinBenefit: 'Rich in microbial metabolites from deep fermentation.' },
      ],
    },
    microbiomeEnemies: [
      { enemy: 'Over-Washing', detail: 'Washing face more than twice daily strips the skin\'s acid mantle and disturbs the microbiome. The microbiome needs 4-6 hours to re-establish after washing.' },
      { enemy: 'Alcohol-Heavy Toners', detail: 'High-alcohol toners marketed in some West African beauty markets can devastate the skin microbiome. Avoid astringents with denatured alcohol (SD alcohol, alcohol denat) as top ingredients.' },
      { enemy: 'Antibiotics for Acne Long-Term', detail: 'Long-term antibiotic use for acne disrupts both gut and skin microbiome. Work with a dermatologist to minimize antibiotic duration.' },
    ],
  },

  'south-asian': {
    communityId: 'south-asian',
    communityName: 'South Asian',
    microbiomeProfile: {
      description: 'South Asian skin microbiome practices have been influenced by thousands of years of Ayurvedic medicine, which — while not using the word "microbiome" — developed sophisticated practices around fermented foods, herbs, and cleansing practices that modern science is discovering do indeed support microbial skin health.',
    },
    ayurvedicMicrobiomePractices: [
      {
        practice: 'Turmeric Paste (Ubtan)',
        microbiomeScience: 'Curcumin (the active compound in turmeric) has selective antimicrobial activity — particularly effective against Cutibacterium acnes (the bacterium in acne) and Staphylococcus aureus (pathogen) while showing less activity against beneficial commensal skin bacteria like Staphylococcus epidermidis. The prebiotic-like action of curcumin may support beneficial skin bacteria populations.',
        traditional: 'Ubtan (turmeric paste with gram flour, milk, and rose water) has been used as a pre-wedding skin treatment in India for centuries. Weekly or daily turmeric face masks are common in South Asian households.',
        caution: 'Turmeric stains skin yellow. Use in small amounts and rinse thoroughly. The staining is temporary (2-3 hours) on most skin tones.',
      },
      {
        practice: 'Neem (Azadirachta indica)',
        microbiomeScience: 'Same selective antimicrobial activity described in West African section. Neem appears independently in Ayurvedic and African traditional medicine as a skin microbiome modulator — suggesting convergent discovery of its genuine effectiveness.',
        traditional: 'Nimbo ka paani (neem water) as a skin toner, neem paste for acne, neem leaves in bath water, neem oil scalp treatment.',
      },
      {
        practice: 'Oil Cleansing with Sesame',
        microbiomeScience: 'The traditional South Asian practice of oil cleansing (applying oil, massaging, and removing) has genuine microbiome-supporting logic: oil dissolves sebum and oil-soluble debris without stripping the acid mantle (pH ~5.5) that protects commensal bacteria. The skin\'s microbiome thrives at the slightly acidic pH that oil cleansing maintains, whereas alkaline soaps can temporarily raise pH above 7, disrupting microbial ecology.',
        traditional: 'Sesame oil (Til) is the primary Ayurvedic oil for face and body. The oil pulling practice in Ayurveda (swishing oil in mouth) has a parallel logic for oral microbiome support.',
      },
    ],
    fermentedFoods: {
      foods: [
        { food: 'Idli/Dosa Batter', ferment: 'Fermented rice and black lentil batter (12-24h fermentation). Lactobacillus and Leuconostoc bacteria dominate the ferment.', skinBenefit: 'Excellent gut probiotic. Daily consumption in South India provides consistent Lactobacillus exposure.' },
        { food: 'Lassi (Chaas)', ferment: 'Fermented yogurt drink with live cultures. Lactobacillus acidophilus.', skinBenefit: 'Cooling probiotic drink. Particularly beneficial in summer when heat can trigger inflammatory skin conditions.' },
        { food: 'Kanji', ferment: 'Fermented carrot or beet drink made particularly during Holi. Lactobacillus fermentation.', skinBenefit: 'The beta-carotene from carrots is a skin antioxidant while the lactobacillus provides gut microbiome support.' },
        { food: 'Pickles (Achar)', ferment: 'Lacto-fermented vegetables — not vinegar pickles. Traditional achar is fermented in salt brine.', skinBenefit: 'Genuine probiotic when traditionally made (raw ferment, not cooked after fermentation).' },
      ],
    },
    skinConcernsAndMicrobiome: [
      { concern: 'Acne', microbiomeLink: 'Cutibacterium acnes overgrowth combined with Staphylococcus aureus plays a role in inflammatory acne. Dysbiosis (microbiome imbalance) is now considered a factor.', approach: 'Prebiotic skincare to support microbiome balance. Neem-based spot treatments. Fermented skincare products. Avoid over-stripping the skin barrier.' },
      { concern: 'Hyperpigmentation', microbiomeLink: 'Emerging research connects microbiome dysbiosis to inflammatory hyperpigmentation through inflammatory signaling that triggers melanocytes.', approach: 'Support skin barrier integrity (microbiome-friendly cleansing) to reduce inflammation that drives post-inflammatory hyperpigmentation.' },
    ],
  },

  'caribbean': {
    communityId: 'caribbean',
    communityName: 'Caribbean',
    microbiomeProfile: {
      description: 'Caribbean skin faces unique microbiome challenges from the tropical environment — high heat and humidity create conditions where pathogenic bacteria and fungi thrive, while the salt-rich ocean environment has its own microbiome-modulating effects. Caribbean traditional medicine has developed sophisticated responses to these challenges.',
    },
    caribbeanMicrobiomePractices: [
      {
        practice: 'Aloe Vera (Sinkle Bible)',
        microbiomeScience: 'Aloe vera polysaccharides (particularly acemannan) function as prebiotics — food for beneficial skin bacteria. Aloe also has selective antimicrobial activity against Staphylococcus aureus and Candida while showing relative sparing of commensal bacteria. The slightly acidic pH of fresh aloe gel (~4.5) supports the skin\'s acid mantle.',
        traditional: 'Called "sinkle bible" in Jamaica and "sábila" throughout the Caribbean. Aloe vera plants are kept in most Caribbean households. The fresh gel is applied directly to sunburns, rashes, acne, and general skin care.',
        how: 'Cut a fresh aloe leaf. Rinse. Scoop out the clear inner gel. Apply directly to skin. Let absorb. Follow with moisturizer if needed.',
      },
      {
        practice: 'Sea Bath (Ocean Swimming)',
        microbiomeScience: 'Ocean water contains billions of marine bacteria, many of which are non-pathogenic and some potentially beneficial. The saline environment of seawater (3.5% salt) creates an osmotic condition that may suppress pathogenic organisms on skin while the diverse marine microbiome may temporarily diversify the skin microbiome. Regular ocean swimming is associated with different skin microbiome composition in some studies.',
        traditional: 'The "sea bath" — swimming in the ocean for its health and skin benefits — is a Caribbean cultural institution. Sea bathing for skin conditions, mental health, and general wellness is practiced throughout the Caribbean.',
        caution: 'Urban beaches with high pollution or bacteria counts can introduce pathogens. Ocean water near sewage outfalls or after heavy rain can carry harmful bacteria. Wild, clean ocean water is the goal.',
      },
      {
        practice: 'Guinea Hen Weed (Petiveria alliacea)',
        microbiomeScience: 'Guinea hen weed is an anti-inflammatory and antimicrobial herb used in traditional Caribbean medicine. Contains phenylsulfide compounds with antimicrobial properties. Used for skin conditions, particularly fungal infections (common in the humid Caribbean climate), suggesting selective antifungal activity.',
        traditional: 'Used across the Caribbean as a bath herb — leaves boiled in water, cooled, added to bath water for skin conditions, rashes, and fungal issues.',
      },
    ],
    fermentedFoods: {
      foods: [
        { food: 'Mauby', ferment: 'Fermented bark drink from Mauby tree. Natural fermentation produces a probiotic-rich drink.', skinBenefit: 'Cooling drink with probiotic effect. Traditional to Barbados and throughout the Eastern Caribbean.' },
        { food: 'Cocoa Tea (Fermented Cacao)', ferment: 'Traditional Caribbean cocoa processing involves fermentation of cacao beans. The polyphenols from fermented cacao have documented benefits for gut and skin microbiome.', skinBenefit: 'Fermented cacao polyphenols support diverse gut microbiome. Ritual morning drink in many Caribbean communities.' },
        { food: 'Soursop Leaf Tea', ferment: 'While not fermented, soursop leaves support gut health and have prebiotic-like effects', skinBenefit: 'Used throughout the Caribbean for general health and skin conditions. Anti-inflammatory. May support gut-skin axis.' },
      ],
    },
  },

  'arab': {
    communityId: 'arab',
    communityName: 'Arab Middle Eastern',
    microbiomeProfile: {
      description: 'Arab Middle Eastern skin microbiome practices have been shaped by the hammam tradition (the traditional steam bath), the use of fermented dairy products, and centuries of herbal medicine that have created sophisticated microbiome-supportive rituals.',
    },
    arabMicrobiomePractices: [
      {
        practice: 'Hammam (Turkish/Arab Bath) Ritual',
        microbiomeScience: 'The hammam ritual — steam, kessa (exfoliation with rough mitt), ghassoul clay or soap, rinse — is actually sophisticated microbiome management. The steam softens the skin barrier, loosening dead skin cells. Exfoliation removes the stratum corneum\'s top layer (taking some bacteria with it). Then the skin begins to regenerate and recolonize with fresh bacteria. The traditional hammam interval (weekly or biweekly) may allow the microbiome to re-establish between sessions without extended disruption. Modern daily shower culture by contrast constantly disturbs the microbiome without allowing full recovery.',
        traditional: 'The hammam is a cultural and social institution across the Arab world, North Africa, and Turkey. Weekly hammam visits have been standard practice for centuries.',
        microbiomeOptimal: 'The hammam approach — intensive but infrequent cleansing — may actually be superior to daily showering for microbiome health, which is emerging as a concept in dermatology (the "less is more" approach to skin cleansing).',
      },
      {
        practice: 'Ghassoul (Rhassoul) Clay',
        microbiomeScience: 'Ghassoul clay from the Atlas Mountains of Morocco is a smectite clay (similar to bentonite) with unique ionic exchange properties. It can absorb sebum and surface bacteria via ionic attraction without stripping all microorganisms the way surfactant cleansers do. The neutral pH (~7) of ghassoul may be gentler on the acid mantle than alkaline soaps (pH 9-10). Its negative charge attracts positively charged pathogenic bacteria while allowing negatively charged beneficial bacteria to remain.',
        traditional: 'Used across Morocco, Algeria, and Tunisia as a hair and body wash for thousands of years. Ghassoul dissolves in water and is applied as a paste.',
        how: 'Mix 1 tbsp ghassoul clay with enough water to make a paste. Apply to face/hair. Leave 5 minutes. Rinse thoroughly.',
      },
      {
        practice: 'Black Seed Oil (Habbatus Sauda)',
        microbiomeScience: 'Thymoquinone from Nigella sativa has been studied for its effects on skin microbiome. Research suggests selective inhibition of Staphylococcus aureus (a pathogen associated with eczema flares and wound infections) with relative sparing of beneficial skin commensal organisms. Historically prescribed for skin conditions in Islamic traditional medicine.',
        traditional: '"Use black seed for it is healing for all diseases except death" — the hadith of the Prophet Mohammed (PBUH) has made black seed oil one of the most widely used traditional medicines in the Islamic world.',
      },
      {
        practice: 'Rose Water (Ma\' al-Ward)',
        microbiomeScience: 'Traditional distilled rose water has a pH of approximately 4.5-5, which is within the optimal range for skin commensal bacteria to thrive (optimal skin microbiome pH is ~4.5-5.5). Using rose water as a toner maintains the skin\'s acid mantle pH after cleansing — creating a hospitable environment for beneficial bacteria to re-establish.',
        traditional: 'Rose water has been produced in the Middle East (particularly Iran/Persia) for over 1,000 years and is a central component of Arab beauty rituals. Applied after cleansing as a toner, added to baths, used to freshen skin and fragrance.',
      },
    ],
    fermentedFoods: {
      foods: [
        { food: 'Laban (Yogurt)', ferment: 'Fermented milk. Lactobacillus bulgaricus, Streptococcus thermophilus.', skinBenefit: 'Daily laban consumption provides consistent probiotic exposure. L. bulgaricus has been studied for skin health benefits. Traditional Arab households consume laban with every meal.' },
        { food: 'Kishk', ferment: 'Sun-dried fermented yogurt and cracked wheat. Deep fermentation product used in Levantine cuisine.', skinBenefit: 'Complex fermented product with diverse microbial metabolites.' },
        { food: 'Tarhana', ferment: 'Dried fermented grain and yogurt mixture. Traditional across Turkey and Arab world.', skinBenefit: 'Diverse probiotic strains from the combined fermentation of grain and dairy.' },
      ],
    },
  },

  'latina': {
    communityId: 'latina',
    communityName: 'Latina',
    microbiomeProfile: {
      description: 'Latina skin microbiome practices reflect the diverse cultural heritage of Latin America — indigenous traditions of plant medicine, African influences in Afro-Latina communities, and Spanish/Portuguese colonial influences that brought new plants and practices. The result is a rich tapestry of microbiome-supportive practices.',
    },
    latinaMicrobiomePractices: [
      {
        practice: 'Nopal Cactus (Prickly Pear) Skin Care',
        microbiomeScience: 'Nopal polysaccharides (particularly mucilage) function as prebiotics — they selectively feed beneficial skin bacteria. Nopal also contains antioxidants and anti-inflammatory compounds that reduce the inflammatory signals that disrupt microbiome balance. The hydrating properties of nopal help maintain the skin barrier, which is essential for a stable microbiome.',
        traditional: 'The nopal cactus is sacred in Mexican culture (the Aztec glyph for Mexico is an eagle on a nopal). Nopal has been used medicinally by indigenous Mexican communities for thousands of years. Applied as a fresh slice, gel extract, or prepared mask.',
        how: 'Fresh nopal pad: clean, peel spines, blend or slice. Apply the juice/gel to skin. Leave 15-20 min. Rinse. Or look for nopal extract in skincare products.',
      },
      {
        practice: 'Papaya Enzyme Mask',
        microbiomeScience: 'Papain (the enzyme from papaya) is a proteolytic enzyme — it breaks down proteins on the skin\'s surface. This includes breaking down dead skin cells and sebum buildup where pathogenic bacteria colonize. By removing this substrate, papain may disrupt pathogenic biofilm formation while allowing beneficial bacteria (which have different attachment mechanisms) to remain. The prebiotic fiber in papaya flesh also feeds beneficial bacteria.',
        traditional: 'Fresh papaya applied to face is a traditional beauty treatment across Latin America and the Caribbean. The skin (not the flesh) of green papaya is particularly enzyme-rich.',
        how: 'Mash ripe papaya flesh. Apply to face. Leave 10-15 min (the enzyme is active — longer can cause irritation). Rinse thoroughly. Follow with moisturizer.',
      },
      {
        practice: 'Avocado Oil Cleansing',
        microbiomeScience: 'Avocado oil cleansing (apply oil, massage, remove) maintains the acid mantle and supports microbiome health as described in other sections. Avocado specifically contains beta-sitosterol (anti-inflammatory), persenone A and B (unique compounds that may support skin barrier integrity), and oleic acid that maintains the hydrophobic barrier that keeps the microbiome\'s ecological niche stable.',
        traditional: 'Avocado is indigenous to Mexico. Indigenous Nahuatl-speaking communities have used avocado for skin care since pre-Columbian times. The tradition continues throughout Latin America.',
      },
    ],
    fermentedFoods: {
      foods: [
        { food: 'Tepache', ferment: 'Fermented pineapple drink traditional to Mexico. Lactobacillus, wild yeast.', skinBenefit: 'Pineapple provides bromelain enzyme (skin benefit topically) while the fermentation creates diverse probiotic organisms. Refreshing gut probiotic drink.' },
        { food: 'Chicha', ferment: 'Fermented corn or other grain drink with deep indigenous roots. Lactobacillus fermentation.', skinBenefit: 'Ancient probiotic drink from the Andes. Daily consumption in traditional communities provides consistent gut microbiome support.' },
        { food: 'Cacao (Traditional)', ferment: 'Traditional Mexican chocolate preparation starts with fermented cacao beans. The fermentation is essential to flavor development and creates bioactive compounds.', skinBenefit: 'Fermented cacao polyphenols. Oral chocolate consumption associated with some skin benefits in research.' },
        { food: 'Kvass-like Corn Ferments', ferment: 'Various lacto-fermented corn preparations across Latin America', skinBenefit: 'Diverse Lactobacillus strains' },
      ],
    },
  },

  'east-asian': {
    communityId: 'east-asian',
    communityName: 'East Asian',
    microbiomeProfile: {
      description: 'East Asian beauty culture, particularly Korean K-beauty, has led the global skincare industry in microbiome-aware skincare. Korean skincare brands have pioneered "biome-friendly," "microbiome-balanced," and "probiotic skincare" product categories. Japanese skincare\'s emphasis on minimal, gentle products also aligns with microbiome-supportive principles. The cultural tradition of fermented foods in Korea, Japan, and China provides extraordinary gut microbiome diversity.',
    },
    eastAsianMicrobiomePractices: [
      {
        practice: 'Fermented Skincare (K-Beauty)',
        microbiomeScience: 'Korean skincare brands (Sulwhasoo, SKII, Beauty of Joseon, Dr. Jart+) have developed fermented skincare products using processes similar to traditional food fermentation. The fermentation of natural ingredients (yeast, bacteria) creates smaller molecular weight compounds that penetrate the skin better, metabolites of beneficial bacteria (postbiotics), and lower-pH formulations that support the acid mantle. SKII\'s Pitera (galactomyces ferment filtrate) from sake yeast fermentation became globally famous after Japanese sake brewery workers were noted to have remarkably young-looking hands.',
        traditional: 'The fermentation of natural ingredients for skincare products draws on the deep fermentation traditions of East Asian food culture — miso, sake, kimchi, soy sauce all require sophisticated microbial management that Korean and Japanese cosmetic scientists have applied to skincare.',
        keyIngredients: ['Galactomyces ferment filtrate (sake yeast)', 'Lactobacillus ferment lysate', 'Bifida ferment lysate (from Bifidobacterium)', 'Saccharomyces ferment filtrate'],
      },
      {
        practice: 'Double Cleansing — Microbiome Perspective',
        microbiomeScience: 'The K-beauty double cleanse (oil cleanser first, water-based cleanser second) actually makes microbiome sense. Oil cleansing first removes oil-soluble debris (makeup, sunscreen, excess sebum) where pathogenic bacteria colonize, without disrupting the skin\'s aqueous layer. The second water cleanser then cleans any remaining oil cleanser. Two gentle cleansers are less disruptive to the microbiome than one aggressive cleanser needed to remove heavy buildup.',
        traditional: 'Double cleansing has roots in Japanese beauty culture (oil cleansing to lift heavy makeup) and was popularized globally by Korean skincare brands.',
      },
      {
        practice: 'Rice Water Toner',
        microbiomeScience: 'Rice water (particularly fermented rice water) has inositol, which can penetrate hair and skin to repair from inside. The fermentation of rice water produces lactic acid (lowering pH) and various postbiotics from Lactobacillus that may support skin microbiome. The slightly acidic pH of fermented rice water (~3.5-4) helps maintain the acid mantle environment favorable for commensal bacteria.',
        traditional: 'Used by Heian-era Japanese court women and the Yao women of China for skin and hair. Rice water rinses have been part of East Asian beauty for centuries.',
      },
    ],
    fermentedFoods: {
      description: 'East Asian cuisine is among the richest in fermented foods in the world:',
      foods: [
        { food: 'Kimchi', ferment: 'Fermented vegetables (primarily napa cabbage with radish, ginger, garlic). Lactobacillus kimchii, L. plantarum, L. brevis, and dozens of other strains.', skinBenefit: 'Among the most diverse and well-studied probiotic fermented foods. Regular kimchi consumption associated with improved gut microbiome diversity. The Lactobacillus strains from kimchi have been studied specifically for skin anti-inflammatory effects.' },
        { food: 'Miso', ferment: 'Fermented soybean paste with rice or barley. Aspergillus oryzae (koji) mold initiates fermentation, followed by Lactobacillus and other bacteria.', skinBenefit: 'Isoflavones from soy in miso support skin collagen and may have mild hormonal benefits for skin. The fermentation makes the isoflavones more bioavailable. Glutathione-like compounds in miso are skin antioxidants.' },
        { food: 'Natto', ferment: 'Fermented soybeans with Bacillus subtilis natto. Strong smell, sticky texture.', skinBenefit: 'Nattokinase (the enzyme) and vitamin K2 in natto. The Bacillus subtilis fermentation produces polyglutamic acid — a hyaluronic acid substitute. Japan has one of the lowest osteoporosis rates in the world, attributed partly to natto consumption.' },
        { food: 'Sake / Amazake', ferment: 'Fermented rice wine. Galactomyces fermentation.', skinBenefit: 'The galactomyces ferment filtrate that became SKII\'s famous ingredient was first observed on sake brewery workers\' hands. The ferment metabolites (inositol, organic acids, vitamins) are genuinely skin-beneficial.' },
        { food: 'Kombucha (Chinese Origin)', ferment: 'Fermented sweetened tea with SCOBY (symbiotic culture of bacteria and yeast). Acetobacter, Gluconobacter, various Lactobacillus strains.', skinBenefit: 'The organic acids from kombucha fermentation (glucuronic acid, gluconic acid) support liver detoxification, which some holistic practitioners link to clearer skin. Applied topically, kombucha\'s organic acids have mild chemical exfoliation properties similar to AHAs.' },
      ],
    },
  },

  'east-african': {
    communityId: 'east-african',
    communityName: 'East African',
    microbiomeProfile: {
      description: 'East Africa\'s position at the "cradle of humanity" means East African populations harbor some of the most genetically diverse microbiomes on Earth. Communities with traditional lifestyles (herders, farmers, hunter-gatherers) have been documented to have remarkable gut and skin microbiome diversity compared to Western industrialized populations — diversity that is protective against inflammatory conditions.',
    },
    eastAfricanMicrobiomePractices: [
      {
        practice: 'Fermented Milk (Mursik, Ayran, Fermented Camel Milk)',
        microbiomeScience: 'East African pastoral communities — the Maasai, Samburu, Borana — have consumed fermented milk for millennia. Traditional mursik (Kalenjin fermented milk stored in gourds rinsed with charcoal smoke from specific trees) contains unique Lactobacillus strains that may not exist in commercial probiotics. The charcoal-smoke-treated gourd introduces additional bioactive compounds including lignans and phenolics that may act as prebiotics.',
        traditional: 'Fermented milk is the staple food of East African pastoralists. Warriors in traditional societies consumed primarily blood, meat, and fermented milk. The fermentation is crucial — fresh milk is less valued than soured milk.',
        skinBenefit: 'High dairy-fat diet combined with diverse probiotic strains from traditional fermentation provides both the fat-soluble vitamins (A, D, E, K) essential for skin health and the gut microbiome diversity that reduces inflammatory skin conditions.',
      },
      {
        practice: 'Charcoal Beauty Treatments',
        microbiomeScience: 'Activated charcoal has become a global beauty trend, but charcoal has been used in East African beauty traditions (and in the traditional milk gourd) for centuries. Charcoal\'s porous structure adsorbs (binds to its surface) toxins, excess sebum, and certain bacteria through ionic attraction. Used topically, charcoal masks may selectively remove surface-dwelling pathogenic bacteria while the commensal bacteria in deeper layers of the stratum corneum are less affected.',
        traditional: 'Charcoal used in Maasai and Somali beauty preparations. Charcoal-treated wood ash used in body care. Charcoal-smoked traditional milk containers.',
        how: 'Activated charcoal mask: 1 tsp activated charcoal + water to paste + few drops tea tree oil. Apply to T-zone. Leave 10 min. Rinse. Use weekly maximum — too frequent is drying.',
      },
      {
        practice: 'Frankincense and Myrrh',
        microbiomeScience: 'Both frankincense (Boswellia) and myrrh (Commiphora) are from the Horn of Africa and Arabian Peninsula. Their resins have been used medicinally for thousands of years. Boswellic acids (frankincense) are potent anti-inflammatory compounds (5-LOX inhibitors) that reduce the inflammatory cascades that disrupt microbiome balance. Myrrh\'s volatile oils have antimicrobial properties against pathogenic bacteria.',
        traditional: 'Somalia is the world\'s largest frankincense producer. Both resins are burned as incense (inhaled for respiratory benefits), consumed (traditional medicine), and applied topically throughout East Africa and the Arabian Peninsula.',
      },
    ],
    fermentedFoods: {
      foods: [
        { food: 'Injera', ferment: 'Teff flour fermented 2-3 days. Lactobacillus, wild yeasts.', skinBenefit: 'The long fermentation of injera creates diverse microbial metabolites. Teff is high in iron and calcium — skin essential minerals. Eaten at every Ethiopian and Eritrean meal.' },
        { food: 'Tej', ferment: 'Ethiopian honey wine (mead) fermented with gesho (buckthorn) leaves.', skinBenefit: 'Antioxidants from honey plus probiotic effect of wild fermentation. Gesho adds unique antimicrobial compounds.' },
        { food: 'Traditional Mursik', ferment: 'Kalenjin fermented milk in charcoal-smoked gourd. Unique indigenous Lactobacillus strains.', skinBenefit: 'Most gut-microbiome-diverse fermented food. Indigenous Lactobacillus strains not available in commercial probiotics.' },
      ],
    },
  },

  'south-african': {
    communityId: 'south-african',
    communityName: 'South African',
    microbiomeProfile: {
      description: 'South Africa\'s remarkable biodiversity (one of the world\'s biodiversity hotspots) has created an equally remarkable traditional medicine system — particularly among the Zulu, Xhosa, Sotho, and San peoples. The Cape Floral Kingdom, the most botanically diverse region on Earth, has provided traditional healers (izinyanga, izangoma) with an extraordinary pharmacopeia of plants with microbiome-active compounds.',
    },
    southAfricanMicrobiomePractices: [
      {
        practice: 'Rooibos Treatments',
        microbiomeScience: 'Rooibos contains aspalathin (a unique flavanone found only in rooibos), nothofagin, rutin, orientin, quercetin, and other polyphenols that are potent prebiotics — selectively feeding Bifidobacterium and Lactobacillus in the gut while potentially doing the same on skin. Rooibos has been studied for anti-inflammatory and antioxidant effects on skin, with some evidence for reducing UV-induced skin damage.',
        traditional: 'The Khoikhoi people of the Cape used rooibos as a traditional remedy long before European settlers adopted it. South Africa now exports rooibos globally. Applied as a tea rinse, in skincare products, and consumed as tea (a national beverage).',
        how: 'Brew strong rooibos tea. Cool completely. Use as face toner or final hair rinse. Or: apply cooled rooibos tea bags to under-eye area for puffiness.',
      },
      {
        practice: 'Aloe ferox (Cape Aloe)',
        microbiomeScience: 'Aloe ferox (Cape Aloe, native to South Africa) is a different species from Aloe vera with distinct compounds — particularly aloin and barbaloin (anthraquinone compounds). Topically, Cape aloe has anti-inflammatory, anti-pathogenic, and potentially prebiotic effects similar to Aloe vera but with a distinct active compound profile.',
        traditional: 'South African Indigenous communities have used Cape Aloe medicinally for thousands of years. The bitter sap (aloe bitters) was traditionally used as a digestive aid and applied to skin for wounds, rashes, and sun damage.',
      },
      {
        practice: 'Marula Oil',
        microbiomeScience: 'Marula oil is 70-78% oleic acid and also contains procyanidins (unique antioxidants from marula), catechins, and flavanones. These polyphenols support the skin microbiome by reducing oxidative stress that disrupts microbial ecology, and the oleic acid contributes to the skin lipid barrier that maintains the microbiome\'s ecological niche. Marula is one of the most absorbing plant oils (comparative study showed highest absorption vs other oils) — meaning it does not create an occlusive layer that would change the skin\'s gaseous environment.',
        traditional: 'The marula tree (Sclerocarya birrea) is sacred in South African cultures. The fruit is eaten, the oil applied to skin and hair, and the bark used medicinally. Marula is traditionally associated with fertility and feminine beauty.',
      },
    ],
    fermentedFoods: {
      foods: [
        { food: 'Umqombothi (Zulu Beer)', ferment: 'Fermented sorghum and maize beer. Traditional Zulu drink. Complex fermentation with Lactobacillus, Saccharomyces, and other organisms.', skinBenefit: 'B vitamins from the fermentation. Diverse probiotic organisms. Traditional communal drink.' },
        { food: 'Amasi (Fermented Milk)', ferment: 'Traditional South African fermented milk similar to kefir. Stored in a calabash gourd to sour. Lactobacillus dominant.', skinBenefit: 'South African equivalent of East African fermented milk. High in calcium, protein, and probiotic bacteria. Daily consumption provides gut microbiome support.' },
        { food: 'Mogodu (Fermented Tripe)', ferment: 'Traditional dish. The gut (tripe) is itself rich in the gut-associated microbiome of the animal.', skinBenefit: 'Cultural connection to gut microbiome diversity. Less about bacterial transfer and more about nutrients from the gut-associated tissue.' },
      ],
    },
  },

  'black-american': {
    communityId: 'black-american',
    communityName: 'Black American',
    microbiomeProfile: {
      description: 'Black American skin microbiome sits at the intersection of West and Central African genetic heritage, American environmental conditions, and the legacy of historical trauma on health. Research is emerging that chronic stress (which Black Americans experience at higher rates due to systemic racism) affects the skin microbiome through the stress-gut-skin axis. At the same time, Black American culture has maintained and developed sophisticated skincare traditions that support microbiome health.',
    },
    blackAmericanMicrobiomePractices: [
      {
        practice: 'Shea Butter as Microbiome-Friendly Moisturizer',
        microbiomeScience: 'Raw, unrefined shea butter is one of the most microbiome-friendly moisturizers. It has natural preservatives (triterpenes) that provide mild anti-pathogenic activity without stripping beneficial bacteria. The neutral pH (~7) and emollient properties support the skin barrier without disturbing the acid mantle significantly. Unlike many synthetic moisturizers with preservatives (parabens, phenoxyethanol, methylisothiazolinone), raw shea butter\'s natural chemistry is less disruptive to skin microbiome.',
        traditional: 'Shea butter was brought to Black American consciousness partly through diaspora connections to West African heritage. It has become a cornerstone of natural Black haircare and skincare, particularly for natural hair communities from the 2000s onward.',
        note: 'Refined, deodorized shea butter has had many of its bioactive compounds removed. Raw, unrefined shea is preferable for microbiome benefits.',
      },
      {
        practice: 'Witch Hazel as Toner',
        microbiomeScience: 'Witch hazel (Hamamelis virginiana) has been a Black American beauty staple for generations. The tannins in witch hazel have astringent and mild antimicrobial properties. Importantly, witch hazel without alcohol (or very low alcohol) is significantly more microbiome-friendly than alcohol-based toners that devastate skin microbial populations.',
        traditional: 'Used by Black American grandmothers as a versatile toner, after-shave, and general skin refresher. Passed down through generations as a affordable, effective beauty staple.',
        caution: 'Avoid witch hazel formulations with high isopropyl or denatured alcohol content — the alcohol negates the microbiome benefit. Look for alcohol-free witch hazel.',
      },
      {
        practice: 'Bentonite Clay Masks',
        microbiomeScience: 'Bentonite clay (used in the "wash day" hair care routine and as a face mask in Black American beauty culture) selectively adsorbs positively-charged pathogenic bacteria while its mineral content may support the skin\'s microbiome-favorable environment. Like all clay masks: use weekly at most, not daily — over-use strips the microbiome.',
        traditional: 'Bentonite clay became widely used in Black American natural hair communities as part of the "clay wash" for natural hair. It cleanses the scalp without stripping natural oils and the microbiome that produces them.',
      },
    ],
    gutSkinAxis: {
      description: 'The gut-skin axis is particularly relevant for Black American communities because:',
      stressConnection: 'Chronic stress (experienced at elevated rates due to racial stress, socioeconomic factors, and systemic discrimination) disrupts the gut microbiome through cortisol\'s effects on gut permeability ("leaky gut"). This leads to inflammatory signals in the bloodstream that manifest as skin inflammation, acne, and eczema flares.',
      approaches: [
        'Probiotic-rich traditional Southern foods: sauerkraut-like preparations, fermented sweet tea, sourdough cornbread (some traditional recipes)',
        'Soul food as probiotic opportunity: collard greens cooked with apple cider vinegar, pickled vegetables',
        'Stress management as skin care: the connection between cortisol reduction and skin microbiome health is real',
      ],
    },
    fermentedFoods: {
      foods: [
        { food: 'Pot Liquor (Potlikker)', ferment: 'The broth from cooking long-simmered greens (collards, turnip greens) is rich in micronutrients that feed beneficial gut bacteria — acting as a prebiotic.', skinBenefit: 'Potassium, calcium, iron, magnesium from the greens. Probiotic-like effect from the plant polyphenols that feed Lactobacillus and Bifidobacterium.' },
        { food: 'Vinegar-Based Hot Sauce', ferment: 'Many traditional Southern hot sauces are vinegar-fermented. Louisiana-style hot sauce involves pepper fermentation.', skinBenefit: 'Capsaicin has systemic anti-inflammatory effects. Fermentation-derived acetic acid (vinegar) has mild prebiotic properties.' },
        { food: 'Apple Cider Vinegar', ferment: 'Fermented apple juice to wine, then to vinegar. Contains acetobacter and Lactobacillus metabolites. The "mother" (sediment) contains live cultures.', skinBenefit: 'Widely used in Black American beauty culture as a hair rinse (restores pH after shampooing) and diluted toner. The acid helps maintain the skin\'s acid mantle and may support commensal bacteria.' },
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL MICROBIOME SCIENCE
// ─────────────────────────────────────────────────────────────────────────────

export const UNIVERSAL_SKIN_MICROBIOME = {
  whatIsTheMicrobiome: {
    description: 'The skin microbiome is the community of trillions of microorganisms — bacteria, fungi, viruses, and mites — that live on the skin\'s surface. Far from being harmful, this community is essential for skin health: it trains the immune system, protects against pathogens, maintains skin pH, and communicates with the gut microbiome through the gut-skin axis.',
    keyOrganisms: [
      { organism: 'Staphylococcus epidermidis', role: 'The most abundant commensal skin bacteria. Produces bacteriocins that kill Staphylococcus aureus and other pathogens. Essential for healthy skin.' },
      { organism: 'Cutibacterium acnes (formerly Propionibacterium acnes)', role: 'Common commensal in sebaceous follicles. Certain strains cause acne; other strains are commensal and even beneficial. Not all C. acnes is bad.' },
      { organism: 'Malassezia (yeast)', role: 'The dominant fungal organism on skin. Commensal when balanced. Involved in dandruff, seborrheic dermatitis, and pityriasis versicolor when overgrown.' },
      { organism: 'Demodex mites', role: 'Microscopic mites in hair follicles. Normal at low density. Increased density associated with rosacea.' },
    ],
  },

  microbiomeDisruptors: [
    { disruptor: 'Over-cleansing', effect: 'Daily washing with harsh surfactants (SLS, SLES) removes the skin microbiome indiscriminately. The skin needs 4-6 hours to re-establish its microbial community after washing.' },
    { disruptor: 'Antibiotics (topical or oral)', effect: 'Broad-spectrum antibiotics kill both pathogenic and commensal bacteria. Long-term antibiotic use for acne is now recognized to cause antibiotic-resistant microbiome changes.' },
    { disruptor: 'High-alcohol products', effect: 'Products with alcohol (denatured alcohol, isopropyl alcohol) as a top ingredient devastate the skin microbiome completely within minutes of application.' },
    { disruptor: 'Extremely alkaline cleansers', effect: 'Bar soaps and cleansers with pH 9-10 (alkaline) temporarily raise the skin\'s surface pH from its ideal ~4.5 to 5.5 range. This disrupts the acidic environment that commensal bacteria require.' },
    { disruptor: 'Bleach baths (over-prescribed)', effect: 'While dilute bleach baths can be useful for Staphylococcus-driven eczema, overuse devastates the entire skin microbiome.' },
  ],

  microbiomeSupporters: [
    { supporter: 'Fermented foods (internal)', why: 'The gut-skin axis means a healthy gut microbiome reduces inflammatory signals that disrupt skin microbiome balance. Daily fermented food consumption (yogurt, kimchi, kefir, miso) is the single most evidence-backed thing you can do for skin microbiome health.' },
    { supporter: 'Gentle, pH-balanced cleansers', why: 'Cleansers with pH 4.5-5.5 (close to skin\'s natural pH) are far less disruptive to the microbiome than alkaline soaps.' },
    { supporter: 'Prebiotic skincare ingredients', why: 'Inulin, fructooligosaccharides (FOS), and other prebiotic ingredients applied topically feed beneficial bacteria selectively.', examples: 'Inulin from chicory root in skincare, oat beta-glucan, glycerin (feeds some commensal bacteria)' },
    { supporter: 'Postbiotic skincare', why: 'Fermented skincare products contain postbiotics — the beneficial metabolic byproducts of bacteria that can be applied topically to support microbiome health without needing live bacteria in the product.', examples: 'Lactobacillus ferment lysate, galactomyces ferment filtrate, bifida ferment lysate' },
    { supporter: 'Moisturizing', why: 'The skin barrier (supported by adequate moisturization) creates the ecological niche that the microbiome inhabits. A compromised barrier disrupts the microbiome.' },
  ],

  gutSkinAxis: {
    description: 'The gut-skin axis is a bidirectional communication pathway between the gut microbiome and the skin, mediated by immune cells, inflammatory cytokines, and microbial metabolites in the bloodstream.',
    conditions: [
      { condition: 'Acne', gutConnection: 'Studies find altered gut microbiome composition in acne patients. Small intestinal bacterial overgrowth (SIBO) associated with acne rosacea.' },
      { condition: 'Eczema/Atopic Dermatitis', gutConnection: 'Strong evidence for gut microbiome involvement. Early-life gut microbiome diversity predicts eczema risk. Probiotic supplementation reduces eczema severity in multiple clinical trials.' },
      { condition: 'Psoriasis', gutConnection: 'Gut microbiome dysbiosis documented in psoriasis patients. Inflammatory bacterial metabolites from the gut may trigger skin inflammation.' },
      { condition: 'Rosacea', gutConnection: 'SIBO (small intestinal bacterial overgrowth) treated with rifaximin antibiotic dramatically improves rosacea in some patients — suggesting gut bacteria produce the inflammatory trigger.' },
    ],
    practicalApplication: 'Improving gut microbiome diversity through fermented food consumption, fiber intake (feeds beneficial bacteria), and stress management can meaningfully reduce inflammatory skin conditions.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// GETTER FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export function getMicrobiomeBeautyGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_MICROBIOME_BEAUTY_GUIDES['west-african'],
    'south-asian': ETHNIC_MICROBIOME_BEAUTY_GUIDES['south-asian'],
    'caribbean': ETHNIC_MICROBIOME_BEAUTY_GUIDES['caribbean'],
    'arab': ETHNIC_MICROBIOME_BEAUTY_GUIDES['arab'],
    'latina': ETHNIC_MICROBIOME_BEAUTY_GUIDES['latina'],
    'east-asian': ETHNIC_MICROBIOME_BEAUTY_GUIDES['east-asian'],
    'east-african': ETHNIC_MICROBIOME_BEAUTY_GUIDES['east-african'],
    'south-african': ETHNIC_MICROBIOME_BEAUTY_GUIDES['south-african'],
    'black-american': ETHNIC_MICROBIOME_BEAUTY_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

export const MICROBIOME_BEAUTY_STATS = {
  moduleId: 'microbiome_beauty_ethnic_guide',
  communitiesCovered: 9,
  topicsCovered: ['microbiome science', 'traditional practices', 'fermented foods', 'gut-skin axis', 'microbiome disruptors'],
  version: '1.0.0',
};
