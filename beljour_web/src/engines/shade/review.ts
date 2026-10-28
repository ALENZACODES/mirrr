/** Non-identifying review of the legacy W6 path against the audited cheek-first path.
 * Mirrors api/plumb_api/engines/shade/review.py. Precedence: missing_geometry,
 * inconsistent_light (cheek audit refused), coverage_gap (neither path names a shade and the
 * audited reading has no allowed reference within the committed 6.0 distance), agree,
 * measurement_mismatch. Thresholds are unchanged; every reading stays in the denominator;
 * only reference labels and categories are kept. The last supplied real-face measurement
 * (65/983) is quoted, not re-measured. Author: John Khan.
 */
import { nearestShade } from "./distance.js";
import type { ShadeResult } from "./finder.js";
import { SHADE_DATA } from "./generated/data.js";

export const CATEGORIES = ["agree", "measurement_mismatch", "missing_geometry", "inconsistent_light", "coverage_gap"] as const;
export type Category = typeof CATEGORIES[number];
export const LAST_REPORTED_REAL_FACE = "65/983";

export interface ShadeDiagnosis {
  readonly category: Category; readonly legacy: string | null; readonly audited: string | null;
  readonly audit_reason: string | null; readonly coverage: string | null;
}

const named = (r: ShadeResult | null): string | null => (r === null || r.refused || r.best === null ? null : r.best.id);

/** The shade.coverage status of a reading over the 96 references. */
export function coverageStatus(lab: readonly number[]): string {
  const match = nearestShade(lab, "reference");
  if (match === null) return "no_reference_deep_enough";
  return match.delta_e > SHADE_DATA.thresholds.confidence.refuse_delta_e_above ? "reference_too_far" : "within_reference_limit";
}

/** One category for one photo's two W6 readings. */
export function classifyPaths(legacy: ShadeResult | null, audited: ShadeResult | null, auditReason: string | null,
  geometry: boolean): ShadeDiagnosis {
  if (typeof geometry !== "boolean") throw new RangeError("geometry must be a boolean");
  const make = (category: Category, a: string | null, b: string | null, reason: string | null, cover: string | null) =>
    Object.freeze({ category, legacy: a, audited: b, audit_reason: reason, coverage: cover });
  if (!geometry || legacy === null || audited === null) return make("missing_geometry", null, null, null, null);
  const first = named(legacy), second = named(audited);
  if (auditReason !== null) return make("inconsistent_light", first, second, auditReason, null);
  const status = audited.measured_lab === null ? null : coverageStatus(audited.measured_lab);
  if (first === null && second === null && status !== null && status !== "within_reference_limit") {
    return make("coverage_gap", first, second, null, status);
  }
  return make(first === second ? "agree" : "measurement_mismatch", first, second, null, status);
}

export function reviewDiagnoses(diagnoses: readonly ShadeDiagnosis[]): Record<string, unknown> {
  if (diagnoses.length === 0) throw new RangeError("A review needs at least one diagnosis");
  const categories: Record<string, number> = {};
  for (const c of CATEGORIES) categories[c] = diagnoses.filter((d) => d.category === c).length;
  return { format: "beljour-shade-review/1", total: diagnoses.length, categories, thresholds_changed: false,
    last_reported_real_face: LAST_REPORTED_REAL_FACE, new_real_face_score: null, kind: "diagnostic_counts_not_accuracy" };
}
