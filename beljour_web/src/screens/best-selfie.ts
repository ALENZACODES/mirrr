/** Best selfie panel: choose 2 to 12 photos of yourself, see them ranked by the photo checks and
 * eyes open, with the reason for each place, and open the one you want. Photos are read on this
 * device only and nothing is kept after the panel closes. Author: John Khan.
 */
import { h } from "../dom.js";
import { paint } from "../ui/shell/canvas.js";
import type { ByteImage } from "../engines/core/buffer.js";
import type { Point2 } from "../engines/warp/field.js";
import { readLocalImage, uploadedSource } from "../ui/shell/demo.js";
import { appConsent } from "../ui/shell/consent.js";
import { MAX_PHOTOS, rankSelfies, SelfieError, type SelfieInput } from "../ui/shell/best-selfie.js";
import type { PhotoSource } from "../ui/shell/types.js";
import { defaultVisionClient } from "../vision/client.js";
import { toRGBA } from "../engines/core/buffer.js";

/** Points from the on-device face model when it is ready and finds exactly one face; else none. */
export async function devicePoints(image: ByteImage): Promise<readonly Point2[] | null> {
  const client = defaultVisionClient();
  if (!client.ready("face-landmarks")) return null;
  const result = await client.detect("face-landmarks", { width: image.width, height: image.height, rgba: Uint8ClampedArray.from(toRGBA(image)).buffer });
  if (!result.ok || result.faces?.length !== 1) return null;
  return result.faces[0].landmarks.map((p) => [p.x * image.width, p.y * image.height] as Point2);
}

export interface BestSelfieDeps {
  read?: (file: File) => Promise<ByteImage>;
  /** Face points for a photo when an on-device face model is available; null otherwise. */
  points?: (image: ByteImage) => Promise<readonly Point2[] | null>;
  consent?: () => boolean;
  paint?: typeof paint;
}

export function bestSelfieScreen(open: (source: PhotoSource) => void, deps: BestSelfieDeps = {}): HTMLElement {
  const input = h("input", { type: "file", multiple: true, accept: "image/jpeg,image/png,image/webp", "aria-label": "Photos to compare" }) as HTMLInputElement;
  const status = h("p", { role: "status", "aria-live": "polite", class: "fine" });
  const list = h("ol", { class: "best-selfie-list" });
  let ticket = 0;
  const run = async (files: File[]): Promise<void> => {
    const own = ++ticket;
    list.replaceChildren();
    try {
      if (!(deps.consent ?? (() => appConsent.hasVisit))()) throw new Error("Confirm adult photo consent before comparing photos.");
      if (files.length > MAX_PHOTOS) throw new SelfieError("too_many_photos", `Compare at most ${MAX_PHOTOS} photos at a time.`);
      status.textContent = "Checking your photos on this device…";
      const inputs: SelfieInput[] = [];
      for (const [i, file] of files.entries()) {
        const image = await (deps.read ?? readLocalImage)(file);
        const face = await (deps.points ?? devicePoints)(image);
        inputs.push({ id: `photo-${i + 1}`, label: `Photo ${i + 1}`, image, face, file: { type: file.type, bytes: file.size } });
      }
      if (own !== ticket) return;
      const ranking = rankSelfies(inputs);
      const images = new Map(inputs.map((x) => [x.id, x.image]));
      for (const row of ranking.rows) {
        const canvas = h("canvas", { role: "img", "aria-label": row.label, style: { maxWidth: "8rem", height: "auto" } });
        try { (deps.paint ?? paint)(canvas, images.get(row.id)!, { simulate: false }); } catch { canvas.replaceChildren(row.label); }
        const use = h("button", { type: "button", class: row.id === ranking.best ? "btn btn-primary" : "btn btn-quiet", onclick: () => {
          open(uploadedSource(images.get(row.id)!, `upload:${row.id}-${Date.now().toString(36)}`));
          status.textContent = `${row.label} is open in the editor. No upload occurred.`;
        } }, `Use ${row.label}`);
        use.disabled = !row.usable;
        list.append(h("li", {}, canvas, h("p", {}, h("strong", {}, `${row.rank}. ${row.label}`)), h("p", { class: "fine" }, row.why), use));
      }
      status.textContent = [ranking.summary, ...ranking.notes].join(" ");
    } catch (error) {
      if (own === ticket) status.textContent = error instanceof Error ? error.message : String(error);
    }
  };
  input.addEventListener("change", async () => { const files = [...(input.files ?? [])]; input.value = ""; await run(files); });
  return h("section", { class: "best-selfie", "aria-label": "Best selfie" },
    h("h2", {}, "Best selfie"),
    h("p", {}, "Choose 2 to 12 photos of yourself. They are ranked by sharpness, light, framing and eyes open, and each one says why."),
    h("p", { class: "fine" }, "Photo quality only: it does not judge looks or recognise anyone. Photos stay on this device."),
    h("label", {}, "Photos ", input), status, list);
}
