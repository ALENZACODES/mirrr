/**
 * Look Book studio: find a full makeup look and learn it. Pick your community, a category, how much
 * time you have, your skill level and the season; the studio lists the looks from the look database
 * (src/look_styles.js) that fit, and for the one you choose builds an order of application, the lip
 * colour you pick, shade notes for your own tone, safety notes, and the step-by-step tutorial to
 * practise (src/beauty_tutorials.js). Both guides were audited in wire/ops-b18-*.mjs.
 *
 * Every look can be worn on every skin: looks are never filtered by skin type or undertone. Your tone
 * only changes the picture and the shade notes, which quote the tutorials.
 */
import { LOOK_CATEGORIES, LOOK_STYLES, getLooksForCommunity } from '../look_styles.js';
import { TUTORIALS, DIFFICULTY_LEVELS } from '../beauty_tutorials.js';
import { MONK_TONES } from '../skin/clinic.js';
import { LIBRARY_COMMUNITIES, resolveCommunity } from '../library/communities.js';

const kebab = id => id.replace(/_/g, '-');
const pick = (v, list, d) => (list.includes(String(v)) ? String(v) : d);
const cap = s => String(s).replace(/^./, c => c.toUpperCase());

export const CATEGORIES = [{ id: 'any', label: 'Any category' }, ...Object.values(LOOK_CATEGORIES)
  .sort((a, b) => a.sortOrder - b.sortOrder).map(c => ({ id: c.id, label: c.label, icon: c.icon }))];
export const TIMES = [
  { id: 'any', label: 'Any length', max: Infinity },
  { id: '15', label: '15 minutes or less', max: 15 },
  { id: '30', label: '30 minutes or less', max: 30 },
  { id: '45', label: '45 minutes or less', max: 45 },
  { id: '60', label: 'An hour or less', max: 60 },
  { id: '90', label: '90 minutes or less', max: 90 },
];
export const SKILLS = Object.values(DIFFICULTY_LEVELS).map(d => ({ id: String(d.id), label: `${d.label}: ${d.description}`, short: d.label, max: d.id }));
export const SEASONS = [
  { id: 'any', label: 'Any season' },
  { id: 'spring', label: 'Spring' },
  { id: 'summer', label: 'Summer' },
  { id: 'fall', label: 'Autumn' },
  { id: 'winter', label: 'Winter' },
];
const DEFAULTS = { community: 'west_african', category: 'any', time: 'any', skill: '5', season: 'any', look: '', lip: '0', practise: '', tone: 'mst7' };

