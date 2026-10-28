/**
 * Contract 13 in TypeScript: the local engine interface browser engines implement, and the
 * checked runner. Same rules as api/plumb_api/engines/core/engine.py:
 *   - input is 8-bit sRGB RGB or RGBA and is never changed;
 *   - masks are named one-channel fields in [0, 1] matching the image;
 *   - the seed is an unsigned 64-bit integer (a number up to 2^53 - 1, or a bigint);
 *   - the result declares provenance "local", a pipeline version, finite metrics and an
 *     editMask that covers every pixel it changed.
 * Engines never call YouCam, fetch models or read credentials.
 *
 * Also the two reference engines from api/plumb_api/engines/core/local.py (exposure, tint),
 * so the same engine can be scored in both languages and compared (parity, CONTRACTS.md §16).
 * Author: John Khan.
 */
import { type ByteImage, type Mask, byteImage, requireColour, requireMask } from "./buffer.js";
import { differenceMask, exposure, solid } from "./composite.js";
import { fullMask } from "./mask.js";

export type ParamValue = number | string | boolean | readonly number[];
export type Params = Readonly<Record<string, ParamValue>>;
export type Seed = number | bigint;

export interface EngineResult {
  image: ByteImage;
  editMask: Mask;
  metrics: Record<string, number>;
  provenance: "local";
  pipelineVersion: string;
}

export interface LocalEngine {
  readonly version: string;
  run(image: ByteImage, landmarks: unknown, masks: Readonly<Record<string, Mask>>, params: Params, seed: Seed): EngineResult;
}

const U64 = (1n << 64n) - 1n;

export function validSeed(seed: Seed): boolean {
  if (typeof seed === "bigint") return seed >= 0n && seed <= U64;
  return Number.isSafeInteger(seed) && seed >= 0;
}

function cloneBytes(img: ByteImage): ByteImage {
  const out = byteImage(img.width, img.height, img.channels);
  out.data.set(img.data);
  return out;
}

function cloneMask(mask: Mask): Mask {
  return { width: mask.width, height: mask.height, channels: 1, data: Float32Array.from(mask.data) };
}

function sameBytes(a: ArrayLike<number>, b: ArrayLike<number>): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/** Check a result envelope on its own (shape, provenance, version, mask, metrics). */
export function checkResult(result: EngineResult, width: number, height: number, channels: number): void {
  if (result.provenance !== "local") throw new RangeError("local engine must declare local provenance");
  if (!result.pipelineVersion) throw new RangeError("pipelineVersion required");
  requireColour(result.image);
  if (result.image.width !== width || result.image.height !== height || result.image.channels !== channels) {
    throw new RangeError("engine returned an invalid result");
  }
  requireMask(result.editMask, width, height);
  for (const v of Object.values(result.metrics)) if (!Number.isFinite(v)) throw new RangeError("non-finite metric");
}

/** Run an engine with the contract's checks; throws RangeError on any breach. */
export function runEngine(engine: LocalEngine, image: ByteImage, landmarks: unknown, masks: Readonly<Record<string, Mask>>,
  params: Params, seed: Seed = 0): EngineResult {
  requireColour(image);
  if (!validSeed(seed)) throw new RangeError("seed must be a 64-bit unsigned integer");
  const original = cloneBytes(image);
  const safeMasks: Record<string, Mask> = {};
  for (const [name, mask] of Object.entries(masks)) safeMasks[name] = cloneMask(requireMask(mask, image.width, image.height));
  const result = engine.run(cloneBytes(image), landmarks, safeMasks, { ...params }, seed);
  checkResult(result, image.width, image.height, image.channels);
  if (!sameBytes(image.data, original.data)) throw new RangeError("engine mutated source image");
  const changed = differenceMask(image, result.image);
  for (let i = 0; i < changed.data.length; i++) {
    if (changed.data[i] > 0 && result.editMask.data[i] <= 0) throw new RangeError("engine edited pixels outside declared editMask");
  }
  return result;
}

function coverage(mask: Mask): number {
  let s = 0;
  for (let i = 0; i < mask.data.length; i++) s += mask.data[i];
  return s / mask.data.length;
}

function numberParam(params: Params, name: string, fallback: number): number {
  const v = params[name] ?? fallback;
  if (typeof v !== "number" || !Number.isFinite(v)) throw new RangeError(`${name} must be a finite number`);
  return v;
}

/** Exposure in stops, through the optional "selection" mask (mirrors ExposureEngine). */
export class ExposureEngine implements LocalEngine {
  readonly version = "1.0.0";

  run(image: ByteImage, _landmarks: unknown, masks: Readonly<Record<string, Mask>>, params: Params): EngineResult {
    const stops = numberParam(params, "stops", 0);
    const mask = masks.selection ?? fullMask(image.width, image.height);
    const output = exposure(image, stops, mask);
    const changed = differenceMask(image, output);
    return { image: output, editMask: changed, metrics: { exposure_stops: stops, coverage: coverage(changed) },
      provenance: "local", pipelineVersion: this.version };
  }
}

/** A solid colour through the required "selection" mask at `strength` (mirrors TintEngine). */
export class TintEngine implements LocalEngine {
  readonly version = "1.0.0";

  run(image: ByteImage, _landmarks: unknown, masks: Readonly<Record<string, Mask>>, params: Params): EngineResult {
    const rgb = params.rgb;
    if (!Array.isArray(rgb) || rgb.length !== 3) throw new RangeError("expected RGB triple");
    const strength = numberParam(params, "strength", 0.5);
    const selection = masks.selection;
    if (!selection) throw new RangeError("selection mask required for tint");
    const output = solid(image, [rgb[0], rgb[1], rgb[2]], selection, strength);
    const changed = differenceMask(image, output);
    return { image: output, editMask: changed, metrics: { strength, coverage: coverage(changed) },
      provenance: "local", pipelineVersion: this.version };
  }
}
