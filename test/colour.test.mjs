// Colour & Lip Studio (src/colour/studio.js): palette and lip look from the colour and lip guides.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildColourPlan, colourOptions, namedColours, palette, UNDERTONES, FORMULAS, LOOKS, FINISHES, LINERS, CARE,
} from '../src/colour/studio.js';
import { FITZPATRICK, MONK_TONES } from '../src/skin/clinic.js';
import { LIP_COLOUR_THEORY } from '../src/lip_colour_guide_extended.js';

const shown = p => { const { choices, ...rest } = p; return JSON.stringify(rest); };
const DEFAULTS = { fitzpatrick: 'V', undertone: 'warm', formula: 'harmony', look: 'nude', finish: 'satin', liner: 'basic_liner', care: 'daily', community: 'west_african', tone: 'mst7' };

test('options list every choice, with the 9 communities and 10 Monk tones', () => {
  const o = colourOptions();
  assert.equal(o.communities.length, 9);
  assert.equal(o.tones.length, 10);
  assert.deepEqual(o.formulas.map(f => f.id).sort(), ['complement', 'harmony', 'pop']);
  assert.deepEqual(o.finishes.map(f => f.id), ['matte', 'satin', 'gloss', 'glossy', 'vinyl', 'metallic', 'velvet']);
  assert.equal(o.looks.length, 5); assert.equal(o.liners.length, 6); assert.equal(o.care.length, 4);
  assert.ok(o.care.every(c => !('key' in c)));
});

test('the defaults are what an empty request gets, and bad values fall back to them', () => {
  assert.deepEqual(buildColourPlan({}).choices, DEFAULTS);
  assert.deepEqual(buildColourPlan({ fitzpatrick: 'IX', look: 'blue', finish: 3, liner: null, care: 'x', formula: {} }).choices, DEFAULTS);
});

test('every value of every choice changes the plan or the picture', () => {
  const values = {
    fitzpatrick: FITZPATRICK, undertone: UNDERTONES.map(x => x.id), formula: FORMULAS.map(x => x.id), look: LOOKS.map(x => x.id),
    finish: FINISHES.map(x => x.id), liner: LINERS.map(x => x.id), care: CARE.map(x => x.id),
    community: colourOptions().communities.map(c => c.id), tone: MONK_TONES.map(t => t.id),
  };
  const base = shown(buildColourPlan(DEFAULTS));
  for (const [k, list] of Object.entries(values)) {
    for (const v of list) {
      if (v === DEFAULTS[k]) continue;
      assert.notEqual(shown(buildColourPlan({ ...DEFAULTS, [k]: v })), base, `${k}=${v} changed nothing`);
    }
  }
});

