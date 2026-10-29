/**
 * MIRRR Style Match Engine
 * User picks an inspiration look → gets exact product breakdown to recreate it
 * Eyeshadow colours, foundation shade, liner, lip, contour — step by step
 */

// ─── INSPIRATION LOOKS CATALOGUE ────────────────────────────────────────────

export const INSPIRATION_LOOKS = {

  desi_baddie: {
    id: 'desi_baddie',
    name: 'Desi Baddie',
    community: 'south-asian',
    description: 'Smoky kohl eyes, glossy nude-brown lip, glass skin glow',
    image: '/look-desi-baddie.png',
    vibe: ['bold', 'sultry', 'editorial', 'glam'],
    occasion: ['night-out', 'wedding-guest', 'photoshoot'],
    fitzpatrickRange: ['III', 'IV', 'V'],
    undertone: ['warm', 'neutral'],
    tags: ['kohl', 'smoky-eye', 'glass-skin', 'nude-lip', 'south-asian'],
    steps: [
      {
        order: 1,
        zone: 'skin',
        stepName: 'Glass Skin Base',
        technique: 'Press foundation into skin with a damp beauty sponge. Do not drag — press and bounce for a skin-like finish. Apply only where needed.',
        products: {
          fitzpatrick_III: {
            foundation: { name: 'Fenty Beauty Pro Filt\'r Soft Matte', shade: '230W', finish: 'soft matte', tip: 'Mix with a drop of Fenty Gloss Bomb for glass effect' },
            concealer: { name: 'NARS Radiant Creamy Concealer', shade: 'Syracuse', tip: 'Bake under eyes 5 min with translucent powder' },
            powder: { name: 'Laura Mercier Translucent Loose Powder', shade: 'Translucent', tip: 'Set T-zone only' },
          },
          fitzpatrick_IV: {
            foundation: { name: 'Fenty Beauty Pro Filt\'r Soft Matte', shade: '350W', finish: 'soft matte', tip: 'Mix with a drop of Fenty Gloss Bomb for glass effect' },
            concealer: { name: 'NARS Radiant Creamy Concealer', shade: 'Custard', tip: 'Bake under eyes 5 min with translucent powder' },
            powder: { name: 'Laura Mercier Translucent Loose Powder', shade: 'Translucent Medium Deep', tip: 'Set T-zone only' },
          },
          fitzpatrick_V: {
            foundation: { name: 'Fenty Beauty Pro Filt\'r Soft Matte', shade: '420W', finish: 'soft matte', tip: 'Mix with a drop of Fenty Gloss Bomb for glass effect' },
            concealer: { name: 'NARS Radiant Creamy Concealer', shade: 'Amande', tip: 'One shade lighter than skin to brighten' },
            powder: { name: 'Black Radiance True Complexion Loose Setting Powder', shade: 'Warm Caramel', tip: 'Avoid flashback — no white powders' },
          },
        },
      },
      {
        order: 2,
        zone: 'contour',
        stepName: 'Chiselled Structure',
        technique: 'Use a small fluffy brush. Apply contour in a "3" shape on each side of face: temples, hollows of cheeks, jawline. Blend upward.',
        products: {
          fitzpatrick_III: {
            contour: { name: 'NYX Sculpt & Highlight Face Duo', shade: 'Taupe/Ivory', tip: 'Soft definition — not heavy' },
            highlight: { name: 'Fenty Beauty Killawatt Highlighter', shade: 'Lightning Dust', tip: 'Glassy highlight on centre of nose, cupid\'s bow' },
          },
          fitzpatrick_IV: {
            contour: { name: 'Anastasia Beverly Hills Contour Kit', shade: 'Tan/Caramel', tip: 'Blend well — no harsh lines' },
            highlight: { name: 'Pat McGrath Labs Skin Fetish Highlighter', shade: 'Gold 001', tip: 'High cheekbones and inner corners' },
          },
          fitzpatrick_V: {
            contour: { name: 'Juvia\'s Place The Warrior Palette (deep shades)', shade: 'Deep Espresso', tip: 'Use as contour — already warm-toned' },
            highlight: { name: 'Fenty Beauty Killawatt Highlighter', shade: 'Hu$tla Baby', tip: 'Intense gold glow on cheekbones' },
          },
        },
      },
      {
        order: 3,
        zone: 'eyes',
        stepName: 'Kohl Smoky Eye',
        technique: 'Prime lids first. Pack dark shadow on lid, blend a transition shade into crease. Line waterline and lash line with kohl pencil. Smudge lower lash line. This look lives on the blend — spend 70% of time blending.',
        products: {
          all_tones: {
            eyePrimer: { name: 'Urban Decay Eyeshadow Primer Potion', shade: 'Original', tip: 'Essential — makes kohl last all night' },
            lidShade: { name: 'MAC Eyeshadow', shade: 'Carbon (matte black)', tip: 'Pack wet with a flat brush for maximum intensity' },
            crease: { name: 'MAC Eyeshadow', shade: 'Mulch (warm brown)', tip: 'Diffuse around lid into crease in circular motions' },
            innerCorner: { name: 'MAC Eyeshadow', shade: 'Brule (champagne)', tip: 'Pop on inner corner for depth-and-light contrast' },
            liner: { name: 'L\'Oréal Paris Le Khol', shade: '101 Midnight Black', tip: 'Line waterline AND tight-line upper lash. This is the signature Desi step.' },
            lowerLashSmudge: { name: 'MAC Eyeshadow', shade: 'Carbon', tip: 'Use small pencil brush to smudge under lower lash only — keep it loose' },
            mascara: { name: 'L\'Oréal Paris Voluminous Lash Paradise', shade: 'Blackest Black', tip: 'Two coats top, one coat bottom. Let dry between.' },
            lashes: { name: 'Ardell Wispies 113', tip: 'Optional but recommended — glue 3/4 from outer corner only' },
          },
        },
      },
      {
        order: 4,
        zone: 'brows',
        stepName: 'Bold Defined Brows',
        technique: 'South Asian brows are naturally full. Define and darken with pencil using short hair-strokes. Do not overarch — keep the natural shape.',
        products: {
          all_tones: {
            pencil: { name: 'Anastasia Beverly Hills Brow Wiz', shade: 'Dark Brown or Ebony', tip: 'Use light strokes. Fill gaps only, don\'t redraw entire brow.' },
            gel: { name: 'Glossier Boy Brow', shade: 'Brown or Black', tip: 'Brush up and set with this for fluffy finish' },
          },
        },
      },
      {
        order: 5,
        zone: 'lips',
        stepName: 'Glossy Nude-Brown Lip',
        technique: 'Line with a brown-nude liner slightly outside lip line to add fullness. Fill in with liner. Apply lipstick, then gloss on centre only.',
        products: {
          fitzpatrick_III: {
            liner: { name: 'MAC Lip Pencil', shade: 'Spice', tip: 'Overline slightly for fullness' },
            lipstick: { name: 'MAC Lipstick', shade: 'Velvet Teddy', tip: 'Classic warm nude for medium South Asian tones' },
            gloss: { name: 'Fenty Beauty Gloss Bomb', shade: 'Fenty Glow', tip: 'Centre of lips only for volume effect' },
          },
          fitzpatrick_IV: {
            liner: { name: 'MAC Lip Pencil', shade: 'Chestnut', tip: 'Overline slightly, blend inward' },
            lipstick: { name: 'MAC Lipstick', shade: 'Kinda Sexy', tip: 'Warm mauve-brown for deeper medium tones' },
            gloss: { name: 'Fenty Beauty Gloss Bomb', shade: 'Fu$$y', tip: 'Centre of lips for 3D look' },
          },
          fitzpatrick_V: {
            liner: { name: 'MAC Lip Pencil', shade: 'Currant', tip: 'Deep berry liner — contrast makes nude lipstick pop on deep skin' },
            lipstick: { name: 'MAC Lipstick', shade: 'Marrakesh', tip: 'Deep warm brown — stunning on dark skin' },
            gloss: { name: 'NARS Afterglow Lip Shine', shade: 'Orgasm', tip: 'Golden gloss on deep skin = next level' },
          },
        },
      },
    ],
    shoppingList: {
      totalEstimate: { low: 85, high: 220, currency: 'CAD' },
      budgetSwaps: [
        { expensive: 'MAC Carbon Eyeshadow ($25)', budget: 'e.l.f. No Budge Shadow Stick in Black ($10)', saving: 15 },
        { expensive: 'Anastasia Brow Wiz ($29)', budget: 'NYX Micro Brow Pencil ($12)', saving: 17 },
        { expensive: 'Fenty Gloss Bomb ($28)', budget: 'NYX Butter Gloss in Tiramisu ($12)', saving: 16 },
      ],
    },
    proTips: [
      'The kohl waterline is non-negotiable for the authentic Desi Baddie look — it makes eyes appear more almond-shaped',
      'Set your base with a light mist of setting spray (MAC Fix+) before applying eyeshadow to stop fallout ruining your skin',
      'Clean up eyeshadow fallout with your sponge AFTER completing the eye look, not during',
      'For photos: increase highlighter by 20% — cameras eat light',
    ],
  },

  persian_queen: {
    id: 'persian_queen',
    name: 'Persian Queen',
    community: 'arab',
    description: 'Thick winged liner, jewel-tone lid, bold brows, berry lip',
    image: '/look-persian-queen.png',
    vibe: ['regal', 'dramatic', 'jewel-toned', 'editorial'],
    occasion: ['evening', 'celebration', 'photoshoot', 'eid'],
    fitzpatrickRange: ['II', 'III', 'IV'],
    undertone: ['warm', 'olive'],
    tags: ['winged-liner', 'jewel-tone', 'bold-brow', 'berry-lip', 'arab'],
    steps: [
      {
        order: 1,
        zone: 'skin',
        stepName: 'Flawless Matte Olive Base',
        technique: 'Persian/Arab skin often has olive or yellow undertones. Avoid pinkish foundations — they grey out the skin. Build coverage only where needed; leave natural skin texture showing.',
        products: {
          fitzpatrick_II: {
            foundation: { name: 'Giorgio Armani Luminous Silk', shade: '3.5 (golden beige)', tip: 'Warm golden base neutralises any redness' },
            concealer: { name: 'Charlotte Tilbury Magic Away Concealer', shade: '3 Fair', tip: 'Triangle under eye, blend upward' },
            powder: { name: 'Huda Beauty Easy Bake Loose Powder', shade: 'Banana', tip: 'Banana powder warms and sets — no grey flashback' },
          },
          fitzpatrick_III: {
            foundation: { name: 'Giorgio Armani Luminous Silk', shade: '5 (medium beige)', tip: 'The olive formula — works on Persian/Mediterranean tones perfectly' },
            concealer: { name: 'Charlotte Tilbury Magic Away Concealer', shade: '5 Medium', tip: 'Same shade as skin or one lighter' },
            powder: { name: 'Huda Beauty Easy Bake Loose Powder', shade: 'Honey', tip: 'Warm-toned set keeps olive skin golden' },
          },
          fitzpatrick_IV: {
            foundation: { name: 'NARS Sheer Glow Foundation', shade: 'Syracuse', tip: 'Buildable coverage with natural finish — not cakey' },
            concealer: { name: 'NARS Radiant Creamy Concealer', shade: 'Custard', tip: 'Warm yellow undertone neutralises under-eye darkness' },
            powder: { name: 'Charlotte Tilbury Airbrush Flawless Finish Powder', shade: 'Medium', tip: 'Fine-milled, photography-ready' },
          },
        },
      },
      {
        order: 2,
        zone: 'eyes',
        stepName: 'Jewel-Tone Lid + Thick Wing',
        technique: 'This is a LID-focused look. Emerald, sapphire or amethyst on the lid, blended softly into crease. Then a thick, dramatic winged liner is drawn on top — the wing extends far out and slightly upward. Persian queens do not do thin wings.',
        products: {
          all_tones: {
            eyePrimer: { name: 'Too Faced Shadow Insurance', shade: 'Original', tip: 'Heavy cream primer — makes jewel tones pop' },
            lidShade: {
              option_a: { name: 'Urban Decay Eyeshadow (Vice Palette)', shade: 'Woodstock (purple)', tip: 'Deep amethyst for dramatic jewel lid' },
              option_b: { name: 'Pat McGrath Mothership Palette', shade: 'Emerald Envy', tip: 'Most editorial option — worth the price' },
              option_c: { name: 'NYX Ultimate Shadow Palette', shade: 'Deep blue/emerald', tip: 'Budget pick — surprisingly pigmented' },
            },
            crease: { name: 'MAC Eyeshadow', shade: 'Woodwinked (warm gold-brown)', tip: 'Blend above jewel lid to warm and soften edge' },
            liner: { name: 'Kat Von D Tattoo Liner', shade: 'Trooper (black)', tip: 'Draw liner before eyeshadow fallout lands on lid. Wing should extend 1–1.5cm past outer corner.' },
            linerTip: 'Rest your elbow on a flat surface. Use SHORT strokes building the wing — not one long swipe.',
            mascara: { name: 'Benefit BADgal BANG Mascara', shade: 'Black', tip: '3 coats upper, 1 coat lower' },
          },
        },
      },
      {
        order: 3,
        zone: 'brows',
        stepName: 'Statement Brows',
        technique: 'Persian brows are naturally thick and dark. Fill, define, and square the front of the brow slightly for power. Use a clear gel to comb up and set.',
        products: {
          all_tones: {
            pencil: { name: 'Anastasia Beverly Hills Brow Definer', shade: 'Dark Brown or Ebony', tip: 'Square the front — not arched. Power brow, not surprised brow.' },
            pomade: { name: 'Anastasia Beverly Hills Dipbrow Pomade', shade: 'Dark Brown', tip: 'Fill body of brow with pomade using angled brush for density' },
            gel: { name: 'Boy Brow by Glossier', shade: 'Black', tip: 'Brush up and outward — fluffy but groomed' },
          },
        },
      },
      {
        order: 4,
        zone: 'contour',
        stepName: 'Structured Bronze',
        technique: 'Contour temples and hollows lightly — this look is about eyes and lips, not contouring. Bronze forehead and perimeter of face to warm. Glow on cheekbones.',
        products: {
          all_tones: {
            bronze: { name: 'Charlotte Tilbury Filmstar Bronze & Glow', shade: 'Fair/Medium or Medium/Deep', tip: 'The iconic duo — contour and highlight in one palette' },
            blush: { name: 'NARS Blush', shade: 'Orgasm', tip: 'Golden-peach blush on apples of cheeks — keeps look warm not harsh' },
          },
        },
      },
      {
        order: 5,
        zone: 'lips',
        stepName: 'Rich Berry Lip',
        technique: 'Line lips fully — fill in with liner for staying power. The colour should be rich, not muted. Berry, wine, deep rose. Centre gloss optional.',
        products: {
          fitzpatrick_II: {
            liner: { name: 'Charlotte Tilbury Lip Cheat Liner', shade: 'Pillow Talk Medium', tip: 'Define and slightly overline for Persian fullness' },
            lipstick: { name: 'Charlotte Tilbury Matte Revolution', shade: 'Glastonberry', tip: 'Berry with pink undertone — ethereal on fair-medium skin' },
          },
          fitzpatrick_III: {
            liner: { name: 'MAC Lip Pencil', shade: 'Currant', tip: 'Dark liner, lighter centre creates depth' },
            lipstick: { name: 'MAC Lipstick', shade: 'Rebel (berry-plum)', tip: 'THE Persian Queen lip shade — iconic' },
            gloss: { name: 'Fenty Beauty Gloss Bomb', shade: 'Hot Chocolit Fantasy', tip: 'Optional topper for evening dimension' },
          },
          fitzpatrick_IV: {
            liner: { name: 'MAC Lip Pencil', shade: 'Vino', tip: 'Deep wine liner anchors the look' },
            lipstick: { name: 'Huda Beauty Power Bullet', shade: 'Starstruck (deep berry)', tip: 'Long-wear — this stays through the whole gala' },
          },
        },
      },
    ],
    shoppingList: {
      totalEstimate: { low: 110, high: 300, currency: 'CAD' },
      budgetSwaps: [
        { expensive: 'Pat McGrath Mothership Palette ($95)', budget: 'NYX Ultimate Shadow Palette ($30)', saving: 65 },
        { expensive: 'Charlotte Tilbury Filmstar Bronze ($75)', budget: 'e.l.f. Bronzer Palette ($18)', saving: 57 },
        { expensive: 'Kat Von D Tattoo Liner ($32)', budget: 'e.l.f. H2O Proof Eyeliner Pen ($12)', saving: 20 },
      ],
    },
    proTips: [
      'Apply your jewel eyeshadow BEFORE liner — otherwise you\'ll smudge your wing with fallout',
      'The wing is the centrepiece — practice on the back of your hand first, get both sides matching',
      'Berry lip + warm bronzer = the Persian Queen balance. Don\'t skip the bronzer or it reads too harsh.',
      'Set your whole face with a rosewater mist at the end for a dewy-over-matte hybrid finish',
    ],
  },

  west_african_glow: {
    id: 'west_african_glow',
    name: 'West African Glow',
    community: 'west-african',
    description: 'Luminous glass skin, bold orange-coral lip, natural glossy eye',
    image: '/look-west-african-skin.png',
    vibe: ['glowing', 'joyful', 'radiant', 'natural-glam'],
    occasion: ['daytime', 'brunch', 'owambe', 'celebration'],
    fitzpatrickRange: ['V', 'VI'],
    undertone: ['warm', 'deep-warm'],
    tags: ['glass-skin', 'coral-lip', 'glow', 'west-african', 'melanin'],
    steps: [
      {
        order: 1,
        zone: 'skin',
        stepName: 'Deep Skin Glass Base',
        technique: 'Deep skin needs glow, not powder. Use a skin-tint or serum foundation, add luminous drops, and apply with hands for the most skin-like finish. Spot-conceal only.',
        products: {
          fitzpatrick_V: {
            foundation: { name: 'Black Opal True Color Pore Perfecting Foundation', shade: 'Hazelnut', tip: 'Made specifically for melanin skin — incredible warm-tone match' },
            luminousDrops: { name: 'MAC Strobe Cream', shade: 'Goldlite', tip: 'Mix 2 drops into foundation or apply to cheekbones before foundation' },
            concealer: { name: 'NARS Radiant Creamy Concealer', shade: 'Amande', tip: 'Under eyes and any spot cover only — let skin breathe' },
          },
          fitzpatrick_VI: {
            foundation: { name: 'Fenty Beauty Pro Filt\'r Hydrating Foundation', shade: '498 (deep cool)', tip: 'One of the only foundations that truly works on deepest skin without looking ashy' },
            luminousDrops: { name: 'Fenty Beauty Body Lava (face only, tiny amount)', shade: 'Who Needs Clothes', tip: 'Mix into foundation or press onto high points after setting' },
            concealer: { name: 'Fenty Beauty Pro Filt\'r Concealer', shade: '498', tip: 'Do not go lighter — match exactly or one shade lighter max' },
          },
        },
      },
      {
        order: 2,
        zone: 'eyes',
        stepName: 'Glossy Natural Eye',
        technique: 'This look keeps eyes natural but luminous. Champagne or gold shadow, mascara, and a gloss applied over lid for high-shine editorial effect.',
        products: {
          all_tones: {
            eyePrimer: { name: 'e.l.f. Lid Lock Up Eyeshadow Primer', shade: 'Nude', tip: 'Light hold primer — gloss needs something to grip' },
            lidShade: { name: 'Juvia\'s Place The Nubian Palette', shade: 'Champagne or Gold lid shade', tip: 'This brand was made FOR deep skin — the payoff is unmatched' },
            lidGloss: { name: 'Fenty Beauty Gloss Bomb Eye', shade: 'Gold Geeked', tip: 'Apply on top of shadow with fingertip for the glass eye trend' },
            liner: { name: 'Coloured Raine Queen Collection Pencil', shade: 'Deep Brown', tip: 'Soft brown liner on waterline — softer than black for daytime' },
            mascara: { name: 'Maybelline Sky High Mascara', shade: 'Brownish Black', tip: 'Length mascara, not volume — keeps look fresh and modern' },
          },
        },
      },
      {
        order: 3,
        zone: 'brows',
        stepName: 'Natural Full Brows',
        technique: 'West African brows are naturally full and beautiful. Clear gel up, define any sparse spots with pencil in matching shade, done.',
        products: {
          all_tones: {
            pencil: { name: 'Anastasia Beverly Hills Brow Wiz', shade: 'Ebony', tip: 'One shade lighter than darkest brow hairs for natural finish' },
            gel: { name: 'e.l.f. Brow Gel', shade: 'Clear', tip: 'Brush straight up and set — eyebrow lamination effect at home' },
          },
        },
      },
      {
        order: 4,
        zone: 'glow',
        stepName: 'African Goddess Glow',
        technique: 'This is the signature step. Deep skin glows differently — warm gold tones on cheekbones, nose bridge, temples. Layer powder highlight over cream for dimension.',
        products: {
          fitzpatrick_V: {
            creamHighlight: { name: 'Fenty Beauty Match Stix Shimmer Skinstick', shade: 'Sinamon', tip: 'Press onto cheekbones and blend with ring finger' },
            powderHighlight: { name: 'Juvia\'s Place I Am Magic Highlighter', shade: 'Golden Goddess', tip: 'Pack on top of cream with a fan brush' },
            blush: { name: 'Coloured Raine Gem Status Pressed Blush', shade: 'Sunrise (coral)', tip: 'Warm coral blush adds dimension to deep skin without looking dusty' },
          },
          fitzpatrick_VI: {
            creamHighlight: { name: 'Fenty Beauty Match Stix Shimmer Skinstick', shade: 'Chili Mango', tip: 'Deep warm gold — the most flattering on very deep skin' },
            powderHighlight: { name: 'Pat McGrath Labs Skin Fetish Highlighter', shade: 'Bronze Nectar', tip: 'The deepest luxe highlighter for the deepest skin' },
            blush: { name: 'Black Radiance Perfect Tone Blush', shade: 'Mango Tango', tip: 'One of the only drugstore blushes visible on deep skin' },
          },
        },
      },
      {
        order: 5,
        zone: 'lips',
        stepName: 'Bold Orange-Coral Lip',
        technique: 'Orange and coral are the power shades for deep skin. Line lips fully, fill in with liner, then apply lipstick. No gloss — this lip is opaque and bold.',
        products: {
          fitzpatrick_V: {
            liner: { name: 'MAC Lip Pencil', shade: 'Redd', tip: 'Orange-red liner gives depth to coral' },
            lipstick: { name: 'MAC Lipstick', shade: 'Lady Danger (bright coral-red)', tip: 'ICONIC on brown skin — looks warm and alive, never garish' },
          },
          fitzpatrick_VI: {
            liner: { name: 'MAC Lip Pencil', shade: 'Cork', tip: 'Warm nude-orange liner defines without darkening lip edges' },
            lipstick: { name: 'Juvia\'s Place I Am Magic Lipstick', shade: 'Joy (bright orange)', tip: 'Made for deep skin — vibrant orange that works perfectly' },
          },
        },
      },
    ],
    shoppingList: {
      totalEstimate: { low: 70, high: 190, currency: 'CAD' },
      budgetSwaps: [
        { expensive: 'Pat McGrath Skin Fetish Highlighter ($75)', budget: 'Juvia\'s Place I Am Magic Highlighter ($22)', saving: 53 },
        { expensive: 'Fenty Body Lava ($62)', budget: 'Maybelline Dream Pure BB Cream mixed with highlighter ($18)', saving: 44 },
      ],
    },
    proTips: [
      'NEVER use white or light setting powder on deep skin — it creates flashback in photos and makes skin look ashy',
      'Your natural melanin IS your glow — use skin tints and serums more than heavy foundations',
      'Orange and coral lips are YOUR shades — fair-skin women cannot pull these off the way you can',
      'The gloss eye is the most editorial thing you can do — it photographs beautifully under studio or phone flash',
    ],
  },

  k_beauty_seoul: {
    id: 'k_beauty_seoul',
    name: 'K-Beauty Seoul',
    community: 'east-asian',
    description: 'Dewy glass skin, straight brows, gradient (ombré) lip, puppy-eye liner',
    image: '/look-k-beauty-seoul.png',
    vibe: ['fresh', 'youthful', 'dewy', 'soft-glam', 'cute'],
    occasion: ['everyday', 'daytime', 'brunch', 'casual-date'],
    fitzpatrickRange: ['I', 'II', 'III'],
    undertone: ['cool', 'neutral', 'pink'],
    tags: ['glass-skin', 'gradient-lip', 'puppy-eye', 'dewy', 'k-beauty'],
    steps: [
      {
        order: 1,
        zone: 'skin',
        stepName: 'Extreme Glass Skin',
        technique: 'K-beauty glass skin is about SKINCARE first, makeup second. Start with hydrating toner, sheet mask if possible, moisturiser, then SPF. Use the least amount of foundation possible — mostly let your prepped skin show through.',
        products: {
          all_tones: {
            skinPrep: { name: 'Laneige Water Sleeping Mask', tip: 'Apply night before for next-level dewy base' },
            spf: { name: 'Beauty of Joseon Relief Sun Rice + Probiotics SPF50+', tip: 'Apply as last skincare step — this doubles as a primer for dewy finish' },
            foundation: { name: 'Missha M Perfect Cover BB Cream', shade: 'No.21 (light) or No.23 (natural)', tip: 'Legendary K-beauty BB — apply with fingers and blend inward for skin finish' },
            cushion: { name: 'IOPE Air Cushion Cover', shade: 'Match to skin', tip: 'Tap cushion puff instead of sponge for the authentic K-beauty application' },
            concealer: { name: 'Etude House Act On A Concealer', shade: 'Natural Beige', tip: 'Spot use only under eyes and around nose' },
          },
        },
      },
      {
        order: 2,
        zone: 'eyes',
        stepName: 'Puppy Eye + Gradient Shadow',
        technique: 'K-beauty liner goes DOWNWARD at the outer corner (opposite of a wing) to create an innocent, puppy-eye effect. Add soft shimmer shadow on inner corner and lid centre only.',
        products: {
          all_tones: {
            eyePrimer: { name: 'CLIO Superproof Eye Primer', shade: 'Natural Beige', tip: 'Korean primers are specifically formulated for monolid and hooded eyes' },
            shimmerShadow: { name: 'Romand Better Than Palette Eye Palette', shade: 'Any pink or champagne shade', tip: 'Apply with finger to centre and inner corner of lid only' },
            liner: {
              name: 'Etude House Drawing Show Gel Liner',
              shade: 'Black or Brown',
              tip: 'Draw a thin line upper lash. At outer corner, DRAW DOWNWARD (not up) to elongate eye downward. This is the puppy-eye technique.',
            },
            lowerLiner: { name: 'Holika Holika Jewel-Light Waterproof Eyeliner', shade: 'Brown', tip: 'Draw half-lower lash line from outer corner inward with brown — softens the look' },
            mascara: { name: 'Clio Kill Lash Superproof Mascara', shade: 'Black', tip: 'Define upper lashes only — or use individual lash clusters at outer corner' },
          },
        },
      },
      {
        order: 3,
        zone: 'brows',
        stepName: 'Straight Flat Brows',
        technique: 'K-beauty brows are STRAIGHT, not arched. Draw horizontally across, following the top of your natural brow. This creates a youthful, innocent look. Fill in sparse spots with tiny strokes.',
        products: {
          all_tones: {
            pencil: { name: 'Etude House Drawing Eye Brow Pencil', shade: 'Gray or Dark Gray', tip: 'Gray-brown for a softer look that photographs beautifully' },
            microblading: { name: 'Innisfree Auto Eyebrow Pencil', shade: 'No.5 Brown', tip: 'Very fine micro-tip — draw individual hair strokes to fill gaps' },
            gel: { name: 'Etude House Drawing Show Tinted Brow', shade: 'Clear or Gray', tip: 'Comb straight across to set the flat brow shape' },
          },
        },
      },
      {
        order: 4,
        zone: 'skin_glow',
        stepName: 'Inner Glow Finish',
        technique: 'Skip traditional contour — K-beauty uses a light rosy or peach blush pressed on the nose and cheeks together for a flushed, just-came-in-from-the-cold look.',
        products: {
          all_tones: {
            blush: { name: 'Etude House Lovely Cookie Blusher', shade: 'CR901 Peach Sherbet', tip: 'Apply with fingers — press onto nose bridge, cheeks and blend naturally' },
            highlight: { name: 'Peripera Sugar Glow Cube', shade: 'Champagne', tip: 'Subtle highlight on brow bone and cupid\'s bow only' },
          },
        },
      },
      {
        order: 5,
        zone: 'lips',
        stepName: 'Gradient Ombré Lip',
        technique: 'K-beauty gradient lip starts dark on the centre of lips and fades to nothing at the edges — opposite of Western liner technique. Apply tint/lipstick to just the centre pout, then blend outward with finger.',
        products: {
          all_tones: {
            lipTint: { name: 'Romand Blur Fudge Tint', shade: 'Any rosy-pink, peach or red shade', tip: 'Apply to very centre of lips (just the pout) and tap outward with ring finger. The colour fades from dark to light.' },
            alternative: { name: 'Laneige Lip Sleeping Mask', shade: 'Berry', tip: 'Apply over tint for hydrated-glossy gradient effect. Iconic K-beauty lip.' },
            lipBalm: { name: 'Vaseline Lip Therapy', shade: 'Original', tip: 'Dab in centre after tint sets for glass-lip effect' },
          },
        },
      },
    ],
    shoppingList: {
      totalEstimate: { low: 55, high: 150, currency: 'CAD' },
      budgetSwaps: [
        { expensive: 'IOPE Air Cushion ($60)', budget: 'Maybelline Dream BB Cushion ($20)', saving: 40 },
        { expensive: 'Romand Blur Fudge Tint ($24)', budget: 'Etude House Fixing Tint ($15)', saving: 9 },
      ],
      whereToBuy: ['Amazon.ca (K-beauty ships fast)', 'Innisfree.com', 'YesStyle.com', 'Olive Young global (best selection)'],
    },
    proTips: [
      'The straight brow changes your whole face — it makes you look younger and more approachable. Practice before committing.',
      'Puppy eye liner goes DOWN at outer corner, not up. If you draw a wing, this becomes a different look entirely.',
      'Gradient lip is all about tapping with your ring finger — your weakest finger applies the least pressure = best fade.',
      'K-beauty glass skin starts the night before: sleeping mask, hydrating essence, lots of water.',
    ],
  },

  hammam_goddess: {
    id: 'hammam_goddess',
    name: 'Hammam Goddess',
    community: 'arab',
    description: 'Luminous bronze skin, gold kohl, terracotta lip, no-makeup-makeup',
    image: '/look-hammam-glow.png',
    vibe: ['ethereal', 'golden', 'natural', 'mediterranean', 'effortless'],
    occasion: ['beach', 'daytime', 'travel', 'summer', 'casual-glam'],
    fitzpatrickRange: ['III', 'IV', 'V'],
    undertone: ['warm', 'olive', 'deep-warm'],
    tags: ['bronze', 'gold-kohl', 'terracotta', 'hammam', 'arab', 'natural'],
    steps: [
      {
        order: 1,
        zone: 'skin',
        stepName: 'Sun-Kissed Bronze Base',
        technique: 'Mix your foundation two shades darker than usual (or use a bronzing tinted moisturiser) to mimic a natural sun-kissed look. The base is the statement here — barely-there makeup over gorgeous glowing skin.',
        products: {
          fitzpatrick_III: {
            foundation: { name: 'NARS Pure Radiant Tinted Moisturizer SPF30', shade: 'Groenland', tip: 'SPF tinted moisturiser — beach-ready from the start' },
            bronzer: { name: 'Benefit Hoola Bronzer', shade: 'Hoola Light', tip: 'Dust across forehead, nose, cheeks, chin — where sun naturally hits' },
          },
          fitzpatrick_IV: {
            foundation: { name: 'Charlotte Tilbury Flawless Filter', shade: '4', tip: 'Luminous filter — looks like skin, but better' },
            bronzer: { name: 'Charlotte Tilbury Hollywood Contour Wand', shade: 'Medium', tip: 'Cream bronzer blends seamlessly on olive skin' },
          },
          fitzpatrick_V: {
            foundation: { name: 'Fenty Beauty Eaze Drop Blurring Skin Tint', shade: '12W', tip: 'Skin tint = most natural finish for deep warm skin' },
            bronzer: { name: 'MAC Bronzing Powder', shade: 'Refined Golden', tip: 'Warm gold bronze — not cool or ashy' },
          },
        },
      },
      {
        order: 2,
        zone: 'eyes',
        stepName: 'Gold Kohl Waterline',
        technique: 'The hammam look uses GOLD kohl (not black) on the waterline. It brightens the eye without looking heavy or harsh. Top lid is bare or has a wash of warm shadow.',
        products: {
          all_tones: {
            goldKohl: { name: 'L\'Oréal Paris Le Khol', shade: '105 Golden Brown or 110 Inca Gold', tip: 'Run along ENTIRE waterline, top and bottom. Gold kohl is the signature of this look.' },
            lidWash: { name: 'MAC Eyeshadow', shade: 'Woodwinked (warm antique gold)', tip: 'Wash over entire lid with a fluffy brush — no blending required, keep it soft' },
            mascara: { name: 'L\'Oréal Paris Bambi Eye Mascara', shade: 'Noir', tip: 'One coat only — length, not volume. This is a natural look.' },
          },
        },
      },
      {
        order: 3,
        zone: 'brows',
        stepName: 'Groomed Natural Brows',
        technique: 'Spoolie brows up and outward. Apply clear brow gel. That\'s it. This look lets the natural brow do the work.',
        products: {
          all_tones: {
            gel: { name: 'e.l.f. Brow Gel', shade: 'Clear', tip: 'Brush outward then upward for the laminated brow look' },
            optional: { name: 'NYX Micro Brow Pencil', shade: 'Espresso', tip: 'Only if you have significant sparse spots — use one or two strokes max' },
          },
        },
      },
      {
        order: 4,
        zone: 'glow',
        stepName: 'Liquid Gold Highlight',
        technique: 'A hammam just bathed your skin in gold light. On cheekbones, nose bridge, and collarbones (if bare) apply a warm liquid or cream gold highlight.',
        products: {
          all_tones: {
            liquidHighlight: { name: 'Fenty Beauty Trophy Wife Bomb (liquid highlighter)', shade: 'Trophy Wife', tip: 'One drop mixed into moisturiser or pressed directly with finger onto cheekbones' },
            body: { name: 'Charlotte Tilbury Supermodel Body Highlighter', tip: 'If wearing a low-cut or sleeveless outfit — apply to décolleté for the full hammam goddess effect' },
          },
        },
      },
      {
        order: 5,
        zone: 'lips',
        stepName: 'Terracotta Lip',
        technique: 'Warm terracotta, rust, or cinnamon lip. No liner needed — apply directly, blot once with tissue, reapply for the blurred-lip effect.',
        products: {
          fitzpatrick_III: {
            lipstick: { name: 'NARS Lipstick', shade: 'Rikugien (terracotta)', tip: 'The perfect warm earth tone for medium skin' },
          },
          fitzpatrick_IV: {
            lipstick: { name: 'MAC Lipstick', shade: 'Mocha (warm brown-rose)', tip: 'Deep terracotta for olive-medium skin' },
            alternative: { name: 'Fenty Beauty Stunna Lip Paint', shade: 'Underdawg (warm brick)', tip: 'Long-wear terracotta for hot climates' },
          },
          fitzpatrick_V: {
            lipstick: { name: 'Juvia\'s Place I Am Magic Lipstick', shade: 'Warmth (terracotta)', tip: 'Specifically formulated warm-terracotta for deep skin' },
          },
        },
      },
    ],
    shoppingList: {
      totalEstimate: { low: 65, high: 180, currency: 'CAD' },
      budgetSwaps: [
        { expensive: 'Charlotte Tilbury Flawless Filter ($65)', budget: 'L\'Oréal Paris True Match Lumi Glow Amour Drops ($18)', saving: 47 },
        { expensive: 'Fenty Trophy Wife Liquid Highlight ($42)', budget: 'NYX Professional Hi-Def Photogenic Liquid Illuminator ($16)', saving: 26 },
      ],
    },
    proTips: [
      'Gold kohl in the waterline is transformative — it makes the whites of your eyes look brighter and the look warmer',
      'The whole point of this look is EFFORTLESS — if it looks too done, you\'ve overdone it. Less is more.',
      'Spritz your finished look with rosewater spray (any brand) for the final hammam-humidity effect',
      'Apply SPF underneath everything if you\'re actually going in the sun — this look was made for outdoor wear',
    ],
  },

  mehndi_bride: {
    id: 'mehndi_bride',
    name: 'Mehndi Bride',
    community: 'south-asian',
    description: 'Full bridal glam — jewel eyes, statement brows, deep red lip, glass skin',
    image: '/look-mehndi-hands.png',
    vibe: ['bridal', 'traditional', 'opulent', 'jewel-toned', 'festive'],
    occasion: ['wedding', 'mehndi-night', 'diwali', 'eid-glam', 'sangeet'],
    fitzpatrickRange: ['III', 'IV', 'V'],
    undertone: ['warm', 'deep-warm'],
    tags: ['bridal', 'south-asian-bride', 'jewel-eye', 'red-lip', 'mehndi'],
    steps: [
      {
        order: 1,
        zone: 'skin',
        stepName: 'Long-Wear Bridal Base',
        technique: 'This base must last 12+ hours through dancing, hugging, and tears. Use a primer, matte foundation, heavy-duty setting powder, and finishing spray. No shortcuts on bridal skin.',
        products: {
          all_tones: {
            primer: { name: 'Smashbox Photo Finish Primer', shade: 'Original', tip: 'Apply to entire face and let set for 5 minutes before foundation' },
          },
          fitzpatrick_III: {
            foundation: { name: 'Estée Lauder Double Wear Stay-in-Place Foundation', shade: '3N1 Ivory Beige', tip: 'The bridal gold standard — 24hr wear, no transfer' },
            concealer: { name: 'Tarte Shape Tape Concealer', shade: 'Light Medium', tip: 'Bake under eyes for 10 minutes with banana powder' },
          },
          fitzpatrick_IV: {
            foundation: { name: 'Estée Lauder Double Wear Stay-in-Place Foundation', shade: '4N1 Shell Beige', tip: 'Warm neutral — critical for South Asian undertones' },
            concealer: { name: 'Tarte Shape Tape Concealer', shade: 'Medium Tan', tip: 'Bake under eyes for 10 minutes with banana powder' },
          },
          fitzpatrick_V: {
            foundation: { name: 'Fenty Beauty Pro Filt\'r Soft Matte Foundation', shade: '420N', tip: 'Deep neutral — doesn\'t pull orange or grey on deep skin' },
            concealer: { name: 'Fenty Beauty Pro Filt\'r Concealer', shade: '420', tip: 'Match exactly — do not go lighter than one shade for bridal' },
          },
        },
      },
      {
        order: 2,
        zone: 'eyes',
        stepName: 'Jewel Cut Crease',
        technique: 'This is the most complex step. Prime lid. Pack a deep jewel (ruby red, emerald, sapphire) on the lid. Cut a crisp crease line using a slightly lighter shade above. Add glitter in the inner corner. False lashes essential.',
        products: {
          all_tones: {
            primer: { name: 'Urban Decay Eyeshadow Primer Potion', tip: 'Double prime for 12hr longevity at a wedding' },
            lidJewel: {
              option_a: { name: 'Pat McGrath Mothership VI Palette', shade: 'Ruby', tip: 'BEST bridal jewel red money can buy' },
              option_b: { name: 'Juvia\'s Place The Warrior Palette', shade: 'Brick/Ruby shades', tip: 'Budget pick that performs at 80% of Pat McGrath' },
            },
            crease: { name: 'MAC Eyeshadow', shade: 'Amber Lights (warm copper)', tip: 'Transition shade above jewel lid, blended in windshield-wiper motion' },
            innerCornerGlitter: { name: 'NYX Face and Body Glitter', shade: 'Gold', tip: 'Mix with a drop of eyelash glue to make it sticky, press on inner corner' },
            liner: { name: 'Stila Stay All Day Waterproof Liquid Liner', shade: 'Intense Black', tip: 'Wing liner over jewel lid — thin line, moderate wing for bridal' },
            lashes: { name: 'Ardell Mega Volume 252', tip: 'Full strip lash — bridal lashes should be dramatic. Apply after liner dries.' },
            mascara: { name: 'Better Than Sex Mascara by Too Faced', shade: 'Black', tip: 'Apply to bottom lashes only after strip lash is on top' },
          },
        },
      },
      {
        order: 3,
        zone: 'brows',
        stepName: 'Bridal Statement Brows',
        technique: 'Full, defined, shaped brows are the frame of the bridal face. Fill with pomade for 12hr hold. Stencil optional for perfect arch.',
        products: {
          all_tones: {
            pomade: { name: 'Anastasia Beverly Hills Dipbrow Pomade', shade: 'Dark Brown or Ebony', tip: 'Use angled brush, fill body of brow. Use pencil for tail and arch definition.' },
            pencil: { name: 'Anastasia Beverly Hills Brow Definer', shade: 'Dark Brown', tip: 'Define arch and tail precisely' },
            soap: { name: 'Barry M Brow Soap', tip: 'Wet with setting spray, brush brows up — soap brow under pomade lasts all day' },
            setting: { name: 'NYX Thick It Stick It Brow Masacra', shade: 'Brunette', tip: 'Final seal — brows will NOT MOVE' },
          },
        },
      },
      {
        order: 4,
        zone: 'contour',
        stepName: 'Sculpted Bridal Structure',
        technique: 'Bridal contouring is defined but not harsh. Contour cheekbones, temples, jawline, and sides of nose. Blend with large fluffy brush until no harsh lines remain.',
        products: {
          all_tones: {
            contour: { name: 'Charlotte Tilbury Filmstar Bronze & Glow', shade: 'Fair/Medium or Medium/Deep based on tone', tip: 'The bridal go-to — both contour and highlight in one elegant compact' },
            blush: { name: 'NARS Blush', shade: 'Deep Throat (sheer pink) or Orgasm (peach gold)', tip: 'Press into apples of cheeks and blend upward' },
            highlight: { name: 'Fenty Beauty Trophy Wife Highlighter', shade: 'Trophy Wife', tip: 'Intense gold highlight for cheekbones — catches candlelight beautifully at ceremonies' },
          },
        },
      },
      {
        order: 5,
        zone: 'lips',
        stepName: 'Iconic Bridal Red Lip',
        technique: 'South Asian brides wear red. Line lips precisely, fill in with liner, then two coats of lipstick. Blot with tissue between coats. Touch up at reception with a tiny lip brush.',
        products: {
          fitzpatrick_III: {
            liner: { name: 'MAC Lip Pencil', shade: 'Ruby Woo', tip: 'LINE and fill lips entirely — red with no base turns patchy' },
            lipstick: { name: 'MAC Lipstick', shade: 'Ruby Woo (matte red)', tip: 'The most iconic red — classic, vivid, long-wear' },
          },
          fitzpatrick_IV: {
            liner: { name: 'MAC Lip Pencil', shade: 'Redd', tip: 'Warm red liner for warm-medium skin' },
            lipstick: { name: 'Huda Beauty Power Bullet Matte Lipstick', shade: 'Icon (true red)', tip: 'Long-wear, bold pigment, stays through dessert' },
          },
          fitzpatrick_V: {
            liner: { name: 'MAC Lip Pencil', shade: 'Chili', tip: 'Warm brick-red liner — pure red reads too blue on deep skin' },
            lipstick: { name: 'Fenty Beauty Stunna Lip Paint', shade: 'Uncensored (universal red)', tip: 'Designed to look like the perfect red on ALL skin tones' },
          },
        },
      },
    ],
    shoppingList: {
      totalEstimate: { low: 200, high: 550, currency: 'CAD' },
      budgetSwaps: [
        { expensive: 'Pat McGrath Mothership Palette ($95 USD)', budget: 'Juvia\'s Place The Warrior Palette ($35)', saving: 60 },
        { expensive: 'Estée Lauder Double Wear ($75)', budget: 'L\'Oréal Infallible 24H Foundation ($22)', saving: 53 },
        { expensive: 'Charlotte Tilbury Filmstar Bronze ($85)', budget: 'NYX Sculpt & Highlight Palette ($26)', saving: 59 },
      ],
    },
    proTips: [
      'Do a full trial run 4-6 weeks before wedding day — photograph yourself in all lights (indoor, outdoor, flash)',
      'Set your whole look with Urban Decay All-Nighter Setting Spray for 16hr wear',
      'Bring a small emergency kit: MAC Ruby Woo, lash glue, Fenty concealer, powder, setting spray, cotton swabs',
      'Jewel lid eyes photograph better under warm lighting (mandap candles etc.) than cool LED — check your venue',
      'Book your makeup artist 6-12 months in advance for peak wedding season (April-May, Nov-Dec)',
    ],
  },

  rooibos_glow: {
    id: 'rooibos_glow',
    name: 'Rooibos Glow',
    community: 'south-african',
    description: 'Earthy terracotta tones, warm berry lip, brow-forward, sun-kissed skin',
    image: '/look-rooibos-glow.png',
    vibe: ['earthy', 'warm', 'grounded', 'natural', 'sun-kissed'],
    occasion: ['everyday', 'outdoor', 'casual', 'brunch'],
    fitzpatrickRange: ['IV', 'V', 'VI'],
    undertone: ['warm', 'deep-warm'],
    tags: ['terracotta', 'berry-lip', 'sun-kissed', 'south-african', 'earthy'],
    steps: [
      {
        order: 1,
        zone: 'skin',
        stepName: 'Warm Dewy Skin',
        technique: 'Rooibos-inspired glow is warm, earthy, and natural. Light-medium coverage with a luminous or satin finish. Let real skin show.',
        products: {
          fitzpatrick_IV: {
            foundation: { name: 'NARS Sheer Glow', shade: 'Syracuse', tip: 'Satin finish — luminous but not greasy' },
          },
          fitzpatrick_V: {
            foundation: { name: 'Fenty Beauty Pro Filt\'r Hydrating Foundation', shade: '370', tip: 'Warm tone that keeps deep skin looking alive, not flat' },
          },
          fitzpatrick_VI: {
            foundation: { name: 'Black Opal True Color Pore Perfecting Foundation', shade: 'Ebony Brown', tip: 'One of few foundations made for truly deep skin — no undertone mismatch' },
          },
        },
      },
      {
        order: 2,
        zone: 'eyes',
        stepName: 'Warm Earth Eyes',
        technique: 'Terracotta, rust, cinnamon on the lid. No liner or minimal brown liner on waterline only. Feathery mascara.',
        products: {
          all_tones: {
            shadow: { name: 'Juvia\'s Place The Saharan II Palette', shade: 'Terracotta, rust, ochre shades', tip: 'This palette was literally made for warm deep skin — every shade works' },
            liner: { name: 'L\'Oréal Paris Le Stylo Brown', shade: 'Brown', tip: 'Waterline only, soft and warm' },
            mascara: { name: 'Maybelline Lash Sensational Mascara', shade: 'Brownish Black', tip: 'Opens and fans lashes naturally' },
          },
        },
      },
      {
        order: 3,
        zone: 'lips',
        stepName: 'Berry-Rooibos Lip',
        technique: 'Berry stain applied lightly, centre gradient, blot to dry finish. Like your lips were stained from rooibos tea.',
        products: {
          fitzpatrick_IV: { lipstick: { name: 'Coloured Raine Matte Lipstick', shade: 'Casanova (warm berry)', tip: 'Pat outward from centre with ring finger for gradient' } },
          fitzpatrick_V: { lipstick: { name: 'MAC Lipstick', shade: 'Rebel', tip: 'Berry-plum that reads warm and beautiful on deep skin' } },
          fitzpatrick_VI: { lipstick: { name: 'Juvia\'s Place I Am Magic Lipstick', shade: 'Royale (deep wine)', tip: 'Deep berry for deepest skin — bold and stunning' } },
        },
      },
    ],
    shoppingList: {
      totalEstimate: { low: 55, high: 140, currency: 'CAD' },
      budgetSwaps: [
        { expensive: 'Juvia\'s Place Saharan II Palette ($40)', budget: 'BH Cosmetics Warm & Spicy Palette ($18)', saving: 22 },
      ],
    },
    proTips: [
      'Rooibos Glow is about warmth — avoid anything with grey, silver, or cool tones in this look',
      'The lip stain technique (centre out, blot) creates a effortless look that lasts hours without a liner',
    ],
  },

  loc_journey: {
    id: 'loc_journey',
    name: 'LOC Journey',
    community: 'black-american',
    description: 'Powerful matte skin, sculpted brows, bold jewel lip, natural hair feature',
    image: '/look-loc-journey.png',
    vibe: ['powerful', 'editorial', 'artistic', 'natural', 'bold'],
    occasion: ['editorial', 'photoshoot', 'art-event', 'statement-look'],
    fitzpatrickRange: ['V', 'VI'],
    undertone: ['warm', 'neutral', 'deep-cool'],
    tags: ['locs', 'editorial', 'bold-lip', 'sculpted', 'black-american'],
    steps: [
      {
        order: 1,
        zone: 'skin',
        stepName: 'Editorial Matte Canvas',
        technique: 'Full-coverage matte foundation creates the editorial canvas. No natural skin showing through — this is a statement look. Apply with brush for maximum coverage.',
        products: {
          fitzpatrick_V: {
            foundation: { name: 'Fenty Beauty Pro Filt\'r Soft Matte', shade: '400W', tip: 'Warm undertone matte — zero orange or red pull' },
          },
          fitzpatrick_VI: {
            foundation: { name: 'Black Opal Total Coverage Foundation', shade: 'Ebony', tip: 'Made FOR deep skin — unparalleled coverage for deepest tones' },
          },
        },
      },
      {
        order: 2,
        zone: 'eyes',
        stepName: 'Clean Graphic Eyes',
        technique: 'Graphic liner, bold or geometric. Or single jewel shadow lid. Editorial means intentional — pick one graphic eye element and execute it precisely.',
        products: {
          all_tones: {
            graphicLiner: { name: 'Kat Von D Tattoo Liner', shade: 'Trooper Black', tip: 'Use for graphic cut crease, graphic wing, or abstract liner art above crease' },
            jewel: { name: 'Juvia\'s Place The Warrior Palette', shade: 'Cobalt blue or emerald', tip: 'Single jewel on lid — rest of eye bare' },
          },
        },
      },
      {
        order: 3,
        zone: 'lips',
        stepName: 'Statement Jewel Lip',
        technique: 'Deep jewel — cobalt, emerald, plum, or deep burgundy. This lip IS the look. Everything else is minimised to let it speak.',
        products: {
          all_tones: {
            lipstick: { name: 'MAC Liptensity Lipstick', shade: 'Nightfish (deep cobalt) or Creme d\'Nude paired with Pigment', tip: 'MAC Liptensity gives editorial pigment — these are art-grade colours' },
            alternative: { name: 'NYX Cosmetics Liquid Suede Lipstick', shade: 'Subversive Socialite (deep plum) or Copenhagen (jewel blue)', tip: 'Budget editorial lip — genuinely pigmented, long-wear' },
          },
        },
      },
    ],
    shoppingList: { totalEstimate: { low: 45, high: 130, currency: 'CAD' }, budgetSwaps: [] },
    proTips: [
      'LOC Journey look is about POWER — this is a look that wears YOU, not the other way around',
      'Photograph this look in natural light against a minimal background — the subject is your face',
      'Your locs or natural hair are part of the look — style them intentionally before starting makeup',
    ],
  },

};

