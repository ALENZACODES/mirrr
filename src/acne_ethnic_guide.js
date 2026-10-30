// acne_ethnic_guide.js
// Comprehensive acne guide covering causes, types, treatments, and cultural approaches
// across 9 ethnic communities. Fully self-contained ESM module — no imports.

// ---------------------------------------------------------------------------
// UNIVERSAL ACNE KNOWLEDGE
// ---------------------------------------------------------------------------

export const UNIVERSAL_ACNE = {
  overview: `Acne vulgaris is a chronic inflammatory condition of the pilosebaceous unit — the hair follicle
and its attached sebaceous (oil) gland. It affects people of every ethnicity, skin tone, and age,
but its presentation, consequences, and culturally informed treatments vary significantly across
communities. Understanding both the universal biology and the community-specific context is
essential for effective, culturally competent acne care.`,

  types: {
    comedonal: {
      name: 'Comedonal Acne',
      description: `The mildest form, comedonal acne forms when pores become clogged with dead skin cells
and excess sebum (oil). No bacteria or significant inflammation is involved at this stage.`,
      subtypes: {
        open_comedones: {
          name: 'Open Comedones (Blackheads)',
          how_they_form: `The pore opening remains open. The sebum oxidizes on contact with air,
turning the plug dark brown or black. The color is NOT dirt — it is oxidized melanin and lipids.`,
          appearance: 'Flat or slightly raised dark spots, usually on the nose, chin, and forehead.',
          treatment: 'Salicylic acid BHA exfoliants, retinoids, extraction by a licensed esthetician.',
        },
        closed_comedones: {
          name: 'Closed Comedones (Whiteheads)',
          how_they_form: `The pore opening is closed over by a thin layer of skin, trapping the sebum
and dead cells inside. The plug appears as a small white or skin-colored bump.`,
          appearance: 'Tiny raised bumps, skin-colored or white-tipped, often in clusters.',
          treatment: 'Retinoids are most effective. Gentle BHAs, niacinamide to prevent formation.',
        },
      },
    },

    inflammatory: {
      name: 'Inflammatory Acne',
      description: `When C. acnes bacteria colonize a clogged pore, the immune system responds with
inflammation. This causes redness, warmth, swelling, and pain — the hallmarks of inflammatory acne.`,
      subtypes: {
        papules: {
          name: 'Papules',
          description: 'Small, raised, red or pink bumps under 5mm. Tender to the touch. No visible pus.',
          treatment: 'Benzoyl peroxide, topical antibiotics, niacinamide to calm inflammation.',
        },
        pustules: {
          name: 'Pustules',
          description: 'Like papules but with a visible white or yellow pus-filled center. The classic "pimple."',
          treatment: 'Benzoyl peroxide, salicylic acid spot treatments. Do not pop — increases PIH risk.',
        },
        nodules: {
          name: 'Nodules',
          description: `Large, solid, painful lumps deep in the skin. Larger than 5mm. No pus visible.
Can last weeks to months. High risk for permanent scarring.`,
          treatment: 'Oral antibiotics, isotretinoin (Accutane), intralesional cortisone injection from a derm.',
        },
      },
    },

    cystic: {
      name: 'Cystic Acne',
      description: `The most severe form. Cysts are large, pus-filled, soft lesions deep in the skin.
They are painful, can interconnect under the skin, and carry the highest risk of permanent scarring
and significant post-inflammatory hyperpigmentation (PIH). Cystic acne requires dermatologist care.`,
      causes: `Combination of excess sebum production, dead skin cell buildup, bacterial overgrowth,
and strong inflammatory immune response. Strongly linked to hormonal fluctuations.`,
      treatment: `Oral isotretinoin is the gold standard for severe cystic acne. Oral antibiotics,
spironolactone (for hormonal cystic acne in women), and intralesional cortisone injections
for individual cysts. Over-the-counter products are insufficient for cystic acne.`,
      scarring_risk: 'Extremely high. PIH risk is highest in Fitzpatrick skin types IV-VI.',
    },

    hormonal: {
      name: 'Hormonal Acne',
      description: `Acne driven by androgen hormones (testosterone, DHT) that increase sebum production
and cause follicular hyperkeratinization. Particularly significant in women during puberty,
menstrual cycles, pregnancy, perimenopause, and in those with PCOS.`,
      pattern: {
        face_map: {
          lower_face: 'Jawline, chin, lower cheeks — the classic hormonal zone. Cysts common here.',
          forehead: 'T-zone acne, often comedonal. Can be dietary or stress-related.',
          cheeks: 'Can indicate digestive issues (TCM perspective) or environmental factors.',
          nose: 'Blackheads common here. Hormonal and dietary connections.',
        },
        cycle_timing: `Hormonal acne typically flares 7-10 days before menstruation as progesterone
rises and estrogen falls, then improves after menstruation begins as estrogen rises again.`,
        treatment: `Combined oral contraceptives (some types), spironolactone, inositol supplements,
anti-androgen approaches. Topical treatments help but don't address the root hormonal cause.`,
      },
    },

    fungal: {
      name: 'Fungal Acne (Malassezia Folliculitis)',
      description: `Not true acne, but frequently misdiagnosed as it. Caused by overgrowth of Malassezia
yeast (naturally present on skin) in hair follicles. Often worsened by heat, humidity, sweat,
and use of heavy occlusive oils or butter-based products.`,
      appearance: `Uniform, itchy, small bumps — often in rows or clusters. Usually on forehead,
chest, back, and shoulders. Does NOT respond to typical acne treatments.`,
      diagnosis: `Key clues: itchiness (true acne usually doesn't itch), clusters of identical bumps,
worsening with oily products or in hot weather, failure to respond to acne treatments.`,
      treatment: `Antifungal treatments: ketoconazole shampoo used as a face/body wash, zinc pyrithione
shampoo, oral antifungals in severe cases. Avoid heavy occlusive oils on affected areas.`,
      note: `Particularly relevant for communities using heavy pomades, coconut oil, shea butter,
or other occlusive products on skin. Worth ruling out before treating as bacterial acne.`,
    },
  },

  active_ingredients: {
    salicylic_acid: {
      name: 'Salicylic Acid (BHA)',
      type: 'Beta-hydroxy acid (oil-soluble exfoliant)',
      
      how_it_works: `Oil-soluble, so it penetrates into the sebaceous follicle. Dissolves the
"glue" holding dead skin cells together (desmosomes). Unclogs pores from inside.
Anti-inflammatory properties. Mild antibacterial.`,
      best_for: 'Comedonal acne (blackheads, whiteheads), oily skin, clogged pores.',
      not_ideal_for: 'Dry or sensitive skin if used too frequently. Avoid during pregnancy.',
      pih_consideration: `Generally well tolerated across all skin tones. Mild enough that it can
be used by those with darker skin without significant irritation-triggered PIH.`,
      formats: 'Cleansers, toners, serums, spot treatments, body washes.',
    },

    benzoyl_peroxide: {
      name: 'Benzoyl Peroxide (BPO)',
      type: 'Antimicrobial / keratolytic',
      concentration_range: '2.5% - 10% OTC; higher in prescriptions',
      how_it_works: `Releases free oxygen radicals that kill C. acnes bacteria (which are anaerobic —
they cannot survive in oxygen). Also mildly keratolytic (loosens skin cells). Unlike antibiotics,
C. acnes cannot develop resistance to BPO.`,
      best_for: 'Inflammatory acne, pustules, papules. Prevention of antibiotic resistance.',
      fabric_bleaching: {
        why_it_bleaches: `BPO is an oxidizing agent. When it comes into contact with fabric dyes,
it breaks down the chromophore bonds in the dye molecules — permanently decolorizing them.
Even trace amounts transferred from skin can bleach pillowcases, towels, and clothing.`,
        prevention: [
          'Use white or off-white pillowcases, sheets, and towels when using BPO',
          'Apply BPO only at night; change to white pillowcases',
          'Wait for BPO to fully absorb before lying down',
          'Keep a dedicated "BPO towel" (white) for face drying',
          'Wash off BPO-containing wash immediately — do not leave on clothing',
          'Store white or dedicated washcloths near the sink when using BPO wash',
        ],
        bedding_care: `This is a practical concern for acne care that many dermatologists overlook.
Families who share towels or have colored bedding should plan around BPO use to avoid
ruining fabric. Using inexpensive white sheets during BPO treatment is recommended.`,
      },
      pih_consideration: `Can cause irritation and dryness, which may trigger PIH in darker skin
tones if used too aggressively. Start with 2.5% (as effective as 10% with less irritation).
Lower concentrations are better for Fitzpatrick IV-VI skin.`,
    },

    niacinamide: {
      name: 'Niacinamide (Vitamin B3)',
      type: 'Anti-inflammatory / sebum-regulating / brightening',
      concentration_range: '2% - 10%; 5% is the sweet spot for most',
      how_it_works: `Multiple mechanisms: reduces sebum production (inhibits sebocyte activity),
anti-inflammatory (calms redness), improves skin barrier function, inhibits melanin transfer
from melanocytes to keratinocytes (which helps with PIH fading), antioxidant.`,
      best_for: `All acne types, especially for skin prone to PIH. The anti-PIH effect makes it
particularly valuable for darker skin tones (Fitzpatrick IV-VI).`,
      pih_consideration: `One of the safest and most beneficial ingredients for deeper skin tones.
Reduces PIH formation AND fades existing spots. Pair with acne treatment for double benefit.`,
      combinations: 'Works well with salicylic acid, retinoids, azelaic acid. Generally very compatible.',
    },

    retinoids: {
      name: 'Retinoids (Retinol, Tretinoin, Adapalene, Tazarotene)',
      type: 'Vitamin A derivatives — cell turnover accelerators',
      concentration_range: {
        retinol: '0.025% - 1% OTC (weakest)',
        adapalene: '0.1% - 0.3% (OTC in USA/Canada at 0.1%)',
        tretinoin: '0.025% - 0.1% (prescription)',
        tazarotene: '0.05% - 0.1% (prescription, strongest)',
      },
      how_it_works: `Bind to nuclear retinoic acid receptors, altering gene expression. Normalize
follicular keratinization (stops the pore-clogging process at its source). Accelerate cell
turnover (helps PIH fade faster). Inhibit MMP enzymes (reduces inflammatory acne damage).
Stimulate collagen (helps with scarring long-term).`,
      best_for: `Comedonal acne (most effective treatment), inflammatory acne, acne scarring, PIH.
The foundational prescription-strength acne treatment.`,
      pih_risk: `Retinoid dermatitis (initial redness, flaking, irritation) can trigger PIH in
darker skin. Mitigation: start with low concentrations, apply every other night, use buffer
method (apply moisturizer first, then retinoid). Adapalene is the least irritating option.`,
      the_purge: `Initial "purge" period (weeks 4-8) where acne may temporarily worsen as
clogged pores are brought to the surface faster. This is normal and expected.`,
    },

    azelaic_acid: {
      name: 'Azelaic Acid',
      type: 'Dicarboxylic acid — multifunctional acne + PIH treatment',
      concentration_range: '10% OTC; 15-20% prescription (Finacea, Azelex)',
      how_it_works: `Antibacterial against C. acnes. Keratolytic (unclogs pores). Inhibits
tyrosinase enzyme (reduces melanin production — directly treats PIH at its source).
Anti-inflammatory. Does not cause photosensitivity.`,
      best_for: `The ideal ingredient for darker skin tones with acne + PIH. Treats acne AND
fades dark spots simultaneously without the irritation risk of higher-strength acids.`,
      pih_consideration: `Exceptional. Safe for all skin tones including during pregnancy (Category B).
One of the top recommendations for Fitzpatrick IV-VI skin dealing with acne + PIH.`,
      note: 'Underutilized but highly recommended for melanin-rich skin dealing with acne.',
    },

    sunscreen_for_acne: {
      name: 'SPF in Acne Care',
      why_essential: `UV exposure darkens PIH dramatically. Sun protection is not optional
when treating acne in darker skin — it is as important as the treatment itself.
Without SPF, PIH can persist for years longer than necessary.`,
      for_acne_prone_skin: `Look for: non-comedogenic, oil-free, matte finish, lightweight.
Mineral sunscreens (zinc oxide, titanium dioxide) are generally better tolerated.`,
      the_white_cast_problem: `Traditional zinc oxide sunscreens leave a white cast on darker
skin, which is a legitimate barrier to use. Solutions: tinted mineral SPF, newer cosmetically
elegant zinc formulas, or hybrid mineral/chemical options.`,
    },
  },

  acne_pih_pipeline: {
    title: 'The Acne → PIH Pipeline: Why Treating Acne IS Preventing PIH',
    stages: [
      {
        stage: 1,
        name: 'Active Acne Lesion',
        what_happens: `Bacteria trigger an inflammatory cascade. Melanocytes (pigment cells)
in the dermis are stimulated by the inflammation. Even before the pimple resolves,
melanin production is ramping up in response to the inflammatory signals.`,
      },
      {
        stage: 2,
        name: 'Inflammation Peak',
        what_happens: `The more inflamed the lesion (nodule > pustule > papule), the more
melanocyte stimulation. This is why picking or popping acne dramatically worsens PIH —
it extends and intensifies the inflammatory phase.`,
      },
      {
        stage: 3,
        name: 'Acne Resolves',
        what_happens: `The pimple heals, but excess melanin deposited during inflammation
remains in the skin. This is PIH — post-inflammatory hyperpigmentation. It is not a scar
(no collagen damage); it is excess pigment in the epidermis or dermis.`,
      },
      {
        stage: 4,
        name: 'PIH Persistence',
        what_happens: `Epidermal PIH (brown spots) fades over months with consistent SPF
and brightening treatments. Dermal PIH (blue-gray spots) takes much longer and may need
professional intervention. UV exposure at any stage extends PIH duration significantly.`,
      },
    ],
    prevention_hierarchy: [
      'Prevent acne from forming (cleansing, exfoliation, non-comedogenic products)',
      'Treat acne early before lesions become nodular/cystic (higher inflammation = more PIH)',
      'Never pick, pop, or squeeze lesions (mechanical damage multiplies PIH)',
      'Use SPF daily (UV darkens and prolongs PIH)',
      'Use niacinamide and/or azelaic acid during active acne treatment (prevent PIH formation)',
      'Treat PIH spots after acne is controlled (vitamin C, alpha arbutin, kojic acid, chemical peels)',
    ],
    key_message: `For people with darker skin tones (Fitzpatrick IV-VI), PIH from a single
acne lesion can last 6-18 months and be more distressing than the acne itself. This makes
PREVENTING acne — and treating it early and gently — the highest-priority skincare goal.`,
  },

  diet_and_acne: {
    title: 'Diet and Acne: What the Evidence Actually Shows',
    evidence_based: {
      high_glycemic_foods: {
        
        mechanism: `High-GI foods spike blood glucose → insulin spike → increased IGF-1
(insulin-like growth factor) → stimulates androgen production → increased sebum output.`,
        foods: 'White bread, white rice, sugary drinks, candy, processed snacks.',
        
      },
      dairy: {
        evidence_level: 'Moderate — observational studies; mechanism plausible',
        mechanism: `Cow's milk naturally contains hormones (IGF-1, progesterone) and triggers
endogenous IGF-1 production. Skim milk is more acnegenic than whole milk — possibly because
fat-removal processing concentrates whey proteins.`,
        most_implicated: 'Skim milk, whey protein supplements, ice cream.',
        
      },
      whey_protein: {
        evidence_level: 'Growing — case reports and small studies',
        mechanism: `Whey protein is a potent IGF-1 stimulator. Gym culture meets acne culture here.
Many young men experience significant acne flares coinciding with whey supplementation.`,
        alternative: 'Plant-based protein powders (pea, rice, hemp) are less acnegenic.',
      },
    },
    contested_or_minimal_evidence: {
      spicy_food: `Traditional belief in many cultures (South Asian, East Asian) that spicy food
causes acne. Limited direct evidence. May cause temporary facial flushing, which could worsen
the appearance of existing inflammation, but direct acne causation not established.`,
      chocolate: `Often cited but studies are conflicting. High-sugar, high-dairy chocolate
(milk chocolate) may worsen acne; dark chocolate less implicated. The sugar and dairy in
chocolate may be the real culprits rather than cacao itself.`,
      greasy_food: `The old "french fries cause acne" belief. External skin contact with oil
can clog pores; internal consumption of fried food has only weak evidence for acne causation.`,
    },
    practical_approach: `Given the evidence, a dietary experiment worth trying for acne-prone
individuals: reduce high-GI foods, try 4-6 weeks dairy-free, replace whey protein with plant
alternatives. Document results. Individual response varies significantly — there is no universal
acne diet, but these changes have evidence behind them and no downsides.`,
  },

  comedogenic_ratings: {
    title: 'Comedogenic Ratings and the Non-Comedogenic List',
    rating_system: `Comedogenic ratings (0-5) were established through rabbit ear assays
in the 1970s-80s. While imperfect (rabbit skin ≠ human facial skin), they remain a useful
guide. Ratings of 0-2 are generally safe; 3+ carries meaningful risk for acne-prone skin.`,
    high_comedogenic_ingredients: [
      { ingredient: 'Coconut oil', rating: 4, note: 'Popular but highly comedogenic for most people' },
      { ingredient: 'Wheat germ oil', rating: 5, note: 'Highest rating' },
      { ingredient: 'Flaxseed oil', rating: 4, note: 'Often marketed as skin-beneficial but clogs pores' },
      { ingredient: 'Isopropyl myristate', rating: 5, note: 'Common emollient in drugstore products' },
      { ingredient: 'Myristyl myristate', rating: 5, note: 'Check ingredient lists carefully' },
      { ingredient: 'Butyl stearate', rating: 4, note: 'Found in many lotions' },
      { ingredient: 'Cocoa butter', rating: 4, note: 'Great for dry areas; avoid face if acne-prone' },
      { ingredient: 'Lanolin', rating: 4, note: 'Occlusive; can cause milia and comedones' },
      { ingredient: 'Algae extract', rating: 5, note: 'Surprising — often in "natural" products' },
    ],
    low_comedogenic_safe: [
      { ingredient: 'Niacinamide', rating: 0 },
      { ingredient: 'Hyaluronic acid', rating: 0 },
      { ingredient: 'Glycerin', rating: 0 },
      { ingredient: 'Zinc oxide', rating: 0, note: 'Also anti-inflammatory' },
      { ingredient: 'Salicylic acid', rating: 0 },
      { ingredient: 'Squalane (plant-derived)', rating: 1 },
      { ingredient: 'Rosehip oil', rating: 1 },
      { ingredient: 'Hemp seed oil', rating: 0 },
      { ingredient: 'Argan oil', rating: 0 },
      { ingredient: 'Jojoba oil', rating: 2, note: 'Technically a wax; generally well tolerated' },
      { ingredient: 'Centella asiatica', rating: 0 },
      { ingredient: 'Neem oil', rating: 1 },
    ],
    pomade_acne: {
      description: `Pomade acne is a specific acne type caused by application of heavy, occlusive
hair products (pomades, greases, oils, butters) near the hairline. The products migrate onto the
forehead, temples, and sometimes the neck, clogging follicles.`,
      appearance: 'Clustered blackheads and closed comedones along the hairline and forehead.',
      communities_at_risk: `Particularly relevant for Black/African American, West African, Caribbean,
and other communities where heavy hair products (shea butter pomades, grease, edge control with
occlusive oils) are commonly used.`,
      prevention: [
        'Apply hair products away from the hairline',
        'Use non-comedogenic edge controls and hair gels',
        'Cleanse forehead and hairline after styling',
        'Look for water-based styling products where possible',
        'A headband during styling helps prevent product migration',
      ],
    },
  },

  when_to_see_a_dermatologist: {
    triggers: [
      'Nodular or cystic acne (any nodule requires professional care)',
      'Acne present for more than 3 months without improvement on OTC products',
      'Significant PIH or scarring already developing',
      'Acne affecting mental health, social life, or self-esteem significantly',
      'Acne in adult women that suggests hormonal causes (PCOS, irregular cycles)',
      'Acne unresponsive to 2-3 months of consistent OTC treatment',
      'Acne on chest and back in addition to face (suggests more systemic cause)',
      'Suspected fungal acne not responding to standard treatment',
    ],
    what_to_expect: `A dermatologist can prescribe topical retinoids (tretinoin, adapalene 0.3%),
topical antibiotics (clindamycin, erythromycin), oral antibiotics (doxycycline, minocycline),
spironolactone (for hormonal acne in women), isotretinoin (Accutane) for severe cases,
in-office procedures (chemical peels, cortisone injections, lasers for PIH).`,
    cultural_note: `For communities with limited historical access to dermatology, or where
skin conditions were managed within the community, seeing a dermatologist can feel like a
big step. It is worth it. Cystic acne and severe PIH, in particular, benefit enormously from
professional care that cannot be replicated with home remedies or OTC products alone.`,
  },
};

