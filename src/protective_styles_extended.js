/**
 * MIRRR Protective Styles Extended
 * Full encyclopedia of protective hairstyles across ethnic communities
 * Installation guides, maintenance, takedown, and health considerations
 */

// ─── WHAT IS PROTECTIVE STYLING ──────────────────────────────────────────────

export const PROTECTIVE_STYLING_INTRO = {
  definition: 'A protective style is any hairstyle that keeps the ends of your hair tucked away, minimises manipulation, and reduces environmental exposure — protecting the hair from breakage and allowing length retention.',
  why: [
    'Reduces daily manipulation (brushing, heat, friction) that causes breakage',
    'Protects ends — the oldest, most fragile part of the hair — from splitting',
    'Retains length by reducing mechanical damage',
    'Protects hair from environmental damage (sun, wind, cold)',
    'Allows scalp to focus on growth rather than damage repair',
  ],
  importantNote: 'A protective style is only truly protective if the hair underneath is well-moisturised, the style is not too tight, and it is not left in past its recommended time. A neglected protective style causes MORE damage than daily manipulation.',
  notProtective: [
    'A style installed on dry, brittle hair',
    'A style pulled too tightly at the hairline',
    'Any style left in so long the new growth mats with the installed hair',
    'Styles that prevent any scalp access for moisturisation',
  ],
};

// ─── BRAIDED STYLES ───────────────────────────────────────────────────────────

