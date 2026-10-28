/** Model chain at full HD tier size: audited export, forged-audit refusal, paired diagnostics.
 * Synthetic stand-in engines and drawn pixels only. Author: John Khan.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { candidates, syntheticFactory } from "./quality-model-fixtures-r38e.mjs";
import { planAspectQuality } from "../../../../dist/js/engines/upscale/quality-aspect.js";
import { checkTierAudit, exportTierRelease } from "../../../../dist/js/engines/upscale/quality-export-tier.js";
import { cpuResizer } from "../../../../dist/js/engines/upscale/quality-generator.js";
import {
  checkModelTierAudit, exportModelTierRelease, pairedModelDiagnostic, runModelQualityPipeline,
} from "../../../../dist/js/engines/upscale/quality-model-chain.js";
import { loadReviewedLocalModels } from "../../../../dist/js/engines/upscale/quality-model-loader.js";
import { previewOf } from "../../../../dist/js/engines/upscale/quality-aspect.js";

const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02, 0xff, 0xd9]);
const encoder = { encode: async () => JPEG };
const photo = () => ({ width: 480, height: 270,
  data: new Uint8ClampedArray(480 * 270 * 4).map((_, i) => (i % 4 === 3 ? 255 : (i * 17) % 251)) });
const noPerson = () => ({ mask: new Uint8Array(480 * 270), confirmed: true, noFace: true });
const levels = { detailLevel: 3, denoiseLevel: 2, lockLevel: 5 };

let shared = null;
async function released() {
  if (shared) return shared;
  const models = await loadReviewedLocalModels(candidates(), syntheticFactory());
  const result = await runModelQualityPipeline(photo(), noPerson(), planAspectQuality(480, 270, "hd1080"), levels,
    models, { resizer: cpuResizer, phase: "release" });
  shared = { models, result };
  return shared;
}

test("a full HD model release exports with the Simulation label", async () => {
  const { models, result } = await released();
  assert.deepEqual([result.image.width, result.image.height], [1920, 1080]);
  checkModelTierAudit(result, models.verifiedModels);
  const file = await exportModelTierRelease(result, models.verifiedModels, {}, encoder);
  assert.equal(file.tier, "hd1080");
  assert.equal(file.experimental, false);
  assert.equal(file.label, "Simulation");
  assert.match(file.name, /^BELJOUR_HD1080/);
});

test("forged or missing model audit fields are refused", async () => {
  const { models, result } = await released();
  const forge = changes => ({ image: result.image, audit: { ...result.audit, ...changes } });
  const otherDigest = [{ ...result.audit.models[0], weightsSha256: "f".repeat(64) }, result.audit.models[1]];
  const { models: _dropped, ...withoutModels } = result.audit;
  const cases = [
    [forge({ models: otherDigest }), /verified models that ran/],
    [forge({ models: result.audit.models.slice(0, 1) }), /verified models that ran/],
    [{ image: result.image, audit: withoutModels }, /verified models that ran/],
    [forge({ generator: "classical-local" }), /reviewed model chain label/],
    [forge({ stages: ["denoise", "resize", "texture", "identity"] }), /required stages/],
    [forge({ identityMismatches: 1 }), /outside what the pipeline can produce/],
    [forge({ width: 1919 }), /does not match its tier/],
    [forge({ extra: 1 }), /complete tier audit/],
  ];
  for (const [value, pattern] of cases) assert.throws(() => checkModelTierAudit(value, models.verifiedModels), pattern);
  assert.throws(() => checkModelTierAudit(result, models.verifiedModels.slice(0, 1)), /verified models that ran/);
  await assert.rejects(exportModelTierRelease(forge({ models: otherDigest }), models.verifiedModels, {}, encoder),
    /verified models that ran/);
});

test("the classical exporter does not accept a model audit", async () => {
  const { result } = await released();
  assert.throws(() => checkTierAudit(result), /complete tier audit/);
  await assert.rejects(exportTierRelease(result, {}, encoder), /complete tier audit/);
});

test("a model preview is refused for export", async () => {
  const { models } = await released();
  const preview = await runModelQualityPipeline(photo(), noPerson(), previewOf(planAspectQuality(480, 270, "hd1080")),
    levels, models, { resizer: cpuResizer, phase: "preview" });
  assert.deepEqual([preview.image.width, preview.image.height], [640, 360]);
  assert.throws(() => checkModelTierAudit(preview, models.verifiedModels), /Only a full tier release/);
});

test("paired diagnostics say they measured the model chain and stay diagnostics", async () => {
  const { models } = await released();
  const report = await pairedModelDiagnostic("hd1080", models);
  assert.equal(report.processing, "local-model-chain");
  assert.deepEqual(report.models.map(model => model.role), ["swinir_preclean", "realesrgan_upscale"]);
  assert.deepEqual([report.width, report.height], [512, 288]);
  assert.equal(report.evidence, "SYNTHETIC_DRAWN_CHART");
  assert.equal(report.humanQuality, "NOT_RUN");
  assert.equal(report.releaseGate, "NOT_RUN");
  assert.ok(Number.isFinite(report.pipelinePsnr) && Number.isFinite(report.baselinePsnr));
  assert.equal(report.psnrDelta, Number((report.pipelinePsnr - report.baselinePsnr).toFixed(4)));
  await assert.rejects(pairedModelDiagnostic("hd1080", null), /classical engine stays active/);
  await assert.rejects(pairedModelDiagnostic("sd480", models), /Unknown diagnostic family/);
});

test.after(async () => {
  await shared?.models.dispose();
});
