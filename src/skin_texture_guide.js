/**
 * MIRRR Skin Texture Guide
 * Pores, bumps, congestion, uneven texture, and treatment approaches
 * for all skin types and Fitzpatrick types
 */

// ─── TEXTURE OVERVIEW ─────────────────────────────────────────────────────────

export const SKIN_TEXTURE_OVERVIEW = {
  definition: 'Skin texture refers to the surface characteristics of the skin: smoothness, pore size, bumpiness, roughness, and overall evenness. "Texture" in the beauty context usually refers to skin that feels or looks rough, uneven, bumpy, or has visible pores.',
  types: {
    pores: 'Enlarged or visible pores — small openings in the skin through which sebaceous glands secrete sebum.',
    closed_comedones: 'Tiny skin-coloured or white bumps from clogged follicles — a form of non-inflammatory acne.',
    kp: 'Keratosis pilaris — rough, sandpaper-like bumps typically on the arms, thighs, and buttocks.',
    rough: 'General surface roughness — often from dead cell buildup, dehydration, or barrier damage.',
    bumpy: 'Any form of raised irregularities on the skin surface.',
    scarring: 'Textural changes from healed acne, injury, or skin conditions.',
  },
};

// ─── PORES ────────────────────────────────────────────────────────────────────

export const PORE_GUIDE = {
  what_pores_are: 'Pores are the openings of hair follicles and sebaceous (oil) glands at the skin surface. Every pore contains a hair follicle. There are two types: follicular pores (most visible) and sweat pores (much smaller, mostly invisible).',
  myths: {
    open_close: 'Pores do NOT "open" and "close." They have no muscles. Hot water, steam, and cold water can temporarily affect their appearance (steam hydrates surrounding skin so pores look temporarily smaller; cold constricts blood vessels making skin slightly firmer) but do not structurally change pore size.',
    shrink_permanently: 'No topical product can permanently shrink pores. Pore SIZE is largely genetic. However, pore APPEARANCE can be significantly improved by keeping them clear (preventing stretching from clogging), improving skin texture and tone (which reduces contrast), and using blurring products.',
    wash_away: 'Washing your face does not reduce pore size or empty out sebum glands permanently. Pores refill.',
  },
  why_pores_are_visible: {
    genetics: 'Genetics is the primary determinant of pore size. Some people have naturally larger sebaceous glands and follicles.',
    sebum_production: 'High sebum production stretches pores. Oily skin types have more visible pores.',
    age: 'With age, skin loses elasticity. The collagen and elastin "hammock" that keeps the pore walls taut relaxes — pores stretch and appear larger.',
    clogging: 'When a pore is clogged (open comedone/blackhead), the plug stretches the pore open.',
    dehydration: 'Dehydrated skin exaggerates the appearance of pores.',
    sun_damage: 'UV damage breaks down collagen around pores, causing them to appear larger.',
  },
  minimising_pore_appearance: {
    cleansing: 'Gentle, thorough double cleansing (especially for oily/combination skin) prevents clog buildup that stretches pores.',
    bha: 'Salicylic acid (BHA): the most effective pore-targeting ingredient. Oil-soluble — penetrates into the pore to dissolve the sebum plug. Reduces the appearance of enlarged pores more effectively than any other OTC ingredient.',
    retinoids: 'Retinol/tretinoin: stimulates collagen production around pores, tightening the surrounding structure. Long-term use significantly reduces pore appearance.',
    niacinamide: 'Niacinamide 10%: reduces sebum production in oily skin (less oil = less stretching of pores). Also has a skin-tightening visual effect.',
    clay: 'Clay masks: draw out sebum from pores temporarily, reducing their stuffed appearance.',
    spf: 'SPF: prevents UV breakdown of collagen around pores — the single most important long-term pore-protection measure.',
    makeup: 'Blurring primer (silicone or pore-filling primer): fills the optical appearance of pores for photos. Effect is temporary (2-8 hours).',
    retinol_long_term: 'The only realistic approach to lasting pore improvement is a combination of keeping them clear (BHA) + stimulating collagen (retinoid) + protecting from UV (SPF) over 6-12 months.',
  },
  professional_treatments: {
    chemical_peels: 'Salicylic acid or glycolic acid peels at higher concentrations than OTC. Performed by aesthetician.',
    microdermabrasion: 'Mechanical exfoliation of the skin surface, temporarily reducing the appearance of enlarged pores.',
    laser: 'Non-ablative laser resurfacing stimulates collagen around pores.',
    microneedling: 'Creates controlled micro-injuries that stimulate collagen production, tightening pore walls over time.',
  },
};

// ─── CONGESTION ───────────────────────────────────────────────────────────────

