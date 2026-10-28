// W1/W2 screen acceptance. Synthetic reference pixels, actual extraction engine,
// real control listeners, denied-storage paths and no fetch. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM, buttonNamed } from './helpers/dom.mjs';
import { paletteScreen, regionFromPercent } from '../dist/js/screens/palettes.js';
import { PaletteLibrary, PALETTE_KEY } from '../dist/js/save/palettes.js';
import { ConsentGate } from '../dist/js/ui/shell/consent.js';
import { STEPS, routeReady } from '../dist/js/ctx.js';

const field = (root, label) => root.querySelectorAll('input').find(input => input.getAttribute('aria-label') === label)
  ?? root.querySelectorAll('select').find(input => input.getAttribute('aria-label') === label);
function gate(accepted = true) {
  const value = new ConsentGate(() => 1234567890);
  if (accepted) value.acceptVisit({ adult: true, understood: true });
  return value;
}
function store() {
  const data = new Map(); return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
}
function context(measured = null) { return { consent: false, localShade: measured ? { refused: false, measured_lab: measured } : null, go(route) { this.route = route; } }; }
function header(width = 32, height = 16) {
  const bytes = new Uint8Array(33), view = new DataView(bytes.buffer);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]); view.setUint32(8, 13); bytes.set([73, 72, 68, 82], 12);
  view.setUint32(16, width); view.setUint32(20, height); bytes[24] = 8; bytes[25] = 6; return bytes;
}
function reference() {
  const width = 32, height = 16, data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) data.set(x < 16 ? [200, 97, 37, 255] : [29, 65, 111, 255], (y * width + x) * 4);
  return { width, height, data };
}
function photoFile(bytes = header()) {
  return { name: 'private-reference-with-location.png', size: bytes.length, arrayBuffer: async () => bytes.slice().buffer };
}
async function change(root, name, value) { const input = field(root, name); assert.ok(input, name); input.value = value; await input.dispatch('change'); }
async function open(root, file = photoFile()) { const input = field(root, 'Reference photo'); input.files = [file]; await input.dispatch('change'); }

test('W1 digital mixing, role editing, swatch order and explicit save work without a photo', async () => {
  const dom = installDOM(), storage = store(), library = new PaletteLibrary(storage), priorFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('palette controls must not fetch'); };
  try {
    const screen = paletteScreen(context(), { library, consent: gate(false) }), root = screen.element;
    assert.match(root.textContent, /No photo is uploaded or changed/); assert.match(root.textContent, /No skin reading is available/);
    assert.equal(buttonNamed(root, 'Save palette').disabled, true);
    field(root, 'First mix colour').value = '#000000'; field(root, 'Second mix colour').value = '#ffffff';
    field(root, 'Second colour share').value = '50'; await field(root, 'Second colour share').dispatch('input');
    assert.match(root.querySelector('.palette-mix-result').textContent, /#BCBCBC/);
    field(root, 'New swatch name').value = 'My grey'; field(root, 'Role for new swatches').value = 'eyes';
    await buttonNamed(root, 'Add mix to palette').click();
    assert.equal(library.list().length, 0, 'adding to draft is not an automatic save');
    field(root, 'New swatch name').value = 'Second mix'; field(root, 'Role for new swatches').value = 'blush';
    await buttonNamed(root, 'Add mix to palette').click();
    await buttonNamed(root, 'Move Second mix up').click();
    assert.equal(field(root, 'Name for swatch 1').value, 'Second mix');
    field(root, 'Name for swatch 1').value = 'My rose'; field(root, 'Colour for swatch 1').value = '#a86264'; field(root, 'Role for swatch 1').value = 'lips';
    await buttonNamed(root, 'Apply edits to Second mix').click();
    field(root, 'Palette name').value = 'Evening choices'; await buttonNamed(root, 'Save palette').click();
    assert.equal(library.list()[0].name, 'Evening choices'); assert.equal(library.list()[0].swatches[0].role, 'lips');
    assert.equal(library.list()[0].swatches[0].hex, '#A86264');
    await buttonNamed(root, 'Remove My grey').click(); await buttonNamed(root, 'Save palette').click();
    assert.equal(library.list().length, 1); assert.equal(library.list()[0].swatches.length, 1);
    assert.ok(storage.data.get(PALETTE_KEY)); screen.dispose();
  } finally { dom.restore(); globalThis.fetch = priorFetch; }
});

test('W1 measured depth warnings and the chroma control never change a skin reading', async () => {
  const dom = installDOM(), measured = [25, 10, 8], ctx = context(measured), before = [...measured];
  try {
    const screen = paletteScreen(ctx, { library: new PaletteLibrary(null), consent: gate() }), root = screen.element;
    field(root, 'First mix colour').value = '#cccccc'; field(root, 'Second colour share').value = '0';
    await field(root, 'Second colour share').dispatch('input');
    assert.match(root.querySelector('.palette-mix-result').textContent, /may read ashy/);
    field(root, 'First mix colour').value = '#6f3f5d'; await field(root, 'First mix colour').dispatch('input');
    await buttonNamed(root, 'More chroma, same lightness').click();
    assert.match(root.querySelector('.palette-status').textContent, /lightness.*No face is changed|lightness.*no face is changed/);
    assert.deepEqual(measured, before); assert.deepEqual(ctx.localShade.measured_lab, before);
    assert.match(root.textContent, /Assumed photo-colour checks/); screen.dispose();
  } finally { dom.restore(); }
});

