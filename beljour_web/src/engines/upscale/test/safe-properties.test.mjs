/** Seeded property checks of the guarded browser upscale. Author: John Khan. */

import assert from "node:assert/strict";
import test from "node:test";

import { upscale } from "../../../../dist/js/engines/upscale/index.js";
import { blendValue, safeUpscale } from "../../../../dist/js/engines/upscale/safe.js";
import { inspectSafeResult } from "../../../../dist/js/engines/upscale/safe-quality.js";

function random(seed) {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13; state >>>= 0; state ^= state >>> 17; state ^= state << 5; state >>>= 0;
    return state / 2 ** 32;
  };
}

function randomCase(seed) {
  const next = random(seed);
  const pick = (low, high) => low + Math.floor(next() * (high - low + 1));
  const width = pick(12, 30), height = pick(12, 30), channels = next() < 0.5 ? 3 : 4;
  const data = new Uint8ClampedArray(width * height * channels);
  for (let i = 0; i < data.length; i++) data[i] = pick(0, 255);
  const mask = new Uint8Array(width * height);
  const top = pick(0, height >> 1), left = pick(0, width >> 1);
  for (let y = top; y < Math.min(height, top + (height / 3 | 0) + 1); y++) {
    for (let x = left; x < Math.min(width, left + (width / 3 | 0) + 1); x++) mask[y * width + x] = pick(1, 255);
  }
  return {
    photo: { width, height, channels, data }, selection: { mask, confirmed: true },
    detailLevel: pick(10, 50) / 10, lockLevel: pick(10, 50) / 10, scale: next() < 0.5 ? 2 : 4,
  };
}

test("random inputs satisfy every invariant", () => {
  for (let seed = 1; seed <= 10; seed++) {
    const { photo, selection, detailLevel, lockLevel, scale } = randomCase(seed);
    const result = safeUpscale(photo, selection, { detailLevel, lockLevel, scale });
    assert.equal(inspectSafeResult(photo, selection, result).status, "INVARIANTS_HOLD", `seed ${seed}`);
  }
});

test("output lies between engine and reference", () => {
  for (let seed = 20; seed < 25; seed++) {
    const { photo, selection, detailLevel, lockLevel, scale } = randomCase(seed);
    const result = safeUpscale(photo, selection, { detailLevel, lockLevel, scale });
    const engine = upscale(photo, scale, (detailLevel - 1) / 4), reference = upscale(photo, scale, 0);
    for (let i = 0; i < result.photo.data.length; i++) {
      if (photo.channels === 4 && i % 4 === 3) continue;
      const low = Math.min(engine.data[i], reference.data[i]), high = Math.max(engine.data[i], reference.data[i]);
      assert.ok(result.photo.data[i] >= low && result.photo.data[i] <= high);
    }
  }
});

test("raising the lock never moves a value away from the reference", () => {
  const next = random(9);
  for (let trial = 0; trial < 500; trial++) {
    const engine = Math.floor(next() * 256), reference = Math.floor(next() * 256);
    const coverage = Math.floor(next() * 256);
    let previous = Infinity;
    for (let tenths = 10; tenths <= 50; tenths++) {
      const gap = Math.abs(blendValue(engine, reference, coverage, tenths) - reference);
      assert.ok(gap <= previous);
      previous = gap;
    }
  }
});

test("results are deterministic", () => {
  const { photo, selection, detailLevel, lockLevel, scale } = randomCase(77);
  const first = safeUpscale(photo, selection, { detailLevel, lockLevel, scale });
  const second = safeUpscale(photo, selection, { detailLevel, lockLevel, scale });
  assert.deepEqual(first.photo.data, second.photo.data);
});
