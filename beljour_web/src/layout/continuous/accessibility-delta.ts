/** Compare consecutive local control checks without claiming certification. */
import { type AuditFinding } from "./accessibility-audit.js";
import { checkedAuditReport, type ContinuousAuditReport } from
  "./accessibility-report.js";

export interface ContinuousAuditDelta {
  readonly kind: "same-screen-local-comparison";
  readonly introduced: readonly AuditFinding[];
  readonly resolved: readonly AuditFinding[];
  readonly persistent: readonly AuditFinding[];
  readonly controlChange: number;
  readonly evidence: "operator-local-observation-only";
}

/** Both reports must be fixed-schema, independently local and from the same authority. */
export function compareContinuousAudits(
  previous: ContinuousAuditReport, current: ContinuousAuditReport,
): ContinuousAuditDelta {
  const prior = checkedAuditReport(previous);
  const next = checkedAuditReport(current);
  if (prior.format !== next.format || prior.scope !== next.scope
    || prior.evidence !== next.evidence) {
    throw new Error("Incompatible local control checks");
  }
  const previousFindings = new Set<AuditFinding>(prior.findings);
  const nextFindings = new Set<AuditFinding>(next.findings);
  return Object.freeze({
    kind: "same-screen-local-comparison" as const,
    introduced: Object.freeze(next.findings.filter((item) =>
      !previousFindings.has(item))),
    resolved: Object.freeze(prior.findings.filter((item) =>
      !nextFindings.has(item))),
    persistent: Object.freeze(next.findings.filter((item) =>
      previousFindings.has(item))),
    controlChange: next.controls - prior.controls,
    evidence: "operator-local-observation-only" as const,
  });
}

export function continuousAuditDeltaCaption(delta: ContinuousAuditDelta): string {
  if (!delta || delta.kind !== "same-screen-local-comparison"
    || delta.evidence !== "operator-local-observation-only") {
    throw new TypeError("Unknown local audit comparison");
  }
  const counts = [delta.introduced.length, delta.resolved.length,
    delta.persistent.length];
  if (counts.some((value) => !Number.isInteger(value) || value < 0 || value > 14)
    || !Number.isSafeInteger(delta.controlChange)
    || Math.abs(delta.controlChange) > 321) {
    throw new RangeError("Invalid comparison counts");
  }
  return `Since the previous check of this screen: ${counts[0]} new rule categories, `
    + `${counts[1]} resolved, ${counts[2]} still observed. `
    + "This is not real-device or screen-reader certification.";
}
