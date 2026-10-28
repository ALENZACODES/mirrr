// R13 gate 9 in the browser: symmetry targets capped at 15% of the eye distance and
// refused on turned or tilted heads, matching Python. Drawn meshes only.
// Author: John Khan.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { safeTargets, headAngles, MAX_TARGET_MOVE_IOD, interocular } from '../dist/js/engines/proportions/symmetry.js';

const vectors = JSON.parse(readFileSync(new URL('../../parity/symmetry-cap.json', import.meta.url)));
const tol = vectors.float_tolerance;
const near = (a, b, label) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${label}: ${a} vs ${b}`);

test('fixture is synthetic, John Khan, twelve cases', () => {
  assert.equal(vectors.format, 'beljour-symmetry-cap-r13/1');
  assert.equal(vectors.author, 'John Khan');
  assert.equal(vectors.cases.length, 12);
});

for (const c of vectors.cases) test(`safe targets match Python: ${c.id} at ${c.strength}`, () => {
  const r = safeTargets(c.mesh, c.strength);
  assert.equal(r.refused, c.refused);
  assert.equal(r.reason, c.reason);
  near(r.yawDegrees, c.yaw, 'yaw');
  near(r.rollDegrees, c.roll, 'roll');
  near(r.scale, c.scale, 'scale');
  near(r.maxMoveIod, c.max_move_iod, 'move');
  r.points.forEach((p, i) => { near(p[0], c.points[i][0], `x${i}`); near(p[1], c.points[i][1], `y${i}`); });
  assert.ok(r.maxMoveIod <= MAX_TARGET_MOVE_IOD);
  const flat = c.mesh.map(([x, y]) => [x, y]);
  let move = 0;
  r.points.forEach((p, i) => { move = Math.max(move, Math.hypot(p[0] - flat[i][0], p[1] - flat[i][1])); });
  assert.ok(move / interocular(flat) <= MAX_TARGET_MOVE_IOD);
});

test('two-dimensional meshes use the nose offset for yaw', () => {
  const flat = vectors.cases[0].mesh.map(([x, y]) => [x, y]);
  const [yaw, roll] = headAngles(flat);
  assert.ok(Number.isFinite(yaw) && Number.isFinite(roll));
  assert.throws(() => safeTargets(flat, 2), /strength/);
});
