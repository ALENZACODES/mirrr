/**
 * MIRRR Skincare Routines Extended
 * Full AM/PM skincare routines for all 9 ethnic communities
 * Fitzpatrick-aware, concern-based, ingredient-forward
 */

// ─── SKIN CONCERNS BY COMMUNITY ─────────────────────────────────────────────

export const COMMUNITY_SKIN_CONCERNS = {
  'west-african': {
    primary: ['hyperpigmentation', 'pih', 'oiliness', 'acne', 'ashiness'],
    secondary: ['uneven-texture', 'enlarged-pores', 'dark-spots'],
    notes: 'Melanin-rich skin is more prone to PIH (Post-Inflammatory Hyperpigmentation) — any inflammation can leave lasting dark marks. Oil production is often higher in tropical climates of origin. Ashiness is caused by dry skin showing more prominently on darker tones.',
    avoid: ['harsh-scrubs', 'heavy-fragrances', 'hydroquinone-long-term', 'pore-strips'],
    embrace: ['niacinamide', 'vitamin-c', 'azelaic-acid', 'shea-butter', 'kojic-acid', 'centella'],
  },
  'south-asian': {
    primary: ['hyperpigmentation', 'melasma', 'tanning', 'oiliness', 'hair-growth-face'],
    secondary: ['acne', 'dark-circles', 'large-pores'],
    notes: 'South Asian skin often has higher melanin in areas that tan easily (forehead, nose, upper lip, jawline). Melasma triggered by hormones + sun is common. Dark circles have genetic and structural components. Facial hair growth is common and affects skincare approach.',
    avoid: ['lemon-juice-direct', 'baking-soda', 'thick-occlusive-without-treatment-underneath'],
    embrace: ['vitamin-c', 'kojic-acid', 'alpha-arbutin', 'niacinamide', 'spf-daily', 'turmeric-formulated', 'liquorice-root'],
  },
  'arab': {
    primary: ['oiliness', 'acne', 'sensitivity', 'dullness', 'hyperpigmentation'],
    secondary: ['sun-damage', 'dehydration', 'enlarged-pores'],
    notes: 'Arab skin varies greatly — from fair olive Mediterranean to deeper Gulf tones. Oil production is often high. Desert/arid climate can cause dehydration alongside oil. Rose water has been a cultural staple for generations for good reason — it calms and hydrates.',
    avoid: ['alcohol-heavy-toners', 'aggressive-acids-for-beginners', 'stripping-cleansers'],
    embrace: ['rose-water', 'hyaluronic-acid', 'niacinamide', 'centella-asiatica', 'snail-mucin', 'spf-50'],
  },
  'latina': {
    primary: ['hyperpigmentation', 'oiliness', 'acne', 'melasma', 'sensitivity'],
    secondary: ['large-pores', 'uneven-skin-tone', 'dark-circles'],
    notes: 'Latina skin spans a huge range from very fair (European heritage) to deep brown (Indigenous/African heritage). Melasma is extremely common, especially hormonally triggered. Skin tends toward warm olive tones. PIH from acne is a significant concern.',
    avoid: ['fragrance-in-actives', 'over-exfoliation', 'sun-without-spf'],
    embrace: ['vitamin-c', 'azelaic-acid', 'niacinamide', 'retinol-gradual', 'spf-pa++++'],
  },
  'east-asian': {
    primary: ['dullness', 'dehydration', 'pores', 'sensitivity', 'fine-lines-early'],
    secondary: ['hyperpigmentation', 'oiliness', 'acne'],
    notes: 'East Asian skin often has a thinner stratum corneum (outer skin layer) which makes it more reactive to actives. Dehydration is extremely common. Skin tends to show fine lines and surface texture changes earlier than deeper skin tones but ages more slowly overall.',
    avoid: ['high-concentration-actives-too-fast', 'over-cleansing', 'harsh-physical-scrubs'],
    embrace: ['snail-mucin', 'hyaluronic-acid', 'centella', 'niacinamide', 'rice-water', 'green-tea', 'double-cleansing', 'essence-layering'],
  },
  'east-african': {
    primary: ['hyperpigmentation', 'pih', 'dryness', 'sensitivity', 'uneven-tone'],
    secondary: ['acne', 'ashiness', 'dark-spots'],
    notes: 'East African skin has beautiful deep tones but can lean toward dryness in arid climates. PIH is a significant concern. Teff and other regional ingredients are gaining recognition in skincare. Skin often has a beautiful natural glow when properly hydrated.',
    avoid: ['harsh-actives-without-buffering', 'skipping-moisturiser', 'lightening-products-without-SPF'],
    embrace: ['shea-butter', 'vitamin-c', 'niacinamide', 'hyaluronic-acid', 'teff-extract', 'moringa-oil', 'baobab-oil'],
  },
  'caribbean': {
    primary: ['hyperpigmentation', 'oiliness', 'acne', 'humidity-related-breakouts', 'sun-damage'],
    secondary: ['pih', 'large-pores', 'ingrown-hairs'],
    notes: 'Caribbean skin thrives in humidity but can struggle with excess oil and sweat-related breakouts. High UV exposure year-round makes SPF non-negotiable. Aloe vera, sea moss, and coconut oil are traditional Caribbean skincare heroes — backed by science.',
    avoid: ['heavy-oils-in-hot-climate', 'occlusive-without-sunscreen', 'comedogenic-oils'],
    embrace: ['aloe-vera', 'sea-moss', 'spf-50-daily', 'salicylic-acid', 'niacinamide', 'lightweight-gel-moisturiser'],
  },
  'south-african': {
    primary: ['sun-damage', 'hyperpigmentation', 'oiliness', 'sensitivity'],
    secondary: ['rosacea-in-lighter-tones', 'dryness', 'pih'],
    notes: 'South African skin spans the full Fitzpatrick spectrum. UV exposure is intense. Rooibos, marula oil, and baobab are indigenous ingredients with proven skincare benefits. Dark skin tones face PIH; lighter tones face UV sensitivity.',
    avoid: ['skipping-spf-even-indoors', 'harsh-physical-exfoliation', 'over-layering-oils'],
    embrace: ['marula-oil', 'rooibos-extract', 'baobab-oil', 'spf-50-pa++++', 'vitamin-c', 'niacinamide'],
  },
  'black-american': {
    primary: ['hyperpigmentation', 'pih', 'keloid-prone', 'dryness', 'acne'],
    secondary: ['eczema', 'ashiness', 'dark-circles', 'uneven-tone'],
    notes: 'Black American skin has a rich melanin base that is both protective (slower visible aging) and reactive (PIH from any inflammation). Keloid scarring is more common — avoid aggressive treatments near the jawline and chest. Eczema prevalence is higher. Moisture retention is critical.',
    avoid: ['actives-on-broken-skin', 'fragrance-with-eczema', 'aggressive-physical-exfoliation', 'alcohol-astringents'],
    embrace: ['shea-butter', 'vitamin-c', 'niacinamide', 'ceramides', 'centella-asiatica', 'azelaic-acid', 'oat-extract'],
  },
};

