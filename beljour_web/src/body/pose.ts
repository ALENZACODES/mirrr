/** R4 pose facade. MediaPipe runs only in the licensed E05 worker; no direct
 * CDN model downloads or main-thread inference remain. Author: John Khan. */
import type { PosePoint } from "./measure.js";
import { defaultVisionClient } from "../vision/client.js";

export interface PoseReading {
  landmarks: PosePoint[];
  mask: Float32Array;
  width: number;
  height: number;
}

export async function readPose(image: HTMLImageElement): Promise<PoseReading | null> {
  const result = await defaultVisionClient().detectImage("pose", image, image.naturalWidth, image.naturalHeight, { maxFaces: 1 });
  const landmarks = result.output?.poses?.[0];
  const segmentation = result.output?.segmentation;
  if (!landmarks || landmarks.length !== 33 || !segmentation?.channels[0]) return null;
  return { landmarks, mask: segmentation.channels[0], width: segmentation.width, height: segmentation.height };
}
