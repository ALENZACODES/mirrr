/**
 * MIRRR — Minimalist Beauty Guide
 * Skinimalism, multi-use products, 1-3 step routines,
 * ingredient-focused approach, and multicultural minimalist traditions.
 */

export const MINIMALISM_PHILOSOPHY = {
  title: 'Minimalist Beauty — Philosophy & Science',
  whatItIs: {
    definition: '"Skinimalism" is the portmanteau (skin + minimalism) coined in 2021 by Pinterest Predicts (Pinterest\'s annual trend report); it refers to the trend away from 10+ step skincare routines toward pared-back, fewer products, higher ingredient quality approaches; the movement is both aesthetic (less-is-more appearance) and practical (fewer products, lower cost, less environmental impact)',
    origins: 'Ironically, minimalist skincare was partly a reaction to the explosion of Korean beauty (K-beauty) 10-step routines that became globally popular around 2015-2018; after the cultural swing toward layering, consumers began questioning whether they actually needed 10 products; the COVID-19 pandemic (2020) accelerated this shift as lockdowns eliminated the need for full coverage makeup and people adopted simpler routines',
    japaneseInfluence: 'Japanese beauty (J-beauty) was always more minimalist than K-beauty; the Japanese aesthetic concept of "less is more" (mushin, 無心 — literally "no mind" — applied to beauty as natural, effortless) has influenced the global minimalist beauty trend; Japanese skincare philosophy emphasises exceptional quality in a small number of products'
  },
  scienceOfLess: {
    ingredientInteractions: 'Layering many products creates unknown ingredient interactions; some combinations cancel each other out (niacinamide + vitamin C in some formulations), some cause irritation when used together (retinoids + AHAs + vitamin C = sensitivity stack), some block each other (heavy emollients prevent active ingredient penetration); a minimal routine eliminates most interaction concerns',
    barrierfocus: 'The minimalist philosophy aligns perfectly with the scientific understanding of barrier function; a simple, barrier-supporting routine (cleanser + moisturiser + SPF) is often more effective than a 12-step routine that includes multiple actives that disrupt the barrier',
    essentialsOnly: 'Dermatologists almost universally agree that the minimum effective skincare routine is: a gentle cleanser, a moisturiser with ceramides/humectants, and daily SPF; every other product is an enhancement for specific concerns'
  },
  sustainabilityDimension: {
    packaging: 'The beauty industry generates an estimated 120 billion units of packaging per year globally; minimalist beauty directly reduces packaging waste',
    carbonFootprint: 'Fewer products = fewer manufacturing processes, transportation trips, and disposal events; the environmental case for minimalism is strong',
    multiuse: 'Multi-use products (a tinted SPF that replaces moisturiser + SPF + light foundation; a lip and cheek product that replaces two categories) dramatically reduce packaging and product volume'
  }
};

export const CORE_MINIMALIST_SKINCARE = {
  title: 'The Minimalist Skincare Stack',
  threeStepEssential: {
    step1Cleanser: {
      what: 'A gentle, pH-balanced cleanser that removes dirt, excess oil, SPF, and makeup without disrupting the skin barrier',
      minimalistPick: 'One cleanser, used once daily in the evening (morning: rinse with cool water only); the morning cleanse is unnecessary for most skin types and strips the skin\'s overnight-repaired barrier',
      ingredients: 'Gentle surfactants: coco-glucoside, decyl glucoside; or oil/micellar cleansers; avoid SLS, SLES, or high-fragrance formulas'
    },
    step2Moisturiser: {
      what: 'A moisturiser that provides humectants (draw moisture in), emollients (fill gaps in the barrier), and occlusives (prevent moisture from escaping)',
      minimalistPick: 'ONE moisturiser that works as both AM and PM moisture; look for ceramide-containing formulas with hyaluronic acid and a light occlusive',
      ingredients: 'Ceramides, hyaluronic acid, glycerin, niacinamide (optional — brightening and barrier-supporting); petrolatum, dimethicone, or squalane as occlusives'
    },
    step3SPF: {
      what: 'Broad-spectrum sunscreen SPF 30+ every single morning, 365 days per year',
      minimalistPick: 'A tinted SPF moisturiser that replaces both the moisturiser and foundation steps; this is the single highest-impact minimalist product choice',
      evidence: 'SPF is the single most evidence-supported anti-aging skincare product; daily broad-spectrum SPF prevents photoaging (fine lines, sunspots, texture changes), reduces skin cancer risk, and prevents hyperpigmentation worsening; no other skincare product has its evidence base'
    }
  },
  addOnes: {
    optional4th: 'If adding a 4th product, a targeted treatment for the skin\'s primary concern is most logical:',
    options: ['Hyperpigmentation concern: tranexamic acid serum or kojic acid treatment', 'Anti-aging: retinoid (retinol or prescription tretinoin) at night; use in place of, not in addition to, many other actives', 'Acne: benzoyl peroxide wash or niacinamide serum', 'Dryness: a dedicated overnight sleeping mask or facial oil used occasionally (not daily)']
  }
};

