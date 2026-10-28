/** Tier session with and without a verified local model session. Synthetic engines only.
 * Author: John Khan.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { candidates, syntheticFactory } from "../../engines/upscale/test/quality-model-fixtures-r38e.mjs";
import { cpuResizer } from "../../../dist/js/engines/upscale/quality-generator.js";
import { loadReviewedLocalModels } from "../../../dist/js/engines/upscale/quality-model-loader.js";
import { QualityTierSession } from "../../../dist/js/pro/quality-session.js";

const DIGEST = "b".repeat(64);
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02, 0xff, 0xd9]);
const encoder = { encode: async () => JPEG };
const photo = (width = 480, height = 270) => ({ width, height,
  data: new Uint8ClampedArray(width * height * 4).map((_, i) => (i % 4 === 3 ? 255 : (i * 11) % 256)) });

function open(models) {
  const session = new QualityTierSession({ resizer: cpuResizer, models });
  session.open(DIGEST, photo());
  return session;
}

test("without a model session the classical engine runs and is labelled as such", async () => {
  const session = open(undefined);
  assert.equal(session.engine.engine, "classical-local");
  session.declareNoPerson();
  const preview = await session.preview();
  assert.equal(preview.audit.generator, "classical-local");
  const report = await session.diagnostics();
  assert.equal(report.processing, "classical-local");
  assert.deepEqual(report.models, []);
  const hair = await session.hairDiagnostic({ mask: new Uint8Array(480 * 270), confirmed: true });
  assert.equal(hair.status, "NOT_RUN");
  assert.equal(hair.reason, "no-matte-model");
  session.close();
});

test("with verified models previews, releases and exports go through the model chain", async () => {
  const log = [];
  const models = await loadReviewedLocalModels(candidates({ matte: true }), syntheticFactory(log));
  const session = open(models);
  assert.equal(session.engine.engine, "local-model-chain");
  assert.deepEqual(session.engine.models.map(model => model.role), ["swinir_preclean", "realesrgan_upscale"]);
  session.declareNoPerson();
  const preview = await session.preview();
  assert.equal(preview.audit.generator, "local-model-chain");
  assert.deepEqual([preview.image.width, preview.image.height], [640, 360]);
  const release = await session.release();
  assert.deepEqual([release.image.width, release.image.height], [1920, 1080]);
  const file = await session.export(release, {}, encoder);
  assert.equal(file.label, "Simulation");
  assert.equal(file.tier, "hd1080");
  assert.ok(log.some(row => row.run === "upscale"));
  session.close();
  await models.dispose();
});

test("a model failure refuses the release instead of falling back", async () => {
  const models = await loadReviewedLocalModels(candidates(), syntheticFactory([], { fail: "preclean" }));
  const session = open(models);
  session.declareNoPerson();
  await assert.rejects(session.release(), /pre-clean model failed; no classical substitute was used/);
  await assert.rejects(session.export({ image: photo(), audit: {} }, {}, encoder), /current release/);
  session.close();
  await models.dispose();
});

test("a disposed model session refuses new renders", async () => {
  const models = await loadReviewedLocalModels(candidates(), syntheticFactory());
  const session = open(models);
  session.declareNoPerson();
  await models.dispose();
  await assert.rejects(session.preview(), /disposed/);
  assert.throws(() => session.engine, /disposed/);
  session.close();
});

test("the hair matte diagnostic is measured but leaves the release unchanged", async () => {
  const width = 480, height = 270;
  const mask = new Uint8Array(width * height).fill(255, 0, width * 60);
  const alpha = Float32Array.from(mask, value => value / 255);
  const models = await loadReviewedLocalModels(candidates({ matte: true }), syntheticFactory([], { alpha }));
  const session = open(models);
  session.declareNoPerson();
  const release = await session.release();
  const before = release.image.data.slice();
  const report = await session.hairDiagnostic({ mask, confirmed: true });
  assert.equal(report.status, "MEASURED");
  assert.equal(report.meanAbsError, 0);
  assert.equal(report.changesExport, false);
  assert.deepEqual(release.image.data, before);
  const file = await session.export(release, {}, encoder);
  assert.equal(file.tier, "hd1080");
  session.close();
  await models.dispose();
});

test("paired diagnostics under the model chain name the models measured", async () => {
  const models = await loadReviewedLocalModels(candidates(), syntheticFactory());
  const session = open(models);
  const report = await session.diagnostics();
  assert.equal(report.processing, "local-model-chain");
  assert.equal(report.models.length, 2);
  assert.equal(report.releaseGate, "NOT_RUN");
  session.close();
  await models.dispose();
});