export const BRAIDED_STYLES = {
  box_braids: {
    name: 'Box Braids',
    origin: 'West African traditional; popularised globally through Black American culture',
    description: 'Individual three-strand braids sectioned into square (box) parts throughout the head. Can be done with natural hair only or extended with braiding hair.',
    hairTexturesBestFor: ['4A', '4B', '4C', '3C', '3B'],
    installationTime: '4–8 hours (size dependent: micro braids take longest, jumbo take least)',
    longevity: '6–8 weeks properly maintained; remove by week 8–10 at maximum',
    maintenance: {
      daily: ['Tie with silk/satin bonnet or scarf at night', 'Apply lightweight oil to scalp through braids'],
      weekly: ['Cleanse scalp with diluted shampoo and a nozzle bottle', 'Moisturise scalp with light oil or spray'],
      monthly: 'Not applicable — should be taken down by 8 weeks',
    },
    sizes: {
      micro: { diameter: '< 0.5 cm', installTime: '12+ hours', longevity: '8–10 weeks', look: 'Very fine, elegant, versatile' },
      medium: { diameter: '0.5–1 cm', installTime: '5–7 hours', longevity: '6–8 weeks', look: 'Classic box braid look' },
      jumbo: { diameter: '> 1 cm', installTime: '2–4 hours', longevity: '4–6 weeks', look: 'Bold, statement, easiest to DIY' },
    },
    extensionHair: ['Kanekalon braiding hair', 'X-Pression Ultra Braid', 'Outre X-Pression Braid'],
    commonMistakes: [
      'Braiding too tight at the roots (causes traction alopecia)',
      'Not sealing ends (braids unravel)',
      'Using too much extension hair (too heavy, causes breakage)',
      'Keeping in past 10 weeks',
    ],
    takedown: {
      time: '1–3 hours depending on size',
      steps: [
        'Cut braiding hair at the bottom of extension/real hair join point',
        'Unravel each braid gently',
        'Apply conditioner as you go',
        'Detangle with wide-tooth comb from ends to roots',
        'Follow with clarifying wash — shed hair is normal',
      ],
    },
    culturalNote: 'Box braids have roots in West African tradition, where specific braid patterns indicated tribe, social status, age, and religion. Globalised through Black American culture in the 1990s (Janet Jackson, Brandy).',
  },

  cornrows: {
    name: 'Cornrows',
    aka: 'Canerows (Caribbean), Ethiopiques (some East African communities)',
    origin: 'West Africa — a braiding tradition with deep historical roots',
    description: 'Braids plaited flat to the scalp in a continuous row. Can form straight lines, curves, geometric patterns, or complex designs.',
    hairTexturesBestFor: ['3C', '4A', '4B', '4C'],
    installationTime: '1–6 hours depending on complexity',
    longevity: '2–6 weeks',
    styles: [
      { name: 'Straight Back', description: 'Classic straight rows from forehead to nape', time: '1–2 hours' },
      { name: 'Feed-In Cornrows', description: 'Hair is added gradually as braid progresses — seamless, natural look at roots, fuller at ends', time: '2–4 hours' },
      { name: 'Curved/Pattern', description: 'Rows curve into freestyle patterns or geometric designs', time: '3–6 hours' },
      { name: 'Stitch Braids', description: 'Every stitch is passed over the next — creates raised, zig-zag pattern', time: '3–5 hours' },
      { name: 'Braided Updo', description: 'Cornrows gathered into buns, ponytails, or crown shapes', time: '2–4 hours' },
    ],
    maintenance: {
      nightly: 'Silk/satin scarf wrap',
      scalp: 'Oil scalp every 2–3 days through the braids',
      wash: 'Diluted shampoo in nozzle bottle along each row; dry thoroughly to prevent mildew',
    },
    culturalSignificance: 'Historically, cornrows were used in West Africa to communicate social information. During the transatlantic slave trade, enslaved people used cornrow maps to encode escape routes. Today, they are a symbol of cultural identity and Black excellence.',
    tightnessCaution: 'Cornrows are the #1 style associated with traction alopecia. Baby hairs should NEVER be pulled into the braid. The braid should not hurt during or after installation. Pain = too tight = hair loss risk.',
  },

  senegalese_twists: {
    name: 'Senegalese Twists',
    aka: 'Rope Twists',
    origin: 'Senegal, West Africa',
    description: 'Individual two-strand rope twists using extension hair. Smoother and silkier appearance than box braids.',
    hairTexturesBestFor: ['3B', '3C', '4A', '4B', '4C'],
    installationTime: '5–8 hours',
    longevity: '6–8 weeks',
    extensionHair: ['Toyokalon hair', 'Marley hair (thicker look)', 'Synthetic water wave hair'],
    maintenance: {
      daily: 'Silk bonnet/scarf, oil scalp',
      weekly: 'Spray moisturiser at roots, refresh edges',
    },
    culturalNote: 'Widely worn across Francophone West Africa. The smooth, sleek appearance reflects Senegalese braiding precision.',
  },

  fulani_braids: {
    name: 'Fulani Braids',
    origin: 'Fulani people of West Africa (spanning Guinea to Mali to Nigeria)',
    description: 'Cornrows with distinct pattern: central braid along the crown, braids at the sides, adorned with gold rings, beads, and cowrie shells. Often includes a centre-parted front section.',
    hairTexturesBestFor: ['3C', '4A', '4B', '4C'],
    installationTime: '3–5 hours',
    longevity: '4–6 weeks',
    accessories: ['Gold metal cuffs', 'Cowrie shells', 'Coloured beads', 'Thread wrapping'],
    culturalSignificance: 'The Fulani are a pastoralist people spread across West and Central Africa. Their braiding tradition uses accessories as identity markers — specific bead arrangements indicate age, marital status, and tribe.',
  },

  ghana_braids: {
    name: 'Ghana Braids',
    aka: 'Cherokee Braids, Banana Cornrows',
    origin: 'Ghana, West Africa',
    description: 'Feed-in cornrows that start very small at the hairline and gradually grow thicker with added hair. Creates a raised, sculptural look.',
    hairTexturesBestFor: ['3C', '4A', '4B', '4C'],
    installationTime: '3–6 hours',
    longevity: '4–6 weeks',
    distinctiveFeature: 'The feed-in technique creates a seamless hairline entry — no "lumpy" root unlike standard cornrows',
    popularVariations: ['Straight back Ghana braids', 'Ghana braid updo', 'Side-swept Ghana braids'],
  },
};

// ─── TWISTED STYLES ───────────────────────────────────────────────────────────

