/**
 * MIRRR Wig & Hair Extensions Guide
 * Comprehensive guide to wigs, lace fronts, full lace, HD lace,
 * wig construction types, installation, care, and ethnic wig traditions
 * across all 9 MIRRR communities
 */

// ─── WIG CONSTRUCTION BASICS ─────────────────────────────────────────────────

export const WIG_CONSTRUCTION = {
  overview: 'A wig is a head covering made from human hair, synthetic fibre, or a combination. The construction method determines the wig\'s appearance, breathability, longevity, and price point.',

  cap_constructions: {
    basic_cap: {
      name: 'Basic/Standard Cap',
      construction: 'Machine-sewn wefts (horizontal tracks of hair) sewn onto a mesh cap. Clips or combs for attachment.',
      appearance: 'Less natural at the hairline; wefts visible if cap is lifted.',
      pros: ['Most affordable', 'Durable', 'Wide range of styles'],
      cons: ['Hairline looks clearly wiglike', 'Less breathable', 'Cannot part anywhere'],
      best_for: 'Beginners, everyday casual wear, budget-conscious',
      price_range: '$20-$150',
    },
    wefted_cap: {
      name: 'Wefted Cap (Open Weft)',
      construction: 'Machine-sewn wefts with open panels for breathability. Clips inside for security.',
      pros: ['More breathable than basic cap', 'Affordable', 'Lightweight'],
      cons: ['Still limited parting', 'Hairline not as natural as lace'],
      best_for: 'Everyday wear, particularly in warm climates',
      price_range: '$30-$200',
    },
    lace_front: {
      name: 'Lace Front',
      construction: 'Sheer lace panel at the front (typically 2-4 inches) where hairs are individually hand-tied. Rest of cap is machine-sewn wefts.',
      appearance: 'Natural-looking hairline when properly installed; lace sits on skin and is virtually invisible when matched to skin tone.',
      installation: 'Adhesive (glue or tape) or glueless clips; lace trimmed to hairline.',
      pros: ['Natural hairline appearance', 'More affordable than full lace', 'Versatile styling near hairline'],
      cons: ['Cannot pull hair into ponytail from roots (cap visible at back)', 'Lace requires careful maintenance', 'Adhesive can irritate skin'],
      best_for: 'Natural hairline appearance; most versatile option for most wearers',
      price_range: '$80-$400+ (human hair)',
    },
    full_lace: {
      name: 'Full Lace Wig',
      construction: 'Entire cap is sheer lace with hairs individually hand-tied throughout.',
      appearance: 'Most natural; can part anywhere; can be pulled into high ponytail.',
      pros: ['Most versatile styling', 'Natural appearance everywhere', 'Breathable'],
      cons: ['Most expensive', 'More delicate', 'Requires more careful installation'],
      best_for: 'Natural look; high ponytail styles; maximum versatility',
      price_range: '$200-$1000+',
    },
    hd_lace: {
      name: 'HD Lace (High Definition Lace)',
      construction: 'Ultra-thin, ultra-transparent Swiss lace that virtually disappears on all skin tones.',
      appearance: 'Undetectable lace; no bleaching of knots often needed as lace is transparent enough.',
      note: 'Originally developed to address the issue of standard lace not matching dark skin tones well.',
      pros: ['Truly invisible lace', 'Works across all skin tones', 'Eliminates "wig" look'],
      cons: ['More delicate than standard lace', 'More expensive', 'Requires careful handling'],
      price_range: '$150-$500+',
    },
    t_part: {
      name: 'T-Part/U-Part Lace',
      construction: 'Lace only at the T-shaped parting (center top and side temples) or U-shaped opening for natural hair blend.',
      u_part_note: 'U-Part leaves an opening to pull natural hair through for blending.',
      pros: ['Less expensive than full lace front', 'Natural-looking part', 'U-part protects edges'],
      best_for: 'Protective styling while leaving edges exposed',
      price_range: '$60-$300',
    },
    360_lace: {
      name: '360 Lace',
      construction: 'Lace band around the entire perimeter of the wig; machine-sewn cap in the middle.',
      advantage: 'Allows high ponytails and updos (edges look natural all around) without full lace cost.',
      price_range: '$120-$500',
    },
  },

  hair_types: {
    human_hair: {
      types: {
        virgin: {
          name: 'Virgin Human Hair',
          description: 'Unprocessed human hair — never chemically treated, coloured, or permed. Cuticles intact and aligned in one direction.',
          quality: 'Highest quality; most natural behaviour; longest lasting.',
          origin_note: 'Common origins: Indian (temple hair from religious donations — ethical question around consent), Malaysian, Peruvian, Brazilian (often marketing terms rather than true origins — see below), Cambodian.',
          longevity: '2-5 years with proper care',
        },
        remy: {
          name: 'Remy Human Hair',
          description: 'Cuticles intact and aligned (reduces tangling). May or may not have been chemically processed.',
          quality: 'High quality; most human hair wigs sold as "Remy".',
        },
        non_remy: {
          name: 'Non-Remy Human Hair',
          description: 'Cuticles not aligned; often acid-washed and silicone-coated to reduce tangling initially.',
          quality: 'Lower quality; tangles more over time as silicone coating wears off.',
        },
        blended: {
          name: 'Human Hair Blend',
          description: 'Mix of human hair and synthetic fibres.',
          pros: 'Less expensive; some benefits of both.',
          cons: 'Cannot be heat-styled like pure human hair; may not behave as naturally.',
        },
      },
      care: 'Shampoo, condition, and style as you would your natural hair. Heat styling safe with heat protectant. Can be coloured (test on small section first).',
    },
    synthetic: {
      overview: 'Made from various synthetic fibres designed to mimic the look and feel of human hair.',
      types: {
        standard_synthetic: {
          description: 'Basic synthetic fibre; not heat-safe.',
          pros: ['Most affordable ($20-$80)', 'Retains style well; low maintenance'],
          cons: ['Cannot use heat tools', 'Less natural look/feel', 'Shorter lifespan (3-6 months)', 'Can look shiny/fake'],
        },
        heat_resistant: {
          description: 'Fibre can withstand some heat styling (usually up to 150-180°C).',
          pros: 'More versatile than standard synthetic; more affordable than human hair.',
          cons: 'Still not as versatile or natural as human hair.',
        },
        fibre_innovations: {
          kanekalon: 'Common braiding hair and wig fibre; most affordable; not heat-safe.',
          toyokalon: 'Softer than Kanekalon; used in many wig styles.',
          hiperlon: 'Heat-resistant synthetic; can be styled with curling iron up to 150°C.',
        },
      },
    },
  },
};

