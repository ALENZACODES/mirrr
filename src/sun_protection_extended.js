/**
 * MIRRR Extended Sun Protection Guide
 * SPF education, white cast solutions, UV damage in ethnic skin,
 * sunscreen ingredients, and photoprotection strategies for all communities
 */

// ─── UV BASICS ────────────────────────────────────────────────────────────────

export const UV_BASICS = {
  types_of_uv: {
    uva: {
      wavelength: '320-400nm',
      penetration: 'Penetrates to the dermis (deep skin layer)',
      damage: 'Aging (the A stands for Aging) — breaks down collagen and elastin, causes hyperpigmentation, photoaging',
      clouds: 'Penetrates through clouds and glass — present ALL year round, even on cloudy days',
      window_glass: 'Passes through regular glass — UV protection needed when driving or near windows',
    },
    uvb: {
      wavelength: '280-315nm',
      penetration: 'Reaches the epidermis (top skin layer)',
      damage: 'Burning (the B stands for Burning) — causes sunburn, directly damages DNA, primary driver of skin cancer',
      clouds: 'Partially blocked by clouds — reduced but not eliminated on cloudy days',
      window_glass: 'Blocked by regular glass',
    },
    uvc: {
      wavelength: '100-280nm',
      note: 'Almost entirely absorbed by the atmosphere. Not relevant for skin protection outside of artificial sources.',
    },
  },

  spf_rating_explained: {
    what: 'SPF (Sun Protection Factor) measures protection against UVB only — the burning rays. It does NOT directly measure UVA protection.',
    numbers: [
      { spf: 'SPF 15', blocks: '93% of UVB rays' },
      { spf: 'SPF 30', blocks: '97% of UVB rays' },
      { spf: 'SPF 50', blocks: '98% of UVB rays' },
      { spf: 'SPF 100', blocks: '99% of UVB rays' },
    ],
    interpretation: 'The difference between SPF 30 and SPF 100 is just 1-2% more UVB blockage — but the difference between SPF 15 and SPF 30 is 4% which is meaningful. Most dermatologists recommend SPF 30 as the minimum and SPF 50 for daily use.',
    the_gap: 'SPF ONLY rates UVB protection. A product can have SPF 100 and offer poor UVA protection if it doesn\'t contain appropriate UVA filters. This is why "broad spectrum" labelling matters — it means the product protects against both UVA and UVB.',
  },

  uva_protection_ratings: {
    pa_plus: 'Japanese and Korean PA+ system rates UVA protection. PA+ (low) to PA++++ (highest). Most K-beauty SPF products display both SPF and PA ratings. Look for PA+++ or PA++++ for strong UVA protection.',
    uva_circle: 'European standard — a UVA logo in a circle means UVA protection is at least one-third of the SPF value.',
    ppd: 'Persistent Pigment Darkening — the professional measurement for UVA protection. Used in clinical testing.',
    boots_star: 'UK Boots Star Rating system — 1-5 stars for UVA:UVB ratio.',
  },
};

// ─── UV DAMAGE IN ETHNIC SKIN ─────────────────────────────────────────────────