export const TWISTED_STYLES = {
  two_strand_twists: {
    name: 'Two-Strand Twists',
    description: 'Two sections of hair twisted around each other. Can be done entirely with natural hair.',
    type: 'Fully natural — no extension hair required',
    hairTexturesBestFor: ['4A', '4B', '4C'],
    installationTime: '2–5 hours (size dependent)',
    longevity: '1–3 weeks as twists; can be unravelled into a twist-out',
    dualPurpose: 'Two-strand twists are both a protective style AND a styling method — unravelling reveals a twist-out with beautiful defined coils',
    maintenance: {
      nightly: 'Silk bonnet or pineapple (gather hair high on head)',
      moisture: 'Spritz with water + conditioner mixture every 1–2 days through scalp',
    },
    sizeTip: 'Smaller sections = more defined twist-out when unravelled; larger sections = chunkier, more voluminous twist-out',
  },

  marley_twists: {
    name: 'Marley Twists',
    description: 'Two-strand twists done with Marley hair extension — thick, coarse synthetic hair that mimics 4C texture. Looks like very full natural twists.',
    hairTexturesBestFor: ['3C', '4A', '4B', '4C'],
    installationTime: '4–7 hours',
    longevity: '6–8 weeks',
    extensionHair: 'Marley hair (Afro Kinky hair) — available in various colours',
    distinctiveFeature: 'The Marley hair blends seamlessly with 4B/4C natural hair — looks entirely natural',
  },

  flat_twists: {
    name: 'Flat Twists',
    description: 'Two sections twisted while keeping the base flat to the scalp — like cornrows but twisted instead of braided. Particularly gentle on scalp.',
    hairTexturesBestFor: ['3B', '3C', '4A', '4B'],
    installationTime: '1–3 hours',
    longevity: '1–2 weeks',
    advantage: 'Flatter profile, can be slept on more comfortably, less scalp tension than cornrows',
  },
};

// ─── NATURAL HAIR UPDOS ───────────────────────────────────────────────────────

export const NATURAL_HAIR_UPDOS = {
  buns: {
    name: 'Natural Hair Buns',
    types: [
      { name: 'Puff Bun', description: 'High puff gathered at crown and shaped into bun', difficulty: 'Easy', time: '5 minutes' },
      { name: 'Bantu Knot Bun', description: 'Multiple Bantu knots pinned into a decorative cluster — can be done on stretched or natural hair', difficulty: 'Medium', time: '15–30 minutes' },
      { name: 'Flat Twist Bun', description: 'Flat twists leading into a bun — structured and elegant', difficulty: 'Medium', time: '30–45 minutes' },
    ],
    tools: ['Satin scrunchie (not elastic — elastic causes breakage)', 'Edge control', 'Bobby pins with rubber tips'],
  },
  pineapple: {
    name: 'Pineapple',
    description: 'Hair gathered in a loose, high ponytail at the very crown of the head — looks like a pineapple. Nighttime protective style that preserves curls.',
    purpose: 'NIGHTTIME USE — preserves curl definition while sleeping',
    tool: 'Large satin scrunchie — never a rubber band or elastic',
    tip: 'The secret to preserved next-day curls is silk pillowcase + pineapple. Two layers of protection.',
  },
};

// ─── LOCS ─────────────────────────────────────────────────────────────────────

export const LOCS_GUIDE = {
  name: 'Locs',
    aka: 'Dreadlocks (preferred term: locs)',
  description: 'Hair that has been allowed to lock, or mat, into rope-like sections. Can be started from various methods.',
  types: {
    traditional: { name: 'Traditional / Freeform Locs', description: 'Hair allowed to loc naturally with minimal manipulation — the way locs form on their own', timeTo: '12–24 months', maintenance: 'Minimal — let the hair do its thing' },
    sisterlocks: { name: 'Sisterlocks', description: 'Very small, uniform locs created using a specific parting method and locking technique. Requires a certified Sisterlocks consultant.', timeTo: '2–3 years to fully loc', maintenance: 'Retighten every 4–6 weeks with consultant' },
    interlocked: { name: 'Interlocked Locs', description: 'Hair pulled through a loop tool at the root to create the loc formation', timeTo: '12–18 months', maintenance: 'Reinterlock every 6–8 weeks' },
    starter: { name: 'Starter Locs / Comb Coils', description: 'Small coils created with a styling tool to start the locking process', timeTo: '6–12 months to begin locking' },
  },
  stages: [
    { stage: 'Starter', months: '0–6', description: 'Fresh coils or twists. Hair has not yet begun to lock. May unravel. Very delicate.' },
    { stage: 'Budding', months: '6–12', description: 'Hair begins to interlock. Ends are fuzzy, roots are tighter. Looking "messy" is normal.' },
    { stage: 'Teen', months: '12–18', description: 'Locs look thicker but may appear fluffy. The most challenging stage aesthetically.' },
    { stage: 'Mature', months: '18–24+', description: 'Locs are fully locked throughout. Smooth, defined, strong.' },
    { stage: 'Rooted', months: '24+', description: 'Fully established. Low maintenance. Beautiful.' },
  ],
  culturalContext: 'Locs appear across cultures — Rastafari (Jamaica), Hindu sadhus, Ethiopian Coptic priests, and various African cultures. They are not exclusively one community\'s tradition, but have deep spiritual significance in many.',
  careBasics: [
    'Wash every 1–2 weeks (clean scalp = healthy growth)',
    'Dry thoroughly after washing (damp locs develop mildew inside)',
    'Oil scalp, not locs — product in locs causes buildup and prevents locking',
    'Re-twist new growth every 4–8 weeks depending on texture and preference',
    'Sleep with silk/satin bonnet or on silk pillowcase',
  ],
};

