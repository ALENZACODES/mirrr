/** Shared pieces of the local photo-fix tools: red eye (#54), glasses glare (#55), old-photo
 * scratches and dust (#51), object removal (#59), the ID crop guide (#64) and eye colour from
 * the mesh (#42). Mirrors api/plumb_api/engines/repair/photo_fix.py: one result record, the
 * same photo checks and mesh refusals, and a half-up byte blend that keeps alpha.
 * Everything runs on this device; no model is used. Author: John Khan.
 * Inspiration: MediaPipe Face Landmarker (478-point mesh and iris points); concept only, no code copied.
 */
import type { ByteImage } from "../core/buffer.js";
import { MESSAGES as MESH_MESSAGES, checkPhoto as checkTouchUpPhoto, meshPoints, meshRefusal, type P2 } from "../skin/local-zones.js";

export type Status = "edited" | "not_applicable" | "refused";
export const VERSION = "photo-fix/1";
const REFUSALS = ["wrong_shape", "not_finite", "duplicate_points", "face_too_small", "eyes_coincide", "no_face_width",
  "no_face_length", "zero_area_face", "outside_frame", "zone_too_small"] as const;

export const MESSAGES: Record<string, string> = {
  ...Object.fromEntries(REFUSALS.map((code) => [code, MESH_MESSAGES[code]])),
  edited: "Local photo fix made.",
  zero_strength: "Strength is zero, so the photo is unchanged.",
  eyes_not_visible: "Neither eye is open and visible enough in this photo.",
  no_red_eye: "No red pupil glow was found in the visible eyes.",
  no_glare: "No glasses glare was found beside the eyes.",
  no_scratches: "No scratches or dust specks were found, and the photo needed no tone or noise repair.",
  nothing_marked: "Nothing is marked for removal.",
  area_too_large: "The marked area is too large to fill from the rest of the photo.",
  covers_face: "The marked area covers the face, so it was not removed.",
  not_enough_margin: "The photo has too little space around the head for this crop.",
  unknown_preset: "That crop size is not one of the offered guides.",
};

export interface FixResult {
  image: ByteImage; alpha: Float64Array; status: Status; reasonCode: string; message: string;
  label: string; report: Record<string, unknown>;
}

export { meshPoints, meshRefusal, type P2 };

export function checkPhoto(image: ByteImage, strength: number): void {
  try { checkTouchUpPhoto(image, strength); } catch (error) {
    throw new RangeError(String((error as Error).message).replace("skin touch-up", "photo fix"));
  }
}

export function copyImage(image: ByteImage): ByteImage {
  return { width: image.width, height: image.height, channels: image.channels, data: Uint8ClampedArray.from(image.data) };
}

export function unchanged(image: ByteImage, status: Status, code: string, label: string,
  report: Record<string, unknown> = {}): FixResult {
  return { image: copyImage(image), alpha: new Float64Array(image.width * image.height), status, reasonCode: code,
    message: MESSAGES[code], label, report: { ...report } };
}

export function edited(image: ByteImage, alpha: Float64Array, label: string, report: Record<string, unknown>): FixResult {
  return { image, alpha, status: "edited", reasonCode: "edited", message: MESSAGES.edited, label, report };
}

export const halfUp = (x: number): number => Math.floor(x + 0.5);
const byte = (x: number): number => Math.min(255, Math.max(0, halfUp(x)));

/** original + weight * (edited - original) on the colour channels; alpha is kept. */
export function blendBytes(original: ByteImage, edit: ByteImage, weight: Float64Array): ByteImage {
  const out = copyImage(original), c = original.channels;
  for (let i = 0; i < weight.length; i++) {
    const w = weight[i];
    for (let k = 0; k < 3; k++) {
      const a = original.data[i * c + k], b = edit.data[i * c + k];
      out.data[i * c + k] = byte(a + w * (b - a));
    }
  }
  return out;
}
