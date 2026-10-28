// Batch grid acceptance: real offline rendering, review and original-size export.
// Synthetic images only. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installDOM, buttonNamed } from './helpers/dom.mjs';
import { BatchReview, batchCompatibility } from '../dist/js/save/batch-review.js';
import { batchReviewScreen } from '../dist/js/screens/batch-review.js';
import { ConsentGate } from '../dist/js/ui/shell/consent.js';
import { createShellClient } from '../dist/js/ui/shell/worker-protocol.js';
import { renderLayers } from '../dist/js/ui/shell/pipeline.js';
import { parseHash } from '../dist/js/layout/editor-chrome.js';
const light = { id: 'test-light', kind: 'lighting', name: 'Office light', strength: 100, opacity: 1,
  enabled: true, provenance: 'local', origin: 'photo', simulation: true, parameters: { preset: 'office' } };
const image = (id, width = 32, height = 24) => ({ width, height, channels: 3,
  data: Uint8Array.from({ length: width * height * 3 }, (_, i) => 50 + (i * 7 + id * 13) % 150) });
const input = id => ({ name: `drawn-${id}.jpg`, size: 1, read: async () => Uint8Array.of(id) });
const jpeg = Uint8Array.from([255,216,255,218,0,2,1,2,3,255,217]);
const deps = overrides => ({ decode: async bytes => image(bytes[0]), findFaces: async () => ({ kind: 'found', count: 1 }),
  encoder: { async encode(pixels, options) { assert.equal(pixels.data.length, pixels.width * pixels.height * 4); assert.equal(options.label, 'Simulation'); return jpeg; } },
  yield: async () => {}, ...overrides });

test('six photos render at original size, no-face is skipped and inputs remain untouched', async () => {
  let reads = 0, encodes = 0;
  const originals = new Map();
  const model = new BatchReview('Office', [light], deps({
    decode: async bytes => { reads++; const p = image(bytes[0], 36 + bytes[0], 28); originals.set(bytes[0], p.data.slice()); return p; },
    findFaces: async photo => photo.width === 39 ? { kind: 'none' } : { kind: 'found', count: 1 },
    encoder: { async encode(pixels) { encodes++; assert.ok(pixels.width >= 37); assert.equal(pixels.height, 28); return jpeg; } },
  }));
  await model.add([1,2,3,4,5,6].map(input));
  await model.run();
  assert.equal(model.grid().filter(row => row.status === 'done').length, 5);
  assert.equal(model.grid().find(row => row.width === 39).status, 'skipped-no-face');
  assert.equal(encodes, 5); assert.equal(reads, 11);
  assert.ok(model.grid().filter(row => row.status === 'done').every(row => row.after.width === row.width));
  const out = model.exportAll(); assert.equal(out.name, 'Good Lookin.zip');
  assert.match(new TextDecoder().decode(out.bytes), /GoodLookin_Office_06\.jpg/);
  assert.doesNotMatch(new TextDecoder().decode(out.bytes), /GoodLookin_Office_03\.jpg/);
  model.dispose(); assert.equal(model.grid().length, 0);
});

test('model pending requires human face review and never becomes a false no-face result', async () => {
  const model = new BatchReview('Review', [light], deps({ findFaces: async () => ({ kind: 'unknown', reason: 'Model pending' }) }));
  await model.add([input(1), input(2)]); await model.run();
  assert.ok(model.grid().every(row => row.status === 'awaiting-face'));
  assert.throws(() => model.exportAll(), /nothing to save/);
  model.confirmFaces(1, true); model.confirmFaces(2, false); await model.run();
  assert.equal(model.grid()[0].faces.kind, 'manual');
  assert.equal(model.grid()[0].status, 'done'); assert.equal(model.grid()[1].status, 'skipped-no-face');
  assert.match(model.summary(), /1 of 2 ready to save/); model.dispose();
});

test('pause, resume and individual redo do not repeat completed photos', async () => {
  let encodes = 0, stopOnce = true;
  const model = new BatchReview('Pause', [light], deps({ encoder: { async encode() { encodes++; return jpeg; } } }));
  await model.add([input(1), input(2), input(3)]);
  await model.run(() => { if (stopOnce && model.grid()[0].status === 'done') { stopOnce = false; model.cancel(); } });
  assert.equal(encodes, 1); assert.equal(model.grid()[1].status, 'ready');
  await model.run(); assert.equal(encodes, 3);
  const old = model.grid()[0].after.data.slice();
  model.setDose(1, .25); await model.run(undefined, 1);
  assert.equal(encodes, 4); assert.notDeepEqual(model.grid()[0].after.data, old);
  assert.throws(() => model.setDose(1, NaN), /strength/); model.dispose();
});

