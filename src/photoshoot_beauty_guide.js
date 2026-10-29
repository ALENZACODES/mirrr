/**
 * MIRRR Photoshoot Beauty Guide
 * Makeup for flash photography, natural light, digital/studio light,
 * ring light, video, and professional shoots — with deep-skin focus
 */

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────

export const PHOTOSHOOT_OVERVIEW = {
  key_principle: 'Camera sees differently from the human eye. What looks beautiful in person can look flat, washed-out, or overdone on camera — and vice versa. Photoshoot makeup is calibrated for the lens, not the room.',
  core_differences: {
    dimensionality: 'Camera flattens. Makeup must compensate with deliberate contouring and depth — more than you would use for real life.',
    colour: 'Flash photography can cool down warm tones. Natural light photography can warm up makeup. What reads as "natural" in person may read as "bare" on camera.',
    skin_texture: 'Camera highlights texture (pores, dry patches, fine lines) more than the eye. Primer and smooth base are critical.',
    flashback: 'Flash photography reacts with certain ingredients (titanium dioxide, zinc oxide) to create a white/grey cast — disproportionately affecting deep skin tones. See flashback guide in setting products module.',
  },
  light_types: ['Flash/strobe', 'Natural daylight', 'Studio tungsten', 'LED/fluorescent', 'Ring light', 'Phone camera light'],
};

// ─── FLASH PHOTOGRAPHY MAKEUP ────────────────────────────────────────────────

export const FLASH_PHOTOGRAPHY_GUIDE = {
  what_flash_does: 'Flash photography is harsh, direct, and flat. It eliminates natural shadow and dimension. It also reflects off titanium dioxide and zinc oxide in cosmetics, creating white cast (flashback).',
  foundation: {
    avoid: ['Foundations with titanium dioxide as a primary UV filter', 'Very high SPF foundations in general (more TiO2)', 'Shimmery or too-dewy foundations (reflect flash unpredictably)'],
    prefer: ['Matte to satin finish foundations for flash', 'Full-coverage buildable foundation — flash can thin out coverage appearance', 'Chemical SPF under foundation instead of physical/mineral SPF'],
    deep_skin: 'For Fitzpatrick IV-VI: test your full look under phone flash BEFORE the event. What looks perfect in person may photograph grey due to white-cast ingredients. Fenty Pro Filt\'r is specifically formulated to be flashback-resistant across all skin tones.',
  },
  powder: {
    avoid: ['HD setting powders (high silica content causes flashback)', 'Laura Mercier original translucent powder on dark skin', 'Heavy powder application under flash (looks cakey and flat)'],
    prefer: ['Finely milled translucent powders tested for flashback', 'Banana powder for under-eyes (warm tone cancels flashback)', 'Minimal powder — enough to set, not enough to mattify completely'],
    test: 'Put your phone camera on flash and test your powder under flash at home. If you see a white or grey ring around your face or a stark white zone under your eyes — there is flashback.',
  },
  eyes: {
    shadow: 'Eye shadow reads lighter on camera than in person. Darken shadows slightly beyond what looks right in person — they will look correct on camera. Blend exceptionally well — camera captures harsh lines.',
    liner: 'Bold liner helps eyes "pop" in flash photography. Tight-lining (upper waterline) makes eyes look larger and more defined without looking theatrical in person.',
    lashes: 'Full false lashes for flash photography. Individual lashes or half lashes for a softer look. Mascara alone often reads as minimal in flash.',
  },
  contour: 'Flash flattens depth. Contour significantly more than you would in real life. The contour that looks "overdone" in person will look "snatched" in flash photography. Professional photographers know this — it is not a flaw in real life, it is compensation for the lens.',
  highlight: {
    caution: 'Highlighter behaves unpredictably under flash. Glitter and large-particle highlight can create "lens flare" spots in photographs. Fine-particle or satin highlights perform better in flash.',
    best: 'Inner corner highlight and brow bone highlight look beautiful in flash photography. Cheekbone highlight should be fine-milled.',
  },
  lips: 'Bold lips photograph well. Nude lips can "disappear" in flash photography, especially on fair skin. Line slightly outside the natural lip line — camera reduces apparent lip fullness.',
};

