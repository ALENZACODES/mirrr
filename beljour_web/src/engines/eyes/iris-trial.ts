/** Photo-scoped observed iris trial with strict mask ownership. Author: John Khan.
 * A default pixel-change cap is not a biometric identity measurement.
 */
import { recolourVisible } from "./visible-iris.js";
import type { IrisMasks, IrisStates } from "./visible-iris.js";

export type PrimaryBox = readonly [number, number, number, number];
export type TrialStatus = "rendered" | "no_mesh" | "no_observation" | "refused" | "neutral";
export type BytePixels = Uint8ClampedArray<ArrayBufferLike>;

export interface TrialPhoto {
  width: number;
  height: number;
  channels: 3 | 4;
  data: BytePixels;
}

export interface IrisObservation {
  masks: IrisMasks;
  states: IrisStates;
  source: "manual_or_measured" | "observed_geometry";
  pupils?: IrisMasks;
}

export interface ObservationSource {
  observe(photoKey: string, photo: TrialPhoto): IrisObservation;
}

export interface IdentityDecision {
  image: BytePixels;
  similarity: number;
  blendedBack: boolean;
}

export interface IdentityGuard {
  guard(
    before: BytePixels, after: BytePixels, channels: 3 | 4, lockLevel: number,
  ): IdentityDecision;
}

export interface IrisTrialResult {
  image: Uint8ClampedArray<ArrayBuffer>;
  width: number;
  height: number;
  level: number;
  shade: string;
  status: TrialStatus;
  reason: string;
  visibleIrises: number;
  changedPixels: number;
  similarity: number | null;
  guardCalled: boolean;
  blendedBack: boolean;
  declaredNotVisible: readonly string[];
  undeclaredMissing: readonly string[];
  simulationLabel: string;
}

interface CacheEntry {
  key: string;
  observation: IrisObservation;
  bytes: number;
}

const IRIS_NAMES = ["right_iris", "left_iris"] as const;
export const DEFAULT_LOCK_LEVEL = 5;
export const SIMULATION_LABEL = "Eye colour simulation. Eye details come from your original photo.";

export function checkedLevel(raw: number): number {
  if (!Number.isFinite(raw) || raw < 1 || raw > 5) throw new RangeError("level must be 1.0..5.0");
  const tick = Math.round(raw * 10);
  if (Math.abs(raw * 10 - tick) > 1e-8) throw new RangeError("level requires 0.1 increments");
  return tick / 10;
}

export function legacyStrength(level: number): number {
  return (checkedLevel(level) - 1) * 25;
}

function copy(source: ArrayLike<number>): Uint8ClampedArray<ArrayBuffer> {
  return Uint8ClampedArray.from(source);
}

function validatePhoto(photo: TrialPhoto): void {
  const { width, height, channels, data } = photo;
  if (!Number.isInteger(width) || !Number.isInteger(height)
      || Math.min(width, height) < 8 || Math.max(width, height) > 4096
      || width * height > 4_194_304 || (channels !== 3 && channels !== 4)
      || data.length !== width * height * channels) {
    throw new RangeError("iris trial requires a bounded RGB or RGBA image");
  }
}

function checkedBox(box: PrimaryBox | null): PrimaryBox | null {
  if (box === null) return null;
  if (box.length !== 4 || box.some(value => !Number.isFinite(value))) {
    throw new RangeError("primary face box must have four finite numbers");
  }
  if (!(0 <= box[0] && box[0] < box[2] && box[2] <= 1
        && 0 <= box[1] && box[1] < box[3] && box[3] <= 1)) {
    throw new RangeError("primary face box must have normalized positive area");
  }
  return box;
}

function scope(width: number, height: number, box: PrimaryBox): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x >= box[0] * width && x < box[2] * width
          && y >= box[1] * height && y < box[3] * height) out[y * width + x] = 1;
    }
  }
  return out;
}

