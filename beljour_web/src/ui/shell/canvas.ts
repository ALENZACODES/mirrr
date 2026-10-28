/** Canvas preview, scaling and photo-labelled export. No network, state or asset imports.
 * Recreates ImageData with a new Uint8ClampedArray for compatibility with TypeScript 7.
 * Author: John Khan.
 */
import { type ByteImage, toRGBA } from "../../engines/core/buffer.js";

export interface DrawOptions { zoom?: number; label?: string; simulate?: boolean; overlay?: boolean }

export function paint(canvas: HTMLCanvasElement, image: ByteImage, options: DrawOptions = {}): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas is not supported");
  canvas.width = image.width; canvas.height = image.height;
  ctx.putImageData(new ImageData(new Uint8ClampedArray(toRGBA(image)), image.width, image.height), 0, 0);
  if (options.overlay !== false && options.simulate) label(ctx, image.width, image.height, options.label ?? "Photo simulation");
  const zoom = options.zoom ?? 1;
  if (!(zoom >= 0.25 && zoom <= 8)) throw new RangeError("Zoom must be 25–800%");
  canvas.style.width = `${Math.round(image.width * zoom)}px`;
  canvas.style.height = `${Math.round(image.height * zoom)}px`;
}

export function label(ctx: CanvasRenderingContext2D, width: number, height: number, text: string): void {
  const font = Math.max(11, Math.round(Math.min(width, height) / 23));
  const padding = Math.max(6, Math.round(font / 2));
  const str = text.length > 80 ? text.slice(0, 80) : text;
  ctx.save();
  ctx.font = `600 ${font}px system-ui, sans-serif`;
  const metrics = ctx.measureText(str);
  const h = font + padding * 2;
  ctx.fillStyle = "rgba(0, 38, 84, 0.92)";
  ctx.fillRect(0, height - h, Math.min(width, metrics.width + 2 * padding), h);
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "middle";
  ctx.fillText(str, padding, height - h / 2, Math.max(1, width - padding * 2));
  ctx.restore();
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename = "beljour-preview.png"): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error("Couldn't export this canvas")); return; }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename;
      document.body.append(anchor); anchor.click(); anchor.remove();
      URL.revokeObjectURL(url); resolve();
    }, "image/png");
  });
}
