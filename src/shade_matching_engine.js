/**
 * MIRRR Shade Matching Engine
 * Foundation, concealer, and tinted product shade matching
 * for all 9 ethnic communities across Fitzpatrick I–VI
 */

// ─── UNDERTONE SCIENCE ────────────────────────────────────────────────────────

export const UNDERTONE_PROFILES = {
  cool: {
    label: 'Cool',
    description: 'Pink, red, or bluish undertones. Veins appear blue/purple. Silver jewellery suits you.',
    indicators: ['blue-purple veins', 'looks best in silver', 'pink/red flush when warm', 'burns easily'],
    bestFoundationUndertones: ['pink', 'rosy', 'cool', 'porcelain'],
    avoidUndertones: ['peachy', 'golden', 'warm-yellow'],
    lipColours: ['berry', 'mauve', 'rose', 'true-red', 'plum'],
    blushColours: ['rose', 'cool-pink', 'berry-blush'],
    communities: ['east-asian (many)', 'south-asian (some)', 'caribbean (some)'],
  },
  warm: {
    label: 'Warm',
    description: 'Yellow, peachy, or golden undertones. Veins appear green. Gold jewellery suits you.',
    indicators: ['green veins', 'looks best in gold', 'tans easily', 'golden glow in sun'],
    bestFoundationUndertones: ['golden', 'peachy', 'warm', 'honey', 'caramel'],
    avoidUndertones: ['pink', 'cool-rose', 'ashy'],
    lipColours: ['coral', 'terracotta', 'warm-red', 'peach', 'nude-brown'],
    blushColours: ['coral', 'peach', 'warm-bronze'],
    communities: ['west-african (many)', 'south-asian (many)', 'latina (many)', 'arab (many)'],
  },
  neutral: {
    label: 'Neutral',
    description: 'Mix of warm and cool. Both silver and gold suit you. Veins appear blue-green.',
    indicators: ['blue-green veins', 'suits both gold and silver', 'doesn\'t lean strongly warm or cool'],
    bestFoundationUndertones: ['neutral', 'beige', 'balanced', 'natural'],
    avoidUndertones: ['strongly pink', 'strongly yellow'],
    lipColours: ['nude', 'dusty-rose', 'soft-mauve', 'soft-coral'],
    blushColours: ['soft-peach', 'nude-rose', 'soft-pink'],
    communities: ['all communities — neutral is common across all'],
  },
  olive: {
    label: 'Olive',
    description: 'Green/yellow-green undertone with a slightly muted or earthy quality. Common in Mediterranean, Middle Eastern, and South Asian skin.',
    indicators: ['green veins', 'skin can appear slightly greenish in daylight', 'hard to find matching foundation'],
    bestFoundationUndertones: ['olive', 'yellow', 'neutral-warm', 'khaki-beige'],
    avoidUndertones: ['pink', 'peach', 'pure-yellow (can look ashy)'],
    lipColours: ['deep-berry', 'terracotta', 'warm-nude', 'brick-red'],
    blushColours: ['terracotta', 'warm-brown', 'bronzy-peach'],
    communities: ['arab (common)', 'south-asian (common)', 'latina (common)', 'east-asian (some)'],
    note: 'Olive skin is NOTORIOUSLY hard to shade-match — most foundations skew too pink or too yellow. Look for "olive" or "neutral-warm" labels explicitly.',
  },
  'deep-warm': {
    label: 'Deep Warm',
    description: 'Rich, deep skin with golden, copper, or mahogany undertones. Stunning in bronze and gold.',
    indicators: ['golden/copper glow', 'veins hard to see but tend green', 'suits gold jewellery strongly'],
    bestFoundationUndertones: ['golden', 'warm-brown', 'mahogany', 'copper', 'bronze'],
    avoidUndertones: ['ashy', 'grey', 'cool-brown'],
    lipColours: ['deep-plum-warm', 'copper', 'warm-nude', 'terracotta', 'brick'],
    blushColours: ['warm-bronze', 'terracotta', 'deep-coral'],
    communities: ['west-african (many)', 'east-african (many)', 'caribbean (many)', 'black-american (many)'],
  },
  'deep-cool': {
    label: 'Deep Cool',
    description: 'Rich, deep skin with purple, blue, or cool-brown undertones. Stunning in silver and jewel tones.',
    indicators: ['cool/ashy tone to skin', 'suits silver more than gold', 'berry tones in lips'],
    bestFoundationUndertones: ['cool-brown', 'ebony', 'espresso', 'sable'],
    avoidUndertones: ['golden', 'copper', 'warm-brown'],
    lipColours: ['deep-berry', 'plum', 'cool-red', 'burgundy'],
    blushColours: ['deep-berry', 'cool-bronze', 'mulberry'],
    communities: ['west-african (some)', 'south-african (some)', 'black-american (some)'],
  },
};