// ─── WIG INSTALLATION ─────────────────────────────────────────────────────────

export const WIG_INSTALLATION = {
  scalp_prep: {
    cleanse: 'Wash and dry natural hair thoroughly before installing any wig.',
    cornrow_base: {
      purpose: 'Cornrowing hair flat creates a smooth base, keeps natural hair protected, and provides anchor points for clips.',
      patterns: {
        front_to_back: 'Standard for full wigs; creates smooth base.',
        around_perimeter: 'If leaving some natural hair out (U-part).',
      },
      wig_cap: 'A wig cap (nylon or mesh) over cornrows creates additional security and smooth surface.',
    },
    edges: 'Lay edges flat with gel or edge control before putting on wig cap for a smooth perimeter.',
  },

  glueless_methods: {
    clips: 'Small claw clips sewn inside wig cap click onto cornrows. Most gentle on hairline; removable daily.',
    elastic_band: 'Adjustable elastic band inside wig for secure fit without adhesive. Many wigs now have built-in bands.',
    headband_wigs: 'Wig attached to a headband; no adhesive or clips needed. Fastest installation. Hair at back of headband visible as a "halo."',
    velcro: 'Velcro strips inside cap grip to natural hair or wig cap. Gentle option.',
    why_glueless_matters: 'Wig glue and tape applied directly to hairline repeatedly causes hairline thinning and traction alopecia. Glueless methods protect edges.',
  },

  adhesive_methods: {
    when_used: 'Adhesive gives the most secure, most natural-looking installation — particularly useful for active lifestyles, swimming, or formal events.',
    types: {
      wig_glue: {
        name: 'Wig Bonding Glue',
        application: 'Applied to lace and/or hairline. White glue goes transparent when pressed.',
        removal: 'Requires oil-based remover or specific wig glue remover. Never pull without remover — damages hairline.',
        concern: 'Repeated use irritates skin and causes hairline damage.',
      },
      wig_tape: {
        name: 'Wig Tape (Double-Sided)',
        types: ['Tape tabs (small adhesive squares or strips)'],
        application: 'Applied to inside of lace perimeter; pressed to skin or wig cap.',
        removal: 'Easier removal than glue; less damaging.',
        duration: 'Usually 1-7 days depending on type.',
      },
      got2b_glued: 'Got2b Glued spray and pomade widely used as wig adhesive — particularly popular in Black beauty community. Not specifically designed for wigs but effective.',
    },
    CRITICAL_warnings: [
      'Always do patch test 24-48 hours before full application — lace adhesive contact dermatitis is common',
      'Never sleep in a glued wig without a silk bonnet — tangling and hairline damage',
      'Always remove adhesive with proper remover; never pull wig off without dissolving adhesive first',
      'Skin around hairline needs recovery time between installations — give hairline adhesive-free breaks',
    ],
  },

  lace_customisation: {
    cutting_lace: {
      steps: [
        'Mark the lace cut line with white eyeliner or pencil just before your natural hairline',
        'Cut in SMALL sections — you cannot add lace back',
        'Cut in a zig-zag pattern along hairline for more natural look (avoids straight line)',
        'Leave 0.5-1cm of lace beyond natural hairline to allow for adhesive placement',
      ],
      tools: 'Small, sharp scissors; nail scissors excellent for precision.',
    },
    bleaching_knots: {
      what: 'Knots where individual hairs are tied to lace appear dark. Bleaching lightens them to match lace colour for invisible appearance.',
      diy: 'Bleach powder + developer applied carefully to underside of lace ONLY; process 20-40 minutes; rinse thoroughly. Damages hair if over-processed.',
      alternative: 'HD lace often does not need knot bleaching due to ultra-transparent lace.',
    },
    tinting_lace: {
      what: 'Using concealer, foundation, or tinting spray to match lace colour to your specific skin tone.',
      method: 'Apply concealer or foundation matching hairline skin to lace before installation. Let dry.',
      purpose: 'Standard lace comes in limited shades (brown, dark brown); tinting allows precise match.',
    },
  },

  baby_hairs: {
    what: 'Small hairs at the perimeter of the lace wig, laid flat to create a natural-looking edge.',
    styling: 'Use edge control or gel and a soft toothbrush. Lay in swirls, waves, or soft curves along hairline.',
    cultural_context: 'Baby hair styling is an art form in Black and Latina beauty communities; elaborate baby hair patterns are a fashion statement. See "slayed edges" terminology.',
    products: 'Murray\'s Edge Wax, Ampro Protein Styling Gel, Got2b gel all popular for baby hair styling.',
  },
};

