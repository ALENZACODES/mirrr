/**
 * Grooming Studio: a shave or beard plan from your own beard. You pick your beard texture, the look you
 * want, your razor or trimmer, which way you shave, the skin problem you have and a scent for beard oil;
 * the studio scores your razor-bump risk, builds the shave and beard routine from the audited beard and
 * men's grooming guides (src/beard_grooming_ethnic.js, src/mens_grooming_ethnic_guide.js,
 * wire/ops-b21-*.mjs) and lays out the week.
 *
 * Beard texture is the reader's own pick and is never assigned by community. A heritage is optional and
 * only adds traditions, rituals and barbershop styles. The tone only changes the picture.
 */
import { BEARD_BIOLOGY, BEARD_SKIN_CARE, BEARD_OIL_GUIDE, BEARD_BALM_BUTTER, SHAVING_GUIDE, BEARD_STYLES, BEARD_GROWTH_SUPPORT, getEthnicBeardCulture } from '../beard_grooming_ethnic.js';
import { UNIVERSAL_MENS_GROOMING, getMensGroomingGuide } from '../mens_grooming_ethnic_guide.js';
import { MONK_TONES } from '../skin/clinic.js';
import { LIBRARY_COMMUNITIES, canonicalCommunity } from '../library/communities.js';

const pick = (v, list, d) => (list.some(x => x.id === String(v)) ? String(v) : d);

export const TEXTURES = [
  { id: 'straight', label: 'Straight', bio: 'straight', risk: 1 },
  { id: 'wavy', label: 'Wavy', bio: 'wavy', risk: 3 },
  { id: 'coily', label: 'Curly or coily', bio: 'coily_curly', risk: 6 },
];
export const GOALS = [
  { id: 'clean_shave', label: 'Clean shave', shaves: true, risk: 1 },
  { id: 'short_stubble', label: BEARD_STYLES.short_stubble.style, shaves: false, risk: -2 },
  { id: 'medium_stubble', label: BEARD_STYLES.medium_stubble.style, shaves: false, risk: -2 },
  { id: 'short_box_beard', label: BEARD_STYLES.short_box_beard.style, shaves: false, risk: -1 },
  { id: 'full_beard', label: BEARD_STYLES.full_beard.style, shaves: false, risk: -2 },
  { id: 'bald_with_beard', label: 'Shaved head with a full beard', shaves: true, risk: 0 },
  { id: 'moustache_only', label: 'Moustache only', shaves: true, risk: 0 },
  { id: 'uncut', label: 'Uncut or faith beard (kesh, sunnah)', shaves: false, risk: -4 },
];
export const TOOLS = [
  { id: 'single_blade', label: 'Single-blade safety razor', risk: 0 },
  { id: 'multi_blade', label: 'Multi-blade cartridge razor', risk: 2 },
  { id: 'electric', label: 'Electric shaver', risk: 0 },
  { id: 'clipper', label: 'Clipper or trimmer with a guard', risk: -1 },
];
export const DIRECTIONS = [
  { id: 'with', label: 'With the grain', risk: 0 },
  { id: 'against', label: 'Against the grain', risk: 2 },
];
export const PROBLEMS = [
  { id: 'none', label: 'No problems' },
  { id: 'bumps', label: 'Razor bumps or ingrown hairs' },
  { id: 'burn', label: 'Razor burn or stinging' },
  { id: 'flakes', label: 'Flakes under the beard' },
  { id: 'dark_marks', label: 'Dark marks on the neck or jaw' },
  { id: 'dry', label: 'Dry, itchy skin under the beard' },
];
export const SCENTS = [
  { id: 'none', label: 'Unscented' },
  { id: 'cedarwood', label: 'Cedarwood' },
  { id: 'sandalwood', label: 'Sandalwood' },
  { id: 'tea_tree', label: 'Tea tree' },
  { id: 'peppermint', label: 'Peppermint' },
];
export const HERITAGES = [{ id: 'none', label: 'No heritage' }, ...LIBRARY_COMMUNITIES.map(c => ({ id: c.id, label: c.label }))];
const DEFAULTS = { texture: 'wavy', goal: 'short_box_beard', tool: 'single_blade', direction: 'with', problem: 'bumps', scent: 'none', heritage: 'none', tone: 'mst7' };

