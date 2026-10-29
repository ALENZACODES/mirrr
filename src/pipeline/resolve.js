/**
 * Entity resolution pipeline for MIRRR.
 *
 * Resolves free-text cultural inputs (music artists, movies, brands, cities,
 * cuisines, etc.) into Qloo entity IDs that can seed the taste profile.
 */

import { QlooClient, qlooClient as _sharedClient } from '../qloo.js';

/**
 * Preferred entity type URNs — tried in order for each input.
 * Qloo's cultural entities are the richest for taste inference.
 */
const PREFERRED_TYPES = [
  'urn:entity:artist',
  'urn:entity:movie',
  'urn:entity:tv_show',
  'urn:entity:brand',
  'urn:entity:destination',
  'urn:entity:cuisine',
  'urn:entity:book',
  'urn:entity:podcast',
];

/**
 * Resolve a list of cultural names to Qloo entity IDs.
 *
 * @param {string[]} inputs    — user-supplied names (e.g. ["Burna Boy", "Nollywood", "Ankara"])
 * @param {QlooClient} [client]
 * @returns {Promise<{ resolved: string[], failed: string[], entities: object[] }>}
 */
export async function resolveInputs(inputs, client) {
  client = client ?? _sharedClient;

  const entities = [];
  const failed = [];

  await Promise.all(
    inputs.map(async (input) => {
      try {
        const entity = await client.resolveName(input, PREFERRED_TYPES);
        if (entity?.id) {
          entities.push({ input, ...entity });
        } else {
          failed.push(input);
        }
      } catch (err) {
        console.warn(`[resolve] failed for "${input}":`, err.message);
        failed.push(input);
      }
    })
  );

  const resolved = entities.map((e) => e.id);
  return { resolved, failed, entities };
}
