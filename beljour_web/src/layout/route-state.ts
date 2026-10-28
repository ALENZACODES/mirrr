/** The classic URL route is a fixed union of public screen names.
 * Unknown hashes are never forwarded to feature implementations.
 */
import { STEPS, type Ctx, type Route, routeReady } from "../ctx.js";

export const START_ROUTE: Route = "photo";

export function parseClassicRoute(hash: string): Route {
  const raw = hash.startsWith("#/") ? hash.slice(2) : "";
  if (raw === "privacy") return "privacy";
  const found = STEPS.find((step) => step.route === raw);
  return found?.route ?? START_ROUTE;
}

export interface RouteChoice {
  readonly requested: Route;
  readonly destination: Route;
  readonly redirected: boolean;
  readonly reason: string | null;
}

export function resolveClassicRoute(
  hash: string,
  ctx: Pick<Ctx, "photo" | "photoSrc" | "consent">,
): RouteChoice {
  const requested = parseClassicRoute(hash);
  if (routeReady(ctx, requested)) {
    return { requested, destination: requested, redirected: false, reason: null };
  }
  return {
    requested,
    destination: START_ROUTE,
    redirected: true,
    reason: "Open a photo and complete the required consent before this feature.",
  };
}

/** A screen that uses async work must not pull focus back after another route wins. */
export class RouteRevision {
  private revision = 0;
  private stopped = false;

  begin(): number {
    if (this.stopped) return -1;
    return ++this.revision;
  }

  isLatest(revision: number): boolean {
    return !this.stopped && revision > 0 && revision === this.revision;
  }

  stop(): void {
    this.stopped = true;
    this.revision++;
  }
}
