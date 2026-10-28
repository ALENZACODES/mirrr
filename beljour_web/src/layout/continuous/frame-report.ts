/** Photo-free evidence about in-memory drawn frames, never provider results. Author: John Khan. */
import { FRAME_IDS, isFrameId, type FrameSafeSummary } from "./frame-cache-contract.js";

export interface FrameEvidenceReport {
  readonly format: "beljour-drawn-frame-review/1";
  readonly input: "drawn-illustration-only";
  readonly result: "not-a-provider-result";
  readonly cachedFrames: number;
  readonly requestedFamily: string | null;
  readonly sessionStatus: "available" | "unavailable";
  readonly networkCalls: 0;
  readonly unitsSpent: 0;
  readonly liveVerified: false;
  readonly realFaceVerified: false;
  readonly frozenGatePassed: false;
}

export function frameEvidence(summary: FrameSafeSummary): FrameEvidenceReport {
  if (!Number.isSafeInteger(summary.available) || summary.available < 0
    || summary.available > FRAME_IDS.length || summary.liveVerified !== false
    || summary.unitsSpent !== 0 || summary.networkCalls !== 0
    || (summary.selected !== null && !isFrameId(summary.selected))) {
    throw new RangeError("Invalid local preview report");
  }
  return {
    format: "beljour-drawn-frame-review/1",
    input: "drawn-illustration-only",
    result: "not-a-provider-result",
    cachedFrames: summary.available,
    requestedFamily: summary.selected,
    sessionStatus: summary.phase === "ready" ? "available" : "unavailable",
    networkCalls: 0,
    unitsSpent: 0,
    liveVerified: false,
    realFaceVerified: false,
    frozenGatePassed: false,
  };
}

export function verifiedFrameReport(value: unknown): FrameEvidenceReport {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Invalid local frame evidence");
  }
  const row = value as Record<string, unknown>;
  const exact = [
    "format", "input", "result", "cachedFrames", "requestedFamily", "sessionStatus",
    "networkCalls", "unitsSpent", "liveVerified", "realFaceVerified", "frozenGatePassed",
  ];
  if (Object.keys(row).length !== exact.length || exact.some((key) => !(key in row))
    || row.format !== "beljour-drawn-frame-review/1"
    || row.input !== "drawn-illustration-only" || row.result !== "not-a-provider-result"
    || !Number.isInteger(row.cachedFrames) || Number(row.cachedFrames) < 0
    || Number(row.cachedFrames) > FRAME_IDS.length
    || (row.requestedFamily !== null && !isFrameId(row.requestedFamily))
    || !["available", "unavailable"].includes(String(row.sessionStatus))
    || row.networkCalls !== 0 || row.unitsSpent !== 0
    || row.liveVerified !== false || row.realFaceVerified !== false
    || row.frozenGatePassed !== false) {
    throw new Error("Local frame evidence cannot assert external success");
  }
  return value as FrameEvidenceReport;
}

export function frameReportBlob(summary: FrameSafeSummary): Blob {
  const result = verifiedFrameReport(frameEvidence(summary));
  return new Blob([JSON.stringify(result, null, 2) + "\n"], {
    type: "application/json",
  });
}

/** Explicit operator action; no result pixels or session keys leave browser memory. */
export function downloadFrameReport(doc: Document, summary: FrameSafeSummary): void {
  const report = frameReportBlob(summary);
  if (report.size > 2048) throw new RangeError("Unexpected local report size");
  const url = URL.createObjectURL(report);
  try {
    const link = doc.createElement("a");
    link.href = url;
    link.download = "BELJOUR-FULL-BEAUTY-STUDIO-Drawn-Cache-Review.json";
    link.hidden = true;
    doc.body.append(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
