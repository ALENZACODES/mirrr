/** Disposable verified model sessions with synthetic stand-in runtimes; no weights shipped.
 * Author: John Khan.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { candidates, syntheticFactory } from "./quality-model-fixtures-r38e.mjs";
import { loadReviewedLocalModels } from "../../../../dist/js/engines/upscale/quality-model-loader.js";

const raster = (width = 2, height = 2) => ({ width, height, data: new Uint8ClampedArray(width * height * 4).fill(200) });

test("loads in pipeline order and stages receive the verified bytes", async () => {
  const log = [];
  const reviewed = candidates({ matte: true });
  const session = await loadReviewedLocalModels(reviewed, syntheticFactory(log));
  const loads = log.filter(row => row.load);
  assert.deepEqual(loads.map(row => row.load), ["preclean", "upscale", "matte"]);
  assert.deepEqual(loads[0].copy, reviewed.preclean.bytes);
  assert.notEqual(loads[0].staged, reviewed.preclean.bytes, "a private staged copy reaches the runtime");
  assert.deepEqual(session.verifiedModels.map(model => model.role),
    ["swinir_preclean", "realesrgan_upscale", "modnet_matte"]);
  assert.ok(session.verifiedModels.every(model => !("bytes" in model) && !("reviewSha256" in model)));
  await session.dispose();
});

test("every staged copy is wiped once loading ends; the caller's bytes are kept", async () => {
  const log = [];
  const reviewed = candidates();
  const session = await loadReviewedLocalModels(reviewed, syntheticFactory(log));
  for (const row of log.filter(entry => entry.load)) assert.ok(row.staged.every(value => value === 0));
  assert.ok(reviewed.preclean.bytes.some(value => value !== 0));
  await session.dispose();
});

test("a tampered candidate is refused before any runtime loader runs", async () => {
  const log = [];
  const reviewed = candidates();
  const changed = reviewed.upscale.bytes.slice();
  changed[0] ^= 1;
  await assert.rejects(loadReviewedLocalModels({ ...reviewed, upscale: { ...reviewed.upscale, bytes: changed } },
    syntheticFactory(log)), /sha256 mismatch/);
  assert.deepEqual(log, []);
});

test("absent weights or runtime refuse rather than fall back", async () => {
  await assert.rejects(loadReviewedLocalModels({ preclean: candidates().preclean }, syntheticFactory()),
    /missing realesrgan_upscale model candidate/);
  await assert.rejects(loadReviewedLocalModels(candidates(), null), /local model runtime is not available/);
  const { loadMODNet, ...noMatte } = syntheticFactory();
  assert.equal(typeof loadMODNet, "function");
  await assert.rejects(loadReviewedLocalModels(candidates({ matte: true }), noMatte), /cannot load the matte model/);
});

test("the same weights cannot fill two stages", async () => {
  const reviewed = candidates();
  const shared = { ...reviewed, upscale: { record: { ...reviewed.upscale.record,
    weightsSha256: reviewed.preclean.record.weightsSha256, weightsBytes: reviewed.preclean.bytes.byteLength },
  bytes: reviewed.preclean.bytes } };
  await assert.rejects(loadReviewedLocalModels(shared, syntheticFactory()), /its own reviewed weights/);
});

test("a failed later load releases the stages already created", async () => {
  const log = [];
  await assert.rejects(loadReviewedLocalModels(candidates(), syntheticFactory(log, { fail: "load-upscale" })),
    /synthetic upscale load failure/);
  assert.deepEqual(log.filter(row => row.dispose).map(row => row.dispose), ["preclean"]);
});

test("cancellation before loading creates nothing", async () => {
  const log = [];
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(loadReviewedLocalModels(candidates(), syntheticFactory(log), controller.signal),
    error => error.name === "AbortError");
  assert.deepEqual(log, []);
});

test("stage outputs are checked and a disposed session refuses new work", async () => {
  const log = [];
  const session = await loadReviewedLocalModels(candidates(), syntheticFactory(log, {
    upscale: (_source, width) => new Uint8ClampedArray(width * 4),
  }));
  assert.equal((await session.preclean(raster())).length, 16);
  await assert.rejects(session.upscale(raster(), 4, 4), /invalid result; no classical substitute was used/);
  assert.equal(session.matte, null);
  await session.dispose();
  assert.equal(session.disposed, true);
  assert.deepEqual(log.filter(row => row.dispose).map(row => row.dispose), ["upscale", "preclean"]);
  await assert.rejects(session.preclean(raster()), /disposed/);
  await session.dispose();
  assert.equal(log.filter(row => row.dispose).length, 2, "a second dispose does nothing");
});
