/**
 * MIRRR — Wellness and Beauty Guide
 * The intersection of holistic wellness, nutrition, exercise,
 * stress, and beauty across ethnic communities.
 */

export const NUTRITION_SKIN_SCIENCE = {
  title: 'Nutrition and Skin Health — The Evidence',
  overview: 'The skin is the body\'s largest organ and reflects internal health; nutritional status directly impacts skin appearance, barrier function, collagen synthesis, and inflammatory response; while topical skincare is important, internal nutrition is the foundation of healthy skin',
  macronutrients: {
    protein: {
      role: 'Protein is the raw material for collagen and elastin synthesis; skin is approximately 75% collagen by dry weight; amino acids from dietary protein (particularly glycine, proline, hydroxyproline, and lysine) are direct building blocks of collagen; protein deficiency causes: poor wound healing, loss of skin firmness, thinning skin, brittle nails, hair loss',
      sources: 'Complete proteins (all essential amino acids): meat, poultry, fish, eggs, dairy; plant-based complete proteins: quinoa, soy, hemp seeds, buckwheat; combining plant proteins (rice + legumes) also provides complete amino acid profiles',
      collagen: 'Collagen supplements (hydrolysed collagen peptides): meta-analyses (2019 Nutrients; 2021 International Journal of Dermatology) show statistically significant improvements in skin elasticity and hydration from oral collagen supplementation (2.5-10g daily); the peptides are absorbed and stimulate fibroblast collagen production rather than being used as building blocks directly; evidence is promising but more large-scale studies needed'
    },
    fats: {
      omega3: {
        role: 'Omega-3 fatty acids (EPA and DHA) are anti-inflammatory; reduce skin inflammation; maintain the lipid barrier; reduce transepidermal water loss; EPA specifically inhibits arachidonic acid-mediated inflammation pathways relevant to acne and inflammatory skin conditions',
        sources: 'Fatty fish (salmon, mackerel, sardines, herring): highest EPA/DHA; algae oil (vegan DHA source); flaxseed, chia seeds, walnuts (ALA which partially converts to EPA/DHA); omega-3 supplement (fish oil or algae oil)',
        evidence: '2012 study (Journal of the American Academy of Dermatology): omega-3 supplementation significantly reduced acne inflammatory lesions; multiple studies show benefits for eczema and psoriasis; anti-inflammatory mechanism is well-established'
      },
      omega6: 'Omega-6 fatty acids are pro-inflammatory in high amounts; Western diets often have imbalanced omega-6 to omega-3 ratios (often 15:1 or higher, while ideal is 4:1 or lower); high omega-6 diets (from processed seed oils: soybean, corn, sunflower) without balancing omega-3 can worsen inflammatory skin conditions',
      transFats: 'Trans fats (from partially hydrogenated oils; industrial processed foods) increase systemic inflammation and are associated with worsened inflammatory skin conditions; largely eliminated from many food supplies but still present in some processed foods globally'
    },
    carbohydrates: {
      glycaemic: 'High glycaemic index foods (white bread, white rice, sugary drinks, processed snacks) cause rapid blood glucose spikes; these trigger insulin release, which stimulates IGF-1 (insulin-like growth factor 1); IGF-1 increases sebum production and can worsen acne in susceptible individuals',
      acneLink: '2007 study (American Journal of Clinical Nutrition): low glycaemic load diet significantly reduced acne lesion count vs control diet in young men with acne; subsequent studies support the dietary glycaemic load-acne connection',
      fibre: 'Dietary fibre feeds beneficial gut bacteria (prebiotics); the gut-skin axis: gut microbiome health is connected to skin health through inflammatory and immune pathways; fermented foods (kimchi, yoghurt, kefir, miso, tempeh, injera) provide probiotics that support gut health'
    }
  },
  micronutrients: {
    vitaminC: {
      role: 'Vitamin C is essential for collagen synthesis (cofactor for prolyl hydroxylase enzyme); potent antioxidant protecting skin from UV-induced oxidative damage; the body cannot synthesise vitamin C and it must be obtained from diet',
      sources: 'Bell peppers (especially red): very high; citrus fruits; kiwi; broccoli; strawberries; guava (very high)',
      deficiency: 'Scurvy (severe vitamin C deficiency): skin symptoms include bleeding gums, poor wound healing, corkscrew hairs, perifolicular haemorrhages; rare in developed world but can occur in very restricted diets'
    },
    vitaminA: {
      role: 'Vitamin A is required for normal skin cell turnover and differentiation; deficiency causes follicular hyperkeratosis ("toad skin" — rough, bumpy skin from follicle plugging)',
      retinol: 'Retinol (animal-source vitamin A): liver, egg yolks, dairy, oily fish',
      carotenoids: 'Beta-carotene and other carotenoids (plant-source pro-vitamin A): sweet potato, carrots, mango, papaya, leafy greens; high carotenoid intake can produce a healthy orange-yellow skin tint (carotenodermia — harmless and actually considered attractive in some studies where judges rated high-carotenoid skin as healthy-looking and attractive)'
    },
    zinc: {
      role: 'Zinc is required for: collagen synthesis; wound healing; vitamin A metabolism; immune function; anti-inflammatory processes; zinc-dependent enzymes including superoxide dismutase (antioxidant)',
      acne: 'Zinc deficiency is associated with acne; some studies support oral zinc supplementation for acne treatment (zinc gluconate 30mg equivalent to tetracycline 250mg in one study, though less effective than minocycline; zinc has significantly fewer side effects than oral antibiotics)',
      sources: 'Oysters (the richest source); red meat; poultry; beans; nuts; fortified cereals; pumpkin seeds',
      vegetarian: 'Phytates in whole grains and legumes reduce zinc absorption; vegetarian and vegan diets tend to provide less bioavailable zinc; this is particularly relevant for South Asian vegetarian communities where plant-based diets are common'
    },
    selenium: {
      role: 'Selenium is a component of glutathione peroxidase (powerful antioxidant enzyme); anti-inflammatory; supports thyroid function (thyroid issues manifest in skin and hair)',
      sources: 'Brazil nuts: by far the richest source (2 Brazil nuts provide the daily requirement); seafood; meat; eggs; whole grains (content depends on soil selenium levels)'
    },
    iron: {
      role: 'Iron deficiency causes hair loss (telogen effluvium — diffuse shedding); pale, sallow skin; brittle nails; the inner corners of the eyelids appear pale (clinical sign of anaemia)',
      sources: 'Haem iron (highly bioavailable): red meat, liver, oysters; Non-haem iron (less bioavailable): lentils, beans, tofu, leafy greens, fortified cereals',
      absorption: 'Vitamin C dramatically increases non-haem iron absorption; coffee, tea, and calcium reduce iron absorption; important for vegetarian/vegan communities and women with heavy periods'
    },
    biotin: {
      role: 'Biotin (vitamin B7) is required for fatty acid synthesis and keratin production; biotin deficiency causes hair loss, brittle nails, and a characteristic rash; true biotin deficiency is rare',
      supplement: 'Biotin supplements are very widely sold for hair and nail growth; the evidence for supplementation benefit is only demonstrated for diagnosed biotin deficiency; most people eating a varied diet have adequate biotin; high-dose biotin supplementation can interfere with thyroid and troponin lab tests (important to disclose before blood tests)',
      sources: 'Liver; eggs (cooked — raw egg whites contain avidin which blocks biotin absorption); salmon; sunflower seeds; sweet potato'
    }
  },
  water: {
    hydration: 'Adequate hydration maintains skin plumpness and turgor; even mild dehydration reduces skin elasticity and radiance; however, the popular claim that drinking large amounts of water produces noticeably hydrated skin is overstated for well-hydrated people — skin hydration is primarily maintained by the barrier function, not by water intake above adequate levels',
    recommendation: '8 glasses (2L) per day is a commonly cited recommendation; actual needs vary by body size, climate, exercise, and diet; urine colour is a practical guide (pale yellow = well hydrated; dark yellow = drink more)'
  }
};

