/** Aspect-preserving HD 1080 and 4K planning. Author: John Khan. */

import assert from "node:assert/strict";
import test from "node:test";

import { MAX_OUTPUT_PIXELS, planAspectQuality, planCustomQuality, previewOf } from
  "../../../../dist/js/engines/upscale/quality-aspect.js";

test("the long edge is exactly 1920 or 3840 and the aspect is kept", () => {
  const cases = [[1600, 900, "hd1080", 1920, 1080], [900, 1600, "hd1080", 1080, 1920],
    [3000, 2000, "hd1080", 1920, 1280], [3000, 2000, "uhd4k", 3840, 2560], [1000, 1000, "uhd4k", 3840, 3840],
    [1234, 567, "hd1080", 1920, 882]];
  for (const [w, h, tier, width, height] of cases) {
    const plan = planAspectQuality(w, h, tier);
    assert.deepEqual([plan.width, plan.height], [width, height], `${w}x${h} ${tier}`);
    assert.ok(plan.aspectErrorPixels <= 0.5);
    assert.equal(plan.padded, false);
    assert.equal(plan.offsetX + plan.offsetY, 0);
    assert.equal(plan.orientation, w >= h ? "landscape" : "portrait");
  }
});

test("4K is marked experimental and HD is not", () => {
  assert.equal(planAspectQuality(2000, 1000, "uhd4k").experimental, true);
  assert.equal(planAspectQuality(2000, 1000, "hd1080").experimental, false);
});

test("enlargement, source and output limits refuse instead of downgrading", () => {
  assert.equal(planAspectQuality(960, 540, "uhd4k").enlargement, 4);
  assert.throws(() => planAspectQuality(959, 540, "uhd4k"), /fourfold/);
  assert.ok(planAspectQuality(959, 540, "hd1080"));
  assert.throws(() => planAspectQuality(6000, 4500), /24 megapixels/);
  assert.ok(3840 * 3840 <= MAX_OUTPUT_PIXELS);
  assert.throws(() => planAspectQuality(1000, 1000, "8k"), /Unknown/);
});

test("previews keep the aspect at a 640 long edge", () => {
  const preview = previewOf(planAspectQuality(3000, 2000, "uhd4k"));
  assert.deepEqual([preview.width, preview.height], [640, 427]);
  assert.equal(preview.experimental, true);
  const custom = planCustomQuality(256, 144, 512, 288);
  assert.equal(custom.enlargement, 2);
  assert.throws(() => planCustomQuality(100, 100, 500, 500), /fourfold/);
});
