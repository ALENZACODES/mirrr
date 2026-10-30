/**
 * Routine Builder: a morning and night skincare routine built from your own answers. You pick your
 * Fitzpatrick type (how your skin reacts to sun), your undertone, how your skin feels, your main
 * concern, your climate, how many steps you want and whether you are pregnant or breastfeeding. The
 * studio picks ingredients from the audited ingredient guide (src/skin_analysis.js, wire/ops-b20-skin.mjs),
 * paces strong actives for your type, keeps clashing ingredients apart and lays out the week.
 *
 * Skin type is never assigned from a community or a colour. A heritage is optional and only adds
 * traditional ingredients and rituals as swaps. The tone only changes the picture.
 */
import {
  FITZPATRICK_EXTENDED, UNDERTONE_PROFILES, SKINCARE_INGREDIENTS, SKINCARE_ROUTINES,
  getIngredient, getUndertoneProfile, getFitzpatrickInfo, getSkincareRoutine, searchIngredients,
} from '../skin_analysis.js';
import { MONK_TONES } from '../skin/clinic.js';
import { LIBRARY_COMMUNITIES, canonicalCommunity } from '../library/communities.js';

const pick = (v, list, d) => (list.some(x => x.id === String(v)) ? String(v) : d);

export const TYPES = Object.values(FITZPATRICK_EXTENDED).map(f => ({ id: f.id, label: `${f.label.replace(/^Type (\w+) — /, 'Type $1: ')} · ${f.burnsTan.toLowerCase()}` }));
export const UNDERTONES = [{ id: 'unsure', label: 'Not sure yet' }, ...Object.values(UNDERTONE_PROFILES).map(u => ({ id: u.id, label: u.label }))];
export const FEELS = [
  { id: 'oily', label: 'Oily: shiny by midday' },
  { id: 'combination', label: 'Combination: oily T-zone, drier cheeks' },
  { id: 'normal', label: 'Normal: comfortable most days' },
  { id: 'dry', label: 'Dry: tight, flaky or ashy' },
  { id: 'sensitive', label: 'Sensitive: stings or reddens easily' },
];
export const CONCERNS = [
  { id: 'dark_marks', label: 'Dark marks after spots or bites', zone: 'cheeks' },
  { id: 'melasma', label: 'Melasma (patchy brown areas)', zone: 'upper' },
  { id: 'breakouts', label: 'Breakouts', zone: 'jaw' },
  { id: 'blackheads', label: 'Blackheads and visible pores', zone: 'tzone' },
  { id: 'dryness', label: 'Dryness or ashiness', zone: 'cheeks' },
  { id: 'redness', label: 'Redness or rosacea', zone: 'cheeks' },
  { id: 'lines', label: 'Fine lines', zone: 'eyes' },
  { id: 'dullness', label: 'Dullness or rough texture', zone: 'whole' },
];
export const CLIMATES = [
  { id: 'humid', label: 'Hot and humid' },
  { id: 'dry', label: 'Hot and dry' },
  { id: 'temperate', label: 'Mild' },
  { id: 'cold', label: 'Cold winters, heated rooms' },
];
export const STEPS = [
  { id: '3', label: 'Simple: 3 steps morning and night' },
  { id: '5', label: 'Standard: adds a morning serum and a double cleanse' },
  { id: '7', label: 'Full: adds hydration layers and a weekly exfoliant' },
];
export const PREGNANCY = [
  { id: 'no', label: 'No' },
  { id: 'yes', label: 'Pregnant, trying or breastfeeding' },
];
export const HERITAGES = [{ id: 'none', label: 'No heritage swaps' }, ...LIBRARY_COMMUNITIES.map(c => ({ id: c.id, label: c.label }))];
const DEFAULTS = { type: 'IV', undertone: 'unsure', feel: 'combination', concern: 'dark_marks', climate: 'temperate', steps: '5', pregnant: 'no', heritage: 'none', tone: 'mst7' };

