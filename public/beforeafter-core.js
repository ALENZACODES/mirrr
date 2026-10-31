/**
 * Before & After studio: the pure parts (no DOM), shared by the page and the tests.
 * - the colour lists for each makeup layer (the same colour words the live try-on uses),
 * - the step-by-step looks ("how she got the look"), built from those layers,
 * - the photo manifest loader for real before / step / after photo sets in /beforeafter/<model>/.
 */
export const FOUNDATION = [
  ['#f1d3c0', 'Fair, cool'], ['#ecc9a4', 'Fair, warm'], ['#dcb08c', 'Light, neutral'], ['#cf9f74', 'Light-medium, golden'],
  ['#b98660', 'Medium, olive'], ['#a8724c', 'Medium-tan, warm'], ['#8d5b3c', 'Tan, red undertone'], ['#734628', 'Deep, warm'],
  ['#5c3720', 'Deep, red undertone'], ['#45281a', 'Rich deep, neutral'], ['#33201a', 'Rich deep, cool'],
];
export const LIP = [['#d9a3a0', 'Nude-pink'], ['#c48b8b', 'Dusty rose'], ['#b07a8c', 'Mauve'], ['#b5733c', 'Caramel'], ['#9a5b2e', 'Toffee'], ['#7a4e36', 'Mocha'], ['#c0603d', 'Terracotta'], ['#f07c5f', 'Coral'], ['#c0202a', 'Classic red'], ['#b0213f', 'Blue-red'], ['#9c3426', 'Brick red'], ['#8e2f5a', 'Berry'], ['#c8227a', 'Fuchsia'], ['#6e2f55', 'Plum'], ['#62182f', 'Wine'], ['#5a1a1f', 'Oxblood'], ['#5a3020', 'Chocolate']];
export const LIP_FINISH = [['creme', 'Creme'], ['gloss', 'Gloss'], ['matte', 'Matte']];
export const BLUSH = [['#f4ae86', 'Peach'], ['#f07c5f', 'Coral'], ['#d9798a', 'Rose'], ['#8e2f5a', 'Berry'], ['#c0603d', 'Terracotta'], ['#a8432a', 'Brick']];
export const SHADOW = [['#a8743a', 'Bronze'], ['#d9aa4c', 'Gold'], ['#b8693a', 'Copper'], ['#6e2f55', 'Plum'], ['#8d7b6d', 'Taupe'], ['#1f8a5b', 'Emerald']];
export const LINER = [['#141414', 'Black kohl'], ['#3b2016', 'Dark chocolate'], ['#1d2a5b', 'Navy'], ['#1f4d2b', 'Forest green'], ['#6e2f55', 'Plum']];
export const LINER_STYLE = [['tight', 'Upper lash line'], ['kohl', 'Kohl, upper and lower'], ['wing', 'Winged']];
export const LASHES = [['natural', 'Natural'], ['wispy', 'Wispy'], ['dramatic', 'Dramatic']];
export const HIGHLIGHT = [['#fff4e6', 'Pearl'], ['#f3d9a4', 'Champagne'], ['#e0a96d', 'Bronze glow'], ['#d9aa4c', 'Gold']];
export const CONTOUR = [['soft', 'Soft'], ['defined', 'Defined'], ['sculpted', 'Sculpted']];
export const BROW = [['#141414', 'Soft black'], ['#3b2016', 'Dark brown'], ['#6b4030', 'Warm brown'], ['#8d7b6d', 'Taupe']];

/** The layers she can play with, in the order they are painted. */
export const LAYERS = [
  { id: 'foundation', label: 'Foundation shade', values: FOUNDATION, amount: true, extra: [['match', 'Match my skin (read from the photo)']] },
  { id: 'brow', label: 'Brow tint', values: BROW, amount: true },
  { id: 'shadow', label: 'Eyeshadow', values: SHADOW, amount: true },
  { id: 'liner', label: 'Liner / kohl colour', values: LINER, amount: true },
  { id: 'linerStyle', label: 'Liner style', values: LINER_STYLE },
  { id: 'lashes', label: 'Lashes', values: LASHES },
  { id: 'lip', label: 'Lip colour', values: LIP, amount: true },
  { id: 'lipFinish', label: 'Lip finish', values: LIP_FINISH },
  { id: 'blush', label: 'Blush', values: BLUSH, amount: true },
  { id: 'contour', label: 'Contour', values: CONTOUR, amount: true },
  { id: 'highlight', label: 'Highlight', values: HIGHLIGHT, amount: true },
];

const name = (list, v) => (list.find(([h]) => h === v) || [])[1] || v;

