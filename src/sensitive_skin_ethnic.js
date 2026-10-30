/**
 * MIRRR — Sensitive Skin and Reactive Skin (Ethnic Focus)
 * Rosacea, eczema, contact dermatitis, barrier dysfunction, and ethnic skin reactivity.
 */

export const SENSITIVE_SKIN_SCIENCE = {
  title: 'Understanding Sensitive and Reactive Skin',
  
  mechanisms: {
    barrierDysfunction: 'The skin barrier (stratum corneum — the outermost dead cell layer; functioning as a "brick and mortar" structure of corneocytes in a lipid matrix of ceramides, free fatty acids, and cholesterol) normally prevents transepidermal water loss (TEWL) and keeps irritants out; barrier dysfunction allows irritants to penetrate more deeply and water to escape — this is the root cause of most sensitive skin reactions',
    neurosensory: 'Heightened neurosensory sensitivity: some individuals have more superficially positioned or more numerous TRPV1 (Transient Receptor Potential Vanilloid 1) nerve receptors near the skin surface; these receptors are "capsaicin receptors" — triggered by heat, acid, spicy chemicals, and many skincare ingredients; explains why some individuals feel burning from products others tolerate without any sensation',
    inflammation: 'Subclinical inflammation: some sensitive skin types have elevated baseline levels of inflammatory mediators (IL-1α, TNF-α, PGE2) in the skin even without visible symptoms; this "pre-inflamed" state lowers the threshold for visible inflammatory reactions',
    microbiome: 'Dysbiotic skin microbiome: disruption of the normal skin microbiome (e.g. reduced microbial diversity; Malassezia overgrowth; Staphylococcus aureus colonisation in eczema) contributes to barrier dysfunction and sensitisation'
  },
  
  ethnicBarrier: {
    differences: 'Ethnic differences in skin barrier function have been extensively studied: Black skin has higher TEWL than Asian skin but lower TEWL than White skin in some studies; others show no TEWL difference when Fitzpatrick type alone is controlled; ceramide composition differs by ethnicity — Black skin has lower ceramide-2 content (one of the critical barrier lipids) which may explain some of the barrier differences and eczema susceptibility differences; however, Black skin has a more compact stratum corneum (more cell layers in the same thickness) which confers barrier advantages; Asian skin (particularly East Asian) tends to have strong barrier function with low TEWL, which is one reason Asian skin is generally less prone to classic irritant contact dermatitis than Western skin'
  }
};

export const ECZEMA_ETHNIC = {
  title: 'Atopic Dermatitis (Eczema) in Ethnic Skin',
  
  presentation: {
    darkSkin: 'Eczema presentation in Fitzpatrick IV-VI skin: redness (erythema) may be difficult to detect against melanin-rich skin — the inflammation appears as ashy grey, purple, or dark brown patches rather than the classic red patches described in textbooks (which were written for Fitzpatrick I-III skin); this leads to systematic underdiagnosis and later diagnosis in darker-skinned children; the itch-scratch cycle causes PIH (hyperpigmentation at eczema sites that persists long after the active eczema resolves); follicular eczema (small bumps around hair follicles — more common in dark skin) is a distinct pattern not always recognised by practitioners unfamiliar with dark skin presentations',
    lightSkin: 'Eczema in Fitzpatrick I-III skin: classic erythematous (red) weeping plaques; flexural pattern (elbow, knee, wrist folds); lichenification (thickening from scratching); weeping and crusting; diagnosis typically straightforward due to visible erythema',
    pih: 'Post-inflammatory hyperpigmentation from eczema: after eczema resolves, dark patches (PIH) may persist for months to years in darker skin types; this PIH is often more distressing and visible than the active eczema itself; many families seek treatment for the "dark patches left by eczema"; this PIH is treated with emollients, anti-inflammatory agents, and eventually hyperpigmentation-targeting agents once the skin is stable'
  },
  treatment: {
    emollients: 'The foundation of eczema management: emollients (moisturisers) applied frequently and liberally; not a cosmetic intervention — emollients repair the defective skin barrier and reduce the frequency and severity of flares; for dark skin types: unscented, preservative-minimal formulations preferred; ceramide-containing emollients (CeraVe, Avene Trixera+, La Roche-Posay Lipikar Baume) replace the ceramide deficiency; heavy occlusives (white soft paraffin — petrolatum; shea butter; cocoa butter) are very effective in dry climates or during winter',
    steroids: 'Topical corticosteroids (TCS): first-line treatment for eczema flares; safe when used correctly (time-limited; appropriate potency for body area); fears about TCS causing skin lightening (topical steroid withdrawal, topical steroid atrophy) are legitimate concerns with prolonged overuse but should not prevent appropriate use; mild TCS (hydrocortisone 1%) for face; moderate TCS (betamethasone valerate 0.1%) for body; potent TCS only for severe flares under medical supervision',
    tacrolimus: 'Calcineurin inhibitors (tacrolimus 0.03%/0.1% — Protopic; pimecrolimus 1% — Elidel): steroid-sparing; can be used on the face, neck, and skin folds where TCS atrophy risk is highest; evidence for long-term safety is strong; the "Black box warning" about theoretical cancer risk has been reconsidered — observational data has not shown increased cancer risk with appropriate use',
    
    tralokinumab: 'Tralokinumab (Adbry): anti-IL-13 biologic; FDA-approved for adults with moderate-to-severe eczema; an alternative to dupilumab'
  },
  traditionalRemedies: {
    
    oatmeal: 'Colloidal oatmeal (oats ground to a fine powder that disperses in water): has anti-inflammatory, anti-pruritic, and barrier-restoring properties; the avenanthramides (phenolic antioxidants in oats) have been shown to inhibit NF-κB (a master inflammatory regulator); FDA-recognised as a skin protectant; widely used in traditional and modern eczema management across all communities'
  }
};

