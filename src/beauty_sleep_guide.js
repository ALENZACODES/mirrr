/**
 * MIRRR Beauty Sleep Guide
 * Circadian rhythm skin repair, overnight beauty treatments,
 * silk pillowcases, sleep-beauty connection, and ethnic traditions
 */

// ─── SLEEP AND SKIN SCIENCE ───────────────────────────────────────────────────

export const SLEEP_SKIN_SCIENCE = {
  circadian_rhythm: {
    title: 'Circadian Rhythm and Skin',
    explanation: 'The skin, like all organs, follows a 24-hour circadian clock. Its processes are not constant — they peak and trough at specific times of day and night. Understanding this biology is the foundation of "chrono-beauty" or beauty chronobiology.',
    day_processes: [
      'UV-protective melanin production increases in morning sun',
      'Sebum production peaks around 12-2pm',
      'Skin barrier function strongest in daytime',
      'Immune defence cells most active in the day',
      'Skin temperature regulation active',
    ],
    night_processes: [
      'Cell division (mitosis) peaks between 11pm-4am — skin literally regenerates at night',
      'Collagen synthesis increases',
      'Blood flow to skin increases — delivering nutrients, oxygen',
      'Skin temperature rises slightly — pores relax; products penetrate better',
      'Cortisol (stress hormone; suppresses repair) reaches its lowest point',
      'Growth hormone released (pituitary gland; peak: early sleep) — promotes tissue repair',
      'Epidermal water loss increases slightly at night (skin "breathes")',
    ],
    implication: 'Skincare applied at night is not wasted — it works alongside the skin\'s own repair cycle. Active ingredients (retinoids, AHAs) are specifically more effective AND safer at night (avoiding UV interaction). Night creams and masks are justified, not marketing fluff.',
  },
  sleep_deprivation_effects: {
    acute: {
      title: 'Acute Sleep Deprivation (1-2 bad nights)',
      effects: [
        'Puffiness — fluid redistribution; especially undereye area',
        'Redness — inflammatory cytokines increase without sleep',
        'Pallor — reduced blood flow to skin surface',
        'Dullness — less skin renewal overnight',
        'Dark circles — pooled blood under thin undereye skin',
        'Drooping eyelids and mouth corners',
      ],
    },
    chronic: {
      title: 'Chronic Sleep Deprivation (ongoing)',
      effects: [
        'Increased cortisol → collagen breakdown → accelerated aging',
        'Impaired skin barrier function → more TEWL → chronic dryness',
        'Increased inflammatory skin conditions: acne flares, eczema, rosacea worsening',
        'Slower wound healing (including PIH recovery)',
        'Reduced skin hydration',
        'Premature wrinkle formation',
        'Hair shedding increases — sleep deprivation disrupts follicle cycling',
      ],
    },
    research: 'A 2015 peer-reviewed study (Oyetakin-White et al.) measured clinically significant differences in skin aging between good sleepers and poor sleepers: poor sleepers had twice the TEWL, more fine lines, reduced elasticity, and more uneven skin tone.',
  },
  optimal_sleep_for_skin: {
    duration: '7-9 hours for most adults. 8 hours is optimal for skin repair.',
    sleep_stage: 'Deep sleep (slow-wave sleep) and REM sleep are when growth hormone release and cellular repair are most active.',
    consistency: 'Consistent sleep schedule (same bedtime and wake time) reinforces circadian rhythm — irregular sleep disrupts the timing of skin\'s repair processes.',
  },
};

// ─── OVERNIGHT TREATMENTS ─────────────────────────────────────────────────────

