/**
 * cultural_beauty_history.js — History of ethnic beauty traditions for MIRRR
 * From ancient civilisations to modern movements
 */

// ─── HISTORICAL ERAS ──────────────────────────────────────────────────────────

export const BEAUTY_ERAS = {
  ancient: { id: 'ancient', label: 'Ancient (pre-600 CE)', icon: '🏛️' },
  medieval: { id: 'medieval', label: 'Medieval (600–1500 CE)', icon: '⚔️' },
  colonial: { id: 'colonial', label: 'Colonial Era (1500–1900)', icon: '🌍' },
  modern: { id: 'modern', label: 'Modern (1900–2000)', icon: '🎬' },
  contemporary: { id: 'contemporary', label: 'Contemporary (2000–now)', icon: '📱' },
};

// ─── BEAUTY HISTORY ENTRIES ───────────────────────────────────────────────────

export const BEAUTY_HISTORY = {

  // ── ANCIENT EGYPT ────────────────────────────────────────────────────────

  ancient_egypt_kohl: {
    id: 'ancient_egypt_kohl',
    title: 'Kohl and the Birth of Eye Makeup',
    era: 'ancient',
    community: 'arab',
    period: 'c. 3500–30 BCE',
    location: 'Ancient Egypt (Kemet)',
    summary: 'Kohl (udju) was used by Ancient Egyptians of all genders and classes as protection from sun glare, infection, and evil spirits.',
    details: `Kohl in Ancient Egypt was made from galena (lead sulphide), malachite (copper carbonate), or antimony. 
The darkened eye protected from the harsh Nile sun — ancient Egyptians understood that darkening around the eye reduces glare. 
Kohl was applied with small sticks made of wood, ivory, or bronze, stored in elegant kohl pots (many survive in museums today).
Queen Nefertari's tomb paintings show kohl as integral to her identity — the almond eye shape is inseparable from Egyptian identity.
Kohl was democratised — worn by Pharaoh Ramesses II and by field workers alike. One of the first beauty products to cross class lines.`,
    modernLegacy: 'Kohl traditions spread via Arab, Berber, and trade routes through South Asia, East Africa, and the Gulf — where it remains central to daily beauty ritual today.',
    ingredients: ['galena (lead sulphide)', 'malachite', 'antimony', 'stibnite'],
    significance: 'THE birth of eye makeup. Everything from pencil eyeliner to eyeshadow traces back to Egyptian kohl.',
    tags: ['kohl', 'egypt', 'ancient', 'eye-makeup', 'arab', 'universal'],
  },

  ancient_egypt_henna: {
    id: 'ancient_egypt_henna',
    title: 'Henna in Ancient Egypt and the Middle East',
    era: 'ancient',
    community: 'arab',
    period: 'c. 3000 BCE',
    location: 'Ancient Egypt, Arabia, South Asia',
    summary: 'Henna (Lawsonia inermis) was used for body art, hair colouring, and nail staining across ancient Egypt, Arabia, and the Indus Valley.',
    details: `Archaeological evidence shows henna on the fingernails of Egyptian mummies — including possibly Queen Hatshepsut's mummy.
Henna's cooling properties made it ideal for the palms and soles of the feet in hot climates — a practical beauty discovery.
In ancient Arabia, henna was part of marriage ceremonies — the bride stained with henna to mark her transition.
The Indus Valley civilisation (3000–1500 BCE) shows evidence of henna use, suggesting simultaneous development or very early trade transmission.`,
    modernLegacy: 'Mehndi (South Asian henna art), Moroccan henna, Sudanese henna — all branches of one ancient tradition. The art form evolved differently in each culture.',
    ingredients: ['Lawsonia inermis leaves', 'lemon juice (citric acid activator)', 'essential oils (eucalyptus, lavender)'],
    significance: 'One of the oldest cosmetic traditions in human history — still alive in billions of celebrations today.',
    tags: ['henna', 'mehndi', 'ancient', 'egypt', 'arab', 'south-asian', 'body-art'],
  },

  ancient_rome_fragrance: {
    id: 'ancient_rome_fragrance',
    title: 'Ancient Arab Perfumery and the Spice Routes',
    era: 'ancient',
    community: 'arab',
    period: 'c. 2000 BCE – 700 CE',
    location: 'Arabia Felix, Persia, India trade routes',
    summary: 'Arab traders controlled the incense and perfume trade routes. The words "perfume" and "alcohol" both entered English through Arabic.',
    details: `Arabia Felix (modern Yemen) was the source of frankincense and myrrh — the two most valuable commodities of the ancient world, traded throughout Egypt, Rome, Greece, and China.
The word "alcohol" comes from Arabic "al-kohl" — the same root as kohl. Arabic alchemists developed distillation, making concentrated fragrance possible.
Ibn Sina (Avicenna, 980–1037 CE) refined steam distillation to produce rosewater and essential oils — the foundation of modern perfumery.
Oud (agarwood resin) was the ultimate luxury fragrance, documented in Arabian poetry from 500 CE.`,
    modernLegacy: 'Arab perfumery remains the global standard for deep, resinous fragrance. Oud is now among the world\'s most expensive perfume ingredients.',
    ingredients: ['frankincense (Boswellia sacra)', 'myrrh', 'oud (Aquilaria)', 'rose', 'amber (ambergris)'],
    significance: 'Without Arab perfumery and alchemical distillation, modern fragrance would not exist.',
    tags: ['fragrance', 'oud', 'arab', 'ancient', 'trade-routes', 'frankincense', 'perfumery'],
  },

  // ── ANCIENT INDIA ────────────────────────────────────────────────────────

  ayurveda_origins: {
    id: 'ayurveda_origins',
    title: 'Ayurveda: Beauty as Medicine',
    era: 'ancient',
    community: 'south-asian',
    period: 'c. 1500–400 BCE',
    location: 'Vedic India',
    summary: 'The Vedas (sacred Hindu texts) contain the earliest Ayurvedic beauty prescriptions — beauty and health as inseparable.',
    details: `The Atharvaveda (c. 1200–1000 BCE) contains beauty formulas — for healthy skin, lustrous hair, and long life.
Charaka Samhita (c. 600 BCE) systematises Ayurvedic medicine including skin and hair treatments — divided into Vata, Pitta, and Kapha types.
Sesame, coconut, and amla were documented as hair oils. Turmeric as skin treatment. Sandalwood as cooling paste.
The concept of Dinacharya (daily self-care routine) — including tongue scraping, oil pulling, self-massage (Abhyanga) — predates modern wellness routines by 3,000 years.`,
    modernLegacy: 'Ayurveda remains active in India and has influenced global wellness. The dosha system is the basis of personalised beauty routines in South Asian culture.',
    ingredients: ['amla', 'brahmi', 'bhringraj', 'turmeric', 'neem', 'sesame oil', 'sandalwood'],
    significance: 'The first personalised beauty system — beauty recommendations based on individual constitution, not one-size-fits-all.',
    tags: ['ayurveda', 'south-asian', 'ancient', 'vedic', 'wellness', 'personalised'],
  },

  haldi_ceremony: {
    id: 'haldi_ceremony',
    title: 'The Haldi Ceremony: Turmeric Ritual Before Marriage',
    era: 'ancient',
    community: 'south-asian',
    period: 'c. 1000 BCE – present',
    location: 'South Asia (India, Pakistan, Bangladesh, Nepal)',
    summary: 'The pre-wedding haldi ceremony covers the bride and groom with turmeric paste for purification, auspiciousness, and skin brightness.',
    details: `Haldi (turmeric in Hindi) paste — turmeric, sandalwood, rosewater, and milk — is applied to the bride and groom by family members before the wedding.
The ceremony has religious significance (turmeric is sacred in Hinduism, associated with Vishnu and Lakshmi) and practical beauty effects.
Curcumin in turmeric reduces inflammation, brightens skin, and gives a temporary golden glow — the original "prewedding facial."
Different regional traditions: in Rajasthan, multani mitti (Fuller's earth) is added; in South India, coconut oil is the carrier; in Punjab, mustard oil.`,
    modernLegacy: 'The haldi ceremony is now one of the most photographed pre-wedding events globally. Turmeric-based beauty products have exploded in the global market.',
    ingredients: ['turmeric (haldi)', 'sandalwood paste (chandan)', 'rosewater', 'milk', 'besan (gram flour)'],
    significance: 'The world\'s oldest documented pre-wedding beauty ritual — proving that ceremony and beauty have always been inseparable.',
    tags: ['haldi', 'turmeric', 'south-asian', 'wedding', 'ceremony', 'ancient', 'ritual'],
  },

  // ── WEST AFRICA ──────────────────────────────────────────────────────────

  shea_butter_history: {
    id: 'shea_butter_history',
    title: 'Shea Butter: From Queen Cleopatra to Modern Skincare',
    era: 'ancient',
    community: 'west-african',
    period: 'c. 1400 BCE – present',
    location: 'West Africa (Ghana, Mali, Burkina Faso, Nigeria)',
    summary: 'Shea butter (karité) has been a beauty, food, and ceremonial substance in West Africa for thousands of years. Ancient Egyptian records describe importing it.',
    details: `Shea (Vitellaria paradoxa) grows only in the Sahel region of West Africa — a 5,000km stretch across 19 countries.
Ancient Egyptian texts reference "karité" (the name still used in French) as an imported luxury — Egypt imported shea from West Africa.
The Songhai and Mali empires (800–1600 CE) had organised shea production — a major commodity of the trans-Saharan trade.
Shea is harvested exclusively by women in West Africa — a matrilineal economic tradition that has sustained women's cooperatives for centuries.
The processing is entirely handmade: roasting the nuts, grinding, boiling, and cooling to separate the butter.`,
    modernLegacy: 'Shea butter is now in nearly every moisturiser sold globally — but its West African origin and the women who produce it are rarely acknowledged.',
    ingredients: ['Vitellaria paradoxa (shea tree nuts)'],
    significance: 'The world\'s most-used natural cosmetic ingredient. An African invention that globalised — without its African story being told.',
    tags: ['shea', 'west-african', 'ancient', 'ghana', 'mali', 'women-led', 'heritage'],
  },

  african_black_soap: {
    id: 'african_black_soap',
    title: 'Ose Dudu: The Original Black Soap',
    era: 'medieval',
    community: 'west-african',
    period: 'c. 1000 CE – present',
    location: 'Yorubaland (Nigeria/Benin), Ghana',
    summary: 'African black soap (ose dudu in Yoruba, anago samina in Ghana) is made from plantain skin ash and shea butter — one of the oldest cleansing formulas in the world.',
    details: `Ose dudu literally means "black soap" in Yoruba. The process: sun-dry and roast plantain skins, palm leaves, or cocoa pods until ash forms. The ash is then combined with shea butter, palm oil, and water.
The alkalinity from the ash creates natural saponification — soap — in the same chemical process as modern soap, discovered independently in West Africa.
Used medicinally for skin conditions, ceremonially for purification, and daily as the cleanser of choice across Yoruba culture.
Genuine ose dudu is still made by hand in Nigeria — it smells earthy, is soft, and is very different from the industrially processed "African black soap" sold in the West.`,
    modernLegacy: 'Mass-produced versions are now global bestsellers. The original hand-made versions from Nigerian and Ghanaian producers are still available and superior.',
    ingredients: ['plantain skin ash', 'shea butter', 'palm oil', 'water', 'cocoa pod ash (variant)'],
    significance: 'An independent discovery of soap-making in West Africa — proving that cleansing science was not a Western invention.',
    tags: ['african-black-soap', 'ose-dudu', 'west-african', 'yoruba', 'soap', 'cleanser', 'ancient'],
  },

  // ── COLONIAL IMPACT ON BEAUTY ─────────────────────────────────────────────

  colonial_beauty_standards: {
    id: 'colonial_beauty_standards',
    title: 'Colonialism and the Imposition of Eurocentric Beauty',
    era: 'colonial',
    community: 'all',
    period: '1500–1900',
    location: 'Global',
    summary: 'European colonisation imposed white European beauty standards as the global norm — through laws, mission schools, and commercial advertising.',
    details: `Portuguese, Spanish, British, French, and Dutch colonial powers deliberately undermined indigenous beauty traditions.
Mission schools in Africa banned scarification, traditional dress, and body modification — framing African aesthetics as "primitive."
The soap industry (Lever Brothers, later Unilever) explicitly marketed to colonised peoples with imagery suggesting darker skin was unclean.
The "paper bag test" and "brown paper bag test" used in the American South to exclude darker-skinned Black people from venues.
The Merthyr Tydfil case (1950s): West Indian immigrants to Britain were told to straighten their hair for office jobs.`,
    modernLegacy: 'Skin-lightening creams remain a $31B global market — a direct legacy of colonial beauty standards. The natural hair movement is explicitly a decolonial project.',
    ingredients: [],
    significance: 'Understanding the colonial roots of global beauty standards is essential to understanding the ethnic beauty movement as political, not just aesthetic.',
    tags: ['colonialism', 'decolonial', 'beauty-standards', 'history', 'political'],
  },

  // ── THE NATURAL HAIR MOVEMENT ─────────────────────────────────────────────

  natural_hair_movement: {
    id: 'natural_hair_movement',
    title: 'The Natural Hair Movement: Political Beauty',
    era: 'contemporary',
    community: 'black-american',
    period: '2000s–present',
    location: 'USA, UK, global',
    summary: 'The modern natural hair movement — Black women and men embracing unprocessed, non-chemically-relaxed hair — is both a beauty movement and a civil rights statement.',
    details: `The movement emerged online in the 2000s through blogs like NaturallyCurly, CurlyNikki, and YouTube.
The CROWN Act (Create a Respectful and Open World for Natural Hair) was introduced in the US in 2019 — addressing workplace discrimination against natural Black hair.
The "big chop" — cutting off all chemically processed hair to grow natural — became a rite of passage for thousands of women.
The movement has been credited with creating the natural hair product market — worth over $3B as of 2023.
Celebrities like Solange Knowles, Lupita Nyong'o, and Viola Davis normalised Afros, locs, and braids on red carpets.`,
    modernLegacy: 'The natural hair movement changed the beauty industry — forcing brands to expand their product ranges and change their advertising imagery.',
    ingredients: [],
    significance: 'Beauty as political statement. Choosing your natural texture is an act of self-love and resistance against white supremacist beauty standards.',
    tags: ['natural-hair', 'black-american', 'political', 'movement', 'contemporary', 'CROWN-Act'],
  },

  // ── FENTY BEAUTY REVOLUTION ──────────────────────────────────────────────

  fenty_revolution: {
    id: 'fenty_revolution',
    title: 'The Fenty Effect: 40 Shades and the Industry\'s Reckoning',
    era: 'contemporary',
    community: 'black-american',
    period: '2017–present',
    location: 'Global',
    summary: 'Fenty Beauty\'s 40-shade foundation launch in September 2017 permanently changed the beauty industry\'s approach to shade inclusion.',
    details: `Before Fenty Beauty, most foundation ranges topped out at 30 shades — with the darkest shades often coming in single-digit numbers.
Fenty launched with 40 shades across the Fitzpatrick scale — with as many shades at the deep end as at the pale end.
Within weeks of Fenty\'s launch, MAC, Maybelline, L\'Oréal, and others announced expanded shade ranges — the "Fenty Effect."
The brand made $100M in its first 40 days — proving that deep skin tones were an underserved, massive market.
Rihanna specifically cited her Barbadian heritage — seeing women of colour underserved — as her motivation.`,
    modernLegacy: 'The "Fenty Effect" is now a term in the beauty industry for a brand forcing structural change. It remains the single most influential product launch in 21st century beauty.',
    ingredients: [],
    significance: 'The moment that proved inclusive beauty is not charity — it\'s business. One brand changed an entire industry.',
    tags: ['fenty', 'inclusive', 'shade-range', 'rihanna', 'revolution', 'contemporary', 'industry'],
  },

};

