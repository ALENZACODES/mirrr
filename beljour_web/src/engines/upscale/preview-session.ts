/** Source-revision tickets for guarded upscale slider previews and releases.
 * Mirrors api/plumb_api/engines/upscale/preview_session.py and adds the async
 * side: every job runs with its own AbortSignal. A newer ticket of the same kind
 * aborts the older job, and only the newest, uncancelled ticket for the current
 * photo revision may deliver a result. Previews use a bounded copy (longest edge
 * 512) and are never exportable; releases are full size. Tickets hold settings
 * and counters only, never pixels. Author: John Khan.
 */
import { validateLevel } from "../../pro/strength.js";

export type TicketKind = "preview" | "release";
export const PREVIEW_MAX_EDGE = 512;

export interface UpscaleTicket {
  readonly kind: TicketKind;
  readonly revision: number;
  readonly sequence: number;
  readonly scale: 2 | 4;
  readonly detailLevel: number;
  readonly lockLevel: number;
  readonly width: number;
  readonly height: number;
  readonly fullResolution: boolean;
}

export interface TicketSettings {
  scale?: 2 | 4;
  detailLevel?: number;
  lockLevel?: number;
}

function checkedSide(value: number): number {
  if (!Number.isInteger(value) || value < 8 || value > 16_384) throw new RangeError("Invalid source dimensions");
  return value;
}

export function previewSize(width: number, height: number): { width: number; height: number } {
  checkedSide(width);
  checkedSide(height);
  const longest = Math.max(width, height);
  if (longest <= PREVIEW_MAX_EDGE) return { width, height };
  const factor = PREVIEW_MAX_EDGE / longest;
  return { width: Math.max(8, Math.round(width * factor)), height: Math.max(8, Math.round(height * factor)) };
}

export class UpscalePreviewSession {
  private source: string | null = null;
  private size = { width: 0, height: 0 };
  private currentRevision = 0;
  private sequence = 0;
  private readonly latest = new Map<TicketKind, number>();
  private readonly cancelled = new Set<number>();
  private readonly controllers = new Map<TicketKind, AbortController>();

  get revision(): number {
    return this.currentRevision;
  }

  open(sourceSha256: string, width: number, height: number): number {
    if (typeof sourceSha256 !== "string" || !/^[0-9a-f]{64}$/.test(sourceSha256)) {
      throw new RangeError("Source digest must be 64 lowercase hexadecimal characters");
    }
    previewSize(width, height);
    this.reset();
    this.source = sourceSha256;
    this.size = { width, height };
    return this.currentRevision;
  }

  close(): void {
    this.reset();
    this.source = null;
  }

  private reset(): void {
    for (const controller of this.controllers.values()) controller.abort();
    this.controllers.clear();
    this.latest.clear();
    this.cancelled.clear();
    this.currentRevision += 1;
  }

  private issue(kind: TicketKind, settings: TicketSettings): UpscaleTicket {
    if (this.source === null) throw new RangeError("No photo is open");
    const { scale = 2, detailLevel = 3.0, lockLevel = 5.0 } = settings;
    if (scale !== 2 && scale !== 4) throw new RangeError("Scale must be 2 or 4");
    const size = kind === "preview" ? previewSize(this.size.width, this.size.height) : this.size;
    const ticket: UpscaleTicket = Object.freeze({
      kind, revision: this.currentRevision, sequence: ++this.sequence, scale,
      detailLevel: validateLevel(detailLevel), lockLevel: validateLevel(lockLevel),
      width: size.width, height: size.height, fullResolution: kind === "release",
    });
    this.controllers.get(kind)?.abort();
    this.controllers.delete(kind);
    this.latest.set(kind, ticket.sequence);
    return ticket;
  }

  preview(settings: TicketSettings = {}): UpscaleTicket {
    return this.issue("preview", settings);
  }

  release(settings: TicketSettings = {}): UpscaleTicket {
    return this.issue("release", settings);
  }

  cancel(ticket: UpscaleTicket): void {
    this.cancelled.add(ticket.sequence);
    if (this.latest.get(ticket.kind) === ticket.sequence) this.controllers.get(ticket.kind)?.abort();
  }

  accepts(ticket: UpscaleTicket): boolean {
    return this.source !== null && ticket.revision === this.currentRevision &&
      this.latest.get(ticket.kind) === ticket.sequence && !this.cancelled.has(ticket.sequence);
  }

  exportable(ticket: UpscaleTicket): boolean {
    return ticket.kind === "release" && this.accepts(ticket);
  }

  /** Run the job for a current ticket; resolves to null if it went stale meanwhile. */
  async run<T>(ticket: UpscaleTicket, job: (signal: AbortSignal) => Promise<T>): Promise<T | null> {
    if (!this.accepts(ticket)) return null;
    const controller = new AbortController();
    this.controllers.get(ticket.kind)?.abort();
    this.controllers.set(ticket.kind, controller);
    try {
      const result = await job(controller.signal);
      return this.accepts(ticket) && !controller.signal.aborted ? result : null;
    } finally {
      if (this.controllers.get(ticket.kind) === controller) this.controllers.delete(ticket.kind);
    }
  }
}
