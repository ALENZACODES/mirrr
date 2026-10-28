/** Typed client for the BELJOUR API. The YouCam key never reaches the browser. */
import { browserStore, SESSION_HEADER, sessionId } from "./session.js";
import { withEndpoint } from "./ui/provenance.js";
import type {
  AgingResult, Health, Photo, Procedure, ProportionResult, Quote,
  SessionStatus, ShadeResult, SimulationResult, SkinResult,
  StylingScope, SurgeryResult, TaskResumeStatus, TaskStart, TaskStatus, TaskTicket,
} from "./types.js";
import type { SkinMatchRequest, SkinMatchResult } from "./screens/skin-match-types.js";

declare global {
  interface Window {
    BELJOUR_API?: string;
    PLUMB_API?: string;
  }
}

export const store = browserStore();

/** Headers every request carries: the per-tab session id, never anything secret. */
export function sessionHeaders(): Record<string, string> {
  return { [SESSION_HEADER]: sessionId(store) };
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public retryAfterSeconds: number | null = null) {
    super(message);
  }
}

/** The configured API origin, or null when none is set (config.js leaves it empty on a
 * static-only deploy). With null the app runs in local-only mode: on-device tools work,
 * and nothing is sent anywhere. Only http(s) origins are accepted. */
export function apiBase(): string | null {
  const scope = globalThis as { BELJOUR_API?: unknown; PLUMB_API?: unknown };
  const raw = scope.BELJOUR_API ?? scope.PLUMB_API;
  if (typeof raw !== "string") return null;
  const value = raw.trim().replace(/\/+$/, "");
  if (!value || value === "none" || !/^https?:\/\/[^\s/?#]+$/i.test(value)) return null;
  return value;
}

export const NO_API_MESSAGE = "This copy of BELJOUR runs on your device only, so there is no server to ask. On-device tools still work.";

function requireBase(): string {
  const base = apiBase();
  if (base === null) throw new ApiError(0, "no_api", NO_API_MESSAGE);
  return base;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = requireBase();
  let resp: Response;
  try {
    resp = await fetch(base + path, { ...init, headers: { ...sessionHeaders(), ...(init.headers as Record<string, string> | undefined) } });
  } catch {
    throw new ApiError(0, "offline", "Can't reach the BELJOUR server. If it was asleep, it can take up to a minute to wake. Try again shortly.");
  }
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const err = (body as { error?: { code?: string; message?: string } }).error ?? {};
    const retryHeader = resp.headers.get("Retry-After") ?? "";
    const retry = /^\d+$/.test(retryHeader) ? Number(retryHeader) : NaN;
    const wait = resp.status === 429 && Number.isSafeInteger(retry) && retry > 0 ? Math.min(86400, retry) : null;
    throw new ApiError(resp.status, err.code ?? "error", err.message ?? `The server replied ${resp.status}.`, wait);
  }
  return withEndpoint(path, body) as T;
}

function post<T>(path: string, json: unknown): Promise<T> {
  return call<T>(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(json) });
}