// ─── ACTIVE INGREDIENTS GUIDE ────────────────────────────────────────────────

export const ACTIVE_INGREDIENTS = {
  niacinamide: {
    name: 'Niacinamide',
    aka: 'Vitamin B3',
    whatItDoes: ['Reduces hyperpigmentation', 'Minimises pores', 'Controls oil', 'Strengthens skin barrier', 'Reduces redness'],
    concentration: { effective: '2–10%', start: '2–5%', advanced: '10%' },
    bestFor: ['all ethnicities', 'oily skin', 'hyperpigmentation', 'large pores'],
    pairsWell: ['hyaluronic-acid', 'vitamin-c', 'azelaic-acid', 'retinol'],
    avoid: ['high-dose-vitamin-c-same-time (can form niacin — separate by time)'],
    productPick: { budget: 'The Ordinary Niacinamide 10% + Zinc 1% ($8)', mid: 'Paula\'s Choice 10% Niacinamide Booster ($45)', luxury: 'SkinMedica TNS Advanced+ Serum (contains niacinamide, $295)' },
    ethnicNote: 'Top choice for all melanin-rich skin types — works on PIH without irritation',
  },
  vitamin_c: {
    name: 'Vitamin C',
    aka: 'L-Ascorbic Acid, Ascorbyl Glucoside, SAP',
    whatItDoes: ['Brightens skin', 'Fades dark spots', 'Boosts collagen', 'Antioxidant protection', 'Evens skin tone'],
    concentration: { effective: '10–20%', start: '10%', advanced: '20%+' },
    bestFor: ['hyperpigmentation', 'dullness', 'anti-aging', 'dark spots'],
    pairsWell: ['vitamin-e', 'ferulic-acid', 'spf'],
    avoid: ['benzoyl-peroxide (can oxidise)', 'retinol same AM routine (use one AM one PM)'],
    productPick: { budget: 'TruSkin Vitamin C Serum ($22)', mid: 'SkinCeuticals Phloretin CF ($180)', luxury: 'SkinCeuticals C E Ferulic ($220)' },
    ethnicNote: 'Most effective at fading post-inflammatory dark marks on melanin-rich skin. Use AM only + SPF.',
    forms: {
      'L-Ascorbic Acid': 'Most potent but unstable, can irritate. Best for experienced users.',
      'Ascorbyl Glucoside': 'Stable, gentler. Good for beginners. Converts to vitamin C in skin.',
      'Sodium Ascorbyl Phosphate (SAP)': 'Gentle, stable. Great for acne-prone skin.',
      'Tetrahexyldecyl Ascorbate (THD)': 'Oil-soluble, penetrates deeply. Excellent for all skin types.',
    },
  },
  azelaic_acid: {
    name: 'Azelaic Acid',
    aka: 'Nonanedioic Acid',
    whatItDoes: ['Fades PIH', 'Anti-inflammatory', 'Anti-acne', 'Treats rosacea', 'Gentle brightening'],
    concentration: { effective: '10–20%', start: '10%', advanced: '20% (Rx only in some countries)' },
    bestFor: ['sensitive skin', 'rosacea', 'PIH from acne', 'melasma', 'pregnancy-safe brightening'],
    pairsWell: ['niacinamide', 'spf', 'moisturiser'],
    avoid: ['nothing specific — very well tolerated'],
    productPick: { budget: 'The Ordinary Azelaic Acid Suspension 10% ($12)', mid: 'Paula\'s Choice 10% Azelaic Acid Booster ($35)', luxury: 'Skinoren 15% or 20% (prescription in many countries)' },
    ethnicNote: 'Excellent for dark skin tones — fades PIH without risk of paradoxical darkening',
  },
  hyaluronic_acid: {
    name: 'Hyaluronic Acid',
    aka: 'HA, Sodium Hyaluronate',
    whatItDoes: ['Deep hydration', 'Plumping effect', 'Barrier support', 'Reduces fine lines when skin is hydrated'],
    concentration: { effective: '0.1–2%', start: 'Any', advanced: 'Multi-molecular weight preferred' },
    bestFor: ['dehydration', 'all skin types', 'dry skin', 'first-time actives users'],
    pairsWell: ['literally everything', 'apply to damp skin for best results'],
    avoid: ['dry climates without a moisturiser on top (can pull moisture from skin)'],
    productPick: { budget: 'L\'Oréal Paris Pure Hyaluronic Acid 1.5% Serum ($25)', mid: 'Neutrogena Hydro Boost Serum ($28)', luxury: 'Tatcha The Dewy Skin Cream ($89)' },
    ethnicNote: 'Foundation of K-beauty routine. Essential base for all ethnicity skin types before actives.',
  },
  retinol: {
    name: 'Retinol',
    aka: 'Vitamin A, Retinoids, Tretinoin, Adapalene',
    whatItDoes: ['Anti-aging', 'Acne treatment', 'Increases cell turnover', 'Fades dark spots (slowly)', 'Smooths texture'],
    concentration: { effective: '0.025–1%', start: '0.025–0.1%', advanced: 'Tretinoin 0.025–0.1% (Rx)' },
    bestFor: ['aging concerns', 'acne', 'rough texture', 'fine lines'],
    pairsWell: ['moisturiser', 'ceramides', 'spf (critical)', 'peptides'],
    avoid: ['vitamin-c-same-session', 'aha-bha-same-night (beginners)', 'eyes and lips direct', 'pregnancy'],
    productPick: { budget: 'Adapalene 0.1% Gel Differin ($30, OTC in Canada/US)', mid: 'La Roche-Posay Effaclar Adapalene Gel 0.1% ($40)', luxury: 'Tretinoin 0.05% (Rx — worth the effort to get it)' },
    ethnicNote: 'Critical for darker skin tones: START SLOW (0.025–0.05%), buffer with moisturiser, avoid overuse. PIH from retinol irritation is common if rushed.',
    bufferingTechnique: 'Apply moisturiser first, wait 10 min, apply retinol. This "buffers" the retinol and reduces irritation for beginners.',
  },
  aha_bha: {
    name: 'AHA/BHA Exfoliants',
    aka: 'AHA: Glycolic, Lactic, Mandelic; BHA: Salicylic Acid',
    whatItDoes: {
      AHA: ['Exfoliates surface', 'Brightens', 'Reduces dark spots', 'Smooths texture'],
      BHA: ['Unclogs pores', 'Reduces blackheads', 'Anti-acne', 'Controls oil'],
    },
    concentration: { AHA: '5–10% for beginner, up to 30% for advanced peels', BHA: '0.5–2% daily, up to 30% for peels' },
    bestFor: {
      AHA: ['dull skin', 'dark spots', 'rough texture', 'anti-aging'],
      BHA: ['oily skin', 'acne', 'blackheads', 'clogged pores'],
    },
    ethnicNote: 'For melanin-rich skin: mandelic acid (AHA) is gentlest for beginners — larger molecule, slower absorption, less irritation. Salicylic acid is safe and excellent for multicultural acne-prone skin.',
    productPick: {
      AHA_budget: 'The Ordinary AHA 30% + BHA 2% Peeling Solution ($12 — once weekly max)',
      AHA_mid: 'Paula\'s Choice 8% AHA Gel Exfoliant ($32)',
      BHA_budget: 'The Ordinary Salicylic Acid 2% Masque ($12)',
      BHA_mid: 'Paula\'s Choice 2% BHA Liquid Exfoliant ($35 — THE gold standard)',
    },
  },
  centella: {
    name: 'Centella Asiatica',
    aka: 'Cica, Tiger Grass, Gotu Kola',
    whatItDoes: ['Calms inflammation', 'Heals skin barrier', 'Reduces redness', 'Supports collagen', 'Soothes irritation'],
    bestFor: ['sensitive skin', 'post-treatment recovery', 'eczema', 'rosacea', 'acne-healing'],
    pairsWell: ['everything — centella is a peacemaker ingredient'],
    productPick: { budget: 'Purito Centella Green Level Unscented Serum ($22)', mid: 'Dr. Jart+ Cicapair Tiger Grass Serum ($52)', luxury: 'La Mer Concentrate ($195)' },
    ethnicNote: 'A STAPLE for all melanin-rich skin types. K-beauty popularised it but it\'s been used in Ayurveda (as Gotu Kola) and African traditional medicine for centuries.',
  },
  spf: {
    name: 'Sunscreen',
    aka: 'SPF, UV Protection, Sun Protection Factor',
    whatItDoes: ['Prevents UV damage', 'Prevents PIH worsening', 'Prevents melasma', 'Anti-aging', 'Cancer prevention'],
    recommendations: {
      minimum: 'SPF 30 daily, reapply every 2 hours if outdoor',
      preferred: 'SPF 50 PA++++ for melanin-rich skin, SPF 50+ for fair skin',
      fitzpatrick_V_VI: 'SPF still CRITICAL — melanin protects (SPF ~13 equivalent) but not enough alone. Dark spots worsen dramatically without SPF.',
    },
    productPick: {
      budget_invisible: 'Black Girl Sunscreen SPF 30 ($20 — zero white cast, made for melanin skin)',
      mid_invisible: 'Beauty of Joseon Relief Sun Rice + Probiotics SPF50 PA++++ ($18 — K-beauty staple, no white cast)',
      luxury: 'Supergoop Unseen Sunscreen SPF 40 ($48 — invisible, works under makeup)',
      tinted: 'Laura Mercier Tinted Moisturiser SPF 30 ($60 — light coverage + protection)',
    },
    ethnicNote: 'White cast is a real barrier for deep skin tones — seek mineral SPF labelled "tinted" or "invisible" or use chemical sunscreens (no white cast by nature). SPF is NON-NEGOTIABLE even for Fitzpatrick V-VI.',
  },
};

