/**
 * MIRRR — Skin Microbiome Science Guide
 * The skin microbiome, probiotics in skincare, prebiotics, postbiotics,
 * dysbiosis conditions, and ethnic microbiome considerations.
 */

export const MICROBIOME_SCIENCE_OVERVIEW = {
  title: 'The Skin Microbiome: Complete Science Guide',
  introduction: `The human skin is home to trillions of microorganisms — bacteria, fungi, viruses, and mites — collectively called the skin microbiome or skin microbiota. Far from being harmful, this ecosystem is essential for immune defence, inflammation regulation, wound healing, and maintaining the skin barrier. Disruption of the microbiome (dysbiosis) is linked to acne, atopic dermatitis (eczema), rosacea, psoriasis, dandruff, and potentially ageing.`,
  scale: {
    total_microorganisms: '~1.5 trillion on the skin surface',
    bacterial_species: 'Over 1000 species identified; 200+ per individual',
    genetic_material: 'Microbial genes on skin outnumber human skin genes by orders of magnitude',
    weight: 'Skin microbiome weighs approximately 200g (similar to the liver microbiome)'
  },
  keyRoles: {
    barrier_function: 'Microbiome organisms produce lipids and acids that fortify the skin barrier; compete with pathogens for space and nutrients',
    immune_education: 'Trains the immune system to distinguish commensal bacteria from pathogens; reduces inappropriate inflammation',
    pH_maintenance: 'Normal skin pH is 4.5-5.5 (acidic); the microbiome both helps create and requires this acidity',
    antimicrobial_peptides: 'Commensal bacteria stimulate keratinocytes to produce antimicrobial peptides that protect against pathogens',
    vitamin_synthesis: 'Some skin bacteria synthesise B vitamins (B12, folate) locally'
  },
  majorResidents: {
    cutibacterium_acnes: {
      formerly: 'Propionibacterium acnes (reclassified 2016)',
      location: 'Sebaceous follicles (face, chest, back) — sebum-rich areas',
      normal_role: 'Produces propionic acid that maintains skin pH; competes with Staph aureus; produces vitamins',
      dysbiosis: 'Certain phylotypes (RT4, RT5) are associated with acne; others (RT6) are associated with healthy skin. It\'s not the presence of C. acnes but which type dominates that matters.',
      treatment_note: 'Antibiotics kill all C. acnes indiscriminately; this is why antibiotic resistance in acne treatment is a major problem'
    },
    staphylococcus_epidermidis: {
      location: 'Widespread; forearms, legs, and dry areas',
      normal_role: 'Produces serine protease Esp that inhibits Staph aureus biofilm formation; produces bacteriocin antibiotics; stimulates beta-defensin production',
      benefit: 'One of the most beneficial commensal species; protects against Staph aureus which drives eczema',
      in_eczema: 'Reduced in atopic dermatitis, where Staph aureus colonisation dominates'
    },
    staphylococcus_aureus: {
      location: 'Should be absent or minimal on healthy skin; colonises skin in atopic dermatitis (90% of patients)',
      role_in_disease: 'Produces superantigens that drive eczema flares; secretes proteases that damage the skin barrier; stimulates Th2 immune response',
      note: 'S. aureus colonisation is now considered a target in eczema treatment, not just a consequence'
    },
    malassezia: {
      type: 'Lipid-dependent yeast (fungus)',
      location: 'Sebaceous areas: scalp, face, chest, back',
      normal_role: 'Part of normal mycobiome (fungal microbiome); generally commensal',
      dysbiosis: 'Malassezia overgrowth drives: dandruff and seborrhoeic dermatitis; pityrosporum folliculitis (fungal acne/Malassezia folliculitis); potentially contributes to rosacea and atopic dermatitis',
      treatment: 'Antifungal shampoos (ketoconazole, zinc pyrithione, selenium sulphide, ciclopirox)'
    },
    demodex_folliculorum: {
      type: 'Microscopic mite (arachnid)',
      location: 'Hair follicles, eyelash follicles, sebaceous glands — particularly concentrated around nose and cheeks',
      prevalence: 'Present in virtually all adults over 18; population increases with age',
      normal_role: 'Commensal; eats dead skin cells and sebum',
      dysbiosis: 'Overpopulation strongly associated with rosacea (especially papulopustular subtype); also linked to perioral/periocular dermatitis',
      treatment: 'Ivermectin cream (Soolantra) is FDA approved for Demodex-associated rosacea; also azelaic acid; metronidazole'
    }
  },
  skinSites: {
    sebaceous: {
      areas: 'Face, scalp, chest, back',
      dominants: 'Cutibacterium acnes, Malassezia',
      characteristics: 'Rich in lipids from sebum; relatively low diversity'
    },
    moist: {
      areas: 'Armpits, groin, feet, behind ears, belly button',
      dominants: 'Staphylococcus, Corynebacterium',
      characteristics: 'Higher moisture and warmth; Corynebacterium responsible for body odour (metabolises apocrine sweat into malodorous compounds)'
    },
    dry: {
      areas: 'Forearms, legs, hands',
      dominants: 'Staphylococcus, Micrococcus, Flavobacterium',
      characteristics: 'Higher diversity; exposed to more environmental microbes'
    }
  }
};

