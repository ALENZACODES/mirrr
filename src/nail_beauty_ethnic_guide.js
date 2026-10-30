/**
 * MIRRR — Nail Beauty Ethnic Guide
 * Nail anatomy, nail care, cultural nail traditions, nail art by community
 * Topics: nail biology, nail health, cultural nail art traditions, nail care protocols, 9 communities
 */

// ============================================================
// NAIL BIOLOGY & ANATOMY
// ============================================================

export const NAIL_BIOLOGY = {
  overview: `The nail unit consists of four specialized epithelial structures: the nail matrix (growth
  center), nail plate (the visible nail), nail bed (skin beneath the nail), and nail folds
  (skin around the nail). Nail health directly reflects internal health — nutritional deficiencies,
  thyroid disorders, circulation problems, and systemic disease often manifest in nails first.`,

  anatomy: {
    nailMatrix: {
      location: 'Hidden beneath the proximal nail fold (skin above nail at base)',
      function: 'Generates nail plate cells (onychocytes); damage here = permanent nail deformity',
      lunula: 'Lunula (half-moon at nail base): visible portion of matrix; whitish color due to cells not yet fully keratinized'
    },
    nailPlate: {
      composition: '100% dead keratin cells; 3 layers (dorsal, intermediate, ventral)',
      thickness: '0.3-0.65mm; thicker nails may indicate health; thin/brittle may indicate deficiency',
      growth: 'Fingernails: 3-4mm per month; toenails: 1.5mm per month; complete regrowth 4-6 months (fingernail) / 12-18 months (toenail)',
      color: 'Natural: pink from underlying nail bed vasculature; blue = cyanosis; yellow = fungal/psoriasis; white = Terry\'s nails (liver disease)'
    },
    cuticle: {
      function: 'Seals gap between nail plate and nail fold; prevents bacteria/fungus entry',
      care: 'Never cut cuticle aggressively; push back gently; cuticle removal creates path for infection',
      oil: 'Cuticle oil (jojoba, vitamin E, sweet almond): hydrates surrounding skin; prevents hangnails; does not penetrate nail plate'
    },
    nailBed: {
      location: 'Skin beneath nail plate; rich vasculature gives nails their pink color',
      health: 'Nail bed examination: physicians examine for systemic disease signs'
    }
  },

  nailHealth: {
    brittleNails: {
      causes: ['Low biotin', 'Low iron', 'Thyroid disorder', 'Repeated water exposure', 'Acetone nail polish remover', 'Age-related nail plate thinning'],
      treatment: ['Biotin 2.5mg daily: most evidence for brittle nails (but won\'t help if not deficient)', 'Wear gloves for dishes/cleaning', 'Use acetone-free remover', 'Nail hardener with protein (keratin)'],
      note: 'Biotin only helps nail brittleness if deficiency is the cause; check levels before supplementing'
    },
    fungalInfection: {
      clinical: 'Onychomycosis: nail thickening, discoloration (yellow/brown), crumbling; caused by Trichophyton species mostly',
      
      risk: 'Shared shower/pool without footwear; tight shoes; nail trauma; poor circulation; diabetes',
      treatment: 'Topical (efinaconazole, tavaborole): 6-12 months; for mild-moderate; oral terbinafine: more effective; 12 weeks; liver monitoring needed',
      prevention: 'Dry feet thoroughly after bathing; breathable socks; flip flops in communal showers'
    },
    nailSeparation: {
      clinical: 'Onycholysis: nail plate separating from nail bed; gap fills with debris; common with psoriasis, hyperthyroidism, infection',
      management: 'Keep nails short; avoid water entering gap; see dermatologist if persistent'
    },
    ingrownToenails: {
      cause: 'Nail edge grows into surrounding skin; improper cutting (rounded sides instead of straight), tight shoes, nail trauma',
      prevention: 'Cut toenails straight across; don\'t cut corners curved; proper footwear width',
      treatment: 'Warm soaks; lift nail edge; severe or infected cases: partial nail avulsion by podiatrist'
    }
  },

  nutritionalNails: {
    biotin: {
      role: 'Vitamin B7; required for keratin infrastructure; supports nail plate thickness',
      foods: 'Eggs (especially yolk), nuts, seeds, sweet potato, salmon',
      supplement: '2.5mg daily; 6 months before significant improvement; only helps if deficiency present'
    },
    iron: {
      role: 'Iron deficiency → koilonychia (spoon-shaped nails); thin nails; ridging',
      foods: 'Red meat, legumes, dark leafy greens, fortified cereals',
      note: 'Vegetarian/vegan diets: higher iron deficiency risk; plant iron (non-heme) less bioavailable than animal iron'
    },
    zinc: {
      role: 'Zinc deficiency → white spots (leukonychia), brittle nails, slow growth',
      foods: 'Oysters, beef, pumpkin seeds, chickpeas, cashews'
    },
    protein: {
      role: 'Nails are 100% keratin (protein); insufficient dietary protein = soft, thin, slow-growing nails',
      needs: '0.8g/kg body weight minimum; athletes and vegans often below adequate levels'
    },
    silica: {
      role: 'Strengthens keratin matrix; improves nail hardness',
      foods: 'Oats, bananas, dark leafy greens, bamboo extract supplement'
    }
  }
};

