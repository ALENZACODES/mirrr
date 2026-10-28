/** Observed fibre effect from the final, identity-guarded pixels.
 * Mirrors api/plumb_api/engines/concealer/observed.py and is checked against
 * parity/cover-observation-r28f.json. For each marked scalp pixel, t is how far the shown
 * colour moved from the original towards the pigment, projected on that line and clipped
 * to [0, 1]; observedEffectFraction is the mean t over pixels at least MIN_CONTRAST from
 * the pigment. Refusals: invalid_mask, alpha_changed, leaked_pixels,
 * unrelated_colour_movement, insufficient_contrast (ASSUMED bounds). On-screen pixel
 * evidence only; no physical scalp coverage is inferred. Author: John Khan.
 */
import type { CoverResult } from "../engines/local/fibre.js";

export const MIN_CONTRAST = 12;
export const MAX_RESIDUAL = 4;
export const MIN_CONTRAST_PIXELS = 16;
export type ObservationCode = "invalid_mask" | "alpha_changed" | "leaked_pixels" | "unrelated_colour_movement" |
  "insufficient_contrast";

export interface ObservedImage { width: number; height: number; channels: number; data: ArrayLike<number> }

export interface CoverObservation {
  readonly format: "beljour-cover-observation/1";
  readonly refused: boolean;
  readonly code: ObservationCode | null;
  readonly marked_pixels: number;
  readonly contrast_pixels: number;
  readonly changed_pixels: number;
  readonly observed_effect_fraction: number | null;
  readonly max_residual: number;
  readonly physical_coverage_inferred: false;
}

function observation(code: ObservationCode | null, marked: number, contrast: number, changed: number,
  effect: number | null, residual: number): CoverObservation {
  return Object.freeze({ format: "beljour-cover-observation/1", refused: code !== null, code, marked_pixels: marked,
    contrast_pixels: contrast, changed_pixels: changed, observed_effect_fraction: effect, max_residual: residual,
    physical_coverage_inferred: false });
}

/** Measure the shown fibre effect inside the marked scalp, or refuse with a code. */
export function observeCover(before: ObservedImage, after: ObservedImage, markedScalp: ArrayLike<number>,
  pigment: readonly [number, number, number]): CoverObservation {
  const { width, height, channels: ch } = before;
  if ((ch !== 3 && ch !== 4) || after.width !== width || after.height !== height || after.channels !== ch ||
      before.data.length !== width * height * ch || after.data.length !== before.data.length) {
    throw new RangeError("before and after must be same-size RGB or RGBA images");
  }
  if (pigment.length !== 3 || pigment.some((c) => !Number.isInteger(c) || c < 0 || c > 255)) {
    throw new RangeError("pigment must be three RGB bytes");
  }
  const n = width * height;
  let marked = 0;
  if (markedScalp.length === n) for (let i = 0; i < n; i++) if (markedScalp[i] >= 0.5) marked++;
  if (markedScalp.length !== n || marked === 0) return observation("invalid_mask", 0, 0, 0, null, 0);
  let changed = 0, leaked = false, alpha = false;
  for (let i = 0; i < n; i++) {
    if (ch === 4 && before.data[i * 4 + 3] !== after.data[i * 4 + 3]) alpha = true;
    const moved = [0, 1, 2].some((c) => before.data[i * ch + c] !== after.data[i * ch + c]);
    if (moved && markedScalp[i] >= 0.5) changed++;
    else if (moved) leaked = true;
  }
  if (alpha) return observation("alpha_changed", marked, 0, 0, null, 0);
  if (leaked) return observation("leaked_pixels", marked, 0, changed, null, 0);
  let worst = 0, usable = 0, total = 0;
  for (let i = 0; i < n; i++) {
    if (!(markedScalp[i] >= 0.5)) continue;
    const step = [0, 1, 2].map((c) => after.data[i * ch + c] - before.data[i * ch + c]);
    const line = [0, 1, 2].map((c) => pigment[c] - before.data[i * ch + c]);
    const length2 = line[0] ** 2 + line[1] ** 2 + line[2] ** 2;
    const raw = length2 > 0 ? (step[0] * line[0] + step[1] * line[1] + step[2] * line[2]) / length2 : 0;
    const residual = Math.hypot(step[0] - raw * line[0], step[1] - raw * line[1], step[2] - raw * line[2]);
    worst = Math.max(worst, residual);
    if (length2 >= MIN_CONTRAST ** 2) {
      usable++;
      total += Math.min(1, Math.max(0, raw));
    }
  }
  if (worst > MAX_RESIDUAL) return observation("unrelated_colour_movement", marked, usable, changed, null, worst);
  if (usable < MIN_CONTRAST_PIXELS || 2 * usable < marked) {
    return observation("insufficient_contrast", marked, usable, changed, null, worst);
  }
  return observation(null, marked, usable, changed, total / usable, worst);
}

/** The renderer's projected share of visible scalp covered (its historical estimate). */
export function plannedEffectFraction(result: CoverResult): number {
  if (result.beforeShare <= 0) return 0;
  return Math.max(0, Math.min(1, 1 - result.afterShare / result.beforeShare));
}

/** Planned versus observed evidence for one rendered (full-resolution) fibre preview. */
export function observeCoverResult(before: ObservedImage, result: CoverResult, markedScalp: ArrayLike<number>):
  { planned_effect_fraction: number; observation: CoverObservation; level: number; provider_calls: 0 } {
  return { planned_effect_fraction: Math.round(plannedEffectFraction(result) * 1e6) / 1e6,
    observation: observeCover(before, result.image, markedScalp, result.hairRgb), level: result.level,
    provider_calls: 0 };
}
