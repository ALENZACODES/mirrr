/**
 * MIRRR — Sleep & Beauty Recovery Ethnic Guide
 * The science of sleep and skin repair, protective sleep practices by community
 * Topics: circadian rhythm, growth hormone, silk bonnets, satin pillowcases, nighttime routines
 */

// ============================================================
// SLEEP SKIN SCIENCE
// ============================================================

export const SLEEP_SKIN_SCIENCE = {
  overview: `Sleep is the skin\'s primary repair window. During deep sleep (NREM stages 3-4), the body
  releases 70-80% of its daily growth hormone pulse — the primary driver of cellular repair, collagen
  synthesis, and tissue regeneration. Chronic sleep deprivation is demonstrably aging: a 2015 Royal
  Society Open Science study showed that sleep-deprived individuals were perceived as less attractive,
  less healthy, and more tired by independent raters. Beauty sleep is not a myth — it\'s biochemistry.`,

  circadianSkinBiology: {
    overview: 'Skin has its own circadian clock (peripheral clock) synchronized to the suprachiasmatic nucleus (SCN) master clock',
    nightPhase: {
      growthHormone: '70-80% of daily growth hormone released during slow-wave sleep (SWS); GH drives tissue repair and collagen synthesis',
      melatonin: 'Antioxidant in addition to sleep hormone; melatonin receptors in skin; protects from oxidative stress',
      cortisol: 'Cortisol at its lowest during early sleep; cortisol inhibits collagen synthesis and degrades skin barrier',
      cellDivision: 'Keratinocyte division peaks at midnight; skin cells replicate 2-3x faster at night than day',
      bloodFlow: 'Blood flow to skin increases during sleep; nutrient delivery and waste removal optimized',
      repair: 'DNA repair mechanisms more active at night; UV damage repair primarily overnight'
    },
    dayPhase: {
      cortisol: 'Morning cortisol spike prepares body for day; suppresses inflammatory response',
      sebum: 'Sebum production peaks mid-afternoon; acne tends to worsen across the day',
      barrier: 'Skin barrier function at its strongest in afternoon; weakest in early morning'
    }
  },

  sleepDeprivationEffects: {
    immediate: ['Puffy eyes (fluid retention)', 'Pallor/dullness (vasoconstriction from cortisol)', 'Dark circles accentuated', 'Increased oil production'],
    chronic: {
      cortisol: 'Chronically elevated cortisol breaks down collagen, degrades hyaluronic acid, impairs wound healing',
      inflammation: 'IL-6, TNF-alpha, CRP elevated in sleep deprivation — inflammatory cytokines worsen acne, eczema, psoriasis',
      barrier: 'Transepidermal water loss (TEWL) increases with sleep deprivation; barrier function impaired',
      darkcircles: 'Vasodilation under eyes + thinning skin + hyperpigmentation from chronic fatigue = dark circles worsen',
      research: '2015 Royal Society Open Science: sleep-deprived faces rated 6% less attractive, 19% less healthy by blind raters'
    },
    darkSkinSpecific: {
      darkCircles: 'Periorbital hyperpigmentation (pigmentary dark circles common in South Asian, Arab, East African skin) worsened significantly by sleep deprivation',
      pih: 'Sleep deprivation-elevated cortisol → inflammation → triggers PIH in Fitzpatrick IV-VI',
      dullness: 'Melanin-rich skin shows dullness/grey cast more visibly when fatigued'
    }
  },

  optimalSleep: {
    duration: 'Adults 7-9 hours (National Sleep Foundation); athletes 8-10 hours for recovery',
    timing: 'Sleep aligned with natural darkness (10pm-6am or similar) maximizes circadian synchronization',
    stages: {
      n1: '5-10 min; transitional; lightest sleep',
      n2: '20-30 min per cycle; sleep spindles; memory consolidation',
      n3: 'Deep/slow-wave sleep (SWS); growth hormone release; physical repair; decreases with age',
      rem: 'REM = Rapid Eye Movement; dreaming; emotional processing; consolidation; also important for restoration'
    },
    cycles: '90-minute cycles; 4-6 cycles per night; SWS peaks in first half; REM peaks in second half',
    aging: 'SWS decreases with age; growth hormone output decreases; explains why aging skin repairs more slowly',
    children: 'Children have extraordinarily high SWS — explains their skin\'s rapid repair and regeneration'
  },

  sleepPosition: {
    back: {
      rating: 'BEST for skin',
      reason: 'No pressure on face; no fabric friction; even fluid drainage; no pillow lines',
      challenge: 'Back sleeping uncomfortable for many; snoring risk; can use sleep position trainer products'
    },
    side: {
      rating: 'MANAGEABLE with protection',
      reason: 'Most common sleep position; creates one-sided pillow lines (sleep wrinkles); uneven eye puffiness',
      protection: 'Silk or satin pillowcase significantly reduces friction; switch sides regularly'
    },
    stomach: {
      rating: 'WORST for skin',
      reason: 'Maximum face pressure; most pillow friction; worst sleep wrinkles; spinal alignment issues too',
      note: 'Noticeably more facial lines on stomach sleepers in studies; pillow lines become permanent wrinkles over time'
    }
  },

  sleepWrinkles: {
    mechanism: 'Mechanical compression and friction of face against pillow over 6-8 hours nightly; 2,500 hours of compression per year',
    development: 'Sleep lines visible in youth are temporary; in aging (decreased collagen/elasticity) they become permanent',
    prevention: ['Silk/satin pillowcase (reduces friction coefficient dramatically)', 'Back sleeping', 'Silk sleep mask', 'Night cream or facial oil (reduces friction coefficient)'],
    treatment: 'Once established: retinol, hyaluronic acid, peptides; professional: Botox (relaxes compression pattern), filler, laser'
  }
};

