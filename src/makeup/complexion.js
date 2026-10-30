/**
 * Complexion Lab: correct, base, set and sculpt, planned for your skin.
 *
 * Pick what you want to correct, your Fitzpatrick type, undertone, skin type, coverage, face shape,
 * the occasion and your community. Every line of the plan comes from the wired makeup guides:
 * the corrector colour for your depth, the foundation formula and finish that suit your skin type,
 * primer, powder and spray, flashback and oxidation warnings, contour, highlight and blush placement
 * for the face shape you choose, tools, and how to take it all off. Face shape and undertone are
 * always the user's own choice; nothing is inferred from a community.
 */
import { COLOUR_CORRECTION_BY_FITZPATRICK, CONTOUR_COLOUR_THEORY, COLOUR_FOR_SKIN_TONE } from '../colour_theory_makeup.js';
import { CORRECTING_BY_CONCERN, ETHNIC_COLOUR_CORRECTING } from '../colour_correcting_guide.js';
import { FOUNDATION_FORMULAS, COVERAGE_GUIDE, FOUNDATION_FINISHES, UNDERTONE_GUIDE, FOUNDATION_APPLICATION } from '../foundation_guide_extended.js';
import { PRIMER_GUIDE, SETTING_POWDER_GUIDE, SETTING_SPRAY_GUIDE, FLASHBACK_GUIDE, OXIDATION_GUIDE, getEthnicSettingTradition } from '../setting_products_guide.js';
import { SKIN_PREP, LONGWEAR_TECHNIQUES, FINISH_BY_COMMUNITY } from '../makeup_finishes_guide.js';
import { CONTOUR_BY_FACE_SHAPE, ETHNIC_CONTOUR_GUIDE } from '../contouring_guide_ethnic.js';
import { ETHNIC_FACE_SHAPES_EXTENDED } from '../contouring_guide_v2.js';
import { BLUSH_BY_FACE_SHAPE, BRONZER_GUIDE, getEthnicCheekTradition } from '../cheek_makeup_guide.js';
import { DOUBLE_CLEANSE, WATERPROOF_REMOVAL, COMMUNITY_CLEANSING_TRADITIONS } from '../makeup_removal_guide.js';
import { FACE_BRUSHES, SPONGES_AND_APPLICATORS } from '../makeup_tools_guide.js';
import { MONK_TONES, FITZPATRICK } from '../skin/clinic.js';
import { LIBRARY_COMMUNITIES, resolveCommunity } from '../library/communities.js';

export const CORRECT = [
  { id: 'dark_circles', label: 'Dark circles' },
  { id: 'dark_marks', label: 'Dark marks (PIH) and spots' },
  { id: 'redness', label: 'Redness and breakouts' },
  { id: 'sallowness', label: 'Dull or sallow tone' },
  { id: 'none', label: 'Nothing to correct' },
];
export const UNDERTONES = [
  { id: 'warm', label: 'Warm (golden, peachy)' }, { id: 'cool', label: 'Cool (pink, red, bluish)' },
  { id: 'neutral', label: 'Neutral' }, { id: 'olive', label: 'Olive' },
];
export const SKIN_TYPES = [
  { id: 'oily', label: 'Oily' }, { id: 'combination', label: 'Combination' }, { id: 'dry', label: 'Dry' }, { id: 'mature', label: 'Mature' },
];
export const COVERAGE = Object.keys(COVERAGE_GUIDE).map(id => ({ id, label: COVERAGE_GUIDE[id].level }));
export const FACE_SHAPES = Object.keys(CONTOUR_BY_FACE_SHAPE).map(id => ({ id, label: BLUSH_BY_FACE_SHAPE[id]?.shape ?? id }));
export const OCCASIONS = [
  { id: 'everyday', label: 'Everyday' },
  { id: 'photos', label: 'Photos with flash' },
  { id: 'long_event', label: 'Long event in the heat' },
];

