// R32F acceptance accounting in the browser: identifiers only.
// Mirrors api/tests/test_r32f_skin_evidence.py with the same records and counts.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeAccuracy } from "../dist/js/engines/shade/skin-evidence.js";

const MIXED = [
  { expected_id: "LG-07N", predicted_id: "LG-07N" },
  { expected_id: "LG-07N", predicted_id: "LG-08N" },
  { expected_id: "LG-07N", predicted_id: null },
  { expected_id: null, predicted_id: "LG-03W" },
  { expected_id: null, predicted_id: null },
];

test("accepted readings and correct identities are counted apart", () => {
  const s = summarizeAccuracy(MIXED);
  assert.deepEqual([s.total, s.accepted, s.exact, s.wrong_accepted, s.accepted_unlabelled, s.refused],
    [5, 3, 1, 1, 1, 2]);
  assert.deepEqual([s.labelled, s.missing_labels], [3, 2]);
  assert.equal(s.exact_rate, 0.2);
  assert.equal(s.acceptance_rate, 0.6);
  assert.deepEqual(s.kinds, { synthetic: 5, released_person: 0 });
});

test("synthetic records never pass real-face or product validation", () => {
  const s = summarizeAccuracy(Array(20).fill({ expected_id: "LG-07N", predicted_id: "LG-07N" }), { target: 0.95 });
  assert.equal(s.meets_target, true);
  assert.equal(s.evidence, "synthetic");
  assert.equal(s.real_face_pass, false);
  assert.equal(s.product_validation, false);
});

test("a real-face pass needs full labels and a met target", () => {
  const labelled = Array.from({ length: 19 }, (_, i) => ({ expected_id: `S${i}`, predicted_id: `S${i}`,
    kind: "released_person" }));
  const miss = { expected_id: "S19", predicted_id: "S0", kind: "released_person" };
  assert.equal(summarizeAccuracy([...labelled, miss], { target: 0.95 }).real_face_pass, true);
  assert.equal(summarizeAccuracy([...labelled, miss], { target: 0.96 }).real_face_pass, false);
  const unlabelled = { expected_id: null, predicted_id: null, kind: "released_person" };
  assert.equal(summarizeAccuracy([...labelled, unlabelled], { target: 0.9 }).real_face_pass, false);
  assert.equal(summarizeAccuracy(labelled).real_face_pass, false);
  const mixed = summarizeAccuracy([...labelled, { expected_id: "X", predicted_id: "X" }], { target: 0.95 });
  assert.equal(mixed.meets_target, true);
  assert.equal(mixed.real_face_pass, false);
});

test("malformed records and targets are refused", () => {
  for (const record of [{ expected_id: "" }, { expected_id: "x".repeat(65) }, { expected_id: 7 },
    { expected_id: "A", predicted_id: "B", kind: "real" }]) {
    assert.throws(() => summarizeAccuracy([record]), RangeError);
  }
  for (const target of [0, -0.1, 1.01, Number.NaN]) {
    assert.throws(() => summarizeAccuracy(MIXED, { target }), RangeError);
  }
});

test("the summary holds counts only", () => {
  const s = summarizeAccuracy(MIXED);
  assert.equal(s.format, "beljour-skin-accuracy-summary/1");
  assert.ok(!JSON.stringify(s).includes("LG-07N"));
});
