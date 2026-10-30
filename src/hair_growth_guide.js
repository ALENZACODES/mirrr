/**
 * MIRRR Hair Growth & Retention Guide
 * Science-backed hair growth for all hair types
 * Scalp health, growth cycles, protective strategies, supplements
 */

// ─── HAIR GROWTH SCIENCE ──────────────────────────────────────────────────────

export const HAIR_GROWTH_SCIENCE = {
  growth_cycle: {
    anagen: {
      name: 'Anagen (Growth Phase)',
      duration: '2-7 years — this determines your maximum hair length potential',
      what_happens: 'The hair follicle is actively producing hair. Cells in the matrix divide rapidly, pushing the hair shaft upward.',
      note: 'The length of your anagen phase is largely genetic. People with very long natural hair have long anagen phases. People who struggle to grow hair past a certain length may have shorter anagen phases.',
    },
    catagen: {
      name: 'Catagen (Transition Phase)',
      duration: '10-20 days',
      what_happens: 'The follicle shrinks and detaches from the dermal papilla (blood supply). Hair growth stops.',
      
    },
    telogen: {
      name: 'Telogen (Resting Phase)',
      duration: '3 months',
      what_happens: 'The hair rests, no growth. The old hair is still in the follicle but loosely attached.',
      
      shed: 'At the end of telogen, the hair sheds and a new anagen hair replaces it. Normal shedding is 50-100 hairs per day.',
    },
    exogen: {
      name: 'Exogen (Shedding Phase)',
      duration: 'Part of telogen',
      what_happens: 'The club hair (dead telogen hair) is actively shed. Sometimes listed as a separate fourth phase.',
    },
  },

  growth_rate: {
    scalp_hair: 'Scalp hair grows approximately 0.5 inches (1.27cm) per MONTH, or 6 inches (15cm) per year on average',
    variation: 'Growth rate varies by: genetics, nutritional status, age, hormonal status, health',
    ethnic_variation: {
      
      
      european_hair: 'Average growth rate',
      note: 'Differences in RETENTION rather than growth rate explain apparent differences in length across ethnic groups',
    },
  },

  retention_vs_growth: {
    critical_insight: 'The most important insight in ethnic hair: the difference is not how fast hair GROWS but how much length is RETAINED. Coily and kinky hair has more curves where it can break. Length retention requires preventing breakage, not growing faster.',
    retention_killers: [
      'Mechanical manipulation (combing, brushing, tight styles)',
      'Heat damage (weakens the keratin structure)',
      'Chemical damage (over-processing with relaxer, bleach)',
      'Dryness (dry hair is brittle and breaks more easily)',
      'Lack of protective styling',
      'Rough handling (towel drying aggressively, detangling wet type 4 hair with wrong tools)',
    ],
    retention_builders: [
      'Protective styles (braids, twists, buns that tuck ends away)',
      'Regular moisturising (LOC or LCO method)',
      'Low-manipulation styling routines',
      'Protective sleep routine (satin/silk bonnet or pillowcase)',
      'Protein treatments to strengthen the hair shaft',
      'Regular trims to prevent splits travelling up the hair shaft',
    ],
  },
};

// ─── SCALP HEALTH ─────────────────────────────────────────────────────────────

