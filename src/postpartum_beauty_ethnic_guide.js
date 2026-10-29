/**
 * MIRRR — Postpartum Beauty Ethnic Guide
 * Beauty, wellness, and self-care practices during the postpartum period
 * across all 9 ethnic communities. The "fourth trimester" is one of the most
 * culturally rich and culturally distinct periods in a woman's beauty journey.
 */

export const ETHNIC_POSTPARTUM_BEAUTY_GUIDES = {
  'west-african': {
    communityId: 'west-african',
    communityName: 'West African',
    postpartumPhilosophy: 'In West African cultures, the postpartum period is a sacred time of restoration. New mothers are not expected to cook, clean, or care for themselves alone — the community surrounds them. "Omugwo" in Igbo tradition, "Ojojo" practices in Yoruba communities, and similar traditions across West Africa dedicate 40 days to 3 months of intensive care for the new mother. This isn\'t luxury — it is understood as essential medicine. The postpartum period is when a woman is most vulnerable and most in need of rebuilding her body, her beauty, and her spirit.',
    confinementPeriod: {
      name: 'Omugwo (Igbo), Posting (common West Africa term)',
      duration: '40 days minimum, traditionally 3 months',
      description: 'The mother-in-law or the new mother\'s own mother comes to stay and takes over all household duties and newborn care (except feeding). The new mother\'s only job is to rest, eat, and heal.',
      beautyBenefit: 'Profound rest enables hormonal stabilization, reduced cortisol, better sleep — all of which directly benefit skin recovery, hair health, and postpartum energy.',
    },
    steamingPractice: {
      name: 'Postpartum Steam Bath',
      description: 'Hot herbal steam baths are a universal West African postpartum practice. Steam baths may be full-body (sitting over a pot of herbal steam) or vaginal (for perineal healing, under careful traditional guidance).',
      herbs: ['Eucalyptus', 'Lemongrass', 'Neem leaves', 'Bitter leaf (Vernonia amygdalina)', 'Uziza leaves'],
      beautyBenefit: 'Opens pores, promotes skin rejuvenation, releases tension in the body that manifests as dull skin.',
    },
    bodyWrapping: {
      name: 'Kanga/Wrapper Belly Binding',
      description: 'Wrapping the abdomen after birth is a universal West African postpartum practice. A long strip of fabric (kanga, ankara fabric, or a traditional cloth) is wrapped firmly around the belly.',
      beautyBenefit: 'Supports abdominal muscles as they recover. Creates a feeling of being "held together" that many mothers describe as profoundly comforting.',
      modernEquivalent: 'Postpartum belly wraps/binders. Traditional fabric binding is just as effective and culturally meaningful.',
    },
    postpartumMassage: {
      name: 'Full-body Postpartum Massage',
      oils: ['Shea butter', 'Palm kernel oil', 'Coconut oil', 'Castor oil for stretch marks'],
      frequency: 'Daily in the first weeks if possible',
      beautyBenefit: 'Promotes lymphatic drainage, reduces postpartum swelling, begins to break down stretch marks, restores skin circulation.',
    },
    hairCare: {
      postpartumSheddingContext: 'Postpartum hair shedding (telogen effluvium) is universal — caused by the sharp drop in estrogen after birth. It typically peaks around 3-4 months postpartum and resolves by 6-12 months.',
      westAfricanApproach: [
        'Protective styling immediately after birth (cornrows, braids) to minimize manipulation and visible shedding',
        'Heavy conditioning with shea butter and coconut oil on the scalp',
        'Reduction of heat styling during the shedding phase',
        'Traditional black soap (dudu osun) scalp washes to maintain a clean, healthy scalp',
        'Moringa supplementation for hair-supporting nutrients',
      ],
      culturalNote: 'Some communities shave the head of the new mother as a symbolic "fresh start" — Yoruba and some other traditions. This is voluntary, and hair grows back healthier. The head shave is followed by scalp treatments.',
    },
    beautyFoods: [
      { food: 'Ofe Akwu / Banga Soup (Palm Nut Soup)', benefit: 'Carotenoids and vitamin E in palm oil for skin healing. Iron-rich for replenishing blood after birth. Traditional postpartum food across the Niger Delta.' },
      { food: 'Pepper Soup (Catfish or Goat)', benefit: 'One of the most important West African postpartum foods. The warming spices (uziza, uda, utazi) are believed to promote healing and "close the womb." Protein from meat for tissue repair.' },
      { food: 'Eba and Egusi Soup', benefit: 'Zinc in egusi melon seeds for wound healing and milk production. Hearty caloric base to support breastfeeding mothers.' },
      { food: 'Zobo (Hibiscus Drink)', benefit: 'Rich in iron and vitamin C. Anti-inflammatory. Helps replenish iron lost in birth.' },
      { food: 'Tiger Nut Milk (Kunu Aya)', benefit: 'Galactagogue (promotes breast milk production). Nutrient-dense. Prebiotic fiber for gut health.' },
    ],
    skincarePostpartum: {
      mainConcerns: ['Postpartum mask (melasma worse after pregnancy)', 'Stretch marks (striae gravidarum)', 'Dry, dull skin from sleep deprivation', 'Acne from hormonal fluctuation'],
      westAfricanRemedies: [
        { concern: 'Stretch marks', remedy: 'Shea butter applied daily from first trimester through postpartum. Cocoa butter (also widely used). Traditional black soap to keep area clean.', effectiveness: 'Cannot erase but significantly reduces appearance with consistent use.' },
        { concern: 'Postpartum melasma', remedy: 'Sun avoidance and SPF. Turmeric + honey mask for gradual brightening. Time (often resolves as hormones normalize).' },
        { concern: 'Dull skin', remedy: 'Gentle black soap cleanse. Shea butter + a few drops of rosehip oil. Rest when possible.' },
      ],
    },
  },

  'south-asian': {
    communityId: 'south-asian',
    communityName: 'South Asian',
    postpartumPhilosophy: 'The "jaappa" (sitting period) in South Asian tradition is a 40-day confinement in which the new mother is relieved of all household responsibilities. This practice exists across Hindu, Muslim, and Sikh communities in India, Pakistan, and the diaspora. Ayurveda is particularly sophisticated about the postpartum period — called "sutika paricharya" (postpartum care protocol) — understanding it as a time of extreme vata imbalance when the body needs grounding, warming, and nourishing treatments.',
    jaappa: {
      name: 'Jaappa / Chilla (40-day confinement)',
      duration: '40 days',
      practitioners: 'The new mother\'s mother typically comes to stay. In Pakistan this is "chilla."',
      restrictions: 'New mother does not cook, clean, go outdoors (in some traditions), or engage in social activities.',
      beautyBenefit: 'The enforced rest is the most powerful beauty treatment — sleep, reduced stress, and freedom from household work dramatically improve recovery.',
    },
    ayurvedicPostpartum: {
      vataImbalance: 'Childbirth dramatically increases vata dosha (air/space). The postpartum period requires bringing vata back into balance through warmth, heaviness, and routine.',
      treatments: [
        { treatment: 'Abhyanga (Daily Warm Oil Massage)', oils: 'Sesame oil (vata-pacifying), or specialized postpartum oils (shatavari oil)', frequency: 'Daily for 40 days', beautyBenefit: 'Profound skin nourishment, lymphatic drainage, hormonal support through the massage experience, reducing vata and cortisol.' },
        { treatment: 'Pinda Sweda (Rice Bolus Massage)', description: 'Warm boluses of cooked rice in herbs are applied to the body in a specialized massage technique.', beautyBenefit: 'Skin softening, deep nourishment, muscle recovery.' },
        { treatment: 'Talam (Head Treatment)', oils: 'Brahmi oil, bhringraj oil', method: 'Applied to the top of the head and scalp', beautyBenefit: 'Calms the nervous system, treats postpartum hair loss, promotes hair regrowth.' },
      ],
    },
    postpartumHerbs: [
      { herb: 'Shatavari (Asparagus racemosus)', benefit: 'The premier Ayurvedic herb for postpartum women. Supports milk production, hormone balancing, uterine recovery, and overall vitality. Also used for skin radiance.', use: 'Shatavari powder in warm milk (shatavari kalpa — traditional recipe). Shatavari supplements.' },
      { herb: 'Moringa (Drumstick / Shevaga)', benefit: 'Extremely high iron for blood replenishment. Calcium and complete protein for tissue repair and milk production.', use: 'Drumstick soup (saag). Moringa powder supplement.' },
      { herb: 'Ajwain (Carom Seeds)', benefit: 'Carminative — reduces gas and bloating (which is significant after cesarean or vaginal birth). Warming. Promotes uterine contraction.', use: 'Ajwain in dal and soups. Ajwain water (ajwain boiled in water) as a postpartum drink.' },
      { herb: 'Fenugreek (Methi)', benefit: 'Major galactagogue (increases breast milk supply). Iron. Diosgenin in fenugreek has estrogen-like activity that may support postpartum hormonal balance.', use: 'Methi dal. Methi ladoo (traditional postpartum sweet eaten by new mothers).' },
      { herb: 'Dink (Edible Gum / Gondh)', benefit: 'High in calcium and iron. Traditional postpartum food for bone strengthening after birth (which depletes calcium).', use: 'Gondh ladoo — traditional Marathi/Punjabi postpartum sweet made from edible gum, ghee, and wheat flour.' },
    ],
    postpartumBeautyFoods: [
      { food: 'Gondh Ladoo / Methi Ladoo / Ajwain Ladoo', benefit: 'Traditional postpartum sweets formulated with galactagogues, warming herbs, and high-calorie nourishment. A complete postpartum supplement in food form.' },
      { food: 'Haldi Doodh (Golden Milk with Ghee)', benefit: 'Turmeric (anti-inflammatory, wound healing), ghee (vata-pacifying, skin nourishing, butyrate for gut health), milk (calcium, protein). Daily postpartum ritual.' },
      { food: 'Panjiri', benefit: 'A Punjabi postpartum food made from wheat flour, ghee, jaggery, and various seeds and dried fruits. High calorie, warming, galactagogenic.' },
    ],
    hairCare: {
      postpartumSheddingApproach: [
        'Daily bhringraj or brahmi oil massage to the scalp — documented to reduce postpartum hair loss',
        'Gentle detangling, no harsh pulling',
        'Loose braiding during confinement',
        'Avoid shampoo for first few weeks (traditional) — dry clean or co-wash only',
        'Amla supplementation (high vitamin C supports collagen and hair follicle health)',
        'Iron supplementation if blood loss was significant at birth (common cause of postpartum hair loss beyond the normal hormonal shedding)',
      ],
    },
    skinCare: {
      majorConcerns: ['Melasma worsening from pregnancy hormones', 'Stretch marks', 'Dark circles from sleep deprivation', 'Hormonal acne'],
      remedies: [
        { concern: 'Melasma', remedy: 'Ubtan paste (turmeric + sandalwood + milk) applied 2-3x week. Strict sun avoidance. SPF daily. Give it 6-12 months as hormones stabilize.', caution: 'Avoid hydroquinone while breastfeeding. Azelaic acid is breastfeeding-safe for melasma treatment.' },
        { concern: 'Stretch marks', remedy: 'Coconut oil and almond oil — applied from early pregnancy. Kumkumadi tailam (Ayurvedic brightening oil) for fading established marks.' },
        { concern: 'Dark circles', remedy: 'Cold cucumber slices. Potato juice (skin brightening). Almond oil under eyes (traditional). Sleep when the baby sleeps — no topical product substitutes for rest.' },
      ],
    },
  },

  'caribbean': {
    communityId: 'caribbean',
    communityName: 'Caribbean',
    postpartumPhilosophy: 'Caribbean postpartum practice is centered on "binding," "washing," and "nourishing." The new mother is given intensive herbal treatments, belly binding, and communal support from women in the family and community. The grandmother\'s role is central — she is the keeper of herbal knowledge and postpartum wisdom. Each island has its own specific traditions, but the themes of warmth (heating treatments), herbal baths, belly binding, and special nourishing foods are universal across the Caribbean.',
    bushBathTradition: {
      description: 'Postpartum herbal bath is central to Caribbean recovery. "Bush baths" are prepared with specific medicinal herbs chosen for their healing, cleansing, and strengthening properties.',
      commonHerbs: [
        { herb: 'Cerasee (Momordica charantia)', benefit: 'Blood cleansing, anti-inflammatory, skin healing' },
        { herb: 'Soursop Leaves', benefit: 'Anti-inflammatory, calming, promotes sleep' },
        { herb: 'Fever Grass (Lemongrass)', benefit: 'Antibacterial, calming, reduces postpartum fever' },
        { herb: 'Neem', benefit: 'Antibacterial, skin healing, antifungal' },
        { herb: 'Bay Rum Leaves', benefit: 'Traditional Caribbean healing herb. Cooling.' },
        { herb: 'St. John\'s Bush', benefit: 'Wound healing, skin recovery' },
      ],
      preparation: 'Simmer herbs in large pot of water. Let cool until warm (not hot). Pour over body or soak. Used from first week postpartum.',
    },
    bellyBinding: {
      caribbeanApproach: 'Belly binding in the Caribbean uses strips of white cotton cloth, old sheets, or specialized binders. Some Trinidadian and Jamaican traditions use warm oil (coconut or castor oil) rubbed on the abdomen before binding.',
      duration: '6 weeks minimum',
    },
    caribbeanPostpartumFoods: [
      { food: 'Mannish Water (Jamaica)', description: 'A soup made from goat head and feet with scotch bonnet peppers, cho cho, and herbs. Considered one of the most powerful postpartum recovery foods.', benefit: 'Collagen from bones and cartilage (bone broth effect), high protein, galactagogue properties attributed in folk medicine.' },
      { food: 'Carrot Juice', benefit: 'Beta-carotene (pro-vitamin A) for skin repair. Antioxidant. Natural source of energy.' },
      { food: 'Sea Moss Drink', benefit: 'Mineral-dense (92 minerals). Supports gut health. Traditional Caribbean postpartum supplement. Iodine for thyroid (which fluctuates postpartum).' },
      { food: 'Brown Stew Chicken with Root Vegetables', benefit: 'Protein, iron, and warming spices. Provides substantial nutrition for breastfeeding.' },
      { food: 'Pepperpot Soup', benefit: 'Warming, iron-rich, protein-dense. Traditional communal Caribbean healing food.' },
    ],
    hairCare: {
      postpartumApproach: 'Caribbean new mothers typically wear their hair in protective styles — braids, twists, or wrapped — during the postpartum period for convenience and protection.',
      treatments: [
        'Coconut oil scalp massage (coconut oil is ubiquitous across the Caribbean for hair care)',
        'Aloe vera from the yard applied to scalp for shedding hair',
        'Rosemary-infused coconut oil for hair growth support',
        'Braids or twists as protective styles during recovery',
      ],
    },
    skinCare: {
      caribbeanMothersApproach: [
        'Coconut oil as primary body moisturizer',
        'Aloe vera for any skin irritation or PIH from stretch marks',
        'Shea butter for stretch marks (widely available in Caribbean communities)',
        'SPF is critical given the intense Caribbean sun and postpartum hyperpigmentation vulnerability',
      ],
    },
  },

  'arab': {
    communityId: 'arab',
    communityName: 'Arab Middle Eastern',
    postpartumPhilosophy: 'The Arab postpartum period (called "nifas" period in Islamic tradition — the 40-day postpartum window recognized in Islamic jurisprudence) is a sacred time of recovery. The new mother is relieved of her religious obligations (prayer, fasting) during nifas, which positions postpartum rest as divinely sanctioned rather than optional. The mother\'s mother or mother-in-law typically moves in to care for the household. There is a strong tradition of specific postpartum foods (especially dates, warm drinks, and warm soups) and warming treatments.',
    nifasPeriod: {
      name: 'Nifas (Islamic Postpartum Period)',
      duration: '40 days (maximum in Islamic jurisprudence)',
      significance: 'The new mother is excused from prayer and fasting during nifas, which frames rest as religiously endorsed.',
      beautyBenefit: 'The 40-day recovery period — enforced by religious tradition — provides a framework for the rest that beauty and health require.',
    },
    arabPostpartumTreatments: [
      {
        treatment: 'Warm Henna Application',
        timing: 'After the 40-day nifas period, as a celebratory return to normal life',
        description: 'In many Arab communities, the new mother receives a henna party after emerging from her confinement — a celebration of her recovery and beauty.',
        beautyBenefit: 'Henna on the hair — deep conditioning and color. Henna on hands and feet — celebration, beauty, natural antifungal.',
      },
      {
        treatment: 'Hammam (After Nifas)',
        description: 'A full hammam session after the nifas period ends is a traditional celebratory and cleansing practice.',
        beautyBenefit: 'Deep skin exfoliation and cleansing, lymphatic stimulation, the psychological benefit of a full beauty ritual after recovery.',
      },
      {
        treatment: 'Warm Oil Massage',
        oils: 'Olive oil, black seed oil, argan oil',
        frequency: 'Daily for the first 40 days',
        beautyBenefit: 'Skin recovery, stretch mark treatment, lymphatic drainage, postpartum swelling reduction.',
      },
      {
        treatment: 'Belly Binding (Sharshaf)',
        description: 'Abdominal binding using a long cloth (sometimes a sharshaf, a traditional garment) is practiced across Arab cultures.',
        beautyBenefit: 'Abdominal muscle support, postpartum shape recovery.',
      },
    ],
    postpartumFoods: [
      { food: 'Dates (Tamr)', benefit: 'The prophetically recommended postpartum food. Rich in iron, natural sugars, magnesium, and oxytocin-releasing compounds that help the uterus contract. Extremely high in calcium.' },
      { food: 'Helbeh (Fenugreek Tea)', benefit: 'The most important Arab postpartum drink. Strongly galactagogue. Warming. Used across the Middle East and North Africa for new mothers.' },
      { food: 'Ogga / Ogat (Traditional Postpartum Sweet)', description: 'A traditional Yemeni and Gulf postpartum food — a rich cake/bread made with sesame, fenugreek, honey, and ghee.', benefit: 'High calorie nourishment. Galactagogue seeds. Traditional postpartum food delivered to new mothers by family and neighbors.' },
      { food: 'Mloukhiyeh / Mulukhiyah (Jute Leaf Soup)', benefit: 'Iron-rich green leaves. Anti-inflammatory. Considered a healing food for new mothers across the Levant and Egypt.' },
      { food: 'Bone Broth (Marak Edam)', benefit: 'Collagen from bones (skin healing, stretch marks). Glycine for sleep quality. Minerals depleted in birth. A universal healing food in Arab tradition.' },
    ],
    hairCare: {
      approach: [
        'Avoid washing hair during nifas (varies by tradition and scholar — some permit washing)',
        'Black seed (habbatus sauda) oil applied to the scalp for hair loss prevention',
        'Argan oil scalp treatments after the nifas period',
        'Conservative hair covering under hijab during the sensitive postpartum period',
      ],
    },
    skinCare: {
      mainConcerns: ['Postpartum melasma (very common in Arab women due to higher baseline melanin and sun exposure)', 'Stretch marks', 'Dull skin from fatigue'],
      remedies: [
        { concern: 'Melasma', remedy: 'Saffron + camel milk mask. Strict SPF (SPF 50+). Vitamin C serum (breastfeeding safe). Time — often resolves as estrogen normalizes.' },
        { concern: 'Stretch marks', remedy: 'Olive oil applied from early pregnancy through postpartum. Argan oil massaged into stretch marks. Kessa exfoliation once healed to improve texture.' },
      ],
    },
  },

  'latina': {
    communityId: 'latina',
    communityName: 'Latina',
    postpartumPhilosophy: 'La cuarentena (the 40-day postpartum quarantine) is one of Latin America\'s most important cultural health practices. Like the Asian and African 40-day traditions, it reflects an ancient understanding that the postpartum period requires intensive recovery. The rules of la cuarentena vary by country and family tradition, but typically involve: no cold drinks or cold food, no cold water on the skin, no heavy lifting, no going outside in cold weather, and being cared for by the grandmother or other female family members. "Estar en cuarentena" is expected and honored.',
    laCuarentena: {
      name: 'La Cuarentena (The Quarantine)',
      duration: '40 days',
      beliefs: [
        'Cold food and drinks slow healing and can reduce breast milk',
        'The "open" postpartum body is vulnerable to "mal aire" (bad air)',
        'Rest is the most important medicine',
        'The new mother must not exert herself or do housework',
      ],
      beautyBenefit: 'Rest, warmth, and nourishment are the most powerful beauty medicines for postpartum recovery. La cuarentena enforces all three.',
    },
    warmingPractice: {
      description: 'Warmth is central to Latina postpartum healing — in food, drinks, bathing, and body treatments.',
      practices: [
        'Warm herbal teas (manzanilla, jengibre, canela) multiple times daily',
        'Warm sponge baths with herbal infusions during the first week',
        'Warm abdominal massage with olive oil or coconut oil',
        'Warming foods (caldos, sopas) — no cold foods',
      ],
    },
    bellyBinding: {
      name: 'Faja (Belly Wrap)',
      description: 'Belly binding with a faja (a long cloth or specialized binder) is practiced across Latin America. This is one of the most important postpartum beauty and recovery practices.',
      method: 'A faja is wrapped firmly around the abdomen, beginning soon after birth, and worn for 6-12 weeks.',
      beautyBenefit: 'Supports abdominal muscle recovery, reduces postpartum "apron" appearance, provides comfort that helps new mothers move more freely.',
    },
    hierbas: [
      { herb: 'Manzanilla (Chamomile)', benefit: 'Anti-inflammatory, calming. Chamomile tea throughout the day for stress reduction and gut health.', skinUse: 'Cooled chamomile tea as eye compress for dark circles and puffiness.' },
      { herb: 'Jengibre (Ginger)', benefit: 'Anti-inflammatory, warming. Digestive support. Lactation support (mild galactagogue).', use: 'Ginger tea with honey and lemon. Fresh ginger in caldos.' },
      { herb: 'Canela (Cinnamon)', benefit: 'Warming spice with anti-inflammatory and blood sugar stabilizing properties.', use: 'Canela tea. Added to atole and caldos.' },
      { herb: 'Romero (Rosemary)', benefit: 'Hair growth stimulation. Anti-inflammatory.', hairUse: 'Rosemary rinse for postpartum hair loss. Rosemary-infused oil for scalp massage.' },
      { herb: 'Ruda (Rue)', benefit: 'Used in spiritual cleansing during la cuarentena.', caution: 'FOR EXTERNAL/SPIRITUAL USE ONLY. Toxic internally and absolutely contraindicated in pregnancy and breastfeeding.' },
      { herb: 'Aloe Vera', benefit: 'Skin healing for stretch marks, C-section scar, and any skin irritation.', use: 'Fresh gel applied directly.' },
    ],
    postpartumFoods: [
      { food: 'Caldo de Pollo / Caldo de Res (Chicken or Beef Broth)', benefit: 'THE central Latina postpartum food. Collagen from the bones (skin healing), protein, electrolytes, warming. Made with vegetables and herbs.' },
      { food: 'Atole (Hot Corn Drink)', benefit: 'Warming, easy to digest, caloric support for breastfeeding. Traditional corn-based drink thickened with masa.' },
      { food: 'Nopal (Cactus)', benefit: 'Anti-inflammatory. Vitamin C for collagen synthesis. Fiber for gut health post-birth.' },
      { food: 'Pozole', benefit: 'Hominy (nixtamal), broth, and meat — traditionally made for postpartum mothers in Mexico. Protein and caloric density.' },
      { food: 'Chocolate Caliente (Hot Chocolate with Cinnamon)', benefit: 'Theobromine in cacao is a mild mood elevator. Iron (cacao). Warming. Culturally important comfort food.' },
    ],
    hairCare: {
      approach: [
        'Trenzas (braids) during la cuarentena — protective and practical',
        'Rosemary rinse for postpartum hair loss',
        'Scalp massage with coconut or olive oil',
        'Castor oil on the scalp for thick hair regrowth',
        'Avoid harsh shampoos during the shedding phase',
      ],
    },
    skinCare: {
      stretchMarks: [
        'Cocoa butter applied from early pregnancy — a staple of Latina pregnancy skincare',
        'Vitamin E oil on established stretch marks',
        'Aloe vera gel on C-section scar (once fully closed, never on open wound)',
        'Cucumber and potato slices for dark circles',
      ],
      melasmaConcerns: 'Melasma is the "pregnancy mask" — very common in Latina women. After la cuarentena, SPF every day and vitamin C serum are the mainstays. Strict sun avoidance is critical.',
    },
  },

  'east-asian': {
    communityId: 'east-asian',
    communityName: 'East Asian',
    postpartumPhilosophy: '"Zuò yuèzi" (做月子) in Chinese, "sanhu" in Korean, "satogaeri bunben" (hometown birth) in Japan — the East Asian postpartum tradition of a dedicated recovery month is one of the world\'s most developed and sophisticated postpartum care systems. In Chinese tradition, zuò yuèzi is not just recommended — in many families it is mandatory. Hundreds of specific rules govern food, behavior, temperature exposure, and rest during the recovery month. Modern China has developed "yuèzi zhōngxīn" (confinement centers) — professional postpartum care facilities where new mothers stay for 30-40 days.',
    zuoYuezi: {
      name: 'Zuò Yuèzi (做月子) — "Doing the Month"',
      duration: '30–40 days (sometimes longer)',
      principleOfCold: 'The foundational belief: the new mother\'s body is "cold" and "open" after birth. Everything that enters — food, water, air on skin — must be warm. Cold is the enemy of postpartum recovery.',
      rules: [
        'No cold or raw foods — all food must be warm and cooked',
        'No cold water — even handwashing uses warm water in strict traditions',
        'No washing hair for the first month (in traditional practice) — can be modified to washing infrequently with very warm water',
        'No wind or cold air — windows closed, warm room',
        'No crying or strong negative emotions',
        'Complete bed rest for first two weeks',
        'No reading or excessive screen time (protects eyes, which are believed to weaken postpartum)',
        'No stairs, no going outside',
      ],
    },
    postpartumFoodsZuoYuezi: [
      { food: 'Pig Trotter and Peanut Soup (猪脚花生汤)', benefit: 'Classic Chinese postpartum food. Collagen and gelatin from pig trotters — the original bone broth for postpartum skin and joint recovery. Peanuts are a galactagogue.' },
      { food: 'Sesame Oil Chicken (麻油雞)', benefit: 'Taiwanese postpartum dish. Sesame oil has warming properties. Chicken provides protein and collagen. Cooked in rice wine — warming and believed to promote blood flow.' },
      { food: 'Sheng Hua Tang (生化湯)', description: 'A Traditional Chinese Medicine herbal formula specifically designed for postpartum: dang gui (angelica), chuan xiong, tao ren (peach kernel), pao jiang (charred ginger), and gan cao (licorice).', benefit: 'Promotes uterine contraction and clearing of lochia (postpartum discharge). Not for Western use without TCM guidance.' },
      { food: 'Red Date (Jujube) Tea', benefit: 'Blood-building in TCM theory. Iron for replenishing blood lost in birth. Sweet, warming, calming.' },
      { food: 'Black Bean Rice Wine Soup', benefit: 'Black beans (kidney qi support in TCM — associated with hair health and aging). Rice wine (warming). A classic postpartum dish in Taiwan.' },
      { food: 'Pumpkin Porridge (Hobak Juk) — Korean', benefit: 'Korean postpartum porridge. Easy to digest. Beta-carotene. Gentle on the postpartum digestive system.' },
    ],
    koreanSanhu: {
      name: 'Sanhu (산후) — Korean Postpartum Care',
      characteristics: [
        'Seaweed soup (miyeok guk) eaten every day — rich in iodine, calcium, and minerals. Eaten on birthdays to honor the mother\'s sacrifice.',
        'Warm rice porridge (juk) — gentle on digestion',
        'Traditional warm foot baths with mugwort (ssuktal)',
        'Avoidance of cold air and cold food',
      ],
    },
    japanesePostpartum: {
      name: 'Satogaeri Bunben — Returning to the Natal Home',
      description: 'Japanese tradition of the new mother returning to her parents\' home for the birth and postpartum period, where her own mother cares for her.',
      foods: ['Kabocha soup (pumpkin — vitamin A)', 'Miso soup (probiotics, minerals)', 'Rice porridge (okayu) — easy to digest', 'Broiled salmon (protein, omega-3 for mood and inflammation)'],
    },
    hairCare: {
      traditionalApproach: 'Traditional East Asian postpartum practice discourages washing hair frequently in the first month (to avoid exposure to cold). Modern practice modifies this to washing with warm water only, using a hair dryer immediately.',
      practices: [
        'Gua sha scalp massage to promote circulation and address postpartum hair loss',
        'Black sesame seed oil for scalp — kidney qi support in TCM, associated with hair health',
        'Gentle combing to distribute scalp oil',
        'Protective loose braid or bun to minimize shedding visibility',
        'Ginseng hair serums for regrowth',
      ],
    },
    skinCare: {
      concerns: ['Postpartum melasma', 'Dark circles (chronic)', 'Skin dullness from sleep deprivation'],
      tcmApproach: [
        'Blood-building foods (dates, dang gui, black sesame) — in TCM, many postpartum skin issues stem from "blood deficiency"',
        'Adequate sleep prioritized over all skincare products',
        'Pearl powder (珍珠粉) — traditional Chinese beauty powder applied to skin or taken internally for brightening',
        'Gua sha for facial circulation once cleared by provider',
        'Rice water facial rinse (traditional Japanese and Korean practice)',
      ],
    },
  },

  'east-african': {
    communityId: 'east-african',
    communityName: 'East African',
    postpartumPhilosophy: 'East African postpartum traditions vary across the region\'s diverse cultures but share common themes of community, warmth, and nourishment. In Ethiopia, the "ye lemen ager" (staying home period) of 40 days is observed. In Somalia, the postpartum period ("xabad") involves special foods and rest. In Kenya and Tanzania, traditional practices vary by ethnic group (Kikuyu, Maasai, Swahili) but universally emphasize the role of the mother\'s mother in care. The Horn of Africa\'s Islamic traditions add the nifas framework.',
    ethiopianPostpartum: {
      description: 'Ethiopian postpartum care focuses on warming the new mother\'s body with teff-based foods, butter, and herbal remedies.',
      practices: [
        { practice: 'Butter Application', description: 'Clarified Ethiopian butter (tesmi) applied to the body — especially the breasts and abdomen — as a warming and skin-nourishing treatment.' },
        { practice: 'Coffee Ceremony for the New Mother', description: 'The Ethiopian coffee ceremony serves as a postpartum community ritual — gathering women around the new mother for social support, which has measurable wellness effects.' },
        { practice: 'Incense and Frankincense', description: 'Frankincense is burned in the postpartum room for air purification, spiritual protection, and the aromatherapy benefit of boswellic acids.' },
      ],
      postpartumFoods: [
        { food: 'Injera', benefit: 'Fermented teff — iron-rich, probiotic. The base of Ethiopian food, providing nutrition for recovery.' },
        { food: 'Kitfo (Ethiopian Beef Tartare / Steak Tartare)', benefit: 'High protein and iron — critical for replenishing blood after birth. Eaten with herbed butter and mitmita (spice mix).' },
        { food: 'Yemisir Kik (Red Lentil Stew)', benefit: 'Plant-based iron, protein, fiber. Anti-inflammatory berbere spices.' },
        { food: 'Niter Kibbeh (Ethiopian Spiced Butter)', benefit: 'Warming, high-fat, spice-rich — ginger, turmeric, and other anti-inflammatories in the spice blend.' },
      ],
    },
    somaliPostpartum: {
      description: 'Somali postpartum care draws from Islamic tradition (nifas) and Somali cultural practice.',
      practices: [
        { practice: 'Malmal (Frankincense Smoke)', description: 'Frankincense smoke is used in a postpartum ritual where the new mother leans over the smoke — a form of postpartum steam treatment and spiritual purification.' },
        { practice: 'Xabad (Postpartum Period Foods)', foods: ['Camel milk — mineral-rich', 'Xalwa (Somali halwa sweet) — high calorie', 'Suqaar (spiced meat) — iron and protein'] },
      ],
    },
    beautyFoods: [
      { food: 'Camel Milk', benefit: 'Extraordinarily rich in protective proteins and vitamin C. Iron. Used across the Horn of Africa as a postpartum fortifier.' },
      { food: 'Frankincense-infused Honey', benefit: 'Honey provides energy and antibacterial properties. Frankincense resin contributes anti-inflammatory boswellic compounds.' },
    ],
    hairCare: {
      approach: [
        'Natural oil treatments — Ethiopian women traditionally use niter kibbeh (spiced butter) on the hair in some communities',
        'Protective styles during the postpartum recovery period',
        'Frankincense-infused oil as a scalp treatment for hair loss',
        'Henna on the hair for strengthening (in Islamic East African communities) after the nifas period',
      ],
    },
    skinCare: {
      east_african_approaches: [
        'Camel milk topically as a skin treatment for postpartum dullness',
        'Honey mask for healing any skin trauma (C-section area once healed, stretch marks)',
        'Frankincense oil (boswellia) as a facial treatment for scar healing and skin regeneration',
        'Turmeric paste for skin brightening',
      ],
    },
  },

  'south-african': {
    communityId: 'south-african',
    communityName: 'South African',
    postpartumPhilosophy: 'South African postpartum practices reflect the nation\'s diversity — Zulu, Xhosa, Sotho, Cape Malay, and other communities each have distinct traditions. The ubuntu principle of communal care ("it takes a village to raise a child" has African roots) means the new mother is not alone. Traditional healers (izinyanga, sangomas) may be consulted for postpartum health. Cape Malay communities practice traditions with Malay-Islamic roots including a 40-day recovery period. Zulu traditions include specific postpartum restrictions and strengthening foods.',
    zuluPostpartum: {
      name: 'Ukuzala (Postpartum Period)',
      practices: [
        { practice: 'Isihlambezo (Herbal Preparation)', description: 'Zulu herbal preparations taken during pregnancy and postpartum. Specific plants vary by healer.', beautyNote: 'Support for postpartum recovery from within.' },
        { practice: 'Omama Encane (Young Mother\'s Support Network)', description: 'Community of women who support the new mother. Community care is itself a wellness and beauty practice.' },
        { practice: 'Postpartum Herbal Baths', herbs: ['Umhlonyana (Artemisia afra — African wormwood)', 'Aloe ferox', 'Rooibos'], benefit: 'Cleansing, skin healing, anti-inflammatory.' },
      ],
    },
    capeMalayPostpartum: {
      duration: '40 days (reflecting Islamic nifas tradition)',
      practices: [
        'Warm spiced foods (koesisters, bobotie, spiced teas)',
        'Henna celebration after the 40 days',
        'Abdominal binding with cloth',
        'Family-centered care with the new grandmother taking the lead',
      ],
    },
    endemicPlantPostpartum: [
      { plant: 'Aloe Ferox', use: 'Applied to stretch marks, C-section scar (once healed), and for general skin healing.', benefit: 'More potent healing polysaccharides than standard aloe vera.' },
      { plant: 'Rooibos', use: 'Bath additive, consumed as tea.', benefit: 'Aspalathin antioxidant for skin recovery. Anti-inflammatory for postpartum inflammation.' },
      { plant: 'Buchu', use: 'Tea and topical treatment.', benefit: 'Antibacterial, anti-inflammatory. Traditional healing herb for female reproductive health.' },
      { plant: 'Marula Oil', use: 'Applied to stretch marks, C-section scar, and as a facial oil.', benefit: 'Oleic acid deeply penetrates skin. Anti-inflammatory. Skin regeneration.' },
    ],
    postpartumFoods: [
      { food: 'Umngqusho (Samp and Beans)', benefit: 'Protein from beans. Complex carbohydrates for sustained energy during breastfeeding. Traditional South African healing food.' },
      { food: 'Pap (Maize Porridge)', benefit: 'The staple base food. B vitamins, energy, easy to prepare.' },
      { food: 'Imifino (Wild Greens)', benefit: 'Traditional South African wild greens — iron, calcium, vitamin A. More nutritious than cultivated greens in many cases.' },
      { food: 'Marula Fruit', benefit: 'Extraordinary vitamin C content. Antioxidant. The fruit of the tree that produces the famous marula oil.' },
    ],
    hairCare: {
      approaches: [
        'Marula oil scalp massage for postpartum hair loss',
        'Protective styles — braids, weaves — during recovery',
        'Rooibos tea rinse for scalp health',
        'Aloe ferox gel on the scalp for shedding',
      ],
    },
    skinCare: {
      postpartumSkinApproaches: [
        'Marula oil as the primary facial oil — absorbs quickly and is non-comedogenic',
        'Rooibos toner (cooled rooibos tea)',
        'Aloe ferox gel for any inflammation',
        'SPF critical — South African sun is intense and postpartum skin is hyperpigmentation-prone',
        'Buchu-infused products for skin healing',
      ],
    },
  },

  'black-american': {
    communityId: 'black-american',
    communityName: 'Black American',
    postpartumPhilosophy: 'The Black American postpartum experience is shaped by both rich African heritage traditions and the realities of navigating healthcare disparities that create disproportionate maternal health risks. Black American women face a 2-3x higher rate of maternal mortality than white American women — a crisis that has catalyzed a powerful Black maternal health movement. Postpartum self-care for Black women is therefore both a beauty and a survival imperative. The "Black girl wellness" movement — represented by voices like Tricia Hersey (The Nap Ministry), Black Mamas Matter Alliance, and the postpartum community of Black mothers online — is reclaiming the right to rest, care, and beauty that Black women have historically been denied.',
    blackMaternalHealth: {
      context: 'Black women experience significantly higher rates of maternal and postpartum complications — including postpartum hemorrhage, severe preeclampsia, and postpartum depression — often due to systemic factors including bias in pain management and dismissal of concerns by healthcare providers.',
      advocacy: [
        'Know your rights — you have the right to be heard and taken seriously',
        'Build your "village" — community care is both cultural and practical necessity',
        'Document everything — keep a symptom journal',
        'Trust your body — advocate loudly for yourself',
      ],
    },
    restAsResistance: {
      description: '"Rest is Resistance" — Tricia Hersey\'s framework from The Nap Ministry — is particularly resonant for Black postpartum women. The right to rest, to be cared for, and to recover fully is an act of resistance against systems that have historically demanded labor from Black women\'s bodies without adequate care.',
      beautyConnection: 'Rest is the most powerful postpartum beauty treatment. Sleep deprivation drives cortisol elevation, hormonal disruption, immune compromise, and premature aging.',
    },
    community: {
      description: 'The "village" — extended family, church community, neighborhood, online community — is central to Black American postpartum wellbeing.',
      practicalBeauty: [
        'Meal trains organized by church communities (nourishment = beauty)',
        'Hair-braiding parties where friends braid the new mother\'s hair in protective styles',
        '"Postpartum pamper sessions" — friends bringing self-care products and helping with baby care so the mother can rest',
        'Online communities (Black Mothers\' Forum, Black Mamas Facebook groups) providing emotional support',
      ],
    },
    blackGirlPostpartumSelfCare: [
      {
        practice: 'The 40-Day Commitment',
        description: 'Even without a formal cultural confinement tradition, many Black American mothers are consciously adopting a "40-day recovery" framework — setting limits on visitors and activities for the first 40 days.',
      },
      {
        practice: 'The Postpartum Satin Bonnet & Silk Pillowcase',
        description: 'Essential Black girl postpartum sleep protection. Protects natural hair while sleeping and reduces friction on skin.',
      },
      {
        practice: 'Sunday Reset for Postpartum Moms',
        description: 'Adapting the cultural Sunday Reset practice to postpartum reality. When someone takes the baby: a shower, deep conditioning hair treatment, face mask, and body oil application.',
      },
    ],
    postpartumHair: {
      reality: 'Postpartum hair shedding can be particularly visible and distressing for Black women with natural hair, where the shed hair becomes visible during detangling and washing.',
      approach: [
        'Protective styles (braids, twists, wigs) immediately postpartum — both practical and reduces visible shedding anxiety',
        'Jamaican Black Castor Oil (JBCO) scalp massage 2-3x week for circulation and follicle support',
        'Low manipulation — no daily combing during the shedding phase',
        'Silk/satin bonnet at night',
        'Keep braids at lower tension — traction alopecia is already a concern, and postpartum hair is more fragile',
        'Iron supplements if blood loss was significant (common cause of excessive postpartum shedding beyond normal)',
        'Know that it resolves — postpartum shedding peaks at 3-4 months and typically resolves by 12 months',
      ],
    },
    postpartumSkin: {
      concerns: ['Postpartum melasma on already melanin-rich skin — can be very pronounced', 'Stretch marks', 'Dark circles', 'Hormonal acne', 'Eczema flares (stress-related)'],
      approaches: [
        { concern: 'Stretch marks', remedy: 'Shea butter (the classic Black beauty staple). Bio Oil. Palmer\'s Cocoa Butter. Mederma. Start in pregnancy. Continue daily postpartum.' },
        { concern: 'Melasma', remedy: 'SPF 50+ daily — CRITICAL. Vitamin C serum (breastfeeding safe). Azelaic acid (breastfeeding safe). Time (often resolves with hormone stabilization). Do not use hydroquinone while breastfeeding.' },
        { concern: 'Postpartum glow loss', remedy: 'Rest is the only fix. When rest is limited: hydrating tinted moisturizer, mascara, and a good lip color are the "emergency glow" kit.' },
        { concern: 'Under-eye darkness', remedy: 'Caffeine eye cream (reduces puffiness). Vitamin K cream (reduces darkness). Cold compress. None of these substitute for sleep.' },
      ],
    },
    postpartumFoods: [
      { food: 'Oxtail Soup', benefit: 'Collagen-rich bone broth. Iron from the meat. Warming and hearty. A soul food staple with genuine postpartum healing benefit.' },
      { food: 'Collard Greens', benefit: 'Iron for blood replenishment. Vitamin K for wound healing. Vitamin C for collagen and immune support. The ultimate soul food superfood.' },
      { food: 'Sweet Potato', benefit: 'Beta-carotene (pro-vitamin A) for skin healing. Vitamin C. Natural sweetness that supports mood.' },
      { food: 'Black-Eyed Peas', benefit: 'Iron, folate, protein. Traditional New Year\'s food with genuine nutritional benefit.' },
      { food: 'Salmon / Catfish', benefit: 'Omega-3 fatty acids for postpartum mood (DHA supplementation during postpartum is linked to reduced postpartum depression risk). Protein for tissue repair.' },
      { food: 'Elderberry Syrup', benefit: 'Immune support during the vulnerable postpartum period. Anti-viral. Now widely used in Black wellness communities.' },
    ],
    postpartumMentalHealth: {
      importance: 'Postpartum depression and postpartum anxiety affect 1 in 5 new mothers, but Black women are less likely to receive treatment due to stigma and systemic barriers. Mental health IS beauty health — the physical symptoms of depression (dull skin, hair loss, poor self-care) are real.',
      resources: [
        'Postpartum Support International (PSI) — postpartum.net — has a warmline',
        'Therapy for Black Girls (therapyforblackgirls.com) — Black therapist directory',
        'Black Emotional and Mental Health Collective (BEAM)',
        'Speak to your OB or midwife honestly about how you are feeling emotionally',
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL POSTPARTUM BEAUTY
// ─────────────────────────────────────────────────────────────────────────────

export const UNIVERSAL_POSTPARTUM_BEAUTY = {
  postpartumHairSheddingFacts: {
    name: 'Telogen Effluvium (Postpartum Hair Loss)',
    mechanism: 'During pregnancy, elevated estrogen extends the hair growth phase, resulting in lush pregnancy hair. After birth, estrogen drops sharply, and all that extended-growth hair enters the shedding phase simultaneously.',
    timeline: 'Begins: 3-4 months postpartum. Peaks: around 4 months. Resolves: 6-12 months postpartum.',
    isItNormal: 'YES — completely normal. The average person loses 50-100 hairs per day; postpartum shedding can be 300-400 per day but this is temporary.',
    whenToWorryAndSeeDoctor: 'If shedding continues beyond 12 months postpartum, or is accompanied by other symptoms (extreme fatigue, cold intolerance, heart palpitations) — rule out thyroid issues, which are common postpartum.',
    universalTips: [
      'Protective styles to minimize visible shedding and reduce manipulation',
      'Gentle hair care — wide-tooth comb, no heat, no tight styles',
      'Biotin-rich foods (eggs, almonds, sweet potato)',
      'Iron supplementation if blood loss at birth was significant',
      'Scalp massage to promote circulation',
      'Know it is temporary — regrowth will come',
    ],
  },

  postpartumSkinChanges: {
    commonChanges: [
      { change: 'Melasma ("pregnancy mask")', description: 'Hyperpigmentation from elevated estrogen during pregnancy. May worsen immediately postpartum before improving.', timeline: 'Can take 6-12 months to fade after hormone normalization. Sun avoidance is the most important intervention.' },
      { change: 'Postpartum acne', description: 'Hormonal fluctuations postpartum can trigger acne, especially in women who had clear skin during pregnancy.', management: 'Gentle cleanser. Non-comedogenic moisturizer. Avoid picking. Azelaic acid and benzoyl peroxide are considered breastfeeding-safe — check with provider.' },
      { change: 'Stretch marks (Striae gravidarum)', description: 'Occur when skin stretches faster than collagen can keep up. Initially appear red/purple; fade to silver/white over 1-2 years.', management: 'Cannot be fully prevented. Consistent moisturization (shea, cocoa butter, bio oil) from early pregnancy reduces severity. No topical product removes established stretch marks completely.' },
      { change: 'Dull, tired complexion', description: 'Sleep deprivation, stress, and nutritional depletion combine to produce the classic "new mom look."', management: 'Sleep is the real fix. Hydrating products, vitamin C, tinted moisturizer, and mascara are the "emergency glow" kit for tough days.' },
    ],
  },

  safeBeautyForBreastfeeding: {
    avoidWhileBreastfeeding: [
      'Retinol / retinoids (Retin-A, tretinoin, adapalene)',
      'Hydroquinone (skin lightening agent)',
      'High-dose salicylic acid (low concentrations in face wash are considered okay)',
      'Self-tanner (dihydroxyacetone) — inconclusive, many choose to avoid',
      'Chemical sunscreens (many opt for mineral-only while breastfeeding)',
    ],
    safeWhileBreastfeeding: [
      'Azelaic acid (effective for melasma and acne)',
      'Vitamin C serum (L-ascorbic acid or ascorbyl glucoside)',
      'Niacinamide',
      'Hyaluronic acid',
      'Glycolic acid (low percentages)',
      'Mineral sunscreen (zinc oxide, titanium dioxide)',
      'Benzoyl peroxide (2.5–5%) for acne',
    ],
    alwaysConsultProvider: 'This is general guidance only. Always consult your OB, midwife, or dermatologist for personalized advice, especially if using prescription products.',
  },

  restAsBeautyMedicine: {
    whySleepIsTheUltimateBeautyProduct: [
      'Growth hormone — secreted during deep sleep — drives cell repair and collagen synthesis',
      'Cortisol drops to its lowest point during quality sleep — reducing inflammation that drives aging, acne, and dullness',
      'Blood flow to skin increases during sleep — delivering oxygen and nutrients to skin cells',
      'Lymphatic drainage is most active during sleep — reducing puffiness',
    ],
    sleepStrategyForNewMothers: [
      '"Sleep when the baby sleeps" — the single most repeated and most ignored postpartum advice. It is also the most important beauty advice.',
      'Take shifts with a partner or support person',
      'Accept offers of help so you can sleep',
      'Prioritize sleep over phone use during baby\'s sleep windows',
      'Silk/satin pillowcase — reduces friction on sleep-deprived skin and hair',
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export function getPostpartumBeautyGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_POSTPARTUM_BEAUTY_GUIDES['west-african'],
    'south-asian': ETHNIC_POSTPARTUM_BEAUTY_GUIDES['south-asian'],
    'caribbean': ETHNIC_POSTPARTUM_BEAUTY_GUIDES['caribbean'],
    'arab': ETHNIC_POSTPARTUM_BEAUTY_GUIDES['arab'],
    'latina': ETHNIC_POSTPARTUM_BEAUTY_GUIDES['latina'],
    'east-asian': ETHNIC_POSTPARTUM_BEAUTY_GUIDES['east-asian'],
    'east-african': ETHNIC_POSTPARTUM_BEAUTY_GUIDES['east-african'],
    'south-african': ETHNIC_POSTPARTUM_BEAUTY_GUIDES['south-african'],
    'black-american': ETHNIC_POSTPARTUM_BEAUTY_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

export const POSTPARTUM_BEAUTY_STATS = {
  moduleId: 'postpartum_beauty_ethnic_guide',
  communitiesCovered: 9,
  postpartumTraditionsCovered: 12,
  herbsAndFoodsCovered: 55,
  version: '1.0.0',
};