export const ROSACEA_ETHNIC = {
  title: 'Rosacea in Ethnic Skin',
  
  subtypes: {
    erythematotelangiectatic: 'ETR (Subtype 1): Persistent facial redness; flushing; telangiectasia (visible broken capillaries); burning and stinging; sun and heat triggers; in dark skin: the redness/erythema is difficult to see; the flushing is felt rather than seen; persistent discomfort, burning, and stinging are the primary symptoms leading to consultation',
    papulopustular: 'Papulopustular rosacea (Subtype 2): Inflammatory papules and pustules resembling acne but without comedones; the "acne rosacea"; in dark skin this is often misdiagnosed as bacterial acne because the red background is not visible; PIH from the papules makes the condition look more severe',
    phymatous: 'Phymatous rosacea (Subtype 3): Skin thickening; rhinophyma (bulbous nose enlargement — more common in men); more common in men; all skin types affected; the thickening does not cause PIH so may actually be more visible in darker skin',
    ocular: 'Ocular rosacea (Subtype 4): Eye involvement; grittiness; burning; redness of the conjunctiva; blepharitis; affects all skin types equally'
  },
  ethnicPresentation: {
    dark: 'In dark skin (Fitzpatrick IV-VI): rosacea presents with burning and stinging, papules and pustules, skin sensitivity, and difficulty with multiple products — but without the obvious redness that cues diagnosis in fair skin; patients often present having been told they have "resistant acne" for years; the diagnostic delay means chronic inflammation has been undertreated; a thorough history and pattern recognition (pustules without comedones; burning skin; triggers of heat, alcohol, spicy food) are key to correct diagnosis'
  },
  treatment: 'Azelaic acid (15% gel — Finacea; 20% cream): anti-inflammatory; antibacterial; reduces papules and pustules; safe for Fitzpatrick IV-VI; does not cause PIH; evidence base for rosacea is strong; also has melanocyte-inhibiting properties useful for concurrent PIH; topical metronidazole (0.75-1%); topical ivermectin 1% (Soolantra) — particularly effective for demodex-associated rosacea; topical brimonidine (alpha-2 agonist — reduces erythema and flushing through vasoconstriction; limited duration of effect); oral doxycycline (anti-inflammatory dose 40mg controlled-release — not the antibacterial dose) for moderate-to-severe papulopustular; isotretinoin (for very severe phymatous or recalcitrant rosacea)'
};