export const SCALP_HEALTH = {
  why_scalp_first: 'The scalp is the soil the hair grows from. A healthy scalp = healthy hair growth. An unhealthy scalp can block the follicle, cause inflammation that disrupts the growth cycle, and directly limit how well hair grows.',

  scalp_conditions: {
    seborrheic_dermatitis: {
      what: 'Dandruff\'s more severe cousin — flaky, oily, sometimes itchy scalp with yellowish scales',
      cause: 'Overgrowth of Malassezia yeast (normal scalp resident) + inflammatory response',
      
      treatment: [
        'Ketoconazole shampoo (Nizoral) — antifungal, very effective',
        'Selenium sulfide shampoo (Head & Shoulders Itchy Scalp)',
        'Zinc pyrithione shampoo',
        'Tea tree oil diluted in carrier oil (has antifungal properties)',
      ],
      ethnic_consideration: 'Many Black hair routines involve less frequent washing — but seborrheic dermatitis needs more frequent cleansing of the scalp. Balance: co-wash more frequently, or use a diluted scalp cleanser between wash days.',
    },
    dandruff: {
      what: 'Mild form of seborrheic dermatitis — white or grey dry flakes, minimal itching',
      treatment: 'Medicated shampoos (zinc pyrithione, coal tar, selenium sulfide, ketoconazole). Use 2x per week, leave on 5 minutes before rinsing.',
      ethnic_note: 'Dandruff flakes are MORE VISIBLE on dark hair and dark clothing — this doesn\'t mean you have more dandruff, just that it shows more.',
    },
    psoriasis: {
      what: 'Autoimmune condition causing thick, red, silvery-scaled patches on scalp (and elsewhere)',
      
      treatment: 'Requires dermatologist — coal tar, salicylic acid, corticosteroid treatments, biologic medications for severe cases',
    },
    alopecia_areata: {
      what: 'Autoimmune condition causing patchy hair loss — round patches of complete baldness',
      
      treatment: 'Dermatologist — steroid injections, topical immunotherapy, JAK inhibitors (newer biologics showing promising results)',
    },
    traction_alopecia: {
      what: 'Hair loss caused by CHRONIC TENSION on the hair follicle — from tight hairstyles. The follicles are literally pulled out over time.',
      
      signs: [
        'Hair loss at the hairline (temples, edges, front)',
        'Breakage at the hairline',
        'Small pimples or folliculitis at the hairline from tension',
        'Gradual recession of the hairline',
      ],
      early_treatment: 'Stop tight styles immediately. The hair CAN grow back in early stages.',
      late_stage: 'In late-stage traction alopecia, the follicles are permanently destroyed and hair will not regrow without hair transplant.',
      prevention: [
        'Never wear tight braids or weaves on unprotected hair',
        'Ask your braider: "Are these too tight?" — you should not feel significant tension or see your skin pulling',
        'Give your edges a break — go without braids, ponytails, or weaves for weeks between styles',
        'Use foam bases and protective methods under extension styles',
        'If your scalp hurts after getting a style — it IS too tight. Get it loosened.',
      ],
      note: 'Traction alopecia is PREVENTABLE and is the most heartbreaking hair loss because it is caused by the very styles meant to protect and celebrate Black hair. Education is prevention.',
    },
    central_centrifugal_cicatricial_alopecia: {
      what: 'CCCA — a type of scarring alopecia (permanent hair loss from follicle scarring) that disproportionately affects Black women',
      where: 'Starts at the crown/vertex and spreads centrifugally (outward from the center)',
      causes: 'Not fully understood — likely a combination of genetics, inflammatory triggers, and possibly chemical relaxers, heat damage',
      signs: 'Thinning and recession at the crown, sometimes tenderness, itching, or a burning sensation',
      critical: 'CCCA causes permanent scarring of follicles — early intervention is essential. See a dermatologist experienced with Black hair at the FIRST signs of crown thinning.',
    },
  },

  scalp_care_routine: {
    cleansing: {
      how_often: 'Type 1-2 hair: every 2-3 days. Type 3: every 5-7 days. Type 4: every 7-14 days. But if you have scalp issues — more frequently.',
      how_to: 'Dilute shampoo in water for easier application. Focus shampoo on SCALP, not lengths. The lengths get cleaned by the rinse water.',
      sulfate_free: 'For curly and coily hair types: sulfate-free shampoo is gentler. But if you have seborrheic dermatitis, the medicated sulfate versions are needed for treatment.',
    },
    scalp_massage: {
      benefits: 'Increases blood flow to follicles. Small study evidence for increased hair density with regular massage. Deeply relaxing.',
      how_to: [
        'Use the pads of your fingers (not nails)',
        'Small circular motions across the entire scalp',
        'Apply light pressure — not painful',
        '5-10 minutes daily if you can',
        'Can be done dry, with oil, or during shampoo',
      ],
      dermaroller_scalp: {
        what: 'A rolling device with tiny needles (0.25-0.5mm for home use) used on the scalp — creates micro-stimulation that may support hair growth',
        
        how_to_use: 'Roll over each scalp section several passes. Use 1-2x per week. Follow with growth serum (minoxidil or peptide-based).',
        important: 'Do not use if scalp is irritated, inflamed, or if you have open wounds. Keep the device clean (alcohol-clean between uses).',
      },
    },
    scalp_treatments: {
      scalp_serums: [
        { ingredient: 'Minoxidil (2% or 5%)', type: 'Only FDA-approved topical for hair growth. Proven to extend anagen phase and improve follicle size. Available OTC.', how: 'Apply to dry scalp 2x daily. Takes 4-6 months to see results. Must be used indefinitely — hair loss returns if stopped.' },
        { ingredient: 'Caffeine', type: 'In lab tests on follicles, caffeine countered the effect of testosterone; evidence in people is limited', products: 'Alpecin caffeine shampoo' },
        { ingredient: 'Rosemary oil',  how: 'Mix several drops in carrier oil (jojoba), massage into scalp, leave overnight or 30+ minutes before washing.' },
        { ingredient: 'Peppermint oil', type: 'A study in mice found growth effects; evidence in people is limited', how: 'Dilute heavily (a few drops in carrier oil) — peppermint is VERY concentrated and can burn undiluted.' },
      ],
    },
  },
};

