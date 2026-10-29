/**
 * MIRRR Men's Grooming — Ethnic Communities
 * Skincare, haircare, style, and grooming rituals for men
 * across all 9 ethnic communities
 */

// ─── MENS GROOMING OVERVIEW ───────────────────────────────────────────────────

export const MENS_GROOMING_OVERVIEW = {
  shifting_norms: 'Men\'s grooming has expanded dramatically. The global men\'s grooming market exceeded $55 billion in 2022 and is growing. Social media (particularly TikTok and YouTube) has normalised multi-step skincare routines for men of all ethnicities.',
  unique_considerations: {
    thicker_skin: 'Male skin is on average 20-25% thicker than female skin due to higher androgen levels (testosterone increases dermal thickness). This provides more natural collagen protection but doesn\'t mean male skin requires less care.',
    higher_sebum: 'Testosterone drives significantly higher sebum production. Men\'s skin is on average oilier, with larger pores.',
    shaving_damage: 'Regular shaving creates daily micro-trauma to the skin. Razor burn, ingrown hairs, and irritation are daily concerns for those who shave.',
    later_start: 'Men often start skincare later than women, meaning more accumulated UV damage before beginning SPF use.',
    product_minimalism: 'Men generally prefer fewer steps and multi-use products.',
  },
  mens_essential_routine: {
    step1: 'Cleanser — gentle, twice daily (or once daily + water rinse for dry skin).',
    step2: 'Moisturiser with SPF — combined moisturiser+SPF in the morning is the most male-friendly format.',
    step3: 'Eye cream or serum — optional, but the under-eye area shows early aging.',
    optional_evening: 'Evening: cleanser + retinol or niacinamide serum + moisturiser.',
    minimum: 'Absolute minimum: cleanser + SPF moisturiser. Everything else is optional but beneficial.',
  },
};

// ─── SKIN TYPE GUIDE FOR MEN ──────────────────────────────────────────────────

export const MENS_SKIN_GUIDE = {
  oily: {
    type: 'Oily',
    signs: 'Shiny T-zone (forehead/nose/chin) by mid-day. Visible pores. Prone to blackheads. Makeup (if worn) breaks down quickly.',
    prevalence: 'Very common in men due to testosterone-driven sebum production.',
    routine: {
      cleanser: 'Gel or foaming cleanser with salicylic acid 0.5-2% (BHA penetrates the pore to dissolve sebum). Niacinamide in cleanser reduces long-term sebum production.',
      toner: 'Optional: salicylic acid toner or niacinamide toner.',
      moisturiser: 'Gel or fluid moisturiser — not cream. Oil-free.',
      spf: 'Fluid or gel SPF. Not cream.',
      avoid: 'Heavy creams, coconut oil, mineral oil-heavy products.',
    },
  },
  dry: {
    type: 'Dry',
    signs: 'Tightness after washing. Flaking. Less visible pores. Can feel rough.',
    prevalence: 'Less common than oily but increases with age as testosterone decreases.',
    routine: {
      cleanser: 'Cream or lotion cleanser. Micellar water for mornings.',
      moisturiser: 'Rich moisturiser with hyaluronic acid and ceramides.',
      spf: 'Tinted SPF moisturiser provides both SPF and extra moisture.',
      face_oil: 'Facial oil (squalane or rosehip) applied before or mixed into moisturiser.',
    },
  },
  combination: {
    type: 'Combination',
    signs: 'Oily T-zone, normal to dry cheeks. Most common skin type.',
    routine: 'Can zone-treat — BHA toner on T-zone only, richer moisturiser on dry cheeks.',
  },
  sensitive: {
    type: 'Sensitive',
    signs: 'Reacts to new products. Redness. Stinging/burning with some products. Post-shave irritation.',
    routine: 'Fragrance-free products. Minimal active ingredients. Patch test everything new. Gentle exfoliation (PHA or polyglutamic acid) rather than strong AHAs. Look for calming ingredients: centella asiatica, aloe vera, green tea extract.',
  },
};

// ─── MENS HAIRCARE ────────────────────────────────────────────────────────────

