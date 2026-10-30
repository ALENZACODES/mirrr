/**
 * MIRRR — Skin Microbiome Guide (Multicultural Focus)
 * The gut-skin axis, skin bacteria, probiotics, prebiotics, and multicultural considerations.
 */

export const SKIN_MICROBIOME_SCIENCE = {
  title: 'The Skin Microbiome — What Lives on Your Skin',
  overview: 'The skin hosts approximately 1.8m bacteria per square centimetre; the total number of microorganisms living on the skin surface of a human body is estimated between 10^11 and 10^12 (one hundred billion to one trillion); these microorganisms form a complex community called the skin microbiome; the skin microbiome is as unique as a fingerprint — no two people share the same microbial community; the microbiome exists in dynamic equilibrium with the host (the human) and with environmental microorganisms',
  composition: {
    bacteria: 'The dominant bacterial phyla on skin are: Actinobacteria (dominated by Cutibacterium, formerly Propionibacterium); Firmicutes (dominated by Staphylococcus species); Proteobacteria; Bacteroidetes; the most common genera are Cutibacterium, Staphylococcus, Corynebacterium, and Micrococcus',
    fungi: 'The most prevalent skin fungus is Malassezia (affecting >90% of humans); Malassezia species feed on the sebum/lipid secreted by sebaceous glands; Malassezia overgrowth is associated with seborrhoeic dermatitis (dandruff), pityrosporum folliculitis, and some cases of atopic dermatitis',
    mites: 'Demodex folliculorum and Demodex brevis — tiny mites that live in hair follicles and sebaceous glands; present in virtually all humans after age 18; usually commensal (harmless); Demodex overpopulation is associated with rosacea and certain types of eyelid inflammation (demodex blepharitis)',
    viruses: 'The skin virome is largely composed of bacteriophages (viruses that infect bacteria); Papillomaviruses (HPV) are carried asymptomatically on the skin of most humans'
  },
  niches: {
    sebaceous: 'Sebaceous (oily) sites: face, scalp, upper chest, upper back; dominated by Cutibacterium acnes (the acne-associated bacterium); high sebum provides a rich carbon source for lipophilic bacteria; these sites have lowest microbial diversity',
    moist: 'Moist areas: armpits, groin, toe webs, between buttocks; dominated by Staphylococcus species (S. epidermidis, S. haemolyticus); highest microbial density of any skin site; these are the primary odour-producing sites',
    dry: 'Dry areas: forearms, legs, palms; highest microbial diversity; dominated by mixed Actinobacteria, Proteobacteria, and Firmicutes; lower overall bacterial count'
  },
  function: {
    barrier: 'The skin microbiome actively contributes to barrier function; commensal bacteria produce short-chain fatty acids that maintain the skin\'s slightly acid pH (4.5-5.5); this acid pH is essential for barrier enzyme activity; when pH rises (with overwashing, excessive actives, or ageing), barrier function degrades',
    immunity: 'Commensal skin bacteria continuously train the immune system to distinguish harmless from harmful organisms; S. epidermidis produces antimicrobial peptides that kill pathogens; the skin microbiome suppresses excess inflammation through signalling to skin immune cells',
    competition: 'Healthy commensal bacteria competitively exclude pathogenic bacteria through: physical space occupation; production of antimicrobial compounds; pH manipulation that favours commensals; this competitive exclusion is why broad-spectrum antibiotics (which kill commensals too) can paradoxically worsen skin conditions'
  }
};