// Heritage swaps: a traditional ingredient from the guide that can stand in for one step.
const HERITAGE_SWAP = {
  west_african: { id: 'shea_butter', step: 'pm-moisturiser', heavy: true },
  black_american: { id: 'shea_butter', step: 'pm-moisturiser', heavy: true },
  east_african: { id: 'moringa_oil', step: 'pm-moisturiser' },
  south_african: { id: 'rooibos', step: 'am-hydrate' },
  caribbean: { id: 'aloe_vera', step: 'am-hydrate' },
  south_asian: { id: 'turmeric', step: 'weekly' },
  arab: { id: 'argan_oil', step: 'pm-moisturiser' },
  latina: { id: 'rosehip_oil', step: 'pm-moisturiser' },
  east_asian: { id: 'rice_water', step: 'am-hydrate' },
};

// The active that answers each concern, with a pregnancy-safe or gentler fallback.
const ACTIVE = {
  dark_marks: { am: 'vitamin_c', pm: 'alpha_arbutin', pmGentle: 'azelaic_acid' },
  melasma: { am: 'tranexamic_acid', pm: 'azelaic_acid', pmGentle: 'azelaic_acid' },
  breakouts: { am: 'niacinamide', pm: 'benzoyl_peroxide', pmGentle: 'azelaic_acid' },
  blackheads: { am: 'niacinamide', pm: 'salicylic_acid', pmGentle: 'azelaic_acid' },
  dryness: { am: 'hyaluronic_acid', pm: 'ceramides', pmGentle: 'ceramides' },
  redness: { am: 'niacinamide', pm: 'azelaic_acid', pmGentle: 'azelaic_acid' },
  lines: { am: 'vitamin_c', pm: 'retinol', pmGentle: 'bakuchiol' },
  dullness: { am: 'vitamin_c', pm: 'lactic_acid', pmGentle: 'lactic_acid' },
};
// Actives that are paced (not nightly) and the colour family of each category for the picture.
const PACED = new Set(['retinol', 'bakuchiol', 'benzoyl_peroxide', 'salicylic_acid', 'lactic_acid', 'glycolic_acid']);
export const CATEGORY_COLOURS = {
  cleanser: '#90e0ef', brightening: '#ffb703', 'anti-aging': '#9d4edd', hydration: '#4cc9f0', barrier: '#80ed99',
  moisturiser: '#f4d58d', soothing: '#b7e4c7', exfoliant: '#f28482', acne: '#e5383b', sunscreen: '#fefae0',
  antioxidant: '#e07a5f', healing: '#c9ada7', 'hair-skin': '#d4a373',
};

function ing(id) {
  const i = getIngredient(id);
  return i ? { id: i.id, name: i.name.replace(/\s*\(.*?\)/g, ''), full: i.name, category: i.category, benefit: i.benefit, strength: i.concentrationRange ?? '', note: i.ethnicSkinNote ?? '', frequency: i.frequency ?? '', conflicts: i.conflictsWith ?? [], spf: Boolean(i.spfRequired) } : null;
}
const step = (slot, label, ingredient, why, extra = {}) => ({ slot, label, ingredient, why, ...extra });

export function routineOptions() {
  return { types: TYPES, undertones: UNDERTONES, feels: FEELS, concerns: CONCERNS, climates: CLIMATES, steps: STEPS, pregnancy: PREGNANCY, heritages: HERITAGES, tones: MONK_TONES.map(t => ({ id: t.id, label: t.label, hex: t.hex })) };
}

export function searchRoutineIngredients(q) {
  const query = String(q ?? '').trim().slice(0, 40);
  if (query.length < 3) return { query, results: [] };
  return { query, results: searchIngredients(query).map(i => ({ id: i.id, name: i.name, category: i.category, benefit: i.benefit })) };
}

/** How many nights a week a paced active starts at, by type and feel. */
export function startNights(type, feel) {
  const deep = ['IV', 'V', 'VI'].includes(type);
  let n = deep ? 2 : 3;
  if (feel === 'sensitive') n -= 1;
  if (feel === 'oily') n += 1;
  return Math.max(1, Math.min(4, n));
}

