/** Revision-safe, cancellable photo sessions for the BELJOUR Quality Generator.
 * `QualitySession` is the r36e fixed-frame HD 1080 path, kept for older
 * internal clients. `QualityTierSession` is the aspect-preserving HD 1080 / 4K
 * path the lab uses: denoise, resize, source texture and identity lock, with
 * cancellable releases, paired diagnostics and local device timings. Given a
 * verified local model session (r38e), it renders through the reviewed model
 * chain instead and refuses, never falls back, if that chain cannot run; the
 * caller owns and disposes the model session. Hair matting is a diagnostic only.
 * One local photo at a time. The face selection must be confirmed (or the user
 * declares there is no person) before anything renders. Previews (long edge at
 * most 640) reuse one prepared reference and keep the last five slider levels,
 * so dragging does not re-resize the photo. A release renders the full tier
 * frame; a result that finishes after the photo, selection or job changed is
 * refused. Export accepts only the current release. Dispose wipes the photo
 * bytes. Nothing is uploaded or stored. Author: John Khan.
 */
import type { CanvasEncoder } from "../save/export.js";
import type { ColourExport, ColourExportSettings, RgbaRaster } from "../engines/upscale/colour-export.js";
import {
  defaultResizer, prepareReference, renderFromReference,
  type QualityLevels, type QualityReference, type QualityRender, type Resizer,
} from "../engines/upscale/quality-generator.js";
import { exportQualityRender } from "../engines/upscale/quality-export.js";
import { planAspectQuality, previewOf, type AspectPlan } from "../engines/upscale/quality-aspect.js";
import { budgetReport, timed, type BudgetReport } from "../engines/upscale/quality-budget.js";
import { exportTierRelease, type TierExport } from "../engines/upscale/quality-export-tier.js";
import { pairedDiagnostic } from "../engines/upscale/quality-paired.js";
import {
  classicalPaired, describeEngine, exportModelTierRelease, pairedModelDiagnostic, runModelQualityPipeline,
  type AnyTierResult, type EngineStatus, type ModelTierResult, type ProcessedPairedReport,
} from "../engines/upscale/quality-model-chain.js";
import type { LocalVerifiedModelSession } from "../engines/upscale/quality-model-loader.js";
import { hairMatteDiagnostic, type HairSelection, type MatteDiagnostic } from "../engines/upscale/quality-model-matte.js";
import { runQualityPipeline, type TierLevels, type TierResult } from "../engines/upscale/quality-pipeline.js";
import { planFixedTier, scaledPlan, type QualityTierName, type TierPlan } from "../engines/upscale/quality-tier.js";
import type { FaceSelection } from "../engines/upscale/safe.js";
import { DEFAULT_LEVEL, DEFAULT_LOCK_LEVEL, validateLevel } from "./strength.js";

export const PREVIEW_EDGE = 640;
export const PREVIEW_CACHE = 5;

export class StaleQualityJob extends Error {
  constructor() {
    super("The photo or face selection changed; this result was discarded.");
    this.name = "StaleQualityJob";
  }
}

export interface QualitySessionOptions {
  readonly resizer?: Resizer;
  readonly tier?: QualityTierName;
}

export class QualitySession {
  private source: RgbaRaster | null = null;
  private digest: string | null = null;
  private selection: FaceSelection | null = null;
  private revision = 0;
  private previewReference: { key: number; value: Promise<QualityReference> } | null = null;
  private readonly previews = new Map<string, QualityRender>();
  private latestRelease: { render: QualityRender; revision: number } | null = null;
  private releaseJob = 0;
  private levels: QualityLevels = { detailLevel: DEFAULT_LEVEL, lockLevel: DEFAULT_LOCK_LEVEL };
  private readonly resizer: Resizer;
  private readonly tier: QualityTierName;
  /** How many times a preview reference was prepared (for reuse checks). */
  referenceBuilds = 0;

  constructor(options: QualitySessionOptions = {}) {
    this.resizer = options.resizer ?? defaultResizer();
    this.tier = options.tier ?? "hd1080";
  }

