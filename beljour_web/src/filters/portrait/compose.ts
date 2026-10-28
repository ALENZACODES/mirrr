/**
 * Render one named portrait look on one photo in the browser, the twin of
 * api/plumb_api/filters/portrait/compose.py:
 *
 *   polish   texture-preserving smooth inside the skin, marks held (polish.ts)
 *   define   structure on eyes, brows and lips, irises cut out (polish.ts)
 *   grade    the look's recipe through the filter engine, skin guard and hue lock on
 *   irises   put back from the original photo, so eye colour never changes
 *   sparkle  the evening look's procedural glints (sparkle.ts)
 *   check    identity guard: marks kept, irises kept, skin not lightened
 *
 * One 0-100 slider moves every part. Strength 0 returns the photo unchanged, alpha included.
 * Without the photo's own 478 face points the look is refused with a code; it never runs on a
 * guessed face. If marks would be lost the polish backs off (half, then a quarter); if they
 * still would, or the skin would lighten, the look is refused and the photo is unchanged.
 * Thresholds are ASSUMED until the arena sets them on real faces.
 * Author: John Khan.
 */
import type { Mask } from "../../engines/core/buffer.js";
import { regionMask } from "../../data/regions/index.js";
import { type Mark, findMarks, retention } from "../../layout/still-you.js";
import { srgbToLab } from "../colour/space.js";
import { type FilterMasks, fromLandmarks, keepOriginal, maskCentre } from "../masks/blend.js";
import { MARKS_KEPT } from "../qa/still-her.js";
import { render as renderFilter } from "../runtime/engine.js";
import { type Look, portraitLook } from "./looks.js";
import * as P from "./polish.js";
import * as SP from "./sparkle.js";

export const LABEL = "Portrait look: a local simulation of skin polish, feature definition and colour. " +
  "Not a prediction and not medical advice.";
export const LIFT_LIMIT = 1;   // mean skin L* rise allowed, the guard's LIFT_OVER_GREY; ASSUMED
export const POLISH_STEPS: readonly number[] = [1, 0.5, 0.25];
export const MIN_SIDE = 16;
export const MESH_POINTS = 478;
export const REFUSALS = ["bad_photo", "no_face_points", "unknown_look", "bad_strength", "marks_not_kept", "skin_lightened"] as const;
export type RefusalCode = typeof REFUSALS[number];

export class PortraitRefused extends Error {
  constructor(readonly code: RefusalCode, message: string) { super(message); }
}

export interface Photo { width: number; height: number; channels: number; data: Uint8Array | Uint8ClampedArray }
type Points = readonly (readonly number[])[];

export interface FaceMasks {
  skin: Mask; person: Mask; features: P.Features; marks: Mark[]; protect: Float64Array;
  sparkle: Float64Array; iod: number; centre: [number, number] | null;
}
export interface Identity { marksFound: number; marksKept: number; irisKept: number; skinLift: number; polishUsed: number; passed: boolean }
export interface PortraitResult {
  image: Photo; look: string; name: string; strength: number; status: "identity" | "applied" | "refused";
  code: "" | RefusalCode; label: string; identity: Identity | null; glints: number; notes: string[];
}

export function faceMasks(rgb: Uint8Array, width: number, height: number, points: Points): FaceMasks {
  const pts = points.map((p) => [p[0], p[1]] as [number, number]);
  const region = (name: "eyes" | "brows" | "lips" | "irises") => regionMask(name, pts, width, height, { normalized: false, supersample: 2 });
  const fm = fromLandmarks(pts, width, height);
  if (!fm.skin || !fm.person) throw new PortraitRefused("no_face_points", "These face points give no skin outline.");
  const dx = pts[473][0] - pts[468][0], dy = pts[473][1] - pts[468][1];
  const iod = Math.sqrt(dx * dx + dy * dy);
  const marks = findMarks({ width, height, channels: 3, data: rgb }, fm.skin, iod);
  return { skin: fm.skin, person: fm.person,
    features: { eyes: region("eyes"), brows: region("brows"), lips: region("lips"), irises: region("irises") },
    marks, protect: P.markMask(marks, width, height), sparkle: SP.region(pts, fm.skin.data, width, height, iod),
    iod, centre: maskCentre(fm.person) };
}

export function skinLightness(rgb: Uint8Array, skin: Mask): number {
  const lab: [number, number, number] = [0, 0, 0];
  let sum = 0, n = 0;
  for (let p = 0; p < skin.data.length; p++) {
    if (!(skin.data[p] >= 0.5)) continue;
    srgbToLab(rgb[p * 3] / 255, rgb[p * 3 + 1] / 255, rgb[p * 3 + 2] / 255, lab);
    sum += lab[0]; n++;
  }
  return n ? sum / n : 0;
}

