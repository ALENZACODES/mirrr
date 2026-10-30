/**
 * Ingredient Checker: pick up to four skincare ingredients and see which pairs are fine, which to
 * split between morning and night or across nights, and which not to mix; a week of morning and
 * night routines in the right layering order; what the pregnancy guide says at your stage; extra
 * care for your Fitzpatrick type; what helps your concern; and the traditional ingredients your
 * community's guides name.
 *
 * Every rule quotes the interactions guide, the ingredient encyclopedia, the skincare ingredient
 * guides or the pregnancy guide. Pairs the guides say nothing about are shown as "no rule in the
 * guides", never as "safe".
 */
import { INGREDIENTS, INGREDIENT_CATEGORIES, buildIngredientStack, getIngredientsForCommunity } from '../ingredient_encyclopedia.js';
import { VITAMIN_C_GUIDE, RETINOID_GUIDE, NIACINAMIDE_GUIDE, AHA_BHA_GUIDE, HYALURONIC_ACID_GUIDE, CERAMIDE_GUIDE, TRANEXAMIC_ACID_GUIDE, KOJIC_ACID_ARBUTIN, HYDROQUINONE_GUIDE, SUNSCREEN_ACTIVE_INGREDIENTS, getEthnicIngredientPriorities } from '../skincare_ingredients_encyclopedia.js';
import { DO_NOT_COMBINE as DNC, GREAT_COMBINATIONS as GC, PH_GUIDE, AM_PM_GUIDE, INGREDIENT_DEEP_DIVES, ETHNIC_SKIN_INTERACTION_NOTES as SKIN_NOTES } from '../ingredient_interactions.js';
import { lookupTerm } from '../beauty_science_glossary.js';
import { INGREDIENTS as BUMP, STAGES } from '../pregnancy/studio.js';
import { MONK_TONES, FITZPATRICK } from '../skin/clinic.js';
import { LIBRARY_COMMUNITIES, resolveCommunity } from '../library/communities.js';

/** Two actives the interactions guide covers that the encyclopedia does not list. */
const EXTRA = {
  salicylic_acid: { id: 'salicylic_acid', name: 'Salicylic Acid (BHA)', category: 'acid', howToUse: AHA_BHA_GUIDE.BHAs.salicylicAcid.percentages, avoidWith: [], pairsWith: [], communities: ['all'], concerns: ['acne', 'clogged pores'], benefits: [] },
  benzoyl_peroxide: { id: 'benzoyl_peroxide', name: 'Benzoyl Peroxide', category: 'acid', howToUse: DNC.retinol_and_benzoyl_peroxide.recommendation[0], avoidWith: [], pairsWith: [], communities: ['all'], concerns: ['acne'], benefits: [] },
};
const ALL = { ...INGREDIENTS, ...EXTRA };
/** Hair, body or ritual ingredients: not a step in a face routine. */
const OFF_FACE = ['amla_oil', 'coconut_oil', 'rice_water', 'henna', 'kohl', 'turmeric'];
const CLASS = { vitamin_c: 'vitc', glycolic_acid: 'aha', salicylic_acid: 'bha', retinol: 'retinoid', benzoyl_peroxide: 'bp', niacinamide: 'nia', kojic_acid: 'kojic', hyaluronic_acid: 'ha', ceramides: 'cer', spf_mineral: 'spf' };
const cls = id => CLASS[id] ?? (['oil', 'butter'].includes(ALL[id].category) && !OFF_FACE.includes(id) ? 'oil' : id);
const EXFOLIANT = ['aha', 'bha'];
/** When each ingredient goes, from its own how-to-use line. */
const WHEN = { vitc: 'am', spf: 'am', retinoid: 'rot', aha: 'rot', bha: 'rot', bp: 'bp', kojic: 'kojic', oil: 'pm' };
const when = id => (OFF_FACE.includes(id) ? 'off' : WHEN[cls(id)] ?? 'both');
/** Pregnancy guide entries for the ingredients it covers. */
const BUMP_ID = { retinol: 'retinoid', salicylic_acid: 'salicylicWash', benzoyl_peroxide: 'benzoyl', azelaic_acid: 'azelaic', vitamin_c: 'vitaminC', niacinamide: 'niacinamide', glycolic_acid: 'glycolic', spf_mineral: 'mineralSpf', henna: 'henna', bakuchiol: 'bakuchiol' };

