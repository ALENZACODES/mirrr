/** Local teeth, beard and grey tools as shell layer kinds. "teeth" (#31) whitens visible
 * teeth with a natural cap; "shave" (#24) removes stubble or a short beard; both from the
 * recorded face points. "grey" (#20, #102) runs the Grey Transition stages (cover, blend,
 * silver) inside the hair she marked; hair is never guessed. When an engine refuses (mouth closed, no teeth visible, a full
 * beard, no beard, a mesh no tool should edit) the layer leaves the photo unchanged and
 * says why, so a saved look or a stack never fails because of this step.
 * Author: John Khan.
 */
import type { ByteImage } from "../../engines/core/buffer.js";
import { greyPreview, isGreyRefusal, STAGES, type Stage } from "../../engines/haircolour/grey.js";
import { isShaveRefusal, removeBeard } from "../../engines/shave/remove.js";
import { isTeethRefusal, whitenTeeth } from "../../engines/teeth/natural.js";
import type { LayerResult, PhotoSource, ShellLayer } from "./types.js";

function unchanged(image: ByteImage, message: string, label: string, metrics: LayerResult["metrics"]): LayerResult {
  return { image: { ...image, data: Uint8ClampedArray.from(image.data) }, label: `${message} ${label}`, metrics };
}

export function greyStage(layer: ShellLayer): Stage {
  const value = layer.parameters.stage ?? "cover";
  if (!(STAGES as readonly unknown[]).includes(value)) throw new RangeError("Unknown Grey Transition stage");
  return value as Stage;
}

export function applyHairBeardTeethLayer(image: ByteImage, source: PhotoSource, layer: ShellLayer): LayerResult | null {
  if (layer.kind === "grey") {
    if (!source.hair) throw new RangeError("Mark the hair area before a Grey Transition preview.");
    const stage = greyStage(layer);
    const result = greyPreview(image, source.hair.data, { stage, strength: layer.strength });
    if (isGreyRefusal(result)) return unchanged(image, result.message, "Grey Transition preview.",
      { status: "refused", reason_code: result.code, stage });
    return { image: { ...image, data: result.image }, label: result.label,
      metrics: { ...result.metrics, status: "edited", mask_source: "marked hair" } };
  }
  if (layer.kind !== "teeth" && layer.kind !== "shave") return null;
  if (!source.face || source.face.length !== 478) throw new RangeError("This tool needs 478 recorded face points.");
  if (layer.kind === "teeth") {
    const result = whitenTeeth(image, source.face, layer.strength);
    if (isTeethRefusal(result)) return unchanged(image, result.message, "Teeth colour simulation, not dental treatment.",
      { status: "refused", reason_code: result.code });
    return { image: { ...image, data: result.image }, label: result.label,
      metrics: { ...result.metrics, status: "edited", mask_source: "face points" } };
  }
  const result = removeBeard(image, source.face, layer.strength);
  if (isShaveRefusal(result)) return unchanged(image, result.message, "Clean-shave visual estimate.",
    { status: "refused", reason_code: result.code });
  return { image: { ...image, data: result.image }, label: result.label,
    metrics: { ...result.metrics, status: "edited", mask_source: "face points" } };
}