// ---- Colour words in the guide, turned into swatches for the picture ------------------------------
const COLOUR_WORDS = Object.entries({
  'electric blue': '#1f5fff', 'royal blue': '#2346b5', 'ink blue': '#1b2a6b', 'deep navy': '#1b2a4a', navy: '#1f2d5a', indigo: '#3b3a8f', sapphire: '#1f3f9a', blue: '#2f6fd0',
  turquoise: '#1fb5b0', teal: '#13807a', emerald: '#0f7a4a', 'forest green': '#2c5a35', 'neon green': '#39ff6a', green: '#2f8f4f',
  mustard: '#d4a017', mango: '#f5a623', yellow: '#f4d03f', tangerine: '#f28500', 'burnt orange': '#c75b12', 'neon orange': '#ff6a13', 'orange-red': '#e8471c', orange: '#f07f13',
  'papaya coral': '#ff7f61', coral: '#f2765b', peach: '#f2a38a', apricot: '#f0a46a',
  terracotta: '#c0603f', 'terra cotta': '#c0603f', 'burnt sienna': '#a0522d', sienna: '#a0522d', brick: '#9c3a2a', rust: '#a3471f', ochre: '#c28a2c', copper: '#b8693a', bronze: '#a86f3a',
  cognac: '#8a4b2a', umber: '#6b4226', mocha: '#6f4a3a', chocolate: '#4a2c20', espresso: '#3b2418', 'deep brown': '#4a2e22', 'rich brown': '#5a3522', 'warm brown': '#7a4a2e', brown: '#6b4430', taupe: '#8b7d6b', sand: '#d8b98c',
  'rose gold': '#c98d84', gold: '#d4a937', champagne: '#e8cfa0', ivory: '#f3ead8', pearl: '#ece4da', silver: '#c0c0c8', holographic: '#c7b8ff', white: '#ffffff',
  'candy red': '#e0193a', 'cardinal red': '#b3122e', 'fire engine red': '#ce1620', 'fire red': '#d1201b', cherry: '#b5132b', 'jewel red': '#9b1027', 'berry red': '#8f1d3a', 'rose red': '#c2304a', 'warm red': '#c8322a', 'classic red': '#c1121f', 'bold red': '#c1121f', 'vivid red': '#d0102a', red: '#c1121f',
  cranberry: '#8a1538', garnet: '#7a1428', 'deep wine': '#5e1224', wine: '#6a1a2b', 'deep maroon': '#5a0f1c', maroon: '#6d1a24', 'deep burgundy': '#5c0f22', burgundy: '#6e1426',
  'deep plum': '#4a1838', plum: '#6a2c55', 'electric purple': '#8a2be2', 'vivid purple': '#7d2fd0', 'deep purple': '#4b1a6b', purple: '#6a2c91', lilac: '#c3a6e0', mauve: '#a46a7f',
  magenta: '#c2185b', fuchsia: '#d1246f', 'hot pink': '#e91e78', 'hot rose': '#d6336c', 'watermelon pink': '#f0607a', 'deep pink': '#c7366f', 'blush pink': '#efb0b8', 'soft pink': '#eaa0b0', 'dusty pink': '#c98f98', 'warm pink': '#e07a8a',
  'bright rose': '#d9466f', 'deep rose': '#a83a5a', 'dusty rose': '#b5717f', 'rose beige': '#c49a8e', 'beige rose': '#c49a8e', rose: '#c45a6a', pink: '#e58aa0', raspberry: '#b0204a', 'warm berry': '#8e2a45', 'deep berry': '#6e1c3c', berry: '#8a2348', 'sheer cherry': '#c2405a',
  'jet black': '#0a0a0a', black: '#111111',
}).sort((a, b) => b[0].length - a[0].length);
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgbHex = a => `#${a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
const mix = (a, b, t) => rgbHex(hexRgb(a).map((v, i) => v + (hexRgb(b)[i] - v) * t));
/** Colours named in a phrase, in the order they appear (longest name wins at each place). */
export function coloursIn(text) {
  const s = String(text).toLowerCase(); const found = []; const taken = new Array(s.length).fill(false);
  for (const [w, hex] of COLOUR_WORDS) {
    let i = s.indexOf(w);
    while (i >= 0) {
      if (!taken.slice(i, i + w.length).some(Boolean) && !/[a-z]/.test(s[i + w.length] ?? '') && !/[a-z]/.test(s[i - 1] ?? '')) {
        for (let k = i; k < i + w.length; k++) taken[k] = true; found.push([i, hex]);
      }
      i = s.indexOf(w, i + 1);
    }
  }
  return [...new Set(found.sort((a, b) => a[0] - b[0]).map(x => x[1]))];
}
/** A lip swatch: named colours as written; nudes, MLBB and balms are built from your own tone. */
export function lipColour(option, toneHex) {
  const s = option.toLowerCase(); const own = mix(toneHex, '#7a2a3a', 0.35);
  const named = coloursIn(s);
  if (/mlbb|my lips but better|tinted balm|lip oil|clear/.test(s)) return { hex: own, sheer: true };
  if (/nude/.test(s)) return { hex: named.length ? mix(own, named[0], 0.4) : own, sheer: false };
  if (/champagne/.test(s) && /gloss/.test(s)) return { hex: mix(own, '#e8cfa0', 0.35), sheer: true };
  return { hex: named[0] ?? own, sheer: /gloss|stain|balm|sheer|gradient|ombre/.test(s) };
}

// ---- Tutorials that teach part of a look ----------------------------------------------------------
const BOLD_LIP = /red|burgundy|plum|berry|wine|maroon|cranberry|fuchsia|magenta|purple|black|garnet|brick|sienna/;
function relatedTutorials(look, lipOption, depth) {
  const e = look.eyeLook; const t = [];
  const add = (id, why) => { if (TUTORIALS[id] && !t.some(x => x.id === id)) t.push({ id, why }); };
  if (/cut[- ]crease/i.test(e.technique)) add('cut_crease_tutorial', `The eyes use a ${e.technique}.`);
  if (/kohl|kajal/i.test(`${e.technique} ${e.liner}`)) add('kohl_eye_tutorial', `The liner is ${e.liner}.`);
  if (BOLD_LIP.test(lipOption.toLowerCase())) add('dark_skin_bold_lip', `You picked a bold lip (${lipOption}).`);
  if (look.tags.includes('bold-brow') || /full|bold/i.test(e.brow)) add('south_asian_brow', `The brows are ${e.brow}.`);
  if (depth === 'deep' && /coverage/i.test(look.faceLook.base)) add('foundation_deep_skin', `The base is ${look.faceLook.base}, on deep skin.`);
  if (look.tags.includes('mehndi')) add('mehndi_basic_tutorial', 'Mehendi is part of this look\'s occasion.');
  if (look.community === 'south-asian' && (look.category === 'bridal' || look.tags.includes('haldi'))) add('ubtan_face_mask', 'Ubtan is the traditional skin prep before a South Asian wedding.');
  return t;
}
function tutorialCard(id, why) {
  const t = TUTORIALS[id];
  return {
    id, why, title: t.title, category: t.category, minutes: t.timeMinutes,
    level: DIFFICULTY_LEVELS[t.difficulty]?.label ?? String(t.difficulty),
    description: t.description ?? null, context: t.culturalContext ?? null,
    ingredients: (t.ingredients ?? []).map(i => `${i.name}${i.amount ? ` (${i.amount})` : ''}`),
    tools: t.tools ?? [],
    steps: t.steps.map(s => ({ title: s.title, text: s.instruction, tip: s.tip ?? null, time: s.duration ?? null })),
    warnings: t.warnings ?? [],
  };
}

// ---- Safety notes read from the look's own words ---------------------------------------------------
function safetyNotes(look) {
  const all = `${Object.values(look.eyeLook).join(' ')} ${Object.values(look.faceLook).join(' ')} ${look.tags.join(' ')}`.toLowerCase();
  const n = [];
  if (/kohl|kajal/.test(all)) n.push({ id: 'kohl', text: TUTORIALS.kohl_eye_tutorial.warnings[1], source: TUTORIALS.kohl_eye_tutorial.title });
  if (/rhinestone|gem/.test(all)) n.push({ id: 'gems', text: 'Stick gems on with an adhesive made for skin, patch-test the glue the day before, and keep gems off the lash line and waterline.' });
  if (/glitter|holographic/.test(all)) n.push({ id: 'glitter', text: 'Use cosmetic glitter made for the face; craft glitter is not safe near the eyes.' });
  if (/(^|[^-])bleached (brow|or)/.test(look.eyeLook.brow)) n.push({ id: 'brow-bleach', text: 'Do not put hair bleach or dye on your brows: they are too close to the eyes. For a bleached-brow effect, block the brows with a glue stick and concealer.' });
  if (look.tags.includes('mehndi')) n.push({ id: 'henna', text: TUTORIALS.mehndi_basic_tutorial.warnings[0], source: TUTORIALS.mehndi_basic_tutorial.title });
  if (/white face paint|body-paint/.test(all)) n.push({ id: 'paint', text: 'Use face and body paint made for skin, patch-test it, and remove it fully the same day.' });
  return n;
}

// ---- Shade notes for your tone, quoted from the tutorials ------------------------------------------
function depthOf(toneId) { const n = Number(toneId.replace('mst', '')); return n <= 3 ? 'light' : n <= 6 ? 'medium' : 'deep'; }
function shadeNotes(look, depth, lip) {
  const n = []; const fd = TUTORIALS.foundation_deep_skin; const cc = TUTORIALS.cut_crease_tutorial;
  if (/bake|powder/i.test(look.faceLook.setting)) n.push({ text: cc.steps[5].tip, source: cc.title });
  if (depth === 'deep') {
    n.push({ text: fd.steps[0].instruction, source: fd.title });
    if (/bake/i.test(look.faceLook.setting)) n.push({ text: fd.steps[4].tip, source: fd.title });
    if (BOLD_LIP.test(lip.toLowerCase()) || /nude/.test(lip.toLowerCase())) n.push({ text: TUTORIALS.dark_skin_bold_lip.warnings[0], source: TUTORIALS.dark_skin_bold_lip.title });
  } else {
    if (depth === 'light' && (look.tags.includes('haldi') || look.community === 'south-asian')) n.push({ text: TUTORIALS.ubtan_face_mask.steps[0].tip, source: TUTORIALS.ubtan_face_mask.title });
    n.push({ text: 'Nude and MLBB lip swatches here are built from the tone you picked, so they sit close to your own lip colour.', source: 'Look Book' });
  }
  return n;
}

// ---- Order of application ---------------------------------------------------------------------------
const EYES_FIRST = /cut[- ]crease|smok|glitter|gem|rhinestone|graphic|kohl-heavy|foil|holographic|colour block|eye art/i;
function applicationOrder(look, lip) {
  const e = look.eyeLook; const f = look.faceLook; const l = look.lipLook;
  const eyesFirst = EYES_FIRST.test(e.technique) || look.difficulty >= 4;
  const S = {
    base: { zone: 'base', title: 'Base', text: cap(f.base) },
    brows: { zone: 'brows', title: 'Brows', text: cap(e.brow) },
    eyes: { zone: 'eyes', title: 'Eyes', text: `${cap(e.technique)} in ${e.primaryColour}. Liner: ${e.liner}. Lashes: ${e.lash}.` },
    face: { zone: 'face', title: 'Sculpt and colour', text: `Contour: ${f.contour}. Blush: ${f.blush}. Highlight: ${f.highlight}.` },
    lips: { zone: 'lips', title: 'Lips', text: `${cap(lip)}. Liner: ${l.liner}. Finish: ${l.finish}.` },
    set: { zone: 'set', title: 'Set', text: cap(f.setting) },
  };
  const order = eyesFirst ? ['eyes', 'brows', 'base', 'face', 'lips', 'set'] : ['base', 'brows', 'eyes', 'face', 'lips', 'set'];
  return {
    eyesFirst,
    why: eyesFirst ? 'Eyes first: this eye sheds powder or glitter, so you can clean the fallout before the base goes on.' : 'Base first: the eye is soft enough that fallout is not a worry.',
    steps: order.map(k => S[k]),
  };
}

function liner(e) {
  const s = `${e.liner} ${e.technique}`.toLowerCase();
  if (/^none|nothing|white waterline/.test(e.liner.toLowerCase()) && !/kohl/.test(s)) return 'none';
  if (/puppy/.test(s)) return 'puppy';
  if (/graphic|geometric|structural|jagged|double|floating|beadwork/.test(s)) return 'graphic';
  if (/cat/.test(s)) return 'cat';
  if (/wing|flick/.test(s)) return 'wing';
  if (/smudg|kohl|kajal/.test(s)) return 'smudge';
  return 'thin';
}
function brow(b) {
  const s = b.toLowerCase();
  if (/^none/.test(s)) return 'none';
  if (/connected|unibrow/.test(s)) return 'connected';
  if (/bleach|coloured/.test(s)) return 'bleached';
  if (/thin|pencil/.test(s)) return 'thin';
  if (/straight/.test(s)) return 'straight';
  if (/bold|full|sharp|sculpted|defined/.test(s)) return 'bold';
  return 'natural';
}

function matchesFor(c) {
  const comm = kebab(c.community); const tmax = TIMES.find(t => t.id === c.time).max; const smax = Number(c.skill);
  const pool = getLooksForCommunity(comm).sort((a, b) => (a.community === 'all') - (b.community === 'all') || a.timeMinutes - b.timeMinutes);
  const misses = l => [
    c.category !== 'any' && l.category !== c.category ? `category is ${LOOK_CATEGORIES[l.category].label}` : null,
    l.timeMinutes > tmax ? `takes ${l.timeMinutes} minutes` : null,
    l.difficulty > smax ? `level ${DIFFICULTY_LEVELS[l.difficulty].label}` : null,
    c.season !== 'any' && !l.season.includes(c.season) && !l.season.includes('all') ? `made for ${l.season.join(' and ')}` : null,
  ].filter(Boolean);
  const fit = pool.filter(l => !misses(l).length);
  const near = fit.length ? [] : pool.map(l => ({ l, m: misses(l) })).sort((a, b) => a.m.length - b.m.length).slice(0, 3);
  return { fit, near, misses };
}

const brief = l => ({ id: l.id, label: l.label, community: l.community, category: LOOK_CATEGORIES[l.category].label, icon: LOOK_CATEGORIES[l.category].icon, minutes: l.timeMinutes, level: DIFFICULTY_LEVELS[l.difficulty].label, difficulty: l.difficulty });

export function looksOptions() {
  return {
    communities: LIBRARY_COMMUNITIES, categories: CATEGORIES, times: TIMES.map(({ id, label }) => ({ id, label })),
    skills: SKILLS.map(({ id, label }) => ({ id, label })), seasons: SEASONS, tones: MONK_TONES,
    looks: Object.values(LOOK_STYLES).map(brief),
  };
}

export function buildLookPlan(input = {}) {
  const raw = input && typeof input === 'object' ? input : {};
  const c = {
    community: resolveCommunity(raw.community ?? DEFAULTS.community).id ?? DEFAULTS.community,
    category: pick(raw.category, CATEGORIES.map(x => x.id), DEFAULTS.category),
    time: pick(raw.time, TIMES.map(x => x.id), DEFAULTS.time),
    skill: pick(raw.skill, SKILLS.map(x => x.id), DEFAULTS.skill),
    season: pick(raw.season, SEASONS.map(x => x.id), DEFAULTS.season),
    tone: pick(raw.tone, MONK_TONES.map(t => t.id), DEFAULTS.tone),
  };
  const { fit, near, misses } = matchesFor(c);
  const list = fit.length ? fit : near.map(x => x.l);
  const look = list.find(l => l.id === raw.look) ?? list[0];
  c.look = look.id;
  const lips = look.lipLook.options;
  c.lip = pick(raw.lip, lips.map((_, i) => String(i)), '0');
  const lipOption = lips[Number(c.lip)];
  const tone = MONK_TONES.find(t => t.id === c.tone); const depth = depthOf(c.tone);
  const related = relatedTutorials(look, lipOption, depth);
  c.practise = pick(raw.practise, related.map(r => r.id), related[0]?.id ?? '');
  const prac = related.find(r => r.id === c.practise);
  const communityLabel = LIBRARY_COMMUNITIES.find(x => x.id === c.community).label;
  const lipSw = lipColour(lipOption, tone.hex);
  const lid = coloursIn(look.eyeLook.primaryColour);
  const blush = coloursIn(look.faceLook.blush)[0] ?? mix(tone.hex, '#c45a6a', 0.4);
  const highlight = coloursIn(look.faceLook.highlight)[0] ?? '#f3ead8';
  const white = /white face paint/i.test(look.faceLook.base);
  return {
    choices: c,
    tone, depth,
    filters: {
      community: communityLabel,
      category: CATEGORIES.find(x => x.id === c.category).label,
      time: TIMES.find(x => x.id === c.time).label,
      skill: SKILLS.find(x => x.id === c.skill).short,
      season: SEASONS.find(x => x.id === c.season).label,
    },
    matches: list.map(brief),
    fits: fit.length > 0,
    misses: fit.length ? [] : misses(look),
    message: fit.length
      ? `${fit.length} look${fit.length === 1 ? '' : 's'} for ${communityLabel} and everyone fit${fit.length === 1 ? 's' : ''} your filters.`
      : `No ${communityLabel} look fits every filter. These are the closest; the one shown ${misses(look).join(', ')}.`,
    look: {
      id: look.id, label: look.label, community: look.community === 'all' ? 'For everyone' : communityLabel,
      category: LOOK_CATEGORIES[look.category].label, icon: LOOK_CATEGORIES[look.category].icon,
      description: look.description, context: look.culturalContext ?? null,
      minutes: look.timeMinutes, level: DIFFICULTY_LEVELS[look.difficulty].label, difficulty: look.difficulty,
      occasions: look.occasions, seasons: look.season.includes('all') ? ['all year'] : look.season.map(s => (s === 'fall' ? 'autumn' : s)),
      tags: look.tags, eye: look.eyeLook, face: look.faceLook, lipLook: { liner: look.lipLook.liner, finish: look.lipLook.finish },
      lips: lips.map((o, i) => ({ id: String(i), label: o, hex: lipColour(o, tone.hex).hex })),
      deepSkinFocus: look.fitzpatrickFit.length < 6,
    },
    lip: { label: lipOption, ...lipSw },
    order: applicationOrder(look, lipOption),
    shadeNotes: shadeNotes(look, depth, lipOption),
    safety: safetyNotes(look),
    related: related.map(r => ({ id: r.id, title: TUTORIALS[r.id].title, why: r.why })),
    practise: prac ? tutorialCard(prac.id, prac.why) : null,
    picture: {
      skin: white ? '#f4f1ec' : tone.hex, neck: tone.hex, whiteBase: white,
      lid: lid.length ? lid.slice(0, 3) : [mix(tone.hex, '#3b2418', 0.25)],
      liner: liner(look.eyeLook), linerColour: /blue|teal/i.test(look.eyeLook.liner) ? coloursIn(look.eyeLook.liner)[0] : /brown|chocolate/i.test(look.eyeLook.liner) ? '#4a2c20' : '#111111',
      brow: brow(look.eyeLook.brow), lashes: /none|nothing/i.test(look.eyeLook.lash) ? 'none' : /3d|volume|dramatic|full|enormous|huge|extreme|glam/i.test(look.eyeLook.lash) ? 'full' : 'soft',
      blush, highlight, lip: lipSw.hex, lipSheer: lipSw.sheer, lipFinish: /metallic|vinyl|lacquer/i.test(look.lipLook.finish) ? 'shine' : /gloss|glass|jelly/i.test(look.lipLook.finish) ? 'gloss' : /matte/i.test(look.lipLook.finish) ? 'matte' : 'satin',
      gems: /gem|rhinestone/i.test(`${look.eyeLook.technique} ${look.eyeLook.liner} ${look.tags.join(' ')}`),
      glitter: /glitter|holographic/i.test(`${look.eyeLook.technique} ${look.faceLook.highlight}`),
      focus: prac ? ({ eyes: 'eyes', lips: 'lips', brows: 'brows', base: 'base', skincare: 'base', bodyart: 'hands', hair: 'hair' }[prac.category] ?? null) ?? TUTORIALS[prac.id].category : null,
      timeLimit: TIMES.find(x => x.id === c.time).max === Infinity ? null : TIMES.find(x => x.id === c.time).max,
      skillLimit: Number(c.skill),
    },
  };
}

/** Find looks by a word: name, description, tags or occasion. */
export function searchLooks(q) {
  const t = String(q ?? '').trim().toLowerCase().slice(0, 60);
  if (t.length < 3) return { query: t, results: [] };
  const hits = Object.values(LOOK_STYLES).filter(l => [l.label, l.description, l.tags.join(' '), l.occasions.join(' '), l.culturalContext ?? ''].join(' ').toLowerCase().includes(t));
  return { query: t, results: hits.slice(0, 12).map(brief) };
}
