import assert from "node:assert/strict";
import test from "node:test";

import {
  StrengthLevels, fromLegacyAmount, legacyAmount, nudgeLevel, validateLevel,
} from "../../../dist/js/pro/index.js";

test("1.0 and 5.0 are valid, every tenth is valid", () => {
  assert.equal(validateLevel(1.0), 1.0);
  assert.equal(validateLevel(5.0), 5.0);
  for (let tenth = 10; tenth <= 50; tenth++) {
    assert.equal(validateLevel(tenth / 10), tenth / 10);
  }
});

test("off-step and out of range are rejected", () => {
  for (const value of [0.9, 5.1, 1.05, 2.4999, NaN, Infinity, -Infinity, null, "3.0"]) {
    assert.throws(() => validateLevel(value));
  }
});

test("legacy presets and slider nudges are mapped explicitly", () => {
  assert.equal(fromLegacyAmount(0), 1);
  assert.equal(fromLegacyAmount(50), 3);
  assert.equal(fromLegacyAmount(100), 5);
  assert.equal(legacyAmount(1), 0);
  assert.equal(legacyAmount(3), 0.5);
  assert.equal(legacyAmount(5), 1);
  assert.equal(nudgeLevel(5, 1), 5);
  assert.equal(nudgeLevel(1, -1), 1);
  assert.equal(nudgeLevel(4.2, 1), 4.3);
});

test("last remembered setting belongs to the correct effect", () => {
  const levels = new StrengthLevels();
  assert.equal(levels.get("identity_lock"), 5);
  levels.set("upscale_detail", 5);
  levels.set("mask_amount", 1.2);
  assert.equal(levels.change("mask_amount", 1), 1.3);
  assert.equal(levels.get("upscale_detail"), 5);
  assert.equal(levels.snapshot().reel_amount, 3);
  levels.clear();
  assert.equal(levels.get("upscale_detail"), 3);
  assert.equal(levels.get("identity_lock"), 5);
});
