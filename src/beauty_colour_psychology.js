/**
 * MIRRR — Beauty Colour Psychology Guide
 * Colour theory in makeup and fashion, cultural colour symbolism,
 * psychological effects of colour on perception, and how colour
 * choices interact with ethnicity, culture, and identity.
 */

export const COLOUR_PSYCHOLOGY_OVERVIEW = {
  title: 'Colour Psychology in Beauty',
  whatIsIt: 'Colour psychology is the study of how colours affect human emotions, perceptions, and behaviours. In beauty, this applies to how the colours we choose for makeup, hair, and clothing affect how we feel, how others perceive us, and how we communicate identity and mood.',
  how_colours_work: {
    lightWavelengths: 'Colour is the brain\'s interpretation of different wavelengths of light reflected from objects; what we call "red" is light in the 620-750 nm wavelength range; "violet" is 380-450 nm; skin, hair, and makeup pigments selectively absorb and reflect wavelengths, and our brain interprets the reflected light as colour',
    cones: 'The human retina has three types of cone cells (L, M, S) sensitive to long/medium/short wavelengths (approximately red, green, blue); the brain combines their signals to produce our full colour experience',
    contextDependence: 'Colour perception is always relative to context — the same red looks different against a white background than against a dark background; this is directly relevant to makeup: the same lipstick reads differently on Fitzpatrick II vs Fitzpatrick VI skin',
    warmCool: 'Warm colours (red, orange, yellow) have shorter visual distance — they appear to advance toward the viewer, creating boldness and energy. Cool colours (blue, green, purple) appear to recede — creating calm, depth, and distance. This is why cool contour creates shadow and warm highlight creates prominence.'
  },
  psychologicalEffects: {
    red: { emotion: 'Passion, power, confidence, danger, attention', physiological: 'Increases heart rate; increases cortisol slightly; increases alertness; red environments associated with higher performance on detail-oriented tasks', beautyApplication: 'Red lipstick — one of the most studied beauty colour choices; associated with increased perceived attractiveness and confidence; the "red dress effect" (wearing red associated with increased perceived dominance and attractiveness)', cultural_variation: 'See cultural section — red is celebratory in many East Asian, South Asian, and Sub-Saharan African contexts; it is the colour of weddings and joy in many cultures' },
    pink: { emotion: 'Softness, femininity, playfulness, nurturing', physiological: 'Baker-Miller pink (a specific shade of bubble gum pink) was studied for its calming effect on aggressive behaviour in prisons; softer pinks associated with reduced anxiety', beautyApplication: 'Pink blush is universally associated with health and youth (mimics the flush of exertion or health); pink eye makeup creates a romantic or vulnerable look', cultural_variation: 'Pink is a relatively recent Western gender association (pre-1950 it was used for boys as a "strong, definite" colour); in many non-Western cultures, pink has no specific gender association' },
    blue: { emotion: 'Trust, calm, intelligence, reliability, melancholy', physiological: 'Slows heart rate; reduces cortisol; blue environments associated with increased creativity', beautyApplication: 'Blue eyeshadow — a statement colour that cycles in and out of trend; blue makes the whites of the eyes appear whiter; navy eyeliner is more flattering than black for many skin tones', cultural_variation: 'Nazar (evil eye) protection in Mediterranean, Middle Eastern, and South Asian cultures is often depicted in blue; blue has protective spiritual meaning in these traditions' },
    green: { emotion: 'Nature, health, balance, growth, envy', physiological: 'Most restful for the eye (the most common colour in nature, so the eye is most adapted to it); hospitals used to be painted green', beautyApplication: 'Green eyeshadow can neutralise redness (complementary colour on the colour wheel — used in colour-correcting primers); deep green is a bold statement; olive green is universally flattering', cultural_variation: 'Green has specific meanings in Islam (colour of paradise, associated with the Prophet); in Chinese culture, a green hat (绿帽子) has a specific culturally negative meaning — relevant in gift-giving context' },
    gold: { emotion: 'Luxury, wealth, wisdom, achievement, warmth', physiological: 'Gold and warm yellow tones activate the same regions as positive emotional states in neuroimaging studies', beautyApplication: 'Gold highlighter; gold eyeshadow; gold jewellery — the most universally flattering warm metallic in beauty; particularly radiant against medium-deep skin tones', cultural_variation: 'Gold is sacred in Hinduism (associated with Lakshmi, goddess of wealth); central to African royal aesthetics; Eid celebration colour; South Asian bridal essential' },
    white: { emotion: 'Purity, clarity, simplicity, sterility, emptiness', beautyApplication: 'White eyeliner in waterline brightens and enlarges eyes; white highlight; white chrome nails (current trend); graphic white liner', cultural_variation: 'In East Asian, South Asian, and many African cultures: white is associated with mourning, death, and ghosts — the OPPOSITE of Western use for weddings and purity; in Japan, the white bridal kimono (shiromuku) is a specific exception for its layered meaning' },
    black: { emotion: 'Power, sophistication, mystery, elegance, mourning', beautyApplication: 'Black eyeliner — universally available and used across virtually all beauty cultures; black mascara; little black dress; bold black lip (goth/avant-garde)', cultural_variation: 'In Western cultures: black = mourning AND chic (the paradox of "little black dress" being both funereal and sophisticated); in most other cultures: white or a specific colour = mourning; black has less mourning association in many non-Western cultures' },
    purple: { emotion: 'Royalty, mystery, creativity, spirituality', historical: 'Tyrian purple dye was the most expensive colour pigment in antiquity (extracted from Murex sea snails; approximately 250,000 snails for 1 oz of dye); reserved exclusively for royalty; Roman emperors were described as "born in the purple"', beautyApplication: 'Purple eyeshadow makes brown eyes pop (complementary colours); lavender eye makeup for cool or fair skin; deep plum for dark skin' },
    orange: { emotion: 'Energy, warmth, enthusiasm, creativity, approachability', beautyApplication: 'Burnt orange and terracotta have had major beauty moments; coral (orange-pink) flatters warm undertones across many skin tones; the warm trend in beauty has been dominated by terracotta and rust tones', cultural_variation: 'Orange-red is sacred in Hinduism (saffron); Buddhist monks\' robes are saffron; deep orange is a celebration colour in many South Asian contexts' }
  }
};

