/** Guarded women hair-placement renderer and bounded preview cache. Author: John Khan. */
import { DEFAULT_LOCK_LEVEL, PixelChangeGuard, checkedLevel, type IdentityGuard } from "../gender_look/levels.js";
import { validateMask, validatePhoto, type HairGeometry, type Photo } from "./contracts.js";
import { SIMULATION_LABEL, TEXTURES, definition, guideFields, validateGuideGeometry,
  type GuideField, type StyleKey, type TextureKey } from "./style-guides.js";

export type PrimaryBox = readonly [number, number, number, number];
export interface StyleOptions {
  readonly texture?: TextureKey;
  readonly sideMask?: Float32Array;
  readonly protectedMask?: Float32Array;
  readonly primaryBox?: PrimaryBox | null;
  readonly lockLevel?: number;
  readonly identityGuard?: IdentityGuard;
  readonly tileHeight?: number;
  readonly guideFactory?: GuideFactory;
}
export interface StylePreview {
  readonly data: Uint8ClampedArray<ArrayBuffer>;
  readonly coverage: Float32Array<ArrayBuffer>;
  readonly styleId: StyleKey;
  readonly texture: TextureKey;
  readonly level: number;
  readonly rendered: boolean;
  readonly status: "rendered" | "no_mesh" | "empty_selection";
  readonly changedPixelShare: number;
  readonly guardCalled: boolean;
  readonly blendedBack: boolean;
  readonly identitySimilarity: number | null;
  readonly simulationLabel: string;
}
export type GuideFactory = (
  style: StyleKey, geometry: HairGeometry, width: number, height: number,
  start: number, stop: number,
) => GuideField;
const textureFrequencies: Record<TextureKey, readonly [number, number, number]> = {
  straight: [1.8, .9, .12],
  wavy: [3.7, 2.7, .21],
  curly: [6.3, 5.2, .28],
  coily: [9.5, 8.3, .32],
};
function copy(source: Uint8ClampedArray): Uint8ClampedArray<ArrayBuffer> {
  const result = new Uint8ClampedArray(new ArrayBuffer(source.length));
  result.set(source);
  return result;
}
function copyMask(source: Float32Array): Float32Array<ArrayBuffer> {
  const result = new Float32Array(new ArrayBuffer(source.length * 4));
  result.set(source);
  return result;
}
function validBox(box: PrimaryBox | null | undefined): PrimaryBox | null {
  if (box == null) return null;
  if (box.length !== 4 || !box.every(Number.isFinite) || box[0] < 0 || box[1] < 0 ||
      box[2] > 1 || box[3] > 1 || box[0] >= box[2] || box[1] >= box[3]) {
    throw new RangeError("invalid primary-face rectangle");
  }
  return box;
}
function refusal(
  photo: Photo, style: StyleKey, texture: TextureKey, level: number,
  code: "no_mesh" | "empty_selection",
): StylePreview {
  return {
    data: copy(photo.data), coverage: new Float32Array(new ArrayBuffer(photo.width * photo.height * 4)),
    styleId: style, texture, level, rendered: false, status: code, changedPixelShare: 0,
    guardCalled: false, blendedBack: false, identitySimilarity: null, simulationLabel: SIMULATION_LABEL,
  };
}
function checkedOptions(photo: Photo, hair: Float32Array, options: StyleOptions) {
  validatePhoto(photo);
  validateMask(hair, photo, "hair mask");
  if (options.sideMask) validateMask(options.sideMask, photo, "side region");
  if (options.protectedMask) validateMask(options.protectedMask, photo, "protected regions");
  const selected = copyMask(hair);
  const protectedPixels = new Uint8Array(photo.width * photo.height);
  for (let index = 0; index < selected.length; index++) {
    selected[index] = Math.max(selected[index]!, options.sideMask?.[index] ?? 0);
    protectedPixels[index] = (options.protectedMask?.[index] ?? 0) > 0 ? 1 : 0;
  }
  const box = validBox(options.primaryBox);
  const tileHeight = options.tileHeight ?? 128;
  if (!Number.isInteger(tileHeight) || tileHeight < 16 || tileHeight > 512) {
    throw new RangeError("tile height must be 16..512 rows");
  }
  return { selected, protectedPixels, box, tileHeight };
}
function textureOffset(x: number, y: number, texture: TextureKey, orientation: number): number {
  const [horizontal, vertical, grain] = textureFrequencies[texture];
  const radians = orientation * 1.57;
  const along = x * Math.cos(radians) + y * Math.sin(radians);
  const across = y * Math.cos(radians) - x * Math.sin(radians);
  const stripes = Math.sin((along * horizontal + across * .37) * .18);
  const waves = Math.cos((across * vertical - along * .2) * .21);
  return grain * (.65 * stripes + .35 * waves);
}