export const api = {
  health: () => call<Health>("/api/health"),
  samplePhoto: () => call<Photo>("/api/photos/sample"),
  uploadPhoto: (blob: Blob) => {
    const form = new FormData();
    form.append("file", blob, "photo.jpg");
    return call<Photo>("/api/photos", { method: "POST", body: form });
  },
  // An <img> cannot send the session header, so the per-tab session id rides as ?s=.
  photoUrl: (id: string) => `${requireBase()}/api/photos/${encodeURIComponent(id)}.jpg?s=${encodeURIComponent(sessionId(store))}`,
  skinMatch: (body: SkinMatchRequest) => post<SkinMatchResult>("/api/skin/match", body),
  deletePhoto: (id: string) => call<{ deleted: boolean; results_removed: number }>(`/api/photos/${id}`, { method: "DELETE" }),
  quote: (body: Record<string, unknown>) => post<Quote>("/api/quote", body),
  skin: (photo_id: string, landmarks?: number[][]) => post<SkinResult>("/api/skin/analyze", { photo_id, landmarks }),
  shade: (photo_id: string, landmarks?: number[][]) => post<ShadeResult>("/api/shade/analyze", { photo_id, landmarks }),
  proportions: (photo_id: string, landmarks?: number[][]) => post<ProportionResult>("/api/face/proportions", { photo_id, landmarks }),
  procedures: () => call<{ procedures: Procedure[]; step: number; label: string }>("/api/surgery/procedures"),
  surgery: (body: { photo_id: string; selection: Record<string, number>; landmarks?: number[][] }) =>
    post<SurgeryResult>("/api/surgery/preview", body),
  simulate: (photo_id: string, strengths: Record<string, number>, landmarks?: number[][]) =>
    post<SimulationResult>("/api/skin/simulate", { photo_id, strengths, landmarks }),
  aging: (photo_id: string, landmarks?: number[][]) => post<AgingResult>("/api/transform/aging", { photo_id, landmarks }),
  // round 1: session, judge code, styling scope, background tasks
  session: () => call<SessionStatus>("/api/session"),
  judge: (code: string) => post<SessionStatus>("/api/session/judge", { code }),
  stylingScope: () => call<StylingScope>("/api/styling/scope"),
  startTask: (body: { photo_id: string; action: string; options?: Record<string, unknown>; foundation_id?: string; lip_id?: string; blush_id?: string; reference_photo_id?: string; reference_rights?: boolean;
    consent?: { version: string; adult: true; scope: "makeup" | "hair"; photo_id: string; given_at: number } }) =>
    post<TaskStart>("/api/tasks/start", body),
  task: (requestKey: string) => call<TaskStatus>(`/api/tasks/${encodeURIComponent(requestKey)}`),
  resumeTasks: (tickets: TaskTicket[]) => post<{ tasks: TaskResumeStatus[] }>("/api/tasks/resume", { tickets }),
};


/** R18 Lane C consented-commerce network boundary.
 * All network I/O belongs to api.ts, never the renderers, local catalogue or page.
 * `remote.ts` is an opt-in transport adapter. No commerce call is initiated by
 * merely loading a page; the controller enforces photo+consent+revision binding.
 * Only the server proxy receives photographs. No direct YouCam browser traffic.
 */
export type CommerceEndpoint =
  | "/api/photos"
  | "/api/commerce/match" | "/api/commerce/try-on" | "/api/commerce/look/try-on"
  | "/api/commerce/bag" | "/api/commerce/bag/add"
  | "/api/commerce/bag/remove" | "/api/commerce/wishlist"
  | "/api/commerce/bag/clear"
  | `/api/photos/${string}`;

export interface CommerceTransportInput {
  endpoint: CommerceEndpoint;
  method?: "GET" | "POST" | "DELETE";
  payload?: Readonly<Record<string, unknown>> | FormData;
  timeoutMs?: number;
}

export async function commerceTransport<T>({endpoint, method, payload, timeoutMs = 95_000}: CommerceTransportInput): Promise<T> {
  // Disallow arbitrary paths, query strings, protocol-relative URLs and surprises.
  const exact = new Set<string>([
    "/api/photos", "/api/commerce/match", "/api/commerce/try-on", "/api/commerce/look/try-on",
    "/api/commerce/bag", "/api/commerce/bag/add", "/api/commerce/bag/remove",
    "/api/commerce/wishlist", "/api/commerce/bag/clear",
  ]);
  if (!exact.has(endpoint) && !/^\/api\/photos\/[0-9a-f]{64}$/.test(endpoint)) {
    throw new ApiError(0, "invalid_path", "Unrecognized commerce endpoint.");
  }
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 120_000) {
    throw new ApiError(0, "invalid_timeout", "Invalid commerce request timeout.");
  }
  const base = requireBase();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers: Record<string, string> = sessionHeaders();
    if (payload && !(payload instanceof FormData)) headers["Content-Type"] = "application/json";
    const response = await fetch(base + endpoint, {
      method: method ?? (payload === undefined ? "GET" : "POST"),
      headers,
      body: payload === undefined ? undefined : payload instanceof FormData ? payload : JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
      credentials: "omit",
    });
    const result: unknown = await response.json().catch(() => ({}));
    if (!response.ok) {
      const outer = result !== null && typeof result === "object" ? result as { error?: { code?: unknown; message?: unknown } } : {};
      const err = outer.error;
      throw new ApiError(response.status, typeof err?.code === "string" ? err.code : "server",
        typeof err?.message === "string" ? err.message : `Commerce service replied ${response.status}.`);
    }
    return result as T;
  } catch (reason) {
    if (reason instanceof ApiError) throw reason;
    throw new ApiError(0, "connection", "Unable to reach the service. The original photo and local recipe remain on this device.");
  } finally {
    clearTimeout(timer);
  }
}
