/** One-tap export sizes (feature 94): the edited photo as a square post, a portrait post, a story,
 * a wide frame, a long-edge web size or its own size, in one tap each.
 *
 * - Shape first: the photo is cropped to the preset's shape (never squashed). The crop keeps her
 *   whole face when the photo has face points, else it is centred; if the face can't fit in that
 *   shape the preset is refused with a code instead of cutting it.
 * - Size honestly: the editor works on a device-sized copy (at most 640 px a side), so a preset
 *   larger than that is enlarged by the classical resampler, at most 2x (ASSUMED). Past that the
 *   file keeps the preset's shape at 2x and says its real size; the HD export (Quality Generator)
 *   is the path for a full 1080 frame.
 * - No watermark, for anyone, free or paid: the only mark is the Simulation label, which follows
 *   her Trust Centre switch and appears only when an edit is a simulation. Metadata is stripped.
 * Author: John Khan.
 */
import type { ByteImage } from "../engines/core/buffer.js";
import type { Point2 } from "../engines/warp/field.js";
import { cpuResize } from "../engines/upscale/quality-generator.js";
import { type CanvasEncoder, type ExportedFile, exportPhoto, lookSlug } from "./export.js";

export const MAX_ENLARGE = 2;          // ASSUMED: beyond 2x a classical resize only looks soft
export const FACE_MARGIN = 0.12;       // share of the face box kept around it in a crop; ASSUMED

export interface SizePreset { id: string; label: string; width: number; height: number | null; note: string }
/** `height: null` means "keep the photo's shape, fit the long edge to `width`"; width 0 means "as it is". */
export const PRESETS: readonly SizePreset[] = [
  { id: "square", label: "Square post", width: 1080, height: 1080, note: "1:1" },
  { id: "portrait", label: "Portrait post", width: 1080, height: 1350, note: "4:5" },
  { id: "story", label: "Story", width: 1080, height: 1920, note: "9:16" },
  { id: "wide", label: "Wide", width: 1920, height: 1080, note: "16:9" },
  { id: "web", label: "Long edge 1600", width: 1600, height: null, note: "photo's own shape" },
  { id: "original", label: "As edited", width: 0, height: null, note: "the editor's own size" },
];

export class SizeRefused extends RangeError {
  constructor(readonly code: "unknown_preset" | "face_would_be_cut" | "bad_photo", message: string) { super(message); }
}

export interface SizePlan {
  preset: string;
  crop: { x: number; y: number; width: number; height: number };
  width: number;
  height: number;
  /** Output pixels per source pixel; above 1 means enlarged. */
  scale: number;
  /** True when the preset's own size needed more than MAX_ENLARGE and the file is smaller. */
  reduced: boolean;
  faceKept: boolean | null;
  note: string;
}

export function preset(id: string): SizePreset {
  const found = PRESETS.find((p) => p.id === id);
  if (!found) throw new SizeRefused("unknown_preset", "That export size isn't in this app.");
  return found;
}

function faceBox(face: readonly Point2[] | null | undefined, w: number, h: number): { x0: number; y0: number; x1: number; y1: number } | null {
  if (!face || face.length < 468) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of face) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const mx = (x1 - x0) * FACE_MARGIN, my = (y1 - y0) * FACE_MARGIN;
  return { x0: Math.max(0, x0 - mx), y0: Math.max(0, y0 - my), x1: Math.min(w, x1 + mx), y1: Math.min(h, y1 + my) };
}

/** Where to crop and how big the file will be, before any pixel is touched. */
export function planSize(width: number, height: number, presetId: string, face?: readonly Point2[] | null): SizePlan {
  if (!(Number.isInteger(width) && Number.isInteger(height) && width >= 8 && height >= 8)) throw new SizeRefused("bad_photo", "The photo has no usable size.");
  const p = preset(presetId);
  const box = faceBox(face, width, height);
  if (p.width === 0 || p.height === null) {
    const long = Math.max(width, height);
    const wanted = p.width === 0 ? 1 : p.width / long;
    const scale = Math.min(wanted, MAX_ENLARGE);
    return { preset: p.id, crop: { x: 0, y: 0, width, height }, width: Math.round(width * scale), height: Math.round(height * scale),
      scale, reduced: scale < wanted, faceKept: box ? true : null, note: p.width === 0 ? "Exported at the editor's own size." : "" };
  }
  const aspect = p.width / p.height;
  let cw = width, ch = Math.round(width / aspect);
  if (ch > height) { ch = height; cw = Math.round(height * aspect); }
  const cx = box ? (box.x0 + box.x1) / 2 : width / 2, cy = box ? (box.y0 + box.y1) / 2 : height / 2;
  const x = Math.round(Math.min(width - cw, Math.max(0, cx - cw / 2)));
  const y = Math.round(Math.min(height - ch, Math.max(0, cy - ch / 2)));
  let faceKept: boolean | null = null;
  if (box) {
    faceKept = box.x0 >= x - 0.5 && box.x1 <= x + cw + 0.5 && box.y0 >= y - 0.5 && box.y1 <= y + ch + 0.5;
    if (!faceKept) throw new SizeRefused("face_would_be_cut", `${p.label} would cut your face in this photo. Try a taller or wider size.`);
  }
  const wanted = p.width / cw;
  const scale = Math.min(wanted, MAX_ENLARGE);
  const reduced = scale < wanted;
  const outW = reduced ? Math.round(cw * scale) : p.width, outH = reduced ? Math.round(ch * scale) : p.height;
  return { preset: p.id, crop: { x, y, width: cw, height: ch }, width: outW, height: outH, scale, reduced, faceKept,
    note: reduced ? `Saved at ${outW} x ${outH}: the photo in the editor is too small for ${p.width} x ${p.height} without blurring. Use HD export for the full size.` : "" };
}

/** The cropped and resized pixels (RGBA), alpha carried through. */
export function renderSize(image: ByteImage, plan: SizePlan): { width: number; height: number; data: Uint8ClampedArray } {
  if (image.channels !== 3 && image.channels !== 4) throw new SizeRefused("bad_photo", "Export needs an RGB or RGBA photo.");
  const { x, y, width: cw, height: ch } = plan.crop;
  const crop = new Uint8ClampedArray(cw * ch * 4);
  for (let r = 0; r < ch; r++) for (let c = 0; c < cw; c++) {
    const from = ((y + r) * image.width + x + c) * image.channels, to = (r * cw + c) * 4;
    crop[to] = image.data[from]; crop[to + 1] = image.data[from + 1]; crop[to + 2] = image.data[from + 2];
    crop[to + 3] = image.channels === 4 ? image.data[from + 3] : 255;
  }
  if (cw === plan.width && ch === plan.height) return { width: cw, height: ch, data: crop };
  return { width: plan.width, height: plan.height, data: cpuResize({ width: cw, height: ch, data: crop }, plan.width, plan.height) };
}

/** One tap: plan, render and encode one preset. */
export async function exportSize(image: ByteImage, presetId: string, encoder: CanvasEncoder,
  options: { lookName: string; face?: readonly Point2[] | null; simulationLabel: boolean; isSimulation: boolean }): Promise<{ file: ExportedFile; plan: SizePlan }> {
  const plan = planSize(image.width, image.height, presetId, options.face);
  const pixels = renderSize(image, plan);
  const file = await exportPhoto(pixels, encoder, { lookName: options.lookName, index: 1,
    simulationLabel: options.simulationLabel, isSimulation: options.isSimulation });
  return { file: { ...file, name: file.name.replace(/_01\.jpg$/, `_${lookSlug(preset(presetId).label)}_${plan.width}x${plan.height}.jpg`) }, plan };
}
