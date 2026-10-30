/**
 * MIRRR Bath & Body Rituals Guide
 * Bath salts, body oils, shower rituals, body scrubs,
 * steam treatments, and multicultural bathing traditions
 */

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────

export const BATH_BODY_OVERVIEW = {
  significance: 'Bathing and body care rituals are among the oldest beauty practices in human history. From the Roman thermae to the Japanese ofuro, from the hammam of North Africa to the jimjilbang of Korea, ritual bathing has served simultaneously as hygiene, social bonding, spiritual practice, and beauty treatment.',
  modern_context: 'Contemporary bath and body rituals blend ancient traditions with modern skincare science. The bathroom has become a self-care sanctuary.',
  body_vs_face: 'The body has tougher, thicker skin than the face but the same fundamental needs: exfoliation, hydration, and protection. Body skin is often neglected in favour of face skincare — yet the body comprises 95%+ of the skin\'s total surface area.',
};

// ─── BATH TYPES ───────────────────────────────────────────────────────────────

export const BATH_TYPES = {
  plain_warm: {
    name: 'Plain Warm Bath',
    temperature: '37-40°C (98-104°F) — slightly above body temperature',
    benefit: 'Relaxation, muscle tension relief, cleansing.',
    caution: 'Water that is too hot strips the skin\'s natural lipid barrier, leading to dryness, and worsens eczema and rosacea. Very hot baths are particularly damaging to dry or eczema-prone skin.',
    ideal_time: '15-20 minutes maximum. Beyond this, the skin begins to "prune" (overhydration of the outer skin layers) and barrier function is temporarily disrupted.',
  },
  epsom_salt: {
    name: 'Epsom Salt Bath',
    what: 'Epsom salt is magnesium sulfate crystals, not sodium chloride (table salt). Dissolved in bathwater.',
    claimed_benefits: 'Muscle relaxation, soreness relief, stress reduction, magnesium absorption.',
    science: 'Evidence for transdermal magnesium absorption is limited — the skin is designed to keep things out. However, the warm water itself provides muscle relaxation, and many people experience genuine benefit from Epsom salt baths, whether placebo-driven or not.',
    how_to_use: '2 cups (500g) in a warm bath. Soak 15-20 minutes.',
    caution: 'Do not use Epsom salts in a bath with open wounds, cuts, or broken skin — excessive concentration of mineral ions can be irritating.',
  },
  oatmeal: {
    name: 'Colloidal Oatmeal Bath',
    what: 'Finely milled oat powder (colloidal oatmeal) dissolved in bathwater.',
    science: 'Colloidal oatmeal has significant scientific backing as a skin-soothing ingredient. Contains avenanthramides (powerful anti-inflammatory compounds) and beta-glucan (moisturising polysaccharide). FDA-approved as a skin protectant.',
    benefit: 'Relieves itch and irritation from eczema, psoriasis, sunburn, hives, chicken pox. Soothes sensitised skin.',
    how_to_use: 'Blend regular oats in a blender to a very fine powder (or buy colloidal oatmeal). 1-2 cups in warm bathwater. Soak 15-20 minutes.',
    traditional: 'Oatmeal baths are a traditional remedy in many cultures — used for centuries before the modern understanding of avenanthramides.',
  },
  milk: {
    name: 'Milk Bath',
    what: 'Adding milk (liquid milk, powdered milk, or buttermilk) to bathwater.',
    science: 'Milk contains lactic acid (an AHA), which gently exfoliates the skin surface. Milk fats and proteins moisturise. The lactic acid concentration in a milk bath is low — gentle exfoliation, not clinical.',
    benefit: 'Skin softening, mild exfoliation, moisturisation. Historically used by Cleopatra (donkey milk) and reported in beauty traditions globally.',
    how_to_use: '2-4 cups of whole milk (highest fat content) or buttermilk. Optionally add honey (humectant and antimicrobial) and a few drops of lavender essential oil.',
    modern: 'Milk bath soak powders and bath soaks with milk proteins are widely available.',
  },
  detox: {
    name: 'Detox Bath',
    what: 'A bath with Epsom salts, baking soda (sodium bicarbonate), and sometimes apple cider vinegar. Often marketed as "detoxifying."',
    science: 'The term "detox bath" is a misnomer — the kidneys and liver perform detoxification; a bath cannot "detox" the body. However, baking soda is mildly alkaline and can soothe itchy skin (works in the opposite direction to acidic skin conditions). Apple cider vinegar restores slightly acidic pH.',
    benefit: 'The warm water provides relaxation and muscle relief. Baking soda may soothe itchy, irritated skin.',
    recipe: '1 cup Epsom salt + 1 cup baking soda + warm water (not hot — baking soda increases water alkalinity which can be slightly drying).',
  },
  essential_oil: {
    name: 'Aromatherapy / Essential Oil Bath',
    what: 'Adding essential oils to bathwater for aromatherapy benefits and skin fragrance.',
    caution: 'Essential oils are NOT water-soluble — they float on top of the water and can cause concentrated skin irritation or even chemical burns if undiluted oil touches skin. ALWAYS dilute essential oils in a carrier (whole milk, Epsom salts, body wash, or a specific bath dispersant) BEFORE adding to the bath.',
    dilution: '5-10 drops of essential oil to a tablespoon of carrier (milk, cream, honey, or a neutral oil).',
    popular_oils: {
      lavender: 'Lavender: relaxation, sleep-inducing, mild antibacterial.',
      eucalyptus: 'Eucalyptus: respiratory opening, stimulating.',
      rose: 'Rose: mood-lifting, skin-softening. Most luxurious and most expensive.',
      bergamot: 'Bergamot: uplifting citrus. Note: PHOTOTOXIC — do not use on skin going into UV exposure.',
      chamomile: 'Chamomile: soothing, anti-inflammatory.',
    },
  },
};

