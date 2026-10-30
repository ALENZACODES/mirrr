/**
 * MIRRR — Extended Lip Colour Guide
 * Colour theory for all skin tones, lip liner techniques, formulation science,
 * lip trends by culture, multicultural lip care traditions.
 */

export const LIP_COLOUR_THEORY = {
  title: 'Lip Colour Theory: Undertone & Skin Tone',
  undertones: {
    warm: { description: 'Golden, peachy, yellow undertones in skin', lipColours: ['Warm nudes (caramel, terracotta, peach-brown)', 'Coral', 'Warm red (orange-based red like tomato red)', 'Brick red', 'Burnt sienna', 'Warm mauve (dusty rose)', 'Warm plum (burgundy)', 'Gold-based browns'], colours_to_avoid: ['Cool blue-based pinks — make warm undertones look sallow', 'Very cool blue-reds — clash with warmth', 'Lavender-based mauves — desaturate warm undertones'] },
    cool: { description: 'Pink, blue, purple undertones in skin', lipColours: ['Cool nudes (taupe, pink-beige, greige)', 'Pink (baby pink, hot pink, fuchsia)', 'Cool red (blue-based berry red)', 'Raspberry', 'Plum', 'Berry', 'Deep wine', 'Mauve', 'Lavender'], colours_to_avoid: ['Very orange corals — make cool skin look washed out or jaundiced', 'Peach nudes — create unnatural skin contrast', 'Yellow-based nudes — desaturate cool skin'] },
    neutral: { description: 'Balance of warm and cool; sometimes described as "olive" but olive can be warm or cool', lipColours: ['Most shades flattering', 'True red (balanced red with no strong warm or cool lean)', 'Rose (between pink and peach)', 'Berry', 'Plum', 'Neutral nude (beige, nude-pink)', 'Mauve'], note: 'Neutral skin tones have the most flexibility in lip colour choices' }
  },
  fitzpatrickGuidance: {
    I_II: { skin: 'Very fair, light; burns easily; typically cool or neutral undertone', nudes: 'Rose, peachy pink — true "nude" for fair skin; avoid peach-beige nudes that disappear against fair skin', bolds: 'Any bold works; berry and wine particularly striking; red is classic', tips: 'Very pale nudes (white-pink) can look washed out; add a touch of pink to nudes intended for this skin type' },
    III: { skin: 'Light-medium; can be warm or cool; sometimes olive', nudes: 'Warm nude (caramel-rose), true nude (neutral beige), dusty mauve', bolds: 'Red (warm-toned red for warm undertone; cool red for cool undertone), wine, berry, deep rose', tips: 'Olive skin (III) looks particularly stunning with warm coral, terracotta, warm bronze-red' },
    IV: { skin: 'Medium-tan; olive, warm, or neutral; diverse', nudes: 'Medium nude (caramel, warm beige), cocoa nude, warm mauve', bolds: 'Deep red, brick red, coral, warm plum, burnt orange, terracotta', tips: 'Lighter nudes (light beige) create stark contrast; medium-depth nudes with warm undertone suit best; warm coral or brick red are especially flattering' },
    V: { skin: 'Medium-dark; warm, neutral, or cool undertone depending on heritage', nudes: 'Deep nude (toffee, caramel-brown, warm brown), chocolate nude, coffee', bolds: 'Deep berry, deep plum, dark wine, burgundy, chocolate-red, dark coral, warm dark red', tips: 'For Fitzpatrick V: avoid very pale nudes — they create an unnatural ashy appearance; warm deep nudes are flattering; deep bolds are stunning; a shade close to the natural lip colour can work as a "nude"' },
    VI: { skin: 'Very deep; highest melanin concentration; warm, neutral, or cool undertone', nudes: 'The deepest warm browns, tawny nudes, chocolate, warm mahogany', bolds: 'Rich plum, deep berry, darkest wine, dark burgundy, deep terracotta, dark chocolate red, deep coral', tips: 'Cool-toned shades (light pink, lavender, icy nude) can look ashy on very deep skin; warm and deeply pigmented shades are the most flattering; MAC has historically served this skin tone well (with deep tones like Diva, Dark Side, Cyber); Fenty Beauty, UOMA Beauty, and other Black-founded brands offer deep nudes' }
  }
};

