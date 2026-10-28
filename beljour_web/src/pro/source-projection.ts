/** Shared geometry for CPU and GPU-backed Pro compositing.
 * Working in exactly the same output coordinate space avoids a second crop
 * or rotation convention in the accelerated path.
 */
import type { CropGeometry } from "./crop.js";
import type { PixelSource } from "./types.js";

export type Pro2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export function projectSource(ctx: Pro2D, source: PixelSource,
  geometry: CropGeometry, matte: boolean): void {
  const { width, height, rect } = geometry;
  ctx.save();
  try {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (matte) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.translate(width / 2, height / 2);
    ctx.scale(width / geometry.projectedWidth, height / geometry.projectedHeight);
    ctx.rotate(geometry.radians);
    ctx.translate(-rect.x - rect.width / 2, -rect.y - rect.height / 2);
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.clip();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source.image, 0, 0, source.width, source.height);
  } finally {
    ctx.restore();
  }
}
