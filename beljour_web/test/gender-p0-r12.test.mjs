// R12 synthetic-only geometry regressions. Author: John Khan.
// Q3 stays >0.2; triangle ratio stays >=0.2; pupil and nose-root pins are exact.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { meshWarp } from '../dist/js/engines/warp/mesh.js';
import { foldReport, Q3_MINIMUM } from '../dist/js/engines/warp/fold.js';
import { piecewiseAffine } from '../dist/js/engines/warp/piecewise.js';
import { borderPins } from '../dist/js/engines/warp/tps.js';
import { delaunay } from '../dist/js/engines/warp/triangulate.js';
import { regularizeTargets, neighbourGraph, GLOBAL_CAP_SHARE, LOCAL_CAP_SHARE,
  EDGE_SLOPE_LIMIT } from '../dist/js/engines/warp/regularize.js';
import { genderTargets, bands, IDENTITY_PINS, REGIONS } from '../dist/js/engines/local/gender.js';
import { displacement } from '../dist/js/engines/shape/geometry.js';

const near = (actual, expected, tolerance = 1e-12) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

function triangleCase() {
  const before = [[20, 20], [20.5, 20], [20, 20.5]];
  const after = [[20, 20], [28, 20], [20, 28]];
  const points = [...before, ...borderPins(48, 48)];
  return { before, after, lay: { points, meshCount: before.length, triangles: delaunay(points) } };
}

function graphCase() {
  const before = [[0, 0], [1, 0], [0, 1], [1, 1], [2, 0], [2, 1], [0, 2], [1, 2], [2, 2]];
  const after = before.map((p) => [...p]);
  after[4][0] += 1.3; after[4][1] -= 0.7;
  after[8][0] -= 0.8; after[8][1] += 0.5;
  return { before, after };
}

const fixture = JSON.parse(readFileSync(new URL('../../parity/face-spikes-r6.json', import.meta.url)));
function syntheticFace(seed = 1, yaw = 0, roll = 0) {
  const face = fixture.faces.find((row) => row.id === seed);
  const centre = [90, 100], angle = roll * Math.PI / 180;
  return face.xyz.map(([x, y]) => {
    const dx = (x - centre[0]) * Math.cos(yaw * Math.PI / 180), dy = y - centre[1];
    return [centre[0] + dx * Math.cos(angle) - dy * Math.sin(angle),
      centre[1] + dx * Math.sin(angle) + dy * Math.cos(angle)];
  });
}

test('P0 regression: passing the old forward triangle test does not certify raster Q3', () => {
  const { before, after, lay } = triangleCase();
  const old = meshWarp(48, 48, before, after, { lay, guard: false });
  assert.equal(old.flips.passed, true);
  assert.ok(old.flips.minAreaRatio > 0.7);
  assert.equal(old.jacobian.passed, false);
  near(old.jacobian.minDet, 1 / 256);
  assert.equal(old.strengthUsed, 1);
  assert.equal(Q3_MINIMUM, 0.2);
});

test('P0 fixed guard returns a separately measured raster with Q3 strictly above 0.2', () => {
  const { before, after, lay } = triangleCase();
  const safe = meshWarp(48, 48, before, after, { lay });
  assert.deepEqual(foldReport(safe.result.field), safe.jacobian);
  assert.equal(safe.jacobian.passed, true);
  assert.ok(safe.jacobian.minDet > 0.2);
  assert.equal(safe.flips.passed, true);
  assert.equal(safe.guardReason, 'raster_q3');
  assert.equal(safe.reduced, true);
  assert.equal(safe.refused, false);
  assert.ok(safe.strengthUsed > 0.15 && safe.strengthUsed < 0.2);
  assert.ok(safe.evaluations > 1);
});

test('P0 reported strength reconstructs the exact map, not a differently scaled field', () => {
  const { before, after, lay } = triangleCase();
  const safe = meshWarp(48, 48, before, after, { lay });
  const actual = lay.points.map((p, i) => i < before.length
    ? [p[0] + safe.strengthUsed * (after[i][0] - p[0]), p[1] + safe.strengthUsed * (after[i][1] - p[1])]
    : p);
  const reconstructed = piecewiseAffine(48, 48, lay.points, actual, lay.triangles);
  assert.deepEqual(reconstructed.field.mapX.data, safe.result.field.mapX.data);
  assert.deepEqual(reconstructed.field.mapY.data, safe.result.field.mapY.data);
  assert.deepEqual(reconstructed.owner, safe.result.owner);
});

test('P0 gross fold remains guarded by the original triangle threshold', () => {
  const { before, lay } = triangleCase();
  const after = before.map((p) => [...p]);
  after[1] = [19, 19];
  const old = meshWarp(48, 48, before, after, { lay, guard: false });
  assert.equal(old.flips.passed, false);
  const safe = meshWarp(48, 48, before, after, { lay });
  assert.equal(safe.flips.passed, true);
  assert.ok(safe.flips.minAreaRatio >= 0.2);
  assert.equal(safe.jacobian.passed, true);
  assert.match(safe.guardReason, /triangle_area/);
});