  get current(): { digest: string | null; revision: number; ready: boolean; levels: QualityLevels } {
    return { digest: this.digest, revision: this.revision, ready: this.selection !== null, levels: { ...this.levels } };
  }

  /** Copy the decoded photo in; any previous photo is wiped. */
  open(digest: string, image: RgbaRaster): TierPlan {
    if (typeof digest !== "string" || !/^[0-9a-f]{64}$/.test(digest)) throw new RangeError("Invalid photo digest");
    const plan = planFixedTier(image.width, image.height, this.tier);
    if (image.data.length !== image.width * image.height * 4) throw new RangeError("Quality Generator needs an RGBA image");
    this.wipe();
    this.source = { width: image.width, height: image.height, data: new Uint8ClampedArray(image.data) };
    this.digest = digest;
    return plan;
  }

  /** A face selection the user confirmed, one coverage value per photo pixel. */
  markFace(mask: Uint8Array): void {
    this.setSelection({ mask: new Uint8Array(mask), confirmed: true });
  }

  /** The user states there is no person in the photo. */
  declareNoPerson(): void {
    const source = this.require();
    this.setSelection({ mask: new Uint8Array(source.width * source.height), confirmed: true, noFace: true });
  }

  clearSelection(): void {
    this.selection = null;
    this.invalidate();
  }

  setLevels(detailLevel: number, lockLevel: number = this.levels.lockLevel): QualityLevels {
    this.levels = { detailLevel: validateLevel(detailLevel), lockLevel: validateLevel(lockLevel) };
    return { ...this.levels };
  }

  plan(): TierPlan {
    const source = this.require();
    return planFixedTier(source.width, source.height, this.tier);
  }

  async preview(): Promise<QualityRender> {
    const { source, selection, revision } = this.ready();
    const key = `${this.levels.detailLevel}:${this.levels.lockLevel}`;
    const cached = this.previews.get(key);
    if (cached) return cached;
    if (!this.previewReference || this.previewReference.key !== revision) {
      this.referenceBuilds += 1;
      const plan = scaledPlan(this.plan(), PREVIEW_EDGE);
      this.previewReference = { key: revision, value: prepareReference(source, selection, plan, this.resizer) };
    }
    const reference = await this.previewReference.value;
    if (revision !== this.revision) throw new StaleQualityJob();
    const render = renderFromReference(reference, this.levels, false);
    this.previews.set(key, render);
    while (this.previews.size > PREVIEW_CACHE) this.previews.delete(this.previews.keys().next().value!);
    return render;
  }

  /** Full tier render; superseded by a later release call or any photo/selection change. */
  async release(): Promise<QualityRender> {
    const { source, selection, revision } = this.ready();
    const job = ++this.releaseJob;
    const levels = { ...this.levels };
    const reference = await prepareReference(source, selection, this.plan(), this.resizer);
    try {
      if (revision !== this.revision || job !== this.releaseJob) throw new StaleQualityJob();
      const render = renderFromReference(reference, levels, true);
      this.latestRelease = { render, revision };
      return render;
    } finally {
      reference.content.fill(0);
    }
  }

  async export(render: QualityRender, name: string, settings: ColourExportSettings = {},
    encoder?: CanvasEncoder): Promise<ColourExport> {
    if (!this.latestRelease || this.latestRelease.render !== render || this.latestRelease.revision !== this.revision) {
      throw new RangeError("Only the current release of this photo can be exported");
    }
    return exportQualityRender(render, name, settings, encoder);
  }

  dispose(): void {
    this.wipe();
  }

  private setSelection(selection: FaceSelection): void {
    const source = this.require();
    if (selection.mask.length !== source.width * source.height) throw new RangeError("Face selection size differs");
    const marked = selection.mask.some(value => value !== 0);
    if (!selection.noFace && !marked) throw new RangeError("Mark the face, or state that there is no person");
    this.selection = selection;
    this.invalidate();
  }

  private require(): RgbaRaster {
    if (!this.source) throw new RangeError("Open a photo first");
    return this.source;
  }

