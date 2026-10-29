/**
 * MIRRR — Skincare Routines by Age (Ethnic Skin Focus)
 * Teen through 50s+, with ethnic-specific considerations across all communities.
 */

export const SKIN_AGEING_SCIENCE = {
  title: 'How Skin Ages — the Biology',
  intrinsic: {
    name: 'Intrinsic (chronological) ageing',
    process: 'Genetically programmed; begins in the mid-20s with gradual reduction in collagen production (approximately 1% per year after age 20); declining elastin production; reduced cell turnover rate (from approximately 14 days in teenagers to 28+ days by middle age, and 45-60+ days in older adults); reduced sebum production; declining hyaluronic acid in skin; reduction in subcutaneous fat and glycosaminoglycans',
    ethnicDifference: 'Darker skin types (Fitzpatrick IV-VI) show intrinsic ageing approximately 10-20 years later than lighter skin types; this is due to higher melanin content providing some UV protection; more compact dermal fibre bundles; and higher mast cell concentration in deeper skin layers; "Black don\'t crack" has a genuine biological basis but is not an excuse to skip sun protection or actives — UV damage is cumulative even in dark skin'
  },
  extrinsic: {
    name: 'Extrinsic (photoageing) — UV-driven ageing',
    process: 'Accounts for approximately 80% of visible facial ageing; UV radiation (particularly UVA — the "ageing rays" that penetrate glass) causes: direct DNA damage (thymine dimers); free radical generation; collagen and elastin degradation (metalloproteinase activation); irregular melanin production (sun spots, mottled pigmentation); deep wrinkle formation',
    ethnicDifference: 'Darker skin has more melanin which provides some photoprotection (equivalent to approximately SPF 13 for Fitzpatrick VI skin) but this is insufficient; UVA penetrates equally regardless of skin tone; photoageing in darker skin presents differently — less wrinkle formation, more dyspigmentation (uneven tone, sun spots) as the primary visible sign; all skin types benefit from broad-spectrum SPF 30+ daily'
  },
  collagenTimeline: {
    twenties: '~1% per year loss beginning; largely imperceptible',
    thirties: 'Cumulative loss becoming visible; some fine lines; elasticity decreasing',
    forties: 'Acceleration; deeper lines; fat redistribution beginning; facial volume changes',
    menopause: 'Oestrogen decline causes approximately 30% of total skin collagen lost in first 5 years post-menopause; this is the most dramatic single collagen-loss period in a woman\'s life; skin becomes thinner, drier, less elastic most rapidly in this window'
  }
};

