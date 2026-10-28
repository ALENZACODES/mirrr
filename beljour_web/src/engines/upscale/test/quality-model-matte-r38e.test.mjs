/** Diagnostic-only hair matte comparison against a confirmed, drawn hair mask.
 * Author: John Khan.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { candidates, syntheticFactory } from "./quality-model-fixtures-r38e.mjs";
import { loadReviewedLocalModels } from "../../../../dist/js/engines/upscale/quality-model-loader.js";
import {
  BOUNDARY_RADIUS, hairBoundaryBand, hairMatteDiagnostic,
} from "../../../../dist/js/engines/upscale/quality-model-matte.js";

const W = 16, H = 12;
const photo = () => ({ width: W, height: H, data: new Uint8ClampedArray(W * H * 4).fill(180) });
/** Hair covers the top five rows. */
const hairMask = () => new Uint8Array(W * H).fill(255, 0, W * 5);
const exactAlpha = () => Float32Array.from(hairMask(), value => value / 255);

async function matteSession(alpha, log = []) {
  return loadReviewedLocalModels(candidates({ matte: true }), syntheticFactory(log, { alpha }));
}

test("the band is the rows within the radius of the hair edge", () => {
  const band = hairBoundaryBand(hairMask(), W, H);
  const rows = [...new Set([...band.keys()].filter(p => band[p]).map(p => Math.floor(p / W)))];
  assert.equal(BOUNDARY_RADIUS, 2);
  assert.deepEqual(rows, [3, 4, 5, 6]);
  assert.ok(hairBoundaryBand(new Uint8Array(W * H), W, H).every(value => value === 0));
  assert.throws(() => hairBoundaryBand(new Uint8Array(3), W, H), /size differs/);
});

test("an alpha that matches the confirmed mask measures zero error", async () => {
  const models = await matteSession(exactAlpha());
  const report = await hairMatteDiagnostic(photo(), { mask: hairMask(), confirmed: true }, models);
  assert.equal(report.status, "MEASURED");
  assert.equal(report.reason, null);
  assert.equal(report.boundaryPixels, W * 4);
  assert.equal(report.meanAbsError, 0);
  assert.equal(report.maxAbsError, 0);
  assert.equal(report.model.role, "modnet_matte");
  assert.equal(report.qualityGate, "NOT_RUN");
  assert.equal(report.changesExport, false);
  await models.dispose();
});

test("a matte that misses the edge row reports the measured error", async () => {
  const alpha = exactAlpha();
  alpha.fill(0, W * 4, W * 5);
  const models = await matteSession(alpha);
  const report = await hairMatteDiagnostic(photo(), { mask: hairMask(), confirmed: true }, models);
  assert.equal(report.status, "MEASURED");
  assert.equal(report.maxAbsError, 1);
  assert.equal(report.meanAbsError, 0.25, "one of the four band rows is wrong");
  await models.dispose();
});

test("without a matte model, confirmation or an edge the report is NOT_RUN", async () => {
  const hair = { mask: hairMask(), confirmed: true };
  assert.equal((await hairMatteDiagnostic(photo(), hair, null)).reason, "no-matte-model");
  const chainOnly = await loadReviewedLocalModels(candidates(), syntheticFactory());
  assert.equal((await hairMatteDiagnostic(photo(), hair, chainOnly)).reason, "no-matte-model");
  await chainOnly.dispose();
  const log = [];
  const models = await matteSession(exactAlpha(), log);
  const unconfirmed = await hairMatteDiagnostic(photo(), { ...hair, confirmed: false }, models);
  assert.deepEqual([unconfirmed.status, unconfirmed.reason, unconfirmed.meanAbsError],
    ["NOT_RUN", "hair-mask-not-confirmed", null]);
  const flat = await hairMatteDiagnostic(photo(), { mask: new Uint8Array(W * H), confirmed: true }, models);
  assert.equal(flat.reason, "no-hair-boundary");
  assert.deepEqual(log.filter(row => row.run), [], "the model is not run when nothing can be measured");
  await models.dispose();
  assert.equal((await hairMatteDiagnostic(photo(), hair, models)).reason, "model-session-closed");
});

test("the photo copy is wiped, the photo is untouched and bad sizes are refused", async () => {
  const handed = [];
  const models = await loadReviewedLocalModels(candidates({ matte: true }), {
    ...syntheticFactory(),
    loadMODNet: async () => ({
      engine: async source => { handed.push(source.data); return exactAlpha(); },
      dispose: () => undefined,
    }),
  });
  const image = photo();
  await hairMatteDiagnostic(image, { mask: hairMask(), confirmed: true }, models);
  assert.ok(handed[0].every(value => value === 0));
  assert.ok(image.data.every(value => value === 180));
  await assert.rejects(hairMatteDiagnostic(image, { mask: new Uint8Array(5), confirmed: true }, models),
    /size differs/);
  await models.dispose();
});
