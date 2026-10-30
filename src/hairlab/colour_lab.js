/**
 * Hair Colour Lab: plans a hair colour change for a person's texture, porosity, starting level,
 * chemical history and community, and says honestly what it takes to get there.
 *
 * The guidance text comes from the wired hair guides (hair_colouring_guide, balayage_engine,
 * hair_colour_guide_ethnic, hair_color_ethnic_guide, hair_porosity_guide, hair_damage_guide,
 * hair_care_routines_by_type, protective_styles_extended, wig_guide_ethnic, hair_painter).
 * This module does the arithmetic between them: how light the target colour is, which
 * underlying pigment stage it needs, how many levels of lift that is from the person's start,
 * how many sessions the guides' per-session ceiling implies, which technique fits the
 * texture, and which warnings apply. Nothing here looks at a photo.
 */
import { HAIR_COLOURS, HAIR_TEXTURES } from '../hair_painter.js';
import { TECHNIQUES } from '../balayage_engine.js';
import { BLEACHING_GUIDE, VIVID_COLOURS, TONING_GUIDE, COLOUR_CARE, COLOUR_OPTIONS_DARK_HAIR, ETHNIC_COLOUR_TRADITIONS } from '../hair_colouring_guide.js';
import { HAIR_COLOUR_TYPES, ETHNIC_HAIR_COLOUR_GUIDES, BLEACHING_SCIENCE } from '../hair_colour_guide_ethnic.js';
import { getHairColorGuide } from '../hair_color_ethnic_guide.js';
import { LOW_POROSITY_GUIDE, HIGH_POROSITY_GUIDE, getEthnicPorosityGuide } from '../hair_porosity_guide.js';
import { getHairRoutineByType } from '../hair_care_routines_by_type.js';
import { getRecoveryProtocol } from '../hair_damage_guide.js';
import { getStylesForHairTexture } from '../protective_styles_extended.js';
import { getWigCareGuide } from '../wig_guide_ethnic.js';
import { LIBRARY_COMMUNITIES, resolveCommunity } from '../library/communities.js';

const kebab = id => (id ? id.replace(/_/g, '-') : null);

// ---- Inputs -------------------------------------------------------------------------------

/** The standard 1-10 colour level scale, limited to the starting points a dark-haired person has. */
export const START_LEVELS = [
  { level: 1, label: 'Black (level 1)', hex: '#0b0908' },
  { level: 2, label: 'Darkest brown (level 2)', hex: '#1d130e' },
  { level: 3, label: 'Dark brown (level 3)', hex: '#2f1f16' },
  { level: 4, label: 'Medium brown (level 4)', hex: '#45301f' },
  { level: 5, label: 'Light brown (level 5)', hex: '#5f432b' },
  { level: 6, label: 'Dark blonde (level 6)', hex: '#7c5d3b' },
];

export const TEXTURES = Object.values(HAIR_TEXTURES)
  .filter(t => /^type_\d[abc]$/.test(t.id))
  .map(t => ({ id: t.id, code: t.id.slice(5).toUpperCase(), label: t.label, curl: t.curl_pattern }));

export const POROSITIES = ['low', 'medium', 'high'];

export const HISTORIES = [
  { id: 'virgin', label: 'Never coloured or relaxed' },
  { id: 'coloured', label: 'Dyed before (no bleach)' },
  { id: 'lightened', label: 'Bleached or lightened before' },
  { id: 'relaxed', label: 'Relaxed or permed' },
  { id: 'henna', label: 'Henna in the hair' },
];

/** hair_painter also lists texture swatches (4C, locs, braid hair, lace) as "colours"; those are not targets. */
const NOT_TARGETS = new Set(['natural_4c', 'locs_brown', 'braids_black', 'wig_lace_brown']);
export const TARGETS = Object.values(HAIR_COLOURS).filter(c => !NOT_TARGETS.has(c.id));

// ---- Colour arithmetic ---------------------------------------------------------------------

/** sRGB hex -> CIELAB (D65). */
export function hexToLab(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex ?? ''));
  if (!m) return null;
  const lin = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16) / 255).map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const [r, g, b] = lin;
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = t => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const L = 116 * f(y) - 16; const A = 500 * (f(x) - f(y)); const B = 200 * (f(y) - f(z));
  const C = Math.hypot(A, B); let h = Math.atan2(B, A) * 180 / Math.PI; if (h < 0) h += 360;
  return { L, a: A, b: B, C, h };
}