export const LIP_FORMULATIONS = {
  title: 'Lip Product Formulations: Ingredients & Performance',
  bulletLipstick: {
    description: 'The classic lipstick: wax + oil + pigment in solid stick form',
    waxes: ['Carnauba wax (from Brazilian palm Copernicia prunifera): one of the hardest natural waxes; provides firmness and structure', 'Candelilla wax (from Euphorbia antisyphilitica shrub, Mexico): vegan alternative to beeswax; firmer than beeswax', 'Beeswax: traditional; gives smooth texture; some people sensitive or prefer vegan alternatives', 'Ozokerite/ceresin: mineral-based waxes; provide structure'],
    oils: ['Castor oil: main oil in most traditional lipsticks; gives colour vibrancy and gloss; highly viscous', 'Jojoba oil: emollient; anti-inflammatory', 'Vitamin E (tocopherol): antioxidant; skin conditioning', 'Lanolin: from sheep wool; extremely moisturising; some people sensitive'],
    finishes: { matte: 'More wax, less oil; can be drying for some', satin: 'Balanced; comfortable; some shine', cream: 'Hydrating; moderate shine', sheer: 'Less pigment; more transparent; often glossy', metallic: 'Contains metallic particles (mica, aluminium) for mirror-like finish' }
  },
  liquidLipstick: {
    description: 'Liquid formula applied wet, dries to a matte finish; film-forming polymers create a transfer-resistant layer',
    types: {
      transfer_resistant: 'Film-forming polymers (like PVP, acrylates) create a network on the lip surface that resists transfer when dry; very long-wearing; can be drying',
      liquid_velvet: 'More comfortable than original liquid lip formulas; added oils/conditioners while maintaining matte finish',
      vinyl: 'Gives ultra-glossy wet look finish while being long-lasting; newer technology'
    },
    removal: 'Liquid matte lipsticks are much harder to remove than traditional bullet lipstick; use oil-based makeup remover or micellar oil; do not rub — oil breaks down the film-forming polymers'
  },
  lipGloss: {
    description: 'High oil/polymer formula; non-drying; shiny; less pigmented; short-lasting',
    ingredients: 'Primarily polybutene (gives thick, sticky texture) or polyisobutene + castor oil; may contain pigments or be clear; plumping glosses add capsaicin or menthol for a temporary swelling sensation',
    trend: 'Glass lips (K-beauty) and wet lips have revived gloss popularity; layering over liner without filling lip (your natural lip shows through) is a popular styling technique'
  },
  lipOil: {
    description: 'Oil-based lip product; very hydrating; non-drying; light pigment; comfortable wear',
    popularIngredients: 'Jojoba oil, castor oil, squalane, vitamin E, argan oil, plum kernel oil',
    trend: 'Lip oil emerged as a major lip product category 2022-2023; Dior Lip Glow Oil and Charlotte Tilbury Lip Lustre among early prestige players; Essence and e.l.f. among affordable versions; became accessible across price points'
  },
  tintedLipBalm: {
    description: 'Balm base (waxes + butters) with sheer colour; primary function is hydration, colour is secondary',
    ingredients: 'Shea butter, cocoa butter, lanolin, beeswax, petrolatum; tinted with low-level pigment; sun-protecting versions add mineral SPF'
  }
};

export const LIP_LINER_TECHNIQUES = {
  title: 'Lip Liner: Techniques from Basic to Advanced',
  purpose: ['Defines and shapes the lip; prevents lipstick feathering (bleeding) into lip lines', 'Can correct lip asymmetry by slightly overdriving or underdriving the natural line', 'Creates the illusion of fuller or more defined lips', 'Primer for lipstick — lined and filled lips hold colour longer', 'The "90s lip" overline was considered incorrect until it became intentional technique'],
  basic: {
    howToChoose: 'Match liner to lipstick shade, or choose a shade one step darker than your lipstick; nude liner under most lipsticks is a universal approach',
    technique: ['Start from the cupid\'s bow (the two peaks of the upper lip); draw a V shape into the natural bow peaks', 'Draw from the Cupid\'s bow outward toward the corners', 'Do the lower lip from the center out to the corners', 'Blend slightly inward so no harsh line is visible around the edges', 'Fill the entire lip with liner before applying lipstick for maximum longevity']
  },
  overline: {
    description: 'Drawing the liner slightly outside the natural lip line to create the illusion of fuller lips',
    howTo: ['Apply only in the center of the lip (Cupid\'s bow top, center of bottom lip) — overlining the corners makes the shape look unnatural and clownish', 'Blend carefully so the line reads as lip skin, not a drawn edge', 'Only effective with careful blending; obvious liner lines look dated', 'Foundation/concealer patted on the actual lip border before lining makes the overline more convincing (hides the true lip edge)'],
    history: 'Kylie Jenner credit for mainstream resurgence of overlined lips in the 2010s; the technique is actually decades old — classic Hollywood glamour featured overlined lips; Madonna famously overlined in the 1980s'
  },
  ombre: {
    description: 'Two or more lip shades applied to create a gradient effect',
    technique: ['Apply darker shade to the outer edges of both lips', 'Apply lighter shade to center of lips', 'Blend where the two shades meet with a finger or small brush', 'For a warm ombre: dark wine at the edges fading to lighter rose at the center', 'For K-beauty gradient lip (gradient lips): pale skin-like shade on the outer lip with deep or bright shade concentrated at the center — creates a blurred, diffused, soft-focus lip look']
  },
  ethnic_ombre: {
    description: 'Ombre technique that celebrates the natural variation in lip pigmentation',
    note: 'Many people of colour (particularly Black American, South Asian, East African) have natural two-tone lip colouring — darker at the outer edges, lighter at center. Rather than trying to even out this variation, ombre techniques can celebrate and enhance it'
  }
};

