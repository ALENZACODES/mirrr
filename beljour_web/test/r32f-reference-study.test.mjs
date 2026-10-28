// R32F six-condition reference study in the browser: drawn patches only.
// The counts must equal the r32f rows of the committed SKN-03 evidence pack, the same
// rows api/tests/test_r32f_reference_study.py checks for the Python study.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { RGB_TO_XYZ } from "../dist/js/engines/shade/colourspace.js";
import { loadHairShades, loadReferenceShades, shadeById } from "../dist/js/engines/shade/loaders.js";
import {
  AGGREGATE_ID, CASTS, CONDITIONS, EVIDENCE_IDS, drawScenario, evaluateReferenceScenario, runReferenceStudy,
} from "../dist/js/engines/shade/reference-study.js";

const EVIDENCE = JSON.parse(readFileSync(new URL("../../SKN03-EVIDENCE-F-r36f-cp2.json", import.meta.url), "utf8"));
const COMMITTED = Object.fromEntries(EVIDENCE.attempts.filter((r) => r.id.startsWith("r32f-")).map((r) => [r.id, r]));
const FIELDS = ["n", "baseline_exact", "candidate_exact", "refused", "wrong_accepted"];
const pick = (row) => Object.fromEntries(FIELDS.map((f) => [f, row[f]]));
const study = runReferenceStudy();

test("every row matches the committed evidence pack", () => {
  const rows = Object.fromEntries(study.rows.map((r) => [r.id, r]));
  assert.deepEqual(Object.keys(rows).sort(), Object.keys(COMMITTED).sort());
  assert.deepEqual(Object.keys(rows).sort(), [...Object.values(EVIDENCE_IDS), AGGREGATE_ID].sort());
  for (const [id, committed] of Object.entries(COMMITTED)) assert.deepEqual(pick(rows[id]), pick(committed), id);
});

test("glare cases are recovered by the consensus and nothing wrong is accepted", () => {
  const glare = study.outcomes.filter((o) => o.condition === "forehead_glare_cheeks_agree");
  assert.equal(glare.length, 96);
  assert.ok(glare.every((o) => o.candidate_source === "cheek_consensus" && o.candidate_exact));
  assert.equal(study.outcomes.filter((o) => o.wrong_accepted).length, 0);
  assert.equal(study.references, 96);
  assert.equal(study.real_face_pass, false);
});

test("the drawn layout and sparse cheeks follow the Python layout", () => {
  const lab = shadeById("LG-07N", "reference").lab;
  const flat = drawScenario(lab, "flat_patches");
  assert.deepEqual([flat.image.width, flat.image.height], [106, 28]);
  assert.equal(flat.neutral, null);
  const count = (mask) => mask.reduce((a, b) => a + b, 0);
  assert.deepEqual(Object.values(flat.masks).map(count), [576, 576, 576]);
  const sparse = drawScenario(lab, "insufficient_cheek_samples").masks;
  assert.deepEqual([count(sparse.cheek_right), count(sparse.cheek_left)], [6, 6]);
});

test("light casts have unit luminance and come with a neutral card", () => {
  for (const [condition, cast] of Object.entries(CASTS)) {
    const y = RGB_TO_XYZ[1].reduce((sum, v, i) => sum + v * cast[i], 0);
    assert.ok(Math.abs(y - 1) < 1e-12, condition);
    assert.equal(drawScenario([63, 13.29, 17.64], condition).neutral.reduce((a, b) => a + b, 0), 576);
  }
});

test("one scenario reports both readers", () => {
  const outcome = evaluateReferenceScenario("LG-07N", "forehead_glare_cheeks_agree");
  assert.equal(outcome.baseline_id, null);
  assert.equal(outcome.candidate_id, "LG-07N");
  assert.equal(outcome.wrong_accepted, false);
});

test("a single condition has no aggregate row; bad inputs are refused", () => {
  const rows = runReferenceStudy(["flat_patches"], loadReferenceShades().slice(0, 2)).rows;
  assert.deepEqual(rows.map((r) => r.id), ["r32f-flat-patches"]);
  assert.throws(() => drawScenario([50, 10, 10], "dim_light"), RangeError);
  assert.throws(() => runReferenceStudy(["flat_patches", "flat_patches"]), RangeError);
  assert.throws(() => runReferenceStudy([]), RangeError);
  assert.throws(() => evaluateReferenceScenario(loadHairShades()[0], "flat_patches"), RangeError);
  assert.equal(CONDITIONS.length, 6);
});