// ─── NATURAL LIGHT PHOTOGRAPHY ───────────────────────────────────────────────

export const NATURAL_LIGHT_GUIDE = {
  overview: 'Natural light is the most forgiving for photography — it flatters skin, minimises pores, and looks authentic. Social media content, lifestyle brand photography, and editorial shoots often use natural light.',
  best_times: {
    golden_hour: 'One hour after sunrise and one hour before sunset. Warm, diffuse light that flatters all skin tones. Creates a luminous, golden quality. Best for outdoor portrait shoots.',
    blue_hour: 'The 20-30 minutes after sunset (twilight). Cool, even, soft light. Flattering for portraits and creates a dreamy quality. No hard shadows.',
    overcast: 'Overcast sky acts as a giant diffuser. Soft, even light with no shadows. Very flattering for skin. The "studio quality" of outdoor light. Many beauty photographers prefer overcast days.',
    avoid_midday: 'Harsh overhead midday sun creates dark under-eye shadows, nose shadows, and squinting. Unflattering for portraits. If shooting at midday: find open shade.',
  },
  makeup_for_natural_light: {
    finish: 'Dewy and glowy finishes look beautiful in natural light. Unlike flash, natural light embraces glow without creating harsh reflections.',
    coverage: 'Can wear lighter coverage in natural light — skin looks more even. Sheer-to-medium coverage + colour correction is often sufficient.',
    no_flashback_concern: 'Titanium dioxide and zinc oxide do NOT cause flashback in natural light. Mineral SPF is perfectly fine in natural light photography.',
    deep_skin: 'Natural light showcases the natural luminosity of deep skin. A dewy base, gold highlighter on cheekbones, and a bold lip are a stunning combination for Fitzpatrick V-VI in natural light.',
  },
  golden_hour_makeup: {
    foundation: 'Satin or natural finish — lean into the warmth of golden hour light.',
    highlighter: 'Gold and bronze highlighters amplify the golden hour light beautifully. For deep skin: bronze, copper, and gold highlighters look incandescent in golden hour.',
    lip: 'A warm-toned lip — coral, orange-red, terracotta — complements golden hour light.',
  },
};

// ─── RING LIGHT PHOTOGRAPHY ───────────────────────────────────────────────────

export const RING_LIGHT_GUIDE = {
  overview: 'Ring lights became ubiquitous with social media content creation (TikTok, YouTube, Instagram). They create a characteristic "donut" catch light in the eyes and eliminate most shadows.',
  effect_on_skin: {
    positive: 'Eliminates shadows; evens skin tone; creates a "glow" effect; makes eyes look bright and wide.',
    negative: 'Can be unflattering for textured skin because the lack of shadow eliminates natural depth; can make skin look flat; can overexpose oily skin.',
  },
  makeup_for_ring_light: {
    texture: 'Minimise texture — ring light absence of shadows highlights pores, bumps, and dry patches. Primer is essential. Smooth base first.',
    shine_control: 'Ring light amplifies shine. Blot and powder more aggressively if you have oily skin. Set well.',
    contour: 'Without shadows from directional light, the face can look flat under a ring light. Contour helps restore dimension that the even light removes.',
    eyes: 'The ring light catch light is a signature beauty look. Mascara and lashes look great under ring light. Eye shadow should be well-blended — the even illumination will show any harsh lines.',
    deep_skin_note: 'Ring lights often have a colour temperature that leans cool/white. For deep skin: warm your makeup base slightly warmer than usual to compensate. A bronzy, warm-toned look photographed under ring light tends to look better than a cool, pale look.',
  },
  colour_temperature: 'Many ring lights allow adjustment of colour temperature (warm/cool). Cool white light is used for clear, bright content. Warm light is more flattering for skin tones generally. Adjust based on your skin tone and the aesthetic you want.',
};

// ─── VIDEO/FILM MAKEUP ────────────────────────────────────────────────────────

