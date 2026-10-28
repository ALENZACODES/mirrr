/** In-memory LRU for repeated Studio render states on one source revision.
 * No photos or cache identifiers are persisted or reported to a server.
 * The owning editor clears this cache when its source or geometry changes.
 */
import type { Preview } from "./pipeline.js";

export interface EditorCacheStats {
  readonly hits: number;
  readonly misses: number;
  readonly entries: number;
  readonly bytes: number;
  readonly evictions: number;
}

interface CachedRender {
  readonly preview: Preview;
  readonly bytes: number;
}

const DEFAULT_LIMIT = 24 * 1024 * 1024;

export class EditorPreviewCache {
  private sourceToken: string | null = null;
  private readonly renders = new Map<string, CachedRender>();
  private currentBytes = 0;
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(private readonly limitBytes = DEFAULT_LIMIT) {
    if (!Number.isSafeInteger(limitBytes) || limitBytes < 1_024 || limitBytes > 128 * 1024 * 1024) {
      throw new RangeError("Invalid Studio preview cache size");
    }
  }

  get stats(): EditorCacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      entries: this.renders.size,
      bytes: this.currentBytes,
      evictions: this.evictions,
    };
  }

  /** A changed photo, mask, geometry or graphics context invalidates every cached render. */
  useSource(token: string): void {
    if (token.length === 0 || token.length > 256) throw new RangeError("Invalid source revision");
    if (this.sourceToken === token) return;
    this.clear();
    this.sourceToken = token;
  }

  get(key: string): Preview | null {
    this.assertKey(key);
    if (!this.sourceToken) throw new Error("Source revision was not selected");
    const entry = this.renders.get(key);
    if (!entry) {
      this.misses += 1;
      return null;
    }
    this.hits += 1;
    this.renders.delete(key);
    this.renders.set(key, entry);
    return entry.preview;
  }

  put(key: string, preview: Preview): boolean {
    this.assertKey(key);
    if (!this.sourceToken) throw new Error("Source revision was not selected");
    const { width, height, channels, data } = preview.image;
    const expected = width * height * channels;
    if (!Number.isSafeInteger(expected) || expected <= 0 || data.length !== expected) {
      throw new RangeError("Invalid cached preview dimensions");
    }
    const bytes = data.byteLength;
    if (bytes > this.limitBytes) return false;
    this.remove(key);
    while (this.currentBytes + bytes > this.limitBytes) {
      const first = this.renders.keys().next().value;
      if (first === undefined) break;
      this.remove(first);
      this.evictions += 1;
    }
    this.renders.set(key, { preview, bytes });
    this.currentBytes += bytes;
    return true;
  }

  clear(): void {
    this.renders.clear();
    this.currentBytes = 0;
    this.sourceToken = null;
  }

  private remove(key: string): void {
    const entry = this.renders.get(key);
    if (!entry) return;
    this.renders.delete(key);
    this.currentBytes -= entry.bytes;
  }

  private assertKey(key: string): void {
    if (key.length === 0 || key.length > 65_536) throw new RangeError("Invalid render key");
  }
}
