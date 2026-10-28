/** Secure synthetic export: only the guarded pixel result reaches the local encoder. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { byteImage } from "../dist/js/engines/core/buffer.js";
import { SIMULATION_LABEL } from "../dist/js/engines/local/posture.js";
import { exportPostureImage } from "../dist/js/body/posture-export.js";

const ascii = (text) => new TextEncoder().encode(text);
const segment = (mark, payload) => new Uint8Array([255, mark, 0, payload.length + 2, ...payload]);
function dirtyJpeg() {
  const bits = [new Uint8Array([255, 216]), segment(225, ascii("Exif GPS synthetic")),
    segment(254, ascii("GPS fake note")), new Uint8Array([255, 218, 0, 2, 0, 7, 255, 217])];
  return new Uint8Array(bits.flatMap((bit) => [...bit]));
}
function fakeResult() {
  const image = byteImage(2, 2);
  image.data.fill(90);
  return { image, label: SIMULATION_LABEL, lockLevel: 5, identityRecovered: true, similarity: 0.8, outcome: {} };
}

test("default export burns visible simulation copy and strips JPEG GPS/EXIF", async () => {
  const seen = [];
  const encoder = { async encode(pixels, options) {
    seen.push(options);
    assert.equal(pixels.data.length, 16);
    assert.equal(pixels.data[3], 255);
    return dirtyJpeg();
  } };
  const result = await exportPostureImage(fakeResult(), "J10", {}, encoder);
  assert.equal(result.label, SIMULATION_LABEL);
  assert.equal(result.name, "Posture_J10.jpg");
  assert.equal(result.mime, "image/jpeg");
  assert.deepEqual(seen.map((options) => options.label), [SIMULATION_LABEL]);
  assert.doesNotMatch(new TextDecoder().decode(await result.blob.arrayBuffer()), /Exif|GPS/);
});

test("an explicit label toggle can omit the mark without retaining image metadata", async () => {
  const seen = [];
  const encoder = { async encode(_pixels, options) {
    seen.push(options.label);
    return dirtyJpeg();
  } };
  const result = await exportPostureImage(fakeResult(), "J16", { simulationLabel: false }, encoder);
  assert.equal(result.label, null);
  assert.deepEqual(seen, [null]);
  assert.doesNotMatch(new TextDecoder().decode(await result.blob.arrayBuffer()), /Exif|GPS/);
});

test("cannot export unlabelled, unknown or oversized posture output", async () => {
  const encoder = { async encode() { return dirtyJpeg(); } };
  const fake = fakeResult();
  await assert.rejects(() => exportPostureImage({ ...fake, label: "" }, "J10", {}, encoder), /labelled/);
  await assert.rejects(() => exportPostureImage(fake, "not-a-fix", {}, encoder), /known fix/);
  await assert.rejects(() => exportPostureImage(fake, "J10", { simulationLabel: "no" }, encoder), /switch/);
  await assert.rejects(() => exportPostureImage(fake, "J10", { quality: 9 }, encoder), /quality/);
  await assert.rejects(() => exportPostureImage(fake, "J10", { mime: "text/plain" }, encoder), /format/);
  const huge = { ...fake, image: { ...fake.image, width: 5000, height: 4000 } };
  await assert.rejects(() => exportPostureImage(huge, "J10", {}, encoder), /oversized/);
});

test("encoder returns invalid bytes: metadata scrub fails rather than exporting unknown content", async () => {
  const fake = fakeResult();
  const emptyEncoder = { async encode() { return new Uint8Array([1, 2, 3]); } };
  await assert.rejects(() => exportPostureImage(fake, "J13", {}, emptyEncoder), /JPEG|image|metadata/i);
});
