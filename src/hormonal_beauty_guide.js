/**
 * MIRRR — Hormonal Beauty Guide
 * Skin and hair changes through menstrual cycle, pregnancy, postpartum,
 * perimenopause, menopause, PCOS, and thyroid conditions.
 * Culture-specific notes for all 9 communities.
 */

export const HORMONAL_BEAUTY_OVERVIEW = {
  title: 'Hormones and Beauty: The Complete Guide',
  introduction: `Hormones are the master regulators of skin and hair. Oestrogen, progesterone,
testosterone (androgens), cortisol, thyroid hormones, and insulin all directly affect sebum
production, collagen synthesis, hydration levels, hair growth cycles, pigmentation, and wound
healing. Understanding hormonal fluctuations allows you to adapt your beauty routine proactively
rather than reactively — anticipating breakouts, dryness, or hair shedding before they peak.`,
  keyHormones: {
    oestrogen: {
      role: 'Stimulates collagen and hyaluronic acid production; maintains skin thickness and hydration; promotes hair growth; reduces sebum',
      highEffects: 'Plumper skin, fewer breakouts, stronger faster-growing hair, improved wound healing',
      lowEffects: 'Thinning skin, increased dryness, hair shedding, reduced collagen, hyperpigmentation risk'
    },
    progesterone: {
      role: 'Increases sebum production; can cause water retention and puffiness; has mild androgen-like effects',
      highEffects: 'Oilier skin in luteal phase, potential pre-menstrual breakouts, breast tenderness, bloating',
      lowEffects: 'Reduced pre-menstrual symptoms; in menopause, absence contributes to skin dryness'
    },
    testosterone_androgens: {
      role: 'Stimulates sebaceous glands; promotes terminal hair in some areas; involved in libido and mood',
      highEffects: 'Increased sebum and acne (especially jawline/chin); unwanted facial/body hair; scalp hair thinning (paradox)',
      lowEffects: 'Reduced libido; possible dry skin; reduced body hair'
    },
    cortisol: {
      role: 'Stress hormone; breaks down collagen; increases sebum; disrupts skin barrier; triggers inflammation',
      highEffects: 'Acne flares; impaired healing; thin skin; puffiness (Cushingoid); rosacea triggers; hair shedding (telogen effluvium)',
      lowEffects: 'Healthy skin barrier; normal healing; stable skin microbiome'
    },
    thyroid: {
      role: 'Regulates metabolism including skin cell turnover and hair follicle cycling',
      hypothyroid_effects: 'Dry thickened skin; brittle nails; hair loss especially outer eyebrow; puffy face; pallor',
      hyperthyroid_effects: 'Warm moist skin; fine hair; diffuse hair loss; nail separation (onycholysis); flushing'
    },
    insulin_IGF1: {
      role: 'High insulin and IGF-1 (from diet or PCOS) stimulate androgen production and sebaceous gland activity',
      highEffects: 'Acne especially hormonal pattern; skin tags (acanthosis nigricans); PCOS features',
      management: 'Low glycaemic index diet; inositol supplementation; berberine'
    }
  },
  affectedSkinFeatures: ['Sebum production', 'Collagen and elastin synthesis', 'Hydration and transepidermal water loss', 'Pigmentation (melanin stimulation)', 'Wound healing speed', 'Inflammatory response', 'Hair growth and shedding cycles', 'Nail growth and strength']
};

