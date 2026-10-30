/**
 * Mental Health & Beauty: Ethnic Community Guides
 * Covers the intersection of beauty rituals, self-care, and mental wellbeing
 * across nine ethnic communities — grounded in cultural practice, neuroscience,
 * and the political reality of beauty standards.
 *
 * No imports or requires. Pure ES module exports only.
 */

export const CORTISOL_SKIN_SCIENCE = {
  mechanism: {
    title: 'How Stress Damages Skin and Hair',
    overview: 'When the body perceives stress — psychological, social, or physical — the hypothalamic–pituitary–adrenal axis triggers the release of cortisol and adrenaline. These hormones are lifesaving in short bursts but chronically destructive to integumentary tissue.',
    pathways: [
      {
        name: 'Cortisol and sebum overproduction',
        detail: 'Cortisol stimulates sebaceous glands to produce excess sebum. Combined with stress-driven inflammation, this creates the hormonal acne cycle: clogged follicles, C. acnes proliferation, and inflammatory papules — especially along the jaw and chin.',
      },
      {
        name: 'Collagen suppression',
        detail: 'Chronic cortisol inhibits fibroblast activity, reducing collagen and elastin synthesis. Skin loses firmness and resilience; fine lines deepen faster in high-stress periods.',
      },
      {
        name: 'Barrier dysfunction',
        detail: 'Glucocorticoids downregulate ceramide production in the stratum corneum, weakening the skin barrier. Trans-epidermal water loss (TEWL) increases, triggering dryness, sensitivity, and flare-ups of eczema and psoriasis.',
      },
      {
        name: 'Telogen effluvium (stress hair loss)',
        detail: 'Severe or sustained stress pushes more follicles than usual from anagen (growth) into telogen (rest/shedding). Shedding usually appears about two to three months after the stressor, which makes the link between a stressful event and visible thinning easy to miss.',
      },
      {
        name: 'Hyperpigmentation acceleration',
        detail: 'Psychological stress upregulates melanocyte-stimulating hormone (MSH) and ACTH, which bind to MC1R receptors on melanocytes and can deepen existing pigmentation — a particular concern for skin tones with higher baseline melanin density.',
      },
      {
        name: 'Wound healing delay',
        detail: 'Cortisol impairs cytokine signalling needed for tissue repair. Under chronic stress, post-inflammatory marks, blemishes, and minor cuts take measurably longer to resolve.',
      },
    ],
  },
  parasympathetic_activation: {
    title: 'How Beauty Rituals Regulate the Nervous System',
    overview: 'Beauty rituals — when performed with intention and sensory engagement — activate the parasympathetic ("rest and digest") branch of the autonomic nervous system. ',
    mechanisms: [
      {
        name: 'Touch and oxytocin release',
        detail: 'Slow, gentle skin contact — whether a face massage, scalp oiling, or body lotion application — stimulates C-tactile afferent nerve fibres that signal the brain to release oxytocin. This hormone lowers blood pressure, reduces cortisol, and produces feelings of safety and connection.',
      },
      {
        name: 'Rhythmic repetition as nervous-system anchor',
        detail: 'Repeated, predictable physical actions (brush strokes, circular massage, combing) work like other rhythmic self-soothing behaviours: they give the mind something steady to follow.',
      },
      {
        name: 'Olfactory–limbic pathway',
        detail: 'Smell signals reach emotion and memory areas without first passing through the thalamus. Fragrances used in beauty rituals — rose water, coconut oil, shea butter, sandalwood, jasmine — can trigger stored associations of safety, warmth, and care, bypassing cognitive override.',
      },
      {
        name: 'Mindful attention and present-moment focus',
        detail: 'A slow, multi-step skincare or hair-care routine asks for sensory attention — texture, temperature, scent, absorption. This everyday mindfulness can interrupt rumination.',
      },
      {
        name: 'Appearance satisfaction and self-efficacy',
        detail: 'Research consistently links appearance satisfaction — not meeting an external standard, but feeling cared-for and seen — with higher self-esteem, social confidence, and mood stability. A beauty ritual is a concrete act of self-efficacy: a small thing done well.',
      },
    ],
  },
  political_dimension: {
    title: 'Beauty Standards as a Mental Health Issue',
    overview: 'For ethnic communities, beauty is not a neutral personal concern. Dominant beauty standards rooted in Eurocentric aesthetics have been systematically weaponised — through media, hiring practices, school dress codes, and partner selection — to communicate that certain bodies, hair textures, skin tones, and facial features are inferior. The chronic stress of navigating these standards is a documented mental health burden.',
    research_points: ['Studies have linked internalised racism and colourism to depression, anxiety and disordered eating.', 'Natural hair discrimination has been linked to workplace disadvantage and distress for Black women — prompting CROWN Act laws in many US states.', 'For Arab and Muslim women, the politics of veiling — navigated between community expectation, Western hostility, and personal agency — creates a beauty-as-identity pressure unique to religious ethnic identity.'],
    affirming_frame: 'The beauty rituals documented in this guide are, in many cases, active resistance to those standards. Hair braiding, traditional dress, communal beauty care, and pride in ancestral ingredients are political acts of self-determination — and as such, they carry additional mental health benefit beyond the physiological.',
  },
};

export const UNIVERSAL_BEAUTY_MENTAL_HEALTH = {
  beauty_dysmorphia: {
    title: 'Body Dysmorphic Disorder and Ethnic Beauty',
    description: 'Body Dysmorphic Disorder (BDD) involves intense preoccupation with perceived appearance flaws — often invisible or minor to others. BDD affects people of every background, and the focus of the worry often reflects the beauty ideals a person grew up with. If the signs below sound familiar, it is worth talking to a doctor or therapist; a therapist who understands your culture can help.',
    warning_signs: ['Spending more than one hour per day thinking about an appearance concern', 'Avoiding mirrors or conversely checking compulsively', 'Repeatedly seeking reassurance about appearance', 'Avoiding social situations due to appearance anxiety', 'Multiple consultations for cosmetic procedures without satisfaction'],
    culturally_safe_support: 'Seek therapists with cultural competency training or shared ethnic background. Many communities have specific organisations offering culturally grounded mental health support.',
  },
  ritual_vs_compulsion: {
    title: 'When Beauty Ritual Becomes Compulsion',
    description: 'A healthy beauty ritual feels grounding, enjoyable, and bounded in time. A compulsive beauty behaviour feels driven by anxiety, takes escalating time, and provides only temporary relief. The difference is not the behaviour itself but its relationship to distress and daily functioning. A 10-step skincare routine done with pleasure is self-care; the same routine done in two-hour panic cycles is worth discussing with a professional.',
  },
  social_beauty: {
    title: 'Communal Beauty as Mental Health Infrastructure',
    description: 'In many of the cultures documented here, beauty is never a private activity. Hair braiding, hammam visits, salon gatherings, and communal bathing are social structures that happen to involve physical care. The mental health benefits of these spaces — belonging, gossip as emotional processing, generational transmission of wisdom, touch-based reassurance — are primary, not incidental. Modern research on loneliness and health increasingly validates what these communities have always known: being tended to by people who care about you is medicine.',
  },
};