export const MULTIUSE_PRODUCTS = {
  title: 'Multi-Use Products — The Minimalist\'s Toolkit',
  lipAndCheek: {
    concept: 'One cream or stick product used on both cheeks (blush) and lips (lipstick/tint); cream formulations are best for this because they blend naturally on both surfaces',
    topProducts: 'NARS The Multiple (stick format; iconic multi-use product since 2001; can be used on eyes, cheeks, lips, body); Ilia Multi-Stick; Milk Makeup Bionic Blush; RMS Beauty Lip2Cheek',
    technique: 'Apply with fingers on cheeks for natural flush; apply to lips either directly from product or with finger for a stain effect',
    ethnicNote: 'Warm terracotta, brick, and coral shades work as both blush and lip for warm skin tones (olive, warm medium, warm dark); cool berry and mauve tones work beautifully on medium-cool and deep cool skin'
  },
  tintedSPF: {
    concept: 'Combines broad-spectrum sunscreen (SPF 30-50), a light moisturiser, and a tinted coverage (replacing foundation for many uses)',
    benefits: 'One product replaces 2-3; encourages daily SPF compliance; the tint evens skin tone without the heaviness of full foundation; many formulas contain skin-benefiting ingredients',
    ethnicChallenge: 'Tinted SPF has historically been developed in a limited range of shades, often not accommodating darker skin tones; the "white cast" of mineral SPF is particularly visible in tinted products on darker skin; brands like Elta MD, Black Girl Sunscreen, and Fenty Beauty Hydrating Foundation (which functions as a tinted moisturiser) have improved dark-tone shade ranges significantly'
  },
  versatileEyeProduct: {
    concept: 'A neutral eyeshadow that also works as a brow filler or light contour shade; a dark brown eyeshadow as eyeliner; a highlighter eyeshadow as a highlight powder',
    practicalSets: 'A two-shade eyeshadow (neutral base + darker defining shade) covers eye looks for many occasions; the base shade doubles as brow fill for full brows; the dark shade can be used wet as liner'
  },
  hairAndBody: {
    concept: 'Some products work on both hair and skin: facial oils (argan, rosehip, marula) can be used on hair ends; coconut oil is a hair and body moisturiser; shea butter works on skin and hair'
  }
};

export const ONEINGREDIENT_HEROES = {
  title: 'Single-Ingredient Hero Products for Minimalists',
  vaseline: {
    uses: ['Lip balm and overnight lip mask', 'Eyelash conditioner (applied with clean fingertip)', 'Under-eye moisturiser and sleeping mask', 'Cuticle and nail conditioner', 'Heel and elbow softener', 'Cheek highlighter (applied sparingly over blush or directly)', 'Slugging (final occlusive layer for barrier repair)', 'Eyebrow gel (a fingertip of Vaseline smoothed over brows gives a natural fluffy-brow look)', 'Minor cuts and burns: petroleum jelly is the most evidence-based wound dressing for minor skin injury'],
    cost: 'Among the least expensive skincare products available; $2-5 per large jar; used sparingly, one jar lasts a year',
    science: 'Petroleum jelly is non-comedogenic (does not block pores despite its thick texture); it is one of the best-studied skin care ingredients available with excellent safety data'
  },
  rosewater: {
    uses: ['Toner (pH-balancing, hydrating)', 'Setting spray', 'Refreshing facial mist', 'Soothing aftershave', 'Hair refresher', 'Traditional bath and aromatherapy ingredient'],
    ethnicResonance: 'Rosewater is a beauty staple across Arab, South Asian, East African, and Latina communities; purchasing from traditional producers is often more affordable and authentic than Western beauty brand versions'
  },
  coconutOil: {
    uses: ['Pre-poo hair treatment', 'Hair oil for dry ends', 'Body moisturiser', 'Makeup remover (melts off waterproof makeup gently)', 'Cuticle oil', 'Lip treatment'],
    caveat: 'Coconut oil is comedogenic for many people — it blocks pores on the face for approximately 30-40% of users; use on hair, body, and lips freely; use on facial skin only if known to be tolerated',
    science: 'Coconut oil is one of the only natural oils studied in double-blind trials for moisturisation; it performs comparably to mineral oil for skin hydration; it also has some antimicrobial activity (lauric acid)'
  },
  shea: {
    uses: ['Body moisturiser', 'Hand cream', 'Hair sealant', 'Lip balm', 'Cuticle conditioner', 'Minor wound healing support', 'Post-wax soothing', 'Under-eye treatment'],
    quality: 'Unrefined (raw) shea butter is most potent and fragrance-free; refined shea is smoother and more neutral but some active ingredients are removed; both are beneficial'
  },
  squalane: {
    uses: ['Facial oil for all skin types (including acne-prone; it is non-comedogenic)', 'Body oil', 'Hair shine and frizz-control serum', 'Occlusive skincare final step'],
    note: 'Squalane is the stable, hydrogenated form of squalene (which occurs naturally in skin and in shark liver oil, but commercial squalane is now primarily derived from olives or sugarcane); extremely lightweight; mimics the skin\'s natural lipid'
  },
  castoroil: {
    uses: ['Eyebrow growth serum (applied nightly with a clean spoolie)', 'Eyelash conditioning treatment', 'Scalp treatment for growth and moisture', 'Hair sealant (JBCO for curly/coily hair)', 'Lip plumping treatment'],
    note: 'JBCO (Jamaican Black Castor Oil) is processed with ash from burned castor hulls, making it slightly alkaline and thicker than regular castor oil; specifically popular for scalp and hair growth in the Black American and Caribbean communities; evidence for lash growth is anecdotal; do not apply near eyes if there is any risk of entering the eye'
  }
};