export const MENSTRUAL_CYCLE_SKIN_GUIDE = {
  title: 'Skin Through the Menstrual Cycle',
  disclaimer: 'Cycle phase effects vary significantly between individuals. These are common patterns, not universal rules.',
  phases: {
    menstruation: {
      days: '1–5',
      hormones: 'Oestrogen and progesterone at their lowest',
      skinState: 'Skin may be dull, sensitive, and more prone to dehydration. Prostaglandins cause inflammation that can worsen acne. Some experience facial puffiness from hormonal fluctuation.',
      hairState: 'Sebum at its lowest; hair may feel drier and more manageable for fine hair, but frizzy for coily hair',
      routine: {
        focus: 'Gentle, barrier-supporting, anti-inflammatory',
        keyIngredients: ['Ceramides', 'Centella asiatica', 'Aloe vera', 'Oat extract', 'Gentle AHA to unclog without stripping'],
        avoid: ['Harsh exfoliants', 'Strong retinoids (skin more reactive)', 'Alcohol-based products']
      },
      makeupTip: 'Skin may look tired; use a luminising base and avoid heavy matte foundations that emphasise dry patches'
    },
    follicular: {
      days: '6–13',
      hormones: 'Oestrogen rising steadily; testosterone briefly peaks at ovulation',
      skinState: 'This is the "golden week" — rising oestrogen stimulates collagen, improves hydration, reduces pore size, and gives skin its best glow. Skin looks and feels its healthiest.',
      hairState: 'Scalp sebum balanced; hair appears fuller and shinier; the oestrogen effect on hair follicles is at its strongest',
      routine: {
        focus: 'Capitalise on peak skin receptivity',
        keyIngredients: ['Vitamin C serums (collagen synergy)', 'Retinoids (best tolerated)', 'AHAs (best results)', 'Actives in general'],
        skincareTip: 'Schedule facial treatments, chemical peels, or laser appointments in this phase for best results and fastest healing'
      },
      makeupTip: 'Natural glow — minimal makeup needed. Great time for bold lip or eye looks as skin base is effortlessly even'
    },
    ovulation: {
      days: '13–15',
      hormones: 'Oestrogen peak followed by brief testosterone spike; LH surge triggers ovulation',
      skinState: 'Brief peak glow at ovulation. The testosterone spike can trigger mild mid-cycle breakouts, especially on chin and jawline. Some people experience "mittelschmerz" bloating that shows in the face.',
      hairState: 'Hair at its shiny peak due to oestrogen',
      routine: {
        focus: 'Spot treatment for any mid-cycle breakouts; continue actives',
        keyIngredients: ['Salicylic acid spot treatment', 'Niacinamide']
      }
    },
    luteal_early: {
      days: '16–22',
      hormones: 'Progesterone rising sharply; oestrogen declining then briefly rising again',
      skinState: 'Progesterone increases sebum production. Pores appear larger. Skin starts to look oilier, especially T-zone. Oily skin types notice most change here.',
      hairState: 'Scalp gets oilier; may need to wash hair more frequently',
      routine: {
        focus: 'Oil control and congestion prevention',
        keyIngredients: ['BHA (salicylic acid) to manage sebum', 'Niacinamide to regulate oil', 'Clay mask 1–2x weekly', 'Lighter moisturiser'],
        avoid: ['Heavy oils', 'Occlusive balms if acne-prone']
      }
    },
    luteal_late: {
      days: '23–28',
      hormones: 'Both oestrogen and progesterone declining; androgens relatively dominant; PMS peak',
      skinState: 'Pre-menstrual breakouts peak (typically days 22–25): deep cystic spots on jawline, chin, cheeks. Water retention causes puffiness. Skin looks dull as oestrogen falls. For melasma-prone skin, hormonal fluctuations can worsen discolouration.',
      hairState: 'Hair may feel limp, oily at roots, or lack volume due to water retention and hormonal shifts',
      routine: {
        focus: 'Prevention and treatment of hormonal breakouts; anti-inflammatory',
        keyIngredients: ['Topical niacinamide (oil control + anti-inflammatory)', 'Adapalene for hormonal acne', 'Zinc serum or face mask', 'Centella for healing'],
        proactiveTreatment: 'Begin spot treatment 2–3 days before expected breakout location if you know your pattern',
        supplements: ['Zinc 30mg (anti-androgen)', 'Evening primrose oil (1000mg)', 'Vitex/chaste tree berry (cycle regulation)', 'Omega-3 (anti-inflammatory)', 'Magnesium glycinate (reduces PMS and inflammation)']
      },
      facialGua_sha: 'Lymphatic drainage gua sha can reduce pre-menstrual facial puffiness — use upward strokes from jawline to temples'
    }
  },
  hormonalAcnePattern: {
    description: 'Hormonal acne has a distinctive pattern: lower face (jawline, chin, cheeks), appears before menstruation, tends to be deep and cystic rather than surface-level, heals slowly and leaves PIH',
    distinguishFromStress: 'Stress acne is also often hormonal (cortisol → androgens) and appears in the same zones',
    treatments: {
      topical: ['Adapalene (retinoid specifically effective for hormonal acne)', 'Topical spironolactone (if prescribed)', 'Niacinamide 10%', 'Salicylic acid 2% wash', 'Benzoyl peroxide 2.5% (use only on active spots)'],
      oral: ['Combined oral contraceptive pill (can clear hormonal acne)', 'Spironolactone (anti-androgen; common in US)', 'Low-dose isotretinoin', 'Tetracyclines (antibiotics — short-term only)'],
      lifestyle: ['Low glycaemic index diet', 'Reduce dairy (especially low-fat dairy)', 'Stress management', 'Consistent sleep schedule', 'Track cycle to predict and prevent']
    }
  }
};

