/** Event trial (feature 88): one saved look tried on several photos of the same day, side by side,
 * so she can see it holds up across them before the event.
 *
 * Unlike the photo-wide batch, every step of the look runs here, through the same re-apply path
 * as a single photo (reapply.ts): each photo uses its own face points, read on this device, never
 * another photo's. A photo without face points still gets the steps that need no face, and says
 * which were left out. Provider makeup and hair steps are never sent from here; each is listed as
 * "use the styling screen", where a photo goes only with her consent. The board reports, for
 * every step, on which photos it ran, so an uneven trial is visible rather than hidden.
 * Author: John Khan.
 */
import type { ByteImage } from "../engines/core/buffer.js";
import type { PhotoSource } from "../ui/shell/types.js";
import { type LookRecipe, TOOLS, latest } from "./recipe.js";
import { reapply } from "./reapply.js";

export const MIN_PHOTOS = 2;
export const MAX_PHOTOS = 12;   // ASSUMED: a day's shortlist, small enough to compare at a glance

export class EventTrialError extends RangeError {
  constructor(readonly code: "too_few_photos" | "too_many_photos" | "nothing_local", message: string) { super(message); }
}

export interface EventPhoto { id: string; label: string; source: PhotoSource }
export interface EventRow {
  id: string; label: string; before: ByteImage; after: ByteImage;
  applied: string[]; skipped: { tool: string; reason: string }[];
  face: "this-photo" | "saved-for-this-photo" | "none";
}
export interface StepCoverage { tool: string; label: string; ranOn: number; of: number; provider: boolean }
export interface EventTrial { look: string; version: number; rows: EventRow[]; coverage: StepCoverage[]; even: boolean; summary: string; label: string }

export const TRIAL_LABEL = "Event trial: local simulations of one look on each photo. Not a prediction of the day.";

export function runEventTrial(look: LookRecipe, photos: readonly EventPhoto[], options: { version?: number } = {}): EventTrial {
  if (photos.length < MIN_PHOTOS) throw new EventTrialError("too_few_photos", `Choose at least ${MIN_PHOTOS} photos to compare.`);
  if (photos.length > MAX_PHOTOS) throw new EventTrialError("too_many_photos", `Compare at most ${MAX_PHOTOS} photos at a time.`);
  const steps = (options.version === undefined ? latest(look) : look.versions.find((v) => v.version === options.version) ?? latest(look)).steps;
  if (!steps.some((s) => s.provider === "local")) throw new EventTrialError("nothing_local", "This look has only styling-screen steps; open them there, one consented photo at a time.");
  const rows: EventRow[] = photos.map((p) => {
    const out = reapply(look, p.source, { version: options.version });
    return { id: p.id, label: p.label, before: p.source.image,
      after: { width: out.photo.width, height: out.photo.height, channels: out.photo.channels, data: Uint8Array.from(out.photo.data) },
      applied: out.applied, face: out.face,
      skipped: out.skipped.map((s) => ({ tool: s.tool, reason: TOOLS[s.tool]?.provider === "youcam"
        ? `${TOOLS[s.tool].label}: use the styling screen for this photo; nothing is sent from the event trial.` : s.reason })) };
  });
  const coverage = steps.map((s) => ({ tool: s.tool, label: TOOLS[s.tool]?.label ?? s.tool,
    ranOn: rows.filter((r) => r.applied.includes(s.tool)).length, of: rows.length, provider: s.provider === "youcam" }));
  const local = coverage.filter((c) => !c.provider);
  const even = local.every((c) => c.ranOn === c.of);
  const uneven = local.filter((c) => c.ranOn !== c.of).map((c) => `${c.label} ran on ${c.ranOn} of ${c.of}`);
  const summary = even ? `Every local step of ${look.name} ran on all ${rows.length} photos.`
    : `${look.name} is uneven across these photos: ${uneven.join("; ")}. Each photo says why.`;
  return { look: look.name, version: options.version ?? latest(look).version, rows, coverage, even, summary, label: TRIAL_LABEL };
}
