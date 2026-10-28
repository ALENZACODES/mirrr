/** #98 Live virtual mirror: local effects on the camera stream, only after she agrees.
 *
 * The camera is opened only by start() with her explicit camera consent; without it the
 * mirror refuses with a coded reason and never asks the browser for the camera. Each tick
 * grabs the newest camera frame, runs the chosen effect on it with the most recent face
 * points or person mask (measured on this device, at most one measurement in flight so the
 * picture never waits for a model), flips it for a mirror view and paints it. Only the
 * current frame is held; nothing is recorded or uploaded. saveFrame() hands over a copy of
 * the current processed frame (not mirrored) only when she taps save. stop(), a withdrawn
 * consent or dispose() stop every camera track, cancel the loop and drop the frame.
 * Author: John Khan.
 */
import type { ByteImage } from "../../engines/core/buffer.js";
import type { MeasureNeeds } from "./browser.js";
import { type FrameEffect, type FrameInputs, NO_INPUTS, checkStrength, copyFrame } from "./frames.js";

export interface CameraStreamLike { getTracks(): { stop(): void }[] }
export interface MirrorDeps {
  getCamera(): Promise<CameraStreamLike>;
  grab(): ByteImage | null;
  measure(image: ByteImage, needs: MeasureNeeds): Promise<FrameInputs>;
  paint(image: ByteImage): void;
  schedule(callback: () => void): number;
  cancel(id: number): void;
  now(): number;
}
export type MirrorState = "off" | "starting" | "on";
export type StartResult = { started: true } | { started: false; reason: "camera_consent" | "camera_unavailable" | "busy" };

export function mirrored(image: ByteImage): ByteImage {
  const out = copyFrame(image), { width: w, height: h, channels: c } = image;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const from = (y * w + (w - 1 - x)) * c, to = (y * w + x) * c;
    for (let k = 0; k < c; k++) out.data[to + k] = image.data[from + k];
  }
  return out;
}

export class LiveMirror {
  state: MirrorState = "off";
  private stream: CameraStreamLike | null = null;
  private loop: number | null = null;
  private current: ByteImage | null = null;
  private inputs: FrameInputs = NO_INPUTS;
  private measuring = false;
  private generation = 0;
  private lastT = -1;
  framesShown = 0;

  constructor(private readonly deps: MirrorDeps, private effect: FrameEffect | null = null,
    private needs: MeasureNeeds = { face: false, person: false }, private strength = 60) {}

  setEffect(effect: FrameEffect | null, needs: MeasureNeeds, strength: number): void {
    checkStrength(strength);
    this.effect?.reset();
    this.effect = effect; this.needs = needs; this.strength = strength; this.inputs = NO_INPUTS;
  }

  async start(cameraConsent: boolean): Promise<StartResult> {
    if (cameraConsent !== true) return { started: false, reason: "camera_consent" };
    if (this.state !== "off") return { started: false, reason: "busy" };
    const own = ++this.generation;
    this.state = "starting";
    let stream: CameraStreamLike;
    try { stream = await this.deps.getCamera(); } catch { if (own === this.generation) this.state = "off"; return { started: false, reason: "camera_unavailable" }; }
    if (own !== this.generation) { stream.getTracks().forEach((track) => track.stop()); return { started: false, reason: "busy" }; }
    this.stream = stream; this.state = "on";
    this.loop = this.deps.schedule(() => this.tick(own));
    return { started: true };
  }

  /** One frame: grab, process with the latest measurements, mirror and paint. */
  tick(own = this.generation): void {
    if (own !== this.generation || this.state !== "on") return;
    const frame = this.deps.grab();
    if (frame) {
      let t = this.deps.now();
      if (t <= this.lastT) t = this.lastT + 1e-3;
      this.lastT = t;
      const needs = this.needs;
      if (this.effect && (needs.face || needs.person) && !this.measuring) {
        this.measuring = true;
        this.deps.measure(frame, needs).then((inputs) => { if (own === this.generation) this.inputs = inputs; })
          .catch(() => { if (own === this.generation) this.inputs = NO_INPUTS; })
          .finally(() => { this.measuring = false; });
      }
      const inputs = this.inputs.person && this.inputs.person.length !== frame.width * frame.height ? NO_INPUTS : this.inputs;
      const shown = this.effect ? this.effect.apply({ image: frame, t }, inputs, this.strength).image : copyFrame(frame);
      this.current = shown;
      this.deps.paint(mirrored(shown));
      this.framesShown++;
    }
    this.loop = this.deps.schedule(() => this.tick(own));
  }

  /** A copy of the current processed frame, only when she taps save. */
  saveFrame(): ByteImage | null { return this.current ? copyFrame(this.current) : null; }

  /** How many frames the mirror holds right now (0 or 1). */
  framesHeld(): number { return this.current ? 1 : 0; }

  stop(): void {
    this.generation++;
    if (this.loop !== null) this.deps.cancel(this.loop);
    this.loop = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null; this.current = null; this.inputs = NO_INPUTS; this.state = "off"; this.lastT = -1;
    this.effect?.reset();
  }
}
