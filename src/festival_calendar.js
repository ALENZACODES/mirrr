/**
 * festival_calendar.js — Multicultural beauty calendar for MIRRR
 * Major festivals, cultural moments, and beauty traditions for all 9 communities
 */

// ─── FESTIVAL MONTHS ─────────────────────────────────────────────────────────

export const MONTHS = {
  '1':  { id: 1,  name: 'January',   short: 'Jan', season: 'winter' },
  '2':  { id: 2,  name: 'February',  short: 'Feb', season: 'winter' },
  '3':  { id: 3,  name: 'March',     short: 'Mar', season: 'spring' },
  '4':  { id: 4,  name: 'April',     short: 'Apr', season: 'spring' },
  '5':  { id: 5,  name: 'May',       short: 'May', season: 'spring' },
  '6':  { id: 6,  name: 'June',      short: 'Jun', season: 'summer' },
  '7':  { id: 7,  name: 'July',      short: 'Jul', season: 'summer' },
  '8':  { id: 8,  name: 'August',    short: 'Aug', season: 'summer' },
  '9':  { id: 9,  name: 'September', short: 'Sep', season: 'fall'   },
  '10': { id: 10, name: 'October',   short: 'Oct', season: 'fall'   },
  '11': { id: 11, name: 'November',  short: 'Nov', season: 'fall'   },
  '12': { id: 12, name: 'December',  short: 'Dec', season: 'winter' },
};

// ─── FESTIVAL DATABASE ────────────────────────────────────────────────────────