/** Real local pixel output with a labelled, non-generative consultation overlay. */
export function renderStyleGuide(
  photo: Photo, hairMask: Float32Array, geometry: HairGeometry | null,
  styleId: StyleKey, level: number, options: StyleOptions = {},
): StylePreview {
  const original = copy(photo.data);
  const strength = checkedLevel(level);
  const lock = checkedLevel(options.lockLevel ?? DEFAULT_LOCK_LEVEL);
  const chosen = definition(styleId);
  const texture = options.texture ?? "straight";
  if (!TEXTURES.includes(texture)) throw new RangeError("unsupported hair texture");
  const settings = checkedOptions(photo, hairMask, options);
  if (geometry === null || settings.box === null) return refusal(photo, styleId, texture, strength, "no_mesh");
  validateGuideGeometry(geometry);
  const width = photo.width;
  const height = photo.height;
  const channels = photo.channels;
  const threshold = (strength - 1) / 4;
  const coverage = new Float32Array(new ArrayBuffer(width * height * 4));
  const candidate = copy(original);
  let hasEligibleHair = false;
  const factory = options.guideFactory ?? guideFields;
  const box = settings.box;
  for (let start = 0; start < height; start += settings.tileHeight) {
    const stop = Math.min(height, start + settings.tileHeight);
    const guide = factory(styleId, geometry, width, height, start, stop);
    const expected = (stop - start) * width;
    if (guide.zone.length !== expected || guide.grade.length !== expected || guide.tone.length !== expected) {
      throw new RangeError("guide tile has incompatible dimensions");
    }
    for (let index = 0; index < expected; index++) {
      const y = start + Math.floor(index / width);
      const x = index % width;
      const global = y * width + x;
      const gZone = guide.zone[index]!;
      const gGrade = guide.grade[index]!;
      const gTone = guide.tone[index]!;
      if (!Number.isFinite(gZone) || !Number.isFinite(gGrade) || !Number.isFinite(gTone)) {
        throw new RangeError("nonfinite hairstyle guide");
      }
      if (gZone < 0 || gZone > 1 || gGrade < 0 || gGrade > 1) {
        throw new RangeError("hairstyle guide outside allowed coverage");
      }
      const inside = x >= box[0] * width && x < box[2] * width &&
        y >= box[1] * height && y < box[3] * height && settings.protectedPixels[global] === 0;
      if (inside && settings.selected[global]! * gZone >= .1) hasEligibleHair = true;
      const active = inside && gGrade <= threshold + 1e-12 && strength > 1;
      const raw = active ? settings.selected[global]! * gZone : 0;
      const amount = raw >= .1 ? raw : 0;
      coverage[global] = amount;
      if (amount === 0) continue;
      const phase = textureOffset(x, y, texture, chosen.orientation);
      const signal = Math.max(-1, Math.min(1, gTone + phase));
      const delta = chosen.highlight * Math.max(signal, 0) - chosen.shadow * Math.max(-signal, 0);
      const displacement = Math.trunc(delta * amount);
      const offset = global * channels;
      for (let channel = 0; channel < 3; channel++) {
        candidate[offset + channel] = Math.max(0, Math.min(255, original[offset + channel]! + displacement));
      }
    }
  }
  // Even a neutral preview goes through a default-on guard if geometry is valid.
  if (!hasEligibleHair) return refusal(photo, styleId, texture, strength, "empty_selection");
  const guard = options.identityGuard ?? new PixelChangeGuard();
  const decision = guard.guard(copy(original), copy(candidate), channels, lock);
  if (decision.image.length !== original.length) throw new RangeError("incompatible guarded image");
  if (!Number.isFinite(decision.similarity) || decision.similarity < 0 || decision.similarity > 1) {
    throw new RangeError("identity guard returned invalid similarity");
  }
  const result = copy(original);
  let changed = 0;
  for (let pixel = 0; pixel < coverage.length; pixel++) {
    const offset = pixel * channels;
    if (coverage[pixel]! > 0) {
      for (let channel = 0; channel < 3; channel++) result[offset + channel] = decision.image[offset + channel]!;
    }
    if (result[offset] !== original[offset] || result[offset + 1] !== original[offset + 1] ||
        result[offset + 2] !== original[offset + 2]) changed++;
    if (channels === 4) result[offset + 3] = original[offset + 3]!;
  }
  return {
    data: result, coverage, styleId, texture, level: strength, rendered: true, status: "rendered",
    changedPixelShare: changed / coverage.length, guardCalled: true,
    blendedBack: decision.blendedBack, identitySimilarity: decision.similarity,
    simulationLabel: SIMULATION_LABEL,
  };
}

