/**
 * MIRRR — Scalp Health Ethnic Guide
 * Scalp microbiome, seborrheic dermatitis, scalp conditions, traction alopecia, hair loss by community
 * Topics: scalp biology, dandruff, sebderm, alopecia, scalp care routines, community scalp traditions
 */

// ============================================================
// SCALP BIOLOGY
// ============================================================

export const SCALP_BIOLOGY = {
  overview: `The scalp is the most unique skin environment on the body — a densely follicle-packed surface
  producing the highest sebum output per cm² of any body area, continuously colonized by a specific
  microbiome, and covered by hair that influences pH, humidity, and microbial access. Scalp health
  directly determines hair health: the follicle is anchored in the scalp, and follicle environment
  determines hair quality, growth rate, and longevity.`,

  anatomy: {
    follicles: {
      density: 'Scalp has ~100,000-150,000 hair follicles; density varies by ethnicity',
      structure: 'Each follicle: dermal papilla (growth center) + hair matrix (dividing cells) + sebaceous gland + arrector pili muscle',
      cycle: {
        anagen: 'Anagen (growth): 2-7 years; longer = longer potential hair length; Asian hair tends toward longer anagen',
        catagen: 'Catagen (transition): 2-3 weeks; follicle shrinks; club hair forms',
        telogen: 'Telogen (resting): 3 months; club hair rests; new hair begins pushing it out',
        exogen: 'Exogen (shedding): club hair sheds; normal 50-100 hairs/day'
      }
    },

    sebaceousGlands: {
      function: 'Produce sebum (mixture of fatty acids, wax esters, squalene, triglycerides, cholesterol)',
      scalp: 'Scalp sebaceous glands are largest and most active in body; explains scalp oiliness',
      ethinicity: 'Sebum production varies: studies suggest East Asian scalps produce similar sebum to European; exact ethnic variation under-studied',
      function2: 'Sebum coats hair shaft → lubricates → prevents dryness; BUT excess → oily roots + malassezia overgrowth'
    },

    microbiome: {
      composition: 'Scalp microbiome: Malassezia (fungi, dominant), Staphylococcus (bacteria, second), Propionibacterium, Cutibacterium',
      malassezia: {
        normal: 'Malassezia (Pityrosporum): normal scalp inhabitant; lipid-dependent yeast; feeds on sebum',
        excess: 'Malassezia overgrowth → irritation → dandruff (pityriasis capitis) or seborrheic dermatitis',
        strains: 'M. globosa is primary dandruff-associated species; produces oleic acid from sebum → barrier disruption → flaking'
      },
      balance: 'Healthy scalp: balanced microbiome; disruption by overwashing, product overload, stress, hormones → scalp conditions'
    },

    pH: {
      normal: 'Healthy scalp pH: 4.5-5.5 (slightly acidic)',
      importance: 'Acidic pH inhibits Malassezia growth; maintains hair cuticle closure (raised = frizz)',
      disruptors: ['Alkaline shampoos (pH 7+)', 'Baking soda rinses (popular but very alkaline)', 'Hard water (alkaline)'],
      maintenance: ['Apple cider vinegar rinse (diluted 1:4): acidifying treatment', 'pH-balanced shampoos (pH 4.5-5.5)', 'Filtered water for rinse']
    }
  },

  commonConditions: {
    dandruff: {
      clinical: 'Pityriasis capitis: mild form; white-gray flakes; scalp may be mildly itchy',
      prevalence: '50% of adult population affected at some point',
      cause: 'Malassezia + individual scalp reactivity + sebum composition + stress + climate',
      treatment: ['Zinc pyrithione shampoo (Head & Shoulders): reduces Malassezia', 'Selenium sulfide 1% (Selsun Blue): antifungal', 'Ketoconazole 1-2% (Nizoral): prescription-strength antifungal', 'Coal tar: reduces cell turnover, antifungal; messier option'],
      use: 'Medicated shampoo: apply to scalp, leave 3-5 minutes, then rinse; 2-3x weekly until controlled, then 1x weekly maintenance'
    },

    seborrheicDermatitis: {
      clinical: 'Sebderm: more severe than dandruff; yellowish, greasy flakes; red inflamed scalp; may extend to face (eyebrows, nose creases, ears)',
      prevalence: '3-5% of population; more common in men; peak adolescence and 30-60 years',
      cause: 'Malassezia + immune response + sebum + genetic predisposition + hormones + neurological association (higher in Parkinson\'s, HIV)',
      treatment: ['Ketoconazole 2% shampoo (Rx or 1% OTC)', 'Ciclopirox shampoo (Rx)', 'Selenium sulfide 2.5% (Rx)', 'Topical corticosteroid foam for inflammation', 'Zinc pyrithione for maintenance'],
      type4Challenge: 'Type 4 hair and sebderm: washing frequency conflict — sebderm needs frequent medicated wash; Type 4 hair dislikes frequent washing; solution: diluted medicated shampoo concentrated on scalp, hydrating conditioner on lengths'
    },

    tractionAlopecia: {
      definition: 'Hair loss caused by persistent mechanical tension on hair follicles; cumulative damage leads to permanent hair loss',
      highRisk: 'Black women: 17% affected; highest risk from tight braids, weaves, relaxer + tight style, repeated heat straightening',
      mechanism: 'Prolonged tension → follicle inflammation → follicle miniaturization → permanent loss at edges, nape, temples',
      earlySigns: 'Tenderness at hairline; small bumps or pimples at hairline after styling; fine baby hairs disappearing at edges',
      prevention: ['Never braid or weave while hair is wet (wet hair is most fragile)', 'Request loose tension from braider — should not feel tight after installation', 'Take protective style breaks between installs (2-4 weeks minimum)', 'Oil edges daily; massage to maintain circulation'],
      treatment: 'Early detection: remove tension immediately; topical minoxidil; steroid injections (dermatologist); late-stage loss is permanent'
    },

    alopeciaAreata: {
      definition: 'Autoimmune condition: immune system attacks hair follicles; causes patchy circular hair loss',
      prevalence: '2% lifetime risk regardless of ethnicity',
      types: ['Alopecia areata: patchy', 'Alopecia totalis: complete scalp loss', 'Alopecia universalis: complete body hair loss'],
      treatment: 'Dermatologist-supervised: topical corticosteroids; minoxidil; JAK inhibitors (new approval: baricitinib 2022); intralesional steroid injections'
    },

    CCCA: {
      name: 'Central Centrifugal Cicatricial Alopecia',
      definition: 'Scarring hair loss beginning at crown and expanding centrifugally; leads to permanent follicle destruction',
      ethnicity: 'PREDOMINANTLY Black women; up to 5.6% prevalence; most underdiagnosed hair disorder in Black women',
      causes: 'Multifactorial: genetics + chemical relaxers + tight hairstyles + inflammation + Demodex mites suggested in research',
      symptoms: 'Scalp tenderness, burning, tingling at crown; hair thinning expanding from crown outward',
      treatment: 'EARLY INTERVENTION CRITICAL: scarring is permanent; topical steroids; oral doxycycline; minoxidil; avoid chemical and heat'
    }
  }
};