// ---- Depth bands: the guides key colour advice by Fitzpatrick depth -----------------------
const BAND = { I: 'fair', II: 'fair', III: 'medium', IV: 'tan', V: 'brown', VI: 'deep' };
const CORRECTION_KEY = { I: 'fitzpatrick_i_ii', II: 'fitzpatrick_i_ii', III: 'fitzpatrick_iii', IV: 'fitzpatrick_iv', V: 'fitzpatrick_v', VI: 'fitzpatrick_vi' };
const CONTOUR_KEY = { fair: 'fair', medium: 'medium', tan: 'tan_olive', brown: 'brown', deep: 'deep' };
const BRONZER_KEY = { fair: 'fair', medium: 'medium', tan: 'tan_olive', brown: 'deep', deep: 'deep' };
const deep = fitz => ['IV', 'V', 'VI'].includes(fitz);

/**
 * Colours named in a guide line, in the order they appear, as swatches for the diagram.
 * The hex values are illustrations of the words the guide uses, not product shades.
 */
const SWATCH = [
  ['red-orange', '#c4471c'], ['brick', '#a8432a'], ['burgundy', '#6b2430'], ['oxblood', '#5a1a1f'], ['terracotta', '#c0603d'],
  ['salmon', '#f08a6c'], ['peach', '#f4ae86'], ['coral', '#f07c5f'], ['orange', '#e8772e'], ['berry', '#8e2f5a'],
  ['plum', '#6e2f55'], ['mauve', '#b07a8c'], ['rose gold', '#d89c86'], ['rose', '#d9798a'], ['pink', '#ef9aac'],
  ['lavender', '#c6a9d8'], ['purple', '#a77bc4'], ['green', '#9cc59a'], ['yellow', '#f1d77a'],
  ['pearl', '#f4ead9'], ['champagne', '#ecd3a8'], ['copper', '#b8693a'], ['bronze', '#a8743a'], ['gold', '#d9aa4c'],
];
const lightness = hex => [1, 3, 5].reduce((t, i) => t + parseInt(hex.slice(i, i + 2), 16), 0);
export function swatches(text) {
  const t = String(text ?? '').toLowerCase();
  const found = [];
  for (const [word, hex] of SWATCH) {
    const at = t.indexOf(word);
    if (at >= 0 && !found.some(f => f.at <= at && at < f.at + f.word.length)) found.push({ word, hex, at });
  }
  return found.sort((a, b) => a.at - b.at).map(({ word, hex }) => ({ word, hex }));
}

