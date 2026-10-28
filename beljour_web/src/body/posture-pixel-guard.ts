/** Local head-pixel preservation guard, anchored to the original head bytes.
 * Implements the posture FaceIdentityGuard contract without any face model: it refuses a
 * `before` image whose marked head bytes differ from the anchored originals, refuses
 * mismatched shapes and invalid lock levels, and returns the edit with every marked head
 * byte restored. Its similarity is the exact pixel agreement on the marked head AFTER
 * restoration (1.0 when complete). This is NOT biometric identity verification; it can
 * only protect what the user marked. Retained bytes are zeroed on dispose. Author: John Khan.
 */
import { type ByteImage, type Mask } from "../engines/core/buffer.js";
import { checkedPostureLevel } from "../engines/local/posture.js";
import { type FaceIdentityGuard, type GuardDecision, IdentityLockUnavailable } from "./posture-session.js";
import { checkedHeadMask, checkedSource } from "./posture-safe.js";

export class HeadPixelGuard implements FaceIdentityGuard {
  readonly width: number;
  readonly height: number;
  private readonly channels: number;
  private indices: Uint32Array;
  private anchor: Uint8Array;
  private disposed = false;

  constructor(source: ByteImage, head: Mask) {
    const image = checkedSource(source);
    const covered = checkedHeadMask(head, image.width, image.height);
    this.width = image.width;
    this.height = image.height;
    this.channels = image.channels;
    const marked: number[] = [];
    for (let p = 0; p < covered.length; p++) if (covered[p]) marked.push(p);
    this.indices = Uint32Array.from(marked);
    this.anchor = new Uint8Array(marked.length * this.channels);
    marked.forEach((pixel, k) => {
      for (let c = 0; c < this.channels; c++) this.anchor[k * this.channels + c] = image.data[pixel * this.channels + c];
    });
  }

  get protectedPixels(): number { return this.indices.length; }
  get isDisposed(): boolean { return this.disposed; }

  private requireShape(image: ByteImage, what: string): void {
    if (!image || image.width !== this.width || image.height !== this.height || image.channels !== this.channels ||
        image.data.length !== this.width * this.height * this.channels) {
      throw new IdentityLockUnavailable(`Head protection received an incompatible ${what} image.`);
    }
  }

  /** Exact agreement share between an image's marked head bytes and the anchor. */
  agreement(image: ByteImage): number {
    this.requireShape(image, "comparison");
    let same = 0;
    for (let k = 0; k < this.indices.length; k++) {
      const base = this.indices[k] * this.channels;
      let equal = true;
      for (let c = 0; c < this.channels; c++) {
        if (image.data[base + c] !== this.anchor[k * this.channels + c]) { equal = false; break; }
      }
      if (equal) same++;
    }
    return this.indices.length ? same / this.indices.length : 0;
  }

  guard(before: ByteImage, after: ByteImage, lockLevel: number): GuardDecision {
    if (this.disposed) throw new IdentityLockUnavailable("Head protection has been released.");
    try {
      checkedPostureLevel(lockLevel);
    } catch {
      throw new IdentityLockUnavailable("Head protection received an invalid lock level.");
    }
    this.requireShape(before, "source");
    this.requireShape(after, "edited");
    if (this.agreement(before) !== 1) {
      throw new IdentityLockUnavailable("The original head pixels changed; mark the head again.");
    }
    const data = new Uint8Array(after.data);
    for (let k = 0; k < this.indices.length; k++) {
      const base = this.indices[k] * this.channels;
      for (let c = 0; c < this.channels; c++) data[base + c] = this.anchor[k * this.channels + c];
    }
    const image = { ...after, data };
    return { image, similarity: this.agreement(image) };
  }

  dispose(): void {
    if (this.disposed) return;
    this.anchor.fill(0);
    this.indices.fill(0);
    this.anchor = new Uint8Array(0);
    this.indices = new Uint32Array(0);
    this.disposed = true;
  }
}
