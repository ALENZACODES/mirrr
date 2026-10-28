/** Coded refusals around existing descriptive ratio measurements.
 * Preserve the throwing legacy API and the original shared definitions.
 * MediaPipe Face Landmarker indices (data); Farkas anthropometry
 * (concept only, no code copied).
 * Author: John Khan.
 */
import type { Point2 } from "../warp/field.js";
import { measure, type ProportionReport, type ReferenceSet } from "./ratios.js";

export interface RefusedProportions { module: "proportions"; refused: true; code: string; message: string }
export interface MeasuredProportions { module: "proportions"; refused: false; report: ProportionReport }
export type CheckedProportions = RefusedProportions | MeasuredProportions;

export function checkedProportions(mesh: readonly Point2[], reference: ReferenceSet = "golden"): CheckedProportions {
  try {
    const report = measure(mesh, reference);
    for (const reading of report.ratios) {
      if (typeof reading.value === "number" && !Number.isFinite(reading.value)) {
        return { module: "proportions", refused: true, code: "invalid_geometry", message: "non-finite ratio" };
      }
      if (Array.isArray(reading.value) && !reading.value.every(Number.isFinite)) {
        return { module: "proportions", refused: true, code: "invalid_geometry", message: "non-finite shares" };
      }
    }
    return { module: "proportions", refused: false, report };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 120) : "invalid geometry";
    const code = message.includes("no length") ? "no_face_length" :
      message.includes("no width") ? "no_face_width" : "invalid_geometry";
    return { module: "proportions", refused: true, code, message };
  }
}