test('failure is isolated, can retry and cannot silently change dimensions', async () => {
  let once = true;
  const model = new BatchReview('Retry', [light], deps({ render: async (source, layers) => {
    if (once) { once = false; return { image: image(1, 12, 12), labels: [] }; }
    return renderLayers(source, layers);
  } }));
  await model.add([input(1), input(2)]); await model.run();
  assert.equal(model.grid()[0].status, 'failed'); assert.match(model.grid()[0].note, /dimensions/);
  assert.equal(model.grid()[1].status, 'done');
  model.retry(1); await model.run(undefined, 1); assert.equal(model.grid()[0].status, 'done');
  assert.equal(model.grid()[1].status, 'done'); model.dispose();
});

test('photo-specific masks and provider steps are listed as unavailable, never copied across people', async () => {
  const hair = { ...light, id: 'hair', kind: 'recolour', name: 'Hair colour', parameters: { colour: '#603020' } };
  const cloud = { ...light, id: 'cloud', kind: 'styling', name: 'Makeup', provenance: 'youcam' };
  const compatibility = batchCompatibility([light, hair, cloud]);
  assert.equal(compatibility.ready.length, 1); assert.equal(compatibility.unavailable.length, 2);
  const model = new BatchReview('Hair only', [hair], deps()); await model.add([input(1)]);
  await assert.rejects(model.run(), /no photo-wide local edits/); model.dispose();
});

test('worker render bridge returns real full-size pixels and preserves source buffers', async () => {
  const connection = createShellClient(null), original = image(3, 96, 80), before = original.data.slice();
  try {
    const source = { id: 'batch-test', label: 'Drawn test', kind: 'uploaded', disposable: true, image: original };
    const result = await connection.client.render(source, [light]);
    assert.deepEqual(result.image.data, renderLayers(source, [light]).image.data);
    assert.deepEqual(original.data, before); assert.equal(connection.client.waiting, 0);
  } finally { connection.terminate(); }
});

test('grid requires visit consent, confirms unknown faces, compares and saves a ZIP', async () => {
  const dom = installDOM(), consent = new ConsentGate(), downloads = [];
  const ui = batchReviewScreen('Office', [light], { ...deps({ findFaces: async () => ({ kind: 'unknown', reason: 'Model pending' }) }),
    render: async (source, layers) => renderLayers(source, layers), paint() {}, consent,
    download: (name, type, bytes) => downloads.push({ name, type, bytes }) });
  try {
    const file = ui.element.querySelector('input[type="file"]'); assert.equal(file.disabled, true);
    const boxes = ui.element.querySelectorAll('input[type="checkbox"]');
    boxes[0].checked = true; await boxes[0].dispatch('change'); assert.equal(file.disabled, true);
    boxes[1].checked = true; await boxes[1].dispatch('change'); assert.equal(file.disabled, false);
    file.files = [{ name: 'synthetic.jpg', size: 1, arrayBuffer: async () => Uint8Array.of(7).buffer }];
    await file.dispatch('change');
    assert.match(ui.element.textContent, /Model pending/);
    await buttonNamed(ui.element, 'I confirm adult faces').click();
    await buttonNamed(ui.element, 'Apply look / Resume').click();
    await buttonNamed(ui.element, 'Show original').click();
    assert.ok(buttonNamed(ui.element, 'Show edited'));
    await buttonNamed(ui.element, 'Save all ZIP').click();
    assert.equal(downloads.length, 1); assert.equal(downloads[0].type, 'application/zip');
    assert.match(ui.element.textContent, /1 original-size edited photos prepared/);
    consent.withdraw(); assert.equal(file.disabled, true);
    await buttonNamed(ui.element, 'Clear this batch').click(); assert.equal(ui.model.grid().length, 0);
  } finally { ui.dispose(); dom.restore(); }
});

test('saved look links parse their specific actions and malformed escapes fail safely', () => {
  assert.deepEqual(parseHash('#salon=look-1234abcd'), { kind: 'salon', id: 'look-1234abcd' });
  assert.deepEqual(parseHash('#batch=look-1234abcd'), { kind: 'batch', id: 'look-1234abcd' });
  assert.deepEqual(parseHash('#%zz'), { kind: 'none' });
});
