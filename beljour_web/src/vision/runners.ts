/** E05 MediaPipe Tasks Vision runners. Models arrive only as verified bytes;
 * the SDK is injected for offline tests and loaded lazily in a Web Worker.
 * No SDK dependency is bundled into the main page.
 * Face-mapping credits (licences.json "concepts"): runtime MediaPipe Face Landmarker
 * (Bucket A, called through its published Tasks API); concept only, no code copied:
 * no other project. Author: John Khan.
 */
import { headPoseFromMesh, type Point3 } from "./geometry.js";
import { type VisionOperation, type VisionOutput, type VisionSegmentation, type VisionDetection } from "./protocol.js";
import { BoxFirstDetector, prepareBoxes, type YuNetSource, type ImageFactory, type MeshBatch } from "./box-first.js";

interface MpMask {
  width: number;
  height: number;
  getAsFloat32Array?(): Float32Array;
  getAsUint8Array?(): Uint8Array;
  close(): void;
}
interface MpRunner {
  detect?(image: ImageData): unknown;
  segment?(image: ImageData): unknown;
  close?(): void;
}
interface MpFactory {
  createFromOptions(fileset: unknown, options: Record<string, unknown>): Promise<MpRunner>;
}
export interface MediaPipeSdk {
  FilesetResolver: { forVisionTasks(path: string): Promise<unknown> };
  FaceDetector: MpFactory;
  FaceLandmarker: MpFactory;
  PoseLandmarker: MpFactory;
  ImageSegmenter: MpFactory;
}
interface FaceResult {
  faceLandmarks?: { x: number; y: number; z?: number }[][];
  faceBlendshapes?: { categories: { categoryName: string; score: number }[] }[];
}
interface DetectorResult {
  detections?: {
    boundingBox?: { originX: number; originY: number; width: number; height: number };
    categories?: { score: number }[];
  }[];
}
interface PoseResult {
  landmarks?: { x: number; y: number; z?: number; visibility?: number }[][];
  segmentationMasks?: MpMask[];
}
interface SegmentResult { confidenceMasks?: MpMask[]; categoryMask?: MpMask }
export type WeightLoader = (name: string) => Promise<Uint8Array>;
export interface FacePipelineOptions {
  /** Supplied only by a separately commercially cleared YuNet runtime. */
  boxSource?: YuNetSource | null;
  createImage?: ImageFactory;
  /** Refuse face tasks before SDK/model loading when no YuNet adapter is present.
   * Existing cleared legacy integrations keep their explicitly labelled fallback
   * unless they opt in. This flag never clears a model's licence or checksum. */
  requireBoxFirst?: boolean;
}

export interface FacePipelineAvailability {
  /** Adapter availability only; model clearance remains a separate prerequisite. */
  available: boolean;
  required: boolean;
  reason: string | null;
}

/** The shipped browser has no cleared YuNet adapter. Callers can inspect this
 * before supplying an image, rather than mistaking a legacy mesh for P0 readiness. */
export function facePipelineAvailability(options: FacePipelineOptions = {}): FacePipelineAvailability {
  if (options.requireBoxFirst !== undefined && typeof options.requireBoxFirst !== "boolean") {
    throw new RangeError("requireBoxFirst must be a boolean");
  }
  if (options.boxSource && (options.boxSource.provider !== "yunet" || typeof options.boxSource.detect !== "function")) {
    throw new RangeError("box-first source must identify the YuNet runtime and provide detect()");
  }
  const available = Boolean(options.boxSource);
  return { available, required: options.requireBoxFirst ?? false,
    reason: available ? null : "YuNet browser runtime is not configured; box-first face processing is unavailable." };
}

function faceBatch(raw: FaceResult | undefined): MeshBatch {
  const faces: Point3[][] = [], blendshapes: Record<string, number>[] = [];
  for (const [index, points] of (raw?.faceLandmarks ?? []).entries()) {
    // Keep malformed lengths for the coordinator's invalid-candidate accounting.
    faces.push(points.map((p) => ({ x: p.x, y: p.y, z: p.z ?? 0 })));
    const values: Record<string, number> = {};
    for (const category of raw?.faceBlendshapes?.[index]?.categories ?? []) {
      if (Number.isFinite(category.score) && /^[A-Za-z][A-Za-z0-9_]{0,64}$/.test(category.categoryName)) {
        values[category.categoryName] = category.score;
      }
    }
    blendshapes.push(values);
  }
  return { faces, blendshapes };
}

