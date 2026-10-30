/**
 * MIRRR — Hair Care Routines by Hair Type
 * Complete type 1–4 system with subcategories, porosity overlays,
 * product formulation science, and ethnic hair care traditions.
 */

export const HAIR_TYPE_SYSTEM = {
  title: 'The Hair Typing System: Science & Limitations',
  origin: 'Hair typing was popularised by celebrity stylist Andre Walker (who created the 1A–4C system) in the 1990s while working with Oprah Winfrey. It was widely adopted in the natural hair community in the 2000s–2010s.',
  structure: {
    type1: { label: 'Straight', subcategories: { '1A': 'Very fine/thin; no wave pattern; very difficult to hold a curl', '1B': 'Medium texture; some volume; slight body wave', '1C': 'Coarse; some body; resistant; slight wave in sections' } },
    type2: { label: 'Wavy', subcategories: { '2A': 'Fine, loose S-wave; easily straightened; prone to getting weighed down by products', '2B': 'Medium; S-wave more defined; starts at mid-length; some frizz', '2C': 'Coarse; defined S-wave from root; strong frizz tendency; almost curly' } },
    type3: { label: 'Curly', subcategories: { '3A': 'Loose, large spiral curls; diameter of sidewalk chalk; shiny when healthy', '3B': 'Medium spiral curls; diameter of a Sharpie marker; some frizz', '3C': 'Tight corkscrew curls; diameter of a pencil; dense; lots of volume; high shrinkage' } },
    type4: { label: 'Coily/Kinky', subcategories: { '4A': 'Tight S-coils; diameter of a knitting needle; defined when wet; visible coil pattern', '4B': 'Z-shaped pattern; less defined curl; bends in sharp angles; fluffy', '4C': 'Very tight Z-coils; least defined pattern; most shrinkage (75-80%); most fragile; must be handled gently' } }
  },
  limitations: [
    'Most people have multiple hair types on their head — crown, temples, nape all behave differently',
    'The system doesn\'t account for porosity, density, elasticity, or thickness — which affect product choices more than curl pattern alone',
    'The original system was critiqued for placing more value on looser textures (3A-3B as "good curls"); this framing is now widely rejected in the natural hair community',
    'Type 4 hair was largely absent or marginalised in the original system; the community has expanded understanding significantly',
    'Hair behaviour changes with: length, damage, health, hydration, humidity, product history (build-up), and life stage (pregnancy, menopause, health conditions)'
  ]
};

export const POROSITY_OVERLAY = {
  title: 'Hair Porosity: The Most Important Factor Beyond Type',
  what_is_it: 'Porosity refers to the hair\'s ability to absorb and retain moisture. It is determined by the condition of the cuticle layer — the overlapping scales on the hair shaft. Low porosity: cuticles lie flat/tight. High porosity: cuticles are raised or gaps between scales.',
  testingMethods: {
    floatTest: 'Take a clean hair strand; place on surface of room-temperature water; wait 2-4 minutes. Low porosity: floats. Medium: slowly sinks. High porosity: sinks quickly. NOTE: the float test is imperfect — oils and product residue on the hair affect the result; only valid on very clean hair.',
    slideTest: 'Pinch a hair strand between thumb and index finger; slide toward the scalp. Low porosity: feels smooth (cuticles lie flat). High porosity: feels rough or catches (raised cuticles). Medium: slightly textured but not rough.',
    rationale: 'Porosity more accurately predicts product behaviour than curl type alone'
  },
  types: {
    low: {
      characteristics: ['Cuticles tightly packed', 'Water beads on surface initially', 'Takes long to get fully wet', 'Takes long to dry', 'Product sits on top rather than absorbing', 'Build-up prone', 'Healthy protein bond'],
      bestProducts: ['Lighter products: water-based, sprays, light leave-ins', 'Heat opens cuticles to allow moisture in: use warm water to wash, deep condition with heat (shower cap)', 'Avoid heavy butters, oils on dry hair (seal on wet hair only)', 'Humectants: glycerin, aloe vera help draw moisture into hair', 'Avoid heavy protein treatments (already protein strong)'],
      tips: ['Use warm/hot water to wash — opens cuticles for cleaning', 'Apply leave-in to wet (just washed) hair', 'Use hooded dryer or heat cap during deep conditioning']
    },
    medium: {
      characteristics: ['The "ideal" porosity', 'Absorbs moisture well, retains reasonably', 'Most products work', 'Healthy and adaptable'],
      bestProducts: ['Balanced range: can use medium-weight products', 'Protein and moisture treatments both work well', 'No extreme adjustments needed'],
      tips: ['Maintain with regular trims and moderate heat use', 'Deep condition monthly']
    },
    high: {
      characteristics: ['Cuticles raised or damaged', 'Absorbs moisture quickly but loses it quickly (hygral fatigue risk)', 'Dries quickly', 'Frizzes easily, especially in humidity', 'Tangles easily', 'Can result from: bleach, heat damage, excessive chemical processing, or genetic disposition (some ethnicities have naturally higher porosity Type 4 hair)'],
      bestProducts: ['Heavier products: creams, butters, oils to seal moisture in', 'Protein treatments to fill gaps in cuticle', 'Anti-humectants in humid weather (avoid glycerin on high porosity hair in humidity — it pulls water from the atmosphere and expands hair leading to frizz)', 'Sealants: apply oils on top of leave-in to lock moisture in'],
      tips: ['Cold water rinse after conditioning to close cuticles', 'LOC/LCO method: Layer moisture with Liquid, Oil, Cream to seal', 'Avoid excessive manipulation while wet (most fragile at this time)']
    }
  },
  ethnicPortrosity: {
    Type4: 'Type 4 hair frequently has high porosity due to the tight coil pattern — the bends in the hair shaft make it harder for cuticles to lie flat, leading to more gaps; also the natural oils from the scalp have difficulty traveling down the coil shaft',
    Asian: 'East Asian and South Asian hair is often low porosity — thick cuticle layer; this is why Asian hair can appear so shiny (flat cuticle reflects light) but can take a long time to absorb products and moisture',
    Note: 'These are general tendencies, not absolutes — individual variation is significant within every ethnicity'
  }
};

