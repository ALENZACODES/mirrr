/**
 * MIRRR Agent — Qloo-Powered Cultural Beauty Agent
 *
 * This is the agentic core of MIRRR. Unlike a simple API wrapper,
 * the MIRRR Agent is a multi-step reasoning agent that:
 *
 *   1. PERCEIVES  — understands user's cultural taste signals
 *   2. RESOLVES   — maps signals to Qloo entities (250M+ graph)
 *   3. PROFILES   — builds a taste graph + aesthetic vector
 *   4. REASONS    — uses DNA engine + community signals
 *   5. RECOMMENDS — looks, shades, wigs, products
 *   6. NARRATES   — personalised explanation via LLM
 *
 * This is what "cultural intelligence as the differentiator" means:
 * a generic LLM cannot do steps 2–4 without Qloo.
 */

import { QlooClient } from '../qloo.js';
import { buildAestheticVector, getArchetypes } from '../aesthetic.js';
import { recommendLooks } from '../look_engine.js';
import { scoreDNA } from '../cultural_dna.js';
import { findShades } from '../shade_finder.js';
import { matchWigs } from '../wig_matchmaker.js';
import { getLookProducts } from '../product_engine.js';
import { narrate } from '../llm/index.js';

// ---------------------------------------------------------------------------
// Agent state machine steps
// ---------------------------------------------------------------------------

export const AGENT_STEPS = [
  'perceive',
  'resolve',
  'profile',
  'reason',
  'recommend',
  'narrate',
];

export class MirrrAgent {
  constructor({ qlooApiKey, options = {} } = {}) {
    this.qloo = qlooApiKey
      ? new QlooClient({ apiKey: qlooApiKey })
      : null;
    this.options = {
      topLooks: options.topLooks ?? 3,
      topShades: options.topShades ?? 6,
      topWigs: options.topWigs ?? 5,
      verbose: options.verbose ?? false,
    };
    this._log = options.verbose
      ? (step, msg) => console.log(`[MIRRR Agent :: ${step}]`, msg)
      : () => {};
  }

