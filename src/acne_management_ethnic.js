/**
 * MIRRR — Acne Management for Ethnic Skin
 * Acne types, causes, treatments, PIH, and ethnic community
 * specific acne care across all 9 communities.
 */

export const ACNE_SCIENCE = {
  title: 'The Science of Acne',
  
  formation: {
    step1: 'Sebum (oil) is produced in the sebaceous gland attached to each hair follicle; androgen hormones (testosterone and its derivatives, present in both males and females) increase sebum production; excess sebum contributes to pore blockage',
    step2: 'Dead skin cells accumulate in the follicle opening and combine with excess sebum; this creates a "plug" that blocks the pore; without inflammation, this plug creates a comedo (blackhead or whitehead)',
    step3: 'Cutibacterium acnes (formerly Propionibacterium acnes) is a gram-positive bacterium that naturally lives on the skin; in an anaerobic (oxygen-free) blocked follicle, C. acnes proliferates rapidly and produces inflammatory fatty acids from the excess sebum',
    step4: 'The immune system detects C. acnes activity and mounts an inflammatory response; this inflammation is what creates the characteristic redness, swelling, pain, and pus of inflammatory acne lesions'
  },
  types: {
    comedonal: {
      what: 'Non-inflammatory acne; blocked follicles without significant infection',
      blackhead: 'Open comedo; the "black" colour is not dirt but oxidised melanin and sebum exposed to air; NOT a cleanliness issue',
      whitehead: 'Closed comedo; the plug is sealed under the skin surface; appears as small white or skin-coloured bump',
      treatment: 'Retinoids (most effective — directly target abnormal skin cell turnover that causes comedone formation); salicylic acid (BHA that penetrates the pore); adapalene gel (most evidence-based OTC treatment for comedonal acne)'
    },
    inflammatory: {
      papule: 'Small, raised, red, firm bumps; inflamed comedone without pus; smaller than a centimetre',
      pustule: 'Red bump with visible white or yellow pus head at the centre; the classic "pimple" most people recognise',
      nodule: 'Large, solid, painful bump deep within the skin; no visible head; occurs when inflammation affects deeper layers; takes weeks to resolve; higher risk of scarring',
      cyst: 'Large, fluid-filled lesion; often fluctuant (moves when pressed); the most severe form of acne; highest risk of significant scarring; cystic acne is the form most likely to require professional treatment'
    },
    grades: {
      I: 'Mild: primarily comedonal; few inflammatory lesions',
      II: 'Moderate: comedonal plus multiple inflammatory papules and pustules',
      III: 'Moderately severe: numerous inflammatory lesions; possible nodules',
      IV: 'Severe: primarily inflammatory with cysts and nodules; significant risk of scarring'
    }
  },
  hormonal: {
    what: 'Hormonal acne is driven by hormonal fluctuations that increase sebum production; affects the lower face (jawline, chin, cheeks), neck, and sometimes back and chest; often cyclical in women (worsening in the week before menstruation when oestrogen drops and androgen effects are relatively unopposed)',
    causes: ['Menstrual cycle (premenstrual flares)', 'Polycystic ovary syndrome (PCOS) — a common cause of persistent adult female acne with elevated androgens', 'Starting, stopping, or changing hormonal contraception', 'Pregnancy', 'Perimenopause', 'Thyroid disorders', 'Adrenal issues'],
    
    treatments: ['Combined oral contraceptive pill (estrogen + progestin): FDA-approved acne treatment; reduces androgen effects; Ortho Tri-Cyclen, Yaz, Estrostep are FDA-approved for acne', 'Spironolactone: oral medication; androgen blocker; very effective for hormonal acne in women; not used in men; 25-100mg daily', 'Topical treatments may have limited effect on hormonal acne if the underlying hormonal cause is not addressed']
  },
  fungalAcne: {
    what: 'Pityrosporum folliculitis (Malassezia folliculitis) is commonly confused with acne; it is NOT caused by C. acnes bacteria but by Malassezia yeast (the same organism responsible for dandruff) that infects hair follicles; the resulting bumps look similar to acne but are actually a fungal infection',
    appearance: 'Typically presents as uniform small, itchy bumps (unlike the varied sizes of acne); most common on forehead, chest, upper back, and shoulders; often worse in hot, humid conditions (when Malassezia thrives)',
    difference: 'Key distinction: Malassezia folliculitis does not respond to antibacterial acne treatments (because it is a fungal, not bacterial, condition); it worsens when treated with antibiotics (which reduce C. acnes and other bacteria that compete with Malassezia); fatty acid-rich skincare (oils, heavy creams) can feed Malassezia and worsen the condition',
    treatment: 'Antifungal treatments: topical ketoconazole 2% (Nizoral shampoo used as a face or body wash, left on for 1-2 minutes before rinsing); selenium sulfide (Selsun Blue shampoo); oral antifungal medications for severe cases; avoiding fatty acid-rich oils on affected skin; avoiding occlusive products in hot weather',
    ethnicRisk: 'Higher risk in people living in or visiting tropical/humid climates; relevant for West African, Caribbean, South Asian, and East African communities in hot humid environments; also particularly relevant post-workout or in those who wear tight, non-breathable fabrics'
  }
};

