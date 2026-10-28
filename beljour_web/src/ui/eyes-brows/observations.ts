/** In-memory manual evidence tools; no face-model substitutions. Author: John Khan. */
import { MAX_TRACES, normalPoint, validateTrace, type NormalPoint, type Trace } from "./input.js";

export interface BrushPoint { x: number; y: number }
export type DrawingTool = "hair" | "erase" | "right-upper" | "right-lower" | "left-upper" | "left-lower";

export function canvasPoint(clientX: number, clientY: number,
  rect: { left: number; top: number; width: number; height: number }): NormalPoint {
  if (![clientX, clientY, rect.left, rect.top, rect.width, rect.height].every(Number.isFinite)
      || rect.width <= 0 || rect.height <= 0) throw new RangeError("The canvas has no measurable area.");
  return [Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
    Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))];
}

/** Coverage compositing makes repeated strokes saturate without exceeding one. */
export function paintDisc(mask: Float64Array, width: number, height: number, point: NormalPoint,
  radius: number, erase = false, hardness = 0.65): void {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 640 || height > 640
      || mask.length !== width * height) throw new RangeError("Hair mask dimensions are invalid.");
  normalPoint(point);
  if (!Number.isFinite(radius) || radius < 1 || radius > 80 || !Number.isFinite(hardness) || hardness < 0 || hardness > 1) {
    throw new RangeError("The brush radius or hardness is outside its supported range.");
  }
  const cx = point[0] * width, cy = point[1] * height;
  const left = Math.max(0, Math.floor(cx - radius)), right = Math.min(width - 1, Math.ceil(cx + radius));
  const top = Math.max(0, Math.floor(cy - radius)), bottom = Math.min(height - 1, Math.ceil(cy + radius));
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / radius;
      if (d >= 1) continue;
      const alpha = d <= hardness ? 1 : (1 - d) / Math.max(1e-9, 1 - hardness);
      const index = y * width + x;
      mask[index] = erase ? mask[index] * (1 - alpha) : 1 - (1 - mask[index]) * (1 - alpha);
    }
  }
}

export function paintSegment(mask: Float64Array, width: number, height: number, start: NormalPoint,
  end: NormalPoint, radius: number, erase = false): void {
  normalPoint(start); normalPoint(end);
  if (!Number.isFinite(radius) || radius < 1 || radius > 80) throw new RangeError("Invalid brush radius.");
  const distance = Math.hypot((end[0] - start[0]) * width, (end[1] - start[1]) * height);
  const steps = Math.max(1, Math.ceil(distance / Math.max(0.5, radius / 3)));
  for (let index = 0; index <= steps; index++) {
    const t = index / steps;
    paintDisc(mask, width, height, [start[0] + t * (end[0] - start[0]), start[1] + t * (end[1] - start[1])], radius, erase);
  }
}

/** Records only completed strokes. Pointer cancellation cannot silently add a lash. */
export class Observations {
  private maskValue: Float64Array;
  private hairChecked = false;
  private tracesValue: Trace[] = [];
  private stroke: { tool: DrawingTool; points: NormalPoint[]; previousMask?: Float64Array } | null = null;

  constructor(readonly width: number, readonly height: number) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || Math.min(width, height) < 1 || Math.max(width, height) > 640) {
      throw new RangeError("Observation dimensions must be within the preview limit.");
    }
    this.maskValue = new Float64Array(width * height);
  }

  get hairDeclared(): boolean { return this.hairChecked; }
  get count(): number { return this.tracesValue.length; }
  get drawing(): boolean { return this.stroke !== null; }
  get mask(): Float64Array { return this.maskValue.slice(); }
  get traces(): Trace[] { return this.tracesValue.map(trace => ({ ...trace, points: trace.points.map(point => [...point]) })); }

  declareNoHair(): void {
    this.cancel(); this.maskValue.fill(0); this.hairChecked = true;
  }

  setHair(mask: ArrayLike<number>): void {
    if (mask.length !== this.maskValue.length) throw new RangeError("Hair mask dimensions differ.");
    const checked = new Float64Array(mask.length);
    for (let index = 0; index < mask.length; index++) {
      if (!Number.isFinite(mask[index]) || mask[index] < 0 || mask[index] > 1) throw new RangeError("Hair coverage must be in 0..1.");
      checked[index] = mask[index];
    }
    this.cancel(); this.maskValue = checked; this.hairChecked = true;
  }

  setTraces(values: readonly Trace[]): void {
    if (values.length > MAX_TRACES) throw new RangeError("Too many lash traces.");
    const checked = values.map(validateTrace);
    this.cancel(); this.tracesValue = checked;
  }

  begin(tool: DrawingTool, point: NormalPoint, radius: number): void {
    if (this.stroke) this.cancel();
    const allowed: readonly string[] = ["hair", "erase", "right-upper", "right-lower", "left-upper", "left-lower"];
    if (!allowed.includes(tool)) throw new RangeError("Unknown drawing tool.");
    const p = normalPoint(point);
    if (tool !== "hair" && tool !== "erase" && this.tracesValue.length >= MAX_TRACES) throw new RangeError("The lash observation limit has been reached.");
    const painting = tool === "hair" || tool === "erase";
    this.stroke = { tool, points: [p], previousMask: painting ? this.maskValue.slice() : undefined };
    if (painting) paintDisc(this.maskValue, this.width, this.height, p, radius, tool === "erase");
  }

  move(point: NormalPoint, radius: number): void {
    const stroke = this.stroke;
    if (!stroke) return;
    const p = normalPoint(point), previous = stroke.points[stroke.points.length - 1];
    if (stroke.tool === "hair" || stroke.tool === "erase") {
      paintSegment(this.maskValue, this.width, this.height, previous, p, radius, stroke.tool === "erase");
      stroke.points = [p];
    } else if (stroke.points.length < 64 && Math.hypot(p[0] - previous[0], p[1] - previous[1]) >= 0.0005) {
      stroke.points.push(p);
    }
  }

  end(): boolean {
    const stroke = this.stroke;
    this.stroke = null;
    if (!stroke) return false;
    if (stroke.tool === "hair" || stroke.tool === "erase") { this.hairChecked = true; return true; }
    if (stroke.points.length < 2) return false;
    const trace = validateTrace({ side: stroke.tool.startsWith("right") ? "right" : "left",
      lower: stroke.tool.endsWith("lower"), confidence: 1, points: stroke.points });
    this.tracesValue.push(trace);
    return true;
  }

  cancel(): void {
    if (this.stroke?.previousMask) this.maskValue = this.stroke.previousMask;
    this.stroke = null;
  }

  removeLastTrace(): void { this.cancel(); this.tracesValue.pop(); }
  clearHair(): void { this.cancel(); this.maskValue.fill(0); this.hairChecked = false; }
  clearTraces(): void { this.cancel(); this.tracesValue = []; }
}
