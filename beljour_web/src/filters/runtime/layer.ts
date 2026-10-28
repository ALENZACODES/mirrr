/**
 * The filter layer kind in the studio shell (R8 layer stack, R9 strip): what a "filters" layer
 * stores, how it renders, and the ranked options its thumbnail strip shows.
 *
 * A filter layer is one ShellLayer with kind "filters": strength is the 0-100 slider and the
 * parameters say which look and which toggles. Nothing else is stored, so undo, history,
 * compare modes and My Looks work as for every other layer (no second stack):
 *
 *   recipe       the look's id (C08 ...)            preset      a named variant, "" for none
 *   guard        skin guard on (default true)       protect     Protect skin
 *   background   Background only                    addon_*    Built additive looks, 0-100
 *
 * Masks come from the photo: the 478-point face of a drawn or recorded face gives the skin
 * and the face oval; a person outline alone gives no skin (the look then runs as the
 * missing-mask fallback). Filters are photo looks, not simulations of a change to her.
 * Author: John Khan.
 */
import type { ByteImage } from "../../engines/core/buffer.js";
import type { LayerResult, ParamValue, PhotoSource, ShellLayer } from "../../ui/shell/types.js";
import { type FilterMasks, NO_MASKS, fromLandmarks, fromPerson, maskCentre } from "../masks/blend.js";
import { catalogue } from "../recipe/registry.js";
import type { Recipe } from "../recipe/schema.js";
import { ThumbCache, thumbKey, thumbSourceStamp } from "./cache.js";
import { type Settings, render } from "./engine.js";
import { checkedLevel, fromPercent, toPercent } from "./strength.js";

/** The best daily default (§2.1 C08: "still me, best day"), used when a new filter layer has no pick. */
export const DEFAULT_RECIPE = "C08";
export const BUILT_ADDON_IDS = [
  "fade", "vignette", "centre-light", "glow", "halation", "border",
  "grain", "structure",
] as const;
export type BuiltAddon = typeof BUILT_ADDON_IDS[number];
export const addonParamKey = (id: BuiltAddon): string => `addon_${id.replace(/-/g, "_")}`;
export const PARAM_KEYS = [
  "recipe", "preset", "guard", "protect", "background", "identity_lock",
  "addon_fade", "addon_vignette", "addon_centre_light", "addon_glow",
  "addon_halation", "addon_border", "addon_grain", "addon_structure",
] as const;

export function defaultFilterParams(recipeId: string = DEFAULT_RECIPE): Record<string, ParamValue> {
  const r = catalogue().get(recipeId);
  const params: Record<string, ParamValue> = { recipe: r.id, preset: "", guard: r.defaults.guard,
    protect: r.defaults.protectSkin, background: r.defaults.backgroundOnly, identity_lock: true };
  for (const id of BUILT_ADDON_IDS) {
    const manualOnly = catalogue().addons.get(id)?.manualOnly ?? false;
    params[addonParamKey(id)] = manualOnly ? 0 : r.defaults.addons.find((a) => a.id === id)?.amount ?? 0;
  }
  return params;
}

export function recipeFor(layer: Pick<ShellLayer, "parameters">): Recipe {
  const id = layer.parameters.recipe;
  if (typeof id !== "string" || !catalogue().has(id)) throw new RangeError("Pick a look for this filter layer");
  return catalogue().get(id);
}

export function settingsFor(layer: Pick<ShellLayer, "parameters" | "strength">): Settings {
  const p = layer.parameters;
  const flag = (key: string) => (typeof p[key] === "boolean" ? (p[key] as boolean) : undefined);
  const addons: Record<string, number> = {};
  for (const id of BUILT_ADDON_IDS) {
    const value = p[addonParamKey(id)];
    if (value !== undefined) {
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        throw new RangeError(`Add-on ${id} needs a finite non-negative amount`);
      }
      // The existing Fade inspector saturates out-of-range percentages. Retain
      // that backward-compatible behaviour for each additive control.
      // A new filter layer begins with opt-in effects at zero. Omit them
      // until the user moves the slider, preserving legacy recipe output.
      if (value > 0 || !catalogue().addons.get(id)?.manualOnly) {
        addons[id] = Math.min(100, value);
      }
    }
  }
  const level = typeof p.level === "number" ? checkedLevel(p.level) : undefined;
  return {
    ...(level === undefined ? { strength: layer.strength } : { level }),
    identityLock: flag("identity_lock") ?? true,
    guard: flag("guard"),
    protectSkin: flag("protect"),
    backgroundOnly: flag("background"),
    preset: typeof p.preset === "string" && p.preset ? p.preset : null,
    addons,
  };
}

/** Put a 0.1-step decimal level in the layer. The shell re-renders when its
 * revision changes; the same parameters work for thumbnail, preview and export. */
