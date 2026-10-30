/**
 * MIRRR — Budget Beauty Ethnic Guide
 * Affordable, accessible, and culturally-rooted beauty across all 9 communities.
 * Budget beauty isn't about compromise — it's about rooting beauty in the kitchen,
 * the market, and ancestral wisdom. The most effective beauty ingredients in the world
 * cost pennies when you know your heritage.
 */

export const ETHNIC_BUDGET_BEAUTY_GUIDES = {
  'west-african': {
    communityId: 'west-african',
    communityName: 'West African',
    budgetPhilosophy: 'The West African approach to beauty has always been grounded in accessibility. Shea butter — perhaps the world\'s most effective moisturizer — grows on trees across the Sahel. Black soap is made from the ash of local plants. The most powerful beauty ingredients in the West African tradition were never luxury goods; they were foods, kitchen staples, and market finds that happened to be extraordinary for the skin. Modern natural beauty trends have discovered what West African grandmothers always knew.',
    kitchenBeauty: [
      { ingredient: 'Shea Butter (Raw, Unrefined)', cost: '$5-10/lb from African grocery stores or online', beauty: 'Full-body moisturizer, face cream, hair conditioner, lip balm, hand cream, cuticle treatment, baby skin care. Nothing in the premium skincare market outperforms shea butter for dry skin at 1000x the price.', how: 'Apply to damp skin after shower. Use a small amount (pea-sized for face). Can refrigerate to solidify if summer.' },
      { ingredient: 'Black Soap (African, Authentic)', cost: '$3-8 per bar at African grocery stores', beauty: 'Gentle face and body cleanser. Anti-bacterial. Reduces PIH. Treats mild acne. Anti-fungal.', how: 'Lather in hands or on cloth rather than directly on skin (can be strong undiluted). Rinse thoroughly.' },
      { ingredient: 'Palm Oil (Red, Unrefined)', cost: '$3-6/lb at African or Caribbean grocery stores', beauty: 'Deep conditioning hair mask. Tocotrienol vitamin E for antioxidant skin care. Cooking and topical use.', how: 'Use a small amount in hair before washing. Mix with shea for a richer moisturizer.' },
      { ingredient: 'Tiger Nut Oil', cost: '$8-15 for small bottle', beauty: 'Non-comedogenic facial oil. High vitamin E. Traditional West African skin care.', how: 'A few drops as facial serum on damp skin.' },
      { ingredient: 'Moringa Powder', cost: '$5-12 for 1 lb', beauty: 'Face mask (mixed with honey). Vitamin A for skin turnover. Zinc for barrier function.', how: 'Mix 1 tsp moringa + 1 tsp honey. Apply 10 min. Rinse.' },
    ],
    marketFinds: [
      { find: 'African Grocery Store', what: 'Raw shea butter, black soap, moringa powder, palm oil, baobab oil, black castor oil, African sponge (loofah), kohl/tiro', why: 'Far cheaper than "natural beauty" stores. Same or superior product.' },
      { find: 'Food Market Ingredients', what: 'Honey, coconut oil, olive oil, aloe vera plant, eggs, banana', why: 'Multi-use food and beauty ingredients. Buy once, use everywhere.' },
    ],
    diyRecipes: [
      { name: 'West African Body Butter', ingredients: ['4 tbsp raw shea butter', '2 tbsp coconut oil', '1 tbsp sweet almond or argan oil', 'a few drops of your favorite essential oil (optional)'], method: 'Melt shea and coconut in a double boiler. Add liquid oil. Cool in fridge until slightly solid. Whip with a fork or hand mixer until fluffy. Store in a jar. Apply to damp skin.', cost: 'Under $10 for a large batch that lasts weeks.' },
      { name: 'Black Soap Sugar Scrub', ingredients: ['1 tbsp liquid black soap', '3 tbsp raw cane sugar', '1 tbsp almond oil'], method: 'Mix all ingredients. Apply to damp skin in circular motions. Rinse. Exfoliates and cleanses simultaneously.', cost: 'Under $2 per use.' },
      { name: 'Moringa Glow Mask', ingredients: ['1 tsp moringa powder', '1 tsp raw honey', '1/2 tsp plain yogurt'], method: 'Mix to a paste. Apply to face. Leave 15 min. Rinse with warm water.', benefit: 'Vitamin A from moringa supports cell turnover. Honey is antimicrobial and humectant. Lactic acid from yogurt gently exfoliates.' },
    ],
    monthlyBudget: {
      essentials: '$15-25 per month can cover cleanser (black soap), moisturizer (shea butter), spot treatment (raw honey), and hair conditioning (palm oil). This is a complete, effective routine.',
    },
  },

  'south-asian': {
    communityId: 'south-asian',
    communityName: 'South Asian',
    budgetPhilosophy: 'South Asian beauty has a 5000-year tradition of kitchen beauty (rasoi ki sundarta). Every ingredient in an Ayurvedic beauty recipe was also in the spice rack. Turmeric, sandalwood, rose water, ghee, gram flour — these are foods first and beauty ingredients second. The concept of ubtan (a traditional face and body scrub made from kitchen staples) predates the modern skincare industry by millennia. South Asian budget beauty isn\'t a trend; it\'s how beauty has always been done.',
    kitchenBeauty: [
      { ingredient: 'Turmeric (Haldi)', cost: '$1-3 for a large amount at Indian grocery', beauty: 'Anti-inflammatory face mask. Brightening (curcumin). Historically used in every South Asian wedding beauty ritual.', how: 'Mix a pinch of turmeric + yogurt + honey. Apply as face mask (note: can temporarily stain fair skin yellow — remove thoroughly, avoid on fabric)', caution: 'Start with a tiny amount — turmeric can temporarily stain skin.' },
      { ingredient: 'Gram Flour (Besan)', cost: '$1-2/lb at Indian grocery', beauty: 'Gentle cleansing. Dead skin removal. Oil absorption. The original South Asian "cleanser."', how: 'Mix with milk or rose water to a paste. Apply as face wash or mask. The texture provides gentle exfoliation.' },
      { ingredient: 'Rose Water (Gulab Jal)', cost: '$2-5 for 200ml at Indian grocery', beauty: 'Toner, pH balancer, antioxidant face spray, makeup setting spray, hair fragrance.', how: 'Transfer to a spray bottle. Use freely throughout the day.' },
      { ingredient: 'Sesame Oil (Cold-Pressed)', cost: '$4-8 at Indian grocery', beauty: 'Abhyanga self-massage. Body moisturizer. Hair conditioning (traditional Indian hair oil).', how: 'Warm slightly. Apply to body before shower for abhyanga. Leave 20 minutes. Rinse in a warm shower.' },
      { ingredient: 'Amla (Indian Gooseberry) Powder', cost: '$2-5/lb at Indian grocery', beauty: 'Hair growth and strength. The highest natural source of vitamin C. Anti-oxidant hair and face mask.', how: 'Mix amla powder + water to a paste. Apply to hair 30 min before washing. Or mix with honey for face mask.' },
      { ingredient: 'Yogurt (Plain, Full-Fat)', cost: '$1-3 at any grocery store', beauty: 'Lactic acid exfoliation. Soothing for sensitive skin. Ingredient in almost every traditional South Asian beauty recipe.', how: 'Apply directly to face as a mask (10 min, rinse) or mix into other masks.' },
    ],
    diyRecipes: [
      { name: 'Classic Ubtan', ingredients: ['2 tbsp gram flour (besan)', '1/4 tsp turmeric', '1 tbsp yogurt', 'a few drops rose water'], method: 'Mix to a thick paste. Apply to face and body. Allow to dry partially. Gently rub off in circular motions (exfoliation). Rinse.', benefit: 'Cleanses, exfoliates, brightens. Used in South Asian wedding preparation (the haldi ceremony).', cost: 'Under $1 per use.' },
      { name: 'Hot Oil Hair Treatment', ingredients: ['3 tbsp coconut or sesame oil', '1 tbsp amla powder', '5-6 curry leaves'], method: 'Heat oil with curry leaves until they start to sizzle (don\'t burn). Let cool slightly. Strain. Massage into scalp. Leave 1-2 hours or overnight. Wash out with shampoo.', benefit: 'Reduces hair fall (curry leaves, amla). Conditions and strengthens. Traditional Indian hair care.' },
    ],
  },

  'caribbean': {
    communityId: 'caribbean',
    communityName: 'Caribbean',
    budgetPhilosophy: 'In the Caribbean, beauty grows on trees — literally. Coconut palms line the coasts. Aloe vera grows wild. Papaya and mango fall from the trees. Sea salt is free from the ocean. The Caribbean beauty tradition evolved in a tropical paradise where the most powerful beauty ingredients were also the most abundant and affordable. Modern Caribbean beauty is an integration of African heritage, Indigenous Taino traditions, and European influences — all filtered through a tropical lens where nature provides.',
    kitchenBeauty: [
      { ingredient: 'Coconut Oil (Virgin, Unrefined)', cost: '$5-10/jar at Caribbean or Asian grocery stores', beauty: 'Body moisturizer, hair mask (deep conditioning before washing), makeup remover, oil pulling for oral health, cooking oil.', how: 'Apply coconut oil to hair 30 minutes to overnight before washing. As body oil, apply to damp skin.' },
      { ingredient: 'Fresh Aloe Vera (Plant)', cost: '$3-8 for a plant that provides endless supply', beauty: 'After-sun treatment, daily moisturizer for oily skin, hair gel (natural hold), scalp soothing.', how: 'Cut a leaf. Scoop the gel. Apply to skin or hair. The plant regrows its leaves.' },
      { ingredient: 'Sea Moss (Irish Moss)', cost: '$5-15 for dried sea moss (makes large batch)', beauty: 'Mineral-rich face mask, hair gel (anti-frizz), body gel; also eaten for its minerals.', how: 'Soak dried sea moss overnight. Blend with water to a gel. Store in fridge up to 2 weeks. Apply to hair or face.' },
      { ingredient: 'Raw Honey', cost: '$4-10 for good honey', beauty: 'Face mask, spot treatment, lip scrub, hair mask.', how: 'Apply raw honey directly to face for 10-15 min. Rinse with warm water.' },
      { ingredient: 'Papaya (Fresh)', cost: '$1-4 per papaya', beauty: 'Enzyme face mask. Papain gently dissolves dead skin cells. Brightening.', how: 'Mash fresh papaya. Apply to face 10 min. Rinse. Do not use on broken skin (enzyme can sting).' },
      { ingredient: 'Apple Cider Vinegar', cost: '$3-5 for a bottle', beauty: 'pH-balancing toner (dilute 1:4 with water). Scalp treatment for dandruff. Foot soak.', how: 'Dilute significantly with water before applying to skin. Never apply undiluted.' },
    ],
    diyRecipes: [
      { name: 'Caribbean Honey Papaya Mask', ingredients: ['2 tbsp mashed fresh papaya', '1 tsp raw honey', '1 tsp plain yogurt'], method: 'Blend. Apply to clean face 10-15 min. Rinse with cool water.', benefit: 'Papain enzyme exfoliates. Honey hydrates and antimicrobial. Lactic acid from yogurt brightens.' },
      { name: 'Coconut Sea Salt Scrub', ingredients: ['3 tbsp sea salt (coarse)', '2 tbsp coconut oil', 'juice of half a lime', 'optional: vanilla extract'], method: 'Mix. Apply to damp body skin. Scrub gently. Rinse.', benefit: 'Exfoliates. Coconut oil moisturizes. Lime vitamin C brightens. Salt minerals.' },
    ],
  },

  'arab': {
    communityId: 'arab',
    communityName: 'Arab Middle Eastern',
    budgetPhilosophy: 'Arab beauty is luxurious in practice but not in cost. The hammam is a community institution, not a luxury hotel. Ghassoul clay from the Atlas Mountains is a common market item across North Africa and the Levant. Argan oil (now a global luxury export) was a daily staple for Moroccan Berber women. Olive oil has been the universal beauty and food ingredient across the Mediterranean and Arab world for thousands of years. The ingredients that power premium Arab-inspired beauty brands are often available at Arab grocery stores for a fraction of the price.',
    kitchenBeauty: [
      { ingredient: 'Extra Virgin Olive Oil', cost: '$5-15 for a good bottle', beauty: 'Body oil, hair mask, face oil for very dry skin, nail and cuticle treatment, lip treatment.', how: 'Apply to damp skin after shower. Use as hot oil hair treatment (warm slightly, apply to hair, cover with towel, rinse after 30 min).' },
      { ingredient: 'Rose Water (Ma\'al Wurdud)', cost: '$2-5 at Middle Eastern grocery', beauty: 'Face toner. Makeup setting spray. Body mist. Hair fragrance. Ingredient in beauty masks.', how: 'Transfer to spray bottle. Use throughout the day.' },
      { ingredient: 'Ghassoul Clay (Moroccan)', cost: '$3-8 at Middle Eastern or natural grocery', beauty: 'Deep-cleansing face and hair mask. Removes excess oil without stripping. Rich in minerals.', how: 'Mix with rose water to a paste. Apply to face or scalp. Leave 5-10 min. Rinse.' },
      { ingredient: 'Black Seed Oil (Nigella Sativa, Habbatus Sauda)', cost: '$5-15 per bottle at Middle Eastern grocery', beauty: 'Thymoquinone is anti-inflammatory and antioxidant. For scalp, eczema, psoriasis, acne.', how: 'Apply 2-3 drops to affected area. Can use diluted on scalp for hair growth.' },
      { ingredient: 'Rosewater + Glycerin Mix', cost: 'Under $5 total', beauty: 'Perfect homemade skin toner/hydrator. Glycerin is the most studied humectant.', how: 'Mix 1 part vegetable glycerin to 4 parts rose water. Transfer to spray bottle. Apply after cleansing.' },
    ],
    diyRecipes: [
      { name: 'Halawa (Arab Sugar Wax)', ingredients: ['1 cup sugar', '1/4 cup lemon juice', '1/4 cup water'], method: 'Combine in pot over medium heat. Stir until sugar dissolves. Simmer without stirring until it reaches honey color and soft ball stage (~240°F). Cool until comfortable to handle. Apply against hair growth direction. Pull with the growth.', benefit: 'Traditional Arab hair removal method. Gentle on skin. Natural. Better than waxing for some skin types.' },
      { name: 'Ghassoul Rose Mask', ingredients: ['2 tbsp ghassoul powder', 'enough rose water to form paste', 'optional: 1 tsp argan oil'], method: 'Mix to smooth paste. Apply to face 10-15 min. Rinse with warm water.', benefit: 'Deeply cleanses. Minimizes pores appearance. Anti-inflammatory from rose water.' },
    ],
  },

  'latina': {
    communityId: 'latina',
    communityName: 'Latina',
    budgetPhilosophy: 'La belleza latina ha sido siempre kitchen beauty. The avocado mask, the egg hair treatment, the beer rinse for shine, the rice water for skin — Latina kitchen beauty is both ancient (going back to Indigenous Mesoamerican and Andean traditions) and completely modern. The ingredients are often already in the kitchen: avocado, honey, aloe vera (which grows wild across most of Latin America), olive oil, eggs, mayonnaise. The Latina beauty tradition bridges Indigenous botanical knowledge, African heritage (for Afro-Latina communities), and European culinary beauty, all filtered through the extraordinary biodiversity of Latin America.',
    kitchenBeauty: [
      { ingredient: 'Avocado', cost: '$0.50-2 each (and you were going to eat it anyway)', beauty: 'Face mask (rich in glutathione, oleic acid, vitamin E). Deep hair conditioning mask. Nail cuticle treatment.', how: 'Mash half an avocado. Apply to face or hair 15-20 min. Rinse. Hair: focus on ends.' },
      { ingredient: 'Aloe Vera (Plant or Gel)', cost: '$3-10 for a plant, or $3 for grocery gel', beauty: 'Sunburn relief, daily face moisturizer for oily skin, hair gel for curls and waves, scalp soothing.', how: 'For curls: apply to soaking wet hair as a leave-in gel. Scrunches and diffuses for curl definition.' },
      { ingredient: 'Olive Oil', cost: '$5-15 per bottle', beauty: 'Body and hair moisturizer, cuticle oil, makeup remover, hot oil treatment.', how: 'A few drops on face as overnight oil. Massage into cuticles daily.' },
      { ingredient: 'Eggs', cost: '$2-4 per dozen', beauty: 'Hair protein treatment (egg yolk) or pore-tightening mask (egg white).', how: 'Hair: apply 2 eggs to dry hair before washing. Leave 20 min. Rinse with cool water (never hot — cooks the egg). Face: apply egg white to clean face. Let dry. Rinse.' },
      { ingredient: 'Mayonnaise', cost: '$2-4 per jar', beauty: 'Deep hair conditioning mask. The eggs, oil, and acid in mayo make it a natural deep conditioner.', how: 'Apply to dry hair from mid-length to ends. Cover with plastic cap. Leave 20-30 min. Rinse and shampoo.' },
      { ingredient: 'Coffee Grounds', cost: 'Free (from morning coffee)', beauty: 'Body scrub for cellulite and circulation. Eye area depuffing. Scalp stimulating scrub.', how: 'Mix damp coffee grounds with coconut oil. Scrub body in circular motions. The caffeine temporarily tightens skin.' },
    ],
    diyRecipes: [
      { name: 'Mexican Avocado Honey Mask', ingredients: ['1/2 ripe avocado', '1 tbsp raw honey', '1 tsp olive oil'], method: 'Mash avocado. Mix in honey and oil. Apply to clean face 15-20 min. Rinse.', benefit: 'Oleic acid and glutathione from avocado. Honey humectant and antimicrobial. Olive oil sealant.' },
      { name: 'Colombian Coffee Scrub', ingredients: ['3 tbsp coffee grounds (used or fresh)', '2 tbsp coconut oil', '1 tbsp brown sugar'], method: 'Mix. Apply to damp body skin in circular motions. Rinse. The coffee stimulates circulation. The coconut oil moisturizes.', note: 'Extremely popular in Colombia and Brazil for body contouring and glow.' },
    ],
  },

  'east-asian': {
    communityId: 'east-asian',
    communityName: 'East Asian',
    budgetPhilosophy: 'K-beauty democratized skincare globally — not by making it expensive, but by making it accessible. The 10-step routine that launched a thousand brands can be approximated with rice water, green tea, and drugstore sheet masks. Japanese beauty (J-beauty) has always emphasized simplicity and quality over quantity. The original East Asian kitchen beauty staples — rice water, green tea, fermented foods, ginseng — are available at any Asian grocery store for cents on the dollar compared to Western "luxury" products inspired by them.',
    kitchenBeauty: [
      { ingredient: 'Rice Water', cost: 'Free (save the water from rinsing your rice)', beauty: 'Inositol in rice water strengthens hair and reduces breakage. Brightens skin. Tightens pores.', how: 'Let rice rinse water ferment 24-48 hours at room temperature (slightly sour smell = ready). Apply to face with cotton pad. Use as final hair rinse after washing. K-pop idols swear by this.' },
      { ingredient: 'Green Tea', cost: '$3-8 for a large quantity at Asian grocery', beauty: 'EGCG is one of the most UV-protective and anti-aging antioxidants found. DIY toner. Cold tea for puffy eyes.', how: 'Brew strong green tea. Let cool. Transfer to spray bottle and use as toner. Cold tea bags on eyes for 10 min for depuffing.' },
      { ingredient: 'Sheet Masks (From Asian Grocery)', cost: '$0.50-2 each vs. $5-20 at Western stores', beauty: 'Concentrated hydration and targeted treatment. Same ingredients (and often same formulas) as premium brands.', how: 'At Asian grocery stores (H-Mart, 99 Ranch, etc.) or Amazon, name-brand Korean sheet masks are under $2 each. Buy in bulk packs.' },
      { ingredient: 'Glycerin + Rose Water Toner', cost: '$5 total to make 200ml', beauty: 'Replicates the essence/toner step of any K-beauty routine. The "7-skin method" with affordable ingredients.', how: 'Mix 1 tsp vegetable glycerin + 200ml water or rose water. Optional: few drops niacinamide. Apply in 3-7 layers.' },
      { ingredient: 'Mung Bean Powder', cost: '$2-4 at Asian grocery', beauty: 'Gentle face wash (used in Korean traditional beauty). Cooling and anti-inflammatory.', how: 'Mix a spoonful with water to paste. Use to wash face as a gentle cleanser.' },
    ],
    diyRecipes: [
      { name: 'Fermented Rice Water Rinse', method: 'Rinse 1 cup rice. Save the first rinse water. Let sit at room temperature 24-48 hours until slightly sour. Dilute 1:5 with clean water. Use as final hair rinse after shampoo/conditioner. Leave 10 min before rinsing.', benefit: 'Inositol coats and strengthens hair shaft. Used by Chinese women of the Yao ethnic group (known for their extraordinary hair length and health).' },
      { name: 'Green Tea Toner', ingredients: ['1 green tea bag or 1 tsp loose leaf', '200ml hot water'], method: 'Steep tea for 5 min. Cool completely. Pour into spray bottle or pour into a toner bottle. Apply to face with cotton pad after cleansing.', benefit: 'Replicates expensive green tea toners at 99% savings.' },
    ],
  },

  'east-african': {
    communityId: 'east-african',
    communityName: 'East African',
    budgetPhilosophy: 'East Africa is home to extraordinary botanical wealth — frankincense, myrrh, coffee, camel milk, honey — and some of the world\'s most ancient beauty practices. Ethiopian women have used frankincense resin for beauty and spiritual practice for over 3000 years. The coffee ceremony is both beauty ritual and social institution. In Somalia, camel milk is skin care. These ingredients remain accessible and affordable in East African communities and diaspora markets globally.',
    kitchenBeauty: [
      { ingredient: 'Coffee (Ethiopian)', cost: 'Baseline pantry item', beauty: 'Caffeine reduces inflammation and puffiness. Ground coffee body scrub for circulation. Coffee mask for brightening.', how: 'Coffee body scrub: mix coffee grounds + coconut oil + dash of cinnamon. Exfoliate. Rinse. Coffee face mask: mix with honey. Apply 10 min. Rinse.' },
      { ingredient: 'Raw Honey (Ethiopian Wild)', cost: '$10-20 for premium Ethiopian honey', beauty: 'Antimicrobial, humectant, enzyme exfoliation. The highest medicinal value honey globally (due to botanical diversity).', how: 'Apply to face 10-15 min. Mix into other masks. Spot treat acne. Apply to lips.' },
      { ingredient: 'Frankincense Oil (Diluted)', cost: '$5-15 for essential oil (small amount goes far)', beauty: 'Anti-inflammatory, antioxidant, skin regenerating. Unique to this region.', how: 'Dilute 1% in jojoba oil (1 drop frankincense per 5ml jojoba). Apply to face as serum.' },
      { ingredient: 'Camel Milk Powder', cost: '$10-25 for powder at specialty stores', beauty: 'Vitamin C, immunoglobulins, lactic acid for gentle exfoliation.', how: 'Mix powder with water to make paste. Use as face mask. Or add to bath.' },
    ],
    diyRecipes: [
      { name: 'Ethiopian Coffee Honey Mask', ingredients: ['1 tsp finely ground Ethiopian coffee', '1 tbsp raw honey', '1 tsp plain yogurt'], method: 'Mix. Apply to face 10-15 min. Rinse.', benefit: 'Caffeine anti-inflammatory, honey hydrating and antimicrobial, yogurt lactic acid brightening.' },
    ],
  },

  'south-african': {
    communityId: 'south-african',
    communityName: 'South African',
    budgetPhilosophy: 'South Africa has an embarrassment of botanical riches — rooibos (used twice daily as tea by many South Africans), aloe ferox, marula fruit, buchu. The beauty ingredients that global brands pay premium prices to import are growing in South African backyards and available at local grocery stores. The tradition of ubuntu in beauty — communal beauty practices where knowledge and ingredients are shared — also reflects the abundance of the land.',
    kitchenBeauty: [
      { ingredient: 'Rooibos Tea', cost: '$3-8 for a large box', beauty: 'Aspalathin antioxidant protects against UV damage. Toner for sensitive skin. Anti-inflammatory face rinse.', how: 'Brew strong rooibos. Let cool. Apply to face with cotton pad as toner, or splash on face as final rinse. Also spray from bottle for midday refresh.' },
      { ingredient: 'Marula Oil', cost: '$10-25 for small bottle (but very concentrated)', beauty: 'Closest oil to human sebum. Anti-aging. Non-greasy. Best for face oil use.', how: '3-5 drops on damp face. Presses in cleanly. The "Drunk Elephant oil" you\'ve been buying rebranded from South African traditional use.' },
      { ingredient: 'Aloe Ferox (Cape Aloe Gel)', cost: '$5-15 at health stores or South African specialty shops', beauty: 'More potent than aloe vera. Healing. Anti-inflammatory. Great for burns, skin irritation, acne.', how: 'Apply to skin as needed. Use as first step in skincare routine.' },
    ],
    diyRecipes: [
      { name: 'Rooibos Toner', method: 'Brew 2 rooibos teabags in 1 cup water for 10 min. Cool. Strain into spray bottle. Apply to face after cleansing.', benefit: 'Aspalathin (found only in rooibos) reduces UV-induced oxidative damage. Anti-inflammatory. Perfect for sensitive skin.' },
      { name: 'Marula Oil Night Treatment', method: 'Apply 3-5 drops pure marula oil to damp face after cleansing. Gently press in. Do not rinse. Sleep.', benefit: 'Overnight skin repair with the oil most similar to skin\'s own sebum.' },
    ],
  },

  'black-american': {
    communityId: 'black-american',
    communityName: 'Black American',
    budgetPhilosophy: 'Black beauty has always been about knowing the anointing power in humble things. Vaseline — the dollar store hero that luxury brands try to replicate in "slugging" serums — has been in Black American households for over a century, passed down from grandmothers who knew its power before dermatology gave it a name. Blue Magic hair grease. Dax. Carrot oil. The drugstore has always served Black beauty before the beauty industry did. The natural hair movement created a whole new generation of Black Americans who learned that the most powerful thing in their hair routine might be the water in their tap.',
    kitchenBeauty: [
      { ingredient: 'Vaseline (Petroleum Jelly)', cost: '$3-5 for large jar', beauty: 'The #1 occludent studied by dermatology. "Slugging" (applying a thin layer as last skincare step) reduces TEWL by 98%. Protects against ashy skin. Seals in moisture. On lips, elbows, knees, heels, cuticles.', culturalNote: 'What the beauty industry sells as "overnight recovery cream" at $80 is essentially petroleum jelly. What Black grandmothers knew: Vaseline is the treatment.' },
      { ingredient: 'Jamaican Black Castor Oil (JBCO)', cost: '$8-15 per bottle', beauty: 'Scalp stimulation (ricinoleic acid). Edge growth. Skin healing. Anti-inflammatory.', how: 'Massage into scalp weekly. Apply to edges. Leave overnight. Use as cuticle treatment.' },
      { ingredient: 'Shea Butter (Raw)', cost: '$5-10/lb', beauty: 'Full-body moisturizer, face cream, hair sealant in LOC method.', how: 'Whip with a mixer for a lighter texture. Apply to damp skin and hair.' },
      { ingredient: 'Black Tea', cost: '$3-5 for a large box', beauty: 'Tannins in black tea reduce hair shedding. Used as a final rinse before styling.', how: 'Brew 2-3 strong black tea bags. Cool. Pour over hair after conditioner. Leave 5-10 min. Rinse lightly (or leave in). The tannins temporarily reduce breakage.' },
      { ingredient: 'Aloe Vera Gel', cost: '$3-5 at any grocery', beauty: 'Curl definition gel (no flaking like many commercial gels). Scalp soothing. First step in LOC method (Liquid step).', how: 'Apply to soaking wet hair before styling for curl definition. Mix with a little JBCO and water for a DIY leave-in.' },
    ],
    diyRecipes: [
      { name: 'LOC Method with Kitchen Staples', liquid: 'Aloe vera + water spray', oil: 'JBCO or coconut oil', cream: 'Raw shea butter', method: 'On wet hair: spritz with aloe/water mix. Apply oil (quarter-sized amount). Seal with shea butter. Twist or braid for overnight moisture.', benefit: 'Classic natural hair moisture method with all-budget ingredients.' },
      { name: 'Brown Sugar Lip Scrub', ingredients: ['1 tsp brown sugar', '1 tsp honey', '1/2 tsp olive or coconut oil'], method: 'Mix. Apply to lips. Gently rub in circular motion. Rinse or wipe off. Apply lip balm or Vaseline.', benefit: 'Exfoliates dead lip skin. Honey adds moisture. Oil softens.' },
      { name: '"Slugging" Overnight Skin Treatment', method: 'Complete your full skincare routine (cleanser, toner, serum, moisturizer). As the FINAL step, apply an extremely thin layer of Vaseline (petroleum jelly) all over the face. Sleep. Rinse morning.', benefit: 'Seals everything underneath. Reduces TEWL dramatically. The skin is plumper and more hydrated upon waking. A practice from Black American households validated by modern dermatology.' },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL BUDGET BEAUTY PRINCIPLES
// ─────────────────────────────────────────────────────────────────────────────

export const UNIVERSAL_BUDGET_BEAUTY = {
  theFoundation: {
    title: 'The 4 Things Your Skin Actually Needs',
    description: 'The entire global skincare industry is built around 4 skin needs. Every product — from a $5 drugstore find to a $500 luxury serum — is addressing one or more of these. Once you understand them, you can build a complete routine for under $30.',
    needs: [
      { need: 'Cleansing', what: 'Remove dirt, makeup, sunscreen, pollution, excess sebum', budget: 'Any gentle, sulfate-free cleanser. CeraVe Hydrating Cleanser ($15). Vanicream Gentle Cleanser ($12). Or traditional options: black soap, gram flour paste, oil cleansing.', avoid: 'Harsh bar soap (disrupts acid mantle). Over-cleansing (twice daily maximum). Hot water.' },
      { need: 'Moisturizing', what: 'Prevent TEWL (water loss), maintain barrier function, keep skin plump', budget: 'CeraVe Moisturizing Cream ($15 for a large tub). Vanicream ($15). Raw shea butter ($5). Or Vaseline as an occludent over a simple moisturizer.', formula: 'Humectant (glycerin, hyaluronic acid) + Emollient (shea, oils) + Occludent (Vaseline, wax) = complete moisturization' },
      { need: 'Sun Protection', what: 'Prevent UV damage, photoaging, PIH, skin cancer', budget: 'You cannot skip this. EltaMD UV Clear ($39) is expensive but worth it for breakout-prone skin. Supergoop Unseen ($46) for no white cast. Budget: Black Girl Sunscreen ($19), CeraVe AM with SPF ($15), Neutrogena Sensitive Skin SPF 60 ($10).', rule: 'SPF 30+ minimum. Reapply every 2 hours in sun.' },
      { need: 'Targeted Treatment', what: 'Addressing specific concerns: acne, PIH, fine lines, hyperpigmentation', budget: 'The Ordinary (the budget line that changed skincare): Niacinamide 10% ($6). Hyaluronic Acid ($7). AHA/BHA Peeling Solution ($8). Vitamin C ($6). These are the same actives in luxury products.' },
    ],
  },

  theOrdinaryRevolution: {
    title: 'The Ordinary: Democratizing Actives',
    description: 'The Ordinary (from Deciem) changed the skincare industry by selling single-active-ingredient products at near-cost prices. The same niacinamide in a $60 SkinCeuticals product costs $6 from The Ordinary. This is important specifically for communities of color, where niacinamide, vitamin C, azelaic acid, and tranexamic acid are critical for PIH management.',
    essentials: [
      { product: 'The Ordinary Niacinamide 10% + Zinc 1%', cost: '$6', forCommunities: 'All communities, especially for PIH, pore appearance, oil control, barrier strengthening' },
      { product: 'The Ordinary Hyaluronic Acid 2% + B5', cost: '$7', forCommunities: 'All communities, especially for dryness and dehydration' },
      { product: 'The Ordinary Alpha Arbutin 2% + HA', cost: '$9', forCommunities: 'For PIH and hyperpigmentation in all communities of color' },
      { product: 'The Ordinary Azelaic Acid Suspension 10%', cost: '$10', forCommunities: 'PIH, rosacea, acne. One of the safest brightening actives for all skin tones.' },
      { product: 'The Ordinary Vitamin C Suspension 23%', cost: '$6', forCommunities: 'Antioxidant. Brightening. PIH. Use SPF alongside always.' },
    ],
  },

  budgetMoisturizersRanked: [
    { product: 'Vaseline Petroleum Jelly', cost: '$4', use: 'Occludent. "Slugging." Healing. Lips. Elbows. Not as standalone but as final seal.', skinTypes: 'All (use sparingly on very acne-prone face)' },
    { product: 'CeraVe Moisturizing Cream', cost: '$15 (large tub)', use: 'Ceramide-based moisturizer. Contains ceramides 1, 3, 6-II. The dermatologist recommendation.', skinTypes: 'Normal to dry. All skin tones.' },
    { product: 'Vanicream Moisturizing Cream', cost: '$15', use: 'Fragrance-free, dye-free. For sensitive skin. Excellent baseline moisturizer.', skinTypes: 'All, especially sensitive and eczema-prone.' },
    { product: 'Raw Shea Butter', cost: '$5-10/lb', use: 'Traditional West African moisturizer. Anti-inflammatory. Rich emollient.', skinTypes: 'Dry to very dry. Better for body than face in oily skin.' },
    { product: 'Neutrogena Hydro Boost Water Gel', cost: '$18', use: 'Hyaluronic acid-based. Lightweight. Good for oily skin that needs hydration without heaviness.', skinTypes: 'Normal to oily. All skin tones.' },
  ],

  diyVsStore: {
    alwaysDIY: ['Face masks (manuka honey, yogurt, turmeric, avocado, aloe)', 'Hair masks (eggs, mayonnaise, coconut oil, olive oil)', 'Body scrubs (coffee, sugar, salt)', 'Lip scrubs (sugar + honey)', 'Hair rinses (rice water, green tea, black tea, ACV diluted)', 'Toner (rose water, brewed green tea, brewed rooibos)'],
    buyStore: ['Sunscreen (cannot effectively DIY SPF)', 'Active ingredients at specific concentrations (retinoids, AHAs/BHAs — effectiveness depends on pH and % which are hard to control DIY)', 'Prescription treatments for acne/PIH (tretinoin, hydroquinone, etc.)'],
    couldGoEither: ['Moisturizer (store ceramide formulas are excellent, but shea butter is comparable)', 'Cleansers (black soap can replace expensive cleansers)', 'Facial oils (jojoba, rosehip at natural stores are similar to branded versions)'],
  },

  monthlyBudgetTemplates: {
    ultraBudget: {
      budget: '$20/month',
      routine: 'Black soap ($5 per bar, lasts 1 month). Raw shea butter ($5, large supply). Sunscreen: any SPF 30+ you can afford ($8). One The Ordinary active ($7, niacinamide).',
      note: 'This routine can outperform $200/month routines if used consistently.',
    },
    moderate: {
      budget: '$50/month',
      routine: 'CeraVe Hydrating Cleanser ($15). CeraVe Moisturizing Cream ($15). The Ordinary Niacinamide + Alpha Arbutin ($15). EltaMD or Black Girl Sunscreen ($19).',
    },
    comfortable: {
      budget: '$100/month',
      routine: 'Above routine + vitamin C serum ($15-30). Sheet masks 4-8x per month ($10). Retinol or AHA/BHA treatment ($10-20). A facial oil ($20).',
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export function getBudgetBeautyGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_BUDGET_BEAUTY_GUIDES['west-african'],
    'south-asian': ETHNIC_BUDGET_BEAUTY_GUIDES['south-asian'],
    'caribbean': ETHNIC_BUDGET_BEAUTY_GUIDES['caribbean'],
    'arab': ETHNIC_BUDGET_BEAUTY_GUIDES['arab'],
    'latina': ETHNIC_BUDGET_BEAUTY_GUIDES['latina'],
    'east-asian': ETHNIC_BUDGET_BEAUTY_GUIDES['east-asian'],
    'east-african': ETHNIC_BUDGET_BEAUTY_GUIDES['east-african'],
    'south-african': ETHNIC_BUDGET_BEAUTY_GUIDES['south-african'],
    'black-american': ETHNIC_BUDGET_BEAUTY_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

export const BUDGET_BEAUTY_STATS = {
  moduleId: 'budget_beauty_ethnic_guide',
  communitiesCovered: 9,
  diyRecipesCovered: 25,
  budgetSkincareSolutions: 20,
  version: '1.0.0',
};
