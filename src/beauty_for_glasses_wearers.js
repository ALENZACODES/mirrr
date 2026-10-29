/**
 * MIRRR — Beauty for Glasses Wearers
 * Makeup, skincare, and beauty techniques specifically for people who wear
 * eyeglasses or contact lenses, across all 9 ethnic communities.
 */

export const GLASSES_BEAUTY_FUNDAMENTALS = {
  title: 'Beauty and Glasses — The Core Challenges',
  summary: 'An estimated 75% of adults worldwide need some form of vision correction, and of those, the majority wear eyeglasses at least part of the time. Yet mainstream beauty advice rarely accounts for the significant ways that eyeglasses change the appearance of makeup, the way skin looks through the lens, and the unique skincare challenges that glasses wearing creates.',
  mainChallenges: {
    nosePatches: 'Eyeglass nose pads create pressure marks, oil accumulation, and often hyperpigmentation on the nose bridge over time; this is rarely discussed in mainstream beauty coverage despite being a universal experience for glasses wearers',
    lensDistortion: {
      longsighted: 'Those with longsighted (hyperopic) prescriptions have convex lenses that magnify the eyes; makeup is seen larger through these lenses; eye makeup shows up more dramatically and mistakes are more visible; paradoxically, minimal eye makeup can look dramatically enhanced when seen through magnifying lenses',
      shortsighted: 'Those with shortsighted (myopic) prescriptions have concave lenses that minimise the eyes; eye makeup is made to look smaller through these lenses; more eye makeup is needed to make eyes "read" at normal size through the lenses; without makeup, shortsighted people\'s eyes look smaller in photos when wearing glasses'
    },
    smudging: 'Glasses frames and nose pads create direct contact zones with the skin; skin oils, sweat, and makeup all accumulate on lenses and frames; this creates a cycle of lens smudging and skin irritation',
    noseBridgeMakeup: 'The area under the nose pads is difficult to apply and maintain makeup on; foundation often accumulates in the nose pad marks; setting is especially important in this area',
    eyebrows: 'The eyebrow position relative to the frame is critical; for many frames, the eyebrow is the first facial feature seen above the frame and functions as a framing device for the entire face when wearing glasses'
  }
};

export const NOSE_BRIDGE_SKINCARE = {
  title: 'Nose Bridge Care for Glasses Wearers',
  nosePadMarks: {
    causes: 'Nose pad marks (redness, indentations, and potential hyperpigmentation on the nose bridge) are caused by the constant pressure of nose pads on the skin; the pressure is compressive and causes reduced blood flow in the marked areas; over time, chronic pressure can cause hyperpigmentation through a mechanism similar to PIH',
    ethnicVariation: 'The nose bridge hyperpigmentation from glasses is more pronounced and more persistent on Fitzpatrick IV-VI skin due to the higher concentration of melanocytes and greater tendency toward PIH from any inflammation or pressure',
    prevention: ['Properly adjusted glasses: nose pads should be adjusted by an optician to distribute weight evenly across the nose bridge; ill-fitting glasses that create uneven pressure are the primary cause of marks', 'Silicone nose pads: soft silicone nose pads distribute pressure over a larger area and are more comfortable than hard plastic; they are available as replacement pads at opticians', 'Nose pad covers: small soft sleeves or cushions that go over existing nose pads to increase surface area and reduce pressure; available from optical supplies stores or online', 'Clear adhesive nose pads: can be added to frames without existing nose pads (such as Asian-fit frames which rest on the nose bridge rather than nose pads)']
  },
  hyperpigmentationTreatment: {
    topical: ['Niacinamide (5-10%): applied morning and evening to the nose bridge area; one of the most effective brightening actives; reduces melanin transfer to skin cells', 'Vitamin C serum (5-15%): antioxidant brightening; apply before SPF in the morning', 'Azelaic acid (10-20%): anti-inflammatory and melanin-inhibiting; can be applied to the specific nose bridge marks', 'Alpha Arbutin: a gentler melanin inhibitor; safe for sensitive nose bridge skin'],
    SPF: 'SPF is essential on the nose bridge; UV exposure worsens any hyperpigmentation; apply SPF to the nose bridge every morning, even when wearing glasses (glasses do not provide UV protection)',
    timeline: 'Hyperpigmentation from glasses takes weeks to months to visibly improve; consistency is more important than intensity of treatment'
  },
  skincareSafety: {
    lensSmudge: 'Products applied to the nose bridge and T-zone will inevitably transfer to lenses; silicone-based primers and setting sprays that lock in products reduce the transfer; avoid heavy creams in the nose bridge area during the day',
    framedAvoidance: 'Heavy oils and very occlusive creams on the nose bridge accumulate on lenses quickly; lighter water-based products or very lightly applied products are better in the contact zones'
  }
};

