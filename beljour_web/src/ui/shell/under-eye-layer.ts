/** Under-eye brightening (#28) as a shell layer kind, "under-eye", so Bad Day Rescue and the
 * editor can run it. The engine (web/src/engines/skin/under-eye.ts) moves a measured dark
 * circle toward her own cheek colour and never past it; marks and texture keep their contrast.
 * The face points come from the photo source, never from a guessed mesh. When the engine
 * finds no dark circle, or refuses a zone it cannot see, the layer leaves the photo unchanged
 * and says why, so one Rescue tap never fails because of this step.
 * Author: John Khan.
 */
import type { ByteImage } from "../../engines/core/buffer.js";
import { brightenUnderEyes } from "../../engines/skin/under-eye.js";
import type { LayerResult, ParamValue, PhotoSource, ShellLayer } from "./types.js";

/** Settings a new under-eye layer starts with: dark circles and eye-bag shadow together. */
export const UNDER_EYE_DEFAULTS: Readonly<Record<string, ParamValue>> = Object.freeze({ include_bags: true });

export function applyUnderEyeLayer(image: ByteImage, source: PhotoSource, layer: ShellLayer): LayerResult | null {
  if (layer.kind !== "under-eye") return null;
  if (!source.face || source.face.length !== 478) throw new RangeError("Under-eye brightening needs 478 recorded face points.");
  const includeBags = layer.parameters.include_bags !== false;
  const result = brightenUnderEyes(image, source.face, { strength: layer.strength, includeBags });
  const metrics = { status: result.status, reason_code: result.reasonCode, include_bags: includeBags, mask_source: "face points" };
  if (result.status === "edited") return { image: result.image, label: result.label, metrics };
  return { image: { ...image, data: Uint8ClampedArray.from(image.data) }, label: `${result.message} ${result.label}`, metrics };
}