export const TEEN_SKINCARE = {
  ageRange: '12-19 years',
  skinCharacteristics: {
    sebum: 'Puberty triggers androgen surge → significantly increased sebum production → oily skin; peak sebum production is in adolescence',
    acne: 'Acne vulgaris affects approximately 85% of adolescents; driven by: excess sebum; Cutibacterium acnes bacteria proliferating in sebum-rich environment; abnormal follicular keratinisation; inflammation',
    ethnicConsiderations: 'PIH from acne is a critical concern for dark-skinned teenagers; even minor acne lesions can leave marks lasting months in Fitzpatrick IV-VI skin; this makes anti-inflammatory, non-irritating acne treatment more important in darker teens; aggressive drying treatments that cause additional skin irritation can worsen PIH cycle'
  },
  principles: {
    simpleRoutine: 'Teenage skin does not need a complex multi-step routine; over-skincareing is real; a simple routine done consistently outperforms a complex routine done inconsistently',
    sunscreen: 'Establishing a daily sunscreen habit in adolescence is the single most impactful anti-ageing and skin health decision; acne-prone teenage skin needs lightweight, non-comedogenic SPF 30+ (chemical formulas often preferred for oilier skin)',
    acneApproach: 'Mild-moderate acne: cleanser + spot treatment (benzoyl peroxide 2.5-5% — lower concentration as effective with less irritation; or salicylic acid 0.5-2% — BHA; or niacinamide 5-10% for inflammatory component); avoid stripping with multiple active ingredients simultaneously; if acne causes PIH that is not resolving, see a dermatologist'
  },
  morningRoutine: {
    step1: 'Gentle low-pH cleanser (not soap); use lukewarm water; avoid scrubbing',
    step2: 'Optional: lightweight toner or essence (hydrating, not astringent — alcohol toners are drying and worsening)',
    step3: 'Lightweight moisturiser (gel or oil-free for oily skin; basic cream for normal-dry)',
    step4: 'CRITICAL: Broad-spectrum SPF 30+ (non-negotiable; apply even on cloudy days; especially important for acne-prone skin as sun exposure darkens PIH marks)'
  },
  eveningRoutine: {
    step1: 'If wearing sunscreen or SPF makeup: double cleanse OR use micellar water first; then gentle cleanser',
    step2: 'If acne: spot treatment (benzoyl peroxide OR salicylic acid; not both at once) on affected areas only',
    step3: 'Moisturiser (same as morning or slightly richer)',
    step4: 'Eye area: gentle; optional separate eye cream not necessary at this age'
  },
  whatToSkip: 'Retinoids in teens — not necessary or appropriate for most; multiple active ingredients; physical exfoliation (scrubs) which can spread bacteria and cause micro-tears; physical extraction of spots; sun beds (UV ageing and skin cancer risk)',
  ethnicTips: {
    westAfrican: 'Focus heavily on preventing PIH from acne; azelaic acid 10-20% is particularly useful for teenagers of colour — antibacterial, anti-inflammatory, anti-PIH, and considered safe for teens; avoid comedogenic heavy butters on acne-prone areas (keep shea butter for body, not face if breaking out)',
    southAsian: 'PCOS-related hormonal acne may emerge in teenage years; if acne is clustered around the jaw and lower face, worsens with periods, and doesn\'t respond to topical treatment, seek medical evaluation; neem-based cleansers may offer mild antimicrobial benefit; avoid raw turmeric paste directly on acne (can irritate)',
    caribbean: 'Humid climate drives excess sweat and oil; use gel moisturisers and non-comedogenic lightweight SPF; double cleanse important after outdoor activities',
    arab: 'Black seed oil diluted in a lightweight carrier has some evidence for teen acne; heavy oud/fragrance in personal care products may worsen inflammatory acne — look for fragrance-free options',
    latina: 'PCOS is more prevalent (higher than average prevalence); hormonal acne pattern as per South Asian note; niacinamide is well-tolerated and particularly useful for teens with darker skin tones prone to PIH',
    eastAsian: 'SPF is culturally embedded from early age in Japanese/Korean skincare culture; this is the right habit; avoid the extreme skin-care routines popular on social media at young ages; gentle routine is more appropriate',
    eastAfrican: 'High altitude UV in Ethiopian highlands means SPF is especially critical; diaspora teens may face peer pressure to avoid sunscreen due to "dark skin doesn\'t need it" myths — this is false',
    southAfrican: 'Rooibos-based products may be particularly suitable for teenage skin in South Africa due to anti-inflammatory aspalathin',
    blackAmerican: 'The PIH cycle (acne → PIH → picking → more PIH) is common and important to interrupt at teenage stage; niacinamide 10% is a safe, OTC option for teens that addresses both acne and PIH; avoid benzoyl peroxide at concentrations above 5% which can cause significant bleaching of clothing and towels (particularly relevant for dark-toned teens using white products)'
  }
};

