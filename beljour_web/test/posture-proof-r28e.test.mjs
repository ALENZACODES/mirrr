/** R28E aggregate body evidence: strict 308-row reader and NOT_RUN-first studio view.
 * Reports are generated counts only; no photographs or people. Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { EvidenceRefused, NOT_RUN_COPY, REGISTERED_ROWS, checkedEvidenceReport, expectedNumericStatus,
  expectedRowStatus, proofStatusLines, registeredRows } from "../dist/js/body/posture-proof.js";
import { mountBodyPostureStudio } from "../dist/js/body/posture-studio.js";
import { withFakeDocument } from "./posture-dom-fake.mjs";

const BODIES = { view: 600, body_size: 200, monk: 60, body_size_monk: 20 };

/** A self-consistent report; `measure(row)` returns [measured, passed, refused] per row. */
function report(measure = () => [0, 0, 0], setStatus = "NOT_RUN") {
  const rows = registeredRows().map((row) => {
    const bodies = BODIES[row.slice];
    const [measured, passed, refused] = measure(row, bodies);
    const counts = { bodies, expected_jobs: bodies, measured_jobs: measured, refused_jobs: refused, passed_jobs: passed };
    return { ...row, ...counts, status: expectedRowStatus(counts) };
  });
  const views = rows.filter((row) => row.slice === "view");
  const sum = (key) => views.reduce((total, row) => total + row[key], 0);
  const recorded = sum("measured_jobs"), passed = sum("passed_jobs"), refused = sum("refused_jobs");
  return { format: "beljour-posture-body-evidence/1", run: "a".repeat(64), definitions_sha256: "b".repeat(64),
    set_status: setStatus, numeric_status: expectedNumericStatus(rows, setStatus), release_status: "NOT_RUN",
    human_review: "NOT_RUN", completion: { expected_jobs: sum("expected_jobs"), recorded_jobs: recorded,
      missing_jobs: sum("expected_jobs") - recorded, refused_jobs: refused, passed_jobs: passed,
      failed_jobs: recorded - passed - refused }, rows };
}
const allPass = () => report((_row, bodies) => [bodies, bodies, 0]);
const refused = (code) => (error) => error instanceof EvidenceRefused && error.code === code;

test("there are exactly 308 registered rows, 44 per fix", () => {
  const rows = registeredRows();
  assert.equal(rows.length, REGISTERED_ROWS);
  const perFix = new Map();
  for (const row of rows) perFix.set(row.fix, (perFix.get(row.fix) ?? 0) + 1);
  assert.deepEqual([...perFix.values()], [44, 44, 44, 44, 44, 44, 44]);
});

test("an empty report reads as NOT_RUN and a full control as CHECKS_OK with release NOT_RUN", () => {
  assert.equal(checkedEvidenceReport(report()).numeric_status, "NOT_RUN");
  const full = checkedEvidenceReport(allPass());
  assert.equal(full.numeric_status, "CHECKS_OK");
  assert.equal(full.release_status, "NOT_RUN");
  assert.ok(proofStatusLines(full).some((line) => line.includes("308 registered groups: 308 CHECKS_OK")));
  assert.ok(proofStatusLines(null).includes(NOT_RUN_COPY));
});

test("private or unknown attributes are refused at every level", () => {
  assert.throws(() => checkedEvidenceReport({ ...allPass(), photo_sha256: "c".repeat(64) }),
    refused("unexpected_evidence_attributes"));
  const withSource = allPass();
  withSource.rows[3] = { ...withSource.rows[3], source: "private_set" };
  assert.throws(() => checkedEvidenceReport(withSource), refused("unexpected_evidence_attributes"));
  const withPath = allPass();
  withPath.completion = { ...withPath.completion, path: "/private/x" };
  assert.throws(() => checkedEvidenceReport(withPath), refused("unexpected_evidence_attributes"));
});