  private ready(): { source: RgbaRaster; selection: FaceSelection; revision: number } {
    const source = this.require();
    if (!this.selection) throw new RangeError("Confirm the face area, or state that there is no person");
    return { source, selection: this.selection, revision: this.revision };
  }

  private invalidate(): void {
    this.revision += 1;
    // A preview awaiting this reference sees the new revision and is refused first.
    this.previewReference?.value.then(reference => reference.content.fill(0), () => undefined);
    this.previewReference = null;
    for (const render of this.previews.values()) render.image.data.fill(0);
    this.previews.clear();
    if (this.latestRelease) this.latestRelease.render.image.data.fill(0);
    this.latestRelease = null;
    this.releaseJob += 1;
  }

  private wipe(): void {
    this.source?.data.fill(0);
    this.source = null;
    this.digest = null;
    this.selection = null;
    this.invalidate();
  }
}

export interface TierSessionOptions {
  readonly resizer?: Resizer;
  readonly clock?: () => number;
  /** A session from `loadReviewedLocalModels`; omit to keep the classical engine. */
  readonly models?: LocalVerifiedModelSession | null;
}

/** Aspect-preserving HD 1080 / 4K session (r37e). */
export class QualityTierSession {
  private photo: RgbaRaster | null = null;
  private face: FaceSelection | null = null;
  private generation = 0;
  private tierName: QualityTierName = "hd1080";
  private levelSet: TierLevels = { detailLevel: DEFAULT_LEVEL, denoiseLevel: 2, lockLevel: DEFAULT_LOCK_LEVEL };
  private readonly cache = new Map<string, AnyTierResult>();
  private current: { result: AnyTierResult; generation: number } | null = null;
  private job: AbortController | null = null;
  private timings: { previewMs?: number; renderMs?: number; encodeMs?: number } = {};
  private readonly resizer: Resizer;
  private readonly clock: (() => number) | undefined;
  private readonly models: LocalVerifiedModelSession | null;

  constructor(options: TierSessionOptions = {}) {
    this.resizer = options.resizer ?? defaultResizer();
    this.clock = options.clock;
    this.models = options.models ?? null;
  }

  /** The engine this session renders with: the reviewed model chain or the classical stages. */
  get engine(): EngineStatus {
    return describeEngine(this.models);
  }

  get state(): { revision: number; tier: QualityTierName; ready: boolean; levels: TierLevels } {
    return { revision: this.generation, tier: this.tierName, ready: this.face !== null, levels: { ...this.levelSet } };
  }

  open(digest: string, image: RgbaRaster): AspectPlan {
    if (typeof digest !== "string" || !/^[0-9a-f]{64}$/.test(digest)) throw new RangeError("Invalid photo digest");
    if (image?.data?.length !== image.width * image.height * 4) throw new RangeError("Quality Generator needs an RGBA image");
    const plan = planAspectQuality(image.width, image.height, this.tierName);
    this.close();
    this.photo = { width: image.width, height: image.height, data: new Uint8ClampedArray(image.data) };
    return plan;
  }

  setTier(tier: QualityTierName): AspectPlan {
    const photo = this.need();
    const plan = planAspectQuality(photo.width, photo.height, tier);
    this.tierName = tier;
    this.reset();
    return plan;
  }

  markFace(mask: Uint8Array): void {
    const photo = this.need();
    if (mask.length !== photo.width * photo.height || !mask.some(value => value !== 0)) {
      throw new RangeError("Mark the face, or state that there is no person");
    }
    this.face = { mask: new Uint8Array(mask), confirmed: true };
    this.reset();
  }

  declareNoPerson(): void {
    const photo = this.need();
    this.face = { mask: new Uint8Array(photo.width * photo.height), confirmed: true, noFace: true };
    this.reset();
  }

  setLevels(levels: Partial<TierLevels>): TierLevels {
    const next = { ...this.levelSet, ...levels };
    this.levelSet = {
      detailLevel: validateLevel(next.detailLevel), denoiseLevel: validateLevel(next.denoiseLevel),
      lockLevel: validateLevel(next.lockLevel),
    };
    return { ...this.levelSet };
  }

  plan(): AspectPlan {
    const photo = this.need();
    return planAspectQuality(photo.width, photo.height, this.tierName);
  }

