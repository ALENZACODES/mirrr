/**
 * MIRRR Lip Art Guide
 * Liner techniques, finishes, ombre, overline, glossy, vinyl,
 * matte, glassy, editorial lip art, community lip traditions
 */

// ─── LIP ANATOMY & STRUCTURE ─────────────────────────────────────────────────

export const LIP_ANATOMY = {
  cupids_bow: {
    name: 'Cupid\'s Bow',
    description: 'The double-peaked upper lip contour. Named after the bow of Cupid (the Roman god of love). Defined vs undefined cupid\'s bow varies significantly by ethnicity — both are beautiful and valid; neither requires "correction".',
  },
  vermilion_border: {
    name: 'Vermilion Border',
    description: 'The line between the lip skin (pink/red) and the surrounding skin. Key target for lip liner. Defined vs blurred border varies by person.',
  },
  lip_body: { name: 'Lip Body', description: 'The main fleshy part of the lip. Takes the bulk of colour and gloss.' },
  philtrum: { name: 'Philtrum', description: 'The vertical groove between the nose and the upper lip. Depth and length influence perceived lip proportion.' },
  oral_commissures: { name: 'Oral Commissures', description: 'The corners of the mouth. Often darker than the rest of the lip in melanin-rich skin tones.' },
  lip_skin: { name: 'Lip Skin', description: 'Extremely thin (3-4 cell layers vs 16 on regular skin). No sebaceous glands — no natural oil. No melanocytes in significant numbers — why lips need SPF.' },
};

// ─── LIP LINER TECHNIQUES ────────────────────────────────────────────────────

export const LIP_LINER_TECHNIQUES = {
  purpose: {
    primary: 'Liner defines the lip edge, prevents feathering/bleeding of lipstick into fine lines, and extends the longevity of the lip look.',
    secondary: 'Liner also shapes — overline to appear fuller, map the cupid\'s bow precisely, correct asymmetry.',
  },
  how_to_sharpen: 'Sharpen liner pencil before every application. Dull liner drags and deposits colour unevenly. A sharp point = precision.',
  basic_liner: {
    technique: 'Basic Lip Liner',
    steps: [
      'Start at the cupid\'s bow peaks (left peak, right peak).',
      'Draw the centre of the upper lip.',
      'Connect peaks to corners (oral commissures).',
      'Line the lower lip from corner to corner.',
      'Fill in the entire lip with liner as a base — this increases longevity dramatically.',
    ],
  },
  x_technique: {
    technique: 'The X Technique (Cupid\'s Bow)',
    steps: [
      'Draw an X at the top of the philtrum (this creates the double-peak of the cupid\'s bow precisely).',
      'Connect the two outer points of the X down and out to the lip corners.',
      'Done — perfect cupid\'s bow every time regardless of skill level.',
    ],
  },
  overline: {
    technique: 'Overlining (Fullness Technique)',
    description: 'Draw the liner just outside the natural vermilion border to create the illusion of fuller lips.',
    rules: [
      'Overline only the body of the lip — NEVER overline the corners (oral commissures); this looks unnatural and off.',
      'Overline by no more than 1-2mm beyond the natural lip line; anything beyond looks obvious.',
      'Match the overline colour exactly to your lipstick — a visible liner ring in a contrasting colour defeats the purpose.',
      'Conceal outside the lined area with a nude concealer to blend and "extend" the lip into surrounding skin.',
    ],
  },
  underline: {
    technique: 'Underlining (Slim Technique)',
    description: 'Line just inside the natural vermilion border to create the appearance of slightly smaller lips.',
    note: 'Less commonly practiced. All lip sizes are beautiful; this technique exists for those who prefer it aesthetically.',
  },
  ombre_liner: {
    technique: 'Ombre Liner',
    description: 'Use a darker liner at the corners and a lighter or matching liner at the centre. Creates depth and dimension.',
  },
  concealer_clean_up: {
    technique: 'Concealer Clean-Up',
    description: 'After liner and lipstick application, use a fine-tipped brush dipped in concealer to clean and sharpen the outer edge of the lip. Creates a defined, editorial look. Significantly elevates the finish of any lip look.',
  },
};

// ─── LIP FINISHES ────────────────────────────────────────────────────────────