export const MINIMALIST_MAKEUP = {
  title: 'Minimalist Makeup — High Impact, Low Products',
  fiveMinuteFace: {
    products: ['Tinted SPF or BB cream: even skin tone and protect', 'Mascara: opens eyes, defines lashes', 'Tinted lip balm or lip tint: add colour and moisture'],
    totalProducts: 3,
    time: '3-5 minutes',
    note: 'This three-product look is effective, natural, and quick; it is the baseline minimalist makeup routine'
  },
  boldLipApproach: {
    concept: 'Choose one "statement" product and keep everything else bare or near-bare; a bold lip with bare skin is a classic minimalist approach',
    routine: 'SPF moisturiser, concealer under eyes if needed, bold lip; this creates a dramatic, intentional look with minimal time and product',
    colourForSkinTone: 'A classic red lip works for nearly every skin tone but the SHADE matters: warm red/orange-red for warm undertones; cool red/blue-based red for cool undertones; try a red with brown or plum notes for very deep skin'
  },
  skinFirst: {
    concept: 'Skinimalism in makeup means investing in skin appearance (skincare, hydration, good sleep) rather than covering skin with makeup; healthy, well-hydrated skin with just SPF and a little colour is the ideal',
    dewyNoMakeupMakeup: 'The "no-makeup makeup" trend: the appearance of bare, dewy skin that is actually lightly perfected; cream products (not powder), light coverage, lip tint, glowy skin; looks effortless but requires intentional application'
  }
};