export const TWENTIES_SKINCARE = {
  ageRange: '20-29 years',
  skinCharacteristics: {
    peak: 'The 20s represent the last decade of youthful skin before collagen decline becomes perceptible; cell turnover remains relatively fast; skin is generally at its most luminous but concerns begin',
    changes: 'Gradual: fine lines beginning around eyes (crows feet) particularly for expressive people; first sun damage becoming more visible; possible hormonal changes (coming off contraceptive pills; pregnancy; PCOS management)',
    focus: 'Prevention is the theme of 20s skincare; habits established now determine what skin looks like at 40 and 50; this is when to establish a serious sunscreen habit and introduce the first retinoid'
  },
  principles: {
    prevention: 'Every day without SPF is a day of UV damage that will compound over decades; this is the time to take sun protection seriously',
    firstRetinoid: 'The mid-to-late 20s is appropriate for introducing retinoids; start with retinol (OTC; weaker than prescription tretinoin) at 0.025-0.1% to build tolerance; apply at night; use nightly moisturiser to manage initial dryness/purging; progress to higher concentrations or prescription tretinoin with a dermatologist',
    hydration: 'Hyaluronic acid serum (draws water into the skin) + occlusive moisturiser on top (locks it in); this combination is appropriate for all skin types in 20s'
  },
  morningRoutine: {
    step1: 'Gentle cleanser (double cleanse if overnight skincare buildup)',
    step2: 'Vitamin C serum (L-ascorbic acid 10-20% OR more stable derivatives like ascorbyl glucoside, ethyl ascorbyl ether); antioxidant protection against UV oxidative damage; also supports collagen synthesis; apply before SPF',
    step3: 'Lightweight moisturiser',
    step4: 'SPF 30-50 broad-spectrum; SPF 50 is recommended if outdoors or in high-UV environments'
  },
  eveningRoutine: {
    step1: 'Double cleanse (micellar + gentle cleanser, or balm + gentle cleanser) to remove SPF and pollution',
    step2: 'Hyaluronic acid serum or hydrating toner (damp skin; HA draws moisture in)',
    step3: 'Retinol/retinoid (start 2-3 nights per week; build to nightly tolerance; NOT on the same night as exfoliating acids initially)',
    step4: 'Moisturiser (seal in the retinol)',
    step5: 'Optional: eye cream (caffeine for puffiness; vitamin C for brightening; retinol for fine lines — use a separate gentler eye-specific retinol product near eyes)'
  },
  weeklyAdditions: 'BHA exfoliation (salicylic acid 2%) if oily/acne-prone; AHA exfoliation (glycolic or lactic acid) for surface radiance; clay mask for oily skin',
  ethnicTips: {
    westAfrican: 'Vitamin C is particularly important in the 20s for West African skin as an anti-PIH measure (inhibits tyrosinase) in addition to its antioxidant role; L-ascorbic acid can cause oxidative darkening on very dark skin tones when it oxidises — store properly (dark glass, refrigerator) or use more stable derivatives; bakuchiol as an alternative to retinol (better tolerated in darker skin, less initial purging)',
    southAsian: 'Begin niacinamide in 20s (5-10%): addresses PIH, sebum regulation, anti-inflammatory; this is highly compatible with South Asian skin concerns; bakuchiol from babchi (culturally familiar plant) is a retinol alternative worth exploring',
    caribbean: 'Sea moss gel as a hydrating essence layer in humid Caribbean climates; lightweight gel moisturisers for high-humidity environments',
    arab: 'Rosehip oil (not rose absolute) has vitamin A (retinoic acid precursor), vitamin C (as ascorbic acid), and linoleic acid — a good 20s facial oil for Arab skin with gentle anti-ageing and brightening properties',
    latina: 'Vitamin C + SPF is a powerful PIH-prevention combination particularly relevant for Latin skin prone to melasma (hormonally triggered PIH); start this combination early',
    eastAsian: '20s is when to establish K-beauty foundational routine: double cleanse + essence + moisturiser + sunscreen; Japanese sunscreens with Uvinul or Tinosorb filters are superior to many US sunscreens for daily anti-ageing',
    eastAfrican: 'Ethiopian coffee and teff breakfast nutrition is genuinely supportive of skin in 20s; consistent SPF use is critical for diaspora East Africans living at higher latitudes where vitamin D supplementation may be needed',
    southAfrican: 'South African 20s skin typically has excellent natural melanin protection; rooibos toner as hydrating step; marula oil as facial oil in evening routine',
    blackAmerican: '20s is when to consult a dermatologist about any ongoing PIH; start Vitamin C + SPF as a foundation habit; explore niacinamide for sebum regulation if acne-prone; this is also the decade to address any remaining acne with dermatologist guidance (retinoids, azelaic acid, spironolactone)'
  }
};

