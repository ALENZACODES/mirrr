/** Export sizes panel: one button per size, each saves the edited photo in that shape straight
 * away. Rendered and encoded on this device; nothing is uploaded and no watermark is added for
 * anyone. Author: John Khan.
 */
import { h } from "../dom.js";
import type { ByteImage } from "../engines/core/buffer.js";
import type { Point2 } from "../engines/warp/field.js";
import { canvasEncoder, type CanvasEncoder } from "../save/export.js";
import { downloadFile, type DownloadFile } from "../save/download.js";
import { exportSize, PRESETS, SizeRefused } from "../save/size-presets.js";

export interface SizeSource {
  /** The edited photo at the editor's working size, its face points (after any reshape) and labels. */
  rendered(): { image: ByteImage; labels: string[]; face?: readonly Point2[] };
}
export interface SizeDeps { encoder?: CanvasEncoder; download?: DownloadFile; simulationLabel?: () => boolean }

export function exportSizesScreen(source: SizeSource, lookName: string, deps: SizeDeps = {}): HTMLElement {
  const status = h("p", { role: "status", "aria-live": "polite", class: "fine" }, "Pick a size. Each button saves one file.");
  const buttons = PRESETS.map((p) => {
    const button = h("button", { type: "button", class: "btn btn-quiet", "data-size": p.id }, `${p.label} (${p.note})`) as HTMLButtonElement;
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        const shot = source.rendered();
        const { file, plan } = await exportSize(shot.image, p.id, deps.encoder ?? canvasEncoder(), {
          lookName, face: shot.face, simulationLabel: (deps.simulationLabel ?? (() => true))(),
          isSimulation: shot.labels.some((l) => /simulat|photo edit/i.test(l)) });
        (deps.download ?? downloadFile)(file.name, "image/jpeg", file.bytes);
        status.textContent = `Saved ${file.name} (${plan.width} x ${plan.height}). ${plan.note}`.trim();
      } catch (error) {
        status.textContent = error instanceof SizeRefused || error instanceof Error ? error.message : String(error);
      } finally { button.disabled = false; }
    });
    return button;
  });
  return h("section", { class: "export-sizes", "aria-label": "Export sizes" },
    h("h2", {}, "Export sizes"),
    h("p", {}, "One tap per size. Your face stays in the frame; if a size would cut it, the app says so instead."),
    h("p", { class: "fine" }, "No watermark, free or paid. The Simulation label follows your Trust Centre switch. Location and camera details are removed."),
    h("div", { class: "export-sizes-buttons" }, ...buttons), status);
}
