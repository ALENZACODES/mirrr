/**
 * MIRRR — Hair Colour Guide for Ethnic Hair
 * Comprehensive guide to hair colouring, bleaching, toning, and
 * colour care across all 9 ethnic communities.
 */

export const HAIR_COLOUR_SCIENCE = {
  title: 'The Science of Hair Colour',
  naturalPigment: {
    eumelanin: 'Eumelanin produces brown and black pigments; found in high concentrations in dark hair; comes in two forms: brown eumelanin and black eumelanin; Black, South Asian, East Asian, and African hair has primarily eumelanin',
    phaeomelanin: 'Phaeomelanin produces red and yellow pigments; found in red and blonde hair; all natural hair contains some phaeomelanin; dark hair reveals phaeomelanin undertones during the bleaching process (orange and red stages)',
    interplay: 'Natural hair colour is determined by the ratio of eumelanin to phaeomelanin, the amount of melanin overall, and the distribution within the hair shaft; grey hair results from the loss of melanocyte activity (not a loss of pigment — melanocytes simply stop producing melanin)',
    melanocortin: 'MC1R gene determines red hair; variants reduce eumelanin and increase phaeomelanin; more common in Northern European populations; rare in East Asian, South Asian, West African populations (though red tones can naturally occur in any population)'
  },
  hairStructure: {
    cortex: 'The cortex (middle layer) contains all the natural melanin pigment and is where artificial colour molecules deposit; the target of all hair colour processes',
    cuticle: 'The cuticle (outer layer of overlapping scales) must be opened (by alkaline chemicals in permanent hair colour) for colour molecules to reach the cortex; damage to the cuticle causes the frizz, porosity, and dullness associated with colour-treated hair',
    melanosomes: 'Melanin is packaged in melanosomes within the cortex; in Fitzpatrick V-VI (very dark hair) melanosomes are large, numerous, and densely packed — this is what makes very dark hair harder to bleach and more resistant to lightening'
  },
  colourWheelForHair: {
    levels: 'Hair colour is measured on a level scale from 1 (black) to 10 (lightest blonde), sometimes extended to 12 for very pale tones; most people of sub-Saharan African, South Asian, East Asian, and Middle Eastern descent naturally have Level 1-2 hair',
    tones: 'Each level can have warm (gold, red, copper, orange tones) or cool (ash, violet, pearl tones) variations; "N" or neutral tones fall in between',
    undertones: 'When dark hair is bleached, it reveals underlying warm undertones in a predictable sequence: black (Level 1) → dark red-brown (Level 2) → red (Level 3) → orange-red (Level 4) → orange (Level 5) → gold-orange (Level 6) → gold (Level 7) → pale gold (Level 8) → pale yellow (Level 9) → pale yellow/white (Level 10); this is why going ash blonde from very dark hair requires extensive bleaching and toning',
    tonersNeeded: 'To achieve a cool-toned result, the warm undertones exposed during bleaching must be neutralised with a toner; the complementary colour theory applies: violet/purple neutralises yellow; blue neutralises orange; blue-green neutralises red-orange; without toning, bleached very dark hair appears brassy orange'
  }
};

export const BLEACHING_SCIENCE = {
  title: 'Bleaching and Lightening — The Chemistry',
  mechanism: 'Bleaching uses hydrogen peroxide (an oxidising agent) combined with a bleach powder (usually ammonium persulfate, potassium persulfate, or sodium persulfate) to oxidise and break down melanin molecules; oxidised melanin becomes colourless; the process also partially breaks down the hair\'s keratin structure (protein damage)',
  developers: {
    '10vol': '3% hydrogen peroxide; gentle developer; used for depositing colour only (no lift); darkening or toning',
    '20vol': '6% hydrogen peroxide; standard developer; provides 1-2 levels of lift; used with permanent colour for colour changes close to natural level',
    '30vol': '9% hydrogen peroxide; provides 2-3 levels of lift; higher risk of damage; used for more significant lightening',
    '40vol': '12% hydrogen peroxide; maximum lift (3-4 levels); highest damage risk; only for professional use; never used on scalp directly by reputable practitioners',
    higher: 'Developers above 40vol are dangerous and not used in reputable salons; cause severe chemical burns and catastrophic hair damage'
  },
  lightbulbEffect: 'When bleach is applied to hair that has had semi-permanent or permanent red, copper, or orange-toned artificial colour, a "lightbulb effect" can occur: these pigments resist lifting and turn extremely bright orange/red when bleach is applied; always inform a colourist of previous colour history',
  protectionActives: {
    olaplex: 'Olaplex (and similar bond-building additives: Wellaplex, pH-Bonder, Fiberplex) contain bis-aminopropyl diglycol dimaleate; this molecule reconnects disulfide bonds broken during bleaching; used as an addition to bleach and in subsequent treatment masks; significantly reduces bleach damage and breakage; NOT a protein treatment — works at the molecular level on disulfide bonds',
    proteinTreatments: 'Protein treatments (hydrolysed wheat protein, hydrolysed keratin, rice protein) temporarily fill gaps in the hair shaft created by bleaching damage; different from Olaplex-type bond-builders; both are useful but serve different functions'
  },
  sessions: 'Achieving very pale blonde from very dark (Level 1-2) hair requires multiple bleaching sessions spaced 4-6 weeks apart to prevent catastrophic breakage; attempting to go from black to platinum in one session will break most hair; a responsible colourist will plan a multi-session journey over several months'
};

