// Production heroes use real local algorithms on an openly drawn synthetic face.
// Missing geometry refuses; no test uses a real person's face. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installDOM, buttonNamed } from './helpers/dom.mjs';
import { Editor } from '../dist/js/ui/shell/controller.js';
import { ShellGpuRenderer } from '../dist/js/ui/shell/gpu-renderer.js';
import { heroAppearanceScreen, chooseAppearance, matchingFaceFixture } from '../dist/js/screens/hero-appearance.js';
import { makeSample } from '../dist/js/ui/shell/demo.js';
import { scaleSource } from '../dist/js/ui/shell/scale.js';
import { stepsFromLayers } from '../dist/js/layout/my-looks.js';
import { recipeSteps } from '../dist/js/layout/editor-chrome.js';
import { validateStep } from '../dist/js/save/validate.js';
function editor() {
  const e = new Editor('portrait', new ShellGpuRenderer(null));
  e.load(scaleSource(makeSample('portrait'), 120)); return e;
}
function fixture(source) {
  return { format: 'beljour-vision-fixture/1', version: 1,
    source: { releaseRef: 'synthetic-test', released: true, captureMode: 'local-model', author: 'John Khan' },
    image: { sha256: 'a'.repeat(64), width: source.image.width, height: source.image.height },
    faces: [{ id: 'drawn-face', landmarks: source.face.map(([x,y]) => [x/source.image.width,y/source.image.height,0]), blendshapes: {},
      pose: { rollDegrees: 0, yawDegrees: 0, pitchDegrees: 0, interOcularDistance: .2, faceWidth: .5, confidence: 'estimate' } }],
    pose: { landmarks: null }, masks: [] };
}

test('Older and Younger controls produce different real pixels while keeping the source and undo', async () => {
  const dom = installDOM(), e = editor();
  try {
    const before = e.source.image.data.slice();
    e.selectStudio('older');
    const old = heroAppearanceScreen(e, () => {});
    assert.equal(old.querySelectorAll('button').filter(b => /^Older \d/.test(b.textContent)).length, 5);
    await buttonNamed(old, 'Older 3').click();
    const older = e.rendered(); assert.notDeepEqual(older.image.data, before);
    assert.equal(older.metrics[0].age_prediction, false);
    e.undo(); assert.equal(e.document.layers.length, 0);
    e.selectStudio('younger'); const young = heroAppearanceScreen(e, () => {});
    assert.equal(young.querySelectorAll('button').filter(b => /^Younger \d/.test(b.textContent)).length, 3);
    await buttonNamed(young, 'Younger 2').click();
    const younger = e.rendered(); assert.notDeepEqual(younger.image.data, before);
    assert.notDeepEqual(younger.image.data, older.image.data);
    assert.deepEqual(e.source.image.data, before);
  } finally { e.dispose(); dom.restore(); }
});

test('gender directions use the guarded raster and original is byte-exact', async () => {
  const dom = installDOM(), e = editor();
  try {
    e.selectStudio('gender'); const ui = heroAppearanceScreen(e, () => {});
    await buttonNamed(ui, 'Normal feminine').click(); const feminine = e.rendered();
    assert.equal(feminine.metrics[0].direction, 'feminine');
    assert.equal(feminine.metrics[0].validated_on_released_photos, false);
    assert.ok(feminine.metrics[0].min_jacobian > .2);
    await buttonNamed(ui, 'Normal masculine').click(); const masculine = e.rendered();
    assert.notDeepEqual(masculine.image.data, feminine.image.data);
    await buttonNamed(ui, 'Original').click(); assert.deepEqual(e.rendered().image.data, e.source.image.data);
    assert.equal(e.document.layers.length, 1);
    const steps = recipeSteps(stepsFromLayers(e.document.layers));
    assert.equal(validateStep(steps[0], 'test').tool, 'gender');
    assert.doesNotMatch(JSON.stringify(steps), /landmarks|fileSha256|data/);
  } finally { e.dispose(); dom.restore(); }
});

test('unrecorded photo blocks every hero control and a pending model never creates geometry', async () => {
  const dom = installDOM(), e = editor();
  try {
    const source = { ...e.source, kind: 'uploaded', id: 'upload:synthetic', face: undefined };
    e.load(source, 'gender');
    let detections = 0;
    const ui = heroAppearanceScreen(e, () => {}, { consent: () => true, detect: async () => {
      detections++; return { ok: false, source: 'manual', error: 'Face model licence pending' };
    } });
    assert.equal(buttonNamed(ui, 'Normal feminine').disabled, true);
    assert.throws(() => e.add('older'), /face points|recorded points/i);
    await buttonNamed(ui, 'Find face points on this device').click();
    assert.equal(detections, 1); assert.equal(e.source.face, undefined);
    assert.match(ui.textContent, /licence pending/);
    assert.equal(e.document.layers.length, 0);
  } finally { e.dispose(); dom.restore(); }
});

test('approved local detections require an explicit face choice and reset stale layers', async () => {
  const dom = installDOM(), e = editor();
  try {
    const mesh = e.source.face, width = e.source.image.width, height = e.source.image.height;
    e.load({ ...e.source, kind: 'uploaded', id: 'upload:synthetic', face: undefined }, 'older');
    e.add('enhance');
    const ui = heroAppearanceScreen(e, () => {}, { consent: () => true, detect: async () => ({ ok: true, source: 'local-model',
      faces: [{ id: 'local-face', landmarks: mesh.map(([x,y]) => ({x:x/width,y:y/height,z:0})) }] }) });
    await buttonNamed(ui, 'Find face points on this device').click(); assert.equal(e.source.face, undefined);
    await buttonNamed(ui, 'Use face 1').click();
    assert.equal(e.source.face.length, 478); assert.equal(e.document.layers.length, 0);
    for (let i = 0; i < mesh.length; i++) for (let c = 0; c < 2; c++) assert.ok(Math.abs(e.source.face[i][c] - mesh[i][c]) < 1e-10);
    chooseAppearance(e, 'older', 1); assert.equal(e.document.layers.length, 1);
  } finally { e.dispose(); dom.restore(); }
});

test('recorded fixture must match the exact original hash and orientation', async () => {
  const e = editor();
  try {
    const source = { ...e.source, kind: 'uploaded', fileSha256: 'a'.repeat(64), fileDimensions: [e.source.image.width, e.source.image.height] };
    const record = fixture(source);
    assert.equal((await matchingFaceFixture(record, source)).faces.length, 1);
    await assert.rejects(matchingFaceFixture({ ...record, image: { ...record.image, sha256: 'b'.repeat(64) } }, source), /SHA-256 mismatch/);
    await assert.rejects(matchingFaceFixture(record, { ...source, fileDimensions: [64,64] }), /orientation/);
    await assert.rejects(matchingFaceFixture(record, { ...source, fileSha256: undefined }), /Reopen/);
    await assert.rejects(matchingFaceFixture({ ...record, source: { ...record.source, captureMode: 'manual' } }, source), /cannot manufacture/);
  } finally { e.dispose(); }
});

test('document subscriptions signal actual document and geometry changes, stop after cleanup', () => {
  const e = editor(); let count = 0; const off = e.subscribe(() => count++);
  e.selectStudio('gender'); e.add('gender'); e.undo(); e.redo();
  assert.equal(count, 4);
  e.setShowBefore(true); e.preview(); assert.equal(count, 4);
  e.setFace(e.source.face); assert.equal(count, 5);
  off(); e.selectStudio('enhance'); assert.equal(count, 5);
  assert.throws(() => e.setFace([[1,1]]), /478/);
  e.dispose();
});
