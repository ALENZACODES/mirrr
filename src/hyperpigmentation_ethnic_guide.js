/**
 * MIRRR Hyperpigmentation & Skin Brightening Guide
 * Comprehensive coverage of PIH, melasma, dark spots, and uneven skin tone
 * across all 9 ethnic communities — with cultural context, safe ingredients,
 * dangerous product warnings, and realistic treatment timelines.
 */

// ─── MELANIN SCIENCE ──────────────────────────────────────────────────────────

export const MELANIN_SCIENCE = {
  what_is_melanin: 'Melanin is the pigment produced by melanocytes — specialised cells found in the basal layer of the epidermis. Melanin is responsible for skin, hair, and eye colour. It also provides photoprotection by absorbing UV radiation.',

  types: {
    eumelanin: {
      colour: 'Brown to black',
      found_in: 'Predominantly in people with darker skin tones and darker hair. Also present in mixed amounts in lighter skin.',
      role: 'Primary UV-absorbing pigment. Higher eumelanin = greater natural UV protection. Deeper skin tones (Fitzpatrick IV-VI) have significantly more eumelanin.',
    },
    pheomelanin: {
      colour: 'Red to yellow',
      found_in: 'More dominant in people with fair skin, red or blonde hair. Less UV-protective than eumelanin.',
      role: 'Lower photoprotection. People with predominantly pheomelanin are at higher UV damage risk.',
    },
    neuromelanin: {
      colour: 'Dark polymer',
      found_in: 'Brain tissue — not relevant to skin pigmentation disorders.',
      role: 'Neurological function.',
    },
  },

  melanocytes: {
    distribution: 'Melanocytes are present in roughly equal numbers across all skin tones — approximately 1,000–2,000 per square millimetre of skin. The difference in skin tone comes from how much melanin each melanocyte produces and how melanin is packaged and transferred to surrounding keratinocytes.',
    activity_in_darker_skin: 'In people with deeper skin tones, melanocytes are more reactive and produce melanin more readily in response to inflammation, UV, or hormonal triggers. This is why PIH and melasma are more prevalent and more severe in Fitzpatrick III-VI skin.',
    melanosomes: 'Melanin is packaged in organelles called melanosomes. In lighter skin, melanosomes are smaller and clustered. In darker skin, they are larger, more numerous, and distributed individually throughout keratinocytes — this arrangement is more efficient at UV protection but also means more pigment can be deposited in inflammatory responses.',
  },

  fitzpatrick_scale: {
    
    types: {
      I: 'Always burns, never tans. Very fair, often with freckles, light eyes, red or blonde hair. Hyperpigmentation risk: low for PIH, higher for sunburn-induced freckling.',
      II: 'Usually burns, sometimes tans. Fair skin. Hyperpigmentation risk: moderate.',
      III: 'Sometimes burns, always tans. Medium/olive skin. Hyperpigmentation risk: moderate-high — PIH becomes a significant concern.',
      IV: 'Rarely burns, always tans. Olive to light brown skin. Hyperpigmentation risk: high. PIH and melasma very common.',
      V: 'Very rarely burns, tans deeply. Medium to dark brown skin. Hyperpigmentation risk: very high. PIH can be severe and long-lasting.',
      VI: 'Never burns, deeply pigmented. Dark brown to black skin. Hyperpigmentation risk: extremely high. PIH is intense, dermal PIH possible. Aggressive treatments can worsen pigmentation.',
    },
  },

  how_hyperpigmentation_forms: {
    trigger: 'Any of the following triggers a cascade: UV exposure, inflammation (acne, eczema, a scratch), hormonal fluctuation (pregnancy, hormonal contraceptives, perimenopause), or heat (repeated heat exposure, hot steam).',
    cascade: [
      'Step 1: Trigger activates inflammatory mediators — prostaglandins, leukotrienes, cytokines.',
      'Step 2: Inflammatory mediators stimulate melanocytes.',
      'Step 3: Melanocytes upregulate tyrosinase — the key enzyme in melanin synthesis.',
      'Step 4: Excess melanin is produced and transferred to surrounding keratinocytes.',
      'Step 5: Melanin deposits create visible darkening — either epidermal (brown/tan) or dermal (blue-grey).',
      'Step 6: Without intervention, the pigment gradually disperses as cells turn over — but this takes months to years.',
    ],
    tyrosinase_role: 'Tyrosinase is the rate-limiting enzyme in melanin synthesis — it converts tyrosine to DOPA and then to dopaquinone, the precursor to melanin. Most brightening ingredients work by inhibiting tyrosinase.',
  },

  epidermal_vs_dermal: {
    epidermal: {
      appearance: 'Brown, tan, or dark brown spots that sit in the outer skin layers.',
      woods_lamp_test: 'Appears enhanced (darker) under Wood\'s lamp UV light — confirms epidermal location.',
      treatment_response: 'Good — topical brighteners, chemical exfoliants, and time resolve most epidermal PIH.',
      timeline: '3–12 months with active treatment.',
    },
    dermal: {
      appearance: 'Blue-grey or ash-grey discolouration — melanin has been deposited in the dermis by macrophages (immune cells that ingested melanin from damaged epidermal cells).',
      woods_lamp_test: 'Does NOT enhance under Wood\'s lamp — confirms dermal location.',
      treatment_response: 'Poor with topicals alone. Responds to laser (Q-switched Nd:YAG for darker skin) or time.',
      timeline: 'Can take 1–3 years or longer. Dermal PIH may be permanent in some cases.',
    },
    mixed: 'Most clinical presentations are mixed — both epidermal and dermal components. Requires a layered treatment approach.',
  },
};

// ─── UNIVERSAL HYPERPIGMENTATION TREATMENT ────────────────────────────────────

export const UNIVERSAL_HYPERPIGMENTATION = {
  cardinal_rule: 'SPF is not optional — it is the single most important step in any hyperpigmentation treatment plan. Every brightening ingredient in the world is undone by daily unprotected UV exposure. Melanocytes are UV-activated. Without SPF, you are actively stimulating the very process you are trying to reverse.',

  step_by_step_protocol: {
    step_1_cleanse: {
      title: 'Gentle Cleansing',
      why: 'A compromised skin barrier worsens PIH and makes actives irritating. Harsh cleansers (SLS-heavy, high pH) disrupt barrier function.',
      what_to_use: 'Low pH (5.0–5.5) gentle cleanser. Micellar water for sensitive skin. No physical scrubs — friction on hyperpigmented skin causes further trauma.',
      frequency: 'Twice daily. Morning cleanse can be water-only for non-oily types.',
    },
    step_2_active_treatment: {
      title: 'Brightening Active (AM or PM, not both if irritating)',
      options_by_tier: {
        tier_1_safest: [
          'Niacinamide 5–10% — inhibits melanosome transfer from melanocytes to keratinocytes. Anti-inflammatory. Safe for all Fitzpatrick types.',
          'Vitamin C (L-ascorbic acid) 10–20% — antioxidant, tyrosinase inhibitor, collagen booster. Use in AM. Unstable — store properly.',
          'Azelaic acid 10–20% — tyrosinase inhibitor, anti-inflammatory, anti-acne. Excellent for all skin tones including deep skin.',
          'Tranexamic acid 2–5% — inhibits the UV-induced plasminogen activator pathway that stimulates melanocytes. Very safe across all tones.',
          'Alpha arbutin 1–2% — slow-release hydroquinone derivative. Gentler and safer than hydroquinone for long-term use.',
        ],
        tier_2_effective_with_caution: [
          'Kojic acid 1–4% — fungal-derived tyrosinase inhibitor. Effective but can irritate and cause contact dermatitis. Limit use to 3 months then cycle off.',
          'Retinoids (tretinoin 0.025–0.1%, adapalene, retinol) — cell turnover accelerators that push pigmented cells out faster. Also treat acne. Use PM only. Sun-sensitising — MUST wear SPF.',
          'Chemical exfoliants (AHAs: glycolic, lactic, mandelic) — speed cell turnover and fade surface pigment. Glycolic most effective but most irritating; mandelic safest for dark skin due to larger molecular size and gentler action.',
        ],
        tier_3_prescription: [
          'Hydroquinone 2–4% (prescription in many countries) — the most studied depigmenting agent. Effective but requires cycling (use for 3 months, break for 1–2 months). Overuse risk: ochronosis (paradoxical blue-black darkening) — a permanent condition, more common in darker skin with prolonged use.',
          'Tretinoin 0.025–0.1% — prescription retinoid. Faster and stronger than OTC retinol.',
          'Triple combination cream (Kligman formula) — hydroquinone 4% + tretinoin 0.05% + fluocinolone acetonide 0.01%. Most effective for melasma, but only under dermatologist supervision. Risk of skin atrophy from the steroid component.',
        ],
      },
    },
    step_3_moisturise: {
      title: 'Barrier-Supporting Moisturiser',
      why: 'A healthy skin barrier reduces inflammation, which is a primary driver of PIH. Ceramides, fatty acids, and niacinamide-containing moisturisers support this.',
      ingredients_to_seek: 'Ceramides, hyaluronic acid, niacinamide, glycerin, centella asiatica (cica), panthenol.',
      ingredients_to_avoid_in_hyperpigmented_skin: 'Fragrance, essential oils, alcohol (denat.) — all potential irritants that can trigger more PIH.',
    },
    step_4_spf: {
      title: 'SPF 30–50+ (Non-Negotiable)',
      why: 'UV radiation directly activates melanocytes. Even on cloudy days, UVA penetrates clouds and glass. UVA specifically causes persistent pigmentation.',
      type: 'Broad-spectrum (UVA + UVB) SPF 30 minimum. SPF 50 preferred for active hyperpigmentation treatment.',
      for_darker_skin: 'Mineral sunscreens (zinc oxide, titanium dioxide) historically leave white cast on deeper skin tones. Look for tinted mineral SPF, hybrid formulas, or cosmetically elegant chemical sunscreens (avobenzone, tinosorb). Chemical sunscreens are effective and cast-free but not suitable for very sensitive or reactive skin.',
      reapplication: 'Every 2 hours if outdoors. SPF is a morning step, not a once-a-day application.',
    },
    step_5_consistency: {
      title: 'Patience and Consistency',
      realistic_timeline: 'Epidermal PIH with a consistent routine: visible improvement in 4–8 weeks, significant improvement in 3–6 months. Melasma: 3–6 months minimum, with recurrence risk. Dermal PIH: 1–2+ years.',
      what_failure_looks_like: 'Skipping SPF even one or two days per week significantly delays results. Introducing too many actives at once causing irritation that creates more PIH.',
      photographic_tracking: 'Take a photo in consistent lighting every 4 weeks. Hyperpigmentation fades gradually — daily observation makes it hard to notice progress.',
    },
  },

  safe_vs_unsafe_matrix: {
    safe_for_all_fitzpatrick: [
      'Niacinamide (all concentrations 2–10%)',
      'Tranexamic acid (topical 2–5%)',
      'Azelaic acid (10–20%)',
      'Alpha arbutin (1–2%)',
      'Vitamin C (L-ascorbic acid 10–20%) — irritation possible, patch test',
      'Broad-spectrum SPF (always)',
      'Mandelic acid (5–10%) — gentler AHA',
      'Centella asiatica — anti-inflammatory, supports healing',
    ],
    safe_with_caution_darker_skin: [
      'Glycolic acid (5–10%) — start low, patch test. Higher concentrations can cause rebound pigmentation if skin becomes inflamed.',
      'Kojic acid (1–2%) — risk of contact dermatitis; use for short cycles.',
      'Retinoids — start at lowest strength, introduce slowly. Purging phase can temporarily worsen PIH.',
      'Lactic acid (5–10%) — gentler than glycolic, still patch test.',
      'Hydroquinone (2–4%) — effective but cycle use. Ochronosis risk with long-term use.',
    ],
    dangerous_avoid: [
      'Mercury-containing products (often listed as calomel, mercurous chloride, amide mercury, mercury) — toxic. Banned in US/EU/UK but widely found in unregulated brightening creams from West African, East African, and some South Asian markets. Causes kidney damage, neurological harm, and skin damage.',
      'High-dose steroids in unprescribed "whitening" creams — causes skin thinning, stretch marks, steroid acne, telangiectasia, and adrenal suppression.',
      'Unregulated "injection" brightening treatments — intravenous glutathione injections promoted for skin lightening. Not FDA-approved for this purpose, risk of infection, air embolism, Stevens-Johnson syndrome reported.',
      'Prescription-strength hydroquinone used without cycling or medical supervision.',
      'Physical scrubs on active hyperpigmentation — friction = inflammation = more PIH.',
      'Lightening creams with no ingredient list — frequently contain undisclosed mercury or steroids.',
    ],
  },

  colorism_awareness: {
    what_is_colorism: 'Colorism is prejudice or discrimination against individuals with a darker skin tone, typically among people of the same ethnic or racial group. It has roots in colonialism and continues to affect communities worldwide, placing social value on lighter skin.',
    
    harmful_messages: 'Advertising across South Asia, East Africa, and Southeast Asia has historically equated lighter skin with beauty, success, and marriageability. These messages create real psychological harm and drive demand for dangerous unregulated products.',
    reclaiming_narrative: 'A growing global movement — led by dermatologists, beauty educators, and community advocates — reframes the conversation: the goal is not to become lighter, it is to achieve even-toned, healthy, glowing skin at your natural complexion. Treating PIH is legitimate skin health; bleaching to change your baseline tone carries physical and psychological costs.',
    distinction: 'Treating hyperpigmentation (dark spots, PIH, melasma) is skin health — it returns skin to its natural baseline. Attempting to permanently bleach skin lighter than one\'s natural tone is a different pursuit with far greater risk and complex cultural implications.',
  },
};

// ─── HYPERPIGMENTATION STATS ──────────────────────────────────────────────────

// ─── ETHNIC HYPERPIGMENTATION GUIDES ─────────────────────────────────────────