// ---- Face zones: which parts of the face the guide's own placement lines name ---------------
const ZONE_WORDS = [
  ['hollow', 'cheekHollow'], ['temple', 'temples'], ['hairline', 'hairline'], ['sides of the forehead', 'temples'],
  ['under the chin', 'underChin'], ['jaw', 'jaw'], ['chin', 'chin'], ['cheekbone', 'cheekbone'], ['apple', 'apples'],
  ['under the eye', 'underEye'], ['forehead', 'forehead'], ['nose', 'nose'], ['cupid', 'cupid'], ['brow bone', 'browBone'], ['inner corner', 'innerCorner'],
];
export function zonesFrom(lines) {
  const zones = new Set();
  for (const line of [].concat(lines ?? [])) {
    // Only the placement itself: drop asides such as "(suck in cheeks to find …)" or "if forehead is wide".
    const t = String(line).toLowerCase().split(/\(| if | — | below | to find /)[0];
    for (const [word, zone] of ZONE_WORDS) if (t.includes(word)) zones.add(zone);
  }
  return [...zones];
}
/** The blush stroke the guide describes for this face shape: the first direction word it uses. */
const STROKE_WORDS = [['diagonal', 'diagonal'], ['upward', 'diagonal'], ['horizontal', 'horizontal'], ['downward', 'low'], ['below', 'low'], ['centred', 'apples'], ['apple', 'apples']];
export function blushStroke(shape) {
  const t = String(BLUSH_BY_FACE_SHAPE[shape]?.blush_direction ?? '').toLowerCase();
  const hits = STROKE_WORDS.map(([w, stroke]) => ({ at: t.indexOf(w), stroke })).filter(h => h.at >= 0).sort((a, b) => a.at - b.at);
  return hits[0]?.stroke ?? 'apples';
}

// ---- Plan sections ----------------------------------------------------------------------------
function corrector(concern, fitz, community) {
  if (concern === 'none') return null;
  const band = COLOUR_CORRECTION_BY_FITZPATRICK[CORRECTION_KEY[fitz]]?.correctors ?? {};
  const keys = {
    dark_circles: ['dark_circles'], dark_marks: ['pih', 'pih_brown', 'pih_extreme'], redness: ['redness'], sallowness: ['dullness'],
  }[concern];
  const general = { dark_circles: 'dark_circles', dark_marks: 'hyperpigmentation', redness: 'pimples_redness', sallowness: 'sallowness' }[concern];
  const hit = keys.map(k => band[k]).find(Boolean);
  const g = CORRECTING_BY_CONCERN[general];
  const ec = ETHNIC_COLOUR_CORRECTING[community]?.correctors ?? {};
  const communityKey = { dark_circles: ['dark_circles'], dark_marks: ['pih', 'pih_spots', 'melasma', 'sun_spots'], redness: ['redness', 'pimples'], sallowness: ['sallowness'] }[concern];
  // The general guide names a lighter and a deeper option in one line; keep the one for this depth.
  const light = fitz === 'I' || fitz === 'II';
  let colour = hit?.colour ?? g.corrector;
  if (!hit) colour = colour.split(/\.\s/).find(x => (light ? !/medium to deep/i.test(x) : /medium to deep|medium-deep/i.test(x))) ?? colour.split(/\.\s/)[0];
  let sw = swatches(colour);
  if (!hit && sw.length > 1) sw = [sw.reduce((a, b) => ((lightness(b.hex) > lightness(a.hex)) === light ? b : a))];
  // A community note that names other corrector colours is for a different depth; leave it out.
  const note = communityKey.map(k => ec[k]).find(Boolean) ?? null;
  const noteSw = swatches(note).map(x => x.word);
  return {
    concern: g.concern,
    colour,
    why: hit?.why ?? null,
    products: hit?.products ?? [],
    tip: g.tip ?? g.note ?? g.limitation ?? null,
    deepNote: fitz === 'VI' && concern !== 'redness' && concern !== 'sallowness' ? band.recommendation ?? null : null,
    communityNote: !noteSw.length || noteSw.some(w => sw.some(x => x.word === w)) ? note : null,
    swatches: sw.slice(0, 2),
    zones: { dark_circles: ['underEye'], dark_marks: ['marks'], redness: ['redness'], sallowness: ['forehead', 'cheekbone'] }[concern],
  };
}

function formulaFor(skin, coverage) {
  if (coverage === 'full') return skin === 'oily' ? 'stick' : 'cream';
  if (coverage === 'sheer') return skin === 'dry' || skin === 'mature' ? 'cushion' : 'serum';
  if (skin === 'oily') return 'powder';
  if (skin === 'dry') return 'cushion';
  return 'liquid';
}
function finishFor(skin, occasion) {
  if (occasion === 'long_event') return 'transfer_proof';
  if (skin === 'oily') return 'matte';
  if (skin === 'dry' || skin === 'mature') return 'dewy';
  return 'satin';
}
function base(skin, coverage, occasion, undertone, fitz, community) {
  const f = formulaFor(skin, coverage); const fin = finishFor(skin, occasion);
  const F = FOUNDATION_FORMULAS[f]; const FIN = FOUNDATION_FINISHES[fin]; const C = COVERAGE_GUIDE[coverage];
  const tool = f === 'cream' || f === 'stick' ? 'brush' : coverage === 'sheer' ? 'fingers' : 'beauty_sponge';
  const byCommunity = UNDERTONE_GUIDE.by_community[community] ?? {};
  const main = UNDERTONE_GUIDE.overview.main_undertones;
  return {
    formula: { id: f, type: F.type, description: F.description, why: F.best_for, caution: F.caution ?? null },
    finish: { id: fin, finish: FIN.finish, appearance: FIN.appearance, why: FIN.best_for, caution: FIN.caution ?? null },
    coverage: { id: coverage, level: C.level, description: C.description, when: C.when },
    undertone: {
      id: undertone,
      describe: undertone === 'olive' ? UNDERTONE_GUIDE.overview.olive : main.find(m => m.toLowerCase().startsWith(undertone)) ?? null,
      check: UNDERTONE_GUIDE.identification.white_paper_test,
      communityNote: byCommunity.common_undertones ?? null,
      tip: byCommunity.foundation_tip ?? null,
    },
    tool: { id: tool, text: str(FOUNDATION_APPLICATION.tools[tool]) },
    order: FOUNDATION_APPLICATION.order_of_operations,
    oxidation: deep(fitz) ? { who: OXIDATION_GUIDE.who_it_affects_most, prevent: OXIDATION_GUIDE.how_to_prevent.test_correctly } : null,
  };
}

function setting(skin, occasion, concern, fitz) {
  const primers = [skin === 'oily' ? 'pore_minimising_primer' : skin === 'combination' ? 'silicone_primer' : 'water_based_primer'];
  if (occasion === 'long_event') primers.push('grip_primer');
  if (concern === 'redness' || concern === 'sallowness') primers.push('colour_correcting_primer');
  const powder = deep(fitz) ? 'tinted_setting_powder' : 'translucent_powder';
  const method = occasion === 'long_event' || (skin === 'oily' && occasion === 'photos') ? 'baking'
    : skin === 'dry' || skin === 'mature' ? 'minimal_dusting' : 'press_and_roll';
  const spray = occasion === 'long_event' ? 'transfer_proof_spray' : skin === 'oily' ? 'matte_setting_spray' : skin === 'combination' ? null : 'dewy_setting_spray';
  const P = SETTING_POWDER_GUIDE.types[powder];
  const S = spray && SETTING_SPRAY_GUIDE.types[spray];
  return {
    primers: primers.map(id => {
      const p = PRIMER_GUIDE.types[id];
      return { id, type: p.type, what: p.what_it_does ?? p.note ?? null, popular: p.popular ?? [] };
    }),
    spfNote: PRIMER_GUIDE.types.SPF_primer.note,
    powder: { id: powder, type: P.type, text: P.benefit_for_dark_skin ?? P.how_it_works ?? P.description, underEye: deep(fitz) ? str(SETTING_POWDER_GUIDE.types.banana_powder.ethnic_note) || null : null },
    method: { id: method, text: str(SETTING_POWDER_GUIDE.application_methods[method]) },
    spray: S ? { id: spray, type: S.type, what: S.what_it_does ?? null, popular: S.popular ?? [] } : null,
    flashback: occasion === 'photos' ? {
      why: FLASHBACK_GUIDE.why_it_matters, solutions: Object.values(FLASHBACK_GUIDE.solutions), avoid: deep(fitz) ? FLASHBACK_GUIDE.products_to_avoid_deep_skin : [],
    } : null,
    longwear: occasion === 'long_event' ? {
      strategy: LONGWEAR_TECHNIQUES.for_hot_humid_climates.strategy, extra: LONGWEAR_TECHNIQUES.for_events_over_12_hours.extra_step,
      kit: [].concat(LONGWEAR_TECHNIQUES.for_events_over_12_hours.touch_up_kit ?? []),
    } : null,
  };
}

function sculpt(shape, fitz) {
  const band = BAND[fitz];
  const c = CONTOUR_BY_FACE_SHAPE[shape]; const b = BLUSH_BY_FACE_SHAPE[shape];
  const contourShade = CONTOUR_COLOUR_THEORY.contour_shade_by_skin_tone[CONTOUR_KEY[band]];
  const highlight = COLOUR_FOR_SKIN_TONE.highlighter_by_skin_tone[band];
  const blush = COLOUR_FOR_SKIN_TONE.blush_by_skin_tone[`${band === 'tan' ? 'tan_olive' : band}_skin`];
  const hiSw = swatches(highlight);
  const blSw = swatches(blush?.work);
  return {
    goal: c.goal,
    contour: { where: c.where_to_contour, zones: zonesFrom(c.where_to_contour), shade: contourShade },
    highlight: { where: c.where_to_highlight, zones: zonesFrom(c.where_to_highlight), colour: highlight, swatch: hiSw[0] ?? null },
    blush: { placement: b.blush_placement, direction: b.blush_direction, avoid: b.avoid ?? null, stroke: blushStroke(shape), work: blush?.work ?? null, skip: blush?.avoid ?? null, swatch: blSw[0] ?? null },
    bronzer: { rule: BRONZER_GUIDE.shade_selection.rule, shade: BRONZER_GUIDE.shade_selection[BRONZER_KEY[band]] },
    note: c.note ?? c.shape_goal ?? null,
  };
}

function tools(formula, fitz) {
  const sponge = SPONGES_AND_APPLICATORS.beauty_blender;
  const brush = k => {
    const t = Object.values(FACE_BRUSHES[k].types ?? {})[0] ?? {};
    return { use: FACE_BRUSHES[k].name, type: t.name ?? null, technique: t.technique ?? null, pick: t.picks?.[0]?.name ?? null };
  };
  return {
    brushes: ['foundation', 'powder', 'contour', 'blush', 'highlighter'].map(brush),
    sponge: formula === 'cream' || formula === 'stick' ? null : { name: sponge.name, tip: str(sponge.critical), melanin: deep(fitz) ? str(sponge.forMelaninSkin) || null : null },
  };
}

function removal(skin, coverage, finish) {
  const heavy = coverage === 'full' || finish === 'transfer_proof';
  const one = heavy ? DOUBLE_CLEANSE.step_one_options.cleansing_balm : DOUBLE_CLEANSE.step_one_options.micellar_water_as_first_step;
  const two = DOUBLE_CLEANSE.step_two_options.by_skin_type[skin === 'mature' ? 'dry' : skin];
  return {
    first: { what: one.what, how: one.how_to_use ?? [], note: one.note ?? null, options: one.popular_options ?? [] },
    second: two,
    longwear: finish === 'transfer_proof' ? WATERPROOF_REMOVAL.for_long_wear_foundation : null,
  };
}

function firstLine(v) {
  if (!v) return null;
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return null;
  return Object.values(v).find(x => typeof x === 'string' && x.length > 40) ?? null;
}
const str = v => (typeof v === 'string' ? v : v && typeof v === 'object' && !Array.isArray(v) ? Object.values(v).filter(x => typeof x === 'string').join(' ') : Array.isArray(v) ? v.join(' ') : '');
const pick = (v, list, d) => (list.includes(v) ? v : d);

export function buildComplexionPlan(input = {}) {
  const cid = resolveCommunity(input.community ?? 'west_african').id ?? 'west_african';
  const fitz = pick(input.fitzpatrick, FITZPATRICK, 'V');
  const concern = pick(input.correct, CORRECT.map(x => x.id), 'dark_circles');
  const undertone = pick(input.undertone, UNDERTONES.map(x => x.id), 'warm');
  const skin = pick(input.skinType, SKIN_TYPES.map(x => x.id), 'combination');
  const coverage = pick(input.coverage, COVERAGE.map(x => x.id), 'medium');
  const shape = pick(input.faceShape, FACE_SHAPES.map(x => x.id), 'oval');
  const occasion = pick(input.occasion, OCCASIONS.map(x => x.id), 'everyday');
  const tone = MONK_TONES.find(t => t.id === input.tone) ?? MONK_TONES[6];
  const b = base(skin, coverage, occasion, undertone, fitz, cid);
  const c2 = ETHNIC_FACE_SHAPES_EXTENDED[cid.replace(/_/g, '-')] ?? {};
  const ce = ETHNIC_CONTOUR_GUIDE[cid] ?? {};
  return {
    community: { id: cid, label: LIBRARY_COMMUNITIES.find(x => x.id === cid)?.label ?? cid },
    choices: { correct: concern, fitzpatrick: fitz, undertone, skinType: skin, coverage, faceShape: shape, occasion, community: cid, tone: tone.id },
    tone,
    prep: SKIN_PREP.for_different_skin_types[skin],
    correct: corrector(concern, fitz, cid),
    base: b,
    set: setting(skin, occasion, concern, fitz),
    sculpt: sculpt(shape, fitz),
    tools: tools(b.formula.id, fitz),
    remove: removal(skin, coverage, b.finish.id),
    communityNotes: {
      contour: ce.typical_approach ?? c2.contourGoals ?? null,
      highlight: firstLine(ce.highlight) ?? c2.highlight ?? null,
      cheeks: firstLine(getEthnicCheekTradition(cid)),
      setting: firstLine(getEthnicSettingTradition(cid)),
      finish: firstLine(FINISH_BY_COMMUNITY[cid]),
      cleansing: firstLine(COMMUNITY_CLEANSING_TRADITIONS[cid]),
    },
  };
}

export function complexionOptions() {
  return {
    communities: LIBRARY_COMMUNITIES.map(x => ({ id: x.id, label: x.label })),
    correct: CORRECT, fitzpatrick: FITZPATRICK, undertones: UNDERTONES, skinTypes: SKIN_TYPES,
    coverage: COVERAGE, faceShapes: FACE_SHAPES, occasions: OCCASIONS, tones: MONK_TONES,
  };
}
