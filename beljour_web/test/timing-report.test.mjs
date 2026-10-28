// Deterministic report contracts; no wall-clock CI budgets.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  compareBudget,
  distribution,
  PREVIEW_WORKLOAD,
  FULL_WORKLOAD,
} from "../dist/js/diagnostics/timing-statistics.js";
import {
  buildTimingReport,
  safeTimingJson,
  timingReportText,
  validateTimingReport,
  TIMING_SCHEMA,
} from "../dist/js/diagnostics/timing-report.js";
import { drawTimingScene, measureSyntheticTiming } from "../dist/js/diagnostics/timing-sampler.js";

function fakeCanvas() {
  const operations = [];
  const context = {
    fillStyle: "", strokeStyle: "", globalAlpha: 1, lineWidth: 1, font: "",
    fillRect: (...v) => operations.push(["fill", ...v]),
    beginPath: () => operations.push(["path"]),
    ellipse: (...v) => operations.push(["ellipse", ...v]),
    fill: () => operations.push(["paint"]),
    stroke: () => operations.push(["stroke"]),
    moveTo: (...v) => operations.push(["move", ...v]),
    lineTo: (...v) => operations.push(["line", ...v]),
    fillText: (...v) => operations.push(["text", ...v]),
    save: () => operations.push(["save"]),
    restore: () => operations.push(["restore"]),
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
  };
  return {
    width: 0,
    height: 0,
    operations,
    getContext: (kind) => kind === "2d" ? context : null,
  };
}

test("median is order independent and p95 uses the nearest rank", () => {
  const observed = distribution([8, 1, 100, 4, 2, 3, 5]);
  assert.deepEqual(observed, {
    count: 7,
    medianMs: 4,
    p95Ms: 100,
    minMs: 1,
    maxMs: 100,
  });
  assert.equal(distribution([3, 5, 7, 9]).medianMs, 6);
  assert.equal(distribution([1, 2, 3]).p95Ms, 3);
});

test("timing statistics reject incomplete or corrupt samples", () => {
  for (const invalid of [[], [1], [1, 2], [1, -1, 2], [1, NaN, 2], [1, Infinity, 2], [1, 2, 999999]]) {
    assert.throws(() => distribution(invalid), RangeError);
  }
  assert.throws(() => distribution(Array(51).fill(1)), RangeError);
  assert.throws(() => compareBudget(distribution([1, 2, 3]), 0), RangeError);
});

test("reports include accurate workload sizes, median, p95 and planning targets", () => {
  const report = buildTimingReport([4, 8, 5, 6, 7], [1000, 1300, 1100, 1250, 1700]);
  assert.equal(report.schema, TIMING_SCHEMA);
  assert.equal(report.preview.count, 5);
  assert.equal(report.preview.medianMs, 6);
  assert.equal(report.preview.p95Ms, 8);
  assert.equal(report.full.medianMs, 1250);
  assert.equal(report.full.p95Ms, 1700);
  assert.equal(report.previewBudget.targetMs, 100);
  assert.equal(report.fullBudget.targetMs, 2000);
  assert.equal(report.fullWorkload.pixels, 12_000_000);
  assert.equal(PREVIEW_WORKLOAD.width, 512);
  assert.equal(FULL_WORKLOAD.height, 4000);
  assert.equal(report.cpuThrottleFactor, null);
  assert.equal(report.source, "synthetic-canvas");
  assert.ok(validateTimingReport(report));
  assert.match(timingReportText(report), /median 6.00 ms, p95 8.00 ms/);
});

test("budget comparisons report observations but do not fail CI on timings", () => {
  const slow = buildTimingReport([200, 250, 250], [5000, 6000, 7000]);
  assert.equal(slow.previewBudget.medianWithinTarget, false);
  assert.equal(slow.fullBudget.p95WithinTarget, false);
  assert.ok(validateTimingReport(slow));
  const fast = buildTimingReport([1, 1, 1], [100, 200, 300]);
  assert.equal(fast.previewBudget.medianWithinTarget, true);
  assert.equal(fast.fullBudget.p95WithinTarget, true);
});

test("headless report claims throttling only with an explicit factor", () => {
  const report = buildTimingReport([1, 2, 3], [4, 5, 6], "headless-cpu-throttled", 4);
  assert.equal(report.cpuThrottleFactor, 4);
  assert.match(report.limitations.join(" "), /not an actual three-year-old phone/);
  assert.throws(() => buildTimingReport([1, 2, 3], [4, 5, 6], "headless-cpu-throttled"), RangeError);
  assert.throws(() => buildTimingReport([1, 2, 3], [4, 5, 6], "browser", 4), RangeError);
});

test("safe timing reports cannot contain images, filenames or personal details", () => {
  const report = buildTimingReport([1, 2, 3], [5, 6, 7]);
  const json = safeTimingJson(report);
  const parsed = JSON.parse(json);
  assert.ok(validateTimingReport(parsed));
  for (const term of ["filename", "userAgent", "imageBytes", "data:image", "photoId", "faceId", "ipAddress"]) {
    assert.ok(!json.includes(term), `${term} must not be collected`);
  }
  assert.match(json, /beljour-device-timing\/1/);
  assert.ok(!validateTimingReport({ schema: "other" }));
  assert.throws(() => safeTimingJson({ schema: "unknown" }), RangeError);
});

test("the synthetic renderer paints deterministic shapes and a visible disclosure", () => {
  const canvas = fakeCanvas();
  const ctx = canvas.getContext("2d");
  drawTimingScene(ctx, PREVIEW_WORKLOAD, 0);
  assert.ok(canvas.operations.some((call) => call[0] === "ellipse"));
  assert.ok(canvas.operations.some((call) => call[0] === "text" && /SYNTHETIC/.test(call[1])));
  assert.ok(canvas.operations.some((call) => call[0] === "stroke"));
});

test("sampler reports 3 × 2 observations and always frees its canvas", async () => {
  const canvas = fakeCanvas();
  const doc = { createElement: () => canvas };
  let tick = 0;
  const progress = [];
  const report = await measureSyntheticTiming(doc, {
    iterations: 3,
    clock: () => (tick += 5),
    onProgress: (done, total) => progress.push([done, total]),
  });
  assert.equal(report.preview.medianMs, 5);
  assert.equal(report.full.p95Ms, 5);
  assert.equal(report.preview.count, 3);
  assert.equal(report.full.count, 3);
  assert.deepEqual(progress[0], [1, 6]);
  assert.deepEqual(progress.at(-1), [6, 6]);
  assert.equal(canvas.width, 0);
  assert.equal(canvas.height, 0);
});

test("cancelled and failed Canvas runs clean up without producing invented results", async () => {
  const controller = new AbortController();
  controller.abort();
  const canvas = fakeCanvas();
  await assert.rejects(measureSyntheticTiming({ createElement: () => canvas }, {
    iterations: 3,
    signal: controller.signal,
  }), /cancelled/);
  assert.equal(canvas.width, 0);
  assert.equal(canvas.height, 0);
  const unavailable = fakeCanvas();
  unavailable.getContext = () => null;
  await assert.rejects(measureSyntheticTiming({ createElement: () => unavailable }, { iterations: 3 }), /Canvas/);
  assert.equal(unavailable.width, 0);
  assert.equal(unavailable.height, 0);
  await assert.rejects(measureSyntheticTiming({ createElement: () => fakeCanvas() }, { iterations: 2 }), RangeError);
});
