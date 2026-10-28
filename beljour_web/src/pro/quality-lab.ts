/** BELJOUR Quality Generator lab section for the owned recorder page.
 * Open a photo on this device (JPEG, PNG or WebP, checked and decoded locally),
 * mark the face as an ellipse and confirm it, or state there is no person. Pick
 * HD 1080 (long edge 1920) or 4K (long edge 3840, experimental until checked on
 * physical devices); the source aspect is kept, with no crop or padding. Move
 * the 1.0..5.0 detail and denoise sliders (live preview, long edge 640) with the
 * face lock at 5.0 by default, render the full tier and save a JPEG or PNG copy.
 * The Simulation label is on unless the box is cleared, and saved files carry
 * no camera metadata. Paired drawn-chart diagnostics and local timings are
 * shown as diagnostics only. An optional verified local model session (r38e)
 * switches rendering to the reviewed model chain; without one the ordinary
 * mount stays on the classical engine. No upload, no network. Author: John Khan.
 */
import type { CanvasEncoder } from "../save/export.js";
import type { RgbaRaster } from "../engines/upscale/colour-export.js";
import type { Resizer } from "../engines/upscale/quality-generator.js";
import type { AnyTierResult, ProcessedPairedReport } from "../engines/upscale/quality-model-chain.js";
import type { LocalVerifiedModelSession } from "../engines/upscale/quality-model-loader.js";
import { TierRefused, type QualityTierName } from "../engines/upscale/quality-tier.js";
import { QualityTierSession, StaleQualityJob } from "./quality-session.js";

export interface DecodedPhoto {
  readonly digest: string;
  readonly image: RgbaRaster;
}

export type PhotoDecoder = (file: Blob) => Promise<DecodedPhoto>;

export interface QualityLabOptions {
  readonly decoder?: PhotoDecoder;
  readonly resizer?: Resizer;
  readonly encoder?: CanvasEncoder;
  readonly clock?: () => number;
  /** Verified local model runtime; omitted on the ordinary page, which stays classical. */
  readonly models?: LocalVerifiedModelSession | null;
  readonly onPreview?: (result: AnyTierResult) => void;
  readonly onRelease?: (result: AnyTierResult) => void;
  readonly onSave?: (file: { name: string; blob: Blob; label: string | null }) => void;
}

export interface QualityLabControls {
  readonly file: HTMLInputElement;
  readonly faceX: HTMLInputElement;
  readonly faceY: HTMLInputElement;
  readonly faceWidth: HTMLInputElement;
  readonly faceHeight: HTMLInputElement;
  readonly confirmFace: HTMLButtonElement;
  readonly noPerson: HTMLButtonElement;
  readonly detail: HTMLInputElement;
  readonly denoise: HTMLInputElement;
  readonly lock: HTMLInputElement;
  readonly tier: HTMLSelectElement;
  readonly render: HTMLButtonElement;
  readonly format: HTMLSelectElement;
  readonly label: HTMLInputElement;
  readonly save: HTMLButtonElement;
  readonly diagnose: HTMLButtonElement;
  readonly preview: HTMLCanvasElement;
  readonly diagnostics: HTMLElement;
  readonly budget: HTMLElement;
  readonly status: HTMLElement;
}

export interface QualityLab {
  readonly session: QualityTierSession;
  readonly controls: QualityLabControls;
  openFile(file: Blob): Promise<void>;
  confirmFace(): Promise<void>;
  declareNoPerson(): Promise<void>;
  chooseTier(tier: QualityTierName): Promise<void>;
  renderRelease(): Promise<AnyTierResult | null>;
  save(): Promise<boolean>;
  runDiagnostics(): Promise<ProcessedPairedReport | null>;
  dispose(): void;
}

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
}

