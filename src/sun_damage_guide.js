/**
 * MIRRR Sun Damage Guide
 * UV science, photodamage types, prevention, reversal,
 * and ethnic-specific considerations for SPF and UV
 */

// ─── UV SCIENCE ───────────────────────────────────────────────────────────────

export const UV_SCIENCE = {
  spectrum: {
    uva: {
      type: 'UVA (320-400nm)',
      penetration: 'Penetrates deep into the dermis — the middle layer of skin where collagen, elastin, and fibroblasts live.',
      percentage: 'Makes up approximately 95% of UV reaching the Earth\'s surface.',
      damage: 'Primary driver of photoaging — breaks down collagen and elastin, causing wrinkles, laxity, and leathery texture. Also causes indirect DNA damage via free radical generation. A — stands for Aging.',
      glass: 'UVA PENETRATES GLASS. You receive UVA exposure through car windows and office windows. This is why left-side facial skin often ages faster in people who drive.',
      constant: 'UVA levels remain relatively constant throughout the day and year, unlike UVB.',
    },
    uvb: {
      type: 'UVB (280-320nm)',
      penetration: 'Shorter wavelength — primarily absorbed in the epidermis (outer skin layer).',
      percentage: 'Makes up approximately 5% of UV reaching Earth\'s surface.',
      damage: 'Direct DNA damage — photoproducts form in the DNA of skin cells. The primary cause of sunburn (erythema). The primary cause of skin cancer (via accumulated DNA mutations). B — stands for Burning.',
      variable: 'UVB is highest midday (10am-4pm), in summer, at high altitude, and near the equator.',
      glass: 'Standard glass BLOCKS UVB. Windshields have additional UV-filtering treatment.',
    },
    uvc: {
      type: 'UVC (100-280nm)',
      note: 'Almost entirely blocked by the ozone layer. Not a practical skin concern outdoors.',
    },
    ir: {
      type: 'Infrared (IR)',
      note: 'Heat from the sun. Not classified as UV but contributes to some skin damage, particularly in combination with UV. Felt as warmth on the skin.',
    },
  },
  melanin_protection: {
    how: 'Melanin is produced by melanocytes in the basal layer of the epidermis. It absorbs and scatters UV photons, converting light energy to harmless heat.',
    fitzpatrick_spf_equivalent: {
      type_1: 'SPF 2-3 equivalent (minimal protection)',
      type_2: 'SPF 3-4 equivalent',
      type_3: 'SPF 4-8 equivalent',
      type_4: 'SPF 8-15 equivalent',
      type_5: 'SPF 15-20 equivalent',
      type_6: 'SPF 20-30 equivalent (still requires SPF — natural melanin protection is not enough to substitute for sunscreen)',
    },
    important: 'Natural melanin in Fitzpatrick V-VI provides meaningful UV protection, but is NOT sufficient for complete protection. UV damage, photoaging, and skin cancer (though at lower rates) still occur in dark skin. The additional time to sunburn is longer, but UV accumulation still causes damage.',
    spf_myth: '"I don\'t need SPF because I\'m dark-skinned" is the most prevalent and damaging sun protection myth in Fitzpatrick V-VI communities.',
  },
};

// ─── TYPES OF SUN DAMAGE ──────────────────────────────────────────────────────

