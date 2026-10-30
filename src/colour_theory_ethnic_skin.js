/**
 * MIRRR — Colour Theory for Ethnic Skin Tones
 * Undertones, colour matching, makeup colour theory, all 9 communities.
 */

export const COLOUR_THEORY_FUNDAMENTALS = {
  title: 'Colour Theory Fundamentals for Makeup',
  colourWheel: {
    primary: 'Primary colours in the traditional RYB colour model: red, yellow, blue; in light/additive colour mixing: red, green, blue (RGB); makeup artists work with the subtractive pigment model (RYB-influenced)',
    complementary: 'Complementary colours: colours directly opposite each other on the colour wheel; complementary colours neutralise each other when mixed or layered; this is the fundamental principle behind colour correcting in makeup',
    colourCorrecting: {
      overview: 'Colour correcting uses complementary colour theory to neutralise skin discolourations before foundation application: the corrector is applied first (a thin layer); then foundation goes over it; the corrector and foundation mix on the skin to create a neutral result',
      green: 'Green corrector: neutralises red (redness from acne, rosacea, capillaries); complementary to red on the colour wheel; useful on Fitzpatrick I-III where redness is the concern',
      peach: 'Peach corrector: neutralises blue-purple (dark circles on medium skin tones, Fitzpatrick III-IV); peach = yellow + red, which are the complements of the blue-purple that appears under the eyes in medium skin tones',
      orange: 'Orange/terracotta corrector: neutralises blue-black (dark circles and pigmentation on deep skin tones, Fitzpatrick V-VI); orange is the complement of blue-black; a peach corrector is too light on deep skin — the more saturated orange is required to neutralise darker pigmentation; this is one of the most commonly misunderstood principles — using peach corrector on dark circles of Fitzpatrick VI skin makes them look grey or ashy because the corrector is not saturated enough to neutralise the pigmentation',
      yellow: 'Yellow corrector: neutralises purple-lavender (bruising, veins); for pale skin tones with visible purple veins',
      lavender: 'Lavender corrector: neutralises yellow-sallow (yellowing or sallowness in pale skin, jaundice tones)',
      salmon: 'Salmon corrector: for medium skin tones, neutralises dark circles with a reddish-brown or olive-dark undertone'
    }
  },
  undertones: {
    overview: 'Undertone is the subtle hue underneath the surface skin colour that remains constant regardless of tanning, seasonal changes, or acne; it is the most important concept in makeup colour matching; undertone is distinct from skin depth (fair, medium, deep) — you can be fair-skinned with warm undertones or deep-skinned with cool undertones',
    warm: 'Warm undertones: yellow, peachy, or golden tones visible beneath the skin; the veins in the inner wrist appear greenish (the blue of the vein combined with the yellow skin tone creates green); gold jewellery tends to be the most flattering (gold harmonises with the warmth); foundation with yellow/golden-beige tones will look natural',
    cool: 'Cool undertones: pink, red, or bluish tones beneath the skin; veins appear blue or purple; silver jewellery tends to be the most flattering (silver harmonises with the coolness); foundation with rose/pinkish-beige tones will look natural',
    neutral: 'Neutral undertones: a balance of warm and cool with no clearly dominant undertone; both gold and silver jewellery look good; foundations with yellow or pink bases may both work; many neutral-undertone individuals can wear a wide range of foundation shades',
    olive: 'Olive undertones: a specific undertone common in Mediterranean, Middle Eastern, South Asian, East Asian, Latina, and other communities; olive is a grey-green undertone on top of yellow-warm base; this is often the most misunderstood undertone — olive skin is often classified by product testers as "neutral" when the grey-green quality makes many foundations look wrong; olive-undertone individuals need foundations with a grey-olive cast or neutral with very slight yellow; pure pink/rose foundations or pure warm-yellow foundations both look off',
    ashyChalkCatch: 'The "ashy" and "chalky" problem: these two terms describe the most common foundation failure on dark skin; "ashy" = the foundation has too much cool/grey in it making dark skin look greyed-out and flat; "chalky" = too much white pigment used to make dark shades without enough warming pigments, creating an artificial matte white-grey cast; both are caused by formulation failures — most foundation ranges historically were developed on fair skin and simply added white + small pigment amounts to darken shades, rather than developing deep shades with their own pigment mixtures'
  },
  foundationRange: {
    
    deuce: 'Shade range vs undertone range: a foundation range needs both deep shades AND a wide undertone range within those shades; many brands added deep shades after the Fenty effect but only added neutral-warm undertone versions; deep-skinned women with cool undertones or with specific olive undertones were still poorly served; the ideal range covers warm, neutral, and cool undertones at every depth level'
  }
};

