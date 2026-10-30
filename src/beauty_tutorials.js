/**
 * beauty_tutorials.js — Step-by-step multicultural beauty tutorials for MIRRR
 * Detailed guides for looks, techniques, and traditional rituals
 */

export const DIFFICULTY_LEVELS = {
  '1': { id: 1, label: 'Beginner', description: 'No prior experience needed', icon: '⭐' },
  '2': { id: 2, label: 'Easy', description: 'Basic makeup experience helpful', icon: '⭐⭐' },
  '3': { id: 3, label: 'Intermediate', description: 'Comfortable with most techniques', icon: '⭐⭐⭐' },
  '4': { id: 4, label: 'Advanced', description: 'Experience with multiple techniques', icon: '⭐⭐⭐⭐' },
  '5': { id: 5, label: 'Pro', description: 'Professional-level skills', icon: '⭐⭐⭐⭐⭐' },
};

export const TUTORIALS = {
  ubtan_face_mask: {
    id: 'ubtan_face_mask',
    title: 'Ubtan (Bridal Glow Mask)',
    community: 'south-asian',
    category: 'skincare',
    difficulty: 1,
    timeMinutes: 30,
    description: 'A traditional South Asian bridal glow mask: turmeric, gram flour and rose water.',
    culturalContext: 'Ubtan has been applied to brides (and grooms) before South Asian weddings for generations, and the haldi (turmeric) ceremony is closely tied to it.',
    benefits: ['gentle exfoliation', 'radiance', 'softness'],
    tools: ['small bowl', 'mixing spoon', 'brush or hands'],
    ingredients: [
      { name: 'Gram flour (besan)', amount: '2 tablespoons' },
      { name: 'Turmeric powder (haldi)', amount: '1/4 teaspoon' },
      { name: 'Rose water', amount: '2-3 tablespoons' },
      { name: 'Milk or yogurt (optional)', amount: '1 tablespoon' },
      { name: 'Saffron (optional, for extra glow)', amount: '3-4 strands soaked in warm milk' },
    ],
    steps: [
      {
        step: 1,
        title: 'Mix the dry ingredients',
        instruction: 'Combine gram flour and turmeric in a small bowl. Mix well to evenly distribute the turmeric.',
        tip: 'Use a tiny amount of turmeric: it stains. A quarter teaspoon is enough without a yellow tint on lighter skin.',
        duration: '2 minutes',
      },
      {
        step: 2,
        title: 'Add rose water gradually',
        instruction: 'Add rose water spoonful by spoonful, mixing as you go, until a smooth paste forms. Consistency should be like thick yogurt — not runny.',
        tip: 'Use milk or yogurt instead of some of the rose water for a creamier paste. Saffron is traditional and optional.',
        duration: '2 minutes',
      },
      {
        step: 3,
        title: 'Cleanse your face',
        instruction: 'Double-cleanse first — oil cleanser then gentle foam. Pat dry.',
        tip: 'Start on clean skin so the paste spreads and rinses evenly.',
        duration: '3 minutes',
      },
      {
        step: 4,
        title: 'Apply the ubtan',
        instruction: 'Apply mask in gentle circular motions. Cover face and neck evenly, avoiding eye area. Leave on for 15-20 minutes.',
        tip: 'Do not leave it on too long: gram flour can be drying. Fifteen minutes is enough.',
        duration: '2 minutes',
      },
      {
        step: 5,
        title: 'Remove with massage',
        instruction: 'Dampen hands and remove with gentle circular massage — this is the exfoliation step. Rinse thoroughly with lukewarm water.',
        tip: 'The massage is key. You should feel gentle grit as the gram flour exfoliates. Rinse until water runs clear.',
        duration: '5 minutes',
      },
      {
        step: 6,
        title: 'Moisturise and tone',
        instruction: 'Pat skin dry, apply rose water toner with a cotton pad, then seal with a moisturiser. Your skin should glow.',
        tip: 'For bridal prep, use it two or three times a week in the weeks before the wedding, and stop if your skin feels tight or irritated.',
        duration: '3 minutes',
      },
    ],
    frequency: 'Weekly or pre-event',
    skinTypes: ['all', 'sensitive (adjust turmeric to pinch)'],
    warnings: ['Patch-test on your inner arm first (turmeric, milk and saffron can all irritate)', 'May tint lighter skin yellow for a day: do it at least 24 hours before an event', 'Do not apply to open wounds'],
    tags: ['ubtan', 'haldi', 'bridal', 'south-asian', 'turmeric', 'DIY', 'radiance'],
  },
  black_soap_ritual: {
    id: 'black_soap_ritual',
    title: 'West African Black Soap Cleanse',
    community: 'west-african',
    category: 'skincare',
    difficulty: 1,
    timeMinutes: 15,
    description: 'West African black soap (ose dudu / alata samina): a traditional deep cleanse for oily skin.',
    culturalContext: 'African black soap has been made by Yoruba and Akan women for centuries. Originally made from ash of plantain skin, cocoa pods, palm oil and shea — a complex artisanal process.',
    benefits: ['deep cleanse', 'traditional cleanse for oily skin'],
    tools: ['raw black soap', 'bowl of water', 'fingertips or soft cloth', 'moisturiser'],
    ingredients: [
      { name: 'Raw African black soap', amount: 'Piece the size of a grape' },
      { name: 'Warm water', amount: 'Enough to lather' },
    ],
    steps: [
      {
        step: 1,
        title: 'Soften the soap',
        instruction: 'Wet hands thoroughly. Take a piece of raw black soap the size of a grape and work it between wet palms for 30 seconds until a rich lather forms.',
        tip: 'Never apply raw black soap directly to face — it is too coarse. Always lather in hands first.',
        duration: '1 minute',
      },
      {
        step: 2,
        title: 'Cleanse face',
        instruction: 'Apply lather to damp face and neck in gentle circular motions. Massage for 30-60 seconds.',
        tip: 'For first use: only do 20 seconds. Black soap is strong. Build tolerance gradually.',
        duration: '1 minute',
      },
      {
        step: 3,
        title: 'Rinse completely',
        instruction: 'Rinse with lukewarm water until all lather is removed. Avoid hot water — it strips the skin further.',
        tip: 'If you feel tight or dry after rinse, dilute your black soap next time.',
        duration: '1 minute',
      },
      {
        step: 4,
        title: 'Pat dry and moisturise immediately',
        instruction: 'Pat (do not rub) dry with clean towel. Apply moisturiser within 60 seconds while skin is still slightly damp.',
        tip: 'Black soap is potent. Always follow with moisturiser. Shea butter is the traditional follow-up.',
        duration: '2 minutes',
      },
    ],
    frequency: 'Once daily or every other day (start slow)',
    skinTypes: ['oily', 'acne-prone', 'combination', 'not recommended for very dry or sensitive skin initially'],
    warnings: ['Start with 2-3 times per week', 'Always moisturise after', 'It can be drying: stop if it causes dryness, stinging or new breakouts'],
    tags: ['black-soap', 'ose-dudu', 'alata-samina', 'west-african', 'oily-skin', 'cleanse', 'DIY'],
  },
  kohl_eye_tutorial: {
    id: 'kohl_eye_tutorial',
    title: 'Traditional Kohl Eye Tutorial',
    community: 'arab',
    category: 'eyes',
    difficulty: 2,
    timeMinutes: 10,
    description: 'Master the Arabic kohl eye — dramatic waterline kohl, smoky smudge, and extended lower lash line.',
    culturalContext: 'Kohl has lined eyes since ancient Egypt, and across Arabia and South Asia. Many people believe it protects the eyes; that is not proven.',
    benefits: ['deep eye definition', 'smoky effect', 'elongating'],
    tools: ['kohl pencil or kajal pencil', 'smudge brush', 'eyeshadow for blending', 'Q-tip'],
    ingredients: [
      { name: 'Black kohl/kajal pencil', amount: '1 (waterproof preferred)' },
      { name: 'Dark brown or black eyeshadow', amount: 'For blending' },
      { name: 'Setting powder (optional)', amount: 'To set liner' },
    ],
    steps: [
      {
        step: 1,
        title: 'Prepare the eye area',
        instruction: 'Apply eyeshadow primer to lids and under eyes. Dust a light setting powder under the eye to catch any fallout.',
        tip: 'No primer? Dab a tiny bit of concealer on the lid and set with powder.',
        duration: '2 minutes',
      },
      {
        step: 2,
        title: 'Line the waterline',
        instruction: 'Pull down the lower lid gently. Apply kohl pencil to the inner waterline (the pink rim of the eye), moving from inner corner to outer corner. Apply to upper waterline too.',
        tip: 'Look up while doing lower waterline. This is the most dramatic step — the "kohl smoulder" comes from this.',
        duration: '2 minutes',
      },
      {
        step: 3,
        title: 'Line the lash line',
        instruction: 'Apply kohl along the upper lash line from inner to outer corner. You can go thicker toward the outer corner for elongation.',
        tip: 'Tightline (apply between lashes) for the most dramatic effect.',
        duration: '1 minute',
      },
      {
        step: 4,
        title: 'Smudge for smoke',
        instruction: 'Using a smudge brush or your fingertip, blend the lower lash line liner downward and outward slightly for a smoky effect.',
        tip: 'The smudge is what makes kohl different from liner — that soft, hazy, sultry effect.',
        duration: '1 minute',
      },
      {
        step: 5,
        title: 'Blend with shadow',
        instruction: 'Apply a dark brown or black eyeshadow over the smudged liner with a blending brush to deepen and soften the look.',
        tip: 'Blend in a "C" shape from lower lash line into the crease for a full Khaleeji effect.',
        duration: '2 minutes',
      },
      {
        step: 6,
        title: 'Clean and sharpen edges',
        instruction: 'Dip a Q-tip in concealer and clean up any fallout or smudge outside the intended area.',
        tip: 'A concealer cleanup gives a professional finish and really sharpens the outer corner.',
        duration: '1 minute',
      },
    ],
    frequency: 'Per use',
    skinTypes: ['all'],
    warnings: ['Avoid if you have an eye infection', 'Traditional kohl, kajal and surma can contain lead: use a cosmetic pencil sold for the waterline', 'Never put kohl on babies or children'],
    tags: ['kohl', 'kajal', 'arab', 'south-asian', 'smoky', 'waterline', 'eye'],
  },
  cut_crease_tutorial: {
    id: 'cut_crease_tutorial',
    title: 'Cut-Crease Eye Tutorial',
    community: 'all',
    category: 'eyes',
    difficulty: 4,
    timeMinutes: 30,
    description: 'Master the dramatic cut-crease technique that defines the eye crease with sharp contrast for elongated, lifted eyes.',
    culturalContext: 'The cut crease is a staple of Nigerian party and bridal glam, including aso-ebi looks, and works on hooded eyes when the cut line sits higher.',
    benefits: ['eye lifting', 'dramatic definition', 'hooded eye opener'],
    tools: ['flat shader brush', 'blending brush', 'liner brush', 'concealer brush', 'primer', 'setting powder'],
    ingredients: [
      { name: 'Eye primer', amount: '1 pump' },
      { name: 'Matte transition shade (medium brown)', amount: 'For blending' },
      { name: 'Dark matte shade (deep brown/black)', amount: 'For crease' },
      { name: 'Lid highlight shade (champagne/gold)', amount: 'For lid' },
      { name: 'Concealer (1 shade lighter than skin)', amount: 'For cut' },
      { name: 'Setting powder (banana on light to medium skin; peach, orange-toned or translucent on deep skin)', amount: 'To set the cut' },
      { name: 'Black gel liner', amount: 'For wing' },
    ],
    steps: [
      {
        step: 1,
        title: 'Prime and set the lid',
        instruction: 'Apply eye primer from lash line to brow bone. Set with a thin layer of setting powder. This creates a blank canvas and prevents creasing.',
        tip: 'For deep melanin skin, use a concealer that matches your skin — not a white primer. Baking under the eye now prevents fallout mess later.',
        duration: '2 minutes',
      },
      {
        step: 2,
        title: 'Map the crease and cut line',
        instruction: 'Open your eye and look straight ahead. Using a clean pencil or the tip of a brush, mark where you want the cut crease line to sit — usually about 2-3mm above your natural crease for a lifted effect.',
        tip: 'For hooded eyes: mark the cut line slightly higher than where the hood begins so the crease is visible when eyes are open.',
        duration: '2 minutes',
      },
      {
        step: 3,
        title: 'Apply transition shade',
        instruction: 'Using a fluffy blending brush, apply your medium brown transition shade just above the line you marked. Blend upward into the brow bone with windshield-wiper motions.',
        tip: 'This creates the "shadow" that makes the cut-crease pop. Build slowly — you can add more but can\'t take it away.',
        duration: '4 minutes',
      },
      {
        step: 4,
        title: 'Deepen the crease',
        instruction: 'Switch to your dark shade and pack it along the crease line, blending edges but keeping the intensity at the crease. The line between dark crease and lid should still be visible.',
        tip: 'Use a pencil brush for precision at the crease line before switching to a fluffy brush to blend edges.',
        duration: '4 minutes',
      },
      {
        step: 5,
        title: 'Create the cut',
        instruction: 'This is the key step: load a flat concealer brush with your lighter concealer. Draw a precise line along the top of the lid where you want the "cut." This covers any crease shadow that fell onto the lid.',
        tip: 'Your concealer brush should be angled. Draw with a confident single stroke — don\'t dabble.',
        duration: '3 minutes',
      },
      {
        step: 6,
        title: 'Set the cut',
        instruction: 'Using a small flat brush, lightly set the concealer cut with a matching setting powder to prevent creasing.',
        tip: 'Banana powder suits light and medium skin. On deep skin it can look ashy: use a peach or orange-toned powder deep enough for your skin, or a translucent one.',
        duration: '2 minutes',
      },
      {
        step: 7,
        title: 'Pack the lid shade',
        instruction: 'Apply your lid highlight (gold, champagne, or bold colour) with a flat shader brush on the lid, from lash line up to the cut edge. Stay below the concealer line.',
        tip: 'The contrast between the metallic lid and the matte crease is what makes cut-crease dramatic.',
        duration: '3 minutes',
      },
      {
        step: 8,
        title: 'Line and finish',
        instruction: 'Apply black gel liner across the upper lash line, extending into a wing. Add mascara or lashes. Clean up under eye with concealer.',
        tip: 'For the cleanest wing, use scotch tape at the outer corner as a guide angle, then remove after liner dries.',
        duration: '5 minutes',
      },
    ],
    frequency: 'Per use',
    skinTypes: ['all'],
    warnings: ['Practice makes perfect — this technique takes multiple attempts', 'For hooded eyes, adjust cut line higher'],
    tags: ['cut-crease', 'advanced', 'eye', 'hooded-eyes', 'glam', 'technique'],
  },
  champi_hair_massage: {
    id: 'champi_hair_massage',
    title: 'Champi Oil Head Massage',
    community: 'south-asian',
    category: 'hair',
    difficulty: 1,
    timeMinutes: 40,
    description: 'Traditional South Asian head massage with warm oil: relaxing, and good for the scalp\'s comfort.',
    culturalContext: 'Champi is a traditional Indian head massage, long offered by barbers. The English word "shampoo" comes from the Hindi chāmpo, "press" or "knead".',
    benefits: ['relaxation', 'scalp massage', 'hair conditioning'],
    tools: ['oil heating bowl or microwave-safe bowl', 'towel', 'shower cap'],
    ingredients: [
      { name: 'Coconut oil or sesame oil', amount: '3-4 tablespoons' },
      { name: 'Amla oil (optional)', amount: '1 tablespoon' },
      { name: 'Brahmi powder (optional)', amount: '1/2 teaspoon' },
    ],
    steps: [
      {
        step: 1,
        title: 'Warm the oil',
        instruction: 'Place oil in a bowl and warm gently in a microwave (20-30 seconds) or in a bowl of hot water. Oil should be comfortably warm — not hot.',
        tip: 'Test on inner wrist before applying to scalp. Sesame oil is traditional for winter; coconut for summer.',
        duration: '3 minutes',
      },
      {
        step: 2,
        title: 'Section the hair',
        instruction: 'Divide hair into 4-6 sections with clips or loose ties to make scalp accessible.',
        tip: 'The key is getting the oil to the scalp, not just the hair.',
        duration: '2 minutes',
      },
      {
        step: 3,
        title: 'Apply oil to scalp',
        instruction: 'Using fingertips or a dropper, apply oil along each part and at the scalp throughout each section.',
        tip: 'Use less oil than you think — you can always add more. Over-oiling makes rinsing very difficult.',
        duration: '5 minutes',
      },
      {
        step: 4,
        title: 'Massage with fingertips',
        instruction: 'Using the pads of your fingertips (not nails), massage the scalp in small circular motions. Work from the front hairline back, then down to the nape. Apply medium-firm pressure.',
        tip: 'Move the scalp, not just the hair: you should feel it shift slightly.',
        duration: '15 minutes',
      },
      {
        step: 5,
        title: 'Heat cap treatment',
        instruction: 'Twist or bun hair, cover with a shower cap, then wrap in a warm towel (heated in dryer for 5 minutes). Leave for 20-30 minutes.',
        tip: 'Gentle warmth helps the oil spread and makes the treatment more relaxing.',
        duration: '20 minutes',
      },
      {
        step: 6,
        title: 'Shampoo out (2-3 times)',
        instruction: 'Apply shampoo to dry or barely damp hair FIRST before wetting — this helps break down the oil. Rinse, then shampoo again with water.',
        tip: 'Always shampoo twice to fully remove oil. Skipping this step leads to greasy hair.',
        duration: '10 minutes',
      },
    ],
    frequency: 'Weekly',
    skinTypes: ['all hair types (adjust oil for type)'],
    warnings: ['Do not do if you have active scalp conditions without consulting a dermatologist'],
    tags: ['champi', 'head-massage', 'amla', 'coconut-oil', 'south-asian', 'scalp-massage', 'ayurveda'],
  },
  loc_starter_tutorial: {
    id: 'loc_starter_tutorial',
    title: 'Starter Locs — Two-Strand Twist Method',
    community: 'black-american',
    category: 'hair',
    difficulty: 3,
    timeMinutes: 120,
    description: 'How to start your loc journey using two-strand twists. The most common method for natural coily hair.',
    culturalContext: 'Locs have roots in many cultures, from Indian sadhus to Rastafari. For many Black Americans, locs are a statement of natural identity, and for some a spiritual one.',
    benefits: ['low manipulation', 'protective style', 'identity expression', 'less breakage from daily styling'],
    tools: ['fine-tooth comb', 'sectioning clips', 'spray bottle with water', 'rattail comb', 'hair ties (optional)'],
    ingredients: [
      { name: 'Loc gel (light hold, wax-free)', amount: 'As needed' },
      { name: 'Leave-in conditioner', amount: '1 pump per section' },
      { name: 'Light oil (jojoba or argan)', amount: 'Light coat on scalp' },
    ],
    steps: [
      {
        step: 1,
        title: 'Cleanse and detangle',
        instruction: 'Wash hair with a clarifying or residue-free shampoo. Do NOT use a conditioner on this wash — residue prevents locking. Detangle while wet.',
        tip: 'No conditioner on the day you start: it leaves hair slippery, which slows locking.',
        duration: '20 minutes',
      },
      {
        step: 2,
        title: 'Section the hair',
        instruction: 'Using a rattail comb, create a grid pattern of square sections across the entire head. Section size determines loc size — smaller sections = thinner locs. Secure each with a clip.',
        tip: 'Start sections at the nape (back of neck). Common sizes: pencil-diameter for medium locs. Smaller = longer to loc but thinner finished locs.',
        duration: '20 minutes',
      },
      {
        step: 3,
        title: 'Apply loc product to one section',
        instruction: 'Spray water to dampen one section. Apply a pea-sized amount of loc gel from root to tip. Distribute evenly.',
        tip: 'Work one section at a time. Keep other sections clipped.',
        duration: '1 minute per section',
      },
      {
        step: 4,
        title: 'Create the two-strand twist',
        instruction: 'Divide each section into 2 equal strands. Twist them around each other in one direction (clockwise or counter-clockwise — pick one and be consistent throughout).',
        tip: 'Twist all the way to the tip. The tip should be tight enough to hold without unravelling. Do not overdo gel — less is more.',
        duration: '2-3 minutes per twist',
      },
      {
        step: 5,
        title: 'Repeat across entire head',
        instruction: 'Repeat steps 3-4 for every section until all hair is twisted.',
        tip: 'Expect this to take 2-4 hours. Put on a podcast or movie. Consistency in section size matters more than speed.',
        duration: '2-4 hours total',
      },
      {
        step: 6,
        title: 'Dry and set',
        instruction: 'Allow to air dry completely (preferred) or sit under a hooded dryer on low heat. Do NOT disturb the twists while damp.',
        tip: 'Drying under the dryer can help set the pattern faster. Air-drying takes longer but is gentler.',
        duration: '60-120 minutes',
      },
      {
        step: 7,
        title: 'Maintain the starter locs',
        instruction: 'For the first 3-6 months: Do not untwist for washing. Wash carefully with a shampoo net over your locs. Re-twist the roots every 4-6 weeks only.',
        tip: 'The "loc journey" begins. Locs will look messy before they look beautiful. Frizz and looseness in the early months is normal — patience is key.',
        duration: 'Ongoing',
      },
    ],
    frequency: 'One-time start, maintain monthly',
    skinTypes: ['type 4A, 4B, 4C hair optimal', 'also works for 3C-4A'],
    warnings: ['Research fully before starting — locs are a long-term commitment', 'Do not over-apply wax or gel — causes buildup', 'Avoid wax-based products (hard to remove)'],
    tags: ['locs', 'dreadlocs', 'two-strand-twist', 'starter-locs', 'black-american', 'natural-hair', 'type4'],
  },
  dark_skin_bold_lip: {
    id: 'dark_skin_bold_lip',
    title: 'Bold Lip for Melanin-Rich Skin',
    community: 'all',
    category: 'lips',
    difficulty: 2,
    timeMinutes: 10,
    description: 'How to apply and choose a bold lip that pops beautifully on deep skin tones. From prep to perfect definition.',
    culturalContext: 'Bold, pigmented lip colours look striking on deep skin. Shade choice and prep make the difference.',
    benefits: ['drama', 'colour payoff', 'longevity'],
    tools: ['lip liner', 'lipstick (matte or satin)', 'lip brush', 'Q-tip', 'concealer'],
    ingredients: [
      { name: 'Lip scrub or toothbrush (for prep)', amount: 'Gently used' },
      { name: 'Lip primer or concealer', amount: 'Thin layer' },
      { name: 'Deep lip liner (matching or slightly darker)', amount: '1 pencil' },
      { name: 'Bold lipstick', amount: '1 bullet or pot' },
    ],
    steps: [
      {
        step: 1,
        title: 'Prep the lips',
        instruction: 'Gently exfoliate lips with a damp toothbrush or sugar scrub for 30 seconds. Pat dry. Apply a thin layer of lip balm, wait 5 minutes, then blot off.',
        tip: 'Do not apply bold lip to chapped lips — it will emphasise the texture. Prep is the most important step.',
        duration: '3 minutes',
      },
      {
        step: 2,
        title: 'Base the lips',
        instruction: 'Apply a thin layer of lip primer or concealer to your lips with a flat brush or fingertip. This neutralises your natural lip tone and extends wear of bold colour.',
        tip: 'For very dark lip pigmentation: layer the primer twice. This step makes a dramatic difference for colour accuracy.',
        duration: '1 minute',
      },
      {
        step: 3,
        title: 'Line the lips',
        instruction: 'Choose a lip liner that matches or is 1 shade darker than your lipstick. Line the outer edge of your natural lip shape, following the cupid\'s bow precisely at the top.',
        tip: 'For deep skin tones: fill in the entire lip with liner — not just the outline. This creates a uniform base and dramatically extends wear.',
        duration: '2 minutes',
      },
      {
        step: 4,
        title: 'Apply the lipstick',
        instruction: 'Apply lipstick with a lip brush for precision, or directly from the bullet, working from centre outward. Press lips together to distribute.',
        tip: 'For matte formulas: dab on rather than sweep to prevent tugging. Use a brush for sharper edges.',
        duration: '1 minute',
      },
      {
        step: 5,
        title: 'Clean and define edges',
        instruction: 'Dip a Q-tip in concealer and clean the edges of the lip line for a crisp, defined border.',
        tip: 'This concealer cleanup is what separates professional-looking application from amateur. Always do this.',
        duration: '2 minutes',
      },
      {
        step: 6,
        title: 'Blot and reapply',
        instruction: 'For longevity: blot with a tissue, then apply a second layer of lipstick. This creates a stain base for all-day wear.',
        tip: 'For gloss over matte: apply matte first, blot, then dab gloss in the centre only for a pouty effect.',
        duration: '1 minute',
      },
    ],
    frequency: 'Per use',
    skinTypes: ['all'],
    warnings: ['Very pale or grey-based nudes can look ashy on deep skin; deep berries, plums and true reds do not'],
    tags: ['bold-lip', 'deep-skin', 'melanin', 'red-lip', 'lip-application', 'technique'],
  },
  south_asian_brow: {
    id: 'south_asian_brow',
    title: 'South Asian Bold Brow',
    community: 'south-asian',
    category: 'brows',
    difficulty: 2,
    timeMinutes: 10,
    culturalContext: 'Full, defined brows are a popular look in South Asia, and threading is the traditional way to shape them.',
    benefits: ['frame the face', 'defined arch', 'filled and full'],
    tools: ['brow pencil or pomade', 'angled brow brush', 'spoolie', 'setting gel'],
    ingredients: [
      { name: 'Brow pencil (shade matching hair)', amount: '1' },
      { name: 'Brow pomade or powder (optional)', amount: 'For extra definition' },
      { name: 'Clear or tinted brow gel', amount: '1' },
    ],
    steps: [
      {
        step: 1,
        title: 'Brush up and assess',
        instruction: 'Comb brow hairs upward with a spoolie to reveal the natural shape and identify any sparse areas.',
        tip: 'Natural brow direction is usually upward from the inner corner, then downward toward the tail. Work with this direction.',
        duration: '1 minute',
      },
      {
        step: 2,
        title: 'Define the bottom edge',
        instruction: 'Using an angled brow brush with pomade or a brow pencil, draw a clean line along the bottom edge of the brow — following the natural shape from arch to tail.',
        tip: 'The bottom edge is the most visible line and creates the "defined" look. A crisp bottom edge makes all the difference.',
        duration: '2 minutes',
      },
      {
        step: 3,
        title: 'Fill sparse areas',
        instruction: 'Using light feathery strokes with a brow pencil, fill in any gaps. For the body of the brow, use slightly lighter strokes. Brow head (inner third) should always be the lightest.',
        tip: 'The biggest brow mistake is making the head (inner corner) too dark. Always keep it 1-2 shades lighter.',
        duration: '3 minutes',
      },
      {
        step: 4,
        title: 'Define the arch',
        instruction: 'The arch should peak above the outer edge of the iris (looking straight ahead). Use a slightly darker shade or more pressure at the arch peak to define it.',
        tip: 'If your arch is already defined, you may only need to tidy the area just below it with threading.',
        duration: '1 minute',
      },
      {
        step: 5,
        title: 'Blend and soften',
        instruction: 'Use the spoolie to blend all product into the hair with quick brushing motions. This softens harsh lines.',
        tip: 'The spoolie blend is what makes brows look real. Never skip it.',
        duration: '1 minute',
      },
      {
        step: 6,
        title: 'Set with gel',
        instruction: 'Apply clear brow gel over finished brows in the direction of hair growth. This sets shape all day.',
        tip: 'Soap brow: wet a spoolie, swipe on a bar of soap, brush upward for fluffy laminated effect.',
        duration: '1 minute',
      },
    ],
    frequency: 'Daily',
    skinTypes: ['all'],
    warnings: ['Avoid threading directly before events — skin can be red/irritated'],
    tags: ['brows', 'south-asian', 'defined-brow', 'bold-brow', 'arch', 'filling'],
  },
  foundation_deep_skin: {
    id: 'foundation_deep_skin',
    title: 'Foundation for Deep Skin Tones',
    community: 'all',
    category: 'base',
    difficulty: 2,
    timeMinutes: 15,
    description: 'How to apply foundation for Fitzpatrick V-VI for a flawless, skin-like finish that celebrates deep skin.',
    culturalContext: 'Finding the right foundation for deep skin tones has historically been a challenge the beauty industry failed at for decades. This tutorial addresses what works for melanin-rich skin specifically.',
    benefits: ['even skin tone', 'melanin-flattering finish', 'long wear'],
    tools: ['beauty blender (damp)', 'foundation brush', 'setting powder', 'concealer'],
    ingredients: [
      { name: 'Skin prep moisturiser + SPF', amount: '1 pump' },
      { name: 'Primer', amount: '1 pump (silicone or water-based to match foundation)' },
      { name: 'Foundation (correct shade for deep skin)', amount: '1-2 pumps' },
      { name: 'Concealer (1 shade lighter)', amount: 'To brighten under eyes' },
      { name: 'Setting powder (peach or orange-toned, deep enough for your skin, or translucent)', amount: 'For baking' },
    ],
    steps: [
      {
        step: 1,
        title: 'Shade selection for deep skin',
        instruction: 'Choose a foundation with a warm, golden, or neutral undertone (never grey or ashy). Test on your jawline — not wrist. Deep skin with cool undertones should look for red-warm bases, not pink.',
        tip: 'The most common mistake for Fitzpatrick V-VI is a shade that is too light: ashiness usually comes from going lighter than your skin. Match exactly.',
        duration: '(shopping step)',
      },
      {
        step: 2,
        title: 'Prep skin',
        instruction: 'Moisturise and let absorb for 5 minutes. Apply SPF, wait 2 minutes. Apply primer, wait 1 minute.',
        tip: 'Hydrated skin is the most important thing for a good base. Foundation on dry skin = cakey.',
        duration: '8 minutes',
      },
      {
        step: 3,
        title: 'Apply foundation',
        instruction: 'Pump 1-2 drops into palm. Using a damp beauty blender, dab (not swipe) foundation starting from the centre of the face (nose, undereyes) and blend outward.',
        tip: 'Dampening the beauty blender is critical — squeeze out excess water, then bounce on foundation. A dry sponge absorbs too much product.',
        duration: '3 minutes',
      },
      {
        step: 4,
        title: 'Build where needed',
        instruction: 'If coverage is insufficient in areas (hyperpigmentation, acne marks), apply a second thin layer to those areas only — not the whole face.',
        tip: 'For deep skin tones with texture: press foundation in rather than sweeping. This gives coverage without emphasising texture.',
        duration: '2 minutes',
      },
      {
        step: 5,
        title: 'Concealer and baking under eyes',
        instruction: 'Apply concealer 1-2 shades lighter under the eyes in a triangle shape. Blend the edges. Dust a peach or orange-toned setting powder, deep enough for your skin, over the concealer and leave it (baking) for 5-10 minutes.',
        tip: 'Baking sets the base and brightens the under-eye area. On deep skin, a pale banana powder can look ashy; a peach or orange-toned one deep enough for your skin does not.',
        duration: '12 minutes',
      },
      {
        step: 6,
        title: 'Dust off baked powder',
        instruction: 'After baking, brush away the excess powder with a large fluffy brush. The area should look bright, smooth, and set.',
        tip: 'Do not over-powder the rest of the face — deep skin glows beautifully. Powder only the T-zone and under-eye bake.',
        duration: '1 minute',
      },
    ],
    frequency: 'Per use',
    skinTypes: ['Fitzpatrick V-VI'],
    warnings: ['Avoid shades with obvious grey or pink undertones for Fitzpatrick V-VI', 'Always test shade on jawline not wrist'],
    tags: ['foundation', 'deep-skin', 'fitzpatrick-V', 'fitzpatrick-VI', 'baking', 'base', 'concealer'],
  },
  mehndi_basic_tutorial: {
    id: 'mehndi_basic_tutorial',
    title: 'Basic Mehndi (Henna) Application',
    community: 'south-asian',
    category: 'bodyart',
    difficulty: 3,
    timeMinutes: 60,
    description: 'Introduction to applying henna mehndi for beginners — basic floral patterns and fill techniques.',
    culturalContext: 'Mehndi is applied at many major South Asian life events: weddings, Eid, Diwali, Teej and Karwa Chauth. The art is passed down through generations of women.',
    benefits: ['cultural connection', 'body art', 'celebratory beauty'],
    tools: ['henna cone', 'paper towel', 'eucalyptus oil', 'lemon juice', 'cotton ball'],
    ingredients: [
      { name: 'Ready-made henna cone', amount: '1' },
      { name: 'Lemon juice + sugar mixture (aftercare)', amount: '1 tablespoon each mixed' },
      { name: 'Eucalyptus oil (for the final seal; patch-test first)', amount: 'A few drops' },
    ],
    steps: [
      {
        step: 1,
        title: 'Prepare the hand',
        instruction: 'Wash hands thoroughly. Do not apply lotion or moisturiser — oils prevent henna from staining. Hands should be clean and dry.',
        tip: 'Exfoliate hands the night before for deeper stain.',
        duration: '5 minutes',
      },
      {
        step: 2,
        title: 'Warm and test the cone',
        instruction: 'Warm the henna cone between palms for 2 minutes. Test flow on a paper towel — the henna should flow smoothly but not be too watery.',
        tip: 'If henna is too thick, knead the cone gently. If too thin, cone may be old.',
        duration: '3 minutes',
      },
      {
        step: 3,
        title: 'Start with the outline',
        instruction: 'Begin at the wrist. Draw a basic floral outline using light pressure on the cone. Move your hand (not the cone) to control lines. Start with large shapes before adding detail.',
        tip: 'Hold cone like a pen. Press lightly for thin lines. Practice on paper first.',
        duration: '10 minutes',
      },
      {
        step: 4,
        title: 'Fill in the design',
        instruction: 'Fill larger shapes with henna by moving in overlapping lines. For small circles or dots, hold cone over spot and apply gentle pressure.',
        tip: 'Mehndi depth comes from the thickness of the paste — the more paste you apply, the deeper the stain.',
        duration: '15 minutes',
      },
      {
        step: 5,
        title: 'Leave to dry',
        instruction: 'Leave henna on for 4-8 hours (overnight is best). Do NOT let it crack and fall before the full time.',
        tip: 'Dab the lemon-sugar mix on to keep the paste moist and stuck to the skin, which helps it stain.',
        duration: '4-8 hours',
      },
      {
        step: 6,
        title: 'Remove the paste',
        instruction: 'Scrape off (do not wash off) dried henna paste with a knife edge or card. The stain beneath will be orange initially.',
        tip: 'Keep the stain away from water for as long as you can after removal; it darkens as it oxidises.',
        duration: '5 minutes',
      },
      {
        step: 7,
        title: 'Oil and protect',
        instruction: 'Apply a few drops of eucalyptus oil and rub in. The stain will deepen from orange to red-brown over 24-48 hours.',
        tip: 'Keep your hands warm and dry; warmth helps the colour deepen.',
        duration: '2 minutes',
      },
    ],
    frequency: 'Per occasion',
    skinTypes: ['all'],
    warnings: ['Avoid "black henna" — contains PPD which causes chemical burns', 'Use 100% natural henna only', 'Test for allergy on a small area first'],
    tags: ['mehndi', 'henna', 'south-asian', 'body-art', 'beginner', 'diy', 'bridal'],
  },
};

