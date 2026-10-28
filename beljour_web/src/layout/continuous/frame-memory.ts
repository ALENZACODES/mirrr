/** Bounded, ephemeral thumbnail pixels for the active synthetic subject. Author: John Khan. */
import {
  FRAME_IDS,
  FRAME_MAX_BYTES,
  FRAME_TTL_MS,
  isFrameId,
  validFrame,
  type DrawnFrame,
  type FrameId,
} from "./frame-cache-contract.js";

interface StoredFrame {
  readonly frame: DrawnFrame;
  readonly expiresAt: number;
  access: number;
}

export class LocalFrameMemory {
  private readonly entries = new Map<FrameId, StoredFrame>();
  private readonly clock: () => number;
  private readonly byteLimit: number;
  private readonly ttl: number;
  private authority = "";
  private used = 0;
  private tick = 0;
  private hitCount = 0;
  private missCount = 0;
  private disposed = false;

  constructor(clock: () => number = () => performance.now(),
    byteLimit = FRAME_MAX_BYTES, ttl = FRAME_TTL_MS) {
    if (!Number.isSafeInteger(byteLimit) || byteLimit < 128_000 || byteLimit > FRAME_MAX_BYTES) {
      throw new RangeError("Invalid local preview memory budget");
    }
    if (!Number.isSafeInteger(ttl) || ttl < 1_000 || ttl > FRAME_TTL_MS) {
      throw new RangeError("Invalid local preview lifetime");
    }
    this.clock = clock;
    this.byteLimit = byteLimit;
    this.ttl = ttl;
  }

  get size(): number {
    this.prune();
    return this.entries.size;
  }

  get bytes(): number {
    this.prune();
    return this.used;
  }

  get hits(): number {
    return this.hitCount;
  }

  get misses(): number {
    return this.missCount;
  }

  private checkNow(): number {
    const now = this.clock();
    if (!Number.isFinite(now) || now < 0) throw new RangeError("Invalid local clock");
    return now;
  }

  private evict(id: FrameId): void {
    const old = this.entries.get(id);
    if (!old) return;
    old.frame.rgba.fill(0);
    this.used -= old.frame.rgba.byteLength;
    this.entries.delete(id);
  }

  private prune(): void {
    if (this.disposed) return;
    const now = this.checkNow();
    for (const [id, entry] of this.entries) {
      if (now >= entry.expiresAt) this.evict(id);
    }
  }

  useAuthority(signature: string): void {
    if (this.disposed) return;
    if (!signature || signature.length > 1024) throw new RangeError("Unsafe session authority");
    if (signature !== this.authority) {
      this.clear();
      this.authority = signature;
    }
  }

  write(signature: string, frame: DrawnFrame): boolean {
    if (this.disposed || !this.authority || signature !== this.authority
      || !validFrame(frame) || !FRAME_IDS.includes(frame.id)) return false;
    this.prune();
    const cost = frame.rgba.byteLength;
    if (cost > this.byteLimit) return false;
    this.evict(frame.id);
    while (this.used + cost > this.byteLimit) {
      const oldest = [...this.entries.entries()].sort((left, right) =>
        left[1].access - right[1].access)[0];
      if (!oldest) return false;
      this.evict(oldest[0]);
    }
    const copy: DrawnFrame = { ...frame, rgba: new Uint8ClampedArray(frame.rgba) };
    this.entries.set(frame.id, {
      frame: copy, expiresAt: this.checkNow() + this.ttl, access: ++this.tick,
    });
    this.used += cost;
    return true;
  }

  read(signature: string, id: FrameId): DrawnFrame | null {
    if (this.disposed || !isFrameId(id) || signature !== this.authority) {
      this.missCount += 1;
      return null;
    }
    this.prune();
    const record = this.entries.get(id);
    if (!record) {
      this.missCount += 1;
      return null;
    }
    this.hitCount += 1;
    record.access = ++this.tick;
    return { ...record.frame, rgba: new Uint8ClampedArray(record.frame.rgba) };
  }

  clear(): void {
    if (this.disposed) return;
    for (const id of [...this.entries.keys()]) this.evict(id);
    this.authority = "";
  }

  dispose(): void {
    if (this.disposed) return;
    this.clear();
    this.disposed = true;
  }
}
