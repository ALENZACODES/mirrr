/** Bounded caches, explicit user lock, preview/release and fail-closed face protection. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { byteImage, floatImage } from "../dist/js/engines/core/buffer.js";
import * as Po from "../dist/js/engines/local/posture.js";
import * as Session from "../dist/js/body/posture-session.js";

const HASH = "4".repeat(64);
const fakeMask = () => {
  const mask = floatImage(128, 160);
  mask.data.fill(1);
  return mask;
};
const front = () => Po.makeControls("front", {
  right_shoulder: [42, 48], left_shoulder: [92, 48], right_hip: [54, 115], left_hip: [84, 115],
  mid_chest: [67, 65], navel: [69, 95],
}, 128, 160);
const fakeImage = () => {
  const image = byteImage(128, 160);
  image.data.fill(96);
  return image;
};

test("preview is bounded during slider drag and full on release", () => {
  const drag = Session.posturePreviewSize(3000, 4000, false);
  assert.deepEqual(drag, { width: 384, height: 512, scale: 0.128, fullResolution: false });
  const release = Session.posturePreviewSize(3000, 4000, true);
  assert.deepEqual(release, { width: 3000, height: 4000, scale: 1, fullResolution: true });
  assert.equal(Session.posturePreviewSize(200, 300, false).scale, 1);
  assert.throws(() => Session.posturePreviewSize(20000, 4, false), /invalid/);
});

test("keypoints computed once during five changes and plans reused per level", () => {
  const cache = new Session.PosturePhotoCache();
  let computations = 0;
  const points = () => {
    computations++;
    return front();
  };
  for (const level of [1, 2, 3, 4, 5]) cache.plan(HASH, "lean", level, points);
  assert.equal(cache.plans, 5);
  assert.equal(computations, 1);
  assert.strictEqual(cache.plan(HASH, "lean", 3, points), cache.plan(HASH, "lean", 3, points));
  assert.equal(computations, 1);
  cache.clear();
  assert.equal(cache.plans, 0);
});

test("band reused across five levels but callers never share a mutable array", () => {
  const cache = new Session.PosturePhotoCache();
  let calls = 0;
  const mask = () => {
    calls++;
    return fakeMask();
  };
  for (const level of [1, 2, 3, 4, 5]) {
    cache.plan(HASH, "lean", level, front);
    const band = cache.band(HASH, "lean", mask);
    assert.equal(band.width, 128);
    band.data.fill(0);
  }
  assert.equal(calls, 1);
  assert.ok(cache.bandBytes > 0);
  assert.equal(cache.band(HASH, "lean", mask).data[0], 1);
  cache.clear();
  assert.equal(cache.bandBytes, 0);
});

test("memory limits, malformed photo identity and cleanup fail conservatively", () => {
  const cache = new Session.PosturePhotoCache(2048);
  assert.throws(() => cache.plan("photo-name.jpg", "lean", 2, front), /photo hash/);
  assert.throws(() => cache.band(HASH, "lean", fakeMask), /memory budget/);
  assert.equal(cache.bandBytes, 0);
  assert.throws(() => new Session.PosturePhotoCache(2), /too small/);
});

test("identity lock is on by default and no provider cannot run a face edit", () => {
  const img = fakeImage(), mask = fakeMask();
  assert.throws(() => Session.guardedPostureRender(img, mask, front(), "lean", 1),
    Session.IdentityLockUnavailable);
});

test("default lock invokes guard and rejects low similarity; lowering user lock permits guarded edit", () => {
  const img = fakeImage(), mask = fakeMask(), controls = front();
  const seen = [];
  const guard = { guard(before, after, lockLevel) {
    seen.push(lockLevel);
    assert.notStrictEqual(before.data, img.data);
    return { image: after, similarity: 0.85 };
  } };
  const strict = Session.guardedPostureRender(img, mask, controls, "lean", 1, guard);
  assert.equal(strict.label, Po.SIMULATION_LABEL);
  assert.deepEqual(seen, [5]);
  assert.equal(strict.identityRecovered, true);
  assert.deepEqual(strict.image.data, img.data);
  const lowered = Session.guardedPostureRender(img, mask, controls, "lean", 1, guard, 1);
  assert.deepEqual(seen, [5, 1]);
  assert.equal(lowered.identityRecovered, false);
  assert.equal(lowered.lockLevel, 1);
  assert.equal(Session.postureIdentityFloor(5), 0.95);
  assert.equal(Session.postureIdentityFloor(1), 0.8);
});

test("invalid similarity cannot bypass default guard", () => {
  const img = fakeImage(), mask = fakeMask();
  const guard = { guard: (_before, after, _lock) => ({ image: after, similarity: NaN }) };
  assert.throws(() => Session.guardedPostureRender(img, mask, front(), "lean", 1, guard),
    Session.IdentityLockUnavailable);
});
