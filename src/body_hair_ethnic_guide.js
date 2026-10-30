// body_hair_ethnic_guide.js
// Body hair removal and management practices across 9 ethnic communities
// ESM module — no imports, fully self-contained

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL BODY HAIR SCIENCE & METHODS
// ─────────────────────────────────────────────────────────────────────────────

export const UNIVERSAL_BODY_HAIR = {
  id: 'universal',
  title: 'Universal Body Hair Science, Methods & Skincare',

  hairGrowthScience: {
    phases: {
      anagen: 'Active growth phase lasting 2–7 years depending on body area. Leg and arm hair anagen phases are much shorter (months) than scalp hair, which is why body hair does not grow as long as head hair.',
      catagen: 'Brief transitional phase lasting 2–3 weeks, during which the hair follicle shrinks and detaches from the dermal papilla.',
      telogen: 'Resting phase lasting approximately 3 months. Hair sits idle in the follicle before being shed and replaced by a new anagen hair.',
      exogen: 'Active shedding phase, sometimes classified separately, during which the old hair is expelled and lost.',
    },
    follicleShape:
      'The cross-sectional shape of the hair follicle determines curl pattern. Round follicles produce straight hair; oval to highly elliptical follicles produce wavy to tightly coiled hair. This is the anatomical root cause of pseudofolliculitis barbae (PFB) and ingrown hairs in these populations.',
    density:
      'Hair density varies enormously between individuals and body areas. South Asian and Mediterranean/Arab populations toward denser, coarser body hair; African-descended populations toward coarser, tightly coiled hair at moderate-to-high density.',
  },

  removalMethods: {
    shaving: {
      name: 'Shaving',
      description:
        'The most widely practiced method globally. A blade slices the hair at the skin surface, leaving a blunt, sharp tip that — particularly in curly hair — can curve back and pierce the skin as it grows. Shaving does not change the rate or texture of hair growth; the perception of thicker regrowth is an optical illusion caused by the blunt cut edge.',
      bestFor: 'Legs, underarms, bikini line (surface-level).',
      risks: [
        'Razor bumps (PFB) — highest risk in tightly coiled hair types',
        'Razor burn from dull blades or inadequate lubrication',
        'Cuts and nicks',
        'Post-inflammatory hyperpigmentation (PIH) in darker skin tones',
        'Folliculitis from bacteria introduced via open follicles',
      ],
      technique: [
        'Soften hair with warm water for at least 3 minutes before shaving',
        'Apply a lubricating shave gel or cream — never shave dry',
        'Use a sharp, single-blade or double-edge razor for curly/coily hair (multi-blade razors lift and cut hair below the skin surface, dramatically increasing ingrown risk)',
        'Shave in the direction of hair growth (with the grain) for sensitive or prone-to-ingrown areas',
        'Rinse blade after every 2–3 strokes',
        'Follow with a gentle alcohol-free soothing product — aloe vera gel, witch hazel, or a barrier cream',
      ],
      postCare:
        'Apply salicylic acid (1–2%) or glycolic acid (5–10%) 24–48 hours after shaving to exfoliate and prevent ingrown hairs. Avoid tight clothing over freshly shaved areas.',
    },

    waxing: {
      name: 'Waxing',
      description:
        'Hot or warm wax is applied in the direction of hair growth and removed against it, pulling hairs from the root. Results last 3–6 weeks depending on the individual\'s growth cycle. Because the hair is removed from the root, regrowth is tapered and softer than after shaving. Repeated waxing can gradually reduce hair density over time by weakening the follicle.',
      bestFor: 'Legs, bikini area, underarms, arms, back, chest.',
      risks: [
        'Burns from wax that is too hot — a significant risk in home use',
        'Post-inflammatory hyperpigmentation in skin phototypes IV–VI',
        'Folliculitis',
        'Ingrown hairs if proper exfoliation protocol is not followed',
        'Skin lifting (skin tearing), especially with retinol or AHA use — clients should stop retinoids 5–7 days before waxing',
      ],
      types: {
        softWax:
          'Applied thin, removed with a cloth strip. Best for large areas. Cannot be applied twice to the same area in one session without risk of skin lifting.',
        hardWax:
          'Applied thicker, allowed to cool and harden, then removed without a strip. Gentler on sensitive skin. Ideal for bikini, underarm, and face areas. Less likely to cause skin lifting.',
        sugarWax:
          'A form of soft waxing using a sugar-based paste (see sugaring). Applied against the grain and removed with the grain — the opposite of traditional waxing — which reduces breakage and ingrown hairs.',
      },
      postCare:
        'Apply a soothing lotion containing aloe vera, centella asiatica, or chamomile immediately after. Avoid sun exposure, hot showers, pools, and exercise for 24 hours. Begin gentle exfoliation 48–72 hours post-wax to prevent ingrowns.',
    },

    sugaring: {
      name: 'Sugaring (Sugar Waxing)',
      description:
        'One of the oldest hair removal methods in recorded human history, practiced across the Arab world, North Africa, South Asia, and Eastern Europe for thousands of years. A paste made from sugar, lemon juice, and water is applied at body temperature or slightly warm, worked into the skin against the hair growth direction, then flicked off in the direction of growth. Because it is removed with the grain, it causes less breakage and significantly fewer ingrown hairs than traditional waxing. The paste is water-soluble (easy cleanup), all-natural, and hypoallergenic. The sugar also acts as a mild humectant, leaving skin smoother after removal.',
      recipe: {
        ingredients: ['2 cups white sugar', '1/4 cup lemon juice (fresh)', '1/4 cup water'],
        method:
          'Combine all ingredients in a heavy-bottomed saucepan over medium heat. Stir until sugar dissolves. Stop stirring and bring to a boil. Cook until the mixture reaches the soft-ball stage (235–240°F / 112–115°C on a candy thermometer) and turns a golden amber color. The paste should be thick, pliable, and pull cleanly off a spoon. Pour into a heatproof jar and let cool to body temperature before use. The paste should feel warm but never hot on the inside of the wrist.',
      },
      application:
        'Apply a thin layer of baby powder or cornstarch to the area to absorb moisture. Work a walnut-sized ball of paste against the hair growth direction using fingers, spreading it in a thin even layer. Flick off quickly in the direction of hair growth. The same ball of paste can be reused on the same area multiple times.',
      bestFor: 'All body areas. Particularly gentle on bikini, face, and underarms.',
      risks: [
        'Burns if paste is used too hot',
        'Breakage if technique is incorrect (pulling at wrong angle)',
        'Post-inflammatory hyperpigmentation if skin is inflamed during removal',
      ],
    },

    threading: {
      name: 'Threading',
      description:
        'A technique originating in South Asia and the Middle East in which a doubled, twisted cotton thread is rolled across the skin, catching and lifting hairs from the follicle. It is exceptionally precise, making it the gold standard for eyebrow shaping and facial hair removal. Threading does not use any chemicals or heat, making it suitable for clients using retinoids or on Accutane. The thread can remove an entire row of hairs in one motion.',
      bestFor: 'Eyebrows, upper lip, chin, sideburns, forehead hairline.',
      limitations: 'Impractical for large body areas such as legs or back.',
      risks: [
        'Minor pain, especially on upper lip',
        'Slight redness immediately after (typically resolves within 30 minutes)',
        'Folliculitis if thread is not clean or practitioner has skin-to-skin contact with multiple clients',
      ],
      afterCare:
        'Apply aloe vera gel or rosewater to soothe redness. Avoid touching the area. No makeup for at least 2 hours if done on face.',
    },

    laser: {
      name: 'Laser Hair Removal',
      description:
        'A medical-grade laser emits a single wavelength of light that is absorbed by the melanin (pigment) in the hair shaft and follicle. The energy converts to heat, which damages the follicle and inhibits future growth. Requires multiple sessions (typically 6–12) because it is only effective on hairs in the active anagen (growth) phase, and not all hairs are in anagen simultaneously. Results are semi-permanent to permanent.',
      effectiveness:
        'Most effective on high contrast combinations — dark hair on light skin — because the laser targets melanin in hair relative to surrounding skin. As technology has advanced, lasers safe for darker skin have been developed, but they require significant expertise to use correctly.',
      laserTypes: {
        alexandrite: {
          wavelength: '755nm',
          safeFor: 'Skin phototypes I–III (very light to medium)',
          notSafeFor:
            'Skin phototypes IV–VI (olive to deep brown to dark). The alexandrite wavelength is strongly absorbed by the melanin in darker skin itself, risking burns, blistering, and permanent hypopigmentation or hyperpigmentation.',
          note: 'Should never be used on dark skin tones. Unfortunately still widely used in budget clinics without adequate skin-type screening.',
        },
        ndYAG: {
          wavelength: '1064nm',
          safeFor: 'Skin phototypes I–VI, including the deepest skin tones',
          why: 'The 1064nm wavelength has lower melanin absorption in the epidermis (the outer skin layer), meaning less of the laser energy is absorbed by the skin before reaching the follicle. This dramatically reduces the risk of surface burns in darker skin. The Nd:YAG is the safest laser choice for all skin phototypes IV through VI.',
          note: 'The gold standard for darker skin tones. Clients of West African, East African, South Asian, Caribbean, Latina, and Arab heritage with deeper skin tones should specifically request the Nd:YAG and verify the clinic\'s equipment before booking.',
        },
        diode: {
          wavelength: '800–810nm',
          safeFor: 'Skin phototypes I–IV, some formulations up to V',
          note: 'A middle-ground option. Works well on medium skin tones. Less risky than alexandrite for darker skin but not as safe as Nd:YAG for phototypes V–VI.',
        },
      },
      preProtocol: [
        'Avoid sun exposure and self-tanner for 4–6 weeks before treatment',
        'Shave the area 24 hours before (hair must be present in follicle, not above skin)',
        'Do not wax or sugar 4–6 weeks before (root must be intact)',
        'Avoid retinoids for 5–7 days before',
        'Disclose all medications — some increase photosensitivity',
      ],
      postProtocol: [
        'Apply cool aloe vera gel or a post-laser soothing balm',
        'Avoid sun exposure for at least 2 weeks and use SPF 50+ on treated areas',
        'Do not use retinoids, AHAs, or BHAs for 5–7 days after',
        'Expect hair to shed over 7–21 days after each session (this is normal, not regrowth)',
        'Avoid picking or exfoliating shedding hairs',
      ],
    },

    IPL: {
      name: 'IPL (Intense Pulsed Light)',
      description:
        'Broad-spectrum light (typically 500–1200nm) rather than a single laser wavelength. Less targeted than laser, and generally less effective per session, but widely available in at-home devices. More suited to lighter skin tones. At-home IPL devices are typically not recommended for skin phototypes V or VI due to risk of burns and hyperpigmentation.',
      bestFor: 'Skin phototypes I–IV in a salon or clinic context. Phototypes I–III for at-home devices.',
      limitation:
        'Not as effective on fine, light-colored, red, grey, or white hair because there is insufficient melanin to absorb the light energy.',
    },

    electrolysis: {
      name: 'Electrolysis',
      description:
        'The only FDA-cleared permanent hair removal method. A fine probe is inserted into the individual hair follicle and an electric current (galvanic, thermolytic/RF, or blend) destroys the follicle\'s growth cells. Because each hair is treated individually, it is time-intensive and best suited to small areas. However, it is effective on all hair colors (including white, red, and grey that laser cannot treat) and all skin tones, making it the most universally accessible permanent option.',
      bestFor: 'Eyebrows, upper lip, chin, sparse areas of the face, transgender and non-binary clients transitioning hormonally.',
      
      risks: [
        'Temporary redness and swelling',
        'Scabbing if intensity is too high',
        'Scarring in inexperienced hands',
        'PIH in darker skin tones, though significantly lower risk than improper laser use',
      ],
    },

    depilatoryCreams: {
      name: 'Depilatory Creams',
      description:
        'Chemical creams containing thioglycolate compounds (typically calcium thioglycolate) that break the disulfide bonds in hair keratin, dissolving the hair at or just below the skin surface. Results last slightly longer than shaving (no sharp cut edge) but hair returns within days to a week. The dissolved hair has a rounded tip rather than the blunt edge left by a blade, reducing ingrown hair risk compared to shaving.',
      risks: [
        'Chemical burns if left on too long — always patch test and follow timing instructions',
        'Irritation and allergic reaction — patch test on a small area 24 hours before full use',
        'Strong odor from sulfur compounds',
        'Not suitable for the face unless the product is specifically formulated for facial use',
      ],
      note: 'For darker skin tones prone to PIH, irritation from depilatories can trigger post-inflammatory hyperpigmentation. Patch testing is essential.',
    },

    epilating: {
      name: 'Epilating',
      description:
        'An electric epilator device uses rotating tweezers to grasp and pull hairs from the root in rapid succession. Similar result to waxing — hair removed from the root, lasting 3–6 weeks — but without hot wax. The technique has a learning curve and is more painful initially, particularly on areas like inner thigh, bikini, and underarm. Pain diminishes significantly with repeated use as hair regrows finer.',
      bestFor: 'Legs, arms. Can be used on face and bikini with facial/sensitive attachments.',
      risks: [
        'Ingrown hairs — regular exfoliation 2–3 times per week is essential',
        'PIH in darker skin tones',
        'Folliculitis if device is not cleaned between uses',
        'Bruising or burst capillaries if pressure is too heavy — let the device glide without pressing',
      ],
    },
  },

  ingrownHairScience: {
    definition:
      'An ingrown hair occurs when a hair that has been removed (or naturally shed) re-enters the skin instead of growing upward and outward. The hair curls back and pierces the follicle wall or the surrounding skin, causing a localized inflammatory response.',
    pfb: {
      fullName: 'Pseudofolliculitis Barbae',
      description:
        'A chronic inflammatory condition caused by ingrown hairs, most commonly on the beard area (hence "barbae") but occurring on any shaved or waxed area. The skin produces an inflammatory response to the trapped hair, which appears as red or dark papules (bumps), sometimes with pustules. In darker skin tones, the inflammation frequently triggers post-inflammatory hyperpigmentation, leaving dark spots long after the active ingrown resolves.',
      
      management: [
        'Switching to a single-blade razor or safety razor to avoid cutting below skin level',
        'Shaving with the grain of hair growth only',
        'Applying a chemical exfoliant (glycolic acid, salicylic acid) 2–3 times per week to dissolve the intercellular bonds trapping the hair',
        'Using a topical benzoyl peroxide product to manage bacterial component',
        'In severe cases: topical eflornithine cream (prescription) to slow regrowth',
        'Consider switching to sugaring or waxing as an alternative to shaving',
        'If bumps keep coming back: pause shaving the area and let it grow out, since not shaving is the most effective treatment for razor bumps',
      ],
    },
    prevention: [
      'Exfoliate 2–3 times per week with a gentle physical or chemical exfoliant',
      'Keep skin hydrated — dry skin creates a surface that hair cannot easily penetrate',
      'Never shave against the grain on coarse or curly hair',
      'Do not pull the skin taut while shaving; it lets the hair retract below the surface',
      'Use single-blade razors for curly/coily hair',
      'Apply salicylic acid or glycolic acid 48 hours after removal to keep follicles clear',
    ],
  },

  safeIngredients: {
    aloeVera: {
      name: 'Aloe Vera',
      uses: 'Immediate post-removal soothing. Contains polysaccharides that reduce redness and inflammation. Provides a cooling sensation. Safe for all skin types and phototypes.',
      application: 'Apply pure aloe vera gel (99%+ aloe with no alcohol) directly to freshly treated skin.',
    },
    witchHazel: {
      name: 'Witch Hazel',
      uses: 'Mild astringent that closes the pores after hair removal, reducing bacteria entry. Contains tannins that soothe inflammation. Choose alcohol-free formulations for sensitive skin.',
      application: 'Pat on with a cotton pad immediately after removal.',
    },
    glycolicAcid: {
      name: 'Glycolic Acid (AHA)',
      uses: 'Alpha hydroxy acid that dissolves the dead skin cells trapping ingrown hairs. Accelerates cell turnover. Most effective for treating and preventing ingrown hairs.',
      
      timing: 'Do not use immediately after removal — wait 48–72 hours. Then use 2–3 times per week.',
      caution: 'Increases sun sensitivity. Always follow with SPF during the day.',
    },
    salicylicAcid: {
      name: 'Salicylic Acid (BHA)',
      uses: 'Beta hydroxy acid that is oil-soluble, allowing it to penetrate into the follicle pore. Exfoliates inside the follicle, clearing debris that traps hairs. Also anti-bacterial and anti-inflammatory.',
      concentrations: '0.5–2% for body use.',
      timing: 'Use 48 hours after removal, then 2–3 times per week.',
      advantage: 'Better suited than glycolic acid for oily, follicle-prone areas such as bikini and underarm.',
    },
    azelaicAcid: {
      name: 'Azelaic Acid',
      uses: 'Addresses both the ingrown hair inflammation and post-inflammatory hyperpigmentation simultaneously. Anti-bacterial, anti-inflammatory, and a mild melanin inhibitor. Excellent for darker skin tones prone to PIH after hair removal.',
      concentrations: '10–20%. 20% is prescription-strength in some countries.',
      timing: 'Can be used from 48 hours post-removal. Safe for long-term use.',
    },
    centellaAsiatica: {
      name: 'Centella Asiatica (Cica / Gotu Kola)',
      uses: 'Powerful wound-healing and anti-inflammatory ingredient. Accelerates skin barrier recovery after waxing or laser. Reduces redness. Very popular in Korean skincare for post-procedure care.',
      application: 'Apply as part of a soothing cream or serum in the immediate post-removal period.',
    },
    niacinamide: {
      name: 'Niacinamide (Vitamin B3)',
      uses: 'Brightening agent that inhibits the transfer of melanin to skin cells. Helps fade post-inflammatory hyperpigmentation left by PFB, ingrown hairs, or irritation from hair removal. Also strengthens the skin barrier.',
      concentrations: '5–10% in leave-on formulations.',
      timing: 'Safe to use from 48 hours post-removal. Long-term use fades existing dark spots.',
    },
  },

  darkerSkinLaserGuidance: {
    phototypeSummary:
      'The Fitzpatrick Scale classifies skin from Type I (always burns, never tans) through Type VI (never burns, deeply pigmented). These skin types carry more melanin in the epidermis (outer skin), creating a risk when using laser wavelengths that are strongly absorbed by melanin.',
    ndYAGRecommendation:
      'The Nd:YAG 1064nm laser is the established safe choice for phototypes IV–VI. At this longer wavelength, the epidermis absorbs significantly less energy, allowing the pulse to pass through to the follicle without burning the surface. Clinics offering laser hair removal to dark-skinned clients must have the Nd:YAG; alexandrite (755nm) and many diode configurations are inappropriate and dangerous for these skin types.',
    coolingImportance:
      'Integrated cooling systems (contact cooling, cryogen spray, or forced cold air) in the laser handpiece are essential for darker skin. Cooling the epidermis immediately before and after each laser pulse further reduces surface thermal injury, making the procedure safer.',
    testPatchRequired:
      'Reputable clinics always perform a test patch on darker skin — a small area treated and then monitored for 4–6 weeks for adverse pigment changes before proceeding with a full treatment plan.',
    redFlags: [
      'Clinic cannot name the laser type they use',
      'No patch test offered before committing to a full treatment plan',
      'No skin type consultation or Fitzpatrick assessment performed',
      'Price that seems too low — often indicates older equipment or undertrained staff',
      'Staff cannot explain why the Nd:YAG is the appropriate choice for skin types V–VI',
    ],
  },

  preRemovalProtocol: {
    general: [
      'Cleanse the area with a gentle, pH-balanced cleanser 30 minutes before removal',
      'Ensure skin is completely dry before waxing or sugaring (moisture prevents adhesion)',
      'Lightly dust with cornstarch or baby powder for sugaring',
      'Do not apply moisturizer, oil, or deodorant before waxing or sugaring',
      'Exfoliate gently 24–48 hours before waxing — not immediately before, which sensitizes skin',
      'Communicate all skincare product use (especially retinoids and AHAs) to the waxing professional',
      'Avoid sun exposure for 24 hours before waxing or laser',
      'Hair should be at least 1/4 inch (6mm) long for waxing or sugaring to grip effectively',
    ],
  },

  postRemovalProtocol: {
    first24Hours: [
      'Apply a soothing gel or cream (aloe vera, centella asiatica, chamomile)',
      'Avoid heat: no hot showers, saunas, or steam rooms',
      'Avoid sun exposure on treated areas',
      'Avoid pools, lakes, or the ocean (chlorine and bacteria enter open follicles)',
      'No tight clothing over treated areas',
      'No exercise (heat and sweat can cause folliculitis)',
      'No deodorant on freshly waxed underarms for 24 hours',
      'No self-tanner or makeup on treated areas',
    ],
    days2Through7: [
      'Begin gentle exfoliation with a soft washcloth or gentle scrub on day 2–3',
      'Apply salicylic acid or glycolic acid product to prevent ingrown hairs',
      'Moisturize with a fragrance-free lotion to keep skin supple',
      'Apply SPF 30+ to any treated areas exposed to sunlight',
      'If PIH develops, begin using niacinamide or azelaic acid',
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ETHNIC COMMUNITY GUIDES
// ─────────────────────────────────────────────────────────────────────────────

export const ETHNIC_BODY_HAIR_GUIDES = {

  // ───────────────────────────────────────────────────────────────────────────
  'west-african': {
    id: 'west-african',
    communityName: 'West African',
    countries: ['Nigeria', 'Ghana', 'Senegal', 'Ivory Coast', 'Mali', 'Sierra Leone', 'Cameroon', 'Togo', 'Benin', 'Liberia'],

    

    threadingTraditions: {
      overview:
        'Threading is used primarily for facial hair — eyebrows, upper lip, chin, and sideburns — across West Africa. In urban Nigerian and Ghanaian salons, threading for eyebrow shaping has grown enormously as a service alongside the diaspora influence from South Asian threading practitioners.',
      eyebrows:
        'Eyebrow threading is performed by pulling a doubled, twisted cotton thread across the brow area, removing entire rows of fine hairs with precision that waxing or tweezing cannot match. The result is a clean, defined brow arch. Nigerian women often favor bold, structured brow shapes that frame the face.',
      upperLip:
        'Upper lip threading is common across West Africa, particularly for women with darker, more visible lip hair. It is preferred over bleaching creams because it removes the hair rather than lightening it, producing a cleaner result on deep skin tones.',
      practitioners:
        'Threading in Nigeria and Ghana is often performed in neighborhood salons, sometimes by South Asian-trained practitioners or locally trained professionals who learned the technique from them. Cost is very accessible.',
    },

    shavingNorms: {
      overview:
        'Shaving is widely practiced for legs, underarms, and the bikini area. Disposable razors are the most accessible method across most of West Africa. In Nigerian cities, cartridge razors and safety razors are increasingly available.',
      challenges:
        'For West African women with afro-textured hair, shaving the bikini area and underarms carries a high risk of pseudofolliculitis barbae (PFB) — the ingrown hair condition that results from tightly coiled hair curling back into the skin after the blunt cut of a razor. This is particularly problematic in the underarm area, where the skin folds and hairs grow in multiple directions.',
      recommendations: [
        'Use a single-blade safety razor rather than multi-blade cartridge razors for the bikini and underarm areas',
        'Always shave with the grain — in the direction of hair growth',
        'Apply warm water for 5 minutes before shaving to soften both hair and skin',
        'Never shave dry — always use a shave cream or gel',
        'Follow with a salicylic acid toner 24–48 hours later to prevent ingrown hairs',
      ],
    },

    pfbAndHyperpigmentation: {
      overview:
        'Post-inflammatory hyperpigmentation (PIH) is the single most significant body hair removal concern for West African women. When the skin is irritated — by razor burn, PFB bumps, waxing-related redness, or folliculitis — the melanocytes (pigment-producing cells) in darker skin respond by producing excess melanin, leaving dark spots or patches that can persist for months or years. The bikini area and underarms are particularly susceptible.',
      mechanism:
        'Skin types V and VI have highly active melanocytes relative to lighter skin types. Any cutaneous injury or inflammation — even minor inflammation invisible to the eye — can trigger melanin overproduction. The concentration of melanocytes in the groin and axillary (underarm) regions means that even a small amount of irritation from hair removal can produce visible, long-lasting dark marks.',
      managementProtocol: {
        immediate: [
          'Apply a barrier soothing cream immediately after hair removal (shea butter is a traditional and highly effective choice)',
          'Do not pick at or scratch the area',
          'Avoid tight clothing over the area for 24 hours',
        ],
        ongoing: [
          'Niacinamide 5–10% applied daily fades existing PIH by inhibiting melanin transfer to skin cells',
          'Azelaic acid (10–20%) addresses both PIH and any bacterial component of PFB simultaneously',
          'Alpha-Arbutin 2% is a melanin-synthesis inhibitor well tolerated on darker skin',
          'Vitamin C (L-ascorbic acid 10–20%) is a brightening antioxidant; use only stabilized, non-irritating formulations',
          'SPF 30–50+ daily on any areas with PIH — UV exposure dramatically darkens post-inflammatory marks',
        ],
        toAvoid: [
          'Hydroquinone without dermatologist supervision — long-term unmonitored use risks ochronosis (paradoxical darkening) in very dark skin types',
          'Harsh physical scrubs over active bumps — these worsen inflammation',
          'Fragranced products on sensitive, recently treated areas',
        ],
      },
    },

    sheaButterRole: {
      overview:
        'Shea butter is arguably the most important skincare ingredient in West African body care and is deeply embedded in post-hair-removal practice. Produced from the nut of the shea tree (Vitellaria paradoxa) native to West Africa, shea butter is both a local product and an ingredient whose traditional use predates the modern cosmetics industry by centuries.',
      composition:
        'Raw shea butter contains oleic acid (40–60%), stearic acid (20–50%), linoleic acid (3–11%), palmitic acid (2–9%), and triterpene alcohols including lupeol and butyrospermum parkii sterols, which have anti-inflammatory properties. It also contains vitamins A, E, and F, and cinnamic acid derivatives with UV-filtering properties.',
      postHairRemovalUse:
        'Applying raw (unrefined) shea butter to freshly waxed, shaved, or threaded skin serves multiple purposes: it seals the disrupted skin barrier, reduces transepidermal water loss, soothes inflammation, and — over time — contributes to the softening of dry skin that can trap hairs and cause ingrowns. Many West African women apply shea butter to underarms and legs every evening as a standard practice.',
      sheaQuality:
        'Unrefined (raw) shea butter is yellow or ivory and has a slightly nutty scent. It retains all active compounds. Refined shea butter is white and odorless but has lost some beneficial constituents in the processing. For post-hair-removal use, unrefined is preferred.',
      nigerianSpecific:
        'In Nigeria, "ori" — the Yoruba word for shea butter — is used by women of all ages as a skin moisturizer, scalp treatment, and post-wax soother. It is commonly sold in local markets in pure, unrefined form.',
    },

    preferredMethods: {
      waxing: 'Popular in urban Nigeria and Ghana. Brazilian waxing services are widely available in Lagos, Abuja, and Accra. Threading for face.',
      sugaring: 'Less established than in Arab or South Asian communities but growing in popularity.',
      laser: 'The Nd:YAG 1064nm laser is the only appropriate technology. Growing demand in Lagos and Accra but requires careful provider selection. PIH risk after inadequate laser treatment is significant.',
      depilatory: 'Widely used, especially Veet and Nair, which are accessible across West Africa. Patch testing is essential.',
    },

    productRecommendations: [
      'Unrefined West African shea butter for post-removal barrier care',
      'Aloe vera gel (pure, alcohol-free) for immediate soothing',
      'Salicylic acid 1–2% toner for ingrown prevention',
      'Niacinamide 10% serum for PIH fading',
      'SPF 50+ daily on dark spots to prevent UV worsening',
    ],

    culturalNotes:
      'In many West African communities, body hair removal is an expected beauty practice for women, normalized from adolescence. Mothers often introduce daughters to hair removal practices in their teenage years. Underarm and leg hair on women is generally considered ungroomed in urban contexts. However, attitudes are generationally and geographically variable — rural and more traditional communities may have less emphasis on this. The West African diaspora in the UK, US, and Canada often maintains these practices while adopting additional products available in those markets.',
  },

  // ───────────────────────────────────────────────────────────────────────────
  'south-asian': {
    id: 'south-asian',
    communityName: 'South Asian',
    countries: ['India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Bhutan', 'Maldives', 'South Asian diaspora globally'],

    culturalContext:
      'South Asia has arguably the richest and most deeply documented body hair removal traditions of any region in the world. Threading, turmeric paste, sugaring (alam), and waxing have been practiced on the subcontinent for thousands of years and are embedded in Ayurvedic wellness philosophy. South Asian women have historically faced high social pressure to remove body and facial hair — particularly upper lip, chin, arms, and legs — from adolescence. The threading of eyebrows and upper lip is not merely a beauty treatment but a cultural ritual that marks passages such as engagement and wedding preparation.',

    threading: {
      overview:
        'Threading (known in Hindi as "dhagha" or "sutra") originated in ancient India and the broader South/Central Asian region and has been practiced continuously for over a thousand years. It is the cornerstone facial hair removal method for South Asian women worldwide and has been exported globally through the South Asian diaspora, now practiced in threading kiosks in shopping malls across North America, Europe, and Australia.',
      technique:
        'A skilled practitioner holds one end of a doubled cotton thread in their teeth or tied to their hand, and maneuvers the twisted section across the face to catch hairs and pull them from the follicle. The precision of threading allows individual hairs to be removed, making it superior to waxing for eyebrow shaping. An experienced threader can remove hair from an entire brow in under two minutes.',
      occasions:
        'For South Asian women, threading appointments before weddings, festivals (Diwali, Eid, Navratri), and family gatherings are practically obligatory. The bridal threading session — often a full-face removal of all visible facial hair — is part of the pre-wedding ritual preparation.',
      bodyAreas: 'Primarily face: eyebrows, upper lip, chin, sideburns, and forehead hairline. Less commonly used for arms, though not unheard of.',
      culturalSignificance:
        'Learning to thread is passed down through female family lines in many South Asian communities. Grandmothers thread daughters and granddaughters at home, often using simple cotton sewing thread. The transfer of this skill is both practical and deeply relational.',
    },

    turmericPasteHairRemoval: {
      
      traditionalRecipes: [
        {
          name: 'Haldi Ubtan (Basic Turmeric Hair Inhibitor)',
          ingredients: ['2 tbsp turmeric powder', '4 tbsp gram flour (besan)', 'Milk or rose water to bind'],
          method:
            'Mix to a thick paste. Apply to the face or body area in the direction of hair growth. Allow to dry for 20–30 minutes. Rub off in circular motions against the direction of hair growth — this mechanical rubbing action physically removes fine hair. Apply moisturizer after.',
          frequency:
            'Used 3–4 times per week on fine facial hair, traditionally starting in adolescence, with the belief that consistent long-term use reduces hair density. Many South Asian women report measurable reduction in fine facial hair with years of use.',
        },
        {
          name: 'Haldi and Raw Milk Paste',
          ingredients: ['1 tsp turmeric', '2 tbsp raw milk', '1 tbsp gram flour'],
          method: 'Combine to a smooth paste. Apply to upper lip and chin. Leave 15–20 minutes. Rub off against hair growth direction.',
          note: 'The lactic acid in raw milk provides mild exfoliation, enhancing the mechanical hair removal.',
        },
      ],
      weddingTradition:
        'The haldi ceremony is a pre-wedding ritual in many Hindu, Sikh, and Muslim South Asian communities in which turmeric paste is applied to the bride (and groom) by family members. It functions simultaneously as a skin-brightening treatment, a hair inhibitor for fine body hair, and a cultural blessing ceremony. The bride\'s skin on her wedding day is expected to glow in part due to the cumulative effects of haldi treatments.',
      cautions: [
        'Turmeric stains skin, nails, and fabric yellow-orange; wear old clothing',
        'Staining fades within 1–2 days',
        'Test on inner wrist before using on face, especially for sensitive skin',
      ],
    },

    sugaring: {
      name: 'Alam / Sugar Waxing',
      overview:
        'Sugaring is called "alam" or "halawa" in various South Asian and Middle Eastern communities. It is practiced across India, Pakistan, and Sri Lanka as an alternative to hard waxing. The sugar paste — made from the same basic formulation of sugar, lemon, and water — is used at body temperature, making it gentler than hot wax on darker skin tones.',
      southAsianContext:
        'In India, sugaring is used across the country but may be less systematically branded than in the Arab world, where halawa is a formalized beauty-parlor service. Indian beauty parlors offer both thread and wax services, with sugar wax sometimes used as an alternative for sensitive skin types.',
    },

    waxingWithAloe: {
      overview:
        'Hot waxing is widespread in South Asian beauty culture, available in parlors and salons across India, Pakistan, Bangladesh, and Sri Lanka. Threading parlors almost universally offer waxing as a companion service for legs, arms, and underarms.',
      aloeVera:
        'Post-wax application of fresh aloe vera gel — often directly from the plant — is a traditional and medically sound practice. Aloe reduces the post-wax redness and inflammation, and its hydrating properties help prevent the dry skin that can trap ingrown hairs. In South India and Sri Lanka, fresh aloe plants are a common household item used in skincare.',
      turmericPostWax:
        'After waxing, applying a diluted turmeric paste (mixing a pinch of turmeric into aloe vera gel) is a traditional South Asian post-care step. Turmeric\'s anti-inflammatory and antibacterial properties soothe the post-wax skin and help prevent folliculitis. The minimal concentration (a pinch in a tablespoon of aloe) does not significantly stain the skin.',
    },

    ayurvedicPerspective: {
      overview:
        'Ayurveda, the traditional Indian system of medicine, views body hair through a lens of prakriti (individual constitution) and dosha balance. Excess body hair (particularly facial hair in women) is sometimes attributed to an imbalance in pitta or vata doshas, and hair removal is framed not merely as cosmetic but as part of dinacharya (daily self-care routine).',
      herbsAndOils: [
        'Sesame oil (til tel): Used as a pre-wax skin conditioner and post-removal massage oil in Ayurvedic beauty practice. Rich in linoleic acid and sesamol.',
        'Neem: Antibacterial herb used in post-hair-removal washes to prevent folliculitis. Neem water rinse after shaving or waxing is a traditional remedy.',
        'Turmeric (haldi): Central to Ayurvedic skin preparation and post-removal care as documented above.',
        'Sandalwood paste: Used on face post-threading to soothe redness. Has mild anti-inflammatory properties.',
        'Rose water: Gentle toner applied after threading or waxing. Contains phenylethanol and flavonoids with mild astringent and anti-inflammatory effects.',
      ],
    },

    piHyperpigmentationNotes:
      'Skin types III–V are prone to post-inflammatory hyperpigmentation, though less severely than phototypes V–VI in many cases. The underarm and bikini areas in particular can develop dark spots from repeated waxing-related inflammation. Use of niacinamide, azelaic acid, and consistent SPF application is important for managing PIH in these areas.',

    laserConsiderations:
      'Anyone with skin type IV–V seeking laser hair removal should request the Nd:YAG 1064nm or a diode laser with appropriate settings. Patch testing is essential. The growing laser hair removal market in India has led to mixed quality of providers; clients should insist on skin-type consultation before treatment.',

    productRecommendations: [
      'Fresh aloe vera gel for immediate post-wax soothing',
      'Turmeric-aloe blend for post-wax anti-inflammatory care',
      'Neem-based cleanser for post-removal folliculitis prevention',
      'Niacinamide 10% for underarm and bikini PIH',
      'SPF 50+ daily on all sun-exposed treated areas',
      'Pure sesame oil for Ayurvedic post-removal massage',
    ],

    culturalNotes:
      'The social pressure on South Asian women — particularly in diaspora communities in North America and the UK — to remove visible body hair can be intense and begins in early adolescence. The threading salon has become a community gathering space in South Asian diaspora neighborhoods. First-generation parents often introduce daughters to threading and waxing as a rite of passage. Second-generation South Asians increasingly navigate the intersection of these cultural expectations with body-positive and feminist conversations about hair removal choice.',
  },

  // ───────────────────────────────────────────────────────────────────────────
  caribbean: {
    id: 'caribbean',
    communityName: 'Caribbean',
    countries: ['Jamaica', 'Trinidad and Tobago', 'Barbados', 'Haiti', 'Dominican Republic', 'Cuba', 'Puerto Rico', 'Guyana', 'Grenada', 'St. Lucia', 'Bahamas'],

    culturalContext:
      'Caribbean beauty culture is vibrant, diverse, and deeply linked to the region\'s beach, carnival, and outdoor lifestyle. The Caribbean beach and swim culture creates practical high demand for body hair removal — particularly bikini, leg, and underarm areas — year-round. Carnival season (occurring in different islands from January through March, with Trinidad Carnival the most prominent) drives peak demand for smooth, flawless body skin. The "soca body" aesthetic — glowing, smooth, toned skin ready for revealing carnival costumes — is a significant cultural driver of body hair removal practices.',

    waxingTraditions: {
      brazilianWaxing:
        'Brazilian waxing — full bikini hair removal — is widely practiced and normalized across the Caribbean, driven by the bikini-centric beach and carnival culture. The style was popularized in the region in part through Brazilian and American beauty industry influence and has become a standard pre-carnival service.',
      legs:
        'Full leg waxing is common and preferred by many Caribbean women for the longer-lasting smoothness compared to shaving — important in a climate where shorts, skirts, and swimwear are daily wear.',
      underarms:
        'Underarm waxing is widely performed in salons. The challenge for skin types V–VI is the high risk of PIH in the axillary area following waxing-related inflammation.',
    },

    sugaring: {
      overview:
        'Sugaring is practiced across the Caribbean, particularly in communities with South Asian heritage (Indo-Caribbean) where sugaring traditions arrived from the Indian subcontinent via the indentured labor period of the 19th century. In Trinidad, Guyana, and other Caribbean nations with significant Indo-Caribbean populations, sugaring practices from the Indian heritage community have blended with broader Caribbean beauty culture.',
      coconutOilIntegration:
        'Caribbean sugaring and waxing practice frequently incorporates coconut oil as a pre- or post-removal treatment. Coconut oil is applied before removal to condition the skin, and after to soothe and moisturize. The medium-chain fatty acids in coconut oil (primarily lauric acid) have mild antibacterial properties, potentially reducing the risk of post-wax folliculitis.',
    },

    coconutOilPostRemoval: {
      overview:
        'Coconut oil holds a central place in Caribbean body care that parallels shea butter in West Africa. Refined and unrefined coconut oil are both used, with unrefined (virgin) coconut oil preferred for its fuller beneficial compound profile. It is applied to skin post-hair-removal as a moisturizer, barrier cream, and soothing agent.',
      
      applicationMethod:
        'Warm a small amount of virgin coconut oil between the palms and press gently onto freshly waxed or shaved skin. Allow it to absorb. The warmth of Caribbean climates means coconut oil remains liquid; in cooler diaspora climates it may need to be warmed.',
      caution: 'Coconut oil is comedogenic for some individuals — meaning it may clog pores and cause breakouts in acne-prone skin. Patch test on the underarm or inner arm before applying to the bikini area.',
    },

    razorBumpConcerns: {
      overview:
        'For anyone with tightly coiled hair, the same curved-follicle geometry that drives PFB applies. The tightly coiled, highly curved hair follicle means hairs cut at the skin surface have a sharper angle of regrowth and are more likely to re-enter the skin.',
      bikiniAreaSpecific:
        'With coarse, tightly coiled hair the bikini area is the highest-risk zone for razor bumps; multi-blade razors very often cause PFB without careful technique and aftercare. Many Caribbean women switch to waxing or sugaring for the bikini area specifically because these methods remove hair from the root, producing softer tapered regrowth that is less likely to penetrate the skin.',
      managementProtocol: [
        'Switch to waxing or sugaring for bikini area if PFB is recurrent',
        'If shaving, use a single-blade razor and shave with the grain only',
        'Apply a salicylic acid product (1–2%) to the bikini area 48 hours post-removal',
        'Use a soft-bristle body brush in circular motions to gently lift ingrown hairs before they become embedded',
        'Jamaican Black Castor Oil (JBCO) is used across Caribbean and Black American communities as a soothing post-removal treatment; it has mild anti-inflammatory properties and is a popular traditional remedy',
      ],
    },

    beachAndSwimCulture: {
      impact:
        'The ubiquity of swimwear, beach outings, and outdoor pool culture in the Caribbean means that visible leg, underarm, and bikini hair is socially conspicuous year-round. This practical dimension — not merely aesthetic preference — means hair removal frequency is higher in the Caribbean than in cooler, more covered climates. Women in Barbados, Jamaica, and Trinidad typically manage body hair every 1–4 weeks depending on method.',
      carnivalSpecific:
        'In the weeks leading up to carnival, demand for waxing and skin-smoothing treatments spikes dramatically. Full-body exfoliation, waxing, and skin brightening treatments are carnival preparation staples. For masquerades wearing revealing beaded bikini costumes, any skin roughness or dark spots in the underarm, bikini, or leg areas is a significant concern.',
    },

    productRecommendations: [
      'Virgin coconut oil for post-removal moisturizing and barrier care',
      'Jamaican Black Castor Oil for soothing post-bikini wax',
      'Aloe vera gel for immediate wax soothing',
      'Salicylic acid 2% for bikini and underarm ingrown prevention',
      'Niacinamide 10% for underarm PIH from repeated waxing',
      'SPF 50+ daily on all treated areas exposed to the Caribbean sun',
    ],

    culturalNotes:
      'The Caribbean diaspora in North America, the UK, and the Netherlands maintains these beauty practices in their new home communities, supporting a network of Caribbean-owned beauty salons. Trinidad and Jamaican Carnival abroad (Caribana in Toronto, Notting Hill Carnival in London, Brooklyn Caribbean Festival) maintain the peak demand cycle for waxing and skin care in diaspora communities.',
  },

  // ───────────────────────────────────────────────────────────────────────────
  arab: {
    id: 'arab',
    communityName: 'Arab',
    countries: ['Saudi Arabia', 'Egypt', 'Lebanon', 'Jordan', 'Morocco', 'Tunisia', 'Algeria', 'UAE', 'Kuwait', 'Syria', 'Iraq', 'Palestine', 'Yemen', 'Libya', 'Sudan'],

    culturalContext:
      'Arab women have practiced elaborate and sophisticated body hair removal for at least 4,000 years. The Islamic jurisprudential tradition (fiqh) includes explicit guidance on body hair removal as part of fitra — the concept of natural human disposition and cleanliness. This religious foundation means hair removal is not merely cultural preference but has a component of religious obligation for observant Muslim women. The practice of full-body hair removal before important life events — weddings, religious holidays like Eid — is deeply embedded across the Arab world.',

    halawaAndSugaring: {
      overview:
        'Halawa (Arabic: حلاوة, meaning "sweetness") is the Arabic word for sugaring paste and the hair removal method using it. It is arguably the most culturally significant and technically developed form of sugaring in the world, with Arabic references to the practice dating back to ancient Egypt and Mesopotamia. Cleopatra is historically associated with the use of a sugar-based wax, and the method has been continuously practiced and refined across North Africa and the Levant ever since.',
      historicalSignificance:
        'Halawa\'s documented use spans over 4,000 years. It is referenced in Islamic hadith literature and in medieval Arab medical and cosmetic texts. The technique was a formal part of hammam (bathhouse) services across the Ottoman Empire and continues as such today. It is both a practical hair removal method and a living cultural tradition.',
      ingredients: {
        components: ['White sugar (refined)', 'Lemon juice (fresh-squeezed)', 'Water'],
        proportions: '2 cups sugar : 1/4 cup lemon juice : 1/4 cup water (standard recipe). The lemon juice serves dual purposes: the citric acid prevents sugar crystallization and contributes mild exfoliation.',
      },
      cookingMethod: {
        steps: [
          'Combine sugar, lemon juice, and water in a heavy copper or stainless-steel pot — Arab tradition favors copper cookware for halawa preparation',
          'Heat on medium, stirring until sugar fully dissolves',
          'Bring to a boil and stop stirring — stirring after this point causes crystallization',
          'Cook until the mixture reaches 118–121°C (soft ball stage on a candy thermometer) and turns a rich amber color',
          'Test readiness: drop a small amount in cold water. The paste should form a soft, pliable ball.',
          'Remove from heat, pour into a clean jar, and cool to body temperature before use',
          'The paste should be the consistency of thick honey and stretch without breaking when pulled',
        ],
        troubleshooting:
          'If paste is too hard: briefly warm it in a bowl of hot water or in the microwave in 10-second bursts. If too soft: it was undercooked; return to heat. Optimal consistency is soft and stretchy at body temperature.',
      },
      applicationTechnique: {
        preparation: 'Dust the area with cornstarch or baby powder to absorb any moisture and create a barrier between paste and skin.',
        application:
          'Work a ball of paste (walnut to golf-ball sized depending on area) against the direction of hair growth, flattening it in a thin, even layer with fingers using a back-and-forth pressing motion.',
        removal:
          'Quickly flick the paste off in the direction of hair growth — with the grain. This is the key difference from traditional waxing: halawa is applied against the grain and removed with the grain, greatly reducing hair breakage and ingrown hair formation.',
        reuse: 'The same ball of paste can be reused on the same area repeatedly until it becomes saturated with hair and loses its grip.',
        cleanup: 'Any paste remaining on skin dissolves in water — simply rinse off. Unlike wax, no oil-based remover is needed.',
      },
      professionalHalawaService:
        'Professional halawa in Arab beauty salons is a full-body service covering legs, arms, underarms, and the bikini area. In Lebanese and Egyptian beauty culture, professional halawa artists are a distinct and highly skilled specialty. The complete service includes hammam preparation (steam), full halawa application, and post-removal skin treatment. This service is offered in dedicated beauty salons (salons de beauté) across the Arab world and increasingly in Arab diaspora communities in Europe, North America, and Australia.',
      halawaBefore: [
        'Do not apply lotion or oil to the area on the day of',
        'Ensure hair is at minimum 6mm (1/4 inch) long',
        'Exfoliate gently the day before',
        'Apply a thin layer of powder immediately before application',
      ],
      halawaAfter: [
        'Rinse the area with cool water',
        'Apply rose water or orange blossom water — traditional Arab post-halawa care',
        'Follow with an oil: argan oil in Moroccan and Levantine tradition; olive oil across the Mediterranean Arab world',
        'Avoid heat and sun exposure for 24 hours',
        'Begin gentle exfoliation after 48 hours to prevent ingrown hairs',
      ],
    },

    hammam: {
      overview:
        'The hammam (Arabic: حمام) — the traditional Arab and Ottoman bathhouse — is the ritual context in which professional hair removal has been performed for centuries. The hammam experience combines steam bathing, exfoliation (with a kessa mitt), and hair removal (halawa) in a sequence designed to prepare the skin for optimal hair removal and leave it exceptionally smooth.',
      process: [
        'Clients enter the hot room (harara) to open pores and soften skin and hair with steam',
        'Exfoliation with a kessa glove (a rough woven mitt) removes dead skin and loosens hairs',
        'Halawa is applied and removed with the grain',
        'Post-removal rinsing with cool water to close pores',
        'Application of argan oil, olive oil, or other traditional botanical oils',
        'Black soap (savon beldi) — a traditional Moroccan olive oil soap — is used in many hammam settings for its exfoliating and softening properties',
      ],
      modernContext:
        'Hammams still operate throughout the Arab world and Turkey. Modern spa facilities in Dubai, Riyadh, Beirut, and Casablanca offer hammam services combining traditional techniques with contemporary skincare. In European cities with large Arab communities (Paris, Brussels, Amsterdam), Moroccan hammams are a significant segment of the beauty services market.',
    },

    threading: {
      arabContext:
        'Threading for facial hair removal — particularly eyebrow shaping — is widely practiced across the Arab world. It runs parallel to the halawa tradition as a facial-specific technique. Arab eyebrow aesthetics have historically favored defined, clean brow arches. Threading allows extremely precise shaping without the risk of wax-induced skin lifting on the delicate facial skin.',
      practitionerAccess:
        'Threading is available in most Arab beauty salons alongside halawa services. In diaspora communities, Arab women often seek out Middle Eastern or South Asian threading practitioners who have maintained traditional technique.',
    },

    arganOilPostRemoval: {
      overview:
        'Argan oil ("liquid gold" of Morocco) is the traditional post-hair-removal skin oil in Moroccan Arab beauty practice. Produced from the kernels of the argan tree (Argania spinosa) native to Morocco, it is exceptionally rich in oleic acid (43–49%), linoleic acid (29–36%), and tocopherols (vitamin E). These constituents make it an outstanding skin barrier repairer and anti-inflammatory agent.',
      use: 'Applied by hand in small amounts to the entire freshly treated body area after halawa or waxing. It absorbs relatively quickly compared to heavier oils, leaving skin soft without a greasy residue.',
    },

    religiousDimension: {
      overview:
        'In Islamic jurisprudence, fitra (natural human disposition) includes guidance on personal hygiene that encompasses body hair removal. The hadith traditions specifically recommend removal of underarm and pubic hair as components of cleanliness. This religious framing means body hair removal for observant Muslim women in Arab cultures is not purely cosmetic but has a devotional dimension.',
      practical: 'Full-body halawa before Eid al-Fitr and Eid al-Adha, and especially before weddings, is near-universal among observant Arab Muslim women.',
    },

    productRecommendations: [
      'Homemade halawa paste using sugar, lemon, and water',
      'Argan oil (100% pure, Moroccan cold-pressed) for post-removal care',
      'Rose water or orange blossom water as immediate post-halawa toner',
      'Moroccan black soap (savon beldi) for exfoliation in hammam routine',
      'Kessa exfoliation mitt for weekly dead skin removal between hair removal sessions',
      'Cornstarch or baby powder as pre-halawa skin preparation',
    ],

    culturalNotes:
      'Arab women in the Gulf (Saudi Arabia, UAE, Kuwait) practice halawa in highly private, all-female settings. The Arab beauty salon is a women-only social space where hair removal, beauty treatments, and social interaction intersect. Men in this context would receive equivalent services in men-only settings. In the Levant (Lebanon, Syria, Palestine) and North Africa (Morocco, Egypt), halawa salons are neighborhood staples with strong community character.',
  },

  // ───────────────────────────────────────────────────────────────────────────
  latina: {
    id: 'latina',
    communityName: 'Latina',
    countries: ['Mexico', 'Brazil', 'Colombia', 'Argentina', 'Peru', 'Venezuela', 'Chile', 'Ecuador', 'Guatemala', 'Cuba', 'Dominican Republic', 'El Salvador', 'Honduras', 'Bolivia', 'Paraguay', 'Uruguay'],

    culturalContext:
      'Latin American beauty culture places significant emphasis on body grooming and hair removal. The Brazilian bikini wax achieved global recognition as synonymous with complete hair removal — a practice that originated in Brazilian beach culture and was exported worldwide. Across Latin America, waxing is a standard, affordable, and widely accessible beauty service offered in salons (known as "estética" in Brazil, "salón de belleza" in Spanish-speaking countries). Body hair on women is broadly culturally expected to be managed, particularly in urban areas, though body-positive and feminist movements are growing across the region.',

    laCera: {
      name: 'La Cera (Waxing)',
      overview:
        '"La cera" (the wax) is the colloquial term for waxing across Spanish-speaking Latin America, and it represents the most culturally prevalent professional hair removal method in the region. Waxing salons (estéticas, centros de belleza) are found on virtually every urban block across Mexico, Colombia, Argentina, and beyond, and pricing is extremely accessible relative to disposable income — making professional waxing a routine rather than a luxury.',
      frequency:
        'The consistency of the schedule is part of a broader grooming culture where regular appointments (waxing, nails, hair blowout) are weekly or bi-weekly rituals rather than occasional treats.',
      
      mexicoThreading:
        'Threading is practiced in Mexico, particularly in border cities and urban areas with South Asian community influence. However, it is not as culturally central in Mexico as it is in South Asian or Arab communities.',
    },

    sugaringTraditions: {
      overview:
        'Sugaring traditions exist across Latin America, particularly in communities with Middle Eastern heritage. Lebanon has historically had one of the largest emigrant populations to South America — Argentina, Brazil, Chile, Colombia, and Mexico all have significant Lebanese and Syrian diaspora communities whose halawa/sugaring practices have integrated into local beauty culture.',
      brazil: 'In Brazil, "cera de mel" (honey wax) — a soft wax with a sugar-like composition — bridges the traditional sugar paste and hot wax traditions.',
      argentina:
        'Argentine beauty culture, influenced heavily by European (particularly Italian) and Middle Eastern immigration waves, practices both professional waxing and sugaring. Buenos Aires estéticas are particularly sophisticated, with Brazilian, European, and Middle Eastern technique traditions all represented.',
    },

    hyperpigmentationConcerns: {
      overview:
        'Post-inflammatory hyperpigmentation is a significant concern on deeper skin types (IV–V). The underarm area is particularly prone to "mancha" — dark patches — resulting from repeated waxing, shaving friction, or simply the irritation from antiperspirant products combined with hair removal.',
      armpit:
        'The combination of shaving or waxing irritation, friction from tight clothing, antiperspirant chemical reaction with sensitive skin, and constant skin-on-skin rubbing in the underarm fold creates a compounding PIH risk.',
      bikinLine:
        'The bikini area is similarly prone on deeper skin. A full Brazilian wax repeated on a short cycle irritates the area again and again, and dark marks build up without a targeted treatment plan.',
      managementProtocol: [
        'Allow the skin to rest between waxing sessions — never wax an actively irritated area',
        'Apply azelaic acid 15–20% to underarm and bikini areas nightly to address both PIH and bacterial component',
        'Use niacinamide 10% serum as a daily brightener over the longer term',
        'Tranexamic acid 2–3% is a newer topical option for stubborn dark marks and is generally well tolerated',
        'SPF 50+ on bikini area when at the beach — UV accelerates PIH darkening',
        'Consider switching from waxing to sugaring, which causes less skin trauma for the same result',
      ],
    },

    aloeVeraPostWax: {
      overview:
        'Aloe vera holds a central place in Latin American folk medicine and skincare. The aloe plant is native to the Americas and widely grown as a household plant in Mexico, Central America, and the Caribbean. Freshly cut aloe vera gel is the traditional first-line post-wax treatment across the region.',
      traditional: 'Cutting a thick aloe vera leaf from the plant, slicing it open, and applying the thick clear gel directly to freshly waxed skin is a practice passed down through generations of Latina women. The fresh gel has higher polysaccharide content than commercial formulations and provides exceptional soothing and barrier protection.',
      commercial:
        'Commercial aloe gels are also widely used; look for formulations with 99%+ aloe content and no alcohol (alcohol in post-wax aloe products causes stinging and drying rather than soothing).',
    },

    laserConsiderations: {
      overview:
        'The laser hair removal market has grown rapidly across Latin America, particularly in Brazil, Argentina, Colombia, and Mexico. Brazil is one of the largest laser hair removal markets globally.',
      brazilianMarket:
        'Brazil has developed a thriving medical aesthetics industry. "Depilação a laser" (laser hair removal) is marketed aggressively and is more accessible than in North America in cost terms. The quality of equipment and training varies widely; clients should verify laser type.',
    },

    productRecommendations: [
      'Fresh aloe vera gel (from the plant or 99%+ commercial formula) for post-wax soothing',
      'Azelaic acid 15–20% for underarm and bikini PIH management',
      'Niacinamide 10% serum for daily brightening of dark patches',
      'Tranexamic acid 2–3% for resistant hyperpigmentation',
      'SPF 50+ daily on underarms and bikini when sun-exposed',
      'Cornstarch for pre-wax skin preparation (widely available and culturally established)',
    ],

    culturalNotes:
      'The estética is a central social space in Latin American female community life — not merely a service business but a place for conversation, community, and connection. Waxing appointments are social occasions. The body hair removal norms absorbed in these spaces are generationally transmitted. Latina feminists and body-positive activists in both Latin America and the diaspora are actively interrogating these norms, but they remain dominant in mainstream beauty culture.',
  },

  // ───────────────────────────────────────────────────────────────────────────
  'east-asian': {
    id: 'east-asian',
    communityName: 'East Asian',
    countries: ['Japan', 'China', 'South Korea', 'Taiwan', 'Hong Kong', 'Mongolia'],

    culturalContext:
      'East Asian beauty culture — and East Asian attitudes toward body hair — are notably diverse and often contrasting between countries. Japanese, Korean, and Chinese norms around body hair removal differ significantly from each other and have evolved rapidly under the influence of K-beauty, J-beauty, and Chinese beauty (C-beauty) industry expansion. However, broadly across East Asia, female body hair (particularly underarm and leg hair) has become increasingly associated with Western feminist discourse in recent years, while in the mainstream, smooth skin remains the dominant aesthetic ideal.',

    japaneseDepilation: {
      
      traditionalHadanugi:
        '"Hadanugi" (膚脱ぎ) historically referred to the use of a smooth object (traditionally a coin or pumice stone) to rub hair from the body — a form of mechanical depilation. This practice was also carried out with warm wax derived from plant materials. The concept of smooth, hairless skin as aesthetically refined has deep roots in Japanese aesthetics dating to the Heian period (794–1185 CE).',
      modernIndustry:
        'Modern Japan has developed the most sophisticated commercial laser and IPL hair removal infrastructure of any country. The "datsumou salon" (hair removal salon) industry is enormous — Japan\'s laser/IPL market is the largest in Asia. Dedicated hair removal salon chains (Musee Platinum, B.G., Epi-Lady, Remi Lumine) have hundreds of locations nationwide and offer package deals for long-term hair removal.',
      ipl: 'While less powerful per session than true laser, the high volume of salons and competitive pricing has made multi-session IPL packages extremely accessible.',
      vio: 'VIO (V = bikini/front, I = inner thigh/perineum, O = perianal) is the Japanese industry terminology for full bikini/pubic hair removal, mirroring the Brazilian wax concept. Full VIO removal is widely marketed in Japanese datsumou salons and has become increasingly common, particularly among younger women.',
      publicBathing:
        'Public bathing culture (onsen hot springs, sento public baths) in Japan, which traditionally requires nudity, has historically influenced hair removal attitudes. In this context, the norms of the bathing group — which in traditional settings excludes people with visible tattoos and has unstated grooming expectations — have contributed to the normalization of full-body hair removal.',
    },

    koreanNorms: {
      overview:
        'South Korean beauty culture — the global phenomenon known as K-beauty — has among the most comprehensive and detail-oriented skincare regimes in the world. Body hair, while less extensively discussed in global K-beauty discourse than skincare, is subject to the same pursuit of perfection that characterizes the K-beauty approach.',
      laserDominance:
        'Laser hair removal is the dominant professional method in South Korea. Korean dermatology clinics and beauty clinics offer laser hair removal at highly competitive price points. The Korean healthcare and medical aesthetics system, combined with intense competition, makes laser accessible to a much broader demographic than in North America.',
      postRemovalSkincare:
        'Post-hair-removal skincare in Korea reflects the broader K-beauty approach: comprehensive, layered, and ingredient-conscious. Centella asiatica (known in Korean skincare as "cica") is the gold-standard post-laser and post-wax skin soother. Korean beauty companies have developed extensive lines of cica-containing creams, mists, and pads specifically for post-procedure use.',
      whiteningProducts:
        'Whitening (brightening) products are central to East Asian beauty culture broadly, and their use post-hair-removal reflects the desire to address any PIH or darkening that occurs. Korean and Japanese brightening products are highly formulated and technically advanced. Key ingredients used post-hair-removal: niacinamide, alpha-arbutin, tranexamic acid, kojic acid, and vitamin C.',
      underarmFocus:
        'Underarm whitening is a significant product category in Korea and Japan. Products targeting underarm darkness — from deodorants incorporating brightening actives to dedicated underarm whitening serums — are widely marketed and used, with hair removal-related PIH being one of the drivers of this concern.',
    },

    chineseThreading: {
      overview:
        'Threading has a long history in China, where it is known as "mian xian" (面线, literally "face thread") or "mian" facial threading. This tradition predates contact with South Asia and appears to be an independently developed technique, suggesting that the use of thread to remove facial hair was discovered in multiple cultures separately.',
      modernUse:
        'Threading for eyebrow shaping is practiced in China, though it competes with waxing, depilatory creams, and modern laser technology. Threading salons are found in urban centers. The Chinese diaspora has exported threading practices globally, contributing alongside South Asian practitioners to the global threading industry.',
    },

    laserGrowth: {
      
      skinTypeAdvantage:
        'Alexandrite and diode lasers are widely used and generally safe for most East Asian skin types.',
      
    },

    brightening: {
      overview:
        'Post-hair-removal brightening is integrated into standard East Asian body care routines. The "whitening" (美白, méibái in Chinese; 美白, bihaku in Japanese) category of products — aimed at achieving a brighter, more even skin tone — is enormous across the region and specifically marketed for post-removal PIH prevention and treatment.',
      keyIngredients: [
        'Alpha-Arbutin: inhibits tyrosinase enzyme, reducing melanin synthesis. Safe for all skin types.',
        'Niacinamide: inhibits melanosome transfer. Standard in East Asian brightening products.',
        'Kojic Acid: derived from rice fermentation. Used in Japanese brightening products. Mild risk of sensitization with prolonged use.',
        'Tranexamic Acid: amino acid derivative. Growing in popularity in Korean brightening products for body use.',
        'Vitamin C (various stabilized forms): antioxidant brightening. Used in facial and body formulations.',
        'Arbutin (beta-arbutin): gentler form. Widely used in Japanese skincare.',
      ],
    },

    productRecommendations: [
      'Centella asiatica (cica) cream for immediate post-laser and post-wax soothing',
      'Niacinamide 10% for underarm and body brightening',
      'Alpha-arbutin 2% for melanin inhibition post-removal',
      'Korean sunscreen SPF 50+ PA++++ for daily protection of treated areas',
      'IPL home device (for skin types I–III; consult device guide for phototype suitability)',
      'Glycolic acid body lotion for ingrown hair prevention',
    ],

    culturalNotes:
      'Attitudes toward body hair in East Asia are shifting. In Japan, a growing subset of women are rejecting the expectation of body hair removal as part of a broader gender equality discourse. "Body hair liberation" (体毛解放, kaihô undô) content circulates on social media. In South Korea, similar feminist conversations are occurring. In China, body hair norms for women are tied to complex intersections of traditional beauty standards and international influence. Nonetheless, the commercial hair removal industry across all three countries continues to grow rapidly.',
  },

  // ───────────────────────────────────────────────────────────────────────────
  'east-african': {
    id: 'east-african',
    communityName: 'East African',
    countries: ['Ethiopia', 'Somalia', 'Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Burundi', 'Eritrea', 'Djibouti', 'South Sudan'],

    culturalContext:
      'East Africa is home to extraordinary cultural diversity — from the ancient Christian kingdom of Ethiopia to the Islamic coastal Swahili culture, from the nomadic Maasai to urban Nairobi. Hair removal practices are shaped by this diversity, with Islamic tradition playing a significant role in Somali, Djiboutian, coastal Kenyan, and Tanzanian communities, and Ethiopian Orthodox Christian tradition influencing Ethiopian practices. However, across much of East Africa, female body hair removal is practiced as part of general grooming.',

    ethiopianTraditions: {
      overview:
        'Ethiopian women have practiced body hair removal for generations, using both traditional and modern methods. Ethiopian beauty culture reflects the country\'s ancient traditions as well as influences from centuries of contact with Arab and Middle Eastern cultures through trade across the Red Sea.',
      sugaring:
        'Sugaring (known in Amharic as "metkel" or variations thereof) is practiced in Ethiopian communities, particularly in urban areas. The sugar paste formulation is similar to Arabic halawa, a connection that makes sense given centuries of cultural exchange across the Red Sea and through the Arab trade routes.',
      sheaAndButters:
        'Ethiopian body care traditions emphasize the use of plant-based oils and butters. Niter kibbeh — the Ethiopian spiced clarified butter used in cooking — has also been used in traditional skin care. Shea butter, imported from West Africa, is now widely available in Ethiopian markets and used post-hair-removal.',
      frankincenseOil:
        'Frankincense (Boswellia sacra and related species) is produced in Ethiopia and Eritrea, and the oil derived from the resin has traditional medicinal and cosmetic applications. Frankincense oil has documented anti-inflammatory properties and has been used in Ethiopian traditional healing practices on skin. It is applied to skin post-hair-removal as a soothing and regenerative agent.',
    },

    somaliTraditions: {
      overview:
        'Somali beauty culture is deeply influenced by Islamic fitra traditions — the same religious impetus toward body hair removal that shapes Arab practices. Somali women practice regular body hair removal as part of their grooming and religious hygiene practice.',
      sugaringSignificance:
        'Sugaring holds particular cultural significance in Somali communities. It is one of the beauty preparations performed before weddings and other significant events. In diaspora Somali communities in the UK, the USA, Canada, and Scandinavia, Somali beauty salons offering sugaring, henna, and related services are culturally important community spaces.',
      preWeddingPrep:
        'The xalwo (Somali wedding preparation) process includes full-body sugaring or waxing, henna application, and extensive skin care. The bride\'s skin is expected to be exceptionally smooth on her wedding day.',
    },

    hennaInteractions: {
      overview:
        'Henna (Lawsonia inermis) is used extensively across East Africa — in Ethiopian, Somali, Kenyan coastal, and Tanzanian coastal communities — for decorative body art. The interaction of henna application with hair removal practice is an important practical consideration.',
      sequence:
        'Hair removal should always be performed before henna application, not after. If the skin has been freshly waxed or sugared, it should be allowed to settle (minimum 24–48 hours) before henna paste is applied, to avoid henna contact with open or sensitized follicles that could cause irritation.',
      henna: 'Natural henna paste (brown to reddish-orange) is safe on normal skin. Black henna (containing para-phenylenediamine, PPD) is dangerous and must be avoided entirely — PPD can cause severe allergic reactions, permanent scarring, and is particularly dangerous on freshly hair-removed skin.',
    },

    frankincenseOilPostRemoval: {
      composition:
        'Frankincense oil contains boswellic acid esters, alpha-pinene, limonene, and other terpenoids. Scientific research has documented the anti-inflammatory properties of boswellic acids, traditionally attributed to frankincense\'s ability to inhibit the enzyme 5-LOX (leukotriene synthesis), reducing inflammatory cascades in the skin.',
      postRemovalApplication:
        'Applied in small amounts to freshly treated skin after sugaring or waxing. Blends well with carrier oils such as jojoba (similar in composition to skin\'s own sebum) or argan oil. A blend of frankincense essential oil (2–3 drops) in one tablespoon of jojoba oil is a practical post-removal treatment that combines anti-inflammatory and barrier-repair properties.',
      caution: 'Use only cosmetic-grade or therapeutic-grade frankincense essential oil. Always dilute in a carrier oil — never apply undiluted essential oil directly to freshly waxed or sugared skin.',
    },

    piHyperpigmentationNotes: {
      overview:
        'Skin types V–VI are highly susceptible to post-inflammatory hyperpigmentation. All the same PIH management principles apply: soothing post-removal, niacinamide and azelaic acid for fading, consistent SPF application.',
      frankincenseForPIH:
        'Frankincense oil\'s anti-inflammatory properties may help limit the initial inflammatory response that triggers PIH, making it a particularly well-suited post-removal treatment for this community.',
    },

    laserConsiderations:
      'Skin types V–VI need the Nd:YAG 1064nm laser. As laser hair removal clinics expand in East African cities (Nairobi, Addis Ababa, Kampala), clients must verify laser type. The market is growing rapidly but regulatory oversight varies.',

    productRecommendations: [
      'Frankincense essential oil (diluted in jojoba oil) for post-removal soothing and anti-inflammatory care',
      'Shea butter (unrefined) as a post-removal skin barrier treatment',
      'Aloe vera gel for immediate post-removal cooling',
      'Niacinamide 10% for PIH management',
      'Azelaic acid 10–20% for PIH and folliculitis management',
      'SPF 50+ daily on treated areas',
    ],

    culturalNotes:
      'East African diaspora communities in North America (particularly Minnesota, Seattle, Toronto, and London for Somali communities; Washington DC and Minneapolis for Ethiopian communities) maintain traditional beauty practices through community salons. These spaces serve the dual function of providing beauty services and maintaining cultural connection for diaspora women navigating life between heritage and adopted homeland.',
  },

  // ───────────────────────────────────────────────────────────────────────────
  'south-african': {
    id: 'south-african',
    communityName: 'South African',
    countries: ['South Africa (including Zulu, Xhosa, Sotho, Tswana, Venda, Ndebele, Cape Malay, Afrikaner, Indian-South African, and mixed-heritage communities)'],

    culturalContext:
      'South Africa\'s enormous ethnic and cultural diversity means that body hair removal practices reflect a complex mosaic of Indigenous African tradition, Cape Malay Muslim tradition, Indian-South African tradition, Afrikaner/European practice, and English-influenced South African norms. Urban beauty culture in Johannesburg, Cape Town, and Durban is highly sophisticated and reflects global trends alongside local traditions. The post-apartheid era has seen growth in the Black South African beauty industry and increasing representation of diverse beauty practices.',

    bantukSkinConcerns: {
      overview:
        'Like other communities with similar skin phototypes, they face heightened risk of PFB and post-inflammatory hyperpigmentation from hair removal.',
      pfbInBantukSkin:
        'The tightly coiled hair follicle structure characteristic of Bantu skin types produces the same high PFB risk documented in West African and Black American communities. The bikini and underarm areas are particularly susceptible. The preference for waxing over shaving in these areas — widely observed in Black South African beauty practice — is a practical response to the PFB risk of repeated shaving.',
      management: 'The same PIH management protocols apply: niacinamide, azelaic acid, consistent SPF, single-blade razors when shaving.',
    },

    capeMalayTraditions: {
      overview:
        'The Cape Malay community of Cape Town is a Muslim community descended from enslaved people brought by the Dutch East India Company from Southeast Asia and other parts of the Indian Ocean world to the Cape of Good Hope in the 17th and 18th centuries. Cape Malay culture has maintained distinctive culinary, architectural, and beauty traditions for over three centuries.',
      waxingTradition:
        'Waxing is the standard hair removal practice in Cape Malay salons, heavily influenced by the broader Islamic fitra tradition shared with Arab communities. The Cape Malay beauty salon in neighborhoods like Bo-Kaap is a community institution.',
      sugaringInfluence:
        'Sugar-based hair removal practices exist in the Cape Malay community through the intersection of Islamic halawa tradition and local practice. The halawa influence arrived through trade contacts with Arab and Malay communities.',
    },

    marulaoilPostRemoval: {
      overview:
        'Marula oil is one of South Africa\'s most distinctive indigenous beauty ingredients. Produced from the fruit kernels of the marula tree (Sclerocarya birrea), which grows in the South African bushveld and across sub-Saharan Africa, marula oil has been used by Indigenous African women for skin care for thousands of years. It is one of Africa\'s most nutritionally rich natural oils.',
      composition:
        'Marula oil has an extraordinarily high oleic acid content (70–78%), making it deeply moisturizing and stable. It also contains significant linoleic acid (4–7%), palmitic acid, and antioxidants including tocopherols (vitamin E) and catechins. The high oleic acid content allows it to penetrate deeply into the skin, delivering moisture to the dermal layer rather than simply sitting on the surface.',
      postHairRemovalUse:
        'Applied to freshly waxed or sugared skin, marula oil rapidly soothes redness, hydrates the skin barrier, and protects against environmental irritants. It is lighter in texture than shea butter while being more moisturizing than many botanical oils. Its antioxidant content also helps protect freshly treated skin from free radical damage.',
      indigenous:
        'Zulu and other Bantu-speaking women historically applied marula oil to their bodies as a standard skin care practice. The Zulu word for marula is "umganu." Commercial marula oil is now a globally recognized South African beauty export, featured in international luxury skincare.',
    },

    indianSouthAfricanCommunity: {
      overview:
        'The Indian South African community — concentrated in KwaZulu-Natal, particularly in Durban (which has one of the largest Indian populations outside of India) — brings South Asian hair removal traditions to the South African context. Threading, turmeric paste practices, and waxing with aloe vera all form part of the beauty practice of this community.',
      integration:
        'Indian South African beauty salons in Durban offer threading alongside waxing, and the Indian South African community has influenced broader Durban beauty culture. Young South African women of various backgrounds in Durban are familiar with threading services.',
    },

    afrikanerAndEnglishSANorms: {
      overview:
        'White South African women of Afrikaner and English heritage follow broadly European and internationally aligned hair removal norms — waxing, shaving, laser, IPL. South African cities have well-developed professional beauty industries reflecting these practices.',
      laserMarket:
        'Laser hair removal is well established in South Africa\'s private healthcare and aesthetics market in Johannesburg, Cape Town, and Pretoria. Facilities serving clients across the phototype spectrum require access to both alexandrite/diode (for lighter skin types) and Nd:YAG (for darker skin types).',
    },

    productRecommendations: [
      'Marula oil (pure, cold-pressed) as a post-removal skin soother and moisturizer',
      'Shea butter for Bantu skin types post-wax',
      'Aloe vera gel for immediate post-wax soothing',
      'Niacinamide 10% for PIH management in darker skin types',
      'Salicylic acid 2% for ingrown hair prevention',
      'SPF 50+ daily — South Africa\'s UV index is extremely high year-round',
    ],

    culturalNotes:
      'South Africa\'s beauty industry is navigating an exciting post-apartheid reframing in which historically marginalized Black South African beauty standards are gaining mainstream recognition and investment. The "melanin magic" natural beauty movement has a strong South African voice. Body hair norms are being discussed more openly in the context of decolonizing beauty standards, while practical hair removal services continue to expand access across economic classes.',
  },

  // ───────────────────────────────────────────────────────────────────────────
  'black-american': {
    id: 'black-american',
    communityName: 'Black American',
    countries: ['United States of America — African American community'],

    culturalContext:
      'Black American beauty culture is a dynamic, complex, and increasingly powerful force in global beauty. It navigates the intersection of deeply felt aesthetic traditions, the ongoing legacy of Eurocentric beauty standards imposed by American society, and a vibrant counter-narrative celebrating natural beauty and Black identity. Hair removal in the Black American community is inseparable from the politics of the body — both head hair and body hair carry cultural and political meaning. At the same time, practical beauty practices around body hair removal are widely observed, with significant awareness of the specific dermatological challenges that afro-textured hair presents.',

    pfbCrisis: {
      
      mechanism:
        'Afro-textured hair grows from a highly elliptical, curved follicle that causes the hair shaft itself to be curled. When this hair is cut at the skin surface by a razor blade, the resulting blunt, sharp tip has a natural tendency to curve back toward the skin. As the hair grows, it can re-enter the follicle wall (transfollicular penetration) or pierce adjacent skin (extrafollicular penetration). The body recognizes the hair as a foreign body and mounts an inflammatory response — this is PFB.',
      appearance:
        'PFB appears as red or dark papules (raised bumps), sometimes pustules (pustular bumps), in shaved areas. On skin types V–VI, the inflammation rapidly triggers post-inflammatory hyperpigmentation, leaving dark spots that often persist long after the active ingrown hair has resolved. In the bikini and beard areas, untreated chronic PFB can lead to significant scarring.',
      prevalenceByArea: {
        beard: 'The most studied and historically documented area. PFB of the beard affects the majority of Black men who shave, driving significant quality-of-life impact. This has historically created real-world consequences — military shaving regulations, professional workplace grooming requirements — that disproportionately burden Black men.',
        bikini:
          'With coarse, tightly coiled hair the bikini and pubic area is the highest-risk zone for PFB; standard multi-blade razors very often cause it without proper technique and aftercare.',
        underarms: 'Underarm PFB is common in Black American women. The folded skin geometry of the axilla combined with coarse hair in multiple growth directions increases ingrown risk.',
        legs: 'Leg hair is generally less coily than pubic or underarm hair in most individuals, but PFB can still occur on the legs, particularly on the inner thigh.',
      },
      solutions: {
        methodSwitch: [
          'Sugaring or waxing instead of shaving for the bikini and underarm areas — hair removed from the root grows back tapered rather than with a blunt cut tip, dramatically reducing ingrown risk',
          'Single-blade safety razors instead of multi-blade cartridge razors when shaving — multi-blade razors use the "lift and cut" mechanism that cuts hair below skin level, dramatically increasing ingrown hair risk in curly hair',
          'Electric clippers or trimmers with a guard set to leave slight stubble rather than cutting to skin level',
          'Growing out the area: for the beard, the most effective PFB treatment is not shaving',
        ],
        chemicalExfoliants: [
          'Glycolic acid (alpha-hydroxy acid, AHA): dissolves the intercellular bonds in dead skin cells that can trap ingrown hairs. Applied 48 hours after shaving and 2–3 times per week for ongoing prevention. Concentration: 8–10% in a toner or lotion.',
          'Salicylic acid (beta-hydroxy acid, BHA): oil-soluble, penetrates into the follicle to exfoliate from within. 1–2% in a toner. Particularly effective for the bikini and underarm areas where sebum production is higher.',
          'Mandelic acid: a gentler AHA suitable for sensitive skin. Effective for PFB prevention with less irritation risk than glycolic acid.',
        ],
        topicals: [
          'Benzoyl peroxide 2.5–5%: addresses the bacterial component of PFB. Applied to the area after shaving. Bleaches fabric — use white towels.',
          'Clindamycin (prescription): topical antibiotic for infected PFB or folliculitis.',
          'Eflornithine (Vaniqa, prescription): topical enzyme inhibitor that slows hair growth. Used to reduce the rate of regrowth between shaves, decreasing the frequency of PFB events.',
          'Tretinoin (prescription retinoid): accelerates cell turnover, preventing the buildup of dead skin cells that trap ingrown hairs. Use at night; introduces photosensitivity — mandatory SPF during day.',
        ],
        jbco: 'Jamaican Black Castor Oil (JBCO) — an alkalized form of castor oil produced from roasted castor beans — is a widely used Black American traditional remedy for scalp and skin care. Applied to PFB-affected areas, it provides anti-inflammatory relief, moisturization, and has mild antibacterial properties. It is a cultural staple of Black American body care, particularly in the natural hair and organic beauty communities.',
      },
    },

    naturalBodyHairMovement: {
      overview:
        'A cultural and political movement within the Black American community asserts the right to maintain natural body hair as an act of self-determination, body autonomy, and rejection of Eurocentric beauty standards. This movement is intersectional, connecting hair politics (whether natural Afro-textured hair or body hair) to broader discussions of race, gender, and the politics of respectability.',
      context:
        'The expectation that Black women remove body hair to conform to dominant (historically white) beauty standards has been critiqued by Black feminist scholars and activists since at least the 1970s. Writers including Audre Lorde and contemporary Black feminist thinkers have addressed the intersection of bodily autonomy and racial beauty politics. The natural hair movement (going natural, transitioning from chemically relaxed to natural head hair) that gained mainstream momentum in the 2000s-2010s has a parallel in growing conversations about body hair.',
      intersection:
        'Many Black American women who embrace natural head hair also interrogate body hair removal norms, choosing to make personal decisions rather than conform to external expectations. This does not mean universal rejection of hair removal — many natural-hair Black women continue to remove body hair — but rather that the choice is framed as exactly that: a choice, rather than an obligation.',
      socialMedia:
        'Social media platforms (Instagram, TikTok, YouTube) have provided spaces for Black American women to share both traditional beauty knowledge (how to manage PFB, DIY sugaring, JBCO remedies) and body-positive content celebrating natural body hair.',
    },

    ingrownsAndChemicalSolutions: {
      glycolicAcid: {
        overview:
          'Glycolic acid is the most widely recommended chemical solution for ingrown hair prevention in Black American skin care. At concentrations of 8–10%, it dissolves the dead skin cells that cap over hair follicles, allowing hairs to grow out normally rather than deflecting inward.',
        timing: 'Apply 48 hours after shaving or waxing, then 2–3 times per week. Do not apply immediately after hair removal — the skin is too sensitive.',
        products: 'Look for glycolic acid toners or body lotions. Well-known formulations include PFBS Bump Fighter (specifically marketed for PFB in the Black community), Tend Skin, and various skincare brands targeting bump and ingrown concerns.',
      },
      salicylicAcid: {
        overview:
          'As an oil-soluble BHA, salicylic acid can penetrate into the oil-containing environment of the hair follicle pore where glycolic acid (water-soluble) cannot reach as effectively. It exfoliates the follicle wall from within, clearing the debris that traps ingrown hairs.',
        products: 'Salicylic acid body washes (2%) used daily in the shower provide gentle ongoing follicle maintenance. Targeted pads soaked in salicylic acid are applied post-shave.',
      },
      combinationApproach:
        'For severe PFB, a combination approach works best: salicylic acid cleanser daily, glycolic acid toner 3x/week, niacinamide serum for PIH, and SPF daily. This regimen addresses the mechanical ingrown, the bacterial component, the PIH, and the UV darkening of existing spots simultaneously.',
    },

    jbcoDetail: {
      name: 'Jamaican Black Castor Oil (JBCO)',
      composition:
        'JBCO is produced by roasting castor beans before pressing, which creates a high-ash product with a dark color and distinctive smoky scent. The roasting process increases the pH compared to standard castor oil. The oil is primarily ricinoleic acid (85–90%), an unusual hydroxy fatty acid with documented anti-inflammatory and analgesic properties. It also contains oleic acid, linoleic acid, and stearic acid.',
      uses: [
        'Applied to PFB-affected areas as a soothing anti-inflammatory treatment',
        'Massaged into newly waxed or shaved skin to moisturize and reduce redness',
        'Used as a scalp treatment and edge-care product in natural hair routines (a crossover use that has established JBCO as a Black hair care staple)',
        'Applied to dark spots in the bikini or underarm area as part of a PIH fading routine (castor oil has limited direct brightening effect but supports skin healing)',
      ],
      application: 'Apply a small amount to fingertips and massage gently into the affected area. Can be left on overnight. Use a small amount — a little goes a long way due to its thick consistency.',
    },

    laserConsiderations: {
      overview:
        'Skin types V–VI need the Nd:YAG 1064nm laser for safe hair removal. This cannot be overstated: using alexandrite (755nm) or poorly calibrated diode lasers on deep skin causes burns, blistering, and permanent pigmentation damage.',
      advocating: 'Black American clients seeking laser hair removal should explicitly ask: "Is this an Nd:YAG laser?" and "What settings have you used successfully on skin types V and VI?" A clinic that cannot answer these questions clearly should be avoided.',
      electrolysisAlternative:
        'Because electrolysis works on individual follicles using electrical current rather than light energy, it is equally effective across all skin tones and all hair colors, including the gray, white, and fine hairs that laser cannot target. It is a viable and safe alternative for Black American clients who cannot access appropriate laser technology or prefer a certified-permanent option.',
    },

    productRecommendations: [
      'Jamaican Black Castor Oil (JBCO) for post-shave soothing and PFB care',
      'Glycolic acid toner 8–10% for ingrown prevention (3x/week)',
      'Salicylic acid 2% body wash or pads for follicle maintenance',
      'Niacinamide 10% serum for PIH fading',
      'Azelaic acid 15–20% for combined PIH and antibacterial action',
      'SPF 50+ daily on all areas with dark spots — UV dramatically darkens PIH',
      'Single-blade safety razor if shaving is preferred',
      'Benzoyl peroxide 2.5% for infected PFB spots',
    ],

    culturalNotes:
      'The Black American beauty market is one of the most economically significant segments of the US beauty industry. Black-owned beauty brands serving this community have grown substantially, many addressing the specific skin concerns (PFB, PIH, hyperpigmentation, dark spots) that mainstream brands historically ignored. The increasing representation of Black dermatologists and estheticians who specialize in darker skin tones is improving access to appropriate care. Community knowledge-sharing — through Black beauty YouTube channels, Instagram, and TikTok — has democratized access to dermatological information about PFB management that was previously limited to specialty dermatology visits.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// STATISTICAL DATA
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// GETTER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function getBodyHairGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_BODY_HAIR_GUIDES['west-african'],
    'south-asian': ETHNIC_BODY_HAIR_GUIDES['south-asian'],
    'caribbean': ETHNIC_BODY_HAIR_GUIDES['caribbean'],
    'arab': ETHNIC_BODY_HAIR_GUIDES['arab'],
    'latina': ETHNIC_BODY_HAIR_GUIDES['latina'],
    'east-asian': ETHNIC_BODY_HAIR_GUIDES['east-asian'],
    'east-african': ETHNIC_BODY_HAIR_GUIDES['east-african'],
    'south-african': ETHNIC_BODY_HAIR_GUIDES['south-african'],
    'black-american': ETHNIC_BODY_HAIR_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

export function getAllCommunityIds() {
  const directMap = {
    'west-african': 'west-african',
    'south-asian': 'south-asian',
    'caribbean': 'caribbean',
    'arab': 'arab',
    'latina': 'latina',
    'east-asian': 'east-asian',
    'east-african': 'east-african',
    'south-african': 'south-african',
    'black-american': 'black-american',
  };
  return Object.keys(directMap);
}

export function getUniversalRemovalMethod(methodKey) {
  const directMap = {
    shaving: UNIVERSAL_BODY_HAIR.removalMethods.shaving,
    waxing: UNIVERSAL_BODY_HAIR.removalMethods.waxing,
    sugaring: UNIVERSAL_BODY_HAIR.removalMethods.sugaring,
    threading: UNIVERSAL_BODY_HAIR.removalMethods.threading,
    laser: UNIVERSAL_BODY_HAIR.removalMethods.laser,
    IPL: UNIVERSAL_BODY_HAIR.removalMethods.IPL,
    electrolysis: UNIVERSAL_BODY_HAIR.removalMethods.electrolysis,
    depilatoryCreams: UNIVERSAL_BODY_HAIR.removalMethods.depilatoryCreams,
    epilating: UNIVERSAL_BODY_HAIR.removalMethods.epilating,
  };
  return directMap[methodKey] || null;
}

export function getSafeIngredient(ingredientKey) {
  const directMap = {
    aloeVera: UNIVERSAL_BODY_HAIR.safeIngredients.aloeVera,
    witchHazel: UNIVERSAL_BODY_HAIR.safeIngredients.witchHazel,
    glycolicAcid: UNIVERSAL_BODY_HAIR.safeIngredients.glycolicAcid,
    salicylicAcid: UNIVERSAL_BODY_HAIR.safeIngredients.salicylicAcid,
    azelaicAcid: UNIVERSAL_BODY_HAIR.safeIngredients.azelaicAcid,
    centellaAsiatica: UNIVERSAL_BODY_HAIR.safeIngredients.centellaAsiatica,
    niacinamide: UNIVERSAL_BODY_HAIR.safeIngredients.niacinamide,
  };
  return directMap[ingredientKey] || null;
}

export function getLaserTypeInfo(laserType) {
  const directMap = {
    alexandrite: UNIVERSAL_BODY_HAIR.darkerSkinLaserGuidance,
    ndYAG: UNIVERSAL_BODY_HAIR.removalMethods.laser.laserTypes.ndYAG,
    diode: UNIVERSAL_BODY_HAIR.removalMethods.laser.laserTypes.diode,
  };
  return directMap[laserType] || null;
}

export function getCommunityProductRecommendations(communityId) {
  const guide = getBodyHairGuide(communityId);
  if (!guide) return null;
  return guide.productRecommendations || [];
}

export function getCommunitySignatureMethod(communityId) {
  const directMap = {
    'west-african': { primary: 'shaving', postCare: 'shea butter' },
    'south-asian': { primary: 'threading', postCare: 'aloe vera and turmeric' },
    'caribbean': { primary: 'waxing', postCare: 'coconut oil' },
    'arab': { primary: 'halawa (sugaring)', postCare: 'argan oil and rose water' },
    'latina': { primary: 'la cera (waxing)', postCare: 'aloe vera' },
    'east-asian': { primary: 'laser / IPL', postCare: 'centella asiatica' },
    'east-african': { primary: 'sugaring', postCare: 'frankincense oil' },
    'south-african': { primary: 'waxing', postCare: 'marula oil' },
    'black-american': { primary: 'waxing or sugaring', postCare: 'JBCO and glycolic acid' },
  };
  return directMap[communityId] || null;
}

export function getPrePostProtocol(timing) {
  const directMap = {
    pre: UNIVERSAL_BODY_HAIR.preRemovalProtocol,
    post: UNIVERSAL_BODY_HAIR.postRemovalProtocol,
    both: {
      pre: UNIVERSAL_BODY_HAIR.preRemovalProtocol,
      post: UNIVERSAL_BODY_HAIR.postRemovalProtocol,
    },
  };
  return directMap[timing] || null;
}

export function isLaserSafeForPhototype(laserType, phototype) {
  const safetyMatrix = {
    alexandrite: {
      I: true, II: true, III: true,
      IV: false, V: false, VI: false,
    },
    ndYAG: {
      I: true, II: true, III: true,
      IV: true, V: true, VI: true,
    },
    diode: {
      I: true, II: true, III: true,
      IV: true, V: false, VI: false,
    },
    IPL: {
      I: true, II: true, III: true,
      IV: false, V: false, VI: false,
    },
  };
  const laserData = safetyMatrix[laserType];
  if (!laserData) return null;
  const phototypeLookup = {
    alexandrite: safetyMatrix.alexandrite,
    ndYAG: safetyMatrix.ndYAG,
    diode: safetyMatrix.diode,
    IPL: safetyMatrix.IPL,
  };
  return (phototypeLookup[laserType] && phototypeLookup[laserType][phototype]) !== undefined
    ? phototypeLookup[laserType][phototype]
    : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTENDED COMMUNITY PROFILES — ADDITIONAL DEPTH
// ─────────────────────────────────────────────────────────────────────────────

export const EXTENDED_COMMUNITY_PROFILES = {

  'west-african-extended': {
    communityId: 'west-african',
    section: 'extended',

    diasporaAdaptations: {
      uk: {
        description:
          'The West African diaspora in the United Kingdom — concentrated in London (Brixton, Peckham, Hackney, Tottenham), Birmingham, and Manchester — has developed a thriving community of Black-owned beauty salons and threading studios. Nigerian and Ghanaian beauty practitioners have brought their expertise to UK salons, and the demand for services appropriate for Black skin (threading, waxing with knowledgeable post-care, laser with Nd:YAG) is strong.',
        productsAvailable:
          'Unrefined shea butter is readily available in West African grocery and beauty shops across the UK. Dudu Osun black soap — a popular Nigerian handmade soap containing shea butter, palm oil, honey, and local herbs — is sold in these shops and used widely as a pre- and post-hair-removal cleanser.',
      },
      northAmerica: {
        description:
          'West African diaspora communities in Houston, Atlanta, New York, Toronto, and Washington DC (among others) have established West African beauty salons and hair braiding studios that double as knowledge hubs. The awareness of PIH management is higher in the North American context where access to dermatologists specializing in darker skin is greater.',
        uniqueProducts:
          'American market offers more clinical PIH treatment options: prescription azelaic acid 20%, prescription tretinoin for accelerating skin cell turnover, and medical-grade niacinamide formulations. West African diaspora women in North America often combine traditional remedies (shea butter, dudu-osun) with clinical actives.',
      },
    },

    senegalSpecific: {
      overview:
        'Senegalese beauty culture, blending West African tradition with French colonial influence and Wolof cultural practices, has a distinct emphasis on skin luminosity ("xeesal" — brightening products are widely used) that intersects with hair removal post-care. Skin brightening after hair removal to address PIH has been practiced in Senegal, though the WHO has flagged concerns about the use of mercury-containing and hydroquinone-containing brightening products in West Africa at unregulated concentrations.',
      saferAlternatives:
        'Within the broader West African community, Senegalese beauty practitioners increasingly recommend niacinamide, azelaic acid, and alpha-arbutin — effective and safer alternatives to unregulated brightening products — particularly in diaspora contexts where access to quality formulations is good.',
    },

    ghanaianSpecific: {
      nkuiOil:
        'Palm kernel oil (nkui in Twi) is a traditional Ghanaian skin care ingredient used in post-hair-removal skin care alongside shea butter. It has a different fatty acid profile from shea — primarily lauric acid and myristic acid — giving it antibacterial properties suitable for post-removal folliculitis prevention.',
    },

    nigerianSpecific: {
      yoriYori:
        'In Nigerian Yoruba culture, "yori-yori" refers to visible razor bumps or skin bumps — a colloquial term that speaks to the cultural awareness of PFB. The concern about yori-yori drives preferences for waxing or sugaring over shaving in sensitive areas. A Nigerian woman advising her daughter on hair removal would commonly warn against shaving underarms precisely to avoid yori-yori.',
      lagosBeautyIndustry:
        'Lagos is emerging as a regional beauty capital, with investment in professional skincare, salon services, and cosmetics. The Lagos beauty industry is significant economically, with Nigerian-owned brands like SkinCraft and House of Tara developing body care lines addressing PIH and post-hair-removal care with Nigerian skin tones in mind.',
    },
  },

  'south-asian-extended': {
    communityId: 'south-asian',
    section: 'extended',

    bridePreparation: {
      overview:
        'The South Asian bridal preparation process — spanning weeks before the wedding — is one of the most elaborate beauty preparation sequences in any global culture. Hair removal is an integral component, often performed in a specific sequence of appointments.',
      timeline: [
        { timing: '4–6 weeks before', treatments: 'Begin waxing or threading for the arms, legs, and face to allow skin to settle and any PIH from earlier sessions to start fading.' },
        { timing: '2 weeks before', treatments: 'Full body waxing appointment: legs, arms, underarms, full face threading. Allow skin to fully recover.' },
        { timing: '1 week before', treatments: 'Haldi ceremony (turmeric application by family members) — no waxing in this window as the skin must be able to receive haldi paste without irritation from open follicles.' },
        { timing: '2–3 days before', treatments: 'Final facial threading touch-up for brows and upper lip if needed. Henna (mehndi) application — must be done after all waxing is complete.' },
        { timing: 'Morning of wedding', treatments: 'No new hair removal. Skin care routine: moisturizer, SPF under makeup, bridal foundation applied by makeup artist.' },
      ],
      mehndiAndHairRemoval:
        'The interaction between mehndi (henna for bridal body art) and hair removal requires careful sequencing. Henna paste should always be applied after hair removal, never before — the paste adheres better to clean, hair-free skin and produces a more vibrant stain. The ideal gap is a minimum of 24–48 hours after waxing to allow follicles to close before henna paste contacts the skin.',
    },

    pakistaniCommunity: {
      overview:
        'Pakistani beauty culture, shaped by Islamic fitra tradition and Punjabi, Sindhi, Pashtun, and Baloch regional traditions, places a strong emphasis on female grooming and hair removal. Pakistani salons ("parlors") are found throughout Pakistan\'s urban landscape and in diaspora communities worldwide.',
      regionalIngredients:
        'Multani mitti (Fuller\'s earth clay) is used in Pakistani traditional beauty practice as a post-hair-removal face mask that absorbs excess sebum and soothes the skin. It is mixed with rose water or plain water and applied to the face after threading. It has mild astringent properties.',
      kashmiriInfluence:
        'Kashmiri beauty traditions include the use of saffron-infused oil for skin care and saffron milk as a skin-brightening treatment. Applied after hair removal, saffron is believed to promote an even skin tone — a claim with some scientific support, as crocin and safranal in saffron show antioxidant activity in laboratory studies.',
    },

    sriLankanAndTamilTraditions: {
      coconutOilRole:
        'In Sri Lanka and Tamil Nadu (South India), coconut oil plays the post-removal care role that shea butter plays in West Africa. Sri Lankan beauty practice involves applying pure virgin coconut oil to legs and arms after waxing, taking advantage of the tree\'s local abundance. The antibacterial and moisturizing properties of coconut oil make it effective for this purpose.',
      herbalBathTradition:
        'Sri Lankan bridal preparation includes an herbal bath (using a bundle of medicinal herbs boiled in water) before waxing sessions, believed to soften skin and hair for easier removal and reduce post-removal redness. This parallels the Arab hammam tradition and reflects a cross-cultural understanding of steam and heat as pre-removal preparation.',
    },
  },

  'arab-extended': {
    communityId: 'arab',
    section: 'extended',

    levantineSpecific: {
      lebanon: {
        overview:
          'Lebanese beauty culture is among the most sophisticated in the Arab world, with Beirut historically serving as the "Paris of the Middle East" and maintaining a highly developed beauty services industry even through periods of political instability. Lebanese beauty salons are famous across the Arab world for their technical skill, and Lebanese beauty professionals have spread throughout the Gulf, Europe, and the Americas.',
        hallawaSalons:
          'Professional halawa artists in Lebanese salons perform the service with exceptional speed and skill. A full-body halawa (arms, legs, underarms, and bikini) takes 45–90 minutes in an experienced practitioner\'s hands. The paste quality, preparation, and body temperature maintenance are closely controlled.',
        olivoilPostRemoval:
          'In Lebanon and across the Levant, olive oil — produced locally in Lebanon, Syria, Palestine, and Jordan — is used as a post-halawa skin treatment, paralleling argan oil in Morocco. Olive oil\'s oleic acid content (55–83%) and antioxidant polyphenols make it an excellent skin barrier oil. Extra virgin olive oil, with its higher polyphenol content, is preferred for skin use.',
      },
      egypt: {
        overview:
          'Egypt has one of the longest continuous recorded histories of body hair removal — hieroglyphic evidence and ancient Egyptian artifacts including razors and depilatory substances have been found in archaeological sites dating back over 5,000 years. Cleopatra\'s use of a sugar-based wax is one of history\'s most cited beauty traditions.',
        modernEgyptian:
          'Contemporary Egyptian beauty salons are widespread and affordable. Halawa services are priced accessibly, and Egyptian women across economic classes use professional sugaring services regularly. Post-Eid and pre-wedding halawa is near-universal.',
        egyptianHalawa:
          'The Egyptian halawa preparation has slight regional variations — some practitioners add a few drops of essential oil (often rose or orange blossom) to the cooking mixture for fragrance, and some use honey instead of pure white sugar for a slightly different consistency and additional moisturizing benefit.',
      },
    },

    gulfArabicSpecific: {
      overview:
        'In Gulf Arab societies (Saudi Arabia, UAE, Kuwait, Qatar, Bahrain, Oman), beauty salons are exclusively female spaces and represent some of the highest-end beauty establishments globally in the major cities. Gulf Arab women invest substantially in beauty treatments, and the halawa service is a standard offering at even the most luxurious facilities.',
      frankincenseAndOud:
        'Gulf Arab beauty practice incorporates frankincense (luban) and oud (agarwood) in ways that overlap with skin care and hair removal. Frankincense resin is burned as incense in the hammam-like beauty preparation ritual, and frankincense oil (diluted) is sometimes applied post-halawa for its anti-inflammatory and skin-regenerating properties — a Gulf parallel to the East African use of frankincense oil documented in the main guide.',
    },

    maghrebiSpecific: {
      morocco: {
        overview:
          'Moroccan halawa and hammam tradition is among the most globally recognized, partly because of the worldwide growth of Moroccan beauty exports (argan oil, black soap, kessa mitts) and the tourism industry that exposes visitors from around the world to the hammam experience.',
        blackSoap:
          'Moroccan savon beldi (black soap) deserves extended description. Made from macerated olives and olive oil — the same raw material as Castile soap but prepared differently — it is a soft, moist, deeply cleansing soap with a dark brown-black color. Used with a kessa mitt in the hammam, it exfoliates the skin surface and prepares it for halawa by removing dead skin cells and softening hair. The post-kessa exfoliation is dramatic: rolled-off dead skin cells are visible, reflecting the degree of exfoliation. This pre-halawa step is one reason why hammam-based halawa achieves superior results compared to salon halawa without the steam preparation.',
        arganApplication:
          'Post-halawa argan oil application in Morocco is almost universal. The oil is pressed at local cooperatives staffed primarily by Berber women and sold in markets across Morocco. Its global commercial success has created both economic opportunity and challenges around sustainability and authenticity (adulterated argan oil is common). For genuine quality, look for certified organic Moroccan argan oil from established cooperatives.',
      },
    },
  },

  'black-american-extended': {
    communityId: 'black-american',
    section: 'extended',

    blackDermatologyMovement: {
      overview:
        'The field of dermatology has historically underserved Black patients, partly because darker skin was less frequently represented in medical training materials and partly because of systemic barriers to healthcare access. A growing movement of Black dermatologists (Dr. Andrew Alexis, Dr. Susan Taylor, Dr. Jeanine Downie, among others) has worked to correct this gap, producing research specific to darker skin tones, writing consumer-facing books on Black skin care, and training the next generation of practitioners with appropriate knowledge.',
      impact:
        'This movement has significantly improved the quality of guidance available to Black American consumers on managing PFB, PIH, and hair removal for darker skin. The publication of Dr. Susan Taylor\'s "Brown Skin" and similar resources has democratized dermatological knowledge for the community. Social media has accelerated this further, with Black dermatologists on Instagram and TikTok reaching millions with evidence-based advice.',
      hairRemovalSpecificAdvances: [
        'The recognition of the Nd:YAG laser as the essential technology for safe hair removal in deep skin tones is now widely taught in US dermatology training, though implementation varies by clinic.',
        'The prescription use of eflornithine (Vaniqa) for facial PFB management — previously underutilized — has been more actively promoted for Black patients with beard-related PFB.',
        'Topical retinoid protocols specific to darker skin types (starting at lower concentrations to build tolerance) are now standard in Black dermatology practice.',
      ],
    },

    naturalHairAndBodyHairPolitics: {
      intersectionality:
        'The political dimension of Black American hair — both on the head and on the body — cannot be fully understood without engaging with the broader history of Eurocentric beauty standards and their imposition on Black communities. The relaxer (chemical hair straightening) industry targeted Black women for a century with the implicit message that natural Afro-textured hair was unacceptable. The parallel for body hair is less dramatic but present: the cultural pressure to remove body hair aligns with Eurocentric standards of smooth skin that have not always been consistent with what hair removal practices do to afro-textured body hair.',
      thecrown:
        'The CROWN Act (Creating a Respectful and Open World for Natural Hair) — legislation prohibiting discrimination based on natural hair texture and protective hairstyles in workplaces and schools — passed in several US states and represents the legal dimension of hair politics in the Black American community. Body hair sits adjacent to this conversation, though it has not achieved the same legislative attention.',
      onlineCommunity:
        'YouTube and Instagram communities centered on Black women\'s body care have produced extensive practitioner knowledge about managing body hair removal for dark skin. Search terms like "razor bumps Black women," "bikini waxing dark skin," and "PFB remedies" yield substantial Black-created content that represents a democratized knowledge base built from lived experience.',
    },

    masculinePFBExperience: {
      overview:
        'While much of the beauty industry conversation focuses on women\'s hair removal, the PFB experience in Black American men is documented, widespread, and has real professional and social consequences. Military regulations requiring clean-shaving, professional dress codes, and everyday interactions have all been affected by this condition.',
      militaryContext:
        'The US military has historically struggled with PFB policy for Black service members. Early policies requiring clean shaving regardless of medical condition created significant PFB crises in Black military personnel. Subsequent medical exemption policies (shaving waivers for documented PFB) represent a policy accommodation that acknowledges the biological reality. Civilian workplaces with beard policies similarly affect Black male employees disproportionately.',
      solutions: {
        chemicalShave:
          'Depilatory cream ("Magic Shave" and similar products specifically marketed to Black men) dissolves rather than cuts the hair, producing a rounded rather than blunt tip and dramatically reducing ingrown hair formation compared to blade shaving. These are among the longest-standing PFB-specific products, marketed to Black men since the mid-20th century.',
        clipping:
          'Electric clippers with a guard set to leave 1–2mm of stubble allows the beard area to be maintained without cutting to skin level, effectively eliminating the PFB trigger while maintaining an acceptably groomed appearance in most professional environments.',
        permanent: 'For men who wish to eliminate the issue permanently, laser hair removal with Nd:YAG is increasingly pursued. Beard laser hair removal creates a permanently smooth face without daily shaving-related PFB.',
      },
    },
  },

  'latina-extended': {
    communityId: 'latina',
    section: 'extended',

    brazilianBeachCulture: {
      overview:
        'Brazil\'s beach culture is foundational to understanding hair removal norms in the country and their global export. The specific geography and climate of Brazil — thousands of kilometers of Atlantic coastline, tropical to subtropical temperatures, and a national cultural identity deeply tied to the beach and to the physical body — created conditions in which full body hair removal became normalized earlier and more completely than in most other societies.',
      fiodentalBikini:
        'The Brazilian bikini (fio dental — dental floss) was introduced by fashion designer Rose di Primo in São Paulo in 1977 and popularized on Rio de Janeiro\'s Ipanema and Copacabana beaches through the late 1970s. This style exposed the full bikini line and much of the buttocks, making visible pubic hair a practical (not merely aesthetic) issue for Brazilian beachgoers. The Brazilian wax, developed to address this, followed naturally.',
      carnivalConnection:
        'Carnival costuming in Brazil — particularly for Rio Carnival samba school dancers (passistas) and those in blocos and parades — is famously revealing. The correlation between Carnival preparation and hair removal demand peaks creates one of the most intense seasonal demand cycles in any beauty services market, typically running January through February.',
    },

    colombianCulture: {
      overview:
        'Colombian beauty culture, heavily influenced by the country\'s complex racial heritage (Indigenous, African, Spanish colonial), its major beauty pageant tradition (Miss Colombia and the Cartagena National Pageant), and the influence of telenovela aesthetics, places exceptional emphasis on groomed, smooth skin. Colombian women are often cited in pan-Latin American beauty discourse as having particularly rigorous beauty maintenance standards.',
      alocVera: {
        localName: 'Sábila',
        overview:
          'In Colombia and across the Andean countries, aloe vera is known as "sábila" and is grown as a household plant across the country\'s diverse climates. Sábila gel is the default post-wax treatment in Colombian beauty culture — applied directly from freshly cut leaves when available, or from commercial preparations. The fresh gel has the additional benefit of pantothenic acid and other active compounds lost in some commercial formulations.',
      },
    },

    mexicanIndigenousTraditions: {
      overview:
        'Mexican beauty traditions reflect a rich Indigenous heritage from Aztec, Maya, Zapotec, and dozens of other pre-Columbian civilizations. Traditional Mesoamerican beauty practice included the use of plant-based depilatory and skin care preparations that predate Spanish colonization.',
      nopale:
        'Nopal cactus (prickly pear, Opuntia species) gel — similar in composition to aloe vera — has been used in Mexican folk medicine and beauty practice for centuries. Applied post-hair-removal, nopal gel provides soothing, hydration, and mild anti-inflammatory benefits. It is found in Mexican pharmacies and traditional markets.',
      papayaEnzymes:
        'Papaya (from Mexico and Central America) contains papain, a proteolytic enzyme that can weaken hair protein structure. Folk practice in Mexico has used papaya paste as a depilatory, applied to fine body hair and rubbed off after 20–30 minutes. This practice parallels the turmeric/gram flour paste used in South Asian tradition — enzymatic rather than purely mechanical hair removal.',
    },
  },

  'east-asian-extended': {
    communityId: 'east-asian',
    section: 'extended',

    koreanbodyHair: {
      overview:
        'Korean attitudes toward body hair among women are in rapid cultural evolution. The traditional K-beauty emphasis on flawless, smooth skin has historically implied body hair removal as a given. However, the Korean feminist movement — particularly the "escape the corset" (탈코르셋, talkoset) movement that emerged strongly around 2018 — explicitly targeted conventional beauty standards, including hair removal, as part of a critique of the labor and cost imposed on women by aesthetic expectations.',
      escapeCorset:
        'The talkoset movement in Korea saw women publicly documenting their decision to stop removing body hair, cut off long hair, and abandon makeup — sharing before-and-after photos on social media as acts of political statement. The movement received significant backlash as well as support, reflecting the contested nature of these norms in Korean society.',
      kbeautyPostCare:
        'Regardless of the political debates, the K-beauty industry\'s post-hair-removal skincare formulations are among the most technically sophisticated in the world. Korean brands such as Dr. Jart+, COSRX, Illiyoon, and CeraVe Korea have developed soothing, barrier-repairing post-laser and post-wax formulas featuring centella asiatica, hyaluronic acid, ceramides, and panthenol (vitamin B5) that are exported globally and used by skincare enthusiasts worldwide.',
    },

    japaneseBodyNorms: {
      
      menBodyHair:
        'Japanese male body hair norms have also shifted dramatically in the 21st century. The concept of "manscaping" has been normalized in Japan earlier and more extensively than in most Western markets. Japanese men visiting datsumou salons for back, chest, and underarm hair removal is now commonplace, and the "ikemen" (cool/handsome male) beauty standard often implies minimal body hair.',
    },

    chineseModernMarket: {
      overview:
        'China\'s explosive growth in the beauty and personal care market — projected to overtake Japan as the world\'s second-largest cosmetics market — includes the laser hair removal segment. The acceleration is driven by rising incomes, urbanization, and the influence of social media platforms like Douyin (TikTok China), Xiaohongshu (Little Red Book), and Weibo where beauty standards are set and replicated at massive scale.',
      douyin:
        'Douyin\'s massive influence on Chinese beauty standards has accelerated the normalization of laser hair removal among younger Chinese women (18–35). Influencer content showing before-and-after laser results, datsumou salon tours, and product reviews has made laser a mainstream topic where it was previously considered more of a niche medical procedure.',
      tcmPostCare:
        'Traditional Chinese Medicine (TCM) intersects with post-hair-removal care in Chinese beauty practice. Herbal preparations — including formulas containing licorice root (glycyrrhiza), white peony (baishao), and pearl powder — are used in TCM-influenced skincare for brightening and soothing. These are integrated into post-removal care in some traditional Chinese beauty salons alongside modern skincare.',
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SEASONAL AND OCCASION-BASED GUIDES
// ─────────────────────────────────────────────────────────────────────────────

export const OCCASION_GUIDES = {
  wedding: {
    title: 'Wedding Hair Removal Guide',
    timeline: 'Begin professional hair removal 4–6 weeks before the wedding date. The first session allows skin to recover and any PIH to begin fading before the day itself.',
    byEthnicity: {
      'south-asian': 'Threading, full waxing, haldi ceremony 1 week before, mehndi 2 nights before. No waxing within 5 days of mehndi or wedding day.',
      arab: 'Full-body halawa 5–7 days before. Final touch-up threading for brows 2 days before. Hammam session 3 days before.',
      'west-african': 'Full body waxing 1 week before. Shea butter protocol nightly from 2 weeks before. Brightening treatment for any PIH from at least 8 weeks before.',
      latina: 'Full body waxing 5–7 days before. Aloe vera post-wax protocol. Brightening serum for underarm PIH from 8 weeks before.',
      caribbean: 'Full body waxing 5–7 days before. Coconut oil post-removal nightly from 2 weeks out. JBCO for bikini if PFB-prone.',
      'black-american': 'Prefer waxing or sugaring over shaving. Begin glycolic acid regimen for bikini and underarms 8 weeks before to treat existing PFB. Nd:YAG laser as a longer-term option (must begin 6+ months before for adequate sessions).',
      'east-african': 'Full sugaring 5–7 days before. Henna 2 days before (after all removal is complete). Frankincense oil protocol nightly from 2 weeks before.',
      'east-asian': 'Last laser session 4–6 weeks before (time for complete healing). Cica soothing protocol from 2 weeks before. Brightening serum for any PIH.',
      'south-african': 'Full waxing 5–7 days before. Marula oil protocol nightly. For Bantu skin, begin niacinamide treatment for any PIH at least 6 weeks before.',
    },
  },

  carnival: {
    title: 'Carnival Preparation Guide',
    relevantCommunities: ['caribbean', 'black-american', 'latina'],
    timeline: '6–8 weeks before: Begin full-body waxing cycle. 2 weeks before: Last waxing session. 1 week before: Post-wax skin treatment and exfoliation. 3 days before: Glitter primer, body oil application preparation.',
    bodyAreaPriority: ['Full bikini / pubic area', 'Full legs', 'Underarms', 'Arms', 'Back and chest if costume exposes these'],
    skinPrepProtocol: [
      'Weekly body scrub with sugar or salt scrub from 4 weeks before',
      'Daily moisturizing with coconut oil (Caribbean) or body lotion',
      'Niacinamide serum for any underarm or bikini PIH — begin 8 weeks before for best results',
      'Body illuminizer applied on the day for Caribbean/Brazilian carnival aesthetic',
      'SPF during daylight portions of outdoor carnival events',
    ],
  },

  beachSeason: {
    title: 'Beach Season Preparation Guide',
    relevantCommunities: ['caribbean', 'latina', 'west-african', 'black-american', 'south-african'],
    timeline: 'Ideally: Begin professional waxing or laser cycle 8–12 weeks before peak beach season. For laser hair removal: begin 6–12 months before for optimal results.',
    essentials: [
      'Choose waxing or sugaring over shaving for bikini line to minimize PFB',
      'Begin exfoliation regimen (salicylic acid or glycolic acid) 2 weeks before first beach outing',
      'Nail down PIH treatment for underarms and bikini from previous season\'s irritation',
      'Apply SPF 50+ to legs, arms, and any treated areas at the beach',
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT INGREDIENT GLOSSARY
// ─────────────────────────────────────────────────────────────────────────────

export const INGREDIENT_GLOSSARY = {
  sheaButter: {
    inci: 'Butyrospermum Parkii (Shea) Butter',
    
    keyFattyAcids: ['Oleic acid (40–60%)', 'Stearic acid (20–50%)', 'Linoleic acid (3–11%)', 'Palmitic acid (2–9%)'],
    benefitsForHairRemoval: 'Barrier repair, anti-inflammatory, moisturizing, traditional post-removal staple in West African and East African communities.',
    comedogenicRating: '0–2 (low; unlikely to clog pores for most)',
  },
  coconutOil: {
    inci: 'Cocos Nucifera (Coconut) Oil',
    
    keyFattyAcids: ['Lauric acid (~50%)', 'Myristic acid (~20%)', 'Caprylic acid (~8%)', 'Palmitic acid (~9%)'],
    benefitsForHairRemoval: 'Antibacterial (lauric acid), moisturizing, post-removal soothing. Central in Caribbean and South Asian post-removal practice.',
    comedogenicRating: '4 (high; may cause breakouts in acne-prone individuals — patch test)',
  },
  marulaOil: {
    inci: 'Sclerocarya Birrea Seed Oil',
    
    keyFattyAcids: ['Oleic acid (70–78%)', 'Linoleic acid (4–7%)', 'Palmitic acid (~9%)'],
    benefitsForHairRemoval: 'Deep moisturizing, antioxidant, rapid absorption, barrier repair. Post-removal staple in South African beauty.',
    comedogenicRating: '3–4 (moderate; generally well-tolerated but patch test in acne-prone skin)',
  },
  arganOil: {
    inci: 'Argania Spinosa Kernel Oil',
    
    keyFattyAcids: ['Oleic acid (43–49%)', 'Linoleic acid (29–36%)'],
    benefitsForHairRemoval: 'Skin barrier repair, anti-inflammatory (vitamin E), fast absorption. Central in Moroccan post-halawa practice.',
    comedogenicRating: '0–2 (low; generally non-comedogenic)',
  },
  jojoba: {
    inci: 'Simmondsia Chinensis (Jojoba) Seed Oil',
    
    composition: 'Technically a liquid wax ester, not an oil. Structure closely mimics human sebum.',
    benefitsForHairRemoval: 'Excellent carrier for essential oils, regulates sebum production, non-comedogenic, soothing. Good base for frankincense dilution.',
    comedogenicRating: '2 (low)',
  },
  frankincenseOil: {
    inci: 'Boswellia Carterii (or Sacra) Oil',
    
    keyCompounds: ['Boswellic acid esters', 'Alpha-pinene', 'Limonene', 'Incensole acetate'],
    benefitsForHairRemoval: 'Anti-inflammatory (5-LOX inhibition), skin regeneration, calming redness. Post-removal use in East African and Gulf Arab communities. ALWAYS dilute in carrier oil.',
    comedogenicRating: '1 (very low)',
  },
  aloeVera: {
    inci: 'Aloe Barbadensis Leaf Juice',
    
    keyCompounds: ['Polysaccharides (acemannan)', 'Anthraquinones (small amounts)', 'Vitamins A, C, E', 'Zinc'],
    benefitsForHairRemoval: 'Immediate soothing and cooling, anti-inflammatory, antibacterial, moisture-attracting (humectant). Universal post-removal standard. Central in South Asian, Latina, and Caribbean post-removal care.',
    comedogenicRating: '0 (non-comedogenic)',
  },
  glycolicAcid: {
    inci: 'Glycolic Acid',
    
    mechanism: 'Smallest alpha-hydroxy acid; dissolves intercellular glue between dead skin cells; accelerates cell turnover',
    benefitsForHairRemoval: 'Prevents and treats ingrown hairs and PFB by dissolving skin that traps hairs. Most effective ingrown hair prevention ingredient with clinical evidence.',
    recommendedConcentration: '5–10% in regular use products; 20–30% in chemical peels (professional use only)',
  },
  salicylicAcid: {
    inci: 'Salicylic Acid',
    
    mechanism: 'Oil-soluble BHA; penetrates follicle pore; exfoliates follicle wall; also anti-inflammatory and antibacterial',
    benefitsForHairRemoval: 'Clears follicle debris that causes ingrown hairs; antibacterial action addresses PFB\'s bacterial component; reduces redness.',
    recommendedConcentration: '0.5–2% in leave-on products; 2% BHA toner for twice-weekly use',
  },
  niacinamide: {
    inci: 'Niacinamide (Nicotinamide)',
    
    mechanism: 'Inhibits melanosome transfer from melanocytes to keratinocytes, reducing visible pigmentation; strengthens skin barrier',
    benefitsForHairRemoval: 'Fades post-inflammatory hyperpigmentation from PFB, razor bumps, waxing-related inflammation. One of the safest and most evidence-based PIH treatments for all skin types.',
    recommendedConcentration: '5–10%',
  },
  azelaicAcid: {
    inci: 'Azelaic Acid',
    
    mechanism: 'Inhibits tyrosinase (melanin synthesis enzyme); anti-bacterial; anti-inflammatory; mild comedolytic',
    benefitsForHairRemoval: 'Dual action on PIH (brightening) and PFB (antibacterial, anti-inflammatory). One of the best single-ingredient solutions for post-hair-removal dark spots in deeper skin tones.',
    recommendedConcentration: '10% OTC; 15–20% prescription (Finacea gel 15%; Skinoren 20% cream)',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ADDITIONAL GETTER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function getExtendedProfile(communityId) {
  const directMap = {
    'west-african': EXTENDED_COMMUNITY_PROFILES['west-african-extended'],
    'south-asian': EXTENDED_COMMUNITY_PROFILES['south-asian-extended'],
    'caribbean': null,
    'arab': EXTENDED_COMMUNITY_PROFILES['arab-extended'],
    'latina': EXTENDED_COMMUNITY_PROFILES['latina-extended'],
    'east-asian': EXTENDED_COMMUNITY_PROFILES['east-asian-extended'],
    'east-african': null,
    'south-african': null,
    'black-american': EXTENDED_COMMUNITY_PROFILES['black-american-extended'],
  };
  return directMap[communityId] !== undefined ? directMap[communityId] : null;
}

export function getOccasionGuide(occasion) {
  const directMap = {
    wedding: OCCASION_GUIDES.wedding,
    carnival: OCCASION_GUIDES.carnival,
    beach: OCCASION_GUIDES.beachSeason,
    beachSeason: OCCASION_GUIDES.beachSeason,
  };
  return directMap[occasion] || null;
}

export function getIngredient(ingredientKey) {
  const directMap = {
    sheaButter: INGREDIENT_GLOSSARY.sheaButter,
    coconutOil: INGREDIENT_GLOSSARY.coconutOil,
    marulaOil: INGREDIENT_GLOSSARY.marulaOil,
    arganOil: INGREDIENT_GLOSSARY.arganOil,
    jojoba: INGREDIENT_GLOSSARY.jojoba,
    frankincenseOil: INGREDIENT_GLOSSARY.frankincenseOil,
    aloeVera: INGREDIENT_GLOSSARY.aloeVera,
    glycolicAcid: INGREDIENT_GLOSSARY.glycolicAcid,
    salicylicAcid: INGREDIENT_GLOSSARY.salicylicAcid,
    niacinamide: INGREDIENT_GLOSSARY.niacinamide,
    azelaicAcid: INGREDIENT_GLOSSARY.azelaicAcid,
  };
  return directMap[ingredientKey] || null;
}

export function getRecommendedPostCareOil(communityId) {
  const directMap = {
    'west-african': { oil: 'Shea Butter', inci: 'Butyrospermum Parkii (Shea) Butter', reasoning: 'Indigenous to West Africa; deep moisturizing; anti-inflammatory; culturally established practice.' },
    'south-asian': { oil: 'Sesame Oil or Coconut Oil', inci: 'Sesamum Indicum (Sesame) Seed Oil', reasoning: 'Ayurvedic tradition; sesame oil\'s linoleic acid content; antibacterial properties of coconut oil in South Indian practice.' },
    'caribbean': { oil: 'Coconut Oil or JBCO', inci: 'Cocos Nucifera (Coconut) Oil', reasoning: 'Indigenous to Caribbean; antibacterial (lauric acid); culturally central in post-removal and hair care.' },
    'arab': { oil: 'Argan Oil (Morocco) or Olive Oil (Levant)', inci: 'Argania Spinosa Kernel Oil / Olea Europaea (Olive) Fruit Oil', reasoning: 'Traditional post-halawa oils; high oleic acid content; antioxidant polyphenols.' },
    'latina': { oil: 'Aloe Vera Gel (primary) then Coconut Oil', inci: 'Aloe Barbadensis Leaf Juice / Cocos Nucifera (Coconut) Oil', reasoning: 'Sábila (aloe) is culturally established; coconut oil for deeper moisturizing follow-up.' },
    'east-asian': { oil: 'Camellia (Tsubaki) Oil or Centella Asiatica Extract', inci: 'Camellia Sinensis Seed Oil', reasoning: 'Camellia oil is a traditional Japanese beauty oil, highly absorbed; cica extract for post-laser soothing in Korean practice.' },
    'east-african': { oil: 'Frankincense Oil (diluted in Jojoba)', inci: 'Boswellia Carterii Oil / Simmondsia Chinensis Seed Oil', reasoning: 'Frankincense traditionally produced in Ethiopia and Eritrea; anti-inflammatory boswellic acids; jojoba as non-comedogenic carrier.' },
    'south-african': { oil: 'Marula Oil', inci: 'Sclerocarya Birrea Seed Oil', reasoning: 'Indigenous to southern Africa; extraordinarily high oleic acid content; deep absorption; antioxidant; used in Zulu and Bantu traditional skin care for centuries.' },
    'black-american': { oil: 'JBCO (Jamaican Black Castor Oil)', inci: 'Ricinus Communis (Castor) Seed Oil', reasoning: 'Culturally established community remedy for PFB and post-removal soothing; ricinoleic acid anti-inflammatory properties; widely available.' },
  };
  return directMap[communityId] || null;
}

export function getAllProductRecommendations() {
  const directMap = {
    'west-african': ETHNIC_BODY_HAIR_GUIDES['west-african'].productRecommendations,
    'south-asian': ETHNIC_BODY_HAIR_GUIDES['south-asian'].productRecommendations,
    'caribbean': ETHNIC_BODY_HAIR_GUIDES['caribbean'].productRecommendations,
    'arab': ETHNIC_BODY_HAIR_GUIDES['arab'].productRecommendations,
    'latina': ETHNIC_BODY_HAIR_GUIDES['latina'].productRecommendations,
    'east-asian': ETHNIC_BODY_HAIR_GUIDES['east-asian'].productRecommendations,
    'east-african': ETHNIC_BODY_HAIR_GUIDES['east-african'].productRecommendations,
    'south-african': ETHNIC_BODY_HAIR_GUIDES['south-african'].productRecommendations,
    'black-american': ETHNIC_BODY_HAIR_GUIDES['black-american'].productRecommendations,
  };
  return directMap;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMON MISTAKES AND HOW TO AVOID THEM
// ─────────────────────────────────────────────────────────────────────────────

export const COMMON_HAIR_REMOVAL_MISTAKES = {
  forDarkerSkinTones: [
    {
      mistake: 'Using a multi-blade razor on the bikini area or underarms',
      why: 'Multi-blade razors use a lift-and-cut mechanism that slices afro-textured hair below the skin surface, making PFB and ingrown hairs virtually guaranteed for tightly coiled hair types.',
      fix: 'Switch to a single-blade safety razor and shave with the grain, or switch to sugaring or waxing for these areas entirely.',
      affectedCommunities: ['west-african', 'caribbean', 'black-american', 'east-african', 'south-african'],
    },
    {
      mistake: 'Treating PIH with unregulated hydroquinone creams at high concentrations',
      why: 'High-concentration hydroquinone without dermatologist supervision risks ochronosis — a paradoxical darkening and thickening of the skin that is difficult to reverse — particularly in skin phototypes V and VI.',
      fix: 'Use niacinamide 10%, azelaic acid 10–20%, or alpha-arbutin 2% as evidence-based, safer alternatives. Consult a dermatologist for prescription-strength options if needed.',
      affectedCommunities: ['west-african', 'black-american', 'east-african', 'south-african', 'caribbean'],
    },
    {
      mistake: 'Getting alexandrite laser hair removal on phototype V or VI skin',
      why: 'The 755nm alexandrite wavelength is strongly absorbed by epidermal melanin in darker skin, causing burns, blistering, and permanent pigmentation changes.',
      fix: 'Request the Nd:YAG 1064nm laser specifically. Verify the equipment name and wavelength before booking. If the clinic cannot confirm they have an Nd:YAG, look elsewhere.',
      affectedCommunities: ['west-african', 'black-american', 'east-african', 'south-african', 'caribbean'],
    },
    {
      mistake: 'Waxing or sugaring inflamed or irritated skin',
      why: 'Removing hair from already-inflamed skin significantly worsens the inflammatory response, dramatically increasing PIH risk and sometimes causing skin lifting or bruising.',
      fix: 'Always allow skin to fully recover from active PFB, rash, or irritation before the next hair removal session. Let active bumps resolve completely.',
      affectedCommunities: ['west-african', 'black-american', 'east-african', 'south-african', 'caribbean'],
    },
    {
      mistake: 'Skipping SPF on areas with existing PIH',
      why: 'UV radiation dramatically accelerates the darkening of post-inflammatory hyperpigmentation. An existing dark spot that might fade in 3 months without sun exposure can take 12+ months if regularly exposed to UV without protection.',
      fix: 'Apply SPF 50+ daily to any area with PIH, including underarms, bikini, and inner thighs — areas that may receive reflected UV even without direct sun exposure.',
      affectedCommunities: ['west-african', 'black-american', 'east-african', 'south-african', 'caribbean', 'south-asian', 'latina'],
    },
  ],
  forAllSkinTones: [
    {
      mistake: 'Waxing or sugaring when on retinoids (tretinoin, retinol)',
      why: 'Retinoids accelerate skin cell turnover, making the skin thinner and more fragile. Waxing or sugaring on retinoid-treated skin frequently causes skin lifting — the actual top layer of skin is removed along with the wax, causing open wounds and potential scarring.',
      fix: 'Stop retinoid use at least 5–7 days before any waxing or sugaring appointment. Inform your esthetician of all active skincare ingredients you use.',
      affectedCommunities: ['all'],
    },
    {
      mistake: 'Exfoliating immediately before waxing',
      why: 'Exfoliating sensitizes the skin surface, making waxing more painful and increasing the risk of skin lifting.',
      fix: 'Exfoliate 24–48 hours before waxing, not on the same day. Resume gentle exfoliation 48–72 hours after waxing.',
      affectedCommunities: ['all'],
    },
    {
      mistake: 'Waxing when hair is too short',
      why: 'Hair shorter than approximately 6mm (1/4 inch) cannot be reliably gripped by wax or sugar paste, resulting in incomplete removal, increased skin trauma, and breakage rather than root removal.',
      fix: 'Allow at least 2–3 weeks of growth after shaving before waxing. Ideally 4 weeks for the first waxing session.',
      affectedCommunities: ['all'],
    },
    {
      mistake: 'Picking or squeezing ingrown hairs',
      why: 'Mechanical trauma to ingrown hairs causes additional inflammation, significantly worsening both the immediate lesion and the resulting PIH. Squeezing also introduces bacteria into the already-vulnerable follicle.',
      fix: 'Apply salicylic acid or glycolic acid to the ingrown area. If the hair is visible below the skin surface and near the edge, a sterilized needle can gently lift (not squeeze) it free. For deep, painful ingrowns, see a dermatologist.',
      affectedCommunities: ['all'],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// COMMUNITY COMPARISON TABLE
// ─────────────────────────────────────────────────────────────────────────────

export function getMistakesForCommunity(communityId) {
  const universal = COMMON_HAIR_REMOVAL_MISTAKES.forAllSkinTones;
  const communitySpecific = COMMON_HAIR_REMOVAL_MISTAKES.forDarkerSkinTones.filter(
    (m) => m.affectedCommunities.includes(communityId) || m.affectedCommunities.includes('all')
  );
  return { universal, communitySpecific };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE METADATA
// ─────────────────────────────────────────────────────────────────────────────

