/** Paired drawn-chart diagnostics and the metrics behind them. Author: John Khan. */

import assert from "node:assert/strict";
import test from "node:test";

import { cpuResizer } from "../../../../dist/js/engines/upscale/quality-generator.js";
import { psnrRgb, ssimLuma } from "../../../../dist/js/engines/upscale/quality-metrics.js";
import { PROXY_SIZES, downscaleHalf, drawnChart, pairedDiagnostic } from
  "../../../../dist/js/engines/upscale/quality-paired.js";

test("metrics behave at their known points", () => {
  const chart = drawnChart(64, 32);
  assert.equal(psnrRgb(chart, chart), Infinity);
  assert.ok(Math.abs(ssimLuma(chart, chart) - 1) < 1e-9);
  const shifted = { ...chart, data: chart.data.map((value, i) => (i % 4 === 3 ? value : Math.min(255, value + 10))) };
  assert.ok(psnrRgb(chart, shifted) > 25 && psnrRgb(chart, shifted) < 30);
  assert.ok(ssimLuma(chart, shifted) < 1);
  assert.throws(() => psnrRgb(chart, drawnChart(32, 32)), /size/);
});

test("area downscale averages exact 2 x 2 blocks", () => {
  const block = { width: 2, height: 2, data: Uint8ClampedArray.from([0, 0, 0, 255, 100, 100, 100, 255,
    200, 200, 200, 255, 100, 100, 100, 255]) };
  assert.deepEqual([...downscaleHalf(block).data], [100, 100, 100, 255]);
  assert.throws(() => downscaleHalf(drawnChart(3, 2)), /even/);
});

test("the paired report compares pipeline and basic resize on drawn charts only", async () => {
  const report = await pairedDiagnostic("hd1080", cpuResizer);
  assert.deepEqual([report.width, report.height], [PROXY_SIZES.hd1080.width, PROXY_SIZES.hd1080.height]);
  for (const key of ["pipelinePsnr", "baselinePsnr", "pipelineSsim", "baselineSsim"]) {
    assert.ok(Number.isFinite(report[key]), key);
  }
  assert.equal(report.psnrDelta, Number((report.pipelinePsnr - report.baselinePsnr).toFixed(4)));
  assert.equal(report.evidence, "SYNTHETIC_DRAWN_CHART");
  assert.equal(report.humanQuality, "NOT_RUN");
  assert.equal(report.releaseGate, "NOT_RUN");
  assert.deepEqual(await pairedDiagnostic("hd1080", cpuResizer), report, "deterministic");
});
