/**
 * Natural Hair Journeys: the Hair Lab's second half. Where the Colour Lab plans a colour change,
 * this plans time: a protective-style rotation, a loc journey, a relaxer-to-natural transition,
 * a silk-press routine or a length-retention plan, laid out as a timeline for the person's
 * texture, scalp and edges.
 *
 * The facts come from the wired guides (protective_styles_extended, hair_growth_guide,
 * hair_growth_science, hair_care_science_extended, hair_damage_guide, scalp_conditions_guide,
 * scalp_care_guide, scalp_health_ethnic_guide, hair_growth_ethnic_guide, hair_extensions_guide).
 * This module turns them into dated steps: it parses the guides' own durations (style
 * longevity, loc stages, the minimum break between installs, the monthly growth rate) and
 * does the arithmetic.
 */
import {
  LOCS_GUIDE, WIGS_EXTENSIONS, SCALP_HEALTH_IN_PROTECTIVE_STYLES, getStylesByInstallTime, getStylesForHairTexture,
} from '../protective_styles_extended.js';
import { HAIR_GROWTH_SCIENCE, getRetentionGuide, getTractionAlopeciaGuide } from '../hair_growth_guide.js';
import { HAIR_GROWTH_CYCLE } from '../hair_growth_science.js';
import { HEAT_DAMAGE_SCIENCE } from '../hair_care_science_extended.js';
import { getRecoveryProtocol } from '../hair_damage_guide.js';
import { getDandruffGuide, getScalpPsoriasisGuide, getTineaCapitisGuide, getAlopeciaAreaataGuide, getScalpAcneGuide } from '../scalp_conditions_guide.js';
import { SCALP_BIOLOGY } from '../scalp_health_ethnic_guide.js';
import { getHairGrowthGuide } from '../hair_growth_ethnic_guide.js';
import { getEthnicExtensionTradition } from '../hair_extensions_guide.js';
import { ETHNIC_HAIR_ROUTINES } from '../hair_care_routines_by_type.js';
import { HAIR_TEXTURES } from '../hair_painter.js';
import { TEXTURES } from './colour_lab.js';
import { LIBRARY_COMMUNITIES, resolveCommunity } from '../library/communities.js';

const kebab = id => (id ? id.replace(/_/g, '-') : null);
const nums = s => (String(s ?? '').match(/\d+(?:\.\d+)?/g) ?? []).map(Number);

export const JOURNEYS = [
  { id: 'protective_rotation', label: 'Protective-style rotation' },
  { id: 'locs', label: 'Starting or growing locs' },
  { id: 'transition', label: 'Relaxed to natural' },
  { id: 'silk_press', label: 'Silk press without heat damage' },
  { id: 'length_retention', label: 'Keeping length' },
];
export const EDGES = ['full', 'thinning'];
export const INSTALL_HOURS = [2, 3, 4, 5];
export const STRANDS = [
  { id: 'medium', label: 'Medium or coarse, unprocessed' },
  { id: 'fine', label: 'Fine' },
  { id: 'bleached', label: 'Bleached or chemically treated' },
];
export const SCALP = [
  { id: 'none', label: 'No problems' },
  { id: 'flakes', label: 'Flakes or itch' },
  { id: 'thick_scale', label: 'Thick, silvery scale' },
  { id: 'patches', label: 'Round bald patches' },
  { id: 'bumps', label: 'Bumps or spots' },
  { id: 'scaly_patch_broken', label: 'Scaly patch with broken hairs' },
];
export const LOC_METHODS = Object.entries(LOCS_GUIDE.types).map(([id, t]) => ({ id, label: t.name }));

// ---- Durations parsed from the guides -----------------------------------------------------

/** "Scalp hair grows approximately 0.5 inches (1.27cm) per MONTH" -> 1.27 */
export const CM_PER_MONTH = (() => {
  const m = HAIR_GROWTH_SCIENCE.growth_rate.scalp_hair.match(/\(([\d.]+)\s*cm\)/i);
  return m ? Number(m[1]) : null;
})();