/** A media task is keyed by ID and configuration; results and model objects never
 * cross the worker boundary. Face limit changes recreate the instance rather than
 * calling unsupported setters on a running instance. */
export class MediaPipeRunners {
  private cache = new Map<string, Promise<MpRunner>>();
  private fileset: Promise<unknown> | null = null;
  constructor(private readonly sdk: MediaPipeSdk, private readonly wasmPath: string,
              private readonly weights: WeightLoader, private readonly facePipeline: FacePipelineOptions = {}) {
    facePipelineAvailability(facePipeline);
  }

  get boxFirstReady(): boolean { return facePipelineAvailability(this.facePipeline).available; }

  private async create(operation: VisionOperation, faces: number): Promise<MpRunner> {
    this.fileset ??= this.sdk.FilesetResolver.forVisionTasks(this.wasmPath);
    const file = {
      "face-detection": "face-detector-short", "face-landmarks": "face-landmarker-478",
      pose: "pose-landmarker-lite", "hair-segmentation": "hair-segmenter",
      "person-segmentation": "selfie-multiclass",
    } as const;
    const modelAssetBuffer = await this.weights(file[operation]);
    const baseOptions = { modelAssetBuffer, delegate: "CPU" };
    const common = { baseOptions, runningMode: "IMAGE" };
    const fileset = await this.fileset;
    switch (operation) {
      case "face-detection": return this.sdk.FaceDetector.createFromOptions(fileset, { ...common, minDetectionConfidence: 0.45 });
      case "face-landmarks": return this.sdk.FaceLandmarker.createFromOptions(fileset, {
        ...common, numFaces: faces, outputFaceBlendshapes: true, outputFacialTransformationMatrixes: true,
      });
      case "pose": return this.sdk.PoseLandmarker.createFromOptions(fileset, {
        ...common, numPoses: Math.min(2, faces), outputSegmentationMasks: true,
      });
      case "hair-segmentation":
      case "person-segmentation": return this.sdk.ImageSegmenter.createFromOptions(fileset, {
        ...common, outputCategoryMask: true, outputConfidenceMasks: true,
      });
    }
  }
  async run(operation: VisionOperation, image: ImageData, faces = 6): Promise<VisionOutput> {
    if (!Number.isInteger(faces) || faces < 1 || faces > 6) throw new RangeError("face limit must be 1..6");
    if (image.data.byteLength !== image.width * image.height * 4) throw new RangeError("RGBA image is incomplete");
    if (operation === "face-detection" || operation === "face-landmarks") {
      const availability = facePipelineAvailability(this.facePipeline);
      if (availability.required && !availability.available) {
        throw new Error(availability.reason ?? "Box-first face processing is unavailable.");
      }
    }
    if (operation === "face-detection" && this.facePipeline.boxSource) {
      const boxes = prepareBoxes(await this.facePipeline.boxSource.detect(image), image.width, image.height, faces);
      return { width: image.width, height: image.height, operation,
        detections: boxes.map((box) => ({ x: box.x / image.width, y: box.y / image.height,
          width: box.width / image.width, height: box.height / image.height, score: box.score })),
        detectionPipeline: { pipeline: "box-only", detector: "yunet", sourceConfigured: true,
          usedFullImageFallback: false, boxes: boxes.length, attempts: [] } };
    }
    const cacheKey = `${operation}:${operation === "face-landmarks" || operation === "pose" ? faces : 1}`;
    let job = this.cache.get(cacheKey);
    if (!job) {
      job = this.create(operation, faces).catch((error: unknown) => {
        this.cache.delete(cacheKey);
        throw error;
      });
      this.cache.set(cacheKey, job);
    }
    const runner = await job;
    const result: VisionOutput = { width: image.width, height: image.height, operation };
    switch (operation) {
      case "face-detection": {
        const out = runner.detect?.(image) as DetectorResult | undefined;
        result.detections = (out?.detections ?? []).flatMap((d): VisionDetection[] => {
          const box = d.boundingBox;
          if (!box) return [];
          const x = box.originX / image.width, y = box.originY / image.height;
          const width = box.width / image.width, height = box.height / image.height;
          if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return [];
          return [{ x, y, width, height, score: d.categories?.[0]?.score ?? 0 }];
        });
        result.detectionPipeline = { pipeline: "full-image", detector: "mediapipe", sourceConfigured: false,
          usedFullImageFallback: true, boxes: result.detections.length, attempts: [],
          reason: "YuNet runtime is not configured; this is a full-image MediaPipe detector fallback." };
        break;
      }
      case "face-landmarks": {
        let batch: MeshBatch;
        if (this.facePipeline.boxSource) {
          const coordinator = new BoxFirstDetector(this.facePipeline.boxSource,
            (crop) => faceBatch(runner.detect?.(crop) as FaceResult | undefined), faces, this.facePipeline.createImage);
          const detection = await coordinator.detect(image);
          batch = detection;
          result.detections = detection.boxes.map((box) => ({ x: box.x / image.width, y: box.y / image.height,
            width: box.width / image.width, height: box.height / image.height, score: box.score }));
          result.detectionPipeline = { pipeline: "box-crop-mesh", detector: "yunet", sourceConfigured: true,
            usedFullImageFallback: detection.usedFallback, boxes: detection.boxes.length, attempts: detection.attempts };
        } else {
          batch = faceBatch(runner.detect?.(image) as FaceResult | undefined);
          result.detectionPipeline = { pipeline: "full-image", detector: "mediapipe", sourceConfigured: false,
            usedFullImageFallback: true, boxes: 0, attempts: [],
            reason: "YuNet runtime is not configured; this is a full-image mesh fallback." };
        }
        result.faces = [];
        for (const [index, landmarks] of batch.faces.slice(0, faces).entries()) {
          if (landmarks.length !== 478) continue;
          try {
            const pose = headPoseFromMesh(landmarks, image.width, image.height);
            const blendshapes = batch.blendshapes[index] ?? {};
            result.faces.push({ landmarks, blendshapes, pose });
          } catch { /* skip corrupt face; other faces still work */ }
        }
        break;
      }
      case "pose": {
        const out = runner.detect?.(image) as PoseResult | undefined;
        result.poses = (out?.landmarks ?? []).filter((pts) => pts.length === 33)
          .map((pts) => pts.map((p) => ({ x: p.x, y: p.y, z: p.z ?? 0 })));
        const masks = out?.segmentationMasks ?? [];
        if (masks.length) result.segmentation = copyMasks(masks, null);
        break;
      }
      case "hair-segmentation":
      case "person-segmentation": {
        const out = runner.segment?.(image) as SegmentResult | undefined;
        if (out) result.segmentation = copyMasks(out.confidenceMasks ?? [], out.categoryMask ?? null);
        break;
      }
    }
    return result;
  }
  async dispose(): Promise<void> {
    for (const task of this.cache.values()) {
      try { (await task).close?.(); } catch { /* model creation can fail */ }
    }
    this.cache.clear(); this.fileset = null;
    await this.facePipeline.boxSource?.close?.();
  }
}

