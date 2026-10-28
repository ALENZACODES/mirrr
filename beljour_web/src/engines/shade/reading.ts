/** Geometric cheek patch audit for W6; mirrors shade/reading.py.
 * No skin-pixel colour threshold. Mixed lighting refuses before any cosmetic
 * recommendation; these are estimates, not skin diagnoses. Author: John Khan.
 */
import { ciede2000 } from "../core/colour.js";
import { decode, linearToXyz, xyzToLab, type Vec3 } from "./colourspace.js";

export type AuditReason = "mixed_lighting" | "insufficient_cheek_patches" | null;
export interface PatchAudit {
  usable: boolean;
  reason: AuditReason;
  cheek_distance: number | null;
  zone_sizes: Record<string, number>;
  white_mode: string;
  note: string;
}
export interface PatchImage {
  readonly width: number;
  readonly height: number;
  readonly channels: number;
  readonly data: ArrayLike<number>;
}
export type PatchMasks = Record<"cheek_right" | "cheek_left" | "forehead", ArrayLike<number>>;
export type PatchPixels = [number, number, number][];

export function centralPatchMask(mask: ArrayLike<number>, width: number, height: number, minimum: number): Uint8Array {
  if (mask.length !== width * height || width < 1 || height < 1) throw RangeError("Patch geometry differs from photo.");
  const inside = new Uint8Array(mask.length);
  let kept = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x;
    if (mask[i] < 0.5 || (x > 0 && mask[i - 1] < 0.5) ||
        (x + 1 < width && mask[i + 1] < 0.5) || (y > 0 && mask[i - width] < 0.5) ||
        (y + 1 < height && mask[i + width] < 0.5)) continue;
    inside[i] = 1;
    kept++;
  }
  if (kept >= minimum) return inside;
  for (let i = 0; i < mask.length; i++) inside[i] = mask[i] >= 0.5 ? 1 : 0;
  return inside;
}

export function patchPixels(image: PatchImage, mask: ArrayLike<number>, minimum: number): PatchPixels {
  const inner = centralPatchMask(mask, image.width, image.height, minimum);
  const all: PatchPixels = [];
  const notClipped: PatchPixels = [];
  for (let i = 0; i < inner.length; i++) {
    if (!inner[i]) continue;
    const rgb = [image.data[i * image.channels], image.data[i * image.channels + 1],
      image.data[i * image.channels + 2]] as [number, number, number];
    all.push(rgb);
    if (Math.min(...rgb) > 4 && Math.max(...rgb) < 251) notClipped.push(rgb);
  }
  return notClipped.length >= minimum ? notClipped : all;
}

function median(values: number[]): number {
  const sorted = values.slice().sort((a, b) => a - b);
  const i = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[i] : (sorted[i - 1] + sorted[i]) / 2;
}
function labMedian(pixels: PatchPixels, gains: Vec3): Vec3 {
  const labs = pixels.map((rgb) => xyzToLab(linearToXyz([
    Math.min(1, decode(rgb[0]) * gains[0]),
    Math.min(1, decode(rgb[1]) * gains[1]),
    Math.min(1, decode(rgb[2]) * gains[2]),
  ])));
  return [median(labs.map((l) => l[0])), median(labs.map((l) => l[1])), median(labs.map((l) => l[2]))];
}
export function auditPatches(image: PatchImage, masks: PatchMasks, gains: Vec3, whiteMode: string,
  minimum: number, cheekLimit: number): { samples: Record<string, PatchPixels>; audit: PatchAudit } {
  if (![3, 4].includes(image.channels) || image.data.length !== image.width * image.height * image.channels) {
    throw RangeError("Patch image must be RGB or RGBA.");
  }
  if (!Number.isInteger(minimum) || minimum < 1 || minimum > 100000 ||
      !(cheekLimit > 0 && cheekLimit <= 100)) throw RangeError("Invalid patch audit limits.");
  const samples: Record<string, PatchPixels> = {};
  for (const name of ["cheek_right", "cheek_left", "forehead"] as const) {
    samples[name] = patchPixels(image, masks[name], minimum);
  }
  const sizes = Object.fromEntries(Object.entries(samples).map(([name, pixels]) => [name, pixels.length]));
  let reason: AuditReason = null;
  let distance: number | null = null;
  if (Math.min(samples.cheek_right.length, samples.cheek_left.length) < minimum) {
    reason = "insufficient_cheek_patches";
  } else {
    distance = ciede2000(labMedian(samples.cheek_right, gains), labMedian(samples.cheek_left, gains));
    if (distance > cheekLimit) reason = "mixed_lighting";
  }
  const note = reason === "insufficient_cheek_patches"
    ? "Not enough visible cheek pixels; no shade is suggested."
    : reason === "mixed_lighting" ? "The cheeks have incompatible lighting; retake in even daylight."
    : whiteMode === "neutral" ? "Neutral reference correction applied."
    : whiteMode === "grey_world" ? "Background correction is an estimate, not a neutral reference."
    : "No neutral reference was available; colour is uncorrected.";
  return {samples, audit: {usable: reason === null, reason, cheek_distance: distance,
    zone_sizes: sizes, white_mode: whiteMode, note}};
}
