/** Card-assisted W6 reading: checked neutral evidence, then the cheek-consensus photo path.
 * Mirrors api/plumb_api/engines/shade/calibrated_photo.py. Only a usable, visitor-confirmed
 * card reaches assessSkinPhoto as the explicit neutral reference. A missing mesh, an
 * invalid mesh or a rejected card never yields a usable shade, and a rejected card does
 * not fall back to a background estimate here. No provider call or model is involved.
 * Author: John Khan.
 */
import type { MeshPoint } from "../../data/regions/index.js";
import type { PhotoInput } from "./finder.js";
import { inspectNeutralCard, neutralPhotoOptions, publicNeutral, type NeutralDecision } from "./neutral-calibration.js";
import { assessSkinPhoto, publicSkinAssessment, type SkinPhotoAssessment } from "./skin-accuracy.js";

export type CalibratedReason = "no_mesh" | "invalid_mesh" | "card_rejected" | "reading_refused" | null;
const NOTES: Record<string, string> = {
  none: "Shade read with a checked neutral card.",
  no_mesh: "No face landmarks were supplied; no shade is read.",
  invalid_mesh: "The face landmarks could not be used; no shade is read.",
  card_rejected: "The neutral card was not usable; no shade is read with it.",
  reading_refused: "The card-corrected reading did not pass the existing shade limits.",
};

export interface CalibratedPhoto {
  usable: boolean;
  reason: CalibratedReason;
  referenceId: string | null;
  neutral: NeutralDecision | null;
  assessment: SkinPhotoAssessment | null;
  note: string;
}

function outcome(reason: CalibratedReason, neutral: NeutralDecision | null = null,
  assessment: SkinPhotoAssessment | null = null): CalibratedPhoto {
  const usable = reason === null;
  return { usable, reason, referenceId: usable ? assessment?.referenceId ?? null : null, neutral, assessment,
    note: NOTES[reason ?? "none"] };
}

/** W6 on one photo using a visitor-confirmed, checked neutral card. */
export function assessCalibratedPhoto(image: PhotoInput, points: readonly MeshPoint[] | null,
  cardMask: ArrayLike<number>, options: { confirmed: boolean }): CalibratedPhoto {
  if (points === null) return outcome("no_mesh");
  const neutral = inspectNeutralCard(image, cardMask, options);
  if (!neutral.usable) return outcome("card_rejected", neutral);
  let found: SkinPhotoAssessment;
  try {
    found = assessSkinPhoto(image, points, neutralPhotoOptions(neutral));
  } catch (error) {
    if (error instanceof RangeError || error instanceof TypeError) return outcome("invalid_mesh", neutral);
    throw error;
  }
  return outcome(found.accepted ? null : "reading_refused", neutral, found);
}

export function publicCalibrated(found: CalibratedPhoto): Record<string, unknown> {
  return {
    format: "beljour-calibrated-photo/1", usable: found.usable, reason: found.reason,
    reference_id: found.referenceId, neutral: found.neutral === null ? null : publicNeutral(found.neutral),
    assessment: found.assessment === null ? null : publicSkinAssessment(found.assessment),
    note: found.note, provider_calls: 0, tested_against_real_products: false,
  };
}
