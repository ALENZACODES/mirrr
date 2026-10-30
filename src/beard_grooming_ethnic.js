/**
 * MIRRR Beard Grooming — Ethnic Communities
 * Beard care, styling, growth, and community traditions
 * across all 9 ethnic communities
 */

export const BEARD_BIOLOGY = {
  growth_cycle: {
    anagen: 'The active growth phase. Beard hair has a much shorter growth phase than scalp hair, which is why most beards stop growing at a certain length.',
    catagen: 'Transition phase — 2-3 weeks.',
    telogen: 'Resting/shedding phase. The follicle rests, then pushes the old hair out as a new one begins to grow.',
  },
  androgens: {
    role: 'Beard growth is primarily driven by androgens — specifically dihydrotestosterone (DHT). DHT is converted from testosterone by the enzyme 5-alpha-reductase in the hair follicle.',
    genetics: 'The density of androgen receptors in facial hair follicles is genetically determined. This explains why men with similar testosterone levels can have vastly different beard density.',
    note: 'Beard hair follicles are paradoxically STIMULATED by DHT (which makes beard grow thicker) while scalp hair follicles in genetically predisposed individuals are INHIBITED by DHT (causing male pattern baldness). Same hormone, opposite effects in different follicles.',
  },
  texture: {
    straight: 'Round cross-section; oil travels easily along the hair, and ingrown hairs are less likely.',
    wavy: 'Slightly oval cross-section; some ingrown hairs, especially after close shaves.',
    coily_curly: 'Flat, elliptical cross-section, so the hair curls back on itself. Oil cannot travel easily along a coiled hair, so dryness and ingrown hairs (razor bumps) are the main concerns.',
  },
  ingrown_hairs: {
    what: 'A hair that curls back and re-enters the skin, or fails to emerge from the follicle. Can cause papules, pustules, and PIH. More common in coily beard hair (pseudofolliculitis barbae — PFB).',
    causes: 'Shaving too close, shaving against the grain with coily hair, dead skin cell buildup blocking the follicle exit.',
    treatment: 'Salicylic acid in a beard wash or toner. A single-blade razor or a clipper with a guard. Shave with the grain, never against it if your beard is coily. Warm water first. For infected bumps see a doctor. Laser hair removal for severe cases (Nd:YAG lasers are the safe type for deeper skin).',
  },
};

export const BEARD_SKIN_CARE = {
  cleansing: {
    why: 'Skin under the beard accumulates sebum, dead skin cells (can cause beardruff — beard dandruff), food particles, and product buildup.',
    how: 'Wash beard 2-3x per week with a gentle cleanser or dedicated beard wash. Daily washing can strip essential sebum, causing dryness and itching.',
    products: 'Gentle foaming cleanser, or dedicated beard shampoo (pH-balanced for facial skin, not hair shampoo which is pH-balanced for scalp).',
    beardruff: 'Flaking skin under the beard (beardruff) can result from: overly dry skin (use a beard oil), seborrhoeic dermatitis (use a ketoconazole-based wash 2-3x/week), or product buildup (clarify the beard). Tea tree oil has antifungal properties for seborrhoeic dermatitis management.',
  },
  moisturising: {
    why: 'A beard makes it harder for moisturiser to reach the skin underneath, and the skin there can get dry and itchy.',
    how: 'Apply moisturiser to the face including the beard area, pressing through the beard to reach the skin.',
    under_beard_itch: 'New beard growth itch (first 2-4 weeks): new hairs are stiff and sharp — the tip scratches surrounding skin as the hair curls. Moisturising the skin reduces itching. The itch usually subsides as hairs soften with length.',
  },
  spf: 'Do not neglect SPF on the face just because there is a beard. Exposed skin above and below the beard, and any skin visible through beard gaps, still requires SPF.',
};