// ─── FOUNDATION BRAND DATABASE ───────────────────────────────────────────────

export const FOUNDATION_BRANDS = {
  fenty_beauty: {
    brandName: 'Fenty Beauty',
    by: 'Rihanna',
    heroProduct: 'Pro Filt\'r Soft Matte Foundation',
    whyItWorks: 'Launched with 40 shades — now 50 — specifically designed to serve deep skin tones that were ignored by the industry. Genuinely excellent deep shade range.',
    priceRange: '$38–$42',
    shadeRange: '100 (very fair cool) → 498 (very deep neutral)',
    coverage: 'Medium-to-full',
    finish: 'Soft matte',
    bestFor: ['deep skin tones', 'oily skin', 'long-wear'],
    devilInDetails: 'The number system is logical: first digit = depth (1=fair, 5=deep), last digits = undertone. 398W = medium-deep, warm.',
    communityRecommendations: {
      'west-african': ['420N', '430N', '440W', '450W', '490N', '498'],
      'black-american': ['430N', '450W', '460N', '470N', '490N', '498'],
      'east-african': ['360W', '370N', '380W', '420N', '440W'],
      'south-african': ['210W', '230N', '310W', '340N', '420N', '460N'],
    },
    website: 'https://www.fentybeauty.com',
  },
  nars: {
    brandName: 'NARS',
    heroProduct: 'Natural Radiant Longwear Foundation',
    whyItWorks: 'Known for nuanced undertone matching — particularly good for olive and neutral-warm tones that others miss.',
    priceRange: '$50',
    shadeRange: 'Siberia (very fair cool) → Marquises (very deep neutral)',
    coverage: 'Medium-to-full',
    finish: 'Natural/satin',
    bestFor: ['olive skin', 'neutral undertones', 'dry-to-normal skin'],
    devilInDetails: 'Named shades rather than numbered — requires swatch testing or consulting shade finder. Worth the effort.',
    communityRecommendations: {
      'arab': ['Barcelona', 'Syracuse', 'Macao', 'Tahoe'],
      'south-asian': ['Syracuse', 'Deauville', 'Macao', 'Stromboli'],
      'latina': ['Deauville', 'Syracuse', 'Stromboli', 'Marquises'],
    },
    website: 'https://www.narscosmetics.com',
  },
  black_opal: {
    brandName: 'Black Opal',
    heroProduct: 'True Color Flawless Visage Liquid Foundation',
    whyItWorks: 'Founded FOR women of colour. Deep shade range is exceptional — doesn\'t just extend a fair foundation into brown territory but builds from deep tones up.',
    priceRange: '$15–$18',
    shadeRange: 'Porcelain (fair) → Beautiful Bronze (very deep)',
    coverage: 'Full',
    finish: 'Natural',
    bestFor: ['deep skin tones', 'budget-conscious', 'natural finish'],
    note: 'Criminally underrated. The Beautiful Bronze and Heavenly Honey shades are often perfect where luxury brands fail.',
    communityRecommendations: {
      'west-african': ['Heavenly Honey', 'Beautiful Bronze', 'Mocha'],
      'black-american': ['Mocha', 'Beautiful Bronze', 'Heavenly Honey'],
      'caribbean': ['Mocha', 'Cappuccino', 'Beautiful Bronze'],
    },
    website: 'https://blackopal.com',
  },
  make_up_for_ever: {
    brandName: 'Make Up For Ever',
    heroProduct: 'HD Skin Foundation',
    whyItWorks: 'Professional-grade formula loved by makeup artists. Wide shade range with very precise undertone labelling (Y=yellow/warm, N=neutral, P=pink/cool, R=rose).',
    priceRange: '$52',
    shadeRange: '1N00 (very fair neutral) → 4R70 (very deep rose-cool)',
    coverage: 'Medium-to-full buildable',
    finish: 'Natural/undetectable',
    bestFor: ['professional use', 'photography', 'all skin types'],
    devilInDetails: 'The first digit = depth (1-4), the letter = undertone, the number = specific shade. Extremely logical system once learned.',
    communityRecommendations: {
      'east-asian': ['1Y04', '1N10', '1Y12', '2N20'],
      'arab': ['2Y20', '2N30', '3Y36', '3N40'],
      'south-asian': ['2Y24', '3Y36', '3N40', '4Y44'],
    },
    website: 'https://www.makeupforever.com',
  },
  mented_cosmetics: {
    brandName: 'Mented Cosmetics',
    heroProduct: 'Semi-Matte Foundation',
    whyItWorks: 'Founded by two Black women who couldn\'t find nude lipsticks or foundations for their skin. Built from medium-deep to very deep shades.',
    priceRange: '$35',
    shadeRange: 'Medium to very deep',
    coverage: 'Medium buildable',
    finish: 'Semi-matte',
    bestFor: ['melanin-rich skin', 'clean/minimal look', 'wide shade inclusivity in mid range'],
    communityRecommendations: {
      'black-american': ['all shades — brand was built for this community'],
      'west-african': ['MF07', 'MF08', 'MF09', 'MF10'],
    },
    website: 'https://www.mentedcosmetics.com',
  },
  kay_beauty: {
    brandName: 'Kay Beauty',
    heroProduct: 'HD Illuminating Foundation',
    whyItWorks: 'Indian brand by Katrina Kaif, designed specifically for South Asian skin tones — particularly excellent for warm-medium to warm-deep shades.',
    priceRange: '₹799–₹999 ($10–$12 USD)',
    shadeRange: '01 Porcelain → 10 Mahogany',
    coverage: 'Medium',
    finish: 'Illuminating/dewy',
    bestFor: ['South Asian skin tones', 'olive/warm undertones', 'budget-conscious'],
    communityRecommendations: {
      'south-asian': ['05 Honey', '06 Caramel', '07 Chestnut', '08 Cinnamon'],
    },
    website: 'https://www.kaybeauty.com',
  },
  juvia_place: {
    brandName: 'Juvia\'s Place',
    heroProduct: 'I Am Magic Foundation',
    whyItWorks: 'Nigerian-founded brand. EXCEPTIONAL deep shade range. Built by and for melanin-rich skin. Deep shade formulas are treated as primaries, not afterthoughts.',
    priceRange: '$22',
    shadeRange: 'W0 (very fair warm) → W13 (very deep warm)',
    coverage: 'Full',
    finish: 'Natural matte',
    bestFor: ['very deep skin tones', 'warm-deep undertones', 'West African skin specifically'],
    communityRecommendations: {
      'west-african': ['W09', 'W10', 'W11', 'W12', 'W13'],
      'east-african': ['W08', 'W09', 'W10', 'W11'],
      'black-american': ['W08', 'W09', 'W10', 'W11', 'W12'],
      'caribbean': ['W07', 'W08', 'W09', 'W10'],
    },
    website: 'https://juviasplace.com',
  },
};