export const PREGNANCY_BEAUTY_GUIDE = {
  title: 'Beauty During Pregnancy',
  introduction: `Pregnancy causes dramatic hormonal shifts — oestrogen and progesterone increase tenfold, hCG surges in the first trimester, and blood volume increases 45-50%. These changes produce some of the most discussed beauty phenomena: the "pregnancy glow," hair thickening, and unfortunately also melasma, stretch marks, acne, and varicose veins.`,
  safeIngredients: {
    generally_considered_safe: ['Hyaluronic acid', 'Glycerin', 'Ceramides', 'Niacinamide', 'Vitamin C (L-ascorbic acid)', 'Azelaic acid (Rx — check with doctor)', 'Benzoyl peroxide 2.5% (limited use — check with doctor)', 'Physical sunscreen (zinc oxide, titanium dioxide)', 'AHAs (lactic acid, glycolic acid — in low concentrations)', 'Squalane', 'Centella asiatica', 'Aloe vera', 'Bakuchiol (plant-based retinol alternative — generally considered safe)', 'Caffeine (topical in eye cream — limited use OK)'],
    note: 'Always consult your obstetrician or midwife. "Generally considered safe" is not the same as clinically proven safe in pregnancy, as ethical constraints limit clinical testing.'
  },
  avoidIngredients: {
    definitely_avoid: ['Retinoids: retinol, retinaldehyde, tretinoin, adapalene, tazarotene, isotretinoin (teratogenic — causes serious birth defects)', 'Hydroquinone (high systemic absorption)', 'Chemical sunscreen oxybenzone (endocrine disruption potential)', 'High-dose salicylic acid (BHA) especially leave-on (avoid >2% and leave-on formats)', 'Formaldehyde-releasing preservatives (DMDM hydantoin, quaternium-15)', 'Dihydroxyacetone (DHA) in spray tanning — inhalation risk', 'Thioglycolic acid (chemical hair removal)', 'Certain essential oils in high concentration (sage, rosemary, thyme, oregano)', 'Bleaching agents (mercury-containing creams)', 'Botox and fillers (no safety data)'],
    caution: ['Benzoyl peroxide (keep use minimal and topical)', 'Kojic acid (limited data)', 'Arbutin (breaks down to hydroquinone)', 'Vitamin A supplements (avoid supplements; food sources fine)']
  },
  pregnancySkinChanges: {
    glow: {
      description: 'The "pregnancy glow" is real: increased blood volume (45-50% more blood) means more circulation to the face, producing a flushed, luminous look. Oestrogen also increases oil production that adds to the dewy appearance.',
      peaks: 'Second trimester',
      skincare: 'Embrace it — a tinted moisturiser with SPF and a light blush is all that is needed'
    },
    melasma: {
      description: 'Melasma (the "mask of pregnancy" or chloasma) appears as symmetrical brown or grey-brown patches on the forehead, cheeks, upper lip, and chin. Occurs in 50-70% of pregnant people. Caused by hormonal stimulation of melanocytes combined with UV exposure.',
      triggers: 'UV light is the primary co-trigger; even minimal sun exposure worsens melasma dramatically in pregnancy',
      treatment: {
        safe_in_pregnancy: ['Broad-spectrum SPF 50+ daily (physical preferred)', 'Wide-brimmed hats and sun avoidance', 'Vitamin C serum (mild brightening)', 'Azelaic acid (if prescribed by doctor)', 'Niacinamide (gentle brightening)'],
        postpartum: 'Many cases resolve spontaneously after delivery and breastfeeding. If persistent: kojic acid, arbutin, hydroquinone, glycolic acid, or laser treatments'
      }
    },
    acne: {
      description: 'First-trimester acne is extremely common — hCG stimulates androgen production causing sebum surge. Usually improves by second trimester as hormones stabilise.',
      safe_treatments: ['Glycolic acid wash', 'BHA wash (low %, rinse-off)', 'Niacinamide 10% serum', 'Azelaic acid (prescription)', 'Physical extractions by facialist'],
      avoid: ['Retinoids', 'High-dose BHA leave-on', 'Oral antibiotics except as prescribed by doctor', 'Spironolactone (anti-androgen; contraindicated)']
    },
    stretch_marks: {
      description: 'Striae gravidarum (stretch marks) occur in 55-90% of pregnancies, primarily on abdomen, breasts, thighs, and hips. Caused by rapid skin stretching beyond elastic capacity combined with cortisol-related collagen weakening.',
      genetics: 'Strongest risk factor; if your mother had stretch marks, your risk is significantly higher',
      prevention: {
        topical: ['Centella asiatica extract (Cica) — studied and shown to reduce severity', 'Rosehip oil — shown in studies to reduce development', 'Cocoa butter and shea butter — popular; evidence mixed but moisturising helps', 'Argan oil', 'Hyaluronic acid'],
        technique: 'Apply twice daily from second trimester, especially to high-risk areas; circular massage improves blood flow and absorption',
        realistic_expectation: 'Cannot guarantee prevention, especially with genetic predisposition; can minimise severity'
      },
      treatment_postpartum: ['Retinoids — begin once breastfeeding is complete; highly effective', 'Tretinoin 0.05-0.1% showed 80% improvement in one study', 'Glycolic acid 20%', 'Laser: fractional CO2 or pulsed dye laser', 'Microneedling', 'Note: Red/purple active stretch marks respond much better than white/mature ones']
    },
    hair: {
      growth: 'Oestrogen prolongs the anagen (growth) phase — hair falls out much less than normal, so it appears thicker and more voluminous throughout pregnancy',
      postpartumShedding: 'After delivery, oestrogen plummets, pushing all the "saved" hairs into telogen effluvium simultaneously. Peak shedding: 3-4 months postpartum. This is completely normal and almost always fully resolves by 12-18 months.',
      treatment_shedding: ['Scalp massage daily to stimulate follicles', 'Minoxidil (check with doctor for breastfeeding safety)', 'Biotin — common but evidence limited', 'Ensure iron levels are adequate (common postpartum deficiency)', 'Low-level laser therapy (LLLT)']
    },
    nails: {
      description: 'Nails often grow faster and stronger during pregnancy due to increased circulation and oestrogen. Some people experience brittle or soft nails — related to nutritional changes or dehydration.',
      care: 'Prenatal vitamins support nail health; biotin supplementation; keep nails hydrated',
      safety: 'Gel and acrylic nails are generally considered safe with proper ventilation; avoid excess exposure to strong chemicals'
    },
    veins: {
      spider_veins: 'Fine red veins on face, legs, or chest from increased blood pressure and circulating blood volume; typically fade after delivery',
      varicose_veins: 'Enlarged leg veins from increased blood volume and progesterone relaxing vein walls; compression stockings help; often improve postpartum',
      treatment_postpartum: ['Sclerotherapy for spider veins on legs', 'Laser for facial spider veins', 'Varicose vein treatment if persistent']
    }
  }
};