export const CONGESTED_SKIN_GUIDE = {
  definition: 'Congested skin refers to skin with a high concentration of blocked pores — both open comedones (blackheads) and closed comedones (whiteheads). The texture looks and feels bumpy and uneven.',
  causes: {
    over_cleansing: 'Stripping the skin with harsh cleansers triggers increased sebum production as compensation.',
    heavy_products: 'Pore-clogging ingredients (comedogenic ingredients) in skincare and makeup.',
    diet: 'High glycaemic index diet and dairy may worsen congestion in some individuals.',
    hormones: 'Androgen hormones stimulate sebum production.',
    inadequate_exfoliation: 'Insufficient removal of dead skin cells leads to accumulation and plug formation.',
    occlusion: 'Anything that covers and blocks the pore for extended periods — thick face creams, certain makeup formulations, unwashed makeup brushes.',
  },
  comedogenic_ingredients: {
    high_risk: ['Coconut oil (comedogenic rating 4/5)', 'Wheat germ oil', 'Flaxseed oil', 'Algae extract in some formulations', 'Certain silicones in leave-on products'],
    moderate_risk: ['Isopropyl myristate', 'Lauric acid', 'Cocoa butter', 'Shea butter (moderate 2/5)', 'Lanolin'],
    low_risk: ['Jojoba oil (0/5 — technically a wax, non-comedogenic)', 'Squalane (0/5)', 'Argan oil (0/5)', 'Marula oil (1/5)', 'Rosehip oil (1/5)'],
    note: 'Comedogenic ratings are determined in lab tests that don\'t perfectly predict real-world skin response. Individual responses vary. A "comedogenic" ingredient in a low concentration in a formula may not cause breakouts.',
  },
  treatment_protocol: {
    double_cleanse: 'Double cleansing to ensure full makeup and SPF removal.',
    bha: 'Salicylic acid 0.5-2% in a toner, serum, or cleanser — penetrates into pores to dissolve the plug.',
    retinoid: 'Retinol or tretinoin — normalises follicle cell turnover, preventing new plug formation.',
    clay: 'Clay mask 1-2x per week — absorbs excess sebum.',
    check_products: 'Audit all skincare and makeup for comedogenic ingredients.',
    extraction: 'Professional extraction by trained aesthetician for established blackheads.',
    note: 'Congestion clears slowly — 8-12 weeks of consistent treatment before seeing significant change.',
  },
};

// ─── ROUGH SKIN TEXTURE ───────────────────────────────────────────────────────

export const ROUGH_SKIN_GUIDE = {
  causes: {
    dead_cell_buildup: 'The most common cause. Dead skin cells accumulate on the surface faster than they are shed — creating a rough, uneven texture.',
    dehydration: 'Dehydrated skin looks and feels rougher. The cells on the surface shrink, creating a rough, uneven plane.',
    barrier_damage: 'When the skin barrier is damaged, the surface is uneven and rough-feeling. Associated with sensitivity and redness.',
    sun_damage: 'UV damage over time thickens and roughens the skin surface.',
    scarring: 'Acne scars, post-surgical scars, and injury scars create uneven surface texture.',
    genetics: 'Some skin types are naturally prone to rougher texture — influenced by genetics, Fitzpatrick type, and sebaceous activity.',
  },
  treatments: {
    physical_exfoliation: 'Gentle exfoliation 1-3x per week. Removes the dead cells on the surface. Over-exfoliation worsens roughness.',
    aha: 'Alpha hydroxy acids (glycolic, lactic, mandelic, malic acid) dissolve the bonds between dead skin cells and the surface, allowing them to shed. Most effective chemical exfoliant for surface roughness.',
    urea: 'Urea 5-10%: both a humectant and a keratolytic (breaks down dead skin protein). Very effective for rough, bumpy skin — particularly on the body.',
    hydration: 'Hyaluronic acid and glycerin plump the cells on the surface, reducing the appearance of roughness. Hydration alone can dramatically improve texture appearance without exfoliation.',
    retinoids: 'Retinol stimulates cell turnover, revealing newer, smoother skin at the surface.',
    spf: 'Prevents further UV-induced roughening.',
  },
};

// ─── SCARS AND TEXTURE ────────────────────────────────────────────────────────

