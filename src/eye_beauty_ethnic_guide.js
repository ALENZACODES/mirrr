/**
 * MIRRR — Eye Beauty Guide for Ethnic Communities
 * Eye shape, eye makeup, dark circles, and multicultural eye beauty traditions.
 */

export const EYE_ANATOMY_BEAUTY = {
  title: 'Eye Anatomy and Beauty',
  structure: {
    eyelidTypes: 'The human eyelid has several key anatomical variants that influence eye makeup application: the presence or absence of a visible lid crease (monolid vs double eyelid); the position of the lid crease (high crease = more lid visible; low crease = less visible lid space); the size of the visible white (sclera) around the iris; the degree of lid prominence (how far the eyeball projects beyond the orbital bone); the angle of the canthal tilt (outer corner of the eye higher, lower, or level with the inner corner)',
    monolid: 'The monolid (or "single eyelid" — epicanthal fold without a visible crease): the inner corner of the eye has a fold of skin (the epicanthic fold) that creates a smooth, uninterrupted lid from brow to lash line with no defined crease in between; common in East Asian, Central Asian, Indigenous American, and some other ancestries; the monolid is a naturally occurring anatomical variant — NOT a "defect" — with specific makeup techniques that work with rather than against this structure',
    doubleeyelid: 'The double eyelid (visible lid crease): a crease that creates a defined "platform" of lid visible between the lashes and the crease; present in most non-East Asian individuals and in a minority of East Asian individuals; the position of the crease dramatically affects how eye makeup looks and how much visible lid space exists for shadow placement',
    epicanthicFold: 'The epicanthic fold (a fold of skin covering the inner corner of the eye — the medial canthus): present in East Asian, Central Asian, Indigenous American, and some other ancestries; the fold covers part of the caruncle (the pink inner corner) and the medial sclera; from a makeup perspective, the epicanthic fold affects where liner meets liner in the inner corner and changes the effective visible length and shape of the eye',
    canthalTilt: 'Canthal tilt: the angle between the inner corner (medial canthus) and outer corner (lateral canthus) of the eye; upward canthal tilt (outer corner higher than inner — "cat eye" or almond eye shape) is considered a "positive" canthal tilt in aesthetics; neutral canthal tilt (corners at the same level — more circular, open eye shape); downward canthal tilt (outer corner lower than inner — creates a "tired" appearance) is a "negative" canthal tilt'
  }
};