export const MENOPAUSE_PERIMENOPAUSE_BEAUTY = {
  title: 'Perimenopause and Menopause Beauty Guide',
  timeline: {
    perimenopause: 'Typically begins 2-10 years before final period; usually 40s-50s; defined by irregular cycles and oestrogen fluctuation',
    menopause: 'Defined as 12 consecutive months without a period; average age 51 in the UK',
    postmenopause: 'The years following menopause; oestrogen remains at permanently low level'
  },
  skinChanges: {
    collagen_loss: {
      description: 'Skin loses up to 30% of collagen in the first 5 years of menopause — the fastest collagen loss rate in a woman\'s life. Thereafter, 2% loss per year continues.',
      visible_effects: 'Increased wrinkling, sagging (especially jawline and neck), thinning skin that bruises easily, poor wound healing',
      treatment: {
        topical: ['Retinoids — most evidence for stimulating collagen (tretinoin 0.025-0.1%)', 'Vitamin C 10-20% daily', 'Peptides (Matrixyl 3000, copper peptides)', 'Growth factors (EGF serums)', 'Hyaluronic acid 3 layers for deep hydration'],
        professional: ['RF (radiofrequency) microneedling — excellent for menopausal skin laxity', 'HIFU (Ultherapy) for lifting', 'Fractional laser', 'Collagen-stimulating fillers (Sculptra/Radiesse)'],
        HRT: 'Hormone replacement therapy (HRT/MHT) has been shown to significantly slow menopausal skin ageing — increases skin collagen, thickness, hydration, and elasticity. Discuss with GP.'
      }
    },
    dryness: {
      description: 'Oestrogen maintains skin hydration by stimulating hyaluronic acid and ceramide production. Without oestrogen, skin becomes significantly drier, more prone to irritation, and the skin barrier weakens.',
      severity: 'Affects genital skin (vaginal atrophy/genitourinary syndrome of menopause) as severely as facial skin',
      treatment: ['Switch to richer cream moisturisers and barrier-supporting formulations', 'Add a facial oil (rosehip, marula, or squalane) morning and night', 'Ceramide-heavy products (CeraVe, La Roche-Posay Lipikar)', 'Overnight mask weekly', 'Avoid hot water, sulphate cleansers, and alcohol-based products', 'Humidifier in bedroom']
    },
    flushing_hot_flashes: {
      description: 'Hot flushes (flashes) affect up to 80% of menopausal women — sudden wave of heat, sweating, and flushing. Triggered by hypothalamic temperature dysregulation as oestrogen-sensing mechanisms reset.',
      skincare_impact: 'Repeated flushing can trigger or worsen rosacea; post-flush sweat can disturb skin barrier and mascara',
      management: {
        medical: ['HRT — most effective treatment', 'Fezolinetant (neurokinin B receptor antagonist) — non-hormonal option', 'SSRI/SNRI (paroxetine, venlafaxine)', 'Gabapentin'],
        beauty: ['Mineral sunscreen stays on through perspiration better than chemical', 'Oil-free, transfer-resistant makeup', 'Green colour-correcting primer for redness', 'Facial mist (thermal water) to cool skin without disturbing makeup', 'Loose mineral powder for mid-day refresh']
      }
    },
    pigmentation: {
      description: 'Age spots (solar lentigines) accumulate from decades of UV exposure. Hormonal changes can also trigger menopausal melasma or reactivate previous melasma.',
      treatment: ['Daily SPF 50+ — critical at this stage', 'Azelaic acid 20% (prescription) — effective and well-tolerated', 'Vitamin C 15-20%', 'Tranexamic acid', 'Niacinamide 10-12%', 'Kojic acid', 'Professional: chemical peels, IPL, Q-switched laser', 'Note: caution with aggressive laser on Fitzpatrick IV-VI (PIH risk)']
    }
  },
  hairChanges: {
    scalp_hair_thinning: {
      description: 'Androgenetic alopecia (female pattern hair loss) accelerates dramatically at menopause as oestrogen, which counteracted androgen effects on hair follicles, declines. Oestrogen was essentially protecting scalp follicles.',
      pattern: 'Diffuse thinning over the crown and widening of the centre part; hairline typically preserved (unlike male pattern)',
      treatment: ['Minoxidil 2-5% — FDA approved, most evidence; apply to dry scalp', 'Low-level laser therapy (LLLT) — FDA cleared for women', 'Ketoconazole shampoo (anti-androgen + anti-fungal)', 'HRT — some evidence for slowing hair loss', 'Finasteride/dutasteride (off-label; anti-androgens; significant evidence)', 'Platelet-rich plasma (PRP) injections', 'Hair transplant for stable hair loss']
    },
    facial_hair: {
      description: 'Unwanted facial hair (hirsutism) increases at menopause as oestrogen declines and androgens become relatively dominant. Most common on upper lip, chin, and sideburns.',
      treatment: ['Eflornithine cream (Vaniqa) — inhibits facial hair growth', 'Laser hair removal — permanent reduction', 'Electrolysis — permanent removal of individual hairs', 'Threading and waxing — effective temporary options', 'Spironolactone — anti-androgen oral medication']
    },
    body_hair: 'Body hair often decreases in menopause (legs, underarms) while facial hair increases — another effect of changing androgen/oestrogen ratio'
  },
  menopausalRoutine: {
    morning: ['Gentle cream or oil cleanser (no foam)', 'Hyaluronic acid serum (2-3 layers)', 'Vitamin C serum 15-20%', 'Peptide serum', 'Rich moisturiser with ceramides', 'SPF 50+ broad spectrum (non-negotiable)'],
    evening: ['Double cleanse (oil then gentle cream)', 'Exfoliating toner (lactic acid or PHAs — gentler than AHA)', 'Retinoid (start 2x/week, build to nightly)', 'Facial oil (rosehip, marula, argan)', 'Rich cream or sleeping mask'],
    weekly: ['Hydrating sheet mask', 'Gua sha or facial massage (lymphatic, toning)', 'Scalp massage with minoxidil if using']
  }
};

