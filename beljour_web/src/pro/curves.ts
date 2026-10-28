/** Monotone Hermite curves in display-encoded sRGB; alpha remains unchanged.
 * The reference implementation is plumb_api.pro.curves, checked on synthetic samples.
 */
import { ProInputError, type CurvePoint, type ToneCurve, type ToneCurves } from "./types.js";

export interface CurveLuts {
  readonly red: Uint8Array;
  readonly green: Uint8Array;
  readonly blue: Uint8Array;
  readonly neutral: boolean;
}

export function validateCurve(points: ToneCurve): void {
  if (!Array.isArray(points) || points.length < 2 || points.length > 16) {
    throw new ProInputError("A curve needs 2 to 16 points");
  }
  if (points[0].x !== 0 || points[points.length - 1].x !== 1) {
    throw new ProInputError("Curve input must start at 0 and finish at 1");
  }
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || point.y < 0 || point.y > 1) {
      throw new ProInputError("Curve coordinates must be finite and in [0,1]");
    }
    if (i > 0 && (point.x <= points[i - 1].x || point.y < points[i - 1].y)) {
      throw new ProInputError("Curve input must increase and curve output cannot decrease");
    }
  }
}

export function derivatives(points: ToneCurve): number[] {
  validateCurve(points);
  const dx: number[] = [];
  const delta: number[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const distance = points[i + 1].x - points[i].x;
    dx.push(distance);
    delta.push((points[i + 1].y - points[i].y) / distance);
  }
  if (points.length === 2) return [delta[0], delta[0]];
  const endpoint = (h0: number, h1: number, d0: number, d1: number): number => {
    let slope = ((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1);
    if (slope * d0 <= 0) return 0;
    if (d0 * d1 < 0 && Math.abs(slope) > 3 * Math.abs(d0)) slope = 3 * d0;
    return slope;
  };
  const out = Array<number>(points.length).fill(0);
  out[0] = endpoint(dx[0], dx[1], delta[0], delta[1]);
  const last = dx.length - 1;
  out[points.length - 1] = endpoint(dx[last], dx[last - 1], delta[last], delta[last - 1]);
  for (let i = 1; i < points.length - 1; i++) {
    const a = delta[i - 1];
    const b = delta[i];
    if (a <= 0 || b <= 0) continue;
    const left = 2 * dx[i] + dx[i - 1];
    const right = dx[i] + 2 * dx[i - 1];
    out[i] = (left + right) / (left / a + right / b);
  }
  return out;
}

function sample(points: ToneCurve, slopes: readonly number[], input: number): number {
  if (input <= 0) return points[0].y;
  if (input >= 1) return points[points.length - 1].y;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (input > b.x) continue;
    const h = b.x - a.x;
    const t = (input - a.x) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return Math.max(0, Math.min(1,
      (2 * t3 - 3 * t2 + 1) * a.y + (t3 - 2 * t2 + t) * h * slopes[i]
      + (-2 * t3 + 3 * t2) * b.y + (t3 - t2) * h * slopes[i + 1]));
  }
  return points[points.length - 1].y;
}

export function curveValue(points: ToneCurve, input: number): number {
  if (!Number.isFinite(input)) throw new ProInputError("Curve input must be finite");
  return sample(points, derivatives(points), input);
}

export function curveLut(points: ToneCurve): Uint8Array {
  const slopes = derivatives(points);
  const result = new Uint8Array(256);
  for (let value = 0; value < 256; value++) {
    result[value] = Math.round(sample(points, slopes, value / 255) * 255);
  }
  return result;
}

export function makeCurveLuts(curves: ToneCurves): CurveLuts {
  const master = curveLut(curves.master);
  const red = curveLut(curves.red);
  const green = curveLut(curves.green);
  const blue = curveLut(curves.blue);
  const joined = [red, green, blue];
  const neutral = joined.every((channel) => master.every((value, i) => channel[value] === i));
  const tables = joined.map((channel) => Uint8Array.from(master, (v) => channel[v]));
  return { red: tables[0], green: tables[1], blue: tables[2], neutral };
}

export function applyCurvePixels(pixels: Uint8Array | Uint8ClampedArray, tables: CurveLuts): void {
  if (pixels.length % 4 !== 0) throw new ProInputError("Pixel data must be RGBA");
  if (tables.neutral) return;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] === 0) continue;
    pixels[i] = tables.red[pixels[i]];
    pixels[i + 1] = tables.green[pixels[i + 1]];
    pixels[i + 2] = tables.blue[pixels[i + 2]];
  }
}

export function threePointCurve(midtone: number): readonly CurvePoint[] {
  if (!Number.isFinite(midtone) || midtone < 0 || midtone > 1) {
    throw new ProInputError("Midtone output must be between 0 and 1");
  }
  return [{ x: 0, y: 0 }, { x: 0.5, y: midtone }, { x: 1, y: 1 }];
}
