/** Explicit-mask protected posture render: the marked head is restored byte for byte.
 * Mirrors api/plumb_api/engines/posture/protected.py. The head mask is the user's own
 * marking; nothing here detects heads or verifies identity. The existing default-on
 * identity guard still runs for face-adjacent fixes. Photo simulation only, not medical advice.
 * Author: John Khan.
 */
import { type ByteImage, type Mask } from "../engines/core/buffer.js";
import { type Controls, type FixName, type PosturePlan, DEFAULT_POSTURE_LEVEL, DEFAULT_POSTURE_LOCK,
  SIMULATION_LABEL, checkedPostureLevel, postureLevelPlan } from "../engines/local/posture.js";
import { type FaceIdentityGuard, type GuardedPostureResult, guardedPostureRender } from "./posture-session.js";

export const MAX_POSTURE_SOURCE_PIXELS = 12_000_000;
/** ASSUMED: a head marking over a quarter of the frame is not a head in a full-body photo. */
export const MAX_HEAD_SHARE = 0.25;
export const MASK_LEVEL = 0.5;

export type ProtectedRefusalCode = "invalid_source_image" | "source_image_too_large" | "head_mask_required"
  | "invalid_head_mask" | "empty_head_mask" | "oversized_head_mask";

export class ProtectedRenderRefused extends RangeError {
  constructor(readonly code: ProtectedRefusalCode) {
    super(code);
    this.name = "ProtectedRenderRefused";
  }
}

export interface ProtectedPostureResult {
  image: ByteImage;
  guarded: GuardedPostureResult;
  plan: PosturePlan;
  fix: FixName;
  level: number;
  lockLevel: number;
  headPixels: number;
  headPixelsRestored: number;
  label: string;
}

export function checkedSource(image: ByteImage): ByteImage {
  const { width, height, channels, data } = image ?? ({} as ByteImage);
  if (!(Number.isInteger(width) && Number.isInteger(height) && width >= 8 && height >= 8 &&
      width <= 16384 && height <= 16384) || (channels !== 3 && channels !== 4) ||
      !(data instanceof Uint8Array || data instanceof Uint8ClampedArray) || data.length !== width * height * channels) {
    throw new ProtectedRenderRefused("invalid_source_image");
  }
  if (width * height > MAX_POSTURE_SOURCE_PIXELS) throw new ProtectedRenderRefused("source_image_too_large");
  return image;
}

/** One byte per pixel: 1 where the user's head marking covers the pixel. */
export function checkedHeadMask(head: Mask | null | undefined, width: number, height: number): Uint8Array {
  if (head === null || head === undefined) throw new ProtectedRenderRefused("head_mask_required");
  if (head.width !== width || head.height !== height || head.channels !== 1 ||
      !(head.data instanceof Float32Array || head.data instanceof Float64Array) ||
      head.data.length !== width * height) {
    throw new ProtectedRenderRefused("invalid_head_mask");
  }
  const covered = new Uint8Array(width * height);
  let count = 0;
  for (let i = 0; i < covered.length; i++) {
    const value = head.data[i];
    if (!(Number.isFinite(value) && value >= 0 && value <= 1)) throw new ProtectedRenderRefused("invalid_head_mask");
    if (value >= MASK_LEVEL) { covered[i] = 1; count++; }
  }
  if (count === 0) throw new ProtectedRenderRefused("empty_head_mask");
  if (count > MAX_HEAD_SHARE * covered.length) throw new ProtectedRenderRefused("oversized_head_mask");
  return covered;
}

export function copyByteImage(image: ByteImage): ByteImage {
  return { ...image, data: new Uint8Array(image.data) };
}

/** Render one fix, then copy every marked head pixel back from an untouched source copy. */
export function renderProtectedPosture(source: ByteImage, person: Mask, head: Mask | null, controls: Controls,
  fix: FixName, level = DEFAULT_POSTURE_LEVEL, guard: FaceIdentityGuard | null = null,
  lockLevel = DEFAULT_POSTURE_LOCK): ProtectedPostureResult {
  const original = copyByteImage(checkedSource(source));
  const covered = checkedHeadMask(head, original.width, original.height);
  const value = checkedPostureLevel(level);
  const guarded = guardedPostureRender(copyByteImage(original), person, controls, fix, value, guard, lockLevel);
  const output = copyByteImage(guarded.image);
  const channels = original.channels;
  let restored = 0;
  for (let p = 0; p < covered.length; p++) {
    if (!covered[p]) continue;
    let differs = false;
    for (let c = 0, i = p * channels; c < channels; c++, i++) {
      if (output.data[i] !== original.data[i]) { differs = true; output.data[i] = original.data[i]; }
    }
    if (differs) restored++;
  }
  let count = 0;
  for (const bit of covered) count += bit;
  return { image: output, guarded, plan: postureLevelPlan(controls, fix, value), fix, level: value,
    lockLevel: guarded.lockLevel, headPixels: count, headPixelsRestored: restored, label: SIMULATION_LABEL };
}
