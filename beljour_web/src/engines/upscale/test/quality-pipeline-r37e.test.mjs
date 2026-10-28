/** HD/4K pipeline order, identity lock and phases on drawn photos. Author: John Khan. */

import assert from "node:assert/strict";
import test from "node:test";

import { planAspectQuality, previewOf } from "../../../../dist/js/engines/upscale/quality-aspect.js";
import { cpuResize, cpuResizer, resizeCoverage } from "../../../../dist/js/engines/upscale/quality-generator.js";
import { STAGES, TIER_LABEL, runQualityPipeline } from "../../../../dist/js/engines/upscale/quality-pipeline.js";

const levels = { detailLevel: 4, denoiseLevel: 3, lockLevel: 5 };

function drawn(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const stripe = ((x >> 2) + (y >> 3)) % 2 ? 50 : 0;
    data.set([80 + stripe + (x % 3), 110 + stripe / 2, 140 - stripe, 255], (y * width + x) * 4);
  }
  return { width, height, data };
}

function face(width, height) {
  const mask = new Uint8Array(width * height);
  for (let y = 60; y < 150; y++) for (let x = 180; x < 300; x++) mask[y * width + x] = 255;
  return { mask, confirmed: true };
}

test("a release locks face pixels to an independent resize of the original", async () => {
  const source = drawn(480, 270), selection = face(480, 270);
  const plan = planAspectQuality(480, 270, "hd1080");
  const result = await runQualityPipeline(source, selection, plan, levels, { resizer: cpuResizer });
  assert.deepEqual([result.image.width, result.image.height], [1920, 1080]);
  const identity = cpuResize(source, 1920, 1080);
  const coverage = resizeCoverage(selection.mask, 480, 270, 1920, 1080);
  let locked = 0, textured = 0;
  for (let p = 0; p < coverage.length; p++) {
    const same = [0, 1, 2].every(c => result.image.data[p * 4 + c] === identity[p * 4 + c]);
    if (coverage[p] === 255) { assert.ok(same); locked++; } else if (!same) textured++;
  }
  assert.equal(result.audit.fullyLockedPixels, locked);
  assert.ok(locked > 0 && textured > 0, "texture reaches pixels outside the face only");
  assert.deepEqual(result.audit.stages, [...STAGES]);
  assert.equal(result.audit.identityMismatches, 0);
  assert.equal(result.audit.label, TIER_LABEL);
  assert.equal(result.audit.phase, "release");
});

test("previews run at 640 and phases must match their plan", async () => {
  const source = drawn(960, 540), selection = face(960, 540);
  const full = planAspectQuality(960, 540, "uhd4k");
  const preview = await runQualityPipeline(source, selection, previewOf(full), levels,
    { resizer: cpuResizer, phase: "preview" });
  assert.deepEqual([preview.image.width, preview.image.height, preview.audit.experimental], [640, 360, true]);
  await assert.rejects(runQualityPipeline(source, selection, previewOf(full), levels, { resizer: cpuResizer }),
    /full tier size/);
  await assert.rejects(runQualityPipeline(source, selection, full, levels, { resizer: cpuResizer, phase: "preview" }),
    /640/);
});

test("a lower lock lets texture reach the face, gradually", async () => {
  const source = drawn(480, 270), selection = face(480, 270);
  const plan = previewOf(planAspectQuality(480, 270, "hd1080"));
  const run = lockLevel => runQualityPipeline(source, selection, plan, { ...levels, lockLevel },
    { resizer: cpuResizer, phase: "preview" });
  const identity = cpuResize(source, plan.width, plan.height);
  const coverage = resizeCoverage(selection.mask, 480, 270, plan.width, plan.height);
  const gap = result => {
    let total = 0;
    for (let p = 0; p < coverage.length; p++) if (coverage[p]) {
      for (let c = 0; c < 3; c++) total += Math.abs(result.image.data[p * 4 + c] - identity[p * 4 + c]);
    }
    return total;
  };
  const [five, three, one] = [await run(5), await run(3), await run(1)];
  assert.equal(gap(five), 0);
  assert.ok(gap(three) > 0 && gap(three) <= gap(one));
  assert.equal(five.audit.fullyLockedPixels > 0, true);
  assert.equal(three.audit.fullyLockedPixels, 0);
});

test("the source is not modified and results are deterministic", async () => {
  const source = drawn(480, 270), selection = face(480, 270);
  const before = source.data.slice();
  const plan = previewOf(planAspectQuality(480, 270, "hd1080"));
  const a = await runQualityPipeline(source, selection, plan, levels, { resizer: cpuResizer, phase: "preview" });
  const b = await runQualityPipeline(source, selection, plan, levels, { resizer: cpuResizer, phase: "preview" });
  assert.deepEqual(source.data, before);
  assert.deepEqual(a.image.data, b.image.data);
});
