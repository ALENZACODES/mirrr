/**
 * MIRRR — Extended Contouring Guide V2
 * Heritage face shapes, nose contour, jawline sculpting,
 * highlighting theory, colour-correcting shadows for deeper skin tones.
 */

export const CONTOURING_SCIENCE = {
  title: 'The Science of Contouring & Highlighting',
  lightAndShadow: {
    principle: 'Contouring exploits the brain\'s interpretation of light and shadow to create the illusion of three-dimensional depth on a two-dimensional surface. The human brain reads darker areas as receding and lighter areas as projecting forward.',
    history: 'Theatrical stage makeup first used this principle in the 1800s because harsh stage lighting flattened faces. Film industry adopted it in the 1930s–1940s for on-camera glamour. Fashion editorial makeup in the 1980s–2000s refined it. Kevyn Aucoin\'s books brought sculpting to a wide audience in the 1990s, and social media made everyday contouring mainstream in the 2010s.',
    limitations: 'Contouring is most effective in photographs and video. In person and in natural daylight, it reads more subtly — blending must be exceptional. On dark skin, the contrast between contour and skin must be chosen carefully (see below).',
    warmVsCool: 'Traditional contour shades use cool grey-brown (ashy) tones to mimic shadow. This works perfectly on lighter skin. For deeper Fitzpatrick IV-VI skin, cool-toned contour can look grey or ashy rather than a natural shadow — warm bronzy contour reads more naturally.',
    undertoneMatching: 'Always match contour to the undertone of the skin. For cool/neutral undertone: cool greige/grey-brown. For warm undertone: warm caramel or bronzy taupe. For neutral undertone: true medium brown. Never contour with a shade that is simply darker of the same hue — it will read as a patch of makeup, not shadow.'
  },
  highlight_science: {
    types: {
      shimmer: 'Reflective particles (mica, synthetic fluorophonite) scatter and reflect light back to the eye; reads as glow in photos and video; can read as glitter in flat indoor light; most flattering on prominent cheekbones',
      satin: 'Fine-milled subtle sheen; flattering in all lighting; good for professional and daytime contexts; most forgiving',
      matte: 'No shimmer; creates illusion of light through pale shade rather than reflection; very natural; best for hooded eyes, on top of brow bone, and in bright sunlight where shimmer reads as sweat',
      liquid_strobing: 'Liquid or cream illuminator mixed into foundation or applied under foundation; inner glow effect; reads beautifully in photos; MAC Strobe Cream prototype of the category'
    },
    placement_principle: 'Highlight goes where light naturally hits a face: highest point of cheekbones, brow bone under arch, inner corners of eyes, Cupid\'s bow of upper lip, center of nose bridge, center of forehead, center of chin',
    deepSkin: 'Rich golden, bronze, copper, and rose gold highlighters are most flattering on Fitzpatrick V-VI skin — they create warmth and luminosity rather than the washed-out or grey appearance that cool silver/pearl highlighters can create on deeper skin'
  }
};

