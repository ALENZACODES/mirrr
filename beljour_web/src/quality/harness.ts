/**
 * Scores a browser engine over test photos and its stops with the E29 checks and builds a
 * §17 report, following api/plumb_api/quality/harness.py step for step:
 *   per photo and stop: Q1 against the engine's editMask, Q4 on the selection edge, Q5 by
 *   running twice, Q6 when the stop names a target colour, Q10 when a skin mask is named;
 *   across stops: Q9 on the mean colour change in the selection, attached to the last stop.
 * `syntheticPhoto` reproduces the Python synthetic photos bit for bit, so a Python and a
 * TypeScript report on the same engine can be compared number by number.
 *
 * Author: John Khan.
 */
import { type ByteImage, type Mask, byteImage, roundHalfEven } from "../engines/core/buffer.js";
import { type LocalEngine, type Params, type Seed, runEngine } from "../engines/core/engine.js";
import { ellipse } from "../engines/core/mask.js";
import { type Check, effectStrength, q10TextureKept, q1OutsideMask, q4Seam, q5Determinism, q6ColourAccuracy, q9Monotonic } from "./metrics.js";
import { type PhotoEntry, type QualityReport, buildReport } from "./report.js";

export const NATURAL_TEXTURE = 0.6;
export const STRONGEST_TEXTURE = 0.35;

export interface SamplePhoto {
  photo: string;
  image: ByteImage;
  masks: Record<string, Mask>;
  synthetic: boolean;
  landmarks?: unknown;
}

export interface StopSpec { name: string; params: Params; target?: string }

/** Noise in [-0.5, 0.5) from 32-bit hashing; identical to harness.hash_noise in Python. */
export function hashNoise(seed: number, width: number, height: number): Float64Array {
  const out = new Float64Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let h = (x * 374761393 + y * 668265263 + seed * 2246822519) >>> 0;
      h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
      h = (h ^ (h >>> 16)) >>> 0;
      out[y * width + x] = (h % 10007) / 10007 - 0.5;
    }
  }
  return out;
}

/** A soft background gradient, a skin-toned oval with fine texture, and its masks. */
export function syntheticPhoto(seed: number, height = 96, width = 80): SamplePhoto {
  const face = ellipse(width, height, width * 0.5, height * 0.5, width * 0.32, height * 0.38, 0.08);
  const skin = ellipse(width, height, width * 0.5, height * 0.52, width * 0.24, height * 0.28);
  const noise = hashNoise(seed, width, height);
  const offset = (seed % 7) - 3;
  const tone = [196 + offset, 150 + offset, 128 + offset];
  const image = byteImage(width, height, 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // NumPy computes 1 - face in float32 (the mask's type); Math.fround does the same here.
      const i = y * width + x, f = face.data[i], keep = Math.fround(1 - f), t = 16 * noise[i];
      const base = [60 + (80 * x) / width, 70 + (60 * y) / height, 110 + (40 * (x + y)) / (width + height)];
      for (let c = 0; c < 3; c++) {
        const v = base[c] * keep + (tone[c] + t) * f;
        image.data[i * 3 + c] = Math.min(255, Math.max(0, roundHalfEven(v)));
      }
    }
  }
  return { photo: `synthetic-${String(seed).padStart(2, "0")}`, image, masks: { selection: face, skin }, synthetic: true };
}

export function textureMinimum(index: number, count: number): number {
  if (count <= 1) return NATURAL_TEXTURE;
  return NATURAL_TEXTURE + (STRONGEST_TEXTURE - NATURAL_TEXTURE) * (index / (count - 1));
}

export interface ScoreOptions { seed?: Seed; selection?: string; skin?: string | null }

export function scorePhoto(engine: LocalEngine, photo: SamplePhoto, stops: readonly StopSpec[], options: ScoreOptions = {}): Array<[StopSpec, Check[]]> {
  const seed = options.seed ?? 0, select = photo.masks[options.selection ?? "selection"], skin = options.skin ?? null;
  if (!select) throw new RangeError("the photo has no selection mask");
  const render = (params: Params) => runEngine(engine, photo.image, photo.landmarks, photo.masks, params, seed).image;
  const out: Array<[StopSpec, Check[]]> = [];
  const strengths: number[] = [];
  stops.forEach((stop, index) => {
    const result = runEngine(engine, photo.image, photo.landmarks, photo.masks, stop.params, seed);
    const checks = [
      q1OutsideMask(photo.image, result.image, result.editMask),
      q4Seam(photo.image, result.image, select),
      q5Determinism(() => render(stop.params)),
    ];
    if (stop.target) checks.push(q6ColourAccuracy(result.image, select, stop.target));
    if (skin) checks.push(q10TextureKept(photo.image, result.image, photo.masks[skin], textureMinimum(index, stops.length)));
    strengths.push(effectStrength(photo.image, result.image, select));
    out.push([stop, checks]);
  });
  if (stops.length > 1) out[out.length - 1][1].push(q9Monotonic(strengths));
  return out;
}

export interface RunOptions extends ScoreOptions { created?: string; extra?: Record<string, Check[]> }

export function run(tool: string, toolVersion: string, engine: LocalEngine, photos: readonly SamplePhoto[], stops: readonly StopSpec[],
  options: RunOptions = {}): QualityReport {
  if (!photos.length || !stops.length) throw new RangeError("need at least one photo and one stop");
  const entries: PhotoEntry[] = [];
  for (const photo of photos) {
    for (const [stop, checks] of scorePhoto(engine, photo, stops, options)) {
      entries.push({ photo: photo.photo, synthetic: photo.synthetic, stop: stop.name, checks });
    }
    for (const check of options.extra?.[photo.photo] ?? []) entries.push({ photo: photo.photo, synthetic: photo.synthetic, stop: null, checks: [check] });
  }
  return buildReport(tool, toolVersion, entries, options.created);
}