export const SUN_DAMAGE_TYPES = {
  sunburn: {
    type: 'Sunburn (Acute UVB Damage)',
    what: 'Erythema (redness), heat, pain, peeling. An acute inflammatory response to UVB exposure causing widespread DNA damage in skin cells. The redness is a sign of the immune response — increased blood flow to damaged tissue.',
    severity: {
      first_degree: 'Redness, tenderness. Epidermis only. Heals in 3-5 days.',
      second_degree: 'Blisters. Deeper epidermal damage. Heals in 2 weeks.',
    },
    immediate_treatment: 'Cool (not ice) compresses. Aloe vera gel (refrigerated). Ibuprofen for pain and inflammation. Hydrate intensely. Emollient moisturiser. NO exfoliation until healed.',
    note: 'Each sunburn increases lifetime skin cancer risk. Even one severe blistering sunburn in childhood doubles melanoma risk.',
  },
  photoaging: {
    type: 'Photoaging (Chronic UVA Damage)',
    what: 'The premature aging caused by cumulative UV exposure, distinct from chronological (intrinsic) aging.',
    vs_intrinsic: 'Intrinsic aging: fine lines, slight laxity, natural collagen decline. Photoaging: deep wrinkles, leathery texture, mottled pigmentation, broken capillaries, increased roughness, solar lentigines (sun spots). Studies comparing sun-exposed vs sun-protected skin on the same person\'s body dramatically illustrate photoaging.',
    signs: {
      wrinkles: 'UV breaks down collagen and elastin fibres. The dermis thins and loses support.',
      solar_lentigines: 'Sun spots, age spots, liver spots. Clusters of excess melanin in skin cells triggered by UV. Different from PIH — caused by UV, not inflammation.',
      hyperpigmentation: 'Uneven patchy pigmentation — melanocytes damaged by UV behave erratically.',
      actinic_keratosis: 'Rough, scaly patches from accumulated UVB DNA damage. A precancerous lesion — if untreated, can progress to squamous cell carcinoma.',
      telangiectasia: 'Permanently dilated small blood vessels visible at the skin surface (broken capillaries). UV damages the vessel walls.',
      elastosis: 'Degraded, yellow-tinged thickening of dermal elastic fibres. Gives skin a rough, leathery texture.',
    },
  },
  pigmentation: {
    type: 'UV-Induced Pigmentation',
    immediate_tanning: 'Within hours of UV exposure, a temporary darkening occurs from immediate pigment darkening (IPD) — oxidation of existing melanin. This fades within hours.',
    delayed_tanning: 'Over days, UV stimulates melanocytes to produce new melanin — delayed pigment darkening. This is the "tan" that lasts 1-2 weeks.',
    solar_lentigines: 'Permanent UV pigmentation changes — sun spots, age spots. These do not fade without treatment.',
    melasma_trigger: 'UV is a key trigger for melasma (hormonal + UV combination). UV must be avoided for melasma to be treated effectively.',
    pih_worsening: 'UV makes any existing PIH (post-inflammatory hyperpigmentation) significantly worse. SPF is mandatory when treating PIH.',
  },
  skin_cancer: {
    type: 'Skin Cancer (UV-Induced DNA Damage)',
    types: {
      basal_cell: 'Most common. Slow-growing. Rarely metastasises. Appears as a pearly bump or flat pink patch.',
      squamous_cell: 'From accumulated UVB damage. Can metastasise if untreated. Often develops from actinic keratosis.',
      melanoma: 'The most dangerous. Can spread rapidly. Associated with UV exposure and severe sunburns. Check for ABCDE: Asymmetry, Border irregularity, Colour variation, Diameter >6mm, Evolving.',
    },
    ethnic_risk: 'Skin cancer is less common in Fitzpatrick V-VI. However, when it occurs in dark-skinned individuals, it is often diagnosed at a later stage (due to delayed detection and lower clinical suspicion) — leading to worse outcomes. The most common melanoma site in dark-skinned individuals is acral lentiginous melanoma (ALM) — on palms, soles, and under the nails, which is NOT UV-related.',
  },
};

// ─── SPF GUIDE ────────────────────────────────────────────────────────────────

