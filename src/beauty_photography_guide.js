/**
 * MIRRR — Beauty Photography & Content Creation Guide
 * Makeup for photos and video, lighting theory, camera-ready skin,
 * content creator tips, ethnic skin photography.
 */

export const PHOTOGRAPHY_FUNDAMENTALS = {
  title: 'Photography Fundamentals for Beauty Content',
  lightAndSkin: {
    whyLightMatters: 'Photography captures reflected light, not colour directly. The same skin, makeup, and hair look completely different under different light sources. Professional beauty photographers control light obsessively because no product, pose, or editing can compensate for fundamentally bad light.',
    naturalLight: {
      bestTime: 'Golden hour (30-60 minutes after sunrise and before sunset) — warm, directional light with long shadows that sculpt the face beautifully; also called the "magic hour" in photography',
      overcastDay: 'Cloudy days provide large, diffused, soft light with no harsh shadows — essentially a giant softbox; excellent for beauty photography; shows skin textures and tones accurately; not as dramatic as golden hour but very forgiving',
      directNoonSun: 'Harsh, overhead, unflattering — creates harsh shadows under the eyes, nose, and chin; makes pores appear larger; makes the face look flat; avoid for beauty photography unless deliberately artistic'
    },
    artificialLight: {
      ringLight: 'Circular LED light surrounding the camera lens; creates a characteristic ring-shaped catchlight in the eyes; popular with beauty content creators for the even, frontal light that reduces shadows on the face; gives the "creator aesthetic" that audiences recognise from Instagram and YouTube; does not provide dimensional light',
      softbox: 'Large box with diffuser material over the light source; creates softer, more flattering light than bare bulbs; professional photography standard; one softbox at 45° angle is classic portrait lighting',
      reflector: 'Bounces existing light back toward the subject; a white or silver reflector under the chin eliminates shadows under eyes and nose; makeup artist trick is to hold a white foam board under the face to open up shadows'
    },
    colourTemperature: {
      warmLight: 'Incandescent/tungsten light (2700-3000K colour temperature) — warm yellow-orange; skin looks warm, flattering, bronze-toned; standard household lighting; makes warm-toned makeup (terracotta, coral) look particularly beautiful',
      coolLight: 'Fluorescent light (4000-5000K) — can have a green or cool tint; unflattering for most skin tones; makes cool-toned makeup look better but skin often looks washed out or sallow',
      daylight: 'Approximately 5500-6500K; neutral to slightly cool; renders colours most accurately',
      practicalImplication: 'Apply makeup under the same light you\'ll be photographed in; makeup applied under warm bathroom light then photographed in cool daylight will look completely different'
    }
  },
  cameraTechnology: {
    sensors: {
      problem: 'Camera sensors historically have been calibrated with lighter skin as the default — this is a well-documented bias in photographic technology going back to Kodak\'s original "Shirley cards" (test photos of a white woman used to set colour processing standards in photographic labs until the 1990s)',
      Shirley_Cards: 'Kodak\'s Shirley Card was the standard used by all photo labs to calibrate colour — it depicted a light-skinned white woman; labs would adjust their chemicals and printing to make "Shirley" look good; dark-skinned subjects in the same image would be underexposed or lose detail; this bias was built into photographic infrastructure for decades',
      modernDigital: 'Digital cameras are better but still show bias: automatic white balance and metering systems optimise for light-medium skin; subjects with dark skin are often underexposed in auto mode; subjects with very light skin are often overexposed; manual control by a skilled photographer is important'
    },
    exposure: 'For darker skin: a photographer may need to add 1-2 stops of positive exposure compensation in auto or semi-auto modes; this ensures detail in darker skin is captured rather than losing it to shadow; for lighter skin: careful not to "blow out" (overexpose) fair skin which loses all detail in the highlights'
  }
};

