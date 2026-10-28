/** Encoded-format structural fixtures. Not photos and not codec-decoding tests. */
const text = new TextEncoder();

function pngChunk(name, payload) {
  const chunk = new Uint8Array(payload.length + 12);
  new DataView(chunk.buffer).setUint32(0, payload.length);
  chunk.set(text.encode(name), 4);
  chunk.set(payload, 8);
  return chunk;
}

export function encodedBytes(mime = "image/jpeg") {
  if (mime === "image/jpeg") {
    return new Uint8Array([255, 216, 255, 218, 0, 2, 0, 5, 255, 217]);
  }
  if (mime === "image/png") {
    const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const header = pngChunk("IHDR", new Uint8Array([0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0]));
    const pixels = pngChunk("IDAT", new Uint8Array([1, 2]));
    const end = pngChunk("IEND", new Uint8Array());
    return new Uint8Array([signature, header, pixels, end].flatMap((part) => [...part]));
  }
  throw new RangeError("Unsupported test image format");
}

export function encodedBlob(mime = "image/jpeg") {
  return new Blob([encodedBytes(mime)], { type: mime });
}