export const HAIR_COLOUR_TYPES = {
  temporary: {
    what: 'Temporary colour (colour rinses, colour shampoos, colour sprays) deposits colour molecules on the outside of the hair shaft only; removed with 1-2 shampoos; no developer used; no lift; cannot lighten hair; some penetration into porous or damaged hair may make it last slightly longer',
    bestFor: 'Trying a colour without commitment; special events; fashion colour on already-bleached hair (vivid temporary colours); grey coverage for a day or two',
    darkHair: 'Temporary colour does not show up on unbleached dark hair (most ethnic hair is Level 1-3); any colour deposited on very dark hair will only be visible in bright light or on bleached sections'
  },
  semi: {
    what: 'Semi-permanent colour (no developer, small molecules, some penetrate slightly into the cortex); lasts 4-12 shampoos; no lift capability; fades gradually; not suitable for significant grey coverage (some provide partial coverage)',
    bestFor: 'Glossing; adding shine; refreshing existing colour; subtle darkening; toning bleached hair; low-commitment colour change on already light hair',
    examples: 'Joico Color Butter; Schwarzkopf Color Mask; Ion Color Brilliance semi-permanent'
  },
  demiPermanent: {
    
    bestFor: 'Grey blending; glossing with slightly longer life; slightly darkening or changing tone without commitment; keeping hair healthier than permanent colour',
    note: 'Hair glosses offered at salons are typically demi-permanent colour'
  },
  permanent: {
    what: 'Permanent colour uses a developer (10-40 vol) to open the cuticle; oxidative dyes form large colour molecules inside the cortex that cannot be removed by shampooing; provides full grey coverage; can lighten up to 3-4 levels (with 40vol developer); colour fades and new growth shows at roots as hair grows',
    bestFor: 'Full grey coverage; significant colour changes; long-lasting colour',
    damage: 'More damaging than temporary/semi/demi; cumulative damage with repeated applications; overlapping permanent colour on already-coloured lengths increases damage and should be minimised (colour only the roots, not the whole length, on touch-up appointments)',
    examples: 'Wella Koleston Perfect; Schwarzkopf IGORA Royal; L\'Oréal Majirel (professional); Garnier Nutrisse; Clairol Nice\'n Easy (retail)'
  },
  directDye: {
    what: 'Direct dyes (fashion/vivid colours: neons, pastels, vivid blues, greens, pinks, purples) are pre-mixed colour formulas with no developer; deposit onto hair surface; require a pale blonde base (usually bleached to Level 9-10) to show vibrancy on dark hair; some dark direct dyes (black, dark blues, dark purples) can show on unbleached dark hair',
    brands: 'Arctic Fox; Manic Panic; Punky Colour; Joico Color Intensity; Pravana Vivids; Pulp Riot (professional)',
    darkHair: 'Vivid fashion colours will not appear on dark unbleached ethnic hair; dark hair must be bleached to achieve fashion colours; pastel fashion colours require Level 10 bleach (the palest blonde, nearly white) to appear as intended',
    fade: 'Direct dyes fade faster than permanent colour; may leave a faint colour shadow on porous bleached hair that resists complete removal; fading process can create beautiful colour gradients (deliberate "fading" is used as a styling technique)'
  }
};