export const SKIN_DYSBIOSIS_CONDITIONS = {
  title: 'Microbiome Dysbiosis and Skin Conditions',
  acne: {
    microbiome_role: 'Acne is increasingly understood as a microbiome dysbiosis condition, not simply a Cutibacterium acnes overgrowth. Research shows acne skin has less overall diversity and different phylotype distribution of C. acnes.',
    science: {
      phylotypes: 'Acne-prone skin is colonised predominantly by C. acnes RT4 and RT5 phylotypes; healthy skin is dominated by RT6 which actually produces bacteriocins that suppress RT4/RT5',
      sebum_connection: 'High sebum provides fuel for C. acnes; sebum composition (especially free fatty acids) is altered in acne',
      inflammation: 'C. acnes RT4/RT5 activate TLR2 receptors on keratinocytes, triggering IL-1β and TNF-α inflammatory cascade',
      biofilm: 'C. acnes forms biofilm in follicles making it resistant to antibiotics — this is why antibiotic resistance is 40-60% in acne patients',
      recent_finding: 'Phage viruses that target C. acnes are being investigated as precision microbiome treatment'
    },
    microbiome_approaches: {
      restore_diversity: ['Probiotic skincare containing Lactobacillus strains', 'Postbiotic skincare (lysates, ferments)', 'Avoiding over-washing and over-exfoliating', 'Not using antibacterial hand soaps on face'],
      targeted: ['Phage therapy (experimental)', 'C. acnes RT6 transplant (research stage)', 'Bacteriocin-producing probiotic topicals'],
      avoid_harming: ['Avoid overuse of antibiotics — promotes resistance and wipes commensal bacteria', 'Alcohol-based toners strip microbiome', 'Anti-bacterial soaps disrupt balance']
    }
  },
  atopic_dermatitis: {
    microbiome_role: 'Atopic dermatitis (eczema) has a well-established microbiome component: S. aureus colonises 90% of affected skin; S. epidermidis, which normally suppresses S. aureus, is significantly reduced.',
    science: {
      staph_aureus_mechanism: 'S. aureus produces: proteases that degrade claudin-1 and filaggrin (key barrier proteins), ceramidases that deplete skin ceramides, alpha-toxin that damages keratinocytes, superantigens Staph A and B that drive Th2 immune skewing and IgE production',
      filaggrin_connection: 'Filaggrin gene mutations (present in 50% of eczema patients) create barrier defects that allow S. aureus colonisation — a gene-microbiome interaction',
      vicious_cycle: 'S. aureus damages the barrier → allergens penetrate → Th2 inflammation → further barrier damage → more S. aureus'
    },
    microbiome_approaches: {
      reduce_staph_aureus: ['Dilute bleach baths (sodium hypochlorite 0.005%) — well-studied; reduces S. aureus colonisation', 'Topical antibiotics for infected lesions (not routine use)', 'S. epidermidis-based probiotic sprays (experimental but promising)'],
      restore_barrier: ['Ceramide moisturisers applied liberally', 'Avoid SLS and other harsh surfactants', 'Wet wrap therapy during flares'],
      probiotics: ['Lactobacillus rhamnosus GG (oral probiotic) reduced eczema risk in infants by 50% in landmark studies', 'Current evidence mixed for established eczema']
    }
  },
  rosacea: {
    microbiome_role: 'Rosacea has two microbiome-related pathways: Demodex mites are strongly implicated in papulopustular rosacea; Helicobacter pylori (gut bacteria) may play a systemic role.',
    science: {
      demodex: 'Rosacea patients have 10-18x higher Demodex density than healthy skin. Demodex carry Bacillus oleronius bacteria; when they die and release this bacteria, it triggers intense inflammation. Ivermectin (kills Demodex) is an effective rosacea treatment.',
      gut_connection: 'H. pylori eradication has been shown to improve rosacea in several studies; SIBO (small intestinal bacterial overgrowth) is more common in rosacea patients',
      immune: 'Rosacea patients have hypersensitive innate immune response; the microbiome triggers may vary but the overreaction is consistent'
    },
    treatment: ['Ivermectin 1% cream (Soolantra) — targets Demodex', 'Azelaic acid — antimicrobial and anti-inflammatory', 'Metronidazole — antibacterial and anti-Demodex', 'Gut: test and treat H. pylori if present', 'Probiotic supplementation to support gut-skin axis']
  },
  seborrhoeic_dermatitis: {
    microbiome_role: 'Malassezia yeast overgrowth on sebaceous skin areas. Malassezia is always present but certain species (M. globosa, M. restricta) in certain people trigger inflammatory response.',
    science: {
      mechanism: 'Malassezia metabolises sebum triglycerides into oleic acid; oleic acid penetrates the skin barrier and triggers inflammation in susceptible individuals (who mount a stronger innate immune response to Malassezia)',
      sites: 'Scalp, face (eyebrows, nasolabial folds, beard area, ear canals), chest'
    },
    treatment: ['Ketoconazole 2% shampoo or cream', 'Zinc pyrithione — antifungal and sebostatic', 'Selenium sulphide 2.5%', 'Ciclopirox olamine', 'Topical steroids for acute flares (short-term)', 'Honey masks — antibacterial and antifungal (crude honey)']
  },
  dandruff: {
    note: 'Dandruff (pityriasis capitis) is the mildest end of the Malassezia-seborrhoeic dermatitis spectrum',
    microbiome: 'Scalp microbiome diversity is lower in dandruff; Malassezia is proportionally higher; Cutibacterium acnes (also present on scalp) may have protective role',
    treatment_gentle: ['Zinc pyrithione shampoo 2-3x/week', 'Piroctone olamine (gentler alternative to ketoconazole)', 'Coal tar (effective but heavy odour and staining risk)', 'Salicylic acid shampoo — keratolytic, clears scale']
  }
};