test('P0 safe and zero requests keep their requested strength', () => {
  const { before, after, lay } = triangleCase();
  for (const strength of [0, 0.05]) {
    const safe = meshWarp(48, 48, before, after, { lay, strength });
    assert.equal(safe.strengthUsed, strength);
    assert.equal(safe.reduced, false);
    assert.equal(safe.guardReason, null);
    assert.equal(safe.refused, false);
    assert.equal(safe.jacobian.passed, true);
  }
});

test('P0 guard rejects invalid budgets and stale layouts', () => {
  const { before, after, lay } = triangleCase();
  for (const iterations of [0, 41, 1.2, true, NaN]) {
    assert.throws(() => meshWarp(48, 48, before, after, { lay, iterations }), /iterations/);
  }
  for (const strength of [-1, 1.01, NaN]) {
    assert.throws(() => meshWarp(48, 48, before, after, { lay, strength }), /strength/);
  }
  assert.throws(() => meshWarp(48, 48, before.map(([x, y]) => [x + 1, y]), after, { lay }), /another mesh/);
});

test('P0 local graph has stable ties, normalized weights and unique edges', () => {
  const { before } = graphCase();
  const graph = neighbourGraph(before, 10);
  assert.deepEqual(graph.neighbours[0].slice(0, 2), [1, 2]);
  graph.neighbours.forEach((indices, i) => {
    assert.equal(indices.length, 6);
    assert.equal(new Set(indices).size, 6);
    assert.equal(indices.includes(i), false);
    near(graph.weights[i].reduce((a, b) => a + b, 0), 1);
    assert.ok(graph.weights[i].every((v) => v > 0));
  });
  assert.ok(graph.edges.every(([i, j]) => i < j));
  assert.equal(new Set(graph.edges.map(([i, j]) => `${i},${j}`)).size, graph.edges.length);
});

test('P0 smoothing obeys local and global caps and preserves useful motion', () => {
  const { before, after } = graphCase();
  const graph = neighbourGraph(before, 10), safe = regularizeTargets(before, after, 10);
  safe.points.forEach(([x, y], i) => {
    const magnitude = Math.hypot(x - before[i][0], y - before[i][1]);
    assert.ok(magnitude <= LOCAL_CAP_SHARE * graph.spacing[i] + 1e-12);
    assert.ok(magnitude <= GLOBAL_CAP_SHARE * 10 + 1e-12);
  });
  assert.ok(safe.report.capped_landmarks > 0);
  assert.ok(safe.report.smoothed_landmarks > 0);
  assert.ok(safe.report.applied_max > 0.01);
  assert.ok(safe.report.applied_max < safe.report.requested_max);
  assert.ok(safe.report.max_edge_slope <= EDGE_SLOPE_LIMIT + 0.01);
  assert.equal(safe.report.raster_q3_required, true);
});

test('P0 identity pins and source arrays stay exact', () => {
  const { before, after } = graphCase(), original = structuredClone({ before, after });
  const safe = regularizeTargets(before, after, 10, [0, 4, 0]);
  assert.deepEqual(safe.points[0], before[0]);
  assert.deepEqual(safe.points[4], before[4]);
  assert.deepEqual(safe.report.pinned, [0, 4]);
  assert.deepEqual({ before, after }, original);
});

test('P0 cap and smoothing policy is displacement-sign symmetric', () => {
  const { before, after } = graphCase();
  const reverse = after.map(([x, y], i) => [2 * before[i][0] - x, 2 * before[i][1] - y]);
  const a = regularizeTargets(before, after, 10, [0]), b = regularizeTargets(before, reverse, 10, [0]);
  a.points.forEach(([x, y], i) => {
    near(x - before[i][0], before[i][0] - b.points[i][0]);
    near(y - before[i][1], before[i][1] - b.points[i][1]);
  });
  assert.equal(a.report.capped_landmarks, b.report.capped_landmarks);
  near(a.report.applied_max, b.report.applied_max);
});

test('P0 regularization follows translation, rotation and scale', () => {
  const { before, after } = graphCase(), angle = 0.35, scale = 2.75;
  const transform = ([x, y]) => [37 + scale * (x * Math.cos(angle) - y * Math.sin(angle)),
    53 + scale * (x * Math.sin(angle) + y * Math.cos(angle))];
  const a = regularizeTargets(before, after, 10, [0]);
  const b = regularizeTargets(before.map(transform), after.map(transform), 10 * scale, [0]);
  a.points.map(transform).forEach(([x, y], i) => {
    near(x, b.points[i][0], 1e-11); near(y, b.points[i][1], 1e-11);
  });
});

