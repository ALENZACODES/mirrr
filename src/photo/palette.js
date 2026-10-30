/**
 * Photo palettes: what a look puts on a real face, as colours the in-browser photo engine
 * (public/photo-engine.js) can lay on the user's own photo. Built from the look database's own
 * product lines (lip shade and finish, eyeshadow tones, liner style, blush, highlight, base finish),
 * so the photo shows the look the guide describes. Nudes and "your lips but better" shades are built
 * from the user's own skin colour, sampled in the browser (a colour, never the photo).
 */
import { LOOKS } from '../look_engine.js';
import { coloursIn, lipColour } from '../looks/studio.js';

const HEX = /^#?[0-9a-f]{6}$/i;
const normHex = h => (HEX.test(String(h ?? '')) ? `#${String(h).replace('#', '').toLowerCase()}` : null);
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgbHex = a => `#${a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
const mix = (a, b, t) => rgbHex(hexRgb(a).map((v, i) => v + (hexRgb(b)[i] - v) * t));
const DEFAULT_SKIN = '#8d5524';

/** The first option of an "x or y" shade, the way a person would pick it up first. */
const firstOption = s => String(s ?? '').split(/\s+or\s+|,|—|\//i)[0].trim();

const product = (look, cat) => look.products?.find(p => p.category === cat) ?? null;

export function linerStyle(style) {
  const s = String(style ?? '').toLowerCase();
  if (/graphic|geometric|art/.test(s)) return 'graphic';
  if (/cat/.test(s)) return 'cat';
  if (/wing|flick/.test(s)) return 'wing';
  if (/kohl|kajal|smok|smudg/.test(s)) return 'smudge';
  if (/none|no liner|bare/.test(s)) return 'none';
  return 'thin';
}

export function lipFinish(finish) {
  const f = String(finish ?? '').toLowerCase();
  if (/metallic|chrome|vinyl|lacquer/.test(f)) return 'shine';
  if (/gloss|glass|jelly|balm|glossy/.test(f)) return 'gloss';
  if (/matte/.test(f) && !/satin/.test(f)) return 'matte';
  return 'satin';
}

export function baseFinish(finish) {
  const f = String(finish ?? '').toLowerCase();
  if (/dewy|luminous|glow|glass|radiant/.test(f)) return 'luminous';
  if (/matte/.test(f) && !/satin/.test(f)) return 'matte';
  return 'satin';
}

const HIGHLIGHT = [[/gold|bronze/, '#d4a937'], [/champagne/, '#e8cfa0'], [/pearl|white|ice|silver|holographic/, '#ece4da'], [/rose/, '#e7b7a8']];

/**
 * The palette for one look. skinHex is the user's own sampled skin colour (optional).
 * Returns null for an unknown look.
 */
export function photoPalette(lookId, skinHex) {
  const look = LOOKS.find(l => l.id === lookId);
  if (!look) return null;
  const skin = normHex(skinHex) ?? DEFAULT_SKIN;
  const lipP = product(look, 'lip'), eyeP = product(look, 'eyeshadow'), linerP = product(look, 'liner');
  const blushP = product(look, 'blush'), hiP = product(look, 'highlight'), baseP = product(look, 'foundation');
  const lipShade = firstOption(lipP?.shade ?? 'your lips but better');
  const lipSw = /your[- ]lips?[- ]but[- ]better|ylbb|your-lip-shade|natural/i.test(lipShade)
    ? { hex: mix(skin, '#7a2a3a', 0.35), sheer: true }
    : lipColour(lipShade, skin);
  const lid = coloursIn((eyeP?.tones ?? []).join(', ')).slice(0, 3);
  const linerColour = coloursIn(linerP?.colour ?? '')[0] ?? (/brown/i.test(linerP?.colour ?? '') ? '#4a2c20' : '#111111');
  const warmth = look.weights?.warmth ?? 0.5;
  const blush = coloursIn(blushP?.shade ?? '')[0] ?? (warmth >= 0.6 ? mix('#c0603f', '#f2765b', 0.4) : '#c45a6a');
  const hiText = `${hiP?.finish ?? ''} ${hiP?.placement ?? ''}`.toLowerCase();
  const highlight = HIGHLIGHT.find(([re]) => re.test(hiText))?.[1] ?? (hiP ? '#f3ead8' : null);
  const style = linerStyle(linerP?.style);
  return {
    look: { id: look.id, name: look.name },
    lip: lipSw.hex, lipLabel: lipShade, lipSheer: Boolean(lipSw.sheer) || /sheer|stain|balm/i.test(lipP?.finish ?? ''),
    lipFinish: lipFinish(lipP?.finish),
    lid: lid.length ? lid : [mix(skin, '#3b2418', 0.3)],
    liner: style === 'none' ? null : linerColour, linerStyle: style,
    blush, highlight, baseFinish: baseFinish(baseP?.finish),
    intensity: Math.max(0.2, Math.min(1, look.weights?.intensity ?? 0.6)),
  };
}

/** Every look with a palette, for the try-on picker. */
export function photoLooks() {
  return LOOKS.map(l => ({ id: l.id, name: l.name }));
}

/** A palette from a studio's own picture (Look Book, Taste Leap, Colour Studio), checked and clamped. */
export function paletteFromPicture(pic = {}) {
  const lid = (Array.isArray(pic.lid) ? pic.lid : []).map(x => normHex(x?.hex ?? x)).filter(Boolean).slice(0, 3);
  return {
    lip: normHex(pic.lip), lipSheer: Boolean(pic.lipSheer), lipFinish: lipFinish(pic.lipFinish),
    lid, liner: pic.liner === 'none' ? null : normHex(pic.linerColour) ?? (pic.liner ? '#111111' : null), linerStyle: linerStyle(pic.liner),
    blush: normHex(pic.blush), highlight: normHex(pic.highlight), baseFinish: baseFinish(pic.baseFinish),
    intensity: Math.max(0.2, Math.min(1, Number(pic.intensity) || 0.6)),
  };
}
