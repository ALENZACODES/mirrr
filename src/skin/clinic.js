/**
 * Skin Clinic: dark marks, breakouts and sun, planned for your skin type.
 *
 * Pick a concern (marks left by breakouts, melasma, sun spots, active breakouts, a sore or
 * damaged barrier, eczema or rosacea), your Fitzpatrick type and your community. The plan comes
 * from the wired skin guides: the ingredient tiers for your Fitzpatrick type, the community's own
 * treatment timeline (parsed into weeks), the acne treatment ladder, the barrier repair protocol,
 * the SPF picks that do not leave a white cast on your skin, and the dangerous products sold to
 * your community. Nothing here diagnoses; the guide's "see a dermatologist" triggers are shown.
 */
import {
  getHyperpigmentationGuide, getSafeIngredientsForFitzpatrick, getDangerousProductWarning, UNIVERSAL_HYPERPIGMENTATION,
} from '../hyperpigmentation_ethnic_guide.js';
import { getSPFRecsForFitzpatrick, getMelasmaSpfGuide, REAPPLICATION_GUIDE } from '../spf_guide_ethnic.js';
import { getWhiteCastSolutions } from '../sun_protection_extended.js';
import { getAcneGuide, getPIHPipelineInfo, getWhenToSeeDerm } from '../acne_ethnic_guide.js';
import { ACNE_TREATMENT_LADDER } from '../acne_science_extended.js';
import { BARRIER_REPAIR_PROTOCOL } from '../skin_barrier_guide.js';
import { ECZEMA_GUIDE, ROSACEA_GUIDE } from '../sensitive_skin_guide.js';
import { getSensitiveSkinGuide as getCommunitySensitiveGuide } from '../sensitive_skin_ethnic.js';
import { getSkinBarrierGuide } from '../skin_barrier_ethnic_guide.js';
import { getSunCareGuide } from '../sun_care_ethnic_guide.js';
import { LIBRARY_COMMUNITIES, resolveCommunity } from '../library/communities.js';

const kebab = id => id.replace(/_/g, '-');
export const FITZPATRICK = ['I', 'II', 'III', 'IV', 'V', 'VI'];
/**
 * Skin tones for the illustration: the Monk Skin Tone Scale (Ellis Monk, published by Google,
 * skintone.google, CC BY 4.0). Used instead of the app's 60-shade list because that list's
 * medium-to-deep hex values drift into maroon (logged as an open fault in the scorecard).
 */
export const MONK_TONES = [
  { id: 'mst1', label: 'Monk 1', hex: '#f6ede4' }, { id: 'mst2', label: 'Monk 2', hex: '#f3e7db' },
  { id: 'mst3', label: 'Monk 3', hex: '#f7ead0' }, { id: 'mst4', label: 'Monk 4', hex: '#eadaba' },
  { id: 'mst5', label: 'Monk 5', hex: '#d7bd96' }, { id: 'mst6', label: 'Monk 6', hex: '#a07e56' },
  { id: 'mst7', label: 'Monk 7', hex: '#825c43' }, { id: 'mst8', label: 'Monk 8', hex: '#604134' },
  { id: 'mst9', label: 'Monk 9', hex: '#3a312a' }, { id: 'mst10', label: 'Monk 10', hex: '#292420' },
];
export const CONCERNS = [
  { id: 'marks', label: 'Dark marks after breakouts or bumps (PIH)' },
  { id: 'melasma', label: 'Melasma (patches on cheeks, forehead, lip)' },
  { id: 'sun_damage', label: 'Sun spots and uneven tone' },
  { id: 'acne', label: 'Active breakouts' },
  { id: 'barrier', label: 'Stinging, tight or flaky skin (damaged barrier)' },
  { id: 'eczema', label: 'Eczema' },
  { id: 'rosacea', label: 'Rosacea' },
];
export const ACNE_LEVELS = [
  { id: 'step1', label: 'A few spots and blackheads' },
  { id: 'step2', label: 'Regular breakouts' },
  { id: 'step3', label: 'Deep, painful or widespread' },
];

// ---- Readable ingredient tiers ------------------------------------------------------------

