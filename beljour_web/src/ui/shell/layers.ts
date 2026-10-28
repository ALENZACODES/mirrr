/** Immutable ordered layers; order represents actual render order (bottom to top).
 * Layer IDs are local; remote task identifiers never become stack indexes.
 * Author: John Khan.
 */
import type { LayerKind, ShellLayer } from "./types.js";
import { clampStrength } from "./stops.js";
import { GENTLE_DEFAULT } from "../../layout/effects.js";

export const MAX_LAYERS = 32;
export function clampOpacity(n: number): number {
  if (!Number.isFinite(n)) throw new RangeError("Opacity must be finite");
  return Math.max(0, Math.min(1, Math.round(n * 100) / 100));
}
function validParams(params: Readonly<Record<string, string | number | boolean>>): boolean {
  return Object.keys(params).length <= 20 && Object.entries(params).every(([k, v]) => /^[a-z][a-z0-9_-]{0,40}$/.test(k)
    && (typeof v === "string" && v.length <= 100 || typeof v === "number" && Number.isFinite(v) || typeof v === "boolean"));
}
export function layer(id: string, kind: LayerKind, name: string, origin: ShellLayer["origin"] = "sample",
  params: ShellLayer["parameters"] = {}): ShellLayer {
  if (!/^[a-z0-9-]{1,70}$/.test(id)) throw new RangeError("Layer ID must be a local token");
  if (!name || name.length > 80 || !validParams(params)) throw new RangeError("Invalid layer fields");
  const provenance = kind === "styling" ? "youcam" : "local";
  return { id, kind, name, enabled: true, opacity: 1, strength: GENTLE_DEFAULT, parameters: { ...params },
    provenance, simulation: kind !== "enhance" && kind !== "filters", origin };
}
export function validateStack(stack: readonly ShellLayer[]): void {
  if (stack.length > MAX_LAYERS) throw new RangeError("Too many layers (maximum 32)");
  const ids = new Set<string>();
  for (const item of stack) {
    if (ids.has(item.id)) throw new RangeError("A layer ID is duplicated");
    ids.add(item.id);
    if (!(item.strength >= 0 && item.strength <= 100 && Number.isFinite(item.strength))) throw new RangeError("Layer strength must be 0–100");
    if (!(item.opacity >= 0 && item.opacity <= 1 && Number.isFinite(item.opacity))) throw new RangeError("Layer opacity must be 0–1");
    if (!validParams(item.parameters)) throw new RangeError("Layer options aren't valid");
    if (item.provenance !== (item.kind === "styling" ? "youcam" : "local")) throw new RangeError("Layer provenance differs from its engine");
  }
}
export function appendLayer(stack: readonly ShellLayer[], item: ShellLayer): ShellLayer[] {
  const next = [...stack, item]; validateStack(next); return next;
}
export function editLayer(stack: readonly ShellLayer[], id: string, edits: Partial<Omit<ShellLayer, "id" | "kind" | "provenance">>): ShellLayer[] {
  if (!stack.some((i) => i.id === id)) throw new RangeError("Layer not found");
  const next = stack.map((i) => i.id === id ? { ...i, ...edits,
    strength: edits.strength === undefined ? i.strength : clampStrength(edits.strength),
    opacity: edits.opacity === undefined ? i.opacity : clampOpacity(edits.opacity),
    parameters: edits.parameters ? { ...edits.parameters } : i.parameters } : i);
  validateStack(next); return next;
}
export function removeLayer(stack: readonly ShellLayer[], id: string): ShellLayer[] {
  if (!stack.some((i) => i.id === id)) throw new RangeError("Layer not found");
  return stack.filter((i) => i.id !== id);
}
export function moveLayer(stack: readonly ShellLayer[], id: string, delta: -1 | 1): ShellLayer[] {
  const old = stack.findIndex((i) => i.id === id), target = old + delta;
  if (old < 0) throw new RangeError("Layer not found");
  if (target < 0 || target >= stack.length) return [...stack];
  const next = [...stack]; [next[old], next[target]] = [next[target], next[old]];
  return next;
}
export function effective(stack: readonly ShellLayer[]): ShellLayer[] {
  return stack.filter((i) => i.enabled && i.opacity > 0 && i.strength > 0);
}
export function describeStack(stack: readonly ShellLayer[]): { local: number; provider: number; hidden: number; simulation: boolean } {
  return { local: stack.filter((i) => i.provenance === "local").length,
    provider: stack.filter((i) => i.provenance === "youcam").length,
    hidden: stack.filter((i) => !i.enabled).length,
    simulation: stack.some((i) => i.enabled && i.simulation) };
}