export const GUT_SKIN_AXIS = {
  title: 'The Gut-Skin Axis — How Digestive Health Affects Skin',
  overview: 'The gut-skin axis refers to the bidirectional communication between the gastrointestinal tract\'s microbiome and the skin; the gut microbiome is approximately 100× more complex than the skin microbiome; disruptions in gut microbiome composition (dysbiosis) have been associated with inflammatory skin conditions including acne, rosacea, psoriasis, and atopic dermatitis',
  mechanisms: {
    leakyGut: 'Intestinal permeability ("leaky gut"): damage to the gut epithelial barrier allows bacterial products (lipopolysaccharide — LPS — from gram-negative bacteria; peptidoglycan from gram-positive bacteria) to enter the bloodstream; these microbial products trigger systemic inflammation; chronic low-grade inflammation from intestinal permeability may drive or worsen inflammatory skin conditions',
    immuneModulation: 'Gut bacteria produce metabolites that regulate immune function systemically; short-chain fatty acids (SCFAs — produced by bacterial fermentation of dietary fibre) have anti-inflammatory effects on skin immune cells; gut bacteria influence the balance of pro-inflammatory (Th17) and anti-inflammatory (Treg) immune pathways that determine susceptibility to inflammatory skin conditions',
    directBacterial: 'Some gut bacterial strains produce compounds that directly affect skin: tryptophan metabolism by gut bacteria produces indoles that affect skin barrier function; gut bacteria influence vitamin production (B vitamins, K2) that affects skin and hair; serotonin (made largely in the gut) modulates skin inflammation and sensation'
  },
  evidence: {
    acne: 'Multiple studies show reduced gut microbial diversity in people with acne vs healthy controls; the abundance of specific species (Faecalibacterium prausnitzii — anti-inflammatory; Bifidobacterium — beneficial) is reduced in acne patients; high-glycaemic diet → insulin spike → IGF-1 → androgens → sebum → acne is a well-established pathway that involves gut-hormone signalling',
    atopicDermatitis: 'Reduced microbial diversity in the gut (and skin) is one of the most consistent findings in atopic dermatitis (eczema) research; lower abundance of Lactobacillus, Bifidobacterium in the gut; dysbiosis precedes AD flares in some studies; the hygiene hypothesis: reduced childhood microbial exposure → reduced immune training → higher allergy/AD risk',
    rosacea: 'Higher prevalence of small intestinal bacterial overgrowth (SIBO) in rosacea patients; some studies show rosacea improvement with SIBO treatment; H. pylori (stomach bacterium) has been investigated as a rosacea trigger with mixed results',
    psoriasis: 'Psoriasis patients show distinct gut microbiome composition from healthy controls; reduced Akkermansia muciniphila (a beneficial mucus-degrading bacterium); the gut-skin axis in psoriasis involves IL-17 and IL-23 immune pathways that originate partly from gut immune priming'
  },
  dietary: {
    fibre: 'Dietary fibre feeds beneficial gut bacteria that produce SCFAs; diversity of plant foods (30 different plant species per week is the goal promoted by the American Gut Project) increases gut microbial diversity; fermented foods provide live bacteria',
    fermented: 'Fermented foods provide direct inoculation of the gut with beneficial bacteria; evidence from a 2021 Stanford RCT showed that eating a high-fermented food diet (yoghurt, kefir, kimchi, fermented vegetables) significantly increased gut microbial diversity and reduced inflammatory markers within 10 weeks; this is the most direct dietary evidence for modulating the gut microbiome to reduce inflammation',
    highGlycaemic: 'High-glycaemic diet → insulin and IGF-1 spikes → androgenic cascade → sebum increase and inflammatory acne pathway; low-glycaemic diets reduce insulin and IGF-1; the 2007 AJCN study showed significant acne reduction in young men eating a low-glycaemic diet over 12 weeks',
    dairyAcne: 'The acne-dairy link: epidemiological evidence links milk consumption (particularly skim milk — paradoxically more strongly than full-fat) with acne; proposed mechanisms involve IGF-1 content of milk; whey protein spikes insulin; the hormonal content of commercially produced milk; this remains an area of active debate with mixed study results'
  }
};