export const TYPE1_ROUTINE = {
  title: 'Type 1 (Straight) Hair Care Routine',
  
  commonChallenges: ['Oiliness (scalp sebum reaches full length quickly)', 'Limpness/flatness (no texture to create volume)', 'Fine strands easily damaged by heat', 'Difficult to hold curl or wave (for 1A/1B)'],
  weeklyRoutine: {
    washDays: '3-5 times per week typical (more frequent than other types due to oil)',
    shampoo: 'Volumising or clarifying shampoo; avoid heavy moisturising shampoos that weigh down; focus cleansing at scalp',
    conditioner: 'Lightweight conditioner; apply mid-length to ends ONLY; avoid scalp; rinse fully; deep condition monthly rather than weekly',
    styling: 'Let air dry for flattest result; diffuse for some texture; round brush blowdry for volume; flat iron for sleek',
    buildup: 'Clarify with clarifying shampoo weekly or bi-weekly; type 1 hair accumulates product build-up quickly'
  },
  productIngredients: {
    avoid: ['Heavy silicones without clarifying shampoo to remove them', 'Butters and heavy oils on scalp or roots', 'Coconut oil on fine type 1 (too heavy for many fine straight hair)'],
    look_for: ['Proteins (hydrolysed wheat protein, silk amino acids) — add strength to fine strands', 'Lightweight humectants (panthenol, glycerin in moderation)', 'Volumising agents: polymers that add body without weight']
  }
};

export const TYPE2_ROUTINE = {
  title: 'Type 2 (Wavy) Hair Care Routine',
  characteristics: 'The most varied type; ranges from barely-there wave (2A) to almost-curly (2C); frizz prone; the wave pattern depends entirely on HOW the hair dries — diffusing vs air drying vs plopping all give different results',
  commonChallenges: ['Frizz in humidity', 'Waves dropping out over the day', 'Products making waves crunchy or heavy', 'Inconsistent wave pattern (some sections wavier than others)', 'The hair between straight and curly that does neither perfectly'],
  wavyGirlMethod: {
    description: 'A variation of the Curly Girl Method adapted for wavy hair; avoids sulphates and drying silicones; uses lighter products than the full curly method',
    steps: ['Clarify with sulphate shampoo every 2-4 weeks to remove build-up', 'Low-poo (mild sulphate-free shampoo) in between', 'Conditioner: "squish to condish" — scrunch conditioner into hair while wet in shower; rinse 70%', 'Apply lightweight gel or mousse to soaking wet hair', 'Plop for 10-20 minutes: wrap in microfibre towel or T-shirt to absorb excess water', 'Air dry or diffuse on low heat', 'Scrunch out the crunch (SOTC) once fully dry to remove gel cast and reveal soft waves']
  },
  productGuide: {
    avoid: ['Heavy creams and butters (weigh waves down)', 'Products with lots of waxes (non-removable without sulphate shampoo)', 'Silicones that build up: dimethicone, cyclomethicone'],
    use: ['Lightweight gel: great for hold without heaviness', 'Mousse: adds volume and enhances wave pattern', 'Curl cream (light): 2C and higher-texture 2B may need this', 'Light leave-in (spray format best for 2A-2B)']
  }
};

