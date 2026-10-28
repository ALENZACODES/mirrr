/** #79 Reels editor: scene cuts, kept scenes, trims and strength keyframes for any local effect.
 * A clip is scanned once on this device into a brightness histogram per frame (the makeup
 * reel's reel/keyframes.ts lumaHistogram); a scene starts where the histogram jumps
 * (keyframes.ts sceneCuts). She keeps or drops each scene and trims its ends, and sets
 * strength keyframes; the strength between keyframes comes from keyframes.ts blendWeights, so
 * it never ramps across a scene cut. Rendering runs the chosen effect only on kept frames,
 * restarts its temporal smoothing at every scene start, and hands frames straight to the
 * sink: the clip is never held in memory. Author: John Khan.
 */
import { blendWeights, type FrameInfo, lumaHistogram, sceneCuts } from "../keyframes.js";
import { type FrameEffect, type FrameSink, type InputsFor, type Frame, checkFrame, checkStrength } from "./frames.js";

export const CUT_THRESHOLD = 0.35;
export interface Scene { index: number; start: number; end: number; keep: boolean }
export interface Keyframe { t: number; strength: number }

function rgba(frame: Frame): Uint8ClampedArray {
  const { width, height, channels, data } = frame.image;
  if (channels === 4) return Uint8ClampedArray.from(data);
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) { for (let k = 0; k < 3; k++) out[i * 4 + k] = data[i * 3 + k]; out[i * 4 + 3] = 255; }
  return out;
}

export class ReelProject {
  readonly times: number[] = [];
  private readonly hists: number[][] = [];
  private starts: number[] = [];
  scenes: Scene[] = [];
  keys: Keyframe[] = [{ t: 0, strength: 100 }];

  /** Scan one frame (in order); frames are not kept, only their time and histogram. */
  scan(frame: Frame): void {
    checkFrame(frame, this.times.length ? this.times[this.times.length - 1] : null);
    this.times.push(frame.t);
    this.hists.push(lumaHistogram(rgba(frame)));
  }

  /** Split the scanned clip into scenes at the histogram cuts; every scene starts kept. */
  findScenes(threshold = CUT_THRESHOLD): Scene[] {
    if (!this.times.length) throw new RangeError("scan the clip before finding scenes");
    const info: FrameInfo[] = this.times.map((t, i) => ({ t, hist: this.hists[i], pose: null }));
    const starts = [0, ...sceneCuts(info, threshold)];
    this.starts = starts;
    const last = this.times[this.times.length - 1];
    this.scenes = starts.map((s, i) => ({ index: i, start: this.times[s],
      end: i + 1 < starts.length ? this.times[starts[i + 1] - 1] : last, keep: true }));
    return this.scenes;
  }

  cutTimes(): number[] { return this.scenes.slice(1).map((s) => s.start); }

  setKeep(index: number, keep: boolean): void { this.scene(index).keep = keep; }

  trim(index: number, start: number, end: number): void {
    const s = this.scene(index), lo = this.times.find((t) => t >= start), hi = [...this.times].reverse().find((t) => t <= end);
    const bounds = this.sceneBounds(index);
    if (!(Number.isFinite(start) && Number.isFinite(end)) || start > end || start < bounds[0] || end > bounds[1] || lo === undefined || hi === undefined || lo > hi) {
      throw new RangeError("a trim must stay inside its scene and keep at least one frame");
    }
    s.start = lo; s.end = hi;
  }

  setKeyframes(keys: readonly Keyframe[]): void {
    if (!keys.length) throw new RangeError("at least one strength keyframe is needed");
    for (const k of keys) { if (!Number.isFinite(k.t) || k.t < 0) throw new RangeError("keyframe time must be a finite second"); checkStrength(k.strength); }
    this.keys = [...keys].sort((a, b) => a.t - b.t);
  }

  strengthAt(t: number): number {
    const w = blendWeights(t, this.keys.map((k) => k.t), this.cutTimes());
    let s = 0;
    for (let i = 0; i < w.length; i++) s += w[i] * this.keys[i].strength;
    return s;
  }

  /** The scene a time belongs to, or null when it was dropped or trimmed away. */
  keptScene(t: number): Scene | null {
    const s = this.scenes.find((x) => t >= x.start && t <= x.end);
    return s && s.keep ? s : null;
  }

  keptFrames(): number { return this.times.filter((t) => this.keptScene(t) !== null).length; }

  /** Render kept frames with the effect; temporal state restarts at each kept scene. */
  async render(frames: Iterable<Frame> | AsyncIterable<Frame>, effect: FrameEffect, inputsFor: InputsFor,
    sink: FrameSink): Promise<{ frames: number; scenes: number }> {
    if (!this.scenes.length) throw new RangeError("find the scenes before rendering");
    effect.reset();
    let current: Scene | null = null, count = 0, scenes = 0, previous: number | null = null, index = 0;
    for await (const frame of frames as AsyncIterable<Frame>) {
      checkFrame(frame, previous);
      previous = frame.t;
      const scene = this.keptScene(frame.t);
      if (!scene) { index++; continue; }
      if (scene !== current) { effect.reset(); current = scene; scenes++; }
      const out = effect.apply(frame, await inputsFor(frame, index), this.strengthAt(frame.t));
      await sink(out, frame, count);
      count++; index++;
    }
    return { frames: count, scenes };
  }

  private scene(index: number): Scene {
    const s = this.scenes[index];
    if (!s) throw new RangeError("no such scene");
    return s;
  }

  private sceneBounds(index: number): [number, number] {
    const starts = this.starts;
    const a = this.times[starts[index]], b = index + 1 < starts.length ? this.times[starts[index + 1] - 1] : this.times[this.times.length - 1];
    return [a, b];
  }
}