export const THIRTIES_SKINCARE = {
  ageRange: '30-39 years',
  skinCharacteristics: {
    changes: '30s bring first clearly visible changes: deeper smile lines (nasolabial folds beginning); forehead lines becoming more etched; under-eye area showing more volume loss; sun damage from 20s manifesting as mottled pigmentation; slower cell turnover meaning skin looks less luminous without help',
    hormonal: 'Many women in their 30s are pregnant or postpartum (hormonal fluctuations, melasma risk, hair loss); approaching perimenopause for some women in late 30s',
    focus: 'Treat + prevent: continue the preventive habits of 20s with more targeted treatments; retinoids if not already started'
  },
  upgrades: {
    retinoid: 'If OTC retinol isn\'t producing results, consider prescription tretinoin (0.025-0.05% starting); tretinoin has the most evidence of any topical anti-ageing ingredient — stimulates collagen production, accelerates cell turnover, improves pigmentation; requires dermatologist prescription; side effects (initial peeling, redness) are manageable with proper introduction protocol',
    niacinamide: 'Niacinamide 10% as a primary serum (not just spot treatment); at this concentration it addresses: enlarged pores; uneven tone; sebum regulation; anti-inflammatory; skin barrier support; compatible with most other ingredients',
    peptides: 'Introduction of peptides (Matrixyl, Argireline, copper peptides) — signalling molecules that stimulate fibroblasts to produce collagen; evidence is moderate but growing; appropriate additions in 30s',
    eyeArea: '30s eye treatment becomes more important; caffeine eye cream (addresses puffiness); retinol eye cream (for crow\'s feet — use a gentler formulation than the face product)',
    glycolic: 'Glycolic acid peel or serum (regular use for cell turnover and collagen stimulation) — established evidence for wrinkle reduction and texture improvement'
  },
  pregnancyAdaptation: {
    contraindicated: 'During pregnancy: STOP all retinoids (teratogenic risk); STOP high-dose salicylic acid (>2% leave-on); STOP hydroquinone; STOP chemical sunscreen active oxybenzone',
    safe: 'Safe during pregnancy: azelaic acid 10-20% (Class B, FDA; good evidence for safety; addresses acne AND hyperpigmentation AND rosacea); niacinamide; hyaluronic acid; vitamin C; zinc; mineral sunscreens (zinc oxide, titanium dioxide); bakuchiol (plant retinol alternative; limited safety data but appears safe in available studies)',
    melasma: 'Pregnancy melasma (chloasma) — "mask of pregnancy" is extremely common; sun protection is the most important prevention; daily SPF 50, hat, UV-protective clothing; post-pregnancy, azelaic acid + vitamin C + SPF is the first-line safe approach before returning to retinoids and hydroquinone'
  },
  ethnicTips: {
    westAfrican: 'Pregnancy melasma is very common in darker skin and can be severe; obsessive SPF application during pregnancy is critical; post-partum: niacinamide + vitamin C + sunscreen before returning to retinoids; tranexamic acid (emerging evidence for melasma) is a consideration post-pregnancy',
    southAsian: 'Melasma is one of the most common skin concerns in South Asian women (partly genetic predisposition, partly UV exposure patterns); the "pregnancy mask" pattern in South Asian women may be persistent post-partum; dermatologist evaluation for melasma is important',
    caribbean: 'Stretch marks: a significant concern during pregnancy; body butters with vitamin E, shea, and cocoa butter are traditionally used (evidence limited for prevention but safe and moisturising); accepting stretch marks as part of the body\'s story is culturally important in Caribbean communities',
    arab: 'Veil and hair covering: for women who cover, UV protection of the face requires consistent daily practice; the neck and décolleté (often less covered) should receive equal SPF attention',
    latina: 'PCOS-related hormonal acne may be addressed through hormonal therapies in 30s (oral contraceptive pills with anti-androgenic effect; spironolactone); the hormonal-acne-PIH cycle is particularly important to address in 30s Latina women',
    eastAsian: 'The 30s are when consistent sunscreen use since teenage years in East Asian skincare culture begins to visibly pay off; Korean glass skin in 30s is achievable with consistent hydration layering and SPF habits; tretinoin prescription is appropriate at 30s onset',
    eastAfrican: 'Hair changes in 30s: PCOS-related thinning; postpartum telogen effluvium (very common 3-6 months after delivery); seborrhoeic dermatitis of the scalp; these are worth distinguishing with a dermatologist consultation',
    southAfrican: 'Marula oil in the 30s serves as an excellent facial oil: the oleic acid replenishes, the tocotrienol antioxidants protect collagen, and the lightweight texture is appropriate for the Joburg/Cape Town climate',
    blackAmerican: 'The 30s are when to ensure PIH from any remaining acne is being treated effectively; tretinoin addresses both fine lines AND PIH simultaneously making it particularly valuable for Black women in their 30s; ensure any new hyperpigmentation is evaluated by a dermatologist (not all dark spots are PIH — some are seborrheic keratoses, post-inflammatory marks from other skin conditions, etc.)'
  }
};