export const ETHNIC_MINIMALISM = {
  'west-african': {
    tradition: 'Traditional West African beauty before modern cosmetics was inherently minimalist: shea butter, black soap, kohl for eyes, and natural pigments; the complexity came from adornment (textiles, jewellery, beading) rather than layered skincare',
    modernMinimalism: 'A West African minimalist routine: shea butter body + skin, black soap for cleansing, SPF on face, bold lip for occasions; the emphasis on good skin and natural texture over coverage',
    minimalistProducts: ['Raw shea butter (body + hair)', 'African black soap (cleansing)', 'A bold lip in terracotta, red, or berry', 'Statement earrings to complete the look without makeup']
  },
  'south-asian': {
    tradition: 'Traditional Ayurvedic beauty is minimalist by nature: one oil, one cleanser, targeted treatments; the 10-step Korean approach is a very different tradition; South Asian minimalism uses a few high-quality multi-functional ingredients',
    modernMinimalism: 'A South Asian minimalist routine: coconut/almond oil (champi pre-treatment), a gentle cleanser, rose water toner, SPF in the morning, kajal for the eyes; the eye kohl/kajal does the heavy lifting of the makeup look',
    minimalistProducts: ['Coconut oil (hair and body)', 'Rosewater (toner, refresher, makeup prep)', 'Kajal/kohl (single-product dramatic eye)', 'A clean lip colour to complement the eye look']
  },
  caribbean: {
    tradition: 'Traditional Caribbean beauty: coconut oil, aloe vera from the garden, natural fruit-based treatments; minimalist in product number, rich in ingredient quality',
    modernMinimalism: 'A Caribbean minimalist routine: coconut oil, aloe vera gel, SPF; for occasions, a bold lip and statement jewellery',
    minimalistProducts: ['Coconut oil (universal)', 'Aloe vera gel (soothing, hydrating)', 'SPF', 'Bold lip or dramatic earrings']
  },
  arab: {
    tradition: 'Traditional Arab beauty had iconic minimalist moments: kohl on the eyes, rosewater on the face, argan oil on skin and hair; the eyes were the focus of dramatic expression and everything else was natural; this remains a powerful minimalist aesthetic',
    modernMinimalism: 'A Arab minimalist routine: argan oil or rosewater moisturiser, SPF, kohl/kajal on eyes; the smoky kohl eye with clean skin is one of the most iconic and timeless minimalist looks in global beauty history',
    minimalistProducts: ['Rosewater (toner + mist)', 'Argan oil (moisturiser + hair)', 'Kohl/kajal (dramatic eye, single product)', 'Oud perfume (cultural expression through scent, not product)']
  },
  latina: {
    tradition: 'Traditional Latina beauty varies enormously by region; indigenous traditions used natural pigments and oils; Spanish colonial influence brought European cosmetic traditions; the modern Latina beauty aesthetic often involves confident colour rather than layered neutrals',
    modernMinimalism: 'A Latina minimalist routine: SPF moisturiser, one statement product (bold lip or defined eye), body oil; the choice of one bold element with clean everything else',
    minimalistProducts: ['SPF moisturiser', 'Bold red or terracotta lip', 'Avocado or jojoba body oil', 'Hoop earrings for cultural expression without makeup']
  },
  'east-asian': {
    tradition: 'J-beauty (Japanese beauty) is inherently minimalist: fewer products of exceptional quality; the concept of mottainai (もったいない — a sense of regret over waste) applied to beauty means using less, using everything up, choosing quality',
    modernMinimalism: 'A J-beauty minimalist routine: gentle cleansing oil, one essence, SPF; the essence step is multi-functional (toner + serum + light moisturiser in one); simple, effective, luxurious',
    minimalistProducts: ['Cleansing oil (removes everything without disrupting barrier)', 'A quality essence (multi-functional)', 'Tinted SPF (replaces moisturiser + foundation)', 'A cushion compact (multi-functional, portable top-up)']
  },
  'east-african': {
    tradition: 'East African beauty traditions are inherently minimalist: frankincense resin or oil for skin, fragranced body oil, kohl for eyes; the minimalist aesthetic relies on extraordinary natural ingredients and body adornment (jewellery, textiles) rather than layered cosmetic products',
    modernMinimalism: 'An East African minimalist routine: frankincense oil or body oil, SPF, kohl; the richness comes from fragrance and ritual rather than quantity of products',
    minimalistProducts: ['Frankincense body oil (skin + ritual)', 'Kohl (eye definition, cultural resonance)', 'SPF', 'Gold jewellery for adornment without cosmetics']
  },
  'south-african': {
    tradition: 'Diverse traditions; Black South African minimalism: shea, marula, or baobab oil; rooibos-based care; the natural materials of the region are multi-functional and powerful',
    modernMinimalism: 'A South African minimalist routine: marula or baobab oil, SPF, bold colour choice',
    minimalistProducts: ['Marula oil (face + body)', 'Rooibos-infused SPF or moisturiser', 'Bold statement lip or eye colour', 'South African-heritage jewellery for cultural expression']
  },
  'black-american': {
    tradition: 'Traditional Black American beauty economy of means has always prioritised effectiveness with limited resources; shea, cocoa butter, JBCO, petroleum jelly — household staples that do more than one job; Vaseline was a beauty staple in Black American households for generations before "slugging" became a trend',
    modernMinimalism: 'A Black American minimalist routine: SPF (Black Girl Sunscreen or similar inclusive brand), Vaseline or shea butter for skin, a single bold lip or bold eye; the clean skin and statement feature approach',
    minimalistProducts: ['Vaseline or shea butter (multi-use)', 'SPF from an inclusive brand with no white cast', 'A bold, statement lip colour', 'Statement accessories for the final look']
  }
};

export function getMinimalismPhilosophy() {
  return MINIMALISM_PHILOSOPHY;
}