export const EXERCISE_SKIN = {
  title: 'Exercise and Skin Health',
  benefits: {
    circulation: 'Exercise increases blood circulation; increased blood flow delivers more oxygen and nutrients to skin cells; removes waste products more efficiently; produces the post-exercise glow (temporary; enhanced blood flow to skin)',
    collagen: 'Exercise stimulates fibroblast activity and collagen production; higher-intensity exercise produces more IGF-1 (which drives collagen synthesis) than sedentary activity; consistent exercise is associated with slower skin ageing in studies',
    stress: 'Exercise is the most evidence-backed intervention for reducing cortisol and stress; since chronic stress is a major driver of inflammatory skin conditions (acne, eczema flares, psoriasis), the cortisol-reducing effect of exercise directly benefits skin',
    telomeres: '2008 study (Archives of Internal Medicine): regular exercise is associated with longer telomeres (the protective caps on chromosomes); shorter telomeres are a biological marker of ageing; this cellular anti-ageing effect extends to skin'
  },
  challenges: {
    sweat: 'Post-workout sweat can clog pores if left on the skin; washing the face promptly after exercise (within 30-60 minutes) or using a gentle cleansing wipe reduces post-workout acne risk; Malassezia folliculitis (fungal acne) can be triggered or worsened by exercise without prompt showering in hot, sweaty conditions',
    chlorine: 'Swimming pool chlorine strips the skin barrier and causes significant dryness; a pre-swim barrier (coconut oil or body lotion) reduces chlorine penetration; showering immediately after swimming is essential; moisturiser applied immediately after showering is important for swimmer skin',
    sunExposure: 'Outdoor exercise (running, cycling, outdoor yoga, swimming) involves significant UV exposure; SPF before outdoor exercise is critical; SPF products may sweat off — water-resistant SPF for exercise; reapplication after 80 minutes in water or heavy sweating is needed for adequate protection',
    helmet: 'Bike helmets, headbands, and hats worn during exercise can cause acne mechanica (mechanical acne from friction and occlusion of follicles); cleaning the inside of helmets and headbands regularly; using moisture-wicking fabrics'
  }
};