/** Approximate colour level (1 black to 10 lightest blonde) from lightness. */
export function levelForHex(hex) {
  const lab = hexToLab(hex);
  if (!lab) return null;
  return Math.max(1, Math.min(10, Math.round(1 + lab.L / (95 / 9))));
}

/**
 * The guide's six underlying-pigment stages, each paired with the level it corresponds to on the
 * standard level chart and a swatch of that pigment so the Lab can show what hair looks like
 * part-way through lightening.
 */
const STAGE_LEVEL = [4, 5, 7, 8, 9, 10];
const STAGE_SWATCH = ['#6e2a14', '#a4501c', '#c7832e', '#dcb04a', '#ead79a', '#f1ead2'];
export const STAGES = VIVID_COLOURS.colour_results_by_lift_level.map((s, i) => ({
  stage: i, underlying: s.underlying, achievable: s.achievable, level: STAGE_LEVEL[i], swatch: STAGE_SWATCH[i],
}));

/**
 * Which pigment stage a target needs, from its hue, chroma and lightness. Dark neutral
 * colours need no stage: they can be deposited, or lifted to their own level.
 */
export function colourFamily(hex) {
  const { L, a, b, C, h } = hexToLab(hex);
  if ((L >= 78 && C < 30) || (C < 6 && L >= 58)) return { family: 'pastel-or-silver', stage: 5 };
  if (C < 14 && L >= 58) return { family: 'cool-blonde', stage: 4 };
  if (C < 22 && L < 58) return { family: 'natural-brown', stage: null };
  const reddish = h < 45 || h >= 345;
  const pink = reddish && b < 0.35 * a && L >= 40;
  if (reddish && !pink && L < 50) return { family: 'red', stage: C < 60 ? 0 : 1 };
  if (pink) return { family: 'vivid', stage: 4 };
  if (h < 68 && L < 62) return { family: 'copper', stage: 1 };
  if (h < 105 && L < 68) return { family: 'golden', stage: 2 };
  if (h < 105) return { family: 'golden', stage: 3 };
  return { family: 'vivid', stage: 4 };
}

/** Developer volumes and lifts, parsed from the bleaching guide's table. */
const VOLUMES = BLEACHING_GUIDE.developer_strengths.volumes.map(v => {
  const n = v.lifts.match(/\d+/g).map(Number);
  return { ...v, maxLift: Math.max(...n) };
});
/** The type-4 reality check sets a per-session ceiling ("Target 2-3 levels of lift per session maximum"). */
const SESSION_LINE = BLEACHING_GUIDE.bleach_on_type_4_reality_check.approach.find(a => /per session/i.test(a));
const SESSION_CEILING = Math.max(...(SESSION_LINE?.match(/\d+/g) ?? ['3']).map(Number));
const GAP_LINE = BLEACHING_GUIDE.bleach_on_type_4_reality_check.approach.find(a => /between bleach sessions/i.test(a));

// ---- Techniques ----------------------------------------------------------------------------

const PATTERN = { balayage: 'painted', highlight: 'foils', ombre: 'gradient', full_colour: 'full', traditional: 'full', natural: 'full', toning: 'full', sombre: 'gradient', gloss: 'full' };

function techniquePattern(t) {
  if (t.id === 'face_framing_highlights') return 'face';
  return PATTERN[t.category] ?? 'full';
}

const fitsTexture = (t, code) => (t.suitableFor?.hairTypes ?? []).some(x => x === 'all' || x === code);
const forCommunity = (t, c) => (t.communities ?? []).includes('all') || (c && t.communities.includes(c));

