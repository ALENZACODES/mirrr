/**
 * Demo profiles for MIRRR — curated seeds so the demo works
 * without a Qloo API key.
 */

export const DEMO_PROFILES = {
  afrobeats: {
    profile: 'afrobeats',
    label: 'Afrobeats & Naija',
    entities: [
      { id: 'demo-1', name: 'Burna Boy', type: 'urn:entity:artist', input: 'Burna Boy' },
      { id: 'demo-2', name: 'Nollywood', type: 'urn:entity:destination', input: 'Nollywood' },
      { id: 'demo-3', name: 'Amapiano', type: 'urn:entity:artist', input: 'Amapiano' },
    ],
    tags: [
      { name: 'afrobeats' }, { name: 'naija' }, { name: 'west africa' },
      { name: 'lagos' }, { name: 'ankara' }, { name: 'kente' },
      { name: 'nollywood' }, { name: 'editorial' }, { name: 'glam' },
    ],
    freeText: ['West African beauty', 'Ankara fashion', 'editorial glam'],
  },

  hiphop: {
    profile: 'hiphop',
    label: 'Hip Hop & Urban',
    entities: [
      { id: 'demo-4', name: 'Hip Hop', type: 'urn:entity:artist', input: 'Hip Hop' },
      { id: 'demo-5', name: 'R&B', type: 'urn:entity:artist', input: 'R&B' },
    ],
    tags: [
      { name: 'hip hop' }, { name: 'r&b' }, { name: 'urban' },
      { name: 'trap' }, { name: 'baddie' }, { name: 'streetwear' },
      { name: 'drip' }, { name: 'glam' },
    ],
    freeText: ['Black beauty', 'urban glam', 'bone straight wig'],
  },

  bollywood: {
    profile: 'bollywood',
    label: 'Bollywood & Desi',
    entities: [
      { id: 'demo-6', name: 'Bollywood', type: 'urn:entity:destination', input: 'Bollywood' },
      { id: 'demo-7', name: 'Bhangra', type: 'urn:entity:artist', input: 'Bhangra' },
    ],
    tags: [
      { name: 'bollywood' }, { name: 'desi' }, { name: 'south asian' },
      { name: 'indian' }, { name: 'punjabi' }, { name: 'glam' },
      { name: 'jewel tones' }, { name: 'bridal' },
    ],
    freeText: ['South Asian bridal beauty', 'kohl eyes', 'jewel tones'],
  },

  gulf: {
    profile: 'gulf',
    label: 'Gulf & Arabian Glam',
    entities: [
      { id: 'demo-8', name: 'Dubai', type: 'urn:entity:destination', input: 'Dubai' },
      { id: 'demo-9', name: 'Arabic Music', type: 'urn:entity:artist', input: 'Arabic Music' },
    ],
    tags: [
      { name: 'gulf' }, { name: 'khaleeji' }, { name: 'middle east' },
      { name: 'arabic' }, { name: 'dubai' }, { name: 'persian' },
      { name: 'luxury' }, { name: 'kohl' },
    ],
    freeText: ['Gulf beauty', 'kohl eyes', 'luminous skin'],
  },

  caribbean: {
    profile: 'caribbean',
    label: 'Caribbean Carnival',
    entities: [
      { id: 'demo-10', name: 'Dancehall', type: 'urn:entity:artist', input: 'Dancehall' },
      { id: 'demo-11', name: 'Soca', type: 'urn:entity:artist', input: 'Soca' },
    ],
    tags: [
      { name: 'caribbean' }, { name: 'dancehall' }, { name: 'soca' },
      { name: 'carnival' }, { name: 'jamaican' }, { name: 'festival' },
      { name: 'glitter' }, { name: 'tropical' },
    ],
    freeText: ['Caribbean carnival beauty', 'festival glitter', 'sun-kissed'],
  },

  latina: {
    profile: 'latina',
    label: 'Latina Glam',
    entities: [
      { id: 'demo-12', name: 'Reggaeton', type: 'urn:entity:artist', input: 'Reggaeton' },
      { id: 'demo-13', name: 'Salsa', type: 'urn:entity:artist', input: 'Salsa' },
    ],
    tags: [
      { name: 'latin' }, { name: 'latina' }, { name: 'reggaeton' },
      { name: 'salsa' }, { name: 'tropical' }, { name: 'bold' },
      { name: 'bronze' },
    ],
    freeText: ['Latina beauty', 'bronzed glow', 'bold red lip'],
  },

  kbeauty: {
    profile: 'kbeauty',
    label: 'K-Beauty & Seoul',
    entities: [
      { id: 'demo-14', name: 'K-pop', type: 'urn:entity:artist', input: 'K-pop' },
      { id: 'demo-15', name: 'Seoul', type: 'urn:entity:destination', input: 'Seoul' },
    ],
    tags: [
      { name: 'k-beauty' }, { name: 'k-pop' }, { name: 'korean' },
      { name: 'glass skin' }, { name: 'dewy' }, { name: 'seoul' },
      { name: 'idol' }, { name: 'hallyu' },
    ],
    freeText: ['K-beauty glass skin', 'dewy finish', 'gradient lip'],
  },
};
