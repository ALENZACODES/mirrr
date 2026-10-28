/** Local-only Save System audit orchestration, with no stored photograph data.
 *
 * A caller explicitly opts in, supplies transient originals and, optionally,
 * locally encoded outputs. Missing exports remain UNPROVEN. Every input gets
 * an independent replay; a failed result never becomes a successful save.
 * Author: John Khan.
 */

import { type Engine, type PhotoPixels } from "./looks.js";
import { type LookRecipe } from "./recipe.js";
import { type ProofOptions, type ProofStatus, proveReplay } from "./proof.js";
import { inspectExport, type ExportProofStatus } from "./proof-export.js";
import { ProofLedger } from "./proof-ledger.js";
import { bindReport, createProofPlan, type ProofBundle } from "./proof-plan.js";

export const AUDIT_FORMAT = "beljour-save-audit/1";

export interface AuditInput {
  readonly pixels: PhotoPixels;
  readonly encoded?: Uint8Array;
}

export interface ExportCounts {
  readonly expected: number;
  readonly inspected: number;
  readonly passed: number;
  readonly failed: number;
  readonly missing: number;
}

export interface SaveAudit {
  readonly format: typeof AUDIT_FORMAT;
  readonly status: ProofStatus;
  readonly replay: ProofBundle;
  readonly exports: ExportCounts;
  readonly processed: number;
}

export interface AuditOptions extends ProofOptions {
  readonly abort?: AbortSignal;
}

/**
 * Runs in the calling browser, with no fetch, storage, telemetry or provider
 * request. Real provider steps are refused unless an explicit adapter is
 * provided; a replay PASS proves mechanics only, never image quality.
 */
export async function auditSavedBatch(
  look: LookRecipe,
  inputs: readonly AuditInput[],
  engine: Engine,
  expected: number,
  options: AuditOptions = {},
): Promise<SaveAudit> {
  if (!Number.isSafeInteger(expected) || expected < 1 || expected > 1000 || inputs.length > expected) {
    throw new RangeError("save audit needs 1 to 1000 declared outputs");
  }
  const plan = await createProofPlan(look, expected);
  const ledger = new ProofLedger(expected);
  let processed = 0;
  let inspected = 0;
  let passed = 0;
  let failed = 0;
  for (const input of inputs) {
    if (options.abort?.aborted) break;
    const replay = proveReplay(look, input.pixels, engine, options);
    ledger.add(processed, replay);
    processed++;
    if (input.encoded !== undefined) {
      const exportProof = inspectExport(input.encoded);
      inspected++;
      if (exportProof.status === "PASS") passed++;
      else failed++;
    }
  }
  const replay = bindReport(plan, ledger.summary());
  const counts: ExportCounts = {
    expected,
    inspected,
    passed,
    failed,
    missing: expected - inspected,
  };
  let status: ProofStatus = "PASS";
  if (replay.status === "FAIL" || failed > 0) status = "FAIL";
  else if (replay.status === "UNPROVEN" || counts.missing > 0) status = "UNPROVEN";
  return { format: AUDIT_FORMAT, status, replay, exports: counts, processed };
}

/** Reject tampered count summaries before printing or importing the report. */
export function validateSaveAudit(raw: unknown): SaveAudit {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new TypeError("invalid save audit");
  const data = raw as Record<string, unknown>;
  const fields = ["format", "status", "replay", "exports", "processed"];
  if (Object.keys(data).length !== fields.length || fields.some((field) => !Object.hasOwn(data, field))) {
    throw new TypeError("unregistered save audit fields");
  }
  if (data.format !== AUDIT_FORMAT || !data.replay || typeof data.replay !== "object") {
    throw new TypeError("unknown save audit schema");
  }
  const rawReplay = data.replay as Record<string, unknown>;
  const replay = bindReport(rawReplay.plan, rawReplay.report);
  if (rawReplay.status !== replay.status || rawReplay.format !== "beljour-save-proof-bundle/1") {
    throw new TypeError("inconsistent replay proof");
  }
  const rawCounts = data.exports;
  if (!rawCounts || typeof rawCounts !== "object" || Array.isArray(rawCounts)) {
    throw new TypeError("invalid export counts");
  }
  const counts = rawCounts as Record<string, unknown>;
  const names = ["expected", "inspected", "passed", "failed", "missing"];
  if (Object.keys(counts).length !== names.length || names.some((key) => !Object.hasOwn(counts, key))) {
    throw new TypeError("unexpected export count fields");
  }
  for (const name of names) {
    if (!Number.isSafeInteger(counts[name]) || (counts[name] as number) < 0) {
      throw new TypeError("invalid export count");
    }
  }
  if (!Number.isSafeInteger(data.processed) || (data.processed as number) < 0 ||
    (data.processed as number) > replay.plan.declaredItems) {
    throw new TypeError("invalid processed count");
  }
  const expected = replay.plan.declaredItems;
  const inspected = counts.inspected as number;
  const passed = counts.passed as number;
  const failed = counts.failed as number;
  const missing = counts.missing as number;
  if (counts.expected !== expected || inspected + missing !== expected ||
    passed + failed !== inspected || inspected > (data.processed as number) ||
    replay.report.counts.completed !== data.processed) {
    throw new TypeError("export count accounting mismatch");
  }
  const status: ProofStatus = replay.status === "FAIL" || failed > 0
    ? "FAIL"
    : replay.status === "UNPROVEN" || missing > 0
      ? "UNPROVEN"
      : "PASS";
  if (data.status !== status) throw new TypeError("audit verdict unsupported by source counts");
  return {
    format: AUDIT_FORMAT,
    status,
    replay,
    exports: { expected, inspected, passed, failed, missing },
    processed: data.processed as number,
  };
}

export function exportProofStatus(result: SaveAudit): ExportProofStatus {
  if (result.exports.failed > 0) return "FAIL";
  if (result.exports.missing > 0) return "UNPROVEN";
  return "PASS";
}