export const PROBIOTIC_SKINCARE_GUIDE = {
  title: 'Probiotics, Prebiotics, and Postbiotics in Skincare',
  definitions: {
    probiotic: {
      definition: 'Live microorganisms that, when applied in adequate amounts, confer a benefit on the host',
      skincare_challenge: 'Stable live bacteria in a cosmetic product is technically very difficult. Most "probiotic" skincare contains lysates, ferments, or postbiotics rather than truly live cultures. Encapsulation technology is improving this.',
      genuinely_probiotic: 'Some products use micro-encapsulation or lyophilised (freeze-dried) bacteria that reactivate on skin contact; look for CFU counts'
    },
    prebiotic: {
      definition: 'Ingredients that selectively feed beneficial skin bacteria, allowing them to outcompete pathogens',
      skincare_examples: ['Inulin — feeds Lactobacillus species', 'FOS (fructooligosaccharides)', 'Glucose', 'Lactic acid (fermentation substrate)', 'Niacinamide — not strictly prebiotic but modulates microbiome favourably'],
      benefit: 'Generally more stable than live probiotics and cheaper; a prebiotic can shift microbiome composition without adding organisms'
    },
    postbiotic: {
      definition: 'Inanimate microorganisms, their fragments, or their metabolic products that confer health benefits',
      types: ['Lysates — bacterial cell fragments (broken cell walls containing peptidoglycans)', 'Fermentates — products of fermentation (enzymes, short-chain fatty acids, vitamins)', 'Secretions — proteins and peptides released by bacteria during growth'],
      stability: 'Highly stable; no live culture maintenance required; long shelf life; most "probiotic" skincare actually contains postbiotics',
      examples: ['Galactomyces ferment filtrate (from Saccharomyces cerevisiae fermentation)', 'Lactobacillus ferment lysate', 'Bifida ferment lysate', 'Saccharomyces ferment']
    }
  },
  keyIngredients: {
    galactomyces_ferment: {
      source: 'Fermentation filtrate of Saccharomyces cerevisiae (sake yeast); discovered in Japanese sake brewery workers',
      benefits: ['Brightening and even skin tone', 'Pore minimising', 'Oil regulation', 'Antioxidant', 'Mild exfoliating from natural alpha-hydroxy acids in filtrate'],
      products: 'SK-II Facial Treatment Essence made galactomyces famous; now widely used',
      fitzpatrick_note: 'Excellent for all Fitzpatrick types including V-VI; brightening without irritation or bleaching'
    },
    bifida_ferment_lysate: {
      source: 'Lysate of Bifidobacterium bifidus fermentation',
      benefits: ['Strengthens skin barrier', 'Reduces sensitivity and reactivity', 'Anti-inflammatory', 'Protects against UV-induced damage (when combined with SPF)'],
      products: 'Lancôme Génifique serum; now widely used in barrier-repair products'
    },
    lactobacillus: {
      species_used: 'L. rhamnosus, L. acidophilus, L. plantarum, L. ferment',
      benefits: ['Produces lactic acid (natural AHA)', 'Produces bacteriocins (antimicrobial proteins)', 'Stimulates defensin production', 'Reduces S. aureus colonisation (relevant for eczema-prone skin)'],
      skin_types: 'Particularly beneficial for eczema-prone, sensitive, and blemish-prone skin'
    },
    saccharomyces_ferment: {
      source: 'Brewer\'s yeast fermentation products',
      benefits: ['Rich in B vitamins, amino acids, minerals, peptides', 'Anti-ageing (activates skin repair mechanisms)', 'Soothing'],
      note: 'Different from galactomyces despite both being yeast ferments'
    },
    niacinamide_microbiome: {
      note: 'Niacinamide (vitamin B3) modulates the skin microbiome favourably — reduces C. acnes without the dysbiosis of antibiotics; reduces Staphylococcus aureus adherence; reduces inflammation',
      dual_role: 'A conventional skincare ingredient with probiotic-adjacent effects'
    }
  },
  oralProbioticsForSkin: {
    evidence: 'Growing evidence that oral probiotics influence skin via the gut-skin axis',
    mechanisms: ['Gut microbiome produces short-chain fatty acids that modulate systemic inflammation', 'Gut probiotics reduce intestinal permeability (leaky gut), reducing systemic inflammatory triggers', 'Microbiome produces neurotransmitters and hormones that affect cortisol and sebum'],
    strains_with_evidence: {
      eczema: ['Lactobacillus rhamnosus GG — strongest evidence; reduced eczema risk in infants by 50% in landmark Finnish study', 'L. rhamnosus CGMCC1.3724', 'Bifidobacterium breve M-16V'],
      acne: ['Lactobacillus acidophilus + L. rhamnosus GG — reduced acne lesion count in pilot studies', 'L. reuteri — anti-inflammatory'],
      rosacea: ['Varied; gut-targeting probiotics show some evidence via gut-skin axis'],
      general_inflammation: ['Lactobacillus plantarum CJLP133 — reduced inflammatory cytokines']
    },
    dose: 'Typically 1-10 billion CFU (colony-forming units) daily; multi-strain products generally preferred',
    timing: 'Take with food to protect bacteria through stomach acid; separate from antibiotics by 2 hours'
  },
  microbiomeFriendlyRoutine: {
    title: 'Building a Microbiome-Friendly Skincare Routine',
    principles: [
      'Cleanse, don\'t sterilise — the goal is balance, not sterility',
      'Maintain the skin\'s natural pH (4.5-5.5)',
      'Avoid unnecessary antibacterial ingredients outside of targeted use',
      'Support the microbiome actively with pre/pro/postbiotic ingredients',
      'Protect the barrier to prevent microbiome disruption'
    ],
    cleansing: {
      recommendation: 'Gentle, pH-balanced cleansers (synthetic-free, sulphate-free, or gentle sulphate alternatives like cocamidopropyl betaine)',
      avoid: ['Antibacterial/triclosan-containing cleansers', 'High-pH bar soap (disrupts acid mantle)', 'Alcohol-based cleansers/toners', 'Over-washing (twice daily maximum)'],
      technique: 'Lukewarm water (hot water disrupts microbiome); pat dry rather than rub'
    },
    actives: {
      microbiome_friendly: ['Niacinamide — modulates without wholesale killing', 'Lactic acid — produced naturally by skin bacteria; gentle AHA', 'PHAs (gluconolactone, lactobionic acid) — gentler than AHAs; considered more microbiome-friendly'],
      use_carefully: ['Benzoyl peroxide — effective for acne but kills commensal bacteria broadly; use spot treatment not all-over', 'Antibiotics (topical or oral) — necessary in some cases but promote resistance and cause dysbiosis; always follow antibiotic treatment with restoration phase'],
      note: 'Retinoids and vitamin C are well-tolerated by the microbiome when used appropriately'
    },
    moisturising: ['Glycerin (prebiotic-like — feeds commensal bacteria)', 'Ceramides (restore barrier integrity, reduces dysbiosis triggers)', 'Hyaluronic acid (creates hydrated environment beneficial to commensal bacteria)', 'Squalane (naturally produced by skin microbiome; supplementing supports balance)'],
    postBiotic_layer: ['Apply postbiotic serum (galactomyces, bifida ferment lysate) after cleansing', 'Allow to absorb before heavier moisturiser', 'Consider probiotic-rich living mist (some brands refrigerate for live culture delivery)']
  }
};

