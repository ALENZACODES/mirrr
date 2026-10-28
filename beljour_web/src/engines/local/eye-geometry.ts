/** Eye geometry from the 478-point mesh, shared by red eye, glasses glare and eye colour.
 * Mirrors api/plumb_api/engines/repair/eye_geometry.py: open eye when the lid gap is at
 * least EYE_OPEN_RATIO of the corner width, eye opening = contour polygon coverage >= 0.5,
 * iris disk from the iris centre and the mean ring radius tested at pixel centres, and the
 * visible iris = disk inside the opening (none for a closed eye). Author: John Khan.
 * Inspiration: MediaPipe Face Landmarker (478-point mesh and iris points); concept only, no code copied.
 */
import { polygon } from "../core/mask.js";
import { CONTOURS } from "../../data/regions/index.js";
import type { P2 } from "./photo-fix.js";

export const SIDES = ["right", "left"] as const;
export type Side = typeof SIDES[number];
export const IRIS_CENTRE: Record<Side, number> = { right: 468, left: 473 };
export const IRIS_RING: Record<Side, readonly number[]> = { right: [469, 470, 471, 472], left: [474, 475, 476, 477] };
export const EYE_LIDS: Record<Side, readonly [number, number, number, number]> = { right: [159, 145, 33, 133], left: [386, 374, 263, 362] };
export const EYE_OPEN_RATIO = 0.08;

export function eyeWidth(pts: readonly P2[], side: Side): number {
  const [, , a, b] = EYE_LIDS[side];
  return Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1]);
}

export function eyeOpen(pts: readonly P2[], side: Side): boolean {
  const [top, bottom] = EYE_LIDS[side], width = eyeWidth(pts, side);
  const gap = Math.hypot(pts[top][0] - pts[bottom][0], pts[top][1] - pts[bottom][1]);
  return width > 1e-9 && gap / width >= EYE_OPEN_RATIO;
}

export function eyeCoverage(pts: readonly P2[], side: Side, height: number, width: number): Float32Array | Float64Array {
  const contour = (side === "right" ? CONTOURS.right_eye : CONTOURS.left_eye).map((i) => [pts[i][0], pts[i][1]] as const);
  return polygon(width, height, contour).data;
}

export function eyeOpening(pts: readonly P2[], side: Side, height: number, width: number): Uint8Array {
  const cover = eyeCoverage(pts, side, height, width), out = new Uint8Array(width * height);
  for (let i = 0; i < out.length; i++) out[i] = cover[i] >= 0.5 ? 1 : 0;
  return out;
}

export function irisCircle(pts: readonly P2[], side: Side): [number, number, number] {
  const cx = pts[IRIS_CENTRE[side]][0], cy = pts[IRIS_CENTRE[side]][1];
  let total = 0;
  for (const i of IRIS_RING[side]) total += Math.hypot(pts[i][0] - cx, pts[i][1] - cy);
  return [cx, cy, total / 4];
}

export function irisDisk(pts: readonly P2[], side: Side, height: number, width: number, scale = 1): Uint8Array {
  const [cx, cy, r] = irisCircle(pts, side), rr = r * scale, out = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
    out[y * width + x] = dx * dx + dy * dy <= rr * rr ? 1 : 0;
  }
  return out;
}

export function visibleIris(pts: readonly P2[], side: Side, height: number, width: number): Uint8Array {
  if (!eyeOpen(pts, side)) return new Uint8Array(width * height);
  const disk = irisDisk(pts, side, height, width), opening = eyeOpening(pts, side, height, width);
  for (let i = 0; i < disk.length; i++) disk[i] &= opening[i];
  return disk;
}
