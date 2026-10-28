/** Optional adoption seam for the existing upscale renderer, not a new engine.
 * Face-detail work may only proceed when the identity provider is available.
 */
import { guardFacePixels, type FaceIdentityGuard, type GuardedPixels } from "../../pro/identity.js";
import { legacyAmount, validateLevel } from "../../pro/strength.js";

export type DetailRenderer = (source: Uint8ClampedArray, amount: number) => Uint8ClampedArray;

export async function upscaleFaceDetail(before: Uint8ClampedArray, width: number, height: number,
  faceMask: Uint8Array, render: DetailRenderer, guard?: FaceIdentityGuard,
  detailLevel = 3.0, lockLevel = 5.0): Promise<GuardedPixels> {
  const checked = validateLevel(detailLevel);
  if (faceMask.length !== width * height) throw new RangeError("Face mask dimensions differ");
  if (!guard) throw new Error("Identity lock is required for upscale face detail");
  const result = render(before.slice(), legacyAmount(checked));
  return guardFacePixels(before, result, width, height, faceMask, guard, lockLevel);
}
