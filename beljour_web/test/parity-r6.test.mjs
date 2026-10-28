// R6 Python ↔ TypeScript vectors from synthetic face meshes, 15 E08 controls, seven
// LS2 stops, bounded LS1 3D turns and LS3 strength/RNG. Author: John Khan.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { targetMesh, displacement, CONTROLS } from "../dist/js/engines/shape/geometry.js";
import { genderTargets, bands, STOPS } from "../dist/js/engines/local/gender.js";
import { project } from "../dist/js/engines/local/turn.js";
import { ageStrength, random32 } from "../dist/js/engines/local/age.js";
import { maxAbsDifference } from "../dist/js/quality/metrics.js";

const parity = JSON.parse(readFileSync(new URL("../../parity/face-spikes-r6.json", import.meta.url), "utf8"));
const TOL = 1 / 255;
const sample = (points) => parity.probes.map((i) => [...points[i]]);
const faces = new Map(parity.faces.map((entry) => [entry.id, entry.xyz]));

function evaluate(vector) {
  const face = faces.get(vector.face);
  if (!face) throw new Error(`unknown face ${vector.face}`);
  if (vector.kind === "shape") {
    const before = face.map((p) => p.slice(0, 2));
    const after = targetMesh(before, { [vector.id]: vector.amount });
    return { sampled: sample(after), metrics: displacement(before, after) };
  }
  if (vector.kind === "gender") {
    const after = genderTargets(face.map((p) => p.slice(0, 2)), vector.slider);
    return { sampled: sample(after.points), bands: after.report.requested_bands, capped: after.report.capped_landmarks };
  }
  if (vector.kind === "turn") {
    const out = project(face, vector.yaw, vector.pitch, vector.roll);
    return { sampled: sample(out.points), depth: parity.probes.map((i) => out.depth[i]) };
  }
  throw new Error(`unknown kernel ${vector.kind}`);
}

test("R6 data declares 15 unique controls and the expected families", () => {
  assert.equal(parity.format, "beljour-r6-parity/1");
  assert.equal(CONTROLS.length, 15);
  assert.equal(new Set(CONTROLS.map((x) => x.id)).size, 15);
  assert.deepEqual([...new Set(CONTROLS.map((x) => x.group))].sort(), ["chin", "face", "forehead", "jaw"]);
  assert.deepEqual(STOPS, [-100, -66, -33, 0, 33, 66, 100]);
  assert.equal(parity.vectors.length, 3 * (15 * 3 + 7 + 6));
  assert.ok(parity.probes.includes(468));
});

test("R6 Python/TS shape, gender and turning vector parity", () => {
  let worst = 0;
  const failures = [];
  for (const v of parity.vectors) {
    try {
      const computed = evaluate(v);
      const expected = v.kind === "shape" ? { sampled: v.sampled, metrics: v.metrics }
        : v.kind === "gender" ? { sampled: v.sampled, bands: v.bands, capped: v.capped }
          : { sampled: v.sampled, depth: v.depth };
      const diff = maxAbsDifference(computed, expected);
      worst = Math.max(worst, diff);
      if (diff > TOL) failures.push({ kernel: v.kind, id: v.id ?? v.slider ?? v.yaw, face: v.face, diff });
    } catch (error) { failures.push({ kernel: v.kind, face: v.face, error: String(error) }); }
  }
  assert.deepEqual(failures, [], JSON.stringify(failures.slice(0, 10)));
  assert.ok(worst < TOL, `worst Python/TS difference ${worst}`);
});

test("LS3 age stop interpolation and seeded spot RNG match the Python reference", () => {
  for (const [stop, expected] of Object.entries(parity.age_stops)) assert.deepEqual(ageStrength(Number(stop)), expected);
  const rng = random32(1024);
  for (const value of parity.rng_first_12) assert.ok(Math.abs(rng() - value) < 1e-15);
});

test("a modified parity value is rejected rather than silently accepted", () => {
  const first = structuredClone(parity.vectors.find((v) => v.kind === "shape"));
  first.sampled[0][0] += .5;
  assert.ok(maxAbsDifference(evaluate(first).sampled, first.sampled) > TOL);
  assert.throws(() => evaluate({ kind: "not_registered", face: 1 }), /unknown kernel/);
});