export const GREY_HAIR_GUIDE = {
  title: 'Grey Hair — Embracing and Managing',
  biology: 'Grey hair results from the cessation of melanocyte activity in the hair follicle; follicles gradually stop producing melanin; genetic timing of greying is largely inherited; oxidative stress may accelerate the process; greying that starts unusually early may have genetic or nutritional causes and is worth mentioning to a doctor',
  prematureGreying: 'Vitamin B12 deficiency is linked to premature greying (more common in vegetarian/vegan communities); thyroid disorders; autoimmune conditions; chronic stress (some evidence); smoking accelerates greying; nutritional deficiencies',
  characteristics: {
    texture: 'Grey/white hair typically has a coarser texture than pigmented hair; often has a different porosity; can be more resistant to some chemical processes',
    frizz: 'Grey hair tends to have a wiry, frizzy character; hydrating conditioners and smoothing treatments particularly beneficial',
    yellowing: 'Natural white hair can yellow from mineral deposits (iron, copper from water supply), environmental pollution, certain medications, UV exposure; purple/silver shampoos used to neutralise yellowing in white/grey hair'
  },
  greyTransition: {
    what: 'Growing out natural grey from dyed hair; the transition involves a visible line of demarcation (harsh line between dyed and natural) unless managed; this process typically takes 18-24+ months for longer hair',
    techniques: ['Bold root blurring: colour-matching the roots to the emerging grey to reduce the contrast', 'Salt and pepper blend: adding low-lights to match the grey emerging pattern, softening the transition', 'Going lighter overall: bleach-assisted techniques (babylights, highlights) to help the transition look intentional rather than grown-out', 'The big chop: cutting all dyed hair to start fresh with natural colour at the roots (most radical but quickest)']
  },
  silverStyling: {
    products: 'Purple/violet-toned shampoos (Shimmer Lights; Clairol Shimmer Lights; Joico Color Balance Purple; Fanola No Yellow) neutralise unwanted warm tones in grey/white hair; use 1-2x per week — daily use can over-tone (turning hair purple/grey-purple); leave in for 3-5 minutes',
    trending: 'Silver hair is increasingly celebrated across cultures; the "silver fox" and "silver vixen" aesthetics are growing; natural grey is increasingly embraced across all ethnic communities'
  }
};

export const HAIR_COLOUR_DAMAGE_CARE = {
  title: 'Caring for Colour-Treated Hair',
  colourFade: {
    causes: 'Colour fades because small colour molecules gradually wash out through the cuticle; hot water opens the cuticle and accelerates fading; UV light breaks down colour molecules (especially red and blue/violet tones); harsh shampoos strip colour faster than sulfate-free options',
    prevention: ['Wash with cool or cold water', 'Use sulfate-free (SLS-free) shampoo designed for colour-treated hair', 'Wash hair less frequently', 'Apply a UV protectant spray before sun exposure', 'Use colour-depositing conditioner or shampoo between colour appointments to refresh tone']
  },
  damageRepair: {
    immediate: 'Deep conditioning mask immediately after any bleaching or colouring service; Olaplex No.3 (bond-building home treatment); protein treatment for very damaged hair',
    ongoing: ['Regular deep conditioning (weekly for bleached hair)', 'Bond-building treatment weekly or bi-weekly (Olaplex No.3, Wellaplex No.3)', 'Trim split ends regularly (colour-treated ends split faster)', 'Reduce heat styling frequency; use the lowest effective heat setting; always use heat protectant', 'Silk or satin pillowcase to reduce friction damage'],
    scissors: 'The only true way to get rid of split ends is to cut them; deep conditioners and treatments can temporarily smooth the appearance of split ends but cannot repair them permanently'
  },
  retouchTiming: {
    permanent: 'Permanent colour root touch-ups are typically done every 4-8 weeks when roots become visible (varies by how fast hair grows and how significant the contrast is between natural and coloured hair)',
    bleach: 'Bleach/highlight touch-ups every 8-12 weeks; waiting longer between bleach sessions reduces cumulative damage to the hair'
  }
};