/** Browser decoder: type and size checked, decoded with createImageBitmap, bytes hashed. */
export const browserDecoder: PhotoDecoder = async (file) => {
  if (!TYPES.has(file.type) || file.size < 1 || file.size > MAX_FILE_BYTES) {
    throw new RangeError("Choose a JPEG, PNG or WebP photo under 25 MB.");
  }
  const bytes = await file.arrayBuffer();
  const bitmap = await createImageBitmap(new Blob([bytes], { type: file.type }));
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No 2D canvas is available.");
    context.drawImage(bitmap, 0, 0);
    const data = new Uint8ClampedArray(context.getImageData(0, 0, bitmap.width, bitmap.height).data);
    return { digest: await sha256Hex(bytes), image: { width: bitmap.width, height: bitmap.height, data } };
  } finally {
    bitmap.close();
  }
};

/** Elliptical face coverage from percentages of the photo size. */
export function ellipseMask(width: number, height: number, centreX: number, centreY: number,
  spanX: number, spanY: number): Uint8Array {
  const values = [centreX, centreY, spanX, spanY];
  if (values.some(value => !Number.isFinite(value) || value < 0 || value > 100) || spanX <= 0 || spanY <= 0) {
    throw new RangeError("Face area values must be percentages");
  }
  const mask = new Uint8Array(width * height);
  const cx = centreX / 100 * width, cy = centreY / 100 * height;
  const rx = spanX / 200 * width, ry = spanY / 200 * height;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) mask[y * width + x] = 255;
    }
  }
  return mask;
}

function element<K extends keyof HTMLElementTagNameMap>(doc: Document, tag: K,
  attributes: Record<string, string> = {}, text = ""): HTMLElementTagNameMap[K] {
  const node = doc.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  if (text) node.textContent = text;
  return node;
}

function labelled(doc: Document, text: string, control: HTMLElement): HTMLLabelElement {
  const label = element(doc, "label", {}, `${text} `);
  label.append(control);
  return label;
}

function numberInput(doc: Document, value: string, min: string, max: string, step: string): HTMLInputElement {
  const input = element(doc, "input", { type: "number", min, max, step });
  input.value = value;
  return input;
}

function draw(canvas: HTMLCanvasElement, image: RgbaRaster): void {
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext?.("2d");
  const scope = globalThis as unknown as { ImageData?: typeof ImageData };
  if (context && scope.ImageData) {
    context.putImageData(new scope.ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0);
  }
}

