/** Strictly local cached image gallery for the current drawn session. Author: John Khan. */
import type { TourState } from "./contract.js";
import {
  FRAME_IDS,
  cacheAuthority,
  type DrawnFrame,
  type FrameId,
  type FramePhase,
  type FrameSafeSummary,
} from "./frame-cache-contract.js";
import { LocalFrameMemory } from "./frame-memory.js";

export interface FrameContext {
  readonly state: TourState;
  readonly drawn: boolean;
}

export interface FrameControllerOptions {
  readonly current: () => FrameContext;
  readonly capture: (id: FrameId, state: TourState) => Promise<DrawnFrame>;
  readonly now?: () => number;
  readonly changed?: () => void;
  readonly memory?: LocalFrameMemory;
}

export class DrawnFrameController {
  private readonly current: () => FrameContext;
  private readonly capture: FrameControllerOptions["capture"];
  private readonly changed: () => void;
  private readonly memory: LocalFrameMemory;
  private phase: FramePhase = "empty";
  private selected: FrameId | null = null;
  private revision = 0;
  private signature: string | null = null;
  private disposed = false;

  constructor(options: FrameControllerOptions) {
    this.current = options.current;
    this.capture = options.capture;
    this.changed = options.changed ?? (() => {});
    this.memory = options.memory ?? new LocalFrameMemory(options.now);
  }

  private freshSignature(): string | null {
    const context = this.current();
    return cacheAuthority(context.state, context.drawn)?.signature ?? null;
  }

  private notify(): void {
    if (!this.disposed) this.changed();
  }

  /** Independently guard every asynchronous state update on paint, render and read. */
  private ensureFresh(): boolean {
    if (this.disposed) return false;
    if (this.signature !== null && this.freshSignature() !== this.signature) {
      this.invalidate("stale");
      return false;
    }
    return true;
  }

  get snapshot(): FrameSafeSummary {
    this.ensureFresh();
    return {
      phase: this.phase,
      available: this.memory.size,
      bytes: this.memory.bytes,
      hits: this.memory.hits,
      misses: this.memory.misses,
      selected: this.selected,
      networkCalls: 0,
      unitsSpent: 0,
      liveVerified: false,
    };
  }

  readSelected(): DrawnFrame | null {
    if (!this.ensureFresh() || !this.signature || !this.selected || this.phase !== "ready") {
      return null;
    }
    const frame = this.memory.read(this.signature, this.selected);
    if (!frame) this.invalidate("stale");
    return frame;
  }

  select(id: FrameId): boolean {
    if (!this.ensureFresh() || !this.signature || this.phase !== "ready"
      || !FRAME_IDS.includes(id)) return false;
    const value = this.memory.read(this.signature, id);
    if (!value) {
      this.invalidate("stale");
      return false;
    }
    value.rgba.fill(0);
    this.selected = id;
    this.notify();
    return true;
  }

  async prepare(): Promise<FrameSafeSummary> {
    if (this.disposed) return this.snapshot;
    this.invalidate("empty");
    const context = this.current();
    const authority = cacheAuthority(context.state, context.drawn);
    if (!authority) {
      this.phase = "refused";
      this.notify();
      return this.snapshot;
    }
    const ticket = this.revision;
    this.signature = authority.signature;
    this.memory.useAuthority(authority.signature);
    this.phase = "warming";
    this.notify();
    try {
      for (const id of FRAME_IDS) {
        const frame = await this.capture(id, context.state);
        if (this.disposed || ticket !== this.revision) {
          frame.rgba.fill(0);
          return this.snapshot;
        }
        if (this.freshSignature() !== authority.signature) {
          frame.rgba.fill(0);
          this.invalidate("stale");
          return this.snapshot;
        }
        const saved = this.memory.write(authority.signature, frame);
        frame.rgba.fill(0);
        if (!saved) throw new Error("Drawn cache exceeded memory limit");
      }
      if (this.disposed || ticket !== this.revision) return this.snapshot;
      this.phase = "ready";
      this.selected = "hair";
      this.notify();
    } catch {
      if (!this.disposed && ticket === this.revision) {
        this.invalidate("refused");
        this.notify();
      }
    }
    return this.snapshot;
  }

  invalidate(next: FramePhase = "empty"): void {
    if (this.disposed) return;
    this.revision += 1;
    this.signature = null;
    this.selected = null;
    this.memory.clear();
    this.phase = next;
  }

  dispose(): void {
    if (this.disposed) return;
    this.invalidate("empty");
    this.memory.dispose();
    this.disposed = true;
    this.phase = "disposed";
  }
}
