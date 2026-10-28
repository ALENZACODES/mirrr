/** Numeric invariant inspection of a guarded browser upscale result.
 * Mirrors api/plumb_api/engines/upscale/safe_quality.py: the two layers are
 * re-rendered with the result's own tile plan, then identity-lock, outside,
 * alpha, coverage and evidence-label invariants are counted. Aggregate counts
 * only; holding these invariants is never a real-face or release PASS.
 * Author: John Khan.
 */
import type { Photo } from "./index.js";
import { legacyAmount } from "../../pro/strength.js";
import {
  SAFE_LABEL, blendValue, checkedPhoto, checkedSelection, forEachCorePixel,
  referenceShareTenths, renderLayers, type FaceSelection, type SafeUpscaleResult,
} from "./safe.js";
import { admit, allocationTiles } from "./safe-tile-policy.js";

export interface SafeInspection {
  readonly schema: "beljour-safe-upscale-inspection/1";
  readonly outputPixels: number;
  readonly faceOutputPixels: number;
  readonly fullLockPixels: number;
  readonly fullLockDeviations: number;
  readonly lockMismatches: number;
  readonly outsideMismatches: number;
  readonly alphaMismatches: number;
  readonly invariants: Readonly<Record<
    "geometry" | "identityLock" | "outsideUnchanged" | "alpha" | "coverage" | "evidenceLabel", boolean>>;
  readonly status: "INVARIANTS_HOLD" | "INVARIANT_FAILED";
  readonly identityVerification: "NOT_PERFORMED";
  readonly realFaceQuality: "NOT_RUN";
  readonly releaseQuality: "NOT_RUN";
}

function sameAllocation(a: object, b: object): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function inspectSafeResult(source: Photo, selection: FaceSelection,
  result: SafeUpscaleResult): SafeInspection {
  const photo = checkedPhoto(source);
  const mask = checkedSelection(selection, photo.width, photo.height);
  const scale = result.scale;
  const allocation = admit(photo.width, photo.height, {
    channels: photo.channels, scale, budgetBytes: result.allocation.budgetBytes,
  });
  const output = result.photo;
  const geometry = !!output && output.data instanceof Uint8ClampedArray &&
    output.width === photo.width * scale && output.height === photo.height * scale &&
    output.channels === photo.channels && output.data.length === allocation.outputBytes &&
    sameAllocation(allocation, result.allocation);
  const counts = {
    outputPixels: 0, faceOutputPixels: 0, fullLockPixels: 0, fullLockDeviations: 0,
    lockMismatches: 0, outsideMismatches: 0, alphaMismatches: 0,
  };
  if (geometry) {
    const tenths = referenceShareTenths(result.lockLevel);
    const detail = legacyAmount(result.detailLevel);
    for (const tile of allocationTiles(allocation)) {
      const layers = renderLayers(photo, tile, scale, detail);
      const engine = layers.engine.data;
      const reference = layers.reference.data;
      forEachCorePixel(photo, mask, tile, scale, layers, (out, at, coverage) => {
        counts.outputPixels += 1;
        let blendDiffers = false, engineDiffers = false, referenceDiffers = false;
        for (let channel = 0; channel < 3; channel++) {
          const value = output.data[out + channel]!;
          if (value !== blendValue(engine[at + channel]!, reference[at + channel]!, coverage, tenths)) {
            blendDiffers = true;
          }
          if (value !== engine[at + channel]) engineDiffers = true;
          if (value !== reference[at + channel]) referenceDiffers = true;
        }
        if (coverage > 0) {
          counts.faceOutputPixels += 1;
          if (blendDiffers) counts.lockMismatches += 1;
          if (tenths === 50 && coverage === 255) {
            counts.fullLockPixels += 1;
            if (referenceDiffers) counts.fullLockDeviations += 1;
          }
        } else if (engineDiffers) {
          counts.outsideMismatches += 1;
        }
        if (photo.channels === 4 && output.data[out + 3] !== reference[at + 3]) counts.alphaMismatches += 1;
      });
    }
  }
  let marked = 0;
  for (const value of mask) if (value !== 0) marked += 1;
  const invariants = {
    geometry,
    identityLock: geometry && counts.lockMismatches === 0 && counts.fullLockDeviations === 0,
    outsideUnchanged: geometry && counts.outsideMismatches === 0,
    alpha: geometry && counts.alphaMismatches === 0,
    coverage: geometry && result.facePixels === marked &&
      counts.faceOutputPixels === result.facePixels * scale * scale,
    evidenceLabel: result.label === SAFE_LABEL,
  };
  return {
    schema: "beljour-safe-upscale-inspection/1", ...counts, invariants,
    status: Object.values(invariants).every(Boolean) ? "INVARIANTS_HOLD" : "INVARIANT_FAILED",
    identityVerification: "NOT_PERFORMED", realFaceQuality: "NOT_RUN", releaseQuality: "NOT_RUN",
  };
}
