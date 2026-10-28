/** R8 editor document controller: all effects are reversible settings over one source.
 * Does not store photos in history, send network requests or hold API keys.
 * R9 adds option picks from the thumbnail strip and the compare frames, on the same
 * history and layer stack (no second table).
 * Author: John Khan.
 */
import { checkFace } from "../../engines/shape/geometry.js";
import type { Point2 } from "../../engines/warp/field.js";
import { type Mask, requireMask } from "../../engines/core/buffer.js";
import { browserShellRenderer, type LightingRenderer } from "./gpu-renderer.js";
import { defaultSample, readiness, tool } from "./catalogue.js";
import { GENTLE_DEFAULT } from "../../layout/effects.js";
import { History, initialState } from "./history.js";
import { appendLayer, editLayer, moveLayer, removeLayer } from "./layers.js";
import { makeSample } from "./demo.js";
import { renderLayers, type Preview } from "./pipeline.js";
import { defaultParams } from "./thumbnails.js";
import { type CompareMode } from "./compare.js";
import { type Frame, FrameCache, compareFrames } from "./compare-frames.js";
import { EditorPreviewCache } from "./editor-preview-cache.js";
import type { Seal } from "./annotations.js";
import type { ParamValue, PhotoSource, RenderKind, SampleId, ShellLayer, StudioId, StudioState } from "./types.js";