/** "Take protective style breaks between installs (2-4 weeks minimum)" -> 2 */
export const MIN_BREAK_WEEKS = (() => {
  const line = SCALP_BIOLOGY.commonConditions.tractionAlopecia.prevention.find(l => /breaks between installs/i.test(l));
  const m = line?.match(/\(([\d-–]+) weeks/i);
  return m ? Math.min(...nums(m[1])) : null;
})();

/** Longevity like "6–8 weeks properly maintained" -> upper bound in weeks of the first range. */
export function longevityWeeks(longevity) {
  const first = String(longevity ?? '').split(/[;(]/)[0];
  const n = nums(first);
  if (!n.length) return null;
  const top = Math.max(...n.slice(0, 2));
  return /month/i.test(first) ? top * 4 : top;
}

export function installHours(installationTime) {
  const n = nums(String(installationTime ?? '').split('(')[0]);
  return n.length ? { min: n[0], max: n[1] ?? n[0] } : null;
}

// ---- Scalp ----------------------------------------------------------------------------------

function scalpPlan(scalp) {
  switch (scalp) {
    case 'flakes': {
      const d = getDandruffGuide();
      return { title: 'Flakes or itch: likely dandruff or seborrhoeic dermatitis', points: [d.overview.dandruff, ...(d.in_ethnic_hair.solutions ?? []).slice(0, 3), d.in_ethnic_hair.oil_caution], seeDoctor: false };
    }
    case 'thick_scale': {
      const g = getScalpPsoriasisGuide();
      return { title: 'Thick, silvery scale: see a dermatologist, this can be scalp psoriasis', points: [g.what, g.vs_seborrheic_dermatitis.scale, g.in_dark_skin.appearance, ...g.treatment.topical.slice(0, 2)], seeDoctor: true };
    }
    case 'patches': {
      const g = getAlopeciaAreaataGuide();
      return { title: 'Round bald patches: see a dermatologist, this can be alopecia areata', points: [g.what, g.treatment.topical_steroids, g.treatment.intralesional_steroids], seeDoctor: true };
    }
    case 'bumps': {
      const g = getScalpAcneGuide();
      return { title: 'Bumps or spots: scalp folliculitis, or tension at the hairline', points: [g.what, ...g.treatment.mild, ...g.prevention.slice(0, 2)], seeDoctor: false };
    }
    case 'scaly_patch_broken': {
      const g = getTineaCapitisGuide();
      return { title: 'Scaly patch with broken hairs: see a doctor, this can be a fungal infection (tinea capitis)', points: [g.what, g.appearance.scaly_patches, g.treatment.important, g.treatment.oral.adjunct, ...g.treatment.preventing_spread.slice(1, 3)], seeDoctor: true };
    }
    default:
      return { title: 'Healthy scalp checklist', points: SCALP_HEALTH_IN_PROTECTIVE_STYLES.signs_of_healthy_scalp, seeDoctor: false };
  }
}

// ---- Journeys -------------------------------------------------------------------------------

function rotation({ texture, hours, edges, months }) {
  // The guide's lookup matches the whole curl class (3A gets every type 3 style); keep exact matches only.
  const byTexture = new Set(getStylesForHairTexture(texture.code).filter(s => s.hairTexturesBestFor.includes(texture.code)).map(s => s.name));
  // Longest-lasting first: fewer installs means less tension over the months.
  const fits = getStylesByInstallTime(hours).filter(s => byTexture.has(s.name))
    .sort((a, b) => (longevityWeeks(b.longevity) ?? 0) - (longevityWeeks(a.longevity) ?? 0));
  // With thinning edges, the guides say to stop tension first: no braided styles that grip the hairline.
  const pool = edges === 'thinning' ? fits.filter(s => !/cornrow|braid|feed/i.test(s.name)) : fits;
  const chosen = pool.slice(0, 3);
  const timeline = [];
  let week = 0;
  if (edges === 'thinning') {
    timeline.push({ label: 'Tension-free break', from: 0, to: 4, kind: 'break', note: getTractionAlopeciaGuide().early_treatment });
    week = 4;
  }
  for (const s of chosen) {
    const wks = longevityWeeks(s.longevity) ?? 4;
    timeline.push({ label: s.name, from: week, to: week + wks, kind: 'style', note: `Install ${s.installationTime}. Keep in ${s.longevity}.` });
    week += wks;
    if (MIN_BREAK_WEEKS) {
      timeline.push({ label: 'Break', from: week, to: week + MIN_BREAK_WEEKS, kind: 'break', note: `At least ${MIN_BREAK_WEEKS} weeks between installs, per the scalp guide.` });
      week += MIN_BREAK_WEEKS;
    }
  }
  const nowWeek = Math.min(week, Math.round(months * 4.33));
  const current = timeline.find(t => nowWeek >= t.from && nowWeek < t.to) ?? timeline.at(-1) ?? null;
  return {
    unit: 'weeks', total: week, now: nowWeek, timeline, current,
    texture: { label: texture.label, description: HAIR_TEXTURES[texture.id].description, tips: HAIR_TEXTURES[texture.id].care_tips ?? [] },
    styles: chosen.map(s => ({ name: s.name, install: s.installationTime, longevity: s.longevity, mistakes: (s.commonMistakes ?? []).slice(0, 2), takedown: s.takedown ?? null })),
    excluded: edges === 'thinning' ? fits.filter(s => !pool.includes(s)).map(s => s.name) : [],
    noStyles: chosen.length === 0 ? `No protective style in the guides installs in ${hours} hours or less for ${texture.code} hair; a wig over flat cornrows is the low-time option.` : null,
    actions: [
      ...(edges === 'thinning' ? getTractionAlopeciaGuide().prevention : SCALP_HEALTH_IN_PROTECTIVE_STYLES.traction_alopecia.prevention).slice(0, 4),
      WIGS_EXTENSIONS.whyWigs.underWigCare,
    ],
  };
}

function locsJourney({ months, method }) {
  const type = LOCS_GUIDE.types[method] ?? LOCS_GUIDE.types.starter;
  const stages = LOCS_GUIDE.stages.map(s => {
    const n = nums(s.months);
    return { label: s.stage, from: n[0], to: n.length > 1 ? n[1] : n[0] + 6, kind: 'stage', note: s.description };
  });
  // Stage ranges share their edges ("0–6", "6–12"): month 6 is the start of Budding, not the end of Starter.
  const current = stages.find(s => months >= s.from && months < s.to) ?? stages.at(-1);
  const next = stages[stages.indexOf(current) + 1] ?? null;
  return {
    unit: 'months', total: stages.at(-1).to, now: months, timeline: stages, current,
    method: { name: type.name, description: type.description, timeTo: type.timeTo ?? null, maintenance: type.maintenance ?? null },
    next: next ? { label: next.label, inMonths: Math.max(0, next.from - months) } : null,
    actions: LOCS_GUIDE.careBasics,
    context: LOCS_GUIDE.culturalContext,
  };
}

function transitionJourney({ months, relaxedCm }) {
  const p = getRecoveryProtocol('relaxer_transition');
  const grown = CM_PER_MONTH ? +(months * CM_PER_MONTH).toFixed(1) : null;
  // Growing out: months until the new growth reaches the length of relaxed hair still on the head.
  const monthsToAllNatural = CM_PER_MONTH ? Math.ceil(relaxedCm / CM_PER_MONTH) : null;
  const total = Math.max(monthsToAllNatural ?? 12, months + 1);
  const timeline = [
    { label: 'Growing out', from: 0, to: monthsToAllNatural ?? total, kind: 'stage', note: p.line_of_demarcation },
    { label: 'Big chop possible any time', from: 0, to: total, kind: 'option', note: 'Cutting off the relaxed ends ends the transition at once; growing out keeps length.' },
  ];
  return {
    unit: 'months', total, now: months, timeline, current: timeline[0],
    grownCm: grown, monthsToAllNatural, remainingMonths: monthsToAllNatural != null ? Math.max(0, monthsToAllNatural - months) : null,
    growthRate: HAIR_GROWTH_SCIENCE.growth_rate.scalp_hair,
    actions: p.steps,
  };
}

/** "Fine hair: max 150°C (300°F). Bleached hair: max 180°C (350°F)." -> the sentence for this strand. */
function strandLimit(note, strand) {
  const word = { fine: 'Fine hair', bleached: 'Bleached hair' }[strand];
  return note.split(/(?<=\.)\s+/).find(x => x.startsWith(word)) ?? null;
}

function silkPressJourney({ strand }) {
  const t = HEAT_DAMAGE_SCIENCE.temperatures;
  const maxTemp = strand === 'medium' ? t.safe_max : `${strandLimit(t.fine_hair_note, strand)} ${t.fine_hair_note.split('. ')[0]}.`;
  const rec = getRecoveryProtocol('heat_damage');
  const care = HAIR_TEXTURES.silk_straight.care_tips;
  // A press has an order, not a schedule: the guides give no number of weeks, so the timeline is in steps.
  const timeline = [
    { label: 'Protect', from: 0, to: 1, kind: 'step', note: HEAT_DAMAGE_SCIENCE.heat_protectants.how_they_work },
    { label: 'Press', from: 1, to: 2, kind: 'style', note: maxTemp },
    { label: 'Wear it', from: 2, to: 3, kind: 'style', note: care.join(' · ') },
    { label: 'Wash back to curls', from: 3, to: 4, kind: 'break', note: `${rec.note} Check: ${HEAT_DAMAGE_SCIENCE.signs_of_heat_damage[0]}.` },
  ];
  return {
    unit: 'steps', total: 4, now: null, timeline, current: timeline[1],
    temperatures: { safe: t.safe_max, caution: t.caution_zone, danger: t.danger_zone, yours: maxTemp },
    signs: HEAT_DAMAGE_SCIENCE.signs_of_heat_damage,
    actions: rec.steps,
  };
}

function retentionJourney({ months, goalCm }) {
  const r = getRetentionGuide();
  const monthsToGoal = CM_PER_MONTH ? Math.ceil(goalCm / CM_PER_MONTH) : null;
  return {
    unit: 'months', total: Math.max(monthsToGoal ?? 12, months + 1), now: months, current: null,
    timeline: [
      { label: `Grow ${goalCm} cm`, from: 0, to: monthsToGoal ?? 12, kind: 'stage', note: `At the guide's average of ${HAIR_GROWTH_SCIENCE.growth_rate.scalp_hair.replace(/^Scalp hair grows /, '')}, if none of it breaks off.` },
    ],
    monthsToGoal,
    insight: r.critical_insight,
    killers: r.retention_killers,
    actions: r.retention_builders,
    shedding: HAIR_GROWTH_CYCLE.overview.daily_shedding,
  };
}

/** First prose value (a sentence, not an id or name) in a guide object, depth-first. */
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

// ---- Plan -----------------------------------------------------------------------------------

const clamp = (v, lo, hi, d) => (Number.isFinite(Number(v)) ? Math.min(hi, Math.max(lo, Number(v))) : d);
const pick = (v, list, d) => (list.includes(v) ? v : d);

export function buildJourney(input = {}) {
  const community = resolveCommunity(input.community ?? 'west_african');
  const c = kebab(community.id);
  const journey = pick(input.journey, JOURNEYS.map(j => j.id), 'protective_rotation');
  const texture = TEXTURES.find(t => t.id === input.texture) ?? TEXTURES.find(t => t.id === 'type_4a');
  const months = clamp(input.months, 0, 36, 0);
  const hours = pick(Number(input.installHours), INSTALL_HOURS, 4);
  const strand = pick(input.strand, STRANDS.map(x => x.id), 'medium');
  const edges = pick(input.edges, EDGES, 'full');
  const scalp = pick(input.scalp, SCALP.map(s => s.id), 'none');
  const method = pick(input.locMethod, LOC_METHODS.map(m => m.id), 'starter');
  const relaxedCm = clamp(input.relaxedCm, 1, 60, 15);
  const goalCm = clamp(input.goalCm, 1, 60, 10);

  const body = {
    protective_rotation: () => rotation({ texture, hours, edges, months }),
    locs: () => locsJourney({ months, method }),
    transition: () => transitionJourney({ months, relaxedCm }),
    silk_press: () => silkPressJourney({ strand }),
    length_retention: () => retentionJourney({ months, goalCm }),
  }[journey]();

  const warnings = [];
  if (edges === 'thinning') warnings.push({ why: 'Thinning edges', text: getTractionAlopeciaGuide().early_treatment }, { why: 'Thinning edges', text: getTractionAlopeciaGuide().late_stage });
  if (edges === 'thinning' && journey === 'protective_rotation') warnings.push({ why: 'Wigs and thinning edges', text: WIGS_EXTENSIONS.laceGlueWarning });
  const scalpInfo = scalpPlan(scalp);
  if (scalpInfo.seeDoctor) warnings.unshift({ why: 'See a doctor first', text: scalpInfo.title });

  const growth = getHairGrowthGuide(c);
  const routine = ETHNIC_HAIR_ROUTINES[c];
  return {
    community: { id: community.id, label: LIBRARY_COMMUNITIES.find(x => x.id === community.id)?.label ?? community.id, substituted: community.substituted },
    choices: { journey, texture: texture.id, months, installHours: hours, strand, edges, scalp, locMethod: method, relaxedCm, goalCm },
    title: JOURNEYS.find(j => j.id === journey).label,
    ...body,
    currentIndex: body.current ? body.timeline.indexOf(body.current) : -1,
    warnings,
    scalp: scalpInfo,
    communityNotes: {
      growth: firstText(growth?.hairGrowthProfile) ?? firstText(growth),
      routine: firstText(routine, ['hairTypes']),
      extensions: getEthnicExtensionTradition(c)?.traditions ?? null,
    },
  };
}

export function journeyOptions() {
  return {
    communities: LIBRARY_COMMUNITIES.map(x => ({ id: x.id, label: x.label })),
    journeys: JOURNEYS, textures: TEXTURES.map(t => ({ id: t.id, label: t.label })),
    edges: EDGES, scalp: SCALP, locMethods: LOC_METHODS, installHours: INSTALL_HOURS, strands: STRANDS,
    cmPerMonth: CM_PER_MONTH, minBreakWeeks: MIN_BREAK_WEEKS,
  };
}