function observedCopy(observation: IrisObservation, count: number): IrisObservation {
  if (!observation || (observation.source !== "manual_or_measured"
      && observation.source !== "observed_geometry")) {
    throw new RangeError("iris observation must have reviewed provenance");
  }
  if (Object.keys(observation.masks).length !== 2 || Object.keys(observation.states).length !== 2) {
    throw new RangeError("both observed iris sides are required");
  }
  const result: Record<string, Float64Array<ArrayBuffer>> = {};
  for (const name of IRIS_NAMES) {
    const values = observation.masks[name];
    if (!values || values.length !== count) {
      throw new RangeError("observed iris mask dimensions differ");
    }
    const mask = new Float64Array(count);
    for (let index = 0; index < count; index++) {
      const alpha = values[index]!;
      if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
        throw new RangeError("observed iris masks must contain finite alpha in 0..1");
      }
      mask[index] = alpha;
    }
    const state = observation.states[name];
    if (state !== "visible" && state !== "not_visible:closed"
        && state !== "not_visible:hidden_by_turn") {
      throw new RangeError("unknown observed iris visibility state");
    }
    result[name] = mask;
  }
  const pupils: Record<string, Float64Array<ArrayBuffer>> = {};
  if (observation.pupils !== undefined) {
    if (Object.keys(observation.pupils).length !== 2) {
      throw new RangeError("both pupil annotations must be supplied together");
    }
    for (const name of IRIS_NAMES) {
      const raw = observation.pupils[name];
      if (!raw || raw.length !== count) {
        throw new RangeError("pupil annotation must match image dimensions");
      }
      const values = new Float64Array(count);
      for (let index = 0; index < count; index++) {
        const alpha = raw[index]!;
        if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
          throw new RangeError("pupil annotation alpha must be in 0..1");
        }
        if (alpha >= 0.5 && result[name]![index]! < 0.5) {
          throw new RangeError("observed pupil must lie within the measured iris");
        }
        values[index] = alpha;
      }
      pupils[name] = values;
    }
  }
  return {
    masks: { right_iris: result.right_iris!, left_iris: result.left_iris! },
    states: { ...observation.states }, source: observation.source,
    ...(observation.pupils === undefined ? {} : {
      pupils: { right_iris: pupils.right_iris!, left_iris: pupils.left_iris! },
    }),
  };
}

function rgb(photo: TrialPhoto): Uint8ClampedArray<ArrayBuffer> {
  const pixels = new Uint8ClampedArray(photo.width * photo.height * 3);
  for (let index = 0; index <photo.width * photo.height; index++) {
    for (let c = 0; c < 3; c++) pixels[index * 3 + c] = photo.data[index * photo.channels + c]!;
  }
  return pixels;
}

function preview(
  original: BytePixels, width: number, height: number, channels: 3 | 4, edge: number,
): { image: Uint8ClampedArray<ArrayBuffer>; width: number; height: number } {
  if (!Number.isInteger(edge) || edge < 16 || edge > 4096) {
    throw new RangeError("previewEdge must be 16..4096");
  }
  const scale = Math.min(1, edge / Math.max(width, height));
  const newWidth = Math.max(1, Math.round(width * scale));
  const newHeight = Math.max(1, Math.round(height * scale));
  const data = new Uint8ClampedArray(newWidth * newHeight * channels);
  for (let y = 0; y < newHeight; y++) {
    const sy = Math.trunc(y * (height - 1) / Math.max(newHeight - 1, 1));
    for (let x = 0; x < newWidth; x++) {
      const sx = Math.trunc(x * (width - 1) / Math.max(newWidth - 1, 1));
      const dest = (y * newWidth + x) * channels;
      const source = (sy * width + sx) * channels;
      for (let c = 0; c < channels; c++) data[dest + c] = original[source + c]!;
    }
  }
  return { image: data, width: newWidth, height: newHeight };
}

/** Safe, non-cryptographic fingerprint for local cache invalidation only. */
function fingerprint(photo: TrialPhoto): string {
  let hash = 2166136261;
  for (const value of photo.data) {
    hash = Math.imul((hash ^ value) >>> 0, 16777619) >>> 0;
  }
  return `${photo.width}:${photo.height}:${hash.toString(16)}`;
}