export const CULTURAL_COLOUR_SYMBOLISM = {
  title: 'Colour Symbolism Across Cultures: Critical for Beauty Choices',
  red: {
    China_Korea_Vietnam: 'Celebratory, luck, happiness, joy; wedding colour; used during Lunar New Year; red envelope (hongbao) tradition; RED IS NEVER worn to funerals',
    South_Asia: 'Bridal colour; celebration; power; Hindu brides wear red; married Hindu women traditionally wear red sindoor (vermillion powder in the hair parting); mehndi and bangles in red for brides',
    Arab_World: 'Red is worn for celebrations but not as exclusively as in East/South Asia; it can also be seen as aggressive or too bold in some contexts',
    SubSaharan_Africa: 'Red has complex meanings: in some cultures a colour of power and royalty; in others associated with blood and danger; Maasai people of Kenya/Tanzania use red ochre body decoration as cultural identity',
    Western: 'Danger, passion, romance; red light district; red for stop; Western wedding colour is white (not red)',
    BeautyImplication: 'Red bridal makeup is culturally appropriate and expected at South Asian and some East Asian weddings; red nails and lips at Chinese New Year are considered lucky'
  },
  white: {
    East_Asia: 'Mourning, death, ghosts (Japan: yurei are white; Chinese funerals involve white); white chrysanthemums are funeral flowers; white is NOT for celebrations (notable exception: Western-influenced white wedding dresses now common but the traditional Japanese wedding kimono has its own specific symbolism)',
    South_Asia: 'Widowhood in some Hindu traditions (white saree for widows; particularly in older generations and some communities); also associated with purity in Hindu ritual; modern urban India has significantly different norms',
    Middle_East: 'White is used in Islamic pilgrimage (Ihram garments — men wear white; it is a symbol of purity and equality before God); white is a practical colour in hot climates; not specifically associated with mourning in most Arab cultures',
    SubSaharan_Africa: 'White can have spiritual or ancestral significance in some West African traditions (Yoruba, Igbo); also practical lightness; not universally mourning-associated',
    BeautyImplication: 'Bringing white flowers or wearing all white to a South Asian or East Asian household event can be culturally insensitive; white bridal hair accessories at a Chinese-heritage wedding would be inappropriate without context'
  },
  yellow_gold: {
    China: 'Imperial colour; gold and yellow historically reserved for emperors; deep cultural associations with royalty and the divine (the Yellow Emperor of China mythology)',
    India: 'Sacred; haldi ceremony (turmeric = yellow) is the pre-wedding ritual; saffron sacred in Hinduism; yellow/gold for religious occasions',
    Western: 'Gold = wealth; yellow often associated with happiness or cowardice (context-dependent)',
    BeautyImplication: 'Gold jewellery at South Asian, East Asian celebrations is not just decorative but carries cultural weight; the quantity of gold worn at a South Asian wedding signals family wealth and blessing'
  },
  green: {
    Islam: 'Sacred green — the colour associated with paradise, the Prophet Muhammad (pbuh), and Islamic identity; the crescent and star often rendered in green; green is never to be used disrespectfully in Islamic cultural contexts',
    Ireland: 'Celtic and Irish national colour; Saint Patrick\'s Day; a matter of cultural identity',
    China: 'Green hat (绿帽子) — extremely offensive cultural reference; do not gift green hats to Chinese contacts',
    BeautyImplication: 'Green nail art or accessories can carry Islamic spiritual significance; be aware of unintentionally appropriative green use near Eid without cultural knowledge'
  },
  black: {
    West_Africa: 'Black and gold in Ghanaian kente cloth represent age, maturity, and spiritual energy; black in mourning clothes in many West African communities (also influenced by Western norms in urban areas); significant funeral dress codes in Nigeria and Ghana',
    Japan: 'Black (kuro) in formal dress (men\'s montsuki kimono for formal occasions including funerals AND weddings — context-dependent); black is chic and formal; not exclusively associated with mourning',
    Western: 'Mourning AND chic; the paradox of the "little black dress" as both funereal and the most elegant fashion choice',
    BeautyImplication: 'A guest wearing black to a Nigerian funeral is appropriate (black mourning dress); but all-black at a Nigerian or Ghanaian celebration event may seem too sombre — bold colourful prints are appropriate for celebration'
  },
  purple: {
    Historical: 'Royal colour historically across Mediterranean, European, and some Asian cultures (Tyrian purple)',
    Thailand: 'Purple is associated with widowhood in Thailand — particularly for women',
    BeautyImplication: 'In Thai cultural contexts, all-purple makeup or outfit could potentially carry mourning associations for older generations'
  }
};

