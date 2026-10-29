/**
 * MIRRR Natural Hair Dye Guide
 * Plant-based colour for all hair textures and ethnic backgrounds
 * Henna, indigo, cassia, and beyond — safe alternatives to chemical dye
 */

// ─── WHY NATURAL DYE ─────────────────────────────────────────────────────────

export const NATURAL_DYE_WHY = {
  benefits: [
    'No PPD (paraphenylenediamine) — the leading allergen in chemical dyes',
    'No ammonia — does not penetrate and swell the cuticle permanently',
    'No peroxide — no oxidative damage to melanin in the hair shaft',
    'Conditioning effect — natural dyes often coat and strengthen hair',
    'Gradual, natural-looking colour that fades gracefully',
    'Centuries of proven safe use across cultures',
  ],
  limitations: [
    'Cannot lighten hair (plants don\'t bleach — you can only go darker or add warmth)',
    'May not cover 100% of resistant grey (especially in first application)',
    'Longer application time (2–6 hours vs 30–45 mins for chemical)',
    'Can affect perm/relaxer results — always inform your stylist',
    'Some natural dyes (particularly cassia on light hair) may have unexpected results',
    'Quality varies enormously — source matters greatly',
  ],
  who_uses: 'Henna and plant-based dye has been used for 5,000+ years across South Asia, North Africa, Middle East, and East Africa. Not an alternative trend — it is the oldest hair colour tradition on Earth.',
};

// ─── HENNA ───────────────────────────────────────────────────────────────────

export const HENNA = {
  name: 'Henna (Lawsonia inermis)',
  origin: 'Native to North Africa, Middle East, South Asia. Has been used for beauty for 5,000+ years.',
  colour: 'Red-orange. The exact shade depends on: hair\'s starting colour, porosity, the acid used in the mix, and processing time.',
  onDifferentHairColours: {
    dark_black: 'A reddish sheen in sunlight; no dramatic colour change. Use for conditioning benefits.',
    medium_brown: 'Auburn or chestnut',
    light_brown: 'Warm copper or auburn',
    grey_white: 'Bright, vivid orange-red (can be striking — test first)',
    blonde: 'Deep copper or bright orange (dramatic result — always patch test)',
  },
  hairTypeConsiderations: {
    type4_natural: {
      effect: 'Henna coats the hair shaft — this is a feature AND a consideration. Many naturals report henna makes hair feel harder/less stretchy temporarily.',
      recommendation: 'Use a "henna gloss" (henna mixed with deep conditioner, small ratio) for the conditioning benefits with less potential stiffness.',
      ritual: 'Henna is deeply traditional in South Asian and North African communities — the practice of henna on 4C hair is its own beautiful cultural fusion.',
    },
    relaxed: {
      caution: 'Henna can affect relaxed hair. Always do a strand test first. Most people report no problem but the combination is unpredictable.',
      recommendation: 'If relaxed, use cassia (colourless henna) for conditioning without colour risk.',
    },
    fine_hair: 'Henna adds body and strengthens fine hair — a benefit. Go for a short processing time to avoid feeling heavy.',
    damaged_hair: 'Henna can temporarily strengthen damaged hair — use with caution as results vary.',
  },
  recipes: {
    basic: {
      name: 'Basic Henna Paste',
      ingredients: [
        '100g body-quality henna powder (100% pure — no additives)',
        'Lemon juice or apple cider vinegar (enough to make paste — roughly 200–300ml)',
        'Optional: 1–2 tbsp coconut oil or olive oil (makes paste easier to apply)',
        'Optional: 2–3 tsp sugar or honey (improves dye release and paste workability)',
      ],
      process: [
        'Mix henna powder with lemon juice/ACV to form a smooth paste (like thick yoghurt)',
        'Cover and let sit 8–12 hours at room temperature (this is dye release — essential for colour)',
        'Apply to slightly damp, product-free hair',
        'Section and coat hair from root to end — wear gloves',
        'Pile hair on head, cover with plastic cap',
        'Leave 2–6 hours (longer = deeper colour)',
        'Rinse THOROUGHLY with water — no shampoo for 24 hours to allow dye to set',
        'Colour will deepen for 48–72 hours after rinsing',
      ],
      tips: [
        'Never use metallic bowls — metal reacts with henna',
        'Henna stains EVERYTHING — protect floor, clothes, ears, forehead with petroleum jelly',
        'The paste should smell like cut grass or hay',
      ],
    },
    henna_gloss: {
      name: 'Henna Gloss (Natural Conditioning Treatment)',
      what: 'A more dilute version of henna paste mixed with deep conditioner — less colour, more conditioning',
      ratio: '50g henna + 300g deep conditioner (your favourite)',
      use: 'Apply to damp hair, leave 1–2 hours, rinse. Less dramatic colour. More conditioning. Better for naturals concerned about stiffness.',
    },
    henna_with_amla: {
      name: 'Henna + Amla (Indian Gooseberry)',
      what: 'Adding amla powder to henna counters the stiffening effect and adds additional shine and conditioning',
      ratio: '100g henna + 30g amla powder + liquid',
      benefit: 'More conditioning, deeper colour, counteracts the hardening some people experience with pure henna',
    },
  },
  sourcing: {
    what_to_look_for: [
      '100% pure henna powder',
      'Body-quality or hair-quality (body quality is fine for hair)',
      'Green powder (not brown or black — these signal adulteration or age)',
      'Should smell like cut hay or grass',
    ],
    brands: [
      { name: 'Light Mountain Natural Hair Colour', type: 'Retail brand', note: 'Pure henna, widely available' },
      { name: 'Surya Brasil Natural Henna Cream', type: 'Ready-to-use', note: 'Contains additional ingredients — check label' },
      { name: 'Henna Sooq', type: 'Specialist supplier', url: 'hennasooq.com', note: 'Specialist in body-quality henna; very pure' },
      { name: 'Rainbow Research Henna', type: 'Retail', note: 'Pure powders in multiple shades' },
    ],
    avoid: [
      '"Black henna" — contains PPD; causes chemical burns and severe allergic reactions',
      'Compound henna — contains metallic salts that react with chemical dyes',
      'Any henna that lists PPD, metallic salts, or has no ingredient list',
    ],
  },
};

