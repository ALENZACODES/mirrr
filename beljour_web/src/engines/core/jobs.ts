/**
 * Running local engines off the main thread (plan-r3-final §6: browser engines in Web Workers).
 *
 * The protocol is plain data, so it works with a real Worker, a MessagePort or a test double:
 *   job    {kind: "run", id, engine, image: Packed, masks: {name: Packed}, params, seed}
 *   result {kind: "result", id, ok: true, image: Packed, editMask: Packed, metrics, pipelineVersion, ms}
 *        | {kind: "result", id, ok: false, error}
 * Packed buffers carry width, height, channels, a type tag and an ArrayBuffer that is moved
 * (transferred), not copied. Every job goes through `runEngine`, so the contract checks
 * (CONTRACTS.md §13) apply inside the worker too.
 *
 * Author: John Khan.
 */
import { type ByteImage, type Mask, checkSize } from "./buffer.js";
import { type LocalEngine, type Params, type Seed, runEngine } from "./engine.js";

export type PackedType = "u8" | "f32";

export interface Packed {
  width: number;
  height: number;
  channels: number;
  type: PackedType;
  buffer: ArrayBuffer;
}

export interface RunJob {
  kind: "run";
  id: number;
  engine: string;
  image: Packed;
  masks: Record<string, Packed>;
  /** Recorded landmark positions, passed unchanged to a local face-aware engine. */
  landmarks?: unknown;
  params: Params;
  seed: string;
}

export type JobResult =
  | { kind: "result"; id: number; ok: true; image: Packed; editMask: Packed; metrics: Record<string, number>; pipelineVersion: string; ms: number }
  | { kind: "result"; id: number; ok: false; error: string };

export interface Port {
  postMessage(message: unknown, transfer?: Transferable[]): void;
}

export const MAX_JOB_PIXELS = 4096 * 4096;

function ownBuffer(data: Uint8Array | Uint8ClampedArray | Float32Array | Float64Array, copy: boolean): ArrayBuffer {
  const whole = data.byteOffset === 0 && data.byteLength === data.buffer.byteLength && data.buffer instanceof ArrayBuffer;
  if (whole && !copy) return data.buffer as ArrayBuffer;
  return data.slice().buffer as ArrayBuffer;
}

/** Pack bytes for posting. With `copy` false the caller's buffer is moved and becomes unusable. */
export function packBytes(img: ByteImage, copy = true): Packed {
  return { width: img.width, height: img.height, channels: img.channels, type: "u8", buffer: ownBuffer(img.data, copy) };
}

export function packMask(mask: Mask, copy = true): Packed {
  const data = mask.data instanceof Float32Array ? mask.data : Float32Array.from(mask.data);
  return { width: mask.width, height: mask.height, channels: 1, type: "f32", buffer: ownBuffer(data, copy && data === mask.data) };
}

function checkPacked(p: Packed, type: PackedType): void {
  if (!p || typeof p !== "object" || p.type !== type || !(p.buffer instanceof ArrayBuffer)) throw new RangeError(`expected a packed ${type} buffer`);
  checkSize(p.width, p.height, p.channels);
  if (p.width * p.height > MAX_JOB_PIXELS) throw new RangeError("image too large for one job");
  const bytes = p.width * p.height * p.channels * (type === "u8" ? 1 : 4);
  if (p.buffer.byteLength !== bytes) throw new RangeError("packed buffer does not match its size");
}

export function unpackBytes(p: Packed): ByteImage {
  checkPacked(p, "u8");
  return { width: p.width, height: p.height, channels: p.channels, data: new Uint8Array(p.buffer) };
}

export function unpackMask(p: Packed): Mask {
  checkPacked(p, "f32");
  if (p.channels !== 1) throw new RangeError("a mask has one channel");
  return { width: p.width, height: p.height, channels: 1, data: new Float32Array(p.buffer) };
}

export function transferList(...packed: Packed[]): ArrayBuffer[] {
  return [...new Set(packed.map((p) => p.buffer))];
}

/** Engines a worker can run, by name. */
export class EngineRegistry {
  private readonly engines = new Map<string, () => LocalEngine>();

  register(name: string, make: () => LocalEngine): this {
    if (!/^[a-z][a-z0-9-]{0,47}$/.test(name)) throw new RangeError("engine names are lowercase identifiers");
    if (this.engines.has(name)) throw new RangeError(`engine ${name} is already registered`);
    this.engines.set(name, make);
    return this;
  }

  names(): string[] {
    return [...this.engines.keys()].sort();
  }