export const MENS_HAIRCARE = {
  scalp_types: {
    oily_scalp: 'Wash 3-5x per week. Use a lightweight clarifying shampoo. Don\'t apply conditioner to the scalp — only mid-lengths to ends.',
    dry_scalp: 'Wash 1-2x per week. Use a moisturising shampoo. Scalp massage with oil 1x per week.',
    dandruff: 'Use a medicated shampoo with zinc pyrithione, selenium sulfide, or ketoconazole 2-3x per week. Leave on for 3-5 minutes before rinsing for efficacy.',
  },
  short_hair_care: {
    note: 'Short hair (common in men) still requires scalp care, SPF on any exposed scalp (buzz cuts, fades), and moisturisation for the hair that is there.',
    styling_products: {
      pomade: 'Water-based pomades: medium hold, high shine, easy to wash out. Oil-based pomades: strong hold, high shine, harder to wash out.',
      clay: 'Hair clay: medium hold, matte finish. Adds texture and volume. Very popular in contemporary men\'s styling.',
      wax: 'Hair wax: strong hold, natural to medium shine.',
      gel: 'Strong hold, high shine. Can create a wet look (traditional) or crispy result if over-applied.',
      cream: 'Hair cream: light hold, adds moisture and definition. Good for wavy or curly men\'s hair.',
    },
  },
  fade_care: 'Men who regularly get skin fades (very short hair at the sides, tapering to skin) expose the scalp to UV. SPF application on the faded scalp areas is important.',
  low_cut_waves: 'Waves (360 waves / 720 waves) are a specific haircut style in Black American culture involving compression of coiled hair into a ripple pattern. Requires a durag or wave cap worn overnight after brushing. Moisturiser and wave grease are part of the maintenance routine.',
};

// ─── MEN'S NAIL CARE ──────────────────────────────────────────────────────────

export const MENS_NAIL_CARE = {
  basics: {
    trim: 'Trim nails regularly (every 1-2 weeks). Cut straight across and slightly round the corners. Use nail clippers for toenails, scissors or clippers for fingernails.',
    file: 'File edges smooth after cutting to prevent snags.',
    push_back: 'Push back cuticles gently after soaking (bath or shower) — do not cut cuticles, which increases infection risk.',
    moisturise: 'Apply hand cream or cuticle oil to hands and cuticles regularly.',
  },
  professional_manicure: 'A basic men\'s manicure (shaping, cuticle care, buff) is a practical grooming service increasingly sought by men of all ethnicities.',
  polish_and_gel: 'Nail polish on men is increasingly mainstream and culturally accepted — from a single neutral coat to full colour (heavily influenced by K-pop and Gen Z culture).',
};

// ─── ETHNIC MENS GROOMING CULTURE ─────────────────────────────────────────────

