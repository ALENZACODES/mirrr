/**
 * A4 "Still Her" proxy for filters in the browser (filters-plan.md §5.4), the same rules and
 * thresholds as api/plumb_api/filters/qa/still_her.py, measured on the browser's own render:
 *
 *   lift    mean skin L* rise <= the look's mean rise on mid-grey over the same pixels + 1, and <= 3
 *   chroma  mean skin C*ab keeps >= 85% (mono looks exempt)
 *   hue     chroma-weighted mean hue turn <= 6 degrees (mono looks exempt)
 *   spread  on dark skin (mean L* under 45) the skin's L* spread stays within 70-130%
 *   marks   >= 90% of freckles and moles keep half their contrast (layout/still-you.ts, the
 *           browser port of the arena's marks check)
 *
 * The studio can show the result next to the "Still you" tag; the tests run it on drawn
 * portraits of six skin tones. Thresholds are ASSUMED and owned by the arena.
 * Author: John Khan.
 */
import type { ByteImage, Mask } from "../../engines/core/buffer.js";
import { findMarks, iodOf, retention } from "../../layout/still-you.js";
import { srgbToLab, wrapDegrees, DEG } from "../colour/space.js";
import { greyRise } from "../masks/guard.js";
import type { FilterMasks } from "../masks/blend.js";
import type { Recipe } from "../recipe/schema.js";
import { type Settings, greyPhoto, look, render, wholeFrame } from "../runtime/engine.js";

export const LIFT_OVER_GREY = 1, LIFT_MAX = 3, CHROMA_KEEP = 0.85, HUE_MAX = 6, MARKS_KEPT = 0.9, DARK_L = 45;
export const SPREAD: readonly [number, number] = [0.7, 1.3];

export interface HerReport {
  lift: number; greyLift: number; chromaRatio: number; hueTurn: number; spread: number;
  marksKept: number | null; skinL: number; pixels: number;
}

function labs(data: Uint8Array, skin: Mask): Float64Array[] {
  const s = [0, 0, 0];
  const out: Float64Array[] = [];
  for (let p = 0; p < skin.data.length; p++) {
    if (skin.data[p] < 0.5) continue;
    const i = p * 3;
    srgbToLab(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255, s);
    out.push(Float64Array.of(s[0], s[1], s[2]));
  }
  return out;
}

const mean = (xs: ArrayLike<number>): number => { let t = 0; for (let i = 0; i < xs.length; i++) t += xs[i]; return xs.length ? t / xs.length : 0; };
const std = (xs: number[]): number => { const m = mean(xs); return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))); };

/** Measure one filter on one photo with skin masks (bytes RGB). */
export function measure(recipe: Recipe | string, image: ByteImage, masks: FilterMasks, face: readonly (readonly number[])[] | undefined,
  settings: Settings = {}, faceCentre: readonly [number, number] | null = null): HerReport {
  if (!masks.skin) throw new RangeError("Still Her needs a skin mask");
  const res = render(image, recipe, settings, masks, faceCentre);
  const before = labs(rgb(image), masks.skin);
  const after = labs(res.image.data, masks.skin);
  let grey = 0;
  if (!res.plan.identity) {
    const rise = greyRise(look(greyPhoto(image.width * image.height), image.width, image.height, res.plan, wholeFrame(image.width, image.height, faceCentre)));
    const picked: number[] = [];
    for (let p = 0; p < masks.skin.data.length; p++) if (masks.skin.data[p] >= 0.5) picked.push(rise[p]);
    grey = mean(picked);
  }
  const lift = mean(after.map((a, i) => a[0] - before[i][0]));
  const cb = before.map((c) => Math.hypot(c[1], c[2])), ca = after.map((c) => Math.hypot(c[1], c[2]));
  let tw = 0, tsum = 0;
  before.forEach((b, i) => {
    const w = Math.min(cb[i], ca[i]);
    const turn = wrapDegrees(Math.atan2(after[i][2], after[i][1]) * DEG - Math.atan2(b[2], b[1]) * DEG);
    tw += w; tsum += turn * w;
  });
  const sb = std(before.map((c) => c[0])), sa = std(after.map((c) => c[0]));
  const iod = iodOf(image.width, face as never);
  const marks = findMarks(image, masks.skin, iod);
  const kept = retention(marks, { width: image.width, height: image.height, channels: 3, data: res.image.data }, iod);
  return { lift, greyLift: grey, chromaRatio: mean(cb) > 0 ? mean(ca) / mean(cb) : 1, hueTurn: tw > 0 ? Math.abs(tsum / tw) : 0,
    spread: sb > 0 ? sa / sb : 1, marksKept: kept.found ? kept.kept / kept.found : null, skinL: mean(before.map((c) => c[0])), pixels: before.length };
}

function rgb(image: ByteImage): Uint8Array {
  if (image.channels === 3) return Uint8Array.from(image.data);
  const out = new Uint8Array(image.width * image.height * 3);
  for (let p = 0; p < image.width * image.height; p++) for (let c = 0; c < 3; c++) out[p * 3 + c] = image.data[p * image.channels + c];
  return out;
}

/** Problems with one filter on one face (an empty list is Still Her). */
export function problems(recipe: Recipe, r: HerReport, label = "this face"): string[] {
  const mono = recipe.limits.guardMode === "lightness";
  const where = `${recipe.id} on ${label}`;
  const out: string[] = [];
  if (r.lift > 0 && r.lift > Math.min(r.greyLift + LIFT_OVER_GREY, LIFT_MAX) + 1e-9) out.push(`${where}: skin L* rose ${r.lift.toFixed(2)} (mid-grey ${r.greyLift.toFixed(2)})`);
  if (!mono && r.chromaRatio < CHROMA_KEEP) out.push(`${where}: skin chroma kept ${(100 * r.chromaRatio).toFixed(0)}%`);
  if (!mono && r.hueTurn > HUE_MAX) out.push(`${where}: skin hue turned ${r.hueTurn.toFixed(1)} degrees`);
  if (r.skinL < DARK_L && !(r.spread >= SPREAD[0] && r.spread <= SPREAD[1])) out.push(`${where}: skin L* spread ${(100 * r.spread).toFixed(0)}% of the input`);
  if (r.marksKept !== null && r.marksKept < MARKS_KEPT) out.push(`${where}: kept ${(100 * r.marksKept).toFixed(0)}% of freckles and moles`);
  return out;
}
