/** How an already selected W6 shade holds up under other lighting estimates of the same sample.
 * Mirrors api/plumb_api/engines/shade/illumination_sensitivity.py. Each estimate (neutral
 * card, grey-world background, uncorrected) is applied to the exact sRGB sample W6 measured;
 * the audit reports distance to the selected shade, how much lighter it is, and the nearest
 * reference. It never picks a different winner. Refusals: incompatible_baseline (refused,
 * unnamed or unknown selection) and stale_sample (the sample re-measured with W6's own gains
 * is more than 0.01 CIEDE2000, ASSUMED, from its reading). Invalid estimates throw.
 * Photo-free output. Author: John Khan.
 */
import { delta_e, nearestShade } from "./distance.js";
import { pixelsToLab, trimmedStats, type ShadeResult, type WhiteBalance } from "./finder.js";
import { SHADE_DATA } from "./generated/data.js";
import { loadReferenceShades, type ShadeRecord } from "./loaders.js";

export const STALE_DELTA_E = 0.01;
export const MODES = ["neutral", "grey_world", "none"] as const;
export type LightingMode = typeof MODES[number];
export type SensitivityStatus = "stable" | "sensitive" | "refused";
type Vec3 = [number, number, number];

export interface LightingEstimate { readonly mode: LightingMode; readonly gains: readonly [number, number, number] }
export interface LightingOutcome {
  readonly mode: LightingMode; readonly lab: Vec3; readonly delta_e: number; readonly lighter_by: number;
  readonly nearest_id: string | null; readonly within_limits: boolean;
}
export interface SensitivityDecision {
  readonly status: SensitivityStatus; readonly code: string | null; readonly selected_id: string | null;
  readonly outcomes: readonly LightingOutcome[];
}

const round = (v: number, d: number) => { const s = 10 ** d; return Math.round(v * s) / s; };

/** A checked lighting estimate; throws RangeError on bad modes or gains. */
export function lightingEstimate(mode: string, gains: ArrayLike<number>): LightingEstimate {
  if (!(MODES as readonly string[]).includes(mode)) throw new RangeError("Lighting estimate mode must be neutral, grey_world or none");
  const g = Array.from({ length: gains.length }, (_, i) => gains[i]);
  if (g.length !== 3 || !g.every((v) => typeof v === "number" && Number.isFinite(v))) {
    throw new RangeError("Lighting gains must be three finite numbers");
  }
  const [lo, hi] = SHADE_DATA.thresholds.gain_limits;
  if (g.some((v) => v < lo || v > hi)) throw new RangeError("Lighting gains lie outside the committed W6 gain limits");
  if (mode === "none" && g.some((v) => v !== 1)) throw new RangeError("An uncorrected estimate must have unit gains");
  return Object.freeze({ mode: mode as LightingMode, gains: Object.freeze([g[0], g[1], g[2]] as const) });
}

export function estimateFromWhite(white: WhiteBalance): LightingEstimate { return lightingEstimate(white.mode, white.gains); }

/** The W6 trimmed median Lab of an sRGB sample under the given gains. */
export function measureSample(sample: readonly ArrayLike<number>[], gains: readonly number[]): Vec3 {
  if (!Array.isArray(sample) || sample.length === 0 ||
      !sample.every((p) => p.length === 3 && [p[0], p[1], p[2]].every(Number.isFinite))) {
    throw new RangeError("The colour sample must be a non-empty list of finite sRGB triples");
  }
  const white: WhiteBalance = { gains: [gains[0], gains[1], gains[2]], mode: "neutral", clamped: false };
  return trimmedStats(pixelsToLab(sample, white)).median;
}

const refuse = (code: string, selected: string | null): SensitivityDecision =>
  Object.freeze({ status: "refused", code, selected_id: selected, outcomes: Object.freeze([]) });

/** Compare the selected shade under each estimate; never select a different shade. */
export function auditIlluminationSensitivity(result: ShadeResult, sample: readonly ArrayLike<number>[],
  estimates: readonly LightingEstimate[]): SensitivityDecision {
  if (!Array.isArray(estimates) || estimates.length < 1 || estimates.length > MODES.length) {
    throw new RangeError("Give one to three lighting estimates");
  }
  const rows = estimates.map((e) => lightingEstimate(e.mode, e.gains));
  if (new Set(rows.map((e) => e.mode)).size !== rows.length) throw new RangeError("Each lighting mode may be supplied once");
  const references = new Map<string, ShadeRecord>(loadReferenceShades().map((r) => [r.id, r]));
  const selected = result.best?.id ?? null;
  const shade = selected === null ? undefined : references.get(selected);
  if (result.refused || result.measured_lab === null || shade === undefined) return refuse("incompatible_baseline", selected);
  if (delta_e(measureSample(sample, result.white.gains), result.measured_lab) > STALE_DELTA_E) {
    return refuse("stale_sample", selected);
  }
  const limit = SHADE_DATA.thresholds.confidence.refuse_delta_e_above;
  const allowance = SHADE_DATA.thresholds.never_lighter_allowance;
  const outcomes = rows.map((estimate): LightingOutcome => {
    const lab = measureSample(sample, estimate.gains);
    const distance = delta_e(lab, shade.lab), lighterBy = shade.lab[0] - lab[0];
    return Object.freeze({ mode: estimate.mode, lab, delta_e: distance, lighter_by: lighterBy,
      nearest_id: nearestShade(lab, "reference")?.record.id ?? null,
      within_limits: distance <= limit && lighterBy <= allowance });
  });
  const stable = outcomes.every((o) => o.within_limits && o.nearest_id === selected);
  return Object.freeze({ status: stable ? "stable" : "sensitive", code: null, selected_id: selected,
    outcomes: Object.freeze(outcomes) });
}

/** The same JSON as SensitivityDecision.public() in Python. */
export function publicSensitivity(found: SensitivityDecision): Record<string, unknown> {
  const top = found.outcomes.length ? Math.max(...found.outcomes.map((o) => o.delta_e)) : null;
  return {
    format: "beljour-illumination-sensitivity/1", status: found.status, code: found.code, selected: found.selected_id,
    max_delta_e: top === null ? null : round(top, 4),
    outcomes: found.outcomes.map((o) => ({ mode: o.mode, lab: o.lab.map((v) => round(v, 4)), delta_e: round(o.delta_e, 4),
      lighter_by: round(o.lighter_by, 4), nearest: o.nearest_id, within_limits: o.within_limits })),
    changes_selection: false,
    note: "Lighting comparison on one sample; not a new shade choice or a product match.",
  };
}
