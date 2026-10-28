/** Background blur from her person area, without a depth model: the background is blurred
 * only from background pixels, then she is laid back through the soft matte. Mirrors
 * api/plumb_api/engines/studio/blur.py. Author: John Khan.
 */
import { changedShare, finish, personMask, photo, radiusFor, strength, weightedBlur, type StudioPhoto, type StudioResult } from "./common.js";
import { compose, foreground, inside, refine } from "./matte.js";

export const BLUR_MAX = 1 / 20;
export const LABEL = "Background blurred from your person area (no depth measurement). You are unchanged.";

export function backgroundBlur(image: StudioPhoto, coarse: ArrayLike<number> | null | undefined, amount = 60): StudioResult {
  const p = photo(image);
  const share = strength(amount);
  const mask = personMask(coarse, p.width, p.height);
  if (share === 0) return { image: Uint8Array.from(image.data), channels: image.channels, label: LABEL, crops: [],
    metrics: { tool: "blur", radius_px: 0, no_op: true } };
  const { alpha, metrics } = refine(p.rgb, mask, p.width, p.height);
  const radius = radiusFor(p.width, p.height, BLUR_MAX * share);
  const back = weightedBlur(p.rgb, alpha.map((a) => 1 - a), p.width, p.height, radius);
  const out = finish(compose(foreground(p.rgb, alpha, p.width, p.height), alpha, back), p.alpha);
  return { image: out.data, channels: out.channels, label: LABEL, crops: [],
    metrics: { ...metrics, tool: "blur", radius_px: radius, person_changed_share: changedShare(p.rgb, out.data, out.channels, inside(alpha)) } };
}
