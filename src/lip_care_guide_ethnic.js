/**
 * MIRRR — Lip Care Guide (Skin-of-Colour Focus)
 * Lip anatomy, hyperpigmentation, lip products, multicultural care.
 */

export const LIP_ANATOMY = {
  title: 'Lip Anatomy and Physiology',
  structure: {
    vermilion: 'The vermilion (the coloured lip border) is a transitional zone between facial skin and oral mucosa; it lacks hair follicles, sebaceous glands, and sweat glands — this is why lips cannot moisturise themselves and are vulnerable to dryness',
    melanocytes: 'Lips contain melanocytes; the lip colour varies by individual melanin distribution; in people of colour, lips may be darker than facial skin due to higher lip melanin density; this is completely normal and represents natural variation — not hyperpigmentation requiring treatment unless it is a change from the individual\'s baseline',
    vermilionBorder: 'The vermilion border (Cupid\'s bow) is the distinct edge separating the lip from facial skin; definition of this border is a common cosmetic concern; lip liner is the primary tool for defining and optionally slightly overcorrecting the border',
    orbicularis: 'The orbicularis oris is the circular muscle surrounding the mouth; repeated facial expressions (pursing, speaking, kissing, smoking) contract this muscle and eventually create radial perioral lines ("lip lines"); these are some of the most visible early signs of ageing'
  },
  skinVsLipMucosa: {
    comparison: 'Lip skin is 3-5 cell layers thick (vs 15-16 layers for facial skin); the thin stratum corneum explains why lips show dehydration and damage more quickly; unlike facial skin, lips lack a functional sebum barrier; the blood vessels are close to the surface (explaining the natural pink/red colour of lighter-pigmented lips)',
    vulnerabilities: 'Because lips lack sebaceous glands: no natural oil to prevent moisture loss; TEWL (transepidermal water loss) is very high on lips; lips dehydrate much faster than facial skin; lips are also highly sun-exposed (particularly the lower lip which receives more direct UV — explaining why lower lip skin cancer rates are higher than upper lip)'
  }
};

export const LIP_HYPERPIGMENTATION = {
  title: 'Lip Hyperpigmentation in Skin of Colour',
  types: {
    physiological: {
      description: 'Natural lip darkening that is baseline for the individual; very common in Fitzpatrick IV-VI skin types; can appear at birth or develop during puberty (due to increased melanin activity triggered by hormones); the lip can be uniformly darker than facial skin or have darker patches interspersed with lighter areas (mottled pattern)',
      treatment: 'Physiological lip pigmentation does not require treatment and treating it may be a cosmetic choice rather than a medical necessity; many people of colour choose to embrace natural lip colour rather than lighten it; if lightening is desired, gentle approaches are safest'
    },
    hormonalMelasma: {
      description: 'Hormonal melasma can affect the upper lip area (creating a "moustache shadow" appearance); triggered by pregnancy, oral contraceptives, or hormone replacement therapy; this type of pigmentation is in the skin ABOVE the lip (the philtrum area and perioral skin) rather than on the lip vermilion itself',
      treatment: 'Sun protection is the most important intervention — without SPF, all treatments fail; topical azelaic acid (20%) is safe in pregnancy; post-pregnancy or after stopping hormonal contraception, melasma often lightens significantly; tranexamic acid (topical or oral) is increasingly used for perioral melasma'
    },
    postInflammatory: {
      description: 'PIH on lips from: chronic licking (saliva enzymes cause inflammation); lip biting; herpes labialis (cold sores) healing; allergic reactions to lip products; dental metal contact dermatitis; cheilitis (inflammatory lip conditions); each inflammatory episode leaves behind PIH',
      treatment: 'Treat the underlying inflammation first; then: vitamin C serums carefully applied to the lip border area; kojic acid lip treatments; niacinamide; protect from sun'
    },
    smoking: {
      description: 'Smoker\'s melanosis — nicotine and combustion products stimulate melanocyte activity specifically around the mouth; creates characteristic dark patchy pigmentation of the lips and perioral area; this is a direct and well-documented skin effect of smoking',
      reversibility: 'Smoker\'s melanosis partially to fully reverses upon smoking cessation (timeline: months to years); topical brighteners can help accelerate this; carbon monoxide also impairs circulation to lip skin (giving the dull, grey quality to long-term smoker lip skin)'
    },
    sunDamage: {
      description: 'Lower lip is particularly vulnerable to UV damage; UV exposure darkens lip pigmentation; chronic sun damage can cause actinic cheilitis (rough, scaly lower lip — a precancerous condition that looks like chronic chapping); any persistent rough, white, or unusual lower lip change should be evaluated by a dermatologist',
      prevention: 'SPF lip balm or clear/tinted SPF applied to lips; the lower lip is often neglected in sunscreen application; reapplication after eating and drinking is needed'
    }
  },
  treatments: {
    topical: {
      vitaminC: 'L-ascorbic acid applied carefully to lip border and vermilion; concentration should be lower than facial (5-10% vs 15-20%); stings if it enters the mouth; stable vitamin C derivatives (ascorbyl glucoside) are less irritating alternatives',
      kojicAcid: 'Kojic acid in lip balm formulations; inhibits tyrosinase (melanin-producing enzyme); can be irritating; start with low-frequency use',
      niacinamide: 'Niacinamide inhibits melanosome transfer; less irritating than vitamin C or kojic acid; available in lip serums; appropriate for daily use',
      licoricExtract: 'Licorice root extract (glabridin) is anti-inflammatory and tyrosinase-inhibiting; gentle enough for sensitive lip skin; often used in "brightening lip balm" formulations',
      bearberry: 'Bearberry extract (arbutin) is gentle melanin inhibitor; available in some lip serums and balms; good option for sensitive skin'
    },
    professional: {
      chemicalPeel: 'Superficial chemical peels (glycolic acid, mandelic acid, lactic acid) to the perioral area can brighten lip pigmentation; NOT applied directly on the vermilion mucosa; use only with experienced dermatologist familiar with darker skin types',
      laser: 'Intense pulsed light (IPL) and laser treatments for lip pigmentation in darker skin require significant caution; Q-switched Nd:YAG (1064nm) is the most appropriate for darker skin types; risk of worsening PIH with inappropriate laser settings; always confirm the provider has specific experience with skin of colour'
    }
  }
};

