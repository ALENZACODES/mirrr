import assert from "node:assert/strict";
import test from "node:test";

import { upscaleFaceDetail } from "../../../../dist/js/engines/upscale/identity-hooks.js";

const before = new Uint8ClampedArray([10, 20, 30, 255]);
const after = new Uint8ClampedArray([220, 230, 240, 255]);

test("upscale face detail requires a guard before invoking the renderer", async () => {
  let called = 0;
  await assert.rejects(upscaleFaceDetail(before, 1, 1, new Uint8Array([255]), () => {
    called++;
    return after;
  }));
  assert.equal(called, 0);
});

test("upscale amount 3.0 maps to 0.5 and default lock is 5.0", async () => {
  let amount;
  let locked;
  const result = await upscaleFaceDetail(before, 1, 1, new Uint8Array([255]), (input, value) => {
    amount = value;
    return after;
  }, { guard: (source, edit, level) => {
    locked = level;
    return { pixels: edit, similarity: 0.2 };
  } });
  assert.equal(amount, 0.5);
  assert.equal(locked, 5);
  assert.equal(result.blendedBack, true);
  assert.ok(result.pixels[0] < 220);
});
