/** SKN-03 and C18 QA contracts remain non-release evidence.
 * Author: John Khan.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { loadSKN03C18Binding, summarizeSKN03Transitions } from
  "../dist/js/engines/shade/skn03-checkpoint.js";

const sample = {still_correct: 939, corrected: 11, regressed: 0, still_incorrect: 50};

test("C18 QA binding is a verified 96-reference source, not a provider catalogue", async () => {
  const result = await loadSKN03C18Binding();
  assert.equal(result.format, "beljour-skn03-c18-binding/1");
  assert.equal(result.count, 96);
  assert.equal(result.digest, "f766e00a03a416451ab45ae592a8ea7eb201191d436e6703f43fba0727e69f53");
  assert.equal(result.release_pass, false);
});

test("eleven net fixes reach 95 percent of 1000 without asserting a release pass", () => {
  const report = summarizeSKN03Transitions(sample, 1000, true, true);
  assert.equal(report.total, 1000);
  assert.equal(report.baseline_correct, 939);
  assert.equal(report.candidate_correct, 950);
  assert.equal(report.minimum_correct, 950);
  assert.equal(report.additional_required, 0);
  assert.equal(report.status, "BOX_REVIEW_REQUIRED");
  assert.equal(report.release_pass, false);
});

test("counted regressions consume fixes instead of disappearing", () => {
  const report = summarizeSKN03Transitions(
    {still_correct: 939, corrected: 12, regressed: 1, still_incorrect: 48},
    1000, true, true,
  );
  assert.equal(report.baseline_correct, 940);
  assert.equal(report.candidate_correct, 951);
  assert.equal(report.regressed, 1);
  assert.equal(report.release_pass, false);
});

test("incomplete labels, absent baseline and review prevent evidence clearance", () => {
  assert.equal(summarizeSKN03Transitions(sample, 999, true, true).status, "EVIDENCE_INCOMPLETE");
  assert.equal(summarizeSKN03Transitions(sample, 1000, false, true).status, "EVIDENCE_INCOMPLETE");
  assert.equal(summarizeSKN03Transitions(sample, 1000, true, false).status, "EVIDENCE_INCOMPLETE");
});

test("the SKN-03 denominator always includes all incorrect cases", () => {
  const report = summarizeSKN03Transitions(
    {still_correct: 920, corrected: 0, regressed: 0, still_incorrect: 63},
    983, false, false,
  );
  assert.equal(report.total, 983);
  assert.equal(report.minimum_correct, 934);
  assert.equal(report.additional_required, 14);
  assert.equal(report.status, "BELOW_TARGET");
});

for (const invalid of [null, true, false, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 100001]) {
  test(`invalid count is refused: ${String(invalid)}`, () => {
    assert.throws(() => summarizeSKN03Transitions(
      {...sample, regressed: invalid}, 1000, true, true,
    ), RangeError);
  });
}

test("more labels than tested cases are rejected", () => {
  assert.throws(() => summarizeSKN03Transitions(sample, 1001, true, true), RangeError);
});