export const INGREDIENT_IDS = Object.keys(ALL);
export const CONCERNS = [
  { id: 'darkspots', label: 'Dark spots and marks', terms: ['dark spots', 'PIH', 'hyperpigmentation', 'melasma'] },
  { id: 'breakouts', label: 'Breakouts', terms: ['acne'] },
  { id: 'dryness', label: 'Dry or tight skin', terms: ['dry skin', 'dehydration'] },
  { id: 'lines', label: 'Fine lines', terms: ['fine lines', 'anti-ageing', 'ageing'] },
  { id: 'sensitive', label: 'Sensitive or red skin', terms: ['sensitive skin', 'redness'] },
];
export const STAGE_IDS = ['no', ...STAGES.map(s => s.id)];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DEFAULTS = { a: 'retinol', b: 'glycolic_acid', c: 'vitamin_c', d: 'niacinamide', fitzpatrick: 'V', stage: 'no', concern: 'darkspots', community: 'west_african' };

const pick = (v, list, d) => (list.includes(v) ? v : d);
const dash = id => id.replace(/_/g, '-');
const deep = f => ['IV', 'V', 'VI'].includes(f);
/** Join guide fragments into sentences, adding the full stop a fragment lacks. */
const sent = (...parts) => parts.flat().filter(Boolean).map(s => String(s).trim().replace(/[;,:]$/, '').replace(/([^.!?])$/, '$1.')).join(' ');
const lines = x => sent(x);

// ---- Pairs ------------------------------------------------------------------------------------
/** Rules for pairs of ingredient classes. Each returns { level, title, text, source }. */
const RULES = {
  'nia|vitc': () => ({ level: 'ok', title: 'Fine together', text: sent(DNC.vitamin_c_and_niacinamide.concern, DNC.vitamin_c_and_niacinamide.verdict, DNC.vitamin_c_and_niacinamide.reality, DNC.vitamin_c_and_niacinamide.recommendation), source: 'Interactions guide: vitamin C and niacinamide' }),
  'aha|vitc': f => ({ level: 'split', title: 'Split them: vitamin C in the morning, the acid at night', text: sent(DNC.vitamin_c_and_AHA_BHA.concern, DNC.vitamin_c_and_AHA_BHA.recommendation, deep(f) ? DNC.vitamin_c_and_AHA_BHA.for_dark_skin : null), source: 'Interactions guide: vitamin C and AHA/BHA' }),
  'retinoid|vitc': f => ({ level: 'split', title: 'Split them: vitamin C in the morning, retinol at night', text: sent(DNC.retinol_and_vitamin_c.actual_issue, lines(DNC.retinol_and_vitamin_c.recommendation.slice(0, 2)), ['III', 'IV', 'V', 'VI'].includes(f) ? DNC.retinol_and_vitamin_c.dark_skin_note : null), source: 'Interactions guide: retinol and vitamin C' }),
  'aha|retinoid': f => ({ level: 'split', title: 'Different nights', text: sent(DNC.retinol_and_AHA_BHA.concern, DNC.retinol_and_AHA_BHA.recommendation[0], deep(f) ? DNC.retinol_and_AHA_BHA.for_dark_skin : null), source: 'Interactions guide: retinol and AHA/BHA' }),
  'bp|retinoid': () => ({ level: 'avoid', title: 'Do not mix', text: sent(DNC.retinol_and_benzoyl_peroxide.reason, lines(DNC.retinol_and_benzoyl_peroxide.recommendation.slice(0, 2))), source: 'Interactions guide: retinol and benzoyl peroxide' }),
  'bp|vitc': () => ({ level: 'split', title: 'Keep apart', text: 'The ingredient encyclopedia lists benzoyl peroxide under "avoid with" for vitamin C, so this routine puts them at different times of day.', source: 'Ingredient encyclopedia: vitamin C' }),
  'aha|bha': () => ({ level: 'avoid', title: 'Not in the same application', text: sent(DNC.multiple_exfoliants_together.rule, DNC.multiple_exfoliants_together.layering_note, DNC.two_low_pH_acids.risk), source: 'Interactions guide: multiple exfoliants' }),
  'aha|kojic': () => ({ level: 'caution', title: 'Go gently', text: 'The ingredient encyclopedia lists high-concentration AHAs under "avoid with" for kojic acid (irritation risk), so this routine keeps kojic acid off the acid nights.', source: 'Ingredient encyclopedia: kojic acid' }),
  'nia|retinoid': () => ({ level: 'great', title: 'Good together', text: sent(GC.niacinamide_and_retinoid.why, GC.niacinamide_and_retinoid.recommendation.replace(' — see below', '')), source: 'Interactions guide: niacinamide and retinoid' }),
  'cer|nia': () => ({ level: 'great', title: 'Good together', text: GC.ceramides_and_niacinamide.why, source: 'Interactions guide: ceramides and niacinamide' }),
  'spf|vitc': () => ({ level: 'great', title: 'Good together', text: sent(GC.sunscreen_plus_antioxidants.why, GC.sunscreen_plus_antioxidants.protocol), source: 'Interactions guide: sunscreen plus antioxidants' }),
};
RULES['bha|vitc'] = RULES['aha|vitc']; RULES['bha|retinoid'] = RULES['aha|retinoid'];

