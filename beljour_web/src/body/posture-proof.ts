/** Aggregate-only body evidence reader and status view for the posture studio.
 * Accepts one counts-only report (format `beljour-posture-body-evidence/1`) covering exactly
 * the 308 registered J10-J16 slice rows. It refuses unknown or private attributes (paths,
 * photo hashes, sources, per-person values), missing or duplicate rows, impossible counts,
 * row statuses that do not follow from their counts, and any report that claims a release
 * or human-review pass. Locally supplied reports are unverified; reading one never changes
 * the photo, the controls, head protection or export readiness. Text uses textContent only.
 * Author: John Khan.
 */
import { FIXES, type FixName, type View } from "../engines/local/posture.js";

export const EVIDENCE_FORMAT = "beljour-posture-body-evidence/1";
export const BODY_SIZES = ["small", "medium", "large"] as const;
export const MONK_TONES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] as const;
export const SLICES = ["view", "body_size", "monk", "body_size_monk"] as const;
export const MIN_GROUP_BODIES = 20;
export const MIN_GROUP_PASS_RATE = 0.95;
export const REGISTERED_ROWS = 308;
export const NOT_RUN_COPY = "Body-set evidence: NOT_RUN. No licensed, released adult body set has been measured.";

export type RowStatus = "NOT_RUN" | "UNDERPOWERED" | "INCOMPLETE" | "NUMERIC_FAIL" | "CHECKS_OK";
export type NumericStatus = "NOT_RUN" | "UNPROVEN" | "NUMERIC_FAIL" | "CHECKS_OK";
export type SliceName = typeof SLICES[number];

export interface EvidenceRow {
  fix: string;
  view: View;
  slice: SliceName;
  group: string;
  bodies: number;
  expected_jobs: number;
  measured_jobs: number;
  refused_jobs: number;
  passed_jobs: number;
  status: RowStatus;
}

export interface EvidenceCompletion {
  expected_jobs: number;
  recorded_jobs: number;
  missing_jobs: number;
  refused_jobs: number;
  passed_jobs: number;
  failed_jobs: number;
}

export interface BodyEvidenceReport {
  format: typeof EVIDENCE_FORMAT;
  run: string;
  definitions_sha256: string;
  set_status: "NOT_RUN" | "UNPROVEN";
  numeric_status: NumericStatus;
  release_status: "NOT_RUN";
  human_review: "NOT_RUN";
  completion: EvidenceCompletion;
  rows: EvidenceRow[];
}

export class EvidenceRefused extends RangeError {
  constructor(readonly code: string) {
    super(code);
    this.name = "EvidenceRefused";
  }
}

const SHA = /^[0-9a-f]{64}$/;
const REPORT_KEYS = ["format", "run", "definitions_sha256", "set_status", "numeric_status", "release_status",
  "human_review", "completion", "rows"];
const ROW_KEYS = ["fix", "view", "slice", "group", "bodies", "expected_jobs", "measured_jobs", "refused_jobs",
  "passed_jobs", "status"];
const COMPLETION_KEYS = ["expected_jobs", "recorded_jobs", "missing_jobs", "refused_jobs", "passed_jobs", "failed_jobs"];

export function fixIdsFor(view: View): string[] {
  return (Object.keys(FIXES) as FixName[]).filter((fix) => FIXES[fix].view === view).map((fix) => FIXES[fix].id);
}

/** Every registered (fix, slice, group) in canonical order: 44 rows per fix, 308 in all. */
export function registeredRows(): { fix: string; view: View; slice: SliceName; group: string }[] {
  const rows: { fix: string; view: View; slice: SliceName; group: string }[] = [];
  for (const view of ["front", "side"] as const) {
    for (const fix of fixIdsFor(view)) {
      rows.push({ fix, view, slice: "view", group: view });
      for (const size of BODY_SIZES) rows.push({ fix, view, slice: "body_size", group: size });
      for (const tone of MONK_TONES) rows.push({ fix, view, slice: "monk", group: tone });
      for (const size of BODY_SIZES) {
        for (const tone of MONK_TONES) rows.push({ fix, view, slice: "body_size_monk", group: `${size}/${tone}` });
      }
    }
  }
  return rows;
}