export const LIP_FINISHES = {
  matte: {
    finish: 'Matte',
    description: 'Flat, non-reflective finish. High pigment density. Maximum opacity.',
    pros: ['Longest wear (less transfer)', 'Most dramatic', 'Slims the appearance of very full lips if desired', 'Most opaque coverage'],
    cons: ['Can be drying (especially liquid mattes)', 'Emphasises lip texture and dryness', 'Can look flat on very dark skin tones if formula is chalky'],
    prep: 'ALWAYS exfoliate and moisturise lips before matte application. Lip scrub → balm for 5 minutes → blot → apply.',
    best_formulas: 'Satin-matte (slightly less drying than flat matte); cushiony liquid matte (Charlotte Tilbury Matte Revolution; MAC Powder Kiss)',
    ethnic_note: 'Matte formulas on very deep skin tones must be high-pigment to avoid looking ashy. Test finish in natural light.',
  },
  satin: {
    finish: 'Satin / Cream',
    description: 'Low-level sheen. Comfortable wear. The most flattering all-day finish.',
    pros: ['Comfortable — not drying', 'Flattering on all skin tones', 'Moderate wear', 'Looks natural'],
    best_for: 'Everyday wear; daytime; office; wearable colour',
  },
  gloss: {
    finish: 'Gloss',
    description: 'Reflective, shiny finish. Optically plumping (light reflection creates perception of fullness).',
    pros: ['Plumping effect', 'Comfortable', 'Very easy to apply', 'Youthful'],
    cons: ['Shorter wear; transfers easily', 'Can attract hair (famously)', 'Less staying power in heat'],
    types: {
      sheer_gloss: 'Mostly just shine with slight tint. Very natural.',
      pigmented_gloss: 'Full colour plus shine. Charlotte Tilbury Collagen Lip Bath; Fenty Gloss Bomb.',
      plumping_gloss: 'Contains mint, ginger, or capsicum (chilli) to create blood-rush effect (tingling = minor swelling). Dior Addict Lip Maximizer.',
    },
  },
  glossy: {
    finish: 'Glossy (high-gloss editorial)',
    description: 'Maximally reflective. The "wet lip" look seen in editorial photography.',
    how_to: 'Layer a thick clear gloss over any lipstick. Or use a petroleum-jelly-based gloss (Vaseline + a lip-safe pigment).',
    ethnic_note: 'High-gloss looks exceptionally beautiful on deep skin tones — the contrast and reflection against deeper melanin is stunning. This finish is celebrated in Black American and Caribbean beauty culture.',
  },
  vinyl: {
    finish: 'Vinyl / Lacquer',
    description: 'Ultra-high shine with significant pigment. Like patent leather for lips.',
    products: 'Urban Decay Vice Lipstick in metallics; NYX Lip Lingerie XXL Shine; MAC MACximal Silky Matte vs Lipglass layered.',
    how_to: 'Apply a liquid lipstick as base. Top with a clear lacquer-finish gloss ONLY once the base is dry.',
  },
  metallic: {
    finish: 'Metallic / Foil',
    description: 'Reflective with metallic particles. Gold, bronze, silver, rose gold, copper.',
    ethnic_note: 'Gold and bronze metallics are particularly luminous on medium to deep skin tones. Celebrate your melanin with warm metallics.',
    application: 'Use finger-pat application to maximise foil-like finish (brush disperses particles and reduces impact).',
  },
  velvet: {
    finish: 'Velvet',
    description: 'Matte with a slight softness. Not flat-matte, not satin — somewhere between. Often described as "velvety".',
    products: 'Pat McGrath MatteTrance; Charlotte Tilbury Matte Revolution Velvet.',
  },
};

// ─── OMBRE LIP TECHNIQUES ────────────────────────────────────────────────────

