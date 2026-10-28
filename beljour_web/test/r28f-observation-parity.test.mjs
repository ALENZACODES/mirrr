// R28F observation parity: the browser recomputes the 18 invented RGB blocks in
// parity/cover-observation-r28f.json (written by api/plumb_api/engines/concealer/observed.py).
// Codes and counts must match exactly, fractions and residuals within 1e-6. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { observeCover } from "../dist/js/commerce/observed-cover.js";

const PARITY = JSON.parse(readFileSync(new URL("../../parity/cover-observation-r28f.json", import.meta.url), "utf8"));
const image = (rows) => ({ width: PARITY.width, height: PARITY.height, channels: 3, data: Uint8Array.from(rows.flat()) });
const close = (a, b) => (a === null && b === null) || Math.abs(a - b) <= PARITY.tolerance;

test("all 18 vectors match the Python observation", () => {
  assert.equal(PARITY.vectors.length, 18);
  for (const v of PARITY.vectors) {
    const found = observeCover(image(v.before), image(v.after), v.mask, v.pigment);
    const want = v.expected;
    assert.equal(found.code, want.code, v.id);
    assert.deepEqual([found.marked_pixels, found.contrast_pixels, found.changed_pixels],
      [want.marked_pixels, want.contrast_pixels, want.changed_pixels], v.id);
    assert.ok(close(found.observed_effect_fraction === null ? null : Math.round(found.observed_effect_fraction * 1e6) / 1e6,
      want.observed_effect_fraction), `${v.id} fraction`);
    assert.ok(close(Math.round(found.max_residual * 1e6) / 1e6, want.max_residual), `${v.id} residual`);
    assert.equal(found.physical_coverage_inferred, false);
  }
});

test("the vectors cover every outcome", () => {
  const codes = new Set(PARITY.vectors.map((v) => v.expected.code));
  for (const code of [null, "leaked_pixels", "unrelated_colour_movement", "insufficient_contrast", "invalid_mask"]) {
    assert.ok(codes.has(code), String(code));
  }
});
