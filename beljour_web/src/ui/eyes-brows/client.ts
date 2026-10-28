/** Own one cancellable worker and reject stale replies. Author: John Khan. */
import type { PreviewJob, PreviewResult } from "./session.js";

export interface LocalWorker {
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(data: unknown, transfer?: Transferable[]): void;
  terminate(): void;
}
export type WorkerFactory = () => LocalWorker;

export class PreviewCancelled extends Error {
  constructor() { super("This preview was replaced or cancelled."); this.name = "PreviewCancelled"; }
}

export class PreviewClient {
  private worker: LocalWorker | null = null;
  private pending: { id: number; resolve(result: PreviewResult): void; reject(error: Error): void } | null = null;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private closed = false;

  constructor(private readonly create: WorkerFactory = () => new Worker(new URL("./worker.js", import.meta.url), { type: "module" }),
    private readonly timeoutMs = 20_000) {
    if (!Number.isFinite(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) throw new RangeError("Invalid local preview timeout.");
  }

  run(job: PreviewJob): Promise<PreviewResult> {
    if (this.closed) return Promise.reject(new Error("The preview worker is closed."));
    this.cancel();
    return new Promise((resolve, reject) => {
      let worker: LocalWorker;
      try { worker = this.create(); } catch { reject(new Error("This browser cannot start a local preview worker.")); return; }
      this.worker = worker; this.pending = { id: job.id, resolve, reject };
      worker.onmessage = (event: MessageEvent) => {
        if (this.worker !== worker || !this.pending || this.pending.id !== event.data?.id) return;
        const pending = this.pending;
        this.release();
        if (event.data.ok === true) pending.resolve(event.data.result as PreviewResult);
        else pending.reject(new Error(typeof event.data.message === "string" ? event.data.message : "The local preview failed."));
      };
      worker.onerror = () => {
        if (this.worker !== worker) return;
        const pending = this.pending; this.release(); pending?.reject(new Error("The local preview worker stopped. Your original photo is safe."));
      };
      this.timeout = setTimeout(() => {
        if (this.worker !== worker) return;
        const pending = this.pending; this.release(); pending?.reject(new Error("This preview exceeded the local time limit. Reduce the image or effect detail."));
      }, this.timeoutMs);
      try {
        // job() owns a clone. Transferring it cannot detach the session's original.
        worker.postMessage(job, [job.image.data.buffer]);
      } catch {
        const pending = this.pending; this.release(); pending?.reject(new Error("The preview could not be sent to the local worker."));
      }
    });
  }

  cancel(): void {
    const pending = this.pending; this.release(); pending?.reject(new PreviewCancelled());
  }

  private release(): void {
    if (this.timeout !== null) clearTimeout(this.timeout);
    this.timeout = null;
    if (this.worker) { this.worker.onmessage = null; this.worker.onerror = null; this.worker.terminate(); }
    this.worker = null; this.pending = null;
  }

  dispose(): void { this.closed = true; this.cancel(); }
  get running(): boolean { return this.pending !== null; }
}