// ─── CONCEALER MATCHING ───────────────────────────────────────────────────────

export const CONCEALER_GUIDE = {
  underEyeDarkCircles: {
    concern: 'Under Eye Dark Circles',
    types: {
      pigmentation: {
        description: 'Brown/dark pigmentation under eyes — more common in South Asian, Arab, East African, Caribbean skin',
        solution: 'Use a peach or orange colour corrector FIRST, then your exact concealer shade on top',
        colourCorrectors: {
          fitzpatrick_I_II: 'Lavender corrector (counteracts pink/blue circles)',
          fitzpatrick_III_IV: 'Peach corrector (counteracts brown circles)',
          fitzpatrick_V_VI: 'Deep orange/rust corrector (counteracts very dark circles)',
        },
        products: {
          corrector: 'NYX Professional Makeup Color Correcting Concealer in Peach ($10) / Orange ($10)',
          concealer: 'NARS Radiant Creamy Concealer ($32) — excellent brightening',
          setting: 'Laura Mercier Translucent Powder ($44) — bakes to set and brighten',
        },
      },
      structural: {
        description: 'Hollow under eyes casting shadow — genetic/structural, hard to cover with makeup alone',
        solution: 'Hydrate first (eye cream), use a slightly lighter concealer to push the shadow back',
        tip: 'A hydrating concealer like Tarte Shape Tape Hydrating works better than full-coverage matte here — matte can settle into hollows',
      },
      vascular: {
        description: 'Blue/purple circles from blood vessels showing through thin skin — more common in fair skin tones',
        solution: 'Salmon/peach corrector (Fitzpatrick I-III)',
        products: { corrector: 'Charlotte Tilbury Magic Vanish Colour Corrector in Fair ($35)' },
      },
    },
  },
  blemishConcealment: {
    concern: 'Active Blemishes and PIH',
    steps: [
      'Apply spot treatment and let dry completely first',
      'Dab (don\'t rub) full-coverage concealer onto the blemish only',
      'Blend ONLY the edges — not over the full spot',
      'Set with translucent or colour-matching powder',
      'Do NOT apply concealer over open broken skin',
    ],
    products: {
      highCoverage: 'Dermablend Leg and Body Cover ($36 — used for blemishes too, very high coverage)',
      budget: 'e.l.f. Hydrating Camo Concealer ($10 — surprising performer for blemishes)',
      forDeepSkin: 'Black Radiance True Complexion Concealer ($7)',
    },
  },
  lipCorrectionDark: {
    concern: 'Dark Lip Correction (hyperpigmented lips)',
    note: 'Common in South Asian, West African, and East African communities — lips can be darker than facial skin',
    approach: [
      'Step 1: Apply a nude/skin-tone lip liner all over lips as a base',
      'Step 2: Pat a tiny amount of concealer onto lips (this neutralises darkness)',
      'Step 3: Set with a dusting of translucent powder',
      'Step 4: Apply lip colour on top — it will now appear true to the pan colour',
    ],
    products: {
      lipLiner: 'MAC Lip Pencil in Whirl ($22) or NARS Velvet Lip Liner in Dolce Vita ($27)',
      concealer: 'NYX HD Photogenic Concealer ($8)',
    },
  },
};

