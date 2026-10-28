/** Revision-bound, single-user-action local export coordinator. Author: John Khan. */
import { captureExportTicket, stillCurrentExport, type ExportSource } from "./export-ticket.js";
import { inspectExportedPng, type CheckedPng } from "./export-png.js";
import type { TourRenderResult } from "./preview.js";

export type ExportPhase =
  | "idle"
  | "rendering"
  | "encoding"
  | "validating"
  | "download-requested"
  | "refused"
  | "cancelled"
  | "disposed";

export type ExportReason =
  | "none"
  | "invalid-permission"
  | "invalid-subject"
  | "render-failed"
  | "pixel-isolation"
  | "encoding-failed"
  | "invalid-png"
  | "changed-during-export"
  | "download-unavailable"
  | "already-running"
  | "operator-cancelled"
  | "disposed";

export interface ExportStatus {
  readonly phase: ExportPhase;
  readonly reason: ExportReason;
  readonly message: string;
  readonly pending: boolean;
  readonly attempt: number;
  readonly durationMs: number | null;
  readonly bytes: number | null;
  readonly verifiedByBrowser: false;
  readonly photoStored: false;
}

export interface ExportOutput {
  readonly file: Blob;
  readonly filename: "BELJOUR-FULL-BEAUTY-STUDIO-guided-simulation.png";
  readonly width: number;
  readonly height: number;
}

export interface ExportPort {
  current(): ExportSource;
  makeCanvas(): HTMLCanvasElement;
  render(target: HTMLCanvasElement, source: ExportSource): TourRenderResult;
  encode(target: HTMLCanvasElement): Promise<Blob>;
  verify?(file: Blob, width: number, height: number): Promise<CheckedPng>;
  requestDownload(output: ExportOutput): void;
  requested?(elapsedMs: number, output: ExportOutput): void;
  notify?(snapshot: ExportStatus): void;
  now?(): number;
}

const MESSAGES: Record<ExportReason, string> = {
  "none": "No export requested. The drawn source stays on this device.",
  "invalid-permission": "Export requires local consent and identity lock.",
  "invalid-subject": "No checked current drawn person is selected.",
  "render-failed": "The local illustration could not be rendered. Nothing was downloaded.",
  "pixel-isolation": "Export refused because bystander pixels were not certified unchanged.",
  "encoding-failed": "The browser could not encode the illustration.",
  "invalid-png": "The encoded file failed local PNG validation.",
  "changed-during-export": "The drawing, subject, settings or consent changed. Stale output was discarded.",
  "download-unavailable": "The browser download request was refused or unavailable.",
  "already-running": "The previous export is still being processed.",
  "operator-cancelled": "The pending export was cancelled. No new download was requested.",
  "disposed": "The demonstration is closed; its export has been cancelled.",
};

function initialStatus(): ExportStatus {
  return Object.freeze({
    phase: "idle", reason: "none", message: MESSAGES.none,
    pending: false, attempt: 0, durationMs: null, bytes: null,
    verifiedByBrowser: false, photoStored: false,
  });
}

function elapsed(now: () => number, started: number): number | null {
  const value = now() - started;
  if (!Number.isFinite(value) || value < 0 || value > 300_000) return null;
  return Math.round(value * 10) / 10;
}

/** Late Canvas callbacks cannot commit an earlier subject's export. */
export class ContinuousExportController {
  private readonly port: ExportPort;
  private readonly now: () => number;
  private generation = 0;
  private inFlight = 0;
  private attempts = 0;
  private state: ExportStatus = initialStatus();
  private disposed = false;
  private pendingCanvas: HTMLCanvasElement | null = null;

  constructor(port: ExportPort) {
    this.port = port;
    this.now = port.now ?? (() => performance.now());
  }

  get snapshot(): ExportStatus {
    return Object.freeze({ ...this.state });
  }

  private update(
    phase: ExportPhase, reason: ExportReason,
    durationMs: number | null = null, bytes: number | null = null,
  ): ExportStatus {
    this.state = Object.freeze({
      phase, reason,
      message: phase === "download-requested"
        ? "Labelled PNG download requested. Browser saving was not independently confirmed."
        : phase === "rendering" ? "Rendering the selected drawn person locally."
          : phase === "encoding" ? "Encoding a local PNG. No upload is running."
            : phase === "validating" ? "Checking PNG dimensions and integrity on this device."
              : MESSAGES[reason],
      pending: ["rendering", "encoding", "validating"].includes(phase),
      attempt: this.attempts,
      durationMs,
      bytes,
      verifiedByBrowser: false,
      photoStored: false,
    });
    this.port.notify?.(this.snapshot);
    return this.snapshot;
  }

