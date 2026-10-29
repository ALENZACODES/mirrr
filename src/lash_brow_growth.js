/**
 * MIRRR — Lash & Brow Growth Guide
 * Serum science, castor oil tradition, lash extensions, threading,
 * brow shaping for ethnic face shapes, and growth cycle biology.
 */

export const LASH_BROW_BIOLOGY = {
  title: 'Lash & Brow Hair Biology',
  eyebrow_anatomy: {
    structure: 'The eyebrow has three anatomical sections: the head (inner, closest to nose), the body (arch zone, middle), and the tail (outer end). Each section has characteristic follicle density and growth direction.',
    follicles: 'Average brow has 250–550 individual hairs distributed across head, body, and tail. Tail typically thinner/sparser in most people.',
    growth_cycle: { anagen: '4–6 months (shorter than scalp hair — this limits brow length)', catagen: '3–4 weeks', telogen: '3–4 months', implication: 'Brow hairs take 4–6 months to regrow after loss or over-plucking; this is why over-plucked brows are slow to recover' },
    nerve_density: 'Eyebrows have high sensory nerve density; they serve communication and facial expression functions beyond aesthetics; raising/furrowing brows is core to human emotional signalling'
  },
  eyelash_anatomy: {
    structure: 'Lashes grow from follicles at the eyelid margin; upper lid has 90–150 lashes; lower lid 70–80 lashes',
    growth_cycle: { anagen: '30–45 days (extremely short cycle — this is why lashes don\'t grow very long and shed quickly)', catagen: '15 days', telogen: '100 days', implication: 'Lash serums work by extending anagen phase duration; natural lashes naturally cycle every 4–6 months' },
    curvature: 'Natural lash curvature varies significantly across ethnicities: East Asian lashes often grow downward/straight; South Asian lashes typically long with natural curve; African-heritage lashes often curve with texture matching hair; European lashes range widely',
    sebaceous: 'Meibomian glands in eyelid margin are modified sebaceous glands producing oil for tear film; these are distinct from follicle sebaceous glands'
  },
  browLoss_causes: {
    overplucking: 'Most common in women who plucked heavily in 1990s-2000s era of thin brow trends; repeated trauma to follicles can cause permanent cessation of growth in some follicles',
    medical: ['Hypothyroidism: lateral (outer) brow thinning is classic sign — "Queen Anne\'s sign"; entire outer third of brow missing', 'Alopecia areata: can affect brows specifically (alopecia of eyebrow)', 'Trichotillomania: compulsive hair pulling', 'Chemotherapy: temporary; regrows after treatment ends', 'Nutritional deficiencies: protein, iron, biotin, zinc'],
    age: 'Natural brow thinning occurs with age due to follicle senescence and hormonal changes; particularly after menopause',
    eczema: 'Rubbing itchy eczema around eyes causes mechanical trauma to brow follicles; common cause in South Asian and East Asian individuals with atopic tendency'
  }
};

