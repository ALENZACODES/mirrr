/**
 * Ageing Studio: a skin-ageing routine planned for your decade, depth and main concern.
 *
 * Decade sets what to expect and the priorities. Fitzpatrick type sets how slowly to bring in a
 * retinoid and which in-clinic treatments are safe (deeper skin carries more risk of dark marks).
 * Your main concern sets the lead ingredient and the in-clinic option. Hormone stage adds the
 * perimenopause and menopause care. Community adds foods and traditions only; nothing about your
 * skin is inferred from it.
 */
import {
  UNIVERSAL_SKIN_AGING, ANTI_AGING_INGREDIENT_SCIENCE, PROFESSIONAL_TREATMENTS_BY_SKIN_TYPE, ETHNIC_AGING_SKIN_GUIDES,
  getDecadeGuidance, getRetinoidProtocol, getLongevityFoods, getMythsByRelevance,
} from '../aging_skin_ethnic_guide.js';
import { LONGEVITY_INGREDIENTS } from '../anti_aging_ethnic.js';
import { FORTIES_GUIDE, FIFTIES_GUIDE, SIXTIES_PLUS_GUIDE } from '../mature_beauty_guide.js';
import { getAgeRoutineForCommunity } from '../skincare_routines_by_age.js';
import { COLLAGEN_LIFESTYLE, ETHNIC_COLLAGEN_NOTES } from '../collagen_guide.js';
import { MENOPAUSE_OVERVIEW, MENOPAUSAL_SKIN_CHANGES, MENOPAUSE_SKINCARE_ROUTINE, MENOPAUSAL_BEAUTY_BY_COMMUNITY, HRT_SKIN_EFFECTS } from '../menopause_beauty.js';
import { MONK_TONES, FITZPATRICK } from '../skin/clinic.js';
import { LIBRARY_COMMUNITIES, resolveCommunity } from '../library/communities.js';

export const DECADES = [
  { id: '20s', label: 'My 20s' }, { id: '30s', label: 'My 30s' }, { id: '40s', label: 'My 40s' },
  { id: '50s', label: 'My 50s' }, { id: '60s', label: '60 and over' },
];
export const CONCERNS = [
  { id: 'pigment', label: 'Dark spots and uneven tone' }, { id: 'lines', label: 'Fine lines and wrinkles' },
  { id: 'firmness', label: 'Firmness and volume' }, { id: 'dryness', label: 'Dryness and dullness' },
  { id: 'texture', label: 'Rough texture and large pores' },
];
export const STAGES = [
  { id: 'none', label: 'Not relevant to me' }, { id: 'perimenopause', label: 'Perimenopause' }, { id: 'menopause', label: 'Menopause or after' },
];

const ROUTINE_AGE = { '20s': 'twenties', '30s': 'thirties', '40s': 'forties', '50s': 'fifties_plus', '60s': 'fifties_plus' };
const MATURE = { '40s': FORTIES_GUIDE, '50s': FIFTIES_GUIDE, '60s': SIXTIES_PLUS_GUIDE };
const BAND = { I: 'light', II: 'light', III: 'medium', IV: 'medium', V: 'dark', VI: 'dark' };
const pick = (v, list, d) => (list.includes(v) ? v : d);
const dash = id => id.replace(/_/g, '-');
const SCI = ANTI_AGING_INGREDIENT_SCIENCE; const PRO = PROFESSIONAL_TREATMENTS_BY_SKIN_TYPE;

/** Lead ingredient for each concern, with why it is used. */
const LEAD = {
  pigment: { name: 'Niacinamide, with vitamin C in the morning', why: SCI.niacinamide.mechanism, forms: SCI.vitaminC.forms },
  lines: { name: LONGEVITY_INGREDIENTS.retinoids.name, why: LONGEVITY_INGREDIENTS.retinoids.why, forms: LONGEVITY_INGREDIENTS.retinoids.types },
  firmness: { name: 'Peptides', why: SCI.peptides, forms: LONGEVITY_INGREDIENTS.peptides },
  dryness: { name: 'Ceramides and a richer moisturiser', why: LONGEVITY_INGREDIENTS.ceramides, forms: SCI.AHAs.lacticAcid },
  texture: { name: 'Gentle acids (lactic or glycolic)', why: SCI.AHAs.glycolicAcid, forms: SCI.AHAs.lacticAcid },
};