// ============================================================
// NAIL CARE PROTOCOLS
// ============================================================

export const NAIL_CARE_PROTOCOLS = {
  overview: 'Nail care ranges from simple maintenance (filing, moisturizing) to professional services (gel, acrylic, dip powder)',

  basicCare: {
    filing: {
      shape: ['Square (straight across, 90° corners): strong; less breakage', 'Squoval (square with slightly rounded corners): most popular; balanced', 'Oval (follows natural nail curve): softer; elegant', 'Almond (narrow sides, pointed tip): fragile; fashion-forward', 'Coffin/Ballerina (long, flat tip): requires extensions to achieve typically'],
      technique: 'File in one direction only (not sawing back and forth); coarse grit (150-180) for shaping; fine grit (240+) for smoothing',
      never: 'Never file wet nails: wet nails are most fragile; file after drying from shower/bath'
    },
    moisturizing: {
      daily: 'Cuticle oil (jojoba, sweet almond, vitamin E) applied daily to cuticle area; prevents dryness, hangnails',
      hand: 'Hand cream rich in shea butter, glycerin, or urea; applied after washing',
      gloves: 'Wear gloves for dishes, cleaning, gardening; water + chemicals are biggest nail destroyers'
    },
    polishRemoval: {
      acetone: 'Acetone: fast, effective, but drying; use sparingly; always follow with hydrating cuticle oil',
      acetone_free: 'Acetone-free: ethyl acetate or isopropyl alcohol base; gentler; takes longer',
      gel: 'Gel removal: soak cotton in acetone; aluminum foil wrap; 10-15 minutes; gel slides off; never peel or pry'
    }
  },

  professionalServices: {
    regular: 'Regular polish manicure: nail polish; 3-5 days wear; easy removal',
    gel: {
      description: 'UV/LED-cured gel polish; 2-3 weeks wear; harder removal (acetone soak)',
      pros: 'Long-lasting; chip-resistant; glossy',
      cons: 'UV exposure during curing; acetone removal is drying; repeated use thins nails over time if removed incorrectly'
    },
    dip: {
      description: 'Dip powder: acrylic powder applied over adhesive base; no UV curing',
      pros: 'Thicker, harder than gel; 3-4 weeks wear; no UV curing light',
      cons: 'Communal powder dipping (hygienic concern in some salons); harder removal'
    },
    acrylic: {
      description: 'Liquid + powder monomer polymer combination; creates hard extension overlay',
      pros: 'Strong; can add length; 3-4 weeks with fill',
      cons: 'Contains MMA (methyl methacrylate) in some formulations — banned by many health boards; strong chemical smell; intensive removal'
    },
    SNS: 'Signature Nail Systems (SNS) dip: specific brand; fortifying dip with base layer',
    BIAB: 'Builder in a Bottle: gel used for overlay strengthening natural nail; less extension, more protection'
  },

  nailSalons: {
    hygiene: {
      sterilization: 'Look for autoclave sterilization of metal tools; disposable nail files; liner in foot bath',
      red_flags: 'Metal tools stored in blue liquid: Barbicide is effective but many salons skip full soak time; ask about sterilization process',
      personal: 'Bring own metal tools; single-use file; reduces infection risk'
    },
    exploitation: {
      issue: 'Vietnamese American women dominate US nail salon industry; documented wage theft, chemical exposure, and labor exploitation concerns',
      context: 'Industry shaped by Vietnamese immigration post-1975; Tippi Hedren connection; built a community',
      support: 'Support worker-owned nail salons or salons with transparent labor practices'
    }
  }
};

// ============================================================
// NAIL ART CULTURAL TRADITIONS
// ============================================================

