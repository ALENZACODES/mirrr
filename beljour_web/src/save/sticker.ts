/** Sticker and meme pack (feature 90): her photo cut out, outlined, captioned and animated, made
 * on this device.
 *
 * Cut-out: the first mask that exists for this photo, and the sticker says which it used:
 *   person   the on-device person segmentation, when that model is enabled
 *   marked   the person area she marked herself
 *   face     her face outline from the face points (face only; hair and shoulders are left out)
 * With none of these the sticker is refused; nothing is guessed. A full background removal
 * (feature 58) would give a better edge and is not built yet.
 * The sticker is cropped to the cut-out, fitted inside STICKER_SIDE, given a white outline and
 * an optional caption in the system font (no font file is loaded), then animated: still, bounce,
 * wiggle and pulse, a one-second loop each. Files are PNG / animated PNG with transparency; the
 * pack is one zip. When an edit in the photo is a simulation and her Trust Centre switch is on,
 * the caption line says so.
 * Author: John Khan.
 */
import type { ByteImage, Mask } from "../engines/core/buffer.js";
import type { Point2 } from "../engines/warp/field.js";
import { cpuResize } from "../engines/upscale/quality-generator.js";
import { regionMask } from "../data/regions/index.js";
import { encodePng, type RgbaFrame } from "./apng.js";
import { storeZip } from "./export.js";

export const STICKER_SIDE = 320;      // ASSUMED: messaging apps show stickers small
export const LOOP_FRAMES = 12, LOOP_FPS = 12;
export const MOTION_PAD = 0.12;       // room around the sticker so motion never clips; ASSUMED
export const MAX_CAPTION = 40;
export const ANIMATIONS = ["still", "bounce", "wiggle", "pulse"] as const;
export type Animation = typeof ANIMATIONS[number];
export type CutoutFrom = "person" | "marked" | "face";

export class StickerRefused extends RangeError {
  constructor(readonly code: "no_cutout" | "empty_cutout" | "bad_caption" | "bad_photo", message: string) { super(message); }
}

export interface Cutout { mask: Float32Array; width: number; height: number; from: CutoutFrom; note: string }

/** Pick the cut-out: device person mask, then her marked area, then her face outline. */
export function chooseCutout(image: ByteImage, options: { person?: Mask | null; marked?: Mask | null; face?: readonly Point2[] | null }): Cutout {
  const { width, height } = image;
  const fit = (m: Mask): boolean => m.width === width && m.height === height;
  if (options.person && fit(options.person)) return { mask: Float32Array.from(options.person.data), width, height, from: "person", note: "Cut out along your outline, found on this device." };
  if (options.marked && fit(options.marked)) return { mask: Float32Array.from(options.marked.data), width, height, from: "marked", note: "Cut out along the area you marked." };
  if (options.face && options.face.length >= 468) {
    const oval = regionMask("face_oval", options.face, width, height, { normalized: false, supersample: 2 });
    return { mask: Float32Array.from(oval.data), width, height, from: "face", note: "Cut out along your face outline only: hair and shoulders are left out. Mark your outline for a fuller sticker." };
  }
  throw new StickerRefused("no_cutout", "There's no outline to cut out yet. Mark the person area, or read face points on this device.");
}

function bbox(c: Cutout): { x0: number; y0: number; x1: number; y1: number } {
  let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
    if (c.mask[y * c.width + x] < 0.5) continue;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  if (x1 < 0) throw new StickerRefused("empty_cutout", "The outline is empty.");
  return { x0, y0, x1, y1 };
}

/** The cut-out, cropped, fitted inside STICKER_SIDE and outlined in white. Alpha is the mask. */
export function cutSticker(image: ByteImage, cut: Cutout, outline?: number): RgbaFrame {
  if (image.channels !== 3 && image.channels !== 4) throw new StickerRefused("bad_photo", "A sticker needs an RGB or RGBA photo.");
  const b = bbox(cut);
  const cw = b.x1 - b.x0 + 1, ch = b.y1 - b.y0 + 1;
  const crop = new Uint8ClampedArray(cw * ch * 4);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const p = (b.y0 + y) * image.width + b.x0 + x, o = (y * cw + x) * 4, c = image.channels;
    crop[o] = image.data[p * c]; crop[o + 1] = image.data[p * c + 1]; crop[o + 2] = image.data[p * c + 2];
    crop[o + 3] = Math.round(255 * Math.min(1, Math.max(0, cut.mask[p])) * (c === 4 ? image.data[p * 4 + 3] / 255 : 1));
  }
  const r = outline ?? Math.max(2, Math.round(Math.max(cw, ch) / 60));
  const scale = Math.min(1, (STICKER_SIDE - 2 * r) / Math.max(cw, ch));
  const sw = Math.max(1, Math.round(cw * scale)), sh = Math.max(1, Math.round(ch * scale));
  const fitted = scale < 1 ? cpuResize({ width: cw, height: ch, data: crop }, sw, sh) : crop;
  const W = sw + 2 * r, H = sh + 2 * r;
  const out = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < sh; y++) out.set(fitted.subarray(y * sw * 4, (y + 1) * sw * 4), ((y + r) * W + r) * 4);
  // White outline: any transparent pixel within r of a solid one turns white.
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && out[(y * W + x) * 4 + 3] >= 128;
  const ring = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (solid(x, y)) continue;
    search: for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r && solid(x + dx, y + dy)) { ring[y * W + x] = 1; break search; }
    }
  }
  for (let p = 0; p < W * H; p++) if (ring[p]) { const a = out[p * 4 + 3] / 255;
    for (let k = 0; k < 3; k++) out[p * 4 + k] = Math.round(out[p * 4 + k] * a + 255 * (1 - a)); out[p * 4 + 3] = 255; }
  return { width: W, height: H, data: out };
}