// ============================================================
// PROTECTIVE SLEEP PRACTICES
// ============================================================

export const PROTECTIVE_SLEEP_PRACTICES = {
  silkAndSatin: {
    overview: `Silk and satin pillowcases are genuinely beneficial for hair and skin — not just marketing.
    The science relates to friction coefficient: cotton has a high friction coefficient; silk and satin are
    smooth and create less mechanical stress on hair cuticles and skin.`,

    silk: {
      material: 'Bombyx mori silkworm cocoon protein (fibroin and sericin)',
      friction: 'Natural silk has one of the lowest friction coefficients of any natural fiber',
      hairBenefit: 'Less cuticle damage; less frizz; less moisture stripping; less breakage at friction points',
      skinBenefit: 'Less sleep wrinkle formation; less friction on sensitive skin; less product absorption from pillow',
      protein: 'Silk proteins (sericin) mildly moisturising; some evidence for reduced TEWL',
      grade: 'Momme (mm) weight: 19-25 momme is high quality; lower is thinner/less durable',
      care: 'Hand wash or delicate cycle cold; air dry; do not wring; silk pillowcases last years with care'
    },

    satin: {
      material: 'Weave pattern (not fiber); can be polyester, nylon, or silk weave — polyester satin is budget option',
      friction: 'Satin weave creates smooth surface regardless of fiber; similar friction reduction to silk',
      hairBenefit: 'Good hair protection; similar to silk for cuticle protection',
      skinBenefit: 'Good skin friction reduction; less luxury feel than silk but functionally similar for sleep wrinkles',
      cost: 'Polyester satin $5-30 vs silk $40-200+; for hair and skin protection, both work',
      care: 'Machine washable; durable; practical choice for those who want benefit without silk price'
    },

    cotton: {
      friction: 'High friction coefficient; absorbs moisture from skin and hair; creates mechanical stress',
      result: 'More frizz; more cuticle damage; more sleep line formation; strips product from skin at night',
      recommendation: 'Upgrade pillowcase to silk or satin — highest ROI beauty purchase for dark/curly hair'
    }
  },

  bonnetsCapsWraps: {
    overview: `Protective hair coverings during sleep are critical for Type 3-4 hair (coils, curls, kinks).
    Without protection, pillowcase friction causes cuticle lifting, moisture loss, tangles, and breakage overnight.`,

    silkBonnet: {
      description: 'Cap-style hair covering made from silk; encloses all hair',
      benefit: 'Protects entire hair from friction; retains moisture; maintains style (wash-and-go, twists, braids)',
      use: 'Put on after nighttime hair routine; secure but not too tight (avoid tension at hairline)',
      types: 'Tie-style (adjustable) vs pull-on (looser); choose based on hair volume',
      cultural: 'Deep tradition in Black American women\'s beauty culture; passed mother to daughter; non-negotiable for natural hair care'
    },

    satinBonnet: {
      description: 'Polyester satin version; more affordable, machine washable',
      benefit: 'Same protective function as silk at lower price point',
      recommendation: 'Multiple satin bonnets (rotate while washing) vs one silk bonnet'
    },

    silkScarf: {
      description: 'Large silk or satin scarf wrapped around hair; pineapple wrap or full wrap',
      history: 'African American hair scarf tradition dating to enslavement period (practical + beauty preservation)',
      technique: 'Pineapple: gather all hair to top of head in loose ponytail before scarf; wrapping prevents flattening',
      cultural: 'Head wrapping traditions span Africa, Caribbean, South Asia, Middle East; reclaimed as beauty practice'
    },

    durags: {
      description: 'Traditional Black American men\'s head covering; waves maintenance',
      hair: 'Velvet durags for compression and wave pattern maintenance; silk/satin for moisture retention',
      benefit: 'Compresses hair into wave pattern; protects waves overnight; reduces frizz',
      culture: 'Durag culture reclaimed as Black fashion statement after years of racist stigmatization'
    },

    twistBraidProtection: {
      description: 'Protective styles (twists, braids) loose enough for overnight wearing',
      technique: 'Pineapple twist or loose two-strand twist before bed; reduces tangling; maintains curl pattern',
      morning: 'Unravel in morning for stretched, defined curls'
    }
  },

  nighttimeRoutines: {
    overview: 'Nighttime is maximum absorption time for skincare — skin permeability is higher at night, and no makeup or SPF competition.',

    skinRoutineOrder: {
      steps: [
        { step: 1, name: 'Double Cleanse', description: 'Oil cleanser removes makeup/sunscreen/sebum; water-based cleanser removes remaining impurities' },
        { step: 2, name: 'Exfoliate', description: '2-3x weekly only; AHA (lactic/glycolic) or BHA (salicylic); never exfoliate daily — over-exfoliation worsens barrier' },
        { step: 3, name: 'Treatment Actives', description: 'Retinol/retinoid (night only), azelaic acid, niacinamide — actives go on clean skin for best penetration' },
        { step: 4, name: 'Moisturizer', description: 'Hyaluronic acid serum first (humectant); then moisturizer (emollient/occlusive combo)' },
        { step: 5, name: 'Facial Oil', description: 'Optional; seal everything in; most oils absorb overnight; reduces friction on pillow' },
        { step: 6, name: 'Spot Treatment', description: 'Acne spot treatments (benzoyl peroxide, salicylic acid, sulfur) last; targeted application' }
      ]
    },

    sluggingTrend: {
      name: 'Slugging',
      description: 'Final step of applying thin layer of petrolatum (Vaseline) to seal in entire routine',
      science: 'Creates occlusive film; virtually eliminates TEWL; maximizes overnight moisture retention',
      origin: 'Korean skincare trend; popular in Black American beauty communities (overlaps with "greasing" tradition)',
      darkSkin: 'Particularly beneficial for dry/ashy dark skin; does NOT cause acne for most (petrolatum is non-comedogenic)',
      technique: 'Thin layer only — fingertip amount; after all other products; avoid eye area for some'
    },

    neckAndDecollettage: {
      reminder: 'Neck ages as fast as face; same products same routine; work upward, not downward (avoid lymph drain push)',
      stretch: 'Stretch marks on chest/décolletage benefit from same retinol/vitamin C routine as face',
      sunProtection: 'SPF on neck and décolletage every day; one of most UV-exposed areas, least moisturised'
    }
  }
};