export const VIDEO_MAKEUP_GUIDE = {
  overview: 'Video/film makeup is seen in motion and in close detail for extended time. It must be flawless, long-lasting, and avoid sliding, shine build-up, or creasing during the recording period.',
  key_differences_from_still: [
    'Motion means makeup must be seamless — transitions and blending visible in video.',
    'Long shooting days mean longevity is paramount.',
    'Close-up video (phone cameras, vlogs) is extremely detailed — every texture is visible.',
    'Colour correction for different camera white balance settings affects how makeup reads.',
  ],
  foundation: {
    finish: 'Matte to natural finish for video. Shiny or very dewy finishes look oily and sweaty under studio lighting over time.',
    formula: 'Long-wear transfer-resistant foundations for video — you may not be able to touch up during filming.',
    setting: 'Bake under-eyes. Set the full face. Setting spray to lock everything in.',
  },
  eyes: {
    primer: 'Eye primer is non-negotiable for video. Creasing reads clearly in video, especially close-up. Urban Decay Primer Potion or similar.',
    blending: 'Blend obsessively. Unblended shadow edges are obvious in video.',
    lashes: 'Fuller lashes for video — eyes need to "read" clearly especially in wider shots.',
    waterproof: 'Waterproof mascara under hot studio lights or emotional content.',
  },
  lips: {
    liner: 'Outline and fill lips with lip liner before lipstick for longevity. Lip liner extends lipstick wear significantly.',
    matte: 'Matte lipsticks last longest and do not feather on camera. Glossy lips can look greasy in video after a short time.',
    blot_technique: 'Apply lipstick; blot with tissue; re-apply thin layer; set with translucent powder; re-apply thin final layer.',
  },
  setting_for_video: 'Setting spray applied in an X-T pattern. Let it dry completely. For very long shoots: portable blotting papers for oil control without disturbing the base.',
};

// ─── PHONE CAMERA BEAUTY ─────────────────────────────────────────────────────

export const PHONE_CAMERA_GUIDE = {
  overview: 'Most beauty content is now created and consumed on phones. Phone cameras have their own optical characteristics that differ from professional cameras.',
  front_camera_vs_rear: {
    front: 'Selfie/front camera: lower resolution, wider lens distortion. Applies beauty filters automatically on many phones. Less flattering geometrically (nose appears larger near edge of frame).',
    rear: 'Rear camera: higher resolution, better optical quality. Requires something to hold the phone or a tripod. Much more flattering for portraits.',
    recommendation: 'For professional-looking content: use rear camera with a phone stand or tripod at arm\'s length, with a timer or Bluetooth remote.',
  },
  phone_specific_tips: [
    'Portrait mode creates artificial bokeh (background blur) that looks more professional.',
    'Avoid digital zoom — move physically closer instead.',
    'Clean your camera lens before shooting (oils from fingers reduce sharpness).',
    'The morning-after "does my makeup look okay?" phone mirror check should be in natural light near a window, not in a bathroom under warm light.',
    'Filters and beauty modes on phone cameras can whiten teeth, smooth skin, and enlarge eyes. Be aware when content is filtered — audiences are perceptive.',
  ],
  makeup_for_phone: {
    detail: 'Phone cameras at close range show every pore, dry patch, and makeup unevenness. Skin prep (hydration, primer) matters more than for distant photography.',
    blending: 'Blend foundation and concealer borders meticulously — phone close-ups will show harsh edges.',
    lip: 'Crisp lip liner for phone close-ups. Feathering is very visible at close range on a phone camera.',
  },
};

// ─── PRO SHOOT PREPARATION ────────────────────────────────────────────────────