export const FESTIVALS = {

  // ═══════════════════════════════════════════════════════════════════════════
  // WEST AFRICAN
  // ═══════════════════════════════════════════════════════════════════════════

  durbar_kano: {
    id: 'durbar_kano',
    name: 'Durbar Festival',
    community: 'west-african',
    country: 'Nigeria',
    region: 'Kano, Kaduna (northern Nigeria)',
    months: [4, 6, 9],
    description: 'Grand royal procession in northern Nigeria honouring the Emir, featuring ornate horse riders, drummers, and colourful garb.',
    beautyTradition: 'Hausa women traditionally apply henna (lali) in intricate geometric patterns, kohl-rimmed eyes (tiro), and gele headwraps in vibrant silk.',
    recommendedLooks: ['asoebi_glam', 'gele_bridal'],
    colourPalette: ['#8B0000', '#DAA520', '#006400', '#800080'],
    hairTraditions: 'Gele (headwrap), wigs under net, traditional braided updos with gold pins',
    skincareTip: 'Pre-festival shea butter mask the night before for deep glow.',
    significance: 'Islamic festival celebrating Eid with royal pageantry',
    beautyRituals: [
      'Henna application (lali) — geometric hands and feet',
      'Kohl eye application with traditional tiro stick',
      'Shea butter body glow application',
      'Gold jewellery as beauty statement',
    ],
    products: ['Shea butter', 'Black kohl', 'Henna powder', 'Gold-infused oil'],
    tags: ['northern-nigeria', 'durbar', 'hausa', 'henna', 'kohl', 'royal'],
  },

  osun_osogbo: {
    id: 'osun_osogbo',
    name: 'Osun-Osogbo Festival',
    community: 'west-african',
    country: 'Nigeria',
    region: 'Osogbo, Osun State',
    months: [8],
    description: 'UNESCO-recognised festival celebrating the Yoruba river deity Osun. Worshippers dress in white and gold, procession to the sacred grove.',
    beautyTradition: 'Pure white clothing, white chalk (efun) on face and body, turmeric-bright accents and golden jewellery. Hair in owo-pele or traditional updo.',
    recommendedLooks: ['asoebi_glam'],
    colourPalette: ['#FFFFFF', '#DAA520', '#FFF9C4', '#FFD700'],
    hairTraditions: 'White fabric headwrap, natural hair adorned with cowrie shells',
    skincareTip: 'Clay mask preparation, hydration for all-day outdoor ritual.',
    significance: 'Spiritual Yoruba water goddess festival',
    beautyRituals: [
      'White efun (chalk) face application — spiritual purification',
      'Ori shea butter applied to hair and scalp',
      'Osun (camwood) body paste for deep red glow on skin',
      'Cowrie shell hair and jewellery adornment',
    ],
    products: ['White efun chalk', 'Osun camwood paste', 'Ori shea butter', 'Cowrie shells'],
    tags: ['yoruba', 'osun', 'white', 'spiritual', 'sacred-grove', 'UNESCO'],
  },

  chale_wote: {
    id: 'chale_wote',
    name: 'Chale Wote Street Art Festival',
    community: 'west-african',
    country: 'Ghana',
    region: 'Jamestown, Accra',
    months: [8],
    description: 'Accra\'s famous annual street art and culture festival in the historic Jamestown neighbourhood. Art, music, dance, performance and radical self-expression.',
    beautyTradition: 'Body painting, face art inspired by Adinkra symbols, Kente-pattern graphic liner, Afrofuturism aesthetics.',
    recommendedLooks: ['nigerian_editorial', 'afrobeats_festival'],
    colourPalette: ['#FFD700', '#E63946', '#1D3461', '#2DC653'],
    hairTraditions: 'Natural hair, loc\'d hair, creative colour — bold and political',
    skincareTip: 'Sweat-proof primer and setting spray essential for outdoor festival.',
    significance: 'Leading African street art festival celebrating creativity and cultural heritage',
    beautyRituals: [
      'Adinkra symbol body/face painting (by artists on-site)',
      'Kente-inspired graphic liner art',
      'Bold lip in Pan-African colours (red, gold, green)',
      'Natural hair styling — twist-outs, locs, Bantu knots',
    ],
    products: ['Body paint', 'Waterproof liner', 'Setting spray', 'Natural hair gel'],
    tags: ['ghana', 'accra', 'street-art', 'body-painting', 'afrofuturism', 'kente'],
  },

  lagos_carnival: {
    id: 'lagos_carnival',
    name: 'Lagos Carnival',
    community: 'west-african',
    country: 'Nigeria',
    region: 'Lagos Island, Lagos',
    months: [4],
    description: 'Annual Lagos street carnival with colourful costumes, music bands, and massive crowd participation along Eko Bridge.',
    beautyTradition: 'Rhinestone face art, vivid Yoruba-inspired makeup, tropical neon palette, full body glitter.',
    recommendedLooks: ['afrobeats_festival', 'nigerian_editorial'],
    colourPalette: ['#FF4500', '#7FFF00', '#FF69B4', '#FFD700'],
    hairTraditions: 'Wigs in neon, natural afro adorned with glitter, protective styles',
    skincareTip: 'Waterproof everything — humidity and sweat are intense.',
    significance: 'Pan-African cultural celebration at Easter',
    beautyRituals: [
      'Body glitter application',
      'Rhinestone face art',
      'Neon lip in vivid tropical shades',
      'Temporary hair colour spray',
    ],
    products: ['Body glitter', 'Rhinestones', 'Waterproof liner', 'Neon pigment'],
    tags: ['lagos', 'carnival', 'rhinestone', 'neon', 'glitter', 'parade'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUTH ASIAN
  // ═══════════════════════════════════════════════════════════════════════════

  diwali: {
    id: 'diwali',
    name: 'Diwali — Festival of Lights',
    community: 'south-asian',
    country: 'India, diaspora worldwide',
    region: 'Pan-Indian',
    months: [10, 11],
    description: 'The most celebrated Hindu festival. Five-day celebration of light over darkness. Lamps (diyas), fireworks, sweets, family gatherings.',
    beautyTradition: 'Jewel-toned makeup mirroring the gold and gems of the occasion. Kohl-heavy eyes, luminous base, deep cranberry or red lip.',
    recommendedLooks: ['south_asian_winter_glam', 'bollywood_bridal'],
    colourPalette: ['#FFD700', '#8B0000', '#006400', '#800080', '#FF6600'],
    hairTraditions: 'Gajra (jasmine flower garland) in hair, ornate dupatta, oiled and braided hair with marigold',
    skincareTip: 'Turmeric mask night before for Diwali glow (ubtan recipe).',
    significance: 'Hindu festival of light, victory of knowledge over ignorance',
    beautyRituals: [
      'Ubtan (turmeric + gram flour + rosewater) face mask preparation',
      'Mehndi/henna on palms',
      'Kajal application — thick and dramatic',
      'Attar (natural perfume) application on wrists and neck',
    ],
    products: ['Ubtan paste', 'Kajal', 'Gold highlighter', 'Attar perfume'],
    tags: ['diwali', 'hindu', 'festival-of-lights', 'jewel', 'gold', 'kohl', 'india'],
  },

  navratri: {
    id: 'navratri',
    name: 'Navratri',
    community: 'south-asian',
    country: 'India',
    region: 'Gujarat especially, all India',
    months: [9, 10],
    description: 'Nine nights of worship of goddess Durga with dandiya/garba dancing, rotating colour-coded dress codes each night.',
    beautyTradition: 'Each of the nine nights has a colour theme — the makeup palette mirrors the day\'s colour. Bold, dance-ready looks for Garba.',
    recommendedLooks: ['mehndi_look', 'south_asian_everyday'],
    colourPalette: ['#FFFF00', '#00FF00', '#808080', '#FF6600', '#FFFFFF', '#FF0000', '#A52A2A', '#FF69B4', '#800080'],
    hairTraditions: 'Traditional bun with flowers and ornaments, fresh jasmine gajra',
    skincareTip: 'Sweat-proof primer essential for 3-hour Garba dancing.',
    significance: 'Nine nights worship of Goddess Durga, Lakshmi, Saraswati',
    beautyRituals: [
      'Matching makeup to nightly colour theme',
      'Sindoor (vermillion) in hair parting',
      'Kajal eye application',
      'Floral gajra in bun',
    ],
    products: ['Kryolan face paint', 'Coloured eyeshadow palette', 'Sweat-proof setting spray', 'Floral hair accessories'],
    tags: ['navratri', 'garba', 'dandiya', 'nine-nights', 'durga', 'gujarat', 'colour-theme'],
  },

  holi: {
    id: 'holi',
    name: 'Holi — Festival of Colours',
    community: 'south-asian',
    country: 'India, Nepal, diaspora worldwide',
    region: 'Pan-Indian',
    months: [3],
    description: 'Vibrant festival celebrating spring, with coloured powder (gulaal) thrown in celebration.',
    beautyTradition: 'Pre-Holi oil barrier on hair and skin. Post-Holi skincare ritual is as important as the celebration itself.',
    recommendedLooks: ['no_makeup_makeup'],
    colourPalette: ['#FF69B4', '#9B59B6', '#3498DB', '#27AE60', '#E74C3C', '#F39C12'],
    hairTraditions: 'Coconut oil applied heavily to hair before celebration, protective styles, head covering',
    skincareTip: 'Apply coconut oil body barrier before playing, so colours wash off easily.',
    significance: 'Arrival of spring, triumph of good over evil (Holika Dahan)',
    beautyRituals: [
      'Pre-Holi oil barrier — coconut oil head to toe',
      'Post-Holi cleanse — ubtan to remove colour',
      'Aloe vera calming mask after celebration',
      'Coconut milk hair mask to restore moisture',
    ],
    products: ['Coconut oil', 'Ubtan paste', 'Aloe vera gel', 'Gentle cleanser'],
    tags: ['holi', 'colours', 'spring', 'powder', 'skincare', 'protective', 'india'],
  },

  eid_south_asian: {
    id: 'eid_south_asian',
    name: 'Eid al-Fitr (South Asian)',
    community: 'south-asian',
    country: 'Pakistan, Bangladesh, India',
    region: 'South Asia',
    months: [3, 4, 5, 6],
    description: 'End of Ramadan celebration. Three days of prayer, family gatherings, new clothes, and festive food.',
    beautyTradition: 'Mehndi the night before, full bridal-adjacent glam on Eid day. Kohl eyes, traditional shalwar kameez, eid chand (moon).',
    recommendedLooks: ['mehndi_look', 'bollywood_bridal'],
    colourPalette: ['#006400', '#FFD700', '#8B0000', '#FFFFFF', '#800080'],
    hairTraditions: 'Hair set in loose curls or bun with ornate pins, fresh flowers',
    skincareTip: 'After a month of early morning (sehri) and late nights, hydrate heavily in the days before Eid.',
    significance: 'Islamic celebration marking end of Ramadan fasting month',
    beautyRituals: [
      'Chand raat mehndi (henna on night before)',
      'Full glam makeup for prayers and family visits',
      'Attar application',
      'Hair setting with ornaments',
    ],
    products: ['Henna cone', 'Kryolan', 'Attar', 'Hair pins'],
    tags: ['eid', 'ramadan', 'mehndi', 'south-asian', 'muslim', 'chand-raat'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CARIBBEAN
  // ═══════════════════════════════════════════════════════════════════════════

  trinidad_carnival: {
    id: 'trinidad_carnival',
    name: 'Trinidad Carnival',
    community: 'caribbean',
    country: 'Trinidad and Tobago',
    region: 'Port of Spain',
    months: [2, 3],
    description: 'The world\'s most spectacular Caribbean carnival. J\'ouvert, Monday Wear, and Mas — three days of costumes, soca, and total celebration.',
    beautyTradition: 'Carnival queens are internationally known for extreme feathered costumes and dramatic makeup. J\'ouvert is body paint and mud.',
    recommendedLooks: ['carnival_queen', 'caribbean_beach'],
    colourPalette: ['#FF0000', '#FFD700', '#00008B', '#FF69B4', '#00FF00'],
    hairTraditions: 'Hair slicked under costume headpiece, wigs for mas, natural hair for J\'ouvert',
    skincareTip: 'Waterproof everything. Moisturise heavily the day before — sweat strips skin.',
    significance: 'Pre-Lent celebration, African diaspora cultural expression',
    beautyRituals: [
      'J\'ouvert: mud and paint body coverage (earthy and raw)',
      'Monday Wear: glitter, gems, sequins',
      'Tuesday Mas: full theatrical costume makeup',
      'Post-carnival: soothing oat bath for mud-stripped skin',
    ],
    products: ['Body paint', 'Sequins', 'Waterproof base', 'Soothing oat cleanser'],
    tags: ['trinidad', 'carnival', 'jouvert', 'mas', 'body-paint', 'soca', 'feathers'],
  },

  notting_hill_carnival: {
    id: 'notting_hill_carnival',
    name: 'Notting Hill Carnival',
    community: 'caribbean',
    country: 'United Kingdom',
    region: 'Notting Hill, London',
    months: [8],
    description: 'Europe\'s largest street festival — a celebration of Caribbean heritage in London. Two million attendees over the bank holiday weekend.',
    beautyTradition: 'London fashion meets Caribbean colour. Rhinestone-studded face art, tropical neon makeup, body jewels.',
    recommendedLooks: ['carnival_queen', 'dancehall_night'],
    colourPalette: ['#FF4500', '#7FFF00', '#FF69B4', '#9400D3', '#FFD700'],
    hairTraditions: 'Wigs in colour, locs adorned, natural hair out and proud',
    skincareTip: 'Two-day outdoor event — reapply SPF throughout and use a face mist.',
    significance: 'London celebration of West Indian community and culture',
    beautyRituals: [
      'Face gem application in flag colours',
      'Body jewel adhesion',
      'Rhinestone under-eye accent',
      'Feather crown creation',
    ],
    products: ['Gems adhesive', 'Body jewels', 'Neon pigment', 'Waterproof liner', 'SPF50'],
    tags: ['notting-hill', 'london', 'carnival', 'rhinestone', 'body-jewels', 'caribbean', 'UK'],
  },

  crop_over: {
    id: 'crop_over',
    name: 'Crop Over',
    community: 'caribbean',
    country: 'Barbados',
    region: 'Bridgetown, Barbados',
    months: [8],
    description: 'Barbados\'s most anticipated festival celebrating the end of the sugar cane harvest. Grand Kadooment is the climactic costume parade.',
    beautyTradition: 'Revealing bikini-style costumes demand waterproof, sweat-proof, ultra-glam makeup. Rihanna aesthetic is a reference.',
    recommendedLooks: ['caribbean_beach', 'carnival_queen'],
    colourPalette: ['#0D47A1', '#FFD700', '#FFFFFF', '#00C853'],
    hairTraditions: 'Wigs, braided cornrows, locs decorated for parade',
    skincareTip: 'Rihanna\'s Fenty skincare prep — hydrate, prime, set waterproof for hours in Barbados heat.',
    significance: 'Barbadian national festival, UNESCO Intangible Cultural Heritage',
    beautyRituals: [
      'Full waterproof base application',
      'Body highlighter on shoulders, legs, collarbone',
      'Beaded braids for costume',
      'Rhinestone chest and face art',
    ],
    products: ['Body highlighter', 'Waterproof base', 'Fenty Beauty', 'Mehron', 'Body Bling'],
    tags: ['barbados', 'crop-over', 'kadooment', 'rihanna', 'barbadian', 'body-highlight'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ARAB
  // ═══════════════════════════════════════════════════════════════════════════

  eid_al_fitr: {
    id: 'eid_al_fitr',
    name: 'Eid al-Fitr',
    community: 'arab',
    country: 'All Muslim-majority countries',
    region: 'MENA and worldwide',
    months: [3, 4, 5, 6],
    description: 'Celebration marking the end of Ramadan. Three days of prayer, visiting family, giving gifts, and beautiful clothing.',
    beautyTradition: 'Gulf Arab Eid beauty is opulent — kohl-heavy eyes, perfect skin, warm nude or rose lip.',
    recommendedLooks: ['khaleeji_glam', 'eid_festive'],
    colourPalette: ['#006400', '#FFD700', '#8B0000', '#FFFFFF'],
    hairTraditions: 'Silk blow-dry, loose waves, or up-do with ornate pins',
    skincareTip: 'After a month of fasting, boost with vitamin C serum and sheet masks in the days before Eid.',
    significance: 'Breaking of the fast — one of the two great Islamic celebrations',
    beautyRituals: [
      'Kohl eye preparation with kajal or kohl pencil',
      'Oud perfume application (strong and lasting)',
      'Henna application on hands (not universal but popular)',
      'Full glam makeup for family visits',
    ],
    products: ['Huda Beauty', 'Kohl pencil', 'Oud perfume', 'Sheet mask', 'Vitamin C serum'],
    tags: ['eid', 'ramadan', 'arab', 'gulf', 'kohl', 'oud', 'celebration', 'iftar'],
  },

  eid_al_adha: {
    id: 'eid_al_adha',
    name: 'Eid al-Adha',
    community: 'arab',
    country: 'All Muslim-majority countries',
    region: 'MENA and worldwide',
    months: [6, 7, 8, 9],
    description: 'The Feast of Sacrifice — honouring Ibrahim\'s willingness to sacrifice his son. Four days of prayer, community, and gathering.',
    beautyTradition: 'Modest yet celebratory. Cream-based makeup for humid summer weather, classic kohl, warm neutral lips.',
    recommendedLooks: ['khaleeji_glam', 'arab_nude_sophistication'],
    colourPalette: ['#006400', '#FFD700', '#8B0000', '#FFFFFF'],
    hairTraditions: 'Hijab styling for those who wear it; elegant updos or loose blow-dry',
    skincareTip: 'Summer heat demands SPF and long-wear base — use primer, bake under eyes.',
    significance: 'Second of the two great Islamic Eid celebrations, commemorating Ibrahim\'s sacrifice',
    beautyRituals: [
      'Kohl eye ritual',
      'Oud or musk perfume',
      'Classic modest glam',
      'Henna on hands (popular in Morocco, Egypt)',
    ],
    products: ['Kryolan', 'Kohl', 'Oud attar', 'Setting spray'],
    tags: ['eid-al-adha', 'adha', 'arab', 'sacrifice', 'celebration', 'kohl'],
  },

  arabic_wedding_season: {
    id: 'arabic_wedding_season',
    name: 'Arab Wedding Season',
    community: 'arab',
    country: 'All Arab countries',
    region: 'MENA and diaspora',
    months: [5, 6, 10, 11, 12],
    description: 'Arab weddings are elaborate multi-day events with distinct beauty looks for each evening. Henna night, wedding night, and day-after gatherings.',
    beautyTradition: 'Three-night event beauty progression: henna night (colourful, relaxed), wedding night (full bridal opulence), celebration night (bold and festive).',
    recommendedLooks: ['khaleeji_glam', 'levantine_everyday'],
    colourPalette: ['#FFD700', '#8B0000', '#C0C0C0', '#800080', '#FFFFFF'],
    hairTraditions: 'Brides: elaborate up-do with ornaments or half-up. Guests: loose waves or glam up-do.',
    skincareTip: 'Multi-day event — avoid exfoliation day of, prep skin with mask night before.',
    significance: 'Marriage celebration as major cultural and social event',
    beautyRituals: [
      'Henna night: mehndi application, colourful loose look',
      'Bridal: full face kohl + jewel eye + perfect base',
      'Zaffa (wedding entrance): dramatic glam',
      'Bakhoor incense for hair scenting',
    ],
    products: ['Huda Beauty', 'Kohl', 'Bakhoor incense', 'Heavy coverage foundation'],
    tags: ['arab-wedding', 'zaffa', 'henna-night', 'bridal', 'three-day', 'arab'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LATINA
  // ═══════════════════════════════════════════════════════════════════════════

  day_of_the_dead: {
    id: 'day_of_the_dead',
    name: 'Día de los Muertos',
    community: 'latina',
    country: 'Mexico, Chicano USA',
    region: 'Mexico and Mexican-American communities',
    months: [11],
    description: 'Mexican holiday honouring deceased family members. Marigold-strewn altars, sugar skull face painting, and spiritual celebration.',
    beautyTradition: 'La Catrina sugar skull face painting — black and white base with floral and skull motifs in vivid colour.',
    recommendedLooks: ['mexica_inspired'],
    colourPalette: ['#F4A460', '#000000', '#FFFFFF', '#FF4500', '#9B59B6', '#FFD700'],
    hairTraditions: 'Marigold flowers woven into hair, braided crown (trenza corona), calavera hair accessories',
    skincareTip: 'White face paint as base — use skin prep and primer under it for longevity.',
    significance: 'Indigenous Aztec + Catholic All Souls Day — honouring the dead',
    beautyRituals: [
      'La Catrina white base face painting',
      'Skull/floral motif face art',
      'Marigold crown hair creation',
      'Bold red or black lip',
    ],
    products: ['White face paint', 'Black face paint', 'Kryolan palette', 'Ben Nye', 'Marigold flowers'],
    tags: ['day-of-the-dead', 'dia-de-muertos', 'catrina', 'sugar-skull', 'mexico', 'marigold', 'face-paint'],
  },

  quinceañera_season: {
    id: 'quinceañera_season',
    name: 'Quinceañera Season',
    community: 'latina',
    country: 'Mexico, Latin America, USA diaspora',
    region: 'Pan-Latin',
    months: [5, 6, 7, 8],
    description: 'Coming-of-age celebration for 15-year-old girls — like a Sweet 16 + Catholic mass. Summer is prime quinceañera season.',
    beautyTradition: 'Princess-meets-glam makeup. The quince girl and her court (chambelanes and damas) coordinate looks.',
    recommendedLooks: ['quinceañera_glam'],
    colourPalette: ['#FFB6C1', '#FFFFFF', '#FFD700', '#800080', '#87CEEB'],
    hairTraditions: 'Quinceañera: elaborate up-do with tiara, fresh flowers. Damas: matching half-up styles.',
    skincareTip: 'Prep skin with facials 2 weeks before — the ceremony photos last a lifetime.',
    significance: 'Rite of passage marking a girl\'s transition to young womanhood',
    beautyRituals: [
      'Pre-quince facial and skin prep',
      'Airbrush foundation for photography',
      'Rhinestone hair embellishment',
      'Coordinated court makeup',
    ],
    products: ['Airbrush foundation', 'Rhinestones', 'Tiaras', 'Coordinated eyeshadow palette'],
    tags: ['quinceañera', '15-años', 'coming-of-age', 'princess', 'latina', 'celebration'],
  },

  carnaval_rio: {
    id: 'carnaval_rio',
    name: 'Carnaval (Brazil)',
    community: 'latina',
    country: 'Brazil',
    region: 'Rio de Janeiro, São Paulo, Salvador',
    months: [2, 3],
    description: 'World-famous Brazilian Carnaval — samba, feathers, sequins, and spectacular Sambadrome parades.',
    beautyTradition: 'Exuberant samba queen makeup: feathered headdresses, rhinestone-studded faces, bronzed skin, and the most vivid body glitter possible.',
    recommendedLooks: ['carnival_queen', 'disco_bliss'],
    colourPalette: ['#FFFF00', '#009C3B', '#3B2F8B', '#00A6B5', '#FF69B4'],
    hairTraditions: 'Hair hidden under elaborate feather headdresses or pulled tight in dancers\' buns',
    skincareTip: 'Brazilian beauty: bronze and glow is the goal — use self-tan and body highlight weeks before.',
    significance: 'Pre-Lent celebration of samba culture, Afro-Brazilian heritage, and joy',
    beautyRituals: [
      'Body glitter application from neck to toe',
      'Rhinestone face adhesion',
      'Brazilian bronze body glow',
      'Feather headdress fitting',
    ],
    products: ['Body glitter', 'Rhinestones', 'Self-tanning lotion', 'Body Bling', 'Mehron'],
    tags: ['carnaval', 'rio', 'brazil', 'samba', 'glitter', 'feathers', 'rhinestone', 'body-glow'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EAST ASIAN
  // ═══════════════════════════════════════════════════════════════════════════

  chinese_new_year: {
    id: 'chinese_new_year',
    name: 'Chinese New Year (Lunar New Year)',
    community: 'east-asian',
    country: 'China, Taiwan, diaspora worldwide',
    region: 'Pan-East Asian',
    months: [1, 2],
    description: 'The most important Chinese cultural celebration. 15-day festival with family reunions, red packets, fireworks, and red-dominant beauty.',
    beautyTradition: 'Red lipstick for good fortune. Red or gold eyeshadow, luminous skin, classic Chinese beauty aesthetic.',
    recommendedLooks: ['cn_festival_traditional', 'k_beauty_glass'],
    colourPalette: ['#FF0000', '#FFD700', '#FFFFFF', '#FF4500'],
    hairTraditions: 'Traditional: hair pinned up in ornate hairstyle. Modern: sleek and elegant',
    skincareTip: 'Begin 10-step Korean skincare routine 2 weeks before for maximum glow at New Year gatherings.',
    significance: 'Lunar New Year, family reunion, new beginnings',
    beautyRituals: [
      'Red lipstick application — traditional good luck',
      'Luminous base for family photos',
      'Gold accent for prosperity symbolism',
      'Traditional hair ornaments (zan, chai) for formal events',
    ],
    products: ['SK-II Facial Treatment Essence', 'Red lipstick', 'Gold highlighter', 'Sheet mask'],
    tags: ['chinese-new-year', 'lunar-new-year', 'red', 'gold', 'prosperity', 'family', 'spring-festival'],
  },

  cherry_blossom_hanami: {
    id: 'cherry_blossom_hanami',
    name: 'Cherry Blossom (Hanami)',
    community: 'east-asian',
    country: 'Japan',
    region: 'Pan-Japan',
    months: [3, 4],
    description: 'Japanese tradition of picnicking under cherry blossom trees. Soft, feminine, nature-inspired beauty.',
    beautyTradition: 'Delicate sakura pink tones, dewy skin, understated natural beauty honouring the transience of the blossoms.',
    recommendedLooks: ['k_beauty_glass', 'no_makeup_makeup'],
    colourPalette: ['#FFB7C5', '#FFFFFF', '#FAD0C4', '#FFC3A0', '#E75480'],
    hairTraditions: 'Sakura flowers in hair, loose buns with pins, soft romantic waves',
    skincareTip: 'Japanese beauty for spring: camellia oil to counter late-season cold and dry air.',
    significance: 'Celebration of impermanence (mono no aware) — Japanese philosophical beauty',
    beautyRituals: [
      'Sakura extract mask the morning of',
      'Camellia oil face massage',
      'Soft sakura pink on cheeks and lips',
      'Real or artificial cherry blossom hair pin',
    ],
    products: ['SK-II Sakura essence', 'DHC camellia oil', 'Shiseido', 'Canmake Glow Fleur Cheeks'],
    tags: ['hanami', 'sakura', 'cherry-blossom', 'japan', 'spring', 'pink', 'dewy'],
  },

  chuseok: {
    id: 'chuseok',
    name: 'Chuseok (Korean Harvest Festival)',
    community: 'east-asian',
    country: 'South Korea, North Korea',
    region: 'Korea',
    months: [9, 10],
    description: 'Major Korean harvest festival (similar to Thanksgiving). Family gathering, traditional hanbok clothing, ancestral rites.',
    beautyTradition: 'Hanbok-complementary makeup: light monochromatic tones, traditional Korean minimalism meets modern idol influence.',
    recommendedLooks: ['k_beauty_glass', 'jk_idol_glam'],
    colourPalette: ['#C3A6FF', '#A8E6CF', '#FDFFB6', '#FFD3A5', '#FFFFFF'],
    hairTraditions: 'Traditional: Chignon with Daenggi ribbon and binyeo pin. Modern: elegant loose bun.',
    skincareTip: 'Chuseok travel means disrupted skincare — pack your essence and light moisturiser.',
    significance: 'Korean thanksgiving and ancestral respect festival',
    beautyRituals: [
      'Light hanbok-complementary monochromatic makeup',
      'Binyeo (hair pin) placement for traditional styling',
      'Daenggi ribbon bow for hair',
      'Soft powder sunscreen for outdoor activities',
    ],
    products: ['Sulwhasoo', '3CE', 'ROMAND', 'Laneige Water Sleeping Mask'],
    tags: ['chuseok', 'korean', 'harvest', 'hanbok', 'daenggi', 'monochromatic'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EAST AFRICAN
  // ═══════════════════════════════════════════════════════════════════════════

  timkat_ethiopia: {
    id: 'timkat_ethiopia',
    name: 'Timkat (Ethiopian Epiphany)',
    community: 'east-african',
    country: 'Ethiopia',
    region: 'Ethiopia (Lalibela, Gondar, Addis Ababa)',
    months: [1],
    description: 'Ethiopian Orthodox Christian festival celebrating baptism of Jesus. Largest in Gondar and Lalibela. Processions, water, white clothing.',
    beautyTradition: 'White traditional habesha dress (netela) with coloured border. Kohl eyes and natural glow are traditional. Gold cross jewellery.',
    recommendedLooks: ['ethiopian_bridal'],
    colourPalette: ['#FFFFFF', '#FFD700', '#FF0000', '#00BFFF', '#008000'],
    hairTraditions: 'Traditional Ethiopian braids with gold accessories, or natural afro adorned for ceremony',
    skincareTip: 'Ethiopian niter kibbeh (spiced butter) is traditionally used as a skin moisturiser and hair treatment.',
    significance: 'Ethiopian Epiphany — most significant religious celebration in Ethiopian Orthodox calendar',
    beautyRituals: [
      'Niter kibbeh hair and scalp treatment',
      'Kohl application (traditional)',
      'White netela arrangement',
      'Gold cross jewellery display',
    ],
    products: ['Niter kibbeh', 'Kohl', 'Ethiopian butter', 'Gold jewellery'],
    tags: ['timkat', 'ethiopia', 'orthodox', 'white', 'kohl', 'epiphany', 'habesha'],
  },

  eid_east_africa: {
    id: 'eid_east_africa',
    name: 'Eid (East Africa)',
    community: 'east-african',
    country: 'Kenya, Tanzania, Somalia, Djibouti',
    region: 'East African coastal and inland Muslim communities',
    months: [3, 4, 5, 6],
    description: 'Eid celebrations in Swahili coastal communities have distinct traditions blending Arab, Indian Ocean, and Bantu influences.',
    beautyTradition: 'Swahili Eid: udi incense scenting of clothing and hair, henna, kohl, bright kangas.',
    recommendedLooks: ['ethiopian_bridal', 'kenyan_editorial'],
    colourPalette: ['#006400', '#FFD700', '#8B0000', '#FFFFFF', '#00CED1'],
    hairTraditions: 'Swahili: elaborate plaited styles, gold ornaments, perfumed with udi incense',
    skincareTip: 'Coastal humidity means matte-finish products will serve you best for Eid gatherings.',
    significance: 'Islamic Eid with unique Swahili and coastal East African cultural fusion',
    beautyRituals: [
      'Udi incense hair and clothing scenting',
      'Henna (Swahili patterns)',
      'Kohl application',
      'Kanga fabric selection and draping',
    ],
    products: ['Udi incense', 'Henna cone', 'Kohl', 'Matte setting powder'],
    tags: ['eid', 'swahili', 'kenya', 'somalia', 'udi', 'henna', 'east-africa'],
  },

  meskel: {
    id: 'meskel',
    name: 'Meskel',
    community: 'east-african',
    country: 'Ethiopia, Eritrea',
    region: 'Ethiopia',
    months: [9],
    description: 'Ethiopian Orthodox festival finding the True Cross. Massive bonfire (Demera) lit in Addis Ababa Meskel Square. Flowers and processions.',
    beautyTradition: 'Yellow Adey Abeba (meskel flower) adorns hair. Traditional clothing in white with bright borders. Kohl and natural glow.',
    recommendedLooks: ['ethiopian_bridal', 'melanin_glow_universal'],
    colourPalette: ['#FFFF00', '#FFFFFF', '#FF0000', '#00A550'],
    hairTraditions: 'Yellow meskel flowers woven into natural or braided hair, netela head covering',
    skincareTip: 'September in Addis Ababa is rainy — use long-wear base to handle humidity.',
    significance: 'Finding of the True Cross — major Ethiopian Orthodox celebration',
    beautyRituals: [
      'Meskel flower hair adornment',
      'White traditional dress preparation',
      'Natural glow skin emphasis',
      'Kohl eye application',
    ],
    products: ['Kohl', 'Yellow flowers', 'Shea butter', 'Long-wear foundation'],
    tags: ['meskel', 'ethiopia', 'orthodox', 'yellow', 'flower', 'demera', 'bonfire'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUTH AFRICAN
  // ═══════════════════════════════════════════════════════════════════════════

  reed_dance_umhlanga: {
    id: 'reed_dance_umhlanga',
    name: 'Reed Dance (Umhlanga)',
    community: 'south-african',
    country: 'Eswatini (Swaziland), South Africa (Zulu)',
    region: 'Southern Africa',
    months: [8, 9],
    description: 'Annual ceremony for young women, presenting themselves to the Queen Mother. Thousands of women walk to collect reeds, then dance before royalty.',
    beautyTradition: 'Traditional: bare chest, colorful beadwork, red ochre (Red Zulu form). Makeup: earth tones, kohl, natural glow.',
    recommendedLooks: ['zulu_bride', 'melanin_glow_universal'],
    colourPalette: ['#8B0000', '#F5DEB3', '#FFD700', '#000000'],
    hairTraditions: 'Hair in traditional Swazi or Zulu styles, headband, natural hair',
    skincareTip: 'Red ochre (umcako) is traditionally applied to skin — modern approximation: red clay mask.',
    significance: 'Annual rite of passage celebrating maidenhood and cultural continuity',
    beautyRituals: [
      'Red ochre (umcako) body application (traditional)',
      'Beadwork jewellery as beauty statement',
      'Earth-toned skin highlight',
      'Traditional hair styling',
    ],
    products: ['Red clay mask', 'Body highlight', 'Shea butter', 'Traditional beadwork'],
    tags: ['reed-dance', 'umhlanga', 'zulu', 'swazi', 'beadwork', 'maiden', 'southern-africa'],
  },

  heritage_day_braai: {
    id: 'heritage_day_braai',
    name: 'Heritage Day / National Braai Day',
    community: 'south-african',
    country: 'South Africa',
    region: 'Pan-South Africa',
    months: [9],
    description: 'September 24 — National Heritage Day celebrating South Africa\'s cultural diversity. Braai (BBQ) brings all communities together.',
    beautyTradition: 'South Africans dress in their cultural best — Zulu, Sotho, Cape Malay, Xhosa, Coloured. Makeup reflects each community\'s heritage.',
    recommendedLooks: ['capetown_street', 'afrikaans_glam', 'amapiano_beat'],
    colourPalette: ['#FFD700', '#000000', '#007A4D', '#FFFFFF', '#DE3831'],
    hairTraditions: 'Xhosa: doek headwrap. Zulu: Isicholo. Cape Malay: dressed. Ndebele: traditional ornament.',
    skincareTip: 'Outdoor braai = sun + smoke. SPF + setting spray combo.',
    significance: 'Celebration of South Africa\'s 11 official languages and rainbow nation heritage',
    beautyRituals: [
      'Traditional multicultural dress selection',
      'SPF application for outdoor day',
      'Cultural hair adornment (doek, isicholo, or headband)',
      'Relaxed but polished makeup for braai',
    ],
    products: ['SPF50', 'Longwear foundation', 'Doek fabric', 'Setting spray'],
    tags: ['heritage-day', 'south-africa', 'braai', 'rainbow-nation', 'zulu', 'xhosa', 'cape-malay'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BLACK AMERICAN
  // ═══════════════════════════════════════════════════════════════════════════

  juneteenth: {
    id: 'juneteenth',
    name: 'Juneteenth',
    community: 'black-american',
    country: 'United States',
    region: 'Pan-American, especially Texas',
    months: [6],
    description: 'National holiday commemorating the end of slavery in the United States. June 19, 1865. Celebrations with red food, music, and Black joy.',
    beautyTradition: 'Pan-African colours (red, black, green) in makeup. Celebration of melanin. Red lip is iconic.',
    recommendedLooks: ['black_girl_magic', 'hbcu_homecoming'],
    colourPalette: ['#FF0000', '#000000', '#008000', '#FFD700'],
    hairTraditions: 'Natural hair celebration — afros, locs, braids, all styles celebrated and visible',
    skincareTip: 'Juneteenth outdoor events — Black Girl Sunscreen SPF50, sun-kissed glow.',
    significance: 'Freedom Day — emancipation of enslaved Black Americans',
    beautyRituals: [
      'Pan-African colour lip (red or deep red)',
      'Natural hair styling and celebration',
      'Melanin glow skin prep',
      'Red, black, green accessory coordination',
    ],
    products: ['Black Girl Sunscreen', 'Bold red lipstick', 'Natural hair product', 'UOMA Beauty'],
    tags: ['juneteenth', 'freedom-day', 'black-american', 'natural-hair', 'pan-african', 'june-19'],
  },

  kwanzaa: {
    id: 'kwanzaa',
    name: 'Kwanzaa',
    community: 'black-american',
    country: 'United States',
    region: 'African-American communities',
    months: [12, 1],
    description: 'Seven-day African-American cultural celebration (Dec 26 – Jan 1) honouring African heritage with seven principles (Nguzo Saba).',
    beautyTradition: 'Pan-African colour palette (red, black, green). Afrocentric fashion — dashikis, kente, head wraps. Natural hair in traditional African styles.',
    recommendedLooks: ['black_girl_magic', 'harlem_renaissance'],
    colourPalette: ['#FF0000', '#000000', '#008000'],
    hairTraditions: 'Loc\'d hair, afro, braids, head wrap (gele or African headwrap). Kente fabric in styling.',
    skincareTip: 'Winter Kwanzaa — boost with shea butter and baobab oil for melanin-rich skin in cold weather.',
    significance: 'African-American celebration of African cultural heritage and Nguzo Saba (seven principles)',
    beautyRituals: [
      'Pan-African lip colour (red, black, deep green nail)',
      'Kente fabric incorporation',
      'Natural hair styling in Afrocentric style',
      'Shea butter body ritual',
    ],
    products: ['Shea butter', 'Juvia\'s Place', 'UOMA', 'Fenty', 'Head wrap fabric'],
    tags: ['kwanzaa', 'pan-african', 'seven-principles', 'black-american', 'december', 'africa'],
  },

  afropunk_festival: {
    id: 'afropunk_festival',
    name: 'Afropunk Festival',
    community: 'black-american',
    country: 'United States, UK, France, South Africa',
    region: 'Brooklyn NY, Atlanta, London, Paris, Johannesburg',
    months: [8, 9],
    description: 'Global alternative music and culture festival celebrating Black creativity outside mainstream norms. Radical self-expression required.',
    beautyTradition: 'The most creative, boundary-breaking beauty on any festival circuit. Body paint, extreme colour, bleached brows, sculptural face art.',
    recommendedLooks: ['afro_punk', 'disco_bliss'],
    colourPalette: ['#9400D3', '#00FF00', '#FF4500', '#000000', '#00BFFF'],
    hairTraditions: 'Every style celebrated: loc\'s in colour, natural afro, mohawks, shaved sides, avant-garde wigs',
    skincareTip: 'Two-day festival — blotting papers + refreshing mist essential for maintaining look.',
    significance: 'Alternative Black cultural space reclaiming rock, punk, and experimental culture',
    beautyRituals: [
      'Bleached brow or coloured brow application',
      'Graphic body paint',
      'Neon eyeshadow pigment',
      'Radical lip (black, electric purple, neon)',
    ],
    products: ['Ben Nye', 'Kryolan', 'Urban Decay', 'Manic Panic', 'Hair colour wax'],
    tags: ['afropunk', 'festival', 'alternative', 'brooklyn', 'radical', 'body-paint', 'neon'],
  },

  hbcu_homecoming_season: {
    id: 'hbcu_homecoming_season',
    name: 'HBCU Homecoming Season',
    community: 'black-american',
    country: 'United States',
    region: 'HBCUs across the American South and East Coast',
    months: [10, 11],
    description: 'HBCU homecoming weekend — the most culturally important Black college event. Tailgates, step shows, parades, concerts, and legendary fashion.',
    beautyTradition: 'School-colour-coordinated makeup, fierce glam, and natural hair styles that command attention.',
    recommendedLooks: ['hbcu_homecoming', 'black_girl_magic'],
    colourPalette: ['#000080', '#FFD700', '#800000', '#FFFFFF', '#FF4500'],
    hairTraditions: 'Every natural hair style, wigs in school colours, protective styles adorned with school spirit accessories',
    skincareTip: 'Week-long events — maintain with blotting powder, setting spray, and touch-up lip.',
    significance: 'Black educational excellence and cultural homecoming tradition',
    beautyRituals: [
      'School-colour eyeshadow coordination',
      'Bold glam for step show',
      'Natural hair styling',
      'School spirit nail colour',
    ],
    products: ['Fenty', 'UOMA', 'Juvia\'s Place', 'Black Girl Sunscreen'],
    tags: ['hbcu', 'homecoming', 'black-college', 'school-spirit', 'step-show', 'fall'],
  },

};

// ─── QUERY FUNCTIONS ─────────────────────────────────────────────────────────

/**
 * Get all festivals for a community
 * @param {string} communityId
 * @returns {Object[]}
 */
export function getFestivalsForCommunity(communityId) {
  return Object.values(FESTIVALS).filter(f => f.community === communityId);
}

/**
 * Get festivals by month
 * @param {number} month 1-12
 * @returns {Object[]}
 */
export function getFestivalsByMonth(month) {
  return Object.values(FESTIVALS).filter(f => f.months.includes(month));
}

/**
 * Get festivals by season
 * @param {string} season 'spring'|'summer'|'fall'|'winter'
 * @returns {Object[]}
 */
export function getFestivalsBySeason(season) {
  const seasonMonths = {
    spring: [3, 4, 5],
    summer: [6, 7, 8],
    fall:   [9, 10, 11],
    winter: [12, 1, 2],
  };
  const months = seasonMonths[season] || [];
  return Object.values(FESTIVALS).filter(f =>
    f.months.some(m => months.includes(m))
  );
}

/**
 * Get a festival by ID
 * @param {string} festivalId
 * @returns {Object|null}
 */
export function getFestivalById(festivalId) {
  return FESTIVALS[festivalId] || null;
}

/**
 * Get upcoming festivals (within next 3 months)
 * @param {number} currentMonth 1-12
 * @returns {Object[]}
 */
export function getUpcomingFestivals(currentMonth) {
  const next3 = [];
  for (let i = 0; i < 3; i++) {
    next3.push(((currentMonth - 1 + i) % 12) + 1);
  }
  return Object.values(FESTIVALS)
    .filter(f => f.months.some(m => next3.includes(m)))
    .sort((a, b) => {
      const aNext = a.months.find(m => next3.includes(m));
      const bNext = b.months.find(m => next3.includes(m));
      return next3.indexOf(aNext) - next3.indexOf(bNext);
    });
}

/**
 * Get beauty rituals for a festival
 * @param {string} festivalId
 * @returns {string[]}
 */
export function getFestivalBeautyRituals(festivalId) {
  const festival = FESTIVALS[festivalId];
  return festival ? festival.beautyRituals : [];
}

/**
 * Get beauty calendar for a community (all festivals, sorted by month)
 * @param {string} communityId
 * @returns {Object} keyed by month number
 */
export function getCommunityBeautyCalendar(communityId) {
  const festivals = getFestivalsForCommunity(communityId);
  const calendar = {};

  for (let m = 1; m <= 12; m++) {
    calendar[m] = festivals.filter(f => f.months.includes(m));
  }

  return calendar;
}

/**
 * Get festivals with specific beauty tradition type
 * @param {string} tag e.g. 'henna', 'kohl', 'body-paint'
 * @returns {Object[]}
 */
export function getFestivalsByBeautyTag(tag) {
  const norm = tag.toLowerCase();
  return Object.values(FESTIVALS).filter(f =>
    f.tags.some(t => t.includes(norm) || norm.includes(t))
  );
}

/**
 * Get festival look recommendations
 * @param {string} festivalId
 * @returns {string[]} look IDs
 */
export function getFestivalLookRecommendations(festivalId) {
  const festival = FESTIVALS[festivalId];
  return festival ? festival.recommendedLooks : [];
}

/**
 * Get festivals by country
 * @param {string} countryKeyword
 * @returns {Object[]}
 */
export function getFestivalsByCountry(countryKeyword) {
  const norm = countryKeyword.toLowerCase();
  return Object.values(FESTIVALS).filter(f =>
    f.country.toLowerCase().includes(norm) || f.region.toLowerCase().includes(norm)
  );
}

/**
 * Get skincare tips for a festival
 * @param {string} festivalId
 * @returns {string}
 */
export function getFestivalSkincareTip(festivalId) {
  const festival = FESTIVALS[festivalId];
  return festival ? festival.skincareTip : '';
}

/**
 * Search festivals by keyword
 * @param {string} keyword
 * @returns {Object[]}
 */
export function searchFestivals(keyword) {
  const norm = keyword.toLowerCase();
  return Object.values(FESTIVALS).filter(f =>
    f.name.toLowerCase().includes(norm) ||
    f.description.toLowerCase().includes(norm) ||
    f.tags.some(t => t.includes(norm))
  );
}

// ─── FESTIVAL STATS ───────────────────────────────────────────────────────────

export const FESTIVAL_STATS = {
  total: Object.keys(FESTIVALS).length,
  communities: [...new Set(Object.values(FESTIVALS).map(f => f.community))],
  busiestMonths: Object.entries(
    Object.values(FESTIVALS).reduce((acc, f) => {
      f.months.forEach(m => { acc[m] = (acc[m] || 0) + 1; });
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([m]) => MONTHS[m].name),
  hennaFestivals: Object.values(FESTIVALS).filter(f => f.tags.includes('henna')).length,
  bodyPaintFestivals: Object.values(FESTIVALS).filter(f => f.tags.includes('body-paint')).length,
  bridalSeasons: Object.values(FESTIVALS).filter(f => f.tags.some(t => t.includes('bridal') || t.includes('wedding'))).length,
};