export const ETHNIC_HAIR_COLOUR_GUIDES = {
  'west-african': {
    naturalHair: 'West African hair is typically Level 1-2, very black, with very dense eumelanin; coiled Type 4 hair structure; the combination of very dark colour and coiled structure makes bleaching particularly risky as colour-treated coiled hair is more vulnerable to breakage due to the points of weakness at each curl',
    bleachingRisk: 'Bleaching Type 4 West African hair requires extreme care; the coiled structure has natural points of weakness at each bend; chemical processing adds stress to already-vulnerable curl points; frequent bleaching of Type 4 hair leads to breakage; work with a professional colourist experienced with natural hair',
    popularColours: 'Honey blonde highlights; burgundy; auburn; dark copper; caramel ombré; vivid colour on starter locs or straight-styled sections; the "mushroom brown" trend adapted for dark skin with caramel undertones',
    protective: 'Colouring protective styles (box braids, weaves, wigs) rather than natural hair allows colour expression without damaging the natural hair underneath; wigs and extensions offer the greatest colour versatility without damage',
    traditionalContext: 'West African hair colouring traditions include natural plant-based pigments; commercial hair dye arrived much later; natural henna was used in West African Islamic communities; synthetic braiding hair in vibrant colours has become an important cultural expression in many West African communities'
  },
  'south-asian': {
    naturalHair: 'South Asian hair is typically Level 1-3; predominantly brown-black to black; predominantly eumelanin; South Asian hair is often very long (culturally valued length); fine to medium diameter; can be wavy to straight',
    popularColours: 'Balayage from dark to medium brown; auburn highlights; burgundy all-over colour; "Bollywood brown" — rich warm chocolate brown tones; dark copper; increasingly mainstream: ombre with vivid tips among younger South Asian diaspora',
    bleachingConsiderations: 'South Asian hair can bleach well (tends to be finer than West African or Caribbean hair, with less coiled structure); can achieve light colours with fewer sessions than Type 4 hair; balayage and highlights are the most popular colour services in South Asian communities (less commitment and damage than all-over colour)',
    henna: {
      traditional: 'Henna (Lawsonia inermis) is a deep cultural and religious tradition for South Asian women; henna produces a rich orange-red-brown stain on hair due to lawsone dye molecule; the colour result depends on the natural hair colour (very dark hair shows auburn/brown; lighter hair shows more orange-red)',
      chemicalBlocking: 'Very important: natural henna creates a chemical barrier on the hair shaft; after henna, chemical hair dye (especially bleach) can be very unpredictable; henna and chemical colour do not mix well; always disclose henna history to a salon; a professional strand test is essential before any chemical service on henna-treated hair',
      blackHenna: '"Black henna" is NOT real henna; it contains PPD (para-phenylenediamine) — the same chemical used in chemical hair dye; black henna can cause severe allergic reactions (chemical burns, scarring, systemic reactions); avoid any product called "black henna"; genuine henna produces only an orange-brown colour'
    },
    indigoMixing: 'Indigo (from Indigofera tinctoria plant) mixed with henna can produce brown to near-black colours; a two-step henna + indigo process is used by many South Asian women who want to cover grey while avoiding chemicals; indigo alone does not stain; it only colours over an existing henna base; produces beautiful dark brown and black tones'
  },
  caribbean: {
    naturalHair: 'Caribbean hair spans a wide spectrum depending on heritage: Afro-Caribbean hair (Type 3b-4c, typically Level 1-2); Indo-Caribbean hair (Type 2-3a, Level 2-4); mixed-heritage hair in all combinations',
    popularColours: 'Honey blonde ombre; Rihanna-inspired vibrant reds and vivid colours; dark cherry; golden highlights',
    rihanna: 'Rihanna (Barbadian) has been one of the most influential hair colour icons globally across her career; her iconic red hair period, black bob, and various vivid colours normalised bold hair colour choices for Black and Caribbean women; she has publicly worn hers bleached, dyed, and in wigs/weaves to protect her natural hair',
    JBCO: 'Jamaican Black Castor Oil (JBCO) is used as a pre-colour treatment to protect hair during chemical processes; the ricinoleic acid in castor oil coats the hair shaft; using JBCO as a pre-poo (pre-shampoo) treatment before bleaching reduces some damage',
    wig: 'Wig and weave culture is significant in Caribbean communities as in Black American communities; wearing wigs for colour while protecting natural hair underneath is a common and celebrated approach'
  },
  arab: {
    naturalHair: 'Arab hair varies significantly by region and heritage: Gulf, Levantine, Maghrebi, Egyptian; generally Level 1-4; wavy to straight for many Gulf and Levantine women; can be more curly for North African Arab women; very rich and dark brown to black tones predominate',
    popularColours: 'Hair colouring is very popular in Arab beauty culture; most popular: rich chocolate brown; caramel highlights; balayage; auburn; increasingly: blonde (particularly in younger Gulf Arab women); Mediterranean tones (warm chestnut, olive)',
    
    kuwaitiBlonde: 'The "Kuwaiti blonde" — warm golden blonde colour achieved by lightening naturally dark brown hair — has been a long-standing trend in Gulf Arab beauty; achieved through balayage or full bleach and tone to warm golden levels',
    culturalContext: 'Hair colouring is generally practised within cultural norms; for hijabi women, hair colour is private (visible only to family and women) but is still very popular — hair colouring is as important, sometimes more so, as a personal beauty ritual for women who cover; vibrant fashion colours are popular in private settings',
    oud: 'Oud and oriental-inspired hair perfumes (hair mists, hair oils with fragrance) are increasingly popular in Arab beauty culture; fragrancing the hair is traditional'
  },
  latina: {
    naturalHair: 'Latina hair spans the full spectrum from Type 1 (straight) to Type 4 (coily) depending on heritage; colour ranges from Level 1 (black) to Level 5-6 (medium brown) predominantly; a wide diversity of textures and colours within the community',
    popularColours: 'Balayage is enormously popular in Latin American and Latina communities; warm caramel highlights on dark brown; honey blonde balayage; "bronde" (brown-blonde); ombre from dark to light; vivid fashion colours among younger generations',
    warmTones: 'Warm-toned colour results particularly flatter many Latina women (warm skin undertones in many cases); warm caramel, honey, copper, and golden blonde tones are the most popular choices',
    brazilianInfluence: 'Brazilian blow-dry/keratin treatments are enormously popular in Latin America and among Latina women globally; these smoothing treatments (often applied over coloured hair) temporarily straighten and smooth wavy/curly hair using keratin and heat; some formulas contain formaldehyde (a known carcinogen); formaldehyde-free alternatives are available and preferable',
    highlights: 'Highlights (particularly the "sun-kissed" balayage style) are the most popular colour service in Latin American salons; they complement a wide range of natural hair colours and skin tones; more conservative colour change than all-over lightening'
  },
  'east-asian': {
    naturalHair: 'East Asian hair (Chinese, Japanese, Korean, Vietnamese, and related groups) is typically Level 1-3; very straight to slightly wavy (Type 1a-2a); tends to have the largest individual hair diameter of all ethnic groups; very dense eumelanin; very high natural shine when healthy',
    resistance: 'East Asian hair is very resistant to bleaching due to large, densely packed melanosomes; can be the most challenging hair type to achieve light blonde from; typically requires more bleach sessions than South Asian or European hair of similar depth',
    japaneseKoreaInfluence: 'K-beauty (Korean beauty) and J-beauty (Japanese beauty) have enormous global influence on hair colour trends; Korean hair colour trends include: permed + coloured hair (wavy/curly perms then coloured in warm tones); natural-looking subtle highlights; ash brown ("cendré" tones); milk tea brown; mushroom brown; soft caramel; the "Korean dye job" featuring natural-looking gradient from darker roots to lighter ends is globally trendy',
    asianPerm: 'Chemical perming is very common in East Asian hair care to add curl/wave; cold wave perms and digital perms are both popular; combining a perm and colour on the same hair requires careful sequencing (ideally do colour before perm or wait 2+ weeks between services) to prevent excessive damage',
    bleachDifficulty: 'Going platinum or very light from East Asian Level 1-2 black hair is one of the most technically challenging hair colour jobs; typically requires 2-4+ bleach sessions over several months; porosity management (protein treatments, Olaplex) is critical; finding a colourist with specific experience in East Asian hair colour is strongly recommended',
    popularColours: 'In Japan and Korea: dark ash brown ("charcoal" tones); "chestnut" warm brown; strawberry brown; milk tea; caramel blonde; Japanese gyaru aesthetic: very blonde (historically significant in Japanese youth culture); K-pop idol hair colour is a significant trend driver globally'
  },
  'east-african': {
    naturalHair: 'East African hair (Ethiopian, Eritrean, Somali, Kenyan, Tanzanian communities) varies by specific heritage; ranges from Type 3 (Ethiopian/Eritrean curl patterns — looser than West African 4C) to Type 4 (other East African heritage groups); typically Level 1-2; often medium to fine diameter',
    popularColours: 'Honey brown; warm auburn; burgundy; caramel highlights; growing: vivid colour',
    diasporaInfluence: 'East African diaspora communities in the US, UK, Canada, and Scandinavia have developed vibrant hair colour cultures; Ethiopian-American and Somali-American women particularly have explored colour as part of identity expression in diaspora contexts',
    chemicalIntolerance: 'East African hair with looser curl patterns may be more sensitive to bleach damage; always do strand tests and protein treatments before bleach; the combination of finer texture (common in some East African heritage) and bleach damage creates breakage risk',
    frankincense: 'Frankincense resin (Boswellia tree, native to Horn of Africa) is used in East African hair care traditions; thought to strengthen hair and scalp; natural tradition with limited scientific evidence but cultural significance'
  },
  'south-african': {
    naturalHair: 'South African hair reflects the extraordinary diversity of the Rainbow Nation: Zulu, Xhosa, Sotho, Ndebele heritage with Type 3-4 hair; Afrikaner and white South African heritage with European hair types; Cape Malay, Indian South African heritage; Khoisan communities with very distinctive Type 4 hair; colour spans the full spectrum',
    popularColours: 'Rich mahogany; dark chocolate; caramel; rose gold on bleached sections; burgundy; the "natural hair movement" has reduced chemical processing including colour in many Black South African communities',
    ndebele: 'Ndebele women\'s traditional dress includes extraordinarily elaborate geometric patterns, bold colours (red, yellow, green, black, white), and decorative neck rings; the aesthetic of bold, geometric colour is reflected in modern South African fashion and has influenced beauty culture',
    marula: 'Marula oil (from the marula tree, Sclerocarya birrea, native to southern Africa) is used as a pre-colour treatment and colour maintenance treatment; protects hair during chemical processes and maintains colour vibrancy; Africology and other South African beauty brands celebrate indigenous ingredients',
    colourism: 'The legacy of apartheid and its racial hierarchies still affects South African beauty culture; skin lightening and hair relaxing/straightening have been linked to internalised colourism; the natural hair movement and wider acceptance of natural African beauty is part of ongoing cultural healing'
  },
  'black-american': {
    naturalHair: 'Black American hair spans the full Type 3-4 spectrum; typically Level 1-2; coiled curl patterns from 3a to 4c; enormous diversity within the community reflecting the diversity of heritage',
    popularColours: 'Honey blonde; "expensive brunette" (warm chocolate to caramel tones); auburn; vivid colours on protective styles (box braids, locs); burgundy; rose gold; platinum (very popular but requires significant salon investment and hair care)',
    protectiveStyle: 'Protective style colouring (colouring synthetic or human hair extensions rather than natural hair) is widely practised in Black American communities; allows colour expression without the damage risk to natural hair; coloured box braids, locs, weaves, and wigs are a significant cultural expression',
    iconicColour: 'Beyoncé\'s honey blonde has been one of the most influential hair colour moments for Black American women; SZA\'s vivid colour experiments; Cardi B\'s bold colour changes; Teyana Taylor\'s colour evolution; Janelle Monáe\'s black and white aesthetic; these icons normalise the full spectrum of colour for Black women',
    naturalhair: 'The natural hair movement (mid-2000s to present) initially emphasised embracing natural texture without chemical alteration; some in the community extended this to no colour; the movement has since broadened to celebrate all expressions of Black hair including vibrant colours, especially on natural textures (colour without relaxer)',
    melanin: 'The Melanin Haircare brand and similar brands have created colour-safe products specifically for dark, coily hair; representation in hair care product marketing for darker skin tones and coily hair textures has improved significantly in the 2010s-2020s',
    locs: 'Dreadlocks and locs can be coloured; the loc community has developed specific techniques for colouring mature locs without compromising loc integrity; colour on locs is increasingly popular in Black American beauty culture'
  }
};

