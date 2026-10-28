// Free-library plan §6 P0 step 3: local image import. Synthetic headers built byte by byte;
// the pixel decoder is a stub, so the rules (format, limits, orientation once, alpha) are
// tested without a browser. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as D from "../dist/js/image/decode.js";

import { be16, be32, le16, le24, le32, jpeg } from "./helpers/images.mjs";

function png(width, height, colourType = 6, trns = false) {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const ihdr = [...be32(13), ..."IHDR".split("").map((c) => c.charCodeAt(0)), ...be32(width), ...be32(height), 8, colourType, 0, 0, 0, 0, 0, 0, 0];
  const extra = trns ? [...be32(1), ..."tRNS".split("").map((c) => c.charCodeAt(0)), 0, 0, 0, 0, 0] : [];
  const idat = [...be32(0), ..."IDAT".split("").map((c) => c.charCodeAt(0)), 0, 0, 0, 0];
  return Uint8Array.from([...sig, ...ihdr, ...extra, ...idat]);
}
function webpX(width, height, alpha) {
  const chunk = [..."VP8X".split("").map((c) => c.charCodeAt(0)), ...le32(10), alpha ? 0x10 : 0, 0, 0, 0, ...le24(width - 1), ...le24(height - 1)];
  return Uint8Array.from([..."RIFF".split("").map((c) => c.charCodeAt(0)), ...le32(4 + chunk.length), ..."WEBP".split("").map((c) => c.charCodeAt(0)), ...chunk]);
}
function webpLossless(width, height) {
  const bits = ((width - 1) & 0x3fff) | (((height - 1) & 0x3fff) << 14) | (1 << 28);
  const chunk = [..."VP8L".split("").map((c) => c.charCodeAt(0)), ...le32(5), 0x2f, ...le32(bits >>> 0)];
  return Uint8Array.from([..."RIFF".split("").map((c) => c.charCodeAt(0)), ...le32(4 + chunk.length), ..."WEBP".split("").map((c) => c.charCodeAt(0)), ...chunk]);
}

/** Stub decoder: every pixel encodes its stored position, alpha from a rule. */
function stub(alpha = () => 255) {
  const calls = [];
  const fn = async (bytes, header) => {
    calls.push(header);
    const data = new Uint8ClampedArray(header.width * header.height * 4);
    for (let y = 0; y < header.height; y++) for (let x = 0; x < header.width; x++) {
      const i = (y * header.width + x) * 4;
      data[i] = x; data[i + 1] = y; data[i + 2] = 7; data[i + 3] = alpha(x, y);
    }
    return { width: header.width, height: header.height, data };
  };
  fn.calls = calls;
  return fn;
}

test("formats come from magic bytes only", () => {
  assert.equal(D.sniff(jpeg(20, 20)), "jpeg");
  assert.equal(D.sniff(png(20, 20)), "png");
  assert.equal(D.sniff(webpX(20, 20, false)), "webp");
  assert.equal(D.sniff(Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])), null, "GIF refused");
  assert.equal(D.sniff(Uint8Array.from([0x49, 0x49, 0x2a, 0])), null, "TIFF refused");
  assert.throws(() => D.readHeader(Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0])), (e) => e.code === "unsupported_format");
  assert.throws(() => D.readHeader(new Uint8Array(0)), (e) => e.code === "empty");
});

test("headers give the size, alpha and EXIF orientation before any pixel decode", () => {
  assert.deepEqual(D.readHeader(jpeg(640, 480, { orientation: 6 })), { format: "jpeg", width: 640, height: 480, orientation: 6, hasAlpha: false });
  assert.equal(D.readHeader(jpeg(640, 480, { orientation: 3, order: "MM" })).orientation, 3, "big-endian TIFF");
  assert.equal(D.readHeader(jpeg(64, 48)).orientation, 1, "no EXIF means upright");
  assert.equal(D.readHeader(png(300, 200, 6)).hasAlpha, true);
  assert.equal(D.readHeader(png(300, 200, 2)).hasAlpha, false);
  assert.equal(D.readHeader(png(300, 200, 3, true)).hasAlpha, true, "palette with tRNS");
  assert.deepEqual(D.readHeader(webpX(1000, 750, true)), { format: "webp", width: 1000, height: 750, orientation: 1, hasAlpha: true });
  const lossless = D.readHeader(webpLossless(321, 123));
  assert.equal(lossless.width, 321); assert.equal(lossless.height, 123); assert.equal(lossless.hasAlpha, true);
});

test("bombs and oversized files are refused from the header, with typed codes", () => {
  assert.throws(() => D.readHeader(png(20000, 20000)), (e) => e instanceof D.DecodeError && e.code === "too_large_side");
  assert.throws(() => D.readHeader(png(6000, 6000)), (e) => e.code === "too_large_pixels");
  assert.throws(() => D.readHeader(png(8, 8)), (e) => e.code === "too_small");
  assert.throws(() => D.readHeader(jpeg(100, 100), { maxBytes: 10 }), (e) => e.code === "too_large_bytes");
  assert.throws(() => D.readHeader(jpeg(100, 100), { maxBytes: -1 }), RangeError);
});

