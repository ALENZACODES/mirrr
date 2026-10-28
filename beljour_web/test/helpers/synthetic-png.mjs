/** Generated synthetic PNG bytes for browser output-contract tests. Author: John Khan. */
import { deflateSync } from 'node:zlib';

const signature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = ((crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0)) >>> 0;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(kind, payload) {
  const label = Buffer.from(kind, 'ascii');
  const value = Buffer.from(payload);
  const result = Buffer.alloc(12 + value.byteLength);
  result.writeUInt32BE(value.byteLength, 0);
  label.copy(result, 4);
  value.copy(result, 8);
  result.writeUInt32BE(crc32(result.subarray(4, 8 + value.byteLength)), 8 + value.byteLength);
  return result;
}

export function syntheticPng(width = 512, height = 640, extras = []) {
  if (!Number.isInteger(width) || width < 1 || width > 6000 || !Number.isInteger(height)
    || height < 1 || height > 6000 || width * height > 12_000_000) {
    throw new RangeError('Synthetic size is out of range');
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const rows = Buffer.alloc((width * 4 + 1) * height);
  const zipped = deflateSync(rows);
  return new Blob([
    signature, chunk('IHDR', header), ...extras.map(e => chunk(e.type, e.data)),
    chunk('IDAT', zipped), chunk('IEND', Buffer.alloc(0)),
  ], { type: 'image/png' });
}

export function syntheticChunk(type, data) {
  return chunk(type, data);
}
