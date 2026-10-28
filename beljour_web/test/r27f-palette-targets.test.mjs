/** Hair palette display targets in the browser: guarded output against the expected composite.
 * Drawn controlled patches only; not dye calibration. Author: John Khan.
 */
import assert from "node:assert/strict";
import test from "node:test";
import * as E from "../dist/js/engines/hair_palette/evidence.js";

test("all 90 swatches meet the 1.25 display target", () => {
  for (const level of [2, 3.5, 5]) {
    const audit = E.auditPaletteTargets(level);
    assert.deepEqual([audit.swatches, audit.meets_target], [90, 90]);
    assert.ok(audit.evidence.every((e) => e.max_delta_e <= E.DISPLAY_TOLERANCE && !e.guard_blended));
  }
});

test("bytes, alpha and source are checked; level one and refusals are not targets met", () => {
  const { image, mask } = E.controlCase();
  const before = new Uint8Array(image);
  const found = E.targetEvidence(image, 96, 96, mask, E.CONTROL_ANCHORS, "natural-05-n", 4, { allowLightening: true });
  assert.deepEqual([found.status, found.outside_unchanged, found.alpha_unchanged, found.source_unchanged],
    ["meets_target", true, true, true]);
  assert.deepEqual(image, before);
  assert.equal(E.targetEvidence(image, 96, 96, mask, E.CONTROL_ANCHORS, "natural-01-n", 1).status, "unchanged");
  assert.equal(E.targetEvidence(image, 96, 96, mask, null, "natural-01-n").code, "no_mesh");
  assert.equal(E.targetEvidence(image, 96, 96, mask, E.CONTROL_ANCHORS, "natural-10-n", 5).code, "lightening_not_automatic");
});

test("a large patch that trips the identity guard is reported, not hidden", () => {
  const image = new Uint8Array(32 * 32 * 4).fill(200), mask = new Uint8Array(32 * 32);
  for (let y = 4; y < 28; y++) for (let x = 4; x < 28; x++) { mask[y * 32 + x] = 255; image.set([20, 15, 12], (y * 32 + x) * 4); }
  const found = E.targetEvidence(image, 32, 32, mask, E.CONTROL_ANCHORS, "natural-10-n", 5, { allowLightening: true });
  assert.equal(found.guard_blended, true);
  assert.equal(found.status, "misses_target");
});
