/** Real byte-structure checks on synthetic encoded assets only. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { crc32, stripJpegMetadata } from "../dist/js/save/export.js";
import { inspectExport, summarizeExports } from "../dist/js/save/proof-export.js";

const signature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);

function dword(value) {
  return Uint8Array.from([
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255,
  ]);
}

function concat(...parts) {
  const size = parts.reduce((n, part) => n + part.length, 0);
  const bytes = new Uint8Array(size);
  let index = 0;
  for (const part of parts) {
    bytes.set(part, index);
    index += part.length;
  }
  return bytes;
}

function chunk(name, data = new Uint8Array()) {
  const title = new TextEncoder().encode(name);
  const payload = concat(title, data);
  return concat(dword(data.length), payload, dword(crc32(payload)));
}

function validPng(additions = []) {
  const ihdr = chunk("IHDR", concat(
    dword(2),
    dword(3),
    Uint8Array.from([8, 6, 0, 0, 0]),
  ));
  const idat = chunk("IDAT", Uint8Array.from([1, 2, 3, 4, 5, 6]));
  const end = chunk("IEND");
  return concat(signature, ihdr, ...additions, idat, end);
}

function jpegSegment(marker, data = new Uint8Array()) {
  return concat(Uint8Array.from([255, marker, 0, data.length + 2]), data);
}

function validJpeg(segments = []) {
  return concat(
    Uint8Array.from([255, 216]),
    jpegSegment(224, Uint8Array.from([0, 0, 0])),
    ...segments,
    jpegSegment(218),
    Uint8Array.from([6, 12, 18, 24, 255, 217]),
  );
}

test("plain synthetic PNG is counted as metadata-free", () => {
  const bytes = validPng();
  const original = new Uint8Array(bytes);
  const proof = inspectExport(bytes);
  assert.equal(proof.format, "beljour-export-proof/1");
  assert.equal(proof.status, "PASS");
  assert.equal(proof.media, "png");
  assert.equal(proof.reason, "ok");
  assert.equal(proof.metadataChunks, 0);
  assert.equal(proof.reviewedChunks, 3);
  assert.equal(proof.bytes, bytes.length);
  assert.deepEqual(bytes, original, "inspection never changes output bytes");
});

test("two adjacent IDAT chunks preserve a valid no-metadata structure", () => {
  const png = concat(
    signature,
    chunk("IHDR", concat(dword(2), dword(3), Uint8Array.from([8, 6, 0, 0, 0]))),
    chunk("IDAT", Uint8Array.from([1, 2])),
    chunk("IDAT", Uint8Array.from([3, 4])),
    chunk("IEND"),
  );
  const proof = inspectExport(png);
  assert.equal(proof.status, "PASS");
  assert.equal(proof.reviewedChunks, 4);
});

for (const type of ["eXIf", "iTXt", "tEXt", "zTXt", "tIME", "sPLT", "sTER", "oFFs"]) {
  test(`PNG ${type} metadata is refused, never carried to a passing receipt`, () => {
    const bytes = validPng([chunk(type, Uint8Array.from([1, 2, 3]))]);
    const proof = inspectExport(bytes);
    assert.equal(proof.status, "FAIL");
    assert.equal(proof.reason, "metadata_present");
    assert.equal(proof.media, "png");
    assert.equal(proof.metadataChunks, 1);
  });
}

test("invalid PNG CRC is a structural failure", () => {
  const png = validPng();
  png[33] ^= 1;
  const proof = inspectExport(png);
  assert.equal(proof.status, "FAIL");
  assert.equal(proof.reason, "invalid_structure");
});

test("missing IEND cannot certify a complete export", () => {
  const png = validPng();
  const missing = png.subarray(0, png.length - 12);
  assert.equal(inspectExport(missing).status, "FAIL");
});

test("unexpected bytes after IEND cannot be concealed", () => {
  const png = validPng();
  assert.equal(inspectExport(concat(png, Uint8Array.from([1, 2, 3]))).status, "FAIL");
});

test("missing IDAT fails even with a valid header/footer", () => {
  const png = concat(
    signature,
    chunk("IHDR", concat(dword(2), dword(3), Uint8Array.from([8, 6, 0, 0, 0]))),
    chunk("IEND"),
  );
  assert.equal(inspectExport(png).status, "FAIL");
});

test("a zero-width PNG is invalid even with correct chunk checksums", () => {
  const png = concat(
    signature,
    chunk("IHDR", concat(dword(0), dword(3), Uint8Array.from([8, 6, 0, 0, 0]))),
    chunk("IDAT", Uint8Array.from([1, 2, 3])),
    chunk("IEND"),
  );
  assert.equal(inspectExport(png).reason, "invalid_structure");
});

test("unknown required PNG extensions do not receive an assumed pass", () => {
  const png = validPng([chunk("FOOQ", Uint8Array.from([1, 2, 3]))]);
  const proof = inspectExport(png);
  assert.equal(proof.status, "FAIL");
  assert.equal(proof.reason, "unsupported_profile");
});

test("invalid nonalphabetic PNG chunk names are refused", () => {
  const png = validPng([chunk("x01y", Uint8Array.from([1, 2]))]);
  assert.equal(inspectExport(png).reason, "invalid_structure");
});

test("a gap between IDAT chunks is treated as a malformed structure", () => {
  const png = concat(
    signature,
    chunk("IHDR", concat(dword(2), dword(3), Uint8Array.from([8, 6, 0, 0, 0]))),
    chunk("IDAT", Uint8Array.from([1, 2])),
    chunk("aaAa", Uint8Array.from([0])),
    chunk("IDAT", Uint8Array.from([3, 4])),
    chunk("IEND"),
  );
  assert.equal(inspectExport(png).reason, "invalid_structure");
});

test("a minimal synthetic JPEG with no metadata passes its marker inspection", () => {
  const jpeg = validJpeg();
  const proof = inspectExport(jpeg);
  assert.equal(proof.status, "PASS");
  assert.equal(proof.media, "jpeg");
  assert.equal(proof.metadataChunks, 0);
  assert.equal(proof.reviewedChunks, 2);
});

for (const marker of [0xe1, 0xed, 0xfe, 0xe3, 0xe4, 0xef]) {
  test(`JPEG marker 0x${marker.toString(16)} cannot pass a privacy audit`, () => {
    const jpeg = validJpeg([jpegSegment(marker, Uint8Array.from([1, 2, 3]))]);
    const proof = inspectExport(jpeg);
    assert.equal(proof.status, "FAIL");
    assert.equal(proof.reason, "metadata_present");
    assert.equal(proof.metadataChunks, 1);
  });
}

test("sanitized JPEG no longer triggers a metadata finding", () => {
  const before = validJpeg([
    jpegSegment(0xe1, Uint8Array.from([1, 2, 3])),
    jpegSegment(0xed, Uint8Array.from([4, 5, 6])),
  ]);
  assert.equal(inspectExport(before).status, "FAIL");
  const after = stripJpegMetadata(before);
  assert.equal(inspectExport(after).status, "PASS");
  assert.notDeepEqual(after, before);
});

test("truncated JPEG marker fails", () => {
  const jpeg = validJpeg();
  assert.equal(inspectExport(jpeg.subarray(0, jpeg.length - 1)).status, "FAIL");
});

test("JPEG without a valid scan start is not a complete encoded export", () => {
  const jpeg = concat(Uint8Array.from([255, 216]), jpegSegment(224), Uint8Array.from([255, 217]));
  assert.equal(inspectExport(jpeg).status, "FAIL");
});

test("JPEG with incorrect length cannot pass inspection", () => {
  const jpeg = validJpeg();
  jpeg[5] = 127;
  assert.equal(inspectExport(jpeg).reason, "invalid_structure");
});

test("PNG byte prefix can never be confused with JPEG", () => {
  const png = validPng();
  assert.equal(inspectExport(png).media, "png");
  assert.equal(inspectExport(png.subarray(1)).media, "unknown");
});

for (const bad of [null, {}, "image/jpeg", 123, [255, 216], new Uint8Array()]) {
  test(`unsupported output object ${String(bad)} gets no false PASS`, () => {
    assert.equal(inspectExport(bad).status, "FAIL");
  });
}

test("oversized byte buffer is rejected before parsing", () => {
  const huge = new Uint8Array(64 * 1024 * 1024 + 1);
  const proof = inspectExport(huge);
  assert.equal(proof.status, "FAIL");
  assert.equal(proof.reason, "too_large");
});

test("complete export batch passes with only clean images", () => {
  const exports = [validPng(), validJpeg(), validPng()];
  const proof = summarizeExports(exports, 3);
  assert.deepEqual(proof, { status: "PASS", passed: 3, failed: 0, missing: 0, expected: 3 });
});

test("incomplete export batch remains UNPROVEN", () => {
  const proof = summarizeExports([validPng()], 4);
  assert.deepEqual(proof, { status: "UNPROVEN", passed: 1, failed: 0, missing: 3, expected: 4 });
});

test("a privacy failure cannot be hidden by many successful exports", () => {
  const outputs = Array.from({ length: 20 }, () => validPng());
  outputs[13] = validPng([chunk("eXIf", Uint8Array.from([8, 9]))]);
  const proof = summarizeExports(outputs, 20);
  assert.equal(proof.status, "FAIL");
  assert.equal(proof.failed, 1);
  assert.equal(proof.passed, 19);
});

for (const expected of [0, -1, 1001, 1.5, NaN, Infinity]) {
  test(`invalid declared export count ${String(expected)} fails closed`, () => {
    assert.throws(() => summarizeExports([validPng()], expected), /1 to 1000/);
  });
}

test("extra exports beyond the declaration cannot be counted as a successful run", () => {
  assert.throws(() => summarizeExports([validPng(), validJpeg()], 1), /declared/);
});

test("the report contains no encoded image bytes, names, EXIF tags or GPS", () => {
  const proof = summarizeExports([validJpeg(), validPng()], 2);
  const text = JSON.stringify(proof);
  assert(!text.includes("data"));
  assert(!text.includes("imageName"));
  assert(!text.includes("GPS"));
  assert(!text.includes("Exif"));
});