const NAMED = {
  'vitamin-c-l-ascorbic-acid': 'Vitamin C (L-ascorbic acid)', 'green-tea-egcg': 'Green tea (EGCG)', 'licorice-root-glabridin': 'Licorice root (glabridin)',
  'aloe-vera-aloesin': 'Aloe vera (aloesin)', 'spf-50-broad-spectrum': 'Broad-spectrum SPF 50', ipl: 'IPL (intense pulsed light)', 'tca-peels': 'TCA peels',
};
/** 'mandelic-acid-5-10-pct' -> 'Mandelic acid 5–10%' */
export function ingredientLabel(id) {
  if (NAMED[id]) return NAMED[id];
  const s = id.replace(/-(\d+)-(\d+)-pct$/, ' $1–$2%').replace(/-(\d+)-pct$/, ' $1%').replace(/-/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
const TIER_LABEL = {
  safe: 'Safe for your skin type', usable_with_care: 'Use with care', usable_with_caution: 'Use with care',
  use_with_expert_supervision: 'Only with a dermatologist', expert_supervision_only: 'Only with a dermatologist', avoid: 'Avoid',
};
export function ingredientTiers(fitz) {
  const raw = getSafeIngredientsForFitzpatrick(FITZPATRICK.indexOf(fitz) + 1);
  return Object.entries(raw).map(([k, ids]) => ({ tier: k.startsWith('avoid') ? 'avoid' : k === 'safe' ? 'safe' : /expert/.test(k) ? 'expert' : 'care', label: TIER_LABEL[k], items: ids.map(ingredientLabel) }));
}

// ---- Durations -----------------------------------------------------------------------------

/** Every "N–M weeks/months" (or "N weeks") in a guide sentence, as weeks, in reading order. */
export function parseDurations(text) {
  const out = [];
  for (const m of String(text ?? '').matchAll(/(\d+)(?:\s*[–-]\s*(\d+))?\s*(weeks?|months?)/gi)) {
    const k = /month/i.test(m[3]) ? 4.33 : 1;
    out.push({ from: Math.round(Number(m[1]) * k), to: Math.round(Number(m[2] ?? m[1]) * k), text: m[0] });
  }
  return out;
}

const TIMELINE_KEYS = {
  marks: /^(mild_pih|pih_mild|pih|pih_from_acne|acne_pih|pih_acne|pih_black_sa)$/,
  melasma: /^melasma/,
  sun_damage: /^(sun_damage|solar_lentigos|sun_damage_diffuse)$/,
};

/** The community's own timeline when its guide has one; else the general guide's sentence for marks or melasma. */
function communityTimeline(c, concern) {
  const t = getHyperpigmentationGuide(c)?.treatmentTimelines ?? {};
  const key = Object.keys(t).find(k => TIMELINE_KEYS[concern]?.test(k));
  if (key) return { source: 'community', text: t[key] };
  const general = UNIVERSAL_HYPERPIGMENTATION.step_by_step_protocol.step_5_consistency.realistic_timeline.split(/(?<=\.)\s+/);
  const line = { marks: general.find(l => /^Epidermal PIH/.test(l)), melasma: general.find(l => /^Melasma/.test(l)) }[concern];
  return line ? { source: 'general', text: line } : null;
}

/** Turn a guide sentence into checkpoints: the sentence split at each duration it mentions. */
function checkpoints(text) {
  const parts = String(text).split(/(?<=\.)\s+/).filter(Boolean);
  const points = [];
  for (const p of parts) for (const d of parseDurations(p)) points.push({ ...d, note: p });
  return points;
}

// ---- Plan pieces ---------------------------------------------------------------------------

const P = UNIVERSAL_HYPERPIGMENTATION.step_by_step_protocol;
// The guide's cleansing step, short enough for a routine line (its full reasoning is shown as a note).
const CLEANSER = P.step_1_cleanse.what_to_use.split(/\.\s/)[0];

function spfPlan(fitz, concern) {
  const recs = getSPFRecsForFitzpatrick(fitz);
  const melasma = concern === 'melasma' ? getMelasmaSpfGuide() : null;
  const deep = ['V', 'VI'].includes(fitz);
  const wc = getWhiteCastSolutions();
  return {
    why: P.step_4_spf.why ?? UNIVERSAL_HYPERPIGMENTATION.cardinal_rule,
    type: recs.recommendation?.recommendation ?? null,
    whiteCastRisk: recs.recommendation?.whiteCastRisk ?? null,
    picks: (melasma ? melasma.products : recs.bestProducts).slice(0, 4).map(p => ({ name: p.name, why: p.why ?? p.note ?? '' })),
    visibleLight: melasma ? melasma.products[0].note : null,
    whiteCast: deep ? wc.what_causes_it.mineral_filters : null,
    reapply: REAPPLICATION_GUIDE.why,
    melaninNote: deep ? REAPPLICATION_GUIDE.melaninRichSkinNote : null,
  };
}

function routineFor(concern, tiers, acneLevel) {
  const safe = tiers.find(t => t.tier === 'safe').items;
  const pick = re => safe.find(x => re.test(x));
  switch (concern) {
    case 'marks': return {
      am: [CLEANSER, pick(/niacinamide/i), pick(/vitamin c/i), 'Moisturiser', 'Broad-spectrum SPF 50'],
      pm: [CLEANSER, pick(/azelaic/i), pick(/tranexamic/i), 'Moisturiser'],
    };
    case 'melasma': return {
      am: [CLEANSER, pick(/tranexamic/i), pick(/niacinamide/i), 'Tinted SPF with iron oxides'],
      pm: [CLEANSER, pick(/azelaic/i), pick(/arbutin/i), 'Moisturiser'],
    };
    case 'sun_damage': return {
      am: [CLEANSER, pick(/vitamin c/i), pick(/green tea/i), 'Broad-spectrum SPF 50'],
      pm: [CLEANSER, pick(/niacinamide/i), 'Moisturiser'],
    };
    case 'acne': {
      const step = ACNE_TREATMENT_LADDER[acneLevel];
      return { am: [CLEANSER, ...(step.products ?? step.medications).slice(0, 2), 'Oil-free moisturiser', 'Broad-spectrum SPF'], pm: [CLEANSER, ...(step.products ?? step.medications).slice(2, 4), 'Oil-free moisturiser'] };
    }
    case 'barrier': {
      const s = BARRIER_REPAIR_PROTOCOL.immediateProtocol;
      return { am: [s.step2Cleanse.action, s.step3Humectant.action, s.step4BarrierRepair.action, 'Gentle SPF'], pm: [s.step2Cleanse.action, s.step3Humectant.action, s.step4BarrierRepair.action, s.step5Occlusive.action] };
    }
    case 'eczema': {
      const e = ECZEMA_GUIDE.eczema_safe_products; const t = ECZEMA_GUIDE.treatment.first_line;
      return { am: [`Cleanser: ${e.cleansers[0]}`, `Moisturiser: ${e.moisturisers[0]}`, 'Mineral SPF'], pm: [`Cleanser: ${e.cleansers[1]}`, t.moisturisation, `Seal: ${t.emollients[1].product}`] };
    }
    case 'rosacea': {
      const r = ROSACEA_GUIDE.rosacea_safe_skincare; const t = ROSACEA_GUIDE.treatment.topical[0];
      return { am: [`Cleanser: ${r.cleansers[0]}`, `Moisturiser: ${r.moisturisers[0]}`, `SPF: ${r.spf[0]}`], pm: [`Cleanser: ${r.cleansers[1]}`, `${t.ingredient}: ${t.note}`, `Moisturiser: ${r.moisturisers[1]}`] };
    }
    default: return { am: [], pm: [] };
  }
}

/** First prose value (a sentence, not a name) in a guide object, depth-first. */
function firstText(obj, skip = []) {
  if (!obj || typeof obj !== 'object') return null;
  for (const [k, v] of Object.entries(obj)) {
    if (skip.includes(k) || /id$|name$/i.test(k)) continue;
    if (typeof v === 'string' && v.length > 60) return v;
    const inner = typeof v === 'object' ? firstText(v, skip) : null;
    if (inner) return inner;
  }
  return null;
}
const str = v => (typeof v === 'string' ? v : v && typeof v === 'object' ? Object.values(v).filter(x => typeof x === 'string').join(' ') : '');

function concernDetail(concern, c, acneLevel) {
  switch (concern) {
    case 'acne': {
      const step = ACNE_TREATMENT_LADDER[acneLevel];
      const g = getAcneGuide(c);
      return { title: step.level, timelineText: step.timeline, notes: [ACNE_TREATMENT_LADDER.overview, getPIHPipelineInfo().title, str(g?.intro)].filter(Boolean), seeDerm: getWhenToSeeDerm().triggers };
    }
    case 'barrier': return { title: BARRIER_REPAIR_PROTOCOL.title, timelineText: BARRIER_REPAIR_PROTOCOL.immediateProtocol.step6Patience.details, notes: [BARRIER_REPAIR_PROTOCOL.immediateProtocol.step1Simplify.details, str(getSkinBarrierGuide(c)?.barrierProfile)].filter(Boolean), seeDerm: [] };
    case 'eczema': return { title: 'Eczema', timelineText: null, notes: [str(ECZEMA_GUIDE.what), str(ECZEMA_GUIDE.presentation_in_dark_skin), str(ECZEMA_GUIDE.treatment)].filter(Boolean), seeDerm: [] };
    case 'rosacea': return { title: 'Rosacea', timelineText: null, notes: [str(ROSACEA_GUIDE.what), str(ROSACEA_GUIDE.presentation_in_darker_skin), str(ROSACEA_GUIDE.underdiagnosis_in_ethnic_skin)].filter(Boolean), seeDerm: [] };
    default: {
      const t = communityTimeline(c, concern);
      const types = getHyperpigmentationGuide(c)?.primaryHyperpigmentationTypes ?? {};
      const typeKey = { marks: 'pih', melasma: 'melasma', sun_damage: Object.keys(types).find(k => /sun|photo|solar/.test(k)) }[concern];
      return { title: CONCERNS.find(x => x.id === concern).label, timelineText: t?.text ?? null, timelineSource: t?.source ?? null, notes: [P.step_1_cleanse.what_to_use, str(types[typeKey])].filter(Boolean), seeDerm: [] };
    }
  }
}

// ---- Plan ----------------------------------------------------------------------------------

const pick = (v, list, d) => (list.includes(v) ? v : d);

export function buildSkinPlan(input = {}) {
  const community = resolveCommunity(input.community ?? 'west_african');
  const c = kebab(community.id);
  const concern = pick(input.concern, CONCERNS.map(x => x.id), 'marks');
  const fitz = pick(input.fitzpatrick, FITZPATRICK, 'V');
  const acneLevel = pick(input.acneLevel, ACNE_LEVELS.map(x => x.id), 'step1');
  const tone = MONK_TONES.find(t => t.id === input.tone) ?? MONK_TONES[7];

  const tiers = ingredientTiers(fitz);
  const detail = concernDetail(concern, c, acneLevel);
  const points = detail.timelineText ? checkpoints(detail.timelineText) : [];
  const routine = routineFor(concern, tiers, acneLevel);
  routine.am = routine.am.filter(Boolean); routine.pm = routine.pm.filter(Boolean);

  // The lightening-cream dangers sold to each community matter when the concern is dark marks or tone.
  const pigment = ['marks', 'melasma', 'sun_damage'].includes(concern);
  const dangerous = pigment ? getHyperpigmentationGuide(c)?.dangerousIngredients ?? {} : {};
  const warnings = Object.entries(dangerous).slice(0, 3).map(([k, v]) => ({ why: k.replace(/_/g, ' '), text: str(v.what ?? v.risk ?? v).slice(0, 400) }));
  if (['IV', 'V', 'VI'].includes(fitz) && pigment) {
    const hq = getDangerousProductWarning('high-dose-hydroquinone');
    warnings.unshift({ why: 'Hydroquinone on deeper skin', text: `${hq.risk} ${hq.safe_use}` });
  }
  if (concern === 'barrier') warnings.unshift({ why: 'Stop actives first', text: BARRIER_REPAIR_PROTOCOL.immediateProtocol.step1Simplify.details });

  return {
    community: { id: community.id, label: LIBRARY_COMMUNITIES.find(x => x.id === community.id)?.label ?? community.id, substituted: community.substituted },
    choices: { concern, fitzpatrick: fitz, community: community.id, acneLevel, tone: tone.id },
    title: detail.title,
    tone,
    timeline: { text: detail.timelineText, source: detail.timelineSource ?? null, points, total: points.length ? Math.max(...points.map(p => p.to)) : 0 },
    routine,
    tiers,
    spf: spfPlan(fitz, concern),
    warnings,
    notes: detail.notes,
    seeDerm: detail.seeDerm,
    communityNotes: {
      sensitive: firstText(getCommunitySensitiveGuide(c), ['community']),
      sun: str(getSunCareGuide(c)?.uvExposureContext) || str(getSunCareGuide(c)?.sunCarePhilosophy) || null,
    },
  };
}

export function skinClinicOptions() {
  return {
    communities: LIBRARY_COMMUNITIES.map(x => ({ id: x.id, label: x.label })),
    concerns: CONCERNS, fitzpatrick: FITZPATRICK, acneLevels: ACNE_LEVELS,
    tones: MONK_TONES,
  };
}