export const PROBIOTICS_SKIN = {
  title: 'Probiotics and Skin — the Evidence',
  definition: 'Probiotics: live microorganisms that, when consumed in adequate amounts, confer a health benefit on the host; they must survive stomach acid to reach the intestine; the most studied genera for skin applications are Lactobacillus, Bifidobacterium, Bacillus, and Streptococcus thermophilus',
  oralProbiotics: {
    atopicDermatitis: 'Oral probiotics for atopic dermatitis (eczema): significant evidence; a 2018 Cochrane Review found that probiotics reduced the severity of eczema in clinical trials; Lactobacillus rhamnosus GG and Lactobacillus reuteri show most consistent results; effects may be stronger in infants and children than adults',
    acne: 'Oral probiotics for acne: limited but promising evidence; a 2011 study showed that fermented milk consumption reduced inflammatory acne lesions; the anti-inflammatory mechanism (reducing IGF-1, modulating gut bacteria) is plausible; need for more large RCTs',
    rosacea: 'Oral Lactobacillus combinations have shown benefit in some small rosacea studies; anti-inflammatory mechanism through gut-skin axis'
  },
  topicalProbiotics: {
    mechanism: 'Topical application of probiotics or probiotic-derived ingredients (lysates, metabolites) aims to: shift the surface microbiome composition; produce antimicrobial peptides; reduce pH to favour commensals; modulate skin immune response',
    evidence: 'Topical probiotic evidence is earlier stage than oral; Lactobacillus plantarum lysate has shown anti-ageing properties in skin studies; Bifidobacterium longum extract has shown reduction in skin sensitivity; the field is growing rapidly',
    products: 'La Roche-Posay Toleriane (contains La Roche-Posay thermal spring water with selenium and multiple minerals that support microbiome); Mother Dirt AO+ Biome Friendly Moisturizer (contains Ammonia-Oxidising Bacteria); Gallinée probiotic skincare; Aurelia Probiotic Skincare'
  },
  prebiotics: {
    definition: 'Prebiotics are substrates that selectively promote the growth or activity of beneficial microorganisms; for skin, prebiotics can be applied topically to feed beneficial bacteria; for gut, prebiotics are dietary fibres',
    topical: 'Topical prebiotics include: inulin; beta-glucan; glucomannan; prebiotics in skincare provide nutrients selectively for commensal bacteria (particularly S. epidermidis) while being less utilised by pathogenic bacteria'
  }
};

