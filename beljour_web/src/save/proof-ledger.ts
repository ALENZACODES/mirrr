/** Count-only, privacy-first ledger for local saved-look replay checks.
 *
 * The ledger never stores the input photo, photo hash, filename, identity,
 * face coordinates or per-face identifier. Integer slot numbers are transient
 * progress indices, not stable identifiers for the people in the photos.
 * Author: John Khan.
 */

import { PROOF_CHECKS, PROOF_FORMAT, safeProof, type ProofStatus, type ReplayProof } from "./proof.js";

export const LEDGER_FORMAT = "beljour-save-proof-ledger/1";
const MAX_ITEMS = 100_000;

export interface LedgerCounts {
  readonly total: number;
  readonly completed: number;
  readonly passed: number;
  readonly failed: number;
  readonly unproven: number;
  readonly missing: number;
}

export interface SlotVerdict {
  readonly index: number;
  readonly status: ProofStatus;
  readonly failedChecks: number;
  readonly unprovenChecks: number;
}

export interface LedgerReport {
  readonly format: typeof LEDGER_FORMAT;
  readonly status: ProofStatus;
  readonly counts: LedgerCounts;
  readonly checks: Readonly<Record<string, LedgerCounts>>;
  readonly ready: boolean;
}

function validTotal(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0 && value <= MAX_ITEMS;
}

function countStatuses(statuses: readonly ProofStatus[], total: number): LedgerCounts {
  const passed = statuses.filter((status) => status === "PASS").length;
  const failed = statuses.filter((status) => status === "FAIL").length;
  const unproven = statuses.filter((status) => status === "UNPROVEN").length;
  const completed = statuses.length;
  return { total, completed, passed, failed, unproven, missing: total - completed };
}

function verdict(counts: LedgerCounts): ProofStatus {
  if (counts.failed > 0) return "FAIL";
  if (counts.missing > 0 || counts.unproven > 0) return "UNPROVEN";
  return "PASS";
}

/**
 * A proof from an interrupted batch can be added later at its original slot.
 * Duplicates, outside indices, and forged or noncanonical rows fail closed.
 */
export class ProofLedger {
  private readonly entries = new Map<number, ReplayProof>();
  readonly total: number;

  constructor(total: number) {
    if (!validTotal(total)) throw new RangeError("proof ledger needs 1 to 100000 slots");
    this.total = total;
  }

  add(index: number, proof: ReplayProof): void {
    if (!Number.isSafeInteger(index) || index < 0 || index >= this.total) {
      throw new RangeError("proof slot is out of range");
    }
    if (this.entries.has(index)) throw new Error("proof slot already recorded");
    this.entries.set(index, safeProof(proof));
  }

  has(index: number): boolean {
    return this.entries.has(index);
  }

  checked(): number {
    return this.entries.size;
  }

  summary(): LedgerReport {
    const rows = Array.from(this.entries.values());
    const counts = countStatuses(rows.map((entry) => entry.status), this.total);
    const checks: Record<string, LedgerCounts> = {};
    for (const check of PROOF_CHECKS) {
      const statuses = rows.map((entry) => {
        const found = entry.checks.find((part) => part.check === check);
        if (!found) throw new Error("a proof is missing a registered check");
        return found.status;
      });
      checks[check] = countStatuses(statuses, this.total);
    }
    return {
      format: LEDGER_FORMAT,
      status: verdict(counts),
      counts,
      checks,
      ready: counts.missing === 0 && counts.failed === 0 && counts.unproven === 0,
    };
  }

  /** Aggregate-only data, with no individual slot numbers in the report. */
  toJSON(): LedgerReport {
    return this.summary();
  }

  /** Merge independent worker runs after ensuring they have disjoint slots. */
  merge(other: ProofLedger): void {
    if (other.total !== this.total) throw new Error("proof ledger total changed");
    for (const index of other.entries.keys()) {
      if (this.entries.has(index)) throw new Error("overlapping proof slots");
    }
    for (const [index, proof] of other.entries) this.entries.set(index, safeProof(proof));
  }

