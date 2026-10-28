/** Re-apply a saved look recipe to a new photo, on this device (round 2 plan §8, "The Major Save").
 *
 * A LookRecipe is settings only, so it can go onto any photo. This module is the missing link
 * between the Save System (looks.ts applyLook, which takes an injected engine) and the studio's
 * own local renderers (ui/shell/pipeline.ts): it builds that engine for one photo.
 *
 * - Each step runs through the same local renderer, readiness rule and guards as in the editor,
 *   at the saved strength (times the batch dose). Every step runs on the photo she gave, which
 *   is never changed; the result is a new image.
 * - A step that can't run here is skipped with a plain reason and the rest still run: YouCam
 *   steps (never called from here), tools this re-apply path doesn't carry yet, or a tool that
 *   needs something marked or read on THIS photo (face points, hair area, body points).
 * - Face points saved with a look belong to the photo they were read on. They are used again only
 *   when the new photo is that same file (same digest and size); any other photo must have its
 *   own points read on this device, and until then face tools are skipped, never run on a
 *   borrowed face.
 * Author: John Khan.
 */
import type { ByteImage } from "../engines/core/buffer.js";
import { readiness } from "../ui/shell/catalogue.js";
import { applyLocalLayer, nextFace } from "../ui/shell/pipeline.js";
import { type LayerKind, type PhotoSource, RENDER_KINDS, type RenderKind, type ShellLayer } from "../ui/shell/types.js";
import { type ApplyReport, type Engine, type PhotoPixels, type ToolFn, applyLook } from "./looks.js";
import { type LookRecipe, type RecipeStep, TOOLS, latest, version } from "./recipe.js";
import type { SavedFaceState } from "./saved-face.js";

export const MESH_POINTS = 478;
const KINDS: readonly string[] = RENDER_KINDS;

export interface StepPlan { index: number; tool: string; runs: boolean; reason: string }

export interface ReapplyReport extends ApplyReport {
  plan: StepPlan[];
  /** Where the face points came from: read on this photo, saved with the look for this same
   * photo, or none (face tools skipped). */
  face: "this-photo" | "saved-for-this-photo" | "none";
}

function rgb(photo: PhotoPixels): ByteImage {
  if (photo.channels === 3) return { width: photo.width, height: photo.height, channels: 3, data: new Uint8Array(photo.data) };
  if (photo.channels !== 4) throw new RangeError("a photo is RGB or RGBA");
  const out = new Uint8Array(photo.width * photo.height * 3);
  for (let p = 0; p < photo.width * photo.height; p++) for (let c = 0; c < 3; c++) out[p * 3 + c] = photo.data[p * 4 + c];
  return { width: photo.width, height: photo.height, channels: 3, data: out };
}

/** The rendered colour back in the input's layout; an RGBA photo keeps its own alpha untouched. */
function restore(input: PhotoPixels, out: ByteImage): PhotoPixels {
  if (out.width !== input.width || out.height !== input.height) throw new RangeError("a step changed the photo size");
  const n = input.width * input.height;
  const data = new Uint8Array(n * input.channels);
  for (let p = 0; p < n; p++) {
    for (let c = 0; c < 3; c++) data[p * input.channels + c] = out.data[p * out.channels + c];
    if (input.channels === 4) data[p * 4 + 3] = input.data[p * 4 + 3];
  }
  return { width: input.width, height: input.height, channels: input.channels, data };
}

export function layerFor(step: RecipeStep, dose: number, index = 0): ShellLayer {
  return { id: `reapply-${index}`, kind: step.tool as LayerKind, name: TOOLS[step.tool]?.label ?? step.tool, enabled: true,
    opacity: 1, strength: Math.max(0, Math.min(100, step.strength * dose)), parameters: { ...step.settings },
    provenance: "local", simulation: !["enhance", "filters"].includes(step.tool), origin: "photo" };
}

