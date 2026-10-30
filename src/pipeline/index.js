/**
 * MIRRR taste pipeline
 *
 * Input:  { inputs: string[], freeText?: string[] }
 *         inputs    — cultural names user likes (artists, films, places)
 *         freeText  — extra signals ("Afrobeats", "South Asian weddings")
 *
 * Output: { aesthetic, looks, tags, entities, meta }
 */

import { localTagsForInputs } from '../local_taste.js';
import { QlooClient, qlooClient as _sharedClient } from '../qloo.js';
import { resolveInputs } from './resolve.js';
import { buildAestheticVector } from '../aesthetic.js';
import { recommendLooks } from '../look_engine.js';

/**
 * Run the full MIRRR taste pipeline.
 *
 * @param {object} params
 * @param {string[]} params.inputs       — cultural name inputs
 * @param {string[]} [params.freeText]   — extra free-text signals
 * @param {number}   [params.topLooks]   — how many looks to return
 * @param {QlooClient} [params.client]   — injectable for testing
 * @returns {Promise<object>}
 */
export async function runPipeline({ inputs = [], freeText = [], topLooks = 3, client }) {
  // Use the process-level singleton so TtlCache persists across requests.
  // Tests can still inject a mock via the `client` param.
  client = client ?? _sharedClient;

  const start = Date.now();

  // 1. Resolve entity names → Qloo IDs
  const { resolved, failed, entities } = await resolveInputs(inputs, client);

  let tags = [];
  let tasteSource = resolved.length > 0 ? 'qloo' : 'none';
  let aesthetic;
  let looks;

  if (resolved.length > 0) {
    // 2. Get aesthetic/tag inference from Qloo
    tags = await client.insightTags(resolved, 50);

    // 3. Build aesthetic vector
    aesthetic = buildAestheticVector(tags, { freeText });

    // 4. Recommend looks
    looks = recommendLooks(aesthetic, { topN: topLooks });
  } else {
    // No entities resolved — use free-text signals only
    // Fallback: built-in artist map (clearly labelled), then free text
    const localTags = localTagsForInputs(inputs);
    if (localTags.length) tasteSource = 'local_artist_map';
    aesthetic = buildAestheticVector(localTags, { freeText });
    looks = recommendLooks(aesthetic, { topN: topLooks });
    tags = localTags;
  }

  return {
    aesthetic,
    looks,
    tags: tags.slice(0, 20),
    entities,
    meta: {
      inputs_given: inputs.length,
      inputs_resolved: resolved.length,
      inputs_failed: failed,
      taste_source: tasteSource,
      latency_ms: Date.now() - start,
    },
  };
}