export const ETHNIC_MENTAL_HEALTH_BEAUTY_GUIDES = {
  'west-african': {
    communityId: 'west-african',
    communityName: 'West African',
    heroText: 'In West African tradition, beauty is never individual vanity — it is community testimony. To look after your hair, your skin, and your body is to honour your lineage, show respect for those around you, and announce your belonging. That framework carries real comfort and belonging.',
    mental_health_context: {
      dominant_stressors: ['Migration and diaspora grief — the loss of extended family proximity and communal support structures', 'Colorism within communities, with pressure toward lighter skin tones reflecting internalized colonial beauty hierarchies', 'Code-switching between community beauty norms (natural hair, traditional dress) and workplace expectations'],
      protective_cultural_factors: ['Strong communal identity and social embeddedness providing belonging and buffering isolation', 'Spiritual frameworks (across Christianity, Islam, and traditional beliefs) that embed self-care in devotional practice', 'Intergenerational beauty knowledge passed woman-to-woman as an act of love and connection', 'Community celebration and event dressing (owambe culture) as mood-elevating ritual'],
    },
    signature_rituals: [
      {
        name: 'Communal Hair Braiding',
        mental_health_function: 'Social bonding, touch-based stress regulation, identity affirmation',
        description: 'In West African communities, hair braiding is not only a service — it is a gathering. Women (and sometimes men and children) sit together for hours while braids are installed. The conversation, laughter, storytelling and touch that come with this work can ease loneliness and affirm identity. For diaspora communities, recreating this ritual — even imperfectly, even with friends who are not from the same place — can be a warm answer to isolation.',
        practical_guidance: 'Prioritise braiding sessions with trusted people over quick solo processes. Allow ample time without rushing. Use the session to talk through what is weighing on you — the physical care creates safety for emotional disclosure.',
        neuroscience_note: 'Prolonged scalp touch activates the same C-tactile fibres implicated in maternal bonding. Ask for braids that do not pull: tight styles can cause traction hair loss.',
      },
      {
        name: 'Shea Butter Body Massage (Ori)',
        mental_health_function: 'Nervous system regulation, skin barrier repair, grounding',
        description: 'Raw shea butter (ori in Yoruba; karité in French) is rich in oleic and stearic acids, which soften skin and support the skin barrier. Its application matters as much as its ingredients. Massaging shea butter into the body — slowly, with attention, warming it between the palms first — is a practice of self-gentleness: a few quiet minutes in which the body is treated as worth caring for.',
        practical_guidance: 'Use raw, unrefined shea (pale yellow or ivory) rather than ultra-processed white variants, which lose many active compounds. Apply to damp skin after bathing. Work from feet upward with long, slow strokes. If possible, have this done for you by a family member — the receiving of care is its own intervention.',
        diy_blend: 'Traditional West African body butter: whip together 120g raw shea, 60ml baobab oil, and 10 drops of your preferred essential oil (ylang ylang for uplift; frankincense for grounding). Apply liberally.',
      },
      {
        name: 'Black Soap (Ose Dudu) Face and Body Wash',
        mental_health_function: 'Skin health maintenance, affordability, ancestral connection',
        description: 'Authentic African black soap (ose dudu, anago soap) is made from plantain skin ash, cocoa pod, palm kernel oil, and shea — fermented and sun-dried over days. For people dealing with stress-related acne, eczema flares, or hyperpigmentation, it is both an effective treatment and a connection to centuries of indigenous skincare science. Using traditional ingredients is, for many in the diaspora, a quiet act of reclamation.',
        practical_guidance: 'Authentic black soap should be soft and brown, not hard and perfectly black (which often indicates chemical processing). Use as a body wash or diluted gentle face cleanser. Patch-test first — it is alkaline and can be drying on already compromised skin. Follow with shea butter.',
      },
      {
        name: 'Traditional Hair Oiling (Baobab, Argan, Marula)',
        mental_health_function: 'Pre-wash stress relief ritual, scalp health, sensory grounding',
        description: 'The oiling of natural hair is a multi-purpose ritual: it softens strands, lubricates the scalp, prepares hair for manipulation, and — with scalp massage — can ease the scalp tightness many people feel when stressed. Baobab oil from Senegal and Mali; marula oil, more common in southern Africa; palm oil from the kitchen repurposed for hair. Each oil carries ancestral weight.',
        scalp_massage_protocol: 'Section hair into four. Apply warm oil (gently heated between palms or in a small bowl set in hot water) to each section. Use fingertips — not nails — in small circular motions for at least 5 minutes per section. End with long, downward strokes from crown to nape.',
      },
    ],
    mental_health_resources: {
      affirming_practices: ['Community elders and pastors/imams as first-resort listeners', 'Peer support within women\'s groups (especially church- or mosque-based)', 'Use of beauty-care settings (braiding salons, informal gatherings) as de facto talking therapy spaces'],
    },
  },
  'south-asian': {
    communityId: 'south-asian',
    communityName: 'South Asian',
    heroText: 'The Ayurvedic tradition treats the skin, the nervous system and the mind as connected. South Asian beauty rituals form a rich self-care system in which care for the body is also care for the mind.',
    mental_health_context: {
      dominant_stressors: ['Colorism: the centuries-deep association of light skin with purity, status, and marriageability across South Asian cultures causes documented psychological harm, particularly for darker-skinned individuals', 'Model-minority stress in diaspora contexts: the burden of representing the community through achievement and "acceptable" appearance', 'Hair texture stigma: kinky, wavy, or coarse hair textures pathologised within communities that prize smooth "silky" hair'],
      protective_cultural_factors: ['Ayurvedic tradition embedding self-care in wellness philosophy rather than vanity', 'Communal beauty practices (mehendi, pre-wedding champi, household recipe-sharing) sustaining social bonds', 'Religious ritual beauty practices (cleanliness for prayer, sindoor, bindi, bangles) giving beauty an elevated moral-spiritual status', 'Intergenerational transmission of beauty knowledge as an act of care and belonging'],
    },
    signature_rituals: [
      {
        name: 'Abhyanga — Ayurvedic Self-Massage',
        mental_health_function: 'Vagal nerve stimulation, nervous system regulation, dosha balancing',
        description: 'Abhyanga is the Ayurvedic practice of warm-oil full-body self-massage, traditionally performed daily before bathing. Sesame oil is the classic base for vata (anxiety-prone) constitutions; coconut for pitta (inflammation-prone); sunflower or lighter oils for kapha. The practice is understood in Ayurveda to nourish the dhatus (body tissues), calm vata (the dosha governing the nervous system and anxiety), and produce ojas — the refined essence of vitality and calm. Studies of massage find that slow, warm touch can lower heart rate and help people feel calmer.',
        practical_guidance: 'Warm oil gently (test on inner wrist — comfortably warm, not hot). Begin with the crown of the head and move downward. Use long strokes on limbs, circular motions on joints. Spend extra time on the feet — dense nerve endings there make foot massage particularly effective for nervous system regulation. Leave oil on skin for 15–20 minutes before a warm (not hot) shower. Perform daily or as often as practical.',
        oil_selection: {
          vata_anxiety: 'Sesame oil (warming, heavy, grounding)',
          pitta_inflammation: 'Coconut oil (cooling, anti-inflammatory)',
          kapha_sluggishness: 'Sunflower or mustard oil (stimulating, warming)',
          universally_calming: 'Brahmi oil (Bacopa-infused) for direct cognitive and stress-adaptive benefit',
        },
      },
      {
        name: 'Champi — Indian Head Massage',
        mental_health_function: 'Tension release, scalp health, cortisol reduction, intergenerational bonding',
        description: 'Champi (from the Hindi chāmpo, which gave English the word "shampoo") is the practice of head and scalp massage using warm oil — traditionally coconut, amla, brahmi, or bhringraj-infused preparations. In South Asian households, champi is given by mothers to children, by daughters to grandmothers, and between sisters as an act of love. Many people find it eases tension in the scalp, neck and shoulders. For diaspora communities living far from family, champi between friends or partners becomes a ritual of community building.',
        practical_guidance: 'Bhringraj oil is a traditional choice. Apply warm oil to scalp sections. Use fingertip (not nail) pressure in circular motions across the entire scalp. Include the temples, the hairline at the forehead, the nape of the neck, and — gently — the ears. Work for at least 15 minutes. Cover with a warm towel for 30 minutes before washing.',
        stress_hair_protocol: 'For stress-related shedding: a gentle daily scalp massage with bhringraj and amla oil, as a calming ritual. Shedding that lasts more than a few months is worth checking with a doctor (iron and thyroid levels are common checks).',
      },
      {
        name: 'Mehendi (Henna) Application as Meditation',
        mental_health_function: 'Focused attention, creative flow, social bonding, ceremony anticipation',
        description: 'Applying mehendi — whether by a professional or exchanged between women — demands slow, fine motor attention. The mind cannot simultaneously spiral in anxiety and execute delicate botanical designs on a moving hand. Mehendi application is functional mindfulness: attention is anchored in the present by the demands of the task. Beyond the individual cognitive effect, pre-wedding and festival mehendi sessions are communal experiences lasting hours — spaces where elder women share advice, younger women share worries, and generational knowledge flows in both directions. Use natural henna only: "black henna" often contains PPD, which can cause severe skin reactions.',
      },
      {
        name: 'Ubtan — Traditional Face and Body Scrub',
        mental_health_function: 'Exfoliation, skin brightening, sensory ritual, reclamation from skin-bleaching industry',
        description: 'Ubtan is the traditional pre-wedding full-body paste applied to South Asian brides (and increasingly to grooms) — made from turmeric, chickpea flour, sandalwood, rosewater, milk, and regional additions. Its base ingredients have substantial skincare science behind them: curcumin in turmeric is anti-inflammatory and mildly brightening; chickpea flour gently exfoliates; sandalwood cools and smooths. The mental health dimension is political as well as physiological: ubtan-based brightening works with the skin rather than bleaching it, and reviving this practice is an explicit counter to the damaging skin-lightening industry that has plagued South Asia and its diaspora for generations.',
        basic_recipe: '2 tbsp chickpea flour, 1 tsp turmeric, 1 tsp sandalwood powder, enough rosewater and milk to form a paste. Apply to face and body, let dry partially, then gently rub off in circular motions. Follow with oil massage.',
      },
      {
        name: 'Skincare as Meditation — The Intentional Routine',
        mental_health_function: 'Present-moment anchor, self-witnessing, cortisol interruption',
        description: 'South Asian beauty philosophy does not separate the skin from the self. The instructions found in texts like Charaka Samhita for daily self-care are framed in the same language as meditation instructions: attend to what you are doing, notice the sensations, be present with the body. A skincare routine performed this way — each step done with full sensory attention, noticing the texture of a cleanser, the absorption of an oil, the pressure of a jade roller — becomes a mindfulness practice without requiring a cushion or a teacher. Slow, attentive physical practice trains attention in a similar way to formal meditation.',
      },
    ],
    mental_health_resources: {
      affirming_practices: ['Yoga and pranayama as normalised nervous-system regulation tools already within cultural acceptance', 'Using beauty ritual appointments as safe spaces for emotional disclosure', 'Community organisations offering culturally grounded support, such as Soch Mental Health (US)'],
    },
  },
  caribbean: {
    communityId: 'caribbean',
    communityName: 'Caribbean',
    heroText: 'Caribbean beauty draws from Africa, Europe, Asia, and the indigenous Americas — a creolisation as layered as the culture itself. At its heart is an exuberant, life-affirming relationship with the body, the sea, the elements, and the community. Joy and beauty are not separated from survival — they are expressions of it.',
    mental_health_context: {
      dominant_stressors: ['Post-colonial cultural dislocation and the ongoing legacy of enslavement in beauty standards (skin tone hierarchies, hair texture hierarchies)', 'Diaspora isolation — Caribbean communities in the UK, North America, and the Netherlands navigating distance from the warmth of home and extended family'],
      protective_cultural_factors: ['Carnival, festivals, and communal celebration as structured mood elevation and collective identity affirmation', 'The natural environment — sea, sun, tropical plants — as accessible healing resource for those in the Caribbean', 'Community gatherings (including beauty gatherings) as informal emotional support systems', 'Humour and storytelling as cultural mechanisms for processing difficulty'],
    },
    signature_rituals: [
      {
        name: 'Sea Bathing as Mental Health Practice',
        mental_health_function: 'Sensory regulation, grounding, mood elevation, community ritual',
        description: 'In Caribbean culture, "going to the sea" is not merely recreation — it is remedy. Elders prescribe it for nerves, sadness, physical illness, and spiritual heaviness. Time in water is absorbing: the cool of the sea, the movement of the waves and the feeling of floating leave little room for rumination. The communal aspect — going together, calling out to each other in the waves — is part of the remedy.',
        diaspora_adaptation: 'For those far from the sea: a warm bath with sea salt or Epsom salt can echo the feel of it, and planning regular trips to the sea — as something to look forward to — is a legitimate way to look after yourself.',
        practical_use: 'After sea bathing, rinse with fresh water and apply a rich oil (coconut, cocoa butter) while skin is still damp to seal in moisture.',
      },
      {
        name: 'Coconut Oil — The Universal Caribbean Remedy',
        mental_health_function: 'Skin and hair repair, grounding self-touch ritual, ancestral connection',
        description: 'In the Caribbean, coconut oil is not a trend — it is infrastructure. It conditions hair, removes makeup, protects skin from sun and salt, heals minor cuts, treats fungal conditions, and more. Its fatty acid profile (particularly lauric acid) has antimicrobial properties and penetrates the hair shaft better than mineral oil in lab studies. As a beauty ritual object, it carries profound cultural weight: the smell of warm coconut oil activates for many Caribbean people a strong chain of memory and belonging.',
        hair_use: 'Pre-wash treatment: apply generously to dry hair and scalp, cover with a warm towel for 30 minutes, then shampoo. For high-porosity hair, use sparingly as a sealant after water-based moisturiser rather than as the primary hydrator.',
        skin_use: 'Body oil post-shower for most skin types. Note: coconut oil is comedogenic for facial use on acne-prone skin — use on body rather than face in those cases.',
      },
      {
        name: 'Communal Beauty Gatherings',
        mental_health_function: 'Social connection, loneliness prevention, intergenerational wisdom transfer',
        description: 'The beauty gathering — gathering in someone\'s home to braid, press, twist, or style hair, do nails, and share food — is a Caribbean social institution with deep mental health function. What looks from outside like a grooming event is actually structured social support: problems are shared, advice is offered, laughter is mandatory, and for a few hours the weight of individual struggle is distributed across the community. Research on social buffering (the ability of relationships to reduce physiological stress response) is well-established; Caribbean communal beauty gatherings are an operationalisation of this science.',
        recreating_in_diaspora: 'For diaspora communities, deliberately recreating these gatherings — even imperfectly — is a mental health priority. A WhatsApp coordination and a kitchen to gather in is sufficient infrastructure.',
      },
      {
        name: 'Cocoa Butter and Shea Skin Rituals',
        mental_health_function: 'Skin nourishment, sensory pleasure, cultural pride',
        description: 'Caribbean bodies have historically been exploited for labour and subjected to racist beauty standards that pathologised their features. The act of luxuriating in rich, fragrant butters — of spending time and care on a body that the world has sometimes treated as a tool — is not trivial. It is a small act of reparation and self-regard. Raw cocoa butter (smelling of chocolate, creamy and golden) is the quintessential Caribbean skin care. Blend with coconut oil and a few drops of neroli for a classic Caribbean body treatment.',
      },
      {
        name: 'Aloe Vera — Straight from the Plant',
        mental_health_function: 'Skin healing, cooling, sunburn relief, sensory ritual',
        description: 'Throughout the Caribbean, aloe vera plants grow in household gardens for immediate medicinal use. Splitting a leaf and applying the clear gel directly to sunburned skin, rashes, minor cuts, or inflamed acne lesions is a practice that bypasses the cosmetic industry entirely — a connection to living remedies and indigenous knowledge that carries emotional weight as well as physical benefit. The gel contains polysaccharides that soothe inflammation, acemannan that supports wound healing, and a cooling sensation on application that itself reduces the perception of pain and heat.',
      },
    ],
    mental_health_resources: {
      affirming_practices: ['Using church community structures to normalise emotional disclosure', 'Connecting beauty ritual time to intentional emotional check-ins', 'Organisations such as Black Minds Matter UK, which connects Black people in the UK with therapists'],
    },
  },
  arab: {
    communityId: 'arab',
    communityName: 'Arab',
    heroText: 'Arab beauty philosophy weaves together the spiritual and the sensory. Cleanliness in Islam is half of faith (taharah as ibadah); beauty is inseparable from devotion, from hospitality, from the preparation of the self for prayer and for others. The hammam, the oud, the rosewater — these are not luxuries. They are architecture for the soul.',
    mental_health_context: {
      dominant_stressors: ['Islamophobia and anti-Arab racism producing a specific form of minority stress in Western contexts — the pressure to manage appearance as a political statement (particularly for veiled women)', 'Navigating between community beauty norms and Western beauty expectations', 'Trauma from conflict, displacement, and the specific refugee experience for Arab communities affected by regional instability'],
      protective_cultural_factors: ['The hammam tradition providing a dedicated, non-judgmental physical and social space for self-care', 'Aromatherapy culture (oud, rose, musk, amber) providing potent olfactory anchors for emotional regulation', 'Islamic spiritual practice embedding daily cleanliness and self-care as devotional acts', 'Communal gatherings (particularly women-only spaces) offering social support under the shared umbrella of beauty preparation'],
    },
    signature_rituals: [
      {
        name: 'Hammam — The Arabic Bath as Mental Health Ritual',
        mental_health_function: 'Deep nervous system reset, social connection, body acceptance, purification',
        description: 'The hammam (Arabic bathhouse) has been the central wellness institution of Arab and broader Middle Eastern/North African culture for over a thousand years. A traditional hammam visit involves a progression through heated rooms (warm, hot, cool), steam exposure, black soap (savon beldi) or ghassoul clay, vigorous kessa mitt exfoliation by an attendant, and often argan oil or rhassoul clay treatment. The physiological effects are comprehensive: heat dilates blood vessels and reduces muscle tension, steam opens airways and loosens congestion, exfoliation removes barrier-blocking dead cells, and the subsequent cool room produces a profound whole-body relaxation response. But the mental health dimension is as significant: the hammam is a space where the body is cared for by another person — where vulnerability and being tended to are structurally built in. For women, it has historically been one of the few social spaces outside the domestic sphere where conversation, community, and physical freedom co-exist.',
        modern_access: 'Hammam-style treatments are available in many cities via Turkish baths, Moroccan spas, and Moroccan-style hammam experiences. For those without access, recreate at home: steam shower, black soap or rhassoul clay scrub, kessa mitt exfoliation, cool rinse, argan oil application.',
        diaspora_note: 'For Arab women in diaspora, finding or creating hammam-adjacent spaces — women-only swimming sessions, home steam rituals shared with friends — is a meaningful way to preserve this form of communal wellness.',
      },
      {
        name: 'Rose Water Aromatherapy',
        mental_health_function: 'Mood regulation, anxiety reduction, sensory grounding, spiritual connection',
        description: 'Rosewater has been distilled in the Arab world since at least the 9th century — used in cooking, prayer, medicine, and beauty. Small clinical studies report that inhaling rose scent can reduce anxiety and lower heart rate. The rose scent evokes associations of care, ritual, and sanctity that are deeply encoded in Arab cultural memory. Rosewater is sprinkled on guests on arrival, used to cleanse before prayer, misted over the face after wudu, and layered beneath oud fragrances in traditional scent composition.',
        practical_uses: ['Facial mist throughout the day for sensory regulation and quick calm', 'Added to bath water for full-body olfactory immersion', 'Sprinkled on pillowcase for sleep ritual', 'Mixed with glycerin as a gentle toner', 'Applied post-wudu as an act of beauty-as-worship'],
        quality_note: 'Authentic rose water is distilled, not rose-fragrance-in-water. Look for products with a single ingredient (Rosa damascena hydrosol or similar) rather than synthetic rose fragrance.',
      },
      {
        name: 'Argan Oil — Liquid Gold Treatment',
        mental_health_function: 'Skin restoration, self-care ritual, economic and cultural pride',
        description: 'Argan oil from Morocco is now globally recognised, but its mental health dimension in the Arab world is specific: it is gathered and cold-pressed by women\'s cooperatives, making its use an act of economic solidarity as well as personal care. High in oleic acid, linoleic acid, and vitamin E, it supports the skin barrier, smooths hair cuticles, and treats nail brittleness. Applied warm as a face oil at night, it functions as both skin treatment and end-of-day ritual — the physical signal that the day is done and the body is being cared for.',
        hair_use: 'A single drop worked through dry hair ends controls frizz and adds luminosity without heaviness. Applied to the scalp before washing, it nourishes follicles. Mixed with henna powder for a conditioning colour treatment.',
        face_use: 'Argan oil is non-comedogenic and suitable for most skin types, including oily skin. Apply 3–4 drops to damp skin after serum for the final step of evening routine.',
      },
      {
        name: 'Black Seed Oil (Habba Sawda) Skincare and Hair Care',
        mental_health_function: 'Healing practice, Prophetic medicine connection',
        description: 'Black seed oil (Nigella sativa, habba sawda) is described in hadith literature as "a cure for every disease except death," giving it deep cultural and spiritual significance in Muslim Arab communities. Its active compound thymoquinone is studied for anti-inflammatory and antioxidant effects; small studies point to benefits for acne and some hair concerns, but the evidence is limited, and it can cause skin allergies. Using it is a beauty practice and also a connection to Prophetic medicine — care with spiritual as well as physical dimensions.',
        use_guidance: 'Dilute with a carrier oil (1 part black seed to 4 parts jojoba or argan) for topical skin use — undiluted can be irritating. For hair: massage diluted oil into scalp and leave overnight before washing. Take orally only as directed by a healthcare provider.',
      },
      {
        name: 'Kohl (Surma) Application — Beauty as Devotion',
        mental_health_function: 'Identity affirmation, religious ritual, eye protection',
        description: 'Traditional kohl (surma, ithmid) is a mineral powder applied to the eyes — practised for centuries across the Arab world and wider Muslim communities. It is a beauty practice and a sunnah (prophetic practice), so applying it can beautify and express devotion at once. For Muslim women in environments that treat their appearance as a site of political contestation, the quiet continuity of practices like kohl can be a steadying anchor. Safety: many traditional kohl and surma products contain high levels of lead (galena is lead sulfide), which is especially dangerous for children. Choose eye cosmetics sold as lead-free under your country\'s cosmetic rules.',
      },
    ],
    mental_health_resources: {
      affirming_practices: ['Using hammam and beauty-care time as legitimate emotional processing space', 'Islamic spiritual practices (prayer, dhikr, community fasting) offering structured mental health support', 'Arab-specific support such as the Arab American Family Support Center (New York)'],
    },
  },
  latina: {
    communityId: 'latina',
    communityName: 'Latina',
    mental_health_context: {
      dominant_stressors: ['Colorism within communities — the complex hierarchies of tez (skin tone) that map onto class, Indigenous heritage, and anti-Blackness inherited from colonial systems', 'Immigration stress and documentation anxiety, with the specific psychological weight of uncertainty and family separation', 'Acculturation stress: the pressure to assimilate aesthetically (straighten hair, lighten skin, lose accent) while preserving cultural identity'],
      protective_cultural_factors: ['Abundant plant-medicine knowledge (hierbas, remedios caseros) providing accessible self-care tools', 'Celebration culture — cumbia, salsa, the dance floor, the fiesta — as legitimate communal joy infrastructure', 'El salón as a community mental health space that does not require pathologising one\'s experience to access'],
    },
    signature_rituals: [
      {
        name: 'El Salón — The Beauty Salon as Sacred Mental Health Space',
        mental_health_function: 'Community belonging, emotional processing, intergenerational support, identity affirmation',
        description: 'In Latinx communities, the beauty salon is not merely a grooming destination — it is a community institution, a confessional, a village square, and a therapy office. Women (and many men) go to their stylist for decades, and the relationship between stylist and client becomes one of the most trusted in the community. Problems are disclosed, advice is given, grief is witnessed, and gossip provides the social information that holds communities together. Research on social support consistently identifies trusted relationships with recurring physical contact as among the most potent buffers against depression and anxiety. El salón operationalises this in a commercial space that requires no formal mental health framing.',
        community_note: 'The role of salón as informal mental health infrastructure means that the mental health implications of losing access — through cost, time poverty, or immigration status — are more significant than they might appear from outside the community.',
      },
      {
        name: 'Hair Braiding as Grandmother-Granddaughter Bonding',
        mental_health_function: 'Intergenerational attachment, identity transmission, touch-based attunement',
        description: 'The image of a grandmother braiding a granddaughter\'s hair is so central to Latinx cultural memory that it approaches archetypal. The hours of gentle sectioning and braiding create a long stretch of attentive, caring contact between generations. Alongside the physical care comes oral tradition — stories, advice, family history, beauty recipes — the intergenerational download that gives a young person roots. For adult Latinx women in diaspora, recreating this relationship — with elders, with peers, with children — is one of the most specific recommendations for addressing the loneliness of distance from home.',
        traditional_styles: 'Trenzas (classic braids), chongos (buns), rebozos incorporated into updos, ribbons and flores (fabric flowers) as traditional adornments. Each style carries regional and generational significance.',
      },
      {
        name: 'Remedios Caseros — Home Kitchen Beauty',
        mental_health_function: 'Resourcefulness, indigenous knowledge connection, self-sufficiency, sensory pleasure',
        description: 'Latinx home kitchens have always been beauty laboratories. Avocado hair masks, egg yolk protein treatments, honey and lemon brightening treatments, aloe vera straight from the plant for skin, chamomile rinses to brighten hair — these remedies pass mother to daughter and are as much about cultural continuity as about ingredient efficacy. The act of making a beauty treatment from kitchen ingredients activates both self-sufficiency (agency) and cultural connection (belonging) — two powerful protective factors against anxiety and depression. Many of the ingredients have solid evidence: avocado oil penetrates the hair shaft; aloe soothes inflammation; honey is antimicrobial and humectant.',
        key_ingredients: ['Avocado: deep conditioning mask for natural and colour-treated hair', 'Aloe vera gel: skin soothing, scalp treatment, hair definition for curly textures', 'Castor oil: edge treatment, eyebrow conditioning, scalp stimulation', 'Honey: humectant, antimicrobial skin mask', 'Chamomile tea: brightening hair rinse for lighter hair; soothing toner for sensitive skin', 'Coffee grounds: exfoliating body scrub; also applied to under-eye circles for temporary tightening'],
      },
      {
        name: 'Curanderismo-Adjacent Beauty Rituals',
        mental_health_function: 'Spiritual protection, anxiety relief through ritual, nervous system regulation via intention',
        description: 'In many Latinx communities, beauty and spiritual protection overlap. Limpia (energetic cleansing) ceremonies using herbs, eggs, and smoke have both spiritual and psychological effect — they provide structured ritual for processing susto (spiritual fright — a folk illness describing the shock and dysregulation following trauma). Wearing specific colours, using perfumed waters (Florida water, agua de rosas), and anointing practices that blend Catholic and indigenous elements create a body-based spiritual practice in which beauty care is simultaneously protective care. Structured ritual can ease anxiety, and shared belief brings belonging.',
        modern_application: 'Florida water as a calming room and linen spray; agua de rosas as a facial mist; rosemary bundled and used in steam treatments for clarity and protection — these elements can be incorporated into daily beauty routines as personal ritual anchors.',
      },
      {
        name: 'Quinceañera Beauty Preparation as Rite of Passage',
        mental_health_function: 'Identity affirmation, community witnessing, healthy self-image framing',
        description: 'The months of preparation for a quinceañera involve the entire extended community in the beautification of a young woman — not to meet an external standard but to celebrate her becoming. Dress, hair, makeup, and presentation are collectively planned and executed, and the resulting celebration is a community act of saying "you matter, you are seen, you are beautiful, you belong." Many families see it as a celebration that tells a young woman she belongs.',
      },
    ],
    mental_health_resources: {
      affirming_practices: ['Using salón appointments as touchstones for emotional check-in', 'Community spirituality (church, curanderismo) as existing emotional support infrastructure', 'Organizations: National Alliance on Mental Illness (NAMI) Latino resources, Latinx Therapy, Therapy for Latinx platform'],
    },
  },
  'east-asian': {
    communityId: 'east-asian',
    communityName: 'East Asian',
    heroText: 'East Asian beauty culture — particularly the Korean, Japanese, and Chinese traditions — has developed deliberate, layered skincare systems. At its best, it is not about chasing a standard but about the practice itself: the slow, layered, attentive ritual of caring for skin as an act of present-moment focus. This is beauty as meditation.',
    mental_health_context: {
      dominant_stressors: ['Model minority stress: the expectation of academic and professional excellence that suppresses disclosure of mental health struggle', 'Anti-Asian racism, particularly post-pandemic, producing a specific trauma burden in diaspora communities'],
      protective_cultural_factors: ['Structured daily self-care practice (skincare routines) as existing normalised mindfulness infrastructure', 'Tea culture and ceremony as embedded sensory-grounding practice', 'Communal beauty practices (group face masks, spa days, jimjilbang bathhouses) providing social connection', 'Traditional medicine frameworks (Traditional Chinese Medicine, Korean Hanbang, Japanese Kampo) providing holistic body–mind frameworks'],
    },
    signature_rituals: [
      {
        name: 'The 10-Step Skincare Routine as Mindfulness Practice',
        mental_health_function: 'Daily mindfulness, stress interruption, sensory grounding, self-witnessing',
        description: 'The Korean 10-step skincare routine — oil cleanser, water cleanser, exfoliant, toner, essence, ampoule/serum, sheet mask, eye cream, moisturiser, SPF — is widely understood as a skincare system. Less discussed is its function as a daily mindfulness protocol. The sequence demands attention: each product has a specific texture, absorption time, and method of application. Patting (not rubbing) an essence requires attention to the sensation. Pressing a sheet mask to the contours of the face requires the mind to follow the hands. The 15–30 minutes of a complete routine cannot be rushed without losing efficacy — meaning the routine structurally resists the compressed, anxious half-attention that characterises stress. In clinical terms, it deploys attentional resources in the present moment and interrupts default-mode rumination.',
        mental_health_optimisation: 'Make the routine a device-free practice. Use it as the day\'s formal boundary: the morning routine marks the beginning; the evening routine marks the end. Narrate what you are doing in your mind (or aloud) as a grounding technique. The 4-7-8 breathing pattern can be layered over the waiting periods between product absorption.',
        key_steps_and_why: [
          { step: 'Oil cleanse', benefit: 'Removes SPF and makeup; warm oil massage is the first parasympathetic signal of the evening' },
          { step: 'Water cleanse', benefit: 'Removes water-based debris; cool water splash is a mild dive-reflex activator' },
          { step: 'Toner / essence patting', benefit: 'Rhythmic, gentle patting delivers hydration and activates C-tactile fibres through self-touch' },
          { step: 'Sheet mask', benefit: '15-minute enforced pause; the cooling sensation and compression activate both olfactory and tactile calming pathways' },
          { step: 'Facial massage with moisturiser', benefit: 'Gua sha, roller or fingertip massage: slow, gentle touch to close the routine' },
        ],
      },
      {
        name: 'Gua Sha — Facial Massage for Stress Relief',
        mental_health_function: 'Lymphatic drainage, muscle tension release, cortisol reduction, ritual grounding',
        description: 'Gua sha (刮痧) is a traditional Chinese medicine technique involving the scraping of a smooth tool (historically jade or bian stone; modern versions include rose quartz, stainless steel, and buffalo horn) over oiled skin to stimulate circulation, release muscle tension, and drain lymphatic fluid. On the face, light-pressure gua sha (distinct from the firmer body technique) may briefly reduce puffiness, and many people find it relaxes the jaw and temples. It has become a global beauty trend — but its origins in TCM connect it to a broader holistic health philosophy in which appearance and wellbeing cannot be separated.',
        technique: 'Apply facial oil generously. Work in upward and outward strokes, always moving lymph toward the lymph nodes (under the ear and at the collarbone). Hold the tool at a 15-degree angle to the skin. Repeat each stroke 5–8 times. Focus areas: along the jawline (tension and jaw-clenching stress), under the eyes (lymphatic drainage), along the forehead (tension headache prevention), and down the neck (lymph clearance). Practice for 5–10 minutes. The meditative quality comes from the slowness and repetition.',
      },
      {
        name: 'Jimjilbang and Onsen — Communal Bathing as Mental Health',
        mental_health_function: 'Social bonding without performance, relaxation, body acceptance',
        description: 'The Korean jjimjilbang (public bathhouse) and Japanese onsen (hot spring) provide what may be the East Asian version of the West African braiding circle or the Latinx salón: a communal space built around physical care where social connection happens naturally. Bathing areas are separated by gender; in the shared areas everyone wears the same simple uniform and rests on heated floors, setting social performance aside. Hot water immersion warms the body, and the cooling afterwards can help people feel drowsy and relaxed. Many people say that bathing in a safe, traditional setting helps them feel more at ease with their bodies.',
        diaspora_access: 'Korean-style spas (found in major cities across North America, Australia, and Europe), Japanese bath houses, and Turkish hammams approximate this experience. For those without access: deep baths with dissolved mineral salts, long shower steam rooms created with eucalyptus, and temperature contrast between warm and cool showers replicate elements of the bathing sequence.',
      },
      {
        name: 'Traditional Chinese Medicine (TCM) Beauty — Inner-Outer Connection',
        mental_health_function: 'Holistic self-understanding, skin health via systemic wellness, stress treatment at the root',
        description: 'TCM approaches skin and hair concerns as signs of internal imbalance — qi stagnation, blood deficiency, excess heat — rather than surface problems alone. That framing can be a helpful reminder to look at stress and sleep as well as the visible concern. Goji berries, tremella mushroom and schisandra appear in food-based beauty traditions that connect daily eating to skin and emotional health.',
        evidence_note: 'Acupuncture for stress and anxiety has a reasonable evidence base in systematic reviews. Herbal TCM formulations vary widely in evidence quality; consult a registered TCM practitioner rather than self-prescribing.',
      },
      {
        name: 'Japanese Skincare Philosophy — Mottainai and Simplicity',
        mental_health_function: 'Anti-consumerism, simplicity as stress reduction, reverence in daily acts',
        description: 'Mottainai, a Japanese expression of regret at waste, favours using a few products well. This is in contrast to the maximalist accumulation the beauty industry incentivises. A simplified routine does not necessarily sacrifice results, and can reduce the decision fatigue and product anxiety that a bathroom overflowing with products can create. Core Japanese skincare: cleanse gently (not stripping), hydrate (lotion/toner), protect (SPF). The philosophy applied to beauty is: use what you need, use it well, and be present while you do.',
      },
    ],
    mental_health_resources: {
      affirming_practices: ['Framing skincare and self-care routines explicitly as mental health practice', 'Using community bathing and spa experiences as normalised self-care', 'Organisations such as the Asian Mental Health Project (US)'],
    },
  },
  'east-african': {
    communityId: 'east-african',
    communityName: 'East African',
    heroText: 'East African beauty draws on long-standing traditions. From the Maasai\'s ochre and fat body preparations to the Swahili coast\'s aromatic trade-route perfume culture; from Ethiopian women\'s intricate hair braiding to the singing that accompanies Somali communal beauty rituals — this is a beauty practice rooted in community, ceremony, and the sacred.',
    mental_health_context: {
      dominant_stressors: ['Refugee and displacement trauma for communities from conflict-affected regions (Ethiopia, Somalia, South Sudan, DRC)', 'Colorism and anti-Blackness in global beauty standards, with particular complexity for communities with very dark skin tones', 'Post-migration identity stress: navigating between traditional community norms and destination-country expectations'],
      protective_cultural_factors: ['Extraordinarily rich communal beauty traditions providing social structure and belonging', 'Singing and music embedded in beauty rituals providing mood elevation and social synchrony', 'Traditional healing systems (Ethiopian traditional medicine, Somali dhawr, Maasai herbal practices) offering holistic self-care frameworks', 'Strong ethnic and community identity providing psychological scaffolding in diaspora contexts'],
    },
    signature_rituals: [
      {
        name: 'Singing During Beauty Rituals',
        mental_health_function: 'Mood elevation, social synchrony, oxytocin release, cultural continuity',
        description: 'In many East African communities, communal beauty sessions — braiding, oiling, dressing — are accompanied by singing. This is not accidental. Studies link group singing to better mood and a sense of closeness, and it takes enough attention to quiet rumination. For communities navigating displacement and trauma, preserving the tradition of singing during beauty care is a way of maintaining an emotional technology that has sustained communities through historical hardship.',
        practice_note: 'Recreate this in diaspora settings by playing traditional music — or singing together — during communal hair care sessions. The playlist is part of the ritual.',
      },
      {
        name: 'Ethiopian Coffee Ceremony as Linked Beauty-Social Practice',
        mental_health_function: 'Slowing down, sensory engagement, community structure, spiritual grounding',
        description: 'While not a beauty ritual itself, the Ethiopian coffee ceremony (buna) is the social infrastructure into which beauty practices are woven. The ceremony takes 45 minutes to an hour — beans are roasted over coals, ground by hand, brewed three times (abol, tona, baraka), and served in small cups. Beauty preparations happen alongside and within this ceremony. It enforces the slow time that beauty care requires and provides the relational container for it. The green grass and incense that traditionally accompany the ceremony (frankincense, myrrh) add a scent many find calming.',
      },
      {
        name: 'Traditional Body Oiling and Butter Practice',
        mental_health_function: 'Skin nourishment, nervous system regulation through self-touch, heat and scent grounding',
        description: 'Across East African communities, the daily application of body oil or butter — often mixed with earth, ochre, or aromatic compounds — is both practical (protecting skin from harsh sun and dry conditions) and ceremonial. Maasai men have traditionally applied red ochre mixed with fat as sun protection and identity marking. Somali women apply qasil (lote tree leaf powder) as a skin treatment. Ethiopian women traditionally use butter-based preparations. The common thread is deliberate, daily physical care of the body as a valued and ceremonial act — not a hurried utilitarian task.',
        key_ingredients: ['Qasil (Ziziphus spina-christi leaf powder): traditional Somali cleansing mask', 'Butter (kibe): traditionally used in Ethiopian hair care', 'Shea butter: widely used across the Sahel and into East Africa', 'Moringa oil: grown widely in East Africa (the tree is native to South Asia); high in oleic acid', 'Frankincense (olibanum): a calming scent with a long beauty and spiritual history in the region; its anti-inflammatory compounds are under study'],
      },
      {
        name: 'Henna Traditions on the Swahili Coast',
        mental_health_function: 'Ceremonial participation, social belonging, creative expression, skin connection',
        description: 'Swahili coast communities (Kenya, Tanzania, coastal Somalia, Comoros) have centuries-old henna traditions imported via Indian Ocean trade routes and blended with East African motifs. Henna application before weddings, Eid, and ceremonies is a communal practice that gathers women together for design exchange, storytelling, and the sustained slow attention of artistic creation. The meditative benefit of applying and receiving henna is described in the South Asian section; in East African context, add the additional dimension of cross-cultural creativity and the beauty of geometric and floral Swahili coastal designs.',
      },
      {
        name: 'Traditional Healing and Beauty Overlap',
        mental_health_function: 'Integrated body-mind care, community healer relationships, spiritual protection',
        description: 'In many East African traditional health systems, the boundary between healing and beauty does not exist. The same practitioner who applies medicinal herbs to treat illness might prepare a girl for marriage ceremonies using the same knowledge base. Ethiopian traditional medicine (involving butter-based preparations, herbal compresses, and smoke treatments), Somali traditional healing, and Maasai herbal practice all embed physical care of the body in a broader healing philosophy. Using these traditions consciously — gathering knowledge from elders, visiting traditional practitioners where safe and accessible — is a form of cultural continuity with mental health value beyond the physical effects of individual ingredients.',
      },
    ],
    mental_health_resources: {
      affirming_practices: ['Preserving communal beauty rituals as community-building infrastructure', 'Traditional healers as first-tier support in culturally appropriate contexts'],
    },
  },
  'south-african': {
    communityId: 'south-african',
    communityName: 'South African',
    heroText: 'South African beauty is inseparable from South African political history. The forced ugliness of apartheid — the racial classification of bodies, the criminalisation of natural hair in workplaces, the systematic assault on Black South African identity — means that beauty as self-determination is not an abstract idea here. It is a lived political act. Ubuntu, the Nguni philosophy of "I am because we are," provides a communal ethic for beauty practice: your beauty is held and affirmed by your community, not judged against an external standard.',
    mental_health_context: {
      dominant_stressors: ['Intergenerational trauma from apartheid, including race-based beauty standard oppression that persists in post-apartheid commercial and workplace culture', 'Coloured community-specific colorism and identity complexity: navigating mixed-heritage identity in a society that has historically required racial categorisation', 'Economic precarity for the majority Black South African population, limiting access to both mental health care and beauty resources'],
      protective_cultural_factors: ['Ubuntu philosophy providing a deeply embedded communal identity framework', 'South African women\'s activism traditions providing models of resistance and collective action', 'Rich ethnic beauty traditions (Ndebele beadwork, Xhosa traditional dress and beauty, Zulu ceremonial beauty) as identity anchors', 'The "Born Free" generation\'s explicit reclamation of Black beauty and natural aesthetics'],
    },
    signature_rituals: [
      {
        name: 'Ubuntu Beauty — Communal Care as Philosophy',
        mental_health_function: 'Community belonging, identity affirmation, mutual care as mental health infrastructure',
        description: 'Ubuntu — "umuntu ngumuntu ngabantu" (a person is a person through other persons) — reframes beauty care as inherently communal. In Ubuntu philosophy, individual beauty is not private: it is held and celebrated by the community. Hair braiding sessions, communal dressing for celebrations (umemulo, lobola preparations, church events), and the shared investment in each other\'s appearance are all expressions of Ubuntu in action. The mental health implication is profound: your appearance is not a private anxiety but a communal responsibility. The community affirms you. You are seen.',
        political_note: 'In post-apartheid South Africa, the reclamation of Ubuntu-based communal beauty practices — particularly the celebration of afro hair, traditional dress, and ancestral beauty knowledge — is an explicit decolonisation project with clear mental health resonance.',
      },
      {
        name: 'Rooibos Tea Beauty Rituals',
        mental_health_function: 'Skin healing, anti-anxiety ritual, proudly South African identity',
        description: 'Rooibos (Aspalathus linearis) is endemic to the Western Cape — it grows nowhere else in the world. Rich in antioxidants (aspalathin, nothofagin, quercetin), it is studied for anti-inflammatory and antioxidant effects on the skin. As a beauty ingredient, rooibos toner, face mist, or bath soak connects the user to something quintessentially South African. Drinking rooibos tea is itself an anxiety-reducing ritual: naturally caffeine-free, the ritual of making and drinking tea — particularly in community — is a slowing practice.',
        diy_applications: ['Rooibos toner: brew strong rooibos, cool, and apply with a cotton pad after cleansing', 'Rooibos face steam: brew in a bowl, tent face over steam for 5 minutes', 'Rooibos bath: add 4–6 bags to warm bath for a full-body antioxidant soak', 'Rooibos scalp rinse: pour cooled brew over scalp post-shampoo to soothe itchiness'],
      },
      {
        name: 'Umemulo and Ceremonial Beauty Preparation',
        mental_health_function: 'Rite of passage, community witnessing, identity affirmation, collective joy',
        description: 'Zulu umemulo (coming-of-age ceremony for young women in their twenties) involves extensive communal preparation: traditional dress, beadwork, anointing, and the celebration of the young woman in her full identity. Similar to the quinceañera in Latinx culture, the beauty preparation for umemulo is a community act of saying "you are seen, you are valued, you are beautiful within your own tradition." Community-witnessed ceremonies like this reinforce belonging and give a young person a story of who they are becoming.',
      },
      { name: 'Ndebele Beadwork and Body Art as Mental Health Expression', mental_health_function: 'Creative expression, cultural identity, fine motor focus as mindfulness, community language' },
      {
        name: 'Marula Oil — Skin Nourishment from the Veldt',
        mental_health_function: 'Skin restoration, ancestral connection, self-care with indigenous ingredients',
        description: 'Marula oil (from Sclerocarya birrea) has been used by southern African women for centuries as a skin and hair treatment. It is rich in oleic acid and antioxidants, absorbs without greasiness and keeps well. As an ingredient from the South African landscape, using marula oil carries the same meaning as using rooibos: a connection to the ecology that shaped the community.',
        use_guidance: 'Apply 3–5 drops to damp skin as the final step of an evening skincare routine. Warm between palms first for better absorption. For hair, a few drops on dry ends prevents split ends and adds shine without heaviness. For traditional body use: apply generously to damp skin after bathing.',
      },
    ],
    mental_health_resources: {
      affirming_practices: ['Ubuntu community structures as informal mental health support', 'Traditional healers (sangoma, inyanga) as first-tier support in many communities — collaboration with clinical services is emerging', 'SADAG (sadag.org): Suicide Crisis Helpline 0800 567 567; Cipla Mental Health Helpline 0800 456 789, or SMS 31393', 'Reclamation of natural hair and traditional beauty as explicitly decolonising mental health practice'],
    },
  },
  'black-american': {
    communityId: 'black-american',
    communityName: 'Black American',
    heroText: 'The Black American beauty salon is one of the great unrecognised mental health institutions of the 20th and 21st centuries. In a country that has systematically devalued, brutalised, and legislated against Black bodies, the act of adorning, celebrating, and caring for that body is not trivial. It is survival. It is resistance. It is, in the truest sense, self-determination.',
    mental_health_context: {
      dominant_stressors: ['Racial trauma: the accumulation of microaggressions, systemic racism, police violence, and cultural devaluation produces a specific chronic stress burden documented across Black American health outcomes', 'Hair discrimination: Black hair has been penalised in schools and workplaces for generations — the CROWN Act (Creating a Respectful and Open World for Natural Hair) is a legislative response to documented harm', 'Colorism within the community: the persistent valuation of lighter skin and straighter hair as more beautiful, more professional, and more worthy', 'The specific burden of navigating American beauty standards designed around white Western aesthetics while maintaining community identity'],
      protective_cultural_factors: ['The Black beauty salon as a unique social institution — a safe space, a community mental health resource, and a site of cultural transmission that has no precise equivalent in other communities', 'The natural hair movement providing an affirming counter-narrative to dominant beauty standards', 'Rich artistic and expressive beauty traditions — from elaborate nail art to protective styling — as creative self-expression', 'Intergenerational beauty knowledge and the specific intimacy of hair care as an act of love'],
    },
    signature_rituals: [
      {
        name: 'The Black Beauty Salon as Sacred Space',
        mental_health_function: 'Community belonging, emotional disclosure, identity affirmation, racial trauma processing',
        description: 'The Black beauty salon (and barber shop, for Black men) occupies a unique sociological position in American life. It is one of the few racially homogeneous spaces that Black Americans have consistently maintained — a space where the defensive code-switching of public life can be set down, where Black speech, Black aesthetics, Black politics, and Black humour are the defaults. Sociologists and public health scholars have documented the salon\'s function as informal mental health infrastructure: a place where problems are shared without clinical framing, where intergenerational advice flows freely, where the physical act of being cared for by someone who looks like you carries meaning that exceeds the technical service rendered. For many Black women, the stylist relationship is one of the most trusted in their lives.',
        historical_note: 'Black salons and barber shops have functioned as political organising spaces since Reconstruction — safe spaces for planning, resistance, and community coordination that were inaccessible to white oversight. This political history gives the salon its current cultural weight. Entering one is entering a long story.',
        diaspora_and_access: 'Where Black beauty salons are absent or inaccessible, the significance of recreating the space — the gathering, the physical care, the music, the conversation — cannot be overstated. A home hair session with community members can carry the same function.',
      },
      {
        name: 'Hair Care as Identity Affirmation and Racial Healing',
        mental_health_function: 'Self-esteem repair, racial identity affirmation, autonomy over a politically contested body part',
        description: 'Black American hair has been one of the most contested political sites in American history: from the 1786 tignon laws in Spanish New Orleans, which required Creole women of colour to cover their hair, to school dress codes banning locs and twists in the 21st, to the documented employment discrimination that the CROWN Act was designed to address. In this context, caring for, styling, and celebrating natural Black hair — in its coiled, loc\'d, braided, twisted, and explosive natural forms — is an act of political self-determination with direct mental health implications. Some studies link going natural with better self-esteem for Black women.',
        protective_styles_and_mental_health: ['Box braids: extended installation means less daily manipulation and decision fatigue', 'Locs: a commitment to natural texture with a progressive community and strong identity signalling', 'Twist-outs and wash-and-gos: daily engagement with natural texture as a self-affirming practice', 'Wigs and weaves: style freedom and protective cover that allows natural hair to rest — when chosen freely, not when imposed by workplace pressure'],
        key_ingredients: ['Castor oil: the classic Black American edge and scalp oil (pressed oil does not contain ricin)', 'Shea butter: moisture-sealing for low-porosity natural hair', 'Coconut oil: protein treatment aid and moisture retention', 'Argan oil: finishing oil for shine and frizz reduction', 'Aloe vera: humectant and curl definition support'],
      },
      {
        name: 'Beauty After Racial Trauma — Self-Care as Coping',
        mental_health_function: 'Post-trauma stabilisation, bodily agency, cortisol management, community solidarity',
        description: 'In the aftermath of racial trauma events — witnessing or experiencing police violence, viral anti-Black violence, workplace discrimination — the Black American community has developed informal protocols of beauty-as-coping that function as peer-level nervous system support. The gathering of Black women to care for each other\'s hair and appearance after traumatic community events is documented in oral history and increasingly in scholarly literature. The physical act of being tended to — of having someone\'s careful hands in your hair while you process what happened — is a body-first approach to trauma stabilisation that precedes and supplements formal therapy.',
        somatic_note: 'Some trauma clinicians, including Bessel van der Kolk in The Body Keeps the Score, describe body-based approaches — touch, rhythm, warmth — as a helpful complement to talk therapy. Gentle care rituals can bring comfort after a hard day or a hard event; they do not replace support from a trained professional.',
        when_to_seek_professional_support: 'Beauty self-care supports but does not replace clinical mental health care for racial trauma. Therapists of colour with expertise in racial trauma: Therapy for Black Girls, Loveland Foundation, Open Path Collective.',
      },
      {
        name: 'The Edge Control Ritual and Self-Presentation Agency',
        mental_health_function: 'Mastery, self-presentation control, aesthetic expression within constraint',
        description: 'Edge control — the precise laying and styling of the hairline with product and a soft brush — is a Black American beauty skill with its own aesthetic vocabulary (heart patterns, swirls, waves). It is also a practice of precision, control, and artistic expression in miniature. In a world where Black Americans are frequently denied control over major life circumstances, mastery of edge care and presentation is a micro-domain of expressed agency. The concentration required is meditative; the visible result provides an immediate satisfaction signal that activates the reward pathway.',
      },
      {
        name: 'Nail Art as Creative Self-Expression',
        mental_health_function: 'Creative expression, self-affirmation, community signalling, mood elevation',
        description: 'Black American nail culture — elaborate acrylic sets, gel art, coffin and stiletto shapes, rhinestones, hand-painted designs — is a recognised art form and a powerful medium for self-expression and community identity. Research on creative self-expression consistently shows benefits for mood, self-esteem, and psychological wellbeing. Nail appointments are also salon-adjacent: they involve the physical care of a trusted technician, often in a community setting, and provide a portable art object worn on the body. The nail arts worn by Black women to work, to church, to protest, and to celebration are intentional communications of identity and pride.',
      },
      {
        name: 'Sunscreen and Skin Care — Reclaiming the Narrative',
        mental_health_function: 'Health autonomy, correcting medical misinformation, skin confidence',
        description: 'The myth that Black skin does not need sunscreen has been perpetuated and has caused measurable harm: Black Americans are significantly more likely to be diagnosed with melanoma at advanced stages because of lower screening rates and the mistaken belief that dark skin is fully protected from UV. Reclaiming SPF use in Black skin care is a health justice issue and a beauty confidence issue simultaneously. New-generation sunscreens formulated to avoid the grey-white cast on deeper skin tones (tinted SPF, mineral-chemical hybrid formulations) have begun to address one of the legitimate barriers to adoption. Using SPF daily is an act of long-term self-care.',
        product_note: 'For very deep skin tones (Fitzpatrick V–VI), chemical sunscreens (avobenzone, octinoxate) or tinted mineral formulations avoid white cast. Black Girl Sunscreen and similar Black-founded brands have made culturally competent SPF formulations more accessible.',
      },
    ],
    mental_health_resources: {
      affirming_practices: ['Using beauty-care appointments as intentional emotional check-in time', 'Therapy for Black Girls: therapyforblackgirls.com — directory of therapists of colour', 'Loveland Foundation: lovelandfoundation.org — therapy grants for Black women and girls', 'Open Path Collective: reduced-cost therapy with culturally competent practitioners', 'The Black Men Heal initiative: reduced-cost mental health services for Black men', 'National Alliance on Mental Illness (NAMI) Urban Los Angeles: focus on BIPOC communities'],
    },
  },
};

