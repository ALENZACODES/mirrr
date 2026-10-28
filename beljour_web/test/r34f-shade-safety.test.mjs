/** BELJOUR shade-safety receipt in the browser: refusals win and the honesty fields are fixed.
 * Synthetic drawn colours only. Author: John Khan.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { auditIlluminationSensitivity } from "../dist/js/engines/shade/illumination-sensitivity.js";
import { inspectReferenceAmbiguity } from "../dist/js/engines/shade/reference-ambiguity.js";
import { assessShadeSafety, LABEL, publicShadeSafety } from "../dist/js/engines/shade/shade-safety.js";
import { BASES, caseReading } from "./r34f-scene.mjs";

function receipt(index, cast, modes = 3) {
  const [result, sample, estimates] = caseReading(BASES[index][1], cast);
  return [result, auditIlluminationSensitivity(result, sample, estimates.slice(0, modes)), inspectReferenceAmbiguity(result)];
}

test("consistent, review and refused all occur and are explained", () => {
  const statuses = new Set();
  for (let i = 0; i < 24; i++) {
    for (const cast of ["daylight", "warm", "dim"]) {
      const report = assessShadeSafety(...receipt(i, cast, cast === "daylight" ? 1 : 3));
      statuses.add(report.status);
      if (report.status === "refused") assert.ok(report.selected_id === null && report.reasons.length > 0);
      if (report.status === "consistent") assert.equal(report.reasons.length, 0);
    }
  }
  assert.deepEqual(statuses, new Set(["consistent", "review", "refused"]));
});

test("a refused review wins and a foreign review throws", () => {
  const [result, sens, amb] = receipt(4, "daylight");
  const stale = { ...sens, status: "refused", code: "stale_sample", outcomes: [] };
  assert.deepEqual(assessShadeSafety(result, stale, amb).reasons, ["lighting:stale_sample"]);
  assert.throws(() => assessShadeSafety(result, { ...sens, selected_id: "LG-01C" }, amb), RangeError);
});

test("the public receipt states its limits and carries no photo data", () => {
  const body = publicShadeSafety(assessShadeSafety(...receipt(8, "warm")));
  assert.deepEqual([body.label, body.intent, body.provider_calls, body.real_product_match, body.real_face_gate, body.release_pass],
    [LABEL, "manual_only", 0, false, "UNPROVEN", false]);
  assert.doesNotMatch(JSON.stringify(body), /pixels|landmark|sha256/);
});
