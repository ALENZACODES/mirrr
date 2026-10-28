/** Negative controls for the HD/4K pipeline: malformed rasters, levels, phases,
 * cancellation and wiping of temporary copies. Author: John Khan.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { planAspectQuality, previewOf } from "../../../../dist/js/engines/upscale/quality-aspect.js";
import { cpuResize } from "../../../../dist/js/engines/upscale/quality-generator.js";
import { runQualityPipeline } from "../../../../dist/js/engines/upscale/quality-pipeline.js";
import { checkedRaster, copyRaster, withTemporary } from "../../../../dist/js/engines/upscale/quality-raster.js";

const W = 480, H = 270;
const levels = { detailLevel: 3, denoiseLevel: 2, lockLevel: 5 };
const photo = () => ({ width: W, height: H, data: new Uint8ClampedArray(W * H * 4).fill(150) });
const faceMask = () => ({ mask: new Uint8Array(W * H).fill(255, 30000, 40000), confirmed: true });
const preview = previewOf(planAspectQuality(W, H, "hd1080"));

test("malformed or non-opaque rasters are refused", () => {
  assert.throws(() => checkedRaster({ width: 2, height: 2, data: new Uint8ClampedArray(15) }), /bytes/);
  assert.throws(() => checkedRaster({ width: 0, height: 2, data: new Uint8ClampedArray(0) }), /dimensions/);
  assert.throws(() => checkedRaster({ width: 1, height: 1, data: [1, 2, 3, 4] }), /bytes/);
  assert.throws(() => checkedRaster({ width: 1, height: 1, data: Uint8ClampedArray.from([1, 2, 3, 4]) },
    { opaque: true }), /transparent/);
});

test("invalid levels, unconfirmed faces and wrong-size plans are refused", async () => {
  for (const bad of [{ ...levels, detailLevel: 0 }, { ...levels, lockLevel: 5.01 }, { ...levels, denoiseLevel: "3" }, {}]) {
    await assert.rejects(runQualityPipeline(photo(), faceMask(), preview, bad, { resizer: async (s, w, h) => cpuResize(s, w, h), phase: "preview" }),
      /strength/);
  }
  await assert.rejects(runQualityPipeline(photo(), { ...faceMask(), confirmed: "yes" }, preview, levels,
    { phase: "preview" }), /confirmed/);
  await assert.rejects(runQualityPipeline({ width: 500, height: 270, data: new Uint8ClampedArray(500 * 270 * 4) },
    faceMask(), preview, levels, { phase: "preview" }), /another photo/);
  await assert.rejects(runQualityPipeline(photo(), faceMask(), preview, levels, { phase: "export" }), /phase/);
});

test("a cancelled job stops and wipes its temporary copies", async () => {
  const seen = [];
  const controller = new AbortController();
  const resizer = async (source, width, height) => {
    seen.push(source.data);
    controller.abort();
    return cpuResize(source, width, height);
  };
  await assert.rejects(runQualityPipeline(photo(), faceMask(), preview, levels,
    { resizer, phase: "preview", signal: controller.signal }), error => error.name === "AbortError");
  assert.ok(seen.length >= 1);
  assert.ok(seen.every(buffer => buffer.every(value => value === 0)), "temporary photo copies are zeroed");
});

test("copies handed to the resizer are wiped after success too", async () => {
  const seen = [];
  const resizer = async (source, width, height) => { seen.push(source.data); return cpuResize(source, width, height); };
  const source = photo();
  await runQualityPipeline(source, faceMask(), preview, levels, { resizer, phase: "preview" });
  assert.equal(seen.length, 2, "denoised copy and original copy");
  assert.ok(seen.every(buffer => buffer !== source.data && buffer.every(value => value === 0)));
  assert.ok(source.data.every(value => value === 150), "the caller's photo is untouched");
});

test("a resizer returning the wrong size is refused", async () => {
  await assert.rejects(runQualityPipeline(photo(), faceMask(), preview, levels,
    { resizer: async () => new Uint8ClampedArray(8), phase: "preview" }), /wrong size/);
});

test("withTemporary wipes even when the step throws", async () => {
  const copy = copyRaster(photo());
  await assert.rejects(withTemporary(copy, async () => { throw new Error("boom"); }), /boom/);
  assert.ok(copy.data.every(value => value === 0));
});
