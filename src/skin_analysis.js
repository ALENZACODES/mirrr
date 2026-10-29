/**
 * MIRRR — Skin Analysis Engine
 * Comprehensive skin tone profiles, undertone analysis, foundation matching,
 * and skincare routines for global ethnic communities.
 * Your Taste. Your Looks. Your Style.
 */

// ===========================================================================
// FITZPATRICK SCALE — Extended for ethnic diversity
// ===========================================================================

export const FITZPATRICK_EXTENDED = {
  I: {
    id: 'I', label: 'Type I — Very Fair', hexRange: ['#fde8d8','#f9d0b8'],
    burnsTan: 'Always burns, never tans', melaninLevel: 'very-low',
    sunProtection: 'SPF 50+ always, re-apply every 90 minutes',
    communities: [], notes: 'Rare in ethnic beauty contexts; included for completeness.',
  },
  II: {
    id: 'II', label: 'Type II — Fair', hexRange: ['#f4c4a0','#ebb890'],
    burnsTan: 'Usually burns, sometimes tans', melaninLevel: 'low',
    sunProtection: 'SPF 30-50',
    communities: ['south-asian','arab','latina'],
    notes: 'Found in lighter-skinned South Asian, Northern Arab, and some Latina individuals.',
  },
  III: {
    id: 'III', label: 'Type III — Medium Fair', hexRange: ['#e8a882','#d99270'],
    burnsTan: 'Sometimes burns, usually tans', melaninLevel: 'medium-low',
    sunProtection: 'SPF 30',
    communities: ['south-asian','arab','latina','east-asian'],
    notes: 'Very common across South Asian, Latina, East Asian, and Arab communities.',
  },
  IV: {
    id: 'IV', label: 'Type IV — Medium', hexRange: ['#c98060','#b86e50'],
    burnsTan: 'Rarely burns, tans easily', melaninLevel: 'medium',
    sunProtection: 'SPF 15-30',
    communities: ['south-asian','arab','latina','east-asian','east-african'],
    notes: 'Common medium tone across multiple communities. Warm and neutral undertones both present.',
  },
  V: {
    id: 'V', label: 'Type V — Medium Deep', hexRange: ['#8b5a3a','#7a4a2e'],
    burnsTan: 'Very rarely burns, tans deeply', melaninLevel: 'high',
    sunProtection: 'SPF 15 minimum',
    communities: ['south-asian','arab','latina','east-african','west-african','caribbean','black-american','south-african'],
    notes: 'Rich medium-deep tones across South Asian, African, and Afro-diasporic communities.',
  },
  VI: {
    id: 'VI', label: 'Type VI — Deep', hexRange: ['#4a2a15','#2a1008'],
    burnsTan: 'Never burns, very deep natural pigment', melaninLevel: 'very-high',
    sunProtection: 'SPF 15 for UV protection; still important for other sun damage',
    communities: ['west-african','east-african','south-african','black-american','caribbean'],
    notes: 'The deepest Fitzpatrick category, underrepresented in traditional dermatology research. Rich melanin provides natural UV protection but requires targeted skincare.',
  },
};

// ===========================================================================
// UNDERTONE PROFILES — 9 undertones
// ===========================================================================

export const UNDERTONE_PROFILES = {
  warm_yellow: {
    id: 'warm_yellow', label: 'Warm Yellow', hexSample: '#d4a574',
    description: 'Yellow-golden undertone dominant. Most common in East Asian and South-East Asian skin.',
    detectMethod: 'Veins appear green. Gold jewellery flatters. Ivory/warm beige foundations work.',
    communities: ['east-asian'],
    foundationUndertone: 'warm', symbolRepresentedBy: 'N=W-Y in Fenty, NC-NY in MAC',
    makeupTips: ['Peachy-warm blushes','Bronze-toned contour','Gold highlight','Terracotta lip'],
    avoidMakeup: ['Bright cool pinks','Silver-blue highlight','Ashy contour'],
    skincareTips: ['Vitamin C for brightness','Niacinamide for evenness','SPF daily to preserve clarity'],
  },
  warm_golden: {
    id: 'warm_golden', label: 'Warm Golden', hexSample: '#c9964c',
    description: 'Deeply warm golden undertone. Common in South Asian, Latina, Arab, and West African individuals.',
    detectMethod: 'Veins greenish. Gold jewellery significantly more flattering than silver. Warm bronzey tones pop.',
    communities: ['south-asian','latina','arab','west-african','black-american'],
    foundationUndertone: 'warm', symbolRepresentedBy: 'W in Fenty, WN in many brands',
    makeupTips: ['Warm terracotta blush','Bronzer over highlighter','Warm brown-gold eye looks','Terracotta to orange-red lip'],
    avoidMakeup: ['Cool baby pink blush','Icy highlight','Blue-based red lip (unless for contrast)'],
    skincareTips: ['Kojic acid for hyperpigmentation','Turmeric masks (traditional South Asian)','Vitamin C serum'],
  },
  warm_red: {
    id: 'warm_red', label: 'Warm Red-Orange', hexSample: '#b5663a',
    description: 'Red-orange warm undertone. Common in West African and Caribbean communities.',
    detectMethod: 'Strong red-orange cast visible in natural light. Warm jewel tones most flattering.',
    communities: ['west-african','caribbean','black-american','south-african'],
    foundationUndertone: 'warm-red', symbolRepresentedBy: 'W in Fenty, R designation in some brands',
    makeupTips: ['Bright warm blush like peach or apricot','Rich warm bronze','Warm brown to burnt orange eye','Berry to warm red lip'],
    avoidMakeup: ['Pink-based everything','Cool toned shades that add grey'],
    skincareTips: ['Shea butter for moisture seal','Kojic acid or alpha arbutin for hyperpigmentation','Avoid harsh over-exfoliation'],
  },
  neutral: {
    id: 'neutral', label: 'Neutral', hexSample: '#c08060',
    description: 'Balanced warm and cool tones with no dominant undertone. Very versatile.',
    detectMethod: 'Both gold and silver jewellery work. Veins appear blue-green. Most shades flatter.',
    communities: ['all'],
    foundationUndertone: 'neutral', symbolRepresentedBy: 'N in most brands',
    makeupTips: ['Almost any shade works','Try nude lip','Rose-gold everything','Taupe and warm bronze'],
    avoidMakeup: ['Nothing is categorically off-limits for neutral undertones'],
    skincareTips: ['Standard routine is fine','Focus on your specific skin concerns rather than undertone-specific products'],
  },
  cool_pink: {
    id: 'cool_pink', label: 'Cool Pink', hexSample: '#c89090',
    description: 'Pink-rose cool undertone. Common in some South Asian, Arab, and East Asian individuals.',
    detectMethod: 'Veins appear blue-purple. Silver jewellery more flattering. Pink tones visible in skin.',
    communities: ['south-asian','arab','east-asian','latina'],
    foundationUndertone: 'cool', symbolRepresentedBy: 'C in Fenty, NC in MAC',
    makeupTips: ['Rose and berry blush','Silver or rose-gold highlight','Cool mauve-brown contour','Berry to cool red lip'],
    avoidMakeup: ['Orange-red lip','Too warm bronzer'],
    skincareTips: ['Niacinamide reduces redness','Green-tinted primer neutralises pink tones','Retinol for skin clarity'],
  },
  cool_red: {
    id: 'cool_red', label: 'Cool Red-Blue', hexSample: '#8a4050',
    description: 'Cool red undertone with blue-purple cast. Seen in some East African and West African individuals.',
    detectMethod: 'Blue-purple veins. Cool jewel tones most flattering. Skin has a distinctly cool cast.',
    communities: ['east-african','west-african','south-african','black-american'],
    foundationUndertone: 'cool', symbolRepresentedBy: 'C in Fenty; sometimes N1 or W for deep foundations',
    makeupTips: ['Plum and berry blush','Silver or icy pink highlight','Cool-toned contour','Deep berry or true red lip'],
    avoidMakeup: ['Warm orange-based products that clash with cool cast'],
    skincareTips: ['Azelaic acid for redness','Ceramide-rich moisturiser','Cool-toned colour corrector (green or yellow) for evening skin tone'],
  },
  olive: {
    id: 'olive', label: 'Olive', hexSample: '#8b7355',
    description: 'Green-tinted neutral to warm undertone. Common in Mediterranean-origin communities and some South Asian individuals.',
    detectMethod: 'Green-yellow-grey mixed cast. Hard to classify as warm or cool. Skin looks "muddy" in wrong foundations.',
    communities: ['arab','latina','south-asian'],
    foundationUndertone: 'olive/neutral', symbolRepresentedBy: 'O designation in some brands; varies widely',
    makeupTips: ['Warm terracotta to avoid emphasising grey','Bronze-warm gold looks best','Avoid anything too cool or too pink'],
    avoidMakeup: ['Ash-cool tones that accentuate olive-grey','Pink blush that reads muddy on olive skin'],
    skincareTips: ['Vitamin C counteracts the greenish cast over time','Exfoliate regularly to prevent dullness','Yellow-toned primer for evening'],
  },
  deep_warm: {
    id: 'deep_warm', label: 'Deep Warm', hexSample: '#5c3522',
    description: 'Warm-toned deep skin. Rich, chocolate-mahogany tones with golden or red warmth.',
    detectMethod: 'Skin appears warm, rich, not cool. Veins hard to read on deep skin — test with jewellery instead.',
    communities: ['west-african','east-african','black-american','caribbean','south-african'],
    foundationUndertone: 'warm', symbolRepresentedBy: 'W490-W590 in Fenty; 10WN+ in MAC',
    makeupTips: ['Bright bold blush pops on deep warm skin — coral, peach, warm berry','Highlight with gold, bronze, champagne','Bronze-warm eye looks','Bold lip — any warm tone works beautifully'],
    avoidMakeup: ['Ashy foundations that grey out skin','Cool-based products that dull warmth'],
    skincareTips: ['Post-inflammatory hyperpigmentation (PIH) is the major concern — alpha arbutin, kojic acid, niacinamide','Melanin-rich skin needs moisture — shea butter, hyaluronic acid','Do not over-strip with harsh actives'],
  },
  deep_cool: {
    id: 'deep_cool', label: 'Deep Cool', hexSample: '#3a2530',
    description: 'Cool-toned deep skin. Blue-ebony depth with cool, almost purple cast.',
    detectMethod: 'Skin has blue or purple tones. Cool jewel tones most flattering. Blue-based reds look best.',
    communities: ['west-african','east-african','south-african','black-american','caribbean'],
    foundationUndertone: 'cool', symbolRepresentedBy: 'C490-C590 in Fenty',
    makeupTips: ['Berry and plum blush','Icy or silver highlight','Deep berry lip for cool drama','Purple-toned eye looks'],
    avoidMakeup: ['Anything too warm that creates orange undertone','Warm bronzer without careful blending'],
    skincareTips: ['PIH is a major concern — targeted hyperpigmentation care','Hydration is key — avoid drying ingredients','Purple colour corrector can help even cool-toned hyperpigmentation'],
  },
};

