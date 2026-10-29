/**
 * Mental Health & Beauty: Ethnic Community Guides
 * Covers the intersection of beauty rituals, self-care, and mental wellbeing
 * across nine ethnic communities — grounded in cultural practice, neuroscience,
 * and the political reality of beauty standards.
 *
 * No imports or requires. Pure ES module exports only.
 */

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL SCIENCE: STRESS, CORTISOL, AND SKIN / HAIR
// ─────────────────────────────────────────────────────────────────────────────

export const CORTISOL_SKIN_SCIENCE = {
  mechanism: {
    title: 'How Stress Damages Skin and Hair',
    overview:
      'When the body perceives stress — psychological, social, or physical — the hypothalamic–pituitary–adrenal axis triggers the release of cortisol and adrenaline. These hormones are lifesaving in short bursts but chronically destructive to integumentary tissue.',
    pathways: [
      {
        name: 'Cortisol and sebum overproduction',
        detail:
          'Cortisol stimulates sebaceous glands to produce excess sebum. Combined with stress-driven inflammation, this creates the hormonal acne cycle: clogged follicles, P. acnes proliferation, and inflammatory papules — especially along the jaw and chin.',
      },
      {
        name: 'Collagen suppression',
        detail:
          'Chronic cortisol inhibits fibroblast activity, reducing collagen and elastin synthesis. Skin loses firmness and resilience; fine lines deepen faster in high-stress periods.',
      },
      {
        name: 'Barrier dysfunction',
        detail:
          'Glucocorticoids downregulate ceramide production in the stratum corneum, weakening the skin barrier. Trans-epidermal water loss (TEWL) increases, triggering dryness, sensitivity, and flare-ups of eczema and psoriasis.',
      },
      {
        name: 'Telogen effluvium (stress hair loss)',
        detail:
          'Severe or sustained stress pushes a disproportionate number of follicles from anagen (growth) into telogen (rest/shedding). Hair loss typically appears 8–12 weeks after the stressor, creating a delayed and often confusing connection between a stressful event and visible thinning.',
      },
      {
        name: 'Hyperpigmentation acceleration',
        detail:
          'Psychological stress upregulates melanocyte-stimulating hormone (MSH) and ACTH, which bind to MC1R receptors on melanocytes and can deepen existing pigmentation — a particular concern for skin tones with higher baseline melanin density.',
      },
      {
        name: 'Wound healing delay',
        detail:
          'Cortisol impairs cytokine signalling needed for tissue repair. Under chronic stress, post-inflammatory marks, blemishes, and minor cuts take measurably longer to resolve.',
      },
    ],
  },
  parasympathetic_activation: {
    title: 'How Beauty Rituals Regulate the Nervous System',
    overview:
      'Beauty rituals — when performed with intention and sensory engagement — activate the parasympathetic ("rest and digest") branch of the autonomic nervous system. This is not cosmetic placebo: the mechanisms are physiological.',
    mechanisms: [
      {
        name: 'Touch and oxytocin release',
        detail:
          'Slow, gentle skin contact — whether a face massage, scalp oiling, or body lotion application — stimulates C-tactile afferent nerve fibres that signal the brain to release oxytocin. This hormone lowers blood pressure, reduces cortisol, and produces feelings of safety and connection.',
      },
      {
        name: 'Rhythmic repetition as nervous-system anchor',
        detail:
          'Repeated, predictable physical actions (brush strokes, circular massages, combing) engage the same neural pathways as other rhythmic self-soothing behaviours. They reduce amygdala reactivity and bring the prefrontal cortex back online.',
      },
      {
        name: 'Olfactory–limbic pathway',
        detail:
          'Scent is the only sense that routes directly to the limbic system without thalamic relay. Fragrances used in beauty rituals — rose water, coconut oil, shea butter, sandalwood, jasmine — can trigger stored associations of safety, warmth, and care, bypassing cognitive override.',
      },
      {
        name: 'Mindful attention and present-moment focus',
        detail:
          'A slow, multi-step skincare or hair-care routine demands sensory attention — texture, temperature, scent, absorption. This functional mindfulness interrupts rumination and activates the default mode network in a restorative, rather than ruminative, pattern.',
      },
      {
        name: 'Appearance satisfaction and self-efficacy',
        detail:
          'Research consistently links appearance satisfaction — not meeting an external standard, but feeling cared-for and seen — with higher self-esteem, social confidence, and mood stability. A beauty ritual is a concrete act of self-efficacy: a small thing done well.',
      },
    ],
  },
  political_dimension: {
    title: 'Beauty Standards as a Mental Health Issue',
    overview:
      'For ethnic communities, beauty is not a neutral personal concern. Dominant beauty standards rooted in Eurocentric aesthetics have been systematically weaponised — through media, hiring practices, school dress codes, and partner selection — to communicate that certain bodies, hair textures, skin tones, and facial features are inferior. The chronic stress of navigating these standards is a documented mental health burden.',
    research_points: [
      'Internalized racism and colorism are associated with higher rates of depression, anxiety, and disordered eating in Black, Latinx, South Asian, and East Asian communities.',
      'Natural hair discrimination has been linked to occupational disadvantage and psychological distress in Black women — prompting legislation (the CROWN Act in the US) but with limited global parallel.',
      'The "model minority" beauty ideal imposed on East and South Asian communities creates its own specific set of appearance-related anxieties distinct from the majority-population experience.',
      'For Arab and Muslim women, the politics of veiling — navigated between community expectation, Western hostility, and personal agency — creates a beauty-as-identity pressure unique to religious ethnic identity.',
    ],
    affirming_frame:
      'The beauty rituals documented in this guide are, in many cases, active resistance to those standards. Hair braiding, traditional dress, communal beauty care, and pride in ancestral ingredients are political acts of self-determination — and as such, they carry additional mental health benefit beyond the physiological.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL CONCEPTS
// ─────────────────────────────────────────────────────────────────────────────

export const UNIVERSAL_BEAUTY_MENTAL_HEALTH = {
  beauty_dysmorphia: {
    title: 'Body Dysmorphic Disorder and Ethnic Beauty',
    description:
      'Body Dysmorphic Disorder (BDD) involves obsessive preoccupation with perceived appearance flaws — often invisible or minimal to others. BDD affects all ethnic groups, but the specific focus of preoccupation often reflects cultural beauty ideals. South Asian individuals may focus on skin tone; East Asian individuals on eye shape; Black and Latinx individuals on hair texture or body shape conforming to narrow mainstream standards. Understanding cultural context is essential for accurate clinical assessment.',
    warning_signs: [
      'Spending more than one hour per day thinking about an appearance concern',
      'Avoiding mirrors or conversely checking compulsively',
      'Repeatedly seeking reassurance about appearance',
      'Avoiding social situations due to appearance anxiety',
      'Multiple consultations for cosmetic procedures without satisfaction',
    ],
    culturally_safe_support:
      'Seek therapists with cultural competency training or shared ethnic background. Many communities have specific organisations offering culturally grounded mental health support.',
  },
  ritual_vs_compulsion: {
    title: 'When Beauty Ritual Becomes Compulsion',
    description:
      'A healthy beauty ritual feels grounding, enjoyable, and bounded in time. A compulsive beauty behaviour feels driven by anxiety, takes escalating time, and provides only temporary relief. The difference is not the behaviour itself but its relationship to distress and daily functioning. A 10-step skincare routine done with pleasure is self-care; the same routine done in two-hour panic cycles is worth discussing with a professional.',
  },
  social_beauty: {
    title: 'Communal Beauty as Mental Health Infrastructure',
    description:
      'In many of the cultures documented here, beauty is never a private activity. Hair braiding, hammam visits, salon gatherings, and communal bathing are social structures that happen to involve physical care. The mental health benefits of these spaces — belonging, gossip as emotional processing, generational transmission of wisdom, touch-based reassurance — are primary, not incidental. Modern research on loneliness and health increasingly validates what these communities have always known: being tended to by people who care about you is medicine.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// COMMUNITY GUIDES
// ─────────────────────────────────────────────────────────────────────────────

export const ETHNIC_MENTAL_HEALTH_BEAUTY_GUIDES = {

  // ───────────────────────────────────────────────────────────────────────────
  'west-african': {
    communityId: 'west-african',
    communityName: 'West African',
    heroText:
      'In West African tradition, beauty is never individual vanity — it is community testimony. To look after your hair, your skin, and your body is to honour your lineage, show respect for those around you, and announce your belonging. The mental health embedded in that framework is profound.',

    mental_health_context: {
      dominant_stressors: [
        'Migration and diaspora grief — the loss of extended family proximity and communal support structures',
        'Colorism within communities, with pressure toward lighter skin tones reflecting internalized colonial beauty hierarchies',
        'Code-switching between community beauty norms (natural hair, traditional dress) and workplace expectations',
        'Economic pressure, particularly the weight-of-family expectations common in first- and second-generation immigrant contexts',
      ],
      protective_cultural_factors: [
        'Strong communal identity and social embeddedness providing belonging and buffering isolation',
        'Spiritual frameworks (across Christianity, Islam, and traditional beliefs) that embed self-care in devotional practice',
        'Intergenerational beauty knowledge passed woman-to-woman as an act of love and connection',
        'Community celebration and event dressing (owambe culture) as mood-elevating ritual',
      ],
    },

    signature_rituals: [
      {
        name: 'Communal Hair Braiding',
        mental_health_function: 'Social bonding, touch-based stress regulation, identity affirmation',
        description:
          'In West African communities, hair braiding is not a service transaction — it is a communal gathering. Women (and sometimes men and children) sit together for hours while braids are installed. The conversation, laughter, storytelling, and physical touch that accompany this work constitute a complete mental health intervention: cortisol drops, oxytocin rises, loneliness dissolves, and cultural identity is literally woven into the body. For diaspora communities, recreating this ritual — even imperfectly, even with friends who are not from the same village — is a powerful antidote to isolation.',
        practical_guidance:
          'Prioritise braiding sessions with trusted people over quick solo processes. Allow ample time without rushing. Use the session to talk through what is weighing on you — the physical care creates safety for emotional disclosure.',
        neuroscience_note:
          'Prolonged scalp touch activates the same C-tactile fibres implicated in maternal bonding. Hours of gentle traction, oiling, and manipulation during braiding sessions provide sustained parasympathetic activation.',
      },
      {
        name: 'Shea Butter Body Massage (Ori)',
        mental_health_function: 'Nervous system regulation, skin barrier repair, grounding',
        description:
          'Raw shea butter (ori in Yoruba; karite in French West Africa) is one of the most nutrient-dense topical treatments in the world — packed with oleic, stearic, and linoleic acids that restore the skin barrier cortisol has depleted. But its application is as important as its ingredients. Massaging shea butter into the body — slowly, with attention, warming it between the palms first — is a practice of self-gentleness. It signals to the nervous system that the body is safe and deserving of care, which is not a trivial message for communities navigating racism and structural precarity.',
        practical_guidance:
          'Use raw, unrefined shea (pale yellow or ivory) rather than ultra-processed white variants, which lose many active compounds. Apply to damp skin after bathing. Work from feet upward with long, slow strokes. If possible, have this done for you by a family member — the receiving of care is its own intervention.',
        diy_blend:
          'Traditional West African body butter: whip together 120g raw shea, 60ml baobab oil, and 10 drops of your preferred essential oil (ylang ylang for uplift; frankincense for grounding). Apply liberally.',
      },
      {
        name: 'Black Soap (Ose Dudu) Face and Body Wash',
        mental_health_function: 'Skin health maintenance, affordability, ancestral connection',
        description:
          'Authentic African black soap (ose dudu, anago soap) is made from plantain skin ash, cocoa pod, palm kernel oil, and shea — fermented and sun-dried over days. For people dealing with stress-related acne, eczema flares, or hyperpigmentation, it is both an effective treatment and a connection to centuries of indigenous skincare science. Using traditional ingredients is, for many in the diaspora, a quiet act of reclamation.',
        practical_guidance:
          'Authentic black soap should be soft and brown, not hard and perfectly black (which often indicates chemical processing). Use as a body wash or diluted gentle face cleanser. Patch-test first — the high potassium content can be drying on already compromised skin. Follow with shea butter.',
      },
      {
        name: 'Traditional Hair Oiling (Baobab, Argan, Marula)',
        mental_health_function: 'Pre-wash stress relief ritual, scalp health, sensory grounding',
        description:
          'The oiling of natural hair is a multi-purpose ritual: it softens strands, lubricates the scalp, prepares hair for manipulation, and — when accompanied by scalp massage — delivers a measurable reduction in tension headaches and scalp tightness accumulated during stress. Baobab oil from Senegal and Mali; marula oil from southern West Africa; palm oil in cooking communities repurposed for hair. Each oil carries ancestral weight.',
        scalp_massage_protocol:
          'Section hair into four. Apply warm oil (gently heated between palms or in a small bowl set in hot water) to each section. Use fingertips — not nails — in small circular motions for at least 5 minutes per section. End with long, downward strokes from crown to nape.',
      },
    ],

    skin_tone_specific_concerns: {
      melanin_advantage:
        'Higher melanin density provides significant UV protection and delayed visible aging. Fitzpatrick types V–VI have measurably better photoprotection than lighter skin tones.',
      specific_vulnerabilities: [
        'Post-inflammatory hyperpigmentation (PIH): any inflammation — acne, eczema, a cut — triggers excess melanin deposition. Stress-driven inflammation makes PIH worse and harder to resolve.',
        'Keloid formation: stress may not directly cause keloids, but delayed wound healing under cortisol exposure increases the window during which keloid-prone skin can overrespond to injury.',
        'Ashiness: the grey-white cast that appears on very deep skin tones when the stratum corneum is dehydrated. Cortisol-driven barrier dysfunction makes ashiness more frequent under stress.',
      ],
      ingredient_priorities: ['Shea butter', 'Niacinamide', 'Tranexamic acid', 'Bakuchiol', 'Vitamin C (stable forms)', 'Alpha arbutin'],
    },

    mental_health_resources: {
      general_note:
        'Mental health stigma varies widely across West African communities, with significant generational and religious dimensions. In many contexts, psychological distress is framed spiritually (as spiritual attack, sin consequence, or family curse) rather than clinically. Meeting people within their own framing while offering pathways to professional support requires cultural fluency.',
      affirming_practices: [
        'Community elders and pastors/imams as first-resort listeners',
        'Peer support within women\'s groups (especially church- or mosque-based) as informal CBT analogue',
        'Use of beauty-care settings (braiding salons, informal gatherings) as de facto talking therapy spaces',
      ],
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  'south-asian': {
    communityId: 'south-asian',
    communityName: 'South Asian',
    heroText:
      'The Ayurvedic tradition codified what modern neuroscience is now confirming: the relationship between the skin, the nervous system, and the mind is not metaphorical. South Asian beauty rituals are among the most sophisticated self-care systems in existence — and among the most psychologically potent.',

    mental_health_context: {
      dominant_stressors: [
        'Colorism: the centuries-deep association of light skin with purity, status, and marriageability across South Asian cultures causes documented psychological harm, particularly for darker-skinned individuals',
        'Multigenerational family pressure — on marriage, career, weight, and appearance — creating a uniquely South Asian flavour of anxiety',
        'Model-minority stress in diaspora contexts: the burden of representing the community through achievement and "acceptable" appearance',
        'Hair texture stigma: kinky, wavy, or coarse hair textures pathologised within communities that prize smooth "silky" hair',
      ],
      protective_cultural_factors: [
        'Ayurvedic tradition embedding self-care in wellness philosophy rather than vanity',
        'Communal beauty practices (mehendi, pre-wedding champi, household recipe-sharing) sustaining social bonds',
        'Religious ritual beauty practices (cleanliness for prayer, sindoor, bindi, bangles) giving beauty an elevated moral-spiritual status',
        'Intergenerational transmission of beauty knowledge as an act of care and belonging',
      ],
    },

    signature_rituals: [
      {
        name: 'Abhyanga — Ayurvedic Self-Massage',
        mental_health_function: 'Vagal nerve stimulation, nervous system regulation, dosha balancing',
        description:
          'Abhyanga is the Ayurvedic practice of warm-oil full-body self-massage, traditionally performed daily before bathing. Sesame oil is the classic base for vata (anxiety-prone) constitutions; coconut for pitta (inflammation-prone); sunflower or lighter oils for kapha. The practice is understood in Ayurveda to nourish the dhatus (body tissues), calm vata (the dosha governing the nervous system and anxiety), and produce ojas — the refined essence of vitality and calm. Modern neuroscience confirms the underlying mechanism: sustained, warm, slow touch activates vagal afferents that shift autonomic tone toward parasympathetic dominance. Cortisol falls. Heart rate variability improves. The mind quiets.',
        practical_guidance:
          'Warm oil gently (test on inner wrist — comfortably warm, not hot). Begin with the crown of the head and move downward. Use long strokes on limbs, circular motions on joints. Spend extra time on the feet — dense nerve endings there make foot massage particularly effective for nervous system regulation. Leave oil on skin for 15–20 minutes before a warm (not hot) shower. Perform daily or as often as practical.',
        oil_selection: {
          vata_anxiety: 'Sesame oil (warming, heavy, grounding)',
          pitta_inflammation: 'Coconut oil (cooling, anti-inflammatory)',
          kapha_sluggishness: 'Sunflower or mustard oil (stimulating, warming)',
          universally_calming: 'Brahmi oil (Bacopa-infused) for direct cognitive and stress-adaptive benefit',
        },
        neuroscience_note:
          'A 2019 study found that a single 45-minute Abhyanga session significantly reduced salivary cortisol and improved subjective wellbeing scores. Habitual practice appears to downregulate baseline cortisol.',
      },
      {
        name: 'Champi — Indian Head Massage',
        mental_health_function: 'Tension release, scalp health, cortisol reduction, intergenerational bonding',
        description:
          'Champi (from the Sanskrit "champua", which gave us the word "shampoo") is the practice of head and scalp massage using warm oil — traditionally coconut, amla, brahmi, or bhringraj-infused preparations. In South Asian households, champi is given by mothers to children, by daughters to grandmothers, and between sisters as an act of love. The physical effects are measurable: scalp circulation improves, hair follicles receive increased nutrient delivery, and the multiple pressure points on the scalp connected to facial and sinus tension are released. For diaspora communities living far from family, champi between friends or partners becomes a ritual of community building.',
        practical_guidance:
          'Use bhringraj oil for hair thinning under stress (telogen effluvium). Apply warm oil to scalp sections. Use fingertip (not nail) pressure in circular motions across the entire scalp. Include the temples, the hairline at the forehead, the nape of the neck, and — gently — the ears. Work for at least 15 minutes. Cover with a warm towel for 30 minutes before washing.',
        stress_hair_protocol:
          'For stress-related hair shedding specifically: bhringraj + amla oil blend, massaged daily for 10 minutes, with supplementary ashwagandha (an adaptogen with evidence for cortisol reduction and telogen effluvium reversal).',
      },
      {
        name: 'Mehendi (Henna) Application as Meditation',
        mental_health_function: 'Focused attention, creative flow, social bonding, ceremony anticipation',
        description:
          'Applying mehendi — whether by a professional or exchanged between women — demands slow, fine motor attention. The mind cannot simultaneously spiral in anxiety and execute delicate botanical designs on a moving hand. Mehendi application is functional mindfulness: attention is anchored in the present by the demands of the task. Beyond the individual cognitive effect, pre-wedding and festival mehendi sessions are communal experiences lasting hours — spaces where elder women share advice, younger women share worries, and generational knowledge flows in both directions. The copper and lawsone compounds in henna also have genuine antimicrobial and cooling properties on the skin.',
      },
      {
        name: 'Ubtan — Traditional Face and Body Scrub',
        mental_health_function: 'Exfoliation, skin brightening, sensory ritual, reclamation from skin-bleaching industry',
        description:
          'Ubtan is the traditional pre-wedding full-body paste applied to South Asian brides (and increasingly to grooms) — made from turmeric, chickpea flour, sandalwood, rosewater, milk, and regional additions. Its base ingredients have substantial skincare science behind them: curcumin in turmeric is anti-inflammatory and mildly brightening; chickpea flour gently exfoliates; sandalwood cools and smooths. The mental health dimension is political as well as physiological: ubtan-based brightening works with the skin rather than bleaching it, and reviving this practice is an explicit counter to the damaging skin-lightening industry that has plagued South Asia and its diaspora for generations.',
        basic_recipe:
          '2 tbsp chickpea flour, 1 tsp turmeric, 1 tsp sandalwood powder, enough rosewater and raw milk to form a paste. Apply to face and body, let dry partially, then gently rub off in circular motions. Follow with oil massage.',
      },
      {
        name: 'Skincare as Meditation — The Intentional Routine',
        mental_health_function: 'Present-moment anchor, self-witnessing, cortisol interruption',
        description:
          'South Asian beauty philosophy does not separate the skin from the self. The instructions found in texts like Charaka Samhita for daily self-care are framed in the same language as meditation instructions: attend to what you are doing, notice the sensations, be present with the body. A skincare routine performed this way — each step done with full sensory attention, noticing the texture of a cleanser, the absorption of an oil, the pressure of a jade roller — becomes a mindfulness practice without requiring a cushion or a teacher. This is not a metaphor; slow, attentive physical practice activates the same prefrontal-cortex-led attention networks targeted by formal meditation.',
      },
    ],

    skin_tone_specific_concerns: {
      diversity_note:
        'South Asian skin spans Fitzpatrick types III–VI. There is enormous diversity, and the blanket category "South Asian skin" obscures significant variation between, for example, a Kashmiri individual and a Tamil individual.',
      shared_concerns: [
        'PIH: all skin types prone to inflammation are PIH-vulnerable, but denser melanin makes marks more visible and slower to fade',
        'Hyperpigmentation: sun exposure, hormonal changes, and stress all interact with melanin production',
        'Textural concerns: large pores and congestion, particularly in humid climates, are common',
      ],
      colorism_note:
        'The skin-lightening industry targets South Asian communities with products ranging from merely ineffective to genuinely dangerous (mercury, high-potency steroids marketed as cosmetics). Supporting skin-positive wellness requires active pushback on these narratives.',
      ingredient_priorities: ['Vitamin C', 'Niacinamide', 'Kojic acid', 'Turmeric/curcumin', 'Retinol', 'Alpha arbutin', 'SPF 50+ daily (essential, non-negotiable)'],
    },

    mental_health_resources: {
      general_note:
        'Mental health stigma is pronounced in many South Asian communities, where psychological distress may be reframed as weakness, spiritual failing, or family shame. The growing "desi mental health" movement — particularly in diaspora contexts — is building culturally grounded access.',
      affirming_practices: [
        'Yoga and pranayama as normalised nervous-system regulation tools already within cultural acceptance',
        'Using beauty ritual appointments as safe spaces for emotional disclosure',
        'Community organisations like South Asian Mental Health Alliance (US), Mind Yourself (UK), and Soch Mental Health (UK) offering culturally competent support',
      ],
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  'caribbean': {
    communityId: 'caribbean',
    communityName: 'Caribbean',
    heroText:
      'Caribbean beauty draws from Africa, Europe, Asia, and the indigenous Americas — a creolisation as layered as the culture itself. At its heart is an exuberant, life-affirming relationship with the body, the sea, the elements, and the community. Joy and beauty are not separated from survival — they are expressions of it.',

    mental_health_context: {
      dominant_stressors: [
        'Post-colonial cultural dislocation and the ongoing legacy of enslavement in beauty standards (skin tone hierarchies, hair texture hierarchies)',
        'Diaspora isolation — Caribbean communities in the UK, North America, and the Netherlands navigating distance from the warmth of home and extended family',
        'Masculine identity constraints, particularly around emotional expression and help-seeking',
        'The emotional labour of "being strong" — the cultural value of resilience, which can prevent disclosure of struggle',
      ],
      protective_cultural_factors: [
        'Carnival, festivals, and communal celebration as structured mood elevation and collective identity affirmation',
        'The natural environment — sea, sun, tropical plants — as accessible healing resource for those in the Caribbean',
        'Community gatherings (including beauty gatherings) as informal emotional support systems',
        'Humour and storytelling as cultural mechanisms for processing difficulty',
      ],
    },

    signature_rituals: [
      {
        name: 'Sea Bathing as Mental Health Practice',
        mental_health_function: 'Sensory regulation, grounding, mood elevation, community ritual',
        description:
          'In Caribbean culture, "going to the sea" is not merely recreation — it is remedy. Elders prescribe it for nerves, sadness, physical illness, and spiritual heaviness. The psychophysiological basis is real: cold or cool seawater exposure triggers the dive reflex (slowing heart rate), activates cold thermoreceptors that stimulate mood-regulating neurotransmitters, and provides the sensory overwhelm that interrupts cognitive rumination. Salt water is slightly hypertonic and mildly antiseptic on the skin. Floating removes the weight of the body and activates a sensory quietening. The communal aspect — going together, calling out to each other in the waves — is its own serotonin delivery system.',
        diaspora_adaptation:
          'For those far from the sea: cold-water immersion (cold showers, cold plunge pools) captures many of the physiological benefits. Epsom salt and sea salt baths recreate some of the mineral and sensory qualities. Planning regular returns to the sea — as a deliberate mental health investment — is a legitimate therapeutic strategy.',
        practical_use:
          'Warm Caribbean seawater is rich in minerals that support skin health. Magnesium from seawater is absorbed transdermally and contributes to nervous system regulation. Post-sea bathing, rinse with fresh water and apply a heavy tropical oil (coconut, cocoa butter) while skin is damp to seal in moisture before salt draws it out.',
      },
      {
        name: 'Coconut Oil — The Universal Caribbean Remedy',
        mental_health_function: 'Skin and hair repair, grounding self-touch ritual, ancestral connection',
        description:
          'In the Caribbean, coconut oil is not a trend — it is infrastructure. It conditions hair, removes makeup, protects skin from sun and salt, heals minor cuts, treats fungal conditions, and more. Its fatty acid profile (particularly lauric acid) has antimicrobial properties and penetrates the hair shaft more effectively than most synthetic alternatives. As a beauty ritual object, it carries profound cultural weight: the smell of warm coconut oil activates for many Caribbean people a chain of memory and belonging that functions like an olfactory antidepressant.',
        hair_use:
          'Pre-wash treatment: apply generously to dry hair and scalp, cover with a warm towel for 30 minutes, then shampoo. For high-porosity hair, use sparingly as a sealant after water-based moisturiser rather than as the primary hydrator.',
        skin_use:
          'Body oil post-shower for most skin types. Note: coconut oil is comedogenic for facial use on acne-prone skin — use on body rather than face in those cases.',
      },
      {
        name: 'Communal Beauty Gatherings',
        mental_health_function: 'Social connection, loneliness prevention, intergenerational wisdom transfer',
        description:
          'The beauty gathering — gathering in someone\'s home to braid, press, twist, or style hair, do nails, and share food — is a Caribbean social institution with deep mental health function. What looks from outside like a grooming event is actually structured social support: problems are shared, advice is offered, laughter is mandatory, and for a few hours the weight of individual struggle is distributed across the community. Research on social buffering (the ability of relationships to reduce physiological stress response) is well-established; Caribbean communal beauty gatherings are an operationalisation of this science.',
        recreating_in_diaspora:
          'For diaspora communities, deliberately recreating these gatherings — even imperfectly — is a mental health priority. A WhatsApp coordination and a kitchen to gather in is sufficient infrastructure.',
      },
      {
        name: 'Cocoa Butter and Shea Skin Rituals',
        mental_health_function: 'Skin nourishment, sensory pleasure, cultural pride',
        description:
          'Caribbean bodies have historically been exploited for labour and subjected to racist beauty standards that pathologised their features. The act of luxuriating in rich, fragrant butters — of spending time and care on a body that the world has sometimes treated as a tool — is not trivial. It is a small act of reparation and self-regard. Raw cocoa butter (smelling of chocolate, creamy and golden) is the quintessential Caribbean skin care. Blend with coconut oil and a few drops of lime or neroli for a classic Caribbean body treatment.',
      },
      {
        name: 'Aloe Vera — Straight from the Plant',
        mental_health_function: 'Skin healing, cooling, sunburn relief, sensory ritual',
        description:
          'Throughout the Caribbean, aloe vera plants grow in household gardens for immediate medicinal use. Splitting a leaf and applying the clear gel directly to sunburned skin, rashes, minor cuts, or inflamed acne lesions is a practice that bypasses the cosmetic industry entirely — a connection to living remedies and indigenous knowledge that carries emotional weight as well as physical benefit. The gel contains polysaccharides that soothe inflammation, acemannan that supports wound healing, and a cooling sensation on application that itself reduces the perception of pain and heat.',
      },
    ],

    skin_tone_specific_concerns: {
      diversity_note:
        'Caribbean skin spans the full human range, reflecting the mixing of African, European, South Asian, Chinese, and indigenous Amerindian heritages. Fitzpatrick types II–VI are all well-represented.',
      shared_concerns: [
        'Sun protection: even deep skin tones accumulate UV damage and are vulnerable to skin cancer — SPF is not optional',
        'Humidity-driven congestion: tropical climates, and the transition between them and temperate diaspora locations, can drive congestion and breakouts',
        'Post-inflammatory hyperpigmentation from the intense sun exposure of the region',
      ],
      ingredient_priorities: ['Broad-spectrum SPF', 'Aloe vera', 'Vitamin C', 'Niacinamide', 'Cocoa butter (body)', 'Hyaluronic acid'],
    },

    mental_health_resources: {
      general_note:
        'Mental health stigma is significant in many Caribbean communities, shaped by Christian frameworks that can pathologise psychological distress as spiritual weakness, and by cultural ideals of stoic resilience ("back-bone" in Jamaican parlance). The work of Caribbean mental health advocates in the diaspora is slowly shifting these norms.',
      affirming_practices: [
        'Using church community structures to normalise emotional disclosure',
        'Connecting beauty ritual time to intentional emotional check-ins',
        'Organizations like the Black Minds Matter UK, Caribbean Cultural Center (US), and Caribbean Mental Health Network providing community-specific access',
      ],
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  'arab': {
    communityId: 'arab',
    communityName: 'Arab',
    heroText:
      'Arab beauty philosophy weaves together the spiritual and the sensory. Cleanliness in Islam is half of faith (taharah as ibadah); beauty is inseparable from devotion, from hospitality, from the preparation of the self for prayer and for others. The hammam, the oud, the rosewater — these are not luxuries. They are architecture for the soul.',

    mental_health_context: {
      dominant_stressors: [
        'Islamophobia and anti-Arab racism producing a specific form of minority stress in Western contexts — the pressure to manage appearance as a political statement (particularly for veiled women)',
        'Navigating between community beauty norms and Western beauty expectations',
        'Intergenerational and family pressure — particularly around marriage, weight, and appearance conformity',
        'Trauma from conflict, displacement, and the specific refugee experience for Arab communities affected by regional instability',
      ],
      protective_cultural_factors: [
        'The hammam tradition providing a dedicated, non-judgmental physical and social space for self-care',
        'Aromatherapy culture (oud, rose, musk, amber) providing potent olfactory anchors for emotional regulation',
        'Islamic spiritual practice embedding daily cleanliness and self-care as devotional acts',
        'Communal gatherings (particularly women-only spaces) offering social support under the shared umbrella of beauty preparation',
      ],
    },

    signature_rituals: [
      {
        name: 'Hammam — The Arabic Bath as Mental Health Ritual',
        mental_health_function: 'Deep nervous system reset, social connection, body acceptance, purification',
        description:
          'The hammam (Arabic bathhouse) has been the central wellness institution of Arab and broader Middle Eastern/North African culture for over a thousand years. A traditional hammam visit involves a progression through heated rooms (warm, hot, cool), steam exposure, black soap (ghassoul or savon beldi) application, vigorous kessa mitt exfoliation by an attendant, and often argan oil or rhassoul clay treatment. The physiological effects are comprehensive: heat dilates blood vessels and reduces muscle tension, steam opens airways and loosens congestion, exfoliation removes barrier-blocking dead cells, and the subsequent cool room produces a profound whole-body relaxation response. But the mental health dimension is as significant: the hammam is a space where the body is cared for by another person — where vulnerability and being tended to are structurally built in. For women, it has historically been one of the few social spaces outside the domestic sphere where conversation, community, and physical freedom co-exist.',
        modern_access:
          'Hammam-style treatments are available in many cities via Turkish baths, Moroccan spas, and Moroccan-style hammam experiences. For those without access, recreate at home: steam shower, black soap or rhassoul clay scrub, kessa mitt exfoliation, cool rinse, argan oil application.',
        diaspora_note:
          'For Arab women in diaspora, finding or creating hammam-adjacent spaces — women-only swimming sessions, home steam rituals shared with friends — is a meaningful way to preserve this form of communal wellness.',
      },
      {
        name: 'Rose Water Aromatherapy',
        mental_health_function: 'Mood regulation, anxiety reduction, sensory grounding, spiritual connection',
        description:
          'Rosewater has been distilled in the Arab world since at least the 9th century — used in cooking, prayer, medicine, and beauty. Its fragrance is among the most studied for psychological effect: inhalation of rose scent has been shown in clinical settings to reduce anxiety, lower heart rate, and improve mood. In the olfactory-limbic pathway, the rose scent evokes associations of care, ritual, and sanctity that are deeply encoded in Arab cultural memory. Rosewater is sprinkled on guests on arrival, used to cleanse before prayer, misted over the face after wudu, and layered beneath oud fragrances in traditional scent composition.',
        practical_uses: [
          'Facial mist throughout the day for sensory regulation and quick calm',
          'Added to bath water for full-body olfactory immersion',
          'Sprinkled on pillowcase for sleep ritual',
          'Mixed with glycerin as a gentle toner that also treats hyperpigmentation',
          'Applied post-wudu as an act of beauty-as-worship',
        ],
        quality_note:
          'Authentic rose water is distilled, not rose-fragrance-in-water. Look for products with a single ingredient (Rosa damascena hydrosol or similar) rather than synthetic rose fragrance.',
      },
      {
        name: 'Argan Oil — Liquid Gold Treatment',
        mental_health_function: 'Skin restoration, self-care ritual, economic and cultural pride',
        description:
          'Argan oil from Morocco is now globally recognised, but its mental health dimension in the Arab world is specific: it is gathered and cold-pressed by women\'s cooperatives, making its use an act of economic solidarity as well as personal care. High in oleic acid, linoleic acid, and vitamin E, it repairs the cortisol-damaged skin barrier, smooths hair cuticles, and treats nail brittleness. Applied warm as a face oil at night, it functions as both skin treatment and end-of-day ritual — the physical signal that the day is done and the body is being cared for.',
        hair_use:
          'A single drop worked through dry hair ends controls frizz and adds luminosity without heaviness. Applied to the scalp before washing, it nourishes follicles. Mixed with henna powder for a conditioning colour treatment.',
        face_use:
          'Argan oil is non-comedogenic and suitable for most skin types, including oily skin. Apply 3–4 drops to damp skin after serum for the final step of evening routine.',
      },
      {
        name: 'Black Seed Oil (Habba Sawda) Skincare and Hair Care',
        mental_health_function: 'Healing practice, Prophetic medicine connection, adaptogenic support',
        description:
          'Black seed oil (Nigella sativa, habba sawda) is described in hadith literature as "a cure for every disease except death," giving it deep cultural and spiritual significance in Muslim Arab communities. Its active compound thymoquinone has documented anti-inflammatory, antimicrobial, and antioxidant effects. For stress-related skin conditions — acne, eczema, psoriasis — it offers genuine therapeutic benefit. For hair, it has some evidence for supporting follicular health and addressing alopecia. Using it is simultaneously a beauty practice and an act of connection to Prophetic medicine — a form of care with spiritual as well as physical dimensions.',
        use_guidance:
          'Dilute with a carrier oil (1 part black seed to 4 parts jojoba or argan) for topical skin use — undiluted can be irritating. For hair: massage diluted oil into scalp and leave overnight before washing. Take orally only as directed by a healthcare provider.',
      },
      {
        name: 'Kohl (Surma) Application — Beauty as Devotion',
        mental_health_function: 'Identity affirmation, religious ritual, eye protection',
        description:
          'Traditional kohl (surma, ithmid) is antimony-based mineral preparation applied to the eyes — practised for millennia across the Arab world and wider Muslim communities. It is simultaneously a beauty practice and a sunnah (prophetic practice), giving the act of applying kohl dual significance: it beautifies and expresses devotion. For Muslim women navigating environments that treat their appearance as a site of political contestation, the quiet continuity of traditional practices like kohl application can be a stabilising identity anchor. Note: traditional antimony kohl should be distinguished from lead-containing preparations, which are unsafe. Cosmetic kohl that is lead-free is widely available.',
      },
    ],

    skin_tone_specific_concerns: {
      diversity_note:
        'Arab skin ranges widely across Fitzpatrick types II–V. North African, Levantine, Gulf, and Yemeni populations show significant genetic and phenotypic diversity.',
      shared_concerns: [
        'Hyperpigmentation and melasma, exacerbated by sun exposure and stress hormones',
        'Textural concerns related to dryness in arid climates vs. congestion in humid coastal regions',
        'Hair texture ranging from straight to coily, with humidity-related styling challenges',
      ],
      ingredient_priorities: ['Argan oil', 'Rosewater', 'Rhassoul clay', 'Vitamin C', 'Niacinamide', 'SPF50+', 'Alpha arbutin for hyperpigmentation'],
    },

    mental_health_resources: {
      general_note:
        'Mental health stigma in Arab communities is shaped by cultural norms of family privacy, religious framing of psychological distress, and in diaspora contexts, concerns about community judgement. The concept of aib (shame) can prevent help-seeking. Growing awareness, particularly among younger diaspora generations, is beginning to shift this.',
      affirming_practices: [
        'Using hammam and beauty-care time as legitimate emotional processing space',
        'Islamic spiritual practices (prayer, dhikr, community fasting) offering structured mental health support',
        'Arab-specific mental health resources: Arab American Family Support Center, Nahr (UK), and regional mental health coalitions in MENA',
      ],
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  'latina': {
    communityId: 'latina',
    communityName: 'Latina',
    heroText:
      'Beauty in Latinx culture is alive, communal, and fiercely expressive. It is transmitted between grandmothers and granddaughters through braided hair and kitchen-made remedies. It is celebrated in quinceañeras, sanctified in preparation for church, and practised in the sacred space of el salón. It is political in a world that has tried to make Latinx bodies invisible or exotic. And it heals.',

    mental_health_context: {
      dominant_stressors: [
        'Colorism within communities — the complex hierarchies of tez (skin tone) that map onto class, Indigenous heritage, and anti-Blackness inherited from colonial systems',
        'Immigration stress and documentation anxiety, with the specific psychological weight of uncertainty and family separation',
        '"Familismo" as both protection and constraint — the deep interdependence of Latinx family structures which buffers stress but can also make boundary-setting difficult',
        'Acculturation stress: the pressure to assimilate aesthetically (straighten hair, lighten skin, lose accent) while preserving cultural identity',
      ],
      protective_cultural_factors: [
        'Extremely strong community and family social infrastructure as a buffer against individual stress',
        'Abundant plant-medicine knowledge (hierbas, remedios caseros) providing accessible self-care tools',
        'Celebration culture — cumbia, salsa, the dance floor, the fiesta — as legitimate communal joy infrastructure',
        'El salón as a community mental health space that does not require pathologising one\'s experience to access',
      ],
    },

    signature_rituals: [
      {
        name: 'El Salón — The Beauty Salon as Sacred Mental Health Space',
        mental_health_function: 'Community belonging, emotional processing, intergenerational support, identity affirmation',
        description:
          'In Latinx communities, the beauty salon is not merely a grooming destination — it is a community institution, a confessional, a village square, and a therapy office. Women (and many men) go to their stylist for decades, and the relationship between stylist and client becomes one of the most trusted in the community. Problems are disclosed, advice is given, grief is witnessed, and gossip provides the social information that holds communities together. Research on social support consistently identifies trusted relationships with recurring physical contact as among the most potent buffers against depression and anxiety. El salón operationalises this in a commercial space that requires no formal mental health framing. For many Latinx women, it is the only space where they are exclusively the recipient of care.',
        community_note:
          'The role of salón as informal mental health infrastructure means that the mental health implications of losing access — through cost, time poverty, or immigration status — are more significant than they might appear from outside the community.',
      },
      {
        name: 'Hair Braiding as Grandmother-Granddaughter Bonding',
        mental_health_function: 'Intergenerational attachment, identity transmission, touch-based attunement',
        description:
          'The image of a grandmother braiding a granddaughter\'s hair is so central to Latinx cultural memory that it approaches archetypal. This is not sentimentality: it encodes a real mechanism. The hours of gentle scalp manipulation, of careful sectioning and braiding, create a sustained period of attentive physical contact between generations that science identifies as one of the primary mechanisms of secure attachment transmission. Alongside the physical care comes oral tradition — stories, advice, family history, beauty recipes — the intergenerational download that gives a young person roots. For adult Latinx women in diaspora, recreating this relationship — with elders, with peers, with children — is one of the most specific recommendations for addressing the loneliness of distance from home.',
        traditional_styles:
          'Trenzas (classic braids), chongos (buns), rebozos incorporated into updos, ribbons and flores (fabric flowers) as traditional adornments. Each style carries regional and generational significance.',
      },
      {
        name: 'Remedios Caseros — Home Kitchen Beauty',
        mental_health_function: 'Resourcefulness, indigenous knowledge connection, self-sufficiency, sensory pleasure',
        description:
          'Latinx home kitchens have always been beauty laboratories. Avocado hair masks, egg yolk protein treatments, honey and lemon brightening treatments, aloe vera straight from the plant for skin, chamomile rinses to brighten hair — these remedies pass mother to daughter and are as much about cultural continuity as about ingredient efficacy. The act of making a beauty treatment from kitchen ingredients activates both self-sufficiency (agency) and cultural connection (belonging) — two powerful protective factors against anxiety and depression. Many of the ingredients have solid evidence: avocado oil penetrates the hair shaft; aloe soothes inflammation; honey is antimicrobial and humectant.',
        key_ingredients: [
          'Avocado: deep conditioning mask for natural and colour-treated hair',
          'Aloe vera gel: skin soothing, scalp treatment, hair definition for curly textures',
          'Castor oil: edge treatment, eyebrow conditioning, scalp stimulation',
          'Honey: humectant, antimicrobial skin mask',
          'Chamomile tea: brightening hair rinse for lighter hair; soothing toner for sensitive skin',
          'Coffee grounds: exfoliating body scrub; also applied to under-eye circles for temporary tightening',
        ],
      },
      {
        name: 'Curanderismo-Adjacent Beauty Rituals',
        mental_health_function: 'Spiritual protection, anxiety relief through ritual, nervous system regulation via intention',
        description:
          'In many Latinx communities, beauty and spiritual protection overlap. Limpia (energetic cleansing) ceremonies using herbs, eggs, and smoke have both spiritual and psychological effect — they provide structured ritual for processing susto (spiritual fright — a folk illness describing the shock and dysregulation following trauma). Wearing specific colours, using perfumed waters (Florida water, agua de rosas), and anointing practices that blend Catholic and indigenous elements create a body-based spiritual practice in which beauty care is simultaneously protective care. The psychological mechanism is partly the placebo of structured ritual (which genuinely reduces cortisol) and partly the community belonging of shared belief.',
        modern_application:
          'Florida water as a calming room and linen spray; agua de rosas as a facial mist; rosemary bundled and used in steam treatments for clarity and protection — these elements can be incorporated into daily beauty routines as personal ritual anchors.',
      },
      {
        name: 'Quinceañera Beauty Preparation as Rite of Passage',
        mental_health_function: 'Identity affirmation, community witnessing, healthy self-image framing',
        description:
          'The months of preparation for a quinceañera involve the entire extended community in the beautification of a young woman — not to meet an external standard but to celebrate her becoming. Dress, hair, makeup, and presentation are collectively planned and executed, and the resulting celebration is a community act of saying "you matter, you are seen, you are beautiful, you belong." Research on rites of passage consistently shows that communities which mark transitions with witnessed celebration produce young people with stronger self-concept and greater resilience. The quinceañera, in this light, is a beauty-based mental health intervention embedded in cultural practice.',
      },
    ],

    skin_tone_specific_concerns: {
      diversity_note:
        'Latinx skin is extraordinarily diverse — spanning every Fitzpatrick type, reflecting the mixture of indigenous American, African, European, and Asian ancestry across Latin America. "Latinx skin" is not a skin type.',
      shared_concerns: [
        'Melasma: hormonal hyperpigmentation affecting up to 45% of Latinx women, exacerbated by sun exposure and stress',
        'PIH from acne, particularly in medium-to-deep skin tones',
        'Textural diversity: from straight/fine to coily/dense hair, requiring different approaches',
      ],
      ingredient_priorities: ['Sunscreen (daily, broad-spectrum)', 'Vitamin C', 'Niacinamide', 'Azelaic acid (especially for melasma)', 'Aloe vera', 'Avocado oil'],
    },

    mental_health_resources: {
      general_note:
        'Mental health stigma in Latinx communities is shaped by familismo (keeping problems within the family), Catholic frameworks for distress, and economic barriers to formal mental health care in diaspora contexts. The concept of being fuerte (strong) can prevent disclosure. Culturally grounded resources are essential.',
      affirming_practices: [
        'Using salón appointments as touchstones for emotional check-in',
        'Community spirituality (church, curanderismo) as existing emotional support infrastructure',
        'Organizations: National Alliance on Mental Illness (NAMI) Latino resources, Latinx Therapy, Therapy for Latinx platform',
      ],
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  'east-asian': {
    communityId: 'east-asian',
    communityName: 'East Asian',
    heroText:
      'East Asian beauty culture — particularly the Korean, Japanese, and Chinese traditions — has developed among the most sophisticated, deliberate, and science-adjacent skincare systems in the world. At its best, it is not about chasing a standard but about the practice itself: the slow, layered, attentive ritual of caring for skin as an act of present-moment focus. This is beauty as meditation.',

    mental_health_context: {
      dominant_stressors: [
        'Model minority stress: the expectation of academic and professional excellence that suppresses disclosure of mental health struggle',
        'Specific beauty pressures: double eyelid surgery pressure in Korean and Chinese communities, skin-whitening pressure across East Asia, height-related body image concerns',
        'Collectivist identity norms that can make individual mental health needs feel selfish or disruptive',
        'Anti-Asian racism, particularly post-pandemic, producing a specific trauma burden in diaspora communities',
      ],
      protective_cultural_factors: [
        'Structured daily self-care practice (skincare routines) as existing normalised mindfulness infrastructure',
        'Tea culture and ceremony as embedded sensory-grounding practice',
        'Communal beauty practices (group face masks, spa days, jimjilbang bathhouses) providing social connection',
        'Traditional medicine frameworks (Traditional Chinese Medicine, Korean Hanbang, Japanese Kampo) providing holistic body–mind frameworks',
      ],
    },

    signature_rituals: [
      {
        name: 'The 10-Step Skincare Routine as Mindfulness Practice',
        mental_health_function: 'Daily mindfulness, stress interruption, sensory grounding, self-witnessing',
        description:
          'The Korean 10-step skincare routine — oil cleanser, water cleanser, exfoliant, toner, essence, ampoule/serum, sheet mask, eye cream, moisturiser, SPF — is widely understood as a skincare system. Less discussed is its function as a daily mindfulness protocol. The sequence demands attention: each product has a specific texture, absorption time, and method of application. Patting (not rubbing) an essence requires attention to the sensation. Pressing a sheet mask to the contours of the face requires the mind to follow the hands. The 15–30 minutes of a complete routine cannot be rushed without losing efficacy — meaning the routine structurally resists the compressed, anxious half-attention that characterises stress. In clinical terms, it deploys attentional resources in the present moment and interrupts default-mode rumination.',
        mental_health_optimisation:
          'Make the routine a device-free practice. Use it as the day\'s formal boundary: the morning routine marks the beginning; the evening routine marks the end. Narrate what you are doing in your mind (or aloud) as a grounding technique. The 4-7-8 breathing pattern can be layered over the waiting periods between product absorption.',
        key_steps_and_why: [
          { step: 'Oil cleanse', benefit: 'Removes SPF and makeup; warm oil massage is the first parasympathetic signal of the evening' },
          { step: 'Water cleanse', benefit: 'Removes water-based debris; cool water splash is a mild dive-reflex activator' },
          { step: 'Toner / essence patting', benefit: 'Rhythmic, gentle patting delivers hydration and activates C-tactile fibres through self-touch' },
          { step: 'Sheet mask', benefit: '15-minute enforced pause; the cooling sensation and compression activate both olfactory and tactile calming pathways' },
          { step: 'Facial massage with moisturiser', benefit: 'Gua sha or roller, or simply fingertip massage, activates lymphatic drainage and vagal stimulation' },
        ],
      },
      {
        name: 'Gua Sha — Facial Massage for Stress Relief',
        mental_health_function: 'Lymphatic drainage, muscle tension release, cortisol reduction, ritual grounding',
        description:
          'Gua sha (刮痧) is a traditional Chinese medicine technique involving the scraping of a smooth tool (historically jade or bian stone; modern versions include rose quartz, stainless steel, and buffalo horn) over oiled skin to stimulate circulation, release muscle tension, and drain lymphatic fluid. On the face, light-pressure gua sha (distinct from the firmer body technique) reduces facial puffiness, releases tension held in the jaw and temples, and delivers the vagal stimulation of sustained gentle touch. It has become a global beauty trend — but its origins in TCM connect it to a broader holistic health philosophy in which appearance and wellbeing cannot be separated.',
        technique:
          'Apply facial oil generously. Work in upward and outward strokes, always moving lymph toward the lymph nodes (under the ear and at the collarbone). Hold the tool at a 15-degree angle to the skin. Repeat each stroke 5–8 times. Focus areas: along the jawline (tension and jaw-clenching stress), under the eyes (lymphatic drainage), along the forehead (tension headache prevention), and down the neck (lymph clearance). Practice for 5–10 minutes. The meditative quality comes from the slowness and repetition.',
        stone_selection: {
          jade: 'Classic; cool on contact; traditional in Chinese medicine; balancing energy',
          rose_quartz: 'Stays cool; symbolically associated with self-love in contemporary practice',
          obsidian: 'Very smooth; ground volcanic glass; protective energy in many traditions',
          bian_stone: 'Traditional material; contains trace minerals; used in clinical gua sha',
        },
      },
      {
        name: 'Jimjilbang and Onsen — Communal Bathing as Mental Health',
        mental_health_function: 'Social bonding without performance, nervous system reset, skin detoxification',
        description:
          'The Korean jimjilbang (public bathhouse) and Japanese onsen (hot spring) cultures provide what may be the East Asian version of the West African braiding circle or the Latinx salón: a communal space structured around physical care where social connection happens naturally. In the jimjilbang, women and men bathe together (in gender-separated pools), lie on heated floors, wear the same uniforms, and shed social performance entirely. The effect of hot water immersion on the nervous system is well-documented: core body temperature rise triggers the heat-loss response, which drops heart rate and induces the pre-sleep relaxation state. Communal nudity in a safe, traditional context reduces body shame through normalisation.',
        diaspora_access:
          'Korean-style spas (found in major cities across North America, Australia, and Europe), Japanese bath houses, and Turkish hammams approximate this experience. For those without access: deep baths with dissolved mineral salts, long shower steam rooms created with eucalyptus, and temperature contrast between warm and cool showers replicate elements of the bathing sequence.',
      },
      {
        name: 'Traditional Chinese Medicine (TCM) Beauty — Inner-Outer Connection',
        mental_health_function: 'Holistic self-understanding, skin health via systemic wellness, stress treatment at the root',
        description:
          'TCM approaches skin and hair concerns as symptoms of internal imbalances — qi stagnation, blood deficiency, excess heat — rather than surface problems requiring surface solutions. This framework prevents the mental health trap of treating only the symptom (the acne) while ignoring the cause (the stress and dysregulated cortisol). Acupuncture for stress-related skin conditions has evidence for reducing cortisol and improving skin barrier function. Herbal formulations (Gui Pi Tang for anxiety-related hair loss, Long Dan Xie Gan Tang for inflammation) address the systemic drivers. Goji berries, tremella mushroom, and schisandra in food-based beauty protocols connect daily eating to skin and emotional health.',
        evidence_note:
          'Acupuncture for stress and anxiety has a reasonable evidence base in systematic reviews. Herbal TCM formulations vary widely in evidence quality; consult a registered TCM practitioner rather than self-prescribing.',
      },
      {
        name: 'Japanese Skincare Philosophy — Mottainai and Simplicity',
        mental_health_function: 'Anti-consumerism, simplicity as stress reduction, reverence in daily acts',
        description:
          'Japanese skincare philosophy (influenced by the concept of mottainai — regret over waste, reverence for value) tends toward fewer, higher-quality products used with great attention. This is in contrast to the maximalist accumulation the beauty industry incentivises. From a mental health perspective, a simplified routine does not necessarily sacrifice results, and often reduces the decision fatigue and beauty-product anxiety that a bathroom overflowing with products can create. Core Japanese skincare: cleanse gently (not stripping), hydrate (lotion/toner), protect (SPF). The philosophy applied to beauty is: use what you need, use it well, and be present while you do.',
      },
    ],

    skin_tone_specific_concerns: {
      diversity_note:
        'East Asian skin spans Fitzpatrick types II–IV, with significant variation across Chinese (ethnically diverse), Korean, Japanese, Vietnamese, Mongolian, and other populations.',
      shared_concerns: [
        'Uneven skin tone, PIH, and melasma — particularly common and a major industry driver across East Asia',
        'Photodamage: despite media images to the contrary, East Asian skin is not immune to sun damage and skin cancer',
        'Hair-thinning concerns, often hereditary and exacerbated by stress (telogen effluvium)',
        'The specific skin anxiety created by extremely high beauty standards within East Asian cultures themselves',
      ],
      ingredient_priorities: ['Niacinamide', 'Vitamin C', 'Tranexamic acid', 'Hyaluronic acid', 'Centella asiatica', 'Snail mucin (for repair)', 'Sunscreen (daily non-negotiable)'],
    },

    mental_health_resources: {
      general_note:
        'Mental health stigma is pronounced in many East Asian communities — the concept of face (mianzi/mentsu) creates barriers to disclosure, and collectivist values can make individual need feel shameful. The model minority myth suppresses help-seeking. Growing "Asian mental health" advocacy movements are important.',
      affirming_practices: [
        'Framing skincare and self-care routines explicitly as mental health practice',
        'Using community bathing and spa experiences as normalised self-care',
        'Organizations: Asian Mental Health Project, Mental Health Association for Chinese Communities, Korean American Mental Health',
      ],
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  'east-african': {
    communityId: 'east-african',
    communityName: 'East African',
    heroText:
      'East African beauty draws from one of the oldest continuous beauty traditions in the world. From the Maasai\'s ochre and fat body preparations to the Swahili coast\'s aromatic trade-route perfume culture; from Ethiopian women\'s intricate hair braiding to the singing that accompanies Somali communal beauty rituals — this is a beauty practice rooted in community, ceremony, and the sacred.',

    mental_health_context: {
      dominant_stressors: [
        'Refugee and displacement trauma for communities from conflict-affected regions (Ethiopia, Somalia, South Sudan, DRC)',
        'Colorism and anti-Blackness in global beauty standards, with particular complexity for communities with very dark skin tones',
        'Post-migration identity stress: navigating between traditional community norms and destination-country expectations',
        'Female genital mutilation (FGM) trauma for some communities — a specific and severe intersection of beauty culture, tradition, and bodily harm that requires specialist psychological support',
      ],
      protective_cultural_factors: [
        'Extraordinarily rich communal beauty traditions providing social structure and belonging',
        'Singing and music embedded in beauty rituals providing mood elevation and social synchrony',
        'Traditional healing systems (Ethiopian traditional medicine, Somali dhawr, Maasai herbal practices) offering holistic self-care frameworks',
        'Strong ethnic and community identity providing psychological scaffolding in diaspora contexts',
      ],
    },

    signature_rituals: [
      {
        name: 'Singing During Beauty Rituals',
        mental_health_function: 'Mood elevation, social synchrony, oxytocin release, cultural continuity',
        description:
          'In many East African communities, communal beauty sessions — braiding, oiling, dressing — are accompanied by singing. This is not accidental. Group singing is one of the most powerful mood-elevating and bonding activities available to humans: it synchronises heart rates across participants, releases oxytocin, activates the reward circuits, and requires attentional focus that prevents rumination. For communities navigating displacement and trauma, preserving the tradition of singing during beauty care is a way of maintaining an emotional technology that has sustained communities through historical hardship.',
        practice_note:
          'Recreate this in diaspora settings by playing traditional music — or singing together — during communal hair care sessions. The playlist is not incidental; it is the medicine.',
      },
      {
        name: 'Ethiopian Coffee Ceremony as Linked Beauty-Social Practice',
        mental_health_function: 'Slowing down, sensory engagement, community structure, spiritual grounding',
        description:
          'While not a beauty ritual itself, the Ethiopian coffee ceremony (buna) is the social infrastructure into which beauty practices are woven. The ceremony takes 45 minutes to an hour — beans are roasted over coals, ground by hand, brewed three times (abol, tona, baraka), and served in small cups. Beauty preparations happen alongside and within this ceremony. It enforces the slow time that beauty care requires and provides the relational container for it. The green grass and incense that traditionally accompany the ceremony (frankincense, myrrh) create an olfactory-limbic activation that is reliably calming.',
      },
      {
        name: 'Traditional Body Oiling and Butter Practice',
        mental_health_function: 'Skin nourishment, nervous system regulation through self-touch, heat and scent grounding',
        description:
          'Across East African communities, the daily application of body oil or butter — often mixed with earth, ochre, or aromatic compounds — is both practical (protecting skin from harsh sun and dry conditions) and ceremonial. Maasai warriors apply ochre and fat (traditionally cow fat, now often petroleum jelly or commercial moisturisers) as both sun protection and identity marking. Somali women apply qasil (lote tree leaf powder) as a skin treatment. Ethiopian women use teff butter and plant-based preparations. The common thread is deliberate, daily physical care of the body as a valued and ceremonial act — not a hurried utilitarian task.',
        key_ingredients: [
          'Qasil (Ziziphus spina-christi leaf powder): traditional Somali cleansing and skin-brightening mask',
          'Niter kibbeh (Ethiopian spiced clarified butter): traditional hair and skin conditioning',
          'Shea butter: widely used across the Sahel and East African transition zone',
          'Moringa oil: native to East Africa, extremely high in oleic acid and antioxidants',
          'Frankincense (olibanum): anti-inflammatory, skin-tightening, deeply calming scent with a 3,000-year beauty and spiritual history in the region',
        ],
      },
      {
        name: 'Henna Traditions on the Swahili Coast',
        mental_health_function: 'Ceremonial participation, social belonging, creative expression, skin connection',
        description:
          'Swahili coast communities (Kenya, Tanzania, coastal Somalia, Comoros) have centuries-old henna traditions imported via Indian Ocean trade routes and blended with East African motifs. Henna application before weddings, Eid, and ceremonies is a communal practice that gathers women together for design exchange, storytelling, and the sustained slow attention of artistic creation. The meditative benefit of applying and receiving henna has been documented above in the Arab section; in East African context, add the additional dimension of cross-cultural creativity and the beauty of geometric and floral Swahili coastal designs.',
      },
      {
        name: 'Traditional Healing and Beauty Overlap',
        mental_health_function: 'Integrated body-mind care, community healer relationships, spiritual protection',
        description:
          'In many East African traditional health systems, the boundary between healing and beauty does not exist. The same practitioner who applies medicinal herbs to treat illness might prepare a girl for marriage ceremonies using the same knowledge base. Ethiopian traditional medicine (involving butter-based preparations, herbal compresses, and smoke treatments), Somali traditional healing, and Maasai herbal practice all embed physical care of the body in a broader healing philosophy. Using these traditions consciously — gathering knowledge from elders, visiting traditional practitioners where safe and accessible — is a form of cultural continuity with mental health value beyond the physical effects of individual ingredients.',
      },
    ],

    skin_tone_specific_concerns: {
      diversity_note:
        'East African populations span diverse genetic backgrounds — from the extremely dark skin tones of the Dinka in South Sudan to the lighter brown tones of some Ethiopian highland populations — with hair textures from very tightly coiled to wavy.',
      shared_concerns: [
        'Very high melanin density in many East African skin tones: significant sun protection, slow visible aging, but greater PIH visibility',
        'Dryness: savanna and highland climates produce skin that requires heavy moisture barrier protection',
        'Hair care for very tightly coiled textures (Type 4B/4C): high porosity, shrinkage, and moisture retention challenges',
      ],
      ingredient_priorities: ['Shea butter', 'Moringa oil', 'Frankincense resin oil', 'Castor oil (hair)', 'SPF30+ minimum', 'Niacinamide', 'Alpha arbutin'],
    },

    mental_health_resources: {
      general_note:
        'East African communities include populations with significant trauma histories (refugees, war-affected, FGM survivors) alongside communities with no such history. Blanket approaches are inadequate. Culturally specific and trauma-informed care is essential.',
      affirming_practices: [
        'Preserving communal beauty rituals as community-building infrastructure',
        'Traditional healers as first-tier support in culturally appropriate contexts',
        'Specialist organisations: Integrate UK (trauma-informed Somali mental health), Horn of Africa Mental Health (diaspora services)',
      ],
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  'south-african': {
    communityId: 'south-african',
    communityName: 'South African',
    heroText:
      'South African beauty is inseparable from South African political history. The forced ugliness of apartheid — the racial classification of bodies, the criminalisation of natural hair in workplaces, the systematic assault on Black South African identity — means that beauty as self-determination is not an abstract idea here. It is a lived political act. Ubuntu, the Nguni philosophy of "I am because we are," provides a communal ethic for beauty practice: your beauty is held and affirmed by your community, not judged against an external standard.',

    mental_health_context: {
      dominant_stressors: [
        'Intergenerational trauma from apartheid, including race-based beauty standard oppression that persists in post-apartheid commercial and workplace culture',
        'Coloured community-specific colorism and identity complexity: navigating mixed-heritage identity in a society that has historically required racial categorisation',
        'Economic precarity for the majority Black South African population, limiting access to both mental health care and beauty resources',
        'Language and cultural diversity within "South African" identity (Zulu, Xhosa, Sotho, Tswana, Venda, Tsonga, Cape Malay, Afrikaner — each with distinct beauty traditions)',
      ],
      protective_cultural_factors: [
        'Ubuntu philosophy providing a deeply embedded communal identity framework',
        'South African women\'s activism traditions providing models of resistance and collective action',
        'Rich ethnic beauty traditions (Ndebele beadwork, Xhosa traditional dress and beauty, Zulu ceremonial beauty) as identity anchors',
        'The "Born Free" generation\'s explicit reclamation of Black beauty and natural aesthetics',
      ],
    },

    signature_rituals: [
      {
        name: 'Ubuntu Beauty — Communal Care as Philosophy',
        mental_health_function: 'Community belonging, identity affirmation, mutual care as mental health infrastructure',
        description:
          'Ubuntu — "umuntu ngumuntu ngabantu" (a person is a person through other persons) — reframes beauty care as inherently communal. In Ubuntu philosophy, individual beauty is not private: it is held and celebrated by the community. Hair braiding sessions, communal dressing for celebrations (umemulo, lobola preparations, church events), and the shared investment in each other\'s appearance are all expressions of Ubuntu in action. The mental health implication is profound: your appearance is not a private anxiety but a communal responsibility. The community affirms you. You are seen.',
        political_note:
          'In post-apartheid South Africa, the reclamation of Ubuntu-based communal beauty practices — particularly the celebration of afro hair, traditional dress, and ancestral beauty knowledge — is an explicit decolonisation project with clear mental health resonance.',
      },
      {
        name: 'Rooibos Tea Beauty Rituals',
        mental_health_function: 'Skin healing, anti-anxiety ritual, proudly South African identity',
        description:
          'Rooibos (Aspalathus linearis) is endemic to the Western Cape — it grows nowhere else in the world. Rich in antioxidants (aspalathin, nothofagin, quercetin), it has documented anti-inflammatory and anti-oxidative effects on the skin when applied topically. As a beauty ingredient, rooibos toner, face mist, or bath soak connects the user to something quintessentially South African. Drinking rooibos tea is itself an anxiety-reducing ritual: naturally caffeine-free, it contains chrysoeriol and other flavonoids with mild anxiolytic properties. The ritual of making and drinking tea — particularly in community — is a slowing practice.',
        diy_applications: [
          'Rooibos toner: brew strong rooibos, cool, and apply with a cotton pad after cleansing',
          'Rooibos face steam: brew in a bowl, tent face over steam for 5 minutes',
          'Rooibos bath: add 4–6 bags to warm bath for a full-body antioxidant soak',
          'Rooibos scalp rinse: pour cooled brew over scalp post-shampoo to soothe itchiness',
        ],
      },
      {
        name: 'Umemulo and Ceremonial Beauty Preparation',
        mental_health_function: 'Rite of passage, community witnessing, identity affirmation, collective joy',
        description:
          'Zulu umemulo (coming-of-age ceremony for young women in their twenties) involves extensive communal preparation: traditional dress, beadwork, anointing, and the celebration of the young woman in her full identity. Similar to the quinceañera in Latinx culture, the beauty preparation for umemulo is a community act of saying "you are seen, you are valued, you are beautiful within your own tradition." The mental health effect of community-witnessed transition ceremonies is well-documented — they reduce existential anxiety, reinforce social belonging, and provide young people with a narrative of meaning for their lives.',
      },
      {
        name: 'Ndebele Beadwork and Body Art as Mental Health Expression',
        mental_health_function: 'Creative expression, cultural identity, fine motor focus as mindfulness, community language',
        description:
          'Ndebele women\'s intricate geometric beadwork — worn on the body, adorning the neck, arms, and legs in coded patterns that communicate life stage, marital status, and community affiliation — represents one of the world\'s most sophisticated personal-as-political beauty systems. Creating beadwork is a slow, precise, meditative act that demands fine motor attention and creative problem-solving — a functional mindfulness practice. Wearing it is a statement of identity and belonging that requires no words. For modern South African women reconnecting with ancestral practice, learning beadwork is simultaneously creative therapy and cultural reclamation.',
      },
      {
        name: 'Marula Oil — Skin Nourishment from the Veldt',
        mental_health_function: 'Skin restoration, ancestral connection, self-care with indigenous ingredients',
        description:
          'Marula oil (from Sclerocarya birrea, the "elephant tree") has been used by southern African women for centuries as a skin and hair treatment. Rich in oleic acid (70%+), antioxidants, and amino acids, it penetrates skin deeply, repairs barrier damage, and protects against UV and environmental oxidative stress. It is non-comedogenic, exceptionally shelf-stable (naturally resistant to rancidity), and absorbs without greasiness. As a beauty ingredient from the South African landscape, using marula oil carries the same meaning as using rooibos: a connection to the specific ecology that shaped the community.',
        use_guidance:
          'Apply 3–5 drops to damp skin as the final step of an evening skincare routine. Warm between palms first for better absorption. For hair, a few drops on dry ends prevents split ends and adds shine without heaviness. For traditional body use: apply generously to damp skin after bathing.',
      },
    ],

    skin_tone_specific_concerns: {
      diversity_note:
        'South Africa is the most ethnically diverse country in Africa. Black South African communities have the full range of Type IV–VI skin tones; Coloured communities range across III–V; White South African communities range I–III; South African Indian communities III–IV.',
      shared_concerns: [
        'Sun protection across all skin tones: South Africa has intense UV radiation; skin cancer rates are not negligible even in darker skin',
        'PIH from acne and injury, most visible in medium-to-deep skin tones',
        'Dry skin in the highveld plateau climate',
        'The specific skin anxiety produced by a society that has historically classified and judged bodies by race',
      ],
      ingredient_priorities: ['Marula oil', 'Rooibos (topical and ingested)', 'Shea and baobab', 'SPF50 (essential)', 'Vitamin C', 'Niacinamide'],
    },

    mental_health_resources: {
      general_note:
        'South African mental health resources are unequally distributed, with significant disparities between urban and rural, wealthy and poor, and racial groups — a direct legacy of apartheid-era healthcare inequity. The South African Depression and Anxiety Group (SADAG) is the primary community resource.',
      affirming_practices: [
        'Ubuntu community structures as informal mental health support',
        'Traditional healers (sangoma, inyanga) as first-tier support in many communities — collaboration with clinical services is emerging',
        'SADAG: sadag.org — 0800 456 789 (24-hour)',
        'Reclamation of natural hair and traditional beauty as explicitly decolonising mental health practice',
      ],
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  'black-american': {
    communityId: 'black-american',
    communityName: 'Black American',
    heroText:
      'The Black American beauty salon is one of the great unrecognised mental health institutions of the 20th and 21st centuries. In a country that has systematically devalued, brutalised, and legislated against Black bodies, the act of adorning, celebrating, and caring for that body is not trivial. It is survival. It is resistance. It is, in the truest sense, self-determination.',

    mental_health_context: {
      dominant_stressors: [
        'Racial trauma: the accumulation of microaggressions, systemic racism, police violence, and cultural devaluation produces a specific chronic stress burden documented across Black American health outcomes',
        'Hair discrimination: Black hair has been penalised in schools and workplaces for generations — the CROWN Act (Creating a Respectful and Open World for Natural Hair) is a legislative response to documented harm',
        'Colorism within the community: the persistent valuation of lighter skin and straighter hair as more beautiful, more professional, and more worthy',
        'The specific burden of navigating American beauty standards designed around white Western aesthetics while maintaining community identity',
      ],
      protective_cultural_factors: [
        'The Black beauty salon as a unique social institution — a safe space, a community mental health resource, and a site of cultural transmission that has no precise equivalent in other communities',
        'The natural hair movement providing an affirming counter-narrative to dominant beauty standards',
        'Rich artistic and expressive beauty traditions — from elaborate nail art to protective styling — as creative self-expression',
        'Intergenerational beauty knowledge and the specific intimacy of hair care as an act of love',
      ],
    },

    signature_rituals: [
      {
        name: 'The Black Beauty Salon as Sacred Space',
        mental_health_function: 'Community belonging, emotional disclosure, identity affirmation, racial trauma processing',
        description:
          'The Black beauty salon (and barber shop, for Black men) occupies a unique sociological position in American life. It is one of the few racially homogeneous spaces that Black Americans have consistently maintained — a space where the defensive code-switching of public life can be set down, where Black speech, Black aesthetics, Black politics, and Black humour are the defaults. Research by sociologists including Ellis Cose and, more recently, public health scholars, has documented the salon\'s function as informal mental health infrastructure: a place where problems are shared without clinical framing, where intergenerational advice flows freely, where the physical act of being cared for by someone who looks like you carries meaning that exceeds the technical service rendered. For many Black women, the stylist relationship is one of the most trusted in their lives.',
        historical_note:
          'Black salons and barber shops have functioned as political organising spaces since Reconstruction — safe spaces for planning, resistance, and community coordination that were inaccessible to white oversight. This political history gives the salon its current cultural weight. Entering one is entering a long story.',
        diaspora_and_access:
          'Where Black beauty salons are absent or inaccessible, the significance of recreating the space — the gathering, the physical care, the music, the conversation — cannot be overstated. A home hair session with community members can carry the same function.',
      },
      {
        name: 'Hair Care as Identity Affirmation and Racial Healing',
        mental_health_function: 'Self-esteem repair, racial identity affirmation, autonomy over a politically contested body part',
        description:
          'Black American hair has been one of the most contested political sites in American history: from laws against braids in New Orleans in the 18th century to school dress codes banning locs and twists in the 21st, to the documented employment discrimination that the CROWN Act was designed to address. In this context, caring for, styling, and celebrating natural Black hair — in its coiled, loc\'d, braided, twisted, and explosive natural forms — is an act of political self-determination with direct mental health implications. The research evidence on natural hair movement participation shows correlations with improved self-esteem, reduced internalized racism, and greater wellbeing in Black women who make the transition to natural hair.',
        protective_styles_and_mental_health: [
          'Box braids: extended installation means less daily manipulation and decision fatigue',
          'Locs: a commitment to natural texture with a progressive community and strong identity signalling',
          'Twist-outs and wash-and-gos: daily engagement with natural texture as a self-affirming practice',
          'Wigs and weaves: style freedom and protective cover that allows natural hair to rest — when chosen freely, not when imposed by workplace pressure',
        ],
        key_ingredients: [
          'Castor oil: the classic Black American edge-laying and scalp oil; ricin-free ricinoleic acid supports scalp health',
          'Shea butter: moisture-sealing for low-porosity natural hair',
          'Coconut oil: protein treatment aid and moisture retention',
          'Argan oil: finishing oil for shine and frizz reduction',
          'Aloe vera: humectant and curl definition support',
        ],
      },
      {
        name: 'Beauty After Racial Trauma — Self-Care as Coping',
        mental_health_function: 'Post-trauma stabilisation, bodily agency, cortisol management, community solidarity',
        description:
          'In the aftermath of racial trauma events — witnessing or experiencing police violence, viral anti-Black violence, workplace discrimination — the Black American community has developed informal protocols of beauty-as-coping that function as peer-level nervous system support. The gathering of Black women to care for each other\'s hair and appearance after traumatic community events is documented in oral history and increasingly in scholarly literature. The physical act of being tended to — of having someone\'s careful hands in your hair while you process what happened — is a body-first approach to trauma stabilisation that precedes and supplements formal therapy.',
        somatic_note:
          'Trauma is stored in the body (as documented by Bessel van der Kolk and others). The body-first approach of physical care — touch, rhythm, warmth, scent — accesses the traumatised nervous system in a way that talk alone often cannot. This gives beauty-care rituals a specific therapeutic value in post-trauma contexts that is not metaphorical.',
        when_to_seek_professional_support:
          'Beauty self-care supports but does not replace clinical mental health care for racial trauma. Therapists of colour with expertise in racial trauma: Therapy for Black Girls, Loveland Foundation, Open Path Collective.',
      },
      {
        name: 'The Edge Control Ritual and Self-Presentation Agency',
        mental_health_function: 'Mastery, self-presentation control, aesthetic expression within constraint',
        description:
          'Edge control — the precise laying and styling of the hairline with product and a soft brush — is a Black American beauty skill with its own aesthetic vocabulary (heart patterns, swirls, waves). It is also a practice of precision, control, and artistic expression in miniature. In a world where Black Americans are frequently denied control over major life circumstances, mastery of edge care and presentation is a micro-domain of expressed agency. The concentration required is meditative; the visible result provides an immediate satisfaction signal that activates the reward pathway.',
      },
      {
        name: 'Nail Art as Creative Self-Expression',
        mental_health_function: 'Creative expression, self-affirmation, community signalling, mood elevation',
        description:
          'Black American nail culture — elaborate acrylic sets, gel art, coffin and stiletto shapes, rhinestones, hand-painted designs — is a recognised art form and a powerful medium for self-expression and community identity. Research on creative self-expression consistently shows benefits for mood, self-esteem, and psychological wellbeing. Nail appointments are also salon-adjacent: they involve the physical care of a trusted technician, often in a community setting, and provide a portable art object worn on the body. The nail arts worn by Black women to work, to church, to protest, and to celebration are intentional communications of identity and pride.',
      },
      {
        name: 'Sunscreen and Skin Care — Reclaiming the Narrative',
        mental_health_function: 'Health autonomy, correcting medical misinformation, skin confidence',
        description:
          'The myth that Black skin does not need sunscreen has been perpetuated and has caused measurable harm: Black Americans are significantly more likely to be diagnosed with melanoma at advanced stages because of lower screening rates and the mistaken belief that dark skin is fully protected from UV. Reclaiming SPF use in Black skin care is a health justice issue and a beauty confidence issue simultaneously. New-generation sunscreens formulated to avoid the grey-white cast on deeper skin tones (tinted SPF, mineral-chemical hybrid formulations) have begun to address one of the legitimate barriers to adoption. Using SPF daily is an act of self-care with long-term skin health consequences that no other single product matches.',
        product_note:
          'For very deep skin tones (Fitzpatrick V–VI), chemical sunscreens (avobenzone, octinoxate) or tinted mineral formulations avoid white cast. Black Girl Sunscreen and similar Black-founded brands have made culturally competent SPF formulations more accessible.',
      },
    ],

    skin_tone_specific_concerns: {
      diversity_note:
        'Black American skin spans Fitzpatrick types IV–VI, with significant variation in undertone and melanin density. The range from "light-skinned" to "dark-skinned" within the community reflects both genetic diversity and the complex history of race in America.',
      shared_concerns: [
        'PIH: acne marks, keloids, and hyperpigmentation require specific approach — avoid over-exfoliation, prioritise anti-inflammatory ingredients',
        'Keloids: genetically predisposed in many individuals of African descent; stress and delayed wound healing (from cortisol) worsen formation',
        'Scalp health: the tightly coiled hair textures common in Black American communities require specific scalp care — moisture retention is the primary challenge',
        'Razor bumps (pseudofolliculitis barbae) in men who shave',
      ],
      ingredient_priorities: ['Niacinamide', 'Alpha arbutin', 'Vitamin C (stable forms)', 'Shea butter', 'Castor oil', 'SPF50 (tinted or chemical for no cast)', 'Azelaic acid'],
    },

    mental_health_resources: {
      general_note:
        'Black Americans face significant barriers to mental health care including therapist representation gaps, cost, historical medical trauma (Tuskegee), and the cultural stigma of being "strong." The Black mental health movement is actively addressing these barriers.',
      affirming_practices: [
        'Using beauty-care appointments as intentional emotional check-in time',
        'Therapy for Black Girls: therapyforblackgirls.com — directory of therapists of colour',
        'Loveland Foundation: lovelandfoundation.org — therapy grants for Black women and girls',
        'Open Path Collective: reduced-cost therapy with culturally competent practitioners',
        'The Black Men Heal initiative: reduced-cost mental health services for Black men',
        'National Alliance on Mental Illness (NAMI) Urban Los Angeles: focus on BIPOC communities',
      ],
    },
  },

}; // end ETHNIC_MENTAL_HEALTH_BEAUTY_GUIDES

// ─────────────────────────────────────────────────────────────────────────────
// GETTER FUNCTION — EXACT DIRECTMAP PATTERN AS SPECIFIED
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_COMMUNITY_IDS = [
  'west-african',
  'south-asian',
  'caribbean',
  'arab',
  'latina',
  'east-asian',
  'east-african',
  'south-african',
  'black-american',
];

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

export function getSkinConcerns(communityId) {
  const guide = getMentalHealthBeautyGuide(communityId);
  if (!guide) return null;
  return guide.skin_tone_specific_concerns || null;
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

export const INGREDIENT_CROSS_REFERENCE = {
  'shea butter': ['west-african', 'caribbean', 'east-african', 'south-african', 'black-american'],
  'coconut oil': ['caribbean', 'south-asian', 'east-asian'],
  'rosewater': ['arab', 'south-asian'],
  'argan oil': ['arab', 'black-american'],
  'aloe vera': ['caribbean', 'latina', 'black-american'],
  'niacinamide': ['west-african', 'south-asian', 'caribbean', 'arab', 'latina', 'east-asian', 'east-african', 'south-african', 'black-american'],
  'vitamin c': ['west-african', 'south-asian', 'caribbean', 'latina', 'east-asian', 'south-african', 'black-american'],
  'castor oil': ['latina', 'east-african', 'black-american'],
  'moringa oil': ['east-african'],
  'marula oil': ['south-african'],
  'rooibos': ['south-african'],
  'frankincense': ['arab', 'east-african'],
  'turmeric': ['south-asian'],
  'black seed oil': ['arab'],
  'henna': ['south-asian', 'arab', 'east-african'],
};

export function getIngredientCommunities(ingredient) {
  const key = ingredient.toLowerCase();
  return INGREDIENT_CROSS_REFERENCE[key] || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTENDED MENTAL HEALTH & BEAUTY SCIENCE
// ─────────────────────────────────────────────────────────────────────────────

export const BEAUTY_PSYCHOLOGY_DEEP_DIVE = {
  appearance_satisfaction: {
    title: 'The Psychology of Appearance Satisfaction',
    overview:
      'Appearance satisfaction is distinct from objective attractiveness. Research consistently shows that the relationship between how one looks (by any external measure) and how one feels about how one looks is weak. What matters — for self-esteem, social confidence, and mental wellbeing — is the subjective sense of feeling cared-for, put-together, and aligned with one\'s own identity. This is why cultural beauty norms matter: a Black woman in a natural hair community who has learned to see her coils as beautiful will score higher on appearance satisfaction than the same woman pressured to chemically straighten her hair for professional acceptance.',
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
        content:
          'C-tactile (CT) afferents are unmyelinated nerve fibres in the skin that respond preferentially to light, slow, stroking touch (1–10 cm/s). Unlike fast, discriminative touch (which travels A-beta fibres), CT-afferent signals route to the insular cortex — the emotional brain — and trigger oxytocin release and reduced activation of threat-processing systems. The grooming, braiding, and slow massage techniques described throughout these guides are, physiologically, direct stimulants of this system. The mental health benefit of having someone\'s hands in your hair for two hours is neurochemically specific and substantial.',
      },
      {
        name: 'Self-Touch and Cortisol',
        content:
          'Self-administered touch activates CT afferents less potently than touch from another person, but still measurably. Self-massage (abhyanga, gua sha, scalp massage) produces cortisol reduction and improved mood — demonstrating that solo beauty rituals are not merely placebo. The engagement of attentional resources during self-touch — focusing on sensation rather than thought — provides the additional benefit of mindfulness-mechanism cortisol reduction through suppressing rumination.',
      },
      {
        name: 'Temperature and the Nervous System',
        content:
          'Beauty rituals involving temperature — warm oil, steam rooms, hot baths, cold sea water, cool rosewater mists — leverage thermoreceptor systems to shift autonomic state. Warmth activates parasympathetic dominance (relaxation); sudden cold activates the dive reflex (heart rate slowing, calm alertness). The hammam, jimjilbang, and sea bathing traditions documented in these guides are sophisticated applications of thermal nervous-system regulation that predate the scientific description of the mechanism by millennia.',
      },
      {
        name: 'Rhythm and the Autonomic Nervous System',
        content:
          'Rhythmic repetitive actions — brush strokes, circular massage movements, braiding patterns, the back-and-forth of a facial roller — synchronise with and can shift breathing patterns, which directly influence heart rate variability (HRV). Higher HRV is associated with greater autonomic flexibility, better emotional regulation, and lower baseline anxiety. Beauty rituals are, in this sense, biofeedback-adjacent practices: the slow, rhythmic physical activity trains the body\'s stress response.',
      },
    ],
  },

  scent_and_emotion: {
    title: 'Olfactory Science in Cultural Beauty Practice',
    overview:
      'Scent is the only sense that transmits directly to the limbic system (amygdala and hippocampus) without first passing through the thalamus. This means smell triggers emotional and memory responses faster and more powerfully than any other sense, before cognitive evaluation can modulate them. Cultural beauty traditions that centre fragrance — Arab oud culture, Ayurvedic plant oils, Caribbean coconut, West African shea — are, without having framed it scientifically, delivering direct limbic interventions.',
    key_scents_and_effects: [
      { scent: 'Rose (Rosa damascena)', effect: 'Reduced anxiety, lower heart rate, mood elevation — robust evidence', traditions: ['Arab', 'South Asian'] },
      { scent: 'Frankincense / olibanum', effect: 'Anxiolytic, anti-inflammatory on skin; sacred associations activate positive cognitive appraisal', traditions: ['Arab', 'East African'] },
      { scent: 'Coconut', effect: 'Strongly positive emotional associations in cultures where it is embedded in care memories; mood-lifting through learned association', traditions: ['Caribbean', 'South Asian', 'East Asian'] },
      { scent: 'Sandalwood', effect: 'Mild sedative properties (santalol); grounding, reduces anxiety', traditions: ['South Asian', 'East Asian'] },
      { scent: 'Ylang ylang', effect: 'Reduced blood pressure and respiratory rate in controlled studies; euphoric associations', traditions: ['West African', 'Caribbean'] },
      { scent: 'Lavender', effect: 'Most studied anxiety-reducing botanical scent; universal application across traditions as adopted ingredient', traditions: ['cross-cultural'] },
      { scent: 'Jasmine', effect: 'Stimulant properties distinct from most floral scents; associated with confidence and energy rather than calm', traditions: ['South Asian', 'Arab'] },
      { scent: 'Vetiver', effect: 'Deeply grounding; used in Ayurveda for anxiety; earthy profile associated with rootedness', traditions: ['South Asian', 'Caribbean'] },
    ],
    practice_note:
      'For diaspora communities, maintaining access to the scents of the culture of origin is a specific mental health recommendation — olfactory anchors to home, family, and belonging that can be activated in moments of displacement-related distress.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// EXTENDED COMMUNITY-SPECIFIC CONTENT: ADDITIONAL RITUALS AND GUIDANCE
// ─────────────────────────────────────────────────────────────────────────────

export const EXTENDED_RITUAL_GUIDES = {

  'west-african': {
    additional_rituals: [
      {
        name: 'Ghassoul and Clay Mask Traditions',
        origin: 'North and West African border traditions',
        mental_health_function: 'Sensory regulation, skin purification ritual, slowing down',
        description:
          'Clay masking traditions across West Africa — from kaolin-based masks in West African healing to imported rhassoul clay from the Atlas Mountains — share a common mental health structure: they impose stillness. You cannot run around with a clay mask on your face. You must sit, let it dry, and wait. This enforced pause, embedded in a beauty ritual, provides a regular structured rest period that is often absent from stressed, busy lives. The clay\'s drawing action on the skin is also tactilely satisfying — a physical metaphor for releasing what needs to be released.',
        diy_guide:
          'Kaolin clay mixed with rosewater and a teaspoon of raw honey: anti-inflammatory, gentle brightening, suitable for most skin types. Apply, rest for 10–15 minutes in a comfortable position, rinse with warm water, follow with shea butter.',
      },
      {
        name: 'Communal Night Beauty Rituals',
        origin: 'West African household tradition',
        mental_health_function: 'End-of-day nervous system transition, intergenerational bonding',
        description:
          'In traditional West African households, the evening is a time of communal physical care: children are bathed, hair is oiled or tied down, skin is buttered, and preparations are made for sleep. This nightly ritual creates a predictable sensory sequence that signals to the nervous system that the day\'s alertness is no longer required. Predictable bedtime rituals significantly improve sleep onset latency and sleep quality — particularly relevant for communities experiencing chronic stress, whose sleep architecture is frequently disrupted by elevated cortisol. Recreating this ritual in diaspora settings, even as a solo practice, is a meaningful sleep-hygiene and mental health intervention.',
      },
    ],
    stress_protocol: {
      name: 'West African Stress Recovery Beauty Protocol',
      steps: [
        'Warm bath or shower with black soap to cleanse and reset',
        'Shea butter body massage from feet to shoulders, using slow circular strokes',
        'Warm baobab or coconut oil applied to scalp with 10-minute self-massage',
        'Cover hair with a satin bonnet to protect and signal rest',
        'Optional: burn frankincense or an oud candle for olfactory grounding',
        'Rest with intention: the body has been cared for; it is safe to rest',
      ],
    },
  },

  'south-asian': {
    additional_rituals: [
      {
        name: 'Facial Steaming with Herbs',
        origin: 'Ayurvedic and South Asian home tradition',
        mental_health_function: 'Sinus clearing (which reduces mental fog), skin deep-cleansing, meditative pause',
        description:
          'Herbal facial steaming — boiling water with neem leaves, turmeric, rose petals, or tulsi (holy basil) and tenting the face over the bowl — is a traditional preparation for other treatments (masks, oiling) but also stands alone as a grounding practice. The steam forces slow, deep breathing. The medicinal herbs add their specific properties: neem is powerfully antimicrobial; tulsi is adaptogenic; rose is calming. The 10 minutes of enforced gentle breathing over a bowl of fragrant steam is a complete mindfulness protocol in disguise.',
        recipe:
          'Boil 1 litre of water. Add 5 neem leaves, 1 tsp turmeric, 10 rose petals, and a sprig of fresh tulsi if available. Steep 3 minutes off heat. Tent face over bowl with a towel, eyes closed, breathing deeply for 8–10 minutes.',
      },
      {
        name: 'Ayurvedic Colour Therapy in Beauty',
        origin: 'Traditional Ayurvedic practice (chromotherapy)',
        mental_health_function: 'Mood regulation through intentional colour environment, beauty as holistic wellness',
        description:
          'Ayurveda recognises colour as medicine (chromotherapy). The colours worn, the colours of beauty products, and the colours of the self-care environment all influence mental state. Vata imbalances (anxiety, insomnia, mental scatter) are calmed by warm, golden tones — which is part of why golden sesame oil for abhyanga and yellow turmeric face treatments have a holistic as well as physiological rationale in the Ayurvedic system. Modern colour psychology corroborates several of these intuitions: warm tones reduce anxiety; blues calm but can depress in excess; greens (neem, tulsi, moringa) carry a biophilic calming signal.',
      },
    ],
    stress_protocol: {
      name: 'South Asian Stress Recovery Beauty Protocol',
      steps: [
        'Warm sesame oil abhyanga from head to toe — 20 minutes of slow, full-body self-massage',
        'Rest in the oil for 15 minutes if possible (shirodhara approximation: rest with oil on scalp)',
        'Warm herbal bath with turmeric and rose petals',
        'Post-bath ubtan scrub to exfoliate and brighten',
        'Castor oil on eyebrows and lashes (stimulates growth under stress-related loss)',
        'Tulsi or ashwagandha tea to conclude — adaptogenic support from inside',
      ],
    },
  },

  'caribbean': {
    additional_rituals: [
      {
        name: 'Bay Rum Aftershave and Grooming',
        origin: 'Caribbean tradition, particularly Barbados and Grenada',
        mental_health_function: 'Post-shave ritual completion, masculine self-care normalisation, heritage connection',
        description:
          'Bay rum (distilled from West Indian bay leaves with rum or alcohol base) has been the definitive Caribbean grooming product for men since the 19th century. Its sharp, warm, medicinal-sweet scent is a strong olfactory anchor for Caribbean masculine identity. For Caribbean men in diaspora — a group with particularly underserved mental health needs — the bay rum aftershave ritual is one of the few inherited culturally specific self-care practices. Using it deliberately, as a daily transition ritual (signalling the end of shaving, the beginning of the day), leverages olfactory anchoring for mood and identity stability.',
      },
      {
        name: 'Sorrel and Hibiscus Beauty Applications',
        origin: 'Caribbean herbal tradition',
        mental_health_function: 'Antioxidant skin support, cultural connection through scent and colour',
        description:
          'Hibiscus (dried sorrel flowers, Hibiscus sabdariffa) — used in Caribbean drinks, rituals, and increasingly skincare — contains anthocyanins and AHAs (alpha-hydroxy acids) that gently exfoliate and brighten skin. As a hair rinse, the mucilaginous quality of hibiscus enhances slip and detangling in natural and curly hair. The vivid red of hibiscus-steeped water is visually striking and its light floral-tart scent is a strong Caribbean sensory anchor. Steeping a pot of hibiscus — for drinking and for using as a skin toner — is a simple, affordable ritual that connects to Caribbean botanical knowledge.',
      },
    ],
    stress_protocol: {
      name: 'Caribbean Stress Recovery Beauty Protocol',
      steps: [
        'Epsom salt and coconut milk bath (approximates mineral-rich sea bathing)',
        'Raw coconut oil full-body application while skin is damp from bath',
        'Hibiscus hair rinse or coconut milk deep conditioning treatment',
        'Bay rum or lime-based facial splash for sensory reset',
        'Music: put on soca, reggae, or calypso — the rhythm is medicine',
        'If possible: call home, or call community — the Caribbean mental health protocol includes contact',
      ],
    },
  },

  'arab': {
    additional_rituals: [
      {
        name: 'Oud Perfume as Emotional Regulation',
        origin: 'Arabian Gulf and Levantine tradition',
        mental_health_function: 'Identity anchoring, emotional memory activation, ritual completion marker',
        description:
          'Oud (agarwood resin oil) is among the most expensive and emotionally resonant materials in the world of fragrance. In Arab culture, it is applied before gatherings, before prayer, before important events — it is a social and spiritual signal, not just a personal preference. The layering of oud over rose, musk, or amber is a fragrance composition practice with centuries of refinement. For Arab diaspora communities, the smell of oud is one of the most potent olfactory anchors to home, family, and cultural identity. Using it deliberately — in beauty rituals, before significant moments — activates these associations and provides identity stability in environments that may challenge Arab cultural belonging.',
        modern_alternatives:
          'Authentic oud is prohibitively expensive; synthetic oud aroma chemicals (Iso E Super, Norlimbanol) can be found in quality accessible perfumes that approximate the warmth and depth. Look for "oud" concentration in any price range rather than pure oil if budget is a concern.',
      },
      {
        name: 'Turmeric and Saffron Face Treatments',
        origin: 'Arabian and Levantine cooking-to-beauty crossover',
        mental_health_function: 'Skin brightening, anti-inflammatory treatment, luxury sensory ritual',
        description:
          'Saffron (za\'faran) — used in Arab cooking — has found its way into beauty preparations for centuries. Saffron contains safranal and crocin, which have documented antidepressant properties (clinical trials show saffron supplementation comparable to low-dose fluoxetine for mild-to-moderate depression). Topically, saffron-infused oil brightens skin and reduces hyperpigmentation. Turmeric (kurkum) — similarly dual-purpose — is anti-inflammatory topically and used in Ayurvedic-influenced Gulf beauty traditions. A saffron and milk face mask is both a luxury sensory experience and a genuine functional treatment.',
        recipe:
          '5–6 saffron threads steeped in 2 tablespoons warm whole milk for 10 minutes. Add 1 teaspoon honey. Apply to face, rest for 15 minutes. Rinse and follow with rosewater toner and argan oil.',
      },
    ],
    stress_protocol: {
      name: 'Arab Stress Recovery Beauty Protocol',
      steps: [
        'Hammam-style steam shower: as hot as comfortable, for 10 minutes',
        'Ghassoul or black soap scrub with kessa mitt while steam is still on',
        'Cool rinse to close pores and trigger dive-reflex calm',
        'Argan oil full-body application while damp',
        'Rosewater facial mist and argan face oil',
        'Oud or rosewater on pulse points — the final sensory signal of the ritual',
        'Sit with qahwa (Arabic coffee) or mint tea — the transition to intentional rest',
      ],
    },
  },

  'latina': {
    additional_rituals: [
      {
        name: 'Marigold and Herbs in Beauty Traditions',
        origin: 'Mesoamerican and Latinx folk tradition',
        mental_health_function: 'Spiritual protection during beauty ritual, connection to indigenous botanical knowledge',
        description:
          'Cempasúchil (Aztec marigold, Tagetes erecta) appears in Day of the Dead altars and in folk healing across Mexico and Central America. Calendula (a European cousin) has been absorbed into Latinx herbal beauty practice for its potent anti-inflammatory properties — calendula-infused oil soothes rashes, relieves sunburn, and heals cracked skin. The ritual of infusing oils with herbs — slow, warm, patient, fragrant — is itself a mindfulness practice with a Mesoamerican lineage. The resulting oil carries both the functional benefit of the plant compounds and the care embedded in its making.',
      },
      {
        name: 'The Limpia Smoke Ritual for Beauty and Emotional Clearing',
        origin: 'Mesoamerican curanderismo tradition',
        mental_health_function: 'Ritual completion, intention-setting, cortisol reduction through structured ceremony',
        description:
          'Copal incense — burned in Mesoamerican ceremonial contexts since pre-Columbian times — has been adopted into Latinx beauty ritual as a way of "clearing" a space before a beauty gathering or following a particularly difficult emotional experience. The smoke, the scent (resinous, piney, slightly sweet), and the intention behind burning it create a sensory-ritual frame that signals the nervous system to shift state. Paired with sage, lavender, or rosemary in some traditions, the smoke ritual can precede a beauty treatment as a deliberate transition out of stress-state. The brain responds to structured ritual as a state-change cue — the ritual does not have to be believed in metaphysically to have this effect.',
      },
    ],
    stress_protocol: {
      name: 'Latina Stress Recovery Beauty Protocol',
      steps: [
        'Prepare a tea of manzanilla (chamomile) and canela (cinnamon): drink one cup before beginning',
        'Warm oil scalp massage with castor and coconut oil — 15 minutes',
        'Avocado and honey deep conditioning hair mask (apply, cover with shower cap, 30 minutes)',
        'Rosewater or cucumber facial mist and honey mask on face while hair mask sits',
        'Rinse both, follow with aloe vera gel on skin and coconut oil on hair',
        'Optional: light copal or sage — the ritual close',
        'Call your grandmother, or someone who knows your grandmother\'s remedies',
      ],
    },
  },

  'east-asian': {
    additional_rituals: [
      {
        name: 'Sheet Mask as Enforced Rest',
        origin: 'Korean beauty tradition',
        mental_health_function: 'Mandatory pause, skin hydration surge, sensory pleasure',
        description:
          'The sheet mask is a uniquely complete mental health delivery system disguised as a cosmetic product. The mask must be applied precisely to the face, left completely still for 15–20 minutes, and during that time normal activity is significantly limited (you cannot easily look at a phone, type, or eat). The enforced rest period is the primary mental health benefit — an analogue to a brief meditation session, with the added sensory benefit of cool, serum-soaked fabric on the skin. The occlusive effect delivers a significant hydration spike to the epidermis, providing immediate skin softness that enhances appearance satisfaction.',
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
        mental_health_function: 'Holistic stress treatment, adaptogenic ingredient access, inner-outer health connection',
        description:
          'Hanbang beauty draws on Korean traditional medicine (KTM) to use adaptogenic and tonic herbs in skincare. Ginseng (panax ginseng) — one of the most studied adaptogens in the world — has clinical evidence for reducing cortisol, improving cognitive function under stress, and supporting both immune function and skin elasticity (ginsenosides have topical bioactivity). Licorice root (gam-cho) brightens hyperpigmentation through glabridin\'s tyrosinase inhibition. Astragalus supports immune function and has traditional associations with vitality and longevity. Using hanbang-informed beauty products connects the user to a tradition in which skin health is understood as a systemic reflection of internal balance — identical in philosophy to Ayurveda\'s approach.',
      },
    ],
    stress_protocol: {
      name: 'East Asian Stress Recovery Beauty Protocol',
      steps: [
        'Begin with oil cleanse — warm circular motions on face for 60 seconds before emulsifying',
        'Water cleanse with lukewarm (not hot) water — cool water rinse to finish',
        'Toner patting: pour a few drops into palms, press gently into face 7–8 times',
        'Ampoule or serum with ginseng or centella asiatica',
        'Sheet mask for 20 minutes — device-free, reclined if possible',
        'Gua sha for 8–10 minutes on face and neck — slow, upward strokes',
        'Seal with moisturiser and SPF (morning) or sleeping mask (evening)',
        'Optional: matcha or hojicha tea as the ritual\'s sensory close',
      ],
    },
  },

  'east-african': {
    additional_rituals: [
      {
        name: 'Moringa Leaf Beauty — Inside and Out',
        origin: 'East and West African tradition',
        mental_health_function: 'Nutritional support for stress-depleted skin, adaptogenic support, local botanical pride',
        description:
          'Moringa oleifera (the "miracle tree") grows across East Africa and has been used in traditional nutrition and healing for centuries. Moringa leaf powder is extraordinarily nutrient-dense — containing significant amounts of vitamin C, B vitamins, iron, calcium, and all essential amino acids — making it one of the most potent nutritional interventions for stress-depleted skin and hair. Topically, moringa oil (cold-pressed from seeds) is rich in oleic acid and behenic acid (the latter unusual and excellent for hair cuticle smoothing). Using moringa in both beauty applications and as a food supplement (added to porridge, tea, smoothies) represents the East African holistic approach to beauty: the inside reflects the outside.',
        use_guidance:
          'Moringa oil on face as a lightweight facial oil for dry and combination skin. Moringa powder in a face mask (with honey and rosewater): gentle brightening and nutrient delivery. Moringa powder in morning porridge (ugali, injera side) for nutritional support during high-stress periods.',
      },
      {
        name: 'Incense and Smoke Beauty Rituals',
        origin: 'Horn of Africa and Swahili coast traditions',
        mental_health_function: 'Spiritual protection, olfactory nervous system regulation, ceremonial preparation',
        description:
          'Incense is central to East African beauty preparation. In Somali culture, the debaseh (incense stand) is used to perfume the body: a woman stands over burning incense in a wooden stand, allowing smoke to penetrate clothing and skin. Myrrh, frankincense, and oud chips produce a warm, resinous body fragrance that lasts hours. Ethiopian church incense (primarily frankincense and myrrh) permeates Ethiopian cultural and aesthetic life. The ritualistic use of smoke in preparation for gatherings, ceremonies, and community events creates a shared olfactory environment that signals communal belonging — a potent anxiety-reducing contextual cue.',
      },
    ],
    stress_protocol: {
      name: 'East African Stress Recovery Beauty Protocol',
      steps: [
        'Begin with a full body wash using qasil or black soap — gentle and fragrant',
        'Moringa or shea butter full body oil applied warm to damp skin',
        'Frankincense or myrrh incense burning during the whole process',
        'Scalp oiling with moringa or castor oil, 10-minute massage',
        'If with community: singing during the process — even background traditional music serves the same neurochemical purpose',
        'Rooibos or Ethiopian tea to close the ritual',
        'Contact: text or call community — East African mental health is communal by design',
      ],
    },
  },

  'south-african': {
    additional_rituals: [
      {
        name: 'Baobab Oil Body Care',
        origin: 'Southern African traditional use',
        mental_health_function: 'Skin barrier repair, ancestral ingredient connection, luxurious self-touch ritual',
        description:
          'Baobab oil (from Adansonia digitata, the "tree of life") is extracted from the fruit of the baobab — one of the most iconic and revered trees of the African savanna. The oil is extraordinarily rich in omega-3, -6, and -9 fatty acids and absorbs rapidly and completely without greasiness. In traditional southern African practice, baobab oil was used on newborn skin, on elderly skin, and for everything between — a whole-life skin care ingredient. Its complete absorption makes it ideal for both face and body; its fatty acid balance is excellent for repairing stress-depleted skin barriers. Using baobab oil is an act of connection to the southern African landscape — and to the ancestral wisdom that identified this ingredient centuries before modern extraction technology.',
      },
      {
        name: 'Traditional Smoke Bath (Ukugeza Ngomusi)',
        origin: 'Zulu and Xhosa traditional practice',
        mental_health_function: 'Spiritual purification, sensory grounding, identity anchoring',
        description:
          'In Zulu and Xhosa tradition, the smoke bath (in which medicinal plants are burned in a pit below a stool on which the person sits, allowing aromatic smoke to permeate the skin and body) serves both hygienic and spiritual functions. The plants used (which vary by region and healer knowledge) have antimicrobial, anti-inflammatory, and psychoactive-adjacent properties. The ceremonial structure of the practice — the preparation, the sitting, the exposure, the cooling — creates a complete state-transition ritual. Modern South African women, particularly those maintaining connection to traditional practice, incorporate simplified smoke-bath approximations into self-care using commercially available versions of traditional botanicals.',
      },
    ],
    stress_protocol: {
      name: 'South African Stress Recovery Beauty Protocol',
      steps: [
        'Rooibos bath: steep 6 bags in warm bathwater, soak for 20 minutes',
        'While in the bath: rooibos-soaked muslin cloth as a facial compress',
        'Baobab or marula oil applied to damp skin immediately post-bath',
        'Scalp massage with moringa or marula oil — 10 minutes',
        'Optional: rooibos toner on face, marula facial oil to seal',
        'Traditional music or singing while completing routine',
        'Ubuntu practice: share the protocol with someone else — beauty that is given away doubles',
      ],
    },
  },

  'black-american': {
    additional_rituals: [
      {
        name: 'Hot Comb and Press Heritage',
        origin: 'Black American beauty tradition from post-Reconstruction era',
        mental_health_function: 'Cultural continuity, intergenerational memory, sensory-soothing ritual',
        description:
          'The hot comb press — warming a metal comb on the stove and carefully straightening sections of natural hair — is a ritual with layered significance in Black American history. It enabled Black women to navigate white professional environments while maintaining community. It was (and is) a tactile, slow, intergenerational practice: the smell of warm hair and Dixie Peach pomade is an olfactory time machine for many Black Americans of a certain generation. Its revival in some communities is specifically about honoring the ingenuity of an earlier generation navigating impossible constraints — not endorsing those constraints. Understanding this distinction, and choosing hair practices with historical awareness, is part of the mental health work of Black American beauty.',
      },
      {
        name: 'Deep Condition Sunday — The Self-Care Anchor',
        origin: 'Black American natural hair community',
        mental_health_function: 'Weekly structured self-care ritual, reset and preparation, sensory luxury accessible to all budgets',
        description:
          'In the Black American natural hair community, Sunday is often "wash day" — a practice that has become a cultural touchstone. The extended time required for washing, deep conditioning, detangling, and styling 4A/4B/4C hair turns a hair care necessity into a weekly self-care ritual. Deep conditioning (with store-bought conditioners, or DIY with avocado, honey, and oil) under heat (hooded dryer, steamer, or a warm towel) provides both hair benefit and enforced rest time. Many Black women report that wash day — once dreaded — has become one of their most grounding weekly practices when approached intentionally.',
        deep_conditioning_diy:
          '1 ripe avocado, 2 tablespoons of honey, 2 tablespoons of coconut oil, 1 tablespoon of castor oil. Blend smooth. Apply to hair from roots to ends. Cover with a shower cap and warm towel. Rest for 30–45 minutes. Rinse thoroughly. Follow with a light leave-in conditioner and seal with a small amount of shea butter.',
      },
    ],
    stress_protocol: {
      name: 'Black American Stress Recovery Beauty Protocol',
      steps: [
        'Set the scene: music you love, candles or a warm lamp, phone on do-not-disturb',
        'Hot shower — let the water be as warm as comfortable, stand under it for at least 5 minutes',
        'DIY deep conditioning hair mask applied and covered with shower cap',
        'Honey or clay face mask while hair mask processes',
        'Remove both masks; apply leave-in and shea to hair, vitamin C serum and moisturiser to face',
        'Edge control and style — the act of mastery and presentation',
        'SPF in the morning: the final protective act',
        'Optional: call the salon — sometimes the beauty protocol needs a professional and a community',
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MENTAL HEALTH CRISIS RESOURCES — UNIVERSAL
// ─────────────────────────────────────────────────────────────────────────────

export const MENTAL_HEALTH_CRISIS_RESOURCES = {
  note: 'Beauty rituals support mental wellbeing but are not a substitute for professional mental health care. If you or someone you know is in crisis, please reach out to a professional resource.',
  global: [
    { name: 'International Association for Suicide Prevention', url: 'https://www.iasp.info/resources/Crisis_Centres/' },
    { name: 'Crisis Text Line (US/UK/Canada/Ireland)', contact: 'Text HOME to 741741 (US), 85258 (UK), 45645 (Canada), 50808 (Ireland)' },
  ],
  by_region: {
    'united-states': [
      { name: '988 Suicide and Crisis Lifeline', contact: 'Call or text 988' },
      { name: 'Therapy for Black Girls', url: 'therapyforblackgirls.com' },
      { name: 'Loveland Foundation', url: 'lovelandfoundation.org', note: 'Therapy grants for Black women and girls' },
      { name: 'Latinx Therapy', url: 'latinxtherapy.com' },
      { name: 'Asian Mental Health Project', url: 'asianmhp.com' },
    ],
    'united-kingdom': [
      { name: 'Samaritans', contact: '116 123 (free, 24/7)' },
      { name: 'Black Minds Matter UK', url: 'blackmindsmatteruk.com' },
      { name: 'Soch Mental Health', url: 'sochmentalhealth.com', note: 'South Asian mental health' },
      { name: 'Nahr', url: 'nahr.org.uk', note: 'Arab mental health' },
    ],
    'canada': [
      { name: 'Crisis Services Canada', contact: '1-833-456-4566' },
      { name: 'Black Youth Helpline', contact: '1-833-294-8650' },
    ],
    'south-africa': [
      { name: 'SADAG', contact: '0800 456 789', url: 'sadag.org' },
      { name: 'Lifeline South Africa', contact: '0861 322 322' },
    ],
    'australia': [
      { name: 'Lifeline', contact: '13 11 14' },
      { name: 'Black Dog Institute', url: 'blackdoginstitute.org.au' },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ADDITIONAL UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// BEAUTY AND MENTAL HEALTH: HAIR-SPECIFIC SCIENCE ACROSS ETHNICITIES
// ─────────────────────────────────────────────────────────────────────────────

export const HAIR_MENTAL_HEALTH_SCIENCE = {
  telogen_effluvium: {
    title: 'Stress Hair Loss: A Guide for Ethnic Hair Types',
    overview:
      'Telogen effluvium (TE) is the medical name for stress-related hair shedding. During prolonged psychological or physiological stress, the body diverts resources away from non-essential functions — including hair growth. A disproportionate number of follicles shift from the growth phase (anagen) to the resting/shedding phase (telogen). Hair loss appears 8–16 weeks after the triggering event, creating a delayed and often confusing presentation. TE is temporary in most cases: when the stressor is resolved or managed, regrowth typically follows within 6–9 months.',
    by_hair_type: [
      {
        type: 'Type 4 (Coily/Kinky) — Most common in West African, East African, Black American, South African communities',
        specific_concerns: [
          'High porosity in many Type 4 textures means shedding can be less visible day-to-day but more alarming when accumulated (in a shower, on a comb)',
          'Protective styles can mask shedding and make it harder to detect TE early — important to check the scalp directly',
          'Traction from tight protective styles can compound stress-related shedding with mechanical hair loss (traction alopecia)',
        ],
        recovery_ingredients: ['Bhringraj oil', 'Rosemary oil (proven in clinical trial comparable to minoxidil)', 'Castor oil', 'Peppermint oil diluted in carrier'],
      },
      {
        type: 'Type 3 (Curly) — Common in Latina, Caribbean, mixed-heritage communities',
        specific_concerns: [
          'Shedding can be confused with the normal shed hairs trapped in curls and released during detangling',
          'Identifying true TE requires monitoring shed counts during wash sessions (more than 100 hairs per wash consistently suggests TE)',
          'Curly hair benefits from protein–moisture balance support during TE recovery',
        ],
        recovery_ingredients: ['Biotin (internal supplement)', 'Pumpkin seed oil (DHT-blocking properties)', 'Collagen supplements', 'Argan oil for scalp'],
      },
      {
        type: 'Type 1–2 (Straight/Wavy) — Common in East Asian, South Asian (some), Arab communities',
        specific_concerns: [
          'Shedding is often most visible on straight hair textures — in the shower drain, on pillowcases, in brushes',
          'Scalp sebum distribution is most efficient on straight hair, which may slightly buffer scalp health during stress; however, excess sebum under stress can clog follicles',
          'Asian hair follicles have slightly larger diameter shafts, making individual hairs less numerous than African-heritage hair; each shed hair is visibly significant',
        ],
        recovery_ingredients: ['Ginseng (topical and oral)', 'Saw palmetto (DHT-blocking)', 'Niacinamide on scalp', 'Minoxidil (medical, if TE persists beyond 9 months)'],
      },
    ],
    universal_recovery_protocol: [
      'Reduce heat styling and chemical processing during TE episode — minimise all stressors on fragile, actively shedding hair',
      'Scalp massage 5–10 minutes daily with rosemary-infused or bhringraj oil — increases dermal papilla cell proliferation',
      'Protein-rich diet: hair is primarily keratin; stress depletes protein reserves',
      'Supplemental iron (check levels with GP — iron-deficiency anaemia is a common TE co-trigger, especially in women)',
      'Adaptogenic herbs (ashwagandha, rhodiola, eleuthero) to reduce cortisol at the systemic level',
      'Patience: TE regrowth takes 6–9 months and the "baby hair" phase is real and universal',
    ],
  },

  hair_and_identity: {
    title: 'Hair as Identity: The Mental Health Significance Across Communities',
    entries: [
      {
        community: 'Black American and Afro-Caribbean',
        narrative:
          'Hair has been central to Black identity and political struggle in ways that have no parallel in other communities. The Afro as a symbol of Black Power, the systematic denigration of "nappy" hair, the CROWN Act as legislative recognition of hair discrimination — these are not marginal events. The mental health dimension of hair for Black women and men is layered with this history. Natural hair movements are explicitly mental health movements: they work to decouple appearance satisfaction from assimilation pressure.',
      },
      {
        community: 'South Asian',
        narrative:
          'Long, thick, oiled hair has been the traditional ideal of beauty across South Asia — a direct extension of Ayurvedic health ideals in which lustrous hair signals vitality. The champi tradition is inseparable from this: caring for hair is caring for health. For South Asian women in diaspora who face pressure to westernise their appearance (including removing cultural hair practices from the workplace), the choice to oil, braid, or wear a traditional style is an identity statement with mental health stakes.',
      },
      {
        community: 'Latina',
        narrative:
          'Hair politics in Latinx communities involve the tension between the straight-hair ideal (reflecting European beauty standards) and the curly, wavy, and kinky textures of Indigenous and African heritage. The "pelo malo" (bad hair) versus "pelo bueno" (good hair) dichotomy is a direct manifestation of colorism in the beauty domain. The curly/natural hair movement in Latinx communities mirrors the Black natural hair movement in its psychological liberation dimension.',
      },
      {
        community: 'East Asian',
        narrative:
          'Hair thinning (androgenetic alopecia presenting earlier than in other populations in some East Asian men) and hair-related anxiety is common. In South Korea, the beauty industry has developed some of the world\'s most sophisticated scalp care and hair growth systems precisely because of cultural investment in thick, healthy hair. The pressure to maintain appearance — including hair — is significant and underpins the scalp-care market as a mental-health-adjacent industry.',
      },
      {
        community: 'West African and East African',
        narrative:
          'Hair in West and East African traditions carries social information: age, marital status, ethnicity, and community affiliation have historically been communicated through hair styling. The communal nature of braiding — sitting together for hours, transmitting knowledge, maintaining social bonds — gives hair its social weight beyond aesthetics. For diaspora communities, the braiding salon is one of the last spaces where this social function is preserved.',
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SKIN MICROBIOME AND STRESS — EXTENDED SCIENCE
// ─────────────────────────────────────────────────────────────────────────────

export const SKIN_MICROBIOME_STRESS_SCIENCE = {
  overview:
    'The skin microbiome — the community of bacteria, fungi, and viruses living on the skin\'s surface — is a key regulator of skin health, immune function, and barrier integrity. Chronic stress disrupts the skin microbiome in documented ways, creating dysbiosis that amplifies inflammation, worsens acne, and increases sensitivity.',
  stress_disruption_mechanisms: [
    {
      mechanism: 'Cortisol alters sebum composition',
      detail:
        'Stress-elevated cortisol changes the fatty acid composition of sebum, creating an environment more favourable to Cutibacterium acnes proliferation and less favourable to commensal bacteria (Staphylococcus epidermidis, Propionibacterium, Corynebacterium) that normally protect the skin.',
    },
    {
      mechanism: 'Barrier dysfunction creates dysbiosis',
      detail:
        'When the skin barrier is compromised by stress-driven ceramide reduction, the relative humidity and pH of the skin surface shift — creating conditions that advantage pathogenic organisms over commensal ones.',
    },
    {
      mechanism: 'Psychological stress suppresses skin immune response',
      detail:
        'Psychological stress reduces Langerhans cell activity in the skin — these dendritic immune cells are the first line of pathogen defence. A stressed immune system is less able to regulate microbial communities effectively.',
    },
  ],
  microbiome_supporting_beauty_practices: [
    {
      practice: 'Probiotic-based skincare',
      note:
        'Topical lactobacillus ferment and probiotic lysates have growing evidence for restoring barrier function and reducing inflammation. Particularly relevant for stress-related acne and eczema flares.',
    },
    {
      practice: 'Avoid over-cleansing',
      note:
        'Aggressive cleansers with high alcohol or sulfate content strip commensal bacteria along with sebum. During high-stress periods when the microbiome is already disrupted, switching to gentle, pH-balanced cleansers preserves microbial diversity.',
    },
    {
      practice: 'Prebiotic ingredients',
      note:
        'Inulin, beta-glucan, and other prebiotic compounds in skincare feed commensal bacteria and support their protective functions. Oat-based products, honey, and aloe vera all have prebiotic properties.',
    },
    {
      practice: 'Fermented beauty ingredients',
      note:
        'Korean fermented ingredients (galactomyces, bifida ferment lysate, fermented rice water) are particularly advanced in their support of skin microbiome health. The fermentation process breaks down large molecules and increases bioavailability of protective compounds.',
    },
  ],
  community_specific_microbiome_notes: {
    'dark-skin-tones':
      'Research suggests that skin microbiome composition varies across Fitzpatrick types — with darker skin tones showing different relative abundances of certain Staphylococcus species. Commercial skincare products formulated primarily for lighter skin types may not be optimally calibrated for darker skin microbiome composition. This is an active area of dermatological research.',
    'oily-skin-types':
      'Higher sebum production (common in West African, South Asian, and Latina skin types) creates a microbiome environment more prone to Cutibacterium acnes overgrowth during stress. Niacinamide (which reduces sebum production) and azelaic acid (which is antimicrobial) are particularly useful microbiome-supportive interventions for these skin types.',
    'dry-climate-skin':
      'In arid climates (Middle East, parts of East Africa and South Africa), lower skin surface humidity reduces microbial diversity and increases the risk of dysbiosis. Heavy occlusives (shea, petrolatum, cocoa butter) protect barrier function and maintain the moisture environment the microbiome requires.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// BEAUTY RITUAL DESIGN PRINCIPLES FOR MENTAL HEALTH
// ─────────────────────────────────────────────────────────────────────────────

export const RITUAL_DESIGN_PRINCIPLES = {
  title: 'How to Design a Beauty Ritual for Maximum Mental Health Benefit',
  overview:
    'Not all beauty routines are equally effective as mental health practices. The difference between a rushed, anxiety-driven skincare session and a deliberate, calming ritual is not primarily about products — it is about structure, intention, and sensory engagement. These principles apply across all nine communities documented in this guide.',
  principles: [
    {
      name: 'Temporal boundedness',
      description:
        'A ritual has a beginning, a middle, and an end. It marks a transition. The most effective mental health beauty rituals create a clear temporal boundary: a designated time that is protected from other demands. Even 10 minutes is sufficient if it is genuinely set apart.',
      practical_application: 'Light a candle at the beginning and blow it out at the end. Put a specific playlist on that plays only during the ritual. These temporal anchors signal to the brain that a different mode of engagement is in effect.',
    },
    {
      name: 'Sensory layering',
      description:
        'The most potent mental health beauty rituals engage multiple senses simultaneously: touch (massage, texture), smell (botanical oils, candles), sound (music, ambient), temperature (warm oil, cool mist). Engaging multiple sensory modalities narrows attentional focus to the present moment more effectively than any single-sense experience.',
      practical_application: 'Build your ritual to include: one tactile element (massage, mask), one olfactory element (scented product, candle, incense), and one auditory element (music or silence). Temperature contrast is a powerful add-on.',
    },
    {
      name: 'Sequentiality and repetition',
      description:
        'The same sequence performed repeatedly becomes a conditioned relaxation cue. The brain begins to associate the first step of the ritual with the relaxed state of the full ritual. This is classical conditioning applied beneficially: after enough repetitions, smelling your cleanser alone is enough to begin the parasympathetic shift.',
      practical_application: 'Use the same products in the same order every time. Do not experiment with new products in a ritual context — novelty requires cognitive engagement that disrupts the relaxation response.',
    },
    {
      name: 'Absence of performance',
      description:
        'A mental health beauty ritual is not a social performance or content creation opportunity. Taking selfies during the process, broadcasting on social media, or performing for an imagined audience activates social-evaluation anxiety, which is precisely the opposite of what the ritual is designed to achieve.',
      practical_application: 'Do your ritual without documentation. The experience, not the record of the experience, is the intervention.',
    },
    {
      name: 'Cultural grounding',
      description:
        'Rituals drawn from one\'s own cultural heritage are more potent mental health tools than imported practices from unfamiliar traditions. The olfactory, cultural, and identity associations embedded in ancestral beauty practices amplify their physiological effects. A West African woman oiling her hair with shea butter is engaging a more psychologically resonant practice than a Western wellness practice performed without cultural context.',
      practical_application: 'Identify at least one element in your routine that comes from your own cultural heritage — an ingredient, a technique, a scent. Anchor your modern routine in ancestral knowledge, even if only in this one element.',
    },
    {
      name: 'Receiving care, not just giving it',
      description:
        'The communities in this guide that have the most robust beauty-as-mental-health traditions share a common feature: the beauty ritual involves receiving care from another person, not just self-administering. The oxytocin and attachment-safety effects of being tended to by another human are substantially greater than self-touch alone.',
      practical_application: 'Prioritise communal beauty experiences — salon appointments, braiding sessions, spa visits with a friend — as dedicated mental health time, not as luxury indulgences. They are not the same thing.',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// FINAL UTILITY: COMPREHENSIVE GUIDE SEARCH
// ─────────────────────────────────────────────────────────────────────────────

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
          source: guide && guide.signature_rituals && guide.signature_rituals.includes(ritual)
            ? 'core'
            : 'extended',
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

// ─────────────────────────────────────────────────────────────────────────────
// SEASONAL AND CYCLICAL BEAUTY MENTAL HEALTH
// ─────────────────────────────────────────────────────────────────────────────

export const SEASONAL_BEAUTY_MENTAL_HEALTH = {
  title: 'Beauty Rituals Across the Year: Seasonal Adjustment for Mental Health',
  overview:
    'Mental health and skin health both shift with the seasons, and beauty rituals that ignore these cycles miss an important opportunity for calibration. Across the nine communities documented here, seasonal beauty practice is embedded in cultural calendars — Ramadan skin adjustments, Diwali beauty preparation, Carnival embodiment, harvest-festival adornment — each reflecting the community\'s embedded wisdom about how the body, mind, and environment interact across the year.',
  seasons: [
    {
      season: 'Winter',
      mental_health_concerns: ['Seasonal Affective Disorder (SAD)', 'Reduced social contact', 'Reduced UV-driven vitamin D synthesis', 'Holiday-related family stress'],
      skin_concerns: ['Barrier compromise from cold, dry air and central heating', 'Increased eczema and psoriasis flares', 'Dull complexion from reduced circulation'],
      beauty_adjustments: [
        'Switch to richer occlusives: shea butter, cocoa butter, marula oil over lighter serums',
        'Reduce exfoliation frequency — a compromised barrier cannot tolerate the additional stress',
        'Add a facial oil as final step of every routine',
        'Consider a vitamin D supplement — deficiency amplifies mood disturbance and skin healing delays',
        'Use warm, golden-scented products (frankincense, sandalwood, amber) to compensate for the olfactory flatness of winter environments',
      ],
      community_winter_practices: {
        'west-african': 'Shea butter application frequency increases in harmattan season (dry West African winter)',
        'south-asian': 'Sesame oil abhyanga is most recommended in winter in Ayurvedic calendars — it is warming and barrier-protecting',
        'arab': 'Hammam frequency traditionally increases in winter — the warmth and steam are antidotes to cold and darkness',
        'black-american': 'Heavier hair butters and protective styles shelter natural hair from cold, dry winter air',
      },
    },
    {
      season: 'Spring',
      mental_health_concerns: ['Adjustment energy — motivation returning after winter; anxiety about change', 'Allergen-driven skin reactivity'],
      skin_concerns: ['Sensitivity increases as skin adapts to changing humidity', 'Allergy-driven inflammation and itching', 'UV exposure increasing — SPF must be revisited'],
      beauty_adjustments: [
        'Reintroduce exfoliation gently — one per week to start',
        'Check SPF and upgrade if winter protection was lower',
        'Add niacinamide or azelaic acid for any hyperpigmentation that deepened over winter',
        'Reassess hair porosity — winter product build-up may require a clarifying wash',
        'Lighter, water-based hydration can replace winter occlusives for most skin types',
      ],
    },
    {
      season: 'Summer',
      mental_health_concerns: ['Heat-related irritability and fatigue', 'Body image pressure from summer dress norms', 'Festival and event social anxiety', 'For many diaspora communities, increased contact with country of origin raises complex emotions'],
      skin_concerns: ['Highest UV exposure — SPF most critical', 'Increased sweating and congestion', 'Chlorine and salt water exposure dehydrating hair and skin', 'Hyperpigmentation risk peaks'],
      beauty_adjustments: [
        'SPF50 broad-spectrum, every day, reapplied every 2 hours during outdoor exposure — non-negotiable across all skin tones',
        'Light, gel-based moisturisers over heavy creams in humid heat',
        'Vitamin C serum in the morning: photoprotective and brightening while UV exposure is highest',
        'After sea or pool: rinse immediately, deep condition hair, apply soothing aloe to skin',
        'Rose water facial mist throughout the day for sensory cooling and mood regulation',
      ],
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
      beauty_adjustments: [
        'Begin transitioning back to richer moisturisers',
        'Introduce a peptide or retinol product — autumn\'s lower UV makes this the best season to start',
        'Deep conditioning treatments for summer-damaged hair',
        'Vitamin C serum to address summer hyperpigmentation while still getting minimal sun',
        'Scent transition: move toward warmer, woodsier fragrances that prepare the nervous system for the colder months ahead',
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// BEAUTY AND HORMONAL MENTAL HEALTH — SHARED EXPERIENCES ACROSS COMMUNITIES
// ─────────────────────────────────────────────────────────────────────────────

export const HORMONAL_BEAUTY_MENTAL_HEALTH = {
  title: 'Hormonal Transitions and Beauty-Mental Health Across Ethnic Communities',
  overview:
    'Hormonal transitions — menstruation, pregnancy, postpartum, perimenopause, menopause — affect both mental health and skin/hair significantly, with community-specific cultural framing that shapes how these experiences are navigated.',
  transitions: [
    {
      transition: 'Menstrual Cycle',
      mental_health_dimension:
        'PMDD and PMS create cyclical mood disturbance in a significant minority of menstruating people. The luteal phase (days 14–28) is characterised by progesterone dominance and often increased anxiety, irritability, and depressive affect. Many beauty rituals are instinctively timed to the cycle — more elaborate self-care in the luteal phase is a community-encoded response to the increased self-care need of this period.',
      skin_dimension:
        'Luteal phase: progesterone increases sebum production, pores appear larger, acne is more likely. Follicular phase: oestrogen peaks, skin is at its most luminous and receptive to treatment.',
      community_wisdom: [
        'South Asian Ayurveda tracks the cycle and adjusts self-care accordingly — cooling treatments during pitta-dominant luteal phases',
        'West African and Caribbean communities historically honoured menstruation as a period requiring additional rest and community care',
        'East Asian TCM views the menstrual cycle as a key diagnostic window into systemic health, with herbs and acupuncture calibrated to cycle phase',
      ],
    },
    {
      transition: 'Pregnancy',
      mental_health_dimension:
        'Perinatal anxiety and depression affect up to 20% of pregnant people. Cultural support structures — the South Asian god bharai ceremony, the West African pregnancy celebration, the Latina babyshower — are partially mental health interventions, normalising the transition and embedding the mother in community care.',
      skin_dimension:
        'Melasma ("mask of pregnancy") is extremely common, particularly in South Asian, Latina, Arab, and Black communities with higher baseline melanin. Stretch marks are universal and culturally processed very differently — some communities celebrate them; others use intensive oils (argan, rosehip, shea) to minimise them.',
      beauty_restrictions:
        'Retinoids, salicylic acid above 2%, hydroquinone, and chemical sunscreens (oxybenzone) are typically avoided in pregnancy. Safe alternatives: azelaic acid, niacinamide, vitamin C, physical/mineral SPF, hyaluronic acid.',
    },
    {
      transition: 'Perimenopause and Menopause',
      mental_health_dimension:
        'The menopausal transition involves oestrogen decline that directly affects mood (oestrogen modulates serotonin and dopamine systems), sleep (hot flashes disrupting sleep architecture), and identity. In many Western contexts, menopause is medically managed but culturally minimised. In contrast, several of the communities documented here embed menopause in a framework of elder wisdom and increased community status — a mental health-protective framing.',
      skin_dimension:
        'Oestrogen decline causes accelerated collagen loss (30% in the first 5 years of menopause), reduced skin thickness, dryness, and increased facial hair in some individuals. Hair thinning (female-pattern alopecia) is common. Skin may become more reactive as the barrier function that oestrogen supported declines.',
      community_framings: [
        { community: 'West African', framing: 'Menopause is associated with elder status, reduced social restriction, and increased community authority — a framing that provides psychological protection against the identity-loss anxiety common in Western contexts' },
        { community: 'South Asian', framing: 'Ayurveda views menopause as a transition into the Vata-dominant phase of life, requiring specific dietary and self-care adjustments — a framework that normalises and supports the transition rather than pathologising it' },
        { community: 'East Asian', framing: 'Traditional Chinese Medicine has extensive menopause support protocols (nourishing yin, clearing heat) that provide a structured response to the transition; TCM views it as a significant but navigable physiological event' },
        { community: 'Black American', framing: 'The beauty salon as a space where older Black women are celebrated and hold authority provides a social context in which aging is not synonymous with diminishing value — an important contrast to dominant Western ageism' },
      ],
      beauty_support: [
        'Peptide-rich serums to support collagen synthesis in the absence of oestrogen stimulation',
        'Phytoestrogen ingredients (soy isoflavones, red clover) have some evidence for topical collagen support',
        'Heavier moisturisation and barrier support becomes essential — upgrade occlusives',
        'SPF remains critical — photoaging accelerates post-menopause',
        'Scalp massage and rosemary oil for menopausal hair thinning (evidence base growing)',
      ],
    },
  ],
};

export function getSeasonalBeautyMentalHealth() {
  return SEASONAL_BEAUTY_MENTAL_HEALTH;
}

export function getHormonalBeautyMentalHealth() {
  return HORMONAL_BEAUTY_MENTAL_HEALTH;
}

export const GUIDE_METADATA = {
  version: '1.0.0',
  totalCommunities: 9,
  communityIds: ALL_COMMUNITY_IDS,
  contentAreas: [
    'community-specific beauty rituals',
    'mental health context per community',
    'cortisol and skin science',
    'parasympathetic nervous system activation through beauty',
    'hair loss and stress (telogen effluvium)',
    'skin microbiome and stress',
    'seasonal beauty adjustments',
    'hormonal transitions and beauty',
    'beauty dysmorphia and when to seek help',
    'political dimension of ethnic beauty standards',
    'ritual design principles for maximum mental health benefit',
    'crisis resources by region',
    'ingredient cross-reference across communities',
    'scent science and olfactory-limbic pathway',
    'touch neuroscience (C-tactile afferents)',
  ],
  disclaimer:
    'This guide is for educational and self-care purposes. It is not a substitute for professional mental health care or medical dermatological advice. If you are experiencing significant psychological distress, please contact a mental health professional.',
};

export function getGuideMetadata() {
  return GUIDE_METADATA;
}