export const COLOUR_FOR_SKIN_TONE = {
  title: 'Choosing Colours that Work With Your Skin Tone',
  eyeshadow_by_undertone: {
    warm: ['Warm terracotta, rust, copper, bronze', 'Warm peachy nude', 'Gold', 'Warm burgundy (brownish-red)', 'Earth tones: brown, chestnut, warm olive green'],
    cool: ['Silver, platinum', 'Cool pink (fuchsia, magenta)', 'Mauve', 'Deep purple', 'Navy blue', 'Lavender', 'Cool taupe'],
    neutral: ['Rose gold (warm cool balance)', 'Champagne', 'Taupe', 'Dusty rose', 'Medium purple', 'Olive green (beautiful on neutral skin)']
  },
  eyeshadow_by_eye_colour: {
    brown: { enhancers: ['Bronze and copper (reflect warm undertones in brown iris)', 'Purple (complementary on colour wheel to amber/yellow in brown eyes)', 'Navy and midnight blue', 'Gold'], contrast: ['Blue (high contrast eye look — striking)'] },
    hazel: { enhancers: ['Green (to bring out green in hazel)', 'Purple (to bring out amber)', 'Copper and bronze', 'Warm brown', 'Burgundy'], contrast: ['All warm tones enhance the hazel shift'] },
    dark_brown_black: { enhancers: ['Rich jewel tones (emerald, sapphire, amethyst — all pop against very dark irises)', 'Rose gold', 'Any metallic (strong contrast against dark iris)', 'Bold graphic colour looks'], note: 'Very dark irises allow for the most dramatic colour choices as no one shade can "clash" with a nearly black iris' }
  },
  blush_by_skin_tone: {
    I_II_fair: ['Soft pink (peach-pink or baby pink)', 'Light coral', 'Barely-there warm peach', 'Very light rose'],
    III_medium: ['Rose', 'Warm peach', 'Medium coral', 'Medium mauve'],
    IV_mediumDark: ['Terracotta', 'Deep peach', 'Warm copper', 'Deep rose', 'Brick red'],
    V_VI_deep: ['Deep berry', 'Deep terracotta', 'Warm mahogany', 'Deep wine', 'Rich bronze-rose', 'Note: Very fair pink blushes are invisible on deep skin; look for blushes specifically developed for deep skin (e.g. Danessa Myricks Blurring Balm Powder in deep shades, Mented Cosmetics, UOMA)']
  }
};

