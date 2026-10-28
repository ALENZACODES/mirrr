/** Metadata-only audit of the local replay cassette. Author: John Khan. */
import { CASSETTE_CARDS, cassetteById, type CassetteId } from "./cassette-contract.js";
import type { CassetteSessionSnapshot } from "./cassette-session.js";

export interface CassetteAudit {
  readonly format: "beljour-cassette-audit/1";
  readonly listedIds: readonly CassetteId[];
  readonly observedIds: readonly CassetteId[];
  readonly providerScreensEnabled: boolean;
  readonly providerRequests: 0;
  readonly unitsSpent: 0;
  readonly photoUploaded: false;
  readonly realFaceTested: false;
  readonly productionProviderVerified: false;
  readonly releaseGatePassed: false;
}

export function cassetteAudit(snapshot: CassetteSessionSnapshot): CassetteAudit {
  const ids = snapshot.observed.filter((id) => cassetteById(id) !== null);
  return Object.freeze({
    format: "beljour-cassette-audit/1" as const,
    listedIds: Object.freeze(CASSETTE_CARDS.map((card) => card.id)),
    observedIds: Object.freeze(ids),
    providerScreensEnabled: snapshot.providerScreensEnabled,
    providerRequests: 0 as const,
    unitsSpent: 0 as const,
    photoUploaded: false as const,
    realFaceTested: false as const,
    productionProviderVerified: false as const,
    releaseGatePassed: false as const,
  });
}

export function serializeCassetteAudit(report: CassetteAudit): string {
  if (report.format !== "beljour-cassette-audit/1") throw new Error("Invalid audit format");
  if (report.providerRequests !== 0 || report.unitsSpent !== 0 || report.photoUploaded
    || report.realFaceTested || report.productionProviderVerified || report.releaseGatePassed) {
    throw new Error("An illustrative result cannot become independent release evidence");
  }
  if (report.listedIds.length !== CASSETTE_CARDS.length
    || report.listedIds.some((id, index) => id !== CASSETTE_CARDS[index].id)) {
    throw new Error("Catalogue identifiers do not match the local fixture");
  }
  const seen = new Set<CassetteId>();
  for (const id of report.observedIds) {
    if (!cassetteById(id) || seen.has(id)) throw new Error("Unknown or duplicate cache result");
    seen.add(id);
  }
  const serialized = JSON.stringify(report, null, 2);
  if (serialized.length > 2048) throw new Error("Audit exceeds metadata bound");
  return serialized;
}

/** Refuse arbitrary imported records, extra fields and forged pass declarations. */
export function parseCassetteAudit(source: unknown): CassetteAudit {
  if (typeof source !== "string" || source.length > 2048) throw new TypeError("Invalid audit file");
  const parsed: unknown = JSON.parse(source);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new TypeError("Invalid audit document");
  }
  const record = parsed as Record<string, unknown>;
  const expected = [
    "format", "listedIds", "observedIds", "providerScreensEnabled", "providerRequests",
    "unitsSpent", "photoUploaded", "realFaceTested", "productionProviderVerified", "releaseGatePassed",
  ];
  if (Object.keys(record).length !== expected.length
    || expected.some((key) => !Object.hasOwn(record, key))) {
    throw new Error("Unexpected audit fields");
  }
  if (!Array.isArray(record.observedIds) || !Array.isArray(record.listedIds)
    || typeof record.providerScreensEnabled !== "boolean") {
    throw new TypeError("Invalid audit status");
  }
  const audit = record as unknown as CassetteAudit;
  serializeCassetteAudit(audit);
  return audit;
}
