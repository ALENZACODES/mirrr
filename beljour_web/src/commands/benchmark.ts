/** Deterministic-fixture local Pro timing harness for preview and export.
 * Synthetic-only results are not real-device or real-face release evidence.
 * Author: John Khan.
 */
import { ProPlan, RenderQuality } from './plan.js';
import { checkedFrame, PixelFrame, ProRenderError } from './runtime.js';

export interface BenchmarkCase {
  readonly plan: ProPlan;
  readonly width: number;
  readonly height: number;
  readonly channels: 3 | 4;
  readonly seed: number;
  readonly quality: RenderQuality;
  readonly repetitions: number;
  readonly warmups: number;
}

export interface BenchmarkReport {
  readonly version: 'beljour-pro-timing/1';
  readonly outcome: 'completed' | 'failed';
  readonly quality: RenderQuality;
  readonly inputWidth: number;
  readonly inputHeight: number;
  readonly outputWidth: number | null;
  readonly outputHeight: number | null;
  readonly sampleCount: number;
  readonly medianMs: number | null;
  readonly p95Ms: number | null;
  readonly maxMs: number | null;
  readonly budgetMs: number;
  readonly withinAssumedBudget: boolean | null;
  readonly failureCode: string | null;
  readonly syntheticOnly: true;
  readonly releaseQualified: false;
}

export type BenchmarkRenderer = (
  plan: ProPlan, source: PixelFrame, quality: RenderQuality,
  signal: AbortSignal,
) => Promise<PixelFrame>;

function boundedInt(value: unknown, lower: number, upper: number): boolean {
  return Number.isSafeInteger(value) && Number(value) >= lower && Number(value) <= upper;
}

export function syntheticBenchmarkFrame(
  width: number, height: number, channels: 3 | 4 = 3, seed = 7,
): PixelFrame {
  if (!boundedInt(width, 1, 24_000_000) || !boundedInt(height, 1, 24_000_000) ||
      width * height > 24_000_000 || (channels !== 3 && channels !== 4) ||
      !boundedInt(seed, 0, 2 ** 32 - 1)) {
    throw new ProRenderError('invalid_benchmark', 'Synthetic fixture settings are invalid.');
  }
  const pixels = new Uint8Array(width * height * channels);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * channels;
      const band = (Math.floor(x / 13) + Math.floor(y / 17)) % 2 ? 31 : 0;
      pixels[index] = (x * 3 + y * 5 + seed + band) % 256;
      pixels[index + 1] = (x * 7 + y * 2 + seed * 3 + band) % 256;
      pixels[index + 2] = (x * 2 + y * 11 + seed * 5 + band) % 256;
      if (channels === 4) pixels[index + 3] = (y * 13 + x * 17 + seed) % 256;
    }
  }
  return { width, height, channels, pixels };
}

function checkedCase(value: BenchmarkCase): void {
  if (!value || value.plan.version !== 'beljour-pro-plan/1' ||
      !boundedInt(value.width, 1, 24_000_000) ||
      !boundedInt(value.height, 1, 24_000_000) ||
      value.width * value.height > 24_000_000 ||
      !boundedInt(value.seed, 0, 2 ** 32 - 1) ||
      (value.channels !== 3 && value.channels !== 4) ||
      (value.quality !== 'preview' && value.quality !== 'export') ||
      !boundedInt(value.repetitions, 1, 100) || !boundedInt(value.warmups, 0, 20)) {
    throw new ProRenderError('invalid_benchmark', 'Benchmark case is invalid.');
  }
}

function percentile95(sorted: readonly number[]): number {
  const index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[index] ?? 0;
}

function median(sorted: readonly number[]): number {
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? 0;
  return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

export class ProBrowserBenchmark {
  constructor(
    private readonly renderer: BenchmarkRenderer,
    private readonly clock: () => number = () => performance.now(),
    private readonly previewBudgetMs = 100,
    private readonly exportBudgetMs = 2000,
  ) {
    if (typeof renderer !== 'function' || typeof clock !== 'function' ||
        !Number.isFinite(previewBudgetMs) || previewBudgetMs <= 0 ||
        !Number.isFinite(exportBudgetMs) || exportBudgetMs <= 0) {
      throw new ProRenderError('invalid_benchmark', 'Benchmark runner requires a renderer and budgets.');
    }
  }

  private async sample(
    item: BenchmarkCase, source: PixelFrame, signal: AbortSignal,
  ): Promise<{ image: PixelFrame; ms: number }> {
    if (signal.aborted) throw new ProRenderError('benchmark_cancelled', 'Benchmark cancelled.');
    const start = this.clock();
    const safe: PixelFrame = { ...source, pixels: new Uint8Array(source.pixels) };
    const output = checkedFrame(await this.renderer(item.plan, safe, item.quality, signal));
    const ms = this.clock() - start;
    if (!Number.isFinite(ms) || ms < 0) {
      throw new ProRenderError('invalid_benchmark_clock', 'Benchmark clock is invalid.');
    }
    if (signal.aborted) throw new ProRenderError('benchmark_cancelled', 'Benchmark cancelled.');
    return { image: output, ms };
  }

  async run(item: BenchmarkCase, signal: AbortSignal = new AbortController().signal): Promise<BenchmarkReport> {
    checkedCase(item);
    const source = syntheticBenchmarkFrame(item.width, item.height, item.channels, item.seed);
    const budget = item.quality === 'preview' ? this.previewBudgetMs : this.exportBudgetMs;
    const samples: number[] = [];
    let last: PixelFrame | null = null;
    let failure: string | null = null;
    try {
      for (let i = 0; i < item.warmups; i++) {
        last = (await this.sample(item, source, signal)).image;
      }
      for (let i = 0; i < item.repetitions; i++) {
        const result = await this.sample(item, source, signal);
        last = result.image;
        samples.push(result.ms);
      }
    } catch (error) {
      failure = error instanceof ProRenderError ? error.code : 'renderer_unavailable';
    }
    if (failure !== null || last === null || samples.length !== item.repetitions) {
      return Object.freeze({
        version: 'beljour-pro-timing/1', outcome: 'failed', quality: item.quality,
        inputWidth: item.width, inputHeight: item.height, outputWidth: null, outputHeight: null,
        sampleCount: samples.length, medianMs: null, p95Ms: null, maxMs: null,
        budgetMs: budget, withinAssumedBudget: null,
        failureCode: failure ?? 'benchmark_incomplete', syntheticOnly: true, releaseQualified: false,
      });
    }
    samples.sort((a, b) => a - b);
    const medianMs = median(samples);
    return Object.freeze({
      version: 'beljour-pro-timing/1', outcome: 'completed', quality: item.quality,
      inputWidth: item.width, inputHeight: item.height,
      outputWidth: last.width, outputHeight: last.height,
      sampleCount: samples.length, medianMs,
      p95Ms: percentile95(samples), maxMs: samples[samples.length - 1] ?? 0,
      budgetMs: budget, withinAssumedBudget: medianMs <= budget,
      failureCode: null, syntheticOnly: true, releaseQualified: false,
    });
  }
}
