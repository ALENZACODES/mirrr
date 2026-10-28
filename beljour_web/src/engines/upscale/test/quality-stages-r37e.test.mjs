/** HD/4K stages on drawn pixels: flat-only denoise, source-only texture. Author: John Khan. */

import assert from "node:assert/strict";
import test from "node:test";

import {
  FLAT_RANGE, MAX_TEXTURE_DELTA, denoiseFlat, resamplePlane, sourceResidual, transportTexture,
} from "../../../../dist/js/engines/upscale/quality-stages.js";

function noisyFlatWithEdge(width = 40, height = 20) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const base = x < width / 2 ? 100 : 200;
    const noise = (x * 7 + y * 13) % 3 - 1;
    data.set([base + noise, base + noise, base + noise, 255], (y * width + x) * 4);
  }
  return { width, height, data };
}

test("denoise smooths flat noise but leaves the edge columns alone", () => {
  const source = noisyFlatWithEdge();
  const out = denoiseFlat(source, 5);
  const row = 10 * 40;
  const spread = values => Math.max(...values) - Math.min(...values);
  const before = [], after = [];
  for (let x = 2; x < 18; x++) { before.push(source.data[(row + x) * 4]); after.push(out.data[(row + x) * 4]); }
  assert.ok(spread(after) <= spread(before));
  for (const x of [19, 20]) assert.equal(out.data[(row + x) * 4], source.data[(row + x) * 4], "edge kept");
  assert.notEqual(out.data, source.data);
  assert.deepEqual(denoiseFlat(source, 1).data, source.data, "level 1.0 changes nothing");
  assert.ok(FLAT_RANGE > 0);
});

test("texture comes only from the source residual and is bounded", () => {
  const flat = { width: 16, height: 16, data: new Uint8ClampedArray(16 * 16 * 4).fill(120) };
  const residual = sourceResidual(flat);
  assert.ok(residual.every(value => Math.abs(value) < 1e-4), "a flat source has no texture to give");
  const resized = new Uint8ClampedArray(32 * 32 * 4).fill(120);
  const none = transportTexture(resized, 32, 32, resamplePlane(residual, 16, 16, 32, 32), 5);
  assert.deepEqual(none.pixels, resized);
  const edge = noisyFlatWithEdge();
  const strong = transportTexture(new Uint8ClampedArray(80 * 40 * 4).fill(150), 80, 40,
    resamplePlane(sourceResidual(edge), 40, 20, 80, 40), 5);
  assert.ok(strong.maxDelta > 0 && strong.maxDelta <= MAX_TEXTURE_DELTA);
  assert.equal(strong.chromaShift, 0);
});

test("plane resampling preserves constants and interpolates", () => {
  const plane = Float32Array.from([0, 10, 20, 30]);
  const out = resamplePlane(plane, 2, 2, 4, 4);
  assert.equal(out[0], 0);
  assert.ok(out[5] > 0 && out[5] < 30);
  assert.ok(resamplePlane(new Float32Array(9).fill(4), 3, 3, 7, 5).every(value => Math.abs(value - 4) < 1e-6));
});

test("invalid levels and mismatched layers are refused", () => {
  const source = noisyFlatWithEdge();
  assert.throws(() => denoiseFlat(source, 6), /strength/);
  assert.throws(() => transportTexture(new Uint8ClampedArray(16), 2, 2, new Float32Array(3), 3), /differ/);
});