export const TYPE3_ROUTINE = {
  title: 'Type 3 (Curly) Hair Care Routine',
  characteristics: 'Visible spiral curl pattern; requires moisture to maintain definition; prone to frizz, dryness, and tangles; shrinkage visible (hair looks shorter when dry than when stretched wet); density and thickness vary significantly',
  curlyGirlMethod: {
    
    principles: ['Avoid sulphate shampoos (strip natural oils type 3 hair relies on)', 'Avoid silicones that build up without sulphate shampoo to remove them', 'Co-washing (conditioner washing) or low-poo as primary cleansing', 'Deep condition regularly', 'Style on soaking wet hair', 'Diffuse or air dry — minimise manipulation while drying']
  },
  weeklyRoutine: {
    washFrequency: '1-3 times per week typically; 3C hair may need more frequent moisture refresh',
    coWash: 'Conditioner wash (co-wash) for mid-week refreshing when hair needs moisture but not full cleanse',
    deepConditioning: 'Weekly; leave on 20-30 minutes with heat (shower cap under heat); this is not optional for healthy type 3 hair',
    styling: {
      step1: 'Apply leave-in conditioner to soaking wet hair',
      step2: 'Apply curl cream or gel or both (cocktailing) while hair is dripping wet',
      step3: 'Scrunch upward to encourage curl formation',
      step4: 'Diffuse on low or air dry — never towel rub',
      step5: 'SOTC once fully dry (scrunch out the crunch)'
    },
    refreshing: 'On non-wash days: dampen hair with water in a spray bottle; scrunch in a small amount of leave-in or diluted conditioner; re-scrunch to revive curls'
  },
  products3A3B: {
    note: '3A and 3B hair responds well to lighter creams and gels; looser curls are more prone to being weighed down',
    routine: 'Leave-in + lightweight gel; no heavy butter; deep condition weekly'
  },
  products3C: {
    note: '3C hair is at the boundary with type 4; can benefit from the same richer products as 4A; very high shrinkage; may need cream + gel cocktail',
    routine: 'Leave-in + curl cream + gel layering; weekly deep conditioning with heat is essential'
  }
};