export const ETHNIC_FACE_SHAPES_EXTENDED = {
  'west-african': {
    contourGoals: 'Define cheekbones if you want more shape; slim temples if desired; nose contour based on personal preference (not from a deficit framing — wide nose is not a flaw to be corrected)',
    cheekboneContour: 'Suck in cheeks lightly to find the hollow; apply warm bronzy contour shade just below the cheekbone from the ear toward the nose, stopping 2 fingers from the nose; blend upward in a C-shape toward the temple',
    noseTechnique: 'If desired: apply contour shade along the sides of the nose in straight lines from nostril to bridge — blend fully; highlight down the center bridge. For wider nose bridge: contour on either side of the bridge narrows it visually — apply only if the individual wants this; never assume they want it',
    jawline: 'Apply contour along the jawline and down the sides of the neck for a sculpted jaw effect; blend down to create a seamless transition',
    highlight: 'Golden bronze or copper highlight on the highest point of the cheekbones, center of forehead, and bridge of nose; avoid very pale silver or white highlight on darker skin — it creates an unnatural grey cast',
    fitzpatrick: 'On deep skin use warm-toned contour only; cool ashy contour will look grey'
  },
  'south-asian': {
    bollywood_technique: 'Classic Bollywood glam contour: defined nose contour; heavy highlight down nose center; defined cheekbone contour; under-eye concealer and highlight; very full highlight on forehead center',
    modernApproach: 'Modern artistry works with your own features rather than one aesthetic standard',
    highlight: 'Gold, warm champagne and rose gold suit warm and olive undertones; cool undertones may prefer a pinker champagne',
    fitzpatrick: 'For Fitzpatrick III-IV: cool or warm technique depending on undertone; V-VI: use warm contour'
  },
  caribbean: {
    contourGoals: 'Work with natural cheekbone structure; Caribbean beauty emphasises luminosity (the "island glow"); highlight is as important as contour',
    glowTechnique: 'Apply bronzing contour to the hollows of cheeks, temples, and along the jawline; apply liquid illuminator on the tops of cheekbones, nose tip, and cupid\'s bow for that sun-kissed glow effect; Caribbean makeup for events is often very dewy and luminous',
    fitzpatrick: 'Warm bronzy tones for contour suit medium to deep skin',
    carnival_intensity: 'For carnival and events: dramatic contouring is culturally appropriate and celebrated; chiselled cheekbones, defined jaw, intense glitter highlight all part of the aesthetic'
  },
  arab: {
    contourGoals: 'Arab beauty aesthetics value a striking, defined face; the nose is a central feature often celebrated rather than disguised; high drama is culturally valued in makeup; define the perimeter of the face, sculpt the jaw and cheekbones',
    noseTechnique: 'Arabic nose contour: define the sides of the bridge (many Arab individuals have naturally high bridges — enhance rather than narrow); shadow along nostrils if individual prefers; highlight down center bridge for prominence; in Arabic culture a strong defined nose is often considered beautiful',
    jawChisel: 'Strong jawline contouring: apply contour under the jawline and blend downward into the neck; gives the chiselled effect popular in Arabic editorial makeup',
    highlight: 'Warm champagne, gold, and deep bronze highlights suit most Arab skin tones; copper for darker skin',
    eid_glam: 'Eid and formal occasions call for intense highlighting, particularly on the cheekbones and nose bridge; Arabian makeup tradition celebrates a high-impact look for celebrations'
  },
  latina: {
    contourGoals: 'JLo glow technique — the iconic Latina beauty look emphasises a dewy luminous complexion with a defined cheekbone, not heavy matte contouring; Latina beauty often celebrates curves not just in the body but in the face',
    JLo_technique: 'Warm bronze contour in the hollows of cheeks and at temples; Vaseline or dewy highlighter on tops of cheekbones, cupid\'s bow, and nose tip; the effect should look lit-from-within rather than striped',
    noseTechnique: 'Nose shapes vary widely; contour is optional and for personal preference only',
    fitzpatrick: 'Technique follows your undertone: warm contour for warm and olive undertones, a neutral taupe-brown only on cool, lighter skin'
  },
  'east-asian': {
    contourGoals: 'K-beauty contour usually aims for soft dimension and a natural, skin-like finish rather than heavy sculpting',
    midFaceTechnique: 'Apply contour at the very top of the cheekbone/temple area (high contour) rather than in the hollow; this narrows the mid-face without creating heavy shadows; blend upward toward the hairline',
    jawVTechnique: 'V-line contouring: apply contour along the sides of the jaw and chin, blending toward the point of the chin to create a V-shaped jaw (valued in East Asian beauty standards); done with light hand; most effective in photos',
    noseTechnique: 'K-beauty nose contour: thin contour lines down both sides of the nose bridge; highlight down center bridge; the goal is to make the nose appear to have more dimension and height — this is a significant technique in Korean makeup culture',
    highlight: 'Pearl, ivory, and very soft champagne highlights suit lighter East Asian skin; gold for olive/warmer tones; pink or lilac for cool/pink-toned skin',
    antiFilter: 'Korean and Chinese beauty filters (apps) automatically apply extreme contouring and V-line effects; this affects beauty standards; real-life contouring for East Asian faces should be far more subtle'
  },
  'east-african': {
    contourGoals: 'A luminous approach: light bronzing and a warm, intense highlight, adding contour only where you want more shape',
    minimalTechnique: 'Light warm bronzer through the hollows (often unnecessary); intense golden or bronze highlighter on the tops of the cheekbones and center of the nose bridge; the skin at deep tones catches light beautifully from highlighter',
    fitzpatrick: 'On deep skin use only warm-toned products; cool grey or taupe contours turn ashy'
  },
  'south-african': {
    contourGoals: 'Highly personalised to the individual given the diversity; technique follows the individual\'s face shape and skin tone rather than a single multicultural aesthetic',
    deepSkin: 'For deep skin: warm bronze contour and a golden highlight',
    fitzpatrick: 'Choose by your own Fitzpatrick type and undertone'
  },
  'black-american': {
    contourGoals: 'The "snatched" look: defined cheekbones, a sculpted jaw and a warm highlight',
    snatchedTechnique: 'Warm caramel or deep brown contour (2 shades darker than skin, same undertone); applied in the cheek hollow, temples, and under jawline; blended with a fluffy brush in circular motions; highlight in gold or copper on cheekbone tops, nose bridge, and Cupid\'s bow; the effect is defined but warm, not grey',
    noseTechnique: 'Nose contour is entirely personal preference; if desired, the technique involves blending contour on the sides of the nose bridge and around the nostrils; always gentle — the nose should not look striped',
    fitzpatrick: 'On deep skin, warm bronze or caramel contour; no cool grey; gold or copper highlight'
  }
};

