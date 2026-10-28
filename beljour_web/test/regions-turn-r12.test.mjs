// R12 visible regions and turn blending. All inputs are drawn colours or invented
// meshes. Pass: unchanged Q1/Q3/Q4, explicit nonzero effect, zero change on protected
// pixels, full-field parity with Python. No real faces or network. Author: John Khan.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { byteImage, floatImage } from '../dist/js/engines/core/buffer.js';
import { regionMask, regionMasks, regionDiagnostics, irisOutline, CONTOURS, IRISES, REGIONS } from '../dist/js/data/regions/index.js';
import { turnSupport, protectTurnField, appliedTurnTargets } from '../dist/js/engines/local/turn-blend.js';
import { renderTurn, project } from '../dist/js/engines/local/turn.js';
import { apply, fromFunction, moveMagnitude } from '../dist/js/engines/warp/field.js';
import { meshWarp } from '../dist/js/engines/warp/mesh.js';
import { foldReport, safeStrength, scaledBuilder } from '../dist/js/engines/warp/fold.js';
import { q4Seam } from '../dist/js/quality/metrics.js';
import { polygon, distanceInside } from '../dist/js/engines/core/mask.js';
import { symmetricFace } from '../dist/js/engines/local/face-synthetic.js';

const vectors = JSON.parse(readFileSync(new URL('../../parity/regions-turn-r12.json', import.meta.url)));
const { width, height } = vectors;
const nearArray = (a, b, tolerance, label) => {
  assert.equal(a.length, b.length, `${label}: length`);
  for (let i = 0; i < a.length; i++) assert.ok(Math.abs(a[i] - b[i]) <= tolerance,
    `${label}[${i}]: ${a[i]} vs ${b[i]}`);
};
function image() {
  const value = byteImage(width, height, 3);
  value.data.set(vectors.image);
  return value;
}
function mask(values) {
  const value = floatImage(width, height);
  value.data.set(values);
  return value;
}
function sum(values) { let total = 0; for (const value of values) total += value; return total; }
function inside(child, parent) {
  let overlap = 0;
  for (let i = 0; i < child.data.length; i++) overlap += child.data[i] * parent.data[i];
  return overlap / sum(child.data);
}
function assertChecks(result) {
  assert.ok(result.checks.q1.passed);
  assert.ok(result.checks.q3.passed);
  assert.equal(result.checks.q3.minimum, 0.2);
  assert.ok(result.checks.q3.minDet > 0.2);
  assert.ok(result.checks.q4.passed);
  assert.equal(result.checks.q4.thresholds.maximum, 1.5);
  assert.ok(result.checks.q4_occluder.passed);
  assert.ok(result.checks.effect_pass);
  assert.ok(result.checks.triangle_guard_pass);
}

test('R12 fixture declares synthetic provenance and six mask/four rendered-turn cases', () => {
  assert.equal(vectors.format, 'beljour-regions-turn-r12/1');
  assert.equal(vectors.author, 'John Khan');
  assert.equal(vectors.synthetic, true);
  assert.equal(vectors.regions.length, 15);
  assert.equal(vectors.turns.length, 4);
});

for (const vector of vectors.regions) test(`visible masks match every Python alpha: ${vector.id}`, () => {
  const all = regionMasks(vector.points, width, height, REGIONS, { normalized: false, supersample: 2 });
  for (const name of REGIONS) nearArray(all[name].data, vector.masks[name], 1e-7, `${vector.id}/${name}`);
  const diagnostics = regionDiagnostics(vector.points, width, height, { normalized: false, supersample: 2 });
  assert.equal(diagnostics.invalid_geometry, vector.diagnostics.invalid_geometry);
  assert.equal(diagnostics.version, vector.diagnostics.version);
  assert.deepEqual(diagnostics.not_visible, vector.diagnostics.not_visible);
  assert.deepEqual(diagnostics.hull_fallback, vector.diagnostics.hull_fallback);
  assert.equal(diagnostics.colour_dependent, false);
  for (const metric of ['face_area_px', 'skin_share', 'eyes_inside']) {
    assert.ok(Math.abs(diagnostics[metric] - vector.diagnostics[metric]) < 1e-7, metric);
  }
  for (const [feature, expected] of Object.entries(vector.diagnostics.features)) {
    for (const [key, value] of Object.entries(expected)) {
      assert.ok(Math.abs(diagnostics.features[feature][key] - value) < 1e-7, `${feature}/${key}`);
    }
  }
});