// ─── BODY SCRUBS ──────────────────────────────────────────────────────────────

export const BODY_SCRUB_GUIDE = {
  overview: 'Body scrubs exfoliate dead skin cells from the skin surface, leaving skin smoother, brighter, and more receptive to moisturiser. The two categories are physical (mechanical) scrubs and chemical scrubs.',
  physical_scrubs: {
    name: 'Physical Scrubs',
    types: {
      sugar: 'Sugar scrub: fine crystals that dissolve in water. Gentle. Glycolic acid in sugar provides mild chemical exfoliation alongside physical. Most popular type.',
      salt: 'Salt scrub: typically coarser than sugar. More intense exfoliation. Contains minerals. Best for very rough areas (feet, elbows). Too harsh for sensitive skin or face.',
      coffee: 'Coffee scrub: ground coffee beans + oil. Very popular for cellulite (temporary blood circulation stimulation). Has antioxidants from coffee. The "Brazilian wax" of body scrubs — iconic. Caffeic acid in coffee has mild antioxidant benefit.',
      konjac: 'Konjac sponge: a sponge made from konjac plant. Very gentle physical exfoliation. Good for sensitive body skin.',
      rice_bran: 'Rice bran scrub: traditional in Japan and Korea. Very fine exfoliation.',
      african_net: 'African net sponge (mesh scrub): traditional West African body exfoliation tool. Creates significant physical exfoliation. More intense than Western scrubs.',
    },
    how_to_use: 'Apply to damp skin in circular or upward-sweeping motions. Focus on rough areas (knees, elbows, ankles, heels). Rinse thoroughly. Moisturise immediately on damp skin after.',
    frequency: '1-3x per week for body. Less for sensitive skin or areas with active irritation.',
    caution: 'Do not scrub sunburned, broken, or actively irritated skin. Do not scrub in-shower immediately before self-tanning (wait 24 hours). Very coarse scrubs can cause micro-tears in skin.',
  },
  chemical_scrubs: {
    name: 'Chemical Body Exfoliants',
    types: {
      aha_body_lotion: 'AHA body lotion (glycolic, lactic acid): the most effective everyday body exfoliant for smoothing and brightening. Lactic acid is particularly moisturising. Alpha Skin Care Renewal Body Lotion (12% glycolic) is a popular affordable choice.',
      pha: 'PHA (polyhydroxy acid): gentler than AHA, suitable for sensitive or eczema-prone body skin.',
      bha: 'BHA (salicylic acid) body wash: particularly useful for bacne (body acne), keratosis pilaris (KP), and folliculitis.',
      urea: 'Urea cream 10-40%: for extremely dry, rough, or callused body skin. Urea is simultaneously a humectant (draws water) and a keratolytic (breaks down dead skin protein). Particularly effective for keratosis pilaris and rough heels.',
    },
  },
  keratosis_pilaris: {
    name: 'Keratosis Pilaris (KP)',
    
    treatment: 'Chemical exfoliation is more effective than physical. AHA + urea combination body lotion applied daily. BHA can help clear follicles. Hydration alone is not sufficient — you must exfoliate the keratin buildup.',
    realistic_expectations: 'KP can be significantly improved but not "cured" — it is a genetic condition. Consistent chemical exfoliation over months reduces the bumpy texture and redness.',
    ethnic_note: 'KP appears more visually prominent on lighter skin tones. On Fitzpatrick IV-VI, KP can trigger PIH (dark spots at each follicle bump) — making the condition appear more as dark spotting than rough texture.',
  },
};