// ─── WIG CARE ────────────────────────────────────────────────────────────────

export const WIG_CARE = {
  human_hair_care: {
    washing: {
      frequency: 'Every 10-14 days for daily wear; less frequently if worn occasionally.',
      method: [
        '1. Gently detangle with wide-tooth comb working from ends to roots',
        '2. Submerge in basin of cool/lukewarm water with wig-specific shampoo',
        '3. Gently work shampoo through hair from root to tip — do NOT scrub or circular motion',
        '4. Rinse thoroughly in same root-to-tip direction',
        '5. Apply deep conditioner from mid-shaft to ends; avoid lace cap',
        '6. Rinse; follow with cold water rinse to close cuticle',
        '7. Press gently with microfibre towel — never wring',
        '8. Air dry on wig stand; apply heat cautiously',
      ],
      products: 'Use moisturising shampoo and deep conditioner. Wigs do not receive scalp oils so are drier than natural hair and need extra conditioning.',
    },
    storage: {
      wig_stand: 'Store on a wig stand or mannequin head to preserve shape.',
      away_from: 'Keep away from direct sunlight, heat, and humidity when stored.',
      travel: 'Wig boxes or silk bags prevent damage in travel.',
    },
    styling: {
      heat: 'Always use heat protectant on human hair wigs. 180°C (365°F) maximum for most human hair.',
      curling: 'Use flexi rods or perm rods for heatless curls — gentler and longer-lasting results.',
    },
    longevity: 'With proper care, quality human hair wigs last 2-5 years.',
  },

  synthetic_care: {
    washing: {
      frequency: 'Every 7-10 days for daily wear.',
      method: [
        '1. Detangle gently',
        '2. Use wig-specific shampoo in cool water (hot water damages synthetic fibre)',
        '3. Never rub or scrub — swish gently',
        '4. Air dry ONLY — no blow dryer or heat (unless heat-resistant fibre)',
        '5. Style when dry',
      ],
    },
    heat_warning: 'NEVER use heat styling on standard synthetic wigs. The fibre melts. Check your specific wig for heat resistance rating.',
    longevity: '3-6 months with daily wear.',
  },

  edge_protection: {
    tension_warning: 'Wig clips that are too tight cause traction alopecia. Distribute tension across cap rather than focusing on hairline.',
    moisturise_edges: 'Edges not in the wig are still exposed — keep them moisturised.',
    installation_breaks: 'Give hairline rest periods between wig installations, particularly after adhesive use.',
    scalp_access: 'Even with wig, scalp needs care. Use wig nozzle applicator to apply scalp oils and serums through braided base.',
  },
};