export const PCOS_BEAUTY_GUIDE = {
  title: 'PCOS (Polycystic Ovary Syndrome) Beauty Guide',
  overview: `PCOS affects 8-13% of reproductive-age people worldwide, with higher rates in South Asian (up to 52% in some studies), Middle Eastern, and Hispanic communities. It is characterised by elevated androgens (testosterone and DHEA-S), irregular cycles, and often insulin resistance. The beauty manifestations are primarily androgenic: acne, hirsutism, and scalp hair loss.`,
  pcosAcne: {
    characteristics: 'Severe hormonal acne: deep cystic lesions on jawline, chin, neck, chest and back; persistent regardless of age; often concurrent with hirsutism and PCOS hair loss',
    medical_treatments: ['Combined oral contraceptive pill (especially cyproterone acetate-containing pill — Dianette/Diane-35)', 'Spironolactone (100-200mg daily) — highly effective anti-androgen', 'Low-dose isotretinoin', 'Metformin (reduces insulin and thereby androgens)', 'Inositol (myo-inositol + D-chiro-inositol 40:1 ratio) — insulin sensitiser; can reduce androgens and improve acne'],
    topical_support: ['Adapalene 0.3% gel', 'Azelaic acid 20%', 'Niacinamide 10%', 'BHA 2% cleanser']
  },
  pcosHirsutism: {
    characteristics: 'Excess terminal hair growth in androgen-sensitive areas: upper lip, chin, sideburns, neck, chest, abdomen, inner thighs',
    scale: 'Ferriman-Gallwey score used medically (>8 suggests hirsutism)',
    medical_treatments: ['Spironolactone', 'Cyproterone acetate', 'Eflornithine cream (slows growth)', 'Combined OCP'],
    hair_removal: ['Laser hair removal — most effective; requires multiple sessions; works best on dark hair on light skin', 'Nd:YAG laser for dark skin Fitzpatrick V-VI (safe for melanin-rich skin)', 'Electrolysis — permanent for all skin and hair types but slow', 'IPL — effective but not for dark skin', 'Waxing, threading, epilating — effective temporary solutions'],
    timeline: 'Medical treatment takes 6-12 months to show significant effect on new hair growth; existing terminal hairs need removal'
  },
  pcosHairLoss: {
    characteristics: 'Female pattern hair loss accelerated by androgens; same pattern as menopausal FPHL but often in younger people',
    medical_treatments: ['Minoxidil 5% foam', 'Spironolactone', 'Combined OCP', 'Low-level laser therapy', 'PRP injections'],
    note: 'Treating the underlying PCOS (insulin resistance, androgen excess) is the most sustainable approach'
  },
  pcosNails: {
    description: 'PCOS-related hormonal and nutritional imbalances (especially insulin resistance and vitamin D deficiency) can affect nail growth and strength',
    care: ['Biotin supplementation', 'Vitamin D 2000-4000 IU daily (very commonly deficient in PCOS)', 'Magnesium supplementation', 'Iron levels check (irregular cycles can cause iron deficiency)']
  },
  pcosLifestyleBeauty: {
    diet_impact: 'Low glycaemic index diet reduces insulin, reduces androgens, and improves acne and hirsutism significantly. Mediterranean diet pattern shown most effective.',
    supplements: ['Myo-inositol 2000-4000mg + D-chiro-inositol 50-100mg daily (ratio 40:1)', 'Berberine 500mg 3x daily (insulin sensitiser; comparable to metformin in some studies)', 'Spearmint tea 2 cups daily (mild anti-androgen effect — reduces free testosterone)', 'NAC (N-acetyl cysteine) 600mg 3x daily', 'Omega-3 2000mg daily (anti-inflammatory)'],
    exercise: 'Resistance training particularly effective for PCOS insulin sensitivity; also reduces androgen levels'
  },
  ethnicPCOS: {
    'south-asian': 'PCOS prevalence estimated at 22-52% in South Asian women — significantly higher than global average. Often lean PCOS (normal BMI with insulin resistance). Acne may present darker and leave severe PIH on Fitzpatrick IV-V skin. Community stigma around facial hair can be significant.',
    arab: 'Higher PCOS prevalence in Middle Eastern populations. Combined OCP culturally sensitive to discuss; spironolactone and lifestyle approaches may be preferred first-line. Hirsutism particularly distressing given cultural beauty ideals.',
    latina: 'Higher rates of insulin resistance and hyperandrogenism. Dark skin tones (Fitzpatrick IV-V) mean PIH from hormonal acne is a major concern. Nd:YAG laser important for hirsutism treatment.',
    'east-asian': 'Generally lower BMI in PCOS but similar hormonal profile. Lean PCOS more common. Often presents with acne as primary concern rather than hirsutism.',
    'black-american': 'Research historically under-represented. PIH from PCOS acne on Fitzpatrick V-VI is severe and can be more distressing than the acne itself. Scalp hair loss may coincide with existing hairline concerns.',
    'west-african': 'Similar concerns to Black American. Keloid risk from cystic acne. Traditional herbal treatments popular but evidence for PCOS management varies.',
    caribbean: 'Diverse skin tones; PIH from acne a significant concern. Bay rum traditional aftershave used by some for acne management.',
    'east-african': 'Turmeric traditionally used for skin; has mild anti-androgen and anti-inflammatory properties relevant to PCOS.',
    'south-african': 'Traditional rooibos and aloe vera used for skin concerns; rooibos has anti-inflammatory properties.'
  }
};

