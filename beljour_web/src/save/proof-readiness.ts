/** Plain, count-only preflight for whether saved-look proof can run locally.
 *
 * It never enables a paid operation or converts an unavailable tool into a
 * successful transformation. No source image, identity or tool-setting value
 * is returned. A disabled renderer may still be audited as UNPROVEN.
 * Author: John Khan.
 */

import { type Engine } from "./looks.js";
import { latest, type LookRecipe } from "./recipe.js";
import { validateRecipe } from "./validate.js";

export const READINESS_FORMAT = "beljour-save-proof-readiness/1";

export type ReadinessStatus = "READY" | "UNPROVEN";

export interface ProofReadiness {
  readonly format: typeof READINESS_FORMAT;
  readonly status: ReadinessStatus;
  readonly totalSteps: number;
  readonly availableLocal: number;
  readonly unavailableLocal: number;
  readonly requiresProvider: number;
  readonly reason: "all_local" | "missing_local_renderer" | "provider_required" | "mixed_unavailable";
}

/** Never ask a network-backed provider to execute a proof replay. */
export function inspectProofReadiness(recipe: LookRecipe, engine: Engine): ProofReadiness {
  const look = validateRecipe(recipe);
  const steps = latest(look).steps;
  let availableLocal = 0;
  let unavailableLocal = 0;
  let requiresProvider = 0;
  for (const step of steps) {
    if (step.provider === "youcam") requiresProvider++;
    else if (typeof engine[step.tool] === "function") availableLocal++;
    else unavailableLocal++;
  }
  const status: ReadinessStatus = requiresProvider || unavailableLocal ? "UNPROVEN" : "READY";
  let reason: ProofReadiness["reason"] = "all_local";
  if (requiresProvider && unavailableLocal) reason = "mixed_unavailable";
  else if (requiresProvider) reason = "provider_required";
  else if (unavailableLocal) reason = "missing_local_renderer";
  return {
    format: READINESS_FORMAT,
    status,
    totalSteps: steps.length,
    availableLocal,
    unavailableLocal,
    requiresProvider,
    reason,
  };
}

export function validateProofReadiness(raw: unknown): ProofReadiness {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new TypeError("invalid local readiness");
  const obj = raw as Record<string, unknown>;
  const names = ["format", "status", "totalSteps", "availableLocal", "unavailableLocal", "requiresProvider", "reason"];
  if (Object.keys(obj).length !== names.length || names.some((key) => !Object.hasOwn(obj, key))) {
    throw new TypeError("proof readiness includes unexpected data");
  }
  for (const key of ["totalSteps", "availableLocal", "unavailableLocal", "requiresProvider"]) {
    const number = obj[key];
    if (typeof number !== "number" || !Number.isSafeInteger(number) || number < 0) {
      throw new TypeError("invalid readiness count");
    }
  }
  const totalSteps = obj.totalSteps as number;
  const availableLocal = obj.availableLocal as number;
  const unavailableLocal = obj.unavailableLocal as number;
  const requiresProvider = obj.requiresProvider as number;
  if (obj.format !== READINESS_FORMAT || totalSteps < 1 || totalSteps > 16 ||
    availableLocal + unavailableLocal + requiresProvider !== totalSteps) {
    throw new TypeError("readiness step totals differ");
  }
  const status = requiresProvider || unavailableLocal ? "UNPROVEN" : "READY";
  let reason: ProofReadiness["reason"] = "all_local";
  if (requiresProvider && unavailableLocal) reason = "mixed_unavailable";
  else if (requiresProvider) reason = "provider_required";
  else if (unavailableLocal) reason = "missing_local_renderer";
  if (obj.status !== status || obj.reason !== reason) throw new TypeError("false proof readiness verdict");
  return { format: READINESS_FORMAT, status, totalSteps, availableLocal, unavailableLocal, requiresProvider, reason };
}

export function readinessMessage(row: ProofReadiness): string {
  const state = validateProofReadiness(row);
  if (state.status === "READY") return `${state.totalSteps} local steps available for mechanical replay.`;
  return `Local replay has ${state.unavailableLocal} unavailable tool${state.unavailableLocal === 1 ? "" : "s"} ` +
    `and ${state.requiresProvider} provider-required step${state.requiresProvider === 1 ? "" : "s"}. ` +
    "Incomplete steps cannot earn a proof PASS.";
}