export const ETHNIC_HYPERPIGMENTATION_GUIDES = {

  // ── 1. WEST AFRICAN ────────────────────────────────────────────────────────
  'west-african': {
    communityId: 'west-african',
    communityName: 'West African',
    skinToneRange: {
      fitzpatrick: 'Predominantly V–VI, with some IV',
      description: 'Rich medium brown to very deep brown and blue-black skin. Melanocytes are highly reactive, producing intense, fast, and long-lasting PIH in response to any skin trauma or inflammation.',
      nuance: 'West African skin is not monolithic — there is significant diversity across the region. Skin tones range from lighter olive-brown in parts of Senegal and Ghana\'s coastal communities to very deep tones across Nigeria, Mali, Guinea, and the Sahel. Treatment must always be individualised.',
    },

    primaryHyperpigmentationTypes: {
      pih: {
        
        severity: 'Tends to be darker and more persistent than in lighter skin types due to high melanocyte reactivity. Dermal PIH (blue-grey deep pigmentation) is more likely to develop in FP VI skin.',
        common_triggers: ['Acne and acne picking', 'Razor bumps (pseudofolliculitis barbae)', 'Ingrown hairs', 'Eczema flares', 'Insect bites', 'Friction from clothing or wigs', 'Hair removal (threading, waxing)'],
      },
      melasma: {
        
        pattern: 'Centrofacial pattern (forehead, nose, upper lip, chin) is most common in West African women with melasma.',
        aggravators: 'Hormonal contraceptives, pregnancy, heat, and sun exposure all trigger or worsen melasma. Even cooking over open flames or high heat sources has been implicated as a trigger (infrared radiation stimulates melanocytes).',
      },
      pseudofolliculitis_barbae: {
        what: 'Razor bumps — a form of traumatic PIH and inflammatory response specific to curly and coily hair. When tightly coiled hairs are cut, they curl back and re-enter the skin, causing a foreign body inflammatory reaction.',
        
        skin_impact: 'Each razor bump leaves PIH. For men who shave daily, the PIH accumulation can be extensive and psychologically distressing.',
        treatment: 'Reduce shaving frequency, use single-blade razors, direction-of-growth shaving, electric clippers leaving some length, topical retinoids to reduce hair curl-back, chemical depilatories (barium sulfide or calcium thioglycolate — use with caution, patch test). Benzoyl peroxide or salicylic acid to reduce inflammation. Eflornithine cream (prescription) slows hair regrowth.',
      },
      acanthosis_nigricans: {
        what: 'Velvety, dark thickening of skin in body folds — neck, armpits, groin. Often mistaken for hyperpigmentation but is a sign of insulin resistance or hyperinsulinism.',
        distinction: 'Does not respond to skin brightening ingredients. Requires management of the underlying metabolic condition (diet, exercise, metformin). Worth flagging to a doctor.',
        appearance: 'Symmetrical, velvety texture differentiates it from flat PIH.',
      },
    },

    traditionalBrighteningPractices: {
      shea_butter: {
        name: 'Shea Butter (Butyrospermum parkii)',
        origin: 'Derived from the nuts of the shea tree, native to West Africa. Used for centuries as a skin and hair moisturiser.',
        benefits: 'Rich in oleic acid, stearic acid, vitamins A and E, and triterpenes with anti-inflammatory and skin-healing properties. Supports skin barrier, reduces transepidermal water loss, soothes eczema and dry skin.',
        hyperpigmentation_role: 'Does not directly brighten, but a well-moisturised, barrier-intact skin heals faster and produces less PIH. Vitamin A content (as retinyl esters) offers mild cell-turnover support.',
        how_to_use: 'Raw unrefined shea butter is most potent but heavy. Best used as a night occlusive or body moisturiser. For facial use, refined or whipped shea is less comedogenic.',
        safety: 'Generally very safe. Some individuals find it comedogenic on the face — patch test for facial use.',
      },
      black_soap: {
        name: 'African Black Soap (Ose Dudu / Anago Soap)',
        origin: 'Traditional West African soap made from ash of plantain skins, cocoa pods, palm bark, and shea tree bark, combined with palm oil and shea butter. Used for centuries in Ghana, Nigeria, Benin, and Togo.',
        benefits: 'Gentle cleansing, natural antibacterial properties, rich in skin-nourishing plant ash minerals. Contains saponins that gently exfoliate. Can help with acne and reduce the oiliness that leads to more PIH-causing breakouts.',
        hyperpigmentation_role: 'Indirect — by reducing acne and inflammation, it reduces PIH triggers. Some users report gradual brightening with consistent use, likely from the mild exfoliation.',
        caution: 'Not all commercial "African black soap" products are authentic or well-formulated. Authentic black soap is grainy and uneven in texture. Some commercial versions add harsh detergents. Raw black soap can be very drying — follow with rich moisturiser.',
        how_to_use: 'Lather in hands first, apply to face gently. Do not rub bar directly on skin — too abrasive. Limit to once daily if skin feels dry.',
      },
      turmeric_mask: {
        name: 'Turmeric (Curcuma longa)',
        origin: 'Used across West Africa in traditional skincare (as well as in South Asian and Caribbean traditions). Mixed with honey, yoghurt, or black soap as a face mask.',
        benefits: 'Curcumin (the active compound) has anti-inflammatory and antioxidant properties. Some evidence of mild tyrosinase inhibition — the enzyme responsible for melanin production.',
        hyperpigmentation_role: 'Mild brightening and anti-inflammatory effects. Traditional use for evening skin tone and treating dark spots.',
        caution: 'Can stain skin yellow, especially lighter skin tones. Use Kasturi turmeric (non-staining variety) for face masks. Wash off thoroughly. Not a replacement for clinical brighteners.',
        how_to_use: 'Mix 1 tsp turmeric with honey and lemon juice (note: lemon juice can irritate sensitive skin). Apply for 10–15 minutes, rinse thoroughly. Weekly use maximum.',
      },
      papaya_enzyme: {
        name: 'Papaya (Carica papaya)',
        origin: 'Used in West, East, and Caribbean communities as a skin-brightening food and topical treatment.',
        benefits: 'Contains papain, a proteolytic enzyme that breaks down dead skin proteins — natural chemical exfoliation. Also contains vitamin C and flavonoids with antioxidant properties.',
        hyperpigmentation_role: 'Papain provides gentle enzymatic exfoliation, speeding cell turnover and fading superficial PIH. Topical papaya extracts are found in many brightening products.',
        caution: 'Raw papaya latex can cause severe irritation and allergic contact dermatitis in sensitive individuals. Use ripe papaya pulp (lower latex content) rather than unripe papaya. Patch test.',
        how_to_use: 'Mash ripe papaya pulp, apply to skin for 10–15 minutes, rinse. Once or twice weekly.',
      },
      camwood: {
        name: 'Camwood / Osun (Baphia nitida)',
        origin: 'Traditional West African red dye and cosmetic powder from the heartwood of the camwood tree. Used in Nigeria, Cameroon, Senegal in traditional skin rituals.',
        benefits: 'Contains santalin (a natural red dye) and has been used traditionally for skin conditions, as a natural rouge, and as a baby skin treatment.',
        hyperpigmentation_role: 'Traditional use as a skin brightener and soother. Limited clinical evidence, but anecdotal use is widespread.',
        modern_use: 'Available as powder — mixed with shea butter or water into a paste. Used as a mask or leave-on treatment.',
        caution: 'Stains clothes and surfaces. Some individuals may experience sensitivity. Limited safety data for prolonged use.',
      },
    },

    dangerousIngredients: {
      mercury: {
        risk_level: 'CRITICAL — LIFE-THREATENING',
        what: 'Mercury compounds (mercurous chloride, amide mercury, calomel, mercury iodide) are used in illegal skin-lightening creams across West Africa and in diaspora communities in the UK, US, Canada, and Europe.',
        why_used: 'Mercury inhibits melanin production effectively — it works fast and visibly. This makes mercury-containing creams popular despite their severe toxicity.',
        
        health_effects: [
          'Kidney damage and failure (mercury is directly nephrotoxic)',
          'Neurological damage — tremors, memory loss, numbness, psychiatric symptoms',
          'Peripheral neuropathy',
          'Skin damage — paradoxical darkening, skin erosion over time',
          'Harm to foetuses and breastfed infants (mercury passes through placenta and breast milk)',
          'Secondary poisoning of household members through mercury vapour from skin absorption',
        ],
        how_to_identify: 'Check ingredient list for: mercurous chloride, calomel, mercuric, mercury, amide mercury, quicksilver. If no ingredient list is present — do not use the product.',
        legal_status: 'Mercury in cosmetics is banned in the EU, US, UK, Canada, and Australia. Products with >1 ppm mercury are illegal. However, enforcement is weak for imported products, and illegal products circulate widely.',
        what_to_do: 'If you suspect you have been using a mercury-containing cream: stop immediately, wash skin thoroughly, dispose of product (in sealed container — mercury vapour hazard), consult a doctor for kidney function and mercury level testing. Report the product to local health authorities.',
      },
      unregulated_steroids: {
        risk_level: 'HIGH',
        what: 'Potent corticosteroids (clobetasol, betamethasone, fluocinolone, beclomethasone) are added illegally to skin-lightening creams to boost short-term brightening effects.',
        health_effects: [
          'Skin thinning (atrophy)',
          'Permanent stretch marks on face',
          'Telangiectasia (visible broken capillaries)',
          'Steroid acne',
          'Facial hypertrichosis (increased hair growth)',
          'Perioral dermatitis',
          'Adrenal suppression (disrupts the body\'s stress hormone system) with widespread use',
          'Skin rebound — when steroid cream is stopped, severe pigmentation and inflammation can follow',
        ],
        how_to_identify: 'Not always labelled. Creams that produce very fast lightening (within days), have a distinctive medical smell, or cause skin to feel "thin" or burn may contain unlabelled steroids. No legitimate OTC brightening cream should produce dramatic lightening within days.',
      },
      bleaching_agents_high_dose: {
        what: 'Very high doses of hydroquinone (>4%), or prolonged use without cycling.',
        risk: 'Ochronosis — a paradoxical blue-black thickening and darkening of skin. Permanent and very difficult to treat. Far more common in Sub-Saharan African populations using high-strength hydroquinone long-term.',
        safe_use: 'Prescription hydroquinone 4% used for a maximum of 3 months, then cycling off for 1–2 months. Always under medical supervision. Avoid combination with other potentially irritating ingredients during a hydroquinone course.',
      },
    },

    safeClinicaTreatments: {
      first_line: [
        {
          ingredient: 'Niacinamide 5–10%',
          why: 'Inhibits transfer of melanosomes (melanin packets) from melanocytes to skin cells. Anti-inflammatory. Extremely safe for Fitzpatrick V-VI. No ochronosis risk.',
          how_to_use: 'Apply morning and/or evening before moisturiser. Can combine with vitamin C (contrary to old myths, the combination is effective and safe).',
          timeline: 'Visible improvement in 4–8 weeks.',
        },
        {
          ingredient: 'Azelaic Acid 10–20%',
          why: 'Tyrosinase inhibitor with anti-inflammatory and mild antibacterial properties. Particularly effective on PIH arising from acne. Well-tolerated in dark skin. Does not cause ochronosis.',
          how_to_use: '10% available OTC in most markets; 15–20% by prescription (Finacea, Skinoren). Apply once or twice daily to affected areas.',
          timeline: '6–12 weeks for significant improvement.',
        },
        {
          ingredient: 'Tranexamic Acid (topical 2–5% or oral 250mg twice daily)',
          why: 'Blocks the UV-induced activation pathway that triggers melanocyte activity. Strong evidence for melasma. Safe across all skin tones.',
          how_to_use: 'Topical: apply once or twice daily. Oral: only under physician supervision — associated with rare risk of blood clotting in predisposed individuals.',
          timeline: '8–12 weeks topical; 8 weeks oral.',
        },
        {
          ingredient: 'Alpha Arbutin 1–2%',
          why: 'Stable, slow-release form of hydroquinone without ochronosis risk. Tyrosinase inhibitor. Good evidence for PIH and melasma.',
          how_to_use: 'Apply twice daily to affected areas.',
          timeline: '8–12 weeks.',
        },
        {
          ingredient: 'Vitamin C (L-ascorbic acid 10–20%)',
          why: 'Antioxidant that interrupts melanin synthesis, inhibits tyrosinase, scavenges free radicals from UV exposure. Also supports collagen production.',
          how_to_use: 'Apply in AM before SPF. Store in dark, cool location — oxidises and loses potency when exposed to light and air.',
          timeline: '8–12 weeks.',
        },
      ],
      second_line: [
        {
          ingredient: 'Retinoids (adapalene 0.1–0.3%, tretinoin 0.025–0.05%)',
          why: 'Accelerate skin cell turnover, pushing pigmented cells out faster. Also suppress melanin production. Excellent for PIH from acne. Use with caution — start very low strength.',
          caution: 'Start with lowest available strength. Apply every other night to begin. Retinoid dermatitis (dryness, peeling, redness) temporarily worsens PIH risk. Do not combine with glycolic acid at the same time.',
          timeline: '3–6 months for significant PIH improvement.',
        },
        {
          ingredient: 'Mandelic Acid 5–10%',
          why: 'Larger molecule AHA — penetrates skin more slowly, making it safer for dark skin than glycolic acid. Exfoliates and brightens with lower risk of triggering rebound pigmentation.',
          how_to_use: 'Apply 2–3 times weekly, evening. Start lower frequency.',
          timeline: '6–8 weeks.',
        },
      ],
      clinical_procedures: [
        {
          procedure: 'Chemical Peels (superficial-medium)',
          safe_options: 'Mandelic acid peels (most suitable for FP V-VI), lactic acid, low-concentration salicylic acid peels. Glycolic acid peels require experienced practitioners for darker skin.',
          avoid: 'High-concentration glycolic acid or TCA peels without melanin pre-treatment — severe post-peel PIH risk in FP V-VI.',
          note: 'Always preceded by a 4–6 week "pre-peel prep" course of brightening agents to reduce melanocyte reactivity.',
        },
        {
          procedure: 'Q-switched Nd:YAG Laser (1064nm)',
          why_safe_for_dark_skin: 'The 1064nm wavelength is absorbed less by melanin than shorter wavelengths, making it safer for darker skin. Used for dermal PIH and stubborn epidermal PIH.',
          risk: 'Post-inflammatory hyperpigmentation from the laser itself is a real risk — must be performed by a practitioner experienced with Fitzpatrick V-VI skin.',
          sessions: '3–6 sessions typically needed.',
        },
      ],
    },

    dermProcessForSkinTone: {
      before_any_treatment: 'Patch test all new actives — apply a small amount to the inner arm or behind the ear for 48–72 hours. Fitzpatrick V-VI skin can react intensely to ingredients tolerated by lighter skin types.',
      introduce_slowly: 'Introduce one new active at a time, with a 2-week gap between introductions. Start at lowest available concentration.',
      avoid_inflammatory_triggers: 'Manage the source of PIH alongside treating existing spots. Active acne, eczema, or razor bumps must be addressed simultaneously, or the PIH cycle continues.',
      dermatologist_access: 'West African communities globally face documented barriers to dermatology access — many dermatology training programmes have historically used predominantly lighter skin for teaching, leaving some practitioners less experienced with darker skin presentations. Seek out dermatologists with documented experience in Fitzpatrick V-VI skin. In the UK, the British Association of Dermatologists maintains resources for diverse skin. In the US, the Skin of Color Society (SOCS) maintains a directory of practitioners.',
    },

    spf_guidance: {
      importance: 'SPF is non-negotiable even for Fitzpatrick VI skin, despite the common myth that very dark skin does not need sunscreen. High melanin content gives some built-in protection, but it does not prevent UV-triggered PIH or melasma.',
      challenges: 'White cast from traditional mineral sunscreens (zinc oxide, titanium dioxide) is a major reason for SPF non-compliance in West African communities. This is a real formulation problem — many traditional sunscreens do appear white and chalky on dark skin.',
      solutions: [
        'Tinted mineral SPF formulations designed for medium-deep to deep skin tones.',
        'Chemical sunscreens (avobenzone, tinosorb S/M, homosalate, octisalate) — transparent, no white cast, effective. Suitable for most people. Note: oxybenzone is controversial; preference for octinoxate or tinosorb where available.',
        'Hybrid mineral-chemical SPF formulations that reduce white cast while maintaining broad-spectrum coverage.',
        'SPF in tinted moisturisers and foundations (supplement, not replace, dedicated SPF).',
      ],
      recommended_spf: 'SPF 50+ PA++++ for active hyperpigmentation treatment. Reapply every 2 hours in direct sun.',
    },

    culturalContext: {
      colorism_in_community: 'Colorism is deeply embedded in many West African societies and across the West African diaspora. Terms like "yellow" or "bright" (used to describe lighter skin) carry social weight in Nigerian, Ghanaian, and Cameroonian cultural contexts, while darker skin tones have historically been subject to social disadvantage in certain settings.',
      
      reclaiming_movement: 'A significant counter-movement is growing — social media campaigns like #BlackIsBeautiful and #MelaninPoppin originating in the US have global reach. Nigerian and Ghanaian influencers are increasingly challenging the bleaching norm and promoting skin health over skin colour change.',
      community_conversations: 'Open conversations about colorism within families, communities, and religious spaces are growing. Educating on the difference between treating PIH (health) and attempting to bleach to a lighter baseline (different goal, significant risk) is important nuance.',
      safe_messaging: 'Beauty professionals and dermatologists working in West African communities are encouraged to: lead with skin health, not lightness; avoid using "brighter" as a proxy for "lighter"; discuss PIH as a medical concern, not a cosmetic failing; and provide explicit warnings about dangerous products rather than assuming patients know.',
    },

    treatmentTimelines: {
      mild_pih: '4–8 weeks for initial improvement with niacinamide, SPF, and no new inflammatory triggers. 3–4 months for significant fading.',
      moderate_pih: '3–6 months with consistent treatment (niacinamide + azelaic acid or tranexamic acid + SPF 50+).',
      severe_pih_dermal: '12–24 months. Dermal PIH may not fully resolve — professional laser treatment accelerates improvement.',
      melasma: '3–6 months for improvement, but melasma is chronic and recurs. Lifelong SPF and avoiding hormonal triggers is essential for management.',
      psb_razor_bumps: 'Ongoing — requires changing shaving habits alongside topical treatment. New bumps continue to form without behaviour change.',
      realistic_expectations: 'For very dark (FP VI) skin with intense PIH: be patient. The same melanin activity that causes intense PIH means the skin is beautifully rich in melanin — that same abundance requires more time to resolve excess deposits. Results come with consistency, not with stronger and more aggressive products.',
    },
  },

  // ── 2. SOUTH ASIAN ─────────────────────────────────────────────────────────
  'south-asian': {
    communityId: 'south-asian',
    communityName: 'South Asian',
    skinToneRange: {
      fitzpatrick: 'Predominantly III–V, ranging from fair (Kashmir, some Punjab) to medium brown (much of India, Pakistan, Bangladesh, Sri Lanka) to deeper tones (South India, Tamil Nadu, Kerala, Sri Lanka)',
      description: 'Highly variable across the subcontinent. Northern South Asians may present as Fitzpatrick III; Central and Western South Asians IV; Southern South Asians (Tamil, Sinhalese, Telangana) IV–V. Bangladesh and Sri Lanka span the full range. This diversity means treatment must be calibrated carefully.',
      nuance: 'South Asian skin is often described as "olive" — this term encompasses a range of warm-toned medium to medium-deep skin. The olive undertone (yellow-green component) affects how brightening treatments appear and how products should be selected to avoid ashiness or unwanted tonal shifts.',
    },

    primaryHyperpigmentationTypes: {
      melasma: {
        
        pattern: 'Centrofacial and malar (cheek-focused) patterns are most common.',
        triggers: 'Pregnancy, oral contraceptive pills (especially older combined OCPs), perimenopause, sun exposure. Spicy food and heat (cooking over gas flames) has been anecdotally linked — some evidence that infrared heat activates melanocytes.',
        cultural_notes: 'Melasma is sometimes called "chloasma" historically; in South Asian communities, the term "pregnancy mask" (rang ka daag) is used colloquially in Hindi/Urdu. Considerable pressure on South Asian women to treat melasma, as it conflicts with cultural beauty ideals around clear, even skin.',
      },
      pih: {
        
        common_triggers: ['Acne', 'Eyebrow threading (causes micro-trauma along brow)', 'Upper lip threading and waxing', 'Eczema (atopic dermatitis)', 'Prickly heat rash (miliaria) from high heat and humidity'],
        threading_pih: 'Upper lip and eyebrow threading is a nearly universal practice among South Asian women. The repeated micro-trauma of threading can cause persistent PIH along the brow line and upper lip — often dismissed as normal but treatable.',
      },
      sun_damage: {
        
        reverse_migration_pattern: 'UK/Canada/US-raised South Asians who move back or visit South Asia frequently see new hyperpigmentation develop rapidly — their skin has adapted to lower UV environments.',
      },
      periorbital_hyperpigmentation: {
        what: 'Dark circles around the eyes — a combination of vascular (blue-purple undertone from thin periorbital skin and blood vessel visibility), pigmentary (brown from melanin deposition), and structural (shadows from tear troughs) causes.',
        south_asian_specificity: 'Periorbital hyperpigmentation has been documented as more prevalent in South Asian populations — both the pigmentary and vascular components. Genetic predisposition, thin periorbital skin, allergies causing chronic eye rubbing, and sun exposure all contribute.',
        treatment: 'Vitamin C for the pigmentary component. Caffeine, retinol, niacinamide for vascular/skin-quality component. Filler (under qualified practitioner) for structural component. Full-coverage concealer with colour correction (peach/orange corrector before concealer for brown undertones).',
      },
    },

    traditionalBrighteningPractices: {
      turmeric_ubtan: {
        name: 'Turmeric Ubtan',
        origin: 'Ubtan (उबटन) is a traditional Indian bridal beauty paste used across North and South India, Pakistan, and Nepal. Applied during pre-wedding rituals (haldi ceremony) for days to weeks before a wedding.',
        ingredients: 'Turmeric (haldi), gram flour (besan), sandalwood powder, milk or rosewater, sometimes saffron, almond paste, or Fuller\'s Earth (multani mitti).',
        benefits: 'Curcumin in turmeric: anti-inflammatory, mild tyrosinase inhibition, antioxidant. Gram flour provides gentle exfoliation. Sandalwood: cooling, anti-inflammatory, contains santalol with reported melanin-inhibiting properties. Milk: lactic acid for gentle exfoliation.',
        hyperpigmentation_role: 'Mild brightening and anti-inflammatory. Traditional use for achieving a "glow" before major events. Consistent use may show mild improvement in PIH over weeks to months.',
        modern_evidence: 'Curcumin has been studied in some in vitro (cell culture) studies showing tyrosinase inhibition. In vivo (human skin) clinical evidence for turmeric as a brightening treatment is limited but positive for anti-inflammation.',
        caution: 'Turmeric stains skin yellow temporarily — allow 30–60 minutes for stain to fully wash off. Traditional ubtan is not a replacement for clinical treatment of significant PIH or melasma.',
        how_to_use: '2 tsp gram flour + 1/2 tsp turmeric + milk to paste. Apply for 15–20 minutes. Rinse with warm water. 2–3x weekly.',
      },
      saffron_milk: {
        name: 'Saffron (Kesar) in Milk',
        origin: 'Saffron has been used in Indian Ayurvedic beauty traditions for millennia. Attributed with skin brightening, anti-aging, and complexion-enhancing properties.',
        active_compounds: 'Safranal, crocin, crocetin — antioxidants and potential melanin inhibitors. Limited clinical skin evidence but good antioxidant data.',
        traditional_use: 'Saffron strands soaked in raw milk or cream, applied to skin. Also taken internally — warm milk with saffron is a traditional tonic.',
        hyperpigmentation_role: 'Mild antioxidant brightening effect. Anti-inflammatory. Moisturising when used in milk base.',
        
        caution: 'Authentic saffron is safe. Ensure authenticity — fake saffron (dyed safflower threads) are common. Internal saffron consumption in large quantities has medicinal effects — stay within culinary doses.',
      },
      sandalwood: {
        name: 'Sandalwood (Chandan)',
        origin: 'Sandalwood paste (chandan) is a cornerstone of Indian Ayurvedic skin and spiritual practice. Used in daily beauty routines and religious ceremonies across India, Nepal, and Sri Lanka.',
        
        benefits: 'Cooling sensation (valuable in South Asian climates), anti-inflammatory, antibacterial, mild brightening.',
        forms: 'Pure sandalwood powder mixed with rosewater or milk for paste. Commercial sandalwood soaps and creams (note: many commercial products use synthetic sandalwood fragrance rather than actual sandalwood).',
        caution: 'True sandalwood (Santalum album, Mysore sandalwood) is highly regulated due to overharvesting. Many products use synthetic santalol or adulterated sandalwood. Australian sandalwood (Santalum spicatum) is a legal sustainable alternative. Sandalwood fragrance ≠ sandalwood active compounds — look for actual extract or oil.',
      },
      multani_mitti: {
        name: "Fuller's Earth (Multani Mitti)",
        origin: "Widely used across South Asia as a face pack. Called Multani mitti ('mud from Multan,' Pakistan).",
        benefits: 'Natural clay mineral that absorbs excess sebum, provides mild exfoliation via mineral action, cooling sensation.',
        hyperpigmentation_role: 'Indirect — by reducing oiliness and improving skin texture, it reduces acne and inflammation that cause PIH. Some traditional use for brightening, possibly from exfoliation.',
        how_to_use: 'Mix with rosewater, yoghurt, or lemon juice (note: direct lemon juice application can irritate and cause photosensitivity — dilute well). Apply as a pack for 10–15 minutes, rinse off before it fully dries (dried clay is excessively drying).',
        caution: 'Can be drying for dry or combination skin. Limit to 1–2x weekly. Do not use undiluted lemon juice on face — photosensitive reaction risk.',
      },
      vitamin_c_amla: {
        name: 'Amla (Indian Gooseberry / Phyllanthus emblica)',
        origin: 'One of the richest plant sources of vitamin C. Used in Ayurvedic medicine for skin, hair, and systemic health. A key ingredient in the traditional hair oil treatment Brahmi amla.',
        vitamin_c_content: 'One of the highest natural vitamin C concentrations of any food — estimated 445–921 mg per 100g (fresh). For comparison, oranges contain ~53 mg per 100g.',
        hyperpigmentation_role: 'Topical vitamin C (from amla extract) functions as an antioxidant and mild tyrosinase inhibitor. Also used as a dietary supplement for skin health.',
        forms: 'Amla powder, amla oil (for hair, not typically for face), amla juice (dietary), amla extract in skincare formulations.',
        
      },
    },

    dangerousIngredients: {
      fairness_cream_industry: {
        
        mercury_in_south_asia: 'Mercury-containing creams are less prevalent in South Asia than West Africa but still found in unregulated markets, particularly herbal "whitening" creams from smaller manufacturers. Some Ayurvedic preparations (Rasa Shastra preparations) use heavy metals including mercury — while traditionally detoxified through specific processes, contamination risk exists.',
        
        how_to_identify: 'If a cream promises dramatic results in days, it likely contains a steroid. If skin \'rebounds\' badly when you stop using it (skin becomes severely red, itchy, burning), it almost certainly contained a steroid.',
      },
      kojic_acid_overuse: {
        risk: 'Kojic acid, while effective, can cause contact dermatitis and allergic reactions in some South Asian users. Overuse without cycling can lead to skin sensitisation.',
        safe_use: 'Use for maximum 3 months at a time. Concentrations of 1–2% are safe; higher concentrations are more likely to irritate.',
      },
      high_spf_non_compliance: {
        note: 'Historically, SPF use rates in South Asia have been very low — largely because SPF was not part of traditional skincare culture, and because heavy SPF application was associated with whitening creams, creating cultural ambivalence. This is changing with dermatology education but remains a significant gap.',
      },
    },

    safeClinicaTreatments: {
      melasma_specific: [
        {
          ingredient: 'Triple Combination Cream (Kligman Formula)',
          components: 'Hydroquinone 4% + tretinoin 0.05% + fluocinolone acetonide 0.01%',
          why: 'Most studied melasma treatment. HQ inhibits melanin synthesis, tretinoin speeds cell turnover and enhances HQ penetration, fluocinolone reduces inflammation.',
          caution: 'Should only be used under dermatologist supervision. Maximum 8–12 weeks continuous use, then transition to maintenance. Fluocinolone (a steroid) causes atrophy with long-term use.',
          
        },
        {
          ingredient: 'Tranexamic Acid (oral or topical)',
          why: 'Excellent evidence specifically in Asian skin types. Oral tranexamic acid 250mg twice daily for 8–12 weeks has shown results comparable to triple combination cream in some South Asian studies, without the side effect profile.',
          access: 'Oral tranexamic acid requires prescription in most countries. Topical 2–5% is available OTC or prescription.',
        },
        {
          ingredient: 'Cysteamine 5%',
          why: 'A newer brightening agent with good tolerability in Fitzpatrick IV-V skin. More potent than alpha arbutin, with comparable efficacy to hydroquinone in some studies, without ochronosis risk.',
          how_to_use: 'Apply once daily, leave on for 15 minutes, then rinse off (rinse-off formulation reduces irritation). Available as prescription or specialist OTC product.',
        },
      ],
      general_pih: [
        {
          ingredient: 'Niacinamide 10% + Zinc',
          why: 'Combination well-studied for PIH in South Asian skin. Niacinamide reduces melanosome transfer; zinc has anti-inflammatory properties. High tolerability.',
          product_example: 'The Ordinary Niacinamide 10% + Zinc 1% is a commonly used affordable option.',
        },
        {
          ingredient: 'Vitamin C 15–20% (stabilised formulation)',
          why: 'Morning antioxidant, tyrosinase inhibitor, collagen support. Particularly helpful for the post-acne PIH very common in South Asian skin.',
          formulation: 'L-ascorbic acid at pH <3.5 is most effective. Look for products with ferulic acid and vitamin E to enhance stability and efficacy.',
        },
      ],
      procedures_for_south_asian_skin: [
        {
          procedure: 'Low-Fluence Q-switched Nd:YAG Laser (1064nm)',
          note: 'Safer for South Asian skin than higher-fluence or shorter-wavelength lasers. Used for melasma and dermal PIH. Multiple sessions required.',
          risk: 'Post-laser PIH is a real risk — strict post-procedure SPF and HQ-based maintenance is critical.',
        },
        {
          procedure: 'Chemical Peels (lactic acid, glycolic acid low-medium concentrations)',
          note: 'Well-tolerated in South Asian skin (FP III-V) when concentrations are appropriate. Start with superficial peels. Glycolic acid 20–35% peels every 2–3 weeks for melasma are standard practice in many Indian dermatology clinics.',
          pre_treatment: 'Pre-peel preparation with vitamin C + niacinamide + SPF for 4–6 weeks reduces post-peel PIH risk.',
        },
      ],
    },

    spf_guidance: {
      
      cultural_shift: 'Prominent South Asian dermatologists and skincare educators (particularly on Instagram and YouTube) have significantly increased awareness of daily SPF use in South Asian communities over 2018–2024. The framing of SPF as an anti-aging and anti-pigmentation tool (not merely a beach product) has driven adoption.',
      recommended: 'SPF 50 PA++++ (Japan/Korea PA rating is a better indicator of UVA protection than the star rating system). Tinted SPFs that complement warm olive skin tones are increasingly available from Korean and Japanese brands.',
      
    },

    culturalContext: {
      colorism_history: '"Fair and lovely" is not just a brand name — it encapsulates a deeply rooted historical equation of light skin with beauty, prosperity, and social status across South Asian cultures, with roots in caste systems, Mughal court aesthetics, and British colonial legacy. Matrimonial ads in India and Pakistan commonly still specify "fair complexion" as a desired trait.',
      bollywood_effect: 'Bollywood has historically presented lighter-skinned leads as romantic heroes and heroines, with darker-skinned actors cast in comedic or villainous roles. This has shifted somewhat in recent years with a new generation of conscious filmmakers, but the historical standard has left deep cultural impressions.',
      changing_landscape: 'A meaningful movement for representation and skin pride is growing, driven by Indian, Pakistani, Bangladeshi, and Sri Lankan creators, activists, and dermatologists on social media. The removal of discriminatory matrimonial ad language and the reformulation of "Fair & Lovely" to "Glow & Lovely" in 2020 — while a marketing move — reflected real consumer and activist pressure.',
      diaspora_experience: 'South Asian diaspora communities in the UK, US, and Canada experience colorism in intersecting forms — both from within their own communities and from external racism that operates differently but sometimes converges. The psychology of hyperpigmentation treatment in diaspora communities is complex — multiple motivations operate simultaneously.',
      safe_messaging: 'Lead with skin health. Distinguish PIH (returning skin to its natural tone) from pursuing lightness beyond one\'s natural tone. Acknowledge colorism explicitly in clinical and beauty contexts rather than colluding in it through language.',
    },

    treatmentTimelines: {
      pih_from_acne: '3–5 months for significant improvement with consistent niacinamide + vitamin C + SPF 50.',
      threading_pih: '2–4 months for brow and upper lip PIH from threading, with targeted brighteners + SPF.',
      melasma: '3–6 months for visible improvement; requires ongoing maintenance and may never fully resolve. Recurrence with hormonal changes or sun exposure is very common.',
      periorbital_pigmentation: '3–6 months with vitamin C + retinol (separate AM/PM). Some improvement; structural dark circles require filler.',
      sun_damage_diffuse: '4–6 months with consistent vitamin C + niacinamide + SPF 50. Uneven pigmentation improves; total sun damage is a long-term management project.',
    },
  },

  // ── 3. CARIBBEAN ─────────────────────────────────────────────────────────
  'caribbean': {
    communityId: 'caribbean',
    communityName: 'Caribbean',
    skinToneRange: {
      fitzpatrick: 'III–VI — an unusually wide range reflecting the Caribbean\'s history of Indigenous peoples, European colonisation, the transatlantic slave trade, and South Asian and Chinese indenture. This creates remarkable genetic and phenotypic diversity.',
      description: 'Caribbean communities encompass a spectrum of skin tones — from lighter mixed European-African tones in some Dominican, Puerto Rican, and Cuban communities, to medium brown in Jamaican and Barbadian populations, to very deep tones in Haitian communities. Trinidad, Guyana, and Suriname carry South Asian heritage that introduces olive-brown Fitzpatrick IV skin. The result: hyperpigmentation treatment must be highly individualised across the Caribbean diaspora.',
      genetic_diversity: 'Many Caribbean individuals have multi-ancestral melanocyte biology — African, Indigenous (Arawak/Taino), European, and South Asian lineages in varying proportions. This can make skin tone and pigmentation behaviour somewhat unpredictable — some Caribbean individuals with moderate phenotypic skin tone have melanocyte reactivity closer to Fitzpatrick V-VI due to African genetic heritage.',
    },

    primaryHyperpigmentationTypes: {
      pih: {
        
        island_specific: 'Island living means high UV exposure year-round combined with high humidity. Humidity can worsen acne (clogged pores, sweat-induced breakouts) — more acne = more PIH triggers. High sweat also washes off sunscreen quickly, reducing UV protection effectiveness.',
        rosacea_intersection: 'Caribbean individuals with lighter skin and European ancestry may experience rosacea-associated PIH, which presents differently and requires different treatment from melanin-based PIH.',
      },
      sun_damage: {
        
        compounding_issue: 'Ocean reflectance, white sand reflectance, and direct tropical sun creates high cumulative UV burden even for people who do not intentionally sunbathe.',
        darker_skin_spf_myth: 'In Caribbean communities, there is a widespread belief that darker skin does not need sunscreen. This is incorrect — while melanin provides some protection, the UV exposure levels in the Caribbean are sufficient to cause pigmentation changes and DNA damage in all skin types.',
      },
      
      eczema_pih: {
        note: 'Atopic dermatitis (eczema) is notably prevalent in Afro-Caribbean populations. Each eczema flare leaves PIH. Managing eczema actively is essential to preventing ongoing PIH accumulation.',
      },
    },

    traditionalBrighteningPractices: {
      papaya: {
        name: 'Papaya (Carica papaya)',
        origin: 'Native to tropical America, now grown throughout the Caribbean. Papaya is embedded in Caribbean skincare traditions — grandmothers across Jamaica, Trinidad, Barbados, and Haiti have traditionally used fresh papaya on skin.',
        active_compounds: 'Papain (proteolytic enzyme), chymopapain, vitamin C, beta-carotene, lycopene.',
        benefits: 'Papain provides enzymatic exfoliation by digesting dead skin proteins. Vitamin C and carotenoids offer antioxidant brightening. Regular papaya use can gently fade superficial PIH over time.',
        how_to_use: 'Mash ripe papaya pulp (yellow-orange flesh is ripe and lower in irritating latex than green papaya). Apply to clean skin for 10–15 minutes. Rinse with cool water. 2–3x weekly.',
        caution: 'Unripe papaya (green) has very high papain content and can cause severe irritation, burns, and contact dermatitis. Use only ripe fruit. Individuals with latex allergy may cross-react with papain (latex-fruit syndrome). Patch test on inner arm first.',
        commercial_use: 'Papaya enzyme is used in commercial exfoliating masks, face washes, and brightening serums. Commercial papain products are more standardised than DIY fresh papaya.',
      },
      aloe_vera: {
        name: 'Aloe Vera (Aloe barbadensis)',
        origin: 'Widely grown across the Caribbean. A household plant in most Caribbean homes — the gel is used for sunburn, skin rashes, hair, and general skin soothing.',
        active_compounds: 'Aloesin (a chromone derivative) — a direct tyrosinase inhibitor. Acemannan — anti-inflammatory polysaccharide. Anthraquinones — mild exfoliants in small amounts.',
        
        how_to_use: 'Fresh aloe gel (cut a lower leaf, scoop gel) applied as a leave-on overnight treatment or a 20-minute mask. Or use a formulated aloe vera gel product (99% aloe).',
        caution: 'Some people are allergic to aloe — patch test. The yellow sap just under the aloe leaf skin (aloe latex, containing aloin) can be irritating — scoop only the inner clear gel. Commercial aloe gels sometimes contain preservatives that can cause reactions.',
      },
      coconut_oil: {
        name: 'Coconut Oil',
        origin: 'Ubiquitous across the Caribbean for skin and hair. Used since pre-colonial times by Indigenous Caribbean peoples and reinforced across all migration streams.',
        benefits: 'Moisturising (lauric acid, myristic acid), some antimicrobial properties, good barrier occlusive. Very popular as a body moisturiser and hair oil.',
        hyperpigmentation_role: 'Does not directly brighten skin. Supports barrier function, which reduces inflammation and thereby may reduce PIH formation indirectly.',
        caution: 'Coconut oil is comedogenic (pore-clogging) — rated 4/5 on the comedogenicity scale. Should not be used on acne-prone facial skin. Fine for body use. For face, better to use non-comedogenic oils (rosehip, squalane, marula).',
      },
      lime_and_honey: {
        name: 'Lime and Honey Mask',
        origin: 'Traditional Caribbean brightening remedy — lime (Citrus aurantifolia) and honey (often raw Caribbean raw honey).',
        benefits: 'Lime: citric acid (AHA) exfoliation, vitamin C. Honey: humectant, antibacterial, propolis anti-inflammatory.',
        hyperpigmentation_role: 'Citric acid provides mild chemical exfoliation; vitamin C provides antioxidant brightening. Honey soothes and moisturises.',
        CRITICAL_CAUTION: 'IMPORTANT — lime juice contains psoralens (furanocoumarins), which are potent photosensitisers. Applying lime juice to skin and then going into the sun (which is hard to avoid in the Caribbean) causes phytophotodermatitis — severe burns and PIH that can be far worse than the original spots being treated. NEVER apply lime juice or any citrus juice to skin before sun exposure. If used at all, use only at night, rinse off completely, and avoid sun the following morning.',
        safer_alternative: 'Lactic acid (from yoghurt or formulated product) provides similar gentle exfoliation without photosensitivity risk. Commercial vitamin C serum is safer and more effective than lime juice for brightening.',
      },
      sea_moss: {
        name: 'Irish Sea Moss (Chondrus crispus)',
        origin: 'Sea moss has been used in Caribbean folk medicine and nutrition for generations — popularised globally through Jamaican and wider Caribbean diaspora wellness culture.',
        active_compounds: 'Carrageenan (a polysaccharide), vitamins A, C, E, and K, iodine, magnesium, zinc.',
        hyperpigmentation_role: 'Antioxidant vitamins support skin health. No direct depigmenting mechanism established. Used as a nutrient-dense hydrating mask rather than a specific brightening treatment.',
        how_to_use: 'Blend soaked sea moss gel with honey or rosewater, apply as a face mask for 15–20 minutes.',
        
      },
    },

    dangerousIngredients: {
      mercury_in_caribbean: {
        
        
        diaspora_access: 'Products purchased online or from specialty shops catering to Caribbean diaspora communities may come from unregulated sources. Country of manufacture and regulatory oversight varies enormously.',
        symptoms: 'See West African section for full symptom list. Early symptoms: skin rash, kidney function changes, tingling or numbness in extremities.',
      },
      photosensitising_traditional_remedies: {
        lime: 'Already covered — the lime juice + sun combination causing phytophotodermatitis is a significant Caribbean-specific danger. This is not a fringe concern — it is a documented clinical presentation in Caribbean dermatology.',
        bergamot: 'Bergamot oil (used in some Caribbean and Afro-Caribbean hair and skin products) contains bergapten, a potent psoralen. Same phytophotodermatitis risk as lime when applied to sun-exposed skin.',
      },
    },

    safeClinicaTreatments: {
      suitable_for_diverse_skin_tones: [
        {
          ingredient: 'Niacinamide 5–10%',
          note: 'Safe across the full FP III-VI range found in Caribbean communities.',
        },
        {
          ingredient: 'Azelaic Acid 15–20%',
          note: 'Particularly useful for PIH from eczema, which is common in Afro-Caribbean skin.',
        },
        {
          ingredient: 'Mandelic Acid 5–10%',
          note: 'The safest AHA for Fitzpatrick IV-VI skin — large molecule, slow penetration, lower risk of post-peel PIH.',
        },
        {
          ingredient: 'Aloesin (from aloe vera extract)',
          note: 'One of the few traditional ingredients with direct clinical evidence for tyrosinase inhibition. Look for standardised aloe vera extract in formulations.',
        },
        {
          ingredient: 'Tranexamic Acid 2–5% topical',
          note: 'Safe for all Caribbean skin tones. Good evidence for melasma and general hyperpigmentation.',
        },
      ],
      eczema_plus_pih_protocol: {
        step_1: 'Control active eczema first — PIH cannot resolve while eczema is flaring and creating new pigmentation.',
        step_2: 'Gentle fragrance-free cleanser and moisturiser (ceramide-based).',
        step_3: 'Once eczema is in remission, introduce azelaic acid or niacinamide for PIH.',
        step_4: 'Consistent SPF 50 — photosensitised eczema skin is particularly UV-vulnerable.',
        note: 'Do not use retinoids on eczema-prone skin without significant moisturiser support — they can trigger barrier breakdown and eczema flares that create more PIH.',
      },
      sun_damage_treatment: {
        priority: 'SPF 50 is non-negotiable in tropical Caribbean climates. Reapplication every 2 hours outdoors. This is more important than any treatment ingredient.',
        brightening_protocol: 'Vitamin C morning + niacinamide + SPF 50 for general sun-induced uneven tone. Add mandelic acid exfoliation twice weekly in evening.',
        professional: 'IPL (Intense Pulsed Light) can treat sun spots in lighter Caribbean skin (FP III-IV) but is NOT safe for darker Caribbean skin (FP V-VI) — significant burn and PIH risk. Q-switched Nd:YAG laser at 1064nm is preferred for FP V-VI.',
      },
    },

    spf_guidance: {
      challenge: 'Caribbean UV exposure is extreme (UV Index 10–12 most of the year). Even Fitzpatrick VI skin accumulates enough UV damage to experience sun-induced pigmentation and photoaging. The myth that dark Caribbean skin does not need SPF is dangerous and culturally entrenched.',
      heat_and_humidity: 'High humidity causes SPF to wash off through sweating faster. Water-resistant SPF formulations are preferred in Caribbean climates. Reapplication is more critical in humid outdoor environments.',
      reef_safe: 'A growing movement across the Caribbean towards reef-safe (oxybenzone and octinoxate-free) sunscreens — both for environmental protection of coral reefs and as a marketing differentiation. Reef-safe formulations (zinc oxide, tinosorb) are increasingly available.',
      practical_recommendation: 'SPF 50+ PA++++ broad-spectrum, water-resistant, reapplied every 90 minutes in direct sun. Wearing hats, UV-protective clothing, and seeking shade during 10am–4pm peak UV hours provides additional protection.',
    },

    culturalContext: {
      colorism_complexity: 'Caribbean colorism is deeply rooted and uniquely complex — shaped by the specific history of the plantation system, where proximity to lighter skin often correlated with slightly less brutal conditions of enslavement, creating internal hierarchies that persisted into post-emancipation society. Terms like "red skin," "brown skin," and "clear skin" carry specific social weight in different Caribbean island contexts.',
      
      haiti: 'Haitian colorism has colonial French roots — lighter-skinned Haitians (mulattos) historically occupied elite social positions. This legacy creates internal colorism that persists today.',
      indo_caribbean: 'Indo-Caribbean communities (particularly Trinidad, Guyana, Suriname) experience colorism from both South Asian traditions (fair skin preference) and from position within Caribbean multiracial hierarchies.',
      reclaiming_roots: 'Rastafarian philosophy and the Black consciousness movement have historically challenged colorism in Jamaica and across the Caribbean — "black is beautiful" as a spiritual and political affirmation. Contemporary Caribbean artists, writers, and activists are actively reclaiming diverse Caribbean skin tones as beautiful.',
      diaspora_uk: 'In the UK, the Caribbean diaspora community faces both internal colorism and external racism. Darker-skinned Caribbean British individuals are statistically more likely to face employment discrimination. Skin health and skin tone choices are made in this complex context.',
    },

    treatmentTimelines: {
      acne_pih: '3–5 months consistent treatment, consistent SPF 50.',
      eczema_pih: '4–6 months after eczema control is achieved — longer than regular PIH because eczema PIH tends to be deeper and more diffuse.',
      sun_damage: '4–8 months of active treatment + daily SPF to see meaningful improvement in diffuse sun-induced tone unevenness.',
      melasma: '3–6 months initial improvement; lifetime management needed. Hormonal trigger control is critical.',
    },
  },

  // ── 4. ARAB ────────────────────────────────────────────────────────────────
  'arab': {
    communityId: 'arab',
    communityName: 'Arab',
    skinToneRange: {
      fitzpatrick: 'II–V — enormous regional diversity. Levantine (Lebanon, Syria, Jordan, Palestine): often II-III with olive undertones. Gulf (Saudi Arabia, UAE, Kuwait, Qatar, Bahrain): III-IV to V. North African Arab (Morocco, Algeria, Tunisia, Egypt, Libya): III-V with significant variation. Yemen and Oman: IV-V.',
      description: 'Arab skin is defined by its warm undertones — olive (yellow-green), golden, or warm beige. The olive undertone affects pigmentation presentation: PIH often appears olive-grey or brown-grey rather than the blue-grey seen in Afro-Caribbean dermal PIH. This undertone also affects which SPF formulations look best — warm-tinted or transparent SPFs outperform those with cool or pink bases.',
      nuance: 'Arab identity encompasses enormous ethnic diversity — from Amazigh (Berber) North Africans to Gulf Khaleeji to Levantine to Yemeni communities. Genetic heritage is varied and skin biology reflects this. Do not assume homogeneity in treatment approach.',
    },

    primaryHyperpigmentationTypes: {
      melasma: {
        
        pattern: 'Centrofacial (forehead, nose, upper lip) and malar (cheek) patterns. Bilateral symmetry is a diagnostic hallmark of melasma vs PIH.',
        specific_triggers: 'Gulf Arab women who wear the niqab (face veil) have an interesting and sometimes overlooked melasma pattern — the face covered by the veil is typically more protected, while any exposed areas (sometimes just the eye area) receive intense sun exposure. Conversely, women who wear the niqab and remove it during extended indoor periods may experience microenvironment heat under the fabric contributing to melasma via infrared exposure.',
        hormonal: 'The relationship between melasma and combined oral contraceptive pills is well-established. Arab women who discontinue hormonal contraceptives often see some improvement in melasma — this option should be discussed with their GP/gynaecologist.',
      },
      pih: {
        
        acne_context: 'The combination of high-humidity Gulf environments, heavy full-coverage foundation routines (used for both cultural and covering purposes), and high UV exposure creates ideal conditions for acne and resultant PIH.',
        periorbital_darkening: 'Dark under-eye circles are extremely common in Arab communities — both genetically and from the shadow-enhancing effect of deeper-set eyes with prominent brow bones common in Levantine Arab facial structure. Both pigmentary and structural components are usually present.',
      },
      photo_damage: {
        
        tanning_culture: 'Among Arab diaspora and particularly Arab youth in Western countries, tanning culture creates a paradox: cultural pressure for lighter skin at home vs. fashionable tan in Western social contexts. This creates inconsistent SPF use.',
      },
      rosacea: {
        note: 'Rosacea is present in Arab populations, particularly lighter-skinned Levantine communities (Fitzpatrick II-III). Rosacea-induced PIH (red to brown patches post-flare) responds differently to treatment — anti-redness approach needed first (azelaic acid, low-dose antibiotics, gentle skincare) before brightening.',
      },
    },

    traditionalBrighteningPractices: {
      argan_oil: {
        name: 'Argan Oil (Argania spinosa)',
        origin: 'Produced from the argan tree native to Morocco. Exported globally and central to Moroccan women\'s beauty traditions for centuries.',
        active_compounds: 'Oleic acid, linoleic acid, vitamin E (tocopherols), polyphenols, ferulic acid.',
        benefits: 'Deeply moisturising, antioxidant, anti-inflammatory, supports barrier function. Vitamin E and ferulic acid provide UV-damage protection and antioxidant brightening.',
        hyperpigmentation_role: 'Indirect — excellent skin health maintenance. Vitamin E and polyphenols provide antioxidant protection against UV-free radical-driven pigmentation. Some in vitro evidence for anti-melanogenic properties of argan polyphenols.',
        how_to_use: '2–3 drops as a facial oil, pressed in after moisturiser or mixed into moisturiser. Or as a body oil. Also used as a hair serum.',
        caution: 'Pure argan oil is non-comedogenic and suitable for most skin types. Ensure buying 100% pure cold-pressed argan oil — many diluted products are sold.',
      },
      rosewater: {
        name: 'Rosewater (Ma\'oul Ward)',
        origin: 'Used across the Arab world for centuries — rose cultivation and rosewater distillation has been practiced in Syria (Damascus rose), Morocco, Turkey, and Iran since at least the 9th century AD.',
        active_compounds: 'Rose phenolic compounds, geraniol, citronellol, eugenol — mild anti-inflammatory and antioxidant compounds.',
        benefits: 'Toning, anti-inflammatory, antioxidant, pH-balancing, mild astringent.',
        hyperpigmentation_role: 'Anti-inflammatory properties reduce redness and the inflammatory signals that drive PIH. Not a direct brightener but supports skin health.',
        how_to_use: 'As a toner after cleansing. As a facial mist. Mixed with multani mitti or clay for a mask. As a makeup setting spray.',
        quality: 'Distilled rosewater (from steam distillation of rose petals) is authentic — fragrant and clear. Many commercial "rose water" products are just water with synthetic rose fragrance and have none of the active compounds. Look for 100% Rosa damascena hydrosol.',
      },
      kohl_and_oud: {
        name: 'Kohl / Surma (Traditional Eye Lining)',
        note: 'Traditional kohl (surma) in Arab, South Asian, and North African communities is sometimes made from galena (lead sulfide) — a toxic heavy metal. Commercial kohl products from South Asian and Middle Eastern markets often contain lead.',
        hyperpigmentation_connection: 'Not directly a brightening practice, but relevant: lead-containing kohl applied around the eyes can cause grey-black lead deposits in the skin and mucous membranes around the eyes — mistaken for periorbital pigmentation. This is a separate concern from melanin-based dark circles and is a heavy metal toxicity issue, not a cosmetic one.',
        safe_alternative: 'Modern kohl alternatives use carbon black, iron oxides, or other regulated cosmetic pigments. Always check for regulatory compliance and avoid products without ingredient labels.',
      },
      saffron_and_milk: {
        name: 'Saffron Milk (Za\'faran)',
        origin: 'Used across the Arab world, Persian-influenced Gulf states, and extends into the South Asian tradition. Saffron is a prized commodity and its use in beauty is associated with luxury and care.',
        benefits: 'See South Asian saffron section — same active compounds. Anti-inflammatory, antioxidant, mild melanin-modulating effects of crocin.',
        arab_specific_use: 'Saffron is mixed with milk or rosewater for a face mask, or added to bath water. Gulf Arab beauty traditions include full-body skin care with saffron-infused preparations before special events.',
      },
      turmeric_and_chickpea: {
        name: 'Turmeric Chickpea Face Pack',
        origin: 'Used across North African Arab communities — chickpea flour (similar function to Indian besan) mixed with turmeric and rosewater or olive oil.',
        benefits: 'Gentle physical and enzymatic exfoliation from chickpea flour. Anti-inflammatory and mild brightening from turmeric. Moisturising from olive oil.',
        how_to_use: '1 tbsp chickpea flour + 1/4 tsp turmeric + rosewater to paste. Apply 10–15 minutes, rinse. Weekly use.',
      },
      frankincense: {
        name: 'Frankincense (Boswellia / Luban)',
        origin: 'Oman is the world\'s primary producer of frankincense (Boswellia sacra). Used in Omani and Gulf Arab skincare traditions — frankincense resin is burned and the smoke used on skin, or frankincense oil is applied directly.',
        active_compounds: 'Boswellic acids — potent anti-inflammatory compounds. Incensole acetate — neuroprotective and anti-inflammatory. Alpha-pinene and other terpenes.',
        benefits: 'Significant anti-inflammatory properties (boswellic acids inhibit 5-lipoxygenase). Some evidence for cell-regenerating properties.',
        hyperpigmentation_role: 'Reducing skin inflammation reduces PIH formation. Anti-inflammatory action may support faster healing of post-inflammatory spots.',
        how_to_use: 'Frankincense essential oil diluted in carrier oil (2–3% dilution in argan or rosehip oil). Or in commercial frankincense skincare formulations.',
        caution: 'Essential oils must always be diluted before skin application. Undiluted frankincense oil can cause irritation. Patch test. Not to be confused with synthetic fragrance.',
      },
    },

    dangerousIngredients: {
      mercury_and_lighteners_in_arab_markets: {
        
        black_market_products: 'Products smuggled or informally imported from India, Southeast Asia, and Africa sometimes contain mercury or unlabelled steroids. Social media influencers in Arab countries sometimes promote unregulated lightening products.',
        regulatory_landscape: 'GCC (Gulf Cooperation Council) countries have drug and cosmetic regulations, but enforcement is variable. Saudi SFDA (Saudi Food and Drug Authority) and UAE MOH regulations prohibit mercury in cosmetics, but market enforcement is imperfect.',
      },
      heavy_kohl: {
        lead_concern: 'As noted in traditional practices — traditional lead-based kohl applied near eyes. Lead is neurotoxic with no safe threshold. Particularly dangerous for children, pregnant women, and nursing mothers.',
      },
    },

    safeClinicaTreatments: {
      melasma_protocol: [
        {
          ingredient: 'Hydroquinone 4% (prescription) + tretinoin 0.05% + SPF 50+',
          note: 'Classic approach for Arab skin (FP III-IV). Highly effective. Use for 3 months, then transition to maintenance with alpha arbutin + tranexamic acid + SPF.',
          risk: 'Ochronosis risk is lower in Fitzpatrick III than in V-VI but not zero — do not exceed recommended duration.',
        },
        {
          ingredient: 'Tranexamic Acid (oral + topical combination)',
          note: 'Excellent evidence in Arab and Middle Eastern populations. Oral 250mg twice daily for 8–12 weeks + topical 3–5% for maintenance is a well-documented protocol.',
          access: 'Oral requires physician prescription. Topical 3% available from several reputable brands.',
        },
        {
          ingredient: 'Cysteamine 5% (Cyspera)',
          note: 'An amino acid derivative that reduces melanin synthesis. Good evidence in Fitzpatrick III-V skin. More expensive but effective with good tolerability. Rinse-off formulation limits irritation.',
        },
      ],
      pih_protocol: [
        {
          ingredient: 'Niacinamide 10% (AM) + Azelaic Acid 15% (PM)',
          note: 'Well-tolerated combination for PIH in Arab skin. No ochronosis risk, safe for long-term use.',
        },
        {
          ingredient: 'Vitamin C 15–20% (AM) + Niacinamide 10% (AM) + SPF 50 (AM)',
          note: 'Classic morning brightening stack. The old concern about mixing niacinamide and vitamin C (niacin flushing) has been debunked in formulation studies.',
        },
        {
          ingredient: 'Retinol 0.5–1% or Tretinoin 0.025% (PM)',
          note: 'For combination acne + PIH — retinoids address both simultaneously. Start low, apply every other night.',
        },
      ],
      procedures: [
        {
          procedure: 'Chemical Peels (glycolic 20–50%, salicylic, TCA superficial)',
          note: 'Well-tolerated in Arab skin when performed by experienced practitioners. Pre-peel prep with brighteners for 4–6 weeks reduces PIH risk.',
          popular_in: 'Very popular procedure in GCC countries — chemical peels are among the most common dermatological procedures in Gulf dermatology clinics.',
        },
        {
          procedure: 'Fractional CO2 Laser',
          note: 'Used for melasma in Arab skin but with caution — post-treatment PIH is a significant risk. Requires pre-treatment with brighteners, very strict post-procedure SPF compliance.',
          safer_alternative: 'Low-fluence Q-switched Nd:YAG is safer for darker Arab skin (FP IV-V).',
        },
      ],
    },

    spf_guidance: {
      
      cultural_factors: 'In Gulf countries, modest dress provides significant incidental UV protection for women\'s bodies, but faces, hands, and feet may receive high exposure during outdoor activity, commuting, or travel. Men in Gulf countries wear white thobe (highly UV reflective) which offers some natural protection.',
      white_cast_in_arab_skin: 'Arab olive skin (especially Fitzpatrick III-IV) shows white cast from mineral-only sunscreens. Korean and Japanese chemical and hybrid SPFs (with tinosorb formulations) tend to be better cosmetically suited to olive and warm-toned skin.',
      recommended: 'SPF 50 PA++++ with blue light protection (visible light also triggers melasma in darker-toned Arab skin). Tinted SPF that complements olive undertones. Reapply every 2 hours outdoors.',
    },

    culturalContext: {
      beauty_standards: 'Fair skin has been historically valued across much of the Arab world, with historical poetry and literature celebrating "white" skin as a beauty attribute. The Arabic terms "al-bard" (the fair) and "samra" (brown-skinned) carry different aesthetic associations in classical literature and contemporary culture.',
      regional_variation: 'Beauty standards are not uniform — in some North African Amazigh communities, deeper skin tones are traditionally celebrated. Gulf Arab beauty standards have been significantly influenced by Western and Korean beauty trends through social media.',
      social_media_influence: 'Arab beauty influencers with millions of followers across YouTube and Instagram have significant power to shape skin tone narratives. Some promote skin health and natural diversity; others perpetuate lightening norms. Critical media literacy is important.',
      medical_tourism: 'Gulf Arab nationals and Arab diaspora are among the highest users of medical aesthetic treatments globally — skin lightening procedures (laser, IV glutathione) are among the services sought when travelling for medical tourism. The IV glutathione whitening trend in the Philippines and Thailand is partly driven by Arab medical tourism demand.',
      reclaiming_samra: 'A growing trend in Arab social media reclaims the term "samra" (brown-skinned) as beautiful — Arab and North African influencers and artists celebrating their natural skin tones are gaining large followings. The Palestinian artist Fairouz\'s iconic beauty representing darker-skinned Arab women is being revisited.',
    },

    treatmentTimelines: {
      pih: '3–5 months with consistent niacinamide + azelaic acid + SPF 50.',
      melasma: '8–12 weeks with hydroquinone-based or tranexamic acid-based protocol for initial improvement. Lifetime management — recurs with hormonal changes or unprotected UV.',
      sun_damage: '4–6 months with vitamin C + SPF 50.',
      periorbital_pigmentation: '3–6 months topical; some improvement with vitamin C and retinol. Structural component needs injectable treatment.',
    },
  },

  // ── 5. LATINA ──────────────────────────────────────────────────────────────
  'latina': {
    communityId: 'latina',
    communityName: 'Latina / Hispanic',
    skinToneRange: {
      fitzpatrick: 'II–VI — the most phenotypically diverse of all 9 communities in this guide. Hispanic/Latino identity is not a race but an ethnocultural identity encompassing people of any race.',
      description: 'Latina/o/x communities include white Latinas of predominantly European descent (Argentina, Uruguay, parts of Chile), mixed mestizo populations (Mexico, Central America, Colombia, Peru), Afro-Latina communities (Cuba, Dominican Republic, Brazil, Puerto Rico, Colombia\'s Pacific coast), and Indigenous-descended communities across Mesoamerica and South America. This means a Latina patient presenting for hyperpigmentation treatment may be Fitzpatrick II or Fitzpatrick VI — with entirely different treatment approaches required.',
      nuance: 'The hyperpigmentation burden is highest in Afro-Latina and mestiza communities with Fitzpatrick IV-VI skin. Indigenous-heritage communities (Maya, Quechua, Nahua) also present with Fitzpatrick IV-V. European-heritage Latinas may share more with Fitzpatrick II-III European presentations.',
    },

    primaryHyperpigmentationTypes: {
      melasma: {
        
        genetic_factors: 'Some evidence of genetic predisposition to melasma in Latin American populations beyond what would be expected from Fitzpatrick type alone — the mixed genetic heritage may create specific melanocyte reactivity patterns.',
        hormonal_triggers: 'Hormonal contraceptives and pregnancy can both trigger melasma. Pregnancy-induced melasma is colloquially called "el paño" (the cloth/rag) in Spanish — the name reflecting how it appears as a cloth-like dark patch across the face.',
        el_pano: '"El paño" is the Spanish colloquial term for melasma — widely understood across Latin American communities. Understanding this term is important for culturally competent clinical communication.',
      },
      pih: {
        
        afro_latina_specific: 'Afro-Latina patients face the same PIH severity as other individuals with African heritage — intense, long-lasting PIH from inflammatory events. The PIH burden may be compounded by facing colorism from both the Latina community and from anti-Black racism more broadly.',
      },
      sun_damage: {
        
        outdoor_culture: 'Latin American culture features significant outdoor activity — markets, outdoor social gathering, agriculture. UV exposure is cumulative and often unavoidable.',
        historical_spf_gap: 'SPF adoption in Latin America has historically lagged behind European and North American patterns. This is changing with strong social media education from Latina dermatologists, particularly on Instagram.',
      },
      
    },

    traditionalBrighteningPractices: {
      aloe_vera_traditional: {
        name: 'Aloe Vera (Sábila)',
        origin: 'Native to the Arabian Peninsula but naturalised across Latin America for centuries. Called "sábila" in Spanish-speaking Latin America. A household staple plant across Mexico, Cuba, the Dominican Republic, and throughout Central and South America.',
        use: 'Fresh aloe gel from the plant applied directly to dark spots and sun-damaged areas. Also used as a post-sunburn soother, hair conditioner, and general skin moisturiser.',
        
        how_to_use: 'Slice an aloe vera leaf, scoop the clear inner gel, apply to skin as a treatment mask or leave-on serum. Refrigerate unused gel (fresh gel lasts 1 week refrigerated, or freeze in ice cube trays).',
      },
      papaya_enzyme: {
        name: 'Papaya (Papaya / Lechosa)',
        origin: 'Native to southern Mexico and Central America. Used across Latin America as a traditional skin brightener.',
        use: 'Ripe papaya mashed as a brightening mask. Papain enzyme used in commercial exfoliating products. Popular particularly in Mexico, Colombia, and the Caribbean-facing parts of Central America.',
        see: 'See Caribbean section for full papain mechanism and safety notes.',
      },
      avocado: {
        name: 'Avocado (Aguacate)',
        origin: 'Native to Mexico and Central America. A staple in both culinary and traditional beauty practices across the region.',
        active_compounds: 'Oleic acid (deeply moisturising), vitamin E, vitamin K, glutathione (natural antioxidant), lutein.',
        benefits: 'Deeply nourishing and moisturising. Glutathione and vitamin E provide antioxidant skin protection. Vitamin K helps with reducing vascular dark circles.',
        hyperpigmentation_role: 'Indirect — excellent moisturising keeps barrier intact. Antioxidants reduce oxidative stress from UV. Glutathione topically has limited evidence but oral supplementation is being studied for pigmentation.',
        how_to_use: 'Mash ripe avocado as a 15–20 minute face mask. Mix with honey or oatmeal for texture. Rich body butter when mixed with shea and coconut oil.',
        caution: 'High fat content — those with oily or acne-prone skin should use sparingly on face. Excellent for dry or mature skin types.',
      },
      tomato: {
        name: 'Tomato (Tomate / Jitomate)',
        origin: 'Native to the Andes and Mesoamerica — now globally the tomato remains deeply embedded in Mexican and Latin American food and beauty culture.',
        active_compounds: 'Lycopene — a potent antioxidant carotenoid. Vitamin C. Acids (citric, malic) — very mild natural AHAs.',
        benefits: 'Lycopene provides antioxidant protection against UV-free radicals. Vitamin C contributes mild brightening. Natural acids provide very gentle exfoliation.',
        traditional_use: 'Tomato halves rubbed on dark spots, or tomato pulp applied as a face mask — a widespread grandmother\'s remedy across Latin America.',
        
        caution: 'Citric acid in tomatoes is a mild photosensitiser when applied topically — rinse off before sun exposure. The acidic pH of tomato juice (pH ~4) can irritate sensitive skin.',
      },
      royal_jelly: {
        name: 'Royal Jelly and Honey',
        origin: 'Honey has been used in Latin American traditional medicine across Indigenous, Afro-descendant, and mestizo communities. Royal jelly is increasingly popular in beauty traditions influenced by East Asian (particularly Korean) beauty.',
        benefits: 'Honey: humectant, antibacterial, propolis anti-inflammatory. Royal jelly: contains 10-hydroxy-2-decenoic acid (10-HDA) with anti-inflammatory and skin-conditioning properties.',
        hyperpigmentation_role: 'Anti-inflammatory — reducing skin inflammation reduces PIH formation. Some emerging evidence of 10-HDA in royal jelly inhibiting inflammatory mediators that drive melanocyte activation.',
      },
      yerba_mate: {
        name: 'Yerba Mate and Green Tea',
        origin: 'Yerba mate (Ilex paraguariensis) is a South American native plant — national drink of Argentina, Paraguay, Uruguay, and widely consumed in Brazil and Chile.',
        active_compounds: 'Caffeine, polyphenols (chlorogenic acid, quercetin, rutin), theobromine, saponins.',
        benefits: 'High antioxidant content. Caffeine in eye creams reduces vascular dark circles (vasoconstriction). Polyphenols reduce UV-induced oxidative stress.',
        how_to_use: 'Cooled yerba mate tea used as a toner or applied to skin with a cotton pad. Also found in commercial eye creams and toners.',
      },
    },

    dangerousIngredients: {
      latin_american_lightening_market: {
        overview: 'The skin lightening market in Latin America is substantial and has a significant illegal segment. Products from informal markets in Mexico, the Dominican Republic, Colombia, and Brazil have been found to contain mercury, high-potency steroids, and undisclosed hydroquinone at unsafe concentrations.',
        popular_dangerous_products: 'Products like "Crema de Reina," various "blanqueadora" (whitening) creams from informal markets, and unlabelled products sold through social media have been found to contain unsafe ingredients in testing.',
        mercury_in_dominican_community: 'Studies of Dominican and Puerto Rican communities in New York found mercury in skin lightening products purchased from local bodegas and beauty supply stores. Body burden testing in community members showed elevated mercury levels.',
        botched_aesthetic_treatments: 'Unlicensed aesthetic practitioners offering "skin brightening injections" (glutathione IV, high-dose vitamin C IV) are common in Latin American communities — both in-country and in diaspora communities. These carry infection, air embolism, and hypersensitivity reaction risks.',
      },
      citrus_photosensitivity: {
        note: 'The tradition of using lime/lemon juice and tomato on skin, followed by going outdoors in tropical sun, is common across Latin America and causes phytophotodermatitis. Education on the photosensitivity risk of citrus on skin is an important community health message.',
      },
    },

    safeClinicaTreatments: {
      for_fitzpatrick_iii_iv_mestiza: [
        {
          ingredient: 'Vitamin C 15–20% (AM) + SPF 50',
          note: 'Excellent first-line for PIH and sun-induced hyperpigmentation in Fitzpatrick III-IV Latina skin. L-ascorbic acid at pH 2.5–3.5 is most effective. Stabilised with ferulic acid + vitamin E.',
        },
        {
          ingredient: 'Glycolic Acid 8–12% (PM) or Lactic Acid 10% (PM)',
          note: 'AHA chemical exfoliation suitable for Fitzpatrick III-IV. Glycolic at moderate concentrations well-tolerated. Start 2–3x weekly and build.',
        },
        {
          ingredient: 'Tretinoin 0.025–0.05% (PM)',
          note: 'Gold standard for melasma in combination with hydroquinone. Also treats acne and fine lines simultaneously — a triple-function ingredient for common concerns in mestiza skin.',
        },
        {
          ingredient: 'Hydroquinone 4% (prescription, cycled)',
          note: 'For moderate to severe melasma ("el paño"). Use under dermatologist supervision. Maximum 3 months continuous, then switch to maintenance.',
        },
      ],
      for_fitzpatrick_v_vi_afro_latina: [
        {
          ingredient: 'Niacinamide 10% + Azelaic Acid 15%',
          note: 'Safest combination for Afro-Latina skin with PIH. No ochronosis risk, no rebound pigmentation risk.',
        },
        {
          ingredient: 'Tranexamic Acid 3–5% (topical)',
          note: 'Safe across all Fitzpatrick types. Particularly useful for melasma in darker Afro-Latina skin where hydroquinone carries higher ochronosis risk.',
        },
        {
          ingredient: 'Mandelic Acid 5–10%',
          note: 'The AHA of choice for Fitzpatrick V-VI skin — large molecule, slow penetration, lowest PIH-from-exfoliation risk.',
        },
      ],
      universal: [
        {
          ingredient: 'Alpha Arbutin 1–2%',
          note: 'Safe across the full Latina skin tone spectrum. Tyrosinase inhibitor without hydroquinone risks.',
        },
        {
          ingredient: 'SPF 50 PA++++ (non-negotiable across all Fitzpatrick types in Latin American and diaspora settings)',
          note: 'See SPF section.',
        },
      ],
    },

    spf_guidance: {
      importance: 'UV in tropical Latin America is extreme. The UV index in Mexico City, Bogotá (high altitude = less atmospheric UV filtration), Lima, Rio de Janeiro, and San Juan regularly reaches 10–14 (extreme range).',
      
      white_cast_issue: 'White cast from mineral SPF is a concern across medium-to-dark Latina skin tones. Chemical SPF or tinted mineral SPF are more cosmetically appropriate. Korean and Japanese SPF formulations have driven improvement in this area.',
      lifestyle_factors: 'Outdoor markets, agricultural work, sports culture, and beach culture in Latin America all involve high cumulative UV. SPF education in these cultural contexts is more effective than generic messaging.',
    },

    culturalContext: {
      colorism_in_latin_america: 'Latin American colorism ("pigmentocracia") is a direct inheritance of the Spanish and Portuguese colonial caste systems (sistema de castas), which assigned legal status, privileges, and social position partly based on skin colour and European vs. Indigenous vs. African ancestry. While formal caste systems ended with independence, the social hierarchies they created persist.',
      terms_used: '"Morena" (brown-skinned) and "trigueña" (wheat-coloured) are used with sometimes positive, sometimes diminishing connotations depending on context. "Clara" (light) skin is often celebrated. Phrases like "mejorar la raza" (improve the race, i.e., through lighter-skinned partners) reveal the persistence of colorist hierarchy.',
      
      afro_latina_visibility: 'Afro-Latina women are underrepresented in mainstream Latin media, advertising, and beauty standards despite comprising a significant portion of Latin American populations. The Afro-Latina beauty movement — led by creators across the Dominican Republic, Colombia, Cuba, Puerto Rico, and the US — is actively challenging these norms.',
      hyperpigmentation_as_community_issue: 'In communities where dark skin carries social stigma and where hyperpigmentation marks are extremely visible, skin care for PIH and melasma becomes bound up in complex social and psychological dynamics. Dermatologists and estheticians in Latin communities are most effective when they acknowledge these social dimensions explicitly.',
    },

    treatmentTimelines: {
      melasma_el_pano: '3–6 months initial treatment. Hormonal trigger management (consider alternative contraception with doctor) is essential for sustained improvement. Lifetime maintenance with SPF and antioxidants.',
      pih_acne: '3–5 months for moderate PIH in mestiza/Afro-Latina Fitzpatrick IV-VI skin with consistent treatment.',
      sun_damage: '4–8 months with vitamin C + SPF + light exfoliation for diffuse photodamage.',
      realistic_expectation: 'Melasma in particular is a chronic condition — expect cycles of improvement and flare. Consistent SPF is the only "cure" — everything else is management.',
    },
  },

  // ── 6. EAST ASIAN ──────────────────────────────────────────────────────────
  'east-asian': {
    communityId: 'east-asian',
    communityName: 'East Asian',
    skinToneRange: {
      fitzpatrick: 'Predominantly II–IV. Korean and Japanese populations: largely II-III. Chinese populations: II-IV with regional variation (northern China tends lighter; southern/Cantonese tends III-IV). Japanese populations: predominantly II-III. Taiwanese: III-IV. Southeast Asian Chinese: III-IV.',
      description: 'East Asian skin has a distinctive cool to neutral or yellow undertone. The yellow component (golden-beige) is from carotenoids in the skin and from the specific eumelanin distribution in East Asian melanocytes. This undertone affects how hyperpigmentation appears (brown with yellow or grey tint rather than purely brown) and influences which SPF formulations and colour correctors work best.',
      specific_characteristics: 'East Asian skin is often described as having good natural resistance to photodamage due to the photoprotective nature of even moderate melanin levels, and East Asian populations age with less apparent wrinkling than Caucasian populations of the same age (believed related to thicker dermis and higher collagen density). However, the trade-off is higher susceptibility to hyperpigmentation — particularly melasma and sun-induced dark spots.',
    },

    primaryHyperpigmentationTypes: {
      melasma: {
        
        pattern: 'Malar (cheek) pattern is most common in East Asian melasma. Mixed epidermal-dermal melasma is frequent — the dermal component explains why some melasma is resistant to topical treatment.',
        sun_exposure: 'UV-induced melasma is extremely common even in populations with moderate UV exposure (Korea, Japan) — East Asian melanocytes are highly responsive to UV at lower doses than would cause melasma in lighter Caucasian skin.',
      },
      solar_lentigos: {
        what: 'Age spots / liver spots — discrete, flat, well-demarcated brown spots caused by chronic UV exposure. Very common in East Asian skin from the 40s onward, even in individuals who have been careful about sun exposure.',
        why_common: 'East Asian skin tends to develop solar lentigos as a primary form of sun-induced pigmentation, while Caucasian skin more commonly develops diffuse freckling and wrinkling. The discrete lentigo pattern can be easier to treat with targeted procedures (Q-switched laser, cryotherapy for lighter skin).',
      },
      
      seborrheic_melanosis: {
        what: 'A particularly common form of diffuse facial hyperpigmentation seen in East Asian skin — non-discrete, diffuse grayish-brown discolouration across the cheeks and nose, sometimes with a dusty or ashy quality.',
        cause: 'Combination of sun exposure, melanin in the dermis, and aging-related melanocyte clustering.',
        treatment: 'Responds to combination brightening with tranexamic acid, niacinamide, and Q-switched laser. Difficult to treat with topicals alone when dermal component is present.',
      },
      hori_naevus: {
        what: 'Hori\'s naevus (acquired bilateral naevus of Ota-like macules, ABNOMs) — grey-blue pigmented macules on the cheeks, in a distribution similar to melasma but with blue-grey rather than brown colour.',
        
        appearance: 'Discrete or semi-confluent grey-blue to slate-grey macules on the cheekbones. Does NOT respond to topical brighteners — purely dermal melanin.',
        treatment: 'Q-switched 1064nm Nd:YAG or Q-switched 755nm alexandrite laser. Multiple sessions (6–10) required. Excellent response to laser in most cases.',
        misdiagnosis: 'Commonly misdiagnosed as melasma — the distinction matters enormously because topical melasma treatments (hydroquinone, azelaic acid) do not work on Hori\'s naevus, while laser is very effective.',
      },
    },

    traditionalBrighteningPractices: {
      rice_water: {
        name: 'Rice Water (米のとぎ汁 / 淘米水)',
        origin: 'A centuries-old Japanese and East Asian beauty tradition. Women in Japan, from Heian-era court women onward, historically used rice water as a skin toner and hair rinse. Korean women in rice-growing communities are documented as having notably smooth, even-toned skin, attributed to rice water use.',
        active_compounds: 'Inositol (a carbohydrate that penetrates hair and skin to repair damage), ferulic acid (antioxidant), allantoin (soothing, promotes cell regeneration), PABA (paraaminobenzoic acid — a natural UV filter), enzymes and vitamins from the rice bran.',
        how_prepared: 'Traditional: wash rice, soak in water for 30 minutes, strain the milky water. Fermented rice water: allow strained rice water to sit at room temperature for 24–48 hours until slightly sour — fermentation concentrates nutrients.',
        
        commercial: 'SK-II\'s Pitera (Saccharomyces ferment filtrate) is a luxury commercialisation of the fermented rice concept — derived from yeast used in rice wine making.',
        how_to_use: 'Apply fermented rice water as a toner on cotton pad after cleansing. Or use as a final rinse after cleansing (pour over face, do not rinse off). Daily use.',
      },
      kojic_acid: {
        name: 'Kojic Acid (麹酸)',
        origin: 'Derived from Aspergillus oryzae mould used in Japanese sake, miso, and soy sauce fermentation. A Japanese discovery in the 1900s — emerged from observations about sake brewery workers having unusually even-toned hands.',
        mechanism: 'Kojic acid chelates (binds) the copper atom in tyrosinase — inactivating the enzyme and directly reducing melanin production.',
        
        forms: 'Kojic acid soap (popular in East and Southeast Asia), kojic acid serum, kojic acid in combination creams (often combined with niacinamide or glycolic acid).',
        
        how_to_use: 'Cleanser: kojic acid soap used daily as face wash. Serum: kojic acid 1–2% applied to spots, 1–2x daily. Combined with niacinamide and tranexamic acid for enhanced efficacy.',
        caution: 'Kojic acid can cause contact sensitisation (allergic contact dermatitis) in some users, particularly with long-term use. Cycle use — 3 months on, 1 month off. Start at 1% concentration.',
      },
      green_tea: {
        name: 'Green Tea Extract (緑茶)',
        origin: 'Tea (Camellia sinensis) is central to East Asian culture — Chinese, Japanese, and Korean tea traditions date back thousands of years. Green tea\'s use in skincare follows naturally from cultural familiarity.',
        active_compounds: 'EGCG (epigallocatechin gallate) — the primary polyphenol. Catechins, polyphenols, caffeine, amino acids (L-theanine).',
        benefits: 'EGCG is one of the most potent naturally occurring antioxidants. It inhibits UV-induced reactive oxygen species (free radicals) that trigger melanocyte activation. Anti-inflammatory. Some evidence for direct tyrosinase inhibition. Caffeine in green tea provides mild vasoconstriction beneficial for vascular dark circles.',
        
        how_to_use: 'Cooled green tea as a toner (cotton pad application). Green tea extract in serums and moisturisers. Green tea-infused sheet masks (a K-beauty staple).',
        caution: 'Green tea in skincare is generally very safe. Ensure caffeine content is low for acne-prone skin (caffeine is controversial in some acne contexts but generally skin-applied caffeine is safe).',
      },
      sake_and_ferments: {
        name: 'Sake and Fermented Ingredients',
        origin: 'Japanese sake (rice wine) and Korean makgeolli (rice wine) contain fermented components believed to benefit skin. The sake kasu (sake lees, the solids left after sake pressing) have been used in Japanese skincare.',
        active_compounds: 'Kojic acid (produced during fermentation), ferulic acid, enzymes, amino acids, B vitamins, alpha hydroxy acids from fermentation.',
        hyperpigmentation_role: 'Kojic acid produced during fermentation is the primary active. Ferulic acid and other antioxidants provide supporting UV protection.',
        commercial: 'Sake-derived skincare is a significant segment of the J-beauty market. Tatcha, for example, uses sake ferment among other traditional Japanese ingredients.',
      },
      licorice_root: {
        name: 'Licorice Root Extract (甘草 / 감초)',
        origin: 'Used in Traditional Chinese Medicine (TCM) and Korean herbal medicine (hanbang) for thousands of years. Glabridin (the primary active compound) was identified in modern research as the brightening component.',
        active_compounds: 'Glabridin — inhibits UVB-induced pigmentation and tyrosinase activity. Liquiritin — disperses melanin already deposited in skin cells. Glycyrrhizin — anti-inflammatory.',
        
        how_to_use: 'Licorice root extract as a serum ingredient (1–5%). Often found in combination brightening products from Korean (K-beauty) and Japanese brands.',
        caution: 'Licorice root is generally well-tolerated. Rare contact allergy to glycyrrhizin. Distinguish from licorice candy (contains anise as the flavour, not licorice root active compounds).',
      },
      pearl_powder: {
        name: 'Pearl Powder (珍珠粉)',
        origin: 'Used in Traditional Chinese Medicine and beauty for over 2,000 years. Pearl powder is made from freshwater or marine pearls ground into a fine powder.',
        active_compounds: 'Calcium carbonate (primary component — mild physical buffering), conchiolin protein (similar to silk), amino acids, trace minerals.',
        traditional_claims: 'Brightening, anti-aging, skin-smoothing.',
        
        how_to_use: 'Pearl powder mixed with water, rosewater, or serum as a brightening mask. Also found in commercial formulations.',
        caution: 'Source matters — pearls from polluted marine environments may contain heavy metals. Look for certified clean sources.',
      },
    },

    dangerousIngredients: {
      mercury_in_east_asian_markets: {
        
        specific_products: 'Products labeled in Chinese without English ingredient translation, or with vague ingredient listings, from informal sellers have shown mercury contamination in multiple studies.',
        
      },
      hydroquinone_regulation: {
        note: 'Japan and Korea have banned OTC hydroquinone in cosmetics. This has driven innovation in alternative brightening ingredients (kojic acid, tranexamic acid, arbutin) in J-beauty and K-beauty — with global benefit, as many of these alternatives are safer for long-term use than HQ.',
        access: 'In the US and Europe, South Korean or Japanese-origin patients can access hydroquinone by prescription if clinically indicated, but K-beauty education has made many comfortable with HQ alternatives.',
      },
      excessive_whitening_pressure: {
        note: 'The K-beauty and J-beauty industries, while innovative in brightening science, have historically centred extreme skin lightening and "glass skin" as beauty ideals. The cultural pressure to achieve very light, poreless, even skin creates demand for more aggressive interventions and may drive unsafe product use in communities lacking access to clinical-grade safe alternatives.',
      },
    },

    safeClinicaTreatments: {
      k_beauty_evidence_based_stack: [
        {
          ingredient: 'Tranexamic Acid 2–5% (topical)',
          
        },
        {
          ingredient: 'Niacinamide 5–10%',
          note: 'A staple across K-beauty, J-beauty, and C-beauty for melanin transfer inhibition. Safe for daily use. Combines well with virtually all other ingredients.',
        },
        {
          ingredient: 'Alpha Arbutin 1–2%',
          note: 'Dominant in Korean brightening serums. Derived from bearberry plant. Tyrosinase inhibition without HQ risks.',
        },
        {
          ingredient: 'Licorice Root Extract (Glabridin 1–2%)',
          note: 'Strong clinical evidence from Korean and Japanese studies. Disperses existing melanin (via liquiritin) and inhibits new production (via glabridin).',
        },
        {
          ingredient: 'Kojic Acid 1–2%',
          note: 'Japanese beauty staple. Very effective. Use on a cycle (3 months on, 1 month off).',
        },
      ],
      for_hori_naevus: [
        {
          treatment: 'Q-switched Nd:YAG 1064nm Laser',
          note: 'The gold standard for Hori\'s naevus. 6–10 sessions typically required. Very effective — Hori\'s naevus responds better to laser than melasma does. Topical treatments do NOT work for Hori\'s naevus.',
          post_care: 'Strict sun avoidance and SPF 50+ for 4–6 weeks post-laser. Niacinamide to reduce post-laser PIH risk.',
        },
      ],
      for_solar_lentigos: [
        {
          treatment: 'Cryotherapy (for lighter East Asian skin FP II-III)',
          note: 'Targeted freezing of individual lentigos. Very effective for well-demarcated solar lentigos in Fitzpatrick II-III skin. Risk of hypo- or hyperpigmentation in FP IV — use with caution.',
        },
        {
          treatment: 'Q-switched Nd:YAG or Ruby Laser',
          note: 'Very effective for discrete solar lentigos in East Asian skin. 1–3 sessions typically sufficient for individual lesions.',
        },
        {
          treatment: 'Retinol 0.5–1% (PM, long-term)',
          note: 'Fades solar lentigos gradually by accelerating cell turnover. Takes 6–12 months. Prevention of new lentigos with consistent SPF is the most important intervention.',
        },
      ],
    },

    spf_guidance: {
      k_beauty_spf_culture: 'East Asian beauty culture — particularly Korean and Japanese — has one of the strongest SPF cultures globally. Japan developed the PA system (now PA+++/PA++++) for measuring UVA protection. Korean skincare often includes multiple SPF-containing steps. This cultural SPF normalization is one of East Asia\'s most significant contributions to global skincare education.',
      innovation: 'J-beauty and K-beauty have driven global SPF innovation — particularly in developing elegant, cosmetically elegant chemical and hybrid SPFs that do not leave white cast, feel heavy, or pill under makeup. Korean SPF formulations are considered among the world\'s best cosmetically.',
      recommendation: 'SPF 50 PA++++ for active hyperpigmentation treatment. Japanese SPF formulations (Biore UV, Anessa, Allie) and Korean SPF formulations (Beauty of Joseon, Innisfree) offer excellent options. Reapply every 2 hours.',
      blue_light: 'Growing awareness in East Asian dermatology of visible light (blue light from screens and sunlight) triggering melasma in darker East Asian skin. Tinted SPF with iron oxides provides protection against visible light that untinted SPF does not.',
    },

    culturalContext: {
      historical_beauty_ideal: 'Fair skin as a beauty ideal in East Asia predates Western influence — pale skin was historically associated with nobility and indoor life (not having to work outdoors in the sun) in Chinese, Japanese, and Korean court culture. Idioms like the Chinese "一白遮三丑" (fair skin covers three uglies) and similar in Japanese and Korean cultures reflect this deep history.',
      k_beauty_global_influence: 'K-beauty has become a massive global cultural export — Korean skincare concepts (double cleansing, sheet masks, essences, glass skin, emphasis on SPF) have reshaped global skincare. This creates a paradox: K-beauty exports excellent skincare science globally but also exports beauty standards centred on very even, light skin.',
      shifting_standards: 'A growing movement within East Asian entertainment and social media is challenging pale-skin-only beauty standards. Korean actors and idols with natural tan lines, Japanese models with freckles, and Chinese influencers celebrating natural skin tone variation represent a visible counter-movement.',
      diaspora_experience: 'East Asian diaspora communities (Chinese-American, Korean-American, Japanese-American, etc.) navigate colorism both within their communities and from external racism. Anti-Asian racism in Western contexts complicates the relationship with skin tone in ways specific to diaspora experience.',
    },

    treatmentTimelines: {
      melasma: '8–12 weeks for initial improvement with tranexamic acid + niacinamide + SPF 50 PA++++. Long-term management required — melasma recurs with UV exposure.',
      hori_naevus: '6–10 laser sessions over 12–18 months for significant clearance. Results are typically very good.',
      solar_lentigos: '1–3 laser sessions for individual lesions. Prevention-focused (SPF, antioxidants) is most cost-effective.',
      periorbital_hyperpigmentation: '3–6 months topical improvement. Structural component requires filler.',
      general_brightening: '4–8 weeks visible improvement in overall skin radiance with consistent K/J-beauty brightening stack + SPF.',
    },
  },

  // ── 7. EAST AFRICAN ──────────────────────────────────────────────────────
  'east-african': {
    communityId: 'east-african',
    communityName: 'East African',
    skinToneRange: {
      fitzpatrick: 'IV–VI, with some regional III in Ethiopia and Somalia. East African skin tone is distinct from West African — often described as cooler-toned (less yellow warmth, sometimes with blue-black or cool brown depth). Ethiopia and Eritrea: IV-VI with significant diversity. Somalia: V-VI with the distinctive cool-toned Somali skin, often described as blue-black in deeper tones. Kenya, Tanzania, Uganda: V-VI. Rwanda, Burundi: V-VI. Horn of Africa populations (Ethiopian, Eritrean, Somali, Djiboutian) may have genetic lineages that include Cushitic, Nilotic, and Semitic admixture resulting in varied phenotypes.',
      description: 'East African skin is often considered among the most beautiful globally — high melanin density, often with a striking cool or neutral undertone that differs from the warm-toned brown of many West African or South Asian skins. The melanocytes are highly active, making PIH intense and fast, but the baseline richness of the skin tone is a profound beauty asset.',
      somali_specific: 'Somali skin deserves specific mention — the Somali phenotype includes very fine features combined with Fitzpatrick V-VI skin, sometimes with a distinctive blue-black cool tone. PIH in Somali skin can appear particularly dark and develop rapidly. Somali communities in the diaspora (UK, Scandinavia, US) face specific dermatology access challenges.',
    },

    primaryHyperpigmentationTypes: {
      pih: {
        
        severity: 'PIH in East African Fitzpatrick V-VI skin is characteristically intense and long-lasting. Dermal PIH (blue-grey deep pigmentation) is more likely in Fitzpatrick VI.',
        eczema_pih: 'Atopic dermatitis is notably prevalent in East African diaspora populations in Scandinavia and the UK — possibly related to vitamin D deficiency in low-UV environments and allergen exposure differences. Eczema PIH adds a significant layer to the hyperpigmentation burden.',
      },
      melasma: {
        
        compounding_factor: 'East African countries (Kenya, Ethiopia, Tanzania) have high UV year-round. Equatorial UV in Nairobi (at altitude 1,795m) is extremely high — altitude increases UV intensity.',
        
      },
      pseudofolliculitis: {
        note: 'As with West African communities, razor bumps are a significant concern for East African men, particularly Somali and Ethiopian men in the diaspora who adopt Western shaving practices. Treatment is identical to West African section — reducing shaving frequency, alternative hair removal methods, topical retinoids.',
      },
    },

    traditionalBrighteningPractices: {
      frankincense_east_african: {
        name: 'Frankincense / Olibanum (East African variety)',
        
        active_compounds: 'Boswellic acids (alpha- and beta-boswellic acid, AKBA), incensole acetate, terpenoids.',
        benefits: 'Strong anti-inflammatory properties — particularly relevant for reducing PIH formation from inflammatory skin events. Cell-regenerating properties. Wound healing support.',
        traditional_use: 'Frankincense resin chewed (traditional Somali and Ethiopian custom — a health food, not just cosmetic). Frankincense oil used topically on skin. Smoke exposure of skin during traditional beauty rituals (zar ceremonies, etc.) though direct smoke is not recommended from a respiratory standpoint.',
        modern_use: 'Frankincense essential oil diluted in carrier oil. Commercial frankincense skincare products. Boswellic acid extracts in formulations.',
        caution: 'Always dilute essential oils. East African frankincense varieties (B. papyrifera, B. carterii) have slightly different chemical profiles from the more commonly available B. sacra from Oman — all are broadly safe topically when diluted.',
      },
      shea_butter_east: {
        name: 'Shea Butter (East African tradition)',
        note: 'Shea (Vitellaria paradoxa) grows across a belt from West to East Africa — it is used in East Africa though not as central as in West Africa. See West African section for full detail on shea butter properties.',
        east_african_context: 'In Uganda and Tanzania, shea butter is used similarly to West African traditions — as a deep moisturiser and skin protectant. In Ethiopia and Somalia, animal fats (ghee — clarified butter) have been historically used as skin moisturisers, particularly in pastoral communities.',
      },
      ghee_and_butter: {
        name: 'Ghee (Clarified Butter) / Animal Fat Moisturisers',
        origin: 'Used across Ethiopia, Eritrea, Somalia, and East Africa as traditional skin and hair moisturisers. Ethiopian traditional hairstyle maintenance involves ghee application to scalp and hair.',
        benefits: 'Rich in saturated fatty acids (butyric, palmitic, stearic, oleic), vitamin A and E, conjugated linoleic acid (CLA) with anti-inflammatory properties.',
        hyperpigmentation_role: 'Indirect — occlusive moisturising supports barrier integrity. Vitamin A (as retinyl esters in ghee) provides very mild cell turnover support. Anti-inflammatory CLA may reduce PIH formation.',
        caution: 'Comedogenic potential — not recommended for acne-prone facial skin. Good for body and hair use. For facial hyperpigmentation, clinical ingredients are more appropriate than ghee.',
      },
      coffee_and_honey: {
        name: 'Coffee Scrub and Honey',
        origin: 'Ethiopia is the birthplace of coffee (Coffea arabica). The Ethiopian coffee ceremony is a cultural cornerstone. Coffee grounds used as a skin scrub are a traditional practice.',
        benefits: 'Coffee grounds: physical exfoliation. Caffeine: antioxidant, mild vasoconstriction (useful for dark circles and puffiness). Honey: antimicrobial, humectant, anti-inflammatory propolis.',
        hyperpigmentation_role: 'Physical exfoliation removes pigmented surface cells, temporarily brightening skin. Caffeine antioxidant properties reduce UV-free radical damage.',
        caution: 'Coffee grounds are abrasive — physical scrubs should be used very gently on hyperpigmented skin. Friction is an inflammation trigger that can worsen PIH. Use fine-ground coffee or avoid physical scrubs entirely on areas of active PIH. Opt for chemical exfoliation (mandelic acid, lactic acid) instead for PIH treatment.',
      },
      moringa: {
        name: 'Moringa (Moringa oleifera)',
        origin: 'Native to South Asia but widely cultivated across East Africa (Kenya, Tanzania, Ethiopia, Somalia). Called "the miracle tree" for its nutritional density. Used across East Africa in traditional medicine and increasingly in skincare.',
        active_compounds: 'Oleic acid (in moringa seed oil, also called ben oil), vitamins A and C, quercetin, kaempferol, zeatin (a cytokinin that may have cell-renewal properties), glucosinolates.',
        benefits: 'Moringa seed oil (ben oil) is a stable, non-greasy carrier oil with excellent moisturising properties. Very high oleic acid content. Antioxidant vitamins and polyphenols support skin health.',
        hyperpigmentation_role: 'Vitamin C and antioxidants reduce oxidative pigmentation triggers. The anti-inflammatory isothiocyanates in moringa may reduce melanocyte activation. Some emerging evidence for moringa extract reducing melanin synthesis in cell culture.',
        how_to_use: 'Moringa seed oil as a facial oil (2–3 drops, pressed in before moisturiser). Moringa powder mixed with honey or yoghurt as a nutrient-dense face mask. Moringa seed oil in commercial skincare formulations.',
      },
    },

    dangerousIngredients: {
      mercury_crisis: {
        severity: 'CRITICAL — East Africa faces a serious public health problem with mercury-containing skin lightening products.',
        
        specific_countries: 'Kenya and Tanzania have had regulatory actions against mercury-containing cosmetics. Somalia has limited regulatory infrastructure — mercury products flow freely in Somali markets both locally and in diaspora communities (UK, Scandinavia, US, Canada).',
        diaspora_risk: 'East African diaspora communities — particularly Somali communities in the UK, Sweden, Norway, Finland, US, and Canada — maintain strong community trade networks. Products purchased in community shops or brought back from visits may contain mercury. Healthcare workers in Somali diaspora communities have documented unexpectedly high mercury body burden in women presenting for unrelated health concerns.',
        products_to_avoid: 'Any cream with no English ingredient list, or with ingredient lists that include "calomel," "mercurous chloride," "amide mercury," "mercury," or no list at all. Community-sourced creams with promise of fast lightening. Injectable "brightening" treatments.',
      },
      vitamin_d_deficiency_intersection: {
        note: 'East African diaspora communities in low-UV environments (Scandinavia, UK, Canada) face a specific challenge: very dark skin (high melanin) in a low-UV environment means minimal vitamin D synthesis, even in summer. Vitamin D deficiency is documented in East African diaspora at very high rates. This intersects with skin health — low vitamin D affects immune function and can worsen inflammatory skin conditions that drive PIH. Supplementation is strongly recommended (consult doctor for appropriate dose — typically 2,000–4,000 IU daily for very dark-skinned individuals in low-UV environments).',
      },
    },

    safeClinicaTreatments: {
      priority_given_melanin_density: [
        {
          ingredient: 'Niacinamide 10%',
          note: 'First-line for all PIH in East African Fitzpatrick V-VI skin. Safe, effective, and tolerated by the most sensitive and reactive dark skin.',
        },
        {
          ingredient: 'Azelaic Acid 15–20%',
          note: 'Excellent choice — tyrosinase inhibitor with significant anti-inflammatory action that addresses both the pigmentation and the inflammatory trigger. Very safe in deep skin.',
        },
        {
          ingredient: 'Tranexamic Acid 3–5% topical',
          note: 'Growing evidence in Sub-Saharan African populations. Very safe across all Fitzpatrick types.',
        },
        {
          ingredient: 'Mandelic Acid 5–10% (PM, 2–3x weekly)',
          note: 'The AHA of choice for Fitzpatrick V-VI East African skin — slow-penetrating, low rebound pigmentation risk. Start very slowly (once weekly) and build.',
        },
      ],
      what_to_avoid_in_east_african_skin: [
        'High-concentration glycolic acid (>10%) without significant experience and dermatologist supervision — rebound PIH risk.',
        'Aggressive chemical peels (medium-deep TCA) without melanin-suppressive pre-treatment.',
        'IPL (Intense Pulsed Light) — not safe for Fitzpatrick V-VI. Burns and severe PIH are well-documented complications.',
        'High-potency retinoids started at full strength — begin at 0.025% or retinol 0.3% and build very slowly.',
      ],
      clinical_procedures_safe: [
        {
          procedure: 'Q-switched Nd:YAG 1064nm Laser (low-fluence protocol)',
          note: 'Safe for East African Fitzpatrick V-VI when performed by an experienced practitioner. 1064nm wavelength is safest for darkest skin. Multiple sessions, spaced 4–6 weeks apart. Strict post-procedure SPF and brightening maintenance.',
        },
        {
          procedure: 'Chemical Peels (mandelic, lactic, low-concentration salicylic)',
          note: 'Superficial peels with appropriate acids. Pre-peel preparation 6 weeks minimum. Post-peel strict sun avoidance.',
        },
      ],
    },

    spf_guidance: {
      
      diaspora_uv_complication: 'East African diaspora in Scandinavia and northern UK experience very low UV environments — the vitamin D deficiency risk is high, but sun-seeking behaviour in these communities may create unprotected intense UV exposure during rare sunny periods, triggering PIH and melasma in susceptible skin.',
      white_cast_solutions: 'As with West African skin, white cast from mineral SPF is a significant barrier to compliance in East African and diaspora communities. Solutions: tinted mineral SPF (matching deep skin tones), chemical SPF, hybrid formulas.',
    },

    culturalContext: {
      colorism_origins: 'Colorism in East Africa has complex roots — some communities (particularly in Ethiopia and Eritrea) have their own internal hierarchies around skin tone that may predate but were certainly intensified by European colonialism. Ethiopian historical court aesthetics valued certain phenotypes over others.',
      somali_community_specifics: 'In Somali culture, fair or lighter skin ("cad" — literally "white/light") has been historically associated with beauty in some contexts. Somali communities in the diaspora are particularly affected by the convergence of internal colorism, anti-Black racism in Western contexts, and targeted marketing of mercury-containing bleaching products.',
      eritrean_and_ethiopian_diversity: 'Ethiopia is one of the most ethnically diverse countries on earth — 80+ ethnic groups with significant phenotypic variation. Internal colorism between communities and within communities exists but is not uniform. Awareness campaigns from the Ethiopian diaspora medical community about mercury dangers have increased.',
      reclaiming_skin: 'East African diaspora artists, models, and influencers — particularly those active on Instagram and TikTok — are among the most visible advocates for celebrating deep, rich skin tones globally. Sudanese model Alek Wek was an early global example. A generation of East African-heritage creators has followed.',
    },

    treatmentTimelines: {
      pih: '3–6 months for moderate PIH with niacinamide + azelaic acid + SPF 50. Severe PIH may take 9–12 months.',
      melasma: '3–6 months for initial improvement; chronic management required.',
      eczema_pih: '4–8 months — must control eczema before PIH can resolve.',
      dermal_pih: '12–24+ months; laser intervention accelerates resolution.',
    },
  },

  // ── 8. SOUTH AFRICAN ───────────────────────────────────────────────────────
  'south-african': {
    communityId: 'south-african',
    communityName: 'South African',
    skinToneRange: {
      fitzpatrick: 'I–VI — the most diverse range of any national community in this guide. South Africa has a complex demographic composition: Black South Africans (Zulu, Xhosa, Sotho, Tswana, Venda, Tsonga, Ndebele, Pedi — predominantly FP V-VI); Coloured South Africans (mixed Cape Malay, Khoikhoi, Griqua, and multiple other heritage — FP III-V); Indian South Africans (predominantly FP III-IV, descendants of indentured workers from India); White South Africans of Dutch (Afrikaner) and British descent (FP I-III). Each population group has different hyperpigmentation risk profiles and different cultural relationships with skin tone.',
      description: 'South Africa\'s skin tone diversity reflects its political history as much as its geography. Apartheid formally categorised the population into racial groups — and those classifications still influence where people live, what health services they access, and what beauty standards they have been exposed to. Treating hyperpigmentation in South African communities requires awareness of this context.',
      cape_coloured_specific: 'The Coloured (mixed heritage) community of the Western Cape has a distinctive genetic profile that can include Khoikhoi/San, Malay, Black African, White, and Indian admixture. Skin tones and phototypes vary widely within the community, and melanocyte behaviour may not predict neatly from phenotype alone.',
    },

    primaryHyperpigmentationTypes: {
      pih: {
        
        apartheid_healthcare_legacy: 'Apartheid left deep inequities in healthcare access that persist today — Black South Africans have less access to dermatology care, less representation in clinical research, and have historically been sold unsafe bleaching products in township pharmacies and spaza shops.',
      },
      melasma: {
        
        triggers: 'High UV exposure in South Africa (Johannesburg UV Index commonly 10–12 in summer), hormonal contraceptive use, pregnancy.',
        gauteng_altitude: 'Johannesburg and Pretoria are high-altitude cities (1,700m+) — UV exposure is significantly higher than the UV index might suggest to residents used to coastal UV references.',
      },
      photo_damage: {
        
        sun_seeking_culture: 'South African culture involves significant outdoor activity — braai (barbecue) culture, outdoor sports, beach culture. This creates high cumulative UV for all populations.',
      },
    },

    traditionalBrighteningPractices: {
      rooibos: {
        name: 'Rooibos (Aspalathus linearis)',
        origin: 'Indigenous to the Cederberg region of the Western Cape, South Africa. Used by the Khoikhoi people for centuries as a beverage and medicinal plant. Now a major South African export and increasingly present in cosmetic formulations globally.',
        active_compounds: 'Aspalathin and nothofagin — unique dihydrochalcone antioxidants. Quercetin, luteolin, rutin — flavonoids. Phenylpyruvic acid-2-O-glucoside. Zinc, manganese, and other minerals.',
        benefits: 'Very high antioxidant activity — among the highest of any commonly used plant. Anti-inflammatory properties (particularly aspalathin). Zinc content has mild anti-acne properties.',
        hyperpigmentation_role: 'Antioxidants quench UV-induced free radicals that trigger melanocyte activation. Quercetin has some evidence for tyrosinase inhibition. Anti-inflammatory properties reduce PIH formation from inflammatory events.',
        
        how_to_use: 'Brewed rooibos tea (cooled) as a skin toner applied with a cotton pad. Rooibos extract in commercial skincare formulations — the South African skincare industry (Faithful to Nature, Carmien, Dr. Hauschka South Africa, Esse) features rooibos prominently.',
        caution: 'Rooibos is extremely safe topically. Some tannin content may have mild astringent effect on sensitive skin. Generally well-tolerated.',
      },
      buchu: {
        name: 'Buchu (Agathosma betulina / A. crenulata)',
        origin: 'Another Western Cape indigenous plant. Used by Khoikhoi and later Cape Dutch communities as an antiseptic, anti-inflammatory, and general health tonic.',
        active_compounds: 'Diosphenol (bactericidal), quercetin, isomenthone, limonene, and other terpenoids.',
        benefits: 'Antibacterial, anti-inflammatory, diuretic (internally). Topically: anti-inflammatory and antimicrobial properties.',
        hyperpigmentation_role: 'Anti-inflammatory action reduces PIH triggers from inflammatory skin conditions. Limited direct brightening data.',
        forms: 'Buchu essential oil (diluted), buchu extract in skincare formulations, buchu-infused oil.',
        caution: 'Buchu essential oil must be diluted before skin application. Some individuals experience sensitivity. Avoid during pregnancy (traditionally used as a reproductive herb).',
      },
      marula_oil: {
        name: 'Marula Oil (Sclerocarya birrea)',
        origin: 'From the marula tree native to southern Africa (South Africa, Swaziland/eSwatini, Botswana, Zimbabwe). The marula fruit is famous — elephants in the wild eat fermented fallen marula fruit. The oil is cold-pressed from the marula nut kernel.',
        active_compounds: 'Oleic acid (the main fatty acid), linoleic acid, palmitic acid, vitamin C, tocopherols (vitamin E), procyanidins (potent antioxidants).',
        benefits: 'Extremely stable due to very high oleic acid content. Deeply moisturising. Absorbs quickly without greasy residue (despite being oil-rich). Non-comedogenic or low-comedogenic. Very high antioxidant content from procyanidins and vitamin C.',
        
        how_to_use: '2–3 drops pressed into face as a final layer or mixed with moisturiser. Excellent as a body oil. South African skincare brand Africology has used marula prominently.',
        commercial: 'Marula oil has had a global moment — Drunk Elephant, Africology, and multiple others have featured it. Ensure sourcing is from South African sustainable marula producers to support local communities.',
      },
      aloe_ferox: {
        name: 'Aloe Ferox (Cape Aloe)',
        origin: 'Aloe ferox (Cape aloe) is a South African native — distinct from Aloe vera (native to Arabia/North Africa) though related. Grows wild in the Eastern and Western Cape. Used by Khoikhoi, Xhosa, and other indigenous Southern African peoples for skin and health.',
        
        benefits: 'Higher aloesin content than A. vera — potentially more direct tyrosinase inhibition. Strong anti-inflammatory and wound-healing properties.',
        how_to_use: 'A. ferox gel (from the leaf) or A. ferox extract in commercial South African skincare formulations.',
        commercial: 'Aloe Ferox skincare is a growing South African industry. Companies like the Aloe Ferox range, Esse Organic Skincare, and several Western Cape-based brands use A. ferox as a hero ingredient.',
      },
    },

    dangerousIngredients: {
      bleaching_in_south_african_townships: {
        
        historical_context: 'Apartheid-era hierarchies assigned lighter skin different legal status in some contexts. Post-apartheid, the psychological impact of these hierarchies on skin tone attitudes persists. Skin bleaching in South African township communities is partly a legacy of apartheid-era colorism.',
        regulatory_landscape: 'SAHPRA (South African Health Products Regulatory Authority) has regulations against mercury in cosmetics and regulates hydroquinone as a prescription ingredient above 2%. However, enforcement in informal markets is limited.',
        specific_products: '"Skin Light" cream, "Ponds" modified formulations, and various township-available creams have been flagged in South African public health studies. Some products sold at hair salons and shebeens have no ingredient labelling.',
      },
      indian_south_african_fairness_products: {
        note: 'Indian South African communities — particularly in KwaZulu-Natal — share the South Asian fairness product market. Concerns about mercury and steroid content in imported South Asian brightening creams apply here as well. See South Asian section for specific product warnings.',
      },
    },

    safeClinicaTreatments: {
      for_black_south_african_fitz_v_vi: [
        {
          ingredient: 'Niacinamide 10% (AM + PM)',
          note: 'Safe first-line for all Black South African skin types. Well-tolerated, no ochronosis risk.',
        },
        {
          ingredient: 'Azelaic Acid 15% (PM)',
          note: 'Excellent for PIH from acne — one of the safest brightening actives for FP V-VI.',
        },
        {
          ingredient: 'Tranexamic Acid 3% (AM)',
          note: 'Growing evidence for Sub-Saharan African populations. Particularly useful for melasma.',
        },
        {
          ingredient: 'Rooibos extract formulations',
          note: 'Locally sourced, anti-inflammatory, antioxidant support. A culturally resonant and effective skin health ingredient. South African brands offer rooibos-based brightening products at various price points.',
        },
      ],
      for_coloured_south_african_fitz_iii_v: [
        {
          ingredient: 'Vitamin C 15% (AM) + Niacinamide 10% (AM)',
          note: 'Effective combination for the FP III-IV range. The warm-toned mixed heritage skin often responds well to antioxidant brightening.',
        },
        {
          ingredient: 'Retinoid 0.025–0.05% tretinoin (PM)',
          note: 'For acne + PIH combination — very common presentation. Introduce slowly.',
        },
        {
          ingredient: 'Glycolic Acid 8–10% (PM, 2–3x weekly)',
          note: 'More suitable for FP III-IV than V-VI. Monitor for irritation and rebound pigmentation in FP IV-V individuals.',
        },
      ],
      for_indian_south_african: [
        {
          note: 'Refer to South Asian section — Indian South African skin behaves similarly to South Asian Indian skin in most respects.',
        },
        {
          ingredient: 'Tranexamic Acid (oral + topical)',
          note: 'Excellent for melasma — particularly relevant given high hormonal contraceptive use in young Indian South African women.',
        },
      ],
      procedures: [
        {
          procedure: 'Chemical peels available at South African dermatology clinics',
          note: 'Mandelic and lactic acid peels widely available and appropriate for diverse SA skin tones. Glycolic peels for lighter SA skin. Strict pre- and post-peel brightening protocol essential.',
        },
        {
          procedure: 'Q-switched Nd:YAG laser',
          note: 'Available in Johannesburg, Cape Town, and Durban dermatology centres. Appropriate for Black South African FP V-VI skin for dermal PIH and stubborn epidermal PIH.',
        },
      ],
    },

    spf_guidance: {
      uv_in_south_africa: 'South Africa has a UV climate — Johannesburg summer UV index commonly reaches 12 (extreme). UV penetrates through South Africa\'s high-altitude clean air with high intensity. Cape Town summer UV reaches 8–10. SPF 50+ is appropriate for all South African residents regardless of skin tone.',
      historical_gap: 'SPF culture has historically been strongest in the White South African community (driven by very high skin cancer rates) and less established in Black and Coloured communities. This is changing with social media education from South African dermatologists and beauty influencers.',
      affordable_access: 'In South Africa, access to quality SPF is a real economic barrier — Neutrogena, La Roche-Posay, and Vichy SPFs command premium prices relative to average incomes. Affordable SPF options (Nivea Sun, Garnier Ambre Solaire, local generic brands) need to be promoted actively in dermatology education.',
    },

    culturalContext: {
      apartheid_legacy: 'The apartheid classification system assigned social position partly based on skin colour — creating unique psychological wounds around skin tone in South Africa that persist into the post-apartheid generation. The ongoing inequality between racial groups in South Africa means skin tone remains entangled with economic and social opportunity in very direct ways.',
      ubuntu_and_skin_pride: 'Ubuntu philosophy ("I am because we are") and the Black Consciousness Movement in South Africa have created strong traditions of Black pride and solidarity that challenge colorism. The "Black is Beautiful" current runs through South African cultural politics since the anti-apartheid movement.',
      coloured_identity: 'The Coloured community in South Africa has a complex and contested relationship with identity and skin tone — facing discrimination from both White and Black communities under apartheid, and navigating post-apartheid identity politics. Colorism within the Coloured community (lighter skin preference) reflects this historical positioning.',
      contemporary_shifts: 'Social media has amplified South African skin pride voices — Black South African beauty influencers, models (Candice Swanepoel aside, Black South African models have gained global visibility), and skin health educators are reshaping narratives about South African beauty.',
    },

    treatmentTimelines: {
      pih_black_sa: '3–6 months with consistent niacinamide + azelaic acid + SPF 50 for moderate PIH.',
      pih_coloured_sa: '3–5 months for FP III-IV skin with vitamin C + niacinamide + SPF 50.',
      melasma: '3–6 months for initial response; chronic management.',
      sun_damage: '4–8 months with active antioxidant treatment + consistent SPF.',
    },
  },

  // ── 9. BLACK AMERICAN ──────────────────────────────────────────────────────
  'black-american': {
    communityId: 'black-american',
    communityName: 'Black American / African American',
    skinToneRange: {
      fitzpatrick: 'IV–VI predominantly, with some III in lighter-skinned Black Americans. Black Americans represent the descendants of enslaved Africans (predominantly from West, Central, and West-Central Africa — present-day Nigeria, Ghana, Senegal, Côte d\'Ivoire, Cameroon, Democratic Republic of Congo, Angola), mixed with European, Indigenous American, and other heritage to varying degrees.',
      description: 'Black American skin tones span from warm light brown (caramel, "honey") to rich medium brown to deep brown, chocolate, and blue-black. The genetic heritage from multiple West and Central African ethnic groups means melanocyte biology varies across the community. A light-skinned Black American may be Fitzpatrick III but have high melanocyte reactivity from African genetic background — PIH severity does not always predict perfectly from phenotype.',
      generational_diversity: 'Intraracial skin tone diversity in the Black American community is vast — a single family may include individuals spanning Fitzpatrick III to VI. This internal diversity is celebrated in the "Shades of Brown" framing that has become increasingly prominent in Black American cultural discourse.',
    },

    primaryHyperpigmentationTypes: {
      pih: {
        
        primary_triggers: ['Acne (most common)', 'Pseudofolliculitis barbae (razor bumps) in Black men', 'Eczema/atopic dermatitis', 'Ingrown hairs from shaving and hair removal', 'Keloid formation', 'Lichen planus pigmentosus', 'Friction from clothing (bra straps, waistbands)', 'Scratching and skin picking'],
        emotional_impact: 'Research has documented that PIH significantly affects quality of life for Black Americans — often more so than the original acne or inflammatory condition. PIH can affect self-esteem, social engagement, and mental health. The psychological burden of PIH is disproportionate to its medical severity because of how visible it is and how long it persists.',
      },
      pseudofolliculitis_barbae: {
        
        stigma: 'PFB and its associated PIH and scarring can be misread as untidy by employers or social contexts unfamiliar with the condition — creating workplace discrimination concerns for Black men.',
        treatment_access: 'Black men are significantly underrepresented in dermatology settings — combination of systemic healthcare access barriers, discomfort with seeking medical care for "cosmetic" concerns, and historical medical racism affecting trust in healthcare institutions.',
      },
      dermatosis_papulosa_nigra: {
        
        appearance: 'Small, raised, smooth papules, 1–5mm. Not malignant. Often darker than surrounding skin. Frequently mistaken for warts or moles.',
        treatment: 'Can be removed by electrodessication, cryotherapy, or laser. Cosmetically bothersome for many patients. Risk of post-treatment hypopigmentation or hyperpigmentation — requires experienced dermatologist.',
        note: 'Often presents alongside PIH in clinical settings — important to distinguish the two as they require different approaches.',
      },
      keloid_scarring: {
        
        hyperpigmentation_connection: 'Keloids themselves are often darker (hyperpigmented) than surrounding skin. The fear of keloid formation makes some Black Americans reluctant to have procedures, even beneficial ones.',
        treatment: 'Keloid management: intralesional corticosteroid injections, silicone sheets, pressure therapy, 5-fluorouracil injection, laser, combination approaches. NOT the same as PIH treatment.',
      },
      lichen_planus_pigmentosus: {
        what: 'A type of dermal hyperpigmentation — brown-grey to blue-grey patches in areas of chronic inflammation or friction. Common in darker skin types including Black Americans.',
        appearance: 'Diffuse, poorly demarcated grey-brown patches, often in skin folds, on the face, or where clothing friction occurs.',
        treatment: 'Difficult to treat — topical tacrolimus, dapsone, low-strength corticosteroids for the inflammatory component. Tranexamic acid and niacinamide for the pigmentary component. Time.',
      },
    },

    traditionalBrighteningPractices: {
      shea_butter_black_american: {
        name: 'Shea Butter',
        origin: 'As with West African communities, shea butter has been central to Black American skincare for generations — often brought over through family traditions and reinforced through the natural hair and Black beauty movement of the 1970s and its contemporary revival.',
        use: 'Raw and whipped shea butter are sold extensively in Black-owned beauty supply stores and large retailers. Used as a face and body moisturiser, a hair sealant, and a general skin treatment.',
        see: 'See West African section for full detail on properties and evidence.',
        black_american_context: 'The Black natural beauty movement — from the 1970s Black Power era through the contemporary natural hair movement — has strongly promoted shea butter and other African-derived ingredients as an assertion of cultural identity and rejection of Eurocentric beauty standards.',
      },
      black_soap: {
        name: 'African Black Soap',
        origin: 'Used in Black American households through West African cultural connections. A staple in Black hair care and skincare — sold in community beauty supply stores for decades before "mainstream" discovery.',
        see: 'See West African section for full detail.',
        black_american_adoption: 'African black soap has become mainstream in the US partly through its adoption by the Black natural beauty community. The ingredient has been commercialised by brands ranging from SheaMoisture (a Black-founded brand) to major retailers.',
      },
      vitamin_e_oil: {
        name: 'Vitamin E Oil',
        origin: 'A longstanding tradition in Black American households — vitamin E oil (often purchased as small capsules or in bottles) applied directly to dark spots and scars.',
        active_compounds: 'Tocopherols and tocotrienols — fat-soluble antioxidants.',
        benefits: 'Antioxidant protection, moisturising, some evidence for anti-inflammatory properties.',
        hyperpigmentation_role: 'Limited direct brightening action. Antioxidant properties may help prevent UV-induced pigmentation formation. Moisturising reduces inflammation that contributes to PIH.',
        evidence_reality: 'The evidence for vitamin E alone fading dark spots is limited in clinical literature. However, vitamin E combined with vitamin C has strong synergistic antioxidant evidence. The tradition persists partly from cultural memory and the genuine moisturising and barrier-supporting benefits.',
        how_to_use: 'Vitamin E oil mixed into moisturiser, or vitamin E capsule pierced and applied to specific dark spots. Better: look for formulations combining vitamin E with vitamin C (ascorbic acid + tocopherol) for synergistic brightening.',
      },
      castor_oil: {
        name: 'Castor Oil (Jamaican Black Castor Oil)',
        origin: 'Castor oil (Ricinus communis) has been used in Black American and Caribbean communities for skin and hair. Jamaican Black Castor Oil (JBCO) — made from roasted castor beans, giving it a darker colour and ash content — has become particularly prominent in the natural hair community.',
        
        hyperpigmentation_role: 'Indirect — occlusive moisturising. Limited direct brightening action. Used in some households on dark spots based on cultural tradition more than clinical evidence.',
        how_to_use: 'Body and hair applications. Too thick for standalone facial use — mix 1 part castor oil with 3 parts lighter carrier oil (jojoba, argan, rosehip) for facial application.',
      },
      cocoa_butter: {
        name: 'Cocoa Butter (Palmer\'s Cocoa Butter Formula)',
        origin: 'Palmer\'s Cocoa Butter Formula is a multigenerational staple in Black American households — virtually ubiquitous. A cultural touchstone that many Black Americans associate with family, home, and skin care from childhood.',
        active_compounds: 'Stearic acid, palmitic acid, oleic acid, and cocoa polyphenols.',
        benefits: 'Excellent moisturiser. Polyphenols provide some antioxidant activity. Vitamin E in the formulation supports skin health.',
        hyperpigmentation_role: 'Moisturising and barrier support reduces PIH formation. The cultural significance of the ritual of using cocoa butter — the connection to family, self-care, and Black community — is a real and legitimate part of skincare beyond the ingredient science.',
        clinical_reality: 'Does not directly brighten PIH. But maintaining a well-moisturised, healthy skin barrier is genuinely good skincare — and consistent use as a cultural practice is a wellness behaviour that supports skin health.',
        caution: 'Cocoa butter is comedogenic for some individuals — particularly on acne-prone face skin. Best used on body and neck rather than on active acne-prone facial skin.',
      },
    },

    dangerousIngredients: {
      mercury_in_diaspora_shops: {
        note: 'Mercury-containing skin lightening products are found in Black American communities through connections to Caribbean, West African, and Latin American markets. New York City Department of Health investigations have found mercury in products sold in Harlem and Brooklyn beauty supply stores targeting Black communities.',
        community_education: 'Education about mercury is an active public health campaign in New York City, Chicago, Miami, Houston, and other cities with large Black communities. Black dermatologists and public health advocates (including through social media) have significantly increased awareness.',
      },
      harmful_steroid_use: {
        note: 'High-potency steroid creams (clobetasol) sometimes used inappropriately on face for skin conditions — either self-prescribed or prescribed without adequate guidance. Can cause steroid-induced perioral dermatitis, skin thinning, and rebound hyperpigmentation when stopped.',
        context: 'Black Americans with eczema may use prescription-strength steroids appropriately for the body but misapply them to the face, or use them far longer than recommended. Dermatologist guidance is important.',
      },
      bleaching_culture: {
        note: 'While "skin bleaching" for the purpose of changing skin tone is less openly normalised in Black American culture than in some other communities (partly due to the influence of Black Power and Black Is Beautiful movements), it exists, particularly among certain communities. Social media advertising of unregulated lightening products from Instagram and TikTok reaches Black American consumers.',
      },
    },

    safeClinicaTreatments: {
      evidence_based_for_black_american_skin: [
        {
          ingredient: 'Niacinamide 10% (AM and/or PM)',
          note: 'Most used and most consistently recommended by Black dermatologists for PIH. Safe for all Fitzpatrick IV-VI skin. No ochronosis risk. Combines well with all other ingredients.',
        },
        {
          ingredient: 'Azelaic Acid 15–20% (AM or PM)',
          note: 'Prescribed frequently by Black dermatologists for PIH — dual action on inflammation and pigmentation. Effective for post-acne PIH.',
        },
        {
          ingredient: 'Tranexamic Acid 3–5% (topical, PM)',
          note: 'Growing evidence in Black American skin. Effective for both PIH and melasma. Very safe. Can be used long-term without cycling.',
        },
        {
          ingredient: 'Vitamin C 15–20% (AM)',
          note: 'Black American dermatologists commonly recommend vitamin C as part of a morning routine for PIH. Must be formulated with ferulic acid + vitamin E for stability. Check freshness.',
        },
        {
          ingredient: 'Retinoids (adapalene 0.1–0.3%, tretinoin 0.025%) (PM)',
          note: 'For acne + PIH simultaneously — dual-purpose active. Start very low, introduce every other night. Dr. Crystal Aguh, Dr. Andrew Alexis, Dr. Valerie Callender, and other prominent Black dermatologists consistently advocate for retinoid use in PIH management.',
        },
        {
          ingredient: 'Alpha Arbutin 1–2%',
          note: 'Safe, effective tyrosinase inhibitor. No ochronosis risk. Good long-term option.',
        },
        {
          ingredient: 'Hydroquinone 4% (prescription, cycled 3 months max)',
          note: 'Remains effective for severe PIH when used correctly. Ochronosis risk with overuse — particularly at >4% concentrations or >3–4 months continuous use.',
        },
      ],
      what_not_to_use: [
        'Mercury-containing lightening creams (see above).',
        'High-strength glycolic acid (>15%) without proper preparation — rebound PIH risk.',
        'IPL for Fitzpatrick V-VI — unsafe.',
        'Physical scrubs on active PIH areas — friction worsens pigmentation.',
        'Rubbing lemon juice directly on skin — phototoxic risk and irritation.',
      ],
      clinical_procedures: [
        {
          procedure: 'Chemical Peels (mandelic, lactic, salicylic)',
          note: 'Recommended peels for Black skin by the Skin of Color Society (SOCS). Glycolic acid peels feasible in FP IV with careful pre-treatment. Mandelic most conservative for FP V-VI.',
          access: 'Access to experienced estheticians and dermatologists for skin of color peels has improved significantly but remains a challenge in many US cities outside major metropolitan areas.',
        },
        {
          procedure: 'Q-switched Nd:YAG 1064nm Laser',
          note: 'Safe for Black American skin when performed by practitioners experienced with FP IV-VI. Multiple sessions for significant PIH. Post-procedure care critical.',
        },
        {
          procedure: 'Microneedling (with caution)',
          note: 'Creates micro-channels that enhance penetration of brightening serums. Lower risk of post-treatment PIH than laser in experienced hands, but still requires careful technique for dark skin.',
        },
      ],
    },

    spf_guidance: {
      the_biggest_gap: 'SPF non-use is most prevalent among Black Americans compared to any other demographic in the United States — multiple surveys document SPF use rates of 13–15% in Black American women compared to 40%+ in White American women.',
      reasons_for_non_use: [
        'White cast from traditional mineral sunscreens — a real formulation problem',
        'Myth that Black skin "doesn\'t need" sunscreen — reinforced by some older dermatology messaging',
        'Products historically not marketed to Black consumers',
        'Cost and access barriers in some communities',
        'SPF not embedded in multigenerational skincare traditions',
      ],
      why_spf_matters_for_black_skin: 'Even FP VI skin with the highest melanin density accumulates UV damage over time. UV exposure is a primary trigger for PIH and melasma. The melanin provides some natural protection, but far less than the SPF 30–50 dermatologists recommend. For Black Americans treating PIH, SPF is the single most important daily step — without it, brightening actives are working against constant UV melanocyte stimulation.',
      solutions: [
        'Sheer or tinted SPFs made with deep skin tones in mind (Black Girl Sunscreen, Kinlo, Unsun Cosmetics)',
        'Chemical SPF with no white cast (EltaMD UV Clear, La Roche-Posay Anthelios)',
        'Black-owned SPF brands specifically formulated for melanated skin',
        'Celebrity education campaigns (Black dermatologists on social media have dramatically shifted SPF acceptance in Black American communities)',
      ],
      black_owned_spf_brands: 'Black Girl Sunscreen (BGS) — founded by Shontay Lundy — is a landmark Black-owned SPF brand specifically formulated for deeper skin tones, with no white cast. Kinlo, founded by Serena Williams, is another. These brands have significantly shifted SPF adoption by normalising it within Black American beauty culture.',
    },

    dermatology_access: {
      
      skin_of_color_society: 'The Skin of Color Society (SOCS) — founded in 2004 — is a professional medical organisation dedicated to advancing the understanding and treatment of skin of color. Their website (skinofcolorsociety.org) maintains a directory of dermatologists with expertise in treating skin of color.',
      historical_medical_racism: 'The history of medical racism in the US — from the Tuskegee Study to documented bias in pain management — has eroded trust between Black Americans and healthcare institutions. This is a real and valid historical basis for healthcare avoidance that dermatologists must acknowledge, not dismiss.',
      telehealth_expansion: 'Teledermatology has expanded access to dermatological care for Black Americans in underserved communities. Platforms like Hims & Hers, Curology, and dedicated dermatology telehealth services have democratised access to prescription treatments (retinoids, azelaic acid) that previously required in-person visits.',
    },

    culturalContext: {
      black_is_beautiful: '"Black Is Beautiful" emerged as a cultural and political movement in the 1960s–70s alongside the Black Power movement — a direct challenge to white-supremacist beauty standards that devalued Black physical characteristics including dark skin. This movement has had a profound and lasting impact on Black American beauty culture and self-image.',
      colorism_in_black_america: 'Despite Black Is Beautiful, colorism persists in Black American culture — a direct legacy of the US slave trade\'s "house vs. field" distinctions that assigned different conditions partly based on proximity to whiteness (including lighter skin). Studies document wage gaps and social preference differences based on skin tone within the Black American community.',
      the_paper_bag_test: 'The "paper bag test" — an infamous informal standard in some historical Black American social organisations that admitted only those lighter than a paper bag — is a documented historical example of intra-community colorism in America.',
      contemporary_movement: 'Melanin-celebrating culture has become prominent in Black American beauty, fashion, and media: "melanin poppin," "melanin queen," the celebration of rich, dark skin tones in social media, advertising, and entertainment represents a powerful cultural assertion. Black-owned beauty brands (Fenty Beauty, Pat McGrath, Black Opal, Iman Cosmetics) have been central to this shift.',
      hair_and_skin_intersection: 'In Black American culture, the natural hair movement (rejecting chemical relaxers in favour of natural coil and curl patterns) has run parallel to a natural skincare movement — both representing an assertion of Black beauty on its own terms. The two movements share cultural DNA and community spaces.',
      skin_tone_politics: 'Black celebrity culture involves public conversations about skin tone — bleaching accusations, celebrations of dark skin, and discussions of media under-representation of dark-skinned Black women in entertainment are regular cultural conversations. These are not peripheral — they reflect real social dynamics with real psychological impact.',
    },

    treatmentTimelines: {
      pih_mild: '3–4 months with niacinamide + SPF daily. Consistent routine, no new breakouts.',
      pih_moderate: '4–6 months with niacinamide + azelaic acid or tranexamic acid + SPF 50.',
      pih_severe: '6–12 months. May add retinoid (0.025% tretinoin PM) and/or prescription hydroquinone (cycled) for more aggressive approach.',
      pseudofolliculitis_pih: 'Ongoing — requires sustained shaving behaviour change alongside topical treatment. PFB will continue producing PIH without addressing the root cause.',
      keloid_associated: 'Keloid management by dermatologist is separate from PIH treatment. PIH around keloids: 6–12 months with appropriate topicals once keloid is managed.',
      realistic_message: 'Consistency over intensity. The desire to fade PIH quickly leads many Black American patients toward overusing actives, causing irritation that creates more PIH — the exact opposite of the goal. A gentle, consistent, evidence-based routine with mandatory SPF is more effective than aggressive treatment.',
    },
  },
}; // end ETHNIC_HYPERPIGMENTATION_GUIDES

