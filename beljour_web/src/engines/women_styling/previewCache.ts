/** Ephemeral mask reuse for strength-slider movement; no image upload or storage.
 * Mask cache keys exclude strength; preview-result keys include it. No remote APIs.
 * Author: John Khan.
 */
import { guardedEdit } from './identity.js';
import type { GuardedEditResult, IdentityGuard, MaskedRenderer, WomanFrame } from './identity.js';
import { checkedLevel, StrengthMemory } from './strength.js';

export type MaskSupplier = (image: WomanFrame, effectId: string) => Uint8Array;

interface PreviewKey {
  readonly photo: string;
  readonly effect: string;
  readonly level: number;
  readonly edge: number;
  readonly lock: number;
}

function reduceFrame(frame: WomanFrame, edge: number): WomanFrame {
  if (!Number.isInteger(edge) || edge < 1 || edge > 8192) {
    throw new RangeError('Preview edge must be within 1..8192');
  }
  const longest = Math.max(frame.width, frame.height);
  if (longest <= edge) return { ...frame, data: frame.data.slice() };
  const scale = longest / edge;
  const width = Math.max(1, Math.round(frame.width / scale));
  const height = Math.max(1, Math.round(frame.height / scale));
  const reduced = new Uint8Array(width * height * frame.channels);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sy = Math.min(frame.height - 1, Math.floor(y * scale));
      const sx = Math.min(frame.width - 1, Math.floor(x * scale));
      const from = (sy * frame.width + sx) * frame.channels;
      const to = (y * width + x) * frame.channels;
      for (let c = 0; c < frame.channels; c++) reduced[to + c] = frame.data[from + c];
    }
  }
  return { width, height, channels: frame.channels, data: reduced };
}

function reduceMask(mask: Uint8Array, full: WomanFrame, edge: number): Uint8Array {
  const image: WomanFrame = { width: full.width, height: full.height,
    channels: 3, data: new Uint8Array(mask.length * 3) };
  for (let i = 0; i < mask.length; i++) {
    image.data[i * 3] = mask[i];
  }
  const reduced = reduceFrame(image, edge);
  const out = new Uint8Array(reduced.width * reduced.height);
  for (let i = 0; i < out.length; i++) out[i] = reduced.data[i * 3];
  return out;
}

export class WomenPreviewSession {
  private readonly maskCache = new Map<string, Uint8Array>();
  private readonly renderCache = new Map<string, GuardedEditResult>();
  readonly levels = new StrengthMemory();
  maskComputations = 0;

  constructor(private readonly supplier: MaskSupplier,
              private readonly guard?: IdentityGuard) {}

  render(frame: WomanFrame, effect: string, renderer: MaskedRenderer,
    options: { photoHash: string; level?: number; lockLevel?: number; previewEdge?: number | null }): GuardedEditResult {
    if (!effect || effect.length > 64) throw new RangeError('A named effect is required');
    const selected = this.levels.select(effect, options.level);
    const lock = checkedLevel(options.lockLevel ?? 5);
    const edge = options.previewEdge === undefined ? 256 : (options.previewEdge ?? 0);
    const photo = options.photoHash;
    if (!/^[a-f0-9]{64}$/.test(photo)) {
      throw new RangeError('A verified SHA-256 photo hash is required');
    }
    const cacheKey: PreviewKey = { photo, effect, level: selected.level, edge, lock };
    const id = JSON.stringify(cacheKey);
    const existing = this.renderCache.get(id);
    if (existing) return { ...existing, pixels: existing.pixels.slice() };
    const maskId = JSON.stringify([photo, effect]);
    let mask = this.maskCache.get(maskId);
    if (!mask) {
      mask = this.supplier({ ...frame, data: frame.data.slice() }, effect);
      if (!(mask instanceof Uint8Array) || mask.length !== frame.width * frame.height) {
        throw new RangeError('The mask supplier returned an invalid mask');
      }
      this.maskComputations++;
      this.maskCache.set(maskId, mask.slice());
      if (this.maskCache.size > 4) this.maskCache.delete(this.maskCache.keys().next().value!);
    }
    const image = edge === 0 ? { ...frame, data: frame.data.slice() } : reduceFrame(frame, edge);
    const region = edge === 0 ? mask.slice() : reduceMask(mask, frame, edge);
    const output = guardedEdit(image, region, renderer, selected.level, lock, this.guard);
    this.renderCache.set(id, { ...output, pixels: output.pixels.slice() });
    if (this.renderCache.size > 12) this.renderCache.delete(this.renderCache.keys().next().value!);
    return { ...output, pixels: output.pixels.slice() };
  }

  private validatePhotoHash(hash: string): void {
    if (!/^[a-f0-9]{64}$/.test(hash)) {
      throw new RangeError('A verified SHA-256 photo hash is required');
    }
  }

  private discardMatching(predicate: (photo: string, effect: string) => boolean): void {
    for (const key of this.maskCache.keys()) {
      const [photo, effect] = JSON.parse(key) as [string, string];
      if (predicate(photo, effect)) this.maskCache.delete(key);
    }
    for (const key of this.renderCache.keys()) {
      const { photo, effect } = JSON.parse(key) as PreviewKey;
      if (predicate(photo, effect)) this.renderCache.delete(key);
    }
  }

  /** Recompute a manually corrected mask and all preview results that used it. */
  invalidateMask(photoHash: string, effect: string): void {
    this.validatePhotoHash(photoHash);
    if (!effect || effect.length > 64) throw new RangeError('A named effect is required');
    this.discardMatching((photo, previousEffect) => photo === photoHash && previousEffect === effect);
  }

  /** Rebuild results when a named recipe/renderer changes, retaining strength. */
  invalidateEdit(effect: string): void {
    if (!effect || effect.length > 64) throw new RangeError('A named effect is required');
    this.discardMatching((_photo, previousEffect) => previousEffect === effect);
  }

  /** Drop only one photo's masked results; other photos may remain in memory. */
  invalidatePhoto(photoHash: string): void {
    this.validatePhotoHash(photoHash);
    this.discardMatching(photo => photo === photoHash);
  }

  release(): void {
    this.maskCache.clear();
    this.renderCache.clear();
    this.levels.clear();
  }
}