/** In-clinic option for the concern, with the suitability line for this depth. */
function clinic(concern, band) {
  const deep = band === 'dark';
  if (concern === 'pigment') return { name: 'Chemical peels', suitability: deep ? PRO.chemicalPeels.darkSkinSafe : PRO.chemicalPeels.superficial };
  if (concern === 'lines') return { name: 'Microneedling', suitability: deep ? PRO.microneedlingForDarkSkin : PRO.microneedling };
  if (concern === 'firmness') return { name: 'Injectables', suitability: PRO.injectables };
  if (concern === 'texture') return { name: 'Lasers', suitability: deep ? { nonAblative: PRO.lasers.nonAblative, avoid: PRO.lasers.ablative.suitability } : PRO.lasers.nonAblative };
  return null;
}

/** Morning and evening steps, from decade, concern, depth and hormone stage. */
function routine(decade, concern, band, stage) {
  const older = decade !== '20s'; const meno = stage !== 'none';
  const am = [
    { step: 'Cleanse', detail: meno ? MENOPAUSE_SKINCARE_ROUTINE.morning.gentle_cleanser : 'Gentle, non-stripping cleanser' },
    ...(concern === 'pigment' || older ? [{ step: 'Vitamin C', detail: 'Antioxidant serum under sunscreen' }] : []),
    { step: concern === 'dryness' || meno ? 'Rich moisturiser' : 'Moisturiser', detail: concern === 'dryness' || meno ? MENOPAUSE_SKINCARE_ROUTINE.morning.rich_moisturiser : 'Light, non-comedogenic' },
    { step: 'Sunscreen', detail: band === 'dark' ? 'Broad-spectrum SPF 30+ every day; tinted mineral avoids a white cast' : 'Broad-spectrum SPF 30+ every day' },
  ];
  const retinoid = older || concern === 'lines';
  const pm = [
    { step: 'Cleanse', detail: 'Remove sunscreen fully' },
    ...(concern === 'pigment' || band === 'dark' ? [{ step: 'Niacinamide', detail: 'Helps prevent and fade dark marks' }] : []),
    ...(retinoid ? [{ step: 'Retinoid', detail: getRetinoidProtocol(band).frequency }] : []),
    ...(concern === 'firmness' ? [{ step: 'Peptide serum', detail: 'On nights without the retinoid, or under moisturiser' }] : []),
    ...(concern === 'texture' ? [{ step: 'Lactic or glycolic acid', detail: 'Once or twice a week, never on retinoid nights' }] : []),
    { step: concern === 'dryness' || meno ? 'Rich cream or facial oil' : 'Moisturiser', detail: concern === 'dryness' || meno ? MENOPAUSE_SKINCARE_ROUTINE.evening.rich_cream_or_oil : 'Seal in water' },
  ];
  return { am, pm, retinoid };
}

function hormones(stage) {
  if (stage === 'none') return null;
  const phase = MENOPAUSE_OVERVIEW.phases[stage];
  return {
    what: phase.what, signs: phase.symptoms_relevant_to_beauty ?? null,
    skin: stage === 'perimenopause'
      ? { acne: MENOPAUSAL_SKIN_CHANGES.acne_in_perimenopause, pigment: MENOPAUSAL_SKIN_CHANGES.pigmentation_changes }
      : { collagen: MENOPAUSAL_SKIN_CHANGES.collagen_loss, dryness: MENOPAUSAL_SKIN_CHANGES.dryness },
    principles: MENOPAUSE_SKINCARE_ROUTINE.core_principles,
    hrt: stage === 'menopause' ? { disclaimer: HRT_SKIN_EFFECTS.disclaimer, benefits: HRT_SKIN_EFFECTS.skin_benefits_of_hrt, discuss: HRT_SKIN_EFFECTS.risks_to_discuss_with_doctor } : null,
  };
}