export const ETHNIC_COLOUR_PSYCHOLOGY = {
  'west-african': {
    culturalColours: 'Kente cloth (Ghana) is the most globally recognisable African textile — its colours have specific meanings: gold = royalty, wealth, high status, purity, glory, virtue; green = growth, renewal, good health, spiritual renewal; blue = peace, harmony, good fortune, love; red = political and spiritual moods, bloodshed, sacrificial rites; white = purification, festivity, victory, deification; black = maturation, intensified spiritual energy, ageing; yellow = preciousness, royalty, wealth, fertility',
    makeupColours: 'Bold, vibrant, heavily pigmented looks are embraced; the aesthetic celebrates colour saturation; orange-red, deep plum, bright coral, electric blue, and bright green are all worn with confidence',
    fashionColours: 'Ankara and kente prints are vibrant and high-contrast; colour-clashing is a form of expression not a mistake; the aesthetics of colour in West African dress is maximalist and joyful',
    recommendation: 'Bold, highly pigmented eye looks; warm orange-red or bright coral on the lips; avoid muted or greige tones if going for an authentic West African aesthetic'
  },
  'south-asian': {
    culturalColours: 'Extremely nuanced colour associations: Red = bridal, auspicious, Shakti (divine feminine), Durga; Yellow/saffron = Hinduism, sacred, sacrifice; Green = Islamic association, fertility, the earth, beginning; White = mourning (widowhood in traditional communities), purity in ritual, also religious observance; Purple = mourning in some regions; Blue = associated with Krishna (blue-skinned deity), Vishnu; Orange/saffron = spiritual; Pink = celebration, especially for young girls and in festive contexts; Black = protection from evil eye (black thread around wrist or ankle, kajal on babies for this reason)',
    makeupColours: 'For celebration and weddings: rich saturated colours mirror the textile tradition; deep red, gold, deep green, royal blue; for daily contemporary: lighter and more Western-influenced in urban settings',
    fashionColours: 'Dupattas (scarves) carry colour meaning at events; brides in different regions wear different colours (Punjabi brides: red; Bengali brides: red and white; Tamil brides: silk in red or green; Pakistani brides: red or maroon traditional, now very varied)',
    recommendation: 'Warm gold, deep red, and jewel tones are culturally resonant for South Asian festive occasions; always the most vibrant and saturated version of a colour is appropriate for celebrations'
  },
  caribbean: {
    culturalColours: 'Carnival colours — the most important aesthetic context; vibrant, electric, tropical: turquoise, bright yellow, electric pink, vivid orange, lime green; the colours of feathered costumes and joy; Jamaican rastafarian colours red/gold/green have deep cultural meaning (red = blood of martyrs, green = earth and nature, gold = wealth of Africa)',
    makeupColours: 'For carnival: extreme boldness; rhinestones, glitter, feathers applied to face; face paint; very saturated eye colour; body paint; monochromatic colour looks very popular in carnival makeup; for daily/fashion: more relaxed, but glow and radiance always present',
    recommendation: 'Tropical colour palette: turquoise, bright coral, electric pink, vivid yellow for Caribbean aesthetic makeup moments; glitter and shimmer are always appropriate for festival contexts'
  },
  arab: {
    culturalColours: 'Green is sacred in Islamic tradition; white (Ihram) for religious pilgrimage; Henna patterns on hands and feet for celebrations (the warm orange-red of henna is a signature colour of celebrations); Gold is central to Arab celebration aesthetics; black is sophisticated and universally worn; deep jewel colours at celebrations',
    makeupColours: 'For formal occasions: deep, defined, high-contrast; smoky eye in deep brown/black; gold and copper eyeshadow; deep lip; kajal and kohl lining heavily; Arabian-style golden eye with defined brow',
    fashionColours: 'Abayas come in every colour but black is most traditional in Gulf; Palestinian embroidery (tatreez) uses vibrant geometric colours; Lebanese fashion is very European-influenced with all colours; North African djellaba comes in rich jewel tones',
    recommendation: 'Gold eye makeup for Eid; henna application for celebrations; deep dramatic eye looks for special occasions; green in accessories carries spiritual resonance for Muslim communities'
  },
  latina: {
    culturalColours: 'Extreme regional variation from Mexico to Argentina; Dia de los Muertos in Mexico uses orange marigold (cempasúchil), purple, pink, and black — colours of death and memory; Brazilian Carnaval mirrors Caribbean carnival in vibrancy; Argentine fashion tends toward European sophistication; Andean communities use rich woven textile colours with specific regional patterns and meanings',
    makeupColours: 'Bold red lips and strong brows are pan-Latina aesthetics; Frida Kahlo aesthetic uses earth tones and florals; carnaval makeup is extreme and artistic; Cuban and Puerto Rican beauty aesthetic values glamour and high colour; Mexican-American chola aesthetic: dark liner, arched brows, nude lip — a very specific cultural-aesthetic movement',
    recommendation: 'Warm orange-red, deep berry, bright coral for classic Latina beauty looks; the earthy terracotta trend in beauty has roots in Latina and Latin American aesthetics; flower hair accessories in vibrant colours are culturally resonant'
  },
  'east-asian': {
    culturalColours: 'Red for Lunar New Year and Chinese weddings; red = luck, joy, happiness; white = mourning in traditional contexts (modern funerals vary); gold = prosperity; pink = romance and youth in Korean pop culture; pastel colours are major in Japanese and Korean beauty trends (associated with cuteness and youthfulness)',
    makeupColours: 'K-beauty trends have globalised East Asian colour aesthetics; current trends: dewy skin, gradient/glass lip, gradient blush (patches of pink on the cheeks for a flushed look), graphic liner in colour; the "Douyin/TikTok" makeup trend from China features strong colour blocking',
    fashionColours: 'Hanbok (Korean traditional dress) uses primary jewel colours: blue, red, green, yellow; Kimono silk brocade uses layered seasonal colours with complex traditional rules; Qipao/cheongsam traditionally in rich silk jewel tones',
    recommendation: 'Pastels, gradient blush, and glass lips for K-beauty aesthetic; red for Lunar New Year; graphic colour liner for bold editorial East Asian-influenced look'
  },
  'east-african': {
    culturalColours: 'Ethiopian Timkat (Epiphany) and Meskel (Finding of the True Cross) celebrations: white with coloured borders (Ethiopian Orthodox traditions); kanga and kikoi in Kenya: bold printed textiles with colourful geometric patterns and Swahili proverbs; Somali traditional garments: white with coloured border; Maasai: red and blue beadwork (iconic); Rwandan imigongo art: black, white, natural clay colours',
    makeupColours: 'Ethiopian bridal makeup: jewel tones, gold, deep eyes; for ceremonies: defined and bold; Somali women traditionally use heavy kohl (kajal) eye definition',
    recommendation: 'Jewel tones and gold for East African celebration looks; deep kohl-lined eyes in traditional contexts; for modern daily wear, the ultra-deep skin tones of many East African women are most flattered by warm bold colours and deep rich jewel tones'
  },
  'south-african': {
    culturalColours: 'Zulu beadwork: each colour of bead carries specific meaning in traditional Zulu communication; white = purity, virginity, love; red = passion, love, hardship; yellow = wealth; green = grass, vegetation, beauty; pink = high status; blue = loyalty, virgin; South African flag colours (red, green, blue, black, yellow, white) are culturally resonant; Ndebele geometric house painting: bold geometric patterns in primary colours on a white base — one of the most recognisable African art forms; South African fashion is increasingly globally influential',
    makeupColours: 'Diverse; Black South African women: bold, high-coverage makeup at events; Indian South African women: South Asian-influenced bridal colours; the South African beauty market is sophisticated and pan-cultural',
    recommendation: 'Primary geometric colours of Ndebele and Zulu beadwork are a beautiful inspiration for bold, culturally rooted colour looks; warm gold and bold red are celebratory'
  },
  'black-american': {
    culturalColours: 'Juneteenth celebration: red, black, and green (Pan-African colours; red = blood of the people; black = the people themselves; green = the land); Harlem Renaissance aesthetics: deep jewel tones, bold colour, art deco; Black church culture: elegant and vibrant — the "Sunday best" dress code uses rich colours; the Black cultural tradition that colour is not garish but expressive and joyful; queer Black aesthetics: Ballroom culture uses category-specific colours; Pride flag + Black liberation flag intersectionality in colour',
    makeupColours: 'Bold and expressive across all contexts; the freedom to wear colour is itself a form of cultural expression; bold red lip as power statement (reclaimed in the context of "appropriate" workplace presentation debates); highly pigmented eye looks; the snatched look with defined brows, full lash, bold lip',
    recommendation: 'Pan-African colours (red, black, green) for Juneteenth; warm jewel tones year-round; the maximalist approach to beauty colour is culturally appropriate and celebrated — do not understate when the culture celebrates boldness'
  }
};

