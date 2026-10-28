/** Tier export: release only, audit agrees with a re-plan, labelled and scrubbed.
 * Author: John Khan.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { planAspectQuality, previewOf } from "../../../../dist/js/engines/upscale/quality-aspect.js";
import { cpuResizer } from "../../../../dist/js/engines/upscale/quality-generator.js";
import { runQualityPipeline } from "../../../../dist/js/engines/upscale/quality-pipeline.js";
import { checkTierAudit, exportTierRelease } from "../../../../dist/js/engines/upscale/quality-export-tier.js";
import { hasMetadata } from "../../../../dist/js/save/export.js";

const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x04, 0x45, 0x78, 0xff, 0xda, 0x00, 0x02, 0xff, 0xd9]);
const encoder = calls => ({ encode: async (pixels, options) => { calls.push({ pixels, options }); return JPEG; } });
const source = { width: 480, height: 270, data: new Uint8ClampedArray(480 * 270 * 4).fill(130) };
const selection = { mask: new Uint8Array(480 * 270).fill(255, 40000, 60000), confirmed: true };
const levels = { detailLevel: 3, denoiseLevel: 2, lockLevel: 5 };

let release;
test.before(async () => {
  release = await runQualityPipeline(source, selection, planAspectQuality(480, 270, "hd1080"), levels,
    { resizer: cpuResizer });
});

test("an HD release exports labelled with metadata removed", async () => {
  const calls = [];
  const file = await exportTierRelease(release, {}, encoder(calls));
  assert.equal(file.name, "BELJOUR_HD1080.jpg");
  assert.equal(file.experimental, false);
  assert.equal(calls[0].options.label, "Simulation");
  assert.equal(calls[0].pixels.width, 1920);
  assert.equal(hasMetadata(new Uint8Array(await file.blob.arrayBuffer())), false);
  assert.equal((await exportTierRelease(release, { simulationLabel: false, mime: "image/jpeg" }, encoder([]))).label, null);
});

test("previews, diagnostics and mismatched or relabelled audits are refused", async () => {
  const preview = await runQualityPipeline(source, selection, previewOf(planAspectQuality(480, 270, "hd1080")), levels,
    { resizer: cpuResizer, phase: "preview" });
  assert.throws(() => checkTierAudit(preview), /full tier release/);
  const edits = [
    [{ tier: "uhd4k" }, /tier|fourfold/], [{ experimental: true }, /tier/], [{ label: "PASS" }, /label/],
    [{ stages: ["resize"] }, /stages/], [{ identityMismatches: 1 }, /outside/],
    [{ protectedPixels: 10 ** 8 }, /outside/], [{ fullyLockedPixels: 10 ** 7 }, /outside/],
    [{ lockLevel: 5.05 }, /levels/], [{ noPerson: true }, /face evidence/], [{ extra: 1 }, /complete/],
    [{ phase: "diagnostic" }, /full tier release/], [{ sourceWidth: 600 }, /tier/],
  ];
  for (const [change, pattern] of edits) {
    assert.throws(() => checkTierAudit({ ...release, audit: { ...release.audit, ...change } }), pattern,
      JSON.stringify(change));
  }
  const cropped = { ...release, image: { ...release.image, height: 1079,
    data: release.image.data.subarray(0, 1920 * 1079 * 4) } };
  assert.throws(() => checkTierAudit(cropped), /tier/);
});