// ─── SKIN TONE DETECTOR ──────────────────────────────────────────────────────

export const FITZPATRICK_GUIDE = {
  I: { label: 'Very Fair', description: 'Pale, burns easily, rarely tans', hex: '#FDDBB4', undertones: ['pink', 'cool'] },
  II: { label: 'Fair', description: 'Fair, burns easily, tans minimally', hex: '#F5C89A', undertones: ['cool', 'neutral', 'pink'] },
  III: { label: 'Medium', description: 'Medium beige, occasional burns, gradual tan', hex: '#D4956A', undertones: ['neutral', 'warm', 'olive'] },
  IV: { label: 'Olive/Medium Dark', description: 'Olive to caramel, rarely burns, tans well', hex: '#A0694A', undertones: ['warm', 'olive', 'neutral'] },
  V: { label: 'Brown/Dark', description: 'Brown, minimally burns, tans heavily', hex: '#6B3F2A', undertones: ['warm', 'deep-warm', 'neutral'] },
  VI: { label: 'Deep/Very Dark', description: 'Very dark brown to deepest black, never burns', hex: '#3B1F14', undertones: ['deep-warm', 'deep-cool', 'neutral'] },
};

export const UNDERTONE_GUIDE = {
  cool: { description: 'Blue/pink veins visible, silver looks better than gold', recommendedFinish: 'pink-toned or neutral foundations' },
  warm: { description: 'Green/olive veins, gold jewelry looks better', recommendedFinish: 'yellow-toned or warm foundations' },
  neutral: { description: 'Mix of blue and green veins, both gold and silver work', recommendedFinish: 'neutral foundations (N in shade names)' },
  olive: { description: 'Green cast in skin, yellow-green undertone', recommendedFinish: 'yellow-warm foundations, never pink' },
  'deep-warm': { description: 'Rich warm brown with red/orange undertone', recommendedFinish: 'warm deep shades (W in shade names)' },
  'deep-cool': { description: 'Rich deep brown with blue/ash undertone', recommendedFinish: 'neutral or cool deep shades (N or C)' },
};