export const LIP_PRODUCTS_GUIDE = {
  title: 'Lip Products — Ingredients and Selection',
  balms: {
    humectants: 'Glycerin; hyaluronic acid; aloe vera — draw moisture from the air into the lip skin; essential for hydration',
    emollients: 'Shea butter; cocoa butter; jojoba oil; castor oil; lanolin (animal-derived; very effective occlusive for dry lips) — fill in the gaps between lip skin cells; make lips soft',
    occlusives: 'Petrolatum (Vaseline); beeswax; carnauba wax; candelilla wax (vegan beeswax alternative); mineral oil — seal moisture in and protect against environmental dryness',
    ingredients: {
      petrolatum: 'Petrolatum (Vaseline/Vaseline Healing Jelly) is one of the most effective lip occlusives; listed by the FDA as an OTC skin protectant ingredient; often avoided due to associations with petroleum industry, but it is one of the most evidence-backed dry-skin treatments; a thin layer at night significantly heals chapped lips',
      lanolin: 'Lanolin (wool wax) is among the most effective dry-lip treatments; mimics the skin\'s own lipids; can cause reactions in wool-sensitive individuals; highly effective especially for deeply chapped lips',
      beeswax: 'Beeswax is the classic lip balm structuring wax; provides a physical protective film; comedogenic concern is low (lips have no follicles); not vegan'
    }
  },
  concerns: {
    lickingCycle: 'The "licking cycle" is a major cause of chronic chapped lips; saliva contains digestive enzymes (amylase, lipase) that degrade the thin lip surface; the temporary moisture from licking evaporates and takes more moisture with it (evaporative cooling effect); every time the lips feel dry and a person licks them, it worsens the underlying dryness; the habit of licking drives the inflammation-PIH cycle in darker skin',
    menthol: 'Menthol and peppermint in lip products create a cooling sensation that feels pleasant but can be irritating with frequent use; if a lip balm makes lips tingle and feel better but then drier shortly after, this is likely the mechanism — the tingling causes increased licking; better to switch to a fragrance-free, menthol-free formulation'
  },
  lipColour: {
    lipstick: {
      ingredients: 'Lipstick = wax (structure) + oils (emolliency) + pigments (colour) + emollients; traditional lipstick pigments include iron oxides, carmine (cochineal — insect-derived; not vegan), ultramarines, titanium dioxide; "lip-safe" FD&C dyes for transparent glosses',
      drying: 'Matte lipsticks are more drying than satin/cream finishes due to lower oil content and the high pigment load; long-wearing liquid lipsticks are often the most drying; using a lip balm base under matte formulas helps significantly'
    },
    lipliner: {
      use: 'Lip liner defines the vermilion border; prevents lipstick from bleeding; can slightly overcorrect the lip shape; used as a base layer, liner filled in across the whole lip makes lipstick last significantly longer',
      matching: 'Matching to own lip tone (nude liner) vs matching to the lip colour chosen; in skin of colour, finding a true nude liner that matches natural lip colour (which may be deep brown, burgundy, or dark purple-toned) has historically been difficult; brands now offer significantly more diverse nude ranges'
    },
    gloss: 'Lip gloss: high shine from polybutene (main ingredient in glosses), castor oil, or similar viscous ingredients; magnifies plumpness; the highest-shine glosses are often stickiest (polybutene); may transfer and feel less comfortable but are the most visually impactful for the "glass lip" trend'
  }
};