export const THYROID_BEAUTY_GUIDE = {
  title: 'Thyroid Conditions and Beauty',
  overview: `The thyroid gland regulates metabolic rate throughout the body, including skin cell turnover, hair follicle cycling, and nail growth. Thyroid disorders are extremely common — hypothyroidism affects 1-2% of the population; the subclinical form affects another 4-10%. Women are 5-8 times more likely to develop thyroid disorders than men. Beauty changes are often among the first noticed symptoms.`,
  hypothyroidism: {
    description: 'Underactive thyroid — insufficient thyroid hormone. Causes: Hashimoto\'s thyroiditis (autoimmune), thyroid removal, radioiodine treatment, iodine deficiency.',
    beautySymptoms: {
      skin: ['Dry, rough, thickened skin', 'Puffy face (myxoedema — mucin deposits under skin)', 'Pallor or yellowish tinge (carotenaemia)', 'Wounds heal slowly', 'Decreased sweating', 'Skin feels cold'],
      hair: ['Diffuse hair loss — all over scalp', 'Characteristic loss of outer third of eyebrows (lateral eyebrow thinning — pathognomonic)', 'Hair becomes dry, brittle, coarse', 'Body hair also affected'],
      nails: ['Brittle, slow-growing nails', 'Longitudinal ridges', 'Paronychia (nail fold inflammation)']
    },
    beautyManagement: {
      skincare: ['Rich emollient moisturisers — applied while skin still damp', 'Urea 10% lotion for rough skin', 'Ceramide creams', 'Gentle non-foaming cleansers', 'Avoid harsh exfoliants on compromised skin'],
      makeup: ['Brightening primer to address pallor', 'Peach or orange colour corrector under concealer for bluish undertones', 'Brow pencil or microblading for outer eyebrow thinning', 'Blush on cheeks to counteract pallor'],
      hair: ['Moisture-first haircare — avoid sulphates', 'Silk pillowcase to reduce breakage', 'Protective styles to minimise manipulation', 'Biotin supplementation (evidence limited)', 'Minoxidil can help while treating underlying condition'],
      note: 'Beauty treatments address symptoms only. Treatment of hypothyroidism with levothyroxine usually significantly improves skin, hair, and nail symptoms within 3-6 months.'
    }
  },
  hyperthyroidism: {
    description: 'Overactive thyroid — excess thyroid hormone. Causes: Graves\' disease (autoimmune), toxic nodular goitre, thyroiditis.',
    beautySymptoms: {
      skin: ['Warm, moist, smooth, thin skin', 'Flushing and sweating', 'Pretibial myxoedema (waxy skin on shins) in Graves\' disease', 'Vitiligo association (autoimmune link)', 'Palmar erythema (red palms)'],
      hair: ['Fine, soft hair texture', 'Diffuse hair thinning', 'Premature greying (autoimmune association)'],
      nails: ['Onycholysis — nail separates from bed (Plummer\'s nails)', 'Soft nails', 'Rapid nail growth']
    },
    beautyManagement: {
      skin: ['Lightweight, oil-free moisturisers', 'Matte primers for oiliness and flushing', 'Green colour corrector for flushing', 'SPF (thin skin is more UV-sensitive)'],
      hair: ['Strengthening protein treatments', 'Gentle handling', 'Minoxidil while treating underlying condition'],
      note: 'Treatment of hyperthyroidism (antithyroid drugs, radioiodine, surgery) reverses most beauty symptoms. Nails recover fastest; hair takes longer.'
    }
  }
};

