/**
 * Smile & Lip Care planner: a daily routine for your main concern, a traditional practice judged
 * against that concern and the state of your teeth, and your community's oral care ritual.
 *
 * The concern picks what the routine adds; the practice says whether it targets that concern and
 * what to watch for; the teeth option (healthy, sensitive, bleeding gums) flags abrasive or acid
 * steps and when to see a dentist. Community adds its ritual and traditions only.
 */
import {
  CROSS_COMMUNITY_PRACTICES, ORAL_CONCERNS_MAP, ORAL_INGREDIENT_GLOSSARY,
  getOralBeautyGuide, getOralRitual, getPracticesByCommunity,
} from '../oral_beauty_ethnic_guide.js';
import { MONK_TONES } from '../skin/clinic.js';
import { LIBRARY_COMMUNITIES, resolveCommunity } from '../library/communities.js';

export const CONCERNS = Object.entries(ORAL_CONCERNS_MAP).map(([id, c]) => ({ id, label: c.label }));
export const PRACTICES = Object.entries(CROSS_COMMUNITY_PRACTICES).map(([id, p]) => ({ id, label: p.label }));
export const TEETH = [
  { id: 'healthy', label: 'No problems' }, { id: 'sensitive', label: 'Sensitive teeth' }, { id: 'bleeding', label: 'Gums bleed when I brush' },
];

/** Which concerns each practice works on, and how. */
const TARGETS = {
  chewingSticks: { gumHealth: 'cleans plaque along the gum line', whitening: 'polishes surface stains', halitosis: 'cleans away food and plaque' },
  oilPulling: { gumHealth: 'may reduce plaque a little', halitosis: 'loosens debris' },
  charcoalWhitening: { whitening: 'polishes surface stains only; it cannot change the colour of the tooth itself' },
  greenTea: { gumHealth: 'a tooth-friendly drink when unsweetened', halitosis: 'a gargle that freshens briefly' },
  tongueScraping: { halitosis: 'cleans the back of the tongue, where most breath odour starts' },
  saltWaterRinse: { gumHealth: 'soothes sore gums', toothache: 'eases soreness for a while' },
  naturalBreathFresheners: { halitosis: 'masks odour for a while', toothache: 'clove numbs briefly' },
  honeyOralCare: { lipCare: 'a sticky, soothing lip mask' },
};
/** The glossary entry behind a practice, for its safety note. */
const PRACTICE_INGREDIENT = { chewingSticks: 'miswak', oilPulling: 'coconutOil', greenTea: 'egcg', naturalBreathFresheners: 'clove' };
const ABRASIVE = /charcoal|ash|coffee grounds|baking soda|bicarbonate/i;
const ACID = /\blime\b|lemon/i;

/** Every day, whatever the concern (NHS and ADA guidance). */
const BASICS = [
  'Brush twice a day for two minutes with a fluoride toothpaste',
  'Spit after brushing, do not rinse, so the fluoride stays on your teeth',
  'Clean between your teeth once a day with floss or interdental brushes',
  'Keep sugary food and drinks to mealtimes',
  'See a dentist as often as they advise',
];
const CONCERN_STEPS = {
  whitening: ['Rinse with water after coffee, tea, red wine and other dark drinks', 'For a real change of shade, ask a dentist about professional whitening; only peroxide changes the colour inside the tooth'],
  halitosis: ['Clean your tongue every morning with a scraper or your toothbrush', 'Drink water through the day; a dry mouth smells more', 'If bad breath lasts despite good cleaning, see a dentist: gum disease is a common cause'],
  gumHealth: ['Angle the brush at the gum line and brush gently in small circles', 'Do not stop brushing where gums bleed; gentle, thorough cleaning helps them settle', 'See a dentist if the bleeding carries on'],
  lipCare: ['Use a lip balm with SPF 30 or more by day; sun darkens lips like skin', 'Seal moisture in at night with a plain balm, shea butter or petroleum jelly', 'Do not lick or pick dry lips'],
  toothache: ['See a dentist as soon as you can; home remedies only buy time', 'Take a pain reliever as the packet directs, and never put aspirin on the gum', 'Get urgent help for swelling in the face or jaw, a fever, or trouble swallowing or breathing'],
};
const TEETH_STEPS = {
  healthy: [],
  sensitive: ['Use a toothpaste for sensitive teeth (potassium nitrate or stannous fluoride) every day', 'Avoid abrasive powders and acid on teeth; marked steps below are not for you', 'Brush with a soft brush and light pressure'],
  bleeding: ['Bleeding gums are the first sign of gum disease: book a dentist or hygienist visit', 'Keep brushing and cleaning between teeth gently twice a day'],
};

const pick = (v, list, d) => (list.includes(v) ? v : d);
const dash = id => id.replace(/_/g, '-');