test("missing, duplicate and unregistered group rows are refused", () => {
  const missing = allPass();
  missing.rows.pop();
  assert.throws(() => checkedEvidenceReport(missing), refused("missing_group_rows"));
  const duplicate = allPass();
  duplicate.rows[1] = { ...duplicate.rows[0] };
  assert.throws(() => checkedEvidenceReport(duplicate), refused("duplicate_group_row"));
  const unknown = allPass();
  unknown.rows[0] = { ...unknown.rows[0], group: "extra_large" };
  assert.throws(() => checkedEvidenceReport(unknown), refused("unregistered_group_row"));
  const wrongView = allPass();
  wrongView.rows[0] = { ...wrongView.rows[0], view: "side" };
  assert.throws(() => checkedEvidenceReport(wrongView), refused("unregistered_group_row"));
});

test("any claimed release or human pass is refused", () => {
  for (const claim of [{ release_status: "PASS" }, { human_review: "PASS" }, { release_status: "PASSED" }]) {
    assert.throws(() => checkedEvidenceReport({ ...allPass(), ...claim }), refused("unsupported_release_claim"));
  }
});

test("impossible counts and statuses that do not follow from counts are refused", () => {
  const over = allPass();
  over.rows[5] = { ...over.rows[5], passed_jobs: over.rows[5].measured_jobs + 1 };
  assert.throws(() => checkedEvidenceReport(over), refused("impossible_group_counts"));
  const relabelled = report((_row, bodies) => [bodies, Math.floor(bodies * 0.9), 0]);
  relabelled.rows[0] = { ...relabelled.rows[0], status: "CHECKS_OK" };
  assert.throws(() => checkedEvidenceReport(relabelled), refused("inconsistent_group_status"));
  const negative = allPass();
  negative.rows[2] = { ...negative.rows[2], refused_jobs: -1 };
  assert.throws(() => checkedEvidenceReport(negative), refused("invalid_evidence_count"));
  const summary = allPass();
  summary.numeric_status = "NOT_RUN";
  assert.throws(() => checkedEvidenceReport(summary), refused("inconsistent_numeric_status"));
  const completion = allPass();
  completion.completion = { ...completion.completion, missing_jobs: 1 };
  assert.throws(() => checkedEvidenceReport(completion), refused("inconsistent_completion"));
});

test("refusals count as non-passes and underpowered groups never pass", () => {
  const withRefusals = checkedEvidenceReport(report((_row, bodies) => [bodies, bodies - 2, 2]));
  assert.ok(withRefusals.rows.filter((row) => row.slice === "body_size_monk").every((row) => row.status === "NUMERIC_FAIL"));
  assert.equal(expectedRowStatus({ bodies: 19, expected_jobs: 19, measured_jobs: 19, passed_jobs: 19 }), "UNDERPOWERED");
  const thin = checkedEvidenceReport(report((_row, bodies) => [bodies, bodies, 0], "UNPROVEN"));
  assert.equal(thin.numeric_status, "UNPROVEN", "a thin set is never CHECKS_OK");
});

test("the studio starts NOT_RUN and shows a valid report without changing readiness", () =>
  withFakeDocument(async (document, requests) => {
    const errors = [];
    const studio = mountBodyPostureStudio(document.createElement("div"), { onError: (m) => errors.push(m) });
    assert.ok(studio.element.textContent.includes(NOT_RUN_COPY));
    assert.equal(studio.evidence, null);
    const before = studio.readiness;
    const shown = studio.setEvidenceReport(allPass());
    assert.equal(shown.numeric_status, "CHECKS_OK");
    assert.ok(studio.element.textContent.includes("Locally supplied, unverified body evidence"));
    assert.deepEqual(studio.readiness, before);
    assert.throws(() => studio.setEvidenceReport({ ...allPass(), release_status: "PASS" }), EvidenceRefused);
    assert.equal(studio.evidence, null, "a refused report returns the view to NOT_RUN");
    assert.ok(studio.element.textContent.includes(NOT_RUN_COPY));
    assert.deepEqual(errors, ["That evidence report was refused."]);
    studio.dispose();
    assert.equal(requests.length, 0);
  }));