// ─── BODY OILS ────────────────────────────────────────────────────────────────

export const BODY_OIL_GUIDE = {
  overview: 'Body oils are one of the most effective and pleasurable forms of body moisturisation. Applied to damp skin immediately after bathing, they seal in moisture far more effectively than dry-skin application.',
  how_to_apply: {
    timing: 'Apply within 3-5 minutes of leaving the bath or shower while skin is still slightly damp. The water on the skin surface is sealed in by the oil — this is the principle of "sealing" in Black and African hair/body care traditions.',
    method: 'Pour a small amount into palms, warm between hands, then sweep over body in long strokes from bottom to top (toward the heart — supports circulation).',
    amount: 'Less than you think — a teaspoon is sufficient for legs; 2 teaspoons for the whole body.',
  },
  types: {
    dry_oils: {
      name: 'Dry Oils',
      what: 'Oils that absorb quickly without leaving a sticky or greasy residue. Composed primarily of linoleic acid (lighter unsaturated fatty acid).',
      examples: ['Squalane (from olive or sugarcane)', 'Rosehip oil', 'Jojoba (technically a liquid wax)', 'Sea buckthorn (deep orange — use with caution; can stain)', 'Marula oil'],
      best_for: 'Everyday use; those who want moisturisation without feeling greasy; those who dress quickly after showering.',
    },
    rich_oils: {
      name: 'Rich / Nourishing Oils',
      what: 'Heavier oils that absorb more slowly and provide deep nourishment. Higher in oleic acid (heavier saturated fatty acid).',
      examples: ['Shea butter oil', 'Castor oil (very thick — usually mixed with other oils)', 'Avocado oil', 'Olive oil'],
      best_for: 'Very dry skin, overnight treatments, those with time to let the oil absorb.',
    },
    shimmer_oils: {
      name: 'Shimmer / Glow Oils',
      what: 'Body oils with fine shimmer particles for a luminous finish. Can be dry or rich formulas.',
      examples: ['Fenty Beauty Body Lava', 'NARS Monoi Glow', 'Charlotte Tilbury Supermodel Body Spray'],
      best_for: 'Events, evenings, photography. Deep skin tones with warm gold shimmer oils look extraordinary.',
    },
    ethnic_traditional: {
      name: 'Traditional Multicultural Body Oils',
      examples: {
        african: 'West African shea butter (traditionally extracted in villages by women — seed cracked, roasted, ground, boiled, hand-churned)',
        south_african: 'Marula oil (Sclerocarya birrea seed oil — indigenous to Sub-Saharan Africa)',
        indian: 'Coconut oil (Kerala, Karnataka), mustard oil (North India), sesame oil (southern regions)',
        arab: 'Argan oil (Morocco), rose oil, oud oil (very expensive — primarily fragrance)',
        east_african: 'Tesmi/qibe (spiced Ethiopian clarified butter)',
        mediterranean: 'Olive oil (the original Mediterranean body and hair oil)',
      },
    },
  },
};