export const MAKEUP_FOR_PHOTOGRAPHY = {
  title: 'Makeup Specifically Formulated for Photographs',
  flashPhotography: {
    problem_whiteCast: 'Sunscreen with high SPF, especially mineral-only sunscreen (titanium dioxide, zinc oxide), reflects UV light AND visible light; in flash photography, this creates a bright white glow around the face that is captured by the camera but invisible to the eye; this is why celebrities sometimes look like they have a white face mask in paparazzi photos',
    solution: 'Use sunscreen containing chemical UV filters (avobenzone, octinoxate, octisalate) rather than or in addition to physical (zinc oxide, titanium dioxide) for events where flash photography is expected; OR use HD mineral formulations specifically designed to be camera-friendly; OR ensure flash is positioned correctly to minimise this effect',
    ethnicNote: 'White cast from mineral SPF is MORE visible on darker Fitzpatrick V-VI skin, both in person and on camera; this was one of the primary complaints driving development of clear/invisible zinc oxide formulations and tinted mineral sunscreens',
    mattePowders: 'HD (High Definition) powder is very finely milled to be invisible on camera; regular translucent setting powders can cause the same white cast issue as mineral SPF in flash photography; look for products labelled "HD", "flashback-free", or "camera-ready"'
  },
  foundationForCamera: {
    coverage: 'Camera-ready foundation: medium to full coverage preferred (minor imperfections become more visible on camera); however avoid caking — thicker layers of foundation can look heavy on camera even when imperceptible in person',
    finish: 'Matte or satin finishes read better on camera than dewy or luminous; a very dewy finish can look greasy or sweaty on camera (especially with flash), even if it looks beautifully radiant in person; set dewy skin lightly with setting powder for video',
    shadeForCamera: 'Natural lighting and studio lighting may render the foundation shade slightly differently; a shade that matches perfectly in person may read slightly lighter or darker on camera; checking in monitor or reviewing photographs during a shoot is important',
    HD_formulas: 'HD (high-definition) foundations contain very fine-milled pigments and light-scattering ingredients; developed specifically for TV and film where the camera\'s resolution reveals every texture and edge'
  },
  eyesForCamera: {
    blackEyeliner: 'Black liner on both upper and lower waterline and lash line makes eyes appear defined and awake on camera; without definition, eyes can "disappear" on camera especially for monolid or hooded eyes',
    falseLashes: 'Individual false lashes or a natural-finish strip lash dramatically improve eye photos; natural lashes can look sparse on camera even when they look fine in person',
    mascara: 'Use waterproof for long shoots or sweaty environments (lights = heat = sweating); black adds most definition; brown mascara is a common makeup artist trick for a soft but defined look on fair skin',
    eyeshadow_saturation: 'Camera reduces colour saturation approximately 20-30% compared to what the eye sees; eyeshadow that appears strong and pigmented in person often reads softer on camera; slightly intensify eyeshadow for photography compared to what you\'d wear normally',
    primers: 'Eyeshadow primer is more important for photography than everyday wear — it prevents creasing (very obvious in photos) and maintains saturation'
  },
  lipsForCamera: {
    liner_essential: 'Lip liner is non-negotiable for photography; without it, lips can look shapeless or the lipstick can bleed into fine lines (perioral lines); photograph every possible imperfection',
    matte_vs_gloss: 'Matte lipstick reads as more saturated and defined in photography; gloss creates attractive glow in photos but can cause unintended glare especially with flash; gloss with strategic lighting looks beautiful',
    longlasting: 'Long-lasting or transfer-resistant formulas are important for video and long-shoot sessions; touch-ups between takes or during long photo shoots are manageable but less than ideal'
  }
};