export const LIP_COLOUR_BY_CULTURE = {
  'west-african': {
    aesthetic: 'Vibrant, expressive colour; full-coverage pigment; bold shades are celebrated and culturally significant; lip looks that can be seen from a distance are valued for events',
    iconicShades: ['Bright coral orange on dark skin', 'Deep berry and wine', 'Bold red', 'Bright fuchsia', 'African-print-inspired orange-red', 'Bold purple-plum'],
    tradition: 'Lip staining with natural plant materials traditionally in some communities; Tuareg women use indigo plant-derived lip colour in some traditions',
    modern: 'Lagos beauty culture is very trend-forward; Nigerian content creators share bold lip looks on dark skin tones; YouTube and Instagram have been platforms for West African beauty expression',
    productRecs: 'MAC Cosmetics Diva (deep berry-red) became iconic in the Black/West African beauty community; Fenty Beauty Uncuffed, Uninvited, Plum Dragon across the range for deep skin'
  },
  'south-asian': {
    aesthetic: 'Rich, saturated colours for occasions; Bollywood heavily influences South Asian lip colour norms; a traditional bridal lip is always rich — dark red, berry, or deep rose; everyday: subtle and polished',
    iconicShades: ['Classic bridal red (Bollywood red)', 'Deep berry (the kajal + berry lip is a signature South Asian look)', 'Dark wine', 'Coral-red for everyday', 'Nude-pink for modern minimalist look', 'Bold fuchsia (very Bollywood)'],
    tradition: 'Lac/lak (shellac-based) lip colour used in traditional South Asian cosmetics; kajal around the eyes with a deep lip is the classic Bollywood formula',
    
  },
  caribbean: {
    aesthetic: 'For events and carnival: no holds barred — bold, bright, dramatic; for daily: often a natural glossy look; the Caribbean beauty vibe values a luminous, not-trying-too-hard base with occasional bold moments',
    iconicShades: ['Rihanna coral nude (her signature)', 'Bold fuchsia for events', 'Clear gloss over stained natural lip', 'Deep red', 'Warm brown-nude'],
    tradition: 'Natural berry and flower lip stains used traditionally on some islands; hibiscus (sorrel) juice as a natural lip colour; beetroot lip stain',
    modern: 'Fenty Beauty (Rihanna\'s brand, Caribbean-rooted) was a revolution in inclusive lip colour; the Pro Filt\'r Soft Matte lip launched shades specifically for skin tones that had been underserved'
  },
  arab: {
    aesthetic: 'Dramatic, defined, and perfectly filled in; Arab lip looks are precise and executed; for weddings and Eid, the lip is a centrepiece alongside dramatic eye makeup; classic Arab lip: full, saturated, immaculate edges; sometimes paired with thick kohl eye which then demands a bolder lip to balance',
    iconicShades: ['Classic deep red', 'Rich wine', 'Berry plum', 'Deep rose', 'Nude-ombre (gradient effect from darker edge to nude center very popular in Gulf)', 'Copper-bronze on darker Arab skin'],
    tradition: 'Kohl application to the lips was practised historically in some Arab communities; henna was used to stain lips as well as hands in North African traditions',
    modern: 'Gulf beauty influencers have enormous global reach; Arab lip makeup tutorials on YouTube and TikTok have millions of followers; brands like Huda Beauty (Huda Kattan, Iraqi-American) have been transformative in lip colour for Middle Eastern-inflected skin tones'
  },
  latina: {
    aesthetic: 'Bold and sensual; the lip is always done in Latina beauty culture; classic associations: red lips, well-defined lip liner; Jennifer Lopez\'s nude-beige lip with dark liner became a iconic 1990s look; modern Latina beauty includes the full spectrum from deep berry to bright coral',
    iconicShades: ['Classic red (The definitive Latina celebrity lip)', 'Deep berry', 'Orange-red for morena (darker) skin', 'J.Lo nude beige (1990s-era nude lip + darker liner)', 'Bright coral', 'Deep wine for invierno (winter)'],
    tradition: 'Beetroot (betabel/beterraga) lip stain used naturally; hibiscus flowers used to stain lips; Aztec use of cochineal (insect-derived carmine) for lip and textile colour — carmine is still used in modern lipsticks',
    modern: 'MAC\'s nude lip shades for Latin skin have a dedicated following; NYX Butter Glosses are a Latina community favourite for accessible colour; Selena Quintanilla\'s bold lip legacy is referenced in Selena × MAC collaborations'
  },
  'east-asian': {
    aesthetic: 'The K-beauty gradient lip (ombre center look) has been globally influential; J-beauty prefers a very natural, tinted lip; C-beauty (Chinese beauty) embraces both subtle and bold; modern Korean lip aesthetic: either the youthful gradient lip or a deep saturated monochrome lip; Japanese beauty often uses very sheer balm-tints for a "just bitten" natural look',
    iconicShades: ['K-beauty gradient: coral or red concentrated at center fading to bare at edges', 'Deep velvet red (Korean monochrome lip)', 'Sheer rose for J-beauty', 'Brick red for Chinese beauty', 'Warm rosewood for natural looks'],
    tradition: 'Chinese ancient beauty (Tang dynasty women) painted their lips in very specific bow shapes with specific red pigments; Japanese maiko/geisha lip style: red with white and a very specific partially filled shape to suggest youth; Korean traditional makeup: very full deep red lip',
    modern: 'Korean cosmetics companies (3CE, MAC Korea, Romand, Etude House, Peripera) have developed outstanding lip colour ranges; Korean blur lip (blotted look, almost stained) is a globally copied technique',
    glasslip_trend: '2023-2024: glass lip (highly glossy, transparent) trending globally via K-beauty; achieved with lip gloss over bare or lightly stained lips'
  },
  'east-african': {
    aesthetic: 'Strong, defined lips suit East African bone structure beautifully; the high cheekbones and defined features carry a bold lip with elegance; Ethiopian and Kenyan models have been front-facing for international brands — bold, editorial lip looks',
    iconicShades: ['Bold red on very deep skin', 'Plum', 'Berry', 'Coral orange on Fitzpatrick V-VI', 'Deep wine', 'Warm chocolate-brown nude'],
    tradition: 'Natural lip pigments from plant materials; butter-based traditional lip care (in some Ethiopian communities, butter applied to lips in dry season)',
    modern: 'East African supermodels (Iman, Liya Kebede, Waris Dirie) made bold statement lips with deep skin an internationally recognised and celebrated beauty look; editorial precedent that has influenced generations of beauty campaigns'
  },
  'south-african': {
    aesthetic: 'Reflects the diversity of South African communities; Black South African beauty for events: bold reds, deep berries; Cape Malay tradition: elegant; Indian South African beauty for weddings: rich and saturated like South Asian tradition; Zulu and Xhosa beauty for ceremonies: defined, bold',
    iconicShades: ['Bonang Matheba signature red', 'Deep berry for events', 'Warm coral for day', 'Nude-brown for modern minimal'],
    tradition: 'Traditional Zulu and Xhosa ceremonial makeup used plant-derived pigments including red ochre for some lip and facial marking; African bark and root pigments historically used',
    modern: 'South African drugstores carry excellent lip colour range at accessible price points; South African beauty YouTube and Instagram community is rapidly growing'
  },
  'black-american': {
    aesthetic: 'The boldest, most unapologetic lip colour culture; Black American women have historically defined the boldest lip trends and validated them for global audiences; from the 1930s Harlem Renaissance, to 1970s soul music aesthetics, to 1990s hip-hop beauty, to modern mainstream — Black American lip looks are global culture',
    iconicShades: ['Satin brown-red (classic Black American beauty)', 'Brick and burnt sienna', 'Deep brown plum (90s lip reborn)', 'Bold metallic bronze on deep skin', 'Bright red', 'Deep berry', 'Cognac nude', 'Rich chocolate'],
    tradition: 'Red lip as a statement of power and pride; deep lipstick as resistance — Black women wearing bold makeup in contexts where it was inappropriate and claiming that space; MAC Viva Glam (launched in partnership with drag performer RuPaul, then k.d. lang, building on an older partnership) — benefiting AIDS research — became a cultural institution in Black queer beauty',
    modern: 'Iconic makeup moments: Beyoncé\'s consistently changing lip palette; Rihanna\'s lip-range-as-revolution via Fenty; Lizzo\'s bold maximalist lips as body positivity; makeup is explicitly political and expressive in Black American beauty culture',
    products: 'Mac Chestnut, Diva, Dark Side are culturally iconic; Fenty Beauty created the "nuance" range specifically for deep skin; UOMA Beauty (Sharon Chuter) designed their entire lip range around melanin-rich skin undertones'
  }
};

