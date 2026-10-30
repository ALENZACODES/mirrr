/**
 * MIRRR Eyeliner Styles Guide
 * Kohl, kajal, graphic liner, multicultural liner traditions
 * Techniques for all eye shapes and ethnic communities
 */

// ─── EYELINER HISTORY & CULTURE ───────────────────────────────────────────────

export const EYELINER_HISTORY = {
  ancient_origins: {
    egypt: {
      what: 'Kohl (كحل) is one of the oldest beauty products in human history. Ancient Egyptians used kohl — a mixture of galena (lead sulfide), malachite, and animal fat — as eye decoration.',
      why: [
        'Spiritual/religious protection — the "evil eye" was warded off with kohl',
        'Practical: the dark pigment reduced glare from the sun (same principle as athlete\'s eye black)',
        'Symbol of social status and beauty',
        'Medical: ancient kohl was believed to protect the eyes from infection (partially true — galena is antimicrobial, though also toxic)',
      ],
      who: 'Men, women, and children all wore kohl in ancient Egypt. Eye makeup was not gender-specific.',
      famous_image: 'The elongated, extended cat-eye of Egyptian hieroglyphics and statues — this is kohl. The most recognisable eye look in human history.',
    },
    mesopotamia: 'Evidence of kohl use in ancient Mesopotamia (modern Iraq/Syria) dates to 3100 BCE — among the oldest cosmetic records in the world.',
    south_asia: 'Kajal (কাজল in Bengali, काजल in Hindi) has been used in South Asia for thousands of years. Made from lamp black (carbon from burning ghee, oil, or camphor), it was applied to newborn babies\' eyes in a protective and spiritual tradition.',
    arab_world: 'The word "alcohol" derives from Arabic "al-kohl" — a tribute to how central this substance was in Arab culture. Kohl is still used daily by women across the Arab world.',
  },

  cultural_significance_today: {
    south_asian: 'Kajal on the lower waterline is considered essential for many South Asian women — it is one of the most culturally specific beauty practices. It is also still applied to babies\' eyes for spiritual protection in some Hindu and Muslim communities.',
    arab: 'Kohl is foundational to Arab makeup — not completing a look without it would be like a Western woman going out without mascara. The deep-lined eye is a cultural beauty standard.',
    west_african: 'Kohl is used in many West African communities, particularly in Muslim-majority communities where Sufi and Islamic beauty traditions have integrated kohl use.',
    east_african: 'In Somalia, Ethiopia, and surrounding countries, kohl is used traditionally and remains a daily beauty practice.',
    berber_north_african: 'Kohl is intrinsic to Berber (Amazigh) beauty tradition across Morocco, Algeria, Tunisia — particularly the distinctive dark kohl of Moroccan women.',
  },
};

// ─── TYPES OF LINER PRODUCTS ──────────────────────────────────────────────────

