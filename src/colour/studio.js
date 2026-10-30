/**
 * Colour & Lip Studio: a palette and a lip look planned for your own colouring.
 *
 * Pick your Fitzpatrick type, undertone, a colour formula (harmony, pop or complement), a lip look,
 * finish and liner technique, a lip-care concern, your community and a skin tone for the picture.
 * The palette comes from the undertone guides; contrast and complement are computed against the
 * chosen skin tone. Lip shades come from the lip guides for your depth, filtered by what the guides
 * say your undertone should avoid. Undertone and depth are always the user's own choice; nothing is
 * inferred from a community, which only adds tradition notes and brands from that community.
 */
import { UNDERTONES as UNDERTONE_GUIDE, COLOUR_FORMULAS } from '../colour_theory_ethnic.js';
import { LIP_COLOUR_THEORY, LIP_COLOUR_BY_CULTURE, LIP_LINER_TECHNIQUES as LINER_CHOICE } from '../lip_colour_guide_extended.js';
import { LIP_FINISHES, LIP_LINER_TECHNIQUES, OMBRE_LIP_GUIDE, STATEMENT_LIP_LOOKS, LIP_COLOUR_BY_SKIN_TONE, ETHNIC_LIP_TRADITIONS } from '../lip_art_guide.js';
import { LIP_CARE_ROUTINE, LIP_HYPERPIGMENTATION } from '../lip_care_guide.js';
import { LIP_CARE_INGREDIENTS } from '../lip_health_ethnic_guide.js';
import { ETHNIC_LIP_CARE_GUIDES } from '../lip_care_ethnic_guide.js';
import { getEthnicBrandsForCommunity, getAllHallOfFameProducts } from '../makeup_products_db.js';
import { MONK_TONES, FITZPATRICK } from '../skin/clinic.js';
import { LIBRARY_COMMUNITIES, resolveCommunity } from '../library/communities.js';

export const UNDERTONES = [
  { id: 'warm', label: 'Warm (golden, peachy)' }, { id: 'cool', label: 'Cool (pink, red, bluish)' }, { id: 'neutral', label: 'Neutral' },
];
export const FORMULAS = Object.values(COLOUR_FORMULAS).map(f => ({ id: f.id.replace(/^the_|_formula$/g, ''), label: f.name }));
export const LOOKS = [
  { id: 'nude', label: 'Your nude' }, { id: 'classic_red', label: 'Classic red' }, { id: 'dark_lip', label: 'Dark lip' },
  { id: 'glossy_editorial', label: 'Glossy editorial' }, { id: 'ombre', label: 'Two-tone ombre' },
];
export const FINISHES = Object.entries(LIP_FINISHES).map(([id, f]) => ({ id, label: f.finish }));
export const LINERS = ['basic_liner', 'x_technique', 'overline', 'underline', 'ombre_liner', 'concealer_clean_up']
  .map(id => ({ id, label: LIP_LINER_TECHNIQUES[id].technique }));
export const CARE = [
  { id: 'daily', label: 'Everyday care', key: 'basicDailyRoutine' }, { id: 'dry', label: 'Dry or chapped', key: 'chappedLipRecovery' },
  { id: 'darkening', label: 'Darkening or uneven colour', key: 'hyperpigmentedLipRoutine' }, { id: 'ageing', label: 'Thinning or dehydrated', key: 'agedOrDehydratedLipRoutine' },
];

// ---- Depth: the lip guides key their advice by Fitzpatrick band, each with its own names -------
const THEORY_KEY = { I: 'I_II', II: 'I_II', III: 'III', IV: 'IV', V: 'V', VI: 'VI' };
const RED_KEY = { I: 'fair', II: 'fair', III: 'medium', IV: 'tan_olive', V: 'deep', VI: 'deep' };
const NUDE_KEY = { I: 'fair', II: 'light_medium', III: 'medium', IV: 'tan_olive', V: 'deep_medium', VI: 'deep' };
const TONE_KEY = { I: 'fair', II: 'light_medium', III: 'light_medium', IV: 'medium_tan', V: 'deep', VI: 'deep' };

/**
 * Colour words the guides use, longest first, with an illustrative hex for each.
 * These draw the swatches; they are not product shades.
 */
