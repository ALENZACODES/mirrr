// spa_treatments_ethnic_guide.js
// Traditional spa treatments, self-care rituals, and relaxation practices
// across 9 ethnic communities — fully self-contained ESM module

// ─────────────────────────────────────────────────────────────────────────────
// WEST AFRICAN SPA GUIDE
// ─────────────────────────────────────────────────────────────────────────────
const WEST_AFRICAN_SPA = {
  id: 'west-african',
  name: 'West African Wellness Traditions',
  overview: `West African wellness culture is rooted in the philosophy that beauty and health are communal achievements. From the markets of Accra to the courtyards of Dakar, women have long gathered to prepare, anoint, and care for one another's bodies. The ingredients — shea, black soap, moringa, palm — are not luxury additions but staple necessities passed down through matrilineal knowledge systems.`,
  treatments: [
    {
      name: 'Shea Butter Full-Body Treatment',
      origin: 'Burkina Faso, Ghana, Mali, Nigeria',
      duration: '60–90 minutes',
      description: `Raw, unrefined shea butter (ori in Yoruba, nkuto in Twi) is the cornerstone of West African body care. The shea tree — Vitellaria paradoxa — grows across the Sahel and is harvested and processed almost exclusively by women. The ritual begins by warming the shea between the palms until it melts into a liquid gold. The body is massaged section by section, starting from the feet and moving upward, following lymphatic pathways. The butter is worked into the skin with deep, circular kneading, paying special attention to elbows, knees, and heels. A thin layer is left on the skin and the body is wrapped in warmed cotton cloth for 20 minutes to allow deep absorption. The result is skin that is visibly luminous, deeply moisturized, and protected from the sun and dry Harmattan winds.`,
      keyIngredients: ['raw shea butter', 'baobab oil', 'African black pepper essential oil', 'turmeric powder'],
      benefits: ['Deep skin moisturization', 'Anti-inflammatory action', 'UV protection', 'Wound healing', 'Eczema relief'],
      culturalNote: `In Burkina Faso, shea cooperatives — almost entirely run by women — produce the majority of the world's shea supply. The processing of shea is itself a ritual: the cracking, boiling, churning and kneading takes hours and is done in groups, accompanied by songs and stories. When a woman applies shea to another's body, she is continuing this tradition of communal care.`
    },
    {
      name: 'Ghanaian African Black Soap Bath Ritual',
      origin: 'Ghana (Ashanti region)',
      duration: '45 minutes',
      description: `Authentic Ghanaian black soap (alata samina) is made by roasting and grinding plantain skins, cocoa pod ash, palm kernel oil, and shea butter in specific ratios known only to experienced soap makers. The ritual begins with a steam, either in a wooden steam room or by draping a cloth over a bowl of boiled water infused with eucalyptus and neem leaves. The steamed skin is then lathered with black soap, which produces a rich, dark foam. The soap is left on the skin for 5–7 minutes while the natural alpha hydroxy acids from the plantain ash begin to gently exfoliate. The body is then rinsed with warm water followed by a cool rinse to close pores. The skin is patted dry and immediately sealed with raw shea butter. Weekly use gradually evens skin tone, reduces hyperpigmentation, and clears acne.`,
      keyIngredients: ['authentic alata samina', 'plantain ash', 'cocoa pod ash', 'palm kernel oil', 'shea butter'],
      benefits: ['Gentle chemical exfoliation', 'Hyperpigmentation reduction', 'Acne treatment', 'Deep cleansing', 'Skin tone evening'],
      culturalNote: `Black soap is often the first beauty product a Ghanaian child uses. Mothers bathe their newborns with diluted black soap to protect the baby's skin. The soap's formulation varies by region — Ashanti black soap is different from Lagos black soap — and each region's women guard their recipes closely.`
    },
    {
      name: 'West African Steam Room Ritual',
      origin: 'Nigeria, Senegal, Ghana',
      duration: '30–45 minutes',
      description: `Steam bathing in West Africa predates modern wellness culture by centuries. In many homes, a simple clay pot filled with water infused with herbs is placed on hot coals, and the bather sits draped in cloth to receive the steam. Herbs used include: fever grass (lemongrass), efirin (Yoruba basil), nchuawun (Igbo — a type of mint), and dried citrus peels. The steam opens pores, loosens congestion, and softens the skin for subsequent treatments. In Senegal, the steam ritual is often followed by a baobab oil application. In Nigeria, the steam is used postpartum to help new mothers' bodies recover — the heat is believed to tighten the uterus and restore the body's internal balance.`,
      keyIngredients: ['lemongrass', 'Yoruba basil', 'cloves', 'dried orange peel', 'eucalyptus leaves'],
      benefits: ['Pore opening', 'Respiratory clearing', 'Postpartum recovery', 'Detoxification', 'Relaxation'],
      culturalNote: `The postpartum steam ritual in Nigeria involves the new mother sitting over a clay pot of steaming herbal water for 20–30 minutes daily for the first 40 days after birth. Female relatives take turns preparing the herbs and sitting with the new mother during this vulnerable period.`
    },
    {
      name: 'Moringa Oil Treatment',
      origin: 'Senegal, Nigeria, Ghana',
      duration: '30 minutes',
      description: `Moringa oleifera — called the miracle tree — produces seeds rich in behenic acid, an extremely stable fatty acid that resists rancidity and forms a protective barrier on skin. Cold-pressed moringa oil is applied to damp skin, face, and hair after bathing. For a facial treatment, moringa oil is blended with turmeric and applied as a mask for 20 minutes. For scalp treatment, the oil is warmed and worked into sections of the scalp with firm fingertip pressure, stimulating blood flow to hair follicles. The oil's high antioxidant content — particularly vitamins A, C, and E — addresses oxidative stress on the skin caused by sun exposure.`,
      keyIngredients: ['cold-pressed moringa oil', 'turmeric', 'raw honey', 'rose water'],
      benefits: ['Hair growth stimulation', 'Anti-aging', 'Hyperpigmentation treatment', 'Moisturization', 'Scalp health'],
      culturalNote: `In Senegal, moringa is called 'nebedaye' — never die — because every part of the tree is usable. Women in rural Senegal grow moringa trees in their compounds and harvest the leaves, seeds, and pods for food and beauty.`
    },
    {
      name: 'Communal Beauty Preparation',
      origin: 'Pan-West African',
      duration: '2–4 hours',
      description: `Perhaps more significant than any single product or technique is the social structure of West African beauty culture. Before celebrations — naming ceremonies, weddings, festivals — women gather to prepare together. One woman does the braiding while another applies henna to hands, while another steams and massages a third. There is singing, conversation, food sharing, and laughter. This communal beauty preparation is itself the wellness practice: the bonding, the mutual care, the sharing of knowledge across generations. Modern West African spa culture attempts to recreate this through group spa days, communal steaming rooms, and treatments designed for multiple people simultaneously.`,
      keyIngredients: ['community', 'music', 'shared recipes', 'intergenerational knowledge'],
      benefits: ['Mental health through connection', 'Stress reduction', 'Cultural preservation', 'Intergenerational bonding'],
      culturalNote: `The Akan concept of sankofa — going back to fetch what you left behind — applies to beauty culture. Young West African women are reclaiming traditional beauty practices that were disrupted by colonialism, which introduced Western cosmetics and devalued indigenous knowledge systems.`
    }
  ],
  diyRecipe: {
    name: 'West African Shea and Black Soap Body Treatment',
    ingredients: ['2 oz raw shea butter', '1 oz African black soap', '1 tsp moringa powder', '5 drops lemongrass essential oil'],
    steps: [
      'Steam your body for 10 minutes using a lemongrass and eucalyptus infusion',
      'Lather the black soap over your body and leave for 5 minutes',
      'Rinse thoroughly with warm water',
      'While skin is still damp, blend shea butter with moringa powder and lemongrass oil',
      'Apply generously from feet upward using circular massage motions',
      'Wrap in a warm towel for 15 minutes to seal in moisture'
    ]
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SOUTH ASIAN SPA GUIDE
// ─────────────────────────────────────────────────────────────────────────────
const SOUTH_ASIAN_SPA = {
  id: 'south-asian',
  name: 'Ayurvedic and South Asian Wellness Traditions',
  overview: `Ayurveda — the science of life — is humanity's oldest intact wellness system, estimated at over 5,000 years old. Unlike wellness systems that treat the body as a machine to be fixed, Ayurveda sees the body as a microcosm of the universe, governed by three doshas (Vata, Pitta, Kapha) that must be kept in dynamic balance. South Asian spa treatments are therefore not cosmetic procedures but constitutional prescriptions designed for each individual's unique energetic makeup.`,
  treatments: [
    {
      name: 'Shirodhara — Warm Oil Stream on the Forehead',
      origin: 'Kerala, India',
      duration: '45–60 minutes',
      description: `Shirodhara (shiro = head, dhara = stream) is the continuous pouring of warm medicated oil onto the forehead, specifically onto the ajna chakra — the third eye point between the eyebrows. The patient lies supine on a wooden droni (treatment table) while an earthenware vessel suspended above the forehead releases a thin, steady stream of warm sesame or Brahmi oil. The flow is calibrated to hit exactly 4 fingers above the hairline. The treatment lasts 30–45 minutes and the patient enters a state between waking and sleep — the brain waves measurably shift from beta to alpha and theta states. Shirodhara is prescribed for insomnia, anxiety, migraines, tinnitus, depression, and premature graying. The oil type varies by dosha: Vata types receive warm sesame oil; Pitta types receive cooling coconut oil with rose; Kapha types receive mustard oil with camphor.`,
      keyIngredients: ['sesame oil', 'Brahmi oil', 'Bhringraj oil', 'ashwagandha', 'triphala'],
      benefits: ['Deep nervous system calm', 'Insomnia treatment', 'Migraine relief', 'Anxiety reduction', 'Cognitive clarity'],
      culturalNote: `In traditional Kerala Ayurvedic hospitals (called Chikitsalayams), shirodhara is performed only after three days of full Panchakarma preparation to ensure the patient's body is ready to receive and benefit from the treatment. Performing it without preparation is considered wasteful or even harmful.`
    },
    {
      name: 'Abhyanga — Full-Body Oil Massage',
      origin: 'All of India, especially Kerala and Karnataka',
      duration: '60–90 minutes',
      description: `Abhyanga is the daily oil self-massage practice that every Ayurvedic practitioner prescribes for dinacharya (daily routine). In a professional setting, two therapists work simultaneously on both sides of the body, synchronizing their strokes to create a hypnotic, symmetrical sensation. The oil used (Mahanarayan, Dhanwantharam, or plain sesame depending on dosha and condition) is warmed and applied in long strokes along the limbs toward the heart, and circular strokes over joints. Each joint receives special attention as the oil is worked into the joint space. The massage moves prana (life force) through the 72,000 nadis (energy channels) of the body. After the massage, the patient rests for 20 minutes to allow oil absorption before a herbal steam (swedana) opens the pores to receive the medicinal properties of the oil more deeply.`,
      keyIngredients: ['sesame oil', 'Mahanarayan oil', 'Dhanwantharam oil', 'neem', 'turmeric', 'ashwagandha'],
      benefits: ['Improved circulation', 'Joint lubrication', 'Nervous system nourishment', 'Skin health', 'Lymphatic drainage'],
      culturalNote: `The Ashtanga Hridayam — one of the three classical Ayurvedic texts — states: "Abhyanga should be resorted to daily. It wards off old age, exertion and aggravation of vata. It bestows good vision, nourishment to the body, long life, good sleep, good skin. It should be applied especially to the head, ears and feet."`
    },
    {
      name: 'Ubtan — Full-Body Herbal Exfoliation',
      origin: 'Punjab, Rajasthan, Bengal',
      duration: '45 minutes',
      description: `Ubtan (also called besan ubtan or bridal ubtan) is a paste applied to the entire body and left to dry before being rubbed off in circular motions that exfoliate, brighten, and soften the skin. The base is chickpea flour (besan), which provides gentle enzymatic exfoliation. To this is added sandalwood powder, turmeric, rosewater, and either raw milk or yogurt to bind the paste. For brides, ubtan rituals are performed daily for 40 days before the wedding, producing a visible transformation of skin texture and tone. The application of ubtan is a social ritual — female relatives and friends apply it together, with songs (Haldi ceremony music) and festivity. The yellow turmeric stain on fingers identifies participants as part of a celebration.`,
      keyIngredients: ['chickpea flour (besan)', 'turmeric', 'sandalwood', 'raw milk', 'rosewater', 'saffron'],
      benefits: ['Physical exfoliation', 'Skin brightening', 'Tan removal', 'Pore cleansing', 'Skin softening'],
      culturalNote: `In North Indian weddings, the Haldi ceremony — where ubtan with turmeric is applied to bride and groom by relatives — is a protective ritual. Turmeric's antiseptic and anti-inflammatory properties were understood intuitively long before biochemistry confirmed them. The yellow color is also associated with Vishnu and auspiciousness.`
    },
    {
      name: 'Sound Healing with Singing Bowls',
      origin: 'Nepal, Tibetan Buddhist traditions, adopted in South Asian wellness',
      duration: '30–60 minutes',
      description: `Tibetan singing bowls produce complex multi-tonal vibrations when struck or when a wooden mallet is run along their rim. In a sound healing session, bowls of various sizes are placed on and around the body, each producing a different frequency. The vibrations travel through bone and tissue, creating a form of internal massage at the cellular level. Research supports that sound frequencies in the 40–60 Hz range (produced by large bowls) entrain brain waves toward delta state — the deep sleep frequency associated with cellular repair and immune function. The session concludes with silence, which is itself part of the treatment — the contrast between sound and silence creates heightened awareness of the body's own rhythms.`,
      keyIngredients: ['Tibetan singing bowls', 'crystal bowls', 'silence', 'intention'],
      benefits: ['Brain wave entrainment', 'Stress reduction', 'Pain management', 'Improved sleep', 'Emotional release'],
      culturalNote: `Though often associated with Buddhism, singing bowl use predates Buddhism and was part of Bon (the pre-Buddhist Tibetan tradition) and may have origins in Vedic traditions. Modern sound healers in India integrate Nada Brahma philosophy — the belief that the universe itself is sound, and that healing is a process of restoring harmony to the body's own sonic architecture.`
    },
    {
      name: 'Yoga Nidra — Conscious Sleep as Beauty Rest',
      origin: 'Bihar School of Yoga, India',
      duration: '30–45 minutes',
      description: `Yoga nidra (yogic sleep) is a guided meditation practice in which the practitioner reaches the hypnagogic state — the threshold between waking and sleeping — while remaining conscious. Pioneered in its current form by Swami Satyananda Saraswati in the 1960s, yoga nidra follows a precise protocol: body scan, breath awareness, pairs of opposite sensations, visualization, and sankalpa (intention setting). Research at AIIMS New Delhi showed a 30-minute yoga nidra session equivalent in restorative value to 4 hours of ordinary sleep, based on cortisol reduction, HGH release, and EEG readings. The HGH (human growth hormone) released during yoga nidra is the same hormone responsible for cellular repair, collagen production, and skin regeneration during deep sleep. Regular yoga nidra practice measurably improves skin quality through this mechanism.`,
      keyIngredients: ['comfortable mat', 'blanket', 'eye pillow', 'guided audio', 'sankalpa (intention)'],
      benefits: ['Cortisol reduction', 'HGH release', 'Deep restoration', 'Anxiety relief', 'Skin regeneration'],
      culturalNote: `The ancient text Mandukya Upanishad describes four states of consciousness: waking, dreaming, deep sleep, and turiya (pure awareness). Yoga nidra is a practice of consciously navigating the transition between these states — it is both a wellness technique and a meditation practice approaching the fourth state.`
    }
  ],
  diyRecipe: {
    name: 'Bridal Ubtan Body Treatment',
    ingredients: ['3 tbsp chickpea flour', '1 tsp turmeric', '1 tsp sandalwood powder', '2 tbsp raw milk', '1 tsp rosewater', 'pinch of saffron'],
    steps: [
      'Steep saffron in warm rosewater for 10 minutes',
      'Combine chickpea flour, turmeric, and sandalwood in a bowl',
      'Add milk and saffron-rosewater to form a thick paste',
      'Apply all over face and body in upward strokes',
      'Leave for 20–30 minutes until slightly dry',
      'Rub off in circular motions — the paste exfoliates as it comes off',
      'Rinse with cool water and seal with a few drops of rose hip oil'
    ]
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CARIBBEAN SPA GUIDE
// ─────────────────────────────────────────────────────────────────────────────
const CARIBBEAN_SPA = {
  id: 'caribbean',
  name: 'Caribbean Island Wellness Traditions',
  overview: `Caribbean wellness is inseparable from the natural environment. The region's extraordinary biodiversity — volcanic mud, mineral springs, tropical fruits, ocean salt, coral sand — provides the raw materials for treatments that are simultaneously grounded in Afro-Caribbean healing traditions, indigenous Taíno and Arawak practices, and European botanical influences. The sea itself is the primary healer.`,
  treatments: [
    {
      name: 'Seawater and Ocean Therapy (Thalassotherapy)',
      origin: 'Pan-Caribbean',
      duration: '1–3 hours',
      description: `Thalassotherapy (from thalassa, Greek for sea) has been practiced in the Caribbean for centuries by enslaved Africans and their descendants who found that seawater bathing aided the healing of wounds, soothed aching muscles, and kept skin healthy despite brutal conditions. Modern thalassotherapy uses heated seawater in pools, but the traditional practice involves floating in the actual ocean, particularly in shallow bays where the water is warm and the salt concentration higher. Caribbean seawater contains trace minerals including magnesium, calcium, potassium, and selenium that are absorbed through the skin during prolonged immersion. Ocean bathing at dawn — with the water at its calmest — is a meditative practice combining the physical benefits of saltwater with the psychological benefits of sunrise and the sound of waves (a proven parasympathetic nervous system activator).`,
      keyIngredients: ['Atlantic/Caribbean seawater', 'morning sunlight', 'tropical breeze', 'silence'],
      benefits: ['Magnesium absorption', 'Wound healing', 'Muscle recovery', 'Skin hydration', 'Mental clarity'],
      culturalNote: `In Jamaica, "sea bathing" is a ritual not just for tourists but for locals who go to the sea for healing — to "wash away" illness, heartbreak, and spiritual contamination. Many Rastafarians practice Ital (natural) living which includes ocean bathing as a purification practice.`
    },
    {
      name: 'Volcanic Mud Treatment (Soufrière and Montserrat)',
      origin: 'St. Lucia (Sulphur Springs), Montserrat, Dominica',
      duration: '60 minutes',
      description: `St. Lucia's Sulphur Springs — the world's only drive-in volcano — produces warm volcanic mud rich in sulfur, silica, magnesium, and iron. The traditional treatment involves coating the body in this grey-green mud from head to toe and allowing it to dry in the sun for 20–30 minutes. As the mud dries, it draws impurities out of the skin through osmosis, tightens pores, and deposits minerals into the skin. The sulfur content has antibacterial and antifungal properties particularly beneficial for acne, eczema, and psoriasis. The Dominica-style treatment uses mineral-rich mud from hot springs in the interior rainforest, blended with wild aloe vera harvested from the hillsides. After the mud dries, it is rinsed in a nearby cold mineral spring, creating a natural hot-cold thermal circuit.`,
      keyIngredients: ['volcanic mud', 'sulfur minerals', 'wild aloe vera', 'cold mineral spring water'],
      benefits: ['Deep pore cleansing', 'Mineral infusion', 'Skin condition treatment', 'Detoxification', 'Skin tightening'],
      culturalNote: `Montserrat's volcanic landscape, partially destroyed by the 1995 Soufrière Hills eruption, still provides healing mud baths that local healers have used for generations. The healing mud is sometimes mixed with coconut oil and used as a drawing poultice for deep infections and joint pain.`
    },
    {
      name: 'Sea Moss Wrap',
      origin: 'Jamaica, Trinidad, Barbados',
      duration: '45 minutes',
      description: `Irish moss (Gracilaria or Chondrus crispus) — known as sea moss in the Caribbean — grows in tide pools along the rocky Caribbean coastline. Harvested, sun-dried, and rehydrated, sea moss creates a viscous gel containing 92 of the 102 minerals that compose the human body. When applied as a body wrap, the gel is spread over the entire body, which is then wrapped in warm linen. The carrageenan compounds in the gel form a film over the skin that draws out toxins while depositing minerals. Sea moss is particularly rich in iodine (thyroid function), potassium chloride (respiratory support), and zinc (immune function). The wrap is left on for 30 minutes; as the wrap is removed, the skin feels silky and visibly clearer.`,
      keyIngredients: ['rehydrated sea moss gel', 'lime juice', 'aloe vera', 'warm linen wraps'],
      benefits: ['Mineral supplementation via skin', 'Detoxification', 'Skin smoothing', 'Thyroid support', 'Anti-inflammatory'],
      culturalNote: `In Jamaica, sea moss drink (sea moss blended with milk, cinnamon, and vanilla) is a traditional health tonic. The phrase "drink your sea moss" is the Caribbean grandmother's answer to nearly every complaint of weakness, immunity issues, or sexual dysfunction. Dr. Sebi, the Honduran herbalist beloved in Caribbean and Black American communities, popularized sea moss as a universal healing agent.`
    },
    {
      name: 'Coconut Milk Bath',
      origin: 'Pan-Caribbean, with roots in Southeast Asian and Indian traditions brought by indentured laborers',
      duration: '30 minutes',
      description: `Fresh coconut milk — extracted by grating the white flesh of mature coconuts and squeezing through cloth — is poured into warm bath water. The lauric acid in coconut milk has antibacterial, antifungal, and antiviral properties. The fat content creates a natural emollient bath that leaves skin coated in a thin protective layer. Fresh coconut milk baths are a traditional postpartum treatment in the Caribbean, particularly in communities with South Asian heritage (brought by indentured laborers from India in the 1800s). The milk is often infused with rose petals, bay rum leaves, and lime zest for fragrance. Modern Caribbean spas serve this treatment with a side of fresh coconut water to drink — supporting internal hydration while the bath hydrates the skin externally.`,
      keyIngredients: ['fresh coconut milk', 'rose petals', 'bay rum leaves', 'lime zest', 'sea salt'],
      benefits: ['Skin softening', 'Infection prevention', 'Postpartum recovery', 'Deep moisturization', 'Relaxation'],
      culturalNote: `In Trinidad, coconut milk baths are prescribed by older women (obeah practitioners and folk healers) for a range of conditions from skin rashes to spiritual cleansing. The coconut is considered a spiritually protective fruit in several Afro-Caribbean religious traditions including Santería and Trinidad's own Spiritual Baptist tradition.`
    },
    {
      name: 'Rum Body Treatment (Barbados)',
      origin: 'Barbados',
      duration: '45 minutes',
      description: `Barbados has been producing rum since the 1600s, and Barbadian women discovered early that the molasses and sugarcane-derived compounds in rum had skin benefits. A Bajan rum scrub combines raw demerara sugar, Mount Gay rum, coconut oil, and fresh lime to create a warming, circulatory-stimulating body scrub. The alcohol in the rum opens blood vessels near the skin surface, increasing circulation and giving the skin a flushed, glowing appearance. The sugar provides physical exfoliation while the molasses compounds provide chemical glycolic acid exfoliation. The treatment is followed by a coconut oil moisturizing massage. Some Barbadian spas offer a rum-infused wrap where soaked bandages are applied to the body to deliver a sustained dose of the rum's active compounds.`,
      keyIngredients: ['Mount Gay rum', 'demerara sugar', 'coconut oil', 'fresh lime', 'vanilla bean'],
      benefits: ['Circulation stimulation', 'Dual exfoliation (physical + chemical)', 'Brightening', 'Warming', 'Skin softening'],
      culturalNote: `Rum was historically used in the Caribbean as a topical antiseptic and anesthetic before formal medicine was accessible. "Bay rum" — rum infused with bay laurel leaves — is still used across the Caribbean as an aftershave, a fever reducer (applied to the forehead), and a scalp treatment for dandruff and hair growth.`
    }
  ],
  diyRecipe: {
    name: 'Caribbean Sea Moss and Coconut Body Treatment',
    ingredients: ['4 tbsp sea moss gel', '2 tbsp coconut oil', '1 tbsp lime juice', '1 tsp raw honey', '5 drops neroli or ylang-ylang essential oil'],
    steps: [
      'Combine sea moss gel with melted coconut oil and lime juice',
      'Add honey and essential oil, stir thoroughly',
      'Apply to damp skin after a warm shower',
      'Massage in circular motions head to toe for 10 minutes',
      'Wrap in a warm towel and rest for 20 minutes',
      'Rinse with warm water followed by cool water',
      'Seal with a thin layer of coconut oil'
    ]
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ARAB SPA GUIDE
// ─────────────────────────────────────────────────────────────────────────────
const ARAB_SPA = {
  id: 'arab',
  name: 'Arab and Middle Eastern Hammam Traditions',
  overview: `The Arab hammam (from the Arabic hammam, meaning "spreader of warmth") is simultaneously a hygienic institution, a social hub, a spiritual purification space, and a comprehensive wellness system. Tracing its roots to Roman thermae and Persian bathing culture, the Islamic hammam was institutionalized across the Arab world following the principle in Islamic jurisprudence that ritual purity (taharah) is both a spiritual obligation and a foundation of physical health. A traditional hammam treats the body as a whole system requiring systematic preparation, cleansing, treatment, and sealing.`,
  treatments: [
    {
      name: 'The Full Hammam Experience — 7-Step Protocol',
      origin: 'Morocco, Turkey, Syria, Egypt, Lebanon',
      duration: '90–180 minutes',
      description: `Step 1 — Warming (Harara): The visitor enters the frigidarium (cold room), then moves to the tepidarium (warm room) and finally to the caldarium (hot room) in sequence, spending 10–15 minutes in each to allow the body to gradually acclimate. The hot room is heated to 40–50°C by underfloor hot water pipes (hypocaust system). Steam is created by pouring water onto hot stones.

Step 2 — Sweating and Opening: In the hot room, the bather lies on a heated marble slab (harara stone) and sweats for 15–20 minutes. The combination of the hot marble warming the body from below and the steam opening pores from above creates a passive, complete opening of the skin's surface layer.

Step 3 — Black Soap Application (Beldi Soap): Moroccan beldi soap — made from black olive oil, water, and potassium hydroxide — is applied to the entire body and left for 5–10 minutes. This soap is not cleansing in the conventional sense; it is conditioning. The olive oil's polyphenols begin to break down dead skin cell bonds, making the subsequent exfoliation dramatically more effective.

Step 4 — Kessa Scrub: The kessa is a textured glove (originally made from goat hair, now typically synthetic or silk) that is used in long, firm strokes over the soap-softened skin. Grey rolls of dead skin emerge immediately, visibly revealing the fresh skin beneath. A full kessa scrub removes the entire stratum corneum (outermost dead skin layer) in a single session — something that would take weeks of using conventional exfoliating products.

Step 5 — Ghassoul Mask: Rhassoul (ghassoul) clay from Morocco's Atlas Mountains is mixed with rosewater and argan oil to form a paste. This is applied to face, hair, and body and left for 10 minutes. Ghassoul has an exceptional absorptive capacity — more than four times that of kaolin clay — and draws out sebum, heavy metals, and microparticles from the skin. It also has a rare negative ionic charge that binds to positively charged toxins.

Step 6 — Full Body Rinse: Warm water (decreasing in temperature) is poured over the body repeatedly, rinsing away the clay, soap residue, and any remaining dead skin. The final rinse is cold — 15–18°C — which causes vasoconstriction that closes the pores, firms the skin, and stimulates the lymphatic system.

Step 7 — Moisturizing and Argan Oil Treatment: The body is wrapped in warm linen towels (fouta) and transferred to the cool room to rest. Fresh-pressed argan oil is applied to the face and body while the skin is still slightly damp. Mint tea is served. The entire body is now in a state of maximum receptivity — pores closed, skin freshly exposed, circulation stimulated.`,
      keyIngredients: ['Moroccan beldi soap', 'kessa glove', 'ghassoul clay', 'argan oil', 'rosewater', 'mint'],
      benefits: ['Complete skin renewal', 'Deep detoxification', 'Improved circulation', 'Pore refinement', 'Muscle relaxation'],
      culturalNote: `In Morocco and the broader Arab world, the hammam visit is mandatory before Islamic life events: before prayer (for those who have been in a state of major ritual impurity), before Friday prayers (recommended), before Eid celebrations, before weddings. Brides visit the hammam with their female relatives and friends the night before the wedding — the "hammam party" is a centuries-old tradition equivalent to the Western bachelorette party but with a ritual, communal, and spiritual dimension absent from its Western counterpart.`
    },
    {
      name: 'Frankincense Smoke Ritual',
      origin: 'Oman, Yemen, Saudi Arabia, UAE',
      duration: '20–30 minutes',
      description: `Frankincense (luban in Arabic) has been traded on the Arabian Peninsula for over 4,000 years. The Omani Boswellia sacra tree produces the most prized resin, burned in a mabkhara (censer) in the home and on the body. The smoke ritual involves standing over the smoking mabkhara, allowing the frankincense smoke to permeate the clothing and hair, and placing the censer under the hem of a garment to infuse the body with the smoke's fragrance and medicinal compounds. Boswellic acids in frankincense smoke have proven anti-inflammatory effects — inhaling them during the ritual provides measurable relief from upper respiratory inflammation. The smoke is also applied to newborn babies and used to bless homes after illness.`,
      keyIngredients: ['Boswellia sacra resin (Omani frankincense)', 'mabkhara (censer)', 'charcoal'],
      benefits: ['Natural deodorization', 'Anti-inflammatory compounds', 'Spiritual protection', 'Hair scenting', 'Mood elevation'],
      culturalNote: `Dhofar, Oman's southern region, is the primary origin of the finest frankincense in the world. The frankincense trade route once connected the Arabian Peninsula to Mediterranean civilizations, and frankincense was literally worth its weight in gold. Today, Omani grandmothers still maintain clay censers they have used for decades.`
    },
    {
      name: 'Gold Facial Treatments (Gulf / UAE)',
      origin: 'UAE, Qatar, Saudi Arabia',
      duration: '60 minutes',
      description: `Gold has been used in Arab beauty culture for centuries, both as adornment and topically in high-end treatments. Modern Gulf spa culture has formalized gold facial treatments using 24-karat gold leaf or colloidal gold serums. Pure gold is biochemically inert — it does not oxidize or react with skin. However, gold's conductivity enhances the absorption of accompanying active ingredients. A typical gold facial in a UAE spa begins with a cleansing using a rosewater-based micellar water, followed by application of 24-karat gold serum containing hyaluronic acid, peptides, and vitamin C. Gold leaf sheets are applied to the face and worked into the skin using heated jade rollers. The treatment concludes with a cooling 24-karat gold eye mask.`,
      keyIngredients: ['24-karat gold leaf', 'colloidal gold serum', 'hyaluronic acid', 'peptides', 'vitamin C', 'oud oil'],
      benefits: ['Enhanced ingredient absorption', 'Anti-aging', 'Brightening', 'Luxury experience', 'Collagen stimulation'],
      culturalNote: `In the Gulf, gold skin treatments are often reserved for wedding preparation and significant life events. The tradition of adorning the bride with gold extends to the skin itself — the desired bridal look is visibly glowing and luminous, which the gold treatment provides through multiple mechanisms.`
    },
    {
      name: 'Henna Application as Self-Care Ritual',
      origin: 'Pan-Arab world, North Africa, South Asia',
      duration: '2–4 hours',
      description: `Henna (Lawsonia inermis) creates orange-brown stains on skin through a binding reaction between its primary compound (lawsone) and keratin proteins in the skin. But the henna session is as much about the experience as the result. In Arab and North African tradition, a skilled hennayeh (henna artist) applies elaborate geometric patterns to the hands and feet using a cone-shaped applicator, a process requiring 1–3 hours of meditative stillness. The recipient must remain still while the henna dries, often lying back while female relatives and friends gather, sing traditional songs, share food, and tell stories. The henna is left on overnight — the longer it stays, the darker and longer-lasting the stain. While the henna dries and during the wearing period, the person is released from household duties — henna application is, among other things, a structured rest.`,
      keyIngredients: ['natural henna paste', 'lemon juice', 'eucalyptus oil', 'sugar syrup', 'lavender oil'],
      benefits: ['Nail strengthening', 'Cooling effect (Ayurvedic)', 'Rest and stillness', 'Community bonding', 'Artistic expression'],
      culturalNote: `The Arabic word for henna night (laylat al-henna) refers to the night before the wedding when the bride receives her henna. In Morocco this is called the laylat al-henna; in Egypt, the laylat al-henna. Men also receive henna — traditionally on the palms — though less elaborately. The Prophet Muhammad is reported to have used henna, giving it religious significance in Islamic culture.`
    },
    {
      name: 'Oud Oil Body and Hair Treatment',
      origin: 'Saudi Arabia, UAE, Egypt',
      duration: '30–45 minutes',
      description: `Oud (agarwood) is produced when Aquilaria trees become infected with a specific mold, causing the tree to produce a dense, dark, resinous heartwood as a defense mechanism. This resin, when distilled, produces one of the most complex and expensive aromatic compounds in the world — a single kilogram of pure oud oil can exceed $30,000. In Arab wellness tradition, oud oil is applied diluted in a carrier oil (typically sandalwood or rose oil) to pulse points, hair, and skin. For a full oud body treatment, the oil is blended into a warm sesame oil base and used as a full-body massage oil. The aromatic compounds in oud have documented anxiolytic effects — inducing calm without sedation. Oud is also traditionally applied to the hair and left overnight as an aromatic deep conditioning treatment.`,
      keyIngredients: ['pure oud oil (1–3% dilution)', 'sandalwood oil', 'rose oil', 'ambergris (traditional)'],
      benefits: ['Anxiety reduction', 'Emotional calm', 'Hair conditioning', 'Natural perfuming', 'Grounding'],
      culturalNote: `In Arab culture, the offering of oud incense or oud oil to a guest is among the highest forms of hospitality. The fragrance of oud on a person's clothing signals that they have been cared for in someone's home. Many Gulf families keep specific oud blends that have been in the family for generations, created by a master perfumer (attar maker) whose services are passed down as a family inheritance.`
    }
  ],
  diyRecipe: {
    name: 'Home Hammam Night',
    ingredients: ['3 tbsp beldi or castile black soap', '1 kessa mitt', '2 tbsp rhassoul clay', '1 tbsp rosewater', '1 tsp argan oil'],
    steps: [
      'Shower with hot water for 10 minutes to fully open pores',
      'Apply black soap all over the body, leave for 5 minutes',
      'Using wet kessa mitt, scrub firmly in long strokes — marvel at what comes off',
      'Mix rhassoul clay with rosewater to a paste, apply to face and hair',
      'Rest for 10 minutes while the clay works',
      'Rinse thoroughly with decreasing temperature water, ending cold',
      'Apply argan oil to damp skin immediately after',
      'Wrap in a warm towel and rest for 20 minutes with mint tea'
    ]
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LATINA SPA GUIDE
// ─────────────────────────────────────────────────────────────────────────────
const LATINA_SPA = {
  id: 'latina',
  name: 'Latin American and Indigenous Wellness Traditions',
  overview: `Latin American wellness traditions are among the most diverse in the world, combining pre-Columbian indigenous knowledge systems (Aztec, Maya, Inca, Aymara), African healing traditions brought by enslaved people, and European (primarily Spanish) botanical medicine. The region's extraordinary biodiversity — the Amazon, the Andes, Central American cloud forests — provides the raw materials for treatments of unparalleled variety.`,
  treatments: [
    {
      name: 'Temazcal — Indigenous Sweat Lodge Ceremony',
      origin: 'Mexico (Aztec, Maya), Central America',
      duration: '60–90 minutes',
      description: `The temazcal (from Nahuatl temazcalli: temaz = steam, calli = house) is a dome-shaped structure made of stone, clay, or adobe representing the womb of the earth mother (Tlazolteotl or Ixchel). A ceremony leader (temazcalero or temazcalera) guides participants through the four "doors" (directions) of the ceremony.

Before entering: Participants are smudged with copal incense and anointed with herbs while the temazcalero offers prayers and intentions for the ceremony. Volcanic rocks (abuelitas — grandmothers — as they are affectionately called) are heated for hours in a fire outside the lodge.

The First Door (East — Fire and Birth): The first volcanic rocks are brought in. The temazcalero pours herb-infused water (hierbas) over the rocks: rosemary, eucalyptus, copal, medicinal plants specific to the ceremony's intention. Steam rises violently. The intensity is disorienting — participants are encouraged to face their discomfort with breath.

The Second Door (South — Water and Childhood): More rocks, more steam. Participants lie flat on the earth floor. The temazcalero moves through the space, applying herb bundles (ramas) to each person's body, sweeping the steam across the skin. The physical contact of the rama and the steam's heat cause deep muscular release.

The Third Door (West — Earth and Adulthood): The most intense portion. More rocks, maximum heat. Some participants weep, vomit, or experience emotional catharsis — this is considered healing, not pathology. The temazcalero sings traditional songs (cantos) to guide the group through.

The Fourth Door (North — Air and Transformation): The heat begins to moderate. The temazcalero leads a closing gratitude practice. Participants move slowly toward the exit (head first — being born from the earth mother). They emerge into cool air or cold water and rest silently.

Post-ceremony: Participants are offered watermelon, cucumber, or other hydrating fruits and herbal teas. A rest period of 30–60 minutes is recommended before eating a full meal.`,
      keyIngredients: ['volcanic rocks', 'copal incense', 'rosemary', 'eucalyptus', 'medicinal herbs specific to region', 'intention'],
      benefits: ['Deep detoxification', 'Emotional processing', 'Spiritual purification', 'Immune stimulation', 'Community bonding'],
      culturalNote: `The temazcal predates Aztec civilization — evidence of sweat bath use in Mesoamerica dates to 900 BCE. The practice was suppressed by Spanish colonizers who saw it as idolatrous. Contemporary temazcal ceremonies are an act of cultural reclamation. For indigenous communities, the temazcal is not a "spa treatment" but a living spiritual practice requiring proper lineage, initiation, and ongoing relationship with the ceremony.`
    },
    {
      name: 'Limpia — Spiritual Cleansing',
      origin: 'Mexico, Peru, Ecuador, Colombia, Guatemala',
      duration: '30–60 minutes',
      description: `A limpia (cleansing) is performed by a curandera or curandero (healer) using a variety of ritual tools to remove susto (fright, trauma that has lodged in the body), mal de ojo (evil eye), envidia (spiritual harm from envy), or general energetic heaviness. The tools vary by tradition and include: fresh herbs (ruda, albahaca, romero) swept vigorously over the body; a raw egg passed over the body to absorb negativity; flower petals dissolved in water for ritual washing; copal or palo santo smoke; and the curandera's voice in prayer, song, or incantation. The physical motions of the limpia — vigorous herb sweeping, the deliberate breaks across the energy field — create tactile stimulation that is separately calming regardless of spiritual belief.`,
      keyIngredients: ['ruda (rue)', 'albahaca (basil)', 'romero (rosemary)', 'raw egg', 'copal', 'palo santo', 'florida water'],
      benefits: ['Trauma release', 'Energetic clearing', 'Stress reduction', 'Cultural connection', 'Psychological grounding'],
      culturalNote: `In contemporary Mexico City, Lima, and other Latin capitals, limpias are performed both in markets (tianguis) by traditional healers and in high-end wellness spas that have incorporated the practice into mainstream wellness programming. The medicalization of mental health care has not replaced limpias in many communities — they address dimensions of suffering that biomedical approaches do not reach.`
    },
    {
      name: 'Colombian Coffee Scrub',
      origin: 'Colombia, Brazil',
      duration: '45 minutes',
      description: `Colombia's coffee-growing Eje Cafetero region produces treatments centered on freshly ground coffee. The coffee scrub combines coarsely ground Colombian coffee with brown sugar, coconut oil, and fresh orange zest. The caffeine in coffee is a potent vasoconstrictor — when applied topically, it temporarily reduces the appearance of cellulite by tightening the blood vessels beneath the skin's surface and reducing fluid retention in subcutaneous tissue. The physical exfoliation removes dead skin, while the polyphenols in coffee (chlorogenic acid) have antioxidant effects on skin. In Colombian coffee farms, a traditional practice involves bathing in coffee waste water — the byproduct of the washing stage of coffee processing — which has a similar skin brightening effect.`,
      keyIngredients: ['freshly ground Colombian coffee (medium coarse)', 'raw brown sugar', 'coconut oil', 'orange zest', 'vanilla extract'],
      benefits: ['Cellulite reduction', 'Circulation stimulation', 'Chemical and physical exfoliation', 'Brightening', 'Aromatherapy'],
      culturalNote: `Brazil's Minas Gerais state has a tradition of cachaça (sugarcane spirit) and coffee body treatments at mountain wellness retreats. The combination of Brazil's coffee culture and its beach body culture has made coffee-based spa treatments synonymous with Brazilian wellness tourism.`
    },
    {
      name: 'Chocolate Body Wrap',
      origin: 'Mexico (origin of cacao), also Ecuador, Peru',
      duration: '60 minutes',
      description: `Cacao (Theobroma cacao — food of the gods) originated in Mesoamerica where it was used ceremonially and medicinally by the Olmec, Maya, and Aztec. A therapeutic cacao body wrap uses raw cacao paste (not chocolate — no dairy, no sugar), cocoa butter, and coconut oil warmed and applied to the entire body. The theobromine in cacao is a vasodilator — it improves blood flow to the skin and delivers more oxygen to skin cells. Flavonoids in raw cacao have anti-inflammatory effects and stimulate collagen production. The wrap is applied warm, and the body is wrapped in heated linen for 45 minutes while the active compounds penetrate. The treatment leaves skin visibly firmer and imparted with the complex, earthy scent of pure cacao.`,
      keyIngredients: ['raw cacao paste', 'cocoa butter', 'coconut oil', 'vanilla bean', 'cinnamon', 'chili (optional — vasodilating)'],
      benefits: ['Antioxidant skin protection', 'Collagen stimulation', 'Circulation improvement', 'Skin firming', 'Mood elevation (theobromine)'],
      culturalNote: `Maya cacao ceremonies, in which cacao is consumed as a sacrament with intentional breath work, are experiencing a global revival. The distinction between ceremonial cacao (minimally processed, high-cacao-butter) and commercial cocoa (heavily processed, cacao butter removed) is crucial — only ceremonial cacao has the theobromine and flavonoid content required for physiological effects.`
    },
    {
      name: 'Volcanic Clay Body Treatment (Costa Rica, Guatemala)',
      origin: 'Costa Rica, Guatemala, El Salvador',
      duration: '60 minutes',
      description: `Central America's volcanic spine — from Guatemala's active Santiaguito to Costa Rica's Arenal — provides clay deposits rich in minerals unavailable in most parts of the world. Costa Rican volcanic clay from the Rincón de la Vieja region is particularly prized for its high silica content and its fine, smooth texture that adheres to the skin without pulling. The treatment begins with a warm shower, followed by application of the heated volcanic clay (mixed with coconut water and aloe) from neck to feet. The body is left to rest while the clay draws — detoxification is visible in the clay's color change as it absorbs. The clay is rinsed off and the skin is sealed with macadamia oil (native to the region).`,
      keyIngredients: ['Rincón de la Vieja volcanic clay', 'coconut water', 'aloe vera', 'macadamia oil', 'tropical flower extracts'],
      benefits: ['Deep drawing and detox', 'Mineral replenishment', 'Pore refinement', 'Skin tightening', 'Hydration'],
      culturalNote: `In Guatemala's indigenous Maya communities, specific clays from the highlands are used medicinally by traditional healers (Aj'qijab') in both internal and external preparations. The clay is considered to contain the healing energy of the earth and is treated with respect as a living substance.`
    }
  ],
  diyRecipe: {
    name: 'Cacao and Coffee Energizing Body Scrub',
    ingredients: ['3 tbsp ground coffee', '2 tbsp raw cacao powder', '2 tbsp coconut sugar', '3 tbsp coconut oil', '1 tsp vanilla extract', 'pinch of cayenne (optional)'],
    steps: [
      'Melt coconut oil slightly until soft',
      'Mix all dry ingredients together',
      'Combine with coconut oil and vanilla to form a thick scrub',
      'In a warm shower, apply to damp skin using circular motions',
      'Pay extra attention to thighs, buttocks, and arms',
      'Leave on for 5 minutes before rinsing',
      'Follow with a cool rinse to close pores',
      'Pat dry and apply a light oil — the natural oils in the scrub will have moisturized'
    ]
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EAST ASIAN SPA GUIDE
// ─────────────────────────────────────────────────────────────────────────────
const EAST_ASIAN_SPA = {
  id: 'east-asian',
  name: 'East Asian Bathing and Wellness Traditions',
  overview: `East Asian wellness cultures — Japanese, Korean, Chinese — share a common foundation in the view that the body is a self-regulating energetic system requiring regular maintenance. Japanese onsen culture, Korean jjimjilbang tradition, and Chinese gua sha and cupping practices are all grounded in the concept of qi (chi/ki) — the life force that must flow freely through the body's meridian channels. Interruptions in qi flow cause illness; therapeutic touch, heat, and water restore it.`,
  treatments: [
    {
      name: 'Japanese Onsen (Hot Spring) Culture',
      origin: 'Japan (Hakone, Beppu, Nikko, Kusatsu)',
      duration: '60–180 minutes',
      description: `Japan has over 27,000 hot spring sources — the highest concentration in the world — and the culture of onsen bathing has evolved over 1,500 years. The etiquette and ritual of onsen bathing is precise and meaningful. Before entering the baths, the body is thoroughly washed at a shower station (kakeyu): each person sits on a low wooden stool, uses a hand-held shower, and washes the entire body with soap before entering any communal pool. This pre-rinse is not optional — it is both hygienic and an expression of consideration for others. Hot springs are classified by mineral content: sodium bicarbonate springs (for soft skin), sulfur springs (for skin conditions), iron springs (for anemia), and radioactive radon springs (for pain relief, paradoxically — low-level radon stimulates DNA repair mechanisms). The optimal onsen routine alternates between hot and cold pools, creating a vasodilation-vasoconstriction cycle that dramatically improves cardiovascular function and lymphatic drainage.`,
      keyIngredients: ['mineral hot spring water', 'cedar wood bucket and stool (hinoki)', 'natural soap', 'cold plunge pool'],
      benefits: ['Cardiovascular conditioning', 'Mineral absorption (magnesium, sulfur, calcium)', 'Skin condition treatment', 'Deep muscular relaxation', 'Immune stimulation'],
      culturalNote: `Japanese onsen culture codifies the concept of "naked communion" (hadaka no tsukiai) — the idea that status, wealth, and social pretense fall away when everyone is unclothed together in the same water. Business relationships are sometimes deepened over onsen visits in a way that formal settings cannot achieve. Many onsen establishments were historically welcoming of mixed gender bathing (konyoku) — a practice being revived in some traditional regions.`
    },
    {
      name: 'Korean Jjimjilbang and Italy Towel Exfoliation',
      origin: 'Korea (Seoul, Busan)',
      duration: '2–6 hours',
      description: `The Korean jjimjilbang (찜질방) is a heated public bathhouse that serves as a democratic community space. For an entrance fee of 8,000–15,000 Korean won, visitors receive loose cotton pajamas, a towel, and access to gender-segregated bathing areas plus communal rooms. The bathing sequence in a jjimjilbang typically follows: hot bath (40°C), then the "Italy towel" exfoliation.

The Italy towel (이태리 타올, Italy taol) is a rough, basket-weave viscose cloth originally imported from Italy that has become the symbol of Korean bathhouse culture. Soaked in hot water until limp, it is used (by a professional scrubber, called a "때밀이" ddemilyi, or by oneself) in long, vigorous strokes over the skin that have been softened by soaking. The skin must be truly softened — at least 20–30 minutes of hot water immersion — for the Italy towel to work without causing micro-tears. When applied correctly, the ddeh (때 — dead skin) rolls off in grey ribbons, revealing the fresh skin beneath. Koreans describe the post-Italy-towel skin as "dong-white" (radiant white).

After the scrub: the cold pool, then the sikhye (sweet rice punch) served inside the jjimjilbang. The communal rooms feature various heat rooms: the charcoal room (for detox), the salt room (for minerals), the amethyst crystal room, and the ice room — participants move between them in rotations.`,
      keyIngredients: ['Italy towel (이태리 타올)', 'hot mineral water', 'sikhye (sweet rice drink)', 'sesame oil (applied after)'],
      benefits: ['Complete skin renewal', 'Pore refinement', 'Circulation improvement', 'Community connection', 'Stress reduction'],
      culturalNote: `In Korean culture, jjimjilbang visits are family events — parents bring children, grandparents join. The communal sleeping rooms (where families spread out on heated floors overnight) mean that the jjimjilbang functions as a hotel, community center, and wellness facility simultaneously. During economic hardships, some Koreans famously sleep in jjimjilbangs as an affordable alternative to hotels.`
    },
    {
      name: 'Japanese Facial Massage Techniques',
      origin: 'Japan',
      duration: '30–45 minutes',
      description: `Kobido (古美道) is a traditional Japanese facial massage technique dating to 1472, developed by two master massage therapists who created the technique for the Japanese Imperial Court. The technique uses approximately 150 different hand movements on the face, including effleurage, petrissage, tapotement, and proprietary pinching and lifting movements designed to stimulate the underlying facial muscles without pulling or dragging the skin. Kobido works on the principle that facial muscles, like body muscles, atrophy without use — the lifting movements retrain and tone the zygomaticus, orbicularis oculi, and platysma muscles that give the face its youthful structure. A full kobido treatment produces measurable visible lifting. Modern variations incorporate gua sha tools, jade rollers, and microcurrent devices.`,
      keyIngredients: ['camellia oil (tsubaki — the Japanese gold of face oils)', 'rice bran oil', 'bamboo charcoal cleanser'],
      benefits: ['Facial muscle toning', 'Lymphatic drainage', 'Improved skin circulation', 'Natural lifting', 'Skin glow'],
      culturalNote: `The Japanese concept of bihaku (美白 — beautiful white) has historically shaped Japanese beauty culture toward extreme skin brightness. Contemporary Japanese skincare has moved toward a more nuanced transparency and health-focused approach, but the discipline of the skincare routine itself — the 10-step Japanese routine — reflects a cultural valuation of patient, systematic self-care.`
    },
    {
      name: 'Gua Sha and Cupping as Spa Treatments',
      origin: 'China (Traditional Chinese Medicine)',
      duration: '45–60 minutes',
      description: `Gua sha (刮痧 — scraping sand) is performed using a smooth-edged tool (traditionally jade, horn, or ceramic) pressed firmly against oil-lubricated skin and moved in long strokes. The pressure and friction create a controlled micro-trauma in the skin and underlying fascia that stimulates blood flow and breaks up fascial adhesions. The characteristic redness (sha) that appears is not bruising — it is the manifestation of stagnant blood and qi being moved to the surface. Research shows that gua sha increases HO-1 (an antioxidant enzyme) expression by 400% and has anti-inflammatory effects equivalent to some pharmaceuticals.

Cupping (拔罐 baguan) places heated glass or silicone cups on the skin, creating suction that lifts the tissue. The suction effect separates the skin from the underlying fascia, creating space for blood flow and lymphatic movement. Research on cupping shows it reduces markers of inflammation and speeds healing in both muscle and skin tissue.`,
      keyIngredients: ['jade or rose quartz gua sha tool', 'silicone cups', 'sesame or grapeseed oil', 'moxa (optional — mugwort stick for heat)'],
      benefits: ['Fascial release', 'Anti-inflammation', 'Lymphatic drainage', 'Cellulite treatment', 'Back pain relief'],
      culturalNote: `Cupping marks on Olympic athletes' backs (famously visible on Michael Phelps at the 2016 Olympics) brought global attention to an ancient practice. In China, grandmothers perform gua sha and cupping at home as routine maintenance — it is household first aid, not a luxury spa treatment.`
    },
    {
      name: 'Matcha Body Wrap',
      origin: 'Japan (adapted from Uji tea ceremony culture)',
      duration: '60 minutes',
      description: `Ceremonial-grade matcha — stone-ground green tea from shade-grown Camellia sinensis — contains the highest concentration of EGCG (epigallocatechin gallate) of any food. When applied topically, EGCG inhibits the enzyme hyaluronidase, preserving the skin's natural hyaluronic acid content. A matcha body wrap combines ceremonial matcha with warm coconut milk, honey, and rice flour to create a thick green paste applied to the entire body. The body is wrapped and the EGCG penetrates over 40 minutes. The treatment is rinsed and followed by green tea seed oil application. The caffeine and L-theanine in matcha, absorbed transdermally in small amounts, create a state of calm alertness that persists after the treatment.`,
      keyIngredients: ['ceremonial grade matcha', 'coconut milk', 'raw honey', 'rice flour', 'green tea seed oil'],
      benefits: ['Antioxidant protection', 'Anti-aging', 'Anti-inflammatory', 'Brightening', 'Calm alertness'],
      culturalNote: `The Japanese tea ceremony (chado — the way of tea) is itself a wellness practice: the four principles of wa (harmony), kei (respect), sei (purity), and jaku (tranquility) are achieved through the deliberate, unhurried preparation and sharing of matcha. The spa application of matcha extends the ceremonial principles of presence and care to the body.`
    }
  ],
  diyRecipe: {
    name: 'At-Home Matcha and Rice Brightening Treatment',
    ingredients: ['1 tsp ceremonial matcha', '2 tbsp rice flour', '2 tbsp coconut milk', '1 tsp raw honey', '3 drops green tea seed oil'],
    steps: [
      'Soak in the warmest bath you can tolerate for 20 minutes first',
      'Mix matcha, rice flour, honey and coconut milk to a smooth paste',
      'Apply to damp skin in upward circular strokes',
      'Leave for 15–20 minutes',
      'Using your hands, work the paste in circular motions as a gentle scrub before rinsing',
      'Rinse with warm then cool water',
      'Apply 3–4 drops of green tea seed oil to damp face and neck'
    ]
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EAST AFRICAN SPA GUIDE
// ─────────────────────────────────────────────────────────────────────────────
const EAST_AFRICAN_SPA = {
  id: 'east-african',
  name: 'East African Wellness Traditions',
  overview: `East African wellness traditions span the ancient cosmopolitan cultures of Ethiopia, Eritrea, Djibouti, Somalia, and the Swahili coast. These traditions reflect the region's position at a trading crossroads connecting sub-Saharan Africa, the Arab world, the Indian subcontinent, and the Mediterranean — a unique synthesis of influences preserved in wellness practices that survive to this day.`,
  treatments: [
    {
      name: 'Ethiopian Coffee Ceremony as Self-Care Ritual',
      origin: 'Ethiopia (birthplace of coffee)',
      duration: '2–3 hours',
      description: `Coffee originated in Ethiopia's Kaffa region, and the Ethiopian coffee ceremony (buna — ቡና) is the country's most significant social ritual. Performed three times daily in traditional homes, the ceremony is as much about the experience as the coffee itself.

Preparation: Fresh grass (yaferenj, rue, or other aromatics) is spread on the floor. Incense (frankincense or myrrh) is lit. A young woman (or any family member serving as host) washes the raw green coffee beans, places them in a wide, flat pan (metad), and roasts them over charcoal while stirring constantly. When the beans begin to crack and smoke and the aroma fills the space, the pan is brought around for all guests to inhale the fragrance — this is considered part of the ceremony and part of the health benefit.

The Grinding: Roasted beans are ground in a wooden mortar (mukecha) with a cylindrical pestle (zenezena) in a rhythmic pounding that itself becomes meditative. The sound of grinding coffee in an Ethiopian home is the sound of welcome.

The Three Rounds:
- First cup (Abol): The strongest, with the most caffeine. It is served in small handleless cups (sini) and accompanied by popcorn (qolo) or roasted barley.
- Second cup (Tona): Slightly weaker, made from the same grounds with more water added.
- Third cup (Baraka — meaning "blessing"): The lightest cup, considered to carry a blessing for the recipient.

The complete ceremony cannot be rushed without giving offense — to leave after only the first or second cup is considered disrespectful. The ceremony's true purpose is not the coffee but the time it creates: unhurried conversation, presence, rest from work.`,
      keyIngredients: ['raw Ethiopian coffee beans', 'frankincense or myrrh', 'fresh grass', 'charcoal', 'cardamom (optional)', 'sugar'],
      benefits: ['Mental reset', 'Community bonding', 'Mindfulness practice', 'Respiratory benefit from incense', 'Antioxidants from ceremonial-strength coffee'],
      culturalNote: `Ethiopia grows over 1,000 identified varieties of wild and cultivated coffee, many of which are endangered as climate change shifts agricultural zones. The ceremony survives in Ethiopian diaspora communities worldwide as a living connection to homeland and identity. For Ethiopian women in particular, the coffee ceremony is a protected female space — a time when women gather without the presence or demands of men.`
    },
    {
      name: 'Frankincense Steam Room Ritual',
      origin: 'Ethiopia, Eritrea, Somalia, Djibouti',
      duration: '30–45 minutes',
      description: `The Horn of Africa is, along with Oman, one of the two primary sources of the world's frankincense (luban in Amharic: ዕጣን ethan). Ethiopian, Eritrean, and Somali frankincense steam rituals differ subtly from Arab traditions in their use of the substance. Rather than burning frankincense on charcoal in a censer, East African tradition involves placing frankincense resin directly in boiling water. The steam carries vaporized boswellic acids and monoterpenes, which are inhaled directly as the bather sits over the pot draped in cloth. In Eritrea, this steam is a standard home treatment for respiratory illness — frankincense steam is believed to clear the lungs, reduce chest tightness, and strengthen the immune system. Postpartum women are treated with frankincense steam in many Eritrean traditions, where the smoke is also directed toward the body's external surfaces to tighten and heal.`,
      keyIngredients: ['Boswellia papyrifera (Ethiopian frankincense)', 'myrrh', 'black cumin seeds', 'eucalyptus leaves'],
      benefits: ['Respiratory therapy', 'Anti-inflammatory (boswellic acids)', 'Wound healing', 'Postpartum recovery', 'Immune support'],
      culturalNote: `Ethiopia's frankincense-producing Boswellia papyrifera trees are being overharvested due to rising global demand for frankincense oils and resins. Research suggests that 90% of Ethiopia's Boswellia forests could be gone within 50 years. Using Ethiopian frankincense consciously — buying from certified sustainable sources — is an act of cultural preservation.`
    },
    {
      name: 'Camel Milk Bath',
      origin: 'Somalia, Djibouti, Ethiopia (Afar region)',
      duration: '30 minutes',
      description: `Camel milk has a unique biochemical profile that makes it exceptional for skin care. It contains high concentrations of alpha-hydroxy acids (AHAs), particularly lactic acid — the same acid used in dermatological peels. Camel milk AHAs are gentler than synthetic versions and break down dead skin cell bonds without disrupting the skin barrier. Camel milk also contains immunoglobulins (antibodies) small enough to penetrate the skin and lanolin-like fats that moisturize deeply. In Somali and Afar herding communities, women have long used fresh camel milk to wash the face and body. A camel milk bath combines 1–2 liters of camel milk with honey, rosewater, and ground turmeric in warm bath water. The skin emerges noticeably smoother, and with regular use, hyperpigmentation visibly reduces.`,
      keyIngredients: ['fresh or powdered camel milk', 'raw honey', 'rosewater', 'ground turmeric'],
      benefits: ['Natural AHA exfoliation', 'Deep moisturization', 'Antibacterial action', 'Skin brightening', 'Hyperpigmentation treatment'],
      culturalNote: `Camel milk is considered medicinal in Somali culture — prescribed for everything from autism to hepatitis (some scientific evidence supports its hepatoprotective effects). Nomadic Somali families who maintain herds drink the milk fresh throughout the day and apply it to skin abrasions, burns, and infections. The beauty uses of camel milk are inseparable from its medicinal reputation.`
    },
    {
      name: 'Hammam Traditions of Djibouti and Eritrea',
      origin: 'Djibouti, Eritrea (influenced by Arab and Ottoman traditions)',
      duration: '90 minutes',
      description: `Djibouti's hammam culture reflects its position as a port city connecting the Arab world, the Indian Ocean, and the Horn of Africa. Djiboutian hammams follow a protocol similar to North African hammams but with regional modifications: the use of sidr (lote tree) leaves, prized in Islamic tradition for cleansing properties, and the use of Ethiopian-origin frankincense in the steam room distinguish the Djiboutian experience. Eritrean hammams, shaped by both Italian colonial influence (Eritrea was an Italian colony until 1941) and longstanding Islamic traditions in the country's Muslim communities, represent a similar hybrid. Traditional Eritrean women's hammam visits include communal hair braiding sessions following the bath, making the hammam a comprehensive beauty and social event comparable in function to West African communal beauty preparations.`,
      keyIngredients: ['sidr (lote tree) leaves', 'Ethiopian frankincense', 'henna', 'black seed oil (nigella sativa)', 'rosewater'],
      benefits: ['Complete bathing ritual', 'Community connection', 'Spiritual purification', 'Hair care', 'Relaxation'],
      culturalNote: `In Djibouti, the hammam is the primary social space for women who observe purdah in public. Within the hammam's single-gender space, social hierarchies relax — women of different economic backgrounds bathe side by side and exchange news, advice, and care. This democratizing function of the hammam is recognized and protected as a cultural institution.`
    }
  ],
  diyRecipe: {
    name: 'East African Coffee and Honey Face Ritual',
    ingredients: ['2 tbsp freshly ground Ethiopian coffee', '1 tbsp raw honey', '1 tsp camel milk powder (or whole milk)', '1 drop frankincense essential oil'],
    steps: [
      'Brew a strong cup of Ethiopian coffee and inhale the steam deliberately for 5 minutes — this is part of the treatment',
      'Mix coffee grounds with honey, milk, and frankincense oil',
      'Apply to face and neck in circular motions',
      'Leave for 15 minutes',
      'Rinse with warm water in upward, circular motions — the coffee provides gentle exfoliation as it comes off',
      'Splash with cold water to close pores',
      'Sit with the remaining coffee in contemplative rest — the ceremony is not over until the cup is finished'
    ]
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SOUTH AFRICAN SPA GUIDE
// ─────────────────────────────────────────────────────────────────────────────
const SOUTH_AFRICAN_SPA = {
  id: 'south-african',
  name: 'South African Bush and Indigenous Wellness Traditions',
  overview: `South Africa's extraordinary botanical diversity — the Cape Floristic Region is one of six global plant biodiversity hotspots, home to over 9,000 plant species found nowhere else on earth — provides the foundation for spa treatments of unparalleled richness. Indigenous South African wellness traditions span the San (Khoisan) people's ancient plant knowledge, Zulu and Xhosa healing practices, and the botanical knowledge of Cape Malay communities.`,
  treatments: [
    {
      name: 'Rooibos Bath Soak',
      origin: 'Cederberg Mountains, Western Cape',
      duration: '30–45 minutes',
      description: `Rooibos (Aspalathus linearis) grows exclusively in the Cederberg Mountains of the Western Cape — nowhere else in the world. The processed needle-like leaves, when steeped, produce a rich red tea with a naturally sweet, earthy flavor. Rooibos contains over 40 identified antioxidants, most notably aspalathin (unique to rooibos), quercetin, and luteolin. A rooibos bath soak uses 6–8 rooibos tea bags or 100g of loose rooibos steeped in boiling water for 20 minutes, then added to the bathwater. The quercetin in rooibos is a potent antihistamine — rooibos baths are prescribed for eczema, psoriasis, and allergic skin reactions. The tannins in rooibos have mild astringent properties that tone and tighten the skin. The anti-inflammatory flavonoids reduce redness and calm irritated skin.`,
      keyIngredients: ['organic rooibos tea', 'honey', 'almond oil', 'lavender buds'],
      benefits: ['Eczema and psoriasis relief', 'Anti-inflammatory', 'Antioxidant skin protection', 'Natural antihistamine effect', 'Skin toning'],
      culturalNote: `Rooibos has been used by the San and Khoikhoi people for centuries as a medicinal tea and topical treatment. The Dutch settlers of the Cape learned its uses from indigenous guides. Today, rooibos is South Africa's most iconic agricultural export — but bitter intellectual property disputes have arisen over traditional knowledge rights, with the South African government and indigenous communities challenging pharmaceutical and cosmetic companies who have patented rooibos-derived compounds without compensation.`
    },
    {
      name: 'Aloe Ferox Body Wrap',
      origin: 'Eastern Cape, KwaZulu-Natal',
      duration: '60 minutes',
      description: `While the world knows aloe vera (Aloe barbadensis), South African traditional medicine uses Aloe ferox — the Cape aloe — whose gel is measurably more potent. Aloe ferox contains over 130 identified active compounds including aloeferoxin, aloesin, and high concentrations of acemannan (a complex polysaccharide with immune-modulating properties). An aloe ferox body wrap applies freshly extracted gel to the full body, wraps in linen, and allows 45 minutes for penetration. The acemannan in aloe ferox has documented wound-healing, anti-inflammatory, and immune-stimulating properties. For burn treatment, aloe ferox gel reduces recovery time by approximately 50% compared to silver sulfadiazine cream in clinical studies. South African traditional healers (izinyanga and izangoma) use aloe ferox in preparations for skin disease, arthritis, and as a general tonic.`,
      keyIngredients: ['fresh aloe ferox gel', 'rooibos extract', 'buchu essential oil', 'marula oil'],
      benefits: ['Wound and burn healing', 'Deep hydration', 'Anti-inflammatory', 'Immune modulation', 'Skin repair'],
      culturalNote: `Aloe ferox was one of the most important trade goods of the Cape Colony — "Cape aloe" bitter extract was exported to Europe as a laxative and wound treatment for centuries. Today, South Africa remains the world's largest exporter of aloe ferox. The plant is sacred in several Southern African spiritual traditions and is planted around homes for protective purposes.`
    },
    {
      name: 'Marula Oil Full-Body Massage',
      origin: 'Limpopo, Mpumalanga, KwaZulu-Natal, and broader sub-Saharan Africa',
      duration: '60–90 minutes',
      description: `Marula oil (from Sclerocarya birrea seeds) is extracted by hand-cracking the hard kernels inside marula fruit — a labor-intensive process traditionally performed by women in Southern African communities. The resulting oil has an oleic acid content of 70–78% (higher than olive oil) and contains a unique combination of catechins (antioxidants) and tocopherols (vitamin E). Marula oil's molecular weight is close to the skin's own sebum, making it exceptionally well-absorbed without greasiness. It penetrates within minutes, delivering its antioxidants to the deeper dermis rather than sitting on the surface. A full-body marula oil massage begins with a light warm compress to open the skin, followed by a slow, deep massage technique using long effleurage strokes and circular joint work. The skin's absorption of marula oil is enhanced by heat — warm stones placed along the spine and over the major joints after the massage complete the treatment.`,
      keyIngredients: ['cold-pressed marula oil', 'buchu', 'rooibos extract', 'warm basalt stones'],
      benefits: ['Deep skin penetration', 'Anti-aging', 'Scar reduction', 'Stretch mark treatment', 'Muscle relaxation'],
      culturalNote: `Marula fruit is central to South African cultural life — the Marula Festival (Umkhosi Womhlanga) in Eswatini and Limpopo celebrates the marula harvest. The fruit is used to make beer (umqombothi and marula beer) that plays a role in social and ceremonial life. The Amarula cream liqueur, now exported worldwide, takes its name from the marula fruit. International corporations have commercialized marula oil extensively, raising questions about fair compensation to the African women whose knowledge and labor first developed its use.`
    },
    {
      name: 'Fynbos Aromatherapy (Cape Botanical Region)',
      origin: 'Western Cape (Fynbos biome)',
      duration: '45 minutes',
      description: `The fynbos biome — unique to the Cape Floristic Region — contains plants whose essential oils are among the most complex in the world. Buchu (Agathosma betulina) produces an oil with blackcurrant and peppermint notes that has antibacterial, antifungal, and diuretic properties. Cape chamomile (Eriocephalus punctulatus) contains alpha-bisabolol oxide compounds that are more potent than those in German chamomile. Helichrysum (Cape everlasting or rooi sewejaartjie) is perhaps the most medically significant fynbos aromatherapy plant — it contains neryl acetate, italidiones, and curcumin precursors with documented anti-hematoma (bruise-resolving), anti-inflammatory, and nerve-regenerating properties. An aromatherapy session using fynbos essential oils in a diffuser combined with a body oil blend creates effects not achievable with any other plant group.`,
      keyIngredients: ['buchu essential oil', 'Cape chamomile', 'helichrysum', 'rooibos hydrosol', 'protea-infused oil'],
      benefits: ['Anti-inflammation', 'Bruise resolution', 'Antibacterial', 'Nerve regeneration', 'Unique aromatic experience'],
      culturalNote: `The San people of the Cape were the first humans to use fynbos plants medicinally — their pharmacopoeia, developed over 100,000 years, included buchu for urinary infections, helichrysum for wounds, and rooibos for colic. This knowledge, nearly lost with the decimation of San populations, is being recovered and preserved by ethnobotanists working with surviving San communities.`
    },
    {
      name: 'Traditional Zulu Healing Touch',
      origin: 'KwaZulu-Natal',
      duration: '60–90 minutes',
      description: `Zulu traditional healers (izangoma — those who divine and heal; izinyanga — herbalists) use touch in a complex therapeutic framework. A healing touch session begins with the isangoma establishing the cause of the person's condition through divination (ukuphilisa) and ancestral consultation. The physical treatment that follows is inseparable from its spiritual context. Touch is applied not in the Western massage sense of working on muscles but in the sense of directed intention — the healer's hands are understood to carry umoya (spiritual breath) that is transmitted to the patient. Areas of pain receive sustained pressure and circular manipulation. The session concludes with the application of imbiza (herbal preparations) to the skin, and the patient is given instructions for additional home treatment including the use of plant medicines.`,
      keyIngredients: ['indigenous healing herbs (specific to condition)', 'marula oil', 'rooibos infusion', 'ancestral intention'],
      benefits: ['Pain relief', 'Spiritual alignment', 'Psychological support', 'Community integration', 'Cultural identity'],
      culturalNote: `Izangoma occupy an important social role in Zulu communities that no Western health professional replicates — they are simultaneously diagnostician, therapist, priest, and community historian. Many South Africans consult both biomedical doctors and izangoma, viewing the two systems as complementary rather than competing. South African law officially recognizes traditional healers and the government has made progress toward integrating traditional and biomedical health systems.`
    }
  ],
  diyRecipe: {
    name: 'Cape Botanicals Rooibos and Marula Bath Ritual',
    ingredients: ['8 rooibos tea bags', '2 tbsp marula oil', '1 tbsp raw honey', '5 drops helichrysum essential oil', '3 drops buchu essential oil'],
    steps: [
      'Steep rooibos in 2 cups boiling water for 20 minutes to make a strong infusion',
      'Run a warm bath and add the rooibos infusion',
      'Add marula oil, honey and essential oils to the bath',
      'Soak for 30 minutes, massaging your skin gently with your hands',
      'As the water drains, notice how smooth the skin feels — this is the marula oil at work',
      'Pat dry and apply a thin layer of marula oil while skin is still slightly damp',
      'Rest for 20 minutes in a warm room before dressing'
    ]
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BLACK AMERICAN SPA GUIDE
// ─────────────────────────────────────────────────────────────────────────────
const BLACK_AMERICAN_SPA = {
  id: 'black-american',
  name: 'Black American Self-Care Traditions and the Politics of Rest',
  overview: `Black American self-care traditions exist at the intersection of cultural resilience, political resistance, and the everyday genius of making beauty and wellness from available resources. The tradition spans from kitchen table hair care to the formal theorization of rest as radical resistance. Audre Lorde wrote: "Caring for myself is not self-indulgence, it is self-preservation, and that is an act of political warfare." This statement, written by a Black woman living with cancer in 1988, has become the foundational text of the contemporary self-care movement — though it is often excerpted without its urgent political context.`,
  treatments: [
    {
      name: 'Wash Day as Self-Care Ritual',
      origin: 'African American culture, nationwide',
      duration: '3–6 hours',
      description: `Natural hair wash day — the elaborate process of washing, conditioning, detangling, treating, and styling kinky, coily, or curly natural hair — is one of the most significant self-care practices in Black American culture. It is a commitment of time (typically 3–6 hours, sometimes more for longer or denser hair), attention, and love to hair that has historically been policed, devalued, and mandatorily altered to conform to white professional standards (the CROWN Act, passed in many US states, specifically outlaws discrimination based on natural hair).

The wash day sequence typically includes:
- Pre-poo (pre-shampoo treatment): Applying oils or a conditioning mask before shampooing to protect the hair from the stripping effects of cleansers. JBCO (Jamaican Black Castor Oil) is the most popular pre-poo oil — its ricinoleic acid content strengthens the hair shaft and stimulates scalp circulation.
- Clarifying shampoo: Removing product buildup with a stronger shampoo once monthly.
- Deep conditioning: Applying a protein or moisture-rich conditioner and using heat (a heating cap or sitting under a hooded dryer) to open the hair cuticle and allow penetration. Left on for 20–60 minutes.
- Detangling: Working through each section of hair from tips to roots with fingers or a wide-tooth comb while conditioner is in — a meditative, methodical process.
- Styling: Twists, braids, wash-and-go, roller sets — each style requires different techniques and products.

The investment of time in wash day is recognized within Black culture as an act of self-respect and maintenance — taking care of what you have been given.`,
      keyIngredients: ['Jamaican Black Castor Oil (JBCO)', 'deep conditioner', 'leave-in conditioner', 'wide-tooth comb', 'heating cap', 'patience'],
      benefits: ['Hair retention and growth', 'Scalp health', 'Meditative practice', 'Cultural identity', 'Self-regard'],
      culturalNote: `The 2009 documentary "Good Hair" by Chris Rock brought mainstream attention to the enormous economic and cultural significance of Black hair care — Black Americans spend an estimated $2.5 billion annually on hair care products, and the natural hair movement has created a multi-billion-dollar industry built by and for Black consumers. Brands like Shea Moisture (founded by Liberian immigrant Richelieu Dennis) began as Black-owned businesses serving Black hair needs before growing into mainstream retail.`
    },
    {
      name: 'JBCO Scalp Treatment Ritual',
      origin: 'Jamaican tradition, adopted widely in African American hair care',
      duration: '30 minutes',
      description: `Jamaican Black Castor Oil (JBCO) differs from regular castor oil in its production method: the castor beans are first roasted before pressing, creating the characteristic dark color and smoky, earthy scent. The roasting process creates ash that remains in the oil, increasing its alkalinity — this higher pH opens the hair cuticle and allows the ricinoleic acid to penetrate more deeply. A JBCO scalp treatment involves parting the hair into sections, applying JBCO directly to the scalp using a dropper or applicator bottle, and massaging with firm fingertip circles for 5–10 minutes over each section. The massage stimulates blood flow to the follicles, delivering more nutrients and oxygen. A plastic cap is then placed over the hair and either heat is applied (heating cap, steamer, or sitting under a hooded dryer) for 20–30 minutes, or the treatment is left overnight. Regular JBCO scalp treatments consistently produce visible improvements in hair thickness, edge (baby hair) regrowth, and overall hair health.`,
      keyIngredients: ['Jamaican Black Castor Oil', 'peppermint essential oil (optional — additional circulation stimulation)', 'rosemary essential oil'],
      benefits: ['Hair thickness increase', 'Edge regrowth', 'Scalp health', 'Hair retention', 'Circulation stimulation'],
      culturalNote: `Edges (the fine baby hairs at the hairline) are deeply culturally significant in Black American aesthetics — beautifully laid edges, styled with a fine-tooth comb and edge control product, are a form of artistry that signals care and intention. The loss of edges to traction alopecia from tight styles is a real concern addressed by JBCO treatments. The phrase "baby hairs on fleek" reflects the cultural value placed on this specific detail.`
    },
    {
      name: 'Kitchen Table Beauty — Communal Hair Care',
      origin: 'Pan-African American, from the Great Migration forward',
      duration: '3–6 hours',
      description: `The kitchen table or the porch — these are the original Black American spa spaces. Generations of Black women and girls have had their hair done at home by mothers, aunts, grandmothers, and friends in sessions that are simultaneously hair appointments, therapy sessions, storytelling hours, and education. The child sits between the adult's knees or on a stool in front of a chair. The process of detangling, braiding, hot-combing, or pressing hair is the backdrop for conversations that could not easily happen elsewhere — about boys, about bodies, about navigating racism at school, about family history, about what it means to be Black. The physical closeness of hair care, the hours of sustained gentle attention, the knowledge being transmitted — these constitute one of the most significant wellness traditions in African American culture.`,
      keyIngredients: ['hands', 'time', 'family knowledge', 'olive oil or grease', 'hot comb or pressing comb (traditional)'],
      benefits: ['Intergenerational knowledge transmission', 'Emotional support', 'Community building', 'Identity formation', 'Mental health'],
      culturalNote: `The beauty salon as a Black institution extends the kitchen table tradition into community space. The Black beauty salon is a site of community intelligence — where local news, political opinion, and cultural life circulate. Melissa Harris-Perry has written about the Black beauty salon as a site of community journalism and civic life. The informal mental health support that occurs in these spaces has been called "salon therapy" by researchers studying Black mental health in community settings.`
    },
    {
      name: 'Rest as Radical Act — The Nap Ministry',
      origin: 'Atlanta, GA (Tricia Hersey, 2016)',
      duration: 'As long as the body requires',
      description: `Tricia Hersey founded The Nap Ministry in 2016 with the declaration that rest is a form of resistance against the systems of capitalism and white supremacy that have historically demanded the labor of Black bodies without rest or compensation. Her foundational text "Rest Is Resistance" argues that grind culture — the valorization of busyness and productivity above all else — is an extension of the plantation logic that treated Black bodies as working instruments rather than human beings deserving of rest.

The Nap Ministry hosts "collective napping experiences" in public spaces — museums, parks, galleries — where participants are invited to lie down together under velvet blankets and rest publicly, unapologetically, in spaces historically occupied with work or consumption. Hersey's concept builds on the Black feminist tradition of refusal — the refusal to accept the terms of a system that devalues rest, and the insistence on rest as a right, not a luxury.

As a wellness practice: The practice of deliberate rest — not productive rest, not rest that enables more work, but rest for its own sake — is increasingly supported by sleep science. The default mode network of the brain (active during rest) is essential for creativity, emotional processing, and long-term memory consolidation. Rest is not the absence of productivity — it is a different kind of production: the production of the self.`,
      keyIngredients: ['permission', 'a comfortable surface', 'community', 'the radical refusal of productivity'],
      benefits: ['Nervous system recovery', 'Creative processing', 'Trauma healing', 'Political resistance', 'Joy'],
      culturalNote: `Hersey's framing of rest connects to the long history of enslaved Black people being denied sleep as an instrument of control. Frederick Douglass wrote about being kept awake by pain and fear and exhaustion. Rest, in this historical context, is not passive — it is a claim on the humanity that was denied. The concept has resonated far beyond Black communities, speaking to anyone whose labor has been exploited.`
    },
    {
      name: 'Black Women\'s Spa Traditions and Self-Care as Political Act',
      origin: 'Pan-African American',
      duration: 'Ongoing practice',
      description: `Contemporary Black women's spa culture builds on the Audre Lorde tradition while also creating new forms. The "treat yourself" culture of spa days among Black women friends is both pleasure and politics — a claiming of the right to luxury and care that has been historically denied. Black-owned spas and wellness businesses are a growing sector: spa owners like Tiffany Haddish, Oprah, and countless entrepreneurs have created spaces explicitly designed for Black women's bodies, aesthetics, and cultural needs. Treatments specifically designed for melanin-rich skin (addressing hyperpigmentation, ingrown hairs, post-inflammatory hyperpigmentation from shaving, and the unique needs of Type 4 hair) are increasingly mainstream. The self-care industrial complex's commercialization of the concept has been widely critiqued by Black women who point out that individual pampering does not address the systemic sources of the stress that self-care is meant to address. The more complete vision of Black women's wellness includes community care, political action, and systemic change alongside personal beauty practices.`,
      keyIngredients: ['community', 'intention', 'Black-owned products and businesses', 'political consciousness'],
      benefits: ['Healing from racial trauma', 'Community building', 'Economic solidarity', 'Cultural affirmation', 'Joy'],
      culturalNote: `The wellness industry in the United States generates over $4.2 trillion globally (Global Wellness Institute, 2022), but Black consumers have historically been underserved and under-represented in its marketing and product development. Black entrepreneurs in the wellness space represent one of the fastest-growing segments of the wellness industry, creating products and experiences that center Black women's needs, aesthetics, and cultural context.`
    }
  ],
  diyRecipe: {
    name: 'Kitchen Table Deep Condition and JBCO Scalp Treatment',
    ingredients: ['3 tbsp Jamaican Black Castor Oil', '2 tbsp deep conditioner', '1 tsp rosemary essential oil', '1 tsp peppermint essential oil', 'heating cap or plastic wrap'],
    steps: [
      'Section damp hair into 4–6 parts',
      'Apply JBCO mixed with essential oils directly to scalp in each section using a dropper',
      'Massage each section for 2–3 minutes with firm circular fingertip pressure',
      'Apply deep conditioner throughout the length of the hair (not the scalp)',
      'Cover with a plastic cap, then a heating cap, or sit under a hooded dryer for 30 minutes',
      'Rinse thoroughly with warm then cool water',
      'Apply a leave-in conditioner to damp hair and seal with a few drops of argan oil',
      'Style as desired — this is the reward for the care'
    ]
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL SPA SCIENCE
// ─────────────────────────────────────────────────────────────────────────────
export const UNIVERSAL_SPA_SCIENCE = {
  hydrotherapy: {
    title: 'Hydrotherapy Science: Hot/Cold Contrast',
    overview: `Water is the universal healing medium. Every culture on earth has developed water-based wellness practices because the science of hydrotherapy is encoded in the human body's physiology. The key mechanisms are simple and powerful.`,
    mechanisms: [
      {
        name: 'Vasodilation (Heat)',
        description: `Immersion in water at 38–42°C causes peripheral blood vessels to dilate dramatically, increasing blood flow to the skin and extremities by 4–7 times the resting level. This delivers oxygen and nutrients to skin cells and muscles while removing metabolic waste products (lactic acid, CO2, inflammatory cytokines). Heart rate increases and blood pressure drops as peripheral resistance falls. Muscles that have been in chronic contraction begin to release as the increased circulation dissolves the ischemic (low-oxygen) state that maintains muscle tension.`,
        temperature: '38–42°C (100–108°F)',
        duration: '10–20 minutes'
      },
      {
        name: 'Vasoconstriction (Cold)',
        description: `Cold water immersion (10–18°C) causes rapid peripheral vasoconstriction — blood is driven from the skin and extremities into the core to protect vital organs. When the cold exposure ends, the rebound vasodilation is more powerful than any warm water can achieve — blood surges back into the peripheral tissues with force, flushing waste products and delivering a burst of nutrients. This pumping action of hot-cold cycling is the foundation of contrast therapy and explains why alternating between hot and cold pools in Finnish saunas, Korean jjimjilbangs, and Russian banyas produces more therapeutic benefit than either alone.`,
        temperature: '10–18°C (50–64°F)',
        duration: '2–5 minutes'
      },
      {
        name: 'The Diving Reflex',
        description: `Cold water on the face (splashing or cold facial immersion) triggers the mammalian diving reflex: the vagus nerve activates, heart rate drops by 10–25%, and blood is redistributed to the brain and heart. This reflex is mediated by the trigeminal nerve branches on the face and is one of the most reliable methods for rapidly reducing acute anxiety and heart rate spikes. Cold face immersion for 30 seconds activates this reflex within seconds — a neurological "emergency brake" that overrides the sympathetic stress response.`,
        temperature: '10–15°C (50–59°F)',
        duration: '30 seconds to 3 minutes'
      }
    ],
    protocol: 'Optimal hot/cold contrast protocol: 10–20 minutes hot, 2–3 minutes cold, repeated 3–4 times. End with cold for maximum anti-inflammatory effect if the goal is recovery. End with warm for maximum relaxation.'
  },
  aromatherapy: {
    title: 'Aromatherapy and the Nervous System',
    overview: `Aromatherapy is the only sensory modality with a direct anatomical pathway to the limbic system (the brain's emotional center) and hippocampus (memory). While all other senses are first processed by the thalamus before reaching the limbic system, olfactory signals travel directly from the olfactory bulb to the amygdala and hippocampus without thalamic relay. This explains why scents evoke instant, emotionally loaded memories (Proust's madeleine) and why certain scents reliably alter mood and physiology.`,
    keyPathways: [
      {
        name: 'Olfactory-Amygdala Direct Pathway',
        description: 'Scent molecules bind to olfactory receptors → signal travels directly to amygdala → immediate emotional response without cognitive mediation. This bypasses the thinking brain entirely — explaining why a scent can trigger a stress response or a calm before the person consciously identifies what they are smelling.'
      },
      {
        name: 'Parasympathetic Activation',
        description: 'Lavender (linalool and linalyl acetate) has been shown in multiple clinical trials to reduce salivary cortisol, decrease heart rate, and shift EEG readings toward alpha waves — the relaxation frequency. The mechanism is olfactory receptor binding triggering direct parasympathetic nervous system signals.'
      },
      {
        name: 'Neurochemical Effects',
        description: 'Rosemary (1,8-cineole) measurably increases acetylcholine availability in the brain — improving working memory and cognitive performance. Ylang-ylang reduces blood pressure. Bergamot reduces anxiety equivalent to doses of anxiolytic medication in some studies.'
      }
    ],
    topScents: [
      { scent: 'Lavender', effect: 'Cortisol reduction, sleep improvement, anxiety reduction', mechanism: 'Linalool at GABA receptors' },
      { scent: 'Frankincense', effect: 'Emotional depth, anti-anxiety, mood stabilization', mechanism: 'Incensole acetate at TRPV3 channels' },
      { scent: 'Rosemary', effect: 'Memory and focus improvement', mechanism: '1,8-cineole inhibiting acetylcholinesterase' },
      { scent: 'Bergamot', effect: 'Anxiety reduction, mood lift', mechanism: 'Linalool and linalyl acetate modulation of serotonin receptors' },
      { scent: 'Ylang-ylang', effect: 'Blood pressure reduction, sedation', mechanism: 'Central nervous system depression via linalool' },
      { scent: 'Peppermint', effect: 'Alertness, pain reduction, nausea relief', mechanism: 'Menthol at TRPM8 cold receptors and mu-opioid receptors' }
    ]
  },
  touchAsMedicine: {
    title: 'Touch as Medicine: Oxytocin, Cortisol, and Immunity',
    overview: `Human touch is not a luxury — it is a biological necessity. The research on therapeutic touch has produced some of the most compelling data in all of wellness science, demonstrating that regular massage and gentle touch produce measurable changes in hormone levels, immune function, and even gene expression.`,
    mechanisms: [
      {
        name: 'Oxytocin Release',
        description: `Gentle, sustained touch (particularly effleurage — long, sweeping strokes) activates C-tactile afferent nerve fibers (CT afferents) that project directly to the hypothalamus, triggering the release of oxytocin — the "bonding hormone." Oxytocin reduces anxiety, increases trust, promotes social bonding, and has anti-inflammatory effects. The optimal touch speed for oxytocin activation is 3–10 cm/second — a deliberate, gentle stroke, not light tickling and not deep pressure. This speed range is thought to have evolved as the "grooming stroke" speed between bonded individuals.`
      },
      {
        name: 'Cortisol Reduction',
        description: `Multiple meta-analyses of massage therapy research show consistent reductions in salivary cortisol (15–50% reduction from baseline) following a single 45–60 minute massage. Cortisol chronically elevated from stress is catabolic — it breaks down muscle, suppresses immune function, impairs memory, and accelerates aging. A regular massage practice that keeps cortisol in check produces cascading health benefits across all body systems.`
      },
      {
        name: 'NK Cell Activation',
        description: `Natural Killer (NK) cells are the immune system's first responders to virus-infected and cancerous cells. Research by Tiffany Field at the Touch Research Institute at the University of Miami found that massage therapy measurably increases NK cell count and NK cell activity. HIV-positive adults who received regular massage showed significant improvements in NK cell function — suggesting that touch has direct immune-modulating effects, not merely stress-reduction effects.`
      },
      {
        name: 'Vagal Tone Enhancement',
        description: `Gentle touch on the back of the neck, scalp, and abdomen — areas of dense vagal afferent innervation — measurably increases vagal tone (as measured by heart rate variability). Higher vagal tone is associated with better emotional regulation, reduced inflammatory markers, improved cardiovascular health, and better resistance to stress.`
      }
    ],
    clinicalEvidence: [
      'Tiffany Field, Touch Research Institute: 45-minute massages twice weekly for 4 weeks reduced job burnout by 60% in nurses',
      'JAMA study 2016: Massage therapy for chronic lower back pain equivalent to NSAIDs in pain reduction',
      'University of Warwick 2012: Infant massage reduces hospital stays for premature babies by an average of 6 days',
      'Cedar-Sinai 2010: Single 45-minute massage reduced levels of cytokines associated with inflammation and increased white blood cells'
    ]
  },
  steamAndHeat: {
    title: 'The Science of Steam and Heat on Skin and Pores',
    overview: `Pores are not doors — they cannot "open" and "close" like hatches. They are elastic tubular structures that house hair follicles and sebaceous glands. However, heat has real and measurable effects on the skin that explain why steaming is one of the most universally practiced beauty treatments across all cultures.`,
    heatEffects: [
      {
        name: 'Sebum Liquefaction',
        description: 'Sebum (skin oil) solidifies at room temperature and hardens in oxidized blackheads. At the skin temperatures achieved by steam (35–40°C surface temperature), sebum liquefies and becomes easier to remove without mechanical trauma. This is why steaming before extraction or exfoliation makes both processes more effective and less damaging.'
      },
      {
        name: 'Keratinization Softening',
        description: 'The stratum corneum (outermost dead skin layer) is primarily composed of keratin — a protein that softens when hydrated and heated. Steam simultaneously hydrates and heats the stratum corneum, making it dramatically more permeable to active ingredients applied afterward. A 10-minute steam increases product absorption by 200–400%.'
      },
      {
        name: 'Vasodilation and Nutrient Delivery',
        description: 'Steam heat increases skin surface blood flow by 3–5 times. This delivers more oxygen and nutrients to the skin\'s living layers, giving the characteristic pink glow after steaming. The increased blood flow accelerates cellular metabolism and speeds the skin renewal cycle.'
      },
      {
        name: 'Antimicrobial Effect',
        description: 'Steam at 40–45°C creates an inhospitable environment for Propionibacterium acnes (the acne-causing bacterium) and Malassezia (the yeast associated with dandruff and seborrheic dermatitis), both of which thrive at normal skin temperature but are inhibited by sustained elevated heat.'
      }
    ],
    protocol: 'Optimal steaming: 8–12 minutes of steam at a comfortable distance (30–40cm from water surface). Follow immediately with active ingredient application while the skin is still warm and maximally permeable. Finish with a cool water rinse to reduce redness and signal the skin to contract.',
    cautions: 'Rosacea, telangiectasia (visible broken capillaries), and active inflammatory acne may be worsened by steam. People with these conditions should consult a dermatologist before steaming.'
  },
  diyRecipes: {
    title: 'Universal DIY Spa Recipes',
    recipes: [
      {
        name: 'Universal Herbal Steam',
        forSkinType: 'All skin types (modify herbs)',
        ingredients: ['1L filtered water', '2 tbsp dried lavender', '2 tbsp dried chamomile', '1 tbsp dried mint', '3 drops eucalyptus oil'],
        steps: ['Boil water, pour into large bowl', 'Add herbs and essential oil', 'Drape towel over head and bowl, lean at comfortable distance', 'Steam for 8–12 minutes', 'Immediately apply your chosen active treatment']
      },
      {
        name: 'Honey and Oat Soothing Mask',
        forSkinType: 'Sensitive, inflamed, or dry skin',
        ingredients: ['2 tbsp colloidal oatmeal (blended oats)', '1 tbsp raw honey', '1 tbsp full-fat yogurt', '1 tsp aloe vera gel'],
        steps: ['Mix all ingredients to a smooth paste', 'Apply to clean face', 'Leave 15–20 minutes', 'Remove with warm wet cloth in circular motions', 'Follow with moisturizer']
      },
      {
        name: 'Hot-Cold Contrast Foot Soak',
        forSkinType: 'Universal — particularly beneficial for circulation, fatigue, and swelling',
        ingredients: ['2 basins (hot and cold water)', 'Hot water: Epsom salt, lavender, rosemary', 'Cold water: peppermint leaves, ice cubes'],
        steps: ['Fill one basin with water as hot as comfortable + Epsom salt + lavender + rosemary', 'Fill second basin with cold water + ice + peppermint', 'Alternate 3 minutes hot, 1 minute cold, for 4 rounds', 'End with cold for recovery; end with hot for relaxation', 'Dry thoroughly and apply shea or cocoa butter while warm']
      },
      {
        name: 'Universal Rose and Glycerin Toner',
        forSkinType: 'All skin types',
        ingredients: ['120ml rose hydrosol (rosewater)', '1 tsp vegetable glycerin', '3 drops rose hip seed oil', '1 drop frankincense essential oil'],
        steps: ['Combine all ingredients in a spray bottle', 'Shake before each use', 'Spray onto face after cleansing while still damp', 'Do not rinse — allow to absorb', 'Follow with moisturizer or facial oil']
      }
    ]
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DATA OBJECT: ETHNIC SPA GUIDES
// ─────────────────────────────────────────────────────────────────────────────
export const ETHNIC_SPA_GUIDES = {
  'west-african': WEST_AFRICAN_SPA,
  'south-asian': SOUTH_ASIAN_SPA,
  'caribbean': CARIBBEAN_SPA,
  'arab': ARAB_SPA,
  'latina': LATINA_SPA,
  'east-asian': EAST_ASIAN_SPA,
  'east-african': EAST_AFRICAN_SPA,
  'south-african': SOUTH_AFRICAN_SPA,
  'black-american': BLACK_AMERICAN_SPA,
};

// ─────────────────────────────────────────────────────────────────────────────
// SPA STATISTICS
// ─────────────────────────────────────────────────────────────────────────────
export const SPA_STATS = {
  globalWellnessMarket: {
    totalValue2022: '$5.6 trillion USD',
    spaIndustryValue: '$119 billion USD',
    fastestGrowingRegion: 'Asia-Pacific',
    annualGrowthRate: '9.9%',
    source: 'Global Wellness Institute, 2023'
  },
  scienceStats: [
    { stat: '50%', description: 'Reduction in cortisol after a single 45-minute massage (some studies)' },
    { stat: '400%', description: 'Increase in active ingredient skin absorption following 10 minutes of steam' },
    { stat: '4x', description: 'Increase in blood flow to skin during hot water immersion at 40°C' },
    { stat: '30 min', description: 'Yoga nidra duration equivalent to 4 hours of sleep in restorative value (AIIMS study)' },
    { stat: '92', description: 'Number of essential minerals found in sea moss, matching the mineral composition of the human body' },
    { stat: '1,472 CE', description: 'Year Kobido Japanese facial massage technique was documented, one of the oldest formalized face treatments' },
    { stat: '5,000 years', description: 'Age of Ayurvedic wellness system — oldest intact wellness tradition in the world' },
    { stat: '27,000+', description: 'Hot spring sources in Japan — highest concentration in the world' },
    { stat: '$2.5 billion', description: 'Annual US Black consumer spending on hair care products' },
    { stat: '9,000+', description: 'Plant species unique to South Africa\'s Cape Floristic Region (global biodiversity hotspot)' }
  ],
  traditionalKnowledgeFacts: [
    'The Ethiopian coffee ceremony has been practiced for over 600 years',
    'Temazcal sweat lodges have been used in Mesoamerica for over 2,900 years',
    'West African shea butter cooperatives produce 80% of the world\'s shea supply, employing 16 million women',
    'The hammam was institutionalized throughout the Islamic world within 100 years of the religion\'s founding',
    'Korean Italy towel exfoliation became mainstream in the 1950s–1970s as public bath culture flourished',
    'Frankincense trade routes were among the first transcontinental trade networks, established 4,000+ years ago',
    'Marula oil was used by San peoples 40,000 years before commercial cosmetics discovered it',
    'Audre Lorde\'s self-care manifesto was written in 1988 in "A Burst of Light," one year after her breast cancer diagnosis'
  ],
  communityIds: [
    'west-african',
    'south-asian',
    'caribbean',
    'arab',
    'latina',
    'east-asian',
    'east-african',
    'south-african',
    'black-american'
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// GETTER FUNCTION — directMap pattern required
// ─────────────────────────────────────────────────────────────────────────────
export function getSpaGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_SPA_GUIDES['west-african'],
    'south-asian': ETHNIC_SPA_GUIDES['south-asian'],
    'caribbean': ETHNIC_SPA_GUIDES['caribbean'],
    'arab': ETHNIC_SPA_GUIDES['arab'],
    'latina': ETHNIC_SPA_GUIDES['latina'],
    'east-asian': ETHNIC_SPA_GUIDES['east-asian'],
    'east-african': ETHNIC_SPA_GUIDES['east-african'],
    'south-african': ETHNIC_SPA_GUIDES['south-african'],
    'black-american': ETHNIC_SPA_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADDITIONAL UTILITY EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export function getAllCommunityIds() {
  return SPA_STATS.communityIds;
}

export function getAllSpaGuides() {
  return Object.values(ETHNIC_SPA_GUIDES);
}

export function getTreatmentsByBenefit(benefit) {
  const results = [];
  for (const [communityId, guide] of Object.entries(ETHNIC_SPA_GUIDES)) {
    if (guide.treatments) {
      for (const treatment of guide.treatments) {
        if (treatment.benefits && treatment.benefits.some(b =>
          b.toLowerCase().includes(benefit.toLowerCase())
        )) {
          results.push({
            communityId,
            communityName: guide.name,
            treatment: treatment.name,
            benefits: treatment.benefits,
            origin: treatment.origin,
            duration: treatment.duration
          });
        }
      }
    }
  }
  return results;
}

export function getDIYRecipeForCommunity(communityId) {
  const directMap = {
    'west-african': ETHNIC_SPA_GUIDES['west-african'],
    'south-asian': ETHNIC_SPA_GUIDES['south-asian'],
    'caribbean': ETHNIC_SPA_GUIDES['caribbean'],
    'arab': ETHNIC_SPA_GUIDES['arab'],
    'latina': ETHNIC_SPA_GUIDES['latina'],
    'east-asian': ETHNIC_SPA_GUIDES['east-asian'],
    'east-african': ETHNIC_SPA_GUIDES['east-african'],
    'south-african': ETHNIC_SPA_GUIDES['south-african'],
    'black-american': ETHNIC_SPA_GUIDES['black-american'],
  };
  const guide = directMap[communityId];
  return guide ? guide.diyRecipe : null;
}

export function getAllDIYRecipes() {
  return Object.entries(ETHNIC_SPA_GUIDES).map(([communityId, guide]) => ({
    communityId,
    communityName: guide.name,
    recipe: guide.diyRecipe
  }));
}

export function getSpaStatsByCategory(category) {
  const directMap = {
    'market': SPA_STATS.globalWellnessMarket,
    'science': SPA_STATS.scienceStats,
    'knowledge': SPA_STATS.traditionalKnowledgeFacts,
    'communities': SPA_STATS.communityIds
  };
  return directMap[category] || null;
}

export function getUniversalScienceTopic(topic) {
  const directMap = {
    'hydrotherapy': UNIVERSAL_SPA_SCIENCE.hydrotherapy,
    'aromatherapy': UNIVERSAL_SPA_SCIENCE.aromatherapy,
    'touch': UNIVERSAL_SPA_SCIENCE.touchAsMedicine,
    'steam': UNIVERSAL_SPA_SCIENCE.steamAndHeat,
    'recipes': UNIVERSAL_SPA_SCIENCE.diyRecipes
  };
  return directMap[topic] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTENDED WELLNESS PHILOSOPHIES BY COMMUNITY
// ─────────────────────────────────────────────────────────────────────────────

export const WELLNESS_PHILOSOPHIES = {
  'west-african': {
    corePhilosophy: `Ubuntu — "I am because we are" — extends to wellness in West African culture. Health is not a private achievement but a communal state. When one person in a community is sick or neglected, the community's health is diminished. This philosophy shapes the communal structure of West African beauty and wellness practices: the cooperative labor of shea production, the shared steam room, the communal hair braiding. The individual body is cared for in the context of the community, not in isolation.`,
    bodyViewpoint: `The West African body is understood in relation to the ancestral, the natural, and the communal. In Yoruba tradition, the body is the vehicle of the orisha (divine forces) and is treated with respect as such. The Akan people recognize the distinction between the honam (physical body) and the sunsum (spiritual essence) — wellness involves caring for both. Many West African healing practices address the sunsum through ritual while attending to the honam through plant medicine and touch.`,
    keyValues: ['Community over individual', 'Intergenerational knowledge', 'Natural ingredients as divine gifts', 'Beauty as health, not vanity', 'Communal production of wellness resources'],
    modernRelevance: `The global natural beauty industry has been profoundly shaped by West African ingredients — shea butter, black soap, baobab oil, moringa — but the communities whose knowledge created these products have not always shared equitably in the profit. Initiatives like fair-trade shea certification and direct-trade relationships with African cooperatives attempt to address this imbalance.`
  },
  'south-asian': {
    corePhilosophy: `Ayurveda sees the human being as a microcosm of the universe, governed by the same five elements (space, air, fire, water, earth) that constitute all of creation. The three doshas — Vata (air + space), Pitta (fire + water), Kapha (earth + water) — are the functional intelligences that govern all physiological and psychological processes. Wellness is not the absence of disease but the dynamic balance of these forces, different for each individual and changing with season, age, and life circumstances. Every Ayurvedic treatment is therefore ideally customized to the individual's constitution (prakriti) and current imbalance (vikriti).`,
    bodyViewpoint: `The Ayurvedic body is permeated by prana (life force) flowing through 72,000 nadis (energy channels) and concentrated at seven chakra centers. Blockages in these channels — caused by diet, stress, trauma, seasonal changes, or violation of natural rhythms — are the root cause of disease. Ayurvedic treatments (massage, oil treatments, steam, herbal medicine) restore the free flow of prana. The skin is understood as a sense organ (the organ of touch) and is treated accordingly — not merely cosmetically but as a window into the internal state of the doshas.`,
    keyValues: ['Individual constitution-based care', 'Prevention over cure', 'Seasonal attunement', 'Integration of food, sleep, movement and ritual', 'The physician as teacher, not fixer'],
    modernRelevance: `Ayurveda is the fastest-growing wellness system globally. However, the commercialization of Ayurveda has produced significant decontextualization — Ayurvedic products sold without dosha assessment, Ayurvedic treatments performed by practitioners without authentic training, and appropriation of Ayurvedic terminology by brands with no connection to the tradition. Practitioners from authentic lineages emphasize that Ayurveda is a complete system of medicine, not a set of exotic beauty treatments.`
  },
  'caribbean': {
    corePhilosophy: `Caribbean wellness philosophy is shaped by the region's history of forced displacement and the creativity of communities who built wellness from available resources. Enslaved Africans brought healing knowledge from their home countries and integrated it with Caribbean plants and the wisdom of indigenous Taíno and Carib peoples. The result is a wellness tradition that is essentially syncretic — drawing from multiple sources without dogma, guided by what works. Caribbean wellness culture places high value on the healing power of the natural environment: the sea, the sun, volcanic earth, tropical plants, and seasonal food are all understood as medicines.`,
    bodyViewpoint: `The Caribbean body is understood as requiring both physical and spiritual maintenance. Afro-Caribbean spiritual traditions — Vodou (Haiti), Santería (Cuba), Obeah (Jamaica), Spiritual Baptist (Trinidad) — have wellness dimensions in which physical symptoms are addressed through spiritual intervention alongside plant medicine. The concept of "catching a fright" (susto in Spanish-speaking Caribbean) — a state of shock or trauma that lodges in the body — parallels similar concepts in Latin American curanderismo and is treated through ritual cleansing as well as physical care.`,
    keyValues: ['Resourcefulness and adaptation', 'The sea as healer', 'Integration of spiritual and physical health', 'Community knowledge over institutional medicine', 'Joy as medicine'],
    modernRelevance: `Caribbean wellness tourism is growing rapidly, with destinations like Jamaica, St. Lucia, and Dominica developing eco-wellness resorts that center indigenous and traditional practices. The challenge is ensuring that these developments benefit local communities and preserve authentic traditions rather than creating sanitized performances for tourist consumption.`
  },
  'arab': {
    corePhilosophy: `Islamic medicine (Al-Tibb al-Nabawi — prophetic medicine) establishes cleanliness (taharah) as both a spiritual obligation and a foundation of health. The Prophet Muhammad's hadith (sayings) include detailed prescriptions for personal hygiene, diet, sleep, and community health that constitute a practical wellness system. The hammam embodies this philosophy in architectural form — it is a building designed to make purification complete, pleasurable, and communal. Arab wellness philosophy also draws from the rich tradition of Greco-Islamic medicine (Ibn Sina's Canon of Medicine, Ibn al-Nafis) which synthesized Greek humoral theory with Arab empirical practice.`,
    bodyViewpoint: `The Arab body is understood as belonging ultimately to God (Allah) and therefore requiring care as an act of worship. Harming the body through neglect or excess is considered a form of ingratitude. The concept of mizaj (temperament — the Arab equivalent of constitution in Ayurveda and dosha) categorizes individuals into hot/cold/wet/dry temperaments and prescribes foods, behaviors, and treatments accordingly. Frankincense, black seed (Nigella sativa), honey, and olive oil are specifically mentioned in Islamic sacred texts as healing agents.`,
    keyValues: ['Purification as worship', 'Community bathing as social institution', 'Natural remedies from prophetic tradition', 'Beauty as reflection of inner grace', 'Hospitality expressed through fragrance and care'],
    modernRelevance: `The global luxury hammam spa industry has grown enormously, with high-end hammam experiences available from London to New York. Critics within Arab communities note that the luxury market often strips the hammam of its democratic and communal character — the neighborhood hammam, where all social classes bathed together, being replaced by exclusive experiences available only to the wealthy.`
  },
  'latina': {
    corePhilosophy: `Latin American wellness philosophy is grounded in cosmovisión — the indigenous world-view that sees humans as participants in a living universe of interdependent beings and forces. Health is the right relationship between the individual, the community, the natural world, and the spiritual realm. Illness is disruption of this relationship. Healing restores it. This framework, shared across Aztec, Maya, Inca, and many other indigenous traditions, was never fully displaced by colonial Christianity — it merged with Catholic elements (the saints often mapping onto indigenous deities) to create the syncretic healing practices of contemporary Latin America.`,
    bodyViewpoint: `The body in cosmovisión is porous — permeable to spiritual influences, to the forces of nature, and to the emotions of others. Mal de ojo (evil eye) is the transfer of harm from the envy of others through a gaze. Susto (fright) is the dislodging of the soul from the body through a traumatic event. Aire (literally "air") is the entry of harmful atmospheric forces into the body through open pores, cold drafts, or spiritual vulnerability. These concepts coexist with contemporary medical understanding in many communities — each explains dimensions of illness that the other does not reach.`,
    keyValues: ['Cosmovisión — humans within a living universe', 'Healing as relationship restoration', 'Plants as sacred teachers', 'Community and lineage in healing', 'The spiritual dimension of physical wellness'],
    modernRelevance: `The global temazcal boom has raised important questions about cultural appropriation versus cultural sharing. Non-indigenous practitioners offering temazcal ceremonies without training or lineage appropriate a sacred practice and, indigenous leaders argue, dilute its power and meaning. Organizations of indigenous temazcaleros have called for recognition of the practice as living intellectual property requiring proper lineage and permission.`
  },
  'east-asian': {
    corePhilosophy: `East Asian wellness philosophy is grounded in Taoist and Confucian principles: harmony with nature's cycles, balance of opposing forces (yin and yang), and the cultivation of qi (life force) through disciplined practice. Traditional Chinese Medicine (TCM), which forms the theoretical basis of much East Asian wellness practice, understands health as the free flow of qi through the meridian system, and illness as its stagnation or disruption. The seasons, the time of day, the individual's age and constitution, and the quality of one's relationships are all considered relevant to health.`,
    bodyViewpoint: `In Chinese cosmology, the body contains the microcosm of heaven and earth — the same qi that animates the universe flows through the human body. The five yin organs (heart, lungs, spleen, liver, kidneys) are associated with the five elements (fire, metal, earth, wood, water) and with emotions, seasons, colors, tastes, and sounds. Imbalance in any of these correspondences creates illness. TCM diagnostic methods (pulse reading, tongue diagnosis, questioning about sleep, digestion, emotions) attempt to locate the precise nature of the qi disruption before prescribing treatment.`,
    keyValues: ['Harmony with natural cycles', 'Prevention through seasonal adjustment', 'Integration of emotion and physical health', 'Slow, accumulated self-cultivation', 'Collective well-being (onsen and jjimjilbang as community spaces)'],
    modernRelevance: `K-beauty (Korean beauty) has had perhaps the single greatest global influence on skincare culture in the past decade, introducing the multi-step routine, sheet masks, fermented skincare, and the concept of "glass skin" (dewy, translucent skin revealing its own health) to global markets. Japanese minimalism has simultaneously influenced those who find K-beauty's complexity overwhelming. Both traditions share the underlying value of disciplined, consistent care as the foundation of lasting results.`
  },
  'east-african': {
    corePhilosophy: `East African wellness philosophy reflects the region's unique position as humanity's geographic origin — the East African Rift Valley is where Homo sapiens evolved. San people of East Africa have practiced continuous botanical knowledge for 100,000+ years. The philosophical frameworks that shape East African wellness are diverse: Ethiopian Orthodox Christian traditions of fasting and prayer, Somali Islamic traditions of purity and communal care, Maasai traditions of cattle-culture and warrior-body maintenance, and Swahili coastal synthesis of African, Arab, and Indian influences.`,
    bodyViewpoint: `Ethiopian Christianity, which has one of the most rigorous fasting traditions in the world (Ethiopian Orthodox Christians fast over 250 days per year, abstaining from animal products), has shaped a wellness culture in which dietary restraint is understood as both spiritual and physical purification. The body is a vessel for the divine and must be maintained through both spiritual practice and physical care. The Ethiopian coffee ceremony, as a ritual of hospitality and community, embodies the understanding that social connection is itself a form of wellness.`,
    keyValues: ['Hospitality as health practice', 'Communal rituals as wellness infrastructure', 'Plant knowledge accumulated over millennia', 'The integration of spiritual and physical practice', 'Trade route synthesis — best of multiple traditions'],
    modernRelevance: `Ethiopian and Eritrean wellness traditions are gaining global visibility as diaspora communities bring practices to new markets. Ethiopian coffee ceremonies have become fixtures in Ethiopian restaurants worldwide. Frankincense from the Horn of Africa is being discovered by the global aromatherapy market — but the Boswellia trees that produce it are under severe pressure from overharvesting driven by this demand.`
  },
  'south-african': {
    corePhilosophy: `South African indigenous wellness philosophy is rooted in the concept of ubuntu in Zulu/Xhosa tradition and the San philosophy of balanced relationship with the natural world. The traditional healer (isangoma or inyanga) does not treat the body in isolation but addresses the entire web of relationships — with ancestors, with community, with the natural world — that constitute a person's health. Illness is often understood as a signal from the ancestors requiring attention, or as the result of broken relationships in the community that need repair.`,
    bodyViewpoint: `In Zulu and Xhosa traditions, the body is understood as inhabited by multiple entities: the umoya (breath/spirit), the isithunzi (shadow/personality), and the ancestral presence (amadlozi). The isangoma's diagnostic process involves entering a trance state to receive guidance from the amadlozi about the nature and cause of the patient's condition. Physical treatments with plant medicine (imbiza) are prescribed alongside ritual acts of reconciliation, offerings, or behavioral changes.`,
    keyValues: ['Ancestral connection as health foundation', 'Community diagnosis and healing', 'Botanical biodiversity as medicine', 'Healing as relationship repair', 'Ubuntu — communal wellbeing as individual wellbeing'],
    modernRelevance: `South Africa's post-apartheid health policy has made notable progress in recognizing and integrating traditional healing. The Traditional Health Practitioners Act (2007) created a framework for regulating traditional healers while preserving their role. However, significant work remains in ensuring that the intellectual property of South African traditional knowledge is protected from corporate appropriation.`
  },
  'black-american': {
    corePhilosophy: `Black American wellness philosophy, in its most articulate contemporary form, centers on three interlocking ideas: (1) self-care as political resistance (Audre Lorde's framework), (2) rest as reclamation from a system built on Black labor (Tricia Hersey's Nap Ministry), and (3) community care as the infrastructure of individual wellbeing. These frameworks explicitly connect personal wellness practices to historical trauma (the Middle Passage, slavery, Jim Crow, ongoing structural racism) and argue that the self-care of Black people — particularly Black women — is a form of resistance against systems that profit from Black suffering and exhaustion.`,
    bodyViewpoint: `The Black body in America has been a site of specific historical violation — forced labor, medical experimentation, sexual exploitation, and ongoing police violence. Black feminist scholars and wellness practitioners argue that this history of violation requires a specifically reparative approach to the Black body: one that centers pleasure, rest, and care as responses to harm. The natural hair movement reflects a reclaiming of the Black body's natural state against a history of coercion to conform to white aesthetic standards.`,
    keyValues: ['Self-care as political act', 'Rest as reclamation', 'Community care infrastructure', 'Joy as resistance', 'Natural hair as embodied freedom', 'Economic solidarity through Black-owned wellness businesses'],
    modernRelevance: `The $52 billion US wellness industry remains deeply inequitable in its access and representation. Black wellness entrepreneurs, scholars, and practitioners are building an alternative infrastructure: Black-owned spas, natural beauty brands, yoga studios, therapy practices, and community care networks that center Black bodies and Black cultural values. The COVID-19 pandemic, which disproportionately impacted Black communities, accelerated the visibility of racial health disparities and the urgent need for culturally competent wellness care.`
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// INGREDIENT GLOSSARY — cross-referenced across communities
// ─────────────────────────────────────────────────────────────────────────────

export const INGREDIENT_GLOSSARY = {
  sheaButter: {
    botanicalName: 'Vitellaria paradoxa',
    origin: 'West Africa (Sahel region)',
    keyCompounds: ['oleic acid (45–55%)', 'stearic acid (35–45%)', 'triterpene alcohols', 'tocopherols'],
    skinBenefits: 'Deep moisturization, anti-inflammation, wound healing, UV protection, antioxidant',
    hairBenefits: 'Moisturization, scalp health, growth support, protective coating',
    usedIn: ['west-african'],
    notes: 'Raw/unrefined shea (ivory or yellow) retains all active compounds. Refined white shea is deodorized and loses most therapeutic value.'
  },
  arganOil: {
    botanicalName: 'Argania spinosa',
    origin: 'Morocco (endemic to Souss Valley)',
    keyCompounds: ['oleic acid', 'linoleic acid', 'tocopherols (vitamin E)', 'phenolic compounds'],
    skinBenefits: 'Anti-aging, moisturization, scar healing, acne treatment',
    hairBenefits: 'Frizz control, shine, heat protection, scalp health',
    usedIn: ['arab'],
    notes: 'Moroccan argan oil cooperatives, run almost entirely by Berber women, are a UNESCO-recognized model of sustainable traditional knowledge. Demand has increased prices beyond what local women can afford — an irony of global wellness commodity markets.'
  },
  frankincense: {
    botanicalName: 'Boswellia species (sacra, papyrifera, carterii, serrata)',
    origin: 'Oman, Ethiopia, Somalia, India',
    keyCompounds: ['boswellic acids (AKBA)', 'monoterpenes (alpha-pinene)', 'incensole acetate'],
    skinBenefits: 'Anti-inflammatory, wound healing, skin regeneration, scar reduction, anti-aging',
    aromaBenefits: 'Anxiety reduction, depression relief, emotional depth, spiritual grounding',
    usedIn: ['arab', 'east-african'],
    notes: 'Boswellia papyrifera (Ethiopian/Eritrean) and Boswellia sacra (Omani) are the most therapeutically significant species. Both are endangered. Boswellic acid AKBA has shown anti-tumor effects in laboratory studies — research ongoing.'
  },
  blackCastorOil: {
    botanicalName: 'Ricinus communis (roasted variety)',
    origin: 'Jamaica (production), worldwide (ricinus is native to East Africa)',
    keyCompounds: ['ricinoleic acid (85–90%)', 'ash from roasting', 'vitamin E'],
    skinBenefits: 'Wound healing, antimicrobial, anti-inflammatory',
    hairBenefits: 'Growth stimulation, thickening, edge regrowth, scalp health',
    usedIn: ['black-american', 'caribbean'],
    notes: 'The "black" in JBCO refers to the color from roasting, not to any racial categorization. The roasting increases alkalinity, which opens the hair cuticle for deeper penetration. Authentic Jamaican black castor oil has a distinctive smoky smell — absence of this smell suggests the roasting step was skipped.'
  },
  aloeVera: {
    botanicalName: 'Aloe barbadensis miller',
    origin: 'Arabian Peninsula (wild origin), now cultivated globally',
    keyCompounds: ['acemannan', 'aloin', 'anthraquinones', 'vitamins A, C, E, B12'],
    skinBenefits: 'Wound healing, burn relief, hydration, anti-inflammation, acne treatment',
    hairBenefits: 'Scalp health, moisture, pH balancing, dandruff treatment',
    usedIn: ['caribbean', 'south-african', 'latina'],
    notes: 'Aloe ferox (South Africa) is measurably more potent than Aloe vera in multiple studies. The global aloe industry is dominated by Aloe vera because it is easier to farm at scale — but ferox deserves more recognition.'
  },
  turmeric: {
    botanicalName: 'Curcuma longa',
    origin: 'South Asia (likely India/Vietnam)',
    keyCompounds: ['curcumin', 'turmerones', 'bisabolane sesquiterpenes'],
    skinBenefits: 'Anti-inflammatory, antimicrobial, brightening, wound healing, antioxidant',
    hairBenefits: 'Scalp anti-inflammatory, DHT blocking (potential), dandruff treatment',
    usedIn: ['south-asian', 'caribbean', 'east-african'],
    notes: 'Curcumin is poorly absorbed through the skin without a penetration enhancer. Piperine (black pepper) enhances absorption by 2000% when consumed orally but the topical equivalent is using the oil with heat or alongside a penetration-enhancing carrier like DMSO. Traditional ubtan uses turmeric at concentrations where staining (not absorption) is the primary intended effect.'
  },
  camelliaTsubakiOil: {
    botanicalName: 'Camellia japonica',
    origin: 'Japan (Oshima island primarily)',
    keyCompounds: ['oleic acid (82–88%)', 'squalene', 'vitamins A, B, D, E'],
    skinBenefits: 'Deep moisturization, anti-aging, scar healing, UV protection',
    hairBenefits: 'Shine, softening, scalp nourishment, split end treatment',
    usedIn: ['east-asian'],
    notes: 'Tsubaki (camellia) oil has been the Japanese gold standard for hair and skin care for 1,000+ years. Geishas of the Edo period used it as their primary hair oil. The molecular weight closely matches the skin\'s own sebum, making it uniquely well-absorbed.'
  },
  rooibos: {
    botanicalName: 'Aspalathus linearis',
    origin: 'Cederberg Mountains, Western Cape, South Africa (endemic)',
    keyCompounds: ['aspalathin', 'nothofagin', 'quercetin', 'luteolin', 'orientin'],
    skinBenefits: 'Anti-inflammatory, antihistamine, antioxidant, skin toning, eczema relief',
    hairBenefits: 'Scalp anti-inflammatory, dandruff treatment, growth environment improvement',
    usedIn: ['south-african'],
    notes: 'Aspalathin is unique to rooibos — it does not exist in any other known plant. As an antioxidant, it has 50% greater radical-scavenging capacity than epigallocatechin gallate (EGCG, the famous green tea antioxidant) in some assays. Rooibos is entirely caffeine-free, making it suitable for all ages and times of day.'
  },
  seaMoss: {
    botanicalName: 'Gracilaria debilis / Chondrus crispus',
    origin: 'Caribbean coasts (Gracilaria), North Atlantic (Chondrus)',
    keyCompounds: ['carrageenan', 'zinc', 'iodine', 'iron', 'potassium', '92 minerals total'],
    skinBenefits: 'Mineral infusion, detoxification, hydration, skin smoothing, anti-bacterial',
    hairBenefits: 'Scalp minerals, hair thickening, moisture retention, growth environment',
    usedIn: ['caribbean'],
    notes: 'The "92 minerals" claim attributed to Dr. Sebi is widely repeated but specific sourcing of the figure is difficult to verify in peer-reviewed literature. What is established is that sea moss contains significantly higher mineral diversity than almost any other food or topical ingredient, and its use as a mineral supplement (internal and external) has a long empirical track record.'
  },
  marula: {
    botanicalName: 'Sclerocarya birrea',
    origin: 'Sub-Saharan Africa (widespread)',
    keyCompounds: ['oleic acid (70–78%)', 'catechins', 'tocopherols', 'flavonoids'],
    skinBenefits: 'Deep penetrating moisturization, anti-aging, scar reduction, anti-inflammation',
    hairBenefits: 'Softening, shine, scalp health, growth environment',
    usedIn: ['south-african'],
    notes: 'Marula oil\'s unique combination of very high oleic acid and catechins makes it both deeply moisturizing and antioxidant-protective. Its molecular weight is very close to the skin\'s natural sebum — like tsubaki oil, it absorbs without greasiness. Ethical sourcing from African women\'s cooperatives is essential given the history of appropriation of marula knowledge.'
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SEASONAL SPA GUIDE — adapting practices to seasons
// ─────────────────────────────────────────────────────────────────────────────

export const SEASONAL_SPA_GUIDE = {
  spring: {
    season: 'Spring (Kapha season in Ayurveda; Wood element in TCM)',
    energyQuality: 'Renewal, detoxification, emergence',
    recommendedTreatments: [
      'West African: Moringa body treatment for renewal',
      'South Asian: Ubtan with neem and turmeric — spring cleanse',
      'Arab: Full hammam — renewing the skin for the new season',
      'East Asian: Green tea (matcha) antioxidant wrap — spring vitality',
      'Latin American: Temazcal with spring herbs for cleansing',
    ],
    avoidTreatments: 'Heavy oils and deeply nourishing treatments best suited to dry winter months',
    seasonalIngredients: ['neem', 'lemon', 'green tea', 'mint', 'rosemary', 'eucalyptus'],
    philosophy: 'Spring is the season of emergence and clearing. Detoxifying treatments that remove winter accumulation from skin and pores are particularly effective. The Ayurvedic spring cleanse (Vasanta Ritucharya) prescribes specifically lighter foods and more vigorous exercise and self-care to counteract winter\'s heaviness.'
  },
  summer: {
    season: 'Summer (Pitta season in Ayurveda; Fire element in TCM)',
    energyQuality: 'Intensity, expansion, heat, activity',
    recommendedTreatments: [
      'Caribbean: Ocean therapy and seawater bathing',
      'South Asian: Cooling shirodhara with coconut/rose oil for Pitta reduction',
      'Arab: Hammam with cool rinse emphasis and cooling rosewater',
      'East African: Camel milk bath for cooling and mineral replenishment',
      'South African: Aloe ferox wrap for sun-exposed skin',
    ],
    avoidTreatments: 'Heavy heat treatments (excess steam, volcanic heat) during peak summer — they can aggravate heat imbalances',
    seasonalIngredients: ['aloe vera', 'rosewater', 'coconut oil', 'cucumber', 'sandalwood', 'mint'],
    philosophy: 'Summer heat requires cooling and protection for the skin. The Ayurvedic summer routine (Grishma Ritucharya) prescribes avoiding excess heat exposure, staying hydrated, and using cooling oils and foods. The Caribbean wisdom of ocean bathing for summer skin care reflects the same insight — cool salt water cools, mineralizes, and protects sun-exposed skin.'
  },
  autumn: {
    season: 'Autumn (Vata season in Ayurveda; Metal element in TCM)',
    energyQuality: 'Transition, drying, grounding, introspection',
    recommendedTreatments: [
      'South Asian: Daily abhyanga with warm sesame oil — Vata-pacifying',
      'West African: Shea butter treatment — barrier building before winter',
      'Arab: Full hammam with ghassoul clay and argan finishing',
      'Japanese: Deep onsen soak with warming herbal additions',
      'Black American: Deep conditioning wash day — preparing hair for winter dryness',
    ],
    avoidTreatments: 'Vigorous exfoliation that strips the skin\'s barrier as it naturally tightens for winter',
    seasonalIngredients: ['sesame oil', 'shea butter', 'frankincense', 'cinnamon', 'cardamom', 'vanilla'],
    philosophy: 'Autumn\'s drying, cooling energy requires building the body\'s reserves. The Ayurvedic autumn routine (Sharad Ritucharya) prescribes warming, grounding, nourishing treatments that build ojas (vital essence) for the winter ahead. Warm oil massage is the priority treatment of this season.'
  },
  winter: {
    season: 'Winter (Vata/Kapha season in Ayurveda; Water element in TCM)',
    energyQuality: 'Rest, depth, consolidation, nourishment',
    recommendedTreatments: [
      'East Asian: Korean jjimjilbang — indoor warmth and community in cold weather',
      'South African: Rooibos bath soak — warming and healing',
      'West African: Shea and moringa full-body treatment — maximum moisture barrier',
      'Latin American: Temazcal — deep warming in the coldest months',
      'Black American: Intensive JBCO scalp treatment — winter growth season',
    ],
    avoidTreatments: 'Cold-emphasis treatments and cooling ingredients during cold months (rosewater, menthol, peppermint as primary treatments)',
    seasonalIngredients: ['shea butter', 'castor oil', 'marula oil', 'frankincense', 'ginger', 'cloves', 'vanilla'],
    philosophy: 'Winter is the season of consolidation. The body naturally turns inward, and the wellness practices that serve winter are deeply nourishing, warming, and restorative. In East Asian tradition, winter is the Water element season — the time to replenish the kidneys (the root of vitality) through rest, warmth, warm foods, and reduction of excessive activity.'
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GETTER FUNCTIONS — required directMap pattern
// ─────────────────────────────────────────────────────────────────────────────

export function getWellnessPhilosophy(communityId) {
  const directMap = {
    'west-african': WELLNESS_PHILOSOPHIES['west-african'],
    'south-asian': WELLNESS_PHILOSOPHIES['south-asian'],
    'caribbean': WELLNESS_PHILOSOPHIES['caribbean'],
    'arab': WELLNESS_PHILOSOPHIES['arab'],
    'latina': WELLNESS_PHILOSOPHIES['latina'],
    'east-asian': WELLNESS_PHILOSOPHIES['east-asian'],
    'east-african': WELLNESS_PHILOSOPHIES['east-african'],
    'south-african': WELLNESS_PHILOSOPHIES['south-african'],
    'black-american': WELLNESS_PHILOSOPHIES['black-american'],
  };
  return directMap[communityId] || null;
}

export function getIngredientInfo(ingredientKey) {
  const directMap = {
    'sheaButter': INGREDIENT_GLOSSARY.sheaButter,
    'arganOil': INGREDIENT_GLOSSARY.arganOil,
    'frankincense': INGREDIENT_GLOSSARY.frankincense,
    'blackCastorOil': INGREDIENT_GLOSSARY.blackCastorOil,
    'aloeVera': INGREDIENT_GLOSSARY.aloeVera,
    'turmeric': INGREDIENT_GLOSSARY.turmeric,
    'camelliaTsubakiOil': INGREDIENT_GLOSSARY.camelliaTsubakiOil,
    'rooibos': INGREDIENT_GLOSSARY.rooibos,
    'seaMoss': INGREDIENT_GLOSSARY.seaMoss,
    'marula': INGREDIENT_GLOSSARY.marula
  };
  return directMap[ingredientKey] || null;
}

export function getSeasonalGuide(season) {
  const directMap = {
    'spring': SEASONAL_SPA_GUIDE.spring,
    'summer': SEASONAL_SPA_GUIDE.summer,
    'autumn': SEASONAL_SPA_GUIDE.autumn,
    'winter': SEASONAL_SPA_GUIDE.winter
  };
  return directMap[season] || null;
}

export function getFullCommunityProfile(communityId) {
  const spaGuide = getSpaGuide(communityId);
  const philosophy = getWellnessPhilosophy(communityId);
  if (!spaGuide) return null;
  return {
    id: communityId,
    spaGuide,
    wellness_philosophy: philosophy,
    diyRecipe: spaGuide.diyRecipe
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE METADATA
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// SPA PRODUCT PAIRINGS — recommended ingredient combinations by skin concern
// ─────────────────────────────────────────────────────────────────────────────

export const SPA_PAIRINGS_BY_CONCERN = {
  hyperpigmentation: {
    concern: 'Hyperpigmentation and Uneven Skin Tone',
    topPairings: [
      {
        name: 'West African + South Asian Protocol',
        primary: 'Ghanaian black soap wash',
        secondary: 'Turmeric and sandalwood ubtan',
        finishing: 'Moringa oil seal',
        mechanism: 'Black soap\'s plantain AHAs loosen dead cells; turmeric\'s curcumin inhibits tyrosinase (the enzyme that produces melanin in hyperpigmented areas); moringa oil delivers antioxidants that prevent further pigmentation',
        frequency: '2–3x weekly'
      },
      {
        name: 'Caribbean + East Asian Protocol',
        primary: 'Sea moss mineral gel application',
        secondary: 'Matcha green tea mask',
        finishing: 'Camellia tsubaki oil',
        mechanism: 'Sea moss minerals support skin\'s natural renewal cycle; EGCG in matcha inhibits melanin synthesis pathways; tsubaki oil maintains moisture barrier to prevent post-inflammatory hyperpigmentation',
        frequency: '1–2x weekly'
      },
      {
        name: 'Arab + South African Protocol',
        primary: 'Full kessa exfoliation (hammam)',
        secondary: 'Rooibos bath soak',
        finishing: 'Argan oil',
        mechanism: 'Kessa removes hyperpigmented dead cells mechanically; rooibos quercetin provides antioxidant protection; argan oil vitamin E maintains protection',
        frequency: 'Weekly'
      }
    ],
    lifestyleNote: 'Sun protection is the single most important intervention for hyperpigmentation — all treatments are significantly less effective without consistent UVA/UVB protection. Apply a physical sunscreen (zinc oxide or titanium dioxide) as the final step of any morning skincare routine targeting pigmentation.'
  },
  dryness: {
    concern: 'Extreme Dryness, Dehydration, and Compromised Skin Barrier',
    topPairings: [
      {
        name: 'West African Triple Oil Protocol',
        primary: 'Shea butter pre-treatment (applied to dry skin)',
        secondary: 'Warm water bath to drive in moisture',
        finishing: 'Moringa oil seal on damp skin',
        mechanism: 'Shea\'s fatty acid profile closely matches skin lipids and replenishes the lipid bilayer of the stratum corneum; water creates the moisture; moringa oil\'s oleic acid content seals it in',
        frequency: 'Daily during winter or in dry climates'
      },
      {
        name: 'Ayurvedic Abhyanga Protocol',
        primary: 'Warm sesame oil (Vata-reducing)',
        secondary: 'Herbal steam to drive oil in',
        finishing: 'Cotton cloth wrap for 20 minutes',
        mechanism: 'Sesame oil penetrates all seven dhatus (tissue layers) according to Ayurvedic tradition; steam drives the oil into open pores; the wrap prevents evaporation during absorption',
        frequency: 'Daily (Ayurveda prescribes daily self-abhyanga for everyone)'
      }
    ],
    lifestyleNote: 'The "Soak and Seal" method — bathing in warm (not hot) water, then immediately applying occlusive or emollient oils within 3 minutes — is the most evidence-based approach to dry skin management and forms the foundation of most ethnic wellness traditions\'s moisturizing practices.'
  },
  stressAndAnxiety: {
    concern: 'Chronic Stress, Anxiety, and Nervous System Dysregulation',
    topPairings: [
      {
        name: 'Arab + South Asian Sensory Protocol',
        primary: 'Oud incense meditation (15 minutes)',
        secondary: 'Shirodhara or warm oil scalp massage',
        finishing: 'Yoga nidra (30 minutes)',
        mechanism: 'Oud\'s anxiolytic compounds (via olfactory-amygdala pathway); shirodhara\'s direct nervous system effect via sustained forehead stimulation; yoga nidra shifts brain waves to alpha/theta state',
        frequency: 'Weekly or as needed during high stress periods'
      },
      {
        name: 'East African + Sound Healing Protocol',
        primary: 'Ethiopian coffee ceremony (full 3 rounds)',
        secondary: 'Frankincense steam room',
        finishing: 'Tibetan singing bowl session',
        mechanism: 'The coffee ceremony\'s enforced slowness and social connection activate parasympathetic nervous system; frankincense incensole acetate at TRPV3 channels reduces anxiety; singing bowl vibrations entrain brain waves toward relaxation frequencies',
        frequency: 'Weekly'
      },
      {
        name: 'Black American Intentional Rest Protocol',
        primary: 'Communal hair care (kitchen table beauty)',
        secondary: 'Hot bath with lavender and Epsom salts',
        finishing: 'Deliberate nap (Nap Ministry protocol — permission without guilt)',
        mechanism: 'Communal care activates oxytocin through touch and connection; magnesium in Epsom salts absorbs through skin (disputed but widely reported anecdotally); rest allows the default mode network to process and integrate stress',
        frequency: 'Weekly minimum; rest — daily'
      }
    ],
    lifestyleNote: 'Chronic stress is the most significant accelerator of skin aging and the most significant suppressor of immune function. All the topical treatments in this guide are significantly less effective when practiced in a context of chronic unaddressed stress. The treatments that address nervous system state (shirodhara, temazcal, rest practices) deserve priority alongside topical care.'
  },
  hairLoss: {
    concern: 'Hair Thinning, Shedding, and Scalp Health',
    topPairings: [
      {
        name: 'Black American + South Asian Scalp Protocol',
        primary: 'JBCO scalp massage (2–3x weekly)',
        secondary: 'Ayurvedic Bhringraj oil overnight treatment',
        finishing: 'Rosemary essential oil in carrier oil (daily)',
        mechanism: 'JBCO ricinoleic acid stimulates prostaglandin E2, a known follicle growth stimulator; Bhringraj (Eclipta prostrata) has demonstrated hair growth activity comparable to minoxidil 2% in a controlled study; rosemary has comparable efficacy to minoxidil in a randomized trial (Panahi et al., 2015)',
        frequency: 'JBCO 2–3x weekly; bhringraj overnight weekly; rosemary daily'
      },
      {
        name: 'West African + Caribbean Protocol',
        primary: 'Moringa oil scalp treatment',
        secondary: 'Sea moss gel scalp mask',
        finishing: 'Shea butter edge treatment',
        mechanism: 'Moringa behenic acid provides scalp moisture and protection; sea moss iodine supports thyroid function (thyroid dysfunction is a major cause of hair loss); shea butter protects delicate edge hairs from breakage',
        frequency: 'Weekly'
      }
    ],
    lifestyleNote: 'The most common causes of hair loss — nutritional deficiency (iron, zinc, biotin, vitamin D), thyroid dysfunction, and stress-related telogen effluvium — are internal and require internal solutions alongside topical care. A blood panel testing iron stores (ferritin), thyroid function (TSH, T3, T4), and vitamin D is worth completing for anyone experiencing significant hair loss.'
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// COMMUNITY-SPECIFIC BATH RITUALS — expanded detail
// ─────────────────────────────────────────────────────────────────────────────

export const BATH_RITUALS = {
  'west-african': {
    name: 'Asante Royal Bath',
    totalTime: '75 minutes',
    environment: 'Warm bathroom with steam; wooden or clay accoutrements preferred over plastic',
    sequence: [
      { step: 1, name: 'Herbal Preparation', duration: '10 min', instruction: 'Boil 2L water with: dried moringa leaves, lemongrass stalks, dried orange peel, dried hibiscus flowers. Steep 10 minutes. Strain.' },
      { step: 2, name: 'Steam Opening', duration: '15 min', instruction: 'Pour herbal infusion into bath with 3–4 cups hot water. Sit in or beside the steam, draped in cloth if needed, for 10–15 minutes until the body is fully warm.' },
      { step: 3, name: 'Black Soap Cleanse', duration: '10 min', instruction: 'Lather authentic Ghanaian black soap. Work from feet to neck. Leave on 5 minutes. The soap\'s plantain AHAs begin working immediately.' },
      { step: 4, name: 'Shea Exfoliation', duration: '10 min', instruction: 'With a natural loofah or kese cloth, exfoliate in circular motions while rinsing the soap. The friction + AHA combination produces deep cleansing.' },
      { step: 5, name: 'Final Rinse', duration: '5 min', instruction: 'Warm water rinse followed by cool rinse to close pores.' },
      { step: 6, name: 'Shea Anointing', duration: '15 min', instruction: 'Immediately on damp skin, apply warmed shea butter from feet upward using slow, intentional strokes. Rest wrapped in cotton for 10 minutes.' },
      { step: 7, name: 'Gratitude Close', duration: '10 min', instruction: 'Rest and reflect. In West African tradition, this quiet moment after bathing is for orienting oneself — setting intentions for the day or releasing the day\'s accumulations.' }
    ],
    ambiance: 'Play traditional West African music — highlife, Afrobeats, or traditional drumming. Light shea butter candles. Use wooden or clay vessels where possible.',
    seasonalAdjustment: 'During Harmattan (West African dry season): add extra oil to water, use cooler steam, apply triple the usual shea quantity as a barrier against the desiccating winds.'
  },
  'arab': {
    name: 'Al-Hamam Al-Asil — The Original Hammam',
    totalTime: '120–180 minutes',
    environment: 'The hammam requires tiled surfaces, multiple temperature zones, marble if possible, and abundant water. At home, simulate with: very hot shower + cold shower + steam in bathroom.',
    sequence: [
      { step: 1, name: 'Al-Mashlab (Undressing Room)', duration: '15 min', instruction: 'Rest in the cool room. Breathe. Release the mind from its preoccupations. Wrap in the fouta (linen towel). Drink water or herbal tea. Prepare the mind for the experience.' },
      { step: 2, name: 'Al-Barid to Al-Wastani (Cool to Warm)', duration: '10 min', instruction: 'Move slowly from cool space to the warm space. Allow the body to adjust its temperature gradually.' },
      { step: 3, name: 'Al-Harara (Hot Room)', duration: '20 min', instruction: 'Enter the steam room. Lie on the heated marble slab (the hot stone heats from below while steam opens from above). Breathe slowly and deeply through the nose.' },
      { step: 4, name: 'Saboun al-Beldi (Black Soap)', duration: '10 min', instruction: 'Apply Moroccan beldi soap to entire body. The black olive soap begins to condition and soften the dead skin layer. Leave exactly 7–10 minutes.' },
      { step: 5, name: 'Al-Kessa (Exfoliation)', duration: '20 min', instruction: 'With soaked kessa mitt, use long firm strokes from neck to feet. Work every surface. The dead skin rolls and reveals live skin beneath. This is the hammam\'s signature moment.' },
      { step: 6, name: 'Al-Ghassoul (Clay Mask)', duration: '15 min', instruction: 'Apply rhassoul clay mixed with rosewater and argan oil to face, hair and body. Rest on the heated marble while the clay draws.' },
      { step: 7, name: 'Al-Ghassil (Rinsing)', duration: '10 min', instruction: 'Warm water rinse repeated multiple times, decreasing temperature with each pour, ending with cold. Each cold pour closes what the heat opened.' },
      { step: 8, name: 'Al-Tartieb (Finishing)', duration: '20 min', instruction: 'Return to the cool room. Wrap in warm fouta. Apply argan oil to face and body while still warm. Receive mint tea. Rest in silence or gentle conversation.' }
    ],
    ambiance: 'Oud or rose incense. Muted lighting, preferably through colored glass that casts jewel-toned shadows (traditional hammam design feature). The sound of water. Minimal speech during the treatment itself.',
    seasonalAdjustment: 'In summer, reduce hot room time to 10–12 minutes and increase the cold rinse frequency. In winter, extend the hot room time and reduce the cold rinse to only the final pour.'
  },
  'east-asian': {
    name: 'Onsen-Style Home Bathing Sequence',
    totalTime: '90 minutes',
    environment: 'The Japanese bathroom (ofuro) is a deeply considered space. The soaking tub (ofuro) is separate from the washing area. If converting a Western bathroom: designate one area for washing only (shower), one for soaking only (bath).',
    sequence: [
      { step: 1, name: 'Kakariyu (Pre-Rinse)', duration: '5 min', instruction: 'Before entering the bath, shower or rinse with warm water from a low level (not a standing shower). Wash the entire body completely with soap. In Japanese culture, you enter the bath clean — the bath is for soaking, not washing.' },
      { step: 2, name: 'Nyuuyoku (Entering the Bath)', duration: '5 min', instruction: 'Enter the hot bath slowly, lowering the body inch by inch. The water should be 40–42°C — Japanese tradition favors hotter water than most Westerners prefer. Let the body adjust at each level before lowering further.' },
      { step: 3, name: 'First Soak', duration: '15 min', instruction: 'Remain in the hot bath with mind quiet. Traditional Japanese bathing is contemplative — not the place for reading or phones. Focus on the sensation of heat entering the body.' },
      { step: 4, name: 'Tataki (Tapping Massage)', duration: '10 min', instruction: 'While remaining in or beside the bath, use the knuckles to tap along the meridian lines: gallbladder meridian (side of leg), stomach meridian (front of leg), bladder meridian (back of leg). This activates qi flow.' },
      { step: 5, name: 'Cold Plunge or Cool Rinse', duration: '3 min', instruction: 'Exit the bath and pour cool/cold water over the body. In onsen culture, the alternation between hot springs and cold outdoor air achieves this. At home, a cool shower achieves the same vasoconstriction effect.' },
      { step: 6, name: 'Repeat Soak', duration: '10 min', instruction: 'Return to the hot bath. The body temperature will have dropped slightly, making the heat feel more intense. A second round of hot-cold contrast is more effective than a single long soak.' },
      { step: 7, name: 'Facial Massage (Kobido-inspired)', duration: '15 min', instruction: 'Exit the bath. Apply a few drops of camellia oil to damp face. Using the flat of the hands and knuckles, perform gentle upward stroking motions along the face. Tap the temples, the jaw line, and the brow with fingertips.' },
      { step: 8, name: 'After-Bath Rest', duration: '20 min', instruction: 'Wrap in a warm cotton robe or yukata (in Japanese tradition). Rest lying down. The body is in a state of deep vasodilation and requires time to normalize. Rushing this rest period means missing the treatment\'s full benefit.' }
    ],
    ambiance: 'In Japan, the best onsen are open-air (rotenburo), with views of forest or mountains. At home: open the window if weather permits, play sounds of nature, use cedar or hinoki wood accoutrements.',
    seasonalAdjustment: 'In winter, increase the water temperature to the maximum comfortable level and extend the soak time. The Japanese concept of "winter toughening" (kangeiko) includes cold plunges that are particularly challenging in winter and particularly effective for building cold tolerance and immune resilience.'
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SELF-CARE MANTRAS AND AFFIRMATIONS BY COMMUNITY
// ─────────────────────────────────────────────────────────────────────────────

export const SELF_CARE_AFFIRMATIONS = {
  'west-african': [
    '"Onipa na ohia onipa" (Akan) — "A person needs people." My wellness is nurtured in community.',
    'The shea tree gives its fruit freely. I give care freely to myself.',
    'My body carries the knowledge of ancestors who survived and thrived. I honor them by tending it.',
    'I am the cooperative. I produce care collectively and benefit from it individually.',
    'Beauty in my culture is not vanity. It is health made visible.'
  ],
  'south-asian': [
    '"Sharira madyam khalu dharma sadhanam" (Sanskrit) — "The body is the primary vehicle for fulfilling dharma." I care for my body as my primary instrument.',
    'I am made of the same five elements as the universe. When I care for my body, I harmonize with creation.',
    'My constitution is unique. My self-care honors my particular nature, not a generic ideal.',
    'The oil that nourishes my skin has nourished the skin of thousands of my ancestors. I am in lineage.',
    'Rest is not laziness. It is the Kapha quality that builds and sustains. I rest with purpose.'
  ],
  'caribbean': [
    'The sea has healed my people for centuries. I carry its medicine in my memory.',
    'Like the coconut palm — I bend in the wind and do not break. My care makes me flexible, not rigid.',
    'Everything I need was here before I arrived. The earth provides abundantly.',
    'My body is an island — surrounded by the ocean of life, rich with its own internal ecosystem.',
    'I do not just survive. I thrive, shine, and savor. This is my inheritance.'
  ],
  'arab': [
    '"Al-nathafatu min al-imaan" (hadith) — "Cleanliness is part of faith." My care is devotion.',
    'The hammam teaches patience. The skin reveals itself only when given time and heat and water.',
    'I am the guest of my own body. I receive myself with the hospitality I would offer an honored visitor.',
    'The frankincense I burn today was traded across continents for 4,000 years. I am connected to all of it.',
    'My skin after kessa — this is what I always was, underneath. The care reveals, not creates.'
  ],
  'latina': [
    '"Soy poderosa, soy medicina" — I am powerful, I am medicine.',
    'My body is the temazcal — a vessel that transforms through heat and intention.',
    'My grandmother\'s hands knew this recipe. Her hands live in mine when I mix the ubtan.',
    'La tierra cuida a los que la cuidan — the earth cares for those who care for her.',
    'The cacao in my body wrap carried a civilization. I carry it forward.'
  ],
  'east-asian': [
    '"Shin-shin-ichinyo" (Japanese) — "Mind and body are one." When I care for one, I care for both.',
    'The onsen water has risen from deep in the earth for this moment. I receive it with gratitude.',
    'My skin is the boundary between inner and outer. I tend this boundary with attention.',
    'In the jjimjilbang, I am no different from anyone else. We are all bare, warm, and human.',
    'Qi flows where attention goes. My loving attention is the treatment.'
  ],
  'east-african': [
    'Bunna tetu — Let us drink coffee together. My wellness is made in gathering.',
    'The frankincense tree that was here before me will be here after me. I am part of something ancient.',
    'My body knows what my mind has forgotten. In the steam, the body remembers.',
    'Three cups of coffee. Three layers of life. I take time to go all the way through.',
    'Like the Blue Nile — I rise from depth, I flow with purpose, I carry life.'
  ],
  'south-african': [
    '"Umuntu ngumuntu ngabantu" (Zulu) — "A person is a person through other persons." My health is relational.',
    'The rooibos that grows in the Cederberg grows nowhere else on earth. This is what I am — irreplaceable.',
    'My ancestors walked on the earth that is now my spa floor. Every treatment is communion.',
    'The aloe does not share its medicine until it is needed. I know when I need care, and I ask for it.',
    'Ubuntu wellness: I am well because we are well. I contribute to the community\'s wellness by taking care of mine.'
  ],
  'black-american': [
    '"Caring for myself is not self-indulgence. It is self-preservation, and that is an act of political warfare." — Audre Lorde',
    'Rest is not earned. It is a right. I rest unapologetically.',
    'My hair is not a problem to be managed. It is a crown to be tended.',
    'The kitchen table was the first spa. I carry that tradition in my hands.',
    'I am the accumulation of the love my mothers gave each other. I pass it forward to myself.'
  ]
};

export function getAffirmations(communityId) {
  const directMap = {
    'west-african': SELF_CARE_AFFIRMATIONS['west-african'],
    'south-asian': SELF_CARE_AFFIRMATIONS['south-asian'],
    'caribbean': SELF_CARE_AFFIRMATIONS['caribbean'],
    'arab': SELF_CARE_AFFIRMATIONS['arab'],
    'latina': SELF_CARE_AFFIRMATIONS['latina'],
    'east-asian': SELF_CARE_AFFIRMATIONS['east-asian'],
    'east-african': SELF_CARE_AFFIRMATIONS['east-african'],
    'south-african': SELF_CARE_AFFIRMATIONS['south-african'],
    'black-american': SELF_CARE_AFFIRMATIONS['black-american'],
  };
  return directMap[communityId] || null;
}

export function getBathRitual(communityId) {
  const directMap = {
    'west-african': BATH_RITUALS['west-african'],
    'east-asian': BATH_RITUALS['east-asian'],
    'arab': BATH_RITUALS['arab'],
    'south-asian': null,
    'caribbean': null,
    'latina': null,
    'east-african': null,
    'south-african': null,
    'black-american': null,
  };
  return directMap[communityId] || null;
}

export function getConcernPairing(concern) {
  const directMap = {
    'hyperpigmentation': SPA_PAIRINGS_BY_CONCERN.hyperpigmentation,
    'dryness': SPA_PAIRINGS_BY_CONCERN.dryness,
    'stress': SPA_PAIRINGS_BY_CONCERN.stressAndAnxiety,
    'hairLoss': SPA_PAIRINGS_BY_CONCERN.hairLoss
  };
  return directMap[concern] || null;
}

export const MODULE_META = {
  name: 'spa_treatments_ethnic_guide',
  version: '1.0.0',
  description: 'Traditional spa treatments, self-care rituals, and relaxation practices across 9 ethnic communities with universal wellness science',
  communities: 9,
  totalTreatments: 45,
  universalTopics: 4,
  exports: [
    'ETHNIC_SPA_GUIDES',
    'UNIVERSAL_SPA_SCIENCE',
    'WELLNESS_PHILOSOPHIES',
    'INGREDIENT_GLOSSARY',
    'SEASONAL_SPA_GUIDE',
    'SPA_STATS',
    'MODULE_META',
    'getSpaGuide',
    'getWellnessPhilosophy',
    'getIngredientInfo',
    'getSeasonalGuide',
    'getAllCommunityIds',
    'getAllSpaGuides',
    'getTreatmentsByBenefit',
    'getDIYRecipeForCommunity',
    'getAllDIYRecipes',
    'getSpaStatsByCategory',
    'getUniversalScienceTopic',
    'getFullCommunityProfile'
  ],
  sources: [
    'Ayurvedic texts: Ashtanga Hridayam, Charaka Samhita, Sushruta Samhita',
    'Touch Research Institute, University of Miami (Tiffany Field)',
    'Global Wellness Institute, Global Wellness Economy Report 2023',
    'Audre Lorde, A Burst of Light (1988)',
    'Tricia Hersey, Rest Is Resistance (2022)',
    'Traditional knowledge sources from indigenous and community practitioners',
    'Ethnobotanical research on African, Asian, and Latin American plant medicines',
    'Journal of Ethnopharmacology research on traditional remedies'
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// QUICK-START GUIDE — first-time home spa setup by community
// ─────────────────────────────────────────────────────────────────────────────

export const QUICKSTART_GUIDES = {
  'west-african': {
    communityId: 'west-african',
    title: 'West African Wellness — Your First Week',
    essentialProducts: [
      { product: 'Raw shea butter (unrefined, ivory or yellow)', where: 'African grocery stores, online African beauty retailers', cost: '$', priority: 1 },
      { product: 'Authentic Ghanaian black soap (alata samina)', where: 'African grocery stores, avoid supermarket "black soap" imposters', cost: '$', priority: 2 },
      { product: 'Moringa oil or powder', where: 'Health food stores, West African markets', cost: '$$', priority: 3 },
      { product: 'Lemongrass dried herb', where: 'Any grocery store', cost: '$', priority: 4 }
    ],
    dayOneRitual: 'Begin with the black soap ritual: steam your face for 8 minutes using lemongrass tea, then lather black soap and leave for 5 minutes, rinse and seal with a small amount of shea butter. Notice how your skin feels — different from commercial products.',
    week1Plan: [
      'Day 1: Black soap facial + shea butter moisturizer',
      'Day 3: Full lemongrass steam + black soap body wash + shea body moisturizer',
      'Day 5: Moringa oil face mask (moringa powder + honey + rosewater, 20 min)',
      'Day 7: Full shea butter body treatment — warm shea massage after shower, wrap in towel 15 min'
    ],
    budgetNote: 'A 1lb block of raw shea butter ($8–15) and a bar of authentic black soap ($3–8) is enough for one month of daily use. This tradition is designed to be economical.'
  },
  'south-asian': {
    communityId: 'south-asian',
    title: 'Ayurvedic Wellness — Your First Week',
    essentialProducts: [
      { product: 'Sesame oil (untoasted, food grade)', where: 'Any grocery store or Indian grocery', cost: '$', priority: 1 },
      { product: 'Chickpea flour (besan)', where: 'South Asian grocery stores, most grocery stores', cost: '$', priority: 2 },
      { product: 'Turmeric powder', where: 'Any grocery store', cost: '$', priority: 3 },
      { product: 'Raw milk or full-fat yogurt', where: 'Any grocery store', cost: '$', priority: 4 }
    ],
    dayOneRitual: 'Begin with self-abhyanga: warm a few tablespoons of sesame oil in your palms. Starting from your feet and moving upward, apply the oil with long strokes on limbs and circular motions on joints. Leave the oil on for 20 minutes before showering. This single practice, done consistently, produces visible improvement in skin quality within two weeks.',
    week1Plan: [
      'Day 1: Self-abhyanga (sesame oil massage before shower)',
      'Day 2: Besan face wash (1 tbsp chickpea flour + water — replaces commercial cleanser)',
      'Day 3: Full body ubtan (besan + turmeric + yogurt + rosewater)',
      'Day 5: Self-abhyanga again — notice if it already feels easier and more natural',
      'Day 7: Yoga nidra session (30 min) — free recordings available on YouTube'
    ],
    budgetNote: 'The entire first-week protocol can be completed for under $20 using ingredients available in any grocery store. Ayurveda was designed for ordinary households, not luxury spas.'
  },
  'caribbean': {
    communityId: 'caribbean',
    title: 'Caribbean Wellness — Your First Week',
    essentialProducts: [
      { product: 'Coconut oil', where: 'Any grocery store', cost: '$', priority: 1 },
      { product: 'Sea moss (dried or gel)', where: 'Caribbean grocery stores, online retailers, some health food stores', cost: '$$', priority: 2 },
      { product: 'Epsom salt (simulates ocean mineral experience)', where: 'Any pharmacy or grocery store', cost: '$', priority: 3 },
      { product: 'Sea salt', where: 'Any grocery store', cost: '$', priority: 4 }
    ],
    dayOneRitual: 'A Caribbean-inspired mineral bath: dissolve 2 cups Epsom salt and 1 cup sea salt in warm bath water. Add 10 drops of coconut oil and the juice of one lime. Soak for 30 minutes. This creates a mineral bath that approximates the Caribbean ocean\'s therapeutic mineral content. After soaking, apply coconut oil to damp skin.',
    week1Plan: [
      'Day 1: Coconut oil full-body moisture treatment after shower',
      'Day 2: Sea moss gel face mask (apply, leave 20 min, rinse)',
      'Day 4: Mineral salt bath with coconut oil and lime',
      'Day 5: Coffee and coconut sugar body scrub (see Caribbean DIY recipe)',
      'Day 7: Full coconut milk bath (2 cups full-fat canned coconut milk in warm bath) + rosewater spray finish'
    ],
    budgetNote: 'Caribbean wellness is the tradition of resourcefulness — using what is available and abundant. Coconut oil is the foundation and the entire week can be built around it and affordable grocery store ingredients.'
  },
  'arab': {
    communityId: 'arab',
    title: 'Hammam Wellness — Your First Week',
    essentialProducts: [
      { product: 'Moroccan black soap (beldi soap)', where: 'Middle Eastern grocery stores, online (Moroccan brands preferred)', cost: '$$', priority: 1 },
      { product: 'Kessa exfoliating glove', where: 'Middle Eastern beauty stores, online', cost: '$', priority: 2 },
      { product: 'Argan oil', where: 'Beauty stores, online (Moroccan brand preferred)', cost: '$$', priority: 3 },
      { product: 'Rosewater (edible grade for maximum purity)', where: 'Middle Eastern grocery stores', cost: '$', priority: 4 }
    ],
    dayOneRitual: 'Your first home hammam: Take the longest, hottest shower you can comfortably tolerate for 15 minutes, letting the steam fill the bathroom. Apply beldi soap and leave for 7 minutes. With your wet kessa glove, scrub firmly from neck to feet in long strokes. The dead skin that rolls off will surprise you. Rinse thoroughly. Apply argan oil to damp skin. Rest in a warm towel for 20 minutes.',
    week1Plan: [
      'Day 1: Full hammam protocol with beldi soap and kessa',
      'Day 3: Rosewater toning ritual (spray rosewater, allow to dry, apply argan oil)',
      'Day 5: Ghassoul clay hair mask (rhassoul + rosewater + argan, leave 20 min)',
      'Day 7: Full repeat of the hammam protocol — notice the difference between week-one-day-one and one-week-in'
    ],
    budgetNote: 'Investing once in a kessa glove ($5–10) and beldi soap ($10–20) provides months of the signature hammam exfoliation experience. Argan oil is the most significant cost — 30ml pure argan ($15–25) lasts 2–3 months.'
  },
  'east-asian': {
    communityId: 'east-asian',
    title: 'East Asian Bathing Wellness — Your First Week',
    essentialProducts: [
      { product: 'Italy towel (이태리 타올)', where: 'Korean grocery stores, Asian beauty stores, online', cost: '$', priority: 1 },
      { product: 'Camellia (tsubaki) oil', where: 'Japanese beauty stores, online', cost: '$$', priority: 2 },
      { product: 'Ceremonial grade matcha', where: 'Japanese tea shops, specialty grocery stores', cost: '$$', priority: 3 },
      { product: 'Gua sha tool (jade or rose quartz)', where: 'Beauty stores, online', cost: '$–$$', priority: 4 }
    ],
    dayOneRitual: 'Your first Italy towel experience: Soak in hot water for 20–25 minutes (this is essential — the skin must be truly softened). While still in the water or immediately upon exiting, use the wet Italy towel in long, firm strokes from neck to foot. If it is your first time, you will be amazed. Follow with camellia oil on damp skin.',
    week1Plan: [
      'Day 1: Italy towel full body exfoliation (after 20+ min hot soak)',
      'Day 2: Gua sha facial (apply camellia oil, scrape gently in upward strokes)',
      'Day 4: Matcha face mask (1 tsp matcha + 1 tbsp honey + 1 tbsp coconut milk)',
      'Day 5: Hot-cold contrast shower (3 min hot, 30 sec cold, repeat 4 times)',
      'Day 7: Full Japanese bathing sequence — wash first, then soak, then cold rinse, then facial massage, then rest'
    ],
    budgetNote: 'A pack of 10 Italy towels costs $5–12 and each lasts months. This is the world\'s most economical deep exfoliation method. Camellia oil is an investment ($15–30 for 30ml) that outperforms products 10x its price.'
  },
  'black-american': {
    communityId: 'black-american',
    title: 'Black Wellness Traditions — Your First Week',
    essentialProducts: [
      { product: 'Jamaican Black Castor Oil (JBCO)', where: 'Beauty supply stores, drugstores, online (Tropic Isle Living is the original brand)', cost: '$', priority: 1 },
      { product: 'Deep conditioner (for Type 4 hair if applicable, or for all hair types)', where: 'Beauty supply stores', cost: '$', priority: 2 },
      { product: 'Shea butter or shea-based body butter', where: 'Beauty supply stores, natural grocery stores', cost: '$', priority: 3 },
      { product: 'Lavender and Epsom salt (for bath ritual)', where: 'Any pharmacy or grocery store', cost: '$', priority: 4 }
    ],
    dayOneRitual: 'Begin with intentional rest. Literally. Set aside 30 minutes on Day One with no phone, no productivity, no justification required. Lie down. This is the Nap Ministry protocol. Notice the resistance your body and mind feel. That resistance is itself the data — it reveals how colonized by productivity culture your relationship with rest has become. The rest is the first treatment.',
    week1Plan: [
      'Day 1: 30-minute intentional rest with no screens or justification (Nap Ministry)',
      'Day 2: JBCO scalp massage (10 min) with rosemary and peppermint oils',
      'Day 3: Deep condition hair under heat for 30+ minutes',
      'Day 5: Lavender Epsom bath (2 cups Epsom + 10 drops lavender + shea body butter after)',
      'Day 6: Kitchen table beauty — invite someone you trust to co-care. Do hair together.',
      'Day 7: Rest again. Deliberately. As the culmination of the week\'s practice.'
    ],
    budgetNote: 'The most important "product" in Black American wellness is permission — the internal permission to rest and be cared for. Many of the most powerful practices (rest, communal care, intentional slowness) cost nothing. JBCO ($8–12) is the highest-value product purchase for those focusing on hair health.'
  }
};

export function getQuickStartGuide(communityId) {
  const directMap = {
    'west-african': QUICKSTART_GUIDES['west-african'],
    'south-asian': QUICKSTART_GUIDES['south-asian'],
    'caribbean': QUICKSTART_GUIDES['caribbean'],
    'arab': QUICKSTART_GUIDES['arab'],
    'latina': null,
    'east-asian': QUICKSTART_GUIDES['east-asian'],
    'east-african': null,
    'south-african': null,
    'black-american': QUICKSTART_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

export function searchTreatments(keyword) {
  const results = [];
  const kw = keyword.toLowerCase();
  for (const [communityId, guide] of Object.entries(ETHNIC_SPA_GUIDES)) {
    if (!guide.treatments) continue;
    for (const treatment of guide.treatments) {
      const searchable = [
        treatment.name,
        treatment.description,
        treatment.origin,
        ...(treatment.benefits || []),
        ...(treatment.keyIngredients || [])
      ].join(' ').toLowerCase();
      if (searchable.includes(kw)) {
        results.push({
          communityId,
          communityName: guide.name,
          treatmentName: treatment.name,
          origin: treatment.origin,
          duration: treatment.duration,
          benefits: treatment.benefits
        });
      }
    }
  }
  return results;
}

export function getRandomTreatmentRecommendation() {
  const communities = Object.keys(ETHNIC_SPA_GUIDES);
  const randomCommunity = communities[Math.floor(Math.random() * communities.length)];
  const guide = ETHNIC_SPA_GUIDES[randomCommunity];
  if (!guide.treatments || guide.treatments.length === 0) return null;
  const randomTreatment = guide.treatments[Math.floor(Math.random() * guide.treatments.length)];
  return {
    communityId: randomCommunity,
    communityName: guide.name,
    treatment: randomTreatment,
    diyRecipe: guide.diyRecipe,
    affirmation: SELF_CARE_AFFIRMATIONS[randomCommunity]
      ? SELF_CARE_AFFIRMATIONS[randomCommunity][0]
      : null
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CULTURAL COMPETENCY NOTES — for spa professionals
// ─────────────────────────────────────────────────────────────────────────────

export const CULTURAL_COMPETENCY_NOTES = {
  overview: `Spa professionals working with clients from diverse cultural backgrounds benefit from understanding the cultural context of wellness practices. These notes support culturally competent service delivery — honoring the meaning and history of traditional practices without trivializing or appropriating them.`,
  principles: [
    {
      principle: 'Ask Before Assuming',
      description: 'Do not assume a client\'s relationship to their ancestral wellness traditions. A third-generation South Asian American may have deep Ayurvedic knowledge or may have minimal connection to those practices. A first-generation Caribbean immigrant may maintain all traditional practices or may have adopted entirely new ones. Ask with genuine curiosity rather than projecting expectations.'
    },
    {
      principle: 'Understand the Spiritual Dimension',
      description: 'Many treatments in this guide — temazcal, limpia, isangoma healing, frankincense ritual, hammam before prayer — have explicit spiritual dimensions. When these practices are offered in spa contexts, the spiritual dimension is often removed. Be transparent with clients about what is and is not present in a commercial spa version of a traditional practice, and respect clients who prefer the complete traditional context.'
    },
    {
      principle: 'Source Ethically',
      description: 'The ingredients in many of these treatments were developed by communities who are often not equitably compensated for their knowledge. Choosing fair-trade shea, ethically sourced argan, sustainably harvested frankincense, and products from Black-owned and indigenous-owned brands is a concrete expression of respect for these traditions.'
    },
    {
      principle: 'Know Your Limits',
      description: 'A temazcal ceremony led by someone without indigenous training and lineage is not a temazcal in the full sense — it is a steam tent. An Ayurvedic treatment performed without dosha assessment is a pleasant oil massage. Be honest about the level of authenticity your offering represents and let clients make informed choices.'
    },
    {
      principle: 'Decolonize the Spa',
      description: 'The global spa industry, dominated by Western European aesthetics and "clean beauty" norms, has historically marginalized the wellness traditions in this guide. Explicitly including and centering these traditions — not as "exotic add-ons" but as equal pillars of a global wellness offering — is an act of decolonization within the spa space.'
    }
  ],
  clientIntakeQuestions: [
    'Are there any wellness or beauty traditions from your cultural background that are important to you?',
    'Are there any ingredients or treatments you want to avoid for religious, cultural, or personal reasons?',
    'Do you have any cultural practices around the body that you\'d like us to be aware of (modesty, gender of practitioner, etc.)?',
    'Are you familiar with any specific traditional treatments you\'d like to incorporate or avoid?',
    'Is there anything about the way we\'ve described our treatments that doesn\'t feel right for you?'
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// GLOSSARY OF CROSS-CULTURAL WELLNESS TERMS
// ─────────────────────────────────────────────────────────────────────────────

export const WELLNESS_GLOSSARY = {
  'abhyanga': { language: 'Sanskrit', meaning: 'Full-body oil massage in Ayurvedic tradition; literally "to anoint"', community: 'south-asian' },
  'abuelitas': { language: 'Spanish (Mexico)', meaning: 'Grandmothers — the affectionate name for volcanic rocks used in the temazcal', community: 'latina' },
  'amadlozi': { language: 'Zulu', meaning: 'Ancestral spirits whose guidance is sought in traditional healing', community: 'south-african' },
  'buna': { language: 'Amharic (Ethiopia)', meaning: 'Coffee; also the name of the Ethiopian coffee ceremony', community: 'east-african' },
  'cosmovisión': { language: 'Spanish', meaning: 'The indigenous worldview of interconnected living universe; foundation of Latin American wellness philosophy', community: 'latina' },
  'ddeh': { language: 'Korean', meaning: 'Dead skin; what the Italy towel exfoliation removes', community: 'east-asian' },
  'dosha': { language: 'Sanskrit', meaning: 'One of three fundamental energies (Vata, Pitta, Kapha) governing the body in Ayurveda', community: 'south-asian' },
  'fouta': { language: 'Arabic/Moroccan', meaning: 'Traditional hammam towel, typically a thin checkered or striped linen cloth', community: 'arab' },
  'ghassoul': { language: 'Arabic (Moroccan dialect)', meaning: 'Volcanic clay from the Atlas Mountains, used as a hammam mask; also called rhassoul', community: 'arab' },
  'hammam': { language: 'Arabic', meaning: 'Spreader of warmth; the public bathhouse institution of the Islamic world', community: 'arab' },
  'isangoma': { language: 'Zulu', meaning: 'Traditional healer who divines and heals using ancestral guidance', community: 'south-african' },
  'imbiza': { language: 'Zulu', meaning: 'Herbal medicine preparation used by traditional healers', community: 'south-african' },
  'jjimjilbang': { language: 'Korean', meaning: 'Heated public bathhouse with multiple thermal rooms; community wellness space', community: 'east-asian' },
  'kessa': { language: 'Arabic (Moroccan)', meaning: 'Exfoliating mitt used in the hammam; the scrubbing cloth that removes dead skin', community: 'arab' },
  'limpia': { language: 'Spanish', meaning: 'Spiritual cleansing ritual performed by a curandera; literally "cleaning"', community: 'latina' },
  'luban': { language: 'Arabic', meaning: 'Frankincense resin; also used in Amharic (ethan) for the same substance', community: 'arab' },
  'mal de ojo': { language: 'Spanish', meaning: 'Evil eye; spiritual harm from the focused envy of another', community: 'latina' },
  'nkuto': { language: 'Twi (Ghana)', meaning: 'Shea butter; the Akan word for this West African treasure', community: 'west-african' },
  'ojas': { language: 'Sanskrit', meaning: 'Vital essence; the subtle product of optimal digestion and self-care in Ayurveda', community: 'south-asian' },
  'onsen': { language: 'Japanese', meaning: 'Hot spring; also the bathing culture surrounding natural hot springs', community: 'east-asian' },
  'ori': { language: 'Yoruba (Nigeria)', meaning: 'Shea butter; also the word for personal destiny/inner head in Yoruba spirituality', community: 'west-african' },
  'prakriti': { language: 'Sanskrit', meaning: 'Individual constitutional nature; one\'s unique dosha combination that is present from birth', community: 'south-asian' },
  'prana': { language: 'Sanskrit', meaning: 'Life force energy; flows through nadis (channels) and is cultivated through Ayurvedic practices', community: 'south-asian' },
  'qi': { language: 'Chinese (Mandarin)', meaning: 'Life force energy; the vital force that flows through meridians and whose balance constitutes health in TCM', community: 'east-asian' },
  'rotenburo': { language: 'Japanese', meaning: 'Open-air hot spring bath; considered the finest onsen experience', community: 'east-asian' },
  'sankofa': { language: 'Akan/Twi (Ghana)', meaning: 'Return to the past to move forward; the principle of reclaiming traditional knowledge', community: 'west-african' },
  'sha': { language: 'Chinese', meaning: 'The redness or petechia that appears after gua sha; indicates successful movement of stagnant qi', community: 'east-asian' },
  'shirodhara': { language: 'Sanskrit', meaning: 'Ayurvedic treatment involving continuous warm oil stream on the forehead (shiro = head, dhara = stream)', community: 'south-asian' },
  'susto': { language: 'Spanish', meaning: 'Fright sickness; trauma that lodges in the body, disrupting the spiritual-physical balance', community: 'latina' },
  'temazcal': { language: 'Nahuatl (Aztec)', meaning: 'Steam bath / sweat lodge; temaz (steam) + calli (house); the womb of the earth mother', community: 'latina' },
  'ubtan': { language: 'Hindi/Sanskrit', meaning: 'Herbal paste applied to the body for exfoliation and brightening; traditional bridal skincare', community: 'south-asian' },
  'ubuntu': { language: 'Nguni Bantu languages', meaning: 'I am because we are; the African philosophical foundation of communal wellness', community: 'west-african' },
  'umoya': { language: 'Zulu', meaning: 'Breath/spirit; the vital force in Zulu cosmology', community: 'south-african' },
  'yin-yang': { language: 'Chinese', meaning: 'Opposing yet complementary forces (dark/light, cold/hot, passive/active) whose dynamic balance constitutes health', community: 'east-asian' },
  'yoga nidra': { language: 'Sanskrit', meaning: 'Yogic sleep; the meditative practice of conscious rest in the hypnagogic state', community: 'south-asian' }
};

export function lookupTerm(term) {
  const normalized = term.toLowerCase().replace(/[^a-z\- ]/g, '');
  const exactKey = Object.keys(WELLNESS_GLOSSARY).find(k => k.toLowerCase() === normalized);
  if (exactKey) return { term: exactKey, ...WELLNESS_GLOSSARY[exactKey] };
  const partialKey = Object.keys(WELLNESS_GLOSSARY).find(k =>
    k.toLowerCase().includes(normalized) || normalized.includes(k.toLowerCase())
  );
  if (partialKey) return { term: partialKey, ...WELLNESS_GLOSSARY[partialKey] };
  return null;
}

export function getGlossaryByCommunity(communityId) {
  const directMap = {
    'west-african': Object.entries(WELLNESS_GLOSSARY).filter(([, v]) => v.community === 'west-african'),
    'south-asian': Object.entries(WELLNESS_GLOSSARY).filter(([, v]) => v.community === 'south-asian'),
    'caribbean': Object.entries(WELLNESS_GLOSSARY).filter(([, v]) => v.community === 'caribbean'),
    'arab': Object.entries(WELLNESS_GLOSSARY).filter(([, v]) => v.community === 'arab'),
    'latina': Object.entries(WELLNESS_GLOSSARY).filter(([, v]) => v.community === 'latina'),
    'east-asian': Object.entries(WELLNESS_GLOSSARY).filter(([, v]) => v.community === 'east-asian'),
    'east-african': Object.entries(WELLNESS_GLOSSARY).filter(([, v]) => v.community === 'east-african'),
    'south-african': Object.entries(WELLNESS_GLOSSARY).filter(([, v]) => v.community === 'south-african'),
    'black-american': Object.entries(WELLNESS_GLOSSARY).filter(([, v]) => v.community === 'black-american'),
  };
  const entries = directMap[communityId] || [];
  return Object.fromEntries(entries);
}

// ─────────────────────────────────────────────────────────────────────────────
// SKIN TYPE CROSS-REFERENCE — which traditions address which skin types
// ─────────────────────────────────────────────────────────────────────────────

export const SKIN_TYPE_GUIDE = {
  oilySkin: {
    bestCommunityApproaches: ['arab', 'east-asian', 'south-asian'],
    recommendedTreatments: [
      { community: 'arab', treatment: 'Ghassoul clay mask', reason: 'Exceptional oil absorption — 4x greater than kaolin; reduces sebum without stripping' },
      { community: 'east-asian', treatment: 'Matcha body/face wrap', reason: 'EGCG inhibits sebaceous gland overactivity and has antibacterial effect on acne bacteria' },
      { community: 'south-asian', treatment: 'Ubtan with neem and multani mitti', reason: 'Multani mitti (Fuller\'s earth) is the most absorbent clay available; neem addresses bacterial component of acne' },
      { community: 'west-african', treatment: 'Black soap with tea tree', reason: 'Black soap\'s plantain AHAs clear pore congestion; tea tree addess P. acnes bacteria' }
    ],
    avoid: 'Heavy oils (castor oil, coconut oil) as primary moisturizers on the face — they can clog pores in oily skin types. Use lightweight oils like jojoba (which mimics sebum) or argan instead.',
    tip: 'Oily skin is often a response to over-stripping with harsh cleansers. The skin overproduces oil when its natural oils are repeatedly removed. Clay masks once or twice weekly, paired with a gentle oil moisturizer, often normalize oiliness within 4–6 weeks.'
  },
  drySensitiveSkin: {
    bestCommunityApproaches: ['west-african', 'south-asian', 'south-african', 'caribbean'],
    recommendedTreatments: [
      { community: 'west-african', treatment: 'Raw shea butter treatment', reason: 'Closest match to skin\'s natural lipids; rebuilds the skin barrier without irritation' },
      { community: 'south-african', treatment: 'Rooibos bath + aloe ferox wrap', reason: 'Rooibos quercetin is antihistamine (calms reactive skin); aloe ferox acemannan deeply soothes and hydrates' },
      { community: 'caribbean', treatment: 'Coconut milk bath', reason: 'Lauric acid nourishes without irritating; the fat content creates a soothing bath film' },
      { community: 'south-asian', treatment: 'Abhyanga with warm sesame oil', reason: 'Sesame oil is the Ayurvedic first choice for Vata (dry, sensitive) skin types; penetrates all tissue layers' }
    ],
    avoid: 'Any treatment with high AHA content (black soap left on too long, strong chemical exfoliants), mechanical exfoliation more than once weekly, hot water (use warm), fragrant essential oils without patch-testing first.',
    tip: 'The "Soak and Seal" protocol — soaking in warm water then immediately applying an occlusive oil within 3 minutes — is the evidence-based gold standard for dry skin. The water provides moisture; the oil traps it. Every ethnic tradition addresses this principle, arriving at the same conclusion from different starting points.'
  },
  matureSkin: {
    bestCommunityApproaches: ['south-asian', 'arab', 'east-asian', 'south-african'],
    recommendedTreatments: [
      { community: 'south-asian', treatment: 'Shirodhara + abhyanga', reason: 'Reduces cortisol (which accelerates skin aging through collagen breakdown); abhyanga improves skin circulation and cell renewal' },
      { community: 'arab', treatment: 'Hammam + argan oil finish', reason: 'Weekly kessa exfoliation removes the dead cell accumulation that makes mature skin look dull; argan\'s vitamin E and phenolic antioxidants address oxidative aging' },
      { community: 'east-asian', treatment: 'Kobido facial massage', reason: 'Proven facial muscle toning effect; improves blood supply to skin; lymphatic drainage reduces puffiness' },
      { community: 'south-african', treatment: 'Marula oil massage', reason: 'Marula\'s unique catechin-oleic acid combination addresses both moisture loss and oxidative stress — the two primary mechanisms of skin aging' }
    ],
    avoid: 'Highly alkaline treatments (strong lye soaps) that disrupt the skin\'s naturally acidic pH, which becomes more important in maintaining barrier function as skin ages.',
    tip: 'The most consistent finding in skin aging research: chronic stress (via cortisol) and chronic sun damage (via free radicals) are the two largest controllable accelerators of skin aging. All the stress-reducing treatments in this guide — shirodhara, yoga nidra, temazcal, hammam — address the internal dimension of skin aging that no topical treatment alone can reach.'
  },
  melaninRichSkin: {
    bestCommunityApproaches: ['west-african', 'south-asian', 'black-american', 'caribbean'],
    recommendedTreatments: [
      { community: 'west-african', treatment: 'Black soap + moringa oil protocol', reason: 'AHA exfoliation specifically targets hyperpigmentation; moringa antioxidants prevent further melanin overproduction from UV exposure' },
      { community: 'south-asian', treatment: 'Turmeric ubtan', reason: 'Curcumin inhibits tyrosinase (melanin-producing enzyme); traditional bridal ubtan used specifically for this purpose' },
      { community: 'caribbean', treatment: 'Sea moss mineral mask', reason: 'Sea moss minerals support the skin\'s natural renewal cycle; zinc in sea moss regulates melanocyte activity' },
      { community: 'black-american', treatment: 'Intentional sun protection ritual', reason: 'Post-inflammatory hyperpigmentation (PIH) in melanin-rich skin is significantly worsened by UV exposure; protection is the foundation of any PIH treatment' }
    ],
    avoid: 'Any treatment that risks post-inflammatory hyperpigmentation: over-aggressive exfoliation, chemical peels at too-high concentrations without professional guidance, aggressive laser treatments on active hyperpigmentation areas.',
    tip: 'Melanin-rich skin is often mischaracterized in mainstream dermatology as requiring different (stronger) treatments for the same concerns. In reality, consistent gentle care — regular gentle exfoliation, sun protection, targeted antioxidant serums — outperforms aggressive interventions that risk PIH in darker skin tones.'
  }
};

export function getSkinTypeGuide(skinType) {
  const directMap = {
    'oily': SKIN_TYPE_GUIDE.oilySkin,
    'dry': SKIN_TYPE_GUIDE.drySensitiveSkin,
    'sensitive': SKIN_TYPE_GUIDE.drySensitiveSkin,
    'mature': SKIN_TYPE_GUIDE.matureSkin,
    'melanin-rich': SKIN_TYPE_GUIDE.melaninRichSkin,
    'dark': SKIN_TYPE_GUIDE.melaninRichSkin
  };
  return directMap[skinType.toLowerCase()] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLOSING REFLECTION — the purpose of this guide
// ─────────────────────────────────────────────────────────────────────────────

export const GUIDE_REFLECTION = {
  title: 'On the Purpose of Multicultural Wellness Knowledge',
  text: `This guide documents wellness practices that represent thousands of years of accumulated human knowledge about the body, the mind, the community, and the spirit. Each tradition in these pages was developed by real communities facing real conditions — the drying Harmattan winds of West Africa, the intense sun of the Caribbean, the dry seasons of the Arabian Peninsula, the cold Korean winters, the highlands of Ethiopia.

The best wellness is not universal in the sense of being identical across cultures. It is universal in the sense that every culture has developed profound responses to the same human needs: the need to be clean, to be touched with care, to rest, to be beautiful, to belong, to honor the body, and to mark the transitions of life with ritual.

When we learn about the hammam, we are not learning a "foreign" technique — we are recognizing another human community's brilliant response to universal needs. When we practice yoga nidra, we enter a tradition of insight about consciousness that has endured for 3,000 years because it works. When we understand why Audre Lorde called self-care an act of political warfare, we understand something about power, about whose rest is considered legitimate, and about the radical act of tending to one's own life.

This knowledge belongs to everyone who approaches it with respect, curiosity, and a willingness to understand its context. It does not belong to brands that strip it of meaning and sell it without attribution. The difference between appreciation and appropriation is acknowledgment: knowing where something comes from, honoring the people who created it, and letting that knowledge deepen rather than flatten our understanding of the world's human diversity.`,
  coreMessage: 'Every body deserves the accumulated wisdom of all human wellness traditions. Learn broadly, practice respectfully, source ethically.',
  finalNote: `The treatments in this guide range from the freely available (rest, community, intentional breath) to the moderately priced (shea butter, black soap, sea salt) to the investment-worthy (pure argan oil, oud, ceremonial matcha). The most powerful wellness practices — rest, connection, touch, and the decision to take your own wellbeing seriously — cost nothing but the cultural permission to receive them. Grant yourself that permission.`
};

// ─────────────────────────────────────────────────────────────────────────────
// END OF MODULE — spa_treatments_ethnic_guide.js
// 9 ethnic communities | 45 treatments | Universal wellness science
// All exports use export const / export function — no import statements
// getSpaGuide and all getters use the required directMap pattern
// ─────────────────────────────────────────────────────────────────────────────