export class PixelLimitGuard implements IdentityGuard {
  guard(
    before: BytePixels, after: BytePixels, channels: 3 | 4, lockLevel: number,
  ): IdentityDecision {
    const lock = checkedLevel(lockLevel);
    let total = 0;
    for (let i = 0; i < before.length / channels; i++) {
      for (let c = 0; c < 3; c++) {
        total += Math.abs(before[i * channels + c]! - after[i * channels + c]!);
      }
    }
    const difference = total / (before.length / channels * 3);
    const similarity = 1 - difference / 255;
    const limit = 0.0015 + 0.0185 * (5 - lock) / 4;
    if (difference === 0 || difference <= limit * 255) {
      return { image: copy(after), similarity, blendedBack: false };
    }
    const weight = limit * 255 / difference;
    const reduced = copy(before);
    for (let i = 0; i < before.length / channels; i++) {
      for (let c = 0; c < 3; c++) {
        const offset = i * channels + c;
        reduced[offset] = Math.trunc(before[offset]! + (after[offset]! - before[offset]!) * weight);
      }
    }
    return { image: reduced, similarity, blendedBack: true };
  }
}

export class IrisTrialEngine {
  private readonly masks = new Map<string, CacheEntry>();
  private readonly provider: ObservationSource;
  private readonly guard: IdentityGuard;
  private readonly maxBytes: number;
  private readonly maxEntries: number;
  maskComputations = 0;

  constructor(provider: ObservationSource, guard: IdentityGuard = new PixelLimitGuard(),
              options: { maxEntries?: number; maxCacheBytes?: number } = {}) {
    this.provider = provider;
    this.guard = guard;
    this.maxEntries = options.maxEntries ?? 4;
    this.maxBytes = options.maxCacheBytes ?? 16_777_216;
    if (!Number.isInteger(this.maxEntries) || this.maxEntries < 1 || this.maxEntries > 16) {
      throw new RangeError("maxEntries must be 1..16");
    }
    if (!Number.isInteger(this.maxBytes) || this.maxBytes < 1_024 || this.maxBytes > 64_000_000) {
      throw new RangeError("maxCacheBytes must be 1024..64000000");
    }
  }

  get retainedObservations(): number { return this.masks.size; }

  invalidate(photoKey?: string): void {
    if (photoKey === undefined) {
      this.masks.clear();
      return;
    }
    for (const key of this.masks.keys()) {
      if (key.startsWith(`${photoKey}:`)) this.masks.delete(key);
    }
  }

  private observed(key: string, photo: TrialPhoto): IrisObservation {
    const existing = this.masks.get(key);
    if (existing !== undefined) {
      this.masks.delete(key);
      this.masks.set(key, existing);
      return existing.observation;
    }
    const value = observedCopy(this.provider.observe(key, photo), photo.width * photo.height);
    this.maskComputations++;
    const bytes = photo.width * photo.height * 16;
    if (bytes <= this.maxBytes) {
      this.masks.set(key, { key, observation: value, bytes });
      let used = 0;
      for (const entry of this.masks.values()) used += entry.bytes;
      while (used > this.maxBytes || this.masks.size > this.maxEntries) {
        const oldest = this.masks.keys().next().value;
        if (oldest === undefined) break;
        used -= this.masks.get(oldest)!.bytes;
        this.masks.delete(oldest);
      }
    }
    return value;
  }

