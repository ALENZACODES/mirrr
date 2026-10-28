/** Drawn fixtures for the r27e body studio: a figure, outlines from its own masks and a decoder.
 * No photographs or faces; every image is drawn by the engine's figure helpers.
 * Author: John Khan. */
import { frontFigure, sideFigure } from "../dist/js/engines/local/figures.js";

function box(mask, keep) {
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      if (mask.data[y * mask.width + x] < 0.5 || !keep(x, y)) continue;
      left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
    }
  }
  return [[left, top], [right + 1, top], [right + 1, bottom + 1], [left, bottom + 1]];
}

/** RGBA pixels, a person outline, a head outline and the six control points of the view. */
export function drawnPhoto(view = "side", size = {}) {
  const figure = view === "front" ? frontFigure({ lean: 4, shoulderDrop: 2, ...size })
    : sideFigure({ headForward: 8, roundShoulder: 10, slouch: 6, sway: 4, ...size });
  const { width, height } = figure.image;
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba.set(figure.image.data.subarray(i * 3, i * 3 + 3), i * 4);
    rgba[i * 4 + 3] = 255;
  }
  const points = figure.controls.points;
  const top = view === "front" ? Math.min(points.right_shoulder[1], points.left_shoulder[1]) : points.neck_base[1];
  const person = box(figure.person, () => true);
  const head = box(figure.person, (_x, y) => y < Math.floor(top - 2));
  const facing = view === "front" ? 0 : figure.controls.facing;
  const pixels = { width, height, channels: 4, data: rgba };
  return { view, facing, width, height, pixels, person, head, points: { ...points },
    digest: "e".repeat(63) + (view === "front" ? "1" : "2") };
}

/** Drive an intake through every required marking and accept it. */
export function annotate(intake, photo) {
  intake.setView(photo.view, photo.facing);
  intake.setPersonOutline(photo.person);
  intake.setHeadOutline(photo.head);
  intake.confirmHead(true);
  for (const [name, point] of Object.entries(photo.points)) intake.setPoint(name, point);
  return intake.accept();
}

/** A local decoder double that returns the drawn pixels for any accepted file. */
export function drawnDecoder(photo) {
  const calls = [];
  const decoder = async (bytes, type) => {
    calls.push({ bytes: bytes.byteLength, type });
    return { width: photo.width, height: photo.height, data: new Uint8ClampedArray(photo.pixels.data) };
  };
  decoder.calls = calls;
  return decoder;
}

export function photoBlob(text = "drawn-photo-bytes", type = "image/png") {
  return new Blob([new TextEncoder().encode(text)], { type });
}

export const jpegEncoder = () => ({ async encode() { return new Uint8Array([255, 216, 255, 218, 0, 2, 0, 7, 255, 217]); } });
