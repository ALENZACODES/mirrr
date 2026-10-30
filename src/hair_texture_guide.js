/**
 * MIRRR Hair Texture Guide
 * Complete hair typing systems, curl pattern science, caring for each texture,
 * the politics of hair texture, and texture-specific styling techniques
 */

// ─── HAIR TYPING SYSTEMS ──────────────────────────────────────────────────────

export const HAIR_TYPING_SYSTEMS = {
  overview: {
    note: 'Several hair typing systems exist. None is perfect — they simplify a complex spectrum. Use typing as a STARTING POINT for finding relevant advice and products, not as a rigid identity.',
    systems: {
      andre_walker: 'Created by Andre Walker (Oprah\'s hairstylist). Types 1 (straight) through 4 (coily). The most widely used system.',
      fia: 'More detailed — combines type (1-4), pattern (a/b/c), and texture (fine/medium/coarse). Better captures the full picture.',
      lois: 'Alternative system using letters (B, C, F, I, L, O, S, Z). Less widely adopted.',
    },
  },

  andre_walker_system: {
    type_1: {
      description: 'Straight hair. No natural curl or wave pattern.',
      subtypes: {
        '1a': 'Bone straight — no wave whatsoever. Very fine and silky. Asian hair often falls here.',
        '1b': 'Straight with volume — slight bends at ends. Most common straight hair.',
        '1c': 'Straight with slight wave — may have a loose wave visible in high humidity. Coarser texture.',
      },
      care: {
        challenge: 'Oiliness — sebum travels straight down the hair shaft with no curls to interrupt it. Hair gets greasy quickly.',
        wash_frequency: 'Every 1-3 days for most; daily for very oily scalp.',
        products: 'Lightweight — avoid heavy oils and butters that weigh hair down.',
        volume: 'Fine Type 1 hair often lacks volume — root-lifting products, volumising shampoos, and loose layers.',
      },
      ethnicity: 'Most common in East Asian populations; also common in Northern European populations.',
    },

    type_2: {
      description: 'Wavy hair. S-shaped waves. Falls somewhere between straight and curly.',
      subtypes: {
        '2a': 'Loose, tousled waves. Fine to medium texture. Slightly prone to frizz.',
        '2b': 'Defined S-waves that start from mid-length. Medium texture. More prone to frizz.',
        '2c': 'Strong S-waves starting from the root. Some spirals mixed in. Coarser, more prone to frizz.',
      },
      care: {
        challenge: 'Frizz management and defining waves without weighing them down.',
        method: 'Curly Girl Method (CGM) light version — sulfate-free shampoo or cowash, conditioner, styling cream.',
        products: 'Light creams, mousses, gels — avoid heavy oils.',
        technique: 'Scrunch while wet for wave definition. Diffuse or air dry.',
      },
      ethnicity: 'Common across many populations — particularly common in South Asian, Latina, Mediterranean, and Middle Eastern communities.',
    },

    type_3: {
      description: 'Curly hair. Defined spiral curls.',
      subtypes: {
        '3a': 'Large, loose spiral curls. Roughly the circumference of a wine cork. Shiny when hydrated.',
        '3b': 'Springy corkscrew curls. Tighter than 3a. Medium-to-coarse texture.',
        '3c': 'Tight corkscrew curls. Pencil-circumference curls. Can be densely packed. High shrinkage.',
      },
      care: {
        challenge: 'Moisture retention and frizz. Curls need hydration to maintain definition.',
        method: 'Curly Girl Method — sulfate-free or cowash; conditioner; leave-in; styling cream or gel.',
        products: 'Creams, gels, and leave-ins. LOC or LCO method for drier types.',
        technique: 'Rake and shake or finger coil for curl definition. Plop or diffuse to set.',
        shrinkage: '3c hair can shrink 50%+ from wet-stretched to dry.',
      },
      ethnicity: 'Common in Latina, biracial, African-American, Caribbean, some South Asian and Middle Eastern populations.',
    },

    type_4: {
      description: 'Coily/kinky hair. Very tight curl pattern. Often densely packed. Afro-textured hair.',
      subtypes: {
        '4a': 'Defined, springy coils. S-shaped when stretched. Circumference of a pencil or smaller. Some shine when moisturised.',
        '4b': 'Z-shaped kink pattern rather than spiral. Bends sharply in Z or S angles. Less defined in natural state. Very little shine naturally.',
        
      },
      care: {
        challenge: 'Extreme moisture needs. High shrinkage. Fragility — the tight bends are points of weakness. Tangling.',
        moisture: 'MOISTURE IS PARAMOUNT. Type 4 hair produces the same amount of sebum as other hair types, but the coiled structure prevents sebum from travelling down the shaft efficiently.',
        method: 'Cowash or gentle sulfate-free shampoo weekly or bi-weekly; deep condition weekly; leave-in; sealing oil or butter.',
        detangle: 'ALWAYS detangle on CONDITIONED, WET hair. NEVER on dry hair. Work in sections, starting from ends up to roots. Use wide-tooth comb or fingers.',
        manipulation: 'Low manipulation is protective — the more the hair is handled (brushed, combed, styled), the more breakage occurs.',
        shrinkage_note: '4c hair can shrink 75%+ from stretched to natural dry state. 6 inches of hair may appear as 1.5 inches.',
      },
      ethnicity: 'Predominantly Black/African and African-diaspora populations. Also found in some South Asian and other communities.',
    },
  },
};