// ─── FULL AM/PM ROUTINES ─────────────────────────────────────────────────────

export const COMMUNITY_ROUTINES = {
  'west-african': {
    communityId: 'west-african',
    routineName: 'West African Melanin Protocol',
    philosophy: 'Melanin is beautiful and powerful — protect it, even its tone, and let it glow. The goal is not lightening but PIH prevention and evenness.',
    amRoutine: {
      label: 'Morning (AM) Routine',
      steps: [
        {
          order: 1,
          stepName: 'Gentle Cleanser',
          why: 'Remove overnight product and sweat without stripping natural oils',
          product: 'CeraVe Hydrating Cleanser ($14) or SheaMoisture African Black Soap Facial Cleanser ($13)',
          tip: 'Splash warm (not hot) water first. Massage cleanser in circular motions for 60 seconds. Rinse with cool water — cold water closes pores.',
          duration: '90 seconds',
        },
        {
          order: 2,
          stepName: 'Vitamin C Serum',
          why: 'Brighten existing dark spots and protect against new PIH forming from today\'s UV exposure',
          product: 'TruSkin Vitamin C Serum ($22) — Budget | SkinCeuticals C E Ferulic ($220) — Luxury',
          tip: 'Apply to DAMP skin — 3 drops, press in (don\'t rub). Wait 60 seconds before next step. Vitamin C oxidises in air — store in a dark bottle.',
          duration: '60 seconds + 1 min wait',
          fitzpatrickNote: 'For V-VI: Sodium Ascorbyl Phosphate (SAP) form is gentlest. L-Ascorbic Acid at 20% can cause tingling — start low.',
        },
        {
          order: 3,
          stepName: 'Niacinamide Serum',
          why: 'Control excess oil production and fade PIH while strengthening barrier',
          product: 'The Ordinary Niacinamide 10% + Zinc 1% ($8)',
          tip: 'Can layer over Vitamin C — wait 30 seconds between serums. Niacinamide is your workhorse — use it every day without fail.',
          duration: '30 seconds + 1 min wait',
        },
        {
          order: 4,
          stepName: 'Lightweight Gel Moisturiser',
          why: 'Hydrate without clogging pores. Thick creams can cause breakouts on oily West African skin types.',
          product: 'Neutrogena Hydro Boost Water Gel ($28) or Belif The True Cream Aqua Bomb ($45)',
          tip: 'Apply to still-slightly-damp skin for maximum absorption. A pea-size amount is enough.',
          duration: '30 seconds',
        },
        {
          order: 5,
          stepName: 'SPF 50 PA++++ (THE most important step)',
          why: 'Every dark spot on your face will stay dark without SPF. SPF does not lighten spots — it stops them worsening.',
          product: 'Black Girl Sunscreen SPF 30 ($20) or Fenty Beauty Pro Filt\'r Hydrating Longwear Foundation SPF15 (as makeup base)',
          tip: 'Apply SPF as the LAST skincare step, wait 10 min before makeup. Reapply every 2 hours if outdoors — use a setting-spray SPF for touch-ups over makeup.',
          duration: '30 seconds',
          critical: true,
        },
      ],
      totalTime: '8–10 minutes',
    },
    pmRoutine: {
      label: 'Evening (PM) Routine',
      steps: [
        {
          order: 1,
          stepName: 'Double Cleanse',
          why: 'Remove SPF, makeup, pollution, and sweat from the day. One cleanse is never enough for SPF.',
          step1: { product: 'First Cleanse — DHC Deep Cleansing Oil ($28) or Farmacy Green Clean Balm ($36)', tip: 'Massage oil onto DRY face for 60 seconds. Emulsify with water, rinse.' },
          step2: { product: 'Second Cleanse — SheaMoisture African Black Soap Facial Cleanser ($13)', tip: 'Lather, massage 60 seconds, rinse with cool water.' },
          duration: '3 minutes total',
        },
        {
          order: 2,
          stepName: 'Azelaic Acid (Mon/Wed/Fri)',
          why: 'Fade PIH without the risk of retinol-induced irritation. Gentlest PIH treatment available.',
          product: 'The Ordinary Azelaic Acid Suspension 10% ($12)',
          tip: 'Alternate nights with retinol or use on nights you skip retinol. Apply a thin layer, wait to absorb.',
          duration: '30 seconds',
          frequency: '3x per week',
        },
        {
          order: 3,
          stepName: 'Retinol (Tue/Thu — after 4 weeks building tolerance)',
          why: 'Long-term PIH fading, skin renewal, prevents future acne-causing clogs',
          product: 'Start: The Ordinary Retinol 0.2% in Squalane ($12) | Advance: Differin 0.1% Adapalene ($30)',
          tip: 'BUFFER: apply moisturiser first, wait 10 min, then retinol. Start once a week. Work up to every other night over 4–6 weeks.',
          duration: '30 seconds + wait',
          frequency: '1-3x per week based on tolerance',
          warning: 'Do NOT use on the same night as your AHA/BHA exfoliant. Alternate nights.',
        },
        {
          order: 4,
          stepName: 'Rich Shea-Based Moisturiser',
          why: 'PM is recovery time — richer moisturiser repairs and seals active ingredients in',
          product: 'SheaMoisture 100% Pure Shea Butter ($12) or CeraVe Moisturising Cream ($18)',
          tip: 'For very dry patches: apply shea butter pure to those spots only, lighter cream to the rest of face.',
          duration: '30 seconds',
        },
        {
          order: 5,
          stepName: 'Eye Cream (optional but recommended)',
          why: 'Dark circles have both pigmentation and structural components — targeted eye treatments help with the pigmentation aspect',
          product: 'Kiehl\'s Powerful-Strength Line-Reducing Eye-Brightening Concentrate ($45) — Vitamin C for dark circles',
          tip: 'Dab with ring finger (lightest pressure) around orbital bone. Never pull eye skin.',
          duration: '20 seconds',
        },
      ],
      totalTime: '10–15 minutes',
    },
    weeklyExtras: [
      { name: 'Clay Mask (oily zones)', frequency: '1x/week', product: 'Aztec Secret Indian Healing Clay ($14) mixed with apple cider vinegar (diluted 1:1 with water)', tip: 'Apply to T-zone only (oily areas). Leave 10–15 min. DO NOT LET IT CRACK — remove when almost dry.' },
      { name: 'Chemical Exfoliant', frequency: '1x/week', product: 'The Ordinary AHA 30% + BHA 2% Peeling Solution ($12)', tip: 'Leave on 10 min MAX. Never more than once a week. Always follow with moisturiser.' },
      { name: 'Hydrating Sheet Mask', frequency: '1–2x/week', product: 'COSRX Advanced Snail All in One Sheet Mask ($3–4 each)', tip: 'Sunday reset ritual — great for active skin recovery' },
    ],
    keyHeroes: ['vitamin-c', 'niacinamide', 'azelaic-acid', 'spf-50', 'shea-butter'],
    monthlyGoal: 'Visibly faded PIH within 8–12 weeks of consistent routine',
  },

  'south-asian': {
    communityId: 'south-asian',
    routineName: 'South Asian Glow Protocol',
    philosophy: 'Ayurvedic wisdom meets modern actives. Honour the skin you have while addressing melasma and uneven tone with science-backed ingredients.',
    amRoutine: {
      label: 'Morning (AM) Routine',
      steps: [
        {
          order: 1,
          stepName: 'Micellar Water (no-wash mornings) or Gentle Cleanser',
          why: 'Preserve natural moisture — South Asian skin can be combination, so a second full cleanse every morning may over-strip',
          product: 'Bioderma Sensibio Micellar Water ($20) or Cetaphil Gentle Skin Cleanser ($16)',
          tip: 'If you sweated overnight, do a light cleanse. Otherwise, micellar water is enough.',
          duration: '60 seconds',
        },
        {
          order: 2,
          stepName: 'Vitamin C Serum — the anti-melasma step',
          why: 'Melasma worsens significantly with UV + no antioxidant protection. Vitamin C + SPF is the one-two punch.',
          product: 'Maelove Glow Maker ($30 — best budget C serum) | SkinCeuticals C E Ferulic ($220 — gold standard)',
          tip: 'Apply to damp skin, let absorb 60 seconds. For hyperpigmented upper lip and forehead: use a cotton swab for precise application to those spots.',
          duration: '60 seconds + wait',
        },
        {
          order: 3,
          stepName: 'Alpha Arbutin or Kojic Acid Serum (targeted dark spots)',
          why: 'Tyrosinase inhibitors — block the enzyme that produces excess pigment in dark spots and melasma',
          product: 'The Ordinary Alpha Arbutin 2% + HA ($12) — Budget | Glow Recipe Banana Soufflé Moisture Cream ($46 — contains kojic)',
          tip: 'Apply specifically to darker zones (forehead, upper lip, cheeks if melasma present) before your full moisturiser',
          duration: '30 seconds',
        },
        {
          order: 4,
          stepName: 'SPF 50 PA++++ — THE critical step for melasma',
          why: 'UV exposure is THE number one trigger for melasma. All your brightening serums are negated in 20 minutes of unprotected sun.',
          product: 'Altruist Dermatologist Sunscreen SPF50 ($4 — YES really, this is excellent) | Beauty of Joseon Relief Sun SPF50 PA++++ ($18)',
          tip: 'Reapply EVERY 2 HOURS outdoors. Over makeup: use Supergoop Glow Screen SPF 40 Mist or a tinted setting-spray SPF.',
          critical: true,
          duration: '30 seconds',
        },
      ],
      totalTime: '6–8 minutes',
    },
    pmRoutine: {
      label: 'Evening (PM) Routine',
      steps: [
        {
          order: 1,
          stepName: 'Oil Cleanse + Gentle Second Cleanse',
          why: 'Remove SPF (non-negotiable) and any makeup/sunscreen that has built up',
          step1: 'The Face Shop Rice Water Bright Cleansing Oil ($22) or any gentle cleansing oil',
          step2: 'Cetaphil Gentle Skin Cleanser ($16)',
          duration: '3 minutes',
        },
        {
          order: 2,
          stepName: 'Toner — Ayurvedic or Hydrating',
          why: 'Restore skin\'s pH after cleansing, add first layer of hydration',
          product: 'Forest Essentials Nargis Toner ($28 — turmeric/neem) or COSRX AHA/BHA Clarifying Treatment Toner ($24)',
          tip: 'Pat gently into skin — do not rub or wipe',
          duration: '30 seconds',
        },
        {
          order: 3,
          stepName: 'Niacinamide — pore and oil control',
          product: 'The Ordinary Niacinamide 10% + Zinc 1% ($8)',
          duration: '30 seconds',
        },
        {
          order: 4,
          stepName: 'Tretinoin or Retinol (3-5x/week)',
          why: 'Most effective clinical treatment for melasma when combined with SPF and azelaic acid',
          product: 'Tretinoin 0.025% (seek from dermatologist — worth it for South Asian melasma) | Differin Adapalene 0.1% ($30 OTC)',
          tip: 'BUFFER technique for beginners. For melasma: use on entire face, not just spots — even skin you can\'t see uneven renewal on.',
          duration: '30 seconds',
        },
        {
          order: 5,
          stepName: 'Rich Moisturiser — Ayurvedic ingredients if possible',
          product: 'Kama Ayurveda Saffron & Sandalwood Cream ($35) — traditional | CeraVe PM Facial Moisturising Lotion ($18) — clinical',
          tip: 'The Ayurvedic options actually perform — saffron, sandalwood, and ashwagandha are proven anti-inflammatory and brightening',
          duration: '30 seconds',
        },
      ],
      totalTime: '10–12 minutes',
    },
    weeklyExtras: [
      { name: 'Ubtan Mask', frequency: '1–2x/week', diy: 'Mix 1 tsp turmeric + 1 tbsp gram flour (besan) + enough plain yoghurt to make a paste. Apply 10–15 min. Ancient Indian brightening tradition with modern clinical backing.', product: 'OR: Forest Essentials Saundarya Radiance Cream Masque ($42)' },
      { name: 'Champi Scalp Oil Massage', frequency: '1x/week', note: 'For scalp and hair health — see hair care module', product: 'Kama Ayurveda Bringadi Intensive Hair Treatment ($32)' },
    ],
    keyHeroes: ['vitamin-c', 'niacinamide', 'alpha-arbutin', 'spf-50-pa++++', 'tretinoin', 'turmeric'],
    monthlyGoal: 'Melasma and sun-triggered dark spots visibly reduced in 12–16 weeks with consistent SPF + actives',
  },

  'east-asian': {
    communityId: 'east-asian',
    routineName: 'K-Beauty Glass Skin Protocol',
    philosophy: 'Layers of hydration build the glass-skin effect. Treat skin like cashmere — gently. Actives at lower concentrations applied consistently outperform high-strength actives applied inconsistently.',
    amRoutine: {
      label: 'Morning (AM) Routine — 7-Skin Method',
      note: '7-Skin method: apply toner in 7 thin layers, pressing each one in before the next. Builds extreme hydration.',
      steps: [
        { order: 1, stepName: 'Low-pH Gentle Cleanser', product: 'COSRX Low pH Good Morning Gel Cleanser ($14)', tip: 'Use lukewarm water. Gentle foam — no scrubbing.', duration: '60 seconds' },
        { order: 2, stepName: 'Essence / Toner (layers 1-3)', product: 'Missha Time Revolution First Treatment Essence ($28) or COSRX Advanced Snail 96 Mucin Power Essence ($25)', tip: 'Press 3 layers into skin, one at a time. Each layer should be almost absorbed before the next.', duration: '3 minutes' },
        { order: 3, stepName: 'Serum / Ampoule', product: 'By Wishtrend Pure Vitamin C 15% with Ferulic Acid Serum ($39) or Purito Centella Green Level Buffet Serum ($23)', duration: '30 seconds + wait' },
        { order: 4, stepName: 'Eye Cream', product: 'Mizon Snail Repair Eye Cream ($15) or Innisfree Brightening Eye Cream ($25)', tip: 'Dab gently with ring finger', duration: '20 seconds' },
        { order: 5, stepName: 'Lightweight Moisturiser', product: 'Laneige Water Bank Blue HA Cream ($45) or Belif True Cream Aqua Bomb ($45)', duration: '30 seconds' },
        { order: 6, stepName: 'SPF 50 PA++++', product: 'Beauty of Joseon Relief Sun SPF50 PA++++ ($18) — the K-beauty standard', tip: 'Let it sit 10 min before makeup', critical: true, duration: '30 seconds' },
      ],
      totalTime: '12–15 minutes',
    },
    pmRoutine: {
      label: 'Evening (PM) Routine',
      steps: [
        { order: 1, stepName: 'Oil/Balm Cleanse', product: 'Banila Co Clean It Zero Cleansing Balm ($22)', tip: 'Massage on dry face, add water, emulsify, rinse', duration: '90 seconds' },
        { order: 2, stepName: 'Foam Second Cleanse', product: 'Innisfree Jeju Volcanic Pore Cleansing Foam ($18)', duration: '60 seconds' },
        { order: 3, stepName: 'Exfoliant (2–3x/week only)', product: 'Cosrx Salicylic Acid Daily Gentle Cleanser ($16) OR NEOGEN Bio-Peel Gauze Peeling Wine Pads ($35)', tip: 'East Asian skin has thinner outer layer — do NOT exfoliate more than 3x/week. Less is more.', frequency: '2-3x/week' },
        { order: 4, stepName: 'Snail Mucin Essence', product: 'COSRX Advanced Snail 96 Mucin Power Essence ($25)', tip: 'The K-beauty hero ingredient — heals, hydrates, plumps', duration: '30 seconds' },
        { order: 5, stepName: 'Niacinamide Serum', product: 'Some by Mi Niacinamide 30 Miracle Serum ($25)', duration: '30 seconds' },
        { order: 6, stepName: 'Rich Night Cream or Sleeping Mask', product: 'Laneige Water Sleeping Mask ($30) or Belif Moisturising Eye Bomb ($35)', tip: 'Apply as last step and leave overnight — this is the K-beauty "glass skin while you sleep" step', duration: '30 seconds' },
      ],
      totalTime: '10–15 minutes',
    },
    weeklyExtras: [
      { name: 'Sheet Mask Sunday', frequency: '1–2x/week', product: 'JMsolution Marine Luminous Pearl Deep Moisture Mask ($3 each) or Mediheal DNA Pro Sheet Mask ($4 each)', tip: 'K-beauty sheet mask culture: leave 20 min, pat in remaining essence after removing' },
      { name: 'Rice Water Rinse', frequency: '2x/week', diy: 'Rinse uncooked rice, save the cloudy water. Apply to face after cleansing, leave 10 min, rinse. Traditional Korean and Japanese brightening ritual.', product: 'OR: Sulwhasoo Snowise Brightening Serum ($125) — premium rice water product' },
    ],
    keyHeroes: ['snail-mucin', 'hyaluronic-acid', 'niacinamide', 'centella', 'spf-50-pa++++', 'rice-water'],
    monthlyGoal: 'Glassy, dewy, even-toned skin within 6–8 weeks of consistent layering routine',
  },
};