// ===========================================================================
// FOUNDATION DATABASE — 45 foundations with shade matching for ethnic beauty
// ===========================================================================

export const FOUNDATIONS = {
  fenty_pro_filtr: {
    id: 'fenty_pro_filtr', brand: 'Fenty Beauty', name: 'Pro Filt\'r Soft Matte Foundation',
    coverage: 'medium-full', finish: 'matte', skinType: ['oily','combination','normal'],
    pricePoint: 'mid-high', availableShades: 40,
    shadeSystems: 'Number + letter system: 1 (lightest) to 490 (deepest). Letters: N=neutral, W=warm, C=cool.',
    ethnicRecommendations: {
      'west-african': { shades: ['490W','490N','440W','440N'], notes: 'Comprehensive deep shade range — one of the best for West African tones.' },
      'east-african': { shades: ['490C','470C','450C'], notes: 'Cool deep shades designed for this skin tone.' },
      'south-asian': { shades: ['285W','270N','310W'], notes: 'Warm medium to medium-deep range for South Asian skin.' },
      'arab': { shades: ['235W','235N','260W','285W'], notes: 'Excellent olive to medium-warm range.' },
      'latina': { shades: ['285W','310W','235W','270N'], notes: 'Warm medium tones serve most Latina skin beautifully.' },
      'east-asian': { shades: ['140N','160W','185N'], notes: 'Neutral to warm light medium shades.' },
      'black-american': { shades: ['490W','490C','490N','450W','440W'], notes: 'Full deep range — this was a revolution.' },
      'caribbean': { shades: ['440W','450W','470W','490W'], notes: 'Warm medium-deep to deep range.' },
      'south-african': { shades: ['490N','490C','470N','450N'], notes: 'Deep neutral and cool tones.' },
    },
    culturalNote: 'Rihanna launched Fenty with 40 shades in 2017, forcing the entire beauty industry to expand their dark shade ranges. A turning point for ethnic beauty.',
    rating: 4.7,
  },
  mac_studio_fix: {
    id: 'mac_studio_fix', brand: 'MAC Cosmetics', name: 'Studio Fix Fluid SPF 15',
    coverage: 'medium-full', finish: 'matte', skinType: ['oily','combination','normal'],
    pricePoint: 'mid-high', availableShades: 60,
    shadeSystems: 'N=neutral, NC=neutral cool (yellow-olive), NW=neutral warm (pink-beige). Numbers 10-65+ indicate depth.',
    ethnicRecommendations: {
      'west-african': { shades: ['NW65','NW58','NW55','NC65'], notes: 'One of the most longstanding deep shade ranges in the industry.' },
      'south-asian': { shades: ['NC35','NC40','NW35','N5'], notes: 'NC range is ideal for warm South Asian skin.' },
      'arab': { shades: ['NC30','NC35','NW30','NW35'], notes: 'NW works for olive, NC for warmer tones.' },
      'east-asian': { shades: ['NC15','NC20','N4'], notes: 'Neutral-cool lighter range.' },
      'latina': { shades: ['NC35','NC40','NC45','NW40'], notes: 'Mid-range warm shades.' },
      'black-american': { shades: ['NW65','NC65','NW55','NC55','NW50'], notes: 'Pioneer in deep dark shades.' },
      'caribbean': { shades: ['NW50','NW55','NC50'], notes: 'Warm deep coverage.' },
      'east-african': { shades: ['NW65','NC65','NW60'], notes: 'Range reaches deep enough for most East African tones.' },
      'south-african': { shades: ['NW65','NW60','NC65'], notes: 'Deep range works.' },
    },
    culturalNote: 'MAC has served Black women since the 1990s when few brands offered deep shades. A beauty industry pioneer for inclusivity.',
    rating: 4.5,
  },
  nars_natural_radiant: {
    id: 'nars_natural_radiant', brand: 'NARS', name: 'Natural Radiant Longwear Foundation',
    coverage: 'medium-buildable', finish: 'radiant', skinType: ['dry','normal','combination'],
    pricePoint: 'high', availableShades: 35,
    shadeSystems: 'Named shades — largely European-origin names but range extends deep. Deauville, Syracuse, Tahoe are deep shades.',
    ethnicRecommendations: {
      'west-african': { shades: ['Syracuse','Deauville','Tahoe'], notes: 'Range reaches deep but could be deeper.' },
      'south-asian': { shades: ['Punjab','Macao','Barcelona'], notes: 'Warm medium range works well.' },
      'arab': { shades: ['Barcelona','Macao','Macao'], notes: 'Olive-medium range.' },
      'black-american': { shades: ['Deauville','Syracuse','Tahoe'], notes: 'Deep range serviceable.' },
      'latina': { shades: ['Barcelona','Benares','Punjab'], notes: 'Warm medium tones.' },
      'east-asian': { shades: ['Gobi','Deauville Light','Light Buff'], notes: 'Lighter neutral range.' },
    },
    culturalNote: 'NARS expanded its range significantly in recent years under community pressure.',
    rating: 4.4,
  },
  sheamoisture_spf_foundation: {
    id: 'sheamoisture_spf_foundation', brand: 'SheaMoisture', name: '100% Virgin Coconut Oil Foundation with SPF 30',
    coverage: 'medium', finish: 'natural', skinType: ['dry','normal'],
    pricePoint: 'mid', availableShades: 14,
    shadeSystems: 'Named shades focusing on melanated skin tones.',
    ethnicRecommendations: {
      'west-african': { shades: ['Espresso','Mahogany','Chocolate'], notes: 'Brand specifically created for melanated skin.' },
      'black-american': { shades: ['Espresso','Mahogany','Rich Chocolate'], notes: 'This brand was built for the Black community.' },
      'caribbean': { shades: ['Caramel','Pecan','Mahogany'], notes: 'Good warm-medium to deep coverage.' },
      'south-african': { shades: ['Espresso','Mahogany'], notes: 'Deep shades available.' },
    },
    culturalNote: 'SheaMoisture was founded by Richelieu Dennis, an immigrant from Sierra Leone, to serve underserved communities of colour.',
    rating: 4.2,
  },
  pat_mcgrath_skin_fetish: {
    id: 'pat_mcgrath_skin_fetish', brand: 'Pat McGrath Labs', name: 'Skin Fetish Sublime Perfection Foundation',
    coverage: 'light-medium', finish: 'natural-skin', skinType: ['all'],
    pricePoint: 'luxury', availableShades: 36,
    shadeSystems: 'Numbers 1-36 with letters. High numbers are deepest.',
    ethnicRecommendations: {
      'west-african': { shades: ['D34','D35','D36'], notes: 'Pat McGrath is a Black British makeup artist — her deep shade range is exceptional.' },
      'black-american': { shades: ['D34','D35','D36','D33'], notes: 'Created by a Black artist, for all skin tones.' },
      'south-african': { shades: ['D32','D33','D34'], notes: 'Deep range works beautifully.' },
      'south-asian': { shades: ['MD16','MD18','MD20'], notes: 'Medium-deep warm range.' },
      'arab': { shades: ['M10','M12','MD16'], notes: 'Medium range with neutral and warm options.' },
      'latina': { shades: ['MD16','MD18','MD20','MD22'], notes: 'Warm medium-deep tones.' },
    },
    culturalNote: 'Pat McGrath — dubbed the most influential makeup artist in the world — built a brand with deep shade ranges as a priority because of her own experience.',
    rating: 4.8,
  },
  black_opal_total_coverage: {
    id: 'black_opal_total_coverage', brand: 'Black Opal', name: 'True Color Total Coverage Foundation Stick',
    coverage: 'full', finish: 'natural', skinType: ['all'],
    pricePoint: 'affordable', availableShades: 12,
    shadeSystems: 'Names focused on deep brown tones.',
    ethnicRecommendations: {
      'west-african': { shades: ['Beautiful Bronze','Truly Topaz','Heavenly Honey'], notes: 'Black Opal was created specifically for dark skin tones.' },
      'black-american': { shades: ['Beautiful Bronze','Truly Topaz','Carob'], notes: 'One of the original brands for deep skin.' },
      'caribbean': { shades: ['Heavenly Honey','Warm Caramel','Beautiful Bronze'], notes: 'Warm tones work well.' },
      'south-african': { shades: ['Beautiful Bronze','Truly Topaz'], notes: 'Available and affordable.' },
    },
    culturalNote: 'Black Opal launched in 1994 specifically to serve Black women who had limited options. Groundbreaking at the time.',
    rating: 4.2,
  },
  iman_cosmetics: {
    id: 'iman_cosmetics', brand: 'IMAN Cosmetics', name: 'Second to None Foundation SPF 8',
    coverage: 'medium', finish: 'natural', skinType: ['normal','dry'],
    pricePoint: 'mid', availableShades: 15,
    shadeSystems: 'Earth/Sand/Clay system for medium-deep tones.',
    ethnicRecommendations: {
      'west-african': { shades: ['Clay 6','Clay 7','Earth 6'], notes: 'IMAN was created by supermodel Iman specifically for women of colour.' },
      'black-american': { shades: ['Clay 6','Clay 7','Earth 5','Earth 6'], notes: 'Iman\'s personal experience guides this brand.' },
      'caribbean': { shades: ['Sand 6','Earth 5','Earth 6'], notes: 'Good warm medium-deep coverage.' },
      'south-african': { shades: ['Clay 6','Clay 7'], notes: 'Deep range reaches.' },
    },
    culturalNote: 'Iman launched this brand in 1994 after struggling to find foundation that matched her skin. She didn\'t wait for the industry — she built it.',
    rating: 4.1,
  },
  charlotte_tilbury_flawless: {
    id: 'charlotte_tilbury_flawless', brand: 'Charlotte Tilbury', name: 'Airbrush Flawless Foundation',
    coverage: 'medium-full', finish: 'natural-matte', skinType: ['all'],
    pricePoint: 'high', availableShades: 44,
    shadeSystems: '1-16 depth with N/W/C undertone codes.',
    ethnicRecommendations: {
      'south-asian': { shades: ['10 Warm','10 Neutral','11 Warm'], notes: 'Good warm medium-deep range.' },
      'arab': { shades: ['8 Warm','9 Neutral','10 Warm'], notes: 'Olive and warm medium coverage.' },
      'east-asian': { shades: ['2 Neutral','3 Cool','4 Warm'], notes: 'Light-medium range.' },
      'latina': { shades: ['9 Warm','10 Warm','11 Warm'], notes: 'Warm medium tones.' },
      'west-african': { shades: ['15 Warm','16 Warm','15 Neutral'], notes: 'Range reaches deep but Fenty is better for very deep.' },
      'black-american': { shades: ['15 Warm','16 Warm','16 Cool'], notes: 'Deep range present.' },
    },
    culturalNote: 'Charlotte Tilbury expanded significantly to serve a global customer base.',
    rating: 4.5,
  },
  makeup_forever_ultra: {
    id: 'makeup_forever_ultra', brand: 'Make Up For Ever', name: 'Ultra HD Invisible Cover Foundation',
    coverage: 'light-medium', finish: 'natural', skinType: ['all'],
    pricePoint: 'high', availableShades: 40,
    shadeSystems: 'Y=yellow, R=pink, N=neutral with numbers indicating depth.',
    ethnicRecommendations: {
      'east-asian': { shades: ['Y218','Y225','Y235'], notes: 'Yellow-warm range excellent for East Asian undertones.' },
      'south-asian': { shades: ['Y245','Y315','Y325'], notes: 'Yellow-warm medium range.' },
      'arab': { shades: ['N245','N315','Y315'], notes: 'Neutral to yellow-warm coverage.' },
      'west-african': { shades: ['Y505','Y515','R530'], notes: 'Deep warm range.' },
      'black-american': { shades: ['Y505','Y515','R530','N530'], notes: 'Deep range available.' },
      'latina': { shades: ['Y325','Y345','Y365'], notes: 'Warm medium range.' },
    },
    culturalNote: 'Professional brand with strong deep and diverse shade range.',
    rating: 4.4,
  },
  uoma_beauty_say_what: {
    id: 'uoma_beauty_say_what', brand: 'UOMA Beauty', name: 'Say What?! Foundation',
    coverage: 'medium-full', finish: 'natural-satin', skinType: ['all'],
    pricePoint: 'mid-high', availableShades: 51,
    shadeSystems: 'T=tawny, B=brown, C=chocolate, P=pearl for undertone families with numbers.',
    ethnicRecommendations: {
      'west-african': { shades: ['Black Pearl T3N','Black Pearl T2N','Black Pearl T1W'], notes: 'UOMA was founded by Sharon Chuter, a Nigerian-British beauty executive. Deep shade range is exceptional.' },
      'black-american': { shades: ['Black Pearl T3N','Black Pearl T3C','Ebony Gold T2W'], notes: 'Created by and for melanated communities.' },
      'east-african': { shades: ['Black Pearl T3C','Ebony Gold T3C'], notes: 'Cool deep range.' },
      'south-african': { shades: ['Black Pearl T3N','Ebony Gold T2N'], notes: 'Comprehensive deep range.' },
      'caribbean': { shades: ['Ebony Gold T2W','Brown Sugar T3W'], notes: 'Warm deep range.' },
      'south-asian': { shades: ['Bronze Venus T3W','Honey Brown T2W'], notes: 'Warm medium-deep coverage.' },
    },
    culturalNote: 'Sharon Chuter launched UOMA and the #PullUpOrShutUp campaign calling out brands that didn\'t hire diverse teams while selling to diverse communities.',
    rating: 4.6,
  },
};