export const ALL_COMMUNITY_IDS = ['west-african', 'south-asian', 'caribbean', 'arab', 'latina', 'east-asian', 'east-african', 'south-african', 'black-american'];

export const INGREDIENT_CROSS_REFERENCE = {
  'shea butter': ['west-african', 'caribbean', 'east-african', 'south-african', 'black-american'],
  'coconut oil': ['caribbean', 'south-asian', 'east-asian'],
  rosewater: ['arab', 'south-asian'],
  'argan oil': ['arab', 'black-american'],
  'aloe vera': ['caribbean', 'latina', 'black-american'],
  'castor oil': ['latina', 'east-african', 'black-american'],
  'moringa oil': ['east-african'],
  'marula oil': ['south-african'],
  rooibos: ['south-african'],
  frankincense: ['arab', 'east-african'],
  turmeric: ['south-asian'],
  'black seed oil': ['arab'],
  henna: ['south-asian', 'arab', 'east-african'],
};

export const BEAUTY_PSYCHOLOGY_DEEP_DIVE = {
  appearance_satisfaction: {
    title: 'The Psychology of Appearance Satisfaction',
    overview: 'Appearance satisfaction is distinct from objective attractiveness. Research points to only a weak link between how one looks (by any external measure) and how one feels about it. What matters — for self-esteem, social confidence, and mental wellbeing — is the subjective sense of feeling cared-for, put-together, and aligned with one\'s own identity. This is why cultural beauty norms matter: a Black woman in a natural hair community who has learned to see her coils as beautiful is likely to feel better about her appearance than the same woman pressured to chemically straighten her hair for professional acceptance.',
    key_research_findings: [
      {
        finding: 'Appearance satisfaction predicts self-esteem more than objective attractiveness ratings',
        implication: 'Beauty rituals that improve how one feels about one\'s appearance have mental health benefits independent of any change in how one actually looks.',
      },
      {
        finding: 'Cultural beauty norms moderate appearance satisfaction',
        implication: 'Communities with affirming internal beauty standards buffer their members from the psychological harm of external dominant-culture beauty standards.',
      },
      {
        finding: 'The act of self-care predicts appearance satisfaction independently of its cosmetic outcomes',
        implication: 'Doing a beauty ritual — regardless of outcome — improves how people feel about their appearance. The care itself is the intervention.',
      },
      {
        finding: 'Social comparison on appearance is linked to depression and anxiety',
        implication: 'Social media that centres filtered, edited, high-production beauty imagery increases appearance-related distress. Communities that centre diverse beauty depictions protect their members.',
      },
    ],
  },
  touch_science: {
    title: 'The Neuroscience of Beauty Touch',
    sections: [
      {
        name: 'C-Tactile Afferents and Social Touch',
        content: 'C-tactile (CT) afferents are unmyelinated nerve fibres in the skin that respond preferentially to light, slow, stroking touch (1–10 cm/s). Unlike fast, discriminative touch (which travels A-beta fibres), CT-afferent signals route to the insular cortex — the emotional brain — and trigger oxytocin release and reduced activation of threat-processing systems. The grooming, braiding, and slow massage techniques described throughout these guides are, physiologically, direct stimulants of this system.',
      },
      {
        name: 'Self-Touch and Cortisol',
        content: 'Self-administered touch activates CT afferents less potently than touch from another person, but still helps. Many people find self-massage (abhyanga, gua sha, scalp massage) lifts their mood. The engagement of attentional resources during self-touch — focusing on sensation rather than thought — can also quiet rumination.',
      },
      {
        name: 'Temperature and the Nervous System',
        content: 'Beauty rituals involving temperature — warm oil, steam rooms, hot baths, cold sea water, cool rosewater mists — leverage thermoreceptor systems to shift autonomic state. Warmth activates parasympathetic dominance (relaxation); sudden cold activates the dive reflex (heart rate slowing, calm alertness). The hammam, jimjilbang, and sea bathing traditions documented in these guides are sophisticated applications of thermal nervous-system regulation that predate the scientific description of the mechanism by millennia.',
      },
      {
        name: 'Rhythm and the Autonomic Nervous System',
        content: 'Rhythmic repetitive actions — brush strokes, circular massage movements, braiding patterns, the back-and-forth of a facial roller — synchronise with and can shift breathing patterns, which directly influence heart rate variability (HRV). Higher HRV is associated with greater autonomic flexibility, better emotional regulation, and lower baseline anxiety. Beauty rituals are, in this sense, biofeedback-adjacent practices: the slow, rhythmic physical activity trains the body\'s stress response.',
      },
    ],
  },
  scent_and_emotion: {
    title: 'Olfactory Science in Cultural Beauty Practice',
    overview: 'Smell is unusual among the senses: signals from the nose reach emotion and memory areas (the amygdala and hippocampus) without first passing through the thalamus, which helps explain why a scent can bring back a feeling or memory so quickly. Cultural beauty traditions that centre fragrance — Arab oud culture, Ayurvedic plant oils, Caribbean coconut, West African shea — put this connection to use.',
    key_scents_and_effects: [
      {
        scent: 'Rose (Rosa damascena)',
        effect: 'Small studies report reduced anxiety and lower heart rate after inhaling rose scent',
        traditions: ['Arab', 'South Asian'],
      },
      {
        scent: 'Frankincense / olibanum',
        effect: 'Sacred associations can make it feel calming; a frankincense compound (incensole acetate) reduced anxiety-like behaviour in a 2008 mouse study',
        traditions: ['Arab', 'East African'],
      },
      {
        scent: 'Coconut',
        effect: 'Strongly positive emotional associations in cultures where it is embedded in care memories; mood-lifting through learned association',
        traditions: ['Caribbean', 'South Asian', 'East Asian'],
      },
      {
        scent: 'Sandalwood',
        effect: 'Grounding; small studies point to calming effects',
        traditions: ['South Asian', 'East Asian'],
      },
      {
        scent: 'Ylang ylang',
        effect: 'Small studies report lower blood pressure and a calmer state after inhalation',
        traditions: ['West African', 'Caribbean'],
      },
      {
        scent: 'Lavender',
        effect: 'The most studied calming botanical scent; used across traditions',
        traditions: ['cross-cultural'],
      },
      {
        scent: 'Jasmine',
        effect: 'Often described as uplifting rather than sedating; associated with confidence and energy',
        traditions: ['South Asian', 'Arab'],
      },
      {
        scent: 'Vetiver',
        effect: 'Earthy and grounding; used in Ayurveda for calm',
        traditions: ['South Asian', 'Caribbean'],
      },
    ],
    practice_note: 'For diaspora communities, maintaining access to the scents of the culture of origin is a specific mental health recommendation — olfactory anchors to home, family, and belonging that can be activated in moments of displacement-related distress.',
  },
};