// ─── SHOWER RITUALS ───────────────────────────────────────────────────────────

export const SHOWER_RITUALS = {
  temperature: {
    hot: 'Hot water: strips the skin barrier, removes natural oils, worsens dry skin and eczema. Temporary vasodilation feels good but is hard on skin.',
    warm: 'Warm water: gentle on skin. Effectively cleanses without stripping.',
    cold: 'Cold shower: increases alertness (adrenaline response), temporarily improves mood (endorphin release). Constricts blood vessels (vasoconstriction). Wim Hof Method cold plunge advocates cite benefits including inflammation reduction. Cold water on hair closes the cuticle for shine.',
    contrast: 'Contrast shower: alternating hot and cold (30 sec hot, 30 sec cold, repeated 3-5 cycles). Claimed benefits for circulation and recovery. Popular in Nordic and Eastern European traditions.',
  },
  shower_body_routine: {
    order: [
      'Hair care FIRST: shampoo and condition hair at the beginning. Hair products running down the body while you wash can cause body acne (leave-in conditioners, oils).',
      'Body wash or soap on washcloth, loofah, or body puff',
      'Focus on oilier areas: underarms, groin, feet',
      'Rinse from top to bottom (so hair product runoff is washed off the body)',
      'Cool or lukewarm rinse at the end (for skin and hair benefits)',
      'Body scrub 2-3x per week (if using)',
      'Pat (not rub) dry — friction from rubbing damages skin and hair cuticle',
      'Apply body oil or moisturiser IMMEDIATELY while skin is damp',
    ],
  },
  steam_benefits: {
    overview: 'Steam opens the pores and hydrates the skin. A steamy bathroom during a shower provides ambient steam benefits. A dedicated steam room or steam facial provides more concentrated exposure.',
    skin: 'Steam softens the skin surface, making exfoliation and any following skincare treatments more effective. Opens follicles for deeper product penetration.',
    respiratory: 'Steam with eucalyptus or menthol is a traditional respiratory treatment.',
    hair: 'Steam treatment for hair (using a steam cap or sitting in a steamy bathroom with deep conditioner applied) opens the cuticle and allows better penetration of conditioning ingredients. Particularly beneficial for low-porosity hair.',
  },
};

// ─── ETHNIC BATHING TRADITIONS ────────────────────────────────────────────────