test('W2 refuses decode before both visit statements and unlocks the local reference input after consent', async () => {
  const dom = installDOM(); let decoded = 0;
  try {
    const consent = gate(false), ctx = context(), screen = paletteScreen(ctx, { library: new PaletteLibrary(null), consent,
      decoder: async () => { decoded++; return reference(); }, paint() {} }), root = screen.element;
    assert.equal(field(root, 'Reference photo').disabled, true);
    await open(root); assert.equal(decoded, 0); assert.match(root.textContent, /Confirm the two statements/);
    const statements = root.querySelectorAll('input').filter(input => input.getAttribute('type') === 'checkbox');
    statements[0].checked = true; await statements[0].dispatch('change'); assert.equal(field(root, 'Reference photo').disabled, true);
    statements[1].checked = true; await statements[1].dispatch('change'); assert.equal(field(root, 'Reference photo').disabled, false);
    assert.equal(ctx.consent, true); assert.equal(consent.hasVisit, true);
    await open(root); assert.equal(decoded, 1); assert.equal(buttonNamed(root, 'Extract region colours').disabled, false); screen.dispose();
  } finally { dom.restore(); }
});

test('W2 extracts an actual selected image region, adds its colour and clears only reference pixels', async () => {
  const dom = installDOM(), inputPixels = reference(), before = inputPixels.data.slice(), storage = store(), library = new PaletteLibrary(storage);
  const painted = [], previousFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('reference extraction is local'); };
  try {
    const screen = paletteScreen(context([30, 10, 8]), { library, consent: gate(), decoder: async () => inputPixels,
      paint: (_canvas, image) => painted.push({ width: image.width, height: image.height }) }), root = screen.element;
    await open(root); assert.match(root.textContent, /32 × 16 reference ready/); assert.equal(painted[0].width, 32);
    await change(root, 'Width percent', '50'); await change(root, 'Left percent', '50');
    field(root, 'Number of reference colours').value = '4'; await buttonNamed(root, 'Extract region colours').click();
    assert.match(root.querySelector('.palette-extracted').textContent, /#1D416F/);
    assert.doesNotMatch(root.querySelector('.palette-extracted').textContent, /#C86125/);
    assert.equal(root.querySelector('.palette-extracted').querySelectorAll('li').length, 1);
    field(root, 'Role for new swatches').value = 'eyes'; await buttonNamed(root, 'Add Reference 1').click();
    await buttonNamed(root, 'Save palette').click(); assert.equal(library.list()[0].swatches[0].hex, '#1D416F');
    await buttonNamed(root, 'Clear reference photo').click();
    assert.equal(buttonNamed(root, 'Extract region colours').disabled, true); assert.equal(root.querySelector('canvas').hidden, true);
    assert.equal(root.querySelector('.palette-extracted').children.length, 0); assert.ok(buttonNamed(root, 'Remove Reference 1'));
    assert.deepEqual(inputPixels.data, before); const raw = storage.data.get(PALETTE_KEY);
    for (const secret of ['private-reference', 'measured_lab', 'data:image', 'blob:', 'latitude']) assert.ok(!raw.includes(secret));
    screen.dispose();
  } finally { dom.restore(); globalThis.fetch = previousFetch; }
});

test('W2 invalid regions, giant files and corrupt references produce usable error states', async () => {
  const dom = installDOM(); let reads = 0, decoded = 0;
  try {
    const screen = paletteScreen(context(), { library: new PaletteLibrary(null), consent: gate(), decoder: async () => { decoded++; return reference(); }, paint() {} }), root = screen.element;
    await open(root, { size: 26 * 1024 * 1024, arrayBuffer: async () => { reads++; return header().buffer; } });
    assert.equal(reads, 0); assert.equal(decoded, 0); assert.match(root.textContent, /no larger than 25 MB/);
    await open(root, photoFile(new Uint8Array([1, 2, 3]))); assert.equal(decoded, 0); assert.match(root.textContent, /Only JPEG, PNG and WEBP/);
    await open(root); await change(root, 'Left percent', '75');
    assert.equal(buttonNamed(root, 'Extract region colours').disabled, true); assert.match(root.textContent, /at most 100 percent/);
    await change(root, 'Width percent', '25'); assert.equal(buttonNamed(root, 'Extract region colours').disabled, false);
    await buttonNamed(root, 'Extract region colours').click(); assert.match(root.querySelector('.palette-extracted').textContent, /#1D416F/);
    screen.dispose();
  } finally { dom.restore(); }
});

test('W1 exports drafts without saving and imports a new colour-only copy with denied storage', async () => {
  const dom = installDOM(), downloads = [], library = new PaletteLibrary(null);
  try {
    const screen = paletteScreen(context(), { library, consent: gate(), download: (name, mime, bytes) => downloads.push({ name, mime, bytes }) }), root = screen.element;
    await buttonNamed(root, 'Add mix to palette').click(); await buttonNamed(root, 'Export draft colours').click();
    assert.equal(library.list().length, 0); assert.equal(downloads.length, 1);
    const text = new TextDecoder().decode(downloads[0].bytes), exported = JSON.parse(text);
    assert.equal(exported.swatches[0].role, 'lips'); assert.equal(downloads[0].mime, 'application/json');
    assert.deepEqual(Object.keys(exported).sort(), ['created', 'format', 'id', 'name', 'swatches']);
    const input = field(root, 'Import palette colour file'); input.files = [{ size: text.length, text: async () => text }];
    await input.dispatch('change'); assert.equal(library.list().length, 1);
    assert.match(root.querySelector('.palette-status').textContent, /Imported as a new palette.*only in this page/);
    await buttonNamed(root, 'Save palette').click(); assert.equal(library.list().length, 1);
    await buttonNamed(root, 'Save as new palette').click(); assert.equal(library.list().length, 2);
    await buttonNamed(root, 'Clear all saved palettes').click(); assert.equal(library.list().length, 0);
    assert.match(root.querySelector('.palette-status').textContent, /may reappear after reload/); screen.dispose();
  } finally { dom.restore(); }
});

test('W1 invalid edits and malicious colour files cannot replace the saved library', async () => {
  const dom = installDOM(), library = new PaletteLibrary(store());
  try {
    const screen = paletteScreen(context(), { library, consent: gate() }), root = screen.element;
    await buttonNamed(root, 'Add mix to palette').click(); await buttonNamed(root, 'Save palette').click();
    const saved = library.list(); field(root, 'Name for swatch 1').value = ''; await buttonNamed(root, 'Apply edits to My mix').click();
    assert.match(root.querySelector('.palette-status').textContent, /Swatch name needs/); assert.deepEqual(library.list(), saved);
    const bad = JSON.stringify({ ...saved[0], photo: 'data:image/png;base64,fake' }), input = field(root, 'Import palette colour file');
    input.files = [{ size: bad.length, text: async () => bad }]; await input.dispatch('change');
    assert.match(root.querySelector('.palette-status').textContent, /unexpected fields/); assert.deepEqual(library.list(), saved);
    await buttonNamed(root, 'New empty draft').click(); assert.equal(buttonNamed(root, 'Save palette').disabled, true);
    await buttonNamed(root, 'Load My palette').click(); assert.ok(buttonNamed(root, 'Remove My mix'));
    await buttonNamed(root, 'Delete My palette').click(); assert.equal(library.list().length, 0);
    assert.match(root.querySelector('.palette-status').textContent, /Removed from this device/); screen.dispose();
  } finally { dom.restore(); }
});

test('leaving or clearing a palette screen during decode cannot resurrect a reference photo', async () => {
  const dom = installDOM(); let complete;
  try {
    const screen = paletteScreen(context(), { library: new PaletteLibrary(null), consent: gate(), decoder: () => new Promise(resolve => { complete = resolve; }), paint() {} });
    const root = screen.element, pending = open(root); await Promise.resolve(); await Promise.resolve();
    assert.ok(complete); await buttonNamed(root, 'Clear reference photo').click(); complete(reference()); await pending;
    assert.equal(root.querySelector('canvas').hidden, true); assert.equal(buttonNamed(root, 'Extract region colours').disabled, true);
    assert.match(root.textContent, /Reference pixels cleared/);
    const pendingAgain = open(root); await Promise.resolve(); await Promise.resolve(); screen.dispose(); complete(reference()); await pendingAgain;
    assert.equal(root.querySelector('canvas').hidden, true); assert.equal(buttonNamed(root, 'Extract region colours').disabled, true);
  } finally { dom.restore(); }
});

test('Palettes is an accessible route without a server photo and region math stays in bounds', () => {
  assert.ok(STEPS.some(step => step.route === 'palettes' && step.label === 'Palettes'));
  const main = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8'), shade = readFileSync(new URL('../src/screens/shade.ts', import.meta.url), 'utf8');
  assert.equal(routeReady({ photo: null, photoSrc: null, consent: false }, 'palettes'), true);
  assert.match(main, /routeReady\(ctx, r\)/); assert.match(main, /case "palettes": disposeScreen = renderPalettes/);
  assert.match(main, /disposeScreen\?\.\(\)/); assert.match(shade, /#\/palettes/);
  assert.deepEqual(regionFromPercent({ width: 31, height: 17 }, 50, 0, 50, 100), { x: 15, y: 0, width: 16, height: 17 });
  assert.throws(() => regionFromPercent({ width: 31, height: 17 }, 50, 0, 51, 100));
  assert.throws(() => regionFromPercent({ width: 31, height: 17 }, NaN, 0, 50, 100));
  const styles = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(styles, /palette-screen :focus-visible \{ outline: 3px solid #000091/);
  assert.match(styles, /palette-screen \.btn \{ min-height: 44px/);
});
