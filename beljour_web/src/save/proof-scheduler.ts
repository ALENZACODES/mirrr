/** Yielding, bounded-memory proof runner for locally saved looks.
 *
 * It takes one transient image at a time from a caller-owned source; it never
 * retains a frame or serializes a photo, source ID, path or per-person result.
 * A browser turn between chunks lets a cancellation request take effect.
 * Mechanical replay is not an appearance, identity or fairness evaluation.
 * Author: John Khan.
 */

import { type Engine } from "./looks.js";
import { type LookRecipe } from "./recipe.js";
import { inspectExport } from "./proof-export.js";
import { ProofLedger } from "./proof-ledger.js";
import { bindReport, createProofPlan } from "./proof-plan.js";
import { type AuditInput, type ExportCounts, type SaveAudit, AUDIT_FORMAT } from "./proof-service.js";
import { type ProofOptions, type ProofStatus, proveReplay } from "./proof.js";

export interface TransientBatchSource {
  /** Declared denominator. Unavailable records remain missing, not passing. */
  readonly declared: number;
  /** Actual number of accessible inputs at the time of the operation. */
  readonly available: number;
  /** Must return one transient input without retaining an application-wide copy. */
  read(index: number): AuditInput | Promise<AuditInput>;
  /** Optional volatile editing epoch; must not contain an identity or photo hash. */
  revision?(): number;
}

export interface SafeProgress {
  readonly format: "beljour-save-proof-progress/1";
  readonly expected: number;
  readonly completed: number;
  readonly passed: number;
  readonly failed: number;
  readonly unproven: number;
  readonly missing: number;
  readonly interrupted: boolean;
}

export type ProofYield = () => Promise<void>;

export interface ScheduledProofOptions extends ProofOptions {
  readonly abort?: AbortSignal;
  /** Number of completed items before returning control to the browser. */
  readonly chunkSize?: number;
  /** Injected for deterministic tests. Browser default uses a task, not a microtask. */
  readonly yieldControl?: ProofYield;
  /** Counts only; no photo, slot ID, recipe text, or engine output. */
  readonly onProgress?: (progress: SafeProgress) => void;
}

export type RunExit = "complete" | "aborted" | "source_changed";

export interface ScheduledSaveAudit {
  readonly audit: SaveAudit;
  readonly exit: RunExit;
  readonly progress: SafeProgress;
}

const MAX_LOCAL_BATCH = 1000;
const DEFAULT_CHUNK_SIZE = 2;

function validInteger(value: number, low: number, high: number): boolean {
  return Number.isSafeInteger(value) && value >= low && value <= high;
}

function validateSource(source: TransientBatchSource): void {
  if (!source || !validInteger(source.declared, 1, MAX_LOCAL_BATCH) ||
    !validInteger(source.available, 0, source.declared) || typeof source.read !== "function") {
    throw new RangeError("invalid transient proof source size or reader");
  }
  if (source.revision !== undefined && typeof source.revision !== "function") {
    throw new TypeError("invalid source revision reader");
  }
}

function progressRow(
  expected: number,
  completed: number,
  passed: number,
  failed: number,
  unproven: number,
  interrupted: boolean,
): SafeProgress {
  return {
    format: "beljour-save-proof-progress/1",
    expected,
    completed,
    passed,
    failed,
    unproven,
    missing: expected - completed,
    interrupted,
  };
}

/** Public progress can be consumed by UI without revealing even a slot index. */
export function validateSafeProgress(raw: unknown): SafeProgress {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new TypeError("invalid proof progress");
  const input = raw as Record<string, unknown>;
  const allowed = ["format", "expected", "completed", "passed", "failed", "unproven", "missing", "interrupted"];
  if (Object.keys(input).length !== allowed.length || allowed.some((key) => !Object.hasOwn(input, key))) {
    throw new TypeError("unexpected proof progress fields");
  }
  const expected = input.expected;
  const completed = input.completed;
  const passed = input.passed;
  const failed = input.failed;
  const unproven = input.unproven;
  const missing = input.missing;
  if (input.format !== "beljour-save-proof-progress/1" ||
    typeof expected !== "number" || !validInteger(expected, 1, MAX_LOCAL_BATCH) ||
    typeof completed !== "number" || !validInteger(completed, 0, expected) ||
    typeof passed !== "number" || !validInteger(passed, 0, expected) ||
    typeof failed !== "number" || !validInteger(failed, 0, expected) ||
    typeof unproven !== "number" || !validInteger(unproven, 0, expected) ||
    typeof missing !== "number" || !validInteger(missing, 0, expected) ||
    typeof input.interrupted !== "boolean" ||
    passed + failed + unproven !== completed || completed + missing !== expected) {
    throw new TypeError("inconsistent proof progress counts");
  }
  return progressRow(expected, completed, passed, failed, unproven, input.interrupted);
}

