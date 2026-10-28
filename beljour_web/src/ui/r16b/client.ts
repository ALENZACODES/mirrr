/** Cancellable local Worker client with stale reply rejection. Author: John Khan. */
import type { Job, Result } from "./session.js";
export class Cancelled extends Error {
    constructor() { super("Preview cancelled."); this.name = "Cancelled"; }
}
export interface WorkerLike {
    onmessage: ((e: MessageEvent) => void) | null;
    onerror: ((e: ErrorEvent) => void) | null;
    postMessage(v: unknown, t?: Transferable[]): void;
    terminate(): void;
}
export class Client {
    private worker: WorkerLike | null = null;
    private pending: {
        id: number;
        resolve: (r: Result) => void;
        reject: (e: Error) => void;
    } | null = null;
    constructor(private factory: () => WorkerLike = () => new Worker(new URL("./worker.js", import.meta.url), { type: "module" }), private timeoutMs = 20000) { }
    run(job: Job) {
        this.cancel();
        return new Promise<Result>((resolve, reject) => {
            const w = this.factory();
            this.worker = w;
            this.pending = { id: job.id, resolve, reject };
            const timer = setTimeout(() => { if (this.worker === w) {
                this.release();
                reject(new Error("Local preview timed out."));
            } }, this.timeoutMs);
            w.onmessage = e => {
                if (this.worker !== w || this.pending?.id !== e.data?.id)
                    return;
                clearTimeout(timer);
                const p = this.pending;
                this.release();
                e.data.ok ? p?.resolve(e.data.result) : p?.reject(new Error(e.data.message ?? "Local preview failed."));
            };
            w.onerror = () => { clearTimeout(timer); const p = this.pending; this.release(); p?.reject(new Error("Local preview worker stopped.")); };
            w.postMessage(job, [job.image.data.buffer]);
        });
    }
    cancel() { const p = this.pending; this.release(); p?.reject(new Cancelled()); }
    private release() { if (this.worker) {
        this.worker.onmessage = null;
        this.worker.onerror = null;
        this.worker.terminate();
    } this.worker = null; this.pending = null; }
}

