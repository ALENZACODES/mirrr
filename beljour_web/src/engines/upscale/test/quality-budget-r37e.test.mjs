/** Device budget verdicts from local timings. Author: John Khan. */

import assert from "node:assert/strict";
import test from "node:test";

import { budgetReport, timed } from "../../../../dist/js/engines/upscale/quality-budget.js";

test("missing timings are NOT_MEASURED and quality is always UNVERIFIED", () => {
  const report = budgetReport({ sourcePixels: 12_000_000 });
  assert.deepEqual([report.preview, report.export, report.quality], ["NOT_MEASURED", "NOT_MEASURED", "UNVERIFIED"]);
});

test("sources under 12 MP cannot show the export budget", () => {
  const report = budgetReport({ sourcePixels: 4_000_000, previewMs: 40, renderMs: 500, encodeMs: 100 });
  assert.equal(report.preview, "WITHIN_BUDGET");
  assert.equal(report.export, "NOT_12MP");
  assert.equal(report.exportMs, 600);
});

test("12 MP verdicts follow the unmodified 100 ms and 2000 ms budgets", () => {
  assert.equal(budgetReport({ sourcePixels: 12_000_000, renderMs: 1500, encodeMs: 499 }).export, "WITHIN_BUDGET");
  assert.equal(budgetReport({ sourcePixels: 12_000_000, renderMs: 1500, encodeMs: 501 }).export, "OVER_BUDGET");
  assert.equal(budgetReport({ sourcePixels: 12_000_000, previewMs: 100.01 }).preview, "OVER_BUDGET");
  assert.equal(budgetReport({ sourcePixels: 12_000_000, renderMs: 10 }).export, "NOT_MEASURED");
});

test("invalid timings are refused and the timer uses the given clock", async () => {
  assert.throws(() => budgetReport({ sourcePixels: 0 }), /source/);
  assert.throws(() => budgetReport({ sourcePixels: 10, previewMs: -1 }), /timing/);
  let now = 5;
  const result = await timed(async () => { now += 37; return "done"; }, () => now);
  assert.deepEqual(result, { value: "done", ms: 37 });
});