  async preview(): Promise<AnyTierResult> {
    const { photo, face, generation } = this.prepared();
    const key = `${this.tierName}:${this.levelSet.detailLevel}:${this.levelSet.denoiseLevel}:${this.levelSet.lockLevel}`;
    const hit = this.cache.get(key);
    if (hit) return hit;
    const { value, ms } = await timed(() => this.render(photo, face, previewOf(this.plan(), PREVIEW_EDGE),
      "preview"), this.clock);
    if (generation !== this.generation) {
      value.image.data.fill(0);
      throw new StaleQualityJob();
    }
    this.timings.previewMs = ms;
    this.cache.set(key, value);
    while (this.cache.size > PREVIEW_CACHE) {
      const oldest = this.cache.keys().next().value!;
      this.cache.get(oldest)?.image.data.fill(0);
      this.cache.delete(oldest);
    }
    return value;
  }

  /** Full tier render. A newer release, photo, tier or selection cancels this one. */
  async release(): Promise<AnyTierResult> {
    const { photo, face, generation } = this.prepared();
    this.job?.abort();
    const job = new AbortController();
    this.job = job;
    const { value, ms } = await timed(() => this.render(photo, face, this.plan(), "release", job.signal),
      this.clock);
    if (generation !== this.generation || job.signal.aborted) {
      value.image.data.fill(0);
      throw new StaleQualityJob();
    }
    this.timings.renderMs = ms;
    this.current?.result.image.data.fill(0);
    this.current = { result: value, generation };
    return value;
  }

  cancel(): void {
    this.job?.abort();
  }

  async export(result: AnyTierResult, settings: ColourExportSettings = {},
    encoder?: CanvasEncoder): Promise<TierExport> {
    if (!this.current || this.current.result !== result || this.current.generation !== this.generation) {
      throw new RangeError("Only the current release of this photo can be exported");
    }
    const models = this.models;
    const { value, ms } = await timed(() => models
      ? exportModelTierRelease(result as ModelTierResult, models.verifiedModels, settings, encoder)
      : exportTierRelease(result as TierResult, settings, encoder), this.clock);
    this.timings.encodeMs = ms;
    return value;
  }

  async diagnostics(): Promise<ProcessedPairedReport> {
    if (this.models) return pairedModelDiagnostic(this.tierName, this.models, this.resizer, this.levelSet);
    return classicalPaired(await pairedDiagnostic(this.tierName, this.resizer, this.levelSet));
  }

  /** Optional matte check against a hair mask the user drew and confirmed; never changes a render. */
  hairDiagnostic(hair: HairSelection): Promise<MatteDiagnostic> {
    return hairMatteDiagnostic(this.need(), hair, this.models);
  }

  budget(): BudgetReport {
    const photo = this.need();
    return budgetReport({ sourcePixels: photo.width * photo.height, ...this.timings });
  }

  close(): void {
    this.photo?.data.fill(0);
    this.photo = null;
    this.face = null;
    this.timings = {};
    this.reset();
  }

  private render(photo: RgbaRaster, face: FaceSelection, plan: AspectPlan, phase: "preview" | "release",
    signal?: AbortSignal): Promise<AnyTierResult> {
    const options = { resizer: this.resizer, phase, signal };
    return this.models
      ? runModelQualityPipeline(photo, face, plan, this.levelSet, this.models, options)
      : runQualityPipeline(photo, face, plan, this.levelSet, options);
  }

  private need(): RgbaRaster {
    if (!this.photo) throw new RangeError("Open a photo first");
    return this.photo;
  }

  private prepared(): { photo: RgbaRaster; face: FaceSelection; generation: number } {
    const photo = this.need();
    if (!this.face) throw new RangeError("Confirm the face area, or state that there is no person");
    return { photo, face: this.face, generation: this.generation };
  }

  private reset(): void {
    this.generation += 1;
    this.job?.abort();
    this.job = null;
    for (const result of this.cache.values()) result.image.data.fill(0);
    this.cache.clear();
    this.current?.result.image.data.fill(0);
    this.current = null;
  }
}
