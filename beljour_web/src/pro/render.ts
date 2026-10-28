/** Browser-local canvas rendering and download-blob export.
 * No network, trackers, remote models or browser storage are used.
 * Pixel edits use one readback per render, not one readback per slider move.
 */
import { makeCropGeometry, previewGeometry, type CropGeometry } from "./crop.js";
import { applyCurvePixels, makeCurveLuts, type CurveLuts } from "./curves.js";
import { blendMaskedPixels, cropMaskMapping, rasterMask, type LocalMask } from "./masks.js";
import { planProExport, simulationText, type PlannedExport } from "./presets.js";
import { projectSource } from "./source-projection.js";
import { scrubEncodedBlob } from "./export-privacy.js";
import { GpuProSurface } from "./gpu.js";
import { checkRecipe, ProInputError, requireDimensions,
  type ExportResult, type PixelSource, type ProRecipe } from "./types.js";

export const PREVIEW_BUDGET_MS = 100;
export const EXPORT_BUDGET_MS = 2_000;

export interface RenderSurface {
  readonly canvas: OffscreenCanvas | HTMLCanvasElement | null;
  draw(source: PixelSource, geometry: CropGeometry, curves: CurveLuts,
    label: string | null, matte: boolean, masks?: readonly LocalMask[]): void;
  encode(mime: "image/jpeg" | "image/png", quality: number): Promise<Blob>;
}

export type SurfaceFactory = (width: number, height: number) => RenderSurface;

export interface PreviewResult {
  readonly surface: RenderSurface;
  readonly width: number;
  readonly height: number;
  readonly elapsedMs: number;
  readonly overBudget: boolean;
}

export function drawLabel(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  label: string, width: number, height: number): void {
  const fontSize = Math.max(12, Math.round(width / 40));
  const margin = Math.max(6, Math.round(fontSize * 0.6));
  ctx.save();
  ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  const textWidth = ctx.measureText(label).width;
  const x = margin;
  const y = height - fontSize * 2 - margin;
  ctx.fillStyle = "rgba(0, 0, 145, 0.88)";
  ctx.fillRect(x, y, textWidth + 2 * margin, fontSize * 2);
  ctx.fillStyle = "#fff";
  ctx.fillText(label, x + margin, y + fontSize);
  ctx.restore();
}

export class CanvasProSurface implements RenderSurface {
  readonly canvas: OffscreenCanvas | HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

  constructor(width: number, height: number) {
    requireDimensions(width, height);
    const canvas = typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(width, height)
      : document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new ProInputError("This device has no usable 2D image canvas", "PRO_CANVAS_MISSING");
    this.canvas = canvas;
    this.context = context as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  }

  draw(source: PixelSource, geometry: CropGeometry, curves: CurveLuts,
    label: string | null, matte: boolean, masks: readonly LocalMask[] = []): void {
    const ctx = this.context;
    const { width, height } = geometry;
    projectSource(ctx, source, geometry, matte);
    if (!curves.neutral) {
      const pixels = ctx.getImageData(0, 0, width, height);
      if (masks.length === 0) {
        applyCurvePixels(pixels.data, curves);
      } else {
        const transform = cropMaskMapping(geometry, source.width, source.height);
        const coverage = rasterMask(masks, width, height, transform);
        blendMaskedPixels(pixels.data, curves.red, curves.green, curves.blue, coverage);
      }
      ctx.putImageData(pixels, 0, 0);
    }
    if (label) drawLabel(ctx, label, width, height);
  }

  async encode(mime: "image/jpeg" | "image/png", quality: number): Promise<Blob> {
    let blob: Blob;
    if (typeof OffscreenCanvas !== "undefined" && this.canvas instanceof OffscreenCanvas) {
      blob = await this.canvas.convertToBlob({ type: mime, quality });
    } else {
      blob = await new Promise<Blob>((resolve, reject) => {
        this.canvasToBlob(resolve, reject, mime, quality);
      });
    }
    if (blob.size === 0 || blob.type !== mime) {
      throw new ProInputError("This browser cannot encode the selected image format", "PRO_CODEC_MISSING");
    }
    return blob;
  }

  private canvasToBlob(resolve: (blob: Blob) => void, reject: (error: Error) => void,
    mime: "image/jpeg" | "image/png", quality: number): void {
    const canvas = this.canvas;
    if (!(canvas instanceof HTMLCanvasElement)) {
      reject(new ProInputError("Canvas export is unavailable"));
      return;
    }
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new ProInputError("Image encoding failed", "PRO_ENCODE_FAILED"));
    }, mime, quality);
  }
}

export const browserSurface: SurfaceFactory = (width, height) => new GpuProSurface(width, height);

function validateSource(source: PixelSource, recipe: ProRecipe): void {
  requireDimensions(source.width, source.height);
  checkRecipe(recipe);
  if (!source.image) throw new ProInputError("A decoded local image is required");
}

export function previewPhoto(source: PixelSource, recipe: ProRecipe,
  factory: SurfaceFactory = browserSurface, clock: () => number = () => performance.now()): PreviewResult {
  validateSource(source, recipe);
  const start = clock();
  const geometry = previewGeometry(makeCropGeometry(source.width, source.height, recipe.crop));
  const surface = factory(geometry.width, geometry.height);
  surface.draw(source, geometry, makeCurveLuts(recipe.curves), simulationText(recipe), false, recipe.masks);
  const elapsedMs = clock() - start;
  return {
    surface,
    width: geometry.width,
    height: geometry.height,
    elapsedMs,
    overBudget: elapsedMs >= PREVIEW_BUDGET_MS,
  };
}

export async function exportPhotoPro(source: PixelSource, recipe: ProRecipe, fileStem: string,
  factory: SurfaceFactory = browserSurface,
  clock: () => number = () => performance.now()): Promise<ExportResult> {
  validateSource(source, recipe);
  const start = clock();
  const planned: PlannedExport = planProExport(source.width, source.height, recipe, fileStem);
  const { preset, geometry } = planned;
  const surface = factory(geometry.width, geometry.height);
  surface.draw(source, geometry, makeCurveLuts(recipe.curves), planned.label,
    preset.mime === "image/jpeg", recipe.masks);
  const blob = await scrubEncodedBlob(await surface.encode(preset.mime, preset.quality), preset.mime);
  const elapsedMs = clock() - start;
  return {
    name: planned.filename,
    blob,
    mime: preset.mime,
    width: geometry.width,
    height: geometry.height,
    label: planned.label,
    elapsedMs,
    overBudget: elapsedMs >= EXPORT_BUDGET_MS,
  };
}
