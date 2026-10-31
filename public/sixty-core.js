/**
 * The 60-Second Transformation: one guided chain through the parts MIRRR already has.
 * Community → one pick (a song or artist, or a tapped look) → taste (live Qloo for a song or
 * artist) → the named shade → a three-stage plan → before and after on a model face, then save
 * and share. Pure helpers only, so the chain's rules can be tested without a browser.
 */
export const SIXTY_STEPS = [
  { id: 'community', label: 'Community', seconds: 6 },
  { id: 'pick', label: 'One pick', seconds: 10 },
  { id: 'taste', label: 'Your taste', seconds: 8 },
  { id: 'shade', label: 'Your TrueTone shade', seconds: 10 },
  { id: 'plan', label: 'Your plan', seconds: 14 },
  { id: 'tryon', label: 'Before & after', seconds: 12 },
];

/** Undertones offered at the shade step: the four the shade finder scores most often. */
export const SIXTY_UNDERTONES = ['warm', 'neutral', 'cool', 'olive'];

/**
 * Looks she can tap instead of typing. Each is a library look (it has a full plan); the portrait is
 * the generated look photo closest to it (Style Match portraits build on these same looks).
 */
export const SIXTY_LOOKS = [
  { id: 'afrobeats_concert', name: 'Afrobeats Concert', img: '/looks/afrobeats_concert.webp' },
  { id: 'afro_glam_editorial', name: 'Afro-Glam Editorial', img: '/looks/afro_glam_editorial.webp' },
  { id: 'hip_hop_glam', name: 'Hip Hop Glam', img: '/looks/hip_hop_glam.webp' },
  { id: 'hbcu_homecoming', name: 'HBCU Homecoming', img: '/looks/hbcu_homecoming.webp' },
  { id: 'amapiano_beat', name: 'Amapiano Beat', img: '/looks/rooibos_glow.webp' },
  { id: 'desi_everyday_chic', name: 'Desi Everyday Chic', img: '/looks/desi_baddie.webp' },
  { id: 'mehndi_bridal', name: 'Mehndi Bridal', img: '/looks/mehndi_bride.webp' },
  { id: 'persian_editorial', name: 'Persian Editorial', img: '/looks/persian_queen.webp' },
  { id: 'moroccan_soiree', name: 'Moroccan Soirée', img: '/looks/hammam_goddess.webp' },
  { id: 'k_beauty_glass', name: 'K-Beauty Glass Skin', img: '/looks/k_beauty_seoul.webp' },
];

/** One song or artist, trimmed; empty when there is nothing usable. */
export function cleanPick(text) {
  const v = String(text ?? '').trim().replace(/\s+/g, ' ');
  return v.length > 80 ? v.slice(0, 80) : v;
}

/** Step index after a move, clamped to the chain. */
export function stepAfter(index, move) {
  const i = Number(index) + (move === 'back' ? -1 : 1);
  return Math.max(0, Math.min(SIXTY_STEPS.length - 1, i));
}

/** Seconds left, counting the current step and the ones after it. */
export function secondsLeft(index) {
  const i = Math.max(0, Math.min(SIXTY_STEPS.length - 1, Number(index) || 0));
  return SIXTY_STEPS.slice(i).reduce((a, s) => a + s.seconds, 0);
}

/** "Step 3 of 6 · ~42s left" */
export function progressLabel(index) {
  const i = Math.max(0, Math.min(SIXTY_STEPS.length - 1, Number(index) || 0));
  return `Step ${i + 1} of ${SIXTY_STEPS.length} · ~${secondsLeft(i)}s left`;
}

/** The taste request for /api/agent/run, the endpoint the Taste page uses, so the Qloo scoring is the same one. */
export function tasteRequest({ pick, communityId }) {
  return { inputs: [pick], communityId };
}

/** The top looks from a taste run, best first, with the Qloo tags that picked each one. */
export function topLooks(run, n = 3) {
  return (run?.looks ?? []).slice(0, n).map(l => ({
    id: l.look?.id, name: l.look?.name, description: l.look?.description ?? '',
    score: l.score, evidence: Array.isArray(l.evidenceTags) ? l.evidenceTags : [],
  })).filter(l => l.id && l.name);
}

/**
 * What the taste lookup found. `failed` when nothing came back or Qloo could not resolve the pick:
 * the view then offers manual community and look pickers. Never claims Qloo when it was not reached.
 */
export function tasteOutcome(run, pick) {
  const m = run?.meta ?? {};
  const looks = topLooks(run);
  const resolved = (m.provenance?.entities ?? []).map(e => e.name).filter(Boolean);
  if (m.qloo_powered && resolved.length && looks.length) {
    return { failed: false, live: true, looks, text: `Live Qloo: “${pick}” resolved to ${resolved.join(', ')}; ${m.tags_from_qloo ?? 0} taste tags picked these looks.` };
  }
  const why = m.qloo_unreachable ? 'Qloo could not be reached' : `Qloo could not resolve “${pick}”`;
  return { failed: true, live: false, looks, text: `${why}. Pick your community and a look below${looks.length ? ', or use the looks MIRRR\'s own taste rules found' : ''}.` };
}

/** The shade request: her community's range, the tone and undertone she tapped. */
export function shadeRequest({ communityId, depth, undertone }) {
  return { communityId, depthTarget: Number(depth), undertone, topN: 3 };
}

/** The transform request for the picked shade and look; the pick travels as the taste chip. */
export function transformRequest({ shade, undertone, communityId, lookId, pick }) {
  return { face: { shadeId: shade?.code ?? shade?.shade?.id, undertone, communityId }, targetLookId: lookId, tasteChips: pick ? [pick] : [] };
}

