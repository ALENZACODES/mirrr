/** The per-frame effects offered on the Video and live screen, with what each one needs
 * measured on every frame. Author: John Khan.
 */
import type { FrameEffect } from "./frames.js";
import { type Backdrop, BACKDROPS, VideoBackground } from "./background.js";
import { LIVE_FILTERS, LiveArFilter } from "./ar-filters.js";
import { VideoEnhance } from "./enhance.js";
import { VideoRetouch } from "./retouch.js";
import { type AppearanceMode, VideoAppearance } from "./appearance.js";

export interface EffectOptions { backdrop?: Backdrop; filter?: string; appearance?: AppearanceMode }
export interface EffectChoice { id: string; title: string; needsFace: boolean; needsPerson: boolean; make(options?: EffectOptions): FrameEffect }
export const BACKDROP_NAMES = [...Object.keys(BACKDROPS), "soft"] as const;
export function backdropFor(name: string): Backdrop {
  return name === "soft" ? { kind: "soft" } : { kind: "colour", name };
}

export const EFFECTS: readonly EffectChoice[] = [
  { id: "retouch", title: "Skin smoothing, texture kept", needsFace: true, needsPerson: false, make: () => new VideoRetouch() },
  { id: "background", title: "Background change", needsFace: false, needsPerson: true,
    make: (options = {}) => new VideoBackground(options.backdrop ?? { kind: "colour", name: "ivoire" }) },
  { id: "enhance", title: "Enhance (light, noise, fading)", needsFace: false, needsPerson: false, make: () => new VideoEnhance() },
  { id: "ar_filter", title: "Live filter", needsFace: true, needsPerson: false,
    make: (options = {}) => new LiveArFilter(options.filter ?? LIVE_FILTERS[0].id) },
  { id: "appearance", title: "Age and gender appearance", needsFace: true, needsPerson: false,
    make: (options = {}) => new VideoAppearance({ mode: options.appearance ?? "older" }) },
];

export function effectChoice(id: string): EffectChoice {
  const found = EFFECTS.find((e) => e.id === id);
  if (!found) throw new RangeError(`no video effect ${JSON.stringify(id)}`);
  return found;
}