export const GUT_SKIN_AXIS = {
  title: 'The Gut-Skin Axis: How Your Gut Microbiome Affects Your Skin',
  overview: `The gut microbiome — 100 trillion microorganisms in the digestive tract — communicates bidirectionally with the skin. Gut dysbiosis contributes to skin conditions via multiple pathways: systemic inflammation, altered immune polarisation, shared immune surveillance, neurotransmitter production affecting stress hormones, and nutritional deficiencies from compromised absorption.`,
  mechanisms: {
    intestinal_permeability: {
      description: 'When the gut barrier is compromised ("leaky gut"), bacterial products like LPS (lipopolysaccharide) enter systemic circulation and trigger systemic inflammation that manifests in skin.',
      evidence: 'Acne, rosacea, atopic dermatitis, and psoriasis patients all show increased intestinal permeability compared to controls in multiple studies',
      improvement: 'Probiotics, L-glutamine, zinc carnosine, and elimination of trigger foods reduce intestinal permeability'
    },
    immune_polarisation: {
      description: 'The gut microbiome trains the immune system toward Th1/Th17 responses (anti-inflammatory) or Th2 (pro-allergic, inflammatory). Western dysbiosis drives Th2 polarisation.',
      skin_effects: 'Th2 dominance is associated with atopic dermatitis; gut microbiome rebalancing toward Th1 can improve eczema'
    },
    short_chain_fatty_acids: {
      description: 'Gut bacteria produce SCFA (butyrate, propionate, acetate) when fermenting fibre. SCFAs have systemic anti-inflammatory effects.',
      skin_relevance: 'Low SCFA-producing bacteria associated with more severe eczema and psoriasis',
      increase_SCFAs: 'High-fibre diet; resistant starch; inulin prebiotic supplementation'
    },
    cortisol_connection: {
      description: 'Gut dysbiosis activates HPA axis stress response, elevating cortisol. Cortisol disrupts the skin barrier, increases sebum, impairs healing, and triggers inflammation.',
      cycle: 'Skin conditions cause psychological stress → cortisol → gut dysbiosis → worse skin → more stress'
    }
  },
  gutSkinDiet: {
    title: 'Dietary Approaches for Skin via the Gut Microbiome',
    increase: ['Fermented foods: kimchi, sauerkraut, kefir, yoghurt, kombucha, miso, tempeh', 'High-fibre foods: legumes, whole grains, vegetables, fruit', 'Polyphenol-rich foods: blueberries, green tea, dark chocolate, olive oil, pomegranate', 'Omega-3 rich foods: oily fish, flaxseed, walnuts, chia seeds', 'Colourful plant foods (diversity = diverse microbiome)'],
    reduce: ['Ultra-processed foods (damage microbiome diversity)', 'High-glycaemic foods (feed pathogenic bacteria, spike insulin)', 'Refined sugars', 'Excess alcohol (disrupts microbiome, increases intestinal permeability)', 'Low-fibre diet (starves SCFA-producing bacteria)'],
    acne_specifically: ['Low glycaemic index diet reduces acne severity significantly (multiple RCTs)', 'Reducing low-fat dairy reduces acne (mechanistic evidence via IGF-1)', 'Whey protein supplements can worsen acne'],
    eczema_specifically: ['Elimination diets (most common triggers: dairy, gluten, eggs, soy, nuts) — try with dietitian guidance', 'High-dose omega-3 reduces eczema severity', 'Probiotic supplementation during pregnancy reduces eczema risk in offspring']
  },
  gutSupplements: {
    title: 'Supplements for the Gut-Skin Axis',
    probiotics: 'See probiotic skincare section above for specific strains',
    prebiotics: ['Inulin 5-10g daily', 'FOS (fructooligosaccharides)', 'Acacia fibre', 'Resistant starch (cooled potato, green banana)'],
    zinc: '15-30mg daily — zinc carnosine form particularly good for gut lining; also directly antimicrobial for acne',
    vitamin_D: '2000-4000 IU daily — deficiency associated with eczema, psoriasis, and acne',
    omega_3: '2-3g EPA+DHA daily from fish oil or algae; anti-inflammatory via multiple pathways',
    L_glutamine: '5-10g daily — primary fuel for intestinal enterocytes; reduces intestinal permeability'
  }
};

