/** Encrypted-memory-only model admission before licensed inference. Author: John Khan. */

import { loadReviewedLocalModels } from "./quality-model-loader.js";
import type { LocalModelSessionFactory } from "./quality-model-loader.js";
import type { LocalVerifiedModelSession } from "./quality-model-loader.js";
import { withProtectedArtifact } from "./protected-artifact.js";
import type { ProtectedArtifact } from "./protected-artifact.js";
import type { ModelRightsRecord } from "./quality-model-rights.js";

export interface SealedModelFile {
  readonly record: ModelRightsRecord;
  readonly sealed: ProtectedArtifact;
}

export interface SealedModelBundle {
  readonly preclean: SealedModelFile;
  readonly upscale: SealedModelFile;
  readonly matte?: SealedModelFile;
}

/** Reuse the existing per-artifact rights gate after memory-only authentication. */
export async function loadProtectedQualityModels(
  bundle: SealedModelBundle,
  key: CryptoKey,
  factory: LocalModelSessionFactory,
  signal?: AbortSignal,
): Promise<LocalVerifiedModelSession> {
  const candidates = [bundle.preclean, bundle.upscale, bundle.matte].filter(
    (value): value is SealedModelFile => value !== undefined,
  );
  if (!candidates.length || !factory) {
    throw new RangeError("Protected model bundle is incomplete");
  }
  const unlocked: Uint8Array<ArrayBuffer>[] = [];
  try {
    for (const candidate of candidates) {
      if (signal?.aborted) throw new DOMException("Model loading cancelled", "AbortError");
      const bytes = await withProtectedArtifact(
        candidate.sealed, "weights", candidate.record.weightsSha256,
        candidate.sealed.keyId, key,
        async data => new Uint8Array(data),
      );
      unlocked.push(bytes);
    }
    return await loadReviewedLocalModels({
      preclean: { record: bundle.preclean.record, bytes: unlocked[0]! },
      upscale: { record: bundle.upscale.record, bytes: unlocked[1]! },
      ...(bundle.matte ? { matte: { record: bundle.matte.record, bytes: unlocked[2]! } } : {}),
    }, factory, signal);
  } finally {
    for (const bytes of unlocked) bytes.fill(0);
  }
}
