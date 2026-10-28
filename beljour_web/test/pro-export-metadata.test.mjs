import assert from "node:assert/strict";
import test from "node:test";

import { defaultRecipe, exportPhotoPro, stripPngMetadata } from "../dist/js/pro/index.js";
import { exportReelFrame, prepareEditedReelFrame } from "../dist/js/reel/index.js";

const ascii = (s) => new TextEncoder().encode(s);
const jpegSegment = (marker, payload) => new Uint8Array([255, marker, 0, payload.length + 2, ...payload]);
function dirtyJpeg() {
  const parts = [new Uint8Array([255, 216]), jpegSegment(225, ascii("Exif GPS secret")),
    jpegSegment(237, ascii("IPTC GPS field")), jpegSegment(254, ascii("comment GPS")),
    new Uint8Array([255, 218, 0, 2, 0, 30, 255, 217])];
  return new Uint8Array(parts.flatMap((part) => [...part]));
}
function pngChunk(tag, bytes) {
  const out = new Uint8Array(12 + bytes.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, bytes.length);
  out.set(ascii(tag), 4);
  out.set(bytes, 8);
  return out;
}
function dirtyPng() {
  const head = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = pngChunk("IHDR", new Uint8Array([0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0]));
  const exif = pngChunk("eXIf", ascii("GPS fake EXIF"));
  const textChunk = pngChunk("tEXt", ascii("GPSLatitude\0north"));
  const idat = pngChunk("IDAT", new Uint8Array([1, 2]));
  const end = pngChunk("IEND", new Uint8Array(0));
  return new Uint8Array([head, ihdr, exif, textChunk, idat, end].flatMap((chunk) => [...chunk]));
}

const fakeSource = { image: {}, width: 4, height: 4 };
function proFactory(labels, mime = "image/jpeg") {
  return () => ({ canvas: null,
    draw(source, geometry, curves, label) { labels.push(label); },
    async encode(type) { return new Blob([mime === "image/png" ? dirtyPng() : dirtyJpeg()], { type }); },
  });
}

test("pro JPEG export strips EXIF/GPS and retains simulation label by default", async () => {
  const labels = [];
  const exported = await exportPhotoPro(fakeSource, defaultRecipe(), "synthetic", proFactory(labels));
  const bytes = new Uint8Array(await exported.blob.arrayBuffer());
  assert.deepEqual(labels, ["Simulation"]);
  assert.equal(exported.label, "Simulation");
  assert.doesNotMatch(new TextDecoder().decode(bytes), /Exif|GPS|IPTC|comment/);
  assert.equal(exported.blob.type, "image/jpeg");
});

test("explicit opt-out can remove pro label without changing privacy handling", async () => {
  const labels = [];
  const recipe = { ...defaultRecipe(), simulationLabel: false };
  const result = await exportPhotoPro(fakeSource, recipe, "s", proFactory(labels));
  assert.deepEqual(labels, [null]);
  assert.equal(result.label, null);
  assert.doesNotMatch(new TextDecoder().decode(await result.blob.arrayBuffer()), /GPS/);
});

test("pro PNG removes EXIF and all untrusted metadata chunks", async () => {
  const labels = [];
  const recipe = { ...defaultRecipe(), export: "lossless" };
  const exported = await exportPhotoPro(fakeSource, recipe, "s", proFactory(labels, "image/png"));
  const bytes = new Uint8Array(await exported.blob.arrayBuffer());
  assert.equal(exported.label, "Simulation");
  assert.doesNotMatch(new TextDecoder().decode(bytes), /GPS|EXIF|tEXt|eXIf/);
  assert.ok(bytes.length < dirtyPng().length);
  assert.throws(() => stripPngMetadata(dirtyPng().slice(0, 20)));
});

test("reel frame is encoded from RGBA pixels, sanitised and marked", async () => {
  const calls = [];
  const frame = { width: 2, height: 2, data: new Uint8ClampedArray(16).fill(120) };
  const encoder = { async encode(pixels, options) {
    calls.push(options.label);
    return dirtyJpeg();
  } };
  const result = await exportReelFrame(frame, {}, encoder);
  assert.deepEqual(calls, ["Simulation"]);
  assert.equal(result.label, "Simulation");
  assert.doesNotMatch(new TextDecoder().decode(await result.blob.arrayBuffer()), /GPS|Exif/);
  const off = await exportReelFrame(frame, { simulationLabel: false }, encoder);
  assert.equal(off.label, null);
  assert.equal(calls[1], null);
});

test("an edited reel face frame fails closed without the identity provider", async () => {
  const source = { width: 1, height: 1, data: new Uint8ClampedArray([20, 40, 60, 255]) };
  const edited = { width: 1, height: 1, data: new Uint8ClampedArray([230, 220, 210, 255]) };
  await assert.rejects(prepareEditedReelFrame(source, edited, new Uint8Array([255])));
  const protectedFrame = await prepareEditedReelFrame(source, edited, new Uint8Array([255]), {
    guard: (before, after, level) => ({ pixels: after, similarity: 0.1 }),
  });
  assert.ok(protectedFrame.data[0] < edited.data[0]);
  assert.equal(protectedFrame.data[3], source.data[3]);
});