export const LASH_GROWTH_SERUMS = {
  title: 'Lash Growth Serums: Science & Ingredients',
  prescription: {
    bimatoprost: {
      brandName: 'Latisse (US); Careprost (available internationally)',
      origin: 'Originally a glaucoma medication (Lumigan) — patients observed lash growth as side effect; FDA approved for lash growth 2008',
      mechanism: 'Prostaglandin F2α analogue; extends anagen phase of lash follicles; increases number of lashes in anagen; possibly increases follicle size',
      results: 'Clinically proven: 25% increase in length, 106% increase in thickness, 18% increase in darkness in 16-week trials',
      howToApply: 'Single application to upper lash line nightly; do not apply lower lid directly — blink transfers product to lower lid naturally',
      sideEffects: ['Iris darkening (permanent): darkens light eyes over time in ~1–2% users; irreversible; use only on upper lash line to minimise eye contact', 'Periorbital fat atrophy (rare): sunken eye appearance with very long-term use', 'Red itchy eyes if product enters eye directly', 'Skin darkening at application site (usually reversible)'],
      continuation: 'Must continue to maintain results; lashes return to baseline 4–16 weeks after stopping',
      access: 'Prescription required in US/UK/Australia; available OTC in some countries; telemedicine prescriptions increasingly available'
    }
  },
  otcActives: {
    peptides: {
      examples: ['Myristoyl pentapeptide-17: stimulates keratin synthesis in follicle', 'Biotinoyl tripeptide-1: supports follicle anchoring', 'Oligopeptide-10: antimicrobial + follicle stimulation'],
      evidence: 'Mostly in vitro and company-funded studies; clinical evidence significantly less robust than bimatoprost; results seen but typically more subtle',
      brands_type: 'GrandLASH-MD, NeuLash, RapidLash'
    },
    isopropylCloprostenate: {
      description: 'Prostaglandin analogue used in OTC serums; similar mechanism to bimatoprost but not identical',
      concern: 'Same theoretical risks as bimatoprost for iris darkening and periorbital fat atrophy; with OTC products you often don\'t know which prostaglandin is included or at what concentration',
      regulation: 'In some countries, these are unregulated in OTC cosmetics despite having drug-like mechanisms',
      recommendation: 'If using OTC serum that contains a prostaglandin analogue: apply precisely to lash line; avoid eye contact; monitor for iris colour change'
    },
    castor_oil: {
      mechanism: 'Not scientifically proven to grow lashes; ricinoleic acid in castor oil may have some anti-inflammatory and follicle-supporting properties; primarily works as a conditioning agent that may reduce lash breakage, giving appearance of thicker lashes',
      benefit: 'Very safe; cheap; no side effects; traditional use across multiple cultures',
      application: 'Clean mascara wand dipped in castor oil; apply to lashes nightly; wash off in morning',
      JBCO: 'Jamaican Black Castor Oil (roasted, ash-containing) has different composition; some evidence suggests the ash content changes properties; both are used traditionally'
    },
    vitamin_E: 'Antioxidant; reduces oxidative stress in follicles; found in many lash serums as adjunct ingredient; unlikely to be primary growth driver on its own'
  },
  applicationTips: {
    timing: 'Evening only; always after removing eye makeup; on clean lash line; do not apply upper lash AND lower lash separately — one upper application blinks product to lower naturally',
    hygiene: 'Serums in tubes are lower contamination risk than those in pots; replace every 3 months maximum; never share',
    contact_lens: 'Remove contact lenses before applying; wait 15 minutes before reinserting',
    expectation: 'OTC peptide serums: expect to see results in 4–8 weeks; prescription bimatoprost: 8–16 weeks for full results; castor oil: conditioning benefit visible sooner'
  }
};

