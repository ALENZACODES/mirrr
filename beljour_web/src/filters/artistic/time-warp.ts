/**
 * BELJOUR Studio Play: original, user-initiated progressive framebuffer scan.
 * The next frame supplies only the next strip. Already frozen pixels stay put.
 * No camera access, network request, facial identity model, or persistent store
 * is performed by this engine. Author: John Khan.
 */
import { photo, type ArtisticImage, MAX_PIXELS } from "./types.js";

export type ScanAxis = "horizontal" | "vertical";
export type ScanDirection = "forward" | "reverse";
export type ScanState = "ready" | "scanning" | "complete" | "cancelled" | "disposed";
export interface ScanOptions {
  axis?: ScanAxis;
  direction?: ScanDirection;
  step?: number;
}
export interface ScanResult {
  readonly image: Uint8Array;
  readonly width: number;
  readonly height: number;
  readonly channels: number;
  readonly state: ScanState;
  readonly axis: ScanAxis;
  readonly direction: ScanDirection;
  readonly progress: number;
  readonly frozen: number;
  readonly extent: number;
  readonly nextLine: number | null;
  readonly userReviewRequired: true;
  readonly realFacesEvaluated: 0;
}

export class TimeWarpScan {
  readonly width: number;
  readonly height: number;
  readonly channels: number;
  readonly axis: ScanAxis;
  readonly direction: ScanDirection;
  readonly step: number;
  readonly extent: number;
  private original: Uint8Array | null;
  private buffer: Uint8Array | null;
  private frozenCount = 0;
  private currentState: ScanState = "ready";

  constructor(initial: ArtisticImage, options: ScanOptions = {}) {
    const frame = photo(initial, MAX_PIXELS);
    this.width = frame.width;
    this.height = frame.height;
    this.channels = frame.channels;
    this.axis = options.axis ?? "horizontal";
    this.direction = options.direction ?? "forward";
    this.step = options.step ?? 1;
    if (this.axis !== "horizontal" && this.axis !== "vertical") {
      throw new RangeError("scan axis must be horizontal or vertical");
    }
    if (this.direction !== "forward" && this.direction !== "reverse") {
      throw new RangeError("scan direction must be forward or reverse");
    }
    this.extent = this.axis === "horizontal" ? frame.height : frame.width;
    if (!Number.isSafeInteger(this.step) || this.step < 1 || this.step > this.extent) {
      throw new RangeError("scan step must be a positive integer within the scan extent");
    }
    this.original = Uint8Array.from(frame.data);
    this.buffer = Uint8Array.from(frame.data);
  }

  get state(): ScanState { return this.currentState; }
  get frozen(): number { return this.frozenCount; }
  get footprintBytes(): number { return this.buffer === null ? 0 : this.width * this.height * this.channels * 2; }

  private requireOpen(): { original: Uint8Array; buffer: Uint8Array } {
    if (this.currentState === "disposed" || this.original === null || this.buffer === null) {
      throw new Error("the scan was disposed");
    }
    return { original: this.original, buffer: this.buffer };
  }

  private get nextLine(): number | null {
    if (this.frozenCount >= this.extent || this.currentState === "cancelled" || this.currentState === "disposed") {
      return null;
    }
    return this.direction === "forward" ? this.frozenCount : this.extent - this.frozenCount - 1;
  }

  snapshot(markLine = false): ScanResult {
    const { buffer } = this.requireOpen();
    const image = Uint8Array.from(buffer);
    const nextLine = this.nextLine;
    if (markLine && nextLine !== null) {
      if (this.axis === "horizontal") {
        for (let x = 0; x < this.width; x++) {
          for (let ch = 0; ch < 3; ch++) image[(nextLine * this.width + x) * this.channels + ch] = 250;
        }
      } else {
        for (let y = 0; y < this.height; y++) {
          for (let ch = 0; ch < 3; ch++) image[(y * this.width + nextLine) * this.channels + ch] = 250;
        }
      }
    }
    return {
      image, width: this.width, height: this.height, channels: this.channels,
      state: this.currentState, axis: this.axis, direction: this.direction,
      progress: this.frozenCount / this.extent, frozen: this.frozenCount,
      extent: this.extent, nextLine, userReviewRequired: true,
      realFacesEvaluated: 0,
    };
  }

  advance(frame: ArtisticImage): ScanResult {
    const { buffer } = this.requireOpen();
    if (this.currentState === "complete" || this.currentState === "cancelled") {
      throw new Error("scan is already finished; restart to capture again");
    }
    const incoming = photo(frame, MAX_PIXELS);
    if (incoming.width !== this.width || incoming.height !== this.height || incoming.channels !== this.channels) {
      throw new RangeError("incoming frame shape must match the initial frame");
    }
    const count = Math.min(this.step, this.extent - this.frozenCount);
    const start = this.direction === "forward" ? this.frozenCount : this.extent - this.frozenCount - count;
    const stop = start + count;
    if (this.axis === "horizontal") {
      const begin = start * this.width * this.channels;
      const end = stop * this.width * this.channels;
      buffer.set(incoming.data.subarray(begin, end), begin);
    } else {
      for (let y = 0; y < this.height; y++) {
        const begin = (y * this.width + start) * this.channels;
        const end = (y * this.width + stop) * this.channels;
        buffer.set(incoming.data.subarray(begin, end), begin);
      }
    }
    this.frozenCount += count;
    this.currentState = this.frozenCount === this.extent ? "complete" : "scanning";
    return this.snapshot();
  }

  cancel(): ScanResult {
    const { original, buffer } = this.requireOpen();
    if (this.currentState === "complete") throw new Error("a completed scan cannot be cancelled");
    buffer.set(original);
    this.frozenCount = 0;
    this.currentState = "cancelled";
    return this.snapshot();
  }

  restart(): ScanResult {
    const { original, buffer } = this.requireOpen();
    buffer.set(original);
    this.frozenCount = 0;
    this.currentState = "ready";
    return this.snapshot();
  }

  dispose(): void {
    this.original?.fill(0);
    this.buffer?.fill(0);
    this.original = null;
    this.buffer = null;
    this.frozenCount = 0;
    this.currentState = "disposed";
  }
}