test("corrupt files are refused, not crashed on", () => {
  const cut = jpeg(100, 100).subarray(0, 25);
  assert.throws(() => D.readHeader(cut), (e) => e.code === "corrupt");
  const noFrame = Uint8Array.from([0xff, 0xd8, 0xff, 0xda, 0, 4, 0, 0, 0xff, 0xd9]);
  assert.throws(() => D.readHeader(noFrame), (e) => e.code === "corrupt");
  const badPng = png(100, 100); badPng[12] = 0x41;
  assert.throws(() => D.readHeader(badPng), (e) => e.code === "corrupt");
  const badType = png(100, 100); badType[25] = 5;
  assert.throws(() => D.readHeader(badType), /damaged/);
  const riff = Uint8Array.from([..."RIFF".split("").map((c) => c.charCodeAt(0)), 0, 0, 0, 0, ..."WEBP".split("").map((c) => c.charCodeAt(0)), ..."ABCD".split("").map((c) => c.charCodeAt(0))]);
  assert.throws(() => D.readHeader(riff), (e) => e.code === "corrupt");
  const zero = png(0, 10);
  assert.throws(() => D.readHeader(zero), (e) => e.code === "corrupt");
});

test("every EXIF orientation is applied exactly once and lands upright", async () => {
  // A 4x3 stored image; the expected upright corner pixels per orientation.
  const W = 20, H = 16;
  for (let o = 1; o <= 8; o++) {
    const decoder = stub();
    const out = await D.decodePhoto(jpeg(W, H, { orientation: o }), decoder);
    const swapped = o >= 5;
    assert.equal(out.width, swapped ? H : W, `orientation ${o} width`);
    assert.equal(out.height, swapped ? W : H);
    assert.equal(out.orientationApplied, o);
    assert.equal(decoder.calls.length, 1, "decoded once");
    // Re-applying identity (1) to the result changes nothing: the photo carries no orientation onward.
    assert.deepEqual(D.applyOrientation(out, 1).data, out.data);
    assert.deepEqual(out.metadata, {});
  }
  const six = await D.decodePhoto(jpeg(W, H, { orientation: 6 }), stub());
  // orientation 6 = rotate 90 clockwise: stored top-left (0,0) goes to top-right.
  const tr = (0 * six.width + (six.width - 1)) * 4;
  assert.deepEqual([six.data[tr], six.data[tr + 1]], [0, 0]);
  const three = await D.decodePhoto(jpeg(W, H, { orientation: 3 }), stub());
  assert.deepEqual([three.data[0], three.data[1]], [W - 1, H - 1], "rotate 180");
  // composing 6 then 8 returns the stored image
  const stored = { width: 5, height: 3, data: Uint8ClampedArray.from({ length: 60 }, (_, i) => i) };
  assert.deepEqual(D.applyOrientation(D.applyOrientation(stored, 6), 8).data, stored.data);
  assert.throws(() => D.applyOrientation(stored, 9), /1..8/);
});

test("transparent PNG keeps alpha by default and flattens only when asked", async () => {
  const alpha = (x) => (x < 10 ? 0 : 255);
  const kept = await D.decodePhoto(png(20, 20, 6), stub(alpha));
  assert.equal(kept.hadAlpha, true);
  assert.equal(kept.flattened, false);
  assert.equal(kept.data[3], 0);
  const flat = await D.decodePhoto(png(20, 20, 6), stub(alpha), { flattenOn: [255, 255, 255] });
  assert.equal(flat.flattened, true);
  assert.deepEqual([...flat.data.subarray(0, 4)], [255, 255, 255, 255]);
  const opaque = (20 * 0 + 15) * 4;
  assert.deepEqual([...flat.data.subarray(opaque, opaque + 4)], [15, 0, 7, 255]);
  const half = D.flatten({ width: 1, height: 1, data: Uint8ClampedArray.of(200, 100, 0, 128) }, [0, 0, 0]);
  assert.deepEqual([...half], [100, 50, 0, 255]);
  assert.throws(() => D.flatten({ width: 1, height: 1, data: new Uint8ClampedArray(4) }, [0, 0]), /three values/);
});

test("decoder failures, size mismatches and cancellation are typed", async () => {
  await assert.rejects(D.decodePhoto(jpeg(20, 20), async () => { throw new Error("boom"); }), (e) => e.code === "decoder_failed");
  await assert.rejects(D.decodePhoto(jpeg(20, 20), async () => ({ width: 10, height: 20, data: new Uint8ClampedArray(800) })),
    (e) => e.code === "dimension_mismatch");
  const ac = new AbortController(); ac.abort();
  await assert.rejects(D.decodePhoto(jpeg(20, 20), stub(), { signal: ac.signal }), (e) => e.code === "aborted");
  const later = new AbortController();
  await assert.rejects(D.decodePhoto(jpeg(20, 20), async (b, h) => { later.abort(); return stub()(b, h); }, { signal: later.signal }),
    (e) => e.code === "aborted");
});

test("the browser decoder refuses cleanly where no canvas exists (node)", async () => {
  await assert.rejects(D.decodePhoto(jpeg(20, 20), D.browserDecoder()), (e) => e.code === "decoder_failed");
});
