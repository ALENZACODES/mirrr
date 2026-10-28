/** Quality Generator pixels on drawn sources: lock, luminance-only detail, padding.
 * Author: John Khan.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_DETAIL_DELTA, QUALITY_LABEL, cpuResize, cpuResizer, luminanceDetail, prepareReference,
  renderFromReference, renderQuality,
} from "../../../../dist/js/engines/upscale/quality-generator.js";
import { planFixedTier } from "../../../../dist/js/engines/upscale/quality-tier.js";

function drawn(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    const stripe = ((x >> 3) + (y >> 3)) % 2 ? 60 : 0;
    data.set([90 + stripe, 120 + stripe / 2, 150 - stripe, 255], i);
  }
  return { width, height, data };
}

function faceSelection(width, height) {
  const mask = new Uint8Array(width * height);
  for (let y = height / 4; y < height / 2; y++) for (let x = width / 3; x < width / 2; x++) mask[y * width + x] = 255;
  return { mask, confirmed: true };
}

test("the CPU resampler is exact on flat colour and averages when shrinking", () => {
  const flat = { width: 10, height: 6, data: new Uint8ClampedArray(240).fill(77) };
  assert.ok(cpuResize(flat, 37, 23).every(value => value === 77));
  const pair = { width: 2, height: 1, data: Uint8ClampedArray.from([0, 0, 0, 255, 200, 200, 200, 255]) };
  assert.deepEqual([...cpuResize(pair, 1, 1)], [100, 100, 100, 255]);
});

test("full lock keeps face pixels equal to the resized original", async () => {
  const source = drawn(480, 270), selection = faceSelection(480, 270);
  const plan = planFixedTier(480, 270);
  const reference = await prepareReference(source, selection, plan, cpuResizer);
  const render = renderFromReference(reference, { detailLevel: 5, lockLevel: 5 }, true);
  let face = 0, changedOutside = 0;
  for (let p = 0; p < plan.contentWidth * plan.contentHeight; p++) {
    for (let c = 0; c < 3; c++) {
      const out = render.image.data[p * 4 + c], ref = reference.content[p * 4 + c];
      if (reference.coverage[p] === 255) assert.equal(out, ref);
      else if (out !== ref) changedOutside++;
    }
    if (reference.coverage[p] === 255) face++;
  }
  assert.ok(face > 0 && changedOutside > 0);
  assert.equal(render.audit.fullyLockedPixels, face);
  assert.equal(render.audit.label, QUALITY_LABEL);
});

test("detail changes luminance only and stays bounded", () => {
  const source = drawn(64, 48);
  const { pixels, maxDelta } = luminanceDetail(source.data, 64, 48, 5);
  assert.ok(maxDelta > 0 && maxDelta <= MAX_DETAIL_DELTA);
  for (let p = 0; p < 64 * 48; p++) {
    const d = [0, 1, 2].map(c => pixels[p * 4 + c] - source.data[p * 4 + c]);
    const unclipped = [0, 1, 2].every(c => pixels[p * 4 + c] > 0 && pixels[p * 4 + c] < 255);
    if (unclipped) assert.ok(d[0] === d[1] && d[1] === d[2], "same change on every channel");
  }
  assert.deepEqual(luminanceDetail(source.data, 64, 48, 1).pixels, source.data);
});

test("padding is white and the content is centred", async () => {
  const source = drawn(400, 400);
  const render = await renderQuality(source, { mask: new Uint8Array(400 * 400), confirmed: true, noFace: true },
    planFixedTier(400, 400), { detailLevel: 3, lockLevel: 5 }, { resizer: cpuResizer });
  assert.deepEqual([render.image.width, render.image.height], [1920, 1080]);
  assert.deepEqual([...render.image.data.subarray(0, 4)], [255, 255, 255, 255]);
  assert.equal(render.audit.offsetX, 420);
  assert.equal(render.audit.noPerson, true);
  assert.equal(render.audit.protectedPixels, 0);
});

test("a selection is required, and a no-person declaration must not carry a face", async () => {
  const source = drawn(480, 270), plan = planFixedTier(480, 270);
  await assert.rejects(prepareReference(source, undefined, plan, cpuResizer), /selection/);
  await assert.rejects(prepareReference(source, { ...faceSelection(480, 270), noFace: true }, plan, cpuResizer),
    /contradicts/);
  await assert.rejects(prepareReference(drawn(500, 270), faceSelection(480, 270), plan, cpuResizer), /photo size/);
  await assert.rejects(prepareReference(source, faceSelection(480, 270), plan, async () => new Uint8ClampedArray(4)),
    /wrong size/);
});

test("invalid levels are refused", () => {
  const reference = { plan: planFixedTier(480, 270), content: new Uint8ClampedArray(1920 * 1080 * 4),
    coverage: new Uint8Array(1920 * 1080), noPerson: true };
  assert.throws(() => renderFromReference(reference, { detailLevel: 5.5, lockLevel: 5 }, true), /strength/);
  assert.throws(() => renderFromReference(reference, { detailLevel: 3, lockLevel: 0.5 }, true), /strength/);
});