export const ACNE_PIH_DEEP_DIVE = {
  title: 'Post-Inflammatory Hyperpigmentation — The Acne Aftermath',
  what: 'Post-inflammatory hyperpigmentation (PIH) is the dark spots left behind after acne lesions heal; it is not a scar in the strict sense (which involves collagen damage) but a pigmentation response to inflammation; the inflammation of acne triggers melanocytes to produce excess melanin, which remains after the active lesion has resolved',
  mechanism: 'Inflammation → prostaglandins and cytokines signal melanocytes → excess melanin produced → melanin deposited in keratinocytes → dark spot visible for weeks to months; the amount of PIH produced is proportional to the amount of inflammation (deeper, more inflamed lesions produce more PIH) and the density of melanocytes in the skin (Fitzpatrick IV-VI skin has more melanocytes and produces PIH more readily and more intensely)',
  vsScars: {
    PIH: 'PIH is flat, not textured; will eventually fade on its own (though this can take months to years without treatment); brown, dark brown, or even near-black in colour on very dark skin; responds to brightening treatment and SPF',
    PIE: 'Post-inflammatory erythema (PIE) is the red/pink marks left behind acne on lighter skin tones (Fitzpatrick I-III); it is vascular (blood vessel dilation) rather than pigment-based; responds to green-tinted colour correctors and treatments that reduce redness; less relevant for darker skin tones where PIH (pigmentation) is the primary aftermath concern',
    atrophicScars: 'Atrophic (depressed) scars include: ice pick scars (narrow, deep); boxcar scars (broad, box-like); rolling scars (undulating surface); caused by collagen loss from severe inflammation; not treatable with topical products alone (professional treatments: microneedling, chemical peels, subcision, fillers, laser resurfacing)',
    hypertrophic: 'Hypertrophic/keloid scars: raised, sometimes itchy scars; more common in Fitzpatrick IV-VI skin; keloids extend beyond the original wound border and can grow significantly; treatments include steroid injections, silicone sheets, cryotherapy, laser; keloid risk must be considered before any dermatological procedure on dark skin'
  },
  treatment: {
    SPF: 'The single most important PIH treatment: UV exposure dramatically darkens existing PIH and slows fading; daily SPF 30-50 is non-negotiable during PIH treatment',
    niacinamide: 'Niacinamide 4-5%: inhibits melanosome transfer; reduces PIH without the irritation risk that could worsen it; the safest and most recommended first-line PIH treatment for dark skin',
    vitaminC: 'Vitamin C 10-15%: brightening; antioxidant; combined with SPF in the morning is a powerful brightening protocol',
    tranexamic: 'Tranexamic acid 2-5%: particularly effective for PIH from inflammation; multi-mechanism approach; excellent safety profile for dark skin',
    AHAs: 'Lactic or mandelic acid (NOT glycolic for dark skin beginners): accelerate skin cell turnover, bringing fresh unpigmented cells to the surface faster; 1-2x per week maximum; start low',
    retinoids: 'Retinoids (tretinoin, retinol): accelerate cell turnover and fade PIH; but must be introduced very carefully in Fitzpatrick IV-VI skin as irritation can worsen PIH; start extremely low (0.01-0.025% retinol)',
    azelaic: 'Azelaic acid 10-20%: inhibits tyrosinase and reduces inflammation simultaneously; treats both acne (the cause) and PIH (the aftermath) at once; very well tolerated; available OTC at 10% and by prescription at 15-20% (Finacea, Skinoren)',
    timeline: 'PIH fades slowly: the very deepest PIH in the darkest skin can take 12-24 months to fully fade even with consistent treatment; lighter PIH on medium skin can fade in 3-6 months with active treatment; consistent SPF application is the single most impactful factor in the speed of fading'
  }
};

