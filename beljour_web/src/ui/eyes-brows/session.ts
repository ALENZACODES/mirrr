/** Revision-safe local preview state. No storage or network. Author: John Khan. */
import { featureById, unavailableReasons, type FeatureId } from "./catalogue.js";
import { cloneImage, validateAnatomy, validateLandmarks, type Anatomy, type EvidenceInput,
  type NormalPoint, type StudioImage } from "./input.js";
import { Observations } from "./observations.js";

export interface PreviewResult {
  pixels: Uint8ClampedArray;
  label: string;
  warnings: string[];
  metrics: Record<string, unknown>;
  elapsedMs: number;
}
export interface PreviewJob {
  id: number;
  image: StudioImage;
  landmarks: NormalPoint[] | null;
  feature: FeatureId;
  amount: number;
  style: string;
  angle: number;
  adultConfirmed: boolean;
  anatomy: { right: Anatomy; left: Anatomy };
  hairMask: Float64Array | null;
  lashes: ReturnType<Observations["traces"]["slice"]>;
  controls: Record<string, number | string | boolean>;
}

export class PreviewSession {
  private source: StudioImage | null = null;
  private mesh: NormalPoint[] | null = null;
  private revision = 0;
  private active: number | null = null;
  private resultValue: PreviewResult | null = null;
  private featureValue: FeatureId = "W59";
  private styleValue = featureById("W59").choices[0].value;
  private amountValue = 0.35;
  private angleValue = 0;
  private adultValue = false;
  private anatomyValue: { right: Anatomy; left: Anatomy } = { right: "open", left: "open" };
  private controlsValue: Record<string, number | string | boolean> = {};
  observations: Observations | null = null;
  synthetic = false;

  get hasPhoto(): boolean { return this.source !== null; }
  get hasMesh(): boolean { return this.mesh !== null; }
  get feature(): FeatureId { return this.featureValue; }
  get style(): string { return this.styleValue; }
  get amount(): number { return this.amountValue; }
  get angle(): number { return this.angleValue; }
  get adultConfirmed(): boolean { return this.adultValue; }
  get anatomy(): { right: Anatomy; left: Anatomy } { return { ...this.anatomyValue }; }
  get running(): boolean { return this.active !== null; }
  get version(): number { return this.revision; }
  get image(): StudioImage | null { return this.source ? cloneImage(this.source) : null; }
  get landmarks(): NormalPoint[] | null { return this.mesh?.map(point => [...point]) ?? null; }
  get result(): PreviewResult | null {
    return this.resultValue ? { ...this.resultValue, pixels: this.resultValue.pixels.slice(),
      warnings: [...this.resultValue.warnings], metrics: structuredClone(this.resultValue.metrics) } : null;
  }

  load(image: StudioImage, synthetic = false): void {
    const checked = cloneImage(image);
    this.source = checked; this.mesh = null; this.synthetic = synthetic;
    this.observations = new Observations(image.width, image.height);
    this.adultValue = false; this.controlsValue = {}; this.anatomyValue = { right: "open", left: "open" };
    this.invalidate();
  }

  clear(): void {
    this.source = null; this.mesh = null; this.observations = null;
    this.adultValue = false; this.synthetic = false; this.controlsValue = {};
    this.invalidate();
  }

  setMesh(mesh: unknown): void {
    if (!this.source) throw new RangeError("Open a photo before checking face points.");
    this.mesh = validateLandmarks(mesh); this.invalidate();
  }

  importEvidence(data: EvidenceInput): void {
    if (!this.source || data.width !== this.source.width || data.height !== this.source.height) throw new RangeError("Open the matching photo first.");
    const mesh = validateLandmarks(data.landmarks);
    const observations = new Observations(this.source.width, this.source.height);
    if (data.hair_mask) observations.setHair(data.hair_mask);
    if (data.observed_lashes) observations.setTraces(data.observed_lashes);
    const anatomy = data.anatomy ? validateAnatomy(data.anatomy) : this.anatomyValue;
    this.mesh = mesh; this.observations = observations; this.anatomyValue = anatomy;
    this.invalidate();
  }