// ─── LOOK MATCHING FUNCTIONS ─────────────────────────────────────────────────

/**
 * Get all looks available for a Fitzpatrick scale
 */
export function getLooksForFitzpatrick(fitzpatrick) {
  return Object.values(INSPIRATION_LOOKS).filter(look =>
    look.fitzpatrickRange.includes(fitzpatrick)
  );
}

/**
 * Get all looks for a community
 */
export function getLooksForCommunity(communityId) {
  return Object.values(INSPIRATION_LOOKS).filter(look =>
    look.community === communityId
  );
}

/**
 * Get a specific look with Fitzpatrick-personalised product recommendations
 */
export function getPersonalisedLook(lookId, fitzpatrick, undertone) {
  const look = INSPIRATION_LOOKS[lookId];
  if (!look) return null;

  const fitz = fitzpatrick || 'IV';
  const fitzKey = `fitzpatrick_${fitz}`;
  const allKey = 'all_tones';

  const personalisedSteps = look.steps.map(step => {
    const products = step.products[fitzKey] || step.products[allKey] || step.products;
    return {
      ...step,
      products,
      personalNote: getPersonalNote(step.zone, fitz, undertone),
    };
  });

  return {
    ...look,
    steps: personalisedSteps,
    matchQuality: assessMatchQuality(look, fitz),
    alternativeLooks: getSimilarLooks(lookId, fitz),
  };
}

