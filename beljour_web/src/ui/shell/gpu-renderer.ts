/** Capability-gated shell lighting renderer. W98 uses its exact Bradford transform
 * on WebGL2; engines without a matching shader retain their tested CPU path.
 * Context loss, allocation and compile failures fall back using the same source and
 * settings. No provider or network fallback exists. Author: John Khan.
 */
import type { ByteImage } from "../../engines/core/buffer.js";
import { requireColour } from "../../engines/core/buffer.js";
import { Device, type CanvasLike } from "../../engines/gpu/device.js";
import { probe, type Capabilities } from "../../engines/gpu/capabilities.js";
import { Pipeline, WebGL2Backend, type Step } from "../../engines/gpu/pipeline.js";
import { fromBytes, toBytes } from "../../engines/gpu/shaders/ops.js";
import { appearanceMatrix, preset, relightImage, LABEL } from "../../engines/shade/lighting.js";
import { matmul, RGB_TO_XYZ, XYZ_TO_RGB } from "../../engines/shade/colourspace.js";
import type { LayerResult } from "./types.js";

export interface LightingRenderer {
  render(image: ByteImage, presetId: string): LayerResult;
  readonly generation: number;
  dispose(): void;
}

/** Exact W98 RGB transform; no duplicate illuminant tables or approximate preset. */
export function lightingStep(presetId: string): Step {
  const matrix = matmul(matmul(XYZ_TO_RGB, appearanceMatrix(preset(presetId))), RGB_TO_XYZ);
  const params: Record<string, number> = {};
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) params[`m${row}${col}`] = matrix[row][col];
  return { op: "matrix", params };
}

function rgba(image: ByteImage): Uint8Array {
  const data = new Uint8Array(image.width * image.height * 4);
  for (let i = 0; i < image.width * image.height; i++) {
    for (let c = 0; c < 3; c++) data[4 * i + c] = image.data[image.channels * i + c];
    data[4 * i + 3] = image.channels === 4 ? image.data[4 * i + 3] : 255;
  }
  return data;
}

function fromRgba(bytes: Uint8ClampedArray, image: ByteImage): ByteImage {
  if (image.channels === 4) return { ...image, data: Uint8Array.from(bytes) };
  const data = new Uint8Array(image.width * image.height * 3);
  for (let i = 0; i < image.width * image.height; i++) data.set(bytes.subarray(i * 4, i * 4 + 3), i * 3);
  return { ...image, data };
}

export class ShellGpuRenderer implements LightingRenderer {
  private readonly device: Device | null;
  private pipeline: Pipeline | null = null;
  private pipelineGeneration = -1;
  private disposed = false;
  private readonly unsubscribe: (() => void) | null;
  private revision = 0;
  private failedGeneration: number | null = null;
  constructor(canvas: CanvasLike | null) {
    this.device = canvas ? new Device(canvas) : null;
    this.unsubscribe = this.device?.subscribe(() => { this.pipeline?.dispose(); this.pipeline = null; }) ?? null;
  }
  get generation(): number { return this.device ? this.device.generation * 10 + (this.device.state === "ready" ? 1 : 0) : 0; }
  capabilities(image?: { width: number; height: number }): Capabilities { return probe(this.device?.gl ?? null, image); }
  private cpu(image: ByteImage, presetId: string, reason: string): LayerResult {
    return { image: { ...image, data: Uint8Array.from(relightImage(image, presetId)) }, label: LABEL,
      metrics: { lighting: presetId, backend: "cpu", render_reason: reason } };
  }
  render(image: ByteImage, presetId: string): LayerResult {
    if (this.disposed) throw new Error("The shell renderer has been closed.");
    requireColour(image);
    preset(presetId);
    // Daylight is the identity and avoids an unnecessary GPU upload/readback.
    if (presetId === "daylight") return { image: { ...image, data: Uint8Array.from(image.data) }, label: LABEL,
      metrics: { lighting: presetId, backend: "identity", render_reason: "Daylight keeps the source colour values." } };
    const caps = this.capabilities(image);
    if (caps.path === "cpu" || this.failedGeneration === this.device?.generation) {
      return this.cpu(image, presetId, caps.reasons.join(" ") || "The graphics path is unavailable for this session.");
    }
    const device = this.device!;
    try {
      if (!this.pipeline || this.pipelineGeneration !== device.generation) {
        this.pipeline?.dispose();
        this.pipeline = new Pipeline(new WebGL2Backend(device.gl!, caps.targetFormat, device.pool));
        this.pipelineGeneration = device.generation;
      }
      const input = fromBytes(image.width, image.height, rgba(image));
      const steps = [lightingStep(presetId)], options = { revision: ++this.revision };
      const result = caps.path === "gpu-tiled" ? this.pipeline.renderTiled(input, steps, caps.tile, options)
        : this.pipeline.render(input, steps, options);
      if (!device.gl) throw new Error("The graphics context was lost.");
      return { image: fromRgba(toBytes(result.image), image), label: LABEL,
        metrics: { lighting: presetId, backend: "webgl2", passes: result.passes, tiled: caps.path === "gpu-tiled", target: caps.targetFormat } };
    } catch {
      this.failedGeneration = device.generation;
      this.pipeline?.dispose(); this.pipeline = null;
      // A GPU error never replaces or clears the original photo.
      return this.cpu(image, presetId, "The graphics render could not finish. This preview was rendered on the device CPU.");
    }
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribe?.(); this.pipeline?.dispose(); this.pipeline = null; this.device?.dispose();
  }
}

/** Called once by the editor, not at module import; also works in a worker. */
export function browserShellRenderer(): ShellGpuRenderer {
  let canvas: CanvasLike | null = null;
  try {
    if (typeof OffscreenCanvas !== "undefined") canvas = new OffscreenCanvas(1, 1) as unknown as CanvasLike;
    else if (typeof document !== "undefined") canvas = document.createElement("canvas") as unknown as CanvasLike;
  } catch { canvas = null; }
  return new ShellGpuRenderer(canvas);
}
