/**
 * Built-in taste map for artists MIRRR already knows (src/trending_artists.js).
 * Used only when Qloo returns nothing, so typed artists still move the result.
 * Results derived from this map are labelled taste_source: 'local_artist_map',
 * never presented as Qloo output.
 */
import { REGIONAL_ANCHORS } from './trending_artists.js';

const INDEX = new Map();
for (const list of Object.values(REGIONAL_ANCHORS)) {
  for (const a of list) INDEX.set(a.name.toLowerCase(), a);
}

export function knownArtist(name) {
  return INDEX.get(String(name ?? '').trim().toLowerCase()) ?? null;
}

/** Tags describing an artist's taste signature (genre, region, beauty vibe). */
export function artistTagsFor(name) {
  const a = knownArtist(name);
  if (!a) return [];
  const region = String(a.region ?? '').split(',').pop().trim();
  return [
    String(a.genre ?? '').toLowerCase(),
    ...String(a.beauty_vibe ?? '').split('-'),
    region.toLowerCase(),
  ].filter(Boolean);
}

export function localTagsForInputs(inputs = []) {
  return [...new Set(inputs.flatMap(artistTagsFor))];
}
