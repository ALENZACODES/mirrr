// Synthetic image byte builders for tests (headers only, no real photos). Author: John Khan.
export function be16(n) { return [(n >> 8) & 255, n & 255]; }
export function be32(n) { return [(n >>> 24) & 255, (n >> 16) & 255, (n >> 8) & 255, n & 255]; }
export function le16(n) { return [n & 255, (n >> 8) & 255]; }
export function le24(n) { return [n & 255, (n >> 8) & 255, (n >> 16) & 255]; }
export function le32(n) { return [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255]; }

function exifApp1(orientation, order = "II") {
  const w16 = order === "II" ? le16 : be16, w32 = order === "II" ? le32 : be32;
  const tiff = [...order.split("").map((c) => c.charCodeAt(0)), ...w16(42), ...w32(8),
    ...w16(1), ...w16(0x0112), ...w16(3), ...w32(1), ...w16(orientation), 0, 0, ...w32(0)];
  const body = [..."Exif".split("").map((c) => c.charCodeAt(0)), 0, 0, ...tiff];
  return [0xff, 0xe1, ...be16(body.length + 2), ...body];
}
export function jpeg(width, height, { orientation = 0, order = "II", comment = false } = {}) {
  const parts = [0xff, 0xd8, 0xff, 0xe0, ...be16(16), 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0];
  if (orientation) parts.push(...exifApp1(orientation, order));
  if (comment) parts.push(0xff, 0xfe, ...be16(7), 0x68, 0x6f, 0x6d, 0x65, 0x21);
  parts.push(0xff, 0xc0, ...be16(17), 8, ...be16(height), ...be16(width), 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1);
  parts.push(0xff, 0xda, ...be16(12), 3, 1, 0, 2, 0x11, 3, 0x11, 0, 63, 0, 0x12, 0x34, 0x56, 0xff, 0xd9);
  return Uint8Array.from(parts);
}