// ─── SHADE MATCHING ALGORITHM ─────────────────────────────────────────────────

export function recommendFoundationShade(fitzpatrick, undertone, communityId, concern = 'general') {
  const profile = UNDERTONE_PROFILES[undertone];
  if (!profile) return { error: 'Unknown undertone', undertones: Object.keys(UNDERTONE_PROFILES) };

  // Get brands that explicitly recommend for this community
  const communityBrands = [];
  for (const [brandKey, brand] of Object.entries(FOUNDATION_BRANDS)) {
    if (brand.communityRecommendations && brand.communityRecommendations[communityId]) {
      communityBrands.push({
        brand: brand.brandName,
        hero: brand.heroProduct,
        price: brand.priceRange,
        recommendedShades: brand.communityRecommendations[communityId],
        website: brand.website,
        why: brand.whyItWorks,
        coverage: brand.coverage,
        finish: brand.finish,
      });
    }
  }

  // Depth-based brand tier suggestions
  const depthBrands = {
    I: ['NARS', 'Make Up For Ever', 'Charlotte Tilbury'],
    II: ['NARS', 'Mac', 'Make Up For Ever', 'L\'Oréal True Match'],
    III: ['NARS', 'Fenty Beauty', 'MAC', 'Maybelline Fit Me'],
    IV: ['Fenty Beauty', 'NARS', 'MAC', 'L\'Oréal True Match'],
    V: ['Fenty Beauty', 'Juvia\'s Place', 'Black Opal', 'Mented Cosmetics'],
    VI: ['Fenty Beauty', 'Juvia\'s Place', 'Black Opal', 'Mented Cosmetics', 'Fashion Fair'],
  };

  return {
    fitzpatrick,
    undertone,
    undertoneLabel: profile.label,
    communityId,
    foundationUndertones: profile.bestFoundationUndertones,
    avoidUndertones: profile.avoidUndertones,
    communitySpecificBrands: communityBrands,
    depthAppropriateTop3: (depthBrands[fitzpatrick] || []).slice(0, 3),
    lipColours: profile.lipColours,
    blushColours: profile.blushColours,
    tipText: profile.note || `${profile.label} undertones pair beautifully with ${profile.lipColours[0]} lip colours.`,
  };
}

