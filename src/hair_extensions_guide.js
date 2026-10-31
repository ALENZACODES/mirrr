/**
 * MIRRR Hair Extensions Guide
 * Clip-in, tape-in, fusion/bond, sew-in weave, micro-ring/bead,
 * halo, glue-in, care, and multicultural extension traditions
 */

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────

export const EXTENSIONS_OVERVIEW = {
  why_extensions: 'Hair extensions add length, volume, colour dimension (without chemical processing), and versatility. They can be temporary (clip-ins) or long-term (fusion bonds, tape-in, sew-in).',
  hair_types: {
    human: {
      type: 'Human Hair Extensions',
      subtypes: {
        remy: 'Remy hair: cuticles aligned in the same direction (root-to-tip). Higher quality — less tangling, more natural movement. More expensive.',
        non_remy: 'Non-Remy hair: cuticles not aligned (may be reversed or random). Tangles more over time. Lower cost.',
        virgin: 'Virgin human hair: never chemically processed. Highest quality. Can be coloured, heat-styled, and treated like natural hair.',
        single_drawn: 'Single drawn: bundle has hairs of varying lengths (more natural-looking, less density).',
        double_drawn: 'Double drawn: bundle has hairs predominantly of one length (creates thicker, more even appearance).',
      },
      pros: ['Most natural look and feel', 'Can be heat-styled and coloured', 'Longer lifespan (1-3 years with care)'],
      cons: ['More expensive', 'Colour can change with washing and sun exposure', 'Requires matching to natural hair colour/texture'],
    },
    synthetic: {
      type: 'Synthetic Hair Extensions',
      pros: ['Lower cost', 'Colour stays consistent', 'Lightweight'],
      cons: ['Cannot (usually) be heat-styled — will melt', 'Shorter lifespan', 'Less natural appearance', 'Tangling and matting faster'],
      heat_resistant_synthetic: 'Heat-resistant synthetic extensions exist and can withstand some heat styling up to ~180°C. Read product specifications carefully.',
    },
    ethnic_textures: {
      type: 'Textured/Textured Hair Extensions',
      description: 'Extensions in Type 3 and Type 4 textures (curly, coily). Historically difficult to find; growing market.',
      materials: 'Kinky straight, Afro kinky, coily, loose curl, deep wave, water wave human hair extensions designed to blend with textured natural hair.',
      brands: 'Mayvenn, Luvme Hair, Outre, BHF (Black Hair Federation certified suppliers)',
    },
  },
};

// ─── CLIP-IN EXTENSIONS ───────────────────────────────────────────────────────

export const CLIP_IN_GUIDE = {
  overview: 'Clip-in extensions are the most accessible, beginner-friendly, and least damaging extension method. Applied and removed daily.',
  anatomy: {
    weft: 'A weft is a strip of hair sewn onto a horizontal track. Clip-ins consist of multiple wefts of varying widths with pressure clips attached.',
    clip_types: 'Snap clips (most common); claw clips (wider grip); pressure clips with silicone gripper (best grip, least damage).',
  },
  application_steps: [
    'Section hair horizontally, starting from the nape.',
    'Tease/backcomb the root of the section lightly for grip (optional but improves hold).',
    'Open clips on the weft extension.',
    'Snap clips onto the teased section, pressing down firmly.',
    'Let down the next section and repeat.',
    'Continue up the head, placing wefts strategically (widest wefts at the back; narrower wefts at the sides and front).',
    'Blend: run fingers or a wide-tooth comb through natural hair + extension to blend.',
    'Style together (curling, straightening) if desired.',
  ],
  removal: 'Press the clip release buttons simultaneously; gently slide out. Never pull or yank — stresses the root.',
  care: ['Brush before and after each use (start from tips, work upward)', 'Wash when visibly dirty or after 15-20 wears', 'Store in a container or hanging to prevent tangling', 'Heat protectant before styling'],
  ethnic_note: {
    type_4: 'For Type 4 natural hair, clip-ins on loose natural hair may have poor grip. Options: install clip-ins on stretched natural hair (blown out or braided-then-unravelled); use clip-ins in a coily or tightly coiled texture that blends with natural hair; or use a headband-style clip-in over a slicked-back natural hair base.',
    edges: 'Do NOT clip extensions directly at the hairline or edges — this can cause traction at the most fragile hair.',
  },
  damage_potential: 'Low when used correctly and not worn daily. The clip grip, teasing, and weight can cause breakage if the same sections are clipped repeatedly without rotation.',
};

// ─── TAPE-IN EXTENSIONS ───────────────────────────────────────────────────────

