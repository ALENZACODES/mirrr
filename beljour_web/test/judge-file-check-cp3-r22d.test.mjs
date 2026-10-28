// Lane D r22d-cp3: synthetic header checks before decode, no image upload.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  inspectJudgeHeader,
  preflightJudgeFile,
} from '../dist/js/ui/shell/judge-file-check.js';
import {
  headerFile,
  sampleBytesJpeg,
  sampleBytesPng,
  sampleBytesWebp,
} from './judge-fixtures-cp3-r22d.mjs';

test('synthetic PNG header returns declared format and safe dimensions', () => {
  const facts = inspectJudgeHeader(sampleBytesPng(), 'image/png');
  assert.equal(facts.format, 'png');
  assert.equal(facts.width, 512);
  assert.equal(facts.height, 640);
  assert.equal(facts.dimensionSource, 'header');
  assert.equal(facts.checkedBytes, 33);
});

test('JPEG SOF0 provides safe dimensions without image decoding', () => {
  const facts = inspectJudgeHeader(sampleBytesJpeg(1024, 768), 'image/jpeg');
  assert.deepEqual([facts.width, facts.height], [1024, 768]);
  assert.equal(facts.dimensionSource, 'header');
  assert.equal(facts.format, 'jpeg');
});

test('JPEG metadata marker ahead of SOF is skipped without decoding metadata', () => {
  const facts = inspectJudgeHeader(sampleBytesJpeg(800, 600, true), 'image/jpeg');
  assert.equal(facts.width, 800);
  assert.equal(facts.height, 600);
});

test('JPEG missing SOF remains undecided until decoded rather than fabricating dimensions', () => {
  const facts = inspectJudgeHeader(new Uint8Array([255, 216, 255, 217, 0, 0, 0, 0, 0, 0, 0, 0]), 'image/jpeg');
  assert.equal(facts.width, null);
  assert.equal(facts.height, null);
  assert.equal(facts.dimensionSource, 'decoder');
});

test('WebP VP8X synthetic header extracts 24-bit little endian dimensions', () => {
  const facts = inspectJudgeHeader(sampleBytesWebp(1400, 1200), 'image/webp');
  assert.equal(facts.format, 'webp');
  assert.equal(facts.width, 1400);
  assert.equal(facts.height, 1200);
  assert.equal(facts.dimensionSource, 'header');
});

test('WebP without VP8X keeps final dimension validation in the decoder', () => {
  const bytes = sampleBytesWebp();
  bytes.set([86, 80, 56, 32], 12);
  const facts = inspectJudgeHeader(bytes, 'image/webp');
  assert.equal(facts.width, null);
  assert.equal(facts.dimensionSource, 'decoder');
});

test('file type cannot be spoofed by a declared PNG MIME and JPEG bytes', () => {
  assert.throws(() => inspectJudgeHeader(sampleBytesJpeg(), 'image/png'), /PNG header/);
  assert.throws(() => inspectJudgeHeader(sampleBytesPng(), 'image/jpeg'), /JPEG header/);
  assert.throws(() => inspectJudgeHeader(sampleBytesPng(), 'image/webp'), /WebP header/);
});

test('non-image and unsupported types fail before any decoder receives bytes', () => {
  assert.throws(() => inspectJudgeHeader(sampleBytesPng(), 'text/html'), /JPEG, PNG or WebP/);
  assert.throws(() => inspectJudgeHeader(sampleBytesPng(), 'image/svg+xml'), /JPEG, PNG or WebP/);
});

test('truncated PNG header does not pass the preflight', () => {
  const truncated = sampleBytesPng().slice(0, 18);
  assert.throws(() => inspectJudgeHeader(truncated, 'image/png'), /PNG header/);
});

test('bad PNG chunk label is rejected', () => {
  const bytes = sampleBytesPng();
  bytes[12] = 0;
  assert.throws(() => inspectJudgeHeader(bytes, 'image/png'), /PNG header/);
});

test('bad PNG IHDR length is rejected even when the dimensions look normal', () => {
  const bytes = sampleBytesPng();
  bytes[11] = 12;
  assert.throws(() => inspectJudgeHeader(bytes, 'image/png'), /PNG header/);
});

test('oversized PNG pixel count fails without allocating a canvas', () => {
  assert.throws(() => inspectJudgeHeader(sampleBytesPng(10000, 10000), 'image/png'), /too large/);
});

test('oversized WebP dimensions are rejected before decode', () => {
  assert.throws(() => inspectJudgeHeader(sampleBytesWebp(13000, 13000), 'image/webp'), /too large/);
});

test('zero and tiny dimensions are rejected at the header stage', () => {
  for (const dimensions of [[0, 100], [100, 0], [8, 600], [800, 8]]) {
    assert.throws(() => inspectJudgeHeader(sampleBytesPng(...dimensions), 'image/png'), /small/);
  }
});

test('JPEG oversized safe-integer dimensions still go through validation', () => {
  assert.throws(() => inspectJudgeHeader(sampleBytesJpeg(14000, 300), 'image/jpeg'), /too large/);
});

test('malformed JPEG section length does not loop or claim a false frame size', () => {
  const bytes = sampleBytesJpeg();
  bytes[4] = 255;
  const facts = inspectJudgeHeader(bytes, 'image/jpeg');
  assert.equal(facts.dimensionSource, 'decoder');
});

test('a real File object passes the bounded header read and exposes no pixels', async () => {
  const file = headerFile(sampleBytesPng(), 'image/png');
  const facts = await preflightJudgeFile(file);
  assert.equal(facts.format, 'png');
  assert.equal(facts.width, 512);
  assert.ok(facts.checkedBytes <= 65536);
});

test('preflight rejects empty files and invalid MIME without reading pixels', async () => {
  await assert.rejects(preflightJudgeFile(headerFile(new Uint8Array(0))), /10 MB/);
  await assert.rejects(preflightJudgeFile(headerFile(sampleBytesPng(), 'image/svg+xml')), /JPEG/);
});

test('preflight rejects a tiny file with no complete image signature', async () => {
  await assert.rejects(preflightJudgeFile(headerFile(new Uint8Array([137, 80, 78, 71]))), /incomplete/);
});

test('preflight rejects a wrong MIME even though the header belongs to an image', async () => {
  await assert.rejects(preflightJudgeFile(headerFile(sampleBytesPng(), 'image/jpeg')), /JPEG header/);
});

test('only the first 64 KiB of a large user file are inspected', async () => {
  let readLength = 0;
  const bytes = sampleBytesPng();
  const faux = {
    size: 300000,
    type: 'image/png',
    slice(start, end) {
      assert.equal(start, 0);
      readLength = end - start;
      return { arrayBuffer: async () => bytes.buffer };
    },
  };
  const facts = await preflightJudgeFile(faux);
  assert.equal(readLength, 65536);
  assert.equal(facts.format, 'png');
});

test('file preflight source does not call fetch or expose an external upload URL', async () => {
  const { readFileSync } = await import('node:fs');
  const raw = readFileSync(new URL('../src/ui/shell/judge-file-check.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(raw, /\bfetch\s*\(|XMLHttpRequest|WebSocket/);
  assert.doesNotMatch(raw, /https?:\/\//);
  assert.doesNotMatch(raw, /localStorage|sessionStorage|sendBeacon/);
});
