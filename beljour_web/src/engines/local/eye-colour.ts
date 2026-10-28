/** #42 Eye colour from the face mesh: recolour the visible iris, keep pupil and highlights.
 * Mirrors api/plumb_api/engines/eyes/mesh_colour.py: the visible iris of each open eye from
 * the mesh, recoloured with the existing local iris engine (eyes/iris-colour.ts, our own
 * eight shades) with the pupil protected as a disk of PUPIL_SHARE of the iris radius, on top
 * of that engine's centre and highlight protection. A closed eye is never edited, alpha is
 * kept, no provider is called. PUPIL_SHARE is ASSUMED.
 * Inspiration: MediaPipe Face Landmarker (478-point mesh and iris points); concept only, no code copied.
 * Author: John Khan.
 */
import type { ByteImage } from "../core/buffer.js";
import { irisColour, SHADES } from "../eyes/iris-colour.js";
import { SIMULATION_LABEL as LABEL } from "../eyes/iris-trial.js";
import { SIDES, type Side, eyeOpen, irisDisk, visibleIris } from "./eye-geometry.js";
import { type FixResult, checkPhoto, copyImage, edited, meshPoints, meshRefusal, unchanged } from "./photo-fix.js";

export { LABEL, SHADES };
export const PUPIL_SHARE = 0.45, MIN_IRIS_PIXELS = 12;

export function eyeColour(image: ByteImage, landmarks: readonly (readonly number[])[],
  { shade = "hazel", strength = 65 }: { shade?: string; strength?: number } = {}): FixResult {
  checkPhoto(image, strength);
  if (!Object.hasOwn(SHADES, shade)) throw new RangeError("unknown original iris shade");
  const pts = meshPoints(landmarks), { width, height } = image, n = width * height, c = image.channels;
  const code = meshRefusal(pts, height, width);
  if (code) return unchanged(image, "refused", code, LABEL);
  if (strength === 0) return unchanged(image, "not_applicable", "zero_strength", LABEL);
  let rgb = new Uint8ClampedArray(n * 3);
  for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) rgb[i * 3 + k] = image.data[i * c + k];
  const alpha = new Float64Array(n), sides: Partial<Record<Side, string>> = {};
  for (const side of SIDES) {
    if (!eyeOpen(pts, side)) { sides[side] = "closed"; continue; }
    const iris = visibleIris(pts, side, height, width);
    let count = 0;
    for (const v of iris) count += v;
    if (count < MIN_IRIS_PIXELS) { sides[side] = "too_small"; continue; }
    const disk = irisDisk(pts, side, height, width, PUPIL_SHARE), pupil = new Float64Array(n), mask = new Float64Array(n);
    for (let i = 0; i < n; i++) { mask[i] = iris[i]; pupil[i] = disk[i] & iris[i]; }
    const result = irisColour({ width, height, channels: 3, data: rgb }, mask, shade, strength, pupil);
    rgb = Uint8ClampedArray.from(result.image);
    for (let i = 0; i < n; i++) alpha[i] = Math.max(alpha[i], result.alpha[i]);
    sides[side] = result.changed ? "recoloured" : "no_change";
  }
  const report = { shade, sides };
  if (!alpha.some((v) => v > 0)) return unchanged(image, "not_applicable", "eyes_not_visible", LABEL, report);
  const out = copyImage(image);
  for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) out.data[i * c + k] = rgb[i * 3 + k];
  return edited(out, alpha, LABEL, report);
}
