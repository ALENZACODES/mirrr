/**
 * Night Routine planner: tonight's skincare in the right order, how to protect your hair while you
 * sleep, what your sleep position and hours do to skin, and your community's night traditions.
 *
 * Hair texture picks the protection methods the guide names for it; skin type decides between
 * slugging and a lighter seal; the active sets the treatment step and what not to combine;
 * Fitzpatrick type sets exfoliant strength; position and hours add their effects. Community adds
 * traditions only.
 */
import {
  HAIR_PROTECTION_SLEEP_METHODS, CIRCADIAN_SKINCARE_TIMING, UNIVERSAL_SLEEP_BEAUTY_OPTIMIZATION,
  BEAUTY_SLEEP_SCIENCE, SLEEP_DEPRIVATION_BEAUTY_SCIENCE, PRE_SLEEP_WIND_DOWN_RITUALS, COMMUNITY_SLEEP_BEAUTY_SUMMARY,
  getSleepBeautyGuide, getOvernightIngredientsByHeritage,
} from '../sleep_beauty_ethnic_guide.js';
import { PM_SKINCARE_ROUTINE, SLUGGING_GUIDE, SLEEP_POSITION_GUIDE, OVERNIGHT_TREATMENTS, getEthnicNighttimeBeauty } from '../night_beauty_guide.js';
import { MONK_TONES, FITZPATRICK } from '../skin/clinic.js';
import { LIBRARY_COMMUNITIES, resolveCommunity } from '../library/communities.js';

export const HAIR = [
  { id: 'straight', label: 'Straight or wavy (types 1-2)' }, { id: 'curly', label: 'Curly (types 3A-3C)' },
  { id: 'coily', label: 'Coily (types 4A-4C)' }, { id: 'braids', label: 'Braids, twists or locs' },
];
export const METHODS = Object.entries(HAIR_PROTECTION_SLEEP_METHODS.methodsByType).map(([id, m]) => ({ id, label: m.name }));
export const SKIN = [{ id: 'dry', label: 'Dry' }, { id: 'normal', label: 'Normal' }, { id: 'oily', label: 'Oily' }, { id: 'acne', label: 'Acne-prone' }];
const EVENING = CIRCADIAN_SKINCARE_TIMING.evening.bestIngredients;
export const ACTIVES = [
  { id: 'none', label: 'No active tonight' }, { id: 'retinoid', label: 'Retinoid', index: 0 }, { id: 'exfoliant', label: 'AHA/BHA exfoliant', index: 1 },
  { id: 'peptides', label: 'Peptides', index: 2 }, { id: 'barrier', label: 'Barrier repair (ceramides)', index: 3 }, { id: 'pigment', label: 'Tranexamic or azelaic acid', index: 4 },
];
export const POSITIONS = Object.entries(SLEEP_POSITION_GUIDE).map(([id, p]) => ({ id, label: p.position }));
export const HOURS = [5, 6, 7, 8, 9];

/** Which hair each protection method is named best for in the guide. */
const FOR_HAIR = {
  straight: /Type 1|Type 2|straight|wavy|All (hair )?textures/i,
  curly: /Type 3[ABC]|All (hair )?textures/i,
  coily: /Type 4|Natural coils|All (hair )?textures/i,
  braids: /Braided|All (hair )?textures/i,
};
export function methodsForHair(hair) {
  return METHODS.filter(m => HAIR_PROTECTION_SLEEP_METHODS.methodsByType[m.id].bestFor.some(b => FOR_HAIR[hair].test(b))).map(m => m.id);
}

const pick = (v, list, d) => (list.includes(v) ? v : d);
const dash = id => id.replace(/_/g, '-');
const deepSkin = fitz => ['IV', 'V', 'VI'].includes(fitz);

function routine(skin, active, fitz) {
  const steps = PM_SKINCARE_ROUTINE.steps;
  const name = n => steps.find(s => s.step === n);
  const out = [{ step: 'Cleanse', detail: name(2).why }];
  const a = ACTIVES.find(x => x.id === active);
  if (a.index !== undefined) {
    const e = EVENING[a.index];
    out.push({ step: e.ingredient, detail: e.timing, beginner: e.beginner ?? null, strength: active === 'exfoliant' && deepSkin(fitz) ? e.ethnicConsideration : null });
  }
  const creams = name(7).products.split('. ');
  out.push({ step: 'Moisturiser', detail: skin === 'oily' || skin === 'acne' ? creams[1] : creams[0] });
  if (skin === 'dry') out.push({ step: 'Slugging: a thin layer of petroleum jelly', detail: SLUGGING_GUIDE.how_to.step3 });
  else if (skin === 'normal') out.push({ step: 'Sleeping mask, a few nights a week', detail: OVERNIGHT_TREATMENTS.sleeping_masks.how });
  else out.push({ step: 'Skip heavy occlusives', detail: SLUGGING_GUIDE.who_should_avoid.find(x => (skin === 'acne' ? /acne/i : /oily/i).test(x)) });
  return out;
}