// ============================================================
// SCALP CARE PROTOCOLS
// ============================================================

export const SCALP_CARE_PROTOCOLS = {
  overview: 'Scalp care should be customized to scalp type (oily, dry, normal, sensitive, condition-affected) and hair type simultaneously',

  assessment: {
    oily: 'Scalp oily within 24 hours of washing; product buildup; may have dandruff; flakes are small and oily-appearing',
    dry: 'Scalp tight, itchy; small white dry flakes; feels parched; more common in Type 4 hair wearers who extend wash days',
    normal: 'Comfortable; no significant itching; no significant flaking; balanced sebum',
    sensitive: 'Reacts to many products; stinging; redness; fragrance-free and minimal-ingredient products needed',
    conditions: 'Sebderm: yellow greasy flakes, redness; AA: patchy smooth loss; TA: edge/temple recession'
  },

  scalpMassage: {
    benefits: 'Increases blood circulation to follicles; 2019 study: 4 minutes daily scalp massage over 24 weeks increased hair thickness in participants',
    technique: 'Fingertips (not nails) in circular motion; gentle pressure; move through scalp systematically; 4-5 minutes',
    tools: 'Silicone scalp massager: increases circulation; helps distribute product; safe for all hair types',
    oil: 'Scalp massage with oil: traditional across almost all ethnic beauty traditions; castor oil most studied for hair growth (ricinoleic acid receptor activity)'
  },

  oilRituals: {
    castor: {
      evidence: 'Ricinoleic acid in castor oil: prostaglandin EP3 receptor activity = vasodilation = increased follicle blood flow',
      use: 'Apply to scalp; massage; leave 30 min to overnight; heavy texture — mix 50/50 with lighter oil',
      type4: 'Jamaican Black Castor Oil (JBCO): produced with ash; higher pH; opens cuticle for penetration; popular in Black American natural hair community'
    },
    brahmi: {
      herb: 'Bacopa monnieri (brahmi): Ayurvedic herb infused in oil; studied for DHT inhibition (androgenic hair loss)',
      use: 'Brahmi oil massage 1-2x weekly; South Asian traditional practice'
    },
    rosemary: {
      evidence: '2023 Dermatology study: rosemary oil 1% = minoxidil 2% for hair growth; promoted via TikTok; evidence base growing',
      use: '5-10 drops rosemary essential oil in carrier; scalp massage; leave on or wash out',
      mechanism: 'Ursolic acid: promotes epidermal growth factor (EGF) on follicles; anti-inflammatory; anti-DHT'
    }
  },

  productBuildupRemoval: {
    need: 'Silicones, waxes, and heavy butters build up on scalp; can clog follicles; inhibit product penetration',
    clarifyingShampoo: 'Strong surfactant (sodium lauryl sulfate or ammonium lauryl sulfate): removes all buildup; harsh — use 1x monthly maximum',
    chelating: 'Chelating shampoo (EDTA-containing): removes hard water mineral deposits; essential in hard water areas',
    scalp: 'Scalp scrub (salicylic acid or sugar-based): physical + chemical exfoliation of scalp; 1x monthly',
    ACV: 'Apple cider vinegar rinse (1:4 dilution): removes product, alkaline mineral deposits; pH balances scalp'
  }
};

