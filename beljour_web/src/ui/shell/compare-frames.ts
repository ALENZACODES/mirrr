/** The pictures each compare mode needs, rendered from the layer stack by the R7 engines.
 *
 * pair  : original and the current edit (the editor's cached preview when given)
 * quad  : original, all edits, the target layer alone, all edits without it
 * stops : the target layer at nine strengths, everything else in the stack unchanged
 * The target is the selected layer, or the top visible local layer when none is selected.
 * Grid frames render on a scaled copy of the source (scale.ts) so nine renders stay fast;
 * the shell worker runs the same function off the main thread.
 *
 * Author: John Khan.
 */
import type { ByteImage } from "../../engines/core/buffer.js";
import { type CompareMode, MODE_INFO, stopGridValues } from "./compare.js";
import { effective } from "./layers.js";
import { type Preview, renderLayers } from "./pipeline.js";
import { scaleSource } from "./scale.js";
import { strengthName, stopsFor } from "./stops.js";
import { RENDER_KINDS, type PhotoSource, type RenderKind, type ShellLayer } from "./types.js";

export interface Frame {
  id: string;
  caption: string;
  image: ByteImage;
  /** True when a simulated layer is visible in this frame (it gets the simulation label). */
  simulation: boolean;
  effective: number;
}

export const QUAD_SIDE = 360;
export const STOP_SIDE = 240;

const isLocal = (layer: ShellLayer): boolean => (RENDER_KINDS as readonly string[]).includes(layer.kind);

/** The layer the grid modes study. */
export function targetLayer(layers: readonly ShellLayer[], selected: string | null): ShellLayer | null {
  const chosen = selected ? layers.find((l) => l.id === selected) : undefined;
  if (chosen && isLocal(chosen)) return chosen;
  const visible = [...layers].reverse().find((l) => isLocal(l) && l.enabled && l.opacity > 0);
  return visible ?? null;
}

export interface Stack { id: string; caption: string; layers: ShellLayer[] }

/** A stop's name when the value is a named stop, otherwise the value with its half percent. */
export function stopLabel(kind: RenderKind, value: number): string {
  const named = strengthName(kind, value);
  if (!named.endsWith("%")) return named;
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

/** The stacks (layer lists) a mode renders, without rendering them. */
export function stacksFor(mode: CompareMode, layers: readonly ShellLayer[], selected: string | null): Stack[] {
  const info = MODE_INFO[mode];
  const all = layers.map((l) => ({ ...l, parameters: { ...l.parameters } }));
  if (info.inputs === "pair") {
    return [{ id: "original", caption: "Original", layers: [] }, { id: "edited", caption: effective(all).length ? "With your edits" : "With your edits (none yet)", layers: all }];
  }
  const target = targetLayer(layers, selected);
  if (info.inputs === "quad") {
    if (!target) {
      return [{ id: "original", caption: "Original", layers: [] }, { id: "edited", caption: "All edits (none yet)", layers: all },
        { id: "alone", caption: "Add a local layer to see it alone", layers: [] },
        { id: "without", caption: "Add a local layer to see the rest without it", layers: all }];
    }
    const alone = [{ ...target, enabled: true, parameters: { ...target.parameters } }];
    return [
      { id: "original", caption: "Original", layers: [] },
      { id: "edited", caption: "All edits", layers: all },
      { id: "alone", caption: `${target.name} alone`, layers: alone },
      { id: "without", caption: `All edits without ${target.name}`, layers: all.filter((l) => l.id !== target.id) },
    ];
  }
  if (!target) throw new Error("Add or select a local layer to see it at nine strengths.");
  const kind = target.kind as RenderKind;
  return stopGridValues(stopsFor(kind)).map((value) => ({
    id: `stop-${value}`,
    caption: `${target.name} · ${stopLabel(kind, value)}`,
    layers: all.map((l) => l.id === target.id ? { ...l, enabled: true, strength: value } : l),
  }));
}

export function sideFor(mode: CompareMode): number | null {
  const info = MODE_INFO[mode];
  return info.inputs === "quad" ? QUAD_SIDE : info.inputs === "stops" ? STOP_SIDE : null;
}

export function renderStack(source: PhotoSource, stack: Stack): Frame {
  const preview = renderLayers(source, stack.layers);
  return { id: stack.id, caption: stack.caption, image: preview.image, effective: preview.effective,
    simulation: effective(stack.layers).some((l) => l.simulation) };
}

/** Render every frame a mode needs. `current` reuses the editor's preview for the pair modes,
 * and a cache (when given) means identical stacks on the same source never render twice. */
export function compareFrames(source: PhotoSource, layers: readonly ShellLayer[], selected: string | null, mode: CompareMode,
  current?: Preview, cache?: FrameCache): Frame[] {
  const stacks = stacksFor(mode, layers, selected), side = sideFor(mode);
  let base: PhotoSource | null = null;
  return stacks.map((stack) => {
    if (side === null && stack.id === "original") return { id: "original", caption: stack.caption, image: source.image, effective: 0, simulation: false };
    if (side === null && stack.id === "edited" && current) {
      return { id: "edited", caption: stack.caption, image: current.image, effective: current.effective,
        simulation: effective(stack.layers).some((l) => l.simulation) };
    }
    const key = FrameCache.key(`${source.id}:${source.geometryRevision ?? 0}`, side, stack);
    const hit = cache?.get(key);
    if (hit) return hit;
    base ??= side === null ? source : scaleSource(source, side);
    const frame = renderStack(base, stack);
    cache?.set(key, frame);
    return frame;
  });
}

/** A small least-recently-used cache of rendered frames keyed by source and stack settings. */
export class FrameCache {
  private readonly items = new Map<string, Frame>();
  constructor(private readonly limit = 48) {
    if (!(Number.isInteger(limit) && limit >= 1 && limit <= 512)) throw new RangeError("Cache size must be 1–512");
  }
  static key(sourceId: string, side: number | null, stack: Stack): string {
    return `${sourceId}|${side ?? "full"}|${JSON.stringify(stack.layers)}|${stack.caption}`;
  }
  get size(): number { return this.items.size; }
  get(key: string): Frame | undefined {
    const hit = this.items.get(key);
    if (hit) { this.items.delete(key); this.items.set(key, hit); }
    return hit;
  }
  set(key: string, frame: Frame): void {
    this.items.delete(key); this.items.set(key, frame);
    while (this.items.size > this.limit) this.items.delete(this.items.keys().next().value as string);
  }
  clear(): void { this.items.clear(); }
}