export function getCoreMinimalistSkincare(section) {
  if (!section) return CORE_MINIMALIST_SKINCARE;
  const map = {
    cleanser: CORE_MINIMALIST_SKINCARE.threeStepEssential.step1Cleanser,
    moisturiser: CORE_MINIMALIST_SKINCARE.threeStepEssential.step2Moisturiser,
    spf: CORE_MINIMALIST_SKINCARE.threeStepEssential.step3SPF
  };
  return map[section] || CORE_MINIMALIST_SKINCARE;
}

export function getMultiuseProducts(product) {
  if (!product) return MULTIUSE_PRODUCTS;
  const map = {
    lip: MULTIUSE_PRODUCTS.lipAndCheek,
    tinted: MULTIUSE_PRODUCTS.tintedSPF,
    spf: MULTIUSE_PRODUCTS.tintedSPF,
    eye: MULTIUSE_PRODUCTS.versatileEyeProduct,
    hair: MULTIUSE_PRODUCTS.hairAndBody
  };
  return map[product] || MULTIUSE_PRODUCTS;
}

export function getIngredientHeroes(ingredient) {
  if (!ingredient) return ONEINGREDIENT_HEROES;
  const map = {
    vaseline: ONEINGREDIENT_HEROES.vaseline,
    petroleum: ONEINGREDIENT_HEROES.vaseline,
    rosewater: ONEINGREDIENT_HEROES.rosewater,
    coconut: ONEINGREDIENT_HEROES.coconutOil,
    shea: ONEINGREDIENT_HEROES.shea,
    squalane: ONEINGREDIENT_HEROES.squalane,
    castor: ONEINGREDIENT_HEROES.castoroil,
    jbco: ONEINGREDIENT_HEROES.castoroil
  };
  return map[ingredient.toLowerCase()] || ONEINGREDIENT_HEROES;
}

export function getMinimalistMakeup(section) {
  if (!section) return MINIMALIST_MAKEUP;
  return MINIMALIST_MAKEUP[section] || MINIMALIST_MAKEUP;
}

export function getEthnicMinimalism(communityId) {
  const directMap = {
    'west-african': ETHNIC_MINIMALISM['west-african'],
    'south-asian': ETHNIC_MINIMALISM['south-asian'],
    caribbean: ETHNIC_MINIMALISM.caribbean,
    arab: ETHNIC_MINIMALISM.arab,
    latina: ETHNIC_MINIMALISM.latina,
    'east-asian': ETHNIC_MINIMALISM['east-asian'],
    'east-african': ETHNIC_MINIMALISM['east-african'],
    'south-african': ETHNIC_MINIMALISM['south-african'],
    'black-american': ETHNIC_MINIMALISM['black-american']
  };
  return directMap[communityId] || null;
}

export const MINIMALIST_BEAUTY_STATS = {
  moduleId: 'minimalist_beauty_guide',
  version: '1.0.0',
  topics: ['minimalist beauty', 'skinimalism', 'J-beauty', 'multi-use products', 'tinted SPF', 'no-makeup makeup', 'petroleum jelly uses', 'rosewater uses', 'coconut oil uses', 'squalane', 'JBCO uses', 'shea butter uses', 'three-step skincare', 'minimal makeup', 'beauty sustainability', 'ingredient heroes', 'clean beauty', 'skin first beauty'],
  communitiesSupported: 9,
  keyFacts: [
    '"Skinimalism" was identified as a top beauty trend by Pinterest Predicts in 2021; the COVID-19 pandemic (2020) accelerated the shift as lockdowns eliminated the need for full coverage makeup and people adopted simpler routines',
    'Daily broad-spectrum SPF is the single most evidence-supported anti-aging skincare product available; no other product has the same breadth of clinical evidence for photoaging prevention, skin cancer risk reduction, and hyperpigmentation prevention',
    'Petroleum jelly (Vaseline) is non-comedogenic despite its thick texture — it does not block pores; it was a staple in Black American beauty households for generations before "slugging" became a mainstream trend',
    'Japanese "mottainai" (もったいない — regret over waste) philosophy applied to beauty means using fewer, better products and using each product completely; J-beauty is inherently minimalist vs. the 10-step K-beauty approach',
    'Squalane is now derived primarily from olives or sugarcane; earlier versions from shark liver oil were unsustainable; it is non-comedogenic, mimics skin\'s natural lipids, and works on all skin and hair types',
    'The NARS The Multiple (multi-use stick for eyes, cheeks, lips, and body) has been a iconic minimalist product since its launch in 2001 and is frequently cited in minimalist beauty discussions'
  ]
};
