/**
 * MIRRR Beard Grooming — Ethnic Communities
 * Beard care, styling, growth, and community traditions
 * across all 9 ethnic communities
 */

// ─── BEARD BIOLOGY ────────────────────────────────────────────────────────────

export const BEARD_BIOLOGY = {
  growth_cycle: {
    anagen: 'The active growth phase for facial hair. Facial hair anagen phase is shorter than scalp hair (2-6 years for scalp vs 1-2 years for beard), which is why beard hair has a maximum length it can reach.',
    catagen: 'Transition phase — 2-3 weeks.',
    telogen: 'Resting/shedding phase. The follicle rests, then pushes the old hair out as a new one begins to grow.',
  },
  androgens: {
    role: 'Beard growth is primarily driven by androgens — specifically dihydrotestosterone (DHT). DHT is converted from testosterone by the enzyme 5-alpha-reductase in the hair follicle.',
    genetics: 'The density of androgen receptors in facial hair follicles is genetically determined. This explains why men with similar testosterone levels can have vastly different beard density.',
    note: 'Beard hair follicles are paradoxically STIMULATED by DHT (which makes beard grow thicker) while scalp hair follicles in genetically predisposed individuals are INHIBITED by DHT (causing male pattern baldness). Same hormone, opposite effects in different follicles.',
  },
  texture: {
    straight: 'Round cross-section follicle, sebum flows easily along shaft. Common in East Asian men.',
    wavy: 'Slightly oval cross-section. Common in South Asian, Arab, Latina (male) communities.',
    coily_curly: 'Highly elliptical/flat cross-section. Hair curls back on itself. Common in West African, East African, Black American communities. Sebum cannot flow easily along the coiled shaft — beard dryness and ingrown hairs are primary concerns.',
  },
  ingrown_hairs: {
    what: 'A hair that curls back and re-enters the skin, or fails to emerge from the follicle. Can cause papules, pustules, and PIH. More common in coily beard hair (pseudofolliculitis barbae — PFB).',
    causes: 'Shaving too close, shaving against the grain with coily hair, dead skin cell buildup blocking the follicle exit.',
    treatment: 'BHA (salicylic acid) in a beard wash or toner. Single-blade razor. Shaving with the grain. Not against the grain for coily hair. Warm water to soften before shaving. Exfoliation. Benzoyl peroxide for infected ingrowns. Laser hair removal for severe PFB.',
  },
};

// ─── BEARD SKIN CARE ──────────────────────────────────────────────────────────

export const BEARD_SKIN_CARE = {
  cleansing: {
    why: 'Skin under the beard accumulates sebum, dead skin cells (can cause beardruff — beard dandruff), food particles, and product buildup.',
    how: 'Wash beard 2-3x per week with a gentle cleanser or dedicated beard wash. Daily washing can strip essential sebum, causing dryness and itching.',
    products: 'Gentle foaming cleanser, or dedicated beard shampoo (pH-balanced for facial skin, not hair shampoo which is pH-balanced for scalp).',
    beardruff: 'Flaking skin under the beard (beardruff) can result from: overly dry skin (use a beard oil), seborrhoeic dermatitis (use a ketoconazole-based wash 2-3x/week), or product buildup (clarify the beard). Tea tree oil has antifungal properties for seborrhoeic dermatitis management.',
  },
  moisturising: {
    why: 'Beard hair absorbs moisture from the underlying skin. The coarser beard hair also creates a physical barrier that prevents moisturiser from reaching the skin.',
    how: 'Apply moisturiser to the face including the beard area, pressing through the beard to reach the skin.',
    under_beard_itch: 'New beard growth itch (first 2-4 weeks): new hairs are stiff and sharp — the tip scratches surrounding skin as the hair curls. Moisturising the skin reduces itching. The itch usually subsides as hairs soften with length.',
  },
  spf: 'Do not neglect SPF on the face just because there is a beard. Exposed skin above and below the beard, and any skin visible through beard gaps, still requires SPF.',
};