for (const vector of vectors.turns) test(`final turn field and pixels match Python: ${vector.id}`, () => {
  const protection = mask(vector.protected), source = image();
  const result = renderTurn(source, vectors.mesh, { yaw: vector.yaw, pitch: vector.pitch, protectedMask: protection });
  const weights = turnSupport(width, height, vectors.mesh.map(([x, y]) => [x, y]), { protectedMask: protection }).weights;
  nearArray(weights.data, vector.weights, vectors.float_tolerance, `${vector.id}/weights`);
  nearArray(result.field.mapX.data, vector.map_x, vectors.float_tolerance, `${vector.id}/mapX`);
  nearArray(result.field.mapY.data, vector.map_y, vectors.float_tolerance, `${vector.id}/mapY`);
  nearArray(result.image.data, vector.image, vectors.byte_tolerance, `${vector.id}/bytes`);
  nearArray(result.target.flat(), vector.target.flat(), vectors.float_tolerance, `${vector.id}/targets`);
  for (const [key, expected] of Object.entries(vector.metrics)) {
    assert.ok(Math.abs(result.metrics[key] - Number(expected)) < vectors.float_tolerance, `${vector.id}/${key}`);
  }
  assert.equal(result.checks.effect_pass, vector.effect_pass);
  assertChecks(result);
});

test('independent old-eye polygon regression fails 95% containment before clipping', () => {
  const points = symmetricFace(144, 160, 80, 120).map((p) => [...p]);
  for (const i of [...CONTOURS.right_eye, 468, 469, 470, 471, 472]) points[i][0] -= 20;
  const oval = polygon(144, 160, CONTOURS.face_oval.map((i) => points[i]), 2);
  const rawEye = polygon(144, 160, CONTOURS.right_eye.map((i) => points[i]), 2);
  assert.ok(inside(rawEye, oval) < 0.8);
  const eye = regionMask('right_eye', points, 144, 160, { normalized: false, supersample: 2 });
  assert.ok(inside(eye, oval) >= 0.95);
  assert.ok(sum(eye.data) > 0);
  assert.ok(sum(eye.data) < sum(rawEye.data));
  const actualOval = regionMask('face_oval', points, 144, 160, { normalized: false, supersample: 2 });
  assert.deepEqual(actualOval.data, oval.data);
});

test('bad raw geometry remains visible even when its clipped remnant is contained', () => {
  const vector = vectors.regions.find((item) => item.id === 'invalid-eye');
  const diag = regionDiagnostics(vector.points, width, height, { normalized: false, supersample: 2 });
  assert.ok(diag.invalid_geometry);
  assert.ok(diag.features.right_eye.raw_support_share < 0.25);
});

test('Monk 1–10 and five lighting levels cannot change a geometric mask', () => {
  const swatches = ['f6ede4', 'f3e7db', 'f7ead0', 'eadaba', 'd7bd96', 'a07e56', '825c43', '604134', '3a312a', '292420'];
  const baseline = regionMasks(vectors.regions[1].points, width, height, REGIONS, { normalized: false, supersample: 2 });
  for (const swatch of swatches) for (const exposure of [0.22, 0.61, 0.82, 1, 1.4]) {
    const photo = byteImage(width, height, 3);
    for (let i = 0; i < photo.data.length; i++) photo.data[i] = Math.min(255, Math.round(parseInt(swatch.slice((i % 3) * 2, (i % 3) * 2 + 2), 16) * exposure));
    const before = Uint8Array.from(photo.data);
    const actual = regionMasks(vectors.regions[1].points, photo.width, photo.height, REGIONS, { normalized: false, supersample: 2 });
    for (const name of REGIONS) assert.deepEqual(actual[name].data, baseline[name].data);
    assert.deepEqual(photo.data, before);
    assert.ok(inside(actual.eyes, actual.face_oval) >= 0.95);
  }
});

