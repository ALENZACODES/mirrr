/**
 * MIRRR — Sun Care and UV Protection Guide (Skin-of-Colour Focus)
 * Sunscreens, UV science, vitamin D, and multicultural considerations.
 */

export const UV_SCIENCE = {
  title: 'Understanding UV Radiation — the Full Picture',
  uvSpectrum: {
    uva: {
      range: 'UVA: 320-400nm wavelength',
      
      effects: 'Photoageing (the "A" in UVA = Ageing); causes direct DNA damage; generates free radicals; degrades collagen and elastin; causes pigmentation changes; associated with melanoma',
      protection: 'SPF does NOT measure UVA protection; UVA protection is measured by Persistent Pigment Darkening (PPD) test or PA+ system (used in Japan and South Korea); broad-spectrum sunscreens protect against both UVA and UVB; look for "broad-spectrum" label in the US; EU sunscreens have mandatory UVA protection relative to SPF'
    },
    uvb: {
      range: 'UVB: 280-320nm wavelength',
      penetration: 'Affects the outer skin layer (epidermis); blocked by glass; most intense at midday and in summer; varies significantly with altitude and latitude',
      effects: 'Sunburn; the primary cause of sunburn erythema; triggers vitamin D synthesis in the skin; direct DNA damage (thymine dimers); the primary driver of squamous cell carcinoma and basal cell carcinoma; also contributes to melanoma'
    },
    uvc: {
      range: 'UVC: 100-280nm wavelength',
      penetration: 'Blocked entirely by the ozone layer; does not reach the earth\'s surface under normal conditions; relevant only in contexts of significant ozone depletion and in artificial UV sources (germicidal lamps)',
      effects: 'Would cause severe skin damage if it reached the surface; used medicinally in germicidal lamps and certain psoriasis treatments (narrowband UVB)'
    }
  },
  spfMath: {
    
    
    
    
    reapplication: 'SPF is measured from a freshly applied standard dose; sunscreen must be reapplied every 2 hours outdoors and immediately after swimming or sweating; no sunscreen is truly water-proof (only water-resistant for 40 or 80 minutes per FDA labelling rules)'
  },
  uvIndex: {
    scale: 'The UV Index (UVI) measures UV intensity from 0 (no UV) to 11+ (extreme); developed by the World Health Organisation',
    levels: {
      low: 'UVI 0-2: Low; no protection needed for short exposure; lighter skin types should use SPF in summer',
      moderate: 'UVI 3-5: Moderate; SPF 15-30 recommended; seek shade at midday',
      high: 'UVI 6-7: High; SPF 30-50 required; wear protective clothing; limit midday sun',
      veryHigh: 'UVI 8-10: Very High; SPF 50+ required; minimise sun exposure 10am-4pm',
      extreme: 'UVI 11+: Extreme; SPF 50+ required; maximise protection; found at high altitude and near the equator'
    }
  }
};