// ─── BEARD OILS ───────────────────────────────────────────────────────────────

export const BEARD_OIL_GUIDE = {
  what_it_does: 'Beard oil moisturises and softens both the beard hair and the underlying skin. It replaces the sebum that cannot naturally travel down coily/curly beard hair to the tips.',
  carrier_oils: {
    jojoba: {
      oil: 'Jojoba oil',
      why: 'Most similar to human sebum — excellent skin compatibility, non-comedogenic. The standard base for most beard oils.',
    },
    argan: {
      oil: 'Argan oil',
      why: 'Rich in oleic acid and vitamin E. Softens coarse beard hair. Traditional for Arab communities.',
    },
    sweet_almond: {
      oil: 'Sweet almond oil',
      why: 'Lightweight, excellent for sensitive skin under the beard.',
    },
    castor: {
      oil: 'Castor oil',
      why: 'Thick, promotes the appearance of thicker, denser beard. Contains ricinoleic acid.',
      use: 'Usually blended with lighter oils (1:3 ratio with jojoba) rather than used alone.',
    },
    coconut: {
      oil: 'Coconut oil',
      why: 'Very moisturising. Has antimicrobial properties. Can be comedogenic for some skin types — use with caution if prone to under-beard breakouts.',
    },
    shea: {
      oil: 'Shea oil / Shea butter (melted)',
      why: 'Extremely moisturising for dry, coily beard hair. Traditional West African and Black American use.',
    },
  },
  essential_oils: {
    note: 'Essential oils provide scent and some functional benefits but MUST be diluted — never apply to skin undiluted.',
    eucalyptus: 'Refreshing, some research suggests may support hair follicle stimulation.',
    peppermint: 'Cooling, increases blood circulation, some evidence for hair growth.',
    tea_tree: 'Antifungal and antibacterial — for beardruff or under-beard acne.',
    cedarwood: 'Woody scent, traditionally associated with men\'s grooming products.',
    sandalwood: 'Warm woody scent. Common in South Asian grooming traditions.',
    dilution: '2-3 drops essential oil per 30ml carrier oil (0.5-1% dilution for sensitive facial skin).',
  },
  how_to_apply: {
    step1: 'Wash beard (or apply after shower when beard is slightly damp).',
    step2: 'Add 3-6 drops of beard oil to palm (adjust for beard length — longer beards need more).',
    step3: 'Rub palms together to warm oil.',
    step4: 'Work oil through beard from skin outward, reaching the skin underneath.',
    step5: 'Use a beard comb or brush to distribute evenly.',
    timing: 'Once daily — morning or after showering.',
  },
};

// ─── BEARD BALM AND BUTTER ────────────────────────────────────────────────────

export const BEARD_BALM_BUTTER = {
  beard_balm: {
    what: 'A thicker product combining oils, butters (usually shea), and a light wax (beeswax). Provides moisture + light styling hold.',
    best_for: 'Short to medium beards that need some shaping. Daily grooming product.',
    hold: 'Light to medium hold. Not as heavy as a styling wax.',
  },
  beard_butter: {
    what: 'Similar to balm but usually wax-free — just oils and butters blended together. Primarily a conditioning treatment, minimal hold.',
    best_for: 'Very dry, coarse beard hair. Thick, coily beards that need deep moisture without stiffness.',
    community: 'Particularly popular in Black American beard care communities where very coily, dry beard hair needs intensive moisture.',
  },
  beard_wax: {
    what: 'Higher beeswax content, providing strong hold for shaping moustaches, handlebar styles, or unruly beard ends.',
    best_for: 'Styling and shaping. Not a primary conditioning product.',
  },
};

// ─── SHAVING ─────────────────────────────────────────────────────────────────

