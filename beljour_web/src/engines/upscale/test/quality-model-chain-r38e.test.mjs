/** Reviewed model chain on drawn pixels with tiny synthetic stand-in engines.
 * Author: John Khan.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { candidates, nearest, syntheticFactory } from "./quality-model-fixtures-r38e.mjs";
import { planCustomQuality } from "../../../../dist/js/engines/upscale/quality-aspect.js";
import { cpuResize, cpuResizer, resizeCoverage } from "../../../../dist/js/engines/upscale/quality-generator.js";
import {
  MODEL_GENERATOR, MODEL_STAGES, MODEL_TIER_LABEL, activeModelChain, describeEngine, runModelQualityPipeline,
} from "../../../../dist/js/engines/upscale/quality-model-chain.js";
import { loadReviewedLocalModels } from "../../../../dist/js/engines/upscale/quality-model-loader.js";
import { TIER_LABEL } from "../../../../dist/js/engines/upscale/quality-pipeline.js";

const W = 32, H = 24;
const drawn = () => ({ width: W, height: H,
  data: new Uint8ClampedArray(W * H * 4).map((_, i) => (i % 4 === 3 ? 255 : (i * 29 + (i >> 7) * 7) % 256)) });
const plan = planCustomQuality(W, H, 64, 48);
const noPerson = () => ({ mask: new Uint8Array(W * H), confirmed: true, noFace: true });
const face = () => {
  const mask = new Uint8Array(W * H);
  for (let y = 6; y < 18; y++) mask.fill(255, y * W + 10, y * W + 22);
  return { mask, confirmed: true };
};
const levels = { detailLevel: 3, denoiseLevel: 3, lockLevel: 5 };
const options = { resizer: cpuResizer, phase: "diagnostic" };

async function session(log = [], extra = {}) {
  return loadReviewedLocalModels(candidates(), syntheticFactory(log, extra));
}

test("without reviewed weights the chain refuses and the classical engine stays", async () => {
  assert.throws(() => activeModelChain(null), /No reviewed local model weights are installed/);
  await assert.rejects(runModelQualityPipeline(drawn(), noPerson(), plan, levels, undefined, options),
    /classical engine stays active/);
  assert.deepEqual(describeEngine(null), { engine: "classical-local", label: TIER_LABEL, models: [] });
});

test("stages run in order and the audit names the verified digests", async () => {
  const log = [];
  const models = await session(log);
  const result = await runModelQualityPipeline(drawn(), noPerson(), plan, levels, models, options);
  assert.deepEqual(log.filter(row => row.run).map(row => row.run), ["preclean", "upscale"]);
  assert.deepEqual([result.image.width, result.image.height], [64, 48]);
  assert.equal(result.audit.generator, MODEL_GENERATOR);
  assert.equal(result.audit.label, MODEL_TIER_LABEL);
  assert.deepEqual(result.audit.stages, [...MODEL_STAGES]);
  const reviewed = candidates();
  assert.deepEqual(result.audit.models, [
    { role: "swinir_preclean", modelId: reviewed.preclean.record.modelId,
      weightsSha256: reviewed.preclean.record.weightsSha256 },
    { role: "realesrgan_upscale", modelId: reviewed.upscale.record.modelId,
      weightsSha256: reviewed.upscale.record.weightsSha256 },
  ]);
  assert.equal(result.audit.chromaShift, 0);
  assert.deepEqual(describeEngine(models).models, result.audit.models);
  await models.dispose();
});

test("at 5.0 marked face pixels equal the classical resize of the original, not model output", async () => {
  const models = await session();
  const photo = drawn();
  const selection = face();
  const result = await runModelQualityPipeline(photo, selection, plan, levels, models, options);
  const reference = cpuResize(photo, 64, 48);
  const coverage = resizeCoverage(selection.mask, W, H, 64, 48);
  let locked = 0;
  for (let p = 0; p < coverage.length; p++) {
    if (coverage[p] !== 255) continue;
    locked += 1;
    assert.deepEqual(result.image.data.subarray(p * 4, p * 4 + 4), reference.subarray(p * 4, p * 4 + 4));
  }
  assert.ok(locked > 0);
  assert.equal(result.audit.fullyLockedPixels, locked);
  assert.equal(result.audit.identityMismatches, 0);
  await models.dispose();
});

test("at the lowest denoise and detail the unlocked pixels are exactly the model upscale", async () => {
  const models = await session();
  const photo = drawn();
  const result = await runModelQualityPipeline(photo, noPerson(), plan,
    { detailLevel: 1, denoiseLevel: 1, lockLevel: 5 }, models, options);
  assert.deepEqual(result.image.data, nearest(photo, 64, 48));
  await models.dispose();
});

test("the pre-clean moves the photo by the denoise level", async () => {
  const seen = [];
  const models = await session([], { upscale: (source, width, height) => {
    seen.push(Array.from(source.data.subarray(0, 4)));
    return nearest(source, width, height);
  } });
  const photo = drawn();
  for (const denoiseLevel of [1, 3, 5]) {
    await runModelQualityPipeline(photo, noPerson(), plan, { ...levels, denoiseLevel }, models, options);
  }
  const first = Array.from(photo.data.subarray(0, 3));
  const full = first.map(value => value + Math.round((128 - value) / 4));
  assert.deepEqual(seen[0].slice(0, 3), first);
  assert.deepEqual(seen[2].slice(0, 3), full);
  assert.ok(seen.every(pixel => pixel[3] === 255), "alpha stays the photo's own");
  await models.dispose();
});

test("temporary copies handed to model stages are wiped afterwards", async () => {
  const handed = [];
  const models = await session([], { upscale: (source, width, height) => {
    handed.push(source.data);
    return nearest(source, width, height);
  } });
  const photo = drawn();
  await runModelQualityPipeline(photo, face(), plan, levels, models, options);
  assert.ok(handed[0].every(value => value === 0));
  assert.ok(photo.data.some(value => value !== 0), "the caller's photo is untouched");
  await models.dispose();
});

test("a failing or malformed model stage refuses with no classical substitute", async () => {
  const failing = await session([], { fail: "upscale" });
  await assert.rejects(runModelQualityPipeline(drawn(), noPerson(), plan, levels, failing, options),
    /upscale model failed; no classical substitute was used/);
  await failing.dispose();
  const malformed = await session([], { upscale: () => new Uint8ClampedArray(4) });
  await assert.rejects(runModelQualityPipeline(drawn(), noPerson(), plan, levels, malformed, options),
    /upscale model returned an invalid result/);
  await malformed.dispose();
});

test("a disposed session, a cancelled job or a wrong phase is refused", async () => {
  const models = await session();
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(runModelQualityPipeline(drawn(), noPerson(), plan, levels, models,
    { ...options, signal: controller.signal }), error => error.name === "AbortError");
  await assert.rejects(runModelQualityPipeline(drawn(), noPerson(), plan, levels, models,
    { ...options, phase: "release" }), /full tier size/);
  await models.dispose();
  await assert.rejects(runModelQualityPipeline(drawn(), noPerson(), plan, levels, models, options), /disposed/);
  assert.throws(() => describeEngine(models), /disposed/);
});

test("an unconfirmed face selection is refused before any model runs", async () => {
  const log = [];
  const models = await session(log);
  await assert.rejects(runModelQualityPipeline(drawn(), { mask: face().mask, confirmed: false }, plan, levels,
    models, options));
  assert.deepEqual(log.filter(row => row.run), []);
  await models.dispose();
});