function conflicts(active) {
  const rules = CIRCADIAN_SKINCARE_TIMING.phaseRelationships.doNotCombineOnSameNight;
  const match = { retinoid: /Retinoids \+ AHA/, exfoliant: /AHA\/BHA/ }[active];
  const broken = active === 'none' || active === 'barrier' ? [] : rules.filter(r => /compromised barrier/.test(r));
  return {
    avoid: [...(match ? rules.filter(r => match.test(r)) : []), ...broken],
    fine: active === 'none' ? [] : CIRCADIAN_SKINCARE_TIMING.phaseRelationships.safeToLayer.filter(r => r.toLowerCase().includes({ retinoid: 'retinoid', peptides: 'peptide', barrier: 'ceramide', exfoliant: 'any other active', pigment: 'any other active' }[active])),
  };
}

function sleepPlan(hours, position) {
  const t = UNIVERSAL_SLEEP_BEAUTY_OPTIMIZATION.timingBeautySleep;
  return {
    hours, enough: hours >= 7, duration: t.totalDuration, deepSleep: t.goldenHours,
    shortSleepEffects: hours < 7 ? BEAUTY_SLEEP_SCIENCE.sleepDeprivationEffects.immediate : null,
    position: SLEEP_POSITION_GUIDE[position],
    environment: Object.fromEntries(Object.entries(UNIVERSAL_SLEEP_BEAUTY_OPTIMIZATION.environmentForBeautySleep).map(([k, v]) => [k, v.optimal ?? v.recommendation])),
  };
}

function communityNotes(cid) {
  const d = dash(cid); const g = getSleepBeautyGuide(d);
  return {
    traditions: getEthnicNighttimeBeauty(cid)?.traditions ?? null,
    summary: COMMUNITY_SLEEP_BEAUTY_SUMMARY[d],
    scent: PRE_SLEEP_WIND_DOWN_RITUALS.aromaticSleepCuesByCommunity[d],
    philosophy: g.sleepBeautyPhilosophy,
    rituals: Object.values(g.traditionalSleepBeautyRituals).map(r => ({ name: r.name, description: r.description ?? null })),
    ingredients: Object.entries(getOvernightIngredientsByHeritage(d)).map(([id, x]) => ({ id, overnight: x.overnight })),
  };
}

export function buildNightPlan(input = {}) {
  const cid = resolveCommunity(input.community ?? 'west_african').id ?? 'west_african';
  const hair = pick(input.hair, HAIR.map(x => x.id), 'coily');
  const method = pick(input.method, METHODS.map(x => x.id), 'bonnet');
  const skin = pick(input.skin, SKIN.map(x => x.id), 'normal');
  const active = pick(input.active, ACTIVES.map(x => x.id), 'none');
  const position = pick(input.position, POSITIONS.map(x => x.id), 'side_sleeping');
  const hours = pick(Number(input.hours), HOURS, 7);
  const fitz = pick(input.fitzpatrick, FITZPATRICK, 'V');
  const tone = MONK_TONES.find(t => t.id === input.tone) ?? MONK_TONES[6];
  const suited = methodsForHair(hair);
  const m = HAIR_PROTECTION_SLEEP_METHODS.methodsByType[method];
  return {
    community: { id: cid, label: LIBRARY_COMMUNITIES.find(x => x.id === cid)?.label ?? cid },
    choices: { hair, method, skin, active, position, hours, fitzpatrick: fitz, community: cid, tone: tone.id },
    tone,
    hairProtection: {
      method: { id: method, name: m.name, description: m.description ?? null, tips: m.tips ?? null, choosing: m.choosing ?? null, bestFor: m.bestFor },
      suited: suited.includes(method), suggested: suited.map(id => METHODS.find(x => x.id === id).label),
      overnightMask: hair === 'straight' ? null : OVERNIGHT_TREATMENTS.hair_masks,
    },
    skinType: { type: fitz, darkMarks: deepSkin(fitz) ? SLEEP_DEPRIVATION_BEAUTY_SCIENCE.chronicEffects.hyperpigmentation.risk : null },
    routine: routine(skin, active, fitz),
    conflicts: conflicts(active),
    sleep: sleepPlan(hours, position),
    windDown: Object.values(PRE_SLEEP_WIND_DOWN_RITUALS.universalWindDownSequence).map(s => ({ name: s.name, time: s.time, action: s.action })),
    communityNotes: communityNotes(cid),
  };
}

export function nightOptions() {
  return {
    communities: LIBRARY_COMMUNITIES.map(x => ({ id: x.id, label: x.label })), fitzpatrick: FITZPATRICK,
    hair: HAIR, methods: METHODS, skin: SKIN, actives: ACTIVES.map(({ id, label }) => ({ id, label })), positions: POSITIONS,
    hours: HOURS.map(h => ({ id: h, label: `${h} hours` })), tones: MONK_TONES,
  };
}