export const OMBRE_LIP_GUIDE = {
  classic_ombre: {
    name: 'Classic Two-Tone Ombre',
    description: 'Darker shade at the outer edges fading to lighter in the centre.',
    steps: [
      'Line and fill lips with the darker shade.',
      'Apply the lighter shade to the centre (using brush or fingertip).',
      'Blend where the two shades meet with a clean fingertip or brush.',
      'Blot gently to blur the demarcation line.',
    ],
    colour_suggestions: ['Deep berry outer + dusty rose centre', 'Brown outer + nude centre', 'Dark plum outer + pink centre'],
  },
  reverse_ombre: {
    name: 'Reverse Ombre (Lighter Outside)',
    description: 'Lighter shade at the outer edges fading to deeper in the centre. Unusual and editorial.',
    tip: 'Works best with nudes (outside) and deep berries or browns (centre).',
  },
  gradient_lip: {
    name: 'Gradient / Korean-Style Lip',
    description: 'Predominantly light lip with concentrated colour at the centre. Creates a "bitten" or "just-eaten-berries" look.',
    steps: [
      'Apply a nude or your natural lip colour (or tinted moisturiser) all over.',
      'Dab a deeper or brighter colour onto the very centre of both lips with a fingertip.',
      'Blur outward by dabbing (not swiping).',
    ],
    ethnic_note: 'The Korean gradient lip originated in K-Beauty and was designed around porcelain skin tones; it is beautiful on all skin tones but the "centre colour" should be adjusted to complement deeper skin (warm berries, brick reds, and tawny nudes rather than very pink shades that can look chalky on deep skin).',
  },
  three_tone_ombre: {
    name: 'Three-Tone Ombre',
    description: 'Advanced. Three shades: darkest at corners, mid at body, lightest/highlight at cupid\'s bow and lower lip pout centre.',
    tip: 'Highlighter (gold or white) dab at the cupid\'s bow and the centre of the lower lip pout significantly elevates this look.',
  },
};

// ─── STATEMENT LIP LOOKS ──────────────────────────────────────────────────────

export const STATEMENT_LIP_LOOKS = {
  classic_red: {
    look: 'Classic Red Lip',
    technique: 'Line and fill with matching red liner. Apply lipstick with a lip brush for precision. Blot. Reapply. Powder puff blot (tissue-thin tissue technique for longevity). Clean edges with concealer.',
    shade_by_skin_tone: {
      fair: 'Blue-based reds (create contrast with fair skin; counteract sallowness)',
      medium: 'Classic true reds and warm reds work equally',
      tan_olive: 'Warm brick reds, tomato reds',
      deep: 'Rich warm reds with burgundy depth; orange-reds; avoid blue-reds that can appear unnatural on the deepest tones',
    },
    ethnic_note: 'The "red lip" has different cultural connotations: in Black American culture associated with old Hollywood glamour and power dressing; in Arab/South Asian culture with bridal and festive beauty; in Latina culture celebratory and festive.',
  },
  nude_lip: {
    look: 'Perfect Nude Lip',
    challenge: 'A "nude" lip is nude relative to the wearer — it should match or be 1-2 shades lighter or darker than their natural lip colour.',
    by_skin_tone: {
      fair: 'Pinks, peaches, light mauves',
      light_medium: 'Soft roses, warm pinks, peachy nudes',
      medium: 'Mauves, dusty roses, warm tans',
      tan_olive: 'Warm nude-browns, caramel, terracotta',
      deep_medium: 'Brick browns, warm mocha, tawny',
      deep: 'Rich mocha, deep caramel, warm chocolate (NOT grey-brown — will look ashy)',
    },
    tip: 'The Most Common Nude Lip Mistake: wearing a "nude" designed for a lighter skin tone that appears grey, washed-out on deeper skin. Your nude has warmth — brown, bronze, caramel, not pink-beige.',
  },
  dark_lip: {
    look: 'Dark / Deep Lip',
    shades: ['Blackberry', 'Deep plum', 'Oxblood', 'Dark chocolate brown', 'Navy (editorial)', 'Midnight black (editorial)'],
    tips: [
      'Dark lips require a VERY clean, precise liner — any smudging is highly visible.',
      'Keep the rest of the face minimal (especially eyes) when wearing a dramatic dark lip.',
      'A damp cotton bud dipped in micellar water is your best friend for correction.',
    ],
    ethnic_note: 'Dark and berry tones look extraordinary on deeper skin tones. The contrast with melanin-rich skin creates dramatic, striking looks.',
  },
  glossy_editorial: {
    look: 'Wet/Glossy Editorial Lip',
    how_to: [
      'Line and fill with a base lipstick in your chosen tone.',
      'Let it set for 60 seconds.',
      'Apply a thick clear gloss with your finger, piling it on the centre.',
      'For maximum effect: while gloss is wet, tap with fingertip to create a "dimensional" texture.',
    ],
    tip: 'For a long-lasting glossy look: use a long-wear liquid lipstick as base. Allow to dry fully. Layer gloss. The base stays put while the gloss gives the shine.',
  },
  ombre_editorial: {
    look: 'Editorial Ombre',
    description: 'Dramatic ombre for photoshoots or events. May include glitter, foil, or contrasting liner.',
    tip: 'Use a synthetic flat brush for the most precise blending. Work quickly as most formulas dry fast.',
  },
};

