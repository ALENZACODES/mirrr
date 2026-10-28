/** Best selfie picker: rank several photos by the photo pre-check (sharpness, light, framing
 * and the rest of precheck.ts) plus eyes open, measured from face points, and say why.
 *
 * The order is a fixed, explainable sequence, never a beauty or attractiveness score:
 *   1. usable (no check blocks it), 2. eyes (both open, not checked, one closed, both closed),
 *   3. fewer checks to look at, 4. sharper (lower re-blur estimate), 5. light nearer the
 *   middle, 6. the order she added them.
 * Eyes are read from the lid landmarks with the editor's own closed-eye ratio
 * (data/regions EYE_LIDS, EYE_CLOSED_RATIO). Without face points eyes and framing are "not
 * checked" and the result says so; no face is guessed. It does not check that the photos show
 * the same person. Pure and local: same photos give the same order; nothing leaves the device.
 * Author: John Khan.
 */
import type { ByteImage } from "../../engines/core/buffer.js";
import type { Point2 } from "../../engines/warp/field.js";
import { EYE_CLOSED_RATIO, EYE_LIDS } from "../../data/regions/index.js";
import { precheck, type FileFacts, type PrecheckReport } from "./precheck.js";

export const SELFIE_VERSION = "beljour-best-selfie/1";
export const MIN_PHOTOS = 2;
export const MAX_PHOTOS = 12;   // ASSUMED: enough to choose from, small enough to check on a phone
export type EyeState = "open" | "not_checked" | "one_closed" | "closed";
const EYE_ORDER: Record<EyeState, number> = { open: 0, not_checked: 1, one_closed: 2, closed: 3 };
const EYE_WORDS: Record<EyeState, string> = { open: "both eyes open", not_checked: "eyes not checked (no face points)",
  one_closed: "one eye looks closed", closed: "both eyes look closed" };

export interface SelfieInput { id: string; label: string; image: ByteImage; face?: readonly Point2[] | null; file?: FileFacts }
export interface EyeReading { state: EyeState; right: number | null; left: number | null }
export interface SelfieRow {
  id: string; label: string; rank: number; usable: boolean; eyes: EyeReading;
  toLookAt: number; sharpness: number | null; light: number | null; report: PrecheckReport; why: string;
}
export interface SelfieRanking { version: string; rows: SelfieRow[]; best: string | null; summary: string; notes: string[] }

export type SelfieCode = "too_few_photos" | "too_many_photos" | "duplicate_id";
export class SelfieError extends RangeError {
  constructor(readonly code: SelfieCode, message: string) { super(message); this.name = "SelfieError"; }
}

function ratio(face: readonly Point2[], ids: readonly number[]): number {
  const [a, b, c, d] = ids.map((i) => face[i]);
  const width = Math.hypot(d[0] - c[0], d[1] - c[1]);
  return width > 1e-9 ? Math.hypot(b[0] - a[0], b[1] - a[1]) / width : 0;
}

/** Eye opening from the lid landmarks: opening height over eye width, per side. */
export function eyeReading(face: readonly Point2[] | null | undefined): EyeReading {
  if (!face || face.length < 468) return { state: "not_checked", right: null, left: null };
  const right = ratio(face, EYE_LIDS.right), left = ratio(face, EYE_LIDS.left);
  const closed = [right, left].filter((r) => r < EYE_CLOSED_RATIO).length;
  return { state: closed === 0 ? "open" : closed === 1 ? "one_closed" : "closed", right, left };
}

const fixed = (v: number | null, d = 1): string => v === null ? "not measured" : v.toFixed(d);

function compare(a: SelfieRow, b: SelfieRow, order: Map<string, number>): number {
  return Number(b.usable) - Number(a.usable) || EYE_ORDER[a.eyes.state] - EYE_ORDER[b.eyes.state]
    || a.toLookAt - b.toLookAt || (a.sharpness ?? Infinity) - (b.sharpness ?? Infinity)
    || (a.light ?? Infinity) - (b.light ?? Infinity) || order.get(a.id)! - order.get(b.id)!;
}

/** The first rule that puts `row` below `best`, in plain words. */
function below(row: SelfieRow, best: SelfieRow): string {
  if (!row.usable) {
    const blocked = row.report.checks.filter((c) => c.level === "block").map((c) => `${c.title}: ${c.message}`);
    return `Not usable: ${blocked.join(" ")}`;
  }
  if (row.eyes.state !== best.eyes.state) return `Ranked below ${best.label}: ${EYE_WORDS[row.eyes.state]}, against ${EYE_WORDS[best.eyes.state]}.`;
  if (row.toLookAt !== best.toLookAt) {
    const warned = row.report.checks.filter((c) => c.level === "warn").map((c) => `${c.title}: ${c.message}`);
    return `Ranked below ${best.label}: ${row.toLookAt} check${row.toLookAt === 1 ? "" : "s"} to look at, against ${best.toLookAt}. ${warned.join(" ")}`;
  }
  if (row.sharpness !== best.sharpness) return `Ranked below ${best.label}: the same checks, but less sharp (blur ${fixed(row.sharpness)} against ${fixed(best.sharpness)}).`;
  if (row.light !== best.light) return `Ranked below ${best.label}: as sharp, but the light is further from the middle (${fixed(row.light)} against ${fixed(best.light)} stops).`;
  return `Level with ${best.label} on every check; ${best.label} was added first.`;
}

/** Rank 2 to 12 photos. Pure: the same photos and points give the same order and reasons. */
export function rankSelfies(inputs: readonly SelfieInput[]): SelfieRanking {
  if (inputs.length < MIN_PHOTOS) throw new SelfieError("too_few_photos", "Add at least two photos to compare.");
  if (inputs.length > MAX_PHOTOS) throw new SelfieError("too_many_photos", `Compare at most ${MAX_PHOTOS} photos at a time.`);
  const order = new Map<string, number>();
  inputs.forEach((input, i) => {
    if (order.has(input.id)) throw new SelfieError("duplicate_id", "Each photo needs its own id.");
    order.set(input.id, i);
  });
  const rows: SelfieRow[] = inputs.map((input) => {
    const face = input.face && input.face.length >= 468 ? input.face : undefined;
    const report = precheck(input.image, { purpose: "local", face, file: input.file });
    const blur = report.measured.blur_sigma, ev = report.measured.ev_offset;
    return { id: input.id, label: input.label, rank: 0, usable: report.verdict !== "blocked", eyes: eyeReading(face),
      toLookAt: report.checks.filter((c) => c.level === "warn").length,
      sharpness: Number.isFinite(blur) ? blur : null, light: Number.isFinite(ev) ? Math.abs(ev) : null, report, why: "" };
  });
  rows.sort((a, b) => compare(a, b, order));
  rows.forEach((row, i) => { row.rank = i + 1; });
  const best = rows[0].usable ? rows[0] : null;
  for (const row of rows) {
    row.why = row === best
      ? `Best pick: ${row.report.checks.length - row.toLookAt} of ${row.report.checks.length} checks passed, ${EYE_WORDS[row.eyes.state]}, blur ${fixed(row.sharpness)}.`
      : best ? below(row, best) : below(row, row);
  }
  const notes = ["Ranks photo quality only. It does not judge looks and does not check that every photo shows the same person."];
  if (rows.some((r) => r.eyes.state === "not_checked")) notes.push("Eyes and framing are checked only on photos with face points.");
  return { version: SELFIE_VERSION, rows, best: best?.id ?? null, notes,
    summary: best ? `${best.label} is the best of ${rows.length} photos.` : "None of these photos can be used. See each photo's reason." };
}
