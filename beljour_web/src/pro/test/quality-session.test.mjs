/** Quality Generator session: revisions, preview reuse, stale jobs, cleanup. Author: John Khan. */

import assert from "node:assert/strict";
import test from "node:test";

import { cpuResizer } from "../../../dist/js/engines/upscale/quality-generator.js";
import { PREVIEW_EDGE, QualitySession, StaleQualityJob } from "../../../dist/js/pro/quality-session.js";

const DIGEST = "a".repeat(64), OTHER = "b".repeat(64);
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02, 0xff, 0xd9]);
const encoder = { encode: async () => JPEG };

function photo(width = 480, height = 270, value = 120) {
  return { width, height, data: new Uint8ClampedArray(width * height * 4).fill(value) };
}

function faceMask(width = 480, height = 270) {
  const mask = new Uint8Array(width * height);
  mask.fill(255, width * 100, width * 140);
  return mask;
}

function opened(resizer = cpuResizer) {
  const session = new QualitySession({ resizer });
  session.open(DIGEST, photo());
  return session;
}

test("nothing renders until the face is confirmed or no person is declared", async () => {
  const session = opened();
  await assert.rejects(session.preview(), /Confirm the face/);
  assert.throws(() => session.markFace(new Uint8Array(480 * 270)), /Mark the face/);
  session.markFace(faceMask());
  assert.equal(session.current.ready, true);
  assert.equal(session.current.levels.lockLevel, 5, "the face lock defaults to 5.0");
  const other = opened();
  other.declareNoPerson();
  assert.equal((await other.preview()).audit.noPerson, true);
});

test("previews are bounded and reuse one reference across slider levels", async () => {
  const session = opened();
  session.markFace(faceMask());
  const sizes = [];
  for (const level of [1, 2, 3, 4, 5]) {
    session.setLevels(level);
    const render = await session.preview();
    sizes.push(Math.max(render.image.width, render.image.height));
    assert.equal(render.audit.release, false);
  }
  assert.ok(sizes.every(size => size <= PREVIEW_EDGE));
  assert.equal(session.referenceBuilds, 1);
  session.setLevels(3);
  const again = await session.preview();
  assert.equal(again, await session.preview(), "cached level returns the same render");
  session.markFace(faceMask());
  await session.preview();
  assert.equal(session.referenceBuilds, 2, "a new selection prepares a new reference");
});

test("a release is the full frame and the only exportable result", async () => {
  const session = opened();
  session.markFace(faceMask());
  const preview = await session.preview();
  const release = await session.release();
  assert.deepEqual([release.image.width, release.image.height], [1920, 1080]);
  await assert.rejects(session.export(preview, "x", {}, encoder), /current release/);
  const file = await session.export(release, "BELJOUR_HD1080", {}, encoder);
  assert.equal(file.label, "Simulation");
  const later = await session.release();
  await assert.rejects(session.export(release, "x", {}, encoder), /current release/);
  assert.ok(later);
});

test("a job that finishes after the photo or selection changed is refused", async () => {
  let open;
  const slow = (source, width, height) => new Promise(resolve => {
    open = () => resolve(cpuResizer(source, width, height));
  });
  const session = new QualitySession({ resizer: slow });
  session.open(DIGEST, photo());
  session.markFace(faceMask());
  const pending = session.release();
  session.open(OTHER, photo(480, 270, 30));
  open();
  await assert.rejects(pending, StaleQualityJob);
  session.markFace(faceMask());
  const first = session.release();
  const firstOpen = open;
  const second = session.release();
  firstOpen();
  open();
  await assert.rejects(first, StaleQualityJob);
  assert.ok(await second);
});

test("open copies the photo and dispose wipes it", async () => {
  const source = photo();
  const session = new QualitySession({ resizer: cpuResizer });
  session.open(DIGEST, source);
  source.data.fill(0);
  session.markFace(faceMask());
  const render = await session.release();
  assert.ok(render.image.data.some(value => value !== 0 && value !== 255), "the session kept its own copy");
  session.dispose();
  assert.ok(render.image.data.every(value => value === 0), "rendered bytes are wiped on dispose");
  assert.throws(() => session.plan(), /Open a photo/);
});

test("invalid digests, sizes and levels are refused", () => {
  const session = new QualitySession({ resizer: cpuResizer });
  assert.throws(() => session.open("x", photo()), /digest/);
  assert.throws(() => session.open(DIGEST, photo(100, 50)), /fourfold/);
  session.open(DIGEST, photo());
  assert.throws(() => session.setLevels(0.5), /strength/);
  assert.throws(() => session.markFace(new Uint8Array(10)), /size/);
});