  select(id: string): void {
    const item = featureById(id);
    this.featureValue = item.id; this.styleValue = item.choices[0]?.value ?? "";
    this.controlsValue = {}; this.angleValue = 0;
    this.invalidate();
  }

  setStyle(style: string): void {
    const choices = featureById(this.featureValue).choices;
    if (!choices.some(choice => choice.value === style)) throw new RangeError("That style is not available for this feature.");
    this.styleValue = style; this.invalidate();
  }

  setAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount < 0 || amount > 1) throw new RangeError("Amount must be in 0..1.");
    this.amountValue = amount; this.invalidate();
  }

  setAngle(angle: number): void {
    if (!Number.isFinite(angle) || angle < -80 || angle > 80) throw new RangeError("Light angle must be in -80..80 degrees.");
    this.angleValue = angle; this.invalidate();
  }

  confirmAdult(confirmed: boolean): void {
    if (typeof confirmed !== "boolean") throw new RangeError("Adult confirmation must be an explicit choice.");
    this.adultValue = confirmed; this.invalidate();
  }

  setAnatomy(side: "right" | "left", value: Anatomy): void {
    if (side !== "right" && side !== "left") throw new RangeError("Unknown eye side.");
    this.anatomyValue = validateAnatomy({ ...this.anatomyValue, [side]: value }); this.invalidate();
  }

  setControl(key: string, value: number | string | boolean): void {
    if (!/^[a-z][a-zA-Z_]{0,39}$/.test(key) || ["constructor", "prototype"].includes(key)) throw new RangeError("Invalid control name.");
    if (typeof value === "number" && !Number.isFinite(value)) throw new RangeError("Control values must be finite.");
    if (typeof value === "string" && value.length > 80) throw new RangeError("Control text is too long.");
    this.controlsValue = { ...this.controlsValue, [key]: value }; this.invalidate();
  }

  invalidate(): void {
    this.revision++; this.active = null; this.resultValue = null;
  }

  reasons(): string[] {
    return unavailableReasons(this.featureValue, { photo: this.hasPhoto, mesh: this.hasMesh,
      hair: this.observations?.hairDeclared ?? false, traces: this.observations?.count ?? 0, adultConfirmed: this.adultValue });
  }

  job(): PreviewJob {
    const reasons = this.reasons();
    if (reasons.length || !this.source) throw new RangeError(reasons.join(" ") || "Open a photo first.");
    const id = ++this.revision;
    this.active = id;
    return { id, image: cloneImage(this.source), landmarks: this.landmarks, feature: this.featureValue,
      amount: this.amountValue, style: this.styleValue, angle: this.angleValue, adultConfirmed: this.adultValue,
      anatomy: this.anatomy, hairMask: this.observations?.hairDeclared ? this.observations.mask : null,
      lashes: this.observations?.traces ?? [], controls: { ...this.controlsValue } };
  }

  complete(id: number, result: PreviewResult): boolean {
    if (this.active !== id || this.revision !== id || !this.source) return false;
    if (!(result.pixels instanceof Uint8ClampedArray) || result.pixels.length !== this.source.data.length
        || !Number.isFinite(result.elapsedMs) || result.elapsedMs < 0 || result.elapsedMs > 60_000
        || typeof result.label !== "string" || !/simulation|guide|hypothetical/i.test(result.label)) {
      this.active = null;
      throw new RangeError("The preview result did not satisfy the image and label contract.");
    }
    for (let i = 3; i < result.pixels.length; i += 4) {
      if (result.pixels[i] !== this.source.data[i]) { this.active = null; throw new RangeError("The preview changed photo transparency."); }
    }
    this.resultValue = { ...result, pixels: result.pixels.slice(), warnings: [...result.warnings], metrics: structuredClone(result.metrics) };
    this.active = null; return true;
  }

  failed(id: number): boolean {
    if (id !== this.active) return false;
    this.active = null; return true;
  }
}
