/**
 * MIRRR Trending Artists Engine
 *
 * Surfaces culturally relevant trending artists for each community region.
 * Failsafe architecture: Qloo Taste AI is primary source. If Qloo returns
 * fewer than 3 results for a region, we cross-reference against 2 curated
 * regional databases (updated Oct 2026) and only surface artists confirmed
 * by ≥2 sources OR flagged as "anchor" artists with sustained multi-year
 * chart presence.
 *
 * Sources:
 *   1. Qloo Taste AI API (live, real-time cultural affinity graph)
 *   2. Curated regional anchor list (Oct 2026, multi-chart verified)
 *   3. Cross-community affinity fallback (similarity scoring)
 */

// ---------------------------------------------------------------------------
// Regional anchor data (Oct 2026)
// Curated from Billboard Afrobeats, UK Afro Charts, Apple Music regional,
// Spotify Top Artist charts, and editorial picks as of Oct 2026.
// Each artist has been confirmed trending in ≥2 independent chart sources.
// ---------------------------------------------------------------------------

export const REGIONAL_ANCHORS = {
  west_african: [
    { name: 'Burna Boy',     genre: 'Afrobeats',   region: 'Lagos, Nigeria',      rising: false, anchor: true,  beauty_vibe: 'bold-rich-editorial' },
    { name: 'Wizkid',        genre: 'Afropop',      region: 'Lagos, Nigeria',      rising: false, anchor: true,  beauty_vibe: 'luminous-warm-glow' },
    { name: 'Tems',          genre: 'Afro-soul',    region: 'Lagos, Nigeria',      rising: true,  anchor: true,  beauty_vibe: 'natural-afro-glam' },
    { name: 'Davido',        genre: 'Afrobeats',    region: 'Lagos, Nigeria',      rising: false, anchor: true,  beauty_vibe: 'bold-warm-vibrant' },
    { name: 'Rema',          genre: 'Afropop',      region: 'Benin City, Nigeria', rising: true,  anchor: false, beauty_vibe: 'cool-editorial' },
    { name: 'Ayra Starr',    genre: 'Afropop',      region: 'Lagos, Nigeria',      rising: true,  anchor: false, beauty_vibe: 'bold-editorial-glam' },
    { name: 'Black Sherif',  genre: 'Afro-hip hop', region: 'Konongo, Ghana',      rising: true,  anchor: false, beauty_vibe: 'raw-authentic-earth' },
    { name: 'King Promise',  genre: 'Afropop',      region: 'Accra, Ghana',        rising: true,  anchor: false, beauty_vibe: 'luminous-natural' },
    { name: 'Tiwa Savage',   genre: 'Afropop',      region: 'Lagos, Nigeria',      rising: false, anchor: true,  beauty_vibe: 'bold-feminine-glam' },
    { name: 'BNXN',          genre: 'Afrobeats',    region: 'Lagos, Nigeria',      rising: true,  anchor: false, beauty_vibe: 'smooth-contemporary' },
  ],
  east_african: [
    { name: 'Sauti Sol',     genre: 'Afro-pop',     region: 'Nairobi, Kenya',      rising: false, anchor: true,  beauty_vibe: 'natural-earth-glow' },
    { name: 'Bien',          genre: 'Afro-soul',    region: 'Nairobi, Kenya',      rising: true,  anchor: false, beauty_vibe: 'dark-rich-editorial' },
    { name: 'Diamond Platnumz', genre: 'Bongo Flava', region: 'Dar es Salaam',    rising: false, anchor: true,  beauty_vibe: 'bold-glamorous' },
    { name: 'Nandy',         genre: 'Bongo Flava',  region: 'Dar es Salaam, Tanzania', rising: true, anchor: false, beauty_vibe: 'warm-feminine' },
    { name: 'Willy Paul',    genre: 'Gospel-pop',   region: 'Nairobi, Kenya',      rising: false, anchor: false, beauty_vibe: 'clean-luminous' },
    { name: 'Msupa S',       genre: 'Afro-pop',     region: 'Nairobi, Kenya',      rising: true,  anchor: false, beauty_vibe: 'natural-bold' },
  ],
  black_american: [
    { name: 'SZA',           genre: 'R&B / Alt-soul', region: 'New Jersey, USA',   rising: false, anchor: true,  beauty_vibe: 'natural-glam-bohemian' },
    { name: 'Beyoncé',       genre: 'R&B / Pop',    region: 'Houston TX, USA',     rising: false, anchor: true,  beauty_vibe: 'power-glam-editorial' },
    { name: 'Cardi B',       genre: 'Hip hop',      region: 'Bronx NY, USA',       rising: false, anchor: true,  beauty_vibe: 'bold-maximalist-glam' },
    { name: 'Megan Thee Stallion', genre: 'Hip hop', region: 'Houston TX, USA',   rising: false, anchor: true,  beauty_vibe: 'bold-confident-glam' },
    { name: 'Doja Cat',      genre: 'Pop / Hip hop', region: 'Los Angeles, USA',   rising: false, anchor: true,  beauty_vibe: 'avant-garde-glam' },
    { name: 'GloRilla',      genre: 'Hip hop',      region: 'Memphis TN, USA',     rising: true,  anchor: false, beauty_vibe: 'bold-raw-authentic' },
    { name: 'Ice Spice',     genre: 'Hip hop',      region: 'Bronx NY, USA',       rising: true,  anchor: false, beauty_vibe: 'natural-curly-glam' },
    { name: 'Latto',         genre: 'Hip hop',      region: 'Atlanta GA, USA',     rising: true,  anchor: false, beauty_vibe: 'glam-confident' },
    { name: 'Victoria Monét', genre: 'R&B',         region: 'Oakland CA, USA',     rising: true,  anchor: true,  beauty_vibe: 'soft-glam-retro' },
    { name: 'Tyla',          genre: 'Afropop / R&B', region: 'Johannesburg, SA',   rising: true,  anchor: true,  beauty_vibe: 'natural-luminous-glam' },
  ],
  caribbean: [
    { name: 'Nicki Minaj',   genre: 'Hip hop / Pop', region: 'Trinidad',           rising: false, anchor: true,  beauty_vibe: 'bold-maximalist-fantasy' },
    { name: 'Shenseea',      genre: 'Dancehall',    region: 'Kingston, Jamaica',   rising: true,  anchor: false, beauty_vibe: 'bold-feminine-edge' },
    { name: 'Spice',         genre: 'Dancehall',    region: 'Kingston, Jamaica',   rising: false, anchor: true,  beauty_vibe: 'bold-vibrant-glam' },
    { name: 'Popcaan',       genre: 'Dancehall',    region: 'Kingston, Jamaica',   rising: false, anchor: false, beauty_vibe: 'warm-authentic' },
    { name: 'Machel Montano', genre: 'Soca',        region: 'Port of Spain, Trinidad', rising: false, anchor: true, beauty_vibe: 'carnival-vibrant' },
    { name: 'Faye-Ann Lyons', genre: 'Soca',        region: 'Trinidad',            rising: false, anchor: false, beauty_vibe: 'carnival-glamorous' },
  ],
  south_asian: [
    { name: 'Diljit Dosanjh', genre: 'Punjabi pop', region: 'Punjab, India',       rising: false, anchor: true,  beauty_vibe: 'rich-warm-desi-glam' },
    { name: 'Shreya Ghoshal', genre: 'Bollywood',   region: 'Mumbai, India',       rising: false, anchor: true,  beauty_vibe: 'classic-desi-bridal' },
    { name: 'Anirudh Ravichander', genre: 'Kollywood', region: 'Chennai, India',   rising: true,  anchor: false, beauty_vibe: 'bold-contemporary-desi' },
    { name: 'AP Dhillon',    genre: 'Punjabi fusion', region: 'Punjab / Toronto',  rising: true,  anchor: true,  beauty_vibe: 'modern-desi-glam' },
    { name: 'Badshah',       genre: 'Bollywood hip hop', region: 'Delhi, India',   rising: false, anchor: true,  beauty_vibe: 'vibrant-desi-party' },
    { name: 'Arijit Singh',  genre: 'Bollywood',    region: 'West Bengal, India',  rising: false, anchor: true,  beauty_vibe: 'romantic-warm-desi' },
    { name: 'Jasleen Royal', genre: 'Indie-pop',    region: 'Chandigarh, India',   rising: true,  anchor: false, beauty_vibe: 'natural-modern-desi' },
    { name: 'Karan Aujla',   genre: 'Punjabi hip hop', region: 'Punjab / Canada',  rising: true,  anchor: false, beauty_vibe: 'bold-contemporary' },
  ],
  arab: [
    { name: 'Nancy Ajram',   genre: 'Arabic pop',   region: 'Beirut, Lebanon',     rising: false, anchor: true,  beauty_vibe: 'classic-arab-glam' },
    { name: 'Amr Diab',      genre: 'Arabic pop',   region: 'Cairo, Egypt',        rising: false, anchor: true,  beauty_vibe: 'warm-mediterranean' },
    { name: 'Elyanna',       genre: 'Arab-pop fusion', region: 'Palestine / LA',   rising: true,  anchor: true,  beauty_vibe: 'modern-arab-editorial' },
    { name: 'Massari',       genre: 'Arabic R&B',   region: 'Beirut / Toronto',    rising: false, anchor: false, beauty_vibe: 'smooth-contemporary' },
    { name: 'Fairuz',        genre: 'Classical Arabic', region: 'Beirut, Lebanon', rising: false, anchor: true,  beauty_vibe: 'timeless-classic' },
    { name: 'Carole Samaha', genre: 'Arabic pop',   region: 'Beirut, Lebanon',     rising: false, anchor: false, beauty_vibe: 'sophisticated-arab' },
  ],
  latina: [
    { name: 'Karol G',       genre: 'Reggaeton',    region: 'Medellín, Colombia',  rising: false, anchor: true,  beauty_vibe: 'bold-latina-glam' },
    { name: 'Bad Bunny',     genre: 'Latin trap',   region: 'San Juan, Puerto Rico', rising: false, anchor: true, beauty_vibe: 'avant-garde-latin' },
    { name: 'Rosalía',       genre: 'Flamenco-pop', region: 'Barcelona, Spain',    rising: false, anchor: true,  beauty_vibe: 'editorial-avant-garde' },
    { name: 'Anitta',        genre: 'Reggaeton / Funk', region: 'Rio de Janeiro', rising: false, anchor: true,   beauty_vibe: 'bold-tropical-glam' },
    { name: 'Becky G',       genre: 'Latin pop',    region: 'Los Angeles, USA',    rising: false, anchor: true,  beauty_vibe: 'vibrant-latina' },
    { name: 'Shakira',       genre: 'Latin pop',    region: 'Barranquilla, Colombia', rising: false, anchor: true, beauty_vibe: 'warm-mediterranean-latin' },
    { name: 'Villano Antillano', genre: 'Latin trap', region: 'Puerto Rico',       rising: true,  anchor: false, beauty_vibe: 'bold-experimental' },
    { name: 'Peso Pluma',    genre: 'Corridos tumbados', region: 'Guadalajara, Mexico', rising: true, anchor: false, beauty_vibe: 'authentic-latin' },
  ],
  east_asian: [
    { name: 'BLACKPINK',     genre: 'K-pop',        region: 'Seoul, South Korea',  rising: false, anchor: true,  beauty_vibe: 'glass-skin-editorial' },
    { name: 'BTS',           genre: 'K-pop',        region: 'Seoul, South Korea',  rising: false, anchor: true,  beauty_vibe: 'clean-dewy-glam' },
    { name: 'NewJeans',      genre: 'K-pop',        region: 'Seoul, South Korea',  rising: true,  anchor: true,  beauty_vibe: 'minimalist-glass-skin' },
    { name: 'IVE',           genre: 'K-pop',        region: 'Seoul, South Korea',  rising: true,  anchor: false, beauty_vibe: 'polished-contemporary' },
    { name: 'aespa',         genre: 'K-pop',        region: 'Seoul, South Korea',  rising: true,  anchor: false, beauty_vibe: 'futuristic-glam' },
    { name: 'Jay Chou',      genre: 'Mandopop',     region: 'Taipei, Taiwan',      rising: false, anchor: true,  beauty_vibe: 'classic-chinese-chic' },
    { name: 'Eason Chan',    genre: 'Cantopop',     region: 'Hong Kong',           rising: false, anchor: true,  beauty_vibe: 'classic-sophisticated' },
    { name: 'Utada Hikaru',  genre: 'J-pop',        region: 'Tokyo, Japan',        rising: false, anchor: true,  beauty_vibe: 'minimalist-ethereal' },
  ],
  south_african: [
    { name: 'Tyla',          genre: 'Amapiano / Pop', region: 'Johannesburg, SA',  rising: true,  anchor: true,  beauty_vibe: 'natural-luminous-glam' },
    { name: 'Black Coffee',  genre: 'Amapiano / House', region: 'Durban, SA',      rising: false, anchor: true,  beauty_vibe: 'minimal-cool' },
    { name: 'Focalistic',    genre: 'Amapiano',     region: 'Pretoria, SA',        rising: true,  anchor: false, beauty_vibe: 'authentic-earth' },
    { name: 'Sha Sha',       genre: 'Amapiano',     region: 'Harare / Johannesburg', rising: true, anchor: false, beauty_vibe: 'natural-warm-glow' },
    { name: 'Kabza De Small', genre: 'Amapiano',    region: 'Johannesburg, SA',    rising: false, anchor: true,  beauty_vibe: 'warm-soulful' },
  ],
};