export const TYPE4_ROUTINE = {
  title: 'Type 4 (Coily/Kinky) Hair Care Routine',
  
  criticalPrinciple: 'Type 4 hair requires the most moisture, the gentlest handling, and the most patience. It is NOT more difficult to care for — it is simply different. With the right routine and products, 4C hair thrives.',
  washFrequency: '1-2 times per week maximum; more frequent washing without adequate moisture replacement leads to breakage and dryness; pre-poo before washing is important',
  prePoo: {
    what: 'Pre-pooing (pre-shampooing) is applying oil or conditioner to dry hair BEFORE washing to protect it from the stripping effect of shampoo',
    oils: ['Coconut oil (penetrates the hair shaft): apply generously to dry hair 30 minutes to overnight before washing; coats the shaft and reduces protein loss during washing', 'Olive oil: penetrating; rich fatty acids nourishing to the cuticle', 'Avocado oil: similar to coconut but slightly lighter'],
    howLong: '30 minutes minimum; overnight for maximum benefit (cover with plastic cap to keep oils off pillow)'
  },
  washRoutine: {
    step1_detangle: 'ALWAYS detangle BEFORE washing in sections; use a wide-tooth comb or fingers only while saturated with conditioner; never detangle dry type 4 hair — it will break',
    step2_shampoo: 'Sulphate-free or very gentle shampoo in sections (4 to 8 sections); concentrate on scalp; do not pile hair on top of head',
    step3_condition: 'Generous conditioner application; leave on 5-10 minutes minimum; rinse in sections',
    step4_deepCondition: 'Weekly; this is the single most impactful thing you can do for type 4 hair health; 20-30 minutes with heat cap',
    step5_leaveIn: 'Leave-in conditioner is non-negotiable for type 4; apply to each section while soaking wet'
  },
  LOCMethod: {
    name: 'LOC Method: Liquid, Oil, Cream (or LCO: Liquid, Cream, Oil)',
    L: 'Liquid: water or water-based leave-in conditioner; provides the moisture',
    O: 'Oil: seals in the moisture from the water layer; penetrating oils (coconut, olive) or sealing oils (castor, jojoba, shea) depending on porosity',
    C: 'Cream: butter or cream to layer on top and provide lasting moisture and definition',
    LCO: 'LCO (Liquid, Cream, Oil) is preferred by some with high porosity 4C — the cream helps absorb moisture before the oil seals',
    frequency: 'Can be done weekly on wash day and refreshed mid-week'
  },
  protectiveStyles: {
    purpose: 'Protective styles tuck the ends of the hair away from friction and environmental exposure; the ends are the oldest and most fragile part of type 4 hair; protective styles reduce breakage and allow retention of length',
    styles: ['Box braids: classic style; hair is braided with or without extensions; wear 4-8 weeks', 'Twists: two-strand twists; gentler than braids; hair twisted with or without extensions', 'Cornrows: braids close to the scalp; can be worn plain or used as a base for sew-in weaves', 'Wigs: protect the natural hair underneath completely; excellent for length retention', 'Bantu knots: small sections of hair wound into knots; styling method that also creates curl definition when released'],
    warnings: ['Protective styles must not be too tight — traction alopecia risk at the hairline; if it hurts, it is too tight', 'Scalp must be moisturised while in protective style', 'Clean scalp every 2-4 weeks while in braids/twists', 'Do not leave in longer than 8-10 weeks maximum']
  },
  twistOut_BraidOut: {
    twistOut: 'Divide damp hair into sections; apply curl cream/butter; two-strand twist each section; allow to dry fully (overnight if possible); unravel gently in the morning; separate carefully for volume',
    braidOut: 'Same as twist-out but with three-strand braids; gives a tighter wave pattern than twists',
    note: 'These are popular styling techniques for type 4 that create a defined stretched style without heat'
  },
  shrinkageManagement: {
    
    isItBad: 'Shrinkage is not damage — it indicates healthy elasticity; fully coiled 4C hair is stronger than stretched 4C hair; shrinkage is natural and healthy',
    ifYouWantLength: ['Braid-out or twist-out to stretch without heat', 'African threading to stretch (no heat at all)', 'Flexi rod set', 'Blow-out on very low heat with heat protectant (occasional use)'],
    heatWarning: 'Frequent heat stretching of type 4 hair leads to heat damage — the coil pattern permanently straightens and cannot be recovered; limit heat to occasional use; always use heat protectant'
  }
};