export const ETHNIC_MICROBIOME_NOTES = {
  'west-african': {
    microbiomeFeatures: 'West African populations historically had high-fibre, plant-rich diets (cassava, plantain, yam, legumes) that supported high microbiome diversity. Urbanisation and shift to processed foods is linked to increasing rates of skin conditions including atopic dermatitis in African cities.',
    skinSpecific: 'Fitzpatrick V-VI skin has higher overall C. acnes loads on sebaceous areas but different phylotype distribution compared to lighter skin. More research needed on ethnic-specific microbiome differences.',
    traditionalFoods: ['Fermented foods: ogi/akamu (fermented corn), iru (fermented locust beans), ogiri (fermented melon seeds)', 'Rich in prebiotic fibres from root vegetables, legumes, and greens'],
    skincareCulture: 'African black soap (ose dudu) is naturally gentle and pH-supportive; palm kernel oil has lauric acid with antimicrobial properties similar to coconut oil'
  },
  'south-asian': {
    microbiomeFeatures: 'Traditional South Asian diet is rich in fermented foods (yoghurt/dahi, lassi, idli, dosa batter fermented for 8-12 hours, dhokla, kanji) which support healthy gut microbiome. Spice-rich cooking provides antioxidants and anti-inflammatory polyphenols.',
    acneConnection: 'South Asian populations have higher rates of PCOS and hormonal acne; gut microbiome support through traditional fermented foods and low-GI diet may be particularly important',
    skincare_traditional: 'Turmeric (curcumin) used topically has mild antimicrobial properties and inhibits C. acnes; neem also has antimicrobial microbiome-supporting properties',
    modern_issues: 'White rice staple diet and increasing processed food consumption in urban South Asian populations challenges microbiome diversity'
  },
  caribbean: {
    microbiomeFeatures: 'Caribbean cuisine rich in diverse plants, tropical fruits (mango, papaya, guava — polyphenol rich), spices, and traditional fermented preparations.',
    skincare: 'Aloe vera — native to the Caribbean region — has prebiotic properties (mannans and fructans) and supports skin microbiome',
    soursop: 'Annona muricata (soursop/guanábana) — traditional Caribbean medicinal plant with antimicrobial properties being studied for skin microbiome effects'
  },
  arab: {
    microbiomeFeatures: 'Traditional Arab cuisine includes fermented dairy (leben — fermented milk), olives (polyphenol-rich), dates (prebiotic fibre), and diverse spices',
    skincare: 'Argan oil has polyphenols and vitamin E; black seed oil (Nigella sativa) has antimicrobial thymoquinone that may beneficially modulate skin microbiome while being gentle to commensals',
    modern_issues: 'Gulf Arab diets have rapidly Westernised with high ultra-processed food intake correlated with increasing acne and skin condition prevalence'
  },
  latina: {
    microbiomeFeatures: 'Traditional Latin American diet rich in fermented foods: Mexican tepache, chicha morada, kvass-like preparations, corn-based ferments. Bean and legume rich diet supports SCFA production.',
    acne: 'Lower-GI traditional diets (tortillas, beans, vegetables) support better acne outcomes than Westernised diets',
    skincare: 'Aloe vera (native to Mexico — it was being used in skincare 1000 years before Western cosmetics), avocado (healthy fats supporting skin barrier microbiome), cacao (polyphenols)'
  },
  'east-asian': {
    microbiomeFeatures: 'Japanese and Korean diets are among the most microbiome-diverse globally — hundreds of distinct fermented foods. Kimchi (Korea), miso and natto (Japan), doenjang (Korea), douchi (China). High fish consumption provides omega-3s.',
    skincare_connection: 'The K-beauty ethos of "skin looks healthy when skin IS healthy" aligns well with microbiome-focused skincare. Galactomyces ferment — the basis of SK-II\'s famous essence — arose from observing sake brewery workers\' youthful hands despite manual labor.',
    gut_health: 'Natto (Japanese fermented soybean) contains nattokinase and is extremely rich in vitamin K2 and spermidine, which have skin-beneficial effects. Japanese gut microbiomes show distinct diversity patterns.',
    modern: 'Korean beauty includes prebiotic-rich snail mucin (contains glycosaminoglycans that feed skin bacteria) and ferment-heavy product formats'
  },
  'east-african': {
    microbiomeFeatures: 'Injera (Ethiopian/Eritrean sourdough flatbread fermented 3 days) is one of the world\'s great fermented staple foods — extremely rich in diverse bacterial cultures. Tej (Ethiopian honey mead) and other fermented beverages traditional.',
    skincare: 'Frankincense (Boswellia) resin — native to the Horn of Africa — has evidence for anti-inflammatory effects including at the gut level; boswellic acids reduce inflammatory cytokines',
    dairy: 'Fermented milk products (ayib — Ethiopian fresh cheese; yoghurt variants) part of traditional diet'
  },
  'south-african': {
    microbiomeFeatures: 'Traditional Southern African fermented foods: umqombothi (sorghum beer), amasi (fermented milk — similar to kefir, rich in Lactobacillus), maheu, magou. San Bushmen traditional diet of diverse plants, tubers, roots exceptionally microbiome-supportive.',
    skincare: 'Rooibos (Aspalathus linearis) contains aspalathin and nothofagin — unique antioxidants with anti-inflammatory properties; excellent topically for sensitive skin; supports microbiome stability. Marula oil (Sclerocarya birrea) — traditional South African tree; oil rich in oleic acid and antioxidants.'
  },
  'black-american': {
    microbiomeFeatures: 'Soul food traditions include fermented preparations (chow chow relish, hot sauce), legume-rich dishes, and collard greens (rich in prebiotic fibre). However, historical food access inequity has reduced microbiome-supportive food availability in many communities.',
    skincare: 'Shea butter — imported in Black American cosmetics tradition — contains triterpenes that may support skin microbiome balance. Apple cider vinegar (popular folk remedy) — diluted — may support skin pH and microbiome.',
    acne: 'PIH from acne on Fitzpatrick V-VI means even mild dysbiosis-driven acne has lasting visible consequences. Microbiome-gentle acne approaches are particularly important.',
    equity: 'Black communities in food deserts face systemic barriers to diverse, microbiome-supporting diets — an intersection of health equity and skin health'
  }
};

