/** Connects the cleared detector's measured meshes to the opt-in face picker.
 * Unmeshed proposals are never selectable and cannot authorize edits.
 * No pixels, landmarks or coordinates enter the count-only result.
 * OpenCV YuNet / MediaPipe Face Landmarker: concept only, no code copied.
 * Author: John Khan.
 */
import type { Point3 } from "./geometry.js";
import { associated, meshBox, validMesh, type BoxFirstResult } from "./box-first.js";
import { makePicker, type Box, type Pick, type Picker } from "../save/face-picker.js";

export interface DetectedFaces {
  readonly picker: Picker;
  readonly meshIndices: readonly number[];
  select(index: number): Pick;
  tap(x: number, y: number): Pick;
  mesh(choice: Pick): Point3[] | null;
  counts(): { code: string; visibleFaces: number; untouchedFaces: number };
}

export function fromDetection(result: BoxFirstResult, width: number, height: number,
  minConfidence = 0.7): DetectedFaces {
  if (!result || result.detector !== "yunet" || !Array.isArray(result.faces) || !Array.isArray(result.boxes)) {
    throw new RangeError("a box-first detector result is required");
  }
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 2 || height < 2 ||
      width > 16384 || height > 16384) throw new RangeError("invalid source photo dimensions");
  if (!Number.isFinite(minConfidence) || minConfidence < 0 || minConfidence > 1) {
    throw new RangeError("confidence must be a finite fraction");
  }
  const boxes: Box[] = [];
  const observed: Point3[][] = [];
  const indices: number[] = [];
  const claimed = new Set<number>();
  result.faces.forEach((candidate, index) => {
    let mesh: Point3[];
    try { mesh = validMesh(candidate); } catch { return; }
    const extent = meshBox(mesh, width, height);
    if (extent.width < 2 || extent.height < 2 || !Number.isFinite(extent.x) ||
        !Number.isFinite(extent.y)) return;
    let score = 1;
    if (result.boxes.length) {
      const matches = result.boxes.map((box, i) => ({
        i, confidence: box.score, match: claimed.has(i) ? 0 : associated(mesh, box, width, height),
      })).filter(({ confidence, match }) => confidence >= minConfidence && match >= 0.15);
      matches.sort((a, b) => b.match - a.match || a.i - b.i);
      if (!matches.length) return;
      const selected = matches[0];
      score = selected.confidence;
      claimed.add(selected.i);
    }
    boxes.push({ x: extent.x, y: extent.y, width: extent.width, height: extent.height, score });
    observed.push(mesh);
    indices.push(index);
  });
  const picker = makePicker(boxes, width, height, minConfidence);
  return {
    picker, meshIndices: Object.freeze([...indices]),
    select: (index: number) => picker.select(index),
    tap: (x: number, y: number) => picker.tap(x, y),
    mesh: (selection: Pick) => {
      const i = selection.index;
      if (i === null || !Number.isInteger(i) || i < 0 || i >= observed.length ||
          !["selected_primary", "selected_by_user"].includes(selection.code)) return null;
      return observed[i].map((p) => ({ ...p }));
    },
    counts: () => ({ code: picker.primary.code, visibleFaces: picker.primary.visibleFaces,
      untouchedFaces: picker.primary.untouchedFaces }),
  };
}