export const DARK_CIRCLES_SCIENCE = {
  title: 'Dark Circles: Types and Ethnic Variations',
  types: {
    vascular: {
      type: 'Vascular (bluish-purple)',
      cause: 'Visible blood vessels through thin periorbital skin; haemoglobin breakdown products (biliverdin → blue-green; bilirubin → yellow); periorbital oedema (puffiness from fluid accumulation) that casts shadows',
      appearance: 'Bluish or purple; worsens with tiredness, alcohol, salt, and poor sleep (all increase periorbital oedema); varies throughout the day (worse in morning)',
      treatment: 'Caffeine topical (vasoconstricts blood vessels; also reduces oedema through adenosine receptor antagonism); cold compresses; sleep elevation; hyaluronic acid filler in the tear trough (the hollow under the eye that creates shadow — this is the most effective treatment for structural tear trough darkness); retinol (thickens skin over time reducing visibility of vessels)',
      ethnicNote: 'More visible in individuals with very thin periorbital skin and light skin tones where the blue-purple of subcutaneous vessels shows through'
    },
    pigmentary: {
      type: 'Pigmentary (brown)',
      cause: 'Increased melanin deposition in the periorbital skin; can be constitutional (genetic — present from childhood) or acquired (from rubbing, inflammation, or post-inflammatory hyperpigmentation)',
      appearance: 'Brown or dark brown; consistent day-to-day; does not significantly change with sleep; present in all lighting conditions; pulls the skin upward reveals the dark area when the skin is taut',
      treatment: 'This is the most common type of dark circles in dark-skinned individuals; treatment is the most challenging because the pigment is in the skin (not a shadow or vessel); topical depigmenting agents: vitamin C (l-ascorbic acid); niacinamide; kojic acid; azelaic acid; tranexamic acid; chemical exfoliants (AHA/BHA) to accelerate turnover; SPF (essential — UV stimulates more pigment); Q-switched Nd:YAG laser or intense pulsed light in specialist hands; the MOST IMPORTANT factor: not rubbing the eyes; eye rubbing causes repeated micro-trauma and inflammatory PIH in the periorbital skin',
      ethnicNote: 'Dominant type in South Asian, East Asian, Arab, Black, and Latin American individuals; the genetic constitutional variety is extremely common in South Asians (dark circles appear in childhood in South Asian families as a recognisable hereditary feature)'
    },
    structural: {
      type: 'Structural (shadowing)',
      cause: 'The tear trough (the groove that runs from the inner corner of the eye down to the cheek) creates a shadow; as we age, fat in the lower lid descends creating eye bags that cast a shadow beneath them; orbital rim exposure with age creates a concavity that shadows',
      appearance: 'A shadow rather than colour change in the skin itself; tends to get more pronounced with age as fat descends and volume decreases; most pronounced in direct overhead lighting which emphasises shadows',
      treatment: 'Hyaluronic acid filler in the tear trough (direct volume replacement — the gold standard for structural darkness); concealer with a light-reflecting formula (optically fills the shadow; the "colour-correcting" technique of applying peach or orange corrector under the eye and then setting with concealer is particularly useful for deep skin tones where pink-toned concealers look grey)',
      ethnicNote: 'More pronounced with age across all ethnicities; tear trough hollowing is a component of dark circles in most adults across all ethnic groups'
    }
  },
  southAsianDarkCircles: 'South Asian dark circles represent the most commonly discussed and most challenging dark circle scenario: the constitutional pigmentary dark circles are genetic; they are often present from childhood; they are driven by increased melanin synthesis in the periorbital skin rather than by lifestyle factors; no amount of sleep or water intake will eliminate them; this is not a failing of the individual; they require depigmenting skincare (vitamin C; niacinamide; kojic acid) and can be partially addressed with colour-correcting concealer (peach/orange corrector under the main concealer); SPF is critical as UV stimulates more pigment'
};

export const EYE_MAKEUP_TECHNIQUES = {
  title: 'Eye Makeup Techniques by Eye Shape',
  monolid: {
    shape: 'Monolid',
    challenges: 'On a monolid eye, traditional eyeshadow techniques designed for double-lidded eyes (applying dark shadow in a defined crease for depth) do not apply; the crease of the eye is not visible; shadow applied to the "supposed" crease may be partially or fully hidden when the eye is open',
    techniques: {
      shadow: 'Apply darker shadow to the outer third of the eye and blend up and outward (the cut crease technique adapted for monolid: place the dark shadow higher on the lid than you think, then add a shimmer or light colour on the mobile lid below it); the monolid eye has more lid real estate visible than it may seem — the entire area from lashes to brow is potentially usable canvas',
      liner: 'Tight-line the upper lashes (applying liner between the lashes from the inner corner outward); the monolid eye benefits from a slightly thicker upper liner to compensate for the lid fold that can partially hide thin liner when the eye opens; winged liner on a monolid should extend horizontally outward (not upward at a steep angle — the anatomical cut-off angle of the monolid changes where the wing should go)',
      lashes: 'Curling lashes is particularly important for monolid eyes where the forward-facing lash direction may partially obscure the eye; curling opens the eye dramatically; lengthening and curling mascara over volumising; individual false lashes on the outer two-thirds can lift and open the monolid eye without looking too heavy'
    }
  },
  almond: {
    shape: 'Almond Eye (upward canthal tilt; oval shape)',
    versatility: 'The almond eye is the most versatile shape for makeup application; the slight upward tilt and balanced proportions suit virtually all techniques',
    techniques: {
      shadow: 'Standard three-shadow technique (light on brow bone and inner corner; mid-tone on lid; darker in the crease and outer V) works beautifully on almond eyes; can go bold (smoky) or subtle (wash of shimmer)',
      liner: 'All liner styles work: tight-line; thin line; thick line; wing; waterline; smudged lower lash',
      lashes: 'Any style; full lashes; corner lashes'
    }
  },
  roundEye: {
    shape: 'Round Eye',
    techniques: {
      shadow: 'Elongate with dark shadow in outer V blended horizontally; avoid placing shimmer directly in the centre of the lid (which further emphasises roundness) or use it to intentional effect',
      liner: 'Extending liner beyond the outer corner elongates the eye; flicking the outer corner down slightly counterbalances upward roundness',
      lashes: 'Focus lash application on the outer corner to elongate'
    }
  },
  hoodedEye: {
    shape: 'Hooded Eye',
    description: 'Hooded eye: excess skin folds over the crease and partially or fully covers the visible lid when the eye is open; becomes more pronounced with age as the brow drops',
    techniques: {
      shadow: 'Apply shadow HIGHER than the actual crease — what looks like "way too high" in the mirror actually appears correctly placed when the eye is open; photograph yourself with eyes open to check placement',
      liner: 'Thin liner transfers easily to the skin above on hooded eyes; pencil liner is more problematic than liquid; wait for liner to set; setting with a matching eyeshadow over the liner prevents transfer',
      lashes: 'False lashes that are too heavy can drag down a hooded eye; focus on lightweight curled lashes'
    }
  },
  deepSet: {
    shape: 'Deep-Set Eye',
    description: 'Deep-set eye: eyes sit deeper in the orbital socket; the brow bone is prominent; this creates natural shadow',
    techniques: {
      shadow: 'Light shimmery or satin shadow on the lid brings the eye forward; avoid heavy dark shadow on the mobile lid which creates further recession; use dark only in the outer V and outer crease',
      highlight: 'Inner corner highlight and brow bone highlight are particularly effective at bringing the eye forward'
    }
  }
};