export const EYE_MAKEUP_FOR_GLASSES = {
  title: 'Eye Makeup for Glasses Wearers',
  longsighted: {
    prescription: 'Longsighted (hyperopic) — lenses magnify; eyes appear larger through the frame',
    approach: 'Take a "less is more" approach to liner and heavy shadow; bold makeup is amplified; subtle eye makeup reads as normal; consider that small mistakes in liner are magnified — precision is important',
    techniques: ['Tight-line (waterline liner) rather than thick outer liner — adds definition without visible severity through the lens', 'Neutral eyeshadow with diffused colour rather than sharp lines — magnification makes any edge visible', 'A single coat of lengthening mascara is often sufficient — volumising mascara can look dramatic through magnifying lenses', 'Brow definition is important — the brow sits above the lens and frames the magnified eyes; well-groomed brows with the frame complement is key'],
    colours: 'Warm neutrals, subtle shimmers, and muted earth tones work well; save dramatic metallics and heavy liners for contact lens days'
  },
  shortsighted: {
    prescription: 'Shortsighted (myopic) — lenses reduce; eyes appear smaller through the frame',
    approach: 'Eye makeup needs to be bigger and bolder to compensate for the visual reduction; this is one of the few prescriptions where more eye makeup is consistently recommended; dramatic liner and mascara are your friends',
    techniques: ['Tight-line the upper and lower waterline with a nude/flesh-tone pencil on the lower waterline — this opens the eye visually', 'White or champagne inner corner highlight in the inner corner of the eye is essential for opening the eye', 'Thicker liner on upper lid; the reduction means a thick upper liner reads as a normal liner through the lens', 'Very lengthening and volumising mascara — both coats', 'Lash curling is especially important; straight lashes get optically shortened even more by the concave lens'],
    colours: 'Lighter, reflective colours in the lid and inner corner; darker shades used for depth in the crease where they add definition that compensates for the reduction'
  },
  eyeBrows: {
    importance: 'The eyebrow is particularly important with glasses because for many frames, the brow sits at or above the frame and is the first visible framing feature of the face; the frame and brow together frame the eye — their harmony or conflict is highly visible',
    frameAlignment: {
      browAboveFrame: 'When the brow sits clearly above the frame, the brow is very visible and should be groomed; a thick, bold brow with a thick frame can be striking; a thin brow with a thick frame looks disconnected',
      browBehindFrame: 'For very thick frames where the brow sits behind the frame (almost obscured), the brow is less critical makeup-wise; a simple clean-up of the brow arch is sufficient',
      matchingThickness: 'There is a general principle in glasses fashion that brow thickness and frame thickness should be matched; thick frames with thick brows, thin frames with thin (or naturally shaped) brows'
    },
    archAndGlasses: 'The top edge of the frame follows or counterpoints the brow arch; an eyebrow that curves in harmony with the top of the frame creates visual flow; a brow that fights the frame shape (curves opposite) creates tension that draws attention to the conflict'
  },
  mascara: {
    smudging: 'Mascara smudging onto lenses is the most universal glasses-wearer complaint; the lash brushes the lens with each blink for those whose lashes are at the right length to reach',
    solutions: ['Tubing mascara: surrounds each lash in a tube of film rather than coating it; tubes do not smudge or transfer; removes easily with warm water and no panda eyes on lenses', 'Lengthening but not volumising: lengthening mascaras elongate the lash away from the lid; volumising mascaras add bulk that can be more likely to smudge', 'Lash lift treatment (professional): bends the lashes upward permanently for 6-8 weeks; keeps lashes away from the lens and also visually opens the eye; ideal for regular glasses wearers', 'Curling lashes upward before mascara reduces the chance of the lash tip touching the lens']
  }
};

