/** Editor render lifecycle (free-library plan §6 P0 step 5: the Lifecycle/ViewModel role).
 *
 * Every render is tied to a revision: the photo it was made from and the recipe it applied.
 * - A new edit aborts the render in flight (AbortController per render).
 * - A result that arrives after a newer edit is never displayed; it is released at once.
 * - When a new result is displayed, the previous one is released, so repeated edits keep a
 *   flat number of live results (the soak test runs 100 edits).
 * - Changing the photo bumps the photo revision, so a slow render of the old photo can never
 *   appear over the new one.
 * - `dispose()` aborts everything and releases what is shown.
 * The renderer and release functions are injected; nothing here touches the network.
 * Author: John Khan.
 */

export interface Revision {
  /** Increases on every scheduled render. */
  readonly id: number;
  readonly photoKey: string;
  readonly photoRevision: number;
  readonly recipeKey: string;
}

export type Renderer<P, R, O> = (photo: P, recipe: R, context: { signal: AbortSignal; revision: Revision }) => Promise<O>;

export interface EditorHooks<O> {
  /** Called with each result that is current when it arrives. */
  display(result: O, revision: Revision): void;
  /** Frees a result's resources (textures, bitmaps). Called exactly once per result. */
  release?(result: O): void;
  /** Called when a render fails for a reason other than cancellation. */
  error?(error: unknown, revision: Revision): void;
}

export interface EditorStats {
  scheduled: number;
  displayed: number;
  staleDropped: number;
  aborted: number;
  failed: number;
  released: number;
  inFlight: number;
  /** Results produced and not yet released (displayed one included). */
  liveResults: number;
}

/** Stable, order-sensitive key for a recipe value (FNV-1a over canonical JSON). */
export function recipeKey(recipe: unknown): string {
  const text = canonical(recipe);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0");
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonical((value as Record<string, unknown>)[k])).join(",") + "}";
}

function isAbort(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { name?: string }).name === "AbortError";
}

export class EditorSession<P, R, O> {
  private photo: P | null = null;
  private photoKeyRef = "";
  private photoRevision = 0;
  private recipe: R | null = null;
  private nextId = 0;
  private latest: Revision | null = null;
  private controller: AbortController | null = null;
  private shown: { result: O; revision: Revision } | null = null;
  private disposed = false;
  private readonly inflight = new Set<number>();
  private readonly counters = { scheduled: 0, displayed: 0, staleDropped: 0, aborted: 0, failed: 0, released: 0, produced: 0 };

  constructor(private readonly renderer: Renderer<P, R, O>, private readonly hooks: EditorHooks<O>) {}

  /** Open a photo. Any render of the previous photo is cancelled and can no longer display. */
  setPhoto(photo: P, key: string): void {
    this.ensure();
    if (typeof key !== "string" || !key) throw new RangeError("a photo needs a non-empty key");
    this.photo = photo;
    this.photoKeyRef = key;
    this.photoRevision++;
    this.cancel();
    this.dropShown();
  }

  /** Apply a recipe; returns the promise of this render's outcome ("shown", "stale", "aborted" or "failed"). */
  edit(recipe: R): Promise<"shown" | "stale" | "aborted" | "failed"> {
    this.ensure();
    if (this.photo === null) throw new Error("open a photo before editing");
    this.recipe = recipe;
    return this.schedule();
  }

  get current(): Revision | null { return this.latest; }
  get displayed(): Revision | null { return this.shown?.revision ?? null; }

  isCurrent(revision: Revision): boolean {
    return this.latest !== null && revision.id === this.latest.id && revision.photoRevision === this.photoRevision;
  }

  stats(): EditorStats {
    const c = this.counters;
    return { scheduled: c.scheduled, displayed: c.displayed, staleDropped: c.staleDropped, aborted: c.aborted,
      failed: c.failed, released: c.released, inFlight: this.inflight.size, liveResults: c.produced - c.released };
  }

  private ensure(): void { if (this.disposed) throw new Error("this editor session was closed"); }

  private release(result: O): void {
    this.counters.released++;
    this.hooks.release?.(result);
  }

  private dropShown(): void {
    if (this.shown) { const old = this.shown.result; this.shown = null; this.release(old); }
  }

  private cancel(): void {
    if (this.controller) { this.controller.abort(); this.controller = null; }
  }

  private async schedule(): Promise<"shown" | "stale" | "aborted" | "failed"> {
    this.cancel();
    const controller = new AbortController();
    this.controller = controller;
    const revision: Revision = Object.freeze({ id: ++this.nextId, photoKey: this.photoKeyRef,
      photoRevision: this.photoRevision, recipeKey: recipeKey(this.recipe) });
    this.latest = revision;
    this.counters.scheduled++;
    this.inflight.add(revision.id);
    const photo = this.photo as P, recipe = this.recipe as R;
    try {
      const result = await this.renderer(photo, recipe, { signal: controller.signal, revision });
      this.counters.produced++;
      if (this.disposed || controller.signal.aborted || !this.isCurrent(revision)) {
        this.counters.staleDropped++;
        this.release(result);
        return "stale";
      }
      const previous = this.shown;
      this.shown = { result, revision };
      this.counters.displayed++;
      this.hooks.display(result, revision);
      if (previous) this.release(previous.result);
      return "shown";
    } catch (error) {
      if (isAbort(error) || controller.signal.aborted) { this.counters.aborted++; return "aborted"; }
      this.counters.failed++;
      if (this.isCurrent(revision)) this.hooks.error?.(error, revision);
      return "failed";
    } finally {
      this.inflight.delete(revision.id);
      if (this.controller === controller && !this.inflight.size) this.controller = null;
    }
  }

  /** Cancel work and release the shown result. The session cannot be used afterwards. */
  dispose(): void {
    if (this.disposed) return;
    this.cancel();
    this.disposed = true;
    this.dropShown();
    this.photo = null;
    this.recipe = null;
  }
}
