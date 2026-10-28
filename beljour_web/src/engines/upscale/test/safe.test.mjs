/** Guarded browser upscale on drawn pixels: lock, outside pixels, alpha, labels.
 * Author: John Khan.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { upscale } from "../../../../dist/js/engines/upscale/index.js";
import {
  SAFE_LABEL, SelectionRequired, blendValue, referenceShareTenths, safeUpscale,
} from "../../../../dist/js/engines/upscale/safe.js";

function drawn(width, height, channels = 4) {
  const data = new Uint8ClampedArray(width * height * channels);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * channels;
    data[i] = 70 + ((x >> 2) + (y >> 2)) % 2 * 35 + (x > y ? 45 : 0);
    data[i + 1] = 62 + ((x >> 2) + (y >> 2)) % 2 * 24;
    data[i + 2] = 58 + (x * 7 + y * 3) % 40;
    if (channels === 4) data[i + 3] = x < 5 && y < 5 ? 0 : 255;
  }
  return { width, height, channels, data };
}

function face(width, height) {
  const mask = new Uint8Array(width * height);
  for (let y = 10; y < 24; y++) for (let x = 14; x < 30; x++) mask[y * width + x] = 255;
  for (let y = 10; y < 24; y++) mask[y * width + 13] = 128;
  return mask;
}

function coverageAt(mask, width, scale, x, y) {
  return mask[Math.floor(y / scale) * width + Math.floor(x / scale)];
}

for (const scale of [2, 4]) {
  test(`full lock returns the reference inside the face at ${scale}x`, () => {
    const photo = drawn(40, 32), mask = face(40, 32);
    const result = safeUpscale(photo, { mask, confirmed: true }, { scale, detailLevel: 5 });
    const reference = upscale(photo, scale, 0), detailed = upscale(photo, scale, 1);
    let locked = 0, outside = 0, changed = 0;
    for (let y = 0; y < 32 * scale; y++) for (let x = 0; x < 40 * scale; x++) {
      const i = (y * 40 * scale + x) * 4, coverage = coverageAt(mask, 40, scale, x, y);
      for (let c = 0; c < 3; c++) {
        if (coverage === 255) {
          assert.equal(result.photo.data[i + c], reference.data[i + c]);
          if (reference.data[i + c] !== detailed.data[i + c]) changed++;
          locked++;
        } else if (coverage === 0) {
          assert.equal(result.photo.data[i + c], detailed.data[i + c]);
          outside++;
        }
      }
      assert.equal(result.photo.data[i + 3], reference.data[i + 3]);
    }
    assert.ok(locked > 0 && outside > 0 && changed > 0);
  });
}

test("lower locks blend toward the engine with integer weights", () => {
  const photo = drawn(40, 32), mask = face(40, 32);
  const low = safeUpscale(photo, { mask, confirmed: true }, { detailLevel: 5, lockLevel: 1 });
  const reference = upscale(photo, 2, 0), detailed = upscale(photo, 2, 1);
  const i = ((14 * 2) * 80 + 20 * 2) * 4;
  assert.equal(low.photo.data[i], blendValue(detailed.data[i], reference.data[i], 255, 10));
  assert.equal(blendValue(100, 200, 255, 50), 200);
  assert.equal(blendValue(100, 200, 0, 50), 100);
  assert.equal(blendValue(100, 200, 255, 10), 120);
});

test("no-face declaration gives the plain engine output", () => {
  const photo = drawn(32, 32, 3);
  const result = safeUpscale(photo, { mask: new Uint8Array(32 * 32), confirmed: true, noFace: true },
    { detailLevel: 4 });
  assert.deepEqual([...result.photo.data], [...upscale(photo, 2, 0.75).data]);
  assert.equal(result.facePixels, 0);
  assert.equal(result.photo.channels, 3);
});

test("levels, label and allocation are recorded", () => {
  const result = safeUpscale(drawn(40, 32), { mask: face(40, 32), confirmed: true },
    { detailLevel: 2.3, lockLevel: 4.4 });
  assert.equal(result.detailLevel, 2.3);
  assert.equal(result.lockLevel, 4.4);
  assert.equal(result.label, SAFE_LABEL);
  assert.match(SAFE_LABEL, /not identity verification/);
  assert.equal(result.allocation.basis, "SHAPE_ESTIMATE_NOT_MEASURED");
  assert.equal(referenceShareTenths(5), 50);
  assert.equal(result.facePixels, 14 * 17);
});

test("tight budgets tile the work and stay close to the whole-image render", () => {
  const photo = drawn(200, 160), mask = new Uint8Array(200 * 160);
  for (let y = 40; y < 120; y++) for (let x = 60; x < 140; x++) mask[y * 200 + x] = 255;
  const whole = safeUpscale(photo, { mask, confirmed: true });
  const tiled = safeUpscale(photo, { mask, confirmed: true }, { budgetBytes: 20 * 1024 * 1024 });
  assert.equal(whole.allocation.tiles, 1);
  assert.ok(tiled.allocation.tiles > 1);
  assert.ok(tiled.allocation.peakBytes <= 20 * 1024 * 1024);
  let differing = 0;
  for (let i = 0; i < whole.photo.data.length; i++) if (whole.photo.data[i] !== tiled.photo.data[i]) differing++;
  assert.ok(differing / whole.photo.data.length < 0.1);
});

test("a selection is required and must be consistent", () => {
  const photo = drawn(40, 32), mask = face(40, 32);
  const cases = [
    [undefined, /confirmed face selection/], [{ mask, confirmed: false }, /confirmed/],
    [{ mask: new Uint8Array(40 * 32), confirmed: true }, /no-face/],
    [{ mask, confirmed: true, noFace: true }, /contradicts/],
    [{ mask: mask.subarray(1), confirmed: true }, /matching/],
    [{ mask: Array.from(mask), confirmed: true }, /matching/],
  ];
  for (const [selection, pattern] of cases) {
    assert.throws(() => safeUpscale(photo, selection), error =>
      error instanceof SelectionRequired && pattern.test(error.message));
  }
});

test("the source is never modified", () => {
  const photo = drawn(40, 32), mask = face(40, 32);
  const before = photo.data.slice(), maskBefore = mask.slice();
  safeUpscale(photo, { mask, confirmed: true });
  assert.deepEqual(photo.data, before);
  assert.deepEqual(mask, maskBefore);
});