export const OVERNIGHT_TREATMENTS = {
  sleeping_masks: {
    type: 'Sleeping Masks (Overnight Masks)',
    what_they_are: 'Gel or cream formulas designed to be applied as the final step of the PM routine and left on all night. Usually occlude moisture and deliver active ingredients over the extended contact time.',
    origin: 'Korean beauty concept — LANEIGE\'s Water Sleeping Mask (launched 2002) popularised the category globally.',
    key_ingredients: ['Ceramides (barrier repair)', 'Hyaluronic acid (deep hydration)', 'Niacinamide (brightening and barrier)', 'Retinol (anti-aging — look for dedicated retinol sleeping masks)', 'Centella asiatica (calming and healing)', 'Peptides (collagen stimulation)'],
    how_to_use: 'Apply as the LAST step of PM routine — over serums, moisturisers. Apply in a thin layer (not thick). Rinse off in morning and continue AM routine.',
    best_for: 'Dry skin; skin barrier repair; in-flight; transitional seasons; intensive treatment weeks.',
    ethnic_note: 'For Fitzpatrick IV-VI, sleeping masks with niacinamide + centella asiatica overnight provide PIH healing support while sleeping.',
  },
  facial_oils_overnight: {
    type: 'Facial Oils as Overnight Treatment',
    concept: 'Applying a slightly more generous amount of facial oil at night than during the day — oils penetrate more effectively when skin is warmer at night.',
    best_oils_by_concern: {
      dry_aging: 'Marula oil (high oleic acid; penetrating); argan oil; rosehip oil (retinol and vitamin C naturally occurring)',
      acne_prone: 'Rosehip oil (high linoleic; non-comedogenic); hemp seed oil; sea buckthorn oil (diluted — very orange)',
      hyperpigmentation: 'Rosehip oil (trans-retinoic acid naturally; vitamin C); sea buckthorn oil; bakuchiol oil',
      sensitive: 'Jojoba (structurally similar to sebum); squalane (from olives; non-comedogenic); centella oil',
    },
    ethnic_traditions: {
      south_asian: 'Champi (head massage with oil) — coconut or mustard oil applied overnight before wash. A multi-generational practice with legitimate scalp nourishing benefit.',
      arab: 'Argan oil or black seed oil (nigella sativa) as overnight face and body treatment.',
      west_african: 'Shea butter as overnight body treatment — applied to damp skin post-shower; seals in moisture all night.',
      east_african: 'Frankincense oil (boswellia) diluted in jojoba as overnight face treatment. Healing and anti-inflammatory.',
      east_asian: 'Camellia oil (tsubaki oil in Japan) as final step; traditional geisha beauty secret; high oleic acid; penetrates effectively.',
    },
  },
  slugging: {
    type: 'Slugging',
    definition: 'Applying a thin layer of petrolatum (Vaseline) as the last PM step. Creates an occlusive seal that traps all previous products and prevents TEWL overnight.',
    origin: 'K-beauty trend popularised globally around 2021 on TikTok. However, petrolatum as an overnight occlusive is a decades-old practice in Black and Caribbean beauty communities.',
    how_to_do: [
      '1. Complete full PM skincare routine (cleanse, tone, serum, moisturiser)',
      '2. Take a small amount of pure petrolatum (pea to dime size for face)',
      '3. Warm between fingertips',
      '4. Press gently over face — not rubbing',
      '5. Rinse off in morning with gentle cleanser',
    ],
    benefits: ['Maximum TEWL prevention', 'Locks in all products underneath', 'Visibly plumped, hydrated skin in morning', 'Accelerates barrier repair in compromised skin'],
    cautions: ['Must apply to CLEAN skin only — seals in everything including bacteria', 'Not recommended with active fungal acne (can aggravate)', 'Some users with very oily skin find it too heavy'],
    ethnic_note: '"Greasing the face" with Vaseline has been practiced in Black and Caribbean communities for generations. The trend of "slugging" is effectively the mainstream beauty world catching up to a long-standing Black beauty practice.',
  },
  retinoid_pm_only: {
    type: 'Retinoid Night Treatment',
    explanation: 'Retinoids (retinol, retinaldehyde, tretinoin) must be applied exclusively at night. UV degrades retinol; UV exposure after retinoid application dramatically increases photosensitivity and PIH risk.',
    correct_timing: 'Apply retinoid 20-30 min after cleansing (dry skin reduces irritation). Apply any remaining serums/moisturisers over.',
    sandwich_method: 'Apply moisturiser → apply retinoid → apply moisturiser over. "Sandwiching" slows penetration for beginners or sensitive/dark skin types.',
    ethnic_note: 'For Fitzpatrick IV-VI: the retinoid+PIH combination requires patience. Start lowest percentage, lowest frequency, use sandwich method. PIH from retinoid irritation is a real risk but the long-term benefit for both aging and existing PIH is significant.',
  },
};

// ─── SLEEP ENVIRONMENT ────────────────────────────────────────────────────────

