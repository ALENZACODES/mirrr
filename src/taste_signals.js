/**
 * Qloo taste signals, made load-bearing and safe.
 *
 * One function, used by Taste, Looks (the agent) and the Occasion Planner: resolve the user's
 * names on Qloo's taste graph, pull the music-genre and media tags Qloo associates with them
 * (with Qloo's own affinity), and keep only tags that (a) pass a safety blocklist and (b) match
 * the beauty vocabulary MIRRR scores with. Every kept tag moves the aesthetic vector or the look
 * ranking; nothing else is shown. Counts of what was received, kept and dropped come back as
 * provenance, so the UI can show exactly what Qloo contributed.
 */
import { qlooClient as sharedClient } from './qloo.js';
import { TAG_SIGNALS, ARCHETYPE_KEYWORDS } from './aesthetic.js';

/** A short, safe reason for the UI (never the upstream body). */
const why = err => (err?.status === 401 || err?.status === 403 ? `Qloo refused the request (${err.status})` : err?.status ? `Qloo returned ${err.status}` : /timed out/i.test(err?.message ?? '') ? 'Qloo timed out' : /cap/i.test(err?.message ?? '') ? 'Qloo daily call limit reached' : 'Qloo did not respond');

const PREFERRED_TYPES = ['urn:entity:artist', 'urn:entity:person', 'urn:entity:movie', 'urn:entity:tv_show', 'urn:entity:brand', 'urn:entity:destination', 'urn:entity:book', 'urn:entity:podcast'];
export const TAG_TYPES = { music: 'urn:tag:genre:music', media: 'urn:tag:genre:media,urn:tag:keyword:media' };

const norm = s => String(s ?? '').toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();

/** Never shown, never scored, whatever else they match. */
const BLOCK = ['drug', 'violen', 'murder', 'kill', 'death', 'dead', 'crime', 'criminal', 'gang', 'prison', 'abuse', 'rape', 'sex', 'nud', 'porn', 'erotic', 'suicid', 'terror', 'war', 'weapon', 'gun', 'blood', 'gore', 'horror', 'racis', 'interracial', 'slave', 'revenge', 'torture', 'addict', 'alcohol', 'cocaine', 'heroin', 'stripper', 'prostitut', 'serial', 'psycho', 'zombie', 'nazi', 'hate', 'kidnap', 'assault', 'religio', 'christian', 'muslim', 'islam', 'jewish', 'hindu', 'gay', 'lesbian', 'politic', 'teen', 'school', 'child'];

/** The beauty vocabulary: every keyword that moves the vector or an archetype. */
const VOCAB = [...new Set([
  ...Object.values(TAG_SIGNALS).flatMap(d => Object.values(d).flat()),
  ...Object.values(ARCHETYPE_KEYWORDS).flat(),
].map(norm))];

const GENERIC = new Set(['rap', 'trap', 'hip hop', 'r&b', 'rnb', 'rhythm & blues', 'rhythm and blues', 'urban', 'soul', 'club', 'edm', 'electropop', 'indie', 'folk', 'acoustic', 'jazz', 'ballad', 'classic', 'glam']);

export function isBlocked(name) { const n = norm(name); return BLOCK.some(b => n.includes(b)); }
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const VOCAB_RE = VOCAB.map(k => [k, new RegExp(`(^|[^a-z0-9])${esc(k)}($|[^a-z0-9])`)]);
/** Vocabulary words found in a tag as whole words ('supernatural' is not 'natural'). */
export function vocabMatch(name) { const n = norm(name); return VOCAB_RE.filter(([, re]) => re.test(n)).map(([k]) => k); }

/** Split tags into kept (safe and load-bearing) and dropped, de-duplicated by normalised name. */
export function filterTags(tags) {
  const kept = [], seen = new Set(); let blocked = 0, irrelevant = 0, dupes = 0;
  for (const t of tags) {
    const n = norm(t.name);
    if (!n) continue;
    if (seen.has(n)) { dupes++; continue; } seen.add(n);
    if (isBlocked(n)) { blocked++; continue; }
    const hits = vocabMatch(n);
    if (!hits.length) { irrelevant++; continue; }
    // Genres Qloo attaches to nearly every popular artist (seen live for Afrobeats, K-pop, Latin and
    // Bollywood artists alike) say little about one person's taste, so they count for less.
    const generic = hits.every(h => GENERIC.has(h));
    kept.push({ ...t, name: String(t.name).trim(), matches: hits, weight: (t.affinity ?? 1) * (generic ? 0.35 : 1) });
  }
  return { kept, dropped: { blocked, irrelevant, duplicates: dupes } };
}

/**
 * Live Qloo taste for a list of names. Never throws: when Qloo is unreachable or has no key the
 * result says so (qloo_powered false, unreachable true, error message) and carries no tags.
 */
export async function qlooTaste(inputs = [], { client = sharedClient } = {}) {
  const t0 = Date.now();
  const names = [...new Set(inputs.map(s => String(s ?? '').trim()).filter(Boolean))].slice(0, 10);
  const out = { inputs: names, entities: [], failed: [], received: { music: 0, media: 0 }, kept: [], dropped: { blocked: 0, irrelevant: 0, duplicates: 0 }, calls: 0, errors: [], qloo_powered: false, unreachable: false, key_set: Boolean(client?._apiKey) };
  if (!names.length) return { ...out, latency_ms: 0 };
  if (!out.key_set) return { ...out, unreachable: true, errors: ['Qloo API key is not configured on this server'], latency_ms: 0 };
  await Promise.all(names.map(async (input) => {
    try {
      out.calls++;
      const e = await client.resolveName(input, PREFERRED_TYPES);
      if (e?.id) out.entities.push({ input, id: e.id, name: e.name, type: e.type, popularity: e.popularity ?? null }); else out.failed.push(input);
    } catch (err) { out.failed.push(input); out.errors.push(why(err)); }
  }));
  if (out.entities.length) {
    const ids = out.entities.map(e => e.id);
    const [music, media] = await Promise.all(Object.entries(TAG_TYPES).map(async ([k, type]) => {
      try { out.calls++; return await client.insightTagsOfType(ids, type, 25); } catch (err) { out.errors.push(why(err)); return []; }
    }));
    out.received = { music: music.length, media: media.length };
    const f = filterTags([...music.map(t => ({ ...t, kind: 'music genre' })), ...media.map(t => ({ ...t, kind: 'media theme' }))]);
    out.kept = f.kept.sort((a, b) => (b.affinity ?? 0) - (a.affinity ?? 0));
    out.dropped = f.dropped;
  }
  out.qloo_powered = out.entities.length > 0 && out.received.music + out.received.media > 0;
  out.unreachable = !out.qloo_powered && out.errors.length > 0 && out.entities.length === 0;
  out.latency_ms = Date.now() - t0;
  return out;
}

/** The provenance block the UI shows (no raw dropped tag names, only their counts). */
export function provenance(q) {
  return {
    source: q.qloo_powered ? 'qloo' : 'none',
    qloo_powered: q.qloo_powered, unreachable: q.unreachable,
    entities: q.entities.map(e => ({ input: e.input, name: e.name, type: e.type })),
    unresolved: q.failed,
    tags_received: q.received.music + q.received.media, received: q.received,
    tags_used: q.kept.length, dropped: q.dropped,
    used: q.kept.slice(0, 12).map(t => ({ name: t.name, kind: t.kind, affinity: t.affinity == null ? null : Math.round(t.affinity * 100) / 100 })),
    calls: q.calls, latency_ms: q.latency_ms, error: q.errors[0] ?? null,
  };
}