export const MAKEUP_LONGEVITY_GLASSES = {
  title: 'Makeup Longevity for Glasses Wearers',
  pressureProblem: 'Glasses frames rest on the nose and against the temples and behind the ears; these contact points cause makeup to break down faster than in non-contact areas; the nose bridge is the primary failure point',
  techniques: {
    priming: 'A good primer dramatically improves foundation longevity in the nose bridge area; a pore-filling primer in the nose bridge area creates a smoother surface and reduces migration',
    settingPowder: 'Setting powder (loose or pressed) in the nose bridge contact zone significantly extends makeup; tap (don\'t brush) translucent setting powder onto the nose bridge and around the nose pads',
    settingSpray: 'A firm-hold setting spray applied after completing makeup sets foundation and helps it resist the repeated placement and removal of glasses',
    underEye: 'The frame rests close to the under-eye area in many styles; under-eye concealer should be set with a very light translucent powder to prevent creasing from frame pressure; a long-wear formula helps',
    temples: 'For those with frames that sit against the temples, foundation in this area tends to smudge onto the frame; using a long-wear foundation or setting this area firmly reduces transfer'
  },
  frameCleaning: 'Makeup transfer to frames is inevitable; microfiber lens cleaning cloths remove most makeup from frames gently; for heavy transfer, a small amount of micellar water on the cloth cleans frames without damaging coatings; clean frames daily to prevent foundation build-up in the frame grooves'
};

export const CONTACT_LENS_CONSIDERATIONS = {
  title: 'Contact Lens Beauty Considerations',
  eyeMakeupOrder: {
    importance: 'Inserting contact lenses before applying eye makeup prevents contamination; inserting after allows eye shadow fall-out and particles to be blinked into the eye under the lens',
    correct: 'Correct order: wash hands → insert lenses → apply eye makeup; removing: remove eye makeup first → wash hands → remove lenses',
    removal: 'Remove contact lenses BEFORE removing eye makeup; make-up remover and lenses should never be in contact'
  },
  productSafety: {
    eyeDrops: 'Rewetting drops are recommended for contact lens wearers who wear makeup; mascara, liner, and shadow particles can dry out the eye and irritate under lenses; rewetting throughout the day is helpful',
    products: ['Oil-free eye makeup: oil in eye products can cloud or damage contact lenses', 'Waterproof mascara: waterproof formulas resist the moisture from the eye that contacts the lens; however, removal requires oil-based remover — remove lenses FIRST', 'Glitter and pressed shimmer: loose glitter in the eye with lenses is risky (particles under the lens); baked shimmers are safer than loose glitters', 'Eyelash glue: keep eyelash adhesive away from the waterline and lens area', 'Avoid lining the inner waterline (putting liner inside the lash line) as this is very close to the lens surface'],
    avoid: ['Aerosol sprays near the face while wearing lenses', 'Strong-hold hair spray near the eye area', 'Oil-based eye shadow removers while wearing lenses']
  },
  dryEye: {
    connection: 'Contact lens wear reduces the oxygen supply to the cornea and can cause or worsen dry eyes; the tear film (which lubricates the eye and the lens) is disrupted by contact lenses; makeup wear on top of this compounds the challenge',
    makeup: 'For dry-eye contact lens wearers: choose eye makeup that doesn\'t fragment (avoid flaky mascaras); use minimal liner close to the waterline; consider wearing glasses more often to give the eyes a rest'
  }
};

export const FRAMES_AND_MAKEUP = {
  title: 'Choosing Frames as a Makeup Consideration',
  faceShape: 'The classic guidance on frames for face shapes (round frames for square faces, angular frames for round faces) is still the standard starting point; however, the interaction of frames with makeup is less discussed',
  colour: {
    colourHarmony: 'Frame colour interacts visually with makeup colour; a warm tortoiseshell frame harmonises with warm-toned (bronze, peach, gold) eye makeup; a cool black frame pairs with cool-toned (purple, silver, navy) makeup; clear or nude frames are the most versatile',
    skin: {
      dark: 'On deeper skin tones, bright and bold frame colours (orange, red, bright blue) are striking and intentional; nude and gold frames can disappear and look intentional on deeper skin; very light pink or champagne frames on very dark skin can look mismatched',
      medium: 'Medium skin tones have the most flexibility; tortoiseshell in its warm and cool variants works across the board',
      light: 'On very fair skin, very dark heavy frames provide strong contrast that can look dramatic; lighter frames blend more; nude frames can look like a very subtle enhancement'
    }
  },
  boldFrameApproach: 'With bold statement frames, there is a principle of "either/or": either bold frames OR bold makeup; attempting both results in visual competition; with statement coloured frames, a nude or minimal makeup look allows the frames to be the statement; with neutral frames, bold eye or lip makeup has room to stand out'
};

