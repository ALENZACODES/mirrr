/** Ordered HD 1080 / 4K Quality Generator pipeline with an audit of what ran.
 * denoise -> resize -> source texture transport -> identity lock and check.
 * A preview runs on the aspect plan scaled to a 640 long edge; a release runs
 * at exactly the tier size. A phase that does not match its plan is refused.
 * The job can be cancelled between stages with an AbortSignal, and every
 * temporary copy of photo pixels is wiped on success and on failure. A face
 * selection (or an explicit no-person declaration) is required; a full-lock
 * pixel that differs from the independently resized original stops the job.
 * Author: John Khan.
 */
import type { RgbaRaster } from "./colour-export.js";
import { LONG_EDGE, type AspectPlan } from "./quality-aspect.js";
import { defaultResizer, resizeCoverage, type Resizer } from "./quality-generator.js";
import { lockToIdentity, verifyIdentityLock } from "./quality-identity.js";
import { checkedRaster, copyRaster, throwIfAborted, wipe, type OwnedRaster } from "./quality-raster.js";
import { denoiseFlat, resamplePlane, resizeStage, sourceResidual, transportTexture } from "./quality-stages.js";
import { checkedSelection, type FaceSelection } from "./safe.js";
import { validateLevel } from "../../pro/strength.js";

export const TIER_LABEL = "BELJOUR Quality Generator HD/4K: local denoise, resize and source texture. " +
  "Marked face pixels match the independently resized original at 5.0; a pixel guard, not identity verification.";
export const STAGES = ["denoise", "resize", "texture", "identity"] as const;
export const PREVIEW_EDGE = 640;

/** "diagnostic" is only for drawn-chart comparisons at custom sizes; it can never be exported. */
export type QualityPhase = "preview" | "release" | "diagnostic";

export interface TierLevels {
  readonly detailLevel: number;
  readonly denoiseLevel: number;
  readonly lockLevel: number;
}

export interface TierAudit {
  readonly schema: "beljour-quality-tier-audit/1";
  readonly tier: AspectPlan["tier"];
  readonly phase: QualityPhase;
  readonly experimental: boolean;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  readonly width: number;
  readonly height: number;
  readonly detailLevel: number;
  readonly denoiseLevel: number;
  readonly lockLevel: number;
  readonly noPerson: boolean;
  readonly stages: readonly string[];
  readonly protectedPixels: number;
  readonly fullyLockedPixels: number;
  readonly identityMismatches: number;
  readonly maxTextureDelta: number;
  readonly chromaShift: number;
  readonly generator: "classical-local";
  readonly label: string;
}

export interface TierResult {
  readonly image: OwnedRaster;
  readonly audit: TierAudit;
}

export interface PipelineOptions {
  readonly resizer?: Resizer;
  readonly phase?: QualityPhase;
  readonly signal?: AbortSignal;
}

export function checkedLevels(levels: TierLevels): TierLevels {
  return {
    detailLevel: validateLevel(levels?.detailLevel),
    denoiseLevel: validateLevel(levels?.denoiseLevel),
    lockLevel: validateLevel(levels?.lockLevel),
  };
}

export function checkedPhase(plan: AspectPlan, phase: QualityPhase): void {
  const long = Math.max(plan.width, plan.height);
  if (phase === "release" && long !== LONG_EDGE[plan.tier]) {
    throw new RangeError("A release must render the full tier size");
  }
  if (phase === "preview" && long > PREVIEW_EDGE) throw new RangeError("A preview must stay within 640 pixels");
  if (phase !== "release" && phase !== "preview" && phase !== "diagnostic") {
    throw new RangeError("Unknown render phase");
  }
}

export async function runQualityPipeline(source: RgbaRaster, selection: FaceSelection, plan: AspectPlan,
  levels: TierLevels, options: PipelineOptions = {}): Promise<TierResult> {
  checkedRaster(source);
  const phase = options.phase ?? "release";
  checkedPhase(plan, phase);
  if (source.width !== plan.sourceWidth || source.height !== plan.sourceHeight) {
    throw new RangeError("The plan was made for another photo size");
  }
  const mask = checkedSelection(selection, source.width, source.height);
  const checked = checkedLevels(levels);
  const resizer = options.resizer ?? defaultResizer();
  const { signal } = options;
  const { width, height } = plan;
  const owned: (OwnedRaster | null)[] = [];
  const planes: Float32Array[] = [];
  try {
    throwIfAborted(signal);
    const working = copyRaster(source);
    owned.push(working);
    const denoised = denoiseFlat(working, checked.denoiseLevel);
    owned.push(denoised);
    wipe(working);
    throwIfAborted(signal);
    const resized = await resizeStage(denoised, width, height, resizer);
    owned.push({ width, height, data: resized });
    throwIfAborted(signal);
    const residual = sourceResidual(denoised);
    planes.push(residual);
    const upsampled = resamplePlane(residual, denoised.width, denoised.height, width, height);
    planes.push(upsampled);
    const textured = transportTexture(resized, width, height, upsampled, checked.detailLevel);
    owned.push({ width, height, data: textured.pixels });
    throwIfAborted(signal);
    const original = copyRaster(source);
    owned.push(original);
    const identity = await resizeStage(original, width, height, resizer);
    owned.push({ width, height, data: identity });
    throwIfAborted(signal);
    const coverage = resizeCoverage(mask, source.width, source.height, width, height);
    const image = lockToIdentity(textured.pixels, identity, coverage, checked.lockLevel);
    const check = verifyIdentityLock(image, identity, coverage, checked.lockLevel);
    if (check.mismatches !== 0) {
      image.fill(0);
      throw new RangeError("Face pixels differ from the resized original; the result was discarded");
    }
    return {
      image: { width, height, data: image },
      audit: Object.freeze({
        schema: "beljour-quality-tier-audit/1", tier: plan.tier, phase, experimental: plan.experimental,
        sourceWidth: source.width, sourceHeight: source.height, width, height, ...checked,
        noPerson: selection.noFace === true, stages: [...STAGES],
        protectedPixels: check.protectedPixels, fullyLockedPixels: check.fullyLockedPixels,
        identityMismatches: 0, maxTextureDelta: textured.maxDelta, chromaShift: textured.chromaShift,
        generator: "classical-local", label: TIER_LABEL,
      }),
    };
  } finally {
    wipe(...owned);
    for (const plane of planes) plane.fill(0);
  }
}