export const ACNE_TREATMENTS_OVERVIEW = {
  title: 'Acne Treatment Overview — OTC to Prescription',
  OTC: {
    benzoylPeroxide: {
      what: 'Benzoyl peroxide is an antibacterial; directly kills C. acnes bacteria on the skin; rapidly effective for inflammatory acne; 2.5% is as effective as 10% with significantly less irritation; available as washes, spot treatments, and leave-on products',
      caution: 'Bleaches fabric, bedding, and towels; use white towels and pillowcases; avoid touching hair or fabric immediately after application',
      darkSkin: 'Use with caution on Fitzpatrick IV-VI — can cause dryness and irritation that may worsen PIH; use 2.5% concentration; moisturise over the top; spot-treat rather than using all over if sensitive'
    },
    salicylicAcid: 'BHA that penetrates the pore; ideal for comedonal and mild inflammatory acne; 0.5-2% OTC; also mild antibacterial; gentler than benzoyl peroxide',
    niacinamide: 'Anti-inflammatory; reduces sebum; no direct antibacterial effect but reduces acne through inflammation reduction; very safe for all skin tones; ideal for sensitive or dark skin alongside other treatments',
    adapalene: 'Adapalene 0.1% (Differin Gel) is OTC in the US; a third-generation retinoid; among the best-evidenced OTC acne treatments; directly targets the abnormal cell turnover that causes comedone formation; also reduces inflammation; well tolerated; the preferred starter retinoid for darker skin tones due to less irritation than tretinoin',
    azelaic: 'Azelaic acid 10% is OTC in some countries; excellent for mild-moderate acne with PIH; anti-inflammatory, antibacterial, and tyrosinase-inhibiting in one ingredient; highly recommended for skin of colour'
  },
  prescription: {
    topical: ['Tretinoin (retinoic acid): the gold standard topical for acne and PIH simultaneously; prescription only; 0.025% to 0.1%; introduce very carefully in Fitzpatrick IV-VI skin', 'Clindamycin (topical antibiotic): reduces C. acnes; typically combined with benzoyl peroxide to reduce antibiotic resistance risk', 'Dapsone (Aczone): topical antibiotic particularly effective for inflammatory acne in adult women', 'Azelaic acid 15-20% (Finacea): prescription strength; excellent for skin of colour'],
    oral: ['Antibiotics: doxycycline, minocycline (tetracycline class); azithromycin; used for moderate-severe acne; should be combined with topicals and have a defined course (3-6 months maximum to reduce antibiotic resistance)', 'Spironolactone: for hormonal acne in women; androgen blocker', 'Combined oral contraceptive pill: for women with hormonal acne', 'Isotretinoin (Roaccutane/Accutane): the most powerful acne treatment; oral vitamin A derivative; dramatically reduces sebum production; clears even severe cystic acne in the majority of patients; 16-20 week course typically produces prolonged remission; requires iPLEDGE program in US due to teratogenicity (causes severe birth defects); numerous side effects including dryness; absolutely must not be used during pregnancy; monitored by a dermatologist with regular blood tests']
  },
  isotretinoin: {
    
    darkSkin: 'Isotretinoin in Fitzpatrick IV-VI skin is effective but requires careful monitoring; during treatment, dryness and irritation can trigger PIH if the skin is not well moisturised and protected; moisturising intensively during the isotretinoin course is critical for darker skin; a dermatologist with skin of colour experience is important',
    sideEffects: 'Lips and skin become very dry (standard; treat with rich lip balm and moisturiser); transient initial worsening of acne ("purge") in some patients; joint pain; elevated lipids (monitored with blood tests); teratogenic (requires two forms of contraception and monthly pregnancy tests for women of childbearing age in most countries); the depression risk has been studied extensively — the relationship is complex; current evidence does not confirm isotretinoin causes depression; severe acne itself is associated with depression which resolves when acne is successfully treated'
  }
};