export const FORTIES_SKINCARE = {
  ageRange: '40-49 years',
  skinCharacteristics: {
    perimenopause: 'Many women enter perimenopause in their 40s (average age of perimenopause onset is 47); oestrogen fluctuations cause: unpredictable skin dryness; skin sensitivity; hormonal acne in women who never previously had it; collagen loss accelerating; skin texture changes',
    structure: 'Facial fat pads (the subcutaneous structures that give the face its youthful shape) begin to move and reduce; this structural change drives the "hollow" appearance of 40s faces; topical products cannot address structural facial fat changes — this requires either acceptance or clinical intervention (fillers, etc.)',
    focus: 'Treatment-focused decade; retinoids are the most important tool; professional treatments (chemical peels, laser, microneedling) become relevant; considering hormonal options (systemic or topical oestrogen) with medical guidance'
  },
  upgrades: {
    retinoidIntensification: 'If on OTC retinol, 40s is the time to upgrade to prescription tretinoin (0.05-0.1%); the evidence for collagen stimulation, wrinkle reduction, and PIH improvement is strongest for tretinoin; clinical results at 0.05-0.1% are clearly superior to OTC products',
    professionalTreatments: {
      chemicalPeels: 'Deeper glycolic peels (30-70% — in-clinic only); TCA peels; these provide cellular turnover and collagen stimulation beyond what home products achieve',
      microneedling: 'Creates controlled micro-injuries that stimulate collagen production; evidence particularly strong for PIH and fine lines in darker skin tones; dermaroller vs professional radiofrequency microneedling — professional is more effective',
      laser: 'Different lasers for darker vs lighter skin: Nd:YAG (1064nm) is the safest laser wavelength for dark skin (lower melanin absorption); ablative lasers (CO2, Er:YAG) carry significant risk of PIH in dark skin; always disclose your Fitzpatrick type to any laser provider'
    },
    hormonal: 'Topical oestrogen: some gynaecologists prescribe topical oestriol for the face to address collagen loss; this is off-label use; evidence is limited but growing; HRT (systemic hormone replacement therapy) for perimenopause symptoms also supports skin collagen; this is a medical decision to make with a healthcare provider weighing all risks'
  },
  ethnicTips: {
    westAfrican: 'Fitzpatrick VI skin in 40s faces almost no UV-related wrinkle damage but may show significant dyspigmentation; the focus shifts to even tone, hydration, and structural; richer moisturisers become important as sebum production decreases in 40s',
    southAsian: 'PCOS comorbidities may intensify in perimenopause transition; the androgen levels in PCOS women may persist or even increase as oestrogen drops; hormonal acne patterns in South Asian women often persist into 40s and require hormonal management',
    caribbean: 'Caribbean women in 40s often have their skin at its most beautiful before perimenopause changes; melanin protection has minimised photoageing; focus on maintaining moisture and hydration as sebum naturally reduces',
    arab: 'Arabic perfumery with oud, musk, rose absolute — fragrances become more sensitising as the skin barrier becomes less robust in perimenopause; transition to fragrance-free skincare in the 40s is a useful step',
    latina: 'Melasma often persists and may worsen with perimenopause hormonal fluctuations; tranexamic acid (oral, under medical supervision, or topical 3-5%) is a significant emerging treatment for melasma in 40s Latina women; sunscreen obsession must be maintained through perimenopause hormonal changes',
    eastAsian: 'Japanese and Korean women in their 40s with consistent sunscreen habits from youth show significantly less photoageing than Western counterparts; the skin investment from 20s and 30s pays off visibly; continue layered hydration with ceramide-rich moisturisers as skin barrier function changes with perimenopause',
    eastAfrican: 'Darker East African skin in 40s typically shows remarkable photoageing resistance; focus on collagen support (retinoids, vitamin C, peptides), hydration (hyaluronic acid + occlusive), and monitoring for any skin changes requiring dermatologist attention',
    southAfrican: 'Rooibos extract anti-glycation properties become more relevant in 40s as advanced glycation end-products accumulate in skin collagen (a natural ageing process); rooibos-based skincare and rooibos tea consumption support both internal and external anti-ageing',
    blackAmerican: 'Perimenopause in Black American women: Black women enter menopause earlier on average than white women (2 years earlier in population studies) and have more severe perimenopausal symptoms; this has implications for earlier collagen loss onset; coordinate with a gynaecologist about HRT options; topical tretinoin with consistent SPF is the most evidence-based anti-ageing combination'
  }
};

