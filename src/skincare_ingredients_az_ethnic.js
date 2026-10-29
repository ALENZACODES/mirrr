/**
 * MIRRR — Skincare Ingredients A-Z: Ethnic Skin Focus
 * Comprehensive ingredient reference with ethnic skin considerations.
 */

export const INGREDIENTS_A_TO_E = {
  alpha_arbutin: {
    name: 'Alpha Arbutin',
    whatItIs: 'A glucoside derivative of hydroquinone; found naturally in bearberry, cranberry, blueberry, and pear plants; a skin-brightening and hyperpigmentation-reducing active',
    mechanism: 'Inhibits tyrosinase (the key enzyme in melanin synthesis) through a competitive inhibition mechanism; reduces melanin production in melanocytes; works more slowly than hydroquinone but with a significantly safer profile',
    ethnicConsideration: 'Alpha arbutin is particularly valuable for melanin-rich skin (Fitzpatrick III-VI) where hyperpigmentation, PIH, and uneven tone are primary concerns; it is one of the safest evidence-based brightening ingredients for dark skin without the risks of hydroquinone; concentration: 0.5-2% is effective; works best combined with vitamin C and niacinamide for a layered brightening approach; pH-stable unlike some vitamin C formulations',
    communities: 'Widely recommended across all 9 MIRRR communities; particularly important for West African, South Asian, East African, Caribbean, Black American skin types where PIH is a primary concern',
    evidence: 'Strong evidence for tyrosinase inhibition in vitro; clinical studies show efficacy for melasma and PIH at concentrations of 1-2%; well-tolerated in dark skin'
  },
  aha: {
    name: 'Alpha Hydroxy Acids (AHAs): Glycolic, Lactic, Mandelic, Citric',
    whatItIs: 'Water-soluble exfoliating acids that work on the surface of the skin to dissolve the bonds between dead skin cells, facilitating their removal; derived from natural sources (glycolic from sugar cane; lactic from milk; mandelic from almonds; citric from citrus)',
    mechanism: 'AHAs break down the corneodesmosomes (protein bridges between corneocytes in the stratum corneum) through an acid-catalysed hydrolysis; this allows the stratum corneum to shed more effectively; regular AHA use accelerates cell turnover, improves skin texture, reduces fine lines, and improves hyperpigmentation by clearing pigmented cells from the epidermis',
    glycolicAcid: 'Glycolic acid: smallest molecule (58 g/mol); deepest penetration; most potent AHA; effective at lower percentages because of penetration; most irritating; best for those whose skin has built up tolerance',
    lacticAcid: 'Lactic acid: larger molecule than glycolic; gentler penetration; the preferred AHA for sensitive skin and dark skin where the risk of AHA-induced irritation triggering PIH is a concern; also provides some humectant moisturisation',
    mandelicAcid: 'Mandelic acid: largest of the common AHAs; slowest penetration; most gentle; particularly recommended for dark skin (Fitzpatrick IV-VI) as a starting AHA because the slow penetration dramatically reduces the risk of irritation and PIH-triggering inflammation; effective for acne, PIH, and texture',
    ethnicWarning: 'AHAs on dark skin: PIH risk — any AHA-induced irritation, redness, or inflammation will trigger PIH in Fitzpatrick IV-VI skin; the PIH from an irritated AHA use can be MORE visible than the original hyperpigmentation being treated; therefore: start with mandelic or lactic acid rather than glycolic; start at low concentrations (5%); do not use daily; always follow with SPF; if redness or irritation develops, stop immediately and allow skin to recover before re-introducing',
    usage: 'Use in PM routine; always use SPF during AHA use (AHAs increase photosensitivity); do not combine with retinoids in the same routine'
  },
  azelaic_acid: {
    name: 'Azelaic Acid',
    whatItIs: 'A naturally occurring dicarboxylic acid found in wheat, rye, and barley; synthesised by skin yeast (Malassezia furfur); available as 15-20% prescription and 10% OTC',
    mechanism: 'Anti-inflammatory; inhibits tyrosinase (reducing melanin production); mildly keratolytic; antibacterial (inhibits protein synthesis in P. acnes); normalises aberrant keratinisation in follicles',
    ethnicConsideration: 'Azelaic acid is one of the most recommended ingredients for dark skin specifically: it treats the two most common dark skin concerns simultaneously — acne (antibacterial) and PIH (tyrosinase inhibition); critically, it is anti-inflammatory, meaning it actually reduces the risk of PIH rather than potentially triggering it (unlike more aggressive exfoliants); safe for use during pregnancy (making it the most commonly recommended PIH treatment for pregnant women of colour who cannot use hydroquinone or retinoids)',
    forms: 'Available as cream, gel, and foam; 15-20% prescription (Finacea, Skinoren) for rosacea and acne; 10% OTC serums increasing in popularity',
    communities: 'Highly recommended for South Asian, West African, Black American, Caribbean, East African, and other communities with high PIH rates; also for rosacea (common in Arab and South Asian skin)'
  },
  bakuchiol: {
    name: 'Bakuchiol',
    whatItIs: 'A meroterpene phenol extracted from the seeds and leaves of Psoralea corylifolia (bakuchi plant), used in Ayurvedic medicine for millennia; marketed as "natural retinol alternative"',
    mechanism: 'Does NOT share retinoid receptor binding with retinol; instead, has been shown in gene expression studies to upregulate similar gene pathways to retinoids (collagen types I, III, IV; fibrillin expression); has anti-inflammatory and antioxidant properties; different molecular mechanism from retinoids but overlapping outcomes',
    ethnicConsideration: 'Bakuchiol is particularly valuable for dark skin as a retinol alternative because: (1) it does not cause the retinoid dermatitis (flaking, irritation) that can trigger PIH in dark skin; (2) it can be used during pregnancy (unlike retinoids); (3) it is well-tolerated in Fitzpatrick IV-VI; it is a genuinely effective option for those who cannot tolerate retinol, not merely a "less effective" substitute for strong skin',
    communities: 'Particularly recommended for South Asian and other communities with high Ayurvedic cultural connection; also for pregnant women across all communities who need anti-aging/brightening without retinoids'
  },
  bha: {
    name: 'Beta Hydroxy Acid (BHA): Salicylic Acid',
    whatItIs: 'Oil-soluble exfoliating acid derived from willow bark; the primary BHA used in skincare; effective at 0.5-2%',
    mechanism: 'BHA is oil-soluble (unlike water-soluble AHAs); this allows it to penetrate into the pore itself through sebum; it exfoliates within the pore, removing the dead skin cells and sebum that create blackheads and whiteheads; also anti-inflammatory through inhibition of arachidonic acid metabolism; keratolytic at higher concentrations',
    ethnicConsideration: 'Salicylic acid is generally well-tolerated on all skin types including dark skin; because it is anti-inflammatory as well as exfoliating, the risk of PIH from salicylic acid is lower than from AHAs; highly effective for acne-prone skin types (common in many communities); used in dandruff shampoos for scalp; in makeup removal, salicylic acid cleansers are popular',
    communities: 'Recommended across all communities for oily/acne-prone skin; particularly valuable for South Asian women with PCOS-driven acne; for scalp dandruff/seborrheic dermatitis'
  },
  ceramides: {
    name: 'Ceramides',
    whatItIs: 'Lipid molecules that are a naturally occurring component of the skin barrier (stratum corneum); ceramides comprise approximately 50% of the lipid content of the stratum corneum (the remainder being cholesterol and free fatty acids in a 3:1:1 ratio)',
    mechanism: 'Ceramides are structural components of the skin barrier — they fill the spaces between corneocytes like "mortar between bricks"; they prevent transepidermal water loss (TEWL) and keep irritants and allergens out; depleted ceramides (from over-exfoliation, aging, eczema, cold weather, harsh cleansers) cause increased TEWL and a compromised barrier that allows irritants and moisture loss',
    ethnicConsideration: 'Multiple studies have found that Black skin has lower ceramide levels in the stratum corneum compared to white or Asian skin; this may contribute to the tendency toward dry, ashy appearance in dark skin and potentially to the higher rates of eczema in Black children; ceramide-rich moisturisers (CeraVe, Vanicream, La Roche-Posay Lipikar) are particularly beneficial for dark skin as both a daily moisturiser and eczema management',
    communities: 'West African, Black American, East African, South African skin may benefit particularly from ceramide supplementation; important for all communities with eczema or compromised barrier'
  },
  kojic_acid: {
    name: 'Kojic Acid',
    whatItIs: 'A chelating agent produced as a byproduct of fermentation of malting rice (used in Japanese sake production); also produced by Aspergillus and Penicillium fungi species; a widely used skin brightening agent',
    mechanism: 'Inhibits tyrosinase through copper chelation (tyrosinase requires copper as a cofactor); without its copper cofactor, tyrosinase cannot produce melanin; also has antioxidant properties',
    ethnicConsideration: 'Kojic acid is effective for PIH, melasma, and uneven tone; it is widely used in East Asian brightening products (historically associated with sake skin — the exceptionally smooth, even skin of sake brewers\' wives who routinely submerged their hands in sake during production); for dark skin, it is well-tolerated at standard concentrations (1-2%) but some individuals may experience irritant contact dermatitis which could worsen PIH; combining with niacinamide reduces irritation potential',
    communities: 'Particularly culturally relevant for East Asian communities (sake fermentation origin); widely used across South Asian, Arab, and East African communities for brightening; effective for melasma common in South Asian women'
  },
  niacinamide: {
    name: 'Niacinamide (Vitamin B3)',
    whatItIs: 'The amide form of vitamin B3 (niacin); a water-soluble vitamin found in yeast, meat, fish, nuts, and green vegetables; one of the most versatile and well-tolerated skincare actives',
    mechanism: 'Multiple mechanisms: (1) inhibits melanosome transfer from melanocytes to keratinocytes — reduces pigmentation without inhibiting melanin production (a different mechanism from tyrosinase inhibitors); (2) increases ceramide and free fatty acid production — strengthens the skin barrier; (3) reduces sebum production; (4) anti-inflammatory; (5) stimulates collagen and filaggrin production; (6) reduces skin protein glycation (anti-aging)',
    ethnicConsideration: 'Niacinamide is arguably the most universally recommended ingredient for melanin-rich skin; it addresses the three primary dark skin concerns simultaneously — hyperpigmentation (melanosoma transfer inhibition), barrier function (ceramide support), and sebum (oil control); it is exceptionally well-tolerated with minimal risk of triggering PIH (anti-inflammatory) making it suitable for daily use at 5-10%; safe for pregnancy; no photosensitisation',
    myth: 'The niacinamide-vitamin C flushing myth: an older concern was that combining niacinamide and vitamin C would create niacin (which causes skin flushing); this was based on high-temperature chemistry not relevant to room-temperature skincare application; modern formulations containing both are safe and the combination is synergistic for brightening',
    communities: 'The single most widely recommended ingredient across all 9 MIRRR communities; essential for South Asian, West African, East African, Caribbean, Black American, and South African skin; also beneficial for East Asian glass skin approach'
  }
};