export const UV_DAMAGE_ETHNIC_SKIN = {
  the_melanin_advantage: {
    what: 'Melanin in darker skin provides some degree of natural UV protection — estimated at approximately SPF 13 in very deep skin (Fitzpatrick VI) vs approximately SPF 3 in very light skin (Fitzpatrick I). This is real protection.',
    THE_CRITICAL_CAVEAT: 'SPF 13 is nowhere near adequate sun protection for daily outdoor life. Dermatologists recommend minimum SPF 30. The melanin advantage reduces but does not eliminate UV damage, skin cancer risk, or photoaging.',
    the_deadly_myth: 'The belief that "Black people don\'t need sunscreen" or "darker skin can\'t get skin cancer" is a dangerous myth that contributes to late-stage skin cancer diagnoses in communities of colour. Skin cancer in darker-skinned people has significantly higher mortality rates because it is found later.',
  },

  skin_cancer_in_ethnic_communities: {
    acral_lentiginous_melanoma: {
      what: 'A form of melanoma that occurs on palms, soles, and under nails — areas not typically exposed to UV. The most common form of melanoma in Black, Hispanic, and Asian populations.',
      bob_marley: 'Bob Marley died from acral lentiginous melanoma that started under his toenail. His case highlighted how this form of skin cancer disproportionately affects people of colour and is often found late.',
      check: 'Check palms, soles of feet, and under nails during skin self-examination. See a dermatologist annually.',
    },
    why_later_detection: 'Skin cancer is found later in people of colour because: (1) fewer check-ups due to belief that dark skin is immune; (2) dermatologists may miss skin cancer in darker skin; (3) acral melanoma isn\'t in a typical sun-exposed area.',
    statistics: 'While skin cancer rates are lower in Black and Hispanic populations, 5-year survival rates are significantly lower — 65-70% vs 90%+ in white patients. Later diagnosis is the primary reason.',
  },

  hyperpigmentation_and_uv: {
    relationship: 'UV exposure is one of the primary TRIGGERS and WORSENING factors for all forms of hyperpigmentation: PIH, melasma, and sunspots. Every time UV hits an area of existing hyperpigmentation, it stimulates more melanin production and darkens it further.',
    spf_as_treatment: 'Sunscreen is a non-negotiable part of treating hyperpigmentation — every brightening serum or treatment is significantly LESS effective if not paired with SPF. Applying vitamin C or kojic acid without sun protection is like bailing out a boat while the tap is still running.',
    for_ethnic_skin: 'For Fitzpatrick IV-VI skin dealing with PIH or melasma, SPF is arguably the most important product in the routine — more important than any brightening treatment used alone.',
  },
};

// ─── WHITE CAST SOLUTIONS ─────────────────────────────────────────────────────

export const WHITE_CAST_GUIDE = {
  what_causes_it: {
    mineral_filters: 'Zinc oxide and titanium dioxide — the two physical/mineral sunscreen actives — are white particles that sit on top of skin. They reflect light AND reflect a whitish sheen, particularly on deeper skin tones.',
    particle_size: 'Micronised (smaller particle) and nano-particle versions of zinc oxide and titanium dioxide cause less white cast. Ultra-fine zinc oxide is available and significantly reduces the effect.',
  },

  solutions: {
    chemical_sunscreens: {
      what: 'Chemical (organic) filters absorb UV rather than reflecting it. They are colourless and cause no white cast.',
      filters: [
        { name: 'Avobenzone', uv_coverage: 'UVA', notes: 'Widely used in US, unstable without stabiliser' },
        { name: 'Octocrylene', uv_coverage: 'UVB + stabilises avobenzone', notes: 'Common in European and US formulas' },
        { name: 'Homosalate', uv_coverage: 'UVB', notes: 'Common UVB filter, endocrine disruption questions at high concentrations' },
        { name: 'Octinoxate', uv_coverage: 'UVB', notes: 'Effective but banned in Hawaii and Key West (coral reef damage)' },
        { name: 'Tinosorb S/M', uv_coverage: 'Broad spectrum', notes: 'Excellent next-generation European filters — not yet approved in US; available in EU, Australia, Asia' },
        { name: 'Uvinul A Plus (Diethylamino Hydroxybenzoyl Hexyl Benzoate)', uv_coverage: 'UVA', notes: 'Outstanding UVA filter, stable, no white cast. In many K-beauty and EU sunscreens.' },
        { name: 'Mexoryl SX/XL', uv_coverage: 'UVA', notes: 'La Roche-Posay\'s proprietary filters, excellent UVA coverage' },
      ],
      concerns: 'Some chemical filters (benzophenone-3/oxybenzone, octinoxate) have environmental concerns (coral reef bleaching) and potential endocrine disruption at high concentrations. The evidence for human harm at typical cosmetic concentrations is limited but developing.',
    },

    tinted_mineral_sunscreens: {
      what: 'Mineral sunscreens with iron oxides and/or titanium dioxide tinted to match skin tones — the tint neutralises the white cast',
      benefit: 'Iron oxides also protect against visible light and blue light, which can worsen melasma. A significant bonus for hyperpigmentation concerns.',
      products: [
        { name: 'La Roche-Posay Anthelios Mineral Tinted SPF 50', note: 'Several shades including a universal tint' },
        { name: 'EltaMD UV Clear Tinted SPF 46', note: 'Excellent for acne-prone skin, niacinamide included' },
        { name: 'Colorescience Sunforgettable Total Protection', note: 'Powder brush SPF in tinted shades — excellent for touch-ups and deeper skin tones' },
        { name: 'ISDIN Fusion Water Color Tinted SPF 50', note: 'Light, tinted, minimal cast' },
      ],
    },

    hybrid_sunscreens: {
      what: 'Products combining both mineral and chemical filters — the mineral provides physical protection while chemical filters fill in coverage gaps',
      benefit: 'Can reduce the amount of mineral particles (reducing white cast) while maintaining or improving UV protection',
    },

    formula_technology: {
      what: 'Advanced formulation technology disperses mineral particles more evenly, reducing clumping and white cast',
      korean_formula: 'Korean sunscreen formulas are notably better for avoiding white cast — the East Asian beauty market has demanded non-white-casting solutions for decades. Asian-market sunscreens (ISNTREE, Beauty of Joseon, Purito, Innisfree) are excellent options available globally through online retailers.',
    },
  },

  application_tips: {
    less_is_more: 'Applying a thin layer of SPF 50 instead of a thick layer of SPF 30 gives similar protection with less white cast',
    patting: 'Pat in rather than rub out — patting SPF into skin breaks up white cast more effectively',
    mixing: 'Some people mix their SPF with a drop of foundation or tinted moisturiser — note this dilutes the SPF significantly. Better to layer tinted moisturiser OVER sunscreen.',
    powder_spf: 'Powder sunscreens (Colorescience, Urban Decay) allow white-cast-free reapplication over makeup throughout the day',
    setting_sprays: 'SPF setting sprays for reapplication — limited protection per spray, but better than nothing for touch-ups',
  },
};

