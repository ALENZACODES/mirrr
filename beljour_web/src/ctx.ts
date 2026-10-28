/** App wide state shared by the screens. */
import type { BodyEstimate } from "./body/measure.js";
import type { PoseReading } from "./body/pose.js";
import type { FaceReading } from "./face/landmarks.js";
import type { Photo, ShadeResult } from "./types.js";
import type { ShadeResult as LocalShadeResult } from "./engines/shade/finder.js";

export type Route = "photo" | "skin" | "shade" | "palettes" | "hair" | "tryon" | "proportions" | "previews" | "body" | "reel" | "video" | "privacy";

export const STEPS: { route: Route; label: string }[] = [
  { route: "photo", label: "Photo" },
  { route: "skin", label: "Skin" },
  { route: "shade", label: "Shade" },
  { route: "palettes", label: "Palettes" },
  { route: "hair", label: "Hair" },
  { route: "tryon", label: "Makeup" },
  { route: "proportions", label: "Proportions" },
  { route: "previews", label: "Previews" },
  { route: "body", label: "Body" },
  { route: "reel", label: "Reel" },
  { route: "video", label: "Video" },
];

/** A full length or waist up photo for outfits and body numbers, separate from the face photo. */
export interface BodyPhoto {
  /** null until it's uploaded, which only happens for an outfit try on */
  photo: Photo | null;
  blob: Blob | null;
  src: string;
  pose: PoseReading | null;
  estimate: BodyEstimate | null;
  heightCm: number | null;
}

export interface Ctx {
  consent: boolean;
  photo: Photo | null;
  photoSrc: string | null;
  /** Metadata-free normalized pixels encoded as JPEG, in memory only. The app
   * owns this preview URL across routes and releases it on replace/delete/unload. */
  localPhoto?: { blob: Blob; src: string; synthetic: boolean; release(): void } | null;
  face: FaceReading | null;
  size: { w: number; h: number } | null;
  shade: ShadeResult | null;
  /** Current-photo W6 reading, held in this tab only and cleared on a new photo. */
  localShade?: LocalShadeResult | null;
  tryon: { foundation_id?: string; lip_id?: string; blush_id?: string };
  faceShape: string | null;
  body: BodyPhoto | null;
  go(route: Route): void;
  refreshPhotoPanel(): void;
}

export function releaseLocalPhoto(ctx: Ctx): void {
  ctx.localPhoto?.release(); ctx.localPhoto = null;
}

/** Shared by routing and navigation labels. Local screens need local pixels;
 * provider screens need the separately prepared server photo. */
export function routeReady(ctx: Pick<Ctx, "photo" | "photoSrc" | "consent">, route: Route): boolean {
  if (["photo", "privacy", "palettes"].includes(route)) return true;
  if (["body", "reel", "video"].includes(route)) return ctx.consent;
  if (["skin", "shade", "proportions", "previews"].includes(route)) return !!ctx.photoSrc;
  return ctx.consent && !!ctx.photo;
}

export function requirePhoto(ctx: Ctx): boolean {
  if (ctx.photo) return true;
  ctx.go("photo");
  return false;
}

/** Landmarks as [[x, y], ...] for the server. */
export function landmarkArray(ctx: Ctx): number[][] | undefined {
  return ctx.face ? ctx.face.points.map((p) => [p.x, p.y]) : undefined;
}