export const FIFTIES_PLUS_SKINCARE = {
  ageRange: '50+ years',
  skinCharacteristics: {
    postMenopause: 'Post-menopausal skin: oestrogen is now at baseline low; approximately 30% of skin collagen has been lost in the first 5 years post-menopause; skin is thinner, drier, more fragile; sebum production is much lower; barrier function is impaired; healing is slower',
    concerns: 'Thinner skin that bruises more easily; increased dryness and itching (senile pruritus); deeper wrinkles; lost volume; age spots (lentigo senilis — UV-related); increased skin cancer risk; seborrhoeic keratoses becoming common',
    focus: 'Healing and barrier support become central; anti-ageing still relevant; skin cancer monitoring; adapting to reduced mobility (products that are easier to apply, simpler routines)'
  },
  principles: {
    barrier: 'Skin barrier function declines with age; ceramide-rich moisturisers (CeraVe, La Roche-Posay with ceramide technology) are particularly beneficial; occlusives (petrolatum, squalane) become more necessary',
    gentleness: 'Less is more — the skin is more reactive and slower to recover from irritation; reduce acid exfoliation frequency; ensure retinoids are well-tolerated (some 50+ women can only tolerate retinol 0.1% twice weekly)',
    sunscreen: 'Skin cancer risk increases with cumulative UV exposure; SPF 30+ remains non-negotiable for all skin types in 50s+',
    skincancerMonitoring: 'Annual skin check with a dermatologist for all adults; in lighter skin types (Fitzpatrick I-III), the risk is higher but all types require monitoring; know ABCDEs of melanoma (Asymmetry, Border irregularity, Colour variation, Diameter >6mm, Evolution/change)'
  },
  simpleRoutine50Plus: {
    morning: ['Gentle cream cleanser (non-stripping; may not need cleansing at all in the morning for very dry skin — just water or micellar)', 'Hydrating toner or essence (hyaluronic acid toner)', 'Niacinamide serum (tone-evening, barrier supporting)', 'Rich moisturiser with ceramides', 'SPF 30-50 broad-spectrum'],
    evening: ['Oil-based or balm cleanser (removes SPF/makeup; gentle)', 'Hydrating toner', 'Retinol (continue at a frequency the skin tolerates — may be 3×/week)', 'Rich moisturiser or facial oil (squalane, marula, rosehip)', 'Optional: separate neck and décolleté treatment (the neck ages faster than the face and is often neglected)']
  },
  ethnicTips: {
    westAfrican: 'West African women in 50s with Fitzpatrick V-VI often have significantly less UV photoageing than peers of lighter skin tone; melanin protection has done its job; however, dyspigmentation (uneven tone, age spots) remains relevant; focus on deep hydration with shea and baobab; body care becomes as important as face care as skin dries everywhere',
    southAsian: 'Post-menopausal South Asian women may see: melasma fading (as oestrogen drops — melasma often improves post-menopause); new seborrheic keratoses; changes in acne patterns; hair changes including facial hair increase (androgen balance shifts); hormonal skin changes deserve dermatologist evaluation',
    caribbean: 'Mature Caribbean skin often has the beautiful glow of melanin-rich skin that has aged slowly due to photoprotection; sea moss (carrageenan) and shea provide excellent moisture barriers for the skin; traditional Caribbean food (callaloo, plantain, fish) provides excellent nutritional support for skin in 50s',
    arab: 'Mature Arab skin in Gulf regions has faced high UV exposure throughout life; regular dermatologist skin checks important; traditional hammam (Turkish/Arab steam bath) practices continue to benefit mature skin through deep cleansing and circulation; traditional argan oil becomes particularly valuable for dry 50s+ skin',
    latina: 'Abuelas (grandmothers) have traditionally had beautiful skin often attributed to olive oil, avocado, and aloe vera use; these cultural practices have legitimate moisturising evidence; Mexican herbal remedies (aloe vera, calendula) are genuinely soothing for mature skin; Retin-A (tretinoin) is widely available over the counter in Mexico and Latin America — a prescription-only active in the US/UK; this accessibility has supported better anti-ageing routines in some Latina communities',
    eastAsian: 'Japanese and Korean women in their 50s and 60s with decades of consistent SPF use, double cleansing, and layered hydration demonstrate the payoff of these practices; focus on collagen support; soy isoflavones (from miso, edamame, doenjang) support oestrogen levels mildly in the post-menopausal period through phytoestrogenic activity; green tea antioxidants remain valuable internally and topically',
    eastAfrican: 'Traditional Ethiopian/Eritrean practice of butter (tesmi/niter kibbeh) and coffee for the skin persists in older communities; the rich saturated fat in clarified butter is an effective occlusive; the caffeine/antioxidant compounds in coffee grounds used as exfoliants provide mild stimulation; frankincense (etan) smoke treatments traditionally used for skin and hair continue to have cultural and mild therapeutic relevance',
    southAfrican: 'South African buchu and rooibos teas consumed daily throughout life; in 50s+, rooibos anti-inflammatory properties support the increased sensitivity of mature skin; marula oil for face and body remains excellent for South African mature skin; the Bain-Marula skincare range and other South African brands specifically formulate for mature melanin-rich skin',
    blackAmerican: 'Black American women in their 50s often see the dramatic visible difference between consistent sunscreen users and non-users within their community; among melanin-rich communities this comparison is most visible in hyperpigmentation and skin tone evenness rather than wrinkling; fibroids (which increase uterine bleeding) may cause iron deficiency that presents as hair thinning — address nutritionally (iron supplementation if deficient) and medically; consider collagen peptide supplementation (2.5-10g daily) which has evidence for skin hydration and elasticity in post-menopausal women'
  }
};