test('namedColours reads colour words in order, longest match first, without overlaps', () => {
  assert.deepEqual(namedColours('Deep berry, brick red and rose gold').map(c => c.word), ['berry', 'brick red', 'rose gold']);
  assert.deepEqual(namedColours('nothing here'), []);
  assert.ok(namedColours('Plum').every(c => /^#[0-9a-f]{6}$/.test(c.hex)));
});

test('harmony is your own palette; pop sorts by contrast with the skin; complement leans toward the opposite hue', () => {
  const h = palette('harmony', 'cool', 'II', '#f3e7db');
  assert.deepEqual(h.colours.map(c => c.word).slice(0, 2), ['blue-red', 'berry']);
  const light = palette('pop', 'warm', 'II', '#f3e7db').colours[0];
  const dark = palette('pop', 'warm', 'II', '#292420').colours[0];
  assert.notEqual(light.word, dark.word);
  assert.ok(['cobalt', 'electric blue', 'emerald', 'silver'].includes(palette('complement', 'warm', 'V', '#825c43').colours[0].word));
  // cool skips "orange-based nudes, brassy gold": neither shows up in pop or complement
  for (const f of ['pop', 'complement']) assert.ok(!palette(f, 'cool', 'II', '#f3e7db').colours.some(c => ['orange', 'gold'].includes(c.word)));
});

test('deep skin uses the deep warm and deep cool rows; neutral stays neutral at every depth', () => {
  assert.match(buildColourPlan({ undertone: 'warm', fitzpatrick: 'VI' }).palette.undertone.label, /Deep Warm/);
  assert.match(buildColourPlan({ undertone: 'cool', fitzpatrick: 'V' }).palette.undertone.label, /Deep Cool/);
  assert.equal(buildColourPlan({ undertone: 'warm', fitzpatrick: 'III' }).palette.undertone.label, 'Warm');
  assert.equal(buildColourPlan({ undertone: 'neutral', fitzpatrick: 'VI' }).palette.undertone.label, 'Neutral');
});

test('the lip shade never clashes with the undertone, falling back to the undertone list when it must', () => {
  for (const look of LOOKS.map(l => l.id)) for (const fitzpatrick of FITZPATRICK) {
    const w = buildColourPlan({ look, fitzpatrick, undertone: 'warm' }).lips.shade;
    assert.ok(!/^(cool|blue)/.test(w.colour.word), `${look}/${fitzpatrick} warm got ${w.colour.word}`);
    const c = buildColourPlan({ look, fitzpatrick, undertone: 'cool' }).lips.shade;
    assert.ok(!/^(warm|orange|coral|peach|tomato|burnt)/.test(c.colour.word), `${look}/${fitzpatrick} cool got ${c.colour.word}`);
  }
  const fairWarmRed = buildColourPlan({ look: 'classic_red', fitzpatrick: 'I', undertone: 'warm' }).lips.shade;
  assert.equal(fairWarmRed.from, 'undertone'); assert.match(fairWarmRed.colour.word, /red/);
  assert.equal(buildColourPlan({ look: 'classic_red', fitzpatrick: 'I', undertone: 'cool' }).lips.shade.from, 'depth');
});

test('nudes follow depth; ombre has a lighter centre; the depth guidance is the guide row for that type', () => {
  const fair = buildColourPlan({ fitzpatrick: 'I', undertone: 'cool' }).lips.shade.colour.hex;
  const deepNude = buildColourPlan({ fitzpatrick: 'VI', undertone: 'cool' }).lips.shade.colour.hex;
  const l = h => [1, 3, 5].reduce((t, i) => t + parseInt(h.slice(i, i + 2), 16), 0);
  assert.ok(l(fair) > l(deepNude));
  const o = buildColourPlan({ look: 'ombre', fitzpatrick: 'V' }).lips.shade;
  assert.ok(o.centre && l(o.centre.hex) > l(o.colour.hex));
  assert.equal(buildColourPlan({ fitzpatrick: 'IV' }).lips.forDepth.nudes, LIP_COLOUR_THEORY.fitzpatrickGuidance.IV.nudes);
});

test('drying finishes warn only when lips are dry or thinning; darkening care affirms natural deep lip colour', () => {
  assert.match(buildColourPlan({ finish: 'matte', care: 'dry' }).finish.caution, /drying/);
  assert.match(buildColourPlan({ finish: 'matte', care: 'ageing' }).finish.caution, /drying/);
  assert.equal(buildColourPlan({ finish: 'matte', care: 'daily' }).finish.caution, null);
  assert.equal(buildColourPlan({ finish: 'gloss', care: 'dry' }).finish.caution, null);
  assert.match(buildColourPlan({ care: 'darkening', fitzpatrick: 'VI' }).care.natural, /NOT a skin concern/);
  assert.equal(buildColourPlan({ care: 'darkening', fitzpatrick: 'II' }).care.natural, null);
  assert.ok(buildColourPlan({ care: 'dry' }).care.sections.some(s => s.title === 'Do Not'));
});

test('community adds traditions and brands only; it never changes the palette or the shade', () => {
  const a = buildColourPlan({ community: 'south_asian' }); const b = buildColourPlan({ community: 'east_asian' });
  assert.deepEqual(a.palette, b.palette); assert.deepEqual(a.lips, b.lips);
  assert.ok(a.communityNotes.brands.some(x => x.name === 'Kulfi Beauty'));
  assert.ok(a.communityNotes.heritage.some(h => /Kohl/.test(h.product)));
  assert.equal(buildColourPlan({ community: 'westAfrican' }).community.id, 'west_african');
});
