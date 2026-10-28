/** Pre-encoder colour integrity on synthetic pixels with a recording encoder.
 * Author: John Khan.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  EXPORT_LABEL, encoderInput, exportColourSafe, jpegEncoderInput, pngEncoderInput,
} from "../../../../dist/js/engines/upscale/colour-export.js";
import { hasMetadata } from "../../../../dist/js/save/export.js";

function raster(pixels) {
  return { width: pixels.length, height: 1, data: Uint8ClampedArray.from(pixels.flat()) };
}

/** A tiny JPEG-shaped byte string carrying an EXIF (APP1) segment and a comment. */
const JPEG_WITH_EXIF = Uint8Array.from([
  0xff, 0xd8,
  0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
  0xff, 0xfe, 0x00, 0x04, 0x47, 0x50,
  0xff, 0xda, 0x00, 0x04, 0x00, 0x00, 0x11, 0x22,
  0xff, 0xd9,
]);

function recorder(bytes = JPEG_WITH_EXIF) {
  const calls = [];
  return {
    calls,
    encode: async (pixels, options) => {
      calls.push({ pixels: new Uint8ClampedArray(pixels.data), options });
      return bytes;
    },
  };
}

test("opaque thin-product colours reach the JPEG encoder unchanged", () => {
  const strokes = [[176, 22, 61, 255], [1, 254, 128, 255], [0, 0, 0, 255], [255, 255, 255, 255]];
  assert.deepEqual([...jpegEncoderInput(raster(strokes))], strokes.flat());
});

test("transparency is flattened onto white for JPEG", () => {
  const out = jpegEncoderInput(raster([[10, 200, 30, 0], [0, 0, 0, 128], [200, 100, 0, 64]]));
  assert.deepEqual([...out.slice(0, 4)], [255, 255, 255, 255]);
  // (0 * 128 + 255 * 127) / 255 = 127
  assert.deepEqual([...out.slice(4, 8)], [127, 127, 127, 255]);
  const blend = channel => Math.round((channel * 64 + 255 * 191) / 255);
  assert.deepEqual([...out.slice(8, 12)], [blend(200), blend(100), blend(0), 255]);
});

test("PNG keeps alpha and clears colour hidden under fully transparent pixels", () => {
  const out = pngEncoderInput(raster([[90, 80, 70, 0], [90, 80, 70, 1], [5, 6, 7, 255]]));
  assert.deepEqual([...out], [0, 0, 0, 0, 90, 80, 70, 1, 5, 6, 7, 255]);
});

test("inputs are never modified in place", () => {
  const source = raster([[9, 9, 9, 0]]);
  jpegEncoderInput(source);
  pngEncoderInput(source);
  assert.deepEqual([...source.data], [9, 9, 9, 0]);
});

test("export labels by default, scrubs metadata and names the file", async () => {
  const encoder = recorder();
  const result = await exportColourSafe(raster([[1, 2, 3, 255]]), "Upscale_HD", {}, encoder);
  assert.equal(result.label, EXPORT_LABEL);
  assert.equal(encoder.calls[0].options.label, EXPORT_LABEL);
  assert.equal(encoder.calls[0].options.type, "image/jpeg");
  assert.equal(result.name, "Upscale_HD.jpg");
  const bytes = new Uint8Array(await result.blob.arrayBuffer());
  assert.equal(hasMetadata(JPEG_WITH_EXIF), true);
  assert.equal(hasMetadata(bytes), false);
  assert.deepEqual([...encoder.calls[0].pixels], [1, 2, 3, 255]);
});

test("only an explicit false hides the label", async () => {
  const encoder = recorder();
  const result = await exportColourSafe(raster([[1, 2, 3, 255]]), "Plain", { simulationLabel: false }, encoder);
  assert.equal(result.label, null);
  assert.equal(encoder.calls[0].options.label, null);
  await assert.rejects(exportColourSafe(raster([[1, 2, 3, 255]]), "Plain",
    { simulationLabel: "no" }, recorder()), /label/);
});

test("PNG exports pass the cleared pixels to the encoder", async () => {
  const png = Uint8Array.from([
    137, 80, 78, 71, 13, 10, 26, 10,
    0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 0x1f, 0x15, 0xc4, 0x89,
    0, 0, 0, 1, 73, 68, 65, 84, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 73, 69, 78, 68, 0xae, 0x42, 0x60, 0x82,
  ]);
  const encoder = recorder(png);
  const result = await exportColourSafe(raster([[40, 50, 60, 0]]), "Cutout", { mime: "image/png" }, encoder);
  assert.equal(result.name, "Cutout.png");
  assert.deepEqual([...encoder.calls[0].pixels], [0, 0, 0, 0]);
});

test("invalid rasters, names, formats and qualities are refused", async () => {
  assert.throws(() => encoderInput({ width: 2, height: 1, data: new Uint8ClampedArray(4) }, "image/jpeg"), /RGBA/);
  assert.throws(() => encoderInput({ width: 0, height: 1, data: new Uint8ClampedArray(0) }, "image/png"), /RGBA/);
  assert.throws(() => encoderInput({ width: 4000, height: 4000, data: new Uint8ClampedArray(4) }, "image/png"), /RGBA/);
  assert.throws(() => encoderInput(raster([[1, 2, 3, 4]]), "image/webp"), /format/);
  const pixel = raster([[1, 2, 3, 255]]);
  await assert.rejects(exportColourSafe(pixel, "../escape", {}, recorder()), /name/);
  await assert.rejects(exportColourSafe(pixel, "Fine", { quality: 0 }, recorder()), /quality/);
  await assert.rejects(exportColourSafe(pixel, "Fine", { quality: 1.5 }, recorder()), /quality/);
  await assert.rejects(exportColourSafe(pixel, "Fine", {}, recorder(new Uint8Array(0))), /no image/);
});
