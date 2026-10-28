/**
 * E06 fold and flip checks, and a strength guard that keeps a warp fold-free.
 *
 * foldReport: Jacobian determinant of the backward maps (Q3 passes above 0.2 everywhere).
 * triangleFlips: triangles whose signed area changes sign or shrinks below minRatio.
 * safeStrength: the largest strength in [0, requested] whose field passes, by bisection.
 * Mirrors api/plumb_api/engines/warp/fold.py.
 *
 * Author: John Khan.
 */
import { type Field, type Point2, jacobian, scale } from "./field.js";
import { checkTriangles } from "./piecewise.js";
import { type Triangle, signedArea } from "./triangulate.js";

export const Q3_MINIMUM = 0.2;

export interface FoldReport {
  minDet: number;
  maxDet: number;
  foldedShare: number;
  belowShare: number;
  worstX: number;
  worstY: number;
  minimum: number;
  passed: boolean;
}

export function foldReport(field: Field, minimum = Q3_MINIMUM): FoldReport {
  const det = jacobian(field).data;
  let min = Infinity, max = -Infinity, worst = 0, folded = 0, below = 0;
  for (let i = 0; i < det.length; i++) {
    const v = det[i];
    if (v < min) { min = v; worst = i; }
    if (v > max) max = v;
    if (v <= 0) folded++;
    if (v <= minimum) below++;
  }
  return { minDet: min, maxDet: max, foldedShare: folded / det.length, belowShare: below / det.length,
           worstX: worst % field.width, worstY: Math.floor(worst / field.width), minimum, passed: min > minimum };
}

export interface FlipReport { flipped: number[]; squashed: number[]; minAreaRatio: number; passed: boolean }

export function triangleFlips(src: readonly Point2[], dst: readonly Point2[], triangles: readonly Triangle[], minRatio = Q3_MINIMUM): FlipReport {
  if (src.length !== dst.length) throw new RangeError("src and dst must have the same number of points");
  checkTriangles(triangles, src.length);
  const flipped: number[] = [], squashed: number[] = [];
  let worst = Infinity;
  triangles.forEach(([a, b, c], index) => {
    const before = signedArea(src[a], src[b], src[c]);
    if (before === 0) return;
    const ratio = signedArea(dst[a], dst[b], dst[c]) / before;
    worst = Math.min(worst, ratio);
    if (ratio <= 0) flipped.push(index);
    else if (ratio < minRatio) squashed.push(index);
  });
  return { flipped, squashed, minAreaRatio: Number.isFinite(worst) ? worst : 1, passed: !flipped.length && !squashed.length };
}

export interface SafeStrength { strength: number; field: Field; report: FoldReport; reduced: boolean }

export function safeStrength(build: (strength: number) => Field,
  { minimum = Q3_MINIMUM, iterations = 12, requested = 1 } = {}): SafeStrength {
  if (!(requested >= 0 && requested <= 1)) throw new RangeError("requested strength must be in [0, 1]");
  if (!(Number.isInteger(iterations) && iterations >= 1 && iterations <= 40)) throw new RangeError("iterations must be 1..40");
  const top = build(requested);
  const report = foldReport(top, minimum);
  if (report.passed) return { strength: requested, field: top, report, reduced: false };
  let lo = 0, hi = requested;
  let bestField = build(0), bestReport = foldReport(bestField, minimum);
  for (let k = 0; k < iterations; k++) {
    const mid = (lo + hi) / 2;
    const candidate = build(mid), rep = foldReport(candidate, minimum);
    if (rep.passed) { lo = mid; bestField = candidate; bestReport = rep; } else hi = mid;
  }
  return { strength: lo, field: bestField, report: bestReport, reduced: true };
}

export function scaledBuilder(field: Field): (strength: number) => Field {
  return (s) => scale(field, s);
}
