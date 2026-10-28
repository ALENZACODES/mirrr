/** Bounded, local diagnostic codes. Never read exception messages, stacks, URLs,
 * file names or arbitrary object properties. Nothing is uploaded. Author: John Khan. */
export const DIAGNOSTIC_CODES = ["script_error", "unhandled_rejection", "storage_denied", "render_refused", "context_lost", "offline_unavailable"] as const;
export type DiagnosticCode = typeof DIAGNOSTIC_CODES[number];
export const DIAGNOSTIC_AREAS = ["editor", "storage", "gpu", "offline", "application"] as const;
export type DiagnosticArea = typeof DIAGNOSTIC_AREAS[number];
export interface Diagnostic { sequence: number; code: DiagnosticCode; area: DiagnosticArea; durationMs?: number }
export interface LocalEventTarget {
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

export class LocalDiagnostics {
  private rows: Diagnostic[] = [];
  private sequence = 0;
  private listeners = new Set<() => void>();
  constructor(readonly capacity = 40) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100) throw new RangeError("Diagnostic capacity must be 1 to 100");
  }
  record(code: DiagnosticCode, area: DiagnosticArea = "application", durationMs?: number): boolean {
    if (!(DIAGNOSTIC_CODES as readonly unknown[]).includes(code) || !(DIAGNOSTIC_AREAS as readonly unknown[]).includes(area)) return false;
    const row: Diagnostic = { sequence: ++this.sequence, code, area };
    if (typeof durationMs === "number" && Number.isFinite(durationMs) && durationMs >= 0) row.durationMs = Math.min(60_000, Math.round(durationMs));
    this.rows.push(row);
    if (this.rows.length > this.capacity) this.rows.shift();
    this.changed(); return true;
  }
  snapshot(): Diagnostic[] { return this.rows.map((row) => ({ ...row })); }
  exportText(): string {
    return JSON.stringify({ format: "beljour-local-diagnostics/1", scope: "this page only", events: this.snapshot() }, null, 2);
  }
  clear(): void { this.rows = []; this.sequence = 0; this.changed(); }
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener); return () => { this.listeners.delete(listener); };
  }
  private changed(): void { for (const listener of this.listeners) { try { listener(); } catch { /* an optional panel cannot break editing */ } } }
  /** Listeners record only constant codes. Even hostile getters on an Error are untouched. */
  listen(target: LocalEventTarget): () => void {
    const error: EventListener = () => { this.record("script_error"); };
    const rejected: EventListener = () => { this.record("unhandled_rejection"); };
    target.addEventListener("error", error); target.addEventListener("unhandledrejection", rejected);
    let active = true;
    return () => {
      if (!active) return; active = false;
      target.removeEventListener("error", error); target.removeEventListener("unhandledrejection", rejected);
    };
  }
}