/**
 * Assess how well this look matches the user's skin tone (0-100)
 */
function assessMatchQuality(look, fitzpatrick) {
  const inRange = look.fitzpatrickRange.includes(fitzpatrick);
  if (inRange) return { score: 95, message: 'This look is designed for your skin tone' };

  const fitzNum = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 };
  const lookNums = look.fitzpatrickRange.map(f => fitzNum[f]);
  const userNum = fitzNum[fitzpatrick];
  const minDist = Math.min(...lookNums.map(n => Math.abs(n - userNum)));

  if (minDist === 1) return { score: 75, message: 'Adjacent skin tone — minor product adjustments needed' };
  if (minDist === 2) return { score: 50, message: 'Achievable with shade swaps — ask for alternatives' };
  return { score: 30, message: 'Significant adaptation required — consider a different look' };
}

/**
 * Get personal tips for each step based on skin tone
 */
function getPersonalNote(zone, fitzpatrick, undertone) {
  const notes = {
    skin: {
      I: 'Fair skin: avoid yellow-toned foundations — stay in pink or neutral',
      II: 'Fair skin: SPF is your best friend even under makeup',
      III: 'Medium skin: you can pull off both warm and neutral shades',
      IV: 'Olive skin: NEVER use pink foundations — they grey your skin instantly',
      V: 'Deep skin: avoid white powders (they cause flashback in photos) — use banana or warm setting powder',
      VI: 'Very deep skin: choose warm foundations (W in shade code) — blue-cast foundations look ashy',
    },
    eyes: {
      V: 'Deep skin: dark eyeshadow on deep lids requires a quality primer — without it, pigment disappears',
      VI: 'Very deep skin: jewel tones and bright colours show up BEAUTIFULLY on deep lids — embrace the vibrancy',
    },
    lips: {
      V: 'Deep skin: you can wear every lip colour that lighter skin tones struggle with. Orange, coral, berry — they were made for you.',
      VI: 'Very deep skin: avoid very pale nudes (they look greyish) — warm nudes and rich colours are your power zone',
    },
    glow: {
      V: 'Deep skin: warm gold highlighters only. Rose gold on very deep skin reads pink. Copper and gold read like skin.',
      VI: 'Very deep skin: heavy highlighter is your moment. More is more — you can layer cream under powder and it reads as natural glow.',
    },
  };

  return notes[zone]?.[fitzpatrick] || null;
}

