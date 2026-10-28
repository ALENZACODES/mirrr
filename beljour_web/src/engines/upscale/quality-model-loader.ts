/** Disposable local session for the optional SwinIR pre-clean, Real-ESRGAN upscale and
 * diagnostic MODNet matte stages. Every candidate's rights record and exact bytes are
 * verified before any runtime loader is called. Loaders receive the private staged copy
 * that was hashed, and every copy is wiped once loading ends; a failed or cancelled partial load releases what was
 * already created; a disposed session refuses new work. The runtime itself is
 * injected by the caller: this module never fetches, uploads or persists anything.
 * Author: John Khan.
 */
import { ModelGateError } from "../../vision/model-registry.js";
import {
  type ModelRightsRecord, type QualityModelRole, type QualityModelStage,
  QUALITY_MODEL_ROLES, checkModelRights, verifyModelBytes,
} from "./quality-model-rights.js";

export interface RgbaRaster {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
}

/** Returns RGBA pixels of the same size as the source. */
export type PrecleanEngine = (source: RgbaRaster, signal?: AbortSignal) => Promise<Uint8ClampedArray>;
/** Returns RGBA pixels of the requested output size. */
export type UpscaleEngine = (
  source: RgbaRaster, width: number, height: number, signal?: AbortSignal,
) => Promise<Uint8ClampedArray>;
/** Returns one alpha value from 0 to 1 per source pixel. Diagnostic only. */
export type MatteEngine = (source: RgbaRaster, signal?: AbortSignal) => Promise<Float32Array>;

export interface LoadedModelStage<E> {
  readonly engine: E;
  dispose(): void | Promise<void>;
}

/** What a runtime and an audit may know about an admitted model: identity, not bytes. */
export interface VerifiedModel {
  readonly stage: QualityModelStage;
  readonly role: QualityModelRole;
  readonly modelId: string;
  readonly licence: string;
  readonly upstreamCommit: string;
  readonly weightsSha256: string;
  readonly weightsBytes: number;
}

export interface LocalModelSessionFactory {
  loadSwinIR(model: VerifiedModel, bytes: Uint8Array<ArrayBuffer>): Promise<LoadedModelStage<PrecleanEngine>>;
  loadRealESRGAN(model: VerifiedModel, bytes: Uint8Array<ArrayBuffer>): Promise<LoadedModelStage<UpscaleEngine>>;
  loadMODNet?(model: VerifiedModel, bytes: Uint8Array<ArrayBuffer>): Promise<LoadedModelStage<MatteEngine>>;
}

export interface ReviewedModelBytes {
  readonly record: ModelRightsRecord;
  readonly bytes: Uint8Array;
}

export interface ReviewedModelCandidates {
  readonly preclean: ReviewedModelBytes;
  readonly upscale: ReviewedModelBytes;
  readonly matte?: ReviewedModelBytes;
}

export interface LocalVerifiedModelSession {
  readonly verifiedModels: readonly VerifiedModel[];
  readonly preclean: PrecleanEngine;
  readonly upscale: UpscaleEngine;
  readonly matte: MatteEngine | null;
  readonly disposed: boolean;
  dispose(): Promise<void>;
}

/** ASSUMED output ceiling per side, matching the posture and photo dimension limits. */
const MAX_SIDE = 16384;

function cancelled(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Model loading cancelled", "AbortError");
}

function checkedSide(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > MAX_SIDE) {
    throw new RangeError("Model stage size is outside the supported range");
  }
  return value;
}

function checkedRaster(source: RgbaRaster): RgbaRaster {
  if (!source || !(source.data instanceof Uint8ClampedArray) ||
      source.data.length !== checkedSide(source.width) * checkedSide(source.height) * 4) {
    throw new RangeError("Model stage needs an RGBA raster");
  }
  return source;
}

function stageFailure(stage: QualityModelStage): ModelGateError {
  return new ModelGateError(`${stage} model returned an invalid result; no classical substitute was used`);
}

interface StagedModel {
  readonly model: VerifiedModel;
  readonly bytes: Uint8Array<ArrayBuffer>;
}

/** Copy first, then verify the copy: the bytes a runtime receives are the bytes checked. */
async function admitted(slot: ReviewedModelBytes, role: QualityModelRole): Promise<StagedModel> {
  if (!slot || typeof slot !== "object") throw new ModelGateError(`missing ${role} model candidate`);
  const record = checkModelRights(slot.record, role);
  if (!(slot.bytes instanceof Uint8Array) || slot.bytes.byteLength !== record.weightsBytes) {
    throw new ModelGateError(`model ${record.modelId}: weight size mismatch`);
  }
  const bytes = new Uint8Array(new ArrayBuffer(slot.bytes.byteLength));
  bytes.set(slot.bytes);
  try {
    await verifyModelBytes(record, bytes);
  } catch (error) {
    bytes.fill(0);
    throw error;
  }
  const model: VerifiedModel = Object.freeze({
    stage: QUALITY_MODEL_ROLES[role].stage, role, modelId: record.modelId,
    licence: record.licence, upstreamCommit: record.upstreamCommit,
    weightsSha256: record.weightsSha256, weightsBytes: record.weightsBytes,
  });
  return { model, bytes };
}