export const LINER_PRODUCTS = {

  kohl_kajal: {
    what: 'Traditional smudgy liner — softer than liquid, applies on the waterline and lash line. The OG eyeliner.',
    traditional_vs_modern: {
      traditional: 'Lamp black (carbon/soot) mixed with oil — incredibly pigmented, not always safe by modern standards due to heavy metals in some versions',
      modern: 'Safe pigment alternatives using iron oxides and modern cosmetic ingredients — same smudgy effect, no heavy metals',
    },
    application: {
      waterline: 'Apply directly to the inner rim of the eye (the waterline). This is the traditional application method.',
      tightline: 'Apply to the upper waterline (between the lashes and the eye) — makes lashes look thicker without visible liner',
      lash_line: 'Press and smudge along the upper lash line — creates a soft, smoky look',
      lower_lash_line: 'Apply under the eye below the lashes, smudge for a smoky effect',
    },
    products: [
      { name: 'Maybelline Eyestudio Lasting Drama Gel', note: 'Cult affordable kohl-style liner' },
      { name: 'Urban Decay 24/7 Glide-On Eye Pencil', note: 'Premium, extremely pigmented, very popular' },
      { name: 'NYX Retractable Eye Liner', note: 'Budget-friendly, good pigment' },
      { name: 'L\'Oreal Lineur Intense', note: 'Great for waterline' },
      { name: 'Iba Halal Care Kajal', note: 'Traditional formula, South Asian brand' },
      { name: 'Himalaya Kajal', note: 'Indian brand, traditional kajal formula' },
    ],
  },

  liquid_liner: {
    what: 'Liquid formula, typically applied with a thin brush or felt tip. Creates the most precise, dramatic lines.',
    types: {
      felt_tip: 'Built-in felt tip applicator — easiest for beginners. Like a pen.',
      brush_tip: 'Thin brush attached to bottle — most precise, highest skill requirement',
    },
    application_tips: [
      'Shake before use (pigment can settle)',
      'Rest your elbow on a stable surface — reduces hand tremor',
      'Pull the skin taut at the outer corner with one finger',
      'Look DOWN rather than straight ahead (keeps the eyelid taut)',
      'Use short, connected strokes rather than one long stroke',
      'OR: stamp dots along the lash line, then connect them',
    ],
    best_for: 'Cat eye, graphic liner, very precise work',
    products: [
      { name: 'Stila Stay All Day Waterproof Liquid Liner', note: 'A classic — extremely precise tip, very black, long-wear' },
      { name: 'NYX Matte Liquid Liner', note: 'Affordable with very thin tip' },
      { name: 'Kat Von D Tattoo Liner', note: 'Very precise, intense black' },
      { name: 'L\'Oreal Superliner Flash', note: 'Great for beginners — felt tip is easy to control' },
    ],
  },

  gel_liner: {
    what: 'Cream/gel formula in a pot, applied with an angled brush. The professional\'s choice — more workable than liquid, more precise than pencil.',
    pros: ['Most buildable', 'Can create any line weight', 'Very long-lasting', 'More forgiving than liquid'],
    application: [
      'Load angled brush lightly — less is more',
      'Use short strokes to build the line',
      'Smudge while wet for smoky effect, leave alone for precise line',
      'Set with a matching powder eyeshadow to extend longevity',
    ],
    products: [
      { name: 'Bobbi Brown Long-Wear Gel Liner', note: 'The original cult gel liner — every makeup artist uses this' },
      { name: 'MAC Fluidline', note: 'Professional favourite, huge colour range' },
      { name: 'L.A. Girl Shady Slim Brow Pencil', note: 'Budget gel liner alternative' },
    ],
  },

  pencil_liner: {
    what: 'Waxy or creamy pencil — the most accessible liner type.',
    types: {
      wax_based: 'Classic pencil — needs sharpening, drags slightly, less pigmented. Most affordable.',
      kohl_pencil: 'Softer, more pigmented, smoother application — the pencil equivalent of traditional kohl',
      retractable: 'Twist-up mechanism, no sharpening needed. More convenient.',
    },
    best_for: 'Beginners, every day use, quick application, waterline',
  },

  coloured_liner: {
    what: 'Liner in any colour other than black or brown — the maximalist approach',
    ethnic_context: 'Vibrant coloured liner is traditional in many multicultural aesthetics — cobalt blue kohl in Moroccan and Egyptian contexts, deep green traditional in some Arab communities, bright colour for festival occasions globally.',
    for_deep_skin: {
      recommendation: 'Bright, saturated colours (cobalt, emerald, violet, hot pink) show beautifully against deep skin. Subtle colours (light taupe, grey, pastels) may not show well.',
      suggestion: 'Deep skin can carry BOLDER colour choices than fair skin — embrace this.',
    },
  },
};

// ─── LINER STYLES ─────────────────────────────────────────────────────────────