interface CacheEntry {
  readonly guides: GuideField;
  readonly bytes: number;
}

function imageDigest(photo: Photo): string {
  // Two independent rolling accumulators; cache content is geometry only.
  let first = 2166136261;
  let second = 2246822519;
  for (let i = 0; i < photo.data.length; i++) {
    const value = photo.data[i]!;
    first = Math.imul(first ^ value, 16777619) >>> 0;
    second = Math.imul(second + value + (i & 255), 3266489917) >>> 0;
  }
  return `${first.toString(16)}:${second.toString(16)}:${photo.data.length}`;
}

/** Bounded LRU of style geometry only; no personal photo or mask is retained. */
export class StyleGuideSession {
  readonly maxBytes: number;
  computations = 0;
  private bytes = 0;
  private readonly entries = new Map<string, CacheEntry>();

  constructor(maxBytes = 8_388_608) {
    if (!Number.isInteger(maxBytes) || maxBytes < 8192 || maxBytes > 67_108_864) {
      throw new RangeError("guide cache budget must be 8 KiB..64 MiB");
    }
    this.maxBytes = maxBytes;
  }
  get retainedBytes(): number { return this.bytes; }
  clear(): void { this.entries.clear(); this.bytes = 0; }
  invalidate(digest?: string): void {
    if (digest === undefined) { this.clear(); return; }
    for (const [key, entry] of this.entries) {
      if (key.startsWith(`${digest}:`)) { this.entries.delete(key); this.bytes -= entry.bytes; }
    }
  }
  private tile(key: string, style: StyleKey, geometry: HairGeometry,
    width: number, height: number, start: number, stop: number): GuideField {
    const existing = this.entries.get(key);
    if (existing !== undefined) {
      this.entries.delete(key);
      this.entries.set(key, existing);
      return existing.guides;
    }
    const guides = guideFields(style, geometry, width, height, start, stop);
    this.computations++;
    const bytes = guides.zone.byteLength + guides.grade.byteLength + guides.tone.byteLength;
    if (bytes <= this.maxBytes) {
      while (this.bytes + bytes > this.maxBytes && this.entries.size > 0) {
        const firstKey = this.entries.keys().next().value;
        if (firstKey === undefined) break;
        const removed = this.entries.get(firstKey)!;
        this.entries.delete(firstKey);
        this.bytes -= removed.bytes;
      }
      this.entries.set(key, { guides, bytes });
      this.bytes += bytes;
    }
    return guides;
  }
  render(photo: Photo, hair: Float32Array, geometry: HairGeometry | null,
    style: StyleKey, level: number, options: StyleOptions = {}): StylePreview {
    validatePhoto(photo);
    const digest = imageDigest(photo);
    const cached: GuideFactory = (requested, head, width, height, start, stop) => {
      const corners = [head.crown, head.left_temple, head.right_temple, head.chin];
      const points = corners.flat().join(",");
      const key = `${digest}:${requested}:${width}x${height}:${points}:${start}:${stop}`;
      return this.tile(key, requested, head, width, height, start, stop);
    };
    return renderStyleGuide(photo, hair, geometry, style, level, { ...options, guideFactory: cached });
  }
}
