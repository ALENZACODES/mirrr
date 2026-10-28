/**
 * Consent-first optical teeth preview alongside the unmodified local renderer.
 * A closed/unknown mouth never produces an edit. An explicit verified opening
 * and plausible enamel candidates are required. No AI inference or upload.
 * This is an appearance preview, not a dental treatment claim.
 * Author: John Khan.
 */
import type { LocalPhoto } from "../beauty/effect-core.js";
import { blank, finitePhotograph } from "../beauty/effect-core.js";
import { DEFAULT_LEVEL, checkedLevel, toPercent } from "../../filters/runtime/strength.js";
import { LABEL, whiten } from "./whiten.js";

export type MouthState = "open" | "closed" | "unknown";
export type PreviewState = "preview" | "refused";
export interface TeethPreview {
  image: Uint8ClampedArray;
  alpha: Float64Array;
  status: PreviewState;
  refused: boolean;
  reason: string;
  changed: number;
  level: number;
  caption: string;
}

function refuse(photo: LocalPhoto, level: number, reason: string): TeethPreview {
  const original = blank(photo, reason);
  return { ...original, status: "refused", refused: true, level, caption: LABEL };
}

function validated(photo: LocalPhoto, opening: ArrayLike<number> | null): void {
  if (!Number.isSafeInteger(photo.width) || !Number.isSafeInteger(photo.height)
    || Math.min(photo.width, photo.height) < 8 || photo.channels !== 3
    || photo.data.length !== photo.width * photo.height * 3) {
    throw new RangeError("teeth preview requires RGB at least 8x8");
  }
  finitePhotograph(photo);
  if (opening === null) return;
  if (opening.length !== photo.width * photo.height) throw new RangeError("mouth mask dimensions differ from input");
  for (let i = 0; i < opening.length; i++) {
    if (!Number.isFinite(opening[i]) || opening[i] < 0 || opening[i] > 1) {
      throw new RangeError("mouth opening must be finite 0..1");
    }
  }
}

export function preview(photo: LocalPhoto, opening: ArrayLike<number> | null, state: MouthState = "unknown",
  level = DEFAULT_LEVEL): TeethPreview {
  const value = checkedLevel(level);
  // No mouth evidence is needed for a refusal. Bad/stale masks are ignored
  // until an OPEN mouth is explicitly verified by the caller.
  if (state !== "open" && state !== "closed" && state !== "unknown") throw new RangeError("invalid mouth state");
  if (state === "closed") { validated(photo, null); return refuse(photo, value, "mouth closed: no teeth preview"); }
  if (state !== "open") { validated(photo, null); return refuse(photo, value, "mouth opening not verified"); }
  validated(photo, opening);
  if (opening === null) return refuse(photo, value, "no verified mouth-opening mask");
  let pixels = 0;
  for (let i = 0; i < opening.length; i++) if (opening[i] >= 0.5) pixels++;
  if (pixels < 8) return refuse(photo, value, "no visible open mouth");
  const result = whiten(photo, opening, toPercent(value));
  if (!result.changed) return refuse(photo, value, "no enamel-like pixels inside the opening");
  return { ...result, status: "preview", refused: false, level: value, caption: LABEL };
}
