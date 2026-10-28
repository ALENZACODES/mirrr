/** Two-to-six-reading fibre colour stability in the browser; coded refusals, no guessing.
 * Synthetic drawn patches and Lab values only. Author: John Khan.
 */
import assert from "node:assert/strict";
import test from "node:test";
import * as C from "../dist/js/commerce/colour-stability.js";
import { fibreReading, planFibreColour, readFibreColour } from "../dist/js/commerce/shade-support.js";
import { COOL, DAY, WARM, drawnHair } from "./r30f-scene.mjs";

const corrected = (cast) => {
  const { image, hair, card } = drawnHair(cast);
  return readFibreColour(image, hair, { neutralMask: card });
};
const lab = (values, mode = "neutral") => fibreReading(values, mode);

test("the limit is the committed W6 zone bound", () => {
  assert.equal(C.mixedLightLimit(), 10);
});

test("three corrected lights agree on one swatch", () => {
  const result = C.assessColourStability([corrected(DAY), corrected(WARM), corrected(COOL)]);
  assert.equal(result.stable, true);
  assert.equal(result.code, null);
  assert.deepEqual(new Set(result.picks), new Set([result.plan.matches[0].record.id]));
  assert.ok(result.spread_delta_e < 2);
});

test("uncorrected, mixed and disagreeing readings refuse with codes", () => {
  const { image, hair } = drawnHair(WARM);
  const uncorrected = C.assessColourStability([corrected(DAY), readFibreColour(image, hair)]);
  assert.deepEqual([uncorrected.code, uncorrected.plan, uncorrected.picks.length], ["uncorrected_lighting", null, 0]);
  const mixed = C.assessColourStability([lab([30, 8, 12]), lab([45, 8, 12])]);
  assert.equal(mixed.code, "mixed_lighting");
  assert.ok(mixed.spread_delta_e > 10);
  const unstable = C.assessColourStability([lab([30, 8, 12]), lab([33, 9, 14], "grey_world")]);
  assert.equal(unstable.code, "unstable_swatch");
  assert.equal(new Set(unstable.picks).size, 2);
  const far = C.assessColourStability([lab([50, -60, 60]), lab([50, -59, 60])]);
  assert.equal(far.code, "too_far");
  assert.equal(far.plan.refused, true);
});

test("the consensus is the median and keeps the no-lightening rule", () => {
  const readings = [lab([25.4, 7.23, 3.96]), lab([25.5, 7.2, 4])];
  const held = C.assessColourStability(readings);
  const approved = C.assessColourStability(readings, { approveLighter: true });
  held.plan.reading.lab.forEach((v, i) => assert.ok(Math.abs(v - [25.45, 7.215, 3.98][i]) < 1e-12));
  assert.equal(approved.plan.matches[0].record.id, held.plan.lighter_option.record.id);
  assert.equal(planFibreColour(held.plan.reading).matches[0].record.id, held.plan.matches[0].record.id);
});

test("count and type checks", () => {
  const one = lab([30, 8, 12]);
  for (const bad of [[one], Array(7).fill(one), "ab"]) assert.throws(() => C.assessColourStability(bad), RangeError);
  assert.throws(() => C.assessColourStability([one, { lab: [30, 8, 12], white_mode: "x" }]), RangeError);
  assert.equal(C.assessColourStability(Array(C.MAX_READINGS).fill(one)).stable, true);
});