export const ETHNIC_HORMONAL_BEAUTY = {
  'west-african': {
    specificConcerns: 'Hormonal acne on Fitzpatrick V-VI skin leaves severe hyperpigmentation that can be more distressing than the acne itself. Keloid risk from cystic acne scarring. Traditional shea butter masks used for dry menopausal skin.',
    culturalConsiderations: 'Cultural emphasis on clear skin; hormonal blemishes can carry significant social stress which itself worsens cortisol-driven breakouts. Community remedies include African black soap (gentle and effective) and turmeric masks.',
    menopauseNotes: 'Hot flushes may manifest differently — research suggests Black women experience more frequent, severe, and longer-lasting hot flushes on average. Traditional thermal water and herbal cooling remedies used.',
    hairNotes: 'PCOS-related hair loss on already fragile 4C hair can be devastating. Protective styling essential while treating. Scalp health maintenance critical.'
  },
  'south-asian': {
    specificConcerns: 'Highest PCOS rates globally. Hormonal acne leaves deep PIH on Fitzpatrick IV-V skin. Haldi (turmeric) ceremony and home remedies deeply embedded — turmeric has genuine anti-inflammatory and mild lightening properties.',
    culturalConsiderations: 'Facial hair from PCOS or menopause can be culturally significant — threading is the dominant hair removal tradition. Menopause sometimes called "the third spring" in some South Asian traditions.',
    pregnancyNotes: 'Melasma extremely common (50-70% of pregnancies); sunscreen compliance critical but stigma around "looking too pale" can affect SPF use. Turmeric consumption (dietary) is beneficial; topical high-dose with AHAs can irritate.',
    diabetesLink: 'Higher rates of gestational diabetes and insulin resistance link to hormonal skin concerns including skin tags, acanthosis nigricans at neck/armpits, and acne.'
  },
  caribbean: {
    specificConcerns: 'Melasma common in mixed-skin-tone communities. Bay rum and aloe vera traditional remedies for hormonal skin. Cycle-tracking traditional knowledge passed matrilineally in some communities.',
    hairNotes: 'Postpartum shedding on natural coily hair can be alarming — understanding this is normal is important. Protective braiding styles during shedding phase.',
    menopauseNotes: 'Caribbean and Black women have some evidence for more severe menopausal symptoms. Soursop (guanábana) leaves used as traditional remedy for hot flushes in some communities.'
  },
  arab: {
    specificConcerns: 'Higher PCOS rates than Western populations. Kohl-based beauty traditions historically; modern alternatives available. Modesty considerations mean full-body hormonal hair changes (hirsutism) may affect covered and uncovered areas differently in terms of treatment priority.',
    hairNotes: 'Argan oil deep conditioning during postpartum shedding. Castor oil traditional remedy for hair loss.',
    fragranceNotes: 'Oud and rose-based fragrance use continues through hormonal changes; some people find strong fragrances trigger hot flushes.'
  },
  latina: {
    specificConcerns: 'Higher rates of PCOS insulin resistance variant. Melasma extremely common due to mixed ancestry and Fitzpatrick IV-V skin tones. Avocado and aloe vera traditionally used for hormonal skin conditions.',
    pregnancyNotes: 'Aceite de coco (coconut oil) and aceite de almendras (almond oil) traditional remedies for stretch marks and pregnancy skin.',
    temazcalTradition: 'Traditional Mesoamerican sweat lodge (temazcal) used for postpartum recovery — note: not safe in pregnancy itself. Post-birth temazcal ceremony involves herbal steam, massage, and community support.'
  },
  'east-asian': {
    specificConcerns: 'Glass skin beauty ideal creates pressure that can increase during hormonal breakout periods. Korean "glass skin" routine foundations (double cleanse, essence layers) actually highly effective for hormonal dryness.',
    pcosNotes: 'Lean PCOS presentation common in East Asian populations — normal BMI with hormonal disruption. Acne may present as primary concern; hormonal origin may not be suspected initially.',
    menopauseNotes: 'Phytoestrogen-rich diet (soy, tofu, miso, edamame) may help with menopausal skin and symptoms — isoflavones have weak oestrogen-like activity. Japanese women historically reported fewer hot flush symptoms; diet hypothesis popular though not conclusively proven.',
    traditionalBeauty: 'Rice water (fermented) traditionally used for postpartum skin; contains inositol and antioxidants.'
  },
  'east-african': {
    specificConcerns: 'Frankincense (Boswellia) — native to the Horn of Africa — has genuine anti-inflammatory properties relevant to hormonal skin inflammation. Ghee applied to skin postpartum in some traditions.',
    melasmaRisk: 'Hormonal melasma on Fitzpatrick IV-VI skin can be very dark and persistent. SPF is critical.',
    hairNotes: 'Postpartum hair shedding on natural hair textures — Amharic and Somali hair care traditions include protective styling and butters during postpartum recovery.'
  },
  'south-african': {
    specificConcerns: 'Diverse population with Fitzpatrick II-VI represented. Rooibos tea (South African red bush) has antioxidant and anti-inflammatory properties; topical rooibos preparations used for hormonal skin.',
    traditionalNotes: 'Marula oil (from marula tree) traditionally used by Zulu and Swati women for skin and hair; excellent emollient for menopausal dryness.',
    menopauseNotes: 'Ubuntu philosophy of community support extends to menopause — collective knowledge sharing around natural remedies and lifestyle approaches.'
  },
  'black-american': {
    specificConcerns: 'Severe PIH from hormonal acne on Fitzpatrick V-VI — addressing PIH is often as important as treating the acne itself. Research documents under-recognition of PCOS and undertreatment in Black women in American healthcare.',
    hairNotes: 'Postpartum shedding intersects with natural hair journey for many — this is a common period for transitioning to or continuing natural hairstyles. Protective styles essential.',
    menopauseNotes: 'Research shows Black women experience menopause 8.5 months earlier than white women on average (SWAN study). More frequent and severe hot flushes documented. Menopausal hair loss on 4C hair requires specific approaches.',
    systemicNotes: 'Maternal mortality and morbidity disparities in the US mean hormonal healthcare access is critical; beauty is deeply intertwined with health equity for this community.',
    productRecommendations: 'Melanin-safe brands: Black Girl Sunscreen, Shea Moisture menopausal line, SheaMoisture, Carol\'s Daughter postpartum collections'
  }
};

