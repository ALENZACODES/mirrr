// W1/W2 real colour math, bounded extraction and preference-storage contracts.
// All pixels are generated here. No network, model or face files. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mixColours, moreChroma, fromHex, gamutColour, assessShade, validLab } from '../dist/js/engines/palette/colour.js';
import { extractPalette, paletteRegion } from '../dist/js/engines/palette/extract.js';
import { PaletteLibrary, PALETTE_KEY, MAX_PALETTE_FILE, parsePalette, paletteText, validatePalette, browserPalettes } from '../dist/js/save/palettes.js';

function pixels(width, height, pixel, channels = 4) {
  const data = new Uint8Array(width * height * channels);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) data.set(pixel(x, y).slice(0, channels), (y * width + x) * channels);
  return { width, height, channels, data };
}
function memory() {
  const values = new Map();
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
const swatches = () => [
  { id: 'swatch-1', name: 'My berry', hex: '#893f64', role: 'lips' },
  { id: 'swatch-2', name: 'My earth', hex: '#6f5044', role: 'eyes' },
  { id: 'swatch-3', name: 'My rose', hex: '#a86264', role: 'blush' },
];
const date = () => new Date('2026-10-23T12:00:00Z');

test('W1 mixes in linear light with exact endpoints and labels its digital scope', () => {
  const mix = mixColours('#000000', '#FFFFFF', .5);
  assert.equal(mix.hex, '#BCBCBC', 'half the light is about sRGB 188, not encoded midpoint 128');
  assert.equal(mixColours('#893f64', '#b96b43', 0).hex, '#893F64');
  assert.equal(mixColours('#893f64', '#b96b43', 1).hex, '#B96B43');
  assert.match(mix.label, /Not a pigment recipe/);
  for (const bad of [-1, 1.1, NaN, Infinity]) assert.throws(() => mixColours('#000000', '#FFFFFF', bad));
  assert.throws(() => mixColours('not-a-colour', '#FFFFFF', .5));
});

test('W1 chroma edits keep swatch depth, including saturated and deep colours', () => {
  for (const hex of ['#693C57', '#8C5944', '#3B2734', '#FF0000', '#0000FF', '#00FF00']) {
    const before = fromHex(hex), after = moreChroma(hex, 2);
    assert.equal(after.requestedLab[0], before[0]);
    assert.ok(Math.abs(after.lab[0] - before[0]) < .25, `${hex} byte rounding preserves depth`);
    assert.ok(Math.hypot(after.lab[1], after.lab[2]) >= Math.hypot(before[1], before[2]) - .5);
    assert.ok(after.chromaScale > 0 && after.chromaScale <= 1);
  }
  assert.throws(() => moreChroma('#333333', .9));
  assert.throws(() => moreChroma('#333333', 2.1));
});

test('gamut mapping retains requested lightness and hue while refusing invalid Lab', () => {
  const out = gamutColour([28, 220, -120]);
  assert.ok(out.gamutReduced); assert.ok(out.chromaScale < 1);
  assert.deepEqual(out.requestedLab, [28, 220, -120]);
  assert.ok(Math.abs(out.lab[0] - 28) < .25);
  assert.ok(Math.abs(Math.atan2(out.lab[2], out.lab[1]) - Math.atan2(-120, 220)) < .02);
  assert.equal(gamutColour(fromHex('#FFFFFF')).hex, '#FFFFFF');
  assert.equal(gamutColour([0, 0, 0]).hex, '#000000');
  for (const bad of [[-1, 0, 0], [101, 0, 0], [50, NaN, 0], [50, 500, 0], [50], [100.001, 0, 0]]) assert.throws(() => validLab(bad));
});

test('depth checks disclose assumptions, need measured skin, and never mutate a reading', () => {
  const skin = [25, 10, 8], before = [...skin];
  assert.deepEqual(assessShade('#CCCCCC', skin).flags, ['may_read_ashy']);
  assert.ok(assessShade('#D57332', skin).flags.includes('may_read_orange'));
  const unknown = assessShade('#CCCCCC');
  assert.equal(unknown.measured, false); assert.equal(unknown.deltaE, null); assert.deepEqual(unknown.flags, []);
  assert.match(unknown.notes.join(' '), /No depth-based suitability claim/);
  const passed = assessShade('#573D44', skin);
  assert.deepEqual(passed.flags, []); assert.match(passed.notes.join(' '), /not a guarantee/);
  assert.match(passed.label, /Assumed.*face is never lightened/); assert.deepEqual(skin, before);
});

test('W2 extracts true block colours and area shares from synthetic source pixels', () => {
  const image = pixels(64, 24, x => x < 32 ? [137, 63, 100, 255] : x < 48 ? [185, 107, 67, 255] : [42, 63, 105, 255]);
  const before = Uint8Array.from(image.data), out = extractPalette(image, { colours: 3 });
  assert.equal(out.sampled, 1536); assert.equal(out.colours.length, 3);
  assert.equal(out.colours.find(c => c.hex === '#893F64').share, .5);
  assert.equal(out.colours.find(c => c.hex === '#B96B43').share, .25);
  assert.equal(out.colours.find(c => c.hex === '#2A3F69').share, .25);
  assert.ok(out.meanDeltaE < 1e-8); assert.match(out.label, /not tested against real products/);
  assert.equal(out.assumed, true); assert.deepEqual(image.data, before);
});

test('W2 uniform references return one measured colour, without invented extra swatches', () => {
  for (const value of [0, 127, 255]) {
    const out = extractPalette(pixels(16, 16, () => [value, value, value, 255]), { colours: 8 });
    assert.equal(out.colours.length, 1); assert.equal(out.colours[0].share, 1);
    assert.equal(out.colours[0].hex, '#' + value.toString(16).padStart(2, '0').repeat(3).toUpperCase());
  }
});

test('W2 region selection excludes the other half and accepts RGB inputs', () => {
  const image = pixels(32, 16, x => x < 16 ? [18, 65, 116, 255] : [204, 71, 94, 255], 3);
  const region = { x: 16, y: 0, width: 16, height: 16 }, before = { ...region };
  const out = extractPalette(image, { region, colours: 4 });
  assert.equal(out.colours.length, 1); assert.equal(out.colours[0].hex, '#CC475E');
  assert.equal(out.sampled, 256); assert.deepEqual(out.region, region); assert.deepEqual(region, before);
  for (const bad of [{ ...region, x: -1 }, { ...region, x: 17 }, { ...region, width: 0 }, { ...region, y: .1 }]) assert.throws(() => paletteRegion(image, bad));
});

test('W2 ignores transparent background and weights visible semitransparent colour', () => {
  const image = pixels(16, 16, x => x < 8 ? [255, 0, 0, 255] : [0, 0, 255, 128]);
  const out = extractPalette(image, { colours: 2 });
  assert.ok(Math.abs(out.colours.find(c => c.hex === '#FF0000').share - 255 / 383) < 1e-12);
  assert.ok(Math.abs(out.colours.reduce((total, c) => total + c.share, 0) - 1) < 1e-12);
  const cutout = extractPalette(pixels(16, 16, x => x < 8 ? [255, 0, 0, 255] : [0, 255, 0, 127]));
  assert.equal(cutout.transparentSkipped, 128); assert.equal(cutout.sampled, 128);
  assert.deepEqual(cutout.colours.map(c => c.hex), ['#FF0000']);
  assert.throws(() => extractPalette(pixels(16, 16, () => [0, 255, 0, 0])), /No visible pixels/);
});

test('W2 reported error includes within-bin variation and falls with more actual colours', () => {
  const subtle = extractPalette(pixels(16, 16, x => x < 8 ? [100, 100, 100, 255] : [103, 103, 103, 255]), { colours: 1 });
  assert.ok(subtle.meanDeltaE > .3, 'the 5-bit clustering bin does not erase source error');
  const two = pixels(16, 16, x => x < 8 ? [15, 50, 90, 255] : [220, 75, 30, 255]);
  const one = extractPalette(two, { colours: 1 }), enough = extractPalette(two, { colours: 2 });
  assert.ok(one.meanDeltaE > 15); assert.ok(enough.meanDeltaE < 1e-8);
});

test('W2 sampling and clustering are bounded, deterministic and do not call random or fetch', () => {
  const image = pixels(400, 240, (x, y) => [(x * 31 + y * 7) % 256, (x * 11 + y * 23) % 256, (x * 3 + y * 17) % 256, 255]);
  const oldRandom = Math.random, oldFetch = globalThis.fetch;
  Math.random = () => { throw new Error('randomness is not needed'); }; globalThis.fetch = () => { throw new Error('no network'); };
  try {
    const a = extractPalette(image, { colours: 8, maxSamples: 512 }), b = extractPalette(image, { colours: 8, maxSamples: 512 });
    assert.deepEqual(a, b); assert.equal(a.sampled, 512); assert.ok(a.iterations <= 16); assert.ok(a.colours.length <= 8);
    assert.ok(a.meanDeltaE >= 0 && Number.isFinite(a.meanDeltaE));
  } finally { Math.random = oldRandom; globalThis.fetch = oldFetch; }
});

test('W2 rejects malformed buffers, unbounded counts, budgets and regions before extraction', () => {
  const image = pixels(16, 16, () => [120, 80, 60, 255]);
  for (const options of [{ colours: 0 }, { colours: 9 }, { colours: 2.5 }, { maxSamples: 63 }, { maxSamples: 16385 }, { region: { x: 0, y: 0, width: 32, height: 16 } }]) assert.throws(() => extractPalette(image, options));
  for (const bad of [{ ...image, width: 0 }, { ...image, width: 16.1 }, { ...image, channels: 2 }, { ...image, data: image.data.subarray(1) }]) assert.throws(() => extractPalette(bad));
});

test('W1 save, update, immutable reads and reload preserve only colour preferences', () => {
  const storage = memory(), library = new PaletteLibrary(storage, date), source = swatches();
  const saved = library.save('My evening', source); assert.equal(saved.stored, true); assert.equal(saved.palette.swatches[0].hex, '#893F64');
  source[0].hex = '#FFFFFF'; const read = library.list(); read[0].swatches[0].hex = '#000000';
  assert.equal(library.get(saved.palette.id).swatches[0].hex, '#893F64');
  const update = library.save('Changed name', swatches().slice(0, 2), saved.palette.id);
  assert.equal(update.palette.id, saved.palette.id); assert.equal(update.palette.created, saved.palette.created);
  assert.equal(library.list().length, 1); assert.equal(new PaletteLibrary(storage, date).list()[0].name, 'Changed name');
  const raw = storage.values.get(PALETTE_KEY);
  for (const forbidden of ['photo', 'measured_lab', 'blob:', 'filename', 'landmarks', 'data:image']) assert.ok(!raw.includes(forbidden));
  assert.deepEqual(Object.keys(JSON.parse(raw)[0]).sort(), ['created', 'format', 'id', 'name', 'swatches']);
});

test('palette JSON import validates shape, rejects embedded assets and imports as a new copy', () => {
  const library = new PaletteLibrary(memory(), date), original = library.save('Été', swatches()).palette;
  const text = paletteText(original), imported = library.import(text).palette;
  assert.notEqual(imported.id, original.id); assert.equal(imported.name, 'Été'); assert.deepEqual(imported.swatches, original.swatches);
  for (const changed of [
    { ...original, photo: 'data:image/png;base64,no' }, { ...original, name: 'https://example.test' },
    { ...original, swatches: [{ ...swatches()[0], url: 'https://example.test' }] },
    { ...original, swatches: [{ ...swatches()[0], role: 'foundation' }] },
    { ...original, swatches: [{ ...swatches()[0], hex: '#FFF' }] },
    { ...original, swatches: [swatches()[0], swatches()[0]] }, { ...original, created: 'not-a-date' },
  ]) assert.throws(() => validatePalette(changed));
  assert.throws(() => parsePalette('not json')); assert.throws(() => parsePalette(' '.repeat(MAX_PALETTE_FILE + 1)), /too large/);
});

test('storage denial keeps saves in memory and deletion honestly reports reload risk', () => {
  const denied = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); } };
  const library = new PaletteLibrary(denied, date), result = library.save('Only here', swatches());
  assert.equal(result.stored, false); assert.match(result.note, /only in this page/); assert.equal(library.list().length, 1);
  const removed = library.remove(result.palette.id); assert.equal(removed.removed, true); assert.equal(removed.stored, false);
  assert.equal(library.list().length, 0); assert.match(library.note, /may reappear after reload/);
});

