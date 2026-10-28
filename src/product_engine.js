/**
 * MIRRR Product Engine
 *
 * Maps looks → actual makeup product recommendations with shade-specific
 * guidance for every skin depth. This is MIRRR's core differentiator:
 * we don't say "foundation" — we say WHICH shade, for YOUR depth,
 * with YOUR undertone.
 */

// ---------------------------------------------------------------------------
// Product category definitions
// ---------------------------------------------------------------------------

export const PRODUCT_CATEGORIES = {
  foundation:   { id: 'foundation',   label: 'Foundation', emoji: '✨' },
  concealer:    { id: 'concealer',    label: 'Concealer',  emoji: '🌿' },
  eyeshadow:    { id: 'eyeshadow',    label: 'Eye Look',   emoji: '👁️' },
  liner:        { id: 'liner',        label: 'Liner',      emoji: '🖋️' },
  lash:         { id: 'lash',         label: 'Lashes',     emoji: '🦋' },
  contour:      { id: 'contour',      label: 'Contour',    emoji: '🌑' },
  highlight:    { id: 'highlight',    label: 'Highlight',  emoji: '⭐' },
  blush:        { id: 'blush',        label: 'Blush',      emoji: '🌸' },
  lip:          { id: 'lip',          label: 'Lip',        emoji: '💋' },
  setting:      { id: 'setting',      label: 'Setting',    emoji: '🌟' },
};

// ---------------------------------------------------------------------------
// Look-specific product formulas
// ---------------------------------------------------------------------------

