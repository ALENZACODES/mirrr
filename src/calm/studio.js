/**
 * Calm & Self-Image studio: a supportive, non-clinical ritual planner. Pick your community and one
 * of its signature rituals, how much time you have, what you want help with (calm, self-image,
 * connection or stress shedding), one ritual-design principle, the season, a scent, your hair type
 * and Fitzpatrick type; the plan quotes the two mental-health guides on the Mind & Self-Image shelf
 * (after the audit in wire/ops-b17-*.mjs).
 *
 * Crisis lines are always part of the plan, for the region you choose, and they are only the
 * services the guide lists (numbers checked on each service's own site, October 2026). Nothing
 * here diagnoses or treats anything.
 */
import {
  ETHNIC_MENTAL_HEALTH_BEAUTY_GUIDES as GUIDES, EXTENDED_RITUAL_GUIDES as EXTENDED, CORTISOL_SKIN_SCIENCE as CORTISOL,
  UNIVERSAL_BEAUTY_MENTAL_HEALTH as UNIVERSAL, BEAUTY_PSYCHOLOGY_DEEP_DIVE as PSYCH, MENTAL_HEALTH_CRISIS_RESOURCES as CRISIS,
  HAIR_MENTAL_HEALTH_SCIENCE as HAIR_SCI, RITUAL_DESIGN_PRINCIPLES as DESIGN, SEASONAL_BEAUTY_MENTAL_HEALTH as SEASONAL,
  searchAllRituals,
} from '../mental_health_beauty_ethnic_guide.js';
import { ETHNIC_MENTAL_HEALTH_BEAUTY_GUIDES as BASIC, SELF_CARE_SCIENCE } from '../mental_health_beauty_guide.js';
import { MONK_TONES, FITZPATRICK } from '../skin/clinic.js';
import { LIBRARY_COMMUNITIES, resolveCommunity } from '../library/communities.js';

const kebab = id => id.replace(/_/g, '-');
const pick = (v, list, d) => (list.includes(String(v)) ? String(v) : d);
const human = k => k.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase());

export const MINUTES = [
  { id: '10', label: '10 minutes', steps: 3 },
  { id: '20', label: '20 minutes', steps: 5 },
  { id: '45', label: '45 minutes or more', steps: Infinity },
];
export const FOCUS = [
  { id: 'calm', label: 'Feeling calmer' },
  { id: 'image', label: 'Kinder self-image' },
  { id: 'connection', label: 'Feeling connected' },
  { id: 'shedding', label: 'Stress and hair shedding' },
];
const PRINCIPLE_IDS = ['time', 'senses', 'repeat', 'private', 'heritage', 'receive'];
export const PRINCIPLES = DESIGN.principles.map((p, i) => ({ id: PRINCIPLE_IDS[i], label: p.name, description: p.description, practical: p.practical_application }));
const SEASON_IDS = ['winter', 'spring', 'summer', 'autumn'];
export const SEASONS = SEASONAL.seasons.map((s, i) => ({ id: SEASON_IDS[i], label: s.season, s }));
const SCENT_IDS = ['rose', 'frankincense', 'coconut', 'sandalwood', 'ylang-ylang', 'lavender', 'jasmine', 'vetiver'];
export const SCENTS = PSYCH.scent_and_emotion.key_scents_and_effects.map((s, i) => ({ id: SCENT_IDS[i], label: s.scent, effect: s.effect, traditions: s.traditions }));
export const HAIR = [
  { id: 'type12', label: 'Straight or wavy (Type 1–2)', i: 2 },
  { id: 'type3', label: 'Curly (Type 3)', i: 1 },
  { id: 'type4', label: 'Coily (Type 4)', i: 0 },
];
export const REGIONS = [
  { id: 'canada', label: 'Canada' },
  { id: 'united-states', label: 'United States' },
  { id: 'united-kingdom', label: 'United Kingdom' },
  { id: 'south-africa', label: 'South Africa' },
  { id: 'australia', label: 'Australia' },
  { id: 'other', label: 'Somewhere else' },
];
const DEFAULTS = { community: 'west_african', ritual: '0', minutes: '20', focus: 'calm', principle: 'time', season: 'autumn', scent: 'rose', hair: 'type4', region: 'canada', fitzpatrick: 'V' };