export const BROW_SHAPING_GUIDE = {
  title: 'Brow Shaping: Methods, Techniques & Ethnic Face Shapes',
  shapingMethods: {
    threading: {
      description: 'Cotton thread twisted and rolled over skin to trap and pull multiple hairs simultaneously',
      origin: 'Ancient technique originating in South Asia, the Middle East, and Central Asia; the most traditional brow shaping method in South Asian, Arab, and East Asian communities',
      advantages: ['Very precise: single hair removal possible', 'Fast: experienced threader does brow in 3–5 minutes', 'Suitable for sensitive skin: no hot wax chemical contact', 'Good for areas near eyes: safer than wax around eye tissue', 'Inexpensive at threading salons'],
      disadvantages: ['Can be painful for first-timers; pain reduces with repetition', 'Requires skilled practitioner; difficult to DIY', 'Redness immediately after (30–60 minutes)'],
      aftercare: 'Aloe vera gel or soothing moisturiser after threading; avoid retinoids or AHAs for 24 hours; SPF next morning'
    },
    waxing: {
      description: 'Hot or cold wax applied to unwanted hair, pressed with strip, and removed',
      advantages: ['Fast', 'Widely available', 'Good for large areas'],
      disadvantages: ['Burns possible if wax too hot', 'Can remove too much at once', 'Not suitable near active breakouts or tretinoin-using skin (skin lifts with wax)', 'Harder to be as precise as threading'],
      contraindications: ['Active isotretinoin/tretinoin use (skin tears)', 'Sunburned skin', 'Active eczema or psoriasis in area']
    },
    tweezing: {
      description: 'Individual hair removal with tweezers',
      bestFor: 'Maintenance between professional treatments; strays after threading or waxing',
      technique: 'Pull in direction of hair growth; always; against-direction causes breakage not removal and potentially ingrowns',
      tools: ['Slant-tip tweezers: most versatile; recommended for brows', 'Pointed tweezers: for very precise individual hairs; risk of skin puncture'],
      lighting: 'Always tweeze in good natural light; bathroom lighting with shadows leads to over-tweezing'
    },
    microblading: {
      description: 'Semi-permanent cosmetic tattooing; fine strokes drawn with a manual blade and pigment to create hair-like marks',
      duration: '12–18 months; touch-up required to maintain',
      bestFor: 'Over-plucked brows; alopecia; sparse natural brows; those wanting defined brows without daily makeup',
      painLevel: 'Topical numbing applied; mild discomfort; comparable to firm pressure',
      healing: '4–6 weeks; colour darkens then fades during healing; 25% lighter than the immediate result is typical final result',
      risks: ['Infection if unsterile conditions', 'Allergic reaction to pigment', 'Poor shape that takes 18 months to fade', 'Scarring from inexperienced technician'],
      ethnicity_note: 'On Fitzpatrick IV-VI skin: PIH (post-inflammatory hyperpigmentation) risk from microblading blade trauma; powdery brow effect (nanobrow or ombré brow) may be safer for deeper skin as it doesn\'t cut as deeply'
    },
    nanobrow_ombre: {
      description: 'Semi-permanent technique using digital tattoo machine instead of manual blade; creates pixelated dots simulating powder fill or natural hair; less trauma than microblading',
      advantages: 'Better for oily skin (microblading fades faster on oily skin); safer for Fitzpatrick IV-VI; longer duration possible',
      duration: '18–24 months typical'
    }
  },
  browsForFaceShapes: {
    faceShapeMap: {
      oval: { description: 'Balanced proportions; slight curve in brow complements; most shapes work', recommended: 'Soft angled arch; avoid overly dramatic arch or flat brow; both look good' },
      round: { description: 'Width and height similar; soft curves', recommended: 'High arched brow to add vertical length and slim face; avoid round brow that emphasises circular shape' },
      square: { description: 'Strong jaw; wide forehead; angular', recommended: 'Soft curved brow softens angular features; avoid very straight or very sharp angular brow that emphasises squareness' },
      heart: { description: 'Wide forehead; narrow jaw', recommended: 'Soft rounded arch to balance wide forehead; avoid high arch that adds forehead height' },
      oblong_long: { description: 'Face longer than wide; high forehead', recommended: 'Flat, horizontal brow to interrupt vertical length; avoid high arch that elongates further' },
      diamond: { description: 'Narrow forehead and jaw; wide cheekbones', recommended: 'Curved brow with soft arch; avoid very thin brow' }
    },
    ethnicBrowCulture: {
      southAsian: 'Full, defined, slightly arched brows are a Bollywood and South Asian beauty standard; threading is the cultural method; very thin 90s brows are considered out of place in this aesthetic',
      arab: 'Strong, defined, full brows; high arch is a Middle Eastern and North African aesthetic ideal; threading and grooming are central beauty rituals; bold brows are admired',
      eastAsian: 'K-beauty: straight, brushed-up, slightly horizontal brows ("straight brow" — 일자 눈썹 in Korean) rather than arched; makes face appear younger; J-beauty: soft natural brows; Chinese: varies by era but natural to moderately defined currently',
      westAfrican: 'Strong, well-groomed brows; bold is beautiful; threading in urban West Africa; natural fuller brow is current aesthetic ideal in Nigerian/Ghanaian beauty culture',
      latina: 'Full brows are a Latina beauty standard; natural fullness celebrated; defined but not over-groomed; bushy natural brow is aspirational in Latin American beauty culture currently'
    }
  }
};