export const ETHNIC_HAIR_ROUTINES = {
  'west-african': {
    hairTypes: 'Predominantly Type 4 (4A-4C); some 3C especially in people of mixed West African and other heritage; high diversity across the region',
    traditions: 'Shea butter (karité) application has been a West African hair tradition for centuries; palm kernel oil (PKO) used on scalp; threading (African threading) to stretch natural hair before western exposure',
    modernRoutine: 'Natural hair movement is strong in West African cities (Lagos, Accra, Nairobi); co-washing, LOC method, protective styles, natural oil treatments; Cantu, Shea Moisture, and African Pride are popular brands',
    culturalNote: 'Hair has deep cultural meaning in West African communities — braiding patterns historically conveyed social information; natural hair activism is linked to cultural identity affirmation'
  },
  'south-asian': {
    hairTypes: 'Predominantly Type 1-2 (straight to wavy); some Type 3 especially in South Indian, Sri Lankan, and Bangladeshi heritage; some 3C in Tamil communities',
    traditions: 'Champi (scalp oil massage) with warm oil is the most important South Asian hair tradition; oils used: coconut (South India, Sri Lanka), sesame/til (throughout), mustard/sarson (North India, Pakistan in winter), brahmi, bhringraj (Ayurvedic), amla (Indian gooseberry — rich in Vitamin C); oiling the hair is done weekly to biweekly and left on for several hours to overnight',
    ayurvedic: { amla: 'Vitamin C rich; promotes growth; prevents premature greying', brahmi: 'Bacopa monnieri; anti-inflammatory scalp benefits', bhringraj: 'Eclipta alba; Ayurvedic "king of hair" — promotes growth, prevents loss', shikakai: 'Acacia concinna pods; natural hair cleanser — used as a powder or paste' },
    modernRoutine: 'Many South Asian women with straight hair use minimal products (shampoo + conditioner); those with wavy-curly textures may combine South Asian traditions (oiling) with modern curly care methods'
  },
  caribbean: {
    hairTypes: 'Highly diverse; Type 3-4 most common in Afro-Caribbean communities; Type 1-3 in Indo-Caribbean and other mixed heritage communities',
    traditions: 'JBCO (Jamaican Black Castor Oil) is the iconic Caribbean hair product; the ash content in JBCO from roasted castor beans is claimed to raise scalp pH and improve absorption; castor oil for length retention and scalp health; coconut oil (grown throughout the Caribbean); bay rum historically used as a scalp tonic',
    modernRoutine: 'Natural hair movement very strong in Caribbean diaspora communities; box braids, crochet braids, protective styles; LOC method; wash-and-go for 3C-4A hair'
  },
  arab: {
    hairTypes: 'Predominantly Type 1-3 (straight to curly); Gulf and North African Arab women often have wavier or curlier hair; Levantine women often straighter; significant variation',
    
    henna: 'Red henna (Lawsonia inermis) applied to hair for colour and conditioning in many Arab and North African communities; stains hair red/orange; strengthens the shaft; antifungal properties on scalp',
    modernRoutine: 'Hair straightening and blowout culture very prevalent in many Arab countries; K18 and Olaplex treatments popular; argan oil as finishing product ubiquitous'
  },
  latina: {
    hairTypes: 'Extremely diverse based on ancestry: Type 1-4 all present; Indigenous-heritage Latinas: often Type 1; Afro-Latina: often Type 3-4; mixed heritage: wide range',
    traditions: 'Aceite de coco (coconut oil) for hair and scalp; aloe vera gel (sabila) as a natural curl gel — applied to wet hair and left to dry; avocado hair mask (aguacate) — very popular home treatment; rosemary water (agua de romero) scalp rinse for stimulation; egg and olive oil hair masks',
    bombazoStyle: 'Afro-Latina natural hair traditions align with Black hair care practices; type 4 care traditions; coily hair celebrated in movements like #AfroCubana and #AfroLatina',
    modernRoutine: 'Salon blowout culture (blowout salons are a cultural institution in many Latin American communities and diaspora neighbourhoods); Brazilian keratin treatment originated in Brazil; natural hair movement has a strong Latina expression with decolonisation lens'
  },
  'east-asian': {
    hairTypes: 'Predominantly Type 1 (straight); rare naturally occurring curl in East Asian hair; hair is characteristically thick in each strand, low porosity, very shiny when healthy; typically high density',
    traditions: 'Camellia oil (tsubaki oil) — Japanese; applied to hair as a finishing oil; pressed from camellia sinensis seeds; extraordinary shine, low comedogenic; used in Japan for centuries; available globally now as a luxury hair product. Rice water (fermented rice water) — East Asian tradition for hair; contains inositol (a form of B vitamin) which fills gaps in the hair shaft and reduces friction; fermented version contains more amino acids; Yao women in China (Huangluo village) famous for rapunzel-length hair and use of fermented rice water; Korean/Japanese rice water hair rinses became a global beauty trend in the 2010s.',
    modernRoutine: 'K-beauty hair care includes scalp scalers (chemical exfoliants for the scalp), essence for scalp, fermented ingredient hair products; hair glazes; Japanese hair salons are known for very high-quality chemical treatments including Bond Treatments (Olaplex-equivalent)',
    challenge: 'East Asian hair is resistant to chemical processing — hard to bleach, hard to perm; very high cuticle resistance; needs extended processing times'
  },
  'east-african': {
    hairTypes: 'Predominantly Type 3C-4C; Ethiopian and Somali communities often have 4A-4B with some 3C; Kenyan/Ugandan/Tanzanian communities often 4B-4C',
    traditions: 'Shea butter and castor oil widely used; Ethiopian women historically use butter (niter kibbeh) in some regions for hair conditioning; frankincense resin (bequrer) used in some communities; henna for scalp and hair colour',
    amhara_hairstyles: 'Traditional Ethiopian Amhara women wore elaborate protective braided styles; the hairstyle indicated social status, marital status, and religious affiliation in traditional communities',
    modernRoutine: 'Natural hair care aligns with African-American and West African practices; LOC method; protective styles; co-washing and deep conditioning; significant diaspora community following natural hair content creators'
  },
  'south-african': {
    hairTypes: 'Extremely diverse: Zulu, Xhosa, Sotho (predominantly Type 4); Indian South African (Type 1-3); Cape Malay and Coloured South Africans (Type 2-4 range); white South Africans (Type 1-3)',
    traditions: 'Zulu hair care: Zulu women traditionally wore their hair in specific styles indicating age and social status; oil application is traditional; Zulu women\'s shaved heads post-marriage was traditional in some communities. Rooibos (Aspalathus linearis) is a South African botanical rich in antioxidants and used in natural hair care products. Marula oil (Sclerocarya birrea) is a Southern African luxury hair oil — extraordinarily emollient; pressed from the marula tree nut',
    modernRoutine: 'Relaxed hair care is still common in Black South African communities; natural hair movement growing strongly especially post-2010; big chop movement (cutting off relaxed hair to start natural)is popular'
  },
  'black-american': {
    hairTypes: 'Predominantly Type 3-4; significant Type 4B-4C in many communities; enormous diversity',
    
    BigChop: 'The Big Chop: cutting off all relaxed (chemically straightened) or heat-damaged hair to start fresh with natural hair; an important milestone in many Black women\'s hair journeys; often described as a deeply personal and political act',
    
    protectiveStyles: 'Box braids, Senegalese twists, crochet braids, Bantu knots, wigs, and locs all important protective style options in Black American communities; locs (dreadlocks) have religious significance in Rastafarian communities and cultural expression in broader Black communities'
  }
};