export const PRO_SHOOT_PREP = {
  week_before: [
    'Don\'t introduce new skincare products — risk of reaction.',
    'Stay hydrated — well-hydrated skin photographs better.',
    'Consistent SPF application for one week — reduces surface sun damage appearance.',
    'Avoid heavy exfoliation (risk of irritation) within 5 days.',
    'Gentle exfoliation (enzyme or mild AHA) is fine 5-7 days before to improve surface texture.',
  ],
  day_before: [
    'Hydrate well with water.',
    'Avoid alcohol (causes puffiness and dehydrates skin).',
    'Sleep — dark circles and under-eye puffiness look significant on camera.',
    'No waxing (leaves skin red/sensitive).',
    'Lay out your outfit — colour and fabric affect how your makeup "reads".',
    'Test makeup under flash or in your shooting lighting conditions at home if possible.',
  ],
  day_of: [
    'Skincare as normal (nothing new).',
    'Foundation: apply in natural light if possible, even if the shoot is under artificial light.',
    'Arrive with your makeup done and touch-up products packed.',
    'Touch-up kit: blotting papers, setting spray, concealer, powder, lipstick.',
  ],
  what_to_avoid: [
    'Eating salty food the night before (causes puffiness).',
    'Crying the night before (same).',
    'New haircut less than 1 week before (no time to style as intended).',
    'Trying bold new makeup for the first time at the shoot.',
  ],
};

// ─── ETHNIC PHOTO BEAUTY ──────────────────────────────────────────────────────

export const ETHNIC_PHOTO_BEAUTY = {
  west_african: {
    community: 'West African',
    photo_tip: 'Vivid, saturated jewel tones photograph beautifully against deep melanin. Gold and bronze accents look incandescent under natural light. Test for flashback rigorously — Fitzpatrick V-VI affected most by white-cast products.',
  },
  south_asian: {
    community: 'South Asian',
    photo_tip: 'Bridal and event photography often in mixed lighting (indoor and outdoor). The traditional dewy-luminous South Asian bridal look photographs beautifully in natural light. Avoid very heavy powder baking — can look chalky in photo.',
  },
  caribbean: {
    community: 'Caribbean',
    photo_tip: 'Beach photography in Caribbean light: natural golden light is very flattering. Bronzy, glowy looks work brilliantly. SPF essential outdoors. Waterproof everything near water.',
  },
  arab: {
    community: 'Arab',
    photo_tip: 'Arab event photography often features dramatic indoor studio setups with strong flash. Full glam with bold eye makeup photographs beautifully under flash when flashback is managed. Kohl-lined eyes are a signature look that photographs dramatically.',
  },
  latina: {
    community: 'Latina',
    photo_tip: 'Warm, vibrant makeup photographs beautifully against the range of Latina skin tones. Bold lips in warm red, coral, or berry are photogenic across the Fitzpatrick range.',
  },
  east_asian: {
    community: 'East Asian',
    photo_tip: 'K-beauty "glass skin" — luminous, even, minimal texture — photographs strikingly in natural light and in studio. Gradient lip (Korean lip) and subtle blush photograph more naturally than heavy contouring.',
  },
  east_african: {
    community: 'East African',
    photo_tip: 'Rich skin tones photograph beautifully in warm light. Jewel tones (emerald, cobalt, burgundy) are stunning in photographs against East African skin tones.',
  },
  south_african: {
    community: 'South African',
    photo_tip: 'South African outdoor landscapes create dramatic photograph backdrops. Natural earth tones in makeup — terracotta, ochre, deep brown — complement both the skin tones and the landscape.',
  },
  black_american: {
    community: 'Black American',
    photo_tip: 'Black American beauty content creation has exploded — creators have led the conversation on flashback, white-cast products, and inclusive beauty photography. Dark skin in high-contrast photography is striking. Avoid products that cause flashback; embrace bold colour and dimension.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getPhotoshootOverview() { return PHOTOSHOOT_OVERVIEW; }
export function getFlashPhotographyGuide() { return FLASH_PHOTOGRAPHY_GUIDE; }
export function getNaturalLightGuide() { return NATURAL_LIGHT_GUIDE; }
export function getRingLightGuide() { return RING_LIGHT_GUIDE; }
export function getVideoMakeupGuide() { return VIDEO_MAKEUP_GUIDE; }
export function getPhoneCameraGuide() { return PHONE_CAMERA_GUIDE; }
export function getProShootPrep() { return PRO_SHOOT_PREP; }
export function getEthnicPhotoBeauty(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_PHOTO_BEAUTY[key] || Object.values(ETHNIC_PHOTO_BEAUTY);
}

export const PHOTOSHOOT_BEAUTY_STATS = {
  lightTypes: 6,
  makeupGuides: 5,
  ethnicCommunities: 9,
};