export const ETHNIC_GLASSES_GUIDE = {
  'west-african': {
    noseBridge: 'West African nose bridge anatomy varies from flat to broad; traditional Western glasses frames are often designed for narrower, higher nose bridges and may create different pressure distribution and fit issues on a broader West African nose bridge; a properly fitted frame from an optician who understands West African facial anatomy is important',
    nosePadHyperpigmentation: 'Fitzpatrick V-VI West African skin is particularly prone to hyperpigmentation from nose pad pressure; regular niacinamide and vitamin C treatment at the nose bridge contact zones; silicone nose pads or nose pad covers to reduce pressure',
    boldFrames: 'Bold, expressive frames are a significant part of West African style identity; statement frames paired with a lip-focus makeup look (bold lip, minimal eye) complements without competing',
    recommendations: 'Asian-fit or low-nose-bridge frames (designed with flatter nose bridges in mind) often fit West African noses better than standard frames; ask opticians about this category of frame design'
  },
  'south-asian': {
    noseBridge: 'South Asian nose bridge anatomy varies widely; the diversity of the subcontinent means South Asian noses range from narrow and high to broad and lower; frame fitting should be individual',
    nosePadHyperpigmentation: 'Fitzpatrick III-V South Asian skin is prone to PIH from nose pad pressure; a consistent brightening routine for the nose bridge is important for long-term glasses wearers',
    kajal: 'Traditional kajal (kohl) is a staple in South Asian eye makeup and is often worn with glasses; kajal on the waterline with heavy frames can look striking; shortsighted prescriptions particularly benefit from kajal\'s eye-opening effect when lenses visually reduce eye size',
    recommendations: 'For South Asian women with shortsighted prescriptions: kajal on the lower waterline + nude inner corner + curled mascara is a powerful eye-opening combination that reads well through concave lenses'
  },
  caribbean: {
    noseBridge: 'Caribbean facial anatomy reflects diverse heritage; African-heritage Caribbean individuals may have broader nose bridges with similar fit considerations to West African anatomy; wider frame options or Asian-fit frames may provide better nose bridge fit',
    colourfulFrames: 'Caribbean beauty aesthetic often embraces bold colour; bright frame colours paired with complementary (not matching) eye or lip makeup is a classic Caribbean style approach',
    recommendations: 'Bright coral or red frames paired with a warm bronze eye look and nude lip; deep jewel-tone frames paired with a minimal makeup and one bold lip colour'
  },
  arab: {
    eye: 'Traditional Arab eye makeup (heavy kohl, dramatic liner) interacts particularly with glasses wear; for longsighted prescriptions, traditional heavy kohl lining is visually amplified; for shortsighted, it is the ideal compensation for visual reduction',
    frames: 'Arab fashion embraces high-design frames; luxury frames are a significant fashion accessory; statement frames paired with bold lip (Arab makeup\'s traditional strength — deep berry, classic red) is a striking combination',
    nosePad: 'Fitzpatrick III-V Arab skin ranges from medium to deep; PIH from nose pads is a moderate to significant concern depending on skin tone; brightening skincare on the nose bridge',
    recommendations: 'For traditional Arab eye looks with glasses: tight-line with kajal on the waterline of the lower lid; this adds definition that reads through the lens without the smudging issues of heavy upper lid liner rubbing on the frame'
  },
  latina: {
    diversity: 'Latina facial anatomy spans a huge range; from narrow European-heritage faces to broader Indigenous-heritage features; frame fitting advice must be individualised',
    eye: 'Latina eye makeup often emphasises depth and drama; for shortsighted prescriptions, this is particularly effective at compensating for lens visual reduction; for longsighted, a more diffused drama with blended shadows works best',
    browGame: 'Bold, full brows are a significant trend in Latina beauty aesthetics; well-defined full brows pair beautifully with most glasses frames and add expressiveness to the overall look',
    recommendations: 'For broad brow and statement frame combination: the brow should follow (not fight) the top curve of the frame; if the frame has a strong angular top edge, a slightly arched brow complements; a rounded frame pairs well with a soft arched brow'
  },
  'east-asian': {
    bridgeFit: 'East Asian nose bridge anatomy (lower nose bridge, flatter across) makes standard Western glasses frame fitting challenging; most Western frames are designed for higher nose bridges and sit on a flat East Asian nose bridge incorrectly — sitting too low or touching the cheeks',
    asianFit: {
      what: '"Asian-fit" or "low nose bridge" frames are designed specifically for East Asian facial anatomy (and also fit many West African, Caribbean, and Latina facial features); they have a lower or no nose pad adjustment area, sit higher relative to the nose, and have adjusted temple angles',
      popularBrands: 'Many Korean, Japanese, and Taiwanese optical brands design specifically for East Asian facial anatomy; brands like JINS, Zoff (Japan), Gentle Monster (Korea), and Zenni Optical offer frames with "low nose bridge" designation',
      impact: 'A properly fitted Asian-fit frame sits correctly without slipping down the nose; this changes the frame-to-brow relationship and the overall aesthetics significantly — proper fit is a prerequisite to all makeup advice for glasses'
    },
    recommendations: 'For East Asian faces with shortsighted prescriptions: double eyelid tape or eyeshadow techniques that create or enhance a crease (popular in Korean and Japanese makeup) pair powerfully with glasses to counteract the visual reduction from concave lenses; a defined crease adds dimension that reads through the lens'
  },
  'east-african': {
    noseBridge: 'East African facial anatomy includes broad, flat nose bridges (especially Somali and Oromo communities) and higher, narrower bridges (Ethiopian highlands communities); frame fitting varies',
    nosePadHyperpigmentation: 'Fitzpatrick V-VI East African skin is prone to PIH from nose pad pressure; brightening routine at the nose bridge; silicone nose pads; properly fitted frames to distribute pressure',
    frames: 'Bold, statement frames are growing in East African diaspora fashion; the East African diaspora in Scandinavia, UK, and North America has seen the emergence of distinctive fashion aesthetics including bold frame choices',
    recommendations: 'Asian-fit frames often also fit East African broad nose bridges better than standard Western frames; worth trying this category when frame shopping'
  },
  'south-african': {
    diversity: 'South African glasses wearers span the full spectrum of facial anatomy and nose bridge variety; Black South African communities may have broader nose bridge anatomy similar to West African facial features',
    nosePad: 'Hyperpigmentation from nose pads is a concern for Fitzpatrick V-VI South African skin; marula oil on the nose bridge at night (after removing glasses) provides anti-inflammatory support; brightening actives for daytime',
    frames: 'South African fashion is diverse and experimental; the Johannesburg and Cape Town fashion scenes have distinct aesthetics; bold and artistic frame choices are celebrated in urban South African fashion',
    recommendations: 'For broad nose bridge fit: Asian-fit frames or frames specifically designed for low nose bridges provide better fit and reduce the uneven pressure distribution that causes pronounced nose pad marks'
  },
  'black-american': {
    noseBridge: 'Black American facial anatomy commonly includes broader, lower nose bridges that fit standard Western frames poorly; frames often slide down, sit too low, or dig in at the nose pad contact points',
    asianFit: '"Asian-fit" or "low nose bridge" frames are a commonly recommended solution for Black American glasses wearers; the shared broad flat nose bridge anatomy benefits from the same frame engineering designed for East Asian faces',
    nosePadHyperpigmentation: 'PIH from nose pads is a very common complaint among Black American glasses wearers; it is underrepresented in mainstream beauty content; treatment with niacinamide, vitamin C, and azelaic acid on the specific nose bridge marks',
    communityDiscourse: 'Black beauty content creators have begun addressing the nose bridge mark issue specifically for dark skin; there is growing community conversation about nose-bridge-friendly frames and post-mark treatment skincare for Fitzpatrick V-VI skin',
    eyeCrease: 'For Black American women: the eye shadow crease application (defining the natural crease or hooded eye anatomy) interacts with lens type; for shortsighted prescriptions, defining the crease is an effective way to add visible dimension to eyes that the concave lens makes appear smaller',
    recommendations: ['Try "Asian-fit" or low nose bridge frames when shopping for glasses', 'Niacinamide 10% daily on nose bridge marks (morning and night)', 'Ask optician about silicone nose pads if existing pads cause marks', 'For shortsighted prescriptions: nude lower waterline liner and white inner corner highlight are two quick steps that open the eye visually through the concave lens']
  }
};