// ─── SPF RECOMMENDATIONS BY COMMUNITY ────────────────────────────────────────

export const SPF_BY_COMMUNITY = {
  'south-asian': {
    skin_concerns: 'Melasma is extremely common. PIH from every skin incident. Olive undertone means cool-toned white cast is more visible.',
    spf_priority: 'HIGH — melasma is worsened by every UV exposure. SPF is treatment, not just prevention.',
    recommendations: [
      'ISNTREE Hyaluronic Acid Watery Sun Gel SPF 50+ PA++++ — Korean formula, no white cast, hydrating',
      'Beauty of Joseon Relief Sun Rice + Probiotics SPF 50+ PA++++ — cult favourite, extremely wearable texture',
      'EltaMD UV Clear Tinted SPF 46 — good for medium-dark South Asian tones, niacinamide for hyperpigmentation',
    ],
    traditional: 'Turmeric-based sun protection is traditional in South Asia (ubtan mixtures) — while turmeric does have some UV-absorbing properties, it does NOT constitute adequate SPF protection. Traditional practice + modern SPF is ideal.',
  },

  'arab': {
    skin_concerns: 'Olive undertone, melasma common, medium-deep skin range',
    spf_priority: 'HIGH — olive skin burns and hyperpigments. Melasma common in Arab women, UV is major worsening factor.',
    recommendations: [
      'Altruist SPF 50 (EU formula) — excellent broad spectrum, affordable, available in Middle East',
      'La Roche-Posay Anthelios Anti-Imperfections — good for Arab skin with acne concerns',
      'Bioré UV Aqua Rich (Asian market) — very popular in Gulf countries through Asian grocery stores',
    ],
    note: 'The Gulf sun is extremely intense — UV index 9-11 daily through most of the year. SPF in MENA is particularly critical.',
  },

  'west-african': {
    skin_concerns: 'Deep skin tones, white cast is most visible and most problematic here, PIH, skin cancer risk underappreciated',
    spf_priority: 'CRITICAL — the myth that dark skin doesn\'t need SPF is most prevalent here and most dangerous. Acral melanoma and late-stage skin cancer diagnoses.',
    recommendations: [
      'Black Girl Sunscreen SPF 30 — specifically formulated for Black skin, zero white cast, moisturising, Black-owned',
      'Unsun Cosmetics Mineral Tinted Sunscreen — Black-founded brand, excellent for deep skin tones, no white cast',
      'COOLA Mineral Sun Silk SPF 30 — sheer finish mineral, manageable for deeper skin',
      'Fenty Skin Hydra Vizor Invisible Moisturizer SPF 30 — Rihanna built this for dark skin, light tint, sheer finish',
    ],
  },

  'black-american': {
    skin_concerns: 'Same as West African. Additionally: hair-wearing habits may mean SPF on scalp often neglected.',
    recommendations: [
      'Same as West African recommendations',
      'Bask & Lather SPF Scalp Spray — for natural hair wearers, SPF for exposed parts',
      'Kreyol Essence Haitian Gold SPF for face and body',
    ],
    scalp_note: 'The part of natural or protective-styled hair is often left exposed to direct sun. Powder SPF or spray SPF along the parting is important.',
  },

  'east-asian': {
    skin_concerns: 'Photodamage shows as pigmentation spots. Many East Asian women are highly UV-conscious with excellent SPF culture.',
    spf_priority: 'HIGH — culturally strong SPF ethic in Japan and Korea particularly. UV protection is a fundamental beauty step.',
    recommendations: [
      'Biore UV Aqua Rich Watery Essence SPF 50+ PA++++ — the benchmark for SPF texture globally, bestseller in Japan',
      'Anessa Perfect UV Sunscreen Milk (Shiseido) — professional-quality Japanese SPF',
      'Beauty of Joseon Relief Sun — rice extract + probiotics, cult Korean SPF',
      'Round Lab Birch Juice Moisturizing Sun Cream — hydrating Korean SPF',
    ],
    cultural: 'Japanese parasol (higasa) culture — sun protection through physical shade. Korean multi-layer UV protection including SPF steps early in routine, often double-layered. These practices predate the modern SPF market.',
  },

  'latina': {
    skin_concerns: 'Wide skin tone range, melasma common particularly with pregnancy (chloasma)',
    recommendations: [
      'Cetaphil Sun Gel SPF 50+ — available globally, chemical formula, sheer on medium skin',
      'Neutrogena Ultra Sheer Dry-Touch SPF 45 — good for warmer climates of Latin America',
      'La Roche-Posay Anthelios — widely available in Latin American markets',
    ],
    regional: 'Latin American climates are often tropical with high UV index — strong SPF particularly important in Mexico, Central America, Brazil, Caribbean coast.',
  },
};