// ─── ETHNIC HAIR GROWTH TRADITIONS ───────────────────────────────────────────

export const ETHNIC_HAIR_GROWTH_TRADITIONS = {

  ayurvedic_hair_growth: {
    community: 'South Asian',
    overview: 'Ayurvedic hair care is a centuries-old system whose oiling and herbal rinses are now used far beyond South Asia.',

    oiling: {
      what: 'Applying warm oil to the scalp and hair — massaged in and left for an extended period (champi)',
      traditional_oils: {
        coconut: 'Most used in South India — deeply conditioning, great for hair moisture retention',
        sesame: 'Used in North India and Ayurvedic medicine — warming, good for Vata scalp types',
        brahmi_oil: 'Bacopa monnieri (Brahmi) infused in coconut or sesame oil — traditional brain and hair tonic',
        bhringraj_oil: 'Eclipta alba (bhringraj) infused oil — "king of herbs for hair." Traditional hair growth treatment with modern supporting research.',
        amla_oil: 'Emblic myrobalan (amla/Indian gooseberry) infused oil — vitamin C-rich, traditionally used for scalp health',
        neem_oil: 'Azadirachta indica — antibacterial, antifungal. Good for dandruff and scalp infections.',
        castor_oil: 'Cold-pressed castor oil has been used in South Asian hair care for generations — though modern evidence for hair growth is limited, many report thicker-looking hair',
      },
      how_to_oil: [
        'Warm the oil slightly (not hot — test on wrist)',
        'Part hair into sections',
        'Apply oil directly to the scalp with fingertips, massaging as you go',
        'Apply remaining oil to the lengths',
        'Wrap in a warm towel or shower cap and leave 30 minutes to overnight',
        'Wash out thoroughly — may need two shampoo passes',
      ],
    },

    ayurvedic_herbs: {
      bhringraj: { benefit: 'Traditionally used against hair fall; evidence in people is limited. Used as oil or powder in hair masks.' },
      amla: { benefit: 'Rich in vitamin C and antioxidants. Supports scalp health, conditions hair, may slow greying (traditional use).', forms: 'Oil, powder in hair masks, fresh fruit, supplement' },
      brahmi: { benefit: 'Traditional for hair growth and thickness. Adaptogenic — reduces stress which is a hair loss trigger.', forms: 'Oil, powder, supplement (bacopa extract)' },
      neem: { benefit: 'Antifungal and antibacterial — excellent for scalp conditions including dandruff and folliculitis. Anti-inflammatory.', forms: 'Oil, powder (added to hair masks), commercial shampoos' },
      fenugreek: { benefit: 'Fenugreek seeds (methi) contain proteins and nicotinic acid — traditional hair loss treatment.', forms: 'Soaked and ground into paste for hair mask, or oil-infused', diy: 'Soak overnight, grind to paste, apply to scalp 30 minutes before washing.' },
      hibiscus: { benefit: 'Hibiscus (gudhal) flower and leaves — conditioning, promotes hair growth in traditional use.', forms: 'Boiled into hair rinse, ground into hair mask, hibiscus oil', note: 'Makes hair very soft and shiny — popular hair rinse ingredient' },
    },
  },

  west_african_hair_growth: {
    community: 'West African / Black',
    overview: 'Black hair growth and retention traditions emphasise moisture, protective styling, and scalp health.',

    practices: {
      whipped_shea_butter: 'Shea butter as a scalp treatment and moisturiser — raw shea has some evidence for scalp health. The thick emollient seals moisture into the scalp.',
      water_steaming: 'Hot towel or hair steamer to open the cuticle and allow deep conditioning to penetrate',
      baggy_method: 'Covering moisturised hair with a plastic cap overnight to increase moisture retention and scalp circulation',
      gro_eze: 'Traditional Jamaican hair grease products — petroleum-based scalp applications. These seal the scalp but the evidence for actual growth stimulation is not strong. Heavy petroleum can clog follicles. Modern preference is lighter oils.',
    },

    important_note: 'The most powerful hair growth tool for Type 4 hair is LENGTH RETENTION, not growth stimulation. Protective styles, the LOC method, silk/satin sleep protection, and avoiding mechanical damage — these retain the length that IS being grown.',
  },

  east_asian_hair_growth: {
    community: 'East Asian',
    practices: {
      rice_water_rinse: {
        what: 'Fermented rice water used as a hair rinse — an ancient Chinese and Japanese practice that has been scientifically studied',
        origin: 'Yao women of Huangluo, China, were recorded in the Guinness Book of World Records for the longest hair — they attribute it to rice water rinses',
        
        how_to: [
          'Rinse uncooked rice until water runs clear',
          'Fill bowl with fresh water, add rice, and soak 15-30 minutes',
          'For fermented (more potent): leave at room temperature for 24-48 hours until slightly sour-smelling',
          'Strain out rice, pour rice water into a bottle',
          'After shampooing, apply rice water to hair, massage scalp',
          'Leave 15-20 minutes, rinse with cold water',
        ],
        frequency: 'Once a week for most hair types',
      },
      camellia_oil: 'Tsubaki (camellia japonica) oil — traditional Japanese hair oil. Rich in oleic acid, very lightweight for an oil, absorbs well.',
      gua_sha_scalp: 'TCM-influenced scalp scraping/massaging technique for circulation. Less commonly done than face gua sha.',
    },
  },

  arab_hair_growth: {
    community: 'Arab / Middle Eastern',
    practices: {
      black_seed_oil: {
        what: 'Nigella sativa (black seed, Habatus sauda, كلنجير) oil — one of the most-studied natural remedies. Called "cure for everything except death" in Hadith.',
        
        how_to: 'Apply directly to scalp, massage in, leave 30+ minutes or overnight, wash out.',
      },
      argan_oil: 'Moroccan argan oil on hair — rich in vitamin E and oleic acid, deeply conditioning, reduces breakage.',
      black_seed_internally: 'Black seed oil taken internally (1 teaspoon daily) is widely used in Arab communities for overall health including hair.',
    },
  },
};

