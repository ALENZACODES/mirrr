/** Worker protocol v1: one image and one MediaPipe task per message.
 * Worker messages contain only structured-clone data and transfer buffers.
 * Never send a Blob URL or a source filename through the worker.
 * Author: John Khan.
 */
import type { FacePose, Point3 } from "./geometry.js";
import type { VisionTask } from "./model-registry.js";
import type { DetectionAttempt } from "./box-first.js";

export type VisionOperation = VisionTask;
export interface VisionImage { width: number; height: number; rgba: ArrayBuffer }
export interface VisionRequest {
  kind: "detect";
  id: number;
  operation: VisionOperation;
  image: VisionImage;
  maxFaces?: number;
}
export interface VisionDetection {
  x: number; y: number; width: number; height: number;
  score: number;
}
export interface VisionFace {
  landmarks: Point3[];
  blendshapes: Record<string, number>;
  pose: FacePose;
}
export interface VisionSegmentation {
  width: number;
  height: number;
  channels: Float32Array[];
  categoryMask: Uint8Array | null;
}
export interface VisionOutput {
  width: number;
  height: number;
  operation: VisionOperation;
  faces?: VisionFace[];
  detections?: VisionDetection[];
  poses?: Point3[][];
  segmentation?: VisionSegmentation;
  detectionPipeline?: {
    pipeline: "box-crop-mesh" | "box-only" | "full-image";
    detector: "yunet" | "mediapipe";
    sourceConfigured: boolean;
    usedFullImageFallback: boolean;
    boxes: number;
    attempts: DetectionAttempt[];
    reason?: string;
  };
}
export type VisionResponse =
  | { kind: "result"; id: number; ok: true; output: VisionOutput }
  | { kind: "result"; id: number; ok: false; error: string; status: "pending" | "failed" | "unavailable" };

const OPERATIONS: readonly VisionOperation[] = ["face-detection", "face-landmarks", "pose", "hair-segmentation", "person-segmentation"];
export function requireVisionRequest(input: unknown): VisionRequest {
  if (!input || typeof input !== "object") throw new RangeError("vision request must be an object");
  const v = input as Partial<VisionRequest>;
  if (v.kind !== "detect" || !Number.isSafeInteger(v.id) || (v.id ?? -1) < 1 ||
      !OPERATIONS.includes(v.operation as VisionOperation)) throw new RangeError("invalid vision message kind, id or operation");
  const im = v.image;
  if (!im || !Number.isInteger(im.width) || !Number.isInteger(im.height) ||
      (im.width ?? 0) < 1 || (im.height ?? 0) < 1 ||
      (im.width ?? 0) > 4096 || (im.height ?? 0) > 4096 ||
      !(im.rgba instanceof ArrayBuffer) || im.rgba.byteLength !== im.width! * im.height! * 4) {
    throw new RangeError("worker input must be a complete <=4096px RGBA image");
  }
  if (v.maxFaces !== undefined && (!Number.isInteger(v.maxFaces) || v.maxFaces < 1 || v.maxFaces > 6)) {
    throw new RangeError("face limit must be 1..6");
  }
  return v as VisionRequest;
}
export function transferResponse(out: VisionResponse): Transferable[] {
  if (!out.ok) return [];
  const seg = out.output.segmentation;
  if (!seg) return [];
  return [...seg.channels.map((c) => c.buffer as ArrayBuffer),
          ...(seg.categoryMask ? [seg.categoryMask.buffer as ArrayBuffer] : [])];
}