export function getGlassesBeautyFundamentals() {
  return GLASSES_BEAUTY_FUNDAMENTALS;
}

export function getNoseBridgeSkincare() {
  return NOSE_BRIDGE_SKINCARE;
}

export function getEyeMakeupForGlasses(prescriptionType) {
  const map = {
    longsighted: EYE_MAKEUP_FOR_GLASSES.longsighted,
    shortsighted: EYE_MAKEUP_FOR_GLASSES.shortsighted,
    eyebrows: EYE_MAKEUP_FOR_GLASSES.eyeBrows,
    mascara: EYE_MAKEUP_FOR_GLASSES.mascara
  };
  return map[prescriptionType] || EYE_MAKEUP_FOR_GLASSES;
}

export function getMakeupLongevityGlasses() {
  return MAKEUP_LONGEVITY_GLASSES;
}

export function getContactLensConsiderations() {
  return CONTACT_LENS_CONSIDERATIONS;
}

export function getFramesAndMakeup() {
  return FRAMES_AND_MAKEUP;
}

export function getEthnicGlassesGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_GLASSES_GUIDE['west-african'],
    'south-asian': ETHNIC_GLASSES_GUIDE['south-asian'],
    caribbean: ETHNIC_GLASSES_GUIDE.caribbean,
    arab: ETHNIC_GLASSES_GUIDE.arab,
    latina: ETHNIC_GLASSES_GUIDE.latina,
    'east-asian': ETHNIC_GLASSES_GUIDE['east-asian'],
    'east-african': ETHNIC_GLASSES_GUIDE['east-african'],
    'south-african': ETHNIC_GLASSES_GUIDE['south-african'],
    'black-american': ETHNIC_GLASSES_GUIDE['black-american']
  };
  return directMap[communityId] || null;
}

