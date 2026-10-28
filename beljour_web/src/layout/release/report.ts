/** Strict, photo-free local rehearsal export. Author: John Khan. */
import {
  RELEASE_CHECK_IDS, isReleaseId, isReleaseRefusal, releaseCheck,
  type ReleaseCheckId, type ReleaseCheckState, type ReleaseRefusal,
} from "./catalogue.js";
import type { ReleaseCommandResult } from "./commands.js";
import type { CanvasSampling, DeviceEnvironment } from "./device.js";
import type { ReleaseReadiness } from "./readiness.js";
import type { ReleaseSnapshot } from "./state.js";

export interface SafeReleaseRow {
  readonly id: ReleaseCheckId;
  readonly state: ReleaseCheckState;
  readonly refusal: ReleaseRefusal | null;
  readonly elapsedMs: number | null;
}
export interface SafeReleaseReport {
  readonly format: "beljour-release-rehearsal/1";
  readonly status: "operator-rehearsal";
  readonly elapsedMs: number;
  readonly rows: readonly SafeReleaseRow[];
  readonly reviewed: number;
  readonly device: {
    readonly canvas: boolean;
    readonly encoding: boolean;
    readonly secureContext: boolean;
    readonly online: boolean;
  };
  readonly syntheticTiming: {
    readonly samples: number;
    readonly medianMs: number | null;
    readonly p95Ms: number | null;
  };
  readonly proAvailable: number;
  readonly independentVerified: false;
  readonly providerVerified: false;
  readonly realFaceVerified: false;
  readonly productionReady: false;
  readonly uploaded: false;
  readonly hasPhotographs: false;
}

const STATES: readonly ReleaseCheckState[] = ["unobserved", "opened", "reviewed", "refused"];
const KEYS: readonly string[] = [
  "format", "status", "elapsedMs", "rows", "reviewed", "device",
  "syntheticTiming", "proAvailable", "independentVerified", "providerVerified",
  "realFaceVerified", "productionReady", "uploaded", "hasPhotographs",
];

function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  return Object.keys(value).sort().join("|") === [...expected].sort().join("|");
}

function boundedTime(value: number | null): boolean {
  return value === null || (Number.isFinite(value) && value >= 0 && value <= 3_600_000);
}

/** Export only the specified primitive fields, never a DOM event, file or state object. */
export function safeReleaseReport(
  snapshot: ReleaseSnapshot,
  readiness: ReleaseReadiness,
  commandResult: ReleaseCommandResult,
  environment: DeviceEnvironment | null,
  timing: CanvasSampling | null,
): SafeReleaseReport {
  const rows: SafeReleaseRow[] = snapshot.rows.map((row) => ({
    id: row.id,
    state: row.state,
    refusal: row.refusal,
    elapsedMs: row.elapsedMs,
  }));
  const result: SafeReleaseReport = {
    format: "beljour-release-rehearsal/1",
    status: "operator-rehearsal",
    elapsedMs: snapshot.elapsedMs,
    rows,
    reviewed: readiness.reviewed,
    device: {
      canvas: environment?.canvasAvailable === true,
      encoding: environment?.encodingAvailable === true,
      secureContext: environment?.secureContext === true,
      online: environment?.online === true,
    },
    syntheticTiming: {
      samples: timing?.status === "measured" ? timing.sampleCount : 0,
      medianMs: timing?.status === "measured" ? timing.medianMs : null,
      p95Ms: timing?.status === "measured" ? timing.p95Ms : null,
    },
    proAvailable: commandResult.rows.filter((command) => command.availability === "available").length,
    independentVerified: false,
    providerVerified: false,
    realFaceVerified: false,
    productionReady: false,
    uploaded: false,
    hasPhotographs: false,
  };
  if (!validateSafeReleaseReport(result)) throw new Error("Unsafe release report");
  return result;
}