// ============================================================
// 9 COMMUNITY SCALP HEALTH GUIDES
// ============================================================

export const ETHNIC_SCALP_HEALTH_GUIDES = {
  'west-african': {
    communityName: 'West African',
    primaryConcerns: ['Dandruff under braids and protective styles', 'CCCA risk (though CCCA is more specific to Black American/diaspora)', 'Scalp oiling traditions'],

    scalp: {
      condition: 'Type 4 hair: scalp tends to be drier than sebum production would suggest; sebum has longer to travel down coiled shaft',
      oiling: 'Daily or weekly scalp oiling with shea butter, coconut oil, or palm kernel oil: traditional West African scalp care',
      braids: 'Under braids: scalp can develop product buildup and dandruff; diluted shampoo in spray bottle between installs'
    },

    traditions: {
      shea: 'Shea butter massaged into scalp: traditional AND scientifically valid; anti-inflammatory, anti-fungal properties',
      moringa: 'Moringa oil on scalp: high oleic and behenic acids; nourishing; traditional Nigerian use',
      blackSoap: 'African black soap as scalp cleanser: saponins and ash create high-pH cleanser that cuts through buildup effectively'
    },

    advice: `West African scalp care is built on oiling — applied to the scalp as prevention and
    treatment. Under protective styles (braids, weaves): scalp access is limited but necessary.
    Dilute shampoo in a spray bottle and apply to scalp between style washes (every 1-2 weeks
    minimum). Shea butter on scalp edges prevents tension-related loss. If wearing long-term
    protective styles: check edges monthly for recession (traction alopecia early sign).
    When scalp itches under braids: that is a sign of buildup or dry scalp — address it;
    don't ignore because the style is inconvenient to remove.`
  },

  'south-asian': {
    communityName: 'South Asian',
    primaryConcerns: ['Champi (scalp oil massage) tradition', 'PCOS-related hair loss', 'High stress environments → telogen effluvium'],

    scalp: {
      champi: 'Champi: traditional South Asian scalp oil massage; warm coconut, sesame, or bhringraj oil; grandmother to granddaughter tradition',
      amla: 'Amla (Indian gooseberry): rich in vitamin C; traditionally believed to strengthen hair follicles; applied as oil or paste',
      PCOS: 'PCOS affects 6-12% of women; South Asian prevalence 52% higher; androgenic hair loss (DHT pattern) common comorbidity'
    },

    traditions: {
      coconut: 'Coconut oil champi: most traditional South Indian scalp treatment; saturated fat protects protein structure; applied warm, massaged, left overnight',
      bhringraj: 'Bhringraj (Eclipta alba) oil: Ayurvedic "king of herbs for hair"; studied for hair regrowth (equal to minoxidil in some studies); reduces Malassezia',
      brahmi: 'Brahmi oil: DHT inhibiting properties; traditional Ayurvedic scalp treatment for thinning hair',
      neem: 'Neem oil: antifungal; anti-dandruff; anti-bacterial scalp treatment'
    },

    advice: `South Asian scalp care is among the world's most sophisticated — champi has been practiced
    for centuries with a range of therapeutic oils. Bhringraj oil is the most evidence-backed
    Ayurvedic hair growth treatment: ricinoleic and rosmarinic acid content; direct follicle
    stimulation documented. For PCOS-related hair loss: this requires medical management
    (anti-androgens, insulin sensitizers) alongside topical minoxidil and scalp care.
    The champi ritual itself — 4-5 minutes of scalp massage — increases blood flow to follicles
    regardless of the oil used; the ritual's mechanisms are validated even when specific oil
    claims are less certain.`
  },

  caribbean: {
    communityName: 'Caribbean',
    primaryConcerns: ['Saltwater/pool scalp exposure', 'Dandruff in tropical humidity', 'Type 4 scalp care under protective styles'],

    scalp: {
      humidity: 'Tropical humidity: Malassezia growth accelerated; dandruff more common than in temperate climates',
      salt: 'Ocean salt water on scalp: short exposure OK (some antimicrobial); chronic exposure = scalp dehydration',
      chlorine: 'Pool chlorine: strips scalp of sebum; can cause dry scalp, irritation; wear swim cap or apply oil before swimming'
    },

    traditions: {
      coconut: 'Coconut oil on scalp: Caribbean tradition; antibacterial and antifungal properties help control Malassezia',
      aloe: 'Fresh aloe vera gel applied to scalp: soothing; anti-inflammatory; dandruff-reducing',
      bay: 'Bay rum: traditional Caribbean hair tonic; bay leaves + rum; antibacterial scalp treatment'
    },

    advice: `Caribbean scalp care must account for the tropical environment: humidity and heat accelerate
    fungal growth on the scalp. Dandruff is more prevalent in humid tropical climates — anti-dandruff
    shampoo use is appropriate and responsible. After ocean swimming: rinse scalp thoroughly (salt
    crystallizes and irritates); apply coconut oil to scalp to rehydrate. Before pool: apply oil to
    scalp (coconut or olive) to block chlorine penetration. Bay rum is the quintessential Caribbean
    scalp treatment — not just tradition, bay leaf contains eugenol (antifungal, antibacterial)
    and the alcohol base is an effective antimicrobial.`
  },

  arab: {
    communityName: 'Arab / Middle Eastern',
    primaryConcerns: ['Black seed oil (habbatus sauda) scalp tradition', 'Dandruff management under hijab', 'Hair loss from stress'],

    scalp: {
      hijab: 'Hijab-wearing women: scalp perspires more under covering; increased humidity under hijab = Malassezia growth risk',
      blackSeed: 'Nigella sativa (black seed/habbatus sauda): prophetic medicine; thymoquinone studied for hair growth and scalp health',
      dandruff: 'Under-hijab dandruff: zinc pyrithione shampoo; applied to scalp, rinse; manage scalp health between washes with apple cider vinegar spray'
    },

    traditions: {
      blackSeed: 'Black seed oil applied to scalp: traditional Islamic medicine; thymoquinone = antifungal + anti-inflammatory',
      olive: 'Olive oil as scalp treatment: Levant tradition; monounsaturated fatty acids; leave-on treatment',
      henna: 'Henna on scalp (for conditioning): Arabic tradition; reduces oiliness; adds body'
    },

    advice: `Arab scalp care is shaped by Islamic Hadith literature recommending black seed (Nigella sativa) —
    "A remedy for every disease except death." Modern research validates thymoquinone in black seed
    as genuinely antifungal, anti-inflammatory, and potentially hair-growth promoting. For hijab-wearing
    women: scalp health requires conscious management because the covered scalp environment is warmer
    and more humid. Strategy: wash scalp thoroughly 2-3x per week; apply antifungal shampoo (zinc
    pyrithione or ketoconazole) if dandruff develops; between washes, scalp spray with diluted ACV
    or rose water to balance pH.`
  },

  latina: {
    communityName: 'Latina / Hispanic',
    primaryConcerns: ['Olive oil scalp tradition', 'Hormonal hair loss postpartum', 'Scalp sensitivity to chemical treatments'],

    scalp: {
      oliveOil: 'Olive oil scalp treatment: Mediterranean-origin Latina tradition; anti-inflammatory; scalp nourishing',
      postpartum: 'Telogen effluvium: postpartum hair loss peaks 3-4 months after birth; estrogen crash; very common in Latina mothers; temporary',
      chemical: 'Brazilian blowout / keratin treatment on scalp: formaldehyde concerns; scalp absorption; avoid getting treatment on scalp directly'
    },

    traditions: {
      aloe: 'Aloe vera gel on scalp: traditional Mexican and Caribbean folk remedy; anti-inflammatory scalp treatment',
      chamomile: 'Chamomile tea rinse: scalp soothing; traditional remedy for sensitive scalp',
      olive: 'Olive oil + egg yolk scalp mask: traditional protein + fatty acid treatment'
    },

    advice: `Latina scalp care traditions span from simple aloe vera from the garden (Central American tradition)
    to chamomile rinse (Mexican grandmother advice) to olive oil mask (Spanish-heritage tradition).
    All have genuine merit: aloe contains enzymes that reduce inflammation; chamomile has apigenin
    (anti-inflammatory); olive oil's oleic acid nourishes. Postpartum Latina women: hair loss at
    3-4 months postpartum is nearly universal and self-limiting (12-24 months to fully recover);
    scalp massage + biotin + iron check is the appropriate response. For chemically treated hair:
    protein treatments every 4-6 weeks rebuild structure; scalp repair after chemical damage
    requires consistent moisture and protection.`
  },

  'east-asian': {
    communityName: 'East Asian',
    primaryConcerns: ['High sebum production under Type 1 hair', 'Ginseng root scalp tradition', 'Stress-related hair loss (academic pressure)'],

    scalp: {
      sebum: 'Type 1 straight hair: sebum travels quickly down straight shaft; scalp looks oily quickly; frequent washing appropriate',
      ginseng: 'Panax ginseng: Korean/Chinese tradition for scalp health; ginsenosides promote hair follicle proliferation (studied)',
      stress: 'East Asian students face disproportionate academic stress; cortisol elevation is directly correlated with hair loss (telogen effluvium trigger)'
    },

    traditions: {
      ginseng: 'Ginseng root applied to scalp: Korean/Chinese traditional medicine; ginsenosides → follicle stem cell proliferation documented in studies',
      camellia: 'Camellia oil (tsubaki oil) as scalp treatment: Japanese tradition; oleic acid dominant; scalp nourishing',
      jade: 'Jade roller scalp massage: modern extension of Traditional Chinese Medicine stone therapy to scalp massage'
    },

    advice: `East Asian scalp care has extensive traditional pharmacopeia — ginseng being the crown jewel.
    Ginsenosides (the active compounds in Korean/Chinese ginseng) have genuine human studies showing
    improved hair follicle proliferation. Look for ginseng in scalp serums and scalp toners from
    Korean beauty brands (Daeng Gi Meo Ri, La\'dor). Daily washing is appropriate for Type 1 East
    Asian scalps — the hair type can handle it and often needs it. The scalp-hair growth connection
    Korean beauty takes seriously: scalp serums are a major Korean beauty product category and
    their formulations are among the most sophisticated globally.`
  },

  'east-african': {
    communityName: 'East African',
    primaryConcerns: ['Sesame oil scalp oiling tradition', 'Dense Type 4 scalp access challenge', 'Stress/displacement-related hair loss'],

    scalp: {
      oiling: 'Sesame oil or castor oil scalp oiling: Ethiopian and Somali traditional scalp care',
      density: 'Type 4b-4c hair: most densely coiled; scalp access most difficult; strategic sectioning needed',
      refugee: 'Stress-related telogen effluvium: displacement, trauma, immigration stress associated with hair loss; self-care including scalp care can be healing practice'
    },

    traditions: {
      sesame: 'Sesame oil on scalp: Ethiopian tradition; rich in sesamol (antioxidant) and sesamin (anti-inflammatory); scalp nourishing',
      frankincense: 'Boswellia resin: traditionally burned near hair; boswellic acids anti-inflammatory; modern interpretation: frankincense oil diluted in carrier for scalp',
      castor: 'Castor oil as scalp treatment: Horn of Africa tradition; heavy but highly effective for scalp circulation'
    },

    advice: `East African scalp care requires strategic approach for dense Type 4b-4c hair: you cannot
    effectively care for the scalp without intentional access. Section hair into 4 quadrants,
    then into subsections; apply scalp oil or treatment methodically to each section's scalp
    surface. Sesame oil is both ancestrally appropriate and scientifically excellent for scalp:
    sesamol's antioxidant and anti-inflammatory properties are well-documented. For Horn of Africa
    diaspora experiencing stress-related hair loss: acknowledge the connection between trauma/stress
    and hair health; scalp massage as a self-care ritual addresses both physiologically (circulation)
    and emotionally (self-connection and care).`
  },

  'south-african': {
    communityName: 'South African',
    primaryConcerns: ['Rooibos scalp treatment', 'CCCA risk in Black South African women', 'Scalp sun protection in high-UV environment'],

    scalp: {
      rooibos: 'Rooibos (Aspalathus linearis): South African endemic; aspalathin antioxidant; anti-inflammatory scalp treatment',
      CCCA: 'CCCA risk in Black South African women: chemical relaxer history + tight hairstyle = cumulative follicle damage; monitor crown for thinning',
      sun: 'South Africa\'s high UV index: scalp on parts can burn; SPF scalp mists or protective headwear important'
    },

    traditions: {
      rooibos: 'Rooibos tea rinse: cooled, brewed rooibos tea applied to scalp and hair; aspalathin antioxidant directly on scalp',
      marula: 'Marula oil on scalp: light; fast-absorbing; anti-inflammatory; non-greasy scalp treatment',
      aloe: 'Aloe ferox (Cape aloe) gel: South African aloe species with higher emodin content than A. vera; anti-inflammatory'
    },

    advice: `South African scalp care should embrace the exceptional indigenous botanical heritage —
    rooibos, marula, and Cape aloe are scientifically validated ingredients that are also uniquely
    South African. Rooibos scalp rinse: brew strongly, cool completely, pour through hair and scalp
    as final rinse; aspalathin antioxidant directly on scalp surface. CCCA vigilance for Black
    South African women: examine crown monthly; any burning/tenderness/crown thinning requires
    immediate dermatologist referral — early intervention can slow or halt progression; late-stage
    is permanent. Scalp sun protection: a light scalp SPF mist or wearing hats during peak UV
    hours (10am-2pm) protects scalp skin from UV damage that is separate from hair photo-damage.`
  },

  'black-american': {
    communityName: 'Black American',
    primaryConcerns: ['CCCA (highest prevalence)', 'Traction alopecia from tight styles', 'LOC method scalp health', 'JBCO (Jamaican Black Castor Oil) tradition'],

    scalp: {
      CCCA: 'CCCA: 5.6% prevalence in Black American women; most underdiagnosed hair disorder; CHECK CROWN REGULARLY; early detection critical',
      TA: 'Traction alopecia: 17% of Black women affected; edges and temples at risk; style technique and tension are modifiable risk factors',
      JBCO: 'Jamaican Black Castor Oil (JBCO): wood ash processing raises pH; may enhance penetration; prolific in Black American natural hair community'
    },

    traditions: {
      JBCO: 'JBCO scalp massage: weekly application + scalp massage; ricinoleic acid → vasodilation → follicle circulation',
      grease: '"Greasing the scalp" with Vaseline/petroleum jelly: traditional Black American practice; occlusive; blocks TEWL; controversial but effective moisturizer',
      sealing: 'Sealing scalp after wash: moisture (water/leave-in) → oil → seal; LOC method extended to scalp surface'
    },

    advice: `Black American women carry the highest burden of scalp-related hair loss conditions — CCCA
    and traction alopecia disproportionately affect this community, and both are under-diagnosed
    and under-treated due to healthcare disparities. The most important scalp health action:
    monthly crown check (feel for tenderness, examine for widening part or thinning from crown)
    and annual dermatologist appointment for women who have had relaxers or tight styles.
    JBCO (Jamaican Black Castor Oil) is not magic — its effectiveness comes from ricinoleic acid
    creating vasodilation at the scalp, which any scalp massage + castor oil achieves. The JBCO
    specific benefit may come from the ash-alkaline processing — some claim improved penetration.
    Rosemary oil (equal to minoxidil 2% in 2023 study) is now a first-line recommendation
    before pharmaceutical interventions. If edges are receding: act NOW, not after a few more months.`
  }
};