export const VIDEO_AND_CONTENT_CREATOR = {
  title: 'Beauty for Video & Content Creation',
  youtubeInstagram: {
    ringLight: 'The most ubiquitous content creator tool; places the camera in the center of the ring; the circular catchlight in the eyes is the characteristic "influencer" look',
    camera: 'Smartphone cameras now rival DSLRs for social media content; portrait mode for softened backgrounds; front camera vs rear camera quality difference matters — rear camera is typically much higher quality',
    setupTips: ['Shoot at the same level as your face (camera at eye level); shooting up makes skin look oily/textured; shooting slightly above (high angle) is flattering for most faces', 'Soft diffused light at 45° angle to the face creates dimension; straight-on ring light is flattering but flat', 'Film during "golden hour" for warm glow; or near a large window with sheer curtains for diffused natural light']
  },
  makeupForVideo: {
    eyebrows: 'The most important feature on camera — define eyebrows more than you would for in-person; vague or sparse brows look undefined on camera; fill with a pomade or brow pencil for definition',
    blush: 'Blush should be 20% more intense for video than in-person; cameras desaturate; pale blush becomes invisible',
    contour: 'For video: strong contour is necessary for 3D facial definition to appear on a 2D screen; the contour that looks subtle in person reads as dimensionality on screen',
    highlighter: 'Catch light strategically — highlight on the bridge of the nose and cheekbones will catch your key light and create a beautiful glow on screen'
  },
  contentCreatorSpecificTips: {
    consistentSetup: 'Consistent lighting setup allows for consistent colour grading in post-production; a consistent colour temperature lets you batch-edit content efficiently',
    colourGrading: 'Most content goes through post-production colour grading (via apps like VSCO, Lightroom mobile, or Capcut); know whether you tend toward cool (desaturated, clean aesthetic) or warm (golden, cosy aesthetic) grading and apply makeup accordingly',
    thumbnails: 'YouTube thumbnail makeup is different from video makeup; thumbnails viewed at tiny sizes need extreme expression and very high contrast; bold eye, defined brows, open expression'
  }
};