function practicePlan(practice, concern, teeth) {
  const p = CROSS_COMMUNITY_PRACTICES[practice];
  const target = TARGETS[practice][concern] ?? null;
  const warnings = [];
  if (practice === 'charcoalWhitening' && teeth !== 'healthy') warnings.push('Charcoal is abrasive: skip it with sensitive teeth or sore gums.');
  if (practice === 'charcoalWhitening') warnings.push('Choose a charcoal toothpaste with fluoride if you use one, and not every day.');
  if (practice === 'oilPulling') warnings.push('Spit the oil in the bin, not the sink, and brush as usual afterwards.');
  if (practice === 'honeyOralCare') warnings.push('Honey is sugar: keep it on the lips, not on teeth.');
  if (practice === 'naturalBreathFresheners' && concern === 'toothache') warnings.push('Clove oil can burn the gums: a drop on cotton, never neat, and only until you see a dentist.');
  if (concern === 'toothache' && practice !== 'saltWaterRinse' && practice !== 'naturalBreathFresheners') warnings.push('This does not help a toothache; see a dentist.');
  return {
    id: practice, label: p.label, targets: target, level: target ? 'good' : 'off', warnings,
    notes: p.clinicalNotes ?? null,
    ingredient: PRACTICE_INGREDIENT[practice] ? ORAL_INGREDIENT_GLOSSARY[PRACTICE_INGREDIENT[practice]].evidenceSummary : null,
    communities: p.communities.map(c => LIBRARY_COMMUNITIES.find(x => dash(x.id) === c)?.label ?? c),
  };
}

function ritualPlan(cid, teeth) {
  const r = getOralRitual(dash(cid));
  const flag = step => ({ step, caution: teeth === 'sensitive' && (ABRASIVE.test(step) || ACID.test(step)) ? 'Not with sensitive teeth' : (teeth === 'bleeding' && ABRASIVE.test(step) ? 'Wait until your gums have settled' : null) });
  return Object.fromEntries(Object.entries(r).map(([when, steps]) => [when, steps.map(flag)]));
}

/** Glossary ingredients that bear on each concern; none of them changes the colour of a tooth. */
const CONCERN_INGREDIENTS = {
  whitening: [], halitosis: ['miswak', 'clove', 'egcg'], gumHealth: ['miswak', 'neem', 'turmeric', 'rooibos', 'aloeVera', 'frankincense'],
  lipCare: ['coconutOil', 'aloeVera'], toothache: ['clove'],
};
function ingredientsFor(concern) {
  return CONCERN_INGREDIENTS[concern].map(id => {
    const g = ORAL_INGREDIENT_GLOSSARY[id];
    return { id, name: g.commonName, use: g.primaryUse, note: g.evidenceSummary };
  });
}

export function buildSmilePlan(input = {}) {
  const cid = resolveCommunity(input.community ?? 'west_african').id ?? 'west_african';
  const concern = pick(input.concern, CONCERNS.map(x => x.id), 'whitening');
  const practice = pick(input.practice, PRACTICES.map(x => x.id), 'chewingSticks');
  const teeth = pick(input.teeth, TEETH.map(x => x.id), 'healthy');
  const tone = MONK_TONES.find(t => t.id === input.tone) ?? MONK_TONES[6];
  const c = ORAL_CONCERNS_MAP[concern];
  const guide = getOralBeautyGuide(dash(cid));
  return {
    community: { id: cid, label: LIBRARY_COMMUNITIES.find(x => x.id === cid)?.label ?? cid },
    choices: { concern, practice, teeth, community: cid, tone: tone.id },
    tone,
    routine: { daily: BASICS, forConcern: CONCERN_STEPS[concern], forTeeth: TEETH_STEPS[teeth] },
    concern: { id: concern, label: c.label, note: c.clinicalNote ?? null, traditions: c.practices.map(x => ({ community: LIBRARY_COMMUNITIES.find(l => dash(l.id) === x.community)?.label ?? x.community, method: x.method })) },
    practice: practicePlan(practice, concern, teeth),
    compare: PRACTICES.map(p => ({ id: p.id, label: p.label, targets: TARGETS[p.id][concern] ?? null })),
    ingredients: ingredientsFor(concern),
    ritual: ritualPlan(cid, teeth),
    communityNotes: {
      overview: guide.overview,
      practices: getPracticesByCommunity(dash(cid)).map(p => p.label),
      sections: Object.values(guide.sections).map(s => ({ title: s.title, body: s.body })),
    },
  };
}

export function smileOptions() {
  return {
    communities: LIBRARY_COMMUNITIES.map(x => ({ id: x.id, label: x.label })),
    concerns: CONCERNS, practices: PRACTICES, teeth: TEETH, tones: MONK_TONES,
  };
}