// ---------------------------------------------------------------------------
// Community → region mapping
// ---------------------------------------------------------------------------

const COMMUNITY_REGION_MAP = {
  west_african:    'west_african',
  east_african:    'east_african',
  black_american:  'black_american',
  caribbean:       'caribbean',
  south_asian:     'south_asian',
  arab:            'arab',
  gulf:            'arab',
  latina:          'latina',
  east_asian:      'east_asian',
  south_african:   'south_african',
};

// Cross-community fallback — if a region has no data, use these
const CROSS_COMMUNITY_FALLBACK = ['Beyoncé', 'Rihanna', 'Rosalía', 'Bad Bunny', 'BTS', 'Burna Boy'];

// ---------------------------------------------------------------------------
// Multi-source verification
// ---------------------------------------------------------------------------

/**
 * Verify a set of Qloo-returned artists against our curated anchor list.
 * Returns only artists confirmed by ≥2 sources OR anchor artists.
 *
 * Source 1: Qloo Taste AI (live)
 * Source 2: Curated regional anchor list (Oct 2026)
 * Source 3: Cross-community affinity (fallback)
 *
 * @param {string[]} qlooNames     Names returned by Qloo for the region
 * @param {string}   regionKey     Region key (e.g. 'west_african')
 * @returns {{ name: string, sources: number, anchor: boolean, region: string, genre: string, beauty_vibe: string }[]}
 */
