/** Blink rescue: open eyes taken from a second photo of the same person, seam-blended.
 *
 * Both photos need their own 478 face points. Each eye that reads closed in this photo (lid
 * opening under the editor's closed-eye ratio) takes the eye area of the other photo, where that
 * eye must read open. The area is the eye outline grown around its centre (`EYE_GROWTH`) minus
 * the brow, so brows keep their own pixels. Alignment uses landmarks that do not move with a
 * blink: both eye corners, both brows, the nose bridge and tip (region-transfer.ts). She
 * confirms both photos are of her; nothing here recognises or compares identities. The rest
 * of the photo keeps its exact bytes. A photo edit from two of her photos, labelled as such.
 * Author: John Khan.
 */
import type { ByteImage, Mask } from "../engines/core/buffer.js";
import { polygon } from "../engines/core/mask.js";
import type { Point2 } from "../engines/warp/field.js";
import { CONTOURS, IRISES } from "../data/regions/generated/topology.js";
import { EYE_CLOSED_RATIO, EYE_LIDS } from "../data/regions/index.js";
import { LANDMARKS as L } from "../data/face/generated/anatomy.js";
import { fitSimilarity, inverse, mapPoint, transferRegion, type Similarity } from "./region-transfer.js";

export const BLINK_VERSION = "beljour-blink-rescue/1";
export const EYE_GROWTH = 1.7;    // eye area = outline scaled about its centre; ASSUMED
export const FEATHER = 0.18;      // seam feather as a share of the eye width; ASSUMED
export const LABEL = "Edited from two of your photos: the eyes come from your other photo.";
export const ANCHORS: readonly number[] = [L.right_eye_outer, L.right_eye_inner, L.left_eye_inner, L.left_eye_outer,
  ...CONTOURS.right_brow, ...CONTOURS.left_brow, L.nasion, L.nose_tip, L.subnasale];
type Side = "right" | "left";

export type BlinkCode = "not_confirmed" | "invalid_points" | "eyes_already_open" | "donor_eyes_closed";
export const BLINK_REFUSALS: Record<BlinkCode, string> = {
  not_confirmed: "Confirm that both photos are of you before taking the eyes from one into the other.",
  invalid_points: "Both photos need their own full set of 478 face points.",
  eyes_already_open: "The eyes in this photo are already open, so there is nothing to rescue.",
  donor_eyes_closed: "The eyes in the other photo are closed too. Choose a photo with open eyes.",
};
export class BlinkError extends RangeError {
  constructor(readonly code: BlinkCode) { super(BLINK_REFUSALS[code]); this.name = "BlinkError"; }
}

export function eyeOpening(points: readonly Point2[], side: Side): number {
  const [a, b, c, d] = EYE_LIDS[side].map((i) => points[i]);
  const width = Math.hypot(d[0] - c[0], d[1] - c[1]);
  return width > 1e-9 ? Math.hypot(b[0] - a[0], b[1] - a[1]) / width : 0;
}
const closed = (points: readonly Point2[], side: Side): boolean => eyeOpening(points, side) < EYE_CLOSED_RATIO;
const valid = (points: readonly Point2[] | null | undefined): points is readonly Point2[] =>
  Array.isArray(points) && points.length === 478 && points.every((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));

function grownEye(points: readonly Point2[], side: Side, width: number, height: number): Mask {
  const ids = CONTOURS[`${side}_eye`], cx = ids.reduce((s, i) => s + points[i][0], 0) / ids.length, cy = ids.reduce((s, i) => s + points[i][1], 0) / ids.length;
  return polygon(width, height, ids.map((i) => [cx + (points[i][0] - cx) * EYE_GROWTH, cy + (points[i][1] - cy) * EYE_GROWTH] as const), 2);
}

/** The eye area in this photo: the closed outline and, when given, the open outline brought in
 * from the other photo, each grown about its centre, minus this photo's brow. */
export function eyeArea(points: readonly Point2[], side: Side, width: number, height: number, openOutline?: readonly Point2[]): Mask {
  const area = grownEye(points, side, width, height);
  if (openOutline) { const open = grownEye(openOutline, side, width, height); for (let i = 0; i < area.data.length; i++) area.data[i] = Math.max(area.data[i], open.data[i]); }
  const brow = polygon(width, height, CONTOURS[`${side}_brow`].map((i) => [points[i][0], points[i][1]] as const), 2);
  for (let i = 0; i < area.data.length; i++) if (brow.data[i] > 0) area.data[i] = 0;
  return area;
}

export interface BlinkResult { image: ByteImage; eyes: Side[]; points: Point2[]; changed: number; fit: Similarity; labels: string[] }

export function rescueBlink(target: ByteImage, targetPoints: readonly Point2[] | null, donor: ByteImage,
  donorPoints: readonly Point2[] | null, { samePerson = false, eyes }: { samePerson?: boolean; eyes?: Side[] } = {}): BlinkResult {
  if (samePerson !== true) throw new BlinkError("not_confirmed");
  if (!valid(targetPoints) || !valid(donorPoints)) throw new BlinkError("invalid_points");
  const chosen = eyes ?? (["right", "left"] as Side[]).filter((side) => closed(targetPoints, side));
  if (!chosen.length) throw new BlinkError("eyes_already_open");
  if (chosen.some((side) => closed(donorPoints, side))) throw new BlinkError("donor_eyes_closed");
  const iod = Math.hypot(targetPoints[L.left_pupil][0] - targetPoints[L.right_pupil][0], targetPoints[L.left_pupil][1] - targetPoints[L.right_pupil][1]);
  // The donor's open eyes, brought into this photo's frame, define the area and the new eye points.
  const fit = fitSimilarity(ANCHORS.map((i) => targetPoints[i]), ANCHORS.map((i) => donorPoints[i]));
  const back = inverse(fit), mapped = donorPoints.map((p) => mapPoint(back, p));
  let image = target, changed = 0;
  for (const side of chosen) {
    const [, , outer, inner] = EYE_LIDS[side];
    const eyeWidth = Math.hypot(targetPoints[outer][0] - targetPoints[inner][0], targetPoints[outer][1] - targetPoints[inner][1]);
    const result = transferRegion(image, targetPoints, donor, donorPoints, eyeArea(targetPoints, side, target.width, target.height, mapped),
      ANCHORS, iod, FEATHER * eyeWidth);
    image = result.image; changed += result.changed;
  }
  const points = targetPoints.map(([x, y]) => [x, y] as Point2);
  for (const side of chosen) {
    const iris = IRISES[`${side}_iris`];
    for (const i of [...CONTOURS[`${side}_eye`], iris[0], ...iris[1]]) points[i] = mapped[i];
  }
  return { image, eyes: chosen, points, changed, fit, labels: [LABEL] };
}
