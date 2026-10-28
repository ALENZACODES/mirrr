/** E07 part 2: the gate between a learned fill model and the network.
 *
 * A session is created only when (1) the E03 registry approves the model (commercial
 * licence cleared, exact sha256 and size pinned), (2) its bytes arrive through the
 * registry's verified download, and (3) an ONNX runtime has been injected. Nothing here
 * imports onnxruntime-web or names a download URL: the runtime is passed in by the
 * caller once John clears it, so a pending model can never reach fetch().
 * Author: John Khan.
 */
import { type BrowserModelRegistry, DEFAULT_MODELS, type FetchLike, ModelDownloads } from "../../../vision/model-registry.js";

export type TensorType = "uint8" | "float32";
export interface TensorLike { readonly type: string; readonly data: Uint8Array | Float32Array; readonly dims: readonly number[] }
export interface SessionLike {
  readonly inputNames: readonly string[];
  readonly outputNames: readonly string[];
  run(feeds: Record<string, TensorLike>): Promise<Record<string, TensorLike>>;
  release?(): Promise<void>;
}
/** The two calls the wrapper needs from an ONNX runtime (onnxruntime-web fits this shape). */
export interface OrtLike {
  createSession(model: Uint8Array): Promise<SessionLike>;
  tensor(type: TensorType, data: Uint8Array | Float32Array, dims: readonly number[]): TensorLike;
}
export interface LoaderStatus { ready: boolean; reason: string }

export class LearnedModelUnavailable extends Error {
  constructor(message: string) { super(message); this.name = "LearnedModelUnavailable"; }
}

/** A plain tensor for runtimes and tests that accept {type, data, dims}. */
export function plainTensor(type: TensorType, data: Uint8Array | Float32Array, dims: readonly number[]): TensorLike {
  const count = dims.reduce((a, b) => a * b, 1);
  if (!dims.every((d) => Number.isInteger(d) && d > 0) || count !== data.length) throw new RangeError("tensor dims do not match its data");
  if ((type === "uint8") !== (data instanceof Uint8Array)) throw new RangeError("tensor type does not match its data");
  return { type, data, dims: [...dims] };
}

export interface LoaderOptions { modelId: string; registry?: BrowserModelRegistry; ort?: OrtLike | null; fetcher?: FetchLike }

export class SessionLoader {
  readonly modelId: string;
  private readonly registry: BrowserModelRegistry;
  private readonly downloads: ModelDownloads;
  private ort: OrtLike | null;
  private session: Promise<SessionLike> | null = null;

  constructor({ modelId, registry = DEFAULT_MODELS, ort = null, fetcher }: LoaderOptions) {
    this.modelId = modelId;
    this.registry = registry;
    this.ort = ort;
    this.downloads = new ModelDownloads(registry, fetcher);
    registry.get(modelId);                       // unknown ids fail at construction
  }

  /** Whether a fill could run now, and in plain words why not. Never touches the network. */
  status(): LoaderStatus {
    const model = this.registry.get(this.modelId);
    if (!this.registry.ready(this.modelId)) {
      return { ready: false, reason: `model ${this.modelId} is ${model.status}: licence or pin not cleared` };
    }
    if (!this.ort) return { ready: false, reason: "no ONNX runtime has been loaded" };
    return { ready: true, reason: "ready" };
  }

  attachRuntime(ort: OrtLike | null): void { this.ort = ort; this.session = null; }

  /** Approve, download (verified), then create the session; cached after the first success. */
  load(signal?: AbortSignal): Promise<SessionLike> {
    const state = this.status();
    if (!state.ready) return Promise.reject(new LearnedModelUnavailable(state.reason));
    if (!this.session) {
      const ort = this.ort as OrtLike;
      this.session = this.downloads.load(this.modelId, signal).then((bytes) => ort.createSession(bytes)).catch((error: unknown) => {
        this.session = null;
        throw error;
      });
    }
    return this.session;
  }

  async reset(): Promise<void> {
    const pending = this.session;
    this.session = null;
    this.downloads.clear();
    if (pending) { try { await (await pending).release?.(); } catch { /* a failed load has nothing to release */ } }
  }
}