// ===========================================================================
// SKINCARE INGREDIENTS — 50 entries focused on ethnic skin concerns
// ===========================================================================

export const SKINCARE_INGREDIENTS = {
  // ── Hyperpigmentation / Even Skin Tone ──
  kojic_acid: {
    id: 'kojic_acid', name: 'Kojic Acid', category: 'brightening',
    benefit: 'Inhibits melanin production. Reduces dark spots and uneven tone.',
    concentrationRange: '1-2%', pHRange: '3.5-5.5',
    origin: 'Derived from fungi, used in traditional Japanese sake production',
    culturalContext: 'Used in Japanese skin brightening for centuries. Now a staple for hyperpigmentation in melanated skin.',
    communities: ['all — especially beneficial for east-asian','south-asian','west-african','black-american'],
    compatibleWith: ['niacinamide','alpha_arbutin','azelaic_acid','vitamin_c'],
    conflictsWith: ['benzoyl_peroxide_same_time'],
    ethnicSkinNote: 'Particularly effective for post-inflammatory hyperpigmentation (PIH) common after acne in darker skin tones.',
    frequency: 'AM or PM, daily', spfRequired: true,
  },
  alpha_arbutin: {
    id: 'alpha_arbutin', name: 'Alpha Arbutin', category: 'brightening',
    benefit: 'Gentle tyrosinase inhibitor. Fades dark spots without irritation.',
    concentrationRange: '0.5-2%', pHRange: '4-7',
    origin: 'Derived from bearberry plant. Found in East Asian traditional medicine.',
    culturalContext: 'Bearberry (uva ursi) used in East Asian herbalism. Alpha arbutin is the synthesised, more stable form.',
    communities: ['all'],
    compatibleWith: ['niacinamide','vitamin_c','kojic_acid','hyaluronic_acid'],
    conflictsWith: [],
    ethnicSkinNote: 'Gentler than hydroquinone. Safe for Fitzpatrick IV-VI where stronger actives can cause irritation and rebound hyperpigmentation.',
    frequency: 'AM and/or PM, daily', spfRequired: true,
  },
  niacinamide: {
    id: 'niacinamide', name: 'Niacinamide (Vitamin B3)', category: 'brightening',
    benefit: 'Reduces pigment transfer, minimises pores, controls oil, strengthens barrier.',
    concentrationRange: '2-10%', pHRange: '5-7',
    origin: 'Vitamin B3, water-soluble. Present in many foods.',
    culturalContext: 'Traditional diets rich in niacin (West African peanut stew, South Asian dal) historically contributed to skin health.',
    communities: ['all'],
    compatibleWith: ['most_ingredients'],
    conflictsWith: ['vitamin_c_high_concentration_same_time'],
    ethnicSkinNote: 'Among the safest and most effective brighteners for all skin tones. Excellent for oily skin common in tropical climates.',
    frequency: 'AM and PM, daily', spfRequired: false,
  },
  vitamin_c: {
    id: 'vitamin_c', name: 'Vitamin C (L-Ascorbic Acid)', category: 'brightening',
    benefit: 'Antioxidant, collagen synthesis support, brightens, fades pigmentation.',
    concentrationRange: '5-20%', pHRange: '2.5-3.5',
    origin: 'Essential vitamin found across fruits and vegetables.',
    culturalContext: 'Traditional vitamin C sources: amla (Indian gooseberry) in Ayurvedic medicine, baobab in West African tradition, rosehip in South American herbalism.',
    communities: ['all'],
    compatibleWith: ['vitamin_e','ferulic_acid','hyaluronic_acid'],
    conflictsWith: ['niacinamide_high_concentration','benzoyl_peroxide','retinol_same_routine'],
    ethnicSkinNote: 'Effective but can be irritating at high concentrations. Derivatives like ascorbyl glucoside or 3-O-Ethyl Ascorbic Acid are gentler for sensitive darker skin.',
    frequency: 'AM preferred', spfRequired: true,
  },
  azelaic_acid: {
    id: 'azelaic_acid', name: 'Azelaic Acid', category: 'brightening',
    benefit: 'Reduces hyperpigmentation, anti-bacterial, anti-inflammatory.',
    concentrationRange: '10-20%', pHRange: '4-5',
    origin: 'Naturally found in grains (wheat, rye, barley). Also synthesised.',
    culturalContext: 'Whole grain diets in Arab and South Asian cuisines historically linked to clearer skin. Now available in topical form.',
    communities: ['all — especially arab','south-asian'],
    compatibleWith: ['niacinamide','alpha_arbutin','retinol'],
    conflictsWith: [],
    ethnicSkinNote: 'Particularly good for PIH and for rosacea in medium skin tones. Safe for pregnancy (important in communities with larger families).',
    frequency: 'PM, 1-2x weekly to start, build up', spfRequired: true,
  },
  tranexamic_acid: {
    id: 'tranexamic_acid', name: 'Tranexamic Acid', category: 'brightening',
    benefit: 'Fades melasma and stubborn hyperpigmentation. Anti-inflammatory.',
    concentrationRange: '2-5%', pHRange: '4-6',
    origin: 'Developed as a medical drug, now adapted for topical use.',
    culturalContext: 'Particularly relevant for South Asian and Latina communities where melasma (mask of pregnancy) is more prevalent.',
    communities: ['south-asian','latina','arab','east-asian'],
    compatibleWith: ['niacinamide','alpha_arbutin','vitamin_c'],
    conflictsWith: [],
    ethnicSkinNote: 'One of the most effective ingredients for melasma which disproportionately affects women of colour, especially post-pregnancy.',
    frequency: 'AM and PM', spfRequired: true,
  },
  bakuchiol: {
    id: 'bakuchiol', name: 'Bakuchiol', category: 'anti-aging',
    benefit: 'Plant-based retinol alternative. Reduces fine lines, brightens, anti-inflammatory.',
    concentrationRange: '0.5-2%', pHRange: '5-7',
    origin: 'Extracted from Psoralea corylifolia seeds. Used in Ayurvedic medicine as "babchi".',
    culturalContext: 'Babchi (the source plant) has been used in South Asian traditional medicine for skin conditions for thousands of years. Modern science validated its retinol-like effects.',
    communities: ['south-asian','all'],
    compatibleWith: ['almost_everything','niacinamide','vitamin_c','aha_bha'],
    conflictsWith: [],
    ethnicSkinNote: 'Excellent retinol alternative for darker skin tones where retinol can cause excessive irritation and rebound PIH.',
    frequency: 'PM, can start daily from the beginning', spfRequired: false,
  },
  retinol: {
    id: 'retinol', name: 'Retinol', category: 'anti-aging',
    benefit: 'Speeds cell turnover, reduces fine lines, treats acne, fades pigmentation.',
    concentrationRange: '0.025-1%', pHRange: '5-6',
    origin: 'Vitamin A derivative.',
    culturalContext: 'Anti-aging in communities traditionally focused on natural preservatives — community research increasingly led to retinol adoption.',
    communities: ['all — with caution for Fitzpatrick IV-VI'],
    compatibleWith: ['hyaluronic_acid','ceramides','niacinamide_barrier_support'],
    conflictsWith: ['vitamin_c_same_time','aha_bha_same_time','benzoyl_peroxide_same_time'],
    ethnicSkinNote: 'Risk of PIH and purging in deeper skin tones. Start at lowest concentration (0.025-0.05%), apply every 3 nights, build slowly. Never skip SPF.',
    frequency: 'PM only, 2-3x per week to start', spfRequired: true,
  },

  // ── Hydration ──
  hyaluronic_acid: {
    id: 'hyaluronic_acid', name: 'Hyaluronic Acid', category: 'hydration',
    benefit: 'Humectant — draws moisture into skin. Plumps, smooths, hydrates all skin types.',
    concentrationRange: '0.1-2%', pHRange: '5-7',
    origin: 'Naturally produced by the body. Topical versions biotechnologically derived.',
    culturalContext: 'Hydration is universally valued. Rice water (East Asian tradition), aloe vera (African and Caribbean tradition), rose water (Arab and South Asian tradition) are all traditional hydrators.',
    communities: ['all'],
    compatibleWith: ['everything'],
    conflictsWith: [],
    ethnicSkinNote: 'Apply to damp skin, especially in dry climates (common in Arab, North African regions). In humid climates (West Africa, Caribbean), lighter humectants may be sufficient.',
    frequency: 'AM and PM', spfRequired: false,
  },
  ceramides: {
    id: 'ceramides', name: 'Ceramides', category: 'barrier',
    benefit: 'Restore and strengthen skin barrier. Reduce trans-epidermal water loss.',
    concentrationRange: '0.5-3%', pHRange: '5-6',
    origin: 'Lipids naturally present in skin. Topical versions synthetically made.',
    culturalContext: 'Shea butter (West Africa), argan oil (Morocco), jojoba oil (indigenous Mesoamerican) are all traditional ceramide-supporting ingredients.',
    communities: ['all'],
    compatibleWith: ['everything'],
    conflictsWith: [],
    ethnicSkinNote: 'Essential for those with eczema — more prevalent in some ethnic communities (West African, Black American). Also key after aggressive chemical treatments.',
    frequency: 'AM and PM', spfRequired: false,
  },
  shea_butter: {
    id: 'shea_butter', name: 'Shea Butter', category: 'moisturiser',
    benefit: 'Deep moisturiser, anti-inflammatory, contains natural SPF, wound healing.',
    concentrationRange: '10-100%', pHRange: 'NA (oil)',
    origin: 'From the karite tree nut, native to West and East Africa.',
    culturalContext: 'Shea butter has been used across West, East, and Central African communities for centuries — for skin, hair, cooking, and wound healing. One of Africa\'s most sacred beauty and health ingredients.',
    communities: ['west-african','east-african','black-american','caribbean','south-african'],
    compatibleWith: ['most_ingredients'],
    conflictsWith: [],
    ethnicSkinNote: 'The foundational moisturiser for melanated skin. Particularly effective at preventing PIH by reducing inflammation. Choose raw, unrefined shea for maximum benefit.',
    frequency: 'PM, or as needed for dry patches', spfRequired: false,
  },
  squalane: {
    id: 'squalane', name: 'Squalane', category: 'moisturiser',
    benefit: 'Lightweight oil that mimics skin\'s own sebum. Non-comedogenic, antioxidant.',
    concentrationRange: '5-100%', pHRange: 'NA (oil)',
    origin: 'Originally from shark liver oil; now primarily from sugarcane or olive.',
    culturalContext: 'Olive oil (Mediterranean/Arab), moringa oil (East/West Africa) — traditional lightweight face oils now validated by modern cosmetic chemistry.',
    communities: ['all'],
    compatibleWith: ['everything'],
    conflictsWith: [],
    ethnicSkinNote: 'Ideal for oily skin that still needs moisture. Works in humid climates without clogging pores. Very popular in K-beauty routines.',
    frequency: 'AM and PM', spfRequired: false,
  },
  aloe_vera: {
    id: 'aloe_vera', name: 'Aloe Vera', category: 'soothing',
    benefit: 'Soothes irritation, hydrates, anti-inflammatory, helps with sunburn.',
    concentrationRange: '10-100%', pHRange: '4.5-5.5',
    origin: 'Succulent plant native to the Arabian Peninsula. Grown globally.',
    culturalContext: 'Used across Caribbean, West African, South Asian, Arab, and Mesoamerican traditional medicine for skin and wound healing for centuries.',
    communities: ['all'],
    compatibleWith: ['everything'],
    conflictsWith: [],
    ethnicSkinNote: 'Excellent post-sun soother. Helps reduce inflammation that leads to PIH in darker skin. Natural form (gel from the leaf) is most effective.',
    frequency: 'AM and PM, or as needed', spfRequired: false,
  },
  rosehip_oil: {
    id: 'rosehip_oil', name: 'Rosehip Seed Oil', category: 'brightening',
    benefit: 'Contains natural retinoids and vitamin C. Brightens, reduces scars and pigmentation.',
    concentrationRange: '5-100%', pHRange: 'NA (oil)',
    origin: 'Cold-pressed from Rosa canina seeds. South America and Eastern Europe traditional uses.',
    culturalContext: 'Chilean indigenous (Mapuche) traditional use. Now globally adopted. South American beauty staple.',
    communities: ['latina','all'],
    compatibleWith: ['most_oils','niacinamide'],
    conflictsWith: ['vitamin_c_high_dose_possible_irritation'],
    ethnicSkinNote: 'Gentle enough for sensitive darker skin. Good for surgical and PIH scars common after acne breakouts.',
    frequency: 'PM', spfRequired: false,
  },

  // ── Traditional / Cultural ──
  amla_oil: {
    id: 'amla_oil', name: 'Amla Oil (Indian Gooseberry)', category: 'hair-skin',
    benefit: 'Rich in vitamin C, antioxidants, and fatty acids. Hair growth, scalp health, skin brightening.',
    concentrationRange: 'Traditional use, undiluted to 50%', pHRange: 'NA (oil)',
    origin: 'Indian gooseberry (Phyllanthus emblica), native to tropical Southeast Asia.',
    culturalContext: 'One of the most revered plants in Ayurvedic medicine. Used for thousands of years for hair, skin, and internal health across South Asia.',
    communities: ['south-asian'],
    compatibleWith: ['coconut_oil','sesame_oil'],
    conflictsWith: [],
    ethnicSkinNote: 'Traditional South Asian hair and scalp treatment. As face oil, very brightening due to high vitamin C content.',
    frequency: 'Weekly hair treatment, or as directed', spfRequired: false,
  },
  argan_oil: {
    id: 'argan_oil', name: 'Argan Oil', category: 'moisturiser',
    benefit: 'Rich in vitamin E and fatty acids. Moisturises, adds shine to hair, reduces inflammation.',
    concentrationRange: '5-100%', pHRange: 'NA (oil)',
    origin: 'Argania spinosa tree, native to Morocco. Produced exclusively in Morocco.',
    culturalContext: 'Known as "liquid gold" in Morocco. Berber women have produced and used argan oil for hair and skin for generations. UNESCO protected cultural heritage process.',
    communities: ['arab','all'],
    compatibleWith: ['everything'],
    conflictsWith: [],
    ethnicSkinNote: 'Excellent hair oil for Arab hair types. Anti-inflammatory properties help with acne scarring on medium-deep skin tones.',
    frequency: 'PM for face, anytime for hair', spfRequired: false,
  },
  black_seed_oil: {
    id: 'black_seed_oil', name: 'Black Seed Oil (Nigella Sativa)', category: 'healing',
    benefit: 'Anti-inflammatory, anti-bacterial, antioxidant. Traditional multi-purpose healing oil.',
    concentrationRange: '1-5%', pHRange: 'NA (oil)',
    origin: 'Nigella sativa, cultivated across the Middle East, South Asia, and North Africa.',
    culturalContext: 'Prophetic medicine in Islamic tradition — known as "Habbatus Sauda". Used by Arab, South Asian, and East African Muslim communities for centuries as a cure for "everything except death".',
    communities: ['arab','south-asian','east-african','west-african'],
    compatibleWith: ['most_oils'],
    conflictsWith: [],
    ethnicSkinNote: 'Traditional treatment for eczema and psoriasis. Anti-inflammatory properties may help prevent PIH. Significant cultural meaning across Muslim communities.',
    frequency: 'Daily if tolerated, start with diluted application', spfRequired: false,
  },
  turmeric: {
    id: 'turmeric', name: 'Turmeric (Curcumin)', category: 'brightening',
    benefit: 'Anti-inflammatory, antioxidant, brightening. Curcumin reduces melanin production.',
    concentrationRange: '0.5-2% curcumin extract', pHRange: '5-6',
    origin: 'Curcuma longa, native to South Asia. Cultivated across South and Southeast Asia.',
    culturalContext: 'Haldi ceremony in South Asian weddings — turmeric paste applied to skin before the wedding for brightening and blessing. Used across India, Pakistan, Bangladesh for skin care for millennia.',
    communities: ['south-asian'],
    compatibleWith: ['honey','gram_flour_traditional_use'],
    conflictsWith: [],
    ethnicSkinNote: 'Traditional haldi mask is 1:1 turmeric and raw honey with a dash of milk or rosewater. Modern topical curcumin is more stable and effective. May stain — use sparingly and rinse well.',
    frequency: 'Weekly mask (traditional), or 3x weekly topical serum', spfRequired: true,
  },
  rooibos: {
    id: 'rooibos', name: 'Rooibos Extract', category: 'antioxidant',
    benefit: 'Rich in antioxidants, anti-inflammatory, soothes skin.',
    concentrationRange: '1-5%', pHRange: '5-6',
    origin: 'Aspalathus linearis, endemic to Cederberg region of South Africa.',
    culturalContext: 'Rooibos (red bush) has been used by indigenous Khoisan people of South Africa for centuries as a soothing tea and skin remedy. Now South Africa\'s most famous botanical export.',
    communities: ['south-african','all'],
    compatibleWith: ['everything'],
    conflictsWith: [],
    ethnicSkinNote: 'South African botanical pride. Excellent for sensitive skin and redness. Works well as a soothing toner base.',
    frequency: 'AM and PM', spfRequired: false,
  },
  baobab_oil: {
    id: 'baobab_oil', name: 'Baobab Oil', category: 'moisturiser',
    benefit: 'Rich in vitamins A, D, E, F. Deep moisturiser, improves elasticity.',
    concentrationRange: '5-100%', pHRange: 'NA (oil)',
    origin: 'Adansonia (baobab tree), native to sub-Saharan Africa and Madagascar.',
    culturalContext: 'The baobab is called the "Tree of Life" across African cultures. Its oil has been used in West, East, and Southern African communities for skin and hair for generations.',
    communities: ['west-african','east-african','south-african','black-american'],
    compatibleWith: ['everything'],
    conflictsWith: [],
    ethnicSkinNote: 'Exceptional for very dry, deep skin tones. Non-comedogenic despite being an oil. Traditional African beauty ingredient gaining global recognition.',
    frequency: 'PM', spfRequired: false,
  },
  moringa_oil: {
    id: 'moringa_oil', name: 'Moringa Oil', category: 'moisturiser',
    benefit: 'High behenic acid content. Anti-aging, clarifying, moisturising.',
    concentrationRange: '5-100%', pHRange: 'NA (oil)',
    origin: 'Moringa oleifera, native to South Asia and East Africa.',
    culturalContext: 'The "drumstick tree" is used across South Asia and East Africa for nutrition and beauty. Egyptian royalty historically used moringa as a skin and hair oil.',
    communities: ['south-asian','east-african','west-african'],
    compatibleWith: ['everything'],
    conflictsWith: [],
    ethnicSkinNote: 'Particularly good for combination skin in humid climates. Traditional East African beauty staple.',
    frequency: 'AM or PM', spfRequired: false,
  },
  rice_water: {
    id: 'rice_water', name: 'Rice Water', category: 'brightening',
    benefit: 'Contains inositol, ferulic acid. Brightens, smooths, strengthens hair and skin.',
    concentrationRange: 'Traditional use, 10-50% in products', pHRange: '4-5',
    origin: 'Fermented or plain rinse water from washed rice.',
    culturalContext: 'Yao women of Huangluo village in China have used fermented rice water on their hair for generations — they are famous for floor-length hair. Also used in Japanese beauty (bihaku) and Korean skin care.',
    communities: ['east-asian'],
    compatibleWith: ['most_ingredients'],
    conflictsWith: [],
    ethnicSkinNote: 'Traditional East Asian hair and skin treatment validated by modern science. Fermented rice water more effective than plain. Works for all skin tones.',
    frequency: 'AM as toner or PM rinse', spfRequired: false,
  },
  camellia_oil: {
    id: 'camellia_oil', name: 'Tsubaki / Camellia Oil', category: 'moisturiser',
    benefit: 'High in oleic acid. Lightweight, absorbs fast, high shine for hair.',
    concentrationRange: '5-100%', pHRange: 'NA (oil)',
    origin: 'Camellia japonica and sinensis, cultivated in Japan, China, and Korea.',
    culturalContext: 'Tsubaki oil has been a Japanese beauty staple for centuries. Geisha used it on hair, skin, and to remove makeup. Japan\'s answer to argan oil.',
    communities: ['east-asian'],
    compatibleWith: ['everything'],
    conflictsWith: [],
    ethnicSkinNote: 'Light enough to not clog pores. Excellent for East Asian skin types. Exceptional hair shine product — traditional Japanese ritual.',
    frequency: 'PM for face, anytime for hair', spfRequired: false,
  },
  coconut_oil: {
    id: 'coconut_oil', name: 'Coconut Oil', category: 'moisturiser',
    benefit: 'Antifungal, antimicrobial, deep moisturiser for hair. Medium-chain fatty acids.',
    concentrationRange: '5-100%', pHRange: 'NA (oil)',
    origin: 'Cocos nucifera, pantropical distribution.',
    culturalContext: 'Used for hair and skin across Caribbean, South Asian, Pacific Islander, and Southeast Asian cultures. Virgin coconut oil is a beauty staple in Sri Lanka, Philippines, Jamaica, and across the tropical world.',
    communities: ['south-asian','caribbean','east-asian','west-african'],
    compatibleWith: ['most_ingredients_hair'],
    conflictsWith: [],
    ethnicSkinNote: 'COMEDOGENIC for many — can clog pores on oily and acne-prone skin. Better for hair than face. Excellent hair pre-wash treatment (pre-poo in natural hair community).',
    frequency: 'Hair treatment weekly; face only for very dry skin with caution', spfRequired: false,
  },

  // ── Acne + PIH Focus ──
  salicylic_acid: {
    id: 'salicylic_acid', name: 'Salicylic Acid (BHA)', category: 'exfoliant',
    benefit: 'Oil-soluble exfoliant, penetrates pores, treats acne, reduces blackheads.',
    concentrationRange: '0.5-2%', pHRange: '3-4',
    origin: 'Found naturally in willow bark, meadowsweet. Widely synthesised.',
    culturalContext: 'Willow bark used in traditional healing across Europe and North America. Synthesised salicylic acid is now a global acne treatment.',
    communities: ['all — especially oily skin common in tropical climates'],
    compatibleWith: ['niacinamide','azelaic_acid'],
    conflictsWith: ['vitamin_c_high_dose_same_time','retinol_same_step'],
    ethnicSkinNote: 'Acne in deeper skin tones always leaves PIH marks. Preventing acne is preventing PIH. Salicylic acid is the front-line acne fighter.',
    frequency: 'AM or PM (not both), 3-5x per week', spfRequired: true,
  },
  benzoyl_peroxide: {
    id: 'benzoyl_peroxide', name: 'Benzoyl Peroxide', category: 'acne',
    benefit: 'Kills acne-causing bacteria. Very effective for inflammatory acne.',
    concentrationRange: '2.5-10%', pHRange: '3-4',
    origin: 'Synthesised compound, widely used since 1960s.',
    culturalContext: 'Standard acne treatment globally. Must be used with additional care in darker skin due to bleaching effect on fabric and potential for irritation.',
    communities: ['all — with extra care for Fitzpatrick V-VI'],
    compatibleWith: ['moisturiser'],
    conflictsWith: ['vitamin_c','retinol_same_time','most_actives_same_step'],
    ethnicSkinNote: 'Can cause irritation that leads to PIH in darker skin tones. Use 2.5% concentration (same efficacy as 10%, far less irritation). Always follow with moisturiser. Protect pillowcase — bleaches fabric.',
    frequency: 'PM, start 2x per week', spfRequired: true,
  },
  glycolic_acid: {
    id: 'glycolic_acid', name: 'Glycolic Acid (AHA)', category: 'exfoliant',
    benefit: 'Surface exfoliant, removes dead skin cells, brightens, reduces fine lines.',
    concentrationRange: '5-10% leave-on, up to 70% chemical peel', pHRange: '3-4',
    origin: 'Sugarcane-derived alpha hydroxy acid.',
    culturalContext: 'Chemical exfoliation practices have pre-modern roots — ancient Egyptian milk baths (lactic acid), fruit acid masks in various traditions.',
    communities: ['all — with caution for Fitzpatrick V-VI'],
    compatibleWith: ['niacinamide_as_buffer','ceramides_after'],
    conflictsWith: ['vitamin_c_same_time','retinol_same_step','bha_same_step'],
    ethnicSkinNote: 'Can cause photosensitivity and rebound hyperpigmentation if not used with SPF. Lactic acid (gentler) preferred for sensitive deeper skin tones.',
    frequency: 'PM, 2-3x per week', spfRequired: true,
  },
  lactic_acid: {
    id: 'lactic_acid', name: 'Lactic Acid (AHA)', category: 'exfoliant',
    benefit: 'Gentler than glycolic acid. Exfoliates, brightens, hydrates simultaneously.',
    concentrationRange: '5-12%', pHRange: '3.5-4.5',
    origin: 'Milk-derived or synthesised. Naturally occurring in many fermented foods.',
    culturalContext: 'Traditional milk baths (Cleopatra, ancient Indian dairy masks) and fermented lactic acid treatments have historical roots in multiple cultures.',
    communities: ['all'],
    compatibleWith: ['hyaluronic_acid','ceramides','niacinamide'],
    conflictsWith: ['retinol_same_step','vitamin_c_high_conc_same_step'],
    ethnicSkinNote: 'Best AHA choice for darker skin tones. Large molecule means gentler penetration and lower risk of triggering PIH.',
    frequency: 'PM, 2-3x per week', spfRequired: true,
  },

  // ── Sun Protection ──
  zinc_oxide: {
    id: 'zinc_oxide', name: 'Zinc Oxide', category: 'sunscreen',
    benefit: 'Broad-spectrum UVA/UVB protection. Physical blocker. Anti-inflammatory.',
    concentrationRange: '5-25%', pHRange: 'NA (mineral)',
    origin: 'Naturally occurring mineral.',
    culturalContext: 'Physical sunscreens with zinc oxide are favoured in communities concerned about chemical sunscreen absorption.',
    communities: ['all'],
    compatibleWith: ['everything'],
    conflictsWith: [],
    ethnicSkinNote: 'Traditionally left a white cast on deep skin tones — a major barrier to sunscreen adoption in melanated communities. Modern micronised and tinted zinc oxide formulas are much better. White cast still possible with unformulated zinc oxide.',
    frequency: 'Every morning, reapply every 2 hours', spfRequired: false,
  },
  spf_for_dark_skin: {
    id: 'spf_for_dark_skin', name: 'SPF for Melanated Skin — Special Notes', category: 'sunscreen',
    benefit: 'UV protection is still important for all skin tones. Melanin provides some natural protection (estimated SPF 13 in Type VI skin) but NOT full protection.',
    concentrationRange: 'SPF 15-30 minimum recommended', pHRange: 'NA',
    origin: 'Formulation notes.',
    culturalContext: 'Many melanated communities have historically under-used SPF due to the false belief that dark skin does not need sun protection, and due to cosmetic issues (white cast, ashiness).',
    communities: ['west-african','east-african','black-american','south-african','caribbean'],
    compatibleWith: ['everything'],
    conflictsWith: [],
    ethnicSkinNote: 'SPF is still necessary for: preventing skin cancer (yes, Black skin can get melanoma), preventing PIH worsening, preventing melasma, and anti-aging. Tinted mineral SPFs, chemical SPFs (avobenzone, tinosorb), and Korean sunscreen formulas avoid the white cast problem.',
    frequency: 'Every morning without exception', spfRequired: false,
  },
};