export function checkCaption(text: string): string {
  const clean = (text ?? "").trim();
  if (clean.length > MAX_CAPTION || /[\u0000-\u001f\u007f]/.test(clean)) throw new StickerRefused("bad_caption", `A caption is one line of up to ${MAX_CAPTION} characters.`);
  return clean;
}

/** The caption line under the sticker, including the simulation note when it applies. */
export function captionLine(text: string, simulationLabel: boolean, isSimulation: boolean): string {
  const clean = checkCaption(text);
  const note = simulationLabel && isSimulation ? "Simulation" : "";
  return [clean, note].filter(Boolean).join(" · ");
}

/** Stack a caption strip (drawn by the browser in the system font) under the sticker. */
export function withCaption(sticker: RgbaFrame, strip: RgbaFrame | null): RgbaFrame {
  if (!strip) return sticker;
  const W = Math.max(sticker.width, strip.width), H = sticker.height + strip.height;
  const out = new Uint8ClampedArray(W * H * 4);
  const place = (f: RgbaFrame, top: number) => { const left = Math.floor((W - f.width) / 2);
    for (let y = 0; y < f.height; y++) out.set(f.data.subarray(y * f.width * 4, (y + 1) * f.width * 4), ((top + y) * W + left) * 4); };
  place(sticker, 0); place(strip, sticker.height);
  return { width: W, height: H, data: out };
}

/** One loop of an animation: the sticker moved, turned or scaled about its centre on a padded,
 * transparent canvas, sampled bilinearly. "still" is one frame. */
export function animate(sticker: RgbaFrame, kind: Animation): RgbaFrame[] {
  if (kind === "still") return [sticker];
  const pad = Math.round(Math.max(sticker.width, sticker.height) * MOTION_PAD);
  const W = sticker.width + 2 * pad, H = sticker.height + 2 * pad, cx = W / 2, cy = H / 2;
  const frames: RgbaFrame[] = [];
  for (let i = 0; i < LOOP_FRAMES; i++) {
    const phase = (2 * Math.PI * i) / LOOP_FRAMES;
    const dy = kind === "bounce" ? -Math.abs(Math.sin(phase)) * pad * 0.9 : 0;
    const angle = kind === "wiggle" ? (8 * Math.PI / 180) * Math.sin(phase) : 0;
    const scale = kind === "pulse" ? 0.92 + 0.08 * (0.5 + 0.5 * Math.cos(phase)) : 1;
    const cos = Math.cos(-angle) / scale, sin = Math.sin(-angle) / scale;
    const data = new Uint8ClampedArray(W * H * 4);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ux = x + 0.5 - cx, uy = y + 0.5 - cy - dy;
      const sx = cos * ux - sin * uy + sticker.width / 2 - 0.5, sy = sin * ux + cos * uy + sticker.height / 2 - 0.5;
      const x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0;
      const o = (y * W + x) * 4;
      for (let k = 0; k < 4; k++) {
        let v = 0;
        for (const [ox, oy, w] of [[0, 0, (1 - fx) * (1 - fy)], [1, 0, fx * (1 - fy)], [0, 1, (1 - fx) * fy], [1, 1, fx * fy]] as const) {
          const px = x0 + ox, py = y0 + oy;
          if (w > 0 && px >= 0 && py >= 0 && px < sticker.width && py < sticker.height) v += w * sticker.data[(py * sticker.width + px) * 4 + k];
        }
        data[o + k] = Math.round(v);
      }
    }
    frames.push({ width: W, height: H, data });
  }
  return frames;
}

export interface StickerPack { zip: Uint8Array; files: { name: string; bytes: Uint8Array; frames: number }[]; from: CutoutFrom; note: string }

/** Every animation of one sticker as PNG / animated PNG in one zip. */
export function stickerPack(sticker: RgbaFrame, cut: Pick<Cutout, "from" | "note">): StickerPack {
  const files = ANIMATIONS.map((kind) => {
    const frames = animate(sticker, kind);
    return { name: `BELJOUR_Sticker_${kind}.png`, bytes: encodePng(frames, LOOP_FPS), frames: frames.length };
  });
  return { zip: storeZip(files.map((f) => ({ name: `BELJOUR Stickers/${f.name}`, bytes: f.bytes }))), files, from: cut.from, note: cut.note };
}
