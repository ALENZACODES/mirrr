/** The photo studio and the illustration looks as shell layer kinds.
 *
 * "studio": background blur (#57), backdrop replace (#58, #68), relight, headshot studio (#62)
 * and authenticity mode (#63), from web/src/engines/studio. The person area comes from the
 * photo source (the person segmenter on this device or her own marking) and the face points
 * from her recorded points; neither is ever guessed. A coded refusal becomes a plain message.
 * "illustration": the four procedural looks of web/src/filters/artistic/illustration.ts
 * (#67, #83, #84), on her own photo.
 * Author: John Khan.
 */
import type { ByteImage } from "../../engines/core/buffer.js";
import { BACKDROPS } from "../../engines/studio/backdrops.js";
import { StudioRefusal } from "../../engines/studio/common.js";
import { INDUSTRIES } from "../../engines/studio/headshot.js";
import { SIDES } from "../../engines/studio/relight.js";
import { renderStudio } from "../../engines/studio/studio.js";
import { illustrate, LOOKS } from "../../engines/studio/illustration.js";
import type { LayerResult, ParamValue, PhotoSource, ShellLayer } from "./types.js";

/** Tools the editor layer runs. Background removal (transparent PNG) stays in the engine until export carries alpha. */
export const STUDIO_LAYER_TOOLS = ["blur", "replace", "relight", "headshot", "authentic"] as const;
export type StudioLayerTool = typeof STUDIO_LAYER_TOOLS[number];
export const STUDIO_TOOL_NAMES: Readonly<Record<StudioLayerTool, string>> = Object.freeze({
  blur: "Background blur", replace: "Backdrop", relight: "Relight", headshot: "Headshot studio", authentic: "Authenticity mode",
});
export const STUDIO_DEFAULTS: Readonly<Record<string, ParamValue>> = Object.freeze({
  tool: "blur", backdrop: "chinon", side: "upper-left", industry: "technology",
});
export const ILLUSTRATION_DEFAULTS: Readonly<Record<string, ParamValue>> = Object.freeze({ look: "sancerre-cartoon" });
/** Tools that also need her 478 face points. */
export const NEEDS_FACE: ReadonlySet<string> = new Set(["relight", "headshot", "authentic"]);

function text(layer: ShellLayer, key: string, defaults: Readonly<Record<string, ParamValue>>): string {
  const value = layer.parameters[key] ?? defaults[key];
  return typeof value === "string" ? value : String(defaults[key]);
}

export function studioTool(layer: ShellLayer): StudioLayerTool {
  const tool = text(layer, "tool", STUDIO_DEFAULTS);
  if (!(STUDIO_LAYER_TOOLS as readonly string[]).includes(tool)) throw new RangeError("Unknown studio tool");
  return tool as StudioLayerTool;
}

function asRGB(image: ByteImage, data: Uint8Array, channels: number): ByteImage {
  if (channels === image.channels) return { ...image, data };
  const out = new Uint8Array(image.width * image.height * image.channels);
  for (let i = 0; i < image.width * image.height; i++) for (let k = 0; k < image.channels; k++) out[i * image.channels + k] = k < 3 ? data[i * channels + k] : 255;
  return { ...image, data: out };
}

export function applyStudioLayer(image: ByteImage, source: PhotoSource, layer: ShellLayer): LayerResult | null {
  if (layer.kind === "illustration") {
    const look = text(layer, "look", ILLUSTRATION_DEFAULTS);
    if (!Object.hasOwn(LOOKS, look)) throw new RangeError("Unknown illustration look");
    const result = illustrate(look, image, { amount: Math.min(1, Math.max(0, layer.strength / 100)) });
    return { image: { ...image, data: Uint8Array.from(result.image) }, label: result.label, metrics: { look, geometry_displacement: 0 } };
  }
  if (layer.kind !== "studio") return null;
  const tool = studioTool(layer);
  const backdrop = text(layer, "backdrop", STUDIO_DEFAULTS), side = text(layer, "side", STUDIO_DEFAULTS);
  const industry = text(layer, "industry", STUDIO_DEFAULTS);
  if (!Object.hasOwn(BACKDROPS, backdrop) || !Object.hasOwn(SIDES, side) || !Object.hasOwn(INDUSTRIES, industry)) throw new RangeError("Unknown studio option");
  try {
    const result = renderStudio(tool, image, source.person?.data, source.face as readonly (readonly [number, number])[] | undefined,
      { strength: layer.strength, backdrop, side, industry });
    const metrics: Record<string, number | string | boolean> = { ...result.metrics, mask_source: "person area" };
    result.crops.forEach(([name, x, y, w, h]) => { metrics[`crop_${name}`] = `${x},${y},${w}x${h}`; });
    return { image: asRGB(image, result.image, result.channels), label: result.label, metrics };
  } catch (error) {
    if (error instanceof StudioRefusal) throw new RangeError(error.message);
    throw error;
  }
}