export const LASH_EXTENSIONS_AND_STYLING = {
  title: 'Lash Extensions, Lifts & Styling',
  lashExtensions: {
    types: [
      { type: 'Classic lashes', description: 'One extension applied to each natural lash; natural to full effect', weight: 'Lightest; safest for natural lashes', result: 'Fuller version of natural lashes' },
      { type: 'Volume lashes', description: 'Fan of 2–6 extensions applied to each natural lash', weight: 'More weight; requires good natural lash health', result: 'Fluffy, dramatic volume' },
      { type: 'Hybrid lashes', description: 'Mix of classic and volume; best of both', weight: 'Moderate', result: 'Natural volume; good for most lash types' },
      { type: 'Mega volume', description: '7–16 extension fan per natural lash', weight: 'Heaviest; potential for natural lash damage with long-term wear', result: 'Very dramatic; performance/editorial look' }
    ],
    materials: ['Synthetic mink (most common; vegan; uniform texture)', 'Faux mink (slightly softer; mink-like texture; vegan)', 'Silk (more matte; softer; popular for wispy lash looks)', 'Real mink (controversial — from mink fur farms; limited use; some ethical concerns)'],
    maintenance: 'Fill every 2–3 weeks; full set every 6–8 weeks; do not pull or rub; use oil-free makeup remover; avoid oil-based products near eye area (dissolves adhesive)',
    risks: ['Allergic reaction to adhesive (cyanoacrylate) — common; test sensitivity with single lash before full set', 'Natural lash damage from extensions that are too heavy or applied incorrectly', 'Traction alopecia of lashes with repeated sets', 'Infection from unsterile application environment'],
    aftercare: ['Oil-free cleanser to remove eye makeup', 'Do not use mascara on extensions (ruins them; unnecessary anyway)', 'Sleep on back or silk pillowcase to prevent crushing', 'Brush gently with provided spoolie each morning']
  },
  lashLift: {
    description: 'Permanent wave for natural lashes; chemicals straighten then re-set lashes in upward curl; no extensions',
    duration: '6–8 weeks (lash growth cycle)',
    advantages: ['No daily curling needed', 'Low maintenance', 'Safe for those who react to extension adhesive', 'Looks natural'],
    tint: 'Lash tint (applied with or after lift) darkens lashes; eliminates need for mascara daily; very popular combination',
    risks: ['Chemical burns if left too long', 'Over-processed lashes become brittle; can break', 'Infection if product enters eyes']
  },
  curling_by_ethnicity: {
    East_Asian: 'East Asian lashes often grow in a downward or straight direction; lash curler is a beauty essential before mascara; heated lash curlers provide stronger and longer-lasting curl; lash lift is very popular in East Asian beauty markets',
    recommendation: 'Heated lash curler (instead of mechanical) provides gentler, longer-lasting curl for any lash type; use before mascara'
  }
};