export function getHairTypeSystem() {
  return HAIR_TYPE_SYSTEM;
}

export function getPorosityGuide(type) {
  if (!type) return POROSITY_OVERLAY;
  const map = {
    low: POROSITY_OVERLAY.types.low,
    medium: POROSITY_OVERLAY.types.medium,
    high: POROSITY_OVERLAY.types.high,
    test: POROSITY_OVERLAY.testingMethods
  };
  return map[type.toLowerCase()] || POROSITY_OVERLAY;
}

export function getHairRoutineByType(hairType) {
  if (!hairType) return { type1: TYPE1_ROUTINE, type2: TYPE2_ROUTINE, type3: TYPE3_ROUTINE, type4: TYPE4_ROUTINE };
  const map = {
    '1': TYPE1_ROUTINE, '1a': TYPE1_ROUTINE, '1b': TYPE1_ROUTINE, '1c': TYPE1_ROUTINE,
    '2': TYPE2_ROUTINE, '2a': TYPE2_ROUTINE, '2b': TYPE2_ROUTINE, '2c': TYPE2_ROUTINE,
    '3': TYPE3_ROUTINE, '3a': TYPE3_ROUTINE, '3b': TYPE3_ROUTINE, '3c': TYPE3_ROUTINE,
    '4': TYPE4_ROUTINE, '4a': TYPE4_ROUTINE, '4b': TYPE4_ROUTINE, '4c': TYPE4_ROUTINE,
    straight: TYPE1_ROUTINE, wavy: TYPE2_ROUTINE, curly: TYPE3_ROUTINE, coily: TYPE4_ROUTINE, kinky: TYPE4_ROUTINE
  };
  return map[hairType.toLowerCase()] || null;
}

export function getEthnicHairRoutine(communityId) {
  const directMap = {
    'west-african': ETHNIC_HAIR_ROUTINES['west-african'],
    'south-asian': ETHNIC_HAIR_ROUTINES['south-asian'],
    caribbean: ETHNIC_HAIR_ROUTINES.caribbean,
    arab: ETHNIC_HAIR_ROUTINES.arab,
    latina: ETHNIC_HAIR_ROUTINES.latina,
    'east-asian': ETHNIC_HAIR_ROUTINES['east-asian'],
    'east-african': ETHNIC_HAIR_ROUTINES['east-african'],
    'south-african': ETHNIC_HAIR_ROUTINES['south-african'],
    'black-american': ETHNIC_HAIR_ROUTINES['black-american']
  };
  return directMap[communityId] || null;
}

