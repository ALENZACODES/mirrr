/** R27E head-pixel guard: anchored to original bytes, exact restoration, no biometric claim.
 * Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { IdentityLockUnavailable } from "../dist/js/body/posture-session.js";
import { HeadPixelGuard } from "../dist/js/body/posture-pixel-guard.js";
import { renderProtectedPosture } from "../dist/js/body/posture-safe.js";
import { drawnPostureFrame } from "./posture-dom-fake.mjs";

const flipped = (image) => ({ ...image, data: image.data.map((value) => 255 - value) });

test("the edit is returned with every marked head byte restored and similarity 1", async () => {
  const frame = await drawnPostureFrame("side");
  const guard = new HeadPixelGuard(frame.image, frame.head);
  assert.ok(guard.protectedPixels > 0);
  const decision = guard.guard(frame.image, flipped(frame.image), 5);
  assert.equal(decision.similarity, 1);
  assert.equal(guard.agreement(decision.image), 1);
  assert.equal(guard.agreement(flipped(frame.image)), 0);
});

test("changed original head evidence, other shapes and bad locks are refused", async () => {
  const frame = await drawnPostureFrame("front");
  const guard = new HeadPixelGuard(frame.image, frame.head);
  const index = frame.head.data.findIndex((value) => value >= 0.5);
  const changed = { ...frame.image, data: new Uint8Array(frame.image.data) };
  changed.data[index * 3] ^= 1;
  assert.throws(() => guard.guard(changed, frame.image, 5), /original head pixels changed/);
  assert.throws(() => guard.guard({ ...frame.image, width: 10 }, frame.image, 5), IdentityLockUnavailable);
  assert.throws(() => guard.guard(frame.image, frame.image, 5.05), /invalid lock level/);
});

test("dispose zeroes retained bytes and refuses further use", async () => {
  const frame = await drawnPostureFrame("front");
  const guard = new HeadPixelGuard(frame.image, frame.head);
  guard.dispose();
  assert.equal(guard.isDisposed, true);
  assert.equal(guard.protectedPixels, 0);
  assert.throws(() => guard.guard(frame.image, frame.image, 5), /released/);
});

test("as the face guard of a protected render it keeps the head exact for all three face fixes", async () => {
  for (const [view, fix] of [["front", "lean"], ["side", "rounded_shoulders"], ["side", "forward_head"]]) {
    const frame = await drawnPostureFrame(view);
    const guard = new HeadPixelGuard(frame.image, frame.head);
    const result = renderProtectedPosture(frame.image, frame.person, frame.head, frame.controls, fix, 5, guard, 5);
    assert.equal(result.guarded.similarity, 1, fix);
    assert.equal(result.guarded.identityRecovered, false, fix);
    assert.equal(guard.agreement(result.image), 1, fix);
  }
});
