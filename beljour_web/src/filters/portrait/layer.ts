/**
 * The portrait-look layer kind in the studio shell: what a "portrait" layer stores, how it
 * renders and the options its strip shows. A layer is one ShellLayer with kind "portrait":
 * strength is the 0-100 slider and the one parameter `look` names the look (PL01 ...). Undo,
 * history, compare and My Looks work as for every other layer. Every result is labelled a
 * local simulation; the look runs only with the photo's own 478 face points.
 * Author: John Khan.
 */
import type { ByteImage } from "../../engines/core/buffer.js";
import type { LayerResult, ParamValue, PhotoSource, ShellLayer } from "../../ui/shell/types.js";
import { portraitLook, portraitLooks } from "./looks.js";
import { renderPortrait } from "./compose.js";

export const DEFAULT_LOOK = "PL01";

export function defaultPortraitParams(lookId: string = DEFAULT_LOOK): Record<string, ParamValue> {
  if (!portraitLook(lookId)) throw new RangeError("Pick a portrait look");
  return { look: lookId };
}

export interface PortraitOption { id: string; look: string; label: string; description: string; rank: number;
  params: Record<string, ParamValue>; strength: number; sparkle: boolean }

/** Every look in its own order, at its gentle default. */
export function portraitOptions(): PortraitOption[] {
  return portraitLooks().map((look) => ({ id: `portrait:look:${look.id}`, look: look.id, label: look.name,
    description: look.description, rank: look.recipe.rank, params: defaultPortraitParams(look.id),
    strength: look.recipe.defaults.strength, sparkle: look.sparkle !== null }));
}

export function applyPortraitLayer(img: ByteImage, source: PhotoSource, layer: ShellLayer): LayerResult {
  const id = layer.parameters.look;
  if (typeof id !== "string" || !portraitLook(id)) throw new RangeError("Pick a portrait look");
  const result = renderPortrait(img, source.face, id, layer.strength);
  if (result.status === "refused") throw new Error(`${result.name} was not applied (${result.code}). ${result.notes.join(" ")}`);
  const image: ByteImage = { width: img.width, height: img.height, channels: 3, data: new Uint8Array(img.width * img.height * 3) };
  for (let p = 0; p < img.width * img.height; p++) {
    for (let c = 0; c < 3; c++) image.data[p * 3 + c] = result.image.data[p * result.image.channels + c];
  }
  const i = result.identity;
  return { image, label: `Local simulation · ${result.name}`, metrics: { look: result.look, name: result.name,
    strength_used: result.strength, status: result.status, glints: result.glints,
    marks_found: i?.marksFound ?? 0, marks_kept: i?.marksKept ?? 0, skin_lift: i?.skinLift ?? 0,
    polish_used: i?.polishUsed ?? 0, label: result.label, notes: result.notes.join(" ") } };
}