export const EXTENDED_RITUAL_GUIDES = {
  'west-african': {
    additional_rituals: [
      {
        name: 'Ghassoul and Clay Mask Traditions',
        origin: 'North and West African border traditions',
        mental_health_function: 'Sensory regulation, skin purification ritual, slowing down',
        description: 'Clay masking traditions across West Africa — from kaolin-based masks in West African healing to imported rhassoul clay from the Atlas Mountains — share a common mental health structure: they impose stillness. You cannot run around with a clay mask on your face. You must sit, let it dry, and wait. This enforced pause, embedded in a beauty ritual, provides a regular structured rest period that is often absent from stressed, busy lives. The clay\'s drawing action on the skin is also tactilely satisfying — a physical metaphor for releasing what needs to be released.',
        diy_guide: 'Kaolin clay mixed with rosewater and a teaspoon of raw honey: anti-inflammatory, gentle brightening, suitable for most skin types. Apply, rest for 10–15 minutes in a comfortable position, rinse with warm water, follow with shea butter.',
      },
      {
        name: 'Communal Night Beauty Rituals',
        origin: 'West African household tradition',
        mental_health_function: 'End-of-day nervous system transition, intergenerational bonding',
        description: 'In traditional West African households, the evening is a time of communal physical care: children are bathed, hair is oiled or tied down, skin is buttered, and preparations are made for sleep. This nightly ritual creates a predictable sensory sequence that signals to the nervous system that the day\'s alertness is no longer required. Predictable bedtime routines help many people fall asleep more easily, which matters most during stressful periods. Recreating this ritual in diaspora settings, even as a solo practice, is a meaningful sleep-hygiene and mental health intervention.',
      },
    ],
    stress_protocol: {
      name: 'West African Stress Recovery Beauty Protocol',
      steps: ['Warm bath or shower with black soap to cleanse and reset', 'Shea butter body massage from feet to shoulders, using slow circular strokes', 'Warm baobab or coconut oil applied to scalp with 10-minute self-massage', 'Cover hair with a satin bonnet to protect and signal rest', 'Optional: burn frankincense or an oud candle for olfactory grounding', 'Rest with intention: the body has been cared for; it is safe to rest'],
    },
  },
  'south-asian': {
    additional_rituals: [
      {
        name: 'Facial Steaming with Herbs',
        origin: 'Ayurvedic and South Asian home tradition',
        mental_health_function: 'Slow breathing, skin cleansing, meditative pause',
        description: 'Herbal facial steaming — boiling water with neem leaves, turmeric, rose petals, or tulsi (holy basil) and tenting the face over the bowl — is a traditional preparation for other treatments (masks, oiling) but also stands alone as a grounding practice. The steam forces slow, deep breathing. The medicinal herbs add their specific properties: neem is traditionally used as antimicrobial; tulsi is a traditional calming herb; rose is calming. The 10 minutes of enforced gentle breathing over a bowl of fragrant steam is a complete mindfulness protocol in disguise.',
        recipe: 'Boil 1 litre of water. Add 5 neem leaves, 1 tsp turmeric, 10 rose petals, and a sprig of fresh tulsi if available. Steep 3 minutes off heat. Tent face over bowl with a towel, eyes closed, breathing deeply for 8–10 minutes. Keep a comfortable distance from the water to avoid steam burns.',
      },
      {
        name: 'Ayurvedic Colour Therapy in Beauty',
        origin: 'Traditional Ayurvedic practice (chromotherapy)',
        mental_health_function: 'Mood regulation through intentional colour environment, beauty as holistic wellness',
        description: 'Ayurveda recognises colour as medicine (chromotherapy). The colours worn, the colours of beauty products, and the colours of the self-care environment all influence mental state. Vata imbalances (anxiety, insomnia, mental scatter) are calmed by warm, golden tones — which is part of why golden sesame oil for abhyanga and yellow turmeric face treatments have a holistic as well as physiological rationale in the Ayurvedic system.',
      },
    ],
    stress_protocol: {
      name: 'South Asian Stress Recovery Beauty Protocol',
      steps: ['Warm sesame oil abhyanga from head to toe — 20 minutes of slow, full-body self-massage', 'Rest in the oil for 15 minutes if possible (shirodhara approximation: rest with oil on scalp)', 'Warm herbal bath with turmeric and rose petals', 'Post-bath ubtan scrub to exfoliate and brighten', 'Castor oil on eyebrows as a conditioning step', 'Tulsi or another caffeine-free tea to close the ritual'],
    },
  },
  caribbean: {
    additional_rituals: [
      {
        name: 'Bay Rum Aftershave and Grooming',
        origin: 'Caribbean tradition, particularly Barbados and Grenada',
        mental_health_function: 'Post-shave ritual completion, masculine self-care normalisation, heritage connection',
        description: 'Bay rum (distilled from West Indian bay leaves with rum or alcohol base) has been the definitive Caribbean grooming product for men since the 19th century. Its sharp, warm, medicinal-sweet scent is a strong olfactory anchor for Caribbean masculine identity. For Caribbean men in diaspora, the bay rum aftershave ritual is one of the few inherited culturally specific self-care practices. Using it deliberately, as a daily transition ritual (signalling the end of shaving, the beginning of the day), leverages olfactory anchoring for mood and identity stability.',
      },
      {
        name: 'Sorrel and Hibiscus Beauty Applications',
        origin: 'Caribbean herbal tradition',
        mental_health_function: 'Antioxidant skin support, cultural connection through scent and colour',
        description: 'Hibiscus (dried sorrel flowers, Hibiscus sabdariffa) — used in Caribbean drinks, rituals, and increasingly skincare — contains anthocyanins and AHAs (alpha-hydroxy acids) that gently exfoliate and brighten skin. As a hair rinse, the mucilaginous quality of hibiscus enhances slip and detangling in natural and curly hair. The vivid red of hibiscus-steeped water is visually striking and its light floral-tart scent is a strong Caribbean sensory anchor. Steeping a pot of hibiscus — for drinking and for using as a skin toner — is a simple, affordable ritual that connects to Caribbean botanical knowledge.',
      },
    ],
    stress_protocol: {
      name: 'Caribbean Stress Recovery Beauty Protocol',
      steps: ['Epsom salt and coconut milk bath (approximates mineral-rich sea bathing)', 'Raw coconut oil full-body application while skin is damp from bath', 'Hibiscus hair rinse or coconut milk deep conditioning treatment', 'Bay rum splash for a sensory reset (keep citrus off skin before going in the sun)', 'Music: put on soca, reggae, or calypso — the rhythm is medicine', 'If possible: call home, or call community — the Caribbean mental health protocol includes contact'],
    },
  },
  arab: {
    additional_rituals: [
      {
        name: 'Oud Perfume as Emotional Regulation',
        origin: 'Arabian Gulf and Levantine tradition',
        mental_health_function: 'Identity anchoring, emotional memory activation, ritual completion marker',
        description: 'Oud (agarwood resin oil) is among the most expensive and emotionally resonant materials in the world of fragrance. In Arab culture, it is applied before gatherings, before prayer, before important events — it is a social and spiritual signal, not just a personal preference. The layering of oud over rose, musk, or amber is a fragrance composition practice with centuries of refinement. For Arab diaspora communities, the smell of oud is one of the most potent olfactory anchors to home, family, and cultural identity. Using it deliberately — in beauty rituals, before significant moments — activates these associations and provides identity stability in environments that may challenge Arab cultural belonging.',
        modern_alternatives: 'Authentic oud is very expensive; perfumes with a synthetic oud accord approximate its warmth and depth at many price points.',
      },
      {
        name: 'Turmeric and Saffron Face Treatments',
        origin: 'Arabian and Levantine cooking-to-beauty crossover',
        mental_health_function: 'Skin brightening, anti-inflammatory treatment, luxury sensory ritual',
        recipe: '5–6 saffron threads steeped in 2 tablespoons warm whole milk for 10 minutes. Add 1 teaspoon honey. Apply to face, rest for 15 minutes. Rinse and follow with rosewater toner and argan oil.',
      },
    ],
    stress_protocol: {
      name: 'Arab Stress Recovery Beauty Protocol',
      steps: ['Hammam-style steam shower: as hot as comfortable, for 10 minutes', 'Ghassoul or black soap scrub with kessa mitt while steam is still on', 'Cool rinse to finish', 'Argan oil full-body application while damp', 'Rosewater facial mist and argan face oil', 'Oud or rosewater on pulse points — the final sensory signal of the ritual', 'Sit with qahwa (Arabic coffee) or mint tea — the transition to intentional rest'],
    },
  },
  latina: {
    additional_rituals: [
      {
        name: 'Marigold and Herbs in Beauty Traditions',
        origin: 'Mesoamerican and Latinx folk tradition',
        mental_health_function: 'Spiritual protection during beauty ritual, connection to indigenous botanical knowledge',
        description: 'Cempasúchil (Aztec marigold, Tagetes erecta) appears in Day of the Dead altars and in folk healing across Mexico and Central America. Calendula (a European cousin) has been absorbed into Latinx herbal beauty practice for its anti-inflammatory properties — calendula-infused oil soothes rashes, relieves sunburn, and heals cracked skin. The ritual of infusing oils with herbs — slow, warm, patient, fragrant — is itself a mindfulness practice with a Mesoamerican lineage. The resulting oil carries both the functional benefit of the plant compounds and the care embedded in its making.',
      },
      {
        name: 'The Limpia Smoke Ritual for Beauty and Emotional Clearing',
        origin: 'Mesoamerican curanderismo tradition',
        mental_health_function: 'Ritual completion, intention-setting, cortisol reduction through structured ceremony',
        description: 'Copal incense — burned in Mesoamerican ceremonial contexts since pre-Columbian times — has been adopted into Latinx beauty ritual as a way of "clearing" a space before a beauty gathering or following a particularly difficult emotional experience. The smoke, the scent (resinous, piney, slightly sweet), and the intention behind burning it create a sensory-ritual frame that signals the nervous system to shift state. Paired with sage, lavender, or rosemary in some traditions, the smoke ritual can precede a beauty treatment as a deliberate transition out of stress-state. A ritual can mark a change of state whether or not it is believed in metaphysically.',
      },
    ],
    stress_protocol: {
      name: 'Latina Stress Recovery Beauty Protocol',
      steps: ['Prepare a tea of manzanilla (chamomile) and canela (cinnamon): drink one cup before beginning', 'Warm oil scalp massage with castor and coconut oil — 15 minutes', 'Avocado and honey deep conditioning hair mask (apply, cover with shower cap, 30 minutes)', 'Rosewater or cucumber facial mist and honey mask on face while hair mask sits', 'Rinse both, follow with aloe vera gel on skin and coconut oil on hair', 'Optional: light copal or sage — the ritual close', 'Call your grandmother, or someone who knows your grandmother\'s remedies'],
    },
  },
  'east-asian': {
    additional_rituals: [
      {
        name: 'Sheet Mask as Enforced Rest',
        origin: 'Korean beauty tradition',
        mental_health_function: 'Mandatory pause, skin hydration surge, sensory pleasure',
        description: 'The sheet mask doubles as an enforced rest. The mask must be applied precisely to the face, left completely still for 15–20 minutes, and during that time normal activity is significantly limited (you cannot easily look at a phone, type, or eat). The enforced rest period is the primary mental health benefit — an analogue to a brief meditation session, with the added sensory benefit of cool, serum-soaked fabric on the skin. The occlusive effect delivers a significant hydration spike to the epidermis, providing immediate skin softness that enhances appearance satisfaction.',
        types_and_mood_targets: [
          { type: 'Centella asiatica (tiger grass) sheet mask', mood_target: 'Anxiety and inflammation — cica is specifically anti-stress for both skin and, anecdotally, mental state' },
          { type: 'Green tea sheet mask', mood_target: 'Antioxidant protection; EGCG has skin anti-inflammatory properties; green tea scent is mild and grounding' },
          { type: 'Rose sheet mask', mood_target: 'Brightening and mood-lifting through rosewater olfactory pathway' },
          { type: 'Mugwort (ssuk) sheet mask', mood_target: 'Traditional Korean soothing herb; anti-inflammatory; earthy scent is grounding' },
        ],
      },
      {
        name: 'Hanbang — Korean Traditional Beauty Medicine',
        origin: 'Korean traditional medicine (한방, hanbang)',
        mental_health_function: 'Holistic stress care, traditional herbal ingredients, inner-outer health connection',
      },
    ],
    stress_protocol: {
      name: 'East Asian Stress Recovery Beauty Protocol',
      steps: ['Begin with oil cleanse — warm circular motions on face for 60 seconds before emulsifying', 'Water cleanse with lukewarm (not hot) water — cool water rinse to finish', 'Toner patting: pour a few drops into palms, press gently into face 7–8 times', 'Ampoule or serum with ginseng or centella asiatica', 'Sheet mask for 20 minutes — device-free, reclined if possible', 'Gua sha for 8–10 minutes on face and neck — slow, upward strokes', 'Seal with moisturiser and SPF (morning) or sleeping mask (evening)', 'Optional: matcha or hojicha tea as the ritual\'s sensory close'],
    },
  },
  'east-african': {
    additional_rituals: [
      {
        name: 'Moringa Leaf Beauty — Inside and Out',
        origin: 'East and West African tradition',
        mental_health_function: 'Nourishing food and skin care, local botanical pride',
        description: 'Moringa oleifera (the "miracle tree", native to South Asia) is grown widely in East Africa and used in traditional nutrition. Moringa leaf powder contains vitamin C, iron and calcium, and is added to food as a green. Topically, moringa oil (cold-pressed from the seeds) is rich in oleic acid and contains behenic acid, which is used in hair conditioners. Using moringa both in beauty and in food reflects an East African approach to beauty in which the inside and outside are connected.',
        use_guidance: 'Moringa oil on face as a lightweight facial oil for dry and combination skin. Moringa powder in a face mask (with honey and rosewater): gentle brightening and nutrient delivery. Moringa powder in morning porridge (ugali, injera side) for nutritional support during high-stress periods.',
      },
      {
        name: 'Incense and Smoke Beauty Rituals',
        origin: 'Horn of Africa and Swahili coast traditions',
        mental_health_function: 'Spiritual protection, olfactory nervous system regulation, ceremonial preparation',
        description: 'Incense is central to East African beauty preparation. In Somali culture, incense burned in a clay burner (dabqaad) is used to perfume clothes and hair. Myrrh, frankincense, and oud chips produce a warm, resinous body fragrance that lasts hours. Ethiopian church incense (primarily frankincense and myrrh) permeates Ethiopian cultural and aesthetic life. The ritualistic use of smoke in preparation for gatherings, ceremonies, and community events creates a shared olfactory environment that signals communal belonging — a comforting cue.',
      },
    ],
    stress_protocol: {
      name: 'East African Stress Recovery Beauty Protocol',
      steps: ['Begin with a full body wash using qasil or black soap — gentle and fragrant', 'Moringa or shea butter full body oil applied warm to damp skin', 'Frankincense or myrrh incense burning during the whole process', 'Scalp oiling with moringa or castor oil, 10-minute massage', 'If with community: singing during the process — even background traditional music serves the same neurochemical purpose', 'Rooibos or Ethiopian tea to close the ritual', 'Contact: text or call community — East African mental health is communal by design'],
    },
  },
  'south-african': {
    additional_rituals: [
      {
        name: 'Baobab Oil Body Care',
        origin: 'Southern African traditional use',
        mental_health_function: 'Skin barrier repair, ancestral ingredient connection, luxurious self-touch ritual',
        description: 'Baobab oil (from Adansonia digitata, the "tree of life") is extracted from the fruit of the baobab — one of the most iconic and revered trees of the African savanna. The oil is rich in omega-6 and omega-9 fatty acids and absorbs without greasiness. In traditional southern African practice, baobab oil was used on newborn skin, on elderly skin, and for everything between — a whole-life skin care ingredient. Its complete absorption makes it ideal for both face and body; its fatty acids support the skin barrier. Using baobab oil is an act of connection to the southern African landscape — and to the ancestral wisdom that identified this ingredient centuries before modern extraction technology.',
      },
      {
        name: 'Traditional Smoke Bath (Ukugeza Ngomusi)',
        origin: 'Zulu and Xhosa traditional practice',
        mental_health_function: 'Spiritual purification, sensory grounding, identity anchoring',
        description: 'In Zulu and Xhosa tradition, the smoke bath (in which medicinal plants are burned in a pit below a stool on which the person sits, allowing aromatic smoke to permeate the skin and body) serves both hygienic and spiritual functions. The plants used (which vary by region and healer knowledge) are chosen by the healer. The ceremonial structure of the practice — the preparation, the sitting, the exposure, the cooling — creates a complete state-transition ritual. Modern South African women, particularly those maintaining connection to traditional practice, incorporate simplified smoke-bath approximations into self-care using commercially available versions of traditional botanicals.',
      },
    ],
    stress_protocol: {
      name: 'South African Stress Recovery Beauty Protocol',
      steps: ['Rooibos bath: steep 6 bags in warm bathwater, soak for 20 minutes', 'While in the bath: rooibos-soaked muslin cloth as a facial compress', 'Baobab or marula oil applied to damp skin immediately post-bath', 'Scalp massage with moringa or marula oil — 10 minutes', 'Optional: rooibos toner on face, marula facial oil to seal', 'Traditional music or singing while completing routine', 'Ubuntu practice: share the protocol with someone else — beauty that is given away doubles'],
    },
  },
  'black-american': {
    additional_rituals: [
      {
        name: 'Hot Comb and Press Heritage',
        origin: 'Black American beauty tradition from post-Reconstruction era',
        mental_health_function: 'Cultural continuity, intergenerational memory, sensory-soothing ritual',
        description: 'The hot comb press — warming a metal comb on the stove and carefully straightening sections of natural hair — is a ritual with layered significance in Black American history. It enabled Black women to navigate white professional environments while maintaining community. It was (and is) a tactile, slow, intergenerational practice: the smell of warm hair and Dixie Peach pomade is an olfactory time machine for many Black Americans of a certain generation. Its revival in some communities is specifically about honoring the ingenuity of an earlier generation navigating impossible constraints — not endorsing those constraints. Understanding this distinction, and choosing hair practices with historical awareness, is part of the mental health work of Black American beauty.',
      },
      {
        name: 'Deep Condition Sunday — The Self-Care Anchor',
        origin: 'Black American natural hair community',
        mental_health_function: 'Weekly structured self-care ritual, reset and preparation, sensory luxury accessible to all budgets',
        description: 'In the Black American natural hair community, Sunday is often "wash day" — a practice that has become a cultural touchstone. The extended time required for washing, deep conditioning, detangling, and styling 4A/4B/4C hair turns a hair care necessity into a weekly self-care ritual. Deep conditioning (with store-bought conditioners, or DIY with avocado, honey, and oil) under heat (hooded dryer, steamer, or a warm towel) provides both hair benefit and enforced rest time. Many Black women report that wash day — once dreaded — has become one of their most grounding weekly practices when approached intentionally.',
        deep_conditioning_diy: '1 ripe avocado, 2 tablespoons of honey, 2 tablespoons of coconut oil, 1 tablespoon of castor oil. Blend smooth. Apply to hair from roots to ends. Cover with a shower cap and warm towel. Rest for 30–45 minutes. Rinse thoroughly. Follow with a light leave-in conditioner and seal with a small amount of shea butter.',
      },
    ],
    stress_protocol: {
      name: 'Black American Stress Recovery Beauty Protocol',
      steps: ['Set the scene: music you love, candles or a warm lamp, phone on do-not-disturb', 'Hot shower — let the water be as warm as comfortable, stand under it for at least 5 minutes', 'DIY deep conditioning hair mask applied and covered with shower cap', 'Honey or clay face mask while hair mask processes', 'Remove both masks; apply leave-in and shea to hair, vitamin C serum and moisturiser to face', 'Edge control and style — the act of mastery and presentation', 'SPF in the morning: the final protective act', 'Optional: call the salon — sometimes the beauty protocol needs a professional and a community'],
    },
  },
};