// ─── COLOUR SELECTION BY SKIN TONE ───────────────────────────────────────────

export const LIP_COLOUR_BY_SKIN_TONE = {
  philosophy: 'There are no "wrong" lip colours for any skin tone — makeup is art and self-expression. These are guidelines for flattering results, not rules. Wear whatever you love.',
  fair: {
    skin_tone: 'Fair (Fitzpatrick I-II)',
    flattering: ['Pinks (all shades)', 'Peach and coral', 'Light nudes', 'Berry and mauve', 'Classic reds'],
    avoid: ['Very deep browns (can look goth unless that\'s the intent)', 'Warm orangey-browns (can look jarring on very cool-toned fair skin)'],
  },
  light_medium: {
    skin_tone: 'Light-Medium (Fitzpatrick II-III)',
    flattering: ['Nudes', 'Roses', 'Warm reds', 'Corals', 'Mauves'],
    best: 'This skin tone range has the most flexibility with colour.',
  },
  medium_tan: {
    skin_tone: 'Medium-Tan (Fitzpatrick III-IV)',
    flattering: ['Terracotta', 'Warm reds', 'Deep pinks', 'Warm coral', 'Burgundy', 'Brown-nudes'],
    tip: 'Warm and earthy tones particularly luminous on olive and tan skin.',
  },
  deep: {
    skin_tone: 'Deep (Fitzpatrick V-VI)',
    flattering: ['Warm reds', 'Berry (plum, blackberry)', 'Deep brown-reds', 'Caramel nudes', 'Bronze metallics', 'Orange-reds'],
    avoid: ['Cool-toned pinks that appear chalky', 'Grey-nude shades that wash out', 'Very light pink (can look ashy)'],
    celebrate: 'Deep skin tones look STUNNING in bold, rich, saturated colours. Deep berries, dark plums, warm reds — these colours POP against melanin in ways that are iconic.',
  },
};

// ─── ETHNIC LIP TRADITIONS ────────────────────────────────────────────────────

export const ETHNIC_LIP_TRADITIONS = {
  west_african: {
    community: 'West African',
    traditions: 'Bold, deep lip colours are beloved. Dark reds and berry shades a cultural beauty staple. Natural lip care with shea butter is a long-standing tradition — shea protects and nourishes the lip skin.',
    modern: 'Nigerian, Ghanaian, and Senegalese beauty content creators have popularised dramatic dark lips and "snatched" liner work globally.',
  },
  south_asian: {
    community: 'South Asian',
    traditions: 'Deep reds are traditional for brides (often combined with deep eye makeup). Everyday lip looks more restrained historically. Red lipstick (sindoor worn by married women — distinct from lipstick but red as symbolic colour of marriage). Pakistani and Indian beauty influencers have popularised editorial and bold lip art globally.',
    bridal: 'Bridal lip traditionally deep red in South Asian weddings. Some Northern Indian traditions use red lip liner with precise cupid\'s bow definition.',
  },
  caribbean: {
    community: 'Caribbean',
    traditions: 'Coral, bright red, and deep berries popular in Caribbean beauty culture. Coconut oil as natural lip balm. Carnival makeup incorporates bold and theatrical lip art.',
  },
  arab: {
    community: 'Arab',
    traditions: 'Glossy and defined lip looks popular. Deep reds and berry shades for formal occasions. Arabic beauty historically associated with kohl (eyes) but modern Arab beauty celebrates bold lips.',
    modern: 'Gulf Arab beauty influence has popularised the "snatched" overlined look globally — precise liner, defined cupid\'s bow, nude-liner with a deeper lipstick.',
  },
  latina: {
    community: 'Latina',
    traditions: 'Vibrant, bold lip colours are central to Latina beauty culture. Red lips at celebrations, quinceañeras, and festivals are iconic. Warm corals, oranges, reds, and hot pinks celebrated.',
    modern: 'Mexican, Colombian, and Brazilian beauty influencers have contributed significantly to global lip trends including bold colour and overlining.',
  },
  east_asian: {
    community: 'East Asian',
    
    modern: 'The Korean concept of "gradient" or "smudged" lip look went global around 2013-2016.',
  },
  east_african: {
    community: 'East African',
    traditions: 'Natural lip care with shea and frankincense. Henna lip staining in some communities. Bold colours for celebrations.',
  },
  south_african: {
    community: 'South African',
    traditions: 'Bold lips in Cape Malay celebrations. Rooibos lip scrub (antioxidant).',
  },
  black_american: {
    community: 'Black American',
    traditions: 'The bold lip has been central to Black American beauty culture. Dark berry, deep red and brown lips are long-standing looks, and the brown-lined lip of the 1990s became a global trend.',
    icons: 'Aaliyah\'s 90s brown lip; Mary J. Blige\'s bold berry; Iman\'s bold editorial looks; Rihanna\'s Fenty Beauty range created specifically for deep skin tones.',
  },
};