export const GLASSES_BEAUTY_STATS = {
  moduleId: 'beauty_for_glasses_wearers',
  version: '1.0.0',
  topics: ['glasses and makeup', 'contact lenses beauty', 'nose bridge hyperpigmentation', 'longsighted makeup', 'shortsighted makeup', 'mascara smudge glasses', 'tubing mascara', 'Asian-fit frames', 'low nose bridge frames', 'PIH nose pads', 'glasses frames and brows', 'glasses frame colour', 'niacinamide nose bridge', 'kajal with glasses', 'concave lens makeup', 'magnifying lens makeup', 'glasses frame fitting ethnic', 'contact lens makeup safety', 'glasses makeup longevity'],
  communitiesSupported: 9,
  keyFacts: [
    '"Asian-fit" or "low nose bridge" frames are designed for flatter, lower nose bridge anatomy common in East Asian faces — and these same frames often provide significantly better fit for Black American, West African, East African, and Caribbean individuals with broader flat nose bridges, who otherwise struggle with standard Western frames sliding down or causing uneven pressure',
    'For shortsighted (myopic) prescriptions, concave lenses make eyes appear visually smaller; techniques to counteract this include nude liner on the lower waterline, white or champagne inner corner highlight, tight-lining the upper waterline, and heavily curled mascara — the opposite advice to longsighted prescriptions where less eye makeup is often better',
    'Tubing mascara (which surrounds each lash in a film tube rather than coating it) is the most effective solution for the universal glasses-wearer problem of mascara smudging onto lenses; tubes do not transfer on the inside of the lens during blinking',
    'PIH (post-inflammatory hyperpigmentation) from nose pad pressure on Fitzpatrick IV-VI skin is a genuinely significant and underrepresented beauty concern; Black American and East African beauty communities have begun creating specific content about treating these marks with niacinamide, vitamin C, and azelaic acid',
    'Contact lenses should always be inserted before eye makeup application to prevent contamination — and removed before removing eye makeup, since oil-based makeup removers can damage the lens'
  ]
};
