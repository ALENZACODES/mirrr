/** W69-W74 strict browser contracts and bounded buffers. Author: John Khan. */
import type { ByteImage } from "../core/buffer.js";
export type { ByteImage } from "../core/buffer.js";
export type { MeshPoint } from "../../data/regions/index.js";

export const FEATURES = ["W69", "W70", "W71", "W72", "W73", "W74"] as const;
export type BrowFeature = typeof FEATURES[number];
export const VERSION = "brows-r15b/1";
export const LABEL = "Brow simulation. Placement and colour are illustrative, not a treatment prediction.";
export const MAX_PIXELS = 4194304;
export const MAX_SIDE = 4096;
export type BrowOptions = Record<string, unknown>;
export interface BrowEvidence {
  coverage: Float64Array;
  grey: Float64Array;
  origin: "contrast" | "manual";
  confidence: number;
  notes: string[];
}
export interface BrowResult {
  image: Uint8ClampedArray;
  support: Float64Array;
  metrics: Record<string, unknown>;
  warnings: string[];
  label: string;
  status: "simulation" | "unavailable";
  details: Record<string, unknown>;
}

export function photo(image: ByteImage): ByteImage {
  if (!image || !(image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray)) {
    throw new RangeError("brows require an RGB or RGBA byte image");
  }
  if (image.channels !== 3 && image.channels !== 4) throw new RangeError("brows require RGB or RGBA");
  if (!Number.isInteger(image.width) || !Number.isInteger(image.height)) throw new RangeError("integer dimensions required");
  if (Math.min(image.width, image.height) < 8 || Math.max(image.width, image.height) > MAX_SIDE || image.width * image.height > MAX_PIXELS) {
    throw new RangeError("brow image must be 8..4096 pixels per side and at most 4194304 pixels");
  }
  if (image.data.length !== image.width * image.height * image.channels) throw new RangeError("photo data size mismatch");
  return image;
}

export function number(value: unknown, name: string, low: number, high: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < low || value > high) {
    throw new RangeError(`${name} must be finite in ${low}..${high}`);
  }
  return value;
}

export function choice<T extends string>(value: unknown, name: string, allowed: readonly T[]): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) throw new RangeError(`${name} must be one of ${allowed.join(", ")}`);
  return value as T;
}

export function boolean(value: unknown, name: string): boolean {
  if (typeof value !== "boolean") throw new RangeError(`${name} must be a boolean`);
  return value;
}

export function colour(value: unknown): [number, number, number] {
  if (!Array.isArray(value) || value.length !== 3) throw new RangeError("colour must be three RGB bytes");
  const out = value.map(v => number(v, "colour", 0, 255));
  if (out.some(v => !Number.isInteger(v))) throw new RangeError("colour components must be integer bytes");
  return [out[0], out[1], out[2]];
}

export function options(value: unknown, allowed: readonly string[]): BrowOptions {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) throw new RangeError("brow options must be an object");
  if (Object.values(value).some(item => item === null)) throw new RangeError("brow options cannot contain null values");
  const own = Object.keys(value);
  if (own.some(key => !allowed.includes(key))) throw new RangeError(`unknown brow option: ${own.filter(k => !allowed.includes(k)).join(", ")}`);
  return { ...value as BrowOptions };
}

export function checkedMask(value: ArrayLike<number>, image: ByteImage, name: string): Float64Array {
  if (!value || value.length !== image.width * image.height) throw new RangeError(`${name} size mismatch`);
  const result = new Float64Array(value.length);
  for (let i = 0; i < value.length; i++) result[i] = number(value[i], name, 0, 1);
  return result;
}

export function validateEvidence(evidence: BrowEvidence, image: ByteImage, region: Float64Array): BrowEvidence {
  if (!evidence || typeof evidence !== "object") throw new RangeError("brow evidence required");
  const coverage = checkedMask(evidence.coverage, image, "coverage");
  const grey = checkedMask(evidence.grey, image, "grey");
  const origin = choice(evidence.origin, "evidence origin", ["contrast", "manual"]);
  const confidence = number(evidence.confidence, "confidence", 0, 1);
  if (!Array.isArray(evidence.notes) || evidence.notes.length > 8 || evidence.notes.some(note => typeof note !== "string" || note.length > 200)) {
    throw new RangeError("evidence notes must be at most eight short strings");
  }
  for (let i = 0; i < coverage.length; i++) {
    if (region[i] === 0 && coverage[i] > 0) throw new RangeError("observed hair coverage must stay inside the brow contour");
    if (grey[i] > coverage[i] + 1e-12) throw new RangeError("grey coverage cannot exceed observed hair coverage");
    if (image.channels === 4) {
      coverage[i] *= image.data[i * 4 + 3] / 255;
      grey[i] = Math.min(grey[i], coverage[i]);
    }
  }
  return { coverage, grey, origin, confidence, notes: [...evidence.notes] };
}

export function byte(value: number): number {
  return Math.min(255, Math.max(0, Math.floor(value + 0.5)));
}

export function finish(image: ByteImage, output: Uint8ClampedArray, support: Float64Array,
  metrics: Record<string, unknown>, warnings: string[] = [], status: "simulation" | "unavailable" = "simulation",
  details: Record<string, unknown> = {}): BrowResult {
  if (output.length !== image.data.length || support.length !== image.width * image.height) throw new RangeError("brow output size mismatch");
  let changed = 0;
  for (let i = 0; i < support.length; i++) {
    const offset = i * image.channels;
    if (image.channels === 4) {
      output[offset + 3] = image.data[offset + 3];
      if (image.data[offset + 3] === 0) {
        for (let c = 0; c < 4; c++) output[offset + c] = image.data[offset + c];
        support[i] = 0;
      }
    }
    let differs = false;
    for (let c = 0; c < image.channels; c++) if (output[offset + c] !== image.data[offset + c]) differs = true;
    if (differs && support[i] <= 0) throw new RangeError("brow renderer modified pixels outside its support");
    if (differs) changed++;
  }
  return { image: output.slice(), support: support.slice(), metrics: { ...metrics, changed_pixels: changed,
    outside_unchanged: true, alpha_unchanged: true, finite_output: true, geometry_changed: false },
    warnings: [...warnings], label: LABEL, status, details };
}