export const SPF_GUIDE = {
  what_spf_means: {
    definition: 'Sun Protection Factor — measures the fraction of UVB that reaches the skin compared to unprotected skin.',
    spf_30: 'SPF 30 allows 1/30 of UVB through = blocks approximately 97% of UVB.',
    spf_50: 'SPF 50 allows 1/50 of UVB through = blocks approximately 98% of UVB.',
    spf_100: 'SPF 100 allows 1/100 of UVB through = blocks approximately 99% of UVB.',
    practical: 'The difference between SPF 30 and 50 is small (97% vs 98%). SPF 30-50+ is the recommended range. Higher SPF provides marginal additional benefit but is not harmful.',
    uvb_only: 'SPF is a measure of UVB protection ONLY. For full UVA protection, look for "broad-spectrum" on the label (regulated to mean UVA protection exists).',
  },
  types: {
    mineral: {
      type: 'Mineral (Physical) SPF',
      ingredients: 'Zinc oxide, titanium dioxide.',
      how: 'Sit on top of skin, reflect/scatter UV rays.',
      pros: 'Gentle, suitable for sensitive skin and during pregnancy. Immediately effective on application. Broad-spectrum by nature.',
      cons: 'Can leave white cast — especially on Fitzpatrick IV-VI. Can feel heavy. May pill under makeup.',
      white_cast_solutions: 'Tinted mineral SPF (iron oxides added to offset the white). Smaller particle zinc (micronised or nano-zinc, though safety still studied). Hybrid formulas.',
    },
    chemical: {
      type: 'Chemical (Organic) SPF',
      ingredients: 'Avobenzone, octinoxate, octisalate, oxybenzone, tinosorb (Europe/Asia).',
      how: 'Absorb UV rays and convert them to heat, which is released from the skin.',
      pros: 'No white cast. Lightweight, thin texture. Sit under makeup beautifully. Better for Fitzpatrick V-VI.',
      cons: 'Can irritate sensitive skin. Oxybenzone has been questioned for hormone disruption and reef safety (though skin cancer risk from not using SPF far outweighs these concerns). Require 15-20 minutes to activate after application.',
      for_dark_skin: 'Chemical or hybrid SPF is the most practical for Fitzpatrick V-VI — no white cast issue.',
    },
    hybrid: {
      type: 'Hybrid SPF',
      what: 'Contains both mineral and chemical filters.',
      why: 'Provides broad-spectrum coverage, lighter texture than pure mineral, and reduced white cast concern.',
    },
  },
  application: {
    amount: '1/4 teaspoon (approximately 1.5ml) for the face. 2mg/cm² for the body. Most people apply 20-50% of the recommended amount — this drastically reduces effective protection.',
    timing: 'Chemical SPF: 15-20 minutes before UV exposure. Mineral SPF: immediately protective.',
    reapplication: 'Every 2 hours of UV exposure. Immediately after swimming or sweating.',
    layering: 'SPF goes on AFTER moisturiser and before makeup. Do not mix SPF into moisturiser or makeup — this dilutes the SPF.',
  },
  common_mistakes: {
    not_enough: 'Under-application — most common error. Use enough.',
    not_reapplying: 'SPF wears off with sweating, touching face, and exposure time. Reapply.',
    skipping_cloudy: 'UV penetrates clouds. Up to 80% of UV reaches skin on overcast days. SPF needed on cloudy days.',
    skipping_winter: 'UV persists year-round. UVA (the aging ray) doesn\'t reduce much in winter. SPF in winter, especially for the face.',
    skipping_indoors: 'UVA penetrates glass. Apply SPF before sitting near windows or driving.',
  },
};

// ─── REVERSAL TREATMENTS ──────────────────────────────────────────────────────

