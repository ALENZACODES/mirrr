/**
 * Taste Leap: "your look, another culture". Your taste (from the Qloo taste graph, the built-in
 * artist map, or a labelled demo profile) becomes an aesthetic vector: intensity, warmth, boldness
 * and texture. Each destination city has its own vector, the mean of the looks the look engine
 * files under that culture. The leap blends the two at the strength you pick, ranks the
 * destination's looks against the blend, and orders the look's own shadow tones by how close each
 * one sits to your blended warmth, so the same woman gets a Lagos, a Seoul and a Dubai version that
 * all still carry her taste. The taste path says which tags moved which dimension.
 *
 * Qloo is called through the existing pipeline only when you send your own inputs, and each set of
 * inputs is cached here for six hours, so changing the other controls never calls Qloo again.
 */
import { buildAestheticVector, affinityOf, TAG_SIGNALS } from '../aesthetic.js';
import { LOOKS, recommendLooks, scoreLook } from '../look_engine.js';
import { DEMO_PROFILES } from '../demo_profiles.js';
import { MONK_TONES } from '../skin/clinic.js';
import { coloursIn } from '../looks/studio.js';
import { runPipeline } from '../pipeline/index.js';

const pick = (v, list, d) => (list.includes(String(v)) ? String(v) : d);
const r2 = n => Math.round(n * 100) / 100;
export const DIMS = [
  { id: 'intensity', label: 'Intensity', low: 'soft', high: 'dramatic' },
  { id: 'warmth', label: 'Warmth', low: 'cool', high: 'warm' },
  { id: 'boldness', label: 'Boldness', low: 'minimal', high: 'maximal' },
  { id: 'texture', label: 'Texture', low: 'matte', high: 'glass' },
];

export const DESTINATIONS = [
  { id: 'lagos', label: 'Lagos', culture: 'Nigerian', match: ['lagos', 'naija', 'nigerian', 'nollywood', 'yoruba', 'owambe'] },
  { id: 'accra', label: 'Accra', culture: 'Ghanaian', match: ['ghana', 'ghanaian', 'accra'] },
  { id: 'johannesburg', label: 'Johannesburg', culture: 'South African', match: ['south african', 'joburg', 'amapiano', 'zulu'] },
  { id: 'nairobi', label: 'Nairobi', culture: 'East African', match: ['kenyan', 'nairobi', 'east african'] },
  { id: 'kingston', label: 'Kingston', culture: 'Jamaican', match: ['jamaican', 'dancehall'] },
  { id: 'mumbai', label: 'Mumbai', culture: 'South Asian', match: ['bollywood', 'indian', 'desi'] },
  { id: 'dubai', label: 'Dubai', culture: 'Gulf', match: ['dubai', 'gulf', 'khaleeji', 'arab'] },
  { id: 'tehran', label: 'Tehran', culture: 'Persian', match: ['persian', 'iranian'] },
  { id: 'seoul', label: 'Seoul', culture: 'Korean', match: ['korean', 'seoul', 'k-pop', 'k-beauty'] },
  { id: 'tokyo', label: 'Tokyo', culture: 'Japanese', match: ['japanese', 'tokyo'] },
  { id: 'mexico_city', label: 'Mexico City', culture: 'Mexican and Latin American', match: ['mexican', 'latin american', 'latina'] },
  { id: 'rio', label: 'Rio de Janeiro', culture: 'Brazilian', match: ['brazilian', 'rio'] },
].map(d => {
  const looks = LOOKS.filter(l => l.cultural_affinity.some(c => d.match.includes(c.toLowerCase())));
  const vector = Object.fromEntries(DIMS.map(({ id }) => [id, r2(looks.reduce((s, l) => s + l.weights[id], 0) / looks.length)]));
  return { ...d, looks, vector };
});
export const STRENGTHS = [
  { id: 'light', label: 'A light leap (a third of the way)', s: 0.35 },
  { id: 'half', label: 'Halfway', s: 0.5 },
  { id: 'full', label: 'All the way in (three quarters)', s: 0.75 },
];
export const PROFILES = [
  ...Object.values(DEMO_PROFILES).map(p => ({ id: p.profile, label: `Demo: ${p.label}` })),
  { id: 'mine', label: 'My taste (from the Taste page)' },
];
const DEFAULTS = { profile: 'afrobeats', dest1: 'lagos', dest2: 'seoul', dest3: 'dubai', strength: 'half', tone: 'mst7', focus: '0' };