export function getColourPsychologyOverview() {
  return COLOUR_PSYCHOLOGY_OVERVIEW;
}

export function getColourPsychology(colour) {
  if (!colour) return COLOUR_PSYCHOLOGY_OVERVIEW.psychologicalEffects;
  const map = {
    red: COLOUR_PSYCHOLOGY_OVERVIEW.psychologicalEffects.red,
    pink: COLOUR_PSYCHOLOGY_OVERVIEW.psychologicalEffects.pink,
    blue: COLOUR_PSYCHOLOGY_OVERVIEW.psychologicalEffects.blue,
    green: COLOUR_PSYCHOLOGY_OVERVIEW.psychologicalEffects.green,
    gold: COLOUR_PSYCHOLOGY_OVERVIEW.psychologicalEffects.gold,
    yellow: COLOUR_PSYCHOLOGY_OVERVIEW.psychologicalEffects.gold,
    white: COLOUR_PSYCHOLOGY_OVERVIEW.psychologicalEffects.white,
    black: COLOUR_PSYCHOLOGY_OVERVIEW.psychologicalEffects.black,
    purple: COLOUR_PSYCHOLOGY_OVERVIEW.psychologicalEffects.purple,
    orange: COLOUR_PSYCHOLOGY_OVERVIEW.psychologicalEffects.orange
  };
  return map[colour.toLowerCase()] || COLOUR_PSYCHOLOGY_OVERVIEW.psychologicalEffects;
}

