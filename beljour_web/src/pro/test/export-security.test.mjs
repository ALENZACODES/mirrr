import assert from "node:assert/strict";
import test from "node:test";

import { scrubEncodedBlob, stripImageMetadata, stripPngMetadata } from "../../../dist/js/pro/index.js";
import { encodedBlob, encodedBytes } from "./encoded-fixtures.mjs";

function chunk(tag, body = new Uint8Array(0)) {
  const output = new Uint8Array(body.length + 12);
  new DataView(output.buffer).setUint32(0, body.length);
  output.set(new TextEncoder().encode(tag), 4);
  output.set(body, 8);
  return output;
}

function concatenate(...parts) {
  return Uint8Array.from(parts.flatMap((part) => [...part]));
}

test("metadata scrub refuses unknown MIME and malformed binary headers", () => {
  const png = encodedBytes("image/png");
  assert.throws(() => stripImageMetadata(new Uint8Array([1, 2, 3]), "image/jpeg"));
  assert.throws(() => stripImageMetadata(new Uint8Array([1, 2, 3]), "image/png"));
  assert.throws(() => stripImageMetadata(png, "image/webp"));
  assert.throws(() => stripPngMetadata(new Uint8Array(0)));
});

test("PNG drops private ancillary payloads without changing critical chunks", () => {
  const source = encodedBytes("image/png");
  const privateComment = chunk("tEXt", new TextEncoder().encode("GPSLatitude\0personal"));
  const dangerousExif = chunk("eXIf", new TextEncoder().encode("Exif\0\0GPS"));
  const mixed = concatenate(source.slice(0, 33), privateComment, dangerousExif, source.slice(33));
  const cleaned = stripPngMetadata(mixed);
  assert.deepEqual(cleaned, source);
  assert.notEqual(cleaned.length, mixed.length);
});

test("PNG rejects unknown critical extensions rather than making corrupt output", () => {
  const source = encodedBytes("image/png");
  const corrupt = concatenate(source.slice(0, 33), chunk("ABCD", new Uint8Array([1])), source.slice(33));
  assert.throws(() => stripPngMetadata(corrupt), /critical/);
});

test("PNG rejects hidden trailing data beyond IEND and oversized chunks", () => {
  const source = encodedBytes("image/png");
  assert.throws(() => stripPngMetadata(concatenate(source, new Uint8Array([99]))));
  const invalidLength = source.slice();
  new DataView(invalidLength.buffer).setUint32(8, 0xfffffffe);
  assert.throws(() => stripPngMetadata(invalidLength), /Damaged PNG/);
});

test("export guard rejects blobs with wrong MIME, zero length and oversize", async () => {
  await assert.rejects(scrubEncodedBlob(new Blob(), "image/jpeg"));
  await assert.rejects(scrubEncodedBlob(encodedBlob("image/png"), "image/jpeg"));
  const encoded = encodedBlob("image/jpeg");
  const cleaned = await scrubEncodedBlob(encoded, "image/jpeg");
  assert.equal(cleaned.size, encoded.size);
  assert.equal(cleaned.type, "image/jpeg");
});

test("JPEG final scrub keeps the actual scan after removing an EXIF marker", () => {
  const jpeg = encodedBytes("image/jpeg");
  const marker = Uint8Array.of(255, 225, 0, 8, 69, 120, 105, 102, 0, 0);
  const source = concatenate(jpeg.slice(0, 2), marker, jpeg.slice(2));
  assert.deepEqual(stripImageMetadata(source, "image/jpeg"), jpeg);
  assert.deepEqual(source.slice(2, 12), marker);
});