export const LIP_COLOUR_FOR_DARK_SKIN = {
  title: 'Lip Colour Formulation Tips for Fitzpatrick V-VI',
  pigmentLoad: 'Very deeply pigmented lip products are necessary — lighter shades require high pigment loads to show on deep skin. Sheer formulas that read as a blush pink on light skin often read as colourless on deep skin.',
  nudeLips: {
    challenge: 'The "nude" lip conventionally means a shade close to the wearer\'s lip colour that gives a natural appearance. For Fitzpatrick V-VI: most mainstream "nude" shades were historically formulated for light-medium skin, reading as light beige on dark skin — not nude at all',
    history: 'The lack of true nude shades for dark skin was a systemic industry failure for decades — one of the primary complaints that Black beauty consumers raised, along with foundation shade gaps',
    
    advice: 'A nude shade for Fitzpatrick V-VI should be: a shade very close to the natural lip tone (often a warm medium-brown or caramel), or the lip colour with a hint more saturation — not a beige or light-pink'
  },
  blueBasedShades: 'Blue-based pinks and lavenders can look grey or ashy on deeper skin tones — avoid cool blue-based shades unless that effect is intentional; warm undertone shades in all colour families typically flatter more',
  highlightTrick: 'Adding a spot of deep gold or warm bronze highlighter to the center of a deep nude or red lip creates dimension and luminosity — a technique particularly beloved in West African and Black American makeup communities'
};