export const STRESS_SKIN = {
  title: 'Stress, Mental Health, and Skin',
  cortisol: {
    mechanism: 'Chronic stress increases cortisol production; cortisol: breaks down collagen; increases sebum production (→ acne); disrupts the skin barrier (increases transepidermal water loss); suppresses the immune system\'s anti-inflammatory functions; triggers mast cell degranulation (releases histamine → inflammatory skin reactions)',
    conditions: 'Stress significantly worsens: acne; eczema/atopic dermatitis; psoriasis; rosacea; seborrhoeic dermatitis; alopecia areata (patchy hair loss with strong stress-immune connection); chronic stress is a well-established trigger for all of these conditions'
  },
  gutBrain: {
    axis: 'The gut-brain-skin axis is an emerging area of research; stress affects gut microbiome composition; gut dysbiosis is associated with skin conditions including acne, eczema, and rosacea; probiotics that support gut health may indirectly benefit skin through reducing systemic inflammation from gut dysbiosis',
    fermented: 'Fermented foods (kimchi, kefir, yoghurt, sauerkraut, miso, tempeh, injera) provide probiotics; prebiotics (inulin, FOS from onions, garlic, leeks, asparagus, bananas) feed beneficial gut bacteria'
  },
  mindfulness: {
    evidence: 'Mindfulness-based stress reduction (MBSR) has been studied in dermatological conditions; a 1998 study by Kabat-Zinn found psoriasis patients listening to mindfulness tapes during phototherapy cleared approximately four times faster than those receiving phototherapy alone; meditation reduces cortisol measurably',
    practical: 'Practical stress reduction: 10 minutes of daily meditation (apps: Headspace, Calm, Insight Timer); regular sleep; social connection; nature exposure; exercise; creative expression; therapy (CBT has strong evidence for anxiety and depression which co-occur with inflammatory skin conditions)'
  }
};