export const ETHNIC_SKIN_PHOTOGRAPHY = {
  'west-african': {
    challenge: 'Fitzpatrick V-VI skin with deep tones and warm undertones historically underexposed on camera; black skin tones absorb more light, requiring additional exposure to capture detail',
    solutions: ['Add positive exposure compensation (+1 to +2 stops in auto mode)', 'Use a white or silver reflector to bounce fill light onto the face', 'Avoid harsh backlighting which creates silhouette — use front or side lighting', 'Flash can flatten deep skin — use off-camera flash at an angle for dimension'],
    makeupTips: 'Gold and warm bronze highlighters are particularly stunning on deep dark skin in photography; cool silver or champagne highlights can look grey or flat; warm colours photograph more vibrantly on deep skin than they appear in person',
    foundation: 'HD foundation in the correct warm-brown to deep-mahogany shade; ensure the shade is truly warm-toned not neutral-cool; deep skin with neutral-cool foundation photographs with a grey or ashy quality under flash'
  },
  'south-asian': {
    challenge: 'South Asian skin (Fitzpatrick III-V) often has warm olive to golden undertones; can photograph with yellow-green cast under wrong lighting; warm light is more flattering than cool fluorescent',
    solutions: ['Warm incandescent or warm-white LED light is very flattering', 'Avoid fluorescent light (green cast)', 'Warm colour correction in post: adding warmth and reducing green in the photo'],
    makeupTips: 'Warm peachy-golden blush reads very beautifully on olive South Asian skin in photos; avoid very pink blush which creates an unexpected clash; warm bronze highlight is stunning',
    wedding: 'South Asian wedding photography is a specialised photography field; heavily flash and LED supplemented; the vibrant reds and golds of South Asian bridal attire require photographers skilled in rendering saturated colours without blowout; dark hair and skin against a red lehenga is technically challenging'
  },
  caribbean: {
    challenge: 'Caribbean skin ranges enormously; similar considerations to West African for deep Afro-Caribbean skin; mixed heritage communities may have olive or brown tones with warm undertones',
    solutions: 'Warm directional light; add fill light to face; warm gold highlighter for deep skin photography',
    makeupTips: 'Caribbean carnival photography requires heavy, theatrical makeup to read through movement, distance, and bright outdoor light; over-applied in studio would look theatrical but correct outdoors at carnival'
  },
  arab: {
    challenge: 'Arab skin ranges from fair Levantine (Fitzpatrick II-III) to medium Gulf (III-IV) to darker Egyptian and North African (IV-V); diverse',
    solutions: 'Generally medium skin tones photograph with moderate adjustments needed; cool light flatters lighter Arab skin; warm light flatters olive and medium-darker Arab skin',
    makeupTips: 'The kohl/kajal-heavy eye look photographs beautifully with good light; strong brow definition is critical on camera; Arab bridal photography typically uses dramatic makeup that reads well even under intense studio lights',
    note: 'Modesty considerations in some Arab photography contexts — styling may need to account for hijab-wearing models or subjects'
  },
  latina: {
    challenge: 'Enormous diversity; warm olive skin tones very common; similar to South Asian in terms of warm-light preference',
    solutions: 'Warm natural or warm artificial light; slight warm colour grade in post; warm bronze skin products for a JLo-style glow',
    makeupTips: 'The "Latina glow" is achieved with a dewy base topped with warm bronze for photos; gold highlight on the high points; warm coral blush; red lip or deep berry for bold moment'
  },
  'east-asian': {
    challenge: 'East Asian skin (Fitzpatrick II-III typically) often has a neutral to cool undertone with some yellow; can appear sallow or greenish under wrong light; very smooth skin surface photographs well',
    solutions: 'Natural soft daylight is typically most flattering; avoid heavy yellow-tinted warm light which can increase sallow appearance; cool-neutral or slightly warm lighting',
    makeupTips: 'Pearl and soft champagne highlight rather than gold on lighter East Asian skin; the ultra-dewy K-beauty finish requires specifically diffused light to photograph well — strong flash can blow out dewy skin; for YouTube/Selfie: lighting is typically more controlled and the dewy look is extremely popular',
    camera: 'Korean beauty culture has driven some of the most sophisticated beauty filter and editing technology (Meitu, Snow app, standard camera portrait mode effects) — these tools are now global; photography and retouching are explicitly part of the beauty culture'
  },
  'east-african': {
    challenge: 'Very deep Fitzpatrick VI skin; similar to West African considerations; dramatic photography opportunities due to extraordinary high-contrast between very deep skin and bright colours or jewellery',
    solutions: 'Add positive exposure; avoid harsh overhead light; use side lighting to show bone structure; use a reflector under the face; warm to neutral key light',
    makeupTips: 'East African models (Iman, Liya Kebede, Ajak Deng, Aweng Chuol) have set the standard for photographing very deep skin beautifully; warm gold on the prominent East African bone structure is iconic; editorial photography uses graphic colour and high contrast',
    note: 'Professional photographers with experience photographing deep skin make a significant difference; a photographer who only shoots light-medium skin will struggle with exposure and lighting setup for deep skin'
  },
  'south-african': {
    challenge: 'Very diverse; similar to general guidance for the specific heritage',
    makeupTips: 'For Black South African events/photography: bold colour reads well; for Indian South African: South Asian-style bridal photography with vibrant textiles; Rooibos-infused skincare for pre-shoot prep skin care is authentic and effective'
  },
  'black-american': {
    challenge: 'Fitzpatrick IV-VI primarily; historically the most poorly-served demographic in photographic technology and industry practice; the development of inclusive photography practices has largely been driven by advocacy from Black photographers, filmmakers, and beauty industry figures',
    advocacy: 'Ava DuVernay, Spike Lee, and others have publicly called out equipment and industry biases; photographers like Tyler Mitchell (who became the first Black photographer to shoot a Vogue US cover with Beyoncé in 2018) have normalised excellent photography of Black subjects at the highest editorial level',
    solutions: 'Positive exposure compensation; warm or neutral key light; fill light on face; avoid top-down harsh light; model and subject expertise matters — experienced subjects know how to manage their angles and placement relative to light',
    makeupTips: 'The Black American beauty photography aesthetic at its best: highly defined, dimensional, with warm skin glowing; gold or copper highlighter catches light against very dark skin in a way that is extraordinary; the contrast of jewel-tone eye looks against very deep skin is visually stunning',
    contentCreation: 'Black beauty content creators have been pioneers in demonstrating lighting setups that work for dark skin on camera; ring lights + warm LED panels; ring lights alone on dark skin create a flat lit effect — adding side panel lighting provides dimension; many tutorials on YouTube from Black creators specifically address this'
  }
};