export function getLipColourTheory(undertone) {
  if (!undertone) return LIP_COLOUR_THEORY;
  const map = {
    warm: LIP_COLOUR_THEORY.undertones.warm,
    cool: LIP_COLOUR_THEORY.undertones.cool,
    neutral: LIP_COLOUR_THEORY.undertones.neutral,
    fitzpatrick: LIP_COLOUR_THEORY.fitzpatrickGuidance
  };
  return map[undertone.toLowerCase()] || LIP_COLOUR_THEORY;
}

export function getLipFormulations(type) {
  if (!type) return LIP_FORMULATIONS;
  const map = {
    bullet: LIP_FORMULATIONS.bulletLipstick,
    liquid: LIP_FORMULATIONS.liquidLipstick,
    gloss: LIP_FORMULATIONS.lipGloss,
    oil: LIP_FORMULATIONS.lipOil,
    balm: LIP_FORMULATIONS.tintedLipBalm,
    tinted_balm: LIP_FORMULATIONS.tintedLipBalm
  };
  return map[type.toLowerCase()] || LIP_FORMULATIONS;
}

export function getLipLinerTechniques(technique) {
  if (!technique) return LIP_LINER_TECHNIQUES;
  const map = {
    basic: LIP_LINER_TECHNIQUES.basic,
    overline: LIP_LINER_TECHNIQUES.overline,
    ombre: LIP_LINER_TECHNIQUES.ombre,
    gradient: LIP_LINER_TECHNIQUES.ombre
  };
  return map[technique.toLowerCase()] || LIP_LINER_TECHNIQUES;
}

export function getLipColourByCulture(communityId) {
  const directMap = {
    'west-african': LIP_COLOUR_BY_CULTURE['west-african'],
    'south-asian': LIP_COLOUR_BY_CULTURE['south-asian'],
    caribbean: LIP_COLOUR_BY_CULTURE.caribbean,
    arab: LIP_COLOUR_BY_CULTURE.arab,
    latina: LIP_COLOUR_BY_CULTURE.latina,
    'east-asian': LIP_COLOUR_BY_CULTURE['east-asian'],
    'east-african': LIP_COLOUR_BY_CULTURE['east-african'],
    'south-african': LIP_COLOUR_BY_CULTURE['south-african'],
    'black-american': LIP_COLOUR_BY_CULTURE['black-american']
  };
  return directMap[communityId] || null;
}