// ─── ROUTINE API FUNCTIONS ───────────────────────────────────────────────────

export function getRoutineForCommunity(communityId) {
  return COMMUNITY_ROUTINES[communityId] || null;
}

export function getAllRoutines() {
  return Object.values(COMMUNITY_ROUTINES);
}

export function getActiveIngredient(ingredientKey) {
  const key = ingredientKey.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  return ACTIVE_INGREDIENTS[key] || null;
}

export function getAllActiveIngredients() {
  return Object.values(ACTIVE_INGREDIENTS);
}

export function getSkinConcernsForCommunity(communityId) {
  return COMMUNITY_SKIN_CONCERNS[communityId] || null;
}

export function getAllSkinConcerns() {
  return COMMUNITY_SKIN_CONCERNS;
}

export function getIngredientsByBenefit(benefit) {
  const b = benefit.toLowerCase();
  return Object.entries(ACTIVE_INGREDIENTS)
    .filter(([, ing]) => {
      const does = Array.isArray(ing.whatItDoes)
        ? ing.whatItDoes.join(' ').toLowerCase()
        : Object.values(ing.whatItDoes || {}).flat().join(' ').toLowerCase();
      return does.includes(b);
    })
    .map(([key, ing]) => ({ key, ...ing }));
}

export function getRoutineStep(communityId, timeOfDay, stepOrder) {
  const routine = COMMUNITY_ROUTINES[communityId];
  if (!routine) return null;
  const r = timeOfDay === 'am' ? routine.amRoutine : routine.pmRoutine;
  return r?.steps?.find(s => s.order === stepOrder) || null;
}

export function buildRoutineSummary(communityId) {
  const routine = COMMUNITY_ROUTINES[communityId];
  const concerns = COMMUNITY_SKIN_CONCERNS[communityId];
  if (!routine || !concerns) return null;

  return {
    community: communityId,
    routineName: routine.routineName,
    philosophy: routine.philosophy,
    topConcerns: concerns.primary.slice(0, 3),
    heroIngredients: routine.keyHeroes,
    amSteps: routine.amRoutine?.steps?.length || 0,
    pmSteps: routine.pmRoutine?.steps?.length || 0,
    amTime: routine.amRoutine?.totalTime,
    pmTime: routine.pmRoutine?.totalTime,
    goal: routine.monthlyGoal,
    avoid: concerns.avoid,
    embrace: concerns.embrace,
  };
}

export const SKINCARE_ROUTINES_STATS = {
  totalCommunities: Object.keys(COMMUNITY_ROUTINES).length,
  totalActiveIngredients: Object.keys(ACTIVE_INGREDIENTS).length,
  communitiesWithConcerns: Object.keys(COMMUNITY_SKIN_CONCERNS).length,
  totalModules: ['am-routine', 'pm-routine', 'weekly-extras', 'skin-concerns', 'active-ingredients'],
};