export const ETHNIC_LASH_BROW_TRADITIONS = {
  'west-african': {
    browTradition: 'Groomed strong brows; bold and defined; natural fullness celebrated; threading in urban centres (Lagos, Accra, Nairobi)',
    lashTradition: 'False lashes are standard for many West African events; elaborate rhinestone or decorated false lashes for weddings and formal occasions; Lagos nail and lash culture is very trend-forward',
    naturalPractice: 'Castor oil applied to brows and lashes is common beauty tradition; shea butter occasionally used to condition brows',
    note: 'Black skin around eyes may develop darker hyperpigmentation from threading or waxing irritation; gentle technique and SPF maintenance after shaping recommended'
  },
  'south-asian': {
    browTradition: 'Threading is the quintessential South Asian brow method — threading salons are cultural institutions in South Asian diaspora communities worldwide; the standard is a defined, clean arch with full natural inner brow preserved',
    lashTradition: 'South Asian lashes are typically long with natural curve; mascara use is common; false lashes for wedding and formal occasions; lash serums less common as natural lashes are typically impressive',
    naturalPractice: 'Castor oil on lashes and brows is widely practised; some apply coconut oil or almond oil; brahmi oil (traditionally for scalp) occasionally used on brows',
    mehandi_for_brows: 'Henna (mehandi) used to tint brows in some South Asian traditions; provides natural semi-permanent colour that lasts 1–3 weeks'
  },
  caribbean: {
    browTradition: 'Bold, clean, well-shaped brows; Caribbean beauty aesthetic values groomed appearance; threading and waxing both popular',
    lashTradition: 'False lashes for events and parties are very culturally normalised; carnival and fête beauty involves dramatic lash looks',
    naturalPractice: 'Castor oil and especially JBCO (Jamaican Black Castor Oil) applied to lashes and brows nightly is very popular in Caribbean communities'
  },
  arab: {
    browTradition: 'Brow grooming is central to Arab beauty identity; threading is the traditional method; the Arabic brow aesthetic tends toward high, defined arch; Levantine communities favour a refined but full brow; Gulf communities more defined and heavier',
    lashTradition: 'Dramatic lashes are part of traditional Arab eye makeup; false lashes common for social occasions; kohl/kajal application along lash line is the foundation of Arab eye makeup',
    kohl: 'Black kohl along the inner waterline from the lash root is traditional and functional (reduces glare; antimicrobial); the lash line is perceived as an extension of the kohl',
    henna_brows: 'Henna brow tinting is traditional in North African Arab communities; longer lasting than Western tinting; provides deep brown-black tint'
  },
  latina: {
    browTradition: 'Full, natural brows are the current Latina beauty ideal; anti-thin-brow; "bushy brow" aesthetic is aspirational; threading and waxing both common',
    lashTradition: 'Bold lashes for special occasions; quinceañera and wedding lashes are a full beauty moment; mascara is a daily essential across Latin America',
    naturalPractice: 'Castor oil on brows and lashes; vitamin E oil; aguacate (avocado) oil on lash line occasionally',
    frida_influence: 'Frida Kahlo\'s iconic unibrow has become a symbol of celebrating natural beauty and rejecting Western grooming standards; has cultural significance beyond aesthetics'
  },
  'east-asian': {
    browTradition: 'K-beauty: straight, horizontal, "natural brushed-up" brow is current aesthetic; achieved with clear brow gel and minimal fill; eyebrow stencils very popular for beginners; the arch is minimal or absent',
    lashTradition: 'Lash lift highly popular; East Asian lashes naturally grow downward; heated curlers are essential; individual cluster lashes at outer corners for K-beauty look; volume lashes for dramatic occasions',
    naturals: 'Korean lash and brow care includes serums; growth toners; Korean beauty market leads in lash serum innovation',
    J_beauty: 'Japanese aesthetic: very natural, light brows; minimal mascara emphasis; the face is more about skin perfection than heavy lash or brow drama'
  },
  'east-african': {
    browTradition: 'Strong natural brows celebrated; minimal grooming needed for naturally full East African brows; threading for shaping when desired',
    lashTradition: 'East African lashes (particularly Ethiopian/Somali) are often long and dramatic naturally; mascara enhances what is already there; false lashes for occasions',
    naturalPractice: 'Castor oil, moringa oil applied to lashes and brows; some use aloe vera gel to set brows'
  },
  'south-african': {
    browTradition: 'Groomed brows across South African beauty culture; waxing and threading both available in South African beauty salons; diverse aesthetic standards reflecting diverse population',
    lashTradition: 'South African events (galas, weddings) involve full lash beauty; Brazilian and strip lashes popular; mixed-technique looks'
  },
  'black-american': {
    browTradition: 'Full, defined, arched brows are the Black American beauty standard in many communities; brow lamination very popular for "brushed-up" look; pomade and brow pencil for defined edges; waxing and threading both offered at Black beauty salons',
    lashTradition: 'Bold lashes are cultural identity expression; full volume strip lashes for occasions; individual lash extensions popular for everyday wear; "lash bar" culture thriving in Black American beauty market; mink and faux mink extensions very popular',
    naturalPractice: 'JBCO (Jamaican Black Castor Oil) is the go-to community recommendation for lash and brow growth; applied nightly to clean lashes and brows; 5:1 mixture of JBCO to argan oil for less heavy application',
    brow_lamination: 'Brow lamination (chemical restructuring to brush brows upward into fluffy, combed look) is hugely popular; works on typically thicker African-heritage brow hairs particularly well'
  }
};