export function withFilterLevel<T extends Pick<ShellLayer, "parameters" | "strength">>(layer: T, level: number): T {
  const valid = checkedLevel(level);
  const lock = layer.parameters.identity_lock;
  return { ...layer, strength: toPercent(valid), parameters: { ...layer.parameters, level: valid,
    identity_lock: typeof lock === "boolean" ? lock : true } };
}

/** Read a level from an existing filter layer without mutating old recipes. */
export function filterLevel(layer: Pick<ShellLayer, "parameters" | "strength">): number {
  const value = layer.parameters.level;
  return typeof value === "number" ? checkedLevel(value) : fromPercent(layer.strength);
}

interface MaskMemoEntry {
  readonly masks: FilterMasks;
  readonly facePoints: Float64Array | null;
  readonly person: PhotoSource["person"];
  readonly personPixels: Float32Array | Float64Array | null;
  readonly personSize: readonly [number, number, number] | null;
  readonly bytes: number;
}

// Masks and mesh coordinates remain memory-only, with a strict bounded cache.
// A source larger than this cap can be rendered but is not retained globally.
export const MASK_MEMO_MAX_BYTES = 8 * 1024 * 1024;
const MASK_MEMO_MAX_ENTRIES = 16;
const maskMemo = new Map<string, MaskMemoEntry>();
let maskMemoBytes = 0;

export function maskMemoUsage(): { entries: number; bytes: number } {
  return { entries: maskMemo.size, bytes: maskMemoBytes };
}

/** Caller must invoke this when the local photo or editor session is reset. */
export function clearFilterMaskCache(): void {
  maskMemo.clear();
  maskMemoBytes = 0;
}

/** Drop one source without evicting other active photos. */
export function dropFilterMaskSource(sourceId: string): number {
  let removed = 0;
  for (const [key, entry] of maskMemo) {
    if (key.startsWith(`${encodeURIComponent(sourceId)}|`)) {
      maskMemo.delete(key);
      maskMemoBytes -= entry.bytes;
      removed++;
    }
  }
  return removed;
}

/** Compare every mesh coordinate, not just its array identity or photo ID.
 * A landmark correction may change an existing Point2 array in place. */
function faceUnchanged(face: PhotoSource["face"], frozen: Float64Array | null): boolean {
  if (!face) return frozen === null;
  if (!frozen || frozen.length !== face.length * 2) return false;
  for (let index = 0; index < face.length; index++) {
    if (face[index][0] !== frozen[index * 2] || face[index][1] !== frozen[index * 2 + 1]) return false;
  }
  return true;
}

function snapshotFace(face: PhotoSource["face"]): Float64Array | null {
  if (!face) return null;
  const out = new Float64Array(face.length * 2);
  for (let index = 0; index < face.length; index++) {
    out[index * 2] = face[index][0];
    out[index * 2 + 1] = face[index][1];
  }
  return out;
}

/** Do not trust the person-mask object identity: brush changes can mutate its
 * alpha buffer in place while retaining the same source ID and revision. */
function personUnchanged(person: PhotoSource["person"], cached: MaskMemoEntry): boolean {
  if (person !== cached.person) return false;
  if (!person) return cached.personPixels === null && cached.personSize === null;
  const saved = cached.personPixels;
  const dims = cached.personSize;
  if (!saved || !dims || person.data.length !== saved.length ||
    person.width !== dims[0] || person.height !== dims[1] || person.channels !== dims[2]) return false;
  for (let index = 0; index < saved.length; index++) {
    if (!Object.is(person.data[index], saved[index])) return false;
  }
  return true;
}

function snapshotPerson(person: PhotoSource["person"]): Float32Array | Float64Array | null {
  if (!person) return null;
  return person.data instanceof Float64Array
    ? Float64Array.from(person.data) : Float32Array.from(person.data);
}

/** Masks are never reused across geometry revisions or changed mesh points.
 * Only face coordinates and masks are retained, never source photo bytes. */
export function masksFor(source: PhotoSource): FilterMasks {
  const { width, height } = source.image;
  const key = `${encodeURIComponent(source.id)}|${width}x${height}|${source.geometryRevision ?? 0}`;
  const cached = maskMemo.get(key);
  if (cached && personUnchanged(source.person, cached) && faceUnchanged(source.face, cached.facePoints)) {
    maskMemo.delete(key);
    maskMemo.set(key, cached);
    return cached.masks;
  }
  if (cached) {
    maskMemoBytes -= cached.bytes;
    maskMemo.delete(key);
  }
  const masks = source.face && source.face.length >= 468 ? fromLandmarks(source.face, width, height)
    : source.person ? fromPerson(source.person) : NO_MASKS;
  // Estimate first. For a 12 MP face the masks alone can exceed the memo
  // budget, so avoid allocating an otherwise unused second person-mask copy.
  const bytes = (masks.skin?.data.byteLength ?? 0) +
    (masks.person?.data.byteLength ?? 0) +
    (source.face?.length ?? 0) * 2 * Float64Array.BYTES_PER_ELEMENT +
    (source.person?.data.byteLength ?? 0);
  if (bytes > MASK_MEMO_MAX_BYTES) return masks;
  const facePoints = snapshotFace(source.face);
  const personPixels = snapshotPerson(source.person);
  const personSize = source.person
    ? [source.person.width, source.person.height, source.person.channels] as const : null;
  maskMemo.set(key, { masks, facePoints, person: source.person, personPixels, personSize, bytes });
  maskMemoBytes += bytes;
  while (maskMemo.size > MASK_MEMO_MAX_ENTRIES || maskMemoBytes > MASK_MEMO_MAX_BYTES) {
    const oldest = maskMemo.keys().next().value as string;
    const entry = maskMemo.get(oldest);
    if (!entry) throw new Error("inconsistent filter mask cache state");
    maskMemoBytes -= entry.bytes;
    maskMemo.delete(oldest);
  }
  return masks;
}