export const ALL_AGE_ROUTINES = {
  teens: TEEN_SKINCARE,
  twenties: TWENTIES_SKINCARE,
  thirties: THIRTIES_SKINCARE,
  forties: FORTIES_SKINCARE,
  fifties_plus: FIFTIES_PLUS_SKINCARE
};

export function getAgeRoutineForCommunity(ageGroup, communityId) {
  const directAgeMap = {
    teens: TEEN_SKINCARE,
    twenties: TWENTIES_SKINCARE,
    thirties: THIRTIES_SKINCARE,
    forties: FORTIES_SKINCARE,
    fifties_plus: FIFTIES_PLUS_SKINCARE
  };
  const ageData = directAgeMap[ageGroup];
  if (!ageData) return null;
  const tips = ageData.ethnicTips;
  if (!tips) return ageData;
  const directCommunityMap = {
    'west-african': tips.westAfrican,
    'south-asian': tips.southAsian,
    caribbean: tips.caribbean,
    arab: tips.arab,
    latina: tips.latina,
    'east-asian': tips.eastAsian,
    'east-african': tips.eastAfrican,
    'south-african': tips.southAfrican,
    'black-american': tips.blackAmerican
  };
  return {
    generalInfo: ageData,
    communityTip: directCommunityMap[communityId] || null
  };
}