/** Recommend a technique, with the reason, given what the colour change needs. */
export function recommendTechnique({ textureCode, community, family, lift, targetId }) {
  const curlClass = Number(textureCode[0]);
  const pick = (id, why) => ({ id, why });
  if (targetId === 'henna_red' || targetId === 'mehndi_orange') return pick('henna_colour', 'A henna red is made with henna itself: no lift and no developer.');
  if (targetId === 'indigo_blue') return pick('indigo_hair_black', 'Indigo is applied after a henna step to take hair towards blue-black.');
  if (lift === 0) {
    if (family === 'red' && curlClass >= 3) return pick('burgundy_full_colour', 'A red or burgundy that needs no lift can go on root to tip as a single process.');
    return pick('all_over', 'This colour is no lighter than your start, so it can be deposited all over with no bleach.');
  }
  if (curlClass === 4 && lift >= 4) return pick('face_framing_highlights', 'The bleaching guide advises starting Type 4 hair with face-framing pieces rather than full-head bleach.');
  if (family === 'red' && ['caribbean', 'latina', 'black-american'].includes(community) && curlClass >= 3) return pick('red_ombre_caribbean', 'A dark-root-to-red fade is a Caribbean and Latina favourite and suits curly and coily hair.');
  if (curlClass >= 3) return pick('melanin_balayage', 'Melanin balayage is painted for curly and coily hair, with lift kept to face-framing and scattered pieces.');
  return pick('classic_balayage', 'Hand-painted balayage grows out softly on straight and wavy hair.');
}

const ALL_OVER = {
  id: 'all_over', name: 'All-over colour', category: 'full_colour',
  description: 'One colour applied from root to tip.',
  technique: { placement: 'Root to tip', applicationMethod: 'Brush or applicator bottle, in small sections' },
  maintenance: { refreshInterval: 'Roots as they grow' },
};
const techniqueById = id => (id === 'all_over' ? ALL_OVER : TECHNIQUES[id] ?? null);

export const TECHNIQUE_OPTIONS = [ALL_OVER, ...Object.values(TECHNIQUES)].map(t => ({ id: t.id, label: t.name, category: t.category }));

// ---- Plan -----------------------------------------------------------------------------------

const clampChoice = (v, list, dflt) => (list.includes(v) ? v : dflt);

const COLOUR_TYPE_FOR = family => (family === 'vivid' || family === 'pastel-or-silver' ? 'directDye' : 'permanent');
const isFashion = family => family === 'vivid' || family === 'pastel-or-silver';

function warningsFor({ history, curlClass, porosity, lift, family }) {
  const out = [];
  const add = (why, text) => text && out.push({ why, text: String(text) });
  if (history === 'relaxed') {
    add('Relaxed hair', getHairColorGuide('black-american')?.coloringChallenges?.find(s => /relaxed/i.test(s)) ?? BLEACHING_GUIDE.risk_assessment.high_risk_characteristics.find(s => /relaxed/i.test(s)));
    add('Relaxed hair', getHairColorGuide('west-african')?.chemicalColorGuide?.ifYouMustBleach?.find(s => /relax/i.test(s)));
  }
  if (history === 'henna') {
    add('Henna in the hair', ETHNIC_HAIR_COLOUR_GUIDES['south-asian']?.henna?.chemicalBlocking);
  }
  if (history === 'lightened' && lift > 0) add('Bleached before', BLEACHING_GUIDE.application_tips.never_overlap);
  if (history === 'coloured') {
    add('Dyed before', lift > 0 ? BLEACHING_SCIENCE.lightbulbEffect : 'Dye cannot lift dye: going lighter than your current dyed colour needs a colour remover or lightener, not another box of colour. Going darker or changing tone works.');
  }
  if (curlClass === 4 && lift > 0) {
    add('Type 4 hair', BLEACHING_GUIDE.application_tips.processing_time);
    add('Type 4 hair', BLEACHING_GUIDE.bleach_on_type_4_reality_check.reality.replace(/ Professionals.*$/, ''));
  }
  if (porosity === 'high') add('High porosity', HIGH_POROSITY_GUIDE.challenges.mainChallenge);
  if (porosity === 'low') add('Low porosity', LOW_POROSITY_GUIDE.challenges.mainChallenge);
  if (isFashion(family)) add(family === 'vivid' ? 'Vivid colour' : 'Very light colour', VIVID_COLOURS.the_truth);
  if (lift > 0) add('Before any bleach', BLEACHING_GUIDE.bleach_on_type_4_reality_check.when_to_walk_away);
  return out;
}