  slot(index: number): SlotVerdict | null {
    if (!Number.isSafeInteger(index) || index < 0 || index >= this.total) return null;
    const entry = this.entries.get(index);
    if (!entry) return null;
    return {
      index,
      status: entry.status,
      failedChecks: entry.checks.filter((item) => item.status === "FAIL").length,
      unprovenChecks: entry.checks.filter((item) => item.status === "UNPROVEN").length,
    };
  }
}

function parseCounts(raw: unknown, expectedTotal: number): LedgerCounts {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new TypeError("invalid ledger counts");
  const values = raw as Record<string, unknown>;
  const keys = ["total", "completed", "passed", "failed", "unproven", "missing"];
  if (Object.keys(values).length !== keys.length || keys.some((key) => !Object.hasOwn(values, key))) {
    throw new TypeError("ledger count keys differ");
  }
  for (const key of keys) {
    if (!Number.isSafeInteger(values[key]) || (values[key] as number) < 0) {
      throw new TypeError("invalid ledger count number");
    }
  }
  const result = values as unknown as LedgerCounts;
  if (result.total !== expectedTotal || result.completed + result.missing !== expectedTotal ||
    result.passed + result.failed + result.unproven !== result.completed) {
    throw new TypeError("ledger counts do not reconcile");
  }
  return {
    total: result.total,
    completed: result.completed,
    passed: result.passed,
    failed: result.failed,
    unproven: result.unproven,
    missing: result.missing,
  };
}

/** Validate a serialized aggregate, never accepting a claimed PASS by itself. */
export function validateLedger(raw: unknown): LedgerReport {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new TypeError("invalid ledger report");
  const value = raw as Record<string, unknown>;
  if (Object.keys(value).length !== 5 ||
    ["format", "status", "counts", "checks", "ready"].some((key) => !Object.hasOwn(value, key))) {
    throw new TypeError("ledger fields differ from schema");
  }
  if (value.format !== LEDGER_FORMAT || !value.counts || typeof value.counts !== "object") {
    throw new TypeError("unknown ledger format");
  }
  const countsObj = value.counts as Record<string, unknown>;
  const total = countsObj.total;
  if (typeof total !== "number" || !validTotal(total)) throw new TypeError("invalid ledger total");
  const counts = parseCounts(value.counts, total);
  if (!value.checks || typeof value.checks !== "object" || Array.isArray(value.checks)) {
    throw new TypeError("invalid ledger checks");
  }
  const rawChecks = value.checks as Record<string, unknown>;
  if (Object.keys(rawChecks).length !== PROOF_CHECKS.length ||
    PROOF_CHECKS.some((check) => !Object.hasOwn(rawChecks, check))) {
    throw new TypeError("ledger check set differs");
  }
  const checks: Record<string, LedgerCounts> = {};
  for (const name of PROOF_CHECKS) {
    const entry = parseCounts(rawChecks[name], total);
    if (entry.completed !== counts.completed) throw new TypeError("ledger check has wrong denominator");
    checks[name] = entry;
  }
  const status = verdict(counts);
  const ready = status === "PASS" && counts.missing === 0;
  if (value.status !== status || value.ready !== ready) {
    throw new TypeError("ledger claims a verdict unsupported by the counts");
  }
  if (counts.passed > 0 && PROOF_CHECKS.some((name) => checks[name].passed < counts.passed)) {
    throw new TypeError("ledger PASS exceeds the passing check population");
  }
  return { format: LEDGER_FORMAT, status, counts, checks, ready };
}

/** Machine-readable row schema name for downstream local-only proof exporters. */
export function isReplayProof(raw: unknown): boolean {
  try {
    return safeProof(raw).format === PROOF_FORMAT;
  } catch {
    return false;
  }
}