export const SHAVING_GUIDE = {
  preparation: {
    warm_water: 'Wash face with warm water or apply a warm, damp towel for 1-2 minutes. Softens beard hair, reducing the force required to cut — which means less tug-and-cut (reducing ingrown risk) and less razor blade drag.',
    pre_shave_oil: 'A thin layer of pre-shave oil provides a lubrication layer between skin and blade, reducing friction and irritation.',
  },
  shave_cream_gel: {
    cream: 'Traditional shave cream (brushed on) creates a rich lather that lifts hair for a closer shave and provides lubrication.',
    gel: 'Shave gel (clear) allows better visibility of the shave area. Often more suitable for detailing beard lines.',
    note: 'Avoid menthol in shave products for sensitive or dry skin — it provides a cooling sensation but can be drying.',
  },
  razors: {
    single_blade: {
      type: 'Single blade (safety razor)',
      how: 'Cuts cleanly at skin level without the repeated passes of multi-blade razors.',
      best_for: 'Coily/curly beard hair and ingrown-prone skin. Multi-blade razors pull the hair out and cut it below the surface — when the hair retracts, the cut end is below the skin surface, predisposing to ingrowns.',
      learning_curve: 'Requires angle control — 30-degree angle against skin. More technique needed than multi-blade.',
    },
    multi_blade: {
      type: 'Multi-blade (2-5 blades)',
      how: 'First blade pulls hair, subsequent blades cut. This can result in sub-skin-surface cutting.',
      note: 'More convenient but higher ingrown risk for coily hair.',
      mitigation: 'Shave with the grain (not against). One pass only. Rinse between strokes. Replace blade every 5-7 shaves.',
    },
    electric: {
      type: 'Electric razor',
      types: 'Rotary vs foil. Foil (parallel blades) works well with straight/wavy hair. Rotary (circular heads) can work with coily hair.',
      note: 'Generally less close than wet shaving — good for maintaining a stubble look. Reduces ingrown risk versus multi-blade wet shaving.',
    },
  },
  technique: {
    direction: 'Always shave WITH the grain (in the direction hair grows) for the first pass. Against-the-grain shaving increases closeness but dramatically increases ingrown risk for coily hair.',
    pressure: 'Use minimal pressure — let the blade do the work. Pressing hard increases razor burn and ingrown risk.',
    rinse: 'Rinse blade after each stroke to clear cut hairs.',
    finish: 'Rinse with cold water (not ice cold — just cool). Reduces redness and tightens pores.',
  },
  aftershave: {
    alcohol_based: 'Traditional alcohol aftershaves have antiseptic properties but strip moisture and can cause severe dryness, especially for coily-beard communities prone to dry skin. Avoid on dry or sensitive skin.',
    balm: 'Alcohol-free aftershave balm with aloe vera, allantoin, and panthenol is far more skin-friendly. Soothes razor burn, reduces redness, moisturises.',
    bha: 'A salicylic acid toner (2%) applied post-shave as "aftershave" is an excellent technique for ingrown-prone individuals — keeps the follicle exit clear.',
  },
};

// ─── BEARD STYLING ────────────────────────────────────────────────────────────

export const BEARD_STYLES = {
  short_stubble: {
    style: 'Short Stubble (1-3mm)',
    tools: 'Trimmer with guard set to 1-2mm. Edge with detail trimmer.',
    maintenance: 'Every 2-3 days to maintain even length.',
    suits: 'Most face shapes. Very low maintenance.',
  },
  medium_stubble: {
    style: 'Medium Stubble (3-6mm)',
    tools: 'Trimmer with guard 3-4mm. Edge cheek and neckline.',
    maintenance: 'Every 3-5 days.',
    note: 'Often considered the most universally flattering beard length.',
  },
  short_box_beard: {
    style: 'Short Box Beard',
    length: '1-2cm',
    shaping: 'Clean cheek line. Neckline 1-2 fingers above Adam\'s apple. Full coverage.',
    tools: 'Trimmer for length maintenance. Straight razor or detail trimmer for edges.',
    community: 'Very popular in Arab, South Asian, and Black American communities.',
  },
  full_beard: {
    style: 'Full Beard',
    length: '2cm+',
    shaping: 'Natural or shaped cheek line. Clean neckline. Shape with beard comb and scissors for evenness.',
    care: 'Requires most conditioning — beard oil and beard balm essential. Beard comb to prevent tangles.',
  },
  bald_with_beard: {
    style: 'Bald Head with Beard (Balbo-adjacent)',
    note: 'The "bald with beard" look is a popular style in Black American, Arab, and West African communities. Creates strong facial framing when the head is shaved.',
    care: 'Scalp SPF essential when head is fully shaved — scalp is highly sun-exposed.',
  },
  moustache_only: {
    style: 'Moustache styles',
    types: 'Natural / full moustache. Pencil thin moustache (Mexican cultural icon). Handlebar (waxed ends). Chevron (thick, classic).',
    care: 'Beard scissors for trimming. Beard wax for handlebar styles.',
  },
};

