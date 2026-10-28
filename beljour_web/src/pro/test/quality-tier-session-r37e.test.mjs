/** Aspect-preserving tier session: tiers, previews, cancellation, budgets.
 * Author: John Khan.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { cpuResize, cpuResizer } from "../../../dist/js/engines/upscale/quality-generator.js";
import { QualityTierSession, StaleQualityJob } from "../../../dist/js/pro/quality-session.js";

const DIGEST = "a".repeat(64);
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02, 0xff, 0xd9]);
const photo = (width = 960, height = 540) => ({ width, height,
  data: new Uint8ClampedArray(width * height * 4).map((_, i) => (i % 4 === 3 ? 255 : (i * 13) % 256)) });

function session(extra = {}) {
  let now = 0;
  const value = new QualityTierSession({ resizer: cpuResizer, clock: () => (now += 5), ...extra });
  value.open(DIGEST, photo());
  return value;
}

test("tiers keep the aspect and 4K is experimental", async () => {
  const current = session();
  assert.deepEqual([current.plan().width, current.plan().height], [1920, 1080]);
  const fourK = current.setTier("uhd4k");
  assert.deepEqual([fourK.width, fourK.height, fourK.experimental], [3840, 2160, true]);
  current.declareNoPerson();
  const preview = await current.preview();
  assert.deepEqual([preview.image.width, preview.image.height], [640, 360]);
  assert.equal(preview.audit.experimental, true);
  const small = new QualityTierSession({ resizer: cpuResizer });
  small.open(DIGEST, photo(600, 400));
  assert.throws(() => small.setTier("uhd4k"), /fourfold/);
  assert.equal(small.state.tier, "hd1080", "a refused tier is not silently swapped");
});

test("previews are cached per level set, up to five", async () => {
  const current = session();
  const mask = new Uint8Array(960 * 540).fill(255, 960 * 200, 960 * 260);
  current.markFace(mask);
  const first = await current.preview();
  assert.equal(await current.preview(), first);
  for (const detailLevel of [1, 2, 3.5, 4, 5]) {
    current.setLevels({ detailLevel });
    await current.preview();
  }
  assert.ok(first.image.data.every(value => value === 0), "the oldest cached preview was evicted and wiped");
  assert.equal(current.state.levels.lockLevel, 5);
});

test("a newer release supersedes a slower earlier one", async () => {
  const pending = [];
  const resizer = (source, width, height) => width === 1920
    ? new Promise(done => pending.push(() => done(cpuResize(source, width, height))))
    : cpuResizer(source, width, height);
  const current = session({ resizer });
  current.declareNoPerson();
  const first = current.release();
  const second = current.release();
  const outcomes = Promise.allSettled([first, second]);
  for (let round = 0; round < 50; round++) {
    await new Promise(resolve => setTimeout(resolve, 0));
    pending.shift()?.();
  }
  const [a, b] = await outcomes;
  assert.equal(a.status, "rejected");
  assert.ok(a.reason instanceof StaleQualityJob || a.reason.name === "AbortError");
  assert.equal(b.status, "fulfilled");
  assert.equal(b.value.image.width, 1920);
});

test("export is only for the current release and records local timings", async () => {
  const current = session();
  current.declareNoPerson();
  await current.preview();
  const result = await current.release();
  const file = await current.export(result, {}, { encode: async () => JPEG });
  assert.equal(file.tier, "hd1080");
  assert.equal(file.label, "Simulation");
  const budget = current.budget();
  assert.equal(budget.preview, "WITHIN_BUDGET");
  assert.equal(budget.export, "NOT_12MP");
  assert.equal(budget.quality, "UNVERIFIED");
  current.declareNoPerson();
  await assert.rejects(current.export(result, {}, { encode: async () => JPEG }), /current release/);
});

test("closing wipes the photo and refuses further work", async () => {
  const current = session();
  current.declareNoPerson();
  const preview = await current.preview();
  current.close();
  assert.ok(preview.image.data.every(value => value === 0));
  assert.throws(() => current.plan(), /Open a photo/);
  await assert.rejects(current.preview(), /Open a photo/);
});