export const NAIL_ART_CULTURAL_TRADITIONS = {
  overview: 'Nail ornamentation is among humanity\'s oldest beauty practices — henna nails, jade nail guards, gold leaf nails all predate modern polish',

  historical: {
    china: 'Chinese Tang Dynasty: nail color indicated social rank; only royal family could wear certain colors; gold and silver nails for nobility',
    egypt: 'Henna on nails: Egyptian tradition; Cleopatra reportedly used henna on nails; color reflected status',
    india: 'Mehndi (henna) on nails: ancient practice; nail art component of wedding preparations',
    victorian: 'Victorian nail care: buffing to a sheen; no color (considered improper); pink paste applied then buffed',
    '1920s': '1920s: nail polish invention by Charles Revson (Revlon); tied to auto industry lacquer technology'
  },

  modern: {
    japaneseGelNails: 'Japan leads global nail art innovation; intricate gel art; 3D elements; character nails; nail technician as artist',
    koreanNails: 'Korean nails: clean, elegant; gradient (ombre) nail; subtle nail art; glass nail (ultra-glossy)',
    nailArtistry: '2010s Instagram nail art era: global nail artists; elaborate designs; nail as canvas',
    culturalExpressions: 'Nail art as cultural expression: cowrie shells embedded in acrylic for West African diaspora; geometric henna-inspired designs; flag nails for diaspora pride'
  }
};

// ============================================================
// 9 COMMUNITY NAIL GUIDES
// ============================================================

