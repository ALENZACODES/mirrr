/** Single-photo Pro UI composition; default identity comparison is mandatory.
 * No model loads, network, localStorage, photo persistence or provider calls.
 * Author: John Khan.
 */
import { CpuCleanup, CheckedSpot } from './cpu-cleanup.js';
import { CpuUpscale } from './cpu-upscale.js';
import { ProPlan, RenderQuality } from './plan.js';
import { PreviewTicket, ProPreviewCoordinator } from './preview.js';
import { CheckedRegions, PhotoRegions } from './regions.js';
import {
  checkedFrame, EffectPort, IdentityPort, PixelFrame, ProBrowserRuntime,
  ProRenderError, RenderBudget, RunSummary,
} from './runtime.js';

export type CheckedRegionSupplier = (frame: PixelFrame) => CheckedRegions | null;

export interface R2HSessionState {
  readonly photoOpen: boolean;
  readonly revision: number;
  readonly regionReads: number;
  readonly regionHits: number;
  readonly cachedBytes: number;
  readonly lastPlan: string | null;
}

export class R2HBrowserSession {
  private readonly regions = new PhotoRegions();
  private readonly runtime: ProBrowserRuntime;
  private readonly previews: ProPreviewCoordinator;
  private active: PixelFrame | null = null;
  private version = 0;
  private lastPlan: string | null = null;
  private cleanup: CpuCleanup | null = null;
  private upscale: CpuUpscale | null = null;
  private readonly undoStack: PixelFrame[] = [];
  private undoBytes = 0;

  constructor(
    identity: IdentityPort | null,
    extensions: Readonly<Partial<Record<'studioquality' | 'poseonly', EffectPort>>> = {},
    budget?: RenderBudget,
    clock: () => number = () => performance.now(),
  ) {
    const cleanup: EffectPort = async (frame, step, quality, signal) => {
      if (this.cleanup === null) throw new ProRenderError('photo_missing', 'Open a photo first.');
      if (step.level === 10) return frame;
      return this.cleanup.render(frame, step.level, quality === 'preview', signal);
    };
    const upscale: EffectPort = async (frame, step, quality, signal) => {
      if (this.upscale === null) throw new ProRenderError('photo_missing', 'Open a photo first.');
      return this.upscale.render(frame, step.scale, step.level, quality === 'preview', signal,
        step.level === 10);
    };
    this.runtime = new ProBrowserRuntime({ cleanup, upscale, ...extensions }, identity,
      budget, clock);
    this.previews = new ProPreviewCoordinator(this.runtime, clock);
  }

  openPhoto(source: PixelFrame, opaqueContentKey: string,
    supplier: CheckedRegionSupplier | null = null, checkedSpots: readonly CheckedSpot[] = []): void {
    checkedFrame(source);
    if (opaqueContentKey.length < 1 || opaqueContentKey.length > 128) {
      throw new ProRenderError('invalid_photo_key', 'Photo key must be nonempty and bounded.');
    }
    this.closePhoto();
    this.regions.open(source, supplier);
    this.active = { ...source, pixels: new Uint8Array(source.pixels) };
    this.cleanup = new CpuCleanup(this.regions, checkedSpots);
    this.upscale = new CpuUpscale(this.regions);
    this.version++;
    this.previews.openPhoto(this.active, opaqueContentKey);
  }

  closePhoto(): void {
    this.active = null;
    this.regions.close();
    this.previews.closePhoto();
    this.cleanup = null;
    this.upscale = null;
    this.lastPlan = null;
    this.version++;
    this.undoStack.length = 0;
    this.undoBytes = 0;
  }

  async run(plan: ProPlan, quality: RenderQuality = 'export',
    signal: AbortSignal = new AbortController().signal,
    current: () => boolean = () => true): Promise<RunSummary> {
    const source = this.active;
    if (source === null) throw new ProRenderError('photo_missing', 'Select a photo before editing.');
    const generation = this.version;
    const accepted = (): boolean => this.version === generation && current();
    const report = await this.runtime.run(plan, source, quality, `photo-generation-${generation}`,
      signal, accepted);
    if (!accepted()) throw new ProRenderError('stale_preview', 'Photo has changed.');
    this.lastPlan = plan.version;
    this.remember(source);
    return report;
  }

  request(plan: ProPlan, quality: RenderQuality = 'preview'): PreviewTicket {
    return this.previews.request(plan, quality);
  }

  async renderReady(ticket: PreviewTicket,
    previewScaler: (original: PixelFrame, edge: number) => PixelFrame): Promise<RunSummary> {
    const report = await this.previews.renderReady(ticket, previewScaler);
    this.lastPlan = ticket.plan.version;
    return report;
  }

  undo(): PixelFrame | null {
    const restored = this.undoStack.pop();
    if (restored === undefined) return null;
    this.undoBytes -= restored.pixels.byteLength;
    return { ...restored, pixels: new Uint8Array(restored.pixels) };
  }

  private remember(before: PixelFrame): void {
    if (before.pixels.byteLength > 32 * 1024 * 1024) return;
    while (this.undoStack.length > 0 &&
      this.undoBytes + before.pixels.byteLength > 32 * 1024 * 1024) {
      const oldest = this.undoStack.shift();
      if (oldest !== undefined) this.undoBytes -= oldest.pixels.byteLength;
    }
    this.undoStack.push({ ...before, pixels: new Uint8Array(before.pixels) });
    this.undoBytes += before.pixels.byteLength;
  }

  get state(): R2HSessionState {
    const stats = this.regions.stats;
    return {
      photoOpen: this.active !== null,
      revision: this.version,
      regionReads: stats.reads,
      regionHits: stats.hits,
      cachedBytes: this.runtime.cachedBytes + stats.retainedBytes,
      lastPlan: this.lastPlan,
    };
  }

  get cleanupMetrics(): ReturnType<typeof this.readCleanupMetrics> {
    return this.readCleanupMetrics();
  }

  private readCleanupMetrics(): CpuCleanup['lastMetrics'] {
    return this.cleanup?.lastMetrics ?? null;
  }

  get upscaleMetrics(): CpuUpscale['lastMetrics'] {
    return this.upscale?.lastMetrics ?? null;
  }
}
