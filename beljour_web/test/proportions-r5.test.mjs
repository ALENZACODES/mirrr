// R5 start of E10 in TypeScript: generated anatomy table, symmetry analysis and targets,
// proportion ratios. Faces are the synthetic meshes stored in parity/warp-fill-r5.json.
// Author: John Khan.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { FEATURE_PAIRS, MIDLINE, PHI, REGION_PAIRS, SYMMETRY_REGIONS } from "../dist/js/data/face/generated/anatomy.js";
import { REGIONS as LEGACY_REGIONS, MIDLINE as LEGACY_MIDLINE } from "../dist/js/face/symmetry.js";
import { checkCustom, difference, measure, measureValues } from "../dist/js/engines/proportions/ratios.js";
import { analyse, controls, SIDES, targets, toPixels } from "../dist/js/engines/proportions/symmetry.js";
import { foldReport } from "../dist/js/engines/warp/fold.js";
import { mlsField } from "../dist/js/engines/warp/mls.js";

const doc = JSON.parse(readFileSync(new URL("../../parity/warp-fill-r5.json", import.meta.url), "utf8"));
const faces = doc.vectors.filter((v) => v.kernel === "proportions.symmetry").map((v) => v.args.points);
const [symmetric, asymmetric] = faces;
const near = (a, b, tol = 1e-9, msg = "") => assert.ok(Math.abs(a - b) <= tol, `${msg} ${a} vs ${b}`);

function rolled(points, degrees) {
  const a = (degrees * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const mx = points.reduce((t, p) => t + p[0], 0) / points.length, my = points.reduce((t, p) => t + p[1], 0) / points.length;
  return points.map(([x, y]) => [mx + c * (x - mx) - s * (y - my), my + s * (x - mx) + c * (y - my)]);
}

test("generated anatomy: disjoint pairs and the legacy symmetry table now read from it", () => {
  const used = new Set();
  for (const name of SYMMETRY_REGIONS) {
    for (const [r, l] of REGION_PAIRS[name]) {
      assert.ok(!used.has(r) && !used.has(l) && r !== l, `${name} ${r} ${l}`);
      used.add(r); used.add(l);
    }
  }
  for (const i of MIDLINE) assert.ok(!used.has(i));
  assert.deepEqual([...LEGACY_MIDLINE], [...MIDLINE]);
  assert.deepEqual(Object.keys(LEGACY_REGIONS), Object.keys(FEATURE_PAIRS));
  assert.deepEqual(LEGACY_REGIONS.jaw[0], [234, 454]);
  near(PHI, (1 + Math.sqrt(5)) / 2, 1e-15);
});

test("symmetric face reads zero; shifted face is measured in IOD", () => {
  const flat = analyse(symmetric);
  assert.ok(flat.mean < 1e-12 && flat.facingCamera);
  near(flat.iod, 88);
  const rep = analyse(asymmetric);
  const eyes = rep.regions.find((r) => r.name === "eyes");
  near(eyes.across, -3 / 88); near(eyes.along, 2 / 88); near(eyes.mean, Math.hypot(3, 2) / 88);
  const tilted = analyse(rolled(asymmetric, 14));
  rep.regions.forEach((r, i) => near(tilted.regions[i].mean, r.mean, 1e-9, r.name));
  near(Math.abs(tilted.tiltDegrees), 14, 0.6);
  assert.throws(() => analyse(symmetric.slice(0, 100)), RangeError);
  assert.throws(() => analyse(asymmetric, ["ears"]), RangeError);
});

test("targets shrink every region by exactly 1 - strength, for every master side", () => {
  const before = analyse(asymmetric);
  for (const side of SIDES) {
    for (const strength of [0, 0.3, 0.75, 1]) {
      const after = analyse(targets(asymmetric, strength, { side }));
      before.regions.forEach((r, i) => near(after.regions[i].mean, (1 - strength) * r.mean, 1e-9, `${side} ${strength} ${r.name}`));
    }
  }
  assert.throws(() => targets(asymmetric, 2), RangeError);
  assert.throws(() => targets(asymmetric, 0.5, { side: "middle" }), RangeError);
});

test("symmetry targets drive a fold-free MLS warp (E06 link)", () => {
  const { from, to, indices } = controls(asymmetric, targets(asymmetric, 0.8));
  assert.ok(indices.length > 0);
  const anchors = [10, 152, 234, 454].map((i) => symmetric[i]);
  const field = mlsField(400, 500, [...from, ...anchors], [...to, ...anchors], { mode: "similarity", step: 8 });
  assert.ok(foldReport(field).passed);
  assert.deepEqual(toPixels([{ x: 0.5, y: 0.25 }], 400, 200), [[200, 50]]);
});

test("ratios: the synthetic layout, references, roll invariance and custom sets", () => {
  const rep = measure(symmetric, "classical");
  const get = (k) => rep.ratios.find((r) => r.key === k);
  get("thirds").value.forEach((v, i) => near(v, [0.3, 0.36, 0.34][i], 1e-12));
  near(get("eye_width_gap").value, 1); near(get("nose_width_gap").value, 1); near(get("mouth_nose_width").value, 1.5);
  assert.equal(get("mouth_nose_width").plain, "Close to the reference.");
  assert.equal(get("face_length_width").differencePercent, null);
  const golden = measure(symmetric, "golden").ratios.find((r) => r.key === "mouth_nose_width");
  near(golden.differencePercent, (100 * (1.5 - PHI)) / PHI);
  assert.equal(golden.plain, "A little below the reference.");
  near(difference([0.3, 0.36, 0.34], [1, 1, 1]), 100 * (0.3 - 1 / 3));
  const a = measureValues(symmetric).values, b = measureValues(rolled(symmetric.map(([x, y]) => [x * 1.7, y * 1.7]), -11)).values;
  for (const key of Object.keys(a)) [a[key]].flat().forEach((v, i) => near([b[key]].flat()[i], v, 1e-9, key));
  const custom = measure(symmetric, "custom", { thirds: [1, 1, 1], lips_chin: 0.5 });
  assert.notEqual(custom.ratios.find((r) => r.key === "thirds").differencePercent, null);
  for (const bad of [{ thirds: [1, 1] }, { lips_chin: -1 }, { ears: 1 }]) assert.throws(() => checkCustom(bad), RangeError);
  assert.throws(() => measure(symmetric, "perfect"), RangeError);
  assert.match(rep.note, /nothing here is a score/);
});