export const ETHNIC_ACNE_GUIDES = {
  'west-african': {
    
    specificChallenges: ['PIH (post-inflammatory hyperpigmentation) from even minor inflammatory lesions; in very dark skin (Fitzpatrick VI), PIH can be intensely dark and take years to fade', 'Pseudofolliculitis barbae (razor bumps) in men — a beard/skin concern that mimics acne', 'Keloid scar risk from severe cystic acne in predisposed individuals (more common in Fitzpatrick V-VI skin)'],
    treatment: {
      priorities: ['SPF 50+ daily: the single most impactful step for PIH fading and prevention of darkening', 'Azelaic acid 10-20%: treats acne and PIH simultaneously; safest for dark skin', 'Niacinamide 4-5%: anti-inflammatory, reduces PIH', 'Adapalene 0.1% gel: effective with lower irritation risk than tretinoin', 'African black soap: anti-inflammatory, gentle cleansing'],
      avoid: 'High-strength chemical peels from unqualified practitioners; aggressive physical scrubs; inflammatory treatments that worsen PIH'
    },
    products: 'SkinByHyram endorsements of niacinamide; The Ordinary Azelaic Acid 10%; Differin Adapalene Gel; products marketed specifically for skin of colour (e.g. Topicals Faded Serum, which was created specifically for PIH and melanin-rich skin by a Black American founder)'
  },
  'south-asian': {
    
    dietary: 'Dietary associations with acne in South Asian communities include: high glycaemic diet (white rice, refined flour/maida used extensively in South Asian cooking raises blood glucose and IGF-1 which increases sebum); dairy consumption (milk and products increase IGF-1); highly spiced foods may trigger redness in some individuals though direct acne link is debated',
    ayurvedic: {
      traditional: 'Ayurvedic approaches to acne include: neem (Azadirachta indica) preparations (antibacterial, anti-inflammatory; widely used and with some scientific evidence); turmeric (curcumin: anti-inflammatory, applied topically; limited penetration but traditional significance); multani mitti (Fuller\'s earth clay mask: absorbs excess oil; traditional South Asian acne treatment); manjistha (Indian madder) for skin brightening',
      caution: 'Some Ayurvedic preparations contain undisclosed steroids in unregulated products; topical steroids suppress inflammation temporarily but when stopped cause severe rebound; "steroid-induced rosacea" and "topical steroid withdrawal" are real and serious; always use clinically validated treatments from reputable sources'
    },
    treatment: 'Niacinamide for PIH; azelaic acid; vitamin C with SPF for brightening; adapalene for comedonal acne; dermatologist consultation for hormonal acne (spironolactone or OCP consideration); avoid bleaching creams for PIH (hydroquinone overuse risk)'
  },
  caribbean: {
    
    climate: 'The tropical Caribbean climate creates specific acne triggers: high humidity promotes Malassezia folliculitis (fungal "acne"); sweat and heat can trigger acne mechanica; SPF use is critical but many chemical sunscreens can trigger breakouts in acne-prone skin — look for non-comedogenic mineral SPF options',
    cultural: 'Natural remedies for acne in Caribbean culture include: aloe vera (widely grown and used; anti-inflammatory); sea water (salt water drying effect; some antimicrobial properties); lime juice applied to spots (citric acid provides some exfoliation but is very photosensitising — must never be used before sun exposure)',
    caution: 'Lime juice on skin before sun exposure can cause phytophotodermatitis — severe permanent hyperpigmentation where lime juice contacted the skin; commonly affects arms and skin of people who squeeze limes outdoors in Caribbean communities; avoid lime juice on skin before sun exposure'
  },
  arab: {
    
    rosewater: 'Rose water (maʾ al-ward) as a toner is a traditional Arab remedy for acne-prone skin; rose water has mild anti-inflammatory and antibacterial properties; it is pH-balancing; using rose water as a toner after cleansing is traditional and supported by some evidence; Damascus rose water (from Syria) is traditionally considered the finest quality',
    blackSeed: 'Black seed oil (Nigella sativa / black cumin) is one of the most important traditional remedies in Arab medicine (referenced in Islamic texts); it has genuine anti-inflammatory, antibacterial, and antioxidant properties with scientific evidence; topical application of black seed oil has been studied for acne with promising results; oral black seed supplementation also has evidence for inflammatory conditions',
    diet: 'Diet in the Gulf region has changed significantly with increasing Westernisation; high glycaemic diet (white bread, rice, processed foods, sugary drinks) and increased dairy consumption are associated with increased acne; traditional Arab diets with olive oil, legumes, and lower dairy may be more skin-friendly',
    hammam: 'Regular hammam (Turkish bath/Arab bath) visits provide thorough pore cleansing; steam softens comedones; traditional hammam exfoliation (with kessa mitt) can help with mild comedonal acne; however, aggressive scrubbing can worsen inflammatory acne'
  },
  latina: {
    
    hormonal: 'Latina women, particularly of Mexican and Central American heritage, have higher rates of PCOS than other demographic groups in some US studies; this translates to higher rates of hormonal acne; evaluation for PCOS is important for Latina women with persistent adult hormonal acne along the jawline',
    diet: 'The dairy-acne link is relevant; traditional Mexican and Latin American diets include cheese, sour cream (crema), and milk; correlation between dairy consumption and acne has been found in multiple studies (through IGF-1 pathway); reduced dairy or dairy alternatives may help dairy-sensitive acne patients',
    cultural: 'Traditional Latin American remedies for acne: aloe vera (sábila) — universally used; aguacate (avocado) masks — rich, nourishing but potentially comedogenic for acne-prone skin; limón (lime/lemon) — used for spot treatment but photosensitising risk as in Caribbean communities; papaya enzyme — gentle natural exfoliant',
    treatment: 'Azelaic acid is particularly well-suited for Latina skin with mixed acne and PIH/melasma concerns; niacinamide; SPF 50+ with iron oxide for melasma-prone skin; adapalene; dermatologist consultation for PCOS-related hormonal acne'
  },
  'east-asian': {
    
    kBeauty: 'K-beauty approach to acne is typically gentler and more layered than Western approaches; focuses on: thorough double cleansing (removing comedone-causing impurities); centella asiatica (cica) for calming inflammation; tea tree oil (cautiously; can be irritating at high concentrations); BHA toners (2% BHA toners from COSRX, Stridex); snail mucin (growth factor content supports post-acne healing); rather than spot-treating with harsh high-concentration actives',
    centella: 'Centella asiatica (cica, gotu kola) is one of the most important East Asian skincare ingredients for acne-prone and sensitive skin; contains asiaticoside, madecassoside, and asiatic acid; anti-inflammatory; supports wound healing; reduces redness; widely used in Korean skincare; products: COSRX Centella Blemish Cream; Dr. Jart+ Cicapair Tiger Grass; Skin1004 Madagascar Centella',
    snail: 'Snail secretion filtrate (snail mucin) contains growth factors, glycoproteins, and hyaluronic acid; supports skin healing and regeneration; widely used in K-beauty for post-acne healing; COSRX Advanced Snail 96 Mucin Power Essence is the iconic K-beauty snail mucin product',
    diet: 'High glycaemic Korean and East Asian diets (white rice, ramyeon/instant noodles, ddeok rice cakes) may contribute to acne in susceptible individuals; the "glass skin" ideal in Korean beauty culture creates motivation for addressing acne that drives sophisticated skincare adoption'
  },
  'east-african': {
    
    traditional: 'Traditional East African acne remedies: neem preparations (used across East Africa as well as South Asia); aloe vera (widely grown in East Africa; applied directly from the plant); coffee grounds as a gentle scrub (Ethiopian heritage); frankincense (Boswellia) resin preparations applied to blemishes — anti-inflammatory and antimicrobial properties',
    diet: 'Injera (Ethiopian fermented flatbread from teff grain) is a low-glycaemic complex carbohydrate; traditional Ethiopian diet with lentils (misir), chickpeas, and injera is relatively skin-friendly compared to high-GI Western diets; the increasing consumption of Western fast food in urban Ethiopian cities is associated with increasing acne rates in younger generations',
    treatment: 'For Fitzpatrick IV-VI East African skin: niacinamide; SPF 30-50; azelaic acid; careful introduction of adapalene; avoid bleaching creams for PIH; see a dermatologist for cystic acne'
  },
  'south-african': {
    
    rooibos: 'Rooibos (red bush) tea is endemic to South Africa; applied topically, cooled rooibos tea has anti-inflammatory properties (antioxidant quercetin, luteolin content); using cooled rooibos tea as a toner or applying a rooibos tea bag directly to blemishes is a traditional South African remedy; Africology and other South African natural beauty brands use rooibos in acne preparations',
    marula: 'Marula oil (from the Sclerocarya birrea tree, native to southern Africa) has been studied for use on acne-prone skin; it is non-comedogenic and contains oleic and palmitic acids with anti-inflammatory properties; counterintuitively, some facial oils with appropriate fatty acid profiles can reduce rather than worsen acne by reducing the skin\'s need to overproduce sebum (the oil-cleansing/sebum regulation theory)',
    access: 'Access to dermatology in South Africa is significantly inequitable; private dermatology care is expensive and primarily available to higher-income (disproportionately white) communities; public sector dermatology waiting lists are very long; affordable OTC treatments (niacinamide, adapalene, azelaic acid) are particularly important in this access-constrained environment'
  },
  'black-american': {
    
    underrepresentation: 'Medical education in the US has historically taught skin conditions primarily on images of white skin; medical students and doctors may misidentify acne presentations on dark skin; acne on Fitzpatrick V-VI skin has a different visual presentation (less redness, more purple/grey tones to inflammation; PIH more prominent than active redness) and requires awareness from practitioners',
    cultural: 'Cultural perspectives on acne in Black American communities include "Black don\'t crack" mythology extending to skin care — sometimes leading to insufficient attention to active skincare interventions; however, beauty standards in Black American culture that value clear, radiant skin create strong motivation for acne treatment; content creators like Hyram Yarbro have become major acne skincare educators with specific attention to skin of colour',
    topicals: {
      brands: 'Brands specifically created for Black skin with acne: Topicals (Black-founded; "Faded" serum for PIH; "Like Butter" mask); Hyper Skin (Black-founded; "Hyper Clear" brightening clearing vitamin C serum targeting hyperpigmentation + acne); Pattern Beauty by Tracee Ellis Ross (hair care but Black representation-focused)',
      Bevel: 'Bevel (Tristan Walker, Black-founded) addresses razor bumps/PFB for Black men; the same PIH concerns from acne apply to PFB; Bevel\'s formulations address this'
    },
    community: 'Social media communities (#skincaretok, #melaninrichskin, #darkspots) have created powerful peer learning networks for Black American women navigating acne and PIH; the democratisation of skincare knowledge through TikTok and YouTube has significantly improved access to accurate information about skin of colour treatment',
    treatment: {
      priorities: ['SPF 50+ daily (with iron oxide for visible light protection which worsens PIH independently of UV)', 'Niacinamide 4-5%: first-line PIH treatment', 'Azelaic acid 10-20%: dual action on acne and PIH', 'Adapalene 0.1% (Differin): preferred starter retinoid for dark skin', 'Tranexamic acid for persistent PIH', 'Topicals Faded Serum (specifically formulated for melanin-rich skin with PIH)'],
      professional: 'For severe acne: isotretinoin (with intensive moisturisation protocol during treatment to prevent PIH-triggering dryness); chemical peels (low-strength lactic or mandelic acid peels by a practitioner experienced with dark skin); microneedling for atrophic scarring (safe for Fitzpatrick IV-VI in experienced hands); laser with extreme caution (Nd:YAG for Fitzpatrick V-VI if laser is appropriate)'
    }
  }
};

export function getAcneScience(topic) {
  const map = {
    formation: ACNE_SCIENCE,
    PIH: ACNE_PIH_DEEP_DIVE,
    treatments: ACNE_TREATMENTS_OVERVIEW
  };
  return map[topic] || null;
}

export function getEthnicAcneGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_ACNE_GUIDES['west-african'],
    'south-asian': ETHNIC_ACNE_GUIDES['south-asian'],
    caribbean: ETHNIC_ACNE_GUIDES.caribbean,
    arab: ETHNIC_ACNE_GUIDES.arab,
    latina: ETHNIC_ACNE_GUIDES.latina,
    'east-asian': ETHNIC_ACNE_GUIDES['east-asian'],
    'east-african': ETHNIC_ACNE_GUIDES['east-african'],
    'south-african': ETHNIC_ACNE_GUIDES['south-african'],
    'black-american': ETHNIC_ACNE_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