/**
 * Find similar looks for a skin tone
 */
function getSimilarLooks(lookId, fitzpatrick) {
  return Object.values(INSPIRATION_LOOKS)
    .filter(l => l.id !== lookId && l.fitzpatrickRange.includes(fitzpatrick))
    .slice(0, 3)
    .map(l => ({ id: l.id, name: l.name, vibe: l.vibe[0] }));
}

/**
 * Search looks by vibe/occasion/tag
 */
export function searchLooks(query) {
  const q = query.toLowerCase();
  return Object.values(INSPIRATION_LOOKS).filter(look =>
    look.name.toLowerCase().includes(q) ||
    look.description.toLowerCase().includes(q) ||
    look.tags.some(t => t.includes(q)) ||
    look.vibe.some(v => v.includes(q)) ||
    look.occasion.some(o => o.includes(q)) ||
    look.community.includes(q)
  );
}

/**
 * Get complete shopping list for a look with budget options
 */
export function getShoppingList(lookId, fitzpatrick, budgetMode = 'all') {
  const look = INSPIRATION_LOOKS[lookId];
  if (!look) return null;

  const list = {
    lookName: look.name,
    community: look.community,
    estimate: look.shoppingList.totalEstimate,
    items: [],
    budgetSwaps: budgetMode === 'budget' ? look.shoppingList.budgetSwaps : [],
    whereToBuy: look.shoppingList.whereToBuy || defaultStores,
  };

  const fitzKey = `fitzpatrick_${fitzpatrick}`;
  const allKey = 'all_tones';

  look.steps.forEach(step => {
    const products = step.products[fitzKey] || step.products[allKey] || step.products;
    extractProducts(products).forEach(p => list.items.push({ zone: step.zone, ...p }));
  });

  return list;
}

