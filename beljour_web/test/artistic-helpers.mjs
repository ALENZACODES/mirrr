// Synthetic fixtures recorded by Python; no real photos. Author: John Khan.
import { readFileSync } from "node:fs";
export const vectors = JSON.parse(readFileSync(new URL("../../parity/artistic-local.json", import.meta.url), "utf8"));
export const bytes = (value) => new Uint8ClampedArray(Buffer.from(value, "base64"));
export function fixture(index = 1) {
  const p = vectors.inputs[index];
  return { image: { width: p.width, height: p.height, channels: p.channels, data: bytes(p.image) },
    options: { landmarks: p.mesh.map((row) => [...row]), hairMask: Float64Array.from(p.hair), eyeMask: Float64Array.from(p.eyes) } };
}
export function maximumGap(a, b) {
  if (a.length !== b.length) throw new Error("different lengths");
  let maximum = 0;
  for (let i = 0; i < a.length; i++) maximum = Math.max(maximum, Math.abs(a[i] - b[i]));
  return maximum;
}