export function groomOptions() {
  const strip = ({ risk, bio, shaves, ...r }) => r;
  return { textures: TEXTURES.map(strip), goals: GOALS.map(strip), tools: TOOLS.map(strip), directions: DIRECTIONS.map(strip), problems: PROBLEMS, scents: SCENTS, heritages: HERITAGES, tones: MONK_TONES.map(t => ({ id: t.id, label: t.label, hex: t.hex })) };
}

/** Razor-bump risk 0-10 with the reasons that moved it. */
export function bumpRisk({ texture, goal, tool, direction, problem }) {
  const T = TEXTURES.find(x => x.id === texture); const Gl = GOALS.find(x => x.id === goal);
  const To = TOOLS.find(x => x.id === tool); const D = DIRECTIONS.find(x => x.id === direction);
  const parts = [
    { why: `${T.label} beard hair`, add: T.risk },
    { why: Gl.shaves ? `${Gl.label} means shaving close` : `${Gl.label} means less close shaving`, add: Gl.risk },
    { why: To.label, add: To.risk },
    { why: `Shaving ${D.label.toLowerCase()}`, add: Gl.shaves || goal === 'short_box_beard' ? D.risk : 0 },
    { why: problem === 'bumps' ? 'You already get bumps' : 'No bumps now', add: problem === 'bumps' ? 1 : 0 },
  ];
  const score = Math.max(0, Math.min(10, parts.reduce((a, p) => a + p.add, 0)));
  return { score, level: score >= 6 ? 'high' : score >= 3 ? 'medium' : 'low', parts: parts.filter(p => p.add !== 0) };
}

function oilBlend(texture, problem, scent) {
  const carriers = texture === 'coily' ? ['jojoba', 'shea'] : texture === 'wavy' ? ['jojoba', 'argan'] : ['jojoba', 'sweet_almond'];
  if (problem === 'dry' && !carriers.includes('castor')) carriers.push('castor');
  const C = BEARD_OIL_GUIDE.carrier_oils;
  const ml = carriers.length === 3 ? [15, 10, 5] : [20, 10];
  const eo = scent === 'none' ? null : { name: SCENTS.find(s => s.id === scent).label, drops: scent === 'peppermint' || scent === 'tea_tree' ? 2 : 3, note: BEARD_OIL_GUIDE.essential_oils[scent] };
  return {
    carriers: carriers.map((k, i) => ({ id: k, oil: C[k].oil, ml: ml[i], why: C[k].why })),
    essential: eo,
    dilution: BEARD_OIL_GUIDE.essential_oils.dilution,
    howTo: Object.entries(BEARD_OIL_GUIDE.how_to_apply).filter(([k]) => k.startsWith('step')).map(([, v]) => v),
    caution: eo ? BEARD_OIL_GUIDE.essential_oils.note : 'Unscented: nothing to dilute, and the gentlest choice for sensitive skin.',
  };
}