function pairVerdict(x, y, fitz) {
  const [p, q] = [cls(x), cls(y)].sort(); const key = `${p}|${q}`;
  if (OFF_FACE.includes(x) || OFF_FACE.includes(y)) {
    const o = OFF_FACE.includes(x) ? ALL[x] : ALL[y];
    return { level: 'apart', title: 'Not a face-routine step', text: `${o.name}: ${o.howToUse}`, source: 'Ingredient encyclopedia' };
  }
  if (RULES[key]) return RULES[key](fitz);
  if (p === 'ha' || q === 'ha') return { level: 'ok', title: 'Fine together', text: `The encyclopedia pairs hyaluronic acid with everything. ${GC.hyaluronic_acid_then_moisturiser.timing}`, source: 'Ingredient encyclopedia and interactions guide' };
  if ((p === 'oil') !== (q === 'oil') && p !== 'spf' && q !== 'spf') return { level: 'order', title: 'Serum first, oil last', text: sent(DNC.oil_before_water.rule, DNC.oil_before_water.correct_order), source: 'Interactions guide: oil before water' };
  if ((ALL[x].pairsWith ?? []).includes(y) || (ALL[y].pairsWith ?? []).includes(x)) return { level: 'great', title: 'Good together', text: `The ingredient encyclopedia names ${ALL[x].name} and ${ALL[y].name} as a pairing.`, source: 'Ingredient encyclopedia: pairs with' };
  return { level: 'none', title: 'No rule in the guides', text: 'The guides name no conflict and no special pairing for these two. Patch-test anything new.', source: null };
}

// ---- Pregnancy ----------------------------------------------------------------------------------
function pregnancyCheck(ids, stage) {
  if (stage === 'no') return null;
  const st = STAGES.find(s => s.id === stage);
  return {
    stage: st.label,
    items: ids.map(id => {
      const b = BUMP.find(x => x.id === BUMP_ID[id]); const r = b?.rule[stage];
      return r ? { id, name: ALL[id].name, verdict: r.verdict, text: r.text } : { id, name: ALL[id].name, verdict: 'ask', text: 'The pregnancy guide does not cover this ingredient at this stage: ask your doctor or pharmacist.' };
    }),
  };
}

// ---- Week ---------------------------------------------------------------------------------------
/** Layering rank: lowest pH and thinnest first, oil and SPF last (pH guide and AM/PM guide). */
const RANK = { cleanse: 1, toner: 2, vitc: 3, bp: 3.5, rot: 4, kojic: 4.2, buffer: 3.9, serum: 5, moist: 6, oil: 7, occlusive: 8, spf: 9 };
const rankOf = id => {
  if (id === 'rooibos' || id === 'aloe_vera') return RANK.toner;
  if (id === 'shea_butter') return RANK.occlusive;
  if (id === 'ceramides') return RANK.moist;
  const c = cls(id);
  return c === 'vitc' ? RANK.vitc : c === 'spf' ? RANK.spf : c === 'oil' ? RANK.oil : c === 'bp' ? RANK.bp : c === 'kojic' ? RANK.kojic : ['retinoid', 'aha', 'bha'].includes(c) ? RANK.rot : RANK.serum;
};
const step = (id, label) => ({ id, label, rank: ALL[id] ? rankOf(id) : RANK[id] });