/** Why a step can or can't run on this photo, before anything renders. */
export function planSteps(steps: readonly RecipeStep[], source: PhotoSource): StepPlan[] {
  return steps.map((step, index) => {
    const label = TOOLS[step.tool]?.label ?? step.tool;
    if (step.provider === "youcam") return { index, tool: step.tool, runs: false, reason: `${label} needs YouCam, which re-applying on this device never calls.` };
    if (!KINDS.includes(step.tool)) return { index, tool: step.tool, runs: false, reason: `${label} can't be re-applied on this device yet.` };
    const ready = readiness(step.tool as RenderKind, source);
    return { index, tool: step.tool, runs: ready.ready, reason: ready.ready ? "" : ready.reason ?? `${label} isn't ready on this photo.` };
  });
}

/** The engine for one photo: every local tool, through the studio's own renderer. Steps run in
 * order, and a step that moves the face (age reshape, gender) hands its points to the next one,
 * as the editor's layer stack does. */
export function localEngine(source: PhotoSource): Engine {
  const engine: Record<string, ToolFn> = {};
  let face = source.face;
  for (const kind of KINDS) {
    engine[kind] = (photo, step, dose) => {
      const img = rgb(photo);
      const result = applyLocalLayer(img, { ...source, image: img, face }, layerFor(step, dose));
      face = nextFace(face, result.face, 1);
      return restore(photo, result.image);
    };
  }
  return engine;
}

/** The saved face points, but only for the very photo they were read on. */
export function savedFaceFor(saved: SavedFaceState | null, photo: Pick<PhotoSource, "fileSha256" | "image">): number[][] | null {
  if (!saved || !photo.fileSha256) return null;
  const [w, h] = saved.identity.dimensions;
  if (saved.identity.reference !== photo.fileSha256 || w !== photo.image.width || h !== photo.image.height) return null;
  return saved.mesh.length === MESH_POINTS ? saved.mesh.map((p) => p.slice(0, 2)) : null;
}

/** Re-apply one version (default: newest) of a saved look to a photo. A step that can't run, or
 * that its renderer refuses on this photo, is skipped with its reason; the rest still run. */
export function reapply(look: LookRecipe, source: PhotoSource,
  options: { version?: number; dose?: number; savedFace?: SavedFaceState | null } = {}): ReapplyReport {
  const chosen = options.version === undefined ? latest(look) : version(look, options.version);
  const own = source.face && source.face.length === MESH_POINTS;
  const borrowed = own ? null : savedFaceFor(options.savedFace ?? null, source);
  const photo: PhotoSource = borrowed ? { ...source, face: borrowed.map((p) => [p[0], p[1]] as [number, number]) } : source;
  const plan = planSteps(chosen.steps, photo);
  const reasons = new Map(plan.filter((p) => !p.runs).map((p) => [p.tool, p.reason]));
  const all = localEngine(photo);
  const refused: { tool: string; reason: string }[] = [];
  const engine: Record<string, ToolFn> = {};
  for (const p of plan) {
    if (!p.runs) continue;
    // A renderer that refuses on this photo (an identity guard, say) leaves the photo as it was
    // for that step; the look's other steps still run.
    engine[p.tool] = (current, step, dose) => {
      try { return all[p.tool](current, step, dose); }
      catch (error) {
        refused.push({ tool: p.tool, reason: error instanceof Error ? error.message : String(error) });
        return { ...current, data: new Uint8Array(current.data) };
      }
    };
  }
  const report = applyLook(look, { width: source.image.width, height: source.image.height, channels: source.image.channels, data: source.image.data },
    engine, { version: chosen.version, dose: options.dose, youcamAvailable: false });
  const applied = [...report.applied];
  for (const r of refused) applied.splice(applied.indexOf(r.tool), 1);
  return { photo: report.photo, applied, plan, face: own ? "this-photo" : borrowed ? "saved-for-this-photo" : "none",
    skipped: [...report.skipped.map((s) => ({ tool: s.tool, reason: reasons.get(s.tool) ?? s.reason })), ...refused] };
}