export const ETHNIC_MENS_GROOMING = {
  west_african: {
    community: 'West African',
    skincare_tradition: 'Shea butter has long been used by West African men for skin moisturisation and as a protective barrier. Traditional West African men\'s grooming was practical and focused on skin health in a high UV, often hot/humid climate.',
    contemporary: 'Contemporary West African men\'s grooming (particularly in Nigeria and Ghana) has embraced comprehensive skincare. "Nigerian men\'s grooming" content is widely popular on YouTube and TikTok — featuring premium skincare routines adapted for dark skin.',
    hair: 'Short fades and tapers are the standard. Waves (for softer coil patterns), TWA (teeny weeny afro), or maintained natural coil are increasingly popular.',
    common_products: 'Shea butter, black soap (dudu osun), coconut oil, vitamin C serums for pigmentation.',
    barbershop: 'The West African barbershop (often Nigerian or Ghanaian) is a cultural institution — precision fades, edge-ups, and beard grooming are core services.',
    concern: 'Ashy skin — dryness that causes grey/ashy appearance on dark skin. Resolved with adequate moisturisation. PIH from any skin trauma.',
  },
  south_asian: {
    community: 'South Asian',
    skincare_tradition: 'Oil-based skincare for men is deeply embedded in South Asian tradition — coconut oil, mustard oil, and sesame oil for hair and skin. Face packs using besan (gram flour) and turmeric were used by men and women alike.',
    contemporary: 'South Asian men\'s grooming has seen significant social media influence. The "desi skincare routine" genre is popular on YouTube — often featuring South Asian male YouTubers with comprehensive routines.',
    hair: 'South Asian men\'s hair ranges from straight to wavy. Oil treatments (champi — Indian head massage with oil) are a traditional practice for scalp health. Classic South Asian men\'s styles: undercut, side part, slick back with pomade, and more recently textured crops.',
    beard: 'Significant beard culture — see beard_grooming_ethnic for detail. The Sikh beard (kesh) is a distinct spiritual and cultural practice.',
    common_products: 'Coconut oil, mustard oil, aloe vera gel, turmeric face packs (with rosewater), vitamin C for hyperpigmentation.',
    concern: 'Oily skin, open pores, post-acne PIH.',
  },
  caribbean: {
    community: 'Caribbean',
    skincare_tradition: 'Coconut oil is the quintessential Caribbean grooming product — used on skin, hair, and beard by men and women for generations. Aloe vera (commonly grown in Caribbean home gardens) is applied directly to the skin for burns, rashes, and daily moisture.',
    contemporary: 'Caribbean men\'s grooming intersects with Black American grooming culture significantly, particularly in diaspora communities.',
    hair: 'Caribbean men\'s hair varies widely by ethnic origin. Afro-Caribbean men: skin fades, tapers, high tops, dreadlocks, cornrows. Mixed heritage men: various wave/curl patterns. Dreadlocks as a spiritual practice (Rastafarianism) or cultural style.',
    common_products: 'Coconut oil, shea butter, aloe vera, bay rum aftershave (a Caribbean tradition — derived from bay leaf essential oil in alcohol).',
    concern: 'PFB (razor bumps). PIH. Dry skin in drier island climates.',
  },
  arab: {
    community: 'Arab',
    skincare_tradition: 'Arab men\'s grooming has a rich historical tradition. Hammam (bathhouse) visits for full-body exfoliation were a communal ritual for men. Rose water, argan oil, and natural ingredients were historically used in skin and beard care.',
    contemporary: 'Gulf Arab grooming culture is extremely premium — high-end fragrances (oud, musk), luxury skincare, and meticulous grooming are cultural values. In the Levant, French-influenced skincare culture intersects with Arab tradition.',
    hair: 'Arab men\'s hair is typically wavy to curly. Popular styles: textured quiff, slick back, side part, mid-fade with styled top. Hair products with medium hold and shine finish.',
    fragrance: 'Fragrance is extremely significant in Arab men\'s culture. Oud (agarwood resin) is particularly prized. Applying oud oil or oud-containing products is a cultural ritual with deep historical roots.',
    common_products: 'Argan oil, rose water, oud oil, premium fragrances, black seed oil (Nigella sativa — used in Arab traditional medicine for skin and hair).',
    concern: 'Sun damage from high UV in MENA region. Oily skin in some Arab men. Ingrown hairs from coarser wavy beard hair.',
  },
  latina: {
    community: 'Latina (Male)',
    skincare_tradition: 'Latin American men\'s grooming is influenced by barbershop culture (the Latin barbershop — la barbería — is a community institution), traditional remedies (aloe vera, lime, avocado), and increasingly by US grooming trends in diaspora communities.',
    contemporary: 'Latin men\'s grooming content is growing on social media. Mexican-American and Puerto Rican men\'s grooming aesthetics have had significant influence on mainstream American barbershop culture.',
    hair: 'Latin American men\'s hair varies by ethnic background — from fine and straight (European background) to coily (African background) to wavy (mixed). Textured crops, undercuts, and fades are popular.',
    barbershop: 'The Latin barbershop (particularly Mexican and Cuban) has a distinct character — precision fades, temple fades, and pompadour/quiff styles.',
    common_products: 'Pomades (hair pomade is iconic in Latin American men\'s styling), aloe vera gel, lime (for skin brightening), avocado hair masks.',
    concern: 'Melasma can affect men (triggered by sun exposure and genetics). Sun damage in Latin American men with lighter skin.',
  },
  east_asian: {
    community: 'East Asian',
    skincare_tradition: 'East Asian men\'s grooming has been globally influential. Korean men\'s grooming (K-beauty for men, sometimes called "K-grooming") has normalised comprehensive skincare routines — BB creams, serums, and multi-step routines — for men in a way that has influenced global trends.',
    contemporary: 'K-pop influence has dramatically shifted East Asian (and global) men\'s grooming norms. Male K-pop and C-pop idols with flawless, dewy skin have normalised skincare as a masculine practice.',
    skin_tone_note: 'The idealised appearance in Korean pop culture — glass skin, very even tone, no visible pores — is a significant influencer of East Asian men\'s skincare ambitions.',
    hair: 'Precision styling is paramount in East Asian men\'s haircare. Popular styles: two-block cut (longer on top, faded sides), perm/perm texture (controlled waves added for volume), undercut, slick back.',
    perms: 'Korean men\'s perms (allowing styling into waves or controlled texture for Asian straight hair) are increasingly popular in East Asian men\'s salons globally.',
    common_products: 'BB creams and tinted moisturisers for men (pioneered in Korea). Cushion foundations. Snail mucin serums. Niacinamide. Hair clay for texture.',
    concern: 'Under-eye circles (vascular — blue-purple tone). Oilier T-zone. Uneven skin tone.',
    bbcream: 'BB cream (Blemish Balm) was originally developed in Korea for men who had dermatological procedures and needed light coverage. It became a foundation of Korean men\'s everyday grooming and spawned the entire Western BB cream category.',
  },
  east_african: {
    community: 'East African',
    skincare_tradition: 'Shea butter and neem oil are traditional East African skin care ingredients. Frankincense (boswellia) is an East African (Somali, Ethiopian) traditional ingredient — used as incense but also in skin preparations for its anti-inflammatory properties.',
    contemporary: 'East African diaspora men\'s grooming is influenced by both homeland traditions and host country cultures (particularly in the UK, Canada, and US).',
    hair: 'East African hair texture ranges from very tightly coiled (Somali, Eritrean) to slightly softer coil (Ethiopian). Short fades and natural styles.',
    fragrance: 'Frankincense is culturally significant — oud and incense-based fragrances are important in Ethiopian and Somali grooming traditions.',
    common_products: 'Shea butter, neem oil, frankincense oil, black seed oil.',
    concern: 'PFB in coily-beard communities. PIH. Dry skin.',
  },
  south_african: {
    community: 'South African',
    skincare_tradition: 'Rooibos (red bush tea) is uniquely South African — used in skincare for its anti-inflammatory, antioxidant properties. Traditional Zulu and Xhosa men used naturally occurring clays and plant-based preparations.',
    contemporary: 'Contemporary South African men\'s grooming parallels both Black American trends (for Black South African men) and European trends (for white South African men), with South African-specific innovations (rooibos, marula oil).',
    hair: 'Similar range to West African hair in Black South African men. Fades and tapers are standard.',
    marula_oil: 'Marula oil is a South African-origin oil (from the marula tree — also associated with wildlife and the Amarula cream liqueur). Used in luxury South African skincare for men and women.',
    common_products: 'Rooibos skincare products, marula oil, shea butter.',
    concern: 'PFB. PIH. Sun damage (UV index in South Africa is high).',
  },
  black_american: {
    community: 'Black American',
    skincare_tradition: 'Black American men\'s grooming is deeply rooted in barbershop culture — the barbershop is arguably THE central institution of Black American men\'s grooming. Vaseline (petroleum jelly) as a moisturiser, shea butter, and cocoa butter are traditional household grooming products for Black American men.',
    contemporary: 'Black men\'s grooming is experiencing a cultural moment — Black-owned grooming brands (Bevel, Scotch Porter, Mielle Organics for women, Love Beauty and Planet) and influential Black male YouTubers and TikTokers have driven comprehensive grooming adoption.',
    barbershop: 'The Black American barbershop provides: precision fades (skin fade, taper fade, burst fade, temp fade), edge-ups, beard grooming, hot towel shaves, and razor bump consultations. The barbershop is a social and cultural institution beyond just hair.',
    waves: '360 Waves (and 720 waves) are an iconic Black American men\'s hair style — compression of coily hair into a ripple pattern using brushing, durags, and wave-enhancing products.',
    skincare_routine: 'Black men\'s skincare content on social media (largely from creators like Hyram, Deion\'s grooming content, and Black male skincare influencers) emphasises: BHA for razor bumps, vitamin C for PIH, SPF (addressing the myth that dark skin doesn\'t need SPF), and retinol for anti-aging.',
    concern: 'PFB (pseudofolliculitis barbae / razor bumps) — THE dominant men\'s skin concern in the Black American community. PIH from razor bumps. Ashy skin from dryness. Hyperpigmentation.',
    bevel: 'Bevel is a Black American-founded brand specifically addressing Black men\'s grooming — single-blade razor designed for coily beard hair, priming oil pre-shave, BHA toner post-shave. Founded by Tristan Walker.',
    spf_gap: 'Surveys consistently show lower SPF adoption among Black American men versus women and versus white men. Community education around melanin\'s limits of UV protection is important.',
  },
};

