/** SKN-03 repeat-capture accounting and the skin-reference inventory audit in the browser.
 * Hypothetical counts; the 939/1000 fixture is test arithmetic, not the real denominator.
 * Author: John Khan.
 */
import assert from "node:assert/strict";
import test from "node:test";
import * as R from "../dist/js/engines/shade/readiness.js";
import { findFromPixels, NO_WHITE, ZONES } from "../dist/js/engines/shade/finder.js";

const STEADY = [[4, "warm"], [4, "warm"], [4, "warm"]];
function cases(stable, unstable, refused = 0, group = "unknown") {
  const tag = group.slice(0, 2);
  return [
    ...Array.from({ length: stable }, (_, i) => R.skinCheckCase(`${tag}-s${i}`, STEADY, group)),
    ...Array.from({ length: unstable }, (_, i) => R.skinCheckCase(`${tag}-u${i}`, [[4, "warm"], [4, "neutral"]], group)),
    ...Array.from({ length: refused }, (_, i) => R.skinCheckCase(`${tag}-r${i}`, [[4, "warm"], null], group)),
  ];
}
function flatReading(rgb) {
  const zones = {};
  for (const name of ZONES) zones[name] = Array.from({ length: 300 }, () => rgb);
  return findFromPixels(zones, { gains: [1, 1, 1], mode: "neutral", clamped: false });
}

test("reproduced 939 of 1000 is below target", () => {
  const report = R.measureSKN03(cases(939, 0, 61));
  assert.deepEqual([report.total, report.stable, report.unmeasured], [1000, 939, 61]);
  assert.deepEqual([report.minimum_stable, report.additional_required], [950, 11]);
  assert.equal(report.status, "BELOW_TARGET");
  assert.equal(report.release_pass, false);
  assert.equal(report.rate, 0.939);
  assert.equal(R.SKN03_TARGET, 0.95);
});

test("exactly 95 percent stays unproven without independent evidence", () => {
  const rows = cases(950, 50);
  assert.equal(R.measureSKN03(rows).status, "UNPROVEN");
  assert.equal(R.measureSKN03(rows, { independentLabels: true, compatibleBaseline: true }).status, "UNPROVEN");
  const full = { independentLabels: true, compatibleBaseline: true, humanReview: true };
  assert.equal(R.measureSKN03(rows, full).status, "BOX_REVIEW_REQUIRED");
  assert.equal(R.measureSKN03(cases(949, 51), full).status, "BELOW_TARGET");
});

test("the target is the exact integer ceiling", () => {
  for (const [total, minimum] of [[1, 1], [19, 19], [20, 19], [21, 20], [33, 32], [983, 934]]) {
    assert.equal(R.measureSKN03(cases(total, 0)).minimum_stable, minimum);
  }
});

test("refused repeats stay in the denominator and groups come from the caller", () => {
  const report = R.measureSKN03([...cases(3, 1, 0, "band 1-2"), ...cases(5, 0, 1)]);
  assert.deepEqual(report.groups, { "band 1-2": { total: 4, stable: 3 }, unknown: { total: 6, stable: 5 } });
  assert.equal(report.unmeasured, 1);
  assert.equal(R.caseFromShade("deep-1", [flatReading([70, 48, 38]), flatReading([70, 48, 38])]).group, "unknown");
});

test("cases from W6 results; a refusal is not measured", () => {
  const result = flatReading([190, 150, 125]);
  assert.equal(result.refused, false);
  const steady = R.caseFromShade("cell-7", [result, result, result], { group: "drawn" });
  assert.ok(steady.stable && steady.measured);
  assert.deepEqual([...steady.readings[0]], [result.depth_band, result.undertone.undertone]);
  const refused = findFromPixels({}, NO_WHITE);
  const mixed = R.caseFromShade("cell-8", [result, refused]);
  assert.equal(mixed.measured, false);
  assert.equal(mixed.readings[1], null);
  assert.equal(R.skinCheckCase("b", [[4, "warm"], [4, "olive"]]).stable, false);
});

test("case and report validation", () => {
  const bad = [["x", [[4, "warm"]]], ["x", Array(51).fill([4, "warm"])], ["", STEADY], ["has space", STEADY],
    ["x", [[0, "warm"], [4, "warm"]]], ["x", [[4, "pink"], [4, "warm"]]], ["x", [[4.5, "warm"], [4, "warm"]]],
    ["x", STEADY, ""], ["x", STEADY, "x".repeat(33)]];
  for (const args of bad) assert.throws(() => R.skinCheckCase(...args), RangeError);
  for (const rows of [[], cases(1, 0).concat(cases(1, 0))]) assert.throws(() => R.measureSKN03(rows), RangeError);
  assert.throws(() => R.measureSKN03(cases(1, 0), { humanReview: 1 }), RangeError);
  // Supplied stable flags are recomputed, never trusted.
  const forged = { ...R.skinCheckCase("f", [[4, "warm"], null]), stable: true };
  assert.equal(R.measureSKN03([forged]).stable, 0);
});

test("reference inventory coverage", () => {
  const full = R.checkReferenceCoverage();
  assert.equal(full.total, 96);
  assert.deepEqual(full.missing, []);
  assert.equal(full.cells.length, 40);
  assert.equal(full.cells.reduce((s, c) => s + c.count, 0), 96);
  assert.ok(full.min_separation > 1);
  assert.deepEqual(full.close_pairs, []);
  assert.equal(full.cross_undertone_neighbours, 0);
  assert.equal(R.checkReferenceCoverage("base").total, 80);
  assert.throws(() => R.checkReferenceCoverage("hair"), RangeError);
});