export function getHormonalBeautyOverview() {
  return HORMONAL_BEAUTY_OVERVIEW;
}

export function getMenstrualCycleSkinGuide(phase = null) {
  if (phase) {
    return MENSTRUAL_CYCLE_SKIN_GUIDE.phases[phase.toLowerCase().replace(/ /g, '_')] || MENSTRUAL_CYCLE_SKIN_GUIDE;
  }
  return MENSTRUAL_CYCLE_SKIN_GUIDE;
}

export function getPregnancyBeautyGuide(section = null) {
  if (section === 'safe') return PREGNANCY_BEAUTY_GUIDE.safeIngredients;
  if (section === 'avoid') return PREGNANCY_BEAUTY_GUIDE.avoidIngredients;
  if (section === 'changes') return PREGNANCY_BEAUTY_GUIDE.pregnancySkinChanges;
  return PREGNANCY_BEAUTY_GUIDE;
}

export function getMenopauseBeautyGuide(concern = null) {
  if (concern) {
    const c = concern.toLowerCase();
    if (c.includes('collagen') || c.includes('sagging')) return MENOPAUSE_PERIMENOPAUSE_BEAUTY.skinChanges.collagen_loss;
    if (c.includes('dry')) return MENOPAUSE_PERIMENOPAUSE_BEAUTY.skinChanges.dryness;
    if (c.includes('flush') || c.includes('hot')) return MENOPAUSE_PERIMENOPAUSE_BEAUTY.skinChanges.flushing_hot_flashes;
    if (c.includes('pigment') || c.includes('spot')) return MENOPAUSE_PERIMENOPAUSE_BEAUTY.skinChanges.pigmentation;
    if (c.includes('hair') || c.includes('thin')) return MENOPAUSE_PERIMENOPAUSE_BEAUTY.hairChanges;
    if (c.includes('routine')) return MENOPAUSE_PERIMENOPAUSE_BEAUTY.menopausalRoutine;
  }
  return MENOPAUSE_PERIMENOPAUSE_BEAUTY;
}

export function getPCOSBeautyGuide(concern = null) {
  if (concern) {
    const c = concern.toLowerCase();
    if (c.includes('acne')) return PCOS_BEAUTY_GUIDE.pcosAcne;
    if (c.includes('hair') && (c.includes('face') || c.includes('body') || c.includes('hirsu'))) return PCOS_BEAUTY_GUIDE.pcosHirsutism;
    if (c.includes('hair') && c.includes('loss')) return PCOS_BEAUTY_GUIDE.pcosHairLoss;
    if (c.includes('lifestyle') || c.includes('diet') || c.includes('supplement')) return PCOS_BEAUTY_GUIDE.pcosLifestyleBeauty;
  }
  return PCOS_BEAUTY_GUIDE;
}

export function getThyroidBeautyGuide(type = null) {
  if (type && type.toLowerCase().includes('hypo')) return THYROID_BEAUTY_GUIDE.hypothyroidism;
  if (type && type.toLowerCase().includes('hyper')) return THYROID_BEAUTY_GUIDE.hyperthyroidism;
  return THYROID_BEAUTY_GUIDE;
}

export function getEthnicHormonalBeauty(communityId) {
  const key = communityId.replace('-', '_').replace('-', '_');
  const map = {
    west_african: ETHNIC_HORMONAL_BEAUTY['west-african'],
    south_asian: ETHNIC_HORMONAL_BEAUTY['south-asian'],
    caribbean: ETHNIC_HORMONAL_BEAUTY['caribbean'],
    arab: ETHNIC_HORMONAL_BEAUTY['arab'],
    latina: ETHNIC_HORMONAL_BEAUTY['latina'],
    east_asian: ETHNIC_HORMONAL_BEAUTY['east-asian'],
    east_african: ETHNIC_HORMONAL_BEAUTY['east-african'],
    south_african: ETHNIC_HORMONAL_BEAUTY['south-african'],
    black_american: ETHNIC_HORMONAL_BEAUTY['black-american']
  };
  return map[key] || map[communityId] || null;
}

export const HORMONAL_BEAUTY_STATS = {
  moduleId: 'hormonal_beauty_guide',
  version: '1.0.0',
  topics: ['menstrual cycle skincare', 'hormonal acne', 'pregnancy beauty safety', 'melasma', 'stretch marks', 'postpartum hair shedding', 'menopause skin changes', 'PCOS beauty', 'thyroid and beauty', 'multicultural hormonal concerns'],
  communitiesSupported: 9,
  keyFacts: [
    'Skin loses up to 30% collagen in first 5 years of menopause',
    'PCOS affects an estimated 22-52% of South Asian women',
    'Retinoids are teratogenic and must be completely avoided in pregnancy',
    'Postpartum hair shedding peaks at 3-4 months and is fully reversible',
    'Black women experience menopause 8.5 months earlier on average (SWAN study)',
    'Spearmint tea 2 cups daily has clinical evidence for reducing free testosterone in PCOS',
    'Hypothyroidism causes characteristic lateral eyebrow thinning'
  ]
};
