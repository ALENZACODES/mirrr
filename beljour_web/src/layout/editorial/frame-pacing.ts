/** Opt-in browser frame pacing, independent of processing benchmarks. Author: John Khan. */

export interface FrameTickClock {
  request(callback: FrameRequestCallback): number;
  cancel(handle: number): void;
  visible(): boolean;
}

export type PacingOutcome = "measured" | "cancelled" | "unavailable";

export interface FramePacingReport {
  readonly format: "beljour-editorial-pacing/1";
  readonly outcome: PacingOutcome;
  readonly samples: number;
  readonly medianMs: number | null;
  readonly p95Ms: number | null;
  readonly fpsTargetMs: 16.7;
  readonly editorPerformanceVerified: false;
}

const TARGET = 16.7 as const;
const REPORT = "beljour-editorial-pacing/1" as const;

function unavailable(outcome: "unavailable" | "cancelled"): FramePacingReport {
  return {
    format: REPORT,
    outcome,
    samples: 0,
    medianMs: null,
    p95Ms: null,
    fpsTargetMs: TARGET,
    editorPerformanceVerified: false,
  };
}

function percentile(values: readonly number[], fraction: number): number {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.max(0, Math.ceil(ordered.length * fraction) - 1)];
}

/** One deterministic calculation, without wall-clock assertions in CI. */
export function framePacingReport(intervals: readonly number[]): FramePacingReport {
  if (intervals.length < 10 || intervals.length > 120
    || intervals.some((value) => !Number.isFinite(value) || value <= 0 || value > 10_000)) {
    throw new RangeError("Invalid observed frame pacing data");
  }
  const median = percentile(intervals, 0.5);
  const p95 = percentile(intervals, 0.95);
  return {
    format: REPORT,
    outcome: "measured",
    samples: intervals.length,
    medianMs: Math.round(median * 100) / 100,
    p95Ms: Math.round(p95 * 100) / 100,
    fpsTargetMs: TARGET,
    editorPerformanceVerified: false,
  };
}

export function verifyFramePacingReport(value: unknown): FramePacingReport {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Invalid pacing report");
  }
  const row = value as Record<string, unknown>;
  const fields = ["format", "outcome", "samples", "medianMs", "p95Ms",
    "fpsTargetMs", "editorPerformanceVerified"];
  if (Object.keys(row).length !== fields.length
    || fields.some((field) => !(field in row))
    || row.format !== REPORT || row.editorPerformanceVerified !== false
    || row.fpsTargetMs !== TARGET
    || !["measured", "cancelled", "unavailable"].includes(String(row.outcome))) {
    throw new Error("Pacing report cannot assert editor verification");
  }
  if (row.outcome !== "measured") {
    if (row.samples !== 0 || row.medianMs !== null || row.p95Ms !== null) {
      throw new Error("Unmeasured pacing cannot have timing values");
    }
    return value as FramePacingReport;
  }
  if (!Number.isInteger(row.samples) || Number(row.samples) < 10 || Number(row.samples) > 120
    || typeof row.medianMs !== "number" || typeof row.p95Ms !== "number"
    || !Number.isFinite(row.medianMs) || !Number.isFinite(row.p95Ms)
    || row.medianMs <= 0 || row.medianMs > row.p95Ms || row.p95Ms > 10_000) {
    throw new Error("Invalid measured frame intervals");
  }
  return value as FramePacingReport;
}

/** Stops after a fixed number of animation frames; never starts without a click. */
export class EditorialPacingProbe {
  private active = false;
  private current: number | null = null;
  private previous: number | null = null;
  private intervals: number[] = [];
  private resolve: ((result: FramePacingReport) => void) | null = null;

  constructor(private readonly clock: FrameTickClock) {}

  get running(): boolean {
    return this.active;
  }

  start(sampleCount = 48): Promise<FramePacingReport> {
    if (this.active) throw new Error("Pacing check already running");
    if (!Number.isInteger(sampleCount) || sampleCount < 10 || sampleCount > 120) {
      throw new RangeError("Frame count must be between 10 and 120");
    }
    if (!this.clock.visible()) return Promise.resolve(unavailable("unavailable"));
    this.active = true;
    this.previous = null;
    this.intervals = [];
    return new Promise<FramePacingReport>((resolve) => {
      this.resolve = resolve;
      const tick: FrameRequestCallback = (timestamp): void => {
        if (!this.active) return;
        this.current = null;
        if (!this.clock.visible() || !Number.isFinite(timestamp)
          || (this.previous !== null && timestamp <= this.previous)) {
          this.finish(unavailable("unavailable"));
          return;
        }
        if (this.previous !== null) this.intervals.push(timestamp - this.previous);
        this.previous = timestamp;
        if (this.intervals.length === sampleCount) {
          try {
            this.finish(framePacingReport(this.intervals));
          } catch {
            this.finish(unavailable("unavailable"));
          }
        } else {
          this.current = this.clock.request(tick);
        }
      };
      this.current = this.clock.request(tick);
    });
  }

  cancel(): void {
    if (!this.active) return;
    if (this.current !== null) this.clock.cancel(this.current);
    this.finish(unavailable("cancelled"));
  }

  private finish(report: FramePacingReport): void {
    this.active = false;
    this.current = null;
    this.previous = null;
    this.intervals = [];
    const resolve = this.resolve;
    this.resolve = null;
    resolve?.(verifyFramePacingReport(report));
  }
}

/** Public platform capability only; requires no page permissions or network. */
export function frameClockForDocument(doc: Document): FrameTickClock | null {
  const view = doc.defaultView;
  if (!view || typeof view.requestAnimationFrame !== "function"
    || typeof view.cancelAnimationFrame !== "function") return null;
  return {
    request: (callback) => view.requestAnimationFrame(callback),
    cancel: (handle) => view.cancelAnimationFrame(handle),
    visible: () => doc.hidden !== true,
  };
}

export function pacingCaption(report: FramePacingReport): string {
  const value = verifyFramePacingReport(report);
  if (value.outcome === "cancelled") return "Local frame-pacing check cancelled.";
  if (value.outcome === "unavailable") return "Frame pacing unavailable in this browser state.";
  return `${value.samples} frames: median ${value.medianMs} ms, p95 ${value.p95Ms} ms. `
    + "16.7 ms is the 60fps frame interval reference, not proof of editor performance.";
}
