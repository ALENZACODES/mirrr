/** Temporal smoothing for per-frame effects.
 *
 * PointSmoother: the existing One Euro landmark smoothing (reel/oneEuro.ts) on pixel points,
 * so masks built from the face points stop jittering without lagging a moving head.
 * MaskSmoother: a motion-adaptive running mean of a 0..1 mask. Where the new mask is close to
 * the smoothed one, it moves by MASK_RATE (flicker is averaged away); where it differs by
 * more than MASK_JUMP (a real move), it takes the new value at once, so edges do not trail.
 * PixelSmoother: the same idea on output pixels: a pixel whose new value is within
 * PIXEL_STILL of the previous output keeps PIXEL_KEEP of it (temporal noise and flicker
 * reduction on still areas); anything that moved takes the new frame (no ghosting).
 * Rates are ASSUMED, chosen on drawn sequences. Author: John Khan.
 */
import type { ByteImage } from "../../engines/core/buffer.js";
import type { Point2 } from "../../engines/warp/field.js";
import { LandmarkSmoother } from "../oneEuro.js";

export const MASK_RATE = 0.35, MASK_JUMP = 0.5, PIXEL_STILL = 12, PIXEL_KEEP = 0.6;

export class PointSmoother {
  private readonly smoother: LandmarkSmoother;
  constructor(minCutoff = 1.5, beta = 0.02) { this.smoother = new LandmarkSmoother(minCutoff, beta); }
  smooth(points: readonly Point2[], t: number): Point2[] {
    return this.smoother.smooth(points.map(([x, y]) => ({ x, y })), t).map((p) => [p.x, p.y] as const);
  }
  reset(): void { this.smoother.reset(); }
}

export class MaskSmoother {
  private state: Float32Array | null = null;
  constructor(readonly rate = MASK_RATE, readonly jump = MASK_JUMP) {}
  smooth(mask: Float32Array): Float32Array {
    if (!this.state || this.state.length !== mask.length) { this.state = Float32Array.from(mask); return Float32Array.from(mask); }
    const s = this.state;
    for (let i = 0; i < mask.length; i++) {
      const d = mask[i] - s[i];
      s[i] = Math.abs(d) > this.jump ? mask[i] : s[i] + this.rate * d;
    }
    return Float32Array.from(s);
  }
  reset(): void { this.state = null; }
}

export class PixelSmoother {
  private last: ByteImage | null = null;
  constructor(readonly still = PIXEL_STILL, readonly keep = PIXEL_KEEP) {}
  smooth(image: ByteImage): ByteImage {
    const out: ByteImage = { width: image.width, height: image.height, channels: image.channels, data: new Uint8ClampedArray(image.data) };
    const prev = this.last;
    if (prev && prev.width === image.width && prev.height === image.height && prev.channels === image.channels) {
      const c = image.channels;
      for (let i = 0; i < image.width * image.height; i++) {
        let still = true;
        for (let k = 0; k < 3; k++) if (Math.abs(image.data[i * c + k] - prev.data[i * c + k]) > this.still) { still = false; break; }
        if (!still) continue;
        for (let k = 0; k < 3; k++) {
          const a = image.data[i * c + k], b = prev.data[i * c + k];
          out.data[i * c + k] = Math.floor(a + this.keep * (b - a) + 0.5);
        }
      }
    }
    this.last = out;
    return out;
  }
  reset(): void { this.last = null; }
}
