/** SKN-03 source calibration in the browser against parity/skn03-calibration-r35f.json.
 * Source-derived synthetic Lab vectors only. Author: John Khan.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as K from "../dist/js/engines/shade/calibration.js";
import { loadReferenceShades } from "../dist/js/engines/shade/loaders.js";

const P = JSON.parse(readFileSync(new URL("../../parity/skn03-calibration-r35f.json", import.meta.url), "utf8"));
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;

test("committed limit and probe statuses", () => {
  assert.equal(K.committedDistanceLimit(), P.limit);
  const matched = K.probeReference([60, 12, 18]);
  assert.deepEqual([matched.status, matched.named, matched.runner_up_id], ["matched", "LG-08N", "LG-09N"]);
  assert.equal(K.probeReference([10, 5, 5]).status, "too_deep");
  assert.equal(K.probeReference([50, -60, 60]).named, null);
  const record = loadReferenceShades()[5];
  const tie = K.probeReference(record.lab, [record, { ...record, id: "ZZ-TWIN" }]);
  assert.deepEqual([tie.status, tie.named, tie.margin], ["tie", null, 0]);
  assert.throws(() => K.probeReference([Number.NaN, 0, 0]), RangeError);
});

test("288 boundary vectors match Python and map back", () => {
  const vectors = K.syntheticBoundaryVectors();
  assert.equal(vectors.length, P.boundary.length);
  vectors.forEach((v, i) => {
    const py = P.boundary[i];
    assert.deepEqual([v.source_id, v.toward_id, v.fraction], [py.source, py.toward, py.fraction]);
    v.lab.forEach((x, c) => assert.ok(near(x, py.lab[c]), `vector ${i}`));
    assert.equal(K.probeReference(v.lab).named, py.named);
  });
  assert.deepEqual(K.auditSyntheticBoundaryVectors(), { ...P.gap.synthetic });
});

test("negative controls match Python", () => {
  const controls = K.negativeControls();
  assert.equal(controls.length, 192);
  controls.forEach((c, i) => {
    const py = P.controls[i];
    assert.deepEqual([c.kind, c.reference_id, c.probe.status, c.probe.best_id, c.passed],
      [py.kind, py.reference, py.status, py.best, py.passed]);
  });
});

test("forty seeded probes match Python", () => {
  for (const py of P.probes) {
    const probe = K.probeReference(py.lab);
    assert.deepEqual([probe.status, probe.best_id, probe.runner_up_id], [py.status, py.best, py.runner_up]);
    assert.ok(near(probe.best_delta_e, py.best_delta_e, 1e-6) && near(probe.margin, py.margin, 1e-6));
  }
});

test("the audit keeps every case and the synthetic result never closes the real gap", () => {
  const r = loadReferenceShades();
  const audit = K.auditProbes([[r[0].lab, r[0].id], [r[0].lab, r[1].id], [[50, -60, 60], r[2].id]]);
  assert.deepEqual([audit.exact, audit.wrong_accepted, audit.refused, audit.minimum_exact], [1, 1, 1, 3]);
  for (const bad of [[], [[[50, 0, 0]]], [[[50, 0, 0], 7]]]) assert.throws(() => K.auditProbes(bad), RangeError);
  assert.deepEqual(K.assessCalibrationGap(), P.gap);
  for (const bad of [Number.NaN, -1, 101, "93.9"]) assert.throws(() => K.assessCalibrationGap(bad), RangeError);
});
