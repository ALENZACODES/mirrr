/** R29E cross-row integrity, and the browser reading real Python-generated evidence.
 * Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { EvidenceRefused, checkedEvidenceReport } from "../dist/js/body/posture-proof.js";
import { evidenceIntegrity, verifiedEvidenceReport } from "../dist/js/body/posture-proof-integrity.js";
import { cellReport, pythonOutputs } from "./posture-public-fixture-r29e.mjs";

const python = pythonOutputs();
const refused = (code) => (error) => error instanceof EvidenceRefused && error.code === code;

test("a balanced report is consistent and verifies as CHECKS_OK", () => {
  const report = verifiedEvidenceReport(cellReport());
  assert.equal(report.numeric_status, "CHECKS_OK");
  assert.deepEqual(evidenceIntegrity(report), { consistent: true, problems: [] });
});

test("a parent row that disagrees with its intersections is refused", () => {
  const report = cellReport();
  const index = report.rows.findIndex((row) => row.slice === "body_size" && row.group === "large");
  report.rows[index] = { ...report.rows[index], bodies: 201, expected_jobs: 201, measured_jobs: 201, passed_jobs: 201 };
  checkedEvidenceReport(report);
  assert.throws(() => verifiedEvidenceReport(report), refused("parent_totals_differ_from_intersections"));
});

test("fixes of one view must see the same population", () => {
  const report = cellReport();
  const shift = (row, delta) => ({ ...row, bodies: row.bodies + delta, expected_jobs: row.bodies + delta,
    measured_jobs: row.bodies + delta, passed_jobs: row.bodies + delta });
  for (const [i, row] of report.rows.entries()) {
    if (row.fix === "J11" && (row.slice === "view" || ["small", "1", "small/1"].includes(row.group))) {
      report.rows[i] = shift(row, 1);
    }
  }
  report.completion.expected_jobs += 1;
  report.completion.recorded_jobs += 1;
  report.completion.passed_jobs += 1;
  const result = evidenceIntegrity(checkedEvidenceReport(report));
  assert.ok(result.problems.includes("fix_populations_differ_within_view"), result.problems.join());
});

test("completion totals must equal the per-fix rows", () => {
  const report = cellReport();
  report.completion = { ...report.completion, expected_jobs: report.completion.expected_jobs + 1,
    missing_jobs: 1 };
  assert.throws(() => verifiedEvidenceReport(report), refused("completion_differs_from_rows"));
});

test("a thin set cannot claim the complete-set status", () => {
  const thin = cellReport(5);
  assert.equal(verifiedEvidenceReport(thin).numeric_status, "UNPROVEN");
  const claimed = cellReport(5);
  claimed.set_status = "NOT_RUN";
  claimed.numeric_status = "CHECKS_OK";
  assert.throws(() => verifiedEvidenceReport(claimed), EvidenceRefused);
});

test("one failing intersection fails its parents and the whole set", () => {
  const report = verifiedEvidenceReport(cellReport(20, (cell) =>
    cell.fix === "J14" && cell.group === "large/7" ? [10, 0] : [cell.bodies, 0]));
  assert.equal(report.numeric_status, "NUMERIC_FAIL");
  const failing = report.rows.filter((row) => row.status === "NUMERIC_FAIL").map((row) => `${row.slice}:${row.group}`);
  // 10 of 20 in large/7 also fails tone 7 (50 of 60); size large (190 of 200) and the view stay at or above 0.95.
  assert.deepEqual(failing.sort(), ["body_size_monk:large/7", "monk:7"]);
});

test("the Python browser report verifies in the browser as UNPROVEN", { skip: !python && "python3 unavailable" }, () => {
  const report = verifiedEvidenceReport(python.evidence);
  assert.equal(report.numeric_status, "UNPROVEN");
  assert.equal(report.release_status, "NOT_RUN");
  assert.equal(report.rows.length, 308);
});