export const LINER_STYLES = {

  classic_cat_eye: {
    what: 'A flick or wing extending beyond the outer corner of the eye — the most iconic eye makeup look in Western and global beauty',
    origin: 'Popularised by film stars of the 1950s and 60s — Audrey Hepburn, Brigitte Bardot — though the elongated eye shape is also ancient, traceable to Egyptian kohl traditions',
    how_to: [
      'Draw the wing FIRST: angle a line from the outer corner of the eye toward the tail of the brow (the angle determines how dramatic the wing)',
      'Connect the wing to the upper lash line with a line that starts thin at the inner corner and gets thicker toward the outer corner',
      'Fill in any gaps',
      'Tip: stamp the wing angle with the side of an angled brush, then connect',
    ],
    variations: {
      subtle: 'Very short wing, thick lash line only at the outer third of the eye',
      classic: 'Medium wing, liner covers full upper lash line with clear flick',
      dramatic: 'Long wing, very thick line, extended inner corner too',
      floating: 'Cat eye applied higher than the lash line — appears to "float" on the lid',
    },
    ethnic_eye_adaptation: {
      hooded: 'Apply with eyes OPEN — draw the wing while looking forward so the liner is visible when the hood of the eye comes down. Extend the wing upward rather than horizontally.',
      monolid: 'Wing the outer corner. Tight-line the upper waterline. The entire lid is visible — make the most of it.',
      deep_set: 'Keep the liner light — heavy liner in very deep-set eyes makes them appear even more recessed.',
    },
  },

  arabic_eye: {
    what: 'The Arabic eye is a heavily lined look that extends kohl BELOW the eye as well as above — creating a dramatically elongated and defined eye shape. Often called the "Arabic eye" or "Arab liner look."',
    origin: 'Rooted in traditional kohl use across the Arab world. The heavy lower line is part of the traditional look, not just a modern trend.',
    how_to: [
      'Apply kohl or kajal to the waterline of the UPPER eye',
      'Apply kohl to the LOWER waterline',
      'Smudge both lines outward',
      'Extend the lower line beyond the outer corner',
      'Connect the upper and lower extended lines at the outer corner',
      'The result is a fully surrounded, elongated, smudgy eye',
    ],
    colour: 'Traditionally black — extremely black, deep, smudgy',
    for_darker_skin: 'This look is spectacular on deeper skin tones — the deep kohl against deep skin creates a stunning, sultry, powerful eye',
    products: ['Urban Decay 24/7 Glide-On in Zero', 'Laura Mercier Kohl Eye Pencil', 'Maybelline Eye Studio Lasting Drama Gel (Black)'],
  },

  tight_lining: {
    what: 'Applying liner to the UPPER waterline (between lashes and eye) — this makes lashes appear thicker and denser without visible liner. It fills the gaps between lashes.',
    effect: 'More awake eyes without obvious liner. "No makeup" makeup but with defined eyes.',
    how_to: [
      'Use a pencil or kohl (not liquid — liquid on waterline is uncomfortable)',
      'Pull the upper lid up slightly',
      'Apply pencil directly to the upper waterline in short strokes',
      'Wiggle the pencil between lash roots to fill gaps',
    ],
    tip: 'Tight-lining takes practice because it\'s an unfamiliar sensation. Start with a small amount and build.',
  },

  graphic_liner: {
    what: 'Bold, modern, artistic liner that goes beyond traditional shapes — geometric shapes, negative space, extended lines, abstract shapes',
    who_does_it: 'Editorial makeup, high-fashion, avant-garde — increasingly popular on Instagram and in runway makeup',
    popular_types: {
      double_liner: 'Second liner in a different colour parallel to the first liner',
      triangle: 'Sharp triangle at the outer corner extending upward',
      floating_liner: 'A separate line above the crease or lid — not touching the lash line',
      half_liner: 'Liner only on the outer or inner half of the eye',
      reverse_liner: 'Liner BELOW the eye only, with nothing on the upper lid',
      negative_space: 'Liner with deliberate gaps creating geometric shapes',
    },
    ethnic_skin_graphic: 'Graphic liner is extremely striking on deeper skin tones — the bold contrast of a bright colour against deep skin creates maximum visual impact. This is an area where darker skin has an artistic advantage.',
    popular_colours_for_ethnic_skin: ['White', 'Gold', 'Cobalt blue', 'Emerald green', 'Bright orange', 'Electric violet'],
  },

  kajal_smudged: {
    what: 'The traditional South Asian/Arab kajal eye — smudged, soft, deeply pigmented, intentionally imperfect-looking',
    look: 'The "I slept in my kohl" eye that is simultaneously effortless and striking',
    how_to: [
      'Apply kohl generously to the waterline top and/or bottom',
      'Immediately smudge with a cotton swab, sponge, or finger in circular or outward motion',
      'Layer more kohl on top if needed',
      'The smudge should be intentional — not messy, but deliberately soft-edged',
    ],
    note: 'This is the look that inspired the "smoky eye" — the kajal smudge pre-dates the Western smoky eye concept',
  },

  no_liner: {
    what: 'The deliberately "liner-free" look — gaining prominence especially in K-beauty and clean beauty movements',
    technique: 'Mascara only, or mascara with a very light smudge of dark shadow pressed into lash roots',
    who_its_for: 'Those who want defined eyes without visible liner — very natural makeup aesthetic',
    ethnic_application: 'Dark brows, long lashes (real or with mascara) make South Asian, Arab, and East Asian eyes very defined without any liner — liner is genuinely optional for many women in these communities',
  },
};