export const SLEEP_ENVIRONMENT_BEAUTY = {
  silk_satin_pillowcase: {
    why: 'Cotton pillowcases have a relatively rough texture that creates friction against skin and hair throughout the night. This friction: crumples and creases skin (sleep lines that can become permanent wrinkles with years of repetition); causes mechanical hair damage (cuticle disruption, breakage, frizz).',
    silk_benefits: [
      'Dramatically less friction — skin glides rather than tugs',
      'Hair cuticle stays smooth — significantly less frizz, breakage, and tangling',
      'Does not absorb skincare products as much as cotton (your expensive serums stay on your face, not the pillowcase)',
      'Temperature-regulating — cooler and more comfortable',
      'Naturally hypoallergenic',
    ],
    satin_vs_silk: 'Silk is the natural fibre (protein-based; more expensive). Satin is a weave pattern that can be polyester or silk. Satin polyester is much cheaper and provides similar friction-reducing benefits for hair, though not all the skincare benefits of true silk.',
    momme: 'Silk quality measured in momme (weight). 19-25 momme is the sweet spot for pillowcases — smooth and durable.',
    ethnic_note: 'Silk or satin pillowcase and bonnet/durag use is standard practice in Black American and Afro-Caribbean hair care — the natural hair community established this as non-negotiable for protecting coily, curly hair overnight. The mainstream beauty world has been slow to acknowledge this was a community practice first.',
  },
  silk_bonnet_durag: {
    what: 'A silk or satin-lined cap worn during sleep to protect hair and maintain styles.',
    benefits: [
      'Protects twist-outs, braid-outs, blowouts overnight',
      'Prevents friction-induced frizz and breakage',
      'Retains moisture in hair',
      'Extends styling longevity significantly',
    ],
    ethnic_traditions: {
      black_american: 'The satin bonnet is a cornerstone of Black beauty self-care. "Putting your hair up" (in bonnet) before bed is a protective ritual.',
      west_african: 'Headwrapping traditions extend to sleep in some communities — fabric protects hair during rest.',
      south_asian: 'Oil-soaked hair wrapped in a bun or braided before sleep — traditional overnight treatment.',
      arab: 'Hair braided or loosely wrapped before sleep in many Arab cultural traditions.',
    },
  },
  humidifier: {
    why: 'Indoor heating and air conditioning reduce ambient humidity to 20-30% — equivalent to desert air. Skin loses significantly more water (TEWL) in dry air.',
    beauty_benefits: [
      'Reduces TEWL — products last longer; skin stays more hydrated overnight',
      'Reduces morning skin tightness and dehydration',
      'Hair retains moisture better',
      'Particularly beneficial in winter (heating) and summer (air conditioning)',
    ],
    ideal_humidity: '40-60% relative humidity in bedroom.',
    type: 'Cool-mist ultrasonic humidifiers are preferred (less risk of bacterial spread than warm-mist; quieter).',
  },
  sleep_position: {
    back_sleeping: 'Most recommended by dermatologists. No face contact with pillow — no friction, no sleep lines.',
    side_sleeping: 'Common. Creates sleep lines on the side of the face. Use silk pillowcase to minimise. Some people notice one side of the face ages faster from habitual side sleeping.',
    stomach_sleeping: 'Worst for skin. Face pressed into pillow all night — maximum friction and sleep line formation.',
    transition_tip: 'Training yourself to sleep on your back takes time. Placing a pillow under each arm can help keep you in position. A cervical pillow can make back-sleeping more comfortable.',
  },
};

// ─── PM ROUTINE OPTIMISATION ──────────────────────────────────────────────────

