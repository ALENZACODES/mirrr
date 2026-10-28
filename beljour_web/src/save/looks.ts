/** Save as My Look, versions and re-apply (round 2 plan §8, "The Major Save").
 * - saveLook stores v1 of the recipe; updateLook appends v2, v3 ... and never edits v1.
 * - applyLook runs a version's steps, in order, through an injected engine, on a copy of the
 *   photo: the original is never changed, and the same look on the same photo gives the same
 *   bytes every time.
 * - The one-time offer ("Save this as a Look to reuse it?") shows once, after a single
 *   photo is saved without a look, and never again once answered.
 * Author: John Khan.
 */
import type { KeyValueStore } from "../session.js";
import {
  type LookRecipe, type LookVersion, type RecipeStep, MAX_VERSIONS, RECIPE_FORMAT, TOOLS,
  autoName, cloneLook, cloneSteps, hashId, latest, version,
} from "./recipe.js";
import type { LookStorage } from "./storage.js";
import { RecipeError, validateRecipe, validateStep } from "./validate.js";

export interface PhotoPixels {
  width: number;
  height: number;
  channels: number;
  data: Uint8Array | Uint8ClampedArray;
}

/** One tool, applied to a copy of the photo. Must be deterministic for the same input. */
export type ToolFn = (photo: PhotoPixels, step: RecipeStep, dose: number) => PhotoPixels;
export type Engine = Readonly<Record<string, ToolFn>>;

export interface ApplyReport {
  photo: PhotoPixels;
  applied: string[];
  /** Steps that could not run here, with a plain reason (for example a YouCam tool offline). */
  skipped: { tool: string; reason: string }[];
}

export class LookLibrary {
  constructor(private readonly storage: LookStorage, private readonly clock: () => Date = () => new Date()) {}

  async saveLook(name: string, steps: readonly RecipeStep[]): Promise<LookRecipe> {
    const clean = steps.map((s, i) => validateStep(s, `steps[${i}]`));
    if (!clean.length) throw new RecipeError("steps", "add an edit first, then save it as a look");
    const created = this.clock().toISOString();
    const finalName = (name ?? "").trim() || autoName(clean);
    const id = "look-" + hashId(finalName + created + JSON.stringify(clean));
    const look = validateRecipe({ format: RECIPE_FORMAT, id, name: finalName, created, versions: [{ version: 1, created, steps: clean }] });
    await this.storage.put(look);
    return cloneLook(look);
  }

  /** Re-save after more edits: a new version is appended, older ones stay exactly as they were. */
  async updateLook(id: string, steps: readonly RecipeStep[]): Promise<LookRecipe> {
    const look = await this.storage.get(id);
    if (!look) throw new RecipeError("look", "is not saved in this browser");
    if (look.versions.length >= MAX_VERSIONS) throw new RecipeError("look", `keeps at most ${MAX_VERSIONS} versions; save it as a new look`);
    const clean = steps.map((s, i) => validateStep(s, `steps[${i}]`));
    if (!clean.length) throw new RecipeError("steps", "a version needs at least one edit");
    const next: LookVersion = { version: look.versions.length + 1, created: this.clock().toISOString(), steps: clean };
    const updated = validateRecipe({ ...look, versions: [...look.versions, next] });
    await this.storage.put(updated);
    return cloneLook(updated);
  }

  async rename(id: string, name: string): Promise<LookRecipe> {
    const look = await this.storage.get(id);
    if (!look) throw new RecipeError("look", "is not saved in this browser");
    const updated = validateRecipe({ ...look, name });
    await this.storage.put(updated);
    return updated;
  }

  get(id: string): Promise<LookRecipe | null> { return this.storage.get(id); }
  list(): Promise<LookRecipe[]> { return this.storage.list(); }
  remove(id: string): Promise<boolean> { return this.storage.delete(id); }
}

export function copyPhoto(photo: PhotoPixels): PhotoPixels {
  return { width: photo.width, height: photo.height, channels: photo.channels, data: new Uint8Array(photo.data) };
}

/** Apply one version (default: the newest) to a copy of the photo. `dose` scales strength per face. */
export function applyLook(look: LookRecipe, photo: PhotoPixels, engine: Engine,
  options: { version?: number; dose?: number; youcamAvailable?: boolean } = {}): ApplyReport {
  const chosen = options.version === undefined ? latest(look) : version(look, options.version);
  const dose = options.dose ?? 1;
  if (!(Number.isFinite(dose) && dose >= 0 && dose <= 1)) throw new RangeError("dose must be 0 to 1");
  let current = copyPhoto(photo);
  const applied: string[] = [], skipped: { tool: string; reason: string }[] = [];
  for (const step of cloneSteps(chosen.steps)) {
    if (step.provider === "youcam" && !options.youcamAvailable) {
      skipped.push({ tool: step.tool, reason: `${TOOLS[step.tool].label} needs YouCam, which is off; the rest of the look was applied.` });
      continue;
    }
    const fn = engine[step.tool];
    if (!fn) { skipped.push({ tool: step.tool, reason: `${TOOLS[step.tool]?.label ?? step.tool} isn't available on this device yet.` }); continue; }
    const out = fn(current, step, dose);
    if (out.width !== current.width || out.height !== current.height || out.channels !== current.channels) {
      throw new RangeError(`${step.tool} changed the photo size`);
    }
    current = out;
    applied.push(step.tool);
  }
  return { photo: current, applied, skipped };
}

export const OFFER_KEY = "beljour.save-offer";
export const OFFER_TEXT = "Save this as a Look to reuse it?";

/** The one-time offer after saving a single photo without a look. */
export class SaveOffer {
  constructor(private readonly store: KeyValueStore) {}
  /** True only if she saved a photo with edits, has no look for it, and was never asked. */
  shouldOffer(context: { savedPhoto: boolean; hasEdits: boolean; savedAsLook: boolean }): boolean {
    if (!context.savedPhoto || !context.hasEdits || context.savedAsLook) return false;
    try { return this.store.getItem(OFFER_KEY) === null; } catch { return false; }
  }
  answer(choice: "yes" | "no"): void {
    try { this.store.setItem(OFFER_KEY, choice); } catch { /* the offer may show again next visit */ }
  }
}
