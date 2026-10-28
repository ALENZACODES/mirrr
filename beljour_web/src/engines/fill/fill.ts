/**
 * E07 fill wrapper and engine (mirrors api/plumb_api/engines/fill/fill.py).
 *
 * fill(image, mask, method): "biharmonic" (default, smooth strips and blemishes),
 * "fast-marching" (quick) or "patchmatch" (textured backgrounds). The hole is
 * mask >= 0.5, optionally grown by `grow` px. Smooth methods run in linear light and only
 * hole pixels change; alpha is kept.
 *
 * R7 (E07 part 2): `fillAny` adds the learned "mi-gan" method (onnx/migan.ts). It runs
 * only when its LearnedFill says ready (registry-approved model and an injected ONNX
 * runtime); otherwise, or if the model fails, it falls back to `fallback` (biharmonic by
 * default) and says why in `fallbackReason`.
 *
 * Author: John Khan.
 */
import { type ByteImage, type Mask, decode, encodeByte, floatImage, requireColour, requireMask } from "../core/buffer.js";
import type { EngineResult, LocalEngine, Params, Seed } from "../core/engine.js";
import { dilate } from "../core/mask.js";
import { biharmonic } from "./biharmonic.js";
import { fastMarching } from "./fmm.js";
import { patchMatch } from "./patchmatch.js";

export const METHODS = ["biharmonic", "fast-marching", "patchmatch"] as const;
export type FillMethod = typeof METHODS[number];
export const VERSION = "fill-1.0.0";
export const MAX_GROW = 64;

export interface FillOptions { grow?: number; radius?: number; gradient?: boolean; patchRadius?: number; iterations?: number; seed?: number }
export const LEARNED_METHODS = ["mi-gan"] as const;
export type LearnedMethod = typeof LEARNED_METHODS[number];
export type AnyFillMethod = FillMethod | LearnedMethod;
export interface FillOutcome { image: ByteImage; hole: Mask; method: AnyFillMethod; holePixels: number; details: Record<string, number> }

/** A learned fill (MI-GAN): status() never touches the network; fill() gets the grown hole. */
export interface LearnedFill {
  readonly method: LearnedMethod;
  status(): { ready: boolean; reason: string };
  fill(img: ByteImage, hole: Mask): Promise<FillOutcome>;
}
export interface AnyFillOptions extends FillOptions { learned?: LearnedFill | null; fallback?: FillMethod }
export interface AnyFillOutcome extends FillOutcome { requested: AnyFillMethod; fallbackReason: string | null }

export function grownHole(mask: Mask, width: number, height: number, grow: number): Mask {
  if (!(Number.isFinite(grow) && grow >= 0 && grow <= MAX_GROW)) throw new RangeError(`grow must be 0..${MAX_GROW} px`);
  requireMask(mask, width, height);
  const hole = floatImage(width, height, 1);
  let any = false;
  for (let i = 0; i < hole.data.length; i++) if (mask.data[i] >= 0.5) { hole.data[i] = 1; any = true; }
  return grow > 0 && any ? dilate(hole, grow) : hole;
}

export function fill(img: ByteImage, mask: Mask, method: FillMethod = "biharmonic",
  { grow = 0, radius = 5, gradient = true, patchRadius = 3, iterations = 5, seed = 1 }: FillOptions = {}): FillOutcome {
  requireColour(img);
  if (!METHODS.includes(method)) throw new RangeError(`method must be one of ${METHODS.join(", ")}`);
  const hole = grownHole(mask, img.width, img.height, grow);
  let count = 0;
  for (const v of hole.data) if (v > 0) count++;
  if (!count) return { image: { ...img, data: new Uint8Array(img.data) }, hole, method, holePixels: 0, details: {} };
  if (method === "patchmatch") {
    const pm = patchMatch(img, hole, { patchRadius, iterations, seed });
    return { image: pm.image, hole, method, holePixels: count,
             details: { mean_distance: pm.meanDistance.length ? pm.meanDistance[pm.meanDistance.length - 1] : 0, targets: pm.targets.length } };
  }
  const linear = decode(img);
  let filled, details: Record<string, number>;
  if (method === "fast-marching") {
    filled = fastMarching(linear, hole, { radius, gradient }).image;
    details = { radius };
  } else {
    const bh = biharmonic(linear, hole);
    filled = bh.image;
    details = { iterations: Math.max(...bh.iterations), residual: Math.max(...bh.residual) };
  }
  const out: ByteImage = { width: img.width, height: img.height, channels: img.channels, data: new Uint8Array(img.data) };
  for (let i = 0; i < hole.data.length; i++) {
    if (!(hole.data[i] > 0)) continue;
    for (let c = 0; c < 3; c++) out.data[i * img.channels + c] = encodeByte(filled.data[i * 3 + c]);
  }
  return { image: out, hole, method, holePixels: count, details };
}

/** Any fill method, including the learned one; learned failures fall back to the R5 fill. */
export async function fillAny(img: ByteImage, mask: Mask, method: AnyFillMethod = "biharmonic", options: AnyFillOptions = {}): Promise<AnyFillOutcome> {
  requireColour(img);
  if (method !== "mi-gan") return { ...fill(img, mask, method, options), requested: method, fallbackReason: null };
  const fallback = options.fallback ?? "biharmonic";
  if (!METHODS.includes(fallback)) throw new RangeError(`fallback must be one of ${METHODS.join(", ")}`);
  const learned = options.learned ?? null;
  const state = learned ? learned.status() : { ready: false, reason: "no learned fill was configured" };
  let reason = state.reason;
  if (learned && state.ready) {
    try {
      const out = await learned.fill(img, grownHole(mask, img.width, img.height, options.grow ?? 0));
      return { ...out, requested: method, fallbackReason: null };
    } catch (error) {
      reason = `learned fill failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
  const out = fill(img, mask, fallback, options);
  return { ...out, details: { ...out.details, fallback: 1 }, requested: method, fallbackReason: reason };
}

function num(params: Params, name: string, fallback: number): number {
  const v = params[name] ?? fallback;
  if (typeof v !== "number" || !Number.isFinite(v)) throw new RangeError(`${name} must be a finite number`);
  return v;
}

export class FillEngine implements LocalEngine {
  readonly version = VERSION;

  run(image: ByteImage, _landmarks: unknown, masks: Readonly<Record<string, Mask>>, params: Params, seed: Seed): EngineResult {
    const name = String(params.mask ?? "hole");
    const mask = masks[name];
    if (!mask) throw new RangeError(`mask ${name} was not given`);
    const seed32 = typeof seed === "bigint" ? Number(seed % 4294967296n) : seed % 4294967296;
    const outcome = fill(image, mask, (params.method ?? "biharmonic") as FillMethod, {
      grow: num(params, "grow", 0), radius: num(params, "radius", 5), gradient: params.gradient !== false,
      patchRadius: num(params, "patch_radius", 3), iterations: num(params, "iterations", 5), seed: seed32,
    });
    return { image: outcome.image, editMask: outcome.hole, metrics: { hole_pixels: outcome.holePixels, ...outcome.details },
             provenance: "local", pipelineVersion: VERSION };
  }
}