// ─── QUERY FUNCTIONS ─────────────────────────────────────────────────────────

export function getHistoryEntry(id) {
  return BEAUTY_HISTORY[id] || null;
}

export function getHistoryForCommunity(communityId) {
  return Object.values(BEAUTY_HISTORY).filter(h => h.community === communityId || h.community === 'all');
}

export function getHistoryByEra(era) {
  return Object.values(BEAUTY_HISTORY).filter(h => h.era === era);
}

export function searchHistoryByTag(tag) {
  const norm = tag.toLowerCase();
  return Object.values(BEAUTY_HISTORY).filter(h =>
    (h.tags || []).some(t => t.includes(norm))
  );
}

export function getAllHistoryEntries() {
  return Object.values(BEAUTY_HISTORY);
}

export const BEAUTY_HISTORY_STATS = {
  totalEntries: Object.keys(BEAUTY_HISTORY).length,
  eras: Object.keys(BEAUTY_ERAS).length,
  communities: [...new Set(Object.values(BEAUTY_HISTORY).map(h => h.community))],
  ancientEntries: Object.values(BEAUTY_HISTORY).filter(h => h.era === 'ancient').length,
  contemporaryEntries: Object.values(BEAUTY_HISTORY).filter(h => h.era === 'contemporary').length,
};