export const TAPE_IN_GUIDE = {
  overview: 'Tape-in extensions use medical-grade adhesive tape to sandwich a thin section of natural hair between two extension wefts. A semi-permanent method — lasts 4-8 weeks before reapplication.',
  application_process: {
    by_professional: 'Must be applied by a professional hair stylist.',
    steps: [
      'Hair is clean, dry, and free of any silicone-based products (breaks down tape adhesive).',
      'Thin horizontal sections (0.5-1 inch) are isolated, 1cm from the scalp.',
      'A tape weft is placed above the natural hair section; a second tape weft is pressed beneath the same section.',
      'The two adhesive strips bond together through the natural hair sandwich.',
      'Repeat across the head.',
    ],
    placement: 'Wefts placed 1-2cm from scalp (not at root — must leave some natural hair for movement and to avoid tension).',
  },
  removal: 'Must be professionally removed. An oil-based adhesive remover or tape remover solution is applied to dissolve the tape bond. Never pull extensions out by force — serious breakage results.',
  reuse: 'Tape wefts can be re-taped (new adhesive tab applied) 2-3 times before the quality degrades.',
  lifespan: '4-8 weeks in situ; extensions themselves can last 6-12 months with maintenance.',
  pros: ['Flat and lightweight', 'Natural-looking', 'Can be styled up and down'],
  cons: ['Requires professional application and removal', 'Silicone products degrade tape bond', 'Regular appointments required'],
  ethnic_note: 'Tape-ins are not typically suited to Type 4 natural hair because the hair must be very smooth for tape to lie flat and adhere well. Tape-ins work well for relaxed natural hair or Type 2-3 hair. For Type 4, sew-in methods are generally superior.',
};

// ─── FUSION / BOND EXTENSIONS ─────────────────────────────────────────────────

export const FUSION_BOND_GUIDE = {
  types: {
    hot_fusion: {
      name: 'Hot Fusion (Keratin Bond)',
      description: 'Small pre-tipped sections of extension hair (I-tip or U-tip) are bonded to small sections of natural hair using a heated keratin glue bond applied with a heat connector tool.',
      lifespan: '3-6 months',
      installation: 'Professional only. 2-4+ hours depending on amount.',
      removal: 'Bond is dissolved with keratin bond remover; bonds are gently squeezed and slid down and off. Professional recommended.',
    },
    cold_fusion: {
      name: 'Cold Fusion (Ultrasonic/Micro-ring)',
      description: 'Uses ultrasonic vibration to melt a keratin polymer sleeve around the natural hair and extension strand without a separate heat tool applied to the bond. Gentler than hot fusion.',
    },
  },
  pros: ['Longest lasting', 'Most natural movement', 'Can be worn in any style'],
  cons: ['Most expensive', 'Longest installation', 'Risk of heat damage to natural hair if applied incorrectly', 'Requires professional removal'],
  ethnic_note: {
    warning: 'HOT FUSION bonds carry heat damage risk. For Type 4 natural hair, heat at the bond point can compromise already fragile strands. Cold fusion or micro-ring bonds are preferable for textured hair.',
    alopecia_risk: 'Fusion bonds add significant weight to natural hair strands. Traction alopecia is a real risk if extensions are too heavy or too many strands are bonded to a single natural strand. Professional expertise is critical.',
  },
};

// ─── SEW-IN WEAVE ─────────────────────────────────────────────────────────────

export const SEW_IN_GUIDE = {
  overview: 'Sew-in weave is a cornerstone extension method in Black American, West African, Caribbean, and increasingly universal hair culture. Natural hair is braided down (cornrowed) as a base; extension wefts are sewn onto the braid pattern with a needle and thread.',
  braid_pattern: {
    purpose: 'The cornrow pattern is strategic — designed to support the direction, volume, and style of the final weave look.',
    patterns: {
      straight_back: 'All cornrows braided straight back from the hairline to the nape. Standard base for full weaves.',
      vixen: 'A 4-way braid pattern that allows a middle and side part. Versatile styling.',
      leave_out: 'A section of natural hair is left unbraided and out; blended with extensions to disguise the weave installation. Common technique.',
      full_sew_in: 'All hair braided down with no leave-out. Requires a closure or frontal piece to cover the front.',
    },
  },
  closures_frontals: {
    closure: {
      name: 'Closure',
      description: 'A 4x4 inch or 5x5 inch piece of lace with hair attached. Placed at the top/front of the head over the braids to cover the exposed braid area and create a natural-looking parting.',
      types: ['Middle part', 'Left part', 'Right part', 'Free part'],
    },
    frontal: {
      name: 'Frontal',
      description: 'A 13x4 inch (ear-to-ear) or 13x6 inch lace piece with hair attached. Covers the entire front hairline from ear to ear. Allows styling across the full hairline — any part, slick-back styles.',
      advantage: 'More versatile styling than a closure.',
      installation: 'Can be sewn down or glued (with lace adhesive).',
    },
  },
  advantages: ['Protective style for natural hair', 'Versatile styling', 'Hair is braided away and protected', 'Longevity (6-8 weeks with maintenance)'],
  maintenance: {
    scalp_care: 'Apply a scalp oil (tea tree in jojoba, peppermint, rosemary) through the weave track parting lines to the scalp. Avoid product build-up.',
    washing: 'Wash every 1-2 weeks with diluted shampoo (bottle with nozzle helps reach the scalp). Dry thoroughly — a damp scalp under weave causes mildew and odour.',
    edges: 'Clean and moisturise the edges (leave-out hair and exposed natural hairline) daily. This area is most vulnerable to drying and traction.',
  },
  traction_warning: 'Sew-in weaves must not be installed too tight. Tension at the braid base or at the natural hairline causes traction alopecia. You should feel no pain after installation — pain is a warning sign.',
  lifespan: '4-8 weeks. Do not leave in longer — hair will lock and mat underneath.',
};