export const INGREDIENTS_F_TO_N = {
  ferulic_acid: {
    name: 'Ferulic Acid',
    whatItIs: 'A plant-derived antioxidant found in the cell walls of plants including rice, oats, wheat, and apples; commonly used as a stabiliser and synergist for vitamin C in skincare formulations',
    mechanism: 'Antioxidant that scavenges free radicals; significantly enhances the stability and efficacy of vitamin C and vitamin E in formulations (the combination of 15% vitamin C + 1% vitamin E + 0.5% ferulic acid increases antioxidant efficacy 8-fold versus vitamin C alone — the SkinCeuticals C E Ferulic formulation established this); photoprotective properties',
    ethnicConsideration: 'Ferulic acid\'s primary contribution is stabilising vitamin C; vitamin C is particularly beneficial for dark skin (brightening, antioxidant); the ferulic acid stabilisation makes the vitamin C formulation more effective and longer-lasting',
    communities: 'Benefits all communities as part of vitamin C formulation; particularly relevant for dark skin communities using vitamin C for brightening'
  },
  glycerin: {
    name: 'Glycerin (Glycerol)',
    whatItIs: 'A simple polyol (alcohol) compound; occurs naturally in triglycerides in animal and vegetable fats; a ubiquitous humectant in skincare and haircare',
    mechanism: 'Humectant: attracts and holds water molecules from the environment (and from deeper skin layers) into the epidermis; improves skin hydration; also has skin-protective film-forming properties; enhances penetration of other ingredients',
    ethnicConsideration: 'Glycerin is beneficial for all skin types; particularly important for dark skin (Black, West African, Black American) which studies show may have lower baseline hydration than some other skin types; glycerin in moisturisers for dry/ashy dark skin is essential; also critical in haircare for coily hair (glycerin in leave-in conditioners attracts moisture to the hair shaft in humid environments)',
    caveat: 'In very low humidity environments, glycerin can draw moisture from the skin rather than the environment; in very dry climates, balance glycerin with occlusive ingredients (shea butter, oils) to seal the moisture in',
    communities: 'Universal benefit; particularly important in moisturisers for West African, Black American, Caribbean, and South African skin; essential humectant in LOC method for Type 4 hair'
  },
  hydroquinone: {
    name: 'Hydroquinone',
    whatItIs: 'The most potent skin-depigmenting agent available; used at 2% OTC in the US and up to 4% by prescription; banned for OTC use in some countries (EU, UK)',
    mechanism: 'Inhibits tyrosinase through competitive inhibition and structural analogy; also selectively toxic to melanocytes at higher concentrations; the fastest-acting and most effective topical depigmenting agent available',
    ethnicConsideration: 'Hydroquinone works very effectively on PIH and melasma in dark skin (when the primary concern is overactive melanocyte activity); HOWEVER: risk of ochronosis (a paradoxical darkening caused by buildup of homogentisic acid in the skin) with prolonged use of high-concentration hydroquinone; ochronosis is particularly documented in South African Black women who used high-concentration (often illegally obtained) hydroquinone lightening creams continuously for years; exogenous ochronosis is characterised by paradoxical blue-grey-black darkening that is permanent and extremely difficult to treat; safe use: 2-4% for no longer than 3-6 months; always combined with SPF; always under medical supervision',
    safety: 'The FDA began reviewing OTC hydroquinone safety in 2006; it has not been formally banned OTC in the US but is effectively not GRASE (generally recognised as safe and effective) under current FDA review; it is banned for OTC use in the EU; this reflects global regulatory concern rather than a definitive safety determination at normal concentrations',
    communities: 'Used across all communities for PIH; ochronosis risk most documented in South African, West African, and Caribbean communities who have sometimes used high-concentration products long-term; recommend medical supervision and time-limited use'
  },
  neem: {
    name: 'Neem (Azadirachta indica)',
    whatItIs: 'A tree native to the Indian subcontinent; all parts of the neem tree (leaves, bark, seeds, oil) have been used in Ayurvedic and traditional medicine for over 4,000 years; neem oil is extracted from the seeds',
    mechanism: 'Anti-bacterial, anti-fungal, anti-inflammatory, anti-parasitic; contains nimbidin, nimbin, nimbolide, quercetin, azadirachtin and other active compounds; specific anti-inflammatory mechanism: inhibits prostaglandin synthesis',
    ethnicConsideration: 'Neem is deeply embedded in South Asian beauty culture and Ayurvedic medicine; used for acne, scalp health (anti-dandruff), wound healing, and general skin health; neem face wash and neem oil are mainstream products in Indian skincare; neem for scalp: anti-fungal properties relevant to Malassezia-driven dandruff; neem has a very strong odour that limits its use in modern formulations',
    communities: 'Particularly culturally relevant for South Asian communities; also used in West African traditional medicine; available globally in health food stores and Ayurvedic product lines'
  }
};