// ─── SUNSCREEN APPLICATION ────────────────────────────────────────────────────

export const SPF_APPLICATION_GUIDE = {
  how_much: {
    face: '1/4 teaspoon (approximately 2mg/cm²) for the face — most people use far less than this, significantly reducing actual SPF received',
    body: '1 ounce (30mL, a shot glass) for full body',
    how_to_check: 'The SPF on the label is only achieved at this application density. Studies consistently show people apply 20-50% of the required amount.',
  },

  timing: {
    chemical_filters: 'Apply 15-30 minutes before sun exposure — chemical filters need time to be absorbed and become active',
    mineral_filters: 'Can be applied immediately before sun exposure — physical block is immediate',
    practical: 'Apply SPF as the last step in your skincare routine (before makeup) and give it a few minutes to settle before applying foundation',
  },

  reapplication: {
    when: 'Every 2 hours of direct sun exposure, or immediately after swimming or excessive sweating',
    why: 'UV filters photodegrade — they are used up by UV exposure. After 2 hours of outdoor exposure, significant protection is lost.',
    how_to_reapply_over_makeup: [
      'SPF powder (Colorescience, Neutrogena Mineral Sheers, Urban Decay)',
      'SPF setting spray (Supergoop, Coola)',
      'Blot, reapply SPF, then touch up makeup with powder',
    ],
    practical_note: 'If you\'re at an office most of the day and don\'t go outside between 11am-3pm, one morning application is adequate. Reapplication is critical for outdoor activities, beach days, or commuting.',
  },

  layering_with_makeup: {
    order: 'Skincare → SPF → Primer → Foundation. SPF goes ON TOP of all skincare, under makeup.',
    common_mistake: 'Foundation with SPF does NOT replace sunscreen. The application amount needed to achieve the stated SPF would look extremely heavy as a foundation layer. Use dedicated SPF under makeup.',
  },
};