async function browserYield(): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

function sameRevision(source: TransientBatchSource, original: number | undefined): boolean {
  if (!source.revision) return true;
  const current = source.revision();
  if (!Number.isSafeInteger(current) || current < 0) throw new TypeError("invalid editor revision");
  return current === original;
}

function checkedRevision(source: TransientBatchSource): number | undefined {
  if (!source.revision) return undefined;
  const revision = source.revision();
  if (!Number.isSafeInteger(revision) || revision < 0) throw new TypeError("invalid editor revision");
  return revision;
}

/**
 * A cancelled run returns an incomplete UNPROVEN receipt. A stale source never
 * contributes an item that was read or rendered after the editing epoch changed.
 * Faulty input/engine output is counted as FAIL by proveReplay; exceptions from a
 * faulty source are not converted into an invented successful result.
 */
export async function auditScheduledBatch(
  recipe: LookRecipe,
  source: TransientBatchSource,
  engine: Engine,
  options: ScheduledProofOptions = {},
): Promise<ScheduledSaveAudit> {
  validateSource(source);
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  if (!validInteger(chunkSize, 1, MAX_LOCAL_BATCH)) throw new RangeError("invalid proof chunk size");
  const yieldControl = options.yieldControl ?? browserYield;
  const revision = checkedRevision(source);
  const expected = source.declared;
  const plan = await createProofPlan(recipe, expected);
  const ledger = new ProofLedger(expected);
  let completed = 0;
  let passed = 0;
  let failed = 0;
  let unproven = 0;
  let exportsInspected = 0;
  let exportsPassed = 0;
  let exportsFailed = 0;
  let exit: RunExit = "complete";

  const reportProgress = (interrupted: boolean): SafeProgress => {
    const row = progressRow(expected, completed, passed, failed, unproven, interrupted);
    options.onProgress?.(row);
    return row;
  };
  reportProgress(false);

  for (let index = 0; index < source.available; index++) {
    if (options.abort?.aborted) {
      exit = "aborted";
      break;
    }
    if (!sameRevision(source, revision)) {
      exit = "source_changed";
      break;
    }
    if (index > 0 && index % chunkSize === 0) {
      await yieldControl();
      if (options.abort?.aborted) {
        exit = "aborted";
        break;
      }
      if (!sameRevision(source, revision)) {
        exit = "source_changed";
        break;
      }
    }
    const input = await source.read(index);
    if (options.abort?.aborted) {
      exit = "aborted";
      break;
    }
    if (!sameRevision(source, revision)) {
      exit = "source_changed";
      break;
    }
    const replay = proveReplay(recipe, input.pixels, engine, options);
    if (options.abort?.aborted) {
      exit = "aborted";
      break;
    }
    if (!sameRevision(source, revision)) {
      exit = "source_changed";
      break;
    }
    ledger.add(index, replay);
    completed++;
    if (replay.status === "PASS") passed++;
    else if (replay.status === "FAIL") failed++;
    else unproven++;
    if (input.encoded !== undefined) {
      const inspected = inspectExport(input.encoded);
      exportsInspected++;
      if (inspected.status === "PASS") exportsPassed++;
      else exportsFailed++;
    }
    reportProgress(false);
  }

  if (exit === "complete" && options.abort?.aborted) exit = "aborted";
  if (exit === "complete" && !sameRevision(source, revision)) exit = "source_changed";
  const replay = bindReport(plan, ledger.summary());
  const counts: ExportCounts = {
    expected,
    inspected: exportsInspected,
    passed: exportsPassed,
    failed: exportsFailed,
    missing: expected - exportsInspected,
  };
  let status: ProofStatus = "PASS";
  if (replay.status === "FAIL" || exportsFailed > 0) status = "FAIL";
  else if (replay.status === "UNPROVEN" || counts.missing > 0 || exit !== "complete") status = "UNPROVEN";
  const audit: SaveAudit = { format: AUDIT_FORMAT, status, replay, exports: counts, processed: completed };
  const progress = reportProgress(exit !== "complete");
  return { audit, exit, progress };
}

/** Bounded read-on-demand adapter. Keeps no additional copy of any frame. */
export function arrayBatchSource(inputs: readonly AuditInput[], declared: number): TransientBatchSource {
  if (!validInteger(declared, 1, MAX_LOCAL_BATCH) || inputs.length > declared) {
    throw new RangeError("input count exceeds local audit denominator");
  }
  return {
    declared,
    available: inputs.length,
    read(index: number): AuditInput {
      if (!validInteger(index, 0, inputs.length - 1)) throw new RangeError("unknown input slot");
      return inputs[index];
    },
  };
}