export function getCulturalColourSymbolism(colour) {
  if (!colour) return CULTURAL_COLOUR_SYMBOLISM;
  const map = {
    red: CULTURAL_COLOUR_SYMBOLISM.red,
    white: CULTURAL_COLOUR_SYMBOLISM.white,
    gold: CULTURAL_COLOUR_SYMBOLISM.yellow_gold,
    yellow: CULTURAL_COLOUR_SYMBOLISM.yellow_gold,
    green: CULTURAL_COLOUR_SYMBOLISM.green,
    black: CULTURAL_COLOUR_SYMBOLISM.black,
    purple: CULTURAL_COLOUR_SYMBOLISM.purple
  };
  return map[colour.toLowerCase()] || CULTURAL_COLOUR_SYMBOLISM;
}

export function getEthnicColourPsychology(communityId) {
  const directMap = {
    'west-african': ETHNIC_COLOUR_PSYCHOLOGY['west-african'],
    'south-asian': ETHNIC_COLOUR_PSYCHOLOGY['south-asian'],
    caribbean: ETHNIC_COLOUR_PSYCHOLOGY.caribbean,
    arab: ETHNIC_COLOUR_PSYCHOLOGY.arab,
    latina: ETHNIC_COLOUR_PSYCHOLOGY.latina,
    'east-asian': ETHNIC_COLOUR_PSYCHOLOGY['east-asian'],
    'east-african': ETHNIC_COLOUR_PSYCHOLOGY['east-african'],
    'south-african': ETHNIC_COLOUR_PSYCHOLOGY['south-african'],
    'black-american': ETHNIC_COLOUR_PSYCHOLOGY['black-american']
  };
  return directMap[communityId] || null;
}