export function getTutorial(id) {
  return TUTORIALS[id] || null;
}

export function getTutorialsForCommunity(communityId) {
  return Object.values(TUTORIALS).filter(t =>
    t.community === communityId || t.community === 'all'
  );
}

export function getTutorialsByCategory(category) {
  return Object.values(TUTORIALS).filter(t => t.category === category);
}

export function getTutorialsByDifficulty(maxDifficulty) {
  return Object.values(TUTORIALS).filter(t => t.difficulty <= maxDifficulty);
}

export function getBeginnerTutorials() {
  return Object.values(TUTORIALS).filter(t => t.difficulty <= 2);
}

export function getQuickTutorials() {
  return Object.values(TUTORIALS).filter(t => t.timeMinutes <= 20);
}

export function getTraditionalTutorials() {
  const traditionalIds = ['ubtan_face_mask', 'black_soap_ritual', 'champi_hair_massage', 'mehndi_basic_tutorial', 'kohl_eye_tutorial'];
  return traditionalIds.map(id => TUTORIALS[id]).filter(Boolean);
}

export function getTutorialStepCount(id) {
  return TUTORIALS[id]?.steps?.length || 0;
}

export function getTutorialSteps(id) {
  return TUTORIALS[id]?.steps || [];
}

export function searchTutorialsByTag(tag) {
  const norm = tag.toLowerCase();
  return Object.values(TUTORIALS).filter(t =>
    (t.tags || []).some(tag => tag.includes(norm) || norm.includes(tag))
  );
}