const LOOK_FORMULAS = {

  afro_glam_editorial: {
    label: 'Afro-Glam Editorial',
    products: [
      { category: 'foundation', formula: 'Full-coverage serum foundation', depth_guidance: {
          fair: 'N10–N15 warm ivory', light: 'W25–W30 sand', light_med: 'W40–W45 honey',
          medium: 'W55–W60 caramel', medium_deep: 'W70–W80 golden amber', deep: 'W90–W96 mahogany', rich_deep: 'D50–D70 espresso–jet'
        }, finish: 'satin-to-matte', tip: 'Build coverage with a damp sponge; press don\'t wipe for a skin-like finish on deep skin.' },
      { category: 'eyeshadow', formula: 'Warm bronze + burnt copper + deep mahogany blend', finish: 'foiled shimmer',
        tip: 'Pack bronze on the lid, copper in the crease, mahogany at the outer corner. Use your finger first for maximum payoff on deep lids.' },
      { category: 'liner', formula: 'Smudged kohl or gel pencil — inner corner + waterline', finish: 'smoky',
        tip: 'Line the waterline in jet black or deep brown for eyes that pop against rich skin tones.' },
      { category: 'lash', formula: 'Full drama strip lash — wispy-to-glam', finish: 'voluminous' },
      { category: 'contour', formula: 'Deep neutral contour', depth_guidance: {
          fair: 'Light taupe', light: 'Soft brown', light_med: 'Warm cocoa', medium: 'Deep cocoa',
          medium_deep: 'Dark brown', deep: 'Very deep brown', rich_deep: 'Charcoal-brown'
        }, finish: 'matte', tip: 'On deep skin, use a contour 2-3 shades deeper than your foundation for visible sculpt.' },
      { category: 'highlight', formula: 'Copper or gold powder highlight', finish: 'blinding-shimmer',
        tip: 'Copper and gold highlight reads best on deep and medium-deep skin — skip silver.' },
      { category: 'lip', formula: 'Burgundy, plum, or cognac', finish: 'satin', tip: 'Line with a matching pencil slightly outside the lip line for fullness.' },
      { category: 'setting', formula: 'Translucent setting spray + matte powder under-eye bake', finish: 'longwear' },
    ],
  },

  hip_hop_glam: {
    label: 'Hip-Hop Glam',
    products: [
      { category: 'foundation', formula: 'Flawless full-coverage foundation', depth_guidance: {
          fair: 'W10–W20 porcelain-warm', light: 'W30–W40 beige', light_med: 'W50–W55 tan caramel',
          medium: 'W60–W70 golden', medium_deep: 'W80–W90 amber', deep: 'W92–W96 sienna', rich_deep: 'D50–D70 mahogany–jet'
        }, finish: 'luminous-matte', tip: 'Prep with pore-blurring primer. Bake under eyes for zero creasing under stage lights.' },
      { category: 'concealer', formula: 'Full-coverage concealer 2 shades lighter than foundation', finish: 'luminous', tip: 'Bake for 5 min with translucent powder for cut-crease prep.' },
      { category: 'eyeshadow', formula: 'Black smoky with rhinestone inner corner', finish: 'intense shimmer',
        tip: 'Cut your crease with concealer before laying colour — essential on monolid or hooded eyes.' },
      { category: 'liner', formula: 'Graphic black wing + lower lash waterline', finish: 'graphic' },
      { category: 'lash', formula: '25mm mink strip or faux-mink drama lash', finish: 'theatrical' },
      { category: 'contour', formula: 'Sculpted bronze/chocolate contour', finish: 'matte' },
      { category: 'highlight', formula: 'White-gold or champagne blinding highlight on nose bridge + cupid\'s bow', finish: 'blinding' },
      { category: 'blush', formula: 'Berry-toned blush on apples', finish: 'pigmented' },
      { category: 'lip', formula: 'Nude gloss or hot pink over matching liner', finish: 'glossy', tip: 'Overline the top lip for a fuller look.' },
      { category: 'setting', formula: 'Fixing spray + matte powder', finish: 'longwear' },
    ],
  },

  caribbean_carnival: {
    label: 'Caribbean Carnival',
    products: [
      { category: 'foundation', formula: 'Waterproof full-coverage (sweat-proof essential)', depth_guidance: {
          light_med: 'W45–W55 honey-tan', medium: 'W60–W70 golden', medium_deep: 'W80–W90 amber',
          deep: 'W92–D54 sienna-chocolate', rich_deep: 'D56–D70 ebony–jet'
        }, finish: 'matte-waterproof', tip: 'Use waterproof everything — Carnival is all-day outdoor.' },
      { category: 'eyeshadow', formula: 'Tropical sunset — coral, orange, fuchsia, gold', finish: 'foiled shimmer + glitter',
        tip: 'Layer pressed glitter over cream base on the lid. Use cosmetic glitter, not craft glitter.' },
      { category: 'liner', formula: 'Graphic coloured liner — orange or fuchsia wing', finish: 'graphic-bold' },
      { category: 'lash', formula: 'Festival feather lash or maximum-volume strip', finish: 'theatrical' },
      { category: 'highlight', formula: 'Chunky body glitter + face highlighter', finish: 'festival-glitter' },
      { category: 'blush', formula: 'Coral or peach flush across nose and cheeks', finish: 'sheer' },
      { category: 'lip', formula: 'Coral gloss or tropical red', finish: 'glossy' },
      { category: 'setting', formula: 'Waterproof setting spray — reapply every 2 hrs', finish: 'waterproof' },
    ],
  },

  desi_glam: {
    label: 'Desi Glam',
    products: [
      { category: 'foundation', formula: 'Full-coverage dewy foundation', depth_guidance: {
          fair: 'N10–W20 ivory-warm', light: 'W25–W35 sand', light_med: 'W40–W55 beige-honey',
          medium: 'W60–W70 caramel', medium_deep: 'W75–W85 pecan', deep: 'W90–D52 mahogany', rich_deep: 'D54–D70'
        }, finish: 'dewy-luminous', tip: 'South Asian and Middle Eastern skin often has olive undertones — look for "olive" or "yellow" based foundations.' },
      { category: 'eyeshadow', formula: 'Jewel-tone statement — emerald, sapphire, or ruby with gold liner', finish: 'metallic-foiled',
        tip: 'Apply a cream eyeshadow base first for colour vibrancy on deeper lids.' },
      { category: 'liner', formula: 'Precise gold or jewel-tone kohl kajal + wing', finish: 'sharp-wing' },
      { category: 'lash', formula: 'Dense wispy lash with gold or jewel accent', finish: 'full-lash' },
      { category: 'contour', formula: 'Structured bronze contour + sharp nose contour', finish: 'matte' },
      { category: 'highlight', formula: 'Gold or champagne highlighter on cheekbones, nose, and cupid\'s bow', finish: 'gold-glow' },
      { category: 'blush', formula: 'Rose gold or deep rose blush', finish: 'pigmented' },
      { category: 'lip', formula: 'Deep berry, ruby red, or plum', finish: 'satin-to-matte' },
      { category: 'setting', formula: 'HD setting spray + baking powder', finish: 'longwear' },
    ],
  },

  gulf_glam: {
    label: 'Gulf Glam',
    products: [
      { category: 'foundation', formula: 'Airbrush-finish full-coverage foundation', depth_guidance: {
          fair: 'W10–N20 porcelain', light: 'W25–W35 sand-olive', light_med: 'W40–W50 beige-golden',
          medium: 'W60–W70 golden', medium_deep: 'W80 amber'
        }, finish: 'glass-flawless', tip: 'Olive undertones are common across Gulf skin — avoid cool grey-toned foundations.' },
      { category: 'eyeshadow', formula: 'Kohl-smoke in taupe, deep plum, or warm brown — blown out', finish: 'smoky-blended' },
      { category: 'liner', formula: 'Kohl kajal — waterline, tightline, and smudged lower lash', finish: 'deep-kohl' },
      { category: 'lash', formula: 'Dramatic wispy-glam strip or individual clusters', finish: 'full-glam' },
      { category: 'contour', formula: 'Subtle warm contour + nose highlight for definition', finish: 'soft-matte' },
      { category: 'highlight', formula: 'Pearl or champagne liquid highlight — inner corner, high cheekbone', finish: 'pearl-glow' },
      { category: 'lip', formula: 'Nude-brown to dusty rose — perfected, not statement', finish: 'satin', tip: 'Gulf glam keeps lips understated so the eyes steal the show.' },
      { category: 'setting', formula: 'Dewy setting spray to preserve luminosity', finish: 'dewy-longwear' },
    ],
  },

  latina_glam: {
    label: 'Latina Glam',
    products: [
      { category: 'foundation', formula: 'Full-coverage satin foundation', depth_guidance: {
          fair: 'W15–W25 warm ivory', light: 'W35–W45 golden-sand', light_med: 'W50–W60 tan-golden',
          medium: 'W65–W75 caramel', medium_deep: 'W80–W90 amber', deep: 'D50–D56 mahogany'
        }, finish: 'satin', tip: 'Warm and olive-based formulas avoid the ashy-grey effect on warm Latin skin tones.' },
      { category: 'eyeshadow', formula: 'Warm copper, burnt orange, terracotta + bronze shimmer', finish: 'warm-shimmer' },
      { category: 'liner', formula: 'Brown-black wing + smudged lower lash', finish: 'warm-smoky' },
      { category: 'lash', formula: 'Curled volume lash', finish: 'full-volume' },
      { category: 'contour', formula: 'Warm bronzer/contour — cheeks, temples, nose', finish: 'bronzed-matte' },
      { category: 'highlight', formula: 'Gold or copper shimmer highlighter', finish: 'sun-kissed' },
      { category: 'blush', formula: 'Peach-coral or warm berry blush', finish: 'flushed' },
      { category: 'lip', formula: 'Warm red, terracotta satin, or brick nude', finish: 'satin-to-matte' },
      { category: 'setting', formula: 'Bronzing setting powder + fixing spray', finish: 'bronzed-longwear' },
    ],
  },

  k_beauty_glass: {
    label: 'K-Beauty Glass Skin',
    products: [
      { category: 'foundation', formula: 'Skin-tint or light-coverage serum foundation', depth_guidance: {
          fair: 'N10–N15 porcelain', light: 'N20–N25 ivory', light_med: 'N30–N35 nude', medium: 'W45 sand'
        }, finish: 'glass-dewy', tip: 'Mix foundation with a drop of facial oil for that lit-from-within glass effect.' },
      { category: 'concealer', formula: 'Lightweight concealer applied minimally', finish: 'natural', tip: 'No baking — glass skin is about skin, not coverage.' },
      { category: 'eyeshadow', formula: 'Sheer shimmer wash — champagne or rose gold on lid', finish: 'subtle-shimmer' },
      { category: 'liner', formula: 'Wispy ultra-fine black liner (no wing, or micro-wing)', finish: 'delicate' },
      { category: 'lash', formula: 'Natural individual lashes or light wispy strip', finish: 'natural' },
      { category: 'highlight', formula: 'Liquid highlighter mixed into foundation + pressed pearl on cheekbones', finish: 'glass-glow' },
      { category: 'blush', formula: 'MLBB flush blush — tapped lightly on apples + nose', finish: 'sheer-flushed', tip: 'Layer cream blush under powder for a natural flush that looks like you just came in from the cold.' },
      { category: 'lip', formula: 'Gradient lip — darker center fading to nothing, MLBB shade', finish: 'glossy-gradient', tip: 'K-beauty gradient lip: apply colour to the center only, then blur outward with your finger.' },
      { category: 'setting', formula: 'Dewy setting mist — no powder', finish: 'dewy' },
    ],
  },

  clean_minimal: {
    label: 'Clean Minimal',
    products: [
      { category: 'foundation', formula: 'Skin-finish or tinted moisturizer', depth_guidance: {
          fair: 'Fair', light: 'Light', light_med: 'Light-Medium', medium: 'Medium',
          medium_deep: 'Medium-Deep', deep: 'Deep', rich_deep: 'Rich Deep'
        }, finish: 'natural', tip: 'Let your real skin show — this look celebrates your skin, not covers it.' },
      { category: 'eyeshadow', formula: 'Soft matte brown or taupe on the crease', finish: 'soft-matte' },
      { category: 'liner', formula: 'Mascara only or very thin lash-line liner', finish: 'natural' },
      { category: 'lip', formula: 'Tinted lip balm or your-lips-but-better nude', finish: 'glossy-sheer' },
      { category: 'setting', formula: 'SPF moisturizer + light setting mist', finish: 'natural' },
    ],
  },

};

// ---------------------------------------------------------------------------
// Product Engine API
// ---------------------------------------------------------------------------

/**
 * Get product formula for a specific look and depth.
 *
 * @param {string} lookId     - look id from look_engine.js
 * @param {string} depthId    - depth id from shade_finder.js DEPTH_LABELS
 * @returns {object|null}     - formula with depth-resolved products
 */
export function getLookProducts(lookId, depthId = 'medium') {
  const formula = LOOK_FORMULAS[lookId];
  if (!formula) return null;

  return {
    ...formula,
    products: formula.products.map(p => ({
      ...p,
      shade_guidance: p.depth_guidance?.[depthId] ?? null,
    })),
  };
}

/**
 * Get all look formulas (for the looks catalogue).
 */
export function getAllFormulas() {
  return Object.entries(LOOK_FORMULAS).map(([id, f]) => ({ id, label: f.label }));
}

/**
 * Get product categories metadata.
 */
export function getProductCategories() {
  return Object.values(PRODUCT_CATEGORIES);
}