const NAMED = [
  ['dark chocolate', '#3b2016'], ['chocolate', '#5a3020'], ['blackberry', '#3a1530'], ['burnt sienna', '#a0522d'], ['burnt orange', '#cc5500'],
  ['brick red', '#9c3426'], ['brick brown', '#7a3d2b'], ['brick', '#a8432a'], ['toffee', '#9a5b2e'], ['coffee', '#4b2e20'], ['tomato', '#d4402b'], ['blue-red', '#b0213f'], ['blue-based red', '#b0213f'], ['blue-based', '#b0213f'], ['orange-red', '#d2401f'],
  ['warm red', '#c63a24'], ['cool red', '#b31e3b'], ['true red', '#c0202a'], ['classic red', '#c0202a'], ['balanced red', '#bf2630'],
  ['oxblood', '#5a1a1f'], ['burgundy', '#6b2430'], ['wine', '#62182f'], ['plum', '#6e2f55'], ['berry', '#8e2f5a'], ['raspberry', '#b3305f'],
  ['fuchsia', '#c8227a'], ['magenta', '#c2207f'], ['hot pink', '#e2508f'], ['cool pink', '#e38fb0'], ['nude-pink', '#d9a3a0'], ['pink', '#ef9aac'],
  ['dusty rose', '#c48b8b'], ['rose gold', '#d89c86'], ['rose', '#d9798a'], ['mauve', '#b07a8c'], ['lavender', '#c6a9d8'],
  ['caramel', '#b5733c'], ['mocha', '#7a4e36'], ['tawny', '#a5623a'], ['mahogany', '#6a2f22'], ['terracotta', '#c0603d'], ['copper', '#b8693a'],
  ['bronze', '#a8743a'], ['coral', '#f07c5f'], ['peach', '#f4ae86'], ['deep orange', '#d9581c'], ['orange', '#e8772e'], ['mustard', '#d1a23a'],
  ['gold', '#d9aa4c'], ['taupe', '#8d7b6d'], ['warm white', '#f5efe2'], ['silver', '#c0c0c8'], ['emerald', '#1f8a5b'], ['olive green', '#6b7a2e'],
  ['electric blue', '#1e5bff'], ['cobalt', '#1f4fbf'], ['navy', '#1d2a5b'], ['baby blue', '#a9cbe8'], ['dusty blue', '#7d97b5'], ['teal', '#127a7a'],
  ['warm brown', '#7b4a2c'], ['brown', '#6b4030'], ['bold red', '#c0202a'], ['very deep red', '#6e1414'], ['deep red', '#8b1a1a'],
  ['neon yellow', '#e6ff1a'], ['yellow', '#f1d24a'], ['mint', '#a8e6c8'], ['forest green', '#1f4d2b'], ['midnight green', '#0f3b2e'], ['green', '#2f8a4a'],
  ['lilac', '#c8a2c8'], ['purple', '#6a3d9a'], ['white', '#f7f7f2'], ['black', '#141414'],
];
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lum = h => hexRgb(h).reduce((t, v, i) => t + v * [0.2126, 0.7152, 0.0722][i], 0) / 255;
function hue(h) {
  const [r, g, b] = hexRgb(h).map(v => v / 255); const mx = Math.max(r, g, b); const d = mx - Math.min(r, g, b);
  if (!d) return 0;
  const x = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (x * 60 + 360) % 360;
}

/** Colour words named in a line, in reading order, each with its swatch. */
export function namedColours(text) {
  const t = String(text ?? '').toLowerCase(); const found = [];
  for (const [word, hex] of NAMED) {
    for (let at = t.indexOf(word); at >= 0; at = t.indexOf(word, at + 1)) {
      if (!found.some(f => at < f.at + f.word.length && f.at < at + word.length)) { found.push({ word, hex, at }); break; }
    }
  }
  return found.sort((a, b) => a.at - b.at).map(({ word, hex }) => ({ word, hex }));
}

const pick = (v, list, d) => (list.includes(v) ? v : d);
const deep = fitz => ['V', 'VI'].includes(fitz);
const dash = id => id.replace(/_/g, '-');
const text = v => (typeof v === 'string' ? v : Array.isArray(v) ? v.join('; ') : v && typeof v === 'object' ? Object.values(v).filter(x => typeof x === 'string').join(' ') : '');

/** The undertone guide row for this depth: deep warm and deep cool have their own palettes. */
function undertoneRow(undertone, fitz) {
  return UNDERTONE_GUIDE[deep(fitz) && undertone !== 'neutral' ? `deep_${undertone}` : undertone];
}