/**
 * Step-by-step looks. Each step adds layers on top of the last, so card k shows what the face looks
 * like after steps 1..k; the last step is the finished After. `routine` names the real-product strip
 * (/api/shop/routine/<id>) for that step; `cats` narrows it to the categories that step uses.
 */
const PREP = { name: 'Skin prep', routine: 'skin', cats: ['prep'], adds: { prep: true }, note: 'Cleanse, moisturise and SPF: skin looks fresher, with a soft natural glow on the cheekbones and nose.' };
export const LOOKS = [
  { id: 'soft-glam', name: 'Soft glam', steps: [
    PREP,
    { name: 'Base', routine: 'complexion', adds: { foundation: 'match', foundationAmt: 70 }, note: 'Foundation matched to her own skin, blended out, to even the tone.' },
    { name: 'Eyes', routine: 'eyes', adds: { shadow: '#a8743a', shadowAmt: 100, liner: '#3b2016', linerAmt: 100, linerStyle: 'tight', lashes: 'wispy', brow: '#3b2016', browAmt: 95 }, note: 'Brows filled, bronze shadow from lash line to crease, brown liner and lashes.' },
    { name: 'Lips', routine: 'lips', adds: { lip: '#b0213f', lipAmt: 100, lipFinish: 'creme' } },
    { name: 'Finish', routine: 'glow', adds: { blush: '#d9798a', blushAmt: 100, contour: 'defined', contourAmt: 80, highlight: '#f3d9a4', highlightAmt: 90 }, note: 'Contour under the cheekbones, blush on the apples of the cheeks, highlight on top.' },
  ] },
  { id: 'bold-red', name: 'Classic red lip', steps: [
    PREP,
    { name: 'Base', routine: 'complexion', adds: { foundation: 'match', foundationAmt: 75 }, note: 'A fuller-coverage base for a polished red-lip look.' },
    { name: 'Eyes', routine: 'brow_kohl', adds: { liner: '#141414', linerAmt: 100, linerStyle: 'wing', lashes: 'natural', brow: '#141414', browAmt: 95, shadow: '#8d7b6d', shadowAmt: 60 }, note: 'A clean black wing, soft taupe in the crease, brows filled.' },
    { name: 'Lips', routine: 'lips', adds: { lip: '#c0202a', lipAmt: 100, lipFinish: 'matte' } },
    { name: 'Finish', routine: 'glow', adds: { blush: '#d9798a', blushAmt: 85, contour: 'defined', contourAmt: 80, highlight: '#f3d9a4', highlightAmt: 80 } },
  ] },
  { id: 'smoky-kohl', name: 'Smoky kohl', steps: [
    PREP,
    { name: 'Base', routine: 'complexion', adds: { foundation: 'match', foundationAmt: 70 } },
    { name: 'Eyes', routine: 'eyes', adds: { shadow: '#6e2f55', shadowAmt: 100, liner: '#141414', linerAmt: 100, linerStyle: 'kohl', lashes: 'dramatic', brow: '#141414', browAmt: 95 }, note: 'Plum smoked from lash line to crease, black kohl top and bottom, full lashes.' },
    { name: 'Lips', routine: 'lips', adds: { lip: '#7a4e36', lipAmt: 100, lipFinish: 'creme' } },
    { name: 'Finish', routine: 'glow', adds: { blush: '#c0603d', blushAmt: 95, contour: 'sculpted', contourAmt: 90, highlight: '#e0a96d', highlightAmt: 85 } },
  ] },
  { id: 'everyday-glow', name: 'Everyday glow', steps: [
    PREP,
    { name: 'Base', routine: 'complexion', adds: { foundation: 'match', foundationAmt: 50 }, note: 'A sheer layer, so her own skin shows through.' },
    { name: 'Brows & lashes', routine: 'brow_kohl', adds: { brow: '#6b4030', browAmt: 90, lashes: 'natural', shadow: '#d9aa4c', shadowAmt: 60 } },
    { name: 'Lips', routine: 'lips', adds: { lip: '#d9a3a0', lipAmt: 100, lipFinish: 'gloss' } },
    { name: 'Finish', routine: 'glow', adds: { blush: '#f4ae86', blushAmt: 95, contour: 'soft', contourAmt: 65, highlight: '#fff4e6', highlightAmt: 85 } },
  ] },
];

/**
 * Deep skin: the same look in shades that show on it (pale nudes and pinks swap for deeper ones
 * of the same family, and colour layers go on a little stronger). The skin itself is never lightened.
 */
