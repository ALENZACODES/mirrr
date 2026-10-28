/** Bounded and private per-photo edit memo; level nudges never require a new
 * provider upload or analysis. Browser-only metadata, no persistent photos.
 * Author: John Khan.
 */
import { levelTicks } from "./strength.js";

export interface EditKey { photoHash: string; edit: string; level: number }
export interface ProviderImage { image: string; mime: "image/png" | "image/jpeg" | "image/webp" }
const ITEMS = 32;
const TTL_MS = 600_000;
const MAX_PROVIDER_BYTES = 48_000_000;

function photoHash(value: string): void {
  if (!/^[0-9a-f]{64}$/.test(value)) throw RangeError("Photo key must be a SHA-256.");
}
export function editKey(photo: string, edit: string, level: number): EditKey {
  photoHash(photo);
  if (!edit || edit.length > 100) throw RangeError("Invalid edit name.");
  return {photoHash: photo, edit, level: levelTicks(level)};
}
function keyText(key: EditKey): string { return `${key.photoHash}/${key.edit}/${key.level}`; }
export class PhotoEditCache<T> {
  private readonly entries = new Map<string, {time: number; value: T}>();
  hits = 0;
  computes = 0;
  constructor(private readonly now: () => number = Date.now) {}
  getOrCompute(key: EditKey, compute: () => T): T {
    const cacheKey = keyText(key);
    const stored = this.entries.get(cacheKey);
    const time = this.now();
    if (stored && time >= stored.time && time - stored.time <= TTL_MS) {
      this.entries.delete(cacheKey);
      this.entries.set(cacheKey, stored);
      this.hits++;
      return stored.value;
    }
    const value = compute();
    this.computes++;
    this.entries.delete(cacheKey);
    this.entries.set(cacheKey, {time, value});
    while (this.entries.size > ITEMS) this.entries.delete(this.entries.keys().next().value as string);
    return value;
  }
  dropPhoto(photo: string): void {
    photoHash(photo);
    for (const key of this.entries.keys()) if (key.startsWith(`${photo}/`)) this.entries.delete(key);
  }
  clear(): void { this.entries.clear(); }
}

/** In the browser only the returned content is cached, never the YouCam key.
 * A request key must come from the trusted local wrapper, not a product label.
 */
export class ProviderResponseCache {
  private readonly entries = new Map<string, {time: number; value: ProviderImage}>();
  private totalBytes = 0;
  hits = 0;
  misses = 0;
  constructor(private readonly now: () => number = Date.now) {}
  get(key: string): ProviderImage | null {
    const row = this.entries.get(key);
    if (!row || this.now() < row.time || this.now() - row.time > TTL_MS) {
      if (row) this.remove(key);
      this.misses++;
      return null;
    }
    this.entries.delete(key);
    this.entries.set(key, row);
    this.hits++;
    return row.value;
  }
  put(key: string, value: ProviderImage): void {
    if (!/^[0-9a-f]{64}$/.test(key) || !/^data:image\/(?:png|jpeg|webp);base64,/.test(value.image)) {
      throw RangeError("Unverified preview content or cache identity.");
    }
    if (value.image.length > MAX_PROVIDER_BYTES) return;
    this.remove(key);
    this.entries.set(key, {time: this.now(), value});
    this.totalBytes += value.image.length;
    while (this.entries.size > ITEMS || this.totalBytes > MAX_PROVIDER_BYTES) {
      this.remove(this.entries.keys().next().value as string);
    }
  }
  private remove(key: string): void {
    const item = this.entries.get(key);
    if (item) this.totalBytes -= item.value.image.length;
    this.entries.delete(key);
  }
  clear(): void { this.entries.clear(); this.totalBytes = 0; }
  get bytesUsed(): number { return this.totalBytes; }
}