test('saved palette recovery ignores invalid rows and enforces palette and swatch bounds', () => {
  const storage = memory(), seed = new PaletteLibrary(null, date).save('Valid', swatches()).palette;
  storage.values.set(PALETTE_KEY, JSON.stringify([seed, { image: 'bad' }]));
  const library = new PaletteLibrary(storage, date); assert.equal(library.list().length, 1); assert.match(library.note, /invalid saved palette/);
  for (let i = 0; i < 23; i++) library.save('Palette ' + i, swatches());
  assert.throws(() => library.save('Too many', swatches()), /at most 24/);
  assert.throws(() => new PaletteLibrary(null, date).save('Empty', []));
  const nineteen = Array.from({ length: 19 }, (_, i) => ({ ...swatches()[0], id: 'swatch-' + i }));
  assert.throws(() => new PaletteLibrary(null, date).save('Too many colours', nineteen), /1 to 18/);
  assert.equal(library.clear().removed, 24); assert.equal(storage.values.has(PALETTE_KEY), false);
});

test('a denied browser storage getter still permits palette export and editing', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('blocked'); } });
  try {
    const library = browserPalettes(), saved = library.save('Temporary', swatches());
    assert.equal(saved.stored, false); assert.equal(parsePalette(paletteText(saved.palette)).name, 'Temporary');
  } finally { if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor); else delete globalThis.localStorage; }
});