export const KOHL_KAJAL_TRADITIONS = {
  title: 'Kohl, Kajal, and Surma: The Ancient Eye Tradition',
  history: 'Eye lining with kohl or its equivalents is one of the oldest recorded beauty practices on Earth: ancient Egyptian kohl use (from galena — lead sulphide; later from antimony, ammonite, and carbon) dates to at least 3100 BCE; ancient Sumerians used antimony sulphide for eye decoration; in the Indus Valley Civilisation (2600-1900 BCE), kajal (the South Asian equivalent) was prepared from soot and lamp black; the Arabic word "kohl" (كحل) is the origin of the English word "alcohol" through the Arabic al-kohl (the fine powder);  the Islamic prophetic tradition (hadith) recommends ithmid kohl (made from antimony sulphide; specific to the Arabian Peninsula) for the eyes as a health practice',
  types: {
    traditional: {
      galena: 'Traditional galena-based kohl: lead sulphide; black; the primary ingredient in ancient Egyptian kohl; CAUTION — lead-containing kohl is TOXIC; traditional kohl imported from parts of South Asia (desi surma) and the Middle East has been found to contain lead levels far above safety limits; lead kohl exposure is associated with elevated blood lead levels, particularly dangerous in children; traditional homemade or imported kohl/surma should be tested or avoided particularly for children',
      ithmid: 'Ithmid (antimony sulphide kohl): the prophetically-recommended kohl in Islamic tradition; mined from specific locations in Saudi Arabia and Morocco; considered safer than lead kohl; used in Gulf Arab countries as a traditional health and beauty practice; antimony at the levels used in ithmid kohl has not been definitively shown to be harmful but is not risk-free — caution in children and pregnant women',
      carbon: 'Carbon-based kohl (lamp black, soot-based, charcoal-based): the safest traditional kohl variant; many modern kajal products use carbon black as the primary pigment in a wax or oil base; the "kajal" sold in South Asian and Indian stores is typically a carbon-based product'
    },
    modern: 'Modern kohl/kajal: regulated cosmetic products use carbon black (C.I. 77266) as a safe black pigment; modern kohl pencils and kajal pencils in regulated markets are safe and regulated; the issue is with traditional or imported products that may contain lead or antimony at unregulated levels'
  },
  application: {
    inner: 'Waterline (inner rim of the lower lid): kohl applied to the inner rim of the lower lid (between the lashes and the eye) — this "tight-line" or waterline application is the traditional Arab, South Asian, and North African eye technique; it makes the eyes appear more defined, deeper, and more dramatic; it is also a practical barrier against the desert and dust environments where kohl use originated',
    outer: 'Outer lid: drawing a line along the upper lash line; flicking outward (the wing) is a modern adaptation of the traditional kohl line',
    smudged: 'Smudged kohl: the "smoky" effect achieved by applying and then smudging kohl with a finger or smudge stick; the Middle Eastern "smoky eye" from 5000 years ago'
  }
};

