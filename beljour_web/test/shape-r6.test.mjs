// R6 E08: fifteen independent face-shape controls, guarded R5 MLS/mesh warp and worker.
// Offline synthetic 478-point mesh only. Author: John Khan.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { byteImage } from '../dist/js/engines/core/buffer.js';
import { runEngine } from '../dist/js/engines/core/engine.js';
import { EngineClient, serve } from '../dist/js/engines/core/jobs.js';
import { defaultRegistry } from '../dist/js/engines/core/worker.js';
import { anchorRing } from '../dist/js/engines/warp/mesh.js';
import { CONTOURS } from '../dist/js/data/regions/generated/topology.js';
import { LANDMARKS, MIDLINE, REGION_PAIRS } from '../dist/js/data/face/generated/anatomy.js';
import { checkFace, faceFrame, faceUV, regionIndices, direction, validateValues,
  displacement, targetMesh, renderShape, ShapeEngine, CONTROLS, SIMULATION } from '../dist/js/engines/shape/geometry.js';

const parity = JSON.parse(readFileSync(new URL('../../parity/face-spikes-r6.json', import.meta.url)));
const face = parity.faces[0].xyz.map(([x, y]) => [x, y]);
const xyz = parity.faces[0].xyz;
const NEAR = (value, expected, tol = 1e-6) => assert.ok(Math.abs(value - expected) <= tol, `${value} ≠ ${expected}`);
function photo() {
  const img = byteImage(180, 200, 3);
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    const p = (y * img.width + x) * 3;
    img.data[p] = 40 + Math.round((x * 160) / img.width);
    img.data[p + 1] = 60 + Math.round((y * 150) / img.height);
    img.data[p + 2] = ((x / 10 | 0) + (y / 10 | 0)) % 2 ? 120 : 160;
  }
  return img;
}
const COPY = (p) => p.map(([x, y]) => [x, y]);

 test('fifteen controls have authored bounds and all requested groups', () => {
  assert.equal(CONTROLS.length, 15);
  assert.equal(new Set(CONTROLS.map(({id}) => id)).size, 15);
  const groups = Object.fromEntries(['face', 'jaw', 'chin', 'forehead'].map(
    (id) => [id, CONTROLS.filter((c) => c.group === id).length]));
  assert.deepEqual(groups, {face: 3, jaw: 6, chin: 4, forehead: 2});
  for (const rec of CONTROLS) {
    assert.ok(rec.cap_iod > 0 && rec.cap_iod <= 12);
    assert.ok(rec.sigma_v > 0 && rec.center_v >= 0 && rec.center_v <= 1);
    assert.match(rec.summary, /\w/);
  }
 });

 test('every control has a nonzero signed response without mutating its input', () => {
  const original = COPY(face);
  for (const recipe of CONTROLS) {
    for (const amount of [-100, -45, 40, 100]) {
      const result = targetMesh(face, {[recipe.id]: amount});
      assert.equal(result.length, 478);
      assert.ok(result.every((p) => p.length === 2 && p.every(Number.isFinite)));
      const stats = displacement(face, result);
      assert.ok(stats.moving_landmarks > 0, recipe.id);
      assert.ok(stats.max_iod_percent <= 12.0000001, recipe.id);
      assert.ok(stats.mean_iod_percent > 0);
    }
  }
  assert.deepEqual(face, original);
 });

 test('zero strength, zero amount and empty control map are identity', () => {
  for (const rec of CONTROLS) {
    assert.deepEqual(targetMesh(face, {[rec.id]: 50}, {strength: 0}), face);
    assert.deepEqual(targetMesh(face, {[rec.id]: 0}, {strength: 1}), face);
  }
  assert.deepEqual(targetMesh(face, {}), face);
  assert.equal(displacement(face, face).max_iod_percent, 0);
 });

 test('symmetric controls follow rotated local face frame', () => {
  const f = faceFrame(face), c = Math.cos(.2), s = Math.sin(.2);
  const spun = face.map(([x, y]) => [f.centre[0] + 2 + 1.12 * (c * (x - f.centre[0]) - s * (y - f.centre[1])),
    f.centre[1] - 3 + 1.12 * (s * (x - f.centre[0]) + c * (y - f.centre[1]))]);
  const base = targetMesh(face, {face_width: 58}, {spread: 0});
  const rotated = targetMesh(spun, {face_width: 58}, {spread: 0});
  for (let i = 0; i < face.length; i++) {
    const dx = base[i][0] - face[i][0], dy = base[i][1] - face[i][1];
    NEAR(rotated[i][0] - spun[i][0], 1.12 * (c * dx - s * dy), 1e-7);
    NEAR(rotated[i][1] - spun[i][1], 1.12 * (s * dx + c * dy), 1e-7);
  }
 });

 test('right/left jaw controls are independent', () => {
  const right = targetMesh(face, {jaw_width_right: 95}, {spread: 0});
  const left = targetMesh(face, {jaw_width_left: 95}, {spread: 0});
  assert.notDeepEqual(right, left);
  let leftChanged = 0, rightChanged = 0;
  for (let i = 0; i < face.length; i++) {
    if (Math.hypot(left[i][0] - face[i][0], left[i][1] - face[i][1]) > .02) leftChanged++;
    if (Math.hypot(right[i][0] - face[i][0], right[i][1] - face[i][1]) > .02) rightChanged++;
  }
  assert.ok(leftChanged > 2 && rightChanged > 2);
 });

 test('combined exaggerated controls obey the 12 percent IOD cap', () => {
  const everything = Object.fromEntries(CONTROLS.map((r) => [r.id, 100]));
  const result = targetMesh(face, everything);
  assert.ok(displacement(face, result).max_iod_percent <= 12.0000001);
  const other = targetMesh(face, everything);
  assert.deepEqual(result, other);
 });

 test('malformed meshes and recipes are rejected safely', () => {
  assert.throws(() => checkFace([]), /478/);
  assert.throws(() => checkFace([...face.slice(0, 477), [NaN, 3]]), /finite/);
  assert.throws(() => checkFace(xyz), /pixel-space/);
  assert.throws(() => faceFrame(Array.from({length: 478}, () => [3, 4])), /distinct/);
  for (const invalid of [-101, 101, Infinity, NaN, 'ten']) {
    assert.throws(() => targetMesh(face, {face_width: invalid}), /unknown or invalid/);
  }
  assert.throws(() => targetMesh(face, {fake: 20}), /unknown or invalid/);
  for (const value of [NaN, -0.01, 1.01]) {
    assert.throws(() => validateValues({face_width: 20}, {strength: value}), /strength/);
    assert.throws(() => validateValues({}, {spread: value}), /spread/);
  }
 });

 test('single authoritative region loops and R5 landmarks remain in place', () => {
  assert.equal(LANDMARKS.mesh_top, 10);
  assert.equal(LANDMARKS.chin, 152);
  assert.ok(CONTOURS.face_oval.includes(10));
  assert.ok(MIDLINE.length > 4 && REGION_PAIRS.jaw.length > 3);
  for (const rec of CONTROLS) {
    const ids = regionIndices(rec.region, face, faceFrame(face));
    assert.ok(ids.length > 2, rec.id);
    assert.ok(ids.every((id) => Number.isInteger(id) && id >= 0 && id < 478));
  }
  assert.equal(anchorRing(face).length > 5, true);
  NEAR(faceUV(face[10], faceFrame(face))[1], 0, 1e-8);
  assert.deepEqual(direction('lower_y', 0, .8, 50, 'none'), [0, 1]);
 });

 test('fold guard returns the actual used strength, outside corners untouched', () => {
  const img = photo(), source = new Uint8Array(img.data);
  const out = renderShape(img, face, {jaw_width_right: 85});
  assert.match(out.label, /simulation/i);
  assert.equal(out.label, SIMULATION);
  assert.equal(out.image.data.length, source.length);
  assert.ok(out.metrics.strength_used > 0 && out.metrics.strength_used <= 1);
  assert.ok(out.metrics.guard_scale > 0 && out.metrics.guard_scale <= 1);
  assert.ok(out.metrics.min_area_ratio >= .2 - 1e-6);
  assert.deepEqual(img.data, source);
  assert.deepEqual([...out.image.data.slice(0, 3)], [...source.slice(0, 3)]);
  assert.ok(out.editMask.data.every((v) => v === 0 || v === 1));
  const none = renderShape(img, face, {});
  assert.deepEqual(none.image.data, img.data);
  assert.equal(none.metrics.strength_used, 1);
 });

 test('contract-13 shape engine passes checked runner and returns local provenance', () => {
  const img = photo();
  const result = runEngine(new ShapeEngine(), img, face, {}, {jaw_width_left: 45});
  assert.equal(result.provenance, 'local');
  assert.ok(result.pipelineVersion.includes('r6'));
  assert.ok(result.metrics.strength_used > 0 && result.metrics.strength_used <= 1);
  assert.throws(() => runEngine(new ShapeEngine(), img, null, {}, {face_width: 20}), /478 pixel/);
  assert.throws(() => runEngine(new ShapeEngine(), img, face, {}, {face_width: 300}), /invalid/);
  assert.throws(() => runEngine(new ShapeEngine(), img, face, {}, {unknown: 30}), /unknown shape/);
 });

 test('shape engine accepts an offline mesh over the existing worker message protocol', async () => {
  const img = photo();
  const {port1, port2} = new MessageChannel();
  const handler = serve(defaultRegistry(), port2);
  port2.on('message', (value) => handler({data: value}));
  const client = new EngineClient(port1, 15_000);
  port1.on('message', (value) => client.receive(value));
  try {
    assert.ok(defaultRegistry().names().includes('shape'));
    const out = await client.run({engine: 'shape', image: img, landmarks: face, params: {chin_width: 43}});
    assert.ok(out.metrics.strength_used > 0);
    assert.equal(out.image.data.length, img.data.length);
    const alt = await client.run({engine: 'shape', image: img, landmarks: face, params: {chin_width: 0}});
    assert.deepEqual(alt.image.data, img.data);
    await assert.rejects(client.run({engine: 'shape', image: img, params: {chin_width: 40}}), /478 pixel/);
  } finally {
    port1.close(); port2.close();
  }
 });
