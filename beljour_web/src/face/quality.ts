/**
 * Photo checks run in the browser before any unit is spent. They mirror YouCam's own
 * requirements: face wider than 60% of the image for skin analysis, front facing, centred,
 * evenly lit.
 * Face-mapping credits (licences.json "concepts"): runtime MediaPipe Face Landmarker
 * (Bucket A); concept only, no code copied: OpenFace (roll and turn read from landmark
 * geometry before analysis), from its documentation. Author: John Khan.
 */
import type { Point } from "../types.js";

export interface Check {
  id: string;
  ok: boolean;
  message: string;
}

export const MIN_FACE_WIDTH = 0.6;

export function faceWidthRatio(points: Point[]): number {
  const xs = points.map((p) => p.x);
  return Math.max(...xs) - Math.min(...xs);
}

/** Roll from the eye corners, in degrees. */
export function rollDegrees(points: Point[], width: number, height: number): number {
  const a = points[33], b = points[263];
  return (Math.atan2((b.y - a.y) * height, (b.x - a.x) * width) * 180) / Math.PI;
}

/** Yaw proxy: nose tip offset from the midpoint of the cheeks, as a share of face width. */
export function yawShare(points: Point[]): number {
  const left = points[234].x, right = points[454].x, nose = points[1].x;
  const mid = (left + right) / 2;
  return (nose - mid) / Math.abs(right - left || 1);
}

/** Mean luma (0..255) and share of blown out pixels from RGBA data of the face crop. */
export function lighting(rgba: Uint8ClampedArray): { mean: number; clipped: number } {
  let sum = 0, clipped = 0, n = 0;
  for (let i = 0; i < rgba.length; i += 4) {
    const y = 0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2];
    sum += y;
    if (y > 250) clipped++;
    n++;
  }
  return { mean: n ? sum / n : 0, clipped: n ? clipped / n : 0 };
}

export function runChecks(points: Point[] | null, width: number, height: number,
                          light: { mean: number; clipped: number } | null, forSkin = true): Check[] {
  if (!points) {
    return [{ id: "face", ok: false, message: "No face found. Face the camera with your whole face in the frame." }];
  }
  const checks: Check[] = [];
  const fw = faceWidthRatio(points);
  checks.push({
    id: "size",
    ok: !forSkin || fw >= MIN_FACE_WIDTH,
    message: fw >= MIN_FACE_WIDTH
      ? "Face fills the frame well."
      : `Your face fills ${Math.round(fw * 100)}% of the width. Skin analysis needs more than 60%, so move closer.`,
  });
  const cx = (Math.max(...points.map((p) => p.x)) + Math.min(...points.map((p) => p.x))) / 2;
  checks.push({ id: "centre", ok: cx > 0.38 && cx < 0.62, message: cx > 0.38 && cx < 0.62 ? "Face is centred." : "Move so your face is in the middle of the photo." });
  const roll = rollDegrees(points, width, height);
  checks.push({ id: "tilt", ok: Math.abs(roll) < 8, message: Math.abs(roll) < 8 ? "Head is level." : "Your head is tilted. Keep it level." });
  const yaw = yawShare(points);
  checks.push({ id: "turn", ok: Math.abs(yaw) < 0.08, message: Math.abs(yaw) < 0.08 ? "Looking straight ahead." : "Turn to face the camera directly." });
  if (light) {
    const ok = light.mean > 70 && light.clipped < 0.08;
    checks.push({
      id: "light", ok,
      message: ok ? "Lighting looks even." : light.mean <= 70 ? "It's a little dark. Face a window or a lamp." : "Some areas are too bright. Move away from direct light.",
    });
  }
  return checks;
}