function week(ids, fitz, concern) {
  const has = c => ids.filter(id => cls(id) === c);
  const retinoid = has('retinoid'); const exf = ids.filter(id => EXFOLIANT.includes(cls(id)));
  const vitc = has('vitc').length > 0; const sandwich = retinoid.length > 0 && (deep(fitz) || concern === 'sensitive');
  const retNights = retinoid.length ? [0, 2, 4] : [];
  // Acids: alternate nights with a retinoid; otherwise twice a week, the glycolic acid starting rate.
  const exNights = retinoid.length ? [1, 3] : [1, 4];
  const exOn = d => (exNights.includes(d) && exf.length ? exf[exNights.indexOf(d) % exf.length] : null);
  const bpWhen = has('bp').length ? (vitc ? 'pm' : 'am') : null;
  const moist = ids.includes('ceramides') ? null : step('moist', 'Moisturiser');
  const spf = ids.includes('spf_mineral') ? null : step('spf', 'Broad-spectrum SPF 30-50+');
  return DAYS.map((day, d) => {
    const am = [step('cleanse', 'Cleanse')]; const pm = [step('cleanse', 'Remove makeup and cleanse')];
    for (const id of ids) {
      const w = when(id); const s = step(id, ALL[id].name);
      if (w === 'am' || w === 'both') am.push(s);
      if (w === 'pm' || w === 'both') pm.push(s);
      if (w === 'bp') (bpWhen === 'am' ? am : retNights.includes(d) ? [] : pm).push(s);
      if (w === 'kojic' && !exNights.includes(d)) pm.push(s);
      if (w === 'rot') {
        if (cls(id) === 'retinoid' && retNights.includes(d)) pm.push(s);
        if (exOn(d) === id) pm.push(s);
      }
    }
    if (moist) { am.push(moist); pm.push(moist); }
    if (sandwich && retNights.includes(d)) pm.push(step('buffer', 'Moisturiser (buffer, before retinol)'));
    if (spf) am.push(spf);
    // Niacinamide goes on before a retinoid (interactions guide: niacinamide and retinoid).
    if (retNights.includes(d)) for (const s of pm) if (s.id === 'niacinamide') s.rank = 3.85;
    const sort = a => a.sort((x, y) => x.rank - y.rank).map(({ id, label }) => ({ id, label }));
    return { day, am: sort(am), pm: sort(pm), night: retNights.includes(d) ? 'retinoid' : exOn(d) ? 'acid' : 'rest' };
  });
}

// ---- Details per ingredient ---------------------------------------------------------------------
const GUIDE = {
  vitamin_c: () => ({ what: VITAMIN_C_GUIDE.what, products: VITAMIN_C_GUIDE.recommendedProducts }),
  retinol: f => ({ what: RETINOID_GUIDE.what, products: RETINOID_GUIDE.forms.retinal.products ?? [], dark: ['III', 'IV', 'V', 'VI'].includes(f) ? sent(RETINOID_GUIDE.darkSkinConsiderations.PIHrisk, RETINOID_GUIDE.darkSkinConsiderations.strategy) : null }),
  niacinamide: f => ({ what: NIACINAMIDE_GUIDE.what, products: NIACINAMIDE_GUIDE.recommendedProducts, dark: deep(f) ? NIACINAMIDE_GUIDE.ethnicConsiderations : null }),
  glycolic_acid: f => ({ what: AHA_BHA_GUIDE.AHAs.glycolicAcid.what, products: [], dark: deep(f) ? AHA_BHA_GUIDE.darkSkinProtocol : null, caution: AHA_BHA_GUIDE.AHAs.glycolicAcid.caution }),
  salicylic_acid: f => ({ what: AHA_BHA_GUIDE.BHAs.salicylicAcid.what, products: [], dark: deep(f) ? AHA_BHA_GUIDE.darkSkinProtocol : null, caution: AHA_BHA_GUIDE.BHAs.salicylicAcid.caution }),
  hyaluronic_acid: () => ({ what: HYALURONIC_ACID_GUIDE.what, products: [], caution: HYALURONIC_ACID_GUIDE.application }),
  ceramides: f => ({ what: CERAMIDE_GUIDE.mechanism, products: Object.values(CERAMIDE_GUIDE.keyProducts), dark: deep(f) ? CERAMIDE_GUIDE.ethnicConsiderations.darkSkin : null }),
  tranexamic_acid: f => ({ what: TRANEXAMIC_ACID_GUIDE.what, products: TRANEXAMIC_ACID_GUIDE.recommendedProducts, dark: deep(f) ? TRANEXAMIC_ACID_GUIDE.ethnicConsiderations : null }),
  kojic_acid: f => ({ what: KOJIC_ACID_ARBUTIN.kojicAcid.what, products: [], dark: ['V', 'VI'].includes(f) ? KOJIC_ACID_ARBUTIN.kojicAcid.darkSkin : null }),
  alpha_arbutin: () => ({ what: KOJIC_ACID_ARBUTIN.arbutin.what, products: KOJIC_ACID_ARBUTIN.arbutin.recommendedProducts }),
  spf_mineral: f => ({ what: SUNSCREEN_ACTIVE_INGREDIENTS.mineral.zinc?.what ?? null, products: ALL.spf_mineral.brands ?? [], dark: deep(f) ? sent(SUNSCREEN_ACTIVE_INGREDIENTS.darkSkinNote, SUNSCREEN_ACTIVE_INGREDIENTS.tintedSPF) : null }),
  azelaic_acid: f => ({ what: INGREDIENT_DEEP_DIVES.azelaic_acid.why_it_is_special, products: INGREDIENT_DEEP_DIVES.azelaic_acid.texture_options, dark: deep(f) ? INGREDIENT_DEEP_DIVES.azelaic_acid.for_dark_skin : null }),
};
function detail(id, fitz) {
  const i = ALL[id]; const g = GUIDE[id]?.(fitz) ?? {};
  const term = lookupTerm(i.name.split(' (')[0]);
  return {
    id, name: i.name, category: INGREDIENT_CATEGORIES[i.category]?.label ?? 'Active', when: when(id),
    howToUse: i.howToUse, concentration: i.concentration ?? null, avoidWith: i.avoidWith ?? [],
    what: g.what ?? i.description ?? null, caution: g.caution ?? null, products: g.products ?? [],
    darkSkin: g.dark ?? null, note: i.ethnicSkinNote ?? null,
    sunCare: Boolean(i.photosensitive || i.requiresSPF),
    glossary: term ? { term: term.term, definition: term.definition } : null,
  };
}