export const NOSE_CONTOURING_DETAILED = {
  title: 'Detailed Nose Contouring Guide',
  ethical_framing: 'Nose contouring is a personal choice. Many beauty spaces have historically implied that noses of colour needed to be narrowed or "fixed." This guide presents techniques without judgment — use any technique to enhance what you love, not to erase who you are.',
  noseTypes: {
    flatBridge: {
      description: 'Lower bridge height; common in East Asian, some South Asian, some West African features',
      technique: 'Two thin contour lines down the sides of the bridge (not the tip); wide highlight strip down the center of the bridge; this creates the illusion of a raised bridge; highlight extends over the tip slightly',
      shade: 'Contour should be light — not dark — as the goal is to sculpt not add shadow'
    },
    wideBridge: {
      description: 'Wider nose bridge; common in African-heritage, Caribbean, some South Asian features',
      technique: 'Contour applied close to the sides of the bridge narrows it visually; the closer together the lines, the narrower the bridge appears; highlight down center only between the lines; note: this technique narrows only in photos — always personal choice',
      shade: '2 shades darker than skin; warm-toned; blend meticulously to avoid striped look'
    },
    hooked: {
      description: 'Dorsal hump (bump on bridge); can occur in any ethnicity; common in Southern European, Middle Eastern, some South Asian heritage',
      technique: 'Apply contour only on the hump itself; the shadow makes it recede; highlight everything above and below the hump; this minimises its appearance in photos',
      limitation: 'This technique is very subtle in person; primarily effective in photographs with lighting'
    },
    bulbousTip: {
      description: 'Rounded, wider nose tip; common in many ethnicities',
      technique: 'Contour around the sides of the tip in a circular shadow; highlight the very center of the tip only; this makes the tip appear to recede slightly at the sides'
    },
    longNose: {
      description: 'Longer nose from bridge to tip',
      technique: 'Contour across the tip of the nose (horizontal line just at the base of the tip, where the tip meets the nostrils); this shortens the nose; no highlight at the tip; highlight at the bridge only'
    }
  },
  toolsForNose: {
    smallBrush: 'A small angled brush or pencil brush gives the most precision for nose contouring',
    powderVsCream: 'Cream contour applies first (after foundation); powder contour on top; cream allows more blending; for nose work, cream is more precise',
    blendingKey: 'Harsh lines are the most common mistake; blend with a clean small brush in circular micro-motions until no edges are visible'
  }
};

