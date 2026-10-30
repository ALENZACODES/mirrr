/**
 * body_art_atlas.js — Multicultural body art and adornment database for MIRRR
 * Henna, scarification, body paint, jewellery, cultural adornment
 */

// ─── BODY ART CATEGORIES ─────────────────────────────────────────────────────

export const BODY_ART_CATEGORIES = {
  henna: { id: 'henna', label: 'Henna / Mehndi', icon: '🌿' },
  body_paint: { id: 'body_paint', label: 'Body Paint', icon: '🎨' },
  scarification: { id: 'scarification', label: 'Scarification & Marking', icon: '◈' },
  jewellery: { id: 'jewellery', label: 'Traditional Jewellery', icon: '💎' },
  tattoo: { id: 'tattoo', label: 'Traditional Tattoo', icon: '🔷' },
  piercing: { id: 'piercing', label: 'Cultural Piercing', icon: '○' },
  headwear: { id: 'headwear', label: 'Headwear & Hair Adornment', icon: '👑' },
  fabric_body: { id: 'fabric_body', label: 'Fabric Body Adornment', icon: '🪭' },
};

// ─── BODY ART ATLAS ───────────────────────────────────────────────────────────

export const BODY_ART = {

  // ═══════════════════════════════════════════════════════════════════════════
  // HENNA / MEHNDI
  // ═══════════════════════════════════════════════════════════════════════════

  south_asian_bridal_mehndi: {
    id: 'south_asian_bridal_mehndi',
    name: 'South Asian Bridal Mehndi',
    category: 'henna',
    community: 'south-asian',
    origin: 'India, Pakistan, Bangladesh, Sri Lanka',
    description: 'Intricate full-arm and leg mehndi applied to brides in the days before their wedding. Among the most detailed forms of henna art in the world.',
    culturalContext: 'The mehndi ceremony (also called dholki or sangeet) is a major pre-wedding celebration across South Asian cultures. The darker the mehndi, the more the husband will love his wife — goes the tradition.',
    bodyPlacements: [
      {
        area: 'Hands and arms',
        region: 'From fingertips to above elbow',
        pattern: 'Intricate florals, paisleys (mango motifs), lattice work, and often the groom\'s name hidden in the design',
        significance: 'Bridal — the more complex, the higher the status',
      },
      {
        area: 'Feet and legs',
        region: 'From toes to knee',
        pattern: 'Matching the hand design, typically with more geometric patterns on the lower leg',
        significance: 'Bridal completion — bare feet are not adorned without hands',
      },
      {
        area: 'Back of hands',
        region: 'Central back hand motif',
        pattern: 'Central flower or mandala — the focal piece of the whole design',
        significance: 'The centrepiece of the mehndi — most photographed area',
      },
    ],
    styles: [
      {
        style: 'Rajasthani',
        origin: 'Rajasthan, India',
        characteristics: 'Very fine lines, heavy filling, intricate peacock motifs, jewellery patterns mimicked in henna',
      },
      {
        style: 'Pakistani',
        origin: 'Pakistan',
        characteristics: 'Thick bold lines, roses and floral clusters, often more coverage with less fine detail',
      },
      {
        style: 'Mughal',
        origin: 'Mughal Empire influence',
        characteristics: 'Architectural patterns, jali (lattice) work, mango/paisley motifs',
      },
      {
        style: 'Gujarati',
        origin: 'Gujarat, India',
        characteristics: 'Fine delicate patterns, circular motifs, less coverage than Rajasthani',
      },
    ],
    ingredients: 'Pure henna powder + essential oil (eucalyptus or lavender) + lemon juice + sugar',
    stainDepth: 'Deepest on palms and soles (natural warmth deepens stain)',
    careInstructions: ['Lemon sugar sealant', 'No water for 24 hours after removal', 'Eucalyptus oil seal', 'Keep warm for deepest stain'],
    tags: ['bridal', 'mehndi', 'south-asian', 'indian', 'pakistani', 'henna', 'ceremony'],
  },

  moroccan_henna: {
    id: 'moroccan_henna',
    name: 'Moroccan Henna Patterns',
    category: 'henna',
    community: 'arab',
    origin: 'Morocco, Algeria, Tunisia',
    description: 'North African henna style characterised by geometric patterns, chevrons, and negative space — distinct from South Asian floral styles.',
    culturalContext: 'Henna nights (laylat al-henna) are essential to Moroccan weddings. Patterns vary by region — Fez, Marrakech, and the Berber areas all have distinct traditional styles.',
    bodyPlacements: [
      {
        area: 'Hands',
        region: 'Palms and back of hands',
        pattern: 'Geometric: chevrons, diamonds, triangles, dots, and bold lines',
        significance: 'Wedding and celebration — worn for Eid as well as weddings',
      },
      {
        area: 'Feet',
        region: 'Soles and tops of feet',
        pattern: 'Ankle band motifs, geometric fills on toes',
        significance: 'Wedding complement',
      },
    ],
    styles: [
      {
        style: 'Fassi (Fez style)',
        origin: 'Fez, Morocco',
        characteristics: 'Bold solid fills, few fine lines, strong geometric shapes, more filling than negative space',
      },
      {
        style: 'Amazigh/Berber',
        origin: 'Atlas Mountains, Morocco',
        characteristics: 'Ancient triangular patterns, cross motifs (fertility symbols), minimal decoration but deeply symbolic',
      },
      {
        style: 'Modern Moroccan Fusion',
        origin: 'Urban Morocco, diaspora',
        characteristics: 'Mix of geometric traditional with contemporary floral — popular globally',
      },
    ],
    ingredients: 'Natural henna + eucalyptus oil + water (no lemon in traditional Moroccan application)',
    stainDepth: 'Medium — Moroccan henna traditionally stains orange-red',
    careInstructions: ['Leave paste on 6-8 hours', 'Scrape rather than wash', 'Argan oil seal post-removal'],
    tags: ['moroccan', 'north-african', 'arab', 'geometric', 'henna', 'wedding'],
  },

  sudanese_henna: {
    id: 'sudanese_henna',
    name: 'Sudanese Henna (Kandaga)',
    category: 'henna',
    community: 'east-african',
    origin: 'Sudan',
    description: 'Sudanese henna (kandaga) is distinctive — applied to the entire arm and leg with very dark, bold patterns. Among the darkest henna in the world.',
    culturalContext: 'Henna is woven into every lifecycle event in Sudan — birth, circumcision (for both sexes, culturally), weddings, and Eid. Sudanese women apply henna to the whole arm, not just hands.',
    bodyPlacements: [
      {
        area: 'Full arm',
        region: 'Fingertips to shoulder',
        pattern: 'Patterns vary from geometric to floral, but the full arm coverage is the Sudanese signature',
        significance: 'Bridal and celebration — a fully henna\'d arm is a statement of beauty',
      },
      {
        area: 'Full leg',
        region: 'Toes to thigh',
        pattern: 'Matching arm pattern on legs',
        significance: 'Full bridal body adornment',
      },
    ],
    styles: [
      {
        style: 'Shendi Style',
        origin: 'Shendi, northern Sudan',
        characteristics: 'Bold, graphic designs, darker stain from longer development time',
      },
      {
        style: 'Sudanese Wedding',
        origin: 'Khartoum, Sudan',
        characteristics: 'Full arm and leg coverage, mix of geometric and organic patterns',
      },
    ],
    ingredients: 'Natural henna + clove oil + sugar + hot water (very concentrated paste)',
    stainDepth: 'Darkest mahogany — Sudanese henna methods create the deepest stains',
    careInstructions: ['Leave overnight minimum', 'Wrap in fabric to keep warm', 'Do not wash for 48 hours'],
    tags: ['sudanese', 'east-african', 'henna', 'kandaga', 'full-arm', 'dark', 'bridal'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BODY PAINT
  // ═══════════════════════════════════════════════════════════════════════════

  osun_osogbo_body_paint: {
    id: 'osun_osogbo_body_paint',
    name: 'Yoruba Osun Festival Body Paint',
    category: 'body_paint',
    community: 'west-african',
    origin: 'Osun-Osogbo, Nigeria',
    description: 'Sacred body painting for the Osun-Osogbo festival — Yoruba sacred grove, UNESCO World Heritage site. Yellow and gold paint honouring Osun, goddess of water and fertility.',
    culturalContext: 'The Osun Festival honours Osun (Oshun), the Yoruba goddess of rivers, fertility, love, and beauty. Yellow and gold are her sacred colours. Devotees paint themselves and dress in these hues.',
    bodyPlacements: [
      {
        area: 'Face',
        region: 'Forehead, cheeks, around eyes',
        pattern: 'Yellow/gold circles, dots, and lines specific to Osun worship',
        significance: 'Sacred — marking oneself as a devotee of Osun',
      },
      {
        area: 'Body',
        region: 'Arms, chest, back',
        pattern: 'Yellow and white patterns — may include cowrie shells in the design',
        significance: 'Full devotional body marking',
      },
    ],
    materials: ['Yellow and gold face/body paint', 'Camwood powder (for red/brown)', 'Chalky white clay (efun)', 'Cowrie shells'],
    significance: 'Sacred Yoruba religious expression — worn only during Osun festival by devotees',
    tags: ['yoruba', 'osun', 'body-paint', 'sacred', 'west-african', 'festival', 'yellow', 'gold'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRADITIONAL JEWELLERY
  // ═══════════════════════════════════════════════════════════════════════════

  south_asian_bridal_jewellery: {
    id: 'south_asian_bridal_jewellery',
    name: 'South Asian Bridal Jewellery Set',
    category: 'jewellery',
    community: 'south-asian',
    origin: 'India, Pakistan, Bangladesh',
    description: 'The complete South Asian bridal jewellery set — 16 traditional adornments (Solah Shringar) worn at Hindu weddings.',
    culturalContext: 'Solah Shringar (16 adornments) in Hindu tradition are the 16 beautifications of a bride, each with spiritual significance. The married woman is considered the most adorned form of Shakti.',
    pieces: [
      {
        name: 'Maang Tikka',
        placement: 'Head — centre parting',
        material: 'Gold or Kundan, with central gem',
        significance: 'The maang tikka sits on the Ajna chakra (third eye). It binds the bride\'s mind to the groom.',
        description: 'Decorative headpiece attached to hair with a hook',
      },
      {
        name: 'Nath (Nose ring)',
        placement: 'Left nostril (traditionally) or septum',
        material: 'Gold, often with pearl drop',
        significance: 'Marriage marker — similar to Western wedding ring. Worn on the left as it is connected to the reproductive organ in Ayurveda.',
        description: 'Large hoop or stud nose ring — often connected to ear with a chain',
      },
      {
        name: 'Mangalsutra',
        placement: 'Neck',
        material: 'Gold chain with black beads',
        significance: 'The marriage chain — tied around bride\'s neck by the groom during the ceremony. The most sacred piece.',
        description: 'Black bead and gold chain necklace — the Hindu equivalent of the wedding ring',
      },
      {
        name: 'Chooda',
        placement: 'Wrists — both arms',
        material: 'Red and white bangles (ivory + lac)',
        significance: 'Worn by Punjabi brides — the red and white represent the bride and groom. Must be worn for 40 days after marriage.',
        description: 'Traditional red-and-ivory bangle set given by maternal uncle',
      },
      {
        name: 'Kamarband (Waist Belt)',
        placement: 'Waist',
        material: 'Gold or silver with intricate work',
        significance: 'Marks the transition from girl to woman. Adorns the most feminine area.',
        description: 'Traditional gold waist chain or belt',
      },
      {
        name: 'Payal (Anklets)',
        placement: 'Both ankles',
        material: 'Silver (traditionally — gold not traditionally worn at ankle)',
        significance: 'The sound of payal (bells on anklets) announces the arrival of the bride.',
        description: 'Silver chain anklets with tiny bells (ghungroo)',
      },
      {
        name: 'Jhumka (Earrings)',
        placement: 'Ears',
        material: 'Gold with Kundan, Meenakari, or pearl drops',
        significance: 'Ear piercing is traditionally done as an Annaprashana (first solid food) rite in childhood.',
        description: 'Bell-shaped drop earrings — can be small stud or elaborate chandelier style',
      },
    ],
    modernAdaptations: 'Many brides now wear lighter versions of the traditional set. Polki (uncut diamond), Kundan (foil-set stones), and Meenakari (enamel work) are popular finishes.',
    buyingTips: ['22-24ct gold for traditional pieces', 'Kundan for lightweight versions', 'Ensure hallmarked gold', 'Rent option available for very heavy sets'],
    tags: ['south-asian', 'bridal', 'jewellery', 'solah-shringar', 'hindu', 'gold', 'maang-tikka', 'mangalsutra'],
  },

  west_african_beads: {
    id: 'west_african_beads',
    name: 'West African Waist Beads',
    category: 'jewellery',
    community: 'west-african',
    origin: 'Ghana, Nigeria, Côte d\'Ivoire, Senegal',
    description: 'Coloured beads worn around the waist. One of the most intimate and significant adornments in West African tradition.',
    culturalContext: 'Waist beads in West African tradition track a woman\'s weight, mark life stages, communicate relationship status, and are given as gifts at significant life events. Worn beneath clothing — an intimate, personal adornment.',
    significance: [
      'Weight tracker: beads fall when you lose weight, tighten when you gain',
      'Life stage markers: different colours for puberty, marriage, motherhood',
      'Spiritual: specific colours chosen for protection, love, fertility',
      'Intimacy: traditionally removed only for intimate partners',
    ],
    colours: [
      { colour: 'Blue', meaning: 'Loyalty, trust, peace, healing' },
      { colour: 'Green', meaning: 'Abundance, fertility, prosperity, earth' },
      { colour: 'Gold/Yellow', meaning: 'Wealth, wisdom, royalty, feminine energy' },
      { colour: 'Red', meaning: 'Vitality, passion, power, fertility' },
      { colour: 'White', meaning: 'Purity, light, spiritual protection' },
      { colour: 'Purple', meaning: 'Royalty, spirituality, wisdom' },
      { colour: 'Black', meaning: 'Protection, grounding, power' },
      { colour: 'Orange', meaning: 'Confidence, joy, endurance' },
    ],
    materials: ['Glass beads', 'Seed beads', 'Crystal beads', 'Gemstone beads (carnelian, turquoise)', 'Gold beads (prestige)'],
    howWorn: 'Around the waist, sitting on the hips. Multiple strands can be worn. Some traditions require specific tying methods by an elder.',
    modernContext: 'Worn globally now — adopted widely in Black-American communities, particularly with natural hair and Afrocentric movements.',
    tags: ['waist-beads', 'west-african', 'ghanaian', 'nigerian', 'beads', 'jewellery', 'intimate', 'spiritual'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADWEAR
  // ═══════════════════════════════════════════════════════════════════════════

  gele_tying: {
    id: 'gele_tying',
    name: 'Gele (Yoruba Head Tie)',
    category: 'headwear',
    community: 'west-african',
    origin: 'Yoruba (Nigeria)',
    description: 'The Yoruba head tie (gele) — a statement headwear tied in elaborate sculptural forms. An art form unto itself.',
    culturalContext: 'The gele is both cultural identity and artistry. "Gele ti ẹni dara" (her gele is beautiful) is a supreme compliment at a Yoruba event. Professional gele tiers exist who attend every wedding.',
    styles: [
      {
        name: 'Fan Gele',
        description: 'Pleated, spread at the back like a fan. The most dramatic and formal style.',
        occasion: 'Weddings, high-level events',
        difficulty: 5,
      },
      {
        name: 'Side Bow Gele',
        description: 'Gathered into a large sculptural bow at one side.',
        occasion: 'Parties, moderate formality',
        difficulty: 4,
      },
      {
        name: 'Low Church Gele',
        description: 'Simpler wrap with modest height — less sculptural but still elegant.',
        occasion: 'Church, everyday elevated occasions',
        difficulty: 2,
      },
    ],
    materials: ['Aso-Oke fabric (traditional Yoruba woven fabric)', 'Silk', 'Damask', 'Satin', 'Velvet (for elite occasions)'],
    tying: {
      fabric: 'Typically 2-4 yards of stiff fabric',
      foundation: 'Wig grip or head cap worn beneath prevents slipping',
      technique: 'First layer creates the base. Subsequent layers are pleated, fanned, or wrapped to create the sculptural shape.',
    },
    occasions: ['Nigerian weddings (aso-ebi)', 'Funerals', 'Church', 'Naming ceremonies', 'Graduation'],
    tags: ['gele', 'yoruba', 'nigeria', 'headwrap', 'west-african', 'aso-ebi', 'ceremony'],
  },

  turban_styles: {
    id: 'turban_styles',
    name: 'South Asian Turban (Dastar / Pagdi)',
    category: 'headwear',
    community: 'south-asian',
    origin: 'Punjab (Sikh), Rajasthan (Rajput), rest of India',
    description: 'The turban — sacred Sikh article of faith (dastar), royal Rajput signifier, and groom\'s wedding headwear across India.',
    culturalContext: 'The Sikh dastar is one of the five Ks (Panj Kakars) — articles of faith that a Sikh must wear. For Rajputs, the pagdi is a symbol of honour. Groom\'s sehras (turban with flowers) are worn at Hindu/Sikh weddings.',
    styles: [
      {
        name: 'Dastar (Sikh Turban)',
        community: 'Sikh',
        description: 'Long cloth (varies by tradition: 5-10m) tied in specific way around an undersupport. The shape, colour, and style vary by sect.',
        significance: 'Sacred — required article of Sikh faith. Never to be removed in public.',
        colours: ['Navy/dark blue (Nihang)', 'Saffron/orange (general)', 'White (elderly/spiritual)', 'Pink (celebration)'],
      },
      {
        name: 'Rajasthani Pagdi',
        community: 'Rajput / Rajasthan',
        description: 'Bright, colourful turban in signature Rajasthani style — often with gold borders and fan-like shape',
        significance: 'Honour and social status — a man\'s pagdi is his dignity',
        colours: ['Saffron', 'Pink', 'Multi-colour', 'Red for weddings'],
      },
      {
        name: 'Sehra (Groom\'s Turban)',
        community: 'Hindu/Sikh groom',
        description: 'Wedding turban adorned with flowers (real or fabric) hanging over the face, and marigold strings',
        significance: 'Worn only at weddings — the groom\'s crown',
        colours: ['Gold', 'Cream', 'Saffron'],
      },
    ],
    tags: ['turban', 'dastar', 'pagdi', 'south-asian', 'sikh', 'rajput', 'wedding', 'faith'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRADITIONAL TATTOO
  // ═══════════════════════════════════════════════════════════════════════════

  berber_tattoo: {
    id: 'berber_tattoo',
    name: 'Amazigh (Berber) Facial Tattoo',
    category: 'tattoo',
    community: 'arab',
    origin: 'North Africa — Morocco, Algeria, Tunisia, Libya',
    description: 'Ancient Amazigh (Berber) facial and body tattoo traditions. Geometric patterns on chin, forehead, and cheeks carry tribal and spiritual meaning.',
    culturalContext: 'Amazigh facial tattoos have been practised for thousands of years, predating Islam. Elderly Amazigh women still bear these marks — they are increasingly rare in younger generations. A living connection to pre-Islamic North African identity.',
    patterns: [
      {
        location: 'Chin',
        pattern: 'Vertical lines, crosses, dots',
        meaning: 'Most common placement — marks womanhood in many tribes',
      },
      {
        location: 'Forehead',
        pattern: 'Cross (Tifinagh script cross), diamonds',
        meaning: 'Protection, identity of tribe',
      },
      {
        location: 'Cheeks',
        pattern: 'Small dots, geometric forms',
        meaning: 'Beauty marks, tribal identity',
      },
      {
        location: 'Hands and arms',
        pattern: 'Lines, crosses, zigzags',
        meaning: 'Protection during childbirth, fertility',
      },
    ],
    modernContext: 'Young Amazigh women are reviving these patterns — often using henna or temporary tattoo to honour the tradition without permanent commitment.',
    culturalSensitivity: 'Sacred cultural practice. Non-Amazigh should appreciate and study, not appropriate specific tribal patterns.',
    tags: ['amazigh', 'berber', 'north-african', 'facial-tattoo', 'traditional', 'moroccan', 'identity'],
  },

  ethiopian_tribal_marks: {
    id: 'ethiopian_tribal_marks',
    name: 'Mursi & Surma Lip Plates',
    category: 'scarification',
    community: 'east-african',
    origin: 'Omo Valley, Ethiopia (Mursi, Surma, Suri peoples)',
    description: 'The iconic lip plates of the Mursi and Surma peoples of Ethiopia\'s Omo Valley. One of the most visually striking cultural adornments in the world.',
    culturalContext: 'Lip plates (dhebi a tugoin) are worn by Mursi women. The lip is cut at puberty and progressively stretched over years using clay discs. The size of the plate indicates the bride price a woman can command. Deeply meaningful within the culture; often misunderstood outside it.',
    significance: 'Beauty ideal, social status, marriage readiness indicator, cultural identity of Mursi/Surma peoples',
    culturalSensitivity: 'This is a highly contextualised traditional practice. It should not be appropriated, costumed, or replicated outside its cultural context. Documented here for educational understanding only.',
    tags: ['mursi', 'surma', 'lip-plate', 'omo-valley', 'ethiopia', 'east-african', 'traditional', 'educational'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRADITIONAL PIERCINGS
  // ═══════════════════════════════════════════════════════════════════════════

  mughal_nose_ring: {
    id: 'mughal_nose_ring',
    name: 'Nath (South Asian Nose Ring)',
    category: 'piercing',
    community: 'south-asian',
    origin: 'India (Mughal era, 1600s)',
    description: 'The nath — the South Asian nose ring, introduced in the Mughal era and now an iconic part of South Asian bridal and traditional wear.',
    culturalContext: 'The nath is believed to have been introduced to India by Mughal influence from the Middle East. It became integrated into Hindu tradition and is now one of the Solah Shringar (16 adornments). Connected to Parvati — the divine consort.',
    styles: [
      {
        name: 'Mughal Nath (Large Hoop)',
        description: 'Large gold hoop — 3-6 inches diameter — with pearl and ruby drops. Held by a chain connected to the hair.',
        occasion: 'Weddings, classical dance (Bharatanatyam)',
        region: 'All India — North especially',
      },
      {
        name: 'Maharashtrian Nath',
        description: 'Round hoop with floral golden decorations — smaller and worn without a chain.',
        occasion: 'Maharashtrian weddings',
        region: 'Maharashtra',
      },
      {
        name: 'South Indian Nath',
        description: 'Nose stud (not hoop) tradition in Tamil Nadu and Karnataka. Also: small nose rings',
        occasion: 'Traditional celebrations, Bharatanatyam',
        region: 'Tamil Nadu, Karnataka',
      },
    ],
    materials: ['22-24ct gold', 'Kundan (foil + stone setting)', 'Pearl drops', 'Ruby or emerald accents'],
    howToWear: 'Pierced through left nostril (traditionally). Large nath held in place with a chain pin-clipped into hair on the same side.',
    significance: 'Marriage marker in Hindu tradition. Also worn for its Ayurvedic significance — the left nostril is connected to the female reproductive organs.',
    tags: ['nath', 'nose-ring', 'south-asian', 'bridal', 'mughal', 'jewellery', 'piercing'],
  },

};

// ─── QUERY FUNCTIONS ─────────────────────────────────────────────────────────

/**
 * Get body art by ID
 * @param {string} id
 * @returns {Object|null}
 */
export function getBodyArt(id) {
  return BODY_ART[id] || null;
}

/**
 * Get body art for community
 * @param {string} communityId
 * @returns {Object[]}
 */
export function getBodyArtForCommunity(communityId) {
  return Object.values(BODY_ART).filter(a => a.community === communityId);
}

/**
 * Get body art by category
 * @param {string} category
 * @returns {Object[]}
 */
export function getBodyArtByCategory(category) {
  return Object.values(BODY_ART).filter(a => a.category === category);
}

/**
 * Get all bridal body art
 * @returns {Object[]}
 */
export function getBridalBodyArt() {
  return Object.values(BODY_ART).filter(a =>
    (a.tags || []).some(t => t.includes('bridal') || t.includes('wedding'))
  );
}

/**
 * Get body art by tag
 * @param {string} tag
 * @returns {Object[]}
 */
export function searchBodyArtByTag(tag) {
  const norm = tag.toLowerCase();
  return Object.values(BODY_ART).filter(a =>
    (a.tags || []).some(t => t.includes(norm))
  );
}

/**
 * Get all henna styles
 * @returns {Object[]}
 */
export function getAllHennaStyles() {
  return getBodyArtByCategory('henna');
}

/**
 * Get educational body art (sacred/traditional context)
 * @returns {Object[]}
 */
export function getEducationalBodyArt() {
  return Object.values(BODY_ART).filter(a => a.culturalSensitivity);
}

// ─── STATS ───────────────────────────────────────────────────────────────────