export function getLashBrowBiology() {
  return LASH_BROW_BIOLOGY;
}

export function getLashGrowthSerums(type) {
  if (!type) return LASH_GROWTH_SERUMS;
  const map = {
    prescription: LASH_GROWTH_SERUMS.prescription,
    bimatoprost: LASH_GROWTH_SERUMS.prescription.bimatoprost,
    latisse: LASH_GROWTH_SERUMS.prescription.bimatoprost,
    otc: LASH_GROWTH_SERUMS.otcActives,
    castor: LASH_GROWTH_SERUMS.otcActives.castor_oil,
    peptides: LASH_GROWTH_SERUMS.otcActives.peptides,
    tips: LASH_GROWTH_SERUMS.applicationTips
  };
  return map[type.toLowerCase()] || LASH_GROWTH_SERUMS;
}

export function getBrowShapingGuide(section) {
  if (!section) return BROW_SHAPING_GUIDE;
  const map = {
    threading: BROW_SHAPING_GUIDE.shapingMethods.threading,
    waxing: BROW_SHAPING_GUIDE.shapingMethods.waxing,
    tweezing: BROW_SHAPING_GUIDE.shapingMethods.tweezing,
    microblading: BROW_SHAPING_GUIDE.shapingMethods.microblading,
    shapes: BROW_SHAPING_GUIDE.browsForFaceShapes,
    face_shapes: BROW_SHAPING_GUIDE.browsForFaceShapes
  };
  return map[section.toLowerCase()] || BROW_SHAPING_GUIDE;
}

export function getEthnicLashBrowTraditions(communityId) {
  const key = communityId.replace(/-/g, '_');
  const directMap = {
    'west-african': ETHNIC_LASH_BROW_TRADITIONS['west-african'],
    'south-asian': ETHNIC_LASH_BROW_TRADITIONS['south-asian'],
    caribbean: ETHNIC_LASH_BROW_TRADITIONS.caribbean,
    arab: ETHNIC_LASH_BROW_TRADITIONS.arab,
    latina: ETHNIC_LASH_BROW_TRADITIONS.latina,
    'east-asian': ETHNIC_LASH_BROW_TRADITIONS['east-asian'],
    'east-african': ETHNIC_LASH_BROW_TRADITIONS['east-african'],
    'south-african': ETHNIC_LASH_BROW_TRADITIONS['south-african'],
    'black-american': ETHNIC_LASH_BROW_TRADITIONS['black-american']
  };
  return directMap[communityId] || null;
}

export const LASH_BROW_STATS = {
  moduleId: 'lash_brow_growth',
  version: '1.0.0',
  topics: ['lash growth', 'brow growth', 'castor oil lashes', 'lash serum', 'bimatoprost', 'Latisse', 'brow threading', 'microblading', 'brow lamination', 'lash extensions', 'lash lift', 'ethnic brow culture', 'JBCO lashes'],
  communitiesSupported: 9,
  keyFacts: [
    'Bimatoprost (Latisse) extends lash anagen phase — clinical trials showed 25% length increase, 106% thickness increase after 16 weeks',
    'A side effect of bimatoprost use near the eye is permanent iris darkening in light eyes (~1–2% of users) — irreversible',
    'Eyebrow hairs have a 4–6 month anagen phase; over-plucked brows can take this long to begin recovering',
    'East Asian lashes typically grow in a downward direction; heated curlers and lash lifts are especially popular for this reason',
    'Jamaican Black Castor Oil (JBCO) is the most culturally established lash and brow growth tradition in Black American and Caribbean communities',
    'Threading originated in South Asia and the Middle East thousands of years ago; threading salons are cultural institutions in South Asian diaspora communities globally',
    'Microblading on Fitzpatrick IV-VI skin carries PIH risk from blade trauma; powder/ombre brow technique is generally safer for deeper skin tones',
    'Lateral eyebrow thinning (outer third disappearing) is a classic sign of hypothyroidism — "Queen Anne\'s sign"'
  ]
};
