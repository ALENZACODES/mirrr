/** Browser-only, opt-in CPU/Canvas reference. Does not use fetch or user photos. */
import { buildTimingReport, type TimingReport } from "./timing-report.js";
import { FULL_WORKLOAD, PREVIEW_WORKLOAD, type TimingWorkload } from "./timing-statistics.js";

export interface TimingOptions {
  readonly iterations?: number;
  readonly signal?: AbortSignal;
  readonly clock?: () => number;
  readonly onProgress?: (done: number, total: number) => void;
  readonly environment?: TimingReport["environment"];
  readonly cpuThrottleFactor?: number | null;
}

/** A predictable image, independent of the user's camera or local files. */
export function drawTimingScene(ctx: CanvasRenderingContext2D, workload: TimingWorkload, index: number): void {
  const { width, height } = workload;
  ctx.fillStyle = "#F5F5FA";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#000091";
  ctx.fillRect(0, 0, width, Math.ceil(height / 40));
  ctx.fillStyle = "#CDCEDE";
  ctx.fillRect(width / 6, height / 7, width * 2 / 3, height * 5 / 7);
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = "#273F77";
  ctx.beginPath();
  ctx.ellipse(width / 2, height / 2, width / 4, height / 3, index / 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "#000091";
  ctx.lineWidth = Math.max(2, width / 250);
  for (let row = 0; row < 8; row += 1) {
    ctx.beginPath();
    ctx.moveTo(width / 8, height * (row + 1) / 10);
    ctx.lineTo(width * 7 / 8, height * (row + 1) / 10);
    ctx.stroke();
  }
  ctx.font = `600 ${Math.max(16, Math.round(width / 32))}px sans-serif`;
  ctx.fillStyle = "#1B1B35";
  ctx.fillText("SYNTHETIC · TIMING ONLY", width / 10, height * 9 / 10);
}

function assertActive(signal?: AbortSignal): void {
  if (signal?.aborted) throw new Error("Timing run cancelled");
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export async function measureSyntheticTiming(doc: Document, options: TimingOptions = {}): Promise<TimingReport> {
  const iterations = options.iterations ?? 7;
  if (!Number.isInteger(iterations) || iterations < 3 || iterations > 30) {
    throw new RangeError("Choose 3–30 timing iterations");
  }
  const clock = options.clock ?? (() => performance.now());
  const canvas = doc.createElement("canvas");
  const preview: number[] = [];
  const full: number[] = [];
  let finished = 0;
  const total = iterations * 2;
  try {
    for (const workload of [PREVIEW_WORKLOAD, FULL_WORKLOAD]) {
      for (let index = 0; index < iterations; index += 1) {
        assertActive(options.signal);
        canvas.width = workload.width;
        canvas.height = workload.height;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) throw new Error("This browser cannot provide a 2D Canvas timing context.");
        const before = clock();
        drawTimingScene(ctx, workload, index);
        // Force all drawing to finish before stopping the clock on this canvas.
        const pixel = ctx.getImageData(0, 0, 1, 1);
        if (pixel.data.length !== 4) throw new Error("Canvas readback failed");
        const elapsed = clock() - before;
        if (!Number.isFinite(elapsed) || elapsed < 0) throw new Error("Invalid device clock");
        (workload === PREVIEW_WORKLOAD ? preview : full).push(elapsed);
        finished += 1;
        options.onProgress?.(finished, total);
        await yieldToBrowser();
      }
    }
    assertActive(options.signal);
    return buildTimingReport(preview, full, options.environment ?? "browser", options.cpuThrottleFactor ?? null);
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}
