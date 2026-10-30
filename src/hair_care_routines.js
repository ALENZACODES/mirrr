/**
 * hair_care_routines.js — Complete ethnic hair care routine guides for MIRRR
 * Routines for all 9 communities with products, techniques, and schedules
 */

// ─── HAIR POROSITY ─────────────────────────────────────────────────────────────

export const HAIR_POROSITY = {
  low: {
    id: 'low',
    label: 'Low Porosity',
    description: 'Cuticles lie flat and tightly closed — moisture struggles to get in, but once inside it stays.',
    characteristics: [
      'Hair takes a long time to get fully wet',
      'Products sit on top of hair rather than absorbing',
      'Prone to product build-up',
      'Shiny, but can feel hard or plastic-y when overloaded',
    ],
    
    routine: {
      cleanse: 'Use warm water to open the cuticle. Clarifying shampoo monthly for build-up.',
      condition: 'Apply conditioner with steam (steam cap) to help penetration. Thin, fluid conditioners absorb better than thick.',
      moisturise: 'Heat activates moisture absorption — baggy method or hooded dryer.',
      seal: 'Light oils (argan, jojoba) — heavy butters will sit on top and cause build-up.',
      avoid: 'Heavy butters, thick leave-ins, protein overload',
    },
  },

  medium: {
    id: 'medium',
    label: 'Medium / Normal Porosity',
    description: 'The hair cuticle layer lies slightly raised — moisture gets in and out at a healthy balanced rate.',
    characteristics: [
      'Hair absorbs and holds moisture well',
      'Takes colour and chemical processes predictably',
      'Easiest hair to maintain',
      'Products absorb without build-up',
    ],
    
    routine: {
      cleanse: 'Regular moisturising shampoo. Deep cleanse monthly.',
      condition: 'Standard conditioner routine — no heat needed typically.',
      moisturise: 'Leave-in conditioner + light moisturiser.',
      seal: 'Medium-weight oil (olive, sweet almond, grapeseed).',
      avoid: 'Very frequent washing that strips moisture',
    },
  },

  high: {
    id: 'high',
    label: 'High Porosity',
    description: 'Cuticles are raised or have gaps — moisture enters quickly but also escapes quickly.',
    characteristics: [
      'Hair absorbs water immediately',
      'Dries very quickly after washing',
      'Often frizzy and tangles easily',
      'Can feel dry within hours of moisturising',
      'Common in chemically processed, heat-damaged, or very coily hair',
    ],
    
    routine: {
      cleanse: 'Gentle, moisturising shampoo. Avoid sulphates.',
      condition: 'Deep condition every wash. Protein treatment monthly (high porosity often = damaged cuticle).',
      moisturise: 'Heavy leave-in conditioner, apply to soaking wet hair to seal in water.',
      seal: 'Heavy butter (shea, mango, kokum) as final step to prevent moisture escape.',
      avoid: 'Drying ingredients (alcohol), insufficient moisture, skipping deep conditioning',
    },
  },
};

// ─── COMPLETE HAIR CARE ROUTINES ─────────────────────────────────────────────