/** The share line: only what this chain produced. */
export function shareText({ look, shade, community }) {
  return `My MIRRR look: ${look} in ${shade.name} (${shade.code})${community ? `, ${community}` : ''}. Find yours in 60 seconds:`;
}

/** Where the last completed 60-Second run is cached on this device (real payloads only). */
export const SIXTY_LAST_RUN_KEY = 'mirrr.sixty.lastRun.v1';
export const SIXTY_REPLAY_LABEL = 'A completed run · live runs call Qloo now.';

/** The parts of a real /api/agent/run answer the replay and the trace need; nothing is added. */
export function slimRun(run) {
  if (!run || typeof run !== 'object') return null;
  const p = run.meta?.provenance ?? null;
  return {
    meta: {
      qloo_powered: !!run.meta?.qloo_powered,
      tags_from_qloo: run.meta?.tags_from_qloo ?? null,
      provenance: p ? {
        entities: (p.entities ?? []).map(e => ({ input: e.input, name: e.name })),
        unresolved: p.unresolved ?? [],
        tags_received: p.tags_received, received: p.received ?? null,
        tags_used: p.tags_used, dropped: p.dropped ?? null,
        used: (p.used ?? []).map(u => ({ name: u.name, kind: u.kind })),
        calls: p.calls, latency_ms: p.latency_ms,
      } : null,
    },
    looks: (run.looks ?? []).map(l => ({ look: { id: l.look?.id, name: l.look?.name, description: l.look?.description ?? '' }, score: l.score, evidenceTags: Array.isArray(l.evidenceTags) ? l.evidenceTags : [] })),
  };
}

/** A completed run is only one where Qloo really answered and every later step really produced data. */
export function isCompletedRun(c) {
  return !!(c && c.v === 1 && c.outcome && !c.outcome.failed && c.outcome.live && c.run?.meta?.qloo_powered
    && Array.isArray(c.shades) && c.shades[c.shadeIdx] && c.plan?.stages?.length && c.modelFace?.id
    && typeof c.before === 'string' && c.before.startsWith('data:image/') && typeof c.after === 'string' && c.after.startsWith('data:image/'));
}

const n = v => (typeof v === 'number' && Number.isFinite(v) ? v : null);
/**
 * WATCH MIRRR THINK: the steps this run really took, in order, built only from its own data.
 * A step whose data is missing is left out; nothing here is written by hand.
 */
export function thinkSteps({ run, look, shade, plan, modelFace } = {}) {
  const steps = [];
  const p = run?.meta?.provenance;
  const ents = (p?.entities ?? []).filter(e => e?.name);
  if (ents.length) steps.push({ id: 'resolved', title: 'Artist resolved', text: ents.map(e => (e.input && e.input !== e.name ? `“${e.input}” → ${e.name}` : e.name)).join(' · ') + (n(p.calls) != null ? ` (${p.calls} Qloo calls${n(p.latency_ms) != null ? `, ${p.latency_ms} ms` : ''})` : '') });
  if (n(p?.tags_received) != null) {
    const r = p.received ?? {};
    const parts = [n(r.music) != null ? `${r.music} music genres` : '', n(r.media) != null ? `${r.media} media themes` : ''].filter(Boolean);
    steps.push({ id: 'received', title: 'Taste tags received', text: `${p.tags_received} taste tags from Qloo${parts.length ? ` (${parts.join(', ')})` : ''}` });
  }
  const d = p?.dropped;
  if (d && n(p?.tags_used) != null) {
    const total = (d.blocked ?? 0) + (d.irrelevant ?? 0) + (d.duplicates ?? 0);
    const used = (p.used ?? []).map(u => u.name).filter(Boolean).slice(0, 8);
    steps.push({ id: 'filtered', title: 'Tags filtered and why', text: `${p.tags_used} used, ${total} filtered out: ${d.blocked ?? 0} unsafe, ${d.irrelevant ?? 0} not about beauty, ${d.duplicates ?? 0} repeats${used.length ? `. Kept: ${used.join(', ')}` : ''}` });
  }
  const ranked = (run?.looks ?? []).filter(l => l.look?.name);
  if (ranked.length) steps.push({ id: 'ranked', title: 'Looks ranked', text: ranked.slice(0, 3).map((l, i) => `${i + 1}. ${l.look.name}${n(l.score) != null ? ` (score ${l.score.toFixed(2)})` : ''}${l.evidenceTags?.length ? ` · ${l.evidenceTags.slice(0, 3).join(', ')}` : ''}`).join(' · ') });
  if (shade?.name && shade?.code) steps.push({ id: 'shade', title: 'TrueTone shade chosen', text: `${shade.name} (${shade.code})` });
  if (plan?.stages?.length) steps.push({ id: 'plan', title: 'Plan staged', text: `${plan.target?.name ?? look?.name ?? 'Look'}: ${plan.stages.map((s, i) => `${i + 1}. ${s.title}`).join(' · ')}` });
  if (modelFace?.label) steps.push({ id: 'model', title: 'Try-on model selected', text: `The ${modelFace.label} model face, nearest to ${shade?.name ?? 'the shade'}` });
  return steps;
}

/** The cached completed run, or null when there is none or it is not a full, real run. */
export function readCompletedRun(storage) {
  try { const c = JSON.parse(storage?.getItem(SIXTY_LAST_RUN_KEY) || 'null'); return isCompletedRun(c) ? c : null; } catch { return null; }
}
