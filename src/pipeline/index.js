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
import { buildAestheticVector, ARCHETYPE_KEYWORDS } from '../aesthetic.js';
import { qlooTaste, provenance } from '../taste_signals.js';
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
  // Live Qloo taste (resolve, music + media tags, safety allowlist), shared with the agent and planner.
  const q = await qlooTaste(inputs, client ? { client } : {});
  let tags = q.kept, tasteSource = q.qloo_powered ? 'qloo' : 'none';
  if (!q.qloo_powered) {
    // Qloo gave nothing: the built-in artist map, clearly labelled as demo data in meta.
    const localTags = localTagsForInputs(inputs);
    if (localTags.length) { tasteSource = 'local_artist_map'; tags = localTags; }
  }
  const aesthetic = buildAestheticVector(tags, { freeText });
  const looks = recommendLooks(aesthetic, { topN: topLooks, evidence: q.qloo_powered ? q.kept : null, archetypeKeywords: ARCHETYPE_KEYWORDS });
  return {
    aesthetic,
    looks,
    tags: tags.slice(0, 20),
    entities: q.entities,
    qloo: provenance(q),
    meta: {
      inputs_given: inputs.length,
      inputs_resolved: q.entities.length,
      inputs_failed: q.failed,
      taste_source: tasteSource,
      qloo_powered: q.qloo_powered,
      qloo_unreachable: q.unreachable,
      demo: !q.qloo_powered,
      qloo_error: q.errors[0] ?? null,
      provenance: provenance(q),
      latency_ms: q.latency_ms,
    },
  };
}
