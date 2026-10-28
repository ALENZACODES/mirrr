// R28F observed fibre effect in the browser, on the drawn hair block.
// Mirrors api/tests/test_r28f_cover_observation.py with the same literal values. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CoverSession } from "../dist/js/engines/local/fibre.js";
import { observeCover, observeCoverResult, plannedEffectFraction } from "../dist/js/commerce/observed-cover.js";
import { HEAD, allowedOf, scene } from "./helpers/r31f-fibre-scene.mjs";

const PIGMENT = [63, 44, 38];
const HASH = "b".repeat(64);

function toward(base, share) {
  const marked = allowedOf(base);
  const data = new Uint8Array(base.image.data);
  marked.forEach((on, i) => {
    if (on) for (let c = 0; c < 3; c++) data[i * 3 + c] = Math.floor(base.image.data[i * 3 + c] * (1 - share) + PIGMENT[c] * share + 0.5);
  });
  return { ...base.image, data };
}

test("the observed fraction follows the shown pixels", () => {
  const base = scene();
  for (const share of [0.2, 0.5, 0.8, 1]) {
    const found = observeCover(base.image, toward(base, share), allowedOf(base), PIGMENT);
    assert.equal(found.code, null);
    assert.ok(Math.abs(found.observed_effect_fraction - share) <= 0.01, String(share));
    assert.deepEqual([found.marked_pixels, found.contrast_pixels, found.changed_pixels], [820, 820, 820]);
  }
});

test("a restoring guard gives zero, not the plan", () => {
  const base = scene();
  const restore = { guard: (before) => ({ data: new Uint8Array(before), similarity: 1, blended: true }) };
  const result = new CoverSession().render(base.image, base.region, base.scalp,
    { photoHash: HASH, zone: "crown", level: 4, landmarks: HEAD, guard: restore });
  const evidence = observeCoverResult(base.image, result, allowedOf(base));
  assert.ok(evidence.planned_effect_fraction > 0.5);
  assert.equal(evidence.observation.observed_effect_fraction, 0);
  assert.equal(evidence.observation.changed_pixels, 0);
});

test("planned and observed from the default guard match Python", () => {
  const base = scene();
  const result = new CoverSession().render(base.image, base.region, base.scalp,
    { photoHash: HASH, zone: "crown", level: 3, landmarks: HEAD, paletteRgb: PIGMENT });
  const evidence = observeCoverResult(base.image, result, allowedOf(base));
  assert.ok(Math.abs(evidence.planned_effect_fraction - plannedEffectFraction(result)) < 1e-6);
  assert.ok(Math.abs(evidence.observation.observed_effect_fraction - 0.365588) < 1e-6);
});

test("leaks, alpha, sideways movement, low contrast and bad masks refuse", () => {
  const base = scene(), marked = allowedOf(base);
  const leaked = toward(base, 0.5);
  leaked.data[0] = 0;
  assert.equal(observeCover(base.image, leaked, marked, PIGMENT).code, "leaked_pixels");
  const sideways = new Uint8Array(base.image.data);
  marked.forEach((on, i) => { if (on) sideways[i * 3 + 1] = 250; });
  assert.equal(observeCover(base.image, { ...base.image, data: sideways }, marked, PIGMENT).code, "unrelated_colour_movement");
  const rgba = scene(true);
  const changed = new Uint8Array(rgba.image.data);
  changed[(40 * 96 + 40) * 4 + 3] = 0;
  assert.equal(observeCover(rgba.image, { ...rgba.image, data: changed }, marked, PIGMENT).code, "alpha_changed");
  assert.equal(observeCover(base.image, base.image, marked, [196, 150, 128]).code, "insufficient_contrast");
  assert.equal(observeCover(base.image, base.image, new Uint8Array(96 * 96), PIGMENT).code, "invalid_mask");
  assert.throws(() => observeCover(base.image, base.image, marked, [300, 0, 0]), RangeError);
});