export function getColourForSkinTone(section) {
  if (!section) return COLOUR_FOR_SKIN_TONE;
  const map = {
    eyeshadow: COLOUR_FOR_SKIN_TONE.eyeshadow_by_undertone,
    eyes: COLOUR_FOR_SKIN_TONE.eyeshadow_by_eye_colour,
    blush: COLOUR_FOR_SKIN_TONE.blush_by_skin_tone
  };
  return map[section] || COLOUR_FOR_SKIN_TONE;
}

export const BEAUTY_COLOUR_PSYCHOLOGY_STATS = {
  moduleId: 'beauty_colour_psychology',
  version: '1.0.0',
  topics: ['colour psychology', 'colour symbolism', 'cultural colour meaning', 'eyeshadow colour', 'blush colour', 'kente colours', 'red lipstick', 'Pan-African colours', 'Zulu beadwork colour', 'colour theory makeup', 'white mourning East Asia', 'Tyrian purple history', 'green Islam', 'henna orange'],
  communitiesSupported: 9,
  keyFacts: [
    'White is a mourning colour in East Asian and parts of South Asian cultures — the OPPOSITE of its Western association with weddings and purity; bringing white chrysanthemums (funeral flowers in Japan) as a gift would be deeply inappropriate',
    'Tyrian purple was so expensive in antiquity that only Roman emperors could afford it — 250,000 Murex sea snails to produce 1 oz of dye; this is why "born in the purple" means born into royalty',
    'Kente cloth colours have specific codified meanings: gold = royalty and purity; green = growth; red = political/spiritual significance; black = maturation and spiritual energy',
    'Green (Islamic sacred colour associated with paradise) is never to be used disrespectfully in Islamic cultural contexts; gifting a green hat (绿帽子) in Chinese culture is extremely offensive for unrelated reasons',
    'The Pan-African colours (red, black, green) introduced by Marcus Garvey represent the blood of the people, the people themselves, and the land of Africa; central to Juneteenth and Black liberation celebrations',
    'Baker-Miller pink (a specific bubblegum pink shade) was studied for its effects on reducing aggression in prison settings; colour has genuine physiological measurable effects',
    'Red lipstick is one of the most studied beauty choices in social psychology — studies show women wearing red are perceived as higher in status and are rated as more attractive in studies from multiple countries'
  ]
};