export const MENTAL_HEALTH_CRISIS_RESOURCES = {
  note: 'Beauty rituals can support wellbeing, but they are not a substitute for professional care. If you or someone you know is in crisis or thinking about suicide, contact one of these services now. If you are in immediate danger, call your local emergency number.',
  global: [
    { name: 'International Association for Suicide Prevention', url: 'https://www.iasp.info/resources/Crisis_Centres/' },
    {
      name: 'Crisis text lines',
      contact: 'US: text HOME to 741741 (Crisis Text Line). UK: text SHOUT to 85258 (Shout). Ireland: text 50808. Canada: text CONNECT to 686868 (Kids Help Phone, any age), or text 9-8-8',
    },
  ],
  by_region: {
    'united-states': [
      { name: '988 Suicide and Crisis Lifeline', contact: 'Call or text 988 (24/7)' },
      { name: 'Therapy for Black Girls', url: 'therapyforblackgirls.com', note: 'Therapist directory; not a crisis line' },
      { name: 'Loveland Foundation', url: 'lovelandfoundation.org', note: 'Therapy grants for Black women and girls; not a crisis line' },
      { name: 'Latinx Therapy', url: 'latinxtherapy.com', note: 'Therapist directory; not a crisis line' },
      { name: 'Asian Mental Health Project', url: 'asianmentalhealthproject.com', note: 'Resources and community; not a crisis line' },
      { name: 'Soch Mental Health', url: 'sochmentalhealth.com', note: 'South Asian mental health (US); not a crisis line' },
    ],
    'united-kingdom': [
      { name: 'Samaritans', contact: '116 123 (free, 24/7)' },
      { name: 'Shout', contact: 'Text SHOUT to 85258 (free, 24/7)' },
      { name: 'Black Minds Matter UK', url: 'blackmindsmatteruk.com', note: 'Connects Black people with therapists; not a crisis line' },
    ],
    canada: [
      { name: '9-8-8 Suicide Crisis Helpline', contact: 'Call or text 9-8-8 (24/7)' },
      { name: 'Kids Help Phone', contact: '1-800-668-6868, or text CONNECT to 686868 (24/7)' },
      { name: 'Black Youth Helpline', contact: '1-833-294-8650', note: 'Support for Black youth and families, 9 am–10 pm; not a crisis line' },
    ],
    'south-africa': [
      { name: 'SADAG Suicide Crisis Helpline', contact: '0800 567 567', url: 'sadag.org' },
      { name: 'SADAG Cipla Mental Health Helpline', contact: '0800 456 789, or SMS 31393' },
      { name: 'Lifeline South Africa', contact: '0861 322 322' },
    ],
    australia: [
      { name: 'Lifeline', contact: '13 11 14 (24/7)' },
      { name: 'Black Dog Institute', url: 'blackdoginstitute.org.au', note: 'Information and research; not a crisis line' },
    ],
  },
};