  /**
   * Run the full agent pipeline.
   *
   * @param {object} input
   * @param {string[]} input.inputs       Cultural names (artists, brands, places)
   * @param {string[]} [input.freeText]   Free-text signals
   * @param {object}   [input.dnaAnswers] Quiz answers { questionId: optionId }
   * @param {string}   [input.communityId] Override community
   * @param {number}   [input.depthTarget] Shade depth 1–30
   * @param {string}   [input.undertone]   Undertone preference
   * @param {string}   [input.lengthPref]  Wig length preference
   * @param {string}   [input.texturePref] Wig texture preference
   * @param {Function} [input.onStep]      Callback (step, data) for streaming
   *
   * @returns {AgentResult}
   */
  async run(input) {
    const {
      inputs = [],
      freeText = [],
      dnaAnswers,
      communityId: communityOverride,
      depthTarget,
      undertone,
      lengthPref,
      texturePref,
      onStep,
    } = input;

    const emit = (step, data) => {
      this._log(step, data);
      if (typeof onStep === 'function') onStep(step, data);
    };

    const trace = [];
    const timestamp = () => new Date().toISOString();

    // ── Step 1: PERCEIVE ──────────────────────────────────────────────
    emit('perceive', { inputs, freeText, dnaAnswers });
    trace.push({ step: 'perceive', at: timestamp(), inputs_count: inputs.length });

    // ── Step 2: RESOLVE — Qloo entity resolution ──────────────────────
    let entities = [];
    let qlooTags = [];
    let qlooError = null;

    if (this.qloo && inputs.length > 0) {
      emit('resolve', 'Resolving entities via Qloo taste graph…');
      try {
        const resolved = await this.qloo.resolveMany(inputs);
        entities = resolved.filter(Boolean);
        this._log('resolve', `Resolved ${entities.length}/${inputs.length} entities`);

        // Fetch taste profile for resolved entities
        if (entities.length > 0) {
          const entityIds = entities.map(e => e.id).filter(Boolean);
          const tasteData = await this.qloo.tasteProfile(entityIds).catch(() => null);
          // Qloo tasteProfile returns { results: { entities: [...] } } — extract tags from entity names
          if (tasteData?.results?.entities?.length) {
            qlooTags = tasteData.results.entities.map(e => e.name ?? e.id).filter(Boolean);
          } else if (tasteData?.tags) {
            qlooTags = tasteData.tags;
          }
        }
      } catch (err) {
        qlooError = err.message;
        console.warn('[agent] Qloo resolve failed:', err.message);
        this._log('resolve', `Qloo resolve failed: ${err.message} — continuing`);
      }
    } else {
      this._log('resolve', 'No Qloo key or no inputs — skipping entity resolution');
    }

    trace.push({ step: 'resolve', at: timestamp(), entities_found: entities.length, tags_found: qlooTags.length });
    emit('resolve', { entities, tags: qlooTags });

    // ── Step 3: PROFILE — build aesthetic vector ───────────────────────
    const allTags = [...qlooTags, ...freeText];
    const aesthetic = buildAestheticVector(allTags, { freeText });
    const archetypes = getArchetypes();

    trace.push({ step: 'profile', at: timestamp(), aesthetic });
    emit('profile', { aesthetic, archetypes });

    // ── Step 4: REASON — cultural DNA + community ──────────────────────
    let dnaResult = null;
    let communityId = communityOverride ?? null;

    if (dnaAnswers && Object.keys(dnaAnswers).length > 0) {
      dnaResult = scoreDNA(dnaAnswers);
      // If no override, use DNA-computed community
      if (!communityId) communityId = dnaResult.topCommunity?.id ?? null;
      // Blend DNA seed aesthetic with Qloo aesthetic
      if (dnaResult.seedAesthetic) {
        const blend = blendAesthetics(aesthetic, dnaResult.seedAesthetic, 0.35);
        Object.assign(aesthetic, blend);
      }
    }

    trace.push({ step: 'reason', at: timestamp(), communityId, dnaResult: dnaResult ? 'present' : 'skipped' });
    emit('reason', { communityId, dnaResult });

    // ── Step 5: RECOMMEND — looks, shades, wigs, products ──────────────
    const looks = recommendLooks(aesthetic, {
      topN: this.options.topLooks,
      communityId,
    });

    // Shade finder
    let shades = [];
    if (depthTarget !== undefined) {
      shades = findShades({
        communityId,
        depthTarget,
        undertone,
        topN: this.options.topShades,
      });
    }

    // Wig matchmaker
    const wigs = matchWigs({
      aesthetic,
      communityId,
      lengthPref,
      texturePref,
      topN: this.options.topWigs,
    });

    // Products for top look
    const topLookId = looks[0]?.look?.id ?? null;
    const products = topLookId
      ? getLookProducts(topLookId, depthToLabel(depthTarget))
      : null;

    trace.push({
      step: 'recommend', at: timestamp(),
      top_look: topLookId,
      looks_count: looks.length,
      shades_count: shades.length,
      wigs_count: wigs.length,
    });
    emit('recommend', { looks, shades, wigs, products });

    // ── Step 6: NARRATE — LLM-powered explanation ──────────────────────
    const { narration, source: narration_source } = await narrate({
      aesthetic,
      looks,
      tags: allTags,
      entities,
      meta: { communityId, dnaResult, demo: !this.qloo },
    });

    trace.push({ step: 'narrate', at: timestamp(), source: narration_source });
    emit('narrate', { narration, narration_source });

    // ── Build final result ─────────────────────────────────────────────
    const result = {
      // Core outputs
      aesthetic,
      looks,
      wigs,
      narration,
      narration_source,

      // Context
      entities,
      tags: allTags,
      communityId,
      dnaResult,

      // Optional outputs
      shades: shades.length ? shades : undefined,
      products: products ?? undefined,

      // Agent meta
      meta: {
        qloo_powered: this.qloo !== null && entities.length > 0,
        entities_resolved: entities.length,
        tags_from_qloo: qlooTags.length,
        qloo_error: qlooError,
        community: communityId,
        trace,
      },
    };

    return result;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Blend two aesthetic vectors with weight for the second.
 */
function blendAesthetics(a, b, wB) {
  const wA = 1 - wB;
  return {
    intensity: a.intensity * wA + b.intensity * wB,
    warmth: a.warmth * wA + b.warmth * wB,
    boldness: a.boldness * wA + b.boldness * wB,
    texture: wB > 0.5 ? b.texture : a.texture,
    colour_palette: wB > 0.5 ? b.colour_palette : a.colour_palette,
    hair_vibe: wB > 0.5 ? b.hair_vibe : a.hair_vibe,
    archetypes: b.archetypes ?? a.archetypes,
  };
}

/**
 * Convert numeric depth target to label string.
 */
function depthToLabel(depthTarget) {
  if (!depthTarget) return 'medium';
  if (depthTarget <= 3)  return 'fair';
  if (depthTarget <= 8)  return 'light';
  if (depthTarget <= 13) return 'light_med';
  if (depthTarget <= 18) return 'medium';
  if (depthTarget <= 23) return 'medium_deep';
  if (depthTarget <= 27) return 'deep';
  return 'rich_deep';
}