// ============================================================
// 9 COMMUNITY SLEEP BEAUTY GUIDES
// ============================================================

export const ETHNIC_SLEEP_BEAUTY_GUIDES = {
  'west-african': {
    communityName: 'West African',
    primaryConcerns: ['Type 4 natural hair moisture retention overnight', 'Preventing dryness/ashiness', 'PIH from pressure points'],

    hairProtection: {
      tradition: 'Head scarf wrapping deeply traditional across West Africa — extends from cultural and religious practice to beauty',
      modern: 'Silk bonnet or satin scarf mandatory for Type 4 hair; Ghana braids, Senegalese twists protected inside satin',
      technique: 'Loose pineapple or two-strand twists for loose hair; laid flat with bonnet for braids/twists styles',
      LOC: 'Apply LOC method (Liquid-Oil-Cream) before bed; seal with oil to protect Type 4 hair overnight'
    },

    skinNightRoutine: {
      cleanse: 'African black soap or gentle cleanser to remove day\'s sweat and SPF',
      treatment: 'Niacinamide serum for PIH treatment (most important active for dark skin)',
      moisture: 'Rich shea butter-based night cream; extra moisture on elbows if prone to dryness',
      seal: 'Slugging with petrolatum on very dry patches; shea butter on body'
    },

    sleepEnvironment: {
      satin: 'Satin pillowcase in addition to bonnet — extra protection if bonnet slips off',
      humidity: 'Humidifier in winter prevents moisture loss from dry indoor heating air'
    },

    culturalPractice: {
      headWrap: 'Head wrapping at night is continuation of West African scarf culture; many women sleep with gele (headwrap) or tied scarf',
      naturalOil: 'Nightly oiling of scalp and ends with shea or coconut is generational practice'
    },

    advice: `West African women have some of the most intentional nighttime hair care practices globally —
    and it\'s necessary. Type 4 hair loses moisture rapidly on cotton; the silk bonnet is non-negotiable.
    For skin: niacinamide serum nightly on face (PIH treatment) + rich shea butter on body immediately
    before sleep is the combination that maintains and improves melanin-rich skin condition over time.`
  },

  'south-asian': {
    communityName: 'South Asian',
    primaryConcerns: ['Dark circles (constitutional/genetic)', 'Hyperpigmentation', 'Hair oiling tradition'],

    hairProtection: {
      oilNight: 'Overnight oiling (champi + leave-in oil) traditional in South Asia; cover with silk scarf or shower cap',
      braiding: 'Loose braid before bed protects long hair; traditional across South Asia',
      oil: 'Coconut oil (South India), casame (mustard, North India), bhringraj or amla oil on scalp; wrap and sleep'
    },

    skinNightRoutine: {
      darkCircles: 'Cold eye compresses before bed for periorbital hyperpigmentation; keep eye cream refrigerated',
      retinol: 'Retinol 0.025-0.05% for hyperpigmentation; use buffer technique on Fitzpatrick IV-V skin',
      vitamin C: 'L-ascorbic acid or sodium ascorbyl phosphate serum for brightening; nighttime use avoids photodegradation',
      moisture: 'Hyaluronic acid serum + niacinamide + lightweight gel moisturizer; Ayurvedic tradition of milk cream (malai) or almond oil on face overnight'
    },

    culturalPractice: {
      oilNight: 'Leaving oil in hair overnight and washing morning of important events is standard South Asian preparation',
      jasmine: 'Jasmine flowers worn in hair during day removed at night; sometimes the scent absorbed into hair is considered beauty'
    },

    advice: `South Asian nighttime beauty is about the long game — overnight oil treatment for hair,
    consistent retinol for hyperpigmentation, niacinamide for dark circles. The constitutional dark circles
    in South Asian skin are largely genetic/vascular; cold compresses and adequate sleep help but won\'t
    eliminate entirely. The overnight champi (oil massage) tradition has genuine benefit: scalp oils absorbed
    overnight before morning wash are more effective than quick oil-then-wash routines.`
  },

  caribbean: {
    communityName: 'Caribbean',
    primaryConcerns: ['Type 3-4 curl definition maintenance', 'Frizz prevention', 'Skin moisture in dry climates after migration'],

    hairProtection: {
      pineapple: 'Loose pineapple (high ponytail) or pineapple + bonnet to maintain curl definition overnight',
      moisturise: 'Spray with water + leave-in conditioner; seal with coconut oil before bonnet',
      braids: 'Mini twists or flat twists overnight protect defined styles for multiple days',
      satin: 'Satin bonnet or satin pillowcase; Caribbean heat means lighter weight satin preferred'
    },

    skinNightRoutine: {
      cleanser: 'Remove day\'s sweat (humid original climate) or dry skin (northern climate) with gentle cleanser',
      vitamin C: 'Vitamin C serum for brightening; Caribbean skin prone to tanning and uneven tone',
      moisture: 'Coconut oil-based night moisturiser; aloe vera gel for lighter option',
      feet: 'Petroleum jelly on heels; socks over; preventive cracked heel care'
    },

    culturalPractice: {
      headScarf: 'Tying hair before bed with scarf traditional across Caribbean; grandmothers\' practice passed down',
      naturalRemedy: 'Aloe vera leaf gel applied before sleep for skin healing; fresh from plant most effective'
    },

    advice: `Caribbean hair sleeps best protected. The pineapple + satin bonnet technique preserves wash-and-go
    styles for multiple days, reducing washing frequency (which dries Type 3-4 hair). For skin: the climate
    of origin (high humidity) means Caribbean skin may feel tight/uncomfortable after migrating to drier northern
    climates; richer nighttime moisturisers than used "back home" are needed to compensate for the humidity loss.`
  },

  arab: {
    communityName: 'Arab / Middle Eastern',
    primaryConcerns: ['Hyperpigmentation from sun exposure', 'Under-eye circles', 'Hair protection (long hair tradition)'],

    hairProtection: {
      oilTreatment: 'Argan oil, olive oil, or black seed oil overnight hair treatment before wash day',
      braid: 'Single loose braid traditional for long hair overnight; protects from friction and tangles',
      scarf: 'Silk or satin scarf wrapped over braid; hijab-wearing women\'s nighttime hair protection critical as hair exposed at home',
      henna: 'Post-henna hair treatment: overnight conditioning mask after henna application to restore moisture'
    },

    skinNightRoutine: {
      argan: 'Argan oil facial oil as final step; overnight penetration maximized',
      roseWater: 'Rose water toner before serums; Moroccan tradition of rose water on face throughout day and before sleep',
      eye: 'Rose hip seed oil around eyes for dark circle support; vitamin K in rose hip for vascular dark circles',
      treatment: 'Niacinamide + tranexamic acid for sun hyperpigmentation management; consistent nightly use'
    },

    culturalPractice: {
      perfumed: 'Arab culture values scented body and hair; applying light rose or oud scent before sleep traditional',
      overnight: 'Overnight hair oil treatment (zaytoun/olive oil) weekend tradition before Friday bath (Jumu\'ah preparation)'
    },

    advice: `Arab nighttime beauty prioritizes hair protection and skin brightening — two areas where the
    traditional toolkit (argan oil, rose water, olive oil) aligns remarkably well with modern science.
    Argan oil as the final step in nighttime skincare is one of the best overnight treatments available:
    light enough not to clog pores, rich enough to repair barrier. For hyperpigmentation from sun (common
    with outdoor lifestyles in hot Arab climates), consistent nightly niacinamide + tranexamic acid is the
    evidence-based combination.`
  },

  latina: {
    communityName: 'Latina / Hispanic',
    primaryConcerns: ['Frizz management', 'Hyperpigmentation', 'Cellulite and body skin'],

    hairProtection: {
      silkBonnet: 'Silk bonnet for Type 3-4 curls; satin pillowcase for Type 2 waves',
      braid: 'Loose French braid for length protection; finger coils on 3c-4a hair for defined morning curls',
      oil: 'Coconut oil on ends before bed; argán oil for frizz-prone hair',
      type2: 'Type 2a-b wavy hair: loose braid or satin pillowcase enough; bonnet optional'
    },

    skinNightRoutine: {
      retinol: 'Retinol for aging prevention and hyperpigmentation; buffer with moisturiser if 3c-4a skin shows PIH risk',
      vitamin C: 'Vitamin C serum for brightening tan lines and uneven skin',
      moisture: 'Rich moisturiser or sleeping mask 2-3 nights per week; lighter moisturiser other nights',
      body: 'Massage centella asiatica or vitamin C body lotion on legs before bed; anti-cellulite routine'
    },

    culturalPractice: {
      beauty: 'Latina beauty culture values effort — elaborate nighttime routines normalized; self-care as priority',
      grandmother: 'Grandmother\'s overnight remedies: petroleum jelly on lips and heels; egg yolk hair mask; continue these'
    },

    advice: `Latina nighttime beauty is taken seriously — and rightly so. The abuelita tradition of petroleum
    jelly on lips and heels, egg yolk hair masks, and olive oil on face are genuinely effective remedies.
    Modern additions: retinol for the face (buffer technique for darker skin tones to prevent PIH), and
    centella asiatica body lotion for stretch mark support. The satin pillowcase or bonnet depends entirely
    on hair type — Type 3c-4a Latinas absolutely need the bonnet; Type 2 wavy Latinas can often get away
    with just the satin pillowcase.`
  },

  'east-asian': {
    communityName: 'East Asian',
    primaryConcerns: ['Skin barrier integrity', 'Anti-aging prevention', 'Under-eye care'],

    hairProtection: {
      silk: 'Korean and Japanese beauty cultures favor silk pillowcases over bonnets (straight/fine hair)',
      overnight: 'Occasional overnight hair treatment (camelia oil, argan) washed out in morning',
      dry: 'Minimal use of hair ties overnight; loose or free is preferred for fine East Asian hair'
    },

    skinNightRoutine: {
      korean: {
        name: 'Korean Nighttime Routine (adapted for sleeping)',
        steps: [
          'Oil cleanser (cleansing balm)',
          'Foam or gel cleanser (double cleanse)',
          'Toner (prep and hydration)',
          'Serum/essence (treatment actives)',
          'Eye cream',
          'Moisturizer (gel in summer; cream in winter)',
          'Sleeping mask 3-4 nights per week (occlusve overnight treatment)'
        ]
      },
      japaneseMinimal: {
        name: 'Japanese Minimal Nighttime',
        steps: [
          'Oil cleanse',
          'Gentle milk cleanser',
          'Lotion (Japanese toner — thicker than Korean toner)',
          'Serum (retinol or brightening)',
          'Emulsion (light moisturizer)',
          'Sleeping pack if needed'
        ]
      },
      sleepingMask: 'Korean sleeping pack/mask: thick occlusive layer left on overnight; dramatically improves morning skin texture and glow'
    },

    culturalPractice: {
      mask: 'Korean sleeping packs originated in Korean beauty; now global; apply as final step 3-4x/week',
      pillow: 'Japanese and Korean premium silk pillowcases considered essential beauty investment',
      eyePatches: 'Hydrogel undereye patches during bath or relaxation time before bed'
    },

    advice: `East Asian nighttime skincare is the most developed globally — the Korean multi-step and Japanese
    minimalist approaches are both extraordinarily effective. The sleeping pack/mask concept is genuinely
    genius: an occlusive layer left on overnight maximizes every other product underneath it. For East Asian
    skin specifically: barrier care is essential (ceramides, hyaluronic acid) because fine skin dehydrates
    more easily, and anti-aging starts in the 20s in Korean/Japanese culture — early investment in retinol
    and vitamin C prevents rather than reverses damage.`
  },

  'east-african': {
    communityName: 'East African',
    primaryConcerns: ['Deep skin moisture retention', 'PIH prevention', 'Type 4 hair protection'],

    hairProtection: {
      bonnet: 'Silk bonnet mandatory for Type 4 coil patterns; extremely tight coils most fragile',
      oil: 'Black seed (nigella) oil, coconut oil, or castor oil on scalp and ends before bonnet',
      protective: 'Protective styles (box braids, Senegalese twists, etc.) still require bonnet at night',
      SomaliTradition: 'Sesame oil overnight hair treatment traditional in Somali beauty practice'
    },

    skinNightRoutine: {
      frankincense: 'Frankincense facial oil (boswellia) or diluted boswellia essential oil as nighttime facial oil',
      niacinamide: 'Niacinamide 10% serum for PIH — most important active for Fitzpatrick V-VI skin at night',
      vitamin C: 'Vitamin C for brightening; layered under frankincense oil',
      body: 'Shea butter + marula oil on body immediately before sleep; don\'t wait — apply straight from shower'
    },

    culturalPractice: {
      frankincense: 'Boswellia/frankincense ritual before sleep; burning resin or applying oil; calming and skin-beneficial',
      myrrh: 'Myrrh oil on skin; traditional Somali, Ethiopian, and Eritrean beauty practice; antimicrobial and healing'
    },

    advice: `East African nighttime beauty is rooted in frankincense and myrrh — literally the ancient
    beauty medicines of the Horn of Africa. Boswellia (frankincense) oil is genuinely anti-inflammatory
    and wound-healing; apply it as the final facial oil step. For the critical dark skin concern of PIH:
    niacinamide 10% serum applied consistently every night for 8-12 weeks produces visible brightening.
    The Type 4 hair bonnet is as non-negotiable here as in West African or Black American communities —
    tight coils simply cannot maintain moisture on cotton.`
  },

  'south-african': {
    communityName: 'South African',
    primaryConcerns: ['Diverse hair types requiring different approaches', 'Sun damage repair (lighter SA)', 'PIH (darker SA)'],

    hairProtection: {
      darkSkin: 'Black South African hair (Type 4): silk bonnet or satin scarf mandatory',
      lighter: 'Cape Malay, Coloured, Indian-South African hair (Type 2-3): satin pillowcase minimum; bonnet for curlier textures',
      white: 'White South African hair: silk pillowcase for reduced friction and improved hair condition'
    },

    skinNightRoutine: {
      rooibos: 'Rooibos-infused toner or essence; South African beauty innovation',
      retinol: 'Retinol for white/lighter-skinned South Africans for sun damage repair (high UV index exposure)',
      niacinamide: 'Niacinamide for darker-skinned South Africans for PIH management',
      marula: 'Marula facial oil as overnight treatment — deeply South African and scientifically validated',
      spf: 'Morning SPF 50 is required daily; nighttime repair products compensate for UV exposure'
    },

    culturalPractice: {
      ubuntu: 'Ubuntu beauty philosophy — communal sharing of beauty knowledge; intergenerational beauty traditions',
      rooibos: 'Rooibos tea before bed is South African tradition; also benefits internal skin health (antioxidants)'
    },

    advice: `South African nighttime beauty must account for the country\'s extraordinary UV index — nightly
    repair work compensates for daytime sun exposure that damages skin even with SPF. Marula oil is South
    Africa\'s nighttime gift: apply 3-5 drops as the final step and it works overnight to restore barrier
    and fight oxidative stress. For darker South African skin, niacinamide at night is the primary tool
    against PIH. For lighter South African skin, retinol at night is the primary tool against photoaging
    (the UV damage is severe and accumulates rapidly).`
  },

  'black-american': {
    communityName: 'Black American',
    primaryConcerns: ['Type 4 natural hair moisture retention', 'Preventing ashiness overnight', 'PIH and dark spot treatment'],

    hairProtection: {
      bonnet: 'Silk or satin bonnet is CORE Black American beauty practice — passed mother to daughter; non-negotiable for natural hair',
      satin: 'Satin pillowcase backup if bonnet slips; also good option for relaxed hair',
      pineapple: 'Loose pineapple technique for wash-and-go styles; 2-minute technique that saves hairstyles for days',
      loc: 'LOC method (Liquid-Oil-Cream) before bonnet: spray water, seal with oil, top with leave-in cream; Type 4 hair moisture protocol',
      twists: 'Two-strand twists before sleep maintain definition; unravel in morning for styled, stretched look'
    },

    skinNightRoutine: {
      cleanse: 'Remove makeup and SPF; oil cleanse or micellar water for heavy products; gentle follow-up cleanser',
      niacinamide: 'Niacinamide 10% serum every night for dark spots, PIH treatment; most impactful night active for dark skin',
      retinol: 'Retinol 0.025-0.05% (buffered) for PIH, aging prevention; 2-3x weekly initially; use buffer technique',
      moisture: 'Rich moisturiser (ceramide + hyaluronic acid-based); CeraVe PM or similar',
      slug: 'Slugging (thin Vaseline layer over everything) on nights of extreme dryness; especially effective in winter',
      body: 'Petrolatum on elbows, knees, heels before sleep; shea butter on body; the "greasing" tradition optimized'
    },

    culturalPractice: {
      bonnet: 'Silk bonnet is cultural symbol of Black womanhood; reclaimed from shame to pride (white beauty standards once pathologized protective practices)',
      greasing: 'Nightly body "greasing" with Vaseline or shea — intergenerational transmission of skin wisdom',
      selfCare: '2010s natural hair movement reinvigorated intentional nighttime care as radical self-love for Black women'
    },

    advice: `Black American nighttime beauty culture is among the most intentional and knowledge-rich in
    the world — and it\'s been proven right by science. The silk bonnet isn\'t a quirky habit; it\'s the
    optimal solution for Type 4 hair protection. The "greasing" tradition (petrolatum after bathing) is the
    most effective occlusive practice available. Niacinamide 10% nightly is clinically the most impactful
    skincare active for Fitzpatrick IV-VI dark spot treatment. The natural hair and skin care movement that
    emerged strongly after 2012 has created extraordinary community knowledge around nighttime care —
    this collective wisdom is worth preserving and building upon.`
  }
};