  render(photo: TrialPhoto, photoKey: string, options: {
    primaryBox: PrimaryBox | null; level?: number; shade?: string;
    lockLevel?: number; previewEdge?: number; maskRevision?: string;
  }): IrisTrialResult {
    validatePhoto(photo);
    const level = checkedLevel(options.level ?? 2);
    const lock = checkedLevel(options.lockLevel ?? DEFAULT_LOCK_LEVEL);
    const box = checkedBox(options.primaryBox);
    const shade = options.shade ?? "hazel";
    if (options.previewEdge !== undefined && (!Number.isInteger(options.previewEdge)
        || options.previewEdge < 16 || options.previewEdge > 4096)) {
      throw new RangeError("previewEdge must be 16..4096");
    }
    if (box === null) return this.refused(photo, level, shade, "no_mesh", "primary_face_missing");
    const revision = options.maskRevision ?? "first";
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(revision) || !/^[A-Za-z0-9_-]{1,64}$/.test(photoKey)) {
      throw new RangeError("photo key and mask revision must be short local tokens");
    }
    const observation = this.observed(`${photoKey}:${revision}:${fingerprint(photo)}`, photo);
    const primary = scope(photo.width, photo.height, box);
    for (const side of IRIS_NAMES) {
      const values = observation.masks[side];
      for (let i = 0; i < values.length; i++) {
        if (values[i]! >= 0.5 && primary[i] === 0) {
          return this.refused(photo, level, shade, "refused", "iris_outside_primary_face");
        }
      }
    }
    const original = rgb(photo);
    const candidateResult = recolourVisible(
      { width: photo.width, height: photo.height, channels: 3, data: original },
      observation.masks, observation.states, shade, legacyStrength(level),
    );
    const candidate = copy(photo.data);
    for (let i = 0; i < photo.width * photo.height; i++) {
      for (let c = 0; c < 3; c++) {
        candidate[i * photo.channels + c] = candidateResult.image[i * 3 + c]!;
      }
    }
    if (observation.pupils !== undefined) {
      for (let i = 0; i < photo.width * photo.height; i++) {
        const protectedPixel = observation.pupils.right_iris[i]! >= 0.5
          || observation.pupils.left_iris[i]! >= 0.5;
        if (protectedPixel) {
          for (let c = 0; c < 3; c++) {
            candidate[i * photo.channels + c] = photo.data[i * photo.channels + c]!;
          }
        }
      }
    }
    const guardResult = this.guard.guard(photo.data, candidate, photo.channels, lock);
    if (guardResult.image.length !== photo.data.length
        || !Number.isFinite(guardResult.similarity)
        || guardResult.similarity < 0 || guardResult.similarity > 1) {
      throw new RangeError("identity guard returned incompatible output");
    }
    const output = copy(photo.data);
    let changed = 0;
    for (let i = 0; i < primary.length; i++) {
      let authorized = primary[i] === 1;
      for (let c = 0; c < 3; c++) {
        if (candidate[i * photo.channels + c] !== photo.data[i * photo.channels + c]) break;
        if (c === 2) authorized = false;
      }
      if (!authorized) continue;
      let changedPixel = false;
      for (let c = 0; c < 3; c++) {
        const offset = i * photo.channels + c;
        output[offset] = guardResult.image[offset]!;
        if (output[offset] !== photo.data[offset]) changedPixel = true;
      }
      if (changedPixel) changed++;
    }
    const status: TrialStatus = candidateResult.eligible && changed ? "rendered"
      : level === 1 ? "neutral" : "refused";
    const reason = status === "rendered" ? candidateResult.reason
      : status === "neutral" ? "neutral_level" : candidateResult.reason;
    const displayed = options.previewEdge === undefined
      ? { image: output, width: photo.width, height: photo.height }
      : preview(output, photo.width, photo.height, photo.channels, options.previewEdge);
    return {
      ...displayed, level, shade, status, reason,
      visibleIrises: candidateResult.eligible ? candidateResult.visibleIrises : 0,
      changedPixels: changed, similarity: guardResult.similarity,
      guardCalled: true, blendedBack: guardResult.blendedBack,
      declaredNotVisible: candidateResult.declaredNotVisible,
      undeclaredMissing: candidateResult.undeclaredMissing,
      simulationLabel: SIMULATION_LABEL,
    };
  }

  private refused(photo: TrialPhoto, level: number, shade: string,
                  status: TrialStatus, reason: string): IrisTrialResult {
    return {
      image: copy(photo.data), width: photo.width, height: photo.height,
      level, shade, status, reason, visibleIrises: 0, changedPixels: 0,
      similarity: null, guardCalled: false, blendedBack: false,
      declaredNotVisible: [], undeclaredMissing: [], simulationLabel: SIMULATION_LABEL,
    };
  }
}

export function safeTrialReport(result: IrisTrialResult): Record<string, unknown> {
  return {
    format: "beljour-iris-trial/1", status: result.status, reason: result.reason,
    level: result.level, shade: result.shade, visible_irises: result.visibleIrises,
    changed_pixels: result.changedPixels, guard_called: result.guardCalled,
    blended_back: result.blendedBack,
    declared_not_visible: [...result.declaredNotVisible],
    undeclared_missing: [...result.undeclaredMissing],
    quality_verdict: "UNPROVEN", simulation: true,
  };
}