test('P0 duplicate vertices agree and a duplicate pin remains fixed', () => {
  const { before } = graphCase();
  before[1] = [...before[0]];
  const after = before.map((p) => [...p]);
  after[1][0] += 1; after[4][1] += 0.5;
  const pinned = regularizeTargets(before, after, 10, [0]);
  assert.deepEqual(pinned.points[0], before[0]);
  assert.deepEqual(pinned.points[1], before[1]);
  const free = regularizeTargets(before, after, 10);
  assert.deepEqual(free.points[0], free.points[1]);
});

test('P0 identity and all-pinned requests have exactly zero displacement', () => {
  const { before, after } = graphCase();
  const zero = regularizeTargets(before, before, 10);
  assert.deepEqual(zero.points, before);
  assert.equal(zero.report.applied_max, 0);
  assert.equal(zero.report.smoothed_landmarks, 0);
  const pinned = regularizeTargets(before, after, 10, before.map((_, i) => i));
  assert.deepEqual(pinned.points, before);
});

test('P0 invalid graph scales, pin indices, counts and shapes are refused', () => {
  const { before, after } = graphCase();
  for (const scale of [0, -1, NaN, Infinity]) assert.throws(() => regularizeTargets(before, after, scale), /scale/);
  for (const pinned of [[true], [-1], [9], [1.5]]) assert.throws(() => regularizeTargets(before, after, 10, pinned), /pins/);
  for (const count of [0, 25, 2.5, true]) assert.throws(() => neighbourGraph(before, 10, count), /neighbours/);
  assert.throws(() => regularizeTargets(before, after.slice(1), 10), /matching/);
  assert.throws(() => regularizeTargets(before, [[NaN, 0], ...after.slice(1)], 10), /finite/);
});

test('P0 recipe direction is explicit without silently reversing the established API', () => {
  const face = syntheticFace();
  for (const [slider, direction] of [[-33, 'feminine'], [33, 'masculine'], [0, 'original']]) {
    const result = genderTargets(face, slider);
    assert.equal(result.report.direction, direction);
    assert.equal(result.report.validated_on_released_photos, false);
    assert.match(result.report.simulation, /simulation/);
  }
  assert.ok(bands(-33).jaw_width_fw < 0);
  assert.ok(bands(33).jaw_width_fw > 0);
});

test('P0 feminine and masculine synthetic stop grids both pass unchanged triangle and Q3 gates', () => {
  const failures = { feminine: 0, masculine: 0 };
  for (const [seed, yaw, roll] of [[1, 0, 0], [3, 30, 12], [5, 50, -10]]) {
    const face = syntheticFace(seed, yaw, roll);
    for (const stop of [-100, -66, -33, 33, 66, 100]) {
      const target = genderTargets(face, stop), safe = meshWarp(180, 200, face, target.points);
      const passed = safe.flips.passed && safe.jacobian.passed;
      failures[target.report.direction] += passed ? 0 : 1;
      assert.equal(passed, true, `${seed}/${yaw}/${roll}/${stop}`);
      assert.ok(safe.strengthUsed > 0.01);
      const actual = face.map(([x, y], i) => [x + safe.strengthUsed * (target.points[i][0] - x),
        y + safe.strengthUsed * (target.points[i][1] - y)]);
      assert.ok(displacement(face, actual).max_iod_percent > 0.05);
      for (const i of IDENTITY_PINS) assert.deepEqual(actual[i], face[i]);
      assert.ok(target.report.max_iod_percent <= 12 + 1e-9);
      assert.equal(target.report.target_safety.method, 'local-spacing-diffusion-projection/1');
    }
  }
  assert.deepEqual(failures, { feminine: 0, masculine: 0 });
});

test('P0 extreme region factors preserve pupil distance and root position', () => {
  const face = syntheticFace(3, 0, 17), original = structuredClone(face);
  const regionStrengths = Object.fromEntries(REGIONS.map((r) => [r, 1.5]));
  for (const stop of [-100, 100]) {
    const target = genderTargets(face, stop, { regionStrengths });
    for (const i of IDENTITY_PINS) assert.deepEqual(target.points[i], face[i]);
    assert.ok(target.report.max_iod_percent <= 12 + 1e-9);
    assert.ok(target.report.max_iod_percent > 0.1);
  }
  assert.deepEqual(face, original);
});

test('P0 disabled regions, zero slider and repeat calls retain exact reproducibility', () => {
  const face = syntheticFace(5), regionStrengths = Object.fromEntries(REGIONS.map((r) => [r, 0]));
  for (const stop of [-100, 0, 100]) assert.deepEqual(genderTargets(face, stop, { regionStrengths }).points, face);
  assert.deepEqual(genderTargets(face, 0).points, face);
  const a = genderTargets(face, -66, { scope: 'keep_my_hair' });
  const b = genderTargets(face, -66, { scope: 'keep_my_hair' });
  assert.deepEqual(a, b);
  assert.equal(a.report.styling_pending, true);
  assert.equal(a.report.validated_on_released_photos, false);
});