export const INGREDIENTS_O_TO_Z = {
  petrolatum: {
    name: 'Petrolatum (Petroleum Jelly, Vaseline)',
    whatItIs: 'A semisolid mixture of hydrocarbons purified from petroleum; Vaseline is the most widely recognised brand; the most effective occlusive ingredient known',
    mechanism: 'Pure occlusive: creates an impermeable layer on the skin surface that prevents transepidermal water loss (TEWL); does NOT add moisture — it locks in moisture already present; the single most effective TEWL-prevention ingredient; FDA has repeatedly confirmed its safety',
    ethnicConsideration: 'Petrolatum is a historically significant skincare ingredient in Black American, West African, Caribbean, and other communities; "greasing" the skin with petroleum jelly has been practiced in Black American communities for generations (combined with the observation that dark skin looks dry/"ashy" without adequate barrier support); the practice has scientific validity — dark skin may have lower ceramide content and benefits from occlusive sealing of moisture; however, petrolatum on the scalp occludes follicles; best use: on clean, damp skin on the body; on lips (the gold standard lip moisturiser); on very dry patches; not recommended as a face moisturiser for acne-prone skin',
    communities: 'Historically central in Black American, West African, Caribbean beauty; excellent for lips and body dry patches; safe for all communities; avoid if severely acne-prone on face'
  },
  retinol: {
    name: 'Retinol and Retinoids',
    whatItIs: 'Vitamin A and its derivatives; the family includes: retinyl esters (most gentle; slowest conversion to active form); retinol (over-the-counter gold standard); retinaldehyde/retinal (intermediate; faster acting); tretinoin/retinoic acid (prescription; most potent; works immediately without conversion)',
    mechanism: 'Retinol is converted to retinoic acid in the skin through enzymatic processes; retinoic acid binds to nuclear retinoic acid receptors (RARs) and retinoid X receptors (RXRs); these regulate gene expression leading to: increased cell turnover (clearing dull skin and hyperpigmentation); stimulation of collagen and elastin production; inhibition of matrix metalloproteinases (enzymes that degrade collagen); normalisation of follicular keratinisation (addressing comedones and acne)',
    darkSkinProtocol: 'Retinol protocol for dark skin — the critical safety approach: (1) START at the lowest available concentration (0.025% retinol); (2) use ONCE weekly to begin; (3) apply after moisturiser (buffer technique) to reduce penetration and irritation; (4) increase frequency gradually (every 2 weeks if no irritation — increase to 2x/week, then 3x, then alternate nights, then nightly); (5) if retinoid dermatitis (flaking, redness, irritation) develops — PAUSE immediately; the dermatitis triggers PIH in dark skin; (6) always use SPF daily; (7) transition to higher concentrations (0.05%, 0.1%, 0.3%) only after skin has fully adapted to lower concentration',
    ethnicCaution: 'The two-fold risk of retinoids in dark skin: first, retinoid dermatitis (the expected initial irritation phase of retinoid use) triggers PIH in dark skin; the PIH from retinoid irritation can be more visible than the original concern being treated; second, tretinoin at appropriate concentrations treats PIH beautifully by accelerating cell turnover — so the goal is to reach the therapeutic benefit without the PIH-triggering dermatitis; the buffer technique and gradual introduction achieve this',
    communities: 'Applicable to all communities; specific careful protocol required for South Asian, West African, East African, Caribbean, Black American, South African (Fitzpatrick IV-VI) skin; starts in 20s for preventive use; essential anti-aging ingredient across all ethnic groups'
  },
  tranexamic_acid: {
    name: 'Tranexamic Acid',
    whatItIs: 'Synthetic lysine derivative; originally a haemostatic (blood-clotting) drug; discovered to have skin-lightening properties through observation that patients taking oral tranexamic acid for heavy periods had improvement in melasma',
    mechanism: 'Inhibits plasmin-dependent melanocyte-activating pathways; reduces prostaglandins that stimulate melanocytes; multiple points of intervention in pigmentation pathway distinct from tyrosinase inhibition (making it effective where tyrosinase inhibitors are insufficient)',
    ethnicConsideration: 'Tranexamic acid has emerged as one of the most promising treatments for melasma, particularly in South Asian women who suffer high rates of melasma; oral tranexamic acid (250mg twice daily) has been studied specifically in Asian women with melasma and shows strong evidence; topical tranexamic acid (2-5%) is increasingly included in brightening serums; the safety profile (no ochronosis risk unlike hydroquinone; not photosensitising unlike AHAs; no PIH risk) makes it ideal for dark skin',
    communities: 'Particularly recommended for South Asian, East Asian, Latina, and Arab women with melasma; increasingly used across all communities for PIH and uneven tone'
  },
  turmeric: {
    name: 'Turmeric (Curcumin)',
    whatItIs: 'Curcuma longa root; contains curcumin (3-7% of dry weight) as the primary bioactive compound; widely used in Ayurvedic and traditional medicine across South Asia, Southeast Asia, and North Africa',
    mechanism: 'Curcumin: anti-inflammatory (inhibits NF-kB pathway — a master regulator of inflammation); antioxidant; mild tyrosinase inhibition (brightening); wound-healing properties; anti-bacterial',
    ethnicConsideration: 'Turmeric face masks (haldi in South Asian tradition; curcuma in North African tradition) are among the most globally embedded traditional beauty practices; in South Asian weddings, haldi ceremony involves applying turmeric paste to the bride and groom as a pre-wedding beauty and blessing ritual; in Moroccan and North African tradition, curcuma in ghassoul (rhassoul clay) masks is used for brightening; the evidence base for topical curcumin is growing; key limitation: turmeric stains skin yellow-orange (temporary) and stains clothes and towels permanently; this is managed with thorough washing',
    staining: 'Turmeric staining management: mix turmeric with carrier oil rather than water (oil-based mixture is easier to wash off); wash off thoroughly; follow with gentle cleanser; use a towel you don\'t mind staining',
    communities: 'Deeply culturally embedded in South Asian communities (haldi); also significant in Arab, North African, West African, and East African traditional beauty; the most culturally specific traditional beauty ingredient after henna'
  },
  vitamin_c: {
    name: 'Vitamin C (L-ascorbic Acid and Derivatives)',
    whatItIs: 'L-ascorbic acid is the active form of vitamin C; unstable in water-based formulations (oxidises); derivatives include: sodium ascorbyl phosphate, ascorbyl glucoside, magnesium ascorbyl phosphate, tetrahexyldecyl ascorbate (oil-soluble; very stable)',
    mechanism: 'Antioxidant: scavenges free radicals generated by UV exposure and oxidative stress; inhibits tyrosinase (brightening; PIH reduction); stimulates collagen synthesis; reduces inflammatory mediators',
    stability: 'Vitamin C formulation challenge: L-ascorbic acid at pH below 3.5 in an anhydrous or minimal-water formulation is the most effective but oxidises rapidly; signs of oxidation: the serum turning orange/brown/dark (oxidised vitamin C has reduced efficacy); proper storage in a dark, cool location; use within the product\'s stated period after opening',
    ethnicConsideration: 'Vitamin C is among the most beneficial ingredients for dark skin: antioxidant protection against UV-induced damage; tyrosinase inhibition for brightening and PIH reduction; collagen stimulation for anti-aging; well-tolerated at 10-20%; vitamin C + niacinamide is a potent brightening combination for dark skin',
    communities: 'Strongly recommended across all communities; particularly beneficial for PIH-prone skin (South Asian, West African, Black American, East African, Caribbean); central to Korean glass-skin approach'
  },
  zinc: {
    name: 'Zinc (Zinc Oxide, Zinc PCA, Zinc Gluconate)',
    whatItIs: 'Zinc is an essential mineral; in skincare it appears in multiple forms: zinc oxide (physical UV filter; also soothing and anti-inflammatory); zinc PCA (sebum-regulating and antibacterial); zinc gluconate and zinc sulphate (oral and topical for acne)',
    mechanism: 'Zinc oxide: physical UV scattering; anti-inflammatory; zinc PCA: sebum regulation; mild antibacterial; zinc in acne: oral zinc sulphate/gluconate inhibits bacterial keratin-ase and reduces neutrophil chemotaxis (anti-inflammatory)',
    whiteCast: 'The white cast problem with zinc oxide: zinc oxide is a white mineral particle; at high concentrations in sunscreen it leaves a visible white film on the skin; this is the primary complaint of dark-skinned individuals about physical sunscreens; solutions: tinted mineral sunscreens (iron oxides added to the formulation match deeper skin tones); micro-fine zinc oxide particles (better cosmetic elegance); hybrid mineral-chemical sunscreens',
    ethnicConsideration: 'Zinc oxide is the safest UV filter for dark skin in terms of the zero-PIH-triggering risk (unlike chemical filters such as oxybenzone which can cause contact reactions); the white cast challenge has significantly limited zinc oxide sunscreen adoption in dark skin communities; tinted zinc oxide sunscreens represent the solution',
    communities: 'Zinc oxide in tinted formulas for all dark-skinned communities; zinc PCA for oily skin types across South Asian, West African, Caribbean, Black American, and East Asian communities'
  },
  squalane: {
    name: 'Squalane',
    whatItIs: 'A hydrogenated (saturated) form of squalene; squalene occurs naturally in human sebum (approximately 13% of sebum composition); squalane (the stable hydrogenated form) is derived from plant sources: olive oil, sugarcane (more sustainable), amaranth seed oil; shark liver squalene (previously the primary source) is now avoided due to conservation concerns',
    mechanism: 'Emollient: fills the spaces between skin cells creating a smooth surface; mimics sebum composition; non-comedogenic; stable (squalene in sebum oxidises and contributes to comedone formation; squalane is stable and non-comedogenic); excellent skin penetration; suitable for all skin types including oily and acne-prone',
    ethnicConsideration: 'Squalane is ideal for dark skin as a moisturising oil: lightweight enough not to cause the product buildup that contributes to scalp and skin conditions; non-comedogenic; its composition mimics the skin\'s own sebum; appropriate for the dry hair lengths of coily hair when applied as a finishing oil',
    communities: 'Recommended across all communities; particularly suitable for oily/acne-prone skin (South Asian, East Asian) due to non-comedogenic properties; suitable for coily hair as a lightweight finishing oil'
  }
};