export const BEARD_OIL_GUIDE = {
  what_it_does: 'Beard oil softens beard hair and moisturises the skin underneath. It helps most with curly and coily beards, where the skin\'s own oil cannot travel to the tips.',
  carrier_oils: {
    jojoba: { oil: 'Jojoba oil', why: 'Most similar to human sebum — excellent skin compatibility, non-comedogenic. The standard base for most beard oils.' },
    argan: { oil: 'Argan oil', why: 'Rich in oleic acid and vitamin E; softens coarse beard hair. Traditional in Morocco.' },
    sweet_almond: { oil: 'Sweet almond oil', why: 'Lightweight, excellent for sensitive skin under the beard.' },
    castor: {
      oil: 'Castor oil',
      why: 'Thick and coating, with ricinoleic acid. It makes hairs look fuller; it does not grow new ones.',
      use: 'Usually blended with lighter oils (1:3 ratio with jojoba) rather than used alone.',
    },
    coconut: { oil: 'Coconut oil', why: 'Very moisturising. Has antimicrobial properties. Can be comedogenic for some skin types — use with caution if prone to under-beard breakouts.' },
    shea: { oil: 'Shea oil / Shea butter (melted)', why: 'Very moisturising for dry, coily beard hair. A West African staple.' },
  },
  essential_oils: {
    note: 'Essential oils provide scent and some functional benefits but MUST be diluted — never apply to skin undiluted.',
    peppermint: 'Cooling scent; can sting, so keep it very dilute and away from the eyes.',
    tea_tree: 'Can help with beard flakes; can irritate or cause allergy, so patch test.',
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

export const BEARD_BALM_BUTTER = {
  beard_balm: {
    what: 'A thicker product combining oils, butters (usually shea), and a light wax (beeswax). Provides moisture + light styling hold.',
    best_for: 'Short to medium beards that need some shaping. Daily grooming product.',
    hold: 'Light to medium hold. Not as heavy as a styling wax.',
  },
  beard_butter: {
    what: 'Similar to balm but usually wax-free — just oils and butters blended together. Primarily a conditioning treatment, minimal hold.',
    best_for: 'Very dry, coarse beard hair. Thick, coily beards that need deep moisture without stiffness.',
  },
  beard_wax: { what: 'Higher beeswax content, providing strong hold for shaping moustaches, handlebar styles, or unruly beard ends.', best_for: 'Styling and shaping. Not a primary conditioning product.' },
};

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
      types: 'Rotary and foil shavers both cut above the skin; try each to see which irritates you less.',
      note: 'Generally less close than wet shaving — good for maintaining a stubble look. Reduces ingrown risk versus multi-blade wet shaving.',
    },
  },
  technique: {
    direction: 'Shave WITH the grain (the way the hair grows). Going against the grain gives a closer shave but greatly increases ingrown hairs, especially with coily hair.',
    pressure: 'Use minimal pressure — let the blade do the work. Pressing hard increases razor burn and ingrown risk.',
    rinse: 'Rinse blade after each stroke to clear cut hairs.',
    finish: 'Rinse with cool water to calm redness.',
  },
  aftershave: {
    alcohol_based: 'Alcohol aftershaves sting and dry the skin. Avoid them on dry or sensitive skin.',
    balm: 'Alcohol-free aftershave balm with aloe vera, allantoin, and panthenol is far more skin-friendly. Soothes razor burn, reduces redness, moisturises.',
    bha: 'A salicylic acid toner (2%) applied post-shave as "aftershave" is an excellent technique for ingrown-prone individuals — keeps the follicle exit clear.',
  },
};