export const SUNSCREEN_TYPES = {
  chemical: {
    name: 'Chemical (Organic) Sunscreens',
    mechanism: 'Absorb UV radiation and convert it to heat energy through a photochemical reaction; the UV is absorbed by the filter molecule which undergoes an electron excitation then releases the energy as heat',
    filters: {
      us: 'FDA-approved chemical filters (US): avobenzone (UVA); oxybenzone (UVA/UVB); octinoxate/octyl methoxycinnamate (UVB); octocrylene (UVB); homosalate (UVB); octisalate (UVB); sulisobenzone; ecamsule (Mexoryl SX — approved for certain products)',
      eu: 'EU-approved but NOT US-FDA approved (require NDA): Tinosorb S (Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine) — photostable broad-spectrum; Tinosorb M (Methylene Bis-Benzotriazolyl Tetramethylbutylphenol) — photostable broad-spectrum, elegant formula; Mexoryl XL (Drometrizole Trisiloxane) — UVA; Uvinul A Plus (Diethylamino Hydroxybenzoyl Hexyl Benzoate); Uvinul T 150 (Ethylhexyl Triazone) — UVB',
      advantage: 'More cosmetically elegant (thinner; no white cast; blends with all skin tones); easier to wear under makeup; photostable filters (Tinosorb S, Tinosorb M) are superior because they don\'t degrade in UV; US-approved filters like avobenzone are photounstable without stabilisers'
    },
    disadvantage: 'Need to apply 15-30 minutes before sun exposure; oxybenzone concerns (absorbed systemically; coral reef toxicity); some cause photosensitivity reactions; FDA reviewing several for US safety assessment'
  },
  mineral: {
    name: 'Mineral (Inorganic) Sunscreens',
    mechanism: 'Reflect and scatter UV radiation; zinc oxide and titanium dioxide sit on the surface of the skin and act as physical UV barriers',
    filters: {
      zincOxide: 'Zinc oxide: provides true broad-spectrum protection (UVA and UVB); rated most preferred by dermatologists for sensitive skin and children; approved by FDA; GRASE (Generally Recognized as Safe and Effective) status in FDA 2021 proposal',
      titaniumDioxide: 'Titanium dioxide: primarily UVB and short-wave UVA protection; less effective for longer-wave UVA than zinc oxide; often combined with zinc oxide for broad-spectrum; GRASE status in FDA 2021 proposal'
    },
    advantage: 'Physically sits on skin — no systemic absorption concern; effective immediately on application; FDA considers both GRASE; good for sensitive skin; stable in sunlight',
    disadvantage: 'White cast — the primary barrier to use on dark skin tones; thicker texture; less comfortable under makeup; newer tinted and micronised formulations reduce white cast but don\'t eliminate it for very dark skin tones'
  },
  hybrid: {
    name: 'Hybrid Sunscreens',
    description: 'Combine both mineral and chemical filters; reduce the amount of each needed; can provide broad-spectrum protection with reduced white cast compared to pure mineral; more cosmetically elegant than pure mineral',
    examples: 'La Roche-Posay Anthelios (European formulas); ISDIN Eryfotona (contains DNA repair enzymes in addition to filters)'
  },
  tinted: {
    name: 'Tinted Sunscreens',
    description: 'Mineral or hybrid sunscreens with iron oxide pigments to match skin tone; iron oxides provide additional protection against visible light which can worsen melasma; tinting addresses the white cast problem for medium skin tones; matching tints for very deep skin tones remain limited but are improving',
    examples: 'Black Girl Sunscreen (chemical; no white cast; specifically developed for darker skin tones); EltaMD UV Elements Tinted; La Roche-Posay Anthelios Tinted mineral SPF 45'
  }
};

export const WHITE_CAST_SOLUTIONS = {
  title: 'The White Cast Problem — Solutions for Darker Skin Tones',
  
  solutions: {
    chemicalSunscreens: 'Pure chemical sunscreens leave no white cast; if oxybenzone is a concern, formulations with avobenzone-only or newer filters (Korean/Asian sunscreens with Tinosorb) avoid oxybenzone entirely; EltaMD UV Clear, Supergoop Unseen, La Roche-Posay Anthelios Chemical provide elegant formulas with no white cast',
    asianSunscreens: 'Korean and Japanese sunscreens with Tinosorb S and Tinosorb M filters are often considered the gold standard for daily wear — photostable; no white cast; lightweight; often with skincare ingredients incorporated; brands: Anessa (Shiseido); Biore UV Aqua Rich; Skin Aqua; COSRX; Beauty of Joseon; Elta MD UV AOX; these are widely available online',
    blackGirlSunscreen: 'Black Girl Sunscreen Make It Glow SPF 30 (SPF 30, chemical, specifically developed by a Black woman for dark skin tones; no white cast; leaves a subtle glow)',
    tintedOptions: 'Tinted mineral sunscreens with iron oxide pigments; the tint counteracts the white cast; the iron oxides also provide additional protection against visible light (relevant for melasma); EltaMD UV Elements Tinted; Colorescience Sunforgettable (powder SPF for reapplication over makeup)',
    bronzingFormulas: 'Sunscreens with light-diffusing or bronzing properties: Supergoop Glowscreen SPF 40',
    layering: 'Applying tinted moisturiser or foundation over mineral sunscreen to cover the white cast — this is valid; let the sunscreen set for a few minutes and press (do not rub) the makeup on, because rubbing can move the sunscreen film and lower protection'
  }
};

