/** Apply a look to a batch of photos (round 2 plan §8, "Batch").
 * - Same recipe on every photo; the face is found in each one and the dose is set per photo
 *   (Identity Lock and Adaptive Strength are injected, so the batch code stays engine-free).
 * - A photo with no face is flagged and skipped; it never fails the whole batch.
 * - Group photos follow the face-chip rule: chosen faces, or all when she picks All.
 * - Progress is reported after each photo; cancel stops after the current photo, and resume
 *   continues from the next unfinished one without redoing finished photos.
 * - The review grid model lists every photo with its before, after and status.
 * Author: John Khan.
 */
import { type ApplyReport, type Engine, type PhotoPixels } from "./looks.js";
import type { LookRecipe } from "./recipe.js";
import { applyLookToFaces } from "./face-apply.js";

export type ItemStatus = "pending" | "done" | "skipped-no-face" | "failed";

export interface BatchPhoto { name: string; photo: PhotoPixels }

export interface FaceInfo { id: string; box: readonly [number, number, number, number] }

export interface BatchDeps {
  engine: Engine;
  /** Faces found in a photo; [] means none. */
  findFaces(photo: PhotoPixels): FaceInfo[] | Promise<FaceInfo[]>;
  /** Adaptive Strength: the dose (0..1) for this face. Default 1. */
  doseFor?(photo: PhotoPixels, face: FaceInfo): number;
  youcamAvailable?: boolean;
}

export interface BatchItem {
  index: number;
  name: string;
  status: ItemStatus;
  faces: number;
  facesEdited: string[];
  note: string;
  before: PhotoPixels;
  after: PhotoPixels | null;
  report: ApplyReport | null;
}

export interface Progress { done: number; skipped: number; failed: number; total: number; finished: boolean; cancelled: boolean }

export class BatchRun {
  private readonly items: BatchItem[];
  private cursor = 0;
  private controller: AbortController | null = null;
  private cancelledFlag = false;

  constructor(private readonly look: LookRecipe, photos: readonly BatchPhoto[], private readonly deps: BatchDeps,
    private readonly selection: "all" | readonly string[] = "all", private readonly versionNumber?: number) {
    if (!photos.length || photos.length > 50) throw new RangeError("a batch takes 1 to 50 photos");
    this.items = photos.map((p, index) => ({ index, name: p.name, status: "pending", faces: 0, facesEdited: [], note: "",
      before: p.photo, after: null, report: null }));
  }

  progress(): Progress {
    const count = (s: ItemStatus) => this.items.filter((i) => i.status === s).length;
    return { done: count("done"), skipped: count("skipped-no-face"), failed: count("failed"), total: this.items.length,
      finished: this.cursor >= this.items.length, cancelled: this.cancelledFlag && this.cursor < this.items.length };
  }

  /** Stop after the photo being worked on. Finished photos keep their results. */
  cancel(): void { this.cancelledFlag = true; this.controller?.abort(); }

  /** Run (or resume) until finished or cancelled. Calls `onProgress` after each photo. */
  async run(onProgress?: (p: Progress, item: BatchItem) => void): Promise<Progress> {
    this.cancelledFlag = false;
    const controller = new AbortController();
    this.controller = controller;
    while (this.cursor < this.items.length) {
      if (controller.signal.aborted) break;
      const item = this.items[this.cursor];
      if (item.status === "pending") await this.process(item);
      this.cursor++;
      onProgress?.(this.progress(), item);
      // yield so a cancel tapped during a long batch is seen before the next photo
      await Promise.resolve();
    }
    this.controller = null;
    return this.progress();
  }

  private async process(item: BatchItem): Promise<void> {
    try {
      const faces = await this.deps.findFaces(item.before);
      item.faces = faces.length;
      if (!faces.length) { item.status = "skipped-no-face"; item.note = "No face found; skipped."; return; }
      const chosen = this.selection === "all" ? faces : faces.filter((f) => (this.selection as readonly string[]).includes(f.id));
      if (!chosen.length) { item.status = "skipped-no-face"; item.note = "None of the chosen faces is in this photo; skipped."; return; }
      // Bound every local effect to the selected face rectangles. Re-running
      // each face from the source ensures a previous selection does not alter
      // what another face's adaptive-dose engine sees.
      const output = applyLookToFaces(this.look, item.before, chosen, this.deps.engine,
        { version: this.versionNumber,
          doseFor: (f) => this.deps.doseFor ? this.deps.doseFor(item.before, f) : 1,
          youcamAvailable: this.deps.youcamAvailable });
      item.after = output.photo;
      item.report = output.reports[output.reports.length - 1] ?? null;
      item.facesEdited = output.faceIds;
      item.status = "done";
      const skipped = output.reports.flatMap((r) => r.skipped.map((s) => s.reason));
      item.note = skipped.length ? [...new Set(skipped)].join(" ") : "";
    } catch (error) {
      item.status = "failed";
      item.note = error instanceof Error ? error.message : String(error);
    }
  }

  /** The review grid: every photo, before and after on tap, with its status. */
  grid(): readonly Readonly<BatchItem>[] { return this.items.map((i) => ({ ...i })); }

  /** Re-run one photo after she tweaks it individually (for example a lower dose). */
  async redo(index: number, deps?: Partial<BatchDeps>): Promise<BatchItem> {
    const item = this.items[index];
    if (!item) throw new RangeError("no photo at that position");
    const saved = { ...this.deps };
    Object.assign(this.deps, deps ?? {});
    try { item.status = "pending"; await this.process(item); } finally { Object.assign(this.deps, saved); }
    return { ...item };
  }

  /** Photos ready to save, in order. */
  finished(): BatchItem[] { return this.items.filter((i) => i.status === "done" && i.after); }
}

export function summary(p: Progress): string {
  const parts = [`${p.done} of ${p.total} done`];
  if (p.skipped) parts.push(`${p.skipped} skipped (no face)`);
  if (p.failed) parts.push(`${p.failed} could not be edited`);
  if (p.cancelled) parts.push("paused; tap Resume to continue");
  return parts.join(", ") + ".";
}
