// Mathematical eye fixtures; no photographs. Author: John Khan.
import { readFileSync } from "node:fs";
export const corpus = JSON.parse(readFileSync(new URL("../../parity/eyes-r15b.json", import.meta.url), "utf8"));
export function fixture(index = 0) {
  const source = corpus.fixtures[index];
  return {
    image: { width: source.width, height: source.height, channels: source.channels, data: Uint8ClampedArray.from(source.data) },
    mesh: structuredClone(source.landmarks),
    traces: structuredClone(source.traces),
    frames: structuredClone(source.frames),
  };
}
export const defaultStyles = { W59: "hybrid", W60: "kitten", W61: "lifting", W62: "cluster", W63: "volumising", W64: "wing", W65: "floating", W66: "halo", W67: "duochrome", W75: "", W76: "navy" };
export function numericDifference(a, b, path = "root") {
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b);
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) throw new Error(`array length mismatch at ${path}`);
    return Math.max(0, ...a.map((v, i) => numericDifference(v, b[i], `${path}[${i}]`)));
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    if (JSON.stringify(Object.keys(a).sort()) !== JSON.stringify(Object.keys(b).sort())) throw new Error(`object keys mismatch at ${path}`);
    return Math.max(0, ...Object.keys(a).map(k => numericDifference(a[k], b[k], `${path}.${k}`)));
  }
  if (a !== b) throw new Error(`value mismatch at ${path}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
  return 0;
}