export const VITAMIN_D_CONSIDERATIONS = {
  title: 'Vitamin D, Sunscreen, and Skin of Colour',
  vitaminDSynthesis: 'Vitamin D3 (cholecalciferol) is produced in the skin when UVB radiation converts 7-dehydrocholesterol to previtamin D3; this is then converted in the liver and kidney to the active form 1,25(OH)2D3 (calcitriol); vitamin D is the only micronutrient that the body makes from sunlight exposure',
  melaninAndVitaminD: 'Higher melanin content in darker skin significantly reduces UVB penetration to the stratum basale where vitamin D synthesis occurs; darker-skinned individuals require 3-5× more sun exposure to produce the same amount of vitamin D as lighter-skinned individuals; this has significant implications for vitamin D deficiency risk',
  deficiencyRisk: {
    highRisk: 'Darker-skinned individuals living at higher latitudes (UK, Canada, Northern US, Scandinavia, Northern Europe) are at very high risk of vitamin D deficiency; UVB intensity at high latitudes is insufficient for vitamin D synthesis for most of the year (in the UK, UVB is too weak for vitamin D synthesis from October to April); African, South Asian, Caribbean, and Middle Eastern communities in the UK are among the most vitamin D deficient populations documented in Western countries',
    
    symptoms: 'Vitamin D deficiency: fatigue; bone pain; muscle weakness; depression; compromised immune function; in severe cases (rickets in children; osteomalacia in adults) bone deformity; for skin, vitamin D deficiency may worsen atopic dermatitis and psoriasis'
  },
  sunscreenAndVitaminD: {
    concern: 'A common concern: does using sunscreen prevent vitamin D synthesis?',
    answer: 'In practice: no — not significantly; reasons: most people do not apply enough sunscreen to block all UVB (as little as 10-15 minutes of arm/leg sun exposure before applying sunscreen synthesises adequate vitamin D for most people); sunscreen is rarely applied to all sun-exposed surfaces; application is imperfect; for very dark-skinned individuals in low-UVB environments, the more practical approach is vitamin D supplementation rather than reducing sunscreen use',
    recommendation: 'Dark-skinned individuals living above 35° latitude (above Washington DC in the US; above Rome in Europe) should strongly consider vitamin D supplementation (1000-2000 IU daily for adults; discuss dosing with a healthcare provider); this approach is safer and more reliable than trying to get vitamin D from sun exposure in low-UV environments while maintaining skin protection'
  },
  supplementation: 'NHS UK recommends 10 micrograms (400 IU) daily for everyone, with higher risk groups such as South Asian and Black British communities specifically highlighted; many vitamin D researchers recommend higher doses (1000-4000 IU for adults) for individuals at high risk of deficiency; testing serum 25(OH)D is the way to know your actual levels; target: 50-70 nmol/L (20-28 ng/mL) with some evidence suggesting 75-100 nmol/L for optimal health'
};