export const ETHNIC_COLOUR_GUIDES = {
  'west-african': {
    community: 'West African',
    undertone: 'however, this is not universal — some West African women have cool undertones; a helpful test is to observe skin in natural daylight: if the undertone reads clearly warm-golden or golden-red, it is warm; if it reads slightly purple-cool, it is neutral-cool.',
    foundation: 'Foundation for West African skin: avoid: any foundation that appears chalky (too much titanium dioxide white pigment); any foundation that pulls ashy-grey on the skin; seek: foundations specifically formulated for deep skin with rich pigment (not "whitened"); brands that have been praised by dark-skinned reviewers for non-chalky formulas: Fenty Beauty (Pro Filt\'r foundation), NARS (warm deep shades), MAC (developed earlier extended range), Black Opal (founded specifically for dark skin)',
    lipColour: 'Lip colour for deep West African skin: warm-toned lipsticks are most flattering (warm reds, warm plums, warm berries, warm brown-reds); nude lip colour for dark skin MUST be warm-toned — mauve-nude (which is beige-pink) looks corpse-like on dark skin; the ideal nude for deep skin is actually a warm caramel-brown or terracotta close to the skin tone; deep vampy colours (deep burgundy, deep wine, deep plum) look extraordinary on dark skin; true orange-red lipsticks look powerful and beautiful on dark skin',
    colourCorrecting: 'Colour correcting for West African skin: orange/terracotta corrector for dark circles (not peach — not saturated enough); orange concealer for deep hyperpigmentation spots; a full-coverage warm-toned foundation may eliminate the need for separate correction',
    recommendations: 'Warm-deep foundation shade; jewel-toned and earth-toned eyeshadow; warm nude or deep vampy lipstick; orange/terracotta colour corrector for dark circles; golden eyeshadow for evening drama; warm bronze highlighter on cheekbones, nose bridge, and inner corner of eyes'
  },
  'south-asian': {
    community: 'South Asian',
    sallow: 'Avoiding the yellow-sallow look: South Asian skin with olive-warm undertones can be made to look yellow-sallow by the wrong undertone foundation (too warm/yellow); the foundation needs to be warm but not overly yellow; specifically for olive-undertone South Asian skin, a neutral-olive or olive-warm foundation shade is ideal rather than pure warm-yellow',
    dramaticEyes: 'South Asian eye makeup tradition: kajal-lined eyes are the central tradition; the kajal look ranges from a thin defining line to the full kohl surround of the entire eye; eyeshadow colours from the Indian classical tradition: gold and bronze (most traditional); reds and coral (festive); blues and teals (striking contrast against South Asian eye colour); earth tones (everyday); for Bollywood-influenced looks, drama is encouraged',
    bridal: 'South Asian bridal makeup: South Asian bridal makeup is among the most elaborate and technically demanding in the world; a South Asian bridal face may involve 2-3 hours of application including: heavy contouring; elaborate eye looks with multiple eyeshadow shades and heavy liner; traditional bindi placement; and meticulous setting to last through a multi-hour wedding ceremony',
    recommendations: 'Olive-warm or neutral-warm foundation that neither looks too yellow-sallow nor too pink; kajal eye liner as a South Asian beauty essential; gold and bronze eyeshadow; deep jewel-toned lipstick for evenings; warm berry or classic red lipstick; avoid cool-pink tones which can look clownish against olive-warm skin'
  },
  caribbean: {
    community: 'Caribbean',
    undertoneRange: 'Caribbean skin tone diversity: the Caribbean encompasses the full range of human skin tones from very dark Afro-Caribbean (Fitzpatrick V-VI) through medium-warm mixed heritage (Fitzpatrick III-IV) to lighter European-heritage (Fitzpatrick II-III); the dominant skin tone profile in the Caribbean is warm-to-neutral with olive to golden undertones',
    
    recommendations: 'Know your undertone (most Caribbean skin is warm-to-neutral); warm-toned foundation shade; coral or warm-red lipstick; for Carnival: any colour in maximum saturation; jewel-toned eyeshadow; bronze and gold highlight for warm Caribbean glow'
  },
  arab: {
    community: 'Arab',
    dramaticEye: 'Arab eye emphasis: Arab makeup aesthetics prioritise the eye — historically because in hijab-wearing communities the eyes are the primary visible facial feature; Arabic eye makeup techniques are among the most sophisticated: kohl or kajal applied to the waterline and under the eye as well as the lid; eyeshadow applied to create a powerful, smoky, defined eye; false lashes are commonly used in Arab beauty; the traditional Arab eye look is dramatic, dark, and defined',
    contouring: 'Contouring in Arab beauty: contouring the nose and cheekbones is a standard part of the Arab makeup tradition; the specific Arab face shape features and the beauty ideal of refined, defined features makes contouring a natural complementary technique; blush is used in warm-toned rosy or apricot shades rather than cool pink',
    goldTones: 'Gold and warm metallics for Arab skin: gold jewellery, gold eyeshadow, and gold highlighter are central to Arab beauty aesthetics; warm gold tones harmonise beautifully with the warm-olive Arab undertone; the combination of dark smoky eye, warm bronze/gold highlight, and a warm red or berry lip is a classic Arab evening beauty look',
    recommendations: 'Warm-olive foundation avoiding both the overly pink (too cool) and the overly yellow (too warm); dark, defined eye makeup (kohl, kajal, dark brown/black eyeshadow); warm gold or bronze highlighter; warm-toned red or berry lipstick; blush in apricot or warm rose; avoid cool-toned pink or lavender products which can look ashy against warm Arab undertones'
  },
  latina: {
    community: 'Latina',
    undertoneRange: 'Latina undertone range: as with Caribbean, Latina skin encompasses essentially the full range of human skin tones and undertones due to the diverse racial heritage of Latin America; many Latina women have warm-golden to warm-olive undertones at Fitzpatrick III-IV; Indigenous Mexican and Central/South American women may have warm-golden to warm-deep tones at Fitzpatrick IV-V; Afro-Latina women have the full spectrum of Afro-diasporic skin tones',
    warmColors: 'Warm colour palette for Latina skin: the warm and olive-warm undertone common in many Latina women is beautifully complemented by: coral (particularly popular in Latina makeup); warm reds and rustic orange-reds (terracotta, brick); warm bronze and gold eyeshadow; warm earthy browns; deep warm-plum or burgundy for evenings; the JUNGALOW aesthetic of lush, warm, saturated colours reflects the Latin American colour sensibility',
    latina_bold: 'Latina bold colour tradition: Latin American makeup aesthetics embrace colour saturation and drama; the warm, lush, bold makeup look is culturally resonant; a bright red lip with brown smoky eye is a classic Latina look; bold brow, defined eye, bold lip is the trifecta of Latin American beauty makeup',
    recommendations: 'Warm-to-olive-warm foundation; bright warm coral or red lipstick; warm bronze or gold eyeshadow; warm terracotta blush; full defined brow; avoid cool-pink, lavender, or ashy tones which look unnatural against warm Latina undertones'
  },
  'east-asian': {
    community: 'East Asian',
    undertone: 'many East Asians have a slightly yellow-neutral or neutral-olive undertone; Korean women often describe their skin tone as "white beige" or "rosy beige"; Japanese beauty historically used the metaphor of sakura (cherry blossom) pink-white for an ideal cool-light-pink skin tone.',
    glassSkin: 'Colour for glass skin: the Korean glass skin ideal is luminous, dewy, skin-colour-but-better; foundation for glass skin should be: very close to natural skin tone (not darker for contouring, not lighter for brightening); slightly luminous/dewy finish; thin coverage; the goal is to enhance the skin\'s own colour and light-reflection, not cover it with colour',
    monolid: 'Colour theory for monolid eyes: monolid makeup colour placement differs from double-eyelid makeup; on a monolid, the crease (the natural fold) where shadow is typically concentrated in Western makeup technique is not visible when the eye is open; instead: apply shadow starting at the lash line and bring it up higher than where the natural crease is; the shadow becomes visible above the lid when the eye is open; shadow colours for monolid: sheer shimmer washes look beautiful; brown smoky techniques can be adapted; graphic liner is particularly effective as a graphic element that remains visible',
    coral: 'Coral in Korean beauty: coral (a warm orange-pink) is one of the most used and flattering colours in Korean beauty; coral blush, coral eyeshadow, and coral lipstick are K-beauty staples; this specific warm-pink-orange hits the ideal between warmth (complementing the yellow undertones in much East Asian skin) and freshness',
    recommendations: 'Neutral-to-neutral-olive foundation; luminous glass-skin finish; coral blush and eyeshadow for K-beauty aesthetic; sheer pink or red lip; minimal-but-perfect eye approach; shadow placed higher than natural crease on monolid; puppy-liner technique (liner in outer lower lash corner pointing downward for a sweet look); avoid heavy contouring which fights the glass-skin ideal'
  },
  'east-african': {
    community: 'East African',
    undertone: 'East African undertones: Somali, Ethiopian, Eritrean, and Djibouti women have diverse skin tones from medium-warm to deep; many East African women have warm-cool neutral tones with some cool or reddish undertones, as well as beautiful warm-gold tones; the fine-boned East African facial structure creates distinctive makeup aesthetics',
    definitions: 'Defined features and colour: the strong cheekbones, defined jaw, and fine features of many East African women make colour placement for contour and highlight particularly effective; a light highlighter on the already-defined East African cheekbone creates extraordinary effect; contouring the naturally defined nose may not be necessary',
    colourPlay: 'Colour on deep East African skin: all the same principles as West African deep skin apply; jewel tones show beautifully; earth tones are natural and warm; deep vampy lips are striking; the East African aesthetic has been represented by supermodels including Iman and Waris Dirie whose approach to makeup — sometimes minimal, sometimes graphic — has influenced high fashion makeup aesthetics globally',
    recommendations: 'Warm-deep or cool-deep foundation depending on individual undertone; strong defined eye; earth tones and jewel tones for eye shadow; terracotta/orange corrector for dark circles; deep berry or warm red lip; gold or bronze highlighter on cheekbones'
  },
  'south-african': {
    community: 'South African',
    undertone: 'South African skin diversity: South Africa has extraordinary ethnic diversity creating the full spectrum of skin tones; Indian South African women similar to South Asian undertone profiles; white South African women from Fitzpatrick I-III',
    ubuntu: 'Colour as culture in South African beauty: South African Black women have a deep cultural relationship with colour as personal expression and community identity; Zulu, Xhosa, Ndebele, Sotho colour traditions all use saturated, bold, culturally specific colour combinations; Ndebele geometric design (bold black outlines with red, yellow, and green fills) is one of the most striking examples of culturally specific colour theory as art and identity',
    ndebele: 'Ndebele colour theory: the Ndebele artistic tradition uses specific bold colour combinations in geometric patterns; applying these colour principles to makeup creates a distinctly South African aesthetic; the Ndebele palette (red, yellow, orange, green, black, white) and the Zulu beadwork palette have inspired South African and international makeup artists',
    recommendations: 'Warm-deep foundation for Black South African skin; jewel tones and earth tones for eyeshadow; terracotta colour corrector; warm-deep lip colour; gold and bronze highlight; bold colour choices as cultural celebration (Ndebele-inspired); marula oil under foundation for dewy base'
  },
  'black-american': {
    community: 'Black American',
    undertone: 'Black American undertone diversity: the African diaspora heritage of Black Americans produces an enormous range of skin tones and undertones; from neutral-cool to warm-golden to warm-red to warm-mahogany; and wrong undertone (particularly the assumption that all dark skin has warm undertone — cool-undertone Black American women were almost never served by mainstream ranges)',
    fentyEffect: 'The Fenty Effect: Rihanna\'s Fenty Beauty launch in September 2017 with 40 shades specifically named the failure to serve dark-skinned women as the explicit reason for the launch; the shade range and the specifically formulated deep shades (not chalky, not ashy) created immediate sellout in the darkest shades, proving both the demand and the failure of the industry to serve this market; the Fenty Effect forced the entire industry to expand ranges and reformulate deep shades within 12-18 months of the launch',
    
    boldColour: 'Black American colour in makeup: Black American makeup culture celebrates bold colour in both everyday and artistic contexts; from the natural Black beauty movement of the 1960s-70s that rejected European beauty standards, through the bold lip and eye of 1980s and 1990s R&B culture, to the contemporary Black Beauty renaissance driving representation; deep jewel tones, warm nudes (terracotta/caramel, never beige-pink), dramatic mattes, glitter moments, and defined eyes are all central to Black American makeup aesthetics',
    recommendations: 'Foundation with proper deep-shade pigmentation (not chalky/ashy); Fenty Beauty or similar brands with specifically formulated deep shades; determine your specific undertone (cool Black American women need cool-toned deep shades); terracotta/warm nude lip (never pink-beige nude which is a nude designed for pale skin); jewel-tone eyeshadow; warm bronze and gold highlight; orange corrector for dark circles'
  }
};

export function getColourTheoryGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_COLOUR_GUIDES['west-african'],
    'south-asian': ETHNIC_COLOUR_GUIDES['south-asian'],
    caribbean: ETHNIC_COLOUR_GUIDES.caribbean,
    arab: ETHNIC_COLOUR_GUIDES.arab,
    latina: ETHNIC_COLOUR_GUIDES.latina,
    'east-asian': ETHNIC_COLOUR_GUIDES['east-asian'],
    'east-african': ETHNIC_COLOUR_GUIDES['east-african'],
    'south-african': ETHNIC_COLOUR_GUIDES['south-african'],
    'black-american': ETHNIC_COLOUR_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

