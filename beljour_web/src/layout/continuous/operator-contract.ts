/** Fixed, privacy-safe operator checks for the real application handoff. */
import { realDemoRoutes, type RealDemoBoundary, type RealDemoRouteId } from "../judge-live-routes.js";

export type OperatorResult = "not-started" | "opened" | "self-reported" | "refused";
export type OperatorRefusal = "no-consent" | "offline" | "unavailable" | "not-verified";

export interface OperatorCheck {
  readonly id: RealDemoRouteId;
  readonly title: string;
  readonly boundary: RealDemoBoundary;
  readonly href: string;
  readonly prerequisite: string;
  readonly confirmation: string;
  readonly fallback: string;
  readonly result: OperatorResult;
  readonly refusal: OperatorRefusal | null;
  readonly elapsedMs: number | null;
  readonly liveVerified: false;
}

export interface OperatorCounts {
  readonly total: number;
  readonly notStarted: number;
  readonly opened: number;
  readonly selfReported: number;
  readonly refused: number;
  readonly providerProved: false;
  readonly realFaceProved: false;
  readonly releaseProved: false;
}

export const OPERATOR_FORMAT = "beljour-operator-rehearsal/1" as const;
export const OPERATOR_REFUSALS: readonly OperatorRefusal[] = [
  "no-consent", "offline", "unavailable", "not-verified",
];

export const OPERATOR_ROUTE_IDS: readonly RealDemoRouteId[] = [
  "photo", "studio", "hair", "makeup", "shade", "commerce", "trust",
];

/** Local page URLs are constants imported from the existing public route list. */
export function operatorRoutes(): readonly Omit<OperatorCheck,
  "result" | "refusal" | "elapsedMs" | "liveVerified">[] {
  const routes = realDemoRoutes();
  const ids = new Set<string>();
  const result = routes.map((route) => {
    if (!OPERATOR_ROUTE_IDS.includes(route.id)) {
      throw new Error("Unknown real-product route");
    }
    if (ids.has(route.id)) throw new Error("Duplicate real-product route");
    ids.add(route.id);
    if (!isSafeOperatorHref(route.href)) throw new Error("Unsafe real-product URL");
    return Object.freeze({
      id: route.id,
      title: route.title,
      boundary: route.boundary,
      href: route.href,
      prerequisite: route.prerequisite,
      confirmation: route.confirmation,
      fallback: route.fallback,
    });
  });
  if (result.length !== OPERATOR_ROUTE_IDS.length) {
    throw new Error("Real-product route coverage incomplete");
  }
  return Object.freeze(result);
}

/** No URL queries, origins, fragments with visitor data, or path traversal. */
export function isSafeOperatorHref(href: unknown): href is string {
  if (typeof href !== "string" || href.length > 110) return false;
  if (href.includes("..") || href.includes("//") || href.includes("?")) return false;
  return /^[a-z][a-z-]*\.html(?:#[A-Za-z0-9_/-]+)?$/.test(href);
}

export function validOperatorResult(value: unknown): value is OperatorResult {
  return value === "not-started" || value === "opened"
    || value === "self-reported" || value === "refused";
}

export function validRefusal(value: unknown): value is OperatorRefusal {
  return OPERATOR_REFUSALS.some((entry) => entry === value);
}

/** Refusal explanations are fixed strings, never visitor text. */
export function operatorRefusalText(reason: OperatorRefusal): string {
  const descriptions: Record<OperatorRefusal, string> = {
    "no-consent": "Separate consent has not been confirmed in the real page.",
    offline: "The real page or server could not be reached.",
    unavailable: "The real operation was unavailable or declined to process.",
    "not-verified": "The result could not be independently checked.",
  };
  return descriptions[reason];
}