export class Editor {
  private photo: PhotoSource;
  private journal: History;
  private nextId = 0;
  private sourceVersion = 0;
  get renderVersion(): string { return `${this.sourceVersion}:${this.renderer.generation}`; }
  private showingOriginal = false;
  private cached: { key: string; result: Preview } | null = null;
  private readonly frameCache = new FrameCache();
  private readonly studioCache = new EditorPreviewCache();
  private readonly listeners = new Set<() => void>();
  subscribe(listener: () => void): () => void { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  constructor(sample: SampleId = "low-light", private readonly renderer: LightingRenderer = browserShellRenderer()) {
    this.photo = makeSample(sample);
    this.journal = new History(initialState(this.photo.id));
  }
  get source(): PhotoSource { return this.photo; }
  get history(): History { return this.journal; }
  get document(): StudioState { return this.journal.current; }
  get selected(): ShellLayer | null {
    return this.document.layers.find((l) => l.id === this.document.selected) ?? null;
  }
  get canApply(): boolean {
    return readiness(this.document.studio, this.photo).ready && tool(this.document.studio).source === "local";
  }
  get blockedReason(): string | null {
    const ready = readiness(this.document.studio, this.photo);
    return ready.ready ? null : ready.reason;
  }
  /** New source deliberately resets all layers and undo steps. */
  load(source: PhotoSource, preferred: StudioId = "enhance"): void {
    this.photo = { ...source, geometryRevision: ++this.sourceVersion };
    this.frameCache.clear();
    this.studioCache.clear();
    this.nextId = 0; this.showingOriginal = false;
    this.journal.reset(initialState(source.id, preferred));
    this.invalidate();
  }
  /** Apply a user-drawn mask or R7 control-point fixture to this on-device photo.
   * The source image stays the same. Restarting history prevents old layers from
   * accidentally rendering against geometry that has since been replaced.
   */
  mark(selection: Seal): void {
    const current = this.photo;
    if (selection.mask.width !== current.image.width || selection.mask.height !== current.image.height) {
      throw new RangeError("Markings must have the same dimensions as the source photo");
    }
    const updated: PhotoSource = selection.kind === "crown"
      ? { ...current, crown: selection.mask }
      : { ...current, body: selection.controls, person: selection.mask };
    this.load(updated, selection.kind === "crown" ? "hair-fibre" : "posture");
  }
  /** Commit a manual hair mask without changing source pixels or settings history. */
  setHair(hair: Mask, placement?: Mask): void {
    for (const mask of [hair, placement]) {
      if (!mask) continue;
      requireMask(mask);
      if (mask.data.length !== mask.width * mask.height || mask.width !== this.photo.image.width || mask.height !== this.photo.image.height) throw new RangeError("Hair markings must match the photo size.");
    }
    this.photo = { ...this.photo, geometryRevision: ++this.sourceVersion, hair: { ...hair, data: Float32Array.from(hair.data) },
      hairPaint: placement ? { ...placement, data: Float32Array.from(placement.data) } : undefined };
    this.frameCache.clear();
    this.studioCache.clear();
    this.invalidate();
  }
  /** Attaching geometry resets prior edits so their coordinate system cannot become stale. */
  setFace(points: readonly Point2[]): void {
    checkFace(points);
    const { width, height } = this.photo.image;
    if (points.some(([x, y]) => x < -width || x > width * 2 || y < -height || y > height * 2)) throw new RangeError("Face points are outside this photo.");
    this.load({ ...this.photo, face: points.map(([x, y]) => [x, y] as Point2) }, this.document.studio);
  }
  /** A group photo's faces: each is checked like setFace; the first becomes the face being
   * edited. Edits reset, as with setFace; per-face edits live in save/multi-face.ts. */
  setFaces(faces: readonly (readonly Point2[])[]): void {
    if (faces.length < 2 || faces.length > 6) throw new RangeError("A group photo needs 2 to 6 faces.");
    const { width, height } = this.photo.image;
    for (const points of faces) {
      checkFace(points);
      if (points.some(([x, y]) => x < -width || x > width * 2 || y < -height || y > height * 2)) throw new RangeError("Face points are outside this photo.");
    }
    const copies = faces.map((points) => points.map(([x, y]) => [x, y] as Point2));
    this.load({ ...this.photo, face: copies[0], faces: copies }, this.document.studio);
  }
  dispose(): void {
    this.renderer.dispose();
    this.frameCache.clear();
    this.studioCache.clear();
    this.cached = null;
    this.listeners.clear();
  }
  loadSample(sample: SampleId, preferred?: StudioId): void {
    const row = preferred ?? this.document.studio;
    this.load(makeSample(sample), row);
  }
  /** Navigation is not an edit to undo. It is a new snapshot state only when chosen. */
  selectStudio(studio: StudioId): void {
    if (this.document.studio === studio) return;
    if (this.journal.change(`Open ${tool(studio).title}`, (s) => ({ ...s, studio }))) this.invalidate();
  }
  choose(id: string | null): void {
    if (id !== null && !this.document.layers.some((l) => l.id === id)) throw new RangeError("Layer not found");
    if (this.document.selected === id) return;
    if (this.journal.change("Select layer", (s) => ({ ...s, selected: id }))) this.invalidate();
  }
  private invalidate(): void { this.cached = null; for (const listener of [...this.listeners]) { try { listener(); } catch { /* Optional recovery UI cannot interrupt an edit. */ } } }
  private change(label: string, fn: (s: StudioState) => StudioState): void {
    if (this.journal.change(label, fn)) this.invalidate();
  }
  add(kind: RenderKind = this.document.studio as RenderKind, overrides: Readonly<Record<string, ParamValue>> = {}, strength = GENTLE_DEFAULT): ShellLayer {
    const ready = readiness(kind, this.photo);
    if (!ready.ready) throw new Error(ready.reason);
    const row = tool(kind), id = `layer-${++this.nextId}`;
    const params: Record<string, ParamValue> = { ...defaultParams(kind, this.photo), ...overrides };
    // Filters are photo looks, not simulations of a change to her (filters-plan.md §1.1 rule 7).
    const item: ShellLayer = { id, kind, name: row.title, enabled: true, opacity: 1, strength,
      parameters: params, provenance: "local", simulation: kind !== "enhance" && kind !== "filters",
      origin: this.photo.kind === "sample" ? "sample" : "photo" };
    this.change(`Apply ${row.title}`, (s) => ({ ...s, layers: appendLayer(s.layers, item), selected: id }));
    return item;
  }
  /** A thumbnail pick: change the selected layer of that tool in one step, or add a new layer. */
  applyOption(kind: RenderKind, params: Readonly<Record<string, ParamValue>>, label: string, strength?: number): ShellLayer {
    const chosen = this.selected;
    if (chosen && chosen.kind === kind) {
      this.change(`${tool(kind).title}: ${label}`, (s) => ({ ...s, layers: editLayer(s.layers, chosen.id,
        { enabled: true, ...(strength === undefined ? {} : { strength }), parameters: { ...chosen.parameters, ...params } }) }));
      return this.selected!;
    }
    return this.add(kind, params, strength ?? GENTLE_DEFAULT);
  }
  update(id: string, changes: Partial<Pick<ShellLayer, "enabled" | "opacity" | "strength" | "name">>, label = "Change layer"): void {
    this.change(label, (s) => ({ ...s, layers: editLayer(s.layers, id, changes) }));
  }
  param(id: string, key: string, value: ParamValue): void {
    const item = this.document.layers.find((l) => l.id === id);
    if (!item) throw new RangeError("Layer not found");
    this.change(`Set ${key}`, (s) => ({ ...s, layers: editLayer(s.layers, id, { parameters: { ...item.parameters, [key]: value } }) }));
  }
  toggle(id: string): void {
    const item = this.document.layers.find((l) => l.id === id);
    if (!item) throw new RangeError("Layer not found");
    this.update(id, { enabled: !item.enabled }, item.enabled ? "Hide layer" : "Show layer");
  }
  move(id: string, by: -1 | 1): void {
    this.change("Reorder layer", (s) => ({ ...s, layers: moveLayer(s.layers, id, by) }));
  }
  remove(id: string): void {
    this.change("Remove layer", (s) => ({ ...s, layers: removeLayer(s.layers, id),
      selected: s.selected === id ? null : s.selected }));
  }
  resetLayers(): void {
    this.change("Reset all edits", (s) => ({ ...s, layers: [], selected: null, showBefore: false }));
  }
  setShowBefore(enabled: boolean): void {
    // A held compare must never create two undo entries per pointer gesture.
    this.showingOriginal = enabled;
  }
  zoom(value: number): void {
    this.change("Change zoom", (s) => ({ ...s, zoom: Math.min(8, Math.max(0.25, value)) }));
  }
  undo(): StudioState { const result = this.journal.undo(); this.invalidate(); return result; }
  redo(): StudioState { const result = this.journal.redo(); this.invalidate(); return result; }
  jump(i: number): StudioState { const result = this.journal.jump(i); this.invalidate(); return result; }
  preview(): Preview {
    const state = this.document;
    if (this.showingOriginal || state.showBefore) return { image: this.photo.image, labels: [], metrics: [], effective: 0 };
    return this.rendered();
  }
  /** The edited preview, ignoring any held "before" view. */
  rendered(): Preview {
    const state = this.document;
    const key = JSON.stringify(state.layers) + ":" + this.renderer.generation;
    if (this.cached?.key === key) return this.cached.result;
    this.studioCache.useSource(`${this.sourceVersion}:${this.photo.id}:${this.renderer.generation}`);
    const reused = this.studioCache.get(key);
    if (reused) {
      this.cached = { key, result: reused };
      return reused;
    }
    const result = renderLayers(this.photo, state.layers, this.renderer);
    this.studioCache.put(key, result);
    this.cached = { key, result };
    return result;
  }
  /** The pictures a compare mode needs. Pair modes reuse the cached preview; grids render scaled. */
  frames(mode: CompareMode): Frame[] {
    const state = this.document;
    return compareFrames(this.photo, state.layers, state.selected, mode, this.rendered(), this.frameCache);
  }
  /** A photo-free document inventory; do not include layer geometry or photo bytes. */
  summary(): { sample: boolean; dimensions: string; count: number; steps: number; localOnly: true } {
    return { sample: this.photo.kind === "sample", dimensions: `${this.photo.image.width}×${this.photo.image.height}`,
      count: this.document.layers.length, steps: this.journal.length, localOnly: true };
  }
  /** Convenient guarded sample adoption from studio nav. */
  loadRecommendedSample(): void { this.loadSample(defaultSample(this.document.studio), this.document.studio); }
}
