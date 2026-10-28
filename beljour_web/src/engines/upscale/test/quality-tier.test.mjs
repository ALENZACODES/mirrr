/** Quality Generator tiers: fixed 1080 frames, contained fit, refusals. Author: John Khan. */

import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_WORKING_LIMIT, MAX_ENLARGEMENT, TIER_FRAMES, TierRefused, admitWorkingMemory, planFixedTier, scaledPlan,
} from "../../../../dist/js/engines/upscale/quality-tier.js";

test("landscape and portrait sources map to the matching 1080 frame", () => {
  const landscape = planFixedTier(1600, 900);
  assert.deepEqual([landscape.width, landscape.height, landscape.orientation], [1920, 1080, "landscape"]);
  assert.deepEqual([landscape.contentWidth, landscape.contentHeight, landscape.padded], [1920, 1080, false]);
  const portrait = planFixedTier(900, 1600);
  assert.deepEqual([portrait.width, portrait.height, portrait.orientation], [1080, 1920, "portrait"]);
});

test("other aspects are contained, centred and padded, never cropped", () => {
  const square = planFixedTier(1000, 1000);
  assert.deepEqual([square.contentWidth, square.contentHeight], [1080, 1080]);
  assert.equal(square.offsetX, 420);
  assert.equal(square.offsetY, 0);
  assert.equal(square.padded, true);
  const wide = planFixedTier(3000, 1000);
  assert.deepEqual([wide.contentWidth, wide.contentHeight, wide.offsetY], [1920, 640, 220]);
  assert.ok(wide.enlargement < 1);
});

test("more than fourfold enlargement is refused", () => {
  assert.equal(MAX_ENLARGEMENT, 4);
  assert.equal(planFixedTier(480, 270).enlargement, 4);
  assert.throws(() => planFixedTier(479, 269), error => error instanceof TierRefused && error.code === "enlargement");
});

test("a 12 MP source is admitted and oversized sources are refused", () => {
  assert.ok(planFixedTier(4000, 3000).workingBytes <= DEFAULT_WORKING_LIMIT);
  assert.throws(() => planFixedTier(6000, 4100), /24 megapixels/);
  assert.throws(() => planFixedTier(10, 400), /size/);
  assert.throws(() => admitWorkingMemory(DEFAULT_WORKING_LIMIT + 1), /working memory/);
  assert.throws(() => admitWorkingMemory(10, 600 * 1024 * 1024), /limit/);
});

test("4K geometry exists but rendering it is blocked", () => {
  assert.deepEqual(TIER_FRAMES.uhd4k.landscape, { width: 3840, height: 2160 });
  assert.deepEqual(TIER_FRAMES.uhd4k.portrait, { width: 2160, height: 3840 });
  assert.throws(() => planFixedTier(3000, 2000, "uhd4k"), error => error.code === "tier_blocked");
  assert.throws(() => planFixedTier(3000, 2000, "sd"), /Unknown/);
});

test("preview plans keep the layout at a smaller size", () => {
  const plan = planFixedTier(1000, 1000);
  const preview = scaledPlan(plan, 640);
  assert.deepEqual([preview.width, preview.height], [640, 360]);
  assert.deepEqual([preview.contentWidth, preview.contentHeight, preview.offsetX], [360, 360, 140]);
  assert.equal(scaledPlan(plan, 4000), plan);
});