// ─── GETTER FUNCTIONS ────────────────────────────────────────────────────────

export function getHyperpigmentationGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_HYPERPIGMENTATION_GUIDES['west-african'],
    'south-asian': ETHNIC_HYPERPIGMENTATION_GUIDES['south-asian'],
    'caribbean': ETHNIC_HYPERPIGMENTATION_GUIDES['caribbean'],
    'arab': ETHNIC_HYPERPIGMENTATION_GUIDES['arab'],
    'latina': ETHNIC_HYPERPIGMENTATION_GUIDES['latina'],
    'east-asian': ETHNIC_HYPERPIGMENTATION_GUIDES['east-asian'],
    'east-african': ETHNIC_HYPERPIGMENTATION_GUIDES['east-african'],
    'south-african': ETHNIC_HYPERPIGMENTATION_GUIDES['south-african'],
    'black-american': ETHNIC_HYPERPIGMENTATION_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

export function getAllCommunityIds() {
  return [
    'west-african',
    'south-asian',
    'caribbean',
    'arab',
    'latina',
    'east-asian',
    'east-african',
    'south-african',
    'black-american',
  ];
}

export function getSafeIngredientsForFitzpatrick(fitzpatrickType) {
  const allSafe = [
    'niacinamide',
    'tranexamic-acid',
    'azelaic-acid',
    'alpha-arbutin',
    'spf-50-broad-spectrum',
    'centella-asiatica',
    'aloe-vera-aloesin',
    'licorice-root-glabridin',
    'vitamin-c-l-ascorbic-acid',
    'green-tea-egcg',
  ];

  const cautionIV = [
    'glycolic-acid-moderate-5-10-pct',
    'lactic-acid-5-10-pct',
    'kojic-acid-1-2-pct',
    'retinoids-low-strength',
  ];

  const cautionIII = [
    'glycolic-acid-up-to-15-pct',
    'salicylic-acid',
    'retinoids-moderate-strength',
    'hydroquinone-prescription',
    'triple-combination-cream',
  ];

  if (fitzpatrickType <= 3) {
    return { safe: allSafe, usable_with_care: [...cautionIV, ...cautionIII], avoid: ['mercury', 'unregulated-steroids'] };
  } else if (fitzpatrickType === 4) {
    return { safe: allSafe, usable_with_care: cautionIV, use_with_expert_supervision: cautionIII, avoid: ['mercury', 'unregulated-steroids', 'ipl'] };
  } else {
    // FP V-VI
    return {
      safe: allSafe,
      usable_with_caution: ['kojic-acid-1-pct', 'mandelic-acid-5-10-pct', 'lactic-acid-5-10-pct', 'retinoids-lowest-strength-start-very-slowly'],
      expert_supervision_only: ['glycolic-acid', 'tca-peels', 'hydroquinone', 'triple-combination-cream'],
      avoid: ['mercury', 'unregulated-steroids', 'ipl', 'high-concentration-glycolic-acid', 'aggressive-peels-without-prep'],
    };
  }
}