export function rowKey(row: { fix: string; slice: string; group: string }): string {
  return `${row.fix}|${row.slice}|${row.group}`;
}

/** The status a row must carry, from its counts alone (refusals are non-passes). */
export function expectedRowStatus(row: Pick<EvidenceRow, "bodies" | "expected_jobs" | "measured_jobs" |
  "passed_jobs">): RowStatus {
  if (row.measured_jobs === 0) return "NOT_RUN";
  if (row.bodies < MIN_GROUP_BODIES) return "UNDERPOWERED";
  if (row.measured_jobs < row.expected_jobs) return "INCOMPLETE";
  return row.passed_jobs / row.expected_jobs >= MIN_GROUP_PASS_RATE ? "CHECKS_OK" : "NUMERIC_FAIL";
}

export function expectedNumericStatus(rows: readonly EvidenceRow[], setStatus: string): NumericStatus {
  if (rows.some((row) => row.status === "NUMERIC_FAIL")) return "NUMERIC_FAIL";
  if (rows.every((row) => row.status === "NOT_RUN")) return "NOT_RUN";
  if (setStatus === "NOT_RUN" && rows.every((row) => row.status === "CHECKS_OK")) return "CHECKS_OK";
  return "UNPROVEN";
}

function exactKeys(value: unknown, keys: readonly string[], code: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new EvidenceRefused(code);
  const found = Object.keys(value).sort();
  const wanted = [...keys].sort();
  if (found.length !== wanted.length || found.some((key, i) => key !== wanted[i])) throw new EvidenceRefused(code);
  return value as Record<string, unknown>;
}

function count(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw new EvidenceRefused("invalid_evidence_count");
  return value as number;
}

/** Validate a parsed JSON value and return an owned, typed copy. */
export function checkedEvidenceReport(value: unknown): BodyEvidenceReport {
  const raw = exactKeys(value, REPORT_KEYS, "unexpected_evidence_attributes");
  if (raw.format !== EVIDENCE_FORMAT) throw new EvidenceRefused("unsupported_evidence_format");
  if (typeof raw.run !== "string" || !SHA.test(raw.run) || typeof raw.definitions_sha256 !== "string" ||
      !SHA.test(raw.definitions_sha256)) {
    throw new EvidenceRefused("invalid_evidence_binding");
  }
  if (raw.release_status !== "NOT_RUN" || raw.human_review !== "NOT_RUN") {
    throw new EvidenceRefused("unsupported_release_claim");
  }
  if (raw.set_status !== "NOT_RUN" && raw.set_status !== "UNPROVEN") throw new EvidenceRefused("invalid_set_status");
  const completionRaw = exactKeys(raw.completion, COMPLETION_KEYS, "unexpected_evidence_attributes");
  const completion = Object.fromEntries(COMPLETION_KEYS.map((key) => [key, count(completionRaw[key])])) as
    unknown as EvidenceCompletion;
  if (completion.recorded_jobs + completion.missing_jobs !== completion.expected_jobs ||
      completion.passed_jobs + completion.refused_jobs + completion.failed_jobs !== completion.recorded_jobs) {
    throw new EvidenceRefused("inconsistent_completion");
  }
  if (!Array.isArray(raw.rows) || raw.rows.length !== REGISTERED_ROWS) throw new EvidenceRefused("missing_group_rows");
  const registered = new Map(registeredRows().map((row) => [rowKey(row), row]));
  const seen = new Set<string>();
  const rows: EvidenceRow[] = raw.rows.map((item: unknown) => {
    const entry = exactKeys(item, ROW_KEYS, "unexpected_evidence_attributes");
    const key = rowKey({ fix: String(entry.fix), slice: String(entry.slice), group: String(entry.group) });
    const expected = registered.get(key);
    if (!expected || entry.view !== expected.view) throw new EvidenceRefused("unregistered_group_row");
    if (seen.has(key)) throw new EvidenceRefused("duplicate_group_row");
    seen.add(key);
    const row: EvidenceRow = { ...expected, bodies: count(entry.bodies), expected_jobs: count(entry.expected_jobs),
      measured_jobs: count(entry.measured_jobs), refused_jobs: count(entry.refused_jobs),
      passed_jobs: count(entry.passed_jobs), status: entry.status as RowStatus };
    if (row.expected_jobs !== row.bodies || row.measured_jobs > row.expected_jobs ||
        row.passed_jobs + row.refused_jobs > row.measured_jobs) {
      throw new EvidenceRefused("impossible_group_counts");
    }
    if (row.status !== expectedRowStatus(row)) throw new EvidenceRefused("inconsistent_group_status");
    return row;
  });
  if (raw.numeric_status !== expectedNumericStatus(rows, raw.set_status)) {
    throw new EvidenceRefused("inconsistent_numeric_status");
  }
  return { format: EVIDENCE_FORMAT, run: raw.run, definitions_sha256: raw.definitions_sha256,
    set_status: raw.set_status, numeric_status: raw.numeric_status as NumericStatus, release_status: "NOT_RUN",
    human_review: "NOT_RUN", completion, rows };
}