/** Hand the file to the browser's own save prompt; the object URL is revoked at once after. */
function downloadLocally(doc: Document, name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = element(doc, "a", { href: url, download: name });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function mountQualityLab(host: HTMLElement, options: QualityLabOptions = {}): QualityLab {
  const doc = host.ownerDocument;
  const session = new QualityTierSession({ resizer: options.resizer, clock: options.clock, models: options.models });
  const decoder = options.decoder ?? browserDecoder;
  const range = (value: string): HTMLInputElement => {
    const input = element(doc, "input", { type: "range", min: "1", max: "5", step: "0.1" });
    input.value = value;
    return input;
  };
  const tier = element(doc, "select", { "aria-label": "Output size" });
  tier.append(element(doc, "option", { value: "hd1080" }, "HD 1080 (long edge 1920)"),
    element(doc, "option", { value: "uhd4k" }, "4K (long edge 3840, experimental)"));
  tier.value = "hd1080";
  const format = element(doc, "select", { "aria-label": "File type" });
  format.append(element(doc, "option", { value: "image/jpeg" }, "JPEG"), element(doc, "option", { value: "image/png" }, "PNG"));
  const label = element(doc, "input", { type: "checkbox" });
  label.checked = true;
  const controls: QualityLabControls = {
    file: element(doc, "input", { type: "file", accept: "image/jpeg,image/png,image/webp" }),
    faceX: numberInput(doc, "50", "0", "100", "0.1"),
    faceY: numberInput(doc, "40", "0", "100", "0.1"),
    faceWidth: numberInput(doc, "30", "0.1", "100", "0.1"),
    faceHeight: numberInput(doc, "40", "0.1", "100", "0.1"),
    confirmFace: element(doc, "button", { type: "button" }, "Confirm face area"),
    noPerson: element(doc, "button", { type: "button" }, "No person in this photo"),
    detail: range("3"),
    denoise: range("2"),
    lock: range("5"),
    tier,
    render: element(doc, "button", { type: "button" }, "Render full size"),
    format,
    label,
    save: element(doc, "button", { type: "button" }, "Save local copy"),
    diagnose: element(doc, "button", { type: "button" }, "Run paired diagnostic"),
    preview: element(doc, "canvas", { width: "640", height: "360", role: "img", "aria-label": "Quality Generator preview" }),
    diagnostics: element(doc, "p", { class: "fine" }),
    budget: element(doc, "p", { class: "fine" }),
    status: element(doc, "p", { role: "status", "aria-live": "polite" }),
  };
  controls.render.disabled = true;
  controls.save.disabled = true;
  const root = element(doc, "div", { class: "quality-lab" });
  root.append(
    element(doc, "h2", {}, "BELJOUR Quality Generator"),
    element(doc, "p", { class: "fine" },
      "Simulation. Local denoise, resize and the photo's own texture; no content is invented and marked face " +
      "pixels stay locked. This is a pixel guard, not identity verification. Nothing is uploaded."),
    labelled(doc, "Photo", controls.file),
    labelled(doc, "Face centre X %", controls.faceX), labelled(doc, "Face centre Y %", controls.faceY),
    labelled(doc, "Face width %", controls.faceWidth), labelled(doc, "Face height %", controls.faceHeight),
    controls.confirmFace, controls.noPerson,
    labelled(doc, "Detail", controls.detail), labelled(doc, "Denoise", controls.denoise),
    labelled(doc, "Face lock", controls.lock),
    labelled(doc, "Output", controls.tier), controls.render,
    labelled(doc, "File type", controls.format), labelled(doc, "Include Simulation label", controls.label),
    controls.save, controls.diagnose, controls.preview, controls.diagnostics, controls.budget, controls.status,
  );
  host.append(root);
  let latest: AnyTierResult | null = null;
  let disposed = false;

  const say = (message: string): void => { controls.status.textContent = message; };
  const levels = (): void => {
    session.setLevels({ detailLevel: Number(controls.detail.value), denoiseLevel: Number(controls.denoise.value),
      lockLevel: Number(controls.lock.value) });
  };
  const failure = (error: unknown): void => {
    if (error instanceof StaleQualityJob || (error as { name?: string })?.name === "AbortError") return;
    say(error instanceof TierRefused || error instanceof RangeError ? error.message : "That step failed on this device.");
  };
  const showBudget = (): void => {
    try {
      const report = session.budget();
      controls.budget.textContent = `Preview: ${report.preview}${report.previewMs === null ? "" : ` (${report.previewMs} ms)`}. ` +
        `Export: ${report.export}${report.exportMs === null ? "" : ` (${report.exportMs} ms)`}. Quality: ${report.quality}.`;
    } catch {
      controls.budget.textContent = "";
    }
  };
  const resetRelease = (): void => {
    latest = null;
    controls.save.disabled = true;
  };

  async function refreshPreview(): Promise<void> {
    try {
      levels();
      const result = await session.preview();
      if (disposed) return;
      draw(controls.preview, result.image);
      showBudget();
      options.onPreview?.(result);
    } catch (error) {
      failure(error);
    }
  }

  const lab: QualityLab = {
    session, controls,
    async openFile(file) {
      resetRelease();
      controls.render.disabled = true;
      try {
        const photo = await decoder(file);
        try {
          session.open(photo.digest, photo.image);
          session.setTier(controls.tier.value === "uhd4k" ? "uhd4k" : "hd1080");
        } finally {
          photo.image.data.fill(0);
        }
        say("Photo opened on this device. Mark and confirm the face area, or state there is no person.");
      } catch (error) {
        failure(error);
        throw error;
      }
    },
    async confirmFace() {
      try {
        const plan = session.plan();
        session.markFace(ellipseMask(plan.sourceWidth, plan.sourceHeight, Number(controls.faceX.value),
          Number(controls.faceY.value), Number(controls.faceWidth.value), Number(controls.faceHeight.value)));
        resetRelease();
        controls.render.disabled = false;
        say("Face area confirmed. It stays locked at 5.0 unless you lower the face lock.");
        await refreshPreview();
      } catch (error) {
        failure(error);
      }
    },
    async declareNoPerson() {
      try {
        session.declareNoPerson();
        resetRelease();
        controls.render.disabled = false;
        say("No person in this photo: detail applies to every pixel.");
        await refreshPreview();
      } catch (error) {
        failure(error);
      }
    },
    async chooseTier(name) {
      try {
        controls.tier.value = name;
        const plan = session.setTier(name);
        resetRelease();
        controls.render.disabled = !session.state.ready;
        say(`${plan.experimental ? "4K (experimental)" : "HD 1080"}: ${plan.width} x ${plan.height}.`);
        if (session.state.ready) await refreshPreview();
      } catch (error) {
        failure(error);
      }
    },
    async renderRelease() {
      try {
        levels();
        resetRelease();
        const result = await session.release();
        if (disposed) return null;
        latest = result;
        draw(controls.preview, result.image);
        controls.save.disabled = false;
        say(`${result.audit.experimental ? "4K (experimental)" : "HD 1080"} ready: ${result.image.width} x ${result.image.height}.`);
        showBudget();
        options.onRelease?.(result);
        return result;
      } catch (error) {
        failure(error);
        return null;
      }
    },
    async save() {
      if (!latest) return false;
      try {
        const type = controls.format.value === "image/png" ? "image/png" : "image/jpeg";
        const file = await session.export(latest, { mime: type, simulationLabel: controls.label.checked }, options.encoder);
        if (options.onSave) options.onSave({ name: file.name, blob: file.blob, label: file.label });
        else downloadLocally(doc, file.name, file.blob);
        showBudget();
        say(file.label ? "Saved with the Simulation label." : "Saved without the Simulation label.");
        return true;
      } catch (error) {
        failure(error);
        return false;
      }
    },
    async runDiagnostics() {
      try {
        const report = await session.diagnostics();
        const measured = report.processing === "local-model-chain" ? "reviewed model chain" : "classical stages";
        controls.diagnostics.textContent = `Drawn-chart diagnostic, ${measured} (${report.width} x ${report.height}): ` +
          `PSNR ${report.pipelinePsnr} dB vs basic resize ${report.baselinePsnr} dB; ` +
          `SSIM ${report.pipelineSsim} vs ${report.baselineSsim}. Not a quality or release pass.`;
        return report;
      } catch (error) {
        failure(error);
        return null;
      }
    },
    dispose() {
      disposed = true;
      latest = null;
      session.close();
      root.remove();
    },
  };

  controls.file.addEventListener("change", () => {
    const file = controls.file.files?.[0];
    if (file) void lab.openFile(file).catch(() => undefined);
  });
  controls.confirmFace.addEventListener("click", () => { void lab.confirmFace(); });
  controls.noPerson.addEventListener("click", () => { void lab.declareNoPerson(); });
  for (const slider of [controls.detail, controls.denoise, controls.lock]) {
    slider.addEventListener("input", () => { void refreshPreview(); });
  }
  controls.tier.addEventListener("change", () => {
    void lab.chooseTier(controls.tier.value === "uhd4k" ? "uhd4k" : "hd1080");
  });
  controls.render.addEventListener("click", () => { void lab.renderRelease(); });
  controls.save.addEventListener("click", () => { void lab.save(); });
  controls.diagnose.addEventListener("click", () => { void lab.runDiagnostics(); });
  return lab;
}

const page = typeof document !== "undefined" ? document.querySelector<HTMLElement>("[data-quality-lab]") : null;
if (page) {
  const lab = mountQualityLab(page);
  window.addEventListener("pagehide", () => lab.dispose(), { once: true });
}