// ─── EYE SHAPE GUIDE ──────────────────────────────────────────────────────────

export const EYE_SHAPE_LINER_GUIDE = {

  almond: {
    description: 'Neither very round nor very angular, slightly pointed at the inner and outer corners.',
    
    liner_tip: 'Most liner styles work. Classic cat eye is particularly flattering.',
    recommended_styles: ['Classic cat eye', 'Kajal smudge', 'Arabic eye', 'Tight-line'],
  },

  round: {
    description: 'Very rounded at the outer corner — appears very open',
    
    liner_tip: 'Elongate by extending liner beyond the outer corner. Avoid lining the entire lower lash line — this makes round eyes appear more round and droopy.',
    recommended_styles: ['Elongated cat eye', 'Only outer lower liner', 'Winged liner emphasising outer corner'],
    avoid: ['Full circle liner', 'Heavy lower waterline on the full lower lid'],
  },

  monolid: {
    description: 'No visible crease on the eyelid — the entire lid from lash line to brow is smooth and flat. Common in East Asian communities.',
    
    liner_tip: 'Every line shows because there is no crease to hide it. The lid is like a canvas. Bold graphic liner and wings show beautifully on monolids.',
    recommended_styles: ['Graphic liner', 'Bold wing', 'Thick upper lash line', 'Coloured liner'],
    special_note: 'Many Korean and Japanese makeup artists specialise in monolid techniques. The K-beauty dewy, liner-light approach was partly developed FOR monolids.',
  },

  hooded: {
    description: 'A fold of skin from the brow bone droops over the crease, partially or fully covering the lid when the eye is open',
    
    liner_tip: 'Apply liner with eyes OPEN. What you draw with eyes closed will be hidden when eyes open. Draw the wing while looking forward — it will appear to angle upward.',
    recommended_styles: ['Outer wing (visible with eyes open)', 'Tight-line (subtle)', 'Lower lash line emphasis'],
    avoid: ['Elaborate lid art — it disappears behind the hood', 'Heavy upper liner that takes up the already-limited space'],
  },

  deep_set: {
    description: 'Eyes appear to sit back in the face — the brow bone is very prominent',
    
    liner_tip: 'Avoid very heavy upper liner — it pushes eyes further back. Keep upper liner light. Emphasise lower lash line to bring eyes forward.',
    recommended_styles: ['Light upper liner only', 'Bright or shimmery lower inner corner', 'Lower waterline with nude liner'],
  },

  wide_set: {
    description: 'More space between the eyes than the width of one eye',
    liner_tip: 'Bring visual attention toward the nose bridge — liner on the inner corner and inner third only, not extending to outer corner',
    avoid: 'Very long outer wings — extends the already wide set even further',
  },

  close_set: {
    description: 'Less space between the eyes than the width of one eye',
    liner_tip: 'Draw attention OUTWARD — extend liner at outer corners, keep inner corners very light',
    avoid: 'Heavy inner corner liner',
  },
};

// ─── HOW TO APPLY KOHL TO THE WATERLINE ──────────────────────────────────────

