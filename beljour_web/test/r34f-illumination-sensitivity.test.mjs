/** Illumination sensitivity in the browser: never reselects, refuses stale or unknown inputs.
 * Synthetic drawn colours only. Author: John Khan.
 */
import assert from "node:assert/strict";
import test from "node:test";
import * as S from "../dist/js/engines/shade/illumination-sensitivity.js";
import { findFromPixels, NO_WHITE } from "../dist/js/engines/shade/finder.js";
import { BASES, caseReading } from "./r34f-scene.mjs";

const BASE = BASES[10][1];

test("daylight stays stable and keeps its selection", () => {
  const [result, sample, estimates] = caseReading(BASE, "daylight");
  const decision = S.auditIlluminationSensitivity(result, sample, estimates.slice(0, 1));
  assert.deepEqual([decision.status, decision.code, decision.selected_id], ["stable", null, result.best.id]);
});

test("uncorrected warm light is sensitive but the selection never changes", () => {
  const [result, sample, estimates] = caseReading(BASE, "warm");
  const decision = S.auditIlluminationSensitivity(result, sample, estimates);
  assert.deepEqual(decision.outcomes.map((o) => o.mode), ["neutral", "grey_world", "none"]);
  assert.equal(decision.status, "sensitive");
  assert.equal(decision.selected_id, result.best.id);
  const body = S.publicSensitivity(decision);
  assert.equal(body.changes_selection, false);
  assert.doesNotMatch(JSON.stringify(body), /pixels/);
});

test("refused, unknown and stale baselines are refused", () => {
  const [result, sample, estimates] = caseReading(BASE, "daylight");
  assert.equal(S.auditIlluminationSensitivity(findFromPixels({}, NO_WHITE), sample, estimates).code, "incompatible_baseline");
  const foreign = { ...result, best: { ...result.best, id: "S05" } };
  assert.equal(S.auditIlluminationSensitivity(foreign, sample, estimates).code, "incompatible_baseline");
  const shifted = sample.map((p) => p.map((v) => Math.min(255, v + 6)));
  assert.equal(S.auditIlluminationSensitivity(result, shifted, estimates).code, "stale_sample");
});

test("invalid estimates and lists throw", () => {
  for (const [mode, gains] of [["daylight", [1, 1, 1]], ["neutral", [1, 1]], ["neutral", [1, Number.NaN, 1]],
    ["neutral", [0.4, 1, 1]], ["neutral", [1, 2.1, 1]], ["none", [1.1, 1, 1]]]) {
    assert.throws(() => S.lightingEstimate(mode, gains), RangeError);
  }
  const [result, sample, estimates] = caseReading(BASE, "daylight");
  for (const bad of [[], [...estimates, estimates[0]], [estimates[0], estimates[0]]]) {
    assert.throws(() => S.auditIlluminationSensitivity(result, sample, bad), RangeError);
  }
  assert.throws(() => S.measureSample([], [1, 1, 1]), RangeError);
});