// ─── CURL PATTERN SCIENCE ─────────────────────────────────────────────────────

export const CURL_SCIENCE = {
  follicle_shape: {
    what: 'The cross-sectional shape of the hair follicle (and the resulting hair shaft) determines curl pattern.',
    straight: 'Round follicle → round hair shaft → grows straight out of scalp.',
    wavy: 'Oval follicle → oval hair shaft → slight bending.',
    curly: 'Asymmetric elliptical follicle → more pronounced oval shaft → significant curl.',
    coily: 'Highly curved (helical/hooked) follicle → creates a spiral growth pattern. The degree of curvature determines tightness.',
  },

  disulfide_bonds: {
    what: 'The shape of each hair strand is partly maintained by disulfide bonds in the keratin structure.',
    permanent_change: 'Perming breaks and reforms these bonds to create curl; relaxing breaks and reforms them to remove curl. Both are permanent within the treated hair.',
    why_wash_and_go_changes: 'When hair dries, hydrogen bonds reform in the shape of the dry surface (flat if blow-dried, curled if diffused). These are temporary — broken by water.',
  },

  why_coily_hair_shrinks: {
    mechanism: 'Each coil is, essentially, a spring. When wet and weighted with water, the spring stretches. When dry, it returns to its natural spring state — dramatically shorter than the extended length.',
    implication: 'Shrinkage is not a flaw — it is the visible expression of a healthy, high-elasticity curl pattern.',
  },
};

// ─── CURLY GIRL METHOD ────────────────────────────────────────────────────────

export const CURLY_GIRL_METHOD = {
  

  core_principles: {
    no_sulfates: 'Avoid harsh sulfate surfactants (sodium lauryl sulfate, sodium laureth sulfate) that strip moisture. Use sulfate-free or cowash.',
    no_silicones: 'Avoid non-water-soluble silicones (dimethicone, cyclopentasiloxane). These coat the hair, require sulfates to remove, and block moisture from entering.',
    no_heat: 'Minimise or eliminate heat styling (blow dryers, flat irons). Diffuse on low if needed.',
    no_protein_overload: 'Avoid high-protein products for protein-sensitive curls.',
    deep_conditioning: 'Prioritise moisture through regular deep conditioning.',
  },

  silicone_guide: {
    avoid: 'Dimethicone, cyclopentasiloxane, amodimethicone, cyclomethicone — non-water-soluble, require clarifying to remove.',
    acceptable: 'Water-soluble silicones (PEG-modified silicones, Dimethicone Copolyol) — rinse out with regular cleansing.',
    why_this_matters: 'If silicones are not removed, moisture from conditioner cannot penetrate the coated shaft. The hair appears soft but is actually dry underneath.',
  },

  styling_techniques: {
    scrunch: 'Cup hair from ends upward, squeezing/scrunching. Encourages curl clumping.',
    rake_and_shake: 'Rake product through with fingers, then shake sections to release curls.',
    finger_coiling: 'Wind individual curls around finger to enhance definition — time-consuming but creates very defined results.',
    plop: 'Lay microfibre towel or T-shirt flat; lean hair into it; wrap hair in the cloth and leave 15-30 minutes. Maintains curl structure while removing excess water without frizz from rubbing.',
    plopping_material: 'REGULAR TOWEL creates frizz — friction disrupts the cuticle. Use microfibre towel (The Curl Company, Pattern) or cotton T-shirt.',
  },

  criticism_and_nuance: {
    too_restrictive: 'The original CGM is very restrictive — many people find modified versions (some proteins; occasional sulfate clarify; light heat) work better.',
    not_universal: 'Products that work for 3a hair may not work for 4c. The CGM was largely developed around looser curl patterns.',
    type_4: 'Many 4c naturalistas find CGM products don\'t provide adequate moisture for their hair type. Butters and heavier creams (rejected in traditional CGM) are often necessary.',
  },
};

// ─── TEXTURE POLITICS ─────────────────────────────────────────────────────────