// ─── SUPPLEMENTS FOR HAIR GROWTH ──────────────────────────────────────────────

export const HAIR_SUPPLEMENTS = {
  evidence_overview: 'The supplement market is flooded with hair growth products. Most have weak evidence. Here\'s an honest breakdown of what actually works, what might work, and what is mostly marketing.',

  evidence_based: {
    iron: {
      when: 'When you are IRON DEFICIENT. Iron deficiency is one of the most common and most overlooked causes of hair loss — especially in women of reproductive age, vegetarians, and those with heavy periods.',
      
      who_most_at_risk: 'Vegetarian/vegan South Asian, West African women. Women with heavy periods across all communities.',
      note: 'Iron supplementation will ONLY help if you are actually deficient. Do not supplement iron without testing — excess iron is harmful.',
    },
    vitamin_d: {
      when: 'When you are vitamin D deficient. Vitamin D receptors are in hair follicles — deficiency is linked to alopecia areata and general hair loss.',
      supplement: '1,000-2,000 IU vitamin D3 daily if deficient (get tested first). Sun exposure for 20-30 minutes is the most natural way to synthesise vitamin D.',
      who_most_at_risk: 'Darker skin tones (melanin reduces UV absorption — requires MORE sun exposure to synthesise the same vitamin D). South Asian, Arab, West African communities living in low-sun climates.',
    },
    protein: {
      what: 'Hair is made of keratin — a protein. Without adequate dietary protein, hair growth suffers.',
      recommendation: '0.8g-1.2g protein per kg of body weight daily',
      
      note: 'Vegetarians and vegans need to be intentional about protein variety to get all essential amino acids.',
    },
    zinc: {
      when: 'When zinc deficient. Zinc is involved in hair tissue growth and repair.',
      
    },
  },

  probable_evidence: {
    biotin: {
      note: 'The most marketed hair supplement — but evidence for hair growth is primarily in people with biotin DEFICIENCY, which is rare in people with adequate diet.',
      truth: 'If you eat a normal diet, you are likely not biotin deficient. Extra biotin will not turbocharge growth.',
      when_useful: 'If your diet is very restricted, or you have a condition that causes biotin deficiency.',
      dosage: '2,500-5,000 mcg is common dosing — generally safe',
    },
    collagen: {
      note: 'Type 1 collagen supplements may support hair health by providing amino acids (proline, glycine). Marine collagen has good bioavailability.',
      truth: 'Evidence is preliminary. Will not harm, may help, particularly post-menopause when collagen production declines.',
    },
    saw_palmetto: {
      note: 'A DHT blocker (same mechanism as finasteride, the prescription hair loss drug). May slow androgen-related hair loss (androgenic alopecia).',
      
    },
  },

  mostly_marketing: [
    'Most "hair, skin, and nail" gummy vitamins — too low a dose to make a difference, mostly selling biotin which most people don\'t need extra of',
    'Expensive proprietary "hair growth formulas" — often just B vitamins and biotin in an expensive package',
    'Collagen masks for external application — collagen molecules are too large to penetrate the skin or hair shaft',
  ],
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getHairGrowthForCommunity(communityId) {
  const traditions = {
    'south-asian': ETHNIC_HAIR_GROWTH_TRADITIONS.ayurvedic_hair_growth,
    'west-african': ETHNIC_HAIR_GROWTH_TRADITIONS.west_african_hair_growth,
    'black-american': ETHNIC_HAIR_GROWTH_TRADITIONS.west_african_hair_growth,
    'east-african': ETHNIC_HAIR_GROWTH_TRADITIONS.west_african_hair_growth,
    'east-asian': ETHNIC_HAIR_GROWTH_TRADITIONS.east_asian_hair_growth,
    'arab': ETHNIC_HAIR_GROWTH_TRADITIONS.arab_hair_growth,
  };
  return {
    traditions: traditions[communityId] || null,
    science: HAIR_GROWTH_SCIENCE,
    scalpHealth: SCALP_HEALTH,
    supplements: HAIR_SUPPLEMENTS,
  };
}

export function getScalpHealthGuide() {
  return SCALP_HEALTH;
}

export function getTractionAlopeciaGuide() {
  return SCALP_HEALTH.scalp_conditions.traction_alopecia;
}

export function getHairGrowthScience() {
  return HAIR_GROWTH_SCIENCE;
}

export function getSupplementGuide() {
  return HAIR_SUPPLEMENTS;
}

export function getRetentionGuide() {
  return HAIR_GROWTH_SCIENCE.retention_vs_growth;
}