export const HAIR_MENTAL_HEALTH_SCIENCE = {
  telogen_effluvium: {
    title: 'Stress Hair Loss: A Guide for Ethnic Hair Types',
    overview: 'Telogen effluvium (TE) is the medical name for stress-related hair shedding. After a major physical or emotional stress, more follicles than usual move from the growth phase (anagen) to the resting/shedding phase (telogen). Shedding usually shows up about two to three months after the triggering event, which can make the connection confusing. TE is usually temporary: once the stressor passes, regrowth typically follows over the next several months.',
    by_hair_type: [
      {
        type: 'Type 4 (coily)',
        specific_concerns: ['Shed hairs often stay caught in coils, so shedding can look sudden when it comes out all at once on wash day or in a comb', 'Protective styles can mask shedding and make it harder to detect TE early — important to check the scalp directly', 'Traction from tight protective styles can compound stress-related shedding with mechanical hair loss (traction alopecia)'],
      },
      {
        type: 'Type 3 (curly)',
        specific_concerns: ['Shedding can be confused with the normal shed hairs trapped in curls and released during detangling', 'Notice whether you are shedding noticeably more than usual over several washes, rather than counting single days', 'Curly hair benefits from protein–moisture balance support during TE recovery'],
      },
      {
        type: 'Type 1–2 (straight/wavy)',
        specific_concerns: ['Shedding is often most visible on straight hair textures — in the shower drain, on pillowcases, in brushes', 'Scalp sebum distribution is most efficient on straight hair, which may slightly buffer scalp health during stress; however, excess sebum under stress can clog follicles'],
      },
    ],
    universal_recovery_protocol: ['Go easy on heat styling and chemical processing while shedding is active', 'Gentle scalp massage for 5–10 minutes a day, as a calming ritual', 'Eat enough protein: hair is mostly keratin', 'Ask your doctor to check iron levels — iron deficiency is a common co-trigger, especially in women', 'See a doctor if shedding lasts more than six months, or comes with patches, scalp pain or other symptoms', 'Patience: regrowth takes months, and the "baby hair" phase is normal'],
  },
  hair_and_identity: {
    title: 'Hair as Identity: The Mental Health Significance Across Communities',
    entries: [
      {
        community: 'Black American and Afro-Caribbean',
        narrative: 'Hair has been central to Black identity and political struggle in ways that have no parallel in other communities. The Afro as a symbol of Black Power, the systematic denigration of "nappy" hair, the CROWN Act as legislative recognition of hair discrimination — these are not marginal events. The mental health dimension of hair for Black women and men is layered with this history. Natural hair movements are explicitly mental health movements: they work to decouple appearance satisfaction from assimilation pressure.',
      },
      {
        community: 'South Asian',
        narrative: 'Long, thick, oiled hair has been the traditional ideal of beauty across South Asia — a direct extension of Ayurvedic health ideals in which lustrous hair signals vitality. The champi tradition is inseparable from this: caring for hair is caring for health. For South Asian women in diaspora who face pressure to westernise their appearance (including removing cultural hair practices from the workplace), the choice to oil, braid, or wear a traditional style is an identity statement with mental health stakes.',
      },
      {
        community: 'Latina',
        narrative: 'Hair politics in Latinx communities involve the tension between the straight-hair ideal (reflecting European beauty standards) and the curly, wavy, and kinky textures of Indigenous and African heritage. The "pelo malo" (bad hair) versus "pelo bueno" (good hair) dichotomy is a direct manifestation of colorism in the beauty domain. The curly/natural hair movement in Latinx communities mirrors the Black natural hair movement in its psychological liberation dimension.',
      },
      { community: 'East Asian' },
      {
        community: 'West African and East African',
        narrative: 'Hair in West and East African traditions carries social information: age, marital status, ethnicity and community affiliation have historically been shown through hair styling. The communal nature of braiding — sitting together for hours, sharing knowledge, keeping social bonds — gives hair its social weight beyond looks. For diaspora communities, the braiding salon is one of the spaces where this social function lives on.',
      },
    ],
  },
};