async function created<E>(
  load: (model: VerifiedModel, bytes: Uint8Array<ArrayBuffer>) => Promise<LoadedModelStage<E>>,
  item: StagedModel,
): Promise<LoadedModelStage<E>> {
  const stage = await load(item.model, item.bytes);
  if (!stage || typeof stage.engine !== "function" || typeof stage.dispose !== "function") {
    throw new ModelGateError(`${item.model.stage} runtime did not return a disposable engine`);
  }
  return stage;
}

async function release(stages: readonly LoadedModelStage<unknown>[]): Promise<void> {
  let first: unknown = null;
  for (const stage of [...stages].reverse()) {
    try {
      await stage.dispose();
    } catch (error) {
      first ??= error;
    }
  }
  if (first !== null) throw first;
}

class VerifiedSession implements LocalVerifiedModelSession {
  readonly verifiedModels: readonly VerifiedModel[];
  readonly preclean: PrecleanEngine;
  readonly upscale: UpscaleEngine;
  readonly matte: MatteEngine | null;
  private closed = false;

  constructor(
    models: readonly VerifiedModel[],
    private readonly stages: readonly LoadedModelStage<unknown>[],
    preclean: LoadedModelStage<PrecleanEngine>,
    upscale: LoadedModelStage<UpscaleEngine>,
    matte: LoadedModelStage<MatteEngine> | null,
  ) {
    this.verifiedModels = Object.freeze([...models]);
    this.preclean = async (source, signal) => {
      const raster = this.ready(source, signal);
      const output = await preclean.engine(raster, signal);
      if (!(output instanceof Uint8ClampedArray) || output.length !== raster.data.length) {
        throw stageFailure("preclean");
      }
      return output;
    };
    this.upscale = async (source, width, height, signal) => {
      const raster = this.ready(source, signal);
      const size = checkedSide(width) * checkedSide(height) * 4;
      const output = await upscale.engine(raster, width, height, signal);
      if (!(output instanceof Uint8ClampedArray) || output.length !== size) throw stageFailure("upscale");
      return output;
    };
    this.matte = matte ? async (source, signal) => {
      const raster = this.ready(source, signal);
      const alpha = await matte.engine(raster, signal);
      if (!(alpha instanceof Float32Array) || alpha.length !== raster.width * raster.height ||
          alpha.some(value => !(value >= 0 && value <= 1))) {
        throw stageFailure("matte");
      }
      return alpha;
    } : null;
  }

  get disposed(): boolean {
    return this.closed;
  }

  async dispose(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    await release(this.stages);
  }

  private ready(source: RgbaRaster, signal?: AbortSignal): RgbaRaster {
    if (this.closed) throw new ModelGateError("Model session has been disposed");
    signal?.throwIfAborted();
    return checkedRaster(source);
  }
}

/** Admit every candidate first, then create runtimes in pipeline order. */
export async function loadReviewedLocalModels(
  candidates: ReviewedModelCandidates,
  factory: LocalModelSessionFactory,
  signal?: AbortSignal,
): Promise<LocalVerifiedModelSession> {
  if (!candidates || !factory || typeof factory.loadSwinIR !== "function" ||
      typeof factory.loadRealESRGAN !== "function") {
    throw new ModelGateError("A local model runtime is not available");
  }
  if (candidates.matte && typeof factory.loadMODNet !== "function") {
    throw new ModelGateError("The local runtime cannot load the matte model");
  }
  cancelled(signal);
  const verified: StagedModel[] = [];
  const stages: LoadedModelStage<unknown>[] = [];
  try {
    verified.push(await admitted(candidates.preclean, "swinir_preclean"));
    verified.push(await admitted(candidates.upscale, "realesrgan_upscale"));
    if (candidates.matte) verified.push(await admitted(candidates.matte, "modnet_matte"));
    if (new Set(verified.map(item => item.model.weightsSha256)).size !== verified.length) {
      throw new ModelGateError("Each model stage needs its own reviewed weights");
    }
    cancelled(signal);
    const preclean = await created(factory.loadSwinIR.bind(factory), verified[0]!);
    stages.push(preclean);
    cancelled(signal);
    const upscale = await created(factory.loadRealESRGAN.bind(factory), verified[1]!);
    stages.push(upscale);
    cancelled(signal);
    let matte: LoadedModelStage<MatteEngine> | null = null;
    if (verified[2] && factory.loadMODNet) {
      matte = await created(factory.loadMODNet.bind(factory), verified[2]);
      stages.push(matte);
      cancelled(signal);
    }
    return new VerifiedSession(verified.map(item => item.model), stages, preclean, upscale, matte);
  } catch (error) {
    await release(stages).catch(() => undefined);
    throw error;
  } finally {
    for (const item of verified) item.bytes.fill(0);
  }
}