// ─── WIGS & EXTENSIONS ────────────────────────────────────────────────────────

export const WIGS_EXTENSIONS = {
  whyWigs: {
    asProtectiveStyle: 'Wigs are one of the most versatile protective styles — they completely protect natural hair underneath and allow styling variety without touching natural hair.',
    properWigSetup: [
      'Install cornrows or flat twists flat to the scalp underneath',
      'Apply a wig cap over the braids',
      'Install the wig using clips, glue (edge or lace glue), or sewn-in',
    ],
    underWigCare: 'Natural hair under wig must still be moisturised — take the wig off every 2–3 days, spritz hair with water/conditioner, oil scalp.',
  },
  types: {
    lace_front: { name: 'Lace Front Wig', description: 'Sheer lace at the front hairline only. Natural-looking hairline. Most popular.', pro: 'Natural hairline illusion', con: 'Only front lace — side and back look like a wig cap' },
    full_lace: { name: 'Full Lace Wig', description: 'Entire wig cap is lace. Hair can be parted anywhere, put up in ponytail.', pro: 'Maximum versatility', con: 'Expensive. Fragile.' },
    u_part: { name: 'U-Part Wig', description: 'Wig with a U-shaped opening at the top where your natural hair is pulled through and blended', pro: 'Natural blend, less glue/adhesive needed', con: 'Natural hair must match or close to wig texture to blend' },
    closure: { name: 'Closure Wig', description: '4×4 or 5×5 lace patch in the parting area only. The rest is weft.', pro: 'Budget-friendly lace option', con: 'Limited parting' },
  },
  laceGlueWarning: 'Lace adhesives applied directly to the hairline can cause traction alopecia and contact dermatitis. Seek glue-free application methods where possible, or use skin-safe adhesive and remove fully after each wear.',
};

// ─── SCALP HEALTH IN PROTECTIVE STYLES ───────────────────────────────────────

export const SCALP_HEALTH_IN_PROTECTIVE_STYLES = {
  signs_of_healthy_scalp: ['Clean without buildup', 'No itching beyond mild', 'No flaking', 'Edges full and intact', 'New growth visible at roots'],
  signs_of_problem: [
    { sign: 'Severe itching', cause: 'Buildup, dry scalp, or product reaction', fix: 'Diluted shampoo scalp wash immediately' },
    { sign: 'Flaking / white flakes', cause: 'Dry scalp, dandruff, or product buildup', fix: 'Apple cider vinegar diluted rinse; tea tree oil scalp spray' },
    { sign: 'Thinning edges', cause: 'Too tight installation (traction alopecia)', fix: 'Remove style immediately. Take style break. See dermatologist.' },
    { sign: 'Pain at roots', cause: 'Style is too tight', fix: 'Ask stylist to loosen; remove style if cannot loosen' },
    { sign: 'Odour', cause: 'Hair not drying properly after washing; sweat buildup', fix: 'Clarifying wash, dry thoroughly with hooded dryer' },
  ],
  traction_alopecia: {
    what: 'Hair loss caused by repeated pulling tension on the hair follicle — most commonly at the temples, edges, and nape',
    causes: ['Tight braids, cornrows, or weaves', 'Tight ponytails repeatedly', 'Heavy extension hair', 'Years of repeated tight styling'],
    signs: ['Receding hairline at temples', 'Thin or missing baby hairs', 'Small bumps along hairline', 'Itching at hairline under tight styles'],
    prevention: ['Never install styles that pull at the edges', 'Take breaks between protective styles', 'Avoid small micro braids starting right at the hairline', 'If it hurts: it is too tight'],
    treatment: 'Early traction alopecia is reversible with rest and scalp treatment. Advanced traction alopecia may be permanent. See a dermatologist or trichologist early.',
  },
};

// ─── COMMUNITY-SPECIFIC TRADITIONAL STYLES ────────────────────────────────────