/** Which senses a ritual uses, read from its own words (drives the senses picture). */
const SENSE_WORDS = {
  touch: /massag|touch|hands|braid|scrub|pat|stroke|comb|oil(ing)?\b|butter|mitt|gua sha/i,
  smell: /scent|smell|incense|fragran|rose|oud|frankincense|aroma|perfume|bukhoor|copal|myrrh/i,
  sound: /sing|music|song|playlist|conversation|laughter|storytelling|talk/i,
  warmth: /warm|hot|steam|heat|cool|cold|bath|sea|water/i,
};
const senses = text => Object.fromEntries(Object.entries(SENSE_WORDS).map(([k, re]) => [k, re.test(text)]));

const STRING_EXTRAS = r => Object.entries(r)
  .filter(([k]) => !['name', 'mental_health_function', 'description'].includes(k))
  .map(([k, v]) => ({
    label: human(k),
    text: typeof v === 'string' ? v : Array.isArray(v) ? v.map(x => (typeof x === 'string' ? x : Object.values(x).join(': '))).join('; ') : Object.entries(v).map(([a, b]) => `${human(a)}: ${b}`).join('; '),
  }));

export function ritualsFor(cid) {
  return (GUIDES[kebab(cid)]?.signature_rituals ?? []).map((r, i) => ({ id: String(i), label: r.name }));
}

/** Which hair-and-identity entry in the guide covers each community (the guide has none for the others). */
const HAIR_IDENTITY = { 'black-american': 0, caribbean: 0, 'south-asian': 1, latina: 2, 'west-african': 4, 'east-african': 4 };

function focusPlan(focus, dash, hairIdx) {
  const g = GUIDES[dash]; const basic = BASIC[dash] ?? {};
  if (focus === 'calm') {
    return {
      id: focus, label: 'Feeling calmer', intro: CORTISOL.parasympathetic_activation.overview,
      points: CORTISOL.parasympathetic_activation.mechanisms.map(m => ({ title: m.name, text: m.detail })),
      extra: SELF_CARE_SCIENCE.ritual,
    };
  }
  if (focus === 'image') {
    const a = PSYCH.appearance_satisfaction; const hairId = HAIR_SCI.hair_and_identity.entries[HAIR_IDENTITY[dash]];
    return {
      id: focus, label: 'Kinder self-image', intro: a.overview,
      points: a.key_research_findings.map(f => ({ title: f.finding, text: f.implication })),
      community: [...(g.mental_health_context?.dominant_stressors ?? [])],
      identity: hairId?.narrative ? { community: hairId.community, text: hairId.narrative } : null,
      affirming: CORTISOL.political_dimension.affirming_frame,
      check: { ritual: UNIVERSAL.ritual_vs_compulsion.description, signs: UNIVERSAL.beauty_dysmorphia.warning_signs, about: UNIVERSAL.beauty_dysmorphia.description },
    };
  }
  if (focus === 'connection') {
    const r = DESIGN.principles[5];
    return {
      id: focus, label: 'Feeling connected', intro: UNIVERSAL.social_beauty.description,
      points: [{ title: r.name, text: `${r.description} ${r.practical_application}` }],
      community: [...(g.mental_health_context?.protective_cultural_factors ?? []), ...(g.mental_health_resources?.affirming_practices ?? [])],
      extra: Object.entries(basic).filter(([k]) => !['community', 'selfCareRecommendations'].includes(k)).map(([, v]) => v)[0] ?? null,
    };
  }
  const te = HAIR_SCI.telogen_effluvium; const t = te.by_hair_type[hairIdx];
  return {
    id: focus, label: 'Stress and hair shedding', intro: te.overview,
    points: [{ title: t.type, text: t.specific_concerns.join(' ') }, { title: CORTISOL.mechanism.pathways[3].name, text: CORTISOL.mechanism.pathways[3].detail }],
    steps: te.universal_recovery_protocol,
  };
}

function skinPlan(fitz) {
  const level = FITZPATRICK.indexOf(fitz);
  const P = CORTISOL.mechanism.pathways;
  // The guide names pigment as "a particular concern for skin tones with higher baseline melanin density".
  const order = level >= 3 ? [4, 2, 0, 5] : [2, 0, 5, 4];
  return { type: fitz, level, deeper: level >= 3, intro: CORTISOL.mechanism.overview, pathways: order.map(i => ({ title: P[i].name, text: P[i].detail })) };
}

function supportPlan(region) {
  const r = REGIONS.find(x => x.id === region);
  return { region, label: r.label, note: CRISIS.note, lines: CRISIS.by_region[region] ?? [], global: CRISIS.global };
}

