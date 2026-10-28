/** Colour integrity: luminance-only texture, no chroma shift, overrun refused.
 * Author: John Khan.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { planAspectQuality, previewOf } from "../../../../dist/js/engines/upscale/quality-aspect.js";
import { cpuResize, cpuResizer } from "../../../../dist/js/engines/upscale/quality-generator.js";
import { runQualityPipeline } from "../../../../dist/js/engines/upscale/quality-pipeline.js";
import { checkTierAudit } from "../../../../dist/js/engines/upscale/quality-export-tier.js";

function saturated(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const ring = (x + y) % 9 < 3 ? 40 : 0;
    data.set([200 - ring, 40 + ring / 2, 90 + ring, 255], (y * width + x) * 4);
  }
  return { width, height, data };
}

const noPerson = (width, height) => ({ mask: new Uint8Array(width * height), confirmed: true, noFace: true });

test("texture never changes R-G or B-G on unclipped pixels", async () => {
  const source = saturated(480, 270);
  const plan = previewOf(planAspectQuality(480, 270, "hd1080"));
  const result = await runQualityPipeline(source, noPerson(480, 270), plan,
    { detailLevel: 5, denoiseLevel: 1, lockLevel: 5 }, { resizer: cpuResizer, phase: "preview" });
  assert.equal(result.audit.chromaShift, 0);
  const resized = cpuResize(source, plan.width, plan.height);
  let textured = 0;
  for (let p = 0; p < plan.width * plan.height; p++) {
    const o = result.image.data, r = resized;
    const clipped = [0, 1, 2].some(c => o[p * 4 + c] === 0 || o[p * 4 + c] === 255);
    if (clipped) continue;
    assert.equal(o[p * 4] - o[p * 4 + 1], r[p * 4] - r[p * 4 + 1]);
    assert.equal(o[p * 4 + 2] - o[p * 4 + 1], r[p * 4 + 2] - r[p * 4 + 1]);
    if (o[p * 4] !== r[p * 4]) textured++;
  }
  assert.ok(textured > 0);
});

test("an audit that admits a colour shift cannot be exported", async () => {
  const source = saturated(480, 270);
  const result = await runQualityPipeline(source, noPerson(480, 270), planAspectQuality(480, 270, "hd1080"),
    { detailLevel: 3, denoiseLevel: 2, lockLevel: 5 }, { resizer: cpuResizer });
  checkTierAudit(result);
  assert.throws(() => checkTierAudit({ ...result, audit: { ...result.audit, chromaShift: 3 } }), /outside/);
  assert.throws(() => checkTierAudit({ ...result, audit: { ...result.audit, maxTextureDelta: 999 } }), /outside/);
});
