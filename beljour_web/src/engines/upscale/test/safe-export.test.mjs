/** Guarded upscale export: release-only, labelled by default, metadata scrubbed.
 * Author: John Khan.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { UpscalePreviewSession } from "../../../../dist/js/engines/upscale/preview-session.js";
import { safeUpscale } from "../../../../dist/js/engines/upscale/safe.js";
import { exportSafeUpscale } from "../../../../dist/js/engines/upscale/safe-export.js";
import { hasMetadata } from "../../../../dist/js/save/export.js";

const JPEG_WITH_EXIF = Uint8Array.from([
  0xff, 0xd8, 0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
  0xff, 0xda, 0x00, 0x04, 0x00, 0x00, 0x11, 0x22, 0xff, 0xd9,
]);

function encoder() {
  const calls = [];
  return { calls, encode: async (pixels, options) => { calls.push({ pixels, options }); return JPEG_WITH_EXIF; } };
}

function released(channels = 4, options = {}) {
  const width = 24, height = 20, data = new Uint8ClampedArray(width * height * channels).fill(140);
  const mask = new Uint8Array(width * height);
  for (let i = 100; i < 200; i++) mask[i] = 255;
  return safeUpscale({ width, height, channels, data }, { mask, confirmed: true }, options);
}

test("a release exports labelled by default with metadata removed", async () => {
  const recorder = encoder();
  const output = await exportSafeUpscale(released(), "Upscale_2x", {}, undefined, recorder);
  assert.equal(output.label, "Simulation");
  assert.equal(recorder.calls[0].options.label, "Simulation");
  assert.equal(output.name, "Upscale_2x.jpg");
  assert.equal(hasMetadata(new Uint8Array(await output.blob.arrayBuffer())), false);
  assert.equal(recorder.calls[0].pixels.width, 48);
});

test("only an explicit false removes the label", async () => {
  const recorder = encoder();
  const output = await exportSafeUpscale(released(), "Plain", { simulationLabel: false }, undefined, recorder);
  assert.equal(output.label, null);
});

test("RGB results are widened to opaque RGBA for the encoder", async () => {
  const recorder = encoder();
  await exportSafeUpscale(released(3), "Rgb", {}, undefined, recorder);
  const pixels = recorder.calls[0].pixels.data;
  assert.equal(pixels.length, 48 * 40 * 4);
  assert.equal(pixels[3], 255);
});

test("previews, relabelled and resized results are refused", async () => {
  const preview = released(4, { release: false });
  await assert.rejects(exportSafeUpscale(preview, "No", {}, undefined, encoder()), /release/);
  await assert.rejects(exportSafeUpscale({ ...released(), label: "Edited" }, "No", {}, undefined, encoder()), /label/);
  const result = released();
  const shrunk = { ...result, photo: { ...result.photo, width: 10 } };
  await assert.rejects(exportSafeUpscale(shrunk, "No", {}, undefined, encoder()), /admitted size/);
});

test("the release ticket must be current and match the result", async () => {
  const session = new UpscalePreviewSession();
  session.open("c".repeat(64), 24, 20);
  const ticket = session.release({ detailLevel: 3, lockLevel: 5 });
  const result = released(4, { detailLevel: 3, lockLevel: 5 });
  await exportSafeUpscale(result, "Ok", {}, { session, ticket }, encoder());
  await assert.rejects(exportSafeUpscale(released(4, { detailLevel: 4 }), "No", {}, { session, ticket }, encoder()),
    /ticket/);
  const preview = session.preview();
  await assert.rejects(exportSafeUpscale(result, "No", {}, { session, ticket: preview }, encoder()), /current/);
  session.release();
  await assert.rejects(exportSafeUpscale(result, "No", {}, { session, ticket }, encoder()), /current/);
});
