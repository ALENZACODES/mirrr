/** Bounded canvas LRU for disposable, illustrative previews only.
 * Keeps neither uploaded source nor decoded image outside Judge Mode.
 */
import { previewKey, type PreviewRequest } from "../../layout/strength-scale.js";

export interface PreviewCacheStats {
  readonly hits: number;
  readonly misses: number;
  readonly entries: number;
  readonly bytes: number;
}

interface CacheEntry {
  readonly canvas: HTMLCanvasElement;
  readonly bytes: number;
}

export class JudgePreviewCache {
  private readonly entries = new Map<string, CacheEntry>();
  private hits = 0;
  private misses = 0;
  private bytes = 0;

  constructor(private readonly byteLimit = 16 * 1024 * 1024) {
    if (!Number.isSafeInteger(byteLimit) || byteLimit < 64_000 || byteLimit > 128 * 1024 * 1024) {
      throw new RangeError("Invalid cache byte limit");
    }
  }

  get stats(): PreviewCacheStats {
    return { hits: this.hits, misses: this.misses, entries: this.entries.size, bytes: this.bytes };
  }

  render(
    doc: Document,
    request: PreviewRequest,
    destination: HTMLCanvasElement,
    draw: (canvas: HTMLCanvasElement) => void,
  ): boolean {
    const key = previewKey(request);
    const cached = this.entries.get(key);
    if (cached) {
      this.hits += 1;
      this.entries.delete(key);
      this.entries.set(key, cached);
      this.copy(cached.canvas, destination);
      return true;
    }
    this.misses += 1;
    const source = doc.createElement("canvas");
    try {
      draw(source);
      const bytes = source.width * source.height * 4;
      if (!Number.isSafeInteger(bytes) || bytes > this.byteLimit || bytes <= 0) {
        this.copy(source, destination);
        return false;
      }
      while (this.bytes + bytes > this.byteLimit) {
        const oldest = this.entries.keys().next().value;
        if (!oldest) break;
        this.remove(oldest);
      }
      this.entries.set(key, { canvas: source, bytes });
      this.bytes += bytes;
      this.copy(source, destination);
      return false;
    } catch (error) {
      source.width = 0;
      source.height = 0;
      throw error;
    }
  }

  clear(): void {
    for (const key of [...this.entries.keys()]) this.remove(key);
  }

  private remove(key: string): void {
    const entry = this.entries.get(key);
    if (!entry) return;
    this.entries.delete(key);
    this.bytes -= entry.bytes;
    entry.canvas.width = 0;
    entry.canvas.height = 0;
  }

  private copy(source: HTMLCanvasElement, destination: HTMLCanvasElement): void {
    destination.width = source.width;
    destination.height = source.height;
    const context = destination.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable on this device");
    context.drawImage(source, 0, 0);
  }
}
