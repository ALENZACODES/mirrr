/** Image ownership for Judge Mode: nothing is stored, uploaded or sent to analytics. */
import { DRAW_HEIGHT, DRAW_WIDTH, drawSyntheticPortrait } from "./judge-canvas.js";
import { validateJudgeDimensions, validateJudgeUpload } from "../../layout/judge-contract.js";
import { DRAWN_PAIR, type SubjectBox, type SubjectDetectionPort } from "../../layout/subjects/contract.js";
import { SubjectDiscovery } from "../../layout/subjects/discovery.js";
import { drawTwoPersonSample } from "./subject-drawing.js";

export type ImageDecoder = (blob: Blob, options?: ImageBitmapOptions) => Promise<ImageBitmap>;

export class JudgeImage {
  readonly original: HTMLCanvasElement;
  private disposed = false;
  private generation = 0;
  private ready = false;
  readonly subjects: SubjectDiscovery;
  private mode: "none" | "single" | "pair" | "upload" = "none";

  constructor(doc: Document, adapter: SubjectDetectionPort | null = null) {
    this.subjects = new SubjectDiscovery(adapter);
    this.original = doc.createElement("canvas");
    this.original.width = DRAW_WIDTH;
    this.original.height = DRAW_HEIGHT;
  }

  get hasImage(): boolean {
    return this.ready && !this.disposed;
  }

  sample(): void {
    this.assertActive();
    this.generation += 1;
    this.mode = "single";
    this.subjects.reset();
    drawSyntheticPortrait(this.original);
    this.ready = true;
  }

  samplePair(): void {
    this.assertActive();
    this.generation += 1;
    this.mode = "pair";
    drawTwoPersonSample(this.original);
    this.subjects.seedDrawn(DRAWN_PAIR);
    this.ready = true;
  }

  get activeSubject(): SubjectBox | null {
    return this.subjects.selection.active;
  }

  get canIllustrate(): boolean {
    return this.mode === "single" || this.activeSubject !== null;
  }

  get allowUntrackedDrawing(): boolean {
    return this.mode === "single";
  }

  chooseSubject(id: string): boolean {
    return this.subjects.selection.choose(id);
  }

  /** Decode a local selection; no object URL, fetch, server or hidden persistence. */
  async upload(file: File, decode: ImageDecoder = createImageBitmap): Promise<boolean> {
    this.assertActive();
    const validation = validateJudgeUpload(file);
    if (validation) throw new Error(validation);
    const revision = ++this.generation;
    this.mode = "upload";
    this.subjects.reset();
    const image = await decode(file, { imageOrientation: "from-image" });
    try {
      if (this.disposed || revision !== this.generation) return false;
      const dimensions = validateJudgeDimensions(image.width, image.height);
      if (dimensions) throw new Error(dimensions);
      const ctx = this.original.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("Canvas preview is unavailable on this device.");
      this.original.width = DRAW_WIDTH;
      this.original.height = DRAW_HEIGHT;
      const scale = Math.min(DRAW_WIDTH / image.width, DRAW_HEIGHT / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      const x = (DRAW_WIDTH - width) / 2;
      const y = (DRAW_HEIGHT - height) / 2;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, DRAW_WIDTH, DRAW_HEIGHT);
      ctx.drawImage(image, x, y, width, height);
      this.ready = true;
      await this.subjects.find(this.original);
      return true;
    } finally {
      image.close();
    }
  }

  invalidate(): void {
    if (this.disposed) return;
    this.generation += 1;
    this.original.width = 0;
    this.original.height = 0;
    this.ready = false;
    this.mode = "none";
    this.subjects.reset();
  }

  dispose(): void {
    if (this.disposed) return;
    this.invalidate();
    this.disposed = true;
    this.subjects.dispose();
  }

  private assertActive(): void {
    if (this.disposed) throw new Error("This demonstration has ended.");
  }
}
