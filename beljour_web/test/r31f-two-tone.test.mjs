// R31F two-swatch digital pigment plan in the browser. Mirrors api/tests/test_r31f_two_tone.py.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { requireShade } from "../dist/js/engines/hair_palette/index.js";
import { srgbToLab } from "../dist/js/engines/shade/colourspace.js";
import { CoverSession } from "../dist/js/engines/local/fibre.js";
import { fibreReading } from "../dist/js/commerce/shade-support.js";
import { STEPS, mixRgb, planTwoTone, renderTwoTone } from "../dist/js/commerce/two-tone.js";
import { HEAD, scene } from "./helpers/r31f-fibre-scene.mjs";

const FIRST = "natural-04-n", SECOND = "copper-08-w";
function mixReading(percent, offset = 0) {
  const lab = srgbToLab(mixRgb(requireShade(FIRST).rgb, requireShade(SECOND).rgb, percent));
  return fibreReading([lab[0] + offset, lab[1], lab[2]], "neutral");
}

test("mix steps and rounding", () => {
  assert.deepEqual(STEPS, Array.from({ length: 21 }, (_, k) => 5 * k));
  assert.deepEqual(mixRgb([0, 100, 255], [255, 0, 0], 50), [128, 50, 128]);
  assert.deepEqual(mixRgb([10, 20, 30], [200, 100, 0], 100), [200, 100, 0]);
  assert.throws(() => mixRgb([0, 0, 0], [1, 1, 1], 7.5), RangeError);
});

test("the matching mix is found", () => {
  for (const percent of [0, 35, 60]) {
    const plan = planTwoTone(mixReading(percent), FIRST, SECOND, { approveLighter: true });
    assert.equal(plan.best.percent, percent);
    assert.ok(plan.best.delta_e < 1e-9);
    assert.equal(plan.options_considered, 21);
  }
});

test("lighter mixes need an explicit opt-in", () => {
  const reading = mixReading(60, -3);
  const guarded = planTwoTone(reading, FIRST, SECOND);
  const opened = planTwoTone(reading, FIRST, SECOND, { approveLighter: true });
  assert.equal(guarded.reading_level, 6);
  assert.deepEqual([guarded.best.percent, guarded.best.level], [50, 6]);
  assert.deepEqual([opened.best.percent, opened.best.level], [55, 7]);
  const deep = mixReading(0, -14);
  assert.equal(planTwoTone(deep, SECOND, "copper-08-n").code, "too_light");
  assert.equal(planTwoTone(deep, SECOND, "copper-08-n", { approveLighter: true }).code, "too_far");
});

test("coded refusals", () => {
  assert.equal(planTwoTone(mixReading(20), FIRST, FIRST).code, "same_swatch");
  assert.equal(planTwoTone(fibreReading(mixReading(20).lab, "none"), FIRST, SECOND).code, "uncorrected_lighting");
  assert.equal(planTwoTone(fibreReading([60, -40, -40], "neutral"), FIRST, SECOND, { approveLighter: true }).code, "too_far");
  assert.throws(() => planTwoTone(mixReading(20), FIRST, "not-a-swatch"));
});

test("the chosen mix is drawn by the guarded fibre renderer", () => {
  const plan = planTwoTone(mixReading(35), FIRST, SECOND, { approveLighter: true });
  const { image, region, scalp } = scene();
  const result = renderTwoTone(new CoverSession(), image, region, scalp, plan,
    { photoHash: "a".repeat(64), zone: "crown", level: 4, landmarks: HEAD });
  assert.equal(result.rendered, true);
  assert.deepEqual([...result.hairRgb], [...plan.best.rgb]);
  assert.equal(result.providerCalls, 0);
  assert.throws(() => renderTwoTone(new CoverSession(), image, region, scalp, planTwoTone(mixReading(35), FIRST, FIRST),
    { photoHash: "a".repeat(64), zone: "crown", level: 4, landmarks: HEAD }), RangeError);
});