function extractProducts(products) {
  const items = [];
  if (!products || typeof products !== 'object') return items;

  Object.entries(products).forEach(([key, value]) => {
    if (value && typeof value === 'object' && value.name) {
      items.push({ key, name: value.name, shade: value.shade, tip: value.tip });
    } else if (value && typeof value === 'object' && !value.name) {
      // Nested option (option_a, option_b)
      Object.entries(value).forEach(([optKey, opt]) => {
        if (opt && opt.name) {
          items.push({ key: `${key}_${optKey}`, name: opt.name, shade: opt.shade, tip: opt.tip, isOption: true });
        }
      });
    }
  });

  return items;
}

const defaultStores = [
  'Sephora (sephora.com)',
  'Shoppers Drug Mart Beauty Boutique',
  'MAC Cosmetics',
  'Amazon.ca',
  'Ulta Beauty (ships to Canada)',
];

// ─── ROUTINE BUILDER ─────────────────────────────────────────────────────────

/**
 * Generate step-by-step routine text for a look
 */
export function buildStyleGuide(lookId, fitzpatrick, userName) {
  const look = getPersonalisedLook(lookId, fitzpatrick);
  if (!look) return null;

  const greeting = userName ? `Here\'s your personalised guide, ${userName}` : 'Here\'s your personalised guide';

  const guide = {
    title: `${look.name} — Complete Style Guide`,
    greeting,
    overview: look.description,
    totalTime: estimateTime(look),
    difficultyLevel: assessDifficulty(look),
    steps: look.steps.map(step => ({
      stepNumber: step.order,
      title: step.stepName,
      zone: step.zone,
      instruction: step.technique,
      products: step.products,
      personalNote: step.personalNote,
    })),
    proTips: look.proTips,
    shoppingList: getShoppingList(lookId, fitzpatrick),
    matchInfo: look.matchQuality,
    similarLooks: look.alternativeLooks,
  };

  return guide;
}