export const HIGHLIGHT_PLACEMENTS_CULTURAL = {
  title: 'Highlight Placement by Cultural Aesthetic',
  glassSkinKorea: {
    description: 'Korean glass skin doesn\'t use powder highlight; instead uses multiple layers of hydrating products (essence, serum, cream) plus a dewy foundation/tint; the entire face looks backlit rather than having a highlight stripe',
    technique: 'Layer: toner, essence, serum, sheet mask, moisturiser, SPF; then apply dewy base; no powder; a drop of face oil on the cheekbones mixed into the skin for the glass effect',
    highlightProduct: 'Liquid illuminator in a dropper (like Charlotte Tilbury Flawless Filter or Korean equivalent Hera Glow Lasting Foundation Primer) can be added to the base'
  },
  glassSkinNigeria: {
    description: 'Nigerian/West African glass skin uses a similar dewy approach but with deeper skin foundations and often a heavier glow',
    popular: 'The Lagos Instagram beat involves intense highlight on the cheekbones, bridge, and cupid\'s bow; rhinestone or glitter accents for events; Fenty Beauty Killawatt is a culturally significant highlighter in this community — developed for deeper skin tones'
  },
  arabGlam: {
    description: 'Arabic highlight focuses on the cheekbones and nose bridge; is often intense and shimmery; gold and copper shades are culturally significant',
    occasion: 'For Eid, weddings (nikah), and formal events: highly reflective highlight is the norm; more subtle for daily wear'
  },
  desiHighlight: {
    description: 'South Asian celebration makeup (weddings, mehndi, sangeet) embraces intense highlight especially on the cheekbones, nose bridge, and Cupid\'s bow; often paired with gold jewellery so the face and jewellery work together',
    brideTechnique: 'Bridal South Asian makeup often places highlight on forehead center, nose bridge tip, cupid\'s bow, and collarbones (if visible in outfit neckline)'
  }
};

export function getContouringScienceOverview() {
  return CONTOURING_SCIENCE;
}

export function getEthnicFaceShapeContour(communityId) {
  const directMap = {
    'west-african': ETHNIC_FACE_SHAPES_EXTENDED['west-african'],
    'south-asian': ETHNIC_FACE_SHAPES_EXTENDED['south-asian'],
    caribbean: ETHNIC_FACE_SHAPES_EXTENDED.caribbean,
    arab: ETHNIC_FACE_SHAPES_EXTENDED.arab,
    latina: ETHNIC_FACE_SHAPES_EXTENDED.latina,
    'east-asian': ETHNIC_FACE_SHAPES_EXTENDED['east-asian'],
    'east-african': ETHNIC_FACE_SHAPES_EXTENDED['east-african'],
    'south-african': ETHNIC_FACE_SHAPES_EXTENDED['south-african'],
    'black-american': ETHNIC_FACE_SHAPES_EXTENDED['black-american']
  };
  return directMap[communityId] || null;
}

export function getNoseContouringGuide(noseType) {
  if (!noseType) return NOSE_CONTOURING_DETAILED;
  const map = {
    flat: NOSE_CONTOURING_DETAILED.noseTypes.flatBridge,
    flatBridge: NOSE_CONTOURING_DETAILED.noseTypes.flatBridge,
    wide: NOSE_CONTOURING_DETAILED.noseTypes.wideBridge,
    wideBridge: NOSE_CONTOURING_DETAILED.noseTypes.wideBridge,
    hooked: NOSE_CONTOURING_DETAILED.noseTypes.hooked,
    hump: NOSE_CONTOURING_DETAILED.noseTypes.hooked,
    bulbous: NOSE_CONTOURING_DETAILED.noseTypes.bulbousTip,
    round: NOSE_CONTOURING_DETAILED.noseTypes.bulbousTip,
    long: NOSE_CONTOURING_DETAILED.noseTypes.longNose
  };
  return map[noseType] || NOSE_CONTOURING_DETAILED;
}

export function getHighlightGuide(style) {
  if (!style) return HIGHLIGHT_PLACEMENTS_CULTURAL;
  const map = {
    korea: HIGHLIGHT_PLACEMENTS_CULTURAL.glassSkinKorea,
    glass_skin: HIGHLIGHT_PLACEMENTS_CULTURAL.glassSkinKorea,
    nigerian: HIGHLIGHT_PLACEMENTS_CULTURAL.glassSkinNigeria,
    lagos: HIGHLIGHT_PLACEMENTS_CULTURAL.glassSkinNigeria,
    arab: HIGHLIGHT_PLACEMENTS_CULTURAL.arabGlam,
    arabic: HIGHLIGHT_PLACEMENTS_CULTURAL.arabGlam,
    desi: HIGHLIGHT_PLACEMENTS_CULTURAL.desiHighlight,
    south_asian: HIGHLIGHT_PLACEMENTS_CULTURAL.desiHighlight
  };
  return map[style] || HIGHLIGHT_PLACEMENTS_CULTURAL;
}