/** Palette for the chosen formula: harmony is your own palette; pop and complement are computed against your skin. */
export function palette(formula, undertone, fitz, skinHex) {
  const row = undertoneRow(undertone, fitz);
  const f = COLOUR_FORMULAS[`the_${formula}_formula`];
  const avoid = namedColours(row.avoidColours.join(' ')).map(c => c.word);
  const own = namedColours(row.colourPalette.join(', '));
  const pool = [...new Map(Object.values(UNDERTONE_GUIDE).flatMap(u => namedColours(u.colourPalette.join(', '))).map(c => [c.word, c])).values()]
    .filter(c => !avoid.includes(c.word));
  let colours;
  if (formula === 'harmony') colours = own;
  else if (formula === 'pop') colours = [...pool].sort((a, b) => Math.abs(lum(b.hex) - lum(skinHex)) - Math.abs(lum(a.hex) - lum(skinHex)));
  else {
    const target = (hue(skinHex) + 180) % 360;
    const dist = c => Math.min(Math.abs(hue(c.hex) - target), 360 - Math.abs(hue(c.hex) - target));
    colours = [...pool].sort((a, b) => dist(a) - dist(b));
  }
  return {
    formula: f.name, description: f.description, rule: f.rule,
    colours: colours.slice(0, 6),
    avoid: row.avoidColours,
    undertone: { label: row.label, describe: row.description, check: row.howToIdentify, makeup: row.makeupGuidance },
    examples: f.examples.map(e => `${e.skinTone}: ${e.recommendation}`),
  };
}

/** The guides' avoid lists name families ("cool blue-based pinks", "very orange corals"); these are the members of each family. */
const CLASH = { warm: /^(cool|blue)/, cool: /^(warm|orange|coral|peach|tomato|burnt)/ };

/** The lip shade line for a look at this depth, and the first named colour your undertone does not avoid. */
function lipShade(look, fitz, undertone) {
  const th = LIP_COLOUR_THEORY.fitzpatrickGuidance[THEORY_KEY[fitz]];
  const lines = {
    nude: STATEMENT_LIP_LOOKS.nude_lip.by_skin_tone[NUDE_KEY[fitz]] + '; ' + th.nudes,
    classic_red: STATEMENT_LIP_LOOKS.classic_red.shade_by_skin_tone[RED_KEY[fitz]],
    dark_lip: th.bolds + '; ' + STATEMENT_LIP_LOOKS.dark_lip.shades.join(', '),
    glossy_editorial: LIP_COLOUR_THEORY.undertones[undertone].lipColours.join(', '),
    ombre: th.bolds,
  };
  const avoidWords = namedColours((LIP_COLOUR_THEORY.undertones[undertone].colours_to_avoid ?? []).join(' ')).map(c => c.word);
  const ok = c => !avoidWords.includes(c.word) && !CLASH[undertone]?.test(c.word);
  const named = namedColours(lines[look]).filter(ok);
  const centre = look === 'ombre' ? namedColours(th.nudes).find(ok) ?? null : null;
  if (named.length) return { line: lines[look], colour: named[0], alternatives: named.slice(1, 4), centre, from: 'depth' };
  // Every shade the depth guide names clashes with this undertone: take the same family from the undertone list.
  const fromUndertone = namedColours(LIP_COLOUR_THEORY.undertones[undertone].lipColours.join(', ')).filter(ok);
  const colour = fromUndertone.find(c => look !== 'classic_red' || /red/.test(c.word)) ?? fromUndertone[0];
  return { line: lines[look], colour, alternatives: [], centre, from: 'undertone' };
}

function lookSteps(look) {
  const s = STATEMENT_LIP_LOOKS;
  switch (look) {
    case 'nude': return { name: s.nude_lip.look, steps: [s.nude_lip.challenge], tip: s.nude_lip.tip };
    case 'classic_red': return { name: s.classic_red.look, steps: [s.classic_red.technique], tip: s.classic_red.ethnic_note };
    case 'dark_lip': return { name: s.dark_lip.look, steps: s.dark_lip.tips, tip: s.dark_lip.ethnic_note };
    case 'glossy_editorial': return { name: s.glossy_editorial.look, steps: s.glossy_editorial.how_to, tip: s.glossy_editorial.ethnic_note ?? null };
    default: return { name: OMBRE_LIP_GUIDE.classic_ombre.name, steps: OMBRE_LIP_GUIDE.classic_ombre.steps, tip: OMBRE_LIP_GUIDE.gradient_lip.ethnic_note };
  }
}

function finishPlan(finish, care) {
  const f = LIP_FINISHES[finish];
  const drying = /drying/i.test(text(f.cons));
  return {
    id: finish, finish: f.finish, description: f.description,
    pros: f.pros ?? [], cons: f.cons ?? [],
    prep: f.prep ?? null, how: f.how_to ?? f.application ?? null, note: f.ethnic_note ?? null,
    caution: drying && (care === 'dry' || care === 'ageing')
      ? `${f.finish} can be drying and your lips are ${care === 'dry' ? 'dry or chapped' : 'thinning or dehydrated'}: prep first, or pick satin or gloss until they recover.`
      : null,
  };
}

