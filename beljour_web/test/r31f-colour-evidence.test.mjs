// R31F final-pixel colour evidence in the browser, on drawn pixels only.
// Mirrors api/tests/test_r31f_final_colour.py. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { requireShade } from "../dist/js/engines/hair_palette/index.js";
import { auditFinalColour, publicFinalColour } from "../dist/js/commerce/colour-evidence.js";
import { TintedFibreWorkflow, planTint } from "../dist/js/commerce/colour-workflow.js";
import { HEAD, allowedOf, readings, scene } from "./helpers/r31f-fibre-scene.mjs";

if (!globalThis.crypto?.subtle) Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
const swatch = requireShade("natural-04-n");

function tinted(base, allowed, share = 0.6) {
  const data = new Uint8Array(base.image.data);
  allowed.forEach((on, i) => {
    if (!on) return;
    for (let c = 0; c < 3; c++) {
      const k = i * base.image.channels + c;
      data[k] = Math.round(base.image.data[k] * (1 - share) + swatch.rgb[c] * share);
    }
  });
  return { ...base.image, data };
}

test("a closer render is measured against the chosen swatch", () => {
  const base = scene(), allowed = allowedOf(base);
  const found = auditFinalColour(base.image, tinted(base, allowed), allowed, swatch.lab);
  assert.equal(found.status, "rendered_closer");
  assert.deepEqual([found.region_pixels, found.changed_pixels, found.outside_changed], [820, 820, 0]);
  assert.ok(found.after_delta_e < found.before_delta_e && found.shift_delta_e < 0);
});

test("untouched output is unchanged, outside and alpha changes refuse", () => {
  const base = scene(), allowed = allowedOf(base);
  assert.equal(auditFinalColour(base.image, base.image, allowed, swatch.lab).status, "unchanged");
  const outside = tinted(base, allowed);
  outside.data[0] = 0;
  const refused = auditFinalColour(base.image, outside, allowed, swatch.lab);
  assert.deepEqual([refused.status, refused.code, refused.outside_changed], ["refused", "protected_region_changed", 1]);
  const rgba = scene(true);
  const changed = new Uint8Array(rgba.image.data);
  changed[(50 * 96 + 50) * 4 + 3] = 0;
  changed[(50 * 96 + 50) * 4] = 90;
  assert.equal(auditFinalColour(rgba.image, { ...rgba.image, data: changed }, allowed, swatch.lab).code, "alpha_changed");
  assert.equal(auditFinalColour(base.image, base.image, new Uint8Array(96 * 96), swatch.lab).code, "empty_region");
  assert.throws(() => auditFinalColour(base.image, { ...base.image, width: 10 }, allowed, swatch.lab), RangeError);
  assert.throws(() => auditFinalColour(base.image, base.image, allowed, [120, 0, 0]), RangeError);
});

test("an adverse shift from the real renderer is recorded, not hidden", async () => {
  const away = { guard: (before, after) => ({ data: new Uint8Array(after.length).fill(250), similarity: 0.5, blended: true }) };
  const { image, region, scalp } = scene();
  const receipt = await new TintedFibreWorkflow().render(planTint(readings()), image, region, scalp,
    { landmarks: HEAD, level: 4, guard: away });
  assert.equal(receipt.status, "adverse_shift");
  assert.ok(receipt.evidence.shift_delta_e > 0);
});

test("public evidence keys match the Python summary", () => {
  const base = scene(), allowed = allowedOf(base);
  const out = publicFinalColour(auditFinalColour(base.image, tinted(base, allowed), allowed, swatch.lab));
  assert.deepEqual(Object.keys(out).sort(), ["after_delta_e", "before_delta_e", "changed_pixels", "code", "format",
    "label", "outside_changed", "region_pixels", "shift_delta_e", "status", "tested_against_real_products"]);
});
