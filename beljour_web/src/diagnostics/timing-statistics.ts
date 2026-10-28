/** Timing mathematics. Samples are device observations, not performance guarantees. */
export interface TimingDistribution {
  readonly count: number;
  readonly medianMs: number;
  readonly p95Ms: number;
  readonly minMs: number;
  readonly maxMs: number;
}

export function distribution(samples: readonly number[]): TimingDistribution {
  if (!Array.isArray(samples) || samples.length < 3 || samples.length > 50) {
    throw new RangeError("A timing distribution needs 3–50 observations");
  }
  const sorted = [...samples].sort((a, b) => a - b);
  if (sorted.some((x) => !Number.isFinite(x) || x < 0 || x > 600_000)) {
    throw new RangeError("Times must be finite nonnegative milliseconds");
  }
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const rank = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  return {
    count: sorted.length,
    medianMs: Math.round(median * 100) / 100,
    p95Ms: Math.round(sorted[rank] * 100) / 100,
    minMs: Math.round(sorted[0] * 100) / 100,
    maxMs: Math.round(sorted[sorted.length - 1] * 100) / 100,
  };
}

export interface TimingWorkload {
  readonly width: number;
  readonly height: number;
  readonly pixels: number;
  readonly label: string;
}

export const PREVIEW_WORKLOAD: TimingWorkload = Object.freeze({
  width: 512,
  height: 640,
  pixels: 512 * 640,
  label: "512 × 640 illustrative Canvas preview",
});

export const FULL_WORKLOAD: TimingWorkload = Object.freeze({
  width: 3000,
  height: 4000,
  pixels: 12_000_000,
  label: "12 MP illustrative Canvas raster",
});

export interface TimingBudget {
  readonly targetMs: number;
  readonly measuredMedianMs: number;
  readonly measuredP95Ms: number;
  readonly medianWithinTarget: boolean;
  readonly p95WithinTarget: boolean;
}

export function compareBudget(data: TimingDistribution, targetMs: number): TimingBudget {
  if (!Number.isFinite(targetMs) || targetMs <= 0) throw new RangeError("Invalid planning target");
  return {
    targetMs,
    measuredMedianMs: data.medianMs,
    measuredP95Ms: data.p95Ms,
    medianWithinTarget: data.medianMs <= targetMs,
    p95WithinTarget: data.p95Ms <= targetMs,
  };
}
