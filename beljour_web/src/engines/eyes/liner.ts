/** Per-eye wing and graphic-liner geometry, W64/W65/W75/W76. Author: John Khan. */
import { type Anatomy, type EyeOptions, type Point, type RGB } from "./contracts.js";
import { type EyeFrame, interpolate, lidBounds, nativePlacement, visibleCanvas } from "./geometry.js";
import { combine, filled, stroke } from "./raster.js";

export const COLOURED: Record<string, RGB> = { navy: [30, 46, 92], burgundy: [109, 38, 60], forest: [36, 82, 57] };
export const WING_STYLES = ["wing", "batwing", "tightline", "soft_wing"] as const;
export const GRAPHIC_STYLES = ["floating", "double_wing", "smoked_pencil", "gel", "shadow"] as const;
export interface WingGeometry { polygon: Point[]; tip: Point; tail_length_eye_width: number; fold_estimate: boolean; asymmetry_preserved: boolean }
export function wingGeometry(frame: EyeFrame, anatomy: Anatomy, length: number, thickness: number): WingGeometry {
  const span = length * (frame.downturned ? .67 : 1);
  const rise = span * (["hooded", "deep_set"].includes(anatomy) ? .75 : .55);
  const upper = interpolate(frame.upper, .86);
  const start = frame.point(.86, upper + thickness), outer = frame.point(1, .008), tip = frame.point(1 + span, rise);
  let polygon: Point[];
  if (anatomy === "hooded") {
    const fold = Math.min(frame.brow_space * .42, .12);
    polygon = [outer, tip, frame.point(.96 + span * .20, rise * .72), frame.point(.96 + span * .20, fold), frame.point(.90, fold), start];
  } else if (anatomy === "monolid") {
    polygon = [outer, tip, frame.point(.91, Math.max(.03, upper + thickness * 1.5)), start];
  } else if (anatomy === "deep_set") {
    polygon = [outer, tip, frame.point(.98, Math.min(frame.brow_space * .30, rise * .6)), start];
  } else {
    polygon = [outer, tip, start];
  }
  return { polygon, tip, tail_length_eye_width: span, fold_estimate: anatomy === "hooded", asymmetry_preserved: true };
}
export interface LinerField { mask: Float64Array; report: Record<string, unknown> }
export function linerMask(height: number, width: number, frame: EyeFrame, request: EyeOptions): LinerField {
  const anatomy = request.anatomy[frame.side];
  let style = request.style || "wing";
  if (request.feature === "W75") style = anatomy === "hooded" ? "batwing" : "soft_wing";
  else if (request.feature === "W76") style = "wing";
  if (!(WING_STYLES as readonly string[]).includes(style)) throw new RangeError("unsupported wing technique");
  const report = nativePlacement(frame, anatomy);
  if (!frame.visible) return { mask: new Float64Array(height * width), report };
  const thickness = request.thickness * (anatomy === "hooded" ? .60 : 1), points: Point[] = [];
  for (let i = 0; i < 33; i++) {
    const u = .04 + .92 * i / 32, v = interpolate(frame.upper, u);
    points.push(frame.point(u, v + thickness * (style === "tightline" ? .45 : 1.1)));
  }
  const softness = .8 + request.blend * (style === "soft_wing" ? 2 : .4);
  let mask = stroke(height, width, points, Math.max(.3, thickness * frame.width), false, softness);
  if (style !== "tightline") {
    const wing = wingGeometry(frame, style === "batwing" ? "hooded" : anatomy, request.length, thickness);
    mask = combine(mask, filled(height, width, wing.polygon));
    report.wing = wing;
  }
  report.thickness_eye_width = thickness;
  report.style = style;
  return { mask, report };
}
export function graphicMask(height: number, width: number, frame: EyeFrame, request: EyeOptions): LinerField {
  const anatomy = request.anatomy[frame.side], style = request.style || "floating";
  if (!(GRAPHIC_STYLES as readonly string[]).includes(style)) throw new RangeError("unsupported graphic liner technique");
  const report = nativePlacement(frame, anatomy);
  report.style = style;
  if (!frame.visible) return { mask: new Float64Array(height * width), report };
  const canvas = filled(height, width, visibleCanvas(frame, anatomy));
  let mask: Float64Array;
  if (["floating", "double_wing"].includes(style)) {
    const path: Point[] = [];
    for (let i = 0; i < 29; i++) {
      const u = .10 + .78 * i / 28, [low, high] = lidBounds(frame, anatomy, u);
      path.push(frame.point(u, low + .68 * (high - low)));
    }
    mask = stroke(height, width, path, Math.max(.3, request.thickness * frame.width));
    if (style === "double_wing") {
      const secondary: Point[] = Array.from({ length: 16 }, (_, i) => {
        const u = .60 + .31 * i / 15;
        return frame.point(u, lidBounds(frame, anatomy, u)[0] + .025);
      });
      mask = combine(mask, stroke(height, width, secondary, Math.max(.25, request.thickness * frame.width * .65)));
    }
  } else {
    const path: Point[] = Array.from({ length: 25 }, (_, i) => {
      const u = .05 + .9 * i / 24;
      return frame.point(u, interpolate(frame.upper, u) + .012);
    });
    const softness = style === "smoked_pencil" ? 1.8 + 4 * request.blend : style === "gel" ? .75 : 2.2 + 5 * request.blend;
    mask = stroke(height, width, path, Math.max(.4, request.thickness * frame.width), false, softness);
  }
  for (let i = 0; i < mask.length; i++) if (canvas[i] === 0) mask[i] = 0;
  report.contrast_note = "On deep lids black may have low contrast. Bronze or brown is another option; the line has not been thickened.";
  report.mobile_lid_only = true;
  return { mask, report };
}
export function colourRecommendations(iris: RGB): Record<string, unknown>[] {
  const [r, g, b] = iris, brown = r >= b && r >= g * .9;
  return Object.entries(COLOURED).map(([name, colour]) => ({
    name, colour: [...colour], display_distance: Math.sqrt(iris.reduce((sum, value, i) => sum + (value - colour[i]) ** 2, 0)),
    why: brown ? "A visible colour alternative for brown eyes." : "Compare against your unchanged iris colour.",
  }));
}
