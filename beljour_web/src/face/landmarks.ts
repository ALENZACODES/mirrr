/** R4: legacy face-reading facade over the E05 worker and licence registry.
 * Pending model weights never download; other photo flows keep their existing
 * no-face/manual behaviour. The reel facade caches worker detections; it does
 * not run MediaPipe synchronously on the main thread.
 * Face-mapping credits (licences.json "concepts"): runtime MediaPipe Face Landmarker
 * (Bucket A); concept only, no code copied: no other project. Author: John Khan.
 */
import type { Point } from "../types.js";
import { defaultVisionClient } from "../vision/client.js";

export interface FaceReading { points: Point[]; blendshapes: Record<string, number> }

export async function readFace(image: HTMLImageElement | HTMLCanvasElement): Promise<FaceReading | null> {
  const width = image instanceof HTMLImageElement ? image.naturalWidth : image.width;
  const height = image instanceof HTMLImageElement ? image.naturalHeight : image.height;
  const vision = defaultVisionClient();
  const result = await vision.detectImage("face-landmarks", image, width, height, { maxFaces: 6 });
  const chosen = result.faces?.find((face) => face.id === vision.selectedFace) ?? result.faces?.[0];
  return chosen ? { points: chosen.landmarks, blendshapes: chosen.blendshapes } : null;
}

interface VideoLandmarker {
  detectForVideo(video: HTMLVideoElement | HTMLCanvasElement, timestampMs: number): { faceLandmarks: Point[][] };
}

/** Existing recording code wants a sync last-frame reading. Queue at most one
 * worker frame and return the last completed landmarks; do not block rendering. */
export async function loadVideoLandmarker(): Promise<VideoLandmarker | null> {
  const vision = defaultVisionClient();
  if (!vision.ready("face-landmarks")) return null;
  let busy = false;
  let latest: Point[][] = [];
  let prior = -1;
  return {
    detectForVideo(source: HTMLVideoElement | HTMLCanvasElement, timestampMs: number) {
      if (!busy && timestampMs > prior) {
        prior = timestampMs;
        busy = true;
        const w = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
        const h = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
        if (w && h) {
          const scale = Math.min(1, 1024 / Math.max(w, h));
          void vision.detectImage("face-landmarks", source, Math.round(w * scale), Math.round(h * scale), { maxFaces: 1 })
            .then((result) => { latest = result.faces?.map((face) => face.landmarks) ?? []; })
            .catch(() => { latest = []; })
            .finally(() => { busy = false; });
        } else busy = false;
      }
      return { faceLandmarks: latest };
    },
  };
}