export function buildRoutinePlan(input = {}) {
  input = input ?? {};
  const c = {
    type: pick(input.type, TYPES, DEFAULTS.type),
    undertone: pick(input.undertone, UNDERTONES, DEFAULTS.undertone),
    feel: pick(input.feel, FEELS, DEFAULTS.feel),
    concern: pick(input.concern, CONCERNS, DEFAULTS.concern),
    climate: pick(input.climate, CLIMATES, DEFAULTS.climate),
    steps: pick(input.steps, STEPS, DEFAULTS.steps),
    pregnant: pick(input.pregnant, PREGNANCY, DEFAULTS.pregnant),
    heritage: pick(canonicalCommunity(input.heritage) ?? input.heritage, HERITAGES, DEFAULTS.heritage),
    tone: pick(input.tone, MONK_TONES, DEFAULTS.tone),
  };
  const fitz = getFitzpatrickInfo(c.type);
  const deep = ['IV', 'V', 'VI'].includes(c.type);
  const preg = c.pregnant === 'yes';
  const n = Number(c.steps);
  const concern = CONCERNS.find(x => x.id === c.concern);
  const notes = [];

  // Morning
  const cleanserAM = { oily: 'Gel or foaming cleanser', combination: 'Gentle gel cleanser', normal: 'Gentle cleanser', dry: 'Cream cleanser, or just rinse with water', sensitive: 'Fragrance-free cream cleanser, or just rinse with water' }[c.feel];
  let amActive = ACTIVE[c.concern].am;
  if (preg && amActive === 'tranexamic_acid' && n >= 5) { amActive = 'azelaic_acid'; notes.push('Topical tranexamic acid has little safety data in pregnancy, so the morning step uses azelaic acid instead; ask your doctor or pharmacist before adding it back.'); }
  if (c.feel === 'sensitive' && amActive === 'vitamin_c') notes.push('Sensitive skin: choose a gentle vitamin C derivative (ascorbyl glucoside or 3-O-ethyl ascorbic acid) rather than pure L-ascorbic acid.');
  const lightMoist = c.feel === 'oily' || c.climate === 'humid';
  const richMoist = c.feel === 'dry' || c.climate === 'cold' || c.climate === 'dry';
  let moistAM = lightMoist && !richMoist ? 'squalane' : richMoist ? 'ceramides' : 'hyaluronic_acid';
  if (n >= 5 && moistAM === amActive) moistAM = 'ceramides';
  const sunscreen = c.feel === 'sensitive' ? 'zinc_oxide' : (deep ? 'spf_for_dark_skin' : 'zinc_oxide');
  const sunWhy = deep ? 'Tinted mineral or a chemical filter avoids a white cast on deeper skin. ' + fitz.sunProtection : fitz.sunProtection;
  const am = [step('am-cleanse', cleanserAM, null, c.feel === 'dry' || c.feel === 'sensitive' ? 'A morning wash can be skipped when skin is dry or reactive.' : 'Lifts overnight oil without stripping.')];
  if (n >= 7) am.push(step('am-hydrate', 'Hydrating toner or essence', ing('hyaluronic_acid'), 'A watery layer under the serum.'));
  if (n >= 5) am.push(step('am-treat', `Treatment: ${ing(amActive).name}`, ing(amActive), `For ${concern.label.toLowerCase()}.`));
  am.push(step('am-moisturise', { squalane: 'Light gel or oil-free moisturiser', ceramides: 'Richer cream with ceramides', hyaluronic_acid: 'Light lotion' }[moistAM], ing(moistAM), richMoist ? 'Dry or cold air pulls water out of skin; a richer cream holds it in.' : lightMoist ? 'Humidity or oiliness means a light layer is enough.' : 'Balanced hydration.'));
  am.push(step('am-sun', 'Sunscreen, SPF 30 or higher', ing(sunscreen), sunWhy));

  // Night
  let pmId = ACTIVE[c.concern].pm;
  if (preg && pmId === 'retinol') { pmId = 'bakuchiol'; notes.push('Retinoids are avoided in pregnancy and breastfeeding, so the night step uses bakuchiol; check any product with your doctor or pharmacist.'); }
  else if (preg && pmId === 'alpha_arbutin') { pmId = 'azelaic_acid'; notes.push('Arbutin releases small amounts of hydroquinone, which is usually avoided in pregnancy, so azelaic acid takes the night step; check with your doctor or pharmacist.'); }
  else if (preg && pmId === 'salicylic_acid') { pmId = 'azelaic_acid'; notes.push('In pregnancy, azelaic acid replaces salicylic acid at night; low-strength salicylic washes are often considered fine, but ask your doctor or pharmacist.'); }
  else if (c.feel === 'sensitive' && ACTIVE[c.concern].pmGentle !== pmId) { pmId = ACTIVE[c.concern].pmGentle; notes.push(`Sensitive skin: ${getIngredient(pmId).name} replaces ${getIngredient(ACTIVE[c.concern].pm).name} at night because it is gentler.`); }
  if (pmId === 'benzoyl_peroxide') notes.push('Benzoyl peroxide: use 2.5% and protect towels and pillowcases, which it bleaches.');
  if (preg) notes.push('Tell your doctor, midwife or pharmacist about every product you use while pregnant or breastfeeding.');
  const pmActive = ing(pmId);
  let moistPM = c.feel === 'oily' ? 'squalane' : c.feel === 'dry' || c.climate === 'cold' ? 'shea_butter' : 'ceramides';
  if (moistPM === pmId) moistPM = c.feel === 'oily' ? 'squalane' : 'shea_butter';
  const pm = [step('pm-cleanse', n >= 5 ? 'Double cleanse: oil or balm, then your cleanser' : 'Cleanse', null, 'Removes sunscreen and makeup so the night step can work.')];
  if (n >= 7) pm.push(step('pm-hydrate', 'Hydrating serum', ing('hyaluronic_acid'), 'Apply to damp skin.'));
  if (n >= 3) pm.push(step('pm-treat', `Treatment: ${pmActive.name}`, pmActive, PACED.has(pmId) ? 'On the nights marked in your week; other nights skip it.' : 'Every night if comfortable.'));
  pm.push(step('pm-moisturiser', { squalane: 'Light moisturiser', shea_butter: 'Rich cream or shea butter', ceramides: 'Ceramide moisturiser' }[moistPM], ing(moistPM), moistPM === 'shea_butter' ? 'Seals in water overnight; good for ashy patches.' : 'Supports the skin barrier overnight.'));

  // Week: paced active nights, with a weekly exfoliant on a different night in the full routine.
  const nights = PACED.has(pmId) ? startNights(c.type, c.feel) : 7;
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const spread = { 1: [2], 2: [0, 3], 3: [0, 2, 4], 4: [0, 2, 4, 6], 7: [0, 1, 2, 3, 4, 5, 6] }[nights];
  const week = DAYS.map((d, i) => ({ day: d, active: spread.includes(i) ? pmActive.name : null, extra: null }));
  if (n >= 7 && !['lactic_acid', 'salicylic_acid', 'benzoyl_peroxide'].includes(pmId) && c.feel !== 'sensitive') {
    const free = week.findIndex((w, i) => !w.active && i >= 4) >= 0 ? week.findIndex((w, i) => !w.active && i >= 4) : week.findIndex(w => !w.active);
    if (free >= 0) week[free].extra = 'Lactic acid exfoliant';
    else notes.push('Your treatment runs every night, so the weekly exfoliant is left out to avoid over-doing it.');
  }
  const pace = PACED.has(pmId)
    ? `Start ${pmActive.name} ${nights} night${nights === 1 ? '' : 's'} a week${deep ? ': on type ' + c.type + ' skin, irritation can leave dark marks, so build up slowly' : ''}. Add a night every two weeks if your skin stays calm.`
    : `${pmActive.name} can be used every night if comfortable.`;

  // Clashes: ingredients in the same routine that the guide says to keep apart.
  const clashes = [];
  for (const [when, list] of [['morning', am], ['night', pm]]) {
    const ids = list.map(s => s.ingredient?.id).filter(Boolean);
    for (const a of ids) for (const b of ids) if (a < b) {
      const A = getIngredient(a); const B = getIngredient(b);
      const hit = (A.conflictsWith ?? []).some(x => x.startsWith(b)) || (B.conflictsWith ?? []).some(x => x.startsWith(a));
      if (hit) clashes.push(`${A.name} and ${B.name} should not go on together in the ${when}.`);
    }
  }
  if (am.some(s => s.ingredient?.id === 'vitamin_c') && pmId === 'retinol') notes.push('Vitamin C in the morning and retinol at night keeps the two apart.');
  if (pmActive.spf) notes.push(`${pmActive.name} makes sunscreen essential the next day.`);

  // Undertone
  const ut = c.undertone === 'unsure' ? null : getUndertoneProfile(c.undertone);
  const undertone = ut
    ? { id: ut.id, label: ut.label, hex: ut.hexSample, description: ut.description, check: ut.detectMethod, makeup: ut.makeupTips, avoid: ut.avoidMakeup, skincare: ut.skincareTips }
    : { id: 'unsure', label: 'Not sure yet', hex: null, description: 'Check in daylight, then pick the one that fits.', check: null, tests: Object.values(UNDERTONE_PROFILES).slice(0, 7).map(u => `${u.label}: ${u.detectMethod}`), makeup: [], avoid: [], skincare: [] };

  // Heritage swap
  let heritage = null;
  if (c.heritage !== 'none') {
    const r = getSkincareRoutine(c.heritage.replace(/_/g, '-'));
    const sw = HERITAGE_SWAP[c.heritage]; const si = ing(sw.id);
    let where = sw.step;
    let how;
    if (sw.step === 'pm-moisturiser' && sw.heavy && c.feel === 'oily') { where = 'body'; how = `${si.name} is heavy for an oily face, so use it on the body, elbows and knees instead.`; }
    else if (sw.step === 'pm-moisturiser') how = `Swap your night moisturiser for ${si.name}, or press a few drops over it.`;
    else if (sw.step === 'am-hydrate') how = `Use ${si.name} as your morning hydrating layer.`;
    else how = `Add a ${si.name.toLowerCase()} mask once a week, on a night without your treatment.`;
    if (where === 'pm-moisturiser') { const i = pm.findIndex(s => s.slot === 'pm-moisturiser'); pm[i] = { ...pm[i], label: `${pm[i].label}, or ${si.name}`, swap: si }; }
    if (where === 'am-hydrate') { const i = am.findIndex(s => s.slot === 'am-hydrate'); if (i >= 0) am[i] = { ...am[i], label: si.name, ingredient: si, swap: si, why: si.note }; else am.splice(1, 0, step('am-hydrate', si.name, si, si.note, { swap: si })); }
    if (where === 'weekly') { const free = week.findIndex(w => !w.active && !w.extra); if (free >= 0) week[free].extra = `${si.name} mask`; }
    heritage = { id: c.heritage, label: r?.label ?? c.heritage, swap: si, where, how, weekly: r?.weeklyTreatments ?? [], remedies: r?.traditionalRemedies ?? [], note: r?.culturalNote ?? '' };
  }

  const tone = MONK_TONES.find(t => t.id === c.tone);
  const bottle = s => ({ label: s.swap ? s.swap.name : s.ingredient ? s.ingredient.name : s.label, category: s.slot.endsWith('cleanse') ? 'cleanser' : s.ingredient?.category ?? 'cleanser', swap: Boolean(s.swap) });
  return {
    choices: c,
    type: { id: fitz.id, label: fitz.label, burns: fitz.burnsTan, sun: fitz.sunProtection, notes: fitz.notes },
    concern,
    morning: am,
    night: pm,
    week, pace,
    clashes,
    notes,
    undertone,
    heritage,
    tone: { id: tone.id, label: tone.label, hex: tone.hex },
    picture: {
      skin: tone.hex, undertone: undertone.hex, zone: concern.zone, feel: c.feel, climate: c.climate,
      am: am.map(bottle), pm: pm.map(bottle), colours: CATEGORY_COLOURS, burn: ['I', 'II', 'III', 'IV', 'V', 'VI'].indexOf(c.type),
    },
    message: `Type ${c.type}, ${FEELS.find(f => f.id === c.feel).label.split(':')[0].toLowerCase()} skin, focused on ${concern.label.toLowerCase()}: ${am.length} morning and ${pm.length} night steps.`,
  };
}

// For the library: how many ingredients and heritage routines the studio draws on.
export const ROUTINE_SOURCES = { ingredients: Object.keys(SKINCARE_INGREDIENTS).length, heritages: Object.keys(SKINCARE_ROUTINES).length };