export function matchConcealerToFitzpatrick(fitzpatrick, concern = 'general') {
  const under = CONCEALER_GUIDE.underEyeDarkCircles;
  const correctorMap = under.types.pigmentation.colourCorrectors;

  let correctorRec;
  if (['I', 'II'].includes(fitzpatrick)) correctorRec = correctorMap.fitzpatrick_I_II;
  else if (['III', 'IV'].includes(fitzpatrick)) correctorRec = correctorMap.fitzpatrick_III_IV;
  else correctorRec = correctorMap.fitzpatrick_V_VI;

  return {
    fitzpatrick,
    concern,
    underEyeCorrector: correctorRec,
    correctorProduct: under.types.pigmentation.products.corrector,
    concealerPick: under.types.pigmentation.products.concealer,
    concealerSetting: under.types.pigmentation.products.setting,
    blemishConcealer: CONCEALER_GUIDE.blemishConcealment.products,
  };
}

export function getLipCorrectionGuide() {
  return CONCEALER_GUIDE.lipCorrectionDark;
}

export function getAllFoundationBrands() {
  return Object.values(FOUNDATION_BRANDS);
}

export function getFoundationByBrand(brandKey) {
  return FOUNDATION_BRANDS[brandKey] || null;
}

export function getBrandsForCommunity(communityId) {
  return Object.values(FOUNDATION_BRANDS).filter(b =>
    b.communityRecommendations && b.communityRecommendations[communityId]
  );
}

export function getUndertoneProfile(undertone) {
  return UNDERTONE_PROFILES[undertone] || null;
}

export function detectUndertoneFromCommunity(communityId) {
  // Statistical likelihood mapping — individuals vary widely
  const likelihoods = {
    'west-african': ['deep-warm', 'deep-cool', 'warm'],
    'south-asian': ['warm', 'olive', 'neutral', 'cool'],
    'caribbean': ['deep-warm', 'warm', 'neutral'],
    'arab': ['olive', 'warm', 'neutral', 'cool'],
    'latina': ['warm', 'olive', 'neutral', 'deep-warm'],
    'east-asian': ['cool', 'neutral', 'warm'],
    'east-african': ['deep-warm', 'warm', 'deep-cool'],
    'south-african': ['deep-warm', 'warm', 'cool', 'neutral'],
    'black-american': ['deep-warm', 'warm', 'deep-cool', 'neutral'],
  };

  const common = likelihoods[communityId] || ['warm', 'neutral', 'cool'];
  return {
    mostCommon: common[0],
    likely: common,
    note: 'These are statistical tendencies — undertone is individual. Use the vein test (green=warm, blue=cool, blue-green=neutral) for accuracy.',
  };
}

export const SHADE_MATCH_STATS = {
  totalBrandsIndexed: Object.keys(FOUNDATION_BRANDS).length,
  totalUndertoneProfiles: Object.keys(UNDERTONE_PROFILES).length,
  communitiesMapped: ['west-african', 'south-asian', 'arab', 'latina', 'east-asian', 'east-african', 'caribbean', 'south-african', 'black-american'],
  concealerConcernsIndexed: Object.keys(CONCEALER_GUIDE).length,
};
