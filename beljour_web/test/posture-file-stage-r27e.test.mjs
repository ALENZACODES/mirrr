/** R27E local file import (bounded, hashed, cancellable) and the display stage. Author: John Khan. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";

import { MAX_POSTURE_FILE_BYTES, PostureFileRefused, importPostureFile, sha256Hex } from "../dist/js/body/posture-file.js";
import { DISPLAY_MAX_EDGE, PostureStage, displayCopy, displaySize, splitComposite } from "../dist/js/body/posture-stage.js";
import { byteImage } from "../dist/js/engines/core/buffer.js";
import { drawnDecoder, drawnPhoto, photoBlob } from "./posture-fixtures-r27e.mjs";
import { withFakeDocument } from "./posture-dom-fake.mjs";

const refused = (code) => (error) => error instanceof PostureFileRefused && error.code === code;

test("import hashes the exact file bytes and returns owned RGBA pixels", async () => {
  const photo = drawnPhoto("front");
  const blob = photoBlob("synthetic-bytes-123");
  const decoder = drawnDecoder(photo);
  const imported = await importPostureFile(blob, { decoder });
  assert.equal(imported.digest, createHash("sha256").update("synthetic-bytes-123").digest("hex"));
  assert.equal(imported.image.channels, 4);
  assert.equal(imported.image.width, photo.width);
  assert.deepEqual(decoder.calls, [{ bytes: 19, type: "image/png" }]);
  assert.equal(await sha256Hex(new Uint8Array()), createHash("sha256").digest("hex"));
});

test("type, size, decode and pixel bounds fail closed with stable codes", async () => {
  const photo = drawnPhoto("front");
  const decoder = drawnDecoder(photo);
  await assert.rejects(importPostureFile(photoBlob("x", "image/gif"), { decoder }), refused("unsupported_file_type"));
  await assert.rejects(importPostureFile(photoBlob("", "image/png"), { decoder }), refused("empty_file"));
  const huge = { type: "image/png", size: MAX_POSTURE_FILE_BYTES + 1, arrayBuffer: async () => assert.fail("read") };
  await assert.rejects(importPostureFile(huge, { decoder }), refused("file_too_large"));
  await assert.rejects(importPostureFile(photoBlob(), { decoder: async () => { throw new Error("bad"); } }),
    refused("decode_failed"));
  await assert.rejects(importPostureFile(photoBlob(), { decoder: async () => ({ width: 4, height: 4,
    data: new Uint8ClampedArray(64) }) }), refused("image_too_small"));
  await assert.rejects(importPostureFile(photoBlob(), { decoder: async () => ({ width: 5000, height: 5000,
    data: { length: 5000 * 5000 * 4 } }) }), refused("image_too_large"));
});

test("a cancelled import stops before decoding", async () => {
  const photo = drawnPhoto("front");
  const decoder = drawnDecoder(photo);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(importPostureFile(photoBlob(), { decoder, signal: controller.signal }), refused("import_cancelled"));
  assert.equal(decoder.calls.length, 0);
});

test("display copies are bounded and the split shows source columns on the left", () => {
  assert.deepEqual(displaySize(4000, 3000), { width: DISPLAY_MAX_EDGE, height: 768, scale: 0.256 });
  const before = byteImage(10, 2), after = byteImage(10, 2);
  before.data.fill(10);
  after.data.fill(200);
  const mixed = splitComposite(before, after, 0.3);
  assert.equal(mixed.data[0], 10);
  assert.equal(mixed.data[3 * 3], 200);
  assert.throws(() => splitComposite(before, byteImage(9, 2), 0.5), /same size/);
  const copy = displayCopy(before);
  copy.data[0] = 1;
  assert.equal(before.data[0], 10);
});

test("the stage draws through a canvas and maps clicks back to source pixels", () => withFakeDocument(async () => {
  const photo = drawnPhoto("side");
  const stage = new PostureStage();
  const big = { width: 2048, height: 2048, channels: 3, data: new Uint8Array(2048 * 2048 * 3) };
  stage.show(big, null, 0.5, { person: photo.person, head: photo.head, points: photo.points });
  assert.deepEqual([stage.element.width, stage.element.height], [1024, 1024]);
  assert.deepEqual(stage.toSource(100, 50), [200, 100]);
  assert.ok(stage.element.context.drawn.some((item) => item.kind === "putImageData"));
  stage.clear();
  assert.throws(() => stage.toSource(1, 1), /no photo/);
}));