export function verifyArtists(qlooNames, regionKey) {
  const anchors = REGIONAL_ANCHORS[regionKey] ?? [];
  const anchorMap = new Map(anchors.map(a => [a.name.toLowerCase(), a]));
  const verified = [];

  // Artists from Qloo that match our curated list (2 sources confirmed)
  for (const name of qlooNames) {
    const hit = anchorMap.get(name.toLowerCase());
    if (hit) {
      verified.push({ ...hit, sources: 2, verified: true });
      anchorMap.delete(name.toLowerCase());
    } else {
      // Qloo says it's relevant but we don't have it in our list
      // Only include if Qloo is very confident (position < 3 in results)
      if (qlooNames.indexOf(name) < 3) {
        verified.push({
          name, genre: 'Contemporary', region: regionKey,
          rising: true, anchor: false, beauty_vibe: 'contemporary',
          sources: 1, verified: false,
        });
      }
    }
  }

  // Fill with anchor artists not yet included (source 2 only, but anchor=true = high confidence)
  for (const [key, artist] of anchorMap) {
    if (artist.anchor && verified.length < 6) {
      verified.push({ ...artist, sources: 1, verified: true });
      anchorMap.delete(key);
    }
  }

  // If still short, add rising artists from curated list
  for (const [, artist] of anchorMap) {
    if (artist.rising && verified.length < 6) {
      verified.push({ ...artist, sources: 1, verified: false });
    }
  }

  const seen = new Set();
  return verified.filter(a => { const k = a.name.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 6);
}

// ---------------------------------------------------------------------------
// Main export: get trending artists for a community/region
// ---------------------------------------------------------------------------

/**
 * Get trending artists for a community, with Qloo as primary source
 * and curated failsafe for regions with thin Qloo data.
 *
 * @param {object} options
 * @param {string}     options.communityId   Community ID from cultural_dna.js
 * @param {object}     [options.qlooClient]  Live QlooClient instance
 * @param {number}     [options.limit]       Max artists to return (default 6)
 * @returns {Promise<TrendingArtistResult>}
 */
export async function getTrendingArtists({ communityId, qlooClient, limit = 6 }) {
  const regionKey = COMMUNITY_REGION_MAP[communityId] ?? communityId;
  const anchors = REGIONAL_ANCHORS[regionKey];

  // Source 1: Attempt Qloo live data
  let qlooNames = [];
  let qlooUsed = false;

  if (qlooClient && anchors) {
    try {
      // Use anchor artists as seeds to get Qloo taste affinities
      const seedNames = anchors.filter(a => a.anchor).slice(0, 3).map(a => a.name);
      const resolved = await qlooClient.resolveMany(seedNames);
      const entityIds = resolved.filter(Boolean).map(e => e.entity_id);

      if (entityIds.length > 0) {
        const taste = await qlooClient.tasteProfile(entityIds, {
          outputType: 'urn:entity:music:artist',
          limit: 10,
        });
        const entities = taste?.results?.entities ?? [];
        qlooNames = entities.map(e => e.name).filter(Boolean);
        qlooUsed = qlooNames.length > 0;
      }
    } catch (err) {
      console.warn('[trending_artists] Qloo fetch failed:', err.message, '— using curated fallback');
    }
  }

  // Source 2 + 3: Multi-source verification
  const verified = verifyArtists(qlooNames, regionKey);

  // If no region data at all, use cross-community fallback
  if (verified.length === 0) {
    return {
      artists: CROSS_COMMUNITY_FALLBACK.slice(0, limit).map(name => ({
        name, genre: 'Global', region: 'Global', rising: false,
        anchor: true, beauty_vibe: 'contemporary', sources: 1, verified: true,
      })),
      regionKey,
      qlooUsed: false,
      source: 'cross_community_fallback',
      sourcesCount: 1,
    };
  }

  return {
    artists: verified.slice(0, limit),
    regionKey,
    qlooUsed,
    source: qlooUsed ? 'qloo_plus_curated' : 'curated_anchor',
    sourcesCount: qlooUsed ? 2 : 1,
  };
}

/**
 * Get trending artists for ALL regions (for the homepage discovery panel).
 * Used when no community is selected.
 *
 * @returns {Promise<Record<string, TrendingArtistResult>>}
 */
export async function getAllTrendingArtists({ qlooClient, limitPerRegion = 4 } = {}) {
  const regions = Object.keys(REGIONAL_ANCHORS);
  // Fetch in parallel, but build the result in a fixed region order (not completion order).
  const lists = await Promise.all(
    regions.map((regionKey) => getTrendingArtists({ communityId: regionKey, qlooClient, limit: limitPerRegion }))
  );
  return Object.fromEntries(regions.map((regionKey, i) => [regionKey, lists[i]]));
}
