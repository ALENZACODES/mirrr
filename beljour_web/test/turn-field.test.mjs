// R13 turn field parity and behaviour. Drawn meshes and fields only, no network.
// Pass: regulariser, local relax, ramp and pivot agree with Python within 1e-6;
// a rigid move passes unchanged; a local fold is repaired without touching the
// rest of the field. Author: John Khan.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { floatImage } from '../dist/js/engines/core/buffer.js';
import { makeField } from '../dist/js/engines/warp/field.js';
import { foldReport } from '../dist/js/engines/warp/fold.js';
import { regulariseTargets, relaxLowJacobian, rampPx, silhouetteDepth, featureRetention, components,
  LOCAL_TARGET_DET, EDGE_STRAIN_SHARE } from '../dist/js/engines/warp/turn-field.js';
import { project } from '../dist/js/engines/local/turn.js';

const vectors = JSON.parse(readFileSync(new URL('../../parity/turn-field.json', import.meta.url)));
const tol = vectors.float_tolerance;
const near = (a, b, label) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${label}: ${a} vs ${b}`);

test('fixture is synthetic and authored by John Khan', () => {
  assert.equal(vectors.format, 'beljour-turn-field-r13/1');
  assert.equal(vectors.author, 'John Khan');
  assert.equal(vectors.synthetic, true);
});

for (const v of vectors.targets) test(`regulariser matches Python: ${v.id}`, () => {
  near(silhouetteDepth(v.mesh), v.silhouette_depth, 'pivot');
  const proposed = project(v.mesh, v.yaw, v.pitch, 0, 'silhouette').points;
  proposed.forEach((p, i) => { near(p[0], v.proposed[i][0], `proposed ${i}x`); near(p[1], v.proposed[i][1], `proposed ${i}y`); });
  const report = regulariseTargets(v.mesh.map(([x, y]) => [x, y]), v.proposed, v.iod);
  report.points.forEach((p, i) => { near(p[0], v.points[i][0], `point ${i}x`); near(p[1], v.points[i][1], `point ${i}y`); });
  assert.equal(report.capped_vertices, v.capped_vertices);
  near(report.max_strain, v.max_strain, 'strain');
  near(report.retention, v.retention, 'retention');
});

test('local relax matches Python attenuation exactly in decisions', () => {
  const r = vectors.relax;
  const mapX = floatImage(r.width, r.height, 1, true), mapY = floatImage(r.width, r.height, 1, true);
  mapX.data.set(r.map_x); mapY.data.set(r.map_y);
  const relaxed = relaxLowJacobian(makeField(mapX, mapY), r.iod);
  assert.equal(relaxed.regions_scaled, r.regions_scaled);
  assert.equal(relaxed.rounds, r.rounds);
  for (let i = 0; i < r.attenuation.length; i++) near(relaxed.attenuation[i], r.attenuation[i], `att ${i}`);
  assert.ok(foldReport(relaxed.field).minDet > LOCAL_TARGET_DET);
});

test('ramp values match Python', () => {
  for (const [w, y, p, d, rim, expected] of vectors.ramps) near(rampPx(w, y, p, d, rim), expected, `ramp ${w},${y},${p},${d}`);
  assert.throws(() => rampPx(NaN, 8, 0, 40, 3), /finite/);
});

test('rigid moves pass the regulariser unchanged and zero is identity', () => {
  const mesh = vectors.targets[0].mesh.map(([x, y]) => [x, y]);
  const moved = mesh.map(([x, y]) => [x + 3, y - 2]);
  const report = regulariseTargets(mesh, moved, 40);
  report.points.forEach((p, i) => { assert.ok(Math.abs(p[0] - moved[i][0]) < 1e-9); assert.ok(Math.abs(p[1] - moved[i][1]) < 1e-9); });
  assert.equal(report.capped_vertices, 0);
  assert.ok(Math.abs(featureRetention(mesh, moved, report.points) - 1) < 1e-12);
  assert.ok(report.max_strain <= EDGE_STRAIN_SHARE);
});

test('components are 8-connected and ordered by first pixel', () => {
  const w = 6, h = 4, bad = new Uint8Array(w * h);
  for (const i of [0, 7, 14, 4, 5, 23]) bad[i] = 1;
  const comps = components(bad, w, h);
  assert.deepEqual(comps, [[0, 7, 14], [4, 5], [23]]);
});

test('a safe field is left alone', () => {
  const w = 30, h = 20, mapX = floatImage(w, h, 1, true), mapY = floatImage(w, h, 1, true);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { mapX.data[y * w + x] = x + 0.4 * Math.sin(y / 5); mapY.data[y * w + x] = y; }
  const relaxed = relaxLowJacobian(makeField(mapX, mapY), 10);
  assert.equal(relaxed.regions_scaled, 0);
  assert.equal(relaxed.rounds, 0);
  assert.throws(() => relaxLowJacobian(makeField(mapX, mapY), 0), /iod/);
});
