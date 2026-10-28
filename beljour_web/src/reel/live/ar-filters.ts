/** #82 Live AR filters: one of our own colour looks plus a face-anchored drawn layer, per frame.
 * The look is a recipe from the local filter engine (filters/runtime/engine.ts) with the skin
 * guard on, using a skin mask from the face points, so a filter never lightens skin. The drawn
 * layer is our own procedural art anchored to the face points (steadied with the One Euro
 * smoothing, so it follows the face without jitter): small star sparkles around the
 * cheekbones, or a soft cheek tint applied as a multiply (it can only deepen colour). A frame
 * without a face is passed through unchanged. Names follow the app's French place names; the
 * sizes and colours are ASSUMED. Author: John Khan.
 */
import type { ByteImage } from "../../engines/core/buffer.js";
import type { Point2 } from "../../engines/warp/field.js";
import { fromLandmarks } from "../../filters/masks/blend.js";
import { render } from "../../filters/runtime/engine.js";
import { type EffectOutput, type Frame, type FrameEffect, type FrameInputs, copyFrame } from "./frames.js";
import { PointSmoother } from "./temporal.js";

export type Layer = "stars" | "cheeks" | "none";
export interface LiveFilter { id: string; title: string; look: string; layer: Layer }
export const LIVE_FILTERS: readonly LiveFilter[] = [
  { id: "etoiles", title: "Étoiles de Giverny", look: "C03", layer: "stars" },
  { id: "joues", title: "Joues d'Étretat", look: "C07", layer: "cheeks" },
  { id: "nuit", title: "Nuit de Saint-Malo", look: "M02", layer: "none" },
  { id: "soleil", title: "Soleil de Biarritz", look: "C02", layer: "none" },
];
export const LABEL = "Live filter: a local look with our own drawn layer. A simulation.";
export const STAR_RGB = [255, 246, 222] as const, CHEEK_RGB = [222, 128, 138] as const;
const CHEEKS = [205, 425] as const;
/** Star offsets around each cheek centre, in shares of the eye distance (our own layout). */
const STARS: readonly (readonly [number, number, number])[] = [
  [-0.22, -0.18, 1], [0.05, -0.28, 0.7], [0.24, -0.08, 0.85], [-0.12, 0.12, 0.6], [0.16, 0.2, 0.75], [-0.3, 0.02, 0.55],
];

export function liveFilter(id: string): LiveFilter {
  const found = LIVE_FILTERS.find((f) => f.id === id);
  if (!found) throw new RangeError(`no live filter ${JSON.stringify(id)}`);
  return found;
}

function blendPixel(out: ByteImage, x: number, y: number, rgb: readonly number[], a: number, multiply: boolean): void {
  if (x < 0 || y < 0 || x >= out.width || y >= out.height || a <= 0) return;
  const i = (Math.floor(y) * out.width + Math.floor(x)) * out.channels;
  for (let k = 0; k < 3; k++) {
    const v = out.data[i + k], target = multiply ? v * rgb[k] / 255 : rgb[k];
    out.data[i + k] = Math.floor(v + a * (target - v) + 0.5);
  }
}

export function drawLayer(out: ByteImage, pts: readonly Point2[], layer: Layer, share: number): void {
  if (layer === "none") return;
  const iod = Math.hypot(pts[473][0] - pts[468][0], pts[473][1] - pts[468][1]);
  for (const c of CHEEKS) {
    const [cx, cy] = pts[c];
    if (layer === "cheeks") {
      const r = 0.3 * iod;
      for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r;
        if (d < 1) blendPixel(out, x, y, CHEEK_RGB, 0.35 * share * (1 - d * d), true);
      }
      continue;
    }
    for (const [dx, dy, size] of STARS) {
      const sx = cx + dx * iod, sy = cy + dy * iod, arm = Math.max(1, Math.round(0.06 * iod * size));
      for (let k = -arm; k <= arm; k++) {
        const a = 0.85 * share * (1 - Math.abs(k) / (arm + 1));
        blendPixel(out, sx + k, sy, STAR_RGB, a, false);
        if (k) blendPixel(out, sx, sy + k, STAR_RGB, a, false);
      }
    }
  }
}

export class LiveArFilter implements FrameEffect {
  readonly id = "ar_filter";
  readonly label = LABEL;
  private readonly points = new PointSmoother();
  lastPoints: Point2[] | null = null;
  readonly filter: LiveFilter;
  constructor(filterId = "etoiles") { this.filter = liveFilter(filterId); }

  apply(frame: Frame, inputs: FrameInputs, strength: number): EffectOutput {
    const image = frame.image;
    if (!inputs.points || inputs.points.length !== 478) {
      this.points.reset(); this.lastPoints = null;
      return { image: copyFrame(image), changed: false, note: "No face on some frames; they were left unchanged." };
    }
    const pts = this.points.smooth(inputs.points, frame.t);
    this.lastPoints = pts;
    if (strength === 0) return { image: copyFrame(image), changed: false, note: "" };
    const looked = render(image, this.filter.look, { strength }, fromLandmarks(pts, image.width, image.height)).image;
    const out = copyFrame(image), c = image.channels;
    for (let i = 0; i < image.width * image.height; i++) for (let k = 0; k < 3; k++) out.data[i * c + k] = looked.data[i * 3 + k];
    drawLayer(out, pts, this.filter.layer, strength / 100);
    return { image: out, changed: true, note: "" };
  }

  reset(): void { this.points.reset(); this.lastPoints = null; }
}
