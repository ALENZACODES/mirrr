/** Device-local timing samples; no wall-clock CI pass/fail from synthetic frames. */
export interface TourTimingSample {
  readonly phase: "preview" | "export";
  readonly elapsedMs: number;
}

export interface TourTimingSummary {
  readonly phase: TourTimingSample["phase"];
  readonly count: number;
  readonly medianMs: number | null;
  readonly p95Ms: number | null;
  readonly budgetMs: number;
  readonly measured: boolean;
  readonly budgetExceeded: boolean | null;
}

const MAX_SAMPLES = 64;

export function percentile(values: readonly number[], position: number): number | null {
  if (!values.length) return null;
  if (!Number.isFinite(position) || position < 0 || position > 1) {
    throw new RangeError("Percentile outside 0 to 1");
  }
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new RangeError("Invalid measured duration");
  }
  const rank = (sorted.length - 1) * position;
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  return Math.round((sorted[lower] + (sorted[upper] - sorted[lower]) * (rank - lower)) * 10) / 10;
}

export class ContinuousTimings {
  private readonly samples: TourTimingSample[] = [];
  private disposed = false;

  record(phase: TourTimingSample["phase"], elapsedMs: number): void {
    if (this.disposed) throw new Error("Measurements ended");
    if (phase !== "preview" && phase !== "export") throw new RangeError("Unknown timing phase");
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0 || elapsedMs > 300_000) {
      throw new RangeError("Invalid timing observation");
    }
    if (this.samples.length >= MAX_SAMPLES) this.samples.shift();
    this.samples.push({ phase, elapsedMs: Math.round(elapsedMs * 10) / 10 });
  }

  summary(phase: TourTimingSample["phase"]): TourTimingSummary {
    const values = this.samples.filter((row) => row.phase === phase).map((row) => row.elapsedMs);
    const budgetMs = phase === "preview" ? 100 : 2000;
    const medianMs = percentile(values, 0.5);
    const p95Ms = percentile(values, 0.95);
    return {
      phase, count: values.length, medianMs, p95Ms, budgetMs,
      measured: values.length > 0,
      budgetExceeded: p95Ms === null ? null : p95Ms > budgetMs,
    };
  }

  snapshots(): readonly TourTimingSample[] {
    return this.samples.map((row) => ({ ...row }));
  }

  reset(): void {
    this.samples.splice(0);
  }

  dispose(): void {
    this.reset();
    this.disposed = true;
  }
}

export function performanceText(summary: TourTimingSummary): string {
  if (!summary.measured) return `${summary.phase}: unmeasured (${summary.budgetMs}ms reference)`;
  return `${summary.phase}: median ${summary.medianMs}ms, p95 ${summary.p95Ms}ms `
    + `over ${summary.count} observations; reference ${summary.budgetMs}ms`;
}