// ---- Taste: demo, or your inputs through the pipeline (cached) -------------------------------------
const CACHE = new Map(); const TTL = 6 * 3600 * 1000; const MAX = 200;
export function _clearLeapCache() { CACHE.clear(); }
async function tasteFor(c, inputs, pipeline) {
  if (c.profile !== 'mine') {
    const seed = DEMO_PROFILES[c.profile];
    return { source: 'demo', label: seed.label, inputs: seed.entities.map(e => e.name), tags: seed.tags, freeText: seed.freeText, cached: false };
  }
  const list = [...new Set((Array.isArray(inputs) ? inputs : []).map(s => String(s).trim()).filter(Boolean).map(s => s.slice(0, 80)))].slice(0, 10);
  if (!list.length) return null;
  const key = list.map(s => s.toLowerCase()).sort().join('|');
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.at < TTL) return { ...hit.taste, cached: true };
  const res = await pipeline({ inputs: list, freeText: [], topLooks: 1 });
  const src = res.meta?.taste_source ?? 'none';
  const taste = {
    source: src === 'qloo' && res.meta?.qloo_powered ? 'qloo' : src === 'local_artist_map' ? 'local_artist_map' : 'none',
    label: 'Your taste', inputs: list, tags: (res.tags ?? []).map(t => (typeof t === 'string' ? { name: t } : t)), freeText: [], cached: false,
    qlooError: res.meta?.qloo_error ?? null,
  };
  if (CACHE.size >= MAX) CACHE.delete(CACHE.keys().next().value);
  CACHE.set(key, { at: Date.now(), taste });
  return taste;
}

/** Which tags moved which dimension, and by how much weight (affinity-normalised as in aesthetic.js). */
export function tastePath(tags, freeText = []) {
  const items = [...tags.map(t => ({ name: String(t.name ?? t), aff: affinityOf(t) })), ...freeText.map(n => ({ name: n, aff: null }))];
  const known = items.map(i => i.aff).filter(a => a != null); const mean = known.length ? known.reduce((a, b) => a + b, 0) / known.length : 0;
  const norm = s => s.toLowerCase().replace(/[_-]/g, ' ').trim();
  const has = (n, list) => list.some(k => n.includes(norm(k)));
  const out = [];
  for (const it of items) {
    const n = norm(it.name); const w = it.aff != null && mean > 0 ? it.aff / mean : 1;
    const pushes = [];
    for (const [dim, pos, neg] of [['intensity', 'high', 'low'], ['warmth', 'warm', 'cool'], ['boldness', 'high', 'low']]) {
      if (has(n, TAG_SIGNALS[dim][pos])) pushes.push({ dim, dir: 1 });
      if (has(n, TAG_SIGNALS[dim][neg])) pushes.push({ dim, dir: -1 });
    }
    const tx = TAG_SIGNALS.texture;
    if (has(n, tx.glass)) pushes.push({ dim: 'texture', dir: 1 });
    if (has(n, tx.matte)) pushes.push({ dim: 'texture', dir: -1 });
    if (has(n, tx.shimmer)) pushes.push({ dim: 'texture', dir: 0 });
    if (pushes.length) out.push({ tag: it.name, affinity: it.aff, weight: r2(w), pushes });
  }
  return out.sort((a, b) => b.weight - a.weight);
}

// ---- Colour warmth, for ordering a look's own tones by your blended warmth --------------------------
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const warmthOf = h => { const [r, , b] = hexRgb(h); return Math.max(0, Math.min(1, 0.5 + (r - b) / 400)); };
function paletteFor(look, v) {
  const p = Object.fromEntries(look.products.map(x => [x.category, x]));
  const tones = (p.eyeshadow?.tones ?? []).map(t => ({ name: t, hex: coloursIn(t)[0] ?? null })).filter(t => t.hex);
  const ranked = [...tones].sort((a, b) => Math.abs(warmthOf(a.hex) - v.warmth) - Math.abs(warmthOf(b.hex) - v.warmth));
  const lipName = p.lip?.shade ?? 'nude'; const lip = coloursIn(lipName)[0] ?? null;
  return {
    lid: ranked.slice(0, v.boldness > 0.6 ? 3 : 2), lip: { name: lipName, hex: lip, finish: p.lip?.finish ?? null },
    highlight: { name: p.highlight?.finish ?? null, hex: coloursIn(p.highlight?.finish ?? '')[0] ?? '#f3ead8' },
    liner: p.liner?.style ?? null, lash: p.lash?.style ?? null, base: p.foundation ? `${p.foundation.finish ?? ''} ${p.foundation.coverage ?? ''}`.trim() : null,
    finish: v.texture > 0.66 ? 'glass' : v.texture < 0.34 ? 'matte' : 'shimmer', drama: r2(v.intensity),
  };
}