export function getPhotographyFundamentals(section) {
  if (!section) return PHOTOGRAPHY_FUNDAMENTALS;
  const map = {
    light: PHOTOGRAPHY_FUNDAMENTALS.lightAndSkin,
    camera: PHOTOGRAPHY_FUNDAMENTALS.cameraTechnology,
    shirley: PHOTOGRAPHY_FUNDAMENTALS.cameraTechnology.sensors,
    bias: PHOTOGRAPHY_FUNDAMENTALS.cameraTechnology.sensors
  };
  return map[section] || PHOTOGRAPHY_FUNDAMENTALS;
}

export function getMakeupForPhotography(area) {
  if (!area) return MAKEUP_FOR_PHOTOGRAPHY;
  const map = {
    flash: MAKEUP_FOR_PHOTOGRAPHY.flashPhotography,
    foundation: MAKEUP_FOR_PHOTOGRAPHY.foundationForCamera,
    eyes: MAKEUP_FOR_PHOTOGRAPHY.eyesForCamera,
    lips: MAKEUP_FOR_PHOTOGRAPHY.lipsForCamera
  };
  return map[area.toLowerCase()] || MAKEUP_FOR_PHOTOGRAPHY;
}

export function getVideoMakeupGuide(section) {
  if (!section) return VIDEO_AND_CONTENT_CREATOR;
  return VIDEO_AND_CONTENT_CREATOR[section] || VIDEO_AND_CONTENT_CREATOR;
}

export function getEthnicPhotographyGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_SKIN_PHOTOGRAPHY['west-african'],
    'south-asian': ETHNIC_SKIN_PHOTOGRAPHY['south-asian'],
    caribbean: ETHNIC_SKIN_PHOTOGRAPHY.caribbean,
    arab: ETHNIC_SKIN_PHOTOGRAPHY.arab,
    latina: ETHNIC_SKIN_PHOTOGRAPHY.latina,
    'east-asian': ETHNIC_SKIN_PHOTOGRAPHY['east-asian'],
    'east-african': ETHNIC_SKIN_PHOTOGRAPHY['east-african'],
    'south-african': ETHNIC_SKIN_PHOTOGRAPHY['south-african'],
    'black-american': ETHNIC_SKIN_PHOTOGRAPHY['black-american']
  };
  return directMap[communityId] || null;
}

export const BEAUTY_PHOTOGRAPHY_STATS = {
  moduleId: 'beauty_photography_guide',
  version: '1.0.0',
  topics: ['beauty photography', 'makeup for camera', 'flash photography', 'white cast SPF', 'ring light', 'content creator', 'HD foundation', 'skin photography', 'dark skin photography', 'Kodak Shirley card', 'lighting setup', 'golden hour photography', 'YouTube makeup', 'Instagram beauty'],
  communitiesSupported: 9,
  keyFacts: [
    'Kodak\'s "Shirley Card" (a light-skinned white woman used to calibrate photo labs\' colour standards) built racial bias into photographic infrastructure for decades — dark-skinned subjects were systematically underexposed',
    'Camera sensors desaturate eyeshadow colour approximately 20-30% compared to what the human eye sees — intensify eyeshadow for photography compared to everyday wear',
    'Tyler Mitchell became the first Black photographer to shoot a Vogue US cover in September 2018 (with Beyoncé) — a watershed moment in normalising excellent photography of Black subjects at editorial level',
    'Mineral sunscreen (zinc oxide, titanium dioxide) reflects visible light as well as UV, creating a white glow in flash photography ("flashback") — use chemical filters or specifically "flashback-free" formulas for photo events',
    'Frontal ring lights create even, shadowless light popular in content creation but can look flat without additional side lighting especially on very dark skin',
    'The Shirley Card issue was brought to public attention partly because an Eastman Kodak sales rep told a filmmaker the system couldn\'t show dark wood furniture properly — the same principle applies to dark skin'
  ]
};