// ─── INDIGO ───────────────────────────────────────────────────────────────────

export const INDIGO = {
  name: 'Indigo (Indigofera tinctoria)',
  origin: 'Native to India — widely used across South Asia and, historically, West Africa (for cloth dyeing)',
  colour: 'ONLY produces blue-black on hair. It does not work on uncoloured hair alone — must be applied over henna-treated or pre-coloured hair.',
  how_it_works: 'Henna and indigo have complementary chemistry. Henna binds to hair keratin; indigo requires the henna bond to attach. The two together create a lasting brown-to-black range.',
  colour_range: {
    henna_heavy: '2:1 henna:indigo = warm auburn-brown',
    equal: '1:1 henna:indigo = chestnut brown',
    indigo_heavy: '1:2 henna:indigo = dark brown',
    indigo_only_over_henna: 'Blue-black (deepest natural shade)',
    two_step_process: 'Apply henna, rinse, IMMEDIATELY apply indigo = very dark brown to black (the "2-step" method used for dark permanent natural colour)',
  },
  recipe: {
    basic: {
      ingredients: ['100g indigo powder', 'Warm water (not hot)', 'Optional: salt (1 tsp — helps dye bind)'],
      process: [
        'Mix indigo with warm water immediately before use — do not let sit long (unlike henna, which needs dye release)',
        'Apply to henna-treated hair immediately after mixing',
        'Leave 1–2 hours',
        'Rinse thoroughly with water',
      ],
      critical: 'Indigo is different from henna — mix and apply quickly. It does not improve with sitting time.',
    },
  },
  hair_types: {
    note: 'Works on all hair types including natural Afro-textured hair, but the blue-black deepness is most visible on type 1–3 hair. On very dark natural hair, the effect is a richer, bluer-black sheen.',
  },
};