export const ETHNIC_MICROBIOME_GUIDES = {
  'west-african': {
    community: 'West African',
    microbiomeContext: 'Research on the skin microbiome of African populations is significantly underrepresented in scientific literature; most microbiome studies have been conducted in North American and European (predominantly white) populations; this is a critical research gap',
    gutHealth: 'Traditional West African diets high in fermented foods (ogi — fermented corn porridge; fufu — fermented cassava; dawadawa — fermented locust beans; ogiri — fermented castor oil seeds; pito — fermented sorghum beer) provide diverse probiotic and prebiotic sources; the shift to Westernised diets in urban West Africa (high processed food; reduced fermented food consumption) may be contributing to increasing rates of skin conditions',
    seborrhoeaDandruff: 'Seborrhoeic dermatitis (scalp flaking/dandruff) driven by Malassezia overgrowth is common across all communities but presents differently on afro hair: tight coils trap Malassezia-friendly sebum; less frequent washing allows Malassezia to proliferate; anti-dandruff shampoos (ketoconazole, selenium sulfide, zinc pyrithione) must be used effectively on natural afro hair styles; for braided styles, applying zinc pyrithione spray or ketoconazole solution to the scalp between washes',
    traditionalFermented: 'Fermented West African foods with probiotic potential: ogi (fermented cereal gruel — Lactobacillus and Pediococcus species); fufu (fermented cassava — multiple lactic acid bacteria); dawadawa (fermented locust beans — Bacillus species with strong protease activity); pito (fermented millet/sorghum beer — lactic acid bacteria and wild yeasts)',
    skinConditions: 'Acne: predominantly inflammatory acne in West African skin (comedones are relatively less prominent; papules, pustules, and nodules more common — these are more likely to cause PIH); Malassezia folliculitis is frequently misdiagnosed as acne in West African skin (it looks similar but requires antifungal not antibiotic treatment); tinea versicolor (also Malassezia) causes hypo- or hyperpigmented patches that are particularly visible on dark skin'
  },
  'south-asian': {
    community: 'South Asian',
    microbiomeContext: 'South Asian populations have distinct gut microbiome composition from Western populations; higher prevalence of Prevotella (associated with plant-rich diets) and different Lactobacillus species profiles; research on South Asian skin microbiomes is limited',
    ayurvedicProbiotics: 'Ayurvedic tradition has long used fermented preparations with probiotic properties: dahi (yoghurt — central to the South Asian diet); buttermilk (chaas or lassi — lactic acid bacteria); idli and dosa (fermented rice and lentil — lactic acid bacteria); dhokla (fermented chickpea — Leuconostoc, Lactobacillus); kanji (fermented carrot water — traditional probiotic drink); these traditional foods provide ongoing microbiome support',
    turmericMicrobiome: 'Curcumin has demonstrated prebiotic effects — it modulates the gut microbiome by increasing beneficial Lactobacillus and Bifidobacterium and reducing pathogenic bacteria; the anti-inflammatory curcumin effect may operate partly through microbiome modulation',
    pcosMicrobiome: 'PCOS (affecting 20-25% of South Asian women) is associated with gut dysbiosis; insulin resistance (which drives PCOS) is bidirectionally linked with gut microbiome composition; probiotic supplementation has shown improvements in PCOS parameters (insulin sensitivity, androgen levels) in clinical trials — relevant for the hormonal acne-PIH cycle in South Asian women',
    skinConditions: 'Malassezia-related conditions: seborrhoeic dermatitis is common in South Asian communities; pityrosporum folliculitis mimics acne on the chest and back; tinea versicolor is prevalent in hot, humid South Asian climates; all require antifungal approach rather than antibacterial'
  },
  caribbean: {
    community: 'Caribbean',
    microbiomeContext: 'Caribbean populations have significant West African genetic heritage with additional Taino (indigenous), European, and South Asian influences depending on the island; the gut microbiome research on Caribbean populations is very limited',
    fermentedFoods: 'Caribbean fermented foods with probiotic relevance: pineapple vinegar (process similar to apple cider vinegar); fermented pepper sauces (wild fermentation); sorrel drink (hibiscus — in the fermented version — some probiotic cultures); coconut water kefir (live probiotic cultures added); soursop leaf tea (antimicrobial properties)',
    climateEffect: 'High heat and humidity in the Caribbean creates conditions for Malassezia overgrowth; tinea versicolor (Malassezia-driven white/brown skin patches) is very common in Caribbean populations; seborrhoeic dermatitis of the scalp is prevalent; regular use of antifungal shampoos (ketoconazole, selenium sulfide) and keeping the scalp clean and less oily helps manage Malassezia-driven conditions',
    skinConditions: 'The Caribbean climate drives: tinea pedis (athlete\'s foot) in moist environments; tinea corporis (ringworm — a superficial fungal, not worm, infection) in heat/humidity; pityriasis versicolor; these are all fungal skin conditions driven by environmental conditions that are separate from the bacterial microbiome conditions'
  },
  arab: {
    community: 'Arab',
    microbiomeContext: 'Arab populations span geographically and genetically diverse groups; Bedouin traditional diet (high animal protein, fermented dairy) vs urban Arab diet (increasingly Westernised) creates different microbiome profiles within Arab communities',
    fermentedFoods: 'Arab fermented foods: laban (fermented milk drink — widely consumed across the Arab world); labneh (strained yoghurt — probiotic); kishk (fermented bulgur wheat and yoghurt — Lebanon, Syria); shaneena (fermented camel or goat milk — traditional Bedouin); miso-equivalent fermented products in some North African cuisines; the traditional Arab dairy culture provides regular lactic acid bacterial intake',
    ramadanAndSkin: 'Ramadan fasting (intermittent fasting pattern — eating only between sunset and pre-dawn) may affect the skin microbiome and skin condition; fasting periods alter gut microbiome composition; some studies show improved inflammatory markers during Ramadan; the shift in eating timing and the large meals (iftar) may have mixed effects on skin',
    rosacea: 'Rosacea has a higher prevalence in lighter-skinned Arab populations (particularly Lebanese, Syrian, Levantine) than in Gulf Arab or North African populations; the Helicobacter pylori connection to rosacea has been studied in the Middle East; H. pylori is very prevalent in the region and eradication treatment has shown rosacea improvement in some studies',
    skinConditions: 'Desert climate Arab skin faces: extreme dryness disrupting microbiome balance; UV damage; mineral-rich water (in Gulf countries) raising skin pH and disrupting microbiome; air-conditioning reducing indoor humidity further drying skin and affecting microbiome'
  },
  latina: {
    community: 'Latina/Latin American',
    microbiomeContext: 'Latin American gut microbiome research has expanded significantly; the Mexican Microbiome Project and Brazilian research initiatives have begun characterising Latin American population microbiomes; findings show distinct bacterial community profiles influenced by traditional diets',
    fermentedFoods: 'Latin American fermented foods: tepache (fermented pineapple drink — Mexico); pulque (fermented agave sap — Mexico — one of the oldest fermented beverages in the Americas); kvass de remolacha (fermented beet drink — adapted in Latin America); curtido (fermented cabbage salad — El Salvador); chicha (fermented corn drink — South America); chicha morada (Peru — purple corn, barely fermented); all provide diverse microbial inoculation',
    cortisolMicrobiome: 'Psychosocial stress in Latina communities (immigration stress; acculturation stress; discrimination) raises cortisol → disrupts gut microbiome → worsens inflammatory skin conditions; the gut-skin-brain axis connects mental health stress to skin microbiome disruption; adaptogens (ashwagandha, rhodiola, reishi mushroom) as stress modulators may support the gut-skin axis',
    skinConditions: 'Tinea versicolor is prevalent in tropical/subtropical Latin American climates; perioral dermatitis (a rash around the mouth) is more common in Latina women — proposed connections to bacterial and Demodex changes; rosacea is less common in darker Latina skin but can occur particularly in lighter-skinned Latin American populations'
  },
  'east-asian': {
    community: 'East Asian',
    microbiomeContext: 'East Asian populations have among the best-studied gut microbiomes globally; Japanese and Chinese population microbiome studies are extensive; East Asian microbiomes have distinct features including higher Prevotella (plant-rich diets) and unique Bifidobacterium species profiles; the Japanese population has a unique microbiome adaptation to process seaweed (transferase genes from marine bacteria incorporated into human gut bacteria in the Japanese population)',
    fermentedFoods: 'East Asian fermented foods — among the richest fermented food traditions globally: Japanese: miso; natto (Bacillus subtilis fermented — not lactic acid bacteria — unique probiotic); tsukemono (pickled vegetables — lactic acid bacteria); sake lees (kasu — from sake brewing); Korean: kimchi (wild Lactobacillus kimchii and multiple LAB species — deeply studied); doenjang (soybean paste — Bacillus-fermented); dongchimi (water kimchi — lactic acid bacteria); Chinese: pai tsai (Chinese fermented cabbage); doubanjiang; baijiu (fermented grain spirit); these foods provide exceptional microbial diversity',
    seaweedMicrobiome: 'The unique Japanese gut adaptation to seaweed digestion (enzymes from marine bacteria incorporated into gut bacteria) is a striking example of microbiome-diet co-evolution; Japanese people who eat seaweed regularly can extract more nutritional value from it than people without this gut bacteria adaptation',
    skinConditions: 'Atopic dermatitis (eczema): East Asian populations have high prevalence of atopic dermatitis; filaggrin gene mutations (FLG — a structural protein essential for skin barrier) are highly prevalent in East Asian populations and are a major genetic risk factor for atopic dermatitis; the reduced filaggrin disrupts barrier → Staphylococcus aureus colonisation → immune sensitisation → eczema cycle; this explains why East Asian skin benefits from intensive barrier repair (ceramides, fatty acids)'
  },
  'east-african': {
    community: 'East African',
    microbiomeContext: 'East African populations are among the most genetically diverse populations in the world; the Hadza of Tanzania have one of the best-studied "pre-industrialised" microbiomes — with significantly higher diversity than Western populations; the loss of this diversity through urbanisation and Western diet adoption is a significant public health concern',
    hadzaMicrobiome: 'The Hadza hunter-gatherer microbiome contains approximately 40% more microbial species than Western urban microbiomes; Treponema species (gut commensals that have disappeared from Western guts) are abundant in Hadza; the microbiome diversity correlates with traditional diet (high fibre, diverse plant foods, fermented honey beer — mead-like); this diversity may explain some features of gut and skin resilience in traditional East African communities',
    fermentedFoods: 'East African fermented foods: tella (fermented beer from teff — Ethiopia); tej (honey wine/mead — Ethiopia); injera (teff sourdough — Lactobacillus and yeasts — eaten at every Ethiopian meal); amasi (fermented milk — Kenya, Tanzania — similar to kefir); umqombothi (sorghum beer — Zulu and other South/East African); these provide varied probiotic exposure',
    skinConditions: 'Dermatophytosis (ringworm, tinea) is common in East African children and persists in adults in humid areas; tinea capitis (scalp ringworm) requires oral antifungal treatment (topical is insufficient for scalp); Podoconiosis (a non-filarial lymphoedema of the feet from soil exposure) is endemic in Ethiopian highlands and causes skin changes — relevant to a small percentage of Ethiopian community members'
  },
  'south-african': {
    community: 'South African',
    microbiomeContext: 'The South African microbiome encompasses enormous diversity across ethnic groups; the Western Cape Cape Coloured community, Zulu, Xhosa, Sotho, and other groups have distinct microbiome profiles; urban South African microbiomes increasingly resemble Western profiles while rural and traditional communities retain higher diversity',
    fermentedFoods: 'South African fermented foods: umqombothi (traditional sorghum and maize beer — Zulu and other groups — lactic acid bacteria and yeasts); amasi (fermented milk — similar to kefir; widely consumed across South African communities); mageu (fermented maize porridge — a non-alcoholic probiotic drink); marula beer (fermented from marula fruit); mahewu (Xhosa fermented porridge)',
    rooibosMicrobiome: 'Rooibos consumption has prebiotic properties: the unique polyphenols in rooibos (aspalathin, nothofagin) are metabolised by gut bacteria and may selectively promote beneficial strains; South African research is investigating rooibos as a prebiotic dietary supplement',
    skinConditions: 'KwaZulu-Natal has high HIV prevalence; HIV-associated skin conditions include Kaposi\'s sarcoma (on darker skin, shows as dark purple-brown plaques); severe seborrhoeic dermatitis; disseminated Molluscum contagiosum; cryptococcal skin infections; these require antiretroviral treatment as the primary intervention with dermatological support'
  },
  'black-american': {
    community: 'Black American',
    microbiomeContext: 'Black American gut microbiomes reflect the complex dietary and cultural heritage of the African diaspora — traditional soul food (which retains some West African dietary principles modified by American availability and history) alongside Westernised diets; research is beginning to characterise distinct features of Black American microbiomes',
    soulFoodMicrobiome: 'Traditional soul food ingredients with microbiome benefits: collard greens (prebiotic fibre; vitamin K); black-eyed peas (prebiotic legume fibre); sweet potatoes (resistant starch — prebiotic); okra (very high fibre and mucilaginous compounds that support gut lining); the vegetable-heavy traditional soul food diet provides excellent prebiotic diversity; heavily processed modern interpretations with high sodium and saturated fat have different microbiome impacts',
    racialStressMicrobiome: 'Chronic racial stress (hypervigilance; microaggressions; systemic racism) elevates cortisol in Black Americans; cortisol chronically disrupts gut microbiome → leaky gut → systemic inflammation → worsens skin conditions; the skin manifestations of racial stress operate partly through the gut-skin-stress axis; community mental health and stress management are relevant to skin health in ways that are rarely discussed in standard dermatology',
    skinConditions: 'Folliculitis keloidalis nuchae (acne keloidalis nuchae — AKN): a chronic inflammatory condition at the back of the neck resulting in firm papules and keloid-like scarring; predominantly affects Black men; associated with specific haircut techniques (very close clipper cut at the nape) that cause ingrown hair; treatment requires anti-inflammatory approaches; Pseudofolliculitis barbae (razor bumps): extremely common in Black men due to the curved follicle causing curly hair to re-enter the skin; the inflammatory response to ingrown hair can cause PIH; the microbiome plays a role in the secondary bacterial infection component'
  }
};

