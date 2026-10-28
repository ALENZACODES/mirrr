/** One compatibility check for recipes, the visible picker and recovery.
 * Missing geometry disables a step with a reason; it never selects sample geometry.
 * Author: John Khan. */
import { CATALOGUE, readiness, type Tool } from "../ui/shell/catalogue.js";
import { RENDER_KINDS, type PhotoSource, type RenderKind } from "../ui/shell/types.js";
import { EFFECTS, type Effect } from "../layout/effects.js";
import { TOOLS, type RecipeStep } from "./recipe.js";

export interface StepAvailability { tool: string; available: boolean; reason: string }
export function recipeAvailability(steps: readonly RecipeStep[], source: PhotoSource | null): StepAvailability[] {
  return steps.map((step) => {
    if (step.provider !== "local") return { tool: step.tool, available: false, reason: "A new YouCam quote and consent are required." };
    if (!(RENDER_KINDS as readonly string[]).includes(step.tool)) return { tool: step.tool, available: false, reason: "This saved tool has no editor renderer yet." };
    const state = readiness(step.tool as RenderKind, source);
    return { tool: step.tool, available: state.ready, reason: state.ready ? "Ready on this photo." : state.reason };
  });
}

export function effectAvailability(effect: Effect, source: PhotoSource | null): StepAvailability {
  if (!effect.built || !effect.studio) return { tool: effect.id, available: false, reason: effect.note };
  const state = readiness(effect.studio, source);
  return { tool: effect.id, available: state.ready, reason: state.ready ? "Ready on this photo." : state.reason };
}

export function registryProblems(catalogue: readonly Tool[] = CATALOGUE, effects: readonly Effect[] = EFFECTS,
  renderKinds: readonly string[] = RENDER_KINDS): string[] {
  const problems: string[] = [];
  const unique = (ids: readonly string[], label: string): void => {
    const seen = new Set<string>();
    for (const id of ids) { if (seen.has(id)) problems.push(`${label}: duplicate ${id}`); seen.add(id); }
  };
  unique(catalogue.map((row) => row.id), "studio"); unique(effects.map((row) => row.id), "effect"); unique(renderKinds, "renderer");
  const tools = new Map(catalogue.map((row) => [row.id as string, row]));
  for (const kind of renderKinds) {
    if (!tools.has(kind) || tools.get(kind)?.source !== "local") problems.push(`${kind}: renderer has no local studio`);
    if (!Object.hasOwn(TOOLS, kind) || TOOLS[kind].provider !== "local") problems.push(`${kind}: renderer has no local recipe contract`);
  }
  for (const row of catalogue) {
    if (row.source === "local" && !renderKinds.includes(row.id)) problems.push(`${row.id}: visible studio has no renderer`);
  }
  for (const item of effects) {
    if (!item.studio) continue;
    const row = tools.get(item.studio);
    if (!row) problems.push(`${item.id}: effect points to an unknown studio`);
    else if (item.provider !== row.source) problems.push(`${item.id}: provider differs from its studio`);
    if (!item.built) problems.push(`${item.id}: unavailable effect has an active studio`);
  }
  return problems;
}