export const ETHNIC_EYE_BEAUTY_GUIDES = {
  'west-african': {
    community: 'West African',
    eyeShape: 'West African eyes are typically large, prominently set, and dark brown; eye shapes vary widely including round, almond, and deep-set eyes; the sclera (white of the eye) is often prominent and bright; white sclera against a dark iris and dark complexion is considered a beauty feature in West African aesthetic contexts',
    darkCircles: 'Periorbital pigmentation (dark circles) is common and can appear as hyperpigmentation around the eye; a combination of constitutional pigment and eye-rubbing related PIH; vitamin C, niacinamide, and retinol for management; SPF around the eye area is important (the periorbital skin does not usually have the same melanin density as the rest of the face and can still burn)',
    makeupTraditions: 'West African makeup traditions include kohl-influenced eye lining in Sahelian and Muslim West African communities (Nigeria\'s Hausa-Fulani community; Mali; Senegal); dramatic eye makeup for Afropop and music performance culture; natural eyebrows in bold, strong natural shapes are celebrated',
    recommendations: 'Bold, arched brows that complement the strong facial bone structure typical of West African features; kohl or kajal inner waterline for traditional depth; carbon-based kajal for safety; vitamin C or niacinamide periorbital serum for hyperpigmentation; SPF in SPF moisturiser applied to the orbital area'
  },
  'south-asian': {
    community: 'South Asian',
    eyeShape: 'South Asian eyes are typically almond-shaped; eye sizes vary but the eye shape is typically more elongated than round; a double eyelid with a low-to-moderate crease height; epicanthic fold is rare; dark brown to almost black iris; long natural lashes are common in South Asian genetics',
    kajal: 'Kajal (काजल in Hindi; கண்மை in Tamil; خاجل in Urdu) is the most fundamental South Asian eye beauty item: it is applied to the waterline of both upper and lower eyelids and to the outer corner of the eye; traditional kajal is made from soot, ghee or castor oil, and plant-based ingredients; kajal application is a daily ritual for many South Asian women and is applied to babies\' eyes in many traditions (a cultural practice for protection — the "evil eye" (nazar) warding tradition; CAUTION: kajal with lead content should not be applied to infants)',
    darkCircles: 'Constitutional pigmentary dark circles are the most prominent and commonly discussed beauty concern for South Asian women globally: they are genetic; present from childhood in many South Asian individuals; driven by increased periorbital melanin synthesis not by lifestyle; they do not go away with sleep; colour-correcting with peach/orange tones before concealer is the most effective makeup technique; vitamin C and niacinamide periorbital serums provide gradual improvement over months; tear trough filler addresses the structural shadow component',
    bindiBrownNose: 'The bindi (बिंदी — the dot worn on the forehead between the eyebrows): in traditional Hindu practice the bindi represents the ajna chakra (third eye); a red bindi traditionally indicates a married Hindu woman; coloured, decorative bindis are non-religious and worn for beauty across South Asian communities; from a makeup perspective the bindi frames the eyes and eyebrows as a centre-piece of the face and draws attention to the eye area',
    recommendations: 'Carbon-based kajal for the waterline and waterline application; NEVER lead-containing kohl in babies or children; peach/orange colour corrector under concealer for dark circles; vitamin C serum to the orbital area applied gently with ring finger (least pressure); SPF daily; long lashes that are a South Asian genetic gift should be emphasised with curling and lengthening mascara; straight or barely arched brow appropriate for South Asian face structure'
  },
  caribbean: {
    community: 'Caribbean',
    eyeShape: 'Caribbean eyes reflect the region\'s genetic diversity: West African-descended Caribbean individuals typically have large, round to almond eyes with dark brown irises; South Asian-descended Caribbean individuals (Indo-Trinidadian; Indo-Guyanese) have the same eye features as South Asian; mixed-heritage Caribbean individuals show a full range of eye shapes and colours',
    makeupCulture: 'Carnival eye: Caribbean Carnival is a showcase for extravagant eye makeup; masquerade costumes are designed around elaborate face paint, sequined and jewelled eye designs, false lashes, and dramatic eye makeup that must be both photographically spectacular and durable in heat and dancing; Carnival eye makeup is the Caribbean eye tradition at its most expressive',
    naturalLashes: 'Long, dense natural lashes are common in Caribbean women of African and mixed heritage; curling these lashes dramatically opens the eye; individual false lashes at the outer corner are a popular addition to natural lashes for events',
    darkCircles: 'Same pigmentary dark circle considerations as West African skin; peach corrector technique; vitamin C and niacinamide; SPF',
    recommendations: 'Waterproof everything for Caribbean heat and humidity; curl natural lashes; individual lashes at outer corner for day-to-night transformation; bold, graphic liner for events; colour-correcting concealer for pigmentary dark circles'
  },
  arab: {
    community: 'Arab',
    eyeShape: 'Arab eyes tend to be almond-shaped; Levantine Arab eyes (Lebanese, Syrian, Palestinian, Jordanian) are often characterised by depth and dark colouring that is one of the most celebrated aesthetic features in the Arab world; Gulf Arab eyes (Saudi, Emirati, Kuwaiti) show more variation from Arab, South Asian, and East African ancestral mixing; Moroccan and North African Arab eyes often show Amazigh (Berber) features',
    kohlTradition: 'Kohl holds deep cultural meaning in many Arab communities, and for many people religious meaning too: hadith report that the Prophet Muhammad (PBUH) used and recommended ithmid kohl for the eyes; kohl-lined eyes are a long-standing aesthetic; some families traditionally put kohl on babies for evil eye (ayn) protection, but no kohl of any kind should be used on babies or children',
    arabEyeAesthetic: 'The Arab eye aesthetic: deeply kohl-lined eyes; dark, full lashes; dramatic eye expression; the eyes are particularly emphasised in Arab beauty because they may be the only part of the face visible when wearing hijab or niqab — maximum expression must be achieved in the eye alone; in this context eye makeup becomes more culturally significant than in any other beauty tradition where the full face is visible',
    makeupForHijab: 'Hijab beauty: when the majority of the face and hair are covered, the eyes are the primary beauty canvas; Arab and Muslim women wearing hijab typically invest heavily in eye makeup products; bold, dramatic eye looks are not excessive — they are the appropriate proportion when the eye is the primary facial feature being expressed; brow shaping is also particularly important as the brow is visible and frames the eye',
    recommendations: 'Ithmid kohl or carbon-based kajal for waterline (not lead-based products); kohl-smudged under eye for depth; full, defined upper lash line; brow definition (threading is the preferred Arab brow technique — see separate threading guidance); false lashes for events; eye primer for humidity-resistant, prayer-proof eye looks; green or olive-tinted colour corrector for blue-purple dark circles; peach for brown dark circles'
  },
  latina: {
    community: 'Latina',
    eyeShape: 'Latina eye shapes span the full genetic spectrum of Latin America: mestiza/Indigenous-descent Latinas often have slightly hooded eyes with epicanthal folds (Central and South American Indigenous heritage); European-descent Latinas have the same eye shapes as European populations; Afro-Latina eyes reflect West African eye characteristics; the full spectrum of human eye shapes is present',
    makeupTraditions: 'Smoky eye as a Latina cultural classic: the dramatic, smudged dark eye has been a Latina beauty signature (think Salma Hayek, Jennifer Lopez, Eva Longoria); warm brown and bronze tones complement Latina warm skin undertones; terracotta and copper shades are particularly flattering on warm golden-brown Latina complexions; the bold lash is non-negotiable in Latina beauty culture',
    freida: 'Frida Kahlo\'s influence: Frida Kahlo\'s bold, uncompromising aesthetic (unibrow; strong, real brows; colourful eye art) has become a global symbol of anti-conformist beauty and Latina pride; the reclaiming of natural brows (particularly in communities with strong South American Indigenous heritage) is connected to the Frida aesthetic revival',
    recommendations: 'Warm copper and terracotta eyeshadow for Latina warm undertones; black or dark brown liner (not grey or taupe which are more flattering for cool skin); mascara as non-negotiable; strong, defined brows (natural shape emphasised, not over-thinned); smudged liner for the warm, romantic Latina eye aesthetic; vitamin C and concealer for any dark circles'
  },
  'east-asian': {
    community: 'East Asian',
    
    doubleeyelidHistory: 'The double eyelid (雙眼皮 / 쌍커풀 / 二重まぶた): cosmetic eyelid surgery (blepharoplasty to create a double eyelid crease — 雙眼皮手術) is the most commonly performed cosmetic surgery in East Asia and among East Asian diaspora communities; the reasons are complex and contested — some see it purely as an aesthetic preference (a defined crease is considered beautiful by many in East Asian cultures independent of any Western influence); others argue it represents a Westernisation of beauty standards; the monolid-positive movement (particularly in Korea and among East Asian diasporic youth) advocates for celebrating and making up the monolid rather than surgically altering it; MIRRR celebrates and serves both: the monolid is beautiful and has specific makeup techniques',
    monolid_makeup: 'The definitive monolid makeup guide: double eyelid tape or double eyelid glue creates a temporary crease without surgery; these products are extremely popular and widely available in East Asia; application technique: place the tape or glue in the upper crease area with eyes open — the tape literally lifts the lid to create a crease; specific monolid makeup brushes and product formulas have been developed in Korea for this eye type',
    kBeautyEye: 'K-beauty eye aesthetics: the "puppy eye" look (slightly downturned outer liner creating a doe, innocent appearance — opposite of the cat eye); the "glossy eyelid" trend (a touch of clear gloss on the mobile lid for a dewy, youthful look); the straight, straight brow (not arched — a straight or slightly drooping brow is the Korean aesthetic as opposed to the arched Western brow); the gradient lip and puppy eye combination is the definitive K-beauty look',
    recommendations: 'Eyeshadow applied higher than the crease (above the natural fold) for monolid eyes; horizontal wing (not steeply angled up) for monolid liner; shimmer on the inner corner and mobile lid to create the illusion of depth; eyelash curler — essential for East Asian straight lashes; an aggressive heated lash curler works better than a standard curler for very straight lashes; straight or slightly arched brow for K-beauty aesthetic; peach brightening eye cream for periorbital darkness'
  },
  'east-african': {
    community: 'East African',
    eyeShape: 'East African (particularly Somali, Ethiopian, and Eritrean) facial features are characterised by high cheekbones, narrow noses, and large, deep-set eyes; East African eyes tend to be elongated (almond to oval shape) and deep-brown to dark; the structural definition from prominent orbital bone and cheekbone creates natural shadow and dramatic depth around the eye without makeup',
    kohlTradition: 'Kohl is a long-standing part of beauty culture in many East African Muslim communities, including Somali, Djiboutian and coastal Swahili communities; the tradition connects to both Islamic prophetic practice and older Horn of Africa practice; a deep, jet-black waterline is a signature look',
    ethiopianEye: 'Ethiopian tizita (nostalgia) eye: Ethiopian beauty aesthetics emphasise the emotional expressiveness of the eye; deep, elongated eyes with defined brows and dark lash lines are the Ethiopian beauty ideal; Ethiopian women traditionally use kohl and kohola (a traditional Ethiopian eye preparation) for eye definition',
    recommendations: 'Carbon-based kajal for deep kohl application; waterline application for dramatic depth that complements East African bone structure; minimal lid shadow (the structure does the work); defined brow that follows the natural strong arch; deep-set eye makeup technique (light shimmer on the mobile lid brings eyes forward)'
  },
  'south-african': {
    community: 'South African',
    diversity: 'South Africa\'s diverse population produces an enormous range of eye types: Black African eyes (large, deep brown, typically strong in an almond or round shape); Coloured/mixed-heritage eyes (may have lighter irises from European or Cape Malay heritage; more variable shapes); Indian South African eyes (South Asian characteristics — almond, dark brown); White South African eyes (European range)',
    xhosaZuluBeauty: 'Xhosa and Zulu traditional eye beauty: the emphasis is on the total face as a canvas; in initiation ceremonies, white ochre (umqhele) is applied to the face including around the eyes; the dramatic white face against dark skin creates intense eye definition; modern South African makeup draws on this contrast aesthetic — bold eye looks against deep skin are a South African beauty signature',
    marula: 'Marula oil around the eye: marula oil\'s high oleic acid content and light texture make it an ideal eye area oil; it absorbs quickly without leaving an oily residue around the eye; vitamin C in marula oil may gradually help periorbital hyperpigmentation; apply with ring finger patting motion (not rubbing) to the orbital bone area',
    recommendations: 'Bold eye definition for deep South African skin tones; rich chocolate and warm auburn eyeshadows complement melanin-rich South African complexions; marula oil as an eye area treatment; SPF eye cream (the fine lines around the eye accumulate UV damage rapidly); full, defined lashes'
  },
  'black-american': {
    community: 'Black American',
    eyeShape: 'Black American eyes span a wide range reflecting the genetic diversity of the African diaspora: large, round eyes; almond-shaped; deep-set; some individuals have slight epicanthal influence from mixed ancestry; dark brown to almost black irises; typically prominent, visible sclera (white of the eye) that creates dramatic eye definition against dark complexions',
    makeupPhilosophy: 'Black American eye makeup culture has shaped a great deal of modern makeup artistry: the editorial Black eye makeup aesthetic (full, graphic liner; cut crease; bold colour blocking; glass eye technique; rhinestones and gems as eye decoration) is globally influential; the art of makeup for dark skin tones — understanding that shadows must be truly dark (not soft grey), that highlight must be truly golden (not silver-white), that blending rules must be adjusted for deeper skin — is a specialist skill that Black makeup artists have developed and documented',
    
    lashes: 'Lash culture in Black American beauty: full, dramatic lashes are a non-negotiable cultural aesthetic; strip lashes; individual lashes; mink lashes; individual cluster lashes; the "lash line" (visible strip of glue) is masked with liner; lash glue must be adhesive enough for all-day wear and for dancing; the Black American lash aesthetic influenced global beauty industry expansion of false lash categories',
    darkCircles: 'Pigmentary dark circles require colour correcting: for Fitzpatrick IV-VI skin, the colour corrector underneath concealer must be warm orange or terracotta (not peach, which is appropriate for lighter skin tones; on deep skin, peach correctors are not warm enough to neutralise the grey-brown of periorbital darkness); a terracotta or deep orange corrector, set lightly, then covered with a foundation or concealer that matches the deepest part of the dark circle provides the most effective coverage',
    recommendations: 'Terracotta/orange colour corrector for dark circles on deep skin; waterproof everything (lash glue, liner, mascara); individual false lashes for natural; strip lashes for drama; cut crease technique adapted for eye shape; bold brow shaping (threading or shaping); SPF around the eye for PIH prevention from any inflammation'
  }
};

export function getEyeBeautyGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_EYE_BEAUTY_GUIDES['west-african'],
    'south-asian': ETHNIC_EYE_BEAUTY_GUIDES['south-asian'],
    caribbean: ETHNIC_EYE_BEAUTY_GUIDES.caribbean,
    arab: ETHNIC_EYE_BEAUTY_GUIDES.arab,
    latina: ETHNIC_EYE_BEAUTY_GUIDES.latina,
    'east-asian': ETHNIC_EYE_BEAUTY_GUIDES['east-asian'],
    'east-african': ETHNIC_EYE_BEAUTY_GUIDES['east-african'],
    'south-african': ETHNIC_EYE_BEAUTY_GUIDES['south-african'],
    'black-american': ETHNIC_EYE_BEAUTY_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