// ---------------------------------------------------------------------------
// ETHNIC COMMUNITY ACNE GUIDES
// ---------------------------------------------------------------------------

export const ETHNIC_ACNE_GUIDES = {

  // -------------------------------------------------------------------------
  // WEST AFRICAN
  // -------------------------------------------------------------------------
  'west-african': {
    community: 'West African',
    fitzpatrick_range: 'Predominantly V-VI; some IV',
    intro: `West African skin is predominantly deep-toned (Fitzpatrick V-VI), rich in melanin,
and subject to unique acne-related concerns that differ fundamentally from the clinical picture
in lighter skin. The primary concern is rarely the acne itself — it is the post-inflammatory
hyperpigmentation (PIH) that follows. A pimple may last a week; the dark spot it leaves
can last a year or more. Understanding this shifts the entire approach to acne care.`,

    primary_concerns: {
      pih_from_acne: {
        name: 'Post-Inflammatory Hyperpigmentation (PIH) — The #1 Concern',
        description: `In Fitzpatrick V-VI skin, melanocytes are highly reactive. Any inflammation —
including acne — triggers an exaggerated melanin response. The spot left after acne heals
is often darker, larger, and more persistent than the original pimple.`,
        why_worse_in_deep_skin: `Higher baseline melanin means more melanocytes and more
melanin to be distributed. Inflammatory mediators (prostaglandins, leukotrienes) directly
stimulate melanocytes. The result: PIH from a single papule can be 5-10x the diameter of
the original lesion and can persist 6-24 months without treatment.`,
        treatment_hierarchy: [
          'Treat acne early (before it becomes inflammatory) — PIH prevention starts here',
          'NEVER pick or pop lesions — mechanical trauma multiplies PIH dramatically',
          'Daily SPF 30+ (even in dark skin — UV prolongs PIH significantly)',
          'Niacinamide 5-10% (inhibits melanin transfer — use during and after acne treatment)',
          'Azelaic acid 10-20% (treats acne + fades PIH simultaneously)',
          'Tranexamic acid (emerging evidence for PIH in dark skin)',
          'Alpha arbutin (tyrosinase inhibitor; safer than hydroquinone for long-term use)',
          'Vitamin C (L-ascorbic acid or more stable derivatives)',
          'Hydroquinone 2-4% (prescription; effective but monitor for ochronosis with prolonged use)',
          'Chemical peels (glycolic, lactic, mandelic — by an experienced provider)',
        ],
        what_not_to_do: [
          'Hydroquinone indefinitely without breaks (risk of exogenous ochronosis — paradoxical darkening)',
          'Mercury-containing skin-lightening products (toxic; still sold in some markets)',
          'Strong chemical peels without patch testing and experienced provider',
          'Skipping SPF (the single biggest mistake in PIH treatment)',
        ],
      },

      pomade_acne: {
        name: 'Pomade Acne from Hair Products',
        description: `West African hair care traditions often involve heavy oils, pomades, shea
butter, and grease applied to the scalp and hair. These products inevitably migrate to the
forehead, temples, and back of the neck, clogging follicles and creating pomade acne —
clusters of closed comedones and blackheads along the hairline.`,
        common_culprits: [
          'Petroleum jelly (Vaseline) applied to scalp or hair',
          'Heavy shea butter pomades',
          'Castor oil on scalp without care to keep it off skin',
          'Blue Magic, Dax, Royal Crown, and similar hair greases',
          'Coconut oil (comedogenic rating 4) on scalp and hair',
        ],
        management: [
          'Use a headband during hair styling to prevent product from touching forehead',
          'Cleanse forehead and hairline thoroughly after styling',
          'Switch to water-based, non-comedogenic edge controls where possible',
          'Look for styling products without petroleum, mineral oil, or coconut oil near hairline',
          'A simple salicylic acid cleanser on the forehead 2-3x/week targets pomade-related comedones',
        ],
      },

      keloid_risk: {
        name: 'Keloid Risk from Acne Scarring',
        description: `Fitzpatrick V-VI skin has a significantly higher risk of keloid formation —
where scar tissue grows beyond the original wound boundary. While ice-pick and boxcar scars
(atrophic) can also occur, keloids are a unique concern that lighter skin rarely faces.`,
        how_acne_leads_to_keloids: `Deep inflammatory lesions (nodules, cysts) that rupture or
are picked damage the dermis. In keloid-prone individuals, fibroblasts overproduce collagen
during healing, creating raised, sometimes itchy, sometimes painful keloid scars.`,
        prevention: [
          'Absolutely never pick, scratch, or attempt to drain nodules — the #1 prevention rule',
          'Treat cystic and nodular acne aggressively with a dermatologist (isotretinoin prevents nodule formation)',
          'Early treatment reduces the depth of inflammatory lesions',
        ],
        treatment_of_existing_keloids: [
          'Intralesional triamcinolone (cortisone) injections — first-line treatment',
          'Silicone gel sheets worn consistently',
          'Cryotherapy for smaller keloids',
          'Surgical excision + intralesional cortisone (surgery alone has high recurrence)',
          'Laser therapy (PDL — pulsed dye laser) for vascular keloids',
        ],
        note: `If you have a personal or family history of keloids, inform your dermatologist
before any procedure. Keloid predisposition is genetic and highly familial.`,
      },
    },

    traditional_remedies: {
      black_soap: {
        name: 'African Black Soap (Ose Dudu / Anago Soap)',
        description: `Traditional West African soap made from ash of plantain skins, cocoa pod husks,
shea tree bark, and palm kernel. Used for centuries for cleansing and skin conditions including acne.`,
        what_it_contains: `Ash provides lye (alkaline pH cleansing). Plantain is rich in
vitamins A and E. Shea components moisturize. Cocoa pod ash provides antimicrobial properties.`,
        how_it_helps_acne: [
          'Natural cleansing agents remove excess sebum without harsh sulfates',
          'Antimicrobial properties from ash and cocoa pod',
          'Vitamin content supports skin healing',
          'Anti-inflammatory properties help calm existing breakouts',
        ],
        cautions: [
          'Raw black soap can be harsh and alkaline — may disrupt skin barrier with overuse',
          'Quality varies enormously between products; authentic handmade versions differ significantly from commercial versions',
          'Start with 1-2x/week; watch for over-drying',
          'Follow with a moisturizer (skin barrier support is essential)',
          'Commercial versions (Nubian Heritage, SheaMoisture) are more standardized but modified',
        ],
        evidence_level: 'Traditional use; limited clinical trials. Anecdotally effective for many users.',
      },

      moringa: {
        name: 'Moringa (Moringa oleifera)',
        description: `Called the "miracle tree" across West Africa. Oil extracted from moringa seeds
(ben oil) has been used topically for acne-prone skin.`,
        properties: [
          'High oleic acid content (58-74%) — moderately comedogenic',
          'Contains behenic acid (antibacterial)',
          'Rich in zinc (important for acne — zinc reduces sebum and is anti-inflammatory)',
          'Anti-inflammatory flavonoids',
          'Antioxidant vitamins A, C, E',
        ],
        how_to_use: 'Moringa powder mixed with water or honey as a face mask. Moringa oil in small amounts as a treatment oil.',
        cautions: 'The oil itself has comedogenic potential for some. Powder masks are generally safer for acne-prone skin.',
        evidence_level: 'Growing evidence for anti-inflammatory and antimicrobial properties. Not a replacement for clinical treatment in moderate-severe acne.',
      },

      neem: {
        name: 'Neem (Azadirachta indica)',
        description: `Neem is used across West Africa (and much of the tropical world) for its
powerful antibacterial, antifungal, and anti-inflammatory properties. Used as neem oil, neem leaf
powder, and neem water (leaves steeped in water).`,
        active_compounds: 'Nimbin, nimbidin, azadirachtin — collectively antibacterial and anti-inflammatory.',
        how_it_helps_acne: [
          'Kills C. acnes bacteria directly',
          'Reduces inflammation (calms redness and swelling)',
          'Antifungal — useful if fungal acne component is present',
          'Low comedogenic rating (1) — generally safe for acne-prone skin',
        ],
        how_to_use: [
          'Neem oil diluted in jojoba or rosehip (1-2 drops neem per tsp carrier) — spot treatment',
          'Neem powder + honey face mask (anti-inflammatory, antibacterial)',
          'Neem leaf water as toner (steep dried leaves, strain, apply with cotton)',
        ],
        cautions: 'Strong smell. Pure neem oil can irritate — always dilute. Patch test first.',
        evidence_level: 'Good laboratory evidence for antimicrobial properties. Clinical skin studies growing.',
      },
    },

    diet_connections: {
      palm_oil: `Red palm oil is a dietary staple across West Africa. High in beta-carotene
and vitamin E (beneficial antioxidants), but also high in saturated fat. Limited evidence
that palm oil specifically worsens acne. Moderation is reasonable, but not definitively acne-causing.`,
      dairy: `Dairy consumption patterns vary — traditional West African diets are relatively
low in dairy compared to Western diets. When dairy is consumed (as part of diaspora diet),
standard dairy-acne connections apply: consider a 4-6 week dairy elimination trial if acne is persistent.`,
      high_glycemic: `Processed foods, sweetened beverages, and refined carbohydrates (increasingly
common in urbanized West African diets) follow the same insulin-IGF-1-sebum pathway
documented in other populations. A lower-GI approach may benefit those with acne.`,
    },

    treatment_approach: {
      principles: [
        'Anti-PIH must be built into every acne treatment plan from day one',
        'Gentle is better — avoid over-drying or stripping the skin (triggers more PIH)',
        'SPF is non-negotiable and as important as the acne treatment itself',
        'Prefer azelaic acid and niacinamide over more aggressive ingredients where possible',
        'Adapalene is the preferred retinoid (least irritating)',
        'Benzoyl peroxide at low concentrations (2.5%) if needed; watch for irritation',
      ],
      preferred_ingredients: ['Niacinamide 5-10%', 'Azelaic acid 10-20%', 'Salicylic acid 0.5-2%', 'Adapalene 0.1%', 'Tranexamic acid', 'Alpha arbutin', 'SPF 30+ non-comedogenic'],
      caution_ingredients: ['High-strength retinoids (start low and slow)', 'Benzoyl peroxide (use 2.5%; avoid 10%)', 'Strong AHAs (risk of irritation → PIH)', 'Hydroquinone (effective but limit to 3-month cycles)'],
    },
  },

  // -------------------------------------------------------------------------
  // SOUTH ASIAN
  // -------------------------------------------------------------------------
  'south-asian': {
    community: 'South Asian (Indian, Pakistani, Bangladeshi, Sri Lankan, Nepali)',
    fitzpatrick_range: 'III-V, with warm olive to deep brown undertones',
    

    primary_concerns: {
      ayurvedic_understanding: {
        name: 'Ayurvedic Framework for Acne: Pitta and Agni',
        description: `In Ayurveda, acne (called "Yuvanapidika" or "Mukhadooshika") is primarily
a Pitta disorder — excess fire/heat in the body manifesting in the skin. Pitta governs metabolism,
digestion, and transformation. Excess Pitta creates heat, inflammation, and sharp reactions.`,
        pitta_imbalance_triggers: [
          'Spicy, sour, and fermented foods (increase Pitta)',
          'Excess heat (summer, tropical climates)',
          'Stress and anger (emotional Pitta)',
          'Irregular meal times disrupting Agni (digestive fire)',
          'Alcohol and caffeine',
          'Midnight shifts, poor sleep (Pitta is highest 10pm-2am)',
        ],
        agni_connection: `Agni (digestive fire) is central to Ayurvedic acne theory. When Agni is
impaired ("mandagni" — low digestive fire), ama (undigested metabolic waste) accumulates and
reaches the skin through the channels (srotas). This parallels modern understanding of the
gut-skin axis. Supporting digestion is considered foundational to skin health in Ayurveda.`,
        ayurvedic_acne_care: [
          'Triphala (digestive tonic — amalaki, bibhitaki, haritaki) to clear ama',
          'Manjistha (Rubia cordifolia) — blood purifier, anti-inflammatory',
          'Neem internally (tablets/capsules) and externally',
          'Turmeric in warm water or milk (anti-inflammatory)',
          'Avoiding Pitta-aggravating foods during breakout periods',
          'Proper meal timing (eating at consistent times supports Agni)',
        ],
        integration_note: `Ayurvedic principles around digestion, stress management, and anti-inflammatory
diet align well with modern evidence on the gut-skin axis and diet-acne connections. Traditional
Ayurvedic topical treatments (neem, turmeric) have demonstrated antimicrobial and anti-inflammatory
properties in modern research.`,
      },

      pcos_and_hormonal_acne: {
        name: 'PCOS and Hormonal Acne in South Asian Women',
        
        why_south_asian_women: `South Asian individuals have a higher tendency toward insulin resistance
at lower BMIs compared to European populations. Insulin resistance drives PCOS — elevated insulin
stimulates ovarian androgen (testosterone) production → increased sebum → hormonal acne.`,
        acne_pattern: `Classic PCOS acne: jawline, chin, neck. Often cystic or deep papular.
Flares before menstruation. May be accompanied by: irregular periods, excess facial/body hair
(hirsutism), hair loss at the scalp crown, difficulty losing weight.`,
        workup_to_request: [
          'LH/FSH ratio',
          'Free and total testosterone',
          'DHEA-S',
          'Fasting insulin and glucose / HbA1c',
          'Pelvic ultrasound (for ovarian morphology)',
        ],
        treatment: [
          'Inositol (myo-inositol + D-chiro-inositol) — insulin sensitizer; evidence specifically for South Asian PCOS',
          'Metformin (if insulin resistance confirmed)',
          'Spironolactone (anti-androgen; reduces sebum and hormonal acne)',
          'Combined oral contraceptives with anti-androgenic progestins (drospirenone, cyproterone acetate)',
          'Low-glycemic diet (addresses insulin resistance at the root)',
        ],
      },

      body_acne: {
        name: 'Body Acne from Oil-Heavy Cooking Environment',
        description: `South Asian cooking involves significant use of cooking oils and high-temperature
frying. Aerosolized oil particles and steam can deposit on the skin — particularly the face, neck,
and chest of the cook. This is an underrecognized acne trigger in South Asian households.`,
        management: [
          'Use ventilation (exhaust fan, open windows) during cooking',
          'Cleanse face and neck after cooking sessions',
          'Consider a barrier (bandana or headband) if hair products are being transferred during cooking',
          'Body salicylic acid wash 2-3x/week for back and chest acne',
        ],
      },
    },

    traditional_remedies: {
      turmeric: {
        name: 'Turmeric (Haldi)',
        description: `The golden staple of South Asian kitchens has been used as a skin remedy for
millennia. "Haldi" application before weddings is a cultural ritual. For acne, turmeric paste
applied to blemishes is a widespread home remedy.`,
        active_compound: 'Curcumin — anti-inflammatory, antioxidant, antibacterial (against C. acnes).',
        
        how_to_use: [
          'Turmeric + honey mask (anti-inflammatory, antibacterial)',
          'Turmeric + neem powder + water paste as spot treatment',
          'Small amounts in warm water or milk internally (anti-inflammatory system-wide)',
        ],
        cautions: [
          'Turmeric STAINS yellow — will temporarily tint skin and permanently stain fabric',
          'Use old towels and washcloths for removal',
          'The yellow tint fades from skin within hours',
          'Curcumin has very low bioavailability when consumed; pair with black pepper (piperine) for absorption',
        ],
      },

      neem_south_asian: {
        name: 'Neem (Azadirachta indica / Nim)',
        description: `Even more deeply embedded in South Asian tradition than West Africa.
Neem is referenced in ancient Ayurvedic texts as a powerful antibacterial and skin purifier.
Neem paste, neem water, and neem oil are all used for acne.`,
        how_to_use: [
          'Fresh neem leaf paste on blemishes (traditional; highly effective in vitro)',
          'Dried neem powder + rose water mask',
          'Neem leaf water as toner/face rinse',
          'Neem oil (1-2%) in a light carrier for spot treatment',
          'Neem oil ingested as traditional internal blood purifier (evidence limited)',
        ],
      },

      multani_mitti: {
        name: 'Multani Mitti (Fuller\'s Earth Clay)',
        description: `A magnesium silicate clay traditionally used across South Asia for skin and
hair. Absorbs excess oil, mildly exfoliates, and cools the skin (Pitta-pacifying in Ayurvedic terms).`,
        how_to_use: 'Mixed with rose water, neem water, or aloe vera gel to form a paste. Applied as a weekly face mask for 10-15 minutes.',
        
        note: 'Dries the skin significantly — always follow with moisturizer. Not recommended for dry or combination skin types.',
      },
    },

    diet_and_spicy_food: {
      spicy_food_debate: `The belief that spicy food causes acne is deeply embedded in South Asian
culture — mothers across the subcontinent have warned about this for generations.
The scientific evidence is nuanced: direct acne causation from spicy food is not well established.
However, very spicy food can dilate blood vessels and increase facial flushing, which may worsen
the appearance of inflammatory acne. Some individuals also experience digestive disruption from
very spicy food, which may affect skin through the gut-skin axis. The Ayurvedic framework (Pitta
aggravation) provides a traditional explanation that broadly aligns with inflammatory mechanisms.`,
      practical_advice: `Rather than avoiding all spice, observe your personal pattern. If spicy meals
correlate with breakouts within 24-48 hours, a dietary experiment (reducing spice for 4-6 weeks)
is worth trying. Universal restriction is not evidence-based.`,
      dairy_in_south_asian_diet: `Dairy (milk, paneer, dahi/yogurt, ghee, lassi) is central to
many South Asian diets. The dairy-acne connection is moderate-evidence. Fermented dairy (dahi,
lassi) may be less acnegenic than fresh milk due to reduced IGF-1 content post-fermentation.
Ghee (clarified butter) removes milk proteins — may be less acnegenic than whole milk.`,
    },

    treatment_approach: {
      skin_tone_considerations: `Olive to warm brown South Asian skin (Fitzpatrick III-V) is prone
to PIH but typically less severely than Fitzpatrick V-VI. Retinoids are well tolerated at standard
concentrations with gradual introduction. BPO at 2.5-5% is generally suitable.`,
      pih_treatment: ['Niacinamide 5%', 'Vitamin C (stable forms: ascorbyl glucoside, sodium ascorbyl phosphate)', 'Azelaic acid 10-20%', 'SPF 30+ daily (essential)'],
      preferred_approach: [
        'Treat hormonal component first if PCOS suspected (internal treatment addresses root cause)',
        'Adapalene 0.1% retinoid for comedonal component',
        'Niacinamide serum daily for PIH prevention',
        'Salicylic acid cleanser 2-3x/week',
        'SPF 30+ non-comedogenic daily',
        'Traditional remedies (neem, turmeric) as adjuncts, not replacements for clinical treatment in moderate-severe acne',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // CARIBBEAN
  // -------------------------------------------------------------------------
  'caribbean': {
    community: 'Caribbean (Afro-Caribbean, Indo-Caribbean, Mixed Caribbean)',
    fitzpatrick_range: 'III-VI, highly diverse; Afro-Caribbean predominantly V-VI',
    intro: `The Caribbean encompasses remarkable ethnic diversity — Afro-Caribbean descendants of the
African diaspora, Indo-Caribbean descendants of South Asian indentured laborers, Chinese-Caribbean,
Mixed Caribbean, and indigenous Amerindian communities. Acne care must account for this diversity
in skin tone. The tropical climate — heat, humidity, sweat, and UV intensity — creates a distinct
acne environment unique to the Caribbean context.`,

    primary_concerns: {
      tropical_climate_acne: {
        name: 'Tropical Climate and Acne: Heat, Humidity, and Sweat',
        description: `The Caribbean climate is one of the most challenging environments for acne-prone
skin. Year-round heat and humidity create a perfect storm for acne development.`,
        mechanisms: [
          'Heat increases sebum production — oil glands work harder in higher temperatures',
          'Sweat mixes with sebum and creates an occlusive layer over pores',
          'Humidity slows evaporation of sweat — prolonged skin occlusion',
          'Increased sweating in skin folds (under jaw, around nose) can worsen breakouts',
          'Fungal acne (malassezia) thrives in heat and humidity — often misdiagnosed as regular acne',
          'Heavy sunscreens needed for UV protection but many are comedogenic',
        ],
        management: [
          'Lightweight, non-comedogenic, oil-free formulas for everything (moisturizer, SPF, makeup)',
          'Mineral sunscreen (zinc oxide) in lightweight fluid formula',
          'Rinse face with cool water after sweating',
          'Avoid heavy occlusive creams in tropical humidity',
          'If fungal acne suspected, trial ketoconazole shampoo as face/body wash',
          'Salicylic acid body wash for back and chest acne exacerbated by sweat',
        ],
      },

      afro_caribbean_pih: {
        name: 'Afro-Caribbean Acne and PIH',
        description: `Afro-Caribbean individuals with deeper skin tones face the same PIH challenges
as West African communities. The post-acne dark spot is often the primary concern, and in the
Caribbean context, year-round UV exposure makes SPF even more critical for PIH management.`,
        uv_and_pih_in_tropics: `UV intensity in the Caribbean is extreme year-round. Without
adequate SPF, PIH from acne lesions is dramatically prolonged. What might fade in 6 months
with SPF can persist 18-24 months without it. This makes sunscreen a clinical priority,
not a cosmetic one.`,
        treatment: 'Same priority stack as West African community: prevent acne → prevent inflammation → prevent PIH → treat PIH with SPF + brightening actives.',
      },

      hormonal_acne_caribbean: {
        name: 'Hormonal Acne in Caribbean Women',
        
        approach: 'Same as general hormonal acne management. If irregular periods, excess hair growth, or weight difficulty coexist with jawline acne, pursue PCOS workup.',
      },
    },

    traditional_remedies: {
      cerasee: {
        name: 'Cerasee (Bitter Melon / Momordica charantia)',
        description: `Cerasee is perhaps the most iconic Caribbean traditional medicine plant.
The bitter vine grows throughout the Caribbean and is used as a tea, skin wash, and compress
for everything from diabetes to skin conditions including acne.`,
        traditional_use: `A "cerasee bath" (strong tea applied to skin) is a traditional Jamaican
and Caribbean remedy for acne, eczema, and skin rashes. Drinking cerasee tea is also a
traditional "blood purifier" for skin conditions.`,
        active_compounds: [
          'Charantin (hypoglycemic — lowers blood sugar; relevant to acne-sugar-insulin connection)',
          'Momordicin (bitter compounds with antibacterial properties)',
          'Vitamin C (antioxidant)',
          'Iron and zinc (mineral support for skin)',
        ],
        
        how_to_use: [
          'Steep 5-6 leaves in 2 cups boiling water for 10 minutes; allow to cool; apply to skin',
          'Use as a facial rinse or apply with cotton pad to breakout areas',
          'Drink as tea for potential internal benefits (blood sugar regulation)',
        ],
        cautions: 'Internal consumption: avoid during pregnancy (uterine contractions). Not for internal use in children. May lower blood sugar — monitor if diabetic.',
      },

      sea_salt_ocean: {
        name: 'Sea Salt / Ocean Water and Acne',
        description: `Caribbean people have long observed anecdotal benefits of swimming in the
ocean for acne. Many report clearer skin after time at the beach.`,
        potential_mechanisms: [
          'Magnesium in seawater may have anti-inflammatory effects on skin',
          'Salt can mildly dry out pustular lesions',
          'Zinc in seawater is antibacterial',
          'UV (with SPF — important caveat) can have mild antibacterial effects on surface bacteria',
          'The drying effect of salt water reduces excess sebum temporarily',
        ],
        evidence_level: 'Anecdotal; no controlled clinical trials. Magnesium skin absorption studies exist but not acne-specific.',
        cautions: [
          'Do NOT forgo SPF when swimming — UV will worsen PIH dramatically in darker skin',
          'Salt water can be drying — follow with a gentle moisturizer after swimming',
          'Chlorinated pool water does not have the same purported benefits as sea water',
          'Heavy sweating post-swim without cleansing can worsen acne',
        ],
      },

      neem_caribbean: {
        name: 'Neem in Caribbean Context',
        description: `Neem grows throughout the Caribbean and is embedded in Caribbean folk medicine,
particularly in Trinidad, Jamaica, and other islands with significant South Asian heritage
from the Indo-Caribbean population. Same properties as described in South Asian section.`,
      },

      aloe_caribbean: {
        name: 'Aloe Vera — Caribbean Traditional Use',
        description: `Aloe barbadensis grows prolifically in the Caribbean and has been used
for skin conditions for generations. Fresh aloe gel from the plant is the preferred form.`,
        how_it_helps_acne: [
          'Aloin and emodin compounds: antibacterial against C. acnes',
          'Cooling and anti-inflammatory for active breakouts',
          'Acemannan: supports wound healing post-acne',
          'Salicylic acid naturally occurring in small amounts (gentle exfoliation)',
        ],
        how_to_use: 'Fresh gel from leaf (cut, scrape, apply directly) is most potent. Commercial aloe gels vary widely in potency and additives.',
      },
    },

    treatment_approach: {
      climate_adapted: [
        'Use ultra-lightweight, water-gel formulas for moisturizer in humid climate',
        'Gel-based or foam cleansers (not creamy) for oily tropical skin',
        'Non-comedogenic mineral SPF — apply even on cloudy days in the tropics',
        'For Afro-Caribbean skin: niacinamide + azelaic acid for dual acne+PIH treatment',
        'Adapt to seasons: more salicylic acid during hottest months; more barrier support when AC-heavy environments dry skin',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // ARAB
  // -------------------------------------------------------------------------
  'arab': {
    community: 'Arab (Levantine, Gulf, North African, Egyptian)',
    fitzpatrick_range: 'III-V, with warm golden to olive-brown undertones',
    intro: `Arab communities span an enormous geographic range — from the Gulf to the Maghreb to the
Levant — with corresponding variation in skin tone, climate, and cultural practices. Common threads
include rich traditional medicine traditions (Unani, Tibb Nabawi / Prophetic Medicine), cultural
beauty standards that place high value on clear, luminous skin, and growing awareness of
ingredient compatibility with Halal principles in skincare.`,

    primary_concerns: {
      cultural_beauty_pressure: {
        name: 'Cultural Beauty Pressure and Psychological Impact of Acne',
        description: `Arab culture places significant emphasis on skin beauty and appearance.
Wedding culture, social gatherings, and concepts of personal honor and family appearance
create substantial psychological pressure around skin conditions. Acne can have profound
effects on mental health, confidence, and social participation in Arab communities.`,
        
        recommendation: `Address the mental health dimension alongside the physical one. Acknowledge
that acne is a medical condition, not a hygiene failure or character flaw. Community education
is important — acne is not caused by "not washing enough."`,
      },

      halal_skincare: {
        name: 'Halal Skincare for Acne: Alcohol and Other Considerations',
        description: `Some Muslim Arab individuals prefer or require Halal-certified skincare,
which excludes certain ingredients. The most relevant for acne care is alcohol.`,
        alcohol_in_skincare: {
          types_of_alcohol: {
            drying_alcohols: ['Ethanol (ethyl alcohol)', 'Denatured alcohol (SD alcohol)', 'Isopropyl alcohol'],
            fatty_alcohols_halal_friendly: ['Cetyl alcohol', 'Stearyl alcohol', 'Cetearyl alcohol'],
          },
          halal_perspective: `The permissibility of alcohol in skincare is debated in Islamic jurisprudence.
Some scholars permit topical use of non-intoxicating amounts; others require avoidance of all
ethanol-based products. Fatwa opinions vary by school of thought (madhab) and by geography.`,
          practical_note: `Many conventional acne toners, astringents, and BPO washes contain significant
alcohol. For those who prefer to avoid alcohol-based products: water-based formulations of the same
actives (salicylic acid, niacinamide, benzoyl peroxide) are available and equally effective.
The active ingredient matters; the alcohol is merely a delivery vehicle.`,
          alcohol_free_alternatives: [
            'Cosrx BHA (salicylic acid) — water-based',
            'Paula\'s Choice BHA Liquid (contains small amount; water-based versions available)',
            'Niacinamide serums — naturally alcohol-free',
            'Azelaic acid creams/gels — typically alcohol-free',
            'Cetaphil and CeraVe lines — generally alcohol-free',
          ],
        },
        porcine_ingredients: `Some acne products contain porcine-derived ingredients (hydrolyzed collagen from pork,
some gelatin capsules). Halal-certified or plant-based alternatives exist for all common
skincare ingredients. Reading ingredient labels for porcine sources is worthwhile for observant Muslims.`,
      },

      diet_arab_community: {
        name: 'Diet-Acne Connections in Arab Culture',
        description: `Traditional Arab diet varies significantly by region, but several common
elements are relevant to acne.`,
        dairy: `Arab cuisine uses significant dairy — labneh (strained yogurt), halloumi, feta,
ayran, and fresh cheeses. Fermented forms (labneh, yogurt) may be less acnegenic than
fresh milk. The standard dairy elimination trial applies.`,
        high_glycemic_staples: `White rice, white bread (khubz), baklava and sweet pastries, and
sweetened tea are common in Arab diets. These high-GI foods follow the insulin-IGF-1 pathway
to increased sebum. A lower-GI approach (whole grains, legumes, less sugar) may benefit acne.`,
        olive_oil: `Mediterranean Arab diet is rich in olive oil — a low-comedogenic (rating 2)
oil with anti-inflammatory oleocanthal. Olive oil is generally not an acne trigger.`,
        spices_and_herbs: `Cumin, coriander, cinnamon, turmeric — many traditional Arab spices
have anti-inflammatory properties. Minimal evidence they worsen acne; some evidence they may
support skin health internally.`,
      },
    },

    traditional_remedies: {
      black_seed_oil: {
        name: 'Black Seed Oil / Nigella Sativa (Habba Sawda / Kalonji)',
        description: `Mentioned in Prophetic Hadith as "a cure for every disease except death,"
black seed (Nigella sativa) is the most important traditional remedy in Arab and Islamic medicine.
Its oil is widely used both internally and topically for acne.`,
        active_compound: 'Thymoquinone — the primary active; anti-inflammatory, antioxidant, antibacterial.',
        
        how_to_use: [
          'Diluted black seed oil (1-2 drops in a carrier like jojoba) as spot treatment',
          'Black seed oil + honey mask (anti-inflammatory combination)',
          'Internally as capsules (traditional "blood purifier" for skin)',
        ],
        cautions: [
          'Strong, distinctive smell',
          'May cause sensitivity in some individuals — patch test',
          'Can be comedogenic in large amounts — use sparingly on acne-prone skin',
          'Stains fabric (deep amber oil)',
        ],
      },

      ghassoul_clay: {
        name: 'Ghassoul Clay (Rhassoul Clay)',
        description: `A mineral-rich clay mined from the Atlas Mountains of Morocco, used in Moroccan
and North African beauty traditions for centuries. The traditional hammam (bath house) includes
ghassoul clay as a skin purifying treatment.`,
        properties: [
          'High silica, magnesium, potassium content',
          'Exceptional oil absorption (higher than kaolin, French green clay)',
          'Mild pH — less drying than other clays',
          'Superfine texture — less scratching',
          'Removes dead skin cells without mechanical abrasion',
        ],
        how_to_use: 'Mix ghassoul powder with rose water, green tea, or plain water to a spreadable paste. Apply to face for 5-10 minutes. Rinse thoroughly. Use once weekly as a deep-cleansing mask.',
        
        as_weekly_prevention: `Weekly ghassoul clay mask is a reasonable preventive strategy for oily,
acne-prone skin — removes excess sebum, mildly exfoliates, and controls oil accumulation
in pores between actives-based treatments.`,
      },

      rose_water: {
        name: 'Rose Water (Ma\' al Ward)',
        description: `Rose water has been distilled and used across the Arab and Persian world for
over 1000 years. It is a skin toner and preparation for other treatments.`,
        properties: `Anti-inflammatory, mildly astringent, antioxidant. pH approximately 4.0-4.5 —
suitable as a facial toner.`,
        for_acne: 'Calms redness and inflammation. Good base for mixing traditional masks. Gentle enough for sensitive skin.',
        note: 'Rose water alone is not sufficient for acne treatment but is a gentle, traditional supporting ingredient.',
      },

      neem_arab: {
        name: 'Neem in Arab Medicine',
        description: `While neem is more central to South Asian and West African traditions, it has
been incorporated into Arab natural medicine. Available in Arab pharmacies as neem oil,
powder, and in formulated products.`,
      },
    },

    treatment_approach: {
      skin_considerations: `Arab skin ranging from Fitzpatrick III-V generally tolerates standard
acne treatments well. PIH is a concern especially in the V range. BPO at 5% is usually appropriate.
Retinoids well tolerated with gradual introduction.`,
      halal_formulation_preference: `If seeking Halal-certified formulas, CeraVe, Neutrogena, and
many Korean beauty brands offer alcohol-free, clearly-labeled formulations of key actives.
Certified Halal brands specifically formulated for Muslim consumers are available online.`,
      preferred_ingredients: ['Black seed oil (evidence-based traditional option)', 'Ghassoul clay (weekly oil control)', 'Niacinamide 5%', 'Azelaic acid', 'Adapalene', 'SPF 30+'],
    },
  },

  // -------------------------------------------------------------------------
  // LATINA
  // -------------------------------------------------------------------------
  'latina': {
    community: 'Latina / Latinx (Mexican, Central American, South American, Caribbean Latina)',
    fitzpatrick_range: 'II-V, extremely diverse; mestiza skin typically III-IV',
    

    primary_concerns: {
      pcos_latina: {
        name: 'PCOS and Hormonal Acne in Latina Women',
        
        acne_manifestation: `Classic hormonal acne: deep cystic lesions on jawline and chin,
worsening before menstruation, often accompanied by excess facial hair and irregular periods.`,
        cultural_barrier: `PCOS is underdiagnosed in Latina communities due to multiple factors:
less routine healthcare access, language barriers in some communities, cultural stigma around
"hormonal" or reproductive health issues, and medical literature historically under-representing
Latina women in PCOS research.`,
        treatment: [
          'Myo-inositol supplementation (specifically studied in insulin-resistant PCOS)',
          'Low-glycemic diet (particularly relevant given high-carb traditional dietary patterns)',
          'Spironolactone for anti-androgen effect on acne',
          'Combined OCP with anti-androgenic progestin if appropriate',
        ],
      },

      pih_in_latina_skin: {
        name: 'PIH Treatment in Warm-Undertoned Skin',
        description: `Medium to olive Latina skin (Fitzpatrick III-IV) develops PIH that appears
as warm brown to reddish-brown spots rather than the blue-gray PIH of deeper skin or the
pink/red post-acne marks of fair skin. This warm-toned PIH responds well to certain actives.`,
        best_for_latina_pih: [
          'Vitamin C (L-ascorbic acid or stabilized forms) — excellent for warm-brown PIH',
          'Niacinamide 5% — prevents formation and fades existing spots',
          'Alpha arbutin — inhibits tyrosinase; well tolerated on olive skin',
          'Kojic acid — derived from fermentation; tyrosinase inhibitor',
          'Azelaic acid — dual acne + PIH action',
          'Chemical exfoliation: mandelic acid (gentle AHA, well suited for Latin skin tones)',
          'SPF 30+ daily (non-negotiable)',
        ],
      },
    },

    traditional_remedies: {
      nopal: {
        name: 'Nopal Cactus (Opuntia ficus-indica)',
        description: `Nopal is a pillar of Mexican cuisine and traditional medicine. The cactus pad
(penca) is eaten and also applied topically for skin conditions including acne.`,
        internal_use: `Nopal reduces blood glucose spikes (high fiber, mucilage slows glucose
absorption) — directly relevant to the insulin-acne connection. Eating nopal regularly may
help regulate blood sugar and thereby reduce hormonally-driven acne.`,
        topical_use: [
          'Fresh nopal gel (from the pad) applied as a soothing mask — cooling, anti-inflammatory',
          'Nopal contains betalains (anti-inflammatory), vitamins C and E (antioxidant)',
          'Commercial nopal-based face masks available',
        ],
        
      },

      aloe_latina: {
        name: 'Aloe Vera / Sábila',
        description: `Called "sábila" in Spanish, aloe vera is perhaps the most universally used
traditional remedy across all Latin American communities. Every abuela has an aloe plant.
The fresh gel is applied directly to acne, sunburn, and skin irritation.`,
        how_it_helps: 'Anti-inflammatory, antibacterial, wound-healing (acemannan). Same properties as described for Caribbean use.',
        abuelas_wisdom: '"Ponle sábila" (put aloe on it) is the answer to almost every skin problem across Latin America. The good news: it actually works for acne — soothing, antibacterial, and anti-inflammatory.',
      },

      marigold_cempasuchil: {
        name: 'Marigold / Cempasúchil (Tagetes erecta)',
        description: `The marigold — deeply associated with Día de los Muertos and Mexican culture —
has a parallel life as a medicinal plant. Marigold flower infusions and poultices are used
for skin inflammation and acne.`,
        active_compounds: 'Lutein (antioxidant), quercetin (anti-inflammatory), calendulin (antibacterial).',
        note: `Note: Mexican marigold (Tagetes erecta / cempasúchil) is different from the Calendula
officinalis used in European herbal medicine, though both are in the Asteraceae family.
Calendula has more clinical research; Tagetes has more traditional use in Mexico.`,
        how_to_use: 'Dried flowers steeped as tea; cooled infusion applied as toner. Poultice of fresh or rehydrated flowers on blemishes.',
        cautions: 'Asteraceae family allergy — those allergic to ragweed, chrysanthemum, or related flowers should patch test or avoid.',
      },

      apple_cider_vinegar: {
        name: 'Apple Cider Vinegar (Vinagre de Manzana)',
        description: `ACV for acne is a widespread remedy across many Latina communities and beyond.
It is used as a diluted toner, spot treatment, and dietary supplement for skin health.`,
        rationale: `ACV contains acetic acid (antimicrobial), malic acid (mild AHA exfoliant),
and trace minerals. Theory: the acidic pH kills bacteria and mildly exfoliates.`,
        
        safe_use: [
          'Always dilute: 1 part ACV to 3-4 parts water (minimum)',
          'Apply with cotton pad, leave on briefly (1-2 min), rinse well',
          'Do not apply undiluted — can cause chemical burns',
          'Patch test first — acetic acid can irritate sensitive skin',
          'PIH-prone skin should be cautious — irritation from ACV can trigger PIH',
        ],
        verdict: `Probably mildly beneficial for some; potentially irritating for others. Not a
replacement for evidence-based acne treatment but a reasonable mild adjunct when used safely.`,
      },

      granitos_family_remedies: {
        name: '"Granitos" — Family Remedies Passed Through Generations',
        description: `"Granitos" (little grains/pimples) is how acne is referred to familiarly
in many Latin American households. The family remedy culture means most Latina women have
inherited a repertoire of skin treatments from mothers and grandmothers.`,
        common_remedies: [
          '"Pasta de dientes" (toothpaste spot treatment) — drying but can irritate; not recommended by dermatologists',
          '"Bicarbonato" (baking soda) as a scrub — too alkaline, disrupts skin barrier; avoid',
          '"Agua de rosas" (rose water) as toner — gentle and generally beneficial',
          '"Pepino" (cucumber) slices — soothing; minimal active benefit but harmless',
          '"Miel" (honey) masks — antibacterial; good foundation for other treatments',
          '"Limón" (lemon juice) as a brightener — acidic, can cause photosensitization; risky especially with UV exposure',
        ],
        lemon_warning: `"Ponle limón" (put lemon on it) for dark spots is extremely common advice
in Latin American families. WARNING: lemon juice on skin in sunlight can cause phytophotodermatitis —
severe, irregular darkening that is worse than the original PIH. Never apply lemon juice and
then go out in the sun. If using diluted lemon juice (vitamin C serum is far safer) — apply at night
and use SPF the next day.`,
      },
    },

    treatment_approach: {
      diverse_skin_tone_consideration: `Latina skin varies enormously. Fair-skinned Latina women
can use the same approach as European skin. Medium olive skin (Fitzpatrick III-IV) should
follow mild PIH-prevention protocols. Afro-Latina women with deeper skin should follow
the same approach as the West African/Black American communities.`,
      
    },
  },

  // -------------------------------------------------------------------------
  // EAST ASIAN
  // -------------------------------------------------------------------------
  'east-asian': {
    community: 'East Asian (Korean, Japanese, Chinese, Taiwanese)',
    fitzpatrick_range: 'II-IV, with cool to neutral undertones; fair to medium skin',
    intro: `East Asian beauty traditions — particularly Korean (K-beauty) and Japanese — have had
outsized global influence on skincare. The philosophy emphasizes skin health as a holistic goal,
gentle incremental care, and treating skin with "respect." For acne specifically, the East Asian
approach tends toward low-irritation, layered treatments that support the skin barrier even while
treating breakouts — a philosophy that has substantial scientific backing.`,

    primary_concerns: {
      pih_in_east_asian_skin: {
        name: 'PIH in East Asian Skin: The Red-Purple Presentation',
        description: `A critical but underrecognized difference: PIH in fair-medium East Asian skin
presents differently from PIH in darker skin. Post-acne marks on Fitzpatrick II-III East Asian
skin are often red-purple or pink-purple, rather than the brown-black of PIH in deeper skin.
These red marks can be mistaken for persistent inflammation.`,
        why_different: `In lighter skin, post-acne discoloration has more vascular component
(post-inflammatory erythema — PIE) mixed with pigmentation. PIE fades differently than pure PIH.
It responds to vascular lasers (PDL) and green light treatments rather than pigment inhibitors.`,
        treatment_by_type: {
          pie_red_purple_marks: [
            'Niacinamide (reduces redness and post-inflammatory marks)',
            'Centella asiatica (cica) — calms residual inflammation',
            'Rosehip oil (contains beta-carotene and vitamin C; gentle)',
            'Azelaic acid — works on both PIE and PIH',
            'SPF (prevents post-inflammatory erythema from worsening)',
            'PDL laser in-office for persistent PIE',
          ],
          pih_brown_spots_fitzpatrick_4: [
            'Vitamin C + SPF',
            'Niacinamide',
            'Azelaic acid',
            'Gentle exfoliation with AHAs (lactic, mandelic)',
          ],
        },
      },

      maskne: {
        name: 'Maskne: Mask-Related Acne',
        description: `Mask-wearing as a health and social norm predates COVID-19 in East Asian
cultures — surgical masks, pollution masks, and sun-protection face covers have been common
in Japan, Korea, and China for years. This made East Asian communities early observers of
"maskne" (mask + acne).`,
        mechanisms: [
          'Heat and humidity trapped under the mask increases sebum production',
          'Occlusion blocks normal skin breathing and creates anaerobic conditions (C. acnes thrives)',
          'Friction from mask edges causes micro-injuries along the cheeks and chin',
          'Breath humidity creates a moist environment that can breed bacteria and fungus',
          'Repeated contact of mask fabric with skin transfers fabric chemicals',
        ],
        affected_areas: 'Cheeks (where mask sits), chin, around mouth, nose sides.',
        prevention: [
          'Use gentle cleanser morning and night on maskne-prone areas',
          'Minimize heavy makeup under masks',
          'Use silk or soft fabric masks where possible (less friction)',
          'Change disposable masks frequently',
          'Apply a thin barrier product (lightweight niacinamide serum) before masking',
          'Salicylic acid toner or serum on affected areas',
        ],
      },

      diet_east_asian: {
        name: 'Diet and Acne: East Asian Perspectives',
        sugary_drinks: `Bubble tea (boba), taro drinks, highly sweetened coffee drinks are enormously
popular in East Asian communities — these are high-GI foods directly in the insulin-acne pathway.
This is a modern dietary shift that may contribute to acne in a traditionally lower-acne population.`,
        spicy_food: `Traditional belief in China that spicy food worsens acne aligns with TCM theory
of internal heat. Korean cuisine (kimchi, gochujang, spicy stews) is similarly believed to
worsen breakouts in traditional Korean thought. Evidence is limited but the TCM/TCK framework
provides a useful guide for individual elimination trials.`,
        tcm_diet_perspective: `In Traditional Chinese Medicine, acne is associated with "damp heat"
and "blood heat." Foods that increase internal heat (spicy, fried, greasy, alcohol, sugar)
are thought to worsen acne. Foods that reduce heat (cucumber, watermelon, mung beans, lotus root)
are prescribed. This broadly aligns with the evidence-based anti-inflammatory diet.`,
      },
    },

    traditional_and_kbeauty_approaches: {
      kbeauty_acne_philosophy: {
        name: 'K-Beauty Acne Approach: Gentle, Layered, Low-Irritation',
        core_principles: [
          'Protect the skin barrier — inflammation and dryness worsen acne',
          'Layer lightweight products (essence, serum, gel moisturizer) rather than one heavy product',
          'Never scrub or strip acne-prone skin',
          'Treat acne gently — aggressive treatment = more irritation = more PIH',
          'Consistent routine is more important than powerful individual products',
          'SPF every day, year-round, even indoors',
        ],
        double_cleanse: `The K-beauty double cleanse (oil cleanser first, then water-based cleanser)
is counterintuitively suitable for acne-prone skin when done correctly. The oil phase removes
sunscreen, makeup, and pollution without leaving residue. The second cleanse treats skin directly.
Use non-comedogenic cleansing oils (rice bran, hempseed-based) or micellar water for the first step.`,
        essence_and_serum_layering: `K-beauty uses thin, watery "essences" and lightweight serums
to deliver actives (niacinamide, centella, propolis) without occlusive heaviness.
This layered approach avoids the comedogenic risk of heavy creams while maintaining hydration.`,
      },

      no_touch_philosophy: {
        name: 'The "No-Touch" Philosophy',
        description: `Japanese and Korean skincare traditions emphasize hands-off skin care.
Do not touch your face unnecessarily. Do not pick or squeeze. Pat products in gently rather
than rubbing. Allow skin to do its own healing rather than intervening mechanically.`,
        rationale: `Mechanical trauma (picking, squeezing) ruptures lesions internally, spreading
bacteria and inflammation. Even gentle squeezing dramatically increases PIH risk. The no-touch
philosophy has strong dermatological backing.`,
        in_practice: [
          'Keep hands away from face throughout the day',
          'Use clean cotton swabs if you must touch a lesion',
          'Pat (do not rub) skincare products into skin',
          'Use clean pillowcases (silk is preferred in Korean skincare for lower friction)',
          'Hair off face while sleeping — hair products migrate to skin',
        ],
      },

      propolis: {
        name: 'Propolis Ampoules for Acne',
        description: `Propolis (bee glue) is a resinous material bees make from plant compounds and wax.
It has been used in folk medicine for millennia and is a cornerstone of Korean acne treatment
products. K-beauty propolis ampoules (notably COSRX Propolis Light Ampule) are global bestsellers.`,
        how_it_helps_acne: [
          'CAPE (caffeic acid phenethyl ester) — primary active; anti-inflammatory, antibacterial against C. acnes',
          'Promotes wound healing and skin repair',
          'Antioxidant — reduces oxidative stress in acne lesions',
          'Calms redness and post-acne marks',
        ],
        
        how_to_use: 'Apply propolis ampoule after toner/essence, before moisturizer. Can be used morning and night.',
        cautions: 'Bee/honey allergies — patch test carefully. Anyone with bee allergy should avoid.',
      },

      centella_asiatica: {
        name: 'Centella Asiatica (Cica / Tiger Grass / Gotu Kola)',
        description: `Centella asiatica is the healing workhorse of K-beauty and one of the most
research-supported botanical ingredients in skincare. "Cica" products are now global.`,
        active_compounds: ['Asiaticoside (wound healing)', 'Madecassoside (anti-inflammatory)', 'Asiatic acid (collagen synthesis)', 'Madecassic acid (antioxidant)'],
        how_it_helps_acne: [
          'Calms inflammation in active lesions',
          'Accelerates wound healing after acne resolves',
          'Supports collagen production (helps prevent atrophic scarring)',
          'Strengthens the skin barrier (prevents further irritation)',
        ],
        best_for: 'Post-acne healing; concurrent use with active acne to minimize lesion damage; maskne.',
        formats: 'Cica creams (Dr. Jart+ Cicapair), centella toners, centella serums, sheet masks.',
      },

      tcm_for_acne: {
        name: 'Traditional Chinese Medicine (TCM) for Acne',
        internal_heat_theory: `TCM views acne as excess "heat" in the lung meridian (which governs
skin) and the stomach/large intestine meridian. Treatment focuses on clearing heat, resolving
dampness, and cooling the blood.`,
        common_tcm_acne_herbs: [
          'Huang Lian (Coptis chinensis) — "cooling"; berberine content; antimicrobial',
          'Jin Yin Hua (Honeysuckle flower) — clears heat and toxins',
          'Lian Qiao (Forsythia) — antibacterial, anti-inflammatory',
          'Bai Hua She She Cao (Hedyotis) — heat-clearing',
          'Dan Shen (Salvia miltiorrhiza) — blood-moving for PIH',
        ],
        berberine_note: `Berberine (found in many TCM "heat-clearing" herbs) has modern research
showing insulin-sensitizing effects — directly relevant to hormonal acne. TCM's emphasis on
blood sugar regulation through diet and herbs aligns with modern evidence.`,
        caveat: `TCM formulations should be obtained from qualified practitioners, not self-prescribed.
Some herbal combinations have liver toxicity risks. Ensure herbs are from reputable sources.`,
      },

      tea_tree: {
        name: 'Tea Tree Oil',
        description: `While not originally East Asian, tea tree oil has been enthusiastically adopted
into K-beauty and Japanese skincare as an anti-acne spot treatment.`,
        
        how_to_use: 'Always dilute to 5% in a carrier. Apply as spot treatment to individual lesions. Do not apply to large areas of skin — too drying and potentially irritating.',
      },
    },

    treatment_approach: {
      principles: [
        'Gentle over aggressive — lower irritation = less PIH in East Asian skin',
        'Barrier support is part of acne treatment, not separate from it',
        'Layer lightweight actives rather than heavy products',
        'No-touch principle: consistent mechanical discipline reduces lesion severity',
        'SPF daily — PIE/PIH management requires UV protection',
      ],
      east_asian_routine_example: {
        am: ['Gentle low-pH cleanser', 'Salicylic acid toner (2-3x/week, or daily if tolerating well)', 'Niacinamide serum', 'Centella asiatica gel moisturizer', 'SPF 50 lightweight (Korean SPF is excellent)'],
        pm: ['Double cleanse (cleansing oil/balm → gentle cleanser)', 'Propolis ampoule', 'Adapalene 0.1% (alternate nights; build up slowly)', 'Cica or ceramide moisturizer'],
      },
    },
  },

  // -------------------------------------------------------------------------
  // EAST AFRICAN
  // -------------------------------------------------------------------------
  'east-african': {
    community: 'East African (Ethiopian, Eritrean, Somali, Kenyan, Ugandan, Tanzanian)',
    fitzpatrick_range: 'IV-VI, with predominantly deep brown to blue-black tones',
    

    primary_concerns: {
      pih_east_african: {
        name: 'PIH in Deep East African Skin',
        description: `For Fitzpatrick V-VI East African skin, the same PIH dynamics apply as
in West African communities. Melanocytes are reactive; post-acne dark spots can be more
distressing than the acne itself. SPF, niacinamide, and gentle treatment are foundational.`,
        sun_context: `East Africa straddles the equator — UV intensity is extremely high.
This makes SPF even more critical for PIH prevention than in temperate climates.
Paradoxically, many darker-skinned individuals feel SPF is "unnecessary" for them.
The evidence is clear: UV dramatically extends PIH duration in all skin tones, and
deep skin tones need SPF for PIH prevention even without sunburn risk.`,
      },

      hormonal_factors: {
        name: 'Hormonal Factors in East African Communities',
        
        diet_hormonal_connection: `Traditional East African diets (injera, lentils, vegetables, some dairy
in Ethiopian/Eritrean cuisine; rice and goat meat common in Somali and coastal Kenya) are generally
lower in high-GI refined carbohydrates than Western diets. As East African diaspora communities
adopt Western dietary patterns, dietary-related acne may increase.`,
      },
    },

    traditional_remedies: {
      frankincense: {
        name: 'Frankincense (Lubaan / Etan)',
        description: `Boswellia trees grow natively in the Horn of Africa — Ethiopia, Eritrea, and
Somalia are among the world's primary sources of frankincense resin. This is one of the most
ancient medicinal substances known to humanity, referenced in ancient Egyptian, Greek, and
Ayurvedic medical texts. In East African communities, frankincense is used topically and as
incense for respiratory and skin health.`,
        active_compounds: 'Boswellic acids — particularly AKBA (acetyl-11-keto-beta-boswellic acid); potent anti-inflammatory; inhibits 5-LOX (leukotriene pathway responsible for inflammatory acne).',
        
        how_to_use: [
          'Frankincense resin dissolved in carrier oil (almond, jojoba) — traditional application',
          'Commercial boswellic acid serums/creams (increasingly available)',
          'Frankincense essential oil — highly concentrated; must be diluted (1-2% in carrier)',
          'Frankincense water (boiled resin) as a toner — traditional use',
        ],
        cautions: [
          'Essential oil must be diluted — undiluted can irritate skin',
          'Patch test first — essential oils can cause contact dermatitis',
          'Quality varies enormously — sourcing from authentic Ethiopian/Somali resin is preferable',
        ],
        cultural_significance: `In Somali tradition, "lubaan" (frankincense) is burned in the home
and applied to skin. The post-partum practice of "aroos" (fumigating with incense) reflects
the deep integration of frankincense into East African life beyond medicinal use.`,
      },

      honey_east_african: {
        name: 'Ethiopian Honey and Tej as Skin Treatments',
        description: `Ethiopia is the largest honey producer in Africa and has a rich honey culture.
Ethiopian honey — particularly from the highlands — is used medicinally, including for skin
wounds and infections. Honey is applied to blemishes in traditional practice.`,
        how_honey_helps_acne: [
          'Hydrogen peroxide (naturally produced by honey) — antibacterial',
          'Low pH (3.2-4.5) — inhibits bacterial growth',
          'Methylglyoxal (particularly in Manuka honey) — potent antibacterial',
          'Osmotic effect — draws moisture from bacteria, killing them',
          'Wound healing and tissue repair support',
        ],
        how_to_use: [
          'Raw unprocessed Ethiopian honey (tigray, harrar) as a face mask — 15-20 minutes',
          'Honey spot treatment on individual lesions overnight',
          'Honey + neem powder mask for combined antibacterial effect',
        ],
        
      },

      shea_and_butters: {
        name: 'Shea Butter and Heavy Oils in East African Practice',
        description: `Shea butter use is widespread across sub-Saharan Africa including East Africa.
For the face, the same pomade-acne concern applies: shea butter and heavy oils (coconut, castor)
can clog pores, especially in hot climates.`,
        recommendation: `For acne-prone East African skin: reserve shea butter and heavy oils for
body use. For the face, opt for lighter non-comedogenic oils (rosehip, squalane, hemp seed)
or skip facial oils entirely during active breakout periods.`,
      },
    },

    treatment_approach: {
      principles: [
        'PIH prevention is the primary goal — aggressive acne treatment that causes irritation is counterproductive',
        'SPF in high-UV East Africa is even more critical for PIH management',
        'Frankincense-based products are culturally resonant AND scientifically supported adjuncts',
        'Honey as a gentle antibacterial treatment has good evidence and cultural grounding',
        'Standard dermatological treatments (azelaic acid, adapalene, niacinamide) are appropriate',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // SOUTH AFRICAN
  // -------------------------------------------------------------------------
  'south-african': {
    community: 'South African (Zulu, Xhosa, Sotho, Tswana, Cape Malay, Coloured, South African Indian)',
    fitzpatrick_range: 'IV-VI predominantly; Fitzpatrick III in some coloured and Indian communities',
    intro: `South Africa's extraordinary ethnic diversity — Nguni, Sotho-Tswana, Cape Malay, coloured,
South African Indian, and other communities — means that acne care must be adapted to a range of
skin tones and a rich diversity of traditional plant medicines. South Africa has one of the world's
most biodiverse plant kingdoms (the Cape Floristic Region), producing unique medicinal plants
found nowhere else — including rooibos and aloe ferox.`,

    primary_concerns: {
      pih_bantu_skin: {
        name: 'PIH in Deep Bantu Skin Tones',
        description: `For the majority South African communities (Nguni: Zulu, Xhosa, Swazi, Ndebele;
Sotho-Tswana: Basotho, Tswana, Pedi), skin tones are predominantly Fitzpatrick V-VI.
PIH from acne is the same intense, persistent concern as in West and East African communities.`,
        additional_concern: `Skin-lightening product use is unfortunately prevalent in South Africa,
as in other parts of sub-Saharan Africa, driven by colorism and the PIH concern.
Many bleaching products contain mercury (toxic) or high-dose hydroquinone (risk of ochronosis).
Safe, evidence-based PIH treatment (azelaic acid, niacinamide, alpha arbutin, SPF) must be
presented as the alternative to unsafe bleaching practices.`,
      },
    },

    traditional_remedies: {
      rooibos: {
        name: 'Rooibos (Aspalathus linearis)',
        description: `Rooibos ("red bush") is indigenous to the Cederberg mountains of the Western Cape
and is one of South Africa's most iconic exports. Beyond being a beloved tea, rooibos has
significant potential for acne-prone skin.`,
        active_compounds: [
          'Aspalathin (unique to rooibos; antioxidant)',
          'Nothofagin (antioxidant)',
          'Quercetin (anti-inflammatory)',
          'Luteolin (anti-inflammatory)',
          'Orientin and isoorientin (antioxidant)',
          'Zinc (antimicrobial)',
          'Alpha-hydroxy acids (mild exfoliation)',
        ],
        why_rooibos_for_acne: [
          'Anti-inflammatory — calms existing breakouts',
          'Antioxidant — reduces oxidative stress that worsens acne',
          'Zinc content — antibacterial against C. acnes',
          'No caffeine — not drying',
          'Tannins — mildly astringent, pore-tightening',
        ],
        
        how_to_use: [
          'Strong brewed rooibos tea (cooled) as a toner — apply with cotton pad',
          'Rooibos tea bag as a compress on active blemishes',
          'Commercial rooibos-infused serums, toners, and creams (increasingly available)',
          'Rooibos face steam (steep in boiling water, steam face at safe distance) for deep cleansing',
          'Internal consumption of rooibos tea (antioxidant benefits throughout the body)',
        ],
        cultural_note: `Rooibos is drunk by all South African communities — it crosses cultural
boundaries in a way few things do in South Africa's diverse landscape. Its use as a skin
remedy builds naturally on its culinary integration.`,
      },

      aloe_ferox: {
        name: 'Cape Aloe / Aloe Ferox',
        description: `Aloe ferox ("fierce aloe" — referring to its spiny leaves) is indigenous to
South Africa and used in traditional Nguni medicine. It is distinct from the more common
Aloe vera (Aloe barbadensis) and in some respects more potent.`,
        how_it_differs_from_aloe_vera: [
          'Higher aloin content (bitter latex) — stronger purgative effect when taken internally',
          'Greater polysaccharide content — potentially superior wound healing',
          'Higher mineral content',
          'More concentrated gel per leaf',
        ],
        for_acne_and_scarring: [
          'Fresh gel from aloe ferox applied to active lesions — antibacterial, anti-inflammatory',
          'Gel on post-acne marks — supports wound healing and skin regeneration',
          'Commercial aloe ferox gel products — standardized content',
        ],
        wound_healing_significance: `Aloe ferox's wound healing properties are particularly
valuable for the post-acne phase — accelerating skin recovery and reducing the depth and
duration of PIH marks.`,
      },

      cape_malay_remedies: {
        name: 'Cape Malay Traditional Remedies',
        description: `The Cape Malay community (descendants of enslaved and indentured people from
Indonesia, Malaysia, India, and Madagascar) brought to Cape Town a rich tradition of herbal medicine.
Their "boererate" (folk remedies) integrate Malay, Indian, and African botanical knowledge.`,
        common_remedies: [
          'Rose water (Attar of Roses) — toner, derived from Malay rose water traditions',
          'Fenugreek (sproei/bokshoringsaad) — anti-inflammatory; seed paste on skin',
          'Cumin poultices — anti-inflammatory',
          'Turmeric — integrated from Indian heritage into Cape Malay cooking and medicine',
        ],
        integration: `Cape Malay remedies reflect the synthesis of multiple traditions.
For acne, the anti-inflammatory herbs (turmeric, fenugreek) align with evidence.
Rose water as a toner is well supported as a gentle, effective pH-balancing toner.`,
      },

      umuthi_traditional: {
        name: 'Traditional Nguni Plant Medicine (Umuthi)',
        description: `Zulu and Xhosa traditional medicine (umuthi) includes numerous plant-based
skin treatments administered by izinyanga (herbalists) and izangoma (diviners).`,
        relevant_plants: [
          'Sutherlandia frutescens (Cancer bush) — anti-inflammatory, immune modulating',
          'Hypoxis hemerocallidea (African potato) — immune support, anti-inflammatory',
          'Bulbine frutescens (Burn jelly plant / ibhucu) — wound healing, antibacterial gel in leaves',
          'Pelargonium sidoides (umckaloabo) — antibacterial',
        ],
        bulbine_for_acne: `Bulbine frutescens leaf gel is particularly relevant — applied to
wounds, burns, and skin infections in traditional medicine. The leaf yields a yellow-orange
gel with demonstrated antibacterial and wound-healing properties relevant to acne management.`,
        caution: `Traditional umuthi preparations should be obtained from qualified practitioners
(izinyanga). Self-collection of medicinal plants without knowledge is dangerous — some
traditionally used plants have significant toxicity. Sustainable harvesting matters for
conservation of threatened medicinal species.`,
      },
    },

    treatment_approach: {
      principles: [
        'Rooibos as a central skincare element — evidence-backed and culturally authentic',
        'Aloe ferox gel for active lesions and post-acne wound healing',
        'Same PIH-first treatment philosophy as West/East African communities for Fitzpatrick V-VI skin',
        'Address skin-lightening product use — educate on safe PIH alternatives',
        'SPF non-negotiable — South African UV index is high year-round',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // BLACK AMERICAN
  // -------------------------------------------------------------------------
  'black-american': {
    community: 'Black American / African American',
    fitzpatrick_range: 'IV-VI, with diverse warm, neutral, and cool undertones',
    intro: `Black Americans face a unique intersection of acne challenges shaped by melanin-rich skin,
long-standing underrepresentation in dermatological research and clinical images, cultural hair
care practices, and historical barriers to dermatologist access. The result has been a community
often navigating acne and PIH without targeted resources — relying on community knowledge,
social media, and trial and error. This guide centers the specific needs of Black American skin.`,

    primary_concerns: {
      acne_pih_trifecta: {
        name: 'The Trifecta: Acne → Inflammation → PIH',
        description: `The three-stage problem unique to melanin-rich skin: a single acne lesion
creates a pimple (Stage 1), which triggers inflammation that activates melanocytes (Stage 2),
which deposits excess melanin leaving a dark spot that lasts months to years (Stage 3).
This trifecta means Black Americans are often dealing with two separate visible problems simultaneously:
active acne AND a collection of dark spots from previous breakouts.`,
        why_this_matters: `The PIH stage is often more visible and persistent than the acne itself.
A face can have 2 active pimples and 20 dark spots simultaneously — and treating only the active
acne without addressing the PIH pipeline leaves the underlying problem unresolved.`,
        treatment_requires_two_tracks: {
          track_1_clear_active_acne: ['Salicylic acid', 'Benzoyl peroxide 2.5%', 'Adapalene', 'Niacinamide (dual action — treats acne AND helps prevent PIH)'],
          track_2_fade_pih: ['Niacinamide 5-10%', 'Azelaic acid 10-20%', 'Alpha arbutin', 'Vitamin C', 'SPF 30+ (the most important PIH treatment)'],
          the_overlap: `Azelaic acid and niacinamide work on BOTH tracks simultaneously — ideal
for managing the trifecta.`,
        },
      },

      pomade_acne_black_american: {
        name: 'Pomade Acne: The Hair Product Problem',
        description: `Black hair care requires moisture and definition that often involves heavier
products than white hair textures typically use. Edge controls, pomades, wave grease, scalp
oils, and hair butters are standard in many Black American hair routines. These products
predictably migrate to the forehead, temples, neck, and ears — causing pomade acne.`,
        products_most_implicated: [
          'Murray\'s Superior Hair Dressing Pomade (petroleum-based; highly comedogenic)',
          'Wave Nouveau pomades',
          'Blue Magic (petroleum + lanolin)',
          'Heavy edge controls with castor oil, coconut oil, shea butter',
          'Hot oil treatments applied to scalp',
          'African Pride, Doo Gro heavy formulas',
        ],
        non_comedogenic_alternatives: [
          'Water-based edge controls (Eco Styler clear gel — comedogenic rating: low)',
          'Got2b Slick (water-based)',
          'Cantu edges — lighter formula',
          'ORS Olive Oil edge tamer (lighter than petroleum versions)',
          'Silk-based serums for edges',
          'For scalp: lighter oils (jojoba, argan) instead of heavy petroleum products',
        ],
        application_discipline: [
          'Use a small brush for edge control — prevents excess migration onto skin',
          'Wrap or tie hair after styling to prevent migration during sleep',
          'Use satin pillowcase (reduces both hair frizz AND prevents product from pressing onto face)',
          'Cleanse forehead and hairline area daily with salicylic acid cleanser',
          'A thin strip of Scotch tape along hairline during styling prevents product touchning forehead',
        ],
      },

      non_comedogenic_formulas: {
        name: 'The Importance of Non-Comedogenic Formulas in Black Skin Care',
        description: `For decades, mainstream dermatology and the beauty industry focused product
development and testing on lighter skin tones. Products intended to moisturize, protect,
and beautify darker skin — sold in beauty supply stores and drugstores serving Black communities —
were not consistently formulated with comedogenic risk in mind.`,
        historical_gap: `Products like Palmer's Cocoa Butter, Vaseline Intensive Care, Jergens,
and many popular Black hair care products contain highly comedogenic ingredients. These were
the available and culturally integrated options — leading to a situation where the products
being used for skin care were also causing significant acne.`,
        current_landscape: `This is improving. Black-owned skincare brands formulated specifically
for darker skin tones have grown significantly:`,
        black_owned_non_comedogenic_brands: [
          'Black Girl Sunscreen (BGS) — specifically formulated for Black skin, no white cast, non-comedogenic',
          'Hyper Skin — azelaic acid and brightening focus for melanin-rich skin',
          'Epi.Logic — clinical-grade, formulated for darker skin tones',
          'Topicals — viral "Faded" serum (niacinamide + tranexamic acid) for PIH',
          'Base Butter — clean, non-comedogenic skin butter',
          'Urban Skin Rx — widely available at Target/Walmart, specifically formulated for melanin-rich skin',
        ],
      },

      bgs_and_spf: {
        name: '"BGS Safe" — Black Girl Sunscreen and Acne-Compatible SPF',
        description: `"BGS" (Black Girl Sunscreen) has become both a brand and a shorthand in Black
skincare communities for sunscreen that doesn't leave a white cast and is suitable for Black skin.
This is crucial for acne care: without SPF, PIH from acne can persist 18-24+ months.`,
        the_white_cast_problem: `Traditional mineral sunscreens (zinc oxide, titanium dioxide)
leave a white or chalky cast on darker skin that is cosmetically unacceptable and has been
a major barrier to consistent SPF use. Black women have historically been least likely to
wear sunscreen, in part because of this problem.`,
        solutions: [
          'Black Girl Sunscreen SPF 30+ — original and Make It Matte formulas (no white cast)',
          'Supergoop Unseen Sunscreen (chemical SPF; lightweight, clear)',
          'EltaMD UV Clear (chemical SPF; beloved by dermatologists; no cast)',
          'La Roche-Posay Anthelios mineral SPF in tinted formulas',
          'Invisible formulas using next-gen zinc (TriAsorB, Uvinul) — no cast even at high Fitzpatrick',
          'Hybrid mineral-chemical formulas from Korean brands (MISSHA, Round Lab)',
        ],
        message: `Daily SPF use is, clinically speaking, as important as any active acne treatment
for Black American skin dealing with PIH. The dark spots left by acne will not fade if UV
continues to stimulate melanin production. SPF breaks the cycle.`,
      },

      salicylic_vs_bpo: {
        name: 'Salicylic Acid vs. Benzoyl Peroxide in Melanated Skin',
        salicylic_acid_preferred: `For Black American skin, salicylic acid is often the preferred
first-line OTC treatment. It effectively treats comedonal and mild inflammatory acne with
lower irritation risk than benzoyl peroxide — important because irritation can trigger PIH.`,
        bpo_considerations: [
          'Use 2.5% BPO — as effective as 10% with significantly less irritation',
          'Apply only at night — reduces daytime fabric bleaching risk and UV interaction',
          'Use BPO as a spot treatment rather than all-over application when possible',
          'BLEACHING WARNING: BPO bleaches fabric. Use white pillowcases and towels exclusively during BPO use',
          'If significant dryness or irritation occurs, reduce frequency before discontinuing entirely',
        ],
        combination_approach: `Many dermatologists recommend benzoyl peroxide wash in the shower
(rinse off immediately, limiting skin contact time and fabric bleaching) combined with salicylic
acid leave-on products. This gives antibacterial benefit of BPO with sustained comedolytic
benefit of SA.`,
      },

      drugstore_recommendations: {
        name: 'Popular Drugstore Finds for Black Skin',
        description: `Black skincare communities on social media (BlackSkincare on Reddit,
#BlackSkinCare on TikTok, YouTube dermatologists like Dr. Shereene Idriss) have shared
extensive real-world testing of accessible products.`,
        widely_recommended: [
          { product: 'CeraVe Foaming Cleanser', why: 'Non-comedogenic, fragrance-free, ceramides for barrier' },
          { product: 'The Ordinary Niacinamide 10% + Zinc', why: 'Budget-friendly niacinamide; popular for PIH' },
          { product: 'Paula\'s Choice 2% BHA Liquid', why: 'Effective SA exfoliant; well-tolerated' },
          { product: 'Differin Adapalene Gel 0.1%', why: 'OTC retinoid; less irritating than tretinoin; available without Rx in USA' },
          { product: 'Topicals Faded Serum', why: 'Niacinamide + tranexamic acid combo; formulated for PIH in melanin-rich skin' },
          { product: 'Black Girl Sunscreen SPF 30', why: 'No white cast; non-comedogenic; formulated for Black skin' },
          { product: 'Vanicream Gentle Cleanser', why: 'Extremely gentle; suitable for sensitive acne-prone skin' },
          { product: 'EltaMD UV Clear SPF 46', why: 'Niacinamide in SPF; lightweight; derm favorite' },
        ],
      },
    },

    treatment_approach: {
      principles: [
        'Address the trifecta (acne + inflammation + PIH) with dual-track treatment from day one',
        'Choose non-comedogenic formulas for every product — moisturizer, SPF, makeup, hair care near face',
        'Manage pomade acne proactively — hair routine is part of acne treatment',
        'SPF every day — this is PIH treatment, not optional sun protection',
        'Benzoyl peroxide at 2.5%; white pillowcases mandatory; salicylic acid preferred for leave-on',
        'Niacinamide and azelaic acid are the workhorses for Black American acne + PIH',
        'Community resources: BlackSkinCare subreddit, #BlackSkinCare creators, BSWA (Black Skin White Aprons), Black dermatologists on social media',
      ],
      black_dermatologist_resources: [
        'Skin of Color Society (skinofcolorsociety.org)',
        'Dr. Crystal Aguh — Johns Hopkins; author of "Fundamentals of Ethnic Hair"',
        'Dr. Adeline Kikam (@brownskinderm on Instagram)',
        'Dr. Corey L. Hartman — Skin Wellness Dermatology',
        'Dr. Raewyn Quigley',
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// ACNE STATISTICS
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// GETTER FUNCTIONS
// ---------------------------------------------------------------------------

export function getAcneGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_ACNE_GUIDES['west-african'],
    'south-asian': ETHNIC_ACNE_GUIDES['south-asian'],
    'caribbean': ETHNIC_ACNE_GUIDES['caribbean'],
    'arab': ETHNIC_ACNE_GUIDES['arab'],
    'latina': ETHNIC_ACNE_GUIDES['latina'],
    'east-asian': ETHNIC_ACNE_GUIDES['east-asian'],
    'east-african': ETHNIC_ACNE_GUIDES['east-african'],
    'south-african': ETHNIC_ACNE_GUIDES['south-african'],
    'black-american': ETHNIC_ACNE_GUIDES['black-american'],
  };
  return directMap[communityId] || null;
}

export function getUniversalAcne() {
  return UNIVERSAL_ACNE;
}

export function getAllCommunityIds() {
  const directMap = {
    'west-african': 'West African',
    'south-asian': 'South Asian',
    'caribbean': 'Caribbean',
    'arab': 'Arab',
    'latina': 'Latina',
    'east-asian': 'East Asian',
    'east-african': 'East African',
    'south-african': 'South African',
    'black-american': 'Black American',
  };
  return directMap;
}

export function getAcneTypeInfo(acneType) {
  const directMap = {
    'comedonal': UNIVERSAL_ACNE.types.comedonal,
    'inflammatory': UNIVERSAL_ACNE.types.inflammatory,
    'cystic': UNIVERSAL_ACNE.types.cystic,
    'hormonal': UNIVERSAL_ACNE.types.hormonal,
    'fungal': UNIVERSAL_ACNE.types.fungal,
  };
  return directMap[acneType] || null;
}

export function getIngredientInfo(ingredient) {
  const directMap = {
    'salicylic-acid': UNIVERSAL_ACNE.active_ingredients.salicylic_acid,
    'benzoyl-peroxide': UNIVERSAL_ACNE.active_ingredients.benzoyl_peroxide,
    'niacinamide': UNIVERSAL_ACNE.active_ingredients.niacinamide,
    'retinoids': UNIVERSAL_ACNE.active_ingredients.retinoids,
    'azelaic-acid': UNIVERSAL_ACNE.active_ingredients.azelaic_acid,
    'sunscreen': UNIVERSAL_ACNE.active_ingredients.sunscreen_for_acne,
  };
  return directMap[ingredient] || null;
}

export function getPIHPipelineInfo() {
  return UNIVERSAL_ACNE.acne_pih_pipeline;
}

export function getDietAcneInfo() {
  return UNIVERSAL_ACNE.diet_and_acne;
}

export function getComedogenicRatings() {
  return UNIVERSAL_ACNE.comedogenic_ratings;
}

export function getWhenToSeeDerm() {
  return UNIVERSAL_ACNE.when_to_see_a_dermatologist;
}

export function getCommunitiesByPIHRisk() {
  const directMap = {
    highest: ['west-african', 'black-american', 'east-african', 'south-african'],
    high: ['caribbean', 'south-asian'],
    moderate: ['arab', 'latina'],
    lower_but_present: ['east-asian'],
  };
  return directMap;
}

export function getCommunitiesByHormonalAcneRisk() {
  const directMap = {
    highest_pcos_prevalence: ['south-asian', 'latina'],
    elevated: ['black-american', 'caribbean'],
    general_population_rate: ['west-african', 'arab', 'east-asian', 'east-african', 'south-african'],
  };
  return directMap;
}

export function getTraditionalRemediesSummary() {
  const directMap = {
    'west-african': {
      primary: ['African Black Soap', 'Moringa', 'Neem'],
      evidence_level: 'Traditional use; growing research on neem and moringa',
    },
    'south-asian': {
      primary: ['Turmeric/Haldi', 'Neem', 'Multani Mitti Clay'],
      evidence_level: 'Moderate — curcumin and neem have laboratory evidence',
    },
    'caribbean': {
      primary: ['Cerasee/Bitter Melon', 'Aloe Vera', 'Neem', 'Sea Salt'],
      evidence_level: 'Traditional; cerasee has in vitro antibacterial evidence',
    },
    'arab': {
      primary: ['Black Seed Oil (Nigella sativa)', 'Ghassoul Clay', 'Rose Water'],
      evidence_level: 'Strong — black seed oil RCT equivalent to standard treatment',
    },
    'latina': {
      primary: ['Nopal Cactus', 'Aloe Vera/Sábila', 'Marigold/Cempasúchil', 'Apple Cider Vinegar'],
      evidence_level: 'Mixed — nopal has blood sugar evidence; ACV limited clinical data',
    },
    'east-asian': {
      primary: ['Propolis', 'Centella Asiatica', 'Tea Tree Oil', 'TCM Herb Formulas'],
      evidence_level: 'Good — tea tree oil RCT; propolis research growing; centella well-studied',
    },
    'east-african': {
      primary: ['Frankincense/Boswellia', 'Ethiopian Honey', 'Aloe'],
      evidence_level: 'Moderate — boswellic acids have anti-inflammatory evidence; honey well-studied',
    },
    'south-african': {
      primary: ['Rooibos', 'Aloe Ferox', 'Bulbine Frutescens', 'Cape Malay Herbs'],
      evidence_level: 'Growing — rooibos antioxidant evidence strong; aloe ferox wound healing studied',
    },
    'black-american': {
      primary: ['Community knowledge', 'Non-comedogenic hair products', 'BGS-safe SPF'],
      evidence_level: 'Evidence-based commercial products; growing Black-owned skincare industry',
    },
  };
  return directMap;
}