export const ETHNIC_SUNCARE_GUIDES = {
  'west-african': {
    community: 'West African',
    uvExposure: 'West Africa has some of the highest UV index values on earth (tropical latitudes; dry season); Accra, Lagos, Dakar receive year-round extreme UV; UV index regularly exceeds 10-12 in dry season; equatorial areas reach 12+ year-round',
    cancerRisk: 'Lower but real skin cancer risk in West African skin; the melanoma that occurs in Black Africans is predominantly acral lentiginous melanoma (on palms, soles, and under nails — sites without melanin protection) rather than sun-induced melanoma; squamous cell carcinoma in chronic wounds (Marjolin\'s ulcer) is more common than in white populations but less common than UV-induced SCC in fair skin',
    mainConcern: 'UV in West Africa drives: dyspigmentation (uneven tone; post-inflammatory marks darkening with UV); photodamage that accelerates signs the melanin doesn\'t fully protect against; hyperpigmentation worsening from conditions like PIH, melasma',
    sunscreenAdvice: 'SPF 30-50 broad-spectrum; chemical formulas for no white cast; everyday application important even in very dark skin; wide-brimmed hats and UV-protective clothing practical; in heat and humidity, lightweight gel formulas and setting powder for longevity',
    vitaminD: 'West African communities in West Africa: sufficient vitamin D synthesis from sun exposure; no supplementation typically needed; diaspora communities in Northern Europe and Northern US: high deficiency risk; supplementation strongly recommended'
  },
  'south-asian': {
    community: 'South Asian',
    uvExposure: 'South Asia receives very high UV; Mumbai, Delhi, Karachi all have UV index regularly at 9-12; the monsoon season reduces UV temporarily but the dry season is intense; altitude in Nepal and parts of Pakistan raises UV further',
    melaninProtection: 'South Asian skin ranges from Fitzpatrick III (lighter North Indians, Pakistanis) to Fitzpatrick V (darker South Indians, Sri Lankans, Bangladeshis); UV protection from melanin varies accordingly; even Fitzpatrick III skin needs active sun protection',
    mainConcern: 'Melasma is the primary sun-related concern in South Asian women — hormonal trigger (contraceptive pill, pregnancy) combined with high UV exposure creates the "mask of pregnancy/melasma" pattern; strict sun protection is the most important melasma intervention; without SPF, any other melasma treatment is futile as UV immediately re-stimulates melanin',
    sunscreenAdvice: 'SPF 50+ for melasma-prone or hyperpigmented skin; reapplication in South Asian sun is critical (intense UV); tinted sunscreens with iron oxide provide additional protection against visible light which drives melasma; physical barriers (dupatta/scarf; umbrella; wide-brimmed hat) are culturally practised in South Asia and are effective',
    sunscreenBarrier: 'Cultural barrier to sunscreen in South Asia: the preference for lighter skin has historically led to seeking sun lightening rather than sun protection (sitting in sun to "tan" for those who want it vs avoiding sun for fair skin); the connection between sun protection and anti-melasma treatment is not always well understood',
    vitaminD: 'South Asian communities in the UK (particularly Pakistani, Bangladeshi, and North Indian heritage) have very high rates of vitamin D deficiency — one of the highest among any group; low vitamin D associated with PCOS, insulin resistance, and skin conditions in South Asian women; supplementation is strongly recommended'
  },
  caribbean: {
    community: 'Caribbean',
    uvExposure: 'The Caribbean receives intense year-round UV; latitude between 10°N and 25°N; UV index of 9-11+ year-round in most islands; the UV intensity combined with high reflectivity from turquoise sea and white sand significantly increases exposure',
    sunbathingCulture: 'Caribbean beach culture includes sunbathing for all skin tones; this is not inherently problematic for very dark skin (Fitzpatrick V-VI) but does expose the skin to UV that worsens PIH, hyperpigmentation, and long-term photoageing even without visible burning',
    actinicKeratosis: 'Actinic keratosis (precancerous sun-damage lesions) is rare in dark skin but not absent; Caribbean lighter-skinned individuals (Dominican Republic, Cuba, Jamaica with varied skin tones) need monitoring; darker-skinned Caribbean individuals should be aware of acral lentiginous melanoma which is not UV-driven',
    sunscreenAdvice: 'Water-resistant SPF 50+ for beach and outdoor activities; reapply every 2 hours and after swimming; wide-brimmed hats for the face; rashguards and UV-protective swimwear reduce need to reapply on body; chemical formulas preferred for underwater use (mineral physically washes off more easily)',
    vitaminD: 'Caribbean communities in the Caribbean: ample vitamin D from sun exposure; diaspora communities in UK, Canada, Northern US: high deficiency risk; the dramatic climate change means vitamin D from sun is simply not available for much of the year; supplementation recommended'
  },
  arab: {
    community: 'Arab',
    uvExposure: 'The Arab world spans very different UV conditions: Gulf (Qatar, UAE, Saudi, Kuwait): extreme UV year-round (UV index 8-12+); Iraq, Syria, Egypt: very high UV summer, lower winter; North Africa (Morocco, Algeria, Tunisia): Mediterranean pattern — high summer, moderate winter; proximity to desert (no cloud cover) intensifies UV',
    cultureAndSun: 'Traditional Arab culture has practical sun protection built in: abaya (full covering garment) provides significant UV protection for women who wear it; keffiyeh/ghutra (traditional head covering) protects the head and face in Gulf culture; traditional architecture (indoor courtyards; shaded souks) limited midday sun exposure; the modern shift to cars and air-conditioned buildings has reduced some traditional sun protection while maintaining the cultural preference for lighter skin',
    
    vitaminD: 'A paradox: Middle Eastern populations have very high rates of vitamin D deficiency despite living in one of the sunniest regions on earth; reasons: covering (abaya, hijab, niqab); cultural preference for staying indoors during peak heat (40°C+); avoidance of sun for skin lightening preference; supplementation is commonly needed in the Gulf despite sun intensity'
  },
  latina: {
    community: 'Latina/Latin American',
    uvExposure: 'Latin America spans enormous geographic range: Mexico City (altitude 2240m — higher UV despite lower latitude); Brazilian northeast coast — intense UV; Andean altiplano (Bolivia, Peru at 3500-4000m — very high UV); Argentina/Chile southern tip — UV lower than tropics; ozone hole above southern South America (March-November) increases UV particularly in Patagonia',
    
    sunscreenAdvice: 'Tinted SPF 50+ with iron oxide for melasma prevention and treatment; daily application including overcast days (UVA penetrates clouds); wide-brimmed hats are popular in Mexican and Andean cultures and are effective; for tropical Latina skin: oil-control primers under SPF for longevity in heat',
    culturalNotes: 'Sunscreen use is complicated by: the "sunkissed" aesthetic prized in some Latin countries; the beach culture of Brazil and Mexico; the tanning culture in higher-income lighter-skinned Latin communities; the very legitimate concern among darker-skinned Latinas about white cast from mineral SPF; chemical formulas solve the white cast issue',
    vitaminD: 'Latin American communities in tropical/subtropical regions: generally adequate vitamin D; diaspora communities in Northern US, Canada, Spain, Italy at higher latitudes: moderate deficiency risk; darker-skinned Latina women at higher risk than lighter-skinned'
  },
  'east-asian': {
    community: 'East Asian',
    uvExposure: 'East Asia UV levels: Japan — moderate in winter, high in summer; South Korea — similar to Japan; China — very variable (Beijing continental pattern; Hong Kong subtropical); Taiwan — subtropical; the East Asian sun protection culture historically precedes modern sunscreen awareness',
    sunProtectionCulture: 'East Asian sun protection culture is arguably the most advanced globally: UV-cut umbrellas (a normal daily accessory in Japan, South Korea, China); UV-protective clothing; arm sleeves; face masks (pre-COVID, worn for UV and pollution protection); KF94/N95 masks; sun protection is deeply culturally embedded and is driven partly by the preference for lighter skin (白い肌/白皙皮肤) and partly by advanced cosmetic awareness',
    japaneseKoreanSunscreen: 'Japanese and Korean sunscreen development is globally advanced; reasons: the domestic market demands cosmetically elegant formulas; access to Tinosorb and other advanced EU-approved filters; intense product innovation culture; the result is sunscreens that are lightweight, leave no white cast, often include skin care actives, and are highly photostable; these are the most recommended sunscreens globally by many dermatologists for ease of daily use',
    sunscreenAdvice: 'Asian sunscreens: Anessa (Shiseido) Perfect UV Skincare Milk; Biore UV Aqua Rich Watery Essence; Skin Aqua UV Super Moisture Gel; COSRX Shield Fit All Green Comfort SPF50+; Beauty of Joseon Matte Sun Stick; all are available internationally and are considered superior for no-white-cast daily use',
    vitaminD: 'East Asian populations living in East Asia: moderate vitamin D — adequate in summer, some deficiency risk in winter at northern latitudes (Tokyo, Seoul, Beijing all at latitude 35-40°N); rigorous sun avoidance in East Asian culture combined with northern latitudes creates a real vitamin D deficiency risk; vitamin D supplementation is under-discussed in East Asian cultures where sun avoidance is encouraged'
  },
  'east-african': {
    community: 'East African',
    
    
    diaspora: 'Ethiopian, Somali, Eritrean, Kenyan, and other East African diaspora communities in Scandinavia, UK, and Northern Europe have extremely high vitamin D deficiency rates combined with low sunscreen use; the combination of very dark skin, high latitude, minimal sun exposure, and traditional modesty dress creates severe vitamin D insufficiency risk',
    sunscreenAdvice: 'Chemical or hybrid SPF 30-50; lightweight textures for hot, humid coastal environments; in Ethiopian highlands, SPF becomes particularly important despite the cold; for diaspora communities, prioritise daily SPF face use and vitamin D supplementation',
    vitaminD: 'East African diaspora in Northern Europe and North America: among the highest-risk groups for severe vitamin D deficiency globally; NHS UK specifically identifies Black British as high risk; Ethiopian and Somali communities in Scandinavia show very high deficiency rates in studies; supplementation at higher doses (2000-4000 IU daily) may be needed to correct deficiency'
  },
  'south-african': {
    community: 'South African',
    uvExposure: 'South Africa receives extremely high UV: Johannesburg plateau (1753m above sea level) has elevated UV despite lower absolute temperature; Cape Town — Mediterranean pattern with very high summer UV; Durban subtropical — high year-round UV; the southern hemisphere ozone hole extends over southern South Africa, particularly March-October, increasing UV further compared to equivalent northern hemisphere latitudes',
    ozoneHole: 'The Antarctic ozone hole grows and shifts northward over the southern tip of South Africa each spring (September-November); UV levels during ozone hole events can be significantly higher than the UV index forecast; the 2023 ozone hole was among the largest recorded; South Africans in the Western and Eastern Cape should be particularly vigilant about SPF during this period',
    
    sunscreenAdvice: 'SPF 50+ mandatory for light-skinned South Africans; SPF 30-50 for dark-skinned South Africans with particular attention to UV prevention for PIH and hyperpigmentation; physical barriers (hat, UV-protective clothing) are widely used and appropriate given the extreme UV; South African brands: Dermalogica SA; Skin Creamery (Cape Town); Hamilton Sun (widely available in SA supermarkets)',
    vitaminD: 'South African communities in South Africa: generally adequate vitamin D from sun exposure; South African diaspora in UK: high deficiency risk; supplementation recommended for diaspora'
  },
  'black-american': {
    community: 'Black American',
    uvExposure: 'US UV index varies significantly by geography: Miami FL — near tropical, high year-round; Los Angeles CA — Mediterranean, high summer; New York NY — moderate-high summer; Seattle WA — low-moderate; Black Americans are the most geographically diverse group in the US and UV exposure varies accordingly',
    
    
    sunscreenAdvice: 'Black Girl Sunscreen (the most celebrated Black-founded sunscreen brand; no white cast; SPF 30 and SPF 50 options); EltaMD UV Clear SPF 46 (popular among dermatologists; no white cast chemical); Supergoop! Unseen Sunscreen SPF 40 (no white cast chemical); tinted mineral SPF with iron oxide for visible light protection; daily SPF as part of skincare routine (not just beach/outdoor)'
  }
};

export function getSuncareGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_SUNCARE_GUIDES['west-african'],
    'south-asian': ETHNIC_SUNCARE_GUIDES['south-asian'],
    caribbean: ETHNIC_SUNCARE_GUIDES.caribbean,
    arab: ETHNIC_SUNCARE_GUIDES.arab,
    latina: ETHNIC_SUNCARE_GUIDES.latina,
    'east-asian': ETHNIC_SUNCARE_GUIDES['east-asian'],
    'east-african': ETHNIC_SUNCARE_GUIDES['east-african'],
    'south-african': ETHNIC_SUNCARE_GUIDES['south-african'],
    'black-american': ETHNIC_SUNCARE_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

