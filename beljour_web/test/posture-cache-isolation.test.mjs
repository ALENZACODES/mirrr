/** Photo deletion and manual control edits purge stale posture cache state. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { floatImage } from "../dist/js/engines/core/buffer.js";
import { makeControls } from "../dist/js/engines/local/posture.js";
import { PosturePhotoCache } from "../dist/js/body/posture-session.js";

const H1 = "1".repeat(64);
const H2 = "2".repeat(64);
const points = (lean) => makeControls("front", {
  right_shoulder: [35 + lean, 42], left_shoulder: [85 + lean, 42],
  right_hip: [45, 110], left_hip: [75, 110],
  mid_chest: [60 + lean, 64], navel: [60, 94],
}, 128, 160);
const person = () => {
  const mask = floatImage(128, 160);
  mask.data.fill(1);
  return mask;
};

test("updated manual controls on the same photo invalidate old level plans", () => {
  const cache = new PosturePhotoCache();
  const a = cache.plan(H1, "lean", 5, () => points(2));
  assert.strictEqual(cache.plan(H1, "lean", 5, () => points(5)), a);
  cache.invalidatePhoto(H1);
  const b = cache.plan(H1, "lean", 5, () => points(5));
  assert.notStrictEqual(a, b);
  assert.notEqual(a.measureBefore, b.measureBefore);
  assert.equal(cache.plans, 1);
});

test("photo deletion releases only its own bands, plans and captured points", () => {
  const cache = new PosturePhotoCache();
  cache.plan(H1, "lean", 2, () => points(1));
  const preserved = cache.plan(H2, "lean", 2, () => points(2));
  cache.band(H1, "lean", person);
  cache.band(H2, "lean", person);
  const amount = cache.bandBytes;
  cache.invalidatePhoto(H1);
  assert.equal(cache.plans, 1);
  assert.ok(cache.bandBytes > 0 && cache.bandBytes < amount);
  assert.strictEqual(cache.plan(H2, "lean", 2, () => points(2)), preserved);
});

test("content hashes must be canonical and never depend on filenames", () => {
  const cache = new PosturePhotoCache();
  for (const bad of ["image.png", "", "A".repeat(64), "2".repeat(63)]) {
    assert.throws(() => cache.invalidatePhoto(bad), /photo hash/);
  }
});

test("a mutated caller band cannot alter the cached mask", () => {
  const cache = new PosturePhotoCache();
  const before = cache.band(H1, "lean", person);
  before.data.fill(0);
  const after = cache.band(H1, "lean", person);
  assert.ok(after.data.every((value) => value === 1));
  assert.notStrictEqual(before.data, after.data);
});