// ============================================================
// HELPER FUNCTION
// ============================================================

export function getSleepBeautyGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_SLEEP_BEAUTY_GUIDES['west-african'],
    'south-asian': ETHNIC_SLEEP_BEAUTY_GUIDES['south-asian'],
    'caribbean': ETHNIC_SLEEP_BEAUTY_GUIDES['caribbean'],
    'arab': ETHNIC_SLEEP_BEAUTY_GUIDES['arab'],
    'latina': ETHNIC_SLEEP_BEAUTY_GUIDES['latina'],
    'east-asian': ETHNIC_SLEEP_BEAUTY_GUIDES['east-asian'],
    'east-african': ETHNIC_SLEEP_BEAUTY_GUIDES['east-african'],
    'south-african': ETHNIC_SLEEP_BEAUTY_GUIDES['south-african'],
    'black-american': ETHNIC_SLEEP_BEAUTY_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

// ============================================================
// STATS
// ============================================================

export const SLEEP_BEAUTY_STATS = {
  moduleId: 'sleep_beauty_ethnic_guide',
  version: '1.0.0',
  communities: 9,
  keyFacts: [
    '70-80% of daily growth hormone is released during deep slow-wave sleep — primary collagen repair window',
    'Skin cell division peaks at midnight — the body\'s built-in "beauty sleep" programming',
    'Sleep-deprived faces rated 6% less attractive and 19% less healthy by blind raters (Royal Society 2015)',
    'Silk pillowcase friction coefficient is dramatically lower than cotton — reduces sleep wrinkles and hair breakage',
    'The LOC method (Liquid-Oil-Cream) before sleeping is the optimal moisture protocol for Type 4 hair',
    'Slugging (petrolatum occlusion) reduces transepidermal water loss by up to 99% overnight',
    'Stomach sleeping creates most sleep wrinkles — some permanent over time; back sleeping is best for skin',
    'Silk bonnet tradition in Black American culture is scientifically validated: protects Type 4 hair from cuticle damage',
    'Cortisol is lowest during sleep — the only time skin can fully synthesize collagen without cortisol suppression',
    'Niacinamide 10% applied nightly for 8-12 weeks produces clinically significant dark spot reduction in dark skin'
  ],
  lastUpdated: '2026-10-29'
};