test('projected iris ellipse uses measured axes and eyelid support', () => {
  const points = vectors.regions[0].points.map((p) => [...p]), centre = [...points[468]];
  for (const [id, dx, dy] of [[469, 1, 0], [470, 0, 4], [471, -1, 0], [472, 0, -4]]) {
    points[id] = [centre[0] + dx, centre[1] + dy];
  }
  const outline = irisOutline(points, IRISES.right_iris);
  assert.equal(Math.max(...outline.map((p) => Math.abs(p[0] - centre[0]))), 1);
  assert.equal(Math.max(...outline.map((p) => Math.abs(p[1] - centre[1]))), 4);
  const iris = regionMask('right_iris', points, width, height, { normalized: false });
  const eye = regionMask('right_eye', points, width, height, { normalized: false });
  for (let i = 0; i < eye.data.length; i++) assert.ok(iris.data[i] <= eye.data[i]);
});

test('old anchor-ring turn crosses a contrast edge and fails the unchanged Q4', () => {
  const mesh = vectors.mesh.map((p) => p.map((v) => v * 2)), points = mesh.map(([x, y]) => [x, y]);
  const original = byteImage(144, 160, 3);
  const oval = regionMask('face_oval', points, 144, 160, { normalized: false, supersample: 2 });
  for (let y = 0; y < 160; y++) for (let x = 0; x < 144; x++) {
    const i = y * 144 + x, value = oval.data[i] >= 0.5 ? 65 + (x % 20) * 3 + (y % 17) * 0.1 : 140 + (x % 20) * 3;
    for (let c = 0; c < 3; c++) original.data[i * 3 + c] = value;
  }
  const target = project(mesh, -8).points;
  const old = apply(original, meshWarp(144, 160, points, target).result.field);
  assert.ok(q4Seam(original, old, oval).measured.ratio > 1.5);
  const result = renderTurn(original, mesh, { yaw: -8 });
  assertChecks(result);
  assert.ok(result.metrics.max_move_px > 0.2);
  assert.ok(result.image.data.some((value, i) => value !== original.data[i]));
});

test('total object protection refuses a nonzero turn even though quality checks pass', () => {
  const protectedMask = floatImage(width, height); protectedMask.data.fill(1);
  const result = renderTurn(image(), vectors.mesh, { yaw: 8, protectedMask });
  assert.deepEqual(result.image.data, image().data);
  assert.equal(result.metrics.refused, 1);
  assert.equal(result.metrics.strength_used, 0);
  assert.equal(result.metrics.effective_yaw_degrees, 0);
  assert.equal(result.checks.effect_pass, false);
  assert.ok(result.checks.q3.passed);
});

test('fractional object alpha protects exact original bytes and leaves inputs intact', () => {
  const vector = vectors.turns.find((item) => item.id === 'occlusion');
  const protection = mask(vector.protected.map((value) => value * 0.1));
  const copy = Float32Array.from(protection.data), original = image();
  const before = Uint8Array.from(original.data), points = structuredClone(vectors.mesh);
  const out = renderTurn(original, points, { pitch: 6, protectedMask: protection });
  assertChecks(out);
  for (let i = 0; i < protection.data.length; i++) if (protection.data[i]) {
    for (let c = 0; c < 3; c++) assert.equal(out.image.data[i * 3 + c], before[i * 3 + c]);
  }
  assert.deepEqual(original.data, before);
  assert.deepEqual(protection.data, copy);
  assert.deepEqual(points, vectors.mesh);
});

for (const supplied of [false, true]) test(`occluder evidence distinguishes ${supplied ? 'empty' : 'omitted'} masks from measured seams`, () => {
  const original = image();
  const result = renderTurn(original, vectors.mesh, { yaw: 8,
    ...(supplied ? { protectedMask: floatImage(width, height) } : {}) });
  assertChecks(result);
  assert.ok(result.image.data.some((value, index) => value !== original.data[index]));
  assert.equal(result.metrics.occluder_mask_supplied, Number(supplied));
  assert.equal(result.metrics.occluder_mask_nonempty, 0);
  assert.equal(result.metrics.protected_pixels, 0);
  assert.equal(result.metrics.q4_occluder_band_pixels, 0);
  assert.equal(result.metrics.q4_occluder_measured, 0);
  assert.equal(result.checks.q4_occluder_measured, false);
  assert.equal(result.checks.q4_occluder_evidence_pass, false);
});