export function getMicrobiomeScienceOverview() {
  return MICROBIOME_SCIENCE_OVERVIEW;
}

export function getMajorResident(organism) {
  const o = organism.toLowerCase().replace(/ /g, '_');
  const map = {
    cutibacterium: MICROBIOME_SCIENCE_OVERVIEW.majorResidents.cutibacterium_acnes,
    c_acnes: MICROBIOME_SCIENCE_OVERVIEW.majorResidents.cutibacterium_acnes,
    staphylococcus_epidermidis: MICROBIOME_SCIENCE_OVERVIEW.majorResidents.staphylococcus_epidermidis,
    staphylococcus_aureus: MICROBIOME_SCIENCE_OVERVIEW.majorResidents.staphylococcus_aureus,
    malassezia: MICROBIOME_SCIENCE_OVERVIEW.majorResidents.malassezia,
    demodex: MICROBIOME_SCIENCE_OVERVIEW.majorResidents.demodex_folliculorum
  };
  return map[o] || null;
}

export function getDysbiosisCondition(condition) {
  const c = condition.toLowerCase();
  if (c.includes('acne')) return SKIN_DYSBIOSIS_CONDITIONS.acne;
  if (c.includes('eczema') || c.includes('atopic')) return SKIN_DYSBIOSIS_CONDITIONS.atopic_dermatitis;
  if (c.includes('rosacea')) return SKIN_DYSBIOSIS_CONDITIONS.rosacea;
  if (c.includes('seborrh') || c.includes('seb derm')) return SKIN_DYSBIOSIS_CONDITIONS.seborrhoeic_dermatitis;
  if (c.includes('dandruff')) return SKIN_DYSBIOSIS_CONDITIONS.dandruff;
  return SKIN_DYSBIOSIS_CONDITIONS;
}

