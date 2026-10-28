/** Shade review classification in the browser, on W6 results from flat zone pixels.
 * Synthetic zone pixels only. Author: John Khan.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { CATEGORIES, classifyPaths, reviewDiagnoses } from "../dist/js/engines/shade/review.js";
import { findFromPixels, NO_WHITE, ZONES } from "../dist/js/engines/shade/finder.js";

const NEUTRAL = { gains: [1, 1, 1], mode: "neutral", clamped: false };
function flat(rgb) {
  const zones = {};
  for (const z of ZONES) zones[z] = Array.from({ length: 300 }, () => rgb);
  return findFromPixels(zones, NEUTRAL);
}

test("categories follow the documented precedence", () => {
  const named = flat([190, 150, 125]), refused = findFromPixels({}, NO_WHITE);
  assert.equal(classifyPaths(named, named, null, false).category, "missing_geometry");
  assert.equal(classifyPaths(named, named, "mixed_lighting", true).category, "inconsistent_light");
  assert.equal(classifyPaths(named, named, null, true).category, "agree");
  assert.equal(classifyPaths(refused, refused, null, true).category, "agree");
  const other = { ...named, best: { ...named.best, id: "LG-02C" } };
  assert.equal(classifyPaths(named, other, null, true).category, "measurement_mismatch");
});

test("a coverage gap needs both paths without a shade", () => {
  const deep = flat([22, 14, 10]);
  assert.equal(deep.refused, true);
  const gap = classifyPaths(deep, deep, null, true);
  assert.deepEqual([gap.category, gap.coverage], ["coverage_gap", "no_reference_deep_enough"]);
  assert.equal(classifyPaths(flat([190, 150, 125]), deep, null, true).category, "measurement_mismatch");
});

test("the review counts everything and quotes, not re-measures, the real-face figure", () => {
  const named = flat([190, 150, 125]);
  const body = reviewDiagnoses([classifyPaths(named, named, null, true), classifyPaths(null, null, null, false)]);
  assert.equal(body.total, 2);
  assert.deepEqual(Object.keys(body.categories), [...CATEGORIES]);
  assert.deepEqual([body.last_reported_real_face, body.new_real_face_score, body.thresholds_changed], ["65/983", null, false]);
  assert.throws(() => reviewDiagnoses([]), RangeError);
});