export const SKINCARE_AGE_STATS = {
  moduleId: 'skincare_routines_by_age',
  version: '1.0.0',
  topics: ['collagen loss 1% per year age 20', 'PIH teenagers Fitzpatrick IV-VI', 'vitamin C retinol 20s anti-ageing', 'tretinoin prescription gold standard', 'pregnancy retinoid contraindicated teratogenic', 'azelaic acid Class B pregnancy safe', 'melasma hormonal PIH South Asian Latina', 'menopause 30% collagen loss 5 years', 'perimenopause age 47 average onset', 'ceramide barrier 50s post-menopause', 'Nd:YAG laser safe dark skin', 'Black women menopause earlier 2 years', 'PCOS hormonal acne 30s 40s', 'fibroids iron deficiency hair thinning'],
  communitiesSupported: 9,
  keyFacts: [
    'Collagen production declines by approximately 1% per year from age 20, making early habit formation critical; however, darker skin types (Fitzpatrick IV-VI) show intrinsic ageing approximately 10-20 years later than lighter skin due to higher melanin content and more compact dermal fibre bundles — the biological basis for "Black don\'t crack" — though UV protection remains essential for all skin tones as UVA penetrates regardless of melanin level',
    'The most dramatic single collagen-loss event in a woman\'s life is the first 5 years after menopause, during which approximately 30% of total skin collagen is lost as oestrogen declines; for Black American women, menopause occurs on average 2 years earlier than white women, meaning this collagen-loss acceleration begins earlier; coordinating with a gynaecologist about hormone replacement therapy is relevant to skin health as well as systemic wellbeing',
    'Retinoids (tretinoin/retinoic acid prescription and OTC retinol) are the most evidence-based topical anti-ageing ingredients available, with decades of RCT evidence for collagen stimulation, cell turnover, wrinkle reduction, and PIH improvement; retinoids are absolutely contraindicated in pregnancy (teratogenic); azelaic acid 10-20% is a highly effective pregnancy-safe alternative that addresses acne, PIH, and rosacea simultaneously',
    'For teenage and young adult skin of colour, Post-Inflammatory Hyperpigmentation (PIH) from acne is often a more significant and lasting concern than the acne itself; a minor pimple that resolves in days can leave a dark mark lasting 6-18 months in Fitzpatrick IV-VI skin; this makes anti-inflammatory, non-irritating acne treatment (azelaic acid, niacinamide) and aggressive sun protection particularly important for dark-skinned teenagers'
  ]
};
