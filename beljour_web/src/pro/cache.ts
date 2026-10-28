/** Byte-bounded RAM-only cache of reusable masks, landmarks and source tiles.
 * Invariant assets are keyed by photo hash and edit; level-specific render
 * buffers additionally use the exact validated level. Changing a slider level
 * therefore reuses the same source mask and landmarks without stale rendering.
 */
import { validateLevel } from "./strength.js";

export type ResourceKind = "mask" | "tile" | "landmark" | "render";
export interface CacheStats {
  readonly entries: number;
  readonly bytes: number;
  readonly computations: number;
  readonly hits: number;
  readonly evictions: number;
}

interface Entry {
  readonly data: Uint8Array;
  readonly size: number;
}

function cacheKey(hash: string, edit: string, kind: ResourceKind, resource: string, level: number): string {
  if (!/^[0-9a-f]{64}$/.test(hash)) throw new RangeError("Photo key must be lowercase SHA-256");
  if (!/^[a-z0-9_-]{1,48}$/.test(edit) || !/^[a-z0-9_-]{1,48}$/.test(resource)) {
    throw new RangeError("Unsafe edit or resource identifier");
  }
  if (!["mask", "tile", "landmark", "render"].includes(kind)) throw new RangeError("Unknown resource type");
  const checkedLevel = validateLevel(level);
  const sharedKey = `${hash}/${edit}/${kind}/${resource}`;
  return kind === "render" ? `${sharedKey}/${checkedLevel.toFixed(1)}` : sharedKey;
}

export class PhotoEditCache {
  private readonly map = new Map<string, Entry>();
  private bytes = 0;
  private computations = 0;
  private hits = 0;
  private evictions = 0;

  constructor(readonly byteCap = 16 * 1024 * 1024, readonly entryCap = 256) {
    if (!Number.isSafeInteger(byteCap) || byteCap < 1 || byteCap > 64 * 1024 * 1024 ||
        !Number.isSafeInteger(entryCap) || entryCap < 1 || entryCap > 2048) {
      throw new RangeError("Invalid local cache budget");
    }
  }

  get stats(): CacheStats {
    return Object.freeze({ entries: this.map.size, bytes: this.bytes, computations: this.computations,
      hits: this.hits, evictions: this.evictions });
  }

  get(hash: string, edit: string, kind: ResourceKind, resource: string, level: number,
    compute: () => Uint8Array): Uint8Array {
    const key = cacheKey(hash, edit, kind, resource, level);
    const old = this.map.get(key);
    if (old) {
      this.map.delete(key);
      this.map.set(key, old);
      this.hits++;
      return old.data.slice();
    }
    const value = compute();
    if (!(value instanceof Uint8Array) || value.byteLength > this.byteCap) {
      throw new RangeError("Resource exceeds cache budget or is not an unsigned byte buffer");
    }
    const copy = value.slice();
    this.map.set(key, { data: copy, size: copy.byteLength });
    this.bytes += copy.byteLength;
    this.computations++;
    this.evict();
    return value.slice();
  }

  private evict(): void {
    while (this.map.size > 0 && (this.bytes > this.byteCap || this.map.size > this.entryCap)) {
      const first = this.map.entries().next().value as [string, Entry] | undefined;
      if (!first) return;
      this.map.delete(first[0]);
      this.bytes -= first[1].size;
      first[1].data.fill(0);
      this.evictions++;
    }
  }

  invalidatePhoto(hash: string): void {
    if (!/^[0-9a-f]{64}$/.test(hash)) throw new RangeError("Invalid photo digest");
    for (const [key, entry] of this.map) {
      if (!key.startsWith(hash + "/")) continue;
      entry.data.fill(0);
      this.map.delete(key);
      this.bytes -= entry.size;
    }
  }

  clear(): void {
    for (const entry of this.map.values()) entry.data.fill(0);
    this.map.clear();
    this.bytes = 0;
  }
}