// ===========================================================================
// SKINCARE ROUTINES — 9 community-specific routines
// ===========================================================================

export const SKINCARE_ROUTINES = {
  'west-african': {
    communityId: 'west-african',
    label: 'West African Skin — The MIRRR Routine',
    primaryConcerns: ['Post-inflammatory hyperpigmentation (PIH)','Uneven skin tone','Acne in humid climates','Dryness during dry season (Harmattan)'],
    skinCharacteristics: 'Often oily to combination skin in tropical climates. Deep melanin provides natural UV protection but PIH is the #1 skin challenge.',
    morning: [
      { step: 1, product: 'Gentle foaming cleanser', ingredient: 'Sulfate-free surfactant', reason: 'Remove overnight sebum without stripping' },
      { step: 2, product: 'Vitamin C serum', ingredient: 'Ascorbic acid or ascorbyl glucoside', reason: 'Antioxidant protection + brightening' },
      { step: 3, product: 'Niacinamide serum', ingredient: 'Niacinamide 5-10%', reason: 'Pore minimising, oil control, pigmentation' },
      { step: 4, product: 'Lightweight moisturiser', ingredient: 'Hyaluronic acid, squalane', reason: 'Hydration without clogging pores' },
      { step: 5, product: 'SPF 30-50', ingredient: 'Chemical SPF (no white cast)', reason: 'UV protection still necessary despite melanin' },
    ],
    evening: [
      { step: 1, product: 'Double cleanse', ingredient: 'Oil cleanser then water-based', reason: 'Remove SPF + makeup thoroughly' },
      { step: 2, product: 'Alpha arbutin serum', ingredient: 'Alpha arbutin 2%', reason: 'Fade existing PIH marks' },
      { step: 3, product: 'Retinol (2-3x per week)', ingredient: 'Retinol 0.025-0.1%', reason: 'Cell turnover, PIH, anti-aging' },
      { step: 4, product: 'Shea butter moisturiser', ingredient: '100% unrefined shea butter', reason: 'Traditional West African moisturiser — deep hydration + anti-inflammatory' },
    ],
    weeklyTreatments: [
      { treatment: 'Turmeric and honey mask', frequency: 'Weekly', benefit: 'Traditional brightening treatment' },
      { treatment: 'Lactic acid exfoliant (10%)', frequency: 'Once per week', benefit: 'Chemical exfoliation without irritation' },
    ],
    traditionalRemedies: ['Shea butter as everything moisturiser','Black soap (African black soap) for cleansing — excellent for acne','Baobab oil for dry skin patches','Camwood powder brightening mask'],
    culturalNote: 'West African beauty has always celebrated radiant, even-toned skin. "Flawless" in Yoruba beauty tradition is called "awo dara" (beautiful skin). The modern PIH-focused skincare routine builds on this cultural priority.',
    buildaRoutineOrder: ['gentle_cleanser','vitamin_c','niacinamide','hyaluronic_acid','spf_am','shea_butter_pm','alpha_arbutin_pm','retinol_2x_week'],
  },
  'south-asian': {
    communityId: 'south-asian',
    label: 'South Asian Skin — The MIRRR Routine',
    primaryConcerns: ['Melasma (hormonal hyperpigmentation)','Tanning / uneven tone','Oily T-zone','Aging concerns from sun exposure'],
    skinCharacteristics: 'Diverse range Fitzpatrick II-V. Melasma common especially in women. Traditional Ayurvedic framework still widely followed.',
    morning: [
      { step: 1, product: 'Ayurvedic-inspired gentle cleanser', ingredient: 'Neem extract, tulsi', reason: 'Antibacterial, traditional ingredients' },
      { step: 2, product: 'Tranexamic acid serum', ingredient: 'Tranexamic acid 3%', reason: 'Target melasma and uneven tone' },
      { step: 3, product: 'Vitamin C', ingredient: 'Ascorbyl glucoside or L-ascorbic acid', reason: 'Brightening + antioxidant' },
      { step: 4, product: 'Light moisturiser', ingredient: 'Niacinamide + hyaluronic acid', reason: 'Hydration + oil control' },
      { step: 5, product: 'SPF 50', ingredient: 'Broad spectrum SPF', reason: 'Melasma worsens dramatically with UV exposure' },
    ],
    evening: [
      { step: 1, product: 'Cleanse', ingredient: 'Micellar or foam cleanser', reason: 'Remove day buildup' },
      { step: 2, product: 'Haldi mask (weekly)', ingredient: 'Turmeric + honey + rosewater', reason: 'Traditional Ayurvedic brightening ritual' },
      { step: 3, product: 'Bakuchiol serum', ingredient: 'Bakuchiol 1%', reason: 'Plant-based retinol — gentler than retinol for medium skin' },
      { step: 4, product: 'Amla oil or neem oil', ingredient: 'Traditional Ayurvedic oil', reason: 'Traditional hair and skin treatment' },
      { step: 5, product: 'Rich moisturiser', ingredient: 'Ceramides, peptides', reason: 'Barrier support overnight' },
    ],
    weeklyTreatments: [
      { treatment: 'Ubtan (traditional chickpea flour mask)', frequency: 'Weekly', benefit: 'Traditional exfoliation and brightening — used at haldi ceremony' },
      { treatment: 'Champi (oil scalp massage)', frequency: 'Weekly', benefit: 'Scalp and hair health — full body Ayurvedic tradition' },
    ],
    traditionalRemedies: ['Amla oil for scalp','Turmeric paste for spot treatment','Rose water toner','Sandalwood paste for cooling skin','Multani mitti (Fuller\'s Earth) clay mask'],
    culturalNote: 'Ayurveda classifies skin into Vata (dry), Pitta (sensitive/reactive), and Kapha (oily) doshas. Modern dermatology increasingly validates these categories. South Asian beauty has centuries of botanical knowledge now confirmed by science.',
    buildaRoutineOrder: ['neem_cleanser','tranexamic_acid','vitamin_c','niacinamide','spf_am','bakuchiol_pm','amla_oil_pm','ceramide_moisturiser_pm'],
  },
  'caribbean': {
    communityId: 'caribbean',
    label: 'Caribbean Skin — The MIRRR Routine',
    primaryConcerns: ['Sun damage from high UV exposure','PIH from tropical acne','Dehydration from salt air','Fungal issues in humid climate'],
    skinCharacteristics: 'Diverse from Fitzpatrick III-VI depending on heritage. High humidity can trigger acne and fungal issues. Sea and sun exposure significant.',
    morning: [
      { step: 1, product: 'Antifungal-supporting cleanser', ingredient: 'Tea tree or zinc pyrithione', reason: 'Prevent tropical fungal growth' },
      { step: 2, product: 'Aloe vera gel', ingredient: 'Pure aloe', reason: 'Soothing, hydrating, traditional Caribbean remedy' },
      { step: 3, product: 'Niacinamide', ingredient: 'Niacinamide 5%', reason: 'Oil control in humid climate, pigmentation' },
      { step: 4, product: 'Lightweight oil-free moisturiser', ingredient: 'Gel moisturiser, hyaluronic acid', reason: 'Humidity provides hydration — lightweight products prevent breakouts' },
      { step: 5, product: 'SPF 50', ingredient: 'Water-resistant chemical SPF', reason: 'Caribbean UV intensity is extreme' },
    ],
    evening: [
      { step: 1, product: 'Cleanse', ingredient: 'Double cleanse', reason: 'Remove SPF and salt/sweat' },
      { step: 2, product: 'Alpha arbutin + niacinamide', ingredient: 'Dual-action pigmentation serum', reason: 'PIH correction' },
      { step: 3, product: 'Coconut oil (body, not face)', ingredient: 'Virgin coconut oil', reason: 'Traditional Caribbean body moisturiser — avoid on acne-prone face' },
      { step: 4, product: 'Light gel moisturiser', ingredient: 'Aloe-based, non-comedogenic', reason: 'Night hydration without clogging' },
    ],
    weeklyTreatments: [
      { treatment: 'Sea salt scrub', frequency: 'Weekly', benefit: 'Traditional Caribbean exfoliation using local sea salt' },
      { treatment: 'Aloe vera face mask', frequency: '2x per week', benefit: 'Calming sunburned or irritated skin' },
    ],
    traditionalRemedies: ['Aloe vera from the plant','Coconut oil for hair and body','Sea moss gel (St Lucian tradition)','Sorrel flower in skincare','Bay rum as toner (traditional Caribbean)'],
    culturalNote: 'Caribbean beauty is shaped by the sun, sea, and the incredible botanical richness of tropical islands. Each island has its own indigenous remedies — Jamaican Black Castor Oil, Trinidadian aloe traditions, Barbadian sea moss rituals.',
    buildaRoutineOrder: ['zinc_cleanser','aloe_vera','niacinamide','spf_50_water_resistant','alpha_arbutin_pm','light_gel_moisturiser'],
  },
  'arab': {
    communityId: 'arab',
    label: 'Arab Skin — The MIRRR Routine',
    primaryConcerns: ['Hyperpigmentation from sun','Oiliness in summer / dryness in winter','Melasma common in women','Facial hair concerns (Middle Eastern tradition of thread removal)'],
    skinCharacteristics: 'Diverse range Fitzpatrick II-V. Olive to medium-deep undertones. Desert climate causes extreme seasonal skin changes.',
    morning: [
      { step: 1, product: 'Rose water mist', ingredient: 'Bulgarian or Syrian rose water', reason: 'Traditional Arab beauty — balancing pH, toning' },
      { step: 2, product: 'Argan oil lightweight serum', ingredient: '100% argan oil drop', reason: 'Moroccan beauty staple — antioxidant, quick-absorbing' },
      { step: 3, product: 'Vitamin C', ingredient: 'L-ascorbic acid or derivative', reason: 'Brightening + antioxidant for sun-rich environment' },
      { step: 4, product: 'Moisturiser', ingredient: 'Hyaluronic acid base, gel-cream in summer/rich cream in winter', reason: 'Desert climate variation demands seasonal routine changes' },
      { step: 5, product: 'SPF 50', ingredient: 'High SPF for Middle East UV levels', reason: 'Extreme UV in MENA region' },
    ],
    evening: [
      { step: 1, product: 'Hammam-inspired double cleanse', ingredient: 'Kessa mitt + cleanser tradition', reason: 'North African hammam exfoliation ritual' },
      { step: 2, product: 'Black seed oil serum', ingredient: 'Nigella sativa 2%', reason: 'Prophetic medicine traditional use — anti-inflammatory' },
      { step: 3, product: 'Retinol or bakuchiol', ingredient: '0.05% retinol or 1% bakuchiol', reason: 'Anti-aging, pigmentation correction' },
      { step: 4, product: 'Rich overnight cream', ingredient: 'Ceramides + squalane', reason: 'Barrier repair overnight' },
    ],
    weeklyTreatments: [
      { treatment: 'Hammam exfoliation', frequency: 'Weekly', benefit: 'North African and Arab tradition of deep exfoliation — kessa mitt on oiled skin' },
      { treatment: 'Ghassoul clay mask', frequency: 'Weekly', benefit: 'Moroccan volcanic clay — purifying, tightening pores' },
    ],
    traditionalRemedies: ['Rose water as toner','Argan oil for face and hair','Black seed oil for skin healing','Ghassoul clay for deep cleansing','Aloe vera from garden plants','Hammam ritual of steam + exfoliation'],
    culturalNote: 'Arab beauty traditions are some of the oldest recorded — ancient Egyptian beauty rituals, Phoenician kohl, Moroccan hammam culture, and Gulf luxury beauty. Modern Arab beauty is a sophisticated fusion of ancient wisdom and cutting-edge technology.',
    buildaRoutineOrder: ['rosewater_mist','argan_oil','vitamin_c','hyaluronic_moisturiser','spf_50','black_seed_oil_pm','retinol_pm','ceramide_cream_pm'],
  },
  'latina': {
    communityId: 'latina',
    label: 'Latina Skin — The MIRRR Routine',
    primaryConcerns: ['Melasma (highly prevalent in Latina women)','Hyperpigmentation','Oily skin in tropical climates','Sun damage'],
    skinCharacteristics: 'Extremely diverse — Fitzpatrick II-VI depending on heritage (European, Indigenous, African). Melasma rates among the highest globally in Latina women.',
    morning: [
      { step: 1, product: 'Gentle cleanser', ingredient: 'pH-balanced formula', reason: 'Preserve barrier integrity' },
      { step: 2, product: 'Tranexamic acid', ingredient: 'Tranexamic acid 3-5%', reason: 'Melasma is the primary concern — tranexamic acid is the gold standard' },
      { step: 3, product: 'Vitamin C + E', ingredient: 'Ascorbic acid + tocopherol', reason: 'Antioxidant shield, brightening' },
      { step: 4, product: 'Moisturiser', ingredient: 'Lightweight, SPF-compatible', reason: 'Prep for sun protection' },
      { step: 5, product: 'SPF 50+', ingredient: 'Water-resistant broad spectrum', reason: 'Melasma worsens dramatically with UV — SPF is non-negotiable' },
    ],
    evening: [
      { step: 1, product: 'Double cleanse', ingredient: 'Oil cleanser + foaming cleanser', reason: 'Remove SPF thoroughly' },
      { step: 2, product: 'Azelaic acid', ingredient: 'Azelaic acid 10-15%', reason: 'Target melasma, PIH, and acne simultaneously' },
      { step: 3, product: 'Rosehip oil', ingredient: 'Cold-pressed rosehip seed oil', reason: 'Chilean indigenous tradition — natural retinoids' },
      { step: 4, product: 'Rich moisturiser', ingredient: 'Ceramides, hyaluronic acid', reason: 'Overnight barrier repair' },
    ],
    weeklyTreatments: [
      { treatment: 'Avocado mask', frequency: 'Weekly', benefit: 'Mesoamerican traditional ingredient — rich in vitamins A, B, C, E' },
      { treatment: 'Lactic acid toner', frequency: '2x per week', benefit: 'Gentle exfoliation without triggering melasma flare' },
    ],
    traditionalRemedies: ['Avocado as hair and skin mask','Aloe vera from garden','Coconut oil for body','Chamomile tea as toner','Rice water rinse'],
    culturalNote: 'Latina beauty traditions span 20+ countries and multiple heritage backgrounds. Indigenous Mesoamerican botanical wisdom (aloe, avocado, cacao), Afro-Latino traditions, and European influences all contribute to the rich, diverse Latina beauty landscape.',
    buildaRoutineOrder: ['gentle_cleanser','tranexamic_acid','vitamin_c','spf_50','azelaic_acid_pm','rosehip_oil_pm','ceramide_moisturiser_pm'],
  },
  'east-asian': {
    communityId: 'east-asian',
    label: 'East Asian Skin — The MIRRR Routine',
    primaryConcerns: ['Brightening and glass skin','Pore minimising','Anti-aging prevention','Sensitivity to harsh actives'],
    skinCharacteristics: 'Typically Fitzpatrick II-IV. Yellow-warm undertones. K-beauty has made East Asian skincare the global gold standard. Multi-step routines are cultural norm.',
    morning: [
      { step: 1, product: 'Low-pH first cleanser', ingredient: 'pH 4.5-5.5 cleanser', reason: 'K-beauty pH-perfect cleansing philosophy' },
      { step: 2, product: 'Essence', ingredient: 'Fermented ingredients, hyaluronic acid', reason: 'K-beauty step unique to East Asian routine — adds deep hydration layer' },
      { step: 3, product: 'Vitamin C serum (gentle)', ingredient: 'Ascorbyl glucoside or ethyl ascorbic acid', reason: 'Brightening without irritation' },
      { step: 4, product: 'Moisturiser', ingredient: 'Snail mucin, ceramides, or peptides', reason: 'Glass skin requires intensive hydration' },
      { step: 5, product: 'SPF 50+ PA++++', ingredient: 'Korean-formula chemical SPF', reason: 'UV protection for anti-aging and maintaining glass skin' },
    ],
    evening: [
      { step: 1, product: 'Oil cleanser', ingredient: 'Camellia or jojoba based', reason: 'Korean double cleanse first step — removes SPF and makeup' },
      { step: 2, product: 'Foam/water cleanser', ingredient: 'Low-pH second cleanse', reason: 'Second step of double cleanse' },
      { step: 3, product: 'Fermented toner', ingredient: 'Fermented ingredients — sake, rice wine', reason: 'Traditional fermentation adapted to modern K-beauty' },
      { step: 4, product: 'Retinol (gentle)', ingredient: 'Retinol 0.025-0.05%', reason: 'Anti-aging prevention early — East Asian skin ages differently (Intrinsic Aging)' },
      { step: 5, product: 'Sleeping pack', ingredient: 'Honey, hyaluronic acid, ceramides', reason: 'K-beauty overnight mask — intensive repair' },
    ],
    weeklyTreatments: [
      { treatment: 'Fermented rice water soak', frequency: 'Weekly', benefit: 'Ancient Yao women tradition — brightening and strengthening' },
      { treatment: 'Sheet mask', frequency: '2-3x per week', benefit: 'K-beauty innovation — targeted treatment in concentrated form' },
    ],
    traditionalRemedies: ['Rice water rinse','Camellia (tsubaki) oil for face and hair','Green tea as antioxidant toner','Sake as toning mist','Snail mucin (modern K-beauty)'],
    culturalNote: 'K-beauty, J-beauty, and C-beauty represent the world\'s most sophisticated skincare traditions. The 10-step Korean routine, J-beauty minimalism (mochi skin), and C-beauty gua sha rituals have become global beauty standards.',
    buildaRoutineOrder: ['low_ph_cleanser','essence','vitamin_c_gentle','moisturiser','spf_korean_formula','oil_cleanser_pm','second_cleanser_pm','retinol_pm','sleeping_pack_pm'],
  },
  'east-african': {
    communityId: 'east-african',
    label: 'East African Skin — The MIRRR Routine',
    primaryConcerns: ['PIH from acne','Uneven skin tone','Dryness at altitude (Ethiopia, Kenya)','Oiliness in coastal areas (Mombasa, Dar es Salaam)'],
    skinCharacteristics: 'Diverse Fitzpatrick III-VI. High-altitude communities (Ethiopia, Rwanda) have different sun exposure than coastal communities.',
    morning: [
      { step: 1, product: 'Gentle cleanser', ingredient: 'Non-stripping formula', reason: 'Preserve natural moisture in varying climates' },
      { step: 2, product: 'Moringa oil serum', ingredient: 'Moringa oleifera', reason: 'East African traditional botanical — antioxidant-rich' },
      { step: 3, product: 'Niacinamide', ingredient: 'Niacinamide 5-10%', reason: 'Brightening + barrier support' },
      { step: 4, product: 'Moisturiser', ingredient: 'Lightweight to rich depending on climate', reason: 'Altitude (Ethiopia) = dry; coastal = lightweight' },
      { step: 5, product: 'SPF 30-50', ingredient: 'Broad spectrum', reason: 'High altitude = more UV radiation' },
    ],
    evening: [
      { step: 1, product: 'Cleanse', ingredient: 'Micellar or oil cleanser', reason: 'Thorough removal' },
      { step: 2, product: 'Alpha arbutin', ingredient: 'Alpha arbutin 2%', reason: 'PIH fading' },
      { step: 3, product: 'Neem oil spot treatment', ingredient: 'Neem oil on breakouts', reason: 'Traditional East African antibacterial treatment' },
      { step: 4, product: 'Shea or baobab butter', ingredient: 'Rich African butter', reason: 'Traditional African moisturiser — deep hydration' },
    ],
    weeklyTreatments: [
      { treatment: 'Coffee scrub', frequency: 'Weekly', benefit: 'East African coffee tradition extended to body care — antioxidant exfoliation' },
      { treatment: 'Moringa leaf mask', frequency: 'Weekly', benefit: 'Traditional East African botanical super-food mask' },
    ],
    traditionalRemedies: ['Moringa oil','Ethiopian honey mask','Neem tree botanical treatments','Castor oil for hair and skin','Black seed oil (East African Muslim communities)'],
    culturalNote: 'East African beauty is influenced by indigenous Habesha, Kenyan, Ugandan, Tanzanian, and Somali traditions. Ethiopian henna traditions, Kenyan shuka cloth-wrapped beauty, and Somali incense skin rituals represent just some of the diverse beauty heritage.',
    buildaRoutineOrder: ['gentle_cleanser','moringa_serum','niacinamide','spf_30','alpha_arbutin_pm','neem_spot_treatment','baobab_butter_pm'],
  },
  'south-african': {
    communityId: 'south-african',
    label: 'South African Skin — The MIRRR Routine',
    primaryConcerns: ['Ozone depletion — SA has high UV index','PIH','Seasonal dryness (Highveld winter)','Heritage-diverse skin concerns'],
    skinCharacteristics: 'Extremely diverse — Nguni, Cape Malay, Afrikaner, Indian South African communities. UV levels among highest globally.',
    morning: [
      { step: 1, product: 'Rooibos cleanser', ingredient: 'Rooibos extract, South African ingredient', reason: 'Local South African botanical with antioxidant and anti-inflammatory properties' },
      { step: 2, product: 'Vitamin C serum', ingredient: 'L-ascorbic acid 10%', reason: 'Antioxidant protection against high SA UV levels' },
      { step: 3, product: 'Baobab oil', ingredient: 'Adansonia baobab oil', reason: 'South African Tree of Life oil — traditional and effective' },
      { step: 4, product: 'Moisturiser', ingredient: 'Rooibos + ceramides', reason: 'Dry Highveld winters demand rich moisture' },
      { step: 5, product: 'SPF 50+', ingredient: 'Very high SPF given ozone conditions', reason: 'SA has some of the highest UVB levels on Earth' },
    ],
    evening: [
      { step: 1, product: 'Cleanse', ingredient: 'Oil cleanse to remove heavy SPF', reason: 'Thorough SPF removal essential' },
      { step: 2, product: 'Kojic acid + alpha arbutin', ingredient: 'Dual pigmentation serum', reason: 'PIH from SA sun exposure' },
      { step: 3, product: 'Rooibos tea overnight masque', ingredient: 'DIY rooibos + honey', reason: 'Traditional South African botanical treatment' },
      { step: 4, product: 'Shea or marula butter', ingredient: 'Marula oil (South African)', reason: 'Marula is a sacred South African beauty oil used by Zulu and Swazi communities' },
    ],
    weeklyTreatments: [
      { treatment: 'Buchu exfoliant', frequency: 'Weekly', benefit: 'Agathosma betulina — Cape Fynbos botanical. Anti-aging, anti-bacterial.' },
      { treatment: 'Rooibos face masque', frequency: '2x per week', benefit: 'South African pride botanical — calming and brightening' },
    ],
    traditionalRemedies: ['Rooibos tea as toner','Marula oil from Sclerocarya birrea','Buchu botanical','Aloe ferox (South African aloe — stronger than barbadensis)','Imphepho (helichrysum) for healing'],
    culturalNote: 'South Africa is home to the world\'s richest fynbos flora — botanical ingredients like rooibos, buchu, and imphepho are unique to this region. Zulu, Xhosa, Ndebele, and Cape Malay beauty traditions each have distinct rituals. The South African beauty industry is growing rapidly with homegrown brands championing indigenous ingredients.',
    buildaRoutineOrder: ['rooibos_cleanser','vitamin_c','baobab_oil','spf_50','kojic_acid_pm','alpha_arbutin_pm','marula_butter_pm'],
  },
  'black-american': {
    communityId: 'black-american',
    label: 'Black American Skin — The MIRRR Routine',
    primaryConcerns: ['PIH (Post-Inflammatory Hyperpigmentation) — #1 concern','Keloid scarring tendency','Razor bumps (pseudofolliculitis barbae)','Uneven skin tone','Under-research in dermatology'],
    skinCharacteristics: 'Diverse Fitzpatrick III-VI. Under-researched in mainstream dermatology. Melanin provides UV protection but makes PIH the dominant skincare challenge.',
    morning: [
      { step: 1, product: 'African black soap cleanser', ingredient: 'African black soap (ose dudu)', reason: 'Traditional West African soap — antifungal, antibacterial, exfoliating' },
      { step: 2, product: 'Niacinamide toner', ingredient: 'Niacinamide 5-10%', reason: 'Pore minimising + pigmentation — two-in-one workhorse' },
      { step: 3, product: 'Vitamin C serum', ingredient: 'Stable vitamin C derivative', reason: 'Antioxidant brightening' },
      { step: 4, product: 'Lightweight gel moisturiser', ingredient: 'Hyaluronic acid, glycerin', reason: 'Hydration without clogging pores' },
      { step: 5, product: 'Tinted SPF 30+', ingredient: 'Tinted mineral or chemical SPF', reason: 'SPF without white cast — essential for adoption in Black communities' },
    ],
    evening: [
      { step: 1, product: 'Double cleanse', ingredient: 'Oil cleanse first', reason: 'Remove SPF thoroughly' },
      { step: 2, product: 'Alpha arbutin + kojic acid', ingredient: 'Dual brightener serum', reason: 'Attack PIH from two angles' },
      { step: 3, product: 'Azelaic acid (alternate nights)', ingredient: 'Azelaic acid 10%', reason: 'Anti-inflammatory — prevents acne that causes PIH' },
      { step: 4, product: 'Shea butter night cream', ingredient: 'Raw unrefined shea butter + argan', reason: 'Traditional + effective. Seals moisture and fights inflammation' },
    ],
    weeklyTreatments: [
      { treatment: 'Clay mask for oil control', frequency: 'Weekly', benefit: 'Deep pore cleanse — kaolin or bentonite clay' },
      { treatment: 'Lactic acid exfoliant', frequency: 'Once per week', benefit: 'Gentle exfoliation without triggering PIH' },
    ],
    traditionalRemedies: ['African black soap (ose dudu)','Shea butter — unrefined','Castor oil for skin and hair','Vitamin E oil on scars','Rosehip oil for PIH marks'],
    culturalNote: 'The natural hair and natural skin movement in Black American communities has been transformative — reclaiming ancestral ingredients (shea butter, black soap, castor oil) and refusing beauty standards that were never designed for Black skin. Brands like Fenty, UOMA, Black Opal, and SheaMoisture have emerged from community need.',
    buildaRoutineOrder: ['black_soap','niacinamide','vitamin_c','tinted_spf','alpha_arbutin_pm','azelaic_acid_pm','shea_butter_pm'],
  },
};

