/** Drag previews never allocate full-size canvases. Release requests full output.
 * Caller supplies a render callback and owns canvases/resources. A stale callback
 * may finish but cannot publish into the new-photo preview through this API.
 */
import { validateLevel } from "./strength.js";

export type PreviewStage = "drag" | "release";
export const DRAG_MAX_EDGE = 512;
export const FULL_MAX_PIXELS = 12_000_000;

export interface PreviewJob {
  readonly revision: number;
  readonly photoHash: string;
  readonly level: number;
  readonly stage: PreviewStage;
  readonly width: number;
  readonly height: number;
  readonly fullResolution: boolean;
}

export function planResolution(width: number, height: number, stage: PreviewStage):
  Readonly<{ width: number; height: number }> {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 ||
      width * height > FULL_MAX_PIXELS || width > 16_384 || height > 16_384) {
    throw new RangeError("Image exceeds the 12 MP limit");
  }
  if (stage !== "drag" && stage !== "release") throw new RangeError("Unknown preview stage");
  if (stage === "release") return { width, height };
  const scale = Math.min(1, DRAG_MAX_EDGE / Math.max(width, height));
  return { width: Math.max(1, Math.floor(width * scale + 0.5)),
    height: Math.max(1, Math.floor(height * scale + 0.5)) };
}

export class ProgressivePreview {
  private revision = 0;
  private photoHash: string | null = null;

  request(hash: string, width: number, height: number, level: number, stage: PreviewStage): PreviewJob {
    if (!/^[a-f0-9]{64}$/.test(hash)) throw new RangeError("Photo identity must be SHA-256");
    const checked = validateLevel(level);
    const shape = planResolution(width, height, stage);
    const token = ++this.revision;
    this.photoHash = hash;
    return Object.freeze({ revision: token, photoHash: hash, level: checked, stage,
      ...shape, fullResolution: stage === "release" });
  }

  isCurrent(job: PreviewJob): boolean {
    return job.revision === this.revision && job.photoHash === this.photoHash;
  }

  /** A pending render may complete, but onSuccess is never called for stale work. */
  async run<T>(job: PreviewJob, render: (job: PreviewJob) => Promise<T> | T,
    onSuccess: (result: T) => void): Promise<boolean> {
    if (!this.isCurrent(job)) return false;
    const result = await render(job);
    if (!this.isCurrent(job)) return false;
    onSuccess(result);
    return true;
  }

  cancel(): void {
    this.revision++;
    this.photoHash = null;
  }
}
