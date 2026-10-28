/** R26E protected renderer: head bytes restored, strict masks, face guard still required.
 * Drawn figures only. Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { floatImage } from "../dist/js/engines/core/buffer.js";
import { FIXES } from "../dist/js/engines/local/posture.js";
import { IdentityLockUnavailable } from "../dist/js/body/posture-session.js";
import { MAX_HEAD_SHARE, ProtectedRenderRefused, renderProtectedPosture } from "../dist/js/body/posture-safe.js";
import { drawnPostureFrame, echoGuard } from "./posture-dom-fake.mjs";

function sameHead(source, output, head) {
  const channels = source.channels;
  for (let p = 0; p < head.data.length; p++) {
    if (head.data[p] < 0.5) continue;
    for (let c = 0; c < channels; c++) if (source.data[p * channels + c] !== output.data[p * channels + c]) return false;
  }
  return true;
}

for (const fix of Object.keys(FIXES)) {
  test(`${FIXES[fix].id} ${fix}: every marked head byte matches the source`, async () => {
    const frame = await drawnPostureFrame(FIXES[fix].view);
    const before = new Uint8Array(frame.image.data);
    const result = renderProtectedPosture(frame.image, frame.person, frame.head, frame.controls, fix, 5,
      echoGuard(0.99), 5);
    assert.ok(sameHead(frame.image, result.image, frame.head));
    assert.deepEqual(frame.image.data, before, "source must not be modified");
    assert.ok(result.headPixels > 0);
    assert.equal(result.label, "Simulation. Photo edit only, not medical advice.");
  });
}

test("a low user lock still restores the head even when the guard keeps the edit", async () => {
  const frame = await drawnPostureFrame("side");
  const result = renderProtectedPosture(frame.image, frame.person, frame.head, frame.controls, "forward_head", 5,
    echoGuard(0.85), 1);
  assert.equal(result.guarded.identityRecovered, false);
  assert.ok(result.headPixelsRestored > 0);
  assert.ok(sameHead(frame.image, result.image, frame.head));
});

test("face-adjacent fixes without a guard fail closed", async () => {
  const frame = await drawnPostureFrame("front");
  assert.throws(() => renderProtectedPosture(frame.image, frame.person, frame.head, frame.controls, "lean", 5, null),
    IdentityLockUnavailable);
});

test("missing, empty, oversized and malformed head masks are refused", async () => {
  const frame = await drawnPostureFrame("front");
  const { width, height } = frame.image;
  const full = floatImage(width, height);
  full.data.fill(1);
  const nan = floatImage(width, height);
  nan.data.fill(Number.NaN);
  const over = floatImage(width, height);
  over.data.fill(2);
  const cases = [[null, "head_mask_required"], [floatImage(width, height), "empty_head_mask"],
    [full, "oversized_head_mask"], [floatImage(width, height - 1), "invalid_head_mask"],
    [nan, "invalid_head_mask"], [over, "invalid_head_mask"], [floatImage(width, height, 3), "invalid_head_mask"]];
  for (const [mask, code] of cases) {
    assert.throws(() => renderProtectedPosture(frame.image, frame.person, mask, frame.controls, "uneven_shoulders"),
      (error) => error instanceof ProtectedRenderRefused && error.code === code, code);
  }
});

test("the head share limit is inclusive", async () => {
  const frame = await drawnPostureFrame("front");
  const { width, height } = frame.image;
  const mask = floatImage(width, height);
  const limit = Math.floor(MAX_HEAD_SHARE * width * height);
  mask.data.fill(1, 0, limit);
  renderProtectedPosture(frame.image, frame.person, mask, frame.controls, "uneven_shoulders");
  mask.data[limit] = 1;
  assert.throws(() => renderProtectedPosture(frame.image, frame.person, mask, frame.controls, "uneven_shoulders"),
    /oversized_head_mask/);
});

test("invalid source images are refused before any render", async () => {
  const frame = await drawnPostureFrame("front");
  const broken = { ...frame.image, data: frame.image.data.subarray(1) };
  assert.throws(() => renderProtectedPosture(broken, frame.person, frame.head, frame.controls, "uneven_shoulders"),
    /invalid_source_image/);
});
