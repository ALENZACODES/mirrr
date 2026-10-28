/** #54 Red-eye removal: darken the red flash glow in the visible pupils only.
 * Mirrors api/plumb_api/engines/repair/red_eye.py: inside the visible iris of each open eye,
 * a pixel whose red is at least RED_RATIO x (max(green, blue) + 1) and at least MIN_RED is
 * glow; its weight ramps over RED_RAMP and red moves toward max(green, blue). Catchlights,
 * the iris colour, lids and skin keep every byte. Thresholds are ASSUMED. Author: John Khan.
 * Inspiration: MediaPipe Face Landmarker (478-point mesh and iris points); concept only, no code copied.
 */
import type { ByteImage } from "../core/buffer.js";
import { SIDES, type Side, eyeOpen, visibleIris } from "./eye-geometry.js";
import { type FixResult, checkPhoto, copyImage, edited, halfUp, meshPoints, meshRefusal, unchanged } from "./photo-fix.js";

export const RED_RATIO = 1.5, RED_RAMP = 0.5, MIN_RED = 50;
export const LABEL = "Red-eye fix on this photo: only the red flash glow in the pupils is darkened.";

export function redWeight(image: ByteImage, i: number): number {
  const c = image.channels, r = image.data[i * c], other = Math.max(image.data[i * c + 1], image.data[i * c + 2]);
  if (r < MIN_RED) return 0;
  return Math.min(1, Math.max(0, (r / (other + 1) - RED_RATIO) / RED_RAMP));
}

export function fixRedEye(image: ByteImage, landmarks: readonly (readonly number[])[], { strength = 100 } = {}): FixResult {
  checkPhoto(image, strength);
  const pts = meshPoints(landmarks), { width, height } = image;
  const code = meshRefusal(pts, height, width);
  if (code) return unchanged(image, "refused", code, LABEL);
  if (strength === 0) return unchanged(image, "not_applicable", "zero_strength", LABEL);
  const openSides = SIDES.filter((side) => eyeOpen(pts, side));
  if (!openSides.length) return unchanged(image, "not_applicable", "eyes_not_visible", LABEL, { open_eyes: [] });
  const weight = new Float64Array(width * height), redPixels: Partial<Record<Side, number>> = {};
  for (const side of openSides) {
    const region = visibleIris(pts, side, height, width);
    let count = 0;
    for (let i = 0; i < region.length; i++) {
      if (!region[i]) continue;
      const w = redWeight(image, i);
      if (w > 0) count++;
      weight[i] = Math.max(weight[i], w);
    }
    redPixels[side] = count;
  }
  let any = false;
  for (let i = 0; i < weight.length; i++) { weight[i] *= strength / 100; if (weight[i] > 0) any = true; }
  const report = { open_eyes: openSides, red_pixels: redPixels };
  if (!any) return unchanged(image, "not_applicable", "no_red_eye", LABEL, report);
  const out = copyImage(image), c = image.channels;
  for (let i = 0; i < weight.length; i++) {
    if (!(weight[i] > 0)) continue;
    const r = image.data[i * c], other = Math.max(image.data[i * c + 1], image.data[i * c + 2]);
    out.data[i * c] = Math.min(255, Math.max(0, halfUp(r - weight[i] * (r - other))));
  }
  return edited(out, weight, LABEL, report);
}