// ---- Concern, skin type and community -----------------------------------------------------------
const CONCERN_COMBO = {
  darkspots: () => ({ title: 'Combinations for dark marks (PIH)', items: Object.values(SKIN_NOTES.fitzpatrick_iv_vi.PIH_treatment_combinations), warn: HYDROQUINONE_GUIDE.bleachingCreams.context }),
  breakouts: () => ({ title: 'Niacinamide and zinc', items: [GC.niacinamide_and_zinc.why, GC.niacinamide_and_zinc.products], warn: SKIN_NOTES.oily_skin.recommendation }),
  dryness: () => ({ title: 'Hyaluronic acid, then moisturiser', items: [GC.hyaluronic_acid_then_moisturiser.why, GC.hyaluronic_acid_then_moisturiser.timing], warn: GC.hyaluronic_acid_then_moisturiser.mistake }),
  lines: () => ({ title: 'Vitamin C under sunscreen', items: [GC.sunscreen_plus_antioxidants.why, GC.sunscreen_plus_antioxidants.protocol, GC.vitamin_c_and_vitamin_e_and_ferulic_acid.good_for], warn: null }),
  sensitive: () => ({ title: 'Ceramides and niacinamide', items: [GC.ceramides_and_niacinamide.why, GC.ceramides_and_niacinamide.good_for, sent(GC.retinoid_sandwiching.what, GC.retinoid_sandwiching.why)], warn: AHA_BHA_GUIDE.overExfoliation }),
};
function concernPlan(concern, fitz, stage) {
  const c = CONCERNS.find(x => x.id === concern);
  const seen = new Map();
  for (const t of c.terms) for (const i of buildIngredientStack(t, fitz)) if (!OFF_FACE.includes(i.id) && !seen.has(i.id)) seen.set(i.id, i);
  const avoidNow = id => stage !== 'no' && BUMP.find(x => x.id === BUMP_ID[id])?.rule[stage]?.verdict === 'avoid';
  return {
    id: concern, label: c.label,
    suggestions: [...seen.values()].filter(i => !avoidNow(i.id)).map(i => ({ id: i.id, name: i.name, careOnDeeperSkin: Boolean(i.cautionForDarkSkin) })),
    leftOut: [...seen.values()].filter(i => avoidNow(i.id)).map(i => i.name),
    ...CONCERN_COMBO[concern](),
  };
}
function skinPlan(fitz) {
  const d = deep(fitz);
  return {
    type: fitz, deeper: d,
    headline: d ? SKIN_NOTES.fitzpatrick_iv_vi.headline : 'Introduce one new active at a time and watch for irritation.',
    principle: d ? SKIN_NOTES.fitzpatrick_iv_vi.principle : null,
    order: d ? SKIN_NOTES.fitzpatrick_iv_vi.active_hierarchy : null,
    retinoidStart: INGREDIENT_DEEP_DIVES.retinoid_introduction.starter_protocol,
    retinoidStartDeeper: d ? INGREDIENT_DEEP_DIVES.retinoid_introduction.dark_skin_retinoid_protocol : null,
    slowDown: INGREDIENT_DEEP_DIVES.retinoid_introduction.when_to_slow_down,
  };
}
function communityNotes(cid) {
  const own = getIngredientsForCommunity(dash(cid)).filter(i => !i.communities.includes('all'));
  const pr = getEthnicIngredientPriorities(dash(cid));
  const notes = pr ? Object.values(pr).flatMap(v => (typeof v === 'string' ? [v] : Object.values(v))) : [];
  return { traditional: own.map(i => ({ id: i.id, name: i.name, origin: i.origin, use: i.traditionalUse, context: i.culturalContext ?? null, faceRoutine: !OFF_FACE.includes(i.id) })), notes };
}

