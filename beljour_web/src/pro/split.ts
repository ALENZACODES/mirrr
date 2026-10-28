/** Side-by-side image comparison without a second full-size pixel allocation. */
import { ProInputError, requireDimensions } from "./types.js";

export type SplitAxis = "vertical" | "horizontal";

export interface SplitView {
  readonly axis: SplitAxis;
  readonly fraction: number;
  readonly width: number;
  readonly height: number;
  readonly divider: number;
  readonly beforeRect: readonly [number, number, number, number];
}

export function planSplitView(width: number, height: number,
  fraction = 0.5, axis: SplitAxis = "vertical"): SplitView {
  requireDimensions(width, height);
  if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1) {
    throw new ProInputError("Split position must be a fraction from zero to one");
  }
  if (axis !== "vertical" && axis !== "horizontal") {
    throw new ProInputError("Split must be vertical or horizontal");
  }
  const divider = (axis === "vertical" ? width : height) * fraction;
  const beforeRect = axis === "vertical"
    ? [0, 0, divider, height] as const
    : [0, 0, width, divider] as const;
  return { axis, fraction, width, height, divider, beforeRect };
}

/** Before is revealed in the leading part; after remains visible elsewhere.
 * The caller owns the canvas, both frame sources and its lifetime.
 */
export function drawSplitView(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  before: CanvasImageSource, after: CanvasImageSource, view: SplitView): void {
  if (!before || !after) throw new ProInputError("Both comparison frames are required");
  ctx.save();
  try {
    ctx.clearRect(0, 0, view.width, view.height);
    ctx.drawImage(after, 0, 0, view.width, view.height);
    ctx.beginPath();
    ctx.rect(...view.beforeRect);
    ctx.clip();
    ctx.drawImage(before, 0, 0, view.width, view.height);
  } finally {
    ctx.restore();
  }
  if (view.fraction > 0 && view.fraction < 1) {
    ctx.save();
    try {
      ctx.beginPath();
      if (view.axis === "vertical") {
        ctx.moveTo(view.divider, 0);
        ctx.lineTo(view.divider, view.height);
      } else {
        ctx.moveTo(0, view.divider);
        ctx.lineTo(view.width, view.divider);
      }
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    } finally {
      ctx.restore();
    }
  }
}
