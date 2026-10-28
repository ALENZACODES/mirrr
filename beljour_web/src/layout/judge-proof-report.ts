/** Downloadable, photo-free local rehearsal note; not a provider certification. */
import { JUDGE_STEPS, SIMULATION_MARK } from "./judge-contract.js";
import type { JudgeEvidenceSnapshot } from "./judge-evidence-ledger.js";
import { isSafeJudgeSnapshot } from "./judge-evidence-ledger.js";
import type { JudgeWitnessSummary } from "./judge-proof-policy.js";
import { judgeWitnessHeadline, judgeWitnessLabel } from "./judge-proof-policy.js";
import type { JudgeRunbookSummary } from "./judge-runbook.js";
import { formatRehearsalTime } from "./judge-rehearsal.js";

export interface JudgeSafeReport {
  readonly schema: "beljour-judge-rehearsal/1";
  readonly platform: "browser-local";
  readonly demoKind: "illustrative-only";
  readonly label: string;
  readonly providerCallsMeasured: "not-measured";
  readonly localDemoProviderCalls: 0;
  readonly photoBytesInReport: 0;
  readonly elapsedLabel: string;
  readonly withinRehearsalTarget: boolean;
  readonly observed: number;
  readonly visitedOnly: number;
  readonly skipped: number;
  readonly missing: number;
  readonly downloadRequestRecorded: boolean;
  readonly downloadArrivalVerified: false;
  readonly realFaceQuality: "not-tested";
  readonly realDeviceAccessibility: "not-tested";
  readonly steps: readonly {
    readonly id: string;
    readonly title: string;
    readonly status: string;
    readonly note: string;
  }[];
}

/** Stable, allow-listed shape. No caller-supplied string goes into this report. */
export function makeJudgeSafeReport(
  witness: JudgeWitnessSummary,
  evidence: JudgeEvidenceSnapshot,
  runbook: JudgeRunbookSummary,
): JudgeSafeReport {
  if (!isSafeJudgeSnapshot(evidence)) throw new TypeError("Invalid local rehearsal ledger");
  if (witness.rows.length !== JUDGE_STEPS.length) throw new TypeError("Incomplete rehearsal summary");
  const steps = JUDGE_STEPS.map((step) => {
    const observed = witness.rows.find((row) => row.id === step.id);
    if (!observed) throw new TypeError("Missing required rehearsal step");
    return {
      id: step.id,
      title: step.short,
      status: judgeWitnessLabel(observed.status),
      note: observed.reason,
    };
  });
  return {
    schema: "beljour-judge-rehearsal/1",
    platform: "browser-local",
    demoKind: "illustrative-only",
    label: SIMULATION_MARK,
    providerCallsMeasured: "not-measured",
    localDemoProviderCalls: 0,
    photoBytesInReport: 0,
    elapsedLabel: formatRehearsalTime(runbook.actualMs),
    withinRehearsalTarget: runbook.timeStatus === "within-rehearsal-target",
    observed: witness.observed,
    visitedOnly: witness.visited,
    skipped: witness.skipped,
    missing: witness.notObserved,
    downloadRequestRecorded: evidence.requestMade,
    downloadArrivalVerified: false,
    realFaceQuality: "not-tested",
    realDeviceAccessibility: "not-tested",
    steps,
  };
}

export function formatJudgeSafeReport(report: JudgeSafeReport): string {
  const lines: string[] = [
    "BELJOUR — FULL BEAUTY STUDIO · Your best day. Still you. — local Judge Mode rehearsal",
    "Schema: beljour-judge-rehearsal/1",
    `Classification: ${report.label}`,
    "This is a rehearsal transcript, not a verified live YouCam API result.",
    "No source image, filename, identity, consent values or photograph is included.",
    "",
    "REHEARSAL SUMMARY",
    `Elapsed (foreground only): ${report.elapsedLabel}`,
    `Finished within three-minute target: ${report.withinRehearsalTarget ? "yes" : "no"}`,
    `Observed local actions: ${report.observed} of ${report.steps.length}`,
    `Visited without action: ${report.visitedOnly}`,
    `Skipped: ${report.skipped}`,
    `Not observed: ${report.missing}`,
    `Browser download requested: ${report.downloadRequestRecorded ? "yes" : "no"}`,
    "Download arrival and saved-file integrity: NOT VERIFIED",
    "Real YouCam API availability and result: NOT MEASURED",
    "Real-face fairness and quality: NOT TESTED",
    "Physical device accessibility and speed: NOT TESTED",
    "",
    "STEP-BY-STEP LOCAL OBSERVATIONS",
  ];
  for (const [index, step] of report.steps.entries()) {
    lines.push(`${index + 1}. ${step.title}: ${step.status}`);
    lines.push(`   ${step.note}`);
  }
  lines.push("", "WHAT THE REHEARSAL DOES NOT CERTIFY");
  lines.push("It does not demonstrate a charged task, live integration, verified provider units,");
  lines.push("human-judged image quality, a 100,000-face release pass or a mobile performance pass.");
  lines.push("A live product demonstration and separate authorized external tests remain required.");
  lines.push("", `Verdict: ${judgeWitnessHeadline({
    rows: witnessRowsFromReport(report),
    observed: report.observed,
    visited: report.visitedOnly,
    skipped: report.skipped,
    notObserved: report.missing,
    allDemoActionsObserved: report.observed === report.steps.length,
    canProveLiveProvider: false,
    canProveImageDownload: false,
    evidenceVersion: "beljour-judge-rehearsal/1",
  })}`);
  return lines.join("\n") + "\n";
}

function witnessRowsFromReport(report: JudgeSafeReport): JudgeWitnessSummary["rows"] {
  return report.steps.map((entry, index) => {
    const status = entry.status === "Observed locally" ? "observed"
      : entry.status === "Skipped" ? "skipped"
        : entry.status === "Screen visited only" ? "visited" : "not-observed";
    return {
      id: JUDGE_STEPS[index].id,
      title: entry.title,
      status,
      observation: "source-selected",
      reason: entry.note,
    };
  });
}

export interface JudgeReportDownload {
  readonly blob: Blob;
  readonly filename: "BELJOUR-FULL-BEAUTY-STUDIO-judge-rehearsal.txt";
  readonly bytes: number;
}

export function prepareJudgeReportDownload(report: JudgeSafeReport): JudgeReportDownload {
  const content = formatJudgeSafeReport(report);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  return {
    blob,
    filename: "BELJOUR-FULL-BEAUTY-STUDIO-judge-rehearsal.txt",
    bytes: blob.size,
  };
}

export interface JudgeReportUrlPort {
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
}

/** User-initiated only. The generated Blob has no source image or metadata. */
export function requestJudgeReportDownload(
  doc: Document,
  report: JudgeReportDownload,
  urls: JudgeReportUrlPort = URL,
  defer: (task: () => void) => void = (task) => { setTimeout(task, 2000); },
): void {
  const url = urls.createObjectURL(report.blob);
  const link = doc.createElement("a");
  link.href = url;
  link.download = report.filename;
  link.hidden = true;
  doc.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    defer(() => urls.revokeObjectURL(url));
  }
}