export const SCARS_TEXTURE_GUIDE = {
  atrophic: {
    type: 'Atrophic Scars (depressed)',
    subtypes: {
      ice_pick: 'Narrow, deep, vertical pits. The most challenging to treat. Typically from cystic acne that destroyed the follicle wall and surrounding tissue deeply.',
      boxcar: 'Broad, shallow depressions with defined vertical edges. Like a box cut from the skin surface.',
      rolling: 'Shallow, wave-like depression. Caused by fibrous tissue tethering the skin surface to deeper structures.',
    },
    treatments: 'Microneedling (stimulates collagen to fill the depression). Subcision (for rolling scars — a needle inserted under the scar to break the fibrous tether). Chemical peels (improve texture and may improve shallow scars). Filler (temporarily fills atrophic scars). Laser resurfacing.',
    caution: 'Laser on Fitzpatrick V-VI: significant PIH risk. Fractional laser (vs. ablative) is safer on darker skin. Consult a dermatologist experienced with dark skin.',
  },
  hypertrophic: {
    type: 'Hypertrophic Scars (raised)',
    what: 'Raised, thick scars that stay within the boundary of the original wound. Red or pink initially, fading to lighter than surrounding skin over time.',
    causes: 'Excessive collagen production during healing. More common in certain wound types (surgical, burns) and certain individuals.',
    treatments: 'Silicone sheets or gel (applied over scar, reduces the raised appearance). Intralesional corticosteroid injection. Laser.',
    ethnic_note: 'Hypertrophic scarring and keloid formation are significantly more common in Fitzpatrick V-VI. This is an important consideration before any elective procedure (tattoos, piercings, surgery, cosmetic procedures).',
  },
  keloids: {
    type: 'Keloid Scars',
    what: 'Scars that grow BEYOND the original wound boundary — extending into surrounding normal skin. Can grow for months or years. Often itch or are tender.',
    causes: 'Abnormal fibroblast (collagen-producing cell) response. Genetic predisposition. More common in darker skin tones (Fitzpatrick V-VI) — up to 6-16% of Black individuals compared to 0.1% in white individuals.',
    locations: 'Most common on: chest, upper back, earlobes (from piercings), shoulders, upper arms.',
    treatments: 'Intralesional steroid injections (most common first-line). Silicone gel/sheets. Surgical excision (high recurrence risk — often worsens). Laser. Pressure therapy.',
    prevention: 'For keloid-prone individuals: prevent unnecessary skin trauma. Ear piercings carry significant keloid risk. Discuss with dermatologist before any elective procedure.',
  },
  pih_texture: {
    type: 'Post-Inflammatory Hyperpigmentation (Textural Component)',
    what: 'PIH is primarily a colour change (dark spot) but can sometimes be accompanied by very slight textural change from underlying inflammation. The dark spot itself sits at or slightly within the surface.',
    note: 'PIH is NOT the same as a scar. PIH fades with time and treatment. True scars (atrophic, hypertrophic, keloid) involve structural tissue changes.',
  },
};

// ─── ETHNIC SKIN TEXTURE ──────────────────────────────────────────────────────

export const ETHNIC_SKIN_TEXTURE = {
  west_african: {
    community: 'West African',
    notes: 'Deep Fitzpatrick V-VI skin has naturally thick dermis — an advantage for aging. Main texture concerns: PIH spots from any skin inflammation (appearing darker than surrounding deep skin), keloid tendency, ashy appearance from surface dryness. African net sponge exfoliation is a traditional and highly effective texture treatment.',
  },
  south_asian: {
    community: 'South Asian',
    notes: 'South Asian skin (Fitzpatrick III-V) has high sebaceous activity, making congested pores and closed comedones a common texture concern. PIH from any acne or inflammation. Ubtan (chickpea flour paste) traditional exfoliation addresses both texture and brightening simultaneously.',
  },
  caribbean: {
    community: 'Caribbean',
    notes: 'Similar to West African concerns — PIH, keloid tendency in darker skin. Ingrown hairs from coily hair patterns and shaving/waxing create textural bumps (pseudofolliculitis — "razor bumps"). BHA body wash and proper shaving technique address this.',
  },
  arab: {
    community: 'Arab',
    notes: 'Arab skin (Fitzpatrick III-IV) ranges from fair to medium-brown. Texture concerns include sun damage (high UV index in MENA region), oil congestion. The hammam kessa exfoliation is highly effective for texture improvement.',
  },
  east_asian: {
    community: 'East Asian',
    notes: 'East Asian skin (Fitzpatrick II-IV) commonly has closed comedones (whiteheads) as a primary texture concern — associated with the low porosity of Asian skin. Glass skin philosophy drives thorough texture treatment. The Korea Italy towel body scrub is iconic for removing dead skin "rolls."',
  },
  black_american: {
    community: 'Black American',
    notes: 'Same deep skin considerations as West African. Pseudofolliculitis barbae (razor bumps on beard area and nape) is a significant concern for Black American men with coily beard hair. KP (keratosis pilaris) on darker skin creates hyperpigmentation at each bump rather than just texture. Keloid tendency. PIH from any skin trauma.',
  },
  south_asian_specific: {
    community: 'South Asian',
    notes: 'KP is extremely common in South Asian individuals. Thread exfoliation (similar to facial threading — using thread to exfoliate body skin) is a traditional technique. Gram flour (besan) scrub for body texture.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getSkinTextureOverview() { return SKIN_TEXTURE_OVERVIEW; }
export function getPoreGuide(section) {
  return section ? PORE_GUIDE[section] : PORE_GUIDE;
}
export function getCongestedSkinGuide() { return CONGESTED_SKIN_GUIDE; }
export function getRoughSkinGuide() { return ROUGH_SKIN_GUIDE; }
export function getScarsTextureGuide(type) {
  return type ? SCARS_TEXTURE_GUIDE[type] : SCARS_TEXTURE_GUIDE;
}
export function getEthnicSkinTexture(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_SKIN_TEXTURE[key] || Object.values(ETHNIC_SKIN_TEXTURE);
}

export const SKIN_TEXTURE_STATS = {
  poreMinimisers: Object.keys(PORE_GUIDE.minimising_pore_appearance).length,
  scarTypes: Object.keys(SCARS_TEXTURE_GUIDE).length,
  ethnicEntries: Object.keys(ETHNIC_SKIN_TEXTURE).length,
  roughnessCauses: Object.keys(ROUGH_SKIN_GUIDE.causes).length,
};
