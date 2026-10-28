/**
 * E04 separable filters with exact border rules (mirrors api/plumb_api/engines/core/filters.py):
 * box mean with replicated edges, 1D correlation with reflect101 borders, central-difference
 * gradients (one-sided on the outer rows and columns) and linear-interpolated quantiles.
 *
 * Results are Float64Array images so long sums keep their precision.
 * Author: John Khan.
 */
import { type FloatImage, floatImage } from "./buffer.js";

export const MAX_RADIUS = 512;

export function reflect101(i: number, n: number): number {
  if (n <= 0) throw new RangeError("length must be positive");
  if (n === 1) return 0;
  const period = 2 * n - 2;
  let k = i % period;
  if (k < 0) k += period;
  return k >= n ? period - k : k;
}

function requireFinite(img: FloatImage): void {
  for (let i = 0; i < img.data.length; i++) {
    if (!Number.isFinite(img.data[i])) throw new RangeError("values must be finite");
  }
}

/** Mean over a (2r+1)^2 window, edges extended; vertical pass first, as in Python. */
export function boxMean(img: FloatImage, radius: number): FloatImage {
  if (!Number.isInteger(radius) || radius < 0 || radius > MAX_RADIUS) {
    throw new RangeError(`radius must be a whole number between 0 and ${MAX_RADIUS}`);
  }
  requireFinite(img);
  const { width: w, height: h, channels: ch } = img;
  const out = floatImage(w, h, ch, true);
  out.data.set(img.data);
  if (radius === 0) return out;
  const size = 2 * radius + 1;
  // per pass: [samples along the axis, stride between them]; one line per column/row and channel
  const passes: Array<[number, number]> = [[h, w * ch], [w, ch]];
  for (let axis = 0; axis < 2; axis++) {
    const [length, stride] = passes[axis];
    const prefix = new Float64Array(length + 2 * radius + 1);
    const lineStarts: number[] = [];
    if (axis === 0) for (let x = 0; x < w; x++) for (let c = 0; c < ch; c++) lineStarts.push(x * ch + c);
    else for (let y = 0; y < h; y++) for (let c = 0; c < ch; c++) lineStarts.push(y * w * ch + c);
    const line = new Float64Array(length);
    for (const start of lineStarts) {
      for (let i = 0; i < length; i++) line[i] = out.data[start + i * stride];
      let sum = 0;
      prefix[0] = 0;
      for (let k = 0; k < length + 2 * radius; k++) {
        const src = Math.min(Math.max(k - radius, 0), length - 1);
        sum += line[src];
        prefix[k + 1] = sum;
      }
      for (let i = 0; i < length; i++) out.data[start + i * stride] = (prefix[i + size] - prefix[i]) / size;
    }
  }
  return out;
}

/** Correlate along an axis (0 = down the rows, 1 = along each row) with an odd kernel. */
export function convolve(img: FloatImage, kernel: ArrayLike<number>, axis: 0 | 1): FloatImage {
  if (kernel.length % 2 !== 1) throw new RangeError("kernel must have odd length");
  const { width: w, height: h, channels: ch } = img;
  const r = (kernel.length - 1) / 2;
  const out = floatImage(w, h, ch, true);
  const length = axis === 0 ? h : w;
  const idx = new Int32Array(length * kernel.length);
  for (let i = 0; i < length; i++) for (let k = 0; k < kernel.length; k++) idx[i * kernel.length + k] = reflect101(i + k - r, length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = axis === 0 ? y : x;
      for (let c = 0; c < ch; c++) {
        let acc = 0;
        for (let k = 0; k < kernel.length; k++) {
          const j = idx[i * kernel.length + k];
          const src = axis === 0 ? (j * w + x) * ch + c : (y * w + j) * ch + c;
          acc = acc + kernel[k] * img.data[src];
        }
        out.data[(y * w + x) * ch + c] = acc;
      }
    }
  }
  return out;
}

/** [d/dx, d/dy] of a one-channel image (NumPy np.gradient, edge_order 1). */
export function gradient(plane: FloatImage): [FloatImage, FloatImage] {
  if (plane.channels !== 1) throw new RangeError("gradient works on one channel");
  const { width: w, height: h, data } = plane;
  const gx = floatImage(w, h, 1, true), gy = floatImage(w, h, 1, true);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (w > 1) {
        gx.data[i] = x === 0 ? data[i + 1] - data[i] : x === w - 1 ? data[i] - data[i - 1] : (data[i + 1] - data[i - 1]) / 2;
      }
      if (h > 1) {
        gy.data[i] = y === 0 ? data[i + w] - data[i] : y === h - 1 ? data[i] - data[i - w] : (data[i + w] - data[i - w]) / 2;
      }
    }
  }
  return [gx, gy];
}

export function gradientMagnitude(plane: FloatImage): FloatImage {
  const [gx, gy] = gradient(plane);
  const out = floatImage(plane.width, plane.height, 1, true);
  for (let i = 0; i < out.data.length; i++) out.data[i] = Math.sqrt(gx.data[i] * gx.data[i] + gy.data[i] * gy.data[i]);
  return out;
}

/** Quantile q of a non-empty sample, interpolating linearly between order statistics. */
export function quantile(values: ArrayLike<number>, q: number): number {
  if (values.length === 0) throw new RangeError("quantile of an empty sample");
  if (!(q >= 0 && q <= 1)) throw new RangeError("q must be in [0, 1]");
  const sorted = Float64Array.from(values).sort();
  const pos = q * (sorted.length - 1);
  const lo = Math.floor(pos), hi = Math.min(lo + 1, sorted.length - 1);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/** Local area scale of a backward map (mapX, mapY); <= 0 where the mapping folds. */
export function jacobianDeterminant(mapX: FloatImage, mapY: FloatImage): FloatImage {
  if (mapX.width !== mapY.width || mapX.height !== mapY.height) throw new RangeError("maps must be the same size");
  const [xx, xy] = gradient(mapX), [yx, yy] = gradient(mapY);
  const out = floatImage(mapX.width, mapX.height, 1, true);
  for (let i = 0; i < out.data.length; i++) out.data[i] = xx.data[i] * yy.data[i] - xy.data[i] * yx.data[i];
  return out;
}
