/** In-memory operator checks; every manual mark is self-reported, never verified. */
import {
  OPERATOR_ROUTE_IDS,
  operatorRoutes,
  validRefusal,
  type OperatorCheck,
  type OperatorCounts,
  type OperatorRefusal,
  type OperatorResult,
} from "./operator-contract.js";
import { OperatorClock, type OperatorClockReading } from "./operator-timer.js";
import type { RealDemoRouteId } from "../judge-live-routes.js";

export interface OperatorSnapshot {
  readonly rows: readonly OperatorCheck[];
  readonly counts: OperatorCounts;
  readonly clock: OperatorClockReading;
  readonly sourceRevision: number;
  readonly sessionVersion: number;
}

interface OperatorMutable {
  result: OperatorResult;
  refusal: OperatorRefusal | null;
  elapsedMs: number | null;
}

export class OperatorRehearsal {
  private readonly values = new Map<RealDemoRouteId, OperatorMutable>();
  private readonly routes = operatorRoutes();
  private sourceRevision = 0;
  private version = 0;
  private disposed = false;
  readonly clock: OperatorClock;

  constructor(now: () => number) {
    this.clock = new OperatorClock(now);
    this.resetRows();
  }

  private assertLive(): void {
    if (this.disposed) throw new Error("Operator rehearsal ended");
  }

  private resetRows(): void {
    this.values.clear();
    for (const id of OPERATOR_ROUTE_IDS) {
      this.values.set(id, { result: "not-started", refusal: null, elapsedMs: null });
    }
  }

  /** Source, subject or consent changes revoke all manual marks. */
  reset(sourceRevision: number): void {
    this.assertLive();
    if (!Number.isInteger(sourceRevision) || sourceRevision < 0) {
      throw new RangeError("Source revision must be non-negative");
    }
    this.sourceRevision = sourceRevision;
    this.version += 1;
    this.resetRows();
    this.clock.reset();
  }

  start(): void {
    this.assertLive();
    this.clock.start();
  }

  private update(id: RealDemoRouteId, outcome: OperatorResult, refusal: OperatorRefusal | null): boolean {
    this.assertLive();
    const old = this.values.get(id);
    if (!old) throw new RangeError("Unknown operator check");
    if (this.clock.snapshot().status === "idle") return false;
    if (this.clock.snapshot().status === "stopped") return false;
    const elapsedMs = this.clock.snapshot().activeMs;
    this.values.set(id, { result: outcome, refusal, elapsedMs });
    this.version += 1;
    return true;
  }

  open(id: RealDemoRouteId): boolean {
    const current = this.values.get(id);
    if (!current) throw new RangeError("Unknown operator check");
    if (current.result === "self-reported") return false;
    return this.update(id, "opened", null);
  }

  /** Human checked the separate page; no API or quality evidence is asserted. */
  acknowledge(id: RealDemoRouteId): boolean {
    const current = this.values.get(id);
    if (!current) throw new RangeError("Unknown operator check");
    if (current.result !== "opened") return false;
    return this.update(id, "self-reported", null);
  }

  refuse(id: RealDemoRouteId, reason: OperatorRefusal): boolean {
    if (!validRefusal(reason)) throw new RangeError("Unknown refusal reason");
    return this.update(id, "refused", reason);
  }

  clear(id: RealDemoRouteId): boolean {
    this.assertLive();
    if (!this.values.has(id)) throw new RangeError("Unknown operator check");
    this.values.set(id, { result: "not-started", refusal: null, elapsedMs: null });
    this.version += 1;
    return true;
  }

  get snapshot(): OperatorSnapshot {
    this.assertLive();
    const rows = this.routes.map((route) => {
      const row = this.values.get(route.id);
      if (!row) throw new Error("Operator check missing");
      return Object.freeze({
        ...route,
        result: row.result,
        refusal: row.refusal,
        elapsedMs: row.elapsedMs,
        liveVerified: false as const,
      });
    });
    const counts = this.counts(rows);
    return Object.freeze({
      rows: Object.freeze(rows),
      counts,
      clock: this.clock.snapshot(),
      sourceRevision: this.sourceRevision,
      sessionVersion: this.version,
    });
  }

  private counts(rows: readonly OperatorCheck[]): OperatorCounts {
    const tally = (result: OperatorResult): number => rows.filter((row) => row.result === result).length;
    return Object.freeze({
      total: rows.length,
      notStarted: tally("not-started"),
      opened: tally("opened"),
      selfReported: tally("self-reported"),
      refused: tally("refused"),
      providerProved: false,
      realFaceProved: false,
      releaseProved: false,
    });
  }

  dispose(): void {
    if (this.disposed) return;
    this.resetRows();
    this.clock.dispose();
    this.disposed = true;
  }
}