export const SUN_DAMAGE_REVERSAL = {
  prevention_first: 'Reversal treatments are less effective without concurrent SPF. Every unprotected UV exposure undoes treatment progress.',
  topical: {
    retinoids: 'Tretinoin (prescription) and retinol — the most evidence-backed for photoaging reversal. Stimulate collagen production. Reduce solar lentigines over 6-12 months. Increase cell turnover for smoother surface.',
    vitamin_c: 'Antioxidant protection against further UV free radical damage. Brightens existing pigmentation. Supports collagen synthesis.',
    niacinamide: 'Reduces melanin transfer between melanocytes and keratinocytes — reduces the appearance of solar lentigines. Anti-inflammatory.',
    azelaic_acid: 'Gentle brightening for solar lentigines and PIH. Inhibits tyrosinase (melanin production enzyme).',
    hydroquinone: 'Prescription-strength melanin inhibitor. The most potent OTC/Rx topical for solar lentigines. Use in limited courses (3-6 months) to avoid ochronosis (rare paradoxical darkening with prolonged use).',
    kojic_acid: 'Natural tyrosinase inhibitor (from fungal fermentation). Gentler alternative to hydroquinone.',
    tranexamic_acid: 'For UV-induced melasma and pigmentation.',
    aha: 'Glycolic and lactic acid — exfoliate the surface to remove dead cells containing excess melanin. Improve texture from photoaging.',
  },
  professional: {
    chemical_peels: {
      name: 'Chemical Peels',
      how: 'Controlled application of acid solution at higher concentration than OTC, removing damaged outer skin layers.',
      types: 'Superficial (glycolic/salicylic — lunch peel). Medium (TCA). Deep (phenol — significant downtime).',
      ethnic_note: 'Superficial peels are generally safe for all Fitzpatrick types. Medium and deep peels carry significant PIH risk for Fitzpatrick IV-VI — must be performed by a dermatologist experienced with dark skin. Pretreatment with hydroquinone reduces PIH risk.',
    },
    laser: {
      name: 'Laser Resurfacing',
      types: {
        ablative: 'Removes outer skin layers (CO2 or Erbium). Most effective for deep photoaging. Significant downtime. HIGH PIH risk for Fitzpatrick IV-VI — generally avoid on deep skin.',
        non_ablative: 'Heats the dermis without removing surface skin. Less downtime. Lower PIH risk. Good for mild-moderate photoaging.',
        fractional: 'Treats "fractions" of skin — leaving untreated skin columns to support healing. Better safety profile for darker skin than full ablative. Fraxel is a common brand.',
        nd_yag: 'Nd:YAG laser (1064nm): longer wavelength that bypasses melanin — safer for Fitzpatrick V-VI for some applications. Used for laser toning for pigmentation on dark skin.',
      },
    },
    ipl: {
      name: 'IPL (Intense Pulsed Light)',
      what: 'Broadband light targeting pigmented lesions (solar lentigines) specifically.',
      best_for: 'Solar lentigines on Fitzpatrick I-III. High PIH risk for Fitzpatrick IV+. Generally avoided on deep skin.',
    },
    microneedling: {
      name: 'Microneedling',
      what: 'Controlled micro-injuries stimulate collagen production. Improves photoaging texture.',
      safety: 'Safer than laser for Fitzpatrick V-VI — no ablation, lower PIH risk. Can be combined with topical vitamin C or PRP.',
    },
    cryotherapy: {
      name: 'Cryotherapy',
      what: 'Liquid nitrogen applied to solar lentigines, destroying the pigmented cells.',
      note: 'On Fitzpatrick IV-VI, can cause hypopigmentation (white spot where the lentigo was). Consult a dermatologist experienced with dark skin before cryotherapy.',
    },
  },
};

// ─── ETHNIC SUN DAMAGE CONSIDERATIONS ────────────────────────────────────────

