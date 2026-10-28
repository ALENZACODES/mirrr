/** Before / after video panel: record a 4-second clip of the original and the edit on this device
 * and save it. Nothing is uploaded. Author: John Khan.
 */
import { h } from "../dom.js";
import type { ByteImage } from "../engines/core/buffer.js";
import { downloadFile, type DownloadFile } from "../save/download.js";
import { lookSlug } from "../save/export.js";
import { FPS, recordBeforeAfter, SECONDS, VideoRefused, type RecordDeps } from "../save/before-after-video.js";

export interface VideoSource {
  readonly source: { image: ByteImage };
  rendered(): { image: ByteImage; labels: string[] };
}

export function browserRecordDeps(): RecordDeps {
  return {
    canvas: (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c as unknown as ReturnType<RecordDeps["canvas"]>; },
    imageData: (data, w, h) => new ImageData(new Uint8ClampedArray(data), w, h),
    supported: (mime) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime),
    tick: () => new Promise((resolve) => setTimeout(resolve, 1000 / FPS)),
  };
}

export function beforeAfterScreen(editor: VideoSource, lookName: string,
  deps: { record?: RecordDeps; download?: DownloadFile; simulationLabel?: () => boolean } = {}): HTMLElement {
  const status = h("p", { role: "status", "aria-live": "polite", class: "fine" }, `Records ${SECONDS} seconds: your photo, a wipe, then your edit.`);
  const record = h("button", { type: "button", class: "btn btn-primary" }, "Record before / after") as HTMLButtonElement;
  record.addEventListener("click", async () => {
    record.disabled = true;
    status.textContent = "Recording on this device…";
    try {
      const shot = editor.rendered();
      const clip = await recordBeforeAfter(editor.source.image, shot.image, deps.record ?? browserRecordDeps(), {
        simulationLabel: (deps.simulationLabel ?? (() => true))(), isSimulation: shot.labels.some((l) => /simulat|photo edit/i.test(l)) });
      const ext = clip.mime.startsWith("video/mp4") ? "mp4" : "webm";
      const name = `GoodLookin_${lookSlug(lookName)}_BeforeAfter.${ext}`;
      (deps.download ?? downloadFile)(name, clip.mime.split(";")[0], new Uint8Array(await clip.blob.arrayBuffer()));
      status.textContent = `Saved ${name} (${clip.seconds} s, ${clip.width} x ${clip.height}).${clip.label ? " The edit is labelled Simulation." : ""}`;
    } catch (error) {
      status.textContent = error instanceof VideoRefused || error instanceof Error ? error.message : String(error);
    } finally { record.disabled = false; }
  });
  return h("section", { class: "before-after-video", "aria-label": "Before and after video" },
    h("h2", {}, "Before / after video"),
    h("p", { class: "fine" }, "Made and saved on this device; nothing is uploaded. The Simulation label follows your Trust Centre switch."),
    record, status);
}
