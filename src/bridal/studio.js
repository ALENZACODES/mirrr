/**
 * Bridal Countdown: what to do now for the time you have left, what is too late to start and what
 * to catch up on, a skincare phase for your skin type, wedding hair for your texture, your
 * community's timeline, rituals and touch-up kit, and how to choose a makeup artist.
 *
 * Time left picks the phase in both the general and the community timeline; Fitzpatrick type
 * picks the skincare plan and which lasers are safe; hair type and style decide the hair plan.
 * Community adds wedding traditions only.
 */
import { BRIDAL_PREP_TIMELINES, BRIDAL_SKINCARE_BY_TONE, BRIDAL_HAIR_GUIDE, BRIDAL_TOUCHUP_KITS, MUA_SELECTION_GUIDE, BRIDAL_PERFUME_GUIDE } from '../bridal_beauty_ethnic_guide.js';
import { BRIDAL_FUNDAMENTALS, BRIDAL_TOUCH_UP_KIT, getBridalTraditions } from '../bridal_beauty_guide.js';
import { isLaserSafeForPhototype } from '../body_hair_ethnic_guide.js';
import { MONK_TONES, FITZPATRICK } from '../skin/clinic.js';
import { LIBRARY_COMMUNITIES, resolveCommunity } from '../library/communities.js';

export const TIME_LEFT = [
  { id: '12m', label: '12 months or more', general: '12_months', community: 'sixMonthsBefore', skin: 'months6to3' },
  { id: '9m', label: 'About 9 months', general: '9_months', community: 'sixMonthsBefore', skin: 'months6to3' },
  { id: '6m', label: 'About 6 months', general: '6_months', community: 'sixMonthsBefore', skin: 'months6to3' },
  { id: '3m', label: 'About 3 months', general: '3_months', community: 'threeMonthsBefore', skin: 'months3to1' },
  { id: '1m', label: 'About 1 month', general: '1_month', community: 'oneMonthBefore', skin: 'finalMonth' },
  { id: '1w', label: 'About 1 week', general: '1_week', community: 'oneWeekBefore', skin: 'finalMonth' },
  { id: 'day', label: 'It is the wedding day', general: 'wedding_day', community: 'dayOf', skin: 'finalMonth' },
];
export const HAIR_TYPES = ['straight', '2', '3A', '3B', '3C', '4A', '4B', '4C'].map(id => ({ id, label: id === 'straight' ? 'Straight' : id === '2' ? 'Wavy (type 2)' : `Type ${id}` }));
const TEXTURED = BRIDAL_HAIR_GUIDE.naturalHairBrides.stylesForTexturedHair;
const EXT = BRIDAL_HAIR_GUIDE.extensions.types;
const slug = s => s.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
export const STYLES = [
  ...TEXTURED.map(s => ({ id: slug(s.style), label: s.style, kind: 'natural', src: s })),
  ...EXT.map(s => ({ id: slug(s.type), label: s.type, kind: 'extensions', src: s })),
];
const LASERS = [['ndYAG', 'Nd:YAG'], ['diode', 'Diode'], ['alexandrite', 'Alexandrite'], ['IPL', 'IPL']];
/** Tasks that need lead time, and the first time-left setting at which they are too late to start. */
const LEAD_TIME = [{ re: /6\+ months|6 months minimum/, from: '3m' }, { re: /start NOW|3–4 sessions/, from: '1m' }];
const BOOKING = /\bbook\b|\bBook\b/;

const pick = (v, list, d) => (list.includes(v) ? v : d);
const dash = id => id.replace(/_/g, '-');
const toneGroup = fitz => (['V', 'VI'].includes(fitz) ? 'deepEbonyToDeepBrown' : fitz === 'IV' ? 'warmMediumToBrown' : 'fairToOlive');
const tasksOf = phase => phase.tasks ?? phase.schedule;

function countdown(timeId) {
  const i = TIME_LEFT.findIndex(t => t.id === timeId); const T = BRIDAL_FUNDAMENTALS.timeline;
  const earlier = TIME_LEFT.slice(0, i).flatMap(t => tasksOf(T[t.general]));
  const at = id => TIME_LEFT.findIndex(t => t.id === id);
  const late = x => LEAD_TIME.some(l => l.re.test(x) && i >= at(l.from));
  const next = TIME_LEFT[i + 1];
  return {
    phase: T[TIME_LEFT[i].general].title, now: tasksOf(T[TIME_LEFT[i].general]),
    tooLate: earlier.filter(late), catchUp: earlier.filter(x => BOOKING.test(x)),
    next: next ? { title: T[next.general].title, tasks: tasksOf(T[next.general]) } : null,
    step: i, steps: TIME_LEFT.length,
  };
}