export const HAIR_TEXTURE_POLITICS = {
  overview: 'Hair texture has been, and continues to be, a site of cultural, racial, and political significance — particularly for Black communities globally. Understanding this context is essential for any discussion of hair in multicultural beauty spaces.',

  relaxer_history: {
    what: 'Chemical hair relaxers (lye or no-lye sodium hydroxide / calcium hydroxide) permanently straighten afro-textured hair by breaking disulfide bonds.',
    history: 'Garrett Augustus Morgan patented a hair straightening cream in 1910. Johnson Products launched Afro Sheen in the 1960s. Relaxers became widely used in Black communities from the 1950s-2000s.',
    peak: 'In the 1980s and 1990s, relaxed hair was the dominant style in many Black communities in the US and UK. The "creamy crack" nickname (for the chemical) reflects both the product\'s hold and its cultural role.',
    dark_side: {
      
      cultural: 'The normalisation of chemically straightening "kinky" afro-textured hair reflects internalized pressure to conform to Eurocentric beauty standards — a form of anti-Blackness internalised within communities. This is a contested and complex area of discussion.',
    },
  },

  natural_hair_movement: {
    what: 'A social and cultural movement from approximately 2000s-present encouraging Black people to embrace their natural afro-textured hair without chemical alteration.',
    waves: {
      first_wave: '1960s-70s Black Power era — the Afro as political statement. Angela Davis and the natural as resistance.',
      second_wave: '2000s-present — "Big Chop" (cutting off chemically treated ends), YouTube natural hair community, Instagram natural hair, textured hair acceptance in mainstream.',
    },
    results: 'Significantly increased visibility and celebration of type 4 hair. Growth of natural hair industry. Some increase in corporate acceptance of natural hairstyles.',
    ongoing_struggle: 'CROWN Act (Creating a Respectful and Open World for Natural Hair) — legislation in many US states explicitly prohibiting hair texture discrimination in schools and workplaces. Afro-textured hair discrimination remains common.',
  },

  south_asian_and_hair: {
    long_hair: 'Long, thick, dark hair is a beauty ideal deeply embedded in South Asian culture. The traditional beauty ideal of "waist-length, oil-perfumed, flowing black hair" is reinforced from a young age.',
    natural_texture: 'South Asian hair texture varies from straight to wavy to very curly, but the cultural ideal has typically been straight or very loosely wavy. Many South Asian women with naturally curly or wavy hair have felt pressure to straighten.',
    champi_tradition: 'Regular oil massage and keeping hair long — deeply cultural. Loss of hair or cutting hair can be tied to mourning in some Hindu traditions.',
  },

  east_asian_and_hair: {
    perming: 'East Asian hair (typically straight Type 1) has been permed to add curl or wave in Korea, Japan, and China for decades. The "digital perm" (uses low heat with large rods for soft waves) is particularly popular in East Asian countries.',
    straight_ideal: 'Straight, dark, shiny hair is the traditional East Asian beauty ideal — reinforced in media and culture.',
    bleaching: 'Bleaching dark East Asian hair requires strong developer and longer processing times than bleaching naturally lighter hair — higher damage risk. Silver, platinum, and pastel hair requires extreme bleaching for dark hair.',
  },

  arab_hair: {
    diversity: 'Arab hair ranges from very straight (Iranian, Lebanese communities) to very coily (Sudanese Arab communities). The Arab world spans enormous geographic and genetic diversity.',
    oil_tradition: 'Oil application to hair is deeply embedded in Arab beauty tradition — argan oil (Morocco), olive oil (Levant, Egypt), black seed oil (across the Arab world).',
    henna: 'Henna on hair — traditional in Arab, North African, and South Asian cultures. Natural henna is a protein treatment as well as a colourant.',
  },
};

// ─── PROTECTIVE STYLES AND TEXTURE ───────────────────────────────────────────

export const PROTECTIVE_STYLES_BY_TEXTURE = {
  what: 'Protective styles tuck away the ends of hair (the oldest, most fragile part) to reduce breakage and manipulation.',

  by_texture: {
    type_4_coily: {
      ideal_styles: ['Box braids', 'Twists (two-strand twists, flat twists)', 'Cornrows', 'Loc styles', 'Crochet styles'],
      why: 'Type 4 hair benefits most from protective styling due to fragility and manipulation sensitivity.',
      length_retention: 'Protective styles protect ends, allowing length retention. Many people find their hair grows longer more quickly in protective styles not because they change growth rate but because less is breaking off.',
      caution: 'TOO-TIGHT protective styles cause traction alopecia — hair loss from sustained tension, particularly at the hairline. Braids should not be so tight that they cause immediate pain or hairline tension. If the scalp shows raised bumps or the hair pulls at the hairline, the style is too tight.',
    },
    type_3_curly: {
      ideal_styles: ['Twist-outs', 'Braid-outs', 'Buns', 'Updos', 'Loose braids'],
      note: 'Type 3 hair can also benefit from protective styling but is less critical than Type 4.',
    },
    type_2_wavy: {
      ideal_styles: ['Buns', 'Braids (styling)', 'Loose twists'],
      note: 'Protective styling less critical for wavy hair but can reduce frizz and manipulation.',
    },
    type_1_straight: {
      styles: ['Buns', 'Braid (for stretch and waves)', 'Braided updo'],
      note: 'Straight hair benefits from styles that reduce friction and manipulation.',
    },
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getHairTypingSystem() {
  return HAIR_TYPING_SYSTEMS;
}

export function getHairTypeGuide(type) {
  return HAIR_TYPING_SYSTEMS.andre_walker_system[type] || null;
}

export function getCurlScience() {
  return CURL_SCIENCE;
}

export function getCurlyGirlMethod() {
  return CURLY_GIRL_METHOD;
}

export function getTexturePolitics() {
  return HAIR_TEXTURE_POLITICS;
}

export function getProtectiveStylesByTexture(textureType) {
  return PROTECTIVE_STYLES_BY_TEXTURE.by_texture[textureType] || null;
}