const DEEP_SWAP = {
  lip: { '#d9a3a0': '#9a5b2e', '#c48b8b': '#8e2f5a', '#b0213f': '#62182f', '#b07a8c': '#6e2f55', '#7a4e36': '#62182f', '#f07c5f': '#c0603d' },
  blush: { '#f4ae86': '#c0603d', '#d9798a': '#a8432a', '#f07c5f': '#a8432a' },
  shadow: { '#a8743a': '#b8693a', '#8d7b6d': '#6e2f55' },
  highlight: { '#fff4e6': '#e0a96d', '#f3d9a4': '#d9aa4c' },
  liner: { '#3b2016': '#141414' },
};
export function adaptForDepth(choice, skinL) {
  if (typeof skinL !== 'number' || !(skinL < 52)) return { ...choice };
  const c = { ...choice };
  for (const [k, map] of Object.entries(DEEP_SWAP)) if (c[k] && map[c[k]]) c[k] = map[c[k]];
  for (const k of ['lip', 'blush', 'shadow']) if (c[k + 'Amt'] != null) c[k + 'Amt'] = Math.min(100, Math.round(c[k + 'Amt'] * 1.15));
  return c;
}

/** The layer settings after steps 0..k of a look (k is inclusive). */
export function choiceAfter(look, k) {
  const c = {};
  look.steps.slice(0, k + 1).forEach(s => Object.assign(c, s.adds));
  return c;
}

/** Plain words for what a step adds ("Lip colour: Dusty rose, Creme"). */
export function describeStep(step) {
  const a = step.adds; const out = [];
  if (a.foundation) out.push(`Foundation: ${a.foundation === 'match' ? 'matched to her skin' : name(FOUNDATION, a.foundation)}`);
  if (a.brow) out.push(`Brows: ${name(BROW, a.brow)}`);
  if (a.shadow) out.push(`Eyeshadow: ${name(SHADOW, a.shadow)}`);
  if (a.liner) out.push(`Liner: ${name(LINER, a.liner)}${a.linerStyle ? `, ${name(LINER_STYLE, a.linerStyle).toLowerCase()}` : ''}`);
  if (a.lashes) out.push(`Lashes: ${name(LASHES, a.lashes).toLowerCase()}`);
  if (a.lip) out.push(`Lips: ${name(LIP, a.lip)}${a.lipFinish ? `, ${name(LIP_FINISH, a.lipFinish).toLowerCase()}` : ''}`);
  if (a.blush) out.push(`Blush: ${name(BLUSH, a.blush)}`);
  if (a.contour) out.push('Contour: under the cheekbones and at the temples');
  if (a.highlight) out.push(`Highlight: ${name(HIGHLIGHT, a.highlight)}`);
  if (a.prep) out.push('Skin: moisturised, with a natural glow');
  return out;
}

// ---- photo sets (real before / step / after photos) ----------------------------------------------
const SAFE_ID = /^[a-z0-9][a-z0-9-]{0,40}$/;
const SAFE_FILE = /^[a-z0-9][a-z0-9._-]{0,60}\.(webp|jpg|jpeg|png)$/;

/**
 * Checks /beforeafter/manifest.json and returns only complete, safe sets, with full image paths.
 * A set needs an id, a before photo, an after photo and 3 to 5 named steps, each with its own photo.
 * The gallery stays hidden unless `enabled` is true and at least one set is complete.
 */
export function loadManifest(json) {
  const out = { enabled: false, models: [], skipped: [] };
  if (!json || typeof json !== 'object' || !Array.isArray(json.models)) return out;
  for (const m of json.models) {
    const id = String(m?.id ?? '');
    const why = !SAFE_ID.test(id) ? 'bad id'
      : !SAFE_FILE.test(String(m.before ?? '')) ? 'no before photo'
        : !SAFE_FILE.test(String(m.after ?? '')) ? 'no after photo'
          : !Array.isArray(m.steps) || m.steps.length < 3 || m.steps.length > 5 ? 'needs 3 to 5 steps'
            : m.steps.some(s => !String(s?.name ?? '').trim() || !SAFE_FILE.test(String(s?.image ?? ''))) ? 'a step is missing its name or photo' : '';
    if (why) { out.skipped.push({ id, why }); continue; }
    const p = f => `/beforeafter/${id}/${f}`;
    out.models.push({
      id, name: String(m.name ?? '').slice(0, 60), before: p(m.before), after: p(m.after),
      steps: m.steps.map(s => ({ name: String(s.name).slice(0, 40), image: p(s.image), note: String(s.note ?? '').slice(0, 200), routine: /^[a-z_]{1,20}$/.test(s.routine ?? '') ? s.routine : '' })),
    });
  }
  out.enabled = json.enabled === true && out.models.length > 0;
  return out;
}