/** MediaPipe masks own WASM/native memory. Copy data before close(), even on
 * failure, then release every source mask exactly once. */
export function copyMasks(sources: readonly MpMask[], category: MpMask | null): VisionSegmentation {
  const all = category ? [...sources, category] : [...sources];
  if (!all.length) throw new RangeError("no segmentation masks");
  const width = all[0].width, height = all[0].height;
  const channels: Float32Array[] = [];
  let categories: Uint8Array | null = null;
  try {
    for (const mask of sources) {
      if (mask.width !== width || mask.height !== height) throw new RangeError("segmentation dimensions differ");
      if (!mask.getAsFloat32Array) throw new RangeError("confidence mask is not floating point");
      const values = mask.getAsFloat32Array();
      if (values.length !== width * height || values.some((v) => !Number.isFinite(v))) {
        throw new RangeError("invalid confidence mask values");
      }
      channels.push(values.slice());
    }
    if (category) {
      if (category.width !== width || category.height !== height || !category.getAsUint8Array) {
        throw new RangeError("invalid category mask");
      }
      const values = category.getAsUint8Array();
      if (values.length !== width * height) throw new RangeError("invalid category dimensions");
      categories = values.slice();
    }
    return { width, height, channels, categoryMask: categories };
  } finally {
    const done = new Set<MpMask>();
    for (const mask of all) if (!done.has(mask)) { done.add(mask); mask.close(); }
  }
}