// ─── ETHNIC BEARD CULTURE ─────────────────────────────────────────────────────

export const ETHNIC_BEARD_CULTURE = {
  west_african: {
    community: 'West African',
    traditions: 'Beards in West African cultures have significant status connotations — elders and senior figures traditionally wore fuller beards as a sign of wisdom and authority. In contemporary West African style, well-groomed beards and precision fades have become fashion statements.',
    common_concerns: 'Pseudofolliculitis barbae (razor bumps) from coily beard hair. PIH from razor bumps. Dry, brittle beard hair requiring significant moisture (shea oil, beard butter). Ingrown hairs.',
    care_tips: 'Single-blade razor or electric razor for shaving. Salicylic acid toner post-shave. Shea-based beard butter for deep moisture. Proper beard oil daily for coily beard management.',
    popular_styles: 'Short-to-medium box beards with clean edges. Bald head with full beard. Skin fades with beard.',
  },
  south_asian: {
    community: 'South Asian',
    traditions: 'Beards carry significant cultural and religious meaning. In Sikhism, kesh (unshorn hair including beard) is one of the Five Ks — an article of faith. Many Sikh men keep full, uncut beards (often tied or wrapped in a dastaar/turban). In mainstream Hindu and Muslim South Asian culture, well-groomed beards are fashionable and associated with masculinity.',
    common_concerns: 'Wavy to curly beard hair with moderate ingrown tendency. Patchy beard growth in some South Asian men. Slightly oily skin requiring a non-comedogenic beard oil.',
    care_tips: 'Mustard oil (traditional South Asian beard and scalp oil) as a pre-shave treatment. Argan or jojoba beard oil for daily use. Beard comb for wavy beards.',
    sikh_specific: 'Dastar (turban) beards require specific care: beard combing and application of beard oil/wax to keep the beard neat and manageable for wrapping. The Sikh beard is often groomed with a kanga (a sacred comb) multiple times daily.',
    popular_styles: 'Short stubble, medium box beard, or (for Sikh men) full natural beard. The "desi beard" — medium full beard — is a recognisable subcultural style.',
  },
  caribbean: {
    community: 'Caribbean',
    traditions: 'Caribbean men have a strong beard culture, influenced by African traditions and the Rastafari movement. In Rastafarianism, beard and dreadlock cultivation (growing locks) are deeply spiritual practices.',
    common_concerns: 'Coily beard hair — same ingrown and dryness concerns as West African community. PFB (pseudofolliculitis barbae).',
    care_tips: 'Same as West African coily beard care. Coconut oil is a traditional Caribbean grooming oil for both hair and beard.',
    popular_styles: 'Natural full beard (especially in Rastafari). Short clean box beard. Stubble with skin fades.',
  },
  arab: {
    community: 'Arab',
    traditions: 'Beards have significant religious (Islamic) and cultural meaning. In Islamic tradition, growing a beard (lihya) is a Sunnah — a practice of the Prophet. The degree of observance varies, from a trimmed full beard to a more comprehensive natural beard. Arab men have historically been associated with well-groomed, often scented beards.',
    common_concerns: 'Wavy to curly beard hair. Good natural beard growth in many Arab men (androgen levels and follicle density). Oilier skin requiring lightweight beard oil.',
    care_tips: 'Argan oil is the traditional Arab beard and skin oil — deeply embedded in Moroccan and Levantine grooming cultures. Oud-scented beard oils are traditional in Gulf Arab culture.',
    scenting: 'Fragrance is significant in Arab grooming. Oud, musk, and rose water are traditionally used to scent the beard — a practice with deep historical roots.',
    popular_styles: 'Full, well-maintained beard is the most common and culturally significant style. Short stubble also popular in contemporary Arab men\'s fashion. Clean, precise cheek lines.',
  },
  east_asian: {
    community: 'East Asian',
    traditions: 'East Asian men generally have sparser facial hair compared to communities with Middle Eastern, South Asian, or African ancestry, due to genetic differences in androgen receptor density in facial follicles. This does not mean no beard culture — contemporary East Asian men\'s fashion increasingly embraces stubble and light beard styles.',
    common_concerns: 'Lower beard density and coverage — patchiness is common. Straight hair texture reduces ingrown hair concern significantly. Oilier skin in some East Asian individuals.',
    care_tips: 'For sparse beards: focus on grooming what is there neatly rather than trying to fill in coverage. Minoxidil (5%) applied to beard area has evidence for improving beard density — some East Asian men use it for this purpose (off-label use).',
    popular_styles: 'Short, clean stubble. Precise moustache. Light scruff. Full beard is less common due to natural density.',
  },
  black_american: {
    community: 'Black American',
    traditions: 'Beard culture is a significant part of Black American men\'s grooming and identity. The "waves and beard" combination is an iconic Black American style. The precise edge-up (lines carved at hairline, beard line, and cheek line by a barber) is a cornerstone of Black American grooming culture. The barbershop itself is a cultural institution in Black American communities.',
    common_concerns: 'PFB (pseudofolliculitis barbae / razor bumps) — THE primary beard skin concern. Coily beard hair that curls back and pierces the skin. PIH from razor bumps. Dry, brittle beard hair. Ingrown hairs.',
    care_tips: {
      pbf_management: 'Single-blade safety razor or Bevel razor (designed specifically for PFB — single-blade, weighted, for coily beard hair). Shave with the grain only. BHA (salicylic acid) toner post-shave. PFB Vanish bump eraser (specific commercial product). Laser hair removal for severe cases.',
      moisture: 'Black beard hair is often very dry — beard butter, shea-based products, and daily beard oil are essential.',
      barber: 'Regular barber visits for precise edge-ups are non-negotiable in Black American beard culture — the edge is part of the style.',
    },
    popular_styles: 'Full box beard with precision edge-up. Bald head with full beard. Short stubble with precise edges. Waves + beard combinations.',
    barbershop: 'The Black American barbershop provides a specific beard grooming service: the straight razor edge-up, which creates the clean geometric lines at the beard boundary. This is a skill-intensive service performed with a professional straight razor.',
  },
  east_african: {
    community: 'East African',
    traditions: 'East African beard culture is influenced by both Islamic traditions (in Ethiopia, Eritrea, Djibouti, Somalia) and traditional cultural norms. Ethiopian Orthodox Christian priests historically maintained significant beards.',
    common_concerns: 'Coily to slightly wavy beard hair. PFB risk. Dryness.',
    care_tips: 'Similar to West African care. Neem oil (traditional East African skin and hair care ingredient) has antimicrobial properties that may help with under-beard acne and PFB.',
    popular_styles: 'Medium to full beard in Islamic communities. Contemporary Ethiopian and Eritrean urban style: trimmed full beards and precise edge-ups.',
  },
  south_african: {
    community: 'South African',
    traditions: 'South Africa\'s diverse population means diverse beard culture. Zulu, Xhosa, and Sotho communities traditionally had specific cultural practices around facial hair. Contemporary South African Black men\'s grooming increasingly parallels Black American trends (box beards, fades, precise edges).',
    common_concerns: 'Similar to West African for very dark Fitzpatrick V-VI South African men. PFB, coily hair dryness, PIH.',
    care_tips: 'Rooibos-infused beard products (a South African innovation) — rooibos tea has anti-inflammatory antioxidants that may soothe irritated skin from PFB.',
    popular_styles: 'Box beard with clean edges. Short stubble. Full natural beard.',
  },
  latina: {
    community: 'Latina (Male)',
    traditions: 'Latin American men\'s beard culture varies significantly by region and ethnicity. Mexican charro culture, Cuban guayabera culture, and various Indigenous traditions each have different beard associations.',
    common_concerns: 'Wavy to curly beard hair — moderate ingrown tendency. Good general beard growth. Some patchiness in Indigenous-background Latin American men.',
    care_tips: 'Light beard oils with citrus or herbal scents (lime, bay rum) align with Latin American grooming traditions. Bay rum is a classic Caribbean and Latin American aftershave.',
    popular_styles: 'Short or medium box beards. Stubble. Well-maintained moustache (iconic in Mexican and Cuban culture). The telenovela-style light stubble.',
  },
};

