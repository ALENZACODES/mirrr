/**
 * Filter jobs for the shell worker: full-size renders in tiles, with progress and cancellation.
 *
 * The shell worker protocol (ui/shell/worker-protocol.ts) unpacks the photo and hands each
 * {kind: "filter"} job to a FilterJobs runner. The runner works one tile at a time and yields
 * to the event loop between steps, so a {kind: "filter-cancel"} message (a new strength, a new
 * look, a closed page) stops it within one tile. Late answers to cancelled jobs are never sent.
 * Thumbnails stay on the strip's own job (small, synchronous); this path is for the full photo
 * and for export. Author: John Khan.
 */
import type { ParamValue, PhotoSource } from "../../ui/shell/types.js";
import type { RenderResult } from "./engine.js";
import { faceCentreFor, masksFor, recipeFor, settingsFor } from "./layer.js";
import { DEFAULT_TILE, TiledRender } from "./tiles.js";

export interface FilterRequest { parameters: Readonly<Record<string, ParamValue>>; strength: number; tile?: number }
export interface Progress { id: number; done: number; total: number }
export type FilterOutcome = { ok: true; result: RenderResult; ms: number; tiles: number } | { ok: false; error: string; cancelled: boolean };

export const yieldNow = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

export class FilterJobs {
  private readonly cancelled = new Set<number>();
  private readonly running = new Set<number>();
  constructor(private readonly yielder: () => Promise<void> = yieldNow, private readonly stepsPerYield = 1) {
    if (!(Number.isInteger(stepsPerYield) && stepsPerYield >= 1)) throw new RangeError("steps per yield must be a whole number from 1");
  }
  get active(): number { return this.running.size; }
  cancel(id: number): boolean {
    if (!this.running.has(id)) return false;
    this.cancelled.add(id);
    return true;
  }
  async run(id: number, source: PhotoSource, request: FilterRequest, onProgress: (p: Progress) => void = () => {},
    now: () => number = () => Date.now()): Promise<FilterOutcome> {
    if (!Number.isSafeInteger(id) || id < 0) {
      return { ok: false, error: "Invalid filter job ID", cancelled: false };
    }
    // The worker owns IDs for their entire lifetime. A concurrent reuse must
    // never clear the original job's cancellation flag in a later finally.
    if (this.running.has(id)) {
      return { ok: false, error: "Filter job ID already running", cancelled: false };
    }
    this.running.add(id);
    const start = now();
    try {
      const layer = { parameters: request.parameters, strength: request.strength };
      const masks = masksFor(source);
      const job = new TiledRender(source.image, recipeFor(layer), settingsFor(layer), masks, faceCentreFor(masks), request.tile ?? DEFAULT_TILE);
      let steps = 0;
      while (!job.done) {
        if (this.cancelled.has(id)) return { ok: false, error: "Cancelled", cancelled: true };
        job.step();
        if (++steps % this.stepsPerYield === 0) {
          onProgress({ id, done: job.completed, total: job.total });
          await this.yielder();
        }
      }
      if (this.cancelled.has(id)) return { ok: false, error: "Cancelled", cancelled: true };
      return { ok: true, result: job.result(), ms: now() - start, tiles: job.tiles.length };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error), cancelled: false };
    } finally {
      this.running.delete(id); this.cancelled.delete(id);
    }
  }
}
