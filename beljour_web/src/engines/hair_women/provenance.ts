/** Local-only R17B hair evidence provenance. Author: John Khan. */
export type ObservationSource = "manual" | "checked_mask" | "checked_landmarks" | "local_measurement" | "user_entry";

export interface HairObservation {
  name: string;
  source: ObservationSource;
  value: number | string | boolean;
  unit?: string;
  confidence?: number;
}

export interface HairEvidence {
  feature: string;
  imageSha256: string;
  maskSha256: string;
  observations: readonly HairObservation[];
  engineRevision: string;
  simulation: true;
}

export interface HairEvidenceSummary {
  schema: "beljour.r17b.hair.provenance.v1";
  feature: string;
  observationCount: number;
  sources: ObservationSource[];
  minimumConfidence: number | null;
  simulation: true;
  containsPhoto: false;
  containsMask: false;
  networkRequired: false;
}

const HEX64 = /^[0-9a-f]{64}$/i;

export function validateHairEvidence(value: HairEvidence): void {
  if (!/^W\d+$/.test(value.feature)) throw new Error("feature must use a W row id");
  if (!HEX64.test(value.imageSha256)) throw new Error("image digest must be sha256 hex");
  if (!HEX64.test(value.maskSha256)) throw new Error("mask digest must be sha256 hex");
  if (!value.engineRevision || value.engineRevision.length > 80) throw new Error("engine revision is required");
  const names = new Set<string>();
  for (const observation of value.observations) {
    if (!observation.name || observation.name.length > 80) throw new Error("invalid observation name");
    if (names.has(observation.name)) throw new Error("duplicate observation name");
    names.add(observation.name);
    if (observation.confidence !== undefined && (observation.confidence < 0 || observation.confidence > 1)) {
      throw new Error("confidence must be within 0..1");
    }
    if ((observation.unit ?? "").length > 24) throw new Error("unit is too long");
  }
}

export function hairEvidenceSummary(value: HairEvidence): HairEvidenceSummary {
  validateHairEvidence(value);
  const sources = [...new Set(value.observations.map((item) => item.source))].sort();
  const confidences = value.observations.flatMap((item) => item.confidence === undefined ? [] : [item.confidence]);
  return {
    schema: "beljour.r17b.hair.provenance.v1",
    feature: value.feature,
    observationCount: value.observations.length,
    sources,
    minimumConfidence: confidences.length ? Math.min(...confidences) : null,
    simulation: true,
    containsPhoto: false,
    containsMask: false,
    networkRequired: false,
  };
}

export function hairReplayCompatible(first: HairEvidence, second: HairEvidence): boolean {
  validateHairEvidence(first);
  validateHairEvidence(second);
  return JSON.stringify(first) === JSON.stringify(second);
}