/** Validates even callers that bypass TypeScript with untrusted JSON. */
export function validateSafeReleaseReport(value: unknown): value is SafeReleaseReport {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const report = value as Record<string, unknown>;
  if (!exactKeys(report, KEYS)) return false;
  if (report.format !== "beljour-release-rehearsal/1"
    || report.status !== "operator-rehearsal") return false;
  for (const key of [
    "independentVerified", "providerVerified", "realFaceVerified", "productionReady",
    "uploaded", "hasPhotographs",
  ]) {
    if (report[key] !== false) return false;
  }
  if (typeof report.elapsedMs !== "number" || !boundedTime(report.elapsedMs)) return false;
  if (typeof report.reviewed !== "number" || !Number.isInteger(report.reviewed)) return false;
  if (typeof report.proAvailable !== "number" || !Number.isInteger(report.proAvailable)
    || report.proAvailable < 0 || report.proAvailable > 5) return false;
  const device = report.device;
  if (!device || typeof device !== "object" || Array.isArray(device)) return false;
  const flags = device as Record<string, unknown>;
  if (!exactKeys(flags, ["canvas", "encoding", "secureContext", "online"])) return false;
  if (Object.values(flags).some((flag) => typeof flag !== "boolean")) return false;
  const timing = report.syntheticTiming;
  if (!timing || typeof timing !== "object" || Array.isArray(timing)) return false;
  const sample = timing as Record<string, unknown>;
  if (!exactKeys(sample, ["samples", "medianMs", "p95Ms"])) return false;
  if (typeof sample.samples !== "number" || !Number.isInteger(sample.samples)
    || sample.samples < 0 || sample.samples > 20) return false;
  for (const key of ["medianMs", "p95Ms"]) {
    if (sample[key] !== null && (typeof sample[key] !== "number"
      || !Number.isFinite(sample[key]) || sample[key] < 0 || sample[key] > 300_000)) return false;
  }
  if (sample.samples === 0 && (sample.medianMs !== null || sample.p95Ms !== null)) return false;
  if (!Array.isArray(report.rows) || report.rows.length !== RELEASE_CHECK_IDS.length) return false;
  const seen = new Set<string>();
  let count = 0;
  for (const raw of report.rows) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
    const row = raw as Record<string, unknown>;
    if (!exactKeys(row, ["id", "state", "refusal", "elapsedMs"])) return false;
    if (typeof row.id !== "string" || !isReleaseId(row.id) || seen.has(row.id)) return false;
    seen.add(row.id);
    if (!STATES.includes(row.state as ReleaseCheckState)) return false;
    const definition = releaseCheck(row.id);
    if (definition.classification !== "operator" && row.state === "reviewed") return false;
    if (definition.route === null && row.state === "opened") return false;
    if (row.refusal !== null && (typeof row.refusal !== "string"
      || !isReleaseRefusal(row.refusal))) return false;
    if (row.state === "refused" && row.refusal === null) return false;
    if (row.state !== "refused" && row.refusal !== null) return false;
    if (row.elapsedMs !== null && (typeof row.elapsedMs !== "number"
      || !boundedTime(row.elapsedMs))) return false;
    if (row.state === "unobserved" && row.elapsedMs !== null) return false;
    if (row.state === "reviewed") count += 1;
  }
  if (seen.size !== RELEASE_CHECK_IDS.length || report.reviewed !== count) return false;
  return true;
}

export function serializeReleaseReport(report: SafeReleaseReport): string {
  if (!validateSafeReleaseReport(report)) throw new RangeError("Release report failed validation");
  return JSON.stringify(report, null, 2) + "\n";
}

export interface DownloadPorts {
  readonly createObjectURL: (blob: Blob) => string;
  readonly revokeObjectURL: (url: string) => void;
  readonly createAnchor: () => HTMLAnchorElement;
}

export function saveReleaseReport(report: SafeReleaseReport, ports: DownloadPorts): void {
  const payload = serializeReleaseReport(report);
  const blob = new Blob([payload], { type: "application/json" });
  const url = ports.createObjectURL(blob);
  try {
    const anchor = ports.createAnchor();
    anchor.href = url;
    anchor.download = "BELJOUR-FULL-BEAUTY-STUDIO-release-rehearsal.json";
    anchor.click();
  } finally {
    ports.revokeObjectURL(url);
  }
}

/** Only fixed reason codes are serialized, never free-form notes or image data. */
export function reportContainsUnsafeFields(text: string): boolean {
  const lower = text.toLowerCase();
  return ["data:image", "base64", "filename", "photo_id", "landmarks", "authorization",
    "api_key", "objecturl", "face_embedding"].some((item) => lower.includes(item));
}