// ---- Plan ---------------------------------------------------------------------------------------
export function buildMixPlan(input = {}) {
  const ids0 = [pick(input.a, INGREDIENT_IDS, DEFAULTS.a), pick(input.b, INGREDIENT_IDS, DEFAULTS.b)];
  const c = input.c === 'none' ? 'none' : pick(input.c, INGREDIENT_IDS, DEFAULTS.c);
  const d = input.d === 'none' ? 'none' : pick(input.d, INGREDIENT_IDS, DEFAULTS.d);
  const fitz = pick(input.fitzpatrick, FITZPATRICK, DEFAULTS.fitzpatrick);
  const stage = pick(input.stage, STAGE_IDS, DEFAULTS.stage);
  const concern = pick(input.concern, CONCERNS.map(x => x.id), DEFAULTS.concern);
  const cid = resolveCommunity(input.community ?? DEFAULTS.community).id ?? DEFAULTS.community;
  const tone = MONK_TONES.find(t => t.id === input.tone) ?? MONK_TONES[6];
  const ids = [...new Set([...ids0, c, d].filter(x => x !== 'none'))];
  const preg = pregnancyCheck(ids, stage);
  const avoided = new Set((preg?.items ?? []).filter(x => x.verdict === 'avoid').map(x => x.id));
  const inRoutine = ids.filter(id => !avoided.has(id) && !OFF_FACE.includes(id));
  const pairs = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) pairs.push({ a: ids[i], b: ids[j], names: [ALL[ids[i]].name, ALL[ids[j]].name], ...pairVerdict(ids[i], ids[j], fitz) });
  const worst = ['avoid', 'split', 'caution', 'order', 'apart', 'none', 'ok', 'great'].find(l => pairs.some(p => p.level === l)) ?? 'none';
  return {
    choices: { a: ids0[0], b: ids0[1], c, d, fitzpatrick: fitz, stage, concern, community: cid, tone: tone.id },
    community: { id: cid, label: LIBRARY_COMMUNITIES.find(x => x.id === cid)?.label ?? cid },
    tone, ingredients: ids.map(id => detail(id, fitz)), pairs, worst,
    pregnancy: preg, leftOut: [...avoided].map(id => ALL[id].name), offFace: ids.filter(id => OFF_FACE.includes(id)).map(id => ALL[id].name),
    week: week(inRoutine, fitz, concern),
    sunCare: inRoutine.some(id => ALL[id].photosensitive || ALL[id].requiresSPF || EXFOLIANT.includes(cls(id))),
    layering: { am: AM_PM_GUIDE.AM_routine_essentials.note, pm: PH_GUIDE.layering_order.rule, wait: PH_GUIDE.layering_order.timing_between_steps.for_convenience },
    skin: skinPlan(fitz), concern: concernPlan(concern, fitz, stage), communityNotes: communityNotes(cid),
  };
}

export function lookupGlossary(q) {
  const t = String(q ?? '').trim().slice(0, 60);
  if (t.length < 2) return { query: t, entry: null };
  return { query: t, entry: lookupTerm(t) };
}

export function mixOptions() {
  return {
    ingredients: INGREDIENT_IDS.map(id => ({ id, label: ALL[id].name, group: OFF_FACE.includes(id) ? 'Hair, body and ritual' : INGREDIENT_CATEGORIES[ALL[id].category]?.label ?? 'Active' })),
    fitzpatrick: FITZPATRICK, stages: [{ id: 'no', label: 'Not pregnant or breastfeeding' }, ...STAGES.map(({ id, label }) => ({ id, label }))],
    concerns: CONCERNS.map(({ id, label }) => ({ id, label })), communities: LIBRARY_COMMUNITIES.map(x => ({ id: x.id, label: x.label })), tones: MONK_TONES,
  };
}