// ===========================================================================
// SHADE MATCHING FUNCTION
// ===========================================================================

export function analyseRGBSkinTone(r, g, b) {
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  const rg_ratio = r / (g + 1);
  const rb_ratio = r / (b + 1);
  const gb_ratio = g / (b + 1);

  let fitzpatrick = 'III';
  if (luminance > 210) fitzpatrick = 'I';
  else if (luminance > 190) fitzpatrick = 'II';
  else if (luminance > 165) fitzpatrick = 'III';
  else if (luminance > 135) fitzpatrick = 'IV';
  else if (luminance > 95) fitzpatrick = 'V';
  else fitzpatrick = 'VI';

  let undertone = 'neutral';
  if (rg_ratio > 1.15 && rb_ratio > 1.3) undertone = 'warm_golden';
  else if (rg_ratio > 1.1 && gb_ratio < 0.9) undertone = 'warm_red';
  else if (rb_ratio < 0.85) undertone = 'cool_pink';
  else if (rb_ratio < 0.75 && luminance < 100) undertone = 'cool_red';
  else if (gb_ratio > 1.05 && rg_ratio < 0.98) undertone = 'olive';
  else if (luminance < 80) undertone = 'deep_warm';
  else undertone = 'neutral';

  const fitzpatrickData = FITZPATRICK_EXTENDED[fitzpatrick];
  const undertoneData = UNDERTONE_PROFILES[undertone];

  const communityGuess = guessCommunitiesFromSkinTone(luminance, undertone);
  const foundationRecs = getFoundationRecommendations(fitzpatrick, undertone, communityGuess[0]);

  return {
    rgb: { r, g, b },
    luminance: Math.round(luminance),
    fitzpatrick,
    fitzpatrickLabel: fitzpatrickData?.label ?? 'Unknown',
    undertone,
    undertoneLabel: undertoneData?.label ?? undertone,
    undertoneDescription: undertoneData?.description ?? '',
    makeupTips: undertoneData?.makeupTips ?? [],
    foundationRecommendations: foundationRecs,
    communityLikelyCommunities: communityGuess,
    skincareConcerns: fitzpatrickData ? getSkincareConcerns(fitzpatrick) : [],
    confidence: luminance < 10 || luminance > 250 ? 'low' : 'medium',
    note: 'Skin tone analysis from camera/image is approximate. Lighting conditions significantly affect accuracy.',
  };
}