export const OPTIMISED_PM_ROUTINE = {
  principles: [
    'Night is for treatment — apply actives (retinoids, AHAs, peptides, brightening) at night',
    'Night is for repair — barrier repair ingredients (ceramides, fatty acids) peak at night',
    'Night is for moisture — occlusives and sleeping masks are most appropriate at night',
    'Night is for gentleness — never sleep in heavy makeup; always cleanse before bed',
  ],
  timing: {
    ideal_time: 'Start PM routine 30-60 minutes before sleep — allows products to absorb before your face meets the pillow.',
    double_cleanse: 'PM: always double cleanse (oil/balm → water-based cleanser) to remove SPF, makeup, pollution. AM: gentle single cleanse only.',
  },
  layering_order: [
    '1. Oil cleanser / micellar water (remove makeup and SPF)',
    '2. Water-based cleanser (remove day\'s residue)',
    '3. Toner / essence (optional — hydrate, prep)',
    '4. Treatment serum (vitamin C is AM; retinol/AHA are PM)',
    '5. Eye cream (pat gently with ring finger)',
    '6. Moisturiser (ceramides, peptides, niacinamide)',
    '7. Facial oil (optional — seals in everything)',
    '8. Sleeping mask (optional — added occlusion)',
    '9. Slugging/petrolatum (optional — maximum occlusion for very dry/compromised skin)',
  ],
  what_not_to_do: [
    'Never go to sleep in makeup — even one night causes congestion and breakouts',
    'Never apply retinoid to freshly cleansed, damp skin (increases irritation — wait until dry)',
    'Never mix retinoid with AHAs/BHAs in same step (irritation compounding)',
    'Never use benzoyl peroxide with retinoids (oxidises and inactivates the retinoid)',
    'Never sleep with hair in tight style that creates tension on scalp and edges',
  ],
};

// ─── UNDEREYE SPECIFIC ────────────────────────────────────────────────────────

export const UNDEREYE_SLEEP_CARE = {
  causes_of_dark_circles: {
    vascular: 'Blood pooling under thin undereye skin. Appears bluish-purple. Worsens with tiredness and poor circulation. Common in fair skin.',
    pigmentation: 'Melanin deposits under eye. Appears brownish. Common in Fitzpatrick III-VI, South Asian, Arab, East Asian communities. Genetic.',
    structural: 'Tear trough hollowing creates shadow. Appears as a dark-light contrast. Age-related volume loss.',
    mixed: 'Most people have a combination of all three causes.',
  },
  treatment_by_cause: {
    vascular: 'Caffeine eye cream (reduces blood vessel prominence; temporary). Sleep on raised pillow. Cold compress in morning.',
    pigmentation: 'Vitamin C eye cream; kojic acid; azelaic acid; niacinamide; SPF under eyes (UV worsens pigmentation). Takes months to show effect.',
    structural: 'Filler (professional) for tear trough; retinol (builds collagen and thickens skin); staying hydrated.',
  },
  morning_depuff: {
    techniques: [
      'Cold compress — vasoconstriction reduces puffiness',
      'Cold jade roller or gua sha (keep in fridge)',
      'Caffeine eye serum or patches',
      'Ice cube wrapped in soft cloth — gentle circles',
      'Two cold metal spoons from fridge',
      'Lymphatic drainage — very gentle outward tapping from inner to outer corner',
    ],
    ethnic_note: 'Dark circles from pigmentation (most common in South Asian, Arab, East Asian, and deeper Fitzpatrick skin tones) are genetic and require consistent long-term treatment (vitamin C, retinol), not just depuffing techniques.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getSleepSkinScience() { return SLEEP_SKIN_SCIENCE; }
export function getOvernightTreatment(type) {
  return OVERNIGHT_TREATMENTS[type?.toLowerCase()] || Object.values(OVERNIGHT_TREATMENTS);
}
export function getSleepEnvironmentGuide() { return SLEEP_ENVIRONMENT_BEAUTY; }
export function getPMRoutineGuide() { return OPTIMISED_PM_ROUTINE; }
export function getUndereyeGuide() { return UNDEREYE_SLEEP_CARE; }

export function getEthnicSleepBeautyTradition(communityId) {
  const traditions = {};
  // Gather ethnic traditions from across the guide
  Object.values(OVERNIGHT_TREATMENTS.facial_oils_overnight.ethnic_traditions).forEach((t, i) => {
    const keys = Object.keys(OVERNIGHT_TREATMENTS.facial_oils_overnight.ethnic_traditions);
    traditions[keys[i]] = t;
  });
  const key = communityId?.replace('-', '_');
  return traditions[key] || traditions;
}

export const BEAUTY_SLEEP_STATS = {
  overnightTreatmentTypes: Object.keys(OVERNIGHT_TREATMENTS).length,
  sleepEnvironmentFactors: Object.keys(SLEEP_ENVIRONMENT_BEAUTY).length,
  undereyeCauses: Object.keys(UNDEREYE_SLEEP_CARE.causes_of_dark_circles).length,
};
