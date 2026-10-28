/** Skin tools as one shell layer kind, "skin": Freckles, Tan, Matte, Glow and Even tone.
 * The layer's `tool` parameter picks the engine (web/src/engines/skin/studio.ts); the
 * face points come from the photo source, never from a guessed or substituted mesh.
 * Tan removal lightens skin, so it needs the layer's own `allow_lightening` switch,
 * which starts off and is never set by a default or a thumbnail.
 * Author: John Khan.
 */
import type { ByteImage } from "../../engines/core/buffer.js";
import { isRefusal, renderSkinTool, TOOLS, type SkinTool } from "../../engines/skin/studio.js";
import type { LayerResult, ParamValue, PhotoSource, ShellLayer } from "./types.js";

/** Settings a new skin layer starts with: Even tone, tan direction add, lightening off. */
export const SKIN_DEFAULTS: Readonly<Record<string, ParamValue>> = Object.freeze({
  tool: "tone", style: "cassis", density: 50, redness: 50, direction: "add", undertone: "neutral",
  allow_lightening: false, seed: 7,
});
export const SKIN_TOOL_NAMES: Readonly<Record<SkinTool, string>> = Object.freeze({
  freckles: "Freckles", tan: "Tan", matte: "Matte", glow: "Glow", tone: "Even tone",
});

function text(layer: ShellLayer, key: string): string {
  const value = layer.parameters[key] ?? SKIN_DEFAULTS[key];
  return typeof value === "string" ? value : String(SKIN_DEFAULTS[key]);
}
function number(layer: ShellLayer, key: string): number {
  const value = layer.parameters[key];
  return typeof value === "number" && Number.isFinite(value) ? value : Number(SKIN_DEFAULTS[key]);
}

export function skinTool(layer: ShellLayer): SkinTool {
  const tool = text(layer, "tool");
  if (!(TOOLS as readonly string[]).includes(tool)) throw new RangeError("Unknown skin tool");
  return tool as SkinTool;
}

export function applySkinLayer(image: ByteImage, source: PhotoSource, layer: ShellLayer): LayerResult | null {
  if (layer.kind !== "skin") return null;
  const tool = skinTool(layer);
  const result = renderSkinTool(tool, image, source.face, layer.strength, {
    density: number(layer, "density"), seed: Math.round(number(layer, "seed")), direction: text(layer, "direction"),
    undertone: text(layer, "undertone"), allowLightening: layer.parameters.allow_lightening === true,
    style: text(layer, "style"), redness: number(layer, "redness"),
  });
  if (isRefusal(result)) throw new RangeError(result.message);
  return { image: { width: image.width, height: image.height, channels: image.channels, data: result.image },
    label: result.label, metrics: { ...result.metrics, tool, mask_source: "face points" } };
}