// ─── BEARD GROWTH SUPPORT ─────────────────────────────────────────────────────

export const BEARD_GROWTH_SUPPORT = {
  realistic_expectations: 'Beard density and pattern are largely genetic. No product can create beard follicles that do not exist. However, optimising existing follicle health and addressing hormonal factors can support beard growth.',
  general_health: 'Adequate sleep (testosterone and growth hormone peak during sleep). Stress management (cortisol suppresses testosterone). Good nutrition. Exercise (raises testosterone).',
  nutrition: 'Zinc (required for testosterone production and follicle health). Biotin (supports keratin production — the structural protein of beard hair). Adequate dietary protein.',
  minoxidil: {
    what: 'Minoxidil (Rogaine) — originally a blood pressure medication found to have the side effect of hair growth. Now used off-label for beard growth.',
    how_it_works: 'Dilates blood vessels around the follicle, increasing nutrient and oxygen delivery. May extend the anagen (growth) phase of the follicle.',
    use: 'Applied to beard area 1-2x daily. Results seen after 3-6 months of consistent use.',
    caution: 'Not officially indicated for beard use. Must be used continuously — beard growth gained may regress if discontinued. Side effects: skin dryness, irritation. Consult a doctor before use.',
    ethnicnote: 'Some East Asian men with naturally sparse beards have reported significant density improvement with beard minoxidil. Results vary individually.',
  },
  dermaroller: 'Microneedling/dermarolling (0.5-0.75mm) over beard area — may stimulate blood flow and growth factor release. Often used in combination with minoxidil. Limited but growing evidence.',
  what_doesnt_work: 'Shaving does NOT make beard grow back thicker — this is a myth. The blunt cut end of the emerging hair looks thicker but the follicle and growth rate are unchanged.',
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getBeardBiology() { return BEARD_BIOLOGY; }
export function getBeardSkinCare() { return BEARD_SKIN_CARE; }
export function getBeardOilGuide(oil) {
  return oil ? BEARD_OIL_GUIDE.carrier_oils[oil] : BEARD_OIL_GUIDE;
}
export function getBeardBalmButter() { return BEARD_BALM_BUTTER; }
export function getShavingGuide(section) {
  return section ? SHAVING_GUIDE[section] : SHAVING_GUIDE;
}
export function getBeardStyles(style) {
  return style ? BEARD_STYLES[style] : BEARD_STYLES;
}
export function getEthnicBeardCulture(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_BEARD_CULTURE[key] || Object.values(ETHNIC_BEARD_CULTURE);
}
export function getBeardGrowthSupport() { return BEARD_GROWTH_SUPPORT; }

export const BEARD_GROOMING_STATS = {
  ethnicEntries: Object.keys(ETHNIC_BEARD_CULTURE).length,
  beardStyles: Object.keys(BEARD_STYLES).length,
  carrierOils: Object.keys(BEARD_OIL_GUIDE.carrier_oils).length,
  razorTypes: Object.keys(SHAVING_GUIDE.razors).length,
};