function estimateTime(look) {
  const baseTime = look.steps.length * 8;
  const hasEyes = look.steps.some(s => s.zone === 'eyes');
  const hasFullSkin = look.steps.some(s => s.zone === 'skin');
  return `${baseTime + (hasEyes ? 15 : 0) + (hasFullSkin ? 10 : 0)}–${baseTime + (hasEyes ? 25 : 0) + (hasFullSkin ? 20 : 0)} minutes`;
}

function assessDifficulty(look) {
  const hasCutCrease = look.tags.includes('jewel-eye') || look.id === 'mehndi_bride';
  const hasWing = look.tags.includes('winged-liner');
  const isNatural = look.vibe.includes('natural');

  if (hasCutCrease) return { level: 'Advanced', description: 'Recommend practicing the eye look 2-3 times before wearing out' };
  if (hasWing) return { level: 'Intermediate', description: 'Wing liner takes practice — allow extra time' };
  if (isNatural) return { level: 'Beginner-Friendly', description: 'Great starting look — techniques are forgiving' };
  return { level: 'Intermediate', description: 'Some blending experience helpful' };
}

// ─── API RESPONSE BUILDERS ───────────────────────────────────────────────────

/**
 * Quick look preview for the style match gallery
 */
export function getAllLookPreviews() {
  return Object.values(INSPIRATION_LOOKS).map(look => ({
    id: look.id,
    name: look.name,
    community: look.community,
    description: look.description,
    image: look.image,
    vibe: look.vibe,
    occasion: look.occasion,
    fitzpatrickRange: look.fitzpatrickRange,
    tags: look.tags,
  }));
}

