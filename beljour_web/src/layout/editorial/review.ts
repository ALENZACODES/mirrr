/** Bounded preview-only art review metadata. Author: John Khan. */
import { HOUSE_ART_KINDS, houseArt, type HouseArtKind } from "./house-art.js";

export const EDITORIAL_REVIEW_FORMAT = "beljour-editorial-review/1" as const;

export interface ArtworkReviewItem {
  readonly kind: HouseArtKind;
  readonly path: string;
  readonly label: string;
  readonly state: "awaiting-owner-approval";
  readonly source: "original-vector-paths";
  readonly usedForTraining: false;
  readonly released: false;
}

export interface ArtworkReviewManifest {
  readonly format: typeof EDITORIAL_REVIEW_FORMAT;
  readonly items: readonly ArtworkReviewItem[];
  readonly completeCollectionApproved: false;
}

export function artworkReviewManifest(): ArtworkReviewManifest {
  return {
    format: EDITORIAL_REVIEW_FORMAT,
    items: HOUSE_ART_KINDS.map((kind) => ({
      kind,
      path: `web/public/editorial-review/${kind}.svg`,
      label: houseArt(kind).label,
      state: "awaiting-owner-approval",
      source: "original-vector-paths",
      usedForTraining: false,
      released: false,
    })),
    completeCollectionApproved: false,
  };
}

export function validateArtworkManifest(value: unknown): ArtworkReviewManifest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Invalid illustration review manifest");
  }
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== 3
    || record.format !== EDITORIAL_REVIEW_FORMAT
    || record.completeCollectionApproved !== false
    || !Array.isArray(record.items) || record.items.length !== HOUSE_ART_KINDS.length) {
    throw new Error("Artwork review cannot imply approval or release");
  }
  const approved = artworkReviewManifest();
  for (let index = 0; index < approved.items.length; index += 1) {
    const item = record.items[index];
    const expected = approved.items[index];
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("Unknown artwork review entry");
    }
    const row = item as Record<string, unknown>;
    if (Object.keys(row).length !== 7
      || Object.entries(expected).some(([key, expectedValue]) => row[key] !== expectedValue)) {
      throw new Error("Review asset record is not an approved house sample");
    }
  }
  return value as ArtworkReviewManifest;
}

/** Deliberately strips all image identifiers, scores and release claims. */
export function artworkReviewReceipt(): string {
  return JSON.stringify(validateArtworkManifest(artworkReviewManifest()), null, 2) + "\n";
}
