/** Audited export of an HD 1080 or 4K tier release.
 * The audit must be complete and must agree with an independent re-plan of
 * the source size: the exact tier size, the four stages in order, no identity
 * mismatch, no chroma shift, and counts and levels inside their bounds. A
 * preview or diagnostic result, a relabelled tier, or an exaggerated audit is
 * refused rather than exported. 4K results are reported as experimental.
 * Export uses the existing encoder (Simulation label on by default) and the
 * metadata scrub. Author: John Khan.
 */
import { canvasEncoder, type CanvasEncoder } from "../../save/export.js";
import { exportColourSafe, type ColourExport, type ColourExportSettings } from "./colour-export.js";
import { planAspectQuality } from "./quality-aspect.js";
import { STAGES, TIER_LABEL, type TierResult } from "./quality-pipeline.js";
import { MAX_TEXTURE_DELTA } from "./quality-stages.js";

const KEYS = [
  "chromaShift", "denoiseLevel", "detailLevel", "experimental", "fullyLockedPixels", "generator", "height",
  "identityMismatches", "label", "lockLevel", "maxTextureDelta", "noPerson", "phase", "protectedPixels",
  "schema", "sourceHeight", "sourceWidth", "stages", "tier", "width",
].join(",");

export interface TierExport extends ColourExport {
  readonly tier: TierResult["audit"]["tier"];
  readonly experimental: boolean;
}

function level(value: unknown): boolean {
  return typeof value === "number" && value >= 1 && value <= 5 && Math.abs(value * 10 - Math.round(value * 10)) < 1e-8;
}

function count(value: unknown, limit: number): boolean {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= limit;
}

export function checkTierAudit(result: TierResult): void {
  const audit = result?.audit as unknown as Record<string, unknown> | undefined;
  if (!audit || Object.keys(audit).sort().join(",") !== KEYS || audit.schema !== "beljour-quality-tier-audit/1") {
    throw new RangeError("Export needs a complete tier audit");
  }
  if (audit.label !== TIER_LABEL || audit.generator !== "classical-local") {
    throw new RangeError("Export needs the Quality Generator label");
  }
  if (audit.phase !== "release") throw new RangeError("Only a full tier release can be exported");
  const plan = planAspectQuality(audit.sourceWidth as number, audit.sourceHeight as number,
    audit.tier as TierResult["audit"]["tier"]);
  const { image } = result;
  if (audit.width !== plan.width || audit.height !== plan.height || image.width !== plan.width ||
      image.height !== plan.height || image.data.length !== plan.width * plan.height * 4 ||
      audit.experimental !== plan.experimental) {
    throw new RangeError("The image does not match its tier");
  }
  if (!Array.isArray(audit.stages) || audit.stages.join(",") !== STAGES.join(",")) {
    throw new RangeError("The audit does not list the required stages");
  }
  const pixels = plan.width * plan.height;
  if (audit.identityMismatches !== 0 || audit.chromaShift !== 0 ||
      !count(audit.protectedPixels, pixels) || !count(audit.fullyLockedPixels, audit.protectedPixels as number) ||
      !count(audit.maxTextureDelta, MAX_TEXTURE_DELTA)) {
    throw new RangeError("The audit claims values outside what the pipeline can produce");
  }
  if (!level(audit.detailLevel) || !level(audit.denoiseLevel) || !level(audit.lockLevel) ||
      typeof audit.noPerson !== "boolean" || (audit.noPerson && audit.protectedPixels !== 0)) {
    throw new RangeError("The audit has invalid levels or face evidence");
  }
}

export async function exportTierRelease(result: TierResult, settings: ColourExportSettings = {},
  encoder: CanvasEncoder = canvasEncoder()): Promise<TierExport> {
  checkTierAudit(result);
  const { tier, experimental } = result.audit;
  const file = await exportColourSafe(result.image, tier === "uhd4k" ? "BELJOUR_4K_experimental" : "BELJOUR_HD1080",
    settings, encoder);
  return { ...file, tier, experimental };
}