/**
 * Get looks filtered for a specific Fitzpatrick + community combination
 */
export function getFilteredLooks({ fitzpatrick, community, vibe, occasion } = {}) {
  let looks = Object.values(INSPIRATION_LOOKS);

  if (fitzpatrick) looks = looks.filter(l => l.fitzpatrickRange.includes(fitzpatrick));
  if (community) looks = looks.filter(l => l.community === community);
  if (vibe) looks = looks.filter(l => l.vibe.includes(vibe));
  if (occasion) looks = looks.filter(l => l.occasion.includes(occasion));

  return looks;
}

// ─── STATS ───────────────────────────────────────────────────────────────────

export const STYLE_MATCH_STATS = {
  totalLooks: Object.keys(INSPIRATION_LOOKS).length,
  communities: [...new Set(Object.values(INSPIRATION_LOOKS).map(l => l.community))],
  fitzpatrickCoverage: ['I', 'II', 'III', 'IV', 'V', 'VI'].filter(f =>
    Object.values(INSPIRATION_LOOKS).some(l => l.fitzpatrickRange.includes(f))
  ),
  totalVibes: [...new Set(Object.values(INSPIRATION_LOOKS).flatMap(l => l.vibe))],
  totalOccasions: [...new Set(Object.values(INSPIRATION_LOOKS).flatMap(l => l.occasion))],
};
