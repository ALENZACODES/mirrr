/** Cancellation, concurrency and explicit unavailability for future Lane A adapter. */
import type { SubjectDetectionPort, SubjectSnapshot } from "./contract.js";
import { SubjectSelection } from "./selection.js";

export type SubjectDiscoveryNotice = "detected" | "unavailable" | "stale" | "refused";

export interface SubjectDiscoveryResult {
  readonly notice: SubjectDiscoveryNotice;
  readonly count: number;
  readonly revision: number;
}

/** A null adapter is a closed boundary, never a stub that invents detections. */
export class SubjectDiscovery {
  readonly selection = new SubjectSelection();
  private revision = 0;
  private controller: AbortController | null = null;
  private disposed = false;

  constructor(private readonly adapter: SubjectDetectionPort | null = null) {}

  get snapshot(): SubjectSnapshot {
    return this.selection.snapshot;
  }

  reset(): number {
    if (this.disposed) throw new Error("Subject discovery is disposed");
    this.controller?.abort();
    this.controller = null;
    this.revision += 1;
    this.selection.begin(this.revision);
    return this.revision;
  }

  async find(pixels: HTMLCanvasElement): Promise<SubjectDiscoveryResult> {
    const revision = this.reset();
    if (!this.adapter) return { notice: "unavailable", count: 0, revision };
    if (pixels.width < 16 || pixels.height < 16) {
      return { notice: "refused", count: 0, revision };
    }
    const controller = new AbortController();
    this.controller = controller;
    try {
      const response = await this.adapter.detect({ pixels, revision, signal: controller.signal });
      if (this.disposed || controller.signal.aborted || revision !== this.revision) {
        return { notice: "stale", count: 0, revision };
      }
      if (response.revision !== revision) return { notice: "stale", count: 0, revision };
      this.selection.receive(revision, response.boxes);
      return { notice: "detected", count: response.boxes.length, revision };
    } catch {
      return { notice: "refused", count: 0, revision };
    } finally {
      if (this.controller === controller) this.controller = null;
    }
  }

  seedDrawn(boxes: SubjectSnapshot["boxes"]): void {
    const revision = this.reset();
    this.selection.receive(revision, boxes);
  }

  dispose(): void {
    if (this.disposed) return;
    this.controller?.abort();
    this.controller = null;
    this.selection.clear();
    this.disposed = true;
  }
}
