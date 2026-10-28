/** E05 browser <-> worker bridge. A pending model never starts a worker, fetch,
 * or sends image pixels anywhere. Supports aborts, timeouts and fake workers
 * so the whole suite runs with no browser network requests.
 * Author: John Khan.
 */
import { FaceTracker, normaliseFaces, selectFace, type DetectedFace } from "./geometry.js";
import { DEFAULT_MODELS, type BrowserModelRegistry } from "./model-registry.js";
import { type VisionImage, type VisionOperation, type VisionRequest, type VisionResponse, type VisionOutput } from "./protocol.js";

export interface WorkerPort {
  postMessage(data: VisionRequest, transfer?: Transferable[]): void;
  addEventListener(type: "message" | "error", handler: EventListenerOrEventListenerObject): void;
  removeEventListener(type: "message" | "error", handler: EventListenerOrEventListenerObject): void;
  terminate(): void;
}
export type WorkerFactory = () => WorkerPort;
export interface VisionResult {
  ok: boolean;
  source: "local-model" | "manual";
  output?: VisionOutput;
  faces?: DetectedFace[];
  error?: string;
}
interface Pending {
  resolve: (value: VisionResult) => void;
  timer: ReturnType<typeof setTimeout>;
  abort?: () => void;
}
const OP_TO_MODEL: Record<VisionOperation, string> = {
  "face-detection": "face-detector-short", "face-landmarks": "face-landmarker-478",
  pose: "pose-landmarker-lite", "hair-segmentation": "hair-segmenter", "person-segmentation": "selfie-multiclass",
};

export class VisionWorkerClient {
  private worker: WorkerPort | null = null;
  private readonly pending = new Map<number, Pending>();
  private readonly tracker = new FaceTracker();
  private nextId = 1;
  private chosenFace: string | null = null;
  constructor(private readonly registry: BrowserModelRegistry = DEFAULT_MODELS,
              private readonly factory: WorkerFactory = () => new Worker(
                new URL("./media-worker.js", import.meta.url), { type: "module", name: "beljour-vision" },
              ) as unknown as WorkerPort,
              private readonly timeoutMs = 20_000) {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new RangeError("positive timeout required");
  }
  get activeJobs(): number { return this.pending.size; }
  get selectedFace(): string | null { return this.chosenFace; }
  ready(operation: VisionOperation): boolean { return this.registry.ready(OP_TO_MODEL[operation]); }
  private ensureWorker(): WorkerPort {
    if (!this.worker) {
      this.worker = this.factory();
      this.worker.addEventListener("message", this.message);
      this.worker.addEventListener("error", this.failure);
    }
    return this.worker;
  }
  private readonly message: EventListener = (event) => {
    const result = (event as MessageEvent<VisionResponse>).data;
    const waiting = this.pending.get(result?.id);
    if (!waiting) return;
    this.finish(result.id);
    if (!result.ok) {
      waiting.resolve({ ok: false, source: "manual", error: result.error });
      return;
    }
    const faces = result.output.faces
      ? normaliseFaces(result.output.faces, result.output.width, result.output.height, this.tracker)
      : undefined;
    if (faces && !faces.some((face) => face.id === this.chosenFace)) this.chosenFace = faces[0]?.id ?? null;
    waiting.resolve({ ok: true, source: "local-model", output: result.output, faces });
  };
  private readonly failure: EventListener = () => {
    for (const [id, waiting] of this.pending) {
      this.finish(id);
      waiting.resolve({ ok: false, source: "manual", error: "Vision worker stopped. Use manual selection." });
    }
    this.worker?.terminate(); this.worker = null;
  };
  private finish(id: number): void {
    const item = this.pending.get(id);
    if (!item) return;
    clearTimeout(item.timer);
    item.abort?.();
    this.pending.delete(id);
  }
  /** Render a decoded image into a local canvas and pass pixel bytes to the
   * worker. This never uploads the image. A 4096px guard prevents exhaustion. */
  async detectImage(
    operation: VisionOperation, source: CanvasImageSource, width: number, height: number,
    options: { maxFaces?: number; signal?: AbortSignal } = {},
  ): Promise<VisionResult> {
    if (width < 1 || height < 1 || width > 4096 || height > 4096 ||
        !Number.isInteger(width) || !Number.isInteger(height)) throw new RangeError("invalid image dimensions");
    if (!this.ready(operation)) return { ok: false, source: "manual", error: "Model licence pending. Use manual selection." };
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return { ok: false, source: "manual", error: "2D canvas is unavailable" };
    ctx.drawImage(source, 0, 0, width, height);
    const image = ctx.getImageData(0, 0, width, height);
    return this.detect(operation, { width, height, rgba: image.data.slice().buffer }, options);
  }
  /** Useful for the recorder and for deterministic, canvas-free tests. */
  detect(operation: VisionOperation, image: VisionImage,
         options: { maxFaces?: number; signal?: AbortSignal } = {}): Promise<VisionResult> {
    if (!this.ready(operation)) return Promise.resolve({
      ok: false, source: "manual", error: `Model ${OP_TO_MODEL[operation]} licence pending. Use manual points or masks.`,
    });
    if (options.signal?.aborted) return Promise.resolve({ ok: false, source: "manual", error: "Cancelled" });
    if (image.width < 1 || image.height < 1 || image.width > 4096 || image.height > 4096 ||
        !Number.isInteger(image.width) || !Number.isInteger(image.height) ||
        !(image.rgba instanceof ArrayBuffer) || image.rgba.byteLength !== image.width * image.height * 4) {
      return Promise.resolve({ ok: false, source: "manual", error: "Invalid RGBA image" });
    }
    const maxFaces = options.maxFaces ?? 6;
    if (!Number.isInteger(maxFaces) || maxFaces < 1 || maxFaces > 6) {
      return Promise.resolve({ ok: false, source: "manual", error: "Face limit must be 1..6" });
    }
    const id = this.nextId++;
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.finish(id);
        resolve({ ok: false, source: "manual", error: "Vision worker timed out. Use manual points." });
      }, this.timeoutMs);
      const onAbort = () => {
        this.finish(id);
        resolve({ ok: false, source: "manual", error: "Cancelled" });
      };
      const abort = options.signal ? () => options.signal?.removeEventListener("abort", onAbort) : undefined;
      this.pending.set(id, { resolve, timer, abort });
      options.signal?.addEventListener("abort", onAbort, { once: true });
      try {
        this.ensureWorker().postMessage({ kind: "detect", id, operation, image, maxFaces }, [image.rgba]);
      } catch (error) {
        this.finish(id);
        resolve({ ok: false, source: "manual", error: error instanceof Error ? error.message : "Worker failed" });
      }
    });
  }
  /** Human selection, not a machine identity guess. */
  pick(faces: readonly DetectedFace[], x: number, y: number): DetectedFace | null {
    const face = selectFace(faces, x, y);
    this.chosenFace = face?.id ?? null;
    return face;
  }
  resetFaces(): void { this.chosenFace = null; this.tracker.reset(); }
  close(): void {
    this.failure(new Event("error"));
    if (this.worker) {
      this.worker.removeEventListener("message", this.message);
      this.worker.removeEventListener("error", this.failure);
      this.worker.terminate(); this.worker = null;
    }
    this.resetFaces();
  }
}

let shared: VisionWorkerClient | null = null;
export function defaultVisionClient(): VisionWorkerClient { return shared ??= new VisionWorkerClient(); }