export const ETHNIC_LIP_GUIDES = {
  'west-african': {
    products: 'Deep-pigmented lips are beautifully showcased with: terracotta and warm brown lip shades; muted mauve tones; coral-tinted glosses; bright orange-reds (warm-toned red lipstick is stunning against deep pigmented lips); classic black or dark plum for evening looks',
    concerns: 'Most common concern: further darkening from chronic dehydration and licking; the solution is a consistent hydration routine: lip mask at night (overnight with Vaseline or a thick lip treatment); hydrating lip balm throughout the day; breaking the licking habit'
  },
  'south-asian': {
    threading: 'Threading the upper lip (removing fine lip-area hairs) is a common practice; repeated threading can cause micro-trauma-induced PIH in the perioral area over time; applying a calming serum (niacinamide, centella asiatica) post-threading and using SPF diligently on the treated area minimises post-threading PIH',
    traditional: 'Henna (mehndi) application to lips is a traditional practice in some South Asian contexts (particularly for bridal beauty rituals); henna provides temporary staining with no toxic risk (pure henna — never "black henna" which contains PPD); traditional kumkum (vermilion powder) used on the lips in specific Hindu ritual contexts'
  },
  caribbean: {
    trends: 'Caribbean makeup aesthetics often feature: bold warm reds and fuchsias; coral and orange shades; glossy "juicy" lip looks; the influence of dancehall culture on makeup (bold, expressive, high contrast); the "island beauty" aesthetic uses bright coral and melon lip shades',
    sunProtection: 'Caribbean climate means high UV exposure year-round; SPF lip balm is important but often skipped; actinic cheilitis risk is real for those with significant sun exposure without lip protection; prioritise SPF in any lip care routine for Caribbean climates'
  },
  arab: {
    oud: 'Traditional Arab lip stains use natural plant pigments; pomegranate juice (provides temporary red stain); henna for lip staining; carmine-based traditional lip colour; in traditional Gulf Cooperation Council (GCC) beauty, bold deep burgundy and dark red lips are associated with elegance and opulence',
    halal: 'Halal cosmetics certification is important for Muslim consumers: must be free from alcohol (many lipsticks use denatured alcohol as solvent), pork-derived ingredients (pork gelatin is used in some glosses), and carmine (cochineal — insect-derived colouring); the halal beauty market has grown significantly; brands like Inglot and several Korean brands are well-known for halal certification'
  },
  latina: {
    bold: 'Bold lip is central to many Latina makeup traditions: telenovela-style deep reds; bright corals and fuchsias; the "Mexican holiday lip" with strong red lipstick as a cultural statement; Selena Gomez\'s Rare Beauty and Sofia Vergara\'s TotalBeauty reflect Latina celebrity influence on lip colour trends',
    overline: 'Overlining lips slightly (above the natural vermilion border) is a technique popularised in part through Mexican-American makeup artists and Chicana beauty culture; when done subtly, the goal is a "full lip" effect rather than an obviously artificial look; key: the overline should follow the natural lip shape rather than dramatically changing it'
  },
  'east-asian': {
    gradient: {
      korean: '"Gradient lip" or "ombre lip" is a signature K-beauty look; involves applying lip colour heavily to the inner portion (centre) and barely on the outer edges, then blending; creates a "just-bitten" or "I just ate berries" look; suggests natural flush rather than traditional applied lipstick; the look is youthful and has become globally influential',
      products: 'Korean lip tints are the primary product for this look: water-based formulas that stain the lip very buildably; famous products: Romand Zero Velvet Tints; Peripera Ink Mood Drop Tints; BBIA Last Velvet Lip Tints; 3CE styles; these are lighter and more buildable than Western-formula lipsticks'
    },
    jbeauty: 'Japanese lip beauty prioritises: moisturised, plump-looking lips; sheer tints over opaque colour; lip masks and treatments (Laneige Lip Sleeping Mask is a K-beauty product but is culturally resonant across East Asia); the "no-makeup makeup" aesthetic often includes sheerly tinted, very moisturised lips rather than strong colour'
  },
  'east-african': {
    frankincense: 'Frankincense (Boswellia sacra and related species) has traditional use in Ethiopian and Somali beauty including lip care; frankincense resin has anti-inflammatory and healing properties; traditional incense fumigation (East African ritual of standing over burning incense, including for skin and hair care) reaches the perioral area',
    traditional: 'Traditional Ethiopian bridal beauty involves lip colouring using natural pigments; gold jewellery adorning the lip area (nostril-to-lip traditional piercings in some communities); deep ochre and terracotta tones for traditional occasions vs bold fashion-forward looks for contemporary aesthetic'
  },
  'south-african': {
    rooibosLip: 'Rooibos extract in lip care formulations is a uniquely South African beauty ingredient; anti-inflammatory for chapped or sensitised lips; small South African brands (Africology, Skin Creamery) use rooibos in lip treatments; rooibos provides antioxidant protection against UV-induced lip ageing',
    dry: 'South Africa\'s dry Highveld climate (Johannesburg, Pretoria) is particularly challenging for lip moisture; the combination of altitude, low humidity, and strong UV requires the most protective lip care; the Western Cape\'s Mediterranean climate is more lip-friendly but still has high UV intensity'
  },
  'black-american': {
    trends: {
      brownLip: 'Brown nude lip is a signature Black American beauty aesthetic element — the 90s-era matte brown lip (made famous by TLC and Brandy era) has had multiple high-fashion revivals; this is a look that only works beautifully on deeper skin tones, making it a distinctly Black beauty aesthetic',
      glossy: '"Lip gloss culture" in Black American beauty communities: the thick, high-shine lip gloss associated with Southern hip-hop and R&B aesthetics (Lil Wayne "Lollipop" era); glossy lips remain a key element of many Black American makeup aesthetics',
      bold: 'Bold lip shades that complement deep skin tones: warm orange-red; deep burgundy; dark purple; black lip (high fashion; avant-garde); metallics (gold, copper, bronze complement deep skin beautifully)',
      brands: 'Black-founded lip brands: Fenty Beauty (Rihanna) launched with an unprecedented 40 shades and has become the benchmark for inclusive lip shade ranges; Pat McGrath Labs; Uoma Beauty; Danessa Myricks Beauty; Beauty Bakerie — all prioritise deep skin shade ranges and warm undertones that complement Black skin'
    }
  }
};

export function getLipAnatomy(section) {
  const map = {
    anatomy: LIP_ANATOMY,
    hyperpigmentation: LIP_HYPERPIGMENTATION,
    products: LIP_PRODUCTS_GUIDE
  };
  return map[section] || null;
}

export function getEthnicLipGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_LIP_GUIDES['west-african'],
    'south-asian': ETHNIC_LIP_GUIDES['south-asian'],
    caribbean: ETHNIC_LIP_GUIDES.caribbean,
    arab: ETHNIC_LIP_GUIDES.arab,
    latina: ETHNIC_LIP_GUIDES.latina,
    'east-asian': ETHNIC_LIP_GUIDES['east-asian'],
    'east-african': ETHNIC_LIP_GUIDES['east-african'],
    'south-african': ETHNIC_LIP_GUIDES['south-african'],
    'black-american': ETHNIC_LIP_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