export const ETHNIC_WELLNESS_BEAUTY_GUIDES = {
  'west-african': {
    nutrition: 'West African traditional diets are rich in anti-inflammatory ingredients: palm oil (rich in tocotrienols, a form of vitamin E; carotenoids giving its orange colour); moringa (exceptionally nutrient-dense: vitamin C, vitamin A, iron, calcium, protein — often called a superfood); egusi seeds (high in protein, zinc, vitamin E); leafy greens (bitter leaf, water leaf, uziza) packed with vitamins and minerals; fermented foods (ogi/akamu — fermented cereal porridge; locust beans/iru — fermented Parkia seeds used as seasoning) provide probiotics',
    moringa: 'Moringa oleifera (drumstick tree) is one of the most nutrient-dense plants known; native to sub-Saharan Africa and South Asia; contains 7x more vitamin C than oranges; 4x more vitamin A than carrots; 4x more calcium than milk; high iron content; moringa leaf powder is increasingly used as a supplement; growing moringa is widespread in West Africa for both nutrition and income',
    exercise: 'Traditional West African dance (as exercise) including highlife, afrobeats dancing, and various traditional dances provide high-intensity cardio; the rise of Afrobeats dance fitness globally reflects the joyful, community-oriented exercise culture of West Africa',
    stress: 'Community and extended family (ubuntu/communalism) as stress buffers; oral tradition and storytelling as mental health practice; church and mosque communities provide significant stress support in West African culture; the importance of "keeping it together" culturally can make stress expression difficult — wellness culture is evolving to address this'
  },
  'south-asian': {
    nutrition: 'South Asian traditional diets feature anti-inflammatory spices: turmeric (curcumin — extensive research on anti-inflammatory properties); ginger (anti-inflammatory; digestive); fenugreek (blood glucose regulation; zinc-rich); cardamom; cinnamon; black pepper (piperine increases curcumin absorption by 2000%); these spices are used medicinally and culinarily',
    ayurvedaWellness: {
      triphala: 'Triphala (three fruits: amalaki/Indian gooseberry, bibhitaki, haritaki) is an Ayurvedic formulation used as a digestive tonic and antioxidant; amalaki (amla) is extremely high in vitamin C; used internally for "gut health" that Ayurveda associates with skin clarity',
      ashwagandha: 'Ashwagandha (Withania somnifera) is an adaptogen (herb that modulates stress response); multiple RCT studies show ashwagandha supplementation significantly reduces cortisol; clinical evidence for reducing stress, anxiety, and improving sleep quality; relevant to skin through cortisol/stress pathway',
      amla: 'Amla (Indian gooseberry) is one of the richest natural sources of vitamin C; the vitamin C is bound with tannins making it unusually heat-stable; used in South Asian medicine for centuries for skin health, hair health (amla oil), and immunity'
    },
    yoga: 'Yoga originated in ancient India; regular yoga practice reduces cortisol; improves circulation; supports lymphatic drainage; the global wellness movement has commodified yoga; within South Asian communities, yoga\'s origins are increasingly being reclaimed as a heritage practice rather than a Western wellness trend',
    dairy: 'High dairy consumption in North Indian diet (ghee, milk, paneer, dahi/yoghurt, lassi) can worsen dairy-sensitive acne; IGF-1 from dairy is the proposed mechanism; dahi/yoghurt (probiotic) is generally considered more beneficial than other dairy forms for gut health'
  },
  caribbean: {
    nutrition: 'Caribbean traditional diets incorporate highly nutritious ingredients: dasheen (taro root: high fibre, potassium); breadfruit (high carbohydrate, good fibre); soursop/guanábana (vitamin C, antioxidants); papaya (papain enzyme, vitamin C, beta-carotene); ackee (national fruit of Jamaica: unique fatty acid profile); callaloo (leafy green, nutrient-dense: iron, folate, calcium); sea moss (Irish moss/Chondrus crispus): increasingly popular as a "superfood" supplement in Caribbean communities globally',
    seaMoss: 'Sea moss (Chondrus crispus) has experienced a dramatic cultural revival in Caribbean communities globally, driven partly by holistic health advocates including Dr. Sebi (Alfredo Darrington Bowman); sea moss contains iodine (thyroid support), amino acids, and some minerals; the evidence for most claimed benefits is limited; as a source of carrageenan (a polysaccharide) it has thickening/gel properties; social media has amplified Caribbean sea moss culture significantly',
    exercise: 'Caribbean dance forms (calypso, soca, dancehall, reggae, zouk, salsa, merengue) are high-intensity aerobic exercise in cultural clothing; the dance culture is a form of joyful movement with deeply cultural roots; cricket and football (soccer) are also culturally significant sports',
    stress: 'The Caribbean concept of "liming" (relaxing, spending time with friends without a specific agenda) is a culturally important stress reduction practice; music (particularly Jamaican reggae and dancehall) as emotional processing; church communities; the concept of "vibes" (general positive atmosphere and energy) as a wellness orientation'
  },
  arab: {
    nutrition: 'The Mediterranean diet (extensively researched and associated with longevity and reduced inflammation) originated in the Arab/Mediterranean world; core components: olive oil (high monounsaturated fat, polyphenols with anti-inflammatory properties); legumes (lentils, chickpeas, foul/fava beans); vegetables; fish; moderate dairy; herbs and spices (thyme/zaatar, cumin, coriander, saffron)',
    oliveoil: 'Extra virgin olive oil (EVOO) contains oleocanthal (a natural anti-inflammatory with mechanism similar to ibuprofen); hydroxytyrosol (powerful antioxidant); used both topically and internally in Mediterranean/Arab beauty traditions; olive oil soap (aleppo soap, savon de Marseille) is a traditional Middle Eastern cleaning product; internal EVOO consumption associated with reduced inflammatory skin conditions in some studies',
    blackSeedInternal: 'Nigella sativa (black seed/black cumin) taken internally: significant evidence for anti-inflammatory effects; reduces inflammatory markers; relevant to inflammatory skin conditions; a traditional Islamic medicine practice with the Prophet Muhammad\'s endorsement adding cultural significance for Muslim communities across all Arab and non-Arab Muslim communities',
    dates: 'Dates (Medjool, Deglet Nour) are culturally and nutritionally significant in Arab culture; high in potassium, fibre, and antioxidants; the traditional Ramadan meal begins with dates and water; date palm is a symbol of Arab identity',
    stress: 'Islamic mindfulness practices (dhikr — remembrance of Allah; salah — the five daily prayers as structured mindfulness; Quranic recitation) have measurable stress-reducing effects; the ritual structure of Islamic practice provides psychological stability; Ramadan\'s spiritual focus functions as an annual intensive stress reduction and reflective period for many Muslim communities'
  },
  latina: {
    nutrition: 'Latin American diets are rich in skin-beneficial ingredients: avocado (monounsaturated fats, vitamin E, potassium; supports skin barrier and moisture); guava (5x more vitamin C than an orange — one of the highest food sources); papaya (vitamin C, beta-carotene, papain enzyme); hibiscus (agua de Jamaica: high in vitamin C, anthocyanins; anti-inflammatory); chilli peppers (vitamin C; capsaicin — anti-inflammatory); cacao (Mexican chocolate tradition: flavanols in cacao are vasodilatory and antioxidant)',
    avocado: 'Avocado is a Mexican native fruit (domesticated in Mexico approximately 5000 years ago); one of the richest food sources of monounsaturated fat and vitamin E; the Mexican tradition of guacamole consumption ensures regular avocado intake; avocado consumption is associated with better skin elasticity and facial fat distribution in a 2023 UCLA study',
    exercise: 'Latin dance forms (salsa, bachata, merengue, cumbia, tango, reggaeton) provide high-intensity cardio in a social, joyful context; the Zumba fitness phenomenon (created by Colombian dancer Alberto Pérez) globalised Latin dance as fitness; football (soccer) culture provides significant physical activity for many Latin American communities',
    stress: 'Family (familia) as primary stress support; the concept of "familismo" — family centrality — provides a social safety net; Catholic traditions and practices (novenas, patron saint traditions) provide community stress support; curanderismo (traditional healing practices) including herbal remedies and spiritual practices manage stress in some communities'
  },
  'east-asian': {
    nutrition: 'Traditional East Asian diets are associated with some of the world\'s longest life expectancies (Japanese "Blue Zone" status, particularly Okinawa); core principles: fermented foods (kimchi, miso, soy sauce, natto, tempeh, doenjang — probiotic-rich; gut health benefits); green tea (catechins — EGCG — potent antioxidants; anti-inflammatory; some evidence for anti-ageing skin effects when applied topically and consumed internally); seaweed (iodine, vitamins, minerals; wakame, nori, kombu); minimal processed food in traditional forms',
    greenTea: {
      EGCG: 'Epigallocatechin gallate (EGCG) is the most bioactive catechin in green tea; potent antioxidant; inhibits UV-induced skin damage and inflammation; may inhibit metalloproteinases that break down collagen; studies show topical application reduces UV-induced erythema; drinking 3+ cups of green tea daily associated with better skin outcomes in observational studies in Japanese populations',
      matcha: 'Matcha (powdered whole green tea leaf) provides significantly more EGCG per serving than regular steeped green tea; traditional Japanese tea ceremony (chado/chadō) elevates tea consumption to a mindfulness practice with cultural significance beyond nutrition'
    },
    fermented: 'Natto (Japanese fermented soybeans) contains vitamin K2 (rare in most diets; important for cardiovascular health and bone health; may support skin by reducing calcium deposition in elastin fibres); nattokinase; and the highest natural food source of vitamin K2',
    exercise: 'Martial arts traditions (karate, taekwondo, judo, kendo, hapkido, kung fu, tai chi, qigong) are culturally embedded forms of exercise in East Asian communities; tai chi and qigong are specifically associated with stress reduction and are practised extensively among older East Asian populations globally',
    stress: 'The concept of "ma" (negative space/silence) in Japanese aesthetics; wabi-sabi (finding beauty in imperfection and impermanence); ikigai (reason for being) as a life satisfaction framework; South Korean "nunchi" (emotional intelligence and social awareness); forest bathing (shinrin-yoku — practised walking in forests for health in Japan; measurably reduces cortisol and improves immune function in studies)'
  },
  'east-african': {
    nutrition: 'Ethiopian and East African diets feature: teff (very high iron, calcium, protein; the main grain in Ethiopian injera; naturally gluten-free; low glycaemic index — particularly beneficial for skin vs refined flour); coffee (Ethiopia is the birthplace of coffee; rich in chlorogenic acids and antioxidants; moderate consumption associated with anti-inflammatory effects); kale and other leafy greens; lentils (misir); Ethiopian berbere spice blend (fenugreek, coriander, chilli, and multiple other spices — anti-inflammatory compound)',
    teff: 'Teff grain (Eragrostis tef) is native to Ethiopia; the most nutritionally complete grain widely consumed; gram for gram: more iron than other grains; high calcium; good protein with all essential amino acids; low glycaemic; the basis of injera (fermented teff flatbread) which is also probiotic due to fermentation',
    coffee: 'Coffee originated in Ethiopia (in the Kaffa region, giving the plant its name); Ethiopian coffee ceremony (buna) is a elaborate social and spiritual ritual involving three rounds of coffee, frankincense incense burning, and community gathering; it is one of the most important social institutions in Ethiopian culture; the ceremony itself is a wellness practice beyond the nutritional properties of the coffee',
    exercise: 'Ethiopian and East African runners are globally dominant in distance running; the combination of high altitude training (building aerobic capacity), cultural emphasis on distance walking (rural East Africa), and specific body composition contribute to East African distance running excellence; this athletic culture translates to high rates of physical activity in these communities'
  },
  'south-african': {
    nutrition: 'South African traditional diets (Zulu, Xhosa, Sotho, etc.) include: umqombothi (traditional sorghum beer — fermented; probiotic properties); morogo (wild indigenous leafy greens); amadumbe (taro root); inkomazi (fermented milk/amasi — South African kefir equivalent; rich in probiotics); maize (the staple; mealie meal/ugali); biltong (dried, cured meat — high protein; a traditional South African preservation method)',
    rooibos: {
      internal: 'Rooibos (Aspalathus linearis) is a uniquely South African plant (endemic to the Cederberg region); as a beverage: naturally caffeine-free; rich in antioxidants (aspalathin — a unique C-glucosyl dihydrochalcone not found in any other plant); anti-inflammatory; some evidence for anti-diabetic effects (relevant to skin health through blood glucose management); widely consumed as a daily wellness beverage in South Africa',
      skin: 'Topical rooibos extract is anti-inflammatory; used in South African natural skincare; applied to eczema-prone or acne-prone skin; brands: Africology, African Botanics'
    },
    exercise: 'Rugby is a dominant sport in white South African (Afrikaner) culture; cricket and football in Black South African communities; parkrun (the global running movement) was invented in the UK but has extraordinary participation in South Africa — more parkrun events per capita than any country; walking, cycling, and mountain hiking (Table Mountain, Drakensberg) are popular wellness activities',
    stress: 'Ubuntu (Nguni Bantu concept): "I am because we are" — communal wellness and mutual support; the concept of ubuntu is a fundamental cultural framework for community healing; traditional healing (sangomas — traditional healers who address spiritual and psychological aspects of health alongside physical); the Truth and Reconciliation Commission process was itself a community-level trauma healing practice with ongoing cultural significance'
  },
  'black-american': {
    nutrition: 'Soul food (traditional Black American cuisine) has been evolving in the wellness era; traditional soul food: collard greens (extremely nutrient-dense: vitamin K, vitamin C, folate, calcium); black-eyed peas and other legumes (fibre, protein, zinc); sweet potato (very high beta-carotene, vitamin C); the wellness movement has reclaimed vegetable-forward soul food elements while acknowledging the high-fat, high-sodium historical context (a legacy of cooking with what was available during slavery and Jim Crow segregation)',
    plantBased: 'The plant-based food movement has significant traction in Black American wellness communities; a 2019 Gallup poll showed Black Americans are the fastest growing demographic adopting plant-based diets in the US; Black-owned plant-based restaurants and food brands have grown significantly; the connection to health equity (higher rates of hypertension, diabetes, and heart disease in Black communities) drives health-focused dietary changes',
    exercise: 'Basketball and football are the most culturally prominent sports in Black American communities; however, the wellness movement has expanded to include: meditation and yoga (adoption growing in Black American communities, with Black-owned yoga studios and Black yoga instructors addressing historically exclusionary mainstream yoga spaces); hiking (organisations like Outdoor Afro and Black Girls RUN! were created specifically to welcome Black Americans into traditionally white outdoor recreation spaces); swimming (historical exclusion from pools during segregation created generational gaps in swimming ability in Black American communities — a current public health and safety issue)',
    blackGirlsRun: 'Black Girls RUN! (founded 2009) addresses the intersection of health equity, community building, and physical wellness in Black American women\'s communities; similarly Black Men Run (founded 2012); these organisations address structural barriers to outdoor exercise for Black communities and have created millions of runners who otherwise might not have connected with the sport',
    stress: {
      racial: 'Racial trauma is a recognised form of chronic stress in Black American communities; the ongoing experience of systemic racism, discrimination, police violence, and microaggressions creates a form of chronic stress with documented physiological effects on skin, hair, and health; this is a public health issue, not a personal failing',
      healing: 'Black American community healing practices: therapy (increasingly sought; Black therapist directories like Therapy for Black Girls, Therapy for Black Men have grown enormously); journaling; music (blues, gospel, hip-hop as emotional processing); community activism (as empowerment and cortisol regulation through agency); church communities; ancestral practice reclamation'
    }
  }
};

