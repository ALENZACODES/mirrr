/** Structural checks for original synthetic PNG bytes. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { verifyPngBytes, inspectExportedPng } from '../dist/js/layout/continuous/export-png.js';
import { syntheticPng, syntheticChunk } from './helpers/synthetic-png.mjs';

async function bytes(blob) {
  return new Uint8Array(await blob.arrayBuffer());
}

async function altered(blob, callback, mime = 'image/png') {
  const copy = await bytes(blob);
  callback(copy);
  return new Blob([copy], { type: mime });
}

for (const [width, height] of [[1, 1], [7, 19], [512, 640], [1024, 512], [3000, 2500]]) {
  test(`generated original PNG ${width}x${height} verifies without metadata`, async () => {
    const blob = syntheticPng(width, height);
    const result = await inspectExportedPng(blob, width, height);
    assert.deepEqual(result, {
      width, height, size: blob.size, hasPixels: true, hasTextMetadata: false,
    });
    assert.equal((await bytes(blob)).byteLength, blob.size);
  });
}

test('source data is read only after bounded content type and size checks', async () => {
  const wrongMime = new Blob(['not an image'], { type: 'text/plain' });
  await assert.rejects(inspectExportedPng(wrongMime, 1, 1), /PNG/);
  const huge = new Blob([new Uint8Array(48 * 1024 * 1024 + 1)], { type: 'image/png' });
  await assert.rejects(inspectExportedPng(huge, 1, 1), /empty or above/);
  const noBytes = new Blob([], { type: 'image/png' });
  await assert.rejects(inspectExportedPng(noBytes, 1, 1), /empty or above/);
});

test('PNG parsing rejects non-byte input, invalid expected dimensions and unknown size', async () => {
  const valid = await bytes(syntheticPng(4, 3));
  assert.throws(() => verifyPngBytes({}, 4, 3), /size/);
  for (const dims of [[0, 3], [4, 0], [-1, 3], [NaN, 3], [4, Infinity], [0.1, 1]]) {
    assert.throws(() => verifyPngBytes(valid, ...dims), /dimensions/);
  }
  assert.throws(() => verifyPngBytes(valid, 6000, 6000), /dimensions/);
  assert.throws(() => verifyPngBytes(valid, 5, 3), /dimensions/);
});

test('PNG signature cannot be replaced by another image type', async () => {
  const blob = syntheticPng(3, 2);
  for (let offset = 0; offset < 8; offset += 1) {
    const invalid = await altered(blob, data => { data[offset] ^= 1; });
    await assert.rejects(inspectExportedPng(invalid, 3, 2), /signature/);
  }
});

test('every fixed-header byte is integrity checked', async () => {
  const blob = syntheticPng(16, 8);
  for (const offset of [12, 15, 16, 19, 20, 23, 24, 26, 27, 28, 29]) {
    const invalid = await altered(blob, data => { data[offset] ^= 4; });
    await assert.rejects(inspectExportedPng(invalid, 16, 8));
  }
});

test('image data and end-marker CRC mismatches are refused', async () => {
  const blob = syntheticPng(13, 11);
  const bytesBefore = await bytes(blob);
  const dataStart = 8 + 25;
  const bodyStart = dataStart + 8;
  const lastCrc = bytesBefore.length - 4;
  for (const offset of [bodyStart, bodyStart + 2, lastCrc]) {
    const invalid = await altered(blob, data => { data[offset] ^= 128; });
    await assert.rejects(inspectExportedPng(invalid, 13, 11), /integrity|chunk/);
  }
});

test('truncation, trailing payload and implausible chunk lengths are refused', async () => {
  const blob = syntheticPng(12, 13);
  const full = await bytes(blob);
  for (const cutoff of [1, 8, 16, 30, 44, 57, full.length - 1]) {
    await assert.rejects(inspectExportedPng(new Blob([full.slice(0, cutoff)], {
      type: 'image/png',
    }), 12, 13));
  }
  const tail = new Blob([full, new Uint8Array([0, 1, 2])], { type: 'image/png' });
  await assert.rejects(inspectExportedPng(tail, 12, 13), /end marker/);
  const hugeLength = await altered(blob, data => {
    data[33] = 255;
    data[34] = 255;
    data[35] = 255;
    data[36] = 255;
  });
  await assert.rejects(inspectExportedPng(hugeLength, 12, 13), /length/);
});

for (const tag of ['tEXt', 'iTXt', 'zTXt', 'eXIf', 'iCCP']) {
  test(`privacy check rejects metadata chunk ${tag}`, async () => {
    const blob = syntheticPng(2, 2, [{ type: tag, data: Buffer.from('owner detail') }]);
    await assert.rejects(inspectExportedPng(blob, 2, 2), /metadata/);
  });
}

test('a harmless colour hint remains compatible with original Canvas PNGs', async () => {
  const hint = Buffer.from([0, 0, 177, 143]);
  const blob = syntheticPng(21, 15, [{ type: 'gAMA', data: hint }]);
  const result = await inspectExportedPng(blob, 21, 15);
  assert.equal(result.hasTextMetadata, false);
  assert.equal(result.hasPixels, true);
});

test('unknown critical chunk is rejected without breaking ancillary compatibility', async () => {
  const blob = syntheticPng(2, 2, [{ type: 'ABCD', data: Buffer.alloc(0) }]);
  await assert.rejects(inspectExportedPng(blob, 2, 2), /critical/);
  const benign = syntheticPng(2, 2, [{ type: 'abCD', data: Buffer.from('ok') }]);
  assert.equal((await inspectExportedPng(benign, 2, 2)).hasPixels, true);
});

test('a PNG with no IDAT cannot pass despite a valid signature', async () => {
  const data = await bytes(syntheticPng(4, 4));
  const header = data.subarray(0, 33);
  const end = syntheticChunk('IEND', Buffer.alloc(0));
  const hint = syntheticChunk('gAMA', Buffer.from([0, 0, 177, 143]));
  const blob = new Blob([header, hint, end], { type: 'image/png' });
  await assert.rejects(inspectExportedPng(blob, 4, 4), /pixel data/);
});

test('unexpected colour-bit-depth and interlace fields are refused', async () => {
  const source = syntheticPng(2, 2);
  for (const [offset, value] of [[24, 16], [25, 3], [26, 1], [27, 1], [28, 1]]) {
    const blob = await altered(source, data => { data[offset] = value; });
    await assert.rejects(inspectExportedPng(blob, 2, 2), /integrity|scan mode/);
  }
});

test('the verifier does not mutate its input bytes', async () => {
  const data = await bytes(syntheticPng(37, 41));
  const original = new Uint8Array(data);
  assert.equal(verifyPngBytes(data, 37, 41).hasPixels, true);
  assert.deepEqual(data, original);
});
