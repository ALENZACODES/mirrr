/**
 * The browser side of round 1: one session id per tab, and the signed tickets of tasks that
 * are still running, so they can be handed back if the server restarts (CONTRACTS.md, Tasks).
 *
 * Both live in sessionStorage when it works. When it doesn't (private windows, blocked
 * storage, some previews), they live in memory for the life of the page instead. Nothing
 * here is a login: the server treats the id as a counter for the per-visit unit cap.
 *
 * Author: John Khan.
 */
import type { TaskTicket, TaskResumeStatus } from "./types.js";

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const SESSION_KEY = "beljour.session";
export const PENDING_KEY = "beljour.pending";
export const SESSION_HEADER = "X-Beljour-Session";
export const MAX_PENDING = 20;
const ID_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

/** In memory stand in, also used by the tests. */
export class MemoryStore implements KeyValueStore {
  private data = new Map<string, string>();
  getItem(key: string): string | null { return this.data.has(key) ? this.data.get(key)! : null; }
  setItem(key: string, value: string): void { this.data.set(key, value); }
  removeItem(key: string): void { this.data.delete(key); }
}

/** A store whose every call may throw; failures fall back to memory, once and for good. */
export class SafeStore implements KeyValueStore {
  private fallback = new MemoryStore();
  private broken = false;
  constructor(private readonly inner: () => KeyValueStore | null) {}

  private use<T>(fn: (s: KeyValueStore) => T): T {
    if (!this.broken) {
      try {
        const s = this.inner();
        if (s) return fn(s);
      } catch { /* storage blocked */ }
      this.broken = true;
    }
    return fn(this.fallback);
  }

  getItem(key: string): string | null { return this.use((s) => s.getItem(key)); }
  setItem(key: string, value: string): void { this.use((s) => s.setItem(key, value)); }
  removeItem(key: string): void { this.use((s) => s.removeItem(key)); }
}

export function browserStore(): KeyValueStore {
  return new SafeStore(() => (typeof sessionStorage === "undefined" ? null : sessionStorage));
}

/** 24 url safe characters from the platform's random source. */
export function newSessionId(fill?: (bytes: Uint8Array) => void): string {
  const bytes = new Uint8Array(18);
  if (fill) fill(bytes);
  else crypto.getRandomValues(bytes);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function validSessionId(id: string | null | undefined): id is string {
  return typeof id === "string" && ID_PATTERN.test(id);
}

export function sessionId(store: KeyValueStore, make: () => string = () => newSessionId()): string {
  const current = store.getItem(SESSION_KEY);
  if (validSessionId(current)) return current;
  const id = make();
  store.setItem(SESSION_KEY, id);
  return id;
}

function isTicket(value: unknown): value is TaskTicket {
  const t = value as Partial<TaskTicket> | null;
  return !!t && typeof t.request_key === "string" && typeof t.task_id === "string" && typeof t.feature === "string"
    && typeof t.version === "string" && typeof t.owner === "string" && typeof t.units === "number"
    && typeof t.sig === "string";
}

export function pendingTickets(store: KeyValueStore): TaskTicket[] {
  const raw = store.getItem(PENDING_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isTicket).slice(-MAX_PENDING) : [];
  } catch {
    return [];
  }
}

function savePending(store: KeyValueStore, tickets: TaskTicket[]): void {
  if (tickets.length === 0) store.removeItem(PENDING_KEY);
  else store.setItem(PENDING_KEY, JSON.stringify(tickets.slice(-MAX_PENDING)));
}

export function addPending(store: KeyValueStore, ticket: TaskTicket): TaskTicket[] {
  const kept = pendingTickets(store).filter((t) => t.request_key !== ticket.request_key);
  const next = [...kept, ticket];
  savePending(store, next);
  return next.slice(-MAX_PENDING);
}

export function removePending(store: KeyValueStore, requestKey: string): TaskTicket[] {
  const next = pendingTickets(store).filter((t) => t.request_key !== requestKey);
  savePending(store, next);
  return next;
}

/** Statuses after which a ticket is no use: the result is in, or it never will be. */
const FINISHED = new Set(["done", "rejected", "failed", "ambiguous", "expired"]);

/**
 * Hand pending tickets back to the server and forget the ones that are finished. `running`
 * and `offline` (server in demo mode right now) are kept for the next try.
 */
export async function resumePending(
  store: KeyValueStore,
  send: (tickets: TaskTicket[]) => Promise<{ tasks: TaskResumeStatus[] }>,
): Promise<TaskResumeStatus[]> {
  const tickets = pendingTickets(store);
  if (tickets.length === 0) return [];
  const { tasks } = await send(tickets);
  for (const t of tasks) if (FINISHED.has(t.status)) removePending(store, t.request_key);
  return tasks;
}

/** Wait for a background task, asking every `everyMs`, at most `tries` times. */
export async function waitForTask<T extends { status: string }>(
  get: () => Promise<T>,
  { tries = 60, everyMs = 2000, sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)) } = {},
): Promise<T> {
  let last = await get();
  for (let i = 1; i < tries && last.status === "running"; i++) {
    await sleep(everyMs);
    last = await get();
  }
  return last;
}