export function faceCentreFor(masks: FilterMasks): [number, number] | null {
  return masks.source === "landmarks" && masks.person ? maskCentre(masks.person) : null;
}

/** Render a filter layer on the current preview (the shell's applyLocalLayer calls this). */
export function applyFilterLayer(img: ByteImage, source: PhotoSource, layer: ShellLayer): LayerResult {
  const recipe = recipeFor(layer);
  const masks = masksFor(source);
  const result = render(img, recipe, settingsFor(layer), masks, faceCentreFor(masks));
  const image: ByteImage = { width: result.image.width, height: result.image.height, channels: 3, data: result.image.data };
  return { image, label: `Look · ${recipe.name}`, metrics: { recipe: recipe.id, look: recipe.name, strength_used: result.plan.strength,
    guard: result.plan.guard && masks.skin !== null, fallback: result.plan.fallback, masks: masks.source,
    notes: result.notes.join(" ") } };
}

export interface FilterOption { id: string; recipe: string; label: string; description: string; tab: string; rank: number;
  params: Record<string, ParamValue>; strength: number }

/** Every look in strip order (§2.22 rank), with the parameters one tap gives. */
export function filterOptions(): FilterOption[] {
  return catalogue().recipes.map((r) => ({ id: `filters:recipe:${r.id}`, recipe: r.id, label: r.name, description: r.description,
    tab: r.tab, rank: r.rank, params: defaultFilterParams(r.id), strength: r.defaults.strength }));
}

export const THUMBS = new ThumbCache();

/** One strip tile: the look at its default on a small copy of the photo, cached. */
type TileOption = Pick<FilterOption, "recipe" | "params" | "strength">;

/** Use only a stamp computed from these pixels in the current synchronous batch. */
function renderStampedTile(small: PhotoSource, option: TileOption, stamp: string, cache: ThumbCache,
  safeCopy = false): ByteImage {
  const key = thumbKey({ source: small.id, revision: small.geometryRevision ?? 0,
    snapshot: stamp, recipe: option.recipe, strength: option.strength,
    side: Math.max(small.image.width, small.image.height),
    params: option.params as Record<string, string | number | boolean> });
  const hit = safeCopy ? cache.getCopy(key) : cache.get(key);
  if (hit) return hit;
  const layer = { parameters: option.params, strength: option.strength } as ShellLayer;
  const out = applyFilterLayer(small.image, small, { ...layer, id: "thumb-filters", kind: "filters", name: "Filters", enabled: true,
    opacity: 1, provenance: "local", simulation: false, origin: small.kind === "sample" ? "sample" : "photo" }).image;
  if (safeCopy) cache.setCopy(key, out);
  else cache.set(key, out);
  return out;
}

/** Single-tile compatibility API: always re-check current source bytes. */
export function renderFilterTile(small: PhotoSource, option: TileOption, cache: ThumbCache = THUMBS): ByteImage {
  return renderStampedTile(small, option, thumbSourceStamp(small), cache);
}

/** Page-at-a-time filter rendering. Source bytes are hashed only once per page.
 * The result is fully synchronous; the caller decides when to request the next
 * page. No hidden tasks survive a change of photo or editor session. */
export function renderFilterBatch(small: PhotoSource, options: readonly TileOption[],
  page = 0, size = 12, cache: ThumbCache = THUMBS): ByteImage[] {
  if (!(Number.isSafeInteger(page) && page >= 0)) throw new RangeError("filter page must be non-negative");
  if (!(Number.isSafeInteger(size) && size >= 1 && size <= 61)) throw new RangeError("filter page size must be 1-61");
  const pages = Math.max(1, Math.ceil(options.length / size));
  if (page >= pages) throw new RangeError("filter page exceeds catalogue");
  const visible = options.slice(page * size, (page + 1) * size);
  if (!visible.length) return [];
  const stamp = thumbSourceStamp(small);
  return visible.map((option) => renderStampedTile(small, option, stamp, cache, true));
}