export function buildColourPlan(input = {}) {
  const community = resolveCommunity(input.community);
  const c = kebab(community.id);
  const texture = TEXTURES.find(t => t.id === input.texture) ?? TEXTURES.find(t => t.id === 'type_4a');
  const curlClass = Number(texture.code[0]);
  const porosity = clampChoice(input.porosity, POROSITIES, 'medium');
  const history = clampChoice(input.history, HISTORIES.map(h => h.id), 'virgin');
  const start = START_LEVELS.find(s => s.level === Number(input.startLevel)) ?? START_LEVELS[1];
  const target = HAIR_COLOURS[input.target] && !NOT_TARGETS.has(input.target) ? HAIR_COLOURS[input.target] : HAIR_COLOURS.honey_blonde;

  // How light the target is, and which pigment stage it needs.
  const fam = colourFamily(target.hexCode);
  const ownLevel = levelForHex(target.hexCode);
  const needLevel = fam.stage == null ? ownLevel : STAGES[fam.stage].level;
  const chemicalLift = Math.max(0, needLevel - start.level);

  // Technique. A plant dye (henna, indigo, rooibos, amla) deposits colour without lifting, so
  // choosing one takes bleach out of the plan entirely.
  const rec = recommendTechnique({ textureCode: texture.code, community: c, family: fam.family, lift: chemicalLift, targetId: target.id });
  const chosenId = input.technique && techniqueById(input.technique) ? input.technique : rec.id;
  const tech = techniqueById(chosenId);
  const techFit = chosenId === 'all_over' ? true : fitsTexture(tech, texture.code);
  const plantDye = !!tech.naturalDye;
  const lift = plantDye ? 0 : chemicalLift;
  const sessions = lift === 0 ? 0 : Math.ceil(lift / SESSION_CEILING);

  // Developer: Type 4 follows the guide's 20 Vol advice; otherwise the lowest volume that covers
  // the per-session lift, never the guide's 40 Vol "high damage risk" option.
  const perSession = Math.min(lift, SESSION_CEILING);
  const developer = lift === 0 ? null : curlClass === 4
    ? { ...VOLUMES.find(v => v.volume.startsWith('20')), note: BLEACHING_GUIDE.developer_strengths.for_type_4 }
    : { ...(VOLUMES.filter(v => !v.volume.startsWith('40')).find(v => v.maxLift >= perSession) ?? VOLUMES.find(v => v.volume.startsWith('30'))) };

  // Path through the pigment stages, session by session, for the preview.
  const path = [];
  for (let s = 1, level = start.level; s <= sessions; s++) {
    level = Math.min(needLevel, level + SESSION_CEILING);
    const stage = STAGES.find(st => st.level >= level) ?? STAGES[STAGES.length - 1];
    path.push({ session: s, level, underlying: stage.underlying, swatch: stage.swatch });
  }

  const colourType = plantDye ? null : lift === 0 ? (fam.family === 'natural-brown' ? 'demiPermanent' : 'semi') : COLOUR_TYPE_FOR(fam.family);
  const steps = [];
  if (lift > 0) {
    steps.push(`Strand test first: lighten a hidden section with ${developer.volume} and check the hair is still strong.`);
    if (sessions > 1) steps.push(`Lift ${lift} levels over ${sessions} sessions, at most ${SESSION_CEILING} levels each. ${GAP_LINE ?? ''}`.trim());
    else steps.push(`Lift ${lift} level${lift > 1 ? 's' : ''} in one session.`);
    steps.push(BLEACHING_GUIDE.application_tips.starts_at_ends);
    steps.push(TONING_GUIDE.what);
  }
  if (plantDye) {
    if (tech.ingredients) steps.push(`You need: ${[].concat(tech.ingredients).map(i => (typeof i === 'string' ? i : i.name ?? Object.values(i).join(' '))).join('; ')}.`);
    for (const k of ['preparation', 'applicationMethod', 'developTime', 'blending']) if (tech.technique?.[k]) steps.push(String(tech.technique[k]));
    if (chemicalLift > 0) steps.push(`${tech.name} deposits colour and cannot lighten, so on level ${start.level} hair it shows as a tint rather than ${target.label}.`);
  }
  if (tech?.technique?.placement) steps.push(`Placement (${tech.name}): ${tech.technique.placement}.`);
  const typeInfo = HAIR_COLOUR_TYPES[colourType];
  if (typeInfo) steps.push(`Colour: ${typeInfo.what ?? typeInfo.bestFor}`);

  const routine = getHairRoutineByType(texture.code.toLowerCase());
  const porosityGuide = porosity === 'low' ? LOW_POROSITY_GUIDE : porosity === 'high' ? HIGH_POROSITY_GUIDE : null;
  const community_ = getHairColorGuide(c);
  const porosityNotes = getEthnicPorosityGuide(c);
  // Styles written for this exact curl type first, then the rest of its family.
  const styles = getStylesForHairTexture(texture.code);
  const exact = styles.filter(st => st.hairTexturesBestFor?.includes(texture.code));
  const protective = [...exact, ...styles.filter(st => !exact.includes(st))].slice(0, 3).map(s => ({ name: s.name, installationTime: s.installationTime ?? null, longevity: s.longevity ?? null }));

  return {
    community: { id: community.id, label: community.label, substituted: community.substituted ?? false },
    choices: { texture: texture.id, porosity, history, startLevel: start.level, target: target.id, technique: chosenId },
    start: { level: start.level, label: start.label, hex: start.hex },
    target: { id: target.id, label: target.label, hex: target.hexCode, family: fam.family, level: needLevel, context: target.culturalContext ?? null },
    lift, sessions, path, plantDye, chemicalLift,
    sessionCeiling: SESSION_CEILING,
    stage: fam.stage == null ? null : STAGES[fam.stage],
    developer,
    technique: {
      id: chosenId, name: tech.name, description: tech.description ?? null, pattern: techniquePattern(tech),
      recommended: rec.id, why: chosenId === rec.id ? rec.why : null,
      fitsTexture: techFit,
      fitNote: techFit ? null : `${tech.name} is written for ${(tech.suitableFor?.hairTypes ?? []).join(', ')} hair, not ${texture.code}.`,
      maintenance: tech.maintenance ?? null, proOnly: tech.proOnly ?? null, warnings: tech.warnings ?? null, ingredients: tech.ingredients ?? null,
    },
    colourType: typeInfo ? { id: colourType, ...typeInfo } : null,
    steps,
    warnings: warningsFor({ history, curlClass, porosity, lift, family: fam.family }),
    withoutBleach: lift > 0 ? COLOUR_OPTIONS_DARK_HAIR.without_bleaching.options.map(o => ({ technique: o.technique, result: o.result })) : [],
    care: {
      texture: { label: texture.label, description: HAIR_TEXTURES[texture.id].description, tips: HAIR_TEXTURES[texture.id].care_tips ?? [] },
      routineTitle: routine?.title ?? null,
      principle: routine?.criticalPrinciple ?? routine?.characteristics ?? null,
      washFrequency: routine?.washFrequency ?? null,
      colour: COLOUR_CARE.colour_fading_prevention,
      porosity: porosityGuide ? { title: porosityGuide.title, best: porosityGuide.productGuidance.bestIngredients, technique: porosityGuide.productGuidance.keyTechnique ?? porosityGuide.productGuidance.LOCMethod } : null,
      recovery: lift > 0 ? getRecoveryProtocol('bleach_damage') : null,
      protective,
    },
    fade: { low: 'slower', medium: 'steady', high: 'faster' }[porosity],
    communityNotes: community_ ? {
      popular: community_.chemicalColorGuide?.popularColorChoices ?? [],
      traditions: (community_.traditionalColorPractices ?? []).map(t => t.name),
      porosity: porosityNotes ?? null,
    } : null,
    tryOnWig: lift >= 4 || history === 'relaxed'
      ? { why: lift >= 4 ? `${lift} levels of lift is a big change; a wig in ${target.label} lets you live with the colour first.` : 'Relaxed hair is fragile under bleach; a coloured wig gives the look without the risk.', care: getWigCareGuide('human')?.washing ?? null }
      : null,
  };
}

export function colourLabOptions() {
  const byCategory = {};
  for (const t of TARGETS) (byCategory[t.category] ??= []).push({ id: t.id, label: t.label, hex: t.hexCode });
  return {
    communities: LIBRARY_COMMUNITIES.map(x => ({ id: x.id, label: x.label })),
    textures: TEXTURES.map(t => ({ id: t.id, label: t.label })),
    porosities: POROSITIES,
    histories: HISTORIES,
    startLevels: START_LEVELS,
    targets: byCategory,
    techniques: TECHNIQUE_OPTIONS,
    traditions: Object.keys(ETHNIC_COLOUR_TRADITIONS ?? {}),
  };
}
