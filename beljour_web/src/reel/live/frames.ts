/** Per-frame video and live-camera effects: the shared frame contract.
 *
 * A frame is a ByteImage (RGB or RGBA) with its time in seconds. An effect gets each frame
 * in order with what was measured on it (face points in pixels, a person mask) and returns a
 * new image; it may keep a small temporal state (smoothed points, a smoothed mask, the last
 * output) but never a store of frames. processSequence runs an effect over an ordered frame
 * source and hands every result to a sink at once, so a clip is never held in memory and
 * nothing is written anywhere unless the sink does it (the screens only record what she
 * chooses to save). Everything runs on this device. Author: John Khan.
 */
import type { ByteImage } from "../../engines/core/buffer.js";
import { requireColour } from "../../engines/core/buffer.js";
import type { Point2 } from "../../engines/warp/field.js";

export interface Frame { image: ByteImage; t: number }
export interface FrameInputs {
  /** Face points in pixels (478), or null when no face was found on this frame. */
  points: readonly Point2[] | null;
  /** Person mask 0..1, one value per pixel, or null when no segmenter ran. */
  person: Float32Array | null;
}
export const NO_INPUTS: FrameInputs = { points: null, person: null };

export interface EffectOutput { image: ByteImage; changed: boolean; note: string }

export interface FrameEffect {
  readonly id: string;
  readonly label: string;
  apply(frame: Frame, inputs: FrameInputs, strength: number): EffectOutput;
  /** Forget the temporal state (a scene cut, a new clip or the camera restarting). */
  reset(): void;
}

export type FrameSink = (output: EffectOutput, frame: Frame, index: number) => void | Promise<void>;
export type InputsFor = (frame: Frame, index: number) => FrameInputs | Promise<FrameInputs>;

export function copyFrame(image: ByteImage): ByteImage {
  return { width: image.width, height: image.height, channels: image.channels, data: new Uint8ClampedArray(image.data) };
}

export function checkFrame(frame: Frame, previous: number | null): void {
  requireColour(frame.image);
  if (!Number.isFinite(frame.t) || frame.t < 0) throw new RangeError("frame time must be a finite, non-negative number of seconds");
  if (previous !== null && frame.t <= previous) throw new RangeError("frames must arrive in increasing time order");
}

export function checkStrength(strength: number): void {
  if (typeof strength !== "number" || !Number.isFinite(strength) || strength < 0 || strength > 100) throw new RangeError("strength must be 0..100");
}

export function checkPerson(person: Float32Array | null, image: ByteImage): void {
  if (!person) return;
  if (person.length !== image.width * image.height) throw new RangeError("person mask must have one value per pixel");
  for (const v of person) if (!(v >= 0 && v <= 1)) throw new RangeError("person mask values must be 0..1");
}

export interface SequenceReport { frames: number; changed: number; notes: string[] }

/** Run one effect over an ordered frame source; each output goes straight to the sink. */
export async function processSequence(frames: Iterable<Frame> | AsyncIterable<Frame>, effect: FrameEffect,
  inputsFor: InputsFor, sink: FrameSink, strength: number | ((t: number) => number) = 100): Promise<SequenceReport> {
  effect.reset();
  let previous: number | null = null, index = 0, changed = 0;
  const notes = new Set<string>();
  for await (const frame of frames as AsyncIterable<Frame>) {
    checkFrame(frame, previous);
    previous = frame.t;
    const inputs = await inputsFor(frame, index);
    const amount = typeof strength === "function" ? strength(frame.t) : strength;
    checkStrength(amount);
    const output = effect.apply(frame, inputs, amount);
    if (output.changed) changed++;
    if (output.note) notes.add(output.note);
    await sink(output, frame, index);
    index++;
  }
  return { frames: index, changed, notes: [...notes] };
}