export const ETHNIC_BATHING_TRADITIONS = {
  hammam: {
    culture: 'Arab / North African / Turkish',
    description: 'The hammam (also called Turkish bath or steam bath) is a communal bathing ritual that has been central to Arab, Berber, Turkish, and Persian cultures for over 1,000 years. A sequence of rooms with increasing heat and steam. The ritual involves exfoliation with a kessa (exfoliating mitt), lathering with beldi (black olive soap), massage, and conditioning with argan oil.',
    ritual_steps: ['Adjustment room: sit in warm/humid room to begin opening pores', 'Steam room: sit in hot steam for 15-20 min', 'Kessa exfoliation: assistant uses kessa mitt to vigorously scrub all body surfaces, revealing new skin', 'Beldi soap lather: black Moroccan olive soap applied and massaged in', 'Rinse with warm then cool water', 'Argan oil or ghassoul (clay) mask applied and rinsed', 'Rest in cooling room wrapped in towels'],
    frequency: 'Weekly in traditional communities. Now often monthly or for special occasions.',
    communities: 'Morocco (hammam as "douche ar-riyal"), Turkey (hamam), Algeria, Tunisia, Egypt, Syria, Jordan.',
  },
  ofuro: {
    culture: 'Japanese',
    description: 'The ofuro (Japanese bath) is a deep soaking tub ritual. The body is thoroughly cleaned BEFORE entering the bath — you wash yourself at an adjacent shower station before soaking, so the bath water remains clean. The ofuro is for soaking and relaxation, not cleaning.',
    ritual: 'Shower station: thorough cleanse of entire body. Then soak in very hot water (often 42°C+) in the deep ofuro tub for 15-20 minutes. Exit, pat dry, apply body lotion.',
    significance: 'The evening bath is a daily family ritual. Children, adults, and elders often share the same clean bath water in sequence. Spiritually and culturally significant — cleansing both body and spirit.',
    onsen: 'Natural hot spring baths (onsen) take the ofuro tradition to a communal and therapeutic level. Onsen waters are rich in minerals (sulfur, iron, etc.) with specific therapeutic properties.',
  },
  jimjilbang: {
    culture: 'Korean',
    description: 'The Korean public bathhouse (jjimjilbang or mogyoktang) is a communal bathing space. Features hot and cold baths, steam rooms, dry saunas. The Korean Italy towel (Italian cloth/때수건) is used for full body scrubbing — in the hot water, the top layer of skin (dead cells and accumulated buildup) visually peels away under friction. Sometimes done by a professional scrub-down specialist.',
    ritual: 'Hot soak to soften skin (15-20 min). Full body scrub with Italy towel. Rinse. Optional cool plunge pool. Second soak. Rinse. Some jjimjilbangs offer specific mineral baths.',
    social: 'The jjimjilbang is also a social space — families spend hours there; there are sleeping areas, food, entertainment. A uniquely Korean institution.',
  },
  ganga_snan: {
    culture: 'South Asian / Hindu',
    description: 'Ritual bathing in sacred rivers (particularly the Ganges/Ganga) is a spiritual and purification practice in Hinduism. Bathing at sunrise (brahma muhurta — the auspicious pre-dawn hour) is a daily practice for devout Hindus.',
    ayurvedic: 'The Ayurvedic pre-bath ritual involves applying oil all over the body (Abhyanga), allowing it to penetrate for 15-30 minutes, then bathing it off. This is the traditional beauty application of bathing in Ayurveda.',
  },
  wash_day: {
    culture: 'Black American',
    description: 'Wash Day is the significant Black American cultural institution of washing and styling natural hair — historically taking 2-4+ hours, Saturday evening (for Sunday church). Bathing in this context was a full self-care ritual: deep cleanse, hair treatment, body care, moisturising, styling.',
    modern: 'Wash Day remains a cultural touchstone. The contemporary Wash Day is documented extensively on social media — the full process of washing, conditioning, detangling, and styling natural Black hair.',
  },
  igbo_ozo: {
    culture: 'West African / Igbo',
    description: 'The Igbo ozo or nkwa (ceremonial preparation) involves ritual bathing and body decoration — application of uli (a blue-black plant dye), nzu (white chalk), and oils for ceremonial and coming-of-age occasions.',
  },
  mehndi: {
    culture: 'South Asian',
    description: 'Pre-wedding rituals include both bathing rituals (milk baths, turmeric/haldi application) and body adornment (mehndi/henna on hands and feet, sometimes body). The bridal beauty ritual begins with cleansing and preparation of the skin before decoration.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getBathBodyOverview() { return BATH_BODY_OVERVIEW; }
export function getBathType(type) {
  return type ? BATH_TYPES[type] : BATH_TYPES;
}
export function getBodyScrubGuide(type) {
  return type ? BODY_SCRUB_GUIDE[type] : BODY_SCRUB_GUIDE;
}
export function getBodyOilGuide(type) {
  return type ? BODY_OIL_GUIDE.types[type] : BODY_OIL_GUIDE;
}
export function getShowerRituals() { return SHOWER_RITUALS; }
export function getEthnicBathingTradition(communityId) {
  const map = {
    arab: 'hammam',
    east_asian: 'jimjilbang',
    south_asian: 'ganga_snan',
    black_american: 'wash_day',
    west_african: 'igbo_ozo',
  };
  const key = communityId?.replace('-', '_');
  return ETHNIC_BATHING_TRADITIONS[map[key] || key] || Object.values(ETHNIC_BATHING_TRADITIONS);
}