  private current(token: number, ticket: ReturnType<typeof captureExportTicket>): boolean {
    if (this.disposed || token !== this.generation) return false;
    try {
      return stillCurrentExport(ticket, this.port.current());
    } catch {
      return false;
    }
  }

  private cancelled(token: number): ExportStatus {
    if (!this.disposed && token === this.generation) {
      return this.update("cancelled", "changed-during-export");
    }
    return this.snapshot;
  }

  async start(): Promise<ExportStatus> {
    if (this.disposed) return this.snapshot;
    if (this.state.pending || this.inFlight >= 2) {
      return Object.freeze({ ...this.snapshot,
        reason: "already-running" as const, message: MESSAGES["already-running"] });
    }
    let ticket: ReturnType<typeof captureExportTicket>;
    let source: ExportSource;
    try {
      source = this.port.current();
      ticket = captureExportTicket(source);
    } catch (error) {
      const reason: ExportReason = error instanceof RangeError || error instanceof TypeError
        ? "invalid-subject" : "invalid-permission";
      return this.update("refused", reason);
    }
    const token = ++this.generation;
    const started = this.now();
    this.attempts += 1;
    this.inFlight += 1;
    let target: HTMLCanvasElement | null = null;
    let stage: "rendering" | "encoding" | "validating" | "download" = "rendering";
    try {
      this.update("rendering", "none");
      target = this.port.makeCanvas();
      this.pendingCanvas = target;
      const rendered = this.port.render(target, source);
      if (rendered.visual !== "illustration" || !rendered.protectedBystanders) {
        return this.update("refused", "pixel-isolation");
      }
      if (target.width !== ticket.width || target.height !== ticket.height) {
        return this.update("refused", "render-failed");
      }
      if (!this.current(token, ticket)) return this.cancelled(token);
      stage = "encoding";
      this.update("encoding", "none");
      const blob = await this.port.encode(target);
      if (!this.current(token, ticket)) return this.cancelled(token);
      stage = "validating";
      this.update("validating", "none");
      const verified = await (this.port.verify ?? inspectExportedPng)(
        blob, ticket.width, ticket.height,
      );
      if (!this.current(token, ticket)) return this.cancelled(token);
      if (verified.width !== ticket.width || verified.height !== ticket.height
        || !verified.hasPixels || verified.hasTextMetadata) {
        return this.update("refused", "invalid-png");
      }
      stage = "download";
      const output: ExportOutput = {
        file: blob,
        filename: "BELJOUR-FULL-BEAUTY-STUDIO-guided-simulation.png",
        width: ticket.width,
        height: ticket.height,
      };
      this.port.requestDownload(output);
      if (!this.current(token, ticket)) return this.cancelled(token);
      const duration = elapsed(this.now, started);
      this.update("download-requested", "none", duration, verified.size);
      if (duration !== null) {
        try {
          this.port.requested?.(duration, output);
        } catch {
          // Post-download observations may fail without undoing a browser click.
        }
      }
      return this.snapshot;
    } catch {
      if (!this.current(token, ticket)) return this.cancelled(token);
      const reason: ExportReason = stage === "rendering" ? "render-failed"
        : stage === "encoding" ? "encoding-failed"
          : stage === "validating" ? "invalid-png" : "download-unavailable";
      return this.update("refused", reason);
    } finally {
      if (target) {
        target.width = 0;
        target.height = 0;
      }
      if (this.pendingCanvas === target) this.pendingCanvas = null;
      this.inFlight -= 1;
    }
  }

  /** Cancel immediately; already-queued encoders are ignored upon resolution. */
  cancel(): void {
    if (this.disposed || !this.state.pending) return;
    this.generation += 1;
    if (this.pendingCanvas) {
      this.pendingCanvas.width = 0;
      this.pendingCanvas.height = 0;
      this.pendingCanvas = null;
    }
    this.update("cancelled", "operator-cancelled");
  }

  /** Settings invalidation also prevents stale UI evidence. */
  invalidate(): void {
    if (this.disposed) return;
    if (this.state.pending) {
      this.cancel();
      return;
    }
    if (this.state.phase === "download-requested") {
      this.update("idle", "none");
    }
  }

  reset(): void {
    if (this.disposed) return;
    this.cancel();
    this.state = initialStatus();
    this.port.notify?.(this.snapshot);
  }

  dispose(): void {
    if (this.disposed) return;
    this.cancel();
    this.disposed = true;
    this.generation += 1;
    this.state = Object.freeze({
      ...initialStatus(), phase: "disposed", reason: "disposed", message: MESSAGES.disposed,
    });
  }
}