export const ETHNIC_SUN_DAMAGE = {
  west_african: {
    community: 'West African',
    spf_myth: 'The widespread belief that dark skin does not need SPF is most prevalent in West African communities. Natural Fitzpatrick V-VI melanin provides some protection (SPF 15-20 equivalent) but not full protection.',
    main_concern: 'UV worsening of PIH and melasma. Darker skin can absorb more total UV before burning — but cumulative damage still occurs.',
    treatment_caution: 'Laser and aggressive peels carry high PIH risk. Gentle topicals (niacinamide, vitamin C, tranexamic acid) + SPF are first-line for solar pigmentation on deep skin.',
    recommendation: 'Chemical SPF (no white cast). Develop a daily SPF habit from a young age. Community education around SPF is an important health equity issue.',
  },
  south_asian: {
    community: 'South Asian',
    spf_myth: 'Similar myth prevalent in South Asian communities. Medium-brown skin tones (Fitzpatrick III-IV) have a moderate but insufficient melanin shield.',
    melasma: 'South Asian women are highly susceptible to melasma (hormonal + UV combination). SPF is the most critical melasma management step — without it, all other melasma treatments fail.',
    desi_recommendation: 'Light SPF tinted moisturiser or BB SPF is popular in South Asian women\'s grooming culture and is an effective format for driving adoption.',
  },
  caribbean: {
    community: 'Caribbean',
    uv_index: 'The Caribbean has an extremely high UV index (8-11+ in peak summer). Both residents and tourists face high UV exposure.',
    skin_cancer_gap: 'Lower skin cancer rates but later-stage diagnoses in Caribbean communities when they occur.',
    recommendation: 'High SPF (50+) in the Caribbean climate. Reapplication is especially important in a hot, humid, outdoor environment.',
  },
  arab: {
    community: 'Arab',
    uv_index: 'MENA region has very high UV index (up to 11+). Gulf Arab countries experience extreme UV.',
    melasma: 'Melasma is extremely common in Arab women — driven by both hormonal triggers and the high UV environment.',
    cultural: 'Many Arab women cover (hijab, abaya) which provides physical UV protection on the body. However, the face often remains uncovered — SPF is essential.',
    recommendation: 'High SPF on the face. Melasma prevention is a primary motivation for SPF in Arab communities.',
  },
  east_asian: {
    community: 'East Asian',
    sun_protection_culture: 'East Asian (particularly South Korean and Japanese) sun protection culture is among the most developed in the world. UV-protective clothing, hats, UV umbrellas, and daily SPF are mainstream and widely practiced.',
    driver: 'The cultural ideal of even, fair skin (preferred in some East Asian beauty standards) drives excellent SPF compliance.',
    innovation: 'Korean and Japanese SPF formulations are often superior to Western formulations — ultra-lightweight, skin-like finish, elegant texture. Korean "essence SPFs" are near-invisible.',
    recommendation: 'Continue excellent SPF habits. Year-round UVA protection for anti-aging.',
  },
  black_american: {
    community: 'Black American',
    spf_adoption: 'Surveys show SPF adoption is lower in the Black American community than in white or Asian American communities. Contributing factors: the melanin protects fully myth, historical exclusion from SPF marketing, products with white cast (making mineral SPFs impractical), physician recommendation gaps.',
    white_cast: 'White cast from traditional mineral SPFs on deep skin has been a practical barrier to SPF adoption. Chemical and tinted mineral SPFs (Black Girl Sunscreen, Unsun, Fenty Skin) formulated specifically for deep skin have significantly improved this.',
    sun_cancer_note: 'Although melanoma is less common in Black Americans, acral lentiginous melanoma (under nails, palms, soles) occurs at similar rates to white Americans and is often diagnosed late.',
    recommendation: 'Community education around SPF. Brands formulated specifically for dark skin without white cast. Normalising SPF in Black American beauty culture.',
  },
  latina: {
    community: 'Latina',
    spf_motivation: 'Melasma is the primary SPF motivator for Latina women — it is extremely common in Latina women due to hormonal susceptibility and high UV environments across Latin America.',
    sun_exposure: 'Latin American countries generally have high UV index, increasing lifetime UV exposure versus more northern latitudes.',
    recommendation: 'High SPF (30-50+). Chemical preferred to avoid white cast on medium-deep skin tones. Reapplication critical in high-UV environments.',
  },
  east_african: {
    community: 'East African',
    high_altitude: 'Ethiopia, Eritrea, Rwanda are high-altitude countries — UV intensity increases with altitude (approximately 10-12% per 1000m elevation). East Africans face higher UV than coastal counterparts.',
    recommendation: 'SPF adoption education. The combination of equatorial latitude + high altitude creates very high UV exposure.',
  },
  south_african: {
    community: 'South African',
    uv_index: 'South Africa has high UV index year-round due to its latitude and elevation.',
    diversity: 'South Africa\'s diverse population has varying natural melanin protection levels — all ethnicities require SPF.',
    recommendation: 'SPF SPF SPF. Tinted mineral or chemical SPF for Fitzpatrick V-VI. Education around SPF for the South African Black community.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getUVScience() { return UV_SCIENCE; }
export function getSunDamageTypes(type) {
  return type ? SUN_DAMAGE_TYPES[type] : SUN_DAMAGE_TYPES;
}
export function getSPFGuide(section) {
  return section ? SPF_GUIDE[section] : SPF_GUIDE;
}
export function getSunDamageReversal(treatment) {
  if (treatment) {
    return SUN_DAMAGE_REVERSAL.topical[treatment] || SUN_DAMAGE_REVERSAL.professional[treatment] || SUN_DAMAGE_REVERSAL;
  }
  return SUN_DAMAGE_REVERSAL;
}
export function getEthnicSunDamage(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_SUN_DAMAGE[key] || Object.values(ETHNIC_SUN_DAMAGE);
}

export const SUN_DAMAGE_STATS = {
  damageTypes: Object.keys(SUN_DAMAGE_TYPES).length,
  spfTypes: Object.keys(SPF_GUIDE.types).length,
  topicalTreatments: Object.keys(SUN_DAMAGE_REVERSAL.topical).length,
  professionalTreatments: Object.keys(SUN_DAMAGE_REVERSAL.professional).length,
  ethnicEntries: Object.keys(ETHNIC_SUN_DAMAGE).length,
};
