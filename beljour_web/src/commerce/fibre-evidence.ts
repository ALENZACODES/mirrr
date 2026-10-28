/** User-facing triage before the local hair-fibre cover preview, with every case counted.
 * Mirrors api/plumb_api/engines/concealer/triage.py: no_mesh, insufficient_hair (fewer
 * than 64 marked hair pixels outside the scalp, ASSUMED), too_dark (median L* below 8,
 * ASSUMED) and low_detail (hair L* standard deviation below 0.25, ASSUMED) are coded
 * not_applicable outcomes that stay in the denominator. Eligible inputs go to the
 * unchanged guarded CoverSession; its refusals stay "refused". Simulation of a topical
 * product, not a diagnosis. No uploads or provider calls. Author: John Khan.
 */
import type { ByteImage, Mask } from "../engines/core/buffer.js";
import { pixelLab } from "../engines/core/colour.js";
import { CoverSession, type CoverOptions, type CoverResult } from "../engines/local/fibre.js";
import { validateAnchors, type HairAnchors } from "../engines/menshair/render.js";

export const MIN_HAIR_PIXELS = 64;
export const DARK_LIGHTNESS = 8;
export const MIN_DETAIL = 0.25;
export type TriageStatus = "eligible" | "not_applicable" | "rendered" | "unchanged" | "refused";
export const STATUSES = ["not_applicable", "rendered", "unchanged", "refused"] as const;

/** Plain guidance shown for each coded outcome. */
export const COPY: Readonly<Record<string, string>> = Object.freeze({
  no_mesh: "We could not find the head outline in this photo, so no preview was made.",
  insufficient_hair: "Mark more of your existing hair so the fibre colour can be read.",
  too_dark: "This photo is too dark to tell hair from scalp. Try brighter, even light.",
  low_detail: "The marked hair shows no strand detail. Try a sharper photo.",
});

export interface TriageOutcome {
  readonly status: TriageStatus;
  readonly code: string | null;
  readonly hair_pixels: number;
  readonly result: CoverResult | null;
}

const outcome = (status: TriageStatus, code: string | null, hair: number, result: CoverResult | null = null):
  TriageOutcome => Object.freeze({ status, code, hair_pixels: hair, result });

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b), n = s.length, mid = n >> 1;
  return n % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** "eligible" or a coded "not_applicable"; never renders. */
export function triageCover(img: ByteImage, region: Mask, scalp: Mask, landmarks: HairAnchors | null): TriageOutcome {
  if (!landmarks) return outcome("not_applicable", "no_mesh", 0);
  try { validateAnchors(landmarks); } catch { return outcome("not_applicable", "no_mesh", 0); }
  const n = img.width * img.height;
  if ((img.channels !== 3 && img.channels !== 4) || img.data.length !== n * img.channels ||
      region.data.length !== n || scalp.data.length !== n) {
    throw new RangeError("Photo and masks must match");
  }
  const regionL: number[] = [], hairL: number[] = [];
  const lab = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    if (!(region.data[i] >= 0.5)) continue;
    const k = i * img.channels;
    pixelLab(img.data[k], img.data[k + 1], img.data[k + 2], lab);
    regionL.push(lab[0]);
    if (!(scalp.data[i] >= 0.5)) hairL.push(lab[0]);
  }
  if (hairL.length < MIN_HAIR_PIXELS) return outcome("not_applicable", "insufficient_hair", hairL.length);
  if (median(regionL) < DARK_LIGHTNESS) return outcome("not_applicable", "too_dark", hairL.length);
  const mean = hairL.reduce((s, v) => s + v, 0) / hairL.length;
  const spread = Math.sqrt(hairL.reduce((s, v) => s + (v - mean) ** 2, 0) / hairL.length);
  if (spread < MIN_DETAIL) return outcome("not_applicable", "low_detail", hairL.length);
  return outcome("eligible", null, hairL.length);
}

/** Triage, then the existing guarded renderer for eligible inputs only. */
export function coverWithTriage(session: CoverSession, img: ByteImage, region: Mask, scalp: Mask,
  options: CoverOptions): TriageOutcome {
  const found = triageCover(img, region, scalp, options.landmarks);
  if (found.status !== "eligible") return found;
  const result = session.render(img, region, scalp, options);
  if (!result.rendered) return outcome("refused", result.code, found.hair_pixels);
  return outcome(result.changedPixels ? "rendered" : "unchanged", null, found.hair_pixels, result);
}

/** Counts by status and code; not_applicable and refused cases stay in the total. */
export function summarizeTriage(outcomes: readonly TriageOutcome[]): Record<string, unknown> {
  if (outcomes.some((o) => o.status === "eligible")) throw new RangeError("Summaries take finished triage outcomes");
  const statuses: Record<string, number> = {}, codes: Record<string, number> = {};
  for (const s of STATUSES) statuses[s] = outcomes.filter((o) => o.status === s).length;
  for (const o of outcomes) if (o.code !== null) codes[o.code] = (codes[o.code] ?? 0) + 1;
  const sorted: Record<string, number> = {};
  for (const key of Object.keys(codes).sort()) sorted[key] = codes[key];
  return { format: "beljour-fibre-triage/1", total: outcomes.length, statuses, codes: sorted,
    kind: "synthetic_or_user_inputs", provider_calls: 0 };
}