export const WATERLINE_GUIDE = {
  what: 'The waterline is the inner rim of the eyelid — the mucous membrane that touches the eye itself.',

  technique: [
    'Hold the lower lid gently downward with one finger',
    'Apply the kajal/kohl pencil to the pink inner rim — not under the lash line, but ON the rim itself',
    'For upper waterline: lift the upper lid gently, look down, apply to the upper inner rim',
    'It will feel strange — resist the urge to blink until the pencil has passed',
  ],

  safety: {
    use_ophthalmology_safe: 'Only use products specifically labelled for waterline use or kohl/kajal — not all eyeliners are safe for the waterline (the mucous membrane absorbs more than outer skin)',
    old_traditional_kohl: 'Traditional kohl made with lead compounds (still sold in some South Asian and Arab markets) is NOT safe — particularly for children. Avoid buying kohl with unknown ingredient lists.',
    if_irritated: 'If your eyes water excessively, become red, or feel gritty with a particular liner, stop using that product on the waterline. The eye is absorbing it.',
    contacts: 'If you wear contact lenses, apply waterline liner BEFORE inserting contacts, not after.',
  },

  looks: {
    black_waterline: 'Dramatic, traditional look — defines and deepens the eye. The iconic Arab and South Asian kohl look.',
    nude_waterline: 'Flesh-toned or white pencil on the lower waterline — makes the eye appear LARGER and more awake.',
    white_waterline: 'Very bright and opens eyes dramatically — popular in Korean beauty',
    coloured_waterline: 'Cobalt blue, violet, or green on the waterline — a vibrant statement look',
  },
};

// ─── LINER FOR SPECIFIC COMMUNITIES ──────────────────────────────────────────

export const COMMUNITY_LINER_TRADITIONS = {
  'south-asian': {
    iconic: 'Kajal on the waterline is the single most South Asian-specific beauty practice. It is culturally and spiritually significant.',
    bridal: 'A South Asian bride without kajal is unusual — even minimalist brides typically include deep kohl on the waterline',
    popular_look: 'The deep kajal eye + dramatic shadow (often gold or copper on the lid, with deep kohl surrounding)',
    products: ['Himalaya Kajal', 'Iba Kajal', 'Urban Decay 24/7 Liner in Zero (for MUA-quality application)'],
  },
  'arab': {
    iconic: 'Kohl has deep roots in Arab beauty traditions. The full-surround kohl eye is a classic Arab look.',
    traditional_use: 'Kohl is still given to babies for spiritual protection in many Arab families — a tradition that shows how deeply embedded this is',
    bridal: 'Arab bridal eye is heavily lined, dramatic, precise. The "Arabic eye" look — extended, surrounded — is standard bridal.',
    popular_look: 'Cut crease with deep shadow, heavy kohl surround, extended liner',
  },
  'west-african': {
    kohl_use: 'Kohl is used across Muslim West African communities (Sufi tradition incorporates kohl)',
    makeup_liner: 'In Nigerian and Ghanaian modern beauty culture, strong liner (liquid or gel cat eye) is central to glam makeup',
    popular_look: 'Dramatic liquid liner cat eye + dramatic lashes',
  },
  'east-african': {
    kohl_tradition: 'Kohl is used in Somalia, Ethiopia, and surrounding East African countries with long traditions',
    popular_look: 'Deep kohl smudge + natural hair and traditional dress',
  },
  'east-asian': {
    approach: 'K-beauty favours minimal or no liner; Japanese makeup can be more precise. Chinese makeup varies widely.',
    korean_trend: 'The "puppy liner" (liner flicking downward at the outer corner rather than upward) creates a youthful, innocent look specific to Korean beauty aesthetics',
    japanese: 'Japanese makeup often uses precise liner but with a lighter touch than Western heavy liner',
    graphic_culture: 'Japanese avant-garde makeup (inspired by J-pop and anime aesthetics) includes very bold graphic liner',
  },
  'latina': {
    popular: 'Bold liner is central to Latina makeup culture — the cat eye is iconic',
    popular_look: 'Sharp cat eye + glossy or bold lip',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getLinerGuideForCommunity(communityId) {
  return {
    communityTraditions: COMMUNITY_LINER_TRADITIONS[communityId] || null,
    products: LINER_PRODUCTS,
    styles: LINER_STYLES,
    history: EYELINER_HISTORY,
  };
}

export function getLinerForEyeShape(eyeShape) {
  return EYE_SHAPE_LINER_GUIDE[eyeShape] || null;
}

export function getWaterlineGuide() {
  return WATERLINE_GUIDE;
}

export function getLinerStyleGuide(style) {
  return LINER_STYLES[style] || LINER_STYLES;
}

export function getKajolHistory() {
  return EYELINER_HISTORY;
}