// ─── CASSIA ───────────────────────────────────────────────────────────────────

export const CASSIA = {
  name: 'Cassia Obovata (Neutral / Colourless Henna)',
  aka: 'Also called "neutral henna", "senna", or "colourless henna"',
  colour: 'Technically yellow — on light/blonde hair can add golden tones; on dark hair (brown to black) = essentially no visible colour change.',
  why_use: [
    'Deep conditioning effect equivalent to henna without the colour',
    'Adds shine and smoothness',
    'Strengthens fine or damage-prone hair',
    'Safe for pre-lightened or colour-treated hair where henna colour is unwanted',
    'Safe for relaxed hair (much more so than henna)',
  ],
  on_dark_hair: 'No visible colour change — purely conditioning. Ideal for Type 4 natural hair seeking henna\'s benefits without colour.',
  on_blonde: 'May add golden-warm tones — test on a strand first',
  on_grey: 'May add yellowish tones — neutralise with a small amount of indigo in the mix',
  recipe: 'Same process as henna — mix with acidic liquid, let sit 1 hour, apply, leave 1–3 hours, rinse',
};

// ─── AMLA ─────────────────────────────────────────────────────────────────────

export const AMLA_FOR_HAIR = {
  name: 'Amla (Phyllanthus emblica / Indian Gooseberry)',
  tradition: 'Used in Ayurvedic medicine for hair for thousands of years — associated with strong, dark, lustrous hair. A standard ingredient in traditional Indian hair care.',
  benefits: [
    'Prevents premature greying (traditional use; some modern evidence)',
    'Strengthens hair shaft',
    'Adds shine',
    'Anti-dandruff',
    'Promotes hair growth by nourishing scalp follicles',
    'Rich in Vitamin C (highest natural concentration) and gallic acid',
  ],
  forms: {
    powder: { use: 'Mixed into henna paste; mixed into hair oil', application: 'Can also be made into a paste directly with water as scalp treatment' },
    oil: { use: 'Amla-infused oil for scalp massage and conditioning', popular: 'Dabur Amla Hair Oil ($8) — an iconic South Asian product sold globally' },
    fresh: { availability: 'Available at Indian grocery stores; extremely sour fruit', use: 'Juice used as hair rinse or mixed into hair masks' },
  },
  buy: [
    { name: 'Dabur Amla Hair Oil', price: '$8', note: 'Classic South Asian brand; amla-infused mineral oil base' },
    { name: 'Himalaya Herbals Anti-Hair Fall Hair Oil', price: '$12', note: 'Contains amla, bhringraj, and other Ayurvedic herbs' },
    { name: 'Frontier Co-op Amla Berry Powder', price: '$12', note: 'Pure organic powder for DIY use' },
  ],
};

// ─── OTHER TRADITIONAL PLANT DYES ────────────────────────────────────────────

