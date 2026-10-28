/** Original eye-local placement, reusing the established contour data. Author: John Khan. */
import { CONTOURS } from "../../data/regions/index.js";
import { polygon } from "../core/mask.js";
import { type Anatomy, type Point, type Side, validatePoints } from "./contracts.js";

export class EyeFrame {
  constructor(
    readonly side: Side,
    readonly origin: Point,
    readonly axis: Point,
    readonly up: Point,
    readonly width: number,
    readonly aperture: number,
    readonly brow_space: number,
    readonly upper: readonly Point[],
    readonly lower: readonly Point[],
    readonly contour: readonly Point[],
    readonly roll: number,
    readonly downturned: boolean,
    readonly visible: boolean,
  ) {}
  point(u: number, v: number): Point {
    return [this.origin[0] + this.width * (u * this.axis[0] + v * this.up[0]), this.origin[1] + this.width * (u * this.axis[1] + v * this.up[1])];
  }
  local(x: number, y: number): Point {
    const dx = x - this.origin[0], dy = y - this.origin[1];
    return [(dx * this.axis[0] + dy * this.axis[1]) / this.width, (dx * this.up[0] + dy * this.up[1]) / this.width];
  }
  asDict(): Record<string, unknown> {
    return { side: this.side, origin: [...this.origin], axis: [...this.axis], up: [...this.up], width: this.width,
      aperture: this.aperture, brow_space: this.brow_space, upper: this.upper.map(p => [...p]), lower: this.lower.map(p => [...p]),
      roll: this.roll, downturned: this.downturned, visible: this.visible };
  }
}
export function interpolate(points: readonly Point[], u: number): number {
  if (u <= points[0][0]) return points[0][1];
  if (u >= points[points.length - 1][0]) return points[points.length - 1][1];
  for (let i = 0; i + 1 < points.length; i++) {
    const [x0, y0] = points[i], [x1, y1] = points[i + 1];
    if (x0 <= u && u <= x1) return x1 - x0 < 1e-12 ? y0 : y0 + (y1 - y0) * (u - x0) / (x1 - x0);
  }
  return points[points.length - 1][1];
}
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b), middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
export function frames(points: readonly Point[], width: number, height: number): [EyeFrame, EyeFrame] {
  const mesh: Point[] = validatePoints(points).map(([x, y]) => [x * width, y * height]);
  const output: EyeFrame[] = [];
  for (const side of ["right", "left"] as const) {
    const contour = CONTOURS[`${side}_eye`], brows = CONTOURS[`${side}_brow`];
    const outer = mesh[contour[0]], inner = mesh[contour[Math.floor(contour.length / 2)]];
    const delta: Point = [outer[0] - inner[0], outer[1] - inner[1]];
    const span = Math.hypot(...delta);
    if (span < 2) throw new RangeError("eye width is too small or degenerate");
    const axis: Point = [delta[0] / span, delta[1] / span];
    let up: Point = [-axis[1], axis[0]];
    const forehead: Point = [mesh[10][0] - (inner[0] + outer[0]) / 2, mesh[10][1] - (inner[1] + outer[1]) / 2];
    if (up[0] * forehead[0] + up[1] * forehead[1] < 0) up = [-up[0], -up[1]];
    const local = (p: Point): Point => [((p[0] - inner[0]) * axis[0] + (p[1] - inner[1]) * axis[1]) / span, ((p[0] - inner[0]) * up[0] + (p[1] - inner[1]) * up[1]) / span];
    const vertices = contour.map(i => local(mesh[i]));
    const middle = Math.floor(contour.length / 2);
    const arcA = vertices.slice(0, middle + 1), arcB = [...vertices.slice(middle), vertices[0]];
    const mean = (values: readonly Point[]) => values.reduce((sum, p) => sum + p[1], 0) / values.length;
    const [upper, lower] = mean(arcA) > mean(arcB) ? [arcA, arcB] : [arcB, arcA];
    upper.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    lower.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const aperture = Math.max(0, interpolate(upper, .5) - interpolate(lower, .5));
    const browSpace = Math.max(.08, Math.min(.65, median(brows.map(i => local(mesh[i])[1]))));
    const roll = Math.atan2(delta[1], Math.abs(delta[0])) * 180 / Math.PI;
    output.push(new EyeFrame(side, inner, axis, up, span, aperture, browSpace, upper, lower, vertices, roll, delta[1] > .035 * span, aperture >= .08));
  }
  return [output[0], output[1]];
}
export function lidHeight(frame: EyeFrame, anatomy: Anatomy, u: number): number {
  const upper = interpolate(frame.upper, u);
  const free = Math.max(.025, frame.brow_space - upper - .025);
  const fraction = { open: .58, hooded: .28, monolid: .74, deep_set: .43 }[anatomy];
  return Math.min(.24, free * fraction);
}
export function lidBounds(frame: EyeFrame, anatomy: Anatomy, u: number): Point {
  const bottom = interpolate(frame.upper, Math.min(1, Math.max(0, u))) + .008;
  return [bottom, bottom + lidHeight(frame, anatomy, u)];
}
export function visibleCanvas(frame: EyeFrame, anatomy: Anatomy): Point[] {
  const lower: Point[] = [], upper: Point[] = [];
  for (let i = 0; i < 25; i++) {
    const u = .035 + .93 * i / 24, [low, high] = lidBounds(frame, anatomy, u);
    lower.push(frame.point(u, low));
    upper.push(frame.point(u, high));
  }
  return [...lower, ...upper.reverse()];
}
export function eyeProtection(height: number, width: number, eyeFrames: readonly EyeFrame[]): Float64Array {
  const out = new Float64Array(height * width);
  for (const frame of eyeFrames) {
    const mask = polygon(width, height, frame.contour.map(([u, v]) => frame.point(u, v)), 2);
    for (let i = 0; i < out.length; i++) out[i] = Math.max(out[i], mask.data[i]);
  }
  return out;
}
export function nativePlacement(frame: EyeFrame, anatomy: Anatomy): Record<string, unknown> {
  const techniques = {
    open: ["Follow the visible crease", "Keep the lower edge on your measured lash line."],
    hooded: ["Open-eye batwing", "The connector crosses the fold as a small step; keep the mobile-lid band thin."],
    monolid: ["Visible gradient", "Build depth from the lash line; no crease is drawn onto your eye."],
    deep_set: ["Low crease and outer lift", "Keep the centre lighter and stay below the brow shadow."],
  };
  const [technique, why] = techniques[anatomy];
  const warnings: string[] = [];
  if (frame.downturned) warnings.push("The outer corner turns down. A shorter lifted tail avoids extending that direction.");
  if (anatomy === "hooded") warnings.push("Check with eyes open. A long outer wing may disappear in the fold.");
  if (!frame.visible) warnings.push("This eye is closed or too narrow to place this preview reliably.");
  return { side: frame.side, anatomy, technique, why, warnings, eye_width_px: frame.width, aperture_ratio: frame.aperture,
    canvas: visibleCanvas(frame, anatomy).map(p => [...p]), geometry_changed: false, expert_validation: "Not tested with artists or real models" };
}