// ─── LIP CARE ─────────────────────────────────────────────────────────────────

export const LIP_CARE_BASICS = {
  exfoliation: {
    frequency: '2-3x weekly',
    methods: {
      sugar_scrub: 'Mix white sugar + honey + a drop of lip-safe oil. Apply in circular motions; rinse. DIY or purchase (Lush Bubblegum Lip Scrub; Sara Happ Brown Sugar).',
      toothbrush: 'Wet a soft toothbrush; gently buff in circular motions. Removes dead skin without additional ingredients.',
    },
    caution: 'Do not exfoliate cracked, split, or severely chapped lips — this will cause pain and further damage. Heal first (intensive balm/Vaseline overnight), then exfoliate.',
  },
  moisturisation: {
    daily: 'Apply a nourishing lip balm morning and night. Look for: shea butter, vitamin E, hyaluronic acid (some lip balms), petroleum jelly base, lanolin.',
    spf: 'Lips have minimal melanin and no sebaceous glands — they are extremely vulnerable to UV damage. Use a lip balm with SPF 30+ during sun exposure. This also helps prevent hyperpigmentation at the lip border.',
    overnight: 'Apply a thick layer of Vaseline or a thick lip mask overnight. "Slugging" for lips — the original beauty hack.',
  },
  hyperpigmentation: {
    concern: 'Lip hyperpigmentation (darkened or uneven lip colour) is a common concern across many ethnic communities, particularly at the corners of the mouth and along the lip border.',
    causes: ['UV exposure', 'Hormonal changes', 'Smoking (significant)', 'Dental issues in some cases', 'Poor-quality lipsticks with potentially irritating ingredients', 'Licking lips excessively'],
    solutions: ['SPF lip balm daily', 'Stop smoking', 'Vitamin C lip treatments', 'AHA lip exfoliation serums'],
    ethnic_note: 'Darkening at the lip corners is common. This is a legitimate concern — not something to feel self-conscious about — and can be addressed with consistent SPF protection and vitamin C.',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export function getLipAnatomy() { return LIP_ANATOMY; }
export function getLinerTechnique(technique) {
  return LIP_LINER_TECHNIQUES[technique] || LIP_LINER_TECHNIQUES;
}
export function getLipFinish(finish) {
  return LIP_FINISHES[finish] || LIP_FINISHES;
}
export function getOmbreLipGuide() { return OMBRE_LIP_GUIDE; }
export function getStatementLook(look) {
  return STATEMENT_LIP_LOOKS[look] || STATEMENT_LIP_LOOKS;
}
export function getLipColourForSkinTone(skinTone) {
  return LIP_COLOUR_BY_SKIN_TONE[skinTone] || LIP_COLOUR_BY_SKIN_TONE;
}
export function getEthnicLipTradition(communityId) {
  const key = communityId?.replace('-', '_');
  return ETHNIC_LIP_TRADITIONS[key] || Object.values(ETHNIC_LIP_TRADITIONS);
}
export function getLipCareGuide() { return LIP_CARE_BASICS; }