export const ETHNIC_NAIL_GUIDES = {
  'west-african': {
    communityName: 'West African',

    traditions: {
      henna: 'Henna on nails and fingertips: West African bridal and festive tradition; natural reddish-brown color',
      cultural: 'Long elaborate nails as beauty statement in many West African beauty aesthetics; acrylic art embraced'
    },

    nailCare: {
      cuticle: 'Shea butter applied to cuticles: ancestrally appropriate and scientifically excellent cuticle care',
      color: 'Deep, bold nail colors read beautifully against deep West African skin tones: navy, burgundy, forest green, burnt orange',
      art: 'African print nail art; kente cloth patterns; cowrie shell nail accents; Adinkra symbol nails'
    },

    nailPolishShades: {
      classic: 'Deep red, burgundy, navy — all stunning on deep brown skin',
      nude: 'Nude for dark skin: look for brown-nude, caramel, terracotta — not pale pink which looks ashy',
      bold: 'Bright orange, cobalt blue, vivid green: vibrant and celebratory on deep skin',
      avoid: 'Very pale pinks, light lavenders — disappear against deep skin; look disconnected'
    },

    advice: `West African nail aesthetics celebrate boldness and length. Long, embellished acrylic nails
    are a significant fashion statement in many West African communities — and the craftsmanship
    (3D elements, embedded gems, fabric prints) is art. For nail health: shea butter or castor oil
    massaged into the cuticle area daily is the ancestral and most effective cuticle care available.
    For nail polish: nude doesn't mean pale pink for deep skin — it means a shade close to your actual
    skin tone (brown-caramel range). Bold, deep colors are the Western African nail signature:
    burgundy, jewel tones, vivid brights. Henna on nails for celebrations is a beautiful cultural
    practice that is also gentler than synthetic polish.`
  },

  'south-asian': {
    communityName: 'South Asian',

    traditions: {
      mehndi: 'Mehndi (henna) traditionally extends to fingertips; nails stained brown-red from henna application',
      bridal: 'South Asian bridal nails: full mehndi coverage to fingertips; additional gold nail art; sometimes light nail polish under/over mehndi',
      alta: 'Alta (red lac dye): Bengali and Oriya tradition; natural red dye applied to feet and toes for weddings and festivals; older than modern nail polish'
    },

    nailCare: {
      almond: 'Sweet almond oil for cuticle care: South Asian traditional oil; mild; nourishing for cuticles',
      shape: 'Almond and oval shapes are traditional South Asian nail preferences for formal occasions',
      color: 'Classic Indian bridal: deep red nail polish; maroon; gold; matches bangles and sari'
    },

    nailPolishShades: {
      classic: 'Deep red, burgundy, maroon: the classic South Asian festive nail colors',
      indo_western: 'Rose gold, coral, terracotta: contemporary Indo-Western aesthetics',
      nude: 'For warm South Asian skin: peachy-nude or golden-nude (MAC Patisserie type shades)',
      bold: 'Gold accent nail with jewel-tone base: popular for festive occasions'
    },

    advice: `South Asian nail traditions are deeply connected to textiles and ceremony — the color
    of your bangles, sari, and bindis often dictates nail color choices. Mehndi (henna) serves
    as the foundational bridal nail art: natural, beautiful, fragrant, and culturally significant.
    For daily care: sweet almond oil or coconut oil on cuticles is the ancestrally appropriate
    and scientifically nourishing choice. For the classic South Asian festive look: deep red or
    burgundy nail polish (OPI "The Thrill of Brazil" or Essie "Bordeaux" are popular) with a
    golden accent nail. Contemporary South Asian nail art blends rangoli patterns, paisley
    designs, and gold foil accents — a beautiful fusion of tradition and modernity.`
  },

  caribbean: {
    communityName: 'Caribbean',

    traditions: {
      color: 'Caribbean nail aesthetic: vibrant, tropical colors; nails as joy expression',
      carnival: 'Carnival nails: elaborate, themed; glitter, 3D elements, tropical motifs',
      practical: 'Agricultural/domestic work tradition: practical nail lengths; strong natural nails'
    },

    nailCare: {
      coconut: 'Coconut oil for cuticle care: the Caribbean universal beauty tool works for nails too',
      aloe: 'Aloe vera on nails: soothes dry cuticle area; anti-inflammatory; Caribbean remedy',
      color: 'Tropical nail colors: coral, turquoise, mango yellow, ocean blue; celebrate Caribbean vibrancy'
    },

    nailPolishShades: {
      tropical: 'Coral, teal/turquoise, mango, hot pink: quintessential Caribbean palette',
      classic: 'Deep red for formal; navy for smart-casual',
      nude: 'Warm peach-nude for medium Caribbean skin tones'
    },

    advice: `Caribbean nail aesthetics are joyful and vibrant — tropical colors, carnival themes, and
    the exuberance of island culture expressed on 10 tiny canvases. Coconut oil is the Caribbean's
    universal beauty tool, and it works beautifully for nail cuticle care: antimicrobial, moisturizing,
    and deeply culturally appropriate. For strong nail color in tropical humidity: gel polish holds
    better than regular in humid Caribbean environments; if regular polish, use a quality base coat
    and two thin coats. For elaborate nail art at Carnival time: find a skilled nail artist who
    understands and celebrates Caribbean aesthetics — the art form is genuinely skilled work.`
  },

  arab: {
    communityName: 'Arab / Middle Eastern',

    traditions: {
      henna: 'Henna on nails: Arab and Berber tradition; bride\'s nails stained with henna before wedding',
      eid: 'Eid nail: new nail polish for Eid celebrations is a modern tradition in many Arab communities',
      modesty: 'For nail polish and wudu (Islamic ritual washing): scholarly debate; waterproof polish may need removal for prayers; many Muslim women prefer "breathable" polish or no polish during daily prayer periods'
    },

    nailCare: {
      argan: 'Argan oil on cuticles: the liquid gold works on nails too; nourishing; anti-inflammatory',
      roseWater: 'Rose water hand and nail soak: softens cuticles; refreshes; beautifully fragrant',
      shape: 'Elegant oval or almond shapes preferred in traditional Arab nail aesthetics'
    },

    nailPolishShades: {
      classic: 'Deep red, burgundy, nude (warm skin-matching nude): traditional Arabic nail palette',
      gold: 'Gold accent nails; glitter for festive occasions; Eid gold shimmer',
      breathable: 'O2M, Tuesday in Love: marketed as breathable/wudu-friendly polish (debated validity)',
      nude: 'For olive skin: true nude is warm-toned brown-pink (not pale pink)'
    },

    advice: `Arab nail beauty has a rich tradition spanning henna nail staining to modern elaborate gel art.
    For practicing Muslim women: the breathable nail polish debate is ongoing in Islamic scholarship —
    conventional nail polish creates a waterproof barrier that prevents water from reaching the nail
    during wudu (ablution); many choose acetone-removable polish removed before prayer times;
    some use marketed "breathable" polishes (water permeability claims disputed). Argan oil on
    cuticles is the ancestral Arab nail care treatment and genuinely excellent. For festive nail looks:
    gold accents, jewel-embedded nails, henna-inspired nail art designs are all deeply culturally
    rooted and beautiful.`
  },

  latina: {
    communityName: 'Latina / Hispanic',

    traditions: {
      red: 'Red nails are the quintessential Latina beauty signature — nails as feminine power statement',
      quinceanera: 'Quinceañera nails: first formal manicure for many Latina girls; age 15 celebration includes nails',
      french: 'French manicure: classic Latina professional nail choice; clean; elegant',
      airbrushed: 'Airbrushed acrylic nail art: traditional in some Latino communities; elaborate design; sunset gradients, flowers, names'
    },

    nailCare: {
      olive: 'Olive oil soak for dry cuticles: traditional abuela remedy; effective (oleic acid nourishes)',
      lemon: 'Lemon juice for nail brightening: traditional (the citric acid has mild bleaching effect); follow with oil to prevent dryness',
      shape: 'Square, coffin, and stiletto shapes popular across Latina nail aesthetics'
    },

    nailPolishShades: {
      classic: 'Red: THE classic Latina nail. Warm reds (tomato, brick, true red) on warm-undertoned skin',
      festive: 'Hot pink, vivid coral, bright orange for festive occasions; day of the dead-inspired for Día celebrations',
      nude: 'For medium Latina skin: warm peach, terracotta, caramel nude — not cool pink',
      metallic: 'Gold and silver metallics popular for quinceañera, weddings'
    },

    advice: `The red nail is a Latina beauty institution — not trend but tradition. The specific red
    for warm-toned Latina skin: warm reds with orange or brick undertone rather than blue-red
    (though blue-red is also stunning for high contrast). Latina nail culture values both elegance
    (classic french for professional settings) and exuberance (elaborate nail art for celebrations).
    The abuela olive oil cuticle soak is legitimately effective — oleic acid is genuinely nourishing
    for the cuticle. For quinceañera nails: book in advance; the design should coordinate with dress
    color; sparkle and elegance appropriate for the celebration of emerging womanhood. Coffin and
    stiletto nail shapes are widely popular across Latina aesthetics — longer nails as feminine
    power symbol.`
  },

  'east-asian': {
    communityName: 'East Asian',

    traditions: {
      jadeguard: 'Chinese imperial court: jade and gold nail guards worn by Manchu noblewomen; extremely long nails as status symbol',
      japan: 'Japan: nail art as serious artistry; nail artists trained in elaborate techniques; nail technician is skilled profession',
      korean: 'Korean nail: clean, elegant minimalism or elaborate detailed art — two distinct aesthetics',
      glass: 'Glass nail (Korea): ultra-high gloss gel; "water drop" effect; extremely popular in K-beauty'
    },

    nailCare: {
      camelia: 'Tsubaki (camellia) oil on cuticles: Japanese traditional cuticle care; oleic acid dominant; nourishing',
      green: 'Green tea soak for nails: antioxidant-rich; anti-inflammatory; Japanese nail salon ritual',
      shape: 'Short, clean square or oval: classic Japanese aesthetic; or longer pointed for Korean nail art'
    },

    nailPolishShades: {
      kbeauty: 'Nude, blush pink, dusty mauve, gradient (darker color fading to lighter tip or center): K-beauty nail',
      jbeauty: 'Clear gloss, light pink, subtle nude: J-beauty nail',
      cbeauty: 'Bold red, deep jewel tones, black: C-beauty nail statement',
      classic: 'Cherry blossom pink; translucent with subtle shimmer; spring-inspired pastels'
    }
  },

  'east-african': {
    communityName: 'East African',

    traditions: {
      henna: 'Somali and Yemeni tradition: henna nails for celebrations; mehndi design on fingertips',
      alta: 'Tiqaqi (Ethiopian): decorative marking traditions including hands',
      strong: 'Strong, long nails as beauty asset in many East African aesthetic traditions'
    },

    nailCare: {
      castor: 'Castor oil on nails and cuticles: East African tradition; ricinoleic acid strengthens nail plate; excellent for brittle nails',
      sesame: 'Sesame oil for cuticle care: Horn of Africa traditional; antioxidant sesamol nourishes nail bed',
      shape: 'Long elegant nails; square or coffin for strength; vibrant colors celebrating deep skin beauty'
    },

    nailPolishShades: {
      bold: 'Vivid fuchsia, cobalt blue, emerald green: stunning against very deep East African skin',
      classic: 'Deep red, wine, dark burgundy: elegant and rich against deep skin',
      nude: 'True skin-matching nude for East African skin: deep brown, mocha; not pale pink',
      metallic: 'Gold shimmers and metallics: beautiful contrast against deep skin tones; celebratory'
    }
  },

  'south-african': {
    communityName: 'South African',

    traditions: {
      traditional: 'Zulu: beadwork adornment (nails as part of overall ornamental tradition)',
      modern: 'South Africa has sophisticated modern nail salon culture particularly in Johannesburg and Cape Town',
      rooibos: 'Rooibos tea nail soak: South African home remedy; anti-inflammatory; antioxidant'
    },

    nailCare: {
      marula: 'Marula oil for cuticle care: South African indigenous ingredient; non-greasy; fast-absorbing; ideal cuticle oil',
      rooibos: 'Cooled rooibos tea soak for hands and nails: 10 minutes; aspalathin antioxidant on nail area; uniquely South African nail ritual',
      shape: 'South African nail fashion follows international trends plus own distinctive influences'
    },

    nailPolishShades: {
      black: 'Bold jewel tones for deep South African skin; vivid and vibrant',
      traditional: 'Ochre-inspired terracotta; earth tones reflecting South African landscape',
      celebratory: 'Gold, bright accent colors for umemulo and other celebrations'
    },

    advice: `South African nail beauty reflects the country's remarkable diversity — from elaborate
    Zulu beadwork-inspired nail art to sleek Cape Town minimalism to Johannesburg trend-forward
    statements. Marula oil for cuticle care is quintessentially South African: the Tsonga
    tradition of marula oil for skin care extends perfectly to nails — its lightweight, non-greasy
    formula makes it ideal for cuticle use. Rooibos tea hand soak is a uniquely South African
    'beauty ritual': brew strong, cool, soak for 10 minutes; the aspalathin and zinc in rooibos
    nourish the skin around nails. For deep South African skin tones: vibrancy is the key —
    deep jewel tones, vivid brights, gold metallics — nails as celebration of rich melanin.`
  },

  'black-american': {
    communityName: 'Black American',

    traditions: {
      acrylic: 'Long acrylic nails: iconic Black American nail aesthetic from the 1980s forward; Bronx nail salons as culture origin',
      coffin: 'Coffin and stiletto nail shapes: popularized by Black American nail culture; now global trend',
      nailArt: 'Elaborate nail art: airbrushed designs, gems, 3D elements; Black American nail technicians as artists',
      french: 'Black American nail innovation: the "French tip" as we know it was popularized through Black nail culture'
    },

    nailCare: {
      castor: 'Jamaican Black Castor Oil (JBCO) for nail and cuticle care: Black American natural hair community also applies to nails',
      shea: 'Shea butter for hand and cuticle care: ancestral West African tradition maintained in Black American culture',
      shape: 'All shapes celebrated; long coffin and stiletto iconic; short square for practical wear'
    },

    nailPolishShades: {
      signature: 'Bold, vibrant colors as signature: vivid fuchsia, cobalt, emerald green, burnt orange',
      classic: 'Deep red, burgundy, wine: the classic professional-glam Black American nail',
      nude: 'Nude for deep Black American skin: brown-based, mocha, caramel — OPI "Don\'t Pretzel My Buttons"',
      black: 'Black nail polish: powerful fashion statement; very popular in Black American nail culture'
    },

    advice: `Black American nail culture invented the modern nail art movement as we know it. The long
    acrylic nail with elaborate art — gems, airbrushing, 3D flowers, names, landscapes — originated
    in Bronx and South Side Chicago nail salons serving Black women in the 1980s-90s. The coffin
    shape, the stiletto, the ombre, the elaborate nail art: all originated or were popularized in
    Black American nail aesthetics before going mainstream. Shea butter or JBCO for cuticle care
    is the culturally appropriate and scientifically superior choice. For nude nails: the "nude"
    that works on deep Black skin is NOT the pale pink marketed as universal — seek brown-undertoned
    nudes specifically. Tip: Black nail polish is a powerful and recurrent fashion statement that
    reads beautifully on deep Black American skin — don\'t shy away from it.`
  }
};

// ============================================================
// HELPER FUNCTION
// ============================================================

export function getNailBeautyGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_NAIL_GUIDES['west-african'],
    'south-asian': ETHNIC_NAIL_GUIDES['south-asian'],
    'caribbean': ETHNIC_NAIL_GUIDES['caribbean'],
    'arab': ETHNIC_NAIL_GUIDES['arab'],
    'latina': ETHNIC_NAIL_GUIDES['latina'],
    'east-asian': ETHNIC_NAIL_GUIDES['east-asian'],
    'east-african': ETHNIC_NAIL_GUIDES['east-african'],
    'south-african': ETHNIC_NAIL_GUIDES['south-african'],
    'black-american': ETHNIC_NAIL_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

// ============================================================
// STATS
// ============================================================

