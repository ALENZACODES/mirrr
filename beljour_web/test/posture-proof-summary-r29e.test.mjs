/** R29E per-fix evidence summary: never upgrades a status, names groups by label only.
 * Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { verifiedEvidenceReport } from "../dist/js/body/posture-proof-integrity.js";
import { MAX_ATTENTION, mountProofSummary, summarizeEvidence, summaryLines } from "../dist/js/body/posture-proof-summary.js";
import { NOT_RUN_COPY } from "../dist/js/body/posture-proof.js";
import { cellReport } from "./posture-public-fixture-r29e.mjs";
import { withFakeDocument } from "./posture-dom-fake.mjs";

test("a clean control summarises as within limits, release still NOT_RUN", () => {
  const summary = summarizeEvidence(verifiedEvidenceReport(cellReport()));
  assert.match(summary.headline, /within the committed numeric limits/);
  assert.match(summary.headline, /Release: NOT_RUN/);
  assert.equal(summary.fixes.length, 7);
  assert.ok(summary.fixes.every((item) => item.rows === 44 && item.counts.CHECKS_OK === 44 && !item.attention.length));
  assert.equal(summary.fixes[0].name, "Straighten lean");
});

test("failures are listed first and attention lists are bounded", () => {
  const report = verifiedEvidenceReport(cellReport(20, (cell) =>
    cell.fix === "J12" && cell.group.startsWith("small/") ? [12, 2] : [cell.bodies, 0]));
  const j12 = summarizeEvidence(report).fixes.find((item) => item.fix === "J12");
  assert.ok(j12.attention.length <= MAX_ATTENTION);
  assert.match(j12.attention[0], /NUMERIC_FAIL/);
  assert.equal(summarizeEvidence(report).numericStatus, "NUMERIC_FAIL");
  assert.match(summarizeEvidence(report).headline, /^Numeric status NUMERIC_FAIL\./);
});

test("thin sets stay UNPROVEN in the summary", () => {
  const summary = summarizeEvidence(verifiedEvidenceReport(cellReport(5)));
  assert.equal(summary.numericStatus, "UNPROVEN");
  assert.ok(summary.fixes.every((item) => (item.counts.UNDERPOWERED ?? 0) > 0));
  assert.ok(summaryLines(summary).every((line) => !/\bPASS(ED)?\b/.test(line)));
});

test("the view starts NOT_RUN and renders with textContent only", () => withFakeDocument(async (document) => {
  const view = mountProofSummary(document.createElement("div"));
  assert.equal(view.element.textContent, NOT_RUN_COPY);
  view.show(verifiedEvidenceReport(cellReport()));
  assert.equal(view.element.byTag("p").length, 8);
  view.show(null);
  assert.equal(view.element.textContent, NOT_RUN_COPY);
  view.dispose();
}));