export const SKIN_MICROBIOME_STRESS_SCIENCE = {
  overview: 'The skin microbiome — the community of bacteria, fungi, and viruses living on the skin\'s surface — is a key regulator of skin health, immune function, and barrier integrity. Chronic stress disrupts the skin microbiome in documented ways, creating dysbiosis that amplifies inflammation, worsens acne, and increases sensitivity.',
  stress_disruption_mechanisms: [
    {
      mechanism: 'Cortisol alters sebum composition',
      detail: 'Stress-elevated cortisol changes the fatty acid composition of sebum, creating an environment more favourable to Cutibacterium acnes proliferation and less favourable to commensal bacteria (such as Staphylococcus epidermidis and Corynebacterium) that normally protect the skin.',
    },
    {
      mechanism: 'Barrier dysfunction creates dysbiosis',
      detail: 'When the skin barrier is compromised by stress-driven ceramide reduction, the relative humidity and pH of the skin surface shift — creating conditions that advantage pathogenic organisms over commensal ones.',
    },
    {
      mechanism: 'Psychological stress suppresses skin immune response',
      detail: 'Psychological stress reduces Langerhans cell activity in the skin — these dendritic immune cells are the first line of pathogen defence. A stressed immune system is less able to regulate microbial communities effectively.',
    },
  ],
  microbiome_supporting_beauty_practices: [
    {
      practice: 'Probiotic-based skincare',
      note: 'Topical lactobacillus ferment and probiotic lysates have growing evidence for restoring barrier function and reducing inflammation. Particularly relevant for stress-related acne and eczema flares.',
    },
    {
      practice: 'Avoid over-cleansing',
      note: 'Aggressive cleansers with high alcohol or sulfate content strip commensal bacteria along with sebum. During high-stress periods when the microbiome is already disrupted, switching to gentle, pH-balanced cleansers preserves microbial diversity.',
    },
    {
      practice: 'Prebiotic ingredients',
      note: 'Inulin, beta-glucan, and other prebiotic compounds in skincare feed commensal bacteria and support their protective functions. Oat-based products, honey, and aloe vera all have prebiotic properties.',
    },
    { practice: 'Fermented beauty ingredients', note: 'Fermented ingredients common in Korean skincare (galactomyces, bifida ferment lysate, fermented rice water) are studied for barrier support.' },
  ],
  community_specific_microbiome_notes: {
    'oily-skin-types': 'Oily skin creates a microbiome environment more prone to Cutibacterium acnes overgrowth during stress. Niacinamide (which can reduce oiliness) and azelaic acid (which is antimicrobial) are useful microbiome-supportive options for oily skin.',
    'dry-climate-skin': 'In arid climates (Middle East, parts of East Africa and South Africa), lower skin surface humidity reduces microbial diversity and increases the risk of dysbiosis. Heavy occlusives (shea, petrolatum, cocoa butter) protect barrier function and maintain the moisture environment the microbiome requires.',
  },
};

export const RITUAL_DESIGN_PRINCIPLES = {
  title: 'How to Design a Calming Beauty Ritual',
  overview: 'Not every routine feels restful. The difference between a rushed, anxiety-driven skincare session and a deliberate, calming ritual is not primarily about products — it is about structure, intention, and sensory engagement. These principles apply across all nine communities documented in this guide.',
  principles: [
    {
      name: 'Temporal boundedness',
      description: 'A ritual has a beginning, a middle, and an end. It marks a transition. The most effective mental health beauty rituals create a clear temporal boundary: a designated time that is protected from other demands. Even 10 minutes is sufficient if it is genuinely set apart.',
      practical_application: 'Light a candle at the beginning and blow it out at the end. Put a specific playlist on that plays only during the ritual. These temporal anchors signal to the brain that a different mode of engagement is in effect.',
    },
    {
      name: 'Sensory layering',
      description: 'The most absorbing beauty rituals engage multiple senses simultaneously: touch (massage, texture), smell (botanical oils, candles), sound (music, ambient), temperature (warm oil, cool mist). Engaging multiple sensory modalities narrows attentional focus to the present moment more effectively than any single-sense experience.',
      practical_application: 'Build your ritual to include: one tactile element (massage, mask), one olfactory element (scented product, candle, incense), and one auditory element (music or silence). Temperature contrast is a powerful add-on.',
    },
    {
      name: 'Sequentiality and repetition',
      description: 'The same sequence performed repeatedly becomes a conditioned relaxation cue. The brain begins to associate the first step of the ritual with the relaxed state of the full ritual. This is classical conditioning applied beneficially: after enough repetitions, smelling your cleanser alone is enough to begin the parasympathetic shift.',
      practical_application: 'Use the same products in the same order every time. Do not experiment with new products in a ritual context — novelty requires cognitive engagement that disrupts the relaxation response.',
    },
    {
      name: 'Absence of performance',
      description: 'A mental health beauty ritual is not a social performance or content creation opportunity. Taking selfies during the process, broadcasting on social media, or performing for an imagined audience activates social-evaluation anxiety, which is precisely the opposite of what the ritual is designed to achieve.',
      practical_application: 'Do your ritual without documentation. The experience, not the record of the experience, is the intervention.',
    },
    {
      name: 'Cultural grounding',
      description: 'Rituals drawn from your own heritage carry memories and meaning that an unfamiliar practice may not. The scents, textures and stories of ancestral beauty practices can make a routine feel like home.',
      practical_application: 'Identify at least one element in your routine that comes from your own cultural heritage — an ingredient, a technique, a scent. Anchor your modern routine in ancestral knowledge, even if only in this one element.',
    },
    {
      name: 'Receiving care, not just giving it',
      description: 'The communities in this guide that have the most robust beauty-as-mental-health traditions share a common feature: the beauty ritual involves receiving care from another person, not just self-administering. Being cared for by someone else feels different from self-care, and both have a place.',
      practical_application: 'Prioritise communal beauty experiences — salon appointments, braiding sessions, spa visits with a friend — as dedicated mental health time, not as luxury indulgences. They are not the same thing.',
    },
  ],
};

