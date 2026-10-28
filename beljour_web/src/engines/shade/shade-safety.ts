/** Photo-free BELJOUR shade-safety receipt combining a W6 reading with its two reviews.
 * Mirrors api/plumb_api/engines/shade/shade_safety.py: always manual-only intent, zero
 * provider calls, no real product match and an UNPROVEN real-face gate. Status: refused
 * (any refusal wins), review (lighting-sensitive or nearby references), else consistent.
 * Reviews describing another selection throw. Author: John Khan.
 */
import type { ShadeResult } from "./finder.js";
import { publicSensitivity, type SensitivityDecision } from "./illumination-sensitivity.js";
import { publicAmbiguity, type AmbiguityDecision } from "./reference-ambiguity.js";

export type SafetyStatus = "consistent" | "review" | "refused";
export const LABEL = "BELJOUR shade check. A digital estimate from your photo, not tested against real products.";

export interface ShadeSafetyReport {
  readonly status: SafetyStatus;
  readonly selected_id: string | null;
  readonly reasons: readonly string[];
  readonly sensitivity: SensitivityDecision;
  readonly ambiguity: AmbiguityDecision;
}

/** One receipt for one W6 reading; refusals are kept, never smoothed over. */
export function assessShadeSafety(result: ShadeResult, sensitivity: SensitivityDecision,
  ambiguity: AmbiguityDecision): ShadeSafetyReport {
  const selected = !result.refused && result.best !== null ? result.best.id : null;
  for (const review of [sensitivity, ambiguity]) {
    if (review.status !== "refused" && review.selected_id !== selected) {
      throw new RangeError("The reviews describe a different shade selection");
    }
  }
  const reasons: string[] = [];
  if (selected === null) reasons.push("reading_refused");
  if (sensitivity.status === "refused") reasons.push(`lighting:${sensitivity.code}`);
  if (ambiguity.status === "refused") reasons.push(`references:${ambiguity.code}`);
  if (reasons.length) {
    return Object.freeze({ status: "refused", selected_id: null, reasons: Object.freeze(reasons), sensitivity, ambiguity });
  }
  if (sensitivity.status === "sensitive") reasons.push("lighting_sensitive");
  if (ambiguity.status === "ambiguous") reasons.push("nearby_references");
  return Object.freeze({ status: reasons.length ? "review" : "consistent", selected_id: selected,
    reasons: Object.freeze(reasons), sensitivity, ambiguity });
}

/** The same JSON as ShadeSafetyReport.public() in Python. */
export function publicShadeSafety(report: ShadeSafetyReport): Record<string, unknown> {
  return {
    format: "beljour-shade-safety/1", label: LABEL, status: report.status, selected: report.selected_id,
    reasons: [...report.reasons], sensitivity: publicSensitivity(report.sensitivity),
    ambiguity: publicAmbiguity(report.ambiguity), intent: "manual_only", provider_calls: 0,
    real_product_match: false, real_face_gate: "UNPROVEN", release_pass: false,
  };
}