export const CONTACT_DERMATITIS_ETHNIC = {
  title: 'Contact Dermatitis in Ethnic Skin',
  types: {
    irritant: 'Irritant Contact Dermatitis (ICD): by far the most common form; caused by direct cytotoxic damage from a chemical (not immune-mediated); anyone can develop ICD with sufficient concentration/time of exposure; common beauty-product ICD triggers: sodium lauryl sulphate (SLS) in cleansers; retinoids (especially first weeks of use); glycolic acid; high-percentage vitamin C; propylene glycol; fragrances at high concentration; preservatives',
    allergic: 'Allergic Contact Dermatitis (ACD): immune-mediated (Type IV T-cell hypersensitivity); requires prior sensitisation; the most important ACD allergens in beauty products: fragrance (the #1 cause of cosmetic ACD globally — fragrance mix I and II; hydroxyisohexyl 3-cyclohexene carboxaldehyde (HICC) — now banned in EU/UK); preservatives (methylisothiazolinone and methylchloroisothiazolinone (MI/MCI) — banned in leave-on cosmetics in EU; formaldehyde releasers: DMDM hydantoin, diazolidinyl urea, imidazolidinyl urea, quaternium-15; parabens — rarely cause ACD despite being commonly suspected); hair dye PPD (paraphenylenediamine — the most common cause of hair dye ACD; can cause severe reactions including facial oedema, anaphylaxis; PPD cross-reacts with certain sunscreen agents, local anaesthetics, sulfa drugs); nickel in jewellery and some metallic accessories'
  },
  ethnicConsiderations: {
    fragrancePih: 'Fragrance-induced PIH: in darker skin types (Fitzpatrick IV-VI), fragrance ingredients can trigger post-inflammatory hyperpigmentation (Berloque dermatitis when involving photosensitising furanocoumarins; Riehl\'s melanosis — a diffuse hyperpigmentation from chronic low-level irritation/allergy including to fragrances); fragrance in skincare is a particularly significant concern for dark skin communities',
    hairDyeAcd: 'Hair dye ACD: PPD hair dye allergy is more common and more severe in individuals who dye frequently and in hairdressers; Black and African American communities with high rates of hair relaxer use also frequently dye hair — cumulative chemical exposure increases sensitisation risk; a positive patch test to PPD is an absolute contraindication to future PPD-containing hair dye use (can cause anaphylaxis on re-exposure)',
    hairRelaxerChemicals: 'Chemical hair relaxers (lye-based and no-lye) cause ICD of the scalp, ears, and hairline; the alkali (sodium or calcium hydroxide) causes direct chemical burns; chemical burns from relaxers left on too long are a recognised and under-reported occupational hazard among Black American hairdressers',
    nail: 'Nail gel/acrylic ACD: (meth)acrylate compounds in gel and acrylic nail products are significant sensitisers; rising rates of ACD due to increased gel and acrylic nail use; acrylate allergy then cross-reacts with medical adhesives, dental acrylics, and orthopedic bone cement — a significant occupational health issue for nail technicians'
  }
};

export const SKIN_BARRIER_REPAIR = {
  title: 'Skin Barrier Repair for Sensitive Ethnic Skin',
  
  niacinamide: 'Niacinamide (vitamin B3): multiple mechanisms relevant to sensitive skin: supports ceramide synthesis (boosts the skin\'s own ceramide production); reduces TEWL; anti-inflammatory (reduces inflammatory cytokines); reduces PIH (inhibits melanosome transfer from melanocyte to keratinocyte — key step in pigmentation); reduces pore appearance; well-tolerated at 2-10%; safe for Fitzpatrick IV-VI; essentially no sensitisation risk',
  moisturisers: {
    humectants: 'Attract water to the stratum corneum: hyaluronic acid (can hold 1000× its weight in water; most effective when applied to damp skin and sealed with an occlusive); glycerin (best-studied humectant for sensitive skin; concentration 5-25% is optimal — too high is paradoxically dehydrating in low-humidity environments); urea (at 5-10% excellent humectant; at 20-40% keratolytic — useful for very dry, thickened skin like keratosis pilaris)',
    emollients: 'Fill cracks between corneocytes and soften skin: ceramides; fatty acids (linoleic acid, oleic acid); squalane (from olives or sugarcane; lightweight; excellent for all skin types including oily and sensitive); jojoba oil (technically a wax ester — very stable; closely mimics sebum composition; good for sensitive skin); rosehip oil (rich in linoleic acid; evidence for PIH improvement)',
    occlusives: 'Form a film on the skin surface to prevent TEWL: petrolatum (white soft paraffin — the most effective occlusive known; safety profile is excellent; the "petrolatum is from petroleum therefore bad" logic is incorrect — petrolatum as used in cosmetics is highly refined and non-comedogenic; regarded as the gold standard occlusive in the medical community); shea butter; cocoa butter; beeswax; dimethicone (silicone; forms a breathable barrier)'
  }
};