export const INGREDIENT_INTERACTIONS = {
  title: 'Key Ingredient Interactions to Know',
  retinol_aha: 'Retinol + AHAs in same routine: both cause cell turnover and skin sensitivity; using them together significantly increases irritation risk; particularly dangerous for dark skin where irritation triggers PIH; recommendation: use retinol in PM and AHAs on alternate nights, or use them in separate AM/PM routines or separate days entirely',
  vitaminC_niacinamide: 'Vitamin C + Niacinamide: the historical concern about this combination causing niacin flushing is NOT supported by modern evidence at room-temperature skincare application; they can and should be used together (synergistic brightening)',
  vitaminC_retinol: 'Vitamin C + Retinol: vitamin C is best used in AM (antioxidant protection against daytime UV); retinol is best used in PM (photosensitive; works during cell turnover overnight); natural AM/PM separation works well',
  aha_spf: 'AHAs + SPF: AHAs increase skin photosensitivity (remove some of the protective dead skin layer); always use SPF during AHA use; this is particularly important for dark skin where UV-triggered PIH is a primary concern'
};

export function getIngredientInfo(ingredientKey) {
  const allIngredients = {
    ...INGREDIENTS_A_TO_E,
    ...INGREDIENTS_F_TO_N,
    ...INGREDIENTS_O_TO_Z
  };
  return allIngredients[ingredientKey] || null;
}