export const SEASONAL_BEAUTY_MENTAL_HEALTH = {
  title: 'Beauty Rituals Across the Year: Seasonal Adjustment for Mental Health',
  overview: 'Mental health and skin health both shift with the seasons, and beauty rituals that ignore these cycles miss an important opportunity for calibration. Across the nine communities documented here, seasonal beauty practice is embedded in cultural calendars — Ramadan skin adjustments, Diwali beauty preparation, Carnival embodiment, harvest-festival adornment — each reflecting the community\'s embedded wisdom about how the body, mind, and environment interact across the year.',
  seasons: [
    {
      season: 'Winter',
      mental_health_concerns: ['Seasonal Affective Disorder (SAD)', 'Reduced social contact', 'Reduced UV-driven vitamin D synthesis', 'Holiday-related family stress'],
      skin_concerns: ['Barrier compromise from cold, dry air and central heating', 'Increased eczema and psoriasis flares', 'Dull complexion from reduced circulation'],
      beauty_adjustments: ['Switch to richer occlusives: shea butter, cocoa butter, marula oil over lighter serums', 'Reduce exfoliation frequency — a compromised barrier cannot tolerate the additional stress', 'Add a facial oil as final step of every routine', 'Ask your doctor about vitamin D in winter — deeper skin tones make less vitamin D from limited winter sun', 'Use warm, golden-scented products (frankincense, sandalwood, amber) to compensate for the olfactory flatness of winter environments'],
      community_winter_practices: {
        'west-african': 'Shea butter application frequency increases in harmattan season (dry West African winter)',
        'south-asian': 'Sesame oil abhyanga is most recommended in winter in Ayurvedic calendars — it is warming and barrier-protecting',
        arab: 'Hammam frequency traditionally increases in winter — the warmth and steam are antidotes to cold and darkness',
        'black-american': 'Heavier hair butters and protective styles shelter natural hair from cold, dry winter air',
      },
    },
    {
      season: 'Spring',
      mental_health_concerns: ['Adjustment energy — motivation returning after winter; anxiety about change', 'Allergen-driven skin reactivity'],
      skin_concerns: ['Sensitivity increases as skin adapts to changing humidity', 'Allergy-driven inflammation and itching', 'UV exposure increasing — SPF must be revisited'],
      beauty_adjustments: ['Reintroduce exfoliation gently — one per week to start', 'Check SPF and upgrade if winter protection was lower', 'Add niacinamide or azelaic acid for any hyperpigmentation that deepened over winter', 'Reassess hair porosity — winter product build-up may require a clarifying wash', 'Lighter, water-based hydration can replace winter occlusives for most skin types'],
    },
    {
      season: 'Summer',
      mental_health_concerns: ['Heat-related irritability and fatigue', 'Body image pressure from summer dress norms', 'Festival and event social anxiety', 'For many diaspora communities, increased contact with country of origin raises complex emotions'],
      skin_concerns: ['Highest UV exposure — SPF most critical', 'Increased sweating and congestion', 'Chlorine and salt water exposure dehydrating hair and skin', 'Hyperpigmentation risk peaks'],
      beauty_adjustments: ['SPF50 broad-spectrum, every day, reapplied every 2 hours during outdoor exposure — non-negotiable across all skin tones', 'Light, gel-based moisturisers over heavy creams in humid heat', 'Vitamin C serum in the morning: photoprotective and brightening while UV exposure is highest', 'After sea or pool: rinse immediately, deep condition hair, apply soothing aloe to skin', 'Rose water facial mist throughout the day for sensory cooling and mood regulation'],
      community_summer_practices: {
        caribbean: 'Sea bathing frequency increases; coconut oil as after-sun repair',
        'south-asian': 'Ubtan scrubs increase before monsoon season; sandalwood paste applied for cooling',
        latina: 'Sunscreen use is actively promoted in modern Latinx skin-positive movements against the historical underuse driven by the myth that brown skin doesn\'t burn',
        arab: 'Ice-cold rosewater on face and neck for cooling; shade-seeking as a beauty-conscious heat management strategy',
      },
    },
    {
      season: 'Autumn/Fall',
      mental_health_concerns: ['Anticipatory anxiety about winter', 'Academic and work pressure as the year\'s busiest quarter begins', 'Grief for summer\'s social abundance'],
      skin_concerns: ['Barrier begins to need reinforcement as humidity drops', 'Hair may be more fragile after summer sun, chlorine, and salt exposure', 'Good season for addressing summer hyperpigmentation before UV exposure decreases'],
      beauty_adjustments: ['Begin transitioning back to richer moisturisers', 'Introduce a peptide or retinol product — autumn\'s lower UV makes this the best season to start', 'Deep conditioning treatments for summer-damaged hair', 'Vitamin C serum to address summer hyperpigmentation while still getting minimal sun', 'Scent transition: move toward warmer, woodsier fragrances that prepare the nervous system for the colder months ahead'],
    },
  ],
};

export const HORMONAL_BEAUTY_MENTAL_HEALTH = {
  title: 'Hormonal Transitions and Beauty-Mental Health Across Ethnic Communities',
  overview: 'Hormonal transitions — menstruation, pregnancy, postpartum, perimenopause, menopause — affect both mental health and skin/hair significantly, with community-specific cultural framing that shapes how these experiences are navigated.',
  transitions: [
    {
      transition: 'Menstrual Cycle',
      mental_health_dimension: 'PMDD and PMS cause cyclical mood changes for some menstruating people. In the luteal phase (roughly the two weeks before a period) many people notice more anxiety, irritability or low mood. Planning gentler, more generous self-care for those days is one way to meet that need.',
      skin_dimension: 'Luteal phase: progesterone increases sebum production, pores appear larger, acne is more likely. Follicular phase: oestrogen peaks, skin is at its most luminous and receptive to treatment.',
    },
    {
      transition: 'Pregnancy',
      skin_dimension: 'Melasma ("mask of pregnancy") is common, especially in medium and deeper skin tones (Fitzpatrick III–VI). Stretch marks are very common and are viewed very differently across cultures — some celebrate them; others use rich oils (argan, rosehip, shea) on them.',
      beauty_restrictions: 'Retinoids and hydroquinone are avoided in pregnancy, and strong salicylic acid peels are usually avoided. Commonly suggested alternatives: azelaic acid, niacinamide, vitamin C, mineral SPF, hyaluronic acid. Check any product with your doctor, midwife or pharmacist.',
    },
    {
      transition: 'Perimenopause and Menopause',
      mental_health_dimension: 'The menopausal transition brings oestrogen changes that can affect mood, sleep (hot flushes disrupt it) and sense of identity. How a person experiences it is shaped by how their family and community talk about ageing; framings that treat later life as a time of wisdom and standing can be a comfort.',
      skin_dimension: 'Oestrogen decline brings faster collagen loss in the first years after menopause, thinner and drier skin, and increased facial hair in some people. Hair thinning (female-pattern hair loss) is common. Skin may become more reactive as barrier function changes.',
      beauty_support: ['Peptide-rich serums to support collagen synthesis in the absence of oestrogen stimulation', 'Phytoestrogen ingredients (soy isoflavones, red clover) have some evidence for topical collagen support', 'Heavier moisturisation and barrier support becomes essential — upgrade occlusives', 'SPF remains critical — photoaging accelerates post-menopause', 'Scalp massage for comfort; ask a doctor about menopausal hair thinning'],
    },
  ],
};

export function getMentalHealthBeautyGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_MENTAL_HEALTH_BEAUTY_GUIDES['west-african'],
    'south-asian': ETHNIC_MENTAL_HEALTH_BEAUTY_GUIDES['south-asian'],
    'caribbean': ETHNIC_MENTAL_HEALTH_BEAUTY_GUIDES['caribbean'],
    'arab': ETHNIC_MENTAL_HEALTH_BEAUTY_GUIDES['arab'],
    'latina': ETHNIC_MENTAL_HEALTH_BEAUTY_GUIDES['latina'],
    'east-asian': ETHNIC_MENTAL_HEALTH_BEAUTY_GUIDES['east-asian'],
    'east-african': ETHNIC_MENTAL_HEALTH_BEAUTY_GUIDES['east-african'],
    'south-african': ETHNIC_MENTAL_HEALTH_BEAUTY_GUIDES['south-african'],
    'black-american': ETHNIC_MENTAL_HEALTH_BEAUTY_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

export function getAllMentalHealthBeautyGuides() {
  return ALL_COMMUNITY_IDS.map(id => ({
    communityId: id,
    guide: getMentalHealthBeautyGuide(id),
  }));
}

export function getSignatureRituals(communityId) {
  const guide = getMentalHealthBeautyGuide(communityId);
  if (!guide) return null;
  return guide.signature_rituals || [];
}

export function getMentalHealthContext(communityId) {
  const guide = getMentalHealthBeautyGuide(communityId);
  if (!guide) return null;
  return guide.mental_health_context || null;
}

export function getMentalHealthResources(communityId) {
  const guide = getMentalHealthBeautyGuide(communityId);
  if (!guide) return null;
  return guide.mental_health_resources || null;
}

export function searchRitualsByFunction(mentalHealthFunction) {
  const query = mentalHealthFunction.toLowerCase();
  const results = [];
  for (const id of ALL_COMMUNITY_IDS) {
    const guide = getMentalHealthBeautyGuide(id);
    if (!guide || !guide.signature_rituals) continue;
    for (const ritual of guide.signature_rituals) {
      if (ritual.mental_health_function && ritual.mental_health_function.toLowerCase().includes(query)) {
        results.push({
          communityId: id,
          communityName: guide.communityName,
          ritual,
        });
      }
    }
  }
  return results;
}

export function getCortisolScienceOverview() {
  return CORTISOL_SKIN_SCIENCE;
}

export function getUniversalBeautyMentalHealth() {
  return UNIVERSAL_BEAUTY_MENTAL_HEALTH;
}

export function getIngredientCommunities(ingredient) {
  const key = ingredient.toLowerCase();
  return INGREDIENT_CROSS_REFERENCE[key] || [];
}

export function getExtendedRitualGuide(communityId) {
  return EXTENDED_RITUAL_GUIDES[communityId] || null;
}

export function getStressRecoveryProtocol(communityId) {
  const extended = EXTENDED_RITUAL_GUIDES[communityId];
  if (!extended) return null;
  return extended.stress_protocol || null;
}

export function getAdditionalRituals(communityId) {
  const extended = EXTENDED_RITUAL_GUIDES[communityId];
  if (!extended) return [];
  return extended.additional_rituals || [];
}

export function getAllStressProtocols() {
  return ALL_COMMUNITY_IDS.map(id => ({
    communityId: id,
    protocol: getStressRecoveryProtocol(id),
  })).filter(item => item.protocol !== null);
}

export function getCrisisResources(region) {
  if (!region) return MENTAL_HEALTH_CRISIS_RESOURCES;
  const regionKey = region.toLowerCase().replace(/\s+/g, '-');
  return {
    global: MENTAL_HEALTH_CRISIS_RESOURCES.global,
    regional: MENTAL_HEALTH_CRISIS_RESOURCES.by_region[regionKey] || [],
  };
}

export function getScientificFoundations() {
  return {
    cortisol_science: CORTISOL_SKIN_SCIENCE,
    beauty_psychology: BEAUTY_PSYCHOLOGY_DEEP_DIVE,
    universal_concepts: UNIVERSAL_BEAUTY_MENTAL_HEALTH,
  };
}

export function getFullCommunityProfile(communityId) {
  const core = getMentalHealthBeautyGuide(communityId);
  const extended = getExtendedRitualGuide(communityId);
  if (!core) return null;
  return {
    ...core,
    additional_rituals: extended ? extended.additional_rituals : [],
    stress_protocol: extended ? extended.stress_protocol : null,
    crisis_resources: MENTAL_HEALTH_CRISIS_RESOURCES,
  };
}

export function searchAllRituals(keyword) {
  const query = keyword.toLowerCase();
  const results = [];
  for (const id of ALL_COMMUNITY_IDS) {
    const guide = getMentalHealthBeautyGuide(id);
    const extended = getExtendedRitualGuide(id);
    const allRituals = [
      ...(guide ? guide.signature_rituals || [] : []),
      ...(extended ? extended.additional_rituals || [] : []),
    ];
    for (const ritual of allRituals) {
      const searchTarget = [
        ritual.name,
        ritual.description,
        ritual.mental_health_function,
        ritual.origin,
      ].filter(Boolean).join(' ').toLowerCase();
      if (searchTarget.includes(query)) {
        results.push({
          communityId: id,
          communityName: guide ? guide.communityName : id,
          ritual,
          
        });
      }
    }
  }
  return results;
}

export function getRitualDesignPrinciples() {
  return RITUAL_DESIGN_PRINCIPLES;
}

export function getHairMentalHealthScience() {
  return HAIR_MENTAL_HEALTH_SCIENCE;
}

export function getSkinMicrobiomeStressScience() {
  return SKIN_MICROBIOME_STRESS_SCIENCE;
}

export function getBeautyPsychologyDeepDive() {
  return BEAUTY_PSYCHOLOGY_DEEP_DIVE;
}

export function getSeasonalBeautyMentalHealth() {
  return SEASONAL_BEAUTY_MENTAL_HEALTH;
}

export function getHormonalBeautyMentalHealth() {
  return HORMONAL_BEAUTY_MENTAL_HEALTH;
}
