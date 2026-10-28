/** Export of a guarded upscale release, with the visible label on by default.
 * Only a full-size release result carrying the guarded-path label is accepted;
 * a slider preview, a stale or cancelled ticket, or a relabelled or resized
 * result is refused. Pixels then go through the pre-encoder colour integrity
 * step, the existing local canvas encoder (which burns in the Simulation label
 * unless explicitly switched off) and the existing metadata scrub. Nothing is
 * uploaded. Author: John Khan.
 */
import type { CanvasEncoder } from "../../save/export.js";
import { canvasEncoder } from "../../save/export.js";
import { exportColourSafe, type ColourExport, type ColourExportSettings } from "./colour-export.js";
import type { UpscalePreviewSession, UpscaleTicket } from "./preview-session.js";
import { SAFE_LABEL, type SafeUpscaleResult } from "./safe.js";

export interface SafeExportGate {
  readonly session: UpscalePreviewSession;
  readonly ticket: UpscaleTicket;
}

function rgba(result: SafeUpscaleResult): Uint8ClampedArray {
  const { photo } = result;
  if (photo.channels === 4) return photo.data;
  const out = new Uint8ClampedArray(photo.width * photo.height * 4);
  for (let source = 0, target = 0; source < photo.data.length; source += 3, target += 4) {
    out.set(photo.data.subarray(source, source + 3), target);
    out[target + 3] = 255;
  }
  return out;
}

export async function exportSafeUpscale(
  result: SafeUpscaleResult, name: string, settings: ColourExportSettings = {},
  gate?: SafeExportGate, encoder: CanvasEncoder = canvasEncoder(),
): Promise<ColourExport> {
  if (!result || result.release !== true) throw new RangeError("Only a full-size release can be exported");
  if (result.label !== SAFE_LABEL) throw new RangeError("Export needs the guarded upscale label");
  const { photo, allocation, scale } = result;
  if (photo.width !== allocation.width * scale || photo.height !== allocation.height * scale ||
      photo.data.length !== allocation.outputBytes) {
    throw new RangeError("Upscale result does not match its admitted size");
  }
  if (gate) {
    if (!gate.session.exportable(gate.ticket)) throw new RangeError("This upscale job is no longer current");
    if (gate.ticket.scale !== scale || gate.ticket.detailLevel !== result.detailLevel ||
        gate.ticket.lockLevel !== result.lockLevel || gate.ticket.width !== allocation.width ||
        gate.ticket.height !== allocation.height) {
      throw new RangeError("Upscale result does not match its release ticket");
    }
  }
  return exportColourSafe({ width: photo.width, height: photo.height, data: rgba(result) }, name, settings, encoder);
}