/** Plain-language status lines; a missing report is shown as NOT_RUN. */
export function proofStatusLines(report: BodyEvidenceReport | null): string[] {
  if (!report) return [NOT_RUN_COPY, "Release: NOT_RUN. Human review: NOT_RUN."];
  const counts = new Map<RowStatus, number>();
  for (const row of report.rows) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  const parts = (["CHECKS_OK", "NUMERIC_FAIL", "INCOMPLETE", "UNDERPOWERED", "NOT_RUN"] as const)
    .filter((status) => counts.get(status)).map((status) => `${counts.get(status)} ${status}`);
  const c = report.completion;
  return [
    `Locally supplied, unverified body evidence: numeric status ${report.numeric_status}, set ${report.set_status}.`,
    `${REGISTERED_ROWS} registered groups: ${parts.join(", ")}.`,
    `Jobs: ${c.recorded_jobs} of ${c.expected_jobs} recorded, ${c.passed_jobs} within limits, ` +
      `${c.refused_jobs} refused, ${c.failed_jobs} outside limits, ${c.missing_jobs} missing.`,
    "Release: NOT_RUN. Human review: NOT_RUN. Numeric checks are not a quality or identity pass.",
  ];
}

export interface ProofStatusHandle {
  readonly element: HTMLElement;
  readonly report: BodyEvidenceReport | null;
  /** Validate and show a parsed report; on refusal the view returns to NOT_RUN. */
  show(value: unknown): BodyEvidenceReport;
  reset(): void;
  dispose(): void;
}

export function mountProofStatus(parent: HTMLElement): ProofStatusHandle {
  const root = document.createElement("section");
  root.className = "posture-proof";
  root.setAttribute("aria-label", "Body-set evidence");
  const list = document.createElement("ul");
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  root.append(list, status);
  parent.append(root);
  let current: BodyEvidenceReport | null = null;
  const render = (): void => {
    list.replaceChildren(...proofStatusLines(current).map((line) => {
      const item = document.createElement("li");
      item.textContent = line;
      return item;
    }));
  };
  render();
  return {
    element: root,
    get report() { return current; },
    show(value: unknown) {
      try {
        current = checkedEvidenceReport(value);
        status.textContent = "";
        return current;
      } catch (error) {
        current = null;
        status.textContent = "That evidence report was refused.";
        throw error;
      } finally {
        render();
      }
    },
    reset() {
      current = null;
      status.textContent = "";
      render();
    },
    dispose() { root.remove(); },
  };
}