// ─── ETHNIC WIG TRADITIONS ────────────────────────────────────────────────────

export const ETHNIC_WIG_TRADITIONS = {
  black_american: {
    overview: 'The Black American wig tradition is the most culturally significant and historically rich in the US context. Wigs, weaves, and hair additions have been central to Black beauty culture for generations.',
    historical_context: 'Hair in Black culture carries deep meaning — status, identity, political statement, and beauty. Wigs and extensions have been practical responses to societal pressures around natural Black hair (workplace discrimination, length discrimination) as well as creative beauty tools.',
    styles: {
      lace_front: 'Lace front wigs are deeply embedded in Black beauty culture. Celebrity lace fronts — from Beyoncé to Cardi B — have driven mainstream wig culture globally.',
      protective: 'Wigs as protective styling — giving natural hair a break from manipulation while appearing styled.',
      unit: '"Unit" is the term for a wig in Black beauty culture — language signifying ownership and artfulness.',
      snatched: '"Snatched" = wig applied so perfectly it looks like natural hair growing from your scalp.',
    },
    brands: ['Sensationnel', 'Outre', 'RPGSHOW', 'Luvme Hair', 'Klaiyi Hair'],
    cultural_figure: 'Bob the Drag Queen, Kim Kimble (celebrity hairstylist) — key figures in popularising various wig styles. The drag and ballroom community as pioneers of extreme wig artistry.',
    baby_hair_culture: 'Elaborate baby hair styling as art form — zig-zags, swirls, heart shapes. Social media celebrations of elaborate baby hair designs.',
  },

  south_asian: {
    overview: 'Long, thick hair is a deeply significant beauty ideal in South Asian culture. Hair extensions and pieces have been used for centuries; modern wig use is growing.',
    traditional: {
      gajra: 'Fresh jasmine flower garlands worn in hair — not a wig but a beautiful hair adornment tradition that sometimes uses clip-in extensions to add length for flowers to adorn.',
      choti: 'Long braid often extended with hair extensions, particularly for weddings.',
      bridal: 'South Asian brides commonly use hair extensions to achieve the thick, long bridal hair ideal even if natural hair is shorter.',
    },
    temple_hair_ethics: {
      concept: 'Much of the global human hair supply comes from Indian temples where women donate hair as religious offerings (mundan ritual).',
      ethical_complexity: 'The industry built around this hair is complex — while the donation itself is an act of devotion, the commercial chain converting this into global wig market products is debated.',
      alternatives: 'Vietnamese, Cambodian, Brazilian sourced hair less ethically complex though marketing around origin often misleading.',
    },
    modern_use: 'Growing acceptance of wigs in South Asian community, particularly for women experiencing hair loss from PCOS (common in South Asian women) or postpartum hair loss.',
  },

  arab: {
    overview: 'Wigs and hair adornments have different cultural and religious contexts across Arab communities.',
    hijab_context: 'For hijab-wearing women, wigs are sometimes worn in private (women-only) settings for beauty and self-expression while maintaining modesty in public. This is a deeply personal choice.',
    bridal: 'Arabic bridal hair — often voluminous, styled with elaborate extensions and adornments for weddings.',
    traditional_adornments: 'Elaborate hair jewellery — gold and silver headpieces, chains, and ornaments — is traditional in many Arab communities, particularly for celebrations.',
    extension_culture: 'Hair extensions widely used for bridal and event looks; voluminous, long hair is the traditional beauty ideal.',
  },

  east_asian: {
    overview: 'South Korea, Japan, and China all have significant wig industries and cultures.',
    korea: {
      history: 'Korea has ancient wig traditions. Gache (대가리) — elaborate wig headdresses worn by court ladies during Joseon Dynasty.',
      modern: 'Korea is a major wig manufacturer; K-pop idol industry drives enormous demand for high-quality synthetic and human hair wigs for stage performance.',
      wigmaking: 'Korean wig manufacturing is world-class; many global wig brands source from Korea.',
    },
    japan: {
      katsura: 'Traditional Japanese wigs (katsura/かつら) used in traditional theatre (Noh, Kabuki) — extremely elaborate, lacquered constructions.',
      cosplay: 'Japan\'s massive cosplay culture drives significant wig market for character hair in all colours and styles.',
      medical: 'Japan has a significant medical wig industry; strong social support for wig use among cancer patients.',
    },
    china: {
      manufacturing: 'China is the world\'s largest manufacturer of wigs, supplying much of the global market.',
      xuchang: 'Xuchang, Henan Province is the "wig capital of the world" — processes vast quantities of human hair and manufactures wigs for global export.',
    },
  },

  west_african: {
    overview: 'West Africa, particularly Nigeria and Ghana, has a thriving wig culture that blends traditional aesthetics with contemporary style.',
    nigeria: {
      nollywood: 'Nollywood (Nigerian film industry) drives wig fashion across West Africa; celebrity hair choices influence millions.',
      vendors: 'Lagos and Accra are major hubs for human hair vendors; vibrant market culture around hair.',
      styles: 'Braided lace wigs — wigs that mimic braided styles without actual braiding time. Extremely popular for the "instant braid" look.',
    },
    ghana: {
      tradition: 'Ghana has its own rich hair braiding and adornment tradition. Wigs that mimic braided styles are particularly popular.',
    },
  },

  caribbean: {
    overview: 'Caribbean wig culture blends African, European, and local influences. Carnival and festival traditions involve elaborate hair adornment.',
    carnival: 'Elaborate headdresses and hair adornments are central to Carnival culture across the Caribbean.',
    protective: 'Hot, humid Caribbean climate makes protective styles — including wigs — practical as well as aesthetic choices.',
    braided_wigs: 'Braided wigs popular for their practicality in humid conditions.',
  },

  east_african: {
    ethiopia: 'Ethiopian hair traditions include elaborate natural hair styling for ceremonies; modern wig use growing in urban areas.',
    kenya: 'Nairobi is a significant hub for hair business in East Africa. Human hair vendor culture, lace front popularity growing.',
    somalia: 'Somali diaspora communities in the US and UK are significant wig consumers; traditional headscarves worn over wigs in some communities.',
  },

  south_african: {
    overview: 'South Africa has a vibrant, evolving beauty culture with significant wig and extension market.',
    cape_malay: 'Cape Malay community has specific adornment traditions for celebrations.',
    zulu: 'Traditional Zulu headdresses and hair styling — elaborate ceremonial constructions — are specific to cultural celebrations.',
    modern: 'Johannesburg and Cape Town have sophisticated hair extension and wig markets. South African wig influencers are internationally prominent.',
  },

  latina: {
    overview: 'Latina beauty culture values long, lustrous hair. Extensions and wigs increasingly popular particularly for quinceañera and wedding styling.',
    quinceañera: 'Elaborate bridal-style hair — often with extensions for length and volume — is traditional for quinceañera celebrations.',
    event_styles: 'Big, glamorous hair for events. Clip-in extensions for volume are more common than full wigs.',
    dominican_blowouts: 'Dominican salons known for their blowout technique — a Dominican blowout creates sleek, voluminous straight hair that is an alternative to extensions for many Latinas.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getWigConstructionGuide(type) {
  return WIG_CONSTRUCTION.cap_constructions[type] || WIG_CONSTRUCTION.cap_constructions;
}

export function getHairTypesGuide() {
  return WIG_CONSTRUCTION.hair_types;
}

export function getWigInstallationGuide(method) {
  if (method === 'glueless') return WIG_INSTALLATION.glueless_methods;
  if (method === 'adhesive') return WIG_INSTALLATION.adhesive_methods;
  return WIG_INSTALLATION;
}

export function getWigCareGuide(hairType) {
  if (hairType === 'human') return WIG_CARE.human_hair_care;
  if (hairType === 'synthetic') return WIG_CARE.synthetic_care;
  return WIG_CARE;
}

export function getWigTraditionForCommunity(communityId) {
  return ETHNIC_WIG_TRADITIONS[communityId.replace('-', '_')] || null;
}

export function getAllWigTraditions() {
  return ETHNIC_WIG_TRADITIONS;
}

export function getLaceCustomisationGuide() {
  return WIG_INSTALLATION.lace_customisation;
}

export function getBabyHairGuide() {
  return WIG_INSTALLATION.baby_hairs;
}

export const WIG_GUIDE_STATS = {
  capConstructionTypes: Object.keys(WIG_CONSTRUCTION.cap_constructions).length,
  communitiesCovered: Object.keys(ETHNIC_WIG_TRADITIONS).length,
  installationMethods: ['clips', 'elastic_band', 'headband', 'velcro', 'glue', 'tape'],
};