export const BEARD_STYLES = {
  short_stubble: {
    style: 'Short Stubble (1-3mm)',
    tools: 'Trimmer with guard set to 1-2mm. Edge with detail trimmer.',
    maintenance: 'Every 2-3 days to maintain even length.',
    suits: 'Most face shapes. Very low maintenance.',
  },
  medium_stubble: { style: 'Medium Stubble (3-6mm)', tools: 'Trimmer with guard 3-4mm. Edge cheek and neckline.', maintenance: 'Every 3-5 days.' },
  short_box_beard: {
    style: 'Short Box Beard',
    length: '1-2cm',
    shaping: 'Clean cheek line. Neckline 1-2 fingers above Adam\'s apple. Full coverage.',
    tools: 'Trimmer for length maintenance. Straight razor or detail trimmer for edges.',
  },
  full_beard: {
    style: 'Full Beard',
    length: '2cm+',
    shaping: 'Natural or shaped cheek line. Clean neckline. Shape with beard comb and scissors for evenness.',
    care: 'Requires most conditioning — beard oil and beard balm essential. Beard comb to prevent tangles.',
  },
  bald_with_beard: {
    style: 'Bald Head with Beard (Balbo-adjacent)',
    note: 'A popular look everywhere; a full beard frames the face when the head is shaved.',
    care: 'Scalp SPF essential when head is fully shaved — scalp is highly sun-exposed.',
  },
  moustache_only: {
    style: 'Moustache styles',
    types: 'Natural or full moustache. Pencil (thin) moustache. Handlebar (waxed ends). Chevron (thick, classic).',
    care: 'Beard scissors for trimming. Beard wax for handlebar styles.',
  },
};

export const ETHNIC_BEARD_CULTURE = {
  west_african: {
    community: 'West African',
    traditions: 'In West African cities, a well-groomed beard and a precise fade are a fashion staple.',
    care_tips: 'If your beard is coily: a single-blade or electric razor, a salicylic acid toner after shaving, shea-based beard butter and a daily beard oil.',
    popular_styles: 'Short-to-medium box beards with clean edges. Bald head with full beard. Skin fades with beard.',
  },
  south_asian: {
    community: 'South Asian',
    traditions: 'Beards carry significant cultural and religious meaning. In Sikhism, kesh (unshorn hair including beard) is one of the Five Ks — an article of faith. Many Sikh men keep full, uncut beards (often tied or wrapped in a dastaar/turban). In mainstream Hindu and Muslim South Asian culture, well-groomed beards are fashionable and associated with masculinity.',
    care_tips: 'Mustard oil (traditional South Asian beard and scalp oil) as a pre-shave treatment. Argan or jojoba beard oil for daily use. Beard comb for wavy beards.',
    sikh_specific: 'Dastar (turban) beards require specific care: beard combing and application of beard oil/wax to keep the beard neat and manageable for wrapping. The Sikh beard is often groomed with a kanga (a sacred comb) multiple times daily.',
    popular_styles: 'Short stubble, medium box beard, or (for Sikh men) full natural beard. The "desi beard" — medium full beard — is a recognisable subcultural style.',
  },
  caribbean: {
    community: 'Caribbean',
    traditions: 'Caribbean men have a strong beard culture, influenced by African traditions and the Rastafari movement. In Rastafarianism, beard and dreadlock cultivation (growing locks) are deeply spiritual practices.',
    care_tips: 'Coconut oil is a traditional Caribbean oil for hair and beard; keep it off acne-prone skin.',
    popular_styles: 'Natural full beard (especially in Rastafari). Short clean box beard. Stubble with skin fades.',
  },
  arab: {
    community: 'Arab',
    traditions: 'Beards have significant religious (Islamic) and cultural meaning. In Islamic tradition, growing a beard (lihya) is a Sunnah — a practice of the Prophet. The degree of observance varies, from a trimmed full beard to a more comprehensive natural beard. Arab men have historically been associated with well-groomed, often scented beards.',
    care_tips: 'Argan oil is a traditional Moroccan beard and skin oil. In the Gulf, oud and musk are used to scent the beard.',
    scenting: 'Fragrance is significant in Arab grooming. Oud, musk, and rose water are traditionally used to scent the beard — a practice with deep historical roots.',
    popular_styles: 'Full, well-maintained beard is the most common and culturally significant style. Short stubble also popular in contemporary Arab men\'s fashion. Clean, precise cheek lines.',
  },
  east_asian: {
    community: 'East Asian',
    traditions: 'Contemporary East Asian men\'s fashion includes clean shaves as well as stubble and light beards.',
    care_tips: 'For a sparse beard: groom what is there neatly. Minoxidil on the beard is an off-label use with some trial evidence; ask a doctor first.',
    popular_styles: 'Short, clean stubble. A precise moustache. Light scruff.',
  },
  black_american: {
    community: 'Black American',
    traditions: 'Beard culture is a significant part of Black American men\'s grooming and identity. The "waves and beard" combination is an iconic Black American style. The precise edge-up (lines carved at hairline, beard line, and cheek line by a barber) is a cornerstone of Black American grooming culture. The barbershop itself is a cultural institution in Black American communities.',
    care_tips: {
      pbf_management: 'A single-blade safety razor or a clipper with a guard. Shave with the grain only. A salicylic acid toner after shaving. Laser hair removal (Nd:YAG) for severe razor bumps.',
      moisture: 'Coily beard hair tends to be dry: beard butter, shea-based products and a daily beard oil help.',
      barber: 'Regular barber visits for a precise edge-up are part of the style.',
    },
    popular_styles: 'Full box beard with precision edge-up. Bald head with full beard. Short stubble with precise edges. Waves + beard combinations.',
    barbershop: 'The Black American barbershop provides a specific beard grooming service: the straight razor edge-up, which creates the clean geometric lines at the beard boundary. This is a skill-intensive service performed with a professional straight razor.',
  },
  east_african: {
    community: 'East African',
    traditions: 'East African beard culture draws on Islamic tradition (especially in Somalia and Djibouti, and among Muslims in Ethiopia and Eritrea) and on local norms. Ethiopian Orthodox priests have traditionally worn full beards.',
    care_tips: 'Neem oil (mwarubaini in Swahili) is a traditional East African remedy; a few drops in a carrier oil may help with under-beard spots. Patch test first.',
    popular_styles: 'Medium to full beard in Islamic communities. Contemporary Ethiopian and Eritrean urban style: trimmed full beards and precise edge-ups.',
  },
  south_african: {
    community: 'South African',
    traditions: 'South Africa\'s beard styles are as varied as its communities; box beards, fades and sharp edges are popular in Black South African barbershops.',
    care_tips: 'Cooled rooibos tea is a gentle rinse for irritated skin after shaving.',
    popular_styles: 'Box beard with clean edges. Short stubble. Full natural beard.',
  },
  latina: {
    community: 'Latina (Male)',
    traditions: 'Beard and moustache traditions vary across Latin America, from the Mexican charro moustache to clean-shaven styles.',
    care_tips: 'Light beard oils with citrus or herbal scents (lime, bay rum) align with Latin American grooming traditions. Bay rum is a classic Caribbean and Latin American aftershave.',
    popular_styles: 'Short or medium box beards. Stubble. Well-maintained moustache (iconic in Mexican and Cuban culture). The telenovela-style light stubble.',
  },
};