export function getMicrobiomeSkinGuide(communityId) {
  const directMap = {
    'west-african': ETHNIC_MICROBIOME_GUIDES['west-african'],
    'south-asian': ETHNIC_MICROBIOME_GUIDES['south-asian'],
    caribbean: ETHNIC_MICROBIOME_GUIDES.caribbean,
    arab: ETHNIC_MICROBIOME_GUIDES.arab,
    latina: ETHNIC_MICROBIOME_GUIDES.latina,
    'east-asian': ETHNIC_MICROBIOME_GUIDES['east-asian'],
    'east-african': ETHNIC_MICROBIOME_GUIDES['east-african'],
    'south-african': ETHNIC_MICROBIOME_GUIDES['south-african'],
    'black-american': ETHNIC_MICROBIOME_GUIDES['black-american']
  };
  return directMap[communityId] || null;
}

export const MICROBIOME_SKIN_STATS = {
  moduleId: 'microbiome_skin_guide',
  version: '1.0.0',
  topics: ['skin microbiome 1.8 million bacteria per cm2', 'gut-skin axis leaky gut inflammation', 'fermented foods Stanford 2021 RCT microbiome diversity', 'Malassezia folliculitis misdiagnosed acne', 'Hadza microbiome diversity hunter-gatherer', 'seaweed digestion Japanese gut adaptation', 'PCOS gut dysbiosis insulin resistance probiotics', 'racial stress cortisol gut skin axis', 'atopic dermatitis filaggrin East Asian mutation', 'kimchi kimchii Lactobacillus probiotic', 'acne insulin IGF-1 high glycaemic diet', 'low-glycaemic AJCN 2007 acne RCT', 'Akkermansia muciniphila psoriasis dysbiosis'],
  communitiesSupported: 9,
  keyFacts: [
    'A landmark 2021 Stanford RCT demonstrated that eating a high-fermented food diet (yoghurt, kefir, kimchi, fermented vegetables) significantly increased gut microbial diversity and reduced inflammatory markers within 10 weeks — this is the most direct dietary evidence yet for using food to modulate the gut microbiome and reduce systemic inflammation that affects skin conditions; the effect was stronger for fermented foods than for a high-fibre diet alone',
    'The Hadza hunter-gatherer community of Tanzania has approximately 40% more microbial species in their gut microbiomes than Western urban populations; this extraordinary diversity correlates with their traditional high-fibre, diverse-plant diet; as urbanisation and Western dietary patterns spread to East African communities, this diversity is being lost, which may explain rising rates of allergic and inflammatory conditions including atopic dermatitis',
    'Japanese people who regularly eat seaweed have a unique gut adaptation: gut bacteria in Japanese people (but not in Western populations without Japanese heritage) carry porphyranase and agarase enzymes — transferred from marine bacteria through horizontal gene transfer — that allow them to digest seaweed polysaccharides more efficiently; this is one of the most striking examples of human gut microbiome adaptation to a specific dietary tradition',
    'The gut-skin-stress axis has particular clinical significance for Black American communities: chronic racial stress elevates cortisol chronically, which disrupts gut microbiome composition, increases intestinal permeability (leaky gut), and drives systemic low-grade inflammation that worsens inflammatory skin conditions including acne, rosacea, and atopic dermatitis; dermatology that does not acknowledge the psychosocial determinants of skin health in communities of colour is providing incomplete care'
  ]
};
