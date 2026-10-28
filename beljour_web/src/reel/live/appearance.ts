/** #72 Video age and gender: the built still engines, frame by frame.
 *
 * Each frame is rendered by the editor's own pipeline (ui/shell/pipeline renderLayers): the
 * Older or Younger age texture and the masculine/feminine appearance warp from hero-layer.ts,
 * in the stack order of appearance-stack.ts (age first, then the warp). Face points are
 * steadied with the One Euro landmark smoothing (temporal.ts PointSmoother over reel/oneEuro.ts)
 * so the warp and the creases do not shimmer, and the age texture uses the same fixed seed on
 * every frame, so it stays put on the face. Every frame passes the stack's joint check (changes
 * only in the face areas, warp guard held, skin not lightened) or is passed through unchanged
 * with a note. A frame without a face is passed through and the smoother restarts.
 * A stylized simulation, not a prediction of age, sex or gender identity. The still filters'
 * Arena gates have not been run on video. Author: John Khan.
 */
import type { PhotoSource, ShellLayer } from "../../ui/shell/types.js";
import { renderLayers } from "../../ui/shell/pipeline.js";
import { appearanceStackReport } from "../../ui/shell/appearance-stack.js";
import { type EffectOutput, type Frame, type FrameEffect, type FrameInputs, copyFrame } from "./frames.js";
import { PointSmoother } from "./temporal.js";

export const LABEL = "Video appearance simulation (age, gender). Not a prediction of age, sex or gender identity.";
export type AppearanceMode = "older" | "younger" | "gender" | "gender_older" | "gender_younger";
export const APPEARANCE_MODES: readonly { id: AppearanceMode; title: string }[] = [
  { id: "older", title: "Older" }, { id: "younger", title: "Younger" }, { id: "gender", title: "Masculine or feminine" },
  { id: "gender_older", title: "Masculine or feminine, and older" }, { id: "gender_younger", title: "Masculine or feminine, and younger" },
];
export interface AppearanceSettings { mode: AppearanceMode; stop?: number; slider?: number }

function layer(kind: "older" | "younger" | "gender", params: Record<string, number>, strength: number): ShellLayer {
  return { id: `video-${kind}`, kind, name: kind, enabled: true, opacity: 1, strength, parameters: params,
    provenance: "local", simulation: true, origin: "photo" };
}

/** The editor layers for a mode, as the stills would have them. */
export function appearanceLayers(settings: AppearanceSettings, strength: number): ShellLayer[] {
  const { mode, stop = 2, slider = 33 } = settings;
  if (!APPEARANCE_MODES.some((m) => m.id === mode)) throw new RangeError("unknown video appearance");
  if (!Number.isFinite(slider) || slider < -100 || slider > 100) throw new RangeError("Appearance direction must be -100 to 100.");
  const out: ShellLayer[] = [];
  if (mode.startsWith("gender")) out.push(layer("gender", { slider }, strength));
  if (mode.endsWith("older")) out.push(layer("older", { stop }, strength));
  if (mode.endsWith("younger")) out.push(layer("younger", { stop: Math.min(3, stop) }, strength));
  return out;
}

export class VideoAppearance implements FrameEffect {
  readonly id = "appearance";
  readonly label = LABEL;
  private readonly points = new PointSmoother();
  lastPoints: readonly (readonly [number, number])[] | null = null;
  constructor(readonly settings: AppearanceSettings = { mode: "older" }) { appearanceLayers(settings, 50); }

  apply(frame: Frame, inputs: FrameInputs, strength: number): EffectOutput {
    if (!inputs.points || inputs.points.length !== 478) {
      this.reset();
      return { image: copyFrame(frame.image), changed: false, note: "No face on some frames; they were left unchanged." };
    }
    const steady = this.points.smooth(inputs.points, frame.t);
    this.lastPoints = steady;
    if (strength === 0) return { image: copyFrame(frame.image), changed: false, note: "" };
    const source: PhotoSource = { id: "video-frame", label: "Video frame", kind: "uploaded", image: frame.image, face: steady, disposable: true };
    const layers = appearanceLayers(this.settings, strength);
    const rendered = renderLayers(source, layers).image;
    const check = appearanceStackReport(source, layers, rendered);
    if (!check.passed) return { image: copyFrame(frame.image), changed: false, note: "A frame failed the appearance check and was left unchanged." };
    // The pipeline works in RGB; the frame keeps its own alpha byte for byte.
    const image = copyFrame(frame.image), c = image.channels;
    for (let i = 0; i < image.width * image.height; i++) for (let k = 0; k < 3; k++) image.data[i * c + k] = rendered.data[i * rendered.channels + k];
    return { image, changed: check.changedPixels > 0, note: "" };
  }

  reset(): void { this.points.reset(); this.lastPoints = null; }
}