export const INGREDIENTS_ETHNIC_PRIORITY = {
  darkSkin: {
    essential: ['niacinamide', 'alpha_arbutin', 'azelaic_acid', 'vitamin_c', 'spf', 'ceramides', 'retinol (gentle introduction)'],
    caution: ['hydroquinone (time-limited only)', 'aha (start with mandelic/lactic)', 'retinol (strict gentle protocol)'],
    avoid: ['harsh scrubs (PIH trigger)', 'petrolatum on scalp', 'high-concentration AHAs without patch testing']
  },
  southAsian: {
    priority: ['tranexamic_acid (melasma)', 'niacinamide', 'azelaic_acid', 'vitamin_c', 'spf'],
    traditional: ['neem', 'turmeric', 'bakuchiol (Ayurvedic retinol alternative)', 'amla (vitamin C)']
  },
  eastAsian: {
    priority: ['niacinamide', 'vitamin_c', 'hyaluronic_acid', 'spf', 'ceramides'],
    traditional: ['ginseng (Korean)', 'sake ferment filtrate (Japanese)', 'snail mucin (Korean)', 'green tea antioxidant']
  },
  arab: {
    priority: ['azelaic_acid (rosacea)', 'niacinamide', 'spf', 'argan_oil'],
    traditional: ['rosewater', 'argan_oil (Moroccan)', 'black_seed', 'henna']
  }
};