export function getProbioticSkincareGuide(type = null) {
  if (type === 'probiotic') return PROBIOTIC_SKINCARE_GUIDE.definitions.probiotic;
  if (type === 'prebiotic') return PROBIOTIC_SKINCARE_GUIDE.definitions.prebiotic;
  if (type === 'postbiotic') return PROBIOTIC_SKINCARE_GUIDE.definitions.postbiotic;
  if (type === 'ingredients') return PROBIOTIC_SKINCARE_GUIDE.keyIngredients;
  if (type === 'oral') return PROBIOTIC_SKINCARE_GUIDE.oralProbioticsForSkin;
  if (type === 'routine') return PROBIOTIC_SKINCARE_GUIDE.microbiomeFriendlyRoutine;
  return PROBIOTIC_SKINCARE_GUIDE;
}

export function getGutSkinAxis(section = null) {
  if (section === 'diet') return GUT_SKIN_AXIS.gutSkinDiet;
  if (section === 'supplements') return GUT_SKIN_AXIS.gutSupplements;
  if (section === 'mechanisms') return GUT_SKIN_AXIS.mechanisms;
  return GUT_SKIN_AXIS;
}

export function getEthnicMicrobiomeNotes(communityId) {
  const key = communityId.replace(/-/g, '_');
  const id = communityId.includes('-') ? communityId : communityId.replace('_', '-');
  return ETHNIC_MICROBIOME_NOTES[id] || ETHNIC_MICROBIOME_NOTES[communityId] || null;
}

export const MICROBIOME_SKIN_STATS = {
  moduleId: 'microbiome_skin_guide',
  version: '1.0.0',
  topics: ['skin microbiome science', 'cutibacterium acnes phylotypes', 'staphylococcus aureus eczema', 'demodex rosacea', 'probiotics skincare', 'prebiotics', 'postbiotics', 'galactomyces ferment', 'bifida ferment lysate', 'gut-skin axis', 'ethnic microbiome'],
  communitiesSupported: 9,
  keyFacts: [
    'Skin hosts over 1000 bacterial species and trillions of microorganisms',
    'Acne is driven by specific C. acnes phylotypes (RT4/RT5), not overall bacterial load',
    'Staphylococcus aureus colonises 90% of atopic dermatitis skin',
    'Rosacea patients have 10-18x higher Demodex density than healthy skin',
    'Galactomyces ferment was discovered from sake brewery workers\' unexpectedly youthful hands',
    'Lactobacillus rhamnosus GG reduced eczema risk by 50% in landmark infant study',
    'Injera (Ethiopian fermented flatbread) is one of the world\'s most microbiome-rich staple foods'
  ]
};
