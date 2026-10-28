import assert from "node:assert/strict";
import test from "node:test";

import { guardFacePixels, PhotoEditCache } from "../../../dist/js/pro/index.js";

const hashA = "a".repeat(64);
const hashB = "b".repeat(64);
const before = new Uint8ClampedArray([20, 40, 60, 90, 20, 40, 60, 90]);
const after = new Uint8ClampedArray([220, 240, 255, 90, 220, 240, 255, 90]);
const mask = new Uint8Array([255, 0]);

test("face guard missing fails closed, not returning edited pixels", async () => {
  await assert.rejects(guardFacePixels(before, after, 2, 1, mask));
  const nonFace = await guardFacePixels(before, after, 2, 1, null);
  assert.equal(nonFace.guarded, false);
  assert.deepEqual(nonFace.pixels, after);
});

test("default face-edit level is 5; low similarity blends back", async () => {
  const seen = [];
  const guard = { guard: (source, edit, level) => {
    seen.push(level);
    source[0] = 0;
    return { pixels: edit, similarity: 0.1 };
  } };
  const strict = await guardFacePixels(before, after, 2, 1, mask, guard);
  const relaxed = await guardFacePixels(before, after, 2, 1, mask, guard, 1.0);
  assert.deepEqual(seen, [5, 1]);
  assert.ok(strict.pixels[0] < relaxed.pixels[0]);
  assert.equal(relaxed.pixels[0], after[0]);
  assert.equal(strict.pixels[4], after[4]);
  assert.equal(strict.pixels[3], before[3]);
  assert.equal(before[0], 20);
  assert.ok(strict.blendedBack);
});

test("guard output shape and similarity must be validated", async () => {
  const invalid = [
    { pixels: new Uint8ClampedArray(0), similarity: 1 },
    { pixels: after, similarity: NaN },
    { pixels: after, similarity: -1 },
    { pixels: after, similarity: 1.1 },
  ];
  for (const result of invalid) {
    await assert.rejects(guardFacePixels(before, after, 2, 1, mask, { guard: () => result }));
  }
});

test("five levels do not recompute masks, landmarks or source tiles", () => {
  const cache = new PhotoEditCache(512, 40);
  const count = { mask: 0, tile: 0, landmark: 0, render: 0 };
  for (const level of [1, 2, 3, 4, 5]) {
    for (const kind of Object.keys(count)) {
      cache.get(hashA, "curve", kind, "first", level, () => {
        count[kind]++;
        return new Uint8Array(8).fill(count[kind]);
      });
    }
  }
  assert.deepEqual(count, { mask: 1, tile: 1, landmark: 1, render: 5 });
  assert.equal(cache.stats.hits, 12);
  assert.equal(cache.stats.computations, 8);
});

test("cache is bounded, copy-on-read and invalidated on source replacement", () => {
  const cache = new PhotoEditCache(16, 2);
  const a = cache.get(hashA, "crop", "mask", "first", 3, () => new Uint8Array(8).fill(70));
  a.fill(255);
  assert.equal(cache.get(hashA, "crop", "mask", "first", 4, () => { throw Error("should be cached"); })[0], 70);
  cache.get(hashB, "crop", "tile", "first", 3, () => new Uint8Array(8));
  cache.get(hashA, "crop", "render", "first", 4, () => new Uint8Array(8));
  assert.equal(cache.stats.entries, 2);
  assert.equal(cache.stats.evictions, 1);
  cache.invalidatePhoto(hashA);
  assert.equal(cache.stats.entries, 1);
  cache.clear();
  assert.equal(cache.stats.bytes, 0);
});
