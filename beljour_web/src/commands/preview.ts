/** Explicit scheduling to prevent stale edits from painting or exporting.
 * Author: John Khan.
 */
import { ProPlan, RenderQuality } from './plan.js';
import { PixelFrame, ProBrowserRuntime, ProRenderError, RunSummary } from './runtime.js';

export interface PreviewTicket {
  readonly revision: number;
  readonly photoGeneration: number;
  readonly plan: ProPlan;
  readonly quality: RenderQuality;
  readonly notBeforeMs: number;
  readonly controller: AbortController;
}

export class ProPreviewCoordinator {
  private revision = 0;
  private photoGeneration = 0;
  private original: PixelFrame | null = null;
  private sourceKey = '';
  private pending: PreviewTicket | null = null;

  constructor(
    private readonly runtime: ProBrowserRuntime,
    private readonly clock: () => number = () => performance.now(),
    private readonly debounceMs = 60,
    private readonly previewEdge = 512,
  ) {
    if (!Number.isInteger(debounceMs) || debounceMs < 0 || debounceMs > 500 ||
        !Number.isInteger(previewEdge) || previewEdge < 64 || previewEdge > 2048) {
      throw new ProRenderError('invalid_preview_budget', 'Preview scheduler limits are invalid.');
    }
  }

  openPhoto(frame: PixelFrame, opaqueContentKey: string): void {
    this.closePhoto();
    this.original = frame;
    this.sourceKey = opaqueContentKey;
  }

  closePhoto(): void {
    this.pending?.controller.abort();
    this.pending = null;
    this.original = null;
    this.sourceKey = '';
    this.revision++;
    this.photoGeneration++;
    this.runtime.clearPhoto();
  }

  request(plan: ProPlan, quality: RenderQuality = 'preview'): PreviewTicket {
    if (this.original === null) {
      throw new ProRenderError('photo_missing', 'Open a photo before editing.');
    }
    this.pending?.controller.abort();
    this.revision++;
    const ticket: PreviewTicket = {
      revision: this.revision,
      photoGeneration: this.photoGeneration,
      plan,
      quality,
      notBeforeMs: this.clock() + (quality === 'preview' ? this.debounceMs : 0),
      controller: new AbortController(),
    };
    this.pending = ticket;
    return ticket;
  }

  isCurrent(ticket: PreviewTicket): boolean {
    return this.pending === ticket && ticket.revision === this.revision &&
      ticket.photoGeneration === this.photoGeneration && this.original !== null &&
      !ticket.controller.signal.aborted;
  }

  isReady(ticket: PreviewTicket): boolean {
    return this.isCurrent(ticket) && this.clock() >= ticket.notBeforeMs;
  }

  async renderReady(
    ticket: PreviewTicket,
    previewScaler: (original: PixelFrame, maximumEdge: number) => PixelFrame,
  ): Promise<RunSummary> {
    if (!this.isCurrent(ticket)) {
      throw new ProRenderError('stale_preview', 'A newer edit replaced this request.');
    }
    if (!this.isReady(ticket)) {
      throw new ProRenderError('preview_debouncing', 'The request is still debouncing.');
    }
    const original = this.original;
    if (original === null) {
      throw new ProRenderError('photo_missing', 'Photo is no longer available.');
    }
    const source = ticket.quality === 'preview' &&
      Math.max(original.width, original.height) > this.previewEdge ?
      previewScaler(original, this.previewEdge) : original;
    const result = await this.runtime.run(
      ticket.plan,
      source,
      ticket.quality,
      this.sourceKey,
      ticket.controller.signal,
      () => this.isCurrent(ticket),
    );
    if (!this.isCurrent(ticket)) {
      throw new ProRenderError('stale_preview', 'The request changed while rendering.');
    }
    this.pending = null;
    return result;
  }
}