function guessCommunitiesFromSkinTone(luminance, undertone) {
  const map = [];
  if (luminance < 80 && (undertone === 'warm_red' || undertone === 'deep_warm')) map.push('west-african','black-american','caribbean');
  else if (luminance < 80 && (undertone === 'cool_red' || undertone === 'deep_cool')) map.push('east-african','south-african','black-american');
  else if (luminance >= 80 && luminance < 130 && undertone === 'warm_golden') map.push('south-asian','west-african','latina');
  else if (luminance >= 80 && luminance < 130 && undertone === 'olive') map.push('arab','latina','south-asian');
  else if (luminance >= 130 && luminance < 170 && undertone === 'warm_yellow') map.push('east-asian');
  else if (luminance >= 130 && undertone === 'cool_pink') map.push('east-asian','south-asian','arab');
  else map.push('all');
  return map.slice(0, 3);
}

function getFoundationRecommendations(fitzpatrick, undertone, communityId) {
  const recs = [];
  for (const [id, foundation] of Object.entries(FOUNDATIONS)) {
    const communityRec = foundation.ethnicRecommendations[communityId];
    if (communityRec) {
      recs.push({
        id, brand: foundation.brand, name: foundation.name,
        recommendedShades: communityRec.shades,
        notes: communityRec.notes,
        coverage: foundation.coverage,
        finish: foundation.finish,
        pricePoint: foundation.pricePoint,
        rating: foundation.rating,
        culturalNote: foundation.culturalNote,
      });
    }
  }
  return recs.sort((a, b) => b.rating - a.rating).slice(0, 5);
}