export const ETHNIC_SENSITIVE_SKIN_GUIDES = {
  'west-african': {
    community: 'West African',
    
    barrierCare: 'Barrier repair is critical in West African skin: the traditional use of shea butter and natural oils reflects long-standing knowledge of sealing in moisture; unrefined shea butter is an occlusive and contains anti-inflammatory triterpene alcohols; layer approach: humectant (water, aloe, glycerin), then emollient (rosehip or squalane), then occlusive (shea butter or petrolatum) is a sound routine for barrier-compromised skin',
    triggerIdentification: 'Common irritant triggers in West African communities: lye relaxers (chemical burns); tight braids (mechanical inflammation); heavy synthetic fragrance in popular ethnic hair and skin care products; skin-lightening products containing mercury, steroids, or hydroquinone at high concentrations (mercury is a public health emergency in West African and diaspora communities — banned but still in circulation; contact dermatitis and systemic toxicity risk)',
    routineForSensitiveWestAfrican: 'Sensitive skin routine: gentle sulfate-free cleanser (or cleansing oil); niacinamide serum; ceramide moisturiser; unrefined shea butter as occlusive if needed; broad-spectrum SPF 30+ (chemical formula to avoid white cast); fragrance-free throughout'
  },
  'south-asian': {
    community: 'South Asian',
    commonSensitiveConditions: 'Rosacea (increasingly recognised in South Asian patients — often misdiagnosed as resistant acne for years); eczema; contact dermatitis from henna (PPD contamination — "black henna" used in mehndi often contains PPD which causes severe ACD; real henna is reddish-brown, not black); contact dermatitis from bindis (acrylate adhesives; metallic decorations with nickel)',
    hennaWarning: 'BLACK HENNA WARNING: "Black henna" used in temporary tattoos (particularly for tourists at markets and for mehndi applications) often contains PPD at high concentrations to produce the black colour; PPD at high concentrations causes severe allergic contact dermatitis (blistering, scarring, permanent hypopigmentation); PPD sensitisation then means the person can never safely use dark hair dye in future (risk of anaphylaxis); real henna is orange-reddish; any "black henna" should be refused',
    ayurvedicSensitivity: 'Ayurvedic skincare and sensitive skin: many traditional Ayurvedic ingredients are benign (sandalwood, rose, coconut oil, turmeric); some Ayurvedic preparations sold commercially contain undisclosed essential oils, plant extracts, or synthetic fragrance that can cause contact dermatitis; testing new Ayurvedic preparations on a small patch of forearm skin before full-face use is important for sensitive skin',
    routineForSensitiveSouthAsian: 'Gentle cleanser; azelaic acid (dual benefit for rosacea + PIH); niacinamide; ceramide moisturiser; tinted mineral SPF 50 (helps with PIH concealment + sun protection)'
  },
  caribbean: {
    community: 'Caribbean',
    commonSensitiveConditions: 'Contact dermatitis from hair products; eczema in diaspora; rosacea (in lighter-heritage Caribbean populations); seabather\'s eruption (Linuche unguiculata larvae causing a distinctive itchy rash under swimwear — this is a Caribbean-specific condition common in Bahamian waters; treated with oral antihistamines and topical steroids)',
    traditionalRemedies: 'Caribbean traditional remedies for sensitive skin: aloe vera (direct from the plant — anti-inflammatory; genuine evidence for burn and minor wound treatment; the clear gel component is the most used part); sea bathing in saltwater (ocean water has mild antibacterial and anti-inflammatory properties; sea bathers often note improvement in eczema, seborrhoeic dermatitis, and psoriasis — the Dead Sea salt bathing tradition for psoriasis has clinical backing)',
    allergenAwareness: 'PPD hair dye allergy (as above); fragrance allergy in beauty products; castor oil (Jamaican black castor oil — generally well tolerated but can cause contact dermatitis in sensitised individuals — rarely but does occur)'
  },
  arab: {
    community: 'Arab',
    
    oud: 'Oud and Arab fragrance — contact dermatitis: high-quality genuine oud has a low sensitisation rate compared to synthetic oud ingredients and fragrance chemicals; however, many "oud" products contain synthetic fragrance at high concentrations which can cause contact dermatitis; for sensitive skin, "uncontaminated" natural oud is preferred but rare and expensive',
    climateAndSkin: 'Gulf climate and sensitive skin: extreme temperature shifts (50°C+ outdoor to heavily air-conditioned indoor spaces); dry air indoors reduces stratum corneum hydration; these conditions are challenging for sensitive skin; the "air conditioning dermatitis" pattern — dry, itchy, reactive skin from prolonged air-conditioned indoor environments — is an underdiagnosed condition in Gulf communities',
    routineForSensitiveArab: 'Fragrance-free or low-fragrance formulations; micellar water (no-rinse cleanser preferred to avoid water temperature stress from tap water); azelaic acid for rosacea; ceramide-rich moisturiser; La Roche-Posay Toleriane range (specifically designed for sensitive/reactive skin; widely available in Gulf markets and pharmacies)'
  },
  latina: {
    community: 'Latina/Latin American',
    
    citrusWarning: 'Phytophotodermatitis WARNING: traditional Latina skin care uses lime and lemon juice (many communities use limón for skin brightening and hyperpigmentation treatment); furanocoumarins in lime/lemon juice + UV exposure = severe chemical burns and permanent hyperpigmentation; this is a CRITICAL SAFETY WARNING for Latina communities who are already more vulnerable to melasma from sun exposure; never apply lime or lemon juice to skin before going outdoors',
    traditionalRemedies: 'Aloe vera gel (widely used in Latin America; genuine evidence for wound healing and mild anti-inflammatory benefit; excellent first aid for minor burns and sun damage); chamomile (manzanilla) tea (as a soothing rinse or compress — anti-inflammatory chamomile; apigenin and bisabolol with evidence); calendula (cempasúchil — marigold; similar anti-inflammatory use; widely available)',
    routineForSensitiveLatina: 'Fragrance-free cleanser; niacinamide (for rosacea, PIH, and barrier support); ceramide moisturiser; mineral sunscreen SPF 50 (avoids chemical UV filters that can worsen rosacea flushing; tinted options exist to avoid white cast on Fitzpatrick IV-V Latina skin)'
  },
  'east-asian': {
    community: 'East Asian',
    
    kbeautyOverload: 'K-beauty "10-step routine" and sensitive skin: the elaborate multi-step K-beauty routine (double cleanse, essence, serum, ampoule, sheet mask, moisturiser, SPF) is appropriate for healthy skin but can be problematic for sensitive skin; too many actives (vitamin C, retinol, AHA, BHA) combined disrupt the barrier; the K-beauty approach needs simplification for sensitive skin: gentle cleanser + one treatment + moisturiser + SPF; "skinimalism" (minimalist skincare) trend within K-beauty directly addresses this',
    centella: 'Cica (Centella asiatica) as a sensitive skin treatment: Centella asiatica (cica, gotu kola, tiger grass) is the most significant East Asian skincare ingredient for sensitive and barrier-compromised skin; the actives (asiaticoside, madecassoside, Asiatic acid, madecassic acid) have clinical evidence for wound healing, anti-inflammatory activity, and barrier repair; widely used in Korean post-procedure skincare (Dr. Jart+ Cicapair; COSRX Centella range; innisfree Cica Balm); genuinely evidence-based for sensitive skin care',
    routineForSensitiveEastAsian: 'Oil cleanser (first cleanse; removes makeup/SPF gently) + gentle low-pH cleanser (second cleanse); Centella asiatica essence or serum; ceramide or snail mucin (glycoprotein — wound healing; hydration; well-tolerated) moisturiser; physical SPF 50+ (low irritation vs chemical filters for sensitive skin)'
  },
  'east-african': {
    community: 'East African',
    commonSensitiveConditions: 'Eczema; PIH from any inflammatory condition; contact dermatitis from hair products; keloid formation from minor skin injury (relevant for sensitive skin management — avoid procedures that breach the skin barrier without medical supervision)',
    traditionAndSensitiveSkin: 'Ethiopian and East African traditional skin care with butter (tesmi — spiced clarified butter; plain ghee): ghee/clarified butter is largely saturated fatty acids (palmitic, stearic, oleic) with trace milk proteins removed; it functions as a highly effective occlusive and emollient for dry/sensitive skin; the Ayurvedic tradition (ghee in Indian medicine; tesmi in Ethiopian tradition) and modern dermatology both support occlusive lipids for barrier repair; the practice of applying butter to dry/sensitive skin is genuinely beneficial from a lipid-barrier perspective',
    keloidsAndSensitiveSkin: 'Keloid and hypertrophic scar susceptibility in East African communities means that any treatment that breaks the skin barrier (chemical peels, dermabrasion, microneedling) must be approached with extreme caution; gentle topical approaches are preferred; any inflammatory skin condition should be treated promptly to prevent keloid-risk wound creation from scratching',
    routineForSensitiveEastAfrican: 'Gentle cleansing (water and unscented baby wash if needed); neem oil or tamanu oil (anti-inflammatory; antimicrobial) as treatment serum; clarified butter or unrefined shea butter as occlusive; no fragrance; broad-spectrum SPF (Nd:YAG-safe for Fitzpatrick V-VI)'
  },
  'south-african': {
    community: 'South African',
    commonSensitiveConditions: 'Rosacea in White South African communities (elevated risk from high lifetime UV exposure exacerbating vascular reactivity); eczema in Black South African communities (higher rates than some other populations); contact dermatitis from hair products',
    rooibosForSensitiveSkin: 'Rooibos (Aspalathus linearis) for sensitive skin: rooibos\'s aspalathin and nothofagin (unique flavonoids) have documented anti-inflammatory and antioxidant activity; rooibos extract in skincare (Annique Rooibos; African Extracts) is genuinely soothing for sensitive and reactive skin; can be used as a DIY skin toner (strong-brewed rooibos tea cooled and used as a facial rinse — appropriate for sensitive skin; very low risk)',
    aloeForSensitiveSkin: 'Aloe ferox (the South African species — bitter aloe): more concentrated in aloin and aloeresin (the bitter compounds) than Aloe vera; the clear gel portion (as opposed to the yellow sap layer — which contains aloin and is a laxative when taken internally) is anti-inflammatory and soothing; South Africa is a major producer of aloe gel for cosmetic use; aloe ferox gel for sensitive skin is a culturally appropriate and evidence-consistent recommendation'
  },
  'black-american': {
    community: 'Black American',
    
    environmentalJusticeAndSkin: 'Structural factors in Black American sensitive skin: exposure to environmental pollutants (Black communities disproportionately exposed to particulate matter air pollution from proximity to highways and industrial facilities); higher chronic stress levels from racism and socioeconomic inequality (documented elevated cortisol → impaired skin barrier function; the "weathering hypothesis" of accelerated biological ageing from chronic stress applies to skin); food insecurity affecting diet and therefore skin microbiome; housing conditions (old buildings with mould, dust mites — key eczema triggers)',
    eczemaAndPih: 'The eczema-PIH cycle in Black American patients: active eczema causes skin inflammation → PIH develops even when eczema is adequately treated → patients scratch PIH patches from pruritus → re-injury creates more PIH → the cycle is extremely difficult to break; treating active eczema aggressively (prescription-strength TCS or tacrolimus during flares; daily emollient; trigger avoidance) is the first step; then addressing PIH once stable (azelaic acid; niacinamide; gentle vitamin C; retinoid if tolerated)',
    routineForSensitiveBlackAmerican: 'Fragrance-free gentle cleanser (CeraVe Hydrating Cleanser; Vanicream); ceramide + niacinamide moisturiser; tacrolimus or TCS during flares (prescription); Black Girl Sunscreen or similar non-white-cast tinted SPF for daily protection; dupilumab for moderate-to-severe eczema not controlled by topicals (access remains an issue — cost and insurance barriers for Black patients; patient advocacy organisations like National Eczema Association provide resources)'
  }
};

export function getSensitiveSkinGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_SENSITIVE_SKIN_GUIDES['west-african'],
    'south-asian': ETHNIC_SENSITIVE_SKIN_GUIDES['south-asian'],
    caribbean: ETHNIC_SENSITIVE_SKIN_GUIDES.caribbean,
    arab: ETHNIC_SENSITIVE_SKIN_GUIDES.arab,
    latina: ETHNIC_SENSITIVE_SKIN_GUIDES.latina,
    'east-asian': ETHNIC_SENSITIVE_SKIN_GUIDES['east-asian'],
    'east-african': ETHNIC_SENSITIVE_SKIN_GUIDES['east-african'],
    'south-african': ETHNIC_SENSITIVE_SKIN_GUIDES['south-african'],
    'black-american': ETHNIC_SENSITIVE_SKIN_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