export const BEARD_GROWTH_SUPPORT = {
  realistic_expectations: 'Beard density and pattern are largely genetic. No product can create beard follicles that do not exist. However, optimising existing follicle health and addressing hormonal factors can support beard growth.',
  general_health: 'Enough sleep, stress management, good nutrition and regular exercise support general health, including hair.',
  nutrition: 'Enough protein, iron and zinc. Biotin only helps if you are deficient, which is rare.',
  minoxidil: {
    what: 'Minoxidil (Rogaine) — originally a blood pressure medication found to have the side effect of hair growth. Now used off-label for beard growth.',
    how_it_works: 'Dilates blood vessels around the follicle, increasing nutrient and oxygen delivery. May extend the anagen (growth) phase of the follicle.',
    use: 'Applied to beard area 1-2x daily. Results seen after 3-6 months of consistent use.',
    caution: 'Not officially indicated for beard use. Must be used continuously — beard growth gained may regress if discontinued. Side effects: skin dryness, irritation. Consult a doctor before use.',
  },
  dermaroller: 'Microneedling/dermarolling (0.5-0.75mm) over beard area — may stimulate blood flow and growth factor release. Often used in combination with minoxidil. Limited but growing evidence.',
  what_doesnt_work: 'Shaving does NOT make beard grow back thicker — this is a myth. The blunt cut end of the emerging hair looks thicker but the follicle and growth rate are unchanged.',
};

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
