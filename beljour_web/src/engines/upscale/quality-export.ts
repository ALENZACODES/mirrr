/** Audited local export of a Quality Generator release.
 * The render's audit must describe exactly the pixels being exported: a release
 * (never a preview), an enabled tier frame size, the generator label and
 * consistent geometry and levels. A missing, edited or mismatched audit is
 * refused. Export then uses the pre-encoder colour step, the existing local
 * encoder with the Simulation label on by default, and the metadata scrub.
 * Author: John Khan.
 */
import { canvasEncoder, type CanvasEncoder } from "../../save/export.js";
import { exportColourSafe, type ColourExport, type ColourExportSettings } from "./colour-export.js";
import { QUALITY_LABEL, type QualityRender } from "./quality-generator.js";
import { TIER_FRAMES, TIER_LABELS, type QualityTierName } from "./quality-tier.js";

const AUDIT_KEYS = [
  "contentHeight", "contentWidth", "detailLevel", "generator", "height", "label", "lockLevel",
  "maxDetailDelta", "noPerson", "offsetX", "offsetY", "protectedPixels", "release", "schema",
  "fullyLockedPixels", "tier", "width",
].sort().join(",");

function isLevel(value: unknown): boolean {
  return typeof value === "number" && value >= 1 && value <= 5 && Math.abs(value * 10 - Math.round(value * 10)) < 1e-8;
}

/** Throws unless the audit is complete, consistent with the image and a release. */
export function checkQualityAudit(render: QualityRender, allowedTiers: readonly QualityTierName[] = ["hd1080"]): void {
  const audit = render?.audit as unknown as Record<string, unknown> | undefined;
  if (!audit || Object.keys(audit).sort().join(",") !== AUDIT_KEYS || audit.schema !== "beljour-quality-audit/1") {
    throw new RangeError("Export needs a complete Quality Generator audit");
  }
  if (audit.label !== QUALITY_LABEL || audit.generator !== "classical-local") {
    throw new RangeError("Export needs the Quality Generator label");
  }
  if (audit.release !== true) throw new RangeError("Only a full release can be exported, not a preview");
  const tier = audit.tier as QualityTierName;
  if (!allowedTiers.includes(tier) || !(tier in TIER_FRAMES)) throw new RangeError("This output tier cannot be exported");
  const frames = Object.values(TIER_FRAMES[tier]);
  const { image } = render;
  if (!frames.some(frame => frame.width === audit.width && frame.height === audit.height) ||
      image.width !== audit.width || image.height !== audit.height ||
      image.data.length !== image.width * image.height * 4) {
    throw new RangeError(`The image is not a ${TIER_LABELS[tier]} frame described by its audit`);
  }
  const numbers = ["contentWidth", "contentHeight", "offsetX", "offsetY", "protectedPixels",
    "fullyLockedPixels", "maxDetailDelta"].map(key => audit[key]);
  if (numbers.some(value => !Number.isInteger(value) || (value as number) < 0)) {
    throw new RangeError("The audit has invalid counts");
  }
  const [contentWidth, contentHeight, offsetX, offsetY, protectedPixels, fullyLocked] = numbers as number[];
  if (contentWidth! + offsetX! > image.width || contentHeight! + offsetY! > image.height ||
      protectedPixels! > contentWidth! * contentHeight! || fullyLocked! > protectedPixels!) {
    throw new RangeError("The audit does not fit the image");
  }
  if (!isLevel(audit.detailLevel) || !isLevel(audit.lockLevel) || typeof audit.noPerson !== "boolean") {
    throw new RangeError("The audit has invalid levels");
  }
  if (audit.noPerson && protectedPixels !== 0) throw new RangeError("A no-person export cannot hold face pixels");
}

export async function exportQualityRender(render: QualityRender, name: string,
  settings: ColourExportSettings = {}, encoder: CanvasEncoder = canvasEncoder()): Promise<ColourExport> {
  checkQualityAudit(render);
  return exportColourSafe(render.image, name, settings, encoder);
}