export const HAIR_ROUTINES = {

  // ─── SOUTH ASIAN (AYURVEDIC) HAIR ROUTINE ────────────────────────────────

  ayurvedic_hair_routine: {
    id: 'ayurvedic_hair_routine',
    community: 'south-asian',
    name: 'Ayurvedic Hair Care Ritual',
    philosophy: 'Ayurveda teaches that hair is a byproduct of bone tissue — what nourishes your bones nourishes your hair. Food, oil, and scalp massage are the foundation.',
    suitableFor: ['Thick, strong South Asian hair', 'Hair that responds well to oiling', 'Preventive hair care for hereditary thinning'],
    weeklySchedule: {
      sunday: {
        day: 'Sunday',
        tasks: ['Champi (hot oil scalp massage)', 'Overnight oil treatment (or minimum 2 hours)', 'Wake, shampoo with gentle cleanser'],
        products: ['Amla oil', 'Bhringraj oil', 'Brahmi oil', 'Or: coconut + amla blend'],
        technique: 'Heat oil until warm (not hot). Apply to scalp first, massage for 5-10 minutes in circular motions. Apply to lengths. Cover with shower cap. Leave overnight or 2+ hours.',
      },
      wednesday: {
        day: 'Wednesday (mid-week)',
        tasks: ['Co-wash or gentle cleanse', 'Deep conditioning mask', 'Air dry or diffuse'],
        products: ['Darshana or Hanahana gentle cleanse', 'Protein-moisture balanced mask'],
        technique: 'Focus conditioner on mid-lengths and ends, not roots (already oiled enough).',
      },
      daily: {
        day: 'Daily',
        tasks: ['Light scalp massage (even without oil) — 2-5 minutes', 'Detangle gently', 'Protect at night with satin scarf'],
        products: ['Wide-tooth comb', 'Light leave-in if needed'],
        technique: 'Scalp massage without oil is still beneficial for blood circulation and growth.',
      },
    },
    heroIngredients: [
      { name: 'Amla (Indian gooseberry)', benefit: 'Rich in vitamin C. A traditional scalp oil and hair rinse; long used in the hope of keeping hair dark, though there is no reliable evidence it prevents greying.' },
      { name: 'Bhringraj', benefit: 'The "king of hair" in Ayurveda. Promotes growth, reduces hair fall.' },
      { name: 'Brahmi', benefit: 'Traditional Ayurvedic scalp oil, used to soothe the scalp during champi massage.' },
      { name: 'Neem', benefit: 'Antifungal, antibacterial. Essential for scalp health.' },
      { name: 'Coconut oil', benefit: 'Penetrates the hair shaft (unlike most oils). Reduces protein loss.' },
    ],
    dietaryNotes: 'Ayurveda connects diet to hair: ghee, sesame seeds, leafy greens, and amla in the diet strengthen hair from within.',
  },

  // ─── WEST AFRICAN HAIR ROUTINE ───────────────────────────────────────────

  west_african_protective_routine: {
    id: 'west_african_protective_routine',
    community: 'west-african',
    name: 'West African Protective Style Routine',
    philosophy: 'In West African hair culture, protective styling is not just a trend — it is the tradition. Cornrows, threaded hair, and covered hair preserved texture for generations.',
    suitableFor: ['4A-4C natural hair', 'Hair prone to dryness and breakage', 'Those wanting length retention'],
    weeklySchedule: {
      wash_day: {
        day: 'Wash Day (once weekly or fortnightly)',
        tasks: ['Pre-poo with shea butter or oil', 'Shampoo (sulphate-free)', 'Deep condition (30-60 minutes)', 'Rinse, apply leave-in', 'Style and go'],
        products: ['SheaMoisture Raw Shea Butter Deep Moisturizing Detangler', 'As I Am Coconut CoWash', 'Shea butter or JBCO for sealing'],
        technique: 'Pre-poo (pre-shampoo oil treatment) prevents the shampoo from stripping too much moisture. Apply before wetting hair.',
      },
      protective_weeks: {
        day: 'Protective Style Period (1-6 weeks)',
        tasks: ['Scalp spray with water + aloe vera daily', 'Light edge control as needed', 'Satin bonnet every night', 'Scalp oil application weekly'],
        products: ['Shea butter-based edge control', 'Tea tree scalp oil', 'Rose water scalp spray'],
        technique: 'Protective styles (braids, twists, locs) retain length by preventing breakage from daily manipulation.',
      },
    },
    heroIngredients: [
      { name: 'Shea butter', benefit: 'Seals in moisture, prevents moisture loss. The West African hair staple.' },
      { name: 'Jamaican Black Castor Oil (JBCO)', benefit: 'Thick sealing oil for ends and edges. Roasted castor beans make a darker, ash-enriched oil. Popular for growth, though there is no good evidence that it grows hair.' },
      { name: 'African black soap', benefit: 'Natural cleanser that doesn\'t strip — can be diluted for scalp wash.' },
      { name: 'Coconut oil', benefit: 'Penetrates shaft, reduces protein loss. Pre-poo classic.' },
      { name: 'Aloe vera', benefit: 'Moisturising spray base, seals the hair cuticle.' },
    ],
    protectiveStyleGuide: {
      cornrows: { wearTime: '2-4 weeks', retouching: 'Edge lay after 1 week', takedown: 'Detangle in sections with oil', benefit: 'Maximum versatility, ancient cultural tradition' },
      box_braids: { wearTime: '4-8 weeks', retouching: 'None needed typically', takedown: 'Snip extensions at base, detangle carefully', benefit: 'Low manipulation, length retention' },
      senegalese_twists: { wearTime: '4-8 weeks', retouching: 'Edge control', takedown: 'Unravel from tip, detangle in sections', benefit: 'Lighter than braids, less tension on scalp' },
      bantu_knots: { wearTime: '1-3 days (or overnight)', retouching: 'Re-knot as needed', takedown: 'Unravel for bantu knot-out', benefit: 'Doubles as a styling technique for defined coils' },
    },
  },

  // ─── BLACK AMERICAN NATURAL HAIR ROUTINE ─────────────────────────────────

  natural_hair_loc_routine: {
    id: 'natural_hair_loc_routine',
    community: 'black-american',
    name: 'Natural 4C Hair LOC Method Routine',
    philosophy: 'The LOC method (Liquid, Oil, Cream) was developed in the natural hair community to solve the #1 challenge of 4C hair: moisture retention.',
    suitableFor: ['4B-4C natural hair', 'Very coily, shrinkage-prone hair', 'High porosity hair'],
    weeklySchedule: {
      wash_day: {
        day: 'Wash Day (every 1-2 weeks)',
        tasks: [
          'Detangle in 4-6 large sections before washing',
          'Pre-poo with oil or conditioner',
          'Sulphate-free shampoo (section by section)',
          'Deep condition with heat for 30 minutes',
          'Rinse — apply leave-in IMMEDIATELY on soaking wet hair',
          'Apply oil to lock in',
          'Apply cream styling product',
          'Style: twist-out, braid-out, or wash-n-go',
        ],
        products: {
          liquid: 'Water or watery leave-in conditioner (e.g. SheaMoisture Coconut & Hibiscus Curl & Style Milk)',
          oil: 'Sealing oil: JBCO, castor oil, avocado oil, olive oil',
          cream: 'Curl cream or butter: Camille Rose Curl Maker, As I Am Twist Defining Cream',
        },
        technique: 'Apply LOC in that exact order — L first (liquid), O second (oil to seal liquid in), C third (cream for definition). On HIGH porosity hair, switch to LCO (liquid, cream, oil) — oil last seals the cream.',
      },
      daily: {
        day: 'Daily Care',
        tasks: ['Satin bonnet at night (non-negotiable)', 'Morning: mist with water if dry, re-seal with light oil', 'Pineapple (loose high ponytail) to preserve style'],
        products: ['Satin bonnet or satin pillowcase', 'Light oil (jojoba, argan) for morning refresh'],
        technique: 'The pineapple technique: pull all hair loosely to top of head in a loose scrunchie before bed. Preserves curl pattern while you sleep.',
      },
    },
    heroIngredients: [
      { name: 'Flaxseed (in gel form)', benefit: 'High-hold gel with slip — the natural alternative to silicone-heavy gels' },
      { name: 'Castor oil', benefit: 'Thick sealing oil for high porosity hair' },
      { name: 'Marshmallow root', benefit: 'Incredible slip and moisture. Detangling without breakage.' },
      { name: 'AVJ (Aloe Vera Juice)', benefit: 'Pure hydration, closes cuticle, adds shine' },
      { name: 'JBCO', benefit: 'Seals moisture into ends and edges; heavy, so a little goes a long way' },
    ],
    shrinkageTips: [
      'Shrinkage is healthy — it means your hair is moisturised and elasticated',
      'To stretch without heat: African threading, banding method, twist-outs after washing',
      'Avoid heat straightening more than 2-4x per year max to prevent heat damage',
      'If stretching daily, use low heat with heat protectant — never high heat without protection',
    ],
  },

  // ─── CARIBBEAN HAIR ROUTINE ───────────────────────────────────────────────

  caribbean_moisture_routine: {
    id: 'caribbean_moisture_routine',
    community: 'caribbean',
    name: 'Caribbean Island Moisture Routine',
    philosophy: 'Caribbean hair care combines West African traditions with island ingredients — coconut oil, sea moss, aloe vera, and JBCO. The tradition is rich, moisture-first.',
    suitableFor: ['3C-4B Caribbean hair', 'Humidity-affected hair', 'Natural and transitioning hair'],
    weeklySchedule: {
      wash_day: {
        day: 'Wash Day (weekly)',
        tasks: [
          'Sea moss gel or coconut oil pre-treatment (1 hour before wash)',
          'ACV (apple cider vinegar) rinse for shine and clarifying (1 tablespoon in 1 cup water)',
          'Wash with coconut-based shampoo',
          'Deep condition — banana and coconut mask is Caribbean classic',
          'LOC method with island oils',
          'Style: twist-out or braid-out',
        ],
        products: {
          pretreatment: 'Sea moss gel or virgin coconut oil',
          shampoo: 'Jamaican Mango & Lime Tingle Shampoo',
          conditioner: 'Banana + coconut DIY mask, or Camille Rose Algae Renew',
          leave_in: 'Aloe vera juice + castor oil',
        },
        technique: 'ACV rinse after shampoo: removes residue, seals cuticle, adds shine. Ratio: 1 tbsp ACV to 1 cup water. Rinse, don\'t leave on.',
      },
    },
    heroIngredients: [
      { name: 'Sea moss (Irish moss)', benefit: '92 of the 102 minerals the body needs. Deep moisturising gel. Caribbean superfood used in hair.' },
      { name: 'Coconut oil', benefit: 'Central to Caribbean hair tradition — penetrates shaft, prevents protein loss' },
      { name: 'Aloe vera', benefit: 'Tropical plant — Barbados aloe vera is particularly famed. Seals, moisturises, adds shine.' },
      { name: 'Castor oil (JBCO)', benefit: 'Caribbean-processed black castor oil — growth, thickening, scalp treatment' },
      { name: 'Banana', benefit: 'DIY mask ingredient — silica strengthens hair, potassium moisturises' },
    ],
    humidityTips: [
      'Apply anti-humidity serum (silicone-based) as final step on styled hair',
      'High-hold gel on top of cream products — prevents frizz activation in humidity',
      'Protective styles are the most effective humidity solution',
      'Micro-braids under a lace wig: best of both worlds — protected hair, styled appearance',
    ],
  },

  // ─── SOUTH ASIAN (STRAIGHT-WAVY) ROUTINE ─────────────────────────────────

  south_asian_straight_routine: {
    id: 'south_asian_straight_routine',
    community: 'south-asian',
    name: 'South Asian Straight-Wavy Hair Routine',
    philosophy: 'South Asian hair ranges from fine and straight to thick and wavy or curly, and is often weighed down by too-heavy oils and products. The modern approach: strategic oiling + lightweight moisture.',
    suitableFor: ['1C-2C thick straight to wavy hair', 'Hair prone to scalp oiliness + dry ends'],
    weeklySchedule: {
      oil_night: {
        day: 'Thursday Evening (pre-wash)',
        tasks: ['Warm Amla or coconut oil massage to scalp (not mid-lengths)', 'Overnight or 2-hour treatment'],
        products: ['Amla oil', 'Brahmi + bhringraj blend', 'Or: Mielle Organics Rosemary Mint Oil'],
        technique: 'OIL ON SCALP ONLY for straight hair — oiling mid-lengths and ends can cause limpness in straight hair.',
      },
      wash_day: {
        day: 'Friday (wash day)',
        tasks: ['Shampoo (2x if oiled)', 'Condition mid-lengths and ends only', 'Lightweight leave-in', 'Air dry or diffuse on low'],
        products: ['Briogeo Scalp Revival Shampoo', 'Garnier Whole Blends Conditioner', 'Argan oil on ends only'],
        technique: 'For straight hair: conditioner on mid-lengths and ends ONLY. Never on roots — causes flat, oily roots within a day.',
      },
      daily: {
        day: 'Daily',
        tasks: ['Detangle with wide-tooth comb from ends up', 'Dry shampoo at roots mid-week if needed', 'Silk/satin pillowcase to prevent breakage and frizz'],
        products: ['Kérastase Dry Shampoo or Batiste Original', 'Light shine serum on ends only'],
        technique: 'Silk pillowcase is underrated for straight South Asian hair — prevents the flat, frizzy part-line that builds up from cotton pillowcases.',
      },
    },
    heroIngredients: [
      { name: 'Amla', benefit: 'Rich in vitamin C; a traditional rinse and oil long used in the hope of keeping hair dark, without reliable evidence that it prevents greying' },
      { name: 'Rosemary' },
      { name: 'Rice water (fermented)', benefit: 'High in inositol — penetrates damaged hair. Japanese and Korean tradition also for length and strength.' },
      { name: 'Castor oil (on scalp only)', benefit: 'Heavy sealing oil, best used sparingly on the scalp and ends; there is no good evidence that it grows hair' },
    ],
    commonMistakes: [
      'Over-oiling (South Asian hair myth): heavy oiling every day actually causes build-up and hair fall — once weekly pre-wash is optimal',
      'Rubbing wet hair with a towel — use microfibre cloth or old cotton T-shirt instead',
      'Brushing from root to tip — always tip to root (detangle ends first)',
      'Hot water wash — cools the final rinse to close the cuticle and add shine',
    ],
  },

  // ─── K-BEAUTY HAIR ROUTINE ────────────────────────────────────────────────

  k_beauty_hair_routine: {
    id: 'k_beauty_hair_routine',
    community: 'east-asian',
    name: 'K-Beauty Hair Routine',
    philosophy: 'K-beauty hair care is skincare for your scalp. The scalp is treated as facial skin — cleansed, exfoliated, toned, and nourished with the same precision.',
    suitableFor: ['1A-2A fine straight to wavy hair', 'Scalp health focus', 'Hair-growth focused'],
    weeklySchedule: {
      scalp_treatment_day: {
        day: 'Sunday (scalp day)',
        tasks: [
          'Scalp scaler (exfoliant) — massage into dry scalp, rinse',
          'Shampoo (sometimes twice)',
          'Scalp toner or essence (fermented rice water, ginseng)',
          'Conditioner on ends only',
          'Scalp ampoule (growth serum) applied to dry scalp',
        ],
        products: ['Dr. Groot Scalp Scaling Shampoo', 'MISE EN SCENE Scalp Care Essence', 'Esthetic House CP-1 Night Spa'],
        technique: 'K-beauty scalp approach: the scalp is treated first, with specific scalp-care products. Regular scalp exfoliation (1-2x monthly) is standard.',
      },
      regular_wash: {
        day: 'Mid-week',
        tasks: ['Standard shampoo + condition', 'Heat protectant if blow-drying', 'Camellia or tsubaki oil on ends for shine'],
        products: ['Loretta Repair Treatment (Japanese camellia)', 'LADOR Perfect Hair Fill-Up'],
      },
      daily: {
        day: 'Daily',
        tasks: ['Comb from tips upward', 'Light hair essence on ends', 'Silk pillowcase'],
        products: ['Mise en Scene Perfect Serum', 'Or: camellia oil (1-2 drops only)'],
      },
    },
    heroIngredients: [
      { name: 'Fermented rice water', benefit: 'Japanese and Korean tradition — Yao women in China famous for floor-length hair. Inositol strengthens, amino acids nourish.' },
      { name: 'Camellia (tsubaki) oil', benefit: 'Japanese hair beauty staple. Lightweight, absorbs fully, incredible shine without greasiness.' },
      { name: 'Ginseng', benefit: 'Common in Korean scalp tonics and shampoos' },
      { name: 'Scalp probiotics (bifida ferment)', benefit: 'K-beauty innovation — balances scalp microbiome' },
    ],
  },

};

// ─── QUERY FUNCTIONS ─────────────────────────────────────────────────────────

export function getHairRoutine(id) {
  return HAIR_ROUTINES[id] || null;
}

export function getHairRoutineForCommunity(communityId) {
  return Object.values(HAIR_ROUTINES).filter(r => r.community === communityId);
}

export function getAllHairRoutines() {
  return Object.values(HAIR_ROUTINES);
}

export function getPorosityGuide(porosity) {
  return HAIR_POROSITY[porosity] || null;
}

export function getAllPorosityGuides() {
  return Object.values(HAIR_POROSITY);
}