export function getDangerousProductWarning(ingredient) {
  const warnings = {
    mercury: {
      danger_level: 'LIFE-THREATENING',
      also_known_as: ['calomel', 'mercurous chloride', 'amide mercury', 'mercury iodide', 'quicksilver', 'hydrargyrum'],
      health_risks: ['Kidney failure', 'Neurological damage', 'Foetal toxicity', 'Secondary household poisoning', 'Permanent skin damage'],
      action: 'Stop use immediately. Wash skin. Seal product. Consult physician for kidney function and mercury level testing. Report to local health authority.',
      communities_at_highest_risk: ['west-african', 'east-african', 'caribbean', 'latina', 'south-african'],
    },
    'unlabelled-steroids': {
      danger_level: 'HIGH',
      signs_of_contamination: ['Very fast lightening (days)', 'Medical smell', 'Skin feels thin or burns', 'Severe rebound when stopped'],
      health_risks: ['Skin thinning', 'Stretch marks', 'Steroid acne', 'Telangiectasia', 'Adrenal suppression', 'Hypertrichosis'],
      action: 'Stop use gradually (sudden cessation causes rebound). Consult physician. Report product.',
    },
    'high-dose-hydroquinone': {
      danger_level: 'MODERATE-HIGH with prolonged use',
      safe_use: 'Maximum 4% concentration, maximum 3 months continuous, then 1–2 month break.',
      risk: 'Ochronosis — paradoxical blue-black permanent darkening. More common in FP V-VI with prolonged high-dose use.',
      action: 'Use only prescription-grade under medical supervision. Never use unsupervised concentrations >4%.',
    },
    'citrus-juice-on-skin': {
      danger_level: 'MODERATE — risk of phytophotodermatitis',
      applies_to: ['Lime juice', 'Lemon juice', 'Orange juice', 'Bergamot oil', 'Grapefruit juice'],
      risk: 'Psoralens in citrus activate with UV light — causes severe burns and intense PIH worse than the original spots. A known risk wherever citrus is used as a home remedy for dark spots.',
      action: 'Do not apply citrus juice to skin before sun exposure. If used at all, use only at night and rinse completely before morning. Use lactic acid or vitamin C as a safer evidence-based alternative.',
    },
    'lead-kohl': {
      danger_level: 'HIGH — particularly for children and pregnant women',
      applies_to: ['Traditional kohl', 'Surma', 'Some Arab/South Asian eye products without regulatory compliance'],
      risk: 'Lead is a neurotoxin with no safe threshold. Readily absorbed through skin and mucous membranes around eyes.',
      action: 'Use only regulated cosmetic-grade eye products from brands with ingredient transparency. Avoid any eye product without a full ingredient list.',
    },
  };
  return warnings[ingredient] || null;
}