export const SKINCARE_INGREDIENTS_STATS = {
  moduleId: 'skincare_ingredients_az_ethnic',
  version: '1.0.0',
  topics: ['niacinamide vitamin B3 melanosoma transfer PIH', 'retinol buffer technique dark skin PIH protocol', 'alpha arbutin tyrosinase inhibitor PIH', 'azelaic acid anti-inflammatory pregnancy safe', 'tranexamic acid melasma South Asian women', 'mandelic acid gentlest AHA dark skin', 'hydroquinone ochronosis South African warning', 'bakuchiol Ayurvedic retinol alternative pregnancy', 'zinc oxide white cast tinted sunscreen', 'ceramide dark skin barrier function low ceramides'],
  communitiesSupported: 9,
  keyFacts: [
    'Niacinamide (vitamin B3) inhibits melanosoma transfer from melanocytes to keratinocytes — the mechanism by which pigment is delivered to the skin surface — making it one of the most effective and safest brightening ingredients for all skin types; it simultaneously strengthens the skin barrier (increases ceramide and fatty acid production), reduces sebum production, and is anti-inflammatory; its safety profile (no photosensitisation, safe in pregnancy, no PIH-triggering risk, well-tolerated from the first use at 5-10%) makes it arguably the single most universally recommended skincare ingredient for melanin-rich skin and a critical ingredient in all 9 MIRRR ethnic communities\' skincare guidelines',
    'The retinoid protocol for dark skin requires careful dose escalation to avoid retinoid dermatitis triggering PIH; the recommended approach: start at 0.025% retinol once weekly, applied after moisturiser (the "buffer technique" reduces penetration and irritation); increase frequency every two weeks only if no irritation; pause immediately at any sign of redness, flaking, or irritation; the dermatitis phase of retinoid initiation that many fair-skinned individuals tolerate as merely inconvenient can trigger permanent visible PIH in Fitzpatrick IV-VI skin that is worse than the original concern being treated; the buffer technique and gradual escalation allow reaching the substantial benefits of retinoids without the PIH risk',
    'Hydroquinone is the most potent topical depigmenting agent available but carries a specific risk for dark-skinned users: exogenous ochronosis — a paradoxical, permanent blue-grey-black darkening caused by prolonged use of high-concentration (5-10%+) hydroquinone; this condition is particularly documented in South African Black women who used high-concentration skin-lightening products (often illegally obtained) continuously for years; ochronosis is extremely difficult to treat; safe hydroquinone use requires: concentrations of 2-4% only; time-limited application (maximum 3-6 months); always combined with SPF; always under medical supervision; never from unregulated street/market lightening products'
  ]
};