export function buildGroomPlan(input = {}) {
  input = input ?? {};
  const c = {
    texture: pick(input.texture, TEXTURES, DEFAULTS.texture),
    goal: pick(input.goal, GOALS, DEFAULTS.goal),
    tool: pick(input.tool, TOOLS, DEFAULTS.tool),
    direction: pick(input.direction, DIRECTIONS, DEFAULTS.direction),
    problem: pick(input.problem, PROBLEMS, DEFAULTS.problem),
    scent: pick(input.scent, SCENTS, DEFAULTS.scent),
    heritage: pick(canonicalCommunity(input.heritage) ?? input.heritage, HERITAGES, DEFAULTS.heritage),
    tone: pick(input.tone, MONK_TONES, DEFAULTS.tone),
  };
  const T = TEXTURES.find(x => x.id === c.texture); const Gl = GOALS.find(x => x.id === c.goal);
  const risk = bumpRisk(c);
  const warnings = [];

  // Shaving: the whole face for a clean shave, the edges and lines for everything else except an uncut beard.
  const shaving = c.goal === 'uncut' ? null : {
    area: Gl.shaves ? (c.goal === 'clean_shave' ? 'the whole beard area' : c.goal === 'bald_with_beard' ? 'your head, plus the beard edges' : 'everything but the moustache') : 'the cheek line and neckline only',
    prep: [SHAVING_GUIDE.preparation.warm_water, SHAVING_GUIDE.preparation.pre_shave_oil],
    lather: c.goal === 'clean_shave' ? SHAVING_GUIDE.shave_cream_gel.cream : SHAVING_GUIDE.shave_cream_gel.gel,
    tool: SHAVING_GUIDE.razors[c.tool] ? { ...SHAVING_GUIDE.razors[c.tool] } : { type: TOOLS.find(t => t.id === 'clipper').label, how: UNIVERSAL_MENS_GROOMING.shavinGGuide.forTightlyCoiledHair.find(s => /clipper/i.test(s)) },
    technique: [SHAVING_GUIDE.technique.direction, SHAVING_GUIDE.technique.pressure, SHAVING_GUIDE.technique.rinse, SHAVING_GUIDE.technique.finish],
    after: c.problem === 'bumps' || risk.level !== 'low' ? [SHAVING_GUIDE.aftershave.balm, SHAVING_GUIDE.aftershave.bha] : [SHAVING_GUIDE.aftershave.balm],
  };
  if (shaving && c.direction === 'against' && c.texture !== 'straight') warnings.push(`Against the grain on ${T.label.toLowerCase()} hair is the biggest single cause of razor bumps. Switch to with the grain.`);
  if (shaving && c.tool === 'multi_blade' && c.texture === 'coily') warnings.push(SHAVING_GUIDE.razors.multi_blade.note + ' ' + SHAVING_GUIDE.razors.multi_blade.mitigation);
  if (c.goal === 'bald_with_beard') warnings.push(BEARD_STYLES.bald_with_beard.care);

  // Beard care for the look you want.
  const style = BEARD_STYLES[c.goal] ?? null;
  const product = c.goal === 'moustache_only' ? { name: 'Beard wax', ...BEARD_BALM_BUTTER.beard_wax } : c.texture === 'coily' || c.problem === 'dry' ? { name: 'Beard butter', ...BEARD_BALM_BUTTER.beard_butter } : c.goal === 'clean_shave' ? null : { name: 'Beard balm', ...BEARD_BALM_BUTTER.beard_balm };
  const beard = c.goal === 'clean_shave' ? null : {
    style: style ? { label: style.style, tools: style.tools ?? '', maintenance: style.maintenance ?? style.care ?? '', shaping: style.shaping ?? '', note: style.note ?? style.suits ?? '' } : { label: Gl.label, tools: 'A wide-tooth comb and scissors for stray hairs only.', maintenance: 'Wash, oil and comb; no trimming.', shaping: '', note: getMensGroomingGuide('south-asian')?.beardCare?.sikhBeardTradition?.religioussignificance ?? '' },
    wash: BEARD_SKIN_CARE.cleansing.how,
    oil: oilBlend(c.texture, c.problem, c.scent),
    product,
    itch: BEARD_SKIN_CARE.moisturising.under_beard_itch,
    spf: BEARD_SKIN_CARE.spf,
  };

  // The problem you have.
  const PROBLEM = {
    none: { title: 'Keep it that way', steps: UNIVERSAL_MENS_GROOMING.shavinGGuide.universalBestPractices },
    bumps: { title: 'Razor bumps', steps: [BEARD_BIOLOGY.ingrown_hairs.what, BEARD_BIOLOGY.ingrown_hairs.treatment, ...(getMensGroomingGuide('west-african')?.razorBumpGuide?.treatment ?? [])] },
    burn: { title: 'Razor burn', steps: [SHAVING_GUIDE.technique.pressure, SHAVING_GUIDE.shave_cream_gel.note, SHAVING_GUIDE.aftershave.alcohol_based, SHAVING_GUIDE.aftershave.balm] },
    flakes: { title: 'Flakes under the beard', steps: [BEARD_SKIN_CARE.cleansing.why, BEARD_SKIN_CARE.cleansing.beardruff] },
    dark_marks: { title: 'Dark marks', steps: [BEARD_BIOLOGY.ingrown_hairs.what, ...(getMensGroomingGuide('black-american')?.razorBumpProtocol?.treatment ?? []).filter(s => /azelaic|niacinamide|doctor/i.test(s)), 'Daily sunscreen on the neck and jaw stops marks darkening.'] },
    dry: { title: 'Dry, itchy skin', steps: [BEARD_SKIN_CARE.moisturising.why, BEARD_SKIN_CARE.moisturising.how, BEARD_SKIN_CARE.moisturising.under_beard_itch] },
  }[c.problem];

  // The week: shave or edge days spaced by risk, beard wash days, exfoliation for bumps, oil daily.
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const gap = c.goal === 'uncut' ? 0 : Gl.shaves ? (risk.level === 'high' ? 3 : risk.level === 'medium' ? 2 : 1) : (c.goal.includes('stubble') ? 3 : 7);
  const shaveDays = gap ? DAYS.map((_, i) => i).filter(i => i % gap === 0) : [];
  const washDays = c.goal === 'clean_shave' ? [] : [0, 2, 4];
  const exfoliate = c.problem === 'bumps' || risk.level === 'high' ? [1, 3, 5] : [];
  const week = DAYS.map((d, i) => ({
    day: d,
    shave: shaveDays.includes(i) ? (Gl.shaves ? 'shave' : c.goal.includes('stubble') ? 'trim' : 'edge-up') : null,
    wash: washDays.includes(i),
    exfoliate: exfoliate.includes(i),
    oil: Boolean(beard),
  }));
  const barber = c.goal === 'clean_shave' ? null : c.goal === 'uncut' ? 'No barber needed; comb daily.' : 'Shape and line at the barbershop every 2-3 weeks.';

  // Heritage: traditions and rituals only.
  let heritage = null;
  if (c.heritage !== 'none') {
    const g = getMensGroomingGuide(c.heritage.replace(/_/g, '-'));
    const b = getEthnicBeardCulture(c.heritage);
    const styles = g?.barbershopCulture?.popularStyles ?? g?.beardCare?.theBarber?.popularStyles ?? g?.southAfricanBarbershopScene?.popularStyles ?? g?.somaliBarbershopCulture?.popularStyles ?? g?.hairStylingGuide?.styles ?? [];
    heritage = {
      id: c.heritage, label: HERITAGES.find(h => h.id === c.heritage).label,
      philosophy: g?.groomingPhilosophy ?? '',
      rituals: (g?.traditionalPractices ?? []).map(p => ({ name: p.name, text: p.description, how: p.application ?? p.method ?? p.how ?? p.technique ?? p.recipe ?? p.usage ?? p.ratio ?? '' })),
      beardTradition: Array.isArray(b) ? '' : b?.traditions ?? '',
      careTips: Array.isArray(b) ? '' : typeof b?.care_tips === 'string' ? b.care_tips : Object.values(b?.care_tips ?? {}).join(' '),
      styles,
      faith: g?.arabBeardTradition?.islamicContext ?? g?.beardCare?.sikhBeardTradition?.religioussignificance ?? '',
    };
  }

  const tone = MONK_TONES.find(t => t.id === c.tone);
  return {
    choices: c,
    texture: { id: T.id, label: T.label, about: BEARD_BIOLOGY.texture[T.bio] },
    goal: { id: Gl.id, label: Gl.label },
    risk, shaving, beard, problem: PROBLEM, week, barber, warnings, heritage,
    growth: c.goal === 'full_beard' || c.goal === 'uncut' || c.goal === 'short_box_beard' ? { expect: BEARD_GROWTH_SUPPORT.realistic_expectations, myth: BEARD_GROWTH_SUPPORT.what_doesnt_work, minoxidil: BEARD_GROWTH_SUPPORT.minoxidil.caution } : null,
    tone: { id: tone.id, label: tone.label, hex: tone.hex },
    picture: { skin: tone.hex, goal: c.goal, texture: c.texture, risk: risk.score, problem: c.problem, tool: c.tool, scent: c.scent, oil: Boolean(beard) },
    message: `${T.label} hair, ${Gl.label.toLowerCase()}: razor-bump risk ${risk.level} (${risk.score}/10).`,
  };
}

/** Rituals and beard styles that mention a word, across every community's grooming guide. */
export function searchGroom(q) {
  const query = String(q ?? '').trim().slice(0, 40);
  if (query.length < 3) return { query, results: [] };
  const w = query.toLowerCase();
  const results = [];
  for (const h of LIBRARY_COMMUNITIES) {
    const g = getMensGroomingGuide(h.id.replace(/_/g, '-'));
    for (const p of g?.traditionalPractices ?? []) if (`${p.name} ${p.description}`.toLowerCase().includes(w)) results.push({ kind: 'ritual', community: h.label, name: p.name, text: p.description });
  }
  for (const [id, s] of Object.entries(BEARD_STYLES)) if (`${s.style} ${s.note ?? ''} ${s.types ?? ''}`.toLowerCase().includes(w)) results.push({ kind: 'style', community: 'Everyone', name: s.style, text: s.note ?? s.suits ?? s.shaping ?? s.types ?? '', id });
  return { query, results: results.slice(0, 12) };
}