export const OTHER_PLANT_DYES = {
  bhringraj: {
    name: 'Bhringraj (Eclipta prostrata)',
    tradition: 'The "king of herbs" for hair in Ayurveda. Used for hair growth, darkening grey hair, and scalp health.',
    colour: 'Dark tones on lighter hair; adds richness and depth to dark hair',
    use: 'Bhringraj powder mixed into henna paste, or as oil for scalp massage',
    buy: 'Banyan Botanicals Bhringraj Oil ($20)',
  },
  walnut: {
    name: 'Black Walnut (Juglans nigra)',
    tradition: 'Used for centuries in North America and Europe for dark brown hair dye',
    colour: 'Rich brown to dark brown',
    caution: 'Can stain skin severely — use gloves and protect skin. Juglone (active compound) is a natural toxin to some plants.',
    preparation: 'Black walnut hull powder mixed with water; or black walnut oil in hair',
  },
  coffee: {
    name: 'Coffee',
    what: 'Brewed strong coffee used as a temporary hair stain — adds brown tones temporarily',
    colour: 'Light to medium brown tones; temporary (washes out in 1–3 washes)',
    use: 'Strong brewed coffee mixed with used coffee grounds; apply to hair, leave 1 hour, rinse',
    sustainability: 'Excellent use for leftover coffee grounds',
    best_on: 'Brunette to medium brown hair for tonal enhancement; adds warmth',
  },
  chamomile: {
    name: 'Chamomile',
    what: 'Strong chamomile tea used as a hair rinse for lightening and brightening',
    colour: 'Subtle golden lightening on blonde hair; adds warmth to lighter browns',
    use: 'Brew very strong chamomile tea, cool, pour over hair, sit in sun for 1–2 hours, rinse',
    best_on: 'Blonde to light brown hair; no effect on dark hair',
  },
  beetroot: {
    name: 'Beetroot',
    what: 'Beetroot juice applied to hair for temporary red-pink tones',
    colour: 'Red-pink; temporary (1–5 washes)',
    use: 'Fresh beetroot juice + coconut oil; apply, cover, leave 1 hour, rinse',
    caution: 'Stains everything; very temporary',
    best_on: 'Light hair for dramatic temporary colour; subtle on dark hair',
  },
};

// ─── HAIR CARE AFTER NATURAL DYE ─────────────────────────────────────────────

export const AFTER_NATURAL_DYE_CARE = {
  first_24_hours: [
    'Do NOT shampoo for 24–48 hours after henna/indigo — the dye is still oxidising and deepening',
    'Do NOT use clarifying shampoo for 1 week',
    'Deep condition if hair feels dry after rinsing',
  ],
  maintaining_colour: [
    'Sulphate-free shampoo extends colour life',
    'Cold water rinses preserve the dye bond',
    'Avoid chlorine (pool water fades natural colour rapidly)',
    'Touch up roots every 6–8 weeks for grey coverage',
  ],
  troubleshooting: {
    orange_not_brown: 'Needed longer processing time, or needs an indigo top layer',
    colour_faded_quickly: 'Hair may have been too clean/product-heavy — dye needs to bond to clean, product-free hair',
    uneven_coverage: 'Natural dyes don\'t penetrate like chemicals — variation is natural; reapply to stubborn sections',
    stiff_hair_after_henna: 'Add amla to next application; use a conditioning rinse post-henna (coconut milk, deep conditioner)',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getDyeForDesiredColour(desiredColour) {
  const colourMap = {
    'red': 'henna',
    'auburn': 'henna',
    'copper': 'henna',
    'brown': 'henna + indigo',
    'dark brown': 'henna + indigo (high indigo ratio)',
    'black': 'two-step henna then indigo',
    'conditioning only': 'cassia',
    'blonde highlights': 'chamomile rinse',
    'golden': 'cassia on light hair',
  };
  const key = Object.keys(colourMap).find(k => desiredColour.toLowerCase().includes(k));
  return key ? { colour: key, method: colourMap[key] } : null;
}

export function getHennaGuide() {
  return HENNA;
}

export function getIndigoGuide() {
  return INDIGO;
}

export function getCassiaGuide() {
  return CASSIA;
}

export function getAllNaturalDyes() {
  return { henna: HENNA, indigo: INDIGO, cassia: CASSIA, amla: AMLA_FOR_HAIR, ...OTHER_PLANT_DYES };
}

export function getAfterCarePlan() {
  return AFTER_NATURAL_DYE_CARE;
}

export const NATURAL_DYE_STATS = {
  primaryDyes: 3,
  supplementaryDyes: Object.keys(OTHER_PLANT_DYES).length,
  hennaRecipes: Object.keys(HENNA.recipes).length,
  colourRangesForHennaIndigo: Object.keys(INDIGO.colour_range).length,
};