export function getNutritionSkinGuide(section) {
  const map = {
    macros: NUTRITION_SKIN_SCIENCE.macronutrients,
    micros: NUTRITION_SKIN_SCIENCE.micronutrients,
    water: NUTRITION_SKIN_SCIENCE.water,
    exercise: EXERCISE_SKIN,
    stress: STRESS_SKIN
  };
  return map[section] || null;
}

export function getEthnicWellnessBeautyGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_WELLNESS_BEAUTY_GUIDES['west-african'],
    'south-asian': ETHNIC_WELLNESS_BEAUTY_GUIDES['south-asian'],
    caribbean: ETHNIC_WELLNESS_BEAUTY_GUIDES.caribbean,
    arab: ETHNIC_WELLNESS_BEAUTY_GUIDES.arab,
    latina: ETHNIC_WELLNESS_BEAUTY_GUIDES.latina,
    'east-asian': ETHNIC_WELLNESS_BEAUTY_GUIDES['east-asian'],
    'east-african': ETHNIC_WELLNESS_BEAUTY_GUIDES['east-african'],
    'south-african': ETHNIC_WELLNESS_BEAUTY_GUIDES['south-african'],
    'black-american': ETHNIC_WELLNESS_BEAUTY_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

export const WELLNESS_BEAUTY_STATS = {
  moduleId: 'wellness_beauty_guide',
  version: '1.0.0',
  topics: ['nutrition skin collagen protein omega-3 anti-inflammatory', 'glycaemic index acne IGF-1 sebum insulin', 'biotin supplement hair nail evidence caution', 'collagen peptides supplement evidence 2021', 'omega-3 acne study 2012 journal dermatology', 'cortisol stress skin collagen breakdown inflammatory', 'gut skin axis probiotics fermented kimchi kefir injera', 'moringa West African superfood nutrition skin', 'ashwagandha adaptogen cortisol reduction RCT', 'green tea EGCG catechins antioxidant skin UV', 'matcha Japanese tea ceremony mindfulness', 'shinrin-yoku forest bathing cortisol immune Japan', 'teff Ethiopian nutrition iron low glycaemic skin', 'rooibos internal antioxidant anti-diabetic South African', 'avocado vitamin E monounsaturated skin elasticity 2023', 'ubuntu communal wellness Black South African', 'racial trauma stress skin health Black American', 'Black Girls RUN Black Men Run health equity exercise', 'sea moss Caribbean wellness trend Dr Sebi'],
  communitiesSupported: 9,
  keyFacts: [
    'High glycaemic index diets (white rice, white bread, sugary drinks) trigger insulin and IGF-1 release which increases sebum production; a 2007 American Journal of Clinical Nutrition RCT found a low glycaemic load diet significantly reduced acne lesion count in young men compared to a control high-GI diet; this dietary connection is particularly relevant for communities consuming high-GI staples (white rice in East Asian, South Asian, and Caribbean communities; white bread in Arab communities)',
    'Ashwagandha (Withania somnifera), the Ayurvedic adaptogen, has been studied in multiple randomised controlled trials that consistently show significant reductions in cortisol levels and perceived stress; since chronic cortisol elevation breaks down collagen, worsens acne, disrupts the skin barrier, and worsens inflammatory conditions, ashwagandha\'s cortisol-reducing effect has real relevance to skin health beyond wellness marketing',
    'EGCG (epigallocatechin gallate) in green tea has significant antioxidant and anti-inflammatory properties with evidence both as a topical and as a dietary component for skin health; the Japanese practice of drinking 3+ cups of green tea daily (and the elevated matcha consumption in traditional Japanese culture) is associated with better skin outcomes in observational research and the tea ceremony (chado) itself represents a mindfulness practice with measurable cortisol-reducing effects',
    'Racial trauma is a recognised form of chronic stress in Black American communities with documented physiological effects; the ongoing experience of systemic racism creates chronic cortisol elevation that affects skin health (worsens acne, PIH, and inflammatory conditions) — organisations like Black Girls RUN! and Therapy for Black Girls were created to address health equity gaps by building community access to physical activity and mental health care',
    'Moringa oleifera (native to sub-Saharan Africa and South Asia) is one of the most nutrient-dense plants known — gram for gram containing 7x more vitamin C than oranges, 4x more vitamin A than carrots, and significant iron and calcium; moringa leaf powder is increasingly used in West African wellness practices and global supplement markets; its high vitamin C content supports collagen synthesis and its carotenoid content is skin-beneficial'
  ]
};