export function getUniversalTreatmentProtocol() {
  return UNIVERSAL_HYPERPIGMENTATION.step_by_step_protocol;
}

export function getColorismAwarenessInfo() {
  return UNIVERSAL_HYPERPIGMENTATION.colorism_awareness;
}

export function getMelaninScienceExplainer() {
  return MELANIN_SCIENCE;
}

export function getTreatmentTimeline(communityId) {
  const guide = getHyperpigmentationGuide(communityId);
  if (!guide) return null;
  return guide.treatmentTimelines || null;
}

export function getTraditionalPractices(communityId) {
  const guide = getHyperpigmentationGuide(communityId);
  if (!guide) return null;
  return guide.traditionalBrighteningPractices || null;
}

export function getCulturalContext(communityId) {
  const guide = getHyperpigmentationGuide(communityId);
  if (!guide) return null;
  return guide.culturalContext || null;
}

export function getSpfGuidance(communityId) {
  const guide = getHyperpigmentationGuide(communityId);
  if (!guide) return null;
  return guide.spf_guidance || null;
}

export function getSafeClinicaTreatments(communityId) {
  const guide = getHyperpigmentationGuide(communityId);
  if (!guide) return null;
  return guide.safeClinicaTreatments || null;
}

export function searchByHyperpigmentationType(type) {
  // type: 'pih' | 'melasma' | 'solar-lentigos' | 'pseudofolliculitis' | 'periorbital'
  const results = [];
  const allIds = getAllCommunityIds();
  for (const id of allIds) {
    const guide = ETHNIC_HYPERPIGMENTATION_GUIDES[id];
    if (guide && guide.primaryHyperpigmentationTypes) {
      const types = guide.primaryHyperpigmentationTypes;
      if (type === 'pih' && types.pih) results.push({ communityId: id, detail: types.pih });
      if (type === 'melasma' && types.melasma) results.push({ communityId: id, detail: types.melasma });
      if (type === 'solar-lentigos' && types.solar_lentigos) results.push({ communityId: id, detail: types.solar_lentigos });
      if (type === 'pseudofolliculitis' && (types.pseudofolliculitis_barbae || types.pseudofolliculitis)) {
        results.push({ communityId: id, detail: types.pseudofolliculitis_barbae || types.pseudofolliculitis });
      }
      if (type === 'periorbital' && types.periorbital_hyperpigmentation) {
        results.push({ communityId: id, detail: types.periorbital_hyperpigmentation });
      }
    }
  }
  return results;
}
