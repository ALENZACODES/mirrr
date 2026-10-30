/**
 * Stylist refinement: each message moves the user's current taste vector (so turns compound),
 * occasion words lift matching looks, and the reply reports exactly what changed, or says plainly
 * that nothing did. Pure functions; no network.
 */
import { recommendLooks } from '../look_engine.js';
import { ARCHETYPE_KEYWORDS } from '../aesthetic.js';

const STEP = 0.15;
const clamp01 = v => Math.max(0, Math.min(1, v));
const DIMS = ['intensity', 'warmth', 'boldness', 'texture'];

/** Direction words in a message -> changes to the four taste dimensions. */
export function messageDeltas(message = '') {
  const m = String(message).toLowerCase();
  const d = { intensity: 0, warmth: 0, boldness: 0, texture: 0 };
  const why = [];
  const toneDown = /\b(less|tone(d)? (it )?down|not so|too)\b/.test(m);
  if (!toneDown && /\b(bold(er)?|dramatic|intense|stronger|statement|more colou?r|brighter|louder|glam(orous)?)\b/.test(m)) { d.intensity += STEP; d.boldness += STEP; why.push('bolder'); }
  if (/\b(subtle(r)?|soft(er)?|natural|lighter|less|minimal|understated|toned? down|simpler)\b/.test(m)) { d.intensity -= STEP; d.boldness -= STEP; why.push('softer'); }
  if (/\b(warm(er)?|golden|bronze|terracotta|sunset)\b/.test(m)) { d.warmth += STEP; why.push('warmer'); }
  if (/\b(cool(er)?|icy|silver|berry|plum|blue)\b/.test(m)) { d.warmth -= STEP; why.push('cooler'); }
  if (/\b(glossy|dewy|shine|shiny|glow(y)?|glass skin|luminous)\b/.test(m)) { d.texture += STEP; why.push('glossier'); }
  if (/\b(matte|velvet|powder(y)?|flat)\b/.test(m)) { d.texture -= STEP; why.push('more matte'); }
  return { d, why };
}

export const OCCASIONS = [
  { id: 'wedding', ask: /\b(wedding|bridal|bride|nikah|mehndi|engagement|ceremony)\b/, look: /bridal|bride|wedding|mehndi|nikah|umembeso|umabo/ },
  { id: 'festival', ask: /\b(festival|carnival|coachella|concert|afropunk|rave)\b/, look: /festival|carnival|concert|afropunk|stage/ },
  { id: 'work', ask: /\b(work|office|everyday|daytime|interview|school)\b/, look: /everyday|office|minimal|natural|day|soft|clean/ },
  { id: 'night out', ask: /\b(night|party|club|date|evening|dinner)\b/, look: /night|party|club|date|evening|drama/ },
];

const lookText = l => `${l.id} ${l.name} ${l.description ?? ''} ${(l.tags ?? []).join(' ')} ${l.occasion ?? ''}`.toLowerCase();

/** Apply one message to a vector and re-rank. `evidence` is the Qloo kept-tag list (optional). */
export function refineLooks({ vec, message = '', evidence = null, previousLookIds = [], topN = 6 }) {
  const r2 = v => Math.round(v * 100) / 100;
  const before = Object.fromEntries(DIMS.map(k => [k, r2(Number.isFinite(vec?.[k]) ? vec[k] : 0.5)]));
  const { d, why } = messageDeltas(message);
  const after = Object.fromEntries(DIMS.map(k => [k, r2(clamp01(before[k] + d[k]))]));
  // An occasion, once asked for, carries into later turns until another one is named.
  const asked = OCCASIONS.find(o => o.ask.test(String(message).toLowerCase())) ?? null;
  const occasion = asked ?? OCCASIONS.find(o => o.id === vec?.occasion) ?? null;
  const newVec = { ...vec, ...after, occasion: occasion?.id ?? null };
  // Rank every look, then lift those that fit the asked-for occasion by a fixed, stated amount.
  const OCC = 0.15;
  let ranked = recommendLooks(newVec, { topN: 200, minScore: 0, evidence, archetypeKeywords: evidence?.length ? ARCHETYPE_KEYWORDS : null });
  if (occasion) {
    ranked = ranked.map(r => (occasion.look.test(lookText(r.look)) ? { ...r, occasionMatch: occasion.id, score: Math.round((r.score + OCC) * 100) / 100 } : r))
      .sort((a, b) => b.score - a.score || b.fit - a.fit);
  }
  const looks = ranked.slice(0, topN);
  const ids = looks.map(r => r.look.id);
  const prev = previousLookIds.slice(0, topN);
  const added = ids.filter(id => !prev.includes(id));
  const sameOrder = prev.length === ids.length && prev.every((id, i) => id === ids[i]);
  const moved = DIMS.filter(k => after[k] !== before[k]);
  const changes = {
    dims: Object.fromEntries(moved.map(k => [k, { from: before[k], to: after[k] }])),
    asked: why, occasion: occasion?.id ?? null, occasionNew: !!asked, occasionLift: occasion ? OCC : 0,
    occasionLooks: occasion ? looks.filter(r => r.occasionMatch).map(r => r.look.name) : [],
    newLooks: added.length, sameOrder: prev.length ? sameOrder : null, topChanged: prev.length ? prev[0] !== ids[0] : null,
  };
  return { vec: newVec, looks, changes };
}

/** A reply that says what actually changed. */
export function describeChanges(changes, looks) {
  const parts = [];
  const nameOf = k => ({ intensity: 'Intensity', warmth: 'Warmth', boldness: 'Boldness', texture: 'Shine' }[k]);
  const dimText = Object.entries(changes.dims).map(([k, v]) => `${nameOf(k)} ${Math.round(v.from * 100)} → ${Math.round(v.to * 100)}`);
  if (dimText.length) parts.push(`I moved your profile: ${dimText.join(', ')}.`);
  else if (changes.asked.length) parts.push(`Your profile is already at the limit for "${changes.asked.join(', ')}", so it could not move further.`);
  if (changes.occasion && !changes.occasionNew) parts.push(`Still lifting ${changes.occasion} looks by ${changes.occasionLift.toFixed(2)}.`);
  else if (changes.occasion) parts.push(changes.occasionLooks.length ? `For a ${changes.occasion}, I lifted looks made for it by ${changes.occasionLift.toFixed(2)}: ${changes.occasionLooks.slice(0, 3).join(', ')}.` : `I looked for ${changes.occasion} looks, but none of the top looks are made for one.`);
  if (!dimText.length && !changes.occasionNew && !changes.asked.length) parts.push('I did not find a direction in that message (try "bolder", "softer", "warmer", "glossier", "matte" or an occasion like "wedding").');
  if (changes.sameOrder === true) parts.push('The ranking did not change: the same six looks, in the same order.');
  else if (changes.sameOrder === false) parts.push(`${changes.newLooks ? `${changes.newLooks} new look${changes.newLooks === 1 ? '' : 's'} in your top six` : 'Same six looks, re-ordered'}${changes.topChanged ? `; new top pick: ${looks[0]?.look?.name}` : `; top pick still ${looks[0]?.look?.name}`}.`);
  return parts.join(' ');
}