// ─── MEN'S BODY CARE ──────────────────────────────────────────────────────────

export const MENS_BODY_CARE = {
  deodorant: {
    types: {
      deodorant: 'Masks odour without stopping sweating. Natural alternatives: crystal deodorant (potassium alum), charcoal.',
      antiperspirant: 'Blocks sweat glands with aluminium salts. Reduces sweating and odour. More effective for heavy sweating.',
      natural: 'Natural deodorants (without aluminium) are preferred by those concerned about aluminium. Effectiveness varies — often less effective than clinical-strength antiperspirants.',
    },
    application: 'Apply to dry skin after showering. For all-day efficacy, apply at night to allow aluminium salts to fully absorb into the gland.',
    clinical_strength: 'For hyperhidrosis (excessive sweating), clinical-strength prescription antiperspirants are available.',
  },
  body_wash: 'Men\'s body washes are often formulated for higher sebum production. A simple, non-stripping body wash is ideal. For back acne, use a salicylic acid body wash or benzoyl peroxide wash.',
  bacne: 'Back and chest acne (bacne) is common in men. Treatment: BHA body wash (salicylic acid 2%), benzoyl peroxide wash. Ensure shampoo residue is rinsed from back (shampoo down your back after washing hair). Shower immediately after exercise.',
  moisturiser: 'Men frequently skip body moisturiser. Unscented, simple lotion applied post-shower to damp skin is sufficient.',
  spf_body: 'SPF for arms and neck (commonly exposed) is relevant, particularly for men who work outdoors.',
};