function leap(dest, user, s, path, culturalTags) {
  const blend = Object.fromEntries(DIMS.map(({ id }) => [id, r2(user[id] * (1 - s) + dest.vector[id] * s)]));
  const vec = { ...user, ...blend };
  const ranked = dest.looks.map(l => ({ l, score: r2(scoreLook(l, vec)) })).sort((a, b) => b.score - a.score);
  const top = ranked[0].l;
  const dims = DIMS.map(({ id, label, low, high }) => {
    const movers = path.filter(p => p.pushes.some(x => x.dim === id && x.dir !== 0)).slice(0, 3).map(p => ({ tag: p.tag, dir: p.pushes.find(x => x.dim === id).dir }));
    const kept = Math.abs(blend[id] - user[id]) < 0.06;
    return { id, label, you: r2(user[id]), city: dest.vector[id], leap: blend[id], kept, word: blend[id] >= 0.5 ? high : low, movers };
  });
  const shared = (culturalTags ?? []).filter(t => top.cultural_affinity.some(c => t.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(t.toLowerCase())));
  return {
    destination: { id: dest.id, label: dest.label, culture: dest.culture },
    look: { id: top.id, name: top.name, description: top.description, score: ranked[0].score, archetype: top.archetype },
    alternatives: ranked.slice(1, 3).map(x => ({ id: x.l.id, name: x.l.name, score: x.score })),
    vector: blend, dims, palette: paletteFor(top, vec), sharedCulture: shared,
    because: dims.filter(d => d.movers.length).map(d => `${d.label} ${d.word} (${d.leap}): ${d.kept ? 'your taste held it' : `you ${d.you} → ${dest.label} ${d.city}`}, moved by ${d.movers.map(m => m.tag).join(', ')}`),
  };
}

export function leapOptions() {
  return { profiles: PROFILES, destinations: DESTINATIONS.map(d => ({ id: d.id, label: d.label, culture: d.culture, looks: d.looks.length })), strengths: STRENGTHS.map(({ id, label }) => ({ id, label })), tones: MONK_TONES, dims: DIMS };
}

export async function buildLeapPlan(input = {}, { pipeline = runPipeline } = {}) {
  const raw = input && typeof input === 'object' ? input : {};
  const ids = DESTINATIONS.map(d => d.id);
  const c = {
    profile: pick(raw.profile, PROFILES.map(p => p.id), DEFAULTS.profile),
    dest1: pick(raw.dest1, ids, DEFAULTS.dest1), dest2: pick(raw.dest2, ids, DEFAULTS.dest2), dest3: pick(raw.dest3, ids, DEFAULTS.dest3),
    strength: pick(raw.strength, STRENGTHS.map(s => s.id), DEFAULTS.strength),
    tone: pick(raw.tone, MONK_TONES.map(t => t.id), DEFAULTS.tone),
    focus: pick(raw.focus, ['0', '1', '2'], DEFAULTS.focus),
  };
  let taste = await tasteFor(c, raw.inputs, pipeline);
  let note = null;
  if (!taste) { taste = await tasteFor({ ...c, profile: DEFAULTS.profile }, null, pipeline); note = 'You have not added any taste yet, so this uses the Afrobeats demo profile. Add artists, films or places on the Taste page.'; }
  const user = buildAestheticVector(taste.tags, { freeText: taste.freeText });
  const path = tastePath(taste.tags, taste.freeText);
  const home = recommendLooks(user, { topN: 1 })[0];
  const s = STRENGTHS.find(x => x.id === c.strength).s;
  const leaps = [c.dest1, c.dest2, c.dest3].map(id => leap(DESTINATIONS.find(d => d.id === id), user, s, path, user.cultural_tags));
  return {
    choices: c, note,
    tone: MONK_TONES.find(t => t.id === c.tone),
    taste: {
      source: taste.source, label: taste.label, inputs: taste.inputs, cached: taste.cached, qlooError: taste.qlooError ?? null,
      badge: { demo: 'Demo profile (curated tags, not live Qloo data)', qloo: 'Live Qloo taste graph', local_artist_map: 'Built-in artist map (Qloo returned nothing)', none: 'No taste signal found: neutral defaults' }[taste.source],
      tags: taste.tags.slice(0, 12).map(t => ({ name: String(t.name ?? t), affinity: affinityOf(t) })),
      vector: Object.fromEntries(DIMS.map(({ id }) => [id, r2(user[id])])), palette: user.colour_palette, archetypes: user.archetypes,
      path: path.slice(0, 10),
    },
    home: home ? { id: home.look.id, name: home.look.name, score: home.score, palette: paletteFor(home.look, user) } : null,
    strength: { id: c.strength, s },
    leaps,
    focus: leaps[Number(c.focus)],
  };
}