export const TRADITIONAL_STYLES_BY_COMMUNITY = {
  'west-african': [
    { style: 'Shuku', description: 'Cornrows gathered into a high ponytail at crown, common in Yoruba culture (Nigeria)', occasion: 'Everyday to formal' },
    { style: 'Patewo', description: 'Wide cornrows going straight back, Yoruba name meaning "clap hands"', occasion: 'Everyday' },
    { style: 'Suku', description: 'Cornrows gathered into a low bun at nape', occasion: 'School, everyday' },
    { style: 'Kolese', description: 'Cornrows meeting at centre crown in a starlike pattern', occasion: 'Ceremonial, rites of passage' },
    { style: 'Thread wrapping (Nigerian Threading)', description: 'Sections of hair wrapped tightly with black thread, causing the hair to stretch. Natural heat-free stretching method.', benefit: 'Stretches 4C hair dramatically without heat' },
  ],
  'east-african': [
    { style: 'Kondoo', description: 'Kenyan braided updo with colourful threads woven in', occasion: 'Ceremonial' },
    { style: 'Ethiopian Chebe-like treatments', description: 'Rich butter and herb treatments applied before braiding, common in the region', benefit: 'Deep moisture seal before braiding' },
    { style: 'Somali Hair Oiling', description: 'Henna and black seed oil treatments applied to hair before covering — maintains moisture under headcovering', occasion: 'Everyday maintenance' },
  ],
  'south-asian': [
    { style: 'Traditional oil massage (Champi)', description: 'Weekly hot oil head massage with coconut, mustard, or amla oil — used across South Asia', benefit: 'Stimulates circulation, conditions scalp' },
    { style: 'Braid with oil', description: 'Loose plait or tight braid after oiling — keeps oiled hair contained while treatment penetrates', occasion: 'Overnight treatment' },
    { style: 'Gajra', description: 'Jasmine flowers threaded into a garland and woven through the braid — South Indian wedding and festival tradition', occasion: 'Wedding, festival' },
    { style: 'Choti / Chudi', description: 'Single long braid with decorative elements, often with a paranda (decorative tassel extension)', origin: 'North India, Punjab specifically', occasion: 'Everyday to ceremonial' },
  ],
  'arab': [
    { style: 'Khimar styling', description: 'Voluminous hair styles for under hijab — keeping hair healthy and full under covering', focus: 'Scalp health, moisture' },
    { style: 'Henna hair treatment', description: 'Henna paste applied to hair overnight — conditions, strengthens, can colour brown to auburn', benefit: 'Deep conditioning + colour (darker shades)' },
    { style: 'Argan oil treatment', description: 'Moroccan argan oil applied as pre-wash treatment — iconic North African beauty tradition', benefit: 'Protein and moisture' },
  ],
};

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

export function getStylesForHairTexture(texture) {
  const allStyles = { ...BRAIDED_STYLES, ...TWISTED_STYLES };
  return Object.values(allStyles).filter(s =>
    s.hairTexturesBestFor?.some(t => t === texture || t.startsWith(texture[0]))
  );
}

export function getTraditionalStylesForCommunity(communityId) {
  return TRADITIONAL_STYLES_BY_COMMUNITY[communityId] || [];
}

export function getStylesByInstallTime(maxHours) {
  const all = { ...BRAIDED_STYLES, ...TWISTED_STYLES };
  return Object.values(all).filter(s => {
    const time = s.installationTime || '';
    const minTime = parseInt(time.split('–')[0]) || parseInt(time) || 99;
    return minTime <= maxHours;
  });
}

export function getLocsStageByMonth(months) {
  return LOCS_GUIDE.stages.find(stage => {
    // parseInt('0') is 0, so a missing bound (not a zero) is what falls back to 999.
    const [start, end = 999] = stage.months.split('–').map(s => (Number.isNaN(parseInt(s)) ? 999 : parseInt(s)));
    return months >= start && months <= end;
  }) || LOCS_GUIDE.stages[LOCS_GUIDE.stages.length - 1];
}

export function getAllProtectiveStyles() {
  return {
    braided: Object.values(BRAIDED_STYLES),
    twisted: Object.values(TWISTED_STYLES),
    updos: Object.values(NATURAL_HAIR_UPDOS),
    locs: LOCS_GUIDE,
    wigs: WIGS_EXTENSIONS,
  };
}