function skinPlan(fitz, timeId) {
  const g = BRIDAL_SKINCARE_BY_TONE[toneGroup(fitz)]; const phase = TIME_LEFT.find(t => t.id === timeId).skin;
  const p = g.bridalSkincarePlan[phase];
  return {
    type: fitz, group: g.toneRange, fitzpatrickRange: g.fitzpatrickRange, phase,
    am: p.am, pm: p.pm, weekly: p.weekly ?? [], monthlyPro: p.monthlyPro ?? [], noActives: Boolean(p.noActives), note: p.note ?? null,
    challenges: g.challenges, foundationTips: g.foundationMatchTips ?? null,
    safeLasers: LASERS.filter(([k]) => isLaserSafeForPhototype(k, fitz)).map(([, l]) => l),
    unsafeLasers: LASERS.filter(([k]) => !isLaserSafeForPhototype(k, fitz)).map(([, l]) => l),
  };
}

function hairPlan(type, styleId) {
  const st = STYLES.find(s => s.id === styleId); const textured = /^[34]/.test(type);
  if (st.kind === 'natural') {
    const s = st.src;
    return {
      type, style: s.style, kind: 'natural', suited: s.suitableTypes.includes(type), suitableTypes: s.suitableTypes,
      description: s.description, how: s.longevityTips, accessories: s.accessoryIdeas ?? null,
      prep: textured ? BRIDAL_HAIR_GUIDE.naturalHairBrides.prepTimeline : null,
      alternatives: TEXTURED.filter(x => x.suitableTypes.includes(type) && x !== s).map(x => x.style),
    };
  }
  const s = st.src;
  return {
    type, style: s.type, kind: 'extensions', suited: true, suitableTypes: null, description: s.description,
    how: `Install: ${s.installTiming}. Lasts: ${s.longevity}. ${s.recommendation}.`, accessories: null,
    prep: textured ? BRIDAL_HAIR_GUIDE.naturalHairBrides.prepTimeline.filter(x => /Month|Week/.test(x.timing)) : null,
    alternatives: [],
  };
}

function communityNotes(cid, timeId) {
  const d = dash(cid); const g = BRIDAL_PREP_TIMELINES[d]; const t = TIME_LEFT.find(x => x.id === timeId);
  const phase = g.timeline[t.community];
  const kit = BRIDAL_TOUCHUP_KITS[d]; const perfume = BRIDAL_PERFUME_GUIDE[d]; const extra = getBridalTraditions(d);
  return {
    styles: g.weddingStyles,
    timeline: phase ? { label: phase.label, tasks: phase.tasks } : null,
    rituals: g.preWeddingRituals.map(r => ({ name: r.name, timing: r.timing ?? null, description: r.description ?? null, caution: r.caution ?? null })),
    makeup: g.makeupPhilosophy, signature: g.signatureElements,
    hair: g.hairTraditions.map(h => ({ style: h.style, description: h.description ?? null, tip: h.stylingTip ?? null })),
    kit: { essential: kit.essential, extras: Object.entries(kit).filter(([k, v]) => k.startsWith('for') && Array.isArray(v)).map(([k, v]) => ({ for: k.slice(3), items: v })) },
    perfume: perfume ? { scents: perfume.traditionalScents, families: perfume.recommendedFamilies, apply: perfume.applicationTips, lasting: perfume.longevityTips ?? null, considerations: perfume.considerations ?? null } : null,
    artist: MUA_SELECTION_GUIDE.byCommunity[d],
    ceremonies: extra?.ceremonies ? Object.values(extra.ceremonies).map(c => ({ name: c.name, what: c.what ?? c.look ?? c.description ?? null })) : null,
  };
}

export function buildBridalPlan(input = {}) {
  const cid = resolveCommunity(input.community ?? 'west_african').id ?? 'west_african';
  const time = pick(input.time, TIME_LEFT.map(x => x.id), '6m');
  const fitz = pick(input.fitzpatrick, FITZPATRICK, 'V');
  const hairType = pick(input.hairType, HAIR_TYPES.map(x => x.id), '4B');
  const style = pick(input.style, STYLES.map(x => x.id), 'twist-out-braid-out');
  const tone = MONK_TONES.find(t => t.id === input.tone) ?? MONK_TONES[6];
  return {
    community: { id: cid, label: LIBRARY_COMMUNITIES.find(x => x.id === cid)?.label ?? cid },
    choices: { time, fitzpatrick: fitz, hairType, style, community: cid, tone: tone.id },
    tone, timeLeft: TIME_LEFT.find(x => x.id === time).label,
    countdown: countdown(time),
    skin: skinPlan(fitz, time),
    hair: hairPlan(hairType, style),
    kit: { general: BRIDAL_TOUCH_UP_KIT.essentials, carrier: BRIDAL_TOUCH_UP_KIT.what_moh_should_have },
    artist: MUA_SELECTION_GUIDE.universalCriteria,
    communityNotes: communityNotes(cid, time),
  };
}

export function bridalOptions() {
  return {
    communities: LIBRARY_COMMUNITIES.map(x => ({ id: x.id, label: x.label })), fitzpatrick: FITZPATRICK,
    time: TIME_LEFT.map(({ id, label }) => ({ id, label })), hairTypes: HAIR_TYPES, styles: STYLES.map(({ id, label, kind }) => ({ id, label, kind })), tones: MONK_TONES,
  };
}