// ─── MICRO-RING / MICRO-BEAD EXTENSIONS ──────────────────────────────────────

export const MICRO_RING_GUIDE = {
  overview: 'Micro-ring (also micro-bead or loop extensions) use tiny metal rings (beads) to attach extension strands to small sections of natural hair. No heat, no glue, no adhesive.',
  types: {
    I_tip: 'I-tip extensions: straight tip fed through the ring; ring is clamped shut.',
    nano_ring: 'Nano rings: smaller than micro-rings. Suitable for finer hair.',
    weft_micro_bead: 'Weft micro-bead: full wefts attached with multiple micro-rings spaced along the weft.',
  },
  application: 'Professional only. Each small section of natural hair is threaded through the ring with an extension I-tip, the ring is positioned 1cm from scalp, then clamped flat with pliers.',
  maintenance_move_up: 'As natural hair grows, the ring moves down the shaft. Must be moved up every 6-8 weeks by unclamping, sliding up, and re-clamping.',
  removal: 'Rings are opened with pliers; extension slides out. No chemicals required — excellent advantage.',
  pros: ['No heat, no glue', 'Reusable rings', 'Natural look and feel', 'Can be removed and reattached'],
  cons: ['Rings can get caught in hair', 'Metal-to-hair friction can cause breakage over time', 'Requires professional maintenance'],
  ethnic_note: 'Micro-ring extensions require smooth hair to thread through the ring and lie flat. More suitable for Type 2-3 hair or relaxed natural hair. For Type 4 natural hair, sew-in weave or protective style wigs are generally preferred.',
};

// ─── HALO EXTENSIONS ──────────────────────────────────────────────────────────

export const HALO_EXTENSION_GUIDE = {
  overview: 'Halo extensions consist of a weft of hair attached to a thin, invisible wire (monofilament). The wire sits around the head like a crown — hence "halo." The natural hair is brushed over the wire to conceal it.',
  application: [
    'Gather natural hair into a high half-up section at the crown.',
    'Position the halo on top of the gathered hair; wire sits 2-3cm back from the hairline.',
    'Adjust width and height with the size adjuster.',
    'Let the upper natural hair down over the wire.',
    'Brush and blend extensions with natural hair.',
  ],
  pros: ['Easiest to apply and remove of any extension type', 'Zero damage', 'No clips, glue, tape, or sewing', 'Seconds to apply'],
  cons: ['Wire can be visible on fine/thin hair', 'Less secure than clip-ins for very active movement', 'Limited to styles where some natural hair covers the wire'],
  care: 'Brush gently; wash every 15-20 wears; store hanging or flat.',
  ethnic_note: 'Halo extensions work best for Type 1-3 hair. For natural Type 4 hair, the wire tends to be visible at the crown. However, a halo over a straightened or blown-out style can work well.',
};

// ─── EXTENSION CARE ───────────────────────────────────────────────────────────

export const EXTENSION_CARE = {
  universal: {
    brush_correctly: 'Always brush extensions from the TIPS first, working upward to the root. Never drag a brush from root to tip — causes tangling, matting, and weft damage.',
    heat: 'If heat-styling extensions: use heat protectant; do not exceed 180°C for most human hair extensions; DO NOT heat-style synthetic extensions (will melt).',
    washing: 'Wash extensions in cool or lukewarm water (not hot). Hot water lifts the cuticle and causes tangling. Use sulphate-free shampoo; silicone-free conditioner for tape-ins.',
    swimming: 'Protect extensions from chlorine and salt water — both degrade adhesives and dry out hair. Use a swim cap or apply coconut oil before swimming; rinse and shampoo thoroughly after.',
    sleeping: 'Plait (braid) extensions in a loose braid before sleeping; use a silk or satin pillowcase. Silk bonnet for natural hair with extension protective styles.',
  },
  longevity_tips: [
    'Rotate styles to distribute tension across different areas',
    'Avoid excessive heat styling — especially at bond/tape areas',
    'Use protein-free moisturising products on extensions (they don\'t need protein — protein treatments are for the cortex of damaged natural hair)',
    'See a professional for maintenance on schedule — do not exceed recommended timelines',
  ],
};