function getSkincareConcerns(fitzpatrick) {
  const concerns = {
    I: ['Sunburn risk very high','Skin cancer risk highest','Redness','Fragility'],
    II: ['Sunburn','Freckles','Sensitivity'],
    III: ['Some hyperpigmentation risk','Tanning unevenness'],
    IV: ['Post-inflammatory hyperpigmentation (PIH)','Melasma risk','Ingrown hairs'],
    V: ['PIH dominant concern','Melasma','Keloid scarring tendency','Dark elbows and knees'],
    VI: ['PIH — most significant concern','Ashiness (Trans-Epidermal Water Loss)','Keloid risk','Dermatosis papulosa nigra','Under-representation in research'],
  };
  return concerns[fitzpatrick] ?? [];
}

export function getSkincareRoutine(communityId) {
  return SKINCARE_ROUTINES[communityId] ?? null;
}

export function getIngredient(ingredientId) {
  return SKINCARE_INGREDIENTS[ingredientId] ?? null;
}

export function searchIngredients(concern) {
  const concern_lower = concern.toLowerCase();
  return Object.values(SKINCARE_INGREDIENTS).filter(ing =>
    ing.benefit.toLowerCase().includes(concern_lower) ||
    ing.category.toLowerCase().includes(concern_lower) ||
    (ing.ethnicSkinNote && ing.ethnicSkinNote.toLowerCase().includes(concern_lower))
  );
}

export function getUndertoneProfile(undertoneId) {
  return UNDERTONE_PROFILES[undertoneId] ?? null;
}

export function getFitzpatrickInfo(level) {
  return FITZPATRICK_EXTENDED[level] ?? null;
}

