/**
 * The 60-Second Transformation: one guided chain through the parts MIRRR already has.
 * You (favourites, tone, undertone) → Taste (live Qloo pipeline) → Shade (named foundation shade)
 * → Plan (staged transformation) → Try-on (the model face nearest your tone, wearing the look).
 * Pure helpers only, so the chain's rules can be tested without a browser.
 */
export const SIXTY_STEPS = [
  { id: 'you', label: 'You' },
  { id: 'taste', label: 'Taste' },
  { id: 'shade', label: 'Shade' },
  { id: 'plan', label: 'Plan' },
  { id: 'tryon', label: 'Try-on' },
];

/** Undertones offered in step 1: the four the shade finder scores most often. */
export const SIXTY_UNDERTONES = ['warm', 'neutral', 'cool', 'olive'];

/** "Burna Boy, Tems; Rihanna" → ['Burna Boy', 'Tems', 'Rihanna'], trimmed, de-duplicated, at most 5. */
export function parseFavourites(text) {
  const seen = new Set();
  const out = [];
  for (const raw of String(text ?? '').split(/[,;\n]/)) {
    const v = raw.trim().replace(/\s+/g, ' ');
    if (!v || v.length > 60 || seen.has(v.toLowerCase())) continue;
    seen.add(v.toLowerCase());
    out.push(v);
    if (out.length === 5) break;
  }
  return out;
}

/** What step 1 needs before the chain can run. Returns the first missing item, or null. */
export function missingForStart({ favourites = [], depth = null, undertone = null } = {}) {
  if (!favourites.length) return 'Add at least one artist, film, show or brand you love.';
  if (!Number.isFinite(Number(depth)) || depth === null) return 'Pick the skin tone closest to yours.';
  if (!undertone) return 'Pick your undertone.';
  return null;
}

/** Step index after a move, clamped to the chain. */
export function stepAfter(index, move) {
  const i = Number(index) + (move === 'back' ? -1 : 1);
  return Math.max(0, Math.min(SIXTY_STEPS.length - 1, i));
}

/** "Step 3 of 5 · Shade" */
export function progressLabel(index) {
  const i = Math.max(0, Math.min(SIXTY_STEPS.length - 1, Number(index) || 0));
  return `Step ${i + 1} of ${SIXTY_STEPS.length} · ${SIXTY_STEPS[i].label}`;
}

/** The taste request for /api/agent/run, the endpoint the Taste page uses, so the Qloo scoring is the same one. */
export function tasteRequest({ favourites, depth, undertone }) {
  return { inputs: favourites, depthTarget: Number(depth), undertone };
}

/** The top looks from a taste run, best first, with the Qloo tags that picked each one. */
export function topLooks(run, n = 3) {
  return (run?.looks ?? []).slice(0, n).map(l => ({
    id: l.look?.id, name: l.look?.name, description: l.look?.description ?? '', image: l.look?.image ?? null,
    score: l.score, evidence: Array.isArray(l.evidenceTags) ? l.evidenceTags : [],
  })).filter(l => l.id && l.name);
}

/** Where the taste came from, in words: never claims Qloo when the run did not reach it. */
export function tasteSource(run) {
  const m = run?.meta ?? {};
  if (m.qloo_powered) return { live: true, text: `Live Qloo taste: ${m.entities_resolved ?? 0} of your picks resolved, ${m.tags_from_qloo ?? 0} taste tags used.` };
  if (m.qloo_unreachable) return { live: false, text: 'Qloo could not be reached, so these looks come from MIRRR\'s own taste rules for your picks.' };
  return { live: false, text: 'These looks come from MIRRR\'s own taste rules for your picks.' };
}

/** The transform request for the picked shade and look; the taste chips travel with it. */
export function transformRequest({ shade, undertone, lookId, favourites }) {
  return { face: { shadeId: shade?.code ?? shade?.shade?.id, undertone }, targetLookId: lookId, tasteChips: favourites };
}