// ─── BEYOND SPF: COMPREHENSIVE PHOTOPROTECTION ───────────────────────────────

export const COMPREHENSIVE_PHOTOPROTECTION = {
  what: 'SPF products are the most important tool but not the only one. Comprehensive photoprotection uses multiple strategies for maximum skin protection.',

  antioxidants: {
    why: 'UV exposure generates free radicals (reactive oxygen species) that damage skin even before the SPF is overwhelmed. Antioxidants neutralise free radicals, providing protection beyond what SPF can offer.',
    key_antioxidants: [
      'Vitamin C (L-ascorbic acid) — the most studied topical antioxidant, synergistic with SPF',
      'Vitamin E — synergistic with vitamin C, particularly when combined (SkinCeuticals CE Ferulic shows both together)',
      'Ferulic acid — stabilises vitamin C and E, increases their UV-protective efficacy',
      'Niacinamide — also provides some UV damage reduction via DNA repair support',
      'Green tea extract (EGCG) — antioxidant, anti-inflammatory',
      'Resveratrol — particularly in PM routine for repair',
    ],
    layering: 'Apply antioxidant serum UNDER sunscreen in the morning. Vitamin C serum → SPF = significant increased protection vs SPF alone.',
  },

  physical_protection: {
    hats: 'UPF 50 broad-brimmed hat protects face, ears, and neck. The most effective sun protection available — no reapplication needed.',
    clothing: 'UPF-rated clothing (Coolibar, Solbari, REI) blocks significant UV. Regular cotton provides approximately UPF 10-15; UPF 50 blocks 98% of UV.',
    sunglasses: 'UV-blocking sunglasses protect the periorbital area (around eyes) — an area where skin cancer is common and where lines form from UV damage. Look for "100% UV protection" or "UV400."',
    shade: 'Seeking shade between 10am-4pm (peak UV hours) significantly reduces exposure. UV index tracking apps help plan outdoor activities.',
    parasol: 'The Japanese and Korean tradition of UV-protective parasols (umbrellas) is genuinely effective — provides shade and reduces UV exposure significantly.',
  },

  diet_and_internal_protection: {
    carotenoids: 'Lycopene (tomatoes), beta-carotene (carrots, sweet potato), and other carotenoids provide some internal UV protection by accumulating in skin. NOT a substitute for SPF — a complement.',
    polyphenols: 'Green tea, cocoa, resveratrol consumed orally may provide some sun protection benefits through antioxidant accumulation in skin.',
    vitamin_d: {
      paradox: 'Vitamin D is synthesised in the skin via UVB exposure. Comprehensive sun protection reduces vitamin D synthesis — particularly relevant for Fitzpatrick IV-VI skin in low-sun climates where vitamin D synthesis is already reduced.',
      solution: 'Vitamin D supplementation (1000-4000 IU daily, or as recommended by doctor) + comprehensive sun protection. Do not skip SPF for vitamin D — supplement instead.',
    },
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getSPFForCommunity(communityId) {
  return SPF_BY_COMMUNITY[communityId] || null;
}

export function getWhiteCastSolutions() {
  return WHITE_CAST_GUIDE;
}

export function getUVBasics() {
  return UV_BASICS;
}

export function getSPFApplicationGuide() {
  return SPF_APPLICATION_GUIDE;
}

export function getComprehensivePhotoprotection() {
  return COMPREHENSIVE_PHOTOPROTECTION;
}

export const SUN_PROTECTION_STATS = {
  communitiesCovered: Object.keys(SPF_BY_COMMUNITY).length,
  chemicalFiltersListed: UV_BASICS.spf_rating_explained.numbers.length,
  whiteCastSolutions: Object.keys(WHITE_CAST_GUIDE.solutions).length,
};