// ─── MENS FRAGRANCE ───────────────────────────────────────────────────────────

export const MENS_FRAGRANCE_GUIDE = {
  families: {
    fresh: 'Citrus, aquatic, green notes. Light, clean scents. Summer appropriate. Examples: Bleu de Chanel, Acqua di Gio.',
    woody: 'Sandalwood, cedar, vetiver. Warm, grounding. Year-round. Examples: Terre d\'Hermès, Le Labo Santal 33.',
    oriental: 'Amber, vanilla, musk, oud, spices. Rich, warm, sometimes sweet. Evening and winter. Examples: Spicebomb, oud-based fragrances.',
    aromatic: 'Lavender, sage, herbs. Woody-fresh. Clean masculine classic. Examples: Drakkar Noir, Fahrenheit.',
  },
  application: {
    pulse_points: 'Wrists, neck (behind ears), inner elbow, chest. Heat amplifies fragrance projection.',
    hair: 'Hair holds fragrance well — a light spray into hair (from 30cm+ distance) can extend longevity. Avoid direct spray into beard if using an alcohol-heavy fragrance as it can be drying.',
    not_rub: 'Do NOT rub wrists together — this breaks the fragrance molecules and changes the scent profile.',
  },
  ethnic_fragrance: {
    arab: 'Oud is the fragrance of Gulf Arab culture. Heavy, warm, animalic-woody. Used as pure oil (attar) or in eau de parfum. Very long-lasting.',
    south_asian: 'Sandal (sandalwood), jasmine, rose, and musk are traditional South Asian fragrance notes. Attar (concentrated fragrance oil) tradition.',
    east_asian: 'Japanese perfumery (kōdō, the art of incense) emphasises subtle, clean, woody notes. Korean fragrance culture often features fresh, clean aquatics.',
    black_american: 'Musk, vanilla, wood notes and Afrocentric fragrance brands are increasingly prominent.',
    west_african: 'Shea, cocoa, and tropical notes. African fragrance brands drawing on West African botanicals are a growing sector.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getMensGroomingOverview() { return MENS_GROOMING_OVERVIEW; }
export function getMensSkinGuide(type) {
  return type ? MENS_SKIN_GUIDE[type] : MENS_SKIN_GUIDE;
}
export function getMensHaircare() { return MENS_HAIRCARE; }
export function getMensNailCare() { return MENS_NAIL_CARE; }
export function getEthnicMensGrooming(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_MENS_GROOMING[key] || Object.values(ETHNIC_MENS_GROOMING);
}
export function getMensBodyCare() { return MENS_BODY_CARE; }
export function getMensFragranceGuide(family) {
  return family ? MENS_FRAGRANCE_GUIDE.families[family] : MENS_FRAGRANCE_GUIDE;
}

export const MENS_GROOMING_STATS = {
  ethnicEntries: Object.keys(ETHNIC_MENS_GROOMING).length,
  skinTypes: Object.keys(MENS_SKIN_GUIDE).length,
  fragranceFamilies: Object.keys(MENS_FRAGRANCE_GUIDE.families).length,
  bodyCareSections: Object.keys(MENS_BODY_CARE).length,
};
