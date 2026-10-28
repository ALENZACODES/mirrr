// Multi-face editing: each face's edits stay inside that face's oval, faces without edits and
// everything outside the edited faces keep their exact bytes, alpha is untouched, and refusals
// are coded. Group photos here are drawn: a dark striped backdrop with skin ovals painted on
// face points made by scaling and moving the drawn portrait sample's recorded points.
// Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Editor } from '../dist/js/ui/shell/controller.js';
import { ShellGpuRenderer } from '../dist/js/ui/shell/gpu-renderer.js';
import { regionMask } from '../dist/js/data/regions/index.js';
import * as M from '../dist/js/save/multi-face.js';

const W = 600, H = 336;
const portrait = new Editor('portrait', new ShellGpuRenderer(null));
const base = portrait.source.face;
const placed = (dx, dy = 40, s = 0.8) => base.map(([x, y]) => [x * s + dx, y * s + dy]);
const TWO = [placed(10), placed(310)];

function group(faces, channels = 4) {
  const data = new Uint8Array(W * H * channels);
  for (let i = 0; i < W * H; i++) {
    const x = i % W, y = (i / W) | 0;
    data[i * channels] = 30 + ((x >> 3) % 2) * 20; data[i * channels + 1] = 28 + ((y >> 3) % 2) * 15; data[i * channels + 2] = 40;
    if (channels === 4) data[i * 4 + 3] = x < 8 ? 120 : 255;
  }
  for (const face of faces) {
    const oval = regionMask('face_oval', face, W, H, { normalized: false, supersample: 2 }).data;
    for (let i = 0; i < W * H; i++) if (oval[i] > 0.5) {
      data[i * channels] = 120 + (i % 5) * 4; data[i * channels + 1] = 84 + ((i / W | 0) % 3) * 5; data[i * channels + 2] = 66;
    }
  }
  return { ...portrait.source, id: 'drawn-group', kind: 'sample', image: { width: W, height: H, channels, data }, face: faces[0] };
}
/** Layers made the normal way, in an editor attached to that face's points. */
function layers(kind, params = {}, strength = 80) {
  const editor = new Editor('portrait', new ShellGpuRenderer(null));
  try { editor.add(kind, params, strength); return editor.document.layers; } finally { editor.dispose(); }
}
function changedMask(a, b, channels) {
  const out = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) for (let c = 0; c < channels; c++) if (a[i * channels + c] !== b[i * channels + c]) { out[i] = 1; break; }
  return out;
}
const count = (mask) => mask.reduce((s, v) => s + v, 0);

test('one face edited: changes stay inside its oval, the other face and the backdrop keep exact bytes', () => {
  const source = group(TWO), before = Uint8Array.from(source.image.data);
  const session = new M.MultiFaceEdit(source, TWO);
  session.setEdits(0, layers('enhance', { mode: 'natural' }, 100));
  const result = session.render();
  const changed = changedMask(before, result.image.data, 4);
  assert.ok(count(changed) > 1000, 'the edit is visible');
  for (let i = 0; i < W * H; i++) {
    if (changed[i]) assert.ok(session.regions[0].hard[i] === 1, `pixel ${i} changed outside face 1`);
    if (session.regions[1].hard[i]) assert.equal(changed[i], 0, 'face 2 keeps its exact pixels');
    assert.equal(result.image.data[i * 4 + 3], before[i * 4 + 3], 'alpha untouched');
  }
  assert.deepEqual(source.image.data, before, 'the source photo is never written');
  assert.deepEqual([result.editedFaces, result.untouchedFaces], [1, 1]);
  assert.equal(result.faces[0].audit.status, 'isolated'); assert.equal(result.faces[1].audit, null);
  assert.equal(result.changedPixels, count(changed));
});