test('a supplied protected boundary reports the independently recomputed Q4 band and result', () => {
  const vector = vectors.turns.find((item) => item.id === 'occlusion');
  const protection = mask(vector.protected), original = image();
  const result = renderTurn(original, vectors.mesh, { yaw: -8, protectedMask: protection });
  const measured = q4Seam(original, result.image, protection);
  assert.ok(measured.measured.band_pixels > 0);
  assert.equal(result.metrics.occluder_mask_supplied, 1);
  assert.equal(result.metrics.occluder_mask_nonempty, 1);
  assert.equal(result.metrics.protected_pixels, Array.from(protection.data).filter((value) => value > 0).length);
  assert.equal(result.metrics.q4_occluder_band_pixels, measured.measured.band_pixels);
  assert.equal(result.metrics.q4_occluder_ratio_p90, measured.measured.ratio);
  assert.equal(result.metrics.q4_occluder_measured, 1);
  assert.equal(result.checks.q4_occluder_measured, true);
  assert.equal(result.checks.q4_occluder_evidence_pass, measured.passed);
  assert.deepEqual(result.checks.q4_occluder, measured);
});

for (const kind of ['full_frame', 'fractional']) test(`nonempty ${kind} protection without a Q4 contour remains unmeasured`, () => {
  const vector = vectors.turns.find((item) => item.id === 'occlusion');
  const protection = mask(kind === 'full_frame' ? vector.protected.map(() => 1) : vector.protected.map((value) => value * 0.1));
  const original = image(), result = renderTurn(original, vectors.mesh, { pitch: 6, protectedMask: protection });
  assert.equal(result.metrics.occluder_mask_supplied, 1);
  assert.equal(result.metrics.occluder_mask_nonempty, 1);
  assert.ok(result.metrics.protected_pixels > 0);
  assert.equal(result.metrics.q4_occluder_band_pixels, 0);
  assert.equal(result.metrics.q4_occluder_measured, 0);
  assert.equal(result.checks.q4_occluder_measured, false);
  assert.equal(result.checks.q4_occluder_evidence_pass, false);
  for (let i = 0; i < protection.data.length; i++) if (protection.data[i] > 0) {
    for (let channel = 0; channel < 3; channel++) assert.equal(result.image.data[i * 3 + channel], original.data[i * 3 + channel]);
  }
});

test('turn support preserves the oval rim and the image edge for a cropped face', () => {
  const points = vectors.mesh.map(([x, y]) => [x - 20, y]);
  const masks = turnSupport(width, height, points);
  const depth = distanceInside(masks.oval);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x;
    if (x < 3 || depth.data[i] <= 3) assert.equal(masks.weights.data[i], 0);
  }
  assert.ok(masks.weights.data.some((value) => value > 0));
});

test('large fields are protected and rechecked after spatial weighting', () => {
  const points = vectors.mesh.map(([x, y]) => [x, y]), masks = turnSupport(width, height, points);
  const raw = fromFunction(width, height, (x, y) => [x + 40, y], 1);
  const weighted = protectTurnField(raw, masks), safe = safeStrength(scaledBuilder(weighted));
  assert.ok(foldReport(safe.field).passed);
  assert.ok(moveMagnitude(safe.field).data.some((value) => value > 0));
  const target = appliedTurnTargets(points, project(vectors.mesh, 8).points, masks, 0.5);
  assert.equal(target.length, 478);
  assert.throws(() => appliedTurnTargets(points, points, masks, 2), /strength/);
});

test('invalid rim, blend, protection and dimensions cannot silently succeed', () => {
  const points = vectors.mesh.map(([x, y]) => [x, y]);
  assert.throws(() => turnSupport(width, height, points, { rimPx: 2.9 }), /rim/);
  for (const blendPx of [0, 3.9, NaN, Infinity]) assert.throws(() => turnSupport(width, height, points, { blendPx }), /blend/);
  assert.throws(() => turnSupport(1, height, points), /dimensions/);
  assert.throws(() => renderTurn(image(), vectors.mesh, { protectedMask: floatImage(4, 4) }), /size/);
  const bad = floatImage(width, height); bad.data[10] = NaN;
  assert.throws(() => renderTurn(image(), vectors.mesh, { protectedMask: bad }), /finite/);
});
