/** Default-on temporary pixel guard until Lane H supplies public IdentityLock.
 * This is a pixel difference proxy, not biometric identity recognition.
 * Never treat an absent guard as approval. Author: John Khan.
 */
import { DEFAULT_LOCK, validateLevel } from "./strength.js";

export interface GuardDecision<T> {
  image: T;
  similarity: number;
  blended: boolean;
  lock_level: number;
  engine: string;
  decision: "kept" | "blended" | "original_kept";
}
export interface IdentityGuard<T> {
  guard(before: T, after: T, lockLevel: number): Promise<GuardDecision<T>> | GuardDecision<T>;
}
export function lockThreshold(lockLevel: unknown): number {
  return 0.90 + (Math.round(validateLevel(lockLevel) * 10) - 10) * 0.085 / 40;
}
export function pixelSimilarity(before: Uint8ClampedArray, after: Uint8ClampedArray): number {
  if (before.length !== after.length || before.length === 0) throw RangeError("Identity guard size mismatch.");
  let difference = 0;
  for (let i = 0; i < before.length; i++) difference += Math.abs(before[i] - after[i]);
  return 1 - difference / (before.length * 255);
}
function snapshot(source: HTMLCanvasElement): Uint8ClampedArray {
  const ctx = source.getContext("2d", {willReadFrequently: true});
  if (!ctx || source.width * source.height > 4_500_000) throw Error("Identity guard cannot inspect this image.");
  return ctx.getImageData(0, 0, source.width, source.height).data;
}
function blendCanvas(before: HTMLCanvasElement, after: HTMLCanvasElement, weight: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = before.width;
  canvas.height = before.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw Error("Identity guard cannot blend this image.");
  ctx.drawImage(before, 0, 0);
  ctx.globalAlpha = weight;
  ctx.drawImage(after, 0, 0);
  ctx.globalAlpha = 1;
  return canvas;
}
export class PixelGuard implements IdentityGuard<HTMLCanvasElement> {
  guard(before: HTMLCanvasElement, after: HTMLCanvasElement,
    lockLevel = DEFAULT_LOCK): GuardDecision<HTMLCanvasElement> {
    const level = validateLevel(lockLevel);
    if (before.width !== after.width || before.height !== after.height) throw RangeError("Image dimensions differ.");
    const raw = snapshot(before);
    const edited = snapshot(after);
    const similarity = pixelSimilarity(raw, edited);
    if (similarity >= lockThreshold(level)) {
      return {image: after, similarity, blended: false, lock_level: level, engine: "pixel_proxy", decision: "kept"};
    }
    for (let attempt = 1; attempt <= 16; attempt++) {
      const candidate = blendCanvas(before, after, 0.5 ** attempt);
      const score = pixelSimilarity(raw, snapshot(candidate));
      if (score >= lockThreshold(level)) {
        return {image: candidate, similarity: score, blended: true, lock_level: level,
          engine: "pixel_proxy", decision: "blended"};
      }
    }
    return {image: before, similarity: 1, blended: true, lock_level: level,
      engine: "pixel_proxy", decision: "original_kept"};
  }
}
export async function applyGuard<T>(before: T, after: T, guard: IdentityGuard<T>,
  lockLevel: unknown = DEFAULT_LOCK): Promise<GuardDecision<T>> {
  const level = validateLevel(lockLevel);
  const result = await guard.guard(before, after, level);
  if (!result || !Number.isFinite(result.similarity) || result.similarity < 0 || result.similarity > 1 ||
      result.image === null || result.image === undefined) throw Error("Identity guard did not approve this edit.");
  return result;
}

/** Typed-array identity proxy for engines without a Canvas surface. */
export class PixelArrayGuard implements IdentityGuard<Uint8ClampedArray> {
  guard(before: Uint8ClampedArray, after: Uint8ClampedArray,
    lockLevel = DEFAULT_LOCK): GuardDecision<Uint8ClampedArray> {
    const level = validateLevel(lockLevel);
    const score = pixelSimilarity(before, after);
    if (score >= lockThreshold(level)) {
      return {image: after.slice(), similarity: score, blended: false,
        lock_level: level, engine: "pixel_proxy", decision: "kept"};
    }
    for (let attempt = 1; attempt <= 16; attempt++) {
      const amount = 0.5 ** attempt;
      const bytes = new Uint8ClampedArray(before.length);
      for (let i = 0; i < before.length; i++) {
        bytes[i] = Math.round(before[i] + (after[i] - before[i]) * amount);
      }
      const revised = pixelSimilarity(before, bytes);
      if (revised >= lockThreshold(level)) {
        return {image: bytes, similarity: revised, blended: true,
          lock_level: level, engine: "pixel_proxy", decision: "blended"};
      }
    }
    return {image: before.slice(), similarity: 1, blended: true,
      lock_level: level, engine: "pixel_proxy", decision: "original_kept"};
  }
}