function validate(image: Photo, points: Points | null | undefined, lookId: string, strength: number): Look {
  const { width, height, channels } = image;
  if (!(Number.isInteger(width) && Number.isInteger(height) && Math.min(width, height) >= MIN_SIDE &&
    (channels === 3 || channels === 4) && image.data.length === width * height * channels)) {
    throw new PortraitRefused("bad_photo", `A portrait look needs an RGB or RGBA photo at least ${MIN_SIDE} pixels a side.`);
  }
  if (!points || points.length !== MESH_POINTS || !points.every((p) => p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]))) {
    throw new PortraitRefused("no_face_points", "A portrait look needs the 478 face points of this photo, read on this device.");
  }
  const look = portraitLook(lookId);
  if (!look) throw new PortraitRefused("unknown_look", `There is no portrait look ${JSON.stringify(lookId)}.`);
  if (!(Number.isFinite(strength) && strength >= 0 && strength <= 100)) throw new PortraitRefused("bad_strength", "Strength is 0 to 100.");
  return look;
}

function rgbOf(image: Photo): Uint8Array {
  if (image.channels === 3) return Uint8Array.from(image.data);
  const out = new Uint8Array(image.width * image.height * 3);
  for (let p = 0; p < image.width * image.height; p++) for (let c = 0; c < 3; c++) out[p * 3 + c] = image.data[p * 4 + c];
  return out;
}

function steps(rgb: Uint8Array, width: number, height: number, fm: FaceMasks, look: Look, strength: number,
  polishScale: number): { before: Uint8Array; final: Uint8Array; glints: number } {
  const s = strength / 100;
  let x = P.polish(rgb, width, height, fm.skin, fm.protect, fm.iod, look.polish * s * polishScale);
  const e = look.emphasis;
  x = P.define(x, width, height, P.featureMask(fm.features, fm.iod, e.eyes, e.brows, e.lips), s);
  const masks: FilterMasks = { skin: fm.skin, person: fm.person, source: "landmarks", note: "" };
  const graded = renderFilter({ width, height, channels: 3, data: x }, look.recipe, { strength }, masks, fm.centre).image.data;
  const before = keepOriginal(rgb, graded, Float64Array.from(fm.features.irises.data));
  if (!look.sparkle) return { before, final: before, glints: 0 };
  const sparkled = SP.render(before, width, height, fm.sparkle, fm.iod, look.sparkle, s);
  return { before, final: sparkled.image, glints: sparkled.glints.count };
}

function identity(rgb: Uint8Array, before: Uint8Array, final: Uint8Array, width: number, height: number,
  fm: FaceMasks, used: number): Identity {
  const kept = retention(fm.marks, { width, height, channels: 3, data: final }, fm.iod);
  let iris = 0, same = 0;
  for (let p = 0; p < width * height; p++) {
    if (!(fm.features.irises.data[p] >= 1)) continue;
    iris++;
    if (final[p * 3] === rgb[p * 3] && final[p * 3 + 1] === rgb[p * 3 + 1] && final[p * 3 + 2] === rgb[p * 3 + 2]) same++;
  }
  const lift = skinLightness(before, fm.skin) - skinLightness(rgb, fm.skin);
  const marksOk = kept.found === 0 || kept.kept / kept.found >= MARKS_KEPT;
  const irisKept = iris ? same / iris : 1;
  return { marksFound: kept.found, marksKept: kept.kept, irisKept, skinLift: lift, polishUsed: used,
    passed: marksOk && lift <= LIFT_LIMIT && irisKept === 1 };
}

export function renderPortrait(image: Photo, points: Points | null | undefined, lookId: string, strength = 30): PortraitResult {
  const look = validate(image, points, lookId, strength);
  const base = { look: look.id, name: look.name, strength, label: LABEL };
  if (strength === 0) {
    return { ...base, image: { ...image, data: Uint8Array.from(image.data) }, status: "identity", code: "", identity: null, glints: 0, notes: [] };
  }
  const { width, height } = image;
  const rgb = rgbOf(image);
  const fm = faceMasks(rgb, width, height, points!);
  const notes: string[] = [];
  let check: Identity | null = null, result = { before: rgb, final: rgb, glints: 0 };
  for (let step = 0; step < POLISH_STEPS.length; step++) {
    result = steps(rgb, width, height, fm, look, strength, POLISH_STEPS[step]);
    check = identity(rgb, result.before, result.final, width, height, fm, look.polish * strength / 100 * POLISH_STEPS[step]);
    if (check.passed || check.skinLift > LIFT_LIMIT || step + 1 === POLISH_STEPS.length) break;
    notes.push(`Polish eased to ${POLISH_STEPS[step + 1].toFixed(2)} of the look to keep your marks.`);
  }
  if (!check!.passed) {
    return { ...base, image: { ...image, data: Uint8Array.from(image.data) }, status: "refused",
      code: check!.skinLift > LIFT_LIMIT ? "skin_lightened" : "marks_not_kept", identity: check, glints: 0,
      notes: [...notes, "The look was not applied: it would have changed what makes this photo you."] };
  }
  const data = Uint8Array.from(image.data);
  for (let p = 0; p < width * height; p++) for (let c = 0; c < 3; c++) data[p * image.channels + c] = result.final[p * 3 + c];
  return { ...base, image: { width, height, channels: image.channels, data }, status: "applied", code: "",
    identity: check, glints: result.glints, notes };
}