function linerPlan(liner) {
  const l = LIP_LINER_TECHNIQUES[liner];
  return {
    id: liner, technique: l.technique,
    steps: l.steps ?? l.rules ?? [l.description],
    note: l.note ?? (l.steps || l.rules ? l.description ?? null : null),
    choosing: text(LINER_CHOICE.basic),
    sharpen: LIP_LINER_TECHNIQUES.how_to_sharpen,
  };
}

function carePlan(care, fitz) {
  const c = CARE.find(x => x.id === care);
  const r = LIP_CARE_ROUTINE[c.key];
  const sections = Object.entries(r).filter(([, v]) => Array.isArray(v)).map(([k, v]) => ({ title: k.replace(/([A-Z])/g, ' $1').replace(/^./, x => x.toUpperCase()), steps: v }));
  return {
    concern: c.label, focus: r.focus ?? null, sections,
    spf: LIP_CARE_INGREDIENTS.sunscreen ? text(LIP_CARE_INGREDIENTS.sunscreen).split(/(?<=\.)\s/)[0] : null,
    natural: care === 'darkening' && ['IV', 'V', 'VI'].includes(fitz) ? LIP_HYPERPIGMENTATION.ethnicConsiderations.naturalVariation : null,
  };
}

function communityNotes(cid) {
  const d = dash(cid);
  const culture = LIP_COLOUR_BY_CULTURE[d] ?? {};
  const care = ETHNIC_LIP_CARE_GUIDES[d] ?? {};
  return {
    lips: ETHNIC_LIP_TRADITIONS[cid]?.traditions ?? null,
    colour: culture.tradition ?? null,
    iconicShades: culture.iconicShades ?? [],
    care: (care.traditionalPractices ?? []).map(p => p.name).filter(Boolean),
    heritage: getAllHallOfFameProducts().filter(h => h.communities?.includes(d)).map(h => ({ product: h.product, story: h.story })),
    brands: getEthnicBrandsForCommunity(d).map(b => ({ name: b.name, founder: b.founder, founded: b.founded, heroProducts: b.heroProducts })),
  };
}

export function buildColourPlan(input = {}) {
  const cid = resolveCommunity(input.community ?? 'west_african').id ?? 'west_african';
  const fitz = pick(input.fitzpatrick, FITZPATRICK, 'V');
  const undertone = pick(input.undertone, UNDERTONES.map(x => x.id), 'warm');
  const formula = pick(input.formula, FORMULAS.map(x => x.id), 'harmony');
  const look = pick(input.look, LOOKS.map(x => x.id), 'nude');
  const finish = pick(input.finish, FINISHES.map(x => x.id), 'satin');
  const liner = pick(input.liner, LINERS.map(x => x.id), 'basic_liner');
  const care = pick(input.care, CARE.map(x => x.id), 'daily');
  const tone = MONK_TONES.find(t => t.id === input.tone) ?? MONK_TONES[6];
  const shade = lipShade(look, fitz, undertone);
  const bySkin = LIP_COLOUR_BY_SKIN_TONE[TONE_KEY[fitz]];
  const theory = LIP_COLOUR_THEORY.fitzpatrickGuidance[THEORY_KEY[fitz]];
  return {
    community: { id: cid, label: LIBRARY_COMMUNITIES.find(x => x.id === cid)?.label ?? cid },
    choices: { fitzpatrick: fitz, undertone, formula, look, finish, liner, care, community: cid, tone: tone.id },
    tone,
    palette: palette(formula, undertone, fitz, tone.hex),
    lips: {
      look: lookSteps(look), shade,
      forDepth: { skin: bySkin.skin_tone, flattering: bySkin.flattering, avoid: bySkin.avoid ?? [], nudes: theory.nudes, bolds: theory.bolds, tip: theory.tips },
      forUndertone: { colours: LIP_COLOUR_THEORY.undertones[undertone].lipColours, avoid: LIP_COLOUR_THEORY.undertones[undertone].colours_to_avoid ?? [] },
      philosophy: LIP_COLOUR_BY_SKIN_TONE.philosophy,
    },
    finish: finishPlan(finish, care),
    liner: linerPlan(liner),
    care: carePlan(care, fitz),
    communityNotes: communityNotes(cid),
  };
}

export function colourOptions() {
  return {
    communities: LIBRARY_COMMUNITIES.map(x => ({ id: x.id, label: x.label })),
    fitzpatrick: FITZPATRICK, undertones: UNDERTONES, formulas: FORMULAS, looks: LOOKS,
    finishes: FINISHES, liners: LINERS, care: CARE.map(({ id, label }) => ({ id, label })), tones: MONK_TONES,
  };
}