// ─── ETHNIC EXTENSION TRADITIONS ─────────────────────────────────────────────

export const ETHNIC_EXTENSION_TRADITIONS = {
  west_african: {
    community: 'West African',
    traditions: 'Extensions and added hair are deeply embedded in West African beauty culture. Braiding with extensions (Senegalese twists, box braids, Ghana braids) has been practiced for centuries. The practice of using added hair is not "inauthentic" — it is ancient tradition. Nigerian, Ghanaian, and Senegalese women have always used plant fibres, cotton, and hair extensions in elaborate styles.',
    modern: 'Box braids with Kanekalon synthetic hair are iconic. Fulani braids (often finished with beads and cuffs) are popular worldwide and rooted in Fulani and wider West African tradition.',
  },
  south_asian: {
    community: 'South Asian',
    
    modern: 'Tape-in and fusion extensions increasingly popular among South Asian women in diaspora communities for length and volume.',
  },
  caribbean: {
    community: 'Caribbean',
    traditions: 'Weave, braiding with extensions, and crochet braids are deeply integrated in Caribbean Black hair culture. Jamaican, Trinidadian, and Barbadian women have rich traditions of decorative braided styles.',
    crochet: 'Crochet braids — a method where extension hair is looped and knotted through cornrows with a crochet needle — are popular across the Caribbean and Caribbean diaspora.',
  },
  arab: {
    community: 'Arab',
    traditions: 'Arab women historically used clip-in length pieces and volume pieces for special occasions. The Gulf beauty culture embraces length and thickness as beauty ideals. Clip-in extensions for bridal and formal events are very common.',
    modern: 'Tape-in extensions increasingly popular in Gulf countries for everyday wear.',
  },
  latina: {
    community: 'Latina',
    traditions: 'Clip-in extensions widely used for special occasions. Quinceañera (sweet 15) hairstyling often involves extension pieces for volume and length.',
    brazil: 'Brazil has a major domestic extension market. "Brazilian hair" became a global marketing term for high-quality human hair extensions in the 2000s-2010s.',
  },
  east_asian: {
    community: 'East Asian',
    traditions: 'Hair extensions and pieces have a long history in Japanese and Chinese formal wear (geisha katsura wigs; Chinese opera hairstyles). Modern K-Pop culture drives significant demand for clip-in and tape-in extensions for volume and colour experimentation without commitment.',
    modern: 'K-Pop idol "mullet" and extra-long style trends drive clip-in experimentation.',
  },
  east_african: {
    community: 'East African',
    traditions: 'Braiding with extensions is culturally embedded — Eritrean, Ethiopian, Somali, and Kenyan women have long traditions of braided styles with added hair.',
  },
  south_african: {
    community: 'South African',
    traditions: 'Sew-in weave is extremely popular. South African Black beauty culture has a rich tradition of elaborate weaved styles.',
  },
  black_american: {
    community: 'Black American',
    history: 'Weave (sew-in) culture in Black America has roots in the 20th century. The weave became deeply intertwined with Black American women\'s beauty routines because it offered protective styling options, length versatility, and freedom from damaging chemical processes.',
    cultural_note: 'The "weave debate" (natural vs weave) has been a culturally fraught conversation in Black American communities. Extensions and weave are LEGITIMATE beauty choices, not "inauthentic" or "anti-natural" — they have been and remain a celebrated part of Black beauty culture.',
    icons: 'Beyoncé, Naomi Campbell, Solange, and countless other icons have worn weave alongside their natural hair throughout their careers — both are beautiful, both are valid.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getExtensionOverview() { return EXTENSIONS_OVERVIEW; }
export function getClipInGuide() { return CLIP_IN_GUIDE; }
export function getTapeInGuide() { return TAPE_IN_GUIDE; }
export function getFusionGuide() { return FUSION_BOND_GUIDE; }
export function getSewInGuide() { return SEW_IN_GUIDE; }
export function getMicroRingGuide() { return MICRO_RING_GUIDE; }
export function getHaloGuide() { return HALO_EXTENSION_GUIDE; }
export function getExtensionCare() { return EXTENSION_CARE; }
export function getEthnicExtensionTradition(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_EXTENSION_TRADITIONS[key] || Object.values(ETHNIC_EXTENSION_TRADITIONS);
}