export function getHairColourScience(section) {
  const map = {
    pigment: HAIR_COLOUR_SCIENCE.naturalPigment,
    structure: HAIR_COLOUR_SCIENCE.hairStructure,
    colourWheel: HAIR_COLOUR_SCIENCE.colourWheelForHair,
    bleaching: BLEACHING_SCIENCE,
    types: HAIR_COLOUR_TYPES,
    grey: GREY_HAIR_GUIDE,
    damage: HAIR_COLOUR_DAMAGE_CARE
  };
  return map[section] || null;
}

export function getEthnicHairColourGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_HAIR_COLOUR_GUIDES['west-african'],
    'south-asian': ETHNIC_HAIR_COLOUR_GUIDES['south-asian'],
    caribbean: ETHNIC_HAIR_COLOUR_GUIDES.caribbean,
    arab: ETHNIC_HAIR_COLOUR_GUIDES.arab,
    latina: ETHNIC_HAIR_COLOUR_GUIDES.latina,
    'east-asian': ETHNIC_HAIR_COLOUR_GUIDES['east-asian'],
    'east-african': ETHNIC_HAIR_COLOUR_GUIDES['east-african'],
    'south-african': ETHNIC_HAIR_COLOUR_GUIDES['south-african'],
    'black-american': ETHNIC_HAIR_COLOUR_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