function communityNotes(cid, decade, stage) {
  const d = dash(cid); const g = ETHNIC_AGING_SKIN_GUIDES[d];
  const tradKey = ['traditionalPractices', 'traditionalIngredients', 'ayurvedicAntiAging', 'propheticMedicineIngredients', 'koreanFermented', 'frankincense', 'rooibos', 'JBCO'].find(k => g?.[k]);
  const meno = stage === 'none' ? null : MENOPAUSAL_BEAUTY_BY_COMMUNITY[['west_african', 'black_american'].includes(cid) ? 'west_african_black_american' : cid] ?? null;
  return {
    foods: getLongevityFoods(d), collagenFoods: ETHNIC_COLLAGEN_NOTES[cid]?.notes ?? null,
    traditions: tradKey ? { key: tradKey, items: g[tradKey] } : null,
    decadeTip: getAgeRoutineForCommunity(ROUTINE_AGE[decade], d)?.communityTip ?? null,
    menopause: meno ? meno.traditional_approach : null,
    myths: getMythsByRelevance(d).slice(0, 3),
  };
}

export function buildAgeingPlan(input = {}) {
  const cid = resolveCommunity(input.community ?? 'west_african').id ?? 'west_african';
  const decade = pick(input.decade, DECADES.map(x => x.id), '30s');
  const fitz = pick(input.fitzpatrick, FITZPATRICK, 'V');
  const concern = pick(input.concern, CONCERNS.map(x => x.id), 'pigment');
  const stage = pick(input.stage, STAGES.map(x => x.id), 'none');
  const tone = MONK_TONES.find(t => t.id === input.tone) ?? MONK_TONES[6];
  const band = BAND[fitz]; const guide = getDecadeGuidance(decade); const r = routine(decade, concern, band, stage);
  const protocol = getRetinoidProtocol(fitz);
  return {
    community: { id: cid, label: LIBRARY_COMMUNITIES.find(x => x.id === cid)?.label ?? cid },
    choices: { decade, fitzpatrick: fitz, concern, stage, community: cid, tone: tone.id },
    tone,
    depth: { type: fitz, protocolFor: protocol.fitzpatrick },
    decade: {
      id: decade, overview: guide.overview, changes: guide.keyChanges, priorities: guide.priorities,
      expect: MATURE[decade]?.what_to_expect ?? null,
    },
    routine: { am: r.am, pm: r.pm },
    retinoid: r.retinoid ? {
      start: protocol.startingStrength, frequency: protocol.frequency, notes: protocol.notes, special: protocol.specialNote ?? null,
      ramp: band === 'light' ? LONGEVITY_INGREDIENTS.retinoids.protocol : null,
      deepSkin: band === 'dark' ? SCI.retinoids.darkSkinConsiderations : null,
    } : null,
    lead: LEAD[concern],
    clinic: clinic(concern, band),
    hormones: hormones(stage),
    lifestyle: { sleep: COLLAGEN_LIFESTYLE.sleep, stress: COLLAGEN_LIFESTYLE.stress_management, avoid: COLLAGEN_LIFESTYLE.avoid },
    principle: UNIVERSAL_SKIN_AGING.retinoidProtocolsByType.overview,
    communityNotes: communityNotes(cid, decade, stage),
  };
}

export function ageingOptions() {
  return {
    communities: LIBRARY_COMMUNITIES.map(x => ({ id: x.id, label: x.label })), fitzpatrick: FITZPATRICK,
    decades: DECADES, concerns: CONCERNS, stages: STAGES, tones: MONK_TONES,
  };
}
