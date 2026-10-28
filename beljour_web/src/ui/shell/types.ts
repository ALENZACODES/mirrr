/** R8 studio-shell state. Photo bytes and biometrics never enter the JSON history.
 * A future Filters studio uses the same layer contract, not another stack.
 * Author: John Khan.
 */
import type { ByteImage, Mask } from "../../engines/core/buffer.js";
import type { Point2 } from "../../engines/warp/field.js";
import type { Controls } from "../../engines/local/posture.js";

export const STUDIO_IDS = ["enhance", "hair-fibre", "beard", "posture", "makeup", "hair-style", "filters", "portrait", "lighting", "recolour", "balayage", "older", "younger", "gender", "skin", "under-eye", "teeth", "shave", "grey", "studio", "illustration"] as const;
export type StudioId = typeof STUDIO_IDS[number];
export const LOCAL_KINDS = ["enhance", "hair-fibre", "beard", "posture", "portrait", "lighting", "recolour", "balayage", "older", "younger", "gender", "skin", "under-eye", "teeth", "shave", "grey", "studio", "illustration"] as const;
export type LocalKind = typeof LOCAL_KINDS[number];
/** Kinds this device renders: the local engines and, from R11, the filter looks (web/src/filters). */
export const RENDER_KINDS = [...LOCAL_KINDS, "filters"] as const;
export type RenderKind = typeof RENDER_KINDS[number];
export type LayerKind = LocalKind | "styling" | "filters";
export type SampleId = "low-light" | "crown" | "portrait" | "body-front" | "body-side";
export type SourceKind = "sample" | "uploaded";

export interface PhotoSource {
  id: string;
  label: string;
  kind: SourceKind;
  image: ByteImage;
  /** R7 synthetic-only fixture; never inferred for a real unrecorded photo. */
  face?: readonly Point2[];
  /** Every face found in a group photo (2..6), in memory only; `face` is the one being edited. */
  faces?: readonly (readonly Point2[])[];
  person?: Mask;
  body?: Controls;
  crown?: Mask;
  /** User-marked hair and lightening placement, never inferred from a guessed face. */
  hair?: Mask;
  hairPaint?: Mask;
  /** Source contains no photo unless an adult deliberately loads one locally. */
  disposable: boolean;
  /** Original selected file digest, in memory only, for matching a released fixture. */
  fileSha256?: string;
  fileDimensions?: readonly [number, number];
  /** In-memory geometry revision; prevents stale mask and face previews. */
  geometryRevision?: number;
}

export type ParamValue = string | number | boolean;
export interface ShellLayer {
  /** Stable local ID, unrelated to the provider task/request ID. */
  id: string;
  kind: LayerKind;
  name: string;
  enabled: boolean;
  opacity: number;
  strength: number;
  parameters: Readonly<Record<string, ParamValue>>;
  /** Own-code layers have no provider request path. */
  provenance: "local" | "youcam";
  simulation: boolean;
  origin: "sample" | "photo";
  /** A provider result may be displayed as a layer but cannot be recomputed locally. */
  remoteImageId?: string;
}

export interface StudioState {
  sourceId: string;
  studio: StudioId;
  selected: string | null;
  layers: ShellLayer[];
  /** This is a display mode; it never changes the source pixels. */
  showBefore: boolean;
  zoom: number;
}

export interface LayerResult {
  image: ByteImage;
  label: string;
  metrics: Record<string, number | string | boolean>;
  /** Set by a layer that moves the face (age reshape, gender): the 478 points as they are after
   * it, so the layers stacked after it find the eyes, lips and skin where they now are. */
  face?: readonly Point2[];
}

export type ToolReadiness = { ready: true } | { ready: false; reason: string };