// ============================================================
// HELPER FUNCTION
// ============================================================

export function getScalpHealthGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_SCALP_HEALTH_GUIDES['west-african'],
    'south-asian': ETHNIC_SCALP_HEALTH_GUIDES['south-asian'],
    'caribbean': ETHNIC_SCALP_HEALTH_GUIDES['caribbean'],
    'arab': ETHNIC_SCALP_HEALTH_GUIDES['arab'],
    'latina': ETHNIC_SCALP_HEALTH_GUIDES['latina'],
    'east-asian': ETHNIC_SCALP_HEALTH_GUIDES['east-asian'],
    'east-african': ETHNIC_SCALP_HEALTH_GUIDES['east-african'],
    'south-african': ETHNIC_SCALP_HEALTH_GUIDES['south-african'],
    'black-american': ETHNIC_SCALP_HEALTH_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

// ============================================================
// STATS
// ============================================================

export const SCALP_HEALTH_STATS = {
  moduleId: 'scalp_health_ethnic_guide',
  version: '1.0.0',
  communities: 9,
  keyFacts: [
    'CCCA (Central Centrifugal Cicatricial Alopecia) affects up to 5.6% of Black women and is the most underdiagnosed hair disorder in this population',
    'Traction alopecia affects 17% of Black women — caused by tight braids, weaves, and repeated mechanical tension on follicles',
    'Malassezia yeast causes dandruff in 50% of the adult population — it metabolizes sebum into irritating oleic acid',
    'Scalp pH should be 4.5-5.5 (acidic) — alkaline products (baking soda, some sulfate shampoos) disrupt the scalp microbiome',
    'Rosemary oil (1%) showed equivalent hair growth to minoxidil (2%) in a 2023 dermatology study — major evidence-based traditional remedy validation',
    'Jamaican Black Castor Oil (JBCO) ricinoleic acid activates prostaglandin receptors that cause vasodilation — validated mechanism for the traditional hair growth belief',
    'Bhringraj (Eclipta alba) oil studied for hair regrowth equal to minoxidil in some Ayurvedic research — South Asian tradition supported',
    '4 minutes of daily scalp massage over 24 weeks increased hair thickness in a 2019 Japanese study',
    'Ginseng ginsenosides promote hair follicle stem cell proliferation — East Asian scalp tradition validated',
    'CCCA early detection is critical — scalp burning/tenderness at crown in Black women requires immediate dermatologist referral'
  ],
  lastUpdated: '2026-10-29'
};