export function buildCalmPlan(input = {}) {
  const cid = resolveCommunity(input.community ?? DEFAULTS.community).id ?? DEFAULTS.community;
  const dash = kebab(cid); const g = GUIDES[dash]; const x = EXTENDED[dash]; const basic = BASIC[dash] ?? {};
  const rituals = ritualsFor(cid);
  const ritualId = pick(input.ritual, rituals.map(r => r.id), '0');
  const minutes = pick(input.minutes, MINUTES.map(m => m.id), DEFAULTS.minutes);
  const focus = pick(input.focus, FOCUS.map(f => f.id), DEFAULTS.focus);
  const principle = pick(input.principle, PRINCIPLE_IDS, DEFAULTS.principle);
  const season = pick(input.season, SEASON_IDS, DEFAULTS.season);
  const scent = pick(input.scent, SCENT_IDS, DEFAULTS.scent);
  const hair = pick(input.hair, HAIR.map(h => h.id), DEFAULTS.hair);
  const region = pick(input.region, REGIONS.map(r => r.id), DEFAULTS.region);
  const fitz = pick(input.fitzpatrick, FITZPATRICK, DEFAULTS.fitzpatrick);
  const tone = MONK_TONES.find(t => t.id === input.tone) ?? MONK_TONES[6];

  const r = g.signature_rituals[Number(ritualId)];
  const steps = x.stress_protocol.steps; const m = MINUTES.find(v => v.id === minutes);
  // A shorter session keeps the opening steps and the closing step, so it still has an end.
  const fit = m.steps >= steps.length ? steps : [...steps.slice(0, m.steps - 1), steps[steps.length - 1]];
  const sObj = SEASONS.find(v => v.id === season); const s = sObj.s;
  const seasonal = s.community_winter_practices ?? s.community_summer_practices ?? {};
  const sc = SCENTS.find(v => v.id === scent);
  const h = HAIR.find(v => v.id === hair); const hairType = HAIR_SCI.telogen_effluvium.by_hair_type[h.i];
  const pr = PRINCIPLES.find(v => v.id === principle);
  const ritualText = [r.name, r.description, ...fit].join(' ');

  return {
    choices: { community: cid, ritual: ritualId, minutes, focus, principle, season, scent, hair, region, fitzpatrick: fitz, tone: tone.id },
    tone,
    community: { id: cid, label: g.communityName, hero: g.heroText ?? null, recommendations: basic.selfCareRecommendations ?? null },
    ritual: { id: ritualId, name: r.name, function: r.mental_health_function, description: r.description ?? null, extras: STRING_EXTRAS(r), senses: senses(ritualText) },
    session: { minutes: Number(minutes), label: m.label, protocol: x.stress_protocol.name, steps: fit, allSteps: steps.length, short: fit.length < steps.length },
    more: x.additional_rituals.map(a => ({ name: a.name, origin: a.origin ?? null, function: a.mental_health_function ?? null, description: a.description ?? null })),
    focus: focusPlan(focus, dash, h.i),
    principle: pr,
    season: { id: season, label: sObj.label, mind: s.mental_health_concerns, skin: s.skin_concerns, adjustments: s.beauty_adjustments, community: seasonal[dash] ?? null },
    scent: { id: scent, label: sc.label, effect: sc.effect, traditions: sc.traditions, yours: sc.traditions.includes(g.communityName), note: PSYCH.scent_and_emotion.practice_note },
    hair: { id: hair, label: h.label, concerns: hairType.specific_concerns },
    skin: skinPlan(fitz),
    support: supportPlan(region),
  };
}

export function calmOptions() {
  return {
    communities: LIBRARY_COMMUNITIES,
    rituals: Object.fromEntries(LIBRARY_COMMUNITIES.map(c => [c.id, ritualsFor(c.id)])),
    minutes: MINUTES.map(({ id, label }) => ({ id, label })),
    focus: FOCUS,
    principles: PRINCIPLES.map(({ id, label }) => ({ id, label })),
    seasons: SEASONS.map(({ id, label }) => ({ id, label })),
    scents: SCENTS.map(({ id, label }) => ({ id, label })),
    hair: HAIR.map(({ id, label }) => ({ id, label })),
    regions: REGIONS,
    fitzpatrick: FITZPATRICK,
    tones: MONK_TONES,
  };
}

/** Search every community's rituals by a word (uses the guide's own search). */
export function searchCalmRituals(q) {
  const t = String(q ?? '').trim().slice(0, 60);
  if (t.length < 3) return { query: t, results: [] };
  return {
    query: t,
    results: searchAllRituals(t).slice(0, 12).map(x => ({ community: x.communityName, name: x.ritual.name, function: x.ritual.mental_health_function ?? null })),
  };
}