  create(name: string): LocalEngine {
    const make = this.engines.get(name);
    if (!make) throw new RangeError(`no engine called ${name}`);
    return make();
  }
}

function parseSeed(seed: string): Seed {
  if (!/^\d{1,20}$/.test(seed)) throw new RangeError("seed must be a decimal unsigned integer");
  return BigInt(seed);
}

/** Run one job (inside the worker). Never throws: failures come back as ok: false. */
export function runJob(registry: EngineRegistry, job: RunJob, now: () => number = () => Date.now()): { result: JobResult; transfer: ArrayBuffer[] } {
  const start = now();
  try {
    if (job.kind !== "run" || !Number.isSafeInteger(job.id)) throw new RangeError("not a run job");
    const image = unpackBytes(job.image);
    const masks: Record<string, Mask> = {};
    for (const [name, packed] of Object.entries(job.masks ?? {})) masks[name] = unpackMask(packed);
    const out = runEngine(registry.create(job.engine), image, job.landmarks ?? null, masks, job.params ?? {}, parseSeed(job.seed));
    const packedImage = packBytes(out.image, false), packedMask = packMask(out.editMask, false);
    return {
      result: { kind: "result", id: job.id, ok: true, image: packedImage, editMask: packedMask, metrics: out.metrics,
        pipelineVersion: out.pipelineVersion, ms: now() - start },
      transfer: transferList(packedImage, packedMask),
    };
  } catch (err) {
    return { result: { kind: "result", id: job?.id ?? -1, ok: false, error: err instanceof Error ? err.message : String(err) }, transfer: [] };
  }
}

/** Wire a message handler for a worker scope (`self` in a Worker, or a test port). */
export function serve(registry: EngineRegistry, port: Port): (event: { data: unknown }) => void {
  return (event) => {
    const { result, transfer } = runJob(registry, event.data as RunJob);
    port.postMessage(result, transfer);
  };
}

export interface RunRequest {
  engine: string;
  image: ByteImage;
  masks?: Record<string, Mask>;
  /** Pixel-space landmark array from the approved R4 fixture/runtime; not sent to a server. */
  landmarks?: unknown;
  params?: Params;
  seed?: Seed;
  /** Move the image buffer into the worker instead of copying it (the caller's copy goes empty). */
  transfer?: boolean;
}

export interface EngineOutput {
  image: ByteImage;
  editMask: Mask;
  metrics: Record<string, number>;
  pipelineVersion: string;
  ms: number;
}

/** Main-thread side: posts jobs, matches results by id, rejects on error or timeout. */
export class EngineClient {
  private next = 1;
  private readonly pending = new Map<number, { resolve: (o: EngineOutput) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();

  constructor(private readonly port: Port, private readonly timeoutMs = 30_000) {}

  /** Feed every message from the worker here (worker.onmessage = (e) => client.receive(e.data)). */
  receive(message: unknown): void {
    const m = message as JobResult;
    if (!m || m.kind !== "result") return;
    const waiting = this.pending.get(m.id);
    if (!waiting) return;
    this.pending.delete(m.id);
    clearTimeout(waiting.timer);
    if (!m.ok) { waiting.reject(new Error(m.error)); return; }
    try {
      waiting.resolve({ image: unpackBytes(m.image), editMask: unpackMask(m.editMask), metrics: m.metrics, pipelineVersion: m.pipelineVersion, ms: m.ms });
    } catch (err) {
      waiting.reject(err instanceof Error ? err : new Error(String(err)));
    }
  }

  run(request: RunRequest): Promise<EngineOutput> {
    const id = this.next++;
    const seed = request.seed ?? 0;
    const image = packBytes(request.image, !request.transfer);
    const masks: Record<string, Packed> = {};
    for (const [name, mask] of Object.entries(request.masks ?? {})) masks[name] = packMask(mask);
    const job: RunJob = { kind: "run", id, engine: request.engine, image, masks, landmarks: request.landmarks ?? null, params: request.params ?? {}, seed: BigInt(seed).toString() };
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`engine ${request.engine} did not answer within ${this.timeoutMs} ms`));
      }, this.timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      try {
        this.port.postMessage(job, transferList(image, ...Object.values(masks)));
      } catch (err) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  /** Jobs still waiting for an answer. */
  get inFlight(): number {
    return this.pending.size;
  }

  /** Reject everything still waiting (for example when the worker is terminated). */
  close(reason = "engine worker closed"): void {
    for (const [id, waiting] of this.pending) {
      clearTimeout(waiting.timer);
      waiting.reject(new Error(reason));
      this.pending.delete(id);
    }
  }
}