test('each face gets its own edit, and each result matches editing that face alone', () => {
  const faces = [placed(5, 40, 0.6), placed(205, 50, 0.6), placed(405, 40, 0.6)];
  const source = group(faces, 3), before = Uint8Array.from(source.image.data);
  const both = new M.MultiFaceEdit(source, faces);
  both.setEdits(0, layers('enhance', { mode: 'natural' }, 100));
  both.setEdits(2, layers('older', { stop: 3 }, 100));
  const result = both.render();
  const alone = new M.MultiFaceEdit(source, faces); alone.setEdits(2, layers('older', { stop: 3 }, 100));
  const only = alone.render();
  const changed = changedMask(before, result.image.data, 3);
  for (let i = 0; i < W * H; i++) {
    const owner = both.regions.findIndex((r) => r.hard[i] === 1);
    if (changed[i]) assert.ok(owner === 0 || owner === 2, 'only edited faces change');
    if (owner === 1) assert.equal(changed[i], 0, 'the middle face has no edits and keeps its bytes');
    if (owner === 2) for (let c = 0; c < 3; c++) assert.equal(result.image.data[i * 3 + c], only.image.data[i * 3 + c]);
  }
  assert.ok(result.faces[0].changed > 0 && result.faces[2].changed > 0);
  assert.deepEqual([result.editedFaces, result.untouchedFaces], [2, 1]);
});

test('All copies one face\'s edits to every face, still inside the faces', () => {
  const source = group(TWO), before = Uint8Array.from(source.image.data);
  const session = new M.MultiFaceEdit(source, TWO);
  session.setEdits(1, layers('enhance', { mode: 'natural' }, 100));
  session.copyToAll(1);
  assert.equal(session.editsFor(0).length, 1);
  const result = session.render();
  const changed = changedMask(before, result.image.data, 4);
  for (let i = 0; i < W * H; i++) if (changed[i]) assert.ok(session.regions[0].hard[i] || session.regions[1].hard[i]);
  assert.ok(result.faces.every((f) => f.changed > 0));
});

test('no edits, disabled layers and strength 0 return the exact original bytes', () => {
  const source = group(TWO), session = new M.MultiFaceEdit(source, TWO);
  assert.deepEqual(Uint8Array.from(session.render().image.data), Uint8Array.from(source.image.data));
  const off = layers('enhance', {}, 100).map((l) => ({ ...l, enabled: false }));
  session.setEdits(0, off); session.setEdits(1, layers('enhance', {}, 100).map((l) => ({ ...l, strength: 0 })));
  const result = session.render();
  assert.equal(result.changedPixels, 0); assert.equal(result.editedFaces, 0);
});

test('the soft edge never leaves the oval', () => {
  const session = new M.MultiFaceEdit(group(TWO), TWO);
  for (const r of session.regions) {
    let inner = 0;
    for (let i = 0; i < r.soft.length; i++) {
      if (r.soft[i] > 0) assert.equal(r.hard[i], 1);
      if (r.soft[i] === 1) inner++;
    }
    assert.ok(inner > r.pixels * 0.5, 'most of the face takes the full edit');
  }
});

test('refusals are coded', () => {
  const code = (fn) => { try { fn(); } catch (e) { assert.ok(e instanceof M.MultiFaceError); assert.equal(e.message, M.MULTI_FACE_REFUSALS[e.code]); return e.code; } return null; };
  const source = group(TWO);
  assert.equal(code(() => new M.MultiFaceEdit(source, [TWO[0]])), 'too_few_faces');
  assert.equal(code(() => new M.MultiFaceEdit(source, Array.from({ length: 7 }, (_, i) => placed(i * 80, 40, 0.3)))), 'too_many_faces');
  assert.equal(code(() => new M.MultiFaceEdit(source, [placed(10), placed(60)])), 'faces_overlap');
  assert.equal(code(() => new M.MultiFaceEdit(source, [placed(10), placed(500)])), 'invalid_face');
  assert.equal(code(() => new M.MultiFaceEdit(source, [placed(10), TWO[1].slice(0, 400)])), 'invalid_face');
  const session = new M.MultiFaceEdit(source, TWO);
  assert.equal(code(() => session.setEdits(2, [])), 'unknown_face');
  assert.equal(code(() => session.editsFor(-1)), 'unknown_face');
});
